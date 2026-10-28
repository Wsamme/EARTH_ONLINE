
// ================= Tencent Seafront Towers (腾讯滨海大厦; NBBJ, 2017) =================
// OSM w694152192 (South Tower, the anchor) and w694152193 (North Tower). South Tower 245.8 m, 50 floors (CTBUH); North Tower
// 194.8 m (OSM; 194 m Wikipedia / WSP). Plans about 30 m wide, 95 m and 76 m long (CTBUH paper 2933). Three links join the towers
// (CTBUH paper 2933, BH Architects): the cultural link over the lobby (floors 3-6), the health link (floors 21-26, ~97-122 m,
// running track, basketball court) and the knowledge link (floors 34-38, ~153-176 m); 4.5 m floors. The links are clad in
// copper-coloured aluminium louvres (Dezeen). The glazed skins are self-shading: panels lean out on the south and tilt back and
// forth on the east and west, their edges shaded by aluminium (Dezeen). No logo. Night: the facades are light-show LED skins.
LANDMARKS.sztencent = {zh:'腾讯滨海大厦', en:'Tencent Seafront Towers', cat:'new', r:60, h:245.8, lt:{m:1, c:'#e6eeff', k:0.7, anim:'show', c2:'#5fb8ff'},
  build(){
    const g = new THREE.Group(), B = Bt(), FH = 4.5;
    const GA = {c:'#7d909c', m:2, lk:0.3}, GB = {c:'#94a5b0', m:2, lk:0.3}, AL = {c:'#c9ccca', m:0, lk:0.5}, BR = {c:'#a5714c', m:0, lk:0.75, lc:'#ffd9b0'},
      LINKIN = {c:'#5b4a3c', glow:'#ffd7a6', gk:0.55}, LOB = {c:'#5d6a72', m:1, fh:4.5, cw:3.0}, ROOF = {c:'#8f9294'}, MECH = {c:'#6e7476', m:0, lk:0.3}, GRN = {c:'#6f8a55'};
    const tower = (P, H, nf, ph) => {
      const n = P.length, crownY = nf*FH;
      for (let e = 0; e < n; e++){ const a = P[e], b = P[(e + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.5) continue;
        const Nn = outN(P, a, b), nb = Math.max(1, Math.round(L/3.1)), south = Nn[1] > 0.6;
        for (let i = 0; i < nf; i++){ const y0 = i*FH, y1 = y0 + FH;
          for (let j = 0; j < nb; j++){ const t0 = j/nb, t1 = (j + 1)/nb, A = [lerp(a[0], b[0], t0), lerp(a[1], b[1], t0)], C = [lerp(a[0], b[0], t1), lerp(a[1], b[1], t1)];
            // self-shading panels: lean out at the head on the south, tilt to and fro on the east / west / north (alternating waves)
            const w = 0.5 + 0.5*Math.sin(j*0.9 + i*0.45 + ph), d = south ? 0.55 + 0.25*w : 0.6*(w - 0.5), dx = Nn[0]*d, dz = Nn[1]*d;
            B.q((i*7 + j*3) % 5 < 2 ? GB : GA, [A[0], y0, A[1]], [C[0], y0, C[1]], [C[0] + dx, y1 - 0.35, C[1] + dz], [A[0] + dx, y1 - 0.35, A[1] + dz]);
            // the aluminium edge shade over the panel head
            const o = Math.max(0.2, d + 0.25); B.q(AL, [A[0], y1 - 0.35, A[1]], [C[0], y1 - 0.35, C[1]], [C[0] + Nn[0]*o, y1 - 0.35, C[1] + Nn[1]*o], [A[0] + Nn[0]*o, y1 - 0.35, A[1] + Nn[1]*o]);
            B.q(AL, [A[0] + dx, y1 - 0.35, A[1] + dz], [C[0] + dx, y1 - 0.35, C[1] + dz], [C[0], y1, C[1]], [A[0], y1, A[1]]); }
          }
        // crown: plant floors behind a louvred screen to the top
        B.q(MECH, [a[0], crownY, a[1]], [b[0], crownY, b[1]], [b[0], H, b[1]], [a[0], H, a[1]]);
      }
      facade(B, AL, null, P, crownY, H, {cw:2.2, fd:0.5, fw:0.35, ends:true});
      cap(B, ROOF, P, H - 0.8); prism(B, ROOF, off(P, -0.5), H - 0.8, H, ROOF);
      const I = off(P, -6); if (Math.abs(area2(I)) > 100) cap(B, GRN, I, H - 0.7);      // roof garden
      cap(B, ROOF, P, 0.1);
    };
    tower(D.tc.s, 245.8, 50, 0); tower(D.tc.n, 194.8, 41, 1.7);
    // links: the quad between the towers' facing faces (OSM w775462996), pushed 1 m into each tower
    const Q = D.tc.link, c = cen(Q), LQ = Q.map(p => [p[0] + (p[0] - c[0])*0.04, p[1] + (p[1] - c[1])*0.04]);
    const link = (y0, y1) => {
      prism(B, LINKIN, off(LQ, -0.8), y0 + 0.3, y1 - 0.3, ROOF, ROOF);
      for (let y = y0; y < y1 - 0.2; y += 0.9) for (let i = 0; i < 4; i++){ if (i % 2 === 0) continue; const a = LQ[i], b = LQ[(i + 1) % 4], Nn = outN(LQ, a, b);
        // copper louvres: inclined slats over the two open sides (edges 1 and 3 span the gap; 0 and 2 lie on the tower faces)
        B.q(BR, [a[0], y, a[1]], [b[0], y, b[1]], [b[0] + Nn[0]*0.7, y + 0.45, b[1] + Nn[1]*0.7], [a[0] + Nn[0]*0.7, y + 0.45, a[1] + Nn[1]*0.7]); }
      prism(B, BR, LQ, y1 - 0.8, y1, BR, false); prism(B, BR, LQ, y0, y0 + 0.8, false, BR);
    };
    link(3*FH - FH, 7*FH + 0.2);               // floors 3-6 (cultural), over the lobby
    link(20*FH, 26*FH + 4.3);                  // floors 21-26 (health) to ~122 m
    link(33*FH, 39*FH + 0.3);                  // floors 34-38 (knowledge) to ~176 m
    // the glazed lobby under the cultural link
    prism(B, LOB, off(LQ, -1.5), 0, 2*FH, ROOF);
    const AV = [];
    for (const [P, H] of [[D.tc.s, 245.8], [D.tc.n, 194.8]]) for (const p of [P[0], P[Math.floor(P.length/2)]]) AV.push(...avia(B, g, [[p[0]*0.97, H, p[1]*0.97]]));
    B.flush(g); lights(g, AV, [1, 0.16, 0.1], 12);
    return g;
  }};
SG_PLACES.push({type:'sztencent', lat:22.525503, lon:113.930555, rot:0});
