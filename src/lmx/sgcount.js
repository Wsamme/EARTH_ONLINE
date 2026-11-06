const puppeteer = require('/opt/npm-tools/node_modules/puppeteer');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad';
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e){ r.writeHead(404); r.end(); return; } r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream'}); r.end(d); }); });
  await new Promise(res => srv.listen(0, res));
  const b = await puppeteer.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${srv.address().port}/${process.argv[2]}`);
  for (let k = 0; k < 60; k++){ await sleep(2000); if (await p.evaluate(() => !!(window.__t && window.__t.landmarks && window.__t.landmarks.length))) break; }
  await sleep(3000);
  const r = await p.evaluate(() => { const T = window.__t, L = T.LANDMARKS; const S = T.ev("typeof SITES !== 'undefined' ? SITES : {}");
    const placed = new Set(T.landmarks.map(x => x.type));
    const lab = Object.entries(L).filter(([k, d]) => d.label !== false && placed.has(k)).map(([k, d]) => k + '|' + (d.zh || '') + '|' + (d.en || '') + '|' + (d.cat || ''));
    const sites = Object.entries(S).filter(([k, d]) => d.label !== false).map(([k, d]) => k + '|' + (d.zh || '') + '|' + (d.en || ''));
    return {defs: Object.keys(L).length, placed: placed.size, labelled: lab.length, sites: sites.length, lab, sitesL: sites}; });
  fs.writeFileSync(process.argv[3], JSON.stringify(r, null, 1));
  console.log('defs', r.defs, 'placed types', r.placed, 'labelled placed', r.labelled, 'sites', r.sites, 'pageerrors', errs.length);
  await b.close(); srv.close();
})();
