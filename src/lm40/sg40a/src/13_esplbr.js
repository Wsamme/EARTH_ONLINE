// ================= Esplanade Bridge (1997), Esplanade Drive over the mouth of the Singapore River =================
// Wikipedia: a low-level concrete arch bridge of seven spans, 261 m long (infobox 280 m), 46 m wide, two four-lane carriageways
// with walkways on both sides, street lamps by Light Cibles. The app draws both carriageways (OSM 'Esplanade Drive', bridge
// lines; deck height e(s) per vertex); the model gives the seven arches (spans of 261/7 = 37.3 m between six river piers),
// the vault soffits, spandrel faces and pier noses, the deck edge with the walkway surface just under the app's road ribbons,
// the parapets and a row of lamp standards. Arch spacing and lamp design are estimates (span count and length are sourced).
// Night: the arch faces floodlit warm white, lamps lit. Local frame: ref anchor (1.287959, 103.854184), +x east, +z south.
{
const A0 = [1.287959, 103.854184];
// carriageway centrelines (two lines, deck elevation per vertex) from ref_sg40a.json
const CW1 = [[27.7,-143.1],[23.1,-119.3],[18.5,-95.4],[13.8,-71.6],[9.2,-47.7],[4.6,-23.9],[0,0],[-4.7,23.8],[-9.3,47.6],[-13.9,71.5],[-18.6,95.3],[-23.2,119.2],[-27.8,143.0]];
const EL1 = [0.6,3.5,6.5,9.0,9.0,9.0,9.0,9.0,9.0,9.0,6.5,3.5,0.6];
const CW2 = [[9.2,-144.0],[4.7,-120.4],[0.2,-96.8],[-4.3,-73.2],[-8.8,-49.6],[-13.3,-26.0],[-17.8,-2.4],[-22.3,21.2],[-26.8,44.8],[-31.3,68.4],[-35.8,92.0],[-40.3,115.6],[-44.8,139.2]];
const N0 = [(CW1[0][0] + CW2[0][0])/2, (CW1[0][1] + CW2[0][1])/2], S0 = [(CW1[12][0] + CW2[12][0])/2, (CW1[12][1] + CW2[12][1])/2];
const M0 = [(N0[0] + S0[0])/2, (N0[1] + S0[1])/2], AX = Math.atan2(S0[1] - N0[1], S0[0] - N0[0]);
const F = frame(0, 0, AX);   // u along the bridge (north -> south), v across (+v = west side)
// deck height (local model y) at station u: app road = ground 0.9 + e + 0.18, model base = 1.5  ->  e - 0.42
const SE = CW1.map(p => { const q = [p[0] - M0[0], p[1] - M0[1]]; return q[0]*Math.cos(AX) + q[1]*Math.sin(AX); });
const eAt = u => { if (u <= SE[0]) return EL1[0]; for (let i = 0; i < SE.length - 1; i++) if (u <= SE[i+1]){ const t = (u - SE[i])/(SE[i+1] - SE[i]), s = t*t*(3 - 2*t); return EL1[i] + (EL1[i+1] - EL1[i])*s; } return EL1[EL1.length - 1]; };
const DY = u => eAt(u) - 0.42;
LANDMARKS.sgesplbr = {zh:'滨海大桥', en:'Esplanade Bridge', cat:'new', r:150, h:12,
  lt:{m:0, c:'#ffe2b8', k:1.15, e:0.9}, build(){
  const g = new THREE.Group(), B = mkB();
  const CON = {c:'#d6d2c8', m:0}, COND = {c:'#bdb8ac', m:0}, SOF = {c:'#aaa598', m:0, lk:0.6}, WALK = '#a8a196', RAIL = '#3f4648', POLE = '#5d6466',
    LAMP = {c:'#fff3d8', glow:'#ffdca0', gk:2.6}, FOUND = '#9d978b';
  const HW = 23, L = 261, NS = 7, SP = L/NS, U0 = -L/2, YW = -1.6, YSP = -1.2;
  const P3 = (u, y, v) => F(u, y, v);
  // ---- arches: vault soffit across the width, spandrel faces on both sides, piers with rounded noses ----
  for (let k = 0; k < NS; k++){
    const ua = U0 + k*SP + (k ? 1.6 : 0), ub = U0 + (k + 1)*SP - (k < NS - 1 ? 1.6 : 0), dmin = Math.min(DY(ua), DY(ub));
    const rise = Math.max(0.8, dmin - 1.7 - YSP), N = 16, arc = [];
    for (let i = 0; i <= N; i++){ const t = i/N, u = ua + (ub - ua)*t; arc.push([u, YSP + rise*Math.sqrt(Math.max(0, 1 - Math.pow(2*t - 1, 2)))]); }
    // soffit
    for (let i = 0; i < N; i++){ const [u1, y1] = arc[i], [u2, y2] = arc[i+1]; quadP(B.p(SOF), P3(u1, y1, -HW + 0.3), P3(u2, y2, -HW + 0.3), P3(u2, y2, HW - 0.3), P3(u1, y1, HW - 0.3)); }
    // spandrel faces (deck edge down to the arch ring), arch ring band
    for (const s of [-1, 1]){
      const Fs = (u, y, w) => P3(u, y, s*(HW + (w || 0)));
      for (let i = 0; i < N; i++){ const [u1, y1] = arc[i], [u2, y2] = arc[i+1];
        quadP(B.p(CON), Fs(u1, y1, 0), Fs(u2, y2, 0), Fs(u2, DY(u2) - 0.25, 0), Fs(u1, DY(u1) - 0.25, 0));
        quadP(B.p(COND), Fs(u1, y1, 0.25), Fs(u2, y2, 0.25), Fs(u2, y2 + 0.9, 0.25), Fs(u1, y1 + 0.9, 0.25)); }
    }
  }
  // piers between the spans (six) and the two abutments
  for (let k = 0; k <= NS; k++){
    const u = U0 + k*SP, w = k === 0 || k === NS ? 6 : 3.2, top = DY(u) - 0.25;
    bxF(B.p(CON), F, u - w/2, u + w/2, -5, top, -HW, HW);
    if (k > 0 && k < NS) for (const s of [-1, 1]){ const c = F(u, 0, s*HW); latheP(B.p(COND), [[1.6, -5], [1.6, YSP + 1.2], [1.1, YSP + 2.2], [0.2, YSP + 2.6]], c[0], c[2], 12); }
  }
  // ---- deck: walkway / deck surface just under the app's carriageways, edge beam, parapets, rails ----
  const NU = 60;
  for (let i = 0; i < NU; i++){ const u1 = U0 - 8 + (L + 16)*i/NU, u2 = U0 - 8 + (L + 16)*(i + 1)/NU, y1 = DY(u1) - 0.16, y2 = DY(u2) - 0.16;
    quadP(B.p(WALK), P3(u1, y1, -HW), P3(u2, y2, -HW), P3(u2, y2, HW), P3(u1, y1, HW));
    for (const s of [-1, 1]){
      quadP(B.p(CON), P3(u1, y1 - 1.0, s*(HW + 0.3)), P3(u2, y2 - 1.0, s*(HW + 0.3)), P3(u2, y2 + 1.05, s*(HW + 0.3)), P3(u1, y1 + 1.05, s*(HW + 0.3)));
      quadP(B.p(CON), P3(u1, y1 + 1.05, s*(HW + 0.3)), P3(u2, y2 + 1.05, s*(HW + 0.3)), P3(u2, y2 + 1.05, s*(HW - 0.2)), P3(u1, y1 + 1.05, s*(HW - 0.2)));
      quadP(B.p(CON), P3(u1, y1, s*(HW - 0.2)), P3(u2, y2, s*(HW - 0.2)), P3(u2, y2 + 1.05, s*(HW - 0.2)), P3(u1, y1 + 1.05, s*(HW - 0.2)));
      segP(B.p(RAIL), P3(u1, y1 + 1.3, s*(HW + 0.05)), P3(u2, y2 + 1.3, s*(HW + 0.05)), 0.05, 4);
    }
  }
  // ---- lamp standards along both parapets and the median (spacing estimated) ----
  for (let u = U0 + SP/2; u < -U0; u += SP/2){ for (const v of [HW - 0.6, -HW + 0.6, 0]){
    const c = P3(u, 0, v), y = DY(u) - 0.16 + (v === 0 ? 0.2 : 1.05);
    segP(B.p(POLE), [c[0], y, c[2]], [c[0], y + 9, c[2]], 0.14, 6);
    for (const s of (v === 0 ? [-1, 1] : [Math.sign(-v)])){ const e = P3(u, 0, v + s*1.6); segP(B.p(POLE), [c[0], y + 8.6, c[2]], [e[0], y + 9.2, e[2]], 0.08, 4); latheP(B.p(LAMP), [[0.05, y + 8.7], [0.6, y + 8.95], [0.5, y + 9.4], [0.05, y + 9.5]], e[0], e[2], 8); }
  } }
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], M0[0], M0[1]);
SG_PLACES.push({type:'sgesplbr', lat:PL.lat, lon:PL.lon, rot:0});
}
