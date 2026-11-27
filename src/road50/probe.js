// road50/probe.js — one short headless check of the traffic on a city page: vehicles move, none stuck, none jumping, none off the
// drawn road surface or in the water. Run only through the browser lock:
//   bash SC/lm33/kit/browser.sh node road50/probe.js <page.html> <city> <out.json> '<views json>' [--site <folder>] [--data <stage folder>] [--app <app js>]
// views: [[name, lat, lon], ...]. Serves the site folder; requests for <city>data/* come from --data when given (a repaired stage),
// and the page's app script from --app when given (a rebuilt app with the road50 module changes).
// Per view: camera 900 m from the point, SGTraffic.warm(25) fills and runs the zone, then 6 x warm(2.5) samples (15 s of traffic).
'use strict';
const puppeteer = require('/opt/npm-tools/node_modules/puppeteer');
const http = require('http'), fs = require('fs'), path = require('path');
const a = process.argv.slice(2), PAGE = a[0], CITY = a[1], OUT = a[2], VIEWS = JSON.parse(a[3] || '[]');
const opt = k => { const i = a.indexOf('--' + k); return i >= 0 ? a[i+1] : null; };
const SITE = path.resolve(opt('site') || path.join(__dirname, '..', '..', 'site')), DATA = opt('data'), APP = opt('app');
const DIR = {sg:'sgdata', hk:'hkdata', nyc:'nycdata', tyo:'tyodata', bay:'baydata', gba:'gbadata'}[CITY];
const TYPES = {'.html':'text/html', '.js':'text/javascript', '.webp':'image/webp', '.png':'image/png', '.bin':'application/octet-stream', '.txt':'text/plain', '.glb':'model/gltf-binary', '.json':'application/json'};
const POSES = "    poses:() => VEH.filter(V => V.alive && !V.crash).map(V => { pathAt(V, V.u - V.len*0.5, _q); return {id:V.id, x:+_q.x.toFixed(2), y:+_q.y.toFixed(2), z:+_q.z.toFixed(2), v:+V.v.toFixed(2), wait:+V.wait.toFixed(1), li:V.dl.li, c:V.dl.c, el:V.dl.elev ? 1 : 0, ctrl:V.dl.ctrl, dEnd:+(V.dl.len - V.u).toFixed(1)}; }),\n";
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = http.createServer((q, r) => {
    let u = decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, ''); const lab = u.split('/')[0]; u = u.slice(lab.length + 1); let f = path.join(SITE, u);
    if (DATA && lab === 'after' && u.startsWith(DIR + '/')) f = path.join(DATA, u.slice(DIR.length + 1));
    if (APP && /-?app\.js$/.test(u) && !u.includes('/')) f = APP;
    fs.readFile(f, (e, d) => { if (e){ r.writeHead(404); r.end(); return; }
      // the live app has no poses() test helper yet: add it (test only, no behaviour change)
      if (/app\.js$/.test(f) || f.endsWith('.html')){ let t = d.toString('utf8'); const A = '    vehicles:() => VEH.filter(V => V.alive).map(';
        if (t.includes(A) && !t.includes('poses:()')){ t = t.replace(A, POSES + A); d = Buffer.from(t, 'utf8'); } }
      r.writeHead(200, {'Content-Type':TYPES[path.extname(f)] || 'application/octet-stream'}); r.end(d); });
  });
  await new Promise(res => srv.listen(0, res)); const port = srv.address().port;
  const b = await puppeteer.launch({executablePath:'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args:['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'], protocolTimeout:3600000});
  const p = await b.newPage(); await p.setViewport({width:960, height:600});
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { const t = m.text(); if (m.type() === 'error' || t.includes('[traffic]')) errs.push(m.type() + ' ' + t.slice(0, 300)); });
  const res = {page:PAGE, city:CITY, data:DATA || 'live', app:APP || 'live', runs:[]};
  for (const lab of (DATA ? ['before', 'after'] : ['before'])){
  const t0 = Date.now(), R1 = {label:lab, views:[]}; res.runs.push(R1);
  await p.goto(`http://127.0.0.1:${port}/${lab}/${PAGE}`);
  for (let k = 0; k < 200; k++){ await sleep(3000);
    const st = await p.evaluate(() => { try { return {on:!!(SGR && SGR.on), lines:SGR.lines ? SGR.lines.length : 0, tiles:SGR.tiles ? SGR.tiles.size : 0}; } catch (e){ return {err:e.message}; } });
    if (k % 10 === 0) console.log('t', ((Date.now() - t0)/1000).toFixed(0), JSON.stringify(st));
    if (st.on && st.lines > 0 && k > 3) break; if (errs.some(e => e.startsWith('PAGEERR'))) break; }
  R1.readyS = Math.round((Date.now() - t0)/1000);
  for (const [nm, lat, lon] of VIEWS){
    const r = await p.evaluate(async (lat, lon) => {
      const out = {samples:[]};
      try {
        const q = sgXY(lat, lon), y = Math.max(0, hC(q[0], q[1]));
        camera.position.set(q[0] + 300, y + 820, -q[1] + 300); controls.target.set(q[0], y, -q[1]); controls.update();
        if (window.SGTraffic){ SGTraffic.enabled = true; }
        out.warm = SGTraffic.warm(25);
        const seen = new Map(); let jumps = 0, offDeck = 0, n = 0; const stuck = new Map(), offs = [];
        for (let s = 0; s < 6; s++){
          const P = SGTraffic.poses();
          for (const v of P){ n++;
            const o = seen.get(v.id); if (o){ const d = Math.hypot(v.x - o.x, v.y - o.y), lim = (o.v + v.v)*0.5*2.5 + 25; if (d > lim) jumps++; }
            seen.set(v.id, v);
            const S = SGRoads.surfaceAt(v.x, v.y, v.z); if (!S || Math.abs(S.z - v.z) > 1.2){ offDeck++; if (offs.length < 12) offs.push([Math.round(v.x), Math.round(v.y), v.z, S ? +S.z.toFixed(2) : null, v.li]); }
            if (v.wait > 60 && v.ctrl !== 3) stuck.set(v.id, [Math.round(v.x), Math.round(v.y), v.wait, v.li]);
          }
          out.samples.push(P.length);
          SGTraffic.warm(2.5);
        }
        Object.assign(out, {poses:n, jumps, offDeck, offs, stuck:stuck.size, stuckAt:[...stuck.values()].slice(0, 10), stats:SGTraffic.stats()});
      } catch (e){ out.err = e.message + ' ' + (e.stack || '').slice(0, 300); }
      return out;
    }, lat, lon);
    r.name = nm; R1.views.push(r); console.log(lab, nm, JSON.stringify(r).slice(0, 600));
  }
  R1.totalS = Math.round((Date.now() - t0)/1000); R1.errors = errs.splice(0).slice(0, 30);
  }
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  await b.close(); srv.close();
})();
