// ===== nyc/ny42: 42nd Street / Park Avenue landmarks (City Brush v32, New York 1:1) — group ny42.
// Chanin Building, Lincoln Building (One Grand Central Place), Bowery Savings Bank Building (110 E 42nd), Socony-Mobil
// Building, Daily News Building, Ford Foundation, Tudor City, Helmsley Building, Waldorf Astoria, 570 Lexington Avenue.
// Every model is built in a frame aligned with its real OSM footprint (Midtown street grid): local +x = along the cross
// streets toward the East River ("east"), local -z = up the avenues ("north"), +z = downtown. rot ~ -0.50 (the grid is ~29 deg
// clockwise of true north). The setback tiers follow the OSM building parts (base/top heights). Block-scoped: only LANDMARKS
// and SG_PLACES are touched. No text, logos or signage anywhere.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
// ---- triangle batches: every part of one colour spec goes into one LTris call (one material, one draw call)
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const triP = (o, a, b, c) => o.push(...a, ...b, ...c);
const lerp = (a, b, t) => a + (b - a)*t;
// cylinder segment a -> b of radius r with n sides
function segP(o, a, b, r, n, r2){
  n = n || 4; r2 = r2 === undefined ? r : r2; const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = (p, rr) => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*rr, s = Math.sin(t)*rr; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a, r), Bq = ring(b, r2);
  for (let i = 0; i < n; i++){ const j = (i+1) % n; quadP(o, A[i], A[j], Bq[j], Bq[i]); }
}
const rotQ = (cx, cz, ry) => { const c = Math.cos(ry || 0), s = Math.sin(ry || 0); return (x, y, z) => [cx + x*c + z*s, y, cz - x*s + z*c]; };
function boxP(o, w, h, d, x, y, z, ry){
  const R = rotQ(x, z, ry), hw = w/2, hd = d/2;
  const P = [R(-hw, y, -hd), R(hw, y, -hd), R(hw, y, hd), R(-hw, y, hd), R(-hw, y+h, -hd), R(hw, y+h, -hd), R(hw, y+h, hd), R(-hw, y+h, hd)];
  for (const [a, b, c, e] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) quadP(o, P[a], P[b], P[c], P[e]);
}
const abox = (o, x0, x1, y0, y1, z0, z1) => boxP(o, x1 - x0, y1 - y0, z1 - z0, (x0 + x1)/2, y0, (z0 + z1)/2, 0);
function loftP(o, secs, cap){
  const n = secs[0].length;
  for (let s = 0; s < secs.length - 1; s++) for (let i = 0; i < n; i++){ const j = (i+1) % n; quadP(o, secs[s][i], secs[s][j], secs[s+1][j], secs[s+1][i]); }
  if (cap){ const t = secs[secs.length - 1], c = [0, 0, 0]; for (const p of t){ c[0] += p[0]/n; c[1] += p[1]/n; c[2] += p[2]/n; } for (let i = 0; i < n; i++) o.push(...c, ...t[i], ...t[(i+1) % n]); }
}
// frustum / cylinder about a vertical axis, n sides, radii r0 (bottom) r1 (top)
function cylP(o, x, z, r0, r1, y0, y1, n, cap, rot){
  const a = [], b = []; rot = rot === undefined ? PI/n : rot;
  for (let i = 0; i < n; i++){ const t = rot + i/n*TAU, c = Math.cos(t), s = Math.sin(t); a.push([x + c*r0, y0, z + s*r0]); b.push([x + c*r1, y1, z + s*r1]); }
  loftP(o, [a, b], cap);
}
// ---- plan polygons ([x, z])
const area2 = P => { let s = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; };
const outN = (P, i) => { const s = area2(P) > 0 ? 1 : -1, a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], l = Math.hypot(ex, ez) || 1; return [ez/l*s, -ex/l*s]; };
const triang = P => THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
const rectP = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const chamf = (hx, hz, c, cx, cz) => { cx = cx || 0; cz = cz || 0; return [[cx-hx+c, cz-hz], [cx+hx-c, cz-hz], [cx+hx, cz-hz+c], [cx+hx, cz+hz-c], [cx+hx-c, cz+hz], [cx-hx+c, cz+hz], [cx-hx, cz+hz-c], [cx-hx, cz-hz+c]]; };
const flatP = (o, P, y) => { for (const t of triang(P)) for (const k of t){ const p = P[k]; o.push(p[0], y, p[1]); } };
function wallsP(o, P, y0, y1, edges){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue; const a = P[i], b = P[(i+1) % P.length]; quadP(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
}
// a horizontal band round a polygon standing `off` proud of the walls (y .. y + h)
function bandP(o, P, y, h, off, edges){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length]; if (Math.hypot(b[0]-a[0], b[1]-a[1]) < 0.2) continue; const [nx, nz] = outN(P, i);
    const A = [a[0]+nx*off, a[1]+nz*off], Bb = [b[0]+nx*off, b[1]+nz*off];
    quadP(o, [A[0], y, A[1]], [Bb[0], y, Bb[1]], [Bb[0], y+h, Bb[1]], [A[0], y+h, A[1]]);
    if (off > 0.05) quadP(o, [a[0], y+h, a[1]], [b[0], y+h, b[1]], [Bb[0], y+h, Bb[1]], [A[0], y+h, A[1]]);
  }
}
// vertical strips (window bays) centred in bays of about `sp` along every edge, `w` wide, `off` proud of the wall
function stripsP(o, P, y0, y1, sp, w, off, edges, minL){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < (minL || sp*0.9)) continue;
    const [nx, nz] = outN(P, i), n = Math.max(1, Math.round(L/sp)), ux = ex/L, uz = ez/L, st = L/n;
    for (let k = 0; k < n; k++){ const s = st*(k + 0.5), x = a[0] + ux*s + nx*off, z = a[1] + uz*s + nz*off;
      quadP(o, [x - ux*w/2, y0, z - uz*w/2], [x + ux*w/2, y0, z + uz*w/2], [x + ux*w/2, y1, z + uz*w/2], [x - ux*w/2, y1, z - uz*w/2]); }
  }
}
// window panes in the strips of stripsP: one quad per floor (fh) of height wh, `off` proud of the wall
function panesP(o, P, y0, y1, sp, w, off, fh, wh, edges, minL){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < (minL || sp*0.9)) continue;
    const [nx, nz] = outN(P, i), n = Math.max(1, Math.round(L/sp)), ux = ex/L, uz = ez/L, st = L/n;
    for (let k = 0; k < n; k++){ const s = st*(k + 0.5), x = a[0] + ux*s + nx*off, z = a[1] + uz*s + nz*off;
      for (let y = y0; y + wh <= y1 + 0.01; y += fh) quadP(o, [x - ux*w/2, y, z - uz*w/2], [x + ux*w/2, y, z + uz*w/2], [x + ux*w/2, y + wh, z + uz*w/2], [x - ux*w/2, y + wh, z - uz*w/2]); }
  }
}
// projecting fins (perpendicular to the wall) every ~sp along every edge
function finsP(o, P, y0, y1, sp, d, edges){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < sp*0.7) continue;
    const [nx, nz] = outN(P, i), n = Math.max(1, Math.round(L/sp)), ux = ex/L, uz = ez/L, st = L/n;
    for (let k = 1; k < n; k++){ const x = a[0] + ux*st*k, z = a[1] + uz*st*k;
      quadP(o, [x, y0, z], [x + nx*d, y0, z + nz*d], [x + nx*d, y1, z + nz*d], [x, y1, z]); }
  }
}
// flat shape (2-D points [u, v]) in a vertical plane: origin p0, u along (ux, uz), v up, pushed `off` along the plane normal
const convex = P => { let sg = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], c = P[(i+2) % P.length], cr = (b[0]-a[0])*(c[1]-b[1]) - (b[1]-a[1])*(c[0]-b[0]);
  if (Math.abs(cr) < 1e-9) continue; if (!sg) sg = Math.sign(cr); else if (Math.sign(cr) !== sg) return false; } return true; };
function shapeP(o, pts, p0, ux, uz, off){
  const nx = uz, nz = -ux, T = convex(pts) ? pts.slice(2).map((q, i) => [0, i + 1, i + 2]) : triang(pts);
  const M = q => [p0[0] + ux*q[0] + nx*(off || 0), p0[1] + q[1], p0[2] + uz*q[0] + nz*(off || 0)];
  for (const t of T) triP(o, M(pts[t[0]]), M(pts[t[1]]), M(pts[t[2]]));
}
// round-headed opening outline (width w, total height h) as [u, v] points from its bottom centre
const archPts = (w, h, n) => { const r = w/2, P = [[-r, 0], [r, 0], [r, h - r]]; n = n || 8; for (let i = 1; i < n; i++){ const a = PI*i/n; P.push([Math.cos(a)*r, h - r + Math.sin(a)*r]); } P.push([-r, h - r]); return P; };
// a face of an edge of polygon P: returns (s, v, off) -> point, s along the edge from its start, v = height, off outward
const edgeF = (P, i) => { const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez), ux = ex/L, uz = ez/L, [nx, nz] = outN(P, i);
  return {L, ux, uz, nx, nz, at:(s, v, off) => [a[0] + ux*s + nx*(off || 0), v, a[1] + uz*s + nz*(off || 0)]}; };
// low-poly tree into batches
function treeP(B, x, y, z, s, crown, trunk){
  const th = 2.8*s; segP(B.p(trunk), [x, y, z], [x, y + th, z], 0.22*s, 4);
  const c = B.p(crown), R = 2.4*s, cy = y + th + R*0.45, top = [x, cy + R*0.9, z], bot = [x, cy - R*0.55, z], ring = [];
  for (let i = 0; i < 6; i++){ const a = i/6*TAU + s*3.1; ring.push([x + Math.cos(a)*R, cy + ((i & 1) ? 0.3 : -0.2)*s, z + Math.sin(a)*R]); }
  for (let i = 0; i < 6; i++){ const j = (i+1) % 6; triP(c, top, ring[j], ring[i]); triP(c, bot, ring[i], ring[j]); }
}
const RED = {c:'#c22222', glow:'#ff2a1a', gk:2.4};

// ---- ny42 additions -------------------------------------------------------------------------------------------------
const pip = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
// visible edges of part i among the parts [[base, top, ring], ...]: an edge is dropped when, all along it, a part at least
// as tall lies just outside it (internal wall) or a taller part covers it from inside (shared / hidden facade)
function visEdges(parts, i){
  const [b0, t0, P] = parts[i], out = [];
  for (let k = 0; k < P.length; k++){
    const a = P[k], b = P[(k+1) % P.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]); if (L < 0.25){ out.push(false); continue; }
    const [nx, nz] = outN(P, k); let all = true;
    for (const f of [0.12, 0.5, 0.88]){
      const mx = a[0] + (b[0]-a[0])*f, mz = a[1] + (b[1]-a[1])*f; let cov = false;
      for (let j = 0; j < parts.length && !cov; j++){ if (j === i) continue; const [b1, t1, Q] = parts[j]; if (b1 > b0 + 0.3) continue;
        if (t1 >= t0 - 0.3 && pip(Q, mx + nx*0.35, mz + nz*0.35)) cov = true;
        else if (t1 > t0 + 0.3 && pip(Q, mx - nx*0.35, mz - nz*0.35)) cov = true; }
      if (!cov){ all = false; break; }
    }
    out.push(!all);
  }
  return k => out[k];
}
// generic setback tiers with a facade of vertical window bays (strips = spandrels, panes = glass per floor)
// S: {W wall, SP spandrel strip, GL glass, R roof, C coping, SH shop fronts, sp bay, ww bay width, fh floor, wh pane height,
//     gh ground storey, top (no windows in the top m), minL, cop:false, noWin(i) skip windows on part i}
function tiers(B, parts, S){
  for (let i = 0; i < parts.length; i++){
    const [b0, t0, P] = parts[i], ed = visEdges(parts, i), y0 = b0 > 0.1 ? b0 : (S.fy || -9);
    const Wi = S.Wf ? S.Wf(i, t0) : S.W; wallsP(B.p(Wi), P, y0, t0, ed); flatP(B.p(S.R), P, t0 - 0.02);
    if (S.cop !== false) bandP(B.p(S.C || Wi), P, t0 - (S.ch || 0.8), (S.ch || 0.8) + 0.25, S.co || 0.22, ed);
    const ya = Math.max(b0 + 0.6, (S.gh || 0) + 0.8), yb = t0 - (S.top || 1.5);
    if (yb - ya > 2.5 && !(S.noWin && S.noWin(i))){
      stripsP(B.p(S.SP), P, ya, yb, S.sp, S.ww, 0.05, ed, S.minL);
      if (S.GL) panesP(B.p(S.GL), P, ya + (S.po || 0.5), yb, S.sp, S.ww - (S.pw || 0.24), 0.08, S.fh, S.wh, ed, S.minL);
    }
    if (b0 <= 0.1 && S.SH) stripsP(B.p(S.SH), P, 0.35, (S.gh || 5) - 0.7, S.ssp || 6, S.sw || 4.4, 0.06, ed, 3);
    if (S.bands && b0 <= 0.1) for (const [y, h, off, col] of S.bands) if (t0 > y + h + 1) bandP(B.p(col), P, y, h, off, ed);
  }
}
// pyramid / hip roof over a rectangle x0..x1, z0..z1 from y0 rising to y1 (ridge along the longer side, inset `ri`)
function hipP(o, x0, x1, z0, z1, y0, y1, ri){
  const cx = (x0 + x1)/2, cz = (z0 + z1)/2, lx = (x1 - x0)/2, lz = (z1 - z0)/2, r = Math.max(0, Math.abs(lx - lz)) * (ri === undefined ? 1 : ri);
  const A = [x0, y0, z0], Bp = [x1, y0, z0], C = [x1, y0, z1], D = [x0, y0, z1];
  const R1 = lx >= lz ? [cx - r, y1, cz] : [cx, y1, cz - r], R2 = lx >= lz ? [cx + r, y1, cz] : [cx, y1, cz + r];
  if (lx >= lz){ quadP(o, A, Bp, R2, R1); quadP(o, C, D, R1, R2); triP(o, Bp, C, R2); triP(o, D, A, R1); }
  else { quadP(o, Bp, C, R2, R1); quadP(o, D, A, R1, R2); triP(o, A, Bp, R1); triP(o, C, D, R2); }
}
// buttress fins along the faces of a rectangle (x0..x1, z0..z1): every ~sp, d proud, t thick, from y0 to a top given by top(f)
// (f = 0..1 position along the face)
function buttRect(o, x0, x1, z0, z1, y0, sp, d, t, top){
  const faces = [[x0, z0, x1, z0, 0, -1], [x1, z0, x1, z1, 1, 0], [x1, z1, x0, z1, 0, 1], [x0, z1, x0, z0, -1, 0]];
  for (const [ax, az, bx, bz, nx, nz] of faces){
    const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L/sp)), ux = (bx - ax)/L, uz = (bz - az)/L;
    for (let k = 0; k <= n; k++){ const f = k/n, x = ax + ux*L*f, z = az + uz*L*f, yt = top(f);
      if (yt <= y0) continue;
      const cx = x + nx*d/2, cz = z + nz*d/2, w = Math.abs(nx) > 0 ? d : t, dd = Math.abs(nx) > 0 ? t : d;
      boxP(o, w, yt - y0, dd, cx, y0, cz, 0);
      // pointed cap
      const hw = w/2, hd = dd/2, ap = [cx, yt + Math.min(w, dd)*1.4, cz];
      triP(o, [cx - hw, yt, cz - hd], [cx + hw, yt, cz - hd], ap); triP(o, [cx + hw, yt, cz - hd], [cx + hw, yt, cz + hd], ap);
      triP(o, [cx + hw, yt, cz + hd], [cx - hw, yt, cz + hd], ap); triP(o, [cx - hw, yt, cz + hd], [cx - hw, yt, cz - hd], ap);
    }
  }
}
const SHOPG = {c:'#3a434b', glow:'#ffd9a2', gk:0.55};

// ---- more helpers (crowns, arches, gothic detail) ----------------------------------------------------------------------
// pointed (gothic) arch outline, width w, total height h, from its bottom centre
const pointPts = (w, h, n) => { const r = w/2, s = h - r*1.25, P = [[-r, 0], [r, 0], [r, s]]; n = n || 4;
  for (let i = 1; i < n; i++){ const t = i/n; P.push([r*Math.cos(t*HP)*(1 - t*0.15), s + r*1.25*Math.sin(t*HP)]); } P.push([0, h]);
  for (let i = n - 1; i >= 1; i--){ const t = i/n; P.push([-r*Math.cos(t*HP)*(1 - t*0.15), s + r*1.25*Math.sin(t*HP)]); } P.push([-r, s]); return P; };
// openings (any outline pts) along the 4 faces of a rectangle, centred in bays of ~sp, `off` proud of the wall
function openRect(o, x0, x1, z0, z1, y0, pts, sp, off, faces){
  const F = [[x0, z0, x1, z0, 0, -1], [x1, z0, x1, z1, 1, 0], [x1, z1, x0, z1, 0, 1], [x0, z1, x0, z0, -1, 0]];
  F.forEach(([ax, az, bx, bz, nx, nz], fi) => { if (faces && !faces[fi]) return;
    const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L/sp)), ux = (bx - ax)/L, uz = (bz - az)/L, st = L/n;
    for (let k = 0; k < n; k++){ const s = st*(k + 0.5); shapeP(o, pts, [ax + ux*s + nx*off, y0, az + uz*s + nz*off], -nz, nx, 0); }
  });
}
// openings along every edge of polygon P (edge filter ed), outline pts, bays ~sp, from y0
function openPoly(o, P, y0, pts, sp, off, ed, minL){
  for (let i = 0; i < P.length; i++){ if (ed && !ed(i)) continue; const f = edgeF(P, i); if (f.L < (minL || sp*0.8)) continue;
    const n = Math.max(1, Math.round(f.L/sp)), st = f.L/n;
    for (let k = 0; k < n; k++){ const p = f.at(st*(k + 0.5), y0, off); shapeP(o, pts, p, -f.nz, f.nx, 0); } }
}
// square pier (w x w) from y0 to y1 with a pyramid cap of height cap
function pierP(o, x, z, y0, y1, w, cap){
  boxP(o, w, y1 - y0, w, x, y0, z, 0); if (!cap) return; const h = w/2, ap = [x, y1 + cap, z];
  triP(o, [x - h, y1, z - h], [x + h, y1, z - h], ap); triP(o, [x + h, y1, z - h], [x + h, y1, z + h], ap);
  triP(o, [x + h, y1, z + h], [x - h, y1, z + h], ap); triP(o, [x - h, y1, z + h], [x - h, y1, z - h], ap);
}
// piers along the faces of a rectangle every ~sp (corners included), standing `d` proud
function piersRect(o, x0, x1, z0, z1, y0, y1, sp, w, cap, d){
  d = d || 0; const F = [[x0, z0, x1, z0, 0, -1], [x1, z0, x1, z1, 1, 0], [x1, z1, x0, z1, 0, 1], [x0, z1, x0, z0, -1, 0]];
  for (const [ax, az, bx, bz, nx, nz] of F){ const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L/sp));
    for (let k = 0; k < n; k++){ const f = k/n; pierP(o, ax + (bx - ax)*f + nx*d, az + (bz - az)*f + nz*d, y0, y1, w, cap); } }
}
// hollow box shell (4 walls of thickness t) — parapets, screens
function shellRect(o, x0, x1, z0, z1, y0, y1, t){
  abox(o, x0, x1, y0, y1, z0, z0 + t); abox(o, x0, x1, y0, y1, z1 - t, z1); abox(o, x0, x0 + t, y0, y1, z0 + t, z1 - t); abox(o, x1 - t, x1, y0, y1, z0 + t, z1 - t);
}
// crenellated parapet along polygon edges: merlons of width mw every sp, height mh, on top of a parapet wall y0..y1
function crenelPoly(o, P, y0, y1, mh, sp, t, ed){
  for (let i = 0; i < P.length; i++){ if (ed && !ed(i)) continue; const f = edgeF(P, i); if (f.L < 0.5) continue;
    const a = f.at(0, 0, 0), b = f.at(f.L, 0, 0), ai = f.at(0, 0, -t), bi = f.at(f.L, 0, -t);
    quadP(o, [a[0], y0, a[2]], [b[0], y0, b[2]], [b[0], y1, b[2]], [a[0], y1, a[2]]);
    quadP(o, [ai[0], y1, ai[2]], [bi[0], y1, bi[2]], [b[0], y1, b[2]], [a[0], y1, a[2]]);
    const n = Math.max(1, Math.round(f.L/sp));
    for (let k = 0; k <= n; k += 2){ const s = Math.min(f.L - sp*0.5, Math.max(sp*0.5, k*f.L/n)), p = f.at(s, 0, -t/2);
      boxP(o, Math.abs(f.ux) > Math.abs(f.uz) ? sp*0.9 : t, mh, Math.abs(f.ux) > Math.abs(f.uz) ? t : sp*0.9, p[0], y1, p[2], 0); }
  }
}
// pyramid over a polygon (convex), from y0 up to the apex height y1 at its centroid
function pyrPoly(o, P, y0, y1){ let cx = 0, cz = 0; for (const p of P){ cx += p[0]/P.length; cz += p[1]/P.length; }
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; triP(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [cx, y1, cz]); } }
// octagon plan points (radius r to the flats' corners), centre cx, cz
const octP = (cx, cz, r, n) => { n = n || 8; const P = []; for (let i = 0; i < n; i++){ const a = PI/n + i/n*TAU; P.push([cx + Math.cos(a)*r, cz + Math.sin(a)*r]); } return P; };
const LAMPW = {c:'#fff1cf', glow:'#ffe4a8', gk:1.6};
// plain neighbour blocks that the app hides under a model's hull (re-modelled so no hole is left): neutral brick, windows
const FILLS = {W:{c:'#a39484', m:0, lk:0.1}, SP:{c:'#6e665e', m:1, fh:3.5, cw:2.2}, GL:{c:'#41474c', m:1, fh:3.5, cw:2.2}, R:{c:'#77736d', m:0, lk:0.05}};
function fillB(B, parts, S){ S = Object.assign({}, FILLS, S || {});
  tiers(B, parts, {W:S.W, SP:S.SP, GL:S.GL, R:S.R, C:S.W, SH:SHOPG, sp:2.2, ww:1.2, fh:3.5, wh:2.0, gh:4.6, top:1.0, minL:2.0, co:0.15, ch:0.6}); }
// windows punched through a stone base band (drawn proud of the band): every ground part's visible edges, y0..y1
function basePanes(B, parts, y0, y1, sp, w, fh, wh, col, minL){
  for (let i = 0; i < parts.length; i++){ const [b0, t0, P] = parts[i]; if (b0 > 0.1 || t0 < y1) continue;
    panesP(B.p(col), P, y0, y1, sp, w, 0.2, fh, wh, visEdges(parts, i), minL || 3); } }
// =====================================================================================================================
// Chanin Building (Sloan & Robertson, 1929), 122 E 42nd Street at Lexington Avenue: 56 floors, 197.8 m to the top of the
// crown. The 42nd Street (-z) / Lexington Avenue (+x) / 41st Street (+z) lot; a base with setbacks at the 17th to 30th floors
// (OSM parts) round light courts, then the slab tower (18 x 42 m, long side on Lexington) rising sheer to the 52nd floor and
// the crown: a ring of tall buttresses with pointed caps, terraced up to the roof, floodlit warm white at night. Buff-tan
// brick piers with brown brick spandrels in continuous vertical window bays, terracotta copings; the base: a black granite
// plinth, a bronze band over the shop fronts and the terracotta frieze at the 3rd/4th floors. Frame origin = the lot centroid.
LANDMARKS.nychanin = {zh:'查宁大厦', en:'Chanin Building', cat:'old', r:48, h:209,
  lt:{m:1, c:'#ffe7c2', k:0.7, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const W = {c:'#c9a984', m:0, lk:0.1}, SP = {c:'#7c624e', m:1, fh:3.55, cw:1.85}, GL = {c:'#4b5157', m:1, fh:3.55, cw:1.85};
  const R = {c:'#7a736b', m:0, lk:0.05}, C = {c:'#dcc7a4', m:0, lk:0.15}, CR = {c:'#d8bf98', m:0, lc:'#ffe2b4', lk:1.1};
  const GRAN = {c:'#2f2d2c', m:0, lk:0.1}, BRZ = {c:'#6e5434', m:0, lc:'#ffd9a0', lk:0.5}, FRZ = {c:'#b88f62', m:0, lk:0.4};
  const parts = [[0,205,[[0.1,-11.6],[0.0,-19.4],[9.0,-19.5],[8.9,-11.7]]],[0,190,[[-3.0,16.7],[-3.0,-22.2],[11.6,-22.3],[11.6,16.7]]],[0,185,[[-4.5,18.2],[-4.5,-23.7],[13.1,-23.7],[13.1,18.1]]],[0,108,[[-23.0,13.4],[-23.0,7.1],[-4.5,7.3],[-4.5,13.3]]],[0,105,[[13.1,6.6],[13.2,-12.1],[15.6,-12.1],[15.6,6.6]]],[0,100,[[-23.0,15.7],[-23.0,13.4],[-4.5,13.3],[-4.5,15.6]]],[0,100,[[13.2,-12.1],[13.1,-18.1],[15.5,-18.1],[15.6,-12.1]]],[0,100,[[13.1,12.5],[13.1,6.6],[15.6,6.6],[15.6,12.5]]],[0,92,[[-23.0,17.5],[-23.0,15.7],[-4.5,15.6],[-4.5,17.4]]],[0,92,[[-30.0,15.6],[-30.0,5.7],[-4.4,5.8],[-4.5,7.3],[-23.0,7.1],[-23.0,15.7]]],[0,85,[[-5.8,-17.6],[-5.7,-24.7],[14.5,-24.7],[14.4,-18.1],[13.1,-18.1],[13.1,-23.7],[-4.5,-23.7],[-4.5,-17.6]]],[0,85,[[-30.0,17.5],[-30.0,15.6],[-23.0,15.7],[-23.0,17.5]]],[0,85,[[-4.6,-24.7],[-4.5,-28.2],[13.3,-28.2],[13.2,-24.7]]],[0,85,[[15.6,12.5],[15.5,-18.1],[18.7,-18.2],[18.7,12.5]]],[0,85,[[-23.0,19.3],[-23.0,17.5],[-4.5,17.4],[-4.5,18.2],[13.1,18.1],[13.1,12.5],[14.5,12.5],[14.4,19.2]]],[0,78,[[-30.0,19.3],[-30.0,17.5],[-23.0,17.5],[-23.0,19.3]]],[0,68,[[-23.0,22.0],[-23.0,19.3],[14.4,19.2],[14.5,12.5],[18.7,12.5],[18.7,22.5],[13.4,22.5],[13.3,24.2],[-4.4,24.4],[-4.4,22.7],[-9.2,22.8],[-9.3,21.9]]],[0,68,[[-4.5,-28.2],[-4.5,-29.9],[13.2,-29.9],[13.3,-28.2]]],[0,68,[[-10.2,-17.5],[-10.0,-28.0],[-4.5,-28.2],[-4.6,-24.7],[-5.7,-24.7],[-5.8,-17.6]]],[0,68,[[14.4,-18.1],[14.5,-24.7],[13.2,-24.7],[13.3,-28.2],[18.6,-28.2],[18.7,-18.2]]],[0,61,[[13.3,24.2],[13.4,22.5],[18.7,22.5],[18.7,15.6],[20.9,15.5],[20.8,24.3]]],[0,61,[[-11.8,-17.5],[-11.6,-29.9],[-4.5,-29.9],[-4.5,-28.2],[-10.0,-28.0],[-10.2,-17.5]]],[0,61,[[13.3,-28.2],[13.2,-29.9],[20.8,-29.9],[20.8,-21.4],[18.7,-21.3],[18.6,-28.2]]],[0,60,[[-23.1,24.3],[-23.0,22.0],[-9.3,21.9],[-9.2,22.8],[-4.4,22.7],[-4.4,24.4]]],[0,54,[[-14.3,-17.4],[-14.2,-32.8],[23.1,-32.8],[23.1,-18.2],[18.7,-18.2],[18.7,-21.3],[20.8,-21.4],[20.8,-29.9],[-11.6,-29.9],[-11.8,-17.5]]],[0,54,[[13.3,27.0],[13.3,24.2],[20.8,24.3],[20.9,15.5],[18.7,15.6],[18.7,12.5],[23.1,12.4],[23.1,26.9]]],[0,48,[[-30.0,26.9],[-30.0,19.3],[-23.0,19.3],[-23.0,22.0],[-9.3,21.9],[-9.2,22.8],[-4.4,22.7],[-4.4,24.4],[13.3,24.2],[13.3,27.0]]],[0,25,[[-30.0,5.7],[-30.0,-5.5],[-25.3,-5.4],[-25.4,-8.5],[-14.2,-8.5],[-14.3,5.8]]],[0,20,[[18.7,12.5],[18.7,-18.2],[23.1,-18.2],[23.1,12.4]]]];
  // the crown parts (185 / 190 / 205) are built by hand below; the shaft keeps windows up to 168 m
  const shaft = parts.map(p => p[1] >= 185 ? [p[0], p[1] >= 190 ? 0 : p[1], p[2]] : p);
  const T = [0, 168, parts[2][2]];
  const P2 = [T].concat(parts.slice(3));
  tiers(B, P2, {W, SP, GL, R, C, SH:SHOPG, sp:1.85, ww:1.05, fh:3.55, wh:2.2, gh:5.2, top:1.4, minL:1.5,
    bands:[[-9, 9.4, 0.12, GRAN], [4.9, 1.5, 0.25, BRZ], [11.6, 2.6, 0.18, FRZ], [5.0, 0.4, 0.3, FRZ]]});
  void shaft;
  // ---- the crown: shaft continues to 172 m, then the buttressed top (rectangles from the OSM parts)
  const t185 = [-4.5, 13.1, -23.7, 18.1], t190 = [-3.0, 11.6, -22.2, 16.7], t205 = [0.0, 9.0, -19.5, -11.6];
  const Wp = B.p(W), Cp = B.p(CR);
  abox(Wp, t185[0], t185[1], 168, 176, t185[2], t185[3]);
  stripsP(B.p(SP), rectP(t185[0], t185[1], t185[2], t185[3]), 168, 175, 1.85, 1.05, 0.05);
  abox(Cp, t190[0], t190[1], 176, 188, t190[2], t190[3]);
  abox(Cp, t190[0] + 1.6, t190[1] - 1.6, 188, 192, t190[2] + 1.6, t190[3] - 1.6);
  stripsP(B.p(GL), rectP(t190[0], t190[1], t190[2], t190[3]), 177, 187, 2.1, 0.9, 0.05);
  // buttresses: on the 185 tier rising round the 190 block, peaking at the middle of each face
  buttRect(Cp, t185[0], t185[1], t185[2], t185[3], 168, 2.6, 1.3, 0.9, f => 176 + 9*Math.sin(Math.PI*f));
  buttRect(Cp, t190[0], t190[1], t190[2], t190[3], 176, 2.4, 1.0, 0.8, f => 188 + 5*Math.sin(Math.PI*f));
  // the topmost block (OSM 205 m) at the north end: terraced, with corner pinnacles
  abox(Cp, t205[0] - 1, t205[1] + 1, 192, 197.5, t205[2] - 1, t205[3] + 1); abox(Cp, t205[0], t205[1], 197.5, 201.5, t205[2], t205[3]);
  buttRect(Cp, t205[0], t205[1], t205[2], t205[3], 192, 3.0, 0.9, 0.7, f => 199 + 3*Math.sin(Math.PI*f));
  flatP(B.p(R), rectP(t205[0], t205[1], t205[2], t205[3]), 201.5);
  cylP(Cp, (t205[0] + t205[1])/2, (t205[2] + t205[3])/2, 0.7, 0.05, 201.5, 209, 6, true);
  // corner buttresses of the shaft (30th - 49th floors)
  for (const [x, z] of [[t185[0], t185[2]], [t185[1], t185[2]], [t185[1], t185[3]], [t185[0], t185[3]]]) pierP(Wp, x, z, 106, 172, 1.7, 3.0);
  // 42nd Street (-z) and Lexington Avenue (+x) entrances: tall bronze-framed portals
  const P = B.p(BRZ), Gl = B.p(SHOPG);
  for (const x of [-4, 8]){ abox(P, x - 2.6, x + 2.6, 0, 9.5, -33.2, -32.6); abox(Gl, x - 1.9, x + 1.9, 0.2, 8.6, -33.35, -33.1); }
  abox(P, 23.0, 23.6, 0, 9.5, -2.6, 2.6); abox(Gl, 23.5, 23.75, 0.2, 8.6, -1.9, 1.9);
  // the 30 m neighbour on 42nd Street west of the Chanin (inside the app's hull: re-modelled plain)
  fillB(B, [[0, 29.9, [[-30.0,-5.5],[-30.0,-32.8],[-14.4,-32.8],[-14.4,-8.5],[-25.4,-8.5],[-25.4,-5.6]]]]);
  B.flush(g); return g; }};
SG_PLACES.push({type:'nychanin', lat:40.7512115, lon:-73.9766860, rot:-0.5073});
// =====================================================================================================================
// Lincoln Building / One Grand Central Place (J.E.R. Carpenter, 1930), 60 E 42nd Street: 55 floors, 205 m. The lot runs
// from 42nd Street (-z) through to 41st Street (+z) with an L-shaped annex toward Madison Avenue (-x). A 4-storey limestone
// base fills the lot; above it the H-plan (light courts open to both streets) steps back at 30 / 50 / 70 / 90 m, then the
// 52 x 19 m slab (the H's crossbar, long side on the avenues' axis) rises sheer to the neo-Gothic crown: tall lancet windows
// between pinnacled piers, a chamfered setback and the hipped pyramidal top (lit warm white at night). Buff brick piers
// with recessed spandrels in continuous vertical bays.
LANDMARKS.ny60e42 = {zh:'林肯大厦（中央车站一号）', en:'Lincoln Building (One Grand Central Place)', cat:'old', r:66, h:207,
  lt:{m:1, c:'#fff0d4', k:0.75, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const W = {c:'#bba183', m:0, lk:0.1}, SP = {c:'#806b55', m:1, fh:3.6, cw:2.1}, GL = {c:'#4a5258', m:1, fh:3.6, cw:2.1};
  const R = {c:'#77736c', m:0, lk:0.05}, C = {c:'#ddd2b8', m:0, lk:0.15}, CR = {c:'#d9ccad', m:0, lc:'#fff1d6', lk:1.6};
  const LIME = {c:'#d6ccb5', m:0, lk:0.2}, ROOF = {c:'#8d8a80', m:0, lc:'#fff1d6', lk:1.2}, LAN = {c:'#4b4f52', glow:'#ffe6b0', gk:0.9};
  // H tiers: north / south extents per tier (from the OSM parts)
  const Ht = (zn, zs) => [[-16.6, zs], [-16.6, zn], [0.7, zn], [0.7, -13.5], [18.0, -13.5], [18.0, zn], [35.4, zn], [35.35, zs], [17.95, zs], [18.0, 5.2], [0.7, 5.2], [0.7, zs]];
  const lot = [[-57.4, 13.9], [-57.2, -3.1], [-21.9, -3.2], [-21.8, -30.5], [-16.6, -30.4], [-16.6, -32.2], [35.4, -32.2], [35.3, 30.0], [-22.3, 30.2], [-22.3, 14.0]];
  const slab = [[-16.6, 5.25], [-16.6, -13.5], [35.35, -13.5], [35.35, 5.25]];
  const parts = [[0, 186, slab], [0, 90, Ht(-19.7, 11.4)], [0, 70, Ht(-25.95, 17.65)], [0, 50, Ht(-32.2, 23.85)], [0, 30, Ht(-32.2, 30.1)],
    [0, 15.5, lot], [0, 70, [[-43.0, 13.95], [-42.9, -3.2], [-16.6, -3.25], [-16.6, 13.95]]], [0, 60, [[-50.0, 13.95], [-49.9, -3.15], [-16.6, -3.25], [-16.6, 13.95]]],
    [0, 40, [[-57.4, 13.9], [-57.2, -3.1], [-16.6, -3.25], [-16.6, 13.95]]]];
  const CRM = {c:'#ddd2bb', m:0, lk:0.15};
  tiers(B, parts, {W, Wf:(i, t) => t <= 90 ? CRM : W, SP, GL, R, C, SH:SHOPG, sp:2.15, ww:1.25, fh:3.6, wh:2.3, gh:5.6, top:1.6, minL:1.6,
    bands:[[-9, 19.3, 0.12, LIME], [5.6, 0.6, 0.3, C], [14.6, 1.2, 0.35, C]]});
  basePanes(B, parts, 6.8, 10.1, 4.3, 2.4, 4.4, 3.0, GL);
  // shaft piers: slightly proud full-height piers every 4 bays on the slab (vertical emphasis)
  const Wp = B.p(W), Cp = B.p(CR), Lp = B.p(LAN);
  for (const [x0, x1, z0, z1] of [[-16.6, 35.35, -13.5, 5.25]]){
    finsP(Wp, rectP(x0, x1, z0, z1), 90, 185, 4.3, 0.35);
  }
  // ---- the crown: 186-195 lancet storey between pinnacled piers, 195-200 chamfered setback, hipped top to 207
  const x0 = -16.6, x1 = 35.35, z0 = -13.5, z1 = 5.25;
  abox(Cp, x0, x1, 186, 195, z0, z1);
  openRect(Lp, x0, x1, z0, z1, 187.2, pointPts(2.2, 6.6, 3), 4.3, 0.06);
  piersRect(Cp, x0 - 0.4, x1 + 0.4, z0 - 0.4, z1 + 0.4, 184, 197.5, 4.3, 1.1, 2.6);
  bandP(Cp, rectP(x0, x1, z0, z1), 194.6, 0.9, 0.35);
  const c0 = [-11.2, 29.3, -10.5, 3.2];
  const ch = chamf((c0[1] - c0[0])/2 + 1.6, (c0[3] - c0[2])/2 + 1.6, 2.6, (c0[0] + c0[1])/2, (c0[2] + c0[3])/2);
  wallsP(Cp, ch, 195, 200.5); flatP(B.p(R), ch, 200.5);
  openPoly(Lp, ch, 196.2, pointPts(1.6, 3.4, 3), 3.2, 0.06, null, 2);
  piersRect(Cp, c0[0] - 1.6, c0[1] + 1.6, c0[2] - 1.6, c0[3] + 1.6, 195, 201.5, 6.6, 0.8, 1.8);
  // hipped pyramidal roof with a short ridge, finial at each end
  hipP(B.p(ROOF), c0[0], c0[1], c0[2], c0[3], 200.5, 206, 1);
  for (const x of [c0[0] + (c0[3] - c0[2])/2, c0[1] - (c0[3] - c0[2])/2]) cylP(Cp, x, (c0[2] + c0[3])/2, 0.35, 0.05, 205.5, 207.5, 6, true);
  // 42nd Street entrance (centre of the base) and the 41st Street one: tall limestone portals with bronze-framed glass
  const Lm = B.p(LIME), Gl = B.p(SHOPG);
  for (const [zf, s] of [[-32.2, -1], [30.1, 1]]){ const xc = 9.35;
    abox(Lm, xc - 5.2, xc + 5.2, 0, 13.5, zf + (s < 0 ? -0.8 : 0), zf + (s < 0 ? 0 : 0.8));
    shapeP(Gl, archPts(6.4, 10.2, 8), [xc, 0.2, zf + s*0.86], s < 0 ? 1 : -1, 0, 0); }
  // neighbours inside the app's hull (re-modelled plain so no hole is left): the 96 m office tower on the Madison corner
  // of 42nd Street (stepped top, OSM parts) and two low buildings and the Library Hotel on 41st Street / Madison Avenue
  fillB(B, [[0,96.4,[[-48.8,-12.8],[-48.8,-16.2],[-37.4,-16.2],[-37.5,-12.8]]],[0,95.4,[[-49.3,-12.3],[-49.3,-16.7],[-37.0,-16.7],[-37.0,-12.3]]],
    [0,94.4,[[-49.9,-11.8],[-49.8,-17.2],[-36.5,-17.1],[-36.5,-11.8]]],[0,93.4,[[-50.4,-11.3],[-50.4,-17.7],[-35.9,-17.6],[-36.0,-11.3]]],
    [0,92.4,[[-50.8,-10.8],[-50.8,-18.1],[-35.4,-18.2],[-35.5,-10.8]]],[0,91,[[-51.8,-9.8],[-51.8,-19.2],[-34.4,-19.2],[-34.5,-9.8]]],
    [0,86,[[-55.2,-8.1],[-55.1,-21.0],[-31.2,-21.1],[-31.2,-8.0]]],[0,78,[[-57.2,-6.1],[-57.1,-23.0],[-29.2,-23.0],[-29.2,-6.0]]],
    [0,20,[[-57.2,-3.2],[-57.1,-28.5],[-54.8,-30.7],[-21.8,-30.5],[-21.9,-3.35]]]]);
  fillB(B, [[0, 20.2, [[-57.4,21.9],[-57.4,14.0],[-28.8,14.0],[-28.9,22.0]]]]);
  fillB(B, [[0, 18.6, [[-28.9,29.4],[-28.8,14.0],[-22.4,14.0],[-22.4,29.4]]]]);
  fillB(B, [[0, 56.7, [[-57.4,30.5],[-57.4,22.0],[-28.9,22.0],[-28.9,30.5]]]]);
  B.flush(g); return g; }};
SG_PLACES.push({type:'ny60e42', lat:40.7521447, lon:-73.9788079, rot:-0.5030});
// =====================================================================================================================
// Socony-Mobil Building (Harrison & Abramovitz, 1956), 150 E 42nd Street: the whole block 42nd-41st Street, Lexington
// (-x) to Third Avenue (+x). A 3-4 storey base of dark blue glass in stainless frames fills the block; wings to the east and
// west rise to the 13th floor (H-shaped upper mass), and the 42-storey slab stands in the middle, 174 m. Every face above
// the base is clad in embossed stainless-steel panels (pyramidal bosses in high relief) with small pivoting windows in a
// tight grid; three mechanical floors at the top. The tall metallic arch of the 42nd Street entrance at the centre.
LANDMARKS.nysocony = {zh:'索科尼-美孚大楼', en:'Socony-Mobil Building', cat:'old', r:72, h:176,
  lt:{m:1, c:'#e9f0ff', k:0.6, e:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const SS = {c:'#bcc4ca', m:0, lc:'#dfe8ff', lk:0.25}, BOSS = {c:'#c3cad0', m:0, lc:'#dfe8ff', lk:0.2};
  const WIN = {c:'#3b4650', m:1, fh:3.66, cw:2.8}, R = {c:'#6f7376', m:0, lk:0.05}, BG = {c:'#26344a', m:1, fh:5, cw:3.2};
  const BF = {c:'#bfc6cc', m:0, lk:0.2}, MECH = {c:'#8e979e', m:0, lk:0.1};
  const parts = [[0, 174.3, rectP(-32.7, 31.8, -14.2, 17.8)], [0, 60, rectP(-51.8, -32.6, -14.15, 17.85)], [0, 60, rectP(31.75, 48.8, -14.3, 17.7)],
    [0, 54, [[-58.7, 25.4], [-58.6, -25.1], [-38.6, -25.1], [-38.7, -14.1], [-51.7, -14.1], [-51.8, 17.9], [-38.8, 17.8], [-38.7, 25.4]]],
    [0, 54, [[35.7, 25.2], [35.7, 17.7], [48.8, 17.7], [48.8, -14.3], [35.8, -14.3], [35.8, -25.3], [55.9, -25.3], [55.8, 25.2]]],
    [0, 32, rectP(-38.7, 35.7, 17.7, 25.3)], [0, 18.5, rectP(-63.9, 63.8, -29.75, 29.7)]];
  const BASE = 18.5, Wp = B.p(SS), Gp = B.p(WIN), Bp = B.p(BOSS);
  for (let i = 0; i < parts.length; i++){
    const [b0, t0, P] = parts[i], ed = visEdges(parts, i);
    if (i === parts.length - 1){ // the glass base
      wallsP(B.p(BG), P, -9, BASE, ed); flatP(B.p(R), P, BASE);
      bandP(B.p(BF), P, BASE - 1.2, 1.5, 0.25, ed); bandP(B.p(BF), P, 5.6, 0.5, 0.2, ed);
      finsP(B.p(BF), P, 0, BASE - 1.2, 3.2, 0.25, ed); continue; }
    const y0 = BASE, top = i === 0 ? t0 - 11 : t0 - 1.2;
    wallsP(Wp, P, y0, t0, ed); flatP(B.p(R), P, t0);
    bandP(Wp, P, t0 - 0.6, 0.9, 0.15, ed);
    // punched windows: 1.2 x 1.75 m every 2.8 m (two panels per window), 3.66 m floors
    panesP(Gp, P, y0 + 1.3, top, 2.8, 1.2, 0.04, 3.66, 1.75, ed, 3);
    // embossed pyramidal bosses between the windows (one per panel)
    for (let k = 0; k < P.length; k++){ if (!ed(k)) continue; const f = edgeF(P, k); if (f.L < 3) continue;
      const n = Math.max(1, Math.round(f.L/2.8)), st = f.L/n;
      for (let j = 1; j < n; j++) for (let y = y0 + 1.3 + 0.85; y < top - 0.5; y += 3.66){
        const c = f.at(st*j, y, 0), a = 0.62, h = 0.8, ap = [c[0] + f.nx*0.34, y, c[2] + f.nz*0.34];
        const p1 = [c[0] - f.ux*a, y - h, c[2] - f.uz*a], p2 = [c[0] + f.ux*a, y - h, c[2] + f.uz*a], p3 = [c[0] + f.ux*a, y + h, c[2] + f.uz*a], p4 = [c[0] - f.ux*a, y + h, c[2] - f.uz*a];
        triP(Bp, p1, p2, ap); triP(Bp, p2, p3, ap); triP(Bp, p3, p4, ap); triP(Bp, p4, p1, ap); }
      // rosette bosses above and below each window (small diamonds in the spandrel)
      for (let j = 0; j < n; j++) for (let y = y0 + 1.3 + 1.75 + 0.95; y < top; y += 3.66){
        const c = f.at(st*(j + 0.5), y, 0), a = 0.5, h = 0.45, ap = [c[0] + f.nx*0.22, y, c[2] + f.nz*0.22];
        const p1 = [c[0] - f.ux*a, y, c[2] - f.uz*a], p2 = [c[0], y - h, c[2]], p3 = [c[0] + f.ux*a, y, c[2] + f.uz*a], p4 = [c[0], y + h, c[2]];
        triP(Bp, p1, p2, ap); triP(Bp, p2, p3, ap); triP(Bp, p3, p4, ap); triP(Bp, p4, p1, ap); }
    }
  }
  // mechanical floors at the top of the slab: louvred band (no windows) and a recessed roof plant
  const Mp = B.p(MECH);
  finsP(Mp, rectP(-32.7, 31.8, -14.2, 17.8), 163.8, 173.2, 1.2, 0.18);
  abox(Mp, -22, 20, 174.3, 176.0, -8, 12);
  // the 42nd Street entrance: a tall stainless arch frame at the centre of the base, Lexington entrance likewise
  const Fp = B.p(BF), Lp = B.p(LAMPW);
  const ar = []; for (let i = 0; i <= 10; i++){ const a = PI*i/10; ar.push([Math.cos(a)*7, 6 + Math.sin(a)*7]); }
  for (let i = 0; i < 10; i++){ const a = ar[i], b = ar[i + 1]; segP(Fp, [a[0] - 0.4, a[1], -30.2], [b[0] - 0.4, b[1], -30.2], 0.55, 4); }
  for (const x of [-7, 7]){ segP(Fp, [x - 0.4, 0, -30.2], [x - 0.4, 6, -30.2], 0.55, 4); }
  abox(Lp, -6.4, 5.6, 2.8, 3.1, -30.6, -29.8);
  abox(Fp, -64.6, -63.8, 0, 9, -6, 6); abox(Lp, -64.7, -64.3, 0.3, 7.6, -4.4, 4.4);
  B.flush(g); return g; }};
SG_PLACES.push({type:'nysocony', lat:40.7507535, lon:-73.9755259, rot:-0.5069});
// =====================================================================================================================
// Daily News Building (Raymond Hood & John Mead Howells, 1930), 220 E 42nd Street, + the matching 1958 east addition to
// Second Avenue (Harrison & Abramovitz). 36 floors, 145 m, flat-topped: the slab (long side north-south) and its wings step
// back in sheer, cleanly cut setbacks with no crown. Every face is striped: continuous white brick piers between recessed
// window bays of russet-brown patterned brick spandrels and dark red window shades. The 42nd Street (-z) entrance: a tall
// dark granite frame round a carved sunburst panel (abstract, no lettering) over the revolving doors.
LANDMARKS.nydailynews = {zh:'每日新闻大楼', en:'Daily News Building', cat:'old', r:61, h:151,
  lt:{m:1, c:'#fff2dc', k:0.65, e:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const W = {c:'#e9e6dc', m:0, lc:'#fff6e8', lk:0.35}, SP = {c:'#7d4436', m:1, fh:3.6, cw:2.9}, GL = {c:'#3e3a3a', m:1, fh:3.6, cw:2.9};
  const R = {c:'#86827c', m:0, lk:0.05}, GRAN = {c:'#383634', m:0, lk:0.2}, SUN = {c:'#b7a27d', m:0, lc:'#ffe2ad', lk:1.2};
  const parts = [[0,145,[[-43.8,12.0],[-43.7,-19.0],[-23.8,-19.0],[-24.0,12.1]]],[0,140,[[-43.8,18.0],[-43.8,12.0],[-24.0,12.1],[-24.0,18.0]]],
    [0,135,[[-43.7,-19.0],[-43.7,-24.4],[-23.8,-24.3],[-23.8,-19.0]]],[0,130,[[-49.2,-3.2],[-49.2,-24.4],[-43.7,-24.4],[-43.7,-3.3]]],
    [0,130,[[-23.8,-2.7],[-23.8,-24.3],[-18.4,-24.4],[-18.4,-2.7]]],[0,100,[[-43.8,22.9],[-43.8,18.0],[-24.0,18.0],[-24.0,23.0]]],
    [0,70,[[-18.4,-2.7],[-18.5,-19.8],[48.9,-19.8],[48.8,-2.0],[45.5,-2.4]]],[0,55,[[-49.2,2.9],[-49.2,-3.2],[-43.7,-3.3],[-43.8,2.9]]],
    [0,55,[[-24.0,12.1],[-23.8,-2.7],[45.5,-2.4],[45.2,23.1],[-11.8,22.8],[-11.7,12.1]]],[0,35,[[-49.3,29.6],[-49.2,2.9],[-43.8,2.9],[-43.8,22.9],[-11.8,22.8],[-11.7,29.6]]],
    [0,35,[[-24.0,23.0],[-24.0,12.1],[-11.7,12.1],[-11.8,22.8]]],[0,35,[[-49.2,-24.4],[-49.1,-30.5],[-18.4,-30.5],[-18.4,-24.4]]],
    [0,35,[[-11.7,29.6],[-11.8,22.8],[45.2,23.1],[45.5,-2.4],[51.6,-2.0],[51.6,29.5]]],[0,10,[[-18.5,-19.8],[-18.4,-30.5],[42.3,-30.6],[42.3,-19.8]]]];
  tiers(B, parts, {W, SP, GL, R, C:W, SH:SHOPG, sp:2.9, ww:1.75, fh:3.6, wh:2.15, gh:5.4, top:0.9, minL:2.2, co:0.08, ch:0.5,
    bands:[[-9, 9.2, 0.1, GRAN]]});
  // the piers die into the roof line: a thin raised lip on the tallest slab, and the water-tank screen on top of it
  const Wp = B.p(W);
  abox(Wp, -40.5, -27.5, 145, 150.5, -12, 6);
  stripsP(B.p(SP), rectP(-40.5, -27.5, -12, 6), 145.6, 150, 2.9, 1.75, 0.05);
  // 42nd Street entrance: tall granite frame and the carved sunburst panel (no lettering)
  const Gp = B.p(GRAN), Sp = B.p(SUN), Dp = B.p(SHOPG), xc = -33.8, zf = -30.5;
  abox(Gp, xc - 6.5, xc + 6.5, 0, 14.5, zf - 0.7, zf + 0.2);
  abox(Dp, xc - 4.5, xc + 4.5, 0.1, 5.2, zf - 0.85, zf - 0.6);
  for (let i = 0; i < 13; i++){ const a = PI*(i + 0.5)/13, r = 3.9;
    triP(Sp, [xc, 6.2, zf - 0.85], [xc + Math.cos(a - 0.09)*r, 6.2 + Math.sin(a - 0.09)*r, zf - 0.85], [xc + Math.cos(a + 0.09)*r, 6.2 + Math.sin(a + 0.09)*r, zf - 0.85]); }
  abox(Sp, xc - 4.6, xc + 4.6, 5.6, 6.2, zf - 0.95, zf - 0.6);
  B.flush(g); return g; }};
SG_PLACES.push({type:'nydailynews', lat:40.7497469, lon:-73.9731703, rot:-0.5022});
// =====================================================================================================================
// Helmsley Building (New York Central Building; Warren & Wetmore, 1929), 230 Park Avenue: straddles Park Avenue on the
// block 45th (+z) - 46th Street (-z), Vanderbilt Avenue (-x) to Depew Place (+x), right north of the MetLife Building.
// A 4-storey limestone and pink granite base (20 m) carries the H-plan of 15-storey wings (65 m, terracotta bison-head
// cornice) round two side courts, and the 35-storey central tower (37.6 x 44 m) in buff brick with paired sash windows,
// the ornate entablature at the 31st floor, then the copper pyramidal roof on its chamfered (octagonal) base with three
// pairs of dormers per side and the gilded cupola with oval openings, lantern and glass ball (172 m), floodlit at night.
// Park Avenue's two S-shaped roadways run through the base at street level (the app draws them): the portals stay open —
// on 46th Street at x = -7 (southbound) and x = +19 (northbound), on 45th Street at the SW and SE corners — and inside
// they are dark-lit tunnels. On the 45th Street face, centred over the base: the clock (2.7 m) in its sculpture frame.
LANDMARKS.nyhelmsley = {zh:'赫尔姆斯利大厦', en:'Helmsley Building', cat:'old', r:62, h:172,
  lt:{m:1, c:'#ffe6b8', k:0.8, e:0.55}, build(){
  const g = new THREE.Group(), B = mkB();
  const W = {c:'#c9ad84', m:0, lc:'#ffe2b0', lk:0.35}, SP = {c:'#8a7059', m:1, fh:3.7, cw:1.7}, GL = {c:'#454c52', m:1, fh:3.7, cw:1.7};
  const R = {c:'#7a766f', m:0, lk:0.05}, LIME = {c:'#ddd2bb', m:0, lc:'#ffe8c0', lk:0.9}, CU = {c:'#6c9682', m:0, lc:'#ffe2a8', lk:1.5};
  const GOLD = {c:'#c8a04c', m:0, lc:'#ffd890', lk:1.8}, TUN = {c:'#2e2c2a', glow:'#ffc77a', gk:0.18}, BALL = {c:'#fff3d6', glow:'#fff0c8', gk:2.4};
  const BASE = 20.5;
  const wingW = [[-51.9, -9.8], [-51.9, -30.9], [-14.2, -31.0], [-14.0, -29.7], [-12.5, -27.4], [-10.4, -26.5], [-10.2, -9.8]];
  const wingE = [[27.4, -5.1], [27.3, -26.9], [29.2, -27.4], [30.3, -28.4], [31.5, -31.0], [52.6, -31.0], [52.5, -11.2], [38.4, -11.1], [38.4, -4.9]];
  const south = [[-52.1, 29.3], [-52.0, 8.1], [-10.3, 8.1], [-10.1, 17.9], [27.5, 17.6], [27.4, 3.5], [38.1, 3.5], [38.1, 9.5], [52.5, 9.6], [52.3, 29.2]];
  const tower = [[-10.1, 17.9], [-10.4, -26.5], [27.3, -26.9], [27.5, 17.6]];
  const parts = [[BASE, 129.5, tower], [BASE, 65, wingW], [BASE, 65, wingE], [BASE, 65, south]];
  tiers(B, parts, {W, SP, GL, R, C:LIME, sp:1.75, ww:0.95, fh:3.7, wh:2.2, top:1.6, minL:1.6, co:0.45, ch:1.4});
  const Wp = B.p(W), Lp = B.p(LIME), Rp = B.p(R);
  // limestone quoins / keystone bands: the 15th-floor cornice over the tower's wing line and the 31st-floor entablature
  bandP(Lp, tower, 64.2, 1.6, 0.4, visEdges(parts, 0)); bandP(Lp, tower, 116, 2.6, 0.45); bandP(Lp, tower, 127.8, 1.9, 0.6);
  for (const P of [wingW, wingE, south]) bandP(Lp, P, 20.5, 2.2, 0.35, visEdges(parts, parts.findIndex(p => p[2] === P)));
  // ---- the base (0 - 20.5 m): perimeter walls with the four roadway portals and the pedestrian arcades
  const ring = [[-52.1, 29.4], [-51.9, -30.9], [-14.2, -31.0], [-14.0, -29.7], [-12.5, -27.4], [-10.4, -26.5], [27.3, -26.9], [29.2, -27.4], [30.3, -28.4], [31.5, -31.0], [52.6, -31.0], [52.3, 29.2]];
  // openings [x0, x1, height, face (-1 = 46th Street, +1 = 45th Street), kind (0 portal, 1 arcade / door glass)]
  const OPEN = [[-10.9, -3.0, 7.4, -1, 0], [15.2, 23.0, 7.4, -1, 0], [-51.4, -41.8, 7.0, 1, 0], [41.0, 50.6, 7.0, 1, 0],
    [-1.9, 0.5, 5.2, -1, 1], [3.0, 9.8, 6.8, -1, 1], [12.4, 14.6, 5.2, -1, 1], [23.6, 26.0, 5.2, -1, 1],
    [-40.6, -38.2, 5.0, 1, 1], [37.8, 40.2, 5.0, 1, 1], [4.6, 12.6, 6.8, 1, 1], [-26, -23.6, 5.0, 1, 1], [-18, -15.6, 5.0, 1, 1], [32, 34.4, 5.0, 1, 1], [24.6, 27, 5.0, 1, 1]];
  const Gp = B.p(SHOPG), sg = area2(ring) > 0 ? 1 : -1;
  for (let i = 0; i < ring.length; i++){
    const a = ring[i], b = ring[(i + 1) % ring.length], ex = b[0] - a[0], ez = b[1] - a[1], L = Math.hypot(ex, ez); if (L < 0.2) continue;
    const ux = ex/L, uz = ez/L, X = s => [a[0] + ux*s, a[1] + uz*s], face = Math.sign(a[1] + b[1]), nx = uz*sg, nz = -ux*sg;
    const gaps = [];
    if (Math.abs(ux) > 0.9) for (const [x0, x1, h, f, kind] of OPEN){ if (f !== face) continue; const s0 = (x0 - a[0])/ux, s1 = (x1 - a[0])/ux, lo = Math.min(s0, s1), hi = Math.max(s0, s1);
      if (hi > 0.05 && lo < L - 0.05) gaps.push([Math.max(0, lo), Math.min(L, hi), h, kind]); }
    gaps.sort((p, q) => p[0] - q[0]);
    let s = 0; const pts = [];
    for (const [g0, g1, h, kind] of gaps){ if (g0 > s) pts.push([s, g0, 0]); pts.push([g0, g1, h, kind]); s = g1; } if (s < L) pts.push([s, L, 0]);
    for (const [s0, s1, h, kind] of pts){ const p0 = X(s0), p1 = X(s1); const y0 = h > 0 ? h : -9;
      quadP(Lp, [p0[0], y0, p0[1]], [p1[0], y0, p1[1]], [p1[0], BASE, p1[1]], [p0[0], BASE, p0[1]]);
      if (h > 0){ const w = Math.abs(s1 - s0), r = w/2, mid = X((s0 + s1)/2), sp = [];
        // the round arch head: wall-coloured spandrels in the top corners of the opening
        for (const d of [-1, 1]){ const P = [[d*r, h - r]]; for (let k = 0; k <= 6; k++){ const t = k/6*HP; P.push([d*Math.cos(t)*r, h - r + Math.sin(t)*r]); } P.push([d*r, h]);
          shapeP(Lp, P, [mid[0], 0, mid[1]], ux, uz, 0); void sp; }
        // voussoir band over the opening
        abox(Lp, Math.min(p0[0], p1[0]) - 0.7, Math.max(p0[0], p1[0]) + 0.7, h, h + 0.9, Math.min(p0[1], p1[1]) - 0.4, Math.max(p0[1], p1[1]) + 0.4);
        if (kind === 1) shapeP(Gp, archPts(w - 0.3, h - 0.15, 6), [mid[0] - nx*0.5, 0, mid[1] - nz*0.5], ux, uz, 0); }
    }
  }
  flatP(Rp, ring, BASE);
  panesP(B.p(GL), ring, 9.0, 19.6, 2.6, 1.45, 0.06, 3.8, 2.3, null, 2);
  // the roadway portals get tunnels along the real road lines
  const T = B.p(TUN);
  const tunnel = (pts, hw, h) => { for (let i = 0; i < pts.length - 1; i++){ const a = pts[i], b = pts[i + 1], ex = b[0] - a[0], ez = b[1] - a[1], L = Math.hypot(ex, ez), nx = -ez/L, nz = ex/L;
    for (const s of [-1, 1]){ const A = [a[0] + nx*hw*s, a[1] + nz*hw*s], Bb = [b[0] + nx*hw*s, b[1] + nz*hw*s];
      quadP(T, [A[0], -4, A[1]], [Bb[0], -4, Bb[1]], [Bb[0], h, Bb[1]], [A[0], h, A[1]]); }
    quadP(T, [a[0] + nx*hw, h, a[1] + nz*hw], [b[0] + nx*hw, h, b[1] + nz*hw], [b[0] - nx*hw, h, b[1] - nz*hw], [a[0] - nx*hw, h, a[1] - nz*hw]); } };
  tunnel([[-7.0, -27.2], [-6.0, 15.4], [-7.4, 20.4], [-9.7, 22.3], [-12.7, 23.1], [-40.8, 24.2], [-44.6, 26.4], [-46.6, 30.0]], 4.6, 7.6);
  tunnel([[45.2, 29.8], [39.6, 24.5], [33.8, 23.3], [25.3, 23.1], [20.6, 20.0], [19.6, 15.3], [19.0, -27.4]], 4.6, 7.6);
  // the clock group on the 45th Street face (atop the base): frame, dial and two sculpture masses (no lettering)
  const Gd = B.p(GOLD), xc = 8.6, zf = 29.5;
  abox(Lp, xc - 7, xc + 7, BASE, BASE + 5.8, zf - 0.2, zf + 0.6);
  cylP(Gd, xc, zf + 0.9, 1.5, 1.5, BASE + 1.6, BASE + 1.6, 16, false);
  shapeP(Gd, octP(0, 0, 1.45, 16).map(p => [p[0], p[1] + 2.9]), [xc, BASE, zf + 0.75], 1, 0, 0);
  shapeP(B.p(BALL), octP(0, 0, 1.15, 16).map(p => [p[0], p[1] + 2.9]), [xc, BASE, zf + 0.8], 1, 0, 0);
  for (const s of [-1, 1]){ boxP(Lp, 3.6, 2.4, 1.2, xc + s*4.4, BASE + 0.4, zf + 1.0, 0); boxP(Lp, 1.4, 1.6, 1.0, xc + s*5.4, BASE + 2.8, zf + 1.0, 0); }
  // ---- the roof: copper pyramid on a chamfered (octagonal) base, dormers, gilded cupola, lantern and glass ball
  const Cp = B.p(CU), x0 = -9.0, x1 = 26.1, z0 = -25.3, z1 = 16.5, cx = (x0 + x1)/2, cz = (z0 + z1)/2;
  const oct0 = chamf((x1 - x0)/2, (z1 - z0)/2, 5.5, cx, cz), oct1 = chamf(4.6, 4.6, 1.9, cx, cz);
  wallsP(Lp, oct0, 129.5, 132); flatP(Rp, oct0, 129.5);
  loftP(Cp, [oct0.map(p => [p[0], 132, p[1]]), oct1.map(p => [p[0], 151, p[1]])], false);
  // dormers: three pairs on each face at the 34th floor
  const Dp = B.p(GL);
  for (const [nx, nz, L, ox, oz] of [[0, -1, x1 - x0, cx, z0], [0, 1, x1 - x0, cx, z1], [-1, 0, z1 - z0, x0, cz], [1, 0, z1 - z0, x1, cz]]){
    for (const k of [-1, 0, 1]) for (const d of [-1, 1]){
      const s = k*L*0.27 + d*1.6, px = nx === 0 ? ox + s : ox - nx*2.6, pz = nz === 0 ? oz + s : oz - nz*2.6;
      boxP(Cp, nx === 0 ? 1.9 : 2.4, 3.0, nx === 0 ? 2.4 : 1.9, px, 134.2, pz, 0);
      pierP(Cp, px, pz, 137.2, 137.2, 1.9, 1.2);
      abox(Dp, px - (nx === 0 ? 0.6 : 0.05) + nx*1.25, px + (nx === 0 ? 0.6 : 0.05) + nx*1.25, 134.6, 136.6, pz - (nz === 0 ? 0.6 : 0.05) + nz*1.25, pz + (nz === 0 ? 0.6 : 0.05) + nz*1.25);
    } }
  // cupola: octagonal drum with oval openings, ribbed dome, lantern, glass ball, finial
  const Gl = B.p(GOLD), dr = octP(cx, cz, 4.0, 8);
  wallsP(Gl, dr, 151, 157.5); flatP(Gl, octP(cx, cz, 4.4, 8), 157.5);
  bandP(Gl, dr, 156.8, 0.9, 0.35); bandP(Gl, dr, 151, 0.8, 0.3);
  openPoly(B.p(BALL), dr, 152.3, octP(0, 0, 1, 10).map(p => [p[0]*0.85, p[1]*1.7 + 1.9]), 3.1, 0.05, null, 1);
  const dome = []; for (let i = 0; i <= 5; i++){ const a = i/5*HP; dome.push(octP(cx, cz, 4.1*Math.cos(a) + 0.5, 8).map(p => [p[0], 157.5 + 3.4*Math.sin(a), p[1]])); }
  loftP(Gl, dome, true);
  cylP(Gl, cx, cz, 1.3, 1.1, 160.6, 165.6, 8, true);
  for (let i = 0; i < 8; i++){ const a = i/8*TAU; segP(Gl, [cx + Math.cos(a)*1.5, 160.6, cz + Math.sin(a)*1.5], [cx + Math.cos(a)*1.2, 165.4, cz + Math.sin(a)*1.2], 0.18, 4); }
  cylP(B.p(BALL), cx, cz, 0.95, 0.95, 161.0, 165.0, 8, false);
  const ball = []; for (let i = 0; i <= 4; i++){ const a = -HP + i/4*PI; ball.push(octP(cx, cz, Math.max(0.05, Math.cos(a)*1.1), 8).map(p => [p[0], 167.2 + Math.sin(a)*1.1, p[1]])); }
  loftP(B.p(BALL), ball, true);
  cylP(Gl, cx, cz, 0.35, 0.05, 168.3, 172.2, 6, true);
  B.flush(g); return g; }};
SG_PLACES.push({type:'nyhelmsley', lat:40.7543880, lon:-73.9761102, rot:-0.5129});
// =====================================================================================================================
// Waldorf Astoria New York (Schultze & Weaver, 1931), 301 Park Avenue: the whole block Park Avenue (-x) to Lexington
// Avenue (+x), 49th (+z) to 50th Street (-z). Limestone base, warm grey brick above; the massing steps back from the 18-20
// storey wings round the courts to the 160 m main block, out of which rise the twin towers (on the east-west axis, so they
// read as one from Park Avenue and as a pair from the side streets): chamfered square shafts to 175 m, then the stepped
// octagonal crowns — a stone drum with tall lancets and pinnacles, a copper octagon and the copper-capped lantern (191 m),
// floodlit warm white at night. Park Avenue entrance: the tall limestone frontispiece with the bronze-framed doors.
LANDMARKS.nywaldorf = {zh:'纽约华尔道夫酒店', en:'Waldorf Astoria New York', cat:'old', r:72, h:193,
  lt:{m:1, c:'#ffe9c6', k:0.75, e:0.55}, build(){
  const g = new THREE.Group(), B = mkB();
  const W = {c:'#b9b2a6', m:0, lc:'#ffe8c4', lk:0.25}, SP = {c:'#77706a', m:1, fh:3.5, cw:1.8}, GL = {c:'#424950', m:1, fh:3.5, cw:1.8};
  const R = {c:'#76736d', m:0, lk:0.05}, LIME = {c:'#d7cfbd', m:0, lc:'#ffe8c4', lk:0.6}, CR = {c:'#cfc7b6', m:0, lc:'#ffeac8', lk:1.6};
  const CU = {c:'#7f9a8c', m:0, lc:'#ffe6b8', lk:1.5}, LAN = {c:'#3d4246', glow:'#ffe2a8', gk:1.0};
  const parts = [[0,175,[[11.9,4.2],[11.8,-3.6],[15.0,-6.7],[22.7,-6.7],[25.9,-3.6],[25.9,4.2],[22.6,7.4],[15.0,7.4]]],[0,175,[[-28.6,4.3],[-28.6,-3.5],[-25.4,-6.6],[-17.8,-6.6],[-14.7,-3.6],[-14.6,4.3],[-17.9,7.5],[-25.5,7.6]]],[0,167,[[-21.4,-6.6],[-21.3,-23.3],[-14.6,-23.3],[-14.6,-17.6],[-10.7,-17.6],[-10.8,-8.3],[-14.6,-8.3],[-14.7,-3.6],[-17.8,-6.6]]],[0,167,[[8.0,-8.3],[8.1,-17.6],[11.9,-17.6],[12.0,-23.4],[18.7,-23.4],[18.6,-6.7],[15.0,-6.7],[11.8,-3.6],[11.9,-8.3]]],[0,163,[[-14.7,-3.6],[-14.6,-8.3],[-10.8,-8.3],[-10.7,-17.6],[-14.6,-17.6],[-14.6,-22.6],[12.0,-22.7],[11.9,-17.6],[8.1,-17.6],[8.0,-8.3],[11.9,-8.3],[11.8,-3.6]]],[0,160,[[11.7,12.1],[11.9,4.2],[15.0,7.4],[22.6,7.4],[25.9,4.2],[25.9,-3.6],[22.7,-6.7],[18.6,-6.7],[18.7,-16.9],[22.9,-16.9],[23.0,-13.3],[27.8,-13.3],[27.6,12.1]]],[0,160,[[-30.6,12.2],[-30.5,-13.4],[-25.6,-13.3],[-25.6,-16.9],[-21.4,-16.9],[-21.4,-6.6],[-25.4,-6.6],[-28.6,-3.5],[-28.6,4.3],[-25.5,7.6],[-17.9,7.5],[-14.6,4.3],[-14.8,12.2]]],[0,160,[[27.6,7.4],[27.8,-10.1],[32.1,-10.1],[32.0,7.4]]],[0,160,[[-34.9,7.4],[-34.8,-9.9],[-30.5,-10.0],[-30.5,7.5]]],[0,140,[[11.7,19.2],[11.7,12.1],[27.6,12.1],[27.6,19.3]]],[0,140,[[32.0,7.4],[32.1,-10.1],[35.2,-10.1],[35.2,7.4]]],[0,140,[[-30.6,19.3],[-30.6,12.2],[-14.8,12.2],[-14.7,19.3]]],[0,140,[[18.7,-16.9],[18.7,-20.6],[27.8,-20.6],[27.8,-13.3],[23.0,-13.3],[22.9,-16.9]]],[0,140,[[-38.1,7.5],[-37.9,-9.9],[-34.8,-9.9],[-34.9,7.4]]],[0,140,[[-30.5,-13.4],[-30.5,-20.7],[-21.3,-20.7],[-21.4,-16.9],[-25.6,-16.9],[-25.6,-13.3]]],[0,75,[[42.9,23.9],[43.0,7.3],[35.2,7.4],[35.2,-10.1],[42.9,-10.1],[43.0,-26.0],[58.2,-26.0],[58.1,-19.2],[54.2,-19.2],[54.1,17.3],[58.0,17.3],[57.9,23.9]]],[0,75,[[-30.7,26.5],[-30.6,19.3],[-14.7,19.3],[-14.7,26.4]]],[0,75,[[11.7,24.8],[11.7,19.2],[27.6,19.3],[27.6,24.9]]],[0,75,[[12.0,-23.4],[12.0,-24.0],[27.9,-24.1],[27.8,-20.6],[18.7,-20.6],[18.7,-23.4]]],[0,75,[[-30.5,-20.7],[-30.5,-27.5],[-14.7,-27.5],[-14.6,-23.3],[-21.3,-23.3],[-21.3,-20.7]]],[0,75,[[-60.6,28.4],[-60.2,-28.6],[-45.5,-28.5],[-45.5,-24.1],[-42.8,-24.1],[-42.8,-9.8],[-37.9,-9.9],[-38.1,7.5],[-42.8,7.6],[-42.9,24.9],[-46.1,24.7],[-46.3,28.4]]],[0,68,[[-62.6,30.9],[-62.5,-30.8],[-42.7,-30.8],[-42.8,-24.1],[-45.5,-24.1],[-45.5,-28.5],[-60.2,-28.6],[-60.6,28.4],[-46.3,28.4],[-46.1,24.7],[-42.9,24.9],[-42.9,30.9]]],[0,65,[[-30.5,-27.5],[-30.5,-30.8],[-14.6,-30.8],[-14.7,-27.5]]],[0,65,[[12.0,-24.0],[12.1,-27.4],[27.9,-27.5],[27.9,-24.1]]],[0,60,[[-30.6,30.9],[-30.7,26.5],[-14.7,26.4],[-14.7,30.8]]],[0,60,[[11.7,26.7],[11.7,24.8],[27.6,24.9],[27.6,26.7]]],[0,55,[[12.1,-27.4],[12.0,-30.9],[28.0,-30.8],[27.9,-27.5]]],[0,55,[[54.1,17.3],[54.2,-19.2],[58.1,-19.2],[58.0,17.3]]],[0,50,[[11.7,30.8],[11.7,26.7],[27.6,26.7],[27.5,30.8]]],[0,45,[[42.8,30.8],[42.9,23.9],[57.9,23.9],[58.2,-26.0],[43.0,-26.0],[43.1,-30.9],[62.7,-30.9],[62.5,30.8]]],[0,30,[[-14.7,30.8],[-14.7,-3.6],[11.8,-3.6],[11.7,30.8]]],[0,25,[[-42.9,30.9],[-42.8,7.6],[-30.5,7.5],[-30.6,30.9]]],[0,25,[[27.5,30.8],[27.6,7.4],[43.0,7.3],[42.8,30.8]]],[0,20,[[-14.6,-22.6],[-14.6,-30.8],[12.0,-30.9],[12.0,-22.7]]],[0,18,[[27.8,-10.1],[28.0,-30.8],[43.1,-30.9],[42.9,-10.1]]],[0,18,[[-42.8,-9.8],[-42.7,-30.8],[-30.5,-30.8],[-30.5,-10.0]]]];
  tiers(B, parts, {W, SP, GL, R, C:LIME, SH:SHOPG, sp:1.9, ww:1.05, fh:3.5, wh:2.1, gh:5.6, top:1.4, minL:1.5,
    bands:[[-9, 18.5, 0.12, LIME], [14.0, 1.0, 0.3, LIME]]});
  basePanes(B, parts, 5.4, 9.2, 3.8, 1.9, 4.2, 3.2, GL);
  const Cp = B.p(CR), Up = B.p(CU), Lp = B.p(LAN), Rp = B.p(R);
  // ---- the twin crowns (tower axes at x = -21.6 and +18.9, z = +0.45)
  for (const cx of [-21.6, 18.9]){ const cz = 0.45;
    // top of the chamfered shaft: limestone band with corner pinnacles
    const sq = chamf(7.1, 7.1, 3.1, cx, cz); bandP(Cp, sq, 173.4, 1.8, 0.35);
    for (const p of sq) pierP(Cp, p[0], p[1], 172.5, 178.8, 0.9, 1.8);
    // the stone drum (175-183.5) with tall lancet openings, buttresses at the 8 corners
    const o1 = octP(cx, cz, 6.9, 8); wallsP(Cp, o1, 175, 183.5); flatP(Rp, o1, 183.5);
    openPoly(Lp, o1, 176.4, pointPts(1.5, 5.4, 3), 5.3, 0.05, null, 2);
    for (const p of o1){ const dx = p[0] - cx, dz = p[1] - cz, l = Math.hypot(dx, dz); pierP(Cp, p[0] + dx/l*0.3, p[1] + dz/l*0.3, 175, 184.6, 0.75, 1.5); }
    bandP(Cp, o1, 183.0, 0.8, 0.3);
    // copper octagon (183.5-187.5) with ribs, then the lantern and the copper cap
    const o2 = octP(cx, cz, 4.4, 8); loftP(Up, [o2.map(p => [p[0], 183.5, p[1]]), octP(cx, cz, 3.8, 8).map(p => [p[0], 187.5, p[1]])], false);
    for (const p of o2) segP(Up, [p[0], 183.5, p[1]], [cx + (p[0] - cx)*0.9, 187.6, cz + (p[1] - cz)*0.9], 0.22, 4);
    openPoly(Lp, octP(cx, cz, 4.15, 8), 184.4, pointPts(0.9, 2.4, 2), 3.2, 0.06, null, 1);
    flatP(Up, octP(cx, cz, 3.9, 8), 187.5);
    cylP(Lp, cx, cz, 2.0, 2.0, 187.5, 189.3, 8, false);
    for (let i = 0; i < 8; i++){ const a = i/8*TAU + PI/8; segP(Up, [cx + Math.cos(a)*2.2, 187.5, cz + Math.sin(a)*2.2], [cx + Math.cos(a)*2.2, 189.4, cz + Math.sin(a)*2.2], 0.16, 4); }
    const cap = []; for (let i = 0; i <= 4; i++){ const t = i/4; cap.push(octP(cx, cz, 2.5*(1 - t*t*0.92), 8).map(p => [p[0], 189.3 + t*2.2, p[1]])); }
    loftP(Up, cap, true); cylP(Up, cx, cz, 0.18, 0.04, 191.4, 193, 4, true);
  }
  // ---- Park Avenue entrance (-x face): limestone frontispiece, bronze-framed doors, the lit marquee band
  const Lm = B.p(LIME), Dp = B.p(SHOPG);
  abox(Lm, -63.6, -62.5, 0, 17.5, -9.5, 9.5);
  for (const z of [-6.5, 0, 6.5]){ abox(Dp, -63.85, -63.55, 0.2, 6.2, z - 2.1, z + 2.1); shapeP(Dp, archPts(4.2, 9.6, 6), [-63.9, 0.2, z], 0, -1, 0); }
  abox(B.p(LAMPW), -65.0, -63.6, 6.6, 7.0, -9.2, 9.2); abox(Lm, -65.2, -63.6, 7.0, 7.6, -9.4, 9.4);
  B.flush(g); return g; }};
SG_PLACES.push({type:'nywaldorf', lat:40.7565021, lon:-73.9733618, rot:-0.4994});
// =====================================================================================================================
// 570 Lexington Avenue / General Electric Building (Cross & Cross, 1931), at 51st Street (-z) and Lexington Avenue (+x):
// 50 floors, 195 m. Orange-red brick shading toward buff, with terracotta trim, in continuous vertical piers; setbacks at
// 50 / 62 / 73 / 85 m step the L-shaped base back from the rounded Lexington corner to the 22 m square tower. The crown:
// the shaft chamfers into an octagon, then the openwork Art Deco tracery — tall jagged spikes ("radio waves") rising in
// tiers round an octagonal core to the pointed top — lit warm orange at night. No signs or clock face lettering.
LANDMARKS.nyge570 = {zh:'通用电气大厦（列克星敦大道570号）', en:'570 Lexington Avenue (General Electric Building)', cat:'old', r:44, h:196,
  lt:{m:1, c:'#ffd9b0', k:0.7, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const W = {c:'#c97a4e', m:0, lc:'#ffcf9a', lk:0.2}, SP = {c:'#86452f', m:1, fh:3.6, cw:1.7}, GL = {c:'#3b3f44', m:1, fh:3.6, cw:1.7};
  const R = {c:'#7a6d64', m:0, lk:0.05}, TC = {c:'#c98f5c', m:0, lc:'#ffc98c', lk:0.8}, CR = {c:'#cf7a48', m:0, lc:'#ffbf80', lk:2.0};
  const GRAN = {c:'#4b3a33', m:0, lk:0.1}, CORE = {c:'#5a3a2e', glow:'#ff9d52', gk:0.6};
  const parts = [[0,172,[[-11.8,11.4],[-12.1,-10.6],[9.7,-10.9],[10.0,11.0]]],[0,85,[[-22.2,11.6],[-22.4,-6.5],[-12.1,-6.6],[-12.1,-10.6],[9.7,-10.9],[9.7,-7.4],[15.6,-7.5],[15.9,17.4],[1.5,17.4],[1.4,11.2]]],
    [0,73,[[-22.2,11.6],[-22.5,-10.5],[19.1,-11.1],[19.4,17.4],[1.5,17.4],[1.4,11.2]]],[0,62,[[-22.2,11.6],[-22.5,-12.5],[21.1,-13.1],[21.3,17.3],[-4.2,17.3],[-4.3,11.4]]],
    [0,50,[[-22.2,11.6],[-22.4,-15.2],[23.8,-15.8],[24.1,17.4],[-4.2,17.3],[-4.3,11.4]]],
    [0,22,[[-27.3,14.9],[-27.2,-16.4],[22.4,-16.4],[24.4,-15.9],[26.0,-14.1],[26.4,-12.6],[26.5,17.3],[-4.2,17.3],[-4.3,14.9]]]];
  tiers(B, parts, {W, SP, GL, R, C:TC, SH:SHOPG, sp:1.8, ww:1.0, fh:3.6, wh:2.2, gh:5.4, top:1.5, minL:1.5, co:0.3,
    bands:[[-9, 9.2, 0.12, GRAN], [5.2, 0.8, 0.3, TC]]});
  // small spiky finials on the setback parapets (the tracery motif repeated down the building)
  const Tp = B.p(TC), Cp = B.p(CR);
  for (const [i, sp] of [[1, 3.6], [2, 3.6], [3, 3.6], [4, 3.6]]){ const [, t0, P] = parts[i], ed = visEdges(parts, i);
    for (let k = 0; k < P.length; k++){ if (!ed(k)) continue; const f = edgeF(P, k); if (f.L < 3) continue; const n = Math.round(f.L/sp);
      for (let j = 0; j <= n; j++){ const p = f.at(j*f.L/n, t0, 0.1); segP(Tp, [p[0], t0 - 0.5, p[2]], [p[0], t0 + 2.6, p[2]], 0.38, 4, 0.03); } } }
  // ---- the crown. Tower square x -11.95..9.85, z -10.75..11.2 (centre -1.05, 0.2)
  const cx = -1.05, cz = 0.2;
  const ch1 = chamf(10.9, 10.95, 3.2, cx, cz); wallsP(B.p(W), ch1, 170, 177); flatP(B.p(R), ch1, 177);
  stripsP(B.p(SP), ch1, 170.5, 176, 1.8, 1.0, 0.05, null, 2);
  for (const p of ch1) segP(Cp, [p[0], 168, p[1]], [p[0], 181, p[1]], 0.6, 4, 0.05);
  // octagonal core (brick, lit slots) tapering in two stages to the pointed top
  const o1 = octP(cx, cz, 7.6, 8), o2 = octP(cx, cz, 5.0, 8), o3 = octP(cx, cz, 2.6, 8);
  loftP(Cp, [o1.map(p => [p[0], 177, p[1]]), o1.map(p => [p[0], 183, p[1]]), o2.map(p => [p[0], 186, p[1]]), o2.map(p => [p[0], 189, p[1]]), o3.map(p => [p[0], 191, p[1]])], false);
  openPoly(B.p(CORE), octP(cx, cz, 7.65, 8), 177.6, pointPts(0.9, 4.6, 2), 1.6, 0.05, null, 1);
  openPoly(B.p(CORE), octP(cx, cz, 5.05, 8), 186.4, pointPts(0.7, 2.2, 2), 1.3, 0.05, null, 1);
  cylP(Cp, cx, cz, 2.7, 0.05, 191, 196, 8, true, PI/8);
  // the tracery: radial fins with jagged ("radio wave") outer edges in two tiers, the tallest on the octagon's corners
  const fin = (a, r0, y0, y1, d) => { const ux = Math.cos(a), uz = Math.sin(a), P = [[0, 0], [d, 0]], n = 5;
    for (let k = 1; k <= n; k++){ const t = k/n, yy = (y1 - y0)*t, dd = d*(1 - t*0.85); P.push([dd + 0.55, yy - (y1 - y0)/n*0.55]); P.push([dd*0.8, yy]); }
    P.push([0, y1 - y0]); shapeP(Cp, P, [cx + ux*r0, y0, cz + uz*r0], ux, uz, 0); };
  for (let i = 0; i < 16; i++){ const a = i/16*TAU + PI/8, big = i % 2 === 0; fin(a, big ? 7.4 : 7.1, 175.5, big ? 190.5 : 186.5, big ? 2.2 : 1.6); }
  for (let i = 0; i < 8; i++){ const a = i/8*TAU + PI/8; fin(a, 4.9, 185.5, 193.5, 1.4); }
  for (let i = 0; i < 24; i++){ const a = i/24*TAU, x = cx + Math.cos(a)*8.6, z = cz + Math.sin(a)*8.6; segP(Cp, [x, 176.5, z], [x, 179.5 + (i % 3)*1.4, z], 0.32, 4, 0.04); }
  // the rounded Lexington / 51st Street corner entrance: tall bronze-framed portal
  const Dp = B.p(SHOPG);
  abox(Tp, 23.2, 27.0, 0, 11, -16.8, -12.6); abox(Dp, 24.0, 27.2, 0.2, 8, -16.0, -13.2);
  B.flush(g); return g; }};
SG_PLACES.push({type:'nyge570', lat:40.7570847, lon:-73.9724489, rot:-0.5088});
// =====================================================================================================================
// Bowery Savings Bank Building (York & Sawyer, 1923), 110 E 42nd Street, opposite Grand Central: the Romanesque Revival
// banking palace. On 42nd Street (-z) a 4-storey Ohio sandstone base is filled by the great round arch (8.2 m wide, 14 m
// high, recessed window wall and doors inside) between pink granite colonnettes; the 18-storey office tower rises from the
// 5th floor in five bays of paired windows (green marble spandrels), tiled coping at the 17th floor and the hip-roofed
// penthouse. The banking hall runs back to 41st Street (+z) under the 38 m buff-brick rear wing with its skylight.
LANDMARKS.ny110e42 = {zh:'包厘储蓄银行大楼（东42街110号）', en:'Bowery Savings Bank Building (110 East 42nd Street)', cat:'old', r:36, h:81,
  lt:{m:1, c:'#ffe7c0', k:0.8, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const SAND = {c:'#cdb894', m:0, lc:'#ffe4b8', lk:0.8}, BRK = {c:'#c4ad86', m:0, lk:0.15}, SP = {c:'#71806f', m:1, fh:3.7, cw:1.6};
  const GL = {c:'#424a50', m:1, fh:3.7, cw:1.6}, R = {c:'#7b766d', m:0, lk:0.05}, GRAN = {c:'#a77c6d', m:0, lk:0.4};
  const TILE = {c:'#8b4a32', m:0, lc:'#ffd8a8', lk:0.8}, SKY = {c:'#c9b077', glow:'#ffd890', gk:0.5}, ARCH = {c:'#2c2e30', glow:'#ffd9a0', gk:0.7};
  const tower = [[-14.4, 19.7], [-14.4, -29.8], [17.0, -29.8], [17.0, -8.3], [-0.9, -8.3], [-0.9, 19.6]];
  const rear = [[-14.4, 29.9], [-14.4, 19.7], [-0.9, 19.6], [-0.9, 8.7], [17.0, 8.6], [17.0, 29.9]];
  const parts = [[0, 75.6, tower], [0, 38, rear]];
  tiers(B, parts, {W:BRK, SP, GL, R, C:SAND, sp:3.15, ww:2.3, fh:3.7, wh:2.2, gh:22, top:1.8, minL:2.5, pw:1.3,
    noWin:i => false, bands:[[-9, 26.3, 0.15, SAND], [21.6, 1.2, 0.45, SAND], [-9, 9.5, 0.3, GRAN]]});
  const Sp = B.p(SAND), Gp = B.p(GRAN), Tp = B.p(TILE);
  // tower faces above the base in limestone-like sandstone: corner piers and the coping
  bandP(Sp, tower, 66.4, 1.2, 0.35); bandP(Tp, tower, 74.6, 1.2, 0.4);
  for (const [x, z] of [[-14.4, -29.8], [17.0, -29.8], [17.0, -8.3], [-14.4, 19.7]]) boxP(Sp, 1.6, 74 - 22, 1.6, x, 22, z, 0);
  // hip-roofed penthouse (18th floor) on the 42nd Street block
  abox(Sp, -11.5, 14.1, 75.6, 79.0, -27.2, -11.0); panesP(B.p(GL), rectP(-11.5, 14.1, -27.2, -11.0), 76.2, 78.6, 3.1, 1.6, 0.06, 4, 2.0);
  hipP(Tp, -12.1, 14.7, -27.8, -10.4, 79.0, 82.2, 1);
  // ---- the 42nd Street front: the great arch with the recessed window wall, granite colonnettes, carved archivolt
  const xc = 1.3, zf = -29.8, w = 9.4, h = 15.0;
  abox(Sp, -14.4, 17.0, -9, 22.3, zf - 1.2, zf);
  const ap = archPts(w, h, 12);
  shapeP(B.p(ARCH), ap, [xc, 0, zf - 1.25], 1, 0, 0);
  for (let k = 0; k <= 12; k++){ const a = PI*k/12, r = w/2 + 0.55; const p = [xc + Math.cos(a)*r, h - w/2 + Math.sin(a)*r, zf - 1.6];
    boxP(Sp, 1.1, 1.1, 0.8, p[0], p[1] - 0.55, p[2], 0); }
  for (const s of [-1, 1]){ for (const dx of [0.6, 1.6]){ const x = xc + s*(w/2 + dx); cylP(Gp, x, zf - 1.7, 0.33, 0.33, 0, h - w/2, 8, false); } }
  // the arch's window grid and doors (lit at night), the side office entrance
  const Lp = B.p(SHOPG);
  for (let y = 4.5; y < h - w/2; y += 2.6) abox(Sp, xc - w/2 + 0.2, xc + w/2 - 0.2, y, y + 0.22, zf - 1.32, zf - 1.22);
  for (let x = -2; x <= 2; x++) abox(Sp, xc + x*1.6 - 0.1, xc + x*1.6 + 0.1, 0, h - 0.6, zf - 1.32, zf - 1.22);
  abox(Lp, -12.6, -9.0, 0, 5.4, zf - 1.32, zf - 1.15);
  // flanking arched windows on the base (Romanesque loggia rhythm) with granite colonnettes, and a carved band at the top
  for (const x of [-11.0, -7.0, 9.6, 13.6]){ shapeP(B.p(ARCH), archPts(2.6, 6.2, 6), [x, 9.5, zf - 1.25], 1, 0, 0);
    for (const d of [-1.55, 1.55]) cylP(Gp, x + d, zf - 1.5, 0.2, 0.2, 9.3, 13.7, 6, false); }
  abox(Sp, -14.6, 17.2, 17.6, 18.6, zf - 1.7, zf - 1.1);
  // banking-hall skylight on the rear wing roof
  abox(B.p(SKY), -10.5, 13.5, 38, 38.7, 12.5, 26.5);
  B.flush(g); return g; }};
SG_PLACES.push({type:'ny110e42', lat:40.7514407, lon:-73.9771550, rot:-0.5076});
// =====================================================================================================================
// Ford Foundation Building (Kevin Roche John Dinkeloo, 1967), 320 E 43rd Street — the 12-storey cube between 43rd
// (-z, the entrance) and 42nd Street (+z). An L of office floors on the north (43rd Street) and west sides wraps the glass-
// walled garden atrium in the south-east corner; the top three floors close the square over the atrium, carried on the
// massive Dakota mahogany granite piers. Weathering (Cor-Ten) steel spandrel beams and mullions, bronze-tinted glass;
// the atrium's glass walls (42nd Street and east faces) rise ten storeys to the skylight over a terraced subtropical
// garden that steps down from the 43rd Street level to 42nd Street. Night: lit office floors, the atrium glowing warm.
LANDMARKS.nyfordfdn = {zh:'福特基金会大楼', en:'Ford Foundation Building', cat:'new', r:40, h:48,
  lt:{m:1, c:'#ffe2b8', k:0.6, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const GRAN = {c:'#8f6a5c', m:0, lc:'#ffe0b8', lk:0.5}, COR = {c:'#5e3622', m:0, lk:0.08}, GLO = {c:'#3c4442', m:1, fh:3.9, cw:1.6};
  const ATR = {c:'#4c5652', glow:'#ffd69a', gk:0.35, op:0.55}, R = {c:'#6c6862', m:0, lk:0.05}, SKY = {c:'#b8c2bc', glow:'#ffe2b0', gk:0.5};
  const LEAF = {c:'#4f7a43', m:0, lc:'#ffe6b0', lk:0.6}, TRUNK = {c:'#5b4a3a', m:0}, TER = {c:'#7d7262', m:0, lc:'#ffd9a0', lk:0.5};
  const X0 = -27.0, X1 = 27.0, Z0 = -26.1, Z1 = 26.1, XA = -9.0, ZA = -8.0, TOPB = 36.0, TOP = 47.4, FH = 3.9;
  const Gp = B.p(GRAN), Cp = B.p(COR), Wp = B.p(GLO), Ap = B.p(ATR), Rp = B.p(R);
  // office blocks: glass + Cor-Ten spandrels (one per floor) + thin Cor-Ten mullions
  const office = (x0, x1, z0, z1, y0, y1, faces) => {
    const P = rectP(x0, x1, z0, z1), ed = k => faces[k];
    wallsP(Wp, P, y0, y1, ed); flatP(Rp, P, y1);
    for (let y = y0 + FH - 0.9; y < y1 + 0.1; y += FH) bandP(Cp, P, y, 0.95, 0.35, ed);
    finsP(Cp, P, y0, y1, 1.6, 0.3, ed);
  };
  // faces order of rectP: 0 = north (z0), 1 = east (x1), 2 = south (z1), 3 = west (x0)
  office(X0, X1, Z0, ZA, -8, TOP, [1, 1, 0, 1]);            // north (43rd Street) block, full height
  office(X0, XA, ZA, Z1, -8, TOP, [0, 0, 1, 1]);            // west block
  office(XA, X1, Z1 - 7.6, Z1, TOPB, TOP, [0, 1, 1, 0]);     // top floors spanning the 42nd Street side of the atrium
  office(X1 - 7.6, X1, ZA, Z1 - 7.6, TOPB, TOP, [0, 1, 0, 1]); // top floors spanning the east side
  // inner faces of the L toward the atrium (glass, no spandrels shown from far)
  wallsP(Wp, [[XA, Z1 - 7.6], [XA, ZA], [X1 - 7.6, ZA]], -8, TOPB, k => k < 2);
  wallsP(Wp, [[XA, Z1 - 7.6], [X1 - 7.6, Z1 - 7.6], [X1 - 7.6, ZA]], TOPB, TOP, k => k < 2);
  // the atrium: glass walls on the south and east faces, Cor-Ten mullion grid, skylight
  wallsP(Ap, [[XA, Z1], [X1, Z1], [X1, ZA]], -8, TOPB, k => true);
  for (let x = XA + 2.6; x < X1 - 0.5; x += 2.6) abox(Cp, x - 0.12, x + 0.12, -8, TOPB, Z1 - 0.05, Z1 + 0.45);
  for (let z = ZA + 2.6; z < Z1 - 0.5; z += 2.6) abox(Cp, X1 - 0.05, X1 + 0.45, -8, TOPB, z - 0.12, z + 0.12);
  for (let y = 3.9; y < TOPB; y += 3.9){ abox(Cp, XA, X1, y - 0.15, y + 0.15, Z1 - 0.05, Z1 + 0.5); abox(Cp, X1 - 0.05, X1 + 0.5, y - 0.15, y + 0.15, ZA, Z1); }
  abox(B.p(SKY), XA, X1 - 7.6, TOP - 1.4, TOP - 1.0, ZA, Z1 - 7.6);
  for (let x = XA + 3.5; x < X1 - 7.6; x += 3.5) abox(Cp, x - 0.15, x + 0.15, TOP - 1.0, TOP - 0.6, ZA, Z1 - 7.6);
  // granite piers: the corners and the structural piers of the facades, full height
  const pier = (x, z, wx, wz, y1) => abox(Gp, x - wx/2, x + wx/2, -8, y1, z - wz/2, z + wz/2);
  pier(X0 + 1.4, Z0 + 1.4, 3.6, 3.6, TOP + 0.3); pier(X1 - 1.4, Z0 + 1.4, 3.6, 3.6, TOP + 0.3);
  pier(X0 + 1.4, Z1 - 1.4, 3.6, 3.6, TOP + 0.3); pier(X1 - 1.6, Z1 - 1.6, 3.8, 3.8, TOP + 0.3);
  pier(XA, Z1 - 0.9, 3.0, 2.6, TOP + 0.3); pier(X1 - 0.9, ZA, 2.6, 3.0, TOP + 0.3);
  for (const x of [-9.0, 9.0]) pier(x, Z0 + 0.6, 2.4, 1.6, TOP + 0.3);
  for (const z of [8.0]) pier(X0 + 0.6, z, 1.6, 2.4, TOP + 0.3);
  // granite fascia over the atrium (the deep beam under the top floors)
  abox(Gp, XA, X1, TOPB - 2.0, TOPB, Z1 - 0.6, Z1 + 0.6); abox(Gp, X1 - 0.6, X1 + 0.6, TOPB - 2.0, TOPB, ZA, Z1);
  // the garden: terraces stepping down toward 42nd Street, trees, a pool
  const Tp = B.p(TER);
  for (let k = 0; k < 4; k++){ const z0 = ZA + k*8.3, y = -0.2 - k*1.2; abox(Tp, XA + 0.3, X1 - 0.3, -8, y, z0, Math.min(Z1 - 0.3, z0 + 8.3)); }
  abox(B.p({c:'#4d6a72', m:0, lk:0.3}), 2, 11, -3.4, -3.3, 9.0, 15.0);
  const L = B.p(LEAF), T = B.p(TRUNK);
  for (const [x, z, s] of [[-5, -4, 1.5], [1, -3, 1.3], [8, -5, 1.6], [15, -3, 1.4], [21, -1, 1.5], [-5, 4, 1.4], [6, 3, 1.2], [18, 6, 1.6],
    [-4, 13, 1.5], [14, 13, 1.3], [22, 14, 1.4], [-5, 21, 1.3], [5, 21, 1.6], [16, 21, 1.4], [23, 22, 1.2]]){
    const k = Math.max(0, Math.min(3, Math.floor((z - ZA)/8.3))), y = -0.2 - k*1.2;
    treeP(B, x, y, z, s*1.6, LEAF, TRUNK); }
  // 43rd Street entrance: recessed glass doors between the piers
  abox(B.p(SHOPG), -6, 6, -1.0, 3.6, Z0 - 0.4, Z0 - 0.2);
  B.flush(g); return g; }};
SG_PLACES.push({type:'nyfordfdn', lat:40.7498475, lon:-73.9711809, rot:-0.5055});
// ---- Tudor City data (generated by tools/tudor_data.py from ref_ny42.json): per key [lat, lon, rot, buildings]
const TUDOR = {
  nytudor:{lat:40.7486327, lon:-73.9704989, rot:-0.5055, b:[{"n":"Tudor Tower","h":65.0,"ring":[[-9.3,30.0],[-9.3,14.8],[-0.2,14.8],[-0.1,7.5],[-9.4,7.5],[-9.4,-7.7],[-0.1,-7.7],[-0.1,-14.6],[-9.4,-14.7],[-9.3,-29.8],[8.2,-29.9],[8.1,29.9]],"parts":[[74.0,79.0,[[0.5,7.5],[0.5,-7.7],[7.3,-7.8],[7.3,7.6]]],[65.0,74.0,[[-0.1,7.5],[-0.1,-7.7],[8.2,-7.7],[8.2,7.5]]],[65.0,70.0,[[3.4,18.1],[3.3,11.6],[8.2,11.6],[8.1,18.0]]],[65.0,70.0,[[3.4,-13.3],[3.3,-18.7],[8.2,-18.8],[8.2,-13.3]]],[65.0,70.0,[[-9.4,7.5],[-9.4,-7.7],[-0.1,-7.7],[-0.1,7.5]]],[65.0,68.0,[[3.3,-18.7],[3.4,-22.6],[8.2,-22.7],[8.2,-18.8]]],[65.0,68.0,[[3.3,11.6],[3.3,7.5],[8.2,7.5],[8.2,11.6]]],[65.0,68.0,[[3.4,-7.7],[3.4,-13.3],[8.2,-13.3],[8.2,-7.7]]]]}]},
  nytudor_b:{lat:40.7493511, lon:-73.9699752, rot:-0.5055, b:[{"n":"Prospect Tower","h":65.0,"ring":[[-9.3,30.5],[-9.3,16.4],[-0.5,16.7],[-0.5,7.5],[-3.1,7.5],[-3.2,8.0],[-9.4,8.1],[-9.5,-7.7],[-0.4,-7.7],[-0.4,-16.6],[-9.1,-16.3],[-9.1,-30.6],[8.0,-30.6],[7.8,30.7]],"parts":[[74.0,79.0,[[0.2,7.5],[0.2,-7.7],[7.0,-7.7],[7.0,7.6]]],[65.0,74.0,[[-0.5,7.5],[-0.4,-7.7],[7.9,-7.7],[7.8,7.6]]],[65.0,70.0,[[2.9,-17.3],[2.9,-22.1],[8.0,-22.2],[7.9,-17.3]]],[65.0,70.0,[[2.7,21.3],[2.7,16.0],[7.7,16.0],[7.7,21.3]]],[65.0,70.0,[[-9.4,8.1],[-9.5,-7.7],[-0.4,-7.7],[-0.5,7.5],[-3.1,7.5],[-3.2,8.0]]],[65.0,68.0,[[2.7,16.0],[2.7,7.5],[7.8,7.6],[7.7,16.0]]],[65.0,68.0,[[2.8,-7.6],[2.9,-17.3],[7.9,-17.3],[7.9,-7.7]]]]}]},
  nytudor_c:{lat:40.7479791, lon:-73.9708698, rot:-0.5055, b:[{"n":"Windsor Tower","h":89.4,"ring":[[-15.8,29.6],[-15.8,13.5],[-6.3,13.5],[-6.1,7.0],[-15.8,6.9],[-15.7,-8.8],[-6.0,-8.7],[-5.9,-15.3],[-15.7,-15.4],[-15.6,-29.9],[14.3,-29.8],[14.1,29.9]],"parts":[]}]},
  nytudor_d:{lat:40.7492343, lon:-73.9714656, rot:-0.5055, b:[{"n":"Woodstock Tower","h":10.8,"ring":[[-17.9,11.4],[-17.9,-11.4],[17.9,-11.4],[17.9,11.4]],"parts":[[80.0,111.1,[[-6.9,0.5],[-6.9,-8.7],[6.9,-8.7],[6.8,0.6]]],[104.0,107.0,[[-2.3,0.5],[-2.3,-8.7],[2.3,-8.7],[2.3,0.6]]],[77.0,101.0,[[-13.4,0.6],[-13.5,-2.7],[-9.5,-2.6],[-9.4,-8.7],[-6.9,-8.7],[-6.9,0.5]]],[77.0,101.0,[[6.8,0.6],[6.9,-8.7],[9.3,-8.8],[9.3,-2.7],[13.4,-2.7],[13.4,0.6]]],[83.0,95.0,[[-15.2,0.6],[-15.2,-6.0],[-9.4,-6.1],[-9.5,-2.6],[-13.5,-2.7],[-13.4,0.6]]],[83.0,95.0,[[9.3,-2.7],[9.4,-6.2],[15.1,-6.2],[15.1,0.7],[13.4,0.6],[13.4,-2.7]]],[0.0,89.0,[[-18.0,2.9],[-17.9,-6.1],[-15.2,-6.0],[-15.2,0.6],[15.1,0.7],[15.1,-6.2],[18.0,-6.1],[17.9,3.0]]],[77.0,83.0,[[-2.3,-8.7],[-2.2,-10.0],[2.3,-10.0],[2.3,-8.7]]],[0.0,83.0,[[-18.0,3.9],[-18.0,2.9],[17.9,3.0],[17.9,4.1]]],[0.0,83.0,[[9.4,-6.2],[9.4,-7.4],[17.9,-7.5],[18.0,-6.1]]],[0.0,83.0,[[-17.9,-6.1],[-17.8,-7.4],[-9.5,-7.4],[-9.4,-6.1]]],[74.0,80.0,[[-6.9,-8.7],[-6.9,-10.1],[-2.2,-10.0],[-2.3,-8.7]]],[74.0,80.0,[[2.3,-8.7],[2.3,-10.0],[6.9,-10.1],[6.9,-8.7]]],[0.0,77.0,[[-2.2,-10.0],[-2.3,-11.4],[2.3,-11.4],[2.3,-10.0]]],[0.0,77.0,[[-17.9,5.0],[-18.0,3.9],[17.9,4.1],[17.9,5.1]]],[0.0,77.0,[[-17.8,-7.4],[-17.9,-8.7],[-9.4,-8.7],[-9.5,-7.4]]],[0.0,77.0,[[9.4,-7.4],[9.3,-8.8],[17.9,-8.7],[17.9,-7.5]]],[0.0,74.0,[[-6.9,-10.1],[-6.9,-11.4],[-2.3,-11.4],[-2.2,-10.0]]],[0.0,74.0,[[2.3,-10.0],[2.3,-11.4],[6.8,-11.4],[6.9,-10.1]]],[0.0,71.0,[[-17.9,6.1],[-17.9,5.0],[17.9,5.1],[17.9,6.1]]],[0.0,71.0,[[9.3,-8.8],[9.3,-10.1],[17.9,-10.1],[17.9,-8.7]]],[0.0,71.0,[[-17.9,-8.7],[-17.9,-10.0],[-9.5,-10.0],[-9.4,-8.7]]],[0.0,65.0,[[-17.9,7.2],[-17.9,6.1],[17.9,6.1],[17.9,7.2]]],[0.0,65.0,[[-17.9,-10.0],[-17.9,-11.4],[-6.9,-11.4],[-6.9,-10.1]]],[0.0,65.0,[[6.9,-10.1],[6.8,-11.4],[17.9,-11.4],[17.9,-10.1]]],[0.0,59.0,[[-18.0,8.3],[-17.9,7.2],[17.9,7.2],[17.9,8.2]]],[0.0,53.0,[[-18.0,9.3],[-18.0,8.3],[17.9,8.2],[17.9,9.3]]],[0.0,47.0,[[-17.9,10.4],[-18.0,9.3],[17.9,9.3],[17.9,10.3]]],[0.0,41.0,[[-17.9,11.4],[-17.9,10.4],[17.9,10.3],[17.9,11.4]]]]}]},
  nytudor_e:{lat:40.7489646, lon:-73.9716741, rot:-0.5055, b:[{"n":"Essex House","h":32.8,"ring":[[-22.1,10.9],[-21.8,-11.1],[21.9,-11.0],[21.8,11.1]],"parts":[]}]},
  nytudor_f:{lat:40.7487009, lon:-73.9721078, rot:-0.5055, b:[{"n":"Hatfield House","h":43.5,"ring":[[-28.9,4.1],[-28.9,-11.1],[-14.3,-11.2],[-14.3,7.7],[-18.2,7.7],[-22.2,6.0],[-23.4,7.2]],"parts":[]},{"n":"Hardwicke Hall","h":32.8,"ring":[[-11.6,7.3],[-11.6,0.9],[-9.8,0.9],[-9.8,-3.5],[-14.3,-3.5],[-14.3,-10.7],[7.0,-10.8],[7.1,-3.5],[2.6,-3.5],[2.6,5.3],[7.0,5.4],[7.1,14.3],[3.9,14.2]],"parts":[]},{"n":"Hadden Hall","h":33.4,"ring":[[7.1,14.0],[7.1,6.8],[12.2,6.8],[12.2,4.5],[11.7,4.5],[11.7,-2.1],[7.0,-2.2],[7.0,-10.8],[26.6,-10.8],[26.5,-2.2],[21.3,-2.2],[21.4,2.1],[22.0,2.1],[22.0,4.4],[21.3,4.4],[21.3,6.8],[26.5,6.8],[26.5,14.0]],"parts":[]}]},
  nytudor_g:{lat:40.7482956, lon:-73.9716878, rot:-0.5055, b:[{"n":"Tudor Gardens","h":42.2,"ring":[[-36.5,27.0],[-36.6,-2.9],[-26.0,-2.9],[-26.0,-10.4],[-20.3,-10.4],[-20.3,-17.2],[-21.6,-17.2],[-21.6,-31.4],[-1.3,-31.4],[-1.3,-27.9],[5.5,-27.8],[5.5,-29.0],[7.9,-29.0],[7.9,-32.4],[22.5,-32.5],[22.5,-29.1],[35.7,-29.0],[35.7,-12.2],[22.5,-12.2],[22.5,-9.4],[14.7,-9.4],[14.7,-5.0],[16.6,-4.9],[16.6,-0.7],[14.7,-0.8],[14.7,4.1],[22.5,4.0],[22.4,6.5],[35.5,6.5],[35.5,26.8]],"parts":[]}]},
  nytudor_h:{lat:40.7500806, lon:-73.9702017, rot:-0.5055, b:[{"n":"The Manor","h":33.1,"ring":[[-11.0,12.6],[-11.0,4.1],[-6.8,4.0],[-6.8,-4.6],[-11.0,-4.6],[-11.0,-13.2],[1.3,-13.1],[1.2,-5.4],[4.5,-5.4],[4.6,-4.1],[7.7,-4.2],[7.8,-13.1],[19.9,-13.1],[19.9,-4.1],[26.3,-4.1],[26.3,-13.2],[38.2,-13.1],[38.2,-4.1],[44.6,-4.1],[44.6,-13.1],[48.8,-13.0],[48.8,-5.4],[54.5,-5.3],[54.5,2.1],[53.6,2.0],[53.5,4.1],[56.9,4.2],[56.9,12.8],[44.5,12.8],[44.5,3.2],[38.3,3.2],[38.3,12.7],[26.1,12.7],[26.1,3.2],[19.8,3.1],[19.8,12.7],[7.5,12.6],[7.5,3.2],[1.4,3.1],[1.4,12.6]],"parts":[]},{"n":"The Cloister","h":32.3,"ring":[[-50.0,12.6],[-50.0,4.5],[-45.2,4.5],[-45.2,-5.0],[-49.9,-5.0],[-50.0,-13.2],[-11.0,-13.2],[-11.0,-5.1],[-16.3,-5.1],[-16.3,3.6],[-15.8,4.7],[-11.0,4.7],[-11.0,12.6]],"parts":[]}]},
  nytudor_i:{lat:40.7498338, lon:-73.9706879, rot:-0.5055, b:[{"n":"Hermitage","h":31.1,"ring":[[-10.2,12.8],[-10.2,4.6],[-4.8,4.6],[-4.8,-3.9],[-5.9,-3.9],[-5.9,-4.7],[-10.2,-4.7],[-10.2,-12.8],[10.3,-12.8],[10.2,-5.0],[5.6,-4.9],[5.6,-3.9],[5.0,-3.9],[5.0,4.8],[10.3,4.8],[10.2,12.8]],"parts":[]}]},
};
// =====================================================================================================================
// Tudor City (Fred F. French Co., H. Douglas Ives, 1927-32): the neo-Tudor residential enclave on the bluff between
// 40th and 43rd Streets, Second Avenue to First Avenue, round Tudor City Place (which bridges 42nd Street). Split into
// compact keys so each hides only its own building(s): nytudor = Tudor Tower (the label), _b Prospect Tower, _c Windsor
// Tower, _d Woodstock Tower (the tallest, stepped crown), _e Essex House, _f Hatfield House / Hardwicke Hall / Haddon
// Hall, _g Tudor Gardens, _h The Manor / The Cloister, _i Hermitage. Every building on its real OSM footprint and building
// parts (frame = the Midtown grid, +x toward the East River, -z uptown). Style: warm red-brown brick, limestone /
// terracotta trim, a stone base course, small-paned casement windows in pairs, crenellated parapets with stone merlons,
// stone-capped corner pinnacles, few windows on the east faces of the bluff towers (they turned their backs on the old
// East River slaughterhouses) and, on the towers, the top storeys of tall pointed-arch (stained-glass) windows and the
// gothic water-tank enclosures. The rooftop neon signs are left out (lettering). Night: lit windows, warm floodlit tops.
const TUDOR_SPEC = {
  nytudor:{zh:'都铎城', en:'Tudor City', r:34, h:81},
  nytudor_b:{zh:'都铎城·展望塔', en:'Prospect Tower (Tudor City)', r:34, h:81},
  nytudor_c:{zh:'都铎城·温莎塔', en:'Windsor Tower (Tudor City)', r:36, h:99},
  nytudor_d:{zh:'都铎城·伍德斯托克塔', en:'Woodstock Tower (Tudor City)', r:24, h:113},
  nytudor_e:{zh:'都铎城·埃塞克斯楼', en:'Essex House (Tudor City)', r:26, h:36},
  nytudor_f:{zh:'都铎城·哈特菲尔德楼等', en:'Hatfield House, Hardwicke Hall, Haddon Hall (Tudor City)', r:34, h:54},
  nytudor_g:{zh:'都铎城·都铎花园', en:'Tudor Gardens (Tudor City)', r:47, h:52},
  nytudor_h:{zh:'都铎城·庄园楼与回廊楼', en:'The Manor and The Cloister (Tudor City)', r:60, h:36},
  nytudor_i:{zh:'都铎城·隐庐', en:'Hermitage (Tudor City)', r:18, h:34}};
for (const key in TUDOR){
  const D = TUDOR[key], S = TUDOR_SPEC[key];
  const DEF = LANDMARKS[key] = {zh:S.zh, en:S.en, cat:'old', r:S.r, h:S.h,
    lt:{m:1, c:'#ffe3b8', k:0.7, e:0.55}, build(){
    const g = new THREE.Group(), B = mkB();
    const BR = {c:'#8f5640', m:0, lc:'#ffd9a8', lk:0.15}, ST = {c:'#d2c3a2', m:0, lc:'#ffe2b4', lk:0.9}, R = {c:'#6e6862', m:0, lk:0.05};
    const WIN = {c:'#3f4448', m:1, fh:3.0, cw:2.4}, GOTH = {c:'#3d3a3a', glow:'#ffd7a0', gk:0.75}, TANK = {c:'#7c4a37', m:0, lc:'#ffd2a0', lk:0.6};
    const Bp = B.p(BR), Sp = B.p(ST), Wp = B.p(WIN), Gp = B.p(GOTH), Rp = B.p(R), EASTB = /^nytudor(_b|_c)?$/.test(key);
    for (const b of D.b){
      const parts = [[0, b.h, b.ring]].concat(b.parts.map(p => [p[0], p[1], p[2]]));
      const tmax = Math.max(...parts.map(p => p[1]));
      for (let i = 0; i < parts.length; i++){
        const [b0, t0, P] = parts[i]; if (t0 - b0 < 0.6) continue; const ed = visEdges(parts, i), y0 = b0 > 0.1 ? b0 : -10;
        wallsP(Bp, P, y0, t0, ed); flatP(Rp, P, t0);
        const tall = t0 >= 55 && t0 > tmax - 16 && t0 - b0 > 4;
        // crenellated parapet (stone merlons) and the coping
        crenelPoly(Sp, P, t0, t0 + 0.9, 0.8, 1.5, 0.45, ed);
        // windows: paired casements on a 3.0 m storey grid; the top storeys of the towers get tall pointed-arch windows
        const ya = b0 > 0.1 ? b0 + 0.9 : 4.6, yb = tall ? t0 - 7.4 : t0 - 1.0;
        // the towers on the bluff turned their backs on the old East River slaughterhouses: few windows on the east faces
        const eastF = k => EASTB && outN(P, k)[0] > 0.7;
        if (yb - ya > 1.6){ panesP(Wp, P, ya, yb, 2.5, 1.25, 0.05, 3.0, 1.7, k => ed(k) && !eastF(k), 2.2);
          if (EASTB) panesP(Wp, P, ya, yb, 9.0, 1.1, 0.05, 3.0, 1.5, k => ed(k) && eastF(k), 4); }
        if (tall) openPoly(Gp, P, t0 - 6.6, pointPts(1.5, 4.9, 3), 3.1, 0.06, ed, 2.5);
        if (b0 <= 0.1){ bandP(Sp, P, -10, 13.7, 0.14, ed); bandP(Sp, P, 3.5, 0.5, 0.25, ed);
          stripsP(B.p(SHOPG), P, 0.6, 3.0, 4.8, 2.0, 0.16, ed, 4); }
        if (t0 - b0 > 12) bandP(Sp, P, t0 - (tall ? 7.9 : 3.6), 0.45, 0.14, ed);
        // corner pinnacles on the tower tops
        if (tall) for (let k = 0; k < P.length; k++){ if (!ed(k) && !ed((k + P.length - 1) % P.length)) continue;
          const p = P[k]; pierP(Sp, p[0], p[1], t0 - 1.0, t0 + 2.4, 0.95, 1.9); }
      }
      // gothic water-tank enclosure on the highest roof (if the building has no tall stepped parts of its own)
      if (!b.parts.length && b.h > 40){ let cx = 0, cz = 0; for (const p of b.ring){ cx += p[0]/b.ring.length; cz += p[1]/b.ring.length; }
        if (pip(b.ring, cx, cz)){ abox(B.p(TANK), cx - 3.2, cx + 3.2, b.h, b.h + 6.5, cz - 3.2, cz + 3.2);
          openRect(Gp, cx - 3.2, cx + 3.2, cz - 3.2, cz + 3.2, b.h + 1.2, pointPts(1.1, 3.6, 3), 2.1, 0.05);
          crenelPoly(Sp, rectP(cx - 3.2, cx + 3.2, cz - 3.2, cz + 3.2), b.h + 6.5, b.h + 7.2, 0.7, 1.1, 0.4);
          for (const [x, z] of [[-3.2, -3.2], [3.2, -3.2], [3.2, 3.2], [-3.2, 3.2]]) pierP(Sp, cx + x, cz + z, b.h + 5.5, b.h + 8.2, 0.8, 1.6); } }
    }
    B.flush(g); return g; }};
  if (key !== 'nytudor') DEF.label = false;
  SG_PLACES.push({type:key, lat:D.lat, lon:D.lon, rot:D.rot});
}
// Tudor City Place bridge over 42nd Street (1928-29): the app draws the road deck (6.6 m above 42nd Street); this key adds
// what stands round it — the side fascia girders with gothic blind panels, the stone parapets with their copings, the four
// lantern posts at the bridge ends and the abutment walls under the deck ends. Frame: the bridge centre, +z = downtown.
LANDMARKS.nytudor_j = {zh:'都铎城桥', en:'Tudor City Place Bridge', cat:'old', r:19, h:12, label:false,
  lt:{m:0, c:'#ffe2b4', k:0.8, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const ST = {c:'#c9b99a', m:0, lc:'#ffe2b4', lk:0.9}, GIR = {c:'#5d5d58', m:0, lk:0.3}, DK = {c:'#3a3936', m:0, lk:0.1};
  const Sp = B.p(ST), Gp = B.p(GIR), Dp = B.p(DK), Lp = B.p(LAMPW);
  const D = 6.0, HW = 9.0, HL = 15.2;               // deck top (model y), half width, half length
  for (const s of [-1, 1]){ const x = s*HW;
    abox(Gp, x - 0.45, x + 0.45, D - 1.8, D - 0.05, -HL, HL);                  // fascia girder
    for (let z = -HL + 1.9; z < HL - 1; z += 3.8) shapeP(Sp, pointPts(2.4, 1.3, 2), [x + s*0.47, D - 1.65, z], 0, s > 0 ? -1 : 1, 0);
    abox(Sp, x - 0.3, x + 0.3, D - 0.05, D + 1.05, -HL, HL);                   // parapet
    abox(Sp, x - 0.42, x + 0.42, D + 1.05, D + 1.25, -HL, HL);                 // coping
    for (const z of [-HL, HL]){ pierP(Sp, x, z, D - 1.8, D + 1.6, 0.9, 0.5); cylP(Gp, x, z, 0.09, 0.09, D + 1.9, D + 4.2, 6, false);
      boxP(Lp, 0.5, 0.75, 0.5, x, D + 4.2, z, 0); pierP(Gp, x, z, D + 4.95, D + 4.95, 0.6, 0.45); }
  }
  // cross girders under the deck and the abutment walls at both ends (down into the ground)
  for (let z = -HL + 3; z < HL; z += 6) abox(Dp, -HW, HW, D - 1.5, D - 0.3, z - 0.3, z + 0.3);
  for (const s of [-1, 1]){ const z = s*(HL + 0.8); abox(Sp, -HW + 0.2, HW - 0.2, -4, D - 0.1, z - 0.8, z + 0.8);
    bandP(Sp, rectP(-HW + 0.2, HW - 0.2, z - 0.8, z + 0.8), D - 0.6, 0.5, 0.15); }
  B.flush(g); return g; }};
SG_PLACES.push({type:'nytudor_j', lat:40.7490855, lon:-73.9704245, rot:-0.5055});
// Tudor City Greens: the two small parks on the west side of Tudor City Place, north (_k, 42nd-43rd St) and south (_l,
// 41st-42nd St) of the bridge — paved walks (the app hides the park paths under the model), raised lawns with low stone
// kerbs, a low iron fence round each park, mature shade trees and a few lamp posts. Frame: the park centre.
const tudorPark = (hx, hz, lawns, seed) => function(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const PAVE = {c:'#a49d92', m:0, lk:0.1}, GRASS = {c:'#5f8a45', m:0, lk:0.05}, KERB = {c:'#bdb3a0', m:0, lk:0.2};
  const IRON = {c:'#2b2b2a', m:0}, LEAF = {c:'#4c7a3c', m:0, lc:'#ffe6b0', lk:0.35}, TRUNK = {c:'#5a4836', m:0};
  abox(B.p(PAVE), -hx, hx, -2.5, 0.05, -hz, hz);
  const Fp = B.p(IRON);
  for (const [x0, x1, z0, z1] of [[-hx, hx, -hz, -hz], [-hx, hx, hz, hz], [-hx, -hx, -hz, hz], [hx, hx, -hz, hz]]){
    abox(Fp, x0 - 0.05, x1 + 0.05, 0.9, 1.0, z0 - 0.05, z1 + 0.05);
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.round(L/2.5);
    for (let k = 0; k <= n; k++){ const t = k/n; abox(Fp, lerp(x0, x1, t) - 0.06, lerp(x0, x1, t) + 0.06, 0, 1.05, lerp(z0, z1, t) - 0.06, lerp(z0, z1, t) + 0.06); } }
  for (const [x0, x1, z0, z1] of lawns){
    abox(B.p(KERB), x0, x1, 0.05, 0.3, z0, z1); abox(B.p(GRASS), x0 + 0.3, x1 - 0.3, 0.3, 0.36, z0 + 0.3, z1 - 0.3);
    const n = Math.max(1, Math.round((x1 - x0)*(z1 - z0)/55));
    for (let k = 0; k < n; k++){ const x = lerp(x0 + 2, x1 - 2, rng()), z = lerp(z0 + 2, z1 - 2, rng()); treeP(B, x, 0.3, z, 1.7 + rng()*0.6, LEAF, TRUNK); } }
  for (const [x, z] of [[-hx + 1, -hz + 1], [hx - 1, hz - 1], [hx - 1, -hz + 1], [-hx + 1, hz - 1]]){
    cylP(Fp, x, z, 0.08, 0.08, 0, 3.6, 6, false); boxP(B.p(LAMPW), 0.4, 0.55, 0.4, x, 3.6, z, 0); }
  B.flush(g); return g; };
LANDMARKS.nytudor_k = {zh:'都铎城绿地（北园）', en:'Tudor City Greens (North Park)', cat:'old', r:28, h:14, label:false,
  lt:{m:0, c:'#ffe2b4', k:0.4, e:0.5}, build:tudorPark(10.6, 24.8, [[-8.6, 1.4, -23, -2.5], [3.6, 8.8, -23, -2.5], [-8.6, 1.4, 0.5, 23], [3.6, 8.8, 0.5, 23]], 1)};
SG_PLACES.push({type:'nytudor_k', lat:40.7495501, lon:-73.9703487, rot:-0.5055});
LANDMARKS.nytudor_l = {zh:'都铎城绿地（南园）', en:'Tudor City Greens (South Park)', cat:'old', r:24, h:14, label:false,
  lt:{m:0, c:'#ffe2b4', k:0.4, e:0.5}, build:tudorPark(9.2, 21.1, [[-7.6, -1.2, -19.5, -2.0], [1.2, 7.6, -19.5, -2.0], [-7.6, -1.2, 2.0, 19.5], [1.2, 7.6, 2.0, 19.5]], 2)};
SG_PLACES.push({type:'nytudor_l', lat:40.7488089, lon:-73.9709323, rot:-0.5055});
}
