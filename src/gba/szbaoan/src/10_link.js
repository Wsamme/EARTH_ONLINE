// ================================================================================================ Lingdingyang Bridge (szszlink)
// The suspension bridge of the Shenzhen-Zhongshan Link (opened 30 June 2024; renamed 深中大桥 in 2024). Verified: spans 580 + 1666 +
// 580 m, two H-shaped portal towers 270 m high, a streamlined integral steel box girder 49.7 m wide and 4 m deep, road 91 m above
// the sea at mid-span, navigation clearance 76.5 m, white main cables 1.06 m across, sag ratio 1/9.65, hangers 5-183.5 m long,
// anchorages on figure-8 diaphragm walls of 2 x 65 m diameter built as islands in the sea. Estimated: leg sections, crossbeam levels,
// anchorage block height, girder segment / hanger spacing 12.8 m (the girder segments' length), approach piers every 110 m.
// Frame: x along the bridge toward Shenzhen (= t, metres from the main-span centre), z across (+ = right looking east). Towers on
// the OSM bridge:support islets (w1022190925-28; centred on the carriageways, the islets sit 2.3 m north of them), east anchorage on
// r13688120 (note 锚碇), west anchorage mirrored (not mapped). The road decks are the app's (OSM ways 1298785019 / 1298785020 at the
// profile of szlink_deck_fix.py = lkRoad below); everything else is here. Three keys: szszlink (towers, cables, girder, anchorages),
// szszlink_w / szszlink_e (the approach viaducts, unlabelled), all on the same rot.
@LKD@
const LKB = 0.3;                                    // the app's base height here (local y = height above the sea - LKB): highest ground -0.3 + 0.6
const LZ = {mid:91.0, R:33320, T:833, G:0.025, base:13.68};
function lkRoad(t){            // road surface above the sea (same as szlink_deck_fix.py)
  const a = Math.abs(t), zp = a <= LZ.T ? LZ.mid - a*a/(2*LZ.R) : LZ.mid - LZ.T*LZ.T/(2*LZ.R) - LZ.G*(a - LZ.T);
  if (a <= LZ.T) return zp; const d = Math.abs(zp - LZ.base), e = 8; return Math.max(zp, LZ.base) + (d < e ? (e - d)*(e - d)/(4*e) : 0);
}
const LK = {tw:833.85, sad:271, low:98.5, cz:21.5, ip:1408, ipy:57, ipz:24, anc:1425.5, top:273, legB:31, legT:21.5};
const LKC = {conc:'#cdc9c0', cap:'#b9b3a8', gird:'#d2d5d7', cab:'#f0f1ee', hang:'#8f969c', rail:'#aeb2b5', pole:'#80858b',
  lamp:{c:'#fff2d0', glow:'#ffdca8', gk:3.0}, avi:AVI};
const lkY = abs => abs - LKB;
function lkCable(t){                                 // main cable centre (abs height, |z|) at t
  const a = Math.abs(t);
  if (a <= LK.tw) return [LK.low + (LK.sad - LK.low)*(a/LK.tw)*(a/LK.tw), LK.cz];
  const s = Math.min(1, (a - LK.tw)/(LK.ip - LK.tw)), lin = LK.sad + (LK.ipy - LK.sad)*s;
  return [lin - 4*11*s*(1 - s), LK.cz + (LK.ipz - LK.cz)*s];
}
function lkLamp(B, x, yTop, z){ const p = B.a(LKC.pole); bar(p, [x, yTop, z], [x, yTop + 9.5, z], 0.28, 0.28); boxT(B.a(LKC.lamp), x, yTop + 9.2, z, 1.8, 0.6, 1.0); }
function linkMain(){
  const g = new THREE.Group(), B = new Bat();
  const pc = B.a(LKC.conc), pcap = B.a(LKC.cap), pg = B.a(LKC.gird), pcab = B.a(LKC.cab), ph = B.a(LKC.hang), pr = B.a(LKC.rail);
  // --- girder (main + side spans, over both anchorages), streamlined box; railings; lamps
  const ts = []; for (let t = -1458; t <= 1458.01; t += 12.8) ts.push(t); if (ts[ts.length - 1] < 1458) ts.push(1458);
  const pts = ts.map(t => [t, lkY(lkRoad(t)), 0]);
  const SEC = [[-24.85, -1.5], [-20, -4.3], [20, -4.3], [24.85, -1.5], [23, -0.3], [-23, -0.3]];
  const R = sweep(pg, pts, SEC); capT(pg, R[0]); capT(pg, R[R.length - 1].slice().reverse());
  for (const sd of [-1, 1]) sweep(pr, pts, [[sd*24.0, -0.3], [sd*24.35, -0.3], [sd*24.35, 1.1], [sd*24.0, 1.1]]);
  for (let t = -1440; t <= 1440; t += 38.4) for (const sd of [-1, 1]) lkLamp(B, t, lkY(lkRoad(t)) - 0.3, sd*23.4);
  // --- towers
  for (const tx of [-LK.tw, LK.tw]){
    const zc = y => LK.legB + (LK.legT - LK.legB)*(y - 3)/(268 - 3);
    const sec = (y, sd) => { const f = (y - 3)/265, a = 15 - 6*f, b = 11 - 4*f, c = 1.5, z = sd*zc(y);
      return [[-a/2 + c, -b/2], [a/2 - c, -b/2], [a/2, -b/2 + c], [a/2, b/2 - c], [a/2 - c, b/2], [-a/2 + c, b/2], [-a/2, b/2 - c], [-a/2, -b/2 + c]].map(([u, v]) => [tx + u, lkY(y), z + v]); };
    for (const sd of [-1, 1]){
      const S = [3, 40, 80, 120, 160, 200, 240, 268].map(y => sec(y, sd));
      for (let i = 0; i < S.length - 1; i++) for (let k = 0; k < 8; k++){ const k2 = (k + 1) % 8; quad(pc, S[i][k], S[i][k2], S[i + 1][k2], S[i + 1][k]); }
      capT(pc, S[S.length - 1]);
      boxT(pc, tx, lkY(268), sd*LK.legT, 9, 4.2, 7.5);                         // saddle housing
      boxT(pc, tx, lkY(272.2), sd*LK.legT, 7.6, 0.8, 6.2);
      boxT(B.a(LKC.avi), tx, lkY(273), sd*LK.legT, 1.2, 0.9, 1.2);
      boxT(B.a(LKC.avi), tx, lkY(160), sd*(zc(160) + 5.2), 1.0, 0.8, 0.6);
      // pile cap (the islets ~39 m across)
      const cp = []; for (let k = 0; k < 24; k++){ const a = k/24*TAU; cp.push([tx + Math.cos(a)*19.5, sd*LK.legB + Math.sin(a)*19.5]); }
      wallsT(pcap, cp, lkY(-3), lkY(3.5)); flatT(pcap, cp, lkY(3.5));
    }
    // crossbeams: below the (floating) girder and the upper one of the H
    const beam = (y0, y1, w) => { const zi = zc((y0 + y1)/2) - 4.2; boxT(pc, tx, lkY(y0), 0, w, y1 - y0, 2*zi); };
    beam(65.5, 73.5, 9); beam(230, 247, 7.5);
    boxT(B.a(LKC.avi), tx, lkY(247), 0, 1, 0.8, 1);
  }
  // --- main cables (white, 1.06 m) and hangers every 12.8 m (main and side spans)
  for (const sd of [-1, 1]){
    let prev = null;
    for (let t = -LK.ip; t <= LK.ip + 0.01; t += Math.abs(t) < LK.tw ? 8 : 10){
      const tt = Math.abs(Math.abs(t) - LK.tw) < 5 ? Math.sign(t)*LK.tw : t, [y, z] = lkCable(tt), P = [tt, lkY(y), sd*z];
      if (prev) tube(pcab, prev, P, 0.53, 8); prev = P;
    }
    for (let k = -130; k <= 130; k++){
      const t = k*12.8 + 6.4; if (Math.abs(t) > LK.ip - 14 || Math.abs(Math.abs(t) - LK.tw) < 10) continue;
      const [y, z] = lkCable(t), yg = lkRoad(t) - 0.3; if (y - yg < 1.2) continue;
      bar(ph, [t, lkY(y) - 0.4, sd*z], [t, lkY(yg), sd*z], 0.24, 0.24);
    }
  }
  // --- anchorages: figure-8 island (OSM ring), the sloped anchor block, the cables' splay into it
  const ANC = [[-32.4,-29.6],[-33.6,-22.2],[-33.2,-14.7],[-31.2,-7.4],[-27.6,-0.8],[-31.7,5.6],[-34.1,13.0],[-34.8,19.9],[-34.0,27.6],[-31.3,35.0],[-27.1,41.5],[-21.6,47.0],[-14.9,51.0],[-7.5,53.5],[0.3,54.2],[8.0,53.2],[15.3,50.4],[21.8,46.1],[27.1,40.5],[31.0,33.8],[33.2,26.3],[33.7,18.6],[32.0,9.3],[27.7,1.1],[31.6,-5.2],[34.1,-12.3],[34.9,-19.8],[34.1,-27.2],[31.7,-34.3],[27.8,-40.8],[22.5,-46.2],[16.2,-50.3],[9.2,-53.0],[1.7,-54.1],[-5.8,-53.6],[-13.0,-51.4],[-19.6,-47.7],[-25.2,-42.6],[-29.5,-36.5]];
  for (const sd of [-1, 1]){
    const cx = sd*LK.anc, cz = sd > 0 ? 1.4 : 0, ring = ANC.map(([x, z]) => [cx + sd*x, cz + z]);
    wallsT(pcap, ring, lkY(-3), lkY(7)); flatT(pcap, ring, lkY(7));
    // block profile along x (front toward the tower), extruded across z
    const X = [sd*1398, sd*1408.5, sd*1452, sd*1460], Y = [7, 60.5, 60.5, 7].map(lkY), Z0 = -44 + cz, Z1 = 44 + cz;
    const pf = [[X[0], Y[0]], [X[1], Y[1]], [X[2], Y[2]], [X[3], Y[3]]];
    for (let i = 0; i < 3; i++) quad(pc, [pf[i][0], pf[i][1], Z0], [pf[i + 1][0], pf[i + 1][1], Z0], [pf[i + 1][0], pf[i + 1][1], Z1], [pf[i][0], pf[i][1], Z1]);
    for (const Z of [Z0, Z1]){ tri(pc, [pf[0][0], pf[0][1], Z], [pf[1][0], pf[1][1], Z], [pf[2][0], pf[2][1], Z]); tri(pc, [pf[0][0], pf[0][1], Z], [pf[2][0], pf[2][1], Z], [pf[3][0], pf[3][1], Z]); }
    for (const zs of [-1, 1]) boxT(pc, sd*1404, lkY(48), zs*LK.ipz, 9, 12, 9);           // splay saddle housings at the cables' entry
  }
  B.flush(g); return g;
}
// approach viaducts: a box girder under each carriageway (following the real OSM ways), piers every 110 m, lamps
function linkApproach(t0, t1, X0, Z0){
  const g = new THREE.Group(), B = new Bat(), pg = B.a(LKC.gird), pc = B.a(LKC.conc), pcap = B.a(LKC.cap), pr = B.a(LKC.rail);
  for (const L of LKD){
    const S = L.filter(q => q[0] >= t0 - 0.1 && q[0] <= t1 + 0.1);
    if (S.length < 2) continue;
    const pts = S.map(([t, x, z]) => [x - X0, lkY(lkRoad(t)), z - Z0]);
    const R = sweep(pg, pts, [[-9.4, -0.3], [-9.4, -1.2], [-6.0, -3.8], [6.0, -3.8], [9.4, -1.2], [9.4, -0.3]]);
    capT(pg, R[0]); capT(pg, R[R.length - 1].slice().reverse());
    for (const sd of [-1, 1]) sweep(pr, pts, [[sd*9.0, -0.3], [sd*9.35, -0.3], [sd*9.35, 1.1], [sd*9.0, 1.1]]);
    // piers (twin-leg pier under each girder) and lamps on the outer edge
    const side = (S[0][2] + S[S.length - 1][2])/2 > (LKD[0][0][2] + LKD[1][0][2])/2 ? 1 : -1;
    const at = t => { let i = 0; while (i < S.length - 2 && S[i + 1][0] < t) i++; const a = S[i], b = S[i + 1], f = (t - a[0])/((b[0] - a[0]) || 1); return [a[1] + (b[1] - a[1])*f - X0, a[2] + (b[2] - a[2])*f - Z0, Math.atan2(-(b[2] - a[2]), b[1] - a[1])]; };
    for (const t of [t0 < 0 ? t1 - 12 : t0 + 12].concat(Array.from({length:40}, (_, i) => Math.ceil((t0 + 60)/110)*110 + i*110).filter(t => t < t1 - 30))){
      const [x, z, ry] = at(t), yb = lkY(lkRoad(t)) - 3.8;
      if (yb < 1.5) continue;
      boxT(pcap, x, lkY(-2.5), z, 9, 4.5, 14, ry);
      for (const s of [-1, 1]){ const c = Math.cos(ry), sn = Math.sin(ry), ox = s*3.6*sn, oz = s*3.6*c; boxT(pc, x + ox, lkY(2), z + oz, 3.4, yb - lkY(2) - 1.6, 3.0, ry); }
      boxT(pc, x, yb - 1.6, z, 4.2, 1.6, 12.5, ry);
    }
    for (let t = Math.ceil(t0/38.4)*38.4; t < t1; t += 38.4){
      const [x, z, ry] = at(t), c = Math.cos(ry), sn = Math.sin(ry), y = lkY(lkRoad(t)) - 0.3;
      for (const s of [-1, 1]) lkLamp(B, x + s*8.6*sn, y, z + s*8.6*c);
    }
  }
  B.flush(g); return g;
}
LANDMARKS.szszlink = {zh:'深中通道伶仃洋大桥', en:'Lingdingyang Bridge (Shenzhen-Zhongshan Link)', cat:'new', r:1560, h:273,
  lt:{m:0, c:'#fff1dc', k:0.95, e:0.75}, build(){ return linkMain(); }};
LANDMARKS.szszlink_w = {zh:'深中通道伶仃洋大桥西引桥', en:'Lingdingyang Bridge west approach', cat:'new', r:1250, h:70,
  lt:{m:0, c:'#fff1dc', k:0.45, e:0.6}, build(){ return linkApproach(-3746, -1458, -2631.6, -2.5); }};
LANDMARKS.szszlink_e = {zh:'深中通道伶仃洋大桥东引桥', en:'Lingdingyang Bridge east approach', cat:'new', r:1400, h:70,
  lt:{m:0, c:'#fff1dc', k:0.45, e:0.6}, build(){ return linkApproach(1458, 4060, 2780.7, -113.9); }};
SG_PLACES.push({type:'szszlink', lat:22.5553435, lon:113.7255956, rot:0.32976});
SG_PLACES.push({type:'szszlink_w', lat:22.5476699, lon:113.7014180, rot:0.32976});
SG_PLACES.push({type:'szszlink_e', lat:22.5644486, lon:113.7507763, rot:0.32976});
