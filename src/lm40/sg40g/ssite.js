// offline site harness: node ssite.js sg40g.js key [out.bin]  -> stats (+ triangle dump with trees as cones)
const fs = require('fs'), vm = require('vm');
const SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
global.THREE = require(SC + 'vend/package/build/three.min.js');
let src = fs.readFileSync(SC + 'sgreal/kit/lmbase.js', 'utf8');
src = src.replace(/function lmAdd\(g, geo, spec, x, y, z, ry, ds\)\{/, 'function lmAdd(g, geo, spec, x, y, z, ry, ds){ __calls.n++;');
const T = JSON.parse(fs.readFileSync(__dirname + '/test_terrain.json', 'utf8'));
global.__T = T; global.__fs = fs;
const key = process.argv[3], out = process.argv[4];
const code = 'var __calls = {n:0};\n' + src + '\n' + fs.readFileSync(process.argv[2], 'utf8') + `
{ const S = SITES['${key}'], G = __T['${key}'];
  const gy = (x, z) => { const fx = clamp((x - G.x0)/G.c, 0, G.nx - 1.001), fz = clamp((z - G.z0)/G.c, 0, G.nz - 1.001), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, H = G.h;
    return (H[j][i]*(1-u) + H[j][i+1]*u)*(1-v) + (H[j+1][i]*(1-u) + H[j+1][i+1]*u)*v; };
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  const trees = [], lamps = []; let paints = 0, lines = 0;
  const rng = mulberry32(99);
  const ctx = {gy, paint:() => paints++, line:() => lines++, tree:(x, z, s, k) => trees.push([x, z, s, k]), lamp:(x, y, z, c) => lamps.push([x, y, z]), rng};
  LMCTX = {mats:new Map(), fx:[], rng, u:{base:{value:0}, top:{value:40}, col:{value:new THREE.Color(S.lt.c)}, k:{value:S.lt.k}, mode:{value:S.lt.m}, even:{value:0}}};
  __calls.n = 0; const t0 = Date.now(); const g = S.build(ctx); const ms = Date.now() - t0;
  let tris = 0, rmax = 0, ymin = 1e9, ymax = -1e9; const mats = new Set(); g.updateMatrixWorld(true); const v = new THREE.Vector3();
  const dump = [];
  g.traverse(o => { if (!o.isMesh) return; mats.add(o.material); const gg = o.geometry, p = gg.attributes.position, idx = gg.index, c = o.material.color, n = idx ? idx.count : p.count; tris += n/3;
    for (let i = 0; i < n; i++){ v.fromBufferAttribute(p, idx ? idx.getX(i) : i).applyMatrix4(o.matrixWorld); rmax = Math.max(rmax, Math.hypot(v.x, v.z)); ymin = Math.min(ymin, v.y); ymax = Math.max(ymax, v.y); if ('${out}' !== 'undefined'){ dump.push(v.x, v.y, v.z); if (i % 3 === 2) dump.push(c.r, c.g, c.b); } } });
  let kr = 0; for (const p of S.keep) kr = Math.max(kr, Math.hypot(p[0], p[1]));
  console.log('${key}', JSON.stringify({calls:__calls.n, tris:Math.round(tris), ms, mats:mats.size, rmax:Math.round(rmax), keepR:Math.round(kr), r:S.r, keepN:S.keep.length, ymin:+ymin.toFixed(1), ymax:+ymax.toFixed(1), trees:trees.length, lamps:lamps.length, paints, lines, stats:g.userData.stats}));
  if ('${out}' !== 'undefined'){
    // ground: coarse terrain grid quads; trees as cones
    for (let j = 0; j < G.nz - 1; j += 2) for (let i = 0; i < G.nx - 1; i += 2){ const x0 = G.x0 + i*G.c, z0 = G.z0 + j*G.c, x1 = x0 + 2*G.c, z1 = z0 + 2*G.c, h = (x, z) => gy(x, z) - 0.3;
      dump.push(x0, h(x0, z0), z0, x1, h(x1, z0), z0, x1, h(x1, z1), z1, 0.55, 0.6, 0.5, x0, h(x0, z0), z0, x1, h(x1, z1), z1, x0, h(x0, z1), z1, 0.55, 0.6, 0.5); }
    for (const [x, z, s] of trees){ const y = gy(x, z); for (let k = 0; k < 4; k++){ const a = k*Math.PI/2, b = a + Math.PI/2; dump.push(x + Math.cos(a)*s, y + 4, z + Math.sin(a)*s, x + Math.cos(b)*s, y + 4, z + Math.sin(b)*s, x, y + 4 + 2.6*s, z, 0.25, 0.42, 0.2); } }
    __fs.writeFileSync('${out}', Buffer.from(new Float32Array(dump).buffer));
  }
}`;
vm.runInThisContext(code, {filename:'ssite.js'});
