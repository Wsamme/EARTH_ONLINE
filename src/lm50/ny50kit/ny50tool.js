// lm50 New York landmark kit (node, offline). Replaces the lost nycreal/kit + lm22 nstat/ndump + lm26 oplan for the NYC page.
// Builds landmarks with the app's own helper block (lmbase_ny50.js, sliced from site/nyc-app.js by mklmbase_ny50.sh) and three r128.
//   node ny50tool.js near <lat> <lon> [r=600] [extra.js,...]      existing NYC landmark models / sites near a point (+ hull distance)
//   node ny50tool.js stat <module.js> <key1,key2,...>               calls (meshes before merge), tris, ms, mats, r used, rmax, ymin/ymax
//   node ny50tool.js dump <module.js> <key> <out.bin>               triangles + colours for ny50render.py (model frame, y up)
//   node ny50tool.js plan <module.js> <key> <out.json>              world-placed lower-25 m hull (+3 m, like the app) and plan triangles
//   node ny50tool.js hulls <out.json> [module folders a,b]          hulls of every placed landmark of R/nyc/*/*.js (lat/lon) + sites
// Module paths: absolute, or relative to the current directory. Existing modules: R/nyc/<d>/<d>.js (R = /home/claude/earth_online/src).
// Frame: the app places a landmark group at (x, top, -y) with x = (lon + 73.98)*84516, y = (lat - 40.70)*111048 and rotation.y = rot.
const fs = require('fs'), vm = require('vm'), path = require('path');
const R = '/home/claude/earth_online/src/', K = __dirname + '/';
const MX = 84516, MY = 111048, LON0 = -73.98, LAT0 = 40.70;
global.window = global; global.navigator = {userAgent:'node'};
global.THREE = require('/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/vend/package/build/three.min.js');
vm.runInThisContext(fs.readFileSync(K + 'lmbase_ny50.js', 'utf8') + '\nglobal.__L = LANDMARKS; global.__P = SG_PLACES; global.__S = SITES; global.__setCtx = c => { LMCTX = c; };', {filename:'lmbase_ny50.js'});
const LM_C2 = ['#ff8a3d', '#3dd6ff', '#c86bff', '#5dff8a'];
const existingFiles = (only) => fs.readdirSync(R + 'nyc').filter(d => fs.existsSync(`${R}nyc/${d}/${d}.js`) && (!only || only.includes(d))).sort().map(d => `${R}nyc/${d}/${d}.js`);
const own = new Map(), sown = new Map();
function load(files){
  for (const f of files){ const n0 = __P.length, s0 = new Set(Object.keys(__S));
    try { vm.runInThisContext(fs.readFileSync(f, 'utf8'), {filename:f}); } catch (e){ console.error('(load error ' + f + ': ' + String(e.message).slice(0, 120) + ')'); }
    for (let i = n0; i < __P.length; i++) own.set(__P[i].type, [__P[i], f]);
    for (const k of Object.keys(__S)) if (!s0.has(k)) sown.set(k, [__S[k], f]); }
}
let idc = 1;
function build(key){
  const def = __L[key]; if (!def) throw new Error('no LANDMARKS.' + key);
  const id = idc++, lt = def.lt || (def.cat === 'new' ? {m:1, c:'#d6e4ff', k:0.6} : {m:0, c:'#ffc98a', k:0.9});
  const A = {breathe:1, cycle:2, sweep:3, show:4}, anim = lt.anim !== undefined ? (A[lt.anim] || 0) : lt.m === 1 ? 2 : lt.m === 0 ? 1 : 0;
  __setCtx({mats:new Map(), fx:[], rng:mulberry32(id*7919 + 13), u:{base:{value:0}, top:{value:def.h}, col:{value:new THREE.Color(lt.c)}, k:{value:lt.k}, mode:{value:lt.m}, even:{value:lt.e || 0}, anim:{value:anim}, col2:{value:new THREE.Color(lt.c2 || LM_C2[id % 4])}, ph:{value:(id*0.618) % 1}}});
  const t0 = process.hrtime.bigint(); const g = def.build(); let calls = 0; g.traverse(o => { if (o.isMesh) calls++; });
  const live = (g.userData && g.userData.live) || [], keep = (g.userData && g.userData.keep) || [];
  for (const o of keep) g.remove(o);
  for (const o of live){ g.remove(o); o.position.set(0, 0, 0); o.quaternion.identity(); o.scale.set(1, 1, 1); o.updateMatrix(); lmMerge(o); }
  lmMerge(g); for (const o of live) g.add(o); for (const o of keep) g.add(o);
  const ms = Number(process.hrtime.bigint() - t0)/1e6; __setCtx(null);
  return {g, def, calls, ms};
}
function place(key){ const e = own.get(key); return e ? e[0] : null; }
function worldPts(g, p, below){   // plan points [X, Y] (east, north metres in the NYC frame) of vertices with y < below
  g.position.set(0, 0, 0); g.rotation.set(0, p ? p.rot || 0 : 0, 0); g.updateMatrixWorld(true);
  const x0 = p ? (p.lon - LON0)*MX : 0, y0 = p ? (p.lat - LAT0)*MY : 0, v = new THREE.Vector3(), pts = [];
  g.traverse(o => { if (!o.isMesh || !o.geometry.attributes.position) return; const a = o.geometry.attributes.position, st = Math.max(1, Math.floor(a.count/6000));
    for (let i = 0; i < a.count; i += st){ v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld); if (v.y < below) pts.push([x0 + v.x, y0 - v.z]); } });
  return pts;
}
function hull(pts){
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (pts.length < 3) return pts;
  const cr = (o, a, b) => (a[0] - o[0])*(b[1] - o[1]) - (a[1] - o[1])*(b[0] - o[0]), lo = [], up = [];
  for (const p of pts){ while (lo.length >= 2 && cr(lo[lo.length-2], lo[lo.length-1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--){ const p = pts[i]; while (up.length >= 2 && cr(up[up.length-2], up[up.length-1], p) <= 0) up.pop(); up.push(p); }
  up.pop(); lo.pop(); const P = lo.concat(up);
  let cx = 0, cy = 0; for (const q of P){ cx += q[0]; cy += q[1]; } cx /= P.length; cy /= P.length;
  return P.map(q => { const dx = q[0] - cx, dy = q[1] - cy, d = Math.hypot(dx, dy) || 1; return [q[0] + dx/d*3, q[1] + dy/d*3]; });
}
const toLL = ([x, y]) => [+(LAT0 + y/MY).toFixed(7), +(LON0 + x/MX).toFixed(7)];
const [cmd, ...a] = process.argv.slice(2);
if (cmd === 'near'){
  const lat = +a[0], lon = +a[1], Rr = +(a[2] || 600), extra = (a[3] || '').split(',').filter(Boolean).map(f => path.resolve(f));
  load(existingFiles().concat(extra));
  const X = (lon - LON0)*MX, Y = (lat - LAT0)*MY, out = [];
  for (const [k, [p, f]] of own){ const d = Math.hypot((p.lon - lon)*MX, (p.lat - lat)*MY); if (d <= Rr) out.push([d, k, path.relative(R, f), `(${p.lat}, ${p.lon}) r=${__L[k].r} h=${__L[k].h}`]); }
  for (const [k, [s, f]] of sown){ const d = Math.hypot((s.lon - lon)*MX, (s.lat - lat)*MY); if (d <= Rr + (s.r || 0)) out.push([d, k, path.relative(R, f), `SITE r=${s.r} (${s.lat}, ${s.lon})` + (d <= (s.r || 0) ? '  <-- INSIDE site radius' : '')]); }
  out.sort((x, y) => x[0] - y[0]);
  for (const [d, k, f, t] of out){ let hd = '';
    if (!t.startsWith('SITE')){ try { const H = hull(worldPts(build(k).g, place(k), 25)); let inside = true, md = 1e9;
      for (let i = 0; i < H.length; i++){ const p = H[i], q = H[(i + 1) % H.length], ex = q[0] - p[0], ey = q[1] - p[1], L2 = ex*ex + ey*ey || 1;
        const t2 = Math.max(0, Math.min(1, ((X - p[0])*ex + (Y - p[1])*ey)/L2)); md = Math.min(md, Math.hypot(p[0] + t2*ex - X, p[1] + t2*ey - Y)); if (ex*(Y - p[1]) - ey*(X - p[0]) < 0) inside = false; }
      hd = inside ? '  hull: INSIDE' : `  hull ${md.toFixed(0)} m`; } catch (e){ hd = '  (build error ' + e.message.slice(0, 60) + ')'; } }
    console.log(k.padEnd(22), String(Math.round(d)).padStart(5) + ' m ', f.padEnd(24), t + hd); }
} else if (cmd === 'stat'){
  load([path.resolve(a[0])]);
  for (const k of a[1].split(',')){ try { const {g, def, calls, ms} = build(k); let tris = 0, mats = new Set(), r = 0, y0 = 1e9, y1 = -1e9; const v = new THREE.Vector3(); g.updateMatrixWorld(true);
      g.traverse(o => { if (!o.isMesh) return; mats.add(o.material); const pa = o.geometry.attributes.position; tris += o.geometry.index ? o.geometry.index.count/3 : pa.count/3;
        for (let i = 0; i < pa.count; i++){ v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld); r = Math.max(r, Math.hypot(v.x, v.z)); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); } });
      const pl = __P.filter(p => p.type === k).map(p => `(${p.lat}, ${p.lon}, rot ${p.rot})`).join(' ');
      console.log(`${k}: calls ${calls} tris ${Math.round(tris)} ms ${ms.toFixed(0)} mats ${mats.size} r ${def.r} rmax ${r.toFixed(1)} ymin ${y0.toFixed(1)} ymax ${y1.toFixed(1)} h ${def.h} label ${def.label !== false} | ${pl || 'NOT PLACED'}`);
    } catch (e){ console.log(k + ': ERROR ' + e.message); } }
} else if (cmd === 'dump'){
  load([path.resolve(a[0])]); const {g} = build(a[1]); g.updateMatrixWorld(true); const T = [], v = new THREE.Vector3();
  g.traverse(o => { if (!o.isMesh) return; const m = o.material, c = m.color || new THREE.Color(0.7, 0.7, 0.7), pa = o.geometry.attributes.position, ca = o.geometry.attributes.color, ix = o.geometry.index;
    const n = ix ? ix.count : pa.count; for (let i = 0; i < n; i++){ const j = ix ? ix.getX(i) : i; v.fromBufferAttribute(pa, j).applyMatrix4(o.matrixWorld);
      T.push(v.x, v.y, v.z, ca ? c.r*ca.getX(j) : c.r, ca ? c.g*ca.getY(j) : c.g, ca ? c.b*ca.getZ(j) : c.b); } });
  fs.writeFileSync(a[2], Buffer.from(new Float32Array(T).buffer)); console.log('tris', T.length/18, '->', a[2]);
} else if (cmd === 'plan'){
  load([path.resolve(a[0])]); const k = a[1], p = place(k); if (!p) throw new Error(k + ' not placed');
  const {g, def} = build(k), low = worldPts(g, p, 4), H = hull(worldPts(g, p, 25));
  fs.writeFileSync(a[2], JSON.stringify({key:k, place:p, r:def.r, h:def.h, hull:H, low})); console.log('plan', k, 'hull', H.length, 'pts; low', low.length, '->', a[2]);
} else if (cmd === 'hulls'){
  load(existingFiles(a[1] ? a[1].split(',') : null)); const out = {landmarks:{}, sites:{}};
  for (const [k, [p, f]] of own){ try { const H = hull(worldPts(build(k).g, p, 25)); out.landmarks[k] = {mod:path.basename(path.dirname(f)), lat:p.lat, lon:p.lon, r:__L[k].r, en:__L[k].en, hull:H.map(toLL)}; }
    catch (e){ out.landmarks[k] = {mod:path.basename(path.dirname(f)), lat:p.lat, lon:p.lon, r:__L[k].r, en:__L[k].en, hull:null, err:e.message}; } }
  for (const [k, [s, f]] of sown) out.sites[k] = {mod:path.basename(path.dirname(f)), lat:s.lat, lon:s.lon, r:s.r, en:s.en, keep:Array.isArray(s.keep) ? s.keep : null};
  fs.writeFileSync(a[0], JSON.stringify(out)); console.log('landmarks', Object.keys(out.landmarks).length, 'sites', Object.keys(out.sites).length, '->', a[0],
    '| errors:', Object.entries(out.landmarks).filter(([k, o]) => !o.hull).map(([k, o]) => k + ' ' + o.err).join('; ') || 'none');
} else console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(0, 10).join('\n'));
