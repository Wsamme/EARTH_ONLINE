// GENERATED from hkreal/kit/shoot.js for the Greater Bay map (adapted copy, 2026-10-28)
// node shoot.js <outdir> <modules (comma list, relative to kit/) or -> <views json: [[name, lat, lon, dist, elevDeg, azimDeg, night], ...]>
// serves scratchpad/ over http (fetch needs it), opens kit/env.html, waits for READY, renders each view to <outdir>/<name>.png
const puppeteer = require('/opt/npm-tools/node_modules/puppeteer');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const TYPES = {'.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.gz':'application/octet-stream', '.bin':'application/octet-stream'};
(async () => {
  const out = path.resolve(process.argv[2]); fs.mkdirSync(out, {recursive:true});
  const mods = process.argv[3] && process.argv[3] !== '-' ? process.argv[3] : '';
  const views = JSON.parse(process.argv[4] || '[]');
  const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e){ r.writeHead(404); r.end(); return; } r.writeHead(200, {'Content-Type':TYPES[path.extname(f)] || 'application/octet-stream'}); r.end(d); }); });
  await new Promise(res => srv.listen(0, res)); const port = srv.address().port;
  const b = await puppeteer.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'], protocolTimeout:1800000});
  const p = await b.newPage(); await p.setViewport({width:1400, height:800});
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { const t = m.text(); if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + t.slice(0, 400)); else if (t.startsWith('[log]')) console.log(t); }); p.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').slice(0, 300)));
  const t0 = Date.now();
  await p.goto(`http://127.0.0.1:${port}/gbareal/targets/kit/${process.env.PAGE || 'insitu.html'}` + (mods ? '?m=' + encodeURIComponent(mods) : '') + (process.env.QS ? '&' + process.env.QS : ''));
  await p.waitForFunction('window.READY', {timeout:1500000, polling:500});
  const st = await p.evaluate(() => window.READY); console.log('ready', st, ((Date.now() - t0)/1000).toFixed(1) + ' s');
  for (const v of views){
    if (v[1] === 'overlay'){ const url = await p.evaluate((k, sc) => window.overlay(k, sc), v[2], v[3] || 0); if (url) fs.writeFileSync(path.join(out, v[0] + '.png'), Buffer.from(url.split(',')[1], 'base64')); console.log(v[0], url ? 'overlay' : 'no such key'); continue; }
    const t1 = Date.now();
    const info = await p.evaluate(v => { const r = window.view(...v.slice(1)); return {calls:r.calls, tris:r.triangles}; }, v);
    await p.screenshot({path:path.join(out, v[0] + '.png')});
    console.log(v[0], JSON.stringify(info), ((Date.now() - t1)/1000).toFixed(1) + ' s');
  }
  console.log('ERRORS', errs.length); for (const e of errs.slice(0, 30)) console.log(e);
  await b.close(); srv.close();
})();
