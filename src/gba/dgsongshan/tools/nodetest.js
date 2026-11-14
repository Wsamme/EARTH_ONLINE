const fs = require('fs'), SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
global.THREE = require(SC + 'vend/package/build/three.min.js');
let seed = 1; const rng = () => (seed = (seed*16807) % 2147483647)/2147483647;
global.LMCTX = {rng}; let tris = 0, meshes = 0, ymin = 1e9, ymax = -1e9;
global.lmAdd = (g, geo, spec, x, y, z) => { const p = geo.attributes.position; tris += (geo.index ? geo.index.count : p.count)/3; meshes++; for (let i = 0; i < p.count; i++){ const v = p.getY(i) + y; if (isNaN(v)) throw new Error('NaN'); ymin = Math.min(ymin, v); ymax = Math.max(ymax, v); } const m = new THREE.Mesh(geo); g.add(m); return m; };
global.LTris = (g, pos, col) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return lmAdd(g, geo, col, 0, 0, 0); };
global.LLathe = (g, pts, x, y, z, col, seg) => lmAdd(g, new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg || 20), col, x, y, z);
global.LBeam = (g, a, b, r, col, seg) => lmAdd(g, new THREE.CylinderGeometry(r, r, 1, seg || 6), col, a[0], a[1], a[2]);
global.LANDMARKS = {}; global.SITES = {}; global.SG_PLACES = [];
eval(fs.readFileSync(__dirname + '/../dgsongshan.js', 'utf8'));
for (const [k, S] of Object.entries(SITES)){ tris = 0; meshes = 0; ymin = 1e9; ymax = -1e9; let nt = 0, nl = 0, np = 0;
  const ctx = {gy:(x, z) => 20 + 0.01*x, paint:() => np++, line:() => {}, tree:() => nt++, lamp:() => nl++, rng};
  const t0 = Date.now(); S.build(ctx); console.log('site', k, 'tris', tris, 'meshes', meshes, 'trees', nt, 'lamps', nl, 'y', ymin.toFixed(1), ymax.toFixed(1), 'ms', Date.now() - t0, 'keep', S.keep.length, 'r', S.r); }
for (const [k, L] of Object.entries(LANDMARKS)){ tris = 0; meshes = 0; ymin = 1e9; ymax = -1e9; const t0 = Date.now(); L.build(); console.log('lm', k, 'tris', tris, 'meshes', meshes, 'y', ymin.toFixed(1), ymax.toFixed(1), 'ms', Date.now() - t0, 'r', L.r, 'h', L.h); }
console.log(SG_PLACES.map(p => JSON.stringify(p)).join('\n'));
