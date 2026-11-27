// lm50 Shenzhen (Greater Bay page) offline landmark kit — adapted from lm50/ty50kit (Tokyo): runs landmark modules with the app's REAL
// builder helpers (LBox, LTris, LShape, lmMerge …), taken at run time from the page template the Greater Bay build uses (the 14 Nov
// snapshot SC/gbabuild/src/city-brush-v16.html, see SC/gbabuild/build.sh; override with TEMPLATE=…) between the 'landmarks:' marker
// and 'let landmarks = []', in a node vm with three.js r128. Placement like the app: group at (x, top, -y), rotation.y = rot; offline
// the ground is flat (top = 0). Frame: gbareal (lon0 114.052048203, lat0 22.656070182; unchanged by the lm50 Guangzhou extension).
const fs = require('fs'), vm = require('vm'), path = require('path');
const R = path.resolve(__dirname, '../..') + '/';            // src/
const THREE_JS = process.env.THREE_JS || ['/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/vend/package/build/three.min.js', R + '../node_modules/three/build/three.min.js'].find(f => fs.existsSync(f));
const LON0 = 114.05204820306326, LAT0 = 22.65607018202933, MX = 103014.2, MY = 110734.9;      // gbareal frame (site/gbadata/gba_base lon0 / lat0 / MX / MY)
const XY = (lat, lon) => [(lon - LON0)*MX, (lat - LAT0)*MY];
const LL = (x, y) => [LAT0 + y/MY, LON0 + x/MX];
function makeEnv(){
  const SCR = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
  const tpl = process.env.TEMPLATE || [SCR + 'gbabuild/src/city-brush-v16.html', SCR + 'wipsrc/src/city-brush-v16.html', R + 'city-brush-v16.html'].find(f => fs.existsSync(f));
  const html = fs.readFileSync(tpl, 'utf8');
  const a = html.indexOf('/* ================= landmarks:'), b = html.indexOf('let landmarks = [], lmSel');
  if (a < 0 || b < a) throw new Error('lmenv: helper markers not found in city-brush-v16.html');
  const ctx = { console, Math, JSON, Date, Object, Array, Number, String, Set, Map, WeakMap, Float32Array, Float64Array, Uint8Array, Uint16Array, Uint32Array, Int32Array, Int16Array, isFinite, isNaN, parseFloat, parseInt, Symbol, Proxy, Error };
  ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(THREE_JS, 'utf8'), ctx, {filename:'three.min.js'});
  vm.runInContext(`var NIGHT = {uNight:{value:0}}; var lampTex = null; var nightF = 0;
    function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; }; }
    var sgXY = (lat, lon) => [(lon - 114.05204820306326)*103014.2, (lat - 22.65607018202933)*110734.9]; function hAt(){ return 0; } function hC(){ return 0; }   // flat ground offline
    var SG_PLACES = []; var SITES = {}; var MODELS = {}; function setTimeout(){ return 0; } function setInterval(){ return 0; } function clearTimeout(){} function addHook(){} function runHooks(){}`, ctx);
  vm.runInContext(html.slice(a, b) + '\n;globalThis.__LM = {LANDMARKS, lmMerge, get LMCTX(){ return LMCTX; }, set LMCTX(v){ LMCTX = v; }};', ctx, {filename:'city-brush-v16.html(landmark helpers)'});
  return ctx;
}
function loadModules(ctx, files){
  const own = {};
  for (const f of files){
    const before = new Set([...Object.keys(ctx.__LM.LANDMARKS), ...Object.keys(ctx.SITES)]);
    try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, {filename:f}); } catch (e){ console.log('load error', f.split('/').slice(-2).join('/'), e.message); if (process.env.STRICT) throw e; }
    for (const k of [...Object.keys(ctx.__LM.LANDMARKS), ...Object.keys(ctx.SITES)]) if (!before.has(k)) own[k] = f;
  }
  return own;
}
// build one key like placeLandmarkMesh (no plinth, flat ground: base y = 0). Returns {g, calls, mats, ms}
function buildKey(ctx, key, id){
  const L = ctx.__LM, def = L.LANDMARKS[key]; if (!def) throw new Error('no LANDMARKS.' + key);
  const lt = def.lt || (def.cat === 'new' ? {m:1, c:'#d6e4ff', k:0.6} : {m:0, c:'#ffc98a', k:0.9}), T = ctx.THREE;
  L.LMCTX = {mats:new Map(), fx:[], rng:ctx.mulberry32((id || 1)*7919 + 13), u:{base:{value:0}, top:{value:def.h || 60}, col:{value:new T.Color(lt.c)}, k:{value:lt.k}, mode:{value:lt.m}, even:{value:lt.e || 0}}};
  const t0 = Date.now(); const g = def.build(); const ms = Date.now() - t0;
  let calls = 0; g.traverse(o => { if (o.isMesh) calls++; });
  const live = (g.userData && g.userData.live) || [], keep = (g.userData && g.userData.keep) || [];
  for (const o of keep) g.remove(o);
  for (const o of live){ g.remove(o); o.position.set(0, 0, 0); o.quaternion.identity(); o.scale.set(1, 1, 1); o.updateMatrix(); L.lmMerge(o); }
  L.lmMerge(g); for (const o of live) g.add(o);
  const mats = L.LMCTX.mats.size; L.LMCTX = null;
  return {g, calls, mats, ms, def};
}
// triangles of a built group in model coordinates (x east, y up, z south), with colour per triangle: [{c, pos Float32Array}]
function trisOf(ctx, g){
  g.updateMatrixWorld(true); const out = [];
  g.traverse(o => { if (!o.isMesh) return; const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); geo.applyMatrix4(o.matrixWorld);
    out.push({c:'#' + o.material.color.getHexString(), op:o.material.opacity, pos:geo.attributes.position.array}); });
  return out;
}
function lastPlace(ctx, key){ let p = null; for (const q of ctx.SG_PLACES) if (q.type === key) p = q; return p; }
// the modules the Greater Bay build loads: src/gba/<d>/<d>.js (globbed by gbareal/tools/patch17_gba.py) and the frame-shimmed Hong Kong
// copies src/gbareal/app/hklm/*.js (gbareal/patch_gba.py)
function gbaModules(skipDirs){
  const g = fs.readdirSync(R + 'gba').filter(d => fs.existsSync(`${R}gba/${d}/${d}.js`) && !(skipDirs || []).includes(d)).sort().map(d => `${R}gba/${d}/${d}.js`);
  const h = fs.readdirSync(R + 'gbareal/app/hklm').filter(f => f.endsWith('.js') && !f.startsWith('_')).sort().map(f => R + 'gbareal/app/hklm/' + f);
  return g.concat(h.length ? [R + 'gbareal/app/hklm/_pre.js'] : [], h);   // _pre.js first, as patch_gba.py
}
module.exports = {gbaModules, R, XY, LL, makeEnv, loadModules, buildKey, trisOf, lastPlace};
