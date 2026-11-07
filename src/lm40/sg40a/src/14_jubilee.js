// ================= Jubilee Bridge (2015; Cox Architects + architects61, Arup), Merlion Park - Esplanade =================
// Wikipedia / Arup / e-architect: pedestrian balanced-cantilever bridge, 220 m long, 6 m wide, three spans (longest 95 m)
// carried on two twin-blade post-tensioned concrete piers; a curving single-cell box girder 1.5 m deep at mid-span and 3.5 m at
// the piers, thin edges; stone-tiled deck, slender stainless-steel cable balustrade, polished stainless coved edging with
// concealed LEDs washing the soffit. It runs on the river side of the Esplanade Bridge and replaces the app's path (OSM
// 'Jubilee Bridge'). Pier stations (side spans equal) and the deck's rise (to ~7 m over the water) are estimates.
{
const A0 = [1.287976, 103.854354];
const LN0 = [[7.9,109.0],[1.9,89.5],[-1.1,69.3],[-2.0,56.2],[-2.8,43.2],[-1.7,22.7],[-0.5,2.3],[3.4,-17.0],[9.1,-33.3],[14.8,-49.6],[24.0,-68.9],[34.6,-84.1],[45.2,-99.4]];
// smooth resampled centreline: [x, z, s]
const RS = (() => { const P = LN0, S = [0]; for (let i = 1; i < P.length; i++) S.push(S[i-1] + Math.hypot(P[i][0] - P[i-1][0], P[i][1] - P[i-1][1]));
  const at = s => { for (let i = 0; i < P.length - 1; i++) if (s <= S[i+1] || i === P.length - 2){ const t = Math.min(1, Math.max(0, (s - S[i])/(S[i+1] - S[i]))); return [P[i][0] + (P[i+1][0] - P[i][0])*t, P[i][1] + (P[i+1][1] - P[i][1])*t]; } };
  const L = S[S.length - 1], n = Math.round(L/2), out = [];
  for (let k = 0; k <= n; k++){ const s = L*k/n; let x = 0, z = 0, c = 0; for (let d = -6; d <= 6; d += 2){ const q = at(Math.min(L, Math.max(0, s + d))); x += q[0]; z += q[1]; c++; } out.push([x/c, z/c, s]); }
  out[0] = [P[0][0], P[0][1], 0]; out[n] = [P[P.length-1][0], P[P.length-1][1], L]; return {pts:out, L}; })();
const MID = RS.pts[Math.round(RS.pts.length/2)];
const C0 = [(LN0[0][0] + LN0[LN0.length-1][0] + MID[0]*2)/4, (LN0[0][1] + LN0[LN0.length-1][1] + MID[1]*2)/4];
LANDMARKS.sgjubilee = {zh:'禧庆桥', en:'Jubilee Bridge', cat:'new', r:120, h:9,
  lt:{m:0, c:'#e8f0ff', k:0.7, e:0.8}, build(){
  const g = new THREE.Group(), B = mkB();
  const CON = {c:'#e4e2dc', m:0}, SOF = {c:'#d2d0ca', m:0, lc:'#cfe6ff', lk:1.3}, TILE = '#c8c1b3', STEEL = {c:'#d9dde0', m:0, lk:0.4},
    EDGE = {c:'#e9edf0', glow:'#cfe4ff', gk:0.9}, CABLE = '#9aa2a6', FOUND = '#a49e92';
  const L = RS.L, SP1 = (L - 95)/2, SP2 = (L + 95)/2, HW = 3.0;
  const yDeck = s => -0.45 + 7.2*Math.pow(Math.sin(PI*Math.min(1, Math.max(0, s/L))), 0.55);
  const depth = s => { const d = Math.min(Math.abs(s - SP1), Math.abs(s - SP2)); return Math.max(0.5, Math.min(1, s/10, (L - s)/10))*(1.5 + 2.0*Math.pow(Math.max(0, 1 - d/45), 1.6)); };
  const P = RS.pts.map(([x, z, s], i, A) => { const a = A[Math.max(0, i - 1)], b = A[Math.min(A.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
    return {x: x - C0[0], z: z - C0[1], s, nx: -dz/l, nz: dx/l, y: yDeck(s), d: depth(s)}; });
  const at = (p, v, y) => [p.x + p.nx*v, y, p.z + p.nz*v];
  for (let i = 0; i < P.length - 1; i++){ const a = P[i], b = P[i+1];
    // deck surface, edge fascia (polished stainless), box girder webs and bottom
    quadP(B.p(TILE), at(a, -HW, a.y), at(b, -HW, b.y), at(b, HW, b.y), at(a, HW, a.y));
    for (const s of [-1, 1]){
      quadP(B.p(EDGE), at(a, s*HW, a.y + 0.08), at(b, s*HW, b.y + 0.08), at(b, s*HW, b.y - 0.35), at(a, s*HW, a.y - 0.35));
      quadP(B.p(SOF), at(a, s*HW, a.y - 0.35), at(b, s*HW, b.y - 0.35), at(b, s*1.7, b.y - b.d), at(a, s*1.7, a.y - a.d));
    }
    quadP(B.p(SOF), at(a, -1.7, a.y - a.d), at(b, -1.7, b.y - b.d), at(b, 1.7, b.y - b.d), at(a, 1.7, a.y - a.d));
    // cable balustrade: top rail and five cables per side
    for (const s of [-1, 1]){ segP(B.p(STEEL), at(a, s*(HW - 0.1), a.y + 1.2), at(b, s*(HW - 0.1), b.y + 1.2), 0.05, 4);
      for (let k = 1; k <= 4; k++) segP(B.p(CABLE), at(a, s*(HW - 0.1), a.y + 0.24*k), at(b, s*(HW - 0.1), b.y + 0.24*k), 0.012, 3);
      if (i % 1 === 0) segP(B.p(STEEL), at(a, s*(HW - 0.1), a.y), at(a, s*(HW - 0.1), a.y + 1.2), 0.035, 4); }
  }
  // twin-blade piers at the two pier stations
  for (const sp of [SP1, SP2]){ const p = P.reduce((m, q) => Math.abs(q.s - sp) < Math.abs(m.s - sp) ? q : m, P[0]), tx = -p.nz, tz = p.nx;
    for (const s of [-1, 1]){ const c = [p.x + tx*s*1.3, p.z + tz*s*1.3];
      const blade = [[c[0] + p.nx*1.6, c[1] + p.nz*1.6], [c[0] + tx*0.35 + p.nx*0.0, c[1] + tz*0.35], [c[0] - p.nx*1.6, c[1] - p.nz*1.6], [c[0] - tx*0.35, c[1] - tz*0.35]];
      prismP(B.p(CON), blade, -6, p.y - p.d + 0.05); } }
  // abutment pads at both ends
  for (const p of [P[0], P[P.length - 1]]) bxF(B.p(FOUND), frame(p.x, p.z, Math.atan2(p.nz, p.nx)), -3.5, 3.5, -3, p.y - 0.05, -3, 3);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgjubilee', lat:PL.lat, lon:PL.lon, rot:0});
}
