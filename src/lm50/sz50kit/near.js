// Existing Greater Bay models near a point (by evaluating the modules the Greater Bay build loads: src/gba/<d>/<d>.js and the Hong Kong
// copies src/gbareal/app/hklm/*.js, plus your files):
// landmarks with their app hull (lower 25 m, +3 m) and distance from the point to the hull; sites with their keep polygon (INSIDE = the
// point is inside the keep, i.e. the site hides / redraws the real city there).
// usage: node near.js <lat> <lon> [r=600] [your.js,other.js]       (your own group folder is skipped when you pass its file)
const H = require('./hulls.js'), K = require('./lmenv.js'), path = require('path');
const [lat, lon] = [+process.argv[2], +process.argv[3]], R = +(process.argv[4] || 600), extra = (process.argv[5] || '').split(',').filter(Boolean);
const skip = extra.map(f => path.basename(path.dirname(path.resolve(f))));
const {out} = H.compute(extra, skip, {lat, lon, R}); const [X, Y] = K.XY(lat, lon);
const pip = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0])*(y - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
const dseg = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx*dx + dy*dy, t = L ? Math.max(0, Math.min(1, ((p[0] - a[0])*dx + (p[1] - a[1])*dy)/L)) : 0; return Math.hypot(p[0] - a[0] - t*dx, p[1] - a[1] - t*dy); };
const rows = [];
for (const o of out){
  if (!o.poly) continue; const P = o.poly.map(q => K.XY(q[0], q[1])), inside = pip(P, X, Y);
  let d = Infinity; for (let i = 0; i < P.length; i++) d = Math.min(d, dseg([X, Y], P[i], P[(i + 1) % P.length]));
  if (inside) d = 0; if (d <= R) rows.push([d, o, inside]);
}
rows.sort((a, b) => a[0] - b[0]);
console.log(`existing Greater Bay models within ${R} m of ${lat},${lon}:`, rows.length);
for (const [d, o, inside] of rows){ const [cx, cy] = K.XY(o.lat, o.lon);
  console.log(`  ${(inside ? 'INSIDE' : d.toFixed(0) + ' m').padStart(7)}  ${o.kind.padEnd(4)} ${o.key.padEnd(20)} ${(o.mod || '').padEnd(14)} r ${o.r}  centre ${Math.round(cx - X)} E ${Math.round(cy - Y)} N  ${o.label ? '' : '(unlabelled) '}module ${o.mod}`); }
