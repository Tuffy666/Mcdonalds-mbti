/**
 * 麦门人格研究所 · 8 种首发隐藏人格
 * 依据《规格书》§9 逐条录入。隐藏人格不替代主人格，每名用户最多展示 1 个。
 *
 * priority 越小优先级越高（§9.9 冲突优先级）：
 *   劳资数到三 > 劳力士 > 芝士分子 > 堡持冷静 > 鸡不可失 > 薯于你 > 麦已成粥 > 麦门项目经理
 *
 * 判定分两层：
 *   eligible    必要条件，不满足直接排除
 *   triggerScore 触发强度分，用于同优先级比较（分数相同再回落到 priority）
 */

/**
 * @typedef {Object} HiddenPersonalityConfig
 * @property {string} id
 * @property {string} name
 * @property {string} title
 * @property {string} rarityLabel 彩蛋稀有度（娱乐化设定，非真实获得率）
 * @property {number} priority
 * @property {string} declaration
 * @property {string} description
 * @property {string} keywords
 * @property {string} storeScene 麦门表现
 * @property {string} weakness
 * @property {string} shareQuote
 * @property {string} ruleText 人类可读的触发规则
 * @property {string} eggAction 解锁后建议 Agent 追加的彩蛋动作
 */

/** @type {HiddenPersonalityConfig[]} */
export const hiddenPersonalities = [
  {
    id: 'count3',
    name: '劳资数到三',
    title: '极限耐心型',
    rarityLabel: '0.02%',
    priority: 1,
    declaration: '一。二。算了，我替你们点。',
    description:
      '你不是天生没有耐心，你只是无法忍受一群人围着点餐屏说了十遍“我都可以”，却没有一个人真的可以。第一次你会询问，第二次你会总结，第三次你将直接接管现场。',
    keywords: '低决策容忍度、直接接管、讨厌无效讨论、三秒完成点餐',
    storeScene: '在第四轮“到底吃什么”之后，直接拿过手机完成下单，并顺手把取餐分工也排好。',
    weakness: '每次都说“最后问一遍”，但其实你心里早就决定好了。',
    shareQuote: '我不是脾气急，我只是不能接受点个套餐还要开四轮会议。',
    ruleText: 'Q20-D，且 Q3/Q13/Q15 中至少两题主动分配或提前决定，T 或 J 不低于 70%，接管类答案不少于 3 次。',
    eggAction: '只给一版方案，不再列备选，禁止反问第二轮。',
  },
  {
    id: 'rolex',
    name: '劳力士',
    title: '稀有耐造型',
    rarityLabel: '0.01%',
    priority: 2,
    declaration: '表可以不戴，活不能没人干。',
    description:
      '你最大的特点不是莽，而是耐用、稳定、能扛事。在别人还在判断点餐机能不能恢复时，你已经换了一台机器；发现订单少了东西，你直接拿小票去解决。你不是喜欢干活，只是觉得事情总得有人处理。',
    keywords: '任劳任怨、稳定耐造、行动力强、有问题就处理',
    storeScene: '负责下单、占座、取餐、检查漏单，最后还会问一句“垃圾谁带走？”',
    weakness: '大家都觉得你能搞定，久而久之，事情就真的全来找你了。',
    shareQuote: '我不是劳碌命，我只是看不得事情一直转圈。',
    ruleText: 'Q19-D、直接行动型答案不少于 5 次、Q6/Q10/Q17/Q19 中至少三题主动处理、中位答题时长低于 6 秒且答案不机械重复 —— 四项至少满足三项。',
    eggAction: '主动补上取餐与餐具备注，形成“一次点完、不用返工”的闭环。',
  },
  {
    id: 'cheese',
    name: '芝士分子',
    title: '知识过载型',
    rarityLabel: '0.08%',
    priority: 3,
    declaration: '别人吃吉士，你研究吉士。',
    description:
      '一顿饭结束后，你已经形成一套关于配料结构、优惠路径、蘸酱变量和口感层次的完整理论。知识可能没有尽头，但薯条的最佳赏味时间有。',
    keywords: '成分党、优惠路径、变量思维、口径严谨',
    storeScene: '会顺手拉出营养与价格对照，把“差 2 元多 90 千卡”算得明明白白。',
    weakness: '不是纠结，是样本量还不够。',
    shareQuote: '不是纠结，是样本量还不够。',
    ruleText: 'Q19-C 或 Q20-C 至少一个成立，研究型答案不少于 5 次，且 N 或 T 不低于 62%。',
    eggAction: '输出价格与营养对照，并标注数据来源 Tool。',
  },
  {
    id: 'calm',
    name: '堡持冷静',
    title: '临危不乱型',
    rarityLabel: '0.12%',
    priority: 4,
    declaration: '订单不会消失，只是命运还在后厨打包。',
    description:
      '即使取餐屏跳过号码、饮料拿错、常点产品售罄，你也倾向于先核对信息，再把事情平稳处理。别人负责着急，你负责把小票找出来。',
    keywords: '先核对再处理、情绪稳定、按流程、不慌',
    storeScene: '取餐号被跳过时先看小票与订单状态，再决定是否找店员。',
    weakness: '别人的慌，经常是你来收拾。',
    shareQuote: '堡持冷静，先看订单。',
    ruleText: 'Q19-B，且 Q6/Q10/Q17 中至少两题核对或稳妥处理，T 不低于 55%。',
    eggAction: '下单前先复述订单与取餐方式，再给出支付链接。',
  },
  {
    id: 'chicken',
    name: '鸡不可失',
    title: '机会捕手型',
    rarityLabel: '0.18%',
    priority: 5,
    declaration: '新品要尝，限时鸡翅不能等活动结束后再后悔。',
    description:
      '你对“限时”“新品”“今日截止”有极快反应。机会可以再来，但限定口味和当天优惠不一定。',
    keywords: '限时敏感、新品首发、先尝再说、错过焦虑',
    storeScene: '新品上市当天就到店，并顺手把当期限定一起点上。',
    weakness: '错过的不一定可惜，但你会一直记得。',
    shareQuote: '机可以再等，鸡不可失。',
    ruleText: 'Q18-A，且 Q5/Q6/Q7 中至少两题尝鲜型答案，N 或 P 不低于 65%。',
    eggAction: '菜单中存在限时/新品标签时，优先并入套餐并说明限时原因。',
  },
  {
    id: 'fries',
    name: '薯于你',
    title: '天选饭搭子型',
    rarityLabel: '0.25%',
    priority: 6,
    declaration: '不是所有薯条都愿意被分享，但这一根“薯于”你。',
    description:
      '你把喜欢表达得很具体：递过去的一根薯条、顺手多拿的一张纸巾、给迟到朋友留下的一份小食。你不一定说很多漂亮话，但会让同桌的人被照顾到。',
    keywords: '具象关心、主动分享、留给别人、饭搭子',
    storeScene: '点单时顺手加上一份大家都能拿的小食，并记得给晚到的人留一份。',
    weakness: '分享是本能，界限要自己说。',
    shareQuote: '我的最后一根薯条，已经有“薯”了。',
    ruleText: 'F 不低于 70%，且 Q9/Q11/Q12/Q16 中至少三题分享或照顾型答案。',
    eggAction: '优先推荐可分享装，并在备注中体现给同伴留份。',
  },
  {
    id: 'porridge',
    name: '麦已成粥',
    title: '接受现实型',
    rarityLabel: '0.30%',
    priority: 7,
    declaration: '券忘了用，薯条已经凉，算了，麦已成粥。',
    description:
      '你不是没有计划，只是很擅长与已经发生的事情和平相处。饮料拿错能喝就喝，优惠券过期就等下一张，来都来了，先吃吧。',
    keywords: '接受现状、临场应变、不内耗、来都来了',
    storeScene: '发现优惠没用上也不返工，先把这一顿吃舒服。',
    weakness: '算了说多了，别人会以为你不在意。',
    shareQuote: '麦已成粥，来都来了。',
    ruleText: 'Q20-A，且接受现状、随机应变型答案不少于 5 次，P 不低于 60%。',
    eggAction: '只提示一次优惠差异，不反复劝说用户改单。',
  },
  {
    id: 'pm',
    name: '麦门项目经理',
    title: '组织点单型',
    rarityLabel: '0.50%',
    priority: 8,
    declaration: '请大家今天 11:30 前提交最终套餐需求。',
    description:
      '你能把一次普通聚餐做出项目启动会的秩序感。人数、预算、忌口、优惠券、取餐分工，你已经列出了完整清单。',
    keywords: '清单化、需求收集、分工明确、进度可视',
    storeScene: '把多人点单拆成需求收集、预算确认、下单、取餐四个环节。',
    weakness: '把一顿饭当项目管理，久了会累。',
    shareQuote: '不回复默认同意，变更需求请在下单前提出。',
    ruleText: 'Q20-B，且 Q3-A、Q13-A/B、Q15-A/B 中至少三项成立，J 不低于 68%。',
    eggAction: '输出带责任人的取餐分工清单。',
  },
];

/** 主人格 × 隐藏人格 反差解释（§9.10），未配置的组合使用通用模板 */
export const CONTRAST_PAIRS = {
  'INTP+rolex': '脑子里研究了八种方案，最终发现还是自己动手最快。',
  'ISFJ+count3': '平时什么都可以，直到大家第三次问“到底吃什么”。',
  'ENTJ+fries': '可以控制全场，但最后一根薯条还是会留给别人。',
  'ISTJ+chicken': '平时坚持经典，遇到限时新品却突然背叛固定套餐。',
  'ESFP+calm': '表面上全场最热闹，订单出问题时反而最冷静。',
};

export const CONTRAST_FALLBACK = '你的主人格负责日常出场，隐藏人格只在特定麦门时刻突然接管。';

/** @param {string} mbti @param {string|undefined|null} hiddenId */
export function getContrastText(mbti, hiddenId) {
  if (!hiddenId) return '';
  return CONTRAST_PAIRS[`${mbti}+${hiddenId}`] || CONTRAST_FALLBACK;
}

/** 简易提示：仅 Q20-D 成立但其余条件不足（§9.2） */
export const COUNT3_HINT = '你嘴上已经数到三，实际上最后还是等了大家十分钟。';
