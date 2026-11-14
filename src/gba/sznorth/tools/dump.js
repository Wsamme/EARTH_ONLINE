// dump the triangles of one key (landmark or site, flat ground 0) to tmp/dump_<key>.bin (Float32 xyz) + colours json
global.THREE = require('/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/vend/package/build/three.min.js');
const fs = require('fs'); const out = []; const cols = [];
const add = (pos, col, x0, y0, z0) => { const c = typeof col === 'string' ? col : col.c; for (let i = 0; i < pos.length; i += 9){ for (let j = 0; j < 9; j += 3) out.push(pos[i+j] + (x0||0), pos[i+j+1] + (y0||0), pos[i+j+2] + (z0||0)); cols.push(c); } };
global.LTris = (g, pos, col) => add(pos, col);
global.lmAdd = (g, geo, col, x, y, z) => add((geo.index ? geo.toNonIndexed() : geo).attributes.position.array, col, x, y, z);
global.LCyl = (g, rt, rb, h, x, y, z, col, seg) => global.lmAdd(g, new THREE.CylinderGeometry(rt, rb, h, seg || 20), col, x, y + h/2, z);
global.LCone = (g, r, h, x, y, z, col, seg) => global.lmAdd(g, new THREE.ConeGeometry(r, h, seg || 16), col, x, y + h/2, z);
global.NIGHT = {uNight:{value:0}}; global.lampTex = null; global.LANDMARKS = {}; global.SITES = {}; global.SG_PLACES = [];
let s = 7; const rng = () => (s = (s*16807) % 2147483647)/2147483647; global.LMCTX = {rng};
eval(fs.readFileSync(process.argv[2], 'utf8'));
const k = process.argv[3], ctx = {gy:() => 0, paint(){}, line(){}, tree(){}, lamp(){}, rng};
(LANDMARKS[k] ? LANDMARKS[k].build() : SITES[k].build(ctx));
fs.writeFileSync('tmp/dump.bin', Buffer.from(new Float32Array(out).buffer)); fs.writeFileSync('tmp/dump.json', JSON.stringify(cols));
console.log(k, out.length/9);
