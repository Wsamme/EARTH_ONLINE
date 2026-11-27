// lm50 New York screenshots of a test page made by ny50page.sh (lm40/kit/appshot.js adapted: own server root, Chromium 1243,
// prints every failed request and a FAILED-URLS summary, per-landmark hull / hidden-building report for the keys in KEYS).
// usage (always through the browser lock, detached):
//   (setsid nohup bash SC/lm33/kit/browser.sh env PAGE=t_<name>.html NEAR=<lat>,<lon>,<radius_m> KEYS=<k1,k2> \
//      node SC/lm50/ny/ny50shot.js <outdir> '<views json>' > <log> 2>&1 &)
// views: [name, lat, lon, distance_m, elevation_deg, azimuth_deg, hour, "optional JS", waitMs]  (azimuth 0 = camera south of the target
// looking north, 90 = camera east; hour 0-24, 20.5 = night). NEAR streams only the tiles within radius_m (much faster; omit = whole map).
// Pass = no PAGEERR and FAILED-URLS only the expected city-switch probes of sibling pages (/site/index.html, sg.html, bay.html, hk.html,
// tyo.html, gba.html ...) and /favicon.ico.
const puppeteer = require('/opt/npm-tools/node_modules/puppeteer');
const http = require('http'), fs = require('fs'), path = require('path');
const SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/', SITE = (process.env.NY50SITE || SC + 'lm50/ny/site') + '/';
const TYPES = {'.html':'text/html', '.js':'text/javascript', '.webp':'image/webp', '.png':'image/png', '.bin':'application/octet-stream', '.txt':'text/plain', '.json':'application/json', '.glb':'model/gltf-binary'};
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const out = path.resolve(process.argv[2]); fs.mkdirSync(out, {recursive:true});
  const views = JSON.parse(process.argv[3] || '[]'), PAGE = process.env.PAGE || 'test.html', NEAR = process.env.NEAR || '', KEYS = (process.env.KEYS || '').split(',').filter(Boolean);
  const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = u.startsWith('/vend/') ? path.join(SC, u) : path.join(SITE, u.replace(/^\/site\//, '/'));
    fs.readFile(f, (e, d) => { if (e){ r.writeHead(404); r.end(); return; } r.writeHead(200, {'Content-Type':TYPES[path.extname(f)] || 'application/octet-stream'}); r.end(d); }); });
  await new Promise(res => srv.listen(0, res)); const port = srv.address().port;
  const b = await puppeteer.launch({executablePath:'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args:['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'], protocolTimeout:3600000});
  const p = await b.newPage(); await p.setViewport({width:+(process.env.W || 1280), height:+(process.env.H || 800)});
  const fails = []; p.on('response', r => { if (r.status() >= 400){ const u = r.url().replace(/^http:..127.0.0.1:[0-9]+/, ''); fails.push(r.status() + ' ' + u); console.log('HTTP', r.status(), u); } });
  p.on('requestfailed', r => { const u = r.url().replace(/^http:..127.0.0.1:[0-9]+/, ''); fails.push('FAIL ' + u); console.log('REQFAIL', u, r.failure() && r.failure().errorText); });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').slice(0, 600))); p.on('console', m => { const t = m.text(); if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + t.slice(0, 400)); else if (t.startsWith('[t]') || t.startsWith('[log]')) console.log(t); });
  const t0 = Date.now();
  await p.goto(`http://127.0.0.1:${port}/site/${PAGE}${NEAR ? '?near=' + NEAR : ''}`);
  await p.evaluate(() => { window.__budget = 3000; });
  for (let k = 0; k < 300; k++){ await sleep(2000); const st = await p.evaluate(() => ({on:!!(window.__t && window.__t.SGR.on), q:window.__t ? window.__t.SGR.queue.length : -1, built:window.__t ? window.__t.SGR.built : 0}));
    if (k % 10 === 0) console.log('t', ((Date.now() - t0)/1000).toFixed(0), JSON.stringify(st)); if (st.on && !st.q && k > 2) break; if (errs.some(e => e.startsWith('PAGEERR'))) break; }
  console.log('ready in', ((Date.now() - t0)/1000).toFixed(0), 's');
  await p.evaluate(() => { window.__budget = 0; document.querySelector('#collapse') && document.querySelector('#collapse').click(); const t = document.querySelector('#trayClose'); if (t) t.click(); const s = document.querySelector('#stats'); if (s) s.style.display = 'none'; const f = document.querySelector('#showFlow'); if (f && f.checked){ f.checked = false; f.dispatchEvent(new Event('change')); } });
  if (!process.env.UI) await p.evaluate(() => { const k = document.querySelector('#kbUi'); if (k) k.click(); const h = document.querySelector('#uiHint'); if (h) h.hidden = true; });   // hide the whole UI (UI=1 keeps it)
  if (KEYS.length) console.log('LANDMARKS', JSON.stringify(await p.evaluate(keys => { const T = window.__t, o = {};
    for (const k of keys){ const L = T.landmarks.find(l => l.type === k), d = T.LANDMARKS[k]; if (!L){ o[k] = d ? 'defined, not placed' : 'MISSING'; continue; }
      const H = T.SGR.hulls && T.SGR.hulls.get(L.id); o[k] = {x:Math.round(L.x), y:Math.round(L.y), rot:L.rot, top:+(L.top || 0).toFixed(1), r:d.r, h:d.h, hull:H ? H.P.length : 0}; }
    return o; }, KEYS)));
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
  console.log('FAILED-URLS', fails.length); for (const f of fails.slice(0, 40)) console.log('  ' + f);
  console.log('ERRORS', errs.length); for (const e of errs.slice(0, 30)) console.log(e);
  console.log('PAGEERR', errs.filter(e => e.startsWith('PAGEERR')).length);
  await b.close(); srv.close();
})();
