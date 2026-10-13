# workbuddy.md · 使用 WorkBuddy 开发本项目的对话上下文

> 本文件用于说明本项目在 WorkBuddy 中的开发过程，供「WorkBuddy 专项奖励」核验使用。
> 内容为真实开发脉络的整理，包含目标、关键决策、执行动作与产出物。

## 1. 开发目标

把一份 1500 余行的《麦门人格研究所：H5 小游戏产品设计与开发规格书》，落成一个
**可运行、可测试、可部署、且真正接上麦当劳 MCP** 的参赛项目。

起点不是空白：仓库里已有一份 GitHub Copilot 生成的极简原型（3 个源文件、
单一 `App` 组件内塞完所有逻辑、隐藏人格判定只有 1 行 if 链、没有测试、没有文档）。

目标拆成两层：

1. **产品层**：完整实现规格书定义的 20 题 / 16 主人格 / 8 隐藏人格 / 四维计分 / 结果卡导出。
2. **参赛层**：按大赛要求补齐 `README.md`、`CONTEST_DECLARATION.md`、`MCP_INTEGRATION.md` 与 Skill，
   让作品从“一个 H5 页面”变成“一个基于麦当劳 MCP 的 Skill”。

## 2. 关键决策（WorkBuddy 建议并被采纳）

| 决策 | 原因 |
|---|---|
| 计分引擎写成**纯 ESM**（`engine/*.mjs`），H5 与 CLI 共用 | 避免“网页算一套、脚本算一套”的双实现漂移；同一档案同一次计算结果必然一致 |
| 隐藏人格判定从“一行 if 链”改为**两层判定**（eligible + triggerScore） | 规格书 §9.9 明确要求按触发分降序、同分按优先级，原实现无法表达 |
| 把 `PersonalityProfile` 定义为 H5 与 Agent 的**唯一契约** | Agent 不应该去猜“ISFP 该吃什么”，而应该读结构化字段 |
| 选品逻辑做成本地确定性引擎 `meal-plan.mjs` | 个性化不能靠大模型即兴发挥，必须可解释、可复现、可测试 |
| 优惠券与下单**强制两段式授权** | 领券和下单是不可逆动作，必须在用户明确同意后才触发 |
| 插画全部用脚本生成原创 SVG 占位图 | 规避官方素材版权风险，同时保证 `html-to-image` 导出不被跨域图片污染 Canvas |
| 调试器用 `import.meta.env.DEV` + 条件路由双层屏蔽 | 满足规格书 §18“生产构建必须双层屏蔽”的要求 |

## 3. 开发过程

### 阶段 1：读规格、定边界

- 完整解析规格书 22 个章节，抽取硬约束：题量 20、选项数 4、分值 1～3、16 产品不重复、
  劳力士与劳资数到三必须独立、"彩蛋稀有度"不得称为真实获得率。
- 拉取大赛官方仓库与麦当劳 MCP Server 文档，确认必需文件与可用 Tool 列表。

### 阶段 2：配置与校验

- 逐题录入 §6 的 20 道题与全部权重；逐条录入 §8 的 16 份人格文案；§9 的 8 个隐藏人格。
- 实现 `validateConfig()`，覆盖规格书 §14 的 12 条检查项，并作为 CLI 与启动时自检。

### 阶段 3：计分引擎与测试

- 四维计分、百分比取整保证两侧和为 100、三层同分决胜（强倾向数量 → 题末位置 → 稳定哈希）。
- 隐藏人格：8 条规则独立实现 + 触发分排序 + 优先级兜底。
- 编写 12 项单测，完整覆盖规格书 §17.2 的 10 条验收项，另加配置校验与端到端一致性。

### 阶段 4：主流程 UI

- 8 条路由：首页 / 答题 / 计算 / 结果 / 图鉴 / 人格详情 / 关于 / 调试。
- 答题进度落 localStorage、切后台不计时、修改答案重算不叠加、未答完不给结果。

### 阶段 5：分享与 Skill 化

- 结果卡导出（1080 × 1440 PNG）、三种分享文案、Web Share 降级到复制。
- 补齐 `SKILL.md` / `MCP_INTEGRATION.md`，把人格档案接到麦当劳 MCP 的实时菜单与下单链路。

### 阶段 6：验证

- `node --test` → 12 项全部通过。
- `npm run validate` → 配置校验通过（含 1 条已知冲突提示）。
- `tsc -b` → 无类型错误。
- `vite build` → 构建成功，首屏 JS 约 232 KB（gzip 约 89 KB），远低于 1.5 MB 目标。

## 4. 交付物清单

```text
maimen-personality-mcp/
├── README.md                 项目介绍、安装、使用示例、目标用户
├── CONTEST_DECLARATION.md    大赛官方参赛声明（原文，未修改）
├── MCP_INTEGRATION.md        MCP Server / Tool / 调用流程 / 业务价值
├── SKILL.md                  Agent Skill 主体
├── workbuddy.md              本文件
├── engine/                   H5 与 CLI 共用的计分与选品引擎（纯 ESM）
├── scripts/                  score / plan-meal / validate-config / generate-assets
├── tests/                    12 项单元测试
├── examples/                 可离线跑通整条链路的示例数据
├── public/assets/            17 张脚本生成的原创 SVG 插画
└── src/                      React 18 + TypeScript + Vite 前端（8 条路由）
```

## 5. 给后续维护者的提示

- 改题 → 升 `testVersion`；改权重/决胜规则 → 升 `scoringVersion`；改人格文案/映射 → 升 `personalityVersion`。
- 不要在 `src/` 里再写一份计分逻辑，`engine/` 是唯一事实来源。
- 新增隐藏人格时，四件事必须一起改：`engine/hidden.mjs` 配置、`evaluateHiddenRules` 规则、
  `MCP_INTEGRATION.md` 的映射说明、`tests/` 的覆盖用例。
