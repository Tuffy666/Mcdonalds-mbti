/**
 * 麦门人格研究所 · 16 种主人格完整配置
 * 依据《规格书》§5（映射表）与 §8（完整结果文案）逐条录入。
 * 文案为产品核心资产，任何修改都需要同步更新 personalityVersion。
 */

/**
 * @typedef {'NT'|'NF'|'SJ'|'SP'} PersonalityGroup
 * @typedef {Object} PersonalityConfig
 * @property {string} type
 * @property {string} product
 * @property {string} title
 * @property {PersonalityGroup} group
 * @property {string} declaration
 * @property {string} description
 * @property {string[]} dailyTraits
 * @property {string} weakness
 * @property {string} misunderstood
 * @property {string} bestMatchType
 * @property {string} bestMatchText
 * @property {string} shareQuote
 * @property {string} themeColor
 * @property {string} image
 * @property {string[]} mealKeywords 用于 MCP 选品的人格关键词
 */

/** 分组主题色（§11.1）：NT 红橙 / NF 粉紫 / SJ 蓝绿 / SP 明黄 */
export const GROUP_THEME = {
  NT: { label: '脑力麦霸组 NT', color: '#D92D20', accent: '#FFC72C' },
  NF: { label: '情绪价值组 NF', color: '#8D63B8', accent: '#F8B4D9' },
  SJ: { label: '稳定出餐组 SJ', color: '#659B5E', accent: '#4E9BD8' },
  SP: { label: '即时快乐组 SP', color: '#FFC72C', accent: '#D92D20' },
};

/** 主人格与最佳饭搭子成对映射（§8 内文一致） */
/** @type {Record<string, PersonalityConfig>} */
export const personalities = {
  ENTJ: {
    type: 'ENTJ',
    product: '巨无霸',
    title: '全场控局型',
    group: 'NT',
    declaration: '都别研究了，套餐我已经搭好了。',
    description:
      '你的存在感不靠大声，而靠一种“这件事交给我”的确定感。四个人站在点餐屏前犹豫十分钟，你通常已经完成需求统计、套餐优化和最终下单。你像巨无霸，不满足于只有一层。目标、效率、结果，一个都不能少。',
    dailyTraits: [
      '主动问清几个人、吃什么、几点到；',
      '能用最短时间结束“到底点什么”的讨论；',
      '不接受“随便”，因为“随便”往往最难处理；',
      '取餐号还没叫到，已经安排好谁拿饮料。',
    ],
    weakness: '偶尔只是想安静吃个汉堡，最后还是莫名其妙成了饭局负责人。',
    misunderstood: '你不是非要控制全场，只是实在看不下去所有人在点餐页面来回滑动。',
    bestMatchType: 'ISFP',
    bestMatchText: 'ISFP 圆筒冰淇淋型。一个负责安排，一个负责提醒生活不必每次都像开项目会。',
    shareQuote: '我不是爱管，我只是不想看你们选到早餐时段结束。',
    themeColor: GROUP_THEME.NT.color,
    image: 'assets/personalities/entj-big-mac.svg',
    mealKeywords: ['大份量', '套餐组合', '效率优先', '主食必须顶'],
  },
  ENTP: {
    type: 'ENTP',
    product: '麦辣鸡腿汉堡',
    title: '反套路加辣型',
    group: 'NT',
    declaration: '正常答案我知道，但我偏要看看还能怎么点。',
    description:
      '你对“大家都这么选”天然有一点怀疑。别人研究套餐划不划算，你研究能不能换配餐、叠优惠、开发隐藏吃法。你像麦辣鸡腿汉堡，第一口就表明态度，观点鲜明，反应迅速，还自带一点令人上头的刺激感。',
    dailyTraits: [
      '新品一出现，先研究配方和网友评价；',
      '喜欢提出一个没人想过的点单组合；',
      '一边说只吃一点，一边参与每份小食；',
      '能把“甜酸酱还是蒜香酱”辩成正式议题。',
    ],
    weakness: '脑子里已经试过八种搭配，现实中还没有按下付款键。',
    misunderstood: '你不一定想反对，只是想确认这件事是否真的没有第二种可能。',
    bestMatchType: 'ISFJ',
    bestMatchText: 'ISFJ 麦香鸡型。对方提供稳定，你负责让每一顿都不像复制粘贴。',
    shareQuote: '麦辣不是口味，是我对平庸的最低限度反抗。',
    themeColor: GROUP_THEME.NT.color,
    image: 'assets/personalities/entp-mcspicy.svg',
    mealKeywords: ['限时新品', '加辣', '隐藏吃法', '换配餐'],
  },
  INTJ: {
    type: 'INTJ',
    product: '双层吉士汉堡',
    title: '低调加码型',
    group: 'NT',
    declaration: '看起来没变，其实我已经升级了两层。',
    description:
      '你并不热衷于让所有人知道自己在想什么。别人还在看菜单，你已在脑内完成价格、饱腹感、等待时间和踩雷风险的综合评估。你像双层吉士汉堡，外表克制，内部加码。',
    dailyTraits: [
      '有固定选择，但会默默优化固定选择；',
      '不喜欢站在柜台前临时开会；',
      '下单前已经提前看好优惠券；',
      '对低效率的点餐流程有清晰改进意见。',
    ],
    weakness: '计划里连“随便吃点”都有最优方案。',
    misunderstood: '你不是没有情绪，只是觉得情绪也可以稍后统一处理。',
    bestMatchType: 'ESFP',
    bestMatchText: 'ESFP 薯条型。一个提供规划，一个负责把规划之外的快乐递过来。',
    shareQuote: '我没有选择困难，我只是在计算最优解。',
    themeColor: GROUP_THEME.NT.color,
    image: 'assets/personalities/intj-double-cheese.svg',
    mealKeywords: ['加芝士', '双层加码', '高性价比', '少废话'],
  },
  INTP: {
    type: 'INTP',
    product: '麦乐鸡',
    title: '蘸酱研究型',
    group: 'NT',
    declaration: '先别吃，我想验证不同蘸酱会不会改变结论。',
    description:
      '你的快乐来自拆解、比较和组合。五块麦乐鸡在别人眼里是五块麦乐鸡，在你眼里是五次独立实验机会。一个问题越复杂，你越容易进入状态。',
    dailyTraits: [
      '对不同酱料组合抱有严谨好奇；',
      '点餐前看很久，不代表真的纠结；',
      '经常突然提出一个奇怪但有道理的问题；',
      '可能忘记取饮料，却记得每种蘸法的区别。',
    ],
    weakness: '把所有可能性都想清楚后，薯条已经凉了。',
    misunderstood: '你不是拖延，只是觉得信息还有收集空间。',
    bestMatchType: 'ESFJ',
    bestMatchText: 'ESFJ 薯饼型。对方会在你继续研究之前，提醒你趁热吃。',
    shareQuote: '麦乐鸡只有五块，但我的思路不止五种。',
    themeColor: GROUP_THEME.NT.color,
    image: 'assets/personalities/intp-mcnuggets.svg',
    mealKeywords: ['多酱料组合', '小份试错', '可对比', '方便拆解'],
  },
  ENFJ: {
    type: 'ENFJ',
    product: '板烧鸡腿堡',
    title: '全员照顾型',
    group: 'NF',
    declaration: '你不能吃辣对吧？我记得。',
    description:
      '你很少只考虑自己吃什么。谁不能吃辣、谁最近想吃清淡一点、谁想尝新品，你通常都记得。你像板烧鸡腿堡，温和、稳妥，却并不无聊。',
    dailyTraits: [
      '第一个问大家有没有忌口；',
      '主动把纸巾、吸管和酱料分给所有人；',
      '发现有人没吃饱，会自然地把小食推过去；',
      '常说“我都可以”，但其实一直在照顾全局。',
    ],
    weakness: '照顾了所有人的口味，最后才发现自己最想吃的没有点。',
    misunderstood: '你的体贴不是没有主见，而是你的主见里本来就包含别人。',
    bestMatchType: 'ISTP',
    bestMatchText: 'ISTP 麦麦脆汁鸡型。你负责读懂人，对方负责解决现场问题。',
    shareQuote: '套餐可以少一个，但谁都不能被落下。',
    themeColor: GROUP_THEME.NF.color,
    image: 'assets/personalities/enfj-grilled-chicken.svg',
    mealKeywords: ['不辣友好', '可分享', '照顾忌口', '温和口味'],
  },
  ENFP: {
    type: 'ENFP',
    product: '奥利奥麦旋风',
    title: '快乐搅拌型',
    group: 'NF',
    declaration: '本来只想坐十分钟，怎么聊到甜品站关门了？',
    description:
      '你像麦旋风，能把原本普通的一天搅出很多新东西。灵感、话题、临时计划，都可能因为你突然出现。你不一定最有计划，但往往最能让大家记住这一顿。',
    dailyTraits: [
      '一进店就被新品海报吸引；',
      '会突然提议再加一份甜品；',
      '没人说话时，总能开启新话题；',
      '点单时说听大家的，最后又发现一个新选择。',
    ],
    weakness: '每个新想法都很真诚，包括那些第二天已经忘记的想法。',
    misunderstood: '你不是三分钟热度，你只是同时对很多事情都有温度。',
    bestMatchType: 'ISTJ',
    bestMatchText: 'ISTJ 吉士汉堡型。对方守住基本盘，你负责给基本盘撒点奥利奥碎。',
    shareQuote: '我的计划可能会化，但我的快乐最好现在就吃。',
    themeColor: GROUP_THEME.NF.color,
    image: 'assets/personalities/enfp-oreo-mcflurry.svg',
    mealKeywords: ['甜品收尾', '限时口味', '分享型', '快乐优先'],
  },
  INFJ: {
    type: 'INFJ',
    product: '麦香鱼',
    title: '深海共鸣型',
    group: 'NF',
    declaration: '不是所有人都懂，但懂的人会一直点。',
    description:
      '你不依赖成为多数人的选择。比起热闹，你更重视少数真正理解你的人。你像麦香鱼，气质温和，立场却很稳定。',
    dailyTraits: [
      '喜欢靠窗或比较安静的位置；',
      '会观察同桌每个人是否自在；',
      '不一定说很多，但经常听得最认真；',
      '对某个冷门产品有长期而坚定的偏爱。',
    ],
    weakness: '别人只是问你甜酸酱还是蒜香酱，你已经想到了关系中的选择与错过。',
    misunderstood: '安静不等于没有答案，你只是觉得没有必要把所有答案都说出来。',
    bestMatchType: 'ESTP',
    bestMatchText: 'ESTP 麦辣鸡翅型。对方把你拉回现场，你让对方偶尔看看更深的地方。',
    shareQuote: '热门只是很多人点，喜欢才是我会一直点。',
    themeColor: GROUP_THEME.NF.color,
    image: 'assets/personalities/infj-filet-o-fish.svg',
    mealKeywords: ['冷门经典', '清淡', '安静搭配', '不跟风'],
  },
  INFP: {
    type: 'INFP',
    product: '香芋派',
    title: '外酥内软型',
    group: 'NF',
    declaration: '我没有想太多，我只是每一口都有感受。',
    description:
      '你对细节、氛围和意义非常敏感。一张特别的小票、一个熟悉的座位、一款突然回归的产品，都可能让你产生完整的故事。你像香芋派，外面看着有边界，里面却柔软得很具体。',
    dailyTraits: [
      '会因为包装或名字对一款产品产生好感；',
      '喜欢保留别人觉得没有用的小票或贴纸；',
      '很难接受真正喜欢的产品下架；',
      '点甜品时常带有“今天值得被安慰”的理由。',
    ],
    weakness: '派还没有凉，你已经开始怀念这一顿了。',
    misunderstood: '你不是脆弱，只是对世界的接收器开得比较大。',
    bestMatchType: 'ESTJ',
    bestMatchText: 'ESTJ 那么大鸡排型。一个守护理想，一个负责把理想变成已经下好的订单。',
    shareQuote: '我的外壳可以很酥，但请不要随便戳我的馅。',
    themeColor: GROUP_THEME.NF.color,
    image: 'assets/personalities/infp-taro-pie.svg',
    mealKeywords: ['甜点情绪价值', '小小仪式感', '季节限定', '慢慢吃'],
  },
  ESTJ: {
    type: 'ESTJ',
    product: '那么大鸡排',
    title: '结果导向型',
    group: 'SJ',
    declaration: '能一口说明白的事，不要讨论三轮。',
    description:
      '你对清楚、直接、到位有天然偏好。点餐时最受不了的不是排队，而是排到了还不知道吃什么。你像那么大鸡排，表达直接，分量明确，只负责让结果落地。',
    dailyTraits: [
      '负责催大家把最终选择发到群里；',
      '能快速识别哪个套餐更合适；',
      '取餐后会检查有没有漏东西；',
      '发现问题时直接找店员解决，不在原地猜。',
    ],
    weakness: '偶尔只是想做个普通食客，最后又开始检查订单。',
    misunderstood: '你并非没有耐心，你只是希望耐心能投入到更值得的地方。',
    bestMatchType: 'INFP',
    bestMatchText: 'INFP 香芋派型。对方提醒你体验过程，你帮助对方别把选择留到打烊。',
    shareQuote: '别问吃什么了，我已经下单了。',
    themeColor: GROUP_THEME.SJ.color,
    image: 'assets/personalities/estj-chicken-steak.svg',
    mealKeywords: ['大份实在', '一份搞定', '出餐快', '不折腾'],
  },
  ESFJ: {
    type: 'ESFJ',
    product: '薯饼',
    title: '温暖投喂型',
    group: 'SJ',
    declaration: '我顺便给你也带了一份。',
    description:
      '你表达关心的方式非常具体。不是“照顾好自己”，而是“薯饼趁热吃”；不是“下次见”，而是“明早我帮你一起带”。',
    dailyTraits: [
      '记得谁喜欢什么酱；',
      '会提前问迟到的人需不需要带餐；',
      '取餐时顺手多拿几张纸巾；',
      '大家都吃完后，你还在确认有没有人没吃饱。',
    ],
    weakness: '别人一句“都行”，可能让你认真考虑很久怎样才算大家都行。',
    misunderstood: '你的周到不是理所当然，而是你主动把别人放进自己的考虑范围。',
    bestMatchType: 'INTP',
    bestMatchText: 'INTP 麦乐鸡型。你提醒对方生活，对方为你开发一套新蘸法。',
    shareQuote: '我的喜欢不是嘴上说，是趁热给你带一份。',
    themeColor: GROUP_THEME.SJ.color,
    image: 'assets/personalities/esfj-hash-brown.svg',
    mealKeywords: ['早餐场景', '多带一份', '趁热', '照顾同伴'],
  },
  ISTJ: {
    type: 'ISTJ',
    product: '吉士汉堡',
    title: '经典可靠型',
    group: 'SJ',
    declaration: '不用花哨，稳定好吃就够了。',
    description:
      '你相信经过时间验证的东西。你不抗拒变化，只是不认为每一次变化都值得付出试错成本。你像吉士汉堡，看似基础，却拥有极强的确定性。',
    dailyTraits: [
      '有一套固定且成熟的点单组合；',
      '不理解为什么有人站到点餐机前才开始思考；',
      '会保存真正有用的优惠券；',
      '对“每次味道都差不多”评价很高。',
    ],
    weakness: '菜单只是调整了一个位置，你也需要重新适应几次。',
    misunderstood: '你不是无趣，你只是不为显得特别而放弃可靠。',
    bestMatchType: 'ENFP',
    bestMatchText: 'ENFP 麦旋风型。对方带来惊喜，你保证惊喜不会变成事故。',
    shareQuote: '新品有新品的理由，经典有经典的实力。',
    themeColor: GROUP_THEME.SJ.color,
    image: 'assets/personalities/istj-cheeseburger.svg',
    mealKeywords: ['经典固定组合', '稳定口味', '用券', '不试错'],
  },
  ISFJ: {
    type: 'ISFJ',
    product: '麦香鸡',
    title: '安静守候型',
    group: 'SJ',
    declaration: '你们先点，我都能配合。',
    description:
      '你很少抢着成为焦点，却经常是默默补齐所有细节的人。谁没有纸巾、谁忘了拿酱、谁还没找到座位，你通常最先注意到。',
    dailyTraits: [
      '自己的需求可以很简单；',
      '会替同桌看好包和外套；',
      '有人不舒服时，会主动询问需要什么；',
      '分享小食时总是让别人先拿。',
    ],
    weakness: '太习惯说“没事”，以至于别人有时真的以为你没事。',
    misunderstood: '你不是没有偏好，只是不希望自己的偏好给别人造成麻烦。',
    bestMatchType: 'ENTP',
    bestMatchText: 'ENTP 麦辣鸡腿汉堡型。对方替你把观点说出来，你让对方的观点不至于太辣。',
    shareQuote: '我没有站在最中间，但你回头时我通常还在。',
    themeColor: GROUP_THEME.SJ.color,
    image: 'assets/personalities/isfj-mchicken.svg',
    mealKeywords: ['简单实用', '不抢风头', '配合度高', '温和'],
  },
  ESTP: {
    type: 'ESTP',
    product: '麦辣鸡翅',
    title: '先冲再说型',
    group: 'SP',
    declaration: '先点，吃不吃得完等会儿再研究。',
    description:
      '你相信现场感受胜过过度预演。新品辣不辣、组合好不好吃，与其看十条评价，不如自己尝一口。你像麦辣鸡翅，反应快、冲击直接。',
    dailyTraits: [
      '新品上市当天就想试；',
      '可以在一分钟内完成点单；',
      '看到有趣活动，先参加再看详细规则；',
      '别人还在讨论，你已经吃到第二块。',
    ],
    weakness: '手比脑子快，付款成功后才发现券没有用。',
    misunderstood: '你不是不考虑后果，只是相信多数后果可以现场处理。',
    bestMatchType: 'INFJ',
    bestMatchText: 'INFJ 麦香鱼型。一个带来行动，一个给行动增加一点深度。',
    shareQuote: '犹豫不会让鸡翅更脆，趁热才会。',
    themeColor: GROUP_THEME.SP.color,
    image: 'assets/personalities/estp-mcspicy-wings.svg',
    mealKeywords: ['现点现吃', '辣', '限时', '立刻下单'],
  },
  ESFP: {
    type: 'ESFP',
    product: '薯条',
    title: '全场人气型',
    group: 'SP',
    declaration: '我本来没想点，但大家都可以吃一点。',
    description:
      '你很容易让场面轻松下来。你不一定刻意活跃气氛，但大家和你待在一起时，话题常常自然地多起来。你像薯条，适配大多数场合，也经常被所有人顺手拿一根。',
    dailyTraits: [
      '主动分享，也容易被默认会分享；',
      '喜欢坐在方便聊天的位置；',
      '别人的餐也想尝一口；',
      '一顿普通快餐，有你就会变得更像聚会。',
    ],
    weakness: '太受欢迎，有时自己的那一份会突然只剩一半。',
    misunderstood: '你的随和不是没有边界。“可以拿一根”和“可以吃一半”是两回事。',
    bestMatchType: 'INTJ',
    bestMatchText: 'INTJ 双层吉士汉堡型。一个让现场更快乐，一个确保薯条不会被无计划消耗完。',
    shareQuote: '我可以分享快乐，但请不要顺便分享完我的薯条。',
    themeColor: GROUP_THEME.SP.color,
    image: 'assets/personalities/esfp-fries.svg',
    mealKeywords: ['分享装', '大家都爱', '聚会场景', '多点一份'],
  },
  ISTP: {
    type: 'ISTP',
    product: '麦麦脆汁鸡',
    title: '动手解决型',
    group: 'SP',
    declaration: '别急，让我先看看取餐号。',
    description:
      '别人讨论问题时，你通常已经开始检查问题。少了酱料、饮料拿错、桌子不稳，你不太喜欢长篇分析，处理掉就行。你的关心经常长得像一个已经解决的问题。',
    dailyTraits: [
      '自助点餐机卡住时，很自然地开始排查；',
      '看到桌子晃，会找东西垫平；',
      '不喜欢低效率沟通；',
      '帮别人解决后，只说一句“好了”。',
    ],
    weakness: '能修好现场几乎所有问题，但不一定知道怎么回应一句“我今天状态不好”。',
    misunderstood: '你不是冷淡，你只是更习惯直接做点什么。',
    bestMatchType: 'ENFJ',
    bestMatchText: 'ENFJ 板烧鸡腿堡型。对方处理情绪，你处理设备和订单。',
    shareQuote: '少说两句，取餐码给我。',
    themeColor: GROUP_THEME.SP.color,
    image: 'assets/personalities/istp-crispy-chicken.svg',
    mealKeywords: ['单手吃', '高效解决', '到店取餐', '不复杂'],
  },
  ISFP: {
    type: 'ISFP',
    product: '圆筒冰淇淋',
    title: '随心融化型',
    group: 'SP',
    declaration: '今天想吃，那今天就是合适的日子。',
    description:
      '你很重视当下真实的感受。别人觉得现在吃冰淇淋不合理，你更在意自己是否真的想要。你不喜欢被定义，也不喜欢把所有快乐都推迟到以后。',
    dailyTraits: [
      '容易被当天的天气和状态影响选择；',
      '比起套餐逻辑，更在意此刻真正想吃什么；',
      '对产品呈现和包装细节很敏感；',
      '不争着说服别人，但也不轻易改变真实偏好。',
    ],
    weakness: '想再考虑一下，结果冰淇淋已经开始化了。',
    misunderstood: '随性不是没有原则，你只是把感受也当作重要信息。',
    bestMatchType: 'ENTJ',
    bestMatchText: 'ENTJ 巨无霸型。一个负责方向，一个负责提醒方向之外还有风景。',
    shareQuote: '快乐不需要论证，但冰淇淋需要趁早。',
    themeColor: GROUP_THEME.SP.color,
    image: 'assets/personalities/isfp-cone.svg',
    mealKeywords: ['甜品优先', '当下感受', '小份即可', '看天气'],
  },
};

export const PERSONALITY_TYPES = Object.keys(personalities);
export const GROUP_ORDER = ['NT', 'NF', 'SJ', 'SP'];
