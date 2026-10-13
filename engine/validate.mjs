/**
 * 配置校验器（§14）
 * 开发环境与应用启动时运行，任何一条不通过都应该阻止进入测试。
 */

import { questions, DIMENSION_CORE_QUESTIONS } from './questions.mjs';
import { personalities, PERSONALITY_TYPES } from './personalities.mjs';
import { hiddenPersonalities } from './hidden.mjs';

const ALL_TYPES = [
  'ENTJ', 'ENTP', 'INTJ', 'INTP',
  'ENFJ', 'ENFP', 'INFJ', 'INFP',
  'ESTJ', 'ESFJ', 'ISTJ', 'ISFJ',
  'ESTP', 'ESFP', 'ISTP', 'ISFP',
];

/**
 * @returns {{ok:boolean, errors:string[], warnings:string[]}}
 */
export function validateConfig() {
  const errors = [];
  const warnings = [];

  // 1. 题目数量恰好为 20
  if (questions.length !== 20) errors.push(`题目数量应为 20，实际 ${questions.length}`);

  // 2. 每题恰好 4 个选项 + 4. 所有分值在 1～3
  questions.forEach((q) => {
    if (q.options.length !== 4) errors.push(`${q.id} 选项数应为 4，实际 ${q.options.length}`);
    q.options.forEach((o) => {
      if (!o.text || !o.text.trim()) errors.push(`${o.id} 选项文案为空`);
      o.scores.forEach(([dimension, value]) => {
        if (!Number.isInteger(value) || value < 1 || value > 3) {
          errors.push(`${o.id} 分值越界：${dimension}${value}`);
        }
      });
    });
  });

  // 3. 题号与 ID 唯一
  const orderSet = new Set();
  const idSet = new Set();
  questions.forEach((q) => {
    if (orderSet.has(q.order)) errors.push(`题号重复：${q.order}`);
    if (idSet.has(q.id)) errors.push(`题 ID 重复：${q.id}`);
    orderSet.add(q.order);
    idSet.add(q.id);
  });
  for (let i = 1; i <= 20; i += 1) {
    if (!orderSet.has(i)) errors.push(`缺少题号 ${i}`);
  }

  // 5. 16 种 MBTI 配置齐全
  ALL_TYPES.forEach((type) => {
    if (!personalities[type]) errors.push(`缺少人格配置：${type}`);
  });

  // 6. 16 个产品名称不重复
  const products = PERSONALITY_TYPES.map((t) => personalities[t].product);
  const dupProducts = products.filter((p, i) => products.indexOf(p) !== i);
  if (dupProducts.length) errors.push(`产品名称重复：${dupProducts.join('、')}`);

  // 7. bestMatchType 指向有效类型
  PERSONALITY_TYPES.forEach((type) => {
    const p = personalities[type];
    if (!personalities[p.bestMatchType]) errors.push(`${type} 的 bestMatchType 无效：${p.bestMatchType}`);
  });

  // 8. 隐藏人格 ID 唯一
  const hiddenIds = hiddenPersonalities.map((h) => h.id);
  hiddenIds.forEach((id, i) => {
    if (hiddenIds.indexOf(id) !== i) errors.push(`隐藏人格 ID 重复：${id}`);
  });

  // 9. “劳力士”与“劳资数到三”必须是两个独立 ID 和规则
  const rolex = hiddenPersonalities.find((h) => h.id === 'rolex');
  const count3 = hiddenPersonalities.find((h) => h.id === 'count3');
  if (!rolex) errors.push('缺少隐藏人格：劳力士（rolex）');
  if (!count3) errors.push('缺少隐藏人格：劳资数到三（count3）');
  if (rolex && count3 && rolex.ruleText === count3.ruleText) {
    errors.push('劳力士与劳资数到三的触发规则不得合并');
  }
  if (count3 && count3.priority !== 1) errors.push('劳资数到三应为最高优先级（priority=1）');

  // 10. 所有图片路径可解析（本地同源相对路径，不抓取官方素材）
  ALL_TYPES.forEach((type) => {
    const p = personalities[type];
    if (!p.image || /^https?:/i.test(p.image)) errors.push(`${type} 的图片路径必须为本地同源资源：${p.image}`);
  });

  // 11. 每个人格的必填文案非空
  ALL_TYPES.forEach((type) => {
    const p = personalities[type];
    ['declaration', 'description', 'weakness', 'misunderstood', 'bestMatchText', 'shareQuote', 'title', 'product'].forEach((field) => {
      if (!p[field] || !String(p[field]).trim()) errors.push(`${type} 缺少文案字段：${field}`);
    });
    if (!Array.isArray(p.dailyTraits) || p.dailyTraits.length < 3) errors.push(`${type} 的麦门日常条目不足`);
  });

  // 12. 彩蛋稀有度字段使用 rarityLabel
  hiddenPersonalities.forEach((h) => {
    if (!h.rarityLabel) errors.push(`${h.id} 缺少 rarityLabel`);
    if (/准确率|获得率|概率/.test(`${h.ruleText}${h.shareQuote}`)) {
      errors.push(`${h.id} 文案出现“准确率/获得率”类表述`);
    }
  });

  // 维度核心题覆盖检查
  Object.entries(DIMENSION_CORE_QUESTIONS).forEach(([key, orders]) => {
    if (orders.length !== 4) errors.push(`${key} 核心题应为 4 题`);
  });

  // 结构一致性警告（不阻断）
  questions.forEach((q) => {
    if (q.primaryDimension === 'HIDDEN' || q.primaryDimension === 'MIXED') {
      if (!q.options.some((o) => (o.hiddenSignals || []).length)) {
        warnings.push(`${q.id} 声明为 HIDDEN/MIXED 但没有任何 hiddenSignals`);
      }
    }
  });
  warnings.push('已知配置冲突：§6 声明 Q19-A 增加“鸡不可失”信号，但 §9.5 触发规则只认 Q18-A；当前以 §9.5 为准。');

  return { ok: errors.length === 0, errors, warnings };
}

/** 开发环境调用：校验失败直接抛出，便于尽早暴露配置错误 */
export function assertConfig() {
  const report = validateConfig();
  if (!report.ok) {
    const message = `配置校验失败：\n- ${report.errors.join('\n- ')}`;
    if (typeof console !== 'undefined') console.error(message);
    throw new Error(message);
  }
  return report;
}
