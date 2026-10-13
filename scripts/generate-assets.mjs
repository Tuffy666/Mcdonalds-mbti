#!/usr/bin/env node
/**
 * 生成 16 张“产品拟人化”占位插画（原创几何风格，不使用任何麦当劳官方素材）。
 * 运行：node scripts/generate-assets.mjs
 *
 * 说明：产物为本地同源 SVG，可直接被 <img> 引用与 html-to-image 导出，
 * 不会出现跨域图片污染 Canvas 的问题（§10.2）。
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { personalities, GROUP_THEME } from '../engine/index.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '..', 'public', 'assets', 'personalities');
mkdirSync(outDir, { recursive: true });

/** 每个产品一个抽象几何签名，保证 16 张图肉眼可区分 */
const SHAPES = {
  ENTJ: (c) => `<rect x="120" y="150" width="160" height="52" rx="14" fill="${c}"/><rect x="120" y="212" width="160" height="52" rx="14" fill="${c}" opacity=".78"/><rect x="120" y="274" width="160" height="52" rx="14" fill="${c}" opacity=".56"/>`,
  ENTP: (c) => `<path d="M120 300 L200 140 L280 300 Z" fill="${c}"/><path d="M150 300 L200 200 L250 300 Z" fill="#fff" opacity=".35"/>`,
  INTJ: (c) => `<rect x="130" y="160" width="140" height="46" rx="12" fill="${c}"/><rect x="130" y="214" width="140" height="46" rx="12" fill="${c}" opacity=".7"/><rect x="130" y="268" width="140" height="46" rx="12" fill="${c}" opacity=".45"/>`,
  INTP: (c) => `<circle cx="165" cy="215" r="34" fill="${c}"/><circle cx="235" cy="215" r="34" fill="${c}" opacity=".72"/><circle cx="200" cy="280" r="34" fill="${c}" opacity=".5"/>`,
  ENFJ: (c) => `<rect x="125" y="170" width="150" height="130" rx="26" fill="${c}"/><circle cx="200" cy="235" r="34" fill="#fff" opacity=".45"/>`,
  ENFP: (c) => `<circle cx="200" cy="235" r="74" fill="${c}"/><path d="M200 175 Q245 235 200 295 Q155 235 200 175 Z" fill="#fff" opacity=".5"/>`,
  INFJ: (c) => `<path d="M120 265 Q200 130 280 265 Q200 300 120 265 Z" fill="${c}"/>`,
  INFP: (c) => `<path d="M200 160 L285 235 L200 310 L115 235 Z" fill="${c}"/><path d="M200 200 L245 235 L200 270 L155 235 Z" fill="#fff" opacity=".42"/>`,
  ESTJ: (c) => `<rect x="115" y="185" width="170" height="100" rx="18" fill="${c}"/><rect x="145" y="215" width="110" height="40" rx="12" fill="#fff" opacity=".4"/>`,
  ESFJ: (c) => `<ellipse cx="200" cy="240" rx="86" ry="66" fill="${c}"/><ellipse cx="200" cy="240" rx="52" ry="36" fill="#fff" opacity=".42"/>`,
  ISTJ: (c) => `<rect x="130" y="185" width="140" height="110" rx="16" fill="${c}"/><rect x="130" y="215" width="140" height="22" fill="#fff" opacity=".5"/><rect x="130" y="250" width="140" height="22" fill="#fff" opacity=".32"/>`,
  ISFJ: (c) => `<rect x="135" y="175" width="130" height="120" rx="20" fill="${c}"/><circle cx="200" cy="215" r="20" fill="#fff" opacity=".42"/>`,
  ESTP: (c) => `<path d="M120 300 Q200 120 280 300 Z" fill="${c}"/><path d="M175 300 Q200 210 225 300 Z" fill="#fff" opacity=".4"/>`,
  ESFP: (c) => `<rect x="158" y="150" width="22" height="150" rx="10" fill="${c}"/><rect x="188" y="150" width="22" height="170" rx="10" fill="${c}" opacity=".8"/><rect x="218" y="150" width="22" height="140" rx="10" fill="${c}" opacity=".62"/>`,
  ISTP: (c) => `<rect x="130" y="190" width="140" height="90" rx="18" fill="${c}"/><path d="M160 320 L200 265 L240 320 Z" fill="${c}" opacity=".7"/>`,
  ISFP: (c) => `<path d="M165 160 L235 160 L215 300 L185 300 Z" fill="${c}"/><circle cx="200" cy="160" r="42" fill="${c}" opacity=".78"/>`,
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let count = 0;
Object.values(personalities).forEach((p) => {
  const theme = GROUP_THEME[p.group];
  const shape = SHAPES[p.type] ? SHAPES[p.type](theme.color) : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="${esc(p.product)}（${esc(p.title)}）原创拟人插画">
  <defs>
    <linearGradient id="bg-${p.type}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFF8E7"/>
      <stop offset="100%" stop-color="${theme.accent}33"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" rx="40" fill="url(#bg-${p.type})"/>
  <circle cx="330" cy="80" r="52" fill="${theme.accent}" opacity=".38"/>
  <circle cx="70" cy="330" r="38" fill="${theme.color}" opacity=".18"/>
  ${shape}
  <text x="200" y="372" text-anchor="middle" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="26" font-weight="700" fill="#2C211C">${esc(p.product)}</text>
</svg>
`;
  const file = join(outDir, p.image.replace(/^assets\/personalities\//, ''));
  writeFileSync(file, svg, 'utf8');
  count += 1;
});

// 首页轻量主视觉
writeFileSync(join(outDir, '..', 'hero.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 320" width="520" height="320" role="img" aria-label="麦门人格研究所原创主视觉插画">
  <defs>
    <linearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#D92D20"/>
      <stop offset="100%" stop-color="#FFC72C"/>
    </linearGradient>
  </defs>
  <rect width="520" height="320" rx="32" fill="#FFF8E7"/>
  <circle cx="120" cy="150" r="78" fill="url(#hero)" opacity=".92"/>
  <rect x="215" y="80" width="230" height="46" rx="16" fill="#2C211C" opacity=".88"/>
  <rect x="215" y="140" width="180" height="46" rx="16" fill="#659B5E" opacity=".85"/>
  <rect x="215" y="200" width="205" height="46" rx="16" fill="#4E9BD8" opacity=".85"/>
  <circle cx="120" cy="150" r="34" fill="#FFF8E7" opacity=".9"/>
</svg>
`, 'utf8');

process.stdout.write(`已生成 ${count} 张人格插画 + 1 张主视觉：public/assets/personalities/\n`);
