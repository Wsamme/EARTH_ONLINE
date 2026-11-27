// ===== nyc/ny50a: Midtown East landmarks (City Brush round lm50, New York 1:1) — group ny50a.
// 425 Park Avenue, Lipstick Building, Trump World Tower, 383 Madison Avenue (heroes) and 24 more towers, hotels, stores and
// institutions east of Fifth Avenue between 42nd and 60th Streets (Turtle Bay, Sutton Place, the UN district).
// Every model is built in a frame aligned with its real footprint (the Midtown street grid): local +x = along the cross streets
// toward the East River ("east"), local -z = up the avenues ("north"), +z = downtown; rot ~ -0.50 (the grid is ~29 deg clockwise of
// true north). Footprints and setback tiers are the app's own building parts (R/lm50/ref_ny50a.json: app records + OSM
// building:part base/top heights) transformed into that frame (PD below); heights are the verified ones where the data differ.
// Block-scoped: only LANDMARKS and SG_PLACES are touched. No text, logos, brand colours or signage anywhere.
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
// ---- footprint data: app building parts of each lot (ref_ny50a.json, app records + OSM building:part tiers), grid frame
// [base, top, [[x, z], ...]] in metres, local +x = toward the East River along the cross streets, -z = uptown, origin = lot centroid
const PD = {
  ny100unplaza:[[0,170,[[23.9,13.2],[24.0,8.6],[23.1,8.6],[23.1,-0.3],[24.3,-0.3],[24.0,-5.3],[23.2,-5.4],[23.3,-8.3],[22.4,-8.4],[22.3,-13.3],[-23.2,-13.5],[-23.4,13.2]]]],
  ny245park:[[0,185,[[44.2,15.8],[44.8,-14.4],[-44.2,-15.6],[-44.9,14.4]]],[0,198,[[12.9,22.1],[13.6,-22.5],[-15.6,-22.7],[-16.4,21.6]]]],
  ny277park:[[0,50,[[51.3,24.3],[51.1,-24.6],[-46.9,-24.1],[-47.1,-19.2],[-1.3,-19.3],[-1.4,19.1],[-46.6,19.3],[-46.7,24.8]]],[0,209,[[-1.4,19.1],[-1.3,-19.3],[-57.8,-19.0],[-57.8,19.5]]],[0,70,[[46.1,18.8],[45.9,-19.5],[-1.3,-19.3],[-1.4,19.1]]]],
  ny299park:[[0,175,[[23.0,24.7],[23.0,-25.0],[-23.0,-24.7],[-23.0,25.0]]]],
  ny345park:[[0,192.1,[[41.9,22.2],[42.1,-11.8],[-45.3,-12.2],[-45.8,21.9]]]],
  ny383madison:[[0,45,[[33.3,30.2],[33.3,-24.4],[26.9,-30.6],[-33.0,-30.3],[-32.8,30.4]]],[45,55,[[30.0,26.6],[29.9,-27.1],[-29.4,-26.8],[-29.4,26.8]]],[55,80,[[-11.8,26.7],[12.2,26.9],[29.8,11.1],[29.8,-11.5],[12.0,-27.1],[-11.9,-27.0],[-29.2,-11.4],[-29.3,11.2]]],[80,90,[[-25.4,9.3],[-10.2,22.7],[-10.3,26.7],[10.7,26.7],[10.6,22.8],[25.9,9.2],[29.9,9.3],[29.9,-9.8],[26.0,-9.6],[10.5,-23.2],[10.5,-27.2],[-10.2,-27.0],[-10.3,-23.0],[-25.3,-9.5],[-29.4,-9.6],[-29.3,9.5]]],[80,205,[[-10.2,22.7],[10.6,22.8],[25.9,9.2],[26.0,-9.6],[10.5,-23.2],[-10.3,-23.0],[-25.3,-9.5],[-25.4,9.3]]],[205,230,[[-8.6,18.4],[9.0,18.3],[21.0,6.9],[21.2,-7.9],[8.9,-18.6],[-8.5,-18.6],[-20.9,-7.6],[-20.8,7.4]]],[205,215,[[8.9,22.9],[9.0,18.3],[-8.6,18.4],[-8.5,22.7]]],[205,215,[[8.9,-18.6],[8.8,-23.1],[-8.2,-23.0],[-8.5,-18.6]]],[205,215,[[25.8,7.2],[25.9,-7.6],[21.2,-7.9],[21.0,6.9]]],[205,215,[[-20.8,7.4],[-20.9,-7.6],[-25.2,-7.5],[-25.3,7.4]]]],
  ny399park:[[0,34,[[-46.5,11.5],[-46.4,23.4],[-40.4,23.6],[-40.6,29.6],[48.5,29.9],[48.6,23.9],[54.7,24.0],[55.1,-18.4],[49.1,-18.5],[49.1,-22.8],[-39.9,-23.4],[-39.9,-18.9],[-59.1,-19.0],[-59.3,11.3]]],[0,54,[[-46.5,11.5],[-46.4,23.4],[54.7,24.0],[55.1,-18.4],[-59.1,-19.0],[-59.3,11.3]]],[0,57,[[12.2,11.9],[12.2,18.8],[46.2,18.9],[46.5,-13.4],[6.4,-13.7],[6.6,-18.6],[-59.1,-19.0],[-59.3,11.3]]],[0,160,[[6.1,11.8],[6.6,-18.6],[-59.1,-19.0],[-59.3,11.3]]]],
  ny425park:[[0,45,[[7.3,27.2],[7.3,22.9],[9.1,23.1],[9.1,20.5],[9.2,-24.3],[7.6,-24.2],[7.7,-28.8],[-17.5,-28.5],[-17.4,27.2]]],[55,110,[[7.3,22.9],[7.5,18.6],[9.1,18.5],[9.3,-20.0],[7.6,-19.9],[7.6,-24.2],[-13.5,-24.1],[-13.2,23.0]]],[0,55,[[7.4,16.9],[7.5,18.6],[9.1,18.5],[9.3,-20.0],[7.6,-19.9],[7.6,-18.8],[-13.4,-18.4],[-13.2,17.3]]],[120,219,[[7.5,18.6],[7.3,13.0],[8.9,12.9],[9.3,-13.2],[7.6,-13.1],[7.6,-19.9],[-9.0,-19.7],[-9.0,18.7]]],[0,120,[[8.9,12.9],[9.3,-13.2],[7.6,-13.1],[7.6,-14.3],[-9.1,-14.0],[-9.1,13.3]]],[0,13.4,[[24.3,23.9],[24.4,8.8],[19.7,8.7],[19.5,24.0]]],[0,45,[[19.9,-20.4],[20.0,-26.4],[9.3,-26.2],[9.1,-20.2]]],[0,45,[[19.6,25.3],[19.6,20.5],[9.1,20.5],[8.9,25.4]]],[0,219,[[19.6,16.2],[19.6,11.6],[9.1,11.6],[9.0,16.3]]],[0,110,[[19.6,20.5],[19.6,16.2],[9.0,16.3],[9.1,20.5]]],[0,219,[[19.8,-13.2],[19.9,-17.2],[9.2,-17.0],[9.3,-13.2]]],[0,110,[[19.9,-17.2],[19.9,-20.4],[9.1,-20.2],[9.2,-17.0]]],[0,262.2,[[20.0,-8.1],[19.9,-10.9],[9.1,-10.8],[9.1,-8.3]]],[0,262.2,[[19.7,9.7],[19.7,7.0],[9.2,7.1],[9.2,9.7]]],[0,262.2,[[19.7,0.8],[19.7,-1.7],[9.3,-1.7],[9.2,0.8]]],[0,242,[[19.9,-10.9],[19.8,-13.2],[9.3,-13.2],[9.1,-10.8]]],[0,242,[[19.7,-1.7],[19.7,-4.0],[9.2,-4.0],[9.3,-1.7]]],[0,242,[[19.7,-6.0],[20.0,-8.1],[9.1,-8.3],[9.2,-6.0]]],[0,242,[[19.7,7.0],[19.8,5.1],[9.1,4.8],[9.2,7.1]]],[0,219,[[19.8,5.1],[19.7,2.8],[9.2,2.9],[9.1,4.8]]],[0,242,[[19.7,2.8],[19.7,0.8],[9.2,0.8],[9.2,2.9]]],[0,219,[[19.7,-4.0],[19.7,-6.0],[9.2,-6.0],[9.2,-4.0]]],[0,242,[[19.6,11.6],[19.7,9.7],[9.2,9.7],[9.1,11.6]]]],
  ny599lex:[[0,175,[[17.9,24.3],[18.5,-27.4],[-7.6,-27.3],[-8.1,23.9]]],[28,140,[[-8.1,23.9],[-7.6,-27.3],[-34.1,-1.8]]],[0,34,[[-8.1,23.9],[-7.8,-1.6],[-34.1,-1.8],[-34.4,23.8]]],[0,199,[[18.2,-1.3],[-7.6,-27.3],[-7.8,-1.6],[-8.1,23.9]]],[0,30,[[29.7,24.3],[29.7,20.9],[23.5,20.9],[23.4,11.3],[30.0,11.4],[30.1,-27.2],[18.5,-27.4],[17.9,24.3]]],[25,30,[[-7.8,-1.6],[-7.6,-27.3],[-34.1,-1.8]]],[0,25,[[-33.1,-2.3],[-8.6,-2.3],[-8.4,-26.1],[-8.9,-26.4]]]],
  ny712fifth:[[0,168,[[21.5,14.4],[21.3,-10.0],[-15.3,-9.4],[-15.0,15.2]]],[168,198,[[-11.9,11.5],[-11.8,15.1],[18.1,14.6],[18.3,11.3],[21.4,11.3],[21.3,-6.5],[18.1,-6.4],[17.9,-9.8],[-11.8,-9.3],[-11.9,-6.4],[-15.2,-6.2],[-15.0,11.6]]],[0,23,[[-15.2,-6.2],[-15.3,-9.4],[21.3,-10.0],[21.5,14.4],[30.7,14.3],[30.6,-14.8],[-30.3,-14.8],[-30.3,-5.9]]],[0,45,[[-15.0,11.6],[-15.2,-6.2],[-30.3,-5.9],[-30.2,11.9]]],[0,54,[[-15.1,7.0],[-15.1,-2.0],[-30.2,-1.6],[-30.1,7.0]]]],
  ny919third:[[0,178,[[26.9,14.3],[27.0,-20.4],[-51.1,-20.2],[-51.3,14.2]]],[0,187,[[20.5,11.2],[20.3,-16.3],[-21.5,-16.1],[-21.5,11.3]]],[0,20,[[50.1,27.4],[50.3,-2.3],[26.8,-2.5],[26.9,14.3],[17.6,14.3],[17.4,27.5]]],[0,20,[[27.0,-20.4],[27.1,-33.2],[17.4,-33.0],[17.4,-20.2]]]],
  nybeekmantower:[[0,85.8,[[-18.0,11.3],[-15.1,11.4],[-15.2,10.3],[-0.6,10.1],[-0.5,11.3],[19.1,11.2],[19.1,-10.0],[12.5,-9.9],[12.5,-7.4],[3.3,-7.5],[3.2,-13.3],[-6.8,-13.3],[-6.8,-11.2],[-17.6,-11.3],[-19.0,-9.9],[-19.1,-7.0],[-18.1,-7.3],[-18.0,7.3],[-19.1,7.3],[-18.9,10.1]]]],
  nybloomingdales:[[0,55,[[64.1,30.1],[63.9,-30.6],[35.0,-30.6],[34.9,-28.8],[4.4,-28.5],[4.4,-30.6],[-63.8,-30.5],[-63.7,30.1]]]],
  nycitylex:[[0,115,[[-22.5,28.7],[9.9,28.6],[21.4,18.3],[21.3,-2.6],[27.7,-8.6],[27.6,-17.5],[15.4,-29.8],[2.6,-29.6],[-0.9,-26.3],[-0.8,-14.1],[-10.8,-4.0],[-23.3,-3.7],[-26.8,-0.3],[-26.9,24.5]]],[115,122,[[-7.9,20.7],[7.0,20.7],[11.5,16.9],[11.4,-0.8],[17.2,-6.9],[17.3,-10.3],[13.1,-14.8],[8.8,-15.3],[-12.0,5.3],[-12.5,16.4]]],[0,12,[[-10.8,-4.0],[-0.8,-14.1],[-0.8,-20.3],[-6.6,-20.5],[-17.5,-9.8],[-17.0,-3.8]]],[0,5,[[-23.3,-3.7],[-17.0,-3.8],[-17.5,-9.8],[-22.5,-14.7],[-26.9,-10.3],[-26.8,-0.3]]],[0,5,[[-6.6,-20.5],[-0.8,-20.3],[-0.9,-26.3],[2.6,-29.6],[-7.3,-29.7],[-11.7,-25.5]]],[0,20,[[27.6,-17.5],[27.6,-30.0],[15.4,-29.8]]],[0,13,[[21.3,28.6],[21.4,18.3],[9.9,28.6]]],[15,110,[[-23.3,-3.7],[-25.1,-3.9],[-26.9,-2.0],[-26.8,-0.3]]],[15,110,[[2.6,-29.6],[1.1,-29.9],[-0.6,-27.9],[-0.9,-26.3]]]],
  nycrownbldg:[[0,89,[[-1.9,0.2],[-2.0,-9.7],[1.2,-12.8],[12.6,-12.8],[15.7,-9.7],[15.5,0.4],[21.2,0.4],[21.6,-17.7],[-7.7,-18.0],[-8.0,0.2]]],[0,105,[[1.2,4.8],[12.6,4.9],[15.5,1.8],[15.7,-9.7],[12.6,-12.8],[1.2,-12.8],[-2.0,-9.7],[-2.0,1.7]]],[104,123,[[1.4,3.8],[11.9,3.7],[14.7,1.4],[14.8,-9.2],[12.2,-11.8],[1.7,-12.0],[-0.9,-9.4],[-1.2,1.2]]],[0,55,[[-8.0,4.7],[-8.0,-6.7],[-16.0,-6.8],[-16.3,4.7]]],[0,50,[[-8.0,-6.7],[-7.7,-18.0],[-15.9,-18.1],[-16.0,-6.8]]],[0,50,[[26.2,0.5],[26.4,-17.8],[21.6,-17.7],[21.2,0.4]]],[104,114,[[14.6,-2.3],[14.5,-5.6],[-1.0,-5.7],[-0.9,-2.6]]],[104,114,[[8.5,3.7],[8.6,-11.8],[5.4,-11.7],[5.2,3.8]]],[0,55,[[23.7,5.0],[23.8,0.4],[15.5,0.4],[15.5,1.8],[12.6,4.9]]],[0,60,[[-2.0,4.9],[-1.9,0.2],[-8.0,0.2],[-8.0,4.7]]],[0,112,[[1.2,4.8],[1.1,1.7],[-2.0,1.7],[-2.0,4.9]]],[0,117,[[-0.9,4.2],[-0.0,4.3],[0.5,3.7],[0.6,2.8],[-0.1,2.1],[-1.1,2.3],[-1.6,2.9],[-1.5,3.7]]]],
  nygraybar:[[0,106,[[-22.2,37.6],[-22.4,13.0],[-9.4,12.8],[-9.3,-6.3],[-22.4,-6.2],[-22.3,-31.1],[-41.2,-31.3],[-41.2,38.3]]],[0,14,[[41.0,18.1],[41.2,-11.4],[21.6,-11.4],[21.5,18.4]]],[0,14,[[41.1,-30.8],[41.3,-37.7],[-41.1,-37.8],[-41.2,-31.3]]],[0,112,[[-1.2,-8.5],[-1.1,-12.5],[8.3,-12.6],[8.2,-6.0],[16.2,-6.1],[16.2,-11.2],[11.4,-11.2],[11.1,-17.3],[30.1,-17.6],[30.1,-25.0],[15.9,-24.8],[15.9,-30.9],[-0.2,-31.1],[-0.1,-24.8],[-5.8,-24.8],[-5.8,-8.6]]],[0,14,[[-5.9,37.8],[-5.6,12.8],[-22.4,13.0],[-22.2,37.6]]],[0,14,[[-5.9,-6.2],[-5.9,-31.0],[-22.3,-31.1],[-22.4,-6.2]]],[0,112,[[0.3,31.8],[0.4,37.7],[15.3,37.8],[15.2,33.5],[14.4,34.5],[7.7,34.3],[7.6,31.5],[14.0,31.3],[14.1,24.2],[11.2,24.1],[11.2,18.4],[15.9,18.3],[16.1,12.8],[8.1,12.9],[8.1,19.0],[-0.8,19.0],[-0.9,15.0],[-5.8,15.2],[-5.7,31.8]]],[0,121,[[8.1,19.0],[8.2,6.3],[10.7,6.1],[10.5,0.2],[8.1,0.1],[8.3,-12.6],[-1.1,-12.5],[-1.1,-6.3],[-0.1,-6.2],[0.0,12.2],[-0.8,12.1],[-0.8,19.0]]],[0,120,[[-0.9,12.7],[-0.8,12.1],[0.0,12.2],[-0.1,-6.2],[-9.3,-6.3],[-9.4,12.8]]],[0,69,[[21.5,18.4],[21.6,-11.4],[16.2,-11.2],[15.9,18.3]]],[0,119,[[16.1,12.8],[16.2,-6.1],[8.2,-6.0],[8.1,0.1],[10.5,0.2],[10.7,6.1],[8.2,6.3],[8.1,12.9]]],[0,117.5,[[14.4,34.5],[17.3,31.6],[25.6,31.6],[25.5,24.2],[14.1,24.2],[14.0,31.3],[7.6,31.5],[7.7,34.3]]],[0,84,[[35.0,-11.3],[34.9,-30.7],[29.9,-30.8],[30.1,-11.5]]],[0,84,[[35.1,37.8],[34.7,18.2],[30.0,18.3],[30.1,37.7]]],[0,115,[[10.9,-16.3],[10.7,-17.7],[13.5,-17.7],[13.2,-24.8],[2.0,-24.5],[2.1,-16.0]]],[0,109,[[21.6,-11.4],[21.5,-15.1],[30.1,-14.9],[30.1,-17.6],[11.1,-17.3],[11.4,-11.2]]],[0,109,[[-22.5,2.4],[-22.5,-5.8],[-32.7,-5.6],[-32.8,2.4]]],[0,109,[[30.1,24.2],[30.0,21.9],[21.4,21.9],[21.5,18.4],[11.2,18.4],[11.2,24.1]]],[0,112,[[-24.3,31.2],[-24.1,19.6],[-30.8,19.6],[-30.8,31.3]]],[0,63,[[41.4,33.7],[41.1,21.8],[34.8,21.9],[34.9,34.0]]],[0,63,[[41.2,-15.1],[41.1,-27.1],[34.9,-27.0],[35.0,-15.1]]],[69,74,[[21.6,9.2],[21.5,-3.3],[15.9,-3.4],[16.0,9.1]]],[0,109,[[21.6,37.8],[21.5,33.8],[30.1,33.9],[30.0,31.4],[17.3,31.6],[15.2,33.5],[15.3,37.8]]],[0,109,[[30.1,-25.0],[30.0,-27.2],[21.6,-27.2],[21.7,-30.8],[15.9,-30.9],[15.9,-24.8]]],[0,109,[[0.4,37.7],[0.3,31.8],[-5.7,31.8],[-5.9,37.8]]],[0,109,[[-0.1,-24.8],[-0.2,-31.1],[-5.9,-31.0],[-5.8,-24.8]]],[0,112,[[30.0,31.4],[30.1,24.2],[25.5,24.2],[25.6,31.6]]],[0,106,[[30.1,37.7],[30.1,33.9],[21.5,33.8],[21.6,37.8]]],[0,106,[[30.1,-11.5],[30.1,-14.9],[21.5,-15.1],[21.6,-11.4]]],[0,106,[[30.0,21.9],[30.0,18.3],[21.5,18.4],[21.4,21.9]]],[0,106,[[30.0,-27.2],[29.9,-30.8],[21.7,-30.8],[21.6,-27.2]]],[0,55,[[41.3,37.7],[41.4,33.7],[34.9,34.0],[35.1,37.8]]],[0,55,[[41.2,-11.4],[41.2,-15.1],[35.0,-15.1],[35.0,-11.3]]],[0,55,[[41.1,21.8],[41.0,18.1],[34.7,18.2],[34.8,21.9]]],[0,55,[[41.1,-27.1],[41.1,-30.8],[34.9,-30.7],[34.9,-27.0]]],[0,116,[[-0.9,15.0],[-0.9,12.7],[-5.6,12.8],[-5.8,15.2]]],[0,116,[[-1.1,-6.3],[-1.2,-8.5],[-5.8,-8.6],[-5.9,-6.2]]]],
  nyjapansoc:[[0,20,[[15.1,15.2],[15.1,-15.3],[-15.1,-15.2],[-15.1,15.3]]]],
  nylipstick:[[0,65,[[-9.5,25.5],[-7.5,27.5],[-5.6,29.0],[-3.1,30.0],[-0.8,30.4],[2.7,30.2],[4.9,29.0],[8.8,25.7],[11.8,21.2],[13.6,17.1],[14.9,12.9],[16.0,2.4],[16.1,-6.5],[15.3,-11.4],[13.3,-18.1],[9.4,-25.9],[7.3,-28.1],[2.6,-30.5],[0.5,-30.7],[-2.1,-30.4],[-4.3,-29.6],[-6.9,-27.6],[-11.5,-21.9],[-14.7,-13.8],[-15.9,-2.9],[-16.1,6.3],[-15.3,11.2],[-13.5,18.2],[-11.4,22.5]]],[65,95,[[-6.8,24.6],[-3.4,27.8],[0.7,29.0],[3.6,28.8],[7.9,26.2],[10.6,23.1],[11.8,21.2],[13.6,17.1],[14.9,12.9],[16.0,2.4],[16.1,-6.5],[15.3,-11.4],[13.3,-18.1],[11.5,-22.2],[9.7,-24.9],[7.8,-26.7],[3.8,-28.9],[2.1,-29.3],[-0.2,-28.9],[-2.1,-28.2],[-4.3,-26.4],[-8.5,-21.2],[-11.6,-13.3],[-13.0,-2.8],[-13.0,6.0],[-12.3,11.1],[-10.6,17.8],[-8.7,21.8]]],[95,130,[[-3.4,23.3],[-0.3,25.8],[2.9,26.9],[5.2,26.8],[10.6,23.1],[11.8,21.2],[13.6,17.1],[14.9,12.9],[16.0,2.4],[16.1,-6.5],[15.3,-11.4],[13.3,-18.1],[11.5,-22.2],[8.6,-25.4],[5.4,-27.1],[4.1,-27.3],[0.9,-26.3],[-2.8,-23.2],[-4.9,-20.3],[-7.7,-12.9],[-9.1,-3.0],[-9.1,5.9],[-8.4,10.3],[-6.5,17.0],[-5.0,20.7]]],[130,138,[[0.7,21.8],[2.8,22.4],[5.1,21.5],[7.9,17.7],[9.3,14.6],[10.3,11.2],[11.0,7.1],[11.5,-2.3],[10.5,-10.3],[8.7,-16.2],[7.4,-19.6],[5.2,-22.2],[4.4,-22.9],[3.2,-23.1],[0.9,-22.1],[-2.2,-18.4],[-4.7,-12.2],[-5.5,-7.8],[-5.8,-2.7],[-5.9,5.5],[-5.4,9.6],[-3.6,15.4],[-1.2,20.4]]]],
  nyolympic:[[0,185,[[21.8,22.1],[21.8,-3.1],[-31.6,-3.1],[-31.9,22.2]]],[185,190,[[15.5,16.4],[15.5,1.3],[-26.5,1.5],[-26.6,16.7]]],[0,13,[[26.6,20.3],[26.6,-3.4],[23.1,-3.5],[23.1,-38.9],[8.4,-39.1],[8.2,-12.1],[13.1,-12.2],[13.0,-3.0],[21.8,-3.1],[21.9,20.1]]],[0,90,[[13.0,-3.0],[13.1,-12.2],[-24.1,-12.2],[-24.1,-3.0]]],[0,10,[[-24.1,-3.0],[-24.1,-12.2],[-31.8,-12.2],[-31.6,-3.1]]]],
  nypershingsq:[[0,89,[[19.1,29.9],[19.1,-29.8],[-19.1,-29.8],[-19.3,-10.0],[-0.7,-10.0],[-0.6,9.9],[-19.4,10.0],[-19.3,29.8]]],[0,95.3,[[17.7,28.4],[17.7,-28.2],[-17.7,-28.3],[-17.8,-11.4],[1.0,-11.6],[0.8,11.4],[-18.0,11.5],[-17.8,28.4]]],[0,30,[[-0.6,9.9],[-0.7,-10.0],[-19.3,-10.0],[-19.4,10.0]]],[0,105,[[9.5,10.6],[9.6,12.8],[18.3,13.0],[18.4,-13.2],[9.6,-13.1],[9.5,-11.1],[6.7,-10.9],[6.8,10.8]]]],
  nyritztower:[[0,68,[[19.7,12.3],[19.8,-12.3],[-14.3,-12.3],[-14.1,12.1]]],[0,75,[[16.8,10.1],[16.9,-10.7],[-11.9,-10.8],[-12.0,10.4]]],[0,150,[[10.5,7.9],[10.4,-8.6],[-5.8,-8.4],[-5.8,8.1]]],[0,12,[[-14.1,12.1],[-14.3,-12.3],[-19.6,-12.2],[-19.7,12.4]]],[145,158,[[8.0,5.6],[7.8,-6.1],[-3.2,-5.9],[-3.2,5.5]]],[0,90,[[14.2,7.0],[14.4,-7.6],[12.2,-7.5],[12.2,7.0]]],[0,90,[[-7.5,7.0],[-7.6,-7.5],[-9.5,-7.5],[-9.5,7.0]]],[0,115,[[-5.7,7.2],[-5.8,-7.3],[-7.6,-7.5],[-7.5,7.0]]],[0,115,[[12.2,7.0],[12.2,-7.5],[10.5,-7.5],[10.5,7.1]]],[0,90,[[7.4,-8.3],[7.3,-9.4],[-2.6,-9.4],[-2.6,-8.5]]],[0,90,[[7.3,9.1],[7.4,8.2],[-2.6,8.1],[-2.7,8.9]]],[0,95,[[10.4,-8.6],[10.5,-7.5],[12.2,-7.5],[12.3,-9.7],[7.5,-9.9],[7.4,-8.3]]],[0,95,[[-5.8,-7.3],[-5.8,-8.4],[-2.6,-8.5],[-2.7,-9.6],[-7.7,-9.7],[-7.6,-7.5]]],[0,95,[[-2.6,9.2],[-2.6,8.1],[-5.8,8.1],[-5.7,7.2],[-7.5,7.0],[-7.6,9.4]]],[0,95,[[12.3,9.2],[12.2,7.0],[10.5,7.1],[10.5,7.9],[7.4,8.2],[7.5,9.3]]],[155,160,[[3.8,1.1],[3.8,-1.0],[1.0,-0.8],[1.0,1.2]]]],
  nyriverhouse:[[0,92.5,[[-5.9,30.1],[-5.6,23.6],[-1.8,23.5],[-1.7,25.2],[4.0,25.4],[4.1,23.9],[8.5,23.9],[8.3,30.5],[23.1,30.8],[23.1,9.5],[4.6,8.8],[5.1,-10.3],[23.2,-10.0],[24.1,-29.8],[5.1,-30.2],[5.0,-27.7],[3.9,-27.7],[3.9,-22.1],[0.5,-22.2],[0.5,-23.7],[-9.2,-24.0],[-9.0,-30.9],[-20.5,-31.5],[-21.3,-11.4],[-16.7,-11.2],[-17.2,10.1],[-19.3,10.0],[-19.7,21.8],[-21.8,21.7],[-22.1,29.8]]]],
  nysaks:[[0,62,[[30.8,28.3],[31.5,-28.8],[-28.9,-28.3],[-28.8,28.6]]],[0,66,[[30.8,26.8],[31.8,-27.3],[-27.2,-26.9],[-27.4,27.0]]]],
  nyshelton:[[0,65,[[10.2,14.2],[10.3,15.5],[21.0,15.7],[20.8,-23.2],[-22.6,-23.0],[-22.7,14.4]]],[0,105,[[2.6,8.4],[2.5,0.4],[-5.2,0.5],[-5.2,-9.3],[2.5,-9.3],[2.7,-19.7],[-19.9,-19.7],[-19.8,8.6]]],[0,50,[[10.3,37.1],[10.2,14.2],[-1.2,14.3],[-1.5,37.0]]],[0,118.4,[[-5.3,2.8],[-5.2,-14.9],[-15.7,-14.8],[-15.6,2.8]]]],
  nysuttontower:[[0,258,[[12.1,11.5],[12.2,-11.8],[-12.2,-11.2],[-12.3,11.5]]]],
  nytrumptower:[[0,25,[[-19.9,15.2],[-20.0,19.5],[12.2,19.6],[12.1,15.4],[16.0,15.2],[16.3,10.8],[20.3,10.9],[20.4,-4.5],[16.4,-4.6],[16.3,-10.0],[13.5,-9.9],[13.7,-15.7],[-23.8,-15.7],[-23.9,15.1]]],[0,30,[[-20.0,10.7],[-19.9,15.2],[-16.0,15.0],[-16.0,19.6],[12.2,19.6],[12.1,15.4],[16.0,15.2],[16.3,10.8],[20.3,10.9],[20.4,-4.5],[16.4,-4.6],[16.3,-10.0],[13.5,-9.9],[13.7,-15.7],[-23.8,-15.7],[-24.0,10.6]]],[0,35,[[-19.8,6.3],[-20.0,10.7],[-16.0,10.8],[-16.0,15.0],[-11.9,15.1],[-12.0,19.5],[12.2,19.6],[12.1,15.4],[16.0,15.2],[16.3,10.8],[20.3,10.9],[20.4,-4.5],[16.4,-4.6],[16.3,-10.0],[13.5,-9.9],[13.7,-15.7],[-23.8,-15.7],[-23.9,6.2]]],[0,40,[[-20.0,1.8],[-19.8,6.3],[-15.8,6.3],[-16.0,10.8],[-12.0,10.9],[-11.9,15.1],[-7.9,15.1],[-8.0,19.5],[12.2,19.6],[12.1,15.4],[16.0,15.2],[16.3,10.8],[20.3,10.9],[20.4,-4.5],[16.4,-4.6],[16.3,-10.0],[13.5,-9.9],[13.7,-15.7],[-23.8,-15.7],[-23.9,2.0]]],[0,45,[[-19.8,-2.5],[-20.0,1.8],[-16.0,1.9],[-15.8,6.3],[-11.9,6.2],[-12.0,10.9],[-8.1,10.7],[-7.9,15.1],[-3.9,15.2],[-4.0,19.6],[12.2,19.6],[12.1,15.4],[16.0,15.2],[16.3,10.8],[20.3,10.9],[20.4,-4.5],[16.4,-4.6],[16.3,-10.0],[13.5,-9.9],[13.7,-15.7],[-23.8,-15.7],[-23.9,-2.6]]],[0,202,[[-19.9,-6.8],[-19.8,-2.5],[-15.8,-2.4],[-16.0,1.9],[-11.9,2.0],[-11.9,6.2],[-7.8,6.3],[-8.1,10.7],[-4.0,10.8],[-3.9,15.2],[0.1,15.1],[0.0,19.7],[12.2,19.6],[12.1,15.4],[16.0,15.2],[16.3,10.8],[20.3,10.9],[20.4,-4.5],[16.4,-4.6],[16.3,-10.0],[13.5,-9.9],[13.7,-15.7],[-23.8,-15.7],[-23.9,-6.9]]]],
  nytrumpworld:[[0,261.9,[[10.4,22.6],[10.2,-22.6],[-14.3,-22.4],[-14.2,22.7]]],[0,3,[[16.6,12.8],[16.6,-12.8],[11.8,-12.6],[12.0,12.8]]],[8,9,[[13.4,12.6],[13.2,-12.6],[10.3,-12.7],[10.3,12.9]]],[0,3,[[12.0,12.8],[11.8,-12.6],[10.3,-12.7],[10.3,12.9]]]],
  nyunplaza:[[0,153.9,[[22.3,15.7],[27.2,10.2],[27.2,-3.5],[1.6,-3.3],[-9.8,-15.7],[-27.1,-15.6],[-27.6,15.7]]],[0,15,[[-5.8,-11.6],[27.1,-12.0],[26.8,-16.0],[-9.8,-15.7]]],[0,115,[[1.6,-3.3],[27.2,-3.5],[27.2,-8.0],[-2.4,-7.8]]],[0,50,[[-2.4,-7.8],[27.2,-8.0],[27.1,-12.0],[-5.8,-11.6]]],[45,153.9,[[27.3,15.6],[27.2,10.2],[22.3,15.7]]]],
  nyunplaza_b:[[0,153.9,[[2.3,23.6],[13.8,12.3],[14.5,-20.2],[-2.7,-20.6],[-3.5,30.1]]],[0,115,[[-3.5,30.1],[-2.7,-20.6],[-12.5,-20.7],[-12.4,30.0]]],[0,50,[[14.5,-20.2],[14.5,-24.4],[-12.4,-24.7],[-12.5,-20.7]]]],
};
const PL = {ny100unplaza:[40.7531919, -73.9677792, -0.5005], ny245park:[40.7546124, -73.9746719, -0.5000], ny277park:[40.7552338, -73.9741981, -0.5000], ny299park:[40.7560249, -73.9741820, -0.5042], ny345park:[40.7577503, -73.9722980, -0.5000], ny383madison:[40.7554703, -73.9767305, -0.4959], ny399park:[40.7590376, -73.9714952, -0.5000], ny425park:[40.7604368, -73.9710454, -0.4975], ny599lex:[40.7578316, -73.9707100, -0.5000], ny712fifth:[40.7622971, -73.9750772, -0.5240], ny919third:[40.7589158, -73.9674960, -0.5034], nybeekmantower:[40.7533339, -73.9660832, -0.5080], nybloomingdales:[40.7622089, -73.9671765, -0.5063], nycitylex:[40.7572029, -73.9691783, -0.5035], nycrownbldg:[40.7628536, -73.9747075, -0.5000], nygraybar:[40.7526978, -73.9758515, -0.5054], nyjapansoc:[40.7525572, -73.9682466, -0.5061], nylipstick:[40.7578919, -73.9688649, -0.5000], nyolympic:[40.7592034, -73.9760757, -0.5071], nypershingsq:[40.7515871, -73.9775033, -0.5061], nyritztower:[40.7616472, -73.9701648, -0.5060], nyriverhouse:[40.7546490, -73.9631365, -0.4720], nysaks:[40.7580207, -73.9769532, -0.5000], nyshelton:[40.7554636, -73.9726490, -0.5080], nysuttontower:[40.7582810, -73.9612830, -0.5131], nytrumptower:[40.7623447, -73.9738897, -0.5000], nytrumpworld:[40.7525425, -73.9676887, -0.5112], nyunplaza:[40.7504966, -73.9692028, -0.5013], nyunplaza_b:[40.7508483, -73.9696308, -0.4945]};

// ---- ny50a helpers -----------------------------------------------------------------------------------------------------
const bbox = P => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of P){ x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } return [x0, x1, z0, z1]; };
const cent = P => { let cx = 0, cz = 0; for (const p of P){ cx += p[0]/P.length; cz += p[1]/P.length; } return [cx, cz]; };
// ellipse (polygon with n facets) centre cx, cz, semi-axes ax (x), az (z)
const ellP = (cx, cz, ax, az, n) => { const P = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU; P.push([cx + Math.cos(t)*ax, cz + Math.sin(t)*az]); } return P; };
// scale a polygon about its centroid by s (or sx, sz)
const scaleP = (P, sx, sz) => { const [cx, cz] = cent(P); sz = sz === undefined ? sx : sz; return P.map(([x, z]) => [cx + (x - cx)*sx, cz + (z - cz)*sz]); };
// curtain wall over setback tiers: glass walls (lit-window shader), vertical mullions centred in bays of sp, a floor band every fh
// S: {G glass, M mullion, R roof, C coping, sp, mw, fh, bh band height (0 none), SB band colour, gh lobby height, LB lobby glass,
//     ch coping height, fy foundation, noBand(i)}
function curtain(B, parts, S){
  for (let i = 0; i < parts.length; i++){
    const [b0, t0, P] = parts[i], ed = visEdges(parts, i), y0 = b0 > 0.1 ? b0 : (S.fy || -6), ch = S.ch === undefined ? 1.0 : S.ch;
    wallsP(B.p(b0 <= 0.1 && S.LB ? S.G : S.G), P, y0, t0, ed); flatP(B.p(S.R), P, t0 - 0.02);
    if (ch > 0) bandP(B.p(S.C || S.M), P, t0 - ch, ch + 0.15, S.co || 0.12, ed);
    const ya = Math.max(b0 + 0.2, b0 <= 0.1 ? (S.gh || 0) : 0), yb = t0 - ch;
    if (S.mw && yb - ya > 2) stripsP(B.p(S.M), P, ya, yb, S.sp, S.mw, 0.06, ed, S.minL || 1.2);
    if (S.bh && !(S.noBand && S.noBand(i))) for (let y = Math.ceil((ya + 0.5)/S.fh)*S.fh; y < yb - 0.3; y += S.fh) bandP(B.p(S.SB || S.M), P, y - S.bh, S.bh, 0.05, ed);
    if (b0 <= 0.1 && S.LB && S.gh) bandP(B.p(S.LB), P, 0.0, S.gh, 0.03, ed);
  }
}
// rectangle-based loft between two rectangles [x0, x1, z0, z1] at y0 / y1 (sloped faces), with an optional diagrid on the
// faces whose edge moves (members of radius r, n panels per face)
function rectLoft(B, A, Bq, y0, y1, col, dg, r, n){
  const ca = [[A[0], A[2]], [A[1], A[2]], [A[1], A[3]], [A[0], A[3]]], cb = [[Bq[0], Bq[2]], [Bq[1], Bq[2]], [Bq[1], Bq[3]], [Bq[0], Bq[3]]];
  const o = B.p(col);
  for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; quadP(o, [ca[i][0], y0, ca[i][1]], [ca[j][0], y0, ca[j][1]], [cb[j][0], y1, cb[j][1]], [cb[i][0], y1, cb[i][1]]);
    if (!dg) continue; const mv = Math.hypot(ca[i][0] - cb[i][0], ca[i][1] - cb[i][1]) + Math.hypot(ca[j][0] - cb[j][0], ca[j][1] - cb[j][1]); if (mv < 1.0) continue;
    const d = B.p(dg);
    for (let k = 0; k <= n; k++){ const t = k/n, tb = (k + 0.5)/n;
      const p0 = [lerp(ca[i][0], ca[j][0], t), y0, lerp(ca[i][1], ca[j][1], t)];
      if (k < n){ const p1 = [lerp(cb[i][0], cb[j][0], tb), y1, lerp(cb[i][1], cb[j][1], tb)]; const p2 = [lerp(ca[i][0], ca[j][0], (k + 1)/n), y0, lerp(ca[i][1], ca[j][1], (k + 1)/n)];
        segP(d, p0, p1, r, 4); segP(d, p1, p2, r, 4); }
    }
    segP(d, [ca[i][0], y0, ca[i][1]], [ca[j][0], y0, ca[j][1]], r*1.4, 4); segP(d, [cb[i][0], y1, cb[i][1]], [cb[j][0], y1, cb[j][1]], r*1.4, 4);
  }
}
// small low-poly flag-free tree for terraces
const TLEAF = {c:'#4f7a3e', m:0, lc:'#ffe6b0', lk:0.3}, TTRUNK = {c:'#5a4836', m:0};
// a band of facade "glow" for a lit lobby
const LOBBY = {c:'#3c4248', glow:'#ffe2b0', gk:0.6};
// stone cornice/balustrade on the visible edges of a part's top
function balP(B, P, y, h, col, ed){ bandP(B.p(col), P, y, 0.25, 0.25, ed); for (let i = 0; i < P.length; i++){ if (ed && !ed(i)) continue; const f = edgeF(P, i); if (f.L < 1) continue;
  const n = Math.max(1, Math.round(f.L/0.9)); for (let k = 0; k <= n; k++){ const p = f.at(f.L*k/n, y + 0.25, -0.1); boxP(B.p(col), 0.22, h - 0.4, 0.22, p[0], p[1], p[2], 0); }
  const a = f.at(0, 0, -0.1), b = f.at(f.L, 0, -0.1); abox(B.p(col), Math.min(a[0], b[0]) - 0.15, Math.max(a[0], b[0]) + 0.15, y + h - 0.2, y + h, Math.min(a[2], b[2]) - 0.15, Math.max(a[2], b[2]) + 0.15); } }
const place = (key, rot) => { const p = PL[key]; SG_PLACES.push({type:key, lat:p[0], lon:p[1], rot:rot === undefined ? p[2] : rot}); };

// =====================================================================================================================
// ★ 425 Park Avenue (Foster + Partners, completed 2022), Park Avenue between 55th and 56th Streets (east side). 262.1 m roof
// (enwiki infobox), 47 storeys (Foster + Partners). Three distinct volumes (Foster + Partners): a seven-storey base at street level
// (the OSM part 0-45 m), a recessed central section (55-110 m) and a slender top section (120-219 m); the zoning setbacks are
// marked by sloping diagrid faces (Architect's Newspaper: "each sloping diagrid on the facade sits on a setback") — modelled on
// the OSM building parts, where each upper volume springs from a narrower neck (45 / 110 m) and flares out to its full length on
// the north and south faces. The core sits at the rear (east), clad in corrugated aluminium; three shear walls extend from the top
// as "three blades" (the three OSM parts at 262.2 m; their neighbours step down at 242 / 219 / 110 / 45 m). Blue glass panels,
// light grey frames, stainless-steel columns outboard of the floor plates and bullnose floor edges; six jumbo columns at the
// Park Avenue front (enwiki). Night: lit offices, glazed east lift lobbies, the blades washed in cool white.
LANDMARKS.ny425park = {zh:'公园大道425号', en:'425 Park Avenue', cat:'new', r:41, h:262,
  lt:{m:1, c:'#dfe9ff', k:0.75, e:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const G = {c:'#5a7790', m:1, fh:4.5, cw:1.52, lc:'#dfe9ff', lk:0.5}, M = {c:'#c3c8cc', m:0, lk:0.15}, SS = {c:'#d3d6d6', m:0, lk:0.25};
  const R = {c:'#6f7378', m:0, lk:0.05}, AL = {c:'#9aa1a7', m:0, lc:'#e8f0ff', lk:0.55}, BL = {c:'#a9b0b6', m:0, lc:'#eef4ff', lk:0.9};
  const LG = {c:'#6c8296', m:1, fh:4.5, cw:2.2, lc:'#ffe8c4', lk:0.6}, DG = {c:'#c9ced2', m:0, lk:0.2};
  const D = PD.ny425park;
  // the volumes (rectangles from the parts, x = Park Avenue (west) .. the core line x = 9.2)
  const XC = 9.2, V1 = [-17.5, XC, -28.6, 27.2], N1 = [-13.4, XC, -20.0, 18.6], V2 = [-13.5, XC, -24.2, 23.0], N2 = [-9.1, XC, -14.1, 13.3], V3 = [-9.0, XC, -19.8, 18.7];
  const vol = (Rc, y0, y1, fh, lob) => { const P = rectP(Rc[0], Rc[1], Rc[2], Rc[3]), ed = i => i !== 1;   // the east edge meets the core
    curtain(B, [[y0 <= 0 ? 0 : y0, y1, P]], {G, M, R, C:SS, SB:SS, sp:1.52, mw:0.14, fh, bh:0.32, ch:0.9, gh:lob || 0, LB:lob ? LOBBY : null, fy:-6});
    void ed; };
  vol(V1, 0, 45, 6.4, 15.5);
  rectLoft(B, N1, V2, 45, 55, G, DG, 0.22, 6); flatP(B.p(R), rectP(V1[0], V1[1], V1[2], V1[3]), 45.03);
  vol(V2, 55, 110, 4.4);
  rectLoft(B, N2, V3, 110, 120, G, DG, 0.2, 4); flatP(B.p(R), rectP(V2[0], V2[1], V2[2], V2[3]), 110.03);
  vol(V3, 120, 219, 4.4);
  // the necks (inner glazing behind the flaring diagrid faces)
  wallsP(B.p(G), rectP(N1[0], N1[1], N1[2], N1[3]), 45, 55); wallsP(B.p(G), rectP(N2[0], N2[1], N2[2], N2[3]), 110, 120);
  // stainless columns outboard of the floor plates: Park Avenue front (six jumbo columns over the lobby) and the volumes' faces
  for (let k = 0; k < 6; k++){ const z = lerp(-25.5, 24.5, k/5); boxP(B.p(SS), 1.3, 51, 1.3, -18.9, -5, z, 0); }
  for (const [Rc, y0, y1] of [[V2, 55, 110], [V3, 120, 219]]) for (let k = 0; k < 4; k++){ const z = lerp(Rc[2] + 3, Rc[3] - 3, k/3); boxP(B.p(SS), 0.8, y1 - y0 - 0.5, 0.8, Rc[0] - 0.45, y0, z, 0); }
  // the rear core pieces (x 9.2 .. 19.9): corrugated aluminium, heights from the OSM parts; the three blades proud and paler
  for (const [b0, t0, P] of D){ const [x0, x1, z0, z1] = bbox(P); if (x0 < 8.5) continue;
    const blade = t0 > 260, col = blade ? BL : AL, ex = blade ? 0.4 : 0;
    abox(B.p(col), x0, x1 + ex, -6, t0, z0, z1);
    if (!blade && t0 > 100){ // corrugation: vertical ribs on the east face
      const n = Math.max(1, Math.round((z1 - z0)/0.9)); for (let k = 0; k <= n; k++) abox(B.p(AL), x1, x1 + 0.12, 0.5, t0 - 0.5, lerp(z0, z1, k/n) - 0.06, lerp(z0, z1, k/n) + 0.06); }
  }
  // glazed lift lobbies on the east elevation between the blades
  for (const [z0, z1] of [[-8.0, -1.8], [0.9, 6.9]]) for (let y = 8; y < 214; y += 4.4) abox(B.p(LG), 19.95, 20.1, y, y + 2.6, z0 + 0.3, z1 - 0.3);
  // the triple-height lobby glass and a canopy over the Park Avenue doors
  abox(B.p(SS), -19.6, -17.5, 6.0, 6.5, -6, 6);
  B.flush(g); return g; }};
place('ny425park');

// =====================================================================================================================
// ★ Lipstick Building (885 Third Avenue; Philip Johnson & John Burgee, 1986), east side of Third Avenue between 53rd and 54th.
// 138 m roof, 34 storeys (enwiki). A nearly elliptical, faceted tower (180 / 164 / 156 sides) with setbacks above the 19th and
// 27th storeys; the lifts are on the east (rear) side so the tower steps back toward Third Avenue — the OSM parts (65 / 95 / 130 /
// 138 m) keep the east line and pull the west front in. Facade: repeating stripes of polished and flame-finished red Swedish
// Imperial granite spandrels with stainless-steel belts and ribbon windows of solar glass in grey frames. It stands on 28
// double-height (8.5 m) stainless-steel and granite columns in front of a glass-walled lobby / arcade that wraps 300 degrees of
// the perimeter; a two-storey granite-clad elliptical mechanical floor sits on the roof (enwiki). Ellipses fitted to the OSM
// parts in the grid frame. Night: ribbon windows lit, the granite warmly washed.
LANDMARKS.nylipstick = {zh:'口红大厦', en:'Lipstick Building', cat:'new', r:35, h:138,
  lt:{m:1, c:'#ffd9c2', k:0.7, e:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const GR1 = {c:'#8a4a3e', m:0, lc:'#ffd2b8', lk:0.35}, GR2 = {c:'#a35a4a', m:0, lc:'#ffd2b8', lk:0.35}, ST = {c:'#c9cdd0', m:0, lk:0.3};
  const GL = {c:'#5b6670', m:1, fh:4.06, cw:0.8, lc:'#ffe3c8', lk:0.4}, FR = {c:'#8d949a', m:0}, R = {c:'#6e6862', m:0, lk:0.05};
  const LOB = {c:'#46505a', glow:'#ffe2b8', gk:0.55};
  const N = 96, T = [[0, 65, 0.0, -0.2, 16.1, 30.5], [65, 95, 1.55, -0.2, 14.55, 29.15], [95, 130, 3.5, -0.2, 12.6, 27.1]];
  const top = [130, 138, 2.8, -0.35, 8.7, 22.75];
  const FL = 8.5, fh = 4.0;   // storey stripes above the double-height base (34 storeys in 138 m)
  for (const [y0, y1, cx, cz, ax, az] of T){
    const yb = y0 === 0 ? FL : y0, P = ellP(cx, cz, ax, az, N);
    wallsP(B.p(GL), P, yb, y1); flatP(B.p(R), P, y1 - 0.02);
    // granite spandrel stripes (alternating finishes) + stainless belts; the ribbon window shows between them
    let k = 0;
    for (let y = yb; y < y1 - 0.5; y += fh, k++){ const P2 = ellP(cx, cz, ax + 0.12, az + 0.12, N);
      wallsP(B.p(k & 1 ? GR1 : GR2), P2, y, Math.min(y1, y + fh*0.46));
      wallsP(B.p(ST), ellP(cx, cz, ax + 0.16, az + 0.16, N), y + fh*0.46, y + fh*0.46 + 0.14);
      if (y + fh*0.46 + 0.2 < y1) for (let i = 0; i < N; i += 2){ const p = P2[i]; const q = [cx + (p[0] - cx)*1.0, cz + (p[1] - cz)*1.0]; abox(B.p(FR), q[0] - 0.05, q[0] + 0.05, y + fh*0.46, Math.min(y1, y + fh) , q[1] - 0.05, q[1] + 0.05); }
    }
    // parapet / coping
    wallsP(B.p(GR2), ellP(cx, cz, ax + 0.2, az + 0.2, N), y1 - 0.9, y1 + 0.4); flatP(B.p(GR1), ellP(cx, cz, ax + 0.2, az + 0.2, N), y1 + 0.4);
  }
  // two-storey granite-clad elliptical mechanical floor on the roof
  { const [y0, y1, cx, cz, ax, az] = top, P = ellP(cx, cz, ax, az, 64); wallsP(B.p(GR1), P, y0, y1); flatP(B.p(R), P, y1); bandP(B.p(ST), P, y1 - 0.5, 0.5, 0.1); }
  // base: the floor slab over the arcade, the glass lobby set back ~3 m, and 28 double-height columns on the ellipse
  { const [, , cx, cz, ax, az] = T[0]; const P = ellP(cx, cz, ax, az, N), Pi = ellP(cx + 0.6, cz, ax - 3.4, az - 3.4, 64);
    flatP(B.p(R), P, FL - 0.02); wallsP(B.p(GR2), P, FL - 0.9, FL);
    wallsP(B.p(LOB), Pi, -5, FL - 0.9); flatP(B.p(R), Pi, -0.05);
    // the arcade wraps ~300 degrees: the columns skip the east (rear) 60 degrees
    for (let i = 0; i < 28; i++){ const t = (30 + 300*(i + 0.5)/28)*PI/180 + 0, x = cx + Math.cos(t)*(ax - 0.6), z = cz + Math.sin(t)*(az - 0.6);
      cylP(B.p(ST), x, z, 0.5, 0.5, -3, FL - 0.9, 8, false); for (const yy of [2.6, 5.4]) cylP(B.p(GR1), x, z, 0.56, 0.56, yy, yy + 1.4, 8, false); }
    // closed rear (east) wall behind the core
    wallsP(B.p(GR1), ellP(cx, cz, ax - 0.3, az - 0.3, N), -5, FL - 0.9, i => { const t = (i + 0.5)/N*TAU; return Math.cos(t) > 0.86; }); }
  B.flush(g); return g; }};
place('nylipstick');

// =====================================================================================================================
// ★ Trump World Tower (845 United Nations Plaza; Costas Kondylis, 2001), First Avenue between 47th and 48th Streets. 262.4 m
// roof, top floor 230.4 m, 72 storeys (enwiki). A sheer rectangular slab, 23 x 44 m in plan (enwiki; OSM part 24.7 x 45.3 m), dark
// bronze-tinted glass curtain walls with no setbacks, a flat top; the glass runs on past the top floor to the roof as a screen.
// The entrance canopy is on First Avenue (OSM parts 0-3 / 8-9 m on the east side). Night: lit apartments, the unlit glass crown
// edged by its lit top.
LANDMARKS.nytrumpworld = {zh:'特朗普世界大厦', en:'Trump World Tower', cat:'new', r:31, h:262,
  lt:{m:1, c:'#ffe6c8', k:0.6, e:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const G = {c:'#3d3328', m:1, fh:3.2, cw:1.5, lc:'#ffe6c8', lk:0.45}, GT = {c:'#41372c', m:0, lc:'#ffe6c8', lk:0.5};
  const M = {c:'#2b241e', m:0}, SB = {c:'#4c4136', m:0, lk:0.05}, R = {c:'#5b5650', m:0, lk:0.05}, CAN = {c:'#2c2b2a', m:0, lc:'#ffe2b0', lk:0.6};
  const S = PD.nytrumpworld[0][2], [x0, x1, z0, z1] = bbox(S), P = rectP(x0, x1, z0, z1);
  wallsP(B.p(G), P, -6, 230.4); wallsP(B.p(GT), P, 230.4, 262.4); flatP(B.p(R), P, 261.6);
  stripsP(B.p(M), P, 6.5, 262, 1.52, 0.1, 0.05, null, 1);
  for (let y = 9.6; y < 230; y += 3.2) bandP(B.p(SB), P, y - 0.35, 0.35, 0.04);
  bandP(B.p(M), P, 261.4, 1.1, 0.08);
  // glazed lobby and the First Avenue canopy (OSM parts)
  bandP(B.p(LOBBY), P, 0, 6.2, 0.04);
  abox(B.p(CAN), x1, 16.6, 8.0, 9.0, -12.7, 12.8); abox(B.p(CAN), x1, 16.6, 0, 3.0, -12.7, 12.8);
  for (const z of [-12, -4, 4, 12]) abox(B.p(M), 16.0, 16.4, 0, 8, z - 0.2, z + 0.2);
  B.flush(g); return g; }};
place('nytrumpworld');

// =====================================================================================================================
// ★ 383 Madison Avenue (former Bear Stearns HQ; David Childs / SOM, 2001), Madison Avenue between 46th and 47th Streets. 230.1 m
// roof, 47 storeys (enwiki). An octagonal tower rising out of a rectangular base: the lowest nine storeys cover the whole site
// (65 x 61 m), the 10th-11th storeys are rectangular, at the 12th the building becomes an octagon (52 x 56 m), it sets back again
// at the 18th storey and rises straight to a 21 m glass crown of 9-21 m tall panels of laminated "crinkled glass", illuminated at
// night (enwiki). Granite with glass panels; tiers from the OSM parts (45 / 55 / 80 / 90 / 205 / 230 m).
LANDMARKS.ny383madison = {zh:'麦迪逊大道383号', en:'383 Madison Avenue', cat:'new', r:49, h:230,
  lt:{m:1, c:'#fff4dc', k:0.8, e:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const W = {c:'#8f8a83', m:0, lk:0.12}, SP = {c:'#6f6c68', m:1, fh:4.3, cw:1.52}, GL = {c:'#46525c', m:1, fh:4.3, cw:1.52, lc:'#fff1d8', lk:0.4};
  const R = {c:'#6a6764', m:0, lk:0.05}, C = {c:'#a8a39b', m:0, lk:0.15};
  const CG = {c:'#b9c9d3', m:0, glow:'#fff3d6', gk:0.85}, CF = {c:'#d9e3e8', m:0, glow:'#fff7e6', gk:1.0};
  const D = PD.ny383madison;
  const body = D.filter(p => p[1] <= 205 && !(p[0] >= 205));
  tiers(B, body.map(p => [p[0], p[1], p[2]]), {W, SP, GL, R, C, SH:SHOPG, sp:1.55, ww:1.05, fh:4.3, wh:2.6, gh:6, top:1.2, minL:1.5, co:0.15, ch:0.7,
    bands:[[-6, 6.2, 0.1, {c:'#4a4744', m:0, lk:0.1}]]});
  // the glass crown: an octagonal glass drum (205-230) wrapped by staggered panels, 9-21 m tall, on each face
  const OC = D.find(p => p[0] === 205 && p[1] === 230)[2];
  wallsP(B.p(CG), OC, 205, 229.4); flatP(B.p(R), OC, 229.4);
  for (let i = 0; i < OC.length; i++){ const f = edgeF(OC, i); const n = 5, hs = [9, 15, 21, 15, 9];
    for (let k = 0; k < n; k++){ const s0 = f.L*k/n + 0.15, s1 = f.L*(k + 1)/n - 0.15, a = f.at(s0, 205, 0.5), b = f.at(s1, 205, 0.5);
      quadP(B.p(CF), a, b, [b[0], 205 + hs[k], b[2]], [a[0], 205 + hs[k], a[2]]); } }
  for (const p of D.filter(p => p[0] === 205 && p[1] === 215)) { wallsP(B.p(CG), p[2], 205, 215); flatP(B.p(C), p[2], 215); }
  B.flush(g); return g; }};
place('ny383madison');
}
