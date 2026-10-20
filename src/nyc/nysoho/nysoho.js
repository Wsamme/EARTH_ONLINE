// ===== nyc/nysoho: Bowery / SoHo / Meatpacking / West Chelsea / East Village landmarks (City Brush v32, New York 1:1):
// New Museum (SANAA), E. V. Haughwout Building, Whitney Museum (Renzo Piano), IAC Building (Gehry), Hotel Chelsea, Chelsea
// Market (the Nabisco block with the High Line passage), Starrett-Lehigh Building, 100 Eleventh Avenue (Jean Nouvel), Pier 57
// and St. Mark's Church in-the-Bowery. Each model is built in its own frame aligned with its real OSM footprint (rings and
// building parts from the city's measured heights, see tools/). Block-scoped: only LANDMARKS and SG_PLACES are touched.
// No names, logos, signs with letters or readable text anywhere (the Chelsea's vertical sign is a lit frame only).
{
// ---- triangle batcher: one LTris per colour spec ------------------------------------------------------------------------
function nsTB(){ const B = new Map(); return {
  t(col, ...pts){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = B.get(k); if (!e){ e = {col, p:[]}; B.set(k, e); } for (const q of pts) e.p.push(q[0], q[1], q[2]); },
  q(col, a, b, c, d){ this.t(col, a, b, c, a, c, d); },
  // oriented box: centre-bottom (x, y, z), length L along unit (ux, uz), height h, depth d across
  box(col, x, y, z, ux, uz, L, h, d, nobot){ const vx = -uz, vz = ux, l = L/2, w = d/2;
    const P = (a, b, yy) => [x + ux*a + vx*b, yy, z + uz*a + vz*b];
    const A = P(-l, -w, y), Bq = P(l, -w, y), C = P(l, w, y), D = P(-l, w, y), A2 = P(-l, -w, y + h), B2 = P(l, -w, y + h), C2 = P(l, w, y + h), D2 = P(-l, w, y + h);
    this.q(col, A, Bq, B2, A2); this.q(col, Bq, C, C2, B2); this.q(col, C, D, D2, C2); this.q(col, D, A, A2, D2); this.q(col, A2, B2, C2, D2); if (!nobot) this.q(col, A, D, C, Bq); },
  // axis box x0..x1, y0..y1, z0..z1
  abox(col, x0, y0, z0, x1, y1, z1){ this.box(col, (x0 + x1)/2, y0, (z0 + z1)/2, 1, 0, x1 - x0, y1 - y0, z1 - z0); },
  // vertical n-gon prism (cylinder) radius r
  cyl(col, x, y, z, r, h, n, r2){ n = n || 8; const rt = r2 === undefined ? r : r2;
    for (let i = 0; i < n; i++){ const a = i/n*Math.PI*2, b = (i + 1)/n*Math.PI*2;
      this.q(col, [x + Math.cos(a)*r, y, z + Math.sin(a)*r], [x + Math.cos(b)*r, y, z + Math.sin(b)*r], [x + Math.cos(b)*rt, y + h, z + Math.sin(b)*rt], [x + Math.cos(a)*rt, y + h, z + Math.sin(a)*rt]);
      if (rt > 0) this.t(col, [x, y + h, z], [x + Math.cos(a)*rt, y + h, z + Math.sin(a)*rt], [x + Math.cos(b)*rt, y + h, z + Math.sin(b)*rt]); } },
  // flat polygon at height y (triangulated)
  flat(col, P, y){ const tr = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
    for (const f of tr) this.t(col, [P[f[0]][0], y, P[f[0]][1]], [P[f[1]][0], y, P[f[1]][1]], [P[f[2]][0], y, P[f[2]][1]]); },
  // walls of a polygon from y0 to y1 (+ top cap unless cap === false)
  prism(col, P, y0, y1, cap, capCol){ const n = P.length;
    for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n]; this.q(col, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
    if (cap !== false) this.flat(capCol || col, P, y1); },
  flush(g){ for (const e of B.values()) if (e.p.length) LTris(g, e.p, e.col); B.clear(); }
}; }
// ---- polygon helpers ([x, z] points, local metres) ------------------------------------------------------------------------
function nsArea(P){ let s = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; }
function nsEdges(P){ const sg = nsArea(P) > 0 ? 1 : -1, E = [];
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1e-6;
    E.push({i, a, b, L, ux:dx/L, uz:dz/L, nx:sg*dz/L, nz:-sg*dx/L}); } return E; }
function nsOff(P, d){ const E = nsEdges(P), n = P.length, Q = [];       // miter offset (+d outward)
  for (let i = 0; i < n; i++){ const e1 = E[(i - 1 + n) % n], e2 = E[i]; let mx = e1.nx + e2.nx, mz = e1.nz + e2.nz; const k = 1 + e1.nx*e2.nx + e1.nz*e2.nz;
    if (k < 0.15){ Q.push([P[i][0] + e2.nx*d, P[i][1] + e2.nz*d]); continue; } Q.push([P[i][0] + mx/k*d, P[i][1] + mz/k*d]); } return Q; }
function nsRect(x0, z0, x1, z1){ return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; }
// windows on every edge of P (or the edges for which o.on(e) is true): quads standing o.out outside the wall
// o: {y0, y1, fh (floor height), bw (bay width), wf (window width fraction), hf (height fraction), sill (fraction), col, out, min (min edge length), arch}
function nsWin(T, P, o){ const E = nsEdges(P), out = o.out === undefined ? 0.06 : o.out;
  for (const e of E){ if (e.L < (o.min || 2.5) || (o.on && !o.on(e))) continue;
    const nb = Math.max(1, Math.round((e.L - (o.edge || 0)*2)/o.bw)), bw = (e.L - (o.edge || 0)*2)/nb, ww = bw*(o.wf || 0.55);
    for (let y = o.y0; y + o.fh*0.5 <= o.y1 + 0.01; y += o.fh){ const ya = y + o.fh*(o.sill === undefined ? 0.2 : o.sill), yb = Math.min(o.y1, ya + o.fh*(o.hf || 0.6));
      for (let k = 0; k < nb; k++){ const c = (o.edge || 0) + bw*(k + 0.5), cx = e.a[0] + e.ux*c + e.nx*out, cz = e.a[1] + e.uz*c + e.nz*out;
        if (o.skip && o.skip(e, k, nb, y)) continue;
        const ax = cx - e.ux*ww/2, az = cz - e.uz*ww/2, bx = cx + e.ux*ww/2, bz = cz + e.uz*ww/2;
        T.q(o.col, [ax, ya, az], [bx, ya, bz], [bx, yb, bz], [ax, yb, az]);
        if (o.arch){ const r = ww/2, n = 6; for (let j = 0; j < n; j++){ const t0 = j/n*Math.PI, t1 = (j + 1)/n*Math.PI;
          T.t(o.col, [cx, yb, cz], [cx + e.ux*Math.cos(t0)*r, yb + Math.sin(t0)*r, cz + e.uz*Math.cos(t0)*r], [cx + e.ux*Math.cos(t1)*r, yb + Math.sin(t1)*r, cz + e.uz*Math.cos(t1)*r]); } }
        if (o.frame) T.q(o.frame, [ax - e.ux*0.12, ya - 0.18, az - e.uz*0.12], [bx + e.ux*0.12, ya - 0.18, bz + e.uz*0.12], [bx + e.ux*0.12 + e.nx*0.12, ya, bz + e.uz*0.12 + e.nz*0.12], [ax - e.ux*0.12 + e.nx*0.12, ya, az - e.uz*0.12 + e.nz*0.12]);
      } } } }
// is (x, z) at height y inside one of the parts [[base, top, ring], ...] (other than skip)?
function nsPip(P, x, z){ let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; }
function nsCovered(parts, x, z, y, skip){ for (const q of parts){ if (q === skip) continue; if (y >= Math.max(q[0], -5) - 0.01 && y < q[1] - 0.05 && nsPip(q[2], x, z)) return true; } return false; }
// horizontal band (cornice / string course) round P: depth d outward, from y to y + h
function nsBand(T, P, y, h, d, col, on){ const Q = nsOff(P, d), n = P.length, E = nsEdges(P);
  for (let i = 0; i < n; i++){ if (on && !on(E[i])) continue; const j = (i + 1) % n, a = P[i], b = P[j], A = Q[i], B = Q[j];
    T.q(col, [A[0], y, A[1]], [B[0], y, B[1]], [B[0], y + h, B[1]], [A[0], y + h, A[1]]);
    T.q(col, [a[0], y + h, a[1]], [b[0], y + h, b[1]], [B[0], y + h, B[1]], [A[0], y + h, A[1]]);
    T.q(col, [a[0], y, a[1]], [b[0], y, b[1]], [B[0], y, B[1]], [A[0], y, A[1]]); } }
// classic New York rooftop water tank on a steel stand
function nsTank(T, x, y, z, r, h, wood, steel){ for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) T.box(steel, x + dx*r*0.6, y, z + dz*r*0.6, 1, 0, 0.25, 3.2, 0.25);
  T.abox(steel, x - r*0.85, y + 3.0, z - r*0.85, x + r*0.85, y + 3.25, z + r*0.85); T.cyl(wood, x, y + 3.25, z, r, h, 10); T.cyl(wood, x, y + 3.25 + h, z, r*1.04, r*0.7, 10, 0.05); }
// low-poly street tree
function nsTree(T, x, y, z, s, leaf, trunk){ T.box(trunk, x, y, z, 1, 0, 0.3*s, 1.4*s, 0.3*s);
  const cy = y + 1.9*s, R = s; const V = [[0, R, 0], [R, 0, 0], [0, 0, R], [-R, 0, 0], [0, 0, -R], [0, -R*0.7, 0]];
  const F = [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]];
  for (const f of F) T.t(leaf, ...f.map(i => [x + V[i][0], cy + V[i][1], z + V[i][2]])); }
// =====================================================================================================================
// New Museum (2007, SANAA, 235 Bowery): seven rectangular boxes stacked off-centre, shifted back and forth and side to
// side, 53 m to the top; clad in silver anodised expanded-aluminium mesh over corrugated aluminium; clear-glass lobby at
// street level; skylit slots where an upper box is smaller than the one below; the Sky Room with its terrace on top.
// The OMA expansion (opened 2026, Rem Koolhaas / Shohei Shigematsu; 231 Bowery) on the lot directly south (not in the map
// data yet): one angular form, lower than the stack, in laminated glass over metal mesh; the street front sliced back over a
// small plaza, the upper half angled back from the Bowery with the zigzag stair behind large irregular windows.
// Frame: local +x from the Bowery front (west, x = -16.5) to the back of the lot; z across (+z = south). Lot 34 x 22 m.
const NM_LL = [40.722346, -73.992841, -0.3729];
LANDMARKS.nynewmuseum = {zh:'新当代艺术博物馆', en:'New Museum', cat:'new', r:34, h:53,
  lt:{m:0, c:'#e6efff', k:0.45, e:0.7},
  build(){
    const g = new THREE.Group(), T = nsTB();
    const MESH = {c:'#d3d5d0', m:0, lc:'#eef3ff', lk:0.38}, MESH2 = {c:'#c6c8c3', m:0, lc:'#eef3ff', lk:0.3}, EDGE = '#9c9e9a';
    const GLASS = {c:'#8fa6ad', glow:'#fff0d8', gk:0.85}, SKY = {c:'#c4d2d6', glow:'#fff6e8', gk:0.7}, ROOF = '#a4a6a2', DARK = '#3d4246';
    // the Bowery front is skewed: x = -15.36 at z = +11.29 to x = -17.55 at z = -11.05
    const fx = z => -15.36 + (11.29 - z)/22.34*(-2.19);
    // boxes: [x0, x1, z0, z1, y0, y1]  (x0 measured from the front line where it is the front)
    const BX = [[0, 16.4, -11.0, 11.25, 0, 8.0], [2.4, 16.4, -11.0, 9.6, 8.0, 15.5], [0, 13.0, -9.4, 11.25, 15.5, 23.5],
      [1.6, 16.4, -11.0, 10.4, 23.5, 32.5], [5.2, 14.6, -8.4, 9.8, 32.5, 38.5], [1.0, 12.0, -6.8, 10.8, 38.5, 44.5], [6.0, 14.2, -9.6, 7.4, 44.5, 50.6]];
    const poly = b => { const [x0, x1, z0, z1] = b; return [[fx(z0) + x0, z0], [x1, z0], [x1, z1], [fx(z1) + x0, z1]]; };
    // foundation
    T.prism(ROOF, poly([0, 16.4, -11.0, 11.25]), -5, 0, false);
    for (let i = 0; i < BX.length; i++){
      const b = BX[i], P = poly(b), y0 = i === 0 ? 4.8 : b[4], y1 = b[5];
      T.prism(i % 2 ? MESH2 : MESH, P, y0, y1, true, ROOF);
      // box edges: a thin darker frame line at top and bottom of every box (the mesh panels' edge profiles)
      nsBand(T, P, y1 - 0.25, 0.25, 0.08, EDGE); nsBand(T, P, y0, 0.2, 0.08, EDGE);
      // vertical mesh-panel joints every 1.5 m (very faint relief)
      for (const e of nsEdges(P)){ const n = Math.floor(e.L/1.5); for (let k = 1; k < n; k++){ const c = e.L*k/n, x = e.a[0] + e.ux*c + e.nx*0.04, z = e.a[1] + e.uz*c + e.nz*0.04;
        T.q(EDGE, [x - e.ux*0.04, y0 + 0.2, z - e.uz*0.04], [x + e.ux*0.04, y0 + 0.2, z + e.uz*0.04], [x + e.ux*0.04, y1 - 0.25, z + e.uz*0.04], [x - e.ux*0.04, y1 - 0.25, z - e.uz*0.04]); } }
      // skylight slots: where the next box does not cover this one's roof
      if (i < BX.length - 1){ const nb = BX[i + 1], yy = y1 + 0.12;
        const strips = [];
        if (nb[0] > b[0] + 0.3) strips.push([b[0], nb[0], Math.max(b[2], nb[2]), Math.min(b[3], nb[3])]);
        if (nb[1] < b[1] - 0.3) strips.push([nb[1], b[1], Math.max(b[2], nb[2]), Math.min(b[3], nb[3])]);
        if (nb[2] > b[2] + 0.3) strips.push([b[0], b[1], b[2], nb[2]]);
        if (nb[3] < b[3] - 0.3) strips.push([b[0], b[1], nb[3], b[3]]);
        for (const s of strips){ const Q = poly(s); T.flat(SKY, nsOff(Q, -0.35), yy); }
      }
    }
    // ground floor: clear glass lobby wall behind the steel line, the front fully glazed, the sides partly
    const G0 = poly([0.4, 16.0, -10.6, 10.85]);
    T.prism(GLASS, G0, 0, 4.8, false);
    for (const e of nsEdges(G0)){ const n = Math.max(1, Math.round(e.L/3.0)); for (let k = 0; k <= n; k++){ const c = e.L*k/n; T.box(DARK, e.a[0] + e.ux*c, 0, e.a[1] + e.uz*c, e.ux, e.uz, 0.14, 4.8, 0.18); } }
    T.flat(ROOF, nsOff(G0, 0.5), 4.8);
    // strip windows behind the mesh (education and office floors), the Sky Room's glass front toward the Bowery
    nsWin(T, poly(BX[4]), {y0:33.6, y1:37.6, fh:4.0, bw:9, wf:0.94, hf:0.5, sill:0.25, col:{c:'#5d6a70', m:1, fh:4.0, cw:3.0}, out:0.05});
    nsWin(T, poly(BX[5]), {y0:39.6, y1:43.6, fh:4.0, bw:9, wf:0.94, hf:0.45, sill:0.25, col:{c:'#5d6a70', m:1, fh:4.0, cw:3.0}, out:0.05});
    { const P = poly(BX[6]); T.q(GLASS, [P[0][0] - 0.05, 45.5, P[0][1]], [P[3][0] - 0.05, 45.5, P[3][1]], [P[3][0] - 0.05, 49.6, P[3][1]], [P[0][0] - 0.05, 49.6, P[0][1]]); }
    // Sky Room terrace railing on box 6, rooftop plant on box 7
    { const P = nsOff(poly(BX[5]), -0.3); for (const e of nsEdges(P)) T.box('#8e928f', (e.a[0] + e.b[0])/2, 44.6, (e.a[1] + e.b[1])/2, e.ux, e.uz, e.L, 1.1, 0.06); }
    T.abox('#8f918d', 7.5, 50.6, -6.5, 12.6, 52.8, 4.5); T.abox(EDGE, 8.4, 52.8, -5.6, 11.4, 53.0, 3.4);
    // the OMA wing on the lot to the south (z 11.4 .. 25.6): one angular form in laminated glass over metal mesh, lower than the
    // stack; the street front sliced back over a small plaza, the upper half angled back from the Bowery, the zigzag stair
    // behind large irregular windows in the sloped front; vertical mesh ribs
    { const SK = {c:'#c0c5c5', m:0, lc:'#eef3ff', lk:0.32}, RIB = '#a3a8a9', z0 = 11.4, z1 = 25.6, xb = 16.2, xa = fx(z0) + 0.2, xc = -14.9, Y1 = 23.5, Y2 = 44.0, SL = 11.0;
      T.prism(SK, [[xa + 3.5, z0], [xb, z0], [xb, z1], [xc + 3.5, z1]], -5, 5.5, false);
      T.prism(GLASS, [[xa + 3.6, z0 + 0.1], [xb, z0 + 0.1], [xb, z1 - 0.1], [xc + 3.6, z1 - 0.1]], 0, 5.4, false);
      T.prism(SK, [[xa, z0], [xb, z0], [xb, z1], [xc, z1]], 5.5, Y1, false); T.flat(ROOF, [[xa, z0], [xa + 3.5, z0], [xc + 3.5, z1], [xc, z1]], 5.5);
      const c = [[xa, Y1, z0], [xb, Y1, z0], [xb, Y1, z1], [xc, Y1, z1], [xa + SL, Y2, z0], [xb, Y2, z0], [xb, Y2, z1], [xc + SL, Y2, z1]];
      T.q(SK, c[0], c[3], c[7], c[4]); T.q(SK, c[0], c[1], c[5], c[4]); T.q(SK, c[1], c[2], c[6], c[5]); T.q(SK, c[3], c[2], c[6], c[7]); T.q(ROOF, c[4], c[5], c[6], c[7]);
      // mesh ribs on the sides and the back, floor lines aligned with the galleries
      for (const [P0, P1, nx, nz] of [[[xa, z0], [xb, z0], 0, -1], [[xb, z1], [xc, z1], 0, 1], [[xb, z0], [xb, z1], 1, 0]]){
        const L = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]), ux = (P1[0] - P0[0])/L, uz = (P1[1] - P0[1])/L, n = Math.round(L/0.9);
        if (nz < 0) continue;                                                       // the side against the SANAA building
        for (let k = 1; k < n; k++){ const x = P0[0] + ux*L*k/n, z = P0[1] + uz*L*k/n, top = nx ? Y2 : Y1 + (Y2 - Y1)*Math.max(0, Math.min(1, (x - xc)/SL)); T.box(RIB, x + nx*0.08, 5.5, z + nz*0.08, ux, uz, 0.14, top - 5.5, 0.16); } }
      for (const y of [15.5, 23.5, 32.5]) T.box(EDGE, xb + 0.1, y - 0.3, (z0 + z1)/2, 0, 1, z1 - z0, 0.3, 0.2);
      // large irregular windows on the Bowery front: the zigzag stair behind the sloped upper face and the lower front
      const fpt = (u, v) => { const z = z0 + 1.2 + u*(z1 - z0 - 2.4), y = Y1 + v*(Y2 - Y1), x0 = xa + (xc - xa)*(z - z0)/(z1 - z0); return [x0 + SL*v - 0.1, y, z]; };
      for (const [u0, v0, u1, v1] of [[0.05, 0.05, 0.55, 0.32], [0.45, 0.38, 0.95, 0.62], [0.08, 0.66, 0.6, 0.92]]) T.q(GLASS, fpt(u0, v0), fpt(u1, v0), fpt(u1, v1), fpt(u0, v1));
      for (const [za, zb, ya, yb] of [[13, 19.5, 7.0, 13.5], [17.5, 24.5, 15.0, 21.8]]){ const x = q => xa + (xc - xa)*(q - z0)/(z1 - z0) - 0.1; T.q(GLASS, [x(za), ya, za], [x(zb), ya, zb], [x(zb), yb, zb], [x(za), yb, za]); }
    }
    // entrance canopy-less: a thin steel fascia over the doors on the Bowery
    T.box(DARK, fx(0) - 0.3, 4.6, 0, 0, 1, 8, 0.25, 0.6);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nynewmuseum', lat:NM_LL[0], lon:NM_LL[1], rot:NM_LL[2]});
// =====================================================================================================================
// E. V. Haughwout Building (1857, J. P. Gaynor, cast iron by Daniel Badger; 488 Broadway at Broome Street): five storeys,
// 24 m, two cast-iron street fronts in "Turkish drab" modelled on Sansovino's library in Venice: on every upper floor a
// row of round-arched windows between small Corinthian colonnettes, framed by big engaged Corinthian columns carrying a full
// entablature, balustraded sills; the deep crowning cornice; cast-iron shopfronts at street level. 5 bays on Broadway,
// 8 on Broome Street. Frame: local -x = Broadway (west front), +z = Broome Street (south front); north and east are party walls.
const HW_LL = [40.721805, -73.999477, -0.4907];
LANDMARKS.nyhaughwout = {zh:'霍沃特大楼', en:'E. V. Haughwout Building', cat:'old', r:24, h:24.5,
  lt:{m:0, c:'#ffe1b5', k:0.62, e:0.7},
  build(){
    const g = new THREE.Group(), T = nsTB();
    const P = [[-15.3, 9.05], [-13.47, -11.08], [11.51, -8.9], [10.95, -3.16], [17.14, -2.61], [16.11, 9.05]];
    const IRON = '#cfc2a3', IRON2 = '#c2b494', SHADE = '#a89a7c', BRICK = '#86584a', ROOF = '#7d7a74';
    const WIN = {c:'#30353a', m:1, fh:4.4, cw:4.0}, SHOP = {c:'#4a5358', glow:'#ffe6c2', gk:0.9};
    const FL = [0, 5.6, 10.2, 14.6, 18.8, 22.6];
    // body: street fronts in cast iron, party walls in brick
    const E = nsEdges(P);
    for (const e of E){ const street = e.i === 0 || e.i === 5;
      T.q(street ? IRON : BRICK, [e.a[0], -5, e.a[1]], [e.b[0], -5, e.b[1]], [e.b[0], 22.6, e.b[1]], [e.a[0], 22.6, e.a[1]]); }
    T.flat(ROOF, P, 22.6);
    const fronts = [E[0], E[5]];
    for (const e of fronts){
      const nb = e.i === 0 ? 5 : 8, bw = e.L/nb;
      const at = (u, o, y) => [e.a[0] + e.ux*u + e.nx*o, y, e.a[1] + e.uz*u + e.nz*o];
      const bx = (col, u, o, y, L, h, d) => T.box(col, e.a[0] + e.ux*u + e.nx*o, y, e.a[1] + e.uz*u + e.nz*o, e.ux, e.uz, L, h, d);
      for (let f = 0; f < 5; f++){
        const y0 = FL[f], y1 = FL[f + 1], top = f === 0 ? y1 - 0.9 : y1 - 0.75;
        // entablature of the floor
        bx(IRON2, e.L/2, 0.3, top, e.L + 0.9, y1 - top, 0.6); bx(SHADE, e.L/2, 0.62, top + (y1 - top)*0.55, e.L + 1.1, 0.18, 0.3);
        for (let k = 0; k <= nb; k++){                    // big engaged columns between the bays (+ capital and base)
          const u = Math.min(e.L - 0.3, Math.max(0.3, k*bw)), cx = e.a[0] + e.ux*u + e.nx*0.32, cz = e.a[1] + e.uz*u + e.nz*0.32;
          T.cyl(IRON, cx, y0 + (f ? 0.5 : 0.1), cz, 0.27, top - y0 - (f ? 0.5 : 0.1) - 0.45, 8);
          bx(IRON2, u, 0.32, top - 0.45, 0.8, 0.45, 0.75); bx(IRON2, u, 0.32, y0 + (f ? 0.15 : 0.0), 0.7, 0.35, 0.72); }
        for (let k = 0; k < nb; k++){
          const c = (k + 0.5)*bw;
          if (f === 0){                                     // shopfront: glass between the columns, transom, bulkhead
            const w = bw - 0.8; T.q(SHOP, at(c - w/2, 0.05, 0.6), at(c + w/2, 0.05, 0.6), at(c + w/2, 0.05, top - 0.2), at(c - w/2, 0.05, top - 0.2));
            bx(IRON2, c, 0.12, 0, w, 0.6, 0.25); bx(SHADE, c, 0.12, 3.9, w, 0.14, 0.2);
            continue; }
          // arched window between colonnettes, balustraded sill below
          const ww = bw*0.5, ya = y0 + 0.95, spring = top - 0.3 - ww/2 - 0.25;
          T.q(WIN, at(c - ww/2, 0.06, ya), at(c + ww/2, 0.06, ya), at(c + ww/2, 0.06, spring), at(c - ww/2, 0.06, spring));
          for (let j = 0; j < 6; j++){ const t0 = j/6*Math.PI, t1 = (j + 1)/6*Math.PI, r = ww/2;
            T.t(WIN, at(c, 0.06, spring), at(c + Math.cos(t0)*r, 0.06, spring + Math.sin(t0)*r), at(c + Math.cos(t1)*r, 0.06, spring + Math.sin(t1)*r));
            // archivolt (moulded arch round the window)
            const r2 = r + 0.22; T.q(IRON2, at(c + Math.cos(t0)*r, 0.14, spring + Math.sin(t0)*r), at(c + Math.cos(t1)*r, 0.14, spring + Math.sin(t1)*r), at(c + Math.cos(t1)*r2, 0.14, spring + Math.sin(t1)*r2), at(c + Math.cos(t0)*r2, 0.14, spring + Math.sin(t0)*r2)); }
          bx(IRON2, c, 0.18, spring + ww/2 + 0.05, 0.28, 0.5, 0.3);                       // keystone
          for (const s of [-1, 1]){ const u = c + s*(ww/2 + 0.2); T.cyl(IRON, e.a[0] + e.ux*u + e.nx*0.16, ya, e.a[1] + e.uz*u + e.nz*0.16, 0.12, spring - ya, 6); bx(IRON2, u, 0.16, spring - 0.25, 0.36, 0.25, 0.3); }
          bx(IRON2, c, 0.2, y0 + 0.35, ww + 0.9, 0.6, 0.4);                                  // balustraded sill
          for (let j = 0; j < 5; j++) bx(SHADE, c - ww/2 + (j + 0.5)*ww/5, 0.42, y0 + 0.4, 0.12, 0.45, 0.05);
        }
      }
      // the crowning cornice with brackets
      bx(IRON2, e.L/2, 0.6, 22.6, e.L + 2.0, 0.9, 1.2); bx(IRON, e.L/2, 0.8, 23.5, e.L + 2.4, 0.5, 1.6); bx(SHADE, e.L/2, 0.2, 21.8, e.L, 0.8, 0.4);
      const nbr = Math.round(e.L/1.3); for (let k = 0; k <= nbr; k++) bx(IRON2, k*e.L/nbr, 0.75, 21.9, 0.25, 0.7, 1.1);
      bx(IRON, e.L/2, 0.2, 24.0, e.L + 0.4, 0.5, 0.4);                                       // parapet
    }
    // roof: bulkhead and skylight
    T.abox('#8b877f', 4, 22.6, -4, 9, 25.2, 1); T.abox('#b9c4c6', -8, 22.6, -6, -2, 23.4, 4);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nyhaughwout', lat:HW_LL[0], lon:HW_LL[1], rot:HW_LL[2]});
// =====================================================================================================================
// Whitney Museum of American Art (2015, Renzo Piano; 99 Gansevoort Street): nine storeys, ~52 m, clad in long pale
// blue-grey steel panels; tall and closed toward the Hudson (west); the four lower floors are smaller and the five upper ones
// cantilever over them toward the east and south (the 5th-floor gallery, the largest, reaches over the glazed lobby and the
// "largo" plaza at the High Line's south end); above it the galleries (floors 5-8) get smaller, stepping down to the east in
// terraces linked by outdoor stairs that face the High Line; north-light sawtooth skylights over the top-floor gallery; the
// plant on the west roof; the low service building on the north-east. Frame: +x east (toward the High Line, which starts ~15 m beyond the east end), +z south (Gansevoort Street).
const WH_LL = [40.739616, -74.008965, -0.0447];
function nsClipX(P, c, keepLess, ax){            // Sutherland-Hodgman against the plane x = c (ax = 1: z = c)
  const k = ax || 0, out = [], inS = p => keepLess ? p[k] <= c : p[k] >= c;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], ia = inS(a), ib = inS(b);
    if (ia) out.push(a); if (ia !== ib){ const t = (c - a[k])/(b[k] - a[k]), q = [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t]; q[k] = c; out.push(q); } }
  return out; }
LANDMARKS.nywhitney = {zh:'惠特尼美国艺术博物馆', en:'Whitney Museum of American Art', cat:'new', r:60, h:53,
  lt:{m:0, c:'#e8f0ff', k:0.35, e:0.6},
  build(){
    const g = new THREE.Group(), T = nsTB();
    const R = [[-40.64, 17.13], [-40.61, 2.21], [-25.96, -21.57], [7.71, -20.87], [7.81, -23.08], [16.03, -22.95], [17.75, -22.52], [17.48, -8.4], [45.62, -7.95], [45.48, -2.34], [42.37, -2.4], [42.14, 17.13]];
    const STEEL = {c:'#a3b3bb', m:0, lc:'#e8f0ff', lk:0.45}, STEEL2 = {c:'#93a4ad', m:0, lc:'#e8f0ff', lk:0.38}, SEAM = '#7f8f97';
    const GL = {c:'#56666e', m:1, fh:4.5, cw:3.0}, LOBBY = {c:'#7f9399', glow:'#fff0d6', gk:0.9}, DECK = '#b9b3a8', RAIL = '#c8d2d4', DARK = '#3e4448';
    // levels: [y0, y1, east limit]
    const LV = [[6.0, 20.5, 21], [20.5, 28.0, 99], [28.0, 34.5, 30], [34.5, 41.0, 15], [41.0, 47.0, 1]];
    const LOW = nsClipX(nsClipX(R, 21, true), 14.6, true, 1);
    const lvP = L => L[2] > 90 ? R : L[2] === 21 ? LOW : nsClipX(R, L[2], true);
    T.prism(DARK, nsOff(LOW, -1.2), -5, 0.2, true, '#9d9890');
    // ground floor: glass lobby set back under the overhang, a solid service core at the north-west
    const G = nsOff(LOW, -1.6);
    T.prism(LOBBY, G, 0, 6.0, false);
    for (const e of nsEdges(G)){ const n = Math.max(1, Math.round(e.L/3)); for (let k = 0; k <= n; k++) T.box(DARK, e.a[0] + e.ux*e.L*k/n, 0, e.a[1] + e.uz*e.L*k/n, e.ux, e.uz, 0.15, 6.0, 0.2); }
    T.abox(STEEL2, -38, 0, -6, -22, 6.0, 12);
    for (let i = 0; i < LV.length; i++){
      const [y0, y1] = LV[i], P = lvP(LV[i]);
      T.prism(i % 2 ? STEEL2 : STEEL, P, y0, y1, true, DECK);
      // long horizontal panel seams
      for (let y = y0 + 1.6; y < y1 - 0.3; y += 1.6) nsBand(T, P, y, 0.12, 0.04, SEAM);
      nsBand(T, P, y1 - 0.3, 0.3, 0.12, SEAM);
      const E = nsEdges(P);
      // glazing: the east face of every gallery floor opens onto its terrace; office strips on Gansevoort; river windows
      for (const e of E){
        const east = e.nx > 0.9, south = e.nz > 0.9, west = e.nx < -0.7;
        let ya = -1, yb = -1, u0 = 0, u1 = e.L;
        if (east && i > 0){ ya = y0 + 0.4; yb = y1 - 0.6; u0 = 0.8; u1 = e.L - 0.8; }
        else if (south && i === 0){ ya = 11.2; yb = 15.4; u0 = 4; u1 = e.L - 3; }
        else if (west && i === 1){ ya = y0 + 1.2; yb = y1 - 1.4; u0 = 2; u1 = e.L - 2; }
        else if (west && i === 3 && e.L > 10){ ya = y0 + 1.5; yb = y1 - 1.5; u0 = e.L*0.3; u1 = e.L*0.85; }
        else if (south && (i === 2 || i === 4)){ ya = y0 + 1.6; yb = y1 - 1.6; u0 = e.L*0.55; u1 = e.L - 1.5; }
        if (ya < 0 || u1 - u0 < 1) continue;
        const A = [e.a[0] + e.ux*u0 + e.nx*0.06, e.a[1] + e.uz*u0 + e.nz*0.06], B = [e.a[0] + e.ux*u1 + e.nx*0.06, e.a[1] + e.uz*u1 + e.nz*0.06];
        T.q(GL, [A[0], ya, A[1]], [B[0], ya, B[1]], [B[0], yb, B[1]], [A[0], yb, A[1]]);
        const nm = Math.max(1, Math.round((u1 - u0)/3)); for (let k = 0; k <= nm; k++){ const u = u0 + (u1 - u0)*k/nm; T.box(DARK, e.a[0] + e.ux*u + e.nx*0.1, ya, e.a[1] + e.uz*u + e.nz*0.1, e.ux, e.uz, 0.12, yb - ya, 0.12); }
      }
      // terrace on the roof of this level where the next level steps back (east side): deck, glass rail, planters
      if (i < LV.length - 1){ const xe = LV[i + 1][2], Q = nsClipX(P, xe, false); if (Q.length > 2){
        const yy = y1 + 0.05; T.flat(DECK, nsOff(Q, -0.2), yy);
        for (const e of nsEdges(Q)) if (Math.abs(e.ux) > 0.5 || e.nx > 0.5) if (!(Math.abs(e.a[0] - xe) < 0.2 && Math.abs(e.b[0] - xe) < 0.2))
          T.box(RAIL, (e.a[0] + e.b[0])/2 - e.nx*0.25, yy, (e.a[1] + e.b[1])/2 - e.nz*0.25, e.ux, e.uz, e.L, 1.15, 0.08);
        // outdoor stair down to the next terrace, along the north edge
        if (i >= 1){ const zN = Math.max(...Q.map(p => p[1] < 0 ? p[1] : -99)) + 1.0, ytop = LV[i + 1][1], run = Math.min(10, (LV[i][2] - xe) - 2.5), n = 14;
          if (run > 3) for (let s = 0; s < n; s++){ const x0 = xe + run*s/n, x1 = xe + run*(s + 1)/n, h = ytop - (ytop - yy)*(s + 1)/n;
            T.abox('#8a969c', x0, Math.max(yy, h - 0.6), zN, x1 + 0.02, h, zN + 1.7); }
          if (run > 3) for (const zz of [zN, zN + 1.7]) T.q(RAIL, [xe, ytop + 1.0, zz], [xe + run, yy + 1.0, zz], [xe + run, yy + 1.1, zz], [xe, ytop + 1.1, zz]); }
      } }
    }
    // the low service building on the north-east, beside the High Line (real OSM footprint, 13.8 m): it lies under this
    // model's ground-plan hull, so it is rebuilt here in the same steel cladding
    { const NE = [[17.44, -8.41], [17.7, -22.54], [53.88, -21.75], [53.5, -7.82]];
      T.prism(STEEL2, NE, -3, 13.8, true, '#8f9a9e'); for (let y = 1.6; y < 13; y += 1.6) nsBand(T, NE, y, 0.12, 0.04, SEAM);
      nsWin(T, NE, {y0:0.4, y1:13.0, fh:4.3, bw:6, wf:0.7, hf:0.55, col:GL, out:0.06, min:8, on:e => e.nx > 0.5 || e.nz < -0.5}); }
    // the cantilever's soffit over the largo and along Gansevoort Street, with the steel edge
    T.flat(STEEL2, nsClipX(R, 21, false), 20.5); T.flat(STEEL2, nsClipX(nsClipX(R, 21, true), 14.6, false, 1), 20.5);
    T.box(DARK, 45.0, 20.0, 4.5, 0, 1, 24, 0.6, 0.8);
    // top floor: north-light sawtooth skylights over the gallery, plant on the west
    const TOP = lvP(LV[4]); const xs0 = Math.min(...TOP.map(p => p[0])) + 1.2, xs1 = -1.5;
    const xw = z => (z >= 2.21 ? -40.6 : -40.61 + (2.21 - z)/23.78*14.65) + 1.2;
    for (let z = -18.5; z < 13; z += 4.2){ const a = Math.max(xs0, xw(z)), b = Math.max(xs0, xw(z + 4.2));
      T.q({c:'#c9d6da', glow:'#fff3e0', gk:0.5}, [a, 47.0, z], [xs1, 47.0, z], [xs1, 48.8, z + 0.6], [a, 48.8, z + 0.6]);
      T.q(STEEL2, [a, 48.8, z + 0.6], [xs1, 48.8, z + 0.6], [xs1, 47.0, z + 4.2], [b, 47.0, z + 4.2]); T.t(STEEL2, [a, 47.0, z], [a, 48.8, z + 0.6], [b, 47.0, z + 4.2]); }
    T.prism(STEEL2, [[-38.5, 15], [-38.5, 3], [-31, -9], [-24, -9], [-24, 15]], 47, 52.5, true, '#7f8a8e');
    for (let y = 47.8; y < 52; y += 0.7) nsBand(T, [[-38.5, 15], [-38.5, 3], [-31, -9], [-24, -9], [-24, 15]], y, 0.1, 0.05, SEAM);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nywhitney', lat:WH_LL[0], lon:WH_LL[1], rot:WH_LL[2]});
// =====================================================================================================================
// IAC Building (2007, Frank Gehry; 555 West 18th Street, on Eleventh Avenue between 18th and 19th Streets): ten storeys,
// ~45 m, a cluster of white "sails": a broad lower volume (floors 1-5) and a narrower upper one (floors 6-10), both with
// pleated, twisting walls of cold-warped glass whose ceramic frit fades from white at the slabs to clear at eye level, so
// the building reads as soft white bands; a clear-glass lobby. 100 Eleventh Avenue faces it across 19th Street (north).
// Frame: Midtown grid, +x along the streets to the east, -x = Eleventh Avenue front, -z = north (19th Street).
const IAC_LL = [40.74558, -74.007711, -0.506];
LANDMARKS.nyiac = {zh:'IAC大楼', en:'IAC Building', cat:'new', r:42, h:46.5,
  lt:{m:0, c:'#e4eeff', k:0.5, e:0.75},
  build(){
    const g = new THREE.Group(), T = nsTB();
    const LO = [[-11.66, 21.3], [-12.63, 19.33], [-10.77, 15.89], [-16.77, 8.36], [-14.89, 5.15], [-21.08, -2.52], [-19.24, -5.59], [-25.29, -13.21], [-22.63, -17.89], [-26.34, -20.06], [-28.87, -23.58], [-24.57, -24.7], [-19.44, -25.14], [-12.61, -24.36], [-8.66, -23.23], [-4.51, -27.7], [11.28, -27.88], [10.44, -9.8], [12.25, -8.18], [9.64, -2.16], [12.7, 5.63], [11.62, 7.6], [28.27, 7.52], [28.33, 25.78], [12.57, 25.82], [8.78, 21.87], [-0.31, 24.85], [-8.29, 25.72]];
    const UP = [[-12.94, 9.9], [-14.61, 0.08], [-16.57, -0.56], [-18.46, -9.34], [-21.06, -11.56], [-19.67, -21.02], [-15.31, -20.57], [-11.47, -20.87], [-8.31, -21.14], [-1.0, -23.02], [2.45, -18.64], [8.4, -13.48], [5.89, -7.28], [8.87, 0.78], [8.98, 7.58], [19.14, 8.58], [19.77, 10.75], [19.54, 12.82], [17.21, 18.11], [8.05, 13.13], [7.87, 16.31], [-3.1, 9.93], [-5.54, 13.57], [-10.02, 12.28]];
    const FRIT = {c:'#eef2f0', m:0, lc:'#e4eeff', lk:0.42}, FRIT2 = {c:'#e3e9e8', m:0, lc:'#e4eeff', lk:0.36};
    const CLEAR = {c:'#a3b4ba', m:1, fh:4.4, cw:1.6}, LOBBY = {c:'#7d9198', glow:'#f4f7ff', gk:0.9}, ROOF = '#cfd2cf', MUL = '#b8bebd';
    // vertex miter directions (clamped) for the warp
    const mDir = P => { const Q = nsOff(P, 1); return Q.map((q, i) => { let dx = q[0] - P[i][0], dz = q[1] - P[i][1]; const l = Math.hypot(dx, dz); if (l > 1.8){ dx *= 1.8/l; dz *= 1.8/l; } return [dx, dz]; }); };
    // a twisted sail volume: rings from y0 to y1, each vertex bulging / leaning by its own phase; top inset (curling crown)
    const vol = (P, y0, y1, A, inset, glassFrom, flr) => {
      const M = mDir(P), n = P.length, NR = 7, rings = [];
      for (let r = 0; r <= NR; r++){ const t = r/NR, y = y0 + (y1 - y0)*t;
        rings.push(P.map((p, i) => { const ph = i*0.9 + Math.sin(i*1.7)*0.8, s = Math.sin(Math.PI*t + ph)*A - Math.max(0, t - 0.75)/0.25*inset;
          return [p[0] + M[i][0]*s, y, p[1] + M[i][1]*s]; })); }
      const at = (i, y) => { let r = 0; while (r < NR - 1 && rings[r + 1][0][1] < y) r++; const a = rings[r], b = rings[r + 1], u = (y - a[0][1])/(b[0][1] - a[0][1]);
        return [a[i][0] + (b[i][0] - a[i][0])*u, y, a[i][2] + (b[i][2] - a[i][2])*u]; };
      for (let r = 0; r < NR; r++) for (let i = 0; i < n; i++){ const j = (i + 1) % n; T.q(i % 3 ? FRIT : FRIT2, rings[r][i], rings[r][j], rings[r + 1][j], rings[r + 1][i]); }
      // clear-glass band at mid-storey on every floor (pushed out 6 cm along the surface normal approx.)
      const Mi = mDir(P);
      for (let f = 0; f < flr; f++){ const ya = y0 + glassFrom + f*(y1 - y0 - glassFrom)/flr, fh = (y1 - y0 - glassFrom)/flr, b0 = ya + fh*0.36, b1 = ya + fh*0.66;
        if (b1 > y1 - 0.4) break;
        for (let i = 0; i < n; i++){ const j = (i + 1) % n, A0 = at(i, b0), B0 = at(j, b0), A1 = at(i, b1), B1 = at(j, b1);
          const o = (v, k) => [v[0] + Mi[k][0]*0.06, v[1], v[2] + Mi[k][1]*0.06];
          T.q(CLEAR, o(A0, i), o(B0, j), o(B1, j), o(A1, i)); } }
      // vertical mullion lines at the pleat corners
      for (let i = 0; i < n; i++) for (let r = 0; r < NR; r++){ const a = rings[r][i], b = rings[r + 1][i]; T.q(MUL, [a[0] - 0.08, a[1], a[2]], [a[0] + 0.08, a[1], a[2]], [b[0] + 0.08, b[1], b[2]], [b[0] - 0.08, b[1], b[2]]); }
      return rings[NR];
    };
    T.prism('#9a9d9b', LO, -5, 0.2, false);
    // lobby: clear glass on the avenue front and the corners
    const L0 = nsOff(LO, -0.8); T.prism(LOBBY, L0, 0, 5.2, false); T.flat('#a7aba8', LO, 0.15);
    const top1 = vol(LO, 5.2, 25.0, 1.1, 0.6, 0, 4);
    T.flat(ROOF, top1.map(p => [p[0], p[2]]), 25.0);
    // roof terrace edge on the lower volume
    for (const e of nsEdges(top1.map(p => [p[0], p[2]]))) T.box('#dfe3e0', (e.a[0] + e.b[0])/2 - e.nx*0.3, 25.0, (e.a[1] + e.b[1])/2 - e.nz*0.3, e.ux, e.uz, e.L, 1.1, 0.1);
    const top2 = vol(UP, 25.0, 44.5, 1.3, 1.4, 0, 5);
    const TP = top2.map(p => [p[0], p[2]]);
    T.flat(ROOF, TP, 44.5);
    // rooftop: a white screen round the plant, set back
    T.prism('#e6e9e6', nsRect(-12, -15, 4, 6), 44.5, 46.5, true, '#b8bcba');
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nyiac', lat:IAC_LL[0], lon:IAC_LL[1], rot:IAC_LL[2]});
// =====================================================================================================================
// 100 Eleventh Avenue (2010, Jean Nouvel; at 19th Street, across 19th Street from the IAC Building): 23 storeys, 76 m,
// a bent slab whose curved south-west face (toward the Hudson and 19th Street) is a "pixelated" curtain wall of ~1,650 panes
// of 32 sizes, each tilted a few degrees in stainless frames; the north and east faces are black brick with punched windows of
// assorted sizes; a freestanding seven-storey screen of tilted panes along the sidewalks encloses the planted atrium (the
// "loggia"); a low wing at the back. Frame: Midtown grid, -x = Eleventh Avenue, +z = south (19th Street).
const H100_LL = [40.746174, -74.007611, -0.506];
LANDMARKS.ny100eleventh = {zh:'第十一大道100号', en:'100 Eleventh Avenue', cat:'new', r:34, h:80,
  lt:{m:0, c:'#dfe8ff', k:0.3, e:0.6},
  build(){
    const g = new THREE.Group(), T = nsTB(), rng = LMCTX.rng;
    const TW = [[-23.02, -13.3], [-15.11, 6.55], [-13.38, 8.22], [-10.73, 9.5], [-7.83, 10.18], [20.46, 10.28], [20.5, -1.4], [2.97, -1.06], [-14.1, -8.76], [-14.2, -13.27]];
    const H = 75.7, FH = H/23;
    const PANE = [{c:'#5e7580', m:1, fh:3.3, cw:1.6}, {c:'#7a8e96', m:1, fh:3.3, cw:1.6}, {c:'#4b5d67', m:1, fh:3.3, cw:1.6}, {c:'#93a3a8', m:0, lc:'#dfe8ff', lk:0.2}];
    const FRAME = '#a9aeb0', BRICK = '#262628', BWIN = {c:'#4f5a60', m:1, fh:3.3, cw:2.0}, ROOF = '#55585a';
    // the tower: curtain-wall edges 0..4 (outer curve), brick elsewhere
    const E = nsEdges(TW);
    for (const e of E){ const cw = e.i <= 4;
      T.q(cw ? FRAME : BRICK, [e.a[0], -5, e.a[1]], [e.b[0], -5, e.b[1]], [e.b[0], H, e.b[1]], [e.a[0], H, e.a[1]]); }
    T.flat(ROOF, TW, H);
    // pixelated curtain wall: rows of 1.64 m, columns of random width, each pane tilted
    const panes = (e, y0, y1, out, gap) => {
      for (let y = y0; y < y1 - 0.5; y += FH/2){ let u = 0; const ya = y + 0.05, yb = Math.min(y1, y + FH/2) - 0.05;
        while (u < e.L - 0.3){ let w = 0.8 + Math.floor(rng()*4)*0.55; if (u + w > e.L - 0.4) w = e.L - u; if (w < 0.3) break;
          if (gap && rng() < gap){ u += w; continue; }
          const t1 = (rng() - 0.5)*0.22*w, t2 = (rng() - 0.5)*0.14, tilt = (rng() - 0.5)*0.18;
          const P0 = [e.a[0] + e.ux*(u + 0.05), e.a[1] + e.uz*(u + 0.05)], P1 = [e.a[0] + e.ux*(u + w - 0.05), e.a[1] + e.uz*(u + w - 0.05)];
          const o0 = out + 0.1 + Math.max(0, -t1) + tilt, o1 = out + 0.1 + Math.max(0, t1) + tilt, o2 = t2 > 0 ? t2 : 0, o3 = t2 < 0 ? -t2 : 0;
          const col = PANE[rng() < 0.08 ? 3 : Math.floor(rng()*3)];
          T.q(col, [P0[0] + e.nx*(o0 + o3), ya, P0[1] + e.nz*(o0 + o3)], [P1[0] + e.nx*(o1 + o3), ya, P1[1] + e.nz*(o1 + o3)],
            [P1[0] + e.nx*(o1 + o2), yb, P1[1] + e.nz*(o1 + o2)], [P0[0] + e.nx*(o0 + o2), yb, P0[1] + e.nz*(o0 + o2)]);
          u += w; } } };
    for (const e of E) if (e.i <= 4) panes(e, 0.5, H - 0.6, 0, 0);
    for (const e of E) if (e.i <= 4) for (let y = FH; y < H; y += FH) T.box(FRAME, (e.a[0] + e.b[0])/2 + e.nx*0.2, y - 0.08, (e.a[1] + e.b[1])/2 + e.nz*0.2, e.ux, e.uz, e.L, 0.16, 0.3);
    // black brick faces: punched windows of assorted sizes
    for (const e of E){ if (e.i <= 4 || e.L < 3) continue;
      for (let f = 0; f < 23; f++){ const y = f*FH; let u = 1.0;
        while (u < e.L - 1.5){ const w = 0.9 + rng()*2.6, h = 1.0 + rng()*1.4; if (u + w > e.L - 0.8) break;
          if (rng() < 0.75){ const ya = y + 0.5 + rng()*(FH - h - 0.7), o = 0.05 + rng()*0.12;
            T.q(BWIN, [e.a[0] + e.ux*u + e.nx*o, ya, e.a[1] + e.uz*u + e.nz*o], [e.a[0] + e.ux*(u + w) + e.nx*(o + 0.1), ya, e.a[1] + e.uz*(u + w) + e.nz*(o + 0.1)],
              [e.a[0] + e.ux*(u + w) + e.nx*(o + 0.1), ya + h, e.a[1] + e.uz*(u + w) + e.nz*(o + 0.1)], [e.a[0] + e.ux*u + e.nx*o, ya + h, e.a[1] + e.uz*u + e.nz*o]); }
          u += w + 0.6 + rng()*1.6; } } }
    // the stepped north end pieces (67 / 69 m) and the low rear wing (10 m) in black brick
    T.prism(BRICK, [[-14.12, -11.49], [-14.2, -13.27], [-6.99, -13.26], [-6.77, -8.13]], -2, 67.0, true, ROOF);
    T.prism(BRICK, [[-14.1, -8.76], [-14.12, -11.49], [-6.77, -8.13], [-6.67, -5.67]], -2, 69.0, true, ROOF);
    const LW = [[-6.67, -5.67], [-6.99, -13.26], [20.45, -13.26], [20.5, -1.4], [2.97, -1.06]];
    T.prism(BRICK, LW, -2, 10.0, true, '#4a5a44');
    nsWin(T, LW, {y0:0.5, y1:9.5, fh:3.3, bw:3.2, wf:0.5, hf:0.5, col:BWIN, on:e => e.nz < -0.5 || e.nx > 0.5});
    for (let i = 0; i < 6; i++) nsTree(T, 2 + i*3.2, 10.0, -9.5 + (i % 2)*3, 1.1, '#4f7340', '#5a4a3b');
    // rooftop
    T.prism('#3a3c3e', [[7.44, 5.15], [7.26, -1.16], [18.27, -1.31], [18.31, 4.96]], H, 78.0, true, ROOF);
    T.prism('#3a3c3e', [[-7.15, 2.14], [-4.02, -4.39], [2.97, -1.06], [-0.16, 5.47]], H, 80.0, true, ROOF);
    // the freestanding screen along the sidewalks (west and south property lines), 0-20 m, and the atrium trees
    const SC2 = [[-25.88, -13.31], [-14.64, 14.41], [20.43, 14.76]];
    for (let s = 0; s < 2; s++){ const a = SC2[s], b = SC2[s + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
      const e = {a, b, L, ux:dx/L, uz:dz/L, nx:-dz/L, nz:dx/L};
      panes(e, 3.3, 20.0, -0.15, 0.12);
      for (let y = 0; y <= 20.01; y += FH) T.box(FRAME, (a[0] + b[0])/2, Math.min(y, 19.8), (a[1] + b[1])/2, e.ux, e.uz, L, 0.2, 0.25);
      for (let u = 0; u <= L + 0.01; u += 3.0) T.box(FRAME, a[0] + e.ux*u, 0, a[1] + e.uz*u, e.ux, e.uz, 0.22, 20, 0.3); }
    for (const [x, z] of [[-19, -6], [-16.5, 2], [-12, 12.2], [-3, 12.4], [6, 12.4], [14, 12.5]]) nsTree(T, x, 0, z, 1.8, '#4b6e3d', '#5a4a3b');
    T.prism('#77746e', [[-25.88, -13.31], [-14.64, 14.41], [20.43, 14.76], [20.46, 10.28], [-7.83, 10.18], [-13.38, 8.22], [-15.11, 6.55], [-23.02, -13.3]], -3, 0.1, true, '#8d8a83');
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'ny100eleventh', lat:H100_LL[0], lon:H100_LL[1], rot:H100_LL[2]});
// =====================================================================================================================
// Hotel Chelsea (1884, Hubert, Pirsson & Co.; 222 West 23rd Street): twelve storeys of red brick in Queen Anne Revival,
// the 23rd Street front in three slightly projecting pavilions, the long rows of black cast-iron balconies with their
// floral railings across every floor, the steep roof with gabled dormers, the pavilions' gables and tall chimneys; shopfronts
// and the entrance canopy at street level; the vertical blade sign (frame and red/white glow only, no letters).
// Frame: Midtown grid, -z = north = the 23rd Street front; +x east.
const CH_LL = [40.744316, -73.996883, -0.506];
LANDMARKS.nychelsea = {zh:'切尔西酒店', en:'Hotel Chelsea', cat:'old', r:34, h:53,
  lt:{m:0, c:'#ffd9a8', k:0.55, e:0.55},
  build(){
    const g = new THREE.Group(), T = nsTB();
    const P = [[-26.24, 12.27], [-26.25, -11.28], [-25.39, -11.18], [-25.47, -14.0], [-19.15, -13.95], [-19.19, -12.56], [-3.38, -12.52], [-3.4, -13.99], [4.39, -13.96], [4.41, -12.49], [20.07, -12.48], [20.01, -14.04], [27.21, -14.04], [27.21, 12.37], [19.29, 12.31], [19.25, 11.41], [-1.92, 11.37], [-1.97, 15.62], [-18.66, 15.62], [-18.72, 12.22]];
    const BRICK = '#8c3f2e', BRICK2 = '#7a3628', TRIM = '#c9b394', IRON = '#1d2022', SLATE = '#4a4744', ROOF = '#5e5a55';
    const WIN = {c:'#2f3337', m:1, fh:3.55, cw:2.6}, SHOP = {c:'#56605f', glow:'#ffe2b8', gk:0.9};
    const TOP = 41.5, FL = [0, 4.8]; for (let f = 2; f <= 11; f++) FL.push(4.8 + (f - 1)*3.67);
    T.prism(BRICK, P, -5, TOP, true, ROOF);
    const E = nsEdges(P), front = e => e.nz < -0.9, back = e => e.nz > 0.9;
    // string courses and the main cornice
    for (let f = 2; f < FL.length; f++) nsBand(T, P, FL[f] - 0.25, 0.25, 0.08, TRIM, front);
    nsBand(T, P, TOP - 1.2, 1.2, 0.5, TRIM, front); nsBand(T, P, TOP - 1.5, 0.3, 0.3, BRICK2, front);
    nsBand(T, P, 4.4, 0.45, 0.2, TRIM, front);
    // windows: front and back, floors 2-11
    nsWin(T, P, {y0:4.8, y1:TOP - 1.5, fh:3.67, bw:2.6, wf:0.48, hf:0.62, sill:0.18, col:WIN, out:0.06, min:2.0, on:e => front(e) || back(e), frame:TRIM});
    // the iron balconies: floors 2-10 across the recessed front between and on the pavilions
    for (let f = 1; f < FL.length - 1; f++){ const yb = FL[f + 1] - 0.05;
      for (const e of E){ if (!front(e) || e.L < 5) continue;
        const cx = (e.a[0] + e.b[0])/2, cz = (e.a[1] + e.b[1])/2;
        T.box('#3a3a3a', cx + e.nx*0.55, yb - 0.15, cz + e.nz*0.55, e.ux, e.uz, e.L - 0.4, 0.15, 1.1);                  // slab
        T.box(IRON, cx + e.nx*1.08, yb, cz + e.nz*1.08, e.ux, e.uz, e.L - 0.4, 1.05, 0.06);                            // railing
        T.box(IRON, cx + e.nx*1.08, yb + 1.0, cz + e.nz*1.08, e.ux, e.uz, e.L - 0.4, 0.07, 0.14);
        const n = Math.round(e.L/1.6); for (let k = 0; k <= n; k++){ const u = -e.L/2 + 0.2 + (e.L - 0.4)*k/n; T.box(IRON, cx + e.ux*u + e.nx*0.6, yb - 0.4, cz + e.uz*u + e.nz*0.6, e.ux, e.uz, 0.08, 0.3, 1.0); } } }
    // ground floor: shopfronts and the entrance under the canopy (centre pavilion)
    for (const e of E){ if (!front(e) || e.L < 5) continue; const n = Math.max(1, Math.round(e.L/4.5));
      for (let k = 0; k < n; k++){ const u0 = e.L*k/n + 0.4, u1 = e.L*(k + 1)/n - 0.4;
        T.q(SHOP, [e.a[0] + e.ux*u0 + e.nx*0.06, 0.4, e.a[1] + e.uz*u0 + e.nz*0.06], [e.a[0] + e.ux*u1 + e.nx*0.06, 0.4, e.a[1] + e.uz*u1 + e.nz*0.06],
          [e.a[0] + e.ux*u1 + e.nx*0.06, 3.9, e.a[1] + e.uz*u1 + e.nz*0.06], [e.a[0] + e.ux*u0 + e.nx*0.06, 3.9, e.a[1] + e.uz*u0 + e.nz*0.06]); } }
    T.abox(IRON, -2.6, 3.5, -17.6, 3.6, 3.8, -14.0); T.abox({c:'#3a3530', glow:'#ffe7c4', gk:0.8}, -2.5, 3.2, -17.5, 3.5, 3.5, -14.05);
    for (const x of [-2.4, 3.4]) T.box(IRON, x, 0, -17.4, 1, 0, 0.1, 3.5, 0.1);
    // the vertical blade sign: dark frame, glowing red faces with white border tubes, no letters
    { const x = 0.4, z = -15.4, y0 = 8.6, y1 = 21.0;
      T.abox('#2a2a2c', x - 0.22, y0, z - 2.1, x + 0.22, y1, z + 0.2);
      for (const s of [-1, 1]){ T.q({c:'#7a2020', glow:'#ff3a2a', gk:1.6}, [x + s*0.24, y0 + 0.4, z - 1.9], [x + s*0.24, y0 + 0.4, z], [x + s*0.24, y1 - 0.4, z], [x + s*0.24, y1 - 0.4, z - 1.9]);
        for (const zz of [z - 1.95, z + 0.05]) T.q({c:'#d8d8d0', glow:'#fff4e8', gk:1.4}, [x + s*0.26, y0 + 0.3, zz], [x + s*0.26, y0 + 0.3, zz + 0.1*(zz > z - 1 ? -1 : 1)], [x + s*0.26, y1 - 0.3, zz + 0.1*(zz > z - 1 ? -1 : 1)], [x + s*0.26, y1 - 0.3, zz]); }
      T.box('#2a2a2c', x, y1, z - 0.95, 0, 1, 2.3, 0.6, 0.6); for (const yy of [y0 + 2, y1 - 2]) T.box(IRON, x, yy, z + 0.6, 0, 1, 1.2, 0.08, 0.08); }
    // roof: steep slate slope behind the cornice, the pavilions rising into gables, dormers and chimneys
    const pav = [[-25.45, -19.17], [-3.39, 4.4], [20.04, 27.21]];
    for (const [x0, x1] of [[-19.17, -3.39], [4.4, 20.04]]){                            // slopes between the pavilions
      T.q(SLATE, [x0, TOP, -12.5], [x1, TOP, -12.5], [x1, TOP + 6.0, -8.0], [x0, TOP + 6.0, -8.0]);
      for (let x = x0 + 2.5; x < x1 - 2; x += 4.2){ T.abox(BRICK, x - 0.8, TOP + 1.0, -11.9, x + 0.8, TOP + 3.6, -9.6); gable(g, x, -10.7, 2.3, 1.8, TOP + 3.6, 1.1, SLATE, Math.PI/2); } }
    T.abox(ROOF, -26.2, TOP, -8.0, 27.2, TOP + 6.0, 12.3);
    for (const [x0, x1] of pav){ const z0 = -14.0, cx = (x0 + x1)/2, w = x1 - x0;
      T.abox(BRICK, x0, TOP, z0, x1, TOP + 6.5, z0 + 8); nsWin(T, nsRect(x0, z0, x1, z0 + 8), {y0:TOP + 0.8, y1:TOP + 6, fh:3.0, bw:2.4, wf:0.45, hf:0.6, col:WIN, on:e => e.nz < -0.9});
      gable(g, cx, z0 + 4, 8.4, w + 0.4, TOP + 6.5, 4.5, SLATE, Math.PI/2);
      T.q(TRIM, [x0, TOP + 6.5, z0 - 0.05], [x1, TOP + 6.5, z0 - 0.05], [cx, TOP + 10.9, z0 - 0.05], [cx, TOP + 10.9, z0 - 0.05]); }
    for (const [x, z] of [[-22.5, -3], [-12, 2], [0.5, -5], [12, 2], [23.5, -3], [-8, 9], [8, 9]]) { T.abox(BRICK2, x - 0.9, TOP + 5, z - 0.7, x + 0.9, 52.5, z + 0.7); T.abox(TRIM, x - 1.05, 52.1, z - 0.85, x + 1.05, 52.5, z + 0.85); }
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nychelsea', lat:CH_LL[0], lon:CH_LL[1], rot:CH_LL[2]});
// =====================================================================================================================
// Chelsea Market (the former National Biscuit Company / Nabisco complex, 1890-1930s, converted 1997; the whole block from
// Ninth to Tenth Avenue, 15th to 16th Street): some eighteen joined factory buildings of red and brown brick, 5-11 storeys,
// on the real OSM building parts (measured heights): segmental and round-arched windows, brick piers, corbelled cornices,
// rooftop water tanks and bulkheads; the loading-dock canopies along 15th and 16th Streets, the Ninth Avenue entrance.
// At the Tenth Avenue end the High Line runs THROUGH the block: the building is open between 5.5 and 14 m there (the
// "Chelsea Market Passage"); the viaduct itself is the nyhighline5 model and is left untouched.
// Frame: Midtown grid, +x east (Ninth Avenue at x = +122), -x = Tenth Avenue, -z = north (16th Street), +z = 15th Street.
const CM = {"ll":[40.742558,-74.006052,-0.506],"ring":[[-122.19,31.51],[-122.14,12.62],[-121.75,6.11],[-122.38,-30.93],[122.09,-31.48],[122.13,30.91]],"parts":[[26.0,29.0,[[-93.96,26.95],[-93.97,-6.89],[-79.15,-6.98],[-79.2,4.48],[-62.78,4.41],[-62.81,26.84]]],[0.0,5.5,[[-120.2,12.0],[-122.38,-30.93],[-107.15,-30.68],[-107.15,14.71]]],[26.0,29.0,[[-107.15,14.71],[-107.16,1.91],[-108.77,1.89],[-108.79,-4.96],[-107.18,-4.94],[-107.22,-17.6],[-100.82,-17.61],[-100.85,-29.83],[-94.0,-29.85],[-93.95,14.6]]],[0.0,5.5,[[-122.19,31.51],[-122.14,12.62],[-107.15,14.71],[-93.95,14.6],[-93.99,31.65]]],[14.0,26.0,[[-122.19,31.51],[-122.14,12.62],[-121.33,6.45],[-121.71,-30.96],[-107.15,-30.68],[-107.19,31.77]]],[0.0,26.0,[[-107.15,14.71],[-107.15,-30.68],[-59.66,-30.81],[-59.69,-15.59],[-64.84,-15.6],[-64.84,-7.14],[-69.4,-7.12],[-69.4,4.43],[-62.78,4.41],[-62.84,31.54],[-93.99,31.65],[-93.95,14.6]]],[26.0,33.0,[[-98.28,-12.61],[-98.32,-16.59],[-90.48,-16.48],[-90.58,-12.54]]],[29.0,33.0,[[-97.56,0.25],[-97.43,-5.08],[-90.31,-5.03],[-90.39,0.39]]],[26.0,29.0,[[-101.37,31.74],[-101.35,25.79],[-93.97,25.7],[-93.99,31.65]]],[23.0,26.0,[[-62.84,31.54],[-62.81,22.72],[-52.65,22.7],[-52.68,31.52]]],[0.0,23.0,[[-62.84,31.54],[-62.82,8.67],[6.32,8.42],[6.31,31.3]]],[0.0,35.0,[[-64.84,-7.14],[-64.84,-15.6],[-59.69,-15.59],[-59.66,-30.81],[6.39,-31.06],[6.39,-1.56],[-59.8,-1.35],[-59.82,-7.17]]],[0.0,28.0,[[52.81,2.78],[52.8,-31.28],[83.06,-31.35],[82.98,2.76]]],[0.0,37.7,[[90.85,30.98],[90.9,-0.49],[122.14,-0.65],[122.13,30.91]]],[0.0,8.0,[[91.69,-15.78],[91.74,-31.36],[122.09,-31.48],[122.12,-15.95]]],[0.0,15.0,[[82.98,2.76],[83.06,-31.35],[91.74,-31.36],[91.69,-15.78],[122.12,-15.95],[122.14,-0.65],[90.9,-0.49],[90.95,2.69]]],[0.0,8.0,[[-69.4,4.43],[-69.4,-7.12],[-59.82,-7.17],[-59.8,-1.35],[6.39,-1.56],[6.32,8.42],[-62.82,8.67],[-62.78,4.41]]],[0.0,30.0,[[6.31,31.3],[6.39,-31.06],[52.8,-31.28],[52.81,2.78],[90.95,2.69],[90.85,30.98]]],[5.5,26.0,[[-107.19,31.77],[-107.15,14.71],[-93.95,14.6],[-93.99,31.65]]]]};
LANDMARKS.nychelseamkt = {zh:'切尔西市场', en:'Chelsea Market', cat:'old', r:135, h:47,
  lt:{m:0, c:'#ffd6a0', k:0.42, e:0.6},
  build(){
    const g = new THREE.Group(), T = nsTB(), rng = LMCTX.rng;
    const BR = ['#8a4636', '#7b4032', '#93573f', '#9c6a52', '#84402f'], TRIM = '#b8a184', ROOF = '#6d6862', DARK = '#2c2f31';
    const WIN = {c:'#33393c', m:1, fh:4.2, cw:3.2}, SHOP = {c:'#4e5a5c', glow:'#ffdcae', gk:0.95};
    const onPer = e => { const mx = (e.a[0] + e.b[0])/2, mz = (e.a[1] + e.b[1])/2; return Math.abs(mz) > 29.5 || Math.abs(mx) > 120; };
    const hid = q => (e, k, nb, y) => { const u = (k + 0.5)*e.L/nb; return nsCovered(CM.parts, e.a[0] + e.ux*u + e.nx*0.4, e.a[1] + e.uz*u + e.nz*0.4, y + 2, q); };
    CM.parts.forEach((q, i) => {
      const [b0, t0, R] = q, base = b0 > 0 ? b0 : -4, col = BR[i % BR.length];
      if (t0 - Math.max(b0, 0) < 0.5) return;
      T.prism(col, R, base, t0, true, ROOF); if (b0 > 0) T.flat(DARK, R, b0);
      if (t0 - b0 > 6){
        const y0 = b0 > 0 ? b0 + 0.6 : 5.6, fh = 4.2, nfl = Math.max(1, Math.floor((t0 - 1.8 - y0)/fh));
        const top = y0 + nfl*fh;
        if (nfl > 1) nsWin(T, R, {y0, y1:top - fh, fh, bw:3.4, wf:0.55, hf:0.58, sill:0.22, col:WIN, out:0.06, min:4, frame:TRIM, skip:hid(q)});
        nsWin(T, R, {y0:top - fh, y1:top, fh, bw:3.4, wf:0.5, hf:0.42, sill:0.2, col:WIN, out:0.06, min:4, arch:true, skip:hid(q)});
        const vis = e => !nsCovered(CM.parts, (e.a[0] + e.b[0])/2 + e.nx*0.6, (e.a[1] + e.b[1])/2 + e.nz*0.6, t0 - 0.5, q);
        nsBand(T, R, t0 - 1.0, 0.7, 0.35, TRIM, vis); nsBand(T, R, t0 - 0.3, 0.3, 0.1, col, vis);
        // brick piers between the window bays on the street fronts
        for (const e of nsEdges(R)){ if (!onPer(e) || e.L < 8) continue; const n = Math.round(e.L/6.8);
          for (let k = 1; k < n; k++){ const u = e.L*k/n; T.box(col, e.a[0] + e.ux*u + e.nx*0.2, Math.max(0, b0), e.a[1] + e.uz*u + e.nz*0.2, e.ux, e.uz, 0.9, t0 - 1.0 - Math.max(0, b0), 0.4); } }
      }
    });
    // ground floor: shopfronts / old loading docks on the street fronts with steel canopies along 15th and 16th Streets
    const ring = CM.ring;
    for (const e of nsEdges(ring)){ if (e.L < 10) continue; const n = Math.round(e.L/5.5), side = Math.abs(e.nz) > 0.9;
      for (let k = 0; k < n; k++){ const u0 = e.L*k/n + 0.5, u1 = e.L*(k + 1)/n - 0.5;
        T.q(SHOP, [e.a[0] + e.ux*u0 + e.nx*0.07, 0.3, e.a[1] + e.uz*u0 + e.nz*0.07], [e.a[0] + e.ux*u1 + e.nx*0.07, 0.3, e.a[1] + e.uz*u1 + e.nz*0.07],
          [e.a[0] + e.ux*u1 + e.nx*0.07, 3.6, e.a[1] + e.uz*u1 + e.nz*0.07], [e.a[0] + e.ux*u0 + e.nx*0.07, 3.6, e.a[1] + e.uz*u0 + e.nz*0.07]); }
      if (side){ const x0 = Math.max(-104, Math.min(e.a[0], e.b[0])), x1 = Math.min(118, Math.max(e.a[0], e.b[0])), zc = (e.a[1] + e.b[1])/2;
        for (let x = x0; x < x1 - 8; x += 34){ const xe = Math.min(x1, x + 30), zz = zc + e.nz*0.6;
          T.abox('#3b3f41', x, 4.3, Math.min(zc, zz + e.nz*0.6), xe, 4.6, Math.max(zc, zz + e.nz*0.6));
          T.abox({c:'#4a4a46', glow:'#ffe6c0', gk:0.5}, x + 0.5, 4.2, Math.min(zc, zz + e.nz*0.5), xe - 0.5, 4.3, Math.max(zc, zz + e.nz*0.5));
          } } }
    // Ninth Avenue entrance: dark arched opening and a steel canopy
    { const x = 122.2; T.q(DARK, [x + 0.08, 0, -4], [x + 0.08, 0, 4], [x + 0.08, 5.2, 4], [x + 0.08, 5.2, -4]);
      for (let j = 0; j < 8; j++){ const a0 = j/8*Math.PI, a1 = (j + 1)/8*Math.PI; T.t(DARK, [x + 0.08, 5.2, 0], [x + 0.08, 5.2 + Math.sin(a0)*4, Math.cos(a0)*4], [x + 0.08, 5.2 + Math.sin(a1)*4, Math.cos(a1)*4]); }
      T.abox('#3b3f41', x, 4.4, -7, x + 1.4, 4.8, 7); T.abox({c:'#4a4a46', glow:'#ffe6c0', gk:0.7}, x + 0.1, 4.3, -6.6, x + 1.3, 4.4, 6.6); }
    // the market concourse (the low 8 m strip through the middle of the block): a row of skylight monitors on its roof
    for (let x = -64; x < 2; x += 6.5){ T.abox(ROOF, x, 8.0, -4.6, x + 4.6, 8.9, 5.6); T.q(SHOP, [x, 8.9, -4.6], [x + 4.6, 8.9, -4.6], [x + 4.6, 9.9, 0.5], [x, 9.9, 0.5]);
      T.q(SHOP, [x, 9.9, 0.5], [x + 4.6, 9.9, 0.5], [x + 4.6, 8.9, 5.6], [x, 8.9, 5.6]); }
    // rooftop water tanks and bulkheads (on the high parts)
    for (const [x, z, y] of [[-25, -20, 35], [-40, -12, 35], [70, -18, 28], [105, 14, 37.7], [-80, -16, 26]]) nsTank(T, x, y, z, 2.4, 4.2, '#6e5b47', '#2e2f30');
    for (const [x, z, y] of [[-12, -14, 35], [30, 12, 30], [-55, 20, 23], [100, 22, 37.7]]) T.abox('#7a5244', x - 3, y, z - 2.5, x + 3, y + 3.2, z + 2.5);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nychelseamkt', lat:CM.ll[0], lon:CM.ll[1], rot:CM.ll[2]});
// =====================================================================================================================
// Starrett-Lehigh Building (1931, R. G. & W. M. Cory with Yasuo Matsui; 601 West 26th Street, the whole block from
// Eleventh to Twelfth Avenue, 26th to 27th Street): a freight terminal of 19 storeys (90 m) in the central "utilities"
// section, 18 in the east wing, 9 in the west; the lower seven floors fill the block, the street fronts in five sections
// (1st, 3rd, 5th projecting, 2nd and 4th recessed above the 8th floor) with polygonal S-curve corners; the famous
// continuous ribbon windows (green steel sash) between red-brick spandrel bands on cantilevered slabs; the central tower
// with vertical brick piers and the steel water tanks on top; truck bays at street level (the truck elevators served every
// floor) and the old rail entrance. OSM building parts give the setbacks. Frame: grid, -x = Twelfth Avenue (west),
// +z = 26th Street (south).
const SL = {"ll":[40.751586,-74.006557,-0.506],"ring":[[-88.77,29.02],[-101.65,-26.83],[-101.45,-28.32],[-100.28,-29.31],[93.59,-29.15],[94.63,-28.93],[95.65,-27.9],[95.83,27.91],[95.55,28.87],[94.2,29.73],[-87.02,30.11]],"parts":[[0.0,90.7,[[-14.56,17.28],[-14.52,12.81],[-9.6,12.82],[-9.62,8.03],[22.07,8.08],[22.0,22.4],[-9.86,22.46],[-9.91,17.22]]],[0.0,38.0,[[-39.85,30.04],[-38.34,28.63],[-38.1,24.73],[-37.61,23.77],[-36.78,23.19],[-9.91,23.4],[-9.86,29.89]]],[0.0,38.0,[[21.97,29.97],[22.09,23.38],[50.57,23.61],[51.57,23.97],[52.14,24.8],[52.45,28.86],[53.19,29.59],[54.15,29.86]]],[66.0,81.0,[[-30.63,17.16],[-30.94,16.19],[-30.68,-16.77],[-29.95,-17.52],[-28.98,-17.83],[-9.56,-17.84],[-9.81,18.42],[-28.93,18.16],[-29.89,17.89]]],[85.0,90.7,[[-8.34,-16.69],[-8.69,-18.55],[-7.59,-20.07],[-5.73,-20.42],[-4.08,-19.51],[-3.59,-17.6],[-4.51,-15.95],[-5.61,-15.46],[-6.86,-15.45]]],[85.0,90.7,[[4.01,-16.67],[3.75,-18.59],[4.29,-19.68],[5.37,-20.4],[7.35,-20.35],[8.57,-18.97],[8.69,-17.09],[7.41,-15.7],[5.45,-15.52]]],[85.0,90.7,[[16.5,-16.62],[16.2,-18.4],[17.34,-20.06],[19.21,-20.4],[20.77,-19.44],[21.25,-17.54],[20.85,-16.4],[19.9,-15.64],[17.99,-15.38]]],[85.0,90.7,[[-8.5,6.15],[-8.84,4.28],[-8.22,3.14],[-7.13,2.42],[-5.25,2.52],[-3.94,3.85],[-3.9,5.78],[-5.1,7.12],[-7.01,7.38]]],[85.0,90.7,[[-8.15,-5.82],[-8.52,-7.1],[-8.17,-8.32],[-6.79,-9.55],[-4.9,-9.45],[-3.59,-8.11],[-3.47,-6.24],[-4.75,-4.84],[-6.72,-4.67]]],[0.0,66.0,[[-30.6,22.17],[-30.94,16.19],[-30.67,-21.69],[-29.99,-22.53],[-29.02,-22.84],[-9.5,-22.9],[-9.91,23.4],[-28.9,23.17],[-29.85,22.9]]],[0.0,38.0,[[-57.52,-23.73],[-57.89,-28.1],[-58.46,-28.93],[-59.46,-29.29],[-8.79,-29.24],[-9.76,-28.94],[-10.49,-28.19],[-10.81,-24.24],[-11.41,-23.45],[-12.37,-22.92],[-55.82,-22.73],[-56.78,-23.0]]],[0.0,75.0,[[-12.65,-17.85],[-11.43,-18.75],[-10.76,-21.87],[-9.5,-22.9],[22.37,-22.73],[23.25,-21.16],[23.25,-18.88],[24.0,-18.15],[24.95,-17.87]]],[0.0,38.0,[[23.62,-23.99],[23.36,-27.97],[22.1,-29.21],[54.82,-29.17],[53.26,-28.07],[52.8,-24.16],[52.12,-23.32],[51.24,-22.84],[25.28,-22.86]]],[0.0,49.0,[[-12.37,-22.92],[-11.41,-23.45],[-10.81,-24.24],[-10.49,-28.19],[-9.76,-28.94],[-8.79,-29.24],[22.1,-29.21],[23.36,-27.97],[23.62,-23.99],[25.28,-22.86]]],[0.0,64.0,[[-9.91,26.71],[-9.91,23.4],[22.09,23.38],[21.96,26.66]]],[45.0,51.0,[[-86.86,3.38],[-86.8,-1.68],[-79.95,-1.7],[-79.92,3.31]]],[0.0,52.0,[[-9.86,29.89],[-9.91,26.71],[21.96,26.66],[21.97,29.97]]],[81.0,83.0,[[22.08,5.21],[22.15,-2.71],[80.64,-3.0],[80.57,4.93]]],[85.0,89.0,[[-0.63,3.85],[-0.57,-3.27],[17.33,-3.36],[17.24,3.89]]],[0.0,78.0,[[-9.91,23.4],[-9.86,22.46],[22.0,22.4],[22.09,23.38]]],[66.0,81.0,[[22.14,18.1],[22.22,-17.85],[57.6,-18.58],[58.52,-18.98],[59.07,-19.86],[59.4,-22.56],[60.04,-23.25],[61.05,-23.7],[87.82,-23.67],[89.15,-22.92],[89.53,-21.42],[89.28,22.28],[88.87,23.2],[88.14,23.94],[60.62,24.21],[59.75,23.67],[59.26,22.79],[59.21,19.39],[58.55,18.62],[57.64,18.21]]],[0.0,66.0,[[22.09,23.38],[22.37,-22.73],[51.24,-22.84],[52.12,-23.32],[52.8,-24.16],[53.26,-28.07],[54.82,-29.17],[93.59,-29.15],[94.63,-28.93],[95.41,-28.33],[95.79,-26.83],[95.83,27.91],[95.21,29.28],[93.75,29.75],[54.15,29.86],[53.19,29.59],[52.45,28.86],[52.14,24.8],[51.57,23.97],[50.57,23.61]]],[0.0,45.0,[[-88.77,29.02],[-101.65,-26.83],[-101.45,-28.32],[-100.77,-29.15],[-99.8,-29.46],[-59.46,-29.29],[-58.46,-28.93],[-57.89,-28.1],[-57.76,-24.17],[-57.19,-23.34],[-56.32,-22.8],[-29.02,-22.84],[-30.38,-22.2],[-30.94,-20.74],[-30.94,16.19],[-30.76,21.68],[-30.27,22.56],[-28.9,23.17],[-36.24,23.13],[-37.22,23.44],[-38.1,24.73],[-38.34,28.63],[-39.85,30.04],[-87.02,30.11],[-88.02,29.75]]],[0.0,85.0,[[-9.62,8.03],[-9.49,-21.65],[22.2,-21.61],[22.07,8.08]]],[45.0,48.0,[[-79.99,11.24],[-79.94,-7.65],[-38.05,-7.77],[-38.16,-1.99],[-34.62,-2.01],[-34.56,11.1]]]]};
LANDMARKS.nystarrett = {zh:'斯塔瑞特-利哈伊大楼', en:'Starrett-Lehigh Building', cat:'old', r:110, h:91,
  lt:{m:0, c:'#ffe0b0', k:0.35, e:0.6},
  build(){
    const g = new THREE.Group(), T = nsTB();
    const BRICK = {c:'#9a4c37', m:0, lc:'#ffd8a8', lk:0.35}, BRICK2 = {c:'#8c4432', m:0, lc:'#ffd8a8', lk:0.32}, SLAB = '#bdb5a8', ROOF = '#6f6a64';
    const GLASS = {c:'#3c4b47', m:1, fh:4.45, cw:3.0}, SASH = '#2d4a3e', DARK = '#26292a', TANK = '#5d5f5e';
    const FH = 4.45, G0 = 5.6;                                  // ground floor 5.6 m, then 4.45 m floors
    for (const PT of SL.parts){ const [b0, t0, R] = PT;
      if (t0 - b0 < 0.5) continue;
      const tank = R.length >= 9 && b0 >= 84 && t0 - b0 < 7;
      if (tank){ let cx = 0, cz = 0; for (const p of R){ cx += p[0]/R.length; cz += p[1]/R.length; } const r = Math.hypot(R[0][0] - cx, R[0][1] - cz);
        for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) T.box(DARK, cx + dx*r*0.55, b0, cz + dz*r*0.55, 1, 0, 0.3, 2.2, 0.3);
        T.cyl(TANK, cx, b0 + 2.2, cz, r, t0 - b0 - 3.0, 10); T.cyl(TANK, cx, t0 - 0.8, cz, r, 0.8, 10, 0.3); continue; }
      const base = b0 > 0 ? b0 : -5, tower = t0 >= 74 && b0 === 0;
      T.prism(tower ? BRICK2 : BRICK, R, base, t0, true, ROOF);
      if (t0 - b0 < 5) continue;
      const E = nsEdges(R).filter(e => e.L > 2.5);
      for (let y = b0 > 0 ? b0 : G0; y + 3.2 < t0 - 0.6; y += FH){
        for (const e of E){
          const mx = (e.a[0] + e.b[0])/2 + e.nx*0.4, mz = (e.a[1] + e.b[1])/2 + e.nz*0.4;
          if (nsCovered(SL.parts, mx, mz, y + 2.2, PT)) continue;
          // concrete slab edge line
          T.q(SLAB, [e.a[0] + e.nx*0.05, y, e.a[1] + e.nz*0.05], [e.b[0] + e.nx*0.05, y, e.b[1] + e.nz*0.05], [e.b[0] + e.nx*0.05, y + 0.3, e.b[1] + e.nz*0.05], [e.a[0] + e.nx*0.05, y + 0.3, e.a[1] + e.nz*0.05]);
          if (tower && e.L > 8){                              // tower: vertical piers, smaller windows
            const n = Math.round(e.L/2.6); for (let k = 0; k < n; k++){ const u0 = e.L*k/n + 0.5, u1 = e.L*(k + 1)/n - 0.5;
              T.q(GLASS, [e.a[0] + e.ux*u0 + e.nx*0.06, y + 1.4, e.a[1] + e.uz*u0 + e.nz*0.06], [e.a[0] + e.ux*u1 + e.nx*0.06, y + 1.4, e.a[1] + e.uz*u1 + e.nz*0.06],
                [e.a[0] + e.ux*u1 + e.nx*0.06, y + 3.8, e.a[1] + e.uz*u1 + e.nz*0.06], [e.a[0] + e.ux*u0 + e.nx*0.06, y + 3.8, e.a[1] + e.uz*u0 + e.nz*0.06]); }
            continue; }
          // ribbon window: continuous band, green sash mullions every ~1.6 m
          const ya = y + 1.75, yb = y + FH - 0.15;
          T.q(GLASS, [e.a[0] + e.nx*0.12, ya, e.a[1] + e.nz*0.12], [e.b[0] + e.nx*0.12, ya, e.b[1] + e.nz*0.12], [e.b[0] + e.nx*0.12, yb, e.b[1] + e.nz*0.12], [e.a[0] + e.nx*0.12, yb, e.a[1] + e.nz*0.12]);
          if (e.L > 4){ const n = Math.round(e.L/1.6); for (let k = 1; k < n; k++){ const u = e.L*k/n, x = e.a[0] + e.ux*u + e.nx*0.17, z = e.a[1] + e.uz*u + e.nz*0.17;
            T.q(SASH, [x - e.ux*0.06, ya, z - e.uz*0.06], [x + e.ux*0.06, ya, z + e.uz*0.06], [x + e.ux*0.06, yb, z + e.uz*0.06], [x - e.ux*0.06, yb, z - e.uz*0.06]); }
            T.q(SASH, [e.a[0] + e.nx*0.1, ya + 1.15, e.a[1] + e.nz*0.1], [e.b[0] + e.nx*0.1, ya + 1.15, e.b[1] + e.nz*0.1], [e.b[0] + e.nx*0.1, ya + 1.25, e.b[1] + e.nz*0.1], [e.a[0] + e.nx*0.1, ya + 1.25, e.a[1] + e.nz*0.1]); }
        } }
      nsBand(T, R, t0 - 0.6, 0.6, 0.15, SLAB);
    }
    // street level: truck bays and loading platforms on 26th and 27th Streets, the old rail entrance on Twelfth Avenue
    const ring = SL.ring;
    for (const e of nsEdges(ring)){ if (e.L < 20) continue; const n = Math.round(e.L/7.5);
      for (let k = 0; k < n; k++){ const u0 = e.L*k/n + 0.8, u1 = e.L*(k + 1)/n - 0.8, bay = k % 3 === 1;
        T.q(bay ? DARK : {c:'#4f5a58', glow:'#ffe2b8', gk:0.75}, [e.a[0] + e.ux*u0 + e.nx*0.08, bay ? 0 : 1.0, e.a[1] + e.uz*u0 + e.nz*0.08], [e.a[0] + e.ux*u1 + e.nx*0.08, bay ? 0 : 1.0, e.a[1] + e.uz*u1 + e.nz*0.08],
          [e.a[0] + e.ux*u1 + e.nx*0.08, 4.6, e.a[1] + e.uz*u1 + e.nz*0.08], [e.a[0] + e.ux*u0 + e.nx*0.08, 4.6, e.a[1] + e.uz*u0 + e.nz*0.08]); }
      if (Math.abs(e.nz) > 0.9) T.box('#3f4446', (e.a[0] + e.b[0])/2 + e.nx*0.6, 4.7, (e.a[1] + e.b[1])/2 + e.nz*0.6, e.ux, e.uz, e.L - 8, 0.3, 1.2); }
    // the 10th-floor roof terrace on the west wing: planters
    for (let x = -95; x < -40; x += 8) T.abox('#56704a', x, 45.0, -6, x + 5, 45.8, -3);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nystarrett', lat:SL.ll[0], lon:SL.ll[1], rot:SL.ll[2]});
// =====================================================================================================================
// Pier 57 (1952, Emil Praeger; Hudson River at 15th Street, reopened 2022-23): the long two-storey pier shed riding on its
// hollow concrete caissons (a T in plan), the brick-clad headhouse along the bulkhead (Hudson River Park), the rounded
// metal-clad river end; mid-century bands of steel windows over the glazed former cargo doors; on top the 2.5-acre rooftop
// park: lawns, planting beds, trees, paths, railings and the stair / elevator pavilions; the ramp up from the park.
// OSM building parts give the heights. Frame: +x = east (the shore), -x = out into the river, local rot -0.1385.
const P57 = {"ll":[40.743532,-74.010177,-0.1385],"ring":[[-157.72,9.46],[-158.52,0.08],[-157.79,-9.21],[-156.52,-14.54],[-155.25,-16.33],[-151.56,-18.05],[51.12,-17.83],[59.97,-35.42],[59.75,-56.59],[100.95,-57.29],[101.89,56.67],[59.73,56.29],[59.9,18.4],[-151.62,18.4],[-155.21,16.58],[-156.48,14.74]],"parts":[[0.0,8.0,[[-157.72,9.46],[-158.52,0.08],[-157.79,-9.21],[-156.52,-14.54],[-155.25,-16.33],[-153.49,-17.48],[-151.56,-18.05],[-151.62,18.4],[-155.21,16.58],[-156.48,14.74]]],[0.0,14.0,[[51.03,18.53],[51.12,-17.83],[59.57,-18.0],[59.74,-24.08],[84.78,-24.04],[84.82,-57.06],[100.95,-57.29],[101.89,56.67],[84.3,56.5],[84.68,18.68]]],[17.0,20.0,[[-45.3,1.77],[-45.28,-3.18],[-42.77,-3.23],[-42.78,1.72]]],[17.0,19.0,[[-37.64,3.12],[-37.69,-4.44],[-33.05,-4.48],[-33.1,3.1]]],[0.0,17.0,[[-151.62,18.4],[-151.56,-18.05],[51.12,-17.83],[51.03,18.53]]],[17.0,20.0,[[-62.65,1.86],[-62.64,-3.09],[-60.12,-3.13],[-60.12,1.91]]],[0.0,10.0,[[59.73,56.29],[59.9,18.4],[84.68,18.68],[84.3,56.5]]],[17.0,21.0,[[-42.79,3.13],[-42.73,-4.45],[-37.69,-4.44],[-37.64,3.12]]],[17.0,21.0,[[-67.83,3.09],[-67.78,-4.49],[-62.63,-4.5],[-62.69,3.08]]],[10.0,12.5,[[51.12,-17.83],[59.97,-35.42],[59.75,-56.59],[66.0,-56.66],[65.87,-35.84],[55.94,-18.0]]],[14.0,17.0,[[89.72,17.17],[89.87,-15.76],[85.83,-15.81],[85.85,-21.46],[89.89,-21.42],[89.9,-19.2],[101.4,-19.29],[101.32,17.07]]],[0.0,10.0,[[51.12,-17.83],[59.97,-35.42],[59.75,-56.59],[84.82,-57.06],[84.78,-24.04],[59.74,-24.08],[59.57,-18.0]]],[0.0,7.0,[[-97.66,7.15],[-97.72,-7.79],[-30.19,-7.91],[-30.23,7.04]]],[0.0,7.0,[[-123.89,11.61],[-123.92,7.78],[-102.54,7.63],[-102.41,11.44]]],[0.0,7.0,[[-123.62,-8.12],[-123.63,-11.85],[-102.15,-12.02],[-102.13,-8.28]]]]};
LANDMARKS.nypier57 = {zh:'57号码头', en:'Pier 57', cat:'new', r:165, h:21,
  lt:{m:0, c:'#ffe4bf', k:0.5, e:0.8},
  build(){
    const g = new THREE.Group(), T = nsTB(), rng = LMCTX.rng;
    // keep the east face (bulkhead) at x <= 100.3 so the ground-plan hull (+3 m) stays off the park esplanade at x ~ 104
    const XE = 100.3, cl = R => R.map(p => [Math.min(p[0], XE), p[1]]);
    P57.ring = cl(P57.ring); for (const q of P57.parts) q[2] = cl(q[2]);
    const CONC = '#cfc9be', CONC2 = '#bdb7ab', CAIS = '#8e8a82', STEEL = '#5d6966', BRICK = '#8d5a46', ROOF = '#9b968d';
    const GL = {c:'#46545a', m:1, fh:7.0, cw:3.0}, GL2 = {c:'#56666b', glow:'#ffe5c0', gk:0.8};
    const LAWN = '#6f8f4a', BED = '#5d7a43', PATH = '#c8c0b0', RAIL = '#3f4746';
    // caissons: concrete box under everything, down into the river
    const CR = cl(nsOff(P57.ring, 0.6)); T.prism(CAIS, CR, -7, 0.8, false); T.flat(CAIS, CR, 0.8);
    for (const [b0, t0, R] of P57.parts){
      if (t0 === 7) continue;                                  // interior pieces of the shed
      const head = R.some(p => p[0] > 52), base = b0 > 0 ? b0 : 0.8;
      if (b0 === 10 && t0 === 12.5){                           // the ramp / stair structure from the park up to the roof
        T.prism(CONC2, R, 0.8, 10.0, true, PATH); T.prism(STEEL, nsOff(R, -0.3), 10.0, 11.2, false); continue; }
      if (t0 === 8){                                           // the rounded river end: ribbed metal enclosure with a glass band
        T.prism('#a9adab', R, base, t0, true, ROOF); const E8 = nsEdges(R);
        for (const e of E8){ if (e.nx > 0.3) continue; T.q(GL2, [e.a[0] + e.nx*0.06, 2.2, e.a[1] + e.nz*0.06], [e.b[0] + e.nx*0.06, 2.2, e.b[1] + e.nz*0.06], [e.b[0] + e.nx*0.06, 5.6, e.b[1] + e.nz*0.06], [e.a[0] + e.nx*0.06, 5.6, e.a[1] + e.nz*0.06]);
          const n = Math.max(1, Math.round(e.L/1.4)); for (let k = 0; k <= n; k++){ const u = e.L*k/n; T.box(STEEL, e.a[0] + e.ux*u + e.nx*0.12, base, e.a[1] + e.uz*u + e.nz*0.12, e.ux, e.uz, 0.18, t0 - base, 0.25); } }
        continue; }
      T.prism(head && b0 === 0 ? BRICK : (b0 >= 17 ? '#a9adab' : CONC), R, base, t0, true, ROOF);
      if (b0 >= 14){ if (b0 >= 17) nsWin(T, R, {y0:b0 + 0.5, y1:t0 - 0.3, fh:t0 - b0 - 0.8, bw:2.0, wf:0.8, hf:0.9, sill:0.05, col:GL2, out:0.05, min:1.5}); continue; }
      if (t0 - b0 < 6) continue;
      const E = nsEdges(R);
      if (head){                                               // brick headhouse: two rows of steel windows, glazed ground floor
        nsWin(T, R, {y0:1.0, y1:t0 - 1.2, fh:(t0 - 2.2)/2, bw:4.0, wf:0.72, hf:0.62, sill:0.18, col:GL, out:0.06, min:6,
          skip:(e, k, nb, y) => nsCovered(P57.parts, e.a[0] + e.ux*(k + 0.5)*e.L/nb + e.nx*0.5, e.a[1] + e.uz*(k + 0.5)*e.L/nb + e.nz*0.5, y + 2)});
        nsBand(T, R, t0 - 0.8, 0.8, 0.2, CONC2); continue; }
      // the shed: glazed cargo-door bays between concrete piers below, a continuous band of steel windows above, parapet
      for (const e of E){ if (e.L < 5) continue;
        const covLo = nsCovered(P57.parts, (e.a[0] + e.b[0])/2 + e.nx*0.5, (e.a[1] + e.b[1])/2 + e.nz*0.5, 4), covHi = nsCovered(P57.parts, (e.a[0] + e.b[0])/2 + e.nx*0.5, (e.a[1] + e.b[1])/2 + e.nz*0.5, 10.5);
        if (covLo && covHi) continue;
        const n = covLo ? 0 : Math.round(e.L/6.2);
        for (let k = 0; k < n; k++){ const u0 = e.L*k/n + 0.7, u1 = e.L*(k + 1)/n - 0.7;
          T.q(GL2, [e.a[0] + e.ux*u0 + e.nx*0.06, 1.2, e.a[1] + e.uz*u0 + e.nz*0.06], [e.a[0] + e.ux*u1 + e.nx*0.06, 1.2, e.a[1] + e.uz*u1 + e.nz*0.06],
            [e.a[0] + e.ux*u1 + e.nx*0.06, 6.6, e.a[1] + e.uz*u1 + e.nz*0.06], [e.a[0] + e.ux*u0 + e.nx*0.06, 6.6, e.a[1] + e.uz*u0 + e.nz*0.06]);
          T.box(STEEL, e.a[0] + e.ux*(u0 + u1)/2 + e.nx*0.1, 3.9, e.a[1] + e.uz*(u0 + u1)/2 + e.nz*0.1, e.ux, e.uz, u1 - u0, 0.12, 0.08); }
        if (t0 > 12 && !covHi){ const ya = 8.4, yb = 13.4;
          T.q(GL, [e.a[0] + e.nx*0.07, ya, e.a[1] + e.nz*0.07], [e.b[0] + e.nx*0.07, ya, e.b[1] + e.nz*0.07], [e.b[0] + e.nx*0.07, yb, e.b[1] + e.nz*0.07], [e.a[0] + e.nx*0.07, yb, e.a[1] + e.nz*0.07]);
          const m = Math.round(e.L/1.8); for (let k = 1; k < m; k++){ const u = e.L*k/m; T.box(STEEL, e.a[0] + e.ux*u + e.nx*0.12, ya, e.a[1] + e.uz*u + e.nz*0.12, e.ux, e.uz, 0.1, yb - ya, 0.1); }
          T.box(STEEL, (e.a[0] + e.b[0])/2 + e.nx*0.12, (ya + yb)/2, (e.a[1] + e.b[1])/2 + e.nz*0.12, e.ux, e.uz, e.L, 0.1, 0.1); }
        if (!covLo) T.box(CONC2, (e.a[0] + e.b[0])/2 + e.nx*0.15, 7.0, (e.a[1] + e.b[1])/2 + e.nz*0.15, e.ux, e.uz, e.L, 0.7, 0.3);
      }
    }
    // the rooftop park on the shed (y = 17): lawns and beds, a meandering path, trees, benches, glass-and-steel railings
    const y = 17.15, x0 = -149, x1 = 49;
    T.flat(LAWN, nsRect(x0, -16.5, x1, 16.5), y);
    let zc = 0; for (let x = x0; x < x1; x += 4){ const z2 = 5*Math.sin((x + 4)/23) + 2*Math.sin((x + 4)/7.3), z1 = zc;
      T.q(PATH, [x, y + 0.04, z1 - 1.8], [x + 4, y + 0.04, z2 - 1.8], [x + 4, y + 0.04, z2 + 1.8], [x, y + 0.04, z1 + 1.8]); zc = z2;
      if ((x | 0) % 3 === 0){ const side = (x | 0) % 2 ? 1 : -1; T.abox(BED, x, y, side > 0 ? 9.5 : -15.5, x + 3.6, y + 0.45, side > 0 ? 15.5 : -9.5); } }
    for (let i = 0; i < 34; i++){ const x = x0 + 3 + rng()*(x1 - x0 - 6), z = (rng() < 0.5 ? -1 : 1)*(8 + rng()*6.5); nsTree(T, x, y, z, 1.4 + rng()*1.0, '#5b8040', '#5a4a3b'); }
    for (let x = x0 + 5; x < x1; x += 11) T.box(CONC2, x, y, 6.8, 1, 0, 3.0, 0.45, 0.6);
    for (const s of [-1, 1]) T.box(RAIL, (x0 + x1)/2, y, s*18.1, 1, 0, x1 - x0 + 4, 1.2, 0.08);
    T.box(RAIL, x0 - 2, y, 0, 0, 1, 36, 1.2, 0.08);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nypier57', lat:P57.ll[0], lon:P57.ll[1], rot:P57.ll[2]});
// =====================================================================================================================
// St. Mark's Church in-the-Bowery (1799, John McComb Jr.; Greek Revival steeple 1828 by Ithiel Town / Martin E. Thompson;
// cast-iron Italianate portico 1854-58): the fieldstone Georgian nave with two tiers of round-arched windows and a gable
// roof, aligned with the old Stuyvesant farm lane (true north-south, off the Manhattan grid); the square stone tower rising
// into the white wooden steeple (pedimented clock stage, columned belfry, octagonal lantern, spire); the portico across the
// south front; the rear wing; the east churchyard with its fence and trees. Frame: local +x = south (the front), +z = west.
const SM_LL = [40.730354, -73.987103, -1.4882];
LANDMARKS.nystmarks = {zh:'包厘圣马可教堂', en:"St. Mark's Church in-the-Bowery", cat:'old', r:42, h:46,
  lt:{m:0, c:'#ffe2b6', k:0.6, e:0.45},
  build(){
    const g = new THREE.Group(), T = nsTB();
    const STONE = '#8f867a', STONE2 = '#857c70', QUOIN = '#b8afa0', WOOD = {c:'#efece4', m:0, lc:'#fff1d8', lk:0.8}, ROOF = '#4d4b49';
    const WIN = {c:'#3a3f44', glow:'#ffdca8', gk:0.35}, IRON = {c:'#e6e1d6', m:0, lc:'#fff1d8', lk:0.7}, FENCE = '#26292b';
    const NV = [-9.15, 19.3, -8.85, 11.8], zc = (NV[2] + NV[3])/2, W = NV[3] - NV[2], WALL = 10.2, RIDGE = 16.4;
    // nave
    T.prism(STONE, nsRect(NV[0], NV[2], NV[1], NV[3]), -4, WALL, false);
    gable(g, (NV[0] + NV[1])/2, zc, NV[1] - NV[0] + 0.8, W + 0.8, WALL, RIDGE - WALL, ROOF, 0);
    T.q(STONE, [NV[1], WALL, NV[2]], [NV[1], WALL, NV[3]], [NV[1], RIDGE - 0.4, zc], [NV[1], RIDGE - 0.4, zc]);                 // front gable wall
    nsBand(T, nsRect(NV[0], NV[2], NV[1], NV[3]), WALL - 0.6, 0.6, 0.25, QUOIN);
    for (const [x, z] of [[NV[0], NV[2]], [NV[0], NV[3]], [NV[1], NV[2]], [NV[1], NV[3]]]) for (let y = 0; y < WALL - 0.6; y += 0.9) T.abox(QUOIN, x - 0.35 - (y % 1.8 ? 0.2 : 0), y, z - 0.35, x + 0.35, y + 0.45, z + 0.35);
    // two tiers of round-arched windows on both long sides (5 bays), with stone surrounds
    for (const zz of [NV[2], NV[3]]){ const s = zz < zc ? -1 : 1;
      for (let k = 0; k < 5; k++){ const x = NV[0] + 3.5 + k*(NV[1] - NV[0] - 7)/4;
        for (const [ya, yb] of [[1.6, 4.0], [5.6, 8.4]]){ const w = 1.5, z = zz + s*0.06;
          T.q(WIN, [x - w/2, ya, z], [x + w/2, ya, z], [x + w/2, yb, z], [x - w/2, yb, z]);
          for (let j = 0; j < 6; j++){ const a0 = j/6*Math.PI, a1 = (j + 1)/6*Math.PI; T.t(WIN, [x, yb, z], [x + Math.cos(a0)*w/2, yb + Math.sin(a0)*w/2, z], [x + Math.cos(a1)*w/2, yb + Math.sin(a1)*w/2, z]); }
          T.abox(QUOIN, x - w/2 - 0.2, ya - 0.25, z - 0.12, x + w/2 + 0.2, ya, z + 0.12); T.abox(QUOIN, x - 0.18, yb + w/2, z - 0.1, x + 0.18, yb + w/2 + 0.4, z + 0.1); } } }
    // rear wing (chancel / vestry) on the real footprint, lower, hipped
    const RW = [[-9.15, 8.5], [-13.8, 8.5], [-13.85, 5.38], [-23.77, 5.26], [-23.78, -5.48], [-17.24, -15.37], [-9.11, -15.4]];
    T.prism(STONE2, RW, -4, 6.5, true, ROOF);
    hipRoof(g, -16.3, -3.5, 14, 12, 6.5, 3.4, ROOF, 0, 0.4);
    nsWin(T, RW, {y0:1.2, y1:5.6, fh:4.4, bw:3.2, wf:0.42, hf:0.72, col:WIN, out:0.06, min:4, arch:true, on:e => e.nx < 0.5});
    // tower: stone to just above the ridge
    const TX = 17.7, TZ = zc, TS = 7.2;
    T.prism(STONE2, nsRect(TX - TS/2, TZ - TS/2, TX + TS/2, TZ + TS/2), 0, 18.2, true, ROOF);
    nsBand(T, nsRect(TX - TS/2, TZ - TS/2, TX + TS/2, TZ + TS/2), 17.6, 0.6, 0.3, QUOIN);
    T.q(WIN, [TX + TS/2 + 0.06, 11.5, TZ - 0.6], [TX + TS/2 + 0.06, 11.5, TZ + 0.6], [TX + TS/2 + 0.06, 14.2, TZ + 0.6], [TX + TS/2 + 0.06, 14.2, TZ - 0.6]);
    // steeple, stage 1: square clock stage with corner pilasters, pediments on four sides, clock dials (plain)
    const s1 = 6.2, y1 = 18.2, y2 = 23.4;
    T.abox(WOOD, TX - s1/2, y1, TZ - s1/2, TX + s1/2, y2, TZ + s1/2);
    for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) T.abox(WOOD, TX + dx*s1/2 - 0.45, y1, TZ + dz*s1/2 - 0.45, TX + dx*s1/2 + 0.45, y2, TZ + dz*s1/2 + 0.45);
    T.abox(WOOD, TX - s1/2 - 0.5, y2 - 0.6, TZ - s1/2 - 0.5, TX + s1/2 + 0.5, y2, TZ + s1/2 + 0.5);
    for (const ry of [0, Math.PI/2]) gable(g, TX, TZ, s1 + 1.0, s1 + 1.0, y2, 1.3, WOOD, ry);
    for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const cx = TX + nx*(s1/2 + 0.08), cz = TZ + nz*(s1/2 + 0.08);
      for (let j = 0; j < 12; j++){ const a0 = j/12*Math.PI*2, a1 = (j + 1)/12*Math.PI*2, r = 1.2, P = a => nx ? [cx, 20.8 + Math.sin(a)*r, cz + Math.cos(a)*r] : [cx + Math.cos(a)*r, 20.8 + Math.sin(a)*r, cz];
        T.t({c:'#2b2f33', glow:'#fff4dc', gk:0.6}, [cx, 20.8, cz], P(a0), P(a1)); } }
    // stage 2: belfry with columns at the corners and louvred openings
    const s2 = 4.8, y3 = 24.6, y4 = 29.4;
    T.abox(WOOD, TX - s2/2, y2 + 0.8, TZ - s2/2, TX + s2/2, y3, TZ + s2/2);
    T.abox('#55585a', TX - s2/2 + 0.6, y3, TZ - s2/2 + 0.6, TX + s2/2 - 0.6, y4, TZ + s2/2 - 0.6);
    for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]) T.cyl(WOOD, TX + dx*(s2/2 - 0.35), y3, TZ + dz*(s2/2 - 0.35), 0.26, y4 - y3, 8);
    T.abox(WOOD, TX - s2/2 - 0.3, y4, TZ - s2/2 - 0.3, TX + s2/2 + 0.3, y4 + 0.8, TZ + s2/2 + 0.3);
    // stage 3: octagonal lantern, then the spire and finial
    T.cyl(WOOD, TX, y4 + 0.8, TZ, 1.9, 3.6, 8); for (let j = 0; j < 8; j++){ const a = (j + 0.5)/8*Math.PI*2; T.box('#55585a', TX + Math.cos(a)*1.8, y4 + 1.6, TZ + Math.sin(a)*1.8, -Math.sin(a), Math.cos(a), 0.7, 2.0, 0.12); }
    T.cyl(WOOD, TX, y4 + 4.4, TZ, 2.1, 0.5, 8);
    T.cyl(WOOD, TX, y4 + 4.9, TZ, 1.75, 44.2 - y4 - 4.9, 8, 0.08);
    T.cyl('#8a7a4a', TX, 44.2, TZ, 0.08, 1.8, 4);
    // the cast-iron portico across the front: 6 columns, arched spandrels, entablature, balustrade
    const PX0 = 19.3, PX1 = 23.2, PZ0 = -7.1, PZ1 = 10.56, PH = 6.4;
    T.abox('#a59f94', PX0, 0, PZ0, PX1 + 0.3, 0.45, PZ1);
    const cols = []; for (let k = 0; k < 6; k++) cols.push(PZ0 + 0.4 + k*(PZ1 - PZ0 - 0.8)/5);
    for (const z of cols){ T.cyl(IRON, PX1 - 0.3, 0.45, z, 0.22, PH - 0.45, 8); T.abox(IRON, PX1 - 0.65, PH - 0.5, z - 0.35, PX1 + 0.05, PH, z + 0.35); }
    for (let k = 0; k < 5; k++){ const za = cols[k] + 0.25, zb = cols[k + 1] - 0.25, zm = (za + zb)/2, r = (zb - za)/2, yS = PH - 0.3 - r*0.7;
      for (let j = 0; j < 8; j++){ const a0 = j/8*Math.PI, a1 = (j + 1)/8*Math.PI; const p = a => [PX1 - 0.3, yS + Math.sin(a)*r*0.7, zm + Math.cos(a)*r];
        T.q(IRON, p(a0), p(a1), [PX1 - 0.3, PH, p(a1)[2]], [PX1 - 0.3, PH, p(a0)[2]]); } }
    T.abox(IRON, PX0, PH, PZ0, PX1 + 0.2, PH + 0.9, PZ1); T.abox(IRON, PX0, PH + 0.9, PZ0 - 0.1, PX1 + 0.3, PH + 1.1, PZ1 + 0.1);
    for (let z = PZ0 + 0.3; z < PZ1; z += 0.45) T.abox(IRON, PX1, PH + 1.1, z, PX1 + 0.12, PH + 1.8, z + 0.12);
    T.abox(IRON, PX1 - 0.05, PH + 1.8, PZ0, PX1 + 0.2, PH + 2.0, PZ1);
    T.q('#3a3330', [NV[1] + 0.06, 0.45, zc - 1.3], [NV[1] + 0.06, 0.45, zc + 1.3], [NV[1] + 0.06, 4.6, zc + 1.3], [NV[1] + 0.06, 4.6, zc - 1.3]);
    // churchyard on the east side (the Stuyvesant vault yard) behind a low iron fence, London planes; kept clear of the
    // pedestrian stretch of Stuyvesant Street that passes in front of the portico (x > 26)
    const YD = [[23.6, -20], [23.6, -7.1], [19.3, -7.1], [19.3, -8.85], [-9.1, -8.85], [-9.1, -15.4], [-17.2, -15.4], [-17.2, -20]];
    T.prism(STONE2, YD, -3, 0.1, true, '#9c968c');
    for (const [a, b] of [[[23.6, -20], [-17.2, -20]], [[23.6, -20], [23.6, -7.1]]]){ const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
      T.box(FENCE, (a[0] + b[0])/2, 1.15, (a[1] + b[1])/2, dx/L, dz/L, L, 0.08, 0.08); T.box(FENCE, (a[0] + b[0])/2, 0.25, (a[1] + b[1])/2, dx/L, dz/L, L, 0.08, 0.08);
      for (let u = 0; u <= L; u += 0.5) T.box(FENCE, a[0] + dx/L*u, 0.1, a[1] + dz/L*u, dx/L, dz/L, 0.04, 1.25, 0.04); }
    for (const [x, z, s] of [[19, -15.5, 2.5], [8, -16, 2.6], [-4, -17, 2.3], [-14, -18, 2.0]]) nsTree(T, x, 0.1, z, s, '#557a3e', '#5b4b3c');
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nystmarks', lat:SM_LL[0], lon:SM_LL[1], rot:SM_LL[2]});
}
