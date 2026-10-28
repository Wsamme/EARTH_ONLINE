// Screenshots of the full app (a test page made by mkapp.sh).
// usage: PAGE=t_<name>.html [NEAR=lat,lon,radius_m] node lm20/kit/appshot.js <outdir> '<views json>'
// views: [name, lat, lon, distance_m, elevation_deg, azimuth_deg, hour, "optional JS to run before the shot", waitMs]
//   azimuth 0 = camera south of the target looking north, 90 = camera east of it. hour 0-24 (20.5 = night).
//   the JS runs in the page; window.__t exposes camera, controls, scene, renderer, SGR, sgXY, hC, setTod, lodTick, LANDMARKS ...
//   ["name", null, ..., "js"] runs JS without moving the camera.
// NEAR streams only the real-city tiles within radius_m of lat,lon (much faster); omit it for the whole island.
const puppeteer = require('/opt/npm-tools/node_modules/puppeteer');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad';
const TYPES = {'.html':'text/html', '.js':'text/javascript', '.webp':'image/webp', '.png':'image/png', '.bin':'application/octet-stream', '.txt':'text/plain'};
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const out = path.resolve(process.argv[2]); fs.mkdirSync(out, {recursive:true});
  const views = JSON.parse(process.argv[3] || '[]'), PAGE = process.env.PAGE || 'test.html', NEAR = process.env.NEAR || '';
  const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e){ console.log('[404]', q.url); r.writeHead(404); r.end(); return; } r.writeHead(200, {'Content-Type':TYPES[path.extname(f)] || 'application/octet-stream'}); r.end(d); }); });
  await new Promise(res => srv.listen(0, res)); const port = srv.address().port;
  const b = await puppeteer.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'], protocolTimeout:3600000});
  const p = await b.newPage(); await p.setViewport({width:+(process.env.W || 1280), height:+(process.env.H || 800)});
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').slice(0, 600))); p.on('console', m => { const t = m.text(); if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + t.slice(0, 400)); else if (t.startsWith('[t]') || t.startsWith('[log]')) console.log(t); });
  const t0 = Date.now();
  await p.goto(`http://127.0.0.1:${port}/sgreal/site/${PAGE}${NEAR ? '?near=' + NEAR : ''}`);
  await p.evaluate(() => { window.__budget = 3000; });
  for (let k = 0; k < 300; k++){ await sleep(2000); const st = await p.evaluate(() => ({on:!!(window.__t && window.__t.SGR.on), q:window.__t ? window.__t.SGR.queue.length : -1, built:window.__t ? window.__t.SGR.built : 0}));
    if (k % 10 === 0) console.log('t', ((Date.now() - t0)/1000).toFixed(0), JSON.stringify(st)); if (st.on && !st.q && k > 2) break; if (errs.some(e => e.startsWith('PAGEERR'))) break; }
  console.log('ready in', ((Date.now() - t0)/1000).toFixed(0), 's');
  await p.evaluate(() => { window.__budget = 0; document.querySelector('#collapse') && document.querySelector('#collapse').click(); const t = document.querySelector('#trayClose'); if (t) t.click(); const s = document.querySelector('#stats'); if (s) s.style.display = 'none'; const f = document.querySelector('#showFlow'); if (f && f.checked){ f.checked = false; f.dispatchEvent(new Event('change')); } });
  for (const v of views){
    try {
      if (v[1] !== null) await p.evaluate((lat, lon, d, el, az, hr) => { const T = window.__t, q = T.sgXY(lat, lon), y = Math.max(0, T.hC(q[0], q[1])), e = el*Math.PI/180, a = az*Math.PI/180;
        if (hr !== undefined && hr !== null) T.setTod(hr); T.camera.position.set(q[0] + Math.sin(a)*Math.cos(e)*d, y + Math.sin(e)*d, -q[1] + Math.cos(a)*Math.cos(e)*d); T.controls.target.set(q[0], y, -q[1]); T.controls.update(); T.lodTick(); }, ...v.slice(1, 7));
      if (v[7]) { const r = await p.evaluate(async js => { try { const x = await (0, eval)(js); return x === undefined ? '' : JSON.stringify(x).slice(0, 2000); } catch (e){ return 'ERR ' + e.message; } }, v[7]); if (r) console.log(v[0], 'js ->', r); }
      if (v[1] === null && !v[8]) continue;
      await sleep(1200); await p.evaluate(() => window.__t.lodTick()); await sleep(v[8] || 1500);
      const info = await p.evaluate(() => { const r = window.__t.renderer.info.render; return {calls:r.calls, tris:r.triangles}; });
      await p.screenshot({path:path.join(out, v[0] + '.png')}); console.log(v[0], JSON.stringify(info));
    } catch (e){ console.log('view', v[0], 'failed', e.message); }
  }
  console.log('ERRORS', errs.length); for (const e of errs.slice(0, 30)) console.log(e);
  await b.close(); srv.close();
})();
