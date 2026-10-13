#!/usr/bin/env node
/**
 * 麦门人格研究所 · 今日人格套餐方案 CLI
 *
 * 输入人格档案 + 麦当劳 MCP query-meals 返回的实时菜单，输出确定性的套餐方案。
 * 本脚本不做任何网络请求、不读取任何优惠券、不下单 —— 券与下单由 Agent 在用户授权后执行。
 *
 * 用法：
 *   node scripts/plan-meal.mjs --profile profile.json --menu menu.json --store "南京西路店" --mode 堂食
 *   node scripts/plan-meal.mjs --answers A,B,C... --menu menu.json      # 也可直接给答案
 *   node scripts/plan-meal.mjs --help
 */

import { readFileSync, writeFileSync } from 'node:fs';
import {
  calculateResult,
  buildProfile,
  buildMealPlan,
  planToPrompt,
} from '../engine/index.mjs';

function parseArgs(argv) {
  const args = { mode: '堂食' };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--profile') args.profile = argv[++i];
    else if (key === '--menu') args.menu = argv[++i];
    else if (key === '--answers') args.answers = argv[++i];
    else if (key === '--store') args.store = argv[++i];
    else if (key === '--mode') args.mode = argv[++i];
    else if (key === '--budget') args.budget = Number(argv[++i]);
    else if (key === '--out') args.out = argv[++i];
    else if (key === '--json') args.json = true;
    else if (key === '--help' || key === '-h') args.help = true;
  }
  return args;
}

const HELP = `麦门人格研究所 · 今日人格套餐方案 CLI

用法:
  node scripts/plan-meal.mjs --profile profile.json --menu menu.json [--store 门店名] [--mode 堂食|外带|外送] [--budget 40]
  node scripts/plan-meal.mjs --answers A,B,C,D,... --menu menu.json
  node scripts/plan-meal.mjs --profile profile.json            # 无菜单时输出待补齐意图
  node scripts/plan-meal.mjs --profile p.json --menu m.json --json
  附加 --out plan.json 可写入方案文件。

menu.json 结构（由 Agent 从麦当劳 MCP query-meals 结果归一化）:
  [{ "code": "M001", "name": "巨无霸", "price": 25, "category": "主食", "tags": ["限时"] }]

安全边界:
  本脚本只产出【无券方案】。优惠券领取与订单创建必须由用户在对话中显式授权后，由 Agent 调用 MCP 完成。
`;

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    process.stderr.write(`读取 ${label} 失败：${path}\n${error.message}\n`);
    process.exit(1);
    return null;
  }
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  process.stdout.write(HELP);
  process.exit(0);
}

let profile;
if (args.profile) {
  const raw = readJson(args.profile, '人格档案');
  profile = raw.profile || raw;
} else if (args.answers) {
  const tokens = args.answers.includes(',') ? args.answers.split(',') : args.answers.split('');
  const answers = tokens.map((t) => {
    const token = t.trim().toUpperCase();
    if (/^[ABCD]$/.test(token)) return 'ABCD'.indexOf(token);
    return Number(token);
  });
  profile = buildProfile(calculateResult(answers));
} else {
  process.stderr.write(HELP);
  process.exit(1);
}

const menu = args.menu ? readJson(args.menu, '菜单') : [];

const plan = buildMealPlan(profile, menu, {
  storeName: args.store,
  diningMode: args.mode,
  budget: Number.isFinite(args.budget) ? args.budget : null,
});
plan.prompt = planToPrompt(plan, profile);

if (args.json) {
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
} else {
  process.stdout.write(`${plan.prompt}\n`);
}

if (args.out) {
  writeFileSync(args.out, JSON.stringify(plan, null, 2), 'utf8');
  process.stderr.write(`方案已写入：${args.out}\n`);
}
