/**
 * 麦门人格研究所 · 计分引擎
 *
 * 纯函数实现（规格书 §16：结果计算必须为纯函数，同一答案与同一版本返回同一结果）。
 * 本引擎同时被 H5 前端与 Skill CLI（scripts/*.mjs）复用，是唯一事实来源。
 */

import { questions, DIMENSION_CORE_QUESTIONS } from './questions.mjs';
import { personalities } from './personalities.mjs';
import { hiddenPersonalities, getContrastText, COUNT3_HINT } from './hidden.mjs';
import { versions } from './versions.mjs';

export const DIMENSIONS = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'];
export const DIMENSION_PAIRS = [
  { key: 'EI', left: 'E', right: 'I', leftLabel: '热闹派', rightLabel: '独享派' },
  { key: 'SN', left: 'S', right: 'N', leftLabel: '经典派', rightLabel: '尝鲜派' },
  { key: 'TF', left: 'T', right: 'F', leftLabel: '理性派', rightLabel: '感受派' },
  { key: 'JP', left: 'J', right: 'P', leftLabel: '计划派', rightLabel: '随心派' },
];

/** 一组维度差值不超过 8 个百分点 → 标注“非常接近中间值”（§4） */
export const BALANCED_THRESHOLD = 8;
/** 单题时长参与行为计算的区间：1～60 秒（§13） */
export const DURATION_MIN_MS = 1000;
export const DURATION_MAX_MS = 60000;
/** 劳力士第 4 项条件的时长门槛（§9.1） */
export const FAST_MEDIAN_MS = 6000;

export function createEmptyScores() {
  return { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
}

/* ------------------------------------------------------------------ *
 * 稳定哈希（§7.3）——不使用真正随机数，保证同输入同输出
 * ------------------------------------------------------------------ */

/** FNV-1a 32bit */
export function stableHash(input) {
  let hash = 0x811c9dc5;
  const text = String(input);
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/* ------------------------------------------------------------------ *
 * 答案归一化
 * ------------------------------------------------------------------ */

/**
 * 接受多种答案输入形态，统一为内部结构。
 * 支持：{ questionId, optionId } / { q, a } / { questionIndex, optionIndex } / 纯选项下标数组
 * @returns {Array<null | {questionIndex:number, optionIndex:number, question:object, option:object, durationMs:number|null, revisionCount:number}>}
 */
export function normalizeAnswers(input = []) {
  const byId = new Map(questions.map((q, i) => [q.id, i]));
  const list = new Array(questions.length).fill(null);

  const push = (raw, fallbackIndex) => {
    if (raw === null || raw === undefined) return;
    let questionIndex = fallbackIndex;
    let optionIndex = null;
    let durationMs = null;
    let revisionCount = 0;

    if (typeof raw === 'number') {
      optionIndex = raw;
    } else if (typeof raw === 'object') {
      if (typeof raw.questionIndex === 'number') questionIndex = raw.questionIndex;
      else if (typeof raw.q === 'number') questionIndex = raw.q;
      else if (typeof raw.questionId === 'string' && byId.has(raw.questionId)) questionIndex = byId.get(raw.questionId);

      if (typeof raw.optionIndex === 'number') optionIndex = raw.optionIndex;
      else if (typeof raw.a === 'number') optionIndex = raw.a;
      else if (typeof raw.optionId === 'string') {
        const q = questions[questionIndex];
        const found = q ? q.options.findIndex((o) => o.id === raw.optionId) : -1;
        optionIndex = found >= 0 ? found : null;
      }

      if (typeof raw.durationMs === 'number') durationMs = raw.durationMs;
      if (typeof raw.revisionCount === 'number') revisionCount = raw.revisionCount;
    }

    if (questionIndex === null || questionIndex === undefined || optionIndex === null || optionIndex === undefined) return;
    if (questionIndex < 0 || questionIndex >= questions.length) return;
    const question = questions[questionIndex];
    if (!question || !question.options[optionIndex]) return;

    list[questionIndex] = {
      questionIndex,
      optionIndex,
      question,
      option: question.options[optionIndex],
      durationMs,
      revisionCount,
    };
  };

  if (Array.isArray(input)) input.forEach((raw, i) => push(raw, typeof raw === 'number' ? i : null));
  else if (input && typeof input === 'object') Object.entries(input).forEach(([k, v]) => push(v, Number(k)));

  return list;
}

/* ------------------------------------------------------------------ *
 * 分数汇总
 * ------------------------------------------------------------------ */

/**
 * 遍历 20 个答案累加权重（§7.1）。
 * 未作答的题不贡献任何分值，直接修改答案会替换而非叠加（§16）。
 */
export function calculateScores(normalized) {
  const scores = createEmptyScores();
  normalized.forEach((entry) => {
    if (!entry) return;
    entry.option.scores.forEach(([dimension, value]) => {
      scores[dimension] += value;
    });
  });
  return scores;
}

export function toAnswerSequence(normalized) {
  return normalized.map((entry) => (entry ? entry.optionIndex : '-')).join('');
}

/* ------------------------------------------------------------------ *
 * 四维计算与同分决胜（§7.2 / §7.3）
 * ------------------------------------------------------------------ */

function countStrongAnswers(normalized, dimension) {
  const core = DIMENSION_CORE_QUESTIONS[dimension] || [];
  let count = 0;
  core.forEach((order) => {
    const entry = normalized[order - 1];
    if (!entry) return;
    if (entry.option.scores.some(([d, v]) => d === dimension && v === 3)) count += 1;
  });
  return count;
}

function lastTouchedIndex(normalized, dimension) {
  let last = -1;
  normalized.forEach((entry, index) => {
    if (!entry) return;
    if (entry.option.scores.some(([d]) => d === dimension)) last = index;
  });
  return last;
}

/**
 * 单组维度求解。
 * 同分时依次比较：核心题 +3 数量 → 更靠近测试末尾的相关题 → 稳定哈希。
 */
export function resolveDimension(pair, normalized, scores) {
  const { left, right } = pair;
  const leftScore = scores[left];
  const rightScore = scores[right];
  const sum = leftScore + rightScore;

  let winner;
  let tiebreak = null;

  if (leftScore !== rightScore) {
    winner = leftScore > rightScore ? left : right;
  } else {
    const leftStrong = countStrongAnswers(normalized, left);
    const rightStrong = countStrongAnswers(normalized, right);
    if (leftStrong !== rightStrong) {
      winner = leftStrong > rightStrong ? left : right;
      tiebreak = 'strongAnswerCount';
    } else {
      const leftLast = lastTouchedIndex(normalized, left);
      const rightLast = lastTouchedIndex(normalized, right);
      if (leftLast !== rightLast) {
        winner = leftLast > rightLast ? left : right;
        tiebreak = 'recency';
      } else {
        const seed = `${toAnswerSequence(normalized)}|${versions.scoringVersion}`;
        winner = stableHash(seed) % 2 === 0 ? left : right;
        tiebreak = 'stableHash';
      }
    }
  }

  const leftPercent = sum === 0 ? 50 : Math.round((leftScore / Math.max(sum, 1)) * 100);
  const rightPercent = 100 - leftPercent;

  return {
    key: pair.key,
    left,
    right,
    leftScore,
    rightScore,
    leftPercent,
    rightPercent,
    winner,
    isBalanced: Math.abs(leftPercent - rightPercent) <= BALANCED_THRESHOLD,
    tiebreak,
    balancedNote: '这一维度非常接近中间值。你会根据同桌的人、当天状态和优惠券情况灵活切换。',
  };
}

/* ------------------------------------------------------------------ *
 * 主人格与契合度（§7.4）
 * ------------------------------------------------------------------ */

export function determinePersonality(dimensionResults) {
  return ['EI', 'SN', 'TF', 'JP'].map((key) => dimensionResults[key].winner).join('');
}

export function calculateCompatibility(scores) {
  const pairStrengths = DIMENSION_PAIRS.map(({ left, right }) => {
    const a = scores[left];
    const b = scores[right];
    return Math.abs(a - b) / Math.max(a + b, 1);
  });
  const average = pairStrengths.reduce((acc, v) => acc + v, 0) / pairStrengths.length;
  const raw = 74 + average * 22;
  return Math.round(Math.min(96, Math.max(74, raw)));
}

/* ------------------------------------------------------------------ *
 * 行为信号（§13）
 * ------------------------------------------------------------------ */

export function collectBehavior(normalized) {
  const tagCounts = {
    directAction: 0,
    takeover: 0,
    research: 0,
    care: 0,
    adapt: 0,
    calm: 0,
    tryNew: 0,
  };
  const tagsByQuestion = new Map();

  normalized.forEach((entry) => {
    if (!entry) return;
    const tags = entry.option.behaviorTags || [];
    tagsByQuestion.set(entry.questionIndex + 1, tags);
    tags.forEach((tag) => {
      if (tagCounts[tag] === undefined) tagCounts[tag] = 0;
      tagCounts[tag] += 1;
    });
  });

  const durations = normalized
    .filter((entry) => entry && typeof entry.durationMs === 'number' && entry.durationMs > 0)
    .map((entry) => Math.min(DURATION_MAX_MS, Math.max(DURATION_MIN_MS, entry.durationMs)));

  const timingAvailable = durations.length >= Math.ceil(questions.length * 0.5);
  let medianDurationMs = null;
  if (durations.length) {
    const sorted = [...durations].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    medianDurationMs = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  const answeredIndexes = normalized.filter(Boolean).map((e) => e.optionIndex);
  const uniqueOptions = new Set(answeredIndexes).size;
  const isSequentialCycle = answeredIndexes.length >= 8
    && answeredIndexes.every((v, i) => v === i % 4);
  const isMechanicalRepeat = answeredIndexes.length >= 8 && uniqueOptions <= 1;
  const isMechanical = isSequentialCycle || isMechanicalRepeat;

  return {
    ...tagCounts,
    totalAnswers: normalized.filter(Boolean).length,
    tagsByQuestion,
    durations,
    timingAvailable,
    medianDurationMs,
    isMechanical,
  };
}

export function countTagsInQuestions(behavior, questionOrders, tag) {
  return questionOrders.filter((order) => (behavior.tagsByQuestion.get(order) || []).includes(tag)).length;
}

export function selectedOptionIndex(normalized, order) {
  const entry = normalized[order - 1];
  return entry ? entry.optionIndex : null;
}

/* ------------------------------------------------------------------ *
 * 隐藏人格检测（§9）
 * ------------------------------------------------------------------ */

function evaluateHiddenRules(normalized, percentMap, behavior) {
  const pct = (key) => percentMap[key] || 0;
  const q = (order) => selectedOptionIndex(normalized, order);
  const is = (order, optionIndex) => q(order) === optionIndex;

  /** @type {Record<string, {id:string, eligible:boolean, triggerScore:number, detail:string[]}>} */
  const evaluated = {};

  // 9.1 劳力士 —— 把事情做完，不要求 Q20-D
  {
    const directActionIn4 = countTagsInQuestions(behavior, [6, 10, 17, 19], 'directAction');
    const c1 = is(19, 3);
    const c2 = behavior.directAction >= 5;
    const c3 = directActionIn4 >= 3;
    const timingSatisfied = behavior.timingAvailable
      && behavior.medianDurationMs !== null
      && behavior.medianDurationMs < FAST_MEDIAN_MS
      && !behavior.isMechanical;
    const satisfied = [c1, c2, c3, timingSatisfied].filter(Boolean).length;
    // 无答题时长数据时，剩余三项必须全部满足
    const eligible = behavior.timingAvailable ? satisfied >= 3 : c1 && c2 && c3;
    evaluated.rolex = {
      id: 'rolex',
      eligible,
      triggerScore: satisfied * 10 + behavior.directAction,
      detail: [`Q19-D=${c1}`, `直接行动=${behavior.directAction}`, `现场处理题=${directActionIn4}`, `手速=${timingSatisfied}`],
    };
  }

  // 9.2 劳资数到三
  {
    const takeoverIn3 = countTagsInQuestions(behavior, [3, 13, 15], 'takeover');
    const c1 = is(20, 3);
    const c2 = takeoverIn3 >= 2;
    const c3 = pct('T') >= 70 || pct('J') >= 70;
    const c4 = behavior.takeover >= 3;
    evaluated.count3 = {
      id: 'count3',
      eligible: c1 && c2 && c3 && c4,
      triggerScore: behavior.takeover * 10 + takeoverIn3,
      detail: [`Q20-D=${c1}`, `主动分配题=${takeoverIn3}`, `T/J=${c3}`, `接管次数=${behavior.takeover}`],
    };
  }

  // 9.3 芝士分子
  {
    const c1 = is(19, 2) || is(20, 2);
    const c2 = behavior.research >= 5;
    const c3 = pct('N') >= 62 || pct('T') >= 62;
    evaluated.cheese = {
      id: 'cheese',
      eligible: c1 && c2 && c3,
      triggerScore: behavior.research * 10,
      detail: [`Q19-C/Q20-C=${c1}`, `研究型=${behavior.research}`, `N/T=${c3}`],
    };
  }

  // 9.4 堡持冷静
  {
    const calmIn3 = countTagsInQuestions(behavior, [6, 10, 17], 'calm');
    const c1 = is(19, 1);
    const c2 = calmIn3 >= 2;
    const c3 = pct('T') >= 55;
    evaluated.calm = {
      id: 'calm',
      eligible: c1 && c2 && c3,
      triggerScore: calmIn3 * 10 + behavior.calm,
      detail: [`Q19-B=${c1}`, `核对题=${calmIn3}`, `T=${pct('T')}`],
    };
  }

  // 9.5 鸡不可失
  {
    const tryNewIn3 = countTagsInQuestions(behavior, [5, 6, 7], 'tryNew');
    const c1 = is(18, 0);
    const c2 = tryNewIn3 >= 2;
    const c3 = pct('N') >= 65 || pct('P') >= 65;
    evaluated.chicken = {
      id: 'chicken',
      eligible: c1 && c2 && c3,
      triggerScore: tryNewIn3 * 10 + behavior.tryNew,
      detail: [`Q18-A=${c1}`, `尝鲜题=${tryNewIn3}`, `N/P=${c3}`],
    };
  }

  // 9.6 薯于你
  {
    const careIn4 = countTagsInQuestions(behavior, [9, 11, 12, 16], 'care');
    const c1 = pct('F') >= 70;
    const c2 = careIn4 >= 3;
    evaluated.fries = {
      id: 'fries',
      eligible: c1 && c2,
      triggerScore: careIn4 * 10 + behavior.care,
      detail: [`F=${pct('F')}`, `照顾题=${careIn4}`],
    };
  }

  // 9.7 麦已成粥
  {
    const c1 = is(20, 0);
    const c2 = behavior.adapt >= 5;
    const c3 = pct('P') >= 60;
    evaluated.porridge = {
      id: 'porridge',
      eligible: c1 && c2 && c3,
      triggerScore: behavior.adapt * 10,
      detail: [`Q20-A=${c1}`, `随机应变=${behavior.adapt}`, `P=${pct('P')}`],
    };
  }

  // 9.8 麦门项目经理
  {
    const pmCandidates = [is(3, 0), is(13, 0) || is(13, 1), is(15, 0) || is(15, 1)];
    const hit = pmCandidates.filter(Boolean).length;
    const c1 = is(20, 1);
    const c2 = hit >= 3;
    const c3 = pct('J') >= 68;
    evaluated.pm = {
      id: 'pm',
      eligible: c1 && c2 && c3,
      triggerScore: hit * 10 + behavior.takeover,
      detail: [`Q20-B=${c1}`, `组织题=${hit}`, `J=${pct('J')}`],
    };
  }

  return evaluated;
}

/**
 * 最多返回一个隐藏人格（§9.9）。
 * 不满足条件时返回 null —— 不随机硬塞彩蛋。
 * @param {Array} normalized
 * @param {Record<string, number>} percentMap 四维百分比（E/I/S/N/T/F/J/P）
 * @param {ReturnType<typeof collectBehavior>} behavior
 */
export function detectHiddenPersonality(normalized, percentMap, behavior) {
  const evaluated = evaluateHiddenRules(normalized, percentMap, behavior);
  const eligible = hiddenPersonalities
    .map((config) => ({ config, ...evaluated[config.id] }))
    .filter((item) => item.eligible);

  if (!eligible.length) {
    return { hidden: null, hint: null, evaluated };
  }

  eligible.sort((a, b) => {
    if (b.triggerScore !== a.triggerScore) return b.triggerScore - a.triggerScore;
    return a.config.priority - b.config.priority;
  });

  return { hidden: eligible[0], hint: null, evaluated };
}

/** 轻提示：仅 Q20-D 成立但其余条件不足（§9.2） */
export function detectHint(normalized, hidden) {
  if (hidden) return null;
  if (selectedOptionIndex(normalized, 20) === 3) return COUNT3_HINT;
  return null;
}

/* ------------------------------------------------------------------ *
 * 总入口
 * ------------------------------------------------------------------ */

/**
 * 计算完整结果（纯函数）。
 * @param {Array|Record<number, number>} answers 答案，见 normalizeAnswers
 * @param {{resultId?:string, completedAt?:string}} [meta]
 */
export function calculateResult(answers, meta = {}) {
  const normalized = normalizeAnswers(answers);

  const scores = calculateScores(normalized);
  const dimensionResults = {};
  DIMENSION_PAIRS.forEach((pair) => {
    dimensionResults[pair.key] = resolveDimension(pair, normalized, scores);
  });

  const mbti = determinePersonality(dimensionResults);
  const compatibility = calculateCompatibility(scores);

  const percentMap = {
    E: dimensionResults.EI.leftPercent,
    I: dimensionResults.EI.rightPercent,
    S: dimensionResults.SN.leftPercent,
    N: dimensionResults.SN.rightPercent,
    T: dimensionResults.TF.leftPercent,
    F: dimensionResults.TF.rightPercent,
    J: dimensionResults.JP.leftPercent,
    P: dimensionResults.JP.rightPercent,
  };

  const behavior = collectBehavior(normalized);
  const { hidden, evaluated } = detectHiddenPersonality(normalized, percentMap, behavior);

  const answeredCount = normalized.filter(Boolean).length;
  const completedAt = meta.completedAt || new Date().toISOString();
  const answerSequence = toAnswerSequence(normalized);

  return {
    resultId: meta.resultId || `${mbti}-${stableHash(`${answerSequence}|${completedAt}`)}`,
    mbti,
    personality: personalities[mbti],
    compatibility,
    dimensions: dimensionResults,
    rawScores: scores,
    percentMap,
    hiddenPersonality: hidden ? hidden.config : null,
    hiddenTriggerScore: hidden ? hidden.triggerScore : null,
    hiddenEvaluated: evaluated,
    contrastText: hidden ? getContrastText(mbti, hidden.config.id) : '',
    hint: detectHint(normalized, hidden),
    behavior,
    answerSequence,
    answeredCount,
    isComplete: answeredCount === questions.length,
    completedAt,
    testVersion: versions.testVersion,
    scoringVersion: versions.scoringVersion,
    personalityVersion: versions.personalityVersion,
  };
}

/** 分享文案模板（§10.1） */
export function buildShareText(result, template = 'A') {
  const p = result.personality;
  if (template === 'B') {
    if (!result.hiddenPersonality) return buildShareText(result, 'A');
    return [
      `我的麦门主人格是「${p.product}」，`,
      `隐藏人格居然是「${result.hiddenPersonality.name}」！`,
      result.hiddenPersonality.shareQuote,
      '来测测你能不能解锁彩蛋。',
    ].join('\n');
  }
  if (template === 'C') {
    const summary = ['EI', 'SN', 'TF', 'JP']
      .map((key) => {
        const d = result.dimensions[key];
        return `${d.winner} ${Math.max(d.leftPercent, d.rightPercent)}%`;
      })
      .join(' / ');
    return [
      `20 道题后，系统认为我最像 ${p.product}。`,
      `四维倾向：${summary}`,
      '这个结果不能说完全准确，只能说很难反驳。',
    ].join('\n');
  }
  return [
    `测完发现我是「${p.product}型 ${result.mbti}」：${p.title}。`,
    p.shareQuote,
    `我的麦门契合度是 ${result.compatibility}%，你是哪一款？`,
  ].join('\n');
}
