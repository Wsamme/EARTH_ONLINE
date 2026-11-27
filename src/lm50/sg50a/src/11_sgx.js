// ================= SGX Centre, 2 & 4 Shenton Way (sgsgx, hero) =================
// Wikipedia: twin towers SGX Centre One (2000) and Two (2001), 30 floors each, roof 172 m, antenna spire 187 m; Kohn Pedersen Fox
// with Architects 61; slightly arced so most floors look towards Marina Bay; vertical and horizontal fins on different sides;
// colonnaded walkways and a glass lobby on the first storey. Plans: OSM w47345025 (Tower One, NE) and w47345024 (Tower Two, SW)
// on the 3-storey podium w45098518 (app 11.1 m). Look (photo, Commons "SGX Centre Two"): warm-grey granite; the arced SE face
// with closely spaced vertical fins; the narrow end faces glass with deep horizontal sun-shade ledges between granite piers that
// rise into a crown frame with an open square at the top; a slim twin antenna mast above it.
// Night: lit office floors, crown frame washed white. No lettering (the real crown carries a tenant sign: left out).
{
const A0 = [1.279274, 103.849819];
const POD0 = [[36.7,-87.9],[-62.3,72.1],[-36.6,87.6],[61.9,-71.9]];
// tags: g granite flank, c arced fin face, e end face (glass + ledges), n notch
const T1raw = [[31.4,-71.9,'n'],[27.9,-66.6,'n'],[24.9,-68.9,'g'],[3.4,-33.4,'e'],[11.7,-28.1,'n'],[14.2,-31.6,'e'],[30.7,-21.4,'c']];
const T1arc = [[30.7,-21.4],[37.9,-33.9],[44.4,-46.9],[48.2,-61.9]];
const T2raw = [[-8.6,42.6,'e'],[-27.1,31.9,'n'],[-25.8,28.9,'n'],[-32.6,24.9,'g'],[-54.1,58.6,'g'],[-50.3,61.6,'g'],[-53.3,66.4,'e'],[-36.1,76.9,'c']];
const T2arc = [[-36.1,76.9],[-24.8,66.4],[-15.8,53.9],[-8.6,42.6]];
const mkT = (raw, arc, endTagAfterArc) => { const out = raw.slice(); const s = crChain(arc, 4); for (let i = 1; i < s.length - 1; i++) out.push([s[i][0], s[i][1], 'c']); out.push([arc[arc.length - 1][0], arc[arc.length - 1][1], endTagAfterArc]); return out; };
// Tower One: after the arc comes the NE end face (48.2,-61.9) -> (31.4,-71.9); Tower Two's arc ends at its inner end face vertex
const T1T = mkT(T1raw, T1arc, 'e'), T2T = (() => { const a = T2raw.slice(); const s = crChain(T2arc, 4); for (let i = 1; i < s.length - 1; i++) a.push([s[i][0], s[i][1], 'c']); return a; })();
const C0 = pcen(POD0);
const sh = T => T.map(t => [t[0] - C0[0], t[1] - C0[1], t[2]]);
const POD = shP(POD0, C0[0], C0[1]), TW = [tagP(sh(T1T)), tagP(sh(T2T))];
LANDMARKS.sgsgx = {zh:'新加坡交易所大厦', en:'SGX Centre', cat:'new', r:100, h:187,
  lt:{m:1, c:'#e8f0ff', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GR = {c:'#aaa59c', m:0, lk:0.35}, GR2 = {c:'#9b968d', m:0, lk:0.3}, GL = {c:'#46566a', m:1, fh:4.8, cw:1.6}, GLE = {c:'#4c5d70', m:1, fh:4.8, cw:3},
    LEDGE = {c:'#c9c6bf', m:0, lk:0.3}, ROOF = '#8e9192', MECH = '#727779', FOUND = '#bdb7ab', PAVE = '#c4beb2', LOB = {c:'#aebfc6', m:0, glow:'#ffe6c0', gk:0.75},
    MAST = '#c9cccd', MURAL = {c:'#8c8478', m:0, lk:0.3}, COL = '#cfcac0';
  const YP = 11.1, Y1 = 160, Y2 = 172, YM = 187, FH = 4.8;
  // ---- podium: granite, glass lobby behind a colonnade along Shenton Way (SE long edge) ----
  foundP(B.p(FOUND), POD); wallP(B.p(GR), POD, 0.3, YP); capP(B.p(ROOF), POD, YP);
  bandAtP(B.p(GR2), POD, YP - 0.8, 0.8, 0.2);
  const pe = edgesF(POD);
  for (const e of pe){ if (e.L < 50) continue;
    const se = e.nx*0 + 1; // both long sides: colonnade and glass on the Shenton Way side, plain wall with the long mural band on Robinson Road side
    const isShenton = (e.a[0] + e.b[0]) > 0; // the SE edge lies east of the centre
    if (isShenton){ slabP(B.p(LOB), rectO(2, e.L - 2, 0.3, 6.5), e.F, -3, -2.9); slabP(B.p(ROOF), rectO(0, e.L, 6.5, 7.2), e.F, -3.2, 0.05);
      const n = Math.round(e.L/8.4); for (let k = 0; k <= n; k++){ const p = e.F(k*e.L/n, 0, -0.6); segP(B.p(COL), [p[0], 0.3, p[2]], [p[0], 6.5, p[2]], 0.45, 8); } }
    else slabP(B.p(MURAL), rectO(e.L/2 - 60, e.L/2 + 60, 1.2, 5.2), e.F, 0.02, 0.12);
  }
  // ---- the two towers ----
  for (const T of TW){
    const P = T.P, E = edgesF(P);
    // walls per edge kind
    E.forEach((e, i) => { const t = T.tags[i], c = t === 'c' ? GL : t === 'e' ? GLE : GR;
      quadP(B.p(c), [e.a[0], YP, e.a[1]], [e.b[0], YP, e.b[1]], [e.b[0], Y1, e.b[1]], [e.a[0], Y1, e.a[1]]); });
    capP(B.p(ROOF), P, Y1);
    E.forEach((e, i) => { const t = T.tags[i];
      if (t === 'c'){ // arced face: vertical granite fins every 1.55 m
        const n = Math.max(1, Math.round(e.L/1.55)); for (let k = 0; k < n; k++) slabP(B.p(GR), rectO(k*e.L/n - 0.14, k*e.L/n + 0.14, YP, Y2), e.F, 0, 0.75);
        ribP(B.p(GR2), [e.a, e.b], YP + FH, Y1, FH, 0.35, 0.05);
      } else if (t === 'g'){ // flat granite flank: narrow vertical window slits
        const n = Math.max(1, Math.round(e.L/3)); for (let k = 0; k < n; k++) shapeP(B.p(GL), rectO((k + 0.5)*e.L/n - 0.45, (k + 0.5)*e.L/n + 0.45, YP + 2, Y1 - 2), e.F, 0.05);
        slabP(B.p(GR), rectO(0, e.L, Y1, Y2), e.F, -0.4, 0);
      } else if (t === 'e'){ // end face: granite piers at both sides, glass with deep sun-shade ledges between, crown frame with an open square
        const pw = Math.min(4.2, e.L*0.2);
        slabP(B.p(GR), rectO(0, pw, YP, Y2), e.F, 0, 0.9); slabP(B.p(GR), rectO(e.L - pw, e.L, YP, Y2), e.F, 0, 0.9);
        for (let y = YP + FH*2; y < Y1 - 6; y += FH*2) slabP(B.p(LEDGE), rectO(pw, e.L - pw, y, y + 0.45), e.F, 0, 1.6);
        for (let k = 1; k < 4; k++) shapeP(B.p(GR2), rectO(pw + (e.L - 2*pw)*k/4 - 0.08, pw + (e.L - 2*pw)*k/4 + 0.08, YP, Y1 - 6), e.F, 0.06);
        slabP(B.p(GR), rectO(pw, e.L - pw, Y1 - 6, Y1 - 3.5), e.F, 0, 0.9);       // sill of the open square
        slabP(B.p(GR), rectO(pw, e.L - pw, Y2 - 3, Y2), e.F, 0, 0.9);             // lintel
      }
    });
    // crown: screen walls rise from the roof to 172 m on the flanks; roof plant set back; the twin antenna mast over one end
    const S2 = offP(P, 2.5); wallP(B.p(MECH), offP(P, 6), Y1, Y1 + 5); capP(B.p(ROOF), offP(P, 6), Y1 + 5);
    const ce = E.filter((e, i) => T.tags[i] === 'e').sort((a, b) => b.L - a.L)[0];
    if (ce){ const m = ce.F(ce.L/2, 0, -4.5);
      for (const d of [-1.2, 1.2]){ const p = [m[0] + ce.nz*0 + Math.cos(ce.ang)*d, 0, m[2] + Math.sin(ce.ang)*d]; segP(B.p(MAST), [p[0], Y1, p[2]], [p[0], YM, p[2]], 0.28, 6);
        for (let y = Y2; y < YM - 1; y += 2.5) segP(B.p(MAST), [p[0], y, p[2]], [m[0], y + 1.25, m[2]], 0.08, 4); }
      boxP(B.p(LAV50), 0.5, 0.6, 0.5, m[0], YM, m[2]); }
    lavP(B.p(LAV50), [P[0], P[Math.floor(P.length/2)]], Y2);
  }
  // street trees along Shenton Way
  for (const e of pe) if (e.L > 50 && (e.a[0] + e.b[0]) > 0){ const n = Math.round(e.L/14); for (let k = 0; k < n; k++){ const p = e.F((k + 0.5)*e.L/n, 0, 2.4); treeP(B.p('#5b4a3a'), B.p({c:'#4f7a3e', m:0, lk:0.1}), p[0], 0.3, p[2], 1.2, R); } }
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgsgx', lat:PL.lat, lon:PL.lon, rot:0});
}
