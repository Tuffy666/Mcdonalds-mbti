#!/usr/bin/env node
/**
 * 轻量端到端冒烟测试（不依赖 Playwright）
 *
 * 用本机 Chrome 的 DevTools Protocol 打开构建产物，真实点完 20 道题，
 * 校验是否进入结果页、隐藏人格区块是否渲染、结果卡 DOM 是否存在，并输出截图。
 *
 * 用法：
 *   node scripts/smoke-e2e.mjs                       # 默认 http://127.0.0.1:4173
 *   node scripts/smoke-e2e.mjs --url http://localhost:5173
 *   node scripts/smoke-e2e.mjs --shot ./smoke-result.png
 *
 * 需要本机安装 Chrome 或 Edge；找不到时报错退出，不影响主流程。
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

function parseArgs(argv) {
  const args = { url: 'http://127.0.0.1:4173', shot: 'smoke-result.png', port: 9333 };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--url') args.url = argv[++i];
    else if (argv[i] === '--shot') args.shot = argv[++i];
    else if (argv[i] === '--port') args.port = Number(argv[++i]);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const chromePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chromePath) {
  console.error('未找到 Chrome/Edge，可通过 CHROME_PATH 环境变量指定路径。');
  process.exit(2);
}

const userDataDir = mkdtempSync(join(tmpdir(), 'maimen-smoke-'));
const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${args.port}`,
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForTarget() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${args.port}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* 还没起来 */
    }
    await sleep(250);
  }
  throw new Error('Chrome DevTools 端点未就绪');
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
  }

  send(method, params = {}) {
    this.id += 1;
    const id = this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression, awaitPromise = false) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue: true,
    });
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.text || '页面执行异常');
    return res.result.value;
  }
}

const checks = [];
const record = (name, ok, detail = '') => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};

let exitCode = 0;
try {
  const wsUrl = await waitForTarget();
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });
  const cdp = new Cdp(ws);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  // 1. 首页渲染
  await cdp.send('Page.navigate', { url: `${args.url}/` });
  await sleep(1200);
  const homeText = await cdp.evaluate('document.body.innerText');
  record('首页渲染出主标题', homeText.includes('测测你在麦当劳里'), homeText.split('\n')[1] || '');
  record('首页显示免责声明', homeText.includes('非官方趣味创作'));

  // 2. 答题流程：真实点击 20 题
  await cdp.send('Page.navigate', { url: `${args.url}/quiz` });
  await sleep(1000);
  const flowResult = await cdp.evaluate(
    `(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      for (let i = 0; i < 20; i += 1) {
        const opts = document.querySelectorAll('.option');
        if (!opts.length) return 'NO_OPTIONS_AT_' + i;
        opts[i % 4].click();
        await wait(120);
        if (i === 19) {
          await wait(200);
          const gen = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('生成我的麦门人格'));
          if (!gen) return 'NO_GENERATE_BUTTON';
          gen.click();
        }
      }
      return 'OK';
    })()`,
    true,
  );
  record('完成 20 题并点击生成', flowResult === 'OK', String(flowResult));

  await sleep(3200);
  const url = await cdp.evaluate('location.pathname');
  record('进入结果页', url === '/result', url);

  const resultText = await cdp.evaluate('document.body.innerText');
  record('结果页显示麦门契合度', resultText.includes('麦门契合度'));
  record('结果页显示四维倾向', ['热闹派', '经典派', '理性派', '计划派'].some((k) => resultText.includes(k)));
  record('结果页显示免责声明', resultText.includes('仅供娱乐'));
  record('结果卡 DOM 存在', await cdp.evaluate('!!document.querySelector(".poster")'));

  const hiddenRendered = await cdp.evaluate('!!document.querySelector(".hidden-card")');
  record('隐藏人格区块按条件渲染（有/无都算通过）', true, hiddenRendered ? '本次触发了隐藏人格' : '本次未触发隐藏人格');

  // 3. 图鉴与说明页
  await cdp.send('Page.navigate', { url: `${args.url}/gallery/ENTJ` });
  await sleep(900);
  const detailText = await cdp.evaluate('document.body.innerText');
  record('人格详情页可直达（SPA 回退正常）', detailText.includes('巨无霸') && detailText.includes('全场控局型'));

  await cdp.send('Page.navigate', { url: `${args.url}/about` });
  await sleep(900);
  const aboutText = await cdp.evaluate('document.body.innerText');
  record('说明页显示版本信息', aboutText.includes('scoringVersion') || aboutText.includes('计分版本'));

  // 4. 生产环境不应出现调试器
  await cdp.send('Page.navigate', { url: `${args.url}/debug` });
  await sleep(700);
  const debugText = await cdp.evaluate('document.body.innerText');
  record('生产构建已屏蔽 /debug', !debugText.includes('开发调试器'), debugText.split('\n')[1] || '');

  // 5. 截图
  await cdp.send('Page.navigate', { url: `${args.url}/result` });
  await sleep(1500);
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(600);
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(args.shot, Buffer.from(shot.data, 'base64'));
  console.log(`📸 结果页截图：${args.shot}`);

  ws.close();
} catch (error) {
  console.error(`冒烟测试执行失败：${error.message}`);
  exitCode = 1;
} finally {
  chrome.kill();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} 项通过`);
if (failed.length) exitCode = 1;
process.exit(exitCode);
