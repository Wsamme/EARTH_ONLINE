// node geometry check: loads three, stubs LTris / LLathe / site ctx, builds every key, prints tris, extent, min y
const fs = require('fs');
global.self = global; global.window = global;
global.THREE = require('/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/vend/package/build/three.min.js');
global.LANDMARKS = {}; global.SITES = {}; global.SG_PLACES = []; global.NIGHT = {uNight:{value:0}};
let tris = 0, ext = null;
global.LTris = (g, a, col) => { tris += a.length/9; for (let i = 0; i < a.length; i += 3){ if (!isFinite(a[i] + a[i+1] + a[i+2])) throw new Error('NaN vertex ' + JSON.stringify(col)); ext = ext || [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (let k = 0; k < 3; k++){ ext[k] = Math.min(ext[k], a[i+k]); ext[k+3] = Math.max(ext[k+3], a[i+k]); } } };
global.LLathe = () => {};
eval(fs.readFileSync(process.argv[2], 'utf8'));
for (const [k, d] of Object.entries(LANDMARKS)){ tris = 0; ext = null; const t0 = Date.now(); d.build(); console.log(k, 'tris', tris, 'ms', Date.now() - t0, 'x', ext[0].toFixed(0), ext[3].toFixed(0), 'y', ext[1].toFixed(1), ext[4].toFixed(1), 'z', ext[2].toFixed(0), ext[5].toFixed(0), 'r', d.r, 'h', d.h); }
let rs = 1; const ctx = {gy:() => 0, rng:() => { rs = (rs*16807) % 2147483647; return rs/2147483647; }, paint(){}, line(){}, tree(){ ctx.nt++; }, lamp(){ ctx.nl++; }, nt:0, nl:0};
for (const [k, d] of Object.entries(SITES)){ tris = 0; ext = null; ctx.nt = 0; ctx.nl = 0; d.build(ctx); console.log(k, 'tris', tris, 'trees', ctx.nt, 'lamps', ctx.nl, ext ? 'x ' + ext[0].toFixed(0) + ' ' + ext[3].toFixed(0) + ' y ' + ext[4].toFixed(1) : ''); }
console.log(JSON.stringify(SG_PLACES));
