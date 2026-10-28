// offline check of gba/sznorth/sznorth.js: run every build() with stub helpers; tris, calls, colour specs, rmax, y range, ms
global.THREE = require('/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/vend/package/build/three.min.js');
const fs = require('fs');
let st;
const reset = () => st = {tris:0, calls:0, rmax:0, ymax:-1e9, ymin:1e9, specs:new Set()};
const acc = (pos, x0, y0, z0) => { for (let i = 0; i < pos.length; i += 3){ const x = pos[i] + (x0 || 0), y = pos[i + 1] + (y0 || 0), z = pos[i + 2] + (z0 || 0); if (!isFinite(x + y + z)) throw new Error('NaN vertex');
  st.rmax = Math.max(st.rmax, Math.hypot(x, z)); st.ymax = Math.max(st.ymax, y); st.ymin = Math.min(st.ymin, y); } };
global.LTris = (g, pos, col) => { st.calls++; st.tris += pos.length/9; acc(pos); st.specs.add(JSON.stringify(col)); };
global.lmAdd = (g, geo, col, x, y, z) => { st.calls++; const p = (geo.index ? geo.toNonIndexed() : geo).attributes.position.array; st.tris += p.length/9; acc(p, x, y, z); st.specs.add(JSON.stringify(col)); };
global.LCyl = (g, rt, rb, h, x, y, z, col, seg) => global.lmAdd(g, new THREE.CylinderGeometry(rt, rb, h, seg || 20), col, x, y + h/2, z);
global.LCone = (g, r, h, x, y, z, col, seg) => global.lmAdd(g, new THREE.ConeGeometry(r, h, seg || 16), col, x, y + h/2, z);
global.NIGHT = {uNight:{value:0}}; global.lampTex = null;
global.LANDMARKS = {}; global.SITES = {}; global.SG_PLACES = [];
let s = 7; const rng = () => (s = (s*16807) % 2147483647)/2147483647;
global.LMCTX = {rng};
eval(fs.readFileSync(process.argv[2], 'utf8'));
const only = process.argv[3] ? process.argv[3].split(',') : null;
const ctx = {gy:(x, z) => 40 + 0.004*x, paint(){}, line(){}, tree(){ st.calls++; }, lamp(){}, rng};
const out = (k, o, r) => console.log(k.padEnd(22), JSON.stringify({tris:Math.round(st.tris), calls:st.calls, specs:st.specs.size, rmax:+st.rmax.toFixed(1), r, ymin:+st.ymin.toFixed(1), ymax:+st.ymax.toFixed(1), ms:o}));
for (const [k, L] of Object.entries(LANDMARKS)){ if (only && !only.includes(k)) continue; reset(); const t0 = Date.now();
  try { L.build(); out(k, Date.now() - t0, L.r); } catch (e){ console.log(k, 'ERROR', e.stack.split('\n').slice(0, 4).join(' | ')); } }
for (const [k, S] of Object.entries(SITES)){ if (only && !only.includes(k)) continue; reset(); const t0 = Date.now();
  try { S.build(ctx); out(k, Date.now() - t0, S.r); } catch (e){ console.log(k, 'ERROR', e.stack.split('\n').slice(0, 4).join(' | ')); } }
for (const p of SG_PLACES) console.log('SG_PLACES.push(' + JSON.stringify(p) + ');');
