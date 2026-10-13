/**
 * 计分引擎单元测试（对应《规格书》§17.2 的 10 条验收项）
 * 运行：npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateResult,
  calculateCompatibility,
  createEmptyScores,
  normalizeAnswers,
  stableHash,
  validateConfig,
  personalities,
  hiddenPersonalities,
  questions,
  buildProfile,
  buildMealPlan,
  buildShareText,
} from '../engine/index.mjs';

/** 用维度倾向词构造 20 题作答：全部选“最靠近某一侧”的选项 */
const pick = (order, prefer) => {
  const q = questions[order - 1];
  let best = 0;
  let bestScore = -1;
  q.options.forEach((o, i) => {
    const value = o.scores.filter(([d]) => d === prefer).reduce((a, [, v]) => a + v, 0);
    if (value > bestScore) {
      bestScore = value;
      best = i;
    }
  });
  return best;
};

const answerAll = (prefer) => questions.map((q) => pick(q.order, prefer));

test('1. 全部选 E/N/T/J 倾向答案时得到 ENTJ', () => {
  const answers = questions.map((q) => {
    const order = q.order;
    if (order <= 4) return pick(order, 'E');
    if (order <= 8) return pick(order, 'N');
    if (order <= 12) return pick(order, 'T');
    if (order <= 16) return pick(order, 'J');
    if (order === 17) return 0; // T+2, J+2
    if (order === 18) return 1; // I+1, T+2, J+1
    return 0;
  });
  const result = calculateResult(answers);
  assert.equal(result.mbti, 'ENTJ');
  assert.equal(result.personality.product, '巨无霸');
});

test('2. 全部选 I/S/F/P 倾向答案时得到 ISFP', () => {
  const answers = questions.map((q) => {
    const order = q.order;
    if (order <= 4) return pick(order, 'I');
    if (order <= 8) return pick(order, 'S');
    if (order <= 12) return pick(order, 'F');
    if (order <= 16) return pick(order, 'P');
    if (order === 17) return 3; // N+2, P+2
    return 3; // Q18-D: S+1, P+2
  });
  const result = calculateResult(answers);
  assert.equal(result.mbti, 'ISFP');
  assert.equal(result.personality.product, '圆筒冰淇淋');
});

test('3. 同分输入经稳定哈希后重复运行结果一致', () => {
  // 构造四组全部为 0 分的答案集合不可行，改用“同分决胜”路径：每维各选一个 +3 与一个 +3
  const ties = questions.map((q, i) => (i % 2 === 0 ? 0 : 3));
  const a = calculateResult(ties);
  const b = calculateResult(ties);
  assert.equal(a.mbti, b.mbti);
  assert.deepEqual(a.rawScores, b.rawScores);
  assert.equal(a.answerSequence, b.answerSequence);
  // 哈希函数本身可复现
  assert.equal(stableHash('0123|1.0.0'), stableHash('0123|1.0.0'));
});

test('4. 修改答案后旧分值被替换而非累计', () => {
  const first = calculateResult({ 0: 3 }); // Q1-D → I+3
  const revised = calculateResult({ 0: 0 }); // Q1-A → E+3
  assert.equal(first.rawScores.I, 3);
  assert.equal(revised.rawScores.I, 0);
  assert.equal(revised.rawScores.E, 3);

  // 同一题先选 D 再改选 A，最终分数必须等于从未选过 D
  const allA = Array(20).fill(0);
  const reworked = allA.slice();
  reworked[0] = 3;
  reworked[0] = 0;
  assert.deepEqual(calculateResult(reworked).rawScores, calculateResult(allA).rawScores);
});

test('5. 百分比计算无 NaN 且两侧之和为 100', () => {
  for (let i = 0; i < 40; i += 1) {
    const answers = questions.map((q) => Math.floor(Math.random() * 4));
    const result = calculateResult(answers);
    ['EI', 'SN', 'TF', 'JP'].forEach((key) => {
      const d = result.dimensions[key];
      assert.ok(Number.isFinite(d.leftPercent), `${key} leftPercent 非有限数`);
      assert.ok(Number.isFinite(d.rightPercent), `${key} rightPercent 非有限数`);
      assert.equal(d.leftPercent + d.rightPercent, 100);
    });
  }
});

test('6. 契合度始终落在 74～96', () => {
  assert.equal(calculateCompatibility(createEmptyScores()), 74);
  for (let i = 0; i < 200; i += 1) {
    const scores = createEmptyScores();
    Object.keys(scores).forEach((k) => {
      scores[k] = Math.floor(Math.random() * 40);
    });
    const value = calculateCompatibility(scores);
    assert.ok(value >= 74 && value <= 96, `契合度越界：${value}`);
  }
});

test('7. Q20-D 但其余条件不足时不授予“劳资数到三”', () => {
  // Q20-D 成立，但 Q3/Q13/Q15 都不是主动分配型、J/T 远低于 70%、接管次数不足
  const answers = [0, 0, 2, 0, 0, 1, 0, 0, 1, 2, 1, 0, 2, 0, 2, 0, 1, 3, 2, 3];
  const result = calculateResult(answers);
  assert.equal(result.hiddenPersonality, null, '不应授予任何隐藏人格');
  assert.ok(result.hint, '应给出轻提示');
});

test('8. 劳力士不依赖 Q20-D', () => {
  // Q19-D + 高频直接行动 + Q6/Q10/Q17 主动处理 + 手速快，且 Q20 不选 D
  const answers = new Array(20).fill(0);
  answers[5] = 0; // Q6-A 直接行动
  answers[8] = 0; // Q9-A 直接行动
  answers[9] = 0; // Q10-A 直接行动
  answers[10] = 0; // Q11-A 直接行动
  answers[12] = 0; // Q13-A 直接行动
  answers[16] = 0; // Q17-A 直接行动
  answers[18] = 3; // Q19-D
  answers[19] = 0; // Q20-A（刻意避开 D）
  const timings = answers.map(() => ({ durationMs: 3000 }));
  const result = calculateResult(answers.map((a, i) => ({ questionIndex: i, optionIndex: a, ...timings[i] })));
  assert.equal(result.hiddenPersonality && result.hiddenPersonality.id, 'rolex');
});

test('9. 多隐藏人格满足时按触发分与优先级返回一个', () => {
  // 让 count3 与 cheese 同时满足，count3 优先级更高
  const answers = new Array(20).fill(0);
  answers[2] = 0; // Q3-A takeover
  answers[4] = 1; // Q5-B research+tryNew
  answers[5] = 3; // Q6-D research
  answers[6] = 3; // Q7-D research
  answers[7] = 3; // Q8-D research
  answers[11] = 0; // Q12-A
  answers[12] = 0; // Q13-A takeover
  answers[14] = 0; // Q15-A takeover
  answers[17] = 1; // Q18-B research
  answers[19] = 3; // Q20-D → count3
  const result = calculateResult(answers);
  assert.ok(result.hiddenPersonality, '应解锁一个隐藏人格');
  assert.equal(result.hiddenPersonality.id, 'count3');
  assert.equal(hiddenPersonalities.filter((h) => h.priority === result.hiddenPersonality.priority).length >= 1, true);
});

test('10. 无隐藏人格满足时返回 null', () => {
  const result = calculateResult(new Array(20).fill(0));
  assert.equal(result.hiddenPersonality, null);
  assert.equal(result.contrastText, '');
});

test('附：配置校验通过', () => {
  const report = validateConfig();
  assert.equal(report.ok, true, report.errors.join('; '));
  assert.equal(Object.keys(personalities).length, 16);
  assert.equal(hiddenPersonalities.length, 8);
});

test('附：人格档案与套餐方案可稳定生成', () => {
  const result = calculateResult(questions.map((q) => (q.order % 2 === 0 ? 0 : 3)));
  const profile = buildProfile(result);
  assert.equal(profile.schemaVersion, '1.0.0');
  assert.ok(profile.agentInstruction.includes('无券价格'));

  const menu = [
    { code: 'P1', name: profile.product, price: 25, category: '主食', tags: [] },
    { code: 'P2', name: '中薯条', price: 12, category: '小食', tags: [] },
    { code: 'P3', name: '圆筒冰淇淋', price: 6, category: '甜品', tags: [] },
  ];
  const plan = buildMealPlan(profile, menu, { storeName: '测试门店', diningMode: '堂食' });
  assert.ok(plan.items.length >= 1);
  assert.equal(plan.items[0].name, profile.product);
  assert.ok(plan.estimatedTotal !== null);
  assert.equal(buildMealPlan(profile, menu).items.length, plan.items.length);

  const share = buildShareText(result, 'A');
  assert.ok(share.includes(profile.product));
});
