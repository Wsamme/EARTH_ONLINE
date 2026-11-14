// TEST ONLY (in-situ kit / app copy): applies szlink_deck_fix.py's Lingdingyang profile to the decoded road lines in the browser, so
// the bridge model can be checked against the deck the integrator's fix will produce. Load it before insitu.js (m= list).
(() => {
  const MID = 91.0, RV = 33320, TT = 833, G = 0.025, OFF = 0.18;
  const zprof = t => { const a = Math.abs(t); return a <= TT ? MID - a*a/(2*RV) : MID - TT*TT/(2*RV) - G*(a - TT); };
  const smax = (a, b, e) => { const d = Math.abs(a - b); return Math.max(a, b) + (d < e ? (e - d)*(e - d)/(4*e) : 0); };
  const [MX, MY] = sgXY(22.5553435, 113.7255956), UX = Math.cos(0.32976), UY = Math.sin(0.32976);
  const dec = SGRoads.decode;
  SGRoads.decode = (...a) => {
    const lines = dec(...a); let n = 0;
    for (const L of lines){
      if (L.c !== 0 || !L.E) continue;
      const P = L.P, np = P.length/2; let hit = false;
      for (let k = 0; k < np; k++){ const dx = P[2*k] - MX, dy = P[2*k + 1] - MY, al = dx*UX + dy*UY, la = -dx*UY + dy*UX; if (Math.abs(al) < 900 && Math.abs(la) < 16){ hit = true; break; } }
      if (!hit) continue;
      // densify to 10 m
      const Q = [], E0 = [];
      for (let k = 0; k < np - 1; k++){ const x0 = P[2*k], y0 = P[2*k + 1], x1 = P[2*k + 2], y1 = P[2*k + 3], d = Math.hypot(x1 - x0, y1 - y0), m = Math.max(1, Math.ceil(d/10));
        for (let j = 0; j < m; j++){ const f = j/m; Q.push(x0 + (x1 - x0)*f, y0 + (y1 - y0)*f); E0.push(L.E[k] + (L.E[k + 1] - L.E[k])*f); } }
      Q.push(P[2*np - 2], P[2*np - 1]); E0.push(L.E[np - 1]);
      const nq = Q.length/2, D = [0];
      for (let k = 1; k < nq; k++) D.push(D[k - 1] + Math.hypot(Q[2*k] - Q[2*k - 2], Q[2*k + 1] - Q[2*k - 1]));
      const al = []; for (let k = 0; k < nq; k++) al.push((Q[2*k] - MX)*UX + (Q[2*k + 1] - MY)*UY);
      let k0 = 0; for (let k = 1; k < nq; k++) if (Math.abs(al[k]) < Math.abs(al[k0])) k0 = k;
      const sg = al[Math.min(k0 + 1, nq - 1)] > al[Math.max(k0 - 1, 0)] ? 1 : -1, s0 = D[k0] - sg*al[k0];
      const E = new Float32Array(nq);
      for (let k = 0; k < nq; k++){ const t = sg*(D[k] - s0), gz = hC(Q[2*k], Q[2*k + 1]), zo = gz + E0[k] + OFF, zn = Math.abs(t) > TT ? smax(zprof(t), zo, 8) : zprof(t); E[k] = Math.max(0, zn - OFF - gz); }
      L.P = new Float32Array(Q); L.E = E; L.flags |= 32; n++;
    }
    if (n) console.log('[log] linkshim: Lingdingyang profile on', n, 'lines');
    return lines;
  };
})();
