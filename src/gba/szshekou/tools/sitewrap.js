// test-only shim (not part of the module): wraps each SITES entry as a pseudo landmark 'site_<key>' so the in-situ kit can show it.
// ctx.paint / line draw flat ribbons 0.15 m over the ground, tree = cone + trunk, lamp = small glow cube; base = the kit's top.
(() => {
  for (const [key, S] of Object.entries(SITES)){
    const r = S.r || 300;
    LANDMARKS['site_' + key] = {zh:S.zh, en:S.en, cat:'new', r:Math.min(r, 400), h:S.h || 30, lt:S.lt, build(){
      const [X, Y] = sgXY(S.lat, S.lon); let hi = -Infinity, R = Math.min(r, 400);
      for (let a = 0; a < 12; a++) for (const f of [0, 0.35, 0.7]) hi = Math.max(hi, hC(X + Math.cos(a/12*Math.PI*2)*R*f, Y + Math.sin(a/12*Math.PI*2)*R*f));
      const top = hi + 0.6, gy = (x, z) => hC(X + x, Y - z);
      const outer = new THREE.Group(), PP = [], LL = [];
      const col = rgb => '#' + rgb.map(v => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, '0')).join('');
      const ctx = {gy, rng:LMCTX.rng,
        paint(poly, rgb){ let idx; try { idx = THREE.ShapeUtils.triangulateShape(poly.map(p => new THREE.Vector2(p[0], p[1])), []); } catch (e){ return; }
          const A = []; for (const t of idx) for (const k of t){ const p = poly[k]; A.push(p[0], gy(p[0], p[1]) + 0.12 + PP.length*0.002, p[1]); } if (A.length) { LTris(outer, A, {c:col(rgb)}); PP.push(1); } },
        line(pts, w, rgb){ const A = []; for (let i = 0; i + 1 < pts.length; i++){ const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz/l*w/2, nz = dx/l*w/2;
          const P = (p, s) => [p[0] + nx*s, gy(p[0], p[1]) + 0.2, p[1] + nz*s]; A.push(...P(a, 1), ...P(b, 1), ...P(b, -1), ...P(a, 1), ...P(b, -1), ...P(a, -1)); } if (A.length) LTris(outer, A, {c:col(rgb)}); },
        tree(x, z, s, kind){ const y = gy(x, z); LCyl(outer, 0.15*s/3, 0.2*s/3, s*0.9, x, y, z, '#6b553f', 4); if (kind === 'palm') LCone(outer, s, s*0.5, x, y + s*1.6, z, '#5f8a3c', 6); else LCone(outer, s, s*1.6, x, y + s*0.6, z, '#55803f', 6); },
        lamp(x, y, z, rgb){ LBox(outer, 0.5, 0.5, 0.5, x, y, z, {c:'#ffffff', glow:col(rgb), gk:2}); }};
      const g = S.build(ctx); outer.add(g); const w = new THREE.Group(); outer.position.y = -top; w.add(outer); return w; }};
    SG_PLACES.push({type:'site_' + key, lat:S.lat, lon:S.lon, rot:0});
  }
})();
