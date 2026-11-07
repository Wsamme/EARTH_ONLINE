
// ---------- heritage helpers ----------
// round-arched opening outline (width w, springing height hs, apex = hs + w/2), as an x-y shape for LShape-like batching
const archPts = (w, hs, n) => { const P = [[-w/2, 0], [w/2, 0], [w/2, hs]]; for (let i = 1; i < n; i++){ const a = PI*i/n; P.push([Math.cos(a)*w/2, hs + Math.sin(a)*w/2]); } P.push([-w/2, hs]); return P; };
// a flat x-y shape placed on an edge at t (centre) with its plane offset off along the normal; triangulated into a batch
function shapeOnEdge(o, a, u, n, t, P, y0, off){
  const tr = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
  const W = p => [a[0] + u[0]*(t + p[0]) + n[0]*off, y0 + p[1], a[1] + u[1]*(t + p[0]) + n[1]*off];
  for (const q of tr) tri(o, W(P[q[0]]), W(P[q[2]]), W(P[q[1]]));
}
// an arch ring (archivolt) round a round-arched opening: thin band of width bw
function archRing(o, a, u, n, t, w, hs, bw, y0, off, nseg){
  nseg = nseg || 8; const r0 = w/2, r1 = w/2 + bw;
  const W = (x, y) => [a[0] + u[0]*(t + x) + n[0]*off, y0 + y, a[1] + u[1]*(t + x) + n[1]*off];
  for (let i = 0; i < nseg; i++){ const a0 = PI*i/nseg, a1 = PI*(i+1)/nseg;
    quad(o, W(Math.cos(a0)*r0, hs + Math.sin(a0)*r0), W(Math.cos(a1)*r0, hs + Math.sin(a1)*r0), W(Math.cos(a1)*r1, hs + Math.sin(a1)*r1), W(Math.cos(a0)*r1, hs + Math.sin(a0)*r1)); }
}
// a column (shaft + base + capital) between y0 and y1 at x, z
function colT(o, oc, x, z, y0, y1, r, seg){ seg = seg || 8; latheT(o, [[r*1.35, y0], [r*1.35, y0 + 0.35], [r*1.05, y0 + 0.5], [r, y0 + 0.6], [r*0.9, y1 - 0.55], [r*1.0, y1 - 0.5]], seg, x, z); latheT(oc || o, [[r*1.0, y1 - 0.5], [r*1.45, y1 - 0.15], [r*1.5, y1]], seg, x, z); }

// ======================================================================================================
// Chesed-El Synagogue (2 Oxley Rise, 1905, national monument): Late Renaissance style by R. A. J. Bidwell of Swan & Maclaren;
// a spacious three-arched porte-cochere as the grand entrance; arches, Corinthian columns and large arched windows; floral
// plasterwork, continuous cornices; the ark on a raised platform at the west end (roots.gov.sg national monuments, NHB).
// Plan: OSM w172748756 (the hall, the polygonal west bay of the ark, the half-octagon porch on the east towards Oxley Rise:
// its three faces carry the three arches). Storey heights, the parapet and the roof colour are estimates; white walls with
// pale grey mouldings (colours not verified).
// ======================================================================================================
{
const A0 = [1.297254, 103.842623], O = [0, 0];
const FP = sh([[13.9,10.9],[-13.8,11.6],[-13.8,5.1],[-15.0,5.0],[-18.6,2.0],[-18.0,-2.2],[-15.6,-4.6],[-14.4,-4.7],[-14.4,-10.5],[13.2,-11.7],[13.3,-7.0],[18.0,-2.8],[18.0,2.0],[13.9,6.2]], O);
const HALL = [[13.6,-11.5],[13.6,11.1],[-14.1,11.4],[-14.1,-10.7]].reverse();
const APSE = [[-14.1,-4.7],[-15.6,-4.6],[-18.0,-2.2],[-18.6,2.0],[-15.0,5.0],[-14.1,5.1]];
const PORCH = [[13.4,-7.0],[18.0,-2.8],[18.0,2.0],[13.6,6.2]];
const [LAT, LON] = LL(A0, O[0], O[1]);
LANDMARKS.sgchesedel = {zh:'赫塞德埃尔犹太会堂', en:'Chesed-El Synagogue', cat:'old', r:24, h:17,
  lt:{m:0, c:'#fff1dc', k:0.75, e:0.75, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const WH = '#f0ede5', MO = '#d9d4c8', MO2 = '#c4beb1', WIN = {c:'#4c5862', glow:'#ffe2b0', gk:0.35}, ROOF = '#8e8c86', STEP = '#c9c3b6', DOOR = '#5d4632';
  const Y1 = 6.2, Y2 = 11.4, YC = 12.4, YP = 13.4;
  footT(B, MO2, FP, 0.6);
  flatT(B.p(STEP), FP, 0.6);
  // hall body (two storeys: ground floor and the women's gallery)
  wallT(B.p(WH), HALL, 0.6, YC);
  // plinth, string course, entablature and cornice running round the hall, apse and porch
  for (const P of [HALL, APSE]){
    wallT(B.p(MO2), offP(P, 0.12), 0, 1.3);
    wallT(B.p(MO), offP(P, 0.15), Y1 - 0.2, Y1 + 0.45);
    wallT(B.p(MO), offP(P, 0.15), Y2, Y2 + 0.5); wallT(B.p(MO), offP(P, 0.45), Y2 + 0.5, YC);
    flatT(B.p(MO), offP(P, 0.45), YC);
  }
  // bays of pilasters and large arched windows on the long north and south walls and the west end
  edges(HALL, (a, b, L, u, n, i) => {
    const east = n[0] > 0.7;
    const nb = Math.max(2, Math.round(L/4.6));
    for (let k = 0; k <= nb; k++){ const t = L*k/nb; if (east && Math.abs(t - L/2) < 7) continue;
      finT(B.p(MO), a, u, n, t, k === 0 || k === nb ? 1.2 : 0.7, 0.3, 1.3, Y1 - 0.2, 0); finT(B.p(MO), a, u, n, t, k === 0 || k === nb ? 1.1 : 0.6, 0.28, Y1 + 0.45, Y2, 0);
      finT(B.p(MO2), a, u, n, t, 0.95, 0.4, Y2 - 0.6, Y2, 0); }
    for (let k = 0; k < nb; k++){ const t = L*(k + 0.5)/nb; if (east && Math.abs(t - L/2) < 7) continue;
      if (Math.abs(n[0]) > 0.7 && !east && Math.abs(t - L/2) < 6) continue;      // the ark bay on the west
      shapeOnEdge(B.p(WIN), a, u, n, t, archPts(1.9, 3.4, 8), 1.6, 0.05); archRing(B.p(MO), a, u, n, t, 1.9, 3.4, 0.28, 1.6, 0.1);
      shapeOnEdge(B.p(WIN), a, u, n, t, archPts(1.7, 2.6, 8), Y1 + 0.9, 0.05); archRing(B.p(MO), a, u, n, t, 1.7, 2.6, 0.25, Y1 + 0.9, 0.1);
      finT(B.p(MO), a, u, n, t, 2.4, 0.25, 1.35, 1.6, 0); }
  });
  // the polygonal ark bay on the west: blind arches, cornice, balustrade
  wallT(B.p(WH), APSE, 0.6, YC, true);
  edges(APSE.concat([]), (a, b, L, u, n, i) => { if (i === APSE.length - 1 || L < 1.5) return; shapeOnEdge(B.p(MO2), a, u, n, L/2, archPts(Math.min(1.6, L*0.5), 3.0, 6), Y1 + 0.9, 0.04); });
  flatT(B.p(ROOF), APSE, YC);
  // parapet with balusters round the hall roof, a raised central panel over the porch side
  const par = (P, y, h) => { const Q = offP(P, 0.3); wallT(B.p(MO), Q, y, y + 0.25); wallT(B.p(MO), Q, y + h - 0.25, y + h); edges(Q, (a, b, L, u, n) => { const k = Math.floor(L/0.45); for (let i = 1; i < k; i++) finT(B.p(WH), a, u, n, L*i/k, 0.16, 0.16, y + 0.25, y + h - 0.25, -0.08); }); };
  par(HALL, YC, 1.0); par(APSE, YC, 1.0);
  // hipped roof over the hall, behind the parapet
  roofT(B.p(ROOF), null, -0.3, -0.2, 26.4, 21.2, YC + 0.2, 4.3, 0, -0.3, 0.32);
  // the three-arched porte-cochere (half octagon) on Oxley Rise: paired Corinthian columns at the corners, arches on each face
  { const P = PORCH, y0 = 0.6, yt = 7.0;
    flatT(B.p(STEP), offP(P.concat([[13.6, 6.2]]).slice(0, 4), 0.6), 0.75);
    edges(P, (a, b, L, u, n, i) => { if (i === P.length - 1) return;   // open back side joins the hall
      const w = Math.min(3.0, L - 1.6), hs = 3.4;
      // arch spandrel wall: the face wall with an arched opening (built as the wall minus the arch: two piers + head)
      const half = (L - w)/2;
      panT(B.p(WH), a, u, n, 0, half, y0, yt, 0); panT(B.p(WH), a, u, n, L - half, L, y0, yt, 0);
      // head above the arch: a strip of triangles from the arch curve up to yt
      { const m = 10, W = (x, y) => [a[0] + u[0]*(L/2 + x), y0 + y, a[1] + u[1]*(L/2 + x)];
        for (let k = 0; k < m; k++){ const a0 = PI - PI*k/m, a1 = PI - PI*(k + 1)/m; const x0 = Math.cos(a0)*w/2, x1 = Math.cos(a1)*w/2;
          quad(B.p(WH), W(x0, hs + Math.sin(a0)*w/2), W(x1, hs + Math.sin(a1)*w/2), W(x1, yt - y0), W(x0, yt - y0)); } }
      archRing(B.p(MO), a, u, n, L/2, w, hs, 0.35, y0, 0.08, 10);
      for (const s of [-1, 1]) for (const d of [0.35, 0.95]){ const t = s < 0 ? d : L - d; colT(B.p(MO), B.p(MO2), a[0] + u[0]*t + n[0]*0.45, a[1] + u[1]*t + n[1]*0.45, y0, yt - 0.8, 0.22, 8); }
      panT(B.p(MO), a, u, n, -0.2, L + 0.2, yt - 0.8, yt, 0.6);
      // the upper storey of the porch: pilasters and an arched window, then cornice
      panT(B.p(WH), a, u, n, 0, L, yt, Y2, 0.1);
      shapeOnEdge(B.p(WIN), a, u, n, L/2, archPts(1.5, 2.2, 8), yt + 0.8, 0.15); archRing(B.p(MO), a, u, n, L/2, 1.5, 2.2, 0.25, yt + 0.8, 0.2);
      for (const t of [0.3, L - 0.3]) finT(B.p(MO), a, u, n, t, 0.6, 0.3, yt, Y2, 0.1);
    });
    flatT(B.p(ROOF), P, Y2 + 0.4); flatT(B.p(WH), P, yt, true);
    wallT(B.p(MO), offP(P, 0.5), Y2, YC, true);
    // a raised attic with a small pediment over the porch front (the M-monogram panels are left plain)
    const a = P[1], b = P[2]; const ax = (a[0] + b[0])/2 + 0.4, az = (a[1] + b[1])/2;
    boxT(B.p(WH), ax, YC, az, 1.2, 1.6, 6.4, 0);
    { const o = B.p(MO); const z0 = az - 3.4, z1 = az + 3.4, yb = YC + 1.6, yt2 = yb + 1.5; tri(o, [ax + 0.65, yb, z0], [ax + 0.65, yb, z1], [ax + 0.65, yt2, az]); tri(o, [ax - 0.65, yb, z1], [ax - 0.65, yb, z0], [ax - 0.65, yt2, az]);
      quad(o, [ax - 0.65, yb, z0], [ax + 0.65, yb, z0], [ax + 0.65, yt2, az], [ax - 0.65, yt2, az]); quad(o, [ax + 0.65, yb, z1], [ax - 0.65, yb, z1], [ax - 0.65, yt2, az], [ax + 0.65, yt2, az]); }
    // entrance doors behind the porch
    panT(B.p(DOOR), [13.6, -1.4], [0, 1], [1, 0], 0, 2.8, 0.75, 4.2, 0.05);
  }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgchesedel', lat:LAT, lon:LON, rot:0});
}

// ======================================================================================================
// Orchard Road Presbyterian Church (3 Orchard Road, 1878): neo-Classical; the tower and entrance portico face Orchard Road
// (north-west, towards the Penang Road junction); the porch arch on double Ionic columns with a smaller arch on the upper
// facade echoing it; a Palladian window as the dominant motif; the tower topped by a cupola; a high-pitched roof with double
// eaves; later extensions altered the side facades (URA conservation portal). Plan: OSM w172090787 with its parts: the 1878
// church on the west lobe (front slice + nave + side room), the newer halls on the rest at the mapped part heights.
// Tower / cupola heights and the colours (white, grey roofs) are estimates.
// ======================================================================================================
{
const A0 = [1.297797, 103.847446], O = [-8, 0];
const RING = sh([[3.6,-23.4],[6.5,-26.9],[14.3,-21.0],[11.3,-16.9],[15.5,-13.3],[7.1,-2.0],[13.1,3.3],[28.6,-16.9],[45.4,-3.8],[24.5,23.5],[4.2,17.5],[4.8,16.4],[3.6,15.2],[6.5,12.2],[-0.6,6.9],[-7.2,15.2],[-22.1,3.9],[-33.4,17.5],[-52.6,5.1],[-41.8,-9.1],[-37.0,-5.6],[-31.7,-12.1],[-17.9,-1.4],[-10.2,-10.9],[-13.2,-12.7],[-1.8,-27.5]], O);
const PARTS = [
  [sh([[7.1,-2.0],[13.1,3.3],[6.5,12.2],[-0.6,6.9]], O), 7.2],
  [sh([[22.7,-8.5],[39.4,3.9],[34.0,11.0],[17.3,-1.4]], O), 7.2],
  [sh([[3.6,15.2],[17.3,-1.4],[34.0,11.0],[24.5,23.5],[4.2,17.5],[4.8,16.4]], O), 10.5]];
// the small unnamed annex in the notch between the old church and the halls (OSM way without id, 5.7 m in the data)
const ANNEX = sh([[-20.9,-5.0],[-28.7,-10.9],[-23.3,-18.6],[-18.5,-15.7],[-20.9,-11.5],[-17.9,-9.1]], O);
const [LAT, LON] = LL(A0, O[0], O[1]);
// church frame: front (NW face) centre F, axis U (front -> back), across V
const F = [(-52.6 - 41.8)/2 - O[0], (5.1 - 9.1)/2 - O[1]];
const U = (() => { const d = [(-17.9 - 22.1)/2 - (-47.2), (-1.4 + 3.9)/2 - (-2.0)]; const L = Math.hypot(d[0], d[1]); return [d[0]/L, d[1]/L]; })();
const V = [-U[1], U[0]];
const CW = (s, t) => [F[0] + U[0]*s + V[0]*t, F[1] + U[1]*s + V[1]*t];        // s along the axis from the front, t across
const RY = Math.atan2(-U[1], U[0]);
LANDMARKS.sgorpc = {zh:'乌节路长老会堂', en:'Orchard Road Presbyterian Church', cat:'old', r:58, h:27,
  lt:{m:0, c:'#fff0da', k:0.7, e:0.7, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const WH = '#f2efe8', MO = '#d6d1c5', MO2 = '#bfb9ac', ROOF = '#7d7f80', ROOF2 = '#8f8d87', WIN = {c:'#4a5560', glow:'#ffe0ae', gk:0.35}, DOOR = '#5a4431', HALLW = '#ece8de';
  footT(B, MO2, RING, 0.3);
  // the newer halls: the whole outline as a single-storey base, the mapped higher parts over it, simple hipped roofs
  wallT(B.p(HALLW), RING, 0, 4.4); flatT(B.p(ROOF2), RING, 4.4); wallT(B.p(MO), RING, 4.4, 5.0);
  edges(RING, (a, b, L, u, n) => { if (L < 3) return; const k = Math.floor(L/3.2); for (let i = 0; i < k; i++){ const t = (L - k*3.2)/2 + 3.2*i + 1.6; panT(B.p(WIN), a, u, n, t - 0.7, t + 0.7, 1.0, 3.2, 0.05); } });
  footT(B, MO2, ANNEX, 0.3); wallT(B.p(HALLW), ANNEX, 0.3, 4.6); flatT(B.p(ROOF2), ANNEX, 4.6); wallT(B.p(MO), ANNEX, 4.6, 5.2);
  for (const [P, h] of PARTS){ wallT(B.p(HALLW), P, 4.4, h); wallT(B.p(MO), offP(P, 0.1), h - 0.5, h);
    edges(P, (a, b, L, u, n) => { if (L < 4) return; const k = Math.floor(L/3.2); for (let i = 0; i < k; i++){ const t = (L - k*3.2)/2 + 3.2*i + 1.6; panT(B.p(WIN), a, u, n, t - 0.7, t + 0.7, 5.6, h - 1.2, 0.05); } });
    const c = P.reduce((s, p) => [s[0] + p[0]/P.length, s[1] + p[1]/P.length], [0, 0]);
    const e = Math.atan2(-(P[1][1] - P[0][1]), P[1][0] - P[0][0]), L1 = Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]), W1 = Math.hypot(P[2][0] - P[1][0], P[2][1] - P[1][1]);
    roofT(B.p(ROOF2), null, c[0], c[1], L1 - 1, W1 - 1, h, 2.4, e, 0.4, 0.3); }
  // ---- the 1878 church: nave 26 m x 15 m behind the front, walls to 8.5 m, high-pitched roof with double eaves
  const NL = 26.5, NW = 15.2, WALLH = 8.6;
  const R = (s, y, t) => { const p = CW(s, t); return [p[0], y, p[1]]; };
  boxT(B.p(WH), ...(p => [p[0], 0, p[1]])(CW(NL/2 + 1, 0)), NL - 2, WALLH, NW, RY);
  // pilasters and tall round-arched windows on both side walls
  for (const sd of [-1, 1]){
    const a = CW(2, sd*NW/2), u = U, n = [V[0]*sd, V[1]*sd];
    for (let k = 0; k <= 6; k++) finT(B.p(MO), a, u, n, 2 + k*3.6, 0.7, 0.3, 0.3, WALLH, 0);
    for (let k = 0; k < 6; k++){ const t = 3.8 + k*3.6; shapeOnEdge(B.p(WIN), a, u, n, t, archPts(1.5, 3.4, 8), 1.6, 0.05); archRing(B.p(MO), a, u, n, t, 1.5, 3.4, 0.22, 1.6, 0.1); }
    panT(B.p(MO), a, u, n, -1, NL - 1, WALLH - 0.7, WALLH, 0.3);
  }
  // roof: lower eave skirt and the main steep roof above it (double eaves)
  { const c = CW(NL/2 + 1, 0); roofT(B.p(ROOF), null, c[0], c[1], NL - 2, NW, WALLH, 1.0, RY, 1.2, 0.03);
    roofT(B.p(ROOF), B.p(WH), c[0], c[1], NL - 2.6, NW - 2.4, WALLH + 0.6, 6.4, RY, 0.3, 0); }
  // side room on the south-west flank (OSM part), lean-to roof
  { const c = CW(15, -NW/2 - 2.2); boxT(B.p(WH), c[0], 0, c[1], 18, 4.6, 4.2, RY); const p0 = CW(6, -NW/2 - 4.6), p1 = CW(24, -NW/2 - 4.6), p2 = CW(24, -NW/2), p3 = CW(6, -NW/2);
    quad(B.p(ROOF), [p0[0], 4.6, p0[1]], [p1[0], 4.6, p1[1]], [p2[0], 6.0, p2[1]], [p3[0], 6.0, p3[1]]); }
  // ---- the front (north-west): a classical front block, the portico, the Palladian window, the tower with a cupola
  const FW = 15.6, FD = 6.6, FH = 10.2;
  { const c = CW(FD/2, 0); boxT(B.p(WH), c[0], 0, c[1], FD, FH, FW, RY); }
  const fa = CW(0, -FW/2), fu = V, fn = [-U[0], -U[1]];           // the front face: t across from the south-west corner
  panT(B.p(MO), fa, fu, fn, 0, FW, 0, 1.0, 0.1);
  panT(B.p(MO), fa, fu, fn, -0.2, FW + 0.2, FH - 1.0, FH, 0.25);
  for (const t of [0.4, FW - 0.4]) finT(B.p(MO), fa, fu, fn, t, 0.9, 0.35, 0.4, FH - 1, 0);
  // side windows of the front block, ground and upper
  for (const t of [2.2, FW - 2.2]){ shapeOnEdge(B.p(WIN), fa, fu, fn, t, archPts(1.3, 2.4, 8), 1.2, 0.05); shapeOnEdge(B.p(WIN), fa, fu, fn, t, archPts(1.1, 1.6, 8), 5.6, 0.05); }
  // the Palladian window (central arch, two flat-topped side lights) on the upper front, with its pilasters
  { const t = FW/2, y = 5.0;
    shapeOnEdge(B.p(WIN), fa, fu, fn, t, archPts(1.6, 2.2, 10), y, 0.05); archRing(B.p(MO), fa, fu, fn, t, 1.6, 2.2, 0.3, y, 0.12, 10);
    for (const s of [-1.6, 1.6]) shapeOnEdge(B.p(WIN), fa, fu, fn, t + s, [[-0.5, 0], [0.5, 0], [0.5, 2.2], [-0.5, 2.2]], y, 0.05);
    for (const s of [-2.25, -0.95, 0.95, 2.25]) finT(B.p(MO), fa, fu, fn, t + s, 0.28, 0.3, y - 0.2, y + 2.4, 0);
    panT(B.p(MO), fa, fu, fn, t - 2.5, t + 2.5, y - 0.45, y - 0.1, 0.3);
  }
  // the portico: an arch on double Ionic columns, projecting 3.4 m, with a small arch in the upper attic echoing it
  { const pd = 3.4, t = FW/2, pw = 6.4, ph = 6.0;
    const pa = CW(-pd, -pw/2);
    for (const s of [-1, 1]) for (const d of [0.4, 1.05]){ const p = CW(-pd + 0.5, s*(pw/2 - d)); colT(B.p(MO), B.p(MO2), p[0], p[1], 0.3, ph - 1.2, 0.24, 8); }
    { const p = CW(-pd/2, 0); boxT(B.p(WH), p[0], ph - 1.2, p[1], pd, 1.2, pw, RY); boxT(B.p(MO), p[0], ph, p[1], pd + 0.4, 0.35, pw + 0.4, RY); }
    archRing(B.p(MO), pa, fu, fn, pw/2, 3.0, 2.9, 0.35, 0.3, -0.05, 10);
    { const o = B.p(WH), m = 10; for (let k = 0; k < m; k++){ const a0 = PI - PI*k/m, a1 = PI - PI*(k + 1)/m, x0 = Math.cos(a0)*1.5, x1 = Math.cos(a1)*1.5;
        const W2 = (x, y) => { const p = CW(-pd - 0.02, x); return [p[0], y, p[1]]; };
        quad(o, W2(x0, 3.2 + Math.sin(a0)*1.5), W2(x1, 3.2 + Math.sin(a1)*1.5), W2(x1, ph - 1.2), W2(x0, ph - 1.2)); } }
    for (const s of [-1, 1]){ const p = CW(-pd/2, s*(pw/2 - 0.75)); boxT(B.p(WH), p[0], 0.3, p[1], pd, ph - 1.5, 1.5 - 0.2, RY); }
    // attic over the porch with the smaller arch
    { const p = CW(-pd/2 + 0.2, 0); boxT(B.p(WH), p[0], ph + 0.35, p[1], pd - 0.4, 2.4, 3.6, RY); const aa = CW(-pd + 0.2, -1.8); shapeOnEdge(B.p(WIN), aa, fu, fn, 1.8, archPts(1.2, 1.0, 8), ph + 0.6, 0.05); }
    // entrance door
    shapeOnEdge(B.p(DOOR), fa, fu, fn, t, archPts(2.0, 2.4, 8), 0.3, 0.05);
  }
  // the tower over the front centre (square, two stages), the cupola on top
  { const c = CW(FD/2, 0), tw = 5.0;
    boxT(B.p(WH), c[0], FH, c[1], tw, 5.2, tw, RY); boxT(B.p(MO), c[0], FH + 5.0, c[1], tw + 0.5, 0.5, tw + 0.5, RY);
    boxT(B.p(WH), c[0], FH + 5.5, c[1], tw - 0.8, 4.2, tw - 0.8, RY); boxT(B.p(MO), c[0], FH + 9.6, c[1], tw - 0.2, 0.45, tw - 0.2, RY);
    // belfry openings: dark arches on the four faces of the upper stage
    const hh = (tw - 0.8)/2 + 0.03;
    for (const [nr, d] of [[[-U[0], -U[1]], V], [[U[0], U[1]], [-V[0], -V[1]]], [V, U], [[-V[0], -V[1]], [-U[0], -U[1]]]]){
      const a2 = [c[0] + nr[0]*hh - d[0]*hh, c[1] + nr[1]*hh - d[1]*hh]; shapeOnEdge(B.p(WIN), a2, d, nr, hh, archPts(1.3, 1.8, 8), FH + 6.2, 0); }
    latheT(B.p(MO2), [[2.0, FH + 10.05], [2.0, FH + 10.6], [1.85, FH + 11.6], [1.4, FH + 12.4], [0.7, FH + 13.0], [0.2, FH + 13.4], [0.01, FH + 13.5]], 12, c[0], c[1]);
    latheT(B.p(MO), [[0.18, FH + 13.4], [0.18, FH + 14.4], [0.45, FH + 14.7], [0.01, FH + 15.1]], 6, c[0], c[1]);
    segP(B.p(MO2), [c[0], FH + 15, c[1]], [c[0], FH + 16.6, c[1]], 0.06, 3);
  }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgorpc', lat:LAT, lon:LON, rot:0});
}

// ======================================================================================================
// St George's Church (44 Minden Road, Tanglin, 1910-1913, national monument): "unadorned Romanesque" garrison church by
// Capt. William H. Stanbury; fair-faced red brick inside and out, materials imported from England; large arches along either
// side of the nave, clerestory openings, a large single-gabled roof on exposed hardwood trusses, stained glass behind the altar
// (roots.gov.sg, Wikipedia). Plan: OSM w170086728 (fitted as a 37.5 m x 21 m nave-and-aisles rectangle, the small east
// annex at its mapped notch). Arch / wall heights and the tile colour are estimates.
// ======================================================================================================
{
const A0 = [1.304737, 103.815101], O = [-1.0, -1.0];
const [LAT, LON] = LL(A0, O[0], O[1]);
const AX = 97*PI/180, U = [Math.cos(AX), Math.sin(AX)], V = [-U[1], U[0]], RY = Math.atan2(-U[1], U[0]);
const CW = (s, t) => [U[0]*s + V[0]*t, U[1]*s + V[1]*t];
LANDMARKS.sgstgeorge = {zh:'圣乔治教堂', en:"St George's Church (Tanglin)", cat:'old', r:26, h:16,
  lt:{m:0, c:'#ffe7c8', k:0.6, e:0.7, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const BR = '#a5543c', BR2 = '#8e4632', TILE = '#8a4633', DARK = {c:'#3b3633', glow:'#ffdca8', gk:0.3}, SG = {c:'#4f5a7a', glow:'#ffcf96', gk:0.5}, STONE = '#cdbfa8';
  const LN = 37.5, AW = 21, NWD = 10.4, YE = 6.0, YN = 10.6, YR = 15.6;
  const fp = [CW(-LN/2, -AW/2), CW(LN/2, -AW/2), CW(LN/2, AW/2), CW(-LN/2, AW/2)];
  footT(B, BR2, fp, 0.4); flatT(B.p(STONE), fp, 0.4);
  // aisles: arcaded outer walls of large round arches on brick piers (open verandahs), lean-to roofs
  for (const sd of [-1, 1]){
    const a = CW(-LN/2, sd*AW/2), u = U, n = [V[0]*sd, V[1]*sd];
    const nb = 8, bw = LN/nb;
    for (let k = 0; k <= nb; k++) finT(B.p(BR), a, u, n, k*bw, 1.1, 0.9, 0.4, YE, -0.9);
    for (let k = 0; k < nb; k++){ const t = (k + 0.5)*bw, w = bw - 1.1;
      // arch head: brick spandrel above the opening
      const m = 8, W = (x, y) => [a[0] + u[0]*(t + x), y, a[1] + u[1]*(t + x)];
      for (let j = 0; j < m; j++){ const a0 = PI - PI*j/m, a1 = PI - PI*(j + 1)/m; const x0 = Math.cos(a0)*w/2, x1 = Math.cos(a1)*w/2;
        quad(B.p(BR), W(x0, 2.6 + Math.sin(a0)*w/2), W(x1, 2.6 + Math.sin(a1)*w/2), W(x1, YE), W(x0, YE)); }
      archRing(B.p(BR2), a, u, n, t, w, 2.6, 0.3, 0, 0.02, 8);
      // inner aisle wall (the nave arcade seen through the arches) with dark openings
      const ai = CW(-LN/2, sd*(NWD/2 + 0.4));
      shapeOnEdge(B.p(DARK), ai, u, n, t, archPts(w*0.8, 2.6, 8), 0.4, 0.05);
    }
    wallT(B.p(BR), [CW(-LN/2, sd*NWD/2), CW(LN/2, sd*NWD/2), CW(LN/2, sd*(NWD/2 + 0.5)), CW(-LN/2, sd*(NWD/2 + 0.5))], 0.4, YN);
    // aisle lean-to roof
    const r0 = CW(-LN/2 - 0.6, sd*(AW/2 + 0.8)), r1 = CW(LN/2 + 0.6, sd*(AW/2 + 0.8)), r2 = CW(LN/2 + 0.6, sd*NWD/2), r3 = CW(-LN/2 - 0.6, sd*NWD/2);
    quad(B.p(TILE), [r0[0], YE - 0.3, r0[1]], [r1[0], YE - 0.3, r1[1]], [r2[0], YN - 1.6, r2[1]], [r3[0], YN - 1.6, r3[1]]);
    panT(B.p(BR2), a, u, n, 0, LN, YE - 0.6, YE, 0.1);
    // clerestory openings in the nave walls
    const ac = CW(-LN/2, sd*(NWD/2 + 0.5));
    for (let k = 0; k < nb; k++) shapeOnEdge(B.p(DARK), ac, u, n, (k + 0.5)*bw, archPts(1.4, 0.4, 8), YN - 1.5, 0.03);
  }
  // nave gable roof
  { roofT(B.p(TILE), B.p(BR), 0, 0, LN, NWD + 0.5, YN, YR - YN, RY, 0.7, 0); }
  // the two gable ends: brick walls across nave and aisles, a large round-arched window (stained glass behind the altar)
  for (const se of [-1, 1]){
    const a = CW(se*LN/2, -se*AW/2), u = [V[0]*se, V[1]*se], n = [U[0]*se, U[1]*se];
    panT(B.p(BR), a, u, n, 0, AW, 0.4, YE, 0.02);
    // the aisle ends: arch openings
    for (const t of [2.6, AW - 2.6]) shapeOnEdge(B.p(DARK), a, u, n, t, archPts(2.8, 2.2, 8), 0.4, 0.06);
    shapeOnEdge(B.p(SG), a, u, n, AW/2, archPts(3.6, 7.0, 10), 2.0, 0.08); archRing(B.p(BR2), a, u, n, AW/2, 3.6, 7.0, 0.4, 2.0, 0.12, 10);
    for (const t of [AW/2 - 2.8, AW/2 + 2.8]) finT(B.p(BR2), a, u, n, t, 0.8, 0.5, 0.4, YN + 1.2, 0);
  }
  // the small annex at the north-east notch of the plan (vestry / porch)
  { const c = [12.4 - O[0], -9.6 - O[1]]; boxT(B.p(BR), c[0], 0, c[1], 5.6, 4.4, 6.6, RY); roofT(B.p(TILE), B.p(BR), c[0], c[1], 6.6, 5.6, 4.4, 2.0, RY + HP, 0.4, 0); }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgstgeorge', lat:LAT, lon:LON, rot:0});
}

// ======================================================================================================
// Newton Food Centre (Newton Circus, 1971; rebuilt and reopened 1 July 2006, CPG Consultants): stalls arranged in a horseshoe,
// a semi-outdoor compound with outdoor seating; the new pitched roofs with clay tiles echo the colonial terraces of Monk's Hill
// Terrace (roots.gov.sg, Wikipedia: 83 hawkers). Plan: OSM w41662296 (the bent horseshoe of stall blocks), roofs over each arm.
// Eave / ridge heights estimated.
// ======================================================================================================
{
const A0 = [1.312050, 103.839503], O = [2, -6];
const FP = sh([[-1.4,-43.2],[20.7,-17.1],[36.2,-9.9],[32.6,0.1],[14.1,-7.0],[-1.4,-26.0],[-18.7,-11.7],[-16.3,10.8],[36.2,6.7],[37.4,23.9],[-27.1,28.6],[-31.8,-15.9]], O);
const ARMS = [[[-31.8,-15.9],[-1.4,-43.2],[-1.4,-26.0],[-18.7,-11.7]], [[-1.4,-43.2],[20.7,-17.1],[14.1,-7.0],[-1.4,-26.0]], [[20.7,-17.1],[36.2,-9.9],[32.6,0.1],[14.1,-7.0]],
  [[-27.1,28.6],[-31.8,-15.9],[-18.7,-11.7],[-16.3,10.8]], [[37.4,23.9],[-27.1,28.6],[-16.3,10.8],[36.2,6.7]]].map(q => sh(q, O));
const [LAT, LON] = LL(A0, O[0], O[1]), RR = 50;
// the app terrain here falls ~12 m from south to north across the site (70 m nodes, decimetres): every part stands on it
const TER = {i0:390, j0:394, nx:4, ny:4, H:[185,164,140,117,150,135,118,101,12,12,12,12,12,12,12,12]};
LANDMARKS.sgnewtonfc = {zh:'纽顿熟食中心', en:'Newton Food Centre', cat:'new', r:RR, h:9,
  lt:{m:0, c:'#ffe2b4', k:0.55, e:0.9}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const X = (LON - 103.845)*111290.5, Y = (LAT - 1.315)*110574, G = terrK(TER), TOP = G.top(RR, X, Y);
  const gl = (x, z) => G.h(X + x, Y - z) - TOP, gp = p => gl(p[0], p[1]);
  const WALL = '#ece3cf', COL = '#d9d2c2', TILE = '#b35f3e', TILE2 = '#9c5034', FLOOR = '#b9b2a4', STALL = {c:'#d7c9a8', glow:'#ffe6b8', gk:0.9}, DARK = '#56504a', TAB = '#c9c4ba', GLOW = {c:'#fff2d0', glow:'#ffe8b8', gk:1.2};
  const flatF = (o, P, dy) => { const t2 = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []); for (const t of t2){ const a = P[t[0]], b = P[t[1]], c = P[t[2]]; o.push(a[0], gp(a) + dy, a[1], b[0], gp(b) + dy, b[1], c[0], gp(c) + dy, c[1]); } };
  wallT(B.p(COL), FP, p => gp(p) - 5, p => gp(p) + 0.3); flatF(B.p(FLOOR), FP, 0.3);
  const YE = 4.4, RISE = 3.4;
  for (const Q of ARMS){
    const [o0, o1, i1, i0] = Q;
    const s0 = [o0[0]*0.62 + i0[0]*0.38, o0[1]*0.62 + i0[1]*0.38], s1 = [o1[0]*0.62 + i1[0]*0.38, o1[1]*0.62 + i1[1]*0.38];
    const SB = [o0, o1, s1, s0];
    wallT(B.p(WALL), SB, p => gp(p) + 0.3, p => gp(p) + 3.0); flatF(B.p(COL), SB, 3.0);
    { const L = Math.hypot(s1[0] - s0[0], s1[1] - s0[1]), u = [(s1[0] - s0[0])/L, (s1[1] - s0[1])/L]; const nn = [u[1], -u[0]];
      const c = [(o0[0] + o1[0] + i0[0] + i1[0])/4, (o0[1] + o1[1] + i0[1] + i1[1])/4]; const toC = (c[0] - s0[0])*nn[0] + (c[1] - s0[1])*nn[1]; const n = toC > 0 ? nn : [-nn[0], -nn[1]];
      const k = Math.floor(L/3.1); for (let i = 0; i < k; i++){ const t = (L - k*3.1)/2 + i*3.1 + 1.55, gy = gl(s0[0] + u[0]*t, s0[1] + u[1]*t);
        panT(B.p(STALL), s0, u, n, t - 1.35, t + 1.35, gy + 1.1, gy + 2.6, 0.05); panT(B.p(DARK), s0, u, n, t - 1.35, t + 1.35, gy + 0.3, gy + 1.1, 0.06); }
      const Li = Math.hypot(i1[0] - i0[0], i1[1] - i0[1]), ui = [(i1[0] - i0[0])/Li, (i1[1] - i0[1])/Li]; const ki = Math.max(1, Math.round(Li/6));
      for (let i = 0; i <= ki; i++){ const p = [i0[0] + ui[0]*Li*i/ki, i0[1] + ui[1]*Li*i/ki]; boxT(B.p(COL), p[0], gp(p) + 0.3, p[1], 0.45, YE - 0.3, 0.45, 0); }
      for (let i = 0; i < k; i += 2){ const t = (i + 0.5)/k; const p = [s0[0] + (s1[0] - s0[0])*t, s0[1] + (s1[1] - s0[1])*t], q = [i0[0] + (i1[0] - i0[0])*t, i0[1] + (i1[1] - i0[1])*t];
        const m = [(p[0] + q[0])/2, (p[1] + q[1])/2]; boxT(B.p(TAB), m[0], gp(m) + 0.3, m[1], 1.6, 0.75, 0.9, Math.atan2(-u[1], u[0])); }
      for (let i = 0; i < k; i += 2){ const t = (i + 0.5)/k; const m = [(o0[0] + i0[0])/2 + ((o1[0] + i1[0]) - (o0[0] + i0[0]))/2*t, (o0[1] + i0[1])/2 + ((o1[1] + i1[1]) - (o0[1] + i0[1]))/2*t]; boxT(B.p(GLOW), m[0], gp(m) + YE - 0.4, m[1], 0.5, 0.15, 0.5, 0); }
    }
    const ov = 0.9, mid = (p, q) => [(p[0] + q[0])/2, (p[1] + q[1])/2], ext = (p, q, d) => { const L = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1; return [p[0] + (p[0] - q[0])/L*d, p[1] + (p[1] - q[1])/L*d]; };
    const m0 = mid(o0, i0), m1 = mid(o1, i1);
    const O0 = ext(o0, i0, ov), I0 = ext(i0, o0, ov), O1 = ext(o1, i1, ov), I1 = ext(i1, o1, ov);
    // roof heights follow the ground along the arm (eaves at ground + 4.4 m)
    const y = YE, yt = YE + RISE, P3 = (p, hh, q) => [p[0], hh + gp(q || p), p[1]];
    quad(B.p(TILE), P3(O0, y, o0), P3(O1, y, o1), P3(m1, yt), P3(m0, yt)); quad(B.p(TILE), P3(I1, y, i1), P3(I0, y, i0), P3(m0, yt), P3(m1, yt));
    tri(B.p(WALL), P3(o0, y), P3(m0, yt - 0.1), P3(i0, y)); tri(B.p(WALL), P3(i1, y), P3(m1, yt - 0.1), P3(o1, y));
    segP(B.p(TILE2), P3(m0, yt + 0.1), P3(m1, yt + 0.1), 0.2, 4);
    segP(B.p(WALL), P3(O0, y, o0), P3(O1, y, o1), 0.15, 4); segP(B.p(WALL), P3(I0, y, i0), P3(I1, y, i1), 0.15, 4);
  }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgnewtonfc', lat:LAT, lon:LON, rot:0});
}
