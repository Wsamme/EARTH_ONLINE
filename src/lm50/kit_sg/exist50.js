// lm50 (Singapore): dump every landmark / site the built test page actually has (evaluated in the browser, not grepped).
// usage (through the browser lock):  cd SC && bash lm33/kit/browser.sh env PAGE=lm50/sg/site/t_base.html node lm50/sg/kit/exist50.js lm50/sg/exist_sg.json
// output: {placed:[{key, zh, en, r, h, label, cat, lat, lon, rot}], sites:[{key, zh, en, lat, lon, r, label}], counts}
const puppeteer = require('/opt/npm-tools/node_modules/puppeteer');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad';
const TYPES = {'.html':'text/html', '.js':'text/javascript', '.webp':'image/webp', '.png':'image/png', '.bin':'application/octet-stream', '.txt':'text/plain', '.json':'application/json'};
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e){ r.writeHead(404); r.end(); return; } r.writeHead(200, {'Content-Type':TYPES[path.extname(f)] || 'application/octet-stream'}); r.end(d); }); });
  await new Promise(res => srv.listen(0, res));
  const b = await puppeteer.launch({executablePath:require('./chrome.js'), args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p = await b.newPage(); await p.setViewport({width:640, height:400}); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${srv.address().port}/${process.env.PAGE}?near=1.29,103.85,300`);
  for (let k = 0; k < 90; k++){ await sleep(2000); if (await p.evaluate(() => !!(window.__t && window.__t.landmarks && window.__t.landmarks.length))) break; }
  await sleep(3000);
  const r = await p.evaluate(() => { const T = window.__t, L = T.LANDMARKS, S = T.SITES, placed = new Set(T.landmarks.map(x => x.type));
    const last = new Map(T.SG_PLACES.map(q => [q.type, q]));
    const pl = [...placed].map(k => { const d = L[k] || {}, q = last.get(k) || {}; return {key:k, zh:d.zh, en:d.en, r:d.r, h:d.h, label:d.label !== false, cat:d.cat, lat:q.lat, lon:q.lon, rot:q.rot}; });
    const st = Object.entries(S).map(([k, d]) => ({key:k, zh:d.zh, en:d.en, lat:d.lat, lon:d.lon, r:d.r, label:d.label !== false}));
    return {placed:pl, sites:st, counts:{defs:Object.keys(L).length, placedTypes:pl.length, labelledPlaced:pl.filter(x => x.label).length, sites:st.length, sitesLabelled:st.filter(x => x.label).length}}; });
  fs.writeFileSync(path.resolve(process.argv[2]), JSON.stringify(r, null, 1));
  console.log(JSON.stringify(r.counts), 'pageerrors', errs.length, errs.slice(0, 3).join(' | '));
  await b.close(); srv.close();
})();
