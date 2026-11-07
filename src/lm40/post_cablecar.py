# v40 lm40/post_cablecar.py (Singapore only): the app's procedural Mount Faber Line is re-aimed at the lm40 station models.
# sg40e models the three stations (sgfaberpeak, sghftowers = HarbourFront Tower Two with the station box on its roof,
# sgsentosastn) with short rope stubs at their mouths. The base sgCableCar() drew its own line between made-up points
# (a grey 69 m tower ~150 m east of the real HarbourFront station, two hilltop boxes, generic towers every ~240 m, some of
# them in the harbour). This replaces it with:
#   - rope ends at the station mouths (lm40/INTEGRATE.md, sg40e: HarbourFront 1.264482,103.818698 ~66 m; Faber 1.271196,
#     103.819408 ~104 m; Sentosa 1.255517,103.817702 ~59 m — the model mouths in the app's terrain),
#   - the two real intermediate towers only (Wikipedia "Singapore Cable Car", Mount Faber Line: Tower 1 "Seah Im Road" track
#     rope 80 m asl, ~300 m from Mount Faber and ~400 m from HarbourFront; Tower 2 on Sentosa, 88 m asl, ~500 m from
#     HarbourFront and ~450 m from Sentosa; the alignment is straight), placed on the straight line by those distances,
#   - no stations, no station boxes and no "Mount Faber" lookout label of its own (the landmark models carry those);
#     the line label moves to the middle of the harbour span.
# Moving cabins (stepRopes) keep the same data layout {P, Hc, L, cum, v, im, nc}.
OLD_HEAD = "function sgCableCar(B){\n  net.ropes = [];\n  const faber = sgXY(1.2717, 103.8197), hf = sgXY(1.2650, 103.8203), sen = sgXY(1.2557, 103.8178);"
OLD_TAIL = "  net.extras.push({x:faber[0], y:faber[1], t:'lookout', top:gF + 24, name:['花柏山', 'Mount Faber']});\n}\n"
NEW = r'''/* v40 lm40/post_cablecar.py: the Mount Faber Line between the lm40 station models (rope ends at their mouths, the two real towers) */
function sgRopeV40(B, pts, hs, clear){
  const P = [], Hc = [], g = [], tw = [];
  for (let k = 0; k < pts.length - 1; k++){
    const A = pts[k], Bp = pts[k + 1], L = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]), n = Math.max(2, Math.ceil(L/20));
    for (let i = k === 0 ? 0 : 1; i <= n; i++){ const t = i/n; P.push([A[0] + (Bp[0] - A[0])*t, A[1] + (Bp[1] - A[1])*t]); Hc.push(hs[k] + (hs[k + 1] - hs[k])*t); }
    tw.push(P.length - 1);
  }
  tw.pop();   // indices of the intermediate towers
  for (const p of P) g.push(Math.max(0, hAt(p[0], p[1])));
  const A = P[0], Z = P[P.length - 1], LL = Math.hypot(Z[0] - A[0], Z[1] - A[1]), u = [(Z[0] - A[0])/LL, (Z[1] - A[1])/LL], v = [-u[1], u[0]], steel = [0.72, 0.74, 0.76];
  // keep the rope above the ground between the towers (never moves the ends)
  for (let i = 1; i < P.length - 1; i++) if (Hc[i] < g[i] + clear) Hc[i] = g[i] + clear;
  for (const i of tw){ const p = P[i];
    addPrism(B.deck, orect(p, u, 1.8, 1.8), g[i] - 1, Hc[i] - 0.6, steel);
    addPrism(B.deck, orect(p, v, 7.2, 0.8), Hc[i] - 0.6, Hc[i] + 0.4, steel);
    B.lamps.push(p[0], Hc[i] + 1, -p[1]); B.lampC.push(1, 0.2, 0.15); }
  const W = []; for (const s of [-2.6, 2.6]) for (let i = 0; i < P.length - 1; i++){ const a = P[i], b = P[i+1]; W.push(a[0] + v[0]*s, Hc[i], -(a[1] + v[1]*s), b[0] + v[0]*s, Hc[i+1], -(b[1] + v[1]*s)); }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(W, 3)); regionGroup.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({color:0x3c4044})));
  let L = 0; const cum = [0]; for (let i = 1; i < P.length; i++){ L += Math.hypot(P[i][0] - P[i-1][0], P[i][1] - P[i-1][1]); cum.push(L); }
  const nc = Math.max(4, Math.floor(L/80));
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(2.4, 2.6, 2.4), new THREE.MeshLambertMaterial({color:0xffffff}), nc*2), cc = new THREE.Color(), CAB = [0xd8342a, 0x2f7fd0, 0xf2b630, 0x3aa35c, 0xe46aa8, 0xf4f4f2];
  for (let i = 0; i < nc*2; i++){ cc.setHex(CAB[i % CAB.length]); im.setColorAt(i, cc); } im.castShadow = true; moverGroup.add(im);
  net.ropes.push({P, Hc, L, cum, v, im, nc});
  return {P, Hc};
}
function sgCableCar(B){
  net.ropes = [];
  const faber = sgXY(1.271196, 103.819408), hf = sgXY(1.264482, 103.818698), sen = sgXY(1.255517, 103.817702);
  const yF = 104, yH = 66, yS = 59;
  const along = (a, b, d) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); return [a[0] + (b[0] - a[0])*d/L, a[1] + (b[1] - a[1])*d/L]; };
  // the two towers on the straight line, by their distances from the stations (300 m of Faber-HF 700 m; 450 m of Sentosa-HF 950 m)
  const LF = Math.hypot(hf[0] - faber[0], hf[1] - faber[1]), LS = Math.hypot(hf[0] - sen[0], hf[1] - sen[1]);
  const t1 = along(faber, hf, LF*300/700), t2 = along(sen, hf, LS*450/950);
  const h1 = Math.max(80, Math.max(0, hAt(t1[0], t1[1])) + 16), h2 = Math.max(88, Math.max(0, hAt(t2[0], t2[1])) + 16);
  sgRopeV40(B, [faber, t1, hf], [yF, h1, yH], 14);
  sgRopeV40(B, [hf, t2, sen], [yH, h2, yS], 14);
  for (const p of [faber, hf, sen]) for (let j = cx2i(p[1] - 22); j <= cx2i(p[1] + 22); j++) for (let i = cx2i(p[0] - 22); i <= cx2i(p[0] + 22); i++){ const k = j*N + i; zones[k] = 0; if (!resv[k]) resv[k] = 4; }
  const mid = [(hf[0] + t2[0])/2, (hf[1] + t2[1])/2];
  net.extras.push({x:mid[0], y:mid[1], t:'rope', top:(yH + h2)/2 + 16, name:['新加坡缆车 · 花柏山线', 'Singapore Cable Car · Mount Faber Line']});
}
'''
def apply(src, city):
    if city != 'sg': return src
    assert src.count(OLD_HEAD) == 1, ('cablecar head', src.count(OLD_HEAD))
    a = src.index(OLD_HEAD); b = src.index(OLD_TAIL, a)
    assert src.count(OLD_TAIL) == 1, ('cablecar tail', src.count(OLD_TAIL))
    return src[:a] + NEW + src[b + len(OLD_TAIL):]
