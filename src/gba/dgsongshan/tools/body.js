// ---------------- geometry helpers (triangle batches: one LTris call per colour spec) ----------------
const PI = Math.PI, TAU = PI*2;
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const q4 = (o, a, b, c, d) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]);
const t3 = (o, a, b, c) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
const lerp = (a, b, t) => a + (b - a)*t;
const area2 = P => { let s = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; };
const triang = P => THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
function flat(o, P, y){ for (const t of triang(P)){ const a = P[t[0]], b = P[t[1]], c = P[t[2]]; o.push(a[0], y, a[1], b[0], y, b[1], c[0], y, c[1]); } }
function prism(o, P, y0, y1, top){ for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; q4(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } if (top !== false) flat(o, P, y1); }
const edgeN = (P, i) => { const s = area2(P) > 0 ? 1 : -1, a = P[i], b = P[(i + 1) % P.length], ex = b[0] - a[0], ez = b[1] - a[1], l = Math.hypot(ex, ez) || 1; return [ez/l*s, -ex/l*s, ex/l, ez/l, l]; };
function offP(P, d){ // inward offset by d (negative = outward), mitre clamped
  const n = P.length, L = []; for (let i = 0; i < n; i++){ const [nx, nz, ux, uz] = edgeN(P, i), a = P[i]; L.push([a[0] - nx*d, a[1] - nz*d, ux, uz]); }
  const out = []; for (let i = 0; i < n; i++){ const p = L[(i + n - 1) % n], q = L[i], den = p[2]*q[3] - p[3]*q[2];
    if (Math.abs(den) < 1e-6){ out.push([q[0], q[1]]); continue; }
    const t = ((q[0] - p[0])*q[3] - (q[1] - p[1])*q[2])/den; let x = p[0] + p[2]*t, z = p[1] + p[3]*t; const ox = P[i][0], oz = P[i][1], dd = Math.hypot(x - ox, z - oz), mx = Math.abs(d)*3;
    if (dd > mx){ x = ox + (x - ox)/dd*mx; z = oz + (z - oz)/dd*mx; } out.push([x, z]); }
  return out; }
const cenP = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
const bbP = P => { const b = [1e9, 1e9, -1e9, -1e9]; for (const p of P){ b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); } return b; };
const pip = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
function oframe(P){ // oriented frame from the longest edge
  let best = 0, ang = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > best){ best = l; ang = Math.atan2(b[1] - a[1], b[0] - a[0]); } }
  const ux = Math.cos(ang), uz = Math.sin(ang); let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  for (const p of P){ const u = p[0]*ux + p[1]*uz, v = -p[0]*uz + p[1]*ux; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  const uc = (u0 + u1)/2, vc = (v0 + v1)/2; return {c:[uc*ux - vc*uz, uc*uz + vc*ux], ux, uz, L:u1 - u0, W:v1 - v0}; }
const fP = (f, u, v, y) => [f.c[0] + u*f.ux - v*f.uz, y, f.c[1] + u*f.uz + v*f.ux];
function hipF(o, f, y, h, ov){ const hl = f.L/2 + ov, hw = f.W/2 + ov, r = Math.max(0, hl - hw);
  const a = fP(f, -hl, -hw, y), b = fP(f, hl, -hw, y), c = fP(f, hl, hw, y), d = fP(f, -hl, hw, y), e = fP(f, -r, 0, y + h), e2 = fP(f, r, 0, y + h);
  q4(o, a, b, e2, e); q4(o, c, d, e, e2); t3(o, b, c, e2); t3(o, d, a, e); }
function gableF(o, oW, f, y, h, ov){ const hl = f.L/2 + ov, hw = f.W/2 + ov;
  q4(o, fP(f, -hl, -hw, y), fP(f, hl, -hw, y), fP(f, hl, 0, y + h), fP(f, -hl, 0, y + h)); q4(o, fP(f, -hl, hw, y), fP(f, -hl, 0, y + h), fP(f, hl, 0, y + h), fP(f, hl, hw, y));
  const W = f.W/2; for (const s of [-1, 1]){ const u = s*f.L/2; t3(oW, fP(f, u, -W, y), fP(f, u, 0, y + h), fP(f, u, W, y)); } }
// the footprint, if it is roughly rectangular, is replaced by its frame for roofs; otherwise flat roof
const rectish = (P, f) => Math.abs(area2(P)) > 0.82*f.L*f.W;
function gyR(ctx, R){ let lo = 1e9, hi = -1e9; for (const p of R){ const y = ctx.gy(p[0], p[1]); lo = Math.min(lo, y); hi = Math.max(hi, y); } const c = cenP(R), yc = ctx.gy(c[0], c[1]); return [Math.min(lo, yc), Math.max(hi, yc)]; }
function treesIn(ctx, keep, blds, n, size, kind){ const b = bbP(keep); let k = 0, tries = 0;
  while (k < n && tries < n*10){ tries++; const x = lerp(b[0], b[2], ctx.rng()), z = lerp(b[1], b[3], ctx.rng()); if (!pip(keep, x, z)) continue;
    let ok = true; for (const B of blds){ const bb = B.bb; if (x > bb[0] - 6 && x < bb[2] + 6 && z > bb[1] - 6 && z < bb[3] + 6){ ok = false; break; } }
    if (ok){ ctx.tree(x, z, size*(0.8 + 0.4*ctx.rng()), kind); k++; } } }
function lampsRound(ctx, R, y, st, rgb){ for (let i = 0; i < R.length; i++){ const [nx, nz, ux, uz, l] = edgeN(R, i), a = R[i]; for (let s = st/2; s < l; s += st) ctx.lamp(a[0] + ux*s + nx*2.5, y, a[1] + uz*s + nz*2.5, rgb); } }
const pl = (k, s) => s.slice ? s[k % s.length] : s;
const RED = {c:'#a81010', glow:'#ff2a14', gk:2.4};

// ================= ★ Huawei Ox Horn Campus (Xiliubeipo Village), Songshan Lake =================
// Facts (targets.json notes): opened April 2019 on the south shore of Songshan Lake; twelve groups of buildings in European town
// styles linked by a red mountain-railway style tram. Every building here stands on its OSM footprint at this build's height
// (OSM heights are mostly estimates in Dongguan). The style (stucco walls in light European colours, terracotta or slate hipped
// roofs, stone base course, small corner towers on the big blocks) is an approximation, not surveyed building by building.
// Footprints: the campus clusters of ref_dgsongshan (OSM area w1112670101); keep = their hull grown by 8 m. No logos or text.
// Tram: the build has no OSM track for it; only its four mapped stops (OSM tram_stop) are marked with small red-roofed shelters.
function oxBuild(ctx){
  const g = new THREE.Group(), B = mkB(), S = D.dgoxhorn;
  const WALL = ['#e9dcc3', '#e3c9a0', '#efe6d6', '#d9c2a7', '#ead2c2', '#d8d3c6', '#f0e9dc', '#cdb48e'].map(c => ({c, m:1, fh:3.6, cw:3.4}));
  const BASE = {c:'#b9ad98', m:0, lk:0.35}, TERRA = '#a1543a', SLATE = '#59606a', TRIM = '#f4f0e6', GLASS = {c:'#3d4650', glow:'#ffe2b0', gk:0.45};
  const bl = S.b.map(b => ({R:b.r, h:b.h, bb:bbP(b.r)}));
  S.b.forEach((b, i) => {
    const R = b.r, [lo, hi] = gyR(ctx, R), f = oframe(R), H = Math.max(6, b.h), slate = (R[0][0] + R[0][1]*0.3) > 120;
    const rise = Math.min(f.W*0.3, H*0.32, 7), eave = hi + Math.max(4, H - (rectish(R, f) ? rise : 0));
    prism(B.p(BASE), R, lo - 1.5, hi + 1.2, false);
    prism(B.p(WALL[i % WALL.length]), R, hi + 1.2, eave, false);
    prism(B.p(TRIM), offP(R, -0.25), eave - 0.6, eave, false);                       // cornice
    const IN = offP(R, 1.2); if (area2(IN)*area2(R) > 0) prism(B.p(GLASS), IN, hi + 0.2, hi + 1.2, false);
    if (rectish(R, f)) hipF(B.p(slate ? SLATE : TERRA), f, eave, rise, 0.8); else { flat(B.p(slate ? SLATE : TERRA), R, eave); prism(B.p(TRIM), R, eave, eave + 1.0, false); }
    if (Math.abs(area2(R)) > 2500){ // a small square tower at the footprint vertex farthest from the frame centre (approximation)
      let best = R[0], bd = 0; for (const p of R){ const d = Math.hypot(p[0] - f.c[0], p[1] - f.c[1]); if (d > bd){ bd = d; best = p; } }
      const tx = lerp(best[0], f.c[0], 4.5/bd), tz = lerp(best[1], f.c[1], 4.5/bd), s = 3.6, T = [[tx - s, tz - s], [tx + s, tz - s], [tx + s, tz + s], [tx - s, tz + s]], th = eave + 6.5;
      prism(B.p(WALL[(i + 3) % WALL.length]), T, eave - 1, th, false); prism(B.p(TRIM), offP(T, -0.3), th - 0.5, th, false);
      const tf = {c:[tx, tz], ux:1, uz:0, L:2*s, W:2*s}; hipF(B.p(slate ? SLATE : TERRA), tf, th, 4.5, 0.5);
      ctx.lamp(tx, th + 1, tz, [255, 214, 160]); }
    if (Math.abs(area2(R)) > 1800){ // ground-floor arcade piers and string course on the big blocks (approximation)
      for (let e = 0; e < R.length; e++){ const [nx, nz, ux, uz, l] = edgeN(R, e), a = R[e]; if (l < 12) continue; const n = Math.round(l/4.2);
        for (let k = 1; k < n; k++){ const x = a[0] + ux*l*k/n + nx*0.35, z = a[1] + uz*l*k/n + nz*0.35; prism(B.p(TRIM), [[x - 0.4, z - 0.4], [x + 0.4, z - 0.4], [x + 0.4, z + 0.4], [x - 0.4, z + 0.4]], hi + 1.2, hi + 4.6, false); } }
      prism(B.p(TRIM), offP(R, -0.3), hi + 4.6, hi + 5.1, false); }
    if (rectish(R, f) && f.L > 30) for (const u of [-0.3, 0.3]){ const p = fP(f, u*f.L, f.W*0.18, 0); const C = [[p[0] - 0.7, p[2] - 0.7], [p[0] + 0.7, p[2] - 0.7], [p[0] + 0.7, p[2] + 0.7], [p[0] - 0.7, p[2] + 0.7]]; prism(B.p(WALL[(i + 5) % WALL.length]), C, eave + rise*0.4, eave + rise + 1.4, true); }
    lampsRound(ctx, R, hi + 4, 24, [255, 214, 160]);
  });
  for (const [x, z] of S.stops){ const y = ctx.gy(x, z), T = [[x - 4, z - 1.6], [x + 4, z - 1.6], [x + 4, z + 1.6], [x - 4, z + 1.6]];
    for (const [px, pz] of [[x - 3.6, z - 1.2], [x + 3.6, z - 1.2], [x - 3.6, z + 1.2], [x + 3.6, z + 1.2]]) prism(B.p('#5a5f63'), [[px - 0.12, pz - 0.12], [px + 0.12, pz - 0.12], [px + 0.12, pz + 0.12], [px - 0.12, pz + 0.12]], y, y + 2.7, false);
    hipF(B.p('#a32a22'), {c:[x, z], ux:1, uz:0, L:8, W:3.2}, y + 2.7, 1.1, 0.3); ctx.lamp(x, y + 2.5, z, [255, 226, 180]); }
  treesIn(ctx, S.keep, bl, 260, 3.4, 'd');
  B.flush(g); return g;
}

// ================= Dongguan University of Technology (Songshan Lake campus) =================
// Footprints and heights: every ref building within the campus radius (OSM area w583565412), keep = their hull + 8 m. Style
// (light render with window bands, stone base, flat roofs with parapets; the large civic block w583565411 with a glass front) is an
// approximation from the campus's general look, not surveyed per building.
function dgutBuild(ctx){
  const g = new THREE.Group(), B = mkB(), S = D.dgdgut;
  const WALLS = [{c:'#e4e1da', m:1, fh:3.8, cw:3.6}, {c:'#d6d2c8', m:1, fh:3.8, cw:3.6}, {c:'#cfc6b8', m:1, fh:3.3, cw:3.0}, {c:'#bfb3a3', m:1, fh:3.8, cw:3.6}];
  const BASE = {c:'#9c968c', m:0, lk:0.35}, ROOF = '#7b7d7d', PAR = '#ecebe6', GL = {c:'#8fa6b4', m:1, fh:4.2, cw:2.4, glow:'#ffeccc', gk:0.25};
  const bl = S.b.map(b => ({bb:bbP(b.r)}));
  S.b.forEach((b, i) => {
    const R = b.r, [lo, hi] = gyR(ctx, R), H = Math.max(6, b.h), top = hi + H, big = b.o === 'w583565411', res = b.t === 'apartment';
    prism(B.p(BASE), R, lo - 1.5, hi + 1, false);
    prism(B.p(big ? GL : WALLS[res ? 2 : i % 2 ? 1 : 0]), R, hi + 1, top, false);
    flat(B.p(ROOF), R, top); prism(B.p(PAR), offP(R, -0.2), top, top + 1.1, false);
    if (big){ const IN = offP(R, 3); if (area2(IN)*area2(R) > 0){ prism(B.p(WALLS[3]), IN, top, top + 4, false); flat(B.p(ROOF), IN, top + 4); } }
    if (!res) lampsRound(ctx, R, hi + 5, 30, [255, 230, 190]);
  });
  treesIn(ctx, S.keep, bl, 300, 3.6, 'd');
  B.flush(g); return g;
}

// ================= China Spallation Neutron Source (Dalang) =================
// Footprints / names / heights: the 17 OSM buildings of the facility in this build (e.g. B7 target-station spectrometer hall
// 靶站谱仪大厅 w1428348770, B3 RCS equipment building, B4 RTBT equipment building, A1 / A2 integrated laboratories). The accelerator
// tunnels are not OSM footprints and are not drawn. Style (light metal cladding, low-pitched blue-grey roofs on the halls, window
// bands on the laboratory blocks) is an approximation.
function csnsBuild(ctx){
  const g = new THREE.Group(), B = mkB(), S = D.dgcsns;
  const CLAD = {c:'#dfe3e5', m:0, lk:0.35}, CLAD2 = {c:'#c9d0d4', m:0, lk:0.35}, BAND = '#9aa6ae', LAB = {c:'#e6e4de', m:1, fh:3.9, cw:3.6}, ROOF = '#6f8597', BASE = {c:'#a49e94', m:0, lk:0.3};
  const bl = S.b.map(b => ({bb:bbP(b.r)}));
  S.b.forEach((b, i) => {
    const R = b.r, [lo, hi] = gyR(ctx, R), f = oframe(R), H = Math.max(6, b.h), lab = /实验楼|服务楼|研究|防护/.test(b.n), hall = !lab && f.W > 18 && rectish(R, f);
    const rise = hall ? Math.min(2.5, f.W*0.06) : 0, eave = hi + H - rise;
    prism(B.p(BASE), R, lo - 1.5, hi + 0.8, false);
    prism(B.p(lab ? LAB : i % 2 ? CLAD2 : CLAD), R, hi + 0.8, eave, false);
    if (!lab) prism(B.p(BAND), offP(R, -0.08), eave - 1.6, eave - 0.9, false);
    if (hall) gableF(B.p(ROOF), B.p(lab ? LAB : CLAD), f, eave, rise, 0.6); else { flat(B.p(ROOF), R, eave); prism(B.p('#d9dcdc'), offP(R, -0.2), eave, eave + 0.9, false); }
    lampsRound(ctx, R, hi + 6, 26, [235, 240, 255]);
  });
  treesIn(ctx, S.keep, bl, 140, 3.4, 'd');
  B.flush(g); return g;
}

// ================= Guanyinshan National Forest Park: the summit temple terrace and the Guanyin statue =================
// The statue is the OSM footprint 观世音菩萨 (w1336365406, 300 m2, this build: 33 m) on the terrace footprints w1336365407 /
// w1341230511 (15 m in this build); the halls (大殿, 崇宁殿, 紫竹林 ...) are their OSM footprints at this build's heights. The site is
// anchored on the statue (the park itself spans 6.2 km2; only the summit terrace is rebuilt). The figure's silhouette (lotus base,
// standing robed figure) and the temple colours (red walls / columns, yellow glazed hipped roofs) are approximations; the statue's
// real height is not verified (the 33 m of this build is used as the top of the figure).
function guanyinBuild(ctx){
  const g = new THREE.Group(), B = mkB(), S = D.dgguanyin;
  const STONE = {c:'#d9d4c8', m:0, lk:0.55}, STONE2 = {c:'#c9c3b5', m:0, lk:0.5}, RAIL = '#efece4', WHITE = {c:'#f1efe9', m:0, lk:0.9, lc:'#fff3dc'};
  const REDW = {c:'#8e3326', m:0, lk:0.5, lc:'#ffd9a0'}, GOLD = '#c79a3c', BEAM = '#3f5a52';
  const isStatue = b => b.o === 'w1336365406', isTer = b => b.o === 'w1336365407' || b.o === 'w1341230511';
  const bl = S.b.map(b => ({bb:bbP(b.r)}));
  let yT = null;
  for (const b of S.b) if (isTer(b)){ const R = b.r, [lo, hi] = gyR(ctx, R), big = b.o === 'w1341230511', top = hi + (big ? b.h*0.5 : b.h);
    prism(B.p(big ? STONE2 : STONE), R, lo - 2, top, true); prism(B.p(RAIL), offP(R, 0.3), top, top + 1.1, false);
    if (!big) yT = top; lampsRound(ctx, R, top + 1.5, 9, [255, 220, 170]); }
  for (const b of S.b){
    if (isTer(b)) continue; const R = b.r, [lo, hi] = gyR(ctx, R), f = oframe(R), H = Math.max(4, b.h);
    if (isStatue(b)){ // lotus pedestal + standing robed figure (LLathe), white stone; floodlit at night
      const c = cenP(R), y0 = yT !== null ? yT : hi, top = hi + H, Hf = top - y0, rp = Math.sqrt(Math.abs(area2(R))/PI)*0.8;
      const prof = [[0, 0], [rp, 0], [rp, 0.06], [rp*0.8, 0.09], [rp*0.95, 0.12], [rp*0.55, 0.15], [rp*0.42, 0.16], [rp*0.4, 0.2], [rp*0.37, 0.45], [rp*0.32, 0.7], [rp*0.36, 0.76], [rp*0.34, 0.8], [rp*0.14, 0.83], [rp*0.17, 0.87], [rp*0.18, 0.92], [rp*0.12, 0.97], [rp*0.05, 1.0], [0, 1.0]];
      LLathe(g, prof.map(([r, t]) => [r, t*Hf]), c[0], y0, c[1], WHITE, 24);
      LBeam(g, [c[0] + rp*0.3, y0 + Hf*0.66, c[1] - rp*0.1], [c[0] + rp*0.12, y0 + Hf*0.74, c[1] - rp*0.38], rp*0.07, WHITE, 6); // the arm with the vase (approximation)
      for (let k = 0; k < 6; k++){ const a = k/6*TAU; ctx.lamp(c[0] + Math.cos(a)*rp*1.3, y0 + 0.6, c[1] + Math.sin(a)*rp*1.3, [255, 236, 200]); }
      continue; }
    const rise = Math.min(f.W*0.28, 5), eave = hi + Math.max(3.2, H - rise), roof = rectish(R, f);
    prism(B.p(STONE2), R, lo - 1.5, hi + 0.9, true);
    prism(B.p(REDW), offP(R, 0.6), hi + 0.9, eave, false);
    prism(B.p(BEAM), offP(R, 0.3), eave - 0.9, eave, false);
    if (roof){ hipF(B.p(GOLD), f, eave, rise, 1.6); if (/大殿/.test(b.n)){ hipF(B.p(GOLD), f, eave - 3.2, 0.9, 2.6); } }
    else { flat(B.p(GOLD), offP(R, -0.8), eave); }
    lampsRound(ctx, R, hi + 3.5, 8, [255, 200, 130]);
  }
  treesIn(ctx, S.keep, bl, 70, 3.2, 'd');
  B.flush(g); return g;
}

// ================= ★ Nanshe Ancient Village (Chashan) =================
// Footprints: the 15 OSM buildings of the village in this build (relations r17706812 ...; heights are this build's estimates).
// The rest of the village is not mapped as footprints; the pond is not an OSM area in the ref data, so it is not drawn here.
// Style (grey-brick walls, dark tiled gable roofs with raised gable walls, granite base, red lanterns at night) is an approximation of
// the Lingnan Ming-Qing halls described in targets.json (ancestral halls, grey-brick houses).
function nansheBuild(ctx){
  const g = new THREE.Group(), B = mkB(), S = D.dgnanshe;
  const BRICK = {c:'#7f8182', m:0, lk:0.4, lc:'#ffd6a0'}, BRICK2 = {c:'#8a8a86', m:0, lk:0.4, lc:'#ffd6a0'}, GRAN = '#b5afa3', TILE = '#45484a', RIDGE = '#d8d2c4', DOOR = {c:'#3a2a22', glow:'#ffb060', gk:0.6};
  const bl = S.b.map(b => ({bb:bbP(b.r)}));
  S.b.forEach((b, i) => {
    const R = b.r, [lo, hi] = gyR(ctx, R), f = oframe(R), H = Math.max(5, b.h), rise = Math.min(f.W*0.3, 3.5), eave = hi + Math.max(3.5, H - rise);
    prism(B.p(GRAN), R, lo - 1.2, hi + 0.7, true);
    prism(B.p(i % 2 ? BRICK2 : BRICK), R, hi + 0.7, eave, false);
    gableF(B.p(TILE), B.p(i % 2 ? BRICK2 : BRICK), f, eave, rise, 0.5);
    const e0 = fP(f, -f.L/2 - 0.5, 0, eave + rise), e1 = fP(f, f.L/2 + 0.5, 0, eave + rise);       // ridge
    const P = [[e0[0], e0[2]], [e1[0], e1[2]]], d = [-f.uz*0.25, f.ux*0.25];
    prism(B.p(RIDGE), [[P[0][0] - d[0], P[0][1] - d[1]], [P[1][0] - d[0], P[1][1] - d[1]], [P[1][0] + d[0], P[1][1] + d[1]], [P[0][0] + d[0], P[0][1] + d[1]]], eave + rise, eave + rise + 0.5, true);
    // raised gable walls (approximation) on both ends
    for (const s of [-1, 1]){ const u = s*f.L/2, W = f.W/2; const o = B.p(i % 2 ? BRICK2 : BRICK);
      q4(o, fP(f, u, -W - 0.3, eave), fP(f, u, W + 0.3, eave), fP(f, u, 0.6, eave + rise + 1.0), fP(f, u, -0.6, eave + rise + 1.0)); }
    // the door on the long side facing the lane (side v = +W, approximation) with a pair of red lanterns
    const dc = fP(f, 0, f.W/2 + 0.05, hi + 0.7); q4(B.p(DOOR), fP(f, -1.1, f.W/2 + 0.05, hi + 0.7), fP(f, 1.1, f.W/2 + 0.05, hi + 0.7), fP(f, 1.1, f.W/2 + 0.05, hi + 3.6), fP(f, -1.1, f.W/2 + 0.05, hi + 3.6));
    for (const s of [-1.8, 1.8]){ const p = fP(f, s, f.W/2 + 0.6, hi + 3.4); ctx.lamp(p[0], p[1], p[2], [255, 70, 40]); }
  });
  treesIn(ctx, S.keep, bl, 30, 3.6, 'd');
  B.flush(g); return g;
}

Object.assign(SITES, {
  dgoxhorn:{zh:'华为溪流背坡村', en:'Huawei Ox Horn Campus', lat:D.dgoxhorn.lat, lon:D.dgoxhorn.lon, r:D.dgoxhorn.rad, keep:D.dgoxhorn.keep, h:30, keepRoads:[11, 12],
    lt:{m:1, c:'#ffe6c2', k:0.6}, build(ctx){ return oxBuild(ctx); }},
  dgdgut:{zh:'东莞理工学院（松山湖校区）', en:'Dongguan University of Technology (Songshan Lake)', lat:D.dgdgut.lat, lon:D.dgdgut.lon, r:D.dgdgut.rad, keep:D.dgdgut.keep, h:25, keepRoads:[11, 12],
    lt:{m:1, c:'#e8eef6', k:0.55}, build(ctx){ return dgutBuild(ctx); }},
  dgcsns:{zh:'中国散裂中子源', en:'China Spallation Neutron Source', lat:D.dgcsns.lat, lon:D.dgcsns.lon, r:D.dgcsns.rad, keep:D.dgcsns.keep, h:25, keepRoads:[11, 12],
    lt:{m:1, c:'#e8eef6', k:0.5}, build(ctx){ return csnsBuild(ctx); }},
  dgguanyin:{zh:'观音山国家森林公园', en:'Guanyinshan National Forest Park', lat:D.dgguanyin.lat, lon:D.dgguanyin.lon, r:D.dgguanyin.rad, keep:D.dgguanyin.keep, h:45, keepRoads:[10, 11, 12],
    lt:{m:0, c:'#fff0d8', k:0.7}, build(ctx){ return guanyinBuild(ctx); }},
  dgnanshe:{zh:'南社明清古村落', en:'Nanshe Ancient Village', lat:D.dgnanshe.lat, lon:D.dgnanshe.lon, r:D.dgnanshe.rad, keep:D.dgnanshe.keep, h:20, keepRoads:[10, 11, 12],
    lt:{m:0, c:'#ffd9a8', k:0.6}, build(ctx){ return nansheBuild(ctx); }}
});

// ================= Landmarks (own frame = ref local metres: +x east, +z south, rot 0; y = 0 is the app's base height) =================
// Dongguan Basketball Centre: OSM w344966677 (the oval, 19 781 m2); this build's height 13.4 m (an estimate: the real height is not
// verified) is used as the crown of the roof. Glass base, metal shell sweeping up from the base ring, LED ring at night (approximation).
LANDMARKS.dgbasketball = {zh:'东莞篮球中心', en:'Dongguan Basketball Centre', cat:'new', r:D.dgbasketball.rad + 4, h:D.dgbasketball.h, lt:{m:1, c:'#e6f0ff', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), F = D.dgbasketball.fp, H = D.dgbasketball.h, yB = 4.6, c = cenP(F);
  const PAN = {c:'#c7ccd0', m:0, lk:0.5, lc:'#eaf2ff'}, PAN2 = {c:'#b3b9be', m:0, lk:0.5, lc:'#eaf2ff'}, GL = {c:'#44515c', glow:'#dbe9ff', gk:0.55}, LED = {c:'#9fd4ff', glow:'#7fd0ff', gk:2.2}, PL = '#bdb7ac';
  prism(B.p(PL), offP(F, -3), -4, 0.6, true);
  prism(B.p(GL), offP(F, 2.5), 0.6, yB + 0.5, false);
  for (let i = 0; i < F.length; i += 2){ const p = offP(F, 2.5)[i]; prism(B.p('#d9dcde'), [[p[0] - 0.3, p[1] - 0.3], [p[0] + 0.3, p[1] - 0.3], [p[0] + 0.3, p[1] + 0.3], [p[0] - 0.3, p[1] + 0.3]], 0.6, yB, false); }
  const NR = 10, ring = k => { const s = k/NR, sc = Math.cos(s*PI/2), y = yB + (H - yB)*Math.sin(s*PI/2); return F.map(p => [c[0] + (p[0] - c[0])*sc, y, c[1] + (p[1] - c[1])*sc]); };
  for (let k = 0; k < NR; k++){ const A = ring(k), Bn = ring(k + 1); for (let i = 0; i < F.length; i++){ const j = (i + 1) % F.length; q4(B.p(((i >> 2) + k) % 2 ? PAN : PAN2), A[i], A[j], Bn[j], Bn[i]); } }
  const E = ring(0), E2 = F.map(p => [p[0], yB - 0.7, p[1]]); for (let i = 0; i < F.length; i++){ const j = (i + 1) % F.length; q4(B.p(LED), E2[i], E2[j], E[j], E[i]); }
  B.flush(g); return g; }};
SG_PLACES.push({type:'dgbasketball', lat:D.dgbasketball.lat, lon:D.dgbasketball.lon, rot:0});

// Railway stations: the OSM station footprints (Dongguan w337173806, Dongguan South w889622740) at this build's height (15 m, an
// estimate). The footprints cover the platforms and tracks too: the parts more than 24 m from the OSM tracks (gen.py) are the
// enclosed station halls (granite plinth, glazed ground floor, clad upper storey); the rest is an open platform roof on columns
// over the tracks, so the trains stay visible. Facade and roof details are not verified: approximation.
const dSeg = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx*dx + dz*dz || 1, t = Math.max(0, Math.min(1, ((x - a[0])*dx + (z - a[1])*dz)/l2)); return Math.hypot(x - a[0] - dx*t, z - a[1] - dz*t); };
function stationBuild(S, wall, roofC){
  const g = new THREE.Group(), B = mkB(), F = S.fp, H = S.h, yR = H - 1.3;
  const GL = {c:'#3c4853', glow:'#ffe6bf', gk:0.6}, LED = {c:'#e8f1ff', glow:'#e0ecff', gk:1.6}, COL = '#d8d6d0', SOFF = {c:'#9ea3a6', glow:'#fff4dc', gk:0.25};
  for (const Hh of S.halls){
    prism(B.p('#bab4a8'), offP(Hh, -1.5), -10, 0.6, true);
    prism(B.p(GL), offP(Hh, 1.5), 0.6, 7.0, false);
    const IN = offP(Hh, 1.5); for (let i = 0; i < IN.length; i++){ const [nx, nz, ux, uz, l] = edgeN(IN, i), a = IN[i]; for (let s = 0; s < l; s += 9){ const x = a[0] + ux*s, z = a[1] + uz*s; prism(B.p(COL), [[x - 0.4, z - 0.4], [x + 0.4, z - 0.4], [x + 0.4, z + 0.4], [x - 0.4, z + 0.4]], 0.6, 7.0, false); } }
    prism(B.p(wall), Hh, 7.0, yR, false); }
  // the roof over the whole footprint (overhang 2.5 m), lit soffit and a light line round the fascia
  const RO = offP(F, -2.5); prism(B.p(roofC), RO, yR, H, true); flat(B.p(SOFF), RO, yR);
  prism(B.p(LED), offP(F, -2.6), H - 0.95, H - 0.7, false);
  // columns on a 16 m grid under the open roof, clear of the tracks (3.5 m) and outside the halls
  const bb = bbP(F); for (let x = bb[0] + 8; x < bb[2]; x += 16) for (let z = bb[1] + 8; z < bb[3]; z += 16){
    if (!pip(offP(F, 2), x, z) || S.halls.some(Hh => pip(offP(Hh, -1.5), x, z))) continue;
    let dm = 1e9; for (const r of S.rail) for (let i = 0; i < r.length - 1; i++) dm = Math.min(dm, dSeg(x, z, r[i], r[i + 1])); if (dm < 3.5) continue;
    prism(B.p(COL), [[x - 0.5, z - 0.5], [x + 0.5, z - 0.5], [x + 0.5, z + 0.5], [x - 0.5, z + 0.5]], -10, yR, false); }
  B.flush(g); return g; }
LANDMARKS.dgstation = {zh:'东莞站', en:'Dongguan Railway Station', cat:'new', r:262, h:D.dgstation.h, lt:{m:1, c:'#ffe9c6', k:0.6},
  build(){ return stationBuild(D.dgstation, {c:'#d9d5cc', m:1, fh:3.6, cw:4.5}, '#e6e4df'); }};
SG_PLACES.push({type:'dgstation', lat:D.dgstation.lat, lon:D.dgstation.lon, rot:0});
LANDMARKS.dgsouthstation = {zh:'东莞南站', en:'Dongguan South Railway Station', cat:'new', r:232, h:D.dgsouthstation.h, lt:{m:1, c:'#ffe9c6', k:0.6},
  build(){ return stationBuild(D.dgsouthstation, {c:'#c4c9cc', m:1, fh:3.6, cw:4.0}, '#d9dde0'); }};
SG_PLACES.push({type:'dgsouthstation', lat:D.dgsouthstation.lat, lon:D.dgsouthstation.lon, rot:0});
}
