// TEST ONLY (not part of the module): wraps each SITES entry as a landmark '<key>_t' so the in-situ kit can show it on the real map.
// ctx.gy = real ground relative to the landmark base the kit uses (r = 8: highest ground within 8 m of the anchor + 0.6 m).
{
for (const [key, S] of Object.entries(SITES)){
  LANDMARKS[key + '_t'] = {zh:S.zh, en:S.en, cat:'new', r:8, h:S.h || 30, lt:S.lt, build(){
    const [X, Y] = sgXY(S.lat, S.lon); let hi = -Infinity;
    for (let a = 0; a < 12; a++) for (const f of [0, 0.35, 0.7]) hi = Math.max(hi, hC(X + Math.cos(a/12*Math.PI*2)*8*f, Y + Math.sin(a/12*Math.PI*2)*8*f));
    const top = hi + 0.6, T = [], L = [], seed = {s:12345};
    const rng = () => (seed.s = (seed.s*16807) % 2147483647)/2147483647;
    const ctx = {gy:(x, z) => hC(X + x, Y - z), rng, paint(){}, line(){},
      tree(x, z, s, k){ const y = hC(X + x, Y - z) + (s || 3)*1.3 + 1; const r = s || 3, P = [[r, 0, 0], [-r, 0, 0], [0, r*0.9, 0], [0, -r*0.9, 0], [0, 0, r], [0, 0, -r]];
        for (const [a, b, c] of [[0, 2, 4], [4, 2, 1], [1, 2, 5], [5, 2, 0], [4, 3, 0], [1, 3, 4], [5, 3, 1], [0, 3, 5]]) for (const i of [a, b, c]) T.push(x + P[i][0], y + P[i][1], z + P[i][2]); },
      lamp(x, y, z){ for (const [a, b, c] of [[0, 1, 2]]) L.push(x - 0.6, y, z, x + 0.6, y, z, x, y + 1.2, z); }};
    const g0 = S.build(ctx), g = new THREE.Group(); g0.position.y = -top; g.add(g0);
    if (T.length) LTris(g0, T, {c:'#5f8a4e'}); if (L.length) LTris(g0, L, {c:'#ffe0b0', glow:'#ffd9a0', gk:2});
    return g; }};
  SG_PLACES.push({type:key + '_t', lat:S.lat, lon:S.lon, rot:0});
}
}
