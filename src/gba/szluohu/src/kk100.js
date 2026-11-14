
// ================= KK100 (Kingkey 100, TFP Farrells / Arup, completed 2011) =================
// 441.8 m, 100 storeys, top floor 427 m (Wikipedia). OSM footprint w164033632: a 59 x 47.5 m rectangle (part 0-441.8) with a
// curved bay on the south (part 24-44 m). The broad north / south faces are the wide ones and the east / west faces "more slender
// and flared slightly" (Farrells via Dezeen); slenderness 9.5 (Arup). The curving glass body swells gently and draws in at the
// top, where the curtain wall curves over into the crown: "a curved smooth glazed curtain wall and steel structure" (Farrells),
// the parabolic arch of the sky garden (Skyscraper Museum); the curtain wall curls up at the base into a canopy over the office
// entrance (Farrells). Vertical mullion fins run up the faces and over the crown; some carry line lights at night.
const KK = {cz:-3.15, A:29.5, B:23.75, HT:441.8, HF:427};
function kkPlan(y){
  const {A, B, HT} = KK, f = Math.min(1, y/380);
  const sw = 1 + 0.045*Math.sin(PI*f);                                       // the soft swell of the long faces
  let b = B*sw, a = A*(1 - 0.035*Math.max(0, (y - 300)/141.8)**1.5);           // ends draw in a little at the top
  if (y > 370){ const t = Math.min(1, (y - 370)/(HT - 370)); b = b*Math.sqrt(Math.max(0, 1 - t*t)); b = Math.max(b, 0.35); }
  const bul = 2.2*Math.min(1, b/B), eb = 1.4, P = [], NF = 24, NE = 10;
  for (let k = 0; k < NF; k++){ const u = -1 + 2*k/NF; P.push([a*u, -(b + bul*(1 - u*u))]); }          // north face
  for (let k = 0; k < NE; k++){ const v = -1 + 2*k/NE; P.push([a + eb*(1 - v*v), b*v]); }              // east end
  for (let k = 0; k < NF; k++){ const u = 1 - 2*k/NF; P.push([a*u, b + bul*(1 - u*u)]); }              // south face
  for (let k = 0; k < NE; k++){ const v = 1 - 2*k/NE; P.push([-a - eb*(1 - v*v), b*v]); }              // west end
  return P;
}
LANDMARKS.hkkingkey = {zh:'京基100', en:'KK100', cat:'new', r:58, h:441.8, lt:{m:1, c:'#e6efff', k:0.8, anim:'cycle', c2:'#ffe0b0'},
  build(){
    const g = new THREE.Group(), B = Bt(), cz = KK.cz;
    const GL = {c:'#8ea6b5', m:1, fh:4.27, cw:2.46}, GLC = {c:'#9fb7c6', m:0, lc:'#d7e8ff', lk:0.9, glow:'#b4d2f4', gk:0.6},
      FIN = {c:'#d3d8db', m:0, lk:0.35}, LINE = {c:'#dfe5e8', glow:'#e9f3ff', gk:1.4}, BASE = '#b9b4a9', CAN = {c:'#9db3c0', m:0, lk:0.5, ds:true},
      SOFF = {c:'#d9d6cf', glow:'#ffe8c8', gk:0.5}, DARK = '#55606a';
    const ys = [0, 30, 70, 120, 180, 240, 300, 340, 370, 385, 398, 410, 420, 427, 433, 438, 441.8];
    const R = y => kkPlan(y).map(p => [p[0], y, p[1] + cz]);
    // shaft (window-lit) to the top floor, glazed crown above
    loft(B, GL, ys.filter(y => y <= 410).map(R), false);
    loft(B, GLC, ys.filter(y => y >= 410).map(R), true);
    // fins: every point of the long faces and of the ends, from 6 m up and over the crown; every 4th long-face fin is a line light
    const fys = [6, 30, 70, 120, 180, 240, 300, 340, 370, 385, 398, 410, 420, 427, 433, 438, 441.4], NF = 24, NE = 10;
    for (let idx = 0; idx < 2*(NF + NE); idx++){
      const face = idx < NF ? 'n' : idx < NF + NE ? 'e' : idx < 2*NF + NE ? 's' : 'w';
      const top = face === 'n' || face === 's' ? 441.4 : 425;
      const pts = fys.filter(y => y <= top).map(y => { const p = kkPlan(y)[idx]; return [p[0], y, p[1] + cz]; });
      const outs = pts.map((p, i) => { if (face === 'e') return [1, 0]; if (face === 'w') return [-1, 0];
        const j = Math.min(pts.length - 1, i + 1), i0 = Math.max(0, i - 1), dy = pts[j][1] - pts[i0][1], dz = pts[j][2] - pts[i0][2];
        return [0, Math.sign(p[2] - cz)*Math.abs(dy)/(Math.hypot(dy, dz) || 1)]; });
      const k = face === 'n' ? idx : face === 's' ? idx - NF - NE : -1, line = k > 0 && k % 4 === 0;
      fin(B, line ? LINE : FIN, pts, outs, line ? 1.0 : 0.7, line ? 0.45 : 0.22);
    }
    // the crown ridge and the gable ends of the glass vault
    const P0 = kkPlan(441.6); abox(B, FIN, P0[0][0], -P0[0][0], 441.2, 441.9, cz - 0.6, cz + 0.6);
    // ground floor: stone plinth and lobby glass recessed, the curtain wall curling out into an entrance canopy on the south
    ext(B, BASE, kkPlan(0).map(p => [p[0]*1.005, p[1]*1.005 + cz]), -3, 0.6);
    const can = [], nC = 14;
    for (let k = 0; k <= nC; k++){ const u = -0.8 + 1.6*k/nC; can.push(u); }
    const zS = y => { const p = kkPlan(y)[NF + NE + 12]; return p[1] + cz; };
    for (let k = 0; k < nC; k++){ const x0 = KK.A*can[k], x1 = KK.A*can[k + 1];
      const prof = [[0, 16], [1.2, 14.5], [3.2, 12.6], [5.6, 11.6], [7.4, 11.3]];
      for (let j = 0; j < prof.length - 1; j++){ const a = prof[j], b = prof[j + 1], z0 = zS(16) + a[0], z1 = zS(16) + b[0];
        B.q(CAN, [x0, a[1], z0], [x1, a[1], z0], [x1, b[1], z1], [x0, b[1], z1]); } }
    for (const x of [-0.7, -0.25, 0.25, 0.7]) obox(B, DARK, KK.A*x, zS(16) + 7.0, 1, 0, 0.5, 0.5, 0, 11.3);
    abox(B, SOFF, -KK.A*0.8, KK.A*0.8, 10.9, 11.3, zS(16) + 0.2, zS(16) + 7.2);
    // the south bay (OSM part 24-44 m): a curved glazed volume between the tower and the hotel podium
    const bay = [[-29.5, 20.6], [29.5, 20.6], [21.4, 24.6], [12.8, 27.9], [8.2, 29.1], [-0.2, 30.0], [-9.0, 29.1], [-13.2, 28.0], [-18.0, 26.2]];
    ext(B, {c:'#93aab8', m:1, fh:4.0, cw:3.0}, bay, 24, 44, '#a6adb1');
    bands(B, FIN, bay, [24.4, 34, 43.6], 0.5, 0.15);
    // aviation lights: the ridge ends and the crest
    redLight(B, P0[0][0] + 0.8, 441.9, cz, 0.45); redLight(B, -P0[0][0] - 0.8, 441.9, cz, 0.45); redLight(B, 0, 441.9, cz, 0.45);
    B.flush(g);
    beacons(g, [P0[0][0] + 0.8, 443, cz, -P0[0][0] - 0.8, 443, cz, 0, 443, cz], [1, 0.18, 0.1], 14);
    return g;
  }};
SG_PLACES.push({type:'hkkingkey', lat:22.545706, lon:114.101581, rot:0});
