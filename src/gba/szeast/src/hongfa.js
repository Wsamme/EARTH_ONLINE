// ================= Hongfa Temple (弘法寺), Fairy Lake, 1985-1992 =================
// Chan temple built up the foot of Wutong Shan "依山拾级而建", facing north-west over Fairy Lake (坐东南朝西北); about forty buildings;
// axis bottom -> top: mountain gate hall, Hall of the Heavenly Kings, the exhibition building, Mahavira Hall, Sutra Library;
// yellow glazed tile roofs (bendibao: "绿树黄瓦"). Every hall stands on its real OSM footprint (38 footprints of OSM area
// w246372603) on a granite platform stepped to this map's ground (the hill rises ~45 m to the south-east); OBB-shaped halls get
// hip-and-gable roofs (the Mahavira Hall and the Sutra Library double-eaved), irregular wings and the cloister mansard tile skirts.
// Wall / roof heights are estimates from the footprints' proportions (no published heights). Night: warm floodlight, breathing.
LANDMARKS.szhongfa = {zh:'弘法寺', en:'Hongfa Temple', cat:'old', r:164, h:30,
  lt:{m:0, c:'#ffcf98', k:1.2, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), d = D.szhongfa, gT = mkT(d.T), BASE = baseOf(gT, 164), gy = (x, z) => gT(x, z) - BASE;
    const TILE = {c:'#d9a22c', lc:'#ffd27a', lk:1.0}, RIDGE = '#b9831c', WALL = {c:'#e6bf63', lc:'#ffd9a0'}, RED = '#a2322a', DOOR = '#6f281f',
      FAS = '#2f6a63', GRAN = '#b8b1a4', STEP = '#a9a294', GABLE = '#c9932a', WIN = {c:'#7b3a24', glow:'#ffb35c', gk:0.7}, UNDER = '#5a3b2b', GOLD = {c:'#d8b04a', lc:'#ffe09a', lk:1.3}, LANT = {c:'#d8382a', glow:'#ff5a2a', gk:2.2};
    const FRONT = [-Math.cos(0.534), -Math.sin(0.534)];   // the temple faces NW (axis bearing 30.6 deg from +x towards +z)
    const lattice = (F, u0, u1, v0, v1) => { shapeP(B.p(WIN), rectO(u0, u1, v0, v1), F, 0.06); const n = Math.max(2, Math.round((u1 - u0)/0.45)); for (let j = 1; j < n; j++) shapeP(B.p(DOOR), rectO(lerp(u0, u1, j/n) - 0.05, lerp(u0, u1, j/n) + 0.05, v0, v1), F, 0.09); };
    const spec = b => { const nm = b.nm, A = Math.abs(sArea(b.r));
      if (nm === '大雄宝殿') return {w:9.5, rh:6.5, dbl:true, ver:true};
      if (nm === '藏经楼') return {w:10.5, rh:5.0, dbl:true, ver:true};
      if (nm === '天王殿' || nm === '千菩萨殿' || nm === '万佛殿' || nm === '光明殿') return {w:7.2, rh:5.0, ver:true};
      if (nm === '斋堂' || nm === '弘法楼') return {w:8.5, rh:4.2};
      if (A > 900) return {w:9.5, rh:5.0, ver:true};
      if (A > 400) return {w:6.5, rh:4.0};
      if (A > 150) return {w:5.2, rh:3.4};
      return {w:3.8, rh:2.6}; };
    const halls = [];
    for (const b of d.b){
      const P = b.r, S = spec(b), O = obb(P), [lo, hi] = groundSpan(gy, P), yp = hi + 0.45;
      // granite platform (taiji) down to the low side
      const PL = offP(P, -1.2); wallP(B.p(GRAN), PL, lo - 2.5, yp); capP(B.p(GRAN), PL, yp);
      halls.push({P, O, yp, S});
      const per = plen(P.concat([P[0]])), wEst = 2*Math.abs(sArea(P))/per;
      if (O.fill > 0.74 && O.b > 3){
        const {cx, cz, a, b: bb, ang} = O, R = rectR(cx, cz, a, bb, ang), yw = yp + S.w;
        wallP(B.p(WALL), R, yp, yw); capP(B.p(UNDER), R, yw);
        // front: verandah of red columns, lattice doors; sides and back: windows
        for (const e of edgesF(R)){
          const isFront = e.nx*FRONT[0] + e.nz*FRONT[1] > 0.7, n = Math.max(2, Math.round(e.L/4.2));
          if (isFront){ shapeP(B.p(DOOR), rectO(0.6, e.L - 0.6, yp, yp + S.w*0.64), e.F, 0.03);
            for (let k = 0; k < n; k++){ const u0 = e.L*k/n + 0.5, u1 = e.L*(k + 1)/n - 0.5; lattice(e.F, u0, u1, yp + 0.4, yp + S.w*0.6); }
            if (S.ver){ for (let k = 0; k <= n; k++){ const p = e.F(e.L*k/n, 0, 1.0); latheP(B.p(RED), [[0.42, yp], [0.36, yp + 0.3], [0.32, yw]], p[0], p[2], 8); }
              slabP(B.p(RED), rectO(-0.6, e.L + 0.6, yw - 1.0, yw - 0.2), e.F, 0.8, 1.3); }
          } else if (e.L > 6 && (b.nm || S.w > 6)){ for (let k = 0; k < n; k++){ const uc = e.L*(k + 0.5)/n; lattice(e.F, uc - 0.8, uc + 0.8, yp + S.w*0.35, yp + S.w*0.7); } }
        }
        const ov = Math.min(2.2, 0.9 + bb*0.12);
        if (S.dbl){
          // lower eave (pent) round the hall, clerestory, upper hip-and-gable roof
          roofP(B.p(TILE), cx, cz, a + ov + 0.6, bb + ov + 0.6, a - 0.3, bb - 0.3, yw - 0.6, 1.6, {ry:-ang, lift:0.5, fas:0.35, fo:B.p(FAS), under:B.p(UNDER), nt:3, pw:1.3});
          const a2 = a - 1.6, b2 = bb - 1.6, R2 = rectR(cx, cz, a2, b2, ang), yc = yw + 3.2;
          wallP(B.p(WALL), R2, yw, yc); for (const e of edgesF(R2)){ const n = Math.max(2, Math.round(e.L/3.2)); for (let k = 0; k < n; k++){ const uc = e.L*(k + 0.5)/n; lattice(e.F, uc - 0.9, uc + 0.9, yw + 1.1, yc - 0.5); } }
          const yt = roofP(B.p(TILE), cx, cz, a2 + ov, b2 + ov, a2*0.55, 0, yc, S.rh, {ry:-ang, gab:0.42, gcol:B.p(GABLE), lift:0.9, fas:0.4, fo:B.p(FAS), under:B.p(UNDER), hips:B.p(RIDGE), ridge:B.p(RIDGE), rr:0.38, nt:6, pw:1.6});
          // ridge ornaments: the chiwei at both ends, the gilt pearl / stupa in the middle
          for (const sx of [-1, 1]){ const c = Math.cos(ang), s = Math.sin(ang), x = cx + c*sx*a2*0.55, z = cz + s*sx*a2*0.55; boxP(B.p(RIDGE), 0.8, 1.6, 0.6, x, yt, z, -ang); }
          latheP(B.p(GOLD), [[0.6, yt + 0.1], [0.75, yt + 0.6], [0.4, yt + 1.2], [0.5, yt + 1.5], [0.05, yt + 2.4]], cx, cz, 8);
        } else {
          const yt = roofP(B.p(TILE), cx, cz, a + ov, bb + ov, Math.max(0.4, a - bb*0.9), 0, yw, S.rh, {ry:-ang, gab:0.4, gcol:B.p(GABLE), lift:0.7, fas:0.3, fo:B.p(FAS), under:B.p(UNDER), hips:B.p(RIDGE), ridge:B.p(RIDGE), rr:0.28, nt:5, pw:1.6});
          if (b.nm){ const c = Math.cos(ang), s = Math.sin(ang), a1 = Math.max(0.4, a - bb*0.9); for (const sx of [-1, 1]) boxP(B.p(RIDGE), 0.6, 1.1, 0.45, cx + c*sx*a1, yt, cz + s*sx*a1, -ang); }
        }
      } else {
        // irregular wings and the cloister: walls on the real outline, tile skirt, flat terrace inside
        const yw = yp + S.w*0.85, ins = cl(wEst*0.42, 0.8, 3.2);
        wallP(B.p(WALL), P, yp, yw);
        for (const e of edgesF(P)){ if (e.L < 3) continue; const n = Math.max(1, Math.round(e.L/4)); for (let k = 0; k < n; k++){ const uc = e.L*(k + 0.5)/n; lattice(e.F, uc - 0.8, uc + 0.8, yp + 1.0, yw - 0.9); } }
        skirtP(B.p(TILE), P, yw, Math.min(2.4, ins*0.8), 1.1, ins, B.p(UNDER));
        wallP(B.p(FAS), offP(P, -1.1), yw - 0.35, yw);
      }
    }
    // stepped granite way up the axis, from below the mountain gate to the Sutra Library, skipping the halls
    { const A0 = [-28.2, -23.8], ux = Math.cos(0.534), uz = Math.sin(0.534), W = 4.5;
      const inHall = (x, z) => halls.some(h => pip(offP(h.P, -1.4), x, z));
      let prev = null;
      for (let t = -95; t <= 50; t += 1.6){ const x = A0[0] + ux*t, z = A0[1] + uz*t; if (inHall(x, z)){ prev = null; continue; }
        const y = gy(x, z) + 0.25, y0 = prev === null ? y - 1.2 : Math.min(prev, y) - 1.2;
        boxP(B.p(STEP), 1.7, y - y0, 2*W, x, y0, z, -0.534);
        for (const s of [-1, 1]) boxP(B.p(GRAN), 1.7, 0.9, 0.35, x - uz*s*(W + 0.2), y, z + ux*s*(W + 0.2), -0.534);
        if (Math.round(t/1.6) % 9 === 0) for (const s of [-1, 1]){ const lx = x - uz*s*(W + 0.2), lz = z + ux*s*(W + 0.2); segP(B.p(GRAN), [lx, y + 0.9, lz], [lx, y + 2.4, lz], 0.12, 4); latheP(B.p(LANT), [[0.05, y + 2.4], [0.3, y + 2.5], [0.34, y + 2.85], [0.3, y + 3.15], [0.05, y + 3.25]], lx, lz, 8); }
        prev = y; }
      // bronze incense burner on the terrace before the Mahavira Hall (generic, on the axis)
      const t = 22, x = A0[0] + ux*t, z = A0[1] + uz*t, y = gy(x, z) + 0.3;
      latheP(B.p('#5f5040'), [[0.9, y], [1.2, y + 0.6], [1.25, y + 1.2], [0.9, y + 1.5], [1.0, y + 1.6], [0.6, y + 2.3], [0.15, y + 3.0], [0.05, y + 3.3]], x, z, 10);
    }
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'szhongfa', lat:22.580191, lon:114.177286, rot:0});
