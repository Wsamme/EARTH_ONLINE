
// ---- 20_loco.js ----
/* ================= walking, turning and the pose solver =================
   World: x east, y north, z up (metres). S (the mech's state) keeps X, Y, the base height Zb (smoothed ground under the stance
   feet), the compass heading hdg, the velocity (vx, vy) and two feet that live in the world: a planted foot stays exactly where it
   landed; a step lifts it and brings it down at a target ahead of where the body will be (the cadence comes from the speed: a step
   of ~1.1-2.5 s; ~20 m strides when walking at 11 m/s, ~26 m when running at 24 m/s, like a person scaled by the square root of the
   size); standing still, a foot that is off its place (after a turn) shuffles back. The pelvis rides as high as the legs reach
   (two-bone IK, knees forward), with a bob, a sway towards the stance foot and a dip on every landing. The arms take hand targets
   (model space, set by the actions in 30_combat.js; by default they swing against the legs) and solve two-bone IK with the elbow
   out and back; the head looks at a point. pose(S) fills S.Q (bone-local quaternions) and S.rootP for MK.setPose. */
const ML = (() => {
  const {BI, NB, PAR, OFF, L_TH, L_SH, L_UA, L_FA, ANK} = MK;
  // ---- small vector / quaternion helpers (arrays)
  const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsc = (a, k) => [a[0]*k, a[1]*k, a[2]*k];
  const vdot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2], vlen = a => Math.hypot(a[0], a[1], a[2]), vnorm = a => { const l = vlen(a) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
  const vcross = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
  const qmul = (a, b) => [a[3]*b[0] + a[0]*b[3] + a[1]*b[2] - a[2]*b[1], a[3]*b[1] - a[0]*b[2] + a[1]*b[3] + a[2]*b[0], a[3]*b[2] + a[0]*b[1] - a[1]*b[0] + a[2]*b[3], a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2]];
  const qinv = q => [-q[0], -q[1], -q[2], q[3]];
  const qrot = (q, v) => { const x = q[0], y = q[1], z = q[2], w = q[3], ix = w*v[0] + y*v[2] - z*v[1], iy = w*v[1] + z*v[0] - x*v[2], iz = w*v[2] + x*v[1] - y*v[0], iw = -x*v[0] - y*v[1] - z*v[2];
    return [ix*w + iw*-x + iy*-z - iz*-y, iy*w + iw*-y + iz*-x - ix*-z, iz*w + iw*-z + ix*-y - iy*-x]; };
  const qax = (ax, ay, az, a) => { const s = Math.sin(a/2); return [ax*s, ay*s, az*s, Math.cos(a/2)]; };
  const qX = a => qax(1, 0, 0, a), qY = a => qax(0, 1, 0, a), qZ = a => qax(0, 0, 1, a), QI = () => [0, 0, 0, 1];
  function qMat(m){
    const m00 = m[0], m01 = m[1], m02 = m[2], m10 = m[3], m11 = m[4], m12 = m[5], m20 = m[6], m21 = m[7], m22 = m[8], tr = m00 + m11 + m22; let x, y, z, w;
    if (tr > 0){ const s = 0.5/Math.sqrt(tr + 1); w = 0.25/s; x = (m21 - m12)*s; y = (m02 - m20)*s; z = (m10 - m01)*s; }
    else if (m00 > m11 && m00 > m22){ const s = 2*Math.sqrt(1 + m00 - m11 - m22); w = (m21 - m12)/s; x = 0.25*s; y = (m01 + m10)/s; z = (m02 + m20)/s; }
    else if (m11 > m22){ const s = 2*Math.sqrt(1 + m11 - m00 - m22); w = (m02 - m20)/s; x = (m01 + m10)/s; y = 0.25*s; z = (m12 + m21)/s; }
    else { const s = 2*Math.sqrt(1 + m22 - m00 - m11); w = (m10 - m01)/s; x = (m02 + m20)/s; y = (m12 + m21)/s; z = 0.25*s; }
    const l = Math.hypot(x, y, z, w) || 1; return [x/l, y/l, z/l, w/l];
  }
  // the rotation taking the frame (d0, pole0) to (d1, pole1)
  function qFrame(d0, p0, d1, p1){
    const a = vnorm(vsub(p0, vsc(d0, vdot(p0, d0)))), c0 = vcross(d0, a), b = vnorm(vsub(p1, vsc(d1, vdot(p1, d1)))), c1 = vcross(d1, b), m = new Array(9);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) m[i*3 + j] = d1[i]*d0[j] + b[i]*a[j] + c1[i]*c0[j];
    return qMat(m);
  }
  // two-bone IK: from H towards A with lengths L1, L2, the joint bulging towards pole -> [joint, end]
  function ik2(H, A, L1, L2, pole){
    let v = vsub(A, H), L = vlen(v); const Lmax = (L1 + L2)*0.999, Lmin = Math.abs(L1 - L2) + 0.5;
    if (L < 1e-3){ v = [0, -1, 0]; L = 1; }
    const vh = vsc(v, 1/L); L = clamp(L, Lmin, Lmax);
    const ca = clamp((L1*L1 + L*L - L2*L2)/(2*L1*L), -1, 1), sa = Math.sqrt(1 - ca*ca);
    let p = vsub(pole, vsc(vh, vdot(pole, vh))); if (vlen(p) < 1e-4) p = vcross(vh, [1, 0, 0]); p = vnorm(p);
    return [vadd(H, vadd(vsc(vh, L1*ca), vsc(p, L1*sa))), vadd(H, vsc(vh, L))];
  }
  const R_TH = vnorm(OFF[BI.shinL]), R_SH = vnorm(OFF[BI.footL]), R_THr = vnorm(OFF[BI.shinR]), R_SHr = vnorm(OFF[BI.footR]);
  const R_UA = vnorm(OFF[BI.farmL]), R_FA = vnorm(OFF[BI.handL]), R_UAr = vnorm(OFF[BI.farmR]), R_FAr = vnorm(OFF[BI.handR]);
  const HIPX = 7.5, FOOTX = 8.5, LEG = (L_TH + L_SH)*0.985;
  // ---- the state
  function newFoot(i){ return {i, x:0, y:0, z:0, yaw:0, sw:false, u:0, dur:1, ax:0, ay:0, az:0, ayaw:0, bx:0, by:0, bz:0, byaw:0, lift:0, h:0, pitch:0, lock:null}; }
  function newState(x, y, hdg){
    const S = {X:x, Y:y, Zb:gnd(x, y), hdg, hdgWant:hdg, vx:0, vy:0, spd:0, feet:[newFoot(0), newFoot(1)], next:0, stepT:9, ev:[],
      pel:{y:36, v:0, sway:0, lean:0.03, roll:0, tw:0}, twist:0, cpitch:0, look:[0, 0], arm:[null, null], open:[0, 0], wrist:[0, 0], clav:[0, 0], extra:{lean:0, roll:0, dy:0},
      Q:Array.from({length:NB}, QI), WQ:new Array(NB), WP:new Array(NB), rootP:[0, 36, 0], t:0, turn:0.9, lockFeet:false, accF:0, swingP:[0, 0]};
    for (const F of S.feet) placeFoot(S, F);
    return S;
  }
  const yawOf = hdg => PI - hdg;
  function toM(S, wx, wy, wz){ const a = yawOf(S.hdg), c = Math.cos(a), s = Math.sin(a), dx = wx - S.X, dy = wy - S.Y; return [c*dx + s*dy, wz - S.Zb, s*dx - c*dy]; }
  function toW(S, m){ const a = yawOf(S.hdg), c = Math.cos(a), s = Math.sin(a); return [S.X + c*m[0] + s*m[2], S.Y + s*m[0] - c*m[2], S.Zb + m[1]]; }
  function ideal(i, X, Y, hdg){ const s = i ? -1 : 1, a = yawOf(hdg), c = Math.cos(a), sn = Math.sin(a), mx = s*FOOTX, mz = 0.6; return [X + c*mx + sn*mz, Y + sn*mx - c*mz]; }
  function placeFoot(S, F){ const p = ideal(F.i, S.X, S.Y, S.hdg); F.x = p[0]; F.y = p[1]; F.z = gnd(p[0], p[1]); F.yaw = S.hdg; F.sw = false; F.h = 0; F.pitch = 0; }
  function startStep(S, i, Tsw, lead, turnRate){
    const F = S.feet[i], Xb = S.X + S.vx*Tsw, Yb = S.Y + S.vy*Tsw, dh = wrapA(S.hdgWant - S.hdg), hL = S.hdg + clamp(dh, -turnRate*Tsw*1.1, turnRate*Tsw*1.1);
    const p = ideal(i, Xb, Yb, hL), bx = p[0] + S.vx*lead, by = p[1] + S.vy*lead;
    F.ax = F.x; F.ay = F.y; F.az = F.z; F.ayaw = F.yaw; F.bx = bx; F.by = by; F.bz = gnd(bx, by); F.byaw = hL; F.dur = Tsw; F.u = 0; F.sw = true;
    const d = Math.hypot(bx - F.x, by - F.y); F.lift = clamp(2.2 + 0.2*d, 2.2, 8.5) + Math.max(0, F.bz - F.az)*0.6;
    F.d = d; S.ev.push({e:'lift', i, x:F.x, y:F.y, z:F.z, d});
  }
  // one step of the walk: inp {vx, vy (desired world velocity), hdg (desired heading or null), turn (rad/s)}
  function loco(S, inp, dt){
    S.t += dt; S.ev.length = 0;
    // velocity: heavy acceleration
    const ax = inp.vx - S.vx, ay = inp.vy - S.vy, al = Math.hypot(ax, ay), acc = (Math.hypot(inp.vx, inp.vy) > S.spd ? 7 : 10)*dt;
    const k = al > acc ? acc/al : 1; S.vx += ax*k; S.vy += ay*k; S.spd = Math.hypot(S.vx, S.vy);
    // heading
    if (inp.hdg !== null && inp.hdg !== undefined) S.hdgWant = inp.hdg; else if (S.spd > 1.2) S.hdgWant = Math.atan2(S.vx, S.vy);
    const tr = (inp.turn || 0.9)*dt, de = wrapA(S.hdgWant - S.hdg); S.hdg = wrapA(S.hdg + clamp(de, -tr, tr)); S.turnV = clamp(de, -tr, tr)/Math.max(dt, 1e-4);
    S.X += S.vx*dt; S.Y += S.vy*dt;
    // feet
    let anySw = false;
    for (const F of S.feet){
      if (!F.sw) continue; anySw = true;
      F.u += dt/F.dur; const u = Math.min(1, F.u), e = u*u*u*(u*(u*6 - 15) + 10);
      F.x = lerp(F.ax, F.bx, e); F.y = lerp(F.ay, F.by, e); F.h = F.lift*Math.pow(Math.sin(PI*u), 0.85); F.z = lerp(F.az, F.bz, e); F.yaw = F.ayaw + wrapA(F.byaw - F.ayaw)*e;
      F.pitch = 0.34*Math.sin(PI*clamp(u*2.2, 0, 1))*(1 - sstep(0.35, 0.55, u)) - 0.22*sstep(0.5, 0.82, u)*(1 - sstep(0.9, 1, u));
      if (F.u >= 1){ F.sw = false; F.h = 0; F.pitch = 0; F.x = F.bx; F.y = F.by; F.z = F.bz; F.yaw = F.byaw; S.ev.push({e:'land', i:F.i, x:F.x, y:F.y, z:F.z, k:clamp(0.35 + 0.035*S.spd + 0.04*(F.d || 0), 0.3, 1), water:wet(F.x, F.y)}); S.pel.v -= 1.2 + 0.09*S.spd; }
    }
    S.stepT += dt;
    if (!S.lockFeet && !S.feet.some(F => F.sw)){
      const tRate = inp.turn || 0.9;
      if (S.spd > 0.7){
        const Tst = clamp(2.5 - 0.06*S.spd, 1.1, 2.5), Tsw = Tst*0.8;
        const e1 = Math.hypot(S.feet[S.next].x - ideal(S.next, S.X, S.Y, S.hdg)[0], S.feet[S.next].y - ideal(S.next, S.X, S.Y, S.hdg)[1]);
        if (S.stepT >= Tst*(1 - 0.2*clamp((e1 - S.spd*Tst*0.7)/10, 0, 1))){ startStep(S, S.next, Tsw, Tst*0.5, tRate); S.next ^= 1; S.stepT = 0; }
      } else {
        let bi = -1, be = 0;
        for (let i = 0; i < 2; i++){ const F = S.feet[i], p = ideal(i, S.X, S.Y, S.hdgWant), e = Math.hypot(F.x - p[0], F.y - p[1]) + 9*Math.abs(wrapA(F.yaw - S.hdgWant)); if (e > be){ be = e; bi = i; } }
        if (be > 1.8 && S.stepT > 0.3){ startStep(S, bi, 1.35, 0, tRate); S.next = bi ^ 1; S.stepT = 0; }
      }
    }
    void anySw;
    // the base height follows the stance feet; the pelvis as high as the legs reach (+ bob, landing dip spring)
    let zs = 0, ns = 0; for (const F of S.feet) if (!F.sw){ zs += F.z; ns++; }
    const zt = ns ? zs/ns : (S.feet[0].z + S.feet[1].z)/2; S.Zb += (zt - S.Zb)*Math.min(1, dt*3.5);
    const a = yawOf(S.hdg), c = Math.cos(a), sn = Math.sin(a);
    let py = 36.2 + S.Zb;
    for (const F of S.feet){ const s = F.i ? -1 : 1, hx = S.X + c*s*HIPX, hy = S.Y + sn*s*HIPX, dh = Math.hypot(F.x - hx, F.y - hy), top = F.z + ANK + F.h; py = Math.min(py, top + Math.sqrt(Math.max(0, LEG*LEG - dh*dh)) + 2.0); }
    let bob = 0, sway = 0, roll = 0, tw = 0;
    for (const F of S.feet) if (F.sw){ const s = F.i ? -1 : 1, w = Math.sin(PI*Math.min(1, F.u)); bob += 0.55*w; sway += -s*0.9*w; roll += -s*0.035*w; tw += s*0.05*Math.sin(PI*Math.min(1, F.u)*2 - PI/2); }
    const target = py - S.Zb - 0.6 + bob + S.extra.dy;
    // critically damped spring for the pelvis height (landing dips through pel.v)
    const kS = 70, dS = 2*Math.sqrt(kS)*0.75; S.pel.v += (kS*(target - S.pel.y) - dS*S.pel.v)*dt; S.pel.y += S.pel.v*dt; S.pel.y = Math.min(S.pel.y, py - S.Zb + 0.4);
    const kk = Math.min(1, dt*5); S.pel.sway += (sway - S.pel.sway)*kk; S.pel.roll += (roll + S.extra.roll - S.pel.roll)*kk; S.pel.tw += (tw - S.pel.tw)*kk;
    const fwdAcc = ((S.vx - (S.pvx || 0))*Math.sin(S.hdg) + (S.vy - (S.pvy || 0))*Math.cos(S.hdg))/Math.max(dt, 1e-4); S.pvx = S.vx; S.pvy = S.vy;
    S.accF += (clamp(fwdAcc, -10, 10) - S.accF)*Math.min(1, dt*3);
    const fs = S.vx*Math.sin(S.hdg) + S.vy*Math.cos(S.hdg);
    S.pel.lean += (0.03 + 0.0055*clamp(fs, -6, 26) + 0.012*S.accF + S.extra.lean - S.pel.lean)*Math.min(1, dt*3);
    // default arms: swing against the legs (model-space foot advance), guard when running
    for (let i = 0; i < 2; i++){ const F = S.feet[i], m = toM(S, F.x, F.y, F.z); S.swingP[i] = clamp(m[2], -14, 14); }
  }
  function idleArm(S, i){
    const s = i ? -1 : 1, run = clamp((S.spd - 12)/10, 0, 1), sw = -0.42*S.swingP[i];
    return {p:[s*(16.6 + run*-2.5), 30.2 + 0.016*sw*sw + run*7.5, 1.4 + sw*(1 - 0.4*run) + run*6.5], pole:[s*0.55, -0.35, -1], wrist:0.05 + run*0.4, open:0};
  }
  // ---- the pose (model space) -> S.Q, S.rootP
  function fk(S, i, lq){ const p = PAR[i], qp = S.WQ[p]; S.Q[i] = lq; S.WQ[i] = qmul(qp, lq); S.WP[i] = vadd(S.WP[p], qrot(qp, OFF[i])); }
  function pose(S){
    const P = S.pel, WQ = S.WQ, WP = S.WP;
    WP[0] = [P.sway, P.y, 0]; S.rootP = WP[0];
    const lq0 = qmul(qY(P.tw*0.6), qmul(qX(P.lean), qZ(P.roll))); WQ[0] = lq0; S.Q[0] = lq0;
    const tw = S.twist;
    fk(S, BI.waist, qmul(qY(tw*0.35 - P.tw*0.4), qX(-P.lean*0.25)));
    fk(S, BI.chest, qmul(qY(tw*0.65 - P.tw*0.5), qX(S.cpitch - P.lean*0.2)));
    // head: look (yaw, pitch) relative to the chest, clamped
    fk(S, BI.head, qmul(qY(clamp(S.look[0], -0.9, 0.9)), qX(clamp(S.look[1], -0.5, 0.45))));
    // arms
    for (let i = 0; i < 2; i++){
      const s = i ? -1 : 1, n = i ? 'R' : 'L', A = S.arm[i] || idleArm(S, i);
      fk(S, BI['clav' + n], qmul(qZ(s*(S.clav[i] || 0)), qX(-(S.clav[i] || 0)*0.3)));
      const ua = BI['uarm' + n], fa = BI['farm' + n], ha = BI['hand' + n];
      WQ[ua] = WQ[BI['clav' + n]]; WP[ua] = vadd(WP[BI['clav' + n]], qrot(WQ[BI['clav' + n]], OFF[ua]));
      const sh = WP[ua], r = ik2(sh, A.p, L_UA, L_FA, vnorm(A.pole)), E = r[0], Wr = r[1];
      const qu = qFrame(i ? R_UAr : R_UA, [0, 0, -1], vnorm(vsub(E, sh)), vnorm(A.pole));
      S.Q[ua] = qmul(qinv(WQ[BI['clav' + n]]), qu); WQ[ua] = qu;
      const qf = qFrame(i ? R_FAr : R_FA, [0, 0, -1], vnorm(vsub(Wr, E)), vnorm(A.pole));
      S.Q[fa] = qmul(qinv(qu), qf); WQ[fa] = qf; WP[fa] = E;
      fk(S, ha, qmul(qX(-(A.wrist || 0)), qZ(s*(A.roll || 0))));
      const op = clamp(A.open || 0, 0, 1);
      fk(S, BI['fing' + n], qZ(s*op*1.25)); fk(S, BI['thumb' + n], qmul(qZ(-s*op*0.5), qX(-op*0.5)));
    }
    // legs: IK to the feet (ankle above the foot's ground point, lifted while it swings)
    for (let i = 0; i < 2; i++){
      const s = i ? -1 : 1, n = i ? 'R' : 'L', F = S.feet[i], th = BI['thigh' + n], sh = BI['shin' + n], ft = BI['foot' + n], to = BI['toe' + n];
      WQ[th] = WQ[0]; WP[th] = vadd(WP[0], qrot(WQ[0], OFF[th]));
      const H = WP[th], am = toM(S, F.x, F.y, F.z + ANK + F.h), dyaw = wrapA(F.yaw - S.hdg);
      const pole = [s*0.12 + Math.sin(-dyaw)*0.9, 0.05, Math.cos(-dyaw)];
      const r = ik2(H, am, L_TH, L_SH, pole), K = r[0], A = r[1];
      const qt = qFrame(i ? R_THr : R_TH, [0, 0, 1], vnorm(vsub(K, H)), pole); S.Q[th] = qmul(qinv(WQ[0]), qt); WQ[th] = qt; WP[sh] = K;
      const qs = qFrame(i ? R_SHr : R_SH, [0, 0, 1], vnorm(vsub(A, K)), pole); S.Q[sh] = qmul(qinv(qt), qs); WQ[sh] = qs; WP[ft] = A;
      // the foot: its own yaw, the step's pitch, the slope under a planted foot
      let pitch = F.pitch;
      if (!F.sw){ const fx = Math.sin(F.yaw), fy = Math.cos(F.yaw), gT = gnd(F.x + fx*7, F.y + fy*7), gH = gnd(F.x - fx*6, F.y - fy*6); pitch += clamp(Math.atan2(gH - gT, 13), -0.3, 0.3); }
      const qfw = qmul(qY(-dyaw), qX(pitch)); S.Q[ft] = qmul(qinv(qs), qfw); WQ[ft] = qfw;
      S.Q[to] = qX(-Math.max(0, F.pitch)*0.9); WQ[to] = qmul(qfw, S.Q[to]);
    }
    return S;
  }
  // model-space -> world helpers for the bones of the last pose (rest-space point p on bone b)
  function boneM(S, b, p){ return vadd(S.WP[b], qrot(S.WQ[b], vsub(p, MK.REST[b]))); }
  return {newState, loco, pose, toM, toW, ideal, placeFoot, idleArm, boneM, ik2, qmul, qrot, qX, qY, qZ, vnorm, vsub, vadd, vsc, vlen, vdot, HIPX, FOOTX, LEG};
})();
