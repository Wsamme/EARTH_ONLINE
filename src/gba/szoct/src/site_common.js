// ---------- shared site machinery ----------
// one set of vertex-coloured material specs per site build (few materials: walls with lit windows, floodlit stone, plain, steel,
// glass, warm glow, lanterns, water)
function mkSpecs(){ return {
  wall:{c:'#ffffff', vc:true, m:1, fh:3.6, cw:3.0}, res:{c:'#ffffff', vc:true, m:1, fh:3.0, cw:2.5},
  flood:{c:'#ffffff', vc:true, m:0, lk:0.85, lc:'#ffe2b8'}, plain:{c:'#ffffff', vc:true, m:0, lk:0.15},
  steel:{c:'#ffffff', vc:true, m:0, lk:0.45, lc:'#e2ebff'}, glass:{c:'#ffffff', vc:true, m:1, fh:4.2, cw:2.0},
  gold:{c:'#ffffff', vc:true, m:0, lk:1.6, lc:'#ffbe6a'}, dark:{c:'#ffffff', vc:true, m:0, lk:0},
  glow:{c:'#fff1d6', glow:'#ffdba6', gk:0.9}, lantern:{c:'#d8553a', glow:'#ff7444', gk:1.3}, red:{c:'#aa1111', glow:'#ff2a1a', gk:2.0},
  water:{c:'#ffffff', vc:true, m:0, lk:0.1}, led:{c:'#ffffff', vc:true, m:2, lk:0.9}}; }
const PICK = (rng, A) => A[Math.floor(rng()*A.length) % A.length];
// a real footprint rebuilt in a style: st = {spec, wall:[hex], roof:[hex], kind:'flat'|'hip'|'cn'|'gable'|'auto', hdef, hmax, hmin, trim}
function genBld(B, S, gy, rng, b, st){
  const P = b.r, [lo, hi] = groundSpan(gy, P), y0 = lo - 1.5, F = obb(P), rect = parea(P)/(F.L*F.W || 1);
  let h = b.h || st.hdef || 8; if (st.hmax) h = Math.min(h, st.hmax); if (st.hmin) h = Math.max(h, st.hmin); if (st.hf) h = st.hf(b, h);
  const top = hi + h, wall = RGB(PICK(rng, st.wall)), roof = RGB(PICK(rng, st.roof || ['#8b8f8c'])), spec = S[st.spec || 'wall'];
  let kind = st.kind || 'flat'; if (kind === 'auto') kind = rect > 0.82 && b.a < 2200 && F.W > 6 ? (rng() < 0.5 ? 'hip' : 'gable') : 'flat';
  if ((kind === 'hip' || kind === 'cn' || kind === 'gable') && (rect < 0.75 || F.W < 4)) kind = 'flat';
  prism(B, spec, wall, P, y0, top, kind === 'flat' ? roof : null, S.plain);
  const R = Fr(F.cx, F.cz, F.ang, top), rh = Math.min(F.W*0.32, 6);
  if (kind === 'hip') fhip(B, R, S.plain, roof, 0, 0, F.L, F.W, 0, rh, 0.8);
  else if (kind === 'gable') fgable(B, R, S.plain, roof, 0, 0, F.L, F.W, 0, rh, 0.6);
  else if (kind === 'cn') fcnroof(B, R, S.plain, roof, 0, 0, F.L, F.W, 0, Math.min(F.W*0.36, 7), 1.2);
  else { // parapet and a rooftop plant box on the larger ones
    if (st.trim !== false) prism(B, S.plain, mixc(wall, [1, 1, 1], 0.25), inset(P, 0.0), top, top + 0.9, null);
    if (b.a > 900 && h > 9) fbox(B, Fr(F.cx, F.cz, F.ang, top), S.plain, RGB('#9a9c98'), 0, 0, Math.min(F.L*0.3, 14), Math.min(F.W*0.3, 9), 0, 2.4); }
  return {lo, hi, top, F};
}
const byId = (D, id) => D.b.find(b => b.id === id);
const poiAt = (D, re) => D.poi.filter(p => re.test(p[0]));
// keep test helper for avoid() callbacks
const nearAny = (pts, x, z, r) => pts.some(p => Math.hypot(p[0] - x, p[1] - z) < r);
