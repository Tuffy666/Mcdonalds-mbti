# 麦门人格研究所 · Maimen Personality Institute

> 20 道麦门情境题，测出你在麦当劳里是哪一种人格；再把这份人格档案交给 WorkBuddy + 麦当劳 MCP，
> 用**你附近门店的实时菜单**生成一份能真正下单的「今日人格套餐」。

[![tests](https://img.shields.io/badge/tests-12%20passed-brightgreen)](#-测试)
[![build](https://img.shields.io/badge/build-vite%205-blue)](#-本地运行)
[![license](https://img.shields.io/badge/license-非商业参赛作品-orange)](#-版权与合规)

**参赛作品** · 麦当劳程序员创意开发大赛（M-CODE）· 基于麦当劳 MCP 构建的 Agent Skill
**非官方产品**，与麦当劳及其关联公司不存在商业合作、授权或隶属关系。

---

## 目录

- [这是什么](#-这是什么)
- [目标用户](#-目标用户)
- [核心流程](#-核心流程)
- [本地运行](#-本地运行)
- [使用示例](#-使用示例)
- [项目结构](#-项目结构)
- [人格体系与计分规则](#-人格体系与计分规则)
- [与麦当劳 MCP 的集成](#-与麦当劳-mcp-的集成)
- [测试](#-测试)
- [部署](#-部署)
- [已知配置冲突与处理方式](#-已知配置冲突与处理方式)
- [版权与合规](#-版权与合规)

---

## 🍔 这是什么

人格测试类内容有一个共同的断点：**测完就结束**。用户笑一句“还挺准”，然后关掉页面，什么都没发生。

本项目把这条链路补完了：

```text
20 道麦门情境题
      ↓
四维计分 → 16 种主人格之一（+ 最多 1 个隐藏人格彩蛋）
      ↓
生成结构化「麦门人格档案」（PersonalityProfile）
      ↓
WorkBuddy + 麦当劳 MCP：实时门店 → 实时菜单 → 先算无券价 → 授权后领券算到手价 → 确认后下单
      ↓
一份「今日人格套餐」吃到嘴里
```

两个可独立使用的部分：

| 部分 | 是什么 | 需要 MCP Token 吗 |
|---|---|---|
| **H5 小游戏** | React + TypeScript + Vite 的纯前端测试，无后端、无登录、无 AI 接口 | 不需要，完全离线可玩 |
| **Agent Skill** | `SKILL.md` + 确定性选品引擎，把人格档案翻译成可下单的菜单 | 需要（麦当劳 MCP） |

## 👥 目标用户

1. **喜欢 MBTI / 人格测试 / 谐音梗的轻社交用户** —— 想测完能截图、能发群、能对号入座。
2. **到了麦当劳但不知道吃什么的打工人和学生** —— 想直接拿到一份“有理由的”点单方案，而不是再刷十分钟菜单。
3. **使用 WorkBuddy / Cursor 等 MCP 客户端的开发者** —— 想看一个“内容型 Skill 如何接上真实业务能力”的完整参考实现。
4. **一起点餐的小团队** —— 多人场景下有分享装、套餐组合与取餐分工的明确建议。

主要使用手机浏览器访问（设计基准 390 × 844），兼容桌面端。

## 🔁 核心流程

| 页面 | 路由 | 干什么 |
|---|---|---|
| 首页 | `/` | 介绍、开始测试、继续上次测试、进入图鉴 |
| 答题页 | `/quiz` | 4 个大选项、自动进下一题、可返回修改、刷新可恢复 |
| 计算页 | `/calculating` | 1.5～2 秒结果动画（4 段文案） |
| 结果页 | `/result` | 主人格、四维、隐藏人格、分享金句、结果卡导出、人格档案复制 |
| 人格图鉴 | `/gallery` | 16 型人格总览，按 NT / NF / SJ / SP 分组 |
| 人格详情 | `/gallery/:type` | 单个人格完整文案与最佳饭搭子互链 |
| 测试说明 | `/about` | 计分说明、数据说明、完整免责声明、版本信息 |
| 开发调试器 | `/debug` | **仅开发环境**，强制预览 16+8 种结果、导出 JSON、模拟同分 |

## 🚀 本地运行

环境要求：Node.js ≥ 18（本项目在 Node 22.22.2 上验证通过）。

```bash
git clone <你的仓库地址>
cd maimen-personality-mcp

npm install          # 安装依赖
npm run dev          # 启动开发服务器，默认 http://localhost:5173
```

其他命令：

```bash
npm test             # 运行计分引擎单元测试（12 项）
npm run validate     # 校验人格配置（题量/选项数/分值/产品唯一性/文案完整性…）
npm run e2e          # 无头 Chrome 端到端冒烟测试（需先 npm run build && npm run preview）
npm run build        # 类型检查 + 生产构建，产物在 dist/
npm run preview      # 本地预览生产构建
node scripts/generate-assets.mjs   # 重新生成 16 张原创占位插画
```

> 如果 `npm install` 之后 `vite` 报找不到 `@esbuild/win32-x64` 或 `@rollup/rollup-win32-x64-msvc`，
> 那是 npm 对 optionalDependencies 的已知问题，执行下面一行即可：
> `npm install @esbuild/win32-x64 @rollup/rollup-win32-x64-msvc --save-optional`

## 💡 使用示例

### 示例 1：只玩 H5（不需要任何 Token）

```bash
npm install && npm run dev
```

打开 `http://localhost:5173` → 开始测试 → 20 题 → 结果页。
结果页可以：保存 1080 × 1440 结果卡 PNG、复制分享文案、复制彩蛋文案、查看图鉴、重新测试。

### 示例 2：命令行直接算人格（不需要任何 Token）

```bash
# 20 个选项，A/B/C/D（也支持 0/1/2/3 或紧凑串 0123...）
node scripts/score.mjs --answers "D,C,D,C,D,D,D,D,A,A,A,B,B,B,B,B,B,B,B,C"

# 也可以直接读答案文件（含每题作答时长，会参与隐藏人格判定）
node scripts/score.mjs --answers-file examples/answers-sample.json --out profile.json
```

输出（节选）：

```json
{
  "summary": {
    "mbti": "INTJ",
    "product": "双层吉士汉堡",
    "title": "低调加码型",
    "compatibility": 93,
    "hidden": "芝士分子（彩蛋稀有度 0.08%）",
    "dimensions": {
      "EI": "E 0% / I 100% → I",
      "SN": "S 23% / N 77% → N",
      "TF": "T 100% / F 0% → T",
      "JP": "J 92% / P 8% → J"
    }
  },
  "shareText": "测完发现我是「双层吉士汉堡型 INTJ」：低调加码型。..."
}
```

### 示例 3：生成「今日人格套餐」方案（本地，不需要 Token）

```bash
node scripts/plan-meal.mjs --profile profile.json --menu examples/menu-sample.json \
  --store "示例门店（非真实门店）" --mode 堂食
```

输出：

```text
【今日人格套餐方案】INTJ 双层吉士汉堡型 · 低调加码型的今日人格套餐
门店：示例门店（非真实门店）｜就餐方式：堂食

建议单品：
1. 双层吉士汉堡（¥22） —— 本命单品：双层吉士汉堡（INTJ 低调加码型）
2. 巨无霸四件套（¥39.5） —— 计划派 92%：优先可直接下单的套餐组合，减少现场决策
3. 香芋派（¥8） —— 尝鲜派 77%：限时/新品优先并入
无券合计：¥69.5
应当避免：超大分享装、临时加购导致返工、明显溢价的单品
彩蛋动作（芝士分子）：输出价格与营养对照，并标注数据来源 Tool。
...
```

### 示例 4：完整链路（WorkBuddy + 麦当劳 MCP）

1. 到 <https://open.mcd.cn/mcp> 用手机号申请 MCP Token。
2. WorkBuddy → 左侧【专家·技能·连接器】→【连接器】→ 右上角【自定义连接器】→【配置 MCP】：

   ```json
   {
     "mcpServers": {
       "mcd-mcp": {
         "type": "streamablehttp",
         "url": "https://mcp.mcd.cn",
         "headers": { "Authorization": "Bearer YOUR_MCP_TOKEN" }
       }
     }
   }
   ```

   保存后回到【自定义连接器】把 `mcd-mcp` 启用。
3. H5 测完 → 结果页点「复制人格档案 · 生成今日人格套餐」→ 粘贴到对话框。
4. Agent 按 `SKILL.md` 执行：查时间 → 确认门店 → 拉实时菜单 → **先给无券方案** →
   问你要不要查券 → 你同意后算到手价 → 确认后下单。

> ⚠️ 本仓库**不包含任何真实 Token**。所有配置一律使用 `YOUR_MCP_TOKEN` 占位符，
> `.gitignore` 已排除 `.env`、`mcp.json`、`*.token`。

## 📁 项目结构

```text
maimen-personality-mcp/
├── README.md                   本文件
├── CONTEST_DECLARATION.md      大赛官方参赛声明（原文，未做任何修改）
├── MCP_INTEGRATION.md          MCP Server / Tool / 调用流程 / 业务价值
├── SKILL.md                    Agent Skill 主体（触发条件、执行流程、硬性边界）
├── workbuddy.md                WorkBuddy 开发对话上下文
│
├── engine/                     ★ 唯一事实来源：H5 与 CLI 共用（纯 ESM，无依赖）
│   ├── questions.mjs           20 道题、权重、行为标签、隐藏信号
│   ├── personalities.mjs       16 种主人格完整配置与文案
│   ├── hidden.mjs              8 种隐藏人格 + 反差解释 + 冲突优先级
│   ├── scoring.mjs             计分、四维、同分决胜、契合度、隐藏人格检测
│   ├── profile.mjs             人格档案（Agent 契约）与剪贴板载荷
│   ├── meal-plan.mjs           人格 → 选品的确定性策略引擎
│   ├── validate.mjs            配置校验（12 条）
│   └── versions.mjs            三套版本号 + 存储键名
│
├── scripts/
│   ├── score.mjs               答案 → 人格档案 CLI
│   ├── plan-meal.mjs           档案 + 菜单 → 套餐方案 CLI
│   ├── validate-config.mjs     配置校验 CLI
│   └── generate-assets.mjs     生成 17 张原创 SVG 插画
│
├── tests/engine.test.mjs       12 项单元测试
├── examples/                   离线可跑通的示例答案与菜单
├── public/assets/              原创 SVG（16 张人格插画 + 主视觉 + favicon）
│
└── src/                        React 18 + TypeScript + Vite 前端
    ├── App.tsx                 路由表（调试器条件注册）
    ├── pages/                  Home / Quiz / Calculating / Result / Gallery / About / Debug
    ├── components/common.tsx   插画、进度条、四维条、免责声明弹层、Toast、Page 外壳
    ├── store/quizStore.ts      Zustand + localStorage（进度 / 最新结果 / 历史 10 条）
    ├── lib/                    存储封装、图片导出、资源路径
    └── styles/global.css       设计令牌与全部样式
```

## 🧠 人格体系与计分规则

**四组维度**（前台使用麦门语言）：

| 维度 | 左侧 | 右侧 | 用户可见名称 |
|---|---|---|---|
| 社交能量 | E | I | 热闹派 / 独享派 |
| 选择方式 | S | N | 经典派 / 尝鲜派 |
| 决策依据 | T | F | 理性派 / 感受派 |
| 行动节奏 | J | P | 计划派 / 随心派 |

**计分**：强倾向 +3 / 中倾向 +2 / 弱倾向或辅助 +1；每组取分高的一侧组成四字母人格。
百分比取整后强制保证两侧之和为 100%。

**同分决胜**（三层，全程无随机数）：
该维度核心题的 `+3` 答案数量 → 更靠近题末的相关答案 → 稳定哈希（输入 `answerSequence + scoringVersion`）。
因此**同一套答案重复计算必然得到同一结果**。

**麦门契合度**：`round(clamp(74 + 平均倾向强度 × 22, 74, 96))`。
它是娱乐化展示，**不是准确率**，不代表测量精度。

**16 种主人格**（产品不重复）：巨无霸 ENTJ / 麦辣鸡腿汉堡 ENTP / 双层吉士汉堡 INTJ / 麦乐鸡 INTP /
板烧鸡腿堡 ENFJ / 奥利奥麦旋风 ENFP / 麦香鱼 INFJ / 香芋派 INFP /
那么大鸡排 ESTJ / 薯饼 ESFJ / 吉士汉堡 ISTJ / 麦香鸡 ISFJ /
麦辣鸡翅 ESTP / 薯条 ESFP / 麦麦脆汁鸡 ISTP / 圆筒冰淇淋 ISFP。

**8 种隐藏人格**（每名用户最多 1 个，条件不满足时**不随机发放**）：
劳资数到三 → 劳力士 → 芝士分子 → 堡持冷静 → 鸡不可失 → 薯于你 → 麦已成粥 → 麦门项目经理。
判定分两层：先算必要条件 `eligible`，再按 `triggerScore` 降序，同分回落优先级。
**劳力士与劳资数到三是两条完全独立的规则**：前者强调“把事情做完、耐造”，不要求 Q20-D；
后者强调“结束磨叽、接管决策”，必须 Q20-D。

具体触发条件见 `engine/scoring.mjs` 的 `evaluateHiddenRules()`，人类可读版本写在 `engine/hidden.mjs` 的 `ruleText`。

## 🔌 与麦当劳 MCP 的集成

完整说明见 **[MCP_INTEGRATION.md](./MCP_INTEGRATION.md)**，要点：

- **Server**：`mcd-mcp`（麦当劳中国官方托管，Streamable HTTP，`https://mcp.mcd.cn`）
- **核心 Tool**：`now-time-info`、`query-nearby-stores` / `delivery-query-stores`、`query-meals`、
  `query-meal-detail`、`calculate-price`、`query-store-coupons`、`available-coupons`、
  `auto-bind-coupons`、`query-my-coupons`、`list-nutrition-foods`、`create-order`、`query-order`、`cancel-order`
- **明确不用**：积分抽奖、积分商城下单、机酒预订等消耗型能力 —— 本 Skill 只做“点一顿饭”

**三段式安全顺序**（写在 `SKILL.md` 里，Agent 必须遵守）：

1. 先给**无券方案**与选择理由 → 绝不提前读券
2. 明确询问是否授权查券 → 同意后才领券、算到手价
3. 复述订单摘要 → 用户确认后才 `create-order`

**职责边界**：事实归 MCP（门店/菜单/价格/库存），偏好归本地引擎（`meal-plan.mjs`），确认权归用户。

## 🧪 测试

```bash
npm test
```

12 项全部通过，覆盖规格书 §17.2 的 10 条验收项：
| # | 用例 |
|---|---|
| 1 | 全选 E/N/T/J 倾向 → ENTJ（巨无霸） |
| 2 | 全选 I/S/F/P 倾向 → ISFP（圆筒冰淇淋） |
| 3 | 同分输入经稳定哈希后重复运行结果一致 |
| 4 | 修改答案后旧分值被替换而非累计 |
| 5 | 百分比无 `NaN`，两侧之和恒为 100 |
| 6 | 契合度恒落在 74～96 |
| 7 | Q20-D 但条件不足 → 不授予“劳资数到三”，只给轻提示 |
| 8 | 劳力士不依赖 Q20-D |
| 9 | 多隐藏人格满足时按触发分与优先级只返回一个 |
| 10 | 无隐藏人格满足时返回 `null` |
| + | 配置校验通过 / 人格档案与套餐方案可稳定生成 |

```bash
npm run validate   # ✅ 配置校验通过（同时输出 1 条已知冲突提示）
```

**端到端冒烟测试**（`npm run e2e`，12 项）：用本机 Chrome 的 DevTools Protocol 真实点完 20 题，
校验首页渲染、进入结果页、契合度与四维渲染、SPA 回退、生产构建屏蔽 `/debug`，并输出结果页截图。
不依赖 Playwright，也不用下载浏览器 —— 找得到 Chrome 或 Edge 就能跑。

## 🚢 部署

产物是纯静态站点，任意静态托管都可用。**必须配置 SPA 回退**，否则刷新 `/quiz`、`/result` 会 404。

- **Vercel**：仓库已带 `vercel.json`（含 rewrites 与静态资源缓存头），导入即可。
- **Netlify**：仓库已带 `netlify.toml`（含 `/* → /index.html` 200 重写）。
- **GitHub Pages**：设置 `base` 为仓库名后构建，并把 `dist/index.html` 复制一份为 `dist/404.html`。
- **Cloudflare Pages**：构建命令 `npm run build`，输出目录 `dist`，新建 `_redirects` 写入 `/* /index.html 200`。

## ⚠️ 已知配置冲突与处理方式

规格书里存在一处内部矛盾，我们没有默默绕过，而是记录在案并按最小改动处理：

> **冲突**：规格书 §6 的 Q19-A 说明写着「增加“鸡不可失”信号」，
> 但 §9.5 的「鸡不可失」触发规则要求必须满足 `Q18-A`，并未包含 `Q19-A`。

**处理方式**：以判定章节 §9.5 为准（§9 是规则章节，§6 是题库章节）。
同时保留 `engine/questions.mjs` 里 `q19a` 的 `hiddenSignals: ['chicken']` 数据以便追溯，
并在 `engine/validate.mjs` 中输出这条提示，`npm run validate` 会打印出来。

其他偏离规格书的地方（均为工程取舍，未改动任何题目、产品映射、结果文案与触发逻辑）：

| 项 | 规格书 | 本实现 | 原因 |
|---|---|---|---|
| 单元测试框架 | Vitest | Node 内置 `node:test` | 零额外依赖，`npm test` 开箱即用；引擎是纯 ESM，两种框架都能跑 |
| E2E 测试 | Playwright | 自写 CDP 冒烟测试（`scripts/smoke-e2e.mjs`） | 不用下载数百 MB 的浏览器二进制，本机有 Chrome/Edge 即可；覆盖关键用户流 |
| 埋点 | 可选接入 Plausible / Umami | 未接入 | 首版默认不采集任何第三方数据，符合最小化采集原则 |
| 插画 | 原创或占位素材 | 脚本生成的几何 SVG | 规避版权风险，且保证导出图片时 Canvas 不被跨域污染 |

## ⚖️ 版权与合规

- 本测试为**非官方趣味创作，仅供娱乐**，不属于正式 MBTI 或心理测评，
  与麦当劳品牌及其关联公司不存在商业合作、授权或隶属关系。
- 相关品牌及产品名称权利归其权利人所有。本项目**未使用**任何官方商标图形、角色形象或宣传图，
  全部插画由 `scripts/generate-assets.mjs` 生成的原创几何图形构成。
- 页面中的「**彩蛋稀有度**」为娱乐化设定，**并非真实用户统计结果**，也不构成任何概率承诺。
- 不采集手机号、头像、定位坐标、设备指纹；答题进度与结果仅保存在浏览器 `localStorage`。
- 仓库与提交材料中**不包含任何真实 Token、密钥或凭证**，配置文件仅使用环境变量占位符。
- 麦当劳 MCP 返回的餐品信息、价格与供应状态以麦当劳官方渠道的实时结果为准；
  本项目的输出不构成医疗、营养或其他专业建议。
- 完整参赛声明见 [CONTEST_DECLARATION.md](./CONTEST_DECLARATION.md)。

---

<sub>麦当劳程序员创意开发大赛（M-CODE）参赛作品 · 使用 WorkBuddy 开发 · 非麦当劳官方产品</sub>
