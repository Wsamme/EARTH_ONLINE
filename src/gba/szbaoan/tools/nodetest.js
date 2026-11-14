// offline check of every build(): real three.js geometry, stub helpers; tris, calls, specs, rmax, y range, ms, NaN check
global.THREE = require('/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/vend/package/build/three.min.js');
const fs = require('fs');
let tris = 0, calls = 0, rmax = 0, ymax = -1e9, ymin = 1e9, specs = new Set();
function acc(pos){ for (let i = 0; i < pos.length; i += 3){ const x = pos[i], y = pos[i + 1], z = pos[i + 2]; if (!isFinite(x + y + z)) throw new Error('NaN vertex at ' + i);
  rmax = Math.max(rmax, Math.hypot(x, z)); ymax = Math.max(ymax, y); ymin = Math.min(ymin, y); } }
const sp = c => specs.add(typeof c === 'string' ? c : JSON.stringify(c));
const DUMP = process.env.DUMP ? [] : null;
const colOf = c => typeof c === 'string' ? c : c.c;
global.LTris = (g, pos, col) => { calls++; tris += pos.length/9; acc(pos); sp(col); if (DUMP) DUMP.push([colOf(col), Array.from(pos)]); };
const geoAdd = (geo, col, x, y, z) => { calls++; const p = geo.toNonIndexed().attributes.position.array; tris += p.length/9; const q = []; for (let i = 0; i < p.length; i += 3) q.push(p[i] + x, p[i + 1] + y, p[i + 2] + z); acc(q); sp(col); if (DUMP) DUMP.push([colOf(col), q]); };
global.LLathe = (g, pts, x, y, z, col, seg) => geoAdd(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg || 20), col, x, y, z);
global.LCyl = (g, rt, rb, h, x, y, z, col, seg) => geoAdd(new THREE.CylinderGeometry(rt, rb, h, seg || 20), col, x, y + h/2, z);
global.LBox = (g, w, h, d, x, y, z, col) => geoAdd(new THREE.BoxGeometry(w, h, d), col, x, y + h/2, z);
global.LSph = (g, r, x, y, z, col, sy, seg) => { const geo = new THREE.SphereGeometry(r, seg || 20, Math.max(8, (seg || 20)*0.6 | 0)); if (sy) geo.scale(1, sy, 1); geoAdd(geo, col, x, y, z); };
global.LANDMARKS = {}; global.SITES = {}; global.SG_PLACES = [];
let s = 1; const rng = () => (s = (s*16807) % 2147483647)/2147483647;
global.LMCTX = {rng};
eval(fs.readFileSync(process.argv[2], 'utf8'));
const only = process.argv[3] ? process.argv[3].split(',') : null;
const ctx = {gy:(x, z) => 1 + 0.002*x, paint(){}, line(){}, tree(){ calls++; }, lamp(){}, rng};
for (const [k, L] of Object.entries(LANDMARKS)){ if (only && !only.includes(k)) continue; tris = calls = rmax = 0; ymax = -1e9; ymin = 1e9; specs = new Set(); const t0 = Date.now();
  try { L.build(); console.log(k, JSON.stringify({tris, calls, specs:specs.size, rmax:+rmax.toFixed(1), r:L.r, ymin:+ymin.toFixed(1), ymax:+ymax.toFixed(1), h:L.h, ms:Date.now() - t0})); } catch (e){ console.log(k, 'ERROR', e.stack.split('\n').slice(0, 4).join(' | ')); } }
for (const [k, S] of Object.entries(SITES)){ if (only && !only.includes(k)) continue; tris = calls = rmax = 0; ymax = -1e9; ymin = 1e9; specs = new Set(); const t0 = Date.now();
  try { S.build(ctx); console.log(k, JSON.stringify({tris, calls, specs:specs.size, rmax:+rmax.toFixed(1), r:S.r, ymin:+ymin.toFixed(1), ymax:+ymax.toFixed(1), ms:Date.now() - t0})); } catch (e){ console.log(k, 'ERROR', e.stack.split('\n').slice(0, 4).join(' | ')); } }
console.log('places', SG_PLACES.length);
if (DUMP) fs.writeFileSync(process.env.DUMP, JSON.stringify(DUMP));
