// which real buildings of the ref would each landmark hide (centroid inside the 2-D hull of its vertices below 25 m, grown 3 m)
const fs = require('fs'); global.THREE = require('/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/vend/package/build/three.min.js');
global.LANDMARKS = {}; global.SITES = {}; global.SG_PLACES = []; global.NIGHT = {uNight:{value:0}}; global.LLathe = () => {};
let P = []; global.LTris = (g, a) => { for (let i = 0; i < a.length; i += 3) if (a[i+1] < 25) P.push([a[i], a[i+2]]); };
eval(fs.readFileSync(process.argv[2], 'utf8'));
const R = JSON.parse(fs.readFileSync('/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/wipsrc/src/gba/ref_dgcity.json', 'utf8')).targets;
function hull(pts){ pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0]); const lo = [], up = [];
  for (const p of pts){ while (lo.length >= 2 && cr(lo[lo.length-2], lo[lo.length-1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of pts.slice().reverse()){ while (up.length >= 2 && cr(up[up.length-2], up[up.length-1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1)); }
const inside = (H, x, z, g) => { for (let i = 0; i < H.length; i++){ const a = H[i], b = H[(i+1)%H.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]); if ((b[0]-a[0])*(z-a[1]) - (b[1]-a[1])*(x-a[0]) < -g*L) return false; } return true; };
for (const [k, d] of Object.entries(LANDMARKS)){ P = []; d.build(); const H = hull(P); const t = R[k];
  const hid = t.buildings.filter(b => inside(H, b.centroid[0], b.centroid[1], 3)).map(b => b.osm + ' ' + (b.zh || '') + ' ' + b.h);
  console.log(k, 'hides:', hid.join(' | ')); }
