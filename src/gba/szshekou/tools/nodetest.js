// node nodetest.js [keys] : builds every landmark / site of szshekou.js in node (no rendering): errors, tris, ms, rmax, low verts
const fs = require('fs'), vm = require('vm'), SC = __dirname + '/../../..';
const ctx = {console, Math, Date, performance:require('perf_hooks').performance, Float32Array, Uint32Array, Array, Object, Map, Set, JSON, isFinite, parseInt};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(SC + '/vend/package/build/three.min.js', 'utf8'), ctx);
let base = fs.readFileSync(SC + '/lm16/kit/base.js', 'utf8');
const mod = fs.readFileSync(__dirname + '/../szshekou.js', 'utf8');
vm.runInContext(base + '\n;globalThis.__L = LANDMARKS; globalThis.__S = SITES; globalThis.__P = SG_PLACES; globalThis.__set = v => { LMCTX = v; };\n' + mod.replace(/^\{/m, '{') , ctx);
const only = process.argv[2] ? process.argv[2].split(',') : null;
const THREE = ctx.THREE, mk = h => ({mats:new Map(), fx:[], rng:ctx.mulberry32(7919), u:{base:{value:0}, top:{value:h}, col:{value:new THREE.Color('#fff')}, k:{value:0.5}, mode:{value:0}, even:{value:0}}});
const dump = (g, key) => { if (!process.env.DUMP) return; g.updateMatrixWorld(true); const out = []; const v = new THREE.Vector3();
  g.traverse(o => { if (!o.isMesh) return; const a = o.geometry.attributes.position, col = o.material.color, ca = o.geometry.attributes.color, idx = o.geometry.index; const n = idx ? idx.count : a.count;
    for (let t = 0; t < n; t += 3){ const tri = []; for (let k = 0; k < 3; k++){ const i = idx ? idx.getX(t + k) : t + k; v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld); tri.push(+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)); }
      const c = ca ? [ca.getX(idx ? idx.getX(t) : t), ca.getY(idx ? idx.getX(t) : t), ca.getZ(idx ? idx.getX(t) : t)] : [col.r, col.g, col.b];
      tri.push(+c[0].toFixed(3), +c[1].toFixed(3), +c[2].toFixed(3)); out.push(tri); } });
  fs.writeFileSync(process.env.DUMP + '/' + key + '.json', JSON.stringify(out)); };
const stat = (g, key) => { dump(g, key); let tris = 0, rmax = 0, mats = new Set(), lowN = 0; g.updateMatrixWorld(true); const v = new THREE.Vector3(); let ymin = 1e9, ymax = -1e9;
  g.traverse(o => { if (!o.isMesh) return; mats.add(o.material); const a = o.geometry.attributes.position; tris += (o.geometry.index ? o.geometry.index.count : a.count)/3;
    for (let i = 0; i < a.count; i++){ v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld); if (!isFinite(v.x + v.y + v.z)) { console.log('NaN in', key); return; } rmax = Math.max(rmax, Math.hypot(v.x, v.z)); ymin = Math.min(ymin, v.y); ymax = Math.max(ymax, v.y); } });
  return {tris:Math.round(tris), mats:mats.size, rmax:Math.round(rmax), y:[+ymin.toFixed(1), +ymax.toFixed(1)]}; };
for (const k of Object.keys(ctx.__L)){
  if (!k.startsWith('sz') || (only && !only.includes(k))) continue; const d = ctx.__L[k]; ctx.__set(mk(d.h)); const t0 = Date.now(); let calls = 0;
  try { const g = d.build(); const s = stat(g, k); console.log(k, JSON.stringify(Object.assign(s, {ms:Date.now() - t0, r:d.r, h:d.h}))); } catch (e){ console.log('ERR', k, e.stack.split('\n').slice(0, 4).join(' | ')); }
}
for (const k of Object.keys(ctx.__S)){
  if (only && !only.includes(k)) continue; const S = ctx.__S[k]; ctx.__set(mk(S.h)); const t0 = Date.now(); let np = 0, nt = 0, nl = 0, nline = 0;
  const c = {gy:(x, z) => 0, paint:() => np++, line:() => nline++, tree:() => nt++, lamp:() => nl++, rng:ctx.mulberry32(5)};
  try { const g = S.build(c); const s = stat(g, k); console.log(k, JSON.stringify(Object.assign(s, {ms:Date.now() - t0, r:S.r, paint:np, line:nline, trees:nt, lamps:nl, keep:S.keep ? S.keep.length : 0}))); } catch (e){ console.log('ERR', k, e.stack.split('\n').slice(0, 4).join(' | ')); }
}
