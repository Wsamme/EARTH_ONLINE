// ================= Bank of China Building, 4 Battery Road (sgboc, hero) =================
// Wikipedia: the old block (Palmer & Turner, completed Dec 1953, 16 storeys, 61 m to the roof; roots.gov.sg says 18 storeys) and
// the 2000 tower (36 storeys, 168 m) side by side on a shared podium. Plan from the OSM building:parts of w106193390: tower
// w172916312 (notched 24-point plan), the old block w1075238476 (Battery Road / Flint Street corner, OSM top 53.4 m), podium
// parts w1075238475 (23.7 m), w1075238477 / w1075238478 (20.4 m), w1075238474 (10.5 m).
// Look (photos, Wikimedia Commons): white stone tower with punched windows, deep dark vertical slots, carved lattice panels in the
// outer window columns, a stepped crown with recessed corners; the white old block / podium with rows of lattice panels.
// Night: floodlit white stone (warm), lit windows. No signs or lettering.
{
const A0 = [1.285696, 103.852268];
const SITE0 = [[22.6,7.6],[20.8,16.9],[6.2,24.0],[5.2,22.0],[-5.5,27.2],[-16.4,4.8],[-19.0,-0.7],[-25.2,-13.3],[-14.3,-18.6],[-8.9,-21.1],[5.3,-27.9],[11.5,-15.3],[14.0,-9.8]];
// the OSM tower ring (24 points, ragged where it meets the old block) fitted with its 34 x 31 m box at -24 deg, re-entrant corner notches
const TOW0 = notchR(-3.39, -6.94, 17.0, 15.4, -24*PI/180, 2.4);
const OLD0 = [[13.9,2.0],[10.1,3.0],[7.1,-0.5],[-1.9,3.7],[7.1,21.0],[19.1,15.0],[20.9,7.2],[14.9,-4.0]];
const P23_0 = [[-5.4,27.2],[7.1,21.0],[-1.9,3.7],[-4.6,5.0],[-4.1,9.7],[-7.6,11.5],[-13.1,9.0],[-15.4,4.2],[-16.4,4.9]];
const P20a0 = [[-25.1,-13.5],[-19.1,-0.5],[-17.9,-1.0],[-19.1,-4.0],[-16.6,-5.3],[-12.6,-15.3],[-14.4,-18.8]];
const P20b0 = [[5.3,-27.8],[-8.9,-21.3],[-7.1,-17.8],[4.9,-15.3],[8.9,-17.0],[10.1,-14.8],[11.4,-15.3]];
const P10_0 = [[12.6,-9.3],[20.9,7.2],[19.1,15.0],[5.4,22.0],[6.1,23.7],[20.9,16.7],[22.6,7.7],[13.9,-10.0]];
const C0 = pcen(TOW0), [SITE, TOW, OLD, P23, P20a, P20b, P10] = shAll([SITE0, TOW0, OLD0, P23_0, P20a0, P20b0, P10_0], C0);
LANDMARKS.sgboc = {zh:'中国银行大厦', en:'Bank of China Building', cat:'new', r:34, h:168,
  lt:{m:0, c:'#ffe9c8', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB();
  const ST = {c:'#e9e5db', m:0, lk:0.55}, ST2 = {c:'#dcd6c9', m:0, lk:0.5}, ROOF = '#b9b4a9', FOUND = '#bdb7ab', PAVE = '#c6c0b4',
    WIN = {c:'#36434e', m:1, fh:4.2, cw:2.6}, SLOT = {c:'#24303a', m:1, fh:4.2, cw:1.6}, LAT = {c:'#cdc5b4', m:0, lk:0.4},
    OWIN = {c:'#3c4954', m:1, fh:3.4, cw:2.4}, LOB = {c:'#b8c2c4', m:0, glow:'#ffe2b8', gk:0.7}, LION = '#d6d0c2', MECH = '#8f9395';
  const Y1 = 150, Y2 = 160, Y3 = 166, YT = 168;
  foundP(B.p(FOUND), SITE); capP(B.p(PAVE), SITE, 0.3);
  // ---- tower: white stone walls; the short notch edges are the dark vertical slots ----
  const slot = e => e.L < 3 ? ST2 : null;
  wallsByEdge(B, TOW, 0.3, Y1, ST, slot);
  winP(B, TOW, 24, Y1 - 2, 4.2, 2.7, 1.25, 2.7, WIN, {minL:4.6, end:1, endCol:LAT});
  // a deeper slot down the middle of each long face (photo: twin dark slots with window strips)
  for (const e of edgesF(TOW)) if (e.L > 13) for (const f of [0.3, 0.7]){ slabP(B.p(SLOT), rectO(e.L*f - 1.1, e.L*f + 1.1, 24, Y1 + 4), e.F, 0.0, 0.12);
    for (const d of [-0.55, 0.55]) slabP(B.p(ST2), rectO(e.L*f + d - 0.06, e.L*f + d + 0.06, 24, Y1 + 4), e.F, 0.12, 0.2); }
  // string course at the crown base, then the stepped crown
  bandAtP(B.p(ST2), TOW, Y1 - 1.2, 1.2, 0.25);
  const T1 = offP(TOW, 0.9), T2 = scP(TOW, 0.72), T3 = scP(TOW, 0.5);
  wallsByEdge(B, T1, Y1, Y2, ST, slot); capP(B.p(ROOF), T1, Y2);
  winP(B, T1, Y1 + 1.5, Y2 - 1.5, 7, 3.4, 1.9, 5.2, SLOT, {minL:5});
  bandAtP(B.p(ST2), T1, Y2 - 0.8, 0.8, 0.2);
  blkP(B, T2, Y2, Y3, ST, ROOF); winP(B, T2, Y2 + 1, Y3 - 0.5, 4.5, 4, 1.2, 3.4, LAT, {minL:4});
  blkP(B, T3, Y3, YT, ST2, ROOF);
  // recessed corner steps: small set-back blocks at the long-edge ends (stepped silhouette)
  for (const e of edgesF(T1)) if (e.L > 9) for (const u of [2.2, e.L - 2.2]){ const p = e.F(u, 0, -2.4); boxP(B.p(ST), 3.2, Y3 - 1 - Y2, 3.2, p[0], Y2, p[2], -e.ang); }
  // roof plant
  boxP(B.p(MECH), 7, 2.2, 6, 0, YT, 0); lavP(B.p(LAV50), T3, YT);
  // ---- old block (1953): white stone, vertical window strips, a row of lattice panels at the top floor, raised centre ----
  wallP(B.p(ST), OLD, 0.3, 53.4); capP(B.p(ROOF), OLD, 53.4);
  winP(B, OLD, 6, 50, 3.4, 2.2, 1.2, 2.2, OWIN, {minL:5});
  winP(B, OLD, 50, 53.4, 3.4, 2.2, 1.7, 2.6, LAT, {minL:5, w:0.1});
  bandAtP(B.p(ST2), OLD, 53.4 - 0.8, 0.8, 0.3); bandAtP(B.p(ST2), OLD, 5.2, 0.8, 0.25);
  const OC = scP(OLD, 0.55); blkP(B, OC, 53.4, 58.2, ST, ROOF); bandAtP(B.p(ST2), OC, 57.6, 0.6, 0.2);
  const OC2 = scP(OLD, 0.3); blkP(B, OC2, 58.2, 61, ST2, ROOF);
  // entrance on Battery Road (south face) with two stone lions on plinths
  { const e = edgesF(OLD).reduce((a, b) => (b.a[1] + b.b[1] > a.a[1] + a.b[1] ? b : a));
    slabP(B.p(LOB), rectO(e.L/2 - 3, e.L/2 + 3, 0.3, 5), e.F, 0.02, 0.1);
    for (const s of [-1, 1]){ const p = e.F(e.L/2 + s*4.2, 0, 1.4); boxP(B.p(ST2), 1.2, 1.1, 1.8, p[0], 0.3, p[2], -e.ang);
      latheP(B.p(LION), [[0.5, 1.4], [0.55, 2.0], [0.42, 2.5], [0.3, 2.8], [0.01, 2.9]], p[0], p[2], 6); } }
  // ---- podium parts ----
  for (const [P, h] of [[P23, 23.7], [P20a, 20.4], [P20b, 20.4], [P10, 10.5]]){
    wallP(B.p(ST), P, 0.3, h); capP(B.p(ROOF), P, h); bandAtP(B.p(ST2), P, h - 0.7, 0.7, 0.15);
    winP(B, P, 5, h - 1.5, 4.2, 2.8, 1.6, 2.4, OWIN, {minL:4});
    bandAtP(B.p(LOB), P, 0.3, 4.4, 0.03);
  }
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgboc', lat:PL.lat, lon:PL.lon, rot:0});
}
