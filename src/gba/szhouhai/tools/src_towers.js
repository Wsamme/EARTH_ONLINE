
// shared: a glass shaft over plan P from y0 to y1 with fins / ledges (o = facade options per face kind)
function shaft(B, P, y0, y1, GL, FIN, LED, o){
  prism(B, GL, P, y0, y1, false);
  if (o) facade(B, o.fin ? FIN : null, o.led ? LED : null, P, y0, y1, o);
}
// a rectangle [x0, x1, z0, z1] -> ring (counter-clockwise seen from above with +z south)
const rect = (x0, x1, z0, z1) => [[x0, z0], [x0, z1], [x1, z1], [x1, z0]];
const chamf = (x0, x1, z0, z1, c) => [[x0 + c, z0], [x0, z0 + c], [x0, z1 - c], [x0 + c, z1], [x1 - c, z1], [x1, z1 - c], [x1, z0 + c], [x1 - c, z0]];

// ================= One Shenzhen Bay, Tower 7 (深圳湾一号 T7; KPF, 2018) =================
// OSM w571169591 (T7, a 50 x 60 m plan, long side north-south). 341.4 m to the tip, top floor 319.7 m (Wikipedia; 71 storeys,
// CTBUH / Skyrise Cities). The tower narrows as it rises, its profile stepping in as the use changes from offices (large plates
// low down) to residences and the hotel above; high-reflectivity curtain wall with sun fins on the east and west faces and
// horizontal projections on the north and south (Skyrise Cities); a sky bar and the Sky Concert Hall on the 71st floor at the top
// (Thornton Tomasetti); a lit crown. The step heights are an estimate from photos. Night: LED skin in the bay light show.
LANDMARKS.szonebay = {zh:'深圳湾一号', en:'One Shenzhen Bay', cat:'new', r:42, h:341.4, lt:{m:1, c:'#e4eeff', k:0.75, anim:'show', c2:'#8fd8ff'},
  build(){
    const g = new THREE.Group(), B = Bt();
    const GL = {c:'#8da0ab', m:2, lk:0.34}, FIN = {c:'#d4d8d9', m:0, lk:0.55}, LED = {c:'#cfd3d4', m:0, lk:0.5}, ROOF = {c:'#8e9193'},
      CROWN = {c:'#a9bcc8', m:0, lk:0.9, glow:'#d7e9ff', gk:0.55}, BASE = {c:'#b6b0a6', m:0, lk:0.4}, LOB = {c:'#4e5a61', m:1, fh:6, cw:3};
    // steps: [y0, y1, inset east-west, inset north-south]
    const ST = [[0, 168, 0, 0], [168, 262, 1.8, 0.8], [262, 319.7, 3.8, 1.8]];
    box(B, LOB, -24.6, 24.6, -1, 12, -29.6, 29.6);
    for (const [y0, y1, ix, iz] of ST){ const P = rect(-25 + ix, 25 - ix, -30 + iz, 30 - iz);
      shaft(B, P, Math.max(12, y0), y1, GL, FIN, LED, null);
      // east / west faces: vertical sun fins every 3 m; north / south: a horizontal projection at every floor (4.5 m)
      for (const x of [-25 + ix, 25 - ix]){ const s = Math.sign(x); for (let z = -30 + iz + 1.5; z <= 30 - iz - 1.4; z += 3) box(B, FIN, s > 0 ? x : x - 0.9, s > 0 ? x + 0.9 : x, Math.max(12, y0), y1, z - 0.2, z + 0.2); }
      for (const z of [-30 + iz, 30 - iz]){ const s = Math.sign(z); for (let y = Math.max(12, y0) + 4.5; y < y1 - 1; y += 4.5) box(B, LED, -25 + ix, 25 - ix, y, y + 0.4, s > 0 ? z : z - 1.0, s > 0 ? z + 1.0 : z); }
      cap(B, ROOF, P, y1); }
    // the crown: the fins run on past the top floor as an open screen round a glowing lantern (sky bar / concert hall level)
    const ix = 3.8, iz = 1.8, Pt = rect(-25 + ix, 25 - ix, -30 + iz, 30 - iz);
    prism(B, CROWN, off(Pt, -3), 319.7, 333, ROOF);
    for (const x of [-25 + ix, 25 - ix]) for (let z = -30 + iz + 1.5; z <= 30 - iz - 1.4; z += 3){ const t = Math.abs(z)/(30 - iz), top = lerp(341.4, 330, t*t); box(B, FIN, x - 0.45, x + 0.45, 319.7, top, z - 0.25, z + 0.25); }
    for (const z of [-30 + iz, 30 - iz]) box(B, FIN, -25 + ix, 25 - ix, 329, 330.2, z - 0.4, z + 0.4);
    box(B, BASE, -26, 26, -1, 1.2, -31, 31);
    const AV = avia(B, g, [[0, 333.2, 0], [-21.2, 341.4, 0], [21.2, 341.4, 0]]);
    B.flush(g); lights(g, AV, [1, 0.16, 0.1], 12);
    return g;
  }};
SG_PLACES.push({type:'szonebay', lat:22.508798, lon:113.937445, rot:0});

// ================= Shenzhen Bay Innovation and Technology Centre, Towers 1 and 2 (深圳湾创新科技中心; RMJM, 2020) =================
// OSM w781258408 (Tower A / 1, the anchor) and w781258407 (Tower B / 2): two square R&D towers, 311.1 m (69 floors) and 247.2 m
// (53 floors) (Wikipedia, CTBUH), linked by three-storey bridges at different heights, the highest at 150 m (Buro Happold; OSM's
// two link parts w1270117300 / w1270117301 top out at 159 m and 38 m); tinted dark blue-grey glass on the upper parts (e-architect).
// Crown details are an estimate. Night: LED skins in the bay light show.
LANDMARKS.szbayinno = {zh:'深圳湾创新科技中心', en:'Shenzhen Bay Innovation and Technology Centre', cat:'new', r:116, h:311.1, lt:{m:1, c:'#e4eeff', k:0.7, anim:'show', c2:'#b48cff'},
  build(){
    const g = new THREE.Group(), B = Bt();
    const GL = {c:'#5f707c', m:2, lk:0.34}, GLL = {c:'#7f919c', m:1, fh:4.5, cw:3.0}, FIN = {c:'#c7cdd0', m:0, lk:0.5}, ROOF = {c:'#8e9193'},
      LINK = {c:'#6c7d88', m:1, fh:4.4, cw:2.5, lc:'#ffe2bf'}, SLAB = {c:'#d8dad8', m:0, lk:0.6}, CROWN = {c:'#a6b6c0', m:0, lk:0.85, glow:'#d0e4ff', gk:0.4}, GRN = {c:'#6f8a55'};
    const tw = (R, H, cx, cz) => {
      const x0 = Math.min(...R.map(p => p[0])), x1 = Math.max(...R.map(p => p[0])), z0 = Math.min(...R.map(p => p[1])), z1 = Math.max(...R.map(p => p[1]));
      const P0 = chamf(x0, x1, z0, z1, 2.2), Ht = H - 14, low = 40;
      prism(B, GLL, P0, -1, low, false);
      prism(B, GL, P0, low, Ht, false);
      facade(B, FIN, SLAB, P0, low, Ht, {cw:3.0, fd:0.7, fw:0.3, fh:4.5, ld:0.5, lh:0.35});
      facade(B, FIN, null, P0, -1, low, {cw:6.0, fd:0.8, fw:0.5});
      // crown: stepped-in lantern and a frame of fins
      const P1 = chamf(x0 + 2.5, x1 - 2.5, z0 + 2.5, z1 - 2.5, 2.5); cap(B, ROOF, P0, Ht);
      prism(B, CROWN, off(P1, -2), Ht, H - 3, ROOF);
      facade(B, FIN, null, P1, Ht, H, {cw:2.4, fd:0.6, fw:0.35, ends:true});
      return [[(x0 + x1)/2, H, (z0 + z1)/2]];
    };
    const AV = [];
    AV.push(...tw(D.bi.t1, 311.1)); AV.push(...tw(D.bi.t2, 247.2));
    // the linking blocks between Tower 1's north-east and Tower 2's south-west faces: three storeys each, glazed, with sky gardens
    const LQ = [[24.5, -5], [24.5, -24], [37.5, -42], [37.5, -22]];
    for (const [y0, y1] of [[25, 38], [146, 159]]){ prism(B, LINK, LQ, y0, y1, GRN, SLAB); prism(B, SLAB, off(LQ, 0.3), y1 - 0.4, y1 + 1.1, false); prism(B, SLAB, off(LQ, 0.3), y0 - 0.6, y0, false, SLAB); }
    const A2 = avia(B, g, AV);
    B.flush(g); lights(g, A2, [1, 0.16, 0.1], 12);
    return g;
  }};
SG_PLACES.push({type:'szbayinno', lat:22.531646, lon:113.941539, rot:0});

// ================= China Merchants Bank Global Headquarters (招商银行全球总部大厦; Foster + Partners with CCDI) =================
// OSM w1443942674 ("招银环球金融中心"), five building:parts side by side west to east topping out at 300, 340, 387, 340 and 300 m.
// Height 388 m (Dezeen; 387 m OSM; sources differ, targets.json leaves h null): the upper part staggers in steps topped with
// landscaped terraces; the north facade is rectilinear, the south facade has rounded vertical sections (paper folding); a ribbed
// steel-and-glass facade of triangular panels round an off-centre core (Dezeen, Foster + Partners). Night: lit windows.
LANDMARKS.szcmbhq = {zh:'招商银行全球总部大厦', en:'China Merchants Bank Global Headquarters', cat:'new', r:42, h:387, lt:{m:1, c:'#e8efff', k:0.75},
  build(){
    const g = new THREE.Group(), B = Bt();
    const GL = {c:'#8497a3', m:1, fh:4.6, cw:2.6}, RIB = {c:'#cfd2d1', m:0, lk:0.55}, ROOF = {c:'#8e9193'}, GRN = {c:'#68864f'}, TREE = {c:'#4f6d3b'}, LOB = {c:'#4f5b62', m:1, fh:6, cw:3},
      CROWN = {c:'#9fb2be', m:0, lk:0.8, glow:'#dce9ff', gk:0.3};
    const parts = D.cmb.parts.slice().sort((a, b) => cen(a[2])[0] - cen(b[2])[0]);
    const AV = [];
    for (const [b0, top, R] of parts){
      const P = R.length > 3 ? R : R;
      prism(B, LOB, P, -1, 10, false); prism(B, GL, P, 10, top, false);
      // ribs: vertical steel ribs every ~1.6 m round the strip, deeper on the south (rounded) side
      for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.8) continue; const Nn = outN(P, a, b), k = Math.max(1, Math.round(L/1.6)), d = Nn[1] > 0.3 ? 0.8 : 0.45;
        for (let j = 0; j < k; j++){ const t = (j + 0.5)/k, x = lerp(a[0], b[0], t) + Nn[0]*d/2, z = lerp(a[1], b[1], t) + Nn[1]*d/2; obox(B, RIB, x, z, Nn[0], Nn[1], d, 0.28, 10, top - 0.3); } }
      // the terrace on top of each lower step: a planted roof behind a glass balustrade; the central strip ends in a lit lantern
      cap(B, ROOF, P, top);
      if (top < 380){ const I = off(P, -1.2); cap(B, GRN, I, top + 0.25); prism(B, CROWN, I, top, top + 1.3, false);
        const c = cen(P); for (let k = 0; k < 4; k++){ const x = c[0] + (k % 2 ? 3 : -3), z = c[1] + (k < 2 ? -6 : 6); if (!pip(I, x, z)) continue; box(B, TREE, x - 1.4, x + 1.4, top + 1, top + 3.6, z - 1.4, z + 1.4); } }
      else { prism(B, CROWN, off(P, -1.5), top - 12, top - 0.5, ROOF); AV.push([cen(P)[0], top, cen(P)[1]]); }
    }
    const A2 = avia(B, g, AV);
    B.flush(g); lights(g, A2, [1, 0.16, 0.1], 12);
    return g;
  }};
SG_PLACES.push({type:'szcmbhq', lat:22.525341, lon:113.965175, rot:0});

// ================= Huiyun Center (深湾汇云中心; AREP with AUBE and CAPOL, 2023) =================
// OSM w1169311439 (a 51 m square). 359.2 m, 80 floors (Wikipedia; 358.7 m and 79 floors per the Shenzhen government); a simple,
// refined form whose facade draws in gently as it rises (收分), with the "Eye of the Bay" cloud observatory and the open-air
// "Mirror of the Sky" roof deck at the top, over 350 m (Archiposition). The chamfer and taper amounts are estimates from photos.
// Night: lit windows, a glowing crown ring.
LANDMARKS.szhuiyun = {zh:'深湾汇云中心', en:'Huiyun Center', cat:'new', r:38, h:359.2, lt:{m:1, c:'#e6efff', k:0.8},
  build(){
    const g = new THREE.Group(), B = Bt();
    const GL = {c:'#8899a4', m:1, fh:4.3, cw:3.0}, FIN = {c:'#d7dadb', m:0, lk:0.6}, ROOF = {c:'#8e9193'}, CROWN = {c:'#b2c3cd', m:0, lk:0.9, glow:'#dbeaff', gk:0.5},
      LOB = {c:'#4f5b62', m:1, fh:6, cw:3}, DECK = {c:'#7d8b93', glow:'#cfe4ff', gk:0.25};
    const hw = y => lerp(25.4, 22.0, Math.pow(clamp(y/350, 0, 1), 1.6)), ch = y => lerp(4.5, 6.0, y/350);
    const ys = [0, 14, 60, 120, 180, 240, 290, 330, 350];
    const ring = y => chamf(-hw(y), hw(y), -hw(y), hw(y), ch(y)).map(p => [p[0], y, p[1]]);
    loft(B, LOB, [ring(-1), ring(14)]);
    loft(B, GL, ys.slice(1).map(ring));
    // vertical fins at every 3 m on the faces and on the chamfers, following the taper
    for (let q = 0; q < 8; q++){ const nf = q % 2 ? 2 : 15;
      for (let j = 0; j <= nf; j++){ if (q % 2 === 0 && (j === 0 || j === nf)) continue;
        const pts = [], outs = []; for (const y of ys.slice(1)){ const R = chamf(-hw(y), hw(y), -hw(y), hw(y), ch(y)), a = R[q], b = R[(q + 1) % 8], t = j/nf; pts.push([lerp(a[0], b[0], t), y, lerp(a[1], b[1], t)]); outs.push(outN(R, a, b)); }
        rib(B, FIN, pts, outs, -0.55, 0.2); } }
    // crown: the glass parapet ring of the roof deck and the observatory lantern
    const Rt = chamf(-hw(350), hw(350), -hw(350), hw(350), ch(350));
    cap(B, DECK, Rt, 350.2);
    prism(B, CROWN, Rt, 350, 359.2, false);
    prism(B, CROWN, off(Rt, -9), 350, 357, ROOF);
    const AV = avia(B, g, [[0, 357, 0], [-hw(350) + 1, 359.2, 0], [hw(350) - 1, 359.2, 0]]);
    B.flush(g); lights(g, AV, [1, 0.16, 0.1], 12);
    return g;
  }};
SG_PLACES.push({type:'szhuiyun', lat:22.526989, lon:113.965361, rot:0});
