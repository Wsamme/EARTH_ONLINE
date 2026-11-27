// The ground the existing Tokyo models take, as the app computes it: every placed landmark's hull (vertices below 25 m, convex hull
// grown 3 m — tyoreal.js sgrLandmarkHulls) and every site's keep polygon (siteKeep: S.keep or a circle of r). Evaluates the modules
// the Tokyo build globs (src/tyo/<d>/<d>.js) + optional extra module files.
// usage: node hulls.js <out.json> [extra.js,…]   -> [{key, kind:'lm'|'site', label, mod, lat, lon, r, poly:[[lat,lon],…]}]
const K = require('./lmenv.js'), fs = require('fs'), path = require('path');
function compute(extra, skipDirs){
const dirs = fs.readdirSync(K.R + 'tyo').filter(d => fs.existsSync(`${K.R}tyo/${d}/${d}.js`) && !(skipDirs || []).includes(d)).sort();
const files = dirs.map(d => `${K.R}tyo/${d}/${d}.js`).concat((extra || []).map(f => path.resolve(f)));
const ctx = K.makeEnv(); const own = K.loadModules(ctx, files);
const hull = pts => { pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (pts.length < 3) return pts; const cr = (o, a, b) => (a[0] - o[0])*(b[1] - o[1]) - (a[1] - o[1])*(b[0] - o[0]), lo = [], up = [];
  for (const p of pts){ while (lo.length >= 2 && cr(lo[lo.length-2], lo[lo.length-1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--){ const p = pts[i]; while (up.length >= 2 && cr(up[up.length-2], up[up.length-1], p) <= 0) up.pop(); up.push(p); } up.pop(); lo.pop(); return lo.concat(up); };
const out = []; let id = 1, nerr = 0;
for (const p of ctx.SG_PLACES){
  const def = ctx.__LM.LANDMARKS[p.type]; if (!def) continue;
  let poly = null;
  try {
    const b = K.buildKey(ctx, p.type, id++), [X, Y] = K.XY(p.lat, p.lon), c = Math.cos(p.rot || 0), s = Math.sin(p.rot || 0), pts = [];
    for (const t of K.trisOf(ctx, b.g)){ const a = t.pos, st = Math.max(3, Math.floor(a.length/18000)*3); for (let i = 0; i < a.length; i += st){ if (a[i + 1] >= 25) continue;
      const x = a[i], z = a[i + 2], wx = x*c + z*s, wz = -x*s + z*c; pts.push([X + wx, Y - wz]); } }   // rotation.y = rot (three.js), world z = -y
    let P = hull(pts);
    if (P.length >= 3){ const cx = P.reduce((u, q) => u + q[0], 0)/P.length, cy = P.reduce((u, q) => u + q[1], 0)/P.length; P = P.map(q => { const dx = q[0] - cx, dy = q[1] - cy, d = Math.hypot(dx, dy) || 1; return [q[0] + dx/d*3, q[1] + dy/d*3]; }); poly = P.map(q => K.LL(q[0], q[1]).map(v => +v.toFixed(7))); }
  } catch (e){ nerr++; console.log('build error', p.type, e.message); }
  out.push({key:p.type, kind:'lm', label:def.label !== false && !def.sub, mod:(own[p.type] || '').split('/').slice(-2)[0], lat:p.lat, lon:p.lon, r:def.r, poly});
}
for (const [k, S] of Object.entries(ctx.SITES)){
  const [X, Y] = K.XY(S.lat, S.lon); let ring = S.keep;
  if (ring && Array.isArray(ring[0]) && Array.isArray(ring[0][0])) ring = ring[0];
  const P = ring ? ring.map(q => [X + q[0], Y - q[1]]) : Array.from({length:48}, (_, i) => [X + Math.cos(i/48*2*Math.PI)*S.r, Y + Math.sin(i/48*2*Math.PI)*S.r]);
  out.push({key:k, kind:'site', label:S.label !== false, mod:(own[k] || '').split('/').slice(-2)[0], lat:S.lat, lon:S.lon, r:S.r, keep:!!ring, poly:P.map(q => K.LL(q[0], q[1]).map(v => +v.toFixed(7)))});
}
return {out, files, nerr};
}
module.exports = {compute};
if (require.main === module){
const {out, files, nerr} = compute((process.argv[3] || '').split(',').filter(Boolean));
fs.writeFileSync(process.argv[2], JSON.stringify(out));
console.log('modules', files.length, 'landmark placements', out.filter(o => o.kind === 'lm').length, 'with hull', out.filter(o => o.poly && o.kind === 'lm').length, 'sites', out.filter(o => o.kind === 'site').length, 'build errors', nerr);
}
