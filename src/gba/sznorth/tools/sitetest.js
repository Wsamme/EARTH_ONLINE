// model-alone test of SITES: wraps each site as a landmark with a flat ctx (ground y = 0; paint / line as flat tris; trees as cones)
{
for (const k of Object.keys(SITES)){ const s = SITES[k];
  LANDMARKS['site_' + k] = {zh:s.zh, en:s.en, cat:'new', r:s.r, h:s.h, lt:s.lt, build(){
    const g = new THREE.Group(), P = [], C = {};
    const ctx = {gy:(x, z) => 0, rng:() => LMCTX.rng(),
      paint(poly, rgb){ const c = '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join(''); (C[c] = C[c] || []); for (const t of THREE.ShapeUtils.triangulateShape(poly.map(p => new THREE.Vector2(p[0], p[1])), [])) for (const i of t) C[c].push(poly[i][0], 0.05, poly[i][1]); },
      line(pts, w, rgb){ const c = '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join(''); (C[c] = C[c] || []); for (let i = 0; i < pts.length - 1; i++){ const a = pts[i], b = pts[i + 1], dx = b[0]-a[0], dz = b[1]-a[1], l = Math.hypot(dx, dz) || 1, nx = -dz/l*w/2, nz = dx/l*w/2;
        C[c].push(a[0]+nx, 0.07, a[1]+nz, b[0]+nx, 0.07, b[1]+nz, b[0]-nx, 0.07, b[1]-nz, a[0]+nx, 0.07, a[1]+nz, b[0]-nx, 0.07, b[1]-nz, a[0]-nx, 0.07, a[1]-nz); } },
      tree(x, z, s){ LCone(g, s, s*2.6, x, 0, z, '#4d7a3a', 6); }, lamp(){} };
    const m = s.build(ctx); g.add(m); for (const c in C) LTris(g, C[c], c);
    // keep outline
    if (s.keep){ const K = s.keep, a = []; for (let i = 0; i < K.length; i++){ const p = K[i], q = K[(i + 1) % K.length]; a.push(p[0], 0.1, p[1], q[0], 0.1, q[1], q[0], 1.5, q[1]); } LTris(g, a, '#ff3030'); }
    return g; }};
}
}
