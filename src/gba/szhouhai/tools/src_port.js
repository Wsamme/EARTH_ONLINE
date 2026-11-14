
// ================= Shenzhen Bay Port, the passenger terminal (深圳湾口岸旅检大楼, opened 1 July 2007) =================
// OSM w240804171 ("ShenZhen Bay Control Point"), 105 m east-west by 260 m north-south with a bay at each end; the first
// co-located boundary control point, the mainland and Hong Kong halls in one building (Wikipedia; HK Government press release
// on the topping-out, 27 Feb 2006). The OSM height is 16.5 m (5 levels); the roof form and the heights here are estimates from
// photos: a long hall under one shallow curved metal roof with deep eaves, glazed walls, the coach decks at the two ends.
// The vehicle inspection canopies are separate OSM sheds and stay real. Traffic in the port keeps right. Night: lit glazing.
LANDMARKS.szbayport = {zh:'深圳湾口岸', en:'Shenzhen Bay Port', cat:'new', r:176, h:27, lt:{m:1, c:'#ffe6c8', k:0.6},
  build(){
    const g = new THREE.Group(), B = Bt();
    const GL = {c:'#6f818c', m:1, fh:5.5, cw:3.0, lc:'#fff0d8'}, WALL = {c:'#d9d7d0', m:0, lk:0.45, lc:'#ffe6c8'}, ROOF = {c:'#c7cacb', m:0, lk:0.35}, RUND = {c:'#e3e1da', m:0, lk:0.6, glow:'#fff1dc', gk:0.25},
      SKY = {c:'#9db0bb', glow:'#ffe9c8', gk:0.35}, COL = {c:'#bfc1c0', m:0, lk:0.5};
    const P = D.bp.ring;
    // the two end bays (coach decks / forecourts) and the hall base: two storeys of glazing and a solid band
    prism(B, GL, P, -1, 10, false); prism(B, WALL, P, 10, 13.5, WALL);
    // the main hall: x -51..53, z -129..132 (the OSM ring's middle block)
    const x0 = -51.5, x1 = 53.5, z0 = -129.5, z1 = 132.5, YE = 17.5, YC = 27;
    prism(B, GL, rect(x0 + 2, x1 - 2, z0 + 2, z1 - 2), 13.5, YE, false);
    // the curved roof: a shallow vault spanning east-west, eaves 6 m out on the long sides, 4 m at the ends
    const nx = 16, X0 = x0 - 6, X1 = x1 + 6, Z0 = z0 - 4, Z1 = z1 + 4, ry = x => { const t = (x - X0)/(X1 - X0); return YE - 0.6 + (YC - YE)*Math.sin(PI*t); };
    for (let i = 0; i < nx; i++){ const xa = lerp(X0, X1, i/nx), xb = lerp(X0, X1, (i + 1)/nx);
      B.q(ROOF, [xa, ry(xa), Z1], [xb, ry(xb), Z1], [xb, ry(xb), Z0], [xa, ry(xa), Z0]);
      B.q(RUND, [xa, ry(xa) - 0.9, Z0], [xb, ry(xb) - 0.9, Z0], [xb, ry(xb) - 0.9, Z1], [xa, ry(xa) - 0.9, Z1]);
      for (const z of [Z0, Z1]) B.q(ROOF, [xa, ry(xa) - 0.9, z], [xb, ry(xb) - 0.9, z], [xb, ry(xb), z], [xa, ry(xa), z]); }
    // gable glazing at the north and south ends under the vault
    for (const z of [z0 + 2, z1 - 2]) for (let i = 0; i < nx; i++){ const xa = clamp(lerp(X0, X1, i/nx), x0 + 2, x1 - 2), xb = clamp(lerp(X0, X1, (i + 1)/nx), x0 + 2, x1 - 2); if (xb - xa < 0.1) continue;
      B.q(GL, [xa, YE, z], [xb, YE, z], [xb, ry(xb) - 0.9, z], [xa, ry(xa) - 0.9, z]); }
    // skylight strips along the vault and the roof columns under the eaves
    for (const xs of [-24, 0, 24]) B.q(SKY, [xs - 2.2, ry(xs - 2.2) + 0.15, z1 - 6], [xs + 2.2, ry(xs + 2.2) + 0.15, z1 - 6], [xs + 2.2, ry(xs + 2.2) + 0.15, z0 + 6], [xs - 2.2, ry(xs - 2.2) + 0.15, z0 + 6]);
    for (let z = z0 + 6; z < z1 - 4; z += 18) for (const x of [X0 + 2.5, X1 - 2.5]) box(B, COL, x - 0.45, x + 0.45, 13.5, ry(x) - 0.9, z - 0.45, z + 0.45);
    // entrance canopies over the forecourts at the two ends
    box(B, RUND, -26, 18, 9.5, 10.6, -172, -150); box(B, RUND, -20, 24, 9.5, 10.6, 150, 168);
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'szbayport', lat:22.503909, lon:113.944717, rot:0});
