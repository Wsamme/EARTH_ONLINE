// offline build check (no browser): node harness.js <module.js> <key|site:key|all> [dumpdir]
// runs build() like the app (sites: ctx.gy from the ref terrain grid), prints tris / parts / ms / rmax, and dumps triangles with
// colours for tools/preview.py
const vm = require('vm'), fs = require('fs'), path = require('path');
const SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
const REF = JSON.parse(fs.readFileSync(SC + 'gba/ref_szoct.json', 'utf8')).targets;
const ctx = {console, Math, Float32Array, Uint8Array, Uint16Array, Uint32Array, Int32Array, Array, Object, Map, Set, JSON, performance:require('perf_hooks').performance};
ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(SC + 'vend/package/build/three.min.js', 'utf8'), ctx);
vm.runInContext('var NIGHT = {uNight:{value:0}}; var lampTex = null;', ctx);
vm.runInContext(fs.readFileSync(SC + 'hkreal/kit/lmbase.js', 'utf8'), ctx);
vm.runInContext(`var CALLS = 0; { const _a = lmAdd; lmAdd = function(){ CALLS++; return _a.apply(this, arguments); }; }`, ctx);
vm.runInContext(fs.readFileSync(path.resolve(process.argv[2]), 'utf8'), ctx);
ctx.REF = REF;
const want = process.argv[3] || 'all', dump = process.argv[4];
const res = vm.runInContext(`(() => { const out = [];
  const keys = ${JSON.stringify(want)} === 'all' ? Object.keys(LANDMARKS).concat(Object.keys(SITES).map(k => 'site:' + k)) : ${JSON.stringify(want)}.split(',');
  for (const k of keys){ const site = k.startsWith('site:'), kk = site ? k.slice(5) : k, def = site ? SITES[kk] : LANDMARKS[kk]; if (!def){ out.push({k, err:'missing'}); continue; }
    const ST = {paint:0, line:0, tree:0, lamp:0}, trees = [], lamps = [], paints = [];
    const T = REF[kk] && REF[kk].terrain, gy = (x, z) => { if (!T) return 0; const n = T.n, c = (n - 1)/2, fx = clamp(x/T.step + c, 0, n - 1.001), fz = clamp(z/T.step + c, 0, n - 1.001), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, H = T.rows_north_to_south;
      return (H[j][i]*(1 - u) + H[j][i+1]*u)*(1 - v) + (H[j+1][i]*(1 - u) + H[j+1][i+1]*u)*v; };
    function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
    const cx = {gy, paint:(P, c) => { ST.paint++; paints.push({P, c}); }, line:(L, w, c) => { ST.line++; paints.push({L, w, c}); }, tree:(x, z, s, kd) => { ST.tree++; trees.push([x, z, s, kd]); }, lamp:(x, y, z, c) => { ST.lamp++; lamps.push([x, y, z]); }, rng:mulberry32(99)};
    const lt = def.lt || {m:1, c:'#d6e4ff', k:0.6};
    LMCTX = {mats:new Map(), fx:[], rng:mulberry32(7919 + 13), u:{base:{value:0}, top:{value:def.h}, col:{value:new THREE.Color(lt.c)}, k:{value:lt.k}, mode:{value:lt.m}, even:{value:lt.e || 0}}};
    CALLS = 0; const t0 = performance.now(); let g;
    try { g = site ? def.build(cx) : def.build(); } catch (e){ out.push({k, err:String(e.stack).slice(0, 900)}); LMCTX = null; continue; }
    let tris = 0; g.traverse(o => { if (o.isMesh){ const a = o.geometry.attributes.position; tris += (o.geometry.index ? o.geometry.index.count : a.count)/3; } });
    lmMerge(g); const ms = performance.now() - t0;
    let rmax = 0, ymax = -1e9, ymin = 1e9, nan = 0; const meshes = [];
    g.traverse(o => { if (!o.isMesh) return; const a = o.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3){ if (!isFinite(a[i] + a[i+1] + a[i+2])) { nan++; continue; } rmax = Math.max(rmax, Math.hypot(a[i], a[i+2])); ymax = Math.max(ymax, a[i+1]); ymin = Math.min(ymin, a[i+1]); }
      const m = o.material, ca = o.geometry.attributes.color; meshes.push({c:'#' + m.color.getHexString(), glow:m.userData && m.userData.glow, pos:a, col:ca ? ca.array : null}); });
    out.push({k, ST:site ? ST : undefined, r:def.r, h:def.h, tris:Math.round(tris), calls:CALLS, mats:LMCTX.mats.size, ms:Math.round(ms), rmax:Math.round(rmax), ymax:+ymax.toFixed(1), ymin:+ymin.toFixed(1), nan, meshes, trees, lamps, paints, keep:def.keep || null});
    LMCTX = null; }
  return out; })()`, ctx);
for (const r of res){ const {meshes, trees, lamps, paints, keep, ...s} = r; console.log(JSON.stringify(s));
  if (dump && meshes){ fs.mkdirSync(dump, {recursive:true});
    // binary: per mesh [nverts u32][base rgb f32 x3][has col u8] pos f32[] (col f32[])
    const bufs = []; for (const m of meshes){ const h = Buffer.alloc(17); h.writeUInt32LE(m.pos.length/3, 0); const c = parseInt(m.c.slice(1), 16); h.writeFloatLE(((c >> 16) & 255)/255, 4); h.writeFloatLE(((c >> 8) & 255)/255, 8); h.writeFloatLE((c & 255)/255, 12); h.writeUInt8(m.col ? 1 : 0, 16);
      bufs.push(h, Buffer.from(new Float32Array(m.pos).buffer)); if (m.col) bufs.push(Buffer.from(new Float32Array(m.col).buffer)); }
    fs.writeFileSync(path.join(dump, r.k.replace(':', '_') + '.bin'), Buffer.concat(bufs));
    fs.writeFileSync(path.join(dump, r.k.replace(':', '_') + '.json'), JSON.stringify({trees, lamps:lamps.length, keep, paints:paints.filter(p => p.P).map(p => ({P:p.P, c:p.c}))})); } }
