// road50/zoom.js — close-up of the road data around a point, lines coloured by deck height (grey = ground, then blue -> red up
// to 40 m; foreign / non-drivable thin), problems of a diag JSON drawn on top.
//   node road50/zoom.js <city> <x> <y> [half-width m] [--dir D] [--json out/<city>_<tag>.json] [--png file]
'use strict';
const path = require('path'), fs = require('fs'), lib = require('./lib.js'), {Canvas} = require('./png.js');
const a = process.argv.slice(2), city = a[0], PTS = a[1].split(';').map(t => t.split(',').map(Number));
const opt = k => { const i = a.indexOf('--' + k); return i >= 0 ? a[i+1] : null; };
const D = lib.loadCity(city, opt('dir')), px = 900;
const JS = opt('json') ? JSON.parse(fs.readFileSync(opt('json'), 'utf8')) : null;
for (const [cx, cy, hw0] of PTS){ const hw = hw0 || 300, sc = px/(2*hw);
const X = x => (x - cx)*sc + px/2, Y = y => px/2 - (y - cy)*sc;
const cv = new Canvas(px, px, [250, 249, 245]);
const ecol = e => { if (e < 0.5) return [90, 90, 90]; const t = Math.min(1, e/40); return [Math.round(40 + 215*t), Math.round(90 + 60*(1 - Math.abs(t - 0.5)*2)), Math.round(230 - 200*t)]; };
const sel = [];
for (let li = 0; li < D.lines.length; li++){ const L = D.lines[li], P = L.P; let near = false;
  for (let k = 0; k < P.length; k += 2) if (Math.abs(P[k] - cx) < hw*1.5 && Math.abs(P[k+1] - cy) < hw*1.5){ near = true; break; }
  if (!near || L.c > 12) continue; sel.push(li);
  const drv = L.c <= 10 && !(L.flags & 8), w = !drv ? 1 : (L.c <= 1 ? 7 : L.c <= 5 ? 5 : L.c <= 9 ? 4 : 3)*Math.min(2, Math.max(0.6, sc*1.5));
  for (let k = 0; k + 3 < P.length; k += 2){ const e = L.E ? (L.E[k/2] + L.E[k/2+1])/2 : 0; cv.line(X(P[k]), Y(P[k+1]), X(P[k+2]), Y(P[k+3]), w, drv ? ecol(e) : [205, 200, 190]); }
  if (drv){ for (let k = 0; k < P.length; k += 2) cv.disc(X(P[k]), Y(P[k+1]), 1.5, [255, 255, 255]);
    const m = P.length >> 1; cv.disc(X(P[0]), Y(P[1]), 3, (L.flags & 64) ? [120, 120, 120] : [0, 0, 0]); cv.disc(X(P[m*2-2]), Y(P[m*2-1]), 3, (L.flags & 128) ? [120, 120, 120] : [0, 0, 0]);
    if (L.flags & 1){ const k = (m >> 1) - 1 < 0 ? 0 : (m >> 1) - 1, x0 = X(P[k*2]), y0 = Y(P[k*2+1]), x1 = X(P[k*2+2]), y1 = Y(P[k*2+3]), mx = (x0 + x1)/2, my = (y0 + y1)/2, l = Math.hypot(x1 - x0, y1 - y0) || 1;
      cv.line(mx, my, mx - (x1 - x0)/l*8 + (y1 - y0)/l*5, my - (y1 - y0)/l*8 - (x1 - x0)/l*5, 2, [255, 255, 0]); cv.line(mx, my, mx - (x1 - x0)/l*8 - (y1 - y0)/l*5, my - (y1 - y0)/l*8 + (x1 - x0)/l*5, 2, [255, 255, 0]); } } }
if (JS){ const J = JS; for (const p of J.problems){ const x = X(p.x), y = Y(p.y); if (x < 0 || y < 0 || x > px || y > px) continue; cv.ring(x, y, 9, 2, p.type.startsWith('dead') ? [220, 0, 220] : p.type === 'step' ? [0, 0, 255] : p.type === 'steep' ? [160, 110, 40] : [0, 170, 60]); } }
const f = path.join(__dirname, 'out', `zoom_${city}${opt('tag') ? '_' + opt('tag') : ''}_${Math.round(cx)}_${Math.round(cy)}.png`); cv.save(f);
// a text dump of the drivable lines in the window
for (const li of sel){ const L = D.lines[li]; if (L.c > 11) continue; const P = L.P, m = P.length >> 1;
  console.log(li, 'c' + L.c, 'f' + L.flags, (L.name && L.name[0]) || L.ref || '', 'n' + m, 'E', L.E ? [...L.E].map(v => v.toFixed(1)).join(' ') : '-', 'ends', P[0].toFixed(1), P[1].toFixed(1), P[m*2-2].toFixed(1), P[m*2-1].toFixed(1)); }
console.log(f);
}
