#!/usr/bin/env node
/** 配置校验 CLI（§14）：构建前与 CI 中运行，校验失败以非 0 退出码结束 */
import { validateConfig } from '../engine/index.mjs';

const report = validateConfig();

if (report.errors.length) {
  process.stdout.write('❌ 配置校验失败：\n');
  report.errors.forEach((e) => process.stdout.write(`  - ${e}\n`));
}
if (report.warnings.length) {
  process.stdout.write('⚠️  配置提示：\n');
  report.warnings.forEach((w) => process.stdout.write(`  - ${w}\n`));
}

process.stdout.write(report.ok ? '✅ 配置校验通过\n' : '\n');
process.exit(report.ok ? 0 : 1);
