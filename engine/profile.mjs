/**
 * 人格档案（PersonalityProfile）
 *
 * 这是 H5 与 Agent 之间的唯一契约：H5 产出档案，WorkBuddy 读取档案后调用麦当劳 MCP
 * 生成“今日人格套餐”。档案里刻意不包含任何 Token、手机号、定位坐标等敏感信息，
 * 门店与授权由用户在对话中显式提供（符合 CONTEST_DECLARATION.md 的信息安全声明）。
 */

import { PROFILE_SCHEMA_VERSION, versions } from './versions.mjs';

/** 预算倾向由“理性派/尝鲜派”共同决定 */
function resolveBudgetMode(percentMap) {
  const { T, N } = percentMap;
  if (N >= 65) return 'experience';
  if (T >= 60) return 'value';
  return 'balanced';
}

function resolveShareMode(percentMap) {
  const { E } = percentMap;
  if (E >= 60) return 'group';
  if (E >= 40) return 'pair';
  return 'solo';
}

function resolveRiskMode(percentMap) {
  return percentMap.N >= 60 ? 'newfirst' : 'classic';
}

/** 由四维推导“应当避免的点单行为”，避免 Agent 泛泛而谈 */
function resolveAvoidList(percentMap) {
  const avoid = [];
  if (percentMap.E < 35) avoid.push('超大分享装');
  if (percentMap.N < 40) avoid.push('未经确认的限时新品');
  if (percentMap.J >= 65) avoid.push('临时加购导致返工');
  if (percentMap.T >= 65) avoid.push('明显溢价的单品');
  if (percentMap.F >= 70) avoid.push('只顾自己口味的单人套餐');
  return avoid;
}

/** 隐藏人格自带的点单偏好 */
const HIDDEN_MEAL_PREFERENCE = {
  count3: { mode: 'one-shot', note: '只给一版方案，最多两句解释。' },
  rolex: { mode: 'close-loop', note: '补上取餐与餐具备注，一次点完不返工。' },
  cheese: { mode: 'evidence', note: '价格与营养必须给出数据来源。' },
  calm: { mode: 'verify', note: '下单前复述订单摘要再给支付链接。' },
  chicken: { mode: 'limited-first', note: '限时/新品优先入选。' },
  fries: { mode: 'share-first', note: '优先可分享装，并在备注中体现给同伴留份。' },
  porridge: { mode: 'no-nag', note: '优惠差异只提示一次，不反复劝说改单。' },
  pm: { mode: 'checklist', note: '输出带责任人的取餐分工清单。' },
};

/**
 * @param {ReturnType<import('./scoring.mjs').calculateResult>} result
 * @returns {object} PersonalityProfile
 */
export function buildProfile(result) {
  const { percentMap, personality, hiddenPersonality } = result;
  const hiddenPref = hiddenPersonality ? HIDDEN_MEAL_PREFERENCE[hiddenPersonality.id] : null;

  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    testVersion: versions.testVersion,
    scoringVersion: versions.scoringVersion,
    personalityVersion: versions.personalityVersion,
    resultId: result.resultId,
    completedAt: result.completedAt,
    mbti: result.mbti,
    product: personality.product,
    title: personality.title,
    group: personality.group,
    declaration: personality.declaration,
    shareQuote: personality.shareQuote,
    compatibility: result.compatibility,
    dimensions: {
      EI: pickPair(result.dimensions.EI),
      SN: pickPair(result.dimensions.SN),
      TF: pickPair(result.dimensions.TF),
      JP: pickPair(result.dimensions.JP),
    },
    hiddenPersonality: hiddenPersonality
      ? {
        id: hiddenPersonality.id,
        name: hiddenPersonality.name,
        title: hiddenPersonality.title,
        rarityLabel: hiddenPersonality.rarityLabel,
        eggAction: hiddenPersonality.eggAction,
      }
      : null,
    mealBrief: {
      social: percentMap.E,
      adventure: percentMap.N,
      empathy: percentMap.F,
      structure: percentMap.J,
      rationale: percentMap.T,
      budgetMode: resolveBudgetMode(percentMap),
      shareMode: resolveShareMode(percentMap),
      riskMode: resolveRiskMode(percentMap),
      keywords: [
        ...personality.mealKeywords,
        ...(hiddenPersonality ? hiddenPersonality.keywords.split('、') : []),
      ],
      mustInclude: [personality.product],
      avoid: resolveAvoidList(percentMap),
      hiddenMode: hiddenPref ? hiddenPref.mode : null,
      hiddenNote: hiddenPref ? hiddenPref.note : null,
    },
    agentInstruction: [
      '你是“麦门人格研究所”的点单 Agent，请基于本档案生成【今日人格套餐】。',
      '第 1 步：调用 now-time-info 校准当前时间，判断是否处于早餐时段。',
      '第 2 步：向用户确认门店（或配送地址）与就餐方式，再查询附近可用门店。',
      '第 3 步：查询当前门店实时菜单与餐品详情，只用真实在售商品组套餐。',
      '第 4 步：先给出【无券价格】的完整方案与选择理由，不要在这一步读取优惠券。',
      '第 5 步：明确询问用户是否授权读取/领取优惠券；只有用户同意后才调用券相关工具重新算价。',
      '第 6 步：用户确认方案后创建订单并返回支付链接；未得到确认不得下单。',
      '输出要求：先给结论（点了什么、为什么像你），再给价格，最后给一句人格宣言式的收尾。',
      '价格、库存与在售状态一律以麦当劳 MCP 实时返回为准；不得编造菜品、价格或优惠。',
    ].join('\n'),
  };
}

function pickPair(dimension) {
  return {
    left: dimension.left,
    right: dimension.right,
    leftPercent: dimension.leftPercent,
    rightPercent: dimension.rightPercent,
    winner: dimension.winner,
    isBalanced: dimension.isBalanced,
  };
}

/** 生成给用户粘贴到 WorkBuddy 的短指令（H5 结果页“复制档案”按钮） */
export function buildClipboardPayload(profile) {
  const compact = {
    schemaVersion: profile.schemaVersion,
    mbti: profile.mbti,
    product: profile.product,
    title: profile.title,
    compatibility: profile.compatibility,
    dimensions: profile.dimensions,
    hiddenPersonality: profile.hiddenPersonality,
    mealBrief: profile.mealBrief,
  };
  return [
    '我在「麦门人格研究所」测出了我的麦门人格，请基于这份人格档案帮我生成【今日人格套餐】。',
    '',
    '```json',
    JSON.stringify(compact, null, 2),
    '```',
    '',
    profile.agentInstruction,
  ].join('\n');
}
