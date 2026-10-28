
// ================= Shekou Container Terminal (蛇口集装箱码头, SCT, site) =================
// 33 quay cranes after five ZPMC cranes were delivered in 2009 (FreightWaves, 28 May 2009). Plan: OSM r15788753 (the terminal),
// the quay-crane rails mapped in OSM (w1071215527 / -28 / -29: 969 m, 1 551 m and 845 m of quay; w1071215524-26: three yard
// gantry rails), the terminal's service roads (the yard lanes). Crane dimensions are those of a typical super-post-Panamax
// ship-to-shore crane (30 m rail span, boom about 48 m over the quay, 60 m outreach, A-frame apex about 78 m): estimates, as are
// the stacks (filled into the free yard between the lanes, 1-5 high) and the crane colours.
const PTS = {crane:{c:'#d9dcdc', m:0, lc:'#eef3ff', lk:0.6, e:0.6}, craneD:'#9aa1a6', house:'#c8ccd0', boom:{c:'#e0e2e1', m:0, lc:'#eef3ff', lk:0.3}, red:{c:'#b01810', glow:'#ff2a14', gk:2.2},
  rtg:{c:'#d7d9d6', m:0, lc:'#fff0d0', lk:0.3}, mast:'#8d9396', flood:{c:'#fff6e0', glow:'#fff1d0', gk:2.2}, cab:{c:'#5a6a74', glow:'#ffe2b0', gk:0.8}, cont:{m:0, lc:'#fff0d0', lk:0.32, e:0.9}, rail:'#6b6e6f', shed:{c:'#9fb0bb', m:0, lc:'#fff0d0', lk:0.3}, shedR:'#b8bcbd', hull:'#2f3438', hullR:'#7a2a22', deck:'#7c7f7d', accom:{c:'#eeeeea', m:1, lc:'#ffe6c0', lk:0.4, fh:2.8, cw:2.2}};
const CONT = ['#2c5f8f', '#8e2b22', '#3f7a4a', '#b5b8b6', '#e0e0dc', '#c46a24', '#6b6f73', '#1f3f6b', '#a2342a', '#d1a23a', '#4f5f6f', '#7c3f2b', '#e6e6e1', '#2e7f86'];
function stsCrane(B, ox, oz, rx, rz, nx, nz, raised){
  // frame: along the rail (rx, rz), towards the water (nx, nz); landside rail at -2, waterside at 28.5 (from the OSM rail line)
  const P = (a, c, y) => [ox + rx*a + nx*c, y, oz + rz*a + nz*c], L = 8.5, cL = -2, cW = 28.5, yG = 47, yS = 14;
  for (const a of [-L, L]) for (const c of [cL, cW]){ beam(B, PTS.crane, P(a, c, 0.6), P(a, c, yG), 0.9); abox(B, PTS.craneD, P(a, c, 0)[0] - 1.6, P(a, c, 0)[0] + 1.6, 0, 1.4, P(a, c, 0)[2] - 1.6, P(a, c, 0)[2] + 1.6); }
  for (const c of [cL, cW]) beam(B, PTS.crane, P(-L, c, yS), P(L, c, yS), 0.9);                     // sill beams
  for (const a of [-L, L]) { beam(B, PTS.crane, P(a, cL, yS), P(a, cW, yS), 0.7); beam(B, PTS.crane, P(a, cL, yS), P(a, cW, yG - 2), 0.4); }
  // portal top / girder: two box girders from the backreach (-24) to the boom hinge (cW + 2)
  for (const a of [-3.2, 3.2]) { const A = P(a, -24, yG), C = P(a, cW + 2, yG); beam(B, PTS.crane, [A[0], yG + 1.2, A[2]], [C[0], yG + 1.2, C[2]], 1.2); }
  for (const a of [-L, L]) beam(B, PTS.crane, P(a, cL, yG + 1), P(a, cW, yG + 1), 0.8);
  // machinery house on the backreach
  { const c = P(0, -16, 0); obox(B, PTS.house, c[0], c[2], nx, nz, 14, 11, yG + 2.4, yG + 8.5); }
  // A-frame and stays
  const apex = [P(0, cL + 4, 78), P(0, cW - 2, 78)];
  for (const a of [-3.4, 3.4]){ beam(B, PTS.crane, P(a, cL + 1, yG + 2), [apex[0][0] + rx*a*0.3, 78, apex[0][2] + rz*a*0.3], 0.6); beam(B, PTS.crane, P(a, cW, yG + 2), [apex[1][0] + rx*a*0.3, 78, apex[1][2] + rz*a*0.3], 0.6); }
  beam(B, PTS.crane, apex[0], apex[1], 0.6);
  // the boom: 60 m outreach; lowered (horizontal) or raised (about 80 deg) when idle
  const hinge = P(0, cW + 2, yG + 1.2), len = 62, ang = raised ? 1.38 : 0;
  const tip = [hinge[0] + nx*Math.cos(ang)*len, hinge[1] + Math.sin(ang)*len, hinge[2] + nz*Math.cos(ang)*len];
  for (const a of [-3.2, 3.2]) beam(B, PTS.boom, [hinge[0] + rx*a, hinge[1], hinge[2] + rz*a], [tip[0] + rx*a*0.6, tip[1], tip[2] + rz*a*0.6], 1.0);
  const mid = [(hinge[0] + tip[0])/2, (hinge[1] + tip[1])/2, (hinge[2] + tip[2])/2];
  beam(B, PTS.craneD, apex[1], tip, 0.25); beam(B, PTS.craneD, apex[1], mid, 0.25); beam(B, PTS.craneD, apex[0], P(0, -24, yG + 2), 0.3);
  lampBox(B, PTS.red, tip[0] - 0.5, tip[1] + 0.6, tip[2] - 0.5, 1.0); lampBox(B, PTS.red, apex[0][0] - 0.5, 78.6, apex[0][2] - 0.5, 1.0);
  // trolley + operator cab under the girder, floodlights under the boom
  { const c = P(0, raised ? cW - 6 : cW + 18, yG - 1.5); obox(B, PTS.cab, c[0], c[2], nx, nz, 4.5, 3.5, yG - 4.5, yG - 0.5); }
  for (const c of [cL + 6, cW - 4, raised ? cW : cW + 30]) lampBox(B, PTS.flood, P(0, c, 0)[0] - 0.5, yG - 0.8, P(0, c, 0)[2] - 0.5, 1.0);
}
function containerShip(B, V, rng, cx, cz, ux, uz, L, W){
  const vx = -uz, vz = ux, P = (a, b, y) => [cx + ux*a + vx*b, y, cz + uz*a + vz*b];
  // hull: pointed bow at +L/2, square stern; dark hull, red boot top, deck at 14 m
  const hull = [[-L/2, -W/2], [L/2 - 40, -W/2], [L/2 - 8, -W*0.3], [L/2, 0], [L/2 - 8, W*0.3], [L/2 - 40, W/2], [-L/2, W/2]].map(([a, b]) => [cx + ux*a + vx*b, cz + uz*a + vz*b]);
  prism(B, PTS.hullR, hull, -2, 1.5, {noTop:true}); prism(B, PTS.hull, hull, 1.5, 14, {top:PTS.deck});
  // deckhouse aft (accommodation), funnel
  obox(B, PTS.accom, cx - ux*(L/2 - 28), cz - uz*(L/2 - 28), ux, uz, 16, W - 6, 14, 38, {top:PTS.deck}); obox(B, PTS.cab, cx - ux*(L/2 - 28), cz - uz*(L/2 - 28), ux, uz, 16.4, W - 4, 35, 37.5);
  obox(B, PTS.hull, cx - ux*(L/2 - 14), cz - uz*(L/2 - 14), ux, uz, 7, 5, 14, 44);
  // container bays on deck forward of the house
  for (let a = -L/2 + 40; a < L/2 - 30; a += 13.4){ const tiers = 3 + Math.floor(rng()*4), rows = Math.floor((W - 4)/2.5);
    for (let r = 0; r < rows; r++){ if (rng() < 0.08) continue; const b = -W/2 + 2 + r*2.5 + 1.25, t = tiers - (rng() < 0.3 ? 1 : 0), h = 14 + t*2.59;
      V.c(CONT[Math.floor(rng()*CONT.length)]); const q = [P(a - 6.06, b - 1.2, h), P(a + 6.06, b - 1.2, h), P(a + 6.06, b + 1.2, h), P(a - 6.06, b + 1.2, h)], p = [P(a - 6.06, b - 1.2, 14), P(a + 6.06, b - 1.2, 14), P(a + 6.06, b + 1.2, 14), P(a - 6.06, b + 1.2, 14)];
      V.q(0, q[0], q[1], q[2], q[3]); for (let i = 0; i < 4; i++){ const j = (i + 1) & 3; V.q(0, p[i], p[j], q[j], q[i]); } } }
  lampBox(B, PTS.red, cx - ux*(L/2 - 28) - 0.4, 44, cz - uz*(L/2 - 28) - 0.4, 0.8);
}
function rtgCrane(B, cx, cz, ux, uz, vx, vz, span){
  const P = (a, b, y) => [cx + ux*a + vx*b, y, cz + uz*a + vz*b], h = 21;
  for (const a of [-3.2, 3.2]) for (const b of [-span/2, span/2]){ const p = P(a, b, 0); beam(B, PTS.rtg, [p[0], 1.2, p[2]], [p[0], h, p[2]], 0.45); abox(B, PTS.craneD, p[0] - 0.9, p[0] + 0.9, 0, 1.5, p[2] - 0.9, p[2] + 0.9); }
  for (const b of [-span/2, span/2]) beam(B, PTS.rtg, P(-3.2, b, 1.6), P(3.2, b, 1.6), 0.4);
  for (const a of [-3.2, 3.2]) beam(B, PTS.rtg, P(a, -span/2 - 0.5, h + 0.7), P(a, span/2 + 0.5, h + 0.7), 0.7);
  const t = P(0, span*0.2, 0); obox(B, PTS.cab, t[0], t[2], ux, uz, 5.5, 4.5, h - 1.5, h + 1.0); lampBox(B, PTS.flood, t[0] - 0.4, h - 2.2, t[2] - 0.4, 0.8);
}
Object.assign(SITES, {szshekouport:{zh:'蛇口集装箱码头', en:'Shekou Container Terminal', lat:D.szshekouport.lat, lon:D.szshekouport.lon, r:1181, keep:D.szshekouport.area, keepRoads:[11, 12], h:112,
  lt:{m:0, c:'#fff0d0', k:0.3, e:0.8},
  build(ctx){
    const T = D.szshekouport, g = new THREE.Group(), B = Batch(), V = VB(PTS.cont), gy = ctx.gy, rng = ctx.rng, A = T.area;
    const [ux, uz] = T.ax, vx = -uz, vz = ux;
    ctx.paint(A, [150, 149, 144]);
    // quay cranes along the three quays (29 of SCT's 33), booms over the water: lowered at a working berth, raised elsewhere
    const quays = [['w1071215528', 14], ['w1071215527', 8], ['w1071215529', 7]];
    for (const [id, n] of quays){ const R = T.rails[id], a = R[0], b = R[R.length - 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), rx = dx/l, rz = dz/l;
      let nx = -rz, nz = rx; const m = [(a[0] + b[0])/2, (a[1] + b[1])/2]; if (pip(A, m[0] + nx*60, m[1] + nz*60)){ nx = -nx; nz = -nz; }
      ctx.line([a, b], 1.2, [96, 98, 99]); ctx.line([[a[0] + nx*30.5, a[1] + nz*30.5], [b[0] + nx*30.5, b[1] + nz*30.5]], 1.2, [96, 98, 99]);
      ctx.paint([[a[0] - nx*6, a[1] - nz*6], [b[0] - nx*6, b[1] - nz*6], [b[0] + nx*34, b[1] + nz*34], [a[0] + nx*34, a[1] + nz*34]], [170, 168, 162]);
      // positions: groups of cranes at berths, random gaps
      const pos = [], gap = (l - 60)/n; let s = 30 + rng()*20; while (pos.length < n && s < l - 25){ pos.push(s); s += Math.max(36, gap*(0.45 + rng()*1.1)); }
      let berth = 0; const work = new Map();
      pos.forEach((s, i) => { if (i > 0 && s - pos[i - 1] > 90) berth++; const raised = berth % 2 === 1; stsCrane(B, a[0] + rx*s, a[1] + rz*s, rx, rz, nx, nz, raised);
        if (!raised){ const w = work.get(berth) || [s, s]; w[0] = Math.min(w[0], s); w[1] = Math.max(w[1], s); work.set(berth, w); } });
      // a container ship (generic, no livery) alongside each working berth
      const used = []; let nShip = 0;
      for (const [s0, s1] of work.values()){ const len = 280, sm = clamp((s0 + s1)/2, len/2 + 5, l - len/2 - 5); if (l < len + 20 || nShip >= (n > 10 ? 2 : 1) || used.some(u => Math.abs(u - sm) < len + 30)) continue; used.push(sm); nShip++;
        const cx = a[0] + rx*sm + nx*58, cz = a[1] + rz*sm + nz*58; containerShip(B, V, rng, cx, cz, rx, rz, len, 42); }
    }
    // yard gantries on the three short rails
    for (const id of ['w1071215524', 'w1071215525', 'w1071215526']){ const R = T.rails[id], a = R[0], b = R[R.length - 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), rx = (b[0] - a[0])/l, rz = (b[1] - a[1])/l;
      for (const f of [0.3, 0.72]) rtgCrane(B, a[0] + (b[0] - a[0])*f, a[1] + (b[1] - a[1])*f, rx, rz, -rz, rx, 34); }
    // container stacks: rows parallel to the long quay, 12.2 m boxes, 1-5 high
    const blocks = new Map();
    for (const [u0, u1, v] of T.rows){
      const key = Math.round(v/22.8); if (!blocks.has(key)) blocks.set(key, []); blocks.get(key).push([u0, u1, v]);
      const n = Math.floor((u1 - u0)/12.6); let col = null, run = 0;
      for (let k = 0; k < n; k++){ if (run <= 0){ col = CONT[Math.floor(rng()*CONT.length)]; run = 1 + Math.floor(rng()*4); } run--;
        const r = rng(); if (r < 0.07) continue; const tiers = r < 0.2 ? 1 : r < 0.42 ? 2 : r < 0.72 ? 3 : r < 0.92 ? 4 : 5;
        const uc = u0 + 6.3 + k*12.6, cx = ux*uc + vx*v, cz = uz*uc + vz*v, y = Math.max(0, gy(cx, cz));
        const c = rng() < 0.5 ? col : CONT[Math.floor(rng()*CONT.length)];
        V.c(c); const Pq = (a, b, yy) => [cx + ux*a + vx*b, yy, cz + uz*a + vz*b], h = y + tiers*2.59, L = 6.06, W = 1.22;
        const p = [Pq(-L, -W, y), Pq(L, -W, y), Pq(L, W, y), Pq(-L, W, y)], q = [Pq(-L, -W, h), Pq(L, -W, h), Pq(L, W, h), Pq(-L, W, h)];
        V.q(0, q[0], q[1], q[2], q[3]); for (let i = 0; i < 4; i++){ const j = (i + 1) & 3; V.q(0, p[i], p[j], q[j], q[i]); } } }
    // RTG cranes over the stack blocks
    const BL = [...blocks.values()].filter(b => b.length >= 4);
    for (let k = 0; k < 46 && BL.length; k++){ const b = BL[Math.floor(rng()*BL.length)], r0 = b[Math.floor(rng()*b.length)], v = (Math.min(...b.map(q => q[2])) + Math.max(...b.map(q => q[2])))/2;
      const u = r0[0] + 10 + rng()*Math.max(1, r0[1] - r0[0] - 20), cx = ux*u + vx*v, cz = uz*u + vz*v; rtgCrane(B, cx, cz, ux, uz, vx, vz, 23.5); }
    // high-mast floodlights over the yard and the aprons
    const Ai = grow(A, -12);
    for (let a = -1400; a < 1400; a += 125) for (let b = -1400; b < 1400; b += 150){ const cx = ux*a + vx*b, cz = uz*a + vz*b; if (!pip(Ai, cx, cz)) continue;
      const y = Math.max(0, gy(cx, cz)); abox(B, PTS.mast, cx - 0.5, cx + 0.5, y, y + 35, cz - 0.5, cz + 0.5); obox(B, PTS.flood, cx, cz, ux, uz, 4.0, 1.4, y + 35, y + 36.4); ctx.lamp(cx, y + 36, cz, [255, 236, 200]); }
    // the terminal's sheds (OSM footprints inside the terminal, this build's heights)
    for (const [R, h] of T.sheds){ let lo = Infinity; for (const p of R) lo = Math.min(lo, gy(p[0], p[1])); prism(B, PTS.shed, R, lo - 0.5, lo + Math.min(h, 14), {top:PTS.shedR}); }
    V.flush(g); B.flush(g); return g; }}});
