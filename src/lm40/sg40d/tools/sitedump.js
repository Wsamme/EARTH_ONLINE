// node sitedump.js file.js key out.bin terr.txt : build a SITE with a ctx on the baked app terrain, print stats, dump triangles
global.fs = require('fs'); const vm = require('vm');
const SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
global.THREE = require(SC + 'vend/package/build/three.min.js');
let src = fs.readFileSync(SC + 'sgreal/kit/lmbase.js', 'utf8');
src = src.replace(/function lmAdd\(g, geo, spec, x, y, z, ry, ds\)\{/, 'function lmAdd(g, geo, spec, x, y, z, ry, ds){ __calls.n++;');
const file = fs.readFileSync(process.argv[2], 'utf8'), T = fs.readFileSync(process.argv[5], 'utf8');
vm.runInThisContext('var __calls = {n:0};\n' + src + '\n' + file + `
{ const S = SITES['${process.argv[3]}']; const TT = ${T};
  const hb = (x, y) => { const fx = Math.min(TT.nx - 1.0001, Math.max(0, (x + 28000)/70 - TT.i0)), fy = Math.min(TT.ny - 1.0001, Math.max(0, (y + 28000)/70 - TT.j0)); const i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j, H = TT.H, n = TT.nx; return Math.max(-0.3, ((H[j*n+i]*(1-u) + H[j*n+i+1]*u)*(1-v) + (H[(j+1)*n+i]*(1-u) + H[(j+1)*n+i+1]*u)*v)/10); };
  const X = (S.lon - 103.845)*111290.5, Y = (S.lat - 1.315)*110574;
  const st = {paint:0, line:0, tree:0, lamp:0}, trees = [];
  LMCTX = {mats:new Map(), fx:[], rng:mulberry32(7), u:{base:{value:0}, top:{value:S.h}, col:{value:new THREE.Color(S.lt.c)}, k:{value:S.lt.k}, mode:{value:S.lt.m}, even:{value:0}}};
  const ctx = {gy:(x, z) => hb(X + x, Y - z), paint(){ st.paint++; }, line(){ st.line++; }, tree(x, z, s){ st.tree++; trees.push([x, z, s]); }, lamp(){ st.lamp++; }, rng:mulberry32(11)};
  const t0 = Date.now(); const g = S.build(ctx); const ms = Date.now() - t0;
  g.updateMatrixWorld(true); const out = [], v = new THREE.Vector3(); let tris = 0, mats = new Set();
  g.traverse(o => { if (!o.isMesh) return; mats.add(o.material); const gg = o.geometry, p = gg.attributes.position, idx = gg.index, c = o.material.color, n = idx ? idx.count : p.count; tris += n/3;
    for (let i = 0; i < n; i += 3){ for (let j = 0; j < 3; j++){ v.fromBufferAttribute(p, idx ? idx.getX(i + j) : i + j).applyMatrix4(o.matrixWorld); out.push(v.x, v.y, v.z); } out.push(c.r, c.g, c.b); } });
  // trees as small green pyramids, ground as a grey grid of quads
  for (const [x, z, s] of trees){ const y = ctx.gy(x, z); for (let k = 0; k < 4; k++){ const a0 = k*Math.PI/2, a1 = a0 + Math.PI/2; out.push(x + Math.cos(a0)*s, y + 3, z + Math.sin(a0)*s, x + Math.cos(a1)*s, y + 3, z + Math.sin(a1)*s, x, y + 3 + 2.5*s, z, 0.3, 0.5, 0.25); } }
  for (let x = -300; x < 300; x += 20) for (let z = -150; z < 330; z += 20){ const q = [[x, z], [x + 20, z], [x + 20, z + 20], [x, z + 20]].map(p => [p[0], ctx.gy(p[0], p[1]) - 0.3, p[1]]); out.push(...q[0], ...q[1], ...q[2], 0.75, 0.78, 0.72, ...q[0], ...q[2], ...q[3], 0.75, 0.78, 0.72); }
  fs.writeFileSync('${process.argv[4]}', Buffer.from(new Float32Array(out).buffer));
  console.log(JSON.stringify({calls:__calls.n, tris, ms, mats:mats.size, ...st, keepN:S.keep.length}));
}`);
