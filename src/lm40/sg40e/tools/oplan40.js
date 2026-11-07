// Offline plan overlay (no browser): your model's ground plan against the real footprints from a ref JSON.
// usage: node SC/lm26/kit/oplan.js <sg|bay|nyc> <landmark.js[,more.js]> <key> <ref.json> <refKey> <out.png> [halfSize m]
//   - places LANDMARKS.<key> with its LAST SG_PLACES entry (lat, lon, rot) exactly like the app (rotation.y = rot)
//   - real footprints come from targets.<refKey>.buildings (local metres around the ref anchor: +x east, +z south)
//   - hull = convex hull of the model's vertices in the lower 25 m, grown by 3 m (what the app hides real buildings under)
//   - prints: hidden real buildings (centroid in the hull or most vertices inside), CLASHES (partly inside but kept), the
//     model's footprint vs the biggest hidden footprint (area, centroid offset), and writes a PNG (python3 + PIL):
//     grey = kept real footprints, red = hidden, orange = clash, blue = hull, green = model below 4 m, thin lines = roads.
const fs = require('fs'), vm = require('vm'), cp = require('child_process');
const SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
const [city, files, key, refPath, refKey, out, halfArg] = process.argv.slice(2);
if (!out){ console.log('usage: node oplan.js <sg|bay|nyc> <file.js[,more]> <key> <ref.json> <refKey> <out.png> [half]'); process.exit(1); }
const PROJ = {sg:[103.845, 1.315, 111290.5, 110574], bay:[-122.19, 37.625, 88300, 110989], nyc:[-73.98, 40.70, 84516, 111048]}[city];
if (!PROJ) throw new Error('city must be sg, bay or nyc');
const xy = (lat, lon) => [(lon - PROJ[0])*PROJ[2], (lat - PROJ[1])*PROJ[3]];
global.THREE = require(SC + 'vend/package/build/three.min.js');
global.navigator = {userAgent:'node'};
const src = fs.readFileSync(SC + 'sgreal/kit/lmbase.js', 'utf8');
const code = src + '\n' + files.split(',').map(f => fs.readFileSync(f, 'utf8')).join('\n') + `
;(function(){ const D = LANDMARKS[${JSON.stringify(key)}]; if (!D) throw new Error('no LANDMARKS.${key}');
  const P = SG_PLACES.filter(p => p.type === ${JSON.stringify(key)}).pop(); if (!P) throw new Error('no SG_PLACES entry for ${key}');
  LMCTX = {mats:new Map(), fx:[], rng:mulberry32(7), u:{base:{value:0}, top:{value:D.h}, col:{value:new THREE.Color((D.lt || {}).c || '#fff')}, k:{value:(D.lt || {}).k || 0}, mode:{value:(D.lt || {}).m || 0}, even:{value:0}}};
  const g = D.build(); g.rotation.y = P.rot || 0; g.updateMatrixWorld(true);
  const v = new THREE.Vector3(), low = [], g4 = []; let n = 0;
  g.traverse(o => { if (!o.isMesh) return; const a = o.geometry.attributes.position, st = Math.max(1, Math.floor(a.count/40000));
    for (let i = 0; i < a.count; i += st){ v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld); n++; if (v.y < 25) low.push([v.x, -v.z]); if (v.y < 4) g4.push([v.x, -v.z]); } });
  global.__R = {P, r:D.r, h:D.h, low, g4};
})();`;
vm.runInThisContext(code, {filename:'oplan-harness.js'});
const R = global.__R, ref = JSON.parse(fs.readFileSync(refPath, 'utf8')), T = (ref.targets || ref)[refKey];
if (!T) throw new Error('no targets.' + refKey + ' in ' + refPath);
const A = xy(T.anchor.lat, T.anchor.lon), M = xy(R.P.lat, R.P.lon), ox = M[0] - A[0], oy = M[1] - A[1];   // model origin in ref local (east, north)
// everything in plan metres relative to the MODEL origin: (east, north)
const toM = p => [p[0] - ox, -p[1] - oy];
const hull = pts => { pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0])*(b[1] - o[1]) - (a[1] - o[1])*(b[0] - o[0]), lo = [], up = [];
  for (const p of pts){ while (lo.length >= 2 && cr(lo[lo.length-2], lo[lo.length-1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--){ const p = pts[i]; while (up.length >= 2 && cr(up[up.length-2], up[up.length-1], p) <= 0) up.pop(); up.push(p); } up.pop(); lo.pop(); return lo.concat(up); };
const pip = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0])*(y - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
const area = P => { let s = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) s += (P[j][0] + P[i][0])*(P[j][1] - P[i][1]); return Math.abs(s/2); };
let H = hull(R.low); { let cx = 0, cy = 0; for (const h of H){ cx += h[0]; cy += h[1]; } cx /= H.length; cy /= H.length; H = H.map(h => { const dx = h[0] - cx, dy = h[1] - cy, d = Math.hypot(dx, dy) || 1; return [h[0] + dx/d*3, h[1] + dy/d*3]; }); }
const blds = (T.buildings || []).map(b => { const ring = b.ring.map(toM), c = toM(b.centroid); let k = 0; for (const p of ring) if (pip(H, p[0], p[1])) k++;
  const st = pip(H, c[0], c[1]) || k*2 > ring.length ? 'hidden' : k ? 'clash' : 'kept'; return {name:b.name, h:b.h, type:b.type, area:b.area, ring, c, st, inside:k, n:ring.length}; });
const hid = blds.filter(b => b.st === 'hidden'), cl = blds.filter(b => b.st === 'clash');
const g4h = R.g4.length >= 3 ? hull(R.g4) : [];
console.log(key, JSON.stringify({place:R.P, r:R.r, hullArea:Math.round(area(H)), groundPlanArea:g4h.length ? Math.round(area(g4h)) : 0}));
console.log('hidden', hid.length, JSON.stringify(hid.slice(0, 40).map(b => ({name:b.name, h:b.h, area:b.area, at:b.c.map(Math.round)}))));
console.log('CLASH (kept but partly inside the plan)', cl.length, JSON.stringify(cl.slice(0, 12).map(b => ({name:b.name, h:b.h, in:b.inside + '/' + b.n, at:b.c.map(Math.round)}))));
const pcen = P => { let a = 0, cx = 0, cy = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const f = P[j][0]*P[i][1] - P[i][0]*P[j][1]; a += f; cx += (P[j][0] + P[i][0])*f; cy += (P[j][1] + P[i][1])*f; } return a ? [cx/(3*a), cy/(3*a)] : [0, 0]; };
if (hid.length){ const big = hid.slice().sort((a, b) => b.area - a.area)[0], gc = g4h.length >= 3 ? pcen(g4h) : [0, 0]; big.c = pcen(big.ring);
  console.log('biggest hidden footprint', JSON.stringify({name:big.name, area:big.area, centroid:big.c.map(v => +v.toFixed(1))}), 'model ground-plan centroid', gc.map(v => +v.toFixed(1)), 'offset m', Math.hypot(big.c[0] - gc[0], big.c[1] - gc[1]).toFixed(1)); }
const half = +halfArg || Math.max(80, R.r*1.4);
const roads = (T.roads || []).map(r => ({cls:r.cls, pts:r.pts.map(toM), bridge:!!r.bridge}));
const tmp = out + '.json'; fs.writeFileSync(tmp, JSON.stringify({key, half, H, g4:R.g4.filter((_, i) => i % Math.max(1, Math.floor(R.g4.length/30000)) === 0), blds, roads, rot:R.P.rot || 0}));
cp.execFileSync('python3', [SC + 'lm26/kit/oplan.py', tmp, out], {stdio:'inherit'}); fs.unlinkSync(tmp);
console.log('wrote', out);
