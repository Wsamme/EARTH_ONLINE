// Screenshots of a Greater Bay test page (built by mkpage_sz.sh into SC/lm50/sz/site; lm50 copy of SC/lm50/hk/kit/appshot_hk.js). Browser lock only:
//   [NEAR=lat,lon] bash SC/lm33/kit/browser.sh node src/lm50/sz50kit/appshot_sz.js <page.html> <outdir> '<views json>'
// views: [name, lat, lon, distance_m, elevation_deg, azimuth_deg, hour, "optional JS", waitMs]
//   azimuth 0 = camera south of the target looking north, 90 = camera east. hour 0-24 (20.5 = night).
//   ["name", null, ..., "js"] runs JS without moving the camera. window.__t = camera, controls, scene, renderer, SGR, sgXY, hC,
//   setTod, lodTick, LANDMARKS, landmarks (the test hook src/lm50/sz50kit/testhook_sz.js). NEAR=lat,lon loads the roads there first.
// Prints PAGEERR count, every failed request and a FAILED-URLS summary, landmark label count, heap. Expected failures only: the
// city-switch probes of the sibling pages (index.html, bay.html, nyc.html, tyo.html, gba.html ...) and /favicon.ico.
const puppeteer = require('/opt/npm-tools/node_modules/puppeteer');
const http = require('http'), fs = require('fs'), path = require('path');
const SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/', ROOT = SC + 'lm50/sz/site';
const TYPES = {'.html':'text/html; charset=utf-8', '.js':'text/javascript', '.webp':'image/webp', '.png':'image/png', '.json':'application/json', '.glb':'model/gltf-binary'};
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const [PAGE, OUTD, VJ] = process.argv.slice(2); const out = path.resolve(OUTD); fs.mkdirSync(out, {recursive:true});
  const views = JSON.parse(VJ || '[]');
  const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e){ r.writeHead(404); r.end(); return; } r.writeHead(200, {'Content-Type':TYPES[path.extname(f)] || 'application/octet-stream'}); r.end(d); }); });
  await new Promise(res => srv.listen(0, res)); const port = srv.address().port;
  const b = await puppeteer.launch({executablePath:'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args:['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'], protocolTimeout:3600000});
  const p = await b.newPage(); await p.setViewport({width:+(process.env.W || 1280), height:+(process.env.H || 800)});
  const fails = [], errs = [];
  p.on('response', r => { if (r.status() >= 400){ const u = r.url().replace(/^http:..127.0.0.1:[0-9]+/, ''); fails.push(r.status() + ' ' + u); } });
  p.on('requestfailed', r => { const u = r.url().replace(/^http:..127.0.0.1:[0-9]+/, ''); fails.push('FAIL ' + u + ' ' + (r.failure() && r.failure().errorText)); });
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').slice(0, 400)));
  p.on('console', m => { if (m.type() === 'error') errs.push('console.error ' + m.text().slice(0, 300)); });
  await p.setRequestInterception(true);
  p.on('request', q => { const u = q.url();
    if (u.includes('three.min.js')) return q.respond({status:200, contentType:'text/javascript', body:fs.readFileSync(SC + 'vend/package/build/three.min.js')});
    if (u.includes('OrbitControls.js')) return q.respond({status:200, contentType:'text/javascript', body:fs.readFileSync(SC + 'vend/package/examples/js/controls/OrbitControls.js')});
    if (u.includes('GLTFLoader.js') && fs.existsSync(SC + 'vend/package/examples/js/loaders/GLTFLoader.js')) return q.respond({status:200, contentType:'text/javascript', body:fs.readFileSync(SC + 'vend/package/examples/js/loaders/GLTFLoader.js')});
    if (u.startsWith('http') && !u.includes('127.0.0.1')) return q.respond({status:200, contentType:'text/css', body:''});
    q.continue(); });
  const t0 = Date.now();
  await p.goto(`http://127.0.0.1:${port}/${PAGE}` + (process.env.NEAR ? "?near=" + process.env.NEAR : ""));
  for (let k = 0; k < 150; k++){ await sleep(2000);
    const st = await p.evaluate(() => ({t:!!window.__t, on:!!(window.__t && window.__t.SGR && window.__t.SGR.on), lm:document.querySelectorAll('.lbl.lm').length}));
    if (k % 10 === 0) console.log('t', ((Date.now() - t0)/1000).toFixed(0), JSON.stringify(st));
    if (st.on && st.lm > 20 && k > 5) break; if (errs.some(e => e.startsWith('PAGEERR'))) break; }
  await sleep(8000);
  console.log('ready in', ((Date.now() - t0)/1000).toFixed(0), 's');
  await p.evaluate(() => { for (const s of ['#collapse', '#trayClose']){ const e = document.querySelector(s); if (e) e.click(); } const s = document.querySelector('#stats'); if (s) s.style.display = 'none'; });
  for (const v of views){
    try {
      if (v[1] !== null) await p.evaluate((lat, lon, d, el, az, hr) => { const T = window.__t, q = T.sgXY(lat, lon), y = Math.max(0, T.hC(q[0], q[1])), e = el*Math.PI/180, a = az*Math.PI/180;
        if (hr !== undefined && hr !== null) T.setTod(hr); T.camera.position.set(q[0] + Math.sin(a)*Math.cos(e)*d, y + Math.sin(e)*d, -q[1] + Math.cos(a)*Math.cos(e)*d); T.controls.target.set(q[0], y, -q[1]); T.controls.update(); T.lodTick(); }, ...v.slice(1, 7));
      if (v[7]){ const r = await p.evaluate(async js => { try { const x = await (0, eval)(js); return x === undefined ? '' : JSON.stringify(x).slice(0, 2000); } catch (e){ return 'ERR ' + e.message; } }, v[7]); if (r) console.log(v[0], 'js ->', r); }
      if (v[1] === null && !v[8]) continue;
      for (let i = 0; i < 4; i++){ await sleep(1500); await p.evaluate(() => window.__t.lodTick()); }
      await sleep(v[8] || 2500);
      const info = await p.evaluate(() => { const r = window.__t.renderer.info.render; return {calls:r.calls, tris:r.triangles}; });
      await p.screenshot({path:path.join(out, v[0] + '.png')}); console.log(v[0], JSON.stringify(info));
    } catch (e){ console.log('view', v[0], 'failed', e.message); }
  }
  const lm = await p.evaluate(() => document.querySelectorAll('.lbl.lm').length);
  const heap = await p.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576) : -1);
  console.log('lm_labels', lm, 'heap_MB', heap);
  console.log('FAILED-URLS', [...new Set(fails)].length); for (const f of [...new Set(fails)].slice(0, 40)) console.log('  ' + f);
  console.log('PAGEERR', errs.filter(e => e.startsWith('PAGEERR')).length, '| errors', errs.length); for (const e of errs.slice(0, 20)) console.log('  ' + e);
  await b.close(); srv.close();
})();
