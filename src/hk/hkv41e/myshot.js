// Headless check of a built page: node lmx/shot.js <dir-served-as-root> <page.html> <out-prefix> [js-to-run-after-load]
// Serves <dir> on localhost, maps the three.js CDN URLs to vend/, waits for the city, prints page errors / failed requests,
// counts landmark labels (.lbl.lm), saves <out>_a.png. Run through: bash lm33/kit/browser.sh node lmx/shot.js ...
const puppeteer = require('/opt/npm-tools/node_modules/puppeteer');
const http = require('http'), fs = require('fs'), path = require('path');
const SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
const [ROOT, PAGE, OUT, EXTRA] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.webp') ? 'image/webp' : 'application/octet-stream'}); r.end(d); }); });
  await new Promise(res => srv.listen(0, res));
  const b = await puppeteer.launch({executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const p = await b.newPage(); await p.setViewport({width: 1280, height: 800});
  const errs = [], fails = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('requestfailed', q => fails.push(q.url()));
  p.on('response', r => { if (r.status() >= 400) fails.push(r.status() + ' ' + r.url()); });
  await p.setRequestInterception(true);
  p.on('request', q => { const u = q.url();
    if (u.includes('three.min.js')) return q.respond({status: 200, contentType: 'text/javascript', body: fs.readFileSync(SC + 'vend/package/build/three.min.js')});
    if (u.includes('OrbitControls.js')) return q.respond({status: 200, contentType: 'text/javascript', body: fs.readFileSync(SC + 'vend/package/examples/js/controls/OrbitControls.js')});
    if (u.startsWith('http') && !u.includes('127.0.0.1')) return q.respond({status: 200, contentType: 'text/css', body: ''});
    q.continue(); });
  const t0 = Date.now();
  await p.goto(`http://127.0.0.1:${srv.address().port}/${PAGE}`);
  for (let k = 0; k < 120; k++) { await sleep(2000); const n = await p.evaluate(() => document.querySelectorAll('.lbl.lm').length); if (n > 20) break; }
  await sleep(10000);
  if (EXTRA) { const V = JSON.parse(EXTRA); await p.evaluate(() => { const b = document.getElementById("tPlay"); if (b && b.getAttribute("aria-pressed") === "true") b.click(); }); for (const v of V) { await p.evaluate(v => { window.CB_LOOK(v[1], v[2], v[3], v[4], v[5]); const s = document.getElementById("tSlider"); s.value = v[6]; s.dispatchEvent(new Event("input")); }, v); await sleep(v[7] || 9000); await p.screenshot({path: OUT + "_" + v[0] + ".png"}); console.log("shot", v[0]); } }
  const n = await p.evaluate(() => document.querySelectorAll('.lbl.lm').length);
  const heap = await p.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1);
  await p.screenshot({path: OUT + '_a.png'});
  console.log('ready_s', ((Date.now() - t0) / 1000).toFixed(0), 'lm_labels', n, 'heap_MB', heap, 'pageerrors', errs.length, errs.slice(0, 5).join(' | '));
  console.log('failed:', [...new Set(fails)].slice(0, 15).join('  '));
  await b.close(); srv.close();
})();
