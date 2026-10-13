/**
 * 今日人格套餐 · 选品策略引擎
 *
 * 输入：人格档案（来自 H5 或 scripts/score.mjs）+ 麦当劳 MCP query-meals 的实时菜单
 * 输出：确定性的套餐方案（选了什么、为什么、还缺什么需要 Agent 用实时菜单补齐）
 *
 * 设计原则：
 *   1. 只使用菜单里真实存在的商品，绝不凭空编造菜品或价格。
 *   2. 规则完全由档案里的四维数值决定 —— 同一档案 + 同一菜单必然得到同一方案。
 *   3. 优惠券不在本层处理：本层只产出“无券方案”，券由用户在对话中显式授权后再算。
 */

const STAPLE_ALIASES = {
  巨无霸: ['巨无霸'],
  麦辣鸡腿汉堡: ['麦辣鸡腿汉堡', '麦辣鸡腿堡'],
  双层吉士汉堡: ['双层吉士汉堡', '双层吉士'],
  麦乐鸡: ['麦乐鸡', '麦乐鸡块', '鸡块'],
  板烧鸡腿堡: ['板烧鸡腿堡', '板烧鸡腿汉堡'],
  奥利奥麦旋风: ['奥利奥麦旋风', '麦旋风'],
  麦香鱼: ['麦香鱼'],
  香芋派: ['香芋派', '派'],
  那么大鸡排: ['那么大鸡排', '鸡排'],
  薯饼: ['薯饼'],
  吉士汉堡: ['吉士汉堡'],
  麦香鸡: ['麦香鸡'],
  麦辣鸡翅: ['麦辣鸡翅', '鸡翅'],
  薯条: ['薯条'],
  麦麦脆汁鸡: ['麦麦脆汁鸡', '脆汁鸡'],
  圆筒冰淇淋: ['圆筒冰淇淋', '圆筒', '冰淇淋'],
};

const DESSERT_HINTS = ['麦旋风', '冰淇淋', '圆筒', '派', '圣代', '新地'];
const SHARE_HINTS = ['分享', '家庭', '多人', '大份', '桶'];
const SOLO_HINTS = ['单点', '小份', '单人'];

function norm(value) {
  return String(value || '').replace(/\s+/g, '').toLowerCase();
}

function includesAny(text, keywords) {
  const t = norm(text);
  return keywords.some((k) => t.includes(norm(k)));
}

function priceOf(item) {
  const p = Number(item && (item.price ?? item.priceYuan ?? item.amount));
  return Number.isFinite(p) ? p : null;
}

/** 在菜单中定位主人格本命单品 */
export function findStaple(menu, product) {
  const aliases = STAPLE_ALIASES[product] || [product];
  for (const alias of aliases) {
    const hit = menu.find((item) => norm(item.name).includes(norm(alias)));
    if (hit) return hit;
  }
  return null;
}

/** 按关键词挑一件，排除已选中的商品 */
function pickByHints(menu, hints, excluded, filter) {
  const candidates = menu.filter((item) => {
    if (excluded.has(item.code || item.name)) return false;
    if (filter && !filter(item)) return false;
    return includesAny(item.name, hints) || includesAny(item.category, hints);
  });
  if (!candidates.length) return null;
  // 稳定排序：价格升序，同价按名称，保证同输入同输出
  candidates.sort((a, b) => {
    const pa = priceOf(a) ?? Number.POSITIVE_INFINITY;
    const pb = priceOf(b) ?? Number.POSITIVE_INFINITY;
    if (pa !== pb) return pa - pb;
    return String(a.name).localeCompare(String(b.name), 'zh-Hans-CN');
  });
  return candidates[0];
}

function pickLimitedFirst(menu, excluded) {
  return menu.find((item) => {
    if (excluded.has(item.code || item.name)) return false;
    return includesAny(item.name, ['限时', '新品', '限定']) || includesAny((item.tags || []).join(' '), ['限时', '新品', '限定']);
  }) || null;
}

/** 优先挑选包含本命单品的套餐，其次任何套餐组合 */
function pickCombo(menu, excluded, product) {
  const isCombo = (item) => includesAny(item.name, ['套餐', '三件套', '组合', '1+1']) || includesAny(item.category, ['套餐', '组合']);
  const aliases = STAPLE_ALIASES[product] || (product ? [product] : []);
  const withStaple = menu.find((item) => !excluded.has(item.code || item.name) && isCombo(item) && includesAny(item.name, aliases));
  if (withStaple) return withStaple;
  return menu.find((item) => !excluded.has(item.code || item.name) && isCombo(item)) || null;
}

/**
 * 归一化菜单输入：兼容 [item]、{items:[item]}、{data:[item]}、MCP 原始返回常见形态
 * @param {unknown} input
 * @returns {Array<{code:string, name:string, price:number|null, category:string, tags:string[]}>}
 */
export function normalizeMenu(input) {
  let list = [];
  if (Array.isArray(input)) list = input;
  else if (input && typeof input === 'object') {
    const candidate = input.items || input.meals || input.data || input.list || input.products;
    if (Array.isArray(candidate)) list = candidate;
    else if (Array.isArray(input.result)) list = input.result;
  }
  return list
    .filter((item) => item && (item.name || item.productName || item.mealName))
    .map((item) => ({
      code: item.code || item.mealCode || item.productCode || item.id || null,
      name: item.name || item.productName || item.mealName,
      price: item.price ?? item.priceYuan ?? item.amount ?? item.salePrice ?? null,
      category: item.category || item.categoryName || item.type || '',
      tags: Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? item.tags.split(/[,、]/) : []),
    }));
}

/**
 * 构建套餐方案
 * @param {object} profile PersonalityProfile
 * @param {Array<object>|object} menuInput 实时菜单（可为空，此时输出待补齐意图）
 * @param {{storeName?:string, diningMode?:string, budget?:number}} [context]
 */
export function buildMealPlan(profile, menuInput = [], context = {}) {
  const menu = normalizeMenu(menuInput);
  const brief = profile.mealBrief || {};
  const items = [];
  const excluded = new Set();
  const missing = [];

  const add = (item, reason) => {
    if (!item) return;
    const key = item.code || item.name;
    if (excluded.has(key)) return;
    excluded.add(key);
    items.push({
      code: item.code || null,
      name: item.name,
      price: priceOf(item),
      reason,
      source: 'mcp:query-meals',
    });
  };

  // 1) 主食 = 本命单品
  const staple = findStaple(menu, profile.product);
  if (staple) {
    add(staple, `本命单品：${profile.product}（${profile.mbti} ${profile.title}）`);
  } else {
    missing.push(`本命单品「${profile.product}」未在当前门店菜单中出现，请在无券方案里用同类在售主食替代并说明原因`);
  }

  // 2) 结构倾向：计划派优先套餐组合
  if (brief.structure >= 65) {
    const combo = pickCombo(menu, excluded, profile.product);
    if (combo) add(combo, `计划派 ${brief.structure}%：优先可直接下单的套餐组合，减少现场决策`);
  }

  // 3) 尝鲜倾向：限时新品优先
  if (brief.riskMode === 'newfirst' && brief.adventure >= 60) {
    const limited = pickLimitedFirst(menu, excluded);
    if (limited) add(limited, `尝鲜派 ${brief.adventure}%：限时/新品优先并入`);
    else missing.push('当前门店未见限时或新品标签，请用 query-meals 的 tags 字段复核后再决定是否跳过');
  }

  // 4) 社交倾向：分享装 或 单人份
  if (brief.shareMode === 'group') {
    const share = pickByHints(menu, SHARE_HINTS, excluded) || pickByHints(menu, ['薯条', '鸡块'], excluded);
    if (share) add(share, `热闹派 ${brief.social}%：配置可分享小食，方便同桌一起拿`);
    else missing.push('未匹配到可分享装，请按门店实际供应补一份适合共享的小食');
  } else if (brief.shareMode === 'pair') {
    const share = pickByHints(menu, ['薯条'], excluded);
    if (share) add(share, `社交能量居中：加一份两人可分的小食`);
  } else {
    const solo = pickByHints(menu, SOLO_HINTS, excluded);
    if (solo) add(solo, `独享派 ${100 - brief.social}%：配置单人份，避免剩餐`);
  }

  // 5) 感受倾向：甜品收尾
  if (brief.empathy >= 65 && !items.some((i) => includesAny(i.name, DESSERT_HINTS))) {
    const dessert = pickByHints(menu, DESSERT_HINTS, excluded);
    if (dessert) add(dessert, `感受派 ${brief.empathy}%：补一份甜品收尾，给这一顿留个记忆点`);
  }

  // 6) 隐藏人格彩蛋动作
  const eggAction = profile.hiddenPersonality
    ? { name: profile.hiddenPersonality.name, action: profile.hiddenPersonality.eggAction }
    : null;

  const prices = items.map((i) => i.price).filter((p) => typeof p === 'number');
  const estimatedTotal = prices.length === items.length && items.length
    ? Math.round(prices.reduce((a, b) => a + b, 0) * 100) / 100
    : null;

  return {
    storeName: context.storeName || null,
    diningMode: context.diningMode || null,
    budget: context.budget ?? null,
    generatedAt: new Date().toISOString(),
    basedOn: {
      schemaVersion: profile.schemaVersion,
      mbti: profile.mbti,
      product: profile.product,
      hiddenPersonalityId: profile.hiddenPersonality ? profile.hiddenPersonality.id : null,
    },
    headline: `${profile.mbti} ${profile.product}型 · ${profile.title}的今日人格套餐`,
    items,
    estimatedTotal,
    estimatedTotalNote: estimatedTotal === null ? '部分商品未取到价格，请用 calculate-price 计算无券总价' : '无券总价，未使用任何优惠',
    budgetBias: brief.budgetMode || 'balanced',
    shareMode: brief.shareMode || 'pair',
    avoid: brief.avoid || [],
    eggAction,
    missing,
    steps: [
      'now-time-info：校准时间，判断是否早餐时段',
      'query-nearby-stores：按用户确认的门店/地址定位门店',
      'query-meals：拉取该门店实时可售菜单',
      'query-meal-detail：核对套餐可替换项与忌口',
      'calculate-price：先算【无券】总价',
      '（用户授权后）query-store-coupons / available-coupons / auto-bind-coupons：重算到手价',
      'create-order：用户确认方案后下单并返回支付链接',
    ],
    safety: [
      '所有价格、库存与在售状态以麦当劳 MCP 实时返回为准',
      '未获得用户明确同意前，不领取优惠券、不创建订单',
      '不请求、不存储手机号、定位坐标与支付凭证',
    ],
    disclaimer: '本方案由非官方趣味人格测试生成，仅供娱乐参考，不构成营养或医疗建议。',
  };
}

/** 把方案渲染成可直接贴给 Agent 的提示词 */
export function planToPrompt(plan, profile) {
  const lines = [];
  lines.push(`【今日人格套餐方案】${plan.headline}`);
  if (plan.storeName) lines.push(`门店：${plan.storeName}${plan.diningMode ? `｜就餐方式：${plan.diningMode}` : ''}`);
  lines.push('');
  lines.push('建议单品：');
  plan.items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.name}${item.price !== null ? `（¥${item.price}）` : ''} —— ${item.reason}`);
  });
  if (plan.estimatedTotal !== null) lines.push(`无券合计：¥${plan.estimatedTotal}`);
  else lines.push('无券合计：待用 calculate-price 计算');
  if (plan.avoid.length) lines.push(`应当避免：${plan.avoid.join('、')}`);
  if (plan.eggAction) lines.push(`彩蛋动作（${plan.eggAction.name}）：${plan.eggAction.action}`);
  if (plan.missing.length) {
    lines.push('');
    lines.push('需要 Agent 用实时菜单补齐：');
    plan.missing.forEach((m) => lines.push(`- ${m}`));
  }
  lines.push('');
  lines.push('执行顺序：');
  plan.steps.forEach((s, i) => lines.push(`${i + 1}) ${s}`));
  lines.push('');
  lines.push(`收尾文案请使用人格宣言风格：「${profile.declaration}」`);
  lines.push('注意：给出无券方案后，必须先询问用户是否授权读取优惠券。');
  return lines.join('\n');
}
