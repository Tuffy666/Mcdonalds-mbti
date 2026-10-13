#!/usr/bin/env node
/**
 * 麦门人格研究所 · 计分 CLI
 *
 * 用途：不打开网页也能得到人格档案，方便在终端、CI 或 Agent 流程里复用同一套计分规则。
 *
 * 用法：
 *   node scripts/score.mjs --answers 0,1,2,3,...        # 20 个选项下标（0=A 1=B 2=C 3=D）
 *   node scripts/score.mjs --answers A,B,C,D,...        # 20 个选项字母
 *   node scripts/score.mjs --answers 0123...            # 紧凑串
 *   node scripts/score.mjs --answers-file answers.json  # [0,1,2,...] 或 [{questionIndex,optionIndex,durationMs}]
 *   node scripts/score.mjs --answers ... --share B --out profile.json
 */

import { readFileSync, writeFileSync } from 'node:fs';
import {
  calculateResult,
  buildProfile,
  buildShareText,
  questions,
  validateConfig,
} from '../engine/index.mjs';

function parseArgs(argv) {
  const args = { share: 'A', pretty: true };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--answers') args.answers = argv[++i];
    else if (key === '--answers-file') args.answersFile = argv[++i];
    else if (key === '--out') args.out = argv[++i];
    else if (key === '--share') args.share = argv[++i];
    else if (key === '--compact') args.pretty = false;
    else if (key === '--help' || key === '-h') args.help = true;
  }
  return args;
}

const HELP = `麦门人格研究所 · 计分 CLI

用法:
  node scripts/score.mjs --answers A,B,C,D,...            20 个选项字母（也支持 0/1/2/3 下标或 0123 紧凑串）
  node scripts/score.mjs --answers-file answers.json      数组形式的答案
  node scripts/score.mjs --answers ... --share B          额外输出分享文案模板 B
  node scripts/score.mjs --answers ... --out profile.json 同时写入人格档案文件
  node scripts/score.mjs --answers ... --compact          单行 JSON 输出（便于管道）

说明:
  题库共 ${questions.length} 题，顺序与《规格书》§6 完全一致。
  传入 --answers 时若不足 20 题，缺失题目按未作答处理（不计分）。
`;

function parseAnswers(raw) {
  if (!raw) return null;
  const tokens = raw.includes(',') ? raw.split(',') : raw.split('');
  return tokens.map((t) => {
    const token = t.trim().toUpperCase();
    if (token === '' || token === '-' || token === 'X') return null;
    if (/^[ABCD]$/.test(token)) return 'ABCD'.indexOf(token);
    if (/^[0-3]$/.test(token)) return Number(token);
    throw new Error(`无法识别的选项：${t}`);
  });
}

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  process.stdout.write(HELP);
  process.exit(0);
}

const config = validateConfig();
if (!config.ok) {
  process.stderr.write(`配置校验失败：\n- ${config.errors.join('\n- ')}\n`);
  process.exit(1);
}

let answers;
if (args.answersFile) {
  answers = JSON.parse(readFileSync(args.answersFile, 'utf8'));
} else if (args.answers) {
  answers = parseAnswers(args.answers);
} else {
  process.stderr.write(HELP);
  process.exit(1);
}

const result = calculateResult(answers);
const profile = buildProfile(result);

const output = {
  summary: {
    mbti: result.mbti,
    product: result.personality.product,
    title: result.personality.title,
    group: result.personality.group,
    compatibility: result.compatibility,
    hidden: result.hiddenPersonality ? `${result.hiddenPersonality.name}（彩蛋稀有度 ${result.hiddenPersonality.rarityLabel}）` : null,
    answered: `${result.answeredCount}/${questions.length}`,
    dimensions: ['EI', 'SN', 'TF', 'JP'].reduce((acc, key) => {
      const d = result.dimensions[key];
      acc[key] = `${d.left} ${d.leftPercent}% / ${d.right} ${d.rightPercent}% → ${d.winner}`;
      return acc;
    }, {}),
  },
  shareText: buildShareText(result, args.share),
  profile,
};

const json = JSON.stringify(output, null, args.pretty ? 2 : 0);
process.stdout.write(`${json}\n`);

if (args.out) {
  writeFileSync(args.out, JSON.stringify(profile, null, 2), 'utf8');
  process.stderr.write(`人格档案已写入：${args.out}\n`);
}
