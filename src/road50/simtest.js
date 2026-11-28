// road50/simtest.js — the traffic system itself (lm20/traffic/traffic.js, with the roads module sgreal/mod_roads/roads.js and three.js r128)
// run headless in node on a city's road data: no page, no GPU. Per view the camera is put 900 m from the point, SGTraffic.warm(25) fills the
// zone and runs it, then 8 x warm(10) are sampled (105 s of traffic): vehicles, stuck (waiting > 60 s, not at a signal), jumps between samples (> 360 m in 10 s: faster than 30 m/s + 60 m), off the drawn
// road surface (SGRoads.surfaceAt), and the movement mix. Ground is flat (0 m): the check is about the road network, not the terrain.
//   node road50/simtest.js <city> <out.json> '<views [[name, lat, lon], ...]>' [--dir <data folder>]
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const lib = require('./lib.js');
const a = process.argv.slice(2), city = a[0], OUT = a[1], VIEWS = JSON.parse(a[2]);
const opt = k => { const i = a.indexOf('--' + k); return i >= 0 ? a[i+1] : null; };
const THREE = require('/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/vend/package/build/three.min.js');
const D = lib.loadCity(city, opt('dir')), B = D.base;
const fake2d = new Proxy({}, {get:(t, k) => k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({addColorStop(){}}) : (k === 'getImageData' || k === 'createImageData') ? (w, h) => ({width:w || 1, height:h || 1, data:new Uint8ClampedArray((w || 1)*(h || 1)*4)}) : k === 'measureText' ? () => ({width:10}) : () => {}, set:() => true});
const doc = {createElement:() => ({width:0, height:0, getContext:() => fake2d, style:{}}), getElementById:() => null, querySelector:() => null, addEventListener(){}};
const ctx = {console, Math, Date, JSON, Map, Set, WeakMap, Array, Object, Number, String, Error, Infinity, NaN, isFinite, parseInt, parseFloat, Symbol, Promise, Proxy, Reflect,
  Float32Array, Float64Array, Int32Array, Int16Array, Int8Array, Uint8Array, Uint16Array, Uint32Array, Uint8ClampedArray, ArrayBuffer, DataView, atob:s => Buffer.from(s, 'base64').toString('latin1'), btoa:s => Buffer.from(s, 'latin1').toString('base64'),
  setTimeout, clearTimeout, performance, process:{env:{}}, THREE, document:doc, HALF:D.HALF, TS:B.TS || 70, hAt:() => 0, hC:() => 0,
  mulberry32:s => { let t = s >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ t >>> 15, 1 | t); r ^= r + Math.imul(r ^ r >>> 7, 61 | r); return ((r ^ r >>> 14) >>> 0)/4294967296; }; },
  matLamp:new THREE.MeshBasicMaterial(), HOOKS:{frame:[], time:[], net:[], boot:[]}, tod:8.5, showNet:true, moverGroup:{visible:true}};
if (city === 'bay') ctx.SGR_BAY = true; if (city === 'nyc'){ ctx.SGR_NYC = true; ctx.SGR_US = true; }
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(lib.R, 'sgreal/mod_roads/roads.js'), 'utf8'), ctx, {filename:'roads.js'});
vm.runInContext(`const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(38, 1.6, 1, 60000); const controls = {target:new THREE.Vector3(), update(){}};
  var SGR = {on:true, lines:null, tiles:new Map()}; this.__set = (L) => { SGR.lines = L; }; this.__cam = (x, y) => { camera.position.set(x + 300, 820, -y + 300); controls.target.set(x, 0, -y); };`, ctx);
vm.runInContext(fs.readFileSync(path.join(lib.R, 'lm20/traffic/traffic.js'), 'utf8'), ctx, {filename:'traffic.js'});
// the lines decoded by lib.loadCity (the same roads.js decode)
ctx.__set(D.lines); ctx.SGRoads.prepare(D.lines);
const T = ctx.SGTraffic, res = {city, data:opt('dir') || 'live', views:[]};
for (const [nm, lat, lon] of VIEWS){
  const x = (lon - B.lon0)*B.MX, y = (lat - B.lat0)*B.MY; ctx.__cam(x, y);
  const out = {name:nm, x:Math.round(x), y:Math.round(y), stuck100:0}, t0 = Date.now();
  try {
    T.reset(); out.warm = T.warm(25);
    const seen = new Map(), stuck = new Map(), offs = []; let jumps = 0, off = 0, n = 0, tunN = 0; const jl = [], tunIds = new Set(), tunOut = new Set(); out.samples = [];
    for (let s = 0; s < 8; s++){
      const P = T.poses();
      for (const v of P){ n++;
        const o = seen.get(v.id); if (o){ const d = Math.hypot(v.x - o.x, v.y - o.y); if (d > 30*10 + 60){ jumps++; if (jl.length < 10) jl.push([Math.round(o.x), Math.round(o.y), Math.round(v.x), Math.round(v.y), o.li, v.li]); } } seen.set(v.id, v);
        if (v.tun){ tunN++; if (!tunIds.has(v.id)) tunIds.add(v.id); } else if (tunIds.has(v.id)) tunOut.add(v.id);
        const S = v.tun ? {z:v.z} : ctx.SGRoads.surfaceAt(v.x, v.y, v.z); if (!S || Math.abs(S.z - v.z) > 1.2){ off++; if (offs.length < 10) offs.push([Math.round(v.x), Math.round(v.y), v.z, S ? +S.z.toFixed(2) : null, v.li]); }
        if (v.wait > 60 && v.ctrl !== 3) stuck.set(v.id, [Math.round(v.x), Math.round(v.y), v.wait, v.li]);
        if (s === 7 && v.wait > 100 && v.ctrl !== 3){ out.stuck100 = (out.stuck100 || 0) + 1; }
      }
      out.samples.push(P.length); T.warm(10);
    }
    Object.assign(out, {poses:n, tunnelPoses:tunN, tunnelVehicles:tunIds.size, outOfTunnel:tunOut.size, jumps, jumpAt:jl, offSurface:off, offPct:+(off/Math.max(1, n)*100).toFixed(2), offs, stuck:stuck.size, stuckAt:[...stuck.values()].slice(0, 10), stats:T.stats()});
  } catch (e){ out.err = String(e && e.stack || e).slice(0, 600); }
  // the roads module's mesh build of the 2 km tiles around the view (portals, junctions next to the tunnels): errors / triangles
  try { const TX = Math.round(2*D.HALF/2000), only = new Set(); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++){ const tx = Math.floor((x + D.HALF)/2000) + dx, ty = Math.floor((y + D.HALF)/2000) + dy; if (tx >= 0 && ty >= 0 && tx < TX && ty < TX) only.add(ty*TX + tx); }
    const b = ctx.SGRoads.build(D.lines, {only}); out.build = {tiles:only.size, tris:b.stats.tris, ms:Math.round(b.stats.ms)}; }
  catch (e){ out.buildErr = String(e && e.stack || e).slice(0, 500); }
  out.ms = Date.now() - t0; res.views.push(out); console.log(JSON.stringify(out).slice(0, 700));
}
fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
