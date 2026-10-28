// offline build check (no browser): node nodetest.js [key|site:key ...] -> stats per model (tris, calls, mats, ms, rmax, y range)
const vm = require('vm'), fs = require('fs');
const SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
const ctx = {console, Math, Float32Array, Uint8Array, Uint16Array, Uint32Array, Int32Array, Array, Object, Map, Set, JSON, performance:require('perf_hooks').performance};
ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(SC + 'vend/package/build/three.min.js', 'utf8'), ctx);
vm.runInContext('var NIGHT = {uNight:{value:0}}; var lampTex = null;', ctx);
vm.runInContext(fs.readFileSync(SC + 'hkreal/kit/lmbase.js', 'utf8'), ctx);
vm.runInContext(`var CALLS = 0; { const _a = lmAdd; lmAdd = function(){ CALLS++; return _a.apply(this, arguments); }; }`, ctx);
vm.runInContext(fs.readFileSync(SC + 'gba/szeast/szeast.js', 'utf8').replace(/^\{/m, '{ globalThis.__D = null;').replace(/const D = /, 'const D = globalThis.__D = '), ctx);
const want = process.argv.slice(2).filter(a => !a.startsWith('--')); const DUMPDIR = (process.argv.find(a => a.startsWith('--dump=')) || '').slice(7); ctx.DUMP = !!DUMPDIR; ctx.DUMPS = {};
const res = vm.runInContext(`(() => { const out = [];
  const keys = ${JSON.stringify(want)}.length ? ${JSON.stringify(want)} : Object.keys(LANDMARKS).filter(k => k.startsWith('sz')).concat(Object.keys(SITES).filter(k => k.startsWith('sz')).map(k => 'site:' + k));
  for (const k of keys){ const site = k.startsWith('site:'), kk = site ? k.slice(5) : k, def = site ? SITES[kk] : LANDMARKS[kk]; if (!def){ out.push({k, err:'missing'}); continue; }
    const ST = {paint:0, line:0, tree:0, lamp:0}, T = __D[kk] && __D[kk].T;
    const gy = (x, z) => { if (!T) return 0; const n = T.n, c = (n - 1)/2, cl = (v, a, b) => v < a ? a : v > b ? b : v, fx = cl(x/T.s + c, 0, n - 1.001), fz = cl(z/T.s + c, 0, n - 1.001), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, H = T.h; return (H[j][i]*(1 - u) + H[j][i+1]*u)*(1 - v) + (H[j+1][i]*(1 - u) + H[j+1][i+1]*u)*v; };
    const cx = {gy, paint:() => ST.paint++, line:() => ST.line++, tree:() => ST.tree++, lamp:() => ST.lamp++, rng:mulberry32(99)};
    const lt = def.lt || {m:1, c:'#d6e4ff', k:0.6};
    LMCTX = {mats:new Map(), fx:[], rng:mulberry32(7919 + 13), u:{base:{value:0}, top:{value:def.h}, col:{value:new THREE.Color(lt.c)}, k:{value:lt.k}, mode:{value:lt.m}, even:{value:lt.e || 0}}};
    CALLS = 0; const t0 = performance.now(); let g;
    try { g = site ? def.build(cx) : def.build(); } catch (e){ out.push({k, err:String(e.stack).slice(0, 900)}); LMCTX = null; continue; }
    let tris = 0; g.traverse(o => { if (o.isMesh){ const a = o.geometry.attributes.position; tris += (o.geometry.index ? o.geometry.index.count : a.count)/3; } });
    lmMerge(g); const ms = performance.now() - t0;
    let rmax = 0, ymax = -1e9, ymin = 1e9, nan = 0;
    g.traverse(o => { if (!o.isMesh) return; const a = o.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3){ if (!isFinite(a[i] + a[i+1] + a[i+2])) { nan++; continue; } rmax = Math.max(rmax, Math.hypot(a[i], a[i+2])); ymax = Math.max(ymax, a[i+1]); ymin = Math.min(ymin, a[i+1]); } });
    if (globalThis.DUMP){ const pos = [], col = []; g.traverse(o => { if (!o.isMesh) return; const a = o.geometry.attributes.position, ix = o.geometry.index, c = o.material.color || new THREE.Color('#888'), ca = o.geometry.attributes.color;
        const N = ix ? ix.count : a.count; for (let i = 0; i < N; i++){ const j = ix ? ix.getX(i) : i; pos.push(a.getX(j), a.getY(j), a.getZ(j)); if (ca) col.push(ca.getX(j), ca.getY(j), ca.getZ(j)); else col.push(c.r, c.g, c.b); } });
      DUMPS[k] = {pos, col}; }
    out.push({k, ST:site ? ST : undefined, r:def.r, h:def.h, tris:Math.round(tris), calls:CALLS, mats:LMCTX.mats.size, ms:Math.round(ms), rmax:Math.round(rmax), ymax:+ymax.toFixed(1), ymin:+ymin.toFixed(1), nan});
    LMCTX = null; }
  return out; })()`, ctx);
for (const r of res) console.log(JSON.stringify(r));
if (DUMPDIR){ fs.mkdirSync(DUMPDIR, {recursive:true}); for (const [k, v] of Object.entries(ctx.DUMPS)){ fs.writeFileSync(DUMPDIR + '/' + k.replace(':', '_') + '.pos', Buffer.from(new Float32Array(v.pos).buffer)); fs.writeFileSync(DUMPDIR + '/' + k.replace(':', '_') + '.col', Buffer.from(new Float32Array(v.col).buffer)); } }
