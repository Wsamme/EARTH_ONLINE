// 给 Buona Vista 的 Google 实景拍一组静帧。密钥从环境变量读，不会写进仓库。
//
// 先在一个终端里把站点开起来（网站根目录必须是 site/）：
//   cd site && python3 -m http.server 8000
// 再在仓库根目录：
//   npm install --prefix tools playwright
//   npx --prefix tools playwright install chromium
//   GOOGLE_MAPS_API_KEY=你的密钥 node tools/shoot_google_tiles.mjs
//
// 图片写到 tools/shots/（这个目录被 gitignore）。
// 可选环境变量：
//   G3D_BASE   默认 http://127.0.0.1:8000
//   G3D_OUT    默认 tools/shots
//   CHROME_PATH  自己的 Chrome 可执行文件；不设的话会试系统里的 Google Chrome，再试 Playwright 自带的 Chromium
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const base = (process.env.G3D_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');
const outDir = path.resolve(process.env.G3D_OUT || path.join(here, 'shots'));
const key = (process.env.GOOGLE_MAPS_API_KEY || '').trim();

// 镜头偏移：east 向东多少米，up 高出目标多少米，north 向北多少米（负数表示相机在目标南边）。
// 这些点都在 Buona Vista / one-north 一带，方便对实景和 OSM 道路。
const SHOTS = [
  { file: 'buona-vista-mrt.png', title: 'Buona Vista MRT interchange 波那维斯达地铁换乘站', lat: 1.30722, lon: 103.79020, east: 180, up: 140, north: -240, tod: 10.5 },
  { file: 'one-north-fusionopolis-biopolis.png', title: 'one-north / Fusionopolis and Biopolis 启汇城与启奥园', lat: 1.3005, lon: 103.7900, east: 640, up: 420, north: -860, tod: 10.5 },
  { file: 'star-vista.png', title: 'The Star Vista 星悦汇', lat: 1.3068, lon: 103.7884, east: 160, up: 120, north: -210, tod: 10.5 },
  { file: 'metropolis.png', title: 'The Metropolis 大都会', lat: 1.30625, lon: 103.79124, east: 210, up: 160, north: -280, tod: 10.5 },
  { file: 'dover-holland-village.png', title: 'Dover / Holland Village edge 杜佛与荷兰村一侧', lat: 1.3098, lon: 103.7890, east: 380, up: 300, north: -560, tod: 10.5 },
  { file: 'buona-vista-aerial.png', title: 'Buona Vista aerial 波那维斯达鸟瞰', lat: 1.3048, lon: 103.7896, east: 1700, up: 2500, north: -2300, tod: 10.5 },
  { file: 'night-buona-vista.png', title: 'Buona Vista at night 夜里的波那维斯达', lat: 1.3073, lon: 103.7900, east: 520, up: 380, north: -860, tod: 21.5 }
];

if (!key) {
  console.error('缺少环境变量 GOOGLE_MAPS_API_KEY。页面不会把密钥写进仓库。');
  process.exit(1);
}

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function serverUp() {
  try {
    const r = await fetch(base + '/');
    return r.status < 500;
  } catch (e) {
    return false;
  }
}

async function ensureServer() {
  if (await serverUp()) return null;
  console.log('本机还没开网站，正在启动 python3 -m http.server 8000（目录 site/）');
  const child = spawn('python3', ['-m', 'http.server', '8000'], { cwd: path.join(root, 'site'), stdio: 'ignore' });
  for (let i = 0; i < 40; i++) {
    if (await serverUp()) return child;
    await sleep(250);
  }
  child.kill();
  throw new Error('静态服务器没有在 ' + base + ' 起来');
}

async function launchBrowser() {
  const args = ['--no-sandbox', '--disable-dev-shm-usage'];
  if (process.env.CHROME_PATH) {
    return chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH, args: args });
  }
  try {
    return await chromium.launch({ headless: true, channel: 'chrome', args: args });
  } catch (e) {
    return chromium.launch({ headless: true, args: args });
  }
}

async function waitSettled(page, timeout) {
  await page.waitForFunction(function () {
    if (!window.G3D || !G3D.stats) return false;
    var s = G3D.stats();
    return s.mode === 'tiles' && s.settled && s.visible > 0;
  }, null, { timeout: timeout });
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const server = await ensureServer();
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const logs = [];
  page.on('pageerror', function (err) { logs.push('pageerror ' + err.message); });
  page.on('console', function (msg) { if (msg.type() === 'error') logs.push('console ' + msg.text()); });

  const url = base + '/?gkey=' + encodeURIComponent(key) + '&err=12';
  console.log('打开', base + '/?gkey=***&err=12', '（密钥长度', key.length, '）');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  // 地图数据比较大，实景还要等 Google 返回瓦片。err=12 比平时的 16 更细一点，适合静帧。
  await waitSettled(page, 240000);
  await page.evaluate(function () { document.body.classList.add('noui'); });

  for (const shot of SHOTS) {
    console.log('拍摄', shot.file, shot.title);
    await page.evaluate(function (s) { window.G3D.showShot(s); }, shot);
    await waitSettled(page, 180000);
    await sleep(600);
    await page.screenshot({ path: path.join(outDir, shot.file) });
  }

  const stats = await page.evaluate(function () { return window.G3D.stats(); });
  console.log('最后一帧', JSON.stringify({ mode: stats.mode, visible: stats.visible, meshes: stats.meshes, copyright: stats.copyright }));
  if (logs.length) console.log('浏览器报错（不一定是失败）:\n' + logs.slice(0, 20).join('\n'));
  console.log('图片在', outDir);
  await browser.close();
  if (server) server.kill();
}

main().catch(function (err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
