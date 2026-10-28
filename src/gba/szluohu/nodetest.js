// quick offline check: run every build() with stub helpers, count triangles / calls / rmax / height
global.THREE = require(process.argv[3] || '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/vend/package/build/three.min.js');
const fs = require('fs');
let tris = 0, calls = 0, rmax = 0, ymax = -1e9, ymin = 1e9, specs = new Set(), low = [];
function acc(pos){ for (let i = 0; i < pos.length; i += 3){ const x = pos[i], y = pos[i + 1], z = pos[i + 2]; if (!isFinite(x + y + z)) throw new Error('NaN vertex');
  rmax = Math.max(rmax, Math.hypot(x, z)); ymax = Math.max(ymax, y); ymin = Math.min(ymin, y); } }
global.LTris = (g, pos, col) => { calls++; tris += pos.length/9; acc(pos); specs.add(JSON.stringify(col)); };
const geoAdd = (geo, col, x, y, z) => { calls++; const p = geo.toNonIndexed().attributes.position.array; tris += p.length/9; const q = []; for (let i = 0; i < p.length; i += 3) q.push(p[i] + x, p[i + 1] + y, p[i + 2] + z); acc(q); specs.add(JSON.stringify(col)); };
global.LBeam = (g, a, b, r, col) => { calls++; tris += 16; acc([...a, ...b]); specs.add(JSON.stringify(col)); };
global.LLathe = (g, pts, x, y, z, col, seg) => geoAdd(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg || 20), col, x, y, z);
global.NIGHT = {uNight:{value:0}};
global.LANDMARKS = {}; global.SITES = {}; global.SG_PLACES = [];
eval(fs.readFileSync(process.argv[2], 'utf8'));
let s = 1; const rng = () => (s = (s*16807) % 2147483647)/2147483647;
const ctx = {gy:(x, z) => 1 + 0.002*x, paint(){}, line(){}, tree(){ calls++; }, lamp(){}, rng};
for (const [k, L] of Object.entries(LANDMARKS)){ tris = calls = rmax = 0; ymax = -1e9; ymin = 1e9; specs = new Set(); const t0 = Date.now();
  try { L.build(); console.log(k, JSON.stringify({tris, calls, specs:specs.size, rmax:+rmax.toFixed(1), r:L.r, ymin:+ymin.toFixed(1), ymax:+ymax.toFixed(1), h:L.h, ms:Date.now() - t0})); } catch (e){ console.log(k, 'ERROR', e.stack.split('\n').slice(0, 3).join(' | ')); } }
for (const [k, S] of Object.entries(SITES)){ tris = calls = rmax = 0; ymax = -1e9; ymin = 1e9; specs = new Set(); const t0 = Date.now();
  try { S.build(ctx); console.log(k, JSON.stringify({tris, calls, specs:specs.size, rmax:+rmax.toFixed(1), r:S.r, ymin:+ymin.toFixed(1), ymax:+ymax.toFixed(1), ms:Date.now() - t0})); } catch (e){ console.log(k, 'ERROR', e.stack.split('\n').slice(0, 3).join(' | ')); } }
console.log('places', JSON.stringify(SG_PLACES));
