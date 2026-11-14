// ===== Dongguan · Humen and the Pearl River mouth (City Brush, Greater Bay map, group dghumen) =====
// Keys (best known first): dghumenbridge (Humen Bridge), dgnansha (Nansha Bridge, Nizhou Waterway Bridge), dgopiumwar (Opium War
// Museum memorial area), dgweiyuan (Weiyuan Fort), dgseabattle (Humen Naval Battle Museum), dgdasha (Nansha Bridge, Dasha Waterway
// Bridge), dghumenstation (Humen Railway Station).
// All positions come from gba/ref_dghumen.json (local metres round each target's anchor: +x east, +z south); the bridge axes, the
// water each main span crosses and the Dasha anchorage footprints were measured from it (tools/bridges.py, tools/humen2.py).
// Verified facts used: Humen Bridge main span 888 m, single suspended span (targets.json notes); Nansha Bridge main spans 1 688 m
// (Nizhou) and 1 200 m (Dasha) (targets.json notes). Everything else (tower shapes, sag ratios, hanger spacing, side-span lengths
// where no anchorage footprint exists, wall and roof heights) is an APPROXIMATION and is marked so below.
// The road decks are the app's (OSM, generic deck rule: 7.2 m above the clamped ground, i.e. ~6.9 m over the water). The bridge
// superstructures are fitted round that deck: tower heights above the deck keep the real proportion (sag / span), so the whole
// suspension system sits low with the deck; if the integrator lifts the decks, raise DECK in each bridge config by the same amount.
// No logos, wordmarks, signage or text anywhere. Randomness: none.
{
const PI = Math.PI, TAU = PI*2;
// ---------- batching: triangles per colour spec, flushed into one LTris call each ----------
function Bt(){ const M = new Map();
  const arr = col => { const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; };
  return { arr,
    q(col, a, b, c, d){ arr(col).push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]); },
    t(col, a, b, c){ arr(col).push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); },
    flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; }
function obox(B, col, cx, cz, ux, uz, L, W, y0, y1, noBot){
  const l = Math.hypot(ux, uz) || 1; ux /= l; uz /= l; const vx = -uz, vz = ux, a = L/2, b = W/2;
  const P = (s, t) => [cx + ux*s + vx*t, cz + uz*s + vz*t];
  const c = [P(-a, -b), P(a, -b), P(a, b), P(-a, b)];
  const lo = c.map(p => [p[0], y0, p[1]]), hi = c.map(p => [p[0], y1, p[1]]);
  for (let i = 0; i < 4; i++){ const j = (i + 1)%4; B.q(col, lo[i], lo[j], hi[j], hi[i]); }
  B.q(col, hi[3], hi[2], hi[1], hi[0]); if (!noBot) B.q(col, lo[0], lo[1], lo[2], lo[3]);
}
function cap(B, col, ring, y){
  const V = ring.map(p => new THREE.Vector2(p[0], p[1])), tr = THREE.ShapeUtils.triangulateShape(V, []);
  for (const [a, b, c] of tr) B.t(col, [V[a].x, y, V[a].y], [V[b].x, y, V[b].y], [V[c].x, y, V[c].y]);
}
function ext(B, col, ring, y0, y1, topCol){
  const n = ring.length;
  for (let i = 0; i < n; i++){ const a = ring[i], b = ring[(i + 1)%n]; B.q(col, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
  if (topCol !== null) cap(B, topCol || col, ring, y1);
}
function cylw(B, col, x, z, r0, r1, y0, y1, n, capTop){
  const P = (r, y, k) => [x + Math.cos(k/n*TAU)*r, y, z + Math.sin(k/n*TAU)*r];
  for (let k = 0; k < n; k++){ B.q(col, P(r0, y0, k), P(r0, y0, k + 1), P(r1, y1, k + 1), P(r1, y1, k)); if (capTop) B.t(capTop, P(r1, y1, k), P(r1, y1, k + 1), [x, y1, z]); }
}
const area2 = R => { let s = 0; for (let i = 0; i < R.length; i++){ const p = R[i], q = R[(i + 1)%R.length]; s += p[0]*q[1] - q[0]*p[1]; } return s; };
function grow(R, d){ const n = R.length, o = area2(R) > 0 ? 1 : -1;
  return R.map((p, i) => { const a = R[(i + n - 1)%n], b = R[(i + 1)%n];
    const e1 = [p[0] - a[0], p[1] - a[1]], e2 = [b[0] - p[0], b[1] - p[1]], l1 = Math.hypot(...e1) || 1, l2 = Math.hypot(...e2) || 1;
    const n1 = [o*e1[1]/l1, -o*e1[0]/l1], n2 = [o*e2[1]/l2, -o*e2[0]/l2], m = [n1[0] + n2[0], n1[1] + n2[1]], ml = Math.hypot(...m) || 1, cs = (m[0]*n1[0] + m[1]*n1[1])/ml;
    const k = d/Math.max(0.35, cs); return [p[0] + m[0]/ml*k, p[1] + m[1]/ml*k]; }); }
const centroid = R => { let a = 0, cx = 0, cz = 0; for (let i = 0; i < R.length; i++){ const p = R[i], q = R[(i + 1)%R.length], f = p[0]*q[1] - q[0]*p[1]; a += f; cx += (p[0] + q[0])*f; cz += (p[1] + q[1])*f; } return a ? [cx/(3*a), cz/(3*a)] : R[0]; };
// square-section prism from a to b ([x, y, z]), width w (cables, hangers, struts)
function seg(B, col, a, b, w){
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...d) || 1; d[0] /= L; d[1] /= L; d[2] /= L;
  const up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let p = [d[1]*up[2] - d[2]*up[1], d[2]*up[0] - d[0]*up[2], d[0]*up[1] - d[1]*up[0]]; let l = Math.hypot(...p); p = p.map(v => v/l*w/2);
  let q = [d[1]*p[2] - d[2]*p[1], d[2]*p[0] - d[0]*p[2], d[0]*p[1] - d[1]*p[0]]; l = Math.hypot(...q); q = q.map(v => v/l*w/2);
  const C = (o, sp, sq) => [o[0] + p[0]*sp + q[0]*sq, o[1] + p[1]*sp + q[1]*sq, o[2] + p[2]*sp + q[2]*sq];
  const A = [C(a, -1, -1), C(a, 1, -1), C(a, 1, 1), C(a, -1, 1)], Bq = [C(b, -1, -1), C(b, 1, -1), C(b, 1, 1), C(b, -1, 1)];
  for (let i = 0; i < 4; i++){ const j = (i + 1)%4; B.q(col, A[i], A[j], Bq[j], Bq[i]); }
}
// glowing point sprites (night only): cable lights, aviation lights
function beacons(g, pts, rgb, size){
  if (!pts.length) return;
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const col = new Float32Array(pts.length); for (let i = 0; i < col.length; i += 3){ col[i] = rgb[0]; col[i + 1] = rgb[1]; col[i + 2] = rgb[2]; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({size, map:typeof lampTex !== 'undefined' ? lampTex : null, vertexColors:true, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true});
  const p = new THREE.Points(geo, mat); p.renderOrder = 6;
  p.onBeforeRender = () => { mat.opacity = typeof matLamp !== 'undefined' ? Math.min(1, matLamp.opacity*1.1) : (NIGHT.uNight.value > 0.5 ? 1 : 0); };
  g.add(p);
}
const RED = {c:'#a81010', glow:'#ff2a14', gk:2.4};
const LL = (lat, lon, x, z) => [lat - z/110734.9, lon + x/103014.2];
const baseAbs = () => (typeof LMCTX !== 'undefined' && LMCTX && LMCTX.u && LMCTX.u.base) ? LMCTX.u.base.value : 0;

// ================= suspension bridges (towers, main cables, hangers, stiffening girder, anchorages) =================
// cfg: axis u (unit, local x / z), main span 'span' centred on the place anchor, cable planes at +-half, DECK = the app's road
// surface (absolute m), sag = cable sag (approximate ratio), anchorages at sA (west, negative) / sB (east) along the axis.
function suspBridge(cfg){
  const g = new THREE.Group(), B = Bt(), base = baseAbs();
  const [ux, uz] = cfg.u, vx = -uz, vz = ux, Y = y => y - base;
  const P = (s, t, y) => [ux*s + vx*t, Y(y), uz*s + vz*t];
  const {span, half, DECK, sag} = cfg, hs = span/2;
  const low = DECK + cfg.mid, sad = low + sag, top = sad + cfg.crown;
  const TW = cfg.tower, CAB = cfg.cable, HANG = cfg.hanger, GIR = cfg.girder, GSOF = cfg.girderSoffit, ANC = cfg.anchor, CAPC = cfg.capCol;
  const lights = [], reds = [];
  // ---- towers: two tapered concrete legs, portal cross beams (count / heights approximate), pile cap at the water
  for (const s0 of [-hs, hs]){
    obox(B, CAPC, ux*s0, uz*s0, ux, uz, cfg.legL + 10, 2*half + cfg.legW + 12, Y(-3), Y(2.5));
    const nseg = 6;
    for (const t0 of [-half, half]){
      for (let k = 0; k < nseg; k++){
        const y0 = 2.5 + (top - 2.5)*k/nseg, y1 = 2.5 + (top - 2.5)*(k + 1)/nseg, f0 = 1 - 0.3*k/nseg, f1 = 1 - 0.3*(k + 1)/nseg;
        // a frustum: lerp the footprint between levels (legs lean slightly inwards toward the top)
        const lean = cfg.lean || 0, tA = t0 - Math.sign(t0)*lean*(y0 - 2.5)/(top - 2.5), tB = t0 - Math.sign(t0)*lean*(y1 - 2.5)/(top - 2.5);
        const ring = (f, tt, y) => { const a = cfg.legL*f/2, b = cfg.legW*f/2; return [P(s0 - a, tt - b, y), P(s0 + a, tt - b, y), P(s0 + a, tt + b, y), P(s0 - a, tt + b, y)]; };
        const R0 = ring(f0, tA, y0), R1 = ring(f1, tB, y1);
        for (let i = 0; i < 4; i++){ const j = (i + 1)%4; B.q(TW, R0[i], R0[j], R1[j], R1[i]); }
        if (k === nseg - 1) B.q(TW, R1[3], R1[2], R1[1], R1[0]);
      }
      reds.push(...P(s0, t0 - Math.sign(t0)*(cfg.lean || 0), top + 1.2));
    }
    // cross beams: below the girder, and the portal beams above the deck
    const beam = (y, d) => { const tIn = half - (cfg.lean || 0)*(y - 2.5)/(top - 2.5);
      obox(B, TW, ux*s0, uz*s0, ux, uz, cfg.legL*0.75, 2*tIn, Y(y - d/2), Y(y + d/2)); };
    beam(DECK - cfg.girderD - 2.2, 3.2);
    for (const f of cfg.beams) beam(DECK + (top - DECK)*f, cfg.beamD);
    // saddle housings on the tower tops
    for (const t0 of [-half, half]){ const tt = t0 - Math.sign(t0)*(cfg.lean || 0); const c = P(s0, tt, top);
      obox(B, CAPC, c[0], c[2], ux, uz, cfg.legL*0.75, cfg.legW*0.75, c[1], c[1] + 2.2); }
  }
  // ---- main cables: parabola in the main span, straight-ish backstays to the anchorages
  const cy = s => low + sag*Math.pow(s/hs, 2);
  const tTop = half - (cfg.lean || 0);
  for (const sg of [-1, 1]){
    const tt = s => { const f = Math.min(1, Math.abs(s)/hs); return sg*(half + (tTop - half)*f*f*0); };   // cable planes vertical (approx.)
    const N = Math.round(span/24); let prev = null;
    for (let i = 0; i <= N; i++){ const s = -hs + span*i/N, p = P(s, sg*half, cy(s) + CAB.r); if (prev) seg(B, CAB, prev, p, CAB.w); prev = p; if (i % 2 === 1) lights.push(...P(s, sg*half, cy(s) + CAB.w + 0.6)); }
    // backstays
    for (const [s0, sA] of [[-hs, cfg.sA], [hs, cfg.sB]]){
      const a = P(s0, sg*half, sad + CAB.r), b = P(sA, sg*(half + 1.5), DECK + cfg.anchH*0.6);
      const M = 8; let pv = a;
      for (let i = 1; i <= M; i++){ const f = i/M, s = s0 + (sA - s0)*f, y = sad + (DECK + cfg.anchH*0.6 - sad)*f - Math.sin(f*PI)*Math.abs(sA - s0)*0.012;
        const p = P(s, sg*(half + 1.5*f), y + CAB.r); seg(B, CAB, pv, p, CAB.w); pv = p; if (i % 2 === 0) lights.push(...P(s, sg*(half + 1.5*f), y + CAB.w + 0.6)); }
    }
    // hangers (spacing approximate)
    const nH = Math.floor(span/cfg.hStep);
    for (let i = 1; i < nH; i++){ const s = -hs + span*i/nH; if (Math.abs(Math.abs(s) - hs) < 8) continue;
      seg(B, HANG, P(s, sg*half, cy(s)), P(s, sg*half, DECK - 0.4), 0.35); }
  }
  // ---- stiffening girder under the app's deck: a flat streamlined box (section approximate), main span only
  {
    const gw = half + 1.2, d = cfg.girderD, yT = DECK - 0.28, yB = DECK - d, ysd = DECK - d*0.45;
    const sec = [[-gw, yT], [gw, yT], [gw + 1.8, ysd], [gw - 3.5, yB], [-gw + 3.5, yB], [-gw - 1.8, ysd]];
    const s0 = -hs + 4, s1 = hs - 4;
    for (let i = 0; i < sec.length; i++){ const a = sec[i], b = sec[(i + 1)%sec.length], col = i === 0 ? GIR : i === 3 ? GSOF : GIR;
      B.q(col, P(s0, a[0], a[1]), P(s0, b[0], b[1]), P(s1, b[0], b[1]), P(s1, a[0], a[1])); }
    // end diaphragms and the outer edge fascia (lit band at night)
    for (const sg of [-1, 1]) for (let s = s0; s < s1 - 1; s += 300){ const e = Math.min(s1, s + 300);
      B.q(cfg.fascia, P(s, sg*(gw + 0.2), yT + 0.9), P(e, sg*(gw + 0.2), yT + 0.9), P(e, sg*(gw + 0.2), yT - 0.1), P(s, sg*(gw + 0.2), yT - 0.1)); }
  }
  // ---- anchorages: gravity blocks with a sloping front where the backstays enter (sizes approximate unless a footprint exists)
  for (const [sA, dir] of [[cfg.sA, -1], [cfg.sB, 1]]){
    // a block on each side of the app's carriageways (the road passes between them), joined below the deck
    const L = cfg.anchL, h = DECK + cfg.anchH, c = sA + dir*L*0.3;
    obox(B, ANC, ux*c, uz*c, ux, uz, L, 2*half + 16, Y(-3), Y(DECK - 1.2));
    for (const sg of [-1, 1]){ const t0 = sg*(half + 1.5 - 3.0), t1 = sg*(half + 1.5 + 7.0);
      const ringAt = (y, inset) => [P(c - L/2 + (dir < 0 ? 0 : inset), t0, y), P(c + L/2 - (dir > 0 ? 0 : inset), t0, y), P(c + L/2 - (dir > 0 ? 0 : inset), t1, y), P(c - L/2 + (dir < 0 ? 0 : inset), t1, y)];
      const R1 = ringAt(DECK - 1.2, 0), R2 = ringAt(h, L*0.45);
      for (let i = 0; i < 4; i++){ const j = (i + 1)%4; B.q(ANC, R1[i], R1[j], R2[j], R2[i]); }
      B.q(ANC, R2[0], R2[1], R2[2], R2[3]); B.q(ANC, R2[3], R2[2], R2[1], R2[0]); }
  }
  B.flush(g);
  beacons(g, lights, cfg.lightRGB, cfg.lightSize);
  beacons(g, reds, [1, 0.12, 0.08], 9);
  return g;
}

// ================= Humen Bridge (虎门大桥) =================
// Opened 9 June 1997; suspension bridge, 888 m main span, single suspended span (targets.json). Axis fitted to the two OSM
// carriageways over the main channel (tools/humen2.py): centre (873.4, -659.8), u = (0.84924, -0.52801); the channel (terrain
// < -1 m) runs from s = -250 to s = +650, so mid-span is at s = +200 and the towers at -244 / +644 (both at the shore, the east
// one on Weiyuan Island). Approximations: concrete portal towers with three beams above the deck, sag 1/10.5 of the span,
// hangers every 12 m, backstays about 300 m to gravity anchorages on both banks, a flat steel box girder 3 m deep.
const HM = (() => { const c = [873.4 + 0.84924*200, -659.8 - 0.52801*200]; return {c, ll:LL(22.789595, 113.604583, c[0], c[1])}; })();
LANDMARKS.dghumenbridge = {zh:'虎门大桥', en:'Humen Bridge', cat:'new', r:780, h:100, lt:{m:0, c:'#fff1dc', k:0.65},
  build(){
    return suspBridge({u:[0.84924, -0.52801], span:888, half:17.5, DECK:6.9, mid:2.2, sag:888/10.5, crown:3.5,
      legL:7.5, legW:5.5, lean:1.5, beams:[0.42, 0.74, 0.97], beamD:4.5, girderD:3.0, hStep:12, sA:-444 - 300, sB:444 + 300, anchL:46, anchH:14,
      tower:{c:'#d3cfc5', m:0, lk:0.55}, capCol:'#a9a59b', cable:{c:'#c9c6bd', m:0, r:0.4, w:0.75}, hanger:'#b9b6ad',
      girder:{c:'#cfd2d0', m:0}, girderSoffit:'#8f9496', fascia:{c:'#e6e3da', glow:'#fff0d4', gk:0.5}, anchor:{c:'#bdb8ad', m:0, lk:0.4},
      lightRGB:[1, 0.95, 0.85], lightSize:7});
  }};
SG_PLACES.push({type:'dghumenbridge', lat:HM.ll[0], lon:HM.ll[1], rot:0});

// ================= Nansha Bridge, Nizhou Waterway Bridge (南沙大桥坭洲水道桥) =================
// Opened 2 April 2019; suspension bridge, 1 688 m main span (targets.json). Axis: centre (-10.1, -6.2), u = (0.97927, 0.20255)
// (straight, both carriageways within 1.3 m); the waterway (terrain < -1 m) runs from s = -684 to +776, mid-span at s = +46, the
// towers 844 m either side, on the banks. Approximations: concrete portal towers, sag 1/10, hangers every 12.8 m, backstays
// 0.3 x span to the anchorages (no anchorage footprint in the data), steel box girder 4 m deep.
const NZ = (() => { const c = [-10.1 + 0.97927*46, -6.2 + 0.20255*46]; return {c, ll:LL(22.88482, 113.564972, c[0], c[1])}; })();
LANDMARKS.dgnansha = {zh:'南沙大桥坭洲水道桥', en:'Nansha Bridge (Nizhou Waterway Bridge)', cat:'new', r:1400, h:185, lt:{m:0, c:'#f2f6ff', k:0.65},
  build(){
    return suspBridge({u:[0.97927, 0.20255], span:1688, half:19, DECK:6.9, mid:2.5, sag:1688/10, crown:4,
      legL:10, legW:7, lean:3, beams:[0.38, 0.7, 0.97], beamD:6, girderD:4.0, hStep:12.8, sA:-844 - 506, sB:844 + 506, anchL:60, anchH:18,
      tower:{c:'#cfccc4', m:0, lk:0.55}, capCol:'#a7a39a', cable:{c:'#cdccc6', m:0, r:0.5, w:0.95}, hanger:'#bdbcb6',
      girder:{c:'#d4d7d6', m:0}, girderSoffit:'#8d9294', fascia:{c:'#e8e8e2', glow:'#eef4ff', gk:0.5}, anchor:{c:'#bab6ac', m:0, lk:0.4},
      lightRGB:[0.9, 0.95, 1], lightSize:9});
  }};
SG_PLACES.push({type:'dgnansha', lat:NZ.ll[0], lon:NZ.ll[1], rot:0});

// ================= Opium War Museum memorial area (鸦片战争博物馆, the site of Lin Zexu's destruction of opium, 1839) =================
// Anchor = the memorial area w856669492. Built on the data: the museum hall w856669491 (13.4 m, 4 levels in OSM), the Humen story
// hall w1112904402 (3.7 m), the memorial (POI 虎门销化鸦片纪念碑 at (4.9, -37.4)) and Lin Zexu's statue (POI at (7.6, -33.4)) in the
// small square ringed by the path (-4..18, -44..-24), the sculpture group (POI 抗英群雕 at (41.2, 11.6)) in the square ringed by
// the path (26..56, -4..27), and the axis path joining them to the museum. Heights of the memorial and the sculptures are
// ESTIMATES; their forms are simplified. The two opium destruction pools are not in the map data: left out.
const OW = {mus:[[-62.4, -99.7], [-38.5, -117.7], [-20.5, -94.2], [-44.4, -76.2]], story:[[-87.1, -88.1], [-68.7, -101.9], [-56.6, -86.1], [-75.0, -72.2]],
  sq1:[[-4, -34], [10, -44], [18, -34], [4, -24]], sq2:[[26, 7], [41, -4], [56, 16], [41, 27]], axis:[[-28, -79], [3, -40], [11, -29], [34, 2]]};
LANDMARKS.dgopiumwar = {zh:'鸦片战争博物馆（林则徐销烟池）', en:'Opium War Museum and the Opium Destruction Pools', cat:'old', r:150, h:20, lt:{m:0, c:'#ffe2b8', k:0.55},
  build(){
    const g = new THREE.Group(), B = Bt();
    const WALL = {c:'#e4dccb', m:1, fh:3.3, cw:3.2}, ROOF = '#7c6f62', TRIM = '#c9bfab', GRAN = '#bdb6a8', PAVE = '#c7c0b2', BRONZE = {c:'#5e5240', m:0, lk:0.5},
      STELE = {c:'#d9d3c6', m:0, lk:0.55}, GLASS = {c:'#55656c', m:1, fh:3.3, cw:2.2};
    // museum hall: 4 levels on its footprint, a recessed top floor and a deep cornice (form approximate)
    ext(B, WALL, OW.mus, -1.5, 10.2, ROOF);
    ext(B, TRIM, grow(OW.mus, 0.8), 10.2, 11.0, TRIM);
    ext(B, GLASS, grow(OW.mus, -2.5), 11.0, 13.4, ROOF);
    ext(B, TRIM, grow(OW.mus, -2.0), 13.4, 13.9, TRIM);
    // entrance porch on the side facing the memorial axis (north-east face)
    { const a = OW.mus[2], b = OW.mus[3], mx = (a[0] + b[0])/2, mz = (a[1] + b[1])/2, ex = b[0] - a[0], ez = b[1] - a[1], L = Math.hypot(ex, ez), nx = -ez/L, nz = ex/L;
      const s = (nx*(mx - centroid(OW.mus)[0]) + nz*(mz - centroid(OW.mus)[1])) > 0 ? 1 : -1;
      obox(B, TRIM, mx + s*nx*3, mz + s*nz*3, ex, ez, 14, 6, 6.2, 7.0);
      for (const f of [-0.4, -0.13, 0.13, 0.4]) obox(B, TRIM, mx + ex*f*14/L + s*nx*5.4, mz + ez*f*14/L + s*nz*5.4, 1, 0, 0.8, 0.8, -0.5, 6.2, true); }
    // the story hall: a low pavilion with a hipped tile roof (approximate)
    ext(B, WALL, OW.story, -1.5, 3.7, null);
    { const c = centroid(OW.story), G = grow(OW.story, 0.9), T = G.map(p => [c[0] + (p[0] - c[0])*0.35, c[1] + (p[1] - c[1])*0.35]);
      for (let i = 0; i < 4; i++){ const j = (i + 1)%4; B.q(ROOF, [G[i][0], 3.7, G[i][1]], [G[j][0], 3.7, G[j][1]], [T[j][0], 6.2, T[j][1]], [T[i][0], 6.2, T[i][1]]); }
      cap(B, ROOF, T, 6.2); }
    // paved squares and the axis walk
    ext(B, PAVE, OW.sq1, -0.6, 0.35, PAVE);
    ext(B, PAVE, OW.sq2, -0.6, 0.35, PAVE);
    for (let i = 0; i < OW.axis.length - 1; i++){ const a = OW.axis[i], b = OW.axis[i + 1];
      obox(B, PAVE, (a[0] + b[0])/2, (a[1] + b[1])/2, b[0] - a[0], b[1] - a[1], Math.hypot(b[0] - a[0], b[1] - a[1]) + 4, 6, -0.6, 0.3); }
    // memorial: stepped granite base and a tall stele (height estimate ~18 m)
    { const x = 4.9, z = -37.4, ax = 34 - (-28), az = 2 - (-79);
      obox(B, GRAN, x, z, ax, az, 9, 9, 0.3, 1.1); obox(B, GRAN, x, z, ax, az, 6.5, 6.5, 1.1, 2.4);
      obox(B, STELE, x, z, ax, az, 2.4, 3.6, 2.4, 17.0); obox(B, STELE, x, z, ax, az, 2.0, 3.0, 17.0, 18.0); }
    // Lin Zexu's standing statue on a plinth (simplified figure, estimate ~3.5 m on a 3 m plinth)
    { const x = 7.6, z = -33.4; obox(B, GRAN, x, z, 1, 0, 3.2, 3.2, 0.3, 3.3);
      cylw(B, BRONZE, x, z, 0.75, 0.55, 3.3, 5.2, 10, null); cylw(B, BRONZE, x, z, 0.55, 0.5, 5.2, 6.3, 10, null); cylw(B, BRONZE, x, z, 0.32, 0.3, 6.3, 6.9, 8, BRONZE); }
    // the sculpture group: a granite plinth and a massed group of figures (abstracted to clustered forms, estimate ~6 m)
    { const c = [41.2, 11.6]; obox(B, GRAN, c[0], c[1], 1, 0.7, 12, 7, 0.3, 2.0);
      const F = [[-4, -1, 3.8], [-2.2, 1.2, 4.6], [-0.4, -0.6, 5.4], [1.6, 0.9, 4.9], [3.6, -0.8, 4.2], [0.8, 2.3, 3.6], [-3, 2, 3.2]];
      for (const [dx, dz, h] of F){ const x = c[0] + dx*0.82 - dz*0.57, z = c[1] + dx*0.57 + dz*0.82;
        cylw(B, BRONZE, x, z, 0.55, 0.42, 2.0, 2.0 + h*0.8, 8, null); cylw(B, BRONZE, x, z, 0.28, 0.25, 2.0 + h*0.8, 2.0 + h, 6, BRONZE); } }
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'dgopiumwar', lat:22.827266, lon:113.65496, rot:0});

// ================= Weiyuan Fort (威远炮台) =================
// Qing battery on Weiyuan Island by the Humen Bridge (targets.json). Built on its OSM footprint w583396711 (8 points, 3 928 m2):
// the curved granite gun wall with embrasures along the arc of the footprint (south / east), a lower rear wall on the two
// straight edges toward the hill, and the gun platform inside. Wall heights, thickness and embrasure spacing are APPROXIMATE.
const WY = [[-35.2, -9.7], [-26.3, -43.4], [47.2, -2.5], [38.7, 15.1], [23.6, 28.8], [0.8, 33.2], [-20.3, 28.0], [-32.3, 15.2]];
LANDMARKS.dgweiyuan = {zh:'威远炮台', en:'Weiyuan Fort', cat:'old', r:56, h:6, lt:{m:0, c:'#ffdcae', k:0.5},
  build(){
    const g = new THREE.Group(), B = Bt();
    const GR = {c:'#a8a294', m:0, lk:0.45}, GR2 = '#9a9486', TOP = '#8f8a7d', PLAT = '#b5ad9c', IRON = '#2f3133';
    const o = area2(WY) > 0 ? 1 : -1, n = WY.length;
    // gun platform (terreplein) inside
    ext(B, PLAT, grow(WY, -4.5), -1.5, 1.4, PLAT);
    for (let i = 0; i < n; i++){
      const a = WY[i], b = WY[(i + 1)%n], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0])/L, uz = (b[1] - a[1])/L, nx = o*uz, nz = -o*ux;
      const front = i >= 2;                      // edges 2..7 form the arc facing the water; 0, 1 are the rear
      const th = front ? 4.5 : 2.2, H = front ? 4.6 : 3.4;
      const mx = (a[0] + b[0])/2 - nx*th/2, mz = (a[1] + b[1])/2 - nz*th/2;
      obox(B, GR, mx, mz, ux, uz, L + th*0.8, th, -1.5, front ? 3.3 : H);
      if (front){
        // parapet with embrasures every ~4.5 m: merlons between the gaps, a cannon in every second gap
        const k = Math.max(2, Math.round(L/4.5));
        for (let j = 0; j < k; j++){ const f0 = j/k, f1 = (j + 0.62)/k;
          const x0 = a[0] + (b[0] - a[0])*f0, z0 = a[1] + (b[1] - a[1])*f0, x1 = a[0] + (b[0] - a[0])*f1, z1 = a[1] + (b[1] - a[1])*f1;
          obox(B, GR2, (x0 + x1)/2 - nx*1.2, (z0 + z1)/2 - nz*1.2, ux, uz, Math.hypot(x1 - x0, z1 - z0), 2.4, 3.3, H);
          if (j % 2 === 0){ const gf = (j + 0.81)/k, gx = a[0] + (b[0] - a[0])*gf - nx*2.6, gz = a[1] + (b[1] - a[1])*gf - nz*2.6;
            seg(B, IRON, [gx - nx*2.6, 2.9, gz - nz*2.6], [gx + nx*1.4, 3.2, gz + nz*1.4], 0.55);
            obox(B, '#5a4636', gx - nx*2.4, gz - nz*2.4, nx, nz, 2.2, 1.4, 1.4, 2.5); } }
        obox(B, TOP, mx, mz, ux, uz, L, th*0.5, 3.3, 3.45);
      }
    }
    // the gate in the rear wall (edge 0) and a short ramp up to the platform
    { const a = WY[0], b = WY[1], mx = (a[0] + b[0])/2, mz = (a[1] + b[1])/2; obox(B, '#5c5850', mx, mz, b[0] - a[0], b[1] - a[1], 3.2, 2.8, 0, 2.8, true); }
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'dgweiyuan', lat:22.798162, lon:113.620729, rot:0});

// ================= Humen Naval Battle Museum (海战博物馆) =================
// The exhibition building 陈列大楼 (OSM w519660533, 5 208 m2) on Weiyuan Island: its footprint has round towers at four corners
// round a square body; built on it as a fort-like hall with crenellated parapets. Heights are ESTIMATES (OSM 15 m is an estimate
// too): body 12 m, the round towers 15 m.
const SB = [[-83.6, -19.4], [-79.2, -25.6], [-78.7, -28.6], [-77.3, -32.6], [-73.9, -37.0], [-69.8, -39.7], [-65.0, -40.9], [-60.6, -40.8], [-55.6, -51.1], [-59.0, -54.3], [-61.2, -58.5], [-62.1, -63.1], [-61.5, -67.7], [-59.5, -71.9], [-56.9, -74.8], [-54.6, -76.5], [-52.6, -82.8], [-47.6, -78.7], [-44.1, -78.5], [-40.7, -77.5], [-36.5, -74.8], [-33.3, -71.0], [-31.6, -66.3], [-31.5, -61.4], [-32.9, -56.8], [-23.9, -52.5], [-11.2, -79.2], [30.6, -59.7], [11.3, -19.1], [-18.5, -33.0], [-22.8, -24.3], [-18.1, -22.1], [-14.9, -19.3], [-12.6, -15.7], [-11.4, -11.7], [-11.3, -7.4], [-12.5, -3.3], [-17.0, 2.9], [-19.0, 11.1], [-26.0, 5.8], [-30.3, 5.3], [-34.3, 3.7], [-37.6, 1.0], [-40.1, -2.4], [-41.5, -6.5], [-41.8, -10.7], [-40.7, -15.1], [-49.3, -19.2], [-52.5, -15.3], [-56.4, -12.3], [-61.0, -10.7], [-66.0, -10.7], [-70.6, -12.2], [-74.6, -15.1], [-77.0, -18.0]];
const SBT = [[-64.0, -26.0, 15.0], [-47.0, -64.0, 15.0], [-26.5, -9.0, 15.0]];   // round tower centres / radii fitted to the arcs (approx.)
LANDMARKS.dgseabattle = {zh:'海战博物馆', en:'Humen Naval Battle Museum', cat:'new', r:110, h:16, lt:{m:1, c:'#ffe6c4', k:0.55},
  build(){
    const g = new THREE.Group(), B = Bt();
    const WALL = {c:'#d8d0bf', m:1, fh:4.0, cw:3.4}, PARA = '#bdb3a0', ROOF = '#8e8a83', GLASS = {c:'#4f5f68', m:1, fh:4, cw:2.4};
    ext(B, WALL, SB, -1.5, 12.0, ROOF);
    // crenellated parapet along every edge longer than 3 m
    const o = area2(SB) > 0 ? 1 : -1;
    for (let i = 0; i < SB.length; i++){ const a = SB[i], b = SB[(i + 1)%SB.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1) continue;
      const ux = (b[0] - a[0])/L, uz = (b[1] - a[1])/L, nx = o*uz, nz = -o*ux, k = Math.max(1, Math.round(L/3));
      for (let j = 0; j < k; j++){ const f = (j + 0.5)/k; obox(B, PARA, a[0] + (b[0] - a[0])*f - nx*0.35, a[1] + (b[1] - a[1])*f - nz*0.35, ux, uz, L/k*0.6, 0.7, 12.0, 13.4, true); }
      obox(B, PARA, (a[0] + b[0])/2 - nx*0.35, (a[1] + b[1])/2 - nz*0.35, ux, uz, L, 0.7, 12.0, 12.6, true); }
    // the round corner towers rise higher
    for (const [x, z, r] of SBT){ cylw(B, WALL, x, z, r*0.82, r*0.82, 11.5, 15.0, 20, ROOF);
      for (let k = 0; k < 14; k++){ const a = k/14*TAU; obox(B, PARA, x + Math.cos(a)*r*0.8, z + Math.sin(a)*r*0.8, -Math.sin(a), Math.cos(a), 1.6, 0.7, 15.0, 16.0, true); } }
    // glazed entrance hall on the north-east face (between the long straight edges)
    obox(B, GLASS, 6, -45, 30.6 - (-11.2), -59.7 - (-79.2), 16, 3, -0.5, 7.5);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'dgseabattle', lat:22.799222, lon:113.626849, rot:0});

// ================= Nansha Bridge, Dasha Waterway Bridge (南沙大桥大沙水道桥) =================
// The western suspension span, 1 200 m (targets.json). Axis: centre (-18.0, 10.2), u = (0.89684, -0.44236); waterway (terrain < -1 m)
// from s = -536 to +444, mid-span at s = -46, towers 600 m either side. The two OSM buildings on the axis at s = -1034 (w1316061464,
// 3 854 m2) and s = +1048 (w1316061465, 3 239 m2) are taken as the anchorages. Towers, sag (1/10), hangers (12 m) approximate.
const DS = (() => { const c = [-18.0 + 0.89684*(-46), 10.2 - 0.44236*(-46)]; return {c, ll:LL(22.883497, 113.519564, c[0], c[1])}; })();
LANDMARKS.dgdasha = {zh:'南沙大桥大沙水道桥', en:'Nansha Bridge (Dasha Waterway Bridge)', cat:'new', r:1150, h:135, lt:{m:0, c:'#f2f6ff', k:0.6},
  build(){
    return suspBridge({u:[0.89684, -0.44236], span:1200, half:19, DECK:6.9, mid:2.5, sag:120, crown:4,
      legL:9, legW:6.5, lean:2.5, beams:[0.4, 0.72, 0.97], beamD:5.5, girderD:3.6, hStep:12, sA:-1034 + 46 + 30, sB:1048 + 46 - 30, anchL:58, anchH:16,
      tower:{c:'#cfccc4', m:0, lk:0.55}, capCol:'#a7a39a', cable:{c:'#cdccc6', m:0, r:0.45, w:0.85}, hanger:'#bdbcb6',
      girder:{c:'#d4d7d6', m:0}, girderSoffit:'#8d9294', fascia:{c:'#e8e8e2', glow:'#eef4ff', gk:0.5}, anchor:{c:'#bab6ac', m:0, lk:0.4},
      lightRGB:[0.9, 0.95, 1], lightSize:8});
  }};
SG_PLACES.push({type:'dgdasha', lat:DS.ll[0], lon:DS.ll[1], rot:0});

// ================= Humen Railway Station (虎门站) =================
// High-speed station on the Guangzhou-Shenzhen-Hong Kong line (2011, targets.json). OSM footprint w291507024 (59 346 m2): a lens
// 445 m long along the elevated tracks (19.8 m deck in the data). Built as the long roof over the elevated platforms on that
// footprint (roof underside ~30 m, top ~34 m above the base: ESTIMATES), carried on perimeter columns, with the station hall
// below the viaduct (2 levels, estimate) and glazed end screens. The tracks themselves are the app's.
const HS = [[-223.6, -18.5], [-165.7, -26.3], [-133.9, -36.5], [-100.2, -50.8], [-74.0, -64.3], [-54.7, -83.4], [-45.9, -96.6], [-36.0, -109.5], [-23.9, -114.8], [-17.0, -116.4], [-7.1, -117.4], [5.5, -114.9], [22.8, -101.3], [47.9, -85.8], [82.3, -75.4], [104.3, -71.6], [130.3, -69.9], [147.5, -69.9], [210.2, -76.8], [221.6, 13.1], [169.8, 22.1], [147.7, 27.1], [118.1, 38.5], [99.4, 50.3], [77.5, 68.7], [65.4, 84.3], [54.6, 96.6], [41.6, 104.5], [29.0, 111.4], [15.1, 114.5], [-0.7, 115.6], [-12.9, 111.1], [-34.2, 100.7], [-41.5, 95.1], [-53.8, 90.3], [-90.7, 72.0], [-125.7, 64.2], [-160.6, 65.0], [-212.1, 71.2]];
LANDMARKS.dghumenstation = {zh:'虎门站', en:'Humen Railway Station', cat:'new', r:235, h:35, lt:{m:1, c:'#eef4ff', k:0.6},
  build(){
    const g = new THREE.Group(), B = Bt();
    const ROOF = {c:'#c9ccce', m:0, lk:0.45}, SOFF = {c:'#dadcd8', glow:'#f2f6ff', gk:0.45}, FASC = {c:'#e6e7e3', glow:'#eef4ff', gk:0.3}, COL = '#bfc1bd',
      HALL = {c:'#9fb0b8', m:1, fh:5.0, cw:3.0}, STONE = '#cfcabd';
    const c = centroid(HS);
    // roof: a gently cambered shell — rings shrinking toward a ridge line, top 34 m at the centre, eaves 31 m at the edge
    const R0 = grow(HS, 2.0), R1 = R0.map(p => [c[0] + (p[0] - c[0])*0.72, c[1] + (p[1] - c[1])*0.55]), R2 = R0.map(p => [c[0] + (p[0] - c[0])*0.4, c[1] + (p[1] - c[1])*0.18]);
    const lv = [[R0, 31.0], [R1, 33.2], [R2, 34.2]];
    for (let k = 0; k < lv.length - 1; k++){ const [A, ya] = lv[k], [Bb, yb] = lv[k + 1];
      for (let i = 0; i < A.length; i++){ const j = (i + 1)%A.length; B.q(ROOF, [Bb[i][0], yb, Bb[i][1]], [Bb[j][0], yb, Bb[j][1]], [A[j][0], ya, A[j][1]], [A[i][0], ya, A[i][1]]); } }
    cap(B, ROOF, R2.slice().reverse(), 34.2);
    // soffit (lit at night) and the eave fascia
    cap(B, SOFF, R0, 30.0);
    ext(B, FASC, R0, 30.0, 31.0, null);
    // perimeter columns every ~22 m, 4 m inside the footprint
    const Rc = grow(HS, -4);
    for (let i = 0; i < Rc.length; i++){ const a = Rc[i], b = Rc[(i + 1)%Rc.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(L/22));
      for (let j = 0; j < k; j++){ const f = j/k; obox(B, COL, a[0] + (b[0] - a[0])*f, a[1] + (b[1] - a[1])*f, 1, 0, 1.4, 1.4, -1.5, 30.0, true); } }
    // station hall under the viaduct (two levels) and the entrance canopies on both sides
    const hall = [[-70, -40], [70, -58], [80, 52], [-60, 66]];
    ext(B, HALL, hall, -1.5, 11.0, '#8e9294');
    ext(B, STONE, grow(hall, 0.6), 11.0, 11.8, STONE);
    obox(B, FASC, 5, -62, 140, -18, 90, 10, 7.5, 8.3); obox(B, FASC, 10, 72, 140, -14, 90, 10, 7.5, 8.3);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'dghumenstation', lat:22.863397, lon:113.668333, rot:0});

// ================= Guangdong Modern International Exhibition Center (广东现代国际展览中心), Houjie =================
// The five big exhibition halls round the anchor (OSM w1351484286 / 287 / 284 / 281 / 288, 19 000-64 000 m2 each), rebuilt on
// their footprints as long-span halls: walls to 16 m, a clerestory lantern along each hall's long axis to 21 m (heights and
// forms are ESTIMATES; OSM gives 15 m, an estimate too). The domed central hall and the hotel tower are not identified in the
// map data (no footprint / no height): left to the app.
const EX = [
  [[-386.5, 136.6], [-308.6, -216.9], [-139.7, -185.4], [-207.4, 171.9]],
  [[19.5, 197.6], [46.1, 56.8], [34.9, 54.7], [36.0, 48.9], [22.8, 46.4], [37.9, -33.5], [51.1, -31.0], [52.2, -36.9], [63.4, -34.8], [90.1, -175.6], [231.1, -149.5], [196.1, -18.3], [220.3, -13.8], [222.9, -2.8], [224.5, 8.4], [225.0, 19.7], [224.5, 31.0], [222.9, 42.1], [220.3, 53.2], [216.6, 63.9], [212.0, 74.2], [206.5, 84.1], [200.0, 93.4], [175.8, 88.9], [160.6, 223.8]],
  [[-168.0, 192.8], [-155.4, 126.4], [-72.0, 141.9], [-70.8, 135.2], [-154.2, 119.7], [-134.8, 17.5], [-127.4, 14.8], [-120.6, 10.9], [-114.4, 6.0], [-109.1, 0.3], [-104.7, -6.3], [-101.5, -13.4], [-8.1, 4.0], [-48.1, 215.1]],
  [[-118.3, -69.5], [-100.2, -165.3], [-98.5, -169.4], [-96.2, -173.2], [-93.3, -176.6], [-90.0, -179.6], [-86.3, -182.1], [-82.2, -184.0], [-77.9, -185.3], [-73.5, -186.0], [-69.0, -186.0], [24.6, -168.6], [-5.2, -11.4], [-98.6, -28.7], [-99.0, -36.6], [-100.6, -44.2], [-103.5, -51.5], [-107.4, -58.3], [-112.4, -64.3]],
  [[160.6, 223.8], [172.9, 114.5], [322.6, 142.3], [297.7, 273.8], [194.1, 254.6], [198.6, 230.8]]];
LANDMARKS.dgexpo = {zh:'广东现代国际展览中心', en:'Guangdong Modern International Exhibition Center', cat:'new', r:420, h:22, lt:{m:1, c:'#eef2ff', k:0.55},
  build(){
    const g = new THREE.Group(), B = Bt();
    const WALL = {c:'#d6d8d4', m:1, fh:5.5, cw:4.0}, ROOF = '#b3b8bb', LANT = {c:'#8fa3ad', m:1, fh:4.5, cw:3.0}, BAND = {c:'#e3e4e0', glow:'#eef2ff', gk:0.25};
    for (const R of EX){
      ext(B, WALL, R, -1.5, 16.0, ROOF);
      ext(B, BAND, grow(R, 0.5), 15.2, 16.6, null);
      // clerestory lantern along the principal axis of the footprint
      const n = R.length, c = centroid(R); let sxx = 0, szz = 0, sxz = 0;
      for (const p of R){ const dx = p[0] - c[0], dz = p[1] - c[1]; sxx += dx*dx; szz += dz*dz; sxz += dx*dz; }
      const a = 0.5*Math.atan2(2*sxz, sxx - szz), ux = Math.cos(a), uz = Math.sin(a);
      let s0 = 1e9, s1 = -1e9, t0 = 1e9, t1 = -1e9;
      for (const p of R){ const s = (p[0] - c[0])*ux + (p[1] - c[1])*uz, t = -(p[0] - c[0])*uz + (p[1] - c[1])*ux; s0 = Math.min(s0, s); s1 = Math.max(s1, s); t0 = Math.min(t0, t); t1 = Math.max(t1, t); }
      const L = (s1 - s0)*0.62, W = Math.min(28, (t1 - t0)*0.22), sm = (s0 + s1)/2, tm = (t0 + t1)/2;
      const cx = c[0] + ux*sm - uz*tm, cz = c[1] + uz*sm + ux*tm;
      obox(B, LANT, cx, cz, ux, uz, L, W, 16.0, 20.0, true);
      obox(B, ROOF, cx, cz, ux, uz, L + 2, W + 2, 20.0, 21.0, true);
    }
    // two smaller buildings in the gaps between the halls fall inside this model's hull (the app would hide them): rebuilt plainly
    // on their footprints at their map heights (w1525970507, w1525970508: 15 m, estimates in the map data)
    for (const R of [[[17.2, -129.4], [24.6, -168.6], [86.6, -157.1], [79.1, -117.9]], [[-37.6, 159.8], [-31.5, 127.7], [30.5, 139.2], [24.5, 171.4]]])
      ext(B, {c:'#cfcfc9', m:1, fh:3.8, cw:3.2}, R, -1.5, 15.0, '#9a9d9e');
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'dgexpo', lat:22.903223, lon:113.652268, rot:0});
}
