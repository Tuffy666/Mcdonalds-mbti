/**
 * 麦门人格研究所 · 20 道正式题库
 *
 * 依据《麦门人格研究所：H5 小游戏产品设计与开发规格书》§6 逐题录入，未改写任何题面与权重。
 *
 * 计分约定（§6.1）：
 *   强倾向 +3 / 中倾向 +2 / 弱倾向或辅助倾向 +1
 *
 * 维度归属（§6.1）：
 *   Q1-Q4   → EI
 *   Q5-Q8   → SN
 *   Q9-Q12  → TF
 *   Q13-Q16 → JP
 *   Q17-Q18 → MIXED（复合情景题）
 *   Q19-Q20 → HIDDEN（兼顾主人格与隐藏人格）
 *
 * behaviorTags 行为信号（§13）用于隐藏人格判定，取值含义：
 *   directAction 直接行动型 / takeover 主动接管或提前决定型 / research 研究型
 *   care 分享照顾型 / adapt 随机应变型 / calm 核对稳妥型 / tryNew 尝鲜型
 *
 * hiddenSignals 为 §6 中 Q19/Q20 声明的隐藏人格信号，与 §9 的触发规则互为冗余。
 * 已知冲突：§6 声明 Q19-A 增加“鸡不可失”信号，但 §9.5 的触发规则只认 Q18-A。
 * 本实现以 §9 触发规则为准（§9 为判定章节），同时保留 signals 数据以便追溯。
 */

/** @typedef {'E'|'I'|'S'|'N'|'T'|'F'|'J'|'P'} DimensionKey */

/**
 * @typedef {Object} AnswerOption
 * @property {string} id
 * @property {string} text
 * @property {Array<[DimensionKey, number]>} scores
 * @property {string[]} [behaviorTags]
 * @property {string[]} [hiddenSignals]
 */

/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {number} order 1-based
 * @property {string} prompt
 * @property {'EI'|'SN'|'TF'|'JP'|'MIXED'|'HIDDEN'} primaryDimension
 * @property {AnswerOption[]} options
 */

/** 维度核心题区间（§6.1）：用于同分决胜时统计 +3 答案数量 */
export const DIMENSION_CORE_QUESTIONS = {
  EI: [1, 2, 3, 4],
  SN: [5, 6, 7, 8],
  TF: [9, 10, 11, 12],
  JP: [13, 14, 15, 16],
};

/** @param {string} id @param {string} text @param {Array<[DimensionKey, number]>} scores @param {string[]} [behaviorTags] @param {string[]} [hiddenSignals] */
const opt = (id, text, scores, behaviorTags = [], hiddenSignals = []) => ({
  id,
  text,
  scores,
  behaviorTags,
  hiddenSignals,
});

/** @type {Question[]} */
export const questions = [
  {
    id: 'q1',
    order: 1,
    prompt: '走进麦当劳，你最想坐在哪里？',
    primaryDimension: 'EI',
    options: [
      opt('q1a', '大桌，最好能坐下一群人。', [['E', 3]]),
      opt('q1b', '靠近取餐区，热闹一点也没关系。', [['E', 2]]),
      opt('q1c', '靠窗双人位，适合安静聊天。', [['I', 1]]),
      opt('q1d', '角落单人位，最好还有插座。', [['I', 3]]),
    ],
  },
  {
    id: 'q2',
    order: 2,
    prompt: '朋友在群里发来一张麦当劳优惠券，你会？',
    primaryDimension: 'EI',
    options: [
      opt('q2a', '立刻问一句：“今晚谁去？”', [['E', 3]]),
      opt('q2b', '转发给几个可能需要的人。', [['E', 2], ['F', 1]], ['care']),
      opt('q2c', '默默领取，有需要时再用。', [['I', 2]]),
      opt('q2d', '截图保存，不参与群聊。', [['I', 3]]),
    ],
  },
  {
    id: 'q3',
    order: 3,
    prompt: '四个人一起吃麦乐鸡时，你通常会？',
    primaryDimension: 'EI',
    options: [
      opt('q3a', '主动把鸡块和酱料分好。', [['E', 2], ['J', 1]], ['takeover']),
      opt('q3b', '发起“哪种蘸酱最好吃”的讨论。', [['E', 3]]),
      opt('q3c', '别人递给你时再拿。', [['I', 2]]),
      opt('q3d', '提前留好自己的那一份。', [['I', 3]]),
    ],
  },
  {
    id: 'q4',
    order: 4,
    prompt: '取餐还要等五分钟，你更可能？',
    primaryDimension: 'EI',
    options: [
      opt('q4a', '和同行的人继续聊。', [['E', 3]]),
      opt('q4b', '看看附近有没有人点了相同产品。', [['E', 1], ['S', 1]]),
      opt('q4c', '找个位置安静等候。', [['I', 2]]),
      opt('q4d', '戴上耳机，暂时进入自己的世界。', [['I', 3]]),
    ],
  },
  {
    id: 'q5',
    order: 5,
    prompt: '点餐屏首页出现一款造型特别的新品，你会？',
    primaryDimension: 'SN',
    options: [
      opt('q5a', '先看配料、分量和实物图。', [['S', 2]]),
      opt('q5b', '想象不同食材组合起来是什么味道。', [['N', 3]], ['research', 'tryNew']),
      opt('q5c', '还是点已经吃过很多次的产品。', [['S', 3]]),
      opt('q5d', '搜索一下有没有特别吃法。', [['N', 2]], ['research', 'tryNew']),
    ],
  },
  {
    id: 'q6',
    order: 6,
    prompt: '常点的汉堡突然售罄，你会？',
    primaryDimension: 'SN',
    options: [
      opt('q6a', '换成口味和配料最接近的产品。', [['S', 3]], ['directAction']),
      opt('q6b', '请店员推荐一个合适的替代品。', [['S', 2]], ['calm']),
      opt('q6c', '正好尝试完全不同的新品。', [['N', 3]], ['tryNew']),
      opt('q6d', '重新设计整套搭配。', [['N', 2], ['P', 1]], ['tryNew', 'research']),
    ],
  },
  {
    id: 'q7',
    order: 7,
    prompt: '面对几种麦乐鸡酱料，你更接近哪一种？',
    primaryDimension: 'SN',
    options: [
      opt('q7a', '永远选择已经确认好吃的那款。', [['S', 3]]),
      opt('q7b', '根据当天点的小食选择合适酱料。', [['S', 2]]),
      opt('q7c', '轮流尝试不同口味。', [['N', 2]], ['tryNew']),
      opt('q7d', '把两种酱混起来，开发自己的版本。', [['N', 3]], ['tryNew', 'research']),
    ],
  },
  {
    id: 'q8',
    order: 8,
    prompt: '你最容易记住一顿麦当劳的什么？',
    primaryDimension: 'SN',
    options: [
      opt('q8a', '某款产品的具体味道。', [['S', 3]]),
      opt('q8b', '当时坐过的位置和餐厅布局。', [['S', 2]]),
      opt('q8c', '某个有趣的产品名字或包装。', [['N', 2]]),
      opt('q8d', '吃饭时突然冒出来的奇怪想法。', [['N', 3]], ['research']),
    ],
  },
  {
    id: 'q9',
    order: 9,
    prompt: '朋友点了一个明显不划算的套餐，你会？',
    primaryDimension: 'TF',
    options: [
      opt('q9a', '直接告诉朋友更省钱的组合。', [['T', 3]], ['directAction']),
      opt('q9b', '帮朋友重新检查优惠券。', [['T', 2], ['F', 1]], ['directAction', 'calm']),
      opt('q9c', '只要朋友喜欢，就不必多说。', [['F', 3]], ['care']),
      opt('q9d', '自己再点一份大家都能分享的小食。', [['F', 2]], ['care']),
    ],
  },
  {
    id: 'q10',
    order: 10,
    prompt: '订单中少了一份薯条，你会？',
    primaryDimension: 'TF',
    options: [
      opt('q10a', '拿着订单直接找店员核对。', [['T', 3]], ['directAction']),
      opt('q10b', '先检查是不是被同桌顺手拿走了。', [['T', 2]], ['calm']),
      opt('q10c', '先看同行的人是否介意。', [['F', 2]], ['care']),
      opt('q10d', '如果大家已经够吃，可能就算了。', [['F', 3]], ['adapt']),
    ],
  },
  {
    id: 'q11',
    order: 11,
    prompt: '同行的人想尝一口你的汉堡，你会？',
    primaryDimension: 'TF',
    options: [
      opt('q11a', '可以，但最好拿别的小食交换。', [['T', 3]], ['directAction']),
      opt('q11b', '掰一部分给对方，避免直接咬。', [['T', 1], ['F', 1]]),
      opt('q11c', '直接递过去，别掉馅就行。', [['F', 2]], ['care']),
      opt('q11d', '下次干脆多点一个一起分。', [['F', 3]], ['care']),
    ],
  },
  {
    id: 'q12',
    order: 12,
    prompt: '你认为“一顿成功的麦当劳”最重要的是什么？',
    primaryDimension: 'TF',
    options: [
      opt('q12a', '价格和分量合理。', [['T', 3]]),
      opt('q12b', '出餐准确而且速度够快。', [['T', 2]]),
      opt('q12c', '同行的人都吃到喜欢的产品。', [['F', 2]], ['care']),
      opt('q12d', '吃完以后大家的心情都变好了。', [['F', 3]], ['care']),
    ],
  },
  {
    id: 'q13',
    order: 13,
    prompt: '去麦当劳之前，你一般什么时候决定吃什么？',
    primaryDimension: 'JP',
    options: [
      opt('q13a', '出发前已经选好，并领好优惠券。', [['J', 3]], ['takeover', 'directAction']),
      opt('q13b', '路上查看菜单和优惠。', [['J', 2]], ['takeover']),
      opt('q13c', '到店看到菜单再决定。', [['P', 2]], ['adapt']),
      opt('q13d', '站到点餐屏前也可能临时换。', [['P', 3]], ['adapt']),
    ],
  },
  {
    id: 'q14',
    order: 14,
    prompt: '看到优惠券即将到期，你会？',
    primaryDimension: 'JP',
    options: [
      opt('q14a', '提前安排具体哪天使用。', [['J', 3]], ['directAction']),
      opt('q14b', '加入卡包或给自己设个提醒。', [['J', 2]], ['calm']),
      opt('q14c', '到期当天突然想起来。', [['P', 2]], ['adapt']),
      opt('q14d', '过期之后才发现自己领过。', [['P', 3]], ['adapt']),
    ],
  },
  {
    id: 'q15',
    order: 15,
    prompt: '四个人准备一起点餐，你会？',
    primaryDimension: 'JP',
    options: [
      opt('q15a', '提前收集每个人的具体选择。', [['J', 3]], ['takeover']),
      opt('q15b', '先确认预算、人数和套餐数量。', [['J', 2]], ['takeover']),
      opt('q15c', '到店后大家各点各的。', [['P', 2]], ['adapt']),
      opt('q15d', '先点一部分，不够再临时增加。', [['P', 3]], ['adapt']),
    ],
  },
  {
    id: 'q16',
    order: 16,
    prompt: '吃完后突然想再来一份甜品，你会？',
    primaryDimension: 'JP',
    options: [
      opt('q16a', '原计划里没有甜品，那就不加了。', [['J', 3]]),
      opt('q16b', '看看今天已经吃了多少再决定。', [['J', 2]]),
      opt('q16c', '想吃就点，快乐不必提前预约。', [['P', 3]], ['adapt']),
      opt('q16d', '拉一个人一起点，吃不完还能分。', [['P', 2], ['E', 1]], ['care']),
    ],
  },
  {
    id: 'q17',
    order: 17,
    prompt: '刚坐下，同桌发现饮料拿错了，你会？',
    primaryDimension: 'MIXED',
    options: [
      opt('q17a', '马上拿订单去找店员更换。', [['T', 2], ['J', 2]], ['directAction']),
      opt('q17b', '先核对订单，确认是哪一步出了问题。', [['S', 2], ['T', 2]], ['calm']),
      opt('q17c', '如果口味都能接受，大家互相换一下。', [['F', 2], ['J', 1]], ['care']),
      opt('q17d', '先喝一口，说不定意外地不错。', [['N', 2], ['P', 2]], ['adapt', 'tryNew']),
    ],
  },
  {
    id: 'q18',
    order: 18,
    prompt: '麦当劳推出了一款限时新品，你更可能？',
    primaryDimension: 'MIXED',
    options: [
      opt('q18a', '上市当天约朋友一起去尝。', [['E', 2], ['N', 2]], ['tryNew']),
      opt('q18b', '看完配料、评价和价格再决定。', [['I', 1], ['T', 2], ['J', 1]], ['research']),
      opt('q18c', '如果同行的人很想吃，就陪着尝。', [['F', 2], ['J', 1]], ['care']),
      opt('q18d', '顺其自然，哪天到店想起来再点。', [['S', 1], ['P', 2]], ['adapt']),
    ],
  },
  {
    id: 'q19',
    order: 19,
    prompt: '自助点餐机突然卡住，而后面已经开始排队，你会？',
    primaryDimension: 'HIDDEN',
    options: [
      opt('q19a', '换旁边一台机器，别耽误时间。', [['P', 1], ['T', 1]], ['directAction'], ['chicken']),
      opt('q19b', '重新操作一次，确认是不是刚才点错了。', [['S', 1], ['J', 1]], ['calm'], ['calm']),
      opt('q19c', '站在原地研究机器到底卡在哪里。', [['N', 1], ['T', 1]], ['research'], ['cheese']),
      opt('q19d', '直接去人工柜台：“这个点不了，帮我下单。”', [['T', 1], ['J', 1]], ['directAction'], ['rolex']),
    ],
  },
  {
    id: 'q20',
    order: 20,
    prompt: '所有人对着菜单讨论了半天，还是没人决定吃什么。你会说？',
    primaryDimension: 'HIDDEN',
    options: [
      opt('q20a', '“你们慢慢选，我先把自己的点了。”', [['I', 1], ['P', 1]], ['adapt'], ['porridge']),
      opt('q20b', '“每个人报一个最想吃的，我来组合。”', [['E', 1], ['J', 1]], ['takeover'], ['pm']),
      opt('q20c', '“再看一下优惠券，可能答案就在里面。”', [['T', 1], ['J', 1]], ['research'], ['cheese']),
      opt('q20d', '“劳资数到三，三秒后没人说话就按我说的点。”', [['E', 1], ['J', 1]], ['takeover'], ['count3']),
    ],
  },
];

export const QUESTION_COUNT = questions.length;
