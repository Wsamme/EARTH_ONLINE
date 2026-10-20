// ===== City Brush v28 · lm25/kaiju — 克苏鲁模式 · Cthulhu mode (a colossal creature hunts you through the city) =====
// The creature: an original design from H. P. Lovecraft's 1928 description only (an octopus-like head whose face is a mass of feelers,
// a scaly, rubbery, vaguely anthropoid body, prodigious claws on hind and fore feet, long narrow wings behind); ~325 m to the crown,
// 116 bones, lofted and skinned procedurally (LOD 0 ~42 k triangles, LOD 1 ~9 k, LOD 2 ~3 k; one material, one draw call + shadow).
// Heavy, slow steps (8-13 m/s, bursts to 16-27 m/s by difficulty) that shake the camera; feelers and two 320 m seizing tentacles
// writhe; the wings half open; the eyes burn at night; it streams water when it rises from the sea and wades in the harbour.
// The mode (its own dock tab 克苏鲁 Cthulhu: one-click single-player Play now; a shortcut in the drive pane; #cthulhu in the URL starts it): the sky turns a sick green, a storm (window.SGWx), sirens and a roar
// (own synthesis on window.SGAudio's context, 'fx' group), the creature rises from the water nearest the player and hunts the
// car (window.SGF1), the aircraft (window.SGFly) or the view: it leads its target, slams and sweeps with tentacles and claws, and a
// grab = caught (it lifts the car to its face; the result card). Goals: survive N minutes or reach the extraction point
// (airports / bridges out of the city). Buildings near its feet, legs, body, hands and lashing tentacles collapse (the bld.js work copy
// lm25/kaiju/bld.js does it in the vertex shader; debris and dust here); traffic is thrown aside; landmarks throw up dust.
// Contract (multiplayer): window.SGKaiju {start, stop, on, state, applyState, setTargets, onDestroy, destroy, onCatch, status} - see 60_api.
// v30 - more creatures (lm27/kaiju2): four new original species next to it, picked in the tab (怪兽 Creature, with 随机 Random) or with
// start({species}): 北海巨妖 Kraken (a cephalopod that heaves itself along on eight arms, wraps towers and hauls them over, inks the
// harbour), 铁甲巨蟹 Ironclad Crab (scuttles sideways fast, claws pinch through towers, legs stab down), 深海巨蛇 Sea Serpent (700 m; swims in
// humps, slithers in waves, coils a tower and crushes it, sweeps its tail) and 修格斯 Shoggoth (from Lovecraft's 1936 text: a boiling
// mass of iridescent bubbles forming and dissolving eyes and pseudopods, a vertex-shader soft body that engulfs buildings). Each has
// its own pure core (11_spcore + 12-15: skeleton / pose solver / hunter / snapshots with sp), model (21_skin + 22-25), sounds and
// effects (26_spfx); destroyed entries carry fx, fy, e (impact direction and energy) for the collapse.
// v31 (lm28/kaiju3): a calm camera shake (smoothed low-frequency noise, mostly rotation, capped, distance falloff, much less in the
// car; 克苏鲁 tab: 镜头震动 off / low / medium), survive 10:00 on every difficulty, two new creatures - 巨蜥兽 Titan Lizard (a low-slung
// armoured four-legged reptile: bites, charges, rolls over blocks, whips its tail, swims) and 飞龙 Wyvern (a heraldic two-legged
// dragon that flies: circles, dives and snatches the car with its talons, beats its wings over the roofs, lands on towers that
// crumble under it, hunts aircraft) -, the catch rework (no proximity catch: only a grabbing part touching the car in a telegraphed
// strike; the feet, legs, tail and low body are solid through SGF1.obstacles: drive between the legs, under the belly; a foot coming
// down on the car crushes it; sweeps throw it; near misses; the striking jaws / claws close on their aim point - the crab's claw
// from above when close, the serpent's and the lizard's heads corrected from their last miss) and the army hooks (hinder, body,
// attacks on SGArmy units).
// v33 (lm30/kaiju5): on-screen text off (T, the HUD's Aa, the tab), an always-visible 退出 Quit (Esc with a confirm: stop, restore the
// city, leave the car), the escape mission through 4-6 checkpoints on real roads (beacons, rings, the HUD arrow, SGNav destination and
// markers), the creature cutting the player off on the route ahead (18_block.js: block points, waiting at junctions, crossing the road,
// a tower toppled onto it; the flyer swoops in from ahead), a difficulty ramp per checkpoint.
// Integration: lm25/kaiju/kaiju.js is built from src/*.js (lm25/kaiju/mk.sh; v31: lm28/kaiju3/mk.sh lists the new files in order).
{

// ---- 10_core.js ----
//<CORE>
/* ================= the creature's core: skeleton, pose solver, hunter AI, state snapshots (pure JS, no THREE: node-testable) =================
   Units: metres, seconds. World: x east, y north, z up (the app's world x, y and height). Model space (the creature's own frame):
   x = its left, y = up, z = forward, origin on the ground between the feet. The world transform is a turn about the vertical by
   (pi - hdg) (hdg = compass heading, 0 north, pi/2 east) and a lift by z (the ground under the creature, lower while it wades or rises).
   Every bone's rest orientation is the identity in model space: a bone is its joint position p and its rotation q relative to rest;
   its skinning matrix is T(p) R(q) T(-rest).  pose(P, env, O) is a pure function of the pose state P = {t, x, y, z, hdg, g, v, k, p,
   ax, ay, az, w, r, ly} (+ the terrain under the feet), so a mirror that receives the host's states draws the very same creature. */
const KC = (() => {
  const PI = Math.PI, TAU = PI*2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a)*t;
  const sstep = (a, b, x) => { const t = clamp((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t); };
  const wrapA = a => { a = (a + PI) % TAU; if (a < 0) a += TAU; return a - PI; };
  // ---- vectors [x, y, z] and quaternions [x, y, z, w] (small arrays; the pose solver reuses its own)
  const v3 = (x, y, z) => [x, y, z];
  const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const vsc = (a, k) => [a[0]*k, a[1]*k, a[2]*k], vdot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const vcross = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
  const vlen = a => Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]), vnorm = a => { const l = vlen(a) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
  const vlerp = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, a[2] + (b[2] - a[2])*t];
  const qmul = (a, b) => [a[3]*b[0] + a[0]*b[3] + a[1]*b[2] - a[2]*b[1], a[3]*b[1] - a[0]*b[2] + a[1]*b[3] + a[2]*b[0], a[3]*b[2] + a[0]*b[1] - a[1]*b[0] + a[2]*b[3], a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2]];
  const qrot = (q, v) => { const x = q[0], y = q[1], z = q[2], w = q[3], ix = w*v[0] + y*v[2] - z*v[1], iy = w*v[1] + z*v[0] - x*v[2], iz = w*v[2] + x*v[1] - y*v[0], iw = -x*v[0] - y*v[1] - z*v[2];
    return [ix*w + iw*-x + iy*-z - iz*-y, iy*w + iw*-y + iz*-x - ix*-z, iz*w + iw*-z + ix*-y - iy*-x]; };
  const qax = (ax, ay, az, a) => { const s = Math.sin(a/2); return [ax*s, ay*s, az*s, Math.cos(a/2)]; };
  const qX = a => qax(1, 0, 0, a), qY = a => qax(0, 1, 0, a), qZ = a => qax(0, 0, 1, a);
  const QI = () => [0, 0, 0, 1];
  function qUnit(a, b){   // shortest rotation taking unit a to unit b
    let r = vdot(a, b) + 1, q;
    if (r < 1e-6){ r = 0; q = Math.abs(a[0]) > Math.abs(a[2]) ? [-a[1], a[0], 0, r] : [0, -a[2], a[1], r]; }
    else q = [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0], r];
    const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0]/l, q[1]/l, q[2]/l, q[3]/l];
  }
  function qMat(m){        // rotation matrix (row-major 3x3) to quaternion
    const m00 = m[0], m01 = m[1], m02 = m[2], m10 = m[3], m11 = m[4], m12 = m[5], m20 = m[6], m21 = m[7], m22 = m[8], tr = m00 + m11 + m22; let x, y, z, w;
    if (tr > 0){ const s = 0.5/Math.sqrt(tr + 1); w = 0.25/s; x = (m21 - m12)*s; y = (m02 - m20)*s; z = (m10 - m01)*s; }
    else if (m00 > m11 && m00 > m22){ const s = 2*Math.sqrt(1 + m00 - m11 - m22); w = (m21 - m12)/s; x = 0.25*s; y = (m01 + m10)/s; z = (m02 + m20)/s; }
    else if (m11 > m22){ const s = 2*Math.sqrt(1 + m11 - m00 - m22); w = (m02 - m20)/s; x = (m01 + m10)/s; y = 0.25*s; z = (m12 + m21)/s; }
    else { const s = 2*Math.sqrt(1 + m22 - m00 - m11); w = (m10 - m01)/s; x = (m02 + m20)/s; y = (m12 + m21)/s; z = 0.25*s; }
    const l = Math.hypot(x, y, z, w) || 1; return [x/l, y/l, z/l, w/l];
  }
  // rotate unit a towards unit b by the fraction w of the angle between them (continuous for large angles, unlike a normalised lerp)
  function slerpDir(a, b, w){
    if (w <= 0) return a; if (w >= 1) return b;
    const c = clamp(vdot(a, b), -1, 1); let ax = vcross(a, b), l = vlen(ax);
    if (l < 1e-6){ if (c > 0) return a; ax = vcross(a, Math.abs(a[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]); l = vlen(ax); }
    const ang = Math.atan2(l, c)*w; return qrot(qax(ax[0]/l, ax[1]/l, ax[2]/l, ang), a);
  }
  // the rotation taking the frame (d0, pole0) to (d1, pole1) (directions unit; poles made perpendicular here)
  function qFrame(d0, p0, d1, p1){
    const a = vnorm(vsub(p0, vsc(d0, vdot(p0, d0)))), c0 = vcross(d0, a), b = vnorm(vsub(p1, vsc(d1, vdot(p1, d1)))), c1 = vcross(d1, b);
    const m = new Array(9);   // R = B1 * B0^T, B = [d pole c] as columns
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) m[i*3 + j] = d1[i]*d0[j] + b[i]*a[j] + c1[i]*c0[j];
    return qMat(m);
  }

  // ---------------- the skeleton (rest joints in model space, metres) ----------------
  // ~300 m to the crown of the head; legs 124 m; arms reach the knees; long narrow wings half open (~240 m span); a beard of
  // twelve feelers (60-94 m) and two very long seizing tentacles (320 m, 12 bones each) under the octopus head.
  const BN = [], BI = {};
  function bone(name, parent, x, y, z){ BI[name] = BN.length; BN.push({name, parent:parent === null ? -1 : BI[parent], rest:[x, y, z]}); return BN.length - 1; }
  // HY: everything above the hips sits HY metres higher than the first draft (longer legs: hips at ~130 m, crown at ~325 m)
  const HY = 18;
  bone('root', null, 0, 118 + HY, 0); bone('sp1', 'root', 0, 140 + HY, 3); bone('sp2', 'sp1', 0, 164 + HY, 8); bone('chest', 'sp2', 0, 190 + HY, 14); bone('neck', 'chest', 0, 214 + HY, 22); bone('head', 'neck', 0, 228 + HY, 32);
  const SIDES = [[1, 'L'], [-1, 'R']];
  for (const [s, n] of SIDES){ bone('clav' + n, 'chest', s*12, 210 + HY, 16); bone('uarm' + n, 'clav' + n, s*40, 208 + HY, 12); bone('farm' + n, 'uarm' + n, s*56, 156 + HY, 16); bone('hand' + n, 'farm' + n, s*62, 106 + HY, 28); bone('claw' + n, 'hand' + n, s*64, 88 + HY, 36); }
  for (const [s, n] of SIDES){ bone('thigh' + n, 'root', s*26, 130, -2); bone('shin' + n, 'thigh' + n, s*30, 70, 14); bone('foot' + n, 'shin' + n, s*30, 13, -6); bone('toes' + n, 'foot' + n, s*30, 4, 22); }
  for (const [s, n] of SIDES){ bone('wroot' + n, 'chest', s*16, 198 + HY, -22); bone('warm' + n, 'wroot' + n, s*46, 236 + HY, -44); bone('wf1' + n, 'warm' + n, s*74, 262 + HY, -58); bone('wf2' + n, 'warm' + n, s*74, 262 + HY, -58); }
  // the wing's outline (rest, left side; x mirrored for the right): leading edge root-elbow-wrist-finger tip, trailing via the second finger
  const WING = {root:[16, 198 + HY, -22], elbow:[46, 236 + HY, -44], wrist:[74, 262 + HY, -58], tip1:[122, 316 + HY, -72], tip2:[104, 214 + HY, -82], body:[16, 150 + HY, -26]};
  // feelers: the face's beard, two rows; each 5 bones
  const FEEL = [];
  for (const x of [-18, -12, -6, 0, 6, 12, 18]) FEEL.push({base:[x, 220 + HY - 0.03*x*x, 55 - 0.12*Math.abs(x)], len:96 - 0.07*x*x, r0:6.6 - 0.04*Math.abs(x), row:0});
  for (const x of [-15, -8, 0, 8, 15]) FEEL.push({base:[x, 229 + HY - 0.03*x*x, 51 - 0.1*Math.abs(x)], len:72 - 0.05*x*x, r0:5.2, row:1});
  const NFS = 5;
  FEEL.forEach((F, i) => { F.dir = vnorm([F.base[0]*0.012, -1, 0.14]); F.ph = i*2.399; F.b = [];
    for (let k = 0; k < NFS; k++){ const p = vadd(F.base, vsc(F.dir, F.len*k/NFS)); F.b.push(bone('f' + i + '_' + k, k ? 'f' + i + '_' + (k - 1) : 'head', p[0], p[1], p[2])); } });
  // the two seizing tentacles
  const NTS = 12, TLEN = 320, TENT = [];
  for (const [s, n] of SIDES){ const T = {s, base:[s*6, 216 + HY, 53], len:TLEN, r0:9.5, b:[]}; T.dir = vnorm([s*0.02, -1, 0.06]);
    for (let k = 0; k < NTS; k++){ const p = vadd(T.base, vsc(T.dir, TLEN*k/NTS)); T.b.push(bone('t' + n + '_' + k, k ? 't' + n + '_' + (k - 1) : 'head', p[0], p[1], p[2])); }
    TENT.push(T); }
  const NB = BN.length;
  const EYES = [[17, 242 + HY, 57], [-17, 242 + HY, 57]];

  // ---------------- the pose solver ----------------
  // gait: one cycle = two steps over S metres (longer strides when faster); a foot is planted for BETA of the cycle and slides
  // back under the body at the walking speed (so it stays put on the ground), then swings forward in an arc
  const BETA = 0.6, strideOf = v => 75 + 3.2*Math.max(0, v);
  const L_THIGH = vlen(vsub(BN[BI.shinL].rest, BN[BI.thighL].rest)), L_SHIN = vlen(vsub(BN[BI.footL].rest, BN[BI.shinL].rest));
  // the actions (k): 0 none, 1 / 2 tentacle slam (left / right), 3 / 4 claw sweep (left / right arm), 5 grab (left tentacle),
  // 6 roar, 7 hold the catch (left tentacle lifts it to the face), 8 swat at an aircraft (both arms up), v31: 9 stomp (a foot raised
  // high and brought down on a car between its feet: az's sign picks the foot, + left)
  const ACT_DUR = [0, 3.8, 3.8, 3.2, 3.2, 3.6, 3.6, 4.5, 2.8, 3.4];
  const HIT_P = {1:0.5, 2:0.5, 3:0.5, 4:0.5, 5:0.52, 8:0.5, 9:0.56};
  function mkOut(){ return {p:new Float32Array(NB*3), q:new Float32Array(NB*4), M:new Float32Array(NB*16), tip:[[0, 0, 0], [0, 0, 0]], eye:[[0, 0, 0], [0, 0, 0]], feet:[{}, {}], hands:[[0, 0, 0], [0, 0, 0]], W:{x:0, y:0, z:0, c:1, s:0}}; }
  function pose(P, env, O){
    O = O || mkOut();
    const t = P.t, v = Math.max(0, P.v || 0), A = clamp(v/3, 0, 1), S = strideOf(v), k = P.k | 0, pr = P.p || 0, w = P.w === undefined ? 0.5 : P.w;
    const ya = PI - P.hdg, cy = Math.cos(ya), sy = Math.sin(ya);
    O.W.x = P.x; O.W.y = P.y; O.W.z = P.z; O.W.c = cy; O.W.s = sy; O.W.a = ya;
    const toW = (m) => [P.x + cy*m[0] + sy*m[2], P.y + sy*m[0] - cy*m[2], P.z + m[1]];
    const toM = (wx, wy, wz) => { const dx = wx - P.x, dy = wy - P.y; return [cy*dx + sy*dy, wz - P.z, sy*dx - cy*dy]; };
    const pp = new Array(NB), qq = new Array(NB);
    const fk = (i, ql) => { const b = BN[i], pa = b.parent, qp = qq[pa]; qq[i] = qmul(qp, ql); pp[i] = vadd(pp[pa], qrot(qp, vsub(b.rest, BN[pa].rest))); };
    // action envelopes
    const a = k ? pr : 0, roar = k === 6 ? sstep(0, 0.15, pr)*(1 - sstep(0.8, 1, pr)) : 0;
    const slamLean = (k === 1 || k === 2 || k === 5) ? 0.22*Math.sin(PI*clamp(a*1.6, 0, 1)) : 0;
    const swat = k === 8 ? Math.sin(PI*pr) : 0;
    // ---- feet (model space) and the ground under them
    const feet = O.feet;
    for (let i = 0; i < 2; i++){
      const s = i ? -1 : 1, ph = ((P.g || 0) + (i ? 0.5 : 0)) % 1; let fz, lift, pitch;
      if (ph < BETA){ const u = ph/BETA; fz = BETA*S*(0.5 - u); lift = 0; pitch = 0; }
      else { const u = (ph - BETA)/(1 - BETA), e = u*u*(3 - 2*u); fz = BETA*S*(-0.5 + e); lift = (14 + 0.2*S)*Math.sin(PI*u); pitch = -0.55*Math.sin(PI*Math.min(1, u*1.25)) + 0.25*sstep(0.6, 1, u); }
      fz *= A; lift *= A; pitch *= A;
      const mx = s*29, mz = fz + 8, wpos = toW([mx, 0, mz]), gy = env.ground(wpos[0], wpos[1]) - P.z;
      const F = feet[i]; F.s = s; F.ph = ph; F.stance = ph < BETA; F.gy = gy; F.lift = lift; F.pitch = pitch; F.m = [mx, gy + 13 + lift, mz - 14]; F.wx = wpos[0]; F.wy = wpos[1]; F.skip = false;
      // v31: the stomp - the foot lifts ~50 m, swings over the aim point (within the leg's reach of the hip), comes down hard, stays
      // planted, and goes back to its stride at the end
      if (k === 9 && i === ((P.az || 0) >= 0 ? 0 : 1)){
        const E = toM(P.ax, P.ay, 0), u1 = sstep(0, 0.42, pr), u2 = sstep(0.44, 0.56, pr), back = sstep(0.82, 1, pr);
        let ex = E[0], ez = E[2] - 12; const hx = s*26, dx = ex - hx, dz = ez + 2, dl = Math.hypot(dx, dz); if (dl > 78){ ex = hx + dx*78/dl; ez = -2 + dz*78/dl; }
        const ew = toW([ex, 0, ez + 14]), gyE = env.ground(ew[0], ew[1]) - P.z, ty = lerp(gy, gyE, u1) + 13 + 52*u1*(1 - u2);
        F.m = vlerp([lerp(mx, ex, u1), ty, lerp(mz - 14, ez, u1)], F.m, back); F.pitch = lerp(-0.45*u1*(1 - u2), pitch, back); F.stance = u2 > 0.99 && back < 0.5; F.skip = true; F.gy = lerp(gyE, gy, back);
      }
    }
    // ---- pelvis
    const bob = -5*Math.cos(4*PI*(P.g || 0))*A, sway = 3.5*Math.sin(TAU*(P.g || 0))*A;
    const gA = (feet[0].gy + feet[1].gy)/2, gM = Math.min(feet[0].gy, feet[1].gy);
    const lean = 0.05 + 0.009*Math.min(v, 26) + slamLean - 0.16*roar + 0.1*swat*0, twist = 0.06*Math.sin(TAU*(P.g || 0))*A;
    pp[0] = [sway, 128 + HY*0 + bob + clamp(Math.min(gA, gM + 8), -60, 40), 0];
    qq[0] = qmul(qmul(qY(twist), qX(lean)), qZ(0.035*Math.sin(TAU*(P.g || 0))*A));
    // ---- spine, neck, head (look at ly, level the gaze against the lean)
    const br = 0.02*Math.sin(t*0.55), ly = clamp(P.ly || 0, -0.9, 0.9);
    fk(BI.sp1, qmul(qX(0.02 + slamLean*0.3), qY(-twist*0.5)));
    fk(BI.sp2, qX(0.03 + br));
    fk(BI.chest, qmul(qX(0.03 + slamLean*0.25 - 0.08*roar), qY(-twist*0.6)));
    fk(BI.neck, qmul(qY(ly*0.4), qX(-lean*0.45 - 0.1*roar)));
    fk(BI.head, qmul(qY(ly*0.6), qX(-lean*0.35 - 0.38*roar + 0.12*slamLean + 0.05*Math.sin(t*0.37) - 0.25*swat)));
    // ---- arms (FK): swing against the legs; claw sweeps, roar, swat
    for (let i = 0; i < 2; i++){
      const s = i ? -1 : 1, n = i ? 'R' : 'L';
      let sw = 0.26*Math.sin(TAU*((P.g || 0) + (i ? 0 : 0.5)))*A, abd = 0.16, yaw = 0, bend = 0.5, grip = 0.25, shr = 0;
      // claw sweep with the arm on side k=3 (left) / 4 (right): wind up out to the side, then across in front through the towers
      if ((k === 3 && s > 0) || (k === 4 && s < 0)){
        const u = pr, up = sstep(0, 0.35, u)*(1 - sstep(0.8, 1, u)), acr = sstep(0.38, 0.62, u);
        sw += up*1.15; abd += up*(1.1 - 1.5*acr); yaw = s*up*(0.5 - 1.3*acr); bend = lerp(bend, 0.2, up); grip = lerp(grip, -0.2*(1 - acr) + 0.6*acr, up);
      }
      if (roar){ abd += roar*1.05; sw += roar*0.55; bend = lerp(bend, 1.1, roar); grip = lerp(grip, -0.35, roar); shr = roar*0.12; }
      if (swat){ sw += swat*1.9; abd += swat*0.35; bend = lerp(bend, 0.35, swat); grip = lerp(grip, -0.3, swat*(1 - sstep(0.45, 0.6, pr))) + 0.8*sstep(0.45, 0.6, pr)*swat; }
      if (k === 7 && s > 0){ const u = sstep(0.2, 0.6, pr)*(1 - sstep(0.85, 1, pr)); sw += u*0.9; abd += u*0.3; bend = lerp(bend, 1.3, u); }
      fk(BI['clav' + n], qZ(s*shr));
      fk(BI['uarm' + n], qmul(qmul(qY(yaw), qZ(s*abd)), qX(-sw)));
      fk(BI['farm' + n], qX(-bend));
      fk(BI['hand' + n], qX(-0.15 - 0.1*Math.sin(t*0.8 + s)));
      fk(BI['claw' + n], qX(-grip));
      const c = pp[BI['claw' + n]], cq = qq[BI['claw' + n]], tipM = vadd(c, qrot(cq, [s*2, -24, 14]));
      O.hands[i] = toW(tipM);
    }
    // ---- legs (two-bone IK to the planted / swinging ankles)
    for (let i = 0; i < 2; i++){
      const F = feet[i], n = i ? 'R' : 'L', th = BI['thigh' + n], sh = BI['shin' + n], ft = BI['foot' + n], to = BI['toes' + n];
      qq[th] = qq[0]; pp[th] = vadd(pp[0], qrot(qq[0], vsub(BN[th].rest, BN[0].rest)));
      const H = pp[th], T = F.m, d = vsub(T, H); let dist = vlen(d); const dn = vsc(d, 1/(dist || 1));
      dist = clamp(dist, Math.abs(L_THIGH - L_SHIN) + 1, L_THIGH + L_SHIN - 0.3);
      const a1 = (L_THIGH*L_THIGH - L_SHIN*L_SHIN + dist*dist)/(2*dist), h1 = Math.sqrt(Math.max(0, L_THIGH*L_THIGH - a1*a1));
      const pole0 = qrot(qq[0], [F.s*0.12, 0, 1]), pl = vnorm(vsub(pole0, vsc(dn, vdot(pole0, dn))));
      const K = vadd(vadd(H, vsc(dn, a1)), vsc(pl, h1)), An = vadd(H, vsc(dn, dist));
      const rT = BN[th].rest, rS = BN[sh].rest, rF = BN[ft].rest;
      qq[th] = qFrame(vnorm(vsub(rS, rT)), [0, 0, 1], vnorm(vsub(K, H)), pl);
      pp[sh] = K; qq[sh] = qFrame(vnorm(vsub(rF, rS)), [0, 0, 1], vnorm(vsub(An, K)), pl);
      pp[ft] = An; qq[ft] = qmul(qY(twist*0.5), qX(F.pitch));
      fk(to, qX(-F.pitch*0.8 + (F.stance ? 0.05 : -0.15)));
      F.ankle = toW(An); F.knee = toW(K); F.hip = toW(H); F.toe = toW(vadd(pp[to], qrot(qq[to], [0, -3, 22])));
    }
    // ---- wings: w 0 folded against the back, 0.5 half open (rest), 1 spread
    for (let i = 0; i < 2; i++){
      const s = i ? -1 : 1, n = i ? 'R' : 'L', o = w - 0.5, fl = 0.035*Math.sin(t*0.9 + s) + 0.05*roar*Math.sin(t*3.1);
      fk(BI['wroot' + n], qmul(qZ(-s*(o*1.15 + fl)), qX(-o*0.35 + 0.15*swat)));
      fk(BI['warm' + n], qmul(qZ(-s*o*0.55), qY(s*o*0.35)));
      fk(BI['wf1' + n], qZ(-s*(o*0.3 + fl*0.5)));
      fk(BI['wf2' + n], qmul(qZ(s*o*0.45), qX(o*0.25)));
    }
    // ---- the feelers (FK: travelling curl waves; they trail when it strides, flare when it roars)
    const trail = 0.012*Math.min(v, 25);
    FEEL.forEach((F, fi) => {
      for (let j = 0; j < NFS; j++){
        const bi = F.b[j], ax = 0.2*Math.sin(1.35*t + j*0.85 + F.ph) + 0.07*j*(F.row ? 1.2 : 0.8) - trail*(j ? 0.4 : 1) - roar*(j ? 0.1 : 0.55);
        const az = 0.16*Math.sin(1.05*t + j*0.7 + 2*F.ph) + (j ? 0 : F.base[0]*(0.004 + roar*0.03));
        fk(bi, qmul(qX(ax), qZ(az)));
      }
    });
    // ---- the seizing tentacles: an idle coil (FK), blended towards a strike / grab / hold curve
    for (let i = 0; i < 2; i++){
      const T = TENT[i], s = T.s, seg = T.len/NTS;
      // idle: hanging straight from the face, then hooked forward and up (a J held ready to strike), slowly writhing
      for (let j = 0; j < NTS; j++){
        const ax = j === 0 ? -0.1 + 0.05*Math.sin(0.5*t + s) - 0.3*roar : j < 7 ? 0.035*Math.sin(0.7*t + j*0.6 + s) : -0.62 + 0.12*Math.sin(1.1*t + j*0.7 + 2*s) + 0.25*roar;
        const az = j === 0 ? s*(0.15 + 0.2*roar) : s*0.04*Math.sin(0.6*t + j*0.5 + 1.7*s);
        fk(T.b[j], qmul(qX(ax), qZ(az)));
      }
      // which action drives this tentacle
      const mine = ((k === 1 || k === 5 || k === 7) && s > 0) || (k === 2 && s < 0);
      if (!mine){ O.tip[i] = toW(vadd(pp[T.b[NTS - 1]], qrot(qq[T.b[NTS - 1]], vsc(T.dir, seg)))); continue; }
      const B = pp[T.b[0]], E0 = toM(P.ax, P.ay, P.az);
      let E, wgt, coil = 0;
      const wind = vadd(B, [s*40, 110, -70]);
      if (k === 7){ const face = [s*4, 205 + HY, 115]; E = vlerp(E0, face, sstep(0.05, 0.7, pr)); wgt = 1 - sstep(0.8, 1, pr); coil = sstep(0, 0.06, pr); }
      else {
        const hp = HIT_P[k];
        if (pr < 0.28){ const u = sstep(0, 0.28, pr); E = wind; wgt = u; }
        else if (pr < hp){ const u = Math.pow(clamp((pr - 0.28)/(hp - 0.28), 0, 1), 1.6); E = vlerp(wind, E0, u); E[1] += Math.sin(PI*u)*40; wgt = 1; }
        else if (pr < 0.72){ E = E0; wgt = 1; coil = k === 5 ? sstep(hp, hp + 0.08, pr) : 0; }
        else { const u = sstep(0.72, 1, pr); E = vlerp(E0, wind, u*0.5); wgt = 1 - u; coil = k === 5 ? 1 - u : 0; }
      }
      // reach: the tip stops short of a point beyond the tentacle's length
      let dE = vsub(E, B), lE = vlen(dE); if (lE > T.len*0.96){ E = vadd(B, vsc(dE, T.len*0.96/lE)); dE = vsub(E, B); lE = T.len*0.96; }
      // a quadratic curve B -> C -> E whose length is the tentacle's (C lifted above the middle; bisection on the lift)
      const mid = vlerp(B, E, 0.5); let lo = 0, hi = T.len, C = mid;
      const cLen = c => { let L = 0, q = B; for (let u = 1; u <= 32; u++){ const tt = u/32, r = vadd(vadd(vsc(B, (1 - tt)*(1 - tt)), vsc(c, 2*tt*(1 - tt))), vsc(E, tt*tt)); L += vlen(vsub(r, q)); q = r; } return L; };
      for (let it = 0; it < 14; it++){ const h = (lo + hi)/2; C = vadd(mid, [0, h, 12]); if (cLen(C) > T.len) hi = h; else lo = h; }
      C = vadd(mid, [0, lo, 12]);
      // sample the curve at equal arc lengths -> segment directions
      // (steps of the curve's own length / NTS, so the tip lands on E even where the length solve is a little off)
      const N = 96, Lc = (() => { let L = 0, q = B; for (let u = 1; u <= N; u++){ const tt = u/N, r = vadd(vadd(vsc(B, (1 - tt)*(1 - tt)), vsc(C, 2*tt*(1 - tt))), vsc(E, tt*tt)); L += vlen(vsub(r, q)); q = r; } return L; })(), segC = Lc/NTS;
      const pts = [B]; { let acc = 0, q = B, want = segC; for (let u = 1; u <= N && pts.length < NTS + 1; u++){ const tt = u/N, r = vadd(vadd(vsc(B, (1 - tt)*(1 - tt)), vsc(C, 2*tt*(1 - tt))), vsc(E, tt*tt)), dl = vlen(vsub(r, q)); acc += dl; q = r; while (acc >= want - 1e-6 && pts.length < NTS + 1){ pts.push(r); want += segC; } } while (pts.length < NTS + 1) pts.push(E); }
      let qPrev = null, pPrev = B;
      for (let j = 0; j < NTS; j++){
        const bi = T.b[j], dIdle = qrot(qq[bi], T.dir);
        let dS = vnorm(vsub(pts[j + 1], pts[j]));
        if (coil && j >= NTS - 3){ const cj = (j - (NTS - 4))*0.6*coil, ax = vnorm(vcross(dS, [0, 1, 0])); dS = qrot(qax(ax[0], ax[1], ax[2], cj), dS); }
        const d = slerpDir(dIdle, dS, wgt);
        const qn = j === 0 ? qmul(qUnit(dIdle, d), qq[bi]) : qmul(qUnit(qrot(qPrev, T.dir), d), qPrev);
        pp[bi] = pPrev; qq[bi] = qn; pPrev = vadd(pPrev, vsc(d, seg)); qPrev = qn;
      }
      O.tip[i] = toW(pPrev); if (i === 0) O.hold = toW(pp[T.b[NTS - 2]]);
    }
    // ---- outputs: joints, rotations, skinning matrices
    for (let i = 0; i < NB; i++){
      const p = pp[i], q = qq[i], r = BN[i].rest, o3 = i*3, o4 = i*4, o16 = i*16;
      O.p[o3] = p[0]; O.p[o3 + 1] = p[1]; O.p[o3 + 2] = p[2]; O.q[o4] = q[0]; O.q[o4 + 1] = q[1]; O.q[o4 + 2] = q[2]; O.q[o4 + 3] = q[3];
      const x = q[0], y = q[1], z = q[2], ww = q[3], x2 = x + x, y2 = y + y, z2 = z + z, xx = x*x2, xy = x*y2, xz = x*z2, yy = y*y2, yz = y*z2, zz = z*z2, wx = ww*x2, wy = ww*y2, wz = ww*z2;
      const m00 = 1 - (yy + zz), m01 = xy - wz, m02 = xz + wy, m10 = xy + wz, m11 = 1 - (xx + zz), m12 = yz - wx, m20 = xz - wy, m21 = yz + wx, m22 = 1 - (xx + yy);
      const M = O.M; M[o16] = m00; M[o16 + 1] = m10; M[o16 + 2] = m20; M[o16 + 3] = 0; M[o16 + 4] = m01; M[o16 + 5] = m11; M[o16 + 6] = m21; M[o16 + 7] = 0;
      M[o16 + 8] = m02; M[o16 + 9] = m12; M[o16 + 10] = m22; M[o16 + 11] = 0;
      M[o16 + 12] = p[0] - (m00*r[0] + m01*r[1] + m02*r[2]); M[o16 + 13] = p[1] - (m10*r[0] + m11*r[1] + m12*r[2]); M[o16 + 14] = p[2] - (m20*r[0] + m21*r[1] + m22*r[2]); M[o16 + 15] = 1;
    }
    for (let i = 0; i < 2; i++){ const e = EYES[i], hi = BI.head; O.eye[i] = toW(vadd(pp[hi], qrot(qq[hi], vsub(e, BN[hi].rest)))); }
    O.head = toW(pp[BI.head]); O.chest = toW(pp[BI.chest]); O.pelvis = toW(pp[0]); O.mouth = toW(vadd(pp[BI.head], qrot(qq[BI.head], [0, -10, 22])));
    O.wingTip = [toW(vadd(pp[BI.wf1L], qrot(qq[BI.wf1L], vsub(WING.tip1, BN[BI.wf1L].rest)))), toW(vadd(pp[BI.wf1R], qrot(qq[BI.wf1R], vsub([-WING.tip1[0], WING.tip1[1], WING.tip1[2]], BN[BI.wf1R].rest))))];
    if (!(k === 1 || k === 5 || k === 7)) O.hold = O.tip[0];
    O.pj = pp; O.qj = qq; O.toW = toW; O.toM = toM;
    return O;
  }
  // world position of bone i's joint from a pose output
  const jointW = (O, i) => O.toW(O.pj[i]);

  // ---------------- state snapshots (the multiplayer contract) ----------------
  const r1 = v => Math.round(v*10)/10, r3 = v => Math.round(v*1000)/1000, r4 = v => Math.round(v*10000)/10000;
  function snap(S){   // <= ~200 bytes as JSON
    return {t:Math.round(S.t*100)/100, x:r1(S.x), y:r1(S.y), z:r1(S.z), hdg:r3(wrapA(S.hdg)), phase:S.phase, target:S.target == null ? null : String(S.target).slice(0, 24),
      anim:[r4(S.g), r1(S.v), S.k | 0, r3(S.p), Math.round(S.ax), Math.round(S.ay), Math.round(S.az), Math.round(S.w*100)/100, r3(S.r), Math.round(S.ly*100)/100]};
  }
  function unsnap(s, o){
    o = o || {}; const a = s.anim || [];
    o.t = +s.t || 0; o.x = +s.x || 0; o.y = +s.y || 0; o.z = +s.z || 0; o.hdg = +s.hdg || 0; o.phase = s.phase || 'hunt'; o.target = s.target === undefined ? null : s.target;
    o.g = +a[0] || 0; o.v = +a[1] || 0; o.k = a[2] | 0; o.p = +a[3] || 0; o.ax = +a[4] || 0; o.ay = +a[5] || 0; o.az = +a[6] || 0; o.w = a[7] === undefined ? 0.5 : +a[7]; o.r = a[8] === undefined ? 1 : +a[8]; o.ly = +a[9] || 0;
    return o;
  }
  // interpolate two unpacked states (angles the short way, the gait phase forwards, actions snap)
  function interp(a, b, u, o){
    o = o || {}; u = clamp(u, 0, 1.6);   // > 1: a short extrapolation
    o.t = lerp(a.t, b.t, u); o.x = lerp(a.x, b.x, u); o.y = lerp(a.y, b.y, u); o.z = lerp(a.z, b.z, u); o.hdg = a.hdg + wrapA(b.hdg - a.hdg)*u;
    let dg = b.g - a.g; if (dg < -0.5) dg += 1; if (dg > 0.5) dg -= 1; o.g = ((a.g + dg*u) % 1 + 1) % 1;
    o.v = lerp(a.v, b.v, Math.min(1, u)); o.w = lerp(a.w, b.w, Math.min(1, u)); o.r = lerp(a.r, b.r, Math.min(1, u)); o.ly = lerp(a.ly, b.ly, Math.min(1, u));
    const B = u >= 0.5 ? b : a; o.phase = B.phase; o.target = B.target;
    // actions: the same one runs on; a change happens at the moment the newer action began (its start time follows from its
    // progress), the older one runs out until then (its weight reaches 0 at p = 1)
    if (a.k === b.k && b.p >= a.p){ o.k = a.k; o.p = lerp(a.p, b.p, u); o.ax = lerp(a.ax, b.ax, u); o.ay = lerp(a.ay, b.ay, u); o.az = lerp(a.az, b.az, u); }
    else {
      const db = ACT_DUR[b.k] || 3, da = ACT_DUR[a.k] || 3, tb = b.k ? b.t - b.p*db : b.t;
      if (b.k && o.t >= tb){ o.k = b.k; o.p = clamp(b.p - (b.t - o.t)/db, 0, 1); o.ax = b.ax; o.ay = b.ay; o.az = b.az; }
      else if (a.k){ o.k = a.k; o.p = Math.min(1, a.p + (o.t - a.t)/da); o.ax = a.ax; o.ay = a.ay; o.az = a.az; }
      else { o.k = 0; o.p = 0; o.ax = b.ax; o.ay = b.ay; o.az = b.az; }
    }
    return o;
  }

  // ---------------- the hunter (host / single player) ----------------
  // difficulty 0-2: walking speed, bursts, reach of the grab, how often it strikes
  const DIFF = [{vb:8, vburst:16, vfar:15, grab:16, cool:7, turn:0.24, lead:0.6},
                {vb:10.5, vburst:21, vfar:19, grab:24, cool:5.2, turn:0.3, lead:0.8},
                {vb:13, vburst:27, vfar:24, grab:32, cool:3.8, turn:0.38, lead:1.0}];
  const RISE_T = 24, RISE_D = 330;
  const KB_ = () => KB;   // (the shared species core: defined after this file, used at run time)
  const KI_ = () => KI;   // v33: the interception on the escape route (18_block.js, loaded after this file)
  function mulb(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; }; }
  // env: {ground(x, y) -> metres (the sea bed where it wades), water(x, y) -> bool, targets() -> [{id, x, y, z}],
  //       bldNear(x, y, r, cb(b)) (b: {ti, idx, cx, cy, r, z0, z1, g, h}), destroyed(ti, idx) -> bool}
  function Sim(env, o){
    o = o || {};
    const di = clamp(o.difficulty === undefined ? 1 : o.difficulty | 0, 0, 2), D = DIFF[di], rng = mulb((o.seed | 0) || 1);
    const S = {t:0, x:o.x || 0, y:o.y || 0, z:0, hdg:o.hdg || 0, phase:'rise', target:null, g:0, v:0, k:0, p:0, ax:0, ay:0, az:0, w:0.15, r:0, ly:0,
      cool:3, burst:0, burstCool:4, zg:0, caught:null, slow:0, vt:0, sweepCool:8, roared:false, hitDone:false, lost:0, stompCool:5};
    S.zg = env.ground(S.x, S.y); S.z = S.zg - RISE_D;
    const TV = new Map();    // target velocity estimates
    const O = mkOut(), out = {events:[]};
    // v31: the army (KB's shared helpers, bound at run time: 11_spcore loads after this file)
    const AR = {striking:false, HIT:new Set(), HITC:new Set(), LAST:new Map()};
    KB_().armyInit(S);
    const armyAt = (x, y, z, r, e, px, py, contact) => KB_().armyStrike(S, env, x, y, z, r, e, px, py, contact ? (AR.HITC.clear(), AR.HITC) : AR.HIT, AR.LAST, !!contact);
    // v31: the prey's car against the body (KB.Touch: crushing feet, telegraphed grabs, throws, near misses)
    const defC = KB_().get('cthulhu'), TC = KB_().Touch({S, env, out, def:defC, O, di, catchT, crushT});
    // v33: the block layer (KI.step: cut the player off on the escape route; it may topple a tower onto the road)
    const BX = {S, env, D, di, rng, out, crushAt:(x, y, z, r, below, e, px, py, mode) => crushAt(x, y, z, r, below, e, px, py, mode), topR:125}, BC = {hWant:0, vWant:0};
    function pickTarget(){
      const L = env.targets(); let best = null, bd = 1e18;
      for (const T of L){ const d = Math.hypot(T.x - S.x, T.y - S.y) - (T.id === S.target ? 150 : 0); if (d < bd){ bd = d; best = T; } }
      const A = KB_().armyPick(S, env, rng, best, best ? Math.hypot(best.x - S.x, best.y - S.y) : 1e9);
      return A || best;
    }
    function velOf(T, dt){
      let e = TV.get(T.id); if (!e){ e = {x:T.x, y:T.y, z:T.z || 0, vx:0, vy:0, vz:0}; TV.set(T.id, e); }
      if (dt > 0){ const k = 1 - Math.exp(-dt/0.6), vx = (T.x - e.x)/dt, vy = (T.y - e.y)/dt, vz = ((T.z || 0) - e.z)/dt;
        if (Math.hypot(vx, vy) < 400){ e.vx += (vx - e.vx)*k; e.vy += (vy - e.vy)*k; e.vz += (vz - e.vz)*k; } }
      e.x = T.x; e.y = T.y; e.z = T.z || 0; return e;
    }
    function startAct(kind, x, y, z){ S.k = kind; S.p = 0; S.ax = x; S.ay = y; S.az = z; S.hitDone = false; out.events.push({e:'act', k:kind, x, y, z}); }
    function step(dt){
      out.events.length = 0;
      S.t += dt;
      const T = S.phase === 'hunt' || S.phase === 'rise' || S.phase === 'roar' ? pickTarget() : null;
      let tv = null; if (T){ tv = velOf(T, dt); S.target = T.id; }
      const dx = T ? T.x - S.x : 0, dy = T ? T.y - S.y : 0, dist = Math.hypot(dx, dy);
      let vWant = 0, hWant = S.hdg, turn = D.turn;
      KB_().armyDecay(S, dt);
      if (S.phase === 'rise'){
        S.r = Math.min(1, S.r + dt/RISE_T); vWant = 3.5; turn = 0.12;
        if (T) hWant = Math.atan2(dx, dy);
        if (S.r >= 1){ S.phase = 'roar'; startAct(6, S.x, S.y, S.z); out.events.push({e:'roar'}); }
      } else if (S.phase === 'roar'){
        vWant = 0; if (S.k !== 6 || S.p >= 1){ S.k = 0; S.p = 0; S.phase = 'hunt'; S.burstCool = 6; }
      } else if (S.phase === 'hunt' && T){
        // aim where the target will be: lead by the time it takes to get there (capped), more on hard
        const lead = clamp(dist/Math.max(9, S.v), 0, 7)*D.lead, px = T.x + tv.vx*lead, py = T.y + tv.vy*lead;
        hWant = Math.atan2(px - S.x, py - S.y);
        S.burst -= dt; S.burstCool -= dt;
        if (S.burst <= 0 && S.burstCool <= 0 && dist < 1100 && dist > 220){ S.burst = 6 + 2*rng(); S.burstCool = 14 + 6*rng(); out.events.push({e:'burst'}); }
        // a heavy walk close in, long strides when the prey is far (catch-up), charges in bursts at mid range
        vWant = S.burst > 0 ? D.vburst : lerp(D.vb, D.vfar, sstep(500, 2200, dist));
        if (dist < 160) vWant = Math.min(vWant, 5);
        // v33: the escape mission - it heads for a block point on the route ahead of the player, waits there or crosses the road
        if (!T.army){ BC.hWant = hWant; BC.vWant = vWant; if (KI_().step(BX, T, tv, dist, dt, BC)){ hWant = BC.hWant; vWant = BC.vWant; } }
        const herr = Math.abs(wrapA(hWant - S.hdg)); if (herr > 1.2) vWant *= 0.45;
        vWant *= KB_().armySlow(S);
        // strikes
        S.cool -= dt; S.sweepCool -= dt;
        if (!S.k && S.cool <= 0){
          const tz = T.z || 0, gz = env.ground(T.x, T.y), air = tz - gz > 25;
          const ti = 1.4, qx = T.x + tv.vx*ti, qy = T.y + tv.vy*ti, qd = Math.hypot(qx - S.x, qy - S.y);
          const rel = wrapA(Math.atan2(qx - S.x, qy - S.y) - S.hdg);
          if (air && dist < 260 && tz < S.z + 330){ startAct(8, qx, qy, tz); S.cool = D.cool*0.8; }
          // (v31: not at a car right under it - between its feet the tentacles cannot reach it: it turns, or a foot comes down)
          else if (!air && qd < 240 && dist > 85 && qd > 60 && Math.abs(rel) < 1.3){ startAct(rng() < 0.55 + 0.1*(o.difficulty | 0) ? 5 : (rel > 0 ? 2 : 1), qx, qy, env.ground(qx, qy) + 1); S.cool = D.cool; }
          else if (!air && qd < 310 && dist > 85 && qd > 60 && Math.abs(rel) < 1.0){ startAct(rel > 0 ? 2 : 1, qx, qy, env.ground(qx, qy) + 1); S.cool = D.cool*1.1; }
          // v31: a car lingering between its feet (slower than 7 m/s): a foot raised high and brought down on it - it can drive off in
          // the ~1.9 s the foot takes; a car passing through is left to the stride (its feet are its hazard)
          else if (!air && !T.army && dist < 95 && Math.hypot(tv.vx, tv.vy) < 7 && S.stompCool <= 0){ const tq = HIT_P[9]*ACT_DUR[9]*0.15, sx = T.x + tv.vx*tq, sy = T.y + tv.vy*tq, lx = -Math.cos(S.hdg)*(sx - S.x) + Math.sin(S.hdg)*(sy - S.y);
            startAct(9, sx, sy, lx >= 0 ? 1 : -1); S.stompCool = 7 + 6*rng(); S.cool = 2.6; }
          else if (S.sweepCool <= 0 && dist < 900){ startAct(rng() < 0.5 ? 3 : 4, S.x, S.y, 0); S.sweepCool = 9 + 8*rng(); S.cool = 2.5; }
        }
        S.stompCool -= dt;
        if (S.k === 5 && !S.hitDone && !KB_().committed(S, defC, di)){   // a grab follows its target until it is committed (v31)
          const ti = Math.max(0, (HIT_P[5] - S.p)*ACT_DUR[5]); S.ax = T.x + tv.vx*ti; S.ay = T.y + tv.vy*ti; S.az = env.ground(S.ax, S.ay) + 1; }
      } else if (S.phase === 'catch'){
        vWant = 0; const C = S.caughtT; if (C){ S.ax = C.x; S.ay = C.y; S.az = C.z; }
        if (S.k !== 7){ S.phase = 'done'; }
      } else if (S.phase === 'won' || S.phase === 'done' || S.phase === 'crush'){
        vWant = 0;
        if (!S.roared){ S.roared = true; startAct(6, S.x, S.y, S.z); }
      }
      // actions advance; the hit moment
      if (S.k){
        S.p += dt/(ACT_DUR[S.k] || 3);
        const hp = HIT_P[S.k];
        if (hp !== undefined && !S.hitDone && S.p >= hp){ S.hitDone = true; AR.HIT.clear(); AR.striking = true; try { hit(T, tv); } finally { AR.striking = false; } }
        if (S.k && S.p >= 1){ if (S.k === 7){ S.k = 0; S.p = 0; } else { S.k = 0; S.p = 0; } }
        if (S.k) vWant *= S.k === 6 || S.k === 9 ? 0 : 0.35;
      }
      // move: heavy acceleration, limited turn rate
      const acc = vWant > S.v ? 2.2 : 3.5; S.v += clamp(vWant - S.v, -acc*dt, acc*dt);
      const de = wrapA(hWant - S.hdg), tr = (turn + 0.008*S.v)*dt*(Math.abs(de) > 1.7 && S.phase === 'hunt' ? 0.6 : 1)*(S.k === 9 ? 0 : 1); S.hdg = wrapA(S.hdg + clamp(de, -tr, tr));   // (it does not turn on a planted foot)   // (v31: an about-face is slow)
      S.x += Math.sin(S.hdg)*S.v*dt; S.y += Math.cos(S.hdg)*S.v*dt;
      S.g = (S.g + dt*S.v/strideOf(S.v)) % 1;
      // the ground under it (the sea bed where it wades), smoothed; rising: deep under the surface
      const gNow = (env.ground(S.x, S.y)*2 + env.ground(S.x + Math.sin(S.hdg)*40, S.y + Math.cos(S.hdg)*40) + env.ground(S.x - Math.sin(S.hdg)*30, S.y - Math.cos(S.hdg)*30))/4;
      S.zg += (gNow - S.zg)*Math.min(1, dt*1.2);
      const re = S.r >= 1 ? 1 : 1 - Math.pow(1 - S.r, 2.2);
      S.z = S.zg - RISE_D*(1 - re);
      S.w += ((S.phase === 'rise' ? 0.1 : S.k === 6 ? 0.95 : S.burst > 0 ? 0.7 : 0.5) - S.w)*Math.min(1, dt*0.6);
      if (T){ const rel = wrapA(Math.atan2(dx, dy) - S.hdg); S.ly += (clamp(rel, -0.9, 0.9) - S.ly)*Math.min(1, dt*1.5); }
      // pose + destruction
      pose(S, env, O);
      if (o.destroy !== false) crush(dt);
      if (S.phase === 'hunt') TC.step(dt, T => TV.get(T.id)); else TC.B.n = 0;
      return out;
    }
    function hit(T, tv){
      const k = S.k;
      out.events.push({e:'hit', k, x:S.ax, y:S.ay, z:S.az});
      // (v31: no proximity catch, no shove: the club / the hands catch only by touching the target in the window - KB.Touch)
      if (k === 1 || k === 2 || k === 5) crushAt(S.ax, S.ay, env.ground(S.ax, S.ay), k === 5 ? 30 : 55, 40, k === 5 ? 0.7 : 0.95);
      if (k === 9){ const F = O.feet[(S.az || 0) >= 0 ? 0 : 1], a = F.ankle; crushAt(a[0], a[1], env.ground(a[0], a[1]), 34, 10, 0.92); S.ax = a[0]; S.ay = a[1]; }
    }
    function catchT(T){
      S.caught = T.id; S.caughtT = {x:T.x, y:T.y, z:T.z || 0}; S.phase = 'catch'; S.k = 7; S.p = 0; S.ax = T.x; S.ay = T.y; S.az = T.z || 0; S.hitDone = true;
      out.events.push({e:'catch', id:T.id});
    }
    function crushT(T, part){
      S.caught = T.id; S.caughtT = {x:T.x, y:T.y, z:T.z || 0}; S.phase = 'crush'; S.target = T.id; S.k = 0; S.p = 0; S.hitDone = true; S.roared = false; S.ax = T.x; S.ay = T.y; S.az = T.z || 0;
      out.events.push({e:'crush', id:T.id, x:T.x, y:T.y, part:part ? part.id : -1});
    }
    // buildings in reach of the body: feet, shins, thighs, pelvis, belly, chest, hands; the tentacles while they lash
    const SPH = [];
    function crush(dt){
      if (S.r < 0.55 || !env.bldNear) return;
      SPH.length = 0;
      // v30: each contact carries an impact energy (0-1); the push direction is the walk (blended with radial in crushAt)
      const eb = clamp(0.38 + 0.016*S.v, 0.35, 0.8);
      const sp = (p, r, e) => SPH.push(p[0], p[1], p[2], r, e === undefined ? eb : e);
      for (const F of O.feet){ sp(F.ankle, 30); sp(vlerp(F.ankle, F.knee, 0.5), 22); sp(F.knee, 22); sp(vlerp(F.knee, F.hip, 0.5), 24); }
      sp(O.pelvis, 42); sp(O.chest, 46); sp(jointW(O, BI.sp1), 44); sp(jointW(O, BI.head), 40);
      for (const h of O.hands) sp(h, 22);
      sp(jointW(O, BI.farmL), 18); sp(jointW(O, BI.farmR), 18); sp(jointW(O, BI.handL), 18); sp(jointW(O, BI.handR), 18);
      if (S.k === 1 || S.k === 2 || S.k === 5 || S.k === 7){ const T = TENT[S.k === 2 ? 1 : 0]; for (let j = 4; j < NTS; j += 2) sp(jointW(O, T.b[j]), 14, 0.85); }
      // v31: a claw sweeping across the street knocks over the army units it passes through
      if ((S.k === 3 || S.k === 4) && S.p > 0.35 && S.p < 0.8){ const h = O.hands[S.k === 3 ? 0 : 1]; armyAt(h[0], h[1], env.ground(h[0], h[1]), 30, 0.85, undefined, undefined, true); }
      const px = Math.sin(S.hdg), py = Math.cos(S.hdg);
      for (let i = 0; i < SPH.length; i += 5) crushAt(SPH[i], SPH[i + 1], SPH[i + 2], SPH[i + 3], 0, SPH[i + 4], px, py);
    }
    const hitList = [];
    function crushAt(x, y, z, r, below, e, px, py, mode){
      if (AR.striking) armyAt(x, y, z, r, e, px, py);
      hitList.length = 0;
      env.bldNear(x, y, r + 90, b => {
        if (env.destroyed(b.ti, b.idx)) return;
        const d = Math.hypot(b.cx - x, b.cy - y) - b.r; if (d > r) return;
        if (z + r < b.z0 || z - r - below > b.z1) return;
        hitList.push(b);
      });
      if (hitList.length){ const L = hitList.map(b => { let ux = b.cx - x, uy = b.cy - y; const l = Math.hypot(ux, uy); if (l > 1){ ux /= l; uy /= l; } else { ux = Math.sin(S.hdg); uy = Math.cos(S.hdg); }
          if (mode === 'dir' && px !== undefined){ ux = px; uy = py; const m = Math.hypot(ux, uy) || 1; ux /= m; uy /= m; }   // (v33: a push in exactly this direction - a tower shouldered over onto the road)
          else if (px !== undefined){ ux = ux*0.45 + px*0.55; uy = uy*0.45 + py*0.55; const m = Math.hypot(ux, uy) || 1; ux /= m; uy /= m; }
          return {tile:b.ti, idx:b.idx, b, ang:Math.atan2(b.cy - S.y, b.cx - S.x), fx:Math.round(ux*1000)/1000, fy:Math.round(uy*1000)/1000, e:Math.round(clamp(e === undefined ? 0.5 : e, 0, 1)*100)/100, z:Math.round(clamp(z, b.z0, b.z1))}; });
        out.events.push({e:'destroy', list:L}); if (env.onDestroy) env.onDestroy(L); }
    }
    return {S, O, step, out, snap:() => snap(S), get pose(){ return O; }, D, hinder:h => KB_().armyHinder(S, h), armyAt, touch:TC, api:{startAct}, blk:BX, win(){ if (S.phase === 'hunt' || S.phase === 'rise' || S.phase === 'roar'){ S.phase = 'won'; S.k = 0; S.p = 0; } }, setCatchPos(x, y, z){ if (S.caughtT){ S.caughtT.x = x; S.caughtT.y = y; S.caughtT.z = z; } }};
  }
  return {HY, BN, BI, NB, FEEL, TENT, NFS, NTS, WING, EYES, SIDES, pose, mkOut, jointW, snap, unsnap, interp, Sim, DIFF, ACT_DUR, HIT_P, BETA, strideOf, RISE_D, RISE_T,
    m:{clamp, lerp, sstep, wrapA, vsub, vadd, vsc, vdot, vcross, vlen, vnorm, vlerp, qmul, qrot, qax, qUnit, qX, qY, qZ, qFrame, qMat, slerpDir, mulb}};
})();
//</CORE>

// ---- 11_spcore.js ----
//<CORE>
/* ================= more creatures (v30): the shared species core — registry, skeleton / limb helpers, the generic hunter, snapshots =================
   Pure JS (node-testable). Every species follows KC's conventions: model space x = the creature's left, y = up, z = forward; world =
   a turn about the vertical by (pi - hdg) and a lift by z; a bone is its joint position p and its rotation q relative to rest (rest
   orientation = identity), skinned with T(p) R(q) T(-rest). A species core is {id, zh, en, NB, BN, BI, pose(P, env, O, ctx), mkOut(),
   mkCtx(), ctxStep(ctx, P, env), Sim(env, o), snap(S), unsnap(s, o), interp(a, b, u, o), strideOf(v), travel(P), ACT_DUR, HIT_P, ...}.
   pose() is a pure function of the pose state P (+ the terrain, + for the serpent ctx = the path its head has drawn, which a mirror
   rebuilds from the states it receives), so remote clients draw the very same creature.
   Snapshots: {sp, t, x, y, z, hdg, phase, target, anim:[g, v, k, p, ax, ay, az, w, r, ly, ...species extras]} (<= ~200 bytes JSON).
   Destruction entries: {tile, idx, b, ang, fx, fy, e, z} - fx, fy the unit impact direction (world x / y), e the impact energy 0-1, z the
   height of the impact (m, within the building). */
const KB = (() => {
  const {clamp, lerp, sstep, wrapA, vsub, vadd, vsc, vdot, vcross, vlen, vnorm, vlerp, qmul, qrot, qax, qUnit, qX, qY, qZ, qFrame, mulb} = KC.m;
  const PI = Math.PI, TAU = PI*2;
  const REG = {}, ORDER = [];
  function add(def){ REG[def.id] = def; if (!ORDER.includes(def.id)) ORDER.push(def.id); return def; }

  // ---------------- skeletons and pose outputs ----------------
  function Skel(){ const BN = [], BI = {}; return {BN, BI, bone(name, parent, x, y, z){ BI[name] = BN.length; BN.push({name, parent:parent == null ? -1 : BI[parent], rest:[x, y, z]}); return BN.length - 1; }}; }
  function mkOut(NB){
    const O = {p:new Float32Array(NB*3), q:new Float32Array(NB*4), M:new Float32Array(NB*16), W:{x:0, y:0, z:0, c:1, s:0, a:0},
      eye:[[0, 0, 0], [0, 0, 0]], tip:[[0, 0, 0], [0, 0, 0]], hands:[[0, 0, 0], [0, 0, 0]], feet:[], head:[0, 0, 0], mouth:[0, 0, 0], hold:[0, 0, 0],
      chest:[0, 0, 0], pelvis:[0, 0, 0], pj:new Array(NB), qj:new Array(NB)};
    for (let i = 0; i < NB; i++){ O.pj[i] = [0, 0, 0]; O.qj[i] = [0, 0, 0, 1]; }
    // model <-> world (read O.W: no closures per frame)
    O.toW = m => [O.W.x + O.W.c*m[0] + O.W.s*m[2], O.W.y + O.W.s*m[0] - O.W.c*m[2], O.W.z + m[1]];
    O.toM = (wx, wy, wz) => { const dx = wx - O.W.x, dy = wy - O.W.y; return [O.W.c*dx + O.W.s*dy, wz - O.W.z, O.W.s*dx - O.W.c*dy]; };
    return O;
  }
  function setW(P, O){ const ya = PI - P.hdg; O.W.x = P.x; O.W.y = P.y; O.W.z = P.z; O.W.c = Math.cos(ya); O.W.s = Math.sin(ya); O.W.a = ya; }
  // joint positions / rotations -> O.p, O.q and the skinning matrices T(p) R(q) T(-rest)
  function writeM(O, BN){
    const NB = BN.length, pp = O.pj, qq = O.qj, M = O.M;
    for (let i = 0; i < NB; i++){
      const p = pp[i], q = qq[i], r = BN[i].rest, o3 = i*3, o4 = i*4, o16 = i*16;
      O.p[o3] = p[0]; O.p[o3 + 1] = p[1]; O.p[o3 + 2] = p[2]; O.q[o4] = q[0]; O.q[o4 + 1] = q[1]; O.q[o4 + 2] = q[2]; O.q[o4 + 3] = q[3];
      const x = q[0], y = q[1], z = q[2], ww = q[3], x2 = x + x, y2 = y + y, z2 = z + z, xx = x*x2, xy = x*y2, xz = x*z2, yy = y*y2, yz = y*z2, zz = z*z2, wx = ww*x2, wy = ww*y2, wz = ww*z2;
      const m00 = 1 - (yy + zz), m01 = xy - wz, m02 = xz + wy, m10 = xy + wz, m11 = 1 - (xx + zz), m12 = yz - wx, m20 = xz - wy, m21 = yz + wx, m22 = 1 - (xx + yy);
      M[o16] = m00; M[o16 + 1] = m10; M[o16 + 2] = m20; M[o16 + 3] = 0; M[o16 + 4] = m01; M[o16 + 5] = m11; M[o16 + 6] = m21; M[o16 + 7] = 0;
      M[o16 + 8] = m02; M[o16 + 9] = m12; M[o16 + 10] = m22; M[o16 + 11] = 0;
      M[o16 + 12] = p[0] - (m00*r[0] + m01*r[1] + m02*r[2]); M[o16 + 13] = p[1] - (m10*r[0] + m11*r[1] + m12*r[2]); M[o16 + 14] = p[2] - (m20*r[0] + m21*r[1] + m22*r[2]); M[o16 + 15] = 1;
    }
  }
  // forward kinematics against a skeleton: fk(i, qLocal) sets bone i from its parent (absolute rotations / positions in O.qj / O.pj)
  function mkFK(BN, O){ const pp = O.pj, qq = O.qj; return (i, ql) => { const b = BN[i], pa = b.parent, qp = qq[pa], q = qmul(qp, ql); qq[i] = q; pp[i] = vadd(pp[pa], qrot(qp, vsub(b.rest, BN[pa].rest))); }; }
  const jointW = (O, i) => O.toW(O.pj[i]);
  const ptW = (O, i, off) => O.toW(vadd(O.pj[i], qrot(O.qj[i], off)));    // a point fixed to bone i (offset in rest space)

  // v31: the body as spheres for the army (aim / impact points): sph(out, i, p, r) fills reused objects; the list is cut to n
  function sph(out, i, p, r){ let o = out[i]; if (!o) o = out[i] = {x:0, y:0, z:0, r:0}; o.x = p[0]; o.y = p[1]; o.z = p[2]; o.r = r; return i + 1; }
  // ---------------- curve-built limbs (arms, tentacles, a serpent's body) ----------------
  // a reusable polyline (points + arc lengths)
  function PL(n){ return {x:new Float64Array(n), y:new Float64Array(n), z:new Float64Array(n), L:new Float64Array(n), n:0, cap:n}; }
  function plAdd(p, x, y, z){
    const i = p.n; if (i >= p.cap) return;
    if (i){ const dx = x - p.x[i - 1], dy = y - p.y[i - 1], dz = z - p.z[i - 1], d = Math.sqrt(dx*dx + dy*dy + dz*dz); if (d < 1e-4) return; p.L[i] = p.L[i - 1] + d; } else p.L[0] = 0;
    p.x[i] = x; p.y[i] = y; p.z[i] = z; p.n = i + 1;
  }
  function plBez(p, a, b, c, d, n){ for (let i = 0; i <= n; i++){ const t = i/n, u = 1 - t, w0 = u*u*u, w1 = 3*u*u*t, w2 = 3*u*t*t, w3 = t*t*t;
    plAdd(p, w0*a[0] + w1*b[0] + w2*c[0] + w3*d[0], w0*a[1] + w1*b[1] + w2*c[1] + w3*d[1], w0*a[2] + w1*b[2] + w2*c[2] + w3*d[2]); } }
  function bezLen(a, b, c, d, n){ let L = 0, px = a[0], py = a[1], pz = a[2];
    for (let i = 1; i <= n; i++){ const t = i/n, u = 1 - t, w0 = u*u*u, w1 = 3*u*u*t, w2 = 3*u*t*t, w3 = t*t*t, x = w0*a[0] + w1*b[0] + w2*c[0] + w3*d[0], y = w0*a[1] + w1*b[1] + w2*c[1] + w3*d[1], z = w0*a[2] + w1*b[2] + w2*c[2] + w3*d[2];
      L += Math.sqrt((x - px)*(x - px) + (y - py)*(y - py) + (z - pz)*(z - pz)); px = x; py = y; pz = z; } return L; }
  // a curling tail from point c along unit t: the angle grows as (s / len)^2 up to th, in the plane of t and (up turned about t by psi);
  // optional lateral meander (wv = {a: amplitude rad, l: wavelength m, ph: phase, h: a steady sideways bend rad}) in the plane of t and t x up
  function plCurl(p, c, t, up, th, psi, len, n, wv){
    let v = vsub(up, vsc(t, vdot(up, t))); const lv = vlen(v); v = lv > 1e-4 ? vsc(v, 1/lv) : vnorm(vcross(t, [1, 0, 0]));
    const sd = vcross(t, v);
    if (psi){ const cp = Math.cos(psi), sp = Math.sin(psi); v = [v[0]*cp + sd[0]*sp, v[1]*cp + sd[1]*sp, v[2]*cp + sd[2]*sp]; }
    const sv = vcross(t, v);
    let x = c[0], y = c[1], z = c[2]; const ds = len/n; plAdd(p, x, y, z);
    for (let i = 0; i < n; i++){ const u = (i + 0.5)/n, a = th*u*u, ca = Math.cos(a), sa = Math.sin(a);
      let dx = t[0]*ca + v[0]*sa, dy = t[1]*ca + v[1]*sa, dz = t[2]*ca + v[2]*sa;
      if (wv){ const h = (wv.h || 0)*u*u + wv.a*Math.sin(TAU*u*len/wv.l + wv.ph)*Math.min(1, u*3), ch = Math.cos(h), sh = Math.sin(h);
        dx = dx*ch + sv[0]*sh; dy = dy*ch + sv[1]*sh; dz = dz*ch + sv[2]*sh; }
      x += dx*ds; y += dy*ds; z += dz*ds; plAdd(p, x, y, z); }
  }
  // a helix around a vertical axis (cx, cz) from height y0: radius r, start angle a0 (model x / z plane), turning sense sg, climb pitch (rad)
  function plHelix(p, cx, cz, y0, r, a0, sg, pitch, len, n){
    const ds = len/n, k = Math.cos(pitch)/Math.max(1, r), rise = Math.sin(pitch);
    for (let i = 0; i <= n; i++){ const s = i*ds, a = a0 + sg*s*k; plAdd(p, cx + Math.sin(a)*r, y0 + s*rise, cz + Math.cos(a)*r); }
  }
  // the point at arc length s (beyond the end: on along the last segment)
  function plAt(p, s, o){
    const n = p.n; o = o || [0, 0, 0]; if (n === 0){ o[0] = o[1] = o[2] = 0; return o; } if (n === 1 || s <= 0){ o[0] = p.x[0]; o[1] = p.y[0]; o[2] = p.z[0]; return o; }
    let i;
    if (s >= p.L[n - 1]) i = n - 2;
    else { let lo = 0, hi = n - 1; while (hi - lo > 1){ const m = (lo + hi) >> 1; if (p.L[m] <= s) lo = m; else hi = m; } i = lo; }
    const sl = p.L[i + 1] - p.L[i] || 1e-6, f = (s - p.L[i])/sl;
    o[0] = p.x[i] + (p.x[i + 1] - p.x[i])*f; o[1] = p.y[i] + (p.y[i + 1] - p.y[i])*f; o[2] = p.z[i] + (p.z[i + 1] - p.z[i])*f; return o;
  }
  // an arm / tentacle: from base b (leaving along d0) down to the contact c (arriving along the horizontal tc), the rest of its length
  // lying on beyond c and curling (angle th, curl plane turned by psi); a contact out of reach is pulled in. Fills pl; returns the curve length.
  function limbPath(pl, b, d0, c, tc, th, psi, L, upv, wv){
    pl.n = 0;
    let dx = c[0] - b[0], dy = c[1] - b[1], dz = c[2] - b[2], D = Math.sqrt(dx*dx + dy*dy + dz*dz);
    let h1 = 0.42*D, h2 = 0.36*D, P1 = [b[0] + d0[0]*h1, b[1] + d0[1]*h1, b[2] + d0[2]*h1], P2 = [c[0] - tc[0]*h2, c[1] - tc[1]*h2, c[2] - tc[2]*h2];
    let Lb = bezLen(b, P1, P2, c, 12);
    if (Lb > L*0.94){ const k = L*0.92/Lb; c = [b[0] + dx*k, b[1] + dy*k, b[2] + dz*k]; D *= k; h1 = 0.42*D; h2 = 0.36*D;
      P1 = [b[0] + d0[0]*h1, b[1] + d0[1]*h1, b[2] + d0[2]*h1]; P2 = [c[0] - tc[0]*h2, c[1] - tc[1]*h2, c[2] - tc[2]*h2]; Lb = bezLen(b, P1, P2, c, 12); }
    plBez(pl, b, P1, P2, c, 14);
    const Lr = Math.max(1, L - pl.L[pl.n - 1]);
    plCurl(pl, c, tc, upv || [0, 1, 0], th, psi, Lr, Math.max(4, Math.min(28, Math.round(Lr/7))), wv);
    return Lb;
  }
  // a reaching tentacle of length L from b to e (quadratic, the middle lifted along upv until the length fits; e pulled in if too far)
  function reachPath(pl, b, e, L, upv, n){
    pl.n = 0; upv = upv || [0, 1, 0];
    let dx = e[0] - b[0], dy = e[1] - b[1], dz = e[2] - b[2], D = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (D > L*0.97){ const k = L*0.97/D; e = [b[0] + dx*k, b[1] + dy*k, b[2] + dz*k]; dx *= k; dy *= k; dz *= k; D = L*0.97; }
    const mx = (b[0] + e[0])/2, my = (b[1] + e[1])/2, mz = (b[2] + e[2])/2;
    const qlen = h => { const cx = mx + upv[0]*h, cy = my + upv[1]*h, cz = mz + upv[2]*h; let Lq = 0, px = b[0], py = b[1], pz = b[2];
      for (let i = 1; i <= 16; i++){ const t = i/16, u = 1 - t, x = u*u*b[0] + 2*u*t*cx + t*t*e[0], y = u*u*b[1] + 2*u*t*cy + t*t*e[1], z = u*u*b[2] + 2*u*t*cz + t*t*e[2]; Lq += Math.sqrt((x - px)*(x - px) + (y - py)*(y - py) + (z - pz)*(z - pz)); px = x; py = y; pz = z; } return Lq; };
    let lo = 0, hi = L;
    for (let it = 0; it < 12; it++){ const h = (lo + hi)/2; if (qlen(h) > L) hi = h; else lo = h; }
    const cx = mx + upv[0]*lo, cy = my + upv[1]*lo, cz = mz + upv[2]*lo; n = n || 28;
    for (let i = 0; i <= n; i++){ const t = i/n, u = 1 - t; plAdd(pl, u*u*b[0] + 2*u*t*cx + t*t*e[0], u*u*b[1] + 2*u*t*cy + t*t*e[1], u*u*b[2] + 2*u*t*cz + t*t*e[2]); }
    return e;
  }
  // sample n + 1 joints along a path at equal steps of len / n into pts (arrays of [x, y, z])
  function sampleJoints(pl, len, n, pts){ for (let j = 0; j <= n; j++){ pts[j] = pts[j] || [0, 0, 0]; plAt(pl, len*j/n, pts[j]); } return pts; }
  // orient a chain of bones along joints pts (bone j from pts[j] to pts[j + 1], rest direction rd), parallel-transported from base rotation q0
  function orientChain(pts, n, rd, q0, bones, O){
    let qPrev = null, dPrev = null;
    for (let j = 0; j < n; j++){
      const a = pts[j], b = pts[j + 1]; let d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const l = Math.hypot(d[0], d[1], d[2]); d = l > 1e-6 ? [d[0]/l, d[1]/l, d[2]/l] : (dPrev || qrot(q0, rd));
      const q = j === 0 ? qmul(qUnit(qrot(q0, rd), d), q0) : qmul(qUnit(dPrev, d), qPrev);
      const bi = bones[j]; O.pj[bi] = [a[0], a[1], a[2]]; O.qj[bi] = q; qPrev = q; dPrev = d;
    }
  }
  // two-bone IK: hip h -> knee -> ankle a (bone lengths l1, l2), bending towards pole; returns the knee
  function ik2(h, a, l1, l2, pole){
    const d = vsub(a, h); let dist = vlen(d); const dn = vsc(d, 1/(dist || 1));
    dist = clamp(dist, Math.abs(l1 - l2) + 0.5, l1 + l2 - 0.2);
    const a1 = (l1*l1 - l2*l2 + dist*dist)/(2*dist), h1 = Math.sqrt(Math.max(0, l1*l1 - a1*a1));
    let pl = vsub(pole, vsc(dn, vdot(pole, dn))); const lp = vlen(pl); pl = lp > 1e-6 ? vsc(pl, 1/lp) : vnorm(vcross(dn, [1, 0, 0]));
    return {k:vadd(vadd(h, vsc(dn, a1)), vsc(pl, h1)), e:vadd(h, vsc(dn, dist)), pl};
  }
  // a rotation taking a bone's rest direction (rd, rest bend-plane normal rn) to direction d with bend-plane normal nrm
  const qAim = (rd, rn, d, nrm) => qFrame(rd, rn, d, nrm);

  // ---------------- snapshots (multiplayer) ----------------
  const r1 = v => Math.round(v*10)/10, r2 = v => Math.round(v*100)/100, r3 = v => Math.round(v*1000)/1000, r4 = v => Math.round(v*10000)/10000;
  // def.X: species extras [{n:name, q:0 (integer) | 2 | 3 (decimals), m:'lin' | 'ang' | 'act' (switches with the action), v0}]
  function snap(def, S){
    const a = [r4(S.g), r1(S.v), S.k | 0, r3(S.p), Math.round(S.ax), Math.round(S.ay), Math.round(S.az), r2(S.w), r3(S.r), r2(S.ly)];
    if (def.X) for (const X of def.X){ const v = +S[X.n] || 0; a.push(X.q === 0 ? Math.round(v) : X.q === 3 ? r3(v) : r2(v)); }
    return {sp:def.id, t:Math.round(S.t*100)/100, x:r1(S.x), y:r1(S.y), z:r1(S.z), hdg:r3(wrapA(S.hdg)), phase:S.phase, target:S.target == null ? null : String(S.target).slice(0, 24), anim:a};
  }
  function unsnap(def, s, o){
    o = o || {}; const a = s.anim || [];
    o.sp = def.id; o.t = +s.t || 0; o.x = +s.x || 0; o.y = +s.y || 0; o.z = +s.z || 0; o.hdg = +s.hdg || 0; o.phase = s.phase || 'hunt'; o.target = s.target === undefined ? null : s.target;
    o.g = +a[0] || 0; o.v = +a[1] || 0; o.k = a[2] | 0; o.p = +a[3] || 0; o.ax = +a[4] || 0; o.ay = +a[5] || 0; o.az = +a[6] || 0; o.w = a[7] === undefined ? 0.5 : +a[7]; o.r = a[8] === undefined ? 1 : +a[8]; o.ly = +a[9] || 0;
    if (def.X) def.X.forEach((X, i) => { o[X.n] = a[10 + i] === undefined ? (X.v0 || 0) : +a[10 + i]; });
    return o;
  }
  // interpolate two unpacked states (as KC.interp: angles the short way, the gait phase forwards, actions switch at their start time)
  function interp(def, a, b, u, o){
    o = o || {}; u = clamp(u, 0, 1.6); o.sp = def.id;
    o.t = lerp(a.t, b.t, u); o.x = lerp(a.x, b.x, u); o.y = lerp(a.y, b.y, u); o.z = lerp(a.z, b.z, u); o.hdg = a.hdg + wrapA(b.hdg - a.hdg)*u;
    let dg = b.g - a.g; if (dg < -0.5) dg += 1; if (dg > 0.5) dg -= 1; o.g = ((a.g + dg*u) % 1 + 1) % 1;
    const um = Math.min(1, u);
    o.v = lerp(a.v, b.v, um); o.w = lerp(a.w, b.w, um); o.r = lerp(a.r, b.r, um); o.ly = lerp(a.ly, b.ly, um);
    const B = u >= 0.5 ? b : a; o.phase = B.phase; o.target = B.target;
    const AD = def.ACT_DUR; let src = null;
    if (a.k === b.k && b.p >= a.p){ o.k = a.k; o.p = lerp(a.p, b.p, u); o.ax = lerp(a.ax, b.ax, u); o.ay = lerp(a.ay, b.ay, u); o.az = lerp(a.az, b.az, u); src = 'mix'; }
    else {
      const db = AD[b.k] || 3, da = AD[a.k] || 3, tb = b.k ? b.t - b.p*db : b.t;
      if (b.k && o.t >= tb){ o.k = b.k; o.p = clamp(b.p - (b.t - o.t)/db, 0, 1); o.ax = b.ax; o.ay = b.ay; o.az = b.az; src = b; }
      else if (a.k){ o.k = a.k; o.p = Math.min(1, a.p + (o.t - a.t)/da); o.ax = a.ax; o.ay = a.ay; o.az = a.az; src = a; }
      else { o.k = 0; o.p = 0; o.ax = b.ax; o.ay = b.ay; o.az = b.az; src = b; }
    }
    if (def.X) for (const X of def.X){ const va = +a[X.n] || 0, vb = +b[X.n] || 0;
      o[X.n] = X.m === 'ang' ? va + wrapA(vb - va)*um : X.m === 'act' ? (src === 'mix' ? (u < 0.5 ? va : vb) : +src[X.n] || 0) : lerp(va, vb, um); }
    return o;
  }

  // ---------------- v31: the army (window.SGArmy, read through env.army() -> [{id, x, y, z, r, kind}]) ----------------
  // It can only be hindered: env.hinder hits (shells, rockets: k 0-1 each) add suppression that slows it (<= 40 %, gone in a few
  // seconds), make it flinch now and then (S.fl, a recoil of the whole body away from the hit: drawn by the game, no state on the
  // wire) and draw its attention: it turns on the unit that annoys it for a while (or on units close by / in its way when its prey is
  // far), attacks it with its ordinary strikes (a target with nocatch: a grab becomes a smash) and goes back to the hunt. Every strike
  // reports the units it reaches through env.armyHit(id, {x, y, z, e, fx, fy}) (once per strike; per-step attack contacts at most every
  // 0.8 s per unit). Never damage, never a death. Shared by KC.Sim (cthulhu) and the generic hunter.
  const ARMY_SLOW = 0.4;
  function armyInit(S){ S.sup = 0; S.fl = 0; S.flx = 0; S.fly = 1; S.flAcc = 0; S.flCool = 0; S.aggro = 0; S.armyId = null; S.armyT = 0; S.armyCool = 5; S.armyDec = 1.5; S.annoy = null; S.annoyT = 0; S.hindN = 0; }
  // a hit on the creature: {x, y, z, k 0-1, src}
  function armyHinder(S, h){
    if (!h || S.phase === 'won' || S.phase === 'done' || S.phase === 'catch' || S.phase === 'crush') return false;
    const k = clamp(+h.k || 0, 0, 1); if (!(k > 0)) return false;
    S.hindN++; S.sup = Math.min(1, (S.sup || 0) + 0.11*k); S.flAcc = (S.flAcc || 0) + k; S.aggro = Math.min(1, (S.aggro || 0) + 0.09*k);
    if (h.src !== undefined && h.src !== null){ S.annoy = h.src; S.annoyT = 6; }
    if (S.flAcc > 1.6 && (S.flCool || 0) <= 0){ let dx = S.x - (+h.x || S.x), dy = S.y - (+h.y || S.y); const l = Math.hypot(dx, dy);
      if (l > 1){ dx /= l; dy /= l; } else { dx = -Math.sin(S.hdg); dy = -Math.cos(S.hdg); }
      S.fl = 1; S.flx = Math.round(dx*100)/100; S.fly = Math.round(dy*100)/100; S.flCool = 3.5; S.flAcc = 0; }
    return true;
  }
  function armyDecay(S, dt){
    S.sup = (S.sup || 0)*Math.exp(-dt/2.6); if (S.sup < 1e-3) S.sup = 0;
    S.fl = Math.max(0, (S.fl || 0) - dt/1.2); S.flCool = (S.flCool || 0) - dt; S.flAcc = (S.flAcc || 0)*Math.exp(-dt/3);
    S.aggro = (S.aggro || 0)*Math.exp(-dt/9); S.annoyT = (S.annoyT || 0) - dt; if (S.annoyT <= 0) S.annoy = null;
    S.armyT = (S.armyT || 0) - dt; S.armyCool = (S.armyCool || 0) - dt; S.armyDec = (S.armyDec || 0) - dt;
  }
  // the speed factor of the suppression and a flinch (never below 60 %)
  const armySlow = S => Math.max(1 - ARMY_SLOW, 1 - ARMY_SLOW*Math.min(1, S.sup || 0) - 0.25*(S.fl || 0));
  // the army unit it goes for now (a target object, nocatch) or null; P = the prey it would hunt otherwise, dP its distance
  const AT = {id:null, x:0, y:0, z:0, r:5, kind:'', nocatch:true, army:true};
  function armyPick(S, env, rng, P, dP){
    if (!env.army || S.phase !== 'hunt') return null;
    const L = env.army(); if (!L || !L.length){ S.armyId = null; return null; }
    if (S.armyId !== null && S.armyT > 0){ for (const u of L) if (u.id === S.armyId){ AT.id = u.id; AT.x = u.x; AT.y = u.y; AT.z = u.z || 0; AT.r = u.r || 5; AT.kind = u.kind || ''; return AT; }
      S.armyId = null; S.armyT = 0; }
    if (S.armyDec > 0 || S.armyCool > 0 || S.k) return null;
    S.armyDec = 1.2;
    // annoying: the unit that hit it last; else the nearest unit in front of it; close ones in its way are attacked when the prey is far
    let best = null, bs = 1e18, d = 0; const fx = Math.sin(S.hdg), fy = Math.cos(S.hdg);
    for (const u of L){ const dx = u.x - S.x, dy = u.y - S.y, du = Math.hypot(dx, dy); if (du > 650) continue;
      const ahead = (dx*fx + dy*fy)/Math.max(1, du), s = du - 140*ahead - (u.id === S.annoy ? 260 : 0); if (s < bs){ bs = s; best = u; d = du; } }
    if (!best) return null;
    const annoyed = S.aggro > 0.45 && best.id === S.annoy && d < 600, preyFar = !P || dP > 650, inWay = d < 170;
    if (!(annoyed || (preyFar && d < 380 && rng() < 0.6) || (inWay && rng() < 0.35 + 0.4*S.aggro))) return null;
    S.armyId = best.id; S.armyT = 7 + 7*rng(); S.armyCool = S.armyT + 8 + 8*rng(); S.aggro *= 0.5;
    AT.id = best.id; AT.x = best.x; AT.y = best.y; AT.z = best.z || 0; AT.r = best.r || 5; AT.kind = best.kind || ''; return AT;
  }
  // a strike (or an attack contact) at (x, y, z), radius r: every unit it reaches is hit (HIT: per strike; contact: a 0.8 s cooldown)
  function armyStrike(S, env, x, y, z, r, e, px, py, HIT, LAST, contact){
    if (!env.army || !env.armyHit) return 0; const L = env.army(); if (!L || !L.length) return 0; let n = 0;
    for (const u of L){ const ur = u.r || 4, dx = u.x - x, dy = u.y - y, d = Math.hypot(dx, dy); if (d > r + ur) continue; if (Math.abs((u.z || 0) - z) > r + ur + 12) continue;
      if (HIT.has(u.id)) continue; if (contact){ const lt = LAST.get(u.id); if (lt !== undefined && S.t - lt < 0.8) continue; }
      HIT.add(u.id); LAST.set(u.id, S.t); if (LAST.size > 300) LAST.clear();
      let ux = d > 0.5 ? dx/d : Math.sin(S.hdg), uy = d > 0.5 ? dy/d : Math.cos(S.hdg); if (px !== undefined && (px || py)){ ux = ux*0.5 + px*0.5; uy = uy*0.5 + py*0.5; }
      const m = Math.hypot(ux, uy) || 1, ee = clamp((e === undefined ? 0.8 : e)*(1 - 0.5*Math.max(0, d - ur)/Math.max(1, r)), 0.05, 1);
      try { env.armyHit(u.id, {x:u.x, y:u.y, z:u.z || 0, e:Math.round(ee*100)/100, fx:Math.round(ux/m*1000)/1000, fy:Math.round(uy/m*1000)/1000}); } catch (er){ /* the army module */ }
      n++; }
    return n;
  }

  // ---------------- v31: contact with the prey - the solid body, telegraphed grabs, crushing feet, throws, near misses ----------------
  // Every species lists its parts each step as oriented boxes in world metres (def.parts(O, S, env, B): a centre x / y, the long axis
  // a (math angle: cos a = east), half sizes hx / hy, a bottom z0 and a top z1; ids stable per species): feet, legs, a tail, the low
  // body and the arms that lie on the streets are SOLID (the car collides with them through SGF1.obstacles, by height: it passes under
  // the belly and between the legs); grabbing parts (tentacle tips, a claw, jaws, talons: def.grab(O, S, B, k)) and slamming limbs
  // (def.slam(O, S, B, k)) only count in the strike's window. Rules (host side, KB.Touch): a catch only when a grabbing part touches
  // the target's box in the window (p within [hp - 0.05, hp + 0.12] of the strike's hit moment: the club / claw / jaws closing); the
  // aim follows the prey only until the strike is committed (COMMIT s before the hit: a visible wind-up the player can dodge); a FOOT
  // part coming down on the car (its bottom crossing the car's roof height while overlapping its box by >= 1.2 m) crushes it; a slam
  // landing on it or a solid part moving into it at > 7 m/s throws it (damage, no catch); misses by a few metres are NEAR MISSes.
  // Events: {e:'catch'} (catchT), {e:'crush', id, x, y}, {e:'throw', id, x, y, vx, vy, vz, k 0-1, src}, {e:'near', id, w, d}.
  const PK = {FOOT:1, LEG:2, TAIL:3, BODY:4, ARM:5, GRAB:8, SLAM:9};
  const SOLID = k => k >= 1 && k <= 5;
  const COMMIT = [2.6, 2.0, 1.5], GRAB_ADJ = [-1.5, -0.75, 0];   // per difficulty: the commit time before the hit (s), grab size (m)
  function Parts(){ return {L:[], n:0, prev:new Map(), t:0, ok:false, cx:0, cy:0, R:0}; }
  function pAdd(B, id, k, x, y, a, hx, hy, z0, z1){
    let o = B.L[B.n]; if (!o) o = B.L[B.n] = {id:0, k:0, x:0, y:0, a:0, ca:1, sa:0, hx:1, hy:1, z0:0, z1:1, vx:0, vy:0, vz:0, gz:0};
    o.id = id; o.k = k; o.x = x; o.y = y; o.a = a; o.ca = Math.cos(a); o.sa = Math.sin(a); o.hx = hx; o.hy = hy; o.z0 = z0; o.z1 = z1; o.vx = o.vy = o.vz = 0; B.n++; return o;
  }
  // a capsule-ish segment p -> q (world [x, y, z]) of radius r
  function pSeg(B, id, k, p, q, r){ const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.sqrt(dx*dx + dy*dy);
    return pAdd(B, id, k, (p[0] + q[0])/2, (p[1] + q[1])/2, L > 1e-3 ? Math.atan2(dy, dx) : 0, L/2 + r, r, Math.min(p[2], q[2]) - r, Math.max(p[2], q[2]) + r); }
  // a box fixed to bone b: its rest-space AABB (mn, mx: model space at rest) posed with the bone; the long axis along the bone's
  // forward (model z) projected on the ground; floor: the lowest rest y (a sole: the toes' claws dig into the ground at rest)
  const _c = [0, 0, 0];
  function pBox(B, O, id, k, b, mn, mx, BN, floor){
    const qb = O.qj[b], pb = O.pj[b], r = BN[b].rest, W = O.W, f = qrot(qb, [0, 0, 1]), fx = W.c*f[0] + W.s*f[2], fy = W.s*f[0] - W.c*f[2];
    const fl = Math.hypot(fx, fy), ux = fl > 1e-3 ? fx/fl : Math.sin(PI - W.a), uy = fl > 1e-3 ? fy/fl : Math.cos(PI - W.a);
    let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9, z0 = 1e9, z1 = -1e9; const y0 = floor === undefined ? mn[1] : Math.max(mn[1], floor);
    for (let i = 0; i < 8; i++){ _c[0] = (i & 1 ? mx[0] : mn[0]) - r[0]; _c[1] = (i & 2 ? mx[1] : y0) - r[1]; _c[2] = (i & 4 ? mx[2] : mn[2]) - r[2];
      const v = qrot(qb, _c), mxp = pb[0] + v[0], myp = pb[1] + v[1], mzp = pb[2] + v[2], wx = W.x + W.c*mxp + W.s*mzp, wy = W.y + W.s*mxp - W.c*mzp, wz = W.z + myp;
      const u = wx*ux + wy*uy, w = -wx*uy + wy*ux; if (u < a0) a0 = u; if (u > a1) a1 = u; if (w < b0) b0 = w; if (w > b1) b1 = w; if (wz < z0) z0 = wz; if (wz > z1) z1 = wz; }
    const cu = (a0 + a1)/2, cw = (b0 + b1)/2;
    return pAdd(B, id, k, cu*ux - cw*uy, cu*uy + cw*ux, Math.atan2(uy, ux), (a1 - a0)/2, (b1 - b0)/2, z0, z1);
  }
  // after a species filled B: ground under each part and velocities (from the part's last place, by id)
  function pFinish(B, env, t){
    for (let i = 0; i < B.n; i++){ const o = B.L[i]; o.gz = env.ground(o.x, o.y); let P = B.prev.get(o.id);
      if (P && t - P.t > 1e-4 && t - P.t < 0.3){ const dt = t - P.t; o.vx = (o.x - P.x)/dt; o.vy = (o.y - P.y)/dt; o.vz = (o.z0 - P.z)/dt; }
      if (!P){ P = {x:0, y:0, z:0, t:0, rel:0}; B.prev.set(o.id, P); } P.relP = P.t === t ? P.relP : P.rel; P.x = o.x; P.y = o.y; P.z = o.z0; P.rel = o.z0 - o.gz; P.t = t; }
    B.t = t; B.ok = true;
  }
  // the signed separation of a part from a box (cx, cy, ca, sa, hx, hy) in the ground plane (SAT: > 0 a gap, < 0 the overlap depth)
  function sep2(o, cx, cy, ca, sa, hx, hy){
    const dx = cx - o.x, dy = cy - o.y; let best = -1e9;
    for (let i = 0; i < 4; i++){ const nx = i === 0 ? o.ca : i === 1 ? -o.sa : i === 2 ? ca : -sa, ny = i === 0 ? o.sa : i === 1 ? o.ca : i === 2 ? sa : ca;
      const s = Math.abs(dx*nx + dy*ny) - o.hx*Math.abs(o.ca*nx + o.sa*ny) - o.hy*Math.abs(-o.sa*nx + o.ca*ny) - hx*Math.abs(ca*nx + sa*ny) - hy*Math.abs(-sa*nx + ca*ny);
      if (s > best) best = s; }
    return best;
  }
  // the target's box: a car {x, y, z, psi, hl, hw, h} (defaults: a sedan), an aircraft a 18 m cube round it
  const TB = {x:0, y:0, ca:1, sa:0, hx:2.4, hy:1, z0:0, z1:1.5, air:false, gz:0, v:0};
  function tbox(T, env, tv){
    const gz = env.ground(T.x, T.y), z = T.z === undefined ? gz : +T.z || 0, air = T.kind === 'air' || z - gz > 25;
    let psi = T.psi; if (psi === undefined && tv && Math.hypot(tv.vx, tv.vy) > 1) psi = Math.atan2(tv.vy, tv.vx);
    TB.x = T.x; TB.y = T.y; TB.ca = Math.cos(psi || 0); TB.sa = Math.sin(psi || 0); TB.air = air; TB.gz = gz; TB.v = tv ? Math.hypot(tv.vx, tv.vy) : 0;
    if (air){ TB.hx = TB.hy = 9; TB.z0 = z - 3; TB.z1 = z + 3; } else { TB.hx = T.hl || 2.4; TB.hy = T.hw || 1; TB.z0 = Math.max(z, gz - 0.5); TB.z1 = TB.z0 + (T.h || 1.5); }
    return TB;
  }
  const zgap = (o, B) => Math.max(o.z0 - B.z1, B.z0 - o.z1);
  // one per hunt: X = {S, env, out, def, O, di, catchT, crushT}; step(dt, tvOf) after the pose; Bp the solid parts (also SGF1.obstacles)
  function Touch(X){
    const B = Parts(), G = Parts(), st = {act:0, k:0, p:0, gmin:1e9, gId:null, gT:null, slamDone:new Set(), smin:new Map(), cool:new Map(), nearT:-9, nearN:0, crushN:0, throwN:0, catchN:0, grabN:0, missN:0};
    function ev(e){ X.out.events.push(e); }
    function near(T, w, d){ const S = X.S; st.nearN++; if (S.t - st.nearT < 2.2) return; st.nearT = S.t; ev({e:'near', id:T.id, w, d:Math.round(d*10)/10}); }
    function throwT(T, o, vx, vy, vz, k, src, pk){ const S = X.S, key = T.id + ':' + (o ? o.id : src), c = st.cool.get(key); if (c !== undefined && S.t - c < (o ? 1.1 : 1.8)) return false;   // (one throw by the body per 1.8 s)
      st.cool.set(key, S.t); if (st.cool.size > 200) st.cool.clear(); st.throwN++; ev({e:'throw', id:T.id, x:Math.round(T.x), y:Math.round(T.y), vx:+vx.toFixed(1), vy:+vy.toFixed(1), vz:+vz.toFixed(1), k:+k.toFixed(2), src, pk:pk === undefined ? -1 : pk}); return true; }
    function step(dt, tvOf){
      const S = X.S, env = X.env, def = X.def, O = X.O; B.n = 0; G.n = 0; B.ok = false;
      if (!(S.r > 0.5) || !def.parts) return;
      const Ts = env.targets(); let any = false;
      for (const T of Ts) if (T && T.kind !== 'cam' && !T.army && Math.hypot(T.x - S.x, T.y - S.y) < (def.reachR || 700)) any = true;
      if (!any){ B.prev.clear(); return; }
      def.parts(O, S, env, B); pFinish(B, env, S.t);
      // the action and its windows
      const k = S.k | 0, hp = def.HIT_P[k], newAct = k !== st.k || S.p < st.p - 1e-6; 
      if (newAct){ if (st.gT && st.gmin < 1e8 && !(st.gT.nocatch)){ st.missN++; if (st.gmin < (def.nearR || 9)) near(st.gT, 'grab', st.gmin); } st.gmin = 1e9; st.gT = null; st.slamDone.clear(); st.smin.clear(); st.act++; }
      st.k = k; st.p = S.p;
      const grabK = !!(def.GRABK && def.GRABK[k]), slamK = !!(def.SLAMK && def.SLAMK[k]);
      const gWin = grabK && hp !== undefined && S.p >= hp - (def.grabPre || 0.05) && S.p <= hp + (def.grabWin || 0.12), sWin = slamK && hp !== undefined && S.p >= hp - 0.03 && S.p <= hp + 0.1;
      if (gWin && def.grab){ def.grab(O, S, G, k, GRAB_ADJ[X.di] || 0); pFinish(G, env, S.t); }
      if (sWin && def.slam){ const n0 = G.n; def.slam(O, S, G, k); for (let i = n0; i < G.n; i++) G.L[i].k = PK.SLAM; }
      for (const T of Ts){
        if (!T || T.kind === 'cam' || T.army) continue;
        const tv = tvOf ? tvOf(T) : null, C = tbox(T, env, tv), canLose = !T.nocatch;
        // the grab: only the action's own target, only grabbing parts, only in the window
        if (gWin && String(T.id) === String(S.target)){
          if (!st.gT){ st.gT = T; st.grabN++; }
          for (let i = 0; i < G.n; i++){ const o = G.L[i]; if (o.k !== PK.GRAB) continue; const d = Math.max(sep2(o, C.x, C.y, C.ca, C.sa, C.hx, C.hy), zgap(o, C));
            if (d <= 0 && (k !== 8 || C.air) && (k === 8 || !C.air)){ if (canLose){ st.catchN++; st.gT = null; st.gmin = 1e9; X.catchT(T); return; } }
            if (d < st.gmin) st.gmin = Math.max(0, d); }
        }
        if (C.air) continue;
        // a slam landing on it: thrown (damage), once per strike
        if (sWin && !st.slamDone.has(T.id)){ for (let i = 0; i < G.n; i++){ const o = G.L[i]; if (o.k !== PK.SLAM) continue; const d = Math.max(sep2(o, C.x, C.y, C.ca, C.sa, C.hx, C.hy), zgap(o, C));
            if (d <= 0.5){ let nx = C.x - o.x, ny = C.y - o.y; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; st.slamDone.add(T.id); throwT(T, o, nx*13, ny*13, 7, 0.85, 'slam'); break; }
            const m = st.smin.get(T.id); if (m === undefined || d < m) st.smin.set(T.id, d); } }
        else if (slamK && hp !== undefined && S.p > hp + 0.1 && !st.slamDone.has(T.id) && st.smin.has(T.id)){ const m = st.smin.get(T.id); st.smin.delete(T.id); st.slamDone.add(T.id); if (m < 8) near(T, 'slam', m); }
        // the solid parts: a foot coming down on it crushes it; a part moving into it throws it; a close pass at speed is a near miss
        const roof = C.z1 - C.gz + 0.2; let pass = 1e9;
        for (let i = 0; i < B.n; i++){ const o = B.L[i]; if (Math.abs(o.x - C.x) > o.hx + o.hy + 12 || Math.abs(o.y - C.y) > o.hx + o.hy + 12) continue;
          const d2 = sep2(o, C.x, C.y, C.ca, C.sa, C.hx, C.hy), dz = zgap(o, C), P = B.prev.get(o.id), rel = o.z0 - o.gz, relP = P && P.relP !== undefined ? P.relP : rel;
          const down = T.z - C.gz < 3 && relP > roof && rel <= roof;
          if (o.k === PK.FOOT && T.z - C.gz < 3){
            // (the car well under a foot that comes down on it)
            if (down && d2 <= -1.2 && o.vz < -1.5){ if (canLose){ st.crushN++; X.crushT(T, o); return; } }
            else if (down && d2 < 7) near(T, 'foot', Math.max(0, d2));
          } else if (down && d2 <= -0.3 && o.vz < -4 && st.landAct !== st.act){ st.landAct = st.act; let nx = C.x - o.x, ny = C.y - o.y; const l = Math.hypot(nx, ny) || 1; throwT(T, null, nx/l*8, ny/l*8, 4, 0.4, 'sweep', 100 + o.id); }   // a limb landing on it (once a strike)
          if (d2 <= 0.4 && dz <= 0.4){
            let nx = C.x - o.x, ny = C.y - o.y; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; const vo = Math.hypot(o.vx, o.vy), vc = vo > 30 ? 30/vo : 1, vap = Math.min(30, (o.vx*nx + o.vy*ny)*vc);   // (a claw's tip can sweep at 150 m/s: capped)
            // (arms lying on the streets writhe: solid, but they throw the car only while they sweep, k 4)
            if ((o.k !== PK.ARM || (S.k | 0) === 4) && vap > (def.throwV || 7)){ const v = Math.min(19, 0.7*vap + 4); throwT(T, null, nx*v + o.vx*vc*0.15, ny*v + o.vy*vc*0.15, 3 + 0.16*vap, Math.min(0.75, 0.12 + (vap - 7)/28), 'sweep', o.id); }
          } else if (dz < 1 && d2 > 0 && d2 < pass) pass = d2;
        }
        if (pass < 2.5 && C.v > 12) near(T, 'pass', pass);
      }
      // a grab window that closed without a catch
      if (grabK && hp !== undefined && S.p > hp + (def.grabWin || 0.12) && st.gT){ const T = st.gT; st.gT = null; st.missN++; if (st.gmin < (def.nearR || 9) && !T.nocatch) near(T, 'grab', st.gmin); st.gmin = 1e9; }
    }
    return {B, G, st, step};
  }
  // the aim of a strike follows its prey only until it is committed (COMMIT s before the hit moment, by difficulty)
  const committed = (S, def, di) => { const hp = def.HIT_P[S.k], ad = def.ACT_DUR[S.k] || 3; return hp !== undefined && S.p >= hp - (COMMIT[di] === undefined ? 1.1 : COMMIT[di])/ad; };

  // ---------------- the generic hunter (host / single player) ----------------
  // def hooks: DIFF[3], RISE_T, RISE_D, ACT_DUR, HIT_P, strideOf(v), pose(S, env, O, ctx), mkOut(), mkCtx(), ctxStep(ctx, S, env),
  //   init(api), speed(api, T, tv, dist) -> base speed, decide(api, T, tv, c) (pick a strike), track(api, T, tv) (an action following
  //   its target), hit(api, T, tv) (the hit moment), crush(api) (contacts with buildings every step), steer(api, hWant, turn, dt)
  //   (default: turn the heading), travel(S) (direction of travel, default hdg), wGoal(S), actSlow(k)
  //   v31: think(api, T, tv, c, dt) (every hunt step, before decide), move(api, vWant, hWant, turn, dt) (replaces the walk: speed,
  //   heading, position, gait, height - a flyer), body(O, S, out) (<= 24 spheres for the army), rise(api, dt) (the rise phase's own
  //   motion; return true when risen)
  function Sim(def, env, o){
    o = o || {};
    const di = clamp(o.difficulty === undefined ? 1 : o.difficulty | 0, 0, 2), D = def.DIFF[di], rng = mulb((o.seed | 0) || 1);
    const S = {sp:def.id, t:0, x:o.x || 0, y:o.y || 0, z:0, hdg:o.hdg || 0, phase:'rise', target:null, g:0, v:0, k:0, p:0, ax:0, ay:0, az:0, w:0.15, r:0, ly:0,
      cool:3, burst:0, burstCool:4, zg:0, caught:null, sweepCool:8, roared:false, hitDone:false, n:0};
    if (def.X) for (const X of def.X) S[X.n] = X.v0 || 0;
    armyInit(S);
    S.zg = env.ground(S.x, S.y); S.z = S.zg - def.RISE_D;
    const TV = new Map(), O = def.mkOut(), out = {events:[]}, ctx = def.mkCtx ? def.mkCtx() : null, HIT = new Set(), HITC = new Set(), LAST = new Map();
    const api = {S, D, di, env, rng, out, O, ctx, def, startAct, crushAt, catchT, crushT, bldTall, o, striking:false, armyAt, distT:1e9, T:null, tv:null};
    // v33: the block layer (18_block.js KI, bound at run time): ground creatures cut the player off on the escape route
    const BX = {S, env, D, di, rng, out, crushAt, topR:def.topR || 100}, BC = {hWant:0, vWant:0};
    const TC = Touch({S, env, out, def, O, di, catchT, crushT}), tvOf = T => TV.get(T.id);
    // units reached by a strike (HIT: once per strike, cleared when the strike lands) or by an attack contact (a cooldown per unit)
    function armyAt(x, y, z, r, e, px, py, contact){ if (contact){ HITC.clear(); return armyStrike(S, env, x, y, z, r, e, px, py, HITC, LAST, true); } return armyStrike(S, env, x, y, z, r, e, px, py, HIT, LAST, false); }
    if (def.init) def.init(api);
    function pickTarget(){
      const L = env.targets(); let best = null, bd = 1e18;
      for (const T of L){ const d = Math.hypot(T.x - S.x, T.y - S.y) - (T.id === S.target ? 150 : 0); if (d < bd){ bd = d; best = T; } }
      const A = armyPick(S, env, rng, best, best ? Math.hypot(best.x - S.x, best.y - S.y) : 1e9);
      return A || best;
    }
    function velOf(T, dt){
      let e = TV.get(T.id); if (!e){ e = {x:T.x, y:T.y, z:T.z || 0, vx:0, vy:0, vz:0}; TV.set(T.id, e); }
      if (dt > 0){ const k = 1 - Math.exp(-dt/0.6), vx = (T.x - e.x)/dt, vy = (T.y - e.y)/dt, vz = ((T.z || 0) - e.z)/dt;
        if (Math.hypot(vx, vy) < 400){ e.vx += (vx - e.vx)*k; e.vy += (vy - e.vy)*k; e.vz += (vz - e.vz)*k; } }
      e.x = T.x; e.y = T.y; e.z = T.z || 0; return e;
    }
    function startAct(kind, x, y, z){ S.k = kind; S.p = 0; S.ax = x; S.ay = y; S.az = z; S.hitDone = false; out.events.push({e:'act', k:kind, x, y, z}); }
    function step(dt){
      out.events.length = 0;
      S.t += dt; S.n++;
      const T = S.phase === 'hunt' || S.phase === 'rise' || S.phase === 'roar' ? pickTarget() : null;
      let tv = null; if (T){ tv = velOf(T, dt); S.target = T.id; }
      const dx = T ? T.x - S.x : 0, dy = T ? T.y - S.y : 0, dist = Math.hypot(dx, dy);
      let vWant = 0, hWant = def.travel ? def.travel(S) : S.hdg, turn = D.turn;
      api.T = T; api.tv = tv; armyDecay(S, dt);
      if (S.phase === 'rise'){
        S.r = Math.min(1, S.r + dt/def.RISE_T); vWant = def.riseV === undefined ? 3.5 : def.riseV; turn = 0.12;
        if (T) hWant = Math.atan2(dx, dy);
        if (S.r >= 1){ S.phase = 'roar'; startAct(6, S.x, S.y, S.z); out.events.push({e:'roar'}); }
      } else if (S.phase === 'roar'){
        vWant = 0; if (S.k !== 6 || S.p >= 1){ S.k = 0; S.p = 0; S.phase = 'hunt'; S.burstCool = 6; }
      } else if (S.phase === 'hunt' && T){
        const vNow = Math.max(9, S.v), lead = clamp(dist/vNow, 0, 7)*D.lead, px = T.x + tv.vx*lead, py = T.y + tv.vy*lead;
        hWant = Math.atan2(px - S.x, py - S.y);
        S.burst -= dt; S.burstCool -= dt;
        if (S.burst <= 0 && S.burstCool <= 0 && dist < 1100 && dist > 220){ S.burst = 6 + 2*rng(); S.burstCool = 14 + 6*rng(); out.events.push({e:'burst'}); }
        vWant = def.speed ? def.speed(api, T, tv, dist) : S.burst > 0 ? D.vburst : lerp(D.vb, D.vfar, sstep(500, 2200, dist));
        if (dist < (def.closeR || 160)) vWant = Math.min(vWant, def.closeV || 5);
        if (!def.flyer && !T.army && typeof KI !== 'undefined'){ BC.hWant = hWant; BC.vWant = vWant; if (KI.step(BX, T, tv, dist, dt, BC)){ hWant = BC.hWant; vWant = BC.vWant; } }
        const herr = Math.abs(wrapA(hWant - (def.travel ? def.travel(S) : S.hdg))); if (herr > 1.2) vWant *= 0.45;
        S.cool -= dt; S.sweepCool -= dt;
        vWant *= armySlow(S);
        if (def.think || (!S.k && S.cool <= 0)){
          const tz = T.z || 0, gz = env.ground(T.x, T.y), air = tz - gz > 25, ti = 1.4, qx = T.x + tv.vx*ti, qy = T.y + tv.vy*ti;
          const c = {dist, air, tz, gz, qx, qy, qd:Math.hypot(qx - S.x, qy - S.y), rel:wrapA(Math.atan2(qx - S.x, qy - S.y) - S.hdg), army:!!T.army, vWant, hWant};
          c.under = !air && !c.army && (dist < (def.underR || 0) || c.qd < (def.underR || 0)*0.75);   // v31: right under it: no grab / slam at it
          if (def.think){ def.think(api, T, tv, c, dt); vWant = c.vWant; hWant = c.hWant; }
          if (!S.k && S.cool <= 0) def.decide(api, T, tv, c);
        }
        if (S.k && !S.hitDone && def.track && !committed(S, def, di)) def.track(api, T, tv);   // v31: committed strikes fly to a fixed point
      } else if (S.phase === 'catch'){
        vWant = 0; const C = S.caughtT; if (C){ S.ax = C.x; S.ay = C.y; S.az = C.z; }
        if (S.k !== 7) S.phase = 'done';
      } else if (S.phase === 'won' || S.phase === 'done' || S.phase === 'crush'){
        vWant = 0;
        if (!S.roared){ S.roared = true; startAct(6, S.x, S.y, S.z); }
      }
      // actions advance; the hit moment
      if (S.k){
        S.p += dt/(def.ACT_DUR[S.k] || 3);
        const hp = def.HIT_P[S.k];
        if (hp !== undefined && !S.hitDone && S.p >= hp){ S.hitDone = true; HIT.clear(); api.striking = true; try { def.hit(api, T, tv); } finally { api.striking = false; } }
        if (S.k && S.p >= 1){ S.k = 0; S.p = 0; }
        if (S.k) vWant *= def.actSlow ? def.actSlow(S.k, S) : S.k === 6 ? 0 : 0.35;
      }
      // move: heavy acceleration, limited turn rate (a flyer has its own flight model: def.move)
      if (def.move) def.move(api, vWant, hWant, turn, dt);
      else {
        const acc = vWant > S.v ? (def.acc || 2.2) : (def.dec || 3.5); S.v += clamp(vWant - S.v, -acc*dt, acc*dt);
        if (def.steer) def.steer(api, hWant, turn, dt);
        else { const de = wrapA(hWant - S.hdg), tr = (turn + 0.008*S.v)*dt*(Math.abs(de) > 1.7 ? 0.6 : 1); S.hdg = wrapA(S.hdg + clamp(de, -tr, tr)); }   // (v31: an about-face is slow)
        const th = def.travel ? def.travel(S) : S.hdg;
        S.x += Math.sin(th)*S.v*dt; S.y += Math.cos(th)*S.v*dt;
        S.g = (S.g + dt*S.v/def.strideOf(S.v, S)) % 1;
        const gNow = def.groundAt ? def.groundAt(api) : (env.ground(S.x, S.y)*2 + env.ground(S.x + Math.sin(th)*40, S.y + Math.cos(th)*40) + env.ground(S.x - Math.sin(th)*30, S.y - Math.cos(th)*30))/4;
        S.zg += (gNow - S.zg)*Math.min(1, dt*1.2);
        const re = S.r >= 1 ? 1 : 1 - Math.pow(1 - S.r, 2.2);
        S.z = S.zg - def.RISE_D*(1 - re);
      }
      const wg = def.wGoal ? def.wGoal(S) : (S.phase === 'rise' ? 0.1 : S.k === 6 ? 0.95 : S.burst > 0 ? 0.7 : 0.5);
      S.w += (wg - S.w)*Math.min(1, dt*0.6);
      if (T){ const rel = wrapA(Math.atan2(dx, dy) - S.hdg); S.ly += (clamp(rel, -0.9, 0.9) - S.ly)*Math.min(1, dt*1.5); }
      if (def.preStep) def.preStep(api, dt);
      if (def.ctxStep) def.ctxStep(ctx, S, env);
      def.pose(S, env, O, ctx);
      if (o.destroy !== false && S.r >= 0.5 && env.bldNear) def.crush(api, dt);
      if (S.phase === 'hunt') TC.step(dt, tvOf); else TC.B.n = 0;   // v31: the prey's car against the body (crush, throws, grabs)
      return out;
    }
    // v31: a foot (or a rolling body, stabbing legs) came down on the target: it is crushed - the hunt ends, the creature roars over it
    function crushT(T, part){
      S.caught = T.id; S.caughtT = {x:T.x, y:T.y, z:T.z || 0}; S.phase = 'crush'; S.target = T.id; S.k = 0; S.p = 0; S.hitDone = true; S.roared = false; S.ax = T.x; S.ay = T.y; S.az = T.z || 0;
      out.events.push({e:'crush', id:T.id, x:T.x, y:T.y, part:part ? part.id : -1});
    }
    function catchT(T){
      S.caught = T.id; S.caughtT = {x:T.x, y:T.y, z:T.z || 0}; S.phase = 'catch'; S.k = 7; S.p = 0; S.ax = T.x; S.ay = T.y; S.az = T.z || 0; S.hitDone = true;
      out.events.push({e:'catch', id:T.id});
    }
    // buildings in reach: r the contact radius, below how far under the contact a building top may be; e the energy; (px, py) a push
    // direction (blended with the radial one), or mode 'in' (towards x, y: things sinking into a mass) / 'dir' (exactly px, py)
    const hitList = [];
    function crushAt(x, y, z, r, below, e, px, py, mode){
      if (api.striking) armyAt(x, y, z, r, e, mode === 'in' ? undefined : px, mode === 'in' ? undefined : py);
      hitList.length = 0;
      env.bldNear(x, y, r + 6, b => {
        if (env.destroyed(b.ti, b.idx)) return;
        const d = Math.hypot(b.cx - x, b.cy - y) - b.r; if (d > r) return;
        if (z + r < b.z0 || z - r - below > b.z1) return;
        hitList.push(b);
      });
      if (!hitList.length) return 0;
      const L = hitList.map(b => {
        let ux = b.cx - x, uy = b.cy - y; const l = Math.hypot(ux, uy);
        if (l > 1){ ux /= l; uy /= l; } else { ux = Math.sin(S.hdg); uy = Math.cos(S.hdg); }
        if (mode === 'in'){ ux = -ux; uy = -uy; }
        else if (mode === 'dir' && px !== undefined){ ux = px; uy = py; }
        else if (px !== undefined){ ux = ux*0.45 + px*0.55; uy = uy*0.45 + py*0.55; }
        const m = Math.hypot(ux, uy) || 1; ux /= m; uy /= m;
        return {tile:b.ti, idx:b.idx, b, ang:Math.atan2(uy, ux), fx:Math.round(ux*1000)/1000, fy:Math.round(uy*1000)/1000, e:Math.round(clamp(e === undefined ? 0.5 : e, 0, 1)*100)/100, z:Math.round(clamp(z, b.z0, b.z1))};
      });
      out.events.push({e:'destroy', list:L}); if (env.onDestroy) env.onDestroy(L);
      return L.length;
    }
    // the tallest standing building within r of (x, y) at least minH tall (and passing ok(b)), or null
    function bldTall(x, y, r, minH, ok){
      let best = null;
      env.bldNear(x, y, r, b => { if (b.h < minH || env.destroyed(b.ti, b.idx)) return; if (Math.hypot(b.cx - x, b.cy - y) > r) return; if (ok && !ok(b)) return; if (!best || b.h > best.h) best = b; });
      return best;
    }
    return {S, O, ctx, step, out, api, blk:BX, snap:() => snap(def, S), get pose(){ return O; }, D, hinder:h => armyHinder(S, h), touch:TC,
      win(){ if (S.phase === 'hunt' || S.phase === 'rise' || S.phase === 'roar'){ S.phase = 'won'; S.k = 0; S.p = 0; } },
      setCatchPos(x, y, z){ if (S.caughtT){ S.caughtT.x = x; S.caughtT.y = y; S.caughtT.z = z; } }};
  }
  // a species def gets the generic pieces bound to it
  function finish(def){
    def.snap = S => snap(def, S); def.unsnap = (s, o) => unsnap(def, s, o); def.interp = (a, b, u, o) => interp(def, a, b, u, o);
    def.Sim = (env, o) => Sim(def, env, o); def.NB = def.BN.length;
    if (!def.mkOut) def.mkOut = () => mkOut(def.NB);
    return add(def);
  }
  // the original creature, as a species (its own core KC, untouched)
  // cthulhu's body: pelvis, spine, chest, head and mantle, legs, arms, the seizing tentacles' clubs
  function bodyC(O, S, out){ let n = 0; const J = i => KC.jointW(O, i), BI = KC.BI;
    n = sph(out, n, O.pelvis, 40); n = sph(out, n, J(BI.sp1), 40); n = sph(out, n, J(BI.sp2), 40); n = sph(out, n, O.chest, 46); n = sph(out, n, O.head, 34);
    { const h = O.head; n = sph(out, n, [h[0], h[1], h[2] + 55], 30); }
    for (const F of O.feet){ n = sph(out, n, F.ankle, 22); n = sph(out, n, F.knee, 22); n = sph(out, n, vlerp(F.knee, F.hip, 0.5), 24); }
    n = sph(out, n, J(BI.farmL), 16); n = sph(out, n, J(BI.farmR), 16); n = sph(out, n, O.hands[0], 16); n = sph(out, n, O.hands[1], 16);
    n = sph(out, n, O.tip[0], 10); n = sph(out, n, O.tip[1], 10); n = sph(out, n, O.wingTip[0], 14); n = sph(out, n, O.wingTip[1], 14);
    out.length = n; return out; }
  // v31: cthulhu's solid parts (rest-space boxes of the LOD-0 mesh per bone: feet and toes - the sole at the ground -, shins, the
  // claws), the left seizing tentacle's club (the grab, k 5), the hands (k 8, an aircraft) and the slamming tentacle (k 1 / 2)
  const mir = (mn, mx) => [[-mx[0], mn[1], mn[2]], [-mn[0], mx[1], mx[2]]];
  const CB = [['foot', PK.FOOT, [15.6, 0.4, -29.2], [43.9, 20.8, 11.8], 0], ['toes', PK.FOOT, [14.9, -9.1, 14.5], [44.5, 10.1, 47.4], 0], ['shin', PK.LEG, [17, 17, -11.7], [42.6, 70.1, 26.3]],
    ['claw', PK.ARM, [54.3, 77.7, 34.8], [73.4, 107.6, 47.5]], ['hand', PK.ARM, [49.5, 101.1, 21.3], [73, 124.8, 42.8]]];
  function partsC(O, S, env, B){ let id = 0;
    for (const [n, k, mn, mx, fl] of CB) for (const sd of ['L', 'R']){ const m = sd === 'L' ? [mn, mx] : mir(mn, mx); pBox(B, O, id++, k, KC.BI[n + sd], m[0], m[1], KC.BN, fl); } }
  function grabC(O, S, B, k, adj){ const J = i => KC.jointW(O, i);
    // (only the club - the outer part of the last segment - seizes: the rest of the tentacle landing on the car does not)
    if (k === 5){ const T = KC.TENT[0].b, a = J(T[11]), e = O.tip[0]; pSeg(B, 52, PK.GRAB, [a[0] + (e[0] - a[0])*0.65, a[1] + (e[1] - a[1])*0.65, a[2] + (e[2] - a[2])*0.65], e, 6 + adj); }
    if (k === 8){ pSeg(B, 53, PK.GRAB, J(KC.BI.handL), O.hands[0], 15 + adj); pSeg(B, 54, PK.GRAB, J(KC.BI.handR), O.hands[1], 15 + adj); } }
  function slamC(O, S, B, k){ const T = KC.TENT[k === 2 ? 1 : 0].b, J = i => KC.jointW(O, i); for (let j = 5; j < 11; j++) pSeg(B, 60 + j, PK.SLAM, J(T[j]), J(T[j + 1]), 8); pSeg(B, 71, PK.SLAM, J(T[11]), O.tip[k === 2 ? 1 : 0], 8); }
  add({id:'cthulhu', zh:'克苏鲁', en:'Cthulhu', BN:KC.BN, BI:KC.BI, NB:KC.NB, pose:(P, env, O) => KC.pose(P, env, O), mkOut:KC.mkOut, mkCtx:null, ctxStep:null, body:bodyC,
    parts:partsC, grab:grabC, slam:slamC, GRABK:{5:1, 8:1}, SLAMK:{1:1, 2:1}, reachR:750,
    Sim:(env, o) => { const s = KC.Sim(env, o), sn = s.snap; s.snap = () => Object.assign({sp:'cthulhu'}, sn()); s.S.sp = 'cthulhu'; return s; },
    snap:S => Object.assign({sp:'cthulhu'}, KC.snap(S)), unsnap:(s, o) => { o = KC.unsnap(s, o); o.sp = 'cthulhu'; return o; }, interp:(a, b, u, o) => { o = KC.interp(a, b, u, o); o.sp = 'cthulhu'; return o; },
    strideOf:KC.strideOf, ACT_DUR:KC.ACT_DUR, HIT_P:KC.HIT_P, RISE_D:KC.RISE_D, RISE_T:KC.RISE_T});
  return {REG, ORDER, add, finish, get:id => REG[id] || null, sph, PK, SOLID, COMMIT, GRAB_ADJ, Parts, pAdd, pSeg, pBox, pFinish, sep2, tbox, Touch, committed, armyInit, armyHinder, armyDecay, armySlow, armyPick, armyStrike, ARMY_SLOW, Skel, mkOut, setW, writeM, mkFK, jointW, ptW, PL, plAdd, plBez, bezLen, plCurl, plHelix, plAt, limbPath, reachPath, sampleJoints, orientChain, ik2, qAim,
    snap, unsnap, interp, Sim, r1, r2, r3, r4};
})();
//</CORE>

// ---- 12_kraken.js ----
//<CORE>
/* ================= 北海巨妖 Kraken: a colossal cephalopod (original design) — skeleton, pose solver, hunter =================
   A wine-red, warty mantle ~135 m long riding up and back over a heavy head (two horned brows, gold eyes with bar pupils), a webbed
   crown of eight 200 m arms (two rows of suckers under each) and two 330 m hunting tentacles with hooked clubs; a frilled skirt-fin
   ripples along each side of the mantle. On land it heaves itself along on its arms: they reach out, plant, drag the body over
   them (two alternating groups of four), the mantle swaying; in the harbour it crawls on the sea bed with the mantle out of the
   water and spills ink. Attacks: an arm raised and slammed down (k 1 / 2), an arm wrapped around a tower that pulls it over
   (k 3), both front arms sweeping across the street (k 4), a hunting tentacle shot out to seize the car (k 5) and lift it to the
   eye (k 7), a rearing display with every arm flung up (k 6), the tentacles lashing up at an aircraft (k 8).
   Extras in the snapshot: ar = the action's radius (the wrapped tower's, signed: + left arm, - right arm). */
const KK = KB.finish((() => {
  const {clamp, lerp, sstep, wrapA, vsub, vadd, vsc, vdot, vcross, vlen, vnorm, vlerp, qmul, qrot, qax, qUnit, qX, qY, qZ} = KC.m;
  const PI = Math.PI, TAU = PI*2;
  const SK = KB.Skel(), {BN, BI, bone} = SK;
  const HC = 48;    // the crown (mouth ring) above the ground, at rest
  bone('root', null, 0, HC, 0); bone('head', 'root', 0, 64, -10); bone('m1', 'head', 0, 80, -32); bone('m2', 'm1', 0, 102, -63); bone('m3', 'm2', 0, 124, -95);
  bone('beak', 'root', 0, 38, 8);
  // the mantle's spine (rest) and its profile (radius across x / up), shared with the model
  const MANTLE = [[0, 58, 8, 24, 22], [0, 66, -10, 34, 32], [0, 82, -32, 43, 40], [0, 103, -63, 45, 41], [0, 124, -95, 33, 29], [0, 137, -115, 16, 14], [0, 142, -126, 2, 2]];
  const MB = ['head', 'head', 'm1', 'm2', 'm3', 'm3', 'm3'];
  // skirt fins along each side: three bones a side (ripple about the mantle's axis)
  const FIN = [];
  for (const [s, n] of [[1, 'L'], [-1, 'R']]) for (let i = 0; i < 3; i++){ const m = ['m1', 'm2', 'm3'][i], r = BN[BI[m]].rest, rr = [42, 44, 32][i]; FIN.push(bone('fin' + n + i, m, s*rr, r[1], r[2])); }
  // eight arms around the crown (angle 0 = forward, + = left), 10 bones each
  const NA = 10, LA = 200, ARMS = [];
  const AANG = [0.34, -0.34, 1.05, -1.05, 1.92, -1.92, 2.66, -2.66], AREACH = [128, 128, 114, 114, 102, 102, 95, 95];
  const OFF = [0, 0.5, 0.5, 0, 0.07, 0.57, 0.57, 0.07];
  AANG.forEach((a, i) => {
    const s = a > 0 ? 1 : -1, base = [Math.sin(a)*15, 42, Math.cos(a)*15], dir = vnorm([Math.sin(a), -0.32, Math.cos(a)]);
    const A = {i, a, s, base, dir, len:LA, r0:15, reach:AREACH[i], b:[], ph:i*2.3};
    for (let k = 0; k < NA; k++){ const p = vadd(base, vsc(dir, LA*k/NA)); A.b.push(bone('a' + i + '_' + k, k ? 'a' + i + '_' + (k - 1) : 'root', p[0], p[1], p[2])); }
    ARMS.push(A);
  });
  // two hunting tentacles between the front arms, 12 bones each
  const NT = 12, LT = 330, TENT = [];
  for (const s of [1, -1]){ const base = [s*7, 40, 13], dir = vnorm([s*0.12, -0.45, 1]), T = {s, base, dir, len:LT, r0:6.5, b:[]};
    for (let k = 0; k < NT; k++){ const p = vadd(base, vsc(dir, LT*k/NT)); T.b.push(bone('t' + (s > 0 ? 'L' : 'R') + '_' + k, k ? 't' + (s > 0 ? 'L' : 'R') + '_' + (k - 1) : 'root', p[0], p[1], p[2])); }
    TENT.push(T); }
  const NB = BN.length;
  const EYES = [[25, 68, 4], [-25, 68, 4]];
  const BETA = 0.62, strideOf = v => 70 + 2.6*Math.max(0, v);
  // actions: 1 / 2 arm slam (left / right front arm), 3 wrap a tower, 4 sweep, 5 seize (left tentacle), 6 rear up, 7 hold, 8 lash at an aircraft
  const ACT_DUR = [0, 3.4, 3.4, 6.5, 4.2, 3.8, 3.8, 4.5, 3.0], HIT_P = {1:0.5, 2:0.5, 3:0.55, 4:0.5, 5:0.52, 8:0.5};
  const pl = KB.PL(220), pl2 = KB.PL(220), PTS = [], PTS2 = [];
  function mkOut(){ const O = KB.mkOut(NB); O.feet = ARMS.map(() => ({ph:0, ankle:[0, 0, 0], stance:true})); return O; }
  const UP = [0, 1, 0];
  // the joints of one arm / tentacle along pl (blended with the joints in pts2 by wgt), oriented from the root's rotation
  function chainOut(O, bones, n, len, rd, wgt){
    KB.sampleJoints(pl, len, n, PTS);
    if (wgt > 0){ KB.sampleJoints(pl2, len, n, PTS2); for (let j = 0; j <= n; j++){ const a = PTS[j], b = PTS2[j]; a[0] += (b[0] - a[0])*wgt; a[1] += (b[1] - a[1])*wgt; a[2] += (b[2] - a[2])*wgt; } }
    KB.orientChain(PTS, n, rd, O.qj[0], bones, O);
    return PTS;
  }
  function pose(P, env, O){
    O = O || mkOut(); KB.setW(P, O);
    const t = P.t, v = Math.max(0, P.v || 0), A = clamp(v/3, 0, 1), S = strideOf(v), k = P.k | 0, pr = P.p || 0, g = P.g || 0, w = P.w === undefined ? 0.5 : P.w;
    const pp = O.pj, qq = O.qj, fk = KB.mkFK(BN, O);
    const roar = k === 6 ? sstep(0, 0.2, pr)*(1 - sstep(0.8, 1, pr)) : 0;
    const lunge = (k === 1 || k === 2) ? Math.sin(PI*clamp(pr*1.4, 0, 1))*0.12 : k === 3 ? sstep(0.45, 0.7, pr)*(1 - sstep(0.8, 1, pr))*0.1 : 0;
    // body: the crown heaves twice a cycle as the arms drag it; it rears up to roar
    const bob = -3.5*Math.cos(4*PI*g)*A, surge = 0.05*Math.sin(4*PI*g + 0.7)*A;
    pp[0] = [0, HC + bob + 46*roar, 4*Math.sin(4*PI*g)*A]; qq[0] = qmul(qX(0.04 + surge - 0.55*roar + lunge), qZ(0.035*Math.sin(TAU*g)*A));
    fk(BI.head, qmul(qY(clamp(P.ly || 0, -0.9, 0.9)*0.3), qX(0.03*Math.sin(t*0.4) + 0.12*roar)));
    const br = Math.sin(t*0.75);
    fk(BI.m1, qmul(qX(0.05*br - 0.12*roar), qY(0.06*Math.sin(TAU*g)*A + 0.04*Math.sin(t*0.3))));
    fk(BI.m2, qmul(qX(0.05 + 0.06*Math.sin(t*0.75 - 0.8) + 0.05*roar), qY(0.05*Math.sin(TAU*g - 0.8)*A)));
    fk(BI.m3, qmul(qX(0.07 + 0.08*Math.sin(t*0.75 - 1.6)), qY(0.06*Math.sin(TAU*g - 1.6)*A)));
    fk(BI.beak, qX(-0.45*roar - 0.25*(k === 7 ? sstep(0.3, 0.6, pr) : 0)));
    // the skirt fins ripple (a wave running back along each side)
    const ax1 = vnorm(vsub(BN[BI.m3].rest, BN[BI.m1].rest));
    for (let i = 0; i < FIN.length; i++){ const s = i < 3 ? 1 : -1, j = i % 3, a = s*(0.28*Math.sin(t*2.3 - j*1.25) + 0.12*roar); fk(FIN[i], qax(ax1[0], ax1[1], ax1[2], a)); }
    const rootQ = qq[0], rootP = pp[0], baseW = b => vadd(rootP, qrot(rootQ, vsub(b, BN[0].rest)));
    // ---- arms
    const spread = 0.88 + 0.28*w;
    for (const Ar of ARMS){
      const i = Ar.i, s = Ar.s, ph = (g + OFF[i]) % 1, F = O.feet[i];
      let cz, lift, th;
      if (ph < BETA){ const u = ph/BETA; cz = BETA*S*(0.5 - u); lift = 0; th = 0.3; }
      else { const u = (ph - BETA)/(1 - BETA), e = u*u*(3 - 2*u); cz = BETA*S*(-0.5 + e); lift = (24 + 0.16*S)*Math.sin(PI*u); th = 0.3 + 1.7*Math.sin(PI*u); }
      cz *= A; lift *= A; th = lerp(0.3, th, A);
      const R = Ar.reach*spread, sa = Math.sin(Ar.a), ca = Math.cos(Ar.a);
      let C = [sa*R, 0, ca*R + cz + 8];
      const cw = O.toW(C), gy = env.ground(cw[0], cw[1]) - P.z; C[1] = gy + 2.5 + lift;
      const B = baseW(Ar.base), d0 = qrot(rootQ, vnorm([Ar.dir[0], 0.28, Ar.dir[2]]));
      let tc = vnorm([C[0] - B[0], 0, C[2] - B[2]]), psi = s*(0.25 + 0.35*Math.sin(t*0.5 + i*1.7));
      const wv = {a:0.32 + 0.1*Math.sin(t*0.4 + Ar.ph), l:85 + 10*(i & 3), ph:Ar.ph + t*0.9 - g*TAU, h:s*(i & 1 ? 0.5 : -0.5)*(0.7 + 0.5*Math.sin(t*0.23 + i))};
      F.ph = ph; F.stance = ph < BETA && A > 0.3; F.ankle = O.toW(C); F.skip = false;
      // actions on this arm: the target contact Ca (direction ta, curl tha) with weight wa
      let Ca = null, ta = null, tha = 0, wa = 0, wrap = null;
      const front = i < 2, mine12 = (k === 1 && i === 0) || (k === 2 && i === 1);
      if (mine12){
        const E0 = O.toM(P.ax, P.ay, P.az), air = vadd(B, [s*55, 145, -10]), tAir = vnorm([s*0.3, 0.85, 0.45]), hp = HIT_P[k];
        if (pr < 0.28){ wa = sstep(0, 0.28, pr); Ca = air; ta = tAir; tha = 1.5; }
        else if (pr < hp){ const u = Math.pow(clamp((pr - 0.28)/(hp - 0.28), 0, 1), 1.6); Ca = vlerp(air, E0, u); Ca[1] += Math.sin(PI*u)*30; ta = vnorm(vlerp(tAir, vnorm([E0[0] - B[0], -0.3, E0[2] - B[2]]), u)); tha = lerp(1.5, 0.2, u); wa = 1; }
        else { Ca = [E0[0], E0[1] + 2, E0[2]]; ta = vnorm([E0[0] - B[0], 0, E0[2] - B[2]]); tha = 0.2; wa = 1 - sstep(0.72, 1, pr); }
      } else if (k === 3 && i === ((P.ar || 0) >= 0 ? 0 : 1)){
        // wrap a tower: reach the near side low down, coil up around it, squeeze, haul it over towards the body, let go
        const cT = O.toM(P.ax, P.ay, 0), gyT = env.ground(P.ax, P.ay) - P.z, top = P.az - P.z, rw = (Math.abs(P.ar || 20) + 9)*(1 - 0.28*sstep(0.42, 0.55, pr));
        const a0 = Math.atan2(B[0] - cT[0], B[2] - cT[2]), sg = s > 0 ? -1 : 1, y0 = gyT + Math.min(55, Math.max(12, (top - gyT)*0.22)), y1 = Math.max(y0 + 30, Math.min(top - 8, gyT + 175));
        const H0 = [cT[0] + Math.sin(a0)*rw, y0, cT[2] + Math.cos(a0)*rw], pitch = 0.32, tH = vnorm([sg*Math.cos(a0)*Math.cos(pitch), Math.sin(pitch), -sg*Math.sin(a0)*Math.cos(pitch)]);
        const rel = 1 - sstep(0.8, 1, pr), cb = sstep(0, 0.22, pr)*rel, wr = sstep(0.16, 0.42, pr)*rel*sstep(0.85, 1, cb);
        wrap = {cT, gyT, rw, a0, sg, y0, y1, pitch, wr, pull:1.25*sstep(0.55, 0.8, pr)*rel};
        Ca = H0; ta = tH; tha = 0.6; wa = cb;
      } else if (k === 4 && front){
        const u = sstep(0.15, 0.75, pr - (i === 1 ? 0.06 : 0)), al = s*lerp(1.75, -0.55, u);
        Ca = [Math.sin(al)*168, 0, Math.cos(al)*168 + 12]; const cw2 = O.toW(Ca); Ca[1] = env.ground(cw2[0], cw2[1]) - P.z + 24;
        ta = vnorm(vadd(vsc(vnorm([Ca[0] - B[0], 0, Ca[2] - B[2]]), 0.5), [-s*Math.cos(al)*0.8, 0, s*Math.sin(al)*0.8])); tha = 0.9; wa = sstep(0, 0.15, pr)*(1 - sstep(0.85, 1, pr));
      } else if (roar){
        Ca = vadd(B, [sa*95, 72 + 18*Math.sin(t*1.7 + i), ca*95]); ta = vnorm([sa*0.6, 1, ca*0.6]); tha = 2.6; psi = s*0.8; wa = roar;
      }
      if (wa > 0){ C = vlerp(C, Ca, wa); tc = vnorm(vlerp(tc, ta, wa)); th = lerp(th, tha, wa); F.skip = wa > 0.4; }
      if (wrap) wrapPath(B, d0, C, tc, Ar.len, wrap, th, psi, wa > 0.5 ? null : wv);
      else KB.limbPath(pl, B, d0, C, tc, th, psi, Ar.len, UP, wa > 0.5 ? null : wv);
      chainOut(O, Ar.b, NA, Ar.len, Ar.dir, 0);
    }
    // ---- the hunting tentacles: trailing on the ground in slow curls; shot out to seize, hold, lash at aircraft
    for (let i = 0; i < 2; i++){
      const T = TENT[i], s = T.s, B = baseW(T.base), d0 = qrot(rootQ, T.dir);
      let C = [s*44, 0, 62]; const cw = O.toW(C); C[1] = env.ground(cw[0], cw[1]) - P.z + 3;
      const tc = vnorm([s*0.75, 0, -0.35 + 0.25*Math.sin(t*0.27 + s)]), th = 2.3 + 0.5*Math.sin(t*0.35 + s), psi = s*(1.45 + 0.1*Math.sin(t*0.3));
      if (roar){ C = vlerp(C, vadd(B, [s*50, 130, 30]), roar); }
      KB.limbPath(pl, B, d0, C, roar ? vnorm(vlerp(tc, [s*0.3, 1, 0.3], roar)) : tc, lerp(th, 3.2, roar), psi, T.len, UP, {a:0.4, l:110, ph:t*0.7 + s, h:0});
      const mine = ((k === 5 || k === 7) && s > 0) || k === 8;
      let wgt = 0, coil = 0;
      if (mine){
        const E0 = O.toM(P.ax, P.ay, P.az), wind = vadd(B, [s*45, 125, -55]); let E;
        if (k === 7){ const face = [s*6, 78 + 46*roar, 82]; E = vlerp(E0, face, sstep(0.05, 0.7, pr)); wgt = 1 - sstep(0.85, 1, pr); coil = sstep(0, 0.06, pr); }
        else { const hp = HIT_P[k];
          if (pr < 0.28){ E = wind; wgt = sstep(0, 0.28, pr); }
          else if (pr < hp){ const u = Math.pow(clamp((pr - 0.28)/(hp - 0.28), 0, 1), 1.6); E = vlerp(wind, E0, u); E[1] += Math.sin(PI*u)*40; wgt = 1; }
          else if (pr < 0.72){ E = E0; wgt = 1; coil = k === 5 ? sstep(hp, hp + 0.08, pr) : 0; }
          else { const u = sstep(0.72, 1, pr); E = vlerp(E0, wind, u*0.5); wgt = 1 - u; coil = k === 5 ? 1 - u : 0; } }
        KB.reachPath(pl2, B, E, T.len, [0, 1, 0.15], 32);
      }
      const pts = chainOut(O, T.b, NT, T.len, T.dir, wgt);
      if (coil > 0){   // the club wraps around what it holds
        for (let j = NT - 3; j < NT; j++){ const a = pts[j], b = pts[j + 1], d = vnorm(vsub(b, a)), ax = vnorm(vcross(d, [0, 1, 0])), dd = qrot(qax(ax[0], ax[1], ax[2], (j - (NT - 4))*0.7*coil), d), seg = T.len/NT;
          pts[j + 1] = vadd(a, vsc(dd, seg)); }
        KB.orientChain(pts, NT, T.dir, rootQ, T.b, O);
      }
      O.tip[i] = O.toW(pts[NT]);
      if (i === 0) O.hold = (k === 5 || k === 7) ? O.toW(pts[NT - 1]) : O.tip[0];
    }
    KB.writeM(O, BN);
    for (let i = 0; i < 2; i++) O.eye[i] = KB.ptW(O, BI.head, vsub(EYES[i], BN[BI.head].rest));
    O.head = KB.jointW(O, BI.head); O.chest = KB.jointW(O, BI.m1); O.pelvis = KB.jointW(O, 0); O.mouth = KB.jointW(O, BI.beak);
    O.hands[0] = KB.jointW(O, ARMS[0].b[NA - 1]); O.hands[1] = KB.jointW(O, ARMS[1].b[NA - 1]);
    return O;
  }
  // the wrap path: base -> the tower's near side, a helix up around it (the part grown so far), the rest curling off its end; then the
  // whole coil hauled over about the tower's foot towards the body
  function wrapPath(B, d0, C, tc, L, W, th, psi, wv){
    pl2.n = 0;
    // (the same start as limbPath: when nothing is wrapped or pulled this is exactly the arm's ordinary path)
    let D = vlen(vsub(C, B)), h1 = 0.42*D, h2 = 0.36*D, P1 = vadd(B, vsc(d0, h1)), P2 = vsub(C, vsc(tc, h2)); const Lb = KB.bezLen(B, P1, P2, C, 12);
    if (Lb > L*0.94){ const k = L*0.92/Lb; C = vadd(B, vsc(vsub(C, B), k)); D *= k; h1 = 0.42*D; h2 = 0.36*D; P1 = vadd(B, vsc(d0, h1)); P2 = vsub(C, vsc(tc, h2)); }
    KB.plBez(pl2, B, P1, P2, C, 14);
    const i0 = pl2.n - 1, Lr = Math.max(0, L - pl2.L[pl2.n - 1]);
    const Lh = Lr*W.wr, cl = Math.cos(W.pitch), sl = Math.sin(W.pitch);
    if (Lh > 1){ const n = Math.max(4, Math.round(Lh/8)), ds = Lh/n, kk = cl/Math.max(1, W.rw);
      for (let j = 1; j <= n; j++){ const ss = j*ds, a = W.a0 + W.sg*ss*kk; KB.plAdd(pl2, W.cT[0] + Math.sin(a)*W.rw, C[1] + ss*sl, W.cT[2] + Math.cos(a)*W.rw); } }
    const e = pl2.n - 1, te = Lh > 1 && e > 0 ? vnorm([pl2.x[e] - pl2.x[e - 1], pl2.y[e] - pl2.y[e - 1], pl2.z[e] - pl2.z[e - 1]]) : tc;
    if (Lr - Lh > 1) KB.plCurl(pl2, [pl2.x[e], pl2.y[e], pl2.z[e]], te, UP, th, psi, Lr - Lh, Math.max(4, Math.min(28, Math.round((Lr - Lh)/7))), wv);
    // haul over: rotate everything from the tower contact on about the tower's foot, the top towards the body
    if (W.pull > 0.001){
      const px = W.cT[0], py = W.gyT, pz = W.cT[2]; let dx = -px, dz = -pz; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
      const kx = dz, kz = -dx, cb = Math.cos(W.pull), sb = Math.sin(W.pull);   // axis k = up x d (horizontal)
      for (let j = i0; j < pl2.n; j++){ const vx = pl2.x[j] - px, vy = pl2.y[j] - py, vz = pl2.z[j] - pz;
        const cx = -kz*vy, cy = kz*vx - kx*vz, cz = kx*vy, kd = kx*vx + kz*vz;   // k x v (k horizontal), Rodrigues
        pl2.x[j] = px + vx*cb + cx*sb + kx*kd*(1 - cb); pl2.y[j] = py + vy*cb + cy*sb; pl2.z[j] = pz + vz*cb + cz*sb + kz*kd*(1 - cb); }
      for (let j = 1; j < pl2.n; j++) pl2.L[j] = pl2.L[j - 1] + Math.hypot(pl2.x[j] - pl2.x[j - 1], pl2.y[j] - pl2.y[j - 1], pl2.z[j] - pl2.z[j - 1]);
    }
    // the chain samples pl: copy pl2 over
    pl.n = 0; for (let j = 0; j < pl2.n; j++) KB.plAdd(pl, pl2.x[j], pl2.y[j], pl2.z[j]);
  }

  // ---------------- the hunter ----------------
  const DIFF = [{vb:8.5, vburst:17, vfar:15, grab:18, cool:6.5, turn:0.26, lead:0.6},
                {vb:11, vburst:22, vfar:19, grab:26, cool:5, turn:0.32, lead:0.8},
                {vb:13.5, vburst:28, vfar:24, grab:34, cool:3.6, turn:0.4, lead:1.0}];
  function decide(api, T, tv, c){
    const S = api.S, D = api.D, rng = api.rng, env = api.env;
    if (c.air && c.dist < 340 && c.tz < S.z + 390){ api.startAct(8, c.qx, c.qy, c.tz); S.cool = D.cool*0.8; return; }
    if (!c.air && !c.under && c.qd < 300 && Math.abs(c.rel) < 1.3 && (c.qd > 190 || rng() < 0.45 + 0.1*api.di)){ api.startAct(5, c.qx, c.qy, env.ground(c.qx, c.qy) + 1); S.cool = D.cool; return; }
    if (!c.air && !c.under && c.qd < 195 && Math.abs(c.rel) < 1.4){ api.startAct(c.rel > 0 ? 2 : 1, c.qx, c.qy, env.ground(c.qx, c.qy) + 1); S.cool = D.cool*1.05; return; }
    if (S.sweepCool <= 0){
      // a tower within an arm's reach ahead: wrap it and haul it over
      const fx = Math.sin(S.hdg), fy = Math.cos(S.hdg);
      const b = api.bldTall(S.x + fx*80, S.y + fy*80, 95, 55, b => { const rl = wrapA(Math.atan2(b.cx - S.x, b.cy - S.y) - S.hdg), d = Math.hypot(b.cx - S.x, b.cy - S.y); return Math.abs(rl) < 1.1 && d > 45 && d < 145; });
      if (b){ const rl = wrapA(Math.atan2(b.cx - S.x, b.cy - S.y) - S.hdg); api.startAct(3, b.cx, b.cy, b.z1); S.ar = (rl > 0 ? -1 : 1)*Math.max(6, Math.round(b.r)); S.sweepCool = 9 + 6*rng(); S.cool = 2.5; return; }
      if (c.dist < 900){ api.startAct(4, S.x, S.y, S.z); S.sweepCool = 9 + 8*rng(); S.cool = 2.5; }
    }
  }
  function track(api, T, tv){
    const S = api.S; if (S.k !== 5) return;
    const ti = Math.max(0, (HIT_P[5] - S.p)*ACT_DUR[5]); S.ax = T.x + tv.vx*ti; S.ay = T.y + tv.vy*ti; S.az = api.env.ground(S.ax, S.ay) + 1;
  }
  function hit(api, T){
    const S = api.S, k = S.k, O = api.O, env = api.env, D = api.D;
    api.out.events.push({e:'hit', k, x:S.ax, y:S.ay, z:S.az});
    // (v31: the club catches only by touching the car in the window, a slam throws it only where the arm lands on it: KB.Touch)
    if (k === 1 || k === 2 || k === 5) api.crushAt(S.ax, S.ay, env.ground(S.ax, S.ay), k === 5 ? 30 : 58, 40, k === 5 ? 0.7 : 0.95);
    if (k === 3){   // the wrapped tower comes over towards the body; what stands at its foot goes with it
      let fx = S.x - S.ax, fy = S.y - S.ay; const l = Math.hypot(fx, fy) || 1; fx /= l; fy /= l;
      const gz = env.ground(S.ax, S.ay);
      api.crushAt(S.ax, S.ay, gz + 40, Math.abs(S.ar || 20) + 4, 60, 0.88, fx, fy, 'dir');
      api.crushAt(S.ax + fx*60, S.ay + fy*60, gz + 10, 40, 10, 0.6, fx, fy);
    }
    if (k === 4){   // the sweep: everything in the arc in front, knocked along the sweep
      for (let i = -3; i <= 3; i++){ const a = S.hdg + i*0.38, x = S.x + Math.sin(a)*168, y = S.y + Math.cos(a)*168, gz = env.ground(x, y);
        api.crushAt(x, y, gz + 24, 30, 24, 0.9, Math.cos(a), -Math.sin(a)); }
    }
    void T; void O; void D;
  }
  // v31: solid parts - the arms where they lie on the streets (the outer half crushes when it plants on the car), the hunting
  // tentacles trailing on the ground; the grab: the left club (k 5), both clubs at an aircraft (k 8); the slam: the front arm (k 1 / 2)
  const AR_R = [16, 14, 12.5, 11, 10.5, 9.2, 7.9, 6.4, 5.0, 4.0], TT_R = [6.4, 5.8, 5.4, 5.1, 4.8, 4.5, 4.3, 4.0, 4.0, 6.3, 6.7, 6.5], PK = KB.PK;
  const armEnd = (O, A) => KB.ptW(O, A.b[NA - 1], vsc(A.dir, LA/NA));
  function parts(O, S, env, B){
    const J = i => KB.jointW(O, i);
    const k = S.k | 0, skip = (k === 1 || k === 2) ? (k === 2 ? 1 : 0) : -1;   // (the slamming arm is judged as a slam, not as a foot)
    for (const A of ARMS) for (let j = 3; j < NA; j++) if (A.i !== skip) KB.pSeg(B, A.i*10 + j, j < 7 ? PK.ARM : PK.FOOT, J(A.b[j]), j < NA - 1 ? J(A.b[j + 1]) : armEnd(O, A), AR_R[j]);   // (the tips crush)
    for (let ti = 0; ti < 2; ti++){ const T = TENT[ti]; for (let j = 4; j < NT; j++) KB.pSeg(B, 80 + ti*12 + j, PK.ARM, J(T.b[j]), j < NT - 1 ? J(T.b[j + 1]) : O.tip[ti], TT_R[j]); }
  }
  function grab(O, S, B, k, adj){ const J = i => KB.jointW(O, i);
    // (only the club - the outer part of the last segment - seizes)
    for (let ti = 0; ti < (k === 8 ? 2 : 1); ti++){ const a = J(TENT[ti].b[NT - 1]), e = O.tip[ti]; KB.pSeg(B, 120 + ti, PK.GRAB, [a[0] + (e[0] - a[0])*0.65, a[1] + (e[1] - a[1])*0.65, a[2] + (e[2] - a[2])*0.65], e, 6 + adj); } }
  function slam(O, S, B, k){ const A = ARMS[k === 2 ? 1 : 0], J = i => KB.jointW(O, i); for (let j = 5; j < NA; j++) KB.pSeg(B, 140 + j, PK.SLAM, J(A.b[j]), j < NA - 1 ? J(A.b[j + 1]) : armEnd(O, A), AR_R[j] + 2); }
  // contacts every step: crown, head, mantle; the arms where they arch over and lie on the streets (half the arms per step); the arm or
  // tentacle in action along its length
  function crush(api){
    const S = api.S, O = api.O, cr = api.crushAt, px = Math.sin(S.hdg), py = Math.cos(S.hdg), eb = clamp(0.36 + 0.016*S.v, 0.3, 0.75);
    const at = (bi, r, e) => { const p = KB.jointW(O, bi); cr(p[0], p[1], p[2], r, 0, e, px, py); };
    at(0, 36, eb); at(BI.head, 30, eb); at(BI.m1, 32, eb); at(BI.m2, 26, eb*0.8);
    const half = S.n & 1;
    for (const Ar of ARMS){
      const act = ((S.k === 1 && Ar.i === 0) || (S.k === 2 && Ar.i === 1) || (S.k === 3 && Ar.i === ((S.ar || 0) >= 0 ? 0 : 1)) || (S.k === 4 && Ar.i < 2));
      if (act){ if (!(S.k === 3 && !S.hitDone)) for (let j = 3; j < NA; j += 1) at(Ar.b[j], 15, 0.88); continue; }   // (a wrapped tower stands until it is hauled over)
      if ((Ar.i >> 1 & 1) !== half) continue;
      at(Ar.b[3], 13, eb); at(Ar.b[6], 12, eb);
    }
    if (S.k === 5 || S.k === 7 || S.k === 8) for (let j = 6; j < NT; j += 2){ at(TENT[0].b[j], 12, 0.8); if (S.k === 8) at(TENT[1].b[j], 12, 0.8); }
  }
  // v31: the body as spheres (the army's aim / impact points)
  function body(O, S, out){ let n = 0; const sp = KB.sph, J = i => KB.jointW(O, i);
    n = sp(out, n, J(0), 34); n = sp(out, n, J(BI.head), 30); n = sp(out, n, J(BI.m1), 34); n = sp(out, n, J(BI.m2), 32); n = sp(out, n, J(BI.m3), 24);
    for (const Ar of ARMS){ n = sp(out, n, J(Ar.b[3]), 13); n = sp(out, n, J(Ar.b[7]), 11); }
    n = sp(out, n, O.tip[0], 9); n = sp(out, n, O.tip[1], 9); out.length = n; return out; }
  return {id:'kraken', zh:'北海巨妖', en:'Kraken', BN, BI, ARMS, TENT, FIN, MANTLE, MB, EYES, NA, NT, HC, pose, mkOut, mkCtx:null, ctxStep:null, body,
    parts, grab, slam, GRABK:{5:1, 8:1}, SLAMK:{1:1, 2:1}, reachR:700, underR:65, throwV:11,
    DIFF, RISE_T:20, RISE_D:150, ACT_DUR, HIT_P, BETA, strideOf, decide, track, hit, crush,
    X:[{n:'ar', q:0, m:'act', v0:0}], riseV:3, closeR:150, closeV:6};
})());
//</CORE>

// ---- 13_crab.js ----
//<CORE>
/* ================= 铁甲巨蟹 Ironclad Crab: a colossal armoured crab (original design) — skeleton, pose solver, hunter =================
   A broad, angular carapace ~140 m wide (dark slate shell mottled rust, crusted with barnacles, a serrated front margin with a long
   spine at each side, seams that glow cyan at night), eyes on stalks, eight jointed walking legs (~130 m reach, knees high) and two
   huge claws, the right a heavy crusher, the left a slimmer cutter. It scuttles sideways fast (alternating tetrapod gait: four legs
   down while four swing), turns to face its prey to strike: a claw shot out to pinch through a tower or a car (k 1 left / 2 right),
   rearing up to stab down with the front legs (k 3), a sweep of the big claw across the street (k 4), the crusher snapping on the car
   (k 5) and lifting it to the mouthparts (k 7), a threat display with both claws raised wide (k 6), claws snapping at an aircraft (k 8).
   Extras in the snapshot: cr = the crab angle (direction of travel minus the way the body faces; +-pi/2 scuttling), ar = action radius. */
const KCR = KB.finish((() => {
  const {clamp, lerp, sstep, wrapA, vsub, vadd, vsc, vdot, vcross, vlen, vnorm, vlerp, qmul, qrot, qax, qUnit, qX, qY, qZ, qFrame} = KC.m;
  const PI = Math.PI, TAU = PI*2;
  const SK = KB.Skel(), {BN, BI, bone} = SK;
  const HB = 62;    // body (root) height at rest
  bone('root', null, 0, HB, 0); bone('cara', 'root', 0, 66, 0);
  bone('eyeL', 'cara', 14, 73, 47); bone('eyeR', 'cara', -14, 73, 47);
  bone('mxL', 'root', 7, 50, 46); bone('mxR', 'root', -7, 50, 46); bone('ab', 'root', 0, 46, -28);
  const EYE_TIP = [3, 14, 6];   // stalk tip relative to the stalk's root
  // legs: four a side, front to rear; hips under the carapace edge, each leg in a vertical plane turned by yaw a from straight out
  const LEGS = [], LZ = [30, 10, -12, -32], LA = [0.62, 0.2, -0.22, -0.62];
  for (const [s, n] of [[1, 'L'], [-1, 'R']]) for (let j = 0; j < 4; j++){
    const a = LA[j], o = [s*Math.cos(a), 0, Math.sin(a)], H0 = [s*60, 57, LZ[j]], m = vadd(H0, vsc(o, 12)), p = vadd(vadd(m, vsc(o, 70)), [0, 22, 0]), d = vadd(vadd(p, vsc(o, 30)), [0, -56, 0]);
    const L = {s, j, n:n + j, o, a, b:[bone('lc' + n + j, 'root', ...H0), bone('lm' + n + j, 'lc' + n + j, ...m), bone('lp' + n + j, 'lm' + n + j, ...p), bone('ld' + n + j, 'lp' + n + j, ...d)], tip:vadd(vadd(d, vsc(o, 6)), [0, -24, 0])};
    L.Lm = vlen(vsub(p, m)); L.Lp = vlen(vsub(d, p)); L.Ld = vlen(vsub(L.tip, d));
    L.pole0 = vnorm(vadd(vsc([0, 1, 0], 0.8), vsc(o, 0.6)));
    LEGS.push(L);
  }
  // the gait groups: L0 R1 L2 R3 against R0 L1 R2 L3
  const LOFF = LEGS.map(L => ((L.s > 0) === (L.j % 2 === 0) ? 0 : 0.5) + 0.035*L.j);
  // claws: coxa, merus, carpus, hand (the palm + the fixed finger), the movable finger; the right one (crusher) bigger
  const CLAWS = [];
  for (const [s, n] of [[1, 'L'], [-1, 'R']]){
    const sc = s > 0 ? 0.95 : 1.25, cx = [s*40, 54, 46], m = [s*50, 54, 56], k = [s*76, 62, 104], h = [s*66, 62, 140], hd = vnorm([-s*0.15, 0.04, 1]), palm = 62*sc;
    const f = vadd(vadd(h, vsc(hd, palm)), [0, 9*sc, 0]);
    // (jaw: wrist to the opening between the fingers, where the claw closes on its prey: its aim point, v31)
    const C = {s, n, sc, palm, fing:42*sc, jaw:palm*0.95 + 0.11*(palm*0.05 + 42*sc), hd0:hd, b:[bone('kc' + n, 'root', ...cx), bone('km' + n, 'kc' + n, ...m), bone('kk' + n, 'km' + n, ...k), bone('kh' + n, 'kk' + n, ...h), bone('kf' + n, 'kh' + n, ...f)]};
    C.Lm = vlen(vsub(k, m)); C.Lc = vlen(vsub(h, k)); C.pole0 = vnorm([s*0.7, 0.6, -0.3]);
    CLAWS.push(C);
  }
  const NB = BN.length;
  const BETA = 0.5, strideOf = v => 46 + 1.5*Math.max(0, v);
  // actions: 1 / 2 pinch (left / right claw), 3 stab with the front legs, 4 sweep (right claw), 5 seize (right claw), 6 display,
  // 7 hold, 8 snap at an aircraft
  const ACT_DUR = [0, 3.0, 3.0, 3.4, 3.6, 3.8, 3.4, 4.5, 2.8], HIT_P = {1:0.5, 2:0.5, 3:0.52, 4:0.5, 5:0.5, 8:0.5};
  function mkOut(){ const O = KB.mkOut(NB); O.feet = LEGS.map(() => ({ph:0, ankle:[0, 0, 0], stance:true})); O.claws = [[0, 0, 0], [0, 0, 0]]; return O; }
  const UP = [0, 1, 0];
  function pose(P, env, O){
    O = O || mkOut(); KB.setW(P, O);
    const t = P.t, v = Math.max(0, P.v || 0), A = clamp(v/3, 0, 1), S = strideOf(v), k = P.k | 0, pr = P.p || 0, g = P.g || 0, cr = P.cr || 0;
    const pp = O.pj, qq = O.qj, fk = KB.mkFK(BN, O);
    const roar = k === 6 ? sstep(0, 0.2, pr)*(1 - sstep(0.82, 1, pr)) : 0;
    const stab = k === 3 ? sstep(0, 0.3, pr)*(1 - sstep(0.75, 1, pr)) : 0, stabDn = k === 3 ? sstep(0.38, 0.5, pr)*(1 - sstep(0.75, 1, pr)) : 0;
    // travel direction in model space (x left, z forward): the body faces z, it moves cr clockwise of that
    const td = [-Math.sin(cr), 0, Math.cos(cr)];
    // ---- body: bob twice a cycle, lean into the direction of travel, rear for the stab, rise for the display
    const bob = -2.5*Math.cos(4*PI*g)*A;
    pp[0] = [0, HB + bob + 22*roar + 34*stab - 20*stabDn, -12*stab];
    qq[0] = qmul(qmul(qX(-0.32*stab + 0.25*stabDn - 0.08*roar), qZ(0.06*Math.sin(cr)*A + 0.03*Math.sin(TAU*g)*A)), qY(0.025*Math.sin(TAU*g)*A));
    fk(BI.cara, qX(0.015*Math.sin(t*0.6)));
    for (const [s, n] of [[1, 'L'], [-1, 'R']]){
      fk(BI['eye' + n], qmul(qY(clamp(P.ly || 0, -0.9, 0.9)*0.5 + 0.12*Math.sin(t*0.9 + s)), qmul(qZ(-s*0.1*roar), qX(-0.1 - 0.35*roar + 0.05*Math.sin(t*1.3 + s)))));
      fk(BI['mx' + n], qX(0.22*Math.sin(t*7 + s*1.3)*(0.25 + roar + (k === 7 ? 1 : 0))));
    }
    fk(BI.ab, qX(0.02*Math.sin(t*0.5)));
    const rootQ = qq[0];
    // ---- legs: planted feet slide back along the travel direction, swinging ones arc forward; two-bone IK to the ankle, the dactyl down
    for (let li = 0; li < LEGS.length; li++){
      const L = LEGS[li], s = L.s, ph = (g + LOFF[li]) % 1, F = O.feet[li];
      let sl, lift;
      if (ph < BETA){ const u = ph/BETA; sl = BETA*S*(0.5 - u); lift = 0; }
      else { const u = (ph - BETA)/(1 - BETA), e = u*u*(3 - 2*u); sl = BETA*S*(-0.5 + e); lift = (16 + 0.12*S)*Math.sin(PI*u); }
      sl *= A; lift *= A;
      const reach = 116 + 8*roar - 4*Math.abs(L.j - 1.5);
      let Fm = [BN[L.b[0]].rest[0] + L.o[0]*reach + td[0]*sl, 0, BN[L.b[0]].rest[2] + L.o[2]*reach + td[2]*sl];
      // the front pairs stab down around the target (and lift high first)
      if (k === 3 && L.j < 2){ const E = O.toM(P.ax, P.ay, P.az), off = [s*(14 + 10*L.j), 0, 6 - 12*L.j], Es = [E[0] + off[0], 0, E[2] + off[2]], up = sstep(0, 0.32, pr)*(1 - stabDn);
        const wv = sstep(0, 0.25, pr)*(1 - sstep(0.75, 1, pr)); Fm = vlerp(Fm, Es, wv); lift = lerp(lift, 120*up, wv); }
      const fw = O.toW(Fm), gy = env.ground(fw[0], fw[1]) - P.z; Fm[1] = gy + lift + (roar ? 0 : 0);
      F.ph = ph; F.stance = ph < BETA && A > 0.3; F.ankle = O.toW(Fm); F.skip = k === 3 && L.j < 2;
      // coxa swings a little with the step; IK from the merus joint
      fk(L.b[0], qY(s*0.12*Math.sin(TAU*ph)*A));
      const Hm = vadd(pp[L.b[0]], qrot(qq[L.b[0]], vsub(BN[L.b[1]].rest, BN[L.b[0]].rest)));
      const ow = qrot(rootQ, L.o), pole = vnorm(vadd(vsc(qrot(rootQ, UP), 0.8), vsc(ow, 0.6)));
      const At = vadd(vadd(Fm, [0, L.Ld*0.95, 0]), vsc(ow, -L.Ld*0.25));
      const R = KB.ik2(Hm, At, L.Lm, L.Lp, pole);
      const rM = vnorm(vsub(BN[L.b[2]].rest, BN[L.b[1]].rest)), rP = vnorm(vsub(BN[L.b[3]].rest, BN[L.b[2]].rest)), rD = vnorm(vsub(L.tip, BN[L.b[3]].rest));
      pp[L.b[1]] = Hm; qq[L.b[1]] = qFrame(rM, L.pole0, vnorm(vsub(R.k, Hm)), pole);
      pp[L.b[2]] = R.k; qq[L.b[2]] = qFrame(rP, L.pole0, vnorm(vsub(R.e, R.k)), pole);
      pp[L.b[3]] = R.e; const dd = vsub(Fm, R.e); qq[L.b[3]] = qFrame(rD, L.pole0, vlen(dd) > 1 ? vnorm(dd) : [0, -1, 0], pole);
    }
    // ---- claws: IK to a wrist target, the hand aimed, the finger opened / snapped shut
    for (let ci = 0; ci < 2; ci++){
      const C = CLAWS[ci], s = C.s, big = s < 0;
      fk(C.b[0], qY(-s*0.05*Math.sin(t*0.7)));
      const Sh = vadd(pp[C.b[0]], qrot(qq[C.b[0]], vsub(BN[C.b[1]].rest, BN[C.b[0]].rest)));
      // idle: held up in front of the face, palms in, a slow menace
      let W = [s*50, HB - 6 + bob + 22*roar + 34*stab, 100 + 4*Math.sin(t*0.8 + s)], hd = vnorm([-s*0.78, 0.04, 0.62]), fo = 0.12 + 0.06*Math.sin(t*1.3 + s), up = UP, wa = 0;
      let Wa = null, ha = null, fa = 0, ua = UP;
      // (v31: the jaws on the aim point; a point too close for the long claw is taken from above: the hand turned down until the wrist is
      // reachable, found by bisection so that it moves smoothly)
      const lo = Math.abs(C.Lm - C.Lc) + 0.3*Math.min(C.Lm, C.Lc), DN = [0, -1, 0];
      const aim = (E, open, wgt) => { const h2 = vnorm(vsub(E, Sh)), far = u => vlen(vsub(vsub(E, vsc(vnorm(vlerp(h2, DN, u)), C.jaw)), Sh)) >= lo;
        let hdir = h2; if (!far(0)){ let a = 0, b = 0.85; if (far(b)){ for (let i = 0; i < 7; i++){ const m = (a + b)/2; if (far(m)) b = m; else a = m; } } hdir = vnorm(vlerp(h2, DN, b)); }
        Wa = vsub(E, vsc(hdir, C.jaw)); ha = hdir; fa = open; wa = wgt; ua = vnorm(vsub(UP, vsc(hdir, vdot(UP, hdir)))); };
      const mine = ((k === 1 && s > 0) || (k === 2 && s < 0) || ((k === 5 || k === 7) && big) || k === 8);
      if (mine && k !== 7){
        const E = O.toM(P.ax, P.ay, P.az), hp = HIT_P[k];
        const open = pr < hp - 0.04 ? 0.75*sstep(0, 0.3, pr) : 0.75*(1 - sstep(hp - 0.04, hp + 0.01, pr));
        if (pr < hp){ const u = sstep(0, hp - 0.05, pr), E2 = vlerp(vadd(Sh, [s*40, 50, 60]), E, u); aim(E2, open, sstep(0, 0.25, pr)); }
        else aim(E, open, 1 - sstep(0.75, 1, pr));
      } else if (k === 7 && big){ const face = [s*18, HB + 30, 104]; aim(vlerp(O.toM(P.ax, P.ay, P.az), face, sstep(0.05, 0.6, pr)), 0, 1 - sstep(0.88, 1, pr)); }
      else if (k === 4 && big){
        const u = sstep(0.12, 0.8, pr), al = lerp(-1.75, 1.2, u), E = [Math.sin(al)*155, 0, Math.cos(al)*155 + 20], ew = O.toW(E); E[1] = env.ground(ew[0], ew[1]) - P.z + 28;
        Wa = vsub(E, vsc([Math.cos(al), 0, -Math.sin(al)], -C.palm*0.5)); ha = vnorm([Math.cos(al)*0.7 + Math.sin(al)*0.3, -0.1, -Math.sin(al)*0.7 + Math.cos(al)*0.3]); fa = 0.3; wa = sstep(0, 0.12, pr)*(1 - sstep(0.85, 1, pr)); ua = UP;
      } else if (roar || stab){
        const r2 = Math.max(roar, stab); Wa = [s*92, HB + 95 + 12*Math.sin(t*1.1 + s), 78]; ha = vnorm([s*0.35, 0.65, 0.68]); fa = 0.85*r2; wa = r2; ua = vnorm([0, -0.7, 0.7]);
      }
      if (wa > 0){ W = vlerp(W, Wa, wa); hd = vnorm(vlerp(hd, ha, wa)); fo = lerp(fo, fa, wa); up = vnorm(vlerp(up, ua, wa)); }
      const pole = vnorm(qrot(rootQ, C.pole0)), R = KB.ik2(Sh, W, C.Lm, C.Lc, pole);
      const rM = vnorm(vsub(BN[C.b[2]].rest, BN[C.b[1]].rest)), rC = vnorm(vsub(BN[C.b[3]].rest, BN[C.b[2]].rest));
      pp[C.b[1]] = Sh; qq[C.b[1]] = qFrame(rM, C.pole0, vnorm(vsub(R.k, Sh)), pole);
      pp[C.b[2]] = R.k; qq[C.b[2]] = qFrame(rC, C.pole0, vnorm(vsub(R.e, R.k)), pole);
      pp[C.b[3]] = R.e; qq[C.b[3]] = qFrame(C.hd0, UP, hd, up);
      // the finger: its joint follows the hand; it opens about the hand's side axis
      const sideR = vnorm(vcross(C.hd0, UP));
      pp[C.b[4]] = vadd(R.e, qrot(qq[C.b[3]], vsub(BN[C.b[4]].rest, BN[C.b[3]].rest))); qq[C.b[4]] = qmul(qq[C.b[3]], qax(sideR[0], sideR[1], sideR[2], fo));
      // finger tips (world): the fixed one and the movable one
      const tipF = vadd(R.e, qrot(qq[C.b[3]], vadd(vsc(C.hd0, C.palm + C.fing), [0, -4*C.sc, 0])));
      O.tip[ci] = O.toW(tipF); O.hands[ci] = O.toW(vadd(R.e, qrot(qq[C.b[3]], vsc(C.hd0, C.palm*0.95))));
    }
    KB.writeM(O, BN);
    for (let i = 0; i < 2; i++){ const bi = BI[i ? 'eyeR' : 'eyeL']; O.eye[i] = KB.ptW(O, bi, [i ? -EYE_TIP[0] : EYE_TIP[0], EYE_TIP[1], EYE_TIP[2]]); }
    O.head = [(O.eye[0][0] + O.eye[1][0])/2, (O.eye[0][1] + O.eye[1][1])/2, (O.eye[0][2] + O.eye[1][2])/2 - 8];
    O.mouth = KB.ptW(O, BI.mxL, [-7, -2, 6]); O.chest = KB.jointW(O, BI.cara); O.pelvis = KB.jointW(O, 0);
    O.hold = O.hands[1];
    return O;
  }

  // ---------------- the hunter ----------------
  const DIFF = [{vb:11, vburst:24, vfar:18, grab:20, cool:6, turn:0.22, lead:0.7},
                {vb:14, vburst:30, vfar:23, grab:27, cool:4.6, turn:0.27, lead:0.9},
                {vb:17, vburst:36, vfar:28, grab:34, cool:3.4, turn:0.33, lead:1.0}];
  const travel = S => S.hdg + (S.cr || 0);
  // scuttle sideways while far (the body side-on to the way it goes), turn to face the prey near it or to strike
  function steer(api, hWant, turn, dt){
    const S = api.S, far = S.phase === 'hunt' && !S.k && api.distT > 290;
    const crWant = far ? (S.cr >= 0 ? 1 : -1)*PI/2 : 0;
    let tr = travel(S); const de = wrapA(hWant - tr), rate = (turn + 0.006*S.v)*dt; tr = wrapA(tr + clamp(de, -rate, rate));
    S.cr += clamp(crWant - S.cr, -0.8*dt, 0.8*dt);
    S.hdg = wrapA(tr - S.cr);
  }
  function speed(api, T, tv, dist){
    const S = api.S, D = api.D; api.distT = dist;
    const base = S.burst > 0 ? D.vburst : lerp(D.vb, D.vfar, sstep(450, 2000, dist));
    return base*lerp(0.5, 1, sstep(0.6, 1.4, Math.abs(S.cr)));
  }
  function decide(api, T, tv, c){
    const S = api.S, D = api.D, rng = api.rng, env = api.env;
    if (c.air && c.dist < 300 && c.tz < S.z + 300){ api.startAct(8, c.qx, c.qy, c.tz); S.cool = D.cool*0.8; return; }
    const facing = Math.abs(S.cr) < 0.5;      // strikes at its prey once it faces it; towers in front of its claws at any time
    if (facing && !c.air && c.qd < 150 && Math.abs(c.rel) < 0.8 && rng() < 0.3){ api.startAct(3, c.qx, c.qy, env.ground(c.qx, c.qy)); S.cool = D.cool; return; }
    if (facing && !c.air && !c.under && c.qd < 215 && Math.abs(c.rel) < 1.0){
      if (rng() < 0.55 + 0.1*api.di) api.startAct(5, c.qx, c.qy, env.ground(c.qx, c.qy) + 1.5);
      else api.startAct(c.rel > 0 ? 2 : 1, c.qx, c.qy, env.ground(c.qx, c.qy) + 1.5);
      S.cool = D.cool; return;
    }
    if (S.sweepCool <= 0){
      const fx = Math.sin(S.hdg), fy = Math.cos(S.hdg);
      const b = api.bldTall(S.x + fx*120, S.y + fy*120, 90, 45, b => { const rl = wrapA(Math.atan2(b.cx - S.x, b.cy - S.y) - S.hdg), d = Math.hypot(b.cx - S.x, b.cy - S.y); return Math.abs(rl) < 1.1 && d > 70 && d < 200; });
      if (b){ const rl = wrapA(Math.atan2(b.cx - S.x, b.cy - S.y) - S.hdg); api.startAct(rl > 0 ? 2 : 1, b.cx, b.cy, b.g + Math.min(b.h*0.45, 110)); S.ar = Math.max(6, Math.round(b.r)); S.sweepCool = 7 + 6*rng(); S.cool = 2.2; return; }
      if (facing && c.dist < 700){ api.startAct(4, S.x, S.y, S.z); S.sweepCool = 8 + 7*rng(); S.cool = 2.4; }
    }
  }
  function track(api, T, tv){
    const S = api.S; if (S.k !== 5) return;
    const ti = Math.max(0, (HIT_P[5] - S.p)*ACT_DUR[5]); S.ax = T.x + tv.vx*ti; S.ay = T.y + tv.vy*ti; S.az = api.env.ground(S.ax, S.ay) + 1.5;
  }
  function hit(api, T){
    const S = api.S, k = S.k, O = api.O, env = api.env, D = api.D;
    api.out.events.push({e:'hit', k, x:S.ax, y:S.ay, z:S.az});
    if (k === 1 || k === 2 || k === 5){
      // the claw cuts: what it closes on comes down falling away and to the side the claw swept from
      let fx = S.ax - S.x, fy = S.ay - S.y; const l = Math.hypot(fx, fy) || 1, sd = k === 1 ? -1 : 1; fx /= l; fy /= l;
      const px = fx*0.75 + fy*0.66*sd, py = fy*0.75 - fx*0.66*sd;
      api.crushAt(S.ax, S.ay, S.az, k === 5 ? 26 : 30 + (S.ar || 0)*0.5, k === 5 ? 30 : 400, 0.85, px, py);
    }
    // (v31: the claw catches only by closing on the car in the window; the stabbing legs crush it only where they come down on it)
    if (k === 3) api.crushAt(S.ax, S.ay, env.ground(S.ax, S.ay), 55, 40, 0.92);
    if (k === 4){ for (let i = -3; i <= 3; i++){ const a = S.hdg + i*0.42, x = S.x + Math.sin(a)*155, y = S.y + Math.cos(a)*155, gz = env.ground(x, y);
      api.crushAt(x, y, gz + 28, 30, 28, 0.92, -Math.cos(a), Math.sin(a)); } }
    void T; void O; void D;
  }
  // v31: solid parts - the dactyls (feet: crushing when they come down on the car), the propodi, the claws when low; the grab: the big
  // claw's jaws (k 5), both claws at an aircraft (k 8); the slam: the pinching claw (k 1 / 2)
  const PK = KB.PK;
  function parts(O, S, env, B){ const J = i => KB.jointW(O, i);
    for (let li = 0; li < LEGS.length; li++){ const L = LEGS[li]; KB.pSeg(B, li, PK.FOOT, J(L.b[3]), KB.ptW(O, L.b[3], vsub(L.tip, BN[L.b[3]].rest)), 4.5); KB.pSeg(B, 8 + li, PK.LEG, J(L.b[2]), J(L.b[3]), 8); }
    const k = S.k | 0;   // (the striking claw is judged by its jaws / as a slam, not as a limb landing on the car)
    for (let ci = 0; ci < 2; ci++){ if (k === 8 || (k === 5 && ci === 1) || ((k === 1 || k === 2) && ci === k - 1)) continue; const C = CLAWS[ci]; KB.pSeg(B, 16 + ci*2, PK.ARM, J(C.b[3]), O.hands[ci], 11*C.sc); KB.pSeg(B, 17 + ci*2, PK.ARM, O.hands[ci], O.tip[ci], 8*C.sc); } }
  function grab(O, S, B, k, adj){ const J = i => KB.jointW(O, i);
    // (the jaws: from the palm's end into the opening between the fingers, where the claw closes on its prey)
    for (let ci = k === 8 ? 0 : 1; ci < 2; ci++){ const C = CLAWS[ci], h = O.hands[ci], t = O.tip[ci]; const L = (u) => [h[0] + (t[0] - h[0])*u, h[1] + (t[1] - h[1])*u, h[2] + (t[2] - h[2])*u]; KB.pSeg(B, 30 + ci, PK.GRAB, L(0.04), L(0.18), 4.6*C.sc + adj); } void J; }
  function slam(O, S, B, k){ const ci = k === 2 ? 1 : 0, C = CLAWS[ci], J = i => KB.jointW(O, i); KB.pSeg(B, 40, PK.SLAM, J(C.b[3]), O.hands[ci], 11*C.sc); KB.pSeg(B, 41, PK.SLAM, O.hands[ci], O.tip[ci], 9*C.sc); }
  // contacts: the carapace (three spheres), the legs (knee and foot; half the legs per step), the claws (hands; the acting one along its length)
  function crush(api){
    const S = api.S, O = api.O, cr = api.crushAt, tr = travel(S), px = Math.sin(tr), py = Math.cos(tr), eb = clamp(0.38 + 0.014*S.v, 0.3, 0.8);
    const at = (p, r, e) => cr(p[0], p[1], p[2], r, 0, e, px, py);
    at(KB.jointW(O, 0), 50, eb); at(KB.ptW(O, 0, [46, 0, -4]), 36, eb); at(KB.ptW(O, 0, [-46, 0, -4]), 36, eb);
    const half = S.n & 1;
    for (let li = 0; li < LEGS.length; li++){ if ((li & 1) !== half) continue; const L = LEGS[li]; at(KB.jointW(O, L.b[2]), 13, eb); at(O.feet[li].ankle, 12, eb*1.1); }
    for (let ci = 0; ci < 2; ci++){ const act = ((S.k === 1 && ci === 0) || (S.k === 2 && ci === 1) || ((S.k === 4 || S.k === 5 || S.k === 7) && ci === 1) || S.k === 8);
      if (act && !(S.k === 1 || S.k === 2) || (act && S.hitDone)){ at(O.hands[ci], 22, 0.85); at(O.tip[ci], 14, 0.85); at(KB.jointW(O, CLAWS[ci].b[2]), 16, 0.7); }
      else at(O.hands[ci], 16, eb); }
  }
  // v31: the body as spheres (the army's aim / impact points)
  function body(O, S, out){ let n = 0; const sp = KB.sph;
    n = sp(out, n, KB.jointW(O, 0), 50); n = sp(out, n, KB.ptW(O, 0, [46, 0, -4]), 36); n = sp(out, n, KB.ptW(O, 0, [-46, 0, -4]), 36); n = sp(out, n, O.head, 12);
    for (let ci = 0; ci < 2; ci++){ n = sp(out, n, O.hands[ci], 22); n = sp(out, n, O.tip[ci], 12); n = sp(out, n, KB.jointW(O, CLAWS[ci].b[2]), 16); }
    for (let li = 0; li < LEGS.length; li++){ n = sp(out, n, KB.jointW(O, LEGS[li].b[2]), 12); }
    out.length = n; return out; }
  return {id:'crab', zh:'铁甲巨蟹', en:'Ironclad Crab', BN, BI, LEGS, CLAWS, EYE_TIP, HB, pose, mkOut, mkCtx:null, ctxStep:null, body,
    parts, grab, slam, GRABK:{5:1, 8:1}, SLAMK:{1:1, 2:1}, reachR:600, underR:75, throwV:12,
    DIFF, RISE_T:18, RISE_D:140, ACT_DUR, HIT_P, BETA, strideOf, travel, steer, speed, decide, track, hit, crush,
    X:[{n:'cr', q:3, m:'ang', v0:0}, {n:'ar', q:0, m:'act', v0:0}], riseV:3, closeR:120, closeV:6, acc:3.2, dec:4.5};
})());
//</CORE>

// ---- 14_serpent.js ----
//<CORE>
/* ================= 深海巨蛇 Sea Serpent (original design) — a 700 m segmented body that follows its own head's path =================
   A ribbon-finned sea serpent: blue-black metallic scales over a silver belly, a crimson crest of fin rays swept back from a long
   head (glowing eyes, a hinged jaw full of fangs, two barbels), fan-like pectoral fins, a red dorsal fin running down the back and a
   tail fin; photophores along each flank glow at night. It swims fast at the surface in the water (the back breaking it in humps)
   and slithers through the streets in lateral waves on land: the head weaves, the 40 body bones lie on the path the head has
   drawn (ctx = that path: rebuilt on mirrors from the states they get, so they draw the same body). Attacks: rearing up like a
   cobra and crashing down along the street (k 1), coiling around a tower as it climbs and crushing it (k 3: the head circles the
   tower, the body follows up the spiral), a sweep of the tail (k 4), a lunge to bite the car (k 5) held up in the jaws (k 7),
   rearing up with the jaws open to roar (k 6), striking up at an aircraft (k 8).
   Extras in the snapshot: sw = how much it swims (0 land .. 1 water), ar = the coil's radius (signed: turning sense) or the sweep
   side, a0 = the coil's start angle. */
const KSE = KB.finish((() => {
  const {clamp, lerp, sstep, wrapA, vsub, vadd, vsc, vdot, vcross, vlen, vnorm, vlerp, qmul, qrot, qax, qUnit, qX, qY, qZ, qFrame} = KC.m;
  const PI = Math.PI, TAU = PI*2;
  const SK = KB.Skel(), {BN, BI, bone} = SK;
  const NS = 40, SEG = 17.5, LEN = NS*SEG, HL = 62, Y0 = 18;
  const RAD = i => { const u = i/NS; return u < 0.3 ? 13.5 + 5.5*sstep(0, 0.3, u) : 19*(1 - 0.86*Math.pow((u - 0.3)/0.7, 1.35)); };
  const BB = [];
  for (let i = 0; i < NS; i++) BB.push(bone('b' + i, i ? 'b' + (i - 1) : null, 0, Y0, -i*SEG));
  bone('head', 'b0', 0, Y0, 0); bone('jaw', 'head', 0, 13, 6); bone('crest', 'head', 0, 32, -4); bone('pfL', 'b1', 15, 12, -22); bone('pfR', 'b1', -15, 12, -22);
  const NB = BN.length;
  const EYES = [[13, 27, 36], [-13, 27, 36]];
  const A_LAND = 44, A_WATER = 10, strideOf = (v, S) => lerp(260, 300, S && S.sw !== undefined ? S.sw : 0);
  // actions: 1 rear and crash down, 3 coil a tower, 4 tail sweep, 5 lunge / bite, 6 rear and roar, 7 hold, 8 strike at an aircraft
  const ACT_DUR = [0, 3.6, 3.6, 8.0, 3.8, 3.8, 4.0, 4.5, 2.8], HIT_P = {1:0.55, 3:0.7, 4:0.5, 5:0.5, 8:0.5};
  const COIL_V = 40;
  // the coil: where the head is on its circle round the tower at progress p (world x, y, heading)
  function coilAt(P, p){
    const rc = Math.abs(P.ar || 40), sg = (P.ar || 0) >= 0 ? 1 : -1, a = (P.a0 || 0) + sg*clamp(p, 0, 1)*ACT_DUR[3]*COIL_V/Math.max(20, rc)*0.92;
    return {x:P.ax + Math.sin(a)*rc, y:P.ay + Math.cos(a)*rc, hdg:a + sg*PI/2, rc, sg};
  }
  const coilW = P => (P.k | 0) === 3 ? sstep(0, 0.1, P.p)*(1 - sstep(0.88, 1, P.p)) : 0;
  // the head's point on its weaving path (world): the centre line plus the lateral swing (off while it coils)
  function headPoint(P){
    const A = lerp(A_LAND, A_WATER, clamp(P.sw || 0, 0, 1))*(1 - coilW(P))*clamp((P.r || 0)*1.5, 0, 1), lat = A*Math.sin(TAU*(P.g || 0));
    return [P.x + Math.cos(P.hdg)*lat, P.y - Math.sin(P.hdg)*lat];
  }
  // ctx: the path the head has drawn (newest last), points >= 3 m apart, ~900 m kept
  const TCAP = 420, TSTEP = 3;
  function mkCtx(){ return {x:new Float64Array(TCAP), y:new Float64Array(TCAP), n:0, h:0, init:false, J:[], W:new Float32Array(NS + 1), Z:new Float32Array(NS + 1)}; }
  function tPush(c, x, y){ c.h = (c.h + 1) % TCAP; c.x[c.h] = x; c.y[c.h] = y; if (c.n < TCAP) c.n++; }
  function ctxStep(c, P){
    const H = headPoint(P);
    if (!c.init || Math.hypot(H[0] - c.x[c.h], H[1] - c.y[c.h]) > 160){
      c.n = 0; c.h = TCAP - 1; const bx = -Math.sin(P.hdg), by = -Math.cos(P.hdg);
      for (let i = TCAP - 1; i >= 0; i--) tPush(c, H[0] + bx*i*TSTEP, H[1] + by*i*TSTEP);
      c.init = true; return;
    }
    if (Math.hypot(H[0] - c.x[c.h], H[1] - c.y[c.h]) >= TSTEP) tPush(c, H[0], H[1]);
  }
  // body joints along the path (world x, y) from the current head point backwards: J[i] at i * SEG
  function bodyXY(c, H, J){
    let px = H[0], py = H[1], acc = 0, k = 0, want = 0;
    J[0] = J[0] || [0, 0, 0]; J[0][0] = px; J[0][1] = py; let i = 1;
    for (; k < c.n - 1 && i <= NS; k++){
      const idx = (c.h - k + TCAP) % TCAP, qx = c.x[idx], qy = c.y[idx], d = Math.hypot(qx - px, qy - py);
      if (d < 1e-6) continue;
      while (i <= NS && acc + d >= i*SEG){ const f = (i*SEG - acc)/d; J[i] = J[i] || [0, 0, 0]; J[i][0] = px + (qx - px)*f; J[i][1] = py + (qy - py)*f; i++; }
      acc += d; px = qx; py = qy;
    }
    // beyond the recorded path: straight on
    if (i <= NS){ const a = J[Math.max(0, i - 2)], b = J[i - 1]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      for (; i <= NS; i++){ J[i] = J[i] || [0, 0, 0]; J[i][0] = J[i - 1][0] + dx*SEG; J[i][1] = J[i - 1][1] + dy*SEG; } }
    void want; return J;
  }
  const pl = KB.PL(200), PT = [];
  function mkOut(){ const O = KB.mkOut(NB); O.feet = []; O.J = []; for (let i = 0; i <= NS; i++) O.J.push([0, 0, 0]); return O; }
  function pose(P, env, O, c){
    O = O || mkOut(); KB.setW(P, O);
    const t = P.t, k = P.k | 0, pr = P.p || 0, g = P.g || 0, sw = clamp(P.sw || 0, 0, 1);
    const roar = k === 6 ? sstep(0, 0.2, pr)*(1 - sstep(0.8, 1, pr)) : 0;
    if (!c || !c.init){ c = c || mkCtx(); ctxStep(c, P); }
    const H = headPoint(P), J = O.J; bodyXY(c, H, J);
    const re = P.r >= 1 ? 1 : 1 - Math.pow(1 - clamp(P.r, 0, 1), 2.2), sink = -100*(1 - re);
    // heights: on land the body lies on the street (the neck raised), in the water it swims at the surface, the back in humps
    const W = c.W, Z = c.Z;
    for (let i = 0; i <= NS; i++) W[i] = env.water(J[i][0], J[i][1]) ? 1 : 0;
    for (let pass = 0; pass < 2; pass++){ for (let i = 0; i <= NS; i++) Z[i] = (W[Math.max(0, i - 1)] + 2*W[i] + W[Math.min(NS, i + 1)])/4; for (let i = 0; i <= NS; i++) W[i] = Z[i]; }
    for (let i = 0; i <= NS; i++){
      const R = RAD(i), s = i*SEG, x = J[i][0], y = J[i][1];
      const zl = W[i] < 0.999 ? env.ground(x, y) + R*0.78 : 0, hump = 24*Math.pow(Math.max(0, Math.sin(TAU*(s/230 - g*0.6) + 0.6)), 1.6)*sstep(30, 120, s);
      const zw = -R*0.3 + hump;
      let z = lerp(zl, zw, W[i]);
      // the neck and head ride up (higher on land: hunting)
      if (i < 7){ const u = 1 - i/7; z += u*u*lerp(30, 12, W[i]); }
      J[i][2] = z + sink;
    }
    // coiling: the part of the body on the circle climbs the tower in a spiral, squeezes in at the end
    const cw = coilW(P);
    if (cw > 0){
      const C = coilAt(P, pr), gT = env.ground(P.ax, P.ay), climb = Math.max(20, Math.min(P.az - gT - 25, 170))*sstep(0.05, 0.6, pr), sq = sstep(0.6, 0.7, pr)*(1 - sstep(0.88, 1, pr)), zone = C.rc + 30;
      for (let i = 0; i <= NS; i++){ const dx = J[i][0] - P.ax, dy = J[i][1] - P.ay, d = Math.hypot(dx, dy); if (d > zone) continue;
        const f = cw*(1 - sstep(zone - 15, zone, d)), zc = gT + RAD(i) + Math.max(0, climb - i*SEG*0.32);
        J[i][2] = lerp(J[i][2], Math.max(J[i][2], zc), f); const sc = 1 - 0.32*sq*f; J[i][0] = P.ax + dx*sc; J[i][1] = P.ay + dy*sc; }
    }
    // actions that lift the front off the path: an FK chain from an anchor joint, blended in
    const bendFront = (a, wgt, pitchOf, yawTo, flat) => {
      if (wgt <= 0.001) return;
      const A = J[a], B = J[a + 1]; let fx = A[0] - B[0], fy = A[1] - B[1]; const fl = Math.hypot(fx, fy) || 1; fx /= fl; fy /= fl;
      let tx = fx, ty = fy; if (yawTo){ const dx = yawTo[0] - A[0], dy = yawTo[1] - A[1], dl = Math.hypot(dx, dy); if (dl > 1){ tx = dx/dl; ty = dy/dl; } }
      let x = A[0], y = A[1], z = A[2];
      for (let j = a - 1; j >= 0; j--){ const u = (a - j)/a, yw = sstep(0, 0.6, u), dx2 = fx + (tx - fx)*yw, dy2 = fy + (ty - fy)*yw, dl2 = Math.hypot(dx2, dy2) || 1, th = pitchOf(u), ct = Math.cos(th);
        x += dx2/dl2*ct*SEG; y += dy2/dl2*ct*SEG; z += Math.sin(th)*SEG; let zz = z;
        if (flat){ const gz = env.water(x, y) ? 0 : env.ground(x, y); zz = gz + RAD(j)*0.78; z = lerp(z, zz, flat); zz = z; }
        J[j][0] += (x - J[j][0])*wgt; J[j][1] += (y - J[j][1])*wgt; J[j][2] += (zz - J[j][2])*wgt; }
    };
    const tgt = [P.ax, P.ay];
    if (k === 1){
      const e1 = sstep(0, 0.4, pr)*(1 - sstep(0.75, 1, pr)), e2 = sstep(0.42, 0.55, pr);
      bendFront(10, e1, u => lerp(PI/2*sstep(0, 0.42, u) - (PI/2 + 0.55)*sstep(0.55, 1, u), 0, e2), tgt, e2);
    }
    if (roar || k === 7) bendFront(12, Math.max(roar, k === 7 ? sstep(0, 0.25, pr)*(1 - sstep(0.85, 1, pr)) : 0), u => PI/2*sstep(0, 0.42, u) - (PI/2 + 0.3)*sstep(0.72, 1, u), null, 0);
    // a strike: the neck draws back into a curve, then the front shoots out from joint a (stretching like a striking snake's), the jaws
    // arriving on the prey at the hit (k 5 on the ground, k 8 up at an aircraft)
    // v31: the jaws on the aim point: the strike's target corrected by the last pose's miss (the mouth vs the aim) while it strikes,
    // so that the jaws close where it aims (the contacts catch only what the jaws touch); relaxed back to none between strikes
    const SC = O.sc || (O.sc = [0, 0, 0]);
    const strike = (a, e, reachU, st, tz, lift) => {
      if (e <= 0.001) return; const A = J[a];
      if (reachU > 0.2 && O.mouth && O.mouth.length){ const g = 0.3*reachU;
        SC[0] = clamp(SC[0] + g*(P.ax - O.mouth[0]), -70, 70); SC[1] = clamp(SC[1] + g*(P.ay - O.mouth[1]), -70, 70); SC[2] = clamp(SC[2] + g*((P.az || 0) - O.mouth[2]), -40, 40); }
      let dx = P.ax + SC[0] - A[0], dy = P.ay + SC[1] - A[1], dz = tz + SC[2] - A[2]; const dl = Math.hypot(dx, dy, dz) || 1;
      const Lf = a*SEG*st, far = Math.min(dl - HL*0.75, Lf*0.96), kk = far/dl*lerp(0.55, 1, reachU), E = [A[0] + dx*kk, A[1] + dy*kk, A[2] + dz*kk + lift*(1 - reachU)];
      const toM = O.toM; KB.reachPath(pl, toM(A[0], A[1], A[2]), toM(E[0], E[1], E[2]), Lf, [0, 1, 0], 40);
      KB.sampleJoints(pl, Lf, a, PT);
      for (let j = 0; j <= a; j++){ const w2 = O.toW(PT[a - j]); J[j][0] += (w2[0] - J[j][0])*e; J[j][1] += (w2[1] - J[j][1])*e; J[j][2] += (w2[2] - J[j][2])*e; }
    };
    if (k !== 5 && k !== 8){ O.sc = null; }
    if (k === 8){ const ru = sstep(0.3, 0.48, pr); strike(14, sstep(0, 0.3, pr)*(1 - sstep(0.75, 1, pr)), ru, 1 + 0.45*ru*(1 - sstep(0.6, 0.9, pr)), P.az - 8, 60); }
    if (k === 5){ const ru = sstep(0.3, 0.48, pr); strike(10, sstep(0, 0.25, pr)*(1 - sstep(0.7, 1, pr)), ru, 1 + 0.55*ru*(1 - sstep(0.62, 0.92, pr)), env.ground(P.ax, P.ay) + 24, 45); }
    if (k === 4){
      // the tail swings round the pivot joint and back
      const jp = 26, sg = (P.ar || 1) >= 0 ? 1 : -1, ang = sg*1.45*Math.sin(PI*sstep(0.08, 0.92, pr)), ca = Math.cos(ang), sa = Math.sin(ang), Pv = J[jp];
      for (let i = jp + 1; i <= NS; i++){ const dx = J[i][0] - Pv[0], dy = J[i][1] - Pv[1], f = sstep(jp, jp + 4, i);
        const rx = Pv[0] + dx*ca - dy*sa, ry = Pv[1] + dx*sa + dy*ca; J[i][0] += (rx - J[i][0])*f; J[i][1] += (ry - J[i][1])*f;
        J[i][2] += Math.sin(PI*sstep(0.08, 0.92, pr))*8*f; }
    }
    // ---- bones: positions in model space, frames from the tail forward (a reared-up neck keeps the twist of the body below it)
    const pp = O.pj, qq = O.qj, REST = [0, 0, -1], UP = [0, 1, 0];
    for (let i = 0; i <= NS; i++){ const m = O.toM(J[i][0], J[i][1], J[i][2]); PT[i] = m; }
    let upRef = UP;
    for (let i = NS - 1; i >= 0; i--){
      let d = vsub(PT[i + 1], PT[i]); const l = vlen(d); d = l > 1e-6 ? vsc(d, 1/l) : REST;
      const dv = Math.abs(d[1]); let ref = dv < 0.93 ? UP : upRef; if (dv >= 0.8 && dv < 0.93) ref = vnorm(vlerp(UP, upRef, (dv - 0.8)/0.13));
      ref = vsub(ref, vsc(d, vdot(ref, d))); const rl = vlen(ref); ref = rl > 1e-4 ? vsc(ref, 1/rl) : upRef; upRef = ref;
      pp[BB[i]] = PT[i]; qq[BB[i]] = qFrame(REST, UP, d, ref);
    }
    // the head: along the neck, looking at its prey, pitched by the action; the jaw opens
    let hf = vsub(PT[0], PT[1]); hf = vnorm(hf);
    const look = clamp(P.ly || 0, -0.9, 0.9)*0.45, hup = vsub(upRef, vsc(hf, vdot(upRef, hf)));
    let qh = qFrame([0, 0, 1], UP, hf, vlen(hup) > 1e-4 ? vnorm(hup) : UP);
    const bite = k === 5 ? sstep(0.15, 0.4, pr)*(1 - sstep(0.46, 0.52, pr)) : 0, hold = k === 7 ? 0.25 : 0;
    qh = qmul(qh, qmul(qY(look), qX(-0.12*roar + 0.08*Math.sin(t*0.6) - (k === 8 ? 0.3*sstep(0.3, 0.5, pr) : 0))));
    pp[BI.head] = PT[0]; qq[BI.head] = qh;
    const fk = KB.mkFK(BN, O);
    fk(BI.jaw, qX(0.75*roar + 0.7*bite + hold + 0.06*Math.sin(t*0.9)));
    fk(BI.crest, qX(-0.35*roar + 0.08*Math.sin(t*0.7)));
    fk(BI.pfL, qmul(qY(0.25*Math.sin(t*1.5)), qZ(0.35 + 0.3*Math.sin(t*1.5 + 0.5)*(0.4 + sw)))); fk(BI.pfR, qmul(qY(-0.25*Math.sin(t*1.5)), qZ(-0.35 - 0.3*Math.sin(t*1.5 + 0.5)*(0.4 + sw))));
    KB.writeM(O, BN);
    for (let i = 0; i < 2; i++) O.eye[i] = KB.ptW(O, BI.head, vsub(EYES[i], BN[BI.head].rest));
    O.head = KB.ptW(O, BI.head, [0, 10, 20]); O.mouth = KB.ptW(O, BI.head, [0, -2, HL - 6]); O.hold = O.mouth;
    O.chest = J[3]; O.pelvis = J[20];
    O.tip[0] = O.mouth; O.tip[1] = J[NS]; O.hands[0] = J[1]; O.hands[1] = J[NS - 2];
    return O;
  }

  // ---------------- the hunter ----------------
  const DIFF = [{vb:9, vburst:18, vfar:15, grab:20, cool:6, turn:0.34, lead:0.6},
                {vb:11.5, vburst:23, vfar:19, grab:27, cool:4.8, turn:0.4, lead:0.8},
                {vb:14, vburst:28, vfar:23, grab:34, cool:3.6, turn:0.48, lead:1.0}];
  function init(api){ const S = api.S; S.sw = api.env.water(S.x, S.y) ? 1 : 0; }
  function speed(api, T, tv, dist){ const S = api.S, D = api.D; return (S.burst > 0 ? D.vburst : lerp(D.vb, D.vfar, sstep(500, 2200, dist)))*(1 + 0.85*S.sw); }
  const actSlow = k => k === 6 || k === 3 ? 0 : k === 1 || k === 8 || k === 7 ? 0.1 : 0.35;
  function preStep(api, dt){
    const S = api.S, H = headPoint(S), wet = api.env.water(H[0], H[1]) ? 1 : 0;
    S.sw += clamp(wet - S.sw, -0.5*dt, 0.5*dt);
    if (S.k === 3){   // the head circles the tower (the path drawn becomes the coil); the gait phase holds
      if (S.gc === undefined) S.gc = S.g;
      const C = coilAt(S, S.p); S.x = C.x; S.y = C.y; S.hdg = wrapA(C.hdg); S.g = S.gc; S.v = 0;
    } else S.gc = undefined;
  }
  function decide(api, T, tv, c){
    const S = api.S, D = api.D, rng = api.rng, env = api.env;
    const Hh = headPoint(S), dh = Math.hypot(c.qx - Hh[0], c.qy - Hh[1]);
    if (c.air){ if (dh < 190 && c.tz < S.z + 280){ api.startAct(8, c.qx, c.qy, c.tz); S.cool = D.cool*0.8; } return; }
    if (!c.air && dh < 145 && Math.abs(c.rel) < 0.8 && rng() < 0.6 + 0.1*api.di){ api.startAct(5, c.qx, c.qy, env.ground(c.qx, c.qy) + 1); S.cool = D.cool; return; }
    if (!c.air && c.qd < 250 && Math.abs(c.rel) < 1.0){ api.startAct(1, c.qx, c.qy, env.ground(c.qx, c.qy)); S.cool = D.cool*1.1; return; }
    if (S.sweepCool <= 0){
      const H = headPoint(S), fx = Math.sin(S.hdg), fy = Math.cos(S.hdg);
      if (Math.abs(Math.sin(TAU*S.g)) < 0.25 && S.sw < 0.3){
        const b = api.bldTall(H[0] + fx*40, H[1] + fy*40, 75, 45, b => { const d = Math.hypot(b.cx - H[0], b.cy - H[1]); return d > b.r + 14 && d < b.r + 60; });
        if (b){ const rc = Math.hypot(b.cx - H[0], b.cy - H[1]), a0 = Math.atan2(H[0] - b.cx, H[1] - b.cy), side = wrapA(Math.atan2(b.cx - H[0], b.cy - H[1]) - S.hdg) > 0 ? 1 : -1;
          // circling sense: keep going the way it was heading (tower on the right -> clockwise)
          api.startAct(3, b.cx, b.cy, b.z1); S.ar = side*Math.round(rc); S.a0 = Math.round(a0*100)/100; S.sweepCool = 12 + 6*rng(); S.cool = 3; return; }
      }
      if (c.dist < 900){ const J = api.O.J, tl = J && J[34] ? J[34] : [S.x, S.y]; api.startAct(4, tl[0], tl[1], env.ground(tl[0], tl[1])); S.ar = rng() < 0.5 ? 1 : -1; S.sweepCool = 8 + 7*rng(); S.cool = 2.5; }
    }
  }
  function track(api, T, tv){
    const S = api.S; if (S.k !== 5) return;
    const ti = Math.max(0, (HIT_P[5] - S.p)*ACT_DUR[5]); S.ax = T.x + tv.vx*ti; S.ay = T.y + tv.vy*ti; S.az = api.env.ground(S.ax, S.ay) + 1;
  }
  function hit(api, T){
    const S = api.S, k = S.k, O = api.O, env = api.env, D = api.D, J = O.J;
    if (k === 4){ const tl = J[36]; S.ax = tl[0]; S.ay = tl[1]; S.az = env.ground(tl[0], tl[1]); }
    api.out.events.push({e:'hit', k, x:S.ax, y:S.ay, z:S.az});
    if (k === 1){   // the front crashes down along the street
      let fx = J[0][0] - J[10][0], fy = J[0][1] - J[10][1]; const l = Math.hypot(fx, fy) || 1; fx /= l; fy /= l;
      for (let j = 0; j <= 10; j += 2){ const p = J[j], gz = env.ground(p[0], p[1]); api.crushAt(p[0], p[1], gz + 10, 34, 30, 0.92, fx, fy); }
      api.crushAt(S.ax, S.ay, env.ground(S.ax, S.ay), 50, 40, 0.95);
    }
    // (v31: the jaws catch only by closing on the car in the window; the crashing front throws it only where it lands on it)
    if (k === 5){ const m = O.mouth; api.crushAt(m[0], m[1], env.ground(m[0], m[1]), 28, 30, 0.7); }
    if (k === 3){   // the coiled tower is crushed: it implodes into the coil
      const gz = env.ground(S.ax, S.ay), rc = Math.abs(S.ar || 40);
      api.crushAt(S.ax, S.ay, gz + 40, Math.max(12, rc - 14), 80, 0.75, 0, 0, 'in');
      api.crushAt(S.ax, S.ay, gz + 10, rc + 22, 10, 0.5);
    }
    if (k === 4){ const sg = (S.ar || 1) >= 0 ? 1 : -1;
      for (let i = 27; i <= NS; i += 2){ const p = J[i], q = J[i - 1], gz = env.ground(p[0], p[1]); let tx = p[0] - q[0], ty = p[1] - q[1]; const l = Math.hypot(tx, ty) || 1; api.crushAt(p[0], p[1], gz + 10, 26, 20, 0.95, -sg*ty/l, sg*tx/l); } }
    void T; void D;
  }
  // v31: solid parts - the body along its length (it lies on the street: a wall that slides along its path); the grab: the jaws
  // (k 5, k 8 at an aircraft); the slam: the front crashing down (k 1)
  const PK = KB.PK;
  function parts(O, S, env, B){ const J = O.J; if (!J || !J[NS]) return; const k = S.k | 0, i0 = k === 1 || k === 5 || k === 8 ? 12 : 1;   // (the striking front: judged as the jaws / a slam)
    for (let i = i0; i < NS; i++) KB.pSeg(B, i, PK.BODY, J[i], J[i + 1], RAD(i)*0.9); }
  function grab(O, S, B, k, adj){ KB.pSeg(B, 50, PK.GRAB, KB.ptW(O, BI.head, [0, 2, 40]), O.mouth, 6 + adj); }   // (the front of the jaws)
  function slam(O, S, B, k){ const J = O.J; for (let j = 0; j < 10; j++) KB.pSeg(B, 60 + j, PK.SLAM, J[j], J[j + 1], RAD(j) + 2); }
  // contacts every step: the head and the front of the body break new ground (the rest follows the same path); a sweeping tail
  function crush(api){
    const S = api.S, O = api.O, J = O.J, cr = api.crushAt;
    if (S.k === 3 && !S.hitDone) return;      // (the tower it coils around stands until it is crushed)
    if (S.sw > 0.9) return;
    const px = Math.sin(S.hdg), py = Math.cos(S.hdg), eb = clamp(0.4 + 0.012*S.v, 0.35, 0.8);
    const m = O.head; cr(m[0], m[1], m[2] - 10, 30, 0, eb, px, py);
    for (let j = 1; j <= 3; j++){ const p = J[j]; cr(p[0], p[1], p[2], 24, 0, eb, px, py); }
    if (S.k === 4 && S.p > 0.15 && S.p < 0.85){ const sg = (S.ar || 1) >= 0 ? 1 : -1; for (let i = 28 + (S.n & 1); i <= NS; i += 2){ const p = J[i], q = J[i - 1]; let tx = p[0] - q[0], ty = p[1] - q[1]; const l = Math.hypot(tx, ty) || 1; cr(p[0], p[1], p[2], 24, 0, 0.92, -sg*ty/l, sg*tx/l); } }
  }
  // v31: the body as spheres along its length (the army's aim / impact points)
  function body(O, S, out){ let n = 0; const J = O.J; if (!J || !J[0]) { out.length = 0; return out; }
    n = KB.sph(out, n, O.head, 18); for (let i = 1; i <= NS && n < 24; i += 2) n = KB.sph(out, n, J[i], RAD(i)*0.95); out.length = n; return out; }
  return {id:'serpent', zh:'深海巨蛇', en:'Sea Serpent', BN, BI, BB, NS, SEG, LEN, HL, Y0, RAD, EYES, pose, mkOut, mkCtx, ctxStep, headPoint, coilAt, body,
    parts, grab, slam, GRABK:{5:1, 8:1}, SLAMK:{1:1}, reachR:900,
    DIFF, RISE_T:16, RISE_D:100, ACT_DUR, HIT_P, strideOf, init, speed, actSlow, preStep, decide, track, hit, crush,
    X:[{n:'sw', q:2, m:'lin', v0:1}, {n:'ar', q:0, m:'act', v0:0}, {n:'a0', q:2, m:'act', v0:0}], riseV:4, closeR:110, closeV:7};
})());
//</CORE>

// ---- 15_shoggoth.js ----
//<CORE>
/* ================= 修格斯 Shoggoth — from H. P. Lovecraft's 1936 text only: "a shapeless congeries of protoplasmic bubbles, faintly
   self-luminous, and with myriads of temporary eyes forming and un-forming as pustules of greenish light", black and iridescent,
   "throwing out temporary developments", piping "Tekeli-li!". No skeleton: the body is a soft mass (a vertex-shader blob, ~200 m
   across, ~70 m high) and eight pseudopods (each a curve S -> C -> E with a radius and an activity), all computed here from the pose
   state and handed to the shader as uniforms (O.M packs them), so mirrors draw the same mass. Six pseudopods form and dissolve on
   their own cycles; two are its weapons. It flows over the streets and engulfs what it crosses (buildings sink into it).
   Attacks: a pseudopod raised and slammed down (k 1 / 2), the mass surging over a tower and swallowing it (k 3), a wave thrown out
   to both sides (k 4), a pseudopod shot out to seize the car (k 5) and draw it into the mass (k 7), rising into a column of eyes
   and piping (k 6), pseudopods shot up at an aircraft (k 8). No extras in the snapshot. */
const KSH = KB.finish((() => {
  const {clamp, lerp, sstep, wrapA, vsub, vadd, vsc, vdot, vcross, vlen, vnorm, vlerp} = KC.m;
  const PI = Math.PI, TAU = PI*2;
  const NL = 8, NM = NL*12 + 8;
  const BN = [], BI = {};
  const strideOf = () => 140;
  const ACT_DUR = [0, 3.2, 3.2, 5.5, 3.6, 3.8, 4.0, 4.8, 2.8], HIT_P = {1:0.5, 2:0.5, 3:0.55, 4:0.5, 5:0.52, 8:0.5};
  function mkOut(){ const O = KB.mkOut(0); O.M = new Float32Array(NM); O.feet = []; O.Lw = []; for (let i = 0; i < NL; i++) O.Lw.push([0, 0, 0]); return O; }
  // blob shape (model space, before the shader's bubbling): an ellipsoid of radius R across and H high, the front swollen
  const surf = (B, th, el) => { const ce = Math.cos(el), x = Math.sin(th)*ce*B.R, z = Math.cos(th)*ce*B.R*(1 + B.fb*sstep(-0.2, 1, Math.cos(th)*ce)), y = B.H*0.42 + Math.sin(el)*B.H*0.62; return [x, Math.max(2, y), z]; };
  function setLobe(O, i, S, C, E, r0, r1, a){ const o = i*12, M = O.M; M[o] = S[0]; M[o + 1] = S[1]; M[o + 2] = S[2]; M[o + 3] = r0; M[o + 4] = C[0]; M[o + 5] = C[1]; M[o + 6] = C[2]; M[o + 7] = r1; M[o + 8] = E[0]; M[o + 9] = E[1]; M[o + 10] = E[2]; M[o + 11] = a; O.Lw[i] = O.toW(E); }
  function pose(P, env, O){
    O = O || mkOut(); KB.setW(P, O);
    const t = P.t, v = Math.max(0, P.v || 0), A = clamp(v/4, 0, 1), k = P.k | 0, pr = P.p || 0, w = P.w === undefined ? 0.5 : P.w;
    const roar = k === 6 ? sstep(0, 0.25, pr)*(1 - sstep(0.8, 1, pr)) : 0;
    const B = {R:100*(1 + 0.3*(w - 0.5))*(1 - 0.22*roar) + 8*Math.sin(t*0.37), H:70 + 6*Math.sin(t*0.53 + 1) + 115*roar, fb:0.22 + 0.08*Math.sin(t*0.7) + 0.2*A};
    // ---- six pseudopods forming and dissolving
    for (let i = 2; i < NL; i++){
      const T = 6.5 + 2.7*i, u = ((t/T + i*0.37) % 1 + 1) % 1, a = Math.max(sstep(0, 0.25, u)*(1 - sstep(0.55, 0.9, u)), roar*(0.55 + 0.4*((i*0.61) % 1)));
      // idle: round the front and sides; rising into the column (k 6) they go every way, at every height, writhing
      const thI = (i - 4.5)*0.55 + 0.45*Math.sin(t*0.13 + i*1.9) + (i & 1 ? 0.3 : -0.3), thR = (i - 2)*TAU/6 + 0.5*Math.sin(t*0.7 + i*2.1);
      const th = thI + wrapA(thR - thI)*roar, el = lerp(0.15 + 0.3*Math.sin(i*1.7), -0.25 + 1.1*((i*0.53) % 1) + 0.25*Math.sin(t*1.1 + i), roar);
      const S = surf(B, th, el), dir = vnorm([Math.sin(th)*Math.cos(el + 0.35), Math.sin(el + 0.35), Math.cos(th)*Math.cos(el + 0.35) - 0.35*A]), L = (55 + 45*((i*0.618) % 1))*(1 + 0.6*roar);
      const E = vadd(S, vsc(dir, L*a)); E[1] = Math.max(3, E[1] - 0.25*L*a*(1 - roar) + 18*Math.sin(t*1.3 + i)*a); E[0] += 22*roar*Math.sin(t*1.7 + i*1.3); E[2] += 22*roar*Math.cos(t*1.5 + i*0.7);
      const C = vadd(vlerp(S, E, 0.5), [0, 0.18*L*a, 0]);
      setLobe(O, i, vsub(S, vsc(dir, 8)), C, E, 3 + 13*a, 1 + 8*a, a);
    }
    // ---- the two weapon pseudopods
    const front = surf(B, 0, 0.3), sideP = s => surf(B, s*0.9, 0.25);
    for (let i = 0; i < 2; i++){
      const s = i ? -1 : 1, S0 = sideP(s*0.6); let E = S0, C = S0, a = 0, r0 = 3, r1 = 1;
      const mineHit = ((k === 1 && i === 0) || (k === 2 && i === 1)), grab = (k === 5 || k === 7) && i === 0, air = k === 8;
      if (mineHit || grab || air){
        const E0 = O.toM(P.ax, P.ay, P.az), hp = HIT_P[k] || 0.5, wind = vadd(S0, [s*40, 150, -20]);
        if (k === 7){ E = vlerp(E0, vadd(front, [0, -6, 6]), sstep(0.05, 0.6, pr)); a = 1 - sstep(0.8, 1, pr); r0 = 18; r1 = 9; }
        else if (pr < 0.28){ const u = sstep(0, 0.28, pr); E = vlerp(S0, wind, u); a = u; }
        else if (pr < hp){ const u = Math.pow(clamp((pr - 0.28)/(hp - 0.28), 0, 1), 1.5); E = vlerp(wind, E0, u); E[1] += Math.sin(PI*u)*35; a = 1; }
        else if (pr < 0.72){ E = E0; a = 1; }
        else { const u = sstep(0.72, 1, pr); E = vlerp(E0, S0, u); a = 1 - u; }
        if (k !== 7){ r0 = mineHit ? 26 : 17; r1 = mineHit ? 16 : 8; }
        C = vadd(vlerp(S0, E, 0.5), [0, 0.25*vlen(vsub(E, S0)), 0]);
      } else if (k === 3){
        // engulf: one thick flow to the tower's foot, the other climbing it
        const T0 = O.toM(P.ax, P.ay, env.ground(P.ax, P.ay)), top = P.az - P.z, ea = sstep(0.05, 0.4, pr)*(1 - sstep(0.82, 1, pr)), climb = sstep(0.2, 0.55, pr);
        if (i === 0){ E = vlerp(front, [T0[0], T0[1] + 20, T0[2]], ea); C = vadd(vlerp(front, E, 0.5), [0, 25, 0]); r0 = 58; r1 = 50; a = ea; }
        else { const base = [T0[0], T0[1] + 20, T0[2]]; E = vlerp(base, [T0[0], Math.max(T0[1] + 30, top*climb), T0[2]], ea); C = vadd(vlerp(base, E, 0.5), [6, 0, 6]); r0 = 50; r1 = 34; a = ea*sstep(0.1, 0.3, pr); }
      } else if (k === 4){
        // a wave thrown out to both sides, low over the street
        const u = sstep(0.1, 0.5, pr), ea = sstep(0, 0.2, pr)*(1 - sstep(0.75, 1, pr)), ang = s*lerp(0.4, 1.7, u);
        E = [Math.sin(ang)*(B.R + 150*ea), 12, Math.cos(ang)*(B.R + 150*ea)]; C = vadd(vlerp(S0, E, 0.5), [0, 30, 0]); r0 = 34; r1 = 22; a = ea;
      }
      setLobe(O, i, a > 0.001 ? S0 : vsub(S0, [0, 10, 0]), C, E, r0*Math.min(1, a*1.6 + 0.05), r1*Math.min(1, a*1.6 + 0.05), a);
    }
    const M = O.M, o = NL*12; M[o] = B.R; M[o + 1] = B.H; M[o + 2] = B.fb; M[o + 3] = roar; M[o + 4] = A; M[o + 5] = clamp(P.ly || 0, -1, 1); M[o + 6] = 0; M[o + 7] = 0;
    O.B = B;
    // the two eyes that stay longest (the glow sprites), the front, the hold point
    O.eye[0] = O.toW([16, B.H*0.72, B.R*0.98]); O.eye[1] = O.toW([-15, B.H*0.66, B.R*1.0]);
    O.head = O.toW([0, B.H*0.85, B.R*0.7]); O.mouth = O.toW([0, B.H*0.45, B.R*1.05]); O.chest = O.toW([0, B.H*0.5, 0]); O.pelvis = O.toW([0, 10, 0]);
    O.tip[0] = O.Lw[0]; O.tip[1] = O.Lw[1]; O.hold = O.Lw[0]; O.hands[0] = O.Lw[0]; O.hands[1] = O.Lw[1];
    return O;
  }

  // ---------------- the hunter ----------------
  const DIFF = [{vb:9, vburst:20, vfar:15, grab:20, cool:6, turn:0.42, lead:0.6},
                {vb:11.5, vburst:25, vfar:19, grab:27, cool:4.8, turn:0.5, lead:0.8},
                {vb:14, vburst:30, vfar:23, grab:34, cool:3.6, turn:0.6, lead:1.0}];
  function decide(api, T, tv, c){
    const S = api.S, D = api.D, rng = api.rng, env = api.env;
    if (c.air && c.dist < 300 && c.tz < S.z + 330){ api.startAct(8, c.qx, c.qy, c.tz); S.cool = D.cool*0.8; return; }
    if (!c.air && !c.under && c.qd < 250 && Math.abs(c.rel) < 1.4 && (c.qd > 200 || rng() < 0.55 + 0.1*api.di)){ api.startAct(5, c.qx, c.qy, env.ground(c.qx, c.qy) + 1); S.cool = D.cool; return; }
    if (!c.air && !c.under && c.qd < 210 && Math.abs(c.rel) < 1.5){ api.startAct(c.rel > 0 ? 2 : 1, c.qx, c.qy, env.ground(c.qx, c.qy) + 1); S.cool = D.cool*1.05; return; }
    if (S.sweepCool <= 0){
      const fx = Math.sin(S.hdg), fy = Math.cos(S.hdg);
      const b = api.bldTall(S.x + fx*130, S.y + fy*130, 80, 50, b => { const rl = wrapA(Math.atan2(b.cx - S.x, b.cy - S.y) - S.hdg), d = Math.hypot(b.cx - S.x, b.cy - S.y); return Math.abs(rl) < 0.9 && d > 110 && d < 210; });
      if (b){ api.startAct(3, b.cx, b.cy, b.z1); S.sweepCool = 9 + 6*rng(); S.cool = 2.5; return; }
      if (c.dist < 900){ api.startAct(4, S.x, S.y, S.z); S.sweepCool = 9 + 7*rng(); S.cool = 2.5; }
    }
  }
  function track(api, T, tv){
    const S = api.S; if (S.k !== 5) return;
    const ti = Math.max(0, (HIT_P[5] - S.p)*ACT_DUR[5]); S.ax = T.x + tv.vx*ti; S.ay = T.y + tv.vy*ti; S.az = api.env.ground(S.ax, S.ay) + 1;
  }
  function hit(api, T){
    const S = api.S, k = S.k, O = api.O, env = api.env, D = api.D;
    api.out.events.push({e:'hit', k, x:S.ax, y:S.ay, z:S.az});
    // (v31: the pseudopod catches only by closing on the car in the window, a slam throws it only where it lands on it: KB.Touch)
    if (k === 1 || k === 2 || k === 5) api.crushAt(S.ax, S.ay, env.ground(S.ax, S.ay), k === 5 ? 28 : 52, 40, k === 5 ? 0.5 : 0.8);
    if (k === 3){ const gz = env.ground(S.ax, S.ay); api.crushAt(S.ax, S.ay, gz + 30, 45, 60, 0.62, 0, 0, 'in'); api.crushAt(S.ax, S.ay, gz + 10, 85, 10, 0.45, 0, 0, 'in'); }
    if (k === 4){ const R = O.B ? O.B.R : 100; for (let i = 0; i < 10; i++){ const a = S.hdg + (i - 4.5)*0.42, x = S.x + Math.sin(a)*(R + 110), y = S.y + Math.cos(a)*(R + 110);
      api.crushAt(x, y, env.ground(x, y) + 12, 40, 12, 0.35, Math.sin(a), Math.cos(a)); } }
    void T; void D;
  }
  // v31: solid parts - the mass (two crossed boxes round its ellipse, as high as it is), the weapon pseudopods while they sweep (k 4);
  // the grab: pseudopod 0's end (k 5; both at an aircraft, k 8); the slam: pseudopod 0 / 1 (k 1 / 2)
  const PK = KB.PK;
  function lobe(O, B, id, k, i, adj){ const M = O.M, o = i*12; if (M[o + 11] < 0.05) return;
    const S0 = O.toW([M[o], M[o + 1], M[o + 2]]), C = O.toW([M[o + 4], M[o + 5], M[o + 6]]), E = O.toW([M[o + 8], M[o + 9], M[o + 10]]);
    KB.pSeg(B, id, k, S0, C, M[o + 3] + adj); KB.pSeg(B, id + 1, k, C, E, M[o + 7] + adj); }
  function parts(O, S, env, B){ const Bb = O.B || {R:100, H:70, fb:0.2}, c = O.toW([0, 0, Bb.R*Bb.fb*0.4]), a = PI/2 - S.hdg, R = Bb.R, f = 1 + Bb.fb*0.5;
    KB.pAdd(B, 0, PK.BODY, c[0], c[1], a, 0.64*R*f, 0.92*R, O.W.z - 1, O.W.z + Bb.H*0.9); KB.pAdd(B, 1, PK.BODY, c[0], c[1], a, 0.92*R*f, 0.64*R, O.W.z - 1, O.W.z + Bb.H*0.7);
    if ((S.k | 0) === 4){ lobe(O, B, 20, PK.ARM, 0, 0); lobe(O, B, 22, PK.ARM, 1, 0); } }
  // (only the pseudopod's end seizes)
  function grab(O, S, B, k, adj){ for (let i = 0; i < (k === 8 ? 2 : 1); i++){ const M = O.M, o = i*12; if (M[o + 11] < 0.05) continue;
    const E = O.toW([M[o + 8], M[o + 9], M[o + 10]]), r = M[o + 7]*0.7 + adj; KB.pAdd(B, 10 + i, PK.GRAB, E[0], E[1], 0, r, r, E[2] - r, E[2] + r); } }   // (its end: a blob round the tip)
  function slam(O, S, B, k){ lobe(O, B, 14, PK.SLAM, k === 2 ? 1 : 0, 1); }
  // contacts: the mass engulfs what it flows over (buildings sink in towards it); the weapon pseudopods along their length when they hit
  function crush(api){
    const S = api.S, O = api.O, cr = api.crushAt, B = O.B || {R:100, H:70};
    if (S.k === 3 && !S.hitDone){ /* the mass gathers round the tower first */ }
    const c = O.toW([0, 10, B.R*0.2]); cr(c[0], c[1], c[2], B.R*0.7, 0, 0.5, 0, 0, 'in');
    const half = S.n & 1;
    for (let i = 0; i < 5; i++){ if ((i & 1) !== half) continue; const a = (i - 2)*0.55, p = O.toW([Math.sin(a)*B.R*0.78, 10, Math.cos(a)*B.R*0.78*(1 + B.fb)]); cr(p[0], p[1], p[2], B.R*0.38, 0, 0.45, 0, 0, 'in'); }
    if ((S.k === 1 || S.k === 2 || S.k === 5 || S.k === 8) && S.hitDone){ const p = O.tip[S.k === 2 ? 1 : 0]; cr(p[0], p[1], p[2], 22, 0, 0.6); }
    if (S.k === 3 && S.hitDone){ const p = O.Lw[0]; cr(p[0], p[1], p[2], 50, 0, 0.5, 0, 0, 'in'); }
  }
  // v31: the mass and its pseudopods as spheres (the army's aim / impact points)
  function body(O, S, out){ let n = 0; const B = O.B || {R:100, H:70}, sp = KB.sph;
    n = sp(out, n, O.toW([0, B.H*0.45, 0]), B.R*0.62); n = sp(out, n, O.toW([0, B.H*0.4, B.R*0.6]), B.R*0.45); n = sp(out, n, O.toW([B.R*0.6, B.H*0.35, -B.R*0.2]), B.R*0.42);
    n = sp(out, n, O.toW([-B.R*0.6, B.H*0.35, -B.R*0.2]), B.R*0.42); n = sp(out, n, O.toW([0, B.H*0.35, -B.R*0.6]), B.R*0.45);
    for (let i = 0; i < NL; i++){ if (O.M[i*12 + 11] > 0.2) n = sp(out, n, O.Lw[i], Math.max(6, O.M[i*12 + 7])); }
    out.length = n; return out; }
  return {id:'shoggoth', zh:'修格斯', en:'Shoggoth', BN, BI, NL, NM, pose, mkOut, mkCtx:null, ctxStep:null, body,
    parts, grab, slam, GRABK:{5:1, 8:1}, SLAMK:{1:1, 2:1}, reachR:650, underR:115,
    DIFF, RISE_T:18, RISE_D:120, ACT_DUR, HIT_P, strideOf, decide, track, hit, crush, riseV:4, closeR:140, closeV:6, acc:2.6, dec:3.5};
})());
//</CORE>

// ---- 16_reptile.js ----
//<CORE>
/* ================= 巨蜥兽 Titan Lizard (v31, original design) — a colossal four-legged armoured reptile: skeleton, pose solver, hunter =================
   Low-slung like a giant monitor lizard / crocodilian, 262 m from snout to tail tip (head 36 m, neck 30 m, trunk 82 m, tail 110 m),
   the back ~48 m up, a broad flat trunk carried on sprawling legs (elbows and knees out to the sides, five-clawed feet planted ~47 m
   either side of the spine). Armoured in a mosaic of keeled osteoderm scutes (skin, not plates: no rows of plates down the back),
   basalt-grey with rust-ochre cross-bands, a pale scaled belly, a long flat-topped head with a bony brow, a lipless jaw of teeth, a
   throat pouch it puffs out and a forked tongue it flicks. It walks in a diagonal trot (left fore with right hind), the spine bending
   from side to side and the tail swinging in a travelling wave; in deep water it tucks its legs and swims with its tail, back and
   head awash. Attacks: a snapping bite at a tower or the street (k 1), a charge that rams through the blocks head-down (k 2), rolling
   sideways over a block (k 3: the whole body turns over once about its spine and crushes what it rolls over), a whip of the tail
   (k 4), the lunge that catches the car in its jaws (k 5) and shakes it held up (k 7), a threat display - front raised, jaws gaping,
   throat pouch out, the tongue flickering (k 6), a rearing snap at an aircraft (k 8). No dorsal plates, no breath, no beam.
   Extras in the snapshot: sw = swimming (0 walking .. 1 swimming), ar = the action's parameter (roll: signed sideways distance m;
   whip: side). */
const KRE = KB.finish((() => {
  const {clamp, lerp, sstep, wrapA, vsub, vadd, vsc, vdot, vcross, vlen, vnorm, vlerp, qmul, qrot, qax, qUnit, qX, qY, qZ, qFrame} = KC.m;
  const PI = Math.PI, TAU = PI*2;
  const SK = KB.Skel(), {BN, BI, bone} = SK;
  // ---- the skeleton in its standing pose (model space: x left, y up, z forward; feet on the ground at y = 0)
  const HB = 32;   // the trunk's spine above the ground
  bone('root', null, 0, HB, 0);
  bone('chest', 'root', 0, 34, 22); bone('shoulder', 'chest', 0, 35, 42); bone('neck1', 'shoulder', 0, 34, 54); bone('neck2', 'neck1', 0, 32, 66);
  bone('head', 'neck2', 0, 30.5, 78); bone('jaw', 'head', 0, 25, 80); bone('gular', 'head', 0, 19, 84); bone('tongue', 'jaw', 0, 24.5, 86);
  bone('loin', 'root', 0, 33, -20); bone('hip', 'loin', 0, 32, -40);
  const NT = 10, TAILP = [[30, -50], [26, -61], [22, -72], [18.5, -83], [15.5, -94], [13, -105], [11, -116], [9.5, -127], [8.5, -138], [8, -148]], TIP = [0, 7.6, -158];
  const TB = []; for (let j = 0; j < NT; j++) TB.push(bone('t' + j, j ? 't' + (j - 1) : 'hip', 0, TAILP[j][0], TAILP[j][1]));
  // legs: socket (upper limb), elbow / knee, wrist / ankle, toes; front ones on the shoulder bone, hind ones on the hip bone
  const LEGS = [];
  for (const [front, gir] of [[1, 'shoulder'], [0, 'hip']]) for (const [s, n] of [[1, 'L'], [-1, 'R']]){
    const nm = (front ? 'f' : 'h') + n;
    const So = front ? [s*15, 27, 44] : [s*15, 27, -40], El = front ? [s*38, 22, 40] : [s*40, 26, -34], Wr = front ? [s*44, 4.5, 50] : [s*46, 5.5, -46], Tt = front ? [s*47, 1.5, 58] : [s*50, 1.5, -36];
    const L = {s, front, n:nm, b:[bone(nm + 's', gir, ...So), bone(nm + 'e', nm + 's', ...El), bone(nm + 'w', nm + 'e', ...Wr), bone(nm + 't', nm + 'w', ...Tt)], toe:front ? [s*49, 0.8, 68] : [s*53, 0.8, -26]};
    L.L1 = vlen(vsub(El, So)); L.L2 = vlen(vsub(Wr, El));
    const mid = vlerp(So, Wr, 0.5); L.pole0 = vnorm(vsub(El, mid));
    L.foot0 = [Tt[0], 0, Tt[2] - (front ? 2 : -2)];   // where the foot's centre stands at rest
    LEGS.push(L);
  }
  const NB = BN.length;
  const EYES = [[10.5, 33.5, 88], [-10.5, 33.5, 88]];
  // gait: a diagonal trot (fore left with hind right); a cycle covers S m; the feet are down BETA of it
  const BETA = 0.64, strideOf = (v, P) => lerp(84 + 2.1*Math.max(0, v), 150, P && P.sw !== undefined ? P.sw : 0);
  const LOFF = [0, 0.5, 0.52, 0.02];   // fL, fR, hL, hR
  // actions: 1 bite, 2 ram (a charge), 3 roll over a block, 4 tail whip, 5 the catching lunge, 6 display, 7 hold, 8 snap at an aircraft,
  // 9 stomp (a front foot raised and slammed down on a car beside / under its chest: az's sign picks the foot, + left)
  const ACT_DUR = [0, 3.4, 4.8, 5.0, 3.4, 3.6, 4.2, 4.5, 2.6, 3.0], HIT_P = {1:0.5, 2:0.55, 3:0.55, 4:0.5, 5:0.5, 8:0.5, 9:0.56};
  function mkOut(){ const O = KB.mkOut(NB); O.feet = LEGS.map(() => ({ph:0, ankle:[0, 0, 0], stance:true, skip:false})); O.tail = []; for (let j = 0; j <= NT; j++) O.tail.push([0, 0, 0]); return O; }
  const UP = [0, 1, 0];
  // the roll: u (0 crouch .. 1 back on its feet) and the angle (one full turn about the spine, the top towards the side it rolls to)
  const rollU = pr => sstep(0.14, 0.76, pr);
  const flick = t => { const c = ((t*0.21) % 1 + 1) % 1; return c < 0.16 ? Math.sin(PI*c/0.16) : 0; };   // the tongue every ~5 s
  function pose(P, env, O){
    O = O || mkOut(); KB.setW(P, O);
    const t = P.t, v = Math.max(0, P.v || 0), A = clamp(v/3, 0, 1), S = strideOf(v, P), k = P.k | 0, pr = P.p || 0, g = P.g || 0, sw = clamp(P.sw || 0, 0, 1), land = 1 - sw;
    const pp = O.pj, qq = O.qj, fk = KB.mkFK(BN, O);
    const roar = k === 6 ? sstep(0, 0.2, pr)*(1 - sstep(0.82, 1, pr)) : 0;
    const ram = k === 2 ? sstep(0, 0.12, pr)*(1 - sstep(0.86, 1, pr)) : 0;
    const snapU = k === 8 ? sstep(0, 0.3, pr)*(1 - sstep(0.75, 1, pr)) : 0;
    const hold = k === 7 ? sstep(0, 0.2, pr)*(1 - sstep(0.85, 1, pr)) : 0;
    const bite = (k === 1 || k === 5) ? pr : -1;
    const rl = k === 3 ? rollU(pr) : 0, rsg = (P.ar || 0) >= 0 ? 1 : -1, rollA = k === 3 ? -rsg*TAU*rl : 0, tuck = k === 3 ? sstep(0, 0.14, pr)*(1 - sstep(0.76, 0.92, pr)) : 0;
    const whip = k === 4 ? Math.sin(PI*sstep(0.06, 0.94, pr)) : 0, wsg = (P.ar || 1) >= 0 ? 1 : -1;
    // ---- the trunk: the girdles swing from side to side with the trot; a heave twice a cycle; the front raised to display / snap
    const wave = A*land, bend = 0.085*Math.sin(TAU*g)*wave, bob = -1.6*Math.cos(4*PI*g)*wave;
    let gs = 0; for (const L of LEGS){ const fw = O.toW([L.foot0[0], 0, L.foot0[2]]); gs += env.ground(fw[0], fw[1]) - P.z; }
    const gA = land*clamp(gs/4, -30, 30), rollLift = k === 3 ? 13*Math.abs(Math.sin(rollA)) + 9*Math.sin(PI*rl) : 0;
    // v31: the jaws on the aim point: corrections learnt from the last pose's miss (the mouth vs the aim, in its own frame) while it
    // lunges - forward the body's lunge, down the neck's pitch, sideways its yaw - relaxed back to none between bites
    const BC = O.bc || (O.bc = [0, 0, 0]), sh5 = bite >= 0 ? sstep(0.3, 0.48, bite)*(1 - sstep(0.7, 1, bite)) : 0;
    if (bite >= 0 && O.mouth && O.mouth.length){ const w = 0.3*sstep(0.3, 0.46, bite), E = O.toM(P.ax, P.ay, P.az), M = O.toM(O.mouth[0], O.mouth[1], O.mouth[2]);
      BC[0] = clamp(BC[0] + w*(E[2] - M[2]), -28, 30); BC[1] = clamp(BC[1] - w*(E[1] - M[1])/55, -0.35, 0.9); BC[2] = clamp(BC[2] + w*(E[0] - M[0])/70, -0.6, 0.6); }
    else if (bite < 0){ BC[0] *= 0.9; BC[1] *= 0.9; BC[2] *= 0.9; }
    const lunge = bite >= 0 ? 10*Math.sin(PI*clamp((bite - 0.2)/0.45, 0, 1)) + BC[0]*sh5 : 0;
    pp[0] = [0, HB + bob + gA - 7*ram + 9*roar + 16*snapU + rollLift - 4*sw, lunge + 6*ram];
    const pitch = 0.025*Math.sin(4*PI*g + 0.6)*wave + 0.06*ram - 0.2*roar - 0.42*snapU - 0.06*hold;
    qq[0] = qmul(qmul(qY(bend*0.3), qX(pitch)), qZ(rollA + 0.02*Math.sin(TAU*g)*wave + 0.04*Math.sin(t*0.4)*sw));
    const rootQ = qq[0];
    // ---- spine forward: the girdle turns with the trot, the neck holds the head on its prey
    const ly = clamp(P.ly || 0, -0.9, 0.9), swimH = sw*0.16;
    fk(BI.chest, qmul(qY(bend*0.6), qX(0.01 + 0.02*ram)));
    fk(BI.shoulder, qmul(qY(bend*0.5), qX(-0.04*roar)));
    // the bite aims the neck and head at the target point (yaw / pitch from the shoulder), drawn back first, then shot out
    let aimY = 0, aimP = 0;
    if (bite >= 0 || snapU > 0){ const E = O.toM(P.ax, P.ay, P.az), sh = pp[BI.shoulder] || [0, 35, 42], dx = E[0], dz = E[2] - 42, dy = E[1] - (HB + 4);
      aimY = clamp(Math.atan2(dx, Math.max(10, dz)), -0.9, 0.9); aimP = clamp(Math.atan2(-dy, Math.max(20, Math.hypot(dx, dz))), -0.9, 0.6); void sh; }
    const draw = bite >= 0 ? sstep(0, 0.25, bite)*(1 - sstep(0.3, 0.45, bite)) : 0, shoot = bite >= 0 ? sstep(0.3, 0.48, bite)*(1 - sstep(0.7, 1, bite)) : 0;
    const neckY = -bend*0.9 + ly*0.35 + (aimY*0.5)*(shoot + draw*0.5) + BC[2]*sh5, neckP = 0.05*Math.sin(t*0.5) - 0.3*roar - 0.38*snapU - 0.45*hold - swimH + (aimP*0.45 + 0.08)*shoot - 0.18*draw + 0.12*ram + BC[1]*sh5*0.6;
    fk(BI.neck1, qmul(qY(neckY*0.55), qX(neckP*0.5)));
    fk(BI.neck2, qmul(qY(neckY*0.45 + 0.22*Math.sin(t*6.5)*hold), qX(neckP*0.5 + 0.06*Math.sin(t*0.37))));
    const headP = -0.18*roar - 0.3*snapU + (aimP*0.5)*shoot + 0.1*draw + 0.06*ram + 0.05*Math.sin(t*0.29) - 0.1*sw + BC[1]*sh5*0.4;
    fk(BI.head, qmul(qY(ly*0.25 + aimY*0.3*shoot + 0.14*Math.sin(t*5.3)*hold), qX(headP)));
    // jaws: gape to display, open on the lunge and snap shut at the hit; held a little open round the car
    let jaw = 0.04 + 0.03*Math.sin(t*0.6);
    if (bite >= 0) jaw = 0.62*sstep(0.12, 0.42, bite)*(1 - sstep(0.47, 0.53, bite)) + 0.02;
    if (snapU > 0) jaw = 0.7*sstep(0.1, 0.4, pr)*(1 - sstep(0.46, 0.52, pr)) + 0.02;
    jaw = Math.max(jaw, 0.72*roar, 0.16*hold);
    fk(BI.jaw, qX(jaw));
    // the throat pouch (puffed out to display) and the tongue (flicked out every few seconds; streaming out while it displays)
    { const b = BI.gular, h = BI.head, off = vsub(BN[b].rest, BN[h].rest); off[1] -= 7.5*roar + 1.2*Math.sin(t*1.1)*roar; pp[b] = vadd(pp[h], qrot(qq[h], off)); qq[b] = qq[h]; }
    { const b = BI.tongue, j = BI.jaw, ext = Math.max(24*flick(t)*(1 - sw)*(1 - hold)*(bite >= 0 ? 0 : 1), 26*roar*(0.6 + 0.4*Math.sin(t*9))), off = vsub(BN[b].rest, BN[j].rest); off[2] += ext; off[1] += 0.6*ext/26;
      pp[b] = vadd(pp[j], qrot(qq[j], off)); qq[b] = qmul(qq[j], qmul(qX(-0.06*ext/26 + 0.08*Math.sin(t*14)*ext/26), qY(0.1*Math.sin(t*11)*ext/26))); }
    // ---- spine back and the tail: a travelling wave (small walking, big swimming), the whip, the lash while it displays
    fk(BI.loin, qY(-bend*0.6)); fk(BI.hip, qY(-bend*0.5));
    const ta = lerp(0.045, 0.17, sw)*Math.max(A, sw*0.8) + 0.06*roar, tph = TAU*g*(1 + sw*0.6);
    for (let j = 0; j < NT; j++){
      const u = (j + 1)/NT, y = ta*(0.4 + u)*Math.sin(tph - j*0.62) + whip*wsg*0.15*(0.6 + 0.6*u) + 0.03*Math.sin(t*0.5 + j*0.4)*(1 - A);
      // (v31: on land the tail slopes down and drags its last third along the street - a solid obstacle, swept in the whip)
      const p = (j < 3 ? -0.04 : 0.012)*sw + (k === 3 ? 0.05*tuck : 0) - (j < 2 ? 0.05*roar : 0) + 0.01*Math.sin(t*0.3 + j*0.7) - land*(j === 0 ? 0.025 : j >= 3 ? 0.01 : 0);
      fk(TB[j], qmul(qY(y), qX(p)));
    }
    // ---- legs: planted feet slide back, swinging ones arc forward; tucked along the body when it swims or rolls; two-bone IK
    const rootP = pp[0];
    for (let li = 0; li < LEGS.length; li++){
      const L = LEGS[li], s = L.s, F = O.feet[li], ph = (g + LOFF[li]) % 1;
      let sl, lift, pitchF = 0;
      if (ph < BETA){ const u = ph/BETA; sl = BETA*S*(0.5 - u); lift = 0; }
      else { const u = (ph - BETA)/(1 - BETA), e = u*u*(3 - 2*u); sl = BETA*S*(-0.5 + e); lift = (9 + 0.09*S)*Math.sin(PI*u); pitchF = 0.35*Math.sin(PI*u); }
      sl *= A; lift *= A; pitchF *= A;
      let Fm = [L.foot0[0], 0, L.foot0[2] + sl + (L.front ? 4*ram : 0)];
      const fw0 = O.toW(Fm); Fm[1] = env.ground(fw0[0], fw0[1]) - P.z + lift;
      // the front feet: pushed out in front to raise the chest (display), off the ground to snap at an aircraft
      if (L.front && roar > 0){ Fm = vlerp(Fm, [s*44, Fm[1] - lift, 64], roar); }
      if (L.front && snapU > 0){ Fm = vlerp(Fm, vadd(rootP, qrot(rootQ, [s*36, -10, 50])), snapU); }
      // v31: the stomp - a front foot lifted ~30 m over the aim point (within reach of the shoulder) and slammed down
      if (k === 9 && L.front && (s > 0) === ((P.az || 0) >= 0)){
        const E = O.toM(P.ax, P.ay, 0), u1 = sstep(0, 0.42, pr), u2 = sstep(0.44, 0.56, pr), back = sstep(0.82, 1, pr);
        let ex = E[0], ez = E[2]; const dx = ex - s*15, dz = ez - 44, dl = Math.hypot(dx, dz); if (dl > 62){ ex = s*15 + dx*62/dl; ez = 44 + dz*62/dl; }
        const ew = O.toW([ex, 0, ez]), gyE = env.ground(ew[0], ew[1]) - P.z, St = [lerp(Fm[0], ex, u1), lerp(Fm[1], gyE, u1) + 30*u1*(1 - u2), lerp(Fm[2], ez, u1)];
        Fm = vlerp(St, Fm, back); lift = lerp(30*u1*(1 - u2), lift, back);
      }
      // tucked: folded back along the flank (in the root's frame, so it turns with the body)
      const tk = Math.max(tuck, sw);
      if (tk > 0){ const loc = L.front ? [s*32, -17, 24] : [s*30, -15, -56], w = vadd(rootP, qrot(rootQ, loc)); Fm = vlerp(Fm, w, tk); }   // (v31: low along the flank, elbows down)
      F.ph = ph; F.stance = ph < BETA && A > 0.3 && tk < 0.5; F.skip = tk > 0.4 || (L.front && (roar > 0.3 || snapU > 0.3 || k === 9)); F.ankle = O.toW(Fm);
      // IK from the socket (on its girdle bone) to the wrist / ankle above the foot's centre
      const gb = L.front ? BI.shoulder : BI.hip, So = vadd(pp[gb], qrot(qq[gb], vsub(BN[L.b[0]].rest, BN[gb].rest)));
      const fwd = qrot(qY(bend*(L.front ? 0.8 : -0.8)), [0, 0, 1]), Wt = vadd(Fm, [0, 4.5 + 0.5*lift, (L.front ? -4 : 4)*fwd[2]]);
      const pole = vnorm(qrot(rootQ, vadd(L.pole0, [0, -0.9*tk, 0])));
      const R = KB.ik2(So, Wt, L.L1, L.L2, pole);
      const rU = vnorm(vsub(BN[L.b[1]].rest, BN[L.b[0]].rest)), rL = vnorm(vsub(BN[L.b[2]].rest, BN[L.b[1]].rest));
      pp[L.b[0]] = So; qq[L.b[0]] = qFrame(rU, L.pole0, vnorm(vsub(R.k, So)), pole);
      pp[L.b[1]] = R.k; qq[L.b[1]] = qFrame(rL, L.pole0, vnorm(vsub(R.e, R.k)), pole);
      // the foot flat on the ground (turned with the body's yaw; the heel lifting in the swing; tucked: along the flank)
      const qf = qmul(qY(bend*(L.front ? 0.6 : -0.6) + (L.front ? 0.08 : -0.1)*s), qX(0.5*pitchF));
      pp[L.b[2]] = R.e; qq[L.b[2]] = tk > 0.01 ? slerpQ(qf, qmul(rootQ, qX(L.front ? 0.9 : -0.9)), tk) : qf;
      fk(L.b[3], qX(F.stance ? 0.02 : 0.25*Math.sin(PI*Math.max(0, (ph - BETA)/(1 - BETA)))*A + 0.4*tk));
    }
    KB.writeM(O, BN);
    for (let i = 0; i < 2; i++) O.eye[i] = KB.ptW(O, BI.head, vsub(EYES[i], BN[BI.head].rest));
    O.head = KB.jointW(O, BI.head); O.mouth = KB.ptW(O, BI.head, [0, -3, 26]); O.hold = KB.ptW(O, BI.head, [0, -4.5, 22]);
    O.chest = KB.jointW(O, BI.shoulder); O.pelvis = KB.jointW(O, BI.hip);
    for (let j = 0; j < NT; j++) O.tail[j] = KB.jointW(O, TB[j]); O.tail[NT] = KB.ptW(O, TB[NT - 1], vsub(TIP, BN[TB[NT - 1]].rest));
    O.tip[0] = O.mouth; O.tip[1] = O.tail[NT]; O.hands[0] = O.feet[0].ankle; O.hands[1] = O.feet[1].ankle;
    return O;
  }
  // a normalised lerp of two quaternions (the short way)
  function slerpQ(a, b, t){ let d = a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3]; const s = d < 0 ? -1 : 1; const q = [a[0] + (s*b[0] - a[0])*t, a[1] + (s*b[1] - a[1])*t, a[2] + (s*b[2] - a[2])*t, a[3] + (s*b[3] - a[3])*t]; const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0]/l, q[1]/l, q[2]/l, q[3]/l]; }

  // ---------------- the hunter ----------------
  const DIFF = [{vb:9, vburst:19, vfar:15, grab:22, cool:6, turn:0.28, lead:0.6, vram:26},
                {vb:11.5, vburst:24, vfar:19, grab:28, cool:4.8, turn:0.34, lead:0.8, vram:32},
                {vb:14, vburst:29, vfar:24, grab:34, cool:3.6, turn:0.42, lead:1.0, vram:38}];
  const SWIM_Z = -36;
  function init(api){ const S = api.S; S.sw = api.env.water(S.x, S.y) && api.env.ground(S.x, S.y) < -12 ? 1 : 0; S.ramCool = 6; S.rlu = 0; S.stompCool = 5; }
  // deep water: it swims (the trunk awash); the model's origin is then SWIM_Z under the surface
  function deep(env, x, y){ return env.water(x, y) && env.ground(x, y) < -12; }
  function groundAt(api){
    const S = api.S, env = api.env, fx = Math.sin(S.hdg), fy = Math.cos(S.hdg);
    const g = (env.ground(S.x, S.y)*2 + env.ground(S.x + fx*45, S.y + fy*45) + env.ground(S.x - fx*40, S.y - fy*40))/4;
    return lerp(g, SWIM_Z, S.sw);
  }
  function speed(api, T, tv, dist){
    const S = api.S, D = api.D;
    if (S.k === 2 && S.p > 0.1 && S.p < 0.86) return D.vram;
    return (S.burst > 0 ? D.vburst : lerp(D.vb, D.vfar, sstep(500, 2200, dist)))*(1 + 0.3*S.sw);
  }
  const actSlow = (k, S) => k === 2 ? 1 : k === 3 || k === 6 || k === 9 ? 0 : k === 7 || k === 8 ? 0.1 : 0.4;
  function steer(api, hWant, turn, dt){
    const S = api.S, r = S.k === 2 && S.p > 0.1 ? 0.25 : S.k === 3 || S.k === 9 ? 0 : 1, de = wrapA(hWant - S.hdg), tr = (turn + 0.006*S.v)*r*dt; S.hdg = wrapA(S.hdg + clamp(de, -tr, tr));
  }
  function preStep(api, dt){
    const S = api.S, env = api.env, wet = deep(env, S.x, S.y) || (S.sw > 0.5 && deep(env, S.x + Math.sin(S.hdg)*30, S.y + Math.cos(S.hdg)*30)) ? 1 : 0;
    S.sw += clamp(wet - S.sw, -0.45*dt, 0.45*dt);
    S.ramCool = (S.ramCool || 0) - dt; S.stompCool = (S.stompCool || 0) - dt;
    // the roll carries it sideways over the block (the distance in ar, its side in ar's sign)
    if (S.k === 3){ const u = rollU(S.p), du = u - (S.rlu || 0); S.rlu = u; const sg = (S.ar || 0) >= 0 ? 1 : -1, d = Math.abs(S.ar || 60)*du;
      S.x += -Math.cos(S.hdg)*sg*d; S.y += Math.sin(S.hdg)*sg*d; } else S.rlu = 0;
  }
  function decide(api, T, tv, c){
    const S = api.S, D = api.D, rng = api.rng, env = api.env, ar = Math.abs(c.rel);
    if (c.air){ if (c.dist < 170 && c.tz - c.gz < 115 && S.sw < 0.5){ api.startAct(8, c.qx, c.qy, c.tz); S.cool = D.cool*0.8; } return; }
    if (S.sw > 0.6){ if (c.qd < 125 && ar < 0.6){ api.startAct(c.army ? 1 : 5, c.qx, c.qy, env.ground(c.qx, c.qy) + 1); S.cool = D.cool; } return; }
    // v31: a car lingering under its chest or beside its front legs (slower than 7 m/s): a stomp (telegraphed ~1.7 s, crushing)
    if (!c.army && c.dist < 85 && Math.hypot(tv.vx, tv.vy) < 7 && S.stompCool <= 0 && S.sw < 0.2){ const tq = HIT_P[9]*ACT_DUR[9]*0.15, sx = T.x + tv.vx*tq, sy = T.y + tv.vy*tq, lx = -Math.cos(S.hdg)*(sx - S.x) + Math.sin(S.hdg)*(sy - S.y);
      api.startAct(9, sx, sy, lx >= 0 ? 1 : -1); S.stompCool = 6 + 5*rng(); S.cool = 2.4; return; }
    if (c.qd < 128 && !c.under && ar < 0.7){ api.startAct(!c.army && rng() < 0.55 + 0.1*api.di ? 5 : 1, c.qx, c.qy, env.ground(c.qx, c.qy) + 1); S.cool = D.cool; return; }
    if (ar > 1.9 && c.dist < 230 && S.sweepCool <= 0){ api.startAct(4, S.x, S.y, S.z); S.ar = c.rel > 0 ? -1 : 1; S.sweepCool = 7 + 6*rng(); S.cool = 2.4; return; }
    if (c.dist > 210 && c.dist < 700 && ar < 0.3 && S.ramCool <= 0 && S.sw < 0.2){ api.startAct(2, c.qx, c.qy, env.ground(c.qx, c.qy)); S.ramCool = 13 + 8*rng(); S.cool = 3; return; }
    if (S.sweepCool <= 0 && S.sw < 0.2){
      // a block beside it (left or right, 60-130 m): roll over it
      const lx = -Math.cos(S.hdg), lyy = Math.sin(S.hdg);
      for (const sd of rng() < 0.5 ? [1, -1] : [-1, 1]){
        const b = api.bldTall(S.x + lx*sd*90, S.y + lyy*sd*90, 60, 22, b => { const dx = b.cx - S.x, dy = b.cy - S.y, lat = (dx*lx + dy*lyy)*sd, fw = dx*Math.sin(S.hdg) + dy*Math.cos(S.hdg); return lat > 50 && lat < 135 && Math.abs(fw) < 70; });
        if (b && rng() < 0.6){ const dx = b.cx - S.x, dy = b.cy - S.y, lat = (dx*lx + dy*lyy)*sd; api.startAct(3, b.cx, b.cy, b.z1); S.ar = sd*Math.round(Math.min(110, lat + 25)); S.sweepCool = 10 + 6*rng(); S.cool = 2.5; return; }
      }
      if (c.dist < 600 && ar > 0.8){ api.startAct(4, S.x, S.y, S.z); S.ar = c.rel > 0 ? -1 : 1; S.sweepCool = 8 + 6*rng(); S.cool = 2.4; }
    }
  }
  function track(api, T, tv){
    const S = api.S; if (S.k !== 5 && S.k !== 1) return;
    const ti = Math.max(0, (HIT_P[S.k] - S.p)*ACT_DUR[S.k]); S.ax = T.x + tv.vx*ti; S.ay = T.y + tv.vy*ti; S.az = api.env.ground(S.ax, S.ay) + 1;
  }
  function hit(api, T){
    const S = api.S, k = S.k, O = api.O, env = api.env, D = api.D, m = O.mouth;
    if (k === 2){ const h = O.head; S.ax = h[0]; S.ay = h[1]; S.az = env.ground(h[0], h[1]); }
    if (k === 3){ const c = O.chest, p = O.pelvis; S.ax = (c[0] + p[0])/2; S.ay = (c[1] + p[1])/2; S.az = env.ground(S.ax, S.ay); }
    if (k === 4){ const tl = O.tail[7]; S.ax = tl[0]; S.ay = tl[1]; S.az = env.ground(tl[0], tl[1]); }
    if (k === 9){ const a = O.feet[(S.az || 0) >= 0 ? 0 : 1].ankle; S.ax = a[0]; S.ay = a[1]; api.crushAt(a[0], a[1], env.ground(a[0], a[1]), 22, 10, 0.9); }
    api.out.events.push({e:'hit', k, x:S.ax, y:S.ay, z:k === 9 ? env.ground(S.ax, S.ay) : S.az});
    // (v31: the jaws catch only by closing on the car in the window (k 1, 5, 8); the charging head, the rolling trunk and the whipping
    // tail throw / crush the car only where they meet it: KB.Touch)
    if (k === 1 || k === 5) api.crushAt(m[0], m[1], env.ground(m[0], m[1]) + 10, 26, 40, 0.88, Math.sin(S.hdg), Math.cos(S.hdg));
    if (k === 2){   // the charge's head and shoulders burst through what stands in the way
      const fx = Math.sin(S.hdg), fy = Math.cos(S.hdg), h = O.head, c = O.chest;
      api.crushAt(h[0], h[1], env.ground(h[0], h[1]) + 20, 36, 30, 0.96, fx, fy, 'dir'); api.crushAt(c[0], c[1], env.ground(c[0], c[1]) + 20, 40, 30, 0.95, fx, fy);
    }
    if (k === 3){   // it rolls over the block: the whole length of the trunk comes down on it
      const sg = (S.ar || 0) >= 0 ? 1 : -1, lx = -Math.cos(S.hdg)*sg, lyy = Math.sin(S.hdg)*sg;
      for (const p of [O.head, KB.jointW(O, BI.neck1), O.chest, KB.jointW(O, BI.root), O.pelvis, O.tail[2]]) api.crushAt(p[0], p[1], env.ground(p[0], p[1]) + 15, 34, 120, 0.95, lx, lyy);
    }
    if (k === 4){   // the tail sweeps round: what it meets is knocked along the sweep
      const sg = (S.ar || 1) >= 0 ? 1 : -1;
      for (let j = 3; j <= NT; j++){ const p = O.tail[j], q = O.tail[j - 1], gz = env.ground(p[0], p[1]); let tx = p[0] - q[0], ty = p[1] - q[1]; const l = Math.hypot(tx, ty) || 1;
        api.crushAt(p[0], p[1], gz + 10, 22, 20, 0.92, -sg*ty/l, sg*tx/l); }
    }
    void T; void D;
  }
  // v31: solid parts (rest-space boxes of the LOD-0 mesh per bone): the feet (wrist / ankle and toes: crushing when they come down on
  // the car), the lower limbs, the tail (it drags), the trunk (the belly ~17 m up: the car passes under it; the rolling trunk crushes,
  // k 3), the neck and the head (low in the charge); the grab: the jaws (k 1, 5; k 8 at an aircraft)
  const PK = KB.PK, mir = (mn, mx) => [[-mx[0], mn[1], mn[2]], [-mn[0], mx[1], mx[2]]];
  const LB = {f:[['w', PK.FOOT, [39.5, -0.8, 46.8], [51.8, 7.8, 58.5], 0], ['t', PK.FOOT, [39.4, -2.1, 56.3], [59, 3.1, 68.2], 0], ['e', PK.LEG, [31.3, 5.1, 32.9], [48.1, 31.3, 52.7]]],
    h:[['w', PK.FOOT, [40.8, -0.7, -49.8], [55.3, 8.5, -35.5], 0], ['t', PK.FOOT, [40.6, -2.7, -38.2], [63.3, 3.2, -24.3], 0], ['e', PK.LEG, [32, 6.2, -48.8], [51.3, 36.7, -25.4]]]};
  const TBX = [[[-14.7, 16.8, -62.5], [14.8, 40.9, -47.2]], [[-12.5, 13.3, -73], [12.6, 35.7, -57.8]], [[-10.6, 10.7, -83.5], [10.7, 30.9, -69.3]], [[-8.7, 8.3, -93.9], [8.7, 26.7, -80.9]],
    [[-7.3, 6.5, -104.4], [7.4, 22.6, -92.4]], [[-5.8, 5.4, -115], [6, 19.4, -103.8]], [[-4.5, 4.6, -125.7], [4.6, 16.5, -115.2]], [[-3.4, 4.7, -136.5], [3.5, 13.9, -126.6]],
    [[-2.2, 4.7, -146.4], [2.2, 12.1, -137.8]], [[-1.6, 5.7, -158], [1.6, 10.2, -147.9]]];
  const TRK = [['root', [-30, 16.9, -22], [30.3, 49.6, -7.6]], ['chest', [-30.6, 17.2, -5.5], [30.7, 50.9, 24.1]], ['shoulder', [-27.3, 19.3, 26.3], [27.3, 50.8, 38.5]], ['loin', [-27.1, 17.6, -37.1], [27.4, 48.9, -23.4]],
    ['hip', [-22.7, 18, -50.7], [23, 46, -36.4]], ['neck1', [-22.6, 20, 39.4], [22.9, 49.3, 51.2]], ['neck2', [-15.1, 18.4, 51.8], [15.2, 45, 77.3]], ['head', [-13.1, 22.8, 74.8], [13, 39.9, 113.3]], ['jaw', [-11.2, 20.3, 80], [11.1, 28.4, 112.7]]];
  function parts(O, S, env, B){
    for (let li = 0; li < 4; li++){ const L = LEGS[li], T = LB[L.front ? 'f' : 'h'];
      for (let q = 0; q < 3; q++){ const [nm, k, mn, mx, fl] = T[q], m = L.s > 0 ? [mn, mx] : mir(mn, mx), b = nm === 'w' ? L.b[2] : nm === 't' ? L.b[3] : L.b[1]; KB.pBox(B, O, li*4 + q, k, b, m[0], m[1], BN, fl); } }
    for (let j = 0; j < NT; j++) KB.pBox(B, O, 20 + j, PK.TAIL, TB[j], TBX[j][0], TBX[j][1], BN);
    const roll = (S.k | 0) === 3 && S.p > 0.14 && S.p < 0.8;
    const bite = (S.k | 0) === 1 || (S.k | 0) === 5 || (S.k | 0) === 8;   // (the biting head is judged by its jaws)
    for (let i = 0; i < TRK.length; i++){ if (bite && i >= 6) continue; KB.pBox(B, O, 30 + i, roll && i < 5 ? PK.FOOT : PK.BODY, BI[TRK[i][0]], TRK[i][1], TRK[i][2], BN); }
  }
  function grab(O, S, B, k, adj){ KB.pSeg(B, 50, PK.GRAB, KB.ptW(O, BI.head, [0, -4, 18]), O.mouth, 5.5 + adj); }
  // contacts every step: head, neck, shoulders, trunk, hips, feet, the tail's root; the charge and the roll at full force (army too)
  function crush(api){
    const S = api.S, O = api.O, cr = api.crushAt, env = api.env;
    if (S.sw > 0.9) return;
    const fx = Math.sin(S.hdg), fy = Math.cos(S.hdg), eb = clamp(0.4 + 0.016*S.v, 0.35, 0.8);
    const ramOn = S.k === 2 && S.p > 0.12 && S.p < 0.86, rollOn = S.k === 3 && S.p > 0.18 && S.p < 0.78;
    const e = ramOn ? 0.95 : rollOn ? 0.92 : eb;
    const at = (p, r, ee) => cr(p[0], p[1], p[2], r, 0, ee, fx, fy);
    at(O.head, 15, ramOn ? 0.97 : eb); at(KB.jointW(O, BI.neck2), 14, e); at(O.chest, 26, e); at(KB.jointW(O, BI.root), 28, e); at(O.pelvis, 25, e);
    const half = S.n & 1;
    for (let li = 0; li < 4; li++){ if ((li & 1) !== half || O.feet[li].skip) continue; at(O.feet[li].ankle, 11, eb*1.1); }
    at(O.tail[1], 12, eb); if (half) at(O.tail[4], 8, eb*0.9);
    if (S.k === 4 && S.p > 0.2 && S.p < 0.8){ for (let j = 5 + half; j <= NT; j += 2){ const p = O.tail[j]; cr(p[0], p[1], p[2], 13, 0, 0.9, fx, fy); } }
    // the army: the charge's head and chest, the rolling trunk, the whipping tail run units over (a contact, once per 0.8 s each)
    if (ramOn){ const h = O.head; api.armyAt(h[0], h[1], env.ground(h[0], h[1]), 30, 0.9, fx, fy, true); }
    if (rollOn){ const c = KB.jointW(O, BI.root), sg = (S.ar || 0) >= 0 ? 1 : -1; api.armyAt(c[0], c[1], env.ground(c[0], c[1]), 60, 0.9, -Math.cos(S.hdg)*sg, Math.sin(S.hdg)*sg, true); }
    if (S.k === 4 && S.p > 0.3 && S.p < 0.7){ const p = O.tail[8]; api.armyAt(p[0], p[1], env.ground(p[0], p[1]), 26, 0.85, undefined, undefined, true); }
  }
  // the body as spheres (the army's aim / impact points)
  function body(O, S, out){ let n = 0; const sp = KB.sph, J = i => KB.jointW(O, i);
    n = sp(out, n, O.head, 15); n = sp(out, n, O.mouth, 9); n = sp(out, n, J(BI.neck1), 15); n = sp(out, n, J(BI.neck2), 14); n = sp(out, n, O.chest, 22); n = sp(out, n, J(BI.chest), 24);
    n = sp(out, n, J(BI.root), 24); n = sp(out, n, J(BI.loin), 23); n = sp(out, n, O.pelvis, 21);
    for (let li = 0; li < 4; li++){ n = sp(out, n, J(LEGS[li].b[1]), 9); n = sp(out, n, O.feet[li].ankle, 8); }
    for (let j = 0; j < NT; j += 2) n = sp(out, n, O.tail[j], Math.max(3, 12 - j*1.1));
    out.length = n; return out; }
  return {id:'reptile', zh:'巨蜥兽', en:'Titan Lizard', BN, BI, TB, NT, TIP, LEGS, EYES, HB, pose, mkOut, mkCtx:null, ctxStep:null, body,
    parts, grab, GRABK:{1:1, 5:1, 8:1}, reachR:600, underR:55,
    DIFF, RISE_T:16, RISE_D:70, ACT_DUR, HIT_P, BETA, strideOf, init, groundAt, speed, actSlow, steer, preStep, decide, track, hit, crush,
    X:[{n:'sw', q:2, m:'lin', v0:0}, {n:'ar', q:0, m:'act', v0:0}], riseV:4, closeR:110, closeV:6, acc:2.6, dec:4};
})());
//</CORE>

// ---- 17_wyvern.js ----
//<CORE>
/* ================= 飞龙 Wyvern (v31, original design after the heraldic wyvern) — a flying two-legged dragon: skeleton, flight model, pose, hunter =================
   Bat-winged (the wings are its arms: a humerus, a forearm, a hand with three long fingers spreading the membrane and a hooked thumb
   claw at the wrist), 260 m from wing tip to wing tip, two legs with four-toed talons, a long neck, a horned head, a long tail ending
   in a spade. Iron-blue-black scales over a bronze belly, wine-dark membranes with pale veins, ivory horns and talons, eyes that burn
   ice-blue at night. It flies (the model's origin is the body's centre; P.z its altitude): a flight model with the airspeed v, the
   heading turned in coordinated banked turns (bank <= 55 deg), the climb from the altitude it wants, thrust from flapping (slow beats,
   ~4-6 s a cycle) or gliding, drag and gravity along the path; never below 18 m/s in the air (no stall), never below the ground /
   the roofs in its way. It bursts out of the water and takes wing (the rise), screams on the wing (the roar), circles high over its
   prey, dives on the car and snatches it with its talons (k 5: legs swung forward, wings flared; the catch -> carried off, k 7), beats
   its wings over a block in a near-hover (k 4: the gust blasts the roofs below and throws the traffic), lands on a tower (k 3: it
   flares, perches, screams, the tower crumbles under it and it takes off again), strikes at aircraft in the air (k 8), and hunts
   them (window.SGFly). A shadow on the ground under it (the model's place hook), a wind roar, the beats of its wings.
   Extras in the snapshot: pt = body pitch (rad, nose up +), bk = bank (rad, right wing down +), fm = folded / standing (0 flying ..
   1 perched), fa = flap amplitude (0 gliding .. 1.3 hovering beats); w = wing sweep (0 spread .. 1 swept back for a dive). */
const KWY = KB.finish((() => {
  const {clamp, lerp, sstep, wrapA, vsub, vadd, vsc, vdot, vcross, vlen, vnorm, vlerp, qmul, qrot, qax, qUnit, qX, qY, qZ, qFrame} = KC.m;
  const PI = Math.PI, TAU = PI*2;
  const SK = KB.Skel(), {BN, BI, bone} = SK;
  // ---- the skeleton, wings spread, legs hanging (model space; origin the body's centre; x left, y up, z forward)
  bone('root', null, 0, 0, 0); bone('chest', 'root', 0, 4, 14);
  bone('n0', 'chest', 0, 9, 26); bone('n1', 'n0', 0, 13, 36); bone('n2', 'n1', 0, 17, 46); bone('n3', 'n2', 0, 20.5, 55);
  bone('head', 'n3', 0, 23, 63); bone('jaw', 'head', 0, 20.5, 66);
  const NT = 8, TB = []; for (let j = 0; j < NT; j++) TB.push(bone('t' + j, j ? 't' + (j - 1) : 'root', 0, -0.5 - 0.8*j, -26 - 11*j));
  const TIP = [0, -7.2, -114];
  const WINGS = [];
  for (const [s, n] of [[1, 'L'], [-1, 'R']]){
    const Sh = [s*9, 7, 16], El = [s*34, 9, 8], Wr = [s*72, 11, 14], T1 = [s*130, 12, 4], T2 = [s*114, 8, -36], T3 = [s*84, 4, -56], Th = [s*76, 16, 26];
    const W = {s, n, Sh, El, Wr, T1, T2, T3, Th, b:[bone('wh' + n, 'chest', ...Sh), bone('we' + n, 'wh' + n, ...El), bone('ww' + n, 'we' + n, ...Wr)]};
    W.f = [bone('w1' + n, 'ww' + n, ...Wr), bone('w2' + n, 'ww' + n, ...Wr), bone('w3' + n, 'ww' + n, ...Wr)];
    WINGS.push(W);
  }
  const LEGS = [];
  for (const [s, n] of [[1, 'L'], [-1, 'R']]){
    const Hp = [s*8, -6, -16], Kn = [s*11, -24, -6], An = [s*11, -40, -18], Ft = [s*11, -47, -11];
    const L = {s, n, Hp, Kn, An, Ft, b:[bone('lt' + n, 'root', ...Hp), bone('ls' + n, 'lt' + n, ...Kn), bone('lm' + n, 'ls' + n, ...An), bone('lf' + n, 'lm' + n, ...Ft)]};
    L.L1 = vlen(vsub(Kn, Hp)); L.L2 = vlen(vsub(An, Kn)); L.L3 = vlen(vsub(Ft, An)); L.pole0 = vnorm(vsub(Kn, vlerp(Hp, An, 0.5)));
    LEGS.push(L);
  }
  const NB = BN.length, STAND = 46;   // standing: the origin STAND m above the feet
  const EYES = [[5.2, 25.2, 72], [-5.2, 25.2, 72]];
  const strideOf = () => 1e9;          // (no gait: g is the flap phase, advanced by the flight model)
  // actions: 3 perch on a tower, 4 wing gust, 5 dive-and-snatch, 6 scream, 7 carry the catch, 8 strike at an aircraft
  const ACT_DUR = [0, 3, 3, 10, 5.5, 4.0, 4.2, 4.5, 2.8], HIT_P = {3:0.6, 4:0.5, 5:0.55, 8:0.5};
  function mkOut(){ const O = KB.mkOut(NB); O.feet = []; O.wt = [[0, 0, 0], [0, 0, 0]]; O.tail = []; for (let j = 0; j <= NT; j++) O.tail.push([0, 0, 0]); O.talon = [[0, 0, 0], [0, 0, 0]]; return O; }
  // the wing's joint angles for a pose (left wing; the right one mirrored): e elevation (up +), b humerus sweep (back +), fe elbow
  // (forearm folded forward -), fz forearm lift, fw wrist (hand folded back +), f1..f3 the fingers (back +), tw twist (leading edge down +)
  const WP = {e:0, b:0, fe:0, fz:0, fw:0, f1:0, f2:0, f3:0, tw:0};
  const FOLD = {e:-0.3, b:1.05, fe:-2.25, fz:0.7, fw:2.55, f1:0.32, f2:0.18, f3:0.05, tw:0.2};
  function wingPose(o, A, ph, sweep, fold, flare, roar, gust){
    const fl = 1 - fold, sp = Math.sin(ph), cp = Math.cos(ph), up = Math.max(0, -sp);
    o.e = (A*0.55*cp + 0.1)*fl + roar*0.35 + flare*0.22; o.b = (sweep*0.85 - A*0.2*sp - flare*0.32 + gust*0.25*Math.sin(ph + 0.6))*fl;
    o.fe = (-sweep*0.65 - A*0.5*up - flare*0.15)*fl; o.fz = 0.05*A*sp*fl; o.fw = (sweep*0.55 + A*0.45*up + flare*0.1)*fl;
    o.f1 = (sweep*0.35 + A*0.12*up)*fl; o.f2 = (sweep*0.28)*fl; o.f3 = (sweep*0.15 - flare*0.05)*fl; o.tw = (0.12*A*sp + flare*0.25)*fl;
    for (const k in FOLD) o[k] += FOLD[k]*fold;
    return o;
  }
  const UP = [0, 1, 0];
  function pose(P, env, O){
    O = O || mkOut(); KB.setW(P, O);
    const t = P.t, k = P.k | 0, pr = P.p || 0, g = P.g || 0, fm = clamp(P.fm || 0, 0, 1), fl = 1 - fm, fa = clamp(P.fa || 0, 0, 1.4), sweep = clamp(P.w || 0, 0, 1);
    const pp = O.pj, qq = O.qj, fk = KB.mkFK(BN, O), ph = TAU*g;
    const roar = k === 6 ? sstep(0, 0.2, pr)*(1 - sstep(0.82, 1, pr)) : 0;
    const snatch = k === 5 ? sstep(0.12, 0.4, pr)*(1 - sstep(0.78, 1, pr)) : 0, grip = k === 5 ? sstep(0.5, 0.58, pr) : k === 7 ? 1 : 0;
    const carry = k === 7 ? 1 - sstep(0.92, 1, pr) : 0, gust = k === 4 ? sstep(0, 0.15, pr)*(1 - sstep(0.86, 1, pr)) : 0;
    const strike = k === 8 ? sstep(0.15, 0.45, pr)*(1 - sstep(0.7, 1, pr)) : 0, land = k === 3 ? sstep(0.04, 0.16, pr)*(1 - sstep(0.62, 0.7, pr)) : 0;
    const flare = Math.max(snatch, land*(1 - fm), gust*0.6, strike*0.5);
    // ---- the body: pitch / bank from the flight; inclined, chest up, when it stands; bobbing against the beats
    const pt = lerp(P.pt || 0, 0.5, fm), bk = (P.bk || 0)*fl;
    const A = fa*fl;
    pp[0] = [0, -2.6*A*Math.sin(ph) + 0.6*Math.sin(t*0.7)*fm, 0];
    qq[0] = qmul(qX(-pt), qZ(bk));
    fk(BI.chest, qX(0.04*A*Math.sin(ph + 0.8)));
    // ---- neck and head: forward along the flight, the head held level and on its prey; upright S-curve standing; up to scream
    const ly = clamp(P.ly || 0, -0.9, 0.9), lvl = clamp(pt, -0.8, 0.8)*0.22*fl;
    const nP = [lvl - 0.18*fm - 0.22*roar, lvl - 0.12*fm - 0.15*roar, lvl + 0.08*fm - 0.05*roar, lvl + 0.2*fm + 0.08*roar];
    const look = ly*0.18 + 0.05*Math.sin(t*0.31);
    for (let i = 0; i < 4; i++) fk(BI['n' + i], qmul(qY(look + (strike ? 0 : 0)), qX(nP[i] + 0.03*Math.sin(t*0.5 + i*0.7) + 0.08*snatch)));
    fk(BI.head, qmul(qY(ly*0.25), qX(lvl*0.6 + 0.12*fm - 0.25*roar + 0.18*snatch + 0.04*Math.sin(t*0.43))));
    fk(BI.jaw, qX(0.06 + 0.7*roar + 0.35*snatch*(1 - grip) + 0.3*strike + 0.04*Math.sin(t*0.9)));
    // ---- tail: streaming behind in flight (a slow wave, ruddering against the bank); hanging and curling standing
    for (let j = 0; j < NT; j++){ const u = (j + 1)/NT;
      fk(TB[j], qmul(qY(-bk*0.06 + 0.07*Math.sin(t*0.9 - j*0.6)*(0.4 + u) + 0.05*Math.sin(t*0.6 + j)*fm), qX(0.02*Math.sin(ph - j*0.5)*A + (pt*0.06 - 0.03)*fl - 0.13*fm*(j < 5 ? 1 : 0.4)))); }
    // ---- wings
    const WPs = wingPose(WP, A*(1 + 0.25*gust), ph, sweep, fm, flare, roar, gust);
    for (const W of WINGS){
      const s = W.s;
      fk(W.b[0], qmul(qmul(qZ(s*WPs.e), qY(s*WPs.b)), qX(WPs.tw)));
      fk(W.b[1], qmul(qY(-s*WPs.fe), qZ(s*WPs.fz)));
      fk(W.b[2], qY(s*WPs.fw));
      fk(W.f[0], qY(s*WPs.f1)); fk(W.f[1], qY(s*WPs.f2)); fk(W.f[2], qY(s*WPs.f3));
    }
    // ---- legs: tucked back in flight; swung forward with the talons open to snatch, closed round the catch; standing on the roof
    const rootQ = qq[0];
    for (const L of LEGS){
      const s = L.s;
      // flight: FK angles (thigh back, shin, foot trailing); snatch / carry: forward and down; then the standing IK blended in
      const fwd = Math.max(snatch, carry, strike*0.8), dang = Math.max(gust, land*(1 - fm))*(1 - fwd);
      fk(L.b[0], qX(lerp(lerp(1.25, -0.75, fwd), 0.15, dang) + 0.05*Math.sin(t*0.8 + s)));
      fk(L.b[1], qX(lerp(lerp(0.55, 0.25, fwd), 0.1, dang)));
      fk(L.b[2], qX(lerp(lerp(0.5, -0.45, fwd), -0.1, dang)));
      fk(L.b[3], qX(lerp(0.3, -0.75*(1 - grip) + 0.9*grip, Math.max(fwd, dang*0.5))));
      if (fm > 0.01){
        // standing: IK from the hip to the ankle above the foot on the roof below (P.az: the perch's top when it perches)
        const roof = (k === 3 ? P.az : env.ground(P.x, P.y)) - P.z, Hp = pp[L.b[0]];
        const F = [s*12, roof + 1.5, -6], At = vadd(F, [0, 7.5, -4]);
        const R = KB.ik2(Hp, At, L.L1, L.L2, qrot(rootQ, L.pole0));
        const rT = vnorm(vsub(L.Kn, L.Hp)), rS = vnorm(vsub(L.An, L.Kn)), pole = qrot(rootQ, L.pole0);
        const qT = qFrame(rT, L.pole0, vnorm(vsub(R.k, Hp)), pole), qS = qFrame(rS, L.pole0, vnorm(vsub(R.e, R.k)), pole);
        qq[L.b[0]] = slerpQ(qq[L.b[0]], qT, fm); pp[L.b[1]] = vlerp(pp[L.b[1]], R.k, fm); qq[L.b[1]] = slerpQ(qq[L.b[1]], qS, fm);
        pp[L.b[2]] = vlerp(pp[L.b[2]], R.e, fm); qq[L.b[2]] = slerpQ(qq[L.b[2]], qX(0.25), fm);
        fk(L.b[3], qX(lerp(0.3, 0.05, fm)));
      }
    }
    KB.writeM(O, BN);
    for (let i = 0; i < 2; i++) O.eye[i] = KB.ptW(O, BI.head, vsub(EYES[i], BN[BI.head].rest));
    O.head = KB.jointW(O, BI.head); O.mouth = KB.ptW(O, BI.head, [0, -2, 22]); O.chest = KB.jointW(O, BI.chest); O.pelvis = KB.jointW(O, 0);
    for (let i = 0; i < 2; i++){ const W = WINGS[i], L = LEGS[i];
      O.wt[i] = KB.ptW(O, W.f[0], vsub(W.T1, W.Wr)); O.hands[i] = KB.jointW(O, W.b[2]); O.tip[i] = O.wt[i];
      O.talon[i] = KB.ptW(O, L.b[3], [0, -1.5, 5]); }
    O.hold = [(O.talon[0][0] + O.talon[1][0])/2, (O.talon[0][1] + O.talon[1][1])/2, (O.talon[0][2] + O.talon[1][2])/2 - 2.5];
    for (let j = 0; j < NT; j++) O.tail[j] = KB.jointW(O, TB[j]); O.tail[NT] = KB.ptW(O, TB[NT - 1], vsub(TIP, BN[TB[NT - 1]].rest));
    return O;
  }
  function slerpQ(a, b, t){ if (t <= 0) return a; if (t >= 1) return b; const d = a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3], s = d < 0 ? -1 : 1, q = [a[0] + (s*b[0] - a[0])*t, a[1] + (s*b[1] - a[1])*t, a[2] + (s*b[2] - a[2])*t, a[3] + (s*b[3] - a[3])*t], l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0]/l, q[1]/l, q[2]/l, q[3]/l]; }

  // ---------------- the flight model and the hunter ----------------
  // difficulty: the soaring height above its prey, the circle, how long it circles before it dives, the dive speed, the reach
  const DIFF = [{vb:34, vburst:56, vfar:44, grab:22, cool:6, turn:0.3, lead:0.6, alt:330, ring:470, soar:15, vdive:56},
                {vb:36, vburst:62, vfar:48, grab:28, cool:4.8, turn:0.36, lead:0.8, alt:300, ring:430, soar:11, vdive:62},
                {vb:38, vburst:68, vfar:52, grab:34, cool:3.6, turn:0.42, lead:1.0, alt:270, ring:390, soar:8, vdive:68}];
  const VMIN = 18, GRAV = 9.81, BANK = 0.96;
  const MD = {SOAR:0, DIVE:1, CLIMB:2, GUST:3, PERCH:4, AIR:5};
  function init(api){ const S = api.S; S.md = MD.CLIMB; S.mdT = 0; S.hz = 160; S.vd = 30; S.hd = S.hdg; S.vz = 0; S.fa = 0; S.fm = 1; S.pt = 0.5; S.bk = 0; S.w = 0.6; S.flw = -1;
    S.diveCool = 4; S.perchCool = 18; S.gustCool = 12; S.obs = -1e9; S.obsT = 0; S.ring = api.rng() < 0.5 ? 1 : -1; S.zw = api.env.ground(S.x, S.y); }
  function setMd(S, m){ S.md = m; S.mdT = 0; S.mdAct = false; S.dP = 1e9; }
  function act(api, k, x, y, z){ api.startAct(k, x, y, z); api.S.mdAct = true; }
  // the highest roof (or the ground) within 170 m ahead of it and under it (every 0.4 s)
  function obstacle(api){
    const S = api.S, env = api.env; S.obsT -= 1/30; if (S.obsT > 0) return S.obs; S.obsT = 0.4;
    const fx = Math.sin(S.hdg), fy = Math.cos(S.hdg); let top = Math.max(env.ground(S.x, S.y), env.ground(S.x + fx*120, S.y + fy*120));
    if (env.bldNear) env.bldNear(S.x + fx*90, S.y + fy*90, 140, b => { if (b.z1 > top && !env.destroyed(b.ti, b.idx)) top = b.z1; });
    S.obs = top; return top;
  }
  function think(api, T, tv, c, dt){
    const S = api.S, D = api.D, env = api.env, rng = api.rng;
    S.mdT += dt; S.diveCool -= dt; S.perchCool -= dt; S.gustCool -= dt;
    if (S.k === 3 || S.k === 7){ c.hWant = S.hd; c.vWant = S.vd; return; }
    const gT = Math.max(env.ground(T.x, T.y), env.water(T.x, T.y) ? 0 : -1e9), dxT = T.x - S.x, dyT = T.y - S.y, dT = Math.hypot(dxT, dyT);
    S.flw = -1; S.w += ((S.md === MD.DIVE && dT > 160 ? 0.85 : 0) - S.w)*Math.min(1, dt*1.2);
    if (c.air && S.md !== MD.AIR && S.md !== MD.CLIMB && !S.k) setMd(S, MD.AIR);
    if (!c.air && S.md === MD.AIR) setMd(S, MD.CLIMB);
    if (S.md === MD.SOAR){
      // circle the prey high up: chase a point on the circle a little ahead (clockwise or not), gliding with a beat now and then
      let cx = T.x + tv.vx*2, cy = T.y + tv.vy*2;
      // v33: the escape mission - it circles over the route ahead of the player and swoops in from ahead (KI.ahead, 18_block.js)
      const RT = env.route ? env.route() : null, rp = RT ? RT.ramp || 0 : 0;
      if (RT && RT.n > 1 && !c.air && !c.army && typeof KI !== 'undefined'){ const A = KI.ahead(RT, 520 + 180*rp); cx = A[0]; cy = A[1]; S.ahead = 1; } else S.ahead = 0;
      const a = Math.atan2(S.x - cx, S.y - cy) + S.ring*0.55, R = D.ring;
      S.hd = Math.atan2(cx + Math.sin(a)*R - S.x, cy + Math.cos(a)*R - S.y); S.hz = gT + D.alt; S.vd = S.ahead && Math.hypot(cx - S.x, cy - S.y) > R + 300 ? D.vfar*(1 + 0.15*rp) : D.vb;   // (v33: far from the point ahead it flies in fast)
      // (only once it circles its prey: far away it first flies in)
      // (v33: in the mission it dives from ahead: it waits until it is in front of the player, over the route - or circles too long)
      const front = !S.ahead || ((S.x - T.x)*(cx - T.x) + (S.y - T.y)*(cy - T.y)) > 0.6*dT*Math.hypot(cx - T.x, cy - T.y) || S.mdT > 3*D.soar;
      if (S.mdT > D.soar*(1 - 0.4*rp) && S.diveCool <= 0 && dT < D.ring + 350 && front){
        let b = null; const r = rng();
        if (S.perchCool <= 0 && r < 0.3) b = api.bldTall(T.x + (rng() - 0.5)*500, T.y + (rng() - 0.5)*500, 420, 60, b => b.h < 420);
        if (b){ S.px = b.cx; S.py = b.cy; S.pz = b.z1; S.pr = b.r; setMd(S, MD.PERCH); S.perchCool = 45 + 20*rng(); }
        else if (S.gustCool <= 0 && r < 0.62){ setMd(S, MD.GUST); S.gustCool = 30 + 10*rng(); }
        else setMd(S, MD.DIVE);
      }
    } else if (S.md === MD.DIVE){
      // the stoop: lead the prey, down a ~30 deg glide path to skim over it, wings swept; the snatch when it is ~1.6 s away
      // v31: a stoop down a glide path that levels out ~30 m up (a skim: the talons, swung down, reach ~25 m below the body), then the
      // snatch timed so that the talons arrive on the aim point at the hit moment (its speed regulated to the distance left)
      const hs = Math.max(20, Math.sqrt(Math.max(0, S.v*S.v - S.vz*S.vz)));
      if (S.k === 5 && !S.hitDone){ const h = api.O.hold, dR = Math.hypot(S.ax - h[0], S.ay - h[1]), tR = Math.max(0.15, (HIT_P[5] - S.p)*ACT_DUR[5]);
        S.hd = Math.atan2(S.ax - S.x, S.ay - S.y); S.vd = clamp(dR/tR*S.v/hs, 24, 72); S.hz = gT + 21; S.dP = dR; }
      else if (!S.k){
        const tti = Math.min(5, dT/hs), lf = 0.6 + 0.4*D.lead, px = T.x + tv.vx*tti*lf, py = T.y + tv.vy*tti*lf, dP = Math.hypot(px - S.x, py - S.y);
        S.hd = Math.atan2(px - S.x, py - S.y); S.hz = gT + 30 + Math.max(0, dP - 120)*0.8; S.vd = dP > 220 ? D.vdive : 42; S.dP = dP;
        const tHit = HIT_P[5]*ACT_DUR[5];   // (the snatch aims where the prey will be at the hit)
        if (!S.mdAct && dP/hs < tHit + 0.1 && S.z - gT < 85){ act(api, 5, T.x + tv.vx*tHit, T.y + tv.vy*tHit, gT + 2); } }
      if ((S.mdAct && S.k !== 5) || S.mdT > 16){ setMd(S, MD.CLIMB); S.diveCool = (D.cool*1.6 + 2*rng())*(env.route && env.route() ? 1 - 0.3*(env.route().ramp || 0) : 1); }
    } else if (S.md === MD.CLIMB){
      S.hd = S.hdg + S.ring*0.25; S.hz = gT + D.alt + 30; S.vd = 34; S.flw = 1;
      if (S.mdT > 5 && S.z - gT > D.alt*0.7) setMd(S, MD.SOAR);
    } else if (S.md === MD.GUST){
      // fly in over the blocks by its prey, slow to a near-hover over the roofs and beat the wings down on them
      const tx = T.x - tv.vx*0.5, ty = T.y - tv.vy*0.5, d = Math.hypot(tx - S.x, ty - S.y);
      S.hd = Math.atan2(tx - S.x, ty - S.y); S.hz = Math.max(gT + 95, obstacle(api) + 55); S.vd = Math.max(32, Math.hypot(tv.vx, tv.vy) + 12);
      if (!S.k && !S.mdAct && d < 230){ act(api, 4, tx, ty, gT); }
      if ((S.mdAct && S.k !== 4) || S.mdT > 25){ setMd(S, MD.CLIMB); }
    } else if (S.md === MD.PERCH){
      const d = Math.hypot(S.px - S.x, S.py - S.y);
      S.hd = Math.atan2(S.px - S.x, S.py - S.y); S.hz = S.pz + STAND + 30 + Math.min(150, d*0.3); S.vd = lerp(22, 38, sstep(150, 600, d));
      if (!S.k && !S.mdAct && d < 95){ act(api, 3, S.px, S.py, S.pz); }
      if ((S.mdAct && S.k !== 3) || S.mdT > 30) setMd(S, MD.CLIMB);
    } else if (S.md === MD.AIR){
      // an aircraft: pursue it to an intercept ~24 m above it (the talons reach down), strike when it will meet it at the hit moment;
      // the strike regulates heading and speed so that the talons arrive on the aim point (v31)
      const hs = Math.max(20, Math.sqrt(Math.max(0, S.v*S.v - S.vz*S.vz))), ux = dxT/Math.max(1, dT), uy = dyT/Math.max(1, dT), close = Math.max(12, hs - (tv.vx*ux + tv.vy*uy));
      if (S.k === 8 && !S.hitDone){ const tR = Math.max(0.15, (HIT_P[8] - S.p)*ACT_DUR[8]), qx = T.x + tv.vx*tR, qy = T.y + tv.vy*tR, dR = Math.hypot(qx - S.x, qy - S.y);
        S.hd = Math.atan2(qx - S.x, qy - S.y); S.vd = clamp(dR/tR*S.v/hs, 26, 80); S.hz = (T.z || 0) + (tv.vz || 0)*tR + 6; }   // (it lunges into it: jaws and talons)
      else if (!S.k){ const tti = Math.min(4, dT/close), px = T.x + tv.vx*tti, py = T.y + tv.vy*tti, pz = (T.z || 0) + (tv.vz || 0)*tti, tHit = HIT_P[8]*ACT_DUR[8];
        S.hd = Math.atan2(px - S.x, py - S.y); S.hz = pz + 6; S.vd = Math.max(48, Math.hypot(tv.vx, tv.vy) + 18);
        if (dT/close < tHit + 0.3 && Math.abs(S.z - pz - 6) < 35) api.startAct(8, T.x + tv.vx*tHit, T.y + tv.vy*tHit, (T.z || 0) + (tv.vz || 0)*tHit); }
      if (S.mdT > 40) setMd(S, MD.CLIMB);
    }
    c.hWant = S.hd; c.vWant = S.vd;
  }
  function decide(){ /* (the wyvern decides in think) */ }
  function track(api, T, tv){
    const S = api.S; if (S.k !== 5 && S.k !== 8) return;
    const ti = Math.max(0, (HIT_P[S.k] - S.p)*ACT_DUR[S.k]); S.ax = T.x + tv.vx*ti; S.ay = T.y + tv.vy*ti; S.az = S.k === 8 ? (T.z || 0) + (tv.vz || 0)*ti : api.env.ground(S.ax, S.ay) + 2;
  }
  // the flight model (replaces the walk): see the file header
  function move(api, vWant, hWant, turn, dt){
    const S = api.S, env = api.env, D = api.D, water = env.water(S.x, S.y), gz = water ? Math.max(0, env.ground(S.x, S.y)) : env.ground(S.x, S.y);
    if (S.phase === 'rise'){
      // out of the water (or up from the ground): the head and back break the surface, the wings unfold, it beats up and away
      const u = S.r, w0 = gz, em = sstep(0, 0.38, u);
      S.fm = 1 - sstep(0.22, 0.45, u); S.fa = lerp(0.2, 1.25, sstep(0.3, 0.5, u)); S.w = 0.5*(1 - sstep(0.2, 0.5, u)); S.pt = lerp(0.9, 0.35, sstep(0.4, 1, u)); S.bk = 0;
      S.v = lerp(0, 24, sstep(0.4, 1, u)); S.vz = lerp(0, 9, sstep(0.38, 0.6, u));
      if (u < 0.4){ S.z = w0 - 60 + (STAND + 60 - 6)*em; S.zw = S.z; }
      else { S.zw = (S.zw || S.z) + S.vz*dt; S.z = S.zw; }
      const de = wrapA(hWant - S.hdg); S.hdg = wrapA(S.hdg + clamp(de, -0.15*dt, 0.15*dt));
      S.x += Math.sin(S.hdg)*S.v*dt; S.y += Math.cos(S.hdg)*S.v*dt; S.g = (S.g + dt*(0.12 + 0.13*S.fa)) % 1; S.zg = gz;
      return;
    }
    if (S.k === 3 && S.p < 0.8){ perchMove(api, dt, gz); return; }
    // what it wants: heading, speed, altitude (by phase)
    let hd = S.hd, vd = Math.max(VMIN + 4, S.vd*KB.armySlow(S)), hz = S.hz;   // (the army's fire slows it too)
    if (S.phase === 'roar'){ hd = S.hdg + S.ring*0.35; vd = 30; hz = gz + 170; }
    else if (S.phase === 'catch'){ hd = S.hdg + S.ring*0.3; vd = 30; hz = gz + 230; }
    else if (S.phase === 'won' || S.phase === 'done'){ hd = S.hdg + S.ring*0.12; vd = 36; hz = gz + 380; }
    if (S.k === 4){ vd = 15; }                     // the gust: a near-hover over the roofs
    // keep clear of the ground and the roofs ahead (a snatch skims lower)
    // (a dive near its prey and the snatch go straight through the roofs: they crumble under the wings)
    const low = (S.k === 5 && S.p > 0.2 && S.p < 0.8) || (S.md === MD.DIVE && (S.dP || 1e9) < 420);
    const top = obstacle(api), floor = (low ? gz : Math.max(gz, top)) + (S.k === 5 && S.p > 0.25 && S.p < 0.75 ? 20 : S.k === 4 ? 48 : low ? 34 : 60);
    hz = Math.max(hz, floor);
    // climb rate from the altitude error, limited by the speed (a dive: steep)
    const dive = S.md === MD.DIVE, vzMax = 6 + 8*Math.min(1, S.fa) + (S.flw > 0 ? 3 : 0), vzMin = dive ? -62 : -22;
    // (v31: a dive follows its glide path - a feed-forward of the path's slope and a stiff hold of the height; the snatch holds the skim)
    const snatch = (S.k === 5 || S.k === 8) && S.p < 0.7, hsN = Math.sqrt(Math.max(0, S.v*S.v - S.vz*S.vz));
    let vzW = clamp((hz - S.z)*(dive || snatch ? 1.0 : 0.45) + (dive && !S.k && (S.dP || 0) > 120 ? -0.8*hsN : 0), vzMin, vzMax); vzW = clamp(vzW, -(dive || snatch ? 0.93 : 0.8)*S.v, 0.5*S.v + 4);
    S.vz += clamp(vzW - S.vz, -(dive ? 16 : 10)*dt, (S.k === 5 ? 18 : 8)*dt);
    if (S.z + S.vz*dt < gz + 20){ S.vz = Math.max(S.vz, (gz + 20 - S.z)/dt*0.5); }
    // thrust from the beats, gravity along the path, drag; never below VMIN
    const sinG = clamp(S.vz/Math.max(S.v, 1), -0.95, 0.9);
    const flapW = S.k === 4 ? 1.3 : S.flw >= 0 ? S.flw : clamp((vd - S.v)/9 + sinG*2.4 + (S.v < 24 ? 0.7 : 0) + (S.phase === 'catch' ? 0.5 : 0), 0, 1);
    S.fa += clamp(flapW - S.fa, -0.5*dt, 0.9*dt);
    let acc = S.fa*7 - GRAV*sinG*0.8 - 0.0016*S.v*S.v + (vd < S.v ? (vd - S.v)*0.12 : 0);
    if (S.k === 4) acc = (vd - S.v)*0.8;
    S.v = Math.max(VMIN, S.v + acc*dt);
    // coordinated turn: the turn rate from the heading error, the bank from the turn rate (<= 55 deg)
    const wmax = GRAV*Math.tan(BANK)/Math.max(S.v, 15), herr = wrapA(hd - S.hdg), w = clamp(herr*0.8, -wmax, wmax)*(S.k === 4 ? 0.5 : 1);
    S.hdg = wrapA(S.hdg + w*dt);
    const bkW = Math.atan(w*S.v/GRAV); S.bk += clamp(bkW - S.bk, -0.8*dt, 0.8*dt);
    // body pitch: the path angle, nose up when slow, flared to snatch / hover
    const ptW = Math.asin(sinG)*0.8 + 0.25*clamp((32 - S.v)/14, 0, 1) + (S.k === 4 ? 0.55 : 0) + (S.k === 5 ? 0.45*sstep(0.3, 0.5, S.p)*(1 - sstep(0.7, 0.9, S.p)) : 0) + (S.k === 8 ? 0.3*Math.sin(PI*S.p) : 0);
    S.pt += (ptW - S.pt)*Math.min(1, dt*1.8);
    S.fm += (0 - S.fm)*Math.min(1, dt*2);
    const hs = Math.sqrt(Math.max(0, S.v*S.v - S.vz*S.vz));
    S.x += Math.sin(S.hdg)*hs*dt; S.y += Math.cos(S.hdg)*hs*dt; S.z += S.vz*dt; S.zw = S.z;
    S.g = (S.g + dt*(0.15 + 0.12*Math.min(1.3, S.fa))) % 1; S.zg = gz;
  }
  // the perch: fly in, flare, land on the roof (the origin STAND m above it), stand and scream; the tower crumbles (the hit) and it
  // beats up and away
  function perchMove(api, dt, gz){
    const S = api.S, p = S.p, top = S.az + STAND;
    if (p < 0.16){ const dx = S.ax - S.x, dy = S.ay - S.y, k = Math.min(1, dt*(0.8 + 6*sstep(0.05, 0.16, p)));
      S.hdg = wrapA(S.hdg + clamp(wrapA(Math.atan2(dx, dy) - S.hdg), -0.5*dt, 0.5*dt)); S.x += dx*k; S.y += dy*k; S.z += (top - S.z)*Math.min(1, dt*2.2);
      S.v = Math.max(4, S.v - 10*dt); S.vz = 0; S.fa = 1.1; S.fm = sstep(0.1, 0.16, p); S.pt += (0.65 - S.pt)*Math.min(1, dt*2); S.bk *= Math.exp(-dt*3); }
    else if (p < 0.62){ S.x += (S.ax - S.x)*Math.min(1, dt*3); S.y += (S.ay - S.y)*Math.min(1, dt*3); S.z += (top - S.z)*Math.min(1, dt*3);
      S.v = 0; S.vz = 0; S.fa = Math.max(0, S.fa - dt*1.5); S.fm = 1; S.pt = 0.5; S.bk = 0; }
    else { const u = sstep(0.62, 0.8, p); S.fm = 1 - sstep(0.62, 0.7, p); S.fa = 1.25; S.v = Math.min(26, S.v + 7*dt); S.vz = 6 + 8*u;
      S.pt += (0.4 - S.pt)*Math.min(1, dt*2); S.x += Math.sin(S.hdg)*S.v*dt; S.y += Math.cos(S.hdg)*S.v*dt; S.z += S.vz*dt; }
    S.zw = S.z; S.g = (S.g + dt*(0.12 + 0.13*Math.min(1.3, S.fa))*(1 - S.fm*0.8)) % 1; S.zg = gz;
  }
  function hit(api, T){
    const S = api.S, k = S.k, O = api.O, env = api.env, D = api.D;
    if (k === 4){ const fx = Math.sin(S.hdg), fy = Math.cos(S.hdg); S.ax = S.x + fx*95; S.ay = S.y + fy*95; S.az = env.ground(S.ax, S.ay); }
    api.out.events.push({e:'hit', k, x:S.ax, y:S.ay, z:S.az});
    // (v31: the talons catch only by closing on the car in the window: KB.Touch)
    if (k === 5){ const h = O.hold, gzh = env.ground(h[0], h[1]); api.crushAt(h[0], h[1], Math.max(h[2], gzh + 10), 24, 20, 0.7, Math.sin(S.hdg), Math.cos(S.hdg)); }
    if (k === 4){   // the gust: the roofs in a cone below and ahead are blasted, pushed along the blast; cars in it are shoved (no damage)
      const fx = Math.sin(S.hdg), fy = Math.cos(S.hdg);
      for (let i = 0; i < 5; i++){ const d = 45 + i*36, x = S.x + fx*d, y = S.y + fy*d, gz = env.ground(x, y); api.crushAt(x, y, gz + 30, 30 + i*7, 30, 0.5 - i*0.04, fx, fy); }
      for (const C of env.targets()){ if (!C || C.army || C.kind === 'cam' || C.kind === 'air') continue; const dx = C.x - S.x, dy = C.y - S.y, al = dx*fx + dy*fy, lat = Math.abs(-dx*fy + dy*fx);
        if (al > 20 && al < 250 && lat < 40 + al*0.3){ const f = 1 - al/260; api.out.events.push({e:'throw', id:C.id, x:Math.round(C.x), y:Math.round(C.y), vx:+(fx*9*f).toFixed(1), vy:+(fy*9*f).toFixed(1), vz:+(2.5*f).toFixed(1), k:0, src:'gust'}); } }
    }
    if (k === 3){   // the tower it stands on crumbles under it
      api.crushAt(S.ax, S.ay, S.az - 6, (S.pr || 20) + 4, 400, 0.62, 0, 0, 'in');
      api.crushAt(S.ax, S.ay, env.ground(S.ax, S.ay) + 10, (S.pr || 20) + 30, 10, 0.4);
    }
    void T; void D;
  }
  // v31: solid parts (rest-space boxes of the LOD-0 mesh per bone; they only reach the street in the snatch and on take-off): the legs
  // and talons, the body, the tail, the inner wings; the grab: the talons (k 5; k 8 at an aircraft, with the jaws)
  const PK = KB.PK, mir = (mn, mx) => [[-mx[0], mn[1], mn[2]], [-mn[0], mx[1], mx[2]]];
  const LGB = [['ls', PK.LEG, [6.9, -39, -18.9], [15.1, -23.7, -2.4]], ['lm', PK.LEG, [8.2, -47, -20.2], [13.6, -39.9, -11.5]], ['lf', PK.FOOT, [6.8, -55.6, -20.7], [15.1, -46.4, 2.1]],
    ['we', PK.ARM, [34, 5, -0.2], [68.3, 12.9, 15]], ['wh', PK.ARM, [5.7, 2.5, 5], [31.7, 12.5, 19.8]]];
  const BDB = [['root', [-18.6, -12, -26.2], [18.6, 11.6, -3.9]], ['chest', [-13.8, -13.1, -2.7], [13.9, 16.4, 22.1]]];
  function parts(O, S, env, B){
    if (S.z - (S.zg || 0) > 160) return;   // (high up: nothing reaches the street)
    const snatch = (S.k | 0) === 5 || (S.k | 0) === 8;   // (the snatching legs are judged by the talons)
    let id = 0; for (const [n, k, mn, mx] of LGB) for (const sd of ['L', 'R']){ const m = sd === 'L' ? [mn, mx] : mir(mn, mx); if (!(snatch && k !== PK.ARM)) KB.pBox(B, O, id, k, BI[n + sd], m[0], m[1], BN); id++; }
    for (const [n, mn, mx] of BDB) KB.pBox(B, O, id++, PK.BODY, BI[n], mn, mx, BN);
    for (let j = 0; j < NT; j += 2) KB.pSeg(B, 20 + j, PK.TAIL, O.tail[j], O.tail[j + 2], 8 - j*0.7);
  }
  function grab(O, S, B, k, adj){ const J = i => KB.jointW(O, i);
    // (each foot's talons: the two feet are ~20 m apart - a car between them is not seized)
    KB.pSeg(B, 41, PK.GRAB, J(LEGS[0].b[3]), O.talon[0], 5.5 + adj); KB.pSeg(B, 42, PK.GRAB, J(LEGS[1].b[3]), O.talon[1], 5.5 + adj);
    if (k === 8){ KB.pSeg(B, 43, PK.GRAB, O.head, O.mouth, 9 + adj); KB.pSeg(B, 44, PK.GRAB, O.chest, O.pelvis, 13 + adj); } }
  // contacts: the body, the wings and the legs where they meet roofs (low passes, the gust's near-hover); the talons in the snatch
  function crush(api){
    const S = api.S, O = api.O, cr = api.crushAt, env = api.env;
    if (S.k === 3 && S.p > 0.1 && S.p < 0.62) return;     // (perched: the tower stands until it crumbles)
    const gz = env.ground(S.x, S.y); if (S.z - gz > 520) return;
    const fx = Math.sin(S.hdg), fy = Math.cos(S.hdg), e = clamp(0.35 + S.v/120, 0.35, 0.85), half = S.n & 1;
    const at = (p, r, ee) => cr(p[0], p[1], p[2], r, 0, ee, fx, fy);
    at(O.pelvis, 20, e); at(O.chest, 18, e);
    if (half){ at(O.hands[0], 12, e); at(O.wt[0], 10, e*0.8); at(O.tail[4], 8, e*0.8); } else { at(O.hands[1], 12, e); at(O.wt[1], 10, e*0.8); at(O.head, 10, e); }
    if (S.k === 5 && S.p > 0.35 && S.p < 0.75){ at(O.talon[0], 10, 0.75); at(O.talon[1], 10, 0.75); const h = O.hold; api.armyAt(h[0], h[1], h[2], 22, 0.85, fx, fy, true); }
  }
  // the body as spheres (the army's aim / impact points)
  function body(O, S, out){ let n = 0; const sp = KB.sph, J = i => KB.jointW(O, i);
    n = sp(out, n, O.pelvis, 18); n = sp(out, n, O.chest, 17); n = sp(out, n, J(BI.n1), 8); n = sp(out, n, J(BI.n3), 7); n = sp(out, n, O.head, 8);
    for (const W of WINGS){ n = sp(out, n, J(W.b[1]), 9); n = sp(out, n, J(W.b[2]), 8); n = sp(out, n, O.wt[W.s > 0 ? 0 : 1], 7); n = sp(out, n, KB.ptW(O, W.f[1], vsc(vsub(W.T2, W.Wr), 0.6)), 9); n = sp(out, n, KB.ptW(O, W.f[2], vsc(vsub(W.T3, W.Wr), 0.6)), 9); }
    for (const L of LEGS){ n = sp(out, n, J(L.b[1]), 7); n = sp(out, n, J(L.b[3]), 5); }
    n = sp(out, n, O.tail[2], 7); n = sp(out, n, O.tail[6], 5);
    out.length = n; return out; }
  return {id:'wyvern', zh:'飞龙', en:'Wyvern', BN, BI, TB, NT, TIP, WINGS, LEGS, EYES, STAND, pose, mkOut, mkCtx:null, ctxStep:null, body, flyer:true,
    parts, grab, GRABK:{5:1, 8:1}, reachR:700, grabPre:0.09, grabWin:0.08,
    DIFF, RISE_T:13, RISE_D:60, ACT_DUR, HIT_P, strideOf, init, think, decide, track, move, hit, crush, MD, wGoal:S => S.w,
    X:[{n:'pt', q:3, m:'ang', v0:0}, {n:'bk', q:3, m:'ang', v0:0}, {n:'fm', q:2, m:'lin', v0:0}, {n:'fa', q:2, m:'lin', v0:0}], riseV:0, closeR:0, closeV:99};
})());
//</CORE>

// ---- 18_block.js ----
//<CORE>
/* ================= v33 (lm30/kaiju5): the creature cuts the player off on the escape route =================
   Pure JS (node-testable). In the escape mission the game hands the hunter the player's predicted route: env.route() -> R =
   {x, y: Float64Array (the polyline, starting at the player), s: Float64Array (arc length from the player), n, cps:[{x, y, s}] (the
   checkpoints still ahead, the exit last), ramp 0-1 (the share of the route's checkpoints already passed), v (the player's speed m/s),
   junc: Uint8Array (1 where the route turns at a vertex: a junction of the navigation route)} or null (no mission, multiplayer).
   KI.step(X, T, tv, dist, dt, c) runs inside the hunt each step (a ground creature; the flyer uses KI.ahead in its own think) and,
   when it returns true, has set c.hWant / c.vWant. Modes in S.bm (host only, not on the wire):
     0 chase   the ordinary hunt (leading its prey);
     1 go      it heads for a block point on the route ahead of the player - the first route point it can reach a few seconds before
               the player (planned at its cruising speed; never closer than lead seconds of driving ahead of the player, never on a
               checkpoint), preferring a junction of the route; re-planned every re seconds (a new point only when it moved > 150 m);
     2 wait    at the block point it turns to face the player's approach and stands in the road (strikes as usual once in reach);
     3 cross   at the block point it walks back and forth across the road ahead while the player comes on.
   Fair by construction: the block point is announced (S.bx / S.by, event 'block' for the game's warning, markers and rumble) at
   least lead seconds of driving ahead; the creature is only one body in one street (side streets, U-turns, driving under it and
   between the legs - v31's solid parts - all get past); it gives up when the player passes or leaves the route, when it has waited
   too long, and then hunts normally for a few seconds before the next block. Near a block it may shoulder one tall tower beside
   the road over onto it (crushAt with mode 'dir': the destruction module topples slender towers in the push direction; event
   'topple'). Difficulty: per level DB (lead, margin, wait, replanning, chances) and the ramp (each checkpoint passed: less warning
   (never < 6 s), a faster cruise, longer waits, more toppled towers, quicker strikes). */
const KI = (() => {
  const {clamp, wrapA} = KC.m;
  const PI = Math.PI;
  const DB = [{lead:12, margin:5, wait:14, re:2.6, topP:0.5, crossP:0.3, vk:1.15},
              {lead:10, margin:4, wait:17, re:2.0, topP:0.65, crossP:0.35, vk:1.08},
              {lead:8.5, margin:3, wait:20, re:1.5, topP:0.8, crossP:0.4, vk:1.16}];
  const MODE = {CHASE:0, GO:1, WAIT:2, CROSS:3};
  const CP_KEEP = 200;   // (no block point this close to a checkpoint: the rings stay reachable)
  // the nearest point of the route to (x, y): {s, d, i (segment), ux, uy (the route's direction there)}
  const PJ = {s:0, d:0, i:0, ux:0, uy:1, x:0, y:0};
  function project(R, x, y, o){
    o = o || PJ; let bd = 1e18; o.s = 0; o.d = 1e9; o.i = 0;
    for (let i = 0; i < R.n - 1; i++){ const ax = R.x[i], ay = R.y[i], dx = R.x[i + 1] - ax, dy = R.y[i + 1] - ay, L2 = dx*dx + dy*dy;
      let t = L2 > 1e-6 ? ((x - ax)*dx + (y - ay)*dy)/L2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const px = ax + dx*t, py = ay + dy*t, d2 = (x - px)*(x - px) + (y - py)*(y - py);
      if (d2 < bd){ bd = d2; o.i = i; o.s = R.s[i] + Math.sqrt(L2)*t; o.x = px; o.y = py; const l = Math.sqrt(L2) || 1; o.ux = dx/l; o.uy = dy/l; } }
    o.d = Math.sqrt(bd); return o;
  }
  // the route point at arc length s (clamped to the ends): [x, y, i, ux, uy]
  const AT = [0, 0, 0, 0, 1];
  function pointAt(R, s, o){
    o = o || AT; const n = R.n; if (n < 2){ o[0] = n ? R.x[0] : 0; o[1] = n ? R.y[0] : 0; o[2] = 0; o[3] = 0; o[4] = 1; return o; }
    s = clamp(s, 0, R.s[n - 1]); let lo = 0, hi = n - 1; while (hi - lo > 1){ const m = (lo + hi) >> 1; if (R.s[m] <= s) lo = m; else hi = m; }
    const L = R.s[lo + 1] - R.s[lo] || 1e-6, f = (s - R.s[lo])/L, dx = R.x[lo + 1] - R.x[lo], dy = R.y[lo + 1] - R.y[lo], l = Math.hypot(dx, dy) || 1;
    o[0] = R.x[lo] + dx*f; o[1] = R.y[lo] + dy*f; o[2] = lo; o[3] = dx/l; o[4] = dy/l; return o;
  }
  // the point s metres ahead of the player on the route (the flyer circles there to swoop in from ahead)
  const ahead = (R, s) => pointAt(R, Math.min(s, R.s[R.n - 1]), [0, 0, 0, 0, 1]);
  const nearCp = (R, x, y, keep) => { for (const c of R.cps) if (Math.hypot(c.x - x, c.y - y) < keep) return true; return false; };
  // (and not within 260 m of the exit: the way out stays open at the end)
  const nearExit = (R, x, y) => { const e = R.cps[R.cps.length - 1]; return !!e && Math.hypot(e.x - x, e.y - y) < 260; };
  // the parameters for a difficulty and the ramp
  function par(di, ramp){ const B = DB[clamp(di | 0, 0, 2)], r = clamp(ramp || 0, 0, 1);
    return {lead:Math.max(6, B.lead - 2.5*r), margin:Math.max(1.5, B.margin - 1.5*r), wait:B.wait + 6*r, re:B.re*(1 - 0.35*r), topP:Math.min(0.92, B.topP + 0.25*r), crossP:B.crossP, vk:B.vk*(1 + 0.18*r), r}; }
  // the block point: the earliest route point the creature reaches margin seconds before the player (at least lead s of driving
  // ahead), moved to a junction of the route within 250 m after it when there is one it also reaches in time; else (none in time)
  // the point it misses by the least, when within 25 s (it races to get ahead); null when hopeless
  const PL = {x:0, y:0, s:0, slack:0, junc:false};
  function plan(R, Sx, Sy, vC, vp, Q){
    if (!R || R.n < 2) return null;
    // (the horizon: the way to the next checkpoint and on to the one after it - it cuts off the leg the player is driving now)
    const sAll = R.s[R.n - 1], sMin = Math.max(220, vp*Q.lead), sEnd = Math.min(sAll, Math.max(R.cps.length > 2 ? R.cps[2].s : sAll, sMin + 700)); if (sEnd < sMin + 40) return null;
    const step = Math.max(35, (sEnd - sMin)/260), P = [0, 0, 0, 0, 1];
    let first = -1, bestS = -1, bestSl = -1e9;
    for (let s = sMin; s <= sEnd - 20; s += step){
      pointAt(R, s, P); if (nearCp(R, P[0], P[1], CP_KEEP) || nearExit(R, P[0], P[1])) continue;
      const tp = s/vp, tc = Math.hypot(P[0] - Sx, P[1] - Sy)/vC + 3, sl = tp - tc - Q.margin;
      if (sl >= 0){ first = s; break; }
      if (sl > bestSl){ bestSl = sl; bestS = s; }
    }
    let s0 = first, junc = false;
    if (first >= 0 && R.junc){
      // a junction of the route within 250 m after it (reached in time too)
      for (let i = 1; i < R.n - 1; i++){ if (!R.junc[i] || R.s[i] < first || R.s[i] > Math.min(first + 250, sEnd)) continue; const x = R.x[i], y = R.y[i]; if (nearCp(R, x, y, CP_KEEP) || nearExit(R, x, y)) continue;
        const tp = R.s[i]/vp, tc = Math.hypot(x - Sx, y - Sy)/vC + 3; if (tp - tc - Q.margin >= 0){ s0 = R.s[i]; junc = true; break; } }
    }
    if (s0 < 0){ if (bestS < 0 || bestSl < -8) return null; s0 = bestS; }
    pointAt(R, s0, P); PL.x = P[0]; PL.y = P[1]; PL.s = s0; PL.junc = junc;
    PL.slack = s0 === first || junc ? Math.max(0, (s0/vp) - (Math.hypot(P[0] - Sx, P[1] - Sy)/vC + 3) - Q.margin) : bestSl; return PL;
  }
  function init(S){ S.bEff = 0.85; S.bLx = S.x; S.bLy = S.y; S.bm = 0; S.bx = 0; S.by = 0; S.bT = 0; S.bCool = 6; S.bRe = 0; S.bN = 0; S.bTop = null; S.bTopDone = false; S.bSide = 1; S.bInit = true; S.bTopN = 0; S.bPass = 0; S.bGive = 0; }
  const PB = {s:0, d:0, i:0, ux:0, uy:1, x:0, y:0};
  // X = {S, env, D, di, rng, out, crushAt, topR}: one hunt step; returns true when it set c.hWant / c.vWant
  function step(X, T, tv, dist, dt, c){
    const S = X.S, env = X.env; if (!S.bInit) init(S);
    const R = env.route ? env.route() : null;
    if (!R || !T || T.army || T.kind === 'air' || T.kind === 'cam' || S.phase !== 'hunt' || R.n < 2){ if (S.bm){ S.bm = 0; S.bCool = 3; } return false; }
    const Q = par(X.di, R.ramp), D = X.D;
    S.cool -= dt*0.35*Q.r;    // (quicker strikes as the ramp rises)
    // how fast it really gets on when it hurries (turns, gaits, wading, strikes): the plans use it, so they stay honest per creature
    const mv = Math.hypot(S.x - S.bLx, S.y - S.bLy)/Math.max(1e-3, dt); S.bLx = S.x; S.bLy = S.y;
    S.bCool -= dt; S.bRe -= dt; S.bT += dt;
    // (it hurries to cut the player off: its charging speed, more when it is far behind - a visible run, not a teleport)
    const vp = clamp(R.v || Math.hypot(tv ? tv.vx : 0, tv ? tv.vy : 0), 12, 38), vC = Math.max(D.vburst || 0, D.vfar || 18)*Q.vk*(1 + 0.25*clamp((dist - 1500)/1500, 0, 1));
    if (S.bm === MODE.GO && mv < 200) S.bEff = clamp(S.bEff + (clamp(mv/vC, 0.3, 1.1) - S.bEff)*Math.min(1, dt/8), 0.45, 1);
    // the current block point against the current route (the route starts at the player): passed, left, waited out
    if (S.bm){
      const pj = project(R, S.bx, S.by, PB), dPB = Math.hypot(T.x - S.bx, T.y - S.by);
      const passed = pj.s < 15 && dPB > 40, left = pj.d > (R.nav ? 160 : 220), long = (S.bm === MODE.WAIT || S.bm === MODE.CROSS) ? S.bT > Q.wait : S.bT > 50;
      if (passed || left || long){ if (passed) S.bPass++; else S.bGive++; S.bm = 0; S.bCool = (5 + 4*X.rng())*(1 - 0.4*Q.r); X.out.events.push({e:'unblock', why:passed ? 'passed' : left ? 'left' : 'time'}); }
    }
    // (re)plan
    if ((!S.bm && S.bCool <= 0) || (S.bm === MODE.GO && S.bRe <= 0)){
      S.bRe = Q.re; const P = plan(R, S.x, S.y, vC*S.bEff, vp, Q);
      // (without a navigation route the prediction is a straight line: the block point goes onto the nearest real road there)
      if (P && !R.nav && env.snap){ const q = env.snap(P.x, P.y, 120); if (q && !nearCp(R, q.x, q.y, CP_KEEP) && !nearExit(R, q.x, q.y)){ P.x = q.x; P.y = q.y; P.junc = true; } }
      if (P && (!S.bm || Math.hypot(P.x - S.bx, P.y - S.by) > 150)){
        const isNew = !S.bm; S.bx = P.x; S.by = P.y; S.bm = MODE.GO; S.bT = 0; S.bTop = null; S.bTopDone = false;
        if (isNew){ S.bN++; X.out.events.push({e:'block', x:Math.round(P.x), y:Math.round(P.y), s:Math.round(P.s), slack:+P.slack.toFixed(1), junc:P.junc}); }
      } else if (!P && !S.bm) S.bCool = 1.5;
    }
    if (!S.bm || dist < 220) return false;     // (close to its prey: the ordinary hunt - its strikes are tuned for that)
    const dB = Math.hypot(S.bx - S.x, S.by - S.y), pj = project(R, S.bx, S.by, PB);
    if (S.bm === MODE.GO){
      c.hWant = Math.atan2(S.bx - S.x, S.by - S.y); c.vWant = Math.max(c.vWant, vC*(dB > 300 ? 1 : 0.55 + 0.45*dB/300));
      if (dist > 320 && !S.k) S.cool = Math.max(S.cool, 0.4);   // (no strikes at nothing while it hurries)
      if (dB < 45){ S.bm = X.rng() < Q.crossP ? MODE.CROSS : MODE.WAIT; S.bT = 0; S.bSide = X.rng() < 0.5 ? 1 : -1; X.out.events.push({e:'blockAt', x:Math.round(S.bx), y:Math.round(S.by), mode:S.bm}); }
    } else if (S.bm === MODE.WAIT){
      // stand in the road facing the player's approach (keep station on the point)
      c.hWant = dB > 30 ? Math.atan2(S.bx - S.x, S.by - S.y) : Math.atan2(T.x - S.x, T.y - S.y); c.vWant = dB > 30 ? Math.min(6, dB*0.2) : 0;
    } else if (S.bm === MODE.CROSS){
      // back and forth across the road ahead once the player is within ~600 m of the block point
      const lat = (S.x - pj.x)*(-pj.uy) + (S.y - pj.y)*pj.ux;
      if (pj.s > 600 && dB > 30){ c.hWant = Math.atan2(S.bx - S.x, S.by - S.y); c.vWant = Math.min(6, dB*0.2); }
      else { if (lat*S.bSide > 70) S.bSide = -S.bSide; const hx = -pj.uy*S.bSide, hy = pj.ux*S.bSide; c.hWant = Math.atan2(hx, hy); c.vWant = (D.vb || 10)*1.1; }
    }
    // a tall tower beside the road near the block point, between the player and it: shouldered over onto the road
    if (!S.bTopDone && dB < 320 && X.crushAt && X.env.bldNear){
      if (!S.bTop){ S.bTopDone = X.rng() >= Q.topP; if (!S.bTopDone) S.bTop = pickTop(X, R, pj.s); if (!S.bTop) S.bTopDone = true; }
      const b = S.bTop;
      if (b && !S.bTopDone){
        if (env.destroyed && env.destroyed(b.ti, b.idx)){ S.bTopDone = true; }
        else if (Math.hypot(b.cx - S.x, b.cy - S.y) - b.r < (X.topR || 110) + 40){
          const q = project(R, b.cx, b.cy, {}), ux = (q.x - b.cx)/(q.d || 1), uy = (q.y - b.cy)/(q.d || 1);
          S.bTopDone = true; S.bTopN++;
          X.crushAt(b.cx, b.cy, b.z0 + 0.55*(b.z1 - b.z0), b.r + 3, b.z1 - b.z0, 1, ux, uy, 'dir');
          X.out.events.push({e:'topple', x:Math.round(b.cx), y:Math.round(b.cy), h:Math.round(b.z1 - b.z0), fx:+ux.toFixed(3), fy:+uy.toFixed(3)});
        }
      }
    }
    return true;
  }
  // the tower: >= 30 m tall, standing, its footprint 8-90 m from the route line, between 260 m before the block point and 40 m after
  function pickTop(X, R, sB){
    let best = null, bs = 1e18; const env = X.env, P = [0, 0, 0, 0, 1];
    for (let s = Math.max(0, sB - 200); s <= sB + 40; s += 60){
      pointAt(R, s, P);
      env.bldNear(P[0], P[1], 110, b => {
        const h = b.z1 - b.z0; if (h < 30 || (env.destroyed && env.destroyed(b.ti, b.idx))) return;
        const q = project(R, b.cx, b.cy, {}); const gap = q.d - b.r; if (gap < 8 || gap > 90 || q.s < sB - 220 || q.s > sB + 60) return;
        if (nearCp(R, b.cx, b.cy, CP_KEEP + b.r)) return;
        const sc = gap + Math.abs(q.s - (sB - 90))*0.4 - Math.min(h, 160)*0.5; if (sc < bs){ bs = sc; best = {ti:b.ti, idx:b.idx, cx:b.cx, cy:b.cy, r:b.r, z0:b.z0, z1:b.z1}; } });
    }
    return best;
  }
  return {DB, MODE, par, plan, step, init, project, pointAt, ahead, pickTop, CP_KEEP};
})();
//</CORE>

// ---- 20_model.js ----
/* ================= the creature's body: lofted skinned geometry (three LODs, one skeleton, one material) =================
   An original design from the 1928 text only: a vaguely anthropoid outline, an octopus-like head (a tall bulbous mantle leaning
   back), a face that is a mass of feelers (twelve in two rows, plus two long seizing tentacles), a scaly, rubbery body, prodigious
   claws on hind and fore feet, and long, narrow wings behind (two-fingered, membrane scalloped between the fingers).
   Everything is lofted along the skeleton (Catmull-Rom spines, parallel-transport frames, elliptical sections) and skinned to it
   (per-span bone blending near the joints; the wing membrane by distance to the wing bones). Per-vertex class (aK.x) and underside
   factor (aK.y) drive the procedural skin in one MeshPhong shader: overlapping scales with bump, a paler plated belly, a mottled
   warty mantle, suckers under the feelers, glossy black claws, veined membranes, glowing eyes with a slit pupil, a wet sheen (rim
   light + specular) that dries slowly after it leaves the sea. LOD 0 ~50 k triangles, LOD 1 ~14 k, LOD 2 ~4 k. */
const KM = (() => {
  const {BN, BI, FEEL, TENT, NFS, NTS, WING, EYES, HY} = KC, M = KC.m;
  const up = (P, h) => [P[0], P[1] + (h === undefined ? HY : h), P[2]];
  const C_BODY = 0, C_BELLY = 1, C_MANTLE = 2, C_TENT = 3, C_CLAW = 4, C_WING = 5, C_EYE = 6, C_DARK = 7;
  function Geo(){ this.P = []; this.N = []; this.U = []; this.SI = []; this.SW = []; this.K = []; this.I = []; this.n = 0; }
  Geo.prototype.v = function(p, n, u, v, si, sw, c, f){ this.P.push(p[0], p[1], p[2]); this.N.push(n[0], n[1], n[2]); this.U.push(u, v); this.SI.push(si[0], si[1] || 0, si[2] || 0, si[3] || 0); this.SW.push(sw[0], sw[1] || 0, sw[2] || 0, sw[3] || 0); this.K.push(c, f); return this.n++; };
  Geo.prototype.t = function(a, b, c){ this.I.push(a, b, c); };
  const cr = (p0, p1, p2, p3, t) => { const t2 = t*t, t3 = t2*t; return [0, 1, 2].map(i => 0.5*((2*p1[i]) + (-p0[i] + p2[i])*t + (2*p0[i] - 5*p1[i] + 4*p2[i] - p3[i])*t2 + (-p0[i] + 3*p1[i] - 3*p2[i] + p3[i])*t3)); };
  // a lofted tube along control points cps [{p, b (bone), rx, rz (half widths along the frame's side / up axes), c (class)?}]
  // o: {seg, sub, up (frame reference, model space), cap0, cap1 ('point' | 'flat' | null), c (class), under (dir for the underside factor),
  //     bump (radial noise amplitude, m), uS (u scale)}
  function loft(G, cps, o){
    const n = cps.length, seg = Math.max(3, o.seg | 0), sub = Math.max(1, o.sub | 0), S = [];
    for (let i = 0; i < n - 1; i++){
      const P0 = i ? cps[i - 1].p : M.vsub(M.vsc(cps[0].p, 2), cps[1].p), P1 = cps[i].p, P2 = cps[i + 1].p, P3 = i + 2 < n ? cps[i + 2].p : M.vsub(M.vsc(cps[n - 1].p, 2), cps[n - 2].p);
      for (let s = 0; s < sub; s++){ const f = s/sub; S.push({p:cr(P0, P1, P2, P3, f), i, f}); }
    }
    S.push({p:cps[n - 1].p.slice(), i:n - 1, f:0});
    // frames (parallel transport from o.up)
    let L = 0, prevT = null, N0 = null;
    for (let k = 0; k < S.length; k++){
      const a = S[Math.max(0, k - 1)].p, b = S[Math.min(S.length - 1, k + 1)].p, T = M.vnorm(M.vsub(b, a));
      if (k) L += M.vlen(M.vsub(S[k].p, S[k - 1].p));
      if (!prevT){ const up = o.up || [0, 0, 1]; N0 = M.vnorm(M.vsub(up, M.vsc(T, M.vdot(up, T)))); }
      else { const q = M.qUnit(prevT, T); N0 = M.vnorm(M.qrot(q, N0)); N0 = M.vnorm(M.vsub(N0, M.vsc(T, M.vdot(N0, T)))); }
      const Bv = M.vcross(T, N0);
      const cA = cps[S[k].i], cB = cps[Math.min(n - 1, S[k].i + 1)], f = S[k].f, e = f*f*(3 - 2*f);
      S[k].T = T; S[k].N = N0; S[k].B = Bv; S[k].L = L; S[k].rx = M.lerp(cA.rx, cB.rx, e); S[k].rz = M.lerp(cA.rz === undefined ? cA.rx : cA.rz, cB.rz === undefined ? cB.rx : cB.rz, e);
      S[k].ox = M.lerp(cA.ox || 0, cB.ox || 0, e); S[k].oz = M.lerp(cA.oz || 0, cB.oz || 0, e);
      // bone weights: span i belongs to cps[i].b, blended over 30 % either side of a joint
      const bi = cps[S[k].i].b, bp = S[k].i > 0 ? cps[S[k].i - 1].b : bi, bn = S[k].i < n - 1 ? cps[S[k].i + 1].b : bi;
      let si = [bi, 0], sw = [1, 0];
      if (f < 0.3 && bp !== bi){ const w = 0.5 + 0.5*f/0.3; si = [bi, bp]; sw = [w, 1 - w]; }
      else if (f > 0.7 && bn !== bi){ const w = 1 - 0.5*(f - 0.7)/0.3; si = [bi, bn]; sw = [w, 1 - w]; }
      S[k].si = si; S[k].sw = sw; prevT = T;
    }
    // rings
    const base = G.n, cls = o.c === undefined ? C_BODY : o.c, under = o.under, bump = o.bump || 0, rings = [];
    for (let k = 0; k < S.length; k++){
      const Q = S[k], r0 = []; rings.push(r0);
      const per = Math.PI*(3*(Q.rx + Q.rz) - Math.sqrt((3*Q.rx + Q.rz)*(Q.rx + 3*Q.rz)));
      const drs = k > 0 && k < S.length - 1 ? ((S[k + 1].rx + S[k + 1].rz) - (S[k - 1].rx + S[k - 1].rz))/2/Math.max(0.01, S[k + 1].L - S[k - 1].L) : 0;
      for (let j = 0; j <= seg; j++){
        const a = j/seg*Math.PI*2, ca = Math.cos(a), sa = Math.sin(a);
        const nz = Math.sin(Q.L*0.21 + a*3 + base*0.1)*Math.cos(Q.L*0.13 - a*5)*bump;
        const rx = Q.rx + nz, rz = Q.rz + nz;
        const p = M.vadd(M.vadd(M.vadd(Q.p, M.vsc(Q.B, ca*rx + Q.ox)), M.vsc(Q.N, sa*rz + Q.oz)), [0, 0, 0]);
        let nn = M.vnorm(M.vadd(M.vsc(Q.B, ca/Math.max(0.05, rx)), M.vsc(Q.N, sa/Math.max(0.05, rz))));
        nn = M.vnorm(M.vsub(nn, M.vsc(Q.T, drs*0.5)));
        const und = under ? Math.max(0, M.vdot(nn, under)) : 0;
        r0.push(G.v(p, nn, (j/seg)*per*(o.uS || 1), Q.L, Q.si, Q.sw, cps[Q.i].c !== undefined ? cps[Q.i].c : cls, und));
      }
    }
    for (let k = 0; k < S.length - 1; k++) for (let j = 0; j < seg; j++){ const a = rings[k][j], b = rings[k][j + 1], c = rings[k + 1][j + 1], d = rings[k + 1][j]; G.t(a, c, b); G.t(a, d, c); }
    const cap = (k, end) => { const Q = S[k], tipN = end ? Q.T : M.vsc(Q.T, -1), tip = M.vadd(Q.p, M.vsc(tipN, (o.capLen || 0)*Math.max(Q.rx, Q.rz)));
      const ci = G.v(tip, tipN, 0, Q.L + (end ? 1 : -1), Q.si, Q.sw, cls, 0);
      for (let j = 0; j < seg; j++){ if (end) G.t(rings[k][j], ci, rings[k][j + 1]); else G.t(ci, rings[k][j], rings[k][j + 1]); } };
    if (o.cap0) cap(0, false);
    if (o.cap1) cap(S.length - 1, true);
    return S;
  }
  // a sphere skinned to one bone
  function sphere(G, c, r, b, cls, nu, nv, sq){
    const rows = [];
    for (let i = 0; i <= nv; i++){ const th = i/nv*Math.PI, row = []; rows.push(row);
      for (let j = 0; j <= nu; j++){ const ph = j/nu*Math.PI*2, n = [Math.sin(th)*Math.cos(ph), Math.cos(th), Math.sin(th)*Math.sin(ph)];
        const p = [c[0] + n[0]*r*(sq ? sq[0] : 1), c[1] + n[1]*r*(sq ? sq[1] : 1), c[2] + n[2]*r*(sq ? sq[2] : 1)];
        row.push(G.v(p, n, ph*r, th*r, [b], [1], cls, n[2])); } }
    for (let i = 0; i < nv; i++) for (let j = 0; j < nu; j++){ const a = rows[i][j], b2 = rows[i][j + 1], c2 = rows[i + 1][j + 1], d = rows[i + 1][j]; G.t(a, b2, c2); G.t(a, c2, d); }
  }
  // a curved claw: a cone along a quadratic arc from root (radius r) to the point, all on one bone
  function claw(G, root, dir, len, r, curl, b, q){
    const d = M.vnorm(dir), side = M.vnorm(M.vcross(d, Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])), dn = M.vnorm(M.vcross(side, d));
    const cps = []; const n = 5;
    for (let i = 0; i <= n; i++){ const t = i/n, p = M.vadd(M.vadd(root, M.vsc(d, len*t)), M.vsc(dn, -curl*len*t*t)); cps.push({p, b, rx:r*(1 - t*0.92), rz:r*(1 - t*0.92)*0.85}); }
    loft(G, cps, {seg:Math.max(4, Math.round(8*q)), sub:Math.max(1, Math.round(2*q)), up:dn, c:C_CLAW, cap1:true, capLen:0.5});
  }
  const mir = (s, p) => [s*p[0], p[1], p[2]];
  function knob(G, root, dir, len, r, b, q){
    const d = M.vnorm(dir), cps = []; for (let i = 0; i <= 4; i++){ const t = i/4; cps.push({p:M.vadd(root, M.vsc(d, len*t - r*0.6)), b, rx:r*(1 - t*0.8), rz:r*0.7*(1 - t*0.8)}); }
    loft(G, cps, {seg:Math.max(5, Math.round(9*q)), sub:Math.max(1, Math.round(2*q)), up:[1, 0, 0], c:C_MANTLE, cap1:true, capLen:0.6});
  }
  function build(q){
    const G = new Geo(), R = n => Math.max(3, Math.round(n*q)), Sb = n => Math.max(1, Math.round(n*q));
    // ---- torso: crotch to neck (width rx, depth rz; belly forward, hunched back)
    const tor = [
      {p:[0, 112, 4], b:BI.root, rx:20, rz:18}, {p:[0, 128, 3], b:BI.root, rx:38, rz:33, oz:2}, {p:[0, 134 + HY, 6], b:BI.sp1, rx:41, rz:39, oz:4},
      {p:[0, 156 + HY, 10], b:BI.sp2, rx:43, rz:41, oz:3}, {p:[0, 180 + HY, 14], b:BI.chest, rx:49, rz:40}, {p:[0, 200 + HY, 16], b:BI.chest, rx:53, rz:36, oz:-3},
      {p:[0, 212 + HY, 22], b:BI.neck, rx:37, rz:30, oz:-2}, {p:[0, 224 + HY, 30], b:BI.head, rx:26, rz:26}];
    loft(G, tor, {seg:R(48), sub:Sb(8), up:[0, 0, 1], c:C_BODY, under:[0, 0, 1], cap0:true, capLen:0.2, bump:0.8});
    // ---- the head: a tall mantle leaning back over the shoulders, the face low in front
    const man = [{p:[0, 212, 44], b:BI.head, rx:20, rz:16}, {p:[0, 226, 44], b:BI.head, rx:27, rz:24}, {p:[0, 244, 36], b:BI.head, rx:32, rz:29},
      {p:[0, 266, 22], b:BI.head, rx:35, rz:33}, {p:[0, 286, 4], b:BI.head, rx:31, rz:30}, {p:[0, 300, -14], b:BI.head, rx:22, rz:22}, {p:[0, 306, -28], b:BI.head, rx:8, rz:8}].map(c => (c.p = up(c.p), c));
    loft(G, man, {seg:R(44), sub:Sb(8), up:[0, 0, 1], c:C_MANTLE, cap0:true, cap1:true, capLen:0.4, bump:1.4});
    // brow ridges over the eyes and the eyes
    for (const s of [1, -1]){
      loft(G, [{p:mir(s, up([3, 250, 60])), b:BI.head, rx:4, rz:3}, {p:mir(s, up([17, 252, 59])), b:BI.head, rx:6.5, rz:4.5}, {p:mir(s, up([31, 247, 51])), b:BI.head, rx:4, rz:3}], {seg:R(10), sub:Sb(5), up:[0, 1, 0], c:C_MANTLE, cap0:true, cap1:true});
      sphere(G, mir(s, EYES[0]), 7, BI.head, C_EYE, R(18), R(12), [1, 0.82, 0.75]);
    }
    // a dark maw between the feelers
    sphere(G, up([0, 218, 50]), 9, BI.head, C_DARK, R(12), R(8), [1.3, 0.8, 0.7]);
    // ---- the feelers
    FEEL.forEach(F => {
      const cps = []; for (let k = 0; k <= NFS; k++){ const t = k/NFS, r = F.r0*(1 - 0.88*Math.pow(t, 0.9)); cps.push({p:M.vadd(F.base, M.vsc(F.dir, F.len*t)), b:F.b[Math.min(NFS - 1, k)], rx:r, rz:r*0.9}); }
      loft(G, cps, {seg:R(12), sub:Sb(6), up:[0, 0, 1], c:C_TENT, under:[0, 0, -1], cap1:true, capLen:0.6});
    });
    // ---- the seizing tentacles (a club near the end)
    for (const T of TENT){
      const cps = []; for (let k = 0; k <= NTS; k++){ const t = k/NTS; let r = T.r0*(1 - 0.78*Math.pow(t, 0.8)); if (t > 0.72 && t < 0.97) r *= 1 + 0.9*Math.sin((t - 0.72)/0.25*Math.PI); if (t >= 0.97) r *= 0.5;
        cps.push({p:M.vadd(T.base, M.vsc(T.dir, T.len*t)), b:T.b[Math.min(NTS - 1, k)], rx:r, rz:r*0.85}); }
      loft(G, cps, {seg:R(14), sub:Sb(5), up:[0, 0, 1], c:C_TENT, under:[0, 0, -1], cap1:true, capLen:0.8});
    }
    for (const s of [1, -1]){
      const n = s > 0 ? 'L' : 'R';
      // ---- arm: shoulder mass, upper arm, forearm, a long hand
      loft(G, [{p:mir(s, up([14, 210, 16])), b:BI['clav' + n], rx:23, rz:23}, {p:mir(s, up([38, 210, 12])), b:BI['uarm' + n], rx:22, rz:21}, {p:mir(s, up([48, 182, 13])), b:BI['uarm' + n], rx:18, rz:17},
        {p:mir(s, up([56, 156, 16])), b:BI['farm' + n], rx:15, rz:14.5}, {p:mir(s, up([60, 130, 22])), b:BI['farm' + n], rx:13.5, rz:12}, {p:mir(s, up([62, 106, 28])), b:BI['hand' + n], rx:10.5, rz:9},
        {p:mir(s, up([64, 90, 35])), b:BI['claw' + n], rx:10, rz:5}], {seg:R(24), sub:Sb(7), up:[0, 0, 1], c:C_BODY, under:[0, 0, 1], cap1:true, capLen:0.5, bump:0.5});
      // four long fore claws and a thumb claw
      for (const f of [-1.5, -0.5, 0.5, 1.5]) claw(G, mir(s, up([64 + f*4.5, 88, 37])), [s*f*0.08, -0.75, 0.62], 30 - Math.abs(f)*3, 3.2, 0.35, BI['claw' + n], q);
      claw(G, mir(s, up([57, 97, 33])), [-s*0.5, -0.5, 0.65], 18, 2.8, 0.3, BI['hand' + n], q);
      // ---- leg: thigh, knee, shin, a heavy foot
      loft(G, [{p:mir(s, [24, 142, -2]), b:BI['thigh' + n], rx:24, rz:26}, {p:mir(s, [26, 130, -2]), b:BI['thigh' + n], rx:23, rz:25}, {p:mir(s, [29, 100, 8]), b:BI['thigh' + n], rx:19, rz:21},
        {p:mir(s, [30, 70, 14]), b:BI['shin' + n], rx:14, rz:16}, {p:mir(s, [30, 40, 4]), b:BI['shin' + n], rx:11, rz:12}, {p:mir(s, [30, 14, -5]), b:BI['foot' + n], rx:12, rz:11}], {seg:R(28), sub:Sb(7), up:[0, 0, 1], c:C_BODY, under:[0, 0, 1], cap0:true, capLen:0.3, bump:0.6});
      loft(G, [{p:mir(s, [30, 16, -12]), b:BI['foot' + n], rx:11, rz:9}, {p:mir(s, [30, 9, 2]), b:BI['foot' + n], rx:14, rz:8}, {p:mir(s, [30, 6, 14]), b:BI['toes' + n], rx:16, rz:6}, {p:mir(s, [30, 5, 24]), b:BI['toes' + n], rx:15, rz:4.5}],
        {seg:R(22), sub:Sb(6), up:[0, 1, 0], c:C_BODY, cap0:true, cap1:true, capLen:0.4});
      for (const f of [-1.5, -0.5, 0.5, 1.5]) claw(G, mir(s, [30 + f*7, 5, 26]), [s*f*0.12, -0.3, 1], 26 - Math.abs(f)*2.5, 3.6, 0.3, BI['toes' + n], q);
      claw(G, mir(s, [30, 8, -18]), [0, -0.35, -1], 14, 3, 0.25, BI['foot' + n], q);
      // ---- wing: spars (leading edge, second finger), the membrane between them, a hook at the wrist
      const W = k => mir(s, WING[k]);
      loft(G, [{p:W('root'), b:BI['wroot' + n], rx:6, rz:6}, {p:M.vlerp(W('root'), W('elbow'), 0.5), b:BI['wroot' + n], rx:5, rz:5}, {p:W('elbow'), b:BI['warm' + n], rx:4.5, rz:4.5}, {p:W('wrist'), b:BI['wf1' + n], rx:3.5, rz:3.5},
        {p:M.vlerp(W('wrist'), W('tip1'), 0.5), b:BI['wf1' + n], rx:2.4, rz:2.4}, {p:W('tip1'), b:BI['wf1' + n], rx:0.6, rz:0.6}], {seg:R(9), sub:Sb(6), up:[0, 0, -1], c:C_BODY, cap1:true, capLen:1});
      loft(G, [{p:W('wrist'), b:BI['wf2' + n], rx:3, rz:3}, {p:M.vlerp(W('wrist'), W('tip2'), 0.5), b:BI['wf2' + n], rx:2.2, rz:2.2}, {p:W('tip2'), b:BI['wf2' + n], rx:0.5, rz:0.5}], {seg:R(8), sub:Sb(6), up:[0, 0, -1], c:C_BODY, cap1:true, capLen:1});
      claw(G, W('wrist'), [s*0.2, 0.6, 0.7], 14, 2.2, 0.4, BI['wf1' + n], q);
      wingMembrane(G, s, n, q);
    }
    // ---- dorsal ridge: blunt horned plates down the hunched back
    const ridge = [[0, 206 + HY, -14, BI.chest, 1.0], [0, 192 + HY, -20, BI.chest, 1.1], [0, 176 + HY, -24, BI.sp2, 1.0], [0, 158 + HY, -28, BI.sp2, 0.9], [0, 140 + HY, -29, BI.sp1, 0.8], [0, 122 + HY, -28, BI.root, 0.6]];
    for (const r of ridge) knob(G, [r[0], r[1], r[2]], [0, 0.45, -0.9], 11*r[4], 6.5*r[4], r[3], q);
    return G;
  }
  // the membrane: a grid between the leading edge (root, elbow, wrist, finger tip) and the trailing edge (body, a scallop, the second
  // finger's tip, a scallop, the tip); two-sided (a second, reversed copy); weights by distance to the wing bones
  function wingMembrane(G, s, n, q){
    const W = k => mir(s, WING[k]), NA = Math.max(6, Math.round(30*q)), NBb = Math.max(3, Math.round(10*q));
    const lead = [W('root'), W('elbow'), W('wrist'), W('tip1')], trail = [W('body'), M.vadd(M.vlerp(W('body'), W('tip2'), 0.5), mir(s, [6, 18, -4])), W('tip2'), M.vadd(M.vlerp(W('tip2'), W('tip1'), 0.5), mir(s, [-12, 4, 2])), W('tip1')];
    const spl = (Pt, t) => { const n2 = Pt.length - 1, u = Math.min(n2 - 1e-6, t*n2), i = Math.floor(u), f = u - i, P0 = Pt[Math.max(0, i - 1)], P1 = Pt[i], P2 = Pt[i + 1], P3 = Pt[Math.min(n2, i + 2)]; return cr(P0, P1, P2, P3, f); };
    const segs = [[BI['wroot' + n], W('root'), W('elbow')], [BI['warm' + n], W('elbow'), W('wrist')], [BI['wf1' + n], W('wrist'), W('tip1')], [BI['wf2' + n], W('wrist'), W('tip2')], [BI.chest, W('body'), W('root')]];
    const dseg = (p, a, b) => { const ab = M.vsub(b, a), t = Math.max(0, Math.min(1, M.vdot(M.vsub(p, a), ab)/Math.max(1e-6, M.vdot(ab, ab)))); return M.vlen(M.vsub(p, M.vadd(a, M.vsc(ab, t)))); };
    const nrm = M.vnorm(mir(s, [0.35, -0.25, -0.9]));
    const grid = [];
    for (let i = 0; i <= NA; i++){ const a = i/NA, L = spl(lead, a), T = spl(trail, a), row = [];
      for (let j = 0; j <= NBb; j++){ const b = j/NBb, sag = Math.sin(Math.PI*b)*Math.sin(Math.PI*Math.min(1, a*1.1))*7;
        const p = M.vadd(M.vlerp(L, T, b), M.vsc(nrm, -sag));
        const ws = segs.map(([bi, A, B]) => [bi, 1/Math.pow(dseg(p, A, B) + 4, 2.2)]).sort((x, y) => y[1] - x[1]).slice(0, 3); const sum = ws.reduce((t, w) => t + w[1], 0);
        row.push({p, si:ws.map(w => w[0]), sw:ws.map(w => w[1]/sum), u:a*150, v:b*40}); }
      grid.push(row); }
    for (const side of [1, -1]){
      const idx = grid.map(row => row.map(V => G.v(V.p, M.vsc(nrm, side), V.u, V.v, V.si, V.sw, C_WING, side > 0 ? 0 : 1)));
      for (let i = 0; i < NA; i++) for (let j = 0; j < NBb; j++){ const a = idx[i][j], b = idx[i + 1][j], c = idx[i + 1][j + 1], d = idx[i][j + 1];
        if ((side > 0) === (s > 0)){ G.t(a, b, c); G.t(a, c, d); } else { G.t(a, c, b); G.t(a, d, c); } }
    }
  }
  function toGeometry(G){
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(G.P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(G.N, 3));
    g.setAttribute('aUv', new THREE.Float32BufferAttribute(G.U, 2));
    g.setAttribute('aK', new THREE.Float32BufferAttribute(G.K, 2));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(G.SI, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(G.SW, 4));
    g.setIndex(G.n > 65535 ? new THREE.Uint32BufferAttribute(G.I, 1) : new THREE.Uint16BufferAttribute(G.I, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 170, 40), 400);
    g.boundingBox = new THREE.Box3(new THREE.Vector3(-400, -250, -300), new THREE.Vector3(400, 520, 420));
    return g;
  }
  // ---- the skin shader
  const U = {uWet:{value:1}, uEye:{value:1}, uKT:{value:0}, uRim:{value:new THREE.Color(0.55, 0.65, 0.6)}, uDry:{value:0}};
  function material(){
    const m = new THREE.MeshPhongMaterial({color:0xffffff, specular:0x4e5a50, shininess:34, skinning:true});
    m.extensions = {derivatives:true};
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aUv;\nattribute vec2 aK;\nvarying vec2 vKu;\nvarying vec2 vKk;\nvarying vec3 vKr;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvKu = aUv; vKk = aK; vKr = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform float uWet;
uniform float uEye;
uniform float uKT;
uniform float uDry;
uniform vec3 uRim;
varying vec2 vKu;
varying vec2 vKk;
varying vec3 vKr;
float kjH(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float kjN(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float n = i.x + i.y * 57.0 + i.z * 113.0;
  vec4 a = fract(sin(vec4(n, n + 1.0, n + 57.0, n + 58.0)) * 43758.5453), b = fract(sin(vec4(n + 113.0, n + 114.0, n + 170.0, n + 171.0)) * 43758.5453);
  vec4 m = mix(a, b, f.z); vec2 m2 = mix(m.xy, m.zw, f.y); return mix(m2.x, m2.y, f.x); }
// organic scales: jittered cells (F1 / F2 distances); a dome inside each cell, dark grooves between them; x = height, y = cell id, z = edge
vec3 kjScales(vec2 uv, float sz){
  vec2 q = uv / sz, i0 = floor(q), f = fract(q); float d1 = 9.0, d2 = 9.0, id = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
    vec2 g = vec2(float(x), float(y)), o = vec2(kjH(i0 + g), kjH(i0 + g + 17.3)) * 0.8 + 0.1, r = g + o - f; float d = dot(r, r);
    if (d < d1){ d2 = d1; d1 = d; id = kjH(i0 + g + 5.1); } else if (d < d2) d2 = d;
  }
  float e = sqrt(d2) - sqrt(d1);
  return vec3(smoothstep(0.0, 0.3, e) * (0.75 + 0.25 * sqrt(max(0.0, 1.0 - d1))), id, smoothstep(0.0, 0.12, e));
}
vec3 kjPerturb(vec3 sp, vec3 sn, vec2 dh, float fd){
  vec3 sx = dFdx(sp), sy = dFdy(sp), r1 = cross(sy, sn), r2 = cross(sn, sx); float det = dot(sx, r1) * fd;
  return normalize(abs(det) * sn - sign(det) * (dh.x * r1 + dh.y * r2));
}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
float kC = floor(vKk.x + 0.5), kU = vKk.y, kH = 0.0, kSpec = 0.5, kBump = 1.0;
vec3 kCol = vec3(0.2);
vec3 kEm = vec3(0.0);
float kMott = kjN(vKr * 0.045) * 0.6 + kjN(vKr * 0.13) * 0.4;
float kFw = length(fwidth(vKu));      // pixel footprint (m): fine patterns fade out with distance
if (kC < 0.5){                      // body: scales (bigger plates on the back), mottled olive to slate
  float sz = mix(2.3, 3.6, smoothstep(0.2, 0.8, 1.0 - kU)); vec3 s = kjScales(vKu, sz); float fd = 1.0 - smoothstep(0.12, 0.5, kFw / sz);
  kH = s.x * fd;
  kCol = mix(vec3(0.12, 0.15, 0.115), vec3(0.24, 0.26, 0.18), kMott) * mix(1.0, 0.85 + 0.3 * s.y, fd);
  kCol *= mix(1.0, mix(0.5, 1.0, s.z), fd); kCol = mix(kCol, vec3(0.31, 0.3, 0.22), kU * 0.5);
  kSpec = 0.3 + 0.25 * s.z * fd;
} else if (kC < 1.5){               // belly
  float pl = fract(vKu.y / 5.0); kH = smoothstep(0.0, 0.25, pl) * (1.0 - smoothstep(0.8, 1.0, pl));
  kCol = mix(vec3(0.27, 0.26, 0.19), vec3(0.36, 0.34, 0.25), kMott) * (0.75 + 0.25 * kH); kSpec = 0.35;
} else if (kC < 2.5){               // mantle: mottled, warty
  float w = kjN(vKr * 0.42); kH = (smoothstep(0.55, 0.85, w) + 0.3 * kjN(vKr * 0.9)) * (1.0 - smoothstep(0.6, 2.0, kFw));
  float blot = smoothstep(0.45, 0.75, kjN(vKr * 0.06 + 7.0));
  kCol = mix(vec3(0.19, 0.22, 0.16), vec3(0.09, 0.12, 0.1), blot) * (0.85 + 0.3 * kMott); kCol = mix(kCol, vec3(0.28, 0.3, 0.22), 0.4 * kH);
  kSpec = 0.6;
} else if (kC < 3.5){               // feelers / tentacles: dark above, pale with suckers below
  vec2 sq = vec2(vKu.x / 2.2, vKu.y / 2.6); vec2 sc = fract(sq) - 0.5; float sd = length(sc);
  float suck = (1.0 - smoothstep(0.22, 0.3, sd)) * smoothstep(0.08, 0.16, sd) * smoothstep(0.35, 0.7, kU);
  suck *= 1.0 - smoothstep(0.5, 1.5, kFw); kH = suck + 0.25 * kjN(vKr * 0.5);
  kCol = mix(mix(vec3(0.1, 0.13, 0.11), vec3(0.16, 0.19, 0.14), kMott), vec3(0.42, 0.37, 0.3), smoothstep(0.2, 0.7, kU));
  kCol = mix(kCol, vec3(0.55, 0.47, 0.4), suck * 0.6); kSpec = 0.7;
} else if (kC < 4.5){               // claws
  kCol = vec3(0.05, 0.048, 0.045) + 0.04 * kjN(vKr * 0.8); kH = 0.2 * kjN(vec3(vKu * 0.7, 1.0)); kSpec = 1.4; kBump = 0.3;
} else if (kC < 5.5){               // wing membrane: veins
  float vn = abs(fract(vKu.x / 18.0 + 0.15 * sin(vKu.y * 0.12)) - 0.5); float vein = 1.0 - smoothstep(0.0, 0.05, vn);
  kH = vein * 0.6 + 0.2 * kjN(vec3(vKu * 0.3, 2.0));
  kCol = mix(vec3(0.09, 0.1, 0.08), vec3(0.16, 0.14, 0.11), kjN(vec3(vKu * 0.05, 4.0))) * (1.0 - 0.35 * vein); kSpec = 0.35;
} else if (kC < 6.5){               // eyes: a glowing iris, a slit pupil (vertical, facing forward)
  float ph = vKu.x / 6.5, th = vKu.y / 6.5;
  float slit = (1.0 - smoothstep(0.05, 0.14, abs(cos(ph)))) * step(0.0, sin(ph)) * smoothstep(0.25, 0.6, sin(th));
  float ctr = smoothstep(0.3, 0.95, sin(ph) * sin(th));
  kCol = vec3(0.6, 0.55, 0.12) * (1.0 - slit);
  kEm = vec3(1.0, 0.84, 0.22) * (0.3 + 0.7 * ctr) * (1.0 - 0.95 * slit) * uEye * (0.85 + 0.15 * sin(uKT * 1.7));
  kSpec = 2.0; kBump = 0.0;
} else {                            // the maw
  kCol = vec3(0.07, 0.02, 0.025); kSpec = 0.8; kH = kjN(vKr * 0.6);
}
diffuseColor.rgb = kCol;`)
      .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = kjPerturb(-vViewPosition, normal, vec2(dFdx(kH), dFdy(kH)) * 0.9 * kBump, faceDirection);')
      .replace('#include <specularmap_fragment>', 'float specularStrength = kSpec * mix(0.45, 1.0, uWet);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += kEm;')
      .replace('vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;',
        'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n' +
        'float kFr = pow(1.0 - clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0), 3.0);\noutgoingLight += uRim * kFr * (0.12 + 0.28 * uWet) * (kC > 5.5 && kC < 6.5 ? 0.0 : 1.0);');
    };
    return m;
  }
  let built = null;
  // build once: three LOD geometries, the skeleton (bones off the scene graph; matrices written from KC.pose), the meshes
  function get(){
    if (built) return built;
    const t0 = performance.now(), mat = material(), lods = [], tris = [];
    const bones = KC.BN.map(() => { const b = new THREE.Bone(); b.matrixAutoUpdate = false; return b; });
    const skel = new THREE.Skeleton(bones, KC.BN.map(() => new THREE.Matrix4()));
    let Mcur = null;
    skel.update = function(){ if (Mcur) this.boneMatrices.set(Mcur); if (this.boneTexture) this.boneTexture.needsUpdate = true; };
    const ident = new THREE.Matrix4(), root = new THREE.LOD(); root.name = 'kaiju';
    [[1, 0], [0.45, 1300], [0.2, 4200]].forEach(([q, d]) => {
      const G = build(q), geo = toGeometry(G), m = new THREE.SkinnedMesh(geo, mat);
      m.bindMode = 'detached'; m.bind(skel, ident); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = true; m.name = 'kaiju_lod' + lods.length;
      root.addLevel(m, d); lods.push(m); tris.push(G.I.length/3);
    });
    built = {root, lods, skel, bones, mat, tris, U, ms:performance.now() - t0, setPose(M){ Mcur = M; }};
    return built;
  }
  // v30: the loft helpers are shared with the other species' models (21_skin.js and after)
  return {get, build, U, C:{C_BODY, C_BELLY, C_MANTLE, C_TENT, C_CLAW, C_WING, C_EYE, C_DARK}, H:{Geo, loft, sphere, claw, knob, toGeometry, cr, mir}};
})();

// ---- 21_skin.js ----
/* ================= more creatures (v30): shared model pieces — the skin shader frame, extra loft primitives, skinned LOD sets =================
   Each new species is lofted along its own skeleton with KM's helpers (KM.H: loft, sphere, ...) and drawn as one SkinnedMesh per LOD
   (one material, one draw call + its shadow), skinned by the same detached-skeleton trick as KM (the pose's matrices are copied into
   the bone texture). Its surface is procedural in one MeshPhong shader: a per-vertex class (aK.x) and underside factor (aK.y) select
   the species' own pattern (a GLSL block with #define-free code per species: own program cache key); all share KM.U (wetness, eye
   glow, time), so the game's existing per-frame uniform writes drive every creature. */
const KSK = (() => {
  const H = KM.H, M = KC.m;
  // ---- extra primitives (geometry in model space, skinned to bones) ----
  // an eyeball: a squashed sphere around c whose class pattern is parametrised about its outward axis: aK.y = cos(angle off the axis),
  // aUv = the point's coordinates across the eye (side, up) in eye radii (the iris / pupil are drawn from these)
  function eyeball(G, c, r, axis, upv, b, cls, nu, nv, sq){
    const ax = M.vnorm(axis), side = M.vnorm(M.vcross(upv, ax)), up2 = M.vcross(ax, side), rows = [];
    for (let i = 0; i <= nv; i++){ const th = i/nv*Math.PI, row = []; rows.push(row);
      for (let j = 0; j <= nu; j++){ const ph = j/nu*Math.PI*2, l = [Math.sin(th)*Math.cos(ph), Math.cos(th), Math.sin(th)*Math.sin(ph)];
        // local (axis = l[1] pole) -> model: pole along ax
        const n = M.vnorm(M.vadd(M.vadd(M.vsc(ax, l[1]), M.vsc(side, l[0])), M.vsc(up2, l[2])));
        const p = M.vadd(c, M.vadd(M.vadd(M.vsc(ax, l[1]*r*(sq ? sq[0] : 1)), M.vsc(side, l[0]*r*(sq ? sq[1] : 1))), M.vsc(up2, l[2]*r*(sq ? sq[2] : 1))));
        row.push(G.v(p, n, M.vdot(n, side), M.vdot(n, up2), [b], [1], cls, M.vdot(n, ax))); } }
    for (let i = 0; i < nv; i++) for (let j = 0; j < nu; j++){ const a = rows[i][j], b2 = rows[i][j + 1], c2 = rows[i + 1][j + 1], d = rows[i + 1][j]; G.t(a, c2, b2); G.t(a, d, c2); }
  }
  // a tapering horn / claw / tooth: a cone along a quadratic arc (curl bends it towards -bendDir), on one bone, of a given class
  function cone(G, root, dir, len, r, curl, b, cls, q, bend, tip){
    const d = M.vnorm(dir), side = M.vnorm(M.vcross(d, Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])), dn = bend ? M.vnorm(bend) : M.vnorm(M.vcross(side, d));
    const cps = [], n = 5;
    for (let i = 0; i <= n; i++){ const t = i/n, p = M.vadd(M.vadd(root, M.vsc(d, len*t)), M.vsc(dn, -curl*len*t*t)); cps.push({p, b, rx:r*(1 - t*(tip === undefined ? 0.92 : tip)), rz:r*(1 - t*(tip === undefined ? 0.92 : tip))*0.85}); }
    H.loft(G, cps, {seg:Math.max(4, Math.round(8*q)), sub:Math.max(1, Math.round(2*q)), up:dn, c:cls, cap1:true, capLen:0.5});
  }
  // a two-sided sheet over a grid: fn(i, j) -> {p, si:[bones], sw:[weights], u, v}; normals from the grid; aK.y = 0 front / 1 back
  function sheet(G, NI, NJ, fn, cls){
    const P = [];
    for (let i = 0; i <= NI; i++){ const row = []; for (let j = 0; j <= NJ; j++) row.push(fn(i, j)); P.push(row); }
    const N = [];
    for (let i = 0; i <= NI; i++){ const row = []; for (let j = 0; j <= NJ; j++){
      const a = P[Math.min(NI, i + 1)][j].p, b = P[Math.max(0, i - 1)][j].p, c = P[i][Math.min(NJ, j + 1)].p, d = P[i][Math.max(0, j - 1)].p;
      row.push(M.vnorm(M.vcross(M.vsub(a, b), M.vsub(c, d)))); } N.push(row); }
    for (const side of [1, -1]){
      const idx = P.map((row, i) => row.map((V, j) => G.v(V.p, M.vsc(N[i][j], side), V.u, V.v, V.si, V.sw, cls, side > 0 ? 0 : 1)));
      for (let i = 0; i < NI; i++) for (let j = 0; j < NJ; j++){ const a = idx[i][j], b = idx[i + 1][j], c = idx[i + 1][j + 1], d = idx[i][j + 1];
        if (side > 0){ G.t(a, b, c); G.t(a, c, d); } else { G.t(a, c, b); G.t(a, d, c); } }
    }
  }
  // ---- the skin shader frame: the species block sets kCol, kH (bump height), kSpec, kBump, kEm (emission), kIri (rim tint), kRimK ----
  const COMMON = `
uniform float uWet;
uniform float uEye;
uniform float uKT;
uniform float uDry;
uniform vec3 uRim;
varying vec2 vKu;
varying vec2 vKk;
varying vec3 vKr;
float ksH(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float ksN(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float n = i.x + i.y * 57.0 + i.z * 113.0;
  vec4 a = fract(sin(vec4(n, n + 1.0, n + 57.0, n + 58.0)) * 43758.5453), b = fract(sin(vec4(n + 113.0, n + 114.0, n + 170.0, n + 171.0)) * 43758.5453);
  vec4 m = mix(a, b, f.z); vec2 m2 = mix(m.xy, m.zw, f.y); return mix(m2.x, m2.y, f.x); }
// cells on a 2-d parametrisation: x = dome height inside a cell, y = cell id, z = edge (0 in the groove), w = distance to the centre
vec4 ksCell(vec2 uv, float sz){
  vec2 q = uv / sz, i0 = floor(q), f = fract(q); float d1 = 9.0, d2 = 9.0, id = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
    vec2 g = vec2(float(x), float(y)), o = vec2(ksH(i0 + g), ksH(i0 + g + 17.3)) * 0.8 + 0.1, r = g + o - f; float d = dot(r, r);
    if (d < d1){ d2 = d1; d1 = d; id = ksH(i0 + g + 5.1); } else if (d < d2) d2 = d;
  }
  float e = sqrt(d2) - sqrt(d1);
  return vec4(smoothstep(0.0, 0.3, e) * (0.75 + 0.25 * sqrt(max(0.0, 1.0 - d1))), id, smoothstep(0.0, 0.12, e), sqrt(d1));
}
vec3 ksPerturb(vec3 sp, vec3 sn, vec2 dh, float fd){
  vec3 sx = dFdx(sp), sy = dFdy(sp), r1 = cross(sy, sn), r2 = cross(sn, sx); float det = dot(sx, r1) * fd;
  return normalize(abs(det) * sn - sign(det) * (dh.x * r1 + dh.y * r2));
}`;
  function material(key, body, o){
    o = o || {};
    const m = new THREE.MeshPhongMaterial({color:0xffffff, specular:o.spec === undefined ? 0x4e5a50 : o.spec, shininess:o.shin || 34, skinning:true, side:o.side || THREE.FrontSide});
    m.extensions = {derivatives:true};
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, KM.U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aUv;\nattribute vec2 aK;\nvarying vec2 vKu;\nvarying vec2 vKk;\nvarying vec3 vKr;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvKu = aUv; vKk = aK; vKr = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + COMMON)
        .replace('#include <color_fragment>', '#include <color_fragment>\nfloat kC = floor(vKk.x + 0.5), kU = vKk.y, kH = 0.0, kSpec = 0.5, kBump = 1.0, kRimK = 1.0;\nvec3 kCol = vec3(0.2), kEm = vec3(0.0), kIri = vec3(0.0);\nfloat kFw = length(fwidth(vKu));\n' + body + '\ndiffuseColor.rgb = kCol;')
        .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = ksPerturb(-vViewPosition, normal, vec2(dFdx(kH), dFdy(kH)) * 0.9 * kBump, faceDirection);')
        .replace('#include <specularmap_fragment>', 'float specularStrength = kSpec * mix(0.45, 1.0, uWet);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += kEm;')
        .replace('vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;',
          'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n' +
          'float kFr = pow(1.0 - clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0), 3.0);\noutgoingLight += (uRim * (0.12 + 0.28 * uWet) + kIri) * kFr * kRimK;');
    };
    m.customProgramCacheKey = () => 'kjsp_' + key;
    return m;
  }
  // ---- a skinned LOD set: build(q) -> Geo at detail q (1, 0.45, 0.2); bounds {c:[x, y, z], r, box:[[min], [max]]} in model space ----
  function skinned(key, BN, build, mat, bounds, dists){
    const t0 = performance.now(), lods = [], tris = [];
    const bones = BN.map(() => { const b = new THREE.Bone(); b.matrixAutoUpdate = false; return b; });
    const skel = new THREE.Skeleton(bones, BN.map(() => new THREE.Matrix4()));
    let Mcur = null;
    skel.update = function(){ if (Mcur) this.boneMatrices.set(Mcur); if (this.boneTexture) this.boneTexture.needsUpdate = true; };
    const ident = new THREE.Matrix4(), root = new THREE.LOD(); root.name = 'kaiju_' + key;
    (dists || [[1, 0], [0.45, 1300], [0.2, 4200]]).forEach(([q, d]) => {
      const G = build(q), geo = H.toGeometry(G);
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(bounds.c[0], bounds.c[1], bounds.c[2]), bounds.r);
      geo.boundingBox = new THREE.Box3(new THREE.Vector3(...bounds.box[0]), new THREE.Vector3(...bounds.box[1]));
      const m = new THREE.SkinnedMesh(geo, mat);
      m.bindMode = 'detached'; m.bind(skel, ident); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = true; m.name = 'kaiju_' + key + '_lod' + lods.length;
      root.addLevel(m, d); lods.push(m); tris.push(G.I.length/3);
    });
    return {root, lods, skel, bones, mat, tris, U:KM.U, ms:performance.now() - t0, setPose(M){ Mcur = M; }};
  }
  const MODELS = {};    // species id -> {get(), build(q), ...} (filled by the species model files)
  return {eyeball, cone, sheet, material, skinned, COMMON, MODELS};
})();

// ---- 22_mkraken.js ----
/* ================= the kraken's body: lofted, skinned (three LODs, one material) =================
   Mantle lofted on the mantle spine (warty, wine red, marbled, with chromatophore speckle and rows of photophores that glow at
   night), a heavy head with two horned brows and gold eyes (a bar pupil, glowing), eight tapering arms (two staggered rows of
   suckers under each), a web between the arm roots, two long tentacles with hooked clubs, a frilled skirt-fin down each side of
   the mantle (shimmering edge), a dark beak in the crown. Classes: 0 skin, 1 arm (suckers below), 2 web, 3 eye, 4 beak, 5 tentacle,
   6 fin. LOD 0 ~35 k triangles. */
KSK.MODELS.kraken = (() => {
  const D = KK, {BN, BI, ARMS, TENT, MANTLE, MB, EYES, NA, NT} = D, H = KM.H, M = KC.m;
  const C_SKIN = 0, C_ARM = 1, C_WEB = 2, C_EYE = 3, C_BEAK = 4, C_TENT = 5, C_FIN = 6;
  function build(q){
    const G = new H.Geo(), R = n => Math.max(3, Math.round(n*q)), Sb = n => Math.max(1, Math.round(n*q));
    // ---- mantle
    const man = MANTLE.map((m, i) => ({p:[m[0], m[1], m[2]], b:BI[MB[i]], rx:m[3], rz:m[4]}));
    H.loft(G, man, {seg:R(44), sub:Sb(8), up:[0, 1, 0], c:C_SKIN, under:[0, -0.8, 0.6], cap0:true, cap1:true, capLen:0.35, bump:1.6});
    // ---- head (between the crown and the mantle), brows, horns, eyes
    H.sphere(G, [0, 59, 2], 34, BI.head, C_SKIN, R(36), R(22), [1, 0.76, 1.0]);
    for (const s of [1, -1]){
      const E = [s*EYES[0][0], EYES[0][1], EYES[0][2]];
      H.loft(G, [{p:[s*12, 79, 14], b:BI.head, rx:4, rz:3}, {p:[s*24, 80, 6], b:BI.head, rx:7, rz:5}, {p:[s*33, 74, -4], b:BI.head, rx:4, rz:3}], {seg:R(10), sub:Sb(5), up:[0, 1, 0], c:C_SKIN, cap0:true, cap1:true, bump:0.6});
      KSK.cone(G, [s*24, 82, 4], [s*0.35, 1, -0.25], 26, 4.2, 0.35, BI.head, C_SKIN, q, [s*0.2, 0.2, 1]);
      KSK.eyeball(G, E, 10.5, [s*0.92, 0.05, 0.4], [0, 1, 0], BI.head, C_EYE, R(24), R(16), [0.55, 1, 1]);
    }
    // ---- the beak (a dark hooked pair in the crown)
    KSK.cone(G, [0, 40, 10], [0, -0.6, 0.8], 14, 5, 0.6, BI.beak, C_BEAK, q, [0, 1, 0.3]);
    KSK.cone(G, [0, 38, 4], [0, -0.9, 0.3], 11, 4.4, 0.4, BI.root, C_BEAK, q, [0, 0.3, -1]);
    // ---- arms (thick roots overlapping into the crown, tapering to a fine tip)
    for (const A of ARMS){
      const cps = [];
      for (let k = 0; k <= NA; k++){ const t = k/NA, r = A.r0*(1 - 0.9*Math.pow(t, 1.05)) + 0.7; cps.push({p:M.vadd(A.base, M.vsc(A.dir, A.len*t - (k ? 0 : 6))), b:A.b[Math.min(NA - 1, k)], rx:r, rz:r*0.82}); }
      H.loft(G, cps, {seg:R(18), sub:Sb(6), up:[0, 1, 0], c:C_ARM, under:[0, -1, 0], cap1:true, capLen:0.8, bump:0.35});
    }
    // ---- tentacles: thin stalks, a broad hooked club near the end
    for (const T of TENT){
      const cps = [];
      for (let k = 0; k <= NT; k++){ const t = k/NT; let r = T.r0*(1 - 0.55*Math.pow(t, 0.7)); if (t > 0.74 && t < 0.98) r *= 1 + 1.1*Math.sin((t - 0.74)/0.24*Math.PI); if (t >= 0.98) r *= 0.4;
        cps.push({p:M.vadd(T.base, M.vsc(T.dir, T.len*t)), b:T.b[Math.min(NT - 1, k)], rx:r, rz:r*0.75}); }
      H.loft(G, cps, {seg:R(14), sub:Sb(5), up:[0, 1, 0], c:C_TENT, under:[0, -1, 0], cap1:true, capLen:0.8});
    }
    // ---- the web between neighbouring arm roots (sags towards the crown)
    const ring = ARMS.slice().sort((a, b) => a.a - b.a);
    for (let n = 0; n < ring.length; n++){
      const A = ring[n], B = ring[(n + 1) % ring.length], deep = (Math.abs(A.a) > 2.4 && Math.abs(B.a) > 2.4) ? 2 : 3, NI = Math.max(2, Math.round(6*q)), NJ = Math.max(2, Math.round(8*q));
      KSK.sheet(G, NI, NJ, (i, j) => {
        const u = j/NJ, rr = i/NI*deep, k0 = Math.floor(rr), f = rr - k0, k1 = Math.min(NA - 1, k0 + 1);
        const pa = M.vlerp(BN[A.b[k0]].rest, BN[A.b[k1]].rest, f), pb = M.vlerp(BN[B.b[k0]].rest, BN[B.b[k1]].rest, f);
        const mid = M.vlerp(pa, pb, u), sag = Math.sin(Math.PI*u)*(rr/deep)*14, cdir = M.vnorm([-mid[0], 0, -mid[2]]);
        const p = M.vadd(M.vadd(mid, M.vsc(cdir, sag)), [0, sag*0.4 + (i ? 0 : 4), 0]);
        return {p, si:[A.b[k0], B.b[k0], A.b[k1], B.b[k1]], sw:[(1 - u)*(1 - f), u*(1 - f), (1 - u)*f, u*f], u:u*40, v:rr*20};
      }, C_WEB);
    }
    // ---- the skirt fins: a frilled strip down each side of the mantle (inner edge on the mantle, outer edge on the fin bones)
    for (const s of [1, -1]){
      const NI = Math.max(6, Math.round(26*q)), NJ = Math.max(1, Math.round(3*q)), fb = s > 0 ? D.FIN.slice(0, 3) : D.FIN.slice(3, 6);
      KSK.sheet(G, NI, NJ, (i, j) => {
        const u = 1 - i/NI, mp = 1.6 + u*3.3, k0 = Math.min(MANTLE.length - 2, Math.floor(mp)), f = mp - k0, A = MANTLE[k0], B = MANTLE[k0 + 1];
        const c = M.vlerp(A, B, f), rS = M.lerp(A[3], B[3], f), wv = (6 + 16*Math.sin(Math.PI*Math.min(1, u*1.05)))*(1 + 0.12*Math.sin(i*1.9)), o = j/NJ;
        const p = [s*(rS*0.96 + wv*o), c[1] - 2 - o*3, c[2] - o*2], fi = Math.min(2, Math.max(0, Math.round((mp - 2)*0.8)));
        return {p, si:o > 0 ? [BI[MB[k0]], fb[fi]] : [BI[MB[k0]]], sw:o > 0 ? [1 - o, o] : [1], u:i*4, v:o*20};
      }, C_FIN);
    }
    return G;
  }
  const BODY = `
float kMott = ksN(vKr * 0.04) * 0.6 + ksN(vKr * 0.11) * 0.4;
if (kC < 0.5 || (kC > 0.5 && kC < 1.5 && kU < 0.42) || (kC > 4.5 && kC < 5.5 && kU < 0.42)){
  // skin: wine-red, marbled; chromatophore speckle; warty papillae; photophores in rows (they glow at night)
  vec4 c = ksCell(vKu, 1.7); float fd = 1.0 - smoothstep(0.08, 0.35, kFw / 1.7);
  float marb = smoothstep(0.45, 0.66, ksN(vKr * 0.045 + vec3(3.0)) + 0.3 * ksN(vKr * 0.16));
  kCol = mix(vec3(0.34, 0.085, 0.075), vec3(0.13, 0.03, 0.045), marb) * (0.85 + 0.3 * kMott);
  float dot1 = (1.0 - smoothstep(0.18, 0.34, c.w)) * fd;
  kCol = mix(kCol, mix(vec3(0.14, 0.04, 0.03), vec3(0.62, 0.3, 0.1), step(0.62, c.y)), dot1 * 0.55);
  kCol = mix(kCol, vec3(0.5, 0.26, 0.2), smoothstep(0.3, 0.9, kU) * 0.45);
  float wart = smoothstep(0.58, 0.82, ksN(vKr * 0.33)) * (1.0 - smoothstep(0.6, 2.0, kFw));
  kH = wart * 1.1 + dot1 * 0.25 + 0.2 * ksN(vKr * 0.9);
  kCol *= 1.0 - 0.18 * wart;
  if (kC < 0.5){ vec4 ph = ksCell(vKu * vec2(1.0, 0.6), 7.0); float pd = (1.0 - smoothstep(0.08, 0.16, ph.w)) * step(0.8, ph.y);
    pd *= 1.0 - smoothstep(0.6, 2.5, kFw); kEm = vec3(0.35, 0.85, 1.0) * pd * max(0.0, uEye - 0.7) * 0.55; kCol = mix(kCol, vec3(0.6, 0.7, 0.75), pd * 0.25); }
  kSpec = 0.55;
} else if (kC < 1.5 || (kC > 4.5 && kC < 5.5)){
  // the oral side: pale, two staggered rows of suckers (hooked rings on the tentacle clubs)
  vec2 sq = vec2(vKu.x / 4.2, vKu.y / 4.6); sq.x += 0.5 * mod(floor(sq.y), 2.0); vec2 sc = fract(sq) - 0.5; float sd = length(sc);
  float rim = smoothstep(0.17, 0.23, sd) * (1.0 - smoothstep(0.33, 0.4, sd)), cup = 1.0 - smoothstep(0.0, 0.17, sd), fd = 1.0 - smoothstep(0.4, 1.4, kFw);
  float band = smoothstep(0.42, 0.62, kU);
  kCol = mix(vec3(0.52, 0.36, 0.32), vec3(0.66, 0.52, 0.45), kMott);
  kCol = mix(kCol, vec3(0.8, 0.68, 0.6), rim * band * fd); kCol = mix(kCol, vec3(0.2, 0.07, 0.07), cup * band * fd);
  if (kC > 4.5){ float hook = (1.0 - smoothstep(0.03, 0.07, abs(sc.x + 0.1 * sc.y))) * step(sd, 0.32) * band; kCol = mix(kCol, vec3(0.06, 0.05, 0.04), hook * fd); }
  kCol = mix(vec3(0.3, 0.08, 0.07) * (0.85 + 0.3 * kMott), kCol, band);
  kH = (rim - cup * 0.6) * band * fd + 0.15 * ksN(vKr * 0.7); kSpec = 0.8;
} else if (kC < 2.5){
  // web: a thinner, darker membrane with veins
  float vn = abs(fract(vKu.x / 9.0 + 0.2 * sin(vKu.y * 0.15)) - 0.5); float vein = 1.0 - smoothstep(0.0, 0.06, vn);
  kCol = mix(vec3(0.24, 0.05, 0.06), vec3(0.15, 0.03, 0.05), ksN(vec3(vKu * 0.08, 1.0))) * (1.0 - 0.3 * vein); kH = vein * 0.5; kSpec = 0.6;
} else if (kC < 3.5){
  // eye: a gold iris with fine rays and a dark bar pupil; it burns at night
  float f = kU, r = length(vKu), ir = smoothstep(0.55, 0.7, f);
  float bar = (1.0 - smoothstep(0.1, 0.16, abs(vKu.y))) * (1.0 - smoothstep(0.42, 0.5, abs(vKu.x))) * step(0.5, f);
  float rays = 0.75 + 0.25 * sin(atan(vKu.y, vKu.x) * 28.0);
  kCol = mix(vec3(0.16, 0.05, 0.04), vec3(0.75, 0.52, 0.12) * rays, ir) * (1.0 - bar);
  kEm = vec3(1.0, 0.72, 0.2) * ir * (1.0 - 0.95 * bar) * rays * uEye * (0.35 + 0.65 * smoothstep(0.65, 0.95, f)) * (0.88 + 0.12 * sin(uKT * 1.3));
  kSpec = 2.2; kBump = 0.0; kRimK = 0.0;
} else if (kC < 4.5){
  kCol = vec3(0.035, 0.03, 0.03) + 0.03 * ksN(vKr * 0.8); kSpec = 1.6; kBump = 0.3; kH = ksN(vKr * 1.4);
} else {
  // the skirt fins: dark red with radial stripes, an iridescent shimmer along the edge
  float st = 0.5 + 0.5 * sin(vKu.x * 0.9); float edge = smoothstep(9.0, 19.0, vKu.y);
  kCol = mix(vec3(0.3, 0.06, 0.07), vec3(0.18, 0.03, 0.05), st) * (0.8 + 0.3 * kMott);
  kIri = vec3(0.1, 0.45, 0.55) * edge * (0.6 + 0.4 * sin(vKu.x * 0.4 + uKT * 2.0)); kH = st * 0.3; kSpec = 0.9;
}`;
  let built = null;
  function get(){
    if (built) return built;
    const mat = KSK.material('kraken', BODY, {spec:0x5a4848, shin:40});
    built = KSK.skinned('kraken', BN, build, mat, {c:[0, 60, 40], r:420, box:[[-380, -200, -330], [380, 420, 420]]});
    return built;
  }
  return {get, build, BODY};
})();

// ---- 23_mcrab.js ----
/* ================= the crab's body: a parametric carapace + lofted legs and claws (three LODs, one material) =================
   The carapace is a lens-shaped shell over an outline with a serrated front margin (five teeth a side, a notch between the eyes)
   and a long lateral spine at each side; its dome carries the branchial swellings. Legs: coxa, a flattened spiny merus, a knee
   knob, the propodus and a black dactyl; claws: merus, a knobby carpus, a deep palm, a fixed finger and a movable one (the right
   claw 1.3x the left). Eyes on stalks, mouthparts, the folded abdomen below. Classes: 0 shell, 1 underside, 2 leg, 3 black tips,
   4 eye, 5 joint membrane, 6 mouthparts. LOD 0 ~30 k triangles. */
KSK.MODELS.crab = (() => {
  const D = KCR, {BN, BI, LEGS, CLAWS, EYE_TIP} = D, H = KM.H, M = KC.m;
  const C_SHELL = 0, C_UNDER = 1, C_LEG = 2, C_TIP = 3, C_EYE = 4, C_JOINT = 5, C_MOUTH = 6;
  // the carapace outline (top view): radius at angle f (0 = forward, + = left)
  function outline(f){
    const af = Math.abs(f), base = 1/Math.sqrt(Math.pow(Math.sin(f)/80, 2) + Math.pow(Math.cos(f)/(f > -Math.PI/2 && f < Math.PI/2 ? 56 : 48), 2));
    const spine = 24*Math.exp(-Math.pow((af - 1.33)/0.07, 2));
    const teeth = af > 0.3 && af < 1.28 ? 5.5*Math.pow(Math.max(0, Math.sin((af - 0.3)/0.98*5*Math.PI)), 3) : 0;
    const notch = -5*Math.exp(-Math.pow(f/0.1, 2)) + 3*Math.exp(-Math.pow((af - 0.2)/0.06, 2));
    return base + spine + teeth + notch;
  }
  function carapace(G, q){
    const NF = Math.max(24, Math.round(128*q)), NT = Math.max(8, Math.round(36*q)), b = BI.cara, P = [];
    const at = (f, th) => { const r = outline(f), s = Math.pow(Math.sin(th), 0.55), c = Math.cos(th);
      const x = Math.sin(f)*r*s, z = Math.cos(f)*r*s + 4;
      let y = c >= 0 ? 65 + 18*Math.pow(c, 1.1) : 65 - 10*Math.pow(-c, 0.9);
      if (c > 0){ // branchial swellings and the gastric hump
        y += 5*Math.exp(-(Math.pow(Math.abs(x) - 36, 2) + Math.pow(z + 6, 2))/520)*c + 4*Math.exp(-(x*x + Math.pow(z - 16, 2))/320)*c - 2.5*Math.exp(-Math.pow(Math.abs(x) - 18, 2)/30)*c*Math.exp(-Math.pow(z - 2, 2)/400); }
      return [x, y, z]; };
    for (let i = 0; i <= NT; i++){ const row = []; for (let j = 0; j <= NF; j++){ const f = -Math.PI + j/NF*2*Math.PI, th = i/NT*Math.PI; row.push(at(f, th)); } P.push(row); }
    const idx = [];
    for (let i = 0; i <= NT; i++){ const row = [];
      for (let j = 0; j <= NF; j++){ const p = P[i][j], a = P[Math.min(NT, i + 1)][j], bq = P[Math.max(0, i - 1)][j], c = P[i][(j + 1) % (NF + 1) || 1], d = P[i][j ? j - 1 : NF - 1];
        let n = M.vcross(M.vsub(a, bq), M.vsub(c, d)); const l = M.vlen(n); n = l > 1e-6 ? M.vsc(n, 1/l) : (i < NT/2 ? [0, 1, 0] : [0, -1, 0]);
        if (i === 0) n = [0, 1, 0]; if (i === NT) n = [0, -1, 0];
        const th = i/NT*Math.PI, top = Math.cos(th);
        row.push(G.v(p, n, p[0], p[2], [b], [1], top > -0.05 ? C_SHELL : C_UNDER, top > -0.05 ? Math.max(0, -top) : 1)); }
      idx.push(row); }
    for (let i = 0; i < NT; i++) for (let j = 0; j < NF; j++){ const a = idx[i][j], b2 = idx[i][j + 1], c = idx[i + 1][j + 1], d = idx[i + 1][j]; G.t(a, c, b2); G.t(a, d, c); }
  }
  function build(q){
    const G = new H.Geo(), R = n => Math.max(3, Math.round(n*q)), Sb = n => Math.max(1, Math.round(n*q));
    carapace(G, q);
    // the abdomen folded under; mouthparts; eyes on stalks
    H.sphere(G, [0, 47, -8], 30, BI.ab, C_UNDER, R(20), R(10), [1, 0.22, 1.25]);
    for (const s of [1, -1]){
      const n = s > 0 ? 'L' : 'R';
      H.loft(G, [{p:[s*7, 52, 44], b:BI['mx' + n], rx:9, rz:3}, {p:[s*8, 44, 52], b:BI['mx' + n], rx:8, rz:2.6}, {p:[s*7, 38, 56], b:BI['mx' + n], rx:5, rz:2}], {seg:R(10), sub:Sb(3), up:[0, 0, 1], c:C_MOUTH, cap0:true, cap1:true});
      const E0 = BN[BI['eye' + n]].rest, tip = [E0[0] + s*EYE_TIP[0], E0[1] + EYE_TIP[1], E0[2] + EYE_TIP[2]];
      H.loft(G, [{p:[E0[0], E0[1] - 6, E0[2] - 2], b:BI['eye' + n], rx:5.5, rz:5.5}, {p:M.vlerp(E0, tip, 0.5), b:BI['eye' + n], rx:4.2, rz:4.2}, {p:tip, b:BI['eye' + n], rx:4.6, rz:4.6}], {seg:R(10), sub:Sb(3), up:[0, 0, 1], c:C_JOINT});
      KSK.eyeball(G, [tip[0], tip[1] + 2, tip[2] + 1], 7.5, [s*0.5, 0.35, 0.8], [0, 1, 0], BI['eye' + n], C_EYE, R(18), R(12), [1, 1, 1]);
    }
    // ---- legs
    for (const L of LEGS){
      const r = j => BN[L.b[j]].rest, sc = 1 - 0.07*Math.abs(L.j - 1.5);
      H.loft(G, [{p:M.vadd(r(0), M.vsc(L.o, -8)), b:L.b[0], rx:10*sc, rz:11*sc}, {p:r(1), b:L.b[0], rx:9*sc, rz:11*sc}, {p:M.vlerp(r(1), r(2), 0.15), b:L.b[1], rx:8*sc, rz:12.5*sc}, {p:M.vlerp(r(1), r(2), 0.6), b:L.b[1], rx:8.5*sc, rz:13*sc},
        {p:r(2), b:L.b[2], rx:7.5*sc, rz:10*sc}, {p:M.vlerp(r(2), r(3), 0.5), b:L.b[2], rx:6.5*sc, rz:9*sc}, {p:r(3), b:L.b[3], rx:5.5*sc, rz:6.5*sc}],
        {seg:R(14), sub:Sb(5), up:[0, 1, 0], c:C_LEG, under:[0, -1, 0], cap0:true, capLen:0.3, bump:0.25});
      H.sphere(G, r(2), 8*sc, L.b[2], C_LEG, R(10), R(7), [0.9, 1.1, 0.9]);
      KSK.cone(G, r(3), M.vsub(L.tip, r(3)), L.Ld + 3, 5.5*sc, 0.12, L.b[3], C_TIP, q, L.o);
      // a row of spines along the top of the merus
      for (let k = 1; k <= 3; k++){ const pk = M.vadd(M.vlerp(r(1), r(2), 0.2 + 0.22*k), [0, 11*sc, 0]); KSK.cone(G, pk, M.vadd(M.vsc(L.o, 0.6), [0, 0.8, 0]), 9, 2.2, 0.2, L.b[1], C_TIP, q*0.7); }
    }
    // ---- claws
    for (const C of CLAWS){
      const s = C.s, sc = C.sc, r = j => BN[C.b[j]].rest, h = r(3), hd = C.hd0;
      H.loft(G, [{p:r(0), b:C.b[0], rx:13*sc, rz:12*sc}, {p:r(1), b:C.b[1], rx:13*sc, rz:12*sc}, {p:M.vlerp(r(1), r(2), 0.5), b:C.b[1], rx:14*sc, rz:12*sc}, {p:r(2), b:C.b[2], rx:15*sc, rz:14*sc},
        {p:M.vlerp(r(2), h, 0.5), b:C.b[2], rx:17*sc, rz:15*sc}, {p:h, b:C.b[3], rx:15*sc, rz:16*sc}], {seg:R(18), sub:Sb(5), up:[0, 1, 0], c:C_SHELL, under:[0, -1, 0], cap0:true, capLen:0.3, bump:0.8});
      // the palm: deep, swollen, flattened sideways
      const pc = k => M.vadd(h, M.vsc(hd, C.palm*k));
      H.loft(G, [{p:pc(-0.05), b:C.b[3], rx:14*sc, rz:16*sc}, {p:pc(0.25), b:C.b[3], rx:17*sc, rz:23*sc}, {p:pc(0.6), b:C.b[3], rx:16*sc, rz:24*sc}, {p:pc(0.92), b:C.b[3], rx:13*sc, rz:19*sc}, {p:M.vadd(pc(1.02), [0, -4*sc, 0]), b:C.b[3], rx:9*sc, rz:11*sc}],
        {seg:R(26), sub:Sb(6), up:[0, 1, 0], c:C_SHELL, under:[0, -1, 0], cap0:true, cap1:true, capLen:0.25, bump:1.0});
      // the fixed finger (from the palm's lower front) and the movable finger (on its hinge above)
      KSK.cone(G, M.vadd(pc(0.96), [0, -7*sc, 0]), M.vadd(hd, [-s*0.06, -0.08, 0]), C.fing, 9.5*sc, 0.16, C.b[3], C_TIP, q, [s*0.1, 1, 0], 0.88);
      KSK.cone(G, r(4), M.vadd(hd, [-s*0.05, -0.12, 0]), C.fing*1.04, 9*sc, 0.22, C.b[4], C_TIP, q, [s*0.1, -1, 0.2], 0.9);
      // knobs on the carpus
      for (let k = 0; k < 3; k++) KSK.cone(G, M.vadd(M.vlerp(r(2), h, 0.25 + 0.25*k), [s*6*sc, 10*sc, 0]), [s*0.5, 1, 0.2], 8*sc, 3*sc, 0.1, C.b[2], C_TIP, q*0.7);
    }
    return G;
  }
  const BODY = `
float kMott = ksN(vKr * 0.035) * 0.6 + ksN(vKr * 0.1) * 0.4;
if (kC < 0.5 || (kC > 1.5 && kC < 2.5)){
  // shell: dark slate-teal armour, rust mottling, granular tubercles, barnacle crust in patches; glowing seams at night
  vec2 uv = kC < 0.5 ? vKu : vec2(vKu.x, vKu.y);
  vec4 c = ksCell(uv, 4.0); float fd = 1.0 - smoothstep(0.08, 0.3, kFw / 4.0);
  float rust = smoothstep(0.62, 0.88, ksN(vKr * 0.03 + vec3(5.0)) + 0.3 * ksN(vKr * 0.12));
  kCol = mix(vec3(0.07, 0.105, 0.11), vec3(0.15, 0.17, 0.16), kMott);
  kCol = mix(kCol, vec3(0.34, 0.15, 0.07), rust * 0.55);
  kCol *= mix(1.0, 0.8 + 0.35 * c.x, fd);
  kH = c.x * fd * 0.8;
  // barnacles: rings with a dark pit, in clusters
  vec4 b = ksCell(uv + 31.0, 5.5); float cl = smoothstep(0.55, 0.8, ksN(vKr * 0.02 + vec3(9.0)));
  float bar = step(0.45, b.y) * cl * (1.0 - smoothstep(0.32, 0.4, b.w)), pit = (1.0 - smoothstep(0.1, 0.16, b.w)) * bar;
  kCol = mix(kCol, vec3(0.62, 0.62, 0.56), bar * 0.85); kCol = mix(kCol, vec3(0.05), pit);
  kH += bar * 1.4 - pit * 1.2;
  if (kC > 1.5){ float band = smoothstep(0.85, 0.98, fract(vKu.y / 24.0)); kCol = mix(kCol, vec3(0.45, 0.3, 0.22), band * 0.6); }
  kCol = mix(kCol, vec3(0.55, 0.4, 0.28), smoothstep(0.35, 0.8, kU) * 0.8);
  float seam = 1.0 - smoothstep(0.0, 0.022, abs(ksN(vKr * 0.025 + vec3(2.0)) - 0.5));
  kEm = vec3(0.2, 0.85, 0.8) * seam * max(0.0, uEye - 0.7) * 0.32 * (kC < 0.5 ? 1.0 : 0.4);
  kSpec = 0.45 + 0.4 * (1.0 - c.z);
} else if (kC < 1.5){
  // underside: pale orange-cream with pits
  vec4 c = ksCell(vKu, 1.8); kCol = mix(vec3(0.58, 0.42, 0.28), vec3(0.68, 0.52, 0.36), kMott) * (0.85 + 0.15 * c.z); kH = -0.4 * (1.0 - c.z); kSpec = 0.4;
} else if (kC < 3.5){
  // black glossy tips with a pale serrated ridge (teeth)
  float t = smoothstep(0.82, 0.95, fract(vKu.y / 3.2)) * smoothstep(0.45, 0.6, kU);
  kCol = mix(vec3(0.03, 0.03, 0.035), vec3(0.6, 0.56, 0.48), t) + 0.02 * ksN(vKr * 0.9); kH = t; kSpec = 1.6; kBump = 0.5;
} else if (kC < 4.5){
  // compound eye: amber facets, glowing
  vec2 hx = vKu * 9.0; vec2 fc = fract(hx) - 0.5; float fac = 1.0 - smoothstep(0.32, 0.48, length(fc));
  float front = smoothstep(0.2, 0.7, kU);
  kCol = mix(vec3(0.12, 0.08, 0.03), vec3(0.75, 0.45, 0.1), front) * (0.6 + 0.4 * fac);
  kEm = vec3(1.0, 0.62, 0.15) * front * (0.5 + 0.5 * fac) * uEye * (0.85 + 0.15 * sin(uKT * 1.7));
  kSpec = 2.0; kBump = 0.0; kRimK = 0.0;
} else if (kC < 5.5){
  kCol = mix(vec3(0.42, 0.3, 0.3), vec3(0.55, 0.42, 0.4), kMott); kH = 0.4 * ksN(vKr * 0.6); kSpec = 0.7;
} else {
  float hair = smoothstep(0.6, 0.9, ksN(vec3(vKu * 1.6, 3.0)));
  kCol = mix(vec3(0.4, 0.16, 0.08), vec3(0.2, 0.08, 0.05), hair); kH = hair; kSpec = 0.6;
}`;
  let built = null;
  function get(){
    if (built) return built;
    const mat = KSK.material('crab', BODY, {spec:0x667070, shin:48});
    built = KSK.skinned('crab', BN, build, mat, {c:[0, 80, 40], r:400, box:[[-360, -150, -300], [360, 380, 420]]});
    return built;
  }
  return {get, build, BODY, outline};
})();

// ---- 24_mserpent.js ----
/* ================= the sea serpent's body: lofted along 40 body bones + the head (three LODs, one material) =================
   Body 700 m, round in front and flattened sideways towards the tail; a long head with a hinged lower jaw, fangs above and below,
   brow ridges over glowing eyes, two barbels; a crimson crest of five rays with membrane, fan-shaped pectoral fins, a scalloped red
   dorsal fin from the neck to the tail and a tail fin. Classes: 0 body (scales above, silver scutes below, a lateral line of
   photophores), 1 head, 2 fin membrane, 3 eye, 4 teeth, 5 jaw. LOD 0 ~24 k triangles. */
KSK.MODELS.serpent = (() => {
  const D = KSE, {BN, BI, BB, NS, SEG, RAD, EYES, Y0} = D, H = KM.H, M = KC.m;
  const C_BODY = 0, C_HEAD = 1, C_FIN = 2, C_EYE = 3, C_TOOTH = 4, C_JAW = 5;
  function build(q){
    const G = new H.Geo(), R = n => Math.max(3, Math.round(n*q)), Sb = n => Math.max(1, Math.round(n*q));
    // ---- body: joints 0..40 along -z
    const body = [];
    for (let i = 0; i <= NS; i++){ const u = i/NS, r = RAD(i); body.push({p:[0, Y0, -i*SEG], b:BB[Math.min(NS - 1, i)], rx:r*M.lerp(1, 0.62, Math.pow(u, 1.3)), rz:r}); }
    body[0].p = [0, Y0 + 1, -2];
    H.loft(G, body, {seg:R(30), sub:Sb(5), up:[0, 1, 0], c:C_BODY, under:[0, -1, 0], cap1:true, capLen:0.6});
    // ---- head (upper) and the lower jaw
    H.loft(G, [{p:[0, Y0 + 2, -8], b:BI.head, rx:14.5, rz:14}, {p:[0, Y0 + 4, 8], b:BI.head, rx:17, rz:15}, {p:[0, Y0 + 5, 26], b:BI.head, rx:15.5, rz:13}, {p:[0, Y0 + 3.5, 42], b:BI.head, rx:11, rz:9}, {p:[0, Y0 + 1, 56], b:BI.head, rx:6.5, rz:5.5}, {p:[0, Y0, 63], b:BI.head, rx:2.5, rz:2.5}],
      {seg:R(28), sub:Sb(6), up:[0, 1, 0], c:C_HEAD, under:[0, -1, 0], cap1:true, capLen:0.5, bump:0.3});
    H.loft(G, [{p:[0, 12, 4], b:BI.jaw, rx:12.5, rz:6.5}, {p:[0, 9.5, 22], b:BI.jaw, rx:11.5, rz:6}, {p:[0, 9, 40], b:BI.jaw, rx:8, rz:4.5}, {p:[0, 10, 54], b:BI.jaw, rx:4.5, rz:3}, {p:[0, 11, 60], b:BI.jaw, rx:1.5, rz:1.5}],
      {seg:R(20), sub:Sb(5), up:[0, 1, 0], c:C_JAW, under:[0, -1, 0], cap0:true, cap1:true, capLen:0.4});
    for (const s of [1, -1]){
      const E = [s*EYES[0][0], EYES[0][1], EYES[0][2]];
      KSK.eyeball(G, E, 6.8, [s*0.85, 0.3, 0.45], [0, 1, 0], BI.head, C_EYE, R(18), R(12), [0.7, 1, 1]);
      H.loft(G, [{p:[s*6, Y0 + 13, 26], b:BI.head, rx:2.5, rz:2}, {p:[s*12.5, Y0 + 14, 34], b:BI.head, rx:4, rz:3}, {p:[s*14, Y0 + 11, 44], b:BI.head, rx:2.5, rz:2}], {seg:R(8), sub:Sb(4), up:[0, 1, 0], c:C_HEAD, cap0:true, cap1:true});
      // fangs: down from the upper jaw's edge, up from the lower jaw's; two long ones in front
      for (let k = 0; k < 6; k++){ const z = 14 + k*7.5, w = M.lerp(12, 5.5, k/6);
        KSK.cone(G, [s*w, Y0 - 6 + k*0.4, z], [s*0.08, -1, 0.15], k === 5 ? 15 : 7 + k*0.4, k === 5 ? 2.4 : 1.6, 0.12, BI.head, C_TOOTH, q*0.6, [0, 0, -1]);
        KSK.cone(G, [s*(w - 1.5), 13.5, z + 3], [s*0.06, 1, 0.1], 5.5, 1.3, 0.1, BI.jaw, C_TOOTH, q*0.6, [0, 0, -1]); }
      // barbels from under the jaw
      H.loft(G, [{p:[s*4, 7, 44], b:BI.jaw, rx:1.8, rz:1.8}, {p:[s*7, -4, 38], b:BI.jaw, rx:1.3, rz:1.3}, {p:[s*9, -16, 30], b:BI.jaw, rx:0.9, rz:0.9}, {p:[s*10, -26, 22], b:BI.jaw, rx:0.4, rz:0.4}], {seg:R(6), sub:Sb(4), up:[0, 0, 1], c:C_FIN, cap1:true});
    }
    // ---- crest: five rays fanned up and back from the crown, membrane between them
    const RAYS = [[-0.35, 44], [-0.12, 54], [0.12, 58], [0.38, 50], [0.62, 40]], cb = BI.crest, c0 = BN[cb].rest;
    const rayDir = a => M.vnorm([0, Math.cos(a), -Math.sin(a) - 0.25]);
    for (const [a, L] of RAYS) KSK.cone(G, [0, c0[1] - 2, c0[2] + 8 - a*14], rayDir(a), L, 2.2, 0.15, cb, C_FIN, q*0.7, [0, 0, 1]);
    KSK.sheet(G, Math.max(4, Math.round(16*q)), Math.max(2, Math.round(5*q)), (i, j) => {
      const u = i/Math.max(4, Math.round(16*q)), v = j/Math.max(2, Math.round(5*q)), fa = u*(RAYS.length - 1), k0 = Math.min(RAYS.length - 2, Math.floor(fa)), f = fa - k0;
      const a = M.lerp(RAYS[k0][0], RAYS[k0 + 1][0], f), L = M.lerp(RAYS[k0][1], RAYS[k0 + 1][1], f)*(0.88 + 0.12*Math.cos(f*Math.PI*2)), base = [0, c0[1] - 2, c0[2] + 8 - a*14];
      return {p:M.vadd(base, M.vsc(rayDir(a), L*v*0.96)), si:[cb], sw:[1], u:u*60, v:v*L};
    }, C_FIN);
    // ---- dorsal fin (scalloped between the rays, one per bone), tail fin
    const NI = Math.max(12, Math.round(76*q));
    KSK.sheet(G, NI, Math.max(1, Math.round(2*q)), (i, j) => {
      const fi = 2 + i/NI*35.5, k0 = Math.min(NS - 1, Math.floor(fi)), f = fi - k0, r = RAD(fi), v = j/Math.max(1, Math.round(2*q));
      const hgt = (8 + 7*Math.sin(Math.PI*Math.min(1, fi/36)))*(0.55 + 0.45*Math.pow(Math.abs(Math.cos(Math.PI*f)), 0.5));
      return {p:[0, Y0 + r*0.9 + hgt*v, -fi*SEG], si:[BB[k0], BB[Math.min(NS - 1, k0 + 1)]], sw:[1 - f, f], u:fi*SEG, v:hgt*v};
    }, C_FIN);
    KSK.sheet(G, Math.max(4, Math.round(10*q)), Math.max(2, Math.round(6*q)), (i, j) => {
      const u = i/Math.max(4, Math.round(10*q)), v = j/Math.max(2, Math.round(6*q)) - 0.5, fi = 36 + u*4, k0 = Math.min(NS - 1, Math.floor(fi)), f = fi - k0;
      const span = 34*Math.sin(Math.PI*Math.min(1, u*1.3 + 0.2))*(1 - 0.25*Math.cos(v*Math.PI*6));
      return {p:[0, Y0 + v*span*2, -fi*SEG - u*8], si:[BB[k0], BB[Math.min(NS - 1, k0 + 1)]], sw:[1 - f, f], u:u*70, v:v*span};
    }, C_FIN);
    // ---- pectoral fins: fans
    for (const s of [1, -1]){ const b = BI[s > 0 ? 'pfL' : 'pfR'], r0 = BN[b].rest, n1 = Math.max(4, Math.round(10*q)), n2 = Math.max(2, Math.round(5*q));
      KSK.sheet(G, n1, n2, (i, j) => { const a = -0.9 + 1.5*i/n1, L = 34*(0.75 + 0.25*Math.sin(Math.PI*i/n1)), v = j/n2;
        return {p:M.vadd(r0, [s*Math.cos(a)*L*v*0.9, -4*v, -Math.sin(a)*L*v - 6*v]), si:[b], sw:[1], u:i*8, v:L*v}; }, C_FIN); }
    return G;
  }
  const BODY = `
float kMott = ksN(vKr * 0.03) * 0.6 + ksN(vKr * 0.09) * 0.4;
if (kC < 1.5){
  // scales: overlapping rows (a dome each, a dark rim), blue-black with a metallic blue-green sheen; silver scutes below; photophores
  float big = kC > 0.5 ? 1.6 : 1.0;
  vec2 sq = vec2(vKu.x / (3.4 * big), vKu.y / (2.8 * big)); sq.x += 0.5 * mod(floor(sq.y), 2.0); vec2 sc = fract(sq) - vec2(0.5, 0.3);
  float sd = length(sc * vec2(1.0, 1.3)), fd = 1.0 - smoothstep(0.1, 0.5, kFw / (2.8 * big));
  float dome = (1.0 - smoothstep(0.25, 0.62, sd)) * fd, rim = smoothstep(0.45, 0.62, sd) * fd;
  vec3 back = mix(vec3(0.03, 0.06, 0.08), vec3(0.05, 0.1, 0.11), kMott) * (0.8 + 0.4 * dome) * (1.0 - 0.45 * rim);
  float belly = smoothstep(0.52, 0.72, kU);
  float scute = smoothstep(0.85, 0.97, fract(vKu.y / 4.5));
  vec3 bel = mix(vec3(0.5, 0.53, 0.52), vec3(0.66, 0.68, 0.64), kMott) * (1.0 - 0.35 * scute);
  kCol = mix(back, bel, belly); kH = mix(dome * 0.9 - rim * 0.4, -scute * 0.6, belly);
  kIri = mix(vec3(0.08, 0.32, 0.38), vec3(0.06, 0.12, 0.3), ksN(vKr * 0.02)) * (1.0 - belly) * 1.4;
  float line = (1.0 - smoothstep(0.02, 0.05, abs(kU - 0.46))) * step(0.82, fract(vKu.y / 7.0));
  kEm = vec3(0.45, 0.95, 1.0) * line * max(0.0, uEye - 0.6) * 0.7; kCol = mix(kCol, vec3(0.7, 0.85, 0.9), line * 0.5);
  if (kC > 0.5) kCol = mix(kCol, vec3(0.26, 0.04, 0.05), smoothstep(0.78, 0.9, kU));
  kSpec = mix(1.1, 0.7, belly);
} else if (kC < 2.5){
  // fin membrane: crimson with dark rays, translucent at the rim
  float ray = 1.0 - smoothstep(0.0, 0.12, abs(fract(vKu.x / 4.0) - 0.5) * 2.0 - 0.8);
  kCol = mix(vec3(0.6, 0.07, 0.05), vec3(0.85, 0.25, 0.08), smoothstep(6.0, 30.0, vKu.y) * 0.6) * (1.0 - 0.45 * ray) * (0.85 + 0.3 * kMott);
  kH = ray * 0.5; kSpec = 0.6; kIri = vec3(0.25, 0.04, 0.02) * 0.8;
} else if (kC < 3.5){
  // eye: green-gold, a vertical slit, glowing
  float f = kU, ir = smoothstep(0.5, 0.65, f), slit = (1.0 - smoothstep(0.07, 0.14, abs(vKu.x))) * smoothstep(0.55, 0.75, f);
  kCol = mix(vec3(0.05, 0.08, 0.05), vec3(0.6, 0.75, 0.2), ir) * (1.0 - slit);
  kEm = vec3(0.65, 1.0, 0.3) * ir * (1.0 - 0.95 * slit) * uEye * (0.85 + 0.15 * sin(uKT * 1.1));
  kSpec = 2.2; kBump = 0.0; kRimK = 0.0;
} else if (kC < 4.5){
  kCol = vec3(0.86, 0.83, 0.72) * (0.9 + 0.1 * ksN(vKr)); kSpec = 1.4; kBump = 0.0;
} else {
  float top = 1.0 - smoothstep(0.3, 0.45, kU);
  kCol = mix(mix(vec3(0.5, 0.53, 0.52), vec3(0.62, 0.64, 0.6), kMott), vec3(0.3, 0.05, 0.06), top); kH = 0.3 * ksN(vKr * 0.8); kSpec = 0.8;
}`;
  let built = null;
  function get(){
    if (built) return built;
    const mat = KSK.material('serpent', BODY, {spec:0x6a7a80, shin:60});
    built = KSK.skinned('serpent', BN, build, mat, {c:[0, 40, -320], r:820, box:[[-780, -200, -1100], [780, 400, 760]]}, [[1, 0], [0.45, 1600], [0.2, 4600]]);
    return built;
  }
  return {get, build, BODY};
})();

// ---- 25_mshoggoth.js ----
/* ================= the shoggoth's body: a vertex-shader soft body (three LODs, one material + its shadow depth material) =================
   One mesh: a sphere (positions = unit directions) shaped in the vertex shader into the boiling mass (an ellipsoid with a swollen
   front, lumps of bubbles that churn with time, the bottom spreading over the ground) plus eight tubes (positions = (t, angle))
   bent in the shader along the pseudopod curves the core computes (uniform array uSL: S, C, E, radii, activity). Normals from
   finite differences of the same shape. Fragment: black, wet, iridescent bubbles (thin-film colours at grazing angles), a faint
   green self-luminance, and eyes forming and un-forming as pustules of greenish light (cells that open, stare and close). The depth
   material shapes the same mass for its shadow. LOD 0 ~32 k triangles, LOD 1 ~8 k, LOD 2 ~2 k. */
KSK.MODELS.shoggoth = (() => {
  const D = KSH, NL = D.NL;
  const U = {uSL:{value:new Float32Array(NL*12)}, uSB:{value:new Float32Array(8)}};
  function geometry(q){
    const NU = Math.max(16, Math.round(150*q)), NV = Math.max(8, Math.round(84*q)), TA = Math.max(6, Math.round(18*q)), TL = Math.max(6, Math.round(30*q));
    const P = [], T = [], I = [];
    for (let i = 0; i <= NV; i++){ const th = i/NV*Math.PI; for (let j = 0; j <= NU; j++){ const ph = j/NU*Math.PI*2; P.push(Math.sin(th)*Math.cos(ph), Math.cos(th), Math.sin(th)*Math.sin(ph)); T.push(-1, 0); } }
    for (let i = 0; i < NV; i++) for (let j = 0; j < NU; j++){ const a = i*(NU + 1) + j, b = a + 1, c = a + NU + 2, d = a + NU + 1; I.push(a, b, c, a, c, d); }
    for (let l = 0; l < NL; l++){ const base = P.length/3;
      for (let i = 0; i <= TL; i++){ const t = Math.pow(i/TL, 0.85); for (let j = 0; j <= TA; j++){ P.push(t, j/TA*Math.PI*2, 0); T.push(l, 0); } }
      for (let i = 0; i < TL; i++) for (let j = 0; j < TA; j++){ const a = base + i*(TA + 1) + j, b = a + 1, c = a + TA + 2, d = a + TA + 1; I.push(a, b, c, a, c, d); } }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(P.length), 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(T, 2));
    g.setIndex(P.length/3 > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 60, 60), 460); g.boundingBox = new THREE.Box3(new THREE.Vector3(-420, -60, -400), new THREE.Vector3(420, 460, 460));
    return {g, tris:I.length/3};
  }
  const VCOMMON = `
attribute vec2 aT;
uniform vec4 uSL[${NL*3}];
uniform vec4 uSB[2];
uniform float uKT;
varying vec3 vSP;
varying float vSK;
varying float vSA;
float sgH3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float sgN(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(sgH3(i), sgH3(i + vec3(1.0, 0.0, 0.0)), f.x), mix(sgH3(i + vec3(0.0, 1.0, 0.0)), sgH3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
             mix(mix(sgH3(i + vec3(0.0, 0.0, 1.0)), sgH3(i + vec3(1.0, 0.0, 1.0)), f.x), mix(sgH3(i + vec3(0.0, 1.0, 1.0)), sgH3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
vec3 sgBlob(vec3 d){
  float R = uSB[0].x, H = uSB[0].y, fb = uSB[0].z, roar = uSB[0].w;
  vec3 p = vec3(d.x * R, H * 0.42 + d.y * H * 0.62, d.z * R * (1.0 + fb * smoothstep(-0.2, 1.0, d.z)));
  vec3 q = p * 0.028 + vec3(0.0, uKT * 0.11, uKT * 0.04);
  float n = sgN(q) * 0.6 + sgN(q * 2.6 + 5.0) * 0.28 + sgN(q * 6.1 + 11.0) * 0.12;
  p += d * (n - 0.45) * (20.0 + 12.0 * roar);
  if (p.y < 0.0){ float s = -p.y; p.y = -s * 0.03; p.xz *= 1.0 + s / max(R, 1.0) * 0.65; }
  return p;
}
vec3 sgTube(float t, float a, int i, out vec3 nrm){
  vec4 A = uSL[i * 3], B = uSL[i * 3 + 1], C = uSL[i * 3 + 2];
  float u = 1.0 - t; vec3 P = u * u * A.xyz + 2.0 * u * t * B.xyz + t * t * C.xyz;
  vec3 Tg = 2.0 * u * (B.xyz - A.xyz) + 2.0 * t * (C.xyz - B.xyz); Tg = length(Tg) > 1e-3 ? normalize(Tg) : vec3(0.0, 1.0, 0.0);
  vec3 N = normalize(cross(Tg, abs(Tg.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0))); vec3 Bn = cross(Tg, N);
  float rad = mix(A.w, B.w, t) * (1.0 + 0.4 * smoothstep(0.6, 0.9, t)) * sqrt(max(0.0, 1.0 - pow(t, 7.0)));
  rad *= 1.0 + 0.5 * (sgN(P * 0.07 + vec3(0.0, uKT * 0.35, 0.0)) - 0.5);
  vec3 dir = N * cos(a) + Bn * sin(a);
  nrm = normalize(dir + Tg * pow(t, 6.0) * 1.5);
  return P + dir * rad;
}
void sgShape(out vec3 sp, out vec3 sn){
  if (aT.x < -0.5){
    vec3 d = normalize(position); sp = sgBlob(d);
    vec3 t1 = normalize(cross(d, abs(d.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0))), t2 = cross(d, t1);
    vec3 p1 = sgBlob(normalize(d + t1 * 0.025)), p2 = sgBlob(normalize(d + t2 * 0.025));
    sn = normalize(cross(p1 - sp, p2 - sp)); if (dot(sn, sp - vec3(0.0, uSB[0].y * 0.42, 0.0)) < 0.0) sn = -sn;
    vSK = -1.0; vSA = 1.0;
  } else {
    int li = int(aT.x + 0.5); sp = sgTube(position.x, position.y, li, sn); vSK = aT.x; vSA = uSL[li * 3 + 2].w;
  }
  vSP = sp;
}`;
  const FRAG = `
uniform float uKT;
uniform float uEye;
uniform float uWet;
uniform vec4 uSB[2];
varying vec3 vSP;
varying float vSK;
varying float vSA;
float sgH3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float sgN(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(sgH3(i), sgH3(i + vec3(1.0, 0.0, 0.0)), f.x), mix(sgH3(i + vec3(0.0, 1.0, 0.0)), sgH3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
             mix(mix(sgH3(i + vec3(0.0, 0.0, 1.0)), sgH3(i + vec3(1.0, 0.0, 1.0)), f.x), mix(sgH3(i + vec3(0.0, 1.0, 1.0)), sgH3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
// 3-d cells (a 2x2x2 window): x = F1, y = F2, z = id
vec3 sgCell(vec3 p){
  vec3 i0 = floor(p), f = fract(p), o = step(0.5, f) - 1.0; float d1 = 9.0, d2 = 9.0, id = 0.0;
  for (int z = 0; z < 2; z++) for (int y = 0; y < 2; y++) for (int x = 0; x < 2; x++){
    vec3 g = o + vec3(float(x), float(y), float(z)), c = i0 + g, r = g + vec3(sgH3(c), sgH3(c + 7.1), sgH3(c + 13.7)) * 0.8 + 0.1 - f; float d = dot(r, r);
    if (d < d1){ d2 = d1; d1 = d; id = sgH3(c + 3.3); } else if (d < d2) d2 = d;
  }
  return vec3(sqrt(d1), sqrt(d2), id);
}
vec3 sgPerturb(vec3 sp, vec3 sn, vec2 dh, float fd){
  vec3 sx = dFdx(sp), sy = dFdy(sp), r1 = cross(sy, sn), r2 = cross(sn, sx); float det = dot(sx, r1) * fd;
  return normalize(abs(det) * sn - sign(det) * (dh.x * r1 + dh.y * r2));
}`;
  const FRAG_BODY = `
float sgR = max(uSB[0].x, 1.0);
vec3 sq = vSP * 0.11 + vec3(0.0, uKT * 0.08, 0.0);
vec3 b1 = sgCell(sq), b2 = sgCell(vSP * 0.34 + vec3(uKT * 0.05, 0.0, 0.0) + 9.0);
float e1 = b1.y - b1.x, e2 = b2.y - b2.x;
// fine detail fades out where it would shimmer (metres per pixel)
float sgFw = length(fwidth(vSP)), sgF1 = 1.0 - smoothstep(1.6, 6.0, sgFw), sgF2 = 1.0 - smoothstep(0.25, 1.0, sgFw);
float sgHh = smoothstep(0.0, 0.32, e1) * (1.0 - 0.5 * b1.x) * sgF1 + 0.35 * smoothstep(0.0, 0.25, e2) * sgF2;
float film = b1.z * 0.7 + sgN(vSP * 0.02 + uKT * 0.03) * 0.8;
vec3 sgIri = 0.5 + 0.5 * cos(6.2832 * (vec3(0.0, 0.33, 0.67) + film));
vec3 sgCol = vec3(0.012, 0.014, 0.018) + sgIri * 0.022 * (1.0 - smoothstep(0.0, 0.14, e1)) * sgF1 * (1.0 - smoothstep(0.6, 1.6, sgFw));
// faint green self-luminance in drifting veins
float glow = smoothstep(0.6, 0.85, sgN(vSP * 0.018 + vec3(0.0, uKT * 0.06, 0.0)));
vec3 sgEm = vec3(0.03, 0.12, 0.07) * glow * (0.4 + 0.5 * uEye);
// eyes forming and un-forming: cells that open, stare and close (more of them on the front)
vec3 ec = sgCell(vSP * 0.05 + vec3(0.0, 0.0, uKT * 0.01) + 31.0);
float life = fract(uKT * (0.045 + 0.06 * ec.z) + ec.z * 7.3), open = smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.5, 0.68, life));
float front = smoothstep(-0.4, 0.7, vSP.z / sgR) * (vSK < -0.5 ? 1.0 : 0.7) + uSB[0].w;
open *= step(0.5, fract(ec.z * 13.7)) * clamp(front, 0.0, 1.0) * smoothstep(0.25, 0.9, vSA);
float rr = ec.x / max(open, 0.05), iris = 1.0 - smoothstep(0.2, 0.27, rr), pupil = 1.0 - smoothstep(0.05, 0.09, rr * (1.0 + 0.6 * abs(sin(ec.z * 40.0))));
sgCol = mix(sgCol, vec3(0.2, 0.55, 0.25), iris * open * 0.6);
sgCol = mix(sgCol, vec3(0.0), pupil * open);
sgEm += vec3(0.35, 1.0, 0.45) * iris * (1.0 - pupil) * open * (0.5 + 0.9 * uEye);
sgHh += iris * open * 0.8;
diffuseColor.rgb = sgCol;`;
  function material(){
    const m = new THREE.MeshPhongMaterial({color:0xffffff, specular:0x7a8088, shininess:45});
    m.extensions = {derivatives:true};
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, KM.U, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + VCOMMON)
        .replace('#include <beginnormal_vertex>', 'vec3 sgP; vec3 objectNormal; sgShape(sgP, objectNormal);')
        .replace('#include <begin_vertex>', 'vec3 transformed = sgP;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + FRAG)
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + FRAG_BODY)
        .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = sgPerturb(-vViewPosition, normal, vec2(dFdx(sgHh), dFdy(sgHh)) * 1.1, faceDirection);')
        .replace('#include <specularmap_fragment>', 'float specularStrength = mix(0.55, 1.6, sgF1) * mix(0.6, 1.0, uWet);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += sgEm;')
        .replace('vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;',
          'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n' +
          'float sgFr = pow(1.0 - clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0), 2.5);\noutgoingLight += sgIri * sgFr * 0.26 + vec3(0.02, 0.05, 0.04) * sgFr;');
    };
    m.customProgramCacheKey = () => 'kjshoggoth';
    const dm = new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});
    dm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, KM.U, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + VCOMMON)
        .replace('#include <begin_vertex>', 'vec3 sgP; vec3 sgNn; sgShape(sgP, sgNn); vec3 transformed = sgP;');
    };
    dm.customProgramCacheKey = () => 'kjshoggoth_depth';
    return {m, dm};
  }
  let built = null;
  function get(){
    if (built) return built;
    const t0 = performance.now(), {m, dm} = material(), lods = [], tris = [], root = new THREE.LOD(); root.name = 'kaiju_shoggoth';
    [[1, 0], [0.45, 1300], [0.2, 4200]].forEach(([q, d]) => { const G = geometry(q), mesh = new THREE.Mesh(G.g, m);
      mesh.customDepthMaterial = dm; mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = true; mesh.name = 'kaiju_shoggoth_lod' + lods.length;
      root.addLevel(mesh, d); lods.push(mesh); tris.push(G.tris); });
    built = {root, lods, mat:m, tris, U:KM.U, ms:performance.now() - t0, setPose(M){ if (M && M.length >= NL*12 + 8){ U.uSL.value.set(M.subarray(0, NL*12)); U.uSB.value.set(M.subarray(NL*12, NL*12 + 8)); } }};
    return built;
  }
  return {get, geometry, U, VCOMMON, FRAG, FRAG_BODY};
})();

// ---- 27_mreptile.js ----
/* ================= the titan lizard's body (v31): lofted along its spine, four sprawling legs, a jawed head (three LODs, one material) =================
   One loft from the neck to the tail tip (a broad, flat trunk; the tail flattened sideways for swimming), the head in two parts (the
   skull with the upper jaw, the lower jaw on its hinge), a throat pouch on its own bone, brow bosses, nostrils, rows of teeth, eyes,
   a forked tongue; legs as lofted limbs with broad five-clawed feet. Classes: 0 trunk / tail (keeled osteoderm scutes above, square
   belly scales below, rust-ochre cross-bands), 1 head, 2 limbs, 3 claws, 4 eyes, 5 teeth, 6 mouth / tongue. LOD 0 ~30 k triangles. */
KSK.MODELS.reptile = (() => {
  const D = KRE, {BN, BI, TB, NT, TIP, LEGS, EYES} = D, H = KM.H, M = KC.m;
  const C_BODY = 0, C_HEAD = 1, C_LIMB = 2, C_CLAW = 3, C_EYE = 4, C_TOOTH = 5, C_MOUTH = 6;
  const rest = b => BN[b].rest;
  function build(q){
    const G = new H.Geo(), R = n => Math.max(3, Math.round(n*q)), Sb = n => Math.max(1, Math.round(n*q));
    // ---- neck, trunk, tail: one loft (half widths rx across, rz up); the tail's tip flattened sideways
    const sp = [
      {p:[0, 30.5, 74], b:BI.neck2, rx:12.5, rz:10.5}, {p:[0, 32.5, 62], b:BI.neck2, rx:14, rz:11.5}, {p:[0, 34, 50], b:BI.neck1, rx:18, rz:13.5},
      {p:[0, 35, 38], b:BI.shoulder, rx:25, rz:15.5}, {p:[0, 35, 24], b:BI.chest, rx:29, rz:16.5}, {p:[0, 34.5, 8], b:BI.chest, rx:31, rz:17, oz:-0.5},
      {p:[0, 34, -8], b:BI.root, rx:31, rz:16.5, oz:-0.8}, {p:[0, 33.5, -24], b:BI.loin, rx:28.5, rz:16}, {p:[0, 32.5, -38], b:BI.hip, rx:24, rz:15}];
    const TR = [[15.5, 12.5], [13, 11.5], [11, 10.5], [9.2, 9.4], [7.6, 8.4], [6.1, 7.3], [4.8, 6.1], [3.6, 5], [2.5, 3.8], [1.6, 2.6]];
    for (let j = 0; j < NT; j++){ const r = rest(TB[j]); sp.push({p:[0, r[1], r[2]], b:TB[j], rx:TR[j][0], rz:TR[j][1]}); }
    sp.push({p:TIP.slice(), b:TB[NT - 1], rx:0.6, rz:1.2});
    H.loft(G, sp, {seg:R(40), sub:Sb(6), up:[0, 1, 0], c:C_BODY, under:[0, -1, 0], cap1:true, capLen:0.5, bump:0.35});
    // ---- the head: skull + upper jaw (a long flat wedge), the lower jaw on its hinge, the throat pouch below
    H.loft(G, [{p:[0, 30.5, 72], b:BI.head, rx:13.5, rz:11}, {p:[0, 32.5, 82], b:BI.head, rx:14.5, rz:9}, {p:[0, 31.5, 93], b:BI.head, rx:12, rz:6.8},
      {p:[0, 30, 103], b:BI.head, rx:9.2, rz:5.2}, {p:[0, 29, 110], b:BI.head, rx:7.2, rz:4.2}, {p:[0, 28.2, 114.5], b:BI.head, rx:4.5, rz:3}],
      {seg:R(30), sub:Sb(6), up:[0, 1, 0], c:C_HEAD, under:[0, -1, 0], cap1:true, capLen:0.45, bump:0.2});
    H.loft(G, [{p:[0, 24.5, 78], b:BI.jaw, rx:12.5, rz:4.2}, {p:[0, 23.4, 90], b:BI.jaw, rx:11, rz:3.6}, {p:[0, 23.6, 101], b:BI.jaw, rx:8.6, rz:3}, {p:[0, 24.5, 109], b:BI.jaw, rx:6.4, rz:2.4}, {p:[0, 25.2, 113.5], b:BI.jaw, rx:3.8, rz:1.6}],
      {seg:R(24), sub:Sb(5), up:[0, 1, 0], c:C_HEAD, under:[0, -1, 0], cap0:true, cap1:true, capLen:0.35});
    // the inside of the mouth (a dark lining between the jaws: seen when it gapes) and the throat pouch
    H.loft(G, [{p:[0, 26.5, 80], b:BI.jaw, rx:10, rz:1.4}, {p:[0, 26, 96], b:BI.jaw, rx:8.6, rz:1.2}, {p:[0, 26.4, 108], b:BI.jaw, rx:5.5, rz:1}], {seg:R(14), sub:Sb(3), up:[0, 1, 0], c:C_MOUTH, cap0:true, cap1:true});
    H.loft(G, [{p:[0, 23, 72], b:BI.neck2, rx:9, rz:5}, {p:[0, 20, 80], b:BI.gular, rx:9.5, rz:6}, {p:[0, 19.5, 88], b:BI.gular, rx:8.5, rz:5.5}, {p:[0, 22, 96], b:BI.jaw, rx:6, rz:3}],
      {seg:R(18), sub:Sb(4), up:[0, 1, 0], c:C_HEAD, under:[0, -1, 0], cap1:true, capLen:0.3});
    for (const s of [1, -1]){
      // brow bosses over the eyes, the eyes, the nostrils, a ridge of bony knobs along the jaw line
      H.loft(G, [{p:[s*4, 37, 81], b:BI.head, rx:2.6, rz:2}, {p:[s*9.5, 38, 86], b:BI.head, rx:4, rz:2.8}, {p:[s*11, 37, 92], b:BI.head, rx:3.2, rz:2.2}, {p:[s*8, 35, 97], b:BI.head, rx:1.8, rz:1.4}], {seg:R(10), sub:Sb(4), up:[0, 1, 0], c:C_HEAD, cap0:true, cap1:true});
      KSK.eyeball(G, M.vadd(EYES[0], [s > 0 ? 0 : -2*EYES[0][0], 0, 0]), 3.6, [s*0.82, 0.3, 0.48], [0, 1, 0], BI.head, C_EYE, R(16), R(10), [0.75, 1, 1]);
      H.sphere(G, [s*2.6, 31.5, 111.5], 1.5, BI.head, C_CLAW, R(8), R(6), [1, 0.7, 1.4]);
      // teeth: down from the upper jaw's edge, up from the lower jaw's (a lipless croc-like row), longer at the front
      for (let i = 0; i < 9; i++){ const z = 84 + i*3.4, w = M.lerp(12.4, 5.2, i/8), L = i > 6 ? 4.4 : 2.6 + 0.2*i;
        KSK.cone(G, [s*w, 26.3, z], [s*0.12, -1, 0.1], L, 0.85, 0.15, BI.head, C_TOOTH, q*0.55, [0, 0, -1]);
        if (i < 8) KSK.cone(G, [s*(w - 1.3), 25.4, z + 1.7], [s*0.1, 1, 0.08], L*0.85, 0.75, 0.12, BI.jaw, C_TOOTH, q*0.55, [0, 0, -1]); }
    }
    // the forked tongue (on its bone: retracted in the mouth, flicked out)
    for (const s of [1, -1]) H.loft(G, [{p:[0, 25.5, 86], b:BI.tongue, rx:1.6, rz:0.7}, {p:[0, 25.6, 98], b:BI.tongue, rx:1.2, rz:0.55}, {p:[s*1.2, 25.7, 104], b:BI.tongue, rx:0.6, rz:0.35}, {p:[s*3, 25.8, 109], b:BI.tongue, rx:0.25, rz:0.2}],
      {seg:R(6), sub:Sb(3), up:[0, 1, 0], c:C_MOUTH, cap1:true});
    // ---- legs: upper limb, forearm / shin, a broad foot with five clawed toes fanned forward
    for (const L of LEGS){
      const s = L.s, So = rest(L.b[0]), El = rest(L.b[1]), Wr = rest(L.b[2]), Tt = rest(L.b[3]), big = L.front ? 1 : 1.15;
      H.loft(G, [{p:M.vadd(So, [-s*7, 5, 0]), b:L.b[0], rx:13*big, rz:13.5*big}, {p:M.vlerp(So, El, 0.45), b:L.b[0], rx:11*big, rz:11.5*big}, {p:El, b:L.b[1], rx:9*big, rz:9.2*big},
        {p:M.vlerp(El, Wr, 0.5), b:L.b[1], rx:7.2*big, rz:7.4*big}, {p:M.vadd(Wr, [0, 1, 0]), b:L.b[2], rx:5.8*big, rz:5.4*big}], {seg:R(18), sub:Sb(5), up:[0, 1, 0], c:C_LIMB, under:[0, -1, 0], cap0:true, capLen:0.3, bump:0.3});
      H.sphere(G, El, 9.3*big, L.b[1], C_LIMB, R(10), R(7), [1, 1, 1]);
      // the foot: a flat pad from the wrist to the toes' bases
      const fd = M.vnorm([Tt[0] - Wr[0], 0, Tt[2] - Wr[2]]), side = [fd[2], 0, -fd[0]];
      H.loft(G, [{p:M.vadd(Wr, [0, -1.5, 0]), b:L.b[2], rx:5*big, rz:3.2*big}, {p:M.vadd(M.vlerp(Wr, Tt, 0.55), [0, -1.6, 0]), b:L.b[2], rx:6.2*big, rz:2.4*big}, {p:M.vadd(Tt, [0, 0.3, 0]), b:L.b[3], rx:6.6*big, rz:1.8*big}],
        {seg:R(14), sub:Sb(4), up:[0, 1, 0], c:C_LIMB, cap0:true, cap1:true, capLen:0.3});
      for (let f = -2; f <= 2; f++){ const a = f*0.33 + (L.front ? 0 : -s*0.1), d = [fd[0]*Math.cos(a) + side[0]*Math.sin(a), -0.12, fd[2]*Math.cos(a) + side[2]*Math.sin(a)];
        const root = M.vadd(M.vadd(Tt, M.vsc(side, f*2.6*big)), [0, 0.4, 0]);
        H.loft(G, [{p:M.vsub(root, M.vsc(d, 1)), b:L.b[3], rx:1.6*big, rz:1.2*big}, {p:M.vadd(root, M.vsc(d, 4.5*big)), b:L.b[3], rx:1.3*big, rz:1*big}], {seg:R(6), sub:1, up:[0, 1, 0], c:C_LIMB});
        KSK.cone(G, M.vadd(root, M.vsc(d, 4.5*big)), [d[0], -0.35, d[2]], (f === 0 ? 6 : 5)*big, 1.2*big, 0.35, L.b[3], C_CLAW, q*0.7, [0, 1, 0]); }
    }
    return G;
  }
  const BODY = `
float kMott = ksN(vKr * 0.03) * 0.6 + ksN(vKr * 0.11) * 0.4;
float kBand = smoothstep(0.5, 0.82, 0.5 + 0.5 * sin(vKr.z / 23.0 * 6.2832 + 1.3) + 0.3 * (ksN(vKr * 0.045) - 0.5));
if (kC < 0.5){
  // keeled osteoderm scutes on the back (offset rows of rectangles with a ridge down each), small scales on the flanks, square
  // belly scales; basalt grey-green, rust-ochre cross-bands with pale spots
  float back = 1.0 - smoothstep(0.12, 0.5, kU), fd = 1.0 - smoothstep(0.1, 0.4, kFw / 4.0);
  vec2 q = vec2(vKu.x / 4.4, vKu.y / 5.2); float row = floor(q.y); q.x += 0.5 * mod(row, 2.0); vec2 f = fract(q) - 0.5;
  float scute = (1.0 - smoothstep(0.34, 0.47, abs(f.x))) * (1.0 - smoothstep(0.34, 0.47, abs(f.y)));
  float keel = (1.0 - smoothstep(0.0, 0.09, abs(f.x))) * smoothstep(-0.38, 0.3, f.y) * scute;
  vec4 c = ksCell(vKu, 1.5);
  kH = mix(c.x * 0.55, scute * 0.75 + keel * 0.9, back) * fd;
  float spot = step(0.62, ksH(floor(q) + 3.1)) * scute * back;
  kCol = mix(vec3(0.075, 0.082, 0.072), vec3(0.155, 0.152, 0.13), kMott);
  kCol = mix(kCol, vec3(0.4, 0.25, 0.11), kBand * 0.5 * back + kBand * spot * 0.45);
  kCol = mix(kCol, vec3(0.52, 0.46, 0.33), spot * 0.35 * (1.0 - kBand));
  kCol *= mix(1.0, 0.7 + 0.42 * scute, fd * back);
  vec2 bq = fract(vKu / 2.3) - 0.5; float bs = 1.0 - smoothstep(0.37, 0.47, max(abs(bq.x), abs(bq.y))), bel = smoothstep(0.42, 0.78, kU);
  kCol = mix(kCol, vec3(0.5, 0.46, 0.36) * (0.8 + 0.2 * bs) * (0.85 + 0.3 * kMott), bel);
  kH = mix(kH, bs * 0.4 * fd, bel); kSpec = 0.22 + 0.25 * keel + 0.1 * bel;
} else if (kC < 1.5){
  // head: small polygonal scales, the brow and snout darker, a pale lip line; the underside of the jaw and the pouch paler
  vec4 c = ksCell(vKu, 1.1); float fd = 1.0 - smoothstep(0.1, 0.4, kFw / 1.1);
  kCol = mix(vec3(0.07, 0.075, 0.065), vec3(0.14, 0.135, 0.115), kMott) * mix(1.0, 0.78 + 0.35 * c.x, fd);
  kCol = mix(kCol, vec3(0.46, 0.42, 0.33), smoothstep(0.35, 0.75, kU));
  kH = c.x * 0.6 * fd; kSpec = 0.35;
} else if (kC < 2.5){
  vec4 c = ksCell(vKu, 1.3); float fd = 1.0 - smoothstep(0.1, 0.4, kFw / 1.3);
  kCol = mix(vec3(0.08, 0.085, 0.074), vec3(0.15, 0.145, 0.125), kMott) * mix(1.0, 0.75 + 0.4 * c.x, fd);
  kCol = mix(kCol, vec3(0.36, 0.23, 0.11), kBand * 0.35);
  kCol = mix(kCol, vec3(0.44, 0.4, 0.31), smoothstep(0.4, 0.8, kU)); kH = c.x * 0.6 * fd; kSpec = 0.3;
} else if (kC < 3.5){
  kCol = vec3(0.04, 0.038, 0.035) + 0.03 * ksN(vKr * 0.9); kSpec = 1.5; kBump = 0.3; kH = 0.2 * ksN(vKr * 2.0);
} else if (kC < 4.5){
  // eyes: amber with a round black pupil and a dark rim; they glow at night
  float r = length(vKu), ir = smoothstep(0.38, 0.9, kU), pup = (1.0 - smoothstep(0.18, 0.24, r)) * ir;
  kCol = mix(vec3(0.05, 0.04, 0.02), vec3(0.85, 0.52, 0.1), ir) * (1.0 - pup * 0.95);
  kEm = vec3(1.0, 0.55, 0.12) * ir * (1.0 - 0.95 * pup) * uEye * (0.82 + 0.18 * sin(uKT * 1.3));
  kSpec = 2.2; kBump = 0.0; kRimK = 0.0;
} else if (kC < 5.5){
  kCol = vec3(0.78, 0.74, 0.62) * (0.88 + 0.12 * ksN(vKr * 1.7)); kSpec = 1.2; kBump = 0.0;
} else {
  kCol = mix(vec3(0.3, 0.12, 0.12), vec3(0.42, 0.2, 0.18), ksN(vKr * 0.7)); kH = 0.3 * ksN(vKr * 1.4); kSpec = 1.0;
}`;
  let built = null;
  function get(){
    if (built) return built;
    const mat = KSK.material('reptile', BODY, {spec:0x505a50, shin:30});
    built = KSK.skinned('reptile', BN, build, mat, {c:[0, 30, -20], r:260, box:[[-260, -60, -280], [260, 160, 240]]});
    return built;
  }
  return {get, build, BODY};
})();

// ---- 28_mwyvern.js ----
/* ================= the wyvern's body (v31): a lofted neck-body-tail, a horned head, bat wings with membranes, taloned legs (three LODs, one material)
   + a soft ground shadow (one quad) =================
   The membranes are two-sided sheets between the body, the arm and the three fingers (skinned by distance to the wing bones, so they
   stretch and fold with them), scalloped between the finger tips. A spade at the tail's end, a hooked thumb claw at each wrist, four
   toes with talons on each foot. Classes: 0 scales (iron blue-black, a bronze belly), 1 head, 2 membrane, 3 horn / claw / talon,
   4 eyes, 5 teeth, 6 wing bones, 7 mouth. LOD 0 ~26 k triangles.
   The ground shadow: the skinned mesh casts its own shadow where the sun's shadow map reaches; high up (out of the shadow camera's
   range) a soft wing-shaped shadow is drawn on the ground under it along the sun (a quad with an analytic silhouette: fades with
   the altitude, follows the heading, the bank and the wing spread). */
KSK.MODELS.wyvern = (() => {
  const D = KWY, {BN, BI, TB, NT, TIP, WINGS, LEGS, EYES} = D, H = KM.H, M = KC.m;
  const C_SCALE = 0, C_HEAD = 1, C_MEMB = 2, C_HORN = 3, C_EYE = 4, C_TOOTH = 5, C_BONE = 6, C_MOUTH = 7;
  const rest = b => BN[b].rest;
  // distance from p to segment a-b
  const dseg = (p, a, b) => { const ab = M.vsub(b, a), t = Math.max(0, Math.min(1, M.vdot(M.vsub(p, a), ab)/Math.max(1e-6, M.vdot(ab, ab)))); return M.vlen(M.vsub(p, M.vadd(a, M.vsc(ab, t)))); };
  function weights(p, segs){ const ws = segs.map(([bi, A, B]) => [bi, 1/Math.pow(dseg(p, A, B) + 3, 2.4)]).sort((x, y) => y[1] - x[1]).slice(0, 3), sum = ws.reduce((t, w) => t + w[1], 0); return {si:ws.map(w => w[0]), sw:ws.map(w => w[1]/sum)}; }
  function build(q){
    const G = new H.Geo(), R = n => Math.max(3, Math.round(n*q)), Sb = n => Math.max(1, Math.round(n*q));
    // ---- neck, body, tail: one loft from the head's base to the tail's tip
    const sp = [{p:[0, 22.5, 60], b:BI.n3, rx:5.8, rz:6.4}, {p:[0, 19, 51], b:BI.n2, rx:6.6, rz:7.2}, {p:[0, 15.2, 41], b:BI.n1, rx:7.6, rz:8.2}, {p:[0, 11, 31], b:BI.n0, rx:9.4, rz:10.2},
      {p:[0, 6, 20], b:BI.chest, rx:13, rz:14.5, oz:-1.5}, {p:[0, 3, 8], b:BI.chest, rx:14.2, rz:15, oz:-2}, {p:[0, 1, -4], b:BI.root, rx:13, rz:13.5, oz:-1}, {p:[0, -0.5, -16], b:BI.root, rx:11.2, rz:11}];
    const TRd = [9.2, 7.6, 6.4, 5.4, 4.5, 3.6, 2.8, 2.0];
    for (let j = 0; j < NT; j++){ const r = rest(TB[j]); sp.push({p:r.slice(), b:TB[j], rx:TRd[j], rz:TRd[j]*1.05}); }
    sp.push({p:[0, -7, -110], b:TB[NT - 1], rx:1.2, rz:1.2});
    H.loft(G, sp, {seg:R(30), sub:Sb(6), up:[0, 1, 0], c:C_SCALE, under:[0, -1, 0], cap1:true, capLen:0.4, bump:0.18});
    // the spade at the tail's end (a flat arrowhead, two-sided)
    { const tb = TB[NT - 1], NI = Math.max(4, Math.round(10*q)), NJ = Math.max(2, Math.round(4*q));
      KSK.sheet(G, NI, NJ, (i, j) => { const u = i/NI, v = j/NJ - 0.5, z = -106 - 20*u, w = 9*Math.sin(PI*Math.min(1, u*1.35))*(u < 0.74 ? 1 : (1 - u)/0.26*0.9);
        return {p:[v*2*w, -7 - 0.3*u, z], si:[tb], sw:[1], u:u*20, v:v*2*w}; }, C_SCALE); }
    // ---- the head: skull and upper jaw, the lower jaw, horns, brows, eyes, teeth
    H.loft(G, [{p:[0, 23.5, 59], b:BI.head, rx:6.6, rz:6.8}, {p:[0, 24.8, 66], b:BI.head, rx:7.2, rz:6}, {p:[0, 24, 74], b:BI.head, rx:5.6, rz:4.4}, {p:[0, 22.6, 82], b:BI.head, rx:3.8, rz:3.1}, {p:[0, 21.6, 87.5], b:BI.head, rx:2.2, rz:1.9}],
      {seg:R(24), sub:Sb(5), up:[0, 1, 0], c:C_HEAD, under:[0, -1, 0], cap1:true, capLen:0.5, bump:0.12});
    H.loft(G, [{p:[0, 20.4, 63], b:BI.jaw, rx:5.2, rz:2.4}, {p:[0, 19.4, 72], b:BI.jaw, rx:4.4, rz:2}, {p:[0, 19.6, 80], b:BI.jaw, rx:3.2, rz:1.6}, {p:[0, 20.2, 86], b:BI.jaw, rx:1.7, rz:1.1}], {seg:R(18), sub:Sb(4), up:[0, 1, 0], c:C_HEAD, under:[0, -1, 0], cap0:true, cap1:true, capLen:0.4});
    H.loft(G, [{p:[0, 21.3, 64], b:BI.jaw, rx:4.4, rz:0.8}, {p:[0, 21, 76], b:BI.jaw, rx:3.2, rz:0.6}, {p:[0, 21.2, 84], b:BI.jaw, rx:1.6, rz:0.5}], {seg:R(10), sub:Sb(3), up:[0, 1, 0], c:C_MOUTH, cap0:true, cap1:true});
    for (const s of [1, -1]){
      KSK.cone(G, [s*3.6, 28, 63], [s*0.3, 0.42, -0.86], 17, 2.3, 0.28, BI.head, C_HORN, q, [0, 1, 0.2]);
      KSK.cone(G, [s*6.2, 25.4, 61], [s*0.55, 0.1, -0.83], 9, 1.5, 0.2, BI.head, C_HORN, q*0.8, [0, 1, 0]);
      H.loft(G, [{p:[s*2.5, 27.8, 67], b:BI.head, rx:1.6, rz:1.1}, {p:[s*5, 27.5, 71.5], b:BI.head, rx:2, rz:1.4}, {p:[s*5.6, 26.4, 75], b:BI.head, rx:1.2, rz:0.9}], {seg:R(8), sub:Sb(3), up:[0, 1, 0], c:C_HEAD, cap0:true, cap1:true});
      KSK.eyeball(G, s > 0 ? EYES[0] : EYES[1], 1.9, [s*0.85, 0.25, 0.45], [0, 1, 0], BI.head, C_EYE, R(14), R(9), [0.8, 1, 1]);
      for (let i = 0; i < 6; i++){ const z = 68 + i*3.2, w = M.lerp(5.6, 2.4, i/5);
        KSK.cone(G, [s*w, 21.6, z], [s*0.1, -1, 0.12], 2.2 + (i === 5 ? 1.2 : 0), 0.55, 0.15, BI.head, C_TOOTH, q*0.5, [0, 0, -1]); }
      // small spines down the back of the skull (a heraldic crest, not plates)
      for (let i = 0; i < 3; i++) KSK.cone(G, [s*1.2, 29.5 - i*1.5, 60 - i*3.5], [s*0.15, 0.6, -0.8], 5 - i, 0.9, 0.2, BI.head, C_HORN, q*0.5, [0, 1, 0]);
    }
    // ---- wings: the arm and finger bones, the thumb claw, the membranes
    for (const W of WINGS){
      const s = W.s, [hb, eb, wb] = W.b, [f1, f2, f3] = W.f;
      H.loft(G, [{p:M.vadd(W.Sh, [-s*3, 0, 0]), b:hb, rx:5.6, rz:5.6}, {p:M.vlerp(W.Sh, W.El, 0.5), b:hb, rx:4.2, rz:4.4}, {p:W.El, b:eb, rx:3.6, rz:3.6}, {p:M.vlerp(W.El, W.Wr, 0.5), b:eb, rx:2.7, rz:2.8}, {p:W.Wr, b:wb, rx:2.5, rz:2.5}],
        {seg:R(12), sub:Sb(5), up:[0, 1, 0], c:C_BONE, cap0:true});
      for (const [fb, T, r0] of [[f1, W.T1, 2], [f2, W.T2, 1.7], [f3, W.T3, 1.5]])
        H.loft(G, [{p:W.Wr, b:fb, rx:r0, rz:r0}, {p:M.vlerp(W.Wr, T, 0.5), b:fb, rx:r0*0.65, rz:r0*0.65}, {p:T, b:fb, rx:0.3, rz:0.3}], {seg:R(8), sub:Sb(6), up:[0, 1, 0], c:C_BONE, cap1:true, capLen:1});
      KSK.cone(G, W.Wr, M.vsub(W.Th, W.Wr), 14, 1.8, 0.4, wb, C_HORN, q*0.8, [0, 1, 0]);
      const segs = [[hb, W.Sh, W.El], [eb, W.El, W.Wr], [f1, W.Wr, W.T1], [f2, W.Wr, W.T2], [f3, W.Wr, W.T3], [BI.chest, [s*9, 4, 12], [s*9, 1, -6]], [BI.root, [s*9, 0, -6], [s*8, -3, -24]]];
      const vtx = (p, u, v) => { const w = weights(p, segs); return {p, si:w.si, sw:w.sw, u, v}; };
      // the inner membrane: from the arm (shoulder - elbow - wrist) back to the flank, the thigh and the third finger's tip
      const lead = a => a < 0.4 ? M.vlerp(W.Sh, W.El, a/0.4) : M.vlerp(W.El, W.Wr, (a - 0.4)/0.6);
      const trail = a => a < 0.45 ? M.vlerp([s*8.5, 1, 4], [s*8.5, -3, -22], a/0.45) : M.vlerp([s*8.5, -3, -22], W.T3, (a - 0.45)/0.55);
      const NA = Math.max(6, Math.round(22*q)), NBb = Math.max(3, Math.round(9*q));
      KSK.sheet(G, NA, NBb, (i, j) => { const a = i/NA, b = j/NBb, L = lead(a), T = trail(a), sag = Math.sin(PI*b)*Math.sin(PI*Math.min(1, a*1.2))*3.5;
        return vtx(M.vadd(M.vlerp(L, T, b), [0, -sag, 0]), a*80, b*60); }, C_MEMB);
      // between the fingers: fans from the wrist, the trailing edge scalloped (inward between the tips)
      for (const [Ta, Tb, ba, bb] of [[W.T3, W.T2, f3, f2], [W.T2, W.T1, f2, f1]]){
        const NI = Math.max(5, Math.round(18*q)), NJ = Math.max(3, Math.round(7*q));
        KSK.sheet(G, NI, NJ, (i, j) => { const a = i/NI, b = j/NJ, rad = a*(1 - 0.22*Math.sin(PI*b)), P = M.vadd(W.Wr, M.vsc(M.vlerp(M.vsub(Ta, W.Wr), M.vsub(Tb, W.Wr), b), rad)), sag = Math.sin(PI*b)*Math.sin(PI*a)*2.5;
          return vtx(M.vadd(P, [0, -sag, 0]), a*60, b*50 + 80); }, C_MEMB);
      }
    }
    // ---- legs: thigh, shin, the long foot, four toes with talons
    for (const L of LEGS){
      const s = L.s;
      H.loft(G, [{p:M.vadd(L.Hp, [0, 3, 0]), b:L.b[0], rx:7, rz:7.5}, {p:M.vlerp(L.Hp, L.Kn, 0.5), b:L.b[0], rx:6, rz:6.6}, {p:L.Kn, b:L.b[1], rx:4.6, rz:4.8}, {p:M.vlerp(L.Kn, L.An, 0.5), b:L.b[1], rx:3.6, rz:3.6},
        {p:L.An, b:L.b[2], rx:2.8, rz:2.8}, {p:L.Ft, b:L.b[3], rx:2.4, rz:2.2}], {seg:R(14), sub:Sb(5), up:[0, 0, 1], c:C_SCALE, under:[0, 0, 1], cap0:true, capLen:0.4});
      for (const [ax, len] of [[-0.35, 8], [0, 9.5], [0.35, 8], [Math.PI, 5.5]]){
        const d = [Math.sin(ax)*s, -0.35, Math.cos(ax)], root = M.vadd(L.Ft, [0, -0.5, 0]), end = M.vadd(root, M.vsc(d, len));
        H.loft(G, [{p:root, b:L.b[3], rx:1.5, rz:1.3}, {p:end, b:L.b[3], rx:1, rz:0.9}], {seg:R(6), sub:1, up:[0, 1, 0], c:C_SCALE});
        KSK.cone(G, end, [d[0], -0.6, d[2]], 5, 0.95, 0.45, L.b[3], C_HORN, q*0.7, [0, 1, 0]);
      }
    }
    return G;
  }
  const PI = Math.PI;
  const BODY = `
float kMott = ksN(vKr * 0.05) * 0.6 + ksN(vKr * 0.16) * 0.4;
if (kC < 0.5 || (kC > 5.5 && kC < 6.5)){
  // overlapping scales with a metallic sheen: iron blue-black above, bronze belly plates below
  vec4 c = ksCell(vec2(vKu.x, vKu.y * 1.4), 1.4); float fd = 1.0 - smoothstep(0.1, 0.4, kFw / 1.4);
  kCol = mix(vec3(0.05, 0.06, 0.085), vec3(0.11, 0.12, 0.16), kMott) * mix(1.0, 0.75 + 0.4 * c.x, fd);
  float bel = smoothstep(0.4, 0.75, kU), pl = fract(vKu.y / 2.6);
  kCol = mix(kCol, vec3(0.36, 0.25, 0.13) * (0.82 + 0.18 * smoothstep(0.0, 0.2, pl)), bel);
  kH = mix(c.x * 0.6, smoothstep(0.0, 0.2, pl) * 0.5, bel) * fd; kSpec = mix(0.9, 0.5, bel); kIri = vec3(0.05, 0.08, 0.16);
} else if (kC < 1.5){
  vec4 c = ksCell(vKu, 0.8); float fd = 1.0 - smoothstep(0.1, 0.4, kFw / 0.8);
  kCol = mix(vec3(0.045, 0.05, 0.07), vec3(0.1, 0.1, 0.13), kMott) * mix(1.0, 0.75 + 0.4 * c.x, fd);
  kCol = mix(kCol, vec3(0.32, 0.23, 0.13), smoothstep(0.45, 0.8, kU)); kH = c.x * 0.5 * fd; kSpec = 0.8; kIri = vec3(0.04, 0.06, 0.12);
} else if (kC < 2.5){
  // membrane: wine-dark, pale veins fanning out, thinner (lighter, warmer) towards the trailing edge; the back a little duller
  float vn = abs(fract(vKu.x / 9.0 + 0.2 * sin(vKu.y * 0.09)) - 0.5), vein = 1.0 - smoothstep(0.0, 0.06, vn);
  float edge = smoothstep(30.0, 60.0, mod(vKu.y, 80.0));
  kCol = mix(vec3(0.2, 0.06, 0.06), vec3(0.34, 0.12, 0.08), edge * 0.6 + 0.3 * kMott) * (1.0 - 0.3 * vein) * (kU > 0.5 ? 0.82 : 1.0);
  kCol = mix(kCol, vec3(0.42, 0.33, 0.28), vein * 0.35);
  kH = vein * 0.5 + 0.15 * ksN(vec3(vKu * 0.4, 2.0)); kSpec = 0.35; kIri = vec3(0.3, 0.06, 0.03) * 0.6;
} else if (kC < 3.5){
  float r = fract(vKu.y / 2.5); kCol = mix(vec3(0.62, 0.58, 0.5), vec3(0.8, 0.76, 0.66), smoothstep(0.0, 0.5, r)) * (0.85 + 0.15 * ksN(vKr * 1.3));
  kCol = mix(kCol, vec3(0.12, 0.1, 0.09), smoothstep(0.75, 1.0, vKu.y / 18.0)); kH = r * 0.3; kSpec = 1.1;
} else if (kC < 4.5){
  float ir = smoothstep(0.35, 0.85, kU), slit = (1.0 - smoothstep(0.06, 0.12, abs(vKu.x))) * smoothstep(0.55, 0.8, kU);
  kCol = mix(vec3(0.03, 0.05, 0.07), vec3(0.45, 0.8, 0.95), ir) * (1.0 - slit);
  kEm = vec3(0.45, 0.9, 1.0) * ir * (1.0 - 0.95 * slit) * uEye * (0.85 + 0.15 * sin(uKT * 1.7));
  kSpec = 2.2; kBump = 0.0; kRimK = 0.0;
} else if (kC < 5.5){
  kCol = vec3(0.86, 0.82, 0.72); kSpec = 1.2; kBump = 0.0;
} else {
  kCol = vec3(0.3, 0.1, 0.1) * (0.8 + 0.3 * ksN(vKr * 0.8)); kSpec = 0.9;
}`;
  // ---- the ground shadow (one quad, an analytic soft silhouette: body + wings + tail; fades with the altitude)
  function mkShadow(){
    const g = new THREE.PlaneGeometry(1, 1); g.rotateX(-PI/2);
    const m = new THREE.ShaderMaterial({uniforms:{uA:{value:0.3}, uSoft:{value:0.1}, uSpread:{value:1}}, transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-4, polygonOffsetUnits:-4,
      vertexShader:'varying vec2 vU; void main(){ vU = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader:`uniform float uA; uniform float uSoft; uniform float uSpread; varying vec2 vU;
float sd(vec2 p){
  // x across the span (-0.5 .. 0.5 = the wing tips), y along the body (+ forward): wings swept a little back, scalloped behind
  vec2 q = vec2(abs(p.x), p.y); float w = q.x / max(0.02, 0.5 * uSpread);
  float lead = 0.06 - 0.12 * w, trail = -0.03 - 0.2 * w + 0.03 * sin(w * 9.42);
  float wing = max(max(q.y - lead, trail - q.y), w - 1.0) * 0.5;
  float body = length(vec2(q.x / 0.05, (p.y - 0.02) / 0.2)) - 1.0; body *= 0.05;
  float tail = max(abs(q.x) - 0.012 * (1.0 + (p.y + 0.18) * 4.0), max(-0.42 - p.y, p.y + 0.15));
  return min(min(wing, body), tail);
}
void main(){ float d = sd(vU); float a = uA * (1.0 - smoothstep(-uSoft, uSoft, d)); if (a < 0.004) discard; gl_FragColor = vec4(0.0, 0.0, 0.0, a); }`});
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 3; mesh.visible = false; mesh.name = 'kaiju_wyvern_shadow'; return mesh;
  }
  const _sd = new THREE.Vector3();
  let built = null;
  function get(){
    if (built) return built;
    const mat = KSK.material('wyvern', BODY, {spec:0x6a7088, shin:56, side:THREE.FrontSide});
    built = KSK.skinned('wyvern', BN, build, mat, {c:[0, 0, -10], r:170, box:[[-160, -80, -150], [160, 90, 120]]});
    const sh = mkShadow(); built.shadow = sh; if (typeof scene !== 'undefined') scene.add(sh);
    built.place = (O, P) => {
      // the sun's direction (towards the sun), the ground below along it, the silhouette turned with the heading, the bank, the spread
      let sx = 0.3, sy = 0.9, sz = 0.3; try { if (typeof sun !== 'undefined'){ _sd.copy(sun.position); if (sun.target) _sd.sub(sun.target.position); _sd.normalize(); sx = _sd.x; sy = _sd.y; sz = _sd.z; } } catch (e){ /* */ }
      const W = O.W, wx = W.x, wy = W.y, wz = W.z; let gz = 0; try { gz = KW.isWater(wx, wy) ? 0.2 : KW.ground(wx, wy) + 0.6; } catch (e){ /* */ }
      const alt = wz - gz, fm = P ? +P.fm || 0 : 0;
      if (sy < 0.15 || alt < 25 || fm > 0.6){ sh.visible = false; return; }
      const k = alt/sy, px = wx - sx*k, pz = -wy - sz*k;   // three: (x, h, -y)
      sh.position.set(px, gz, pz); sh.rotation.set(0, W.a, 0);
      const spread = Math.max(0.25, 1 - 0.55*(+P.w || 0) - 0.7*fm), span = 262*Math.abs(Math.cos(+P.bk || 0))*spread + 30;
      sh.scale.set(span/Math.max(0.25, spread), 1, 250);
      const u = sh.material.uniforms; u.uSpread.value = spread; u.uSoft.value = 0.012 + Math.min(0.08, alt/7000); u.uA.value = 0.42*Math.min(1, (alt - 25)/60)*Math.max(0.12, 1 - alt/900)*(1 - 0.6*(typeof nightF !== 'undefined' ? nightF : 0));
      sh.visible = true;
    };
    built.hide = () => { sh.visible = false; };
    return built;
  }
  return {get, build, BODY};
})();

// ---- 26_spfx.js ----
/* ================= more creatures (v30): each species' own sounds and presentation =================
   Sounds are synthesised here on window.SGAudio's context and its 'fx' bus (as KFX does: nothing when sound is off), delayed and
   damped by distance, panned: the kraken's wet bellow, the crab's hissing, clicking screech and claw snaps, the serpent's long
   hiss and moan and the sliding rumble of its body, the shoggoth's piping "Tekeli-li! Tekeli-li!" and its bubbling; footfalls of
   arms and legs. P[id] holds the presentation per species: footfall and strike-impact effects, messages, warnings, the caught
   camera's distance, water dripping from it, and a per-frame hook for its own effects (ink, foam, wake, slime). */
const KSX = (() => {
  const PI = Math.PI, TAU = PI*2, rnd = (a, b) => a + Math.random()*(b - a);
  // ---- audio plumbing (the sound module's live engine)
  function au(){ try { const A = window.SGAudio, E = A && A._test && A._test.LIVE; if (!A || !A.on || !E || !E.ctx || E.ctx.state !== 'running') return null; return E; } catch (e){ return null; } }
  const camPos = () => { try { return camera.position; } catch (e){ return {x:0, y:0, z:0}; } };
  function dist(x, y, z){ const c = camPos(); return Math.hypot(c.x - x, c.y - (z || 0), -c.z - y); }
  function panOf(x, y){ try { const c = camera.position, v = new THREE.Vector3(x - c.x, 0, -y - c.z), r = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); return v.normalize().dot(r.setY(0).normalize()); } catch (e){ return 0; } }
  function out(E, d, pan){ const c = E.ctx, g = c.createGain(), dst = (E.bus && (E.bus.fx || E.bus.f1)) || E.out; g.gain.value = 1; let n = g;
    if (c.createStereoPanner && pan !== undefined){ const p = c.createStereoPanner(); p.pan.value = Math.max(-0.8, Math.min(0.8, pan)); g.connect(p); n = p; }
    n.connect(dst); if (E.rvIn && d > 300){ const s = c.createGain(); s.gain.value = Math.min(0.8, d/2500); g.connect(s); s.connect(E.rvIn); } return g; }
  const NB = {ctx:null, b:null};
  function noise(c){ if (NB.ctx === c && NB.b) return NB.b; const n = Math.floor(c.sampleRate*3), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random()*2 - 1; NB.ctx = c; NB.b = b; return b; }
  function src(c, t0, dur, loop){ const s = c.createBufferSource(); s.buffer = noise(c); s.loop = true; s.loopStart = Math.random()*2; s.start(t0, Math.random()*2); if (!loop) s.stop(t0 + dur + 0.1); return s; }
  const filt = (c, type, f, Q) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; if (Q !== undefined) b.Q.value = Q; return b; };
  function osc(c, type, f, t0, dur){ const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t0); o.start(t0); o.stop(t0 + dur + 0.1); return o; }
  function env(g, t0, a, peak, hold, rel){ g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + a); g.gain.setValueAtTime(Math.max(0.0002, peak), t0 + a + hold); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + hold + rel); }
  // set up a voice at a place: returns {c, t0, g (the voice gain, into the output), att} or null
  function voice(x, y, z, k, reach){
    const E = au(); if (!E) return null; const c = E.ctx, d = dist(x, y, z), att = Math.min(1, (reach || 1.5)/(1 + d/700))*(k || 1); if (att < 0.02) return null;
    const g = c.createGain(); g.connect(out(E, d, panOf(x, y))); return {c, t0:c.currentTime + Math.min(6, d/343), g, att, d};
  }
  // ---- roars
  const ROAR = {
    // a wet bellow: detuned saws under a sweeping resonant filter, a sub, and bubbling gurgles
    kraken(x, y, z, k){ const V = voice(x, y, z, k); if (!V) return; const {c, t0, g, att, d} = V, dur = 4.8;
      env(g, t0, 0.6, 0.55*att, dur - 2.4, 1.8);
      const lp = filt(c, 'lowpass', 300, 4); lp.frequency.setValueAtTime(300, t0); lp.frequency.linearRampToValueAtTime(950, t0 + 1.4); lp.frequency.linearRampToValueAtTime(240, t0 + dur); lp.connect(g);
      for (const [f, ty, gn] of [[41, 'sawtooth', 0.8], [41.7, 'sawtooth', 0.6], [62, 'square', 0.18]]){ const o = osc(c, ty, f*1.25, t0, dur), og = c.createGain(); o.frequency.exponentialRampToValueAtTime(f, t0 + 0.9); o.frequency.exponentialRampToValueAtTime(f*0.8, t0 + dur); og.gain.value = gn; o.connect(og); og.connect(lp); }
      const sub = osc(c, 'sine', 27, t0, dur), sg = c.createGain(); sub.frequency.exponentialRampToValueAtTime(20, t0 + dur); sg.gain.value = 0.9; sub.connect(sg); sg.connect(g);
      const n = src(c, t0, dur), bp = filt(c, 'bandpass', 700, 2.2), am = c.createGain(), lfo = osc(c, 'square', 9, t0, dur), lg = c.createGain();
      lfo.frequency.linearRampToValueAtTime(14, t0 + dur*0.6); lfo.frequency.linearRampToValueAtTime(7, t0 + dur); lg.gain.value = 0.4; am.gain.value = 0.45; lfo.connect(lg); lg.connect(am.gain);
      n.connect(bp); bp.connect(am); am.connect(g); void d; },
    // a hissing, clicking screech with a grinding growl under it
    crab(x, y, z, k){ const V = voice(x, y, z, k); if (!V) return; const {c, t0, g, att} = V, dur = 3.4;
      env(g, t0, 0.15, 0.5*att, dur - 1.2, 1.0);
      const n = src(c, t0, dur), hp = filt(c, 'highpass', 1800), bp = filt(c, 'bandpass', 3200, 0.8), hg = c.createGain(); hg.gain.value = 0.55; n.connect(hp); hp.connect(bp); bp.connect(hg); hg.connect(g);
      const n2 = src(c, t0, dur), cb = filt(c, 'bandpass', 1400, 6), cg = c.createGain(), clk = osc(c, 'square', 24, t0, dur), ck = c.createGain(); cg.gain.value = 0.5; ck.gain.value = 0.5; clk.frequency.linearRampToValueAtTime(31, t0 + dur); clk.connect(ck); ck.connect(cg.gain); n2.connect(cb); cb.connect(cg); cg.connect(g);
      const gr = osc(c, 'sawtooth', 62, t0, dur), gb = filt(c, 'bandpass', 420, 5), gg = c.createGain(), tr = osc(c, 'sine', 15, t0, dur), tg = c.createGain(); gg.gain.value = 0.5; tg.gain.value = 0.3; tr.connect(tg); tg.connect(gg.gain); gr.connect(gb); gb.connect(gg); gg.connect(g);
      const sc = osc(c, 'sawtooth', 920, t0, dur), sb = filt(c, 'bandpass', 1150, 8), sgn = c.createGain(), vb = osc(c, 'sine', 7, t0, dur), vg = c.createGain(); sc.frequency.linearRampToValueAtTime(700, t0 + dur); vg.gain.value = 25; vb.connect(vg); vg.connect(sc.frequency); sgn.gain.value = 0.12; sc.connect(sb); sb.connect(sgn); sgn.connect(g); },
    // a long hiss and a deep, resonant moan in fifths
    serpent(x, y, z, k){ const V = voice(x, y, z, k); if (!V) return; const {c, t0, g, att} = V, dur = 5.2;
      env(g, t0, 0.8, 0.5*att, dur - 2.6, 1.8);
      const n = src(c, t0, dur), hp = filt(c, 'highpass', 2600), hg = c.createGain(); hg.gain.setValueAtTime(0.0001, t0); hg.gain.exponentialRampToValueAtTime(0.45, t0 + 0.4); hg.gain.exponentialRampToValueAtTime(0.05, t0 + dur); n.connect(hp); hp.connect(hg); hg.connect(g);
      const lp = filt(c, 'lowpass', 650); lp.connect(g);
      const vib = osc(c, 'sine', 4.5, t0, dur), vg = c.createGain(); vg.gain.value = 2;
      for (const [f, gn] of [[74, 0.8], [111, 0.45]]){ const o = osc(c, 'sine', f, t0, dur), og = c.createGain(); o.frequency.exponentialRampToValueAtTime(f*0.7, t0 + dur); vib.connect(vg); vg.connect(o.frequency); og.gain.value = gn; o.connect(og); og.connect(lp); }
      const th = osc(c, 'sawtooth', 148, t0, dur), fb = filt(c, 'bandpass', 520, 6), tg = c.createGain(); th.frequency.exponentialRampToValueAtTime(104, t0 + dur); fb.frequency.linearRampToValueAtTime(330, t0 + dur); tg.gain.value = 0.35; th.connect(fb); fb.connect(tg); tg.connect(g); },
    // "Tekeli-li! Tekeli-li!" - a hideous piping (two phrases and a far echo) over a bubbling rumble
    shoggoth(x, y, z, k){ const V = voice(x, y, z, k, 1.8); if (!V) return; const {c, t0, g, att} = V;
      g.gain.value = 0.6*att;
      const SY = [[1180, 0.13, 't'], [1050, 0.12, 'k'], [1420, 0.2, 'l'], [1330, 0.34, 'l']];
      const phrase = (ts, tr, gain) => { let tt = ts; for (const [f0, du, cons] of SY){ const f = f0*tr;
        const vg = c.createGain(); vg.gain.setValueAtTime(0.0001, tt); vg.gain.exponentialRampToValueAtTime(gain, tt + 0.025); vg.gain.setValueAtTime(gain, tt + du - 0.05); vg.gain.exponentialRampToValueAtTime(0.0001, tt + du + 0.06); vg.connect(g);
        const o1 = osc(c, 'sine', cons === 'l' ? f*0.92 : f, tt, du + 0.1), o2 = osc(c, 'triangle', f*2.01, tt, du + 0.1), g2 = c.createGain(); if (cons === 'l') o1.frequency.linearRampToValueAtTime(f, tt + 0.04);
        const vib = osc(c, 'sine', 6.5, tt, du + 0.1), vgn = c.createGain(); vgn.gain.value = f*0.012; vib.connect(vgn); vgn.connect(o1.frequency); g2.gain.value = 0.22; o1.connect(vg); o2.connect(g2); g2.connect(vg);
        const nb = src(c, tt, du + 0.1), bf = filt(c, 'bandpass', f, 10), bg = c.createGain(); bg.gain.value = 0.5; nb.connect(bf); bf.connect(bg); bg.connect(vg);
        if (cons !== 'l'){ const nc = src(c, tt, 0.05), cf = filt(c, 'bandpass', cons === 't' ? 3200 : 2200, 3), cgn = c.createGain(); cgn.gain.setValueAtTime(gain*1.4, tt); cgn.gain.exponentialRampToValueAtTime(0.0001, tt + 0.03); nc.connect(cf); cf.connect(cgn); cgn.connect(g); }
        tt += du + 0.05; } };
      phrase(t0 + 0.2, 1, 0.5); phrase(t0 + 1.45, 0.94, 0.55); phrase(t0 + 2.9, 0.9, 0.18);
      const n = src(c, t0, 3.8), lp = filt(c, 'lowpass', 220), rg = c.createGain(), lfo = osc(c, 'sine', 7, t0, 3.8), lg = c.createGain(); rg.gain.value = 0.35; lg.gain.value = 0.3; lfo.connect(lg); lg.connect(rg.gain); n.connect(lp); lp.connect(rg); rg.connect(g);
      rg.gain.setValueAtTime(0.35, t0 + 3.2); rg.gain.linearRampToValueAtTime(0.0001, t0 + 3.8); },
    // v31 - the titan lizard: a gaping hiss, then a crocodilian bellow - an infrasonic rumble pulsing ~9 times a second, a growling
    // purr over it, the throat pouch's boom
    reptile(x, y, z, k){ const V = voice(x, y, z, k, 1.7); if (!V) return; const {c, t0, g, att} = V, dur = 4.6;
      env(g, t0, 0.25, 0.6*att, dur - 1.8, 1.5);
      const n = src(c, t0, 1.4), hp = filt(c, 'highpass', 2200), hg = c.createGain(); hg.gain.setValueAtTime(0.0001, t0); hg.gain.exponentialRampToValueAtTime(0.5, t0 + 0.15); hg.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.3); n.connect(hp); hp.connect(hg); hg.connect(g);
      const t1 = t0 + 0.9, sub = osc(c, 'sine', 31, t1, dur - 0.9), sg = c.createGain(), am = osc(c, 'sine', 9, t1, dur - 0.9), ag = c.createGain(); sub.frequency.exponentialRampToValueAtTime(23, t1 + dur - 1); sg.gain.value = 0.55; ag.gain.value = 0.45; am.connect(ag); ag.connect(sg.gain); sub.connect(sg); sg.connect(g);
      const gr = osc(c, 'sawtooth', 58, t1, dur - 0.9), lp = filt(c, 'lowpass', 260, 3), gg = c.createGain(), tr = osc(c, 'square', 17, t1, dur - 0.9), tg = c.createGain(); gr.frequency.linearRampToValueAtTime(46, t1 + dur - 1); gg.gain.value = 0.35; tg.gain.value = 0.3; tr.connect(tg); tg.connect(gg.gain); gr.connect(lp); lp.connect(gg); gg.connect(g);
      const bm = osc(c, 'sine', 64, t1 + 0.25, 0.7), bg = c.createGain(); bm.frequency.exponentialRampToValueAtTime(34, t1 + 0.9); bg.gain.setValueAtTime(0.0001, t1 + 0.25); bg.gain.exponentialRampToValueAtTime(0.7, t1 + 0.3); bg.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.95); bm.connect(bg); bg.connect(g); },
    // v31 - the wyvern: a raking screech falling in pitch (a hoarse formant, vibrato, a noisy edge) over a growl
    wyvern(x, y, z, k){ const V = voice(x, y, z, k, 2.0); if (!V) return; const {c, t0, g, att} = V, dur = 2.9;
      env(g, t0, 0.06, 0.55*att, dur - 1.1, 0.95);
      const vib = osc(c, 'sine', 11, t0, dur), vg = c.createGain(); vg.gain.value = 26; vib.connect(vg);
      for (const [f, ty, gn, Q] of [[880, 'sawtooth', 0.35, 4], [1310, 'square', 0.12, 6], [440, 'sawtooth', 0.2, 3]]){ const o = osc(c, ty, f*1.12, t0, dur), bp = filt(c, 'bandpass', f*1.4, Q), og = c.createGain();
        o.frequency.exponentialRampToValueAtTime(f, t0 + 0.25); o.frequency.exponentialRampToValueAtTime(f*0.62, t0 + dur); vg.connect(o.frequency); og.gain.value = gn; o.connect(bp); bp.connect(og); og.connect(g); }
      const n = src(c, t0, dur), nb = filt(c, 'bandpass', 2600, 1.2), ng = c.createGain(); ng.gain.setValueAtTime(0.25, t0); ng.gain.exponentialRampToValueAtTime(0.03, t0 + dur); n.connect(nb); nb.connect(ng); ng.connect(g);
      const gr = osc(c, 'sawtooth', 70, t0, dur), gl = filt(c, 'lowpass', 300, 2), gg = c.createGain(); gr.frequency.linearRampToValueAtTime(52, t0 + dur); gg.gain.value = 0.3; gr.connect(gl); gl.connect(gg); gg.connect(g); }
  };
  // ---- footfalls and impacts
  const STEP = {
    kraken(x, y, z, k){ const V = voice(x, y, z, k, 1.1); if (!V) return; const {c, t0, g, att} = V; env(g, t0, 0.01, 0.7*att, 0.05, 0.9);
      const n = src(c, t0, 0.3), bp = filt(c, 'bandpass', 850, 0.8), ng = c.createGain(); ng.gain.setValueAtTime(0.6, t0); ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25); n.connect(bp); bp.connect(ng); ng.connect(g);
      const o = osc(c, 'sine', 55, t0, 0.8); o.frequency.exponentialRampToValueAtTime(28, t0 + 0.6); o.connect(g); },
    crab(x, y, z, k){ const V = voice(x, y, z, k, 1.0); if (!V) return; const {c, t0, g, att} = V; env(g, t0, 0.005, 0.6*att, 0.02, 0.4);
      const n = src(c, t0, 0.06), bp = filt(c, 'bandpass', 1800, 4), ng = c.createGain(); ng.gain.setValueAtTime(0.9, t0); ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.04); n.connect(bp); bp.connect(ng); ng.connect(g);
      const o = osc(c, 'sine', 72, t0, 0.4); o.frequency.exponentialRampToValueAtTime(40, t0 + 0.3); o.connect(g); },
    // v31: a heavy, soft-padded thud with the scrape of the claws
    reptile(x, y, z, k){ const V = voice(x, y, z, k, 1.2); if (!V) return; const {c, t0, g, att} = V; env(g, t0, 0.012, 0.75*att, 0.06, 0.8);
      const o = osc(c, 'sine', 50, t0, 0.8); o.frequency.exponentialRampToValueAtTime(25, t0 + 0.6); o.connect(g);
      const n = src(c, t0 + 0.05, 0.35), bp = filt(c, 'bandpass', 2400, 2.5), ng = c.createGain(); ng.gain.setValueAtTime(0.0001, t0 + 0.05); ng.gain.exponentialRampToValueAtTime(0.35, t0 + 0.09); ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4); n.connect(bp); bp.connect(ng); ng.connect(g); }
  };
  // v31: a wing beat - a deep 'whump' of air (the downstroke), louder the harder it beats
  function beat(x, y, z, k){ const V = voice(x, y, z, k, 1.3); if (!V) return; const {c, t0, g, att} = V; env(g, t0, 0.05, 0.6*att, 0.08, 0.5);
    const n = src(c, t0, 0.7), lp = filt(c, 'lowpass', 190, 1.5), ng = c.createGain(); ng.gain.value = 1; n.connect(lp); lp.connect(ng); ng.connect(g);
    const o = osc(c, 'sine', 46, t0, 0.6), og = c.createGain(); o.frequency.exponentialRampToValueAtTime(30, t0 + 0.5); og.gain.value = 0.6; o.connect(og); og.connect(g); }
  function snap(x, y, z, k){ const V = voice(x, y, z, k, 1.4); if (!V) return; const {c, t0, g, att} = V; env(g, t0, 0.003, 0.9*att, 0.01, 0.35);
    const n = src(c, t0, 0.06), hp = filt(c, 'highpass', 1200), ng = c.createGain(); ng.gain.setValueAtTime(1, t0); ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.035); n.connect(hp); hp.connect(ng); ng.connect(g);
    const o = osc(c, 'triangle', 640, t0, 0.3), og = c.createGain(); og.gain.setValueAtTime(0.4, t0); og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25); o.connect(og); og.connect(g); }
  function bubble(x, y, z, k){ const V = voice(x, y, z, k, 0.8); if (!V) return; const {c, t0, g, att} = V; env(g, t0, 0.004, 0.35*att, 0.02, 0.09);
    const f = rnd(140, 420), o = osc(c, 'sine', f, t0, 0.15); o.frequency.exponentialRampToValueAtTime(f*rnd(2.2, 3.5), t0 + 0.08); o.connect(g); }
  // ---- continuous voices: the serpent's sliding rumble, the shoggoth's bubbling (one each; level follows the creature)
  const LOOP = {v:null, sp:null};
  // [lowpass, bandpass, lfo Hz, bandpass Q, lfo depth]: the serpent's sliding rumble, the shoggoth's bubbling, v31 the wyvern's wind roar
  const LOOPS = {serpent:[380, 160, 2.2, 1.2, 0.35], shoggoth:[240, 90, 6.5, 1.2, 0.35], wyvern:[1100, 420, 0.35, 0.6, 0.25]};
  function loop(sp, x, y, z, level){
    const E = au();
    if (!E || !sp){ stopLoop(); return; }
    if (LOOP.v && (LOOP.sp !== sp || LOOP.v.c !== E.ctx)) stopLoop();
    const c = E.ctx;
    if (!LOOP.v){
      const g = c.createGain(); g.gain.value = 0.0001; const o = out(E, 500, 0); g.connect(o);
      const L = LOOPS[sp] || LOOPS.shoggoth, n = src(c, c.currentTime, 0, true), lp = filt(c, 'lowpass', L[0]), bp = filt(c, 'bandpass', L[1], L[3]), am = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = L[2]; lg.gain.value = L[4]; am.gain.value = 0.6; lfo.connect(lg); lg.connect(am.gain); lfo.start();
      n.connect(lp); lp.connect(bp); bp.connect(am); am.connect(g);
      LOOP.v = {c, g, n, lfo, o}; LOOP.sp = sp;
    }
    const d = dist(x, y, z), att = Math.min(1, 1.3/(1 + d/650));
    LOOP.v.g.gain.setTargetAtTime(Math.max(0.0001, level*att*0.6), c.currentTime, 0.3);
  }
  function stopLoop(){ if (!LOOP.v) return; try { const v = LOOP.v, t = v.c.currentTime; v.g.gain.setTargetAtTime(0.0001, t, 0.4); v.n.stop(t + 2); v.lfo.stop(t + 2); } catch (e){ /* */ } LOOP.v = null; LOOP.sp = null; }

  // ---------------- presentation per species ----------------
  const water = (x, y) => { try { return KW.isWater(x, y); } catch (e){ return false; } };
  const gnd = (x, y) => { try { return KW.ground(x, y); } catch (e){ return 0; } };
  const P = {
    cthulhu:{foot:{r:40, k:1, shake:2.6, se:0.55, sR:170, toss:45}, hits:{1:{r:55, boom:1}, 2:{r:55, boom:1}, 5:{r:30}, 9:{r:42, boom:1}}, camD:175, roarMsg:'克苏鲁苏醒了 · CTHULHU HAS RISEN',
      warn:{1:'触手来袭！ · TENTACLE INCOMING!', 2:'触手来袭！ · TENTACLE INCOMING!', 5:'触手来袭！ · TENTACLE INCOMING!', 9:'它要踩下来了！快开走！ · STOMP — DRIVE!'}},
    kraken:{foot:{r:20, k:0.55, shake:0.9, se:0.28, sR:120, toss:45}, hits:{1:{r:60, boom:1}, 2:{r:60, boom:1}, 3:{r:55, boom:1}, 5:{r:30}}, camD:150, roarMsg:'北海巨妖浮出水面 · THE KRAKEN HAS RISEN',
      warn:{1:'巨腕砸下！ · AN ARM IS COMING DOWN!', 2:'巨腕砸下！ · AN ARM IS COMING DOWN!', 3:'它缠住了大楼！ · IT IS WRAPPING A TOWER!', 5:'触手来袭！ · TENTACLE INCOMING!'},
      drip:(O, D) => { const r = Math.random(); if (r < 0.35){ const p = KB.jointW(O, D.BI[['head', 'm1', 'm2', 'm3'][(Math.random()*4) | 0]]); return [p, 30]; }
        const A = D.ARMS[(Math.random()*8) | 0]; return [KB.jointW(O, A.b[1 + ((Math.random()*5) | 0)]), 10]; },
      efx(P, O, dt, G){   // ink murk spreading in the water round it
        const wet = water(P.x, P.y); if (!wet || P.r < 0.2) return;
        G.inkAcc = (G.inkAcc || 0) + dt*(P.r < 1 ? 6 : 1.2 + 0.12*P.v);
        while (G.inkAcc > 1){ G.inkAcc--; const a = Math.random()*TAU, rr = rnd(40, 160), x = P.x + Math.cos(a)*rr, y = P.y + Math.sin(a)*rr; if (!water(x, y)) continue;
          KFX.dust(x, y, 0.5, Math.cos(a)*rnd(1, 4), Math.sin(a)*rnd(1, 4), 0.05, 30, rnd(110, 200), rnd(25, 45), [0.02, 0.02, 0.035], 0.75, 0); } }},
    crab:{foot:{r:16, k:0.45, shake:0.7, se:0.2, sR:100, toss:40}, hits:{1:{r:30, snap:1}, 2:{r:30, snap:1}, 3:{r:55, boom:1}, 5:{r:26, snap:1}}, camD:140, roarMsg:'铁甲巨蟹登陆了 · THE IRONCLAD CRAB HAS LANDED',
      warn:{1:'巨钳来袭！ · CLAW INCOMING!', 2:'巨钳来袭！ · CLAW INCOMING!', 3:'蟹腿刺下！ · LEGS STABBING DOWN!', 4:'巨钳横扫！ · CLAW SWEEP!', 5:'巨钳来袭！ · CLAW INCOMING!'},
      drip:(O, D) => { const r = Math.random(); if (r < 0.5){ const a = Math.random()*TAU; return [KB.ptW(O, D.BI.cara, [Math.sin(a)*60, -4, Math.cos(a)*45]), 6]; } return [O.hands[(Math.random()*2) | 0], 14]; },
      efx(P, O, dt, G){   // foam frothing from the mouthparts; spray where its legs churn the water
        const k = P.k === 6 ? 6 : P.k === 7 ? 4 : 0.8; G.foamAcc = (G.foamAcc || 0) + dt*k;
        while (G.foamAcc > 1){ G.foamAcc--; const m = O.mouth; KFX.dust(m[0] + rnd(-6, 6), m[1] + rnd(-6, 6), m[2] + rnd(-4, 2), rnd(-2, 2), rnd(-2, 2), rnd(-4, -1), 5, rnd(14, 26), rnd(3, 6), [0.95, 0.95, 0.9], 0.85, -1.5); }
        if (P.v > 3 && P.r > 0.4){ G.sprAcc = (G.sprAcc || 0) + dt*P.v*0.25;
          while (G.sprAcc > 1){ G.sprAcc--; const F = O.feet[(Math.random()*O.feet.length) | 0]; if (!F || !water(F.ankle[0], F.ankle[1])) continue; KFX.dust(F.ankle[0], F.ankle[1], 0.5, rnd(-4, 4), rnd(-4, 4), rnd(5, 12), 6, 30, rnd(3, 5), [0.9, 0.93, 0.96], 0.8, 2); } } }},
    serpent:{foot:null, hits:{1:{r:70, boom:1}, 3:{r:45, boom:1}, 4:{r:50}, 5:{r:30}}, camD:150, roarMsg:'深海巨蛇现身 · THE SEA SERPENT HAS SURFACED',
      warn:{1:'它要砸下来了！ · IT IS REARING TO STRIKE!', 3:'它缠住了大楼！ · IT IS COILING A TOWER!', 4:'尾巴横扫！ · TAIL SWEEP!', 5:'巨口来袭！ · JAWS INCOMING!'},
      drip:(O) => { const J = O.J; return J ? [J[(Math.random()*14) | 0], 14] : null; },
      efx(P, O, dt, G){   // a wake where the back breaks the water, dust along the body on land; the sliding rumble
        const J = O.J; if (!J || P.r < 0.3) return;
        G.wakeAcc = (G.wakeAcc || 0) + dt*(2 + 0.25*P.v);
        while (G.wakeAcc > 1){ G.wakeAcc--; const p = J[(Math.random()*36) | 0];
          if (water(p[0], p[1])){ if (p[2] > -6) KFX.dust(p[0] + rnd(-12, 12), p[1] + rnd(-12, 12), 0.5, rnd(-5, 5), rnd(-5, 5), rnd(4, 10), 8, rnd(35, 60), rnd(3, 6), [0.92, 0.95, 0.97], 0.8, 1.5); }
          else if (P.v > 2) KFX.dust(p[0] + rnd(-15, 15), p[1] + rnd(-15, 15), gnd(p[0], p[1]) + 2, rnd(-4, 4), rnd(-4, 4), rnd(0.5, 2), 10, rnd(30, 55), rnd(8, 14), [0.52, 0.49, 0.44], 0.6, 0.6); }
        loop('serpent', J[8][0], J[8][1], J[8][2], Math.min(1, 0.15 + P.v/25)*(P.r > 0.5 ? 1 : 0)); }},
    shoggoth:{foot:null, hits:{1:{r:55}, 2:{r:55}, 3:{r:60, boom:1}, 5:{r:30}}, camD:200, roarMsg:'修格斯涌了上来 · TEKELI-LI! THE SHOGGOTH HAS RISEN',
      warn:{1:'伪足来袭！ · PSEUDOPOD INCOMING!', 2:'伪足来袭！ · PSEUDOPOD INCOMING!', 3:'它在吞噬大楼！ · IT IS ENGULFING A TOWER!', 5:'伪足来袭！ · PSEUDOPOD INCOMING!'},
      drip:null,
      efx(P, O, dt, G){   // black slime thrown up at its front edge; bubbles popping; the bubbling rumble
        if (P.r < 0.3) return; const B = O.B || {R:100};
        G.slAcc = (G.slAcc || 0) + dt*(1.5 + 0.3*P.v);
        while (G.slAcc > 1){ G.slAcc--; const a = rnd(-1.2, 1.2), p = O.toW([Math.sin(a)*B.R*1.05, 4, Math.cos(a)*B.R*1.1]); const wt = water(p[0], p[1]);
          KFX.dust(p[0], p[1], wt ? 0.5 : gnd(p[0], p[1]) + 2, rnd(-3, 3), rnd(-3, 3), rnd(1, 4), 10, rnd(30, 50), rnd(5, 9), wt ? [0.85, 0.9, 0.92] : [0.03, 0.04, 0.04], 0.7, 0.4); }
        const c = O.chest; G.bubT = (G.bubT || 0) - dt; if (G.bubT <= 0){ G.bubT = rnd(0.08, 0.35); bubble(c[0] + rnd(-80, 80), c[1] + rnd(-80, 80), c[2], 1); }
        loop('shoggoth', c[0], c[1], c[2], P.r > 0.5 ? 0.7 : 0.3); }},
    // v31: the titan lizard - heavy padded footfalls (four feet, a sound every other one), dust where the tail drags, a wake and spray
    // when it swims, water streaming off it
    reptile:{foot:{r:18, k:0.5, shake:0.9, se:0.26, sR:110, toss:40}, hits:{1:{r:26, snap:1}, 2:{r:45, boom:1}, 3:{r:70, boom:1}, 4:{r:40}, 5:{r:26, snap:1}, 9:{r:26, boom:1}}, camD:95, roarMsg:'巨蜥兽爬上了岸 · THE TITAN LIZARD HAS COME ASHORE',
      warn:{1:'巨口来袭！ · JAWS INCOMING!', 2:'它冲过来了！ · IT IS CHARGING!', 3:'它要翻滚压过来！ · IT IS ROLLING OVER!', 4:'尾巴横扫！ · TAIL WHIP!', 5:'巨口来袭！ · JAWS INCOMING!', 9:'它要踩下来了！快开走！ · STOMP — DRIVE!'},
      drip:(O, D) => { const r = Math.random(); if (r < 0.5){ const b = ['root', 'chest', 'loin', 'hip', 'shoulder', 'neck1'][(Math.random()*6) | 0]; return [KB.jointW(O, D.BI[b]), 22]; } const T = O.tail; return T ? [T[(Math.random()*8) | 0], 8] : null; },
      efx(P, O, dt, G){
        const T = O.tail; if (!T || P.r < 0.4) return;
        G.wakeAcc = (G.wakeAcc || 0) + dt*(1 + 0.2*P.v);
        while (G.wakeAcc > 1){ G.wakeAcc--; const j = 6 + ((Math.random()*5) | 0), p = T[j];
          if (water(p[0], p[1])){ if ((P.sw || 0) > 0.3) KFX.dust(p[0] + rnd(-8, 8), p[1] + rnd(-8, 8), 0.5, rnd(-5, 5), rnd(-5, 5), rnd(3, 8), 7, rnd(30, 50), rnd(2.5, 5), [0.92, 0.95, 0.97], 0.8, 1.5); }
          else if (P.v > 1.5 && p[2] - gnd(p[0], p[1]) < 4) KFX.dust(p[0] + rnd(-6, 6), p[1] + rnd(-6, 6), gnd(p[0], p[1]) + 1.5, rnd(-3, 3), rnd(-3, 3), rnd(0.5, 2), 6, rnd(22, 40), rnd(5, 9), [0.52, 0.49, 0.44], 0.55, 0.5); } }},
    // v31: the wyvern - no footfalls (it flies): the beats of its wings (a deep whump each downstroke, dust thrown up from the street
    // when it beats low), a wind roar that grows with its speed and its closeness, spray when it skims the water
    wyvern:{foot:null, hits:{3:{r:45, boom:1}, 4:{r:60}, 5:{r:24}}, camD:85, roarMsg:'飞龙腾空而起 · THE WYVERN TAKES WING',
      warn:{3:'它落在了楼顶！ · IT IS LANDING ON A TOWER!', 4:'翼风来袭！ · WING GUST!', 5:'它俯冲下来了！ · IT IS DIVING AT YOU!', 8:'它扑向飞机！ · IT IS STRIKING AT THE AIRCRAFT!'},
      warnFn:(P, d) => (P.pt || 0) < -0.3 && d < 900 ? '它在俯冲！ · IT IS DIVING!' : '',
      drip:(O) => [O.pelvis, 14],
      efx(P, O, dt, G){
        if (P.r < 0.3) return;
        const ph = P.g || 0, prev = G.wbPh === undefined ? ph : G.wbPh; G.wbPh = ph; const fa = Math.min(1.3, P.fa || 0)*(1 - (P.fm || 0));
        if (fa > 0.15 && ((prev < 0.25 && ph >= 0.25) || (prev > ph && ph >= 0.25))){ const c = O.chest; beat(c[0], c[1], c[2], 0.35 + 0.5*fa);
          const gz = gnd(P.x, P.y), h = P.z - gz;
          if (h < 140) for (let i = 0; i < 10; i++){ const a = Math.random()*TAU, rr = rnd(10, 70), x = P.x + Math.cos(a)*rr, y = P.y + Math.sin(a)*rr, wt = water(x, y), f = 1 - h/140;
            KFX.dust(x, y, wt ? 0.5 : gnd(x, y) + 1.5, Math.cos(a)*rnd(6, 14)*f, Math.sin(a)*rnd(6, 14)*f, rnd(1, 4), 10, rnd(40, 70), rnd(3, 6), wt ? [0.9, 0.93, 0.96] : [0.55, 0.52, 0.47], 0.5*f + 0.15, 0.6); } }
        const c = O.chest, near = Math.min(1, P.v/45)*0.7 + (P.k === 4 ? 0.4 : 0); loop('wyvern', c[0], c[1], c[2], Math.max(0.12, near)); }}
  };
  return {P, ROAR, STEP, snap, bubble, beat, loop, stopLoop, au};
})();

// ---- 30_fx.js ----
/* ================= effects: GPU particle pools (debris chunks, dust / spray clouds, water streaming off the body), eye glows,
   the extraction beacon, synthesised roar / footfalls / sirens =================
   The pools are ring buffers of instance attributes; the motion (ballistic flight, landing, tumbling, settling, drifting, growing,
   fading) is computed in the vertex shader from the spawn values and one time uniform, so the CPU only writes a few slots when
   something spawns (partial uploads) and nothing per frame. Three draw calls; the oldest particles are recycled.
   [lm27/destruct] more for the stronger destruction: a larger dust pool (rolling dust clouds that billow out along the streets, floor
   bursts, smoke columns drifting with the wind), an additive flame pool (fires that flicker and glow at night: lingering fires on
   bitten towers and on rubble, up to 28 emitters with a distance LOD), persistent rubble mounds (one InstancedMesh of broken concrete
   blocks on the footprints and along a toppled tower's fall line; cleared with the city), physics chunks through window.SGPhys
   (tumbling concrete and glass that bounce off streets, roofs, cars and each other) with the GPU debris as the fallback / far LOD.
   All new effects work without a running game (remote destruction, the API): they initialise on first use.
   [lm28/ruin] for the landmark collapses: dustWave() (a ring of dust surging out from a big landing, several blocks wide),
   rumble() (the long roar of a collapse: low rumbling noise with crackles, on the sound module's context); rubble blocks
   (4000) in more shapes (slabs, chunks, lying on the heaps); 36 lingering fires; the noise buffers of the sounds are cached (one per length) instead
   of a new buffer for every footfall / roar (a 10-minute game made thousands of them).
   [lm30/phys2] v33 physics: slab() (broken floor slabs) and beam() (steel sections) through window.SGPhys for the big collapses;
   chunk() takes an optional material; the physics module's dust (heavy pieces trailing dust as they fall, a puff where they land or
   break) is drawn here as rolling dust in their colours (SGPhys.dust is set on first use). */
const KFX = (() => {
  const T = {value:0}, LIGHT = {value:1}, SUNDIR = {value:new THREE.Vector3(0.4, 0.8, 0.3)}, WIND = {value:new THREE.Vector2(1.2, -0.6)};
  let inited = false;
  const P = {};
  function pool(cap, spec){
    const A = {}; for (const k in spec){ const a = new THREE.InstancedBufferAttribute(new Float32Array(cap*spec[k]), spec[k]); a.setUsage(THREE.DynamicDrawUsage); A[k] = a; }
    return {cap, head:0, A, lo:1e9, hi:-1, n:0,
      take(){ const i = this.head; this.head = (this.head + 1) % this.cap; if (i < this.lo) this.lo = i; if (i > this.hi) this.hi = i; this.n++; return i; },
      commit(){ if (this.hi < 0) return; for (const k in this.A){ const a = this.A[k], s = a.itemSize; a.updateRange.offset = this.lo*s; a.updateRange.count = (this.hi - this.lo + 1)*s; a.needsUpdate = true; } this.lo = 1e9; this.hi = -1; }};
  }
  // ---- debris: tumbling chunks in the building's own colours, they land, settle into rubble and sink away after ~50 s
  function mkDebris(){
    const base = new THREE.BoxGeometry(1, 0.7, 0.9), g = new THREE.InstancedBufferGeometry();
    g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('normal', base.attributes.normal);
    const S = pool(2600, {iP:4, iV:4, iX:4, iC:3}); for (const k in S.A) g.setAttribute(k, S.A[k]); g.instanceCount = S.cap;
    for (let i = 0; i < S.cap; i++) S.A.iP.array[i*4 + 3] = -1e6;
    const m = new THREE.MeshLambertMaterial({color:0xffffff});
    m.onBeforeCompile = sh => {
      sh.uniforms.uKT = T;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec4 iP; attribute vec4 iV; attribute vec4 iX; attribute vec3 iC; uniform float uKT; varying vec3 vKc;
mat3 kjRot(vec3 a, float t){ float c = cos(t), s = sin(t), k = 1.0 - c; return mat3(c + a.x*a.x*k, a.y*a.x*k + a.z*s, a.z*a.x*k - a.y*s, a.x*a.y*k - a.z*s, c + a.y*a.y*k, a.z*a.y*k + a.x*s, a.x*a.z*k + a.y*s, a.y*a.z*k - a.x*s, c + a.z*a.z*k); }`)
        .replace('#include <beginnormal_vertex>', `float kt = uKT - iP.w, sz = iV.w, ga = 4.905, gy = iX.x + sz * 0.28;
float kb = iV.y, kc = iP.y - gy, tl = (kb + sqrt(max(kb * kb + 4.0 * ga * kc, 0.0))) / (2.0 * ga), te = clamp(kt, 0.0, tl);
float alive = step(0.0, kt) * step(kt, iX.w + 8.0), sink = clamp((kt - iX.w) / 8.0, 0.0, 1.0);
vec3 kax = normalize(vec3(sin(iX.y * 12.9), cos(iX.y * 7.3), sin(iX.y * 3.1 + 1.0)));
mat3 kR = kjRot(kax, iX.y * (te * 2.2 + 10.0));
vec3 objectNormal = kR * normal;`)
        .replace('#include <begin_vertex>', `vec3 kwp = vec3(iP.x + iV.x * te, iP.y + iV.y * te - ga * te * te, iP.z + iV.z * te); kwp.y -= sink * sz * 0.9;
vec3 ksc = vec3(1.0, 0.55 + 0.6 * fract(iX.z), 0.6 + 0.5 * fract(iX.z * 7.0)) * sz * (1.0 - sink) * alive;
vec3 transformed = kwp + kR * (position * ksc); vKc = iC;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vKc;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vKc;');
    };
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.castShadow = false; mesh.name = 'kaiju_debris';
    return {S, mesh};
  }
  // soft cloud sprite
  function cloudTex(){
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); let a = 7;
    const r = () => { a = (a*16807) % 2147483647; return a/2147483647; };
    for (let i = 0; i < 30; i++){ const px = 64 + (r() - 0.5)*56, py = 64 + (r() - 0.5)*56, rr = 14 + r()*28, gr = x.createRadialGradient(px, py, 0, px, py, rr);
      gr.addColorStop(0, 'rgba(255,255,255,' + (0.3 + r()*0.35) + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); }
    const gr = x.createRadialGradient(64, 64, 26, 64, 64, 64); x.globalCompositeOperation = 'destination-in'; gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  const quad = () => { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };
  // ---- dust / spray: billboards that billow out, rise, grow and thin out
  function mkDust(tex){
    const g = quad(), S = pool(3200, {iP:4, iV:4, iS:4, iC:3}); for (const k in S.A) g.setAttribute(k, S.A[k]); g.instanceCount = S.cap;
    for (let i = 0; i < S.cap; i++) S.A.iP.array[i*4 + 3] = -1e6;
    const m = new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {uTex:{value:null}, uKT:{value:0}, uLight:{value:1}, uKW:{value:new THREE.Vector2(1.2, -0.6)}}]), fog:true, transparent:true, depthWrite:false,
      vertexShader:`attribute vec4 iP; attribute vec4 iV; attribute vec4 iS; attribute vec3 iC; uniform float uKT; uniform float uLight; uniform vec2 uKW; varying vec2 vUv; varying vec4 vC;
#include <fog_pars_vertex>
void main(){
  float kt = uKT - iP.w, u = kt / iV.w, alive = step(0.0, kt) * step(u, 1.0);
  vec3 c = iP.xyz + iV.xyz * (1.0 - exp(-kt * 0.32)) / 0.32 + vec3(0.0, iS.w * kt, 0.0);
  c.xz += uKW * kt * min(1.0, 0.15 + iS.w * 0.25);
  float size = mix(iS.x, iS.y, 1.0 - exp(-kt * 0.22)) * alive;
  vec4 mvPosition = modelViewMatrix * vec4(c, 1.0);
  float ro = iP.w * 13.7 + kt * 0.04, cs = cos(ro), sn = sin(ro);
  mvPosition.xy += vec2(position.x * cs - position.y * sn, position.x * sn + position.y * cs) * size;
  gl_Position = projectionMatrix * mvPosition; vUv = position.xy * 0.5 + 0.5;
  vC = vec4(iC * uLight, iS.z * smoothstep(0.0, 0.06, u) * (1.0 - u) * (1.0 - u));
  #include <fog_vertex>
}`,
      fragmentShader:`uniform sampler2D uTex; varying vec2 vUv; varying vec4 vC;
#include <fog_pars_fragment>
void main(){ float a = texture2D(uTex, vUv).a * vC.a; if (a < 0.004) discard; gl_FragColor = vec4(vC.rgb, a);
  #include <fog_fragment>
}`});
    m.uniforms.uTex.value = tex; m.uniforms.uKT = T; m.uniforms.uLight = LIGHT; m.uniforms.uKW = WIND;
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 7; mesh.name = 'kaiju_dust';
    return {S, mesh};
  }
  // ---- water streaming off the body: falling streaks (motion-stretched quads), gone at the sea surface
  function mkDrips(){
    const g = quad(), S = pool(1600, {iP:4, iV:4}); for (const k in S.A) g.setAttribute(k, S.A[k]); g.instanceCount = S.cap;
    for (let i = 0; i < S.cap; i++) S.A.iP.array[i*4 + 3] = -1e6;
    const m = new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {uKT:{value:0}, uLight:{value:1}}]), fog:true, transparent:true, depthWrite:false,
      vertexShader:`attribute vec4 iP; attribute vec4 iV; uniform float uKT; uniform float uLight; varying float vA; varying vec2 vQ;
#include <fog_pars_vertex>
void main(){
  float kt = uKT - iP.w, alive = step(0.0, kt) * step(kt, iV.w);
  vec3 a = iP.xyz + vec3(iV.x, iV.y, iV.z) * kt - vec3(0.0, 4.905 * kt * kt, 0.0);
  float tb = max(kt - 0.3, 0.0); vec3 b = iP.xyz + vec3(iV.x, iV.y, iV.z) * tb - vec3(0.0, 4.905 * tb * tb, 0.0);
  vec4 ma = modelViewMatrix * vec4(a, 1.0), mb = modelViewMatrix * vec4(b, 1.0);
  vec2 d = mb.xy - ma.xy; float l = length(d); d = l > 1e-4 ? d / l : vec2(0.0, 1.0);
  vec4 mvPosition = mix(ma, mb, position.y * 0.5 + 0.5); mvPosition.xy += vec2(-d.y, d.x) * position.x * (1.4 + 0.003 * -mvPosition.z) * alive;
  gl_Position = projectionMatrix * mvPosition; vQ = position.xy;
  vA = alive * step(-0.5, a.y) * (0.5 + 0.25 * uLight);
  #include <fog_vertex>
}`,
      fragmentShader:`varying float vA; varying vec2 vQ; uniform float uLight;
#include <fog_pars_fragment>
void main(){ float a = vA * (1.0 - vQ.x * vQ.x) * (0.6 + 0.4 * (vQ.y * 0.5 + 0.5)); if (a < 0.01) discard; gl_FragColor = vec4(vec3(0.78, 0.86, 0.9) * (0.35 + 0.65 * uLight), a);
  #include <fog_fragment>
}`});
    m.uniforms.uKT = T; m.uniforms.uLight = LIGHT;
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 7; mesh.name = 'kaiju_drips';
    return {S, mesh};
  }
  // ---- eye glows (additive points; bright at night, seen from kilometres away)
  function mkEyes(){
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const m = new THREE.ShaderMaterial({uniforms:{uK:{value:1}, uH:{value:800}}, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      vertexShader:'uniform float uK; uniform float uH; varying float vK; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(uH * 56.0 / max(-mv.z, 1.0), 4.0, 160.0); vK = uK; }',
      fragmentShader:'varying float vK; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; float a = exp(-r * r * 4.0) * (1.0 - smoothstep(0.8, 1.0, r)); gl_FragColor = vec4(vec3(1.0, 0.86, 0.3) * a * vK, a * vK); }'});
    const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = 9; p.name = 'kaiju_eyes';
    return p;
  }
  // ---- the extraction beacon: a tall green column of light with a pulse running up
  function mkBeacon(){
    const g = new THREE.CylinderGeometry(26, 34, 1600, 24, 1, true); g.translate(0, 800, 0);
    const m = new THREE.ShaderMaterial({uniforms:{uT:T}, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide,
      vertexShader:'varying float vY; void main(){ vY = position.y / 1600.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader:'uniform float uT; varying float vY; void main(){ float p = fract(vY * 6.0 - uT * 0.5); float a = (1.0 - vY) * (0.18 + 0.25 * smoothstep(0.85, 1.0, p)); gl_FragColor = vec4(vec3(0.35, 1.0, 0.55) * a, a); }'});
    const b = new THREE.Mesh(g, m); b.frustumCulled = false; b.visible = false; b.renderOrder = 8; b.name = 'kaiju_beacon';
    return b;
  }
  function init(){
    if (inited) return; inited = true;
    const tex = cloudTex();
    P.deb = mkDebris(); P.dust = mkDust(tex); P.drip = mkDrips(); P.eyes = mkEyes(); P.beacon = mkBeacon(); P.fl = mkFlames(tex); P.rub = mkRubble();
    for (const k of ['deb', 'dust', 'drip', 'fl']) scene.add(P[k].mesh);
    scene.add(P.rub.mesh);
    scene.add(P.eyes); scene.add(P.beacon);
  }
  const rnd = (a, b) => a + Math.random()*(b - a);
  // world (x east, y north, z height) -> slots
  function debris(x, y, z, vx, vy, vz, size, gy, col, life){
    if (!inited) return; const S = P.deb.S, i = S.take(), A = S.A;
    A.iP.array.set([x, z, -y, T.value], i*4); A.iV.array.set([vx, vz, -vy, size], i*4); A.iX.array.set([gy, rnd(0.3, 1.6)*(Math.random() < 0.5 ? -1 : 1), Math.random()*10, life || rnd(38, 60)], i*4); A.iC.array.set(col, i*3);
  }
  function dust(x, y, z, vx, vy, vz, s0, s1, life, col, alpha, rise){
    if (!inited) return; const S = P.dust.S, i = S.take(), A = S.A;
    A.iP.array.set([x, z, -y, T.value + rnd(0, 0.25)], i*4); A.iV.array.set([vx, vz, -vy, life], i*4); A.iS.array.set([s0, s1, alpha, rise || 0], i*4); A.iC.array.set(col, i*3);
  }
  function drip(x, y, z, vx, vy, vz, life){
    if (!inited) return; const S = P.drip.S, i = S.take(), A = S.A;
    A.iP.array.set([x, z, -y, T.value], i*4); A.iV.array.set([vx, vz, -vy, life], i*4);
  }
  // a building comes down: chunks from its full height flung away from the creature, a dust cloud rolling out at the base
  function collapse(b, ang, k){
    if (!inited) return;
    const n = Math.round(Math.min(34, 5 + Math.sqrt(Math.max(1, b.h*b.r*b.r))/9)*(k || 1)), col = b.col || [0.6, 0.6, 0.58], dx = Math.cos(ang), dy = Math.sin(ang);
    for (let i = 0; i < n; i++){
      const a = Math.random()*Math.PI*2, rr = Math.sqrt(Math.random())*b.r*0.8, hz = b.g + Math.random()*b.h, sp = rnd(4, 14) + b.h*0.03;
      const c = 0.75 + Math.random()*0.35, cc = [col[0]*c, col[1]*c, col[2]*c];
      debris(b.cx + Math.cos(a)*rr, b.cy + Math.sin(a)*rr, hz, dx*sp + rnd(-5, 5), dy*sp + rnd(-5, 5), rnd(-2, 8), rnd(1.5, 3.5) + Math.min(9, b.r*0.12)*Math.random(), b.g, cc);
    }
    const nd = Math.round(Math.min(9, 2 + b.h/30)*(k || 1)), dc = [0.55*0.6 + col[0]*0.4, 0.52*0.6 + col[1]*0.4, 0.47*0.6 + col[2]*0.4];
    for (let i = 0; i < nd; i++){ const a = Math.random()*Math.PI*2, v = rnd(4, 12);
      dust(b.cx + Math.cos(a)*b.r*0.5, b.cy + Math.sin(a)*b.r*0.5, b.g + rnd(2, 10) + (i % 3 === 2 ? b.h*0.4*Math.random() : 0), Math.cos(a)*v + dx*6, Math.sin(a)*v + dy*6, rnd(0.5, 3), b.r*0.6 + 12, b.r*1.6 + 45 + b.h*0.3, rnd(18, 34), dc, 0.85, rnd(0.6, 2)); }
  }
  // a foot comes down / a tentacle hits: a ring of dust (spray on water), a few chunks
  // (v31, kaiju3: nch / csz - the number and size factor of the thrown chunks; a footfall throws fewer, smaller ones)
  function impact(x, y, z, r, water, k, nch, csz){
    if (!inited) return;
    const n = Math.round(10 + r*0.15);
    for (let i = 0; i < n; i++){ const a = i/n*Math.PI*2 + Math.random()*0.3, v = rnd(6, 16)*(k || 1);
      if (water) dust(x + Math.cos(a)*r*0.6, y + Math.sin(a)*r*0.6, z + rnd(0, 6), Math.cos(a)*v, Math.sin(a)*v, rnd(4, 14), 10, 30 + r*0.4, rnd(4, 8), [0.88, 0.92, 0.95], 0.8, 2);
      else dust(x + Math.cos(a)*r*0.6, y + Math.sin(a)*r*0.6, z + rnd(0, 4), Math.cos(a)*v, Math.sin(a)*v, rnd(0.5, 3), 8, 26 + r*0.5, rnd(9, 18), [0.5, 0.47, 0.42], 0.75, 0.8); }
    // [lm27/destruct] the chunks are physics bodies near the camera (they bounce off the street, cars, each other)
    if (!water) for (let i = 0, nc = nch === undefined ? 6 : nch; i < nc; i++){ const a = Math.random()*Math.PI*2, v = rnd(5, 12); chunk(x + Math.cos(a)*r*0.4, y + Math.sin(a)*r*0.4, z + 2, Math.cos(a)*v, Math.sin(a)*v, rnd(6, 14), rnd(1, 2.6)*(csz || 1), [0.42, 0.4, 0.37], undefined, z); }
  }
  // ================= [lm27/destruct] fires, smoke columns, rolling dust, floor bursts, rubble mounds, physics chunks =================
  function ensure(){ if (!inited && typeof scene !== 'undefined' && typeof THREE !== 'undefined') init(); return inited; }
  // ---- flames: additive billboards that rise, flicker and cool from white-yellow to deep red (not dimmed at night: they glow)
  function mkFlames(tex){
    const g = quad(), S = pool(1600, {iP:4, iV:4, iS:4}); for (const k in S.A) g.setAttribute(k, S.A[k]); g.instanceCount = S.cap;
    for (let i = 0; i < S.cap; i++) S.A.iP.array[i*4 + 3] = -1e6;
    const m = new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {uTex:{value:null}, uKT:{value:0}, uLight:{value:1}}]), fog:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      vertexShader:`attribute vec4 iP; attribute vec4 iV; attribute vec4 iS; uniform float uKT; uniform float uLight; varying vec2 vUv; varying vec4 vC;
#include <fog_pars_vertex>
void main(){
  float kt = uKT - iP.w, u = kt / iV.w, alive = step(0.0, kt) * step(u, 1.0);
  vec3 c = iP.xyz + iV.xyz * kt + vec3(0.0, 0.5 * iS.w * kt * kt, 0.0);
  float size = mix(iS.x, iS.y, sqrt(max(u, 0.0))) * alive;
  vec4 mvPosition = modelViewMatrix * vec4(c, 1.0);
  float ro = iP.w * 7.3 + kt * 1.7, cs = cos(ro), sn = sin(ro);
  mvPosition.xy += vec2(position.x * cs - position.y * sn, position.x * sn + position.y * cs) * size;
  gl_Position = projectionMatrix * mvPosition; vUv = position.xy * 0.5 + 0.5;
  vec3 col = mix(vec3(1.0, 0.86, 0.5), vec3(1.0, 0.45, 0.1), smoothstep(0.0, 0.4, u));
  col = mix(col, vec3(0.55, 0.11, 0.03), smoothstep(0.4, 1.0, u));
  vC = vec4(col * (1.25 - 0.45 * uLight), iS.z * smoothstep(0.0, 0.1, u) * (1.0 - u));
  #include <fog_vertex>
}`,
      fragmentShader:`uniform sampler2D uTex; varying vec2 vUv; varying vec4 vC;
#include <fog_pars_fragment>
void main(){ vec2 d = vUv - 0.5; float r = length(d) * 2.0; float a = texture2D(uTex, vUv).a * exp(-r * r * 1.6) * vC.a; if (a < 0.004) discard; gl_FragColor = vec4(vC.rgb * a, 1.0);
  #include <fog_fragment>
}`});
    m.uniforms.uTex.value = tex; m.uniforms.uKT = T; m.uniforms.uLight = LIGHT;
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 8; mesh.name = 'kaiju_flames';
    return {S, mesh};
  }
  // allocation-free slot writers (world x east, y north, z up -> three x, y up, -z)
  function dustQ(x, y, z, vx, vy, vz, s0, s1, life, r, g, b, alpha, rise){
    const S = P.dust.S, i = S.take(), A = S.A, p = A.iP.array, v = A.iV.array, s = A.iS.array, c = A.iC.array;
    p[i*4] = x; p[i*4 + 1] = z; p[i*4 + 2] = -y; p[i*4 + 3] = T.value + Math.random()*0.25;
    v[i*4] = vx; v[i*4 + 1] = vz; v[i*4 + 2] = -vy; v[i*4 + 3] = life;
    s[i*4] = s0; s[i*4 + 1] = s1; s[i*4 + 2] = alpha; s[i*4 + 3] = rise || 0; c[i*3] = r; c[i*3 + 1] = g; c[i*3 + 2] = b;
  }
  function flame(x, y, z, vx, vy, vz, s0, s1, life, alpha, acc){
    if (!ensure()) return; const S = P.fl.S, i = S.take(), A = S.A, p = A.iP.array, v = A.iV.array, s = A.iS.array;
    p[i*4] = x; p[i*4 + 1] = z; p[i*4 + 2] = -y; p[i*4 + 3] = T.value; v[i*4] = vx; v[i*4 + 1] = vz; v[i*4 + 2] = -vy; v[i*4 + 3] = life;
    s[i*4] = s0; s[i*4 + 1] = s1; s[i*4 + 2] = alpha; s[i*4 + 3] = acc || 0;
  }
  // ---- lingering fires (bitten towers, rubble): flames + a smoke column drifting with the wind; a far LOD (fewer, bigger particles)
  const FIRES = [], FIRE_MAX = 36;
  function fireAt(x, y, z, size, dur, smoke){
    if (!ensure()) return null; const s = Math.max(0.5, size || 3);
    for (const F of FIRES) if (Math.abs(F.x - x) < s*1.5 && Math.abs(F.y - y) < s*1.5 && Math.abs(F.z - z) < s*1.5){ F.t1 = Math.max(F.t1, T.value + dur); F.s = Math.max(F.s, s); return F; }
    if (FIRES.length >= FIRE_MAX){ let k = 0; for (let i = 1; i < FIRES.length; i++) if (FIRES[i].t1 < FIRES[k].t1) k = i; FIRES.splice(k, 1); }
    const F = {x, y, z, s, t0:T.value, t1:T.value + (dur || 90), af:0, as:0, smoke:smoke !== false};
    FIRES.push(F); return F;
  }
  function fireOff(x, y, r){ for (let i = FIRES.length - 1; i >= 0; i--){ const F = FIRES[i]; if (Math.hypot(F.x - x, F.y - y) < r) FIRES.splice(i, 1); } }
  const camXY = () => { try { const c = camera.position; return [c.x, -c.z, c.y]; } catch (e){ return [0, 0, 0]; } };
  function fireStep(t, night){
    if (!FIRES.length) return;
    const dt = Math.min(0.1, Math.max(0, t - (fireStep.t || t))); fireStep.t = t; if (!(dt > 0)) return;
    const c = camXY();
    for (let i = FIRES.length - 1; i >= 0; i--){
      const F = FIRES[i]; if (t > F.t1){ FIRES.splice(i, 1); continue; }
      const age = t - F.t0, fade = Math.min(1, (F.t1 - t)/20, 0.3 + age/3), s = F.s*fade, d = Math.hypot(F.x - c[0], F.y - c[1], F.z - c[2]);
      const lod = d < 1500 ? 1 : d < 4000 ? 0.45 : 0.18;
      F.af += dt*(8 + 4*s)*lod;
      while (F.af > 1){ F.af--; const a = Math.random()*6.283, rr = Math.random()*s*0.8;
        flame(F.x + Math.cos(a)*rr, F.y + Math.sin(a)*rr, F.z + Math.random()*s*0.3, (Math.random() - 0.5)*s*0.5, (Math.random() - 0.5)*s*0.5, 1 + Math.random()*s*0.6, s*0.9/lod**0.3, s*0.25, 0.6 + Math.random()*0.8, 0.55 + 0.3*Math.random(), 2 + s*0.8); }
      // a soft glow round the fire (lights the smoke and the street at night)
      F.ag = (F.ag || 0) + dt*1.8; while (F.ag > 1){ F.ag--; flame(F.x, F.y, F.z + s*0.6, 0, 0, 0.6, s*(4.5 + 2*night), s*(3.6 + 1.6*night), 1.3, 0.12 + 0.26*night, 0); }
      if (F.smoke){ F.as += dt*(0.45 + 0.12*s)*Math.max(0.5, lod);
        while (F.as > 1){ F.as--; const k = 0.11 + 0.06*Math.random();
          dustQ(F.x + (Math.random() - 0.5)*s, F.y + (Math.random() - 0.5)*s, F.z + s*0.6, (Math.random() - 0.5)*2, (Math.random() - 0.5)*2, 1, s*1.2 + 3, s*5 + 30 + Math.random()*20, 26 + Math.random()*16, k, k*0.95, k*0.9, 0.5, 3.5 + s*0.35 + Math.random()*2.5); } }
    }
  }
  // ---- a building's dust cloud rolling out along the streets (ground-hugging billows) and a column rising over the footprint
  function dustRoll(x, y, z, R, H, col, k){
    if (!ensure()) return; k = k || 1; R = Math.max(6, R); H = Math.max(6, H || 20);
    const c = col || [0.6, 0.58, 0.54], cr = (0.5*0.65 + c[0]*0.35)*0.9, cg = (0.48*0.65 + c[1]*0.35)*0.9, cb = (0.44*0.65 + c[2]*0.35)*0.9;
    const n = Math.round(Math.min(30, 8 + R*0.22 + H*0.045)*Math.min(1.4, k)), v0 = 9 + Math.min(18, H*0.12);
    for (let i = 0; i < n; i++){ const a = i/n*6.283 + Math.random()*0.35, v = v0*(0.6 + Math.random()*0.7)*k, r0 = R*(0.5 + Math.random()*0.4), sh = 0.92 + Math.random()*0.16;
      dustQ(x + Math.cos(a)*r0, y + Math.sin(a)*r0, z + 1 + Math.random()*5, Math.cos(a)*v, Math.sin(a)*v, 0.3 + Math.random(), 8 + R*0.3, 30 + R*0.7 + H*0.28, 22 + Math.random()*18, cr*sh, cg*sh, cb*sh, 0.55, 0.25 + Math.random()*0.6); }
    const n2 = Math.round(Math.min(10, 2 + H/26)*Math.min(1.3, k));
    for (let i = 0; i < n2; i++){ const a = Math.random()*6.283, rr = Math.random()*R*0.6, sh = 0.9 + Math.random()*0.15;
      dustQ(x + Math.cos(a)*rr, y + Math.sin(a)*rr, z + Math.random()*H*0.45, Math.cos(a)*3, Math.sin(a)*3, 1, R*0.7 + 10, R*1.4 + 36 + H*0.4, 28 + Math.random()*20, cr*sh, cg*sh, cb*sh, 0.5, 1.2 + Math.random()*2.8); }
  }
  // ---- a floor gives way: dust jets out of its windows all round, a few chunks
  function floorBurst(cx, cy, z, R, col, k, dirx, diry){
    if (!ensure()) return; k = k || 1;
    const c = col || [0.6, 0.58, 0.54], cr = (0.52*0.6 + c[0]*0.4)*0.92, cg = (0.5*0.6 + c[1]*0.4)*0.92, cb = (0.46*0.6 + c[2]*0.4)*0.92;
    const n = Math.round(Math.min(12, 5 + R*0.12)*k);
    for (let i = 0; i < n; i++){ const a = i/n*6.283 + Math.random()*0.5, v = (9 + Math.random()*12)*k, sh = 0.92 + Math.random()*0.16;
      dustQ(cx + Math.cos(a)*R, cy + Math.sin(a)*R, z, Math.cos(a)*v + (dirx || 0)*4, Math.sin(a)*v + (diry || 0)*4, -1 + Math.random()*2, 4 + R*0.1, 16 + R*0.45, 9 + Math.random()*10, cr*sh, cg*sh, cb*sh, 0.62, 0.4); }
  }
  // ---- physics chunks (window.SGPhys) near the camera; the GPU debris pool otherwise
  function chunk(x, y, z, vx, vy, vz, size, col, life, g, mat){
    const c = camXY(), d = Math.hypot(x - c[0], y - c[1], z - c[2]);
    try { if (window.SGPhys && SGPhys.spawn && d < 2600){ physHook(); const s = Math.max(0.4, size); SGPhys.spawn('chunk', {x, y, z, vx, vy, vz, w:s, d:s*(0.55 + Math.random()*0.5), h:s*(0.35 + Math.random()*0.45), col, life:life || (35 + Math.random()*45), mat:mat || undefined}); return; } } catch (e){ /* optional */ }
    if (ensure()) debris(x, y, z, vx, vy, vz, size, g === undefined ? (typeof hC === 'function' ? hC(x, y) : 0) : g, col, life);
  }
  // [lm30/phys2] the physics module's dust drawn as small rolling clouds in the piece's colours
  function physHook(){ try { if (window.SGPhys && SGPhys.dust !== physDust) SGPhys.dust = physDust; } catch (e){ /* */ } }
  // (a budget of ~40 particles a second, so the big collapse clouds in the shared 3200-particle ring are never cut short; force: the
  // trail of a falling tower may borrow ahead)
  const PDB = {tk:60, t:0};
  function physDust(x, y, z, s, col, force){
    if (!ensure()) return; const now = (typeof performance !== 'undefined' ? performance.now() : Date.now())/1000; PDB.tk = Math.min(60, PDB.tk + (now - (PDB.t || now))*40); PDB.t = now;
    const c = col || [0.6, 0.58, 0.54], k = Math.max(0.3, Math.min(3, s || 1)), n = 1 + (k > 1.4 ? 1 : 0) + (k > 2.4 ? 1 : 0);
    if (PDB.tk < (force ? -30 : n)) return; PDB.tk -= n;
    for (let i = 0; i < n; i++){ const a = Math.random()*6.283, v = (1.5 + Math.random()*3)*Math.sqrt(k), sh = 0.9 + Math.random()*0.15;
      dustQ(x + Math.cos(a)*k*0.6, y + Math.sin(a)*k*0.6, z + Math.random()*k*0.5, Math.cos(a)*v, Math.sin(a)*v, 0.3 + Math.random()*1.2, 2 + k*1.5, 6 + k*7, 7 + Math.random()*7, c[0]*sh, c[1]*sh, c[2]*sh, 0.5, 0.4 + Math.random()*0.5); }
  }
  // [lm30/phys2] a broken floor slab (w x d x ~0.35 m) / a steel section (beam: long, thin) for the big collapses (near the camera only)
  function slab(x, y, z, vx, vy, vz, w, dd, col, life){
    const c = camXY(); if (Math.hypot(x - c[0], y - c[1], z - c[2]) > 2200) return chunk(x, y, z, vx, vy, vz, Math.min(3, w*0.6), col, life);
    try { if (window.SGPhys && SGPhys.spawn){ physHook(); SGPhys.spawn('slab', {x, y, z, vx, vy, vz, w, d:dd, h:0.28 + Math.random()*0.2, col, life:life || (50 + Math.random()*40), spin:0.8 + Math.random()*2.2, tilt:0.35}); } } catch (e){ /* optional */ }
  }
  function beam(x, y, z, vx, vy, vz, len, life){
    const c = camXY(); if (Math.hypot(x - c[0], y - c[1], z - c[2]) > 1800) return;
    try { if (window.SGPhys && SGPhys.spawn){ physHook(); const k = 0.85 + Math.random()*0.3; SGPhys.spawn('beam', {x, y, z, vx, vy, vz, w:len, d:0.28, h:0.4, col:[0.33*k, 0.30*k, 0.28*k], life:life || (45 + Math.random()*40), spin:1.5 + Math.random()*3, mat:'steel'}); } } catch (e){ /* optional */ }
  }
  function glass(x, y, z, vx, vy, vz){
    const c = camXY(); if (Math.hypot(x - c[0], y - c[1], z - c[2]) > 1800) return;
    try { if (window.SGPhys && SGPhys.spawn){ const s = 0.4 + Math.random()*0.9; SGPhys.spawn('glass', {x, y, z, vx, vy, vz, w:s, d:s*0.7, h:0.04, col:[0.5 + Math.random()*0.15, 0.6 + Math.random()*0.12, 0.66 + Math.random()*0.1], life:25 + Math.random()*20}); } } catch (e){ /* optional */ }
  }
  // ---- rubble mounds: persistent broken concrete blocks (one InstancedMesh, a ring of 3000)
  function mkRubble(){
    const cap = 4000, geo = new THREE.BoxGeometry(1, 1, 1), p = geo.attributes.position; let sd = 11;
    const r = () => { sd = (sd*16807) % 2147483647; return sd/2147483647; };
    // jitter the 8 corners consistently (the box's 24 vertices share 8 positions)
    const J = new Map(); for (let i = 0; i < p.count; i++){ const key = [p.getX(i), p.getY(i), p.getZ(i)].join(','); if (!J.has(key)) J.set(key, [0.75 + 0.3*r(), 0.7 + 0.35*r(), 0.75 + 0.3*r()]); const j = J.get(key); p.setXYZ(i, p.getX(i)*j[0], p.getY(i)*j[1], p.getZ(i)*j[2]); }
    const ng = geo.toNonIndexed(); ng.computeVertexNormals(); geo.dispose();
    // at night the blocks keep a faint dusty glow (as the heaps under them), so the rubble reads in the dark
    const mat = new THREE.MeshLambertMaterial({color:0xffffff});
    mat.onBeforeCompile = sh => { sh.uniforms.uKjL = LIGHT; sh.fragmentShader = 'uniform float uKjL;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vColor * 0.13 * clamp((1.0 - uKjL) / 0.78, 0.0, 1.0);'); };
    mat.customProgramCacheKey = () => 'kj-rubble-1';
    const m = new THREE.InstancedMesh(ng, mat, cap);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap*3), 3);
    m.count = 0; m.frustumCulled = false; m.castShadow = false; m.receiveShadow = true; m.name = 'kaiju_rubble';
    return {mesh:m, cap, M:m.instanceMatrix.array, C:m.instanceColor.array, n:0, head:0, lo:1e9, hi:-1};
  }
  const _rq = new THREE.Quaternion(), _re = new THREE.Euler(), _rm = new THREE.Matrix4(), _rp = new THREE.Vector3(), _rs = new THREE.Vector3();
  function rubble(x, y, z, sx, sy, sz, yaw, col){
    if (!ensure()) return; const R = P.rub, i = R.head; R.head = (R.head + 1) % R.cap; R.n = Math.max(R.n, i + 1);
    _re.set((Math.random() - 0.5)*0.9, yaw, (Math.random() - 0.5)*0.9); _rq.setFromEuler(_re); _rp.set(x, z, -y); _rs.set(sx, sz, sy);
    _rm.compose(_rp, _rq, _rs).toArray(R.M, i*16);
    const k = 0.78 + Math.random()*0.3; R.C[i*3] = col[0]*k; R.C[i*3 + 1] = col[1]*k; R.C[i*3 + 2] = col[2]*k;
    if (i < R.lo) R.lo = i; if (i > R.hi) R.hi = i;
  }
  function rubCommit(){ const R = P.rub; if (!R || R.hi < 0) return; R.mesh.count = R.n; const a = R.mesh.instanceMatrix, c = R.mesh.instanceColor;
    a.updateRange.offset = R.lo*16; a.updateRange.count = (R.hi - R.lo + 1)*16; a.needsUpdate = true; c.updateRange.offset = R.lo*3; c.updateRange.count = (R.hi - R.lo + 1)*3; c.needsUpdate = true; R.lo = 1e9; R.hi = -1; }
  // blocks over a footprint (ring R0 = Float32Array of x, y): a mound, bigger blocks for taller buildings
  function rubbleFootprint(ring, cx, cy, g, H, col, n){
    if (!ensure() || !ring) return; const m = ring.length/2; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (let i = 0; i < m; i++){ x0 = Math.min(x0, ring[i*2]); x1 = Math.max(x1, ring[i*2]); y0 = Math.min(y0, ring[i*2 + 1]); y1 = Math.max(y1, ring[i*2 + 1]); }
    const inside = (x, y) => { let s = false; for (let i = 0, j = m - 1; i < m; j = i++){ const xi = ring[i*2], yi = ring[i*2 + 1], xj = ring[j*2], yj = ring[j*2 + 1]; if ((yi > y) !== (yj > y) && x < (xj - xi)*(y - yi)/(yj - yi) + xi) s = !s; } return s; };
    const c = col || [0.6, 0.58, 0.55], sz = Math.min(9, 1.6 + H*0.04);
    // [lm28/ruin] on the heap bld.js draws (dome profile over the plan, hr high at the centre); concrete, the building's colour, dark bits
    let R = 1; for (let i = 0; i < m; i++) R = Math.max(R, Math.hypot(ring[i*2] - cx, ring[i*2 + 1] - cy)); const hr = Math.min(24, Math.max(1.6, 0.075*H + 2.4));
    const pals = [[c[0]*0.55 + 0.25, c[1]*0.55 + 0.24, c[2]*0.55 + 0.22], [0.6, 0.58, 0.55], [c[0]*0.8, c[1]*0.8, c[2]*0.8], [0.3, 0.29, 0.28]];
    let k = 0; for (let tries = 0; k < n && tries < n*4; tries++){
      const x = x0 + Math.random()*(x1 - x0), y = y0 + Math.random()*(y1 - y0); if (!inside(x, y)) continue; k++;
      const rr = Math.min(1, Math.hypot(x - cx, y - cy)/R), zh = hr*(1 - rr*rr)*0.62;
      const s = sz*(0.45 + Math.random()*0.95), slab = Math.random() < 0.3; rubble(x, y, g + zh - s*0.12, s*(slab ? 1.5 : 1), s*(0.6 + Math.random()*0.6), s*(slab ? 0.18 : 0.35 + Math.random()*0.4), Math.random()*6.283, pals[k % 4]); }
  }
  // blocks along a line (a toppled tower's fall: from (x0, y0) for len metres along (dx, dy), width w)
  function rubbleLine(x0, y0, dx, dy, len, w, g0, H, col, n){
    if (!ensure()) return; const c = col || [0.6, 0.58, 0.55], cc = [c[0]*0.55 + 0.25, c[1]*0.55 + 0.24, c[2]*0.55 + 0.22], sz = Math.min(8, 1.5 + w*0.12);
    for (let k = 0; k < n; k++){ const t = Math.random()*len, l = (Math.random() - 0.5)*w, x = x0 + dx*t - dy*l, y = y0 + dy*t + dx*l, s = sz*(0.5 + Math.random()*0.9);
      let gz = g0; try { gz = hC(x, y); } catch (e){ /* */ }
      rubble(x, y, gz + s*0.15, s, s*(0.6 + Math.random()*0.6), s*(0.3 + Math.random()*0.4), Math.random()*6.283, cc); }
  }
  // ---- [lm28/ruin] a dust wave: a ring of big billows surging out from a heavy landing (r0 start radius, k size 0.5-2), a column over it
  function dustWave(x, y, z, r0, k, col){
    if (!ensure()) return; k = k || 1; const c = col || [0.6, 0.58, 0.54], cr = (0.52*0.6 + c[0]*0.4)*0.92, cg = (0.5*0.6 + c[1]*0.4)*0.92, cb = (0.46*0.6 + c[2]*0.4)*0.92;
    const n = Math.round(46*Math.min(1.6, k));
    for (let i = 0; i < n; i++){ const a = i/n*6.283 + Math.random()*0.2, v = (38 + 40*Math.random())*k, sh = 0.88 + Math.random()*0.2;
      dustQ(x + Math.cos(a)*r0, y + Math.sin(a)*r0, z + 2 + Math.random()*8, Math.cos(a)*v, Math.sin(a)*v, 0.5 + Math.random()*2, 20 + r0*0.3, (70 + r0*0.6)*k, 34 + Math.random()*20, cr*sh, cg*sh, cb*sh, 0.62, 0.3 + Math.random()*0.8); }
    for (let i = 0; i < Math.round(14*k); i++){ const a = Math.random()*6.283, rr = Math.random()*r0, sh = 0.86 + Math.random()*0.2;
      dustQ(x + Math.cos(a)*rr, y + Math.sin(a)*rr, z + 10 + Math.random()*60*k, Math.cos(a)*4, Math.sin(a)*4, 2 + Math.random()*3, 30 + r0*0.4, (120 + r0)*k, 45 + Math.random()*25, cr*sh, cg*sh, cb*sh, 0.5, 2.5 + Math.random()*3); }
  }
  // ---- [lm28/ruin] an explosion flash in mid-air (a floor blowing out): a white-hot core, flames bursting out, dark smoke puffs - all
  // short-lived particles (nothing stays hanging where the floor was: SGFX.explosion leaves fire / smoke emitters at its point)
  function blastFlash(x, y, z, s, dx, dy){
    if (!ensure()) return; s = Math.max(0.3, s || 1); dx = dx || 0; dy = dy || 0;
    flame(x, y, z, 0, 0, 1, 14*s, 30*s, 0.45, 0.95, 0);
    flame(x, y, z, 0, 0, 2, 10*s, 24*s, 0.9, 0.7, 2);
    const n = Math.round(14*Math.min(2, s));
    for (let i = 0; i < n; i++){ const a = Math.random()*6.283, e = Math.random()*1.2 - 0.3, v = (8 + Math.random()*18)*Math.sqrt(s);
      flame(x, y, z, Math.cos(a)*Math.cos(e)*v + dx*6, Math.sin(a)*Math.cos(e)*v + dy*6, Math.sin(e)*v + 3, 4*s, 11*s, 0.7 + Math.random()*0.9, 0.85, -2); }
    for (let i = 0; i < Math.round(6*Math.min(2, s)); i++){ const a = Math.random()*6.283, v = 3 + Math.random()*6, k = 0.07 + 0.05*Math.random();
      dustQ(x + Math.cos(a)*3*s, y + Math.sin(a)*3*s, z, Math.cos(a)*v + dx*4, Math.sin(a)*v + dy*4, 1 + Math.random()*2, 6*s, (22 + Math.random()*16)*s, 14 + Math.random()*10, k, k*0.95, k*0.9, 0.7, 1.5 + Math.random()*2); }
  }
  // ---- [lm28/ruin] the rumble of a collapse: low noise swelling and dying over dur seconds, crackling bursts, delayed by the distance
  function rumble(x, y, z, dur, k){
    const E = au(); if (!E) return; const c = E.ctx, d = listenerDist(x, y, z), t0 = c.currentTime + Math.min(6, d/343), att = Math.min(1, 1.8/(1 + d/900))*(k || 1); if (att < 0.02) return;
    dur = Math.max(1.5, Math.min(16, dur || 5));
    const o = outNode(E, d, panOf(x, y)), g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.9*att, t0 + Math.min(1.2, dur*0.2)); g.gain.setValueAtTime(0.9*att, t0 + dur*0.55); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); g.connect(o);
    const ns = c.createBufferSource(); ns.buffer = noiseBuf(c, 4); ns.loop = true; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.max(90, 260/(1 + d/1500)); const ng = c.createGain(); ng.gain.value = 1.1; ns.connect(lp); lp.connect(ng); ng.connect(g); ns.start(t0); ns.stop(t0 + dur + 0.1);
    const os = c.createOscillator(); os.type = 'sine'; os.frequency.setValueAtTime(38, t0); os.frequency.exponentialRampToValueAtTime(22, t0 + dur); const og = c.createGain(); og.gain.value = 0.7; os.connect(og); og.connect(g); os.start(t0); os.stop(t0 + dur + 0.1);
    // crackles: band-passed noise bursts (breaking concrete, snapping steel)
    if (d < 2500){ const nc = Math.round(dur*2.5); for (let i = 0; i < nc; i++){ const tt = t0 + Math.random()*dur*0.8, s = c.createBufferSource(); s.buffer = noiseBuf(c, 0.5); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500 + Math.random()*1800; bp.Q.value = 1.2;
      const cg = c.createGain(); cg.gain.setValueAtTime(0.0001, tt); cg.gain.exponentialRampToValueAtTime(0.5*att*(0.3 + Math.random()*0.7), tt + 0.01); cg.gain.exponentialRampToValueAtTime(0.0001, tt + 0.25 + Math.random()*0.3); s.connect(bp); bp.connect(cg); cg.connect(o); s.start(tt); s.stop(tt + 0.6); } }
  }
  function fxStats(){ return inited ? {dust:P.dust.S.n, flames:P.fl.S.n, debris:P.deb.S.n, fires:FIRES.length, rubble:P.rub.n} : null; }
  function frame(t, night, sunDir){
    if (!inited) return;
    T.value = t; LIGHT.value = 0.22 + 0.78*(1 - night);
    fireStep(t, night);
    for (const k of ['deb', 'dust', 'drip', 'fl']) P[k].S.commit();
    rubCommit();
    P.eyes.material.uniforms.uH.value = typeof renderer !== 'undefined' ? renderer.domElement.height/2 : 400;
  }
  function eyes(E, k, on){ if (!inited) return; const a = P.eyes.geometry.attributes.position; a.array.set([E[0][0], E[0][2], -E[0][1], E[1][0], E[1][2], -E[1][1]]); a.needsUpdate = true; P.eyes.material.uniforms.uK.value = k; P.eyes.visible = !!on; }
  function beacon(x, y, on){ if (!inited) return; P.beacon.visible = !!on; if (on) P.beacon.position.set(x, typeof hC === 'function' ? hC(x, y) : 0, -y); }
  function clear(){ if (!inited) return; for (const k of ['deb', 'dust', 'drip', 'fl']){ const S = P[k].S, a = S.A.iP.array; for (let i = 0; i < S.cap; i++) a[i*4 + 3] = -1e6; S.lo = 0; S.hi = S.cap - 1; S.commit(); } }
  // [lm27/destruct] the city is restored: rubble, fires and smoke go too
  function clearWorld(){ FIRES.length = 0; if (!inited) return; clear(); const R = P.rub; R.M.fill(0); R.n = 0; R.head = 0; R.lo = 0; R.hi = R.cap - 1; rubCommit(); }
  function hide(){ if (!inited) return; P.eyes.visible = false; P.beacon.visible = false; }
  // ---- sound: our own synthesis on the sound module's context and its 'fx' bus (follows the master volume / mute); nothing when sound is off
  const AU = {lastStomp:0, siren:null};
  function au(){ try { const A = window.SGAudio, E = A && A._test && A._test.LIVE; if (!A || !A.on || !E || !E.ctx || E.ctx.state !== 'running') return null; return E; } catch (e){ return null; } }
  function listenerDist(x, y, z){ const c = camera.position; return Math.hypot(c.x - x, c.y - (z || 0), -c.z - y); }
  function outNode(E, d, pan){ const c = E.ctx, g = c.createGain(), dst = (E.bus && (E.bus.fx || E.bus.f1)) || E.out; g.gain.value = 1; let n = g;
    if (c.createStereoPanner && pan !== undefined){ const p = c.createStereoPanner(); p.pan.value = Math.max(-0.8, Math.min(0.8, pan)); g.connect(p); n = p; }
    n.connect(dst); if (E.rvIn && d > 300){ const s = c.createGain(); s.gain.value = Math.min(0.8, d/2500); g.connect(s); s.connect(E.rvIn); } return g; }
  function panOf(x, y){ try { const c = camera.position, v = new THREE.Vector3(x - c.x, 0, -y - c.z), r = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); return v.normalize().dot(r.setY(0).normalize()); } catch (e){ return 0; } }
  const NBUF = {c:null, m:new Map()};
  function noiseBuf(c, sec){ if (NBUF.c !== c){ NBUF.c = c; NBUF.m.clear(); } const key = Math.round(sec*10); let b = NBUF.m.get(key); if (b) return b;
    const n = Math.floor(c.sampleRate*key/10), d0 = c.createBuffer(1, n, c.sampleRate), d = d0.getChannelData(0); let l = 0; for (let i = 0; i < n; i++){ l = (l + 0.02*(Math.random()*2 - 1))/1.02; d[i] = l*3.5; } NBUF.m.set(key, d0); return d0; }
  // the roar: two detuned saws and a sub, through moving vocal-tract formants, with a rumbling tremolo and a long tail
  function roar(x, y, z, k){
    const E = au(); if (!E) return; const c = E.ctx, d = listenerDist(x, y, z), t0 = c.currentTime + Math.min(6, d/343), dur = 4.6;
    const att = Math.min(1, 1.6/(1 + d/700))*(k || 1); if (att < 0.02) return;
    const o = outNode(E, d, panOf(x, y)), g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.5*att, t0 + 0.5); g.gain.setValueAtTime(0.5*att, t0 + dur - 1.6); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.max(260, 2200/(1 + d/900)); g.connect(lp); lp.connect(o);
    const f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(); f1.type = f2.type = 'bandpass'; f1.Q.value = 3; f2.Q.value = 4;
    f1.frequency.setValueAtTime(320, t0); f1.frequency.linearRampToValueAtTime(520, t0 + 1.5); f1.frequency.linearRampToValueAtTime(260, t0 + dur);
    f2.frequency.setValueAtTime(900, t0); f2.frequency.linearRampToValueAtTime(1300, t0 + 1.4); f2.frequency.linearRampToValueAtTime(700, t0 + dur);
    const mix = c.createGain(); mix.gain.value = 1; mix.connect(f1); mix.connect(f2); f1.connect(g); f2.connect(g);
    const sub = c.createGain(); sub.gain.value = 0.9; sub.connect(g);
    const trem = c.createOscillator(), tg = c.createGain(); trem.frequency.value = 9; tg.gain.value = 0.35; trem.connect(tg); tg.connect(mix.gain); trem.start(t0); trem.stop(t0 + dur);
    for (const [f, ty, gn, dst] of [[46, 'sawtooth', 0.9, mix], [46*1.013, 'sawtooth', 0.7, mix], [69, 'square', 0.25, mix], [23, 'sine', 1, sub]]){
      const os = c.createOscillator(), og = c.createGain(); os.type = ty; os.frequency.setValueAtTime(f*1.3, t0); os.frequency.exponentialRampToValueAtTime(f, t0 + 0.8); os.frequency.exponentialRampToValueAtTime(f*0.78, t0 + dur);
      og.gain.value = gn; os.connect(og); og.connect(dst); os.start(t0); os.stop(t0 + dur + 0.1); }
    const ns = c.createBufferSource(); ns.buffer = noiseBuf(c, dur); const ng = c.createGain(); ng.gain.value = 0.5; ns.connect(ng); ng.connect(mix); ns.start(t0);
  }
  // a footfall: a sub-bass thud with a gravelly crunch, delayed by the distance
  function stomp(x, y, z, k){
    const E = au(); if (!E) return; const c = E.ctx, d = listenerDist(x, y, z), t0 = c.currentTime + Math.min(5, d/343), att = Math.min(1, 1.3/(1 + d/600))*(k || 1); if (att < 0.02) return;
    const o = outNode(E, d, panOf(x, y)), g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.85*att, t0 + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.8); g.connect(o);
    const os = c.createOscillator(); os.type = 'sine'; os.frequency.setValueAtTime(58, t0); os.frequency.exponentialRampToValueAtTime(24, t0 + 0.9); os.connect(g); os.start(t0); os.stop(t0 + 1.9);
    const ns = c.createBufferSource(); ns.buffer = noiseBuf(c, 1.2); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.max(150, 900/(1 + d/800)); const ng = c.createGain(); ng.gain.value = 0.45;
    ns.connect(lp); lp.connect(ng); ng.connect(g); ns.start(t0);
  }
  // civil-defence sirens: slow rising / falling wails from a few points around the listener
  function siren(on){
    const E = au();
    if (!on){ if (AU.siren){ const c = AU.siren.c, t = c.currentTime; try { AU.siren.g.gain.cancelScheduledValues(t); AU.siren.g.gain.setTargetAtTime(0.0001, t, 1.2); AU.siren.os.forEach(o => o.stop(t + 5)); } catch (e){ /* */ } AU.siren = null; } return; }
    if (!E || AU.siren) return; const c = E.ctx, t0 = c.currentTime, g = c.createGain(), o = outNode(E, 2000);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.13, t0 + 3); g.connect(o);
    const os = [];
    for (const [ph, det] of [[0, 1], [3.7, 1.03], [7.1, 0.97]]){
      const a = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), lp = c.createBiquadFilter(), sg = c.createGain();
      a.type = 'triangle'; a.frequency.value = 520*det; lfo.type = 'sine'; lfo.frequency.value = 1/11; lg.gain.value = 300*det;
      lfo.connect(lg); lg.connect(a.frequency); lp.type = 'lowpass'; lp.frequency.value = 1400; sg.gain.value = 0.33; a.connect(lp); lp.connect(sg); sg.connect(g);
      a.start(t0 + ph*0.3); lfo.start(t0 + ph*0.3); os.push(a, lfo);
    }
    AU.siren = {c, g, os};
  }
  function sfx(name, x, y, z, k){ try { if (window.SGAudio && SGAudio.fx) SGAudio.fx(name, {x, y, z, k}); } catch (e){ /* optional */ } }
  return {init, debris, dust, drip, collapse, impact, frame, eyes, beacon, clear, hide, roar, stomp, siren, sfx, T, P, get inited(){ return inited; }, slab, beam, physDust,
    // [lm27/destruct]
    ensure, flame, fireAt, fireOff, dustRoll, floorBurst, chunk, glass, rubble, rubbleFootprint, rubbleLine, clearWorld, WIND, FIRES, get stats(){ return fxStats(); },
    // [lm28/ruin]
    dustWave, rumble, blastFlash, NBUF, LIGHT};
})();

// ---- 40_world.js ----
/* ================= the world around the creature: ground / water, the real buildings near it, destruction, vehicles =================
   - ground(x, y): the street surface on land; in the sea / rivers the bed it wades on (the terrain where the map has depths, at
     least a depth that grows away from the shore, <= 45 m), so it sinks to its thighs in the harbour.
   - buildings: per 2 km tile a 50 m grid of the tile's real buildings (centre, radius of the footprint, base / top heights), built
     on demand from the list the tile was drawn with (so the record index is the bld.js index: {tile, idx} is the same everywhere).
   - destruction: SGBld.kd (the bld.js work copy) brings the building down in its shader; here: debris and dust in its colours, the
     sound, the app's skip test learns about rubble (the car's and the aircraft's collision indexes drop it).
   - vehicles: traffic near footfalls and strikes is thrown aside (SGTraffic.hit), the player's car spins out when a strike lands
     close; the traffic thins out while the creature is in town (people flee).
   [lm27/destruct] stronger destruction, driven by the impact: KW.apply(list, cx, cy, now, quiet) takes list entries {tile, idx} with
   optional fx, fy (unit impact direction, world x / y), e (impact energy 0-1) and z (impact height, m); without them the push points
   away from (cx, cy) and e = 0.6. A collapse plan (plan(): deterministic from the ids, the building and the quantized direction / energy,
   so a remote destroy() reproduces it; the kind of collapse depends on the ids and the building only) picks per building:
     crush    (low-rise < 22 m, houses)      it shudders, leans in the push direction and crushes into its mound in the tile shader;
     topple   (slender towers, hard pushes)  it leans and falls over in the push direction about the base edge, breaking into its
                                             floors in the air, lands in a long cloud and a line of rubble; the stump pancakes;
     breaktop (tall towers)                  the top section tips over the edge, breaks off and falls beside it; the rest pancakes;
     pancake                                 floor by floor from near the top, dust bursting out of each floor as it goes;
     bite     (tall towers, light blows)     only the struck floors are crushed: the top drops onto the gap, leans and burns; the
                                             tower stands (solid for the car) until a later hit finishes it (the top topples, the
                                             rest pancakes) or the standing-tower budget makes it give way.
   bld.js draws topple / breaktop / pancake / bite with per-building proxies (sliced into floors); the effects here follow the same
   kinematics (SGBld.kd.kin): facade chunks and glass at the impact (window.SGPhys rigid bodies near the camera, GPU debris far away),
   a dust burst out of every floor the pancake front passes, the landing of a toppled top (a rolling dust cloud along the fall line,
   chunks, an impulse that throws traffic, bodies and the player's car, a crunch, a camera shake), rolling dust clouds at the base,
   lingering fires with smoke columns on bitten towers and on part of the ruins (glowing at night), rubble mounds on the footprints.
   KW.blast(x, y, z, r, e) brings down everything in a radius (a slam, a body landing) and returns the accepted list; KW.blastList(...)
   returns the entries without applying them (route them through the game's onDestroy for multiplayer).
   Vehicles: with the destruct patches the traffic is thrown by SGTraffic.toss (rigid bodies in SGPhys: they tumble and settle as
   wrecks) and the player's car by SGF1.crash.impulse (thrown, tumbling, maybe on its roof: R recovers); the old spin is the fallback.
   [lm30/phys2] v33 physics: the pieces scale with the building (a tall, wide tower sheds bigger chunks, broken floor slabs and, from
   offices / malls, steel sections, all rigid bodies in window.SGPhys that tumble, stack and break on hard landings); dust follows the
   falling mass (a trail along a toppling / breaking-off top while it falls, puffs where heavy pieces land); the collapse order keeps
   to the building: the pancake starts near the top (or at the struck floor) and goes down floor by floor, faster as it goes.
   [lm28/ruin] no remnants, landmark destruction, a 10-minute game:
   - the decorations of a destroyed building go with it at once, in all three cities, for remote lists and rebuilt tiles too: bld.js
     (work copy) keeps dead flags that the patched lm20/signs (outlines, crown lines, corner lines, screens, roof and aviation lights,
     shop boards) and lm20/crown read; window glow, roof plant, HDB near / column layers are the building's own meshes; the labels of
     destroyed landmarks and the POI labels on destroyed buildings are hidden (and come back with restore()). No tile rebuilds any
     more (decoStep() stays as a no-op): no remnant for seconds, no rebuild hitch.
   - rubble reads as rubble: bld.js pulls a fallen building into a heap over its plan (dome profile, lumpy, broken roof slabs) with
     a world-space broken-concrete shading (no squeezed window pattern) and embers glowing in fresh ruins at night; the rubble
     blocks here are denser and lie on the heap.
   - landmarks: KW.landmarkHit(x, y, z, r, now, e) still throws dust and chunks, and now also adds damage (the energy of the hit:
     a strike, a slam, footfalls of the creature walking through it); past a threshold growing with the landmark's size the model
     comes down - bridges, islands, airports, memorials stay standing. The show (lmBreak) by kind: towers pancake (explosions
     running down the floors) or topple (the section above a low hinge turns over in the push direction as one body, breaks up as it
     lands, the stump pancakes), halls and domes cave in (the roof from the impact outward, then the walls burst out or fall in), the
     rest crumbles; glass spraying off the facades, fires and smoke columns, a huge dust wave rolling out when the mass lands, chunks
     in the landmark's own colours through SGPhys, explosions, a crunch / rumble, camera shakes, heavy slow motion (gravity x 0.62);
     then a rubble heap on its plan (in lmMeshes: the car drives over it, no ghost walls), the label goes, rigs on it (the Flyer's
     wheel) go with it. The model is cut into chunks (a few per frame while it shudders) and drawn by one proxy mesh whose vertex
     shader moves the chunks (a rigid turn, ballistic flight with tumbling, landing on the heap, sinking into it).
     Contract: {lm:'<key>'} entries (key = LANDMARKS key, unique per city) in onDestroy lists (forwarded by KW itself in a local
     game), destroy([{lm}]) / apply() applies them, restore() rebuilds the models.
   - memory: the building index keeps at most 14 tiles (it held every tile's lists for the whole session), bld.js forgets disposed
     tiles; proxies are built a few per frame (bld.js queue). */
const KW = (() => {
  const isBay = () => { try { return typeof SGR_BAY !== 'undefined' && !!SGR_BAY; } catch (e){ return false; } };
  const isNyc = () => { try { return typeof SGR_NYC !== 'undefined' && !!SGR_NYC; } catch (e){ return false; } };
  const cityKey = () => isNyc() ? 'nyc' : isBay() ? 'bay' : 'sg';
  // ---- water and ground
  function natAt(x, y){ try { if (typeof nat === 'undefined' || typeof cx2i !== 'function') return -1; return nat[cx2i(y)*N + cx2i(x)]; } catch (e){ return -1; } }
  function isWater(x, y){ const v = natAt(x, y); if (v === 1 || v === 2) return true; if (v >= 0) return false; try { return hAt(x, y) < -1; } catch (e){ return false; } }
  const WD = {x:NaN, y:NaN, d:0};
  function depthAt(x, y){
    if (Math.abs(x - WD.x) < 8 && Math.abs(y - WD.y) < 8) return WD.d;
    let n = 0; for (let i = 0; i < 8; i++){ const a = i*Math.PI/4; if (isWater(x + Math.cos(a)*140, y + Math.sin(a)*140)) n++; if (isWater(x + Math.cos(a + 0.4)*320, y + Math.sin(a + 0.4)*320)) n++; }
    let h = 0; try { h = hAt(x, y); } catch (e){ /* */ }
    WD.x = x; WD.y = y; WD.d = Math.min(45, Math.max(-h, 4 + 41*n/16)); return WD.d;
  }
  function ground(x, y){ if (isWater(x, y)) return -depthAt(x, y); try { return hC(x, y); } catch (e){ return 0; } }
  // ---- buildings near a point
  const TILE = () => (SGR.base && SGR.base.TILE) || 2000, TXN = () => Math.round(2*HALF/TILE());
  const tileOf = (x, y) => { const T = TILE(), TX = TXN(), tx = Math.floor((x + HALF)/T), ty = Math.floor((y + HALF)/T); return tx < 0 || ty < 0 || tx >= TX || ty >= TX ? -1 : ty*TX + tx; };
  const BX = new Map(), CS = 50, BX_MAX = 14;
  let stamp = 1, skipOrig = null, bxUse = 0;
  function tileList(ti){ const T = SGR.tiles && SGR.tiles.get(ti); if (T && T.bld && T.bld.list) return T.bld.list; const L = window.SGBld && SGBld.kd && SGBld.kd.live(ti); return L && L.list ? L.list : null; }
  function bxGet(ti){
    const list = tileList(ti); if (!list) return null;
    let X = BX.get(ti); if (X && X.list === list){ X.use = ++bxUse; return X; }
    const T = TILE(), TX = TXN(), x0 = -HALF + (ti % TX)*T, y0 = -HALF + Math.floor(ti/TX)*T, NC = Math.round(T/CS), cells = new Map(), recs = [], byIdx = new Map();
    const skip = skipOrig || (typeof sgrSkipB === 'function' ? sgrSkipB : null);
    for (const B of list){
      if (!B || !B.rings || !B.rings.length || (skip && !B.__kd && skip(B))) continue;
      const R0 = B.rings[0], m = R0.length/2; let r = 0, g = Infinity;
      for (let i = 0; i < m; i++){ const dx = R0[i*2] - B.cx, dy = R0[i*2 + 1] - B.cy; r = Math.max(r, dx*dx + dy*dy); }
      const st = Math.max(1, Math.floor(m/10)); for (let i = 0; i < m; i += st){ try { g = Math.min(g, hC(R0[i*2], R0[i*2 + 1])); } catch (e){ g = 0; } }
      r = Math.sqrt(r)*0.85; const base = B.base > 2 && B.base < B.h - 0.5 ? B.base : 0;
      const rec = {ti, idx:B.i, cx:B.cx, cy:B.cy, r, g, h:B.h, z0:g + base - 1, z1:g + B.h, col:B.wall, B, st:0};
      recs.push(rec); byIdx.set(B.i, rec);
      const i0 = Math.max(0, Math.floor((B.cx - r - x0)/CS)), i1 = Math.min(NC - 1, Math.floor((B.cx + r - x0)/CS)), j0 = Math.max(0, Math.floor((B.cy - r - y0)/CS)), j1 = Math.min(NC - 1, Math.floor((B.cy + r - y0)/CS));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){ const k = j*NC + i; let c = cells.get(k); if (!c) cells.set(k, c = []); c.push(rec); }
    }
    X = {ti, list, x0, y0, NC, cells, recs, byIdx, n:list.length, use:++bxUse}; BX.set(ti, X);
    // [lm28/ruin] at most BX_MAX tiles (each holds its building list): the least recently used goes
    if (BX.size > BX_MAX){ let lo = null; for (const Y of BX.values()) if (Y !== X && (!lo || Y.use < lo.use)) lo = Y; if (lo) BX.delete(lo.ti); }
    return X;
  }
  function bldNear(x, y, r, cb){
    const T = TILE(); stamp++;
    const tis = new Set(); for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r], [0, 0]]){ const ti = tileOf(x + dx, y + dy); if (ti >= 0) tis.add(ti); }
    for (const ti of tis){ const X = bxGet(ti); if (!X) continue;
      const i0 = Math.max(0, Math.floor((x - r - X.x0)/CS)), i1 = Math.min(X.NC - 1, Math.floor((x + r - X.x0)/CS)), j0 = Math.max(0, Math.floor((y - r - X.y0)/CS)), j1 = Math.min(X.NC - 1, Math.floor((y + r - X.y0)/CS));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){ const c = X.cells.get(j*X.NC + i); if (!c) continue; for (const b of c){ if (b.st === stamp) continue; b.st = stamp; cb(b); } } }
  }
  const OWN = new Set();     // destroyed {tile:idx} keys when bld.js has no registry (production bld.js): effects only
  const KD = () => window.SGBld && SGBld.kd ? SGBld.kd : null;
  const kdState = (ti, idx) => { const K = KD(); return K && K.state ? K.state(ti, idx) : (K && K.has(ti, idx) ? 1 : 0); };
  // [lm27/destruct] a bitten tower still stands: the creature can finish it once the bite is a few seconds old
  const BITE_IMMUNE = 10, BITTEN = new Map();
  function destroyed(ti, idx){
    const K = KD(); if (!K) return OWN.has(ti + ':' + idx);
    const s = kdState(ti, idx); if (s !== 2) return s === 1;
    const t = BITTEN.get(ti + ':' + idx); return !(t !== undefined && W.now - t > BITE_IMMUNE);
  }
  function recOf(ti, idx){ const X = bxGet(ti); return X ? X.byIdx.get(idx) || null : null; }
  // the app's skip test also skips rubble (the tile hooks: signs, crowns, lights; the drive / fly collision indexes)
  function wrapSkip(){
    try { if (typeof sgrSkipB === 'function' && !sgrSkipB.__kj){ const o = sgrSkipB; skipOrig = o; const w = function(B){ return (B && B.__kd === 1) || o(B); }; w.__kj = 1; w.orig = o; sgrSkipB = w; } else if (typeof sgrSkipB === 'function' && sgrSkipB.orig) skipOrig = sgrSkipB.orig; } catch (e){ /* app without the hook */ }
  }
  // ---------------------------------------------------------------- [lm27/destruct] the collapse plan
  const W = {now:0, seq:0};
  // deterministic numbers from the ids
  function hid(ti, idx, k){ let h = Math.imul((ti | 0) + 0x9e3779b1*(k + 1), 0x85ebca6b) ^ Math.imul((idx | 0) + 0x632be5ab*(k + 7), 0xc2b2ae35); h ^= h >>> 16; h = Math.imul(h, 0x7feb352d); h ^= h >>> 15; h = Math.imul(h, 0x846ca68b); h ^= h >>> 16; return (h >>> 0)/4294967296; }
  const qAng = a => Math.round(((a % (Math.PI*2)) + Math.PI*2) % (Math.PI*2)/(Math.PI*2)*256) % 256/256*Math.PI*2;
  const qE = e => Math.round(Math.max(0, Math.min(1, e))*16)/16;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  // b: a record of the index (bxGet); ang: push direction (world rad); e: energy 0-1; z: impact height (m) or undefined
  function plan(b, ang, e, z){
    const H = Math.max(3, b.h), ti = b.ti, idx = b.idx, u1 = hid(ti, idx, 1), u2 = hid(ti, idx, 2), u3 = hid(ti, idx, 3), u4 = hid(ti, idx, 4), u5 = hid(ti, idx, 5), u6 = hid(ti, idx, 6);
    const dx = Math.cos(ang), dy = Math.sin(ang), R0 = b.B.rings[0], m = R0.length/2; let rf = 0, rb = 0, rl = 0;
    for (let i = 0; i < m; i++){ const vx = R0[i*2] - b.cx, vy = R0[i*2 + 1] - b.cy, d = vx*dx + vy*dy, l = Math.abs(-vx*dy + vy*dx); if (d > rf) rf = d; if (-d > rb) rb = -d; if (l > rl) rl = l; }
    const depth = Math.max(4, rf + rb), slender = H/depth, t = b.B.t, base = b.B.base > 2 && b.B.base < H - 0.5;
    const dz = Math.round(Math.max(3.2, H/36)*20)/20, nb = Math.max(2, Math.ceil(H/dz));
    const P = {mode:'crush', ang, e, g:b.g, H, dz, nb, kLo:nb, kHi:nb, Rf:rf, Rb:rb, Rl:rl, cx:b.cx, cy:b.cy, ts:0.3 + 0.2*u5, mk:1, lean:0, w0:0, f0:H, acc:9.81*0.5, seed:u6, ti, idx};
    if (H < 22 || t === 3 || base || b.B.foreign) { P.dur = Math.min(14, (3 + Math.sqrt(H)*0.42)*(1.15 - 0.4*e)); return P; }
    // the kind of collapse depends on the ids and the building only (a remote client without the impact data agrees); the energy sets
    // its violence (shudder, fall speed, pancake speed, lean, debris) and the impact height where the bite / the pancake starts
    const zr = z !== undefined && isFinite(z) ? (z - b.g)/H : -1;
    const pTop = slender > 2.4 ? 0.45 : slender > 1.5 ? 0.26 : 0.04;
    const pBreak = H > 45 ? 0.22 : 0.08;
    const pBite = H > 55 ? 0.24 : 0;
    const pPan = Math.max(0.2, 1 - pTop - pBreak - pBite), sum = pTop + pBreak + pBite + pPan, u = u1*sum;
    P.mode = u < pTop ? 'topple' : u < pTop + pBreak ? 'breaktop' : u < pTop + pBreak + pBite ? 'bite' : 'pancake';
    P.ts = P.mode === 'bite' ? 0.06 : 0.25 + 0.35*(1 - e)*u5;
    if (P.mode === 'topple'){ P.kLo = P.kHi = clamp(Math.round(nb*(0.02 + 0.16*u2)), 0, nb - 3); P.w0 = 0.04 + 0.28*e + 0.05*u3; P.mk = 0.75; }
    else if (P.mode === 'breaktop'){ P.kLo = P.kHi = clamp(Math.round(nb*(0.5 + 0.3*u2)), 2, nb - 2); P.w0 = 0.08 + 0.32*e + 0.05*u3; P.mk = 0.9; }
    else if (P.mode === 'pancake'){ P.f0 = zr > 0.2 && zr < 0.95 ? zr*H : H*(0.7 + 0.27*u2); P.acc = 9.81*(0.3 + 0.25*e + 0.12*u3); P.mk = 1; }
    else { // bite
      const kz = zr > 0.2 && zr < 0.9 ? Math.floor(zr*nb) : Math.floor(nb*(0.42 + 0.38*u2)), w = clamp(1 + Math.floor(u3*2 + e*1.5), 1, 3);
      P.kLo = clamp(kz - (w >> 1), 2, nb - 4); P.kHi = P.kLo + w; P.lean = 0.035 + 0.08*u4 + 0.04*e; P.mk = 0.9; }
    return P;
  }
  // ---------------------------------------------------------------- apply a destruction list (local or remote)
  const DECO = new Map();    // tile -> time it was last hit (kept for stats; the decorations go at once now)
  const FXB = {t:0, n:0, snd:0, sndT:0};
  const TRK = [];            // collapses with effects still to come
  function apply(list, cx, cy, now, quiet){
    const out = []; if (now !== undefined && isFinite(now)) W.now = now; else now = W.now;
    const K = KD(); wrapSkip();
    for (const it of list){
      // [lm28/ruin] a landmark entry {lm:'<key>', fx, fy, e}
      if (it && it.lm !== undefined){ const r = lmApply(it, cx, cy, quiet); if (r) out.push(r); continue; }
      const ti = it.tile | 0, idx = it.idx | 0, st = kdState(ti, idx);
      if (st === 1 || (!K && OWN.has(ti + ':' + idx))) continue;
      const b = recOf(ti, idx);
      if (st === 2){ if (finish(ti, idx, b, now, quiet)) out.push({tile:ti, idx, fin:1}); continue; }
      let ang = it.fx !== undefined && (it.fx || it.fy) ? Math.atan2(it.fy, it.fx) : it.ang !== undefined ? it.ang : b ? Math.atan2(b.cy - cy, b.cx - cx) : 0;
      ang = qAng(ang); const e = qE(it.e !== undefined ? +it.e : 0.6);
      const P = b && K && K.kin ? plan(b, ang, e, it.z) : null;
      const dur = P && P.dur ? P.dur : b ? Math.min(14, 3 + Math.sqrt(b.h)*0.42) : 5;
      let info = null;
      if (K) info = K.destroy(ti, idx, {ang:Math.atan2(-Math.sin(ang), Math.cos(ang)), g:b ? b.g : 0, h:b ? b.h : 20, dur, n:b ? bxGet(ti).n : idx + 1, e, lean:P ? 0.25 + 0.75*e : 0, mk:P ? P.mk : 1, plan:P,
        cx:b ? b.cx : undefined, cy:b ? b.cy : undefined, R:b ? b.r/0.85*0.92 : undefined});
      else OWN.add(ti + ':' + idx);
      out.push({tile:ti, idx, fx:+Math.cos(ang).toFixed(4), fy:+Math.sin(ang).toFixed(4), e});
      DECO.set(ti, now);
      if (b){ lblDead(b); }
      if (b && !quiet){
        if (FXB.t !== now){ FXB.t = now; FXB.n = 0; }
        FXB.n++;
        if (P && info && K.kin) track(b, P, info, FXB.n);
        else if (FXB.n < 7) KFX.collapse(b, ang, FXB.n > 3 ? 0.5 : 1);
        if (now - FXB.sndT > 0.35){ FXB.sndT = now; KFX.sfx(b.h > 40 ? 'crunch' : 'debris', b.cx, b.cy, b.g + Math.min(b.h, 60)*0.5, Math.min(1, 0.4 + b.h/150)); if (b.h > 60 && (b.B.t === 5 || b.B.t === 4)) KFX.sfx('glass', b.cx, b.cy, b.g + 20, 0.7); }
      }
      if (info && info.mode === 2) BITTEN.set(ti + ':' + idx, now);
    }
    if (out.length){ const tiles = new Set(out.filter(o => o.tile !== undefined).map(o => o.tile)); for (const ti of tiles) dirty(ti);
      try { if (window.SGPhys && SGPhys.wake){ for (const o of out){ if (o.tile === undefined) continue; const b = recOf(o.tile, o.idx); if (b) SGPhys.wake(b.cx, b.cy, b.r + 20); } } } catch (e){ /* optional */ } }
    return out;
  }
  function dirty(ti){ try { if (window.SGF1 && SGF1.bldDirty) SGF1.bldDirty(ti); } catch (e){ /* */ } try { if (window.SGFly && SGFly.bldDirty) SGFly.bldDirty(ti); } catch (e){ /* */ } }
  // a standing bitten tower is hit again: it gives way (its top topples in the lean direction, the rest pancakes)
  function finish(ti, idx, b, now, quiet){
    const K = KD(); if (!K || !K.finish) return false; const r = K.finish(ti, idx); if (!r) return false;
    BITTEN.delete(ti + ':' + idx); DECO.set(ti, now); dirty(ti);
    // [lm28/ruin] the fires in its broken floors go with it (they must not stay hanging in the air)
    if (b) try { KFX.fireOff(b.cx, b.cy, b.r + 12); } catch (e){ /* */ }
    let T = TRK.find(q => q.ti === ti && q.idx === idx);
    if (!T && b && !quiet){ T = track(b, r.plan, {proxy:true, mode:1, t0:r.t0}, 1); T.bit = true; }
    if (T){ T.fin = true; T.landed = false; T.lastBand = 1e9; T.done = false; }
    if (b && !quiet) KFX.sfx('crunch', b.cx, b.cy, b.g + b.h*0.5, 1);
    return true;
  }
  // ---------------------------------------------------------------- [lm27/destruct] the effects of a collapse, following its kinematics
  const KU = {};
  const cosA = P => Math.cos(P.ang), sinA = P => Math.sin(P.ang);
  // [lm28/ruin] shake(a, x, y, z): a = the v30 amount (already faded with the camera distance), x, y, z = where it happens (world m);
  // the game module turns it into its calm camera shake (kaiju3's KG.shakeIn / KG.shakeAt when there, else the old shake level)
  function shake(a, x, y, z){ try { if (typeof KG === 'undefined') return; if (typeof KG.shakeIn === 'function') return KG.shakeIn(a, x, y, z); if (typeof KG.shakeAt === 'function') return KG.shakeAt(a, x, y, z); const G = KG.G; G.shake = Math.min(6, G.shake + a); } catch (e){ /* the game module */ } }
  function camD(x, y, z){ try { const c = camera.position; return Math.hypot(c.x - x, -c.z - y, c.y - (z || 0)); } catch (e){ return 0; } }
  // v31 (kaiju3's policy, merged here): a radial push on the bodies and the traffic (window.SGPhys) that reaches the player's car only
  // within carR of the centre (the debris actually landing on it), never as a buzz from everything nearby; without SGPhys the traffic only
  function pushWorld(x, y, z, r, k, carR){
    const F = window.SGF1, C = F && F.crash, orig = C && typeof C.impulse === 'function' ? C.impulse : null; let swapped = false;
    try {
      if (orig){ C.impulse = (x2, y2, z2, r2, k2) => carR > 0 ? orig.call(C, x2, y2, z2, Math.min(r2, carR), k2) : 0; swapped = true; }
      if (window.SGPhys && SGPhys.impulse){ SGPhys.impulse(x, y, z, r, k); return true; }
    } catch (e){ /* optional */ } finally { if (swapped) C.impulse = orig; }
    tossTraffic(x, y, r, k/16); return false;
  }
  function track(b, P, info, nth){
    KFX.ensure();
    // no proxy (too many at once, far away): the building crushes in its tile - the effects follow that
    if (!info.proxy && P.mode !== 'crush') P = Object.assign({}, P, {mode:'crush', dur:Math.min(14, 3 + Math.sqrt(b.h)*0.42)});
    const T = {ti:b.ti, idx:b.idx, b, P, t0:info.t0 !== undefined ? info.t0 : (KD() ? KD().clock() : 0), r:info.r || null, proxy:!!info.proxy, lastBand:1e9, landed:false, fin:false, done:false, nth, chunkT:0, fireDone:false, lod:camD(b.cx, b.cy, b.g) < 3000 ? 1 : 0.35};
    if (TRK.length > 64){ const o = TRK.shift(); if (o.P.mode !== 'bite') endFx(o); }
    TRK.push(T);
    startFx(T);
    return T;
  }
  const rnd = (a, b) => a + Math.random()*(b - a);
  function colOf(b){ return b.col || [0.62, 0.6, 0.57]; }
  // [lm30/phys2] how big the pieces of a building are (1 for a small block, up to ~2.2 for a tall, wide tower); does it have a steel frame
  function pieceK(b){ return 1 + Math.min(1.2, Math.sqrt(Math.max(0, b.h - 20)*Math.max(0, b.r - 6))/45); }
  function steelFrame(b){ const t = b.B && b.B.t; return (t === 4 || t === 5 || t === 12 || t === 9) && b.h > 30; }
  // a facade point of the building at height z on the side facing (sx, sy) (+- spread), with its outward normal
  const FP = {x:0, y:0, nx:0, ny:0};
  function facade(b, sx, sy, spread){
    const a = Math.atan2(sy, sx) + (Math.random() - 0.5)*spread, R0 = b.B.rings[0], m = R0.length/2, ux = Math.cos(a), uy = Math.sin(a);
    let best = 0; for (let i = 0; i < m; i++){ const d = (R0[i*2] - b.cx)*ux + (R0[i*2 + 1] - b.cy)*uy; if (d > best) best = d; }
    FP.x = b.cx + ux*best*0.98; FP.y = b.cy + uy*best*0.98; FP.nx = ux; FP.ny = uy; return FP;
  }
  // impact: chunks and glass off the struck side (facing the push's origin), a dust puff there
  function startFx(T){
    const b = T.b, P = T.P, dx = cosA(P), dy = sinA(P), col = colOf(b), k = T.lod*(T.nth > 4 ? 0.5 : 1), glassy = b.B.t === 5 || (b.B.t === 4 && b.h > 60) || b.B.t === 10;
    const zh = P.mode === 'bite' ? b.g + (P.kLo + (P.kHi - P.kLo)*0.5)*P.dz : b.g + b.h*rnd(0.3, 0.85);
    const n = Math.round(Math.min(16, 4 + b.h/14)*k), ng = glassy ? Math.round(10*k) : 0;
    const pk = pieceK(b);
    for (let i = 0; i < n; i++){ const p = facade(b, -dx, -dy, 2.2), sp = rnd(6, 16)*(0.5 + P.e);
      KFX.chunk(p.x, p.y, P.mode === 'bite' ? zh + rnd(-P.dz, P.dz) : b.g + Math.random()*b.h, dx*sp + p.nx*rnd(1, 5) + rnd(-3, 3), dy*sp + p.ny*rnd(1, 5) + rnd(-3, 3), rnd(-2, 6), (rnd(0.8, 2.6) + Math.min(3, b.h*0.015))*(i % 3 === 0 ? pk : 1), col); }
    if (pk > 1.3 && KFX.slab && T.lod > 0.5) for (let i = 0; i < Math.round(pk*1.5); i++){ const p = facade(b, -dx, -dy, 1.6), sp = rnd(4, 10)*(0.5 + P.e);
      KFX.slab(p.x, p.y, P.mode === 'bite' ? zh : b.g + b.h*rnd(0.4, 0.9), dx*sp + p.nx*rnd(1, 3), dy*sp + p.ny*rnd(1, 3), rnd(-1, 3), rnd(2.2, 3.4)*pk, rnd(1.6, 2.6)*pk, col); }
    for (let i = 0; i < ng; i++){ const p = facade(b, -dx, -dy, 3); KFX.glass(p.x, p.y, b.g + Math.random()*b.h, dx*rnd(3, 9) + p.nx*rnd(1, 4), dy*rnd(3, 9) + p.ny*rnd(1, 4), rnd(-1, 3)); }
    if (P.mode !== 'crush'){ const p = facade(b, -dx, -dy, 0.6); KFX.floorBurst(p.x, p.y, zh, 6 + b.r*0.15, col, 0.8*k, dx, dy); }
    if (P.mode === 'bite'){ KFX.floorBurst(b.cx, b.cy, zh, b.r*0.95, col, 1.2*k, dx, dy); KFX.sfx('glass', b.cx, b.cy, zh, 0.8); }
  }
  // per frame: floor bursts at the pancake front, the landing of a toppled / broken-off top, fires; the end: rubble, smoke, fires
  function trackStep(){
    const K = KD(); if (!TRK.length || !K || !K.kin) return;
    const now = K.clock();
    for (let q = TRK.length - 1; q >= 0; q--){
      const T = TRK[q];
      // [lm28/ruin] a queued proxy (bld.js builds a few per frame): wait for its start; one that could not be built crushes in its tile
      if (T.r){ if (T.r.pend) continue; if (T.t0 !== T.r.t0) T.t0 = T.r.t0; if (T.r.mode === 0 && T.P.mode !== 'crush' && !T.fin) T.P = Object.assign({}, T.P, {mode:'crush', dur:T.r.dur}); }
      const P = T.P, b = T.b, t = now - T.t0, col = colOf(b), dx = cosA(P), dy = sinA(P);
      if (P.mode === 'crush'){
        if (!T.cr && t > P.ts){ T.cr = true; KFX.dustRoll(b.cx, b.cy, b.g, b.r, b.h, col, T.lod*0.8);
          const n = Math.round(Math.min(10, 2 + b.h/6)*T.lod); for (let i = 0; i < n; i++){ const p = facade(b, dx, dy, 3), sp = rnd(3, 9)*(0.4 + P.e); KFX.chunk(p.x, p.y, b.g + Math.random()*b.h*0.8, dx*sp + p.nx*2, dy*sp + p.ny*2, rnd(0, 4), rnd(0.8, 2.2), col); } }
        if (t > (P.dur || 5)*0.75 && !T.done){ T.done = true; endFx(T); TRK.splice(q, 1); }
        continue;
      }
      const U = K.kin(P, t, KU);
      // the pancake front: a burst at every floor it passes (at most two a frame)
      if (U.front < P.H){
        const band = Math.floor(U.front/P.dz);
        if (band < T.lastBand){ let n = 0; for (let k = Math.min(T.lastBand - 1, band + 1); k >= band && n < 2; k--, n++){ if (k < 0) break;
            if (T.lod > 0.5 || k % 3 === 0) KFX.floorBurst(b.cx, b.cy, P.g + (k + 0.5)*P.dz, b.r*0.9, col, T.lod, 0, 0);
            if (k % 2 === 0 && T.lod > 0.5){ const p = facade(b, Math.random() - 0.5, Math.random() - 0.5, 6.3); KFX.chunk(p.x, p.y, P.g + (k + 0.5)*P.dz, p.nx*rnd(3, 8), p.ny*rnd(3, 8), rnd(0, 3), rnd(0.8, 2.2)*(k % 4 === 0 ? pieceK(b) : 1), col); }
            // [lm30/phys2] a big building sheds broken floor slabs and (steel frame) sections from the floors the front passes
            if (T.lod > 0.5 && KFX.slab && pieceK(b) > 1.3 && k % 3 === 1){ const pk = pieceK(b), p = facade(b, Math.random() - 0.5, Math.random() - 0.5, 6.3);
              KFX.slab(p.x + p.nx*1.5, p.y + p.ny*1.5, P.g + (k + 0.5)*P.dz, p.nx*rnd(2, 6), p.ny*rnd(2, 6), rnd(-1, 2), rnd(2, 3.2)*pk, rnd(1.4, 2.4)*pk, col);
              if (steelFrame(b) && k % 6 === 1) KFX.beam(p.x + p.nx*2, p.y + p.ny*2, P.g + (k + 0.5)*P.dz, p.nx*rnd(3, 7), p.ny*rnd(3, 7), rnd(0, 3), rnd(4, 8)); } }
          if (T.lastBand === 1e9) KFX.sfx('crunch', b.cx, b.cy, P.g + U.front, 0.8);
          T.lastBand = band; }
        if (U.front <= 0 && !T.base){ T.base = true; KFX.dustRoll(b.cx, b.cy, P.g, b.r, P.mode === 'pancake' ? P.H : P.hk || P.H*0.3, col, T.lod*(P.mode === 'pancake' ? 1.2 : 0.8)); shake(1.2*Math.exp(-camD(b.cx, b.cy, P.g)/800), b.cx, b.cy, P.g); KFX.sfx('debris', b.cx, b.cy, P.g + 5, 0.9); }
      }
      // the falling top: a dust trail while it falls, then the landing
      if ((P.mode === 'topple' || P.mode === 'breaktop' || (P.mode === 'bite' && T.fin)) && U.phase !== 'shudder'){
        // [lm30/phys2] dust follows the falling mass: puffs shed along the toppling / breaking-off section while it is in the air
        if (!T.landed && U.theta > 0.12 && T.lod > 0.5 && KFX.physDust && (T.dustT = (T.dustT || 0) - 1) <= 0){ T.dustT = 3; const s = (P.hk || 0) + P.L*0.6, tz = Math.cos(U.theta), tx = Math.sin(U.theta);
          for (let q2 = 0; q2 < 2; q2++){ const f = q2 ? 0.75 : 0.35, a = P.Rf + tx*s*f + U.slide, x = P.cx + dx*a + rnd(-P.W, P.W)*0.3, y = P.cy + dy*a + rnd(-P.W, P.W)*0.3, z = P.g + Math.max(3, (P.hk || 0) + tz*s*f - U.drop);
            KFX.physDust(x, y, z, Math.min(3, 0.8 + P.W/12), col, true); } }
        if (!T.landed && U.theta > 0.25 && T.lod > 0.5 && (T.chunkT -= 1) <= 0){ T.chunkT = 6; const s = (P.hk || 0) + P.L*0.6, x = P.cx + dx*(P.Rf + Math.sin(U.theta)*s*0.5 + U.slide), y = P.cy + dy*(P.Rf + Math.sin(U.theta)*s*0.5 + U.slide);
          KFX.chunk(x + rnd(-6, 6), y + rnd(-6, 6), P.g + Math.max(4, P.hk + Math.cos(U.theta)*s - U.drop), dx*rnd(4, 10), dy*rnd(4, 10), rnd(-4, 2), rnd(1, 3), col); }
        if (U.landed && !T.landed){ T.landed = true; landFx(T, U); }
      }
      if (P.mode === 'bite' && !T.fin){
        if (U.landed && !T.bit){ T.bit = true; const zb = P.g + P.kLo*P.dz; KFX.floorBurst(b.cx, b.cy, zb, b.r, col, T.lod*1.3, dx, dy); KFX.sfx('crunch', b.cx, b.cy, zb, 1); shake(0.8*Math.exp(-camD(b.cx, b.cy, zb)/800), b.cx, b.cy, zb);
          // fires in the broken floors, smoke from the gap
          const nf = 1 + Math.round(hid(T.ti, T.idx, 9)*2); for (let i = 0; i < nf; i++){ const p = facade(b, Math.cos(P.ang + i*2.1), Math.sin(P.ang + i*2.1), 0.8); KFX.fireAt(p.x, p.y, zb + P.dz*0.3, Math.min(12, 3.5 + b.r*0.18), 150 + 150*hid(T.ti, T.idx, 10 + i), i === 0); } }
        if (T.bit && t > P.tdrop + 4) TRK.splice(q, 1);   // it stands: nothing more until it is finished (finish() tracks it again)
        continue;
      }
      if (t > P.tEnd - 0.2 && !T.done){ T.done = true; endFx(T); TRK.splice(q, 1); }
    }
  }
  // the top hits the ground: a rolling cloud along the fall line, chunks thrown up, an impulse (traffic, bodies, the car), a crunch
  function landFx(T, U){
    const P = T.P, b = T.b, dx = cosA(P), dy = sinA(P), col = colOf(b);
    const len = P.mode === 'breaktop' ? Math.max(P.W, P.L*0.6) : P.L + (P.hk || 0)*0.3, s0 = P.Rf + (P.mode === 'breaktop' ? U.slide + P.L*0.3 : 0);
    const n = Math.max(2, Math.min(7, Math.round(len/30)));
    for (let k = 0; k < n; k++){ const s = s0 + (k + 0.5)/n*len, x = P.cx + dx*s, y = P.cy + dy*s; let gz = P.g; try { gz = hC(x, y); } catch (e){ /* */ }
      KFX.dustRoll(x, y, gz, Math.max(10, P.W*0.6), Math.min(80, P.W + 20), col, T.lod*(k === n - 1 ? 1.1 : 0.7));
      // bodies, the traffic (SGTraffic.toss) and the player's car (SGF1.crash.impulse) are thrown by the physics module's impulse
      // v31: the player's car only where the falling section lands on it (crushCar below; the impulse within W/2 of the line)
      const pushed = pushWorld(x, y, gz, Math.max(25, P.W*1.3), 6 + 10*P.e, Math.max(6, P.W*0.5));
      if (pushed) try { if (window.SGBreak && SGBreak.blast) SGBreak.blast(x, y, Math.max(20, P.W*0.8), 4e5); } catch (e){ /* */ }
      if (T.lod > 0.5) for (let i = 0; i < 4; i++) KFX.chunk(x + rnd(-P.W, P.W)*0.5, y + rnd(-P.W, P.W)*0.5, gz + rnd(2, 10), dx*rnd(2, 8) + rnd(-6, 6), dy*rnd(2, 8) + rnd(-6, 6), rnd(5, 14), rnd(1, 3.2)*(i === 0 ? pieceK(b) : 1), col);
      if (T.lod > 0.5 && KFX.slab && P.W > 12){ const pk = pieceK(b); KFX.slab(x + rnd(-P.W, P.W)*0.4, y + rnd(-P.W, P.W)*0.4, gz + rnd(3, 8), dx*rnd(2, 6) + rnd(-4, 4), dy*rnd(2, 6) + rnd(-4, 4), rnd(4, 10), rnd(2.4, 3.6)*pk, rnd(1.6, 2.6)*pk, col);
        if (steelFrame(b) && k % 2 === 0) KFX.beam(x + rnd(-P.W, P.W)*0.4, y + rnd(-P.W, P.W)*0.4, gz + rnd(3, 9), dx*rnd(2, 7) + rnd(-4, 4), dy*rnd(2, 7) + rnd(-4, 4), rnd(6, 13), rnd(5, 9)); }
      crushCar(x, y, gz, Math.max(8, P.W*0.55), P);
    }
    KFX.rubbleLine(P.cx + dx*s0, P.cy + dy*s0, dx, dy, len, P.W*0.9, P.g, P.H, col, Math.round(Math.min(70, 10 + len*P.W/100)*T.lod));
    KFX.sfx('crunch', P.cx + dx*(s0 + len*0.5), P.cy + dy*(s0 + len*0.5), P.g + 5, 1); KFX.sfx('debris', P.cx + dx*(s0 + len*0.8), P.cy + dy*(s0 + len*0.8), P.g + 3, 1);
    { const mx = P.cx + dx*(s0 + len*0.5), my = P.cy + dy*(s0 + len*0.5); shake(3*Math.exp(-camD(mx, my, P.g)/900), mx, my, P.g); }
    try { if (window.SGBreak && SGBreak.blast) SGBreak.blast(P.cx + dx*(s0 + len*0.5), P.cy + dy*(s0 + len*0.5), len*0.55, 6e5); } catch (e){ /* optional */ }
  }
  // a falling section lands on / next to the player's car: crushing damage and a shove away from the line
  function crushCar(x, y, z, r, P){
    try { const F = window.SGF1; if (!F || !F.F1 || !F.F1.on || !F.crash || !F.crash.hit) return; const C = F.CAR, d = Math.hypot(C.x - x, C.y - y); if (d > r + 4 || Math.abs((C.z || 0) - z) > 12) return;
      const m = 1500, ang = P && P.ang !== undefined ? P.ang : 0, dvx = (C.x - x)/(d || 1)*6 + Math.cos(ang)*4, dvy = (C.y - y)/(d || 1)*6 + Math.sin(ang)*4, k = d < r ? 1 : 0.4;
      F.crash.hit(dvx*m*k, dvy*m*k, -4*m*k, C.x, C.y, (C.z || 0) + 1.4, (d < r ? 6e5 : 1.5e5), 'building'); } catch (e){ /* optional */ }
  }
  // collapse over: rubble on the footprint (on the heap bld.js draws), fires and smoke on part of the ruins
  function endFx(T){
    const b = T.b, P = T.P, col = colOf(b);
    KFX.rubbleFootprint(b.B.rings[0], b.cx, b.cy, P.g !== undefined ? P.g : b.g, b.h, col, Math.round(Math.min(48, 6 + b.r*0.7)*(T.lod > 0.5 ? 1 : 0.4)));
    if (b.h > 25 && hid(T.ti, T.idx, 11) < 0.32){ const s = Math.min(13, 4 + b.r*0.14); KFX.fireAt(b.cx + rnd(-b.r, b.r)*0.3, b.cy + rnd(-b.r, b.r)*0.3, (P.g || b.g) + Math.min(10, 0.05*b.h + 2), s, 90 + 120*hid(T.ti, T.idx, 12), true); }
  }
  // [lm28/ruin] the decorations of fallen buildings go at once (bld.js dead flags, signs / crown patches): no tile rebuilds any more
  function decoStep(now, busyNear){ W.now = now; }
  function restore(){
    const tiles = window.SGBld && SGBld.kd ? SGBld.kd.restore() : []; OWN.clear(); DECO.clear(); BITTEN.clear(); TRK.length = 0;
    const nl = lmRestoreAll();
    lblRestore();
    try { KFX.clearWorld(); } catch (e){ /* */ }
    try { if (window.SGPhys && SGPhys.clear) SGPhys.clear(); } catch (e){ /* */ }
    // tiles rebuilt while their buildings lay in ruins left those buildings' decorations out (the skip test): build them again
    try { if (tiles.length && typeof sgrQueueTiles === 'function') sgrQueueTiles(new Set(tiles)); } catch (e){ /* */ }
    for (const ti of tiles) dirty(ti);
    return tiles.length + nl;
  }
  // ---------------------------------------------------------------- [lm27/destruct] a blast: everything in a radius
  function blastList(x, y, z, r, e){
    const L = [], ee = e === undefined ? 0.8 : clamp(e, 0, 1);
    bldNear(x, y, r + 60, b => {
      if (destroyed(b.ti, b.idx)) return; const d = Math.hypot(b.cx - x, b.cy - y), dd = d - b.r; if (dd > r) return;
      if ((z || 0) + r < b.z0 || (z || 0) - r > b.z1) return;
      L.push({tile:b.ti, idx:b.idx, b, fx:d > 0.1 ? (b.cx - x)/d : 1, fy:d > 0.1 ? (b.cy - y)/d : 0, e:clamp(ee*(1 - 0.6*Math.max(0, dd)/r), 0, 1)});
    });
    return L;
  }
  function blast(x, y, z, r, e){
    const ee = e === undefined ? 0.8 : clamp(e, 0, 1), L = blastList(x, y, z, r, ee), out = apply(L, x, y, W.now, false), gz = ground(x, y), water = isWater(x, y);
    KFX.ensure(); KFX.impact(x, y, water ? 0 : gz, Math.min(120, r*0.6), water, 1.2 + ee);
    if (!water) KFX.dustRoll(x, y, gz, r*0.4, 30 + r*0.3, [0.55, 0.52, 0.47], 1);
    pushWorld(x, y, z || gz, r*1.5, 8 + 22*ee, r*0.4);   // v31: the car only at the heart of the blast
    try { if (window.SGBreak && SGBreak.blast) SGBreak.blast(x, y, r*1.2, 4e5 + 1e6*ee); } catch (e2){ /* */ }
    // [lm28/ruin] landmarks in the blast take a heavy hit (a slam breaks most of them)
    const lb = lmHit(x, y, gz, r*0.6, W.now, Math.min(1, ee*1.5), true);
    if (Array.isArray(lb)) for (const o of lb) out.push(o);
    shake(4*Math.exp(-camD(x, y, gz)/900), x, y, gz);
    return out;
  }
  // ---- vehicles
  const OBL = [];
  function tossTraffic(x, y, r, k){
    const T = window.SGTraffic; if (!T || !T.obstacles || !T.hit) return 0; let n = 0;
    // [lm27/destruct] trees and lamp poles nearby fall away from it (f1d patch: SGBreak.blast)
    try { if (window.SGBreak && SGBreak.blast) SGBreak.blast(x, y, Math.min(60, r*0.45), 2.5e5*(k || 1)); } catch (e){ /* optional */ }
    // [lm27/destruct] the destruct traffic patch: thrown cars become tumbling rigid bodies
    try { if (T.toss) return T.toss(x, y, ground(x, y), r, 9 + 13*(k || 1)); } catch (e){ /* fall back */ }
    try { T.obstacles(x, y, r, OBL); for (const o of OBL){ const dx = o.x - x, dy = o.y - y, d = Math.hypot(dx, dy) || 1, f = (1 - d/r)*k; if (f <= 0) continue;
      const m = o.m || 1500, v = 6 + 16*f; T.hit(o.id, dx/d*m*v, dy/d*m*v, o.x - dx/d*1.5, o.y - dy/d*1.5, m*v*v*0.5); n++; } } catch (e){ /* */ }
    return n;
  }
  // panic: cars within r of the creature that still drive get a small sideways shove - they swerve out of the lane, stop and hoot
  // (the traffic module's crash state); one call a second is enough
  function panicTraffic(x, y, r){
    const T = window.SGTraffic; if (!T || !T.obstacles || !T.hit) return 0; let n = 0;
    try { T.obstacles(x, y, r, OBL); for (const o of OBL){ if (o.crash || n > 12) continue; const m = o.m || 1500, side = ((o.id*7919) & 1) ? 1 : -1, v = 2.2;
      T.hit(o.id, -o.hy*side*m*v, o.hx*side*m*v, o.x, o.y, 0); n++; } } catch (e){ /* */ }
    return n;
  }
  // the player's car near a strike: [lm27/destruct] thrown into the air and tumbling (SGF1.crash.impulse of the destruct patch);
  // without it: spun, slowed (SGF1 internals, guarded). v31 (kaiju3): only a limb (a claw, a tentacle, jaws, talons) that actually
  // reaches the car shoves it: within REACH m of the strike's centre
  const REACH = 34; let tossN = 0;
  function tossCar(x, y, d, k){
    try { const C = window.SGF1 && SGF1.F1 && SGF1.F1.on ? SGF1.CAR : null; if (!C) return false; const dc = Math.hypot(C.x - x, C.y - y), f = Math.max(0, 1 - Math.min(d, dc)/REACH)*k; if (f <= 0) return false;
      tossN++;
      if (SGF1.crash && SGF1.crash.impulse){ const z = ground(x, y); SGF1.crash.impulse(x, y, z, REACH + 14, 8 + 8*k); try { if (SGAudio && SGAudio.fx) SGAudio.fx('crunch', {x:C.x, y:C.y, z:C.z + 0.5, k:0.5 + 0.5*f}); } catch (e){ /* */ } return true; }
      C.r = (C.r || 0) + (Math.random() < 0.5 ? -1 : 1)*(0.8 + 1.8*f); C.u = (C.u || 0)*(1 - 0.5*f); if (C.v !== undefined) C.v += (Math.random() - 0.5)*8*f;
      try { if (SGAudio && SGAudio.fx) SGAudio.fx('crash', {x:C.x, y:C.y, z:C.z + 0.5, k:0.4 + 0.5*f}); } catch (e){ /* */ }
      return true; } catch (e){ return false; }
  }

  // ================================================================ [lm28/ruin] labels: no names floating over ruins
  // dead zones: destroyed buildings (their footprint ring) and destroyed landmarks (their ground plan); the app's label items inside one
  // (landmark labels, POI labels: class 'lm' / 'poi') are hidden through their maxD; re-applied when the app rebuilds its labels
  const LBL = {zones:new Map(), items:null, n:-1, dirty:false, t:0, hid:0};
  const lblKey = (x, y) => Math.floor(x/100)*100003 + Math.floor(y/100);
  function lblAdd(Z){ const x0 = Math.floor(Z.bb[0]/100), x1 = Math.floor(Z.bb[2]/100), y0 = Math.floor(Z.bb[1]/100), y1 = Math.floor(Z.bb[3]/100);
    for (let i = x0; i <= x1; i++) for (let j = y0; j <= y1; j++){ const k = i*100003 + j; let a = LBL.zones.get(k); if (!a) LBL.zones.set(k, a = []); a.push(Z); } LBL.dirty = true; }
  function ringBB(R){ let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < R.length; i += 2){ x0 = Math.min(x0, R[i]); x1 = Math.max(x1, R[i]); y0 = Math.min(y0, R[i + 1]); y1 = Math.max(y1, R[i + 1]); } return [x0 - 3, y0 - 3, x1 + 3, y1 + 3]; }
  function pipR(R, x, y){ let s = false; const m = R.length/2; for (let i = 0, j = m - 1; i < m; j = i++){ const xi = R[i*2], yi = R[i*2 + 1], xj = R[j*2], yj = R[j*2 + 1]; if ((yi > y) !== (yj > y) && x < (xj - xi)*(y - yi)/(yj - yi) + xi) s = !s; } return s; }
  function pipP(P, x, y){ let s = false; const m = P.length; for (let i = 0, j = m - 1; i < m; j = i++){ const xi = P[i][0], yi = P[i][1], xj = P[j][0], yj = P[j][1]; if ((yi > y) !== (yj > y) && x < (xj - xi)*(y - yi)/(yj - yi) + xi) s = !s; } return s; }
  function lblDead(b){ try { if (!b || !b.B || !b.B.rings || b.h < 6) return; const R = b.B.rings[0]; lblAdd({ring:R, bb:ringBB(R)}); } catch (e){ /* */ } }
  function lblInZone(x, y, lmOnly){ const a = LBL.zones.get(lblKey(x, y)); if (!a) return false;
    for (const Z of a){ if (x < Z.bb[0] || x > Z.bb[2] || y < Z.bb[1] || y > Z.bb[3]) continue; if (Z.P ? pipP(Z.P, x, y) || Math.hypot(x - Z.x, y - Z.y) < 4 : (!lmOnly && pipR(Z.ring, x, y))) return true; } return false; }
  function lblStep(t){
    if (typeof labelItems === 'undefined' || !Array.isArray(labelItems)) return;
    if (labelItems === LBL.items && labelItems.length === LBL.n && !LBL.dirty) return;
    if (t - LBL.t < 0.4 && !LBL.dirty && labelItems === LBL.items) return;
    LBL.t = t; LBL.items = labelItems; LBL.n = labelItems.length; LBL.dirty = false; if (!LBL.zones.size) return;
    let h = 0;
    for (const it of labelItems){ if (!it || !it.el || it.__kdh) continue; const c = it.el.className || ''; const lm = c.indexOf(' lm') >= 0, poi = c.indexOf('poi') >= 0; if (!lm && !poi) continue;
      if (lblInZone(it.x, it.y, lm)){ it.__kdh = 1; it.__md = it.maxD; it.maxD = 1e-6; h++; } }
    LBL.hid += h;
  }
  function lblRestore(){
    LBL.zones.clear(); LBL.dirty = false;
    try { if (typeof labelItems !== 'undefined' && Array.isArray(labelItems)) for (const it of labelItems) if (it && it.__kdh){ it.maxD = it.__md; delete it.__kdh; delete it.__md; } } catch (e){ /* */ }
    LBL.hid = 0;
  }

  // ================================================================ [lm28/ruin] landmarks: damage, the collapse show, the rubble heap
  const LMS = new Map();       // landmark key -> state {key, L, D, t, st:'ok'|'shudder'|'fall'|'down', ...}
  const LMX = /bridge|\bspan\b|anchorage|approach|lift span|viaduct|island|airport|memorial|world trade|oculus|statue of liberty|barrage|\bpier\b|flag row|tramway|transportation hub/i;
  const LM_KEEP = new Set(['helix', 'barrage', 'nycentralpark', 'nyonewtc', 'nywtc', 'nywtc2', 'nywtc4', 'nywtc7', 'nymemorial', 'nyoculus', 'nyliberty', 'liberty', 'nylittleisland', 'nyunflags', 'alcatraz']);
  const lmNow = () => (KFX.T ? KFX.T.value : W.now);
  function lmHash(s, k){ let h = 0x811c9dc5 ^ (k*0x9e3779b1); for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; return (h >>> 0)/4294967296; }
  const lmList = () => (typeof landmarks !== 'undefined' && Array.isArray(landmarks)) ? landmarks : [];
  const lmDef = L => (typeof LANDMARKS !== 'undefined' && LANDMARKS[L.type]) || null;
  const lmGroupOf = L => (typeof lmMeshes !== 'undefined' && lmMeshes.get) ? lmMeshes.get(L.id) : null;
  function lmBreakable(L, def){ if (!def || LM_KEEP.has(L.type)) return false; if ((def.r || 0) > 480) return false; return !LMX.test(def.en || ''); }
  function lmState(L){ let S = LMS.get(L.type); if (!S || S.L !== L){ S = {key:L.type, L, D:0, t:-1e9, st:'ok', ax:0, ay:0, z:0}; LMS.set(L.type, S); } return S; }
  const lmRemote = () => { try { return typeof KG !== 'undefined' && KG.G && !!KG.G.remote; } catch (e){ return false; } };
  // the landmark's colours (by triangle count per material colour; once per model)
  function lmPalette(S){
    if (S.pal && S.palG === lmGroupOf(S.L)) return S.pal;
    const g = lmGroupOf(S.L), acc = new Map(); S.palG = g;
    if (g) g.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return; const m = Array.isArray(o.material) ? o.material[0] : o.material, c = m && m.color ? m.color : null; if (!c) return;
      const k = c.getHex(), n = o.geometry.index ? o.geometry.index.count/3 : o.geometry.attributes.position.count/3; acc.set(k, (acc.get(k) || 0) + n); });
    const P = [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => [((k >> 16) & 255)/255, ((k >> 8) & 255)/255, (k & 255)/255]);
    S.pal = P.length ? P : [[0.66, 0.64, 0.6]]; return S.pal;
  }
  // is (x, y, r) on a landmark's ground plan? -> penetration (> 0) or -1
  function lmTouch(L, x, y, r){
    const H = SGR.hulls && SGR.hulls.get(L.id);
    if (!H){ const def = lmDef(L), d = Math.hypot(x - L.x, y - L.y) - (def ? def.r*0.7 : 30); return d < r ? r - d : -1; }
    const b = H.bb; if (x + r < b[0] || x - r > b[2] || y + r < b[1] || y - r > b[3]) return -1;
    if (pipP(H.P, x, y)) return r + 1;
    let bd = 1e9; const P = H.P, n = P.length; for (let i = 0; i < n; i++){ const a = P[i], c = P[(i + 1) % n], ex = c[0] - a[0], ey = c[1] - a[1], l2 = ex*ex + ey*ey || 1, t = clamp(((x - a[0])*ex + (y - a[1])*ey)/l2, 0, 1); bd = Math.min(bd, Math.hypot(x - a[0] - ex*t, y - a[1] - ey*t)); }
    return bd < r ? r - bd : -1;
  }
  // the damage a landmark takes before it comes down: grows with its size (a strike ~0.7, a footfall ~0.3, a slam ~1.2)
  const lmThr = def => 0.8 + 0.6*Math.min(2, Math.sqrt(Math.max(1, (def.r || 30)*(def.h || 30)))/100);
  // a landmark model in the way: dust and chunks where the body meets it, damage; past its threshold it comes down
  const LMH = {t:0};
  function lmHit(x, y, z, r, now, e, strong){
    if (!SGR.hulls) return false;
    let any = false, broke = null;
    for (const L of lmList()){
      const pen = lmTouch(L, x, y, r); if (pen < 0) continue;
      any = true; const S = lmState(L), def = lmDef(L); if (S.st !== 'ok') continue;
      const gz = Math.max(z || 0, ground(x, y));
      if (now - LMH.t > 0.25 || strong){ LMH.t = now; const pal = lmPalette(S);
        for (let i = 0; i < 3; i++) KFX.impact(x + (Math.random() - 0.5)*r, y + (Math.random() - 0.5)*r, gz + Math.random()*40, 30, false, 0.8);
        // chunks knocked off it in its own colours (tumbling bodies near the camera)
        for (let i = 0; i < 5; i++) KFX.chunk(x + (Math.random() - 0.5)*r, y + (Math.random() - 0.5)*r, gz + 5 + Math.random()*35, (Math.random() - 0.5)*14, (Math.random() - 0.5)*14, Math.random()*6, 0.8 + Math.random()*1.8, pal[i % pal.length]);
        KFX.sfx('crunch', x, y, gz + 20, 0.9); }
      if (lmRemote() || !lmBreakable(L, def) || (now - S.t < 0.45 && !strong)) continue;
      S.t = now;
      // a footfall (a small radius) counts for less than a strike or a slam, whatever energy it carries
      let ee = e !== undefined && isFinite(e) ? clamp(e, 0, 1.5) : r >= 50 ? 0.7 : r >= 28 ? 0.42 : 0.3; if (r < 45 && !strong) ee = Math.min(ee, 0.45);
      const w = ee*(pen > r ? 1 : 0.6); S.D += w; S.ax += (L.x - x)*w; S.ay += (L.y - y)*w; S.z = gz;
      const thr = lmThr(def);
      if (S.D >= thr){ const a = Math.hypot(S.ax, S.ay) > 1 ? Math.atan2(S.ay, S.ax) : Math.atan2(L.y - y, L.x - x), ent = lmBreak(L, a, Math.min(1, 0.45 + 0.4*S.D/thr), z, false); if (ent) (broke || (broke = [])).push(ent); }
    }
    if (broke){ lmEmit(broke); return broke; }
    return any;
  }
  function landmarkHit(x, y, z, r, now, e){ return lmHit(x, y, z, r, now, e, false); }
  // a local game: the listeners (multiplayer) learn about the landmarks that came down
  function lmEmit(list){
    try { if (typeof KG === 'undefined' || !KG.G || KG.G.remote || !Array.isArray(KG.G.cbD) || !KG.G.on) return;
      KG.G.destroyedN = (KG.G.destroyedN || 0) + list.length;
      const out = list.map(o => ({lm:o.lm, fx:o.fx, fy:o.fy, e:o.e}));
      for (const cb of KG.G.cbD){ try { cb(out); } catch (e){ console.error('[kaiju] onDestroy', e); } } } catch (e){ /* the game module */ }
  }
  // a {lm} entry from a list (remote destroy, the API)
  function lmApply(it, cx, cy, quiet){
    const L = lmList().find(q => q.type === it.lm); if (!L) return null;
    const S = lmState(L); if (S.st !== 'ok') return null;
    const a = it.fx !== undefined && (it.fx || it.fy) ? Math.atan2(it.fy, it.fx) : Math.atan2(L.y - (cy || 0), L.x - (cx || 0));
    return lmBreak(L, a, it.e !== undefined ? +it.e : 0.7, undefined, quiet);
  }
  // ---- the collapse plan of a landmark (deterministic from the key, the quantized direction and energy)
  function lmPlan(L, def, ang, e, z){
    const H = Math.max(8, def.h || 40), R = Math.max(8, def.r || 30), slender = H/(2*R), u1 = lmHash(L.type, 1), u2 = lmHash(L.type, 2), u3 = lmHash(L.type, 3);
    const kind = H >= 110 && slender >= 1.25 ? (slender > 2.0 && (u1 < 0.55 || e > 0.9) ? 'topple' : 'tower') : H < 110 && H >= 18 && R >= 35 && slender < 0.7 ? 'hall' : 'crumble';
    const P = {kind, ang, e, H, R, dx:Math.cos(ang), dy:Math.sin(ang), g:9.81*0.62, ts:0, u1, u2, u3, seed:Math.floor(u3*1e9)};
    const zr = z !== undefined && isFinite(z) ? clamp((z - (L.top || 0))/H, 0, 1) : -1;
    P.f0 = kind === 'tower' ? (zr > 0.25 && zr < 0.95 ? zr*H : H*(0.72 + 0.22*u2)) : H;
    P.hk = kind === 'topple' ? H*(0.05 + 0.12*u2) : 0;
    P.vw = 26 + 30*e;               // hall: the cave-in wave (m/s)
    P.hpk = kind === 'hall' ? clamp(0.22*H, 3, 13) : clamp(0.06*H + 0.05*R + 2, 3, 26);   // heap height
    return P;
  }
  // the turning section (topple): angle table (rod about its end, g_eff), landing angle / time / rate
  function lmRod(P, L, W){
    const Ls = Math.max(6, P.H - P.hk), thL = Math.PI/2 - 0.12 + Math.min(0.5, P.hk/Ls), a = 1.5*P.g/Ls, h = 1/120, tab = [0];
    let th = 0.012, w = 0.05 + 0.22*P.e, i = 0;
    while (th < thL && i < 120*20){ i++; w += a*Math.sin(th + 0.05)*h; th += w*h; if (i % 4 === 0) tab.push(Math.min(th, thL)); }
    tab.push(thL); P.tab = tab; P.tl = (tab.length - 1)/30; P.thL = thL; P.wL = w; P.Ls = Ls; P.W = W;
  }
  const lmTheta = (P, t) => { if (t <= 0) return P.tab[0]; const x = t*30, i = Math.floor(x); if (i >= P.tab.length - 1) return P.thL; return P.tab[i] + (P.tab[i + 1] - P.tab[i])*(x - i); };
  // ---- the chunked proxy: built from the placed model's meshes a slice at a time (a generator), drawn by one mesh
  const LMSH = {mat:null};
  function lmMaterial(U){
    const m = new THREE.MeshPhongMaterial({vertexColors:true, flatShading:true, shininess:0, specular:0x000000});
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U, {uNight:typeof NIGHT !== 'undefined' && NIGHT.uNight ? NIGHT.uNight : {value:0}});
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec4 aPiv; attribute vec4 aCk; attribute vec4 aVel;
uniform float uLT; uniform float uLG; uniform vec4 uLHg; uniform vec4 uLD; uniform vec4 uLW;
varying float vLmE;
vec3 lmRotA(vec3 v, vec3 a, float t){ float c = cos(t), s = sin(t); return v * c + cross(a, v) * s + a * dot(a, v) * (1.0 - c); }
vec3 lmHinge(vec3 p, float th){ vec2 D = uLD.xy, A = vec2(-D.y, D.x); vec3 r = p - uLHg.xyz; float s = dot(r.xz, D), h = r.y, t = dot(r.xz, A);
  float c = cos(th), sn = sin(th); vec2 xz = uLHg.xz + D * (s * c + h * sn) + A * t; return vec3(xz.x, uLHg.y + h * c - s * sn, xz.y); }`)
        .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = vec3(0.0, 1.0, 0.0);')
        .replace('#include <begin_vertex>', `vec3 transformed;
{
  vec3 piv = aPiv.xyz * 0.1, p = position, q = p;
  float tr = aCk.x * 0.06, ra = aCk.y / 255.0, rb = aCk.z / 255.0, rigid = mod(aCk.w, 2.0), burn = mod(floor(aCk.w / 2.0), 2.0);
  vec3 v0 = aVel.xyz * 0.3; float hp = aVel.w * 0.25, t = uLT, g = uLG;
  vec3 c0 = piv, rel = p - piv, v = v0; float t0 = tr;
  if (rigid > 0.5){
    t0 = uLD.w;
    if (t < t0) q = lmHinge(p, uLHg.w);
    c0 = lmHinge(piv, uLD.z); rel = lmHinge(p, uLD.z) - c0;
    vec3 r = piv - uLHg.xyz; float s = dot(r.xz, uLD.xy), h = r.y, cc = cos(uLD.z), sn = sin(uLD.z);
    float ds = (-s * sn + h * cc) * uLW.x, dh = (-h * sn - s * cc) * uLW.x;
    v = vec3(uLD.x * ds, dh, uLD.y * ds) * 0.4 + v0;
  }
  if (rigid < 0.5 || t >= t0){
    float tau = max(0.0, t - t0);
    float tl = (v.y + sqrt(max(v.y * v.y + 2.0 * g * max(c0.y - hp, 0.0), 0.0))) / g, te = min(tau, tl), sl = max(0.0, tau - tl);
    vec3 c = c0 + vec3(v.x, 0.0, v.z) * te; c.y = max(hp, c0.y + v.y * te - 0.5 * g * te * te);
    c.xz += v.xz * (1.0 - exp(-2.5 * sl)) * 0.16;
    vec3 ax = normalize(vec3(ra - 0.5, rb - 0.45, ra * rb - 0.3));
    float ang = (ra - 0.5) * (2.0 + 5.0 * rb) * (te + 0.12 * min(sl, 1.0)) * step(0.0001, tau);
    vec3 rr = lmRotA(rel, ax, ang);
    rr.y *= mix(1.0, 0.4, smoothstep(0.0, 0.5, sl));
    float sink = smoothstep(uLW.y - 2.6, uLW.y, t);
    q = c + rr * (1.0 - 0.8 * sink) - vec3(0.0, sink * (uLW.z + hp), 0.0);
    q.xz += vec2(sin(t * 31.0 + piv.y), cos(t * 27.0 + piv.x)) * 0.14 * step(tau, 0.0) * clamp(piv.y / 60.0, 0.0, 1.0);
  }
  vLmE = burn * (0.55 + 0.45 * sin(t * 9.0 + ra * 40.0)) * (1.0 - smoothstep(uLW.y - 5.0, uLW.y - 1.0, t)) * step(t0 + 0.05, t);
  transformed = q;
}`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vLmE;\nuniform float uNight;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.36, 0.08) * vLmE * (0.25 + 1.1 * uNight);');
    };
    m.customProgramCacheKey = () => 'kjlm-proxy-1';
    return m;
  }
  // the job: the placed model's triangles (world), cut into pieces no longer than ~cs, grouped into chunks by a 3-D grid; per chunk its
  // pivot, release time, velocity, pile height; written as the proxy's vertex attributes. Yields every ~1500 triangles.
  function* lmJob(S, P){
    const L = S.L, g0 = lmGroupOf(L), top = L.top || 0, OX = L.x, OZ = -L.y;
    const out = {tri:new Float32Array(9*4096), col:new Uint8Array(3*4096), n:0};
    const H = P.H, R = P.R, cs = clamp(R/4.5, 4, 14), cz = clamp(H/22, 3, 12), maxE = Math.max(cs, cz)*1.25;
    const need = k => { if ((out.n + k)*9 <= out.tri.length) return; let n = out.tri.length/9; while (n < out.n + k) n *= 2; const t = new Float32Array(n*9); t.set(out.tri); out.tri = t; const c = new Uint8Array(n*3); c.set(out.col); out.col = c; };
    const V = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], M = new THREE.Matrix4(), CC = new THREE.Color();
    const ST = new Float64Array(10*48);    // the split stack: 9 coordinates + depth per entry
    let steps = 0, lastN = 0; const cap = 200000;
    // split a triangle along its longest edge until its edges are short (no allocation)
    function addTri(ax, ay, az, bx, by, bz, qx, qy, qz, cr, cg, cb){
      let sp = 0; ST[0] = ax; ST[1] = ay; ST[2] = az; ST[3] = bx; ST[4] = by; ST[5] = bz; ST[6] = qx; ST[7] = qy; ST[8] = qz; ST[9] = 0; sp = 1;
      while (sp > 0){ sp--; const o = sp*10, d = ST[o + 9];
        const x0 = ST[o], y0 = ST[o + 1], z0 = ST[o + 2], x1 = ST[o + 3], y1 = ST[o + 4], z1 = ST[o + 5], x2 = ST[o + 6], y2 = ST[o + 7], z2 = ST[o + 8];
        const l0 = Math.hypot(x1 - x0, y1 - y0, z1 - z0), l1 = Math.hypot(x2 - x1, y2 - y1, z2 - z1), l2 = Math.hypot(x0 - x2, y0 - y2, z0 - z2), lm = Math.max(l0, l1, l2);
        if (lm > maxE && d < 9 && out.n < cap && sp < 46){
          let A0, A1, A2, B0, B1, B2, C0, C1, C2;     // split edge A-B (C opposite) at its middle M
          if (lm === l0){ A0 = x0; A1 = y0; A2 = z0; B0 = x1; B1 = y1; B2 = z1; C0 = x2; C1 = y2; C2 = z2; }
          else if (lm === l1){ A0 = x1; A1 = y1; A2 = z1; B0 = x2; B1 = y2; B2 = z2; C0 = x0; C1 = y0; C2 = z0; }
          else { A0 = x2; A1 = y2; A2 = z2; B0 = x0; B1 = y0; B2 = z0; C0 = x1; C1 = y1; C2 = z1; }
          const M0 = (A0 + B0)/2, M1 = (A1 + B1)/2, M2 = (A2 + B2)/2;
          let q = sp*10; ST[q] = A0; ST[q + 1] = A1; ST[q + 2] = A2; ST[q + 3] = M0; ST[q + 4] = M1; ST[q + 5] = M2; ST[q + 6] = C0; ST[q + 7] = C1; ST[q + 8] = C2; ST[q + 9] = d + 1; sp++;
          q = sp*10; ST[q] = M0; ST[q + 1] = M1; ST[q + 2] = M2; ST[q + 3] = B0; ST[q + 4] = B1; ST[q + 5] = B2; ST[q + 6] = C0; ST[q + 7] = C1; ST[q + 8] = C2; ST[q + 9] = d + 1; sp++;
          continue; }
        need(1); const w = out.n*9, T9 = out.tri; T9[w] = x0; T9[w + 1] = y0; T9[w + 2] = z0; T9[w + 3] = x1; T9[w + 4] = y1; T9[w + 5] = z1; T9[w + 6] = x2; T9[w + 7] = y2; T9[w + 8] = z2;
        out.col[out.n*3] = cr; out.col[out.n*3 + 1] = cg; out.col[out.n*3 + 2] = cb; out.n++; }
    }
    const meshes = [];
    if (g0){ g0.updateMatrixWorld(true); g0.traverse(o => { if (!(o.isMesh || o.isInstancedMesh) || !o.visible || !o.geometry || !o.geometry.attributes.position || !o.geometry.attributes.position.array) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material; if (m && m.transparent && m.opacity < 0.45) return; if (o.isInstancedMesh && o.count > 400) return; meshes.push(o); }); }
    { let n0 = 0; for (const o of meshes){ const g = o.geometry; n0 += (g.index ? g.index.count/3 : g.attributes.position.count/3)*(o.isInstancedMesh ? o.count : 1); } need(Math.min(cap, Math.round(n0*1.6) + 64)); }
    yield 1;
    for (const o of meshes){
      const geo = o.geometry, pa = geo.attributes.position, idx = geo.index, ca = geo.attributes.color, m = Array.isArray(o.material) ? o.material[0] : o.material;
      const mc = m && m.color ? m.color : CC.setRGB(0.7, 0.7, 0.68), useVC = !!(m && m.vertexColors && ca);
      const nT = idx ? idx.count/3 : pa.count/3, nI = o.isInstancedMesh ? o.count : 1;
      for (let ii = 0; ii < nI; ii++){
        if (o.isInstancedMesh){ o.getMatrixAt(ii, M); M.premultiply(o.matrixWorld); } else M.copy(o.matrixWorld);
        for (let t = 0; t < nT; t++){
          let r = 0, gg = 0, bb = 0;
          for (let k = 0; k < 3; k++){ const vi = idx ? idx.getX(t*3 + k) : t*3 + k; V[k].fromBufferAttribute(pa, vi).applyMatrix4(M); V[k].x -= OX; V[k].y -= top; V[k].z -= OZ;
            if (useVC){ r += ca.getX(vi); gg += ca.getY(vi); bb += ca.getZ(vi); } }
          const cr = useVC ? r/3*mc.r : mc.r, cg = useVC ? gg/3*mc.g : mc.g, cb = useVC ? bb/3*mc.b : mc.b;
          addTri(V[0].x, V[0].y, V[0].z, V[1].x, V[1].y, V[1].z, V[2].x, V[2].y, V[2].z, Math.round(clamp(cr, 0, 1)*255), Math.round(clamp(cg, 0, 1)*255), Math.round(clamp(cb, 0, 1)*255));
          if (++steps % 120 === 0 || out.n - lastN > 900){ lastN = out.n; yield 1; }
        }
      }
    }
    const nTri = out.n; if (!nTri) return null;
    // chunks: a 3-D grid of the triangle centroids
    const ckOf = new Int32Array(nTri), keyMap = new Map(); let nCk = 0, firstTri = new Int32Array(4096);
    let CA = new Float64Array(4096*6);   // per chunk: sum x, y, z (area weighted), area, sum up-normal, count
    for (let t = 0; t < nTri; t++){
      const o = t*9, T9 = out.tri, x = (T9[o] + T9[o + 3] + T9[o + 6])/3, y = (T9[o + 1] + T9[o + 4] + T9[o + 7])/3, z = (T9[o + 2] + T9[o + 5] + T9[o + 8])/3;
      const ux = T9[o + 3] - T9[o], uy = T9[o + 4] - T9[o + 1], uz = T9[o + 5] - T9[o + 2], vx = T9[o + 6] - T9[o], vy = T9[o + 7] - T9[o + 1], vz = T9[o + 8] - T9[o + 2];
      const nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx, a2 = Math.hypot(nx, ny, nz), A = a2*0.5 + 1e-4;
      const key = ((Math.floor(x/cs) + 2048)*4096 + (Math.floor(y/cz) + 2048))*4096 + (Math.floor(z/cs) + 2048);
      let c = keyMap.get(key); if (c === undefined){ c = nCk++; keyMap.set(key, c); if (nCk*6 > CA.length){ const n2 = new Float64Array(CA.length*2); n2.set(CA); CA = n2; } if (nCk > firstTri.length){ const f2 = new Int32Array(firstTri.length*2); f2.set(firstTri); firstTri = f2; } firstTri[c] = t; }
      ckOf[t] = c; const q = c*6; CA[q] += x*A; CA[q + 1] += y*A; CA[q + 2] += z*A; CA[q + 3] += A; CA[q + 4] += (a2 > 1e-9 ? Math.abs(ny)/a2 : 0)*A; CA[q + 5]++;
      if (t % 2500 === 2499) yield 2;
    }
    // per chunk: pivot, release time, velocity, pile height, flags (by the kind of collapse)
    const D = [P.dx, -P.dy], rng = (typeof mulberry32 === 'function' ? mulberry32(P.seed) : Math.random);
    const PV = new Float32Array(nCk*3), TR = new Float32Array(nCk), VV = new Float32Array(nCk*3), HP = new Float32Array(nCk), FL = new Uint8Array(nCk), RA = new Uint8Array(nCk*2);
    const imp = {x:P.ix !== undefined ? P.ix : -D[0]*R, z:P.iz !== undefined ? P.iz : -D[1]*R};
    const hpAt = (x, z, rr) => { const d = Math.hypot(x, z)/(R*1.12); return Math.max(0.3, P.hpk*Math.max(0, 1 - d*d)*(0.35 + 0.65*rr)); };
    let tMax = 0, landMin = 1e9; const bins = new Float32Array(160*3);       // landing mass per 0.25 s: mass, x, z
    for (let c = 0; c < nCk; c++){
      const q = c*6, A = CA[q + 3], x = CA[q]/A, y = CA[q + 1]/A, z = CA[q + 2]/A, up = CA[q + 4]/A, r1 = rng(), r2 = rng(), r3 = rng();
      PV[c*3] = x; PV[c*3 + 1] = y; PV[c*3 + 2] = z; RA[c*2] = Math.floor(r1*255); RA[c*2 + 1] = Math.floor(r2*255);
      const rh = Math.hypot(x, z) || 1, ox = x/rh, oz = z/rh, rel = clamp(y/H, 0, 1);
      let tr = 0, vx = 0, vy = 0, vz = 0, fl = r3 < 0.07 ? 2 : 0;
      if (P.kind === 'tower'){
        tr = y >= P.f0 ? r1*0.25 : Math.sqrt(2*(P.f0 - y)/P.g) + r1*0.15;
        const sp = (1.5 + 4.5*r2)*(0.4 + rel); vx = ox*sp + D[0]*P.e*2*rel; vz = oz*sp + D[1]*P.e*2*rel; vy = (r3 - 0.6)*2;
      } else if (P.kind === 'topple'){
        if (y >= P.hk){ fl |= 1; tr = P.tl; vx = (r1 - 0.5)*3 + ox*r2*2; vz = (r2 - 0.5)*3 + oz*r1*2; vy = r3*2; }
        else { tr = P.tl - 0.3 + Math.sqrt(2*Math.max(0, P.hk - y)/P.g) + r1*0.2; const sp = 1 + 3*r2; vx = ox*sp; vz = oz*sp; vy = 0; }
      } else if (P.kind === 'hall'){
        const di = Math.hypot(x - imp.x, z - imp.z), roof = up > 0.55 && y > H*0.3 && rh < R*0.85;
        if (roof){ tr = 0.2 + di/P.vw + r1*0.45; vx = -ox*(0.8 + 2.2*r2); vz = -oz*(0.8 + 2.2*r2); vy = -r3*1.5; }
        else { tr = 0.9 + di/P.vw*1.35 + r1*1.1; const s = r2 < 0.55 ? 1 : -0.7, sp = 1.5 + 3.5*r3; vx = ox*sp*s; vz = oz*sp*s; vy = r1*1.2; }
      } else {
        tr = r1*0.55 + (1 - rel)*0.5; const sp = (1 + 5*P.e)*rel; vx = D[0]*sp + ox*(0.5 + 2*r2); vz = D[1]*sp + oz*(0.5 + 2*r2); vy = r3*1.5;
      }
      // where it lands (an estimate of the flight) -> the pile height there
      let fx = x + vx*1.2, fz = z + vz*1.2, fy = y, fvy = vy;
      if (fl & 1){ // the turning section lands with it: its position at the landing angle
        const sx = x - P.hx, sz = z - P.hz, s = sx*D[0] + sz*D[1], h = y - P.hk, a = -D[1]*sx + D[0]*sz, c2 = Math.cos(P.thL), s2 = Math.sin(P.thL), s3 = s*c2 + h*s2;
        fx = P.hx + D[0]*s3 - D[1]*a; fz = P.hz + D[1]*s3 + D[0]*a; fy = P.hk + h*c2 - s*s2; fvy = vy;
      }
      let hp = hpAt(fx, fz, r2);
      if (fl & 1){ hp = Math.max(0.3, clamp(P.W*0.22, 1.5, 9)*(0.3 + 0.7*r2)); }
      const tf = (fvy + Math.sqrt(Math.max(0, fvy*fvy + 2*P.g*Math.max(0, fy - hp))))/P.g, tland = tr + tf;
      TR[c] = clamp(tr, 0, 15.2); VV[c*3] = vx; VV[c*3 + 1] = vy; VV[c*3 + 2] = vz; HP[c] = clamp(hp, 0, 31); FL[c] = fl;
      tMax = Math.max(tMax, tland); landMin = Math.min(landMin, tland);
      const bi = Math.min(159, Math.floor(tland/0.25)); bins[bi*3] += A; bins[bi*3 + 1] += fx*A; bins[bi*3 + 2] += fz*A;
      if (c % 400 === 399) yield 3;
    }
    // the vertex streams (per chunk packed once, copied per vertex); big allocations in their own slice
    const i16 = v => clamp(Math.round(v*10), -32767, 32767), i8 = v => clamp(Math.round(v), -127, 127);
    const CP = new Int16Array(nCk*4), CK = new Uint8Array(nCk*4), CV = new Int8Array(nCk*4);
    for (let c = 0; c < nCk; c++){ CP[c*4] = i16(PV[c*3]); CP[c*4 + 1] = i16(PV[c*3 + 1]); CP[c*4 + 2] = i16(PV[c*3 + 2]); CP[c*4 + 3] = c & 32767;
      CK[c*4] = Math.round(TR[c]/0.06); CK[c*4 + 1] = RA[c*2]; CK[c*4 + 2] = RA[c*2 + 1]; CK[c*4 + 3] = FL[c];
      CV[c*4] = i8(VV[c*3]/0.3); CV[c*4 + 1] = i8(VV[c*3 + 1]/0.3); CV[c*4 + 2] = i8(VV[c*3 + 2]/0.3); CV[c*4 + 3] = i8(HP[c]/0.25); }
    yield 5;
    const nv = nTri*3, pos = new Float32Array(nv*3); yield 5;
    const col = new Uint8Array(nv*3), piv = new Int16Array(nv*4); yield 5;
    const ck = new Uint8Array(nv*4), vel = new Int8Array(nv*4); yield 5;
    pos.set(out.tri.subarray(0, nTri*9)); yield 5;
    for (let t = 0; t < nTri; t++){
      const c4 = ckOf[t]*4;
      for (let k = 0; k < 3; k++){ const v4 = (t*3 + k)*4, c3 = (t*3 + k)*3;
        col[c3] = out.col[t*3]; col[c3 + 1] = out.col[t*3 + 1]; col[c3 + 2] = out.col[t*3 + 2];
        piv[v4] = CP[c4]; piv[v4 + 1] = CP[c4 + 1]; piv[v4 + 2] = CP[c4 + 2]; piv[v4 + 3] = CP[c4 + 3];
        ck[v4] = CK[c4]; ck[v4 + 1] = CK[c4 + 1]; ck[v4 + 2] = CK[c4 + 2]; ck[v4 + 3] = CK[c4 + 3];
        vel[v4] = CV[c4]; vel[v4 + 1] = CV[c4 + 1]; vel[v4 + 2] = CV[c4 + 2]; vel[v4 + 3] = CV[c4 + 3]; }
      if (t % 4000 === 3999) yield 4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3, true));
    geo.setAttribute('aPiv', new THREE.BufferAttribute(piv, 4)); geo.setAttribute('aCk', new THREE.BufferAttribute(ck, 4)); geo.setAttribute('aVel', new THREE.BufferAttribute(vel, 4));
    const drop = function(){ this.array = null; }; for (const k in geo.attributes) geo.attributes[k].onUpload(drop);
    // cumulative landed mass (the heap grows with it), the big landing events
    let tot = 0; for (let i = 0; i < 160; i++) tot += bins[i*3];
    const cum = new Float32Array(160); let acc = 0; for (let i = 0; i < 160; i++){ acc += bins[i*3]; cum[i] = tot ? acc/tot : 1; }
    // the landing events (bins with > 4 % of the mass); the heaviest one throws up the big dust wave
    const ev = []; let big = -1, bm = 0; for (let i = 0; i < 160; i++){ const m = bins[i*3]; if (m > tot*0.04){ ev.push({t:i*0.25, k:m/tot, x:bins[i*3 + 1]/m, z:bins[i*3 + 2]/m}); if (m > bm){ bm = m; big = ev.length - 1; } } }
    if (big >= 0) ev[big].big = true;
    // a sample of chunk pivots (in their colours) for the rigid bodies and the effects
    const smp = []; for (let i = 0; i < Math.min(400, nCk); i++){ const c = Math.floor(rng()*nCk), tt = firstTri[c]; smp.push({x:PV[c*3], y:PV[c*3 + 1], z:PV[c*3 + 2], tr:TR[c], c:[out.col[tt*3]/255, out.col[tt*3 + 1]/255, out.col[tt*3 + 2]/255], fl:FL[c]}); }
    const heap = yield* lmHeap(S, P);
    return {geo, nTri, nCk, tEnd:Math.max(tMax + 3.2, 5), landMin, cum, ev, smp, tot, heap};
  }
  // ---- the rubble heap on the landmark's plan (and along a toppled tower's fall line): a heightfield, flat shaded, in its colours
  const LMN = {value:0};        // the night factor for the heaps (from KFX's light level)
  function* lmHeap(S, P){
    const L = S.L, top = L.top || 0, H = SGR.hulls && SGR.hulls.get(L.id), pal = lmPalette(S), rng = typeof mulberry32 === 'function' ? mulberry32(P.seed + 7) : Math.random;
    const Pp = H ? H.P.map(p => [p[0] - L.x, p[1] - L.y]) : (() => { const a = []; for (let i = 0; i < 16; i++) a.push([Math.cos(i/16*6.283)*P.R*0.8, Math.sin(i/16*6.283)*P.R*0.8]); return a; })();
    let cx = 0, cy = 0; for (const p of Pp){ cx += p[0]/Pp.length; cy += p[1]/Pp.length; }
    let rin = 1e9; for (let i = 0; i < Pp.length; i++){ const a = Pp[i], b = Pp[(i + 1) % Pp.length], ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey) || 1; rin = Math.min(rin, Math.abs((cx - a[0])*ey - (cy - a[1])*ex)/l); }
    rin = Math.max(4, rin);
    const edgeD = (x, y) => { let bd = 1e9; for (let i = 0; i < Pp.length; i++){ const a = Pp[i], b = Pp[(i + 1) % Pp.length], ex = b[0] - a[0], ey = b[1] - a[1], l2 = ex*ex + ey*ey || 1, t = clamp(((x - a[0])*ex + (y - a[1])*ey)/l2, 0, 1); bd = Math.min(bd, Math.hypot(x - a[0] - ex*t, y - a[1] - ey*t)); } return pipP(Pp, x, y) ? bd : -bd; };
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of Pp){ x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    const line = P.kind === 'topple' ? {x:P.hx, y:-P.hz, dx:P.dx, dy:P.dy, len:P.Ls + P.W*0.5, w:Math.max(8, P.W*0.9)} : null;
    if (line){ for (const s of [0, line.len]) for (const l of [-line.w, line.w]){ const x = line.x + line.dx*s - line.dy*l, y = line.y + line.dy*s + line.dx*l; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
    x0 -= 8; y0 -= 8; x1 += 8; y1 += 8;
    const sp = Math.max(2.5, Math.max(x1 - x0, y1 - y0)/56), nx = Math.ceil((x1 - x0)/sp) + 1, ny = Math.ceil((y1 - y0)/sp) + 1;
    const hgt = new Float32Array(nx*ny), ncell = (i, j) => { const h = Math.sin(i*12.9898 + j*78.233 + P.seed*0.001)*43758.5453; return h - Math.floor(h); };
    for (let j = 0; j < ny; j++){ if (j % 3 === 2) yield 6; for (let i = 0; i < nx; i++){
      const x = x0 + i*sp, y = y0 + j*sp, ed = edgeD(x, y), n = ncell(i, j);
      let h = ed > 0 ? P.hpk*Math.pow(Math.min(1, ed/rin), 0.65)*(0.7 + 0.55*n) : ed > -6 ? P.hpk*0.12*(1 + ed/6)*(0.5 + n) : 0;
      if (line){ const rx = x - line.x, ry = y - line.y, s = rx*line.dx + ry*line.dy, l = Math.abs(-rx*line.dy + ry*line.dx);
        if (s > 0 && s < line.len && l < line.w){ const hl = clamp(P.W*0.2, 1.5, 8)*(1 - (l/line.w)*(l/line.w))*Math.min(1, (line.len - s)/12)*(0.6 + 0.7*n); h = Math.max(h, hl); } }
      hgt[j*nx + i] = h; } }
    yield 6;
    // per grid point once: its height (on the plinth inside the plan, the ground outside) and colour
    const PY = new Float32Array(nx*ny), PC = new Float32Array(nx*ny*3);
    for (let j = 0; j < ny; j++){ if (j % 5 === 4) yield 6; for (let i = 0; i < nx; i++){ const k = j*nx + i, x = x0 + i*sp, y = y0 + j*sp, h = hgt[k];
      let gz = top; if (h < 0.05 || !pipP(Pp, x, y)){ try { gz = Math.min(top, hC(L.x + x, L.y + y)); } catch (e){ gz = top; } }
      PY[k] = h < 0.05 ? -0.6 : gz - top + h; const c = pal[Math.floor(ncell(i + 3, j + 7)*pal.length) % pal.length], sh = 0.62 + 0.38*ncell(i + 11, j + 5);
      PC[k*3] = (c[0]*0.62 + 0.55*0.38)*sh; PC[k*3 + 1] = (c[1]*0.62 + 0.52*0.38)*sh; PC[k*3 + 2] = (c[2]*0.62 + 0.47*0.38)*sh; } }
    let nq = 0; for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) if (hgt[j*nx + i] >= 0.05 || hgt[j*nx + i + 1] >= 0.05 || hgt[(j + 1)*nx + i + 1] >= 0.05 || hgt[(j + 1)*nx + i] >= 0.05) nq++;
    const pos = new Float32Array(nq*18), cols = new Float32Array(nq*18); let w = 0;
    const vtx = (i, j) => { const k = j*nx + i; pos[w] = x0 + i*sp; pos[w + 1] = PY[k]; pos[w + 2] = -(y0 + j*sp); cols[w] = PC[k*3]; cols[w + 1] = PC[k*3 + 1]; cols[w + 2] = PC[k*3 + 2]; w += 3; };
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++){
      const a = hgt[j*nx + i], b = hgt[j*nx + i + 1], c = hgt[(j + 1)*nx + i + 1], d = hgt[(j + 1)*nx + i]; if (a < 0.05 && b < 0.05 && c < 0.05 && d < 0.05) continue;
      // alternate the diagonal for a broken look
      if ((i + j) & 1){ vtx(i, j); vtx(i + 1, j); vtx(i + 1, j + 1); vtx(i, j); vtx(i + 1, j + 1); vtx(i, j + 1); }
      else { vtx(i, j); vtx(i + 1, j); vtx(i, j + 1); vtx(i + 1, j); vtx(i + 1, j + 1); vtx(i, j + 1); } }
    yield 6;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); geo.computeBoundingSphere();
    const mat = new THREE.MeshPhongMaterial({vertexColors:true, flatShading:true, shininess:0, specular:0x000000});
    // at night a faint dusty glow on the faces that look up (as the building heaps in bld.js): the heap reads in the dark
    mat.onBeforeCompile = sh => { sh.uniforms.uLmN = LMN; sh.fragmentShader = 'uniform float uLmN;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n  { float kUp = clamp(dot(normal, normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz)), 0.0, 1.0); totalEmissiveRadiance += vColor * (0.11 + 0.17 * kUp) * uLmN; }'); };
    mat.customProgramCacheKey = () => 'kjlm-heap-1';
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; m.name = 'kj_lmheap';
    const grp = new THREE.Group(); grp.name = 'kj_lmruin_' + L.type; grp.position.set(L.x, top, -L.y); grp.add(m); grp.userData.kjRuin = true;
    // the height of the heap at a world point (rubble blocks on it)
    grp.userData.hAt = (wx, wy) => { const i = Math.round((wx - L.x - x0)/sp), j = Math.round((wy - L.y - y0)/sp); return i < 0 || j < 0 || i >= nx || j >= ny ? 0 : hgt[j*nx + i]; };
    grp.userData.pp = Pp; grp.userData.bb = [x0, y0, x1, y1];
    return grp;
  }
  // ---- break a landmark: the state, the plan, the job; the show runs in lmStep
  function lmBreak(L, ang, e, z, quiet){
    const S = lmState(L), def = lmDef(L); if (S.st !== 'ok' || !def || typeof THREE === 'undefined') return null;
    const g0 = lmGroupOf(L); if (!g0) return null;
    ang = qAng(ang); e = qE(e);
    const P = lmPlan(L, def, ang, e, z);
    // the hull extent along the push direction (the hinge of a toppling tower is the far edge at the base)
    const H = SGR.hulls && SGR.hulls.get(L.id); let rf = P.R*0.6, rb = P.R*0.6;
    if (H){ rf = 0; rb = 0; for (const p of H.P){ const d = (p[0] - L.x)*P.dx + (p[1] - L.y)*P.dy; rf = Math.max(rf, d); rb = Math.max(rb, -d); } rf = Math.max(4, rf - 3); rb = Math.max(4, rb - 3); }
    P.hx = P.dx*rf; P.hz = -P.dy*rf;               // hinge point (three x, z relative to the model origin)
    P.ix = -P.dx*rb*0.8; P.iz = P.dy*rb*0.8;       // the struck side
    if (P.kind === 'topple') lmRod(P, L, rf + rb);
    S.st = 'shudder'; S.P = P; S.t0 = lmNow(); S.g0 = g0; S.quiet = !!quiet; S.ev = 0; S.fx = {burst:-1, chunks:0, glass:0, expl:-1e9, fire:0, land:false, wave:false, band:1e9};
    S.p0 = g0.position.clone(); S.job = lmJob(S, P); S.res = null; S.camD = camD(L.x, L.y, L.top || 0);
    try { if (KD() && KD().lmSet) KD().lmSet(L.type, true); } catch (e2){ /* */ }
    // the label goes, signs on it go (crown: lmDead), the dust and the sound of the first blow
    const Hh = H || {P:[[L.x - P.R, L.y - P.R], [L.x + P.R, L.y - P.R], [L.x + P.R, L.y + P.R], [L.x - P.R, L.y + P.R]]};
    lblAdd({P:Hh.P, x:L.x, y:L.y, bb:[Math.min(...Hh.P.map(p => p[0])) - 5, Math.min(...Hh.P.map(p => p[1])) - 5, Math.max(...Hh.P.map(p => p[0])) + 5, Math.max(...Hh.P.map(p => p[1])) + 5]});
    if (!quiet){ KFX.ensure(); const top = L.top || 0, pal = lmPalette(S);
      KFX.sfx('crunch', L.x, L.y, top + 20, 1); KFX.sfx('glass', L.x, L.y, top + Math.min(P.H, 80)*0.5, 0.9); KFX.rumble(L.x, L.y, top, 3.5, 0.7);
      KFX.dustRoll(L.x, L.y, top, P.R*0.4, Math.min(40, P.H*0.15), pal[0], 0.4);
      shake(1.5*Math.exp(-S.camD/900), L.x, L.y, top); }
    return {lm:L.type, fx:+Math.cos(ang).toFixed(4), fy:+Math.sin(ang).toFixed(4), e};
  }
  // ---- per frame: the job while it shudders, then the fall (uniforms, effects by the clock), the end (heap, fires)
  const LMACT = [];
  function lmStep(){
    if (!LMS.size) return;
    if (KFX.LIGHT) LMN.value = clamp((0.78 - (KFX.LIGHT.value - 0.22))/0.78, 0, 1);
    const now = lmNow();
    for (const S of LMS.values()){
      if (S.st === 'ok' || S.st === 'down') continue;
      if (!lmList().includes(S.L)){ lmDrop(S); continue; }     // the city was reset / switched
      const L = S.L, P = S.P, top = L.top || 0, t = now - S.t0;
      if (S.st === 'shudder'){
        // build the proxy a slice at a time (<= 6 ms a frame) while the model trembles
        if (S.job){ const t1 = performance.now(); let r; do { r = S.job.next(); } while (!r.done && performance.now() - t1 < 6); if (r.done){ S.res = r.value || null; S.job = null; } const dt = performance.now() - t1; S.buildMs = (S.buildMs || 0) + dt; S.sliceMax = Math.max(S.sliceMax || 0, dt); }
        const amp = Math.min(1, t/0.4)*(0.25 + 0.35*P.e);
        if (S.g0 && S.p0){ S.g0.position.set(S.p0.x + Math.sin(now*37.1)*amp*0.6, S.p0.y + Math.sin(now*23.3)*amp*0.2, S.p0.z + Math.cos(now*31.7)*amp*0.6); }
        if (!S.quiet) lmShudderFx(S, t);
        if (!S.job && t > 0.7 + 0.5*P.u2){ const t2 = performance.now(); lmSwap(S, now); S.swapMs = performance.now() - t2; }
        continue;
      }
      // the fall
      const tf = now - S.tf;
      if (S.U){ S.U.uLT.value = tf; if (P.kind === 'topple') S.U.uLHg.value.w = lmTheta(P, tf); }
      if (!S.quiet) lmFallFx(S, tf);
      // the heap grows with the landed mass
      if (S.heap){ const k = S.res ? S.res.cum[Math.max(0, Math.min(159, Math.floor(tf/0.25)))] : Math.min(1, tf/6); S.heap.children[0].scale.y = 0.03 + 0.97*Math.min(1, k*1.05); }
      if (tf > S.tEnd){ lmEnd(S); }
    }
  }
  // the model is swapped for the proxy (or straight for the heap when it has none) and the heap goes into lmMeshes (collision, crown)
  function lmSwap(S, now){
    const L = S.L, P = S.P, g0 = S.g0;
    if (g0 && S.p0) g0.position.copy(S.p0);
    if (S.res && S.res.heap) S.heap = S.res.heap; else { const it = lmHeap(S, P); let r; do { r = it.next(); } while (!r.done); S.heap = r.value; }
    S.heap.children[0].scale.y = 0.03;
    try { if (g0 && g0.parent) g0.parent.remove(g0); if (g0) g0.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.isPoints && o.material) o.material.dispose(); }); } catch (e){ /* */ }
    try { if (L.mats){ for (const m of L.mats.values()) m.dispose(); L.mats = null; } L.fx = []; } catch (e){ /* */ }
    try { lmMeshes.set(L.id, S.heap); (typeof lmGroup !== 'undefined' ? lmGroup : scene).add(S.heap); } catch (e){ scene.add(S.heap); }
    S.g0 = null; S.tf = now; S.st = 'fall';
    try { KFX.fireOff(L.x, L.y, P.R*1.1); } catch (e){ /* */ }
    if (S.res && S.res.geo){
      const U = {uLT:{value:0}, uLG:{value:P.g}, uLHg:{value:new THREE.Vector4(P.hx || 0, P.hk || 0, P.hz || 0, 0)}, uLD:{value:new THREE.Vector4(P.dx, -P.dy, P.thL || 0, P.tl || 0)}, uLW:{value:new THREE.Vector4(P.wL || 0, S.res.tEnd, 1.5, 0)}};
      const m = new THREE.Mesh(S.res.geo, lmMaterial(U)); m.position.set(L.x, L.top || 0, -L.y); m.frustumCulled = false; m.castShadow = false; m.receiveShadow = true; m.name = 'kj_lmproxy';
      m.matrixAutoUpdate = false; m.updateMatrix(); scene.add(m); S.mesh = m; S.U = U; S.tEnd = S.res.tEnd;
    } else S.tEnd = 4;
    if (!S.quiet){ const top = L.top || 0; KFX.sfx('crunch', L.x, L.y, top + 10, 1); KFX.rumble(L.x, L.y, top, Math.min(14, S.tEnd), 1); }
    LMACT.push(S);
  }
  // effects while it trembles: glass bursting off the facades, a fire where it was struck, dust puffs at the base
  function lmShudderFx(S, t){
    const L = S.L, P = S.P, top = L.top || 0, pal = lmPalette(S), F = S.fx, def = lmDef(L);
    if (F.glass < (def && def.cat === 'new' ? 70 : 30) && Math.random() < 0.7){ for (let i = 0; i < 4; i++){ const a = Math.random()*6.283, r = P.R*(0.5 + 0.4*Math.random()), z = top + Math.random()*P.H*0.9;
      KFX.glass(L.x + Math.cos(a)*r, L.y + Math.sin(a)*r, z, Math.cos(a)*(3 + Math.random()*6), Math.sin(a)*(3 + Math.random()*6), Math.random()*3); F.glass++; } }
    if (!F.fire){ F.fire = 1; const zi = top + clamp(S.z !== undefined ? S.z - top : P.H*0.3, 4, P.H*0.9);
      // a fire where it was struck, only while it trembles (it must not stay hanging in the air when the model comes down)
      const fx = L.x - P.dx*P.R*0.6, fy = L.y - P.dy*P.R*0.6; KFX.fireAt(fx, fy, zi, Math.min(14, 5 + P.R*0.06), 2.5, true);
      KFX.blastFlash(fx, fy, zi, 1.4 + P.e, -P.dx, -P.dy); KFX.sfx('explosion', fx, fy, zi, 0.9); }
    if (Math.random() < 0.15){ const a = Math.random()*6.283; KFX.dustRoll(L.x + Math.cos(a)*P.R*0.7, L.y + Math.sin(a)*P.R*0.7, top, 8, 15, pal[0], 0.35); }
  }
  // the effects of the fall, by the plan's clock: explosions running down the floors, the turning section, the cave-in wave, the
  // landings (dust wave, impulses on traffic / bodies / the car, crunch, shake), chunks in its colours, fires
  function lmFallFx(S, tf){
    const L = S.L, P = S.P, top = L.top || 0, F = S.fx, pal = lmPalette(S), R = S.res, lod = S.camD < 3500 ? 1 : 0.4;
    const wx = (x, z) => L.x + x, wy = (x, z) => L.y - z;
    // explosions: a tower's front coming down (every ~1/12 of its height), a topple's hinge, a hall's roof
    if (P.kind === 'tower' || P.kind === 'topple'){
      const f0 = P.kind === 'tower' ? P.f0 : P.hk, ps = P.kind === 'tower' ? 0 : P.tl - 0.3, tau = tf - ps;
      if (tau > 0){ const front = Math.max(0, f0 - 0.5*P.g*tau*tau), step = Math.max(8, P.H/12), band = Math.floor(front/step);
        if (band < F.band){ F.band = band; const a = Math.random()*6.283, zz = top + (band + 0.5)*step, x = L.x + Math.cos(a)*P.R*0.55, y = L.y + Math.sin(a)*P.R*0.55;
          KFX.floorBurst(L.x, L.y, zz, P.R*0.65, pal[0], 1.2*lod, 0, 0);
          if (tf - F.expl > 0.16){ F.expl = tf; KFX.blastFlash(x, y, zz, 1.1 + 0.9*Math.random(), Math.cos(a), Math.sin(a)); try { if (window.SGFX && SGFX.sparks) SGFX.sparks(x, y, zz, 30, 25); } catch (e){ /* */ } KFX.sfx('explosion', x, y, zz, 0.7); }
          for (let i = 0; i < 6; i++){ const b = Math.random()*6.283; KFX.flame(L.x + Math.cos(b)*P.R*0.5, L.y + Math.sin(b)*P.R*0.5, zz, Math.cos(b)*8, Math.sin(b)*8, 2, 8, 22, 0.9, 0.8, 1); }
          shake(0.5*Math.exp(-S.camD/900), x, y, zz); } }
    }
    if (P.kind === 'topple' && tf < P.tl && Math.random() < 0.25*lod){ const th = lmTheta(P, tf), s = P.hk + Math.random()*P.Ls, hx = P.hx, hz = P.hz, ds = Math.sin(th)*s, dh = Math.cos(th)*s;
      KFX.dustRoll(wx(hx + P.dx*ds, 0), wy(0, hz - P.dy*ds), top + P.hk + dh, 6, 10, pal[0], 0.25); }
    if (P.kind === 'hall' && F.burst < 6){ const wave = (tf - 0.2)*P.vw; if (wave > F.burst*P.R*0.4){ F.burst++; const a = Math.random()*6.283, r = Math.min(P.R*0.8, wave), x = L.x + P.ix + Math.cos(a)*r*0.5, y = L.y - P.iz + Math.sin(a)*r*0.5;
      KFX.floorBurst(x, y, top + P.H*0.7, P.R*0.4, pal[0], 1.1*lod, 0, 0); KFX.sfx('crunch', x, y, top + P.H*0.5, 0.9);
      if (F.burst % 2 === 1) KFX.blastFlash(x, y, top + P.H*0.6, 1.3); } }
    // chunks in its colours: from the sample, as they are released (rigid bodies near the camera)
    if (R && R.smp.length && F.chunks < 140*lod){ for (let k = 0; k < 3; k++){ const s = R.smp[Math.floor(Math.random()*R.smp.length)]; if (s.tr > tf || s.tr < tf - 1.5) continue;
      const ox = s.x/(Math.hypot(s.x, s.z) || 1), oz = s.z/(Math.hypot(s.x, s.z) || 1), sp = 4 + 10*Math.random();
      KFX.chunk(wx(s.x, s.z), wy(s.x, s.z), top + s.y, ox*sp, -oz*sp, Math.random()*4, 1 + Math.random()*2.6, s.c); F.chunks++; } }
    // the landings
    if (R) for (; S.ev < R.ev.length && R.ev[S.ev].t <= tf; S.ev++){
      const E = R.ev[S.ev], x = wx(E.x, E.z), y = wy(E.x, E.z), big = !!E.big && !F.land;
      KFX.dustRoll(x, y, top, Math.max(10, P.R*(big ? 1 : 0.6)), Math.min(120, P.H*0.35 + 20), pal[0], Math.min(2.2, 0.6 + 3*E.k)*lod);
      if (big){ F.land = true; KFX.dustWave(L.x, L.y, top, P.R*0.9, Math.min(1.6, 0.6 + P.H/300 + P.R/250), pal[0]);
        KFX.sfx('explosion', x, y, top + 5, 1); KFX.sfx('debris', x, y, top + 3, 1); KFX.rumble(x, y, top, 7, 1);
        shake(3.5*Math.exp(-camD(x, y, top)/1100), x, y, top); }
      else { KFX.sfx('crunch', x, y, top + 5, Math.min(1, 0.4 + 2*E.k)); shake(1.2*E.k*Math.exp(-camD(x, y, top)/900), x, y, top); }
      pushWorld(x, y, top, Math.max(30, P.R*1.2), 6 + 10*P.e, Math.max(10, P.R*0.6));
      try { if (window.SGBreak && SGBreak.blast) SGBreak.blast(x, y, Math.max(25, P.R), 6e5); } catch (e){ /* */ }
      crushCar(x, y, top, Math.max(12, P.R*0.7), {ang:P.ang});
    }
    // a toppled tower brings down what it lands on (deterministic: every client does the same)
    if (P.kind === 'topple' && !F.line && tf >= P.tl){ F.line = true; const n = Math.max(2, Math.round(P.Ls/40));
      for (let i = 0; i < n; i++){ const s = Math.hypot(P.hx, P.hz) + (i + 0.5)/n*P.Ls, x = L.x + P.dx*s, y = L.y + P.dy*s;
        const Lb = blastList(x, y, top, Math.max(12, P.W*0.45), 0.9); if (Lb.length){ const acc = apply(Lb, x, y, W.now, S.quiet); if (!S.quiet && acc.length) lmEmitB(acc); } } }
  }
  // buildings brought down by a landmark's fall: the listeners hear about them too (local games)
  function lmEmitB(acc){ try { if (typeof KG === 'undefined' || !KG.G || KG.G.remote || !Array.isArray(KG.G.cbD) || !KG.G.on) return; const out = acc.filter(a => a.tile !== undefined).map(a => ({tile:a.tile, idx:a.idx, fx:a.fx, fy:a.fy, e:a.e})); if (!out.length) return;
    KG.G.destroyedN = (KG.G.destroyedN || 0) + out.length; for (const cb of KG.G.cbD){ try { cb(out); } catch (e){ console.error('[kaiju] onDestroy', e); } } } catch (e){ /* */ } }
  // the end of the show: the proxy goes, rubble blocks on the heap, fires and smoke columns on it
  function lmEnd(S){
    const L = S.L, P = S.P, top = L.top || 0, pal = lmPalette(S);
    if (S.mesh){ scene.remove(S.mesh); S.mesh.geometry.dispose(); S.mesh.material.dispose(); S.mesh = null; S.U = null; }
    if (S.res){ S.res.geo = null; S.res.smp = null; }
    if (S.heap) S.heap.children[0].scale.y = 1;
    S.st = 'down'; const i = LMACT.indexOf(S); if (i >= 0) LMACT.splice(i, 1);
    if (S.quiet || !S.heap) return;
    const hAt = S.heap.userData.hAt, Pp = S.heap.userData.pp, bb = S.heap.userData.bb, n = Math.round(clamp(40 + P.R*1.2, 50, 240)*(S.camD < 4000 ? 1 : 0.4));
    let k = 0; for (let tries = 0; k < n && tries < n*5; tries++){ const x = bb[0] + Math.random()*(bb[2] - bb[0]), y = bb[1] + Math.random()*(bb[3] - bb[1]), h = hAt(L.x + x, L.y + y); if (h < 0.4) continue; k++;
      const s = Math.min(9, 1.6 + P.H*0.012 + P.R*0.02)*(0.45 + Math.random()*0.9), c = pal[k % pal.length], cc = [c[0]*0.6 + 0.22, c[1]*0.6 + 0.21, c[2]*0.6 + 0.2];
      KFX.rubble(L.x + x, L.y + y, top + h - s*0.15, s, s*(0.5 + Math.random()*0.7), s*(0.3 + Math.random()*0.45), Math.random()*6.283, cc); }
    const nf = 2 + Math.floor(P.u1*3); for (let f = 0; f < nf; f++){ const a = f*2.4 + P.u2*6, r = P.R*0.35*Math.random(), x = L.x + Math.cos(a)*r, y = L.y + Math.sin(a)*r;
      KFX.fireAt(x, y, top + hAt(x, y)*0.8 + 1, Math.min(16, 5 + P.R*0.07), 180 + 140*Math.random(), true); }
  }
  // the city is reset / switched under a running show
  function lmDrop(S){ if (S.mesh){ scene.remove(S.mesh); S.mesh.geometry.dispose(); S.mesh.material.dispose(); S.mesh = null; } if (S.heap){ try { S.heap.children[0].material.dispose(); S.heap.children[0].geometry.dispose(); } catch (e){ /* */ } }
    const i = LMACT.indexOf(S); if (i >= 0) LMACT.splice(i, 1); LMS.delete(S.key); try { if (KD() && KD().lmSet) KD().lmSet(S.key, false); } catch (e){ /* */ } }
  // restore(): every landmark that came down is placed again (a fresh model), the heap goes
  function lmRestoreAll(){
    let n = 0;
    for (const S of [...LMS.values()]){
      if (S.st === 'ok'){ LMS.delete(S.key); continue; }
      const L = S.L; n++;
      if (S.mesh){ scene.remove(S.mesh); S.mesh.geometry.dispose(); S.mesh.material.dispose(); S.mesh = null; }
      if (S.g0 && S.p0) S.g0.position.copy(S.p0);           // still trembling: the model is still there
      if (S.heap){ try { if (S.heap.parent) S.heap.parent.remove(S.heap); S.heap.children[0].geometry.dispose(); S.heap.children[0].material.dispose(); } catch (e){ /* */ } }
      if (!S.g0 && lmList().includes(L) && typeof placeLandmarkMesh === 'function'){
        try { if (lmMeshes.get(L.id) === S.heap) lmMeshes.delete(L.id); placeLandmarkMesh(L); } catch (e){ console.error('[kaiju] landmark restore', e); } }
      try { if (KD() && KD().lmSet) KD().lmSet(S.key, false); } catch (e){ /* */ }
      LMS.delete(S.key);
    }
    LMACT.length = 0;
    return n;
  }
  function lmStats(){ const o = {}; for (const S of LMS.values()) if (S.st !== 'ok') o[S.key] = {st:S.st, kind:S.P ? S.P.kind : null, tris:S.res ? S.res.nTri : 0, chunks:S.res ? S.res.nCk : 0, buildMs:Math.round(S.buildMs || 0), sliceMax:+(S.sliceMax || 0).toFixed(1), swapMs:+(S.swapMs || 0).toFixed(1), tEnd:S.tEnd ? +S.tEnd.toFixed(1) : null};
    const dmg = {}; for (const S of LMS.values()) if (S.st === 'ok' && S.D > 0) dmg[S.key] = +S.D.toFixed(2); return {down:o, damage:dmg}; }

  // the effects keep running without a game (remote / API destruction): our own frame hook
  if (typeof HOOKS !== 'undefined') HOOKS.frame.push(t => { try { trackStep(); lmStep(); lblStep(t); } catch (e){ console.error('[kaiju] world fx', e); } });
  function stats(){ return {tracked:TRK.length, bitten:BITTEN.size, tossCar:tossN, bx:BX.size, labelsHidden:LBL.hid, landmarks:lmStats(), modes:TRK.reduce((o, T) => { o[T.P.mode] = (o[T.P.mode] || 0) + 1; return o; }, {})}; }
  return {isBay, isNyc, cityKey, isWater, ground, depthAt, tileOf, bldNear, destroyed, apply, decoStep, restore, wrapSkip, tossTraffic, panicTraffic, tossCar, landmarkHit, recOf, bxGet, BX, DECO, OWN,
    blast, blastList, plan, trackStep, finish, stats, TRK, BITTEN, W, hid,
    // [lm28/ruin]
    // tests: rebuild tiles as the app does (a tile reload)
    requeue:tiles => { try { if (typeof sgrQueueTiles === 'function'){ sgrQueueTiles(new Set(tiles)); return true; } } catch (e){ /* */ } return false; },
    shake, pushWorld, REACH, lmHit, lmBreak, lmStep, lmPlan, lmState, LMS, lmBreakable, lmThr, lblStep, LBL, lmRestoreAll};
})();

// ---- 50_game.js ----
/* ================= the mode: intro, the hunt, caught / escaped, HUD, tray card; the SGKaiju contract =================
   Flow: start -> the sky darkens to a sick green, a storm rolls in (window.SGWx 'storm' when present, restored after), sirens
   wail, the creature rises from the water nearest the player (a point of the sea / bay 1.2-3 km away, else any water, else the
   ground), roars, and hunts the local vehicle (SGF1 car, SGFly aircraft, else the view centre) or the targets set by setTargets.
   Goals: survive N minutes, or reach the extraction point (per city: airports and bridges out; the nearest one >= 4 km away).
   Caught: the tentacle closes on the car, lifts it to the face (camera from the car), then the result card (time survived,
   distance travelled, buildings destroyed). Remote mode (start({remote:true})): no AI and no local destruction; applyState()
   feeds the host's snapshots (interpolated ~0.25 s behind), destroy() applies the host's destruction.
   v30 - more creatures: start({species}) picks the creature ('cthulhu' (default), 'kraken', 'crab', 'serpent', 'shoggoth' or 'random':
   from the seed); its core (KB.get(id): Sim / pose / snap / interp) and model (KM or KSK.MODELS[id]) are swapped in, its presentation
   (KSX.P[id]: footfall and strike effects, sounds, messages, warnings, its own effects) drives poseEffects; state() carries sp and
   applyState() rebuilds the right creature on a mirror. The tab gets a creature picker (with 随机 Random), persisted with the rest.
   v33 (lm30/kaiju5): the escape goal is a route through 4-6 checkpoints on real roads, then the exit (beacons, rings, the HUD arrow,
   SGNav destination + markers); the creature cuts the player off on that route (KI, 18_block.js), may topple a tower onto it, and the
   difficulty ramps with every checkpoint; text off (T / the HUD's Aa / the tab: toasts, warnings, labels, result texts hidden; the
   timer, distances, arrows, counts stay); an always-visible 退出 Quit (and Esc with a confirm): stop, restore the city, leave the car. */
const KG = (() => {
  const PI = Math.PI, TAU = PI*2, M = KC.m;
  const EXITS = {
    sg:[{zh:'樟宜机场', en:'Changi Airport', ll:[1.3575, 103.9870]}, {zh:'兀兰长堤', en:'Woodlands Causeway', ll:[1.4490, 103.7690]}, {zh:'大士第二通道', en:'Tuas Second Link', ll:[1.3490, 103.6370]}, {zh:'实里达机场', en:'Seletar Airport', ll:[1.4165, 103.8680]}],
    bay:[{zh:'金门大桥北端', en:'Golden Gate Bridge (north end)', ll:[37.8320, -122.4790]}, {zh:'海湾大桥东端', en:'Bay Bridge (east end)', ll:[37.8255, -122.3010]}, {zh:'旧金山国际机场', en:'SFO Airport', ll:[37.6190, -122.3830]}, {zh:'奥克兰机场', en:'Oakland Airport', ll:[37.7126, -122.2197]}],
    nyc:[{zh:'乔治·华盛顿大桥', en:'George Washington Bridge', ll:[40.8517, -73.9527]}, {zh:'韦拉扎诺海峡大桥', en:'Verrazzano-Narrows Bridge', ll:[40.6066, -74.0447]}, {zh:'肯尼迪机场', en:'JFK Airport', ll:[40.6413, -73.7781]}, {zh:'拉瓜迪亚机场', en:'LaGuardia Airport', ll:[40.7769, -73.8740]}]};
  // v31: survive 10 minutes on every difficulty (the difficulty sets how fast and how often it strikes)
  const DIFFN = [['简单', 'Easy'], ['普通', 'Normal'], ['困难', 'Hard']], SURV = [600, 600, 600];
  const G = {on:false, remote:false, diff:1, goal:'survive', veh:'drive', seed:1, t:0, sim:null, O:KC.mkOut(), P:null, buf:[], rt:null, targets:null, localId:'local',
    cbD:[], cbC:[], destroyedN:0, clock:0, clockSet:false, dist:0, lastP:null, exit:null, result:null, caught:null, catchT:0, tint:0, tintGoal:0, wxPrev:null, trfPrev:null, shakeT:0, nearN:0, throwN:0,
    feetPh:[0, 0], lastK:0, lastP2:0, dripAcc:0, built:false, root:null, ms:0, msMax:0, frames:0, events:[], proxy:null, savedCam:null, hud:null, stateOut:null, lastFoot:[0, 0],
    sp:'cthulhu', SP:null, spReq:'cthulhu', ctx:null, models:{}, put:null, cpSkips:0};
  // ---- species
  const spIds = () => KB.ORDER.slice();
  const spOf = id => KB.get(id) || KB.get('cthulhu');
  const SPX = () => KSX.P[G.sp] || KSX.P.cthulhu;
  function resolveSp(req, seed){ if (req === 'random'){ const L = spIds(); return L[(seed >>> 0) % L.length]; } return KB.get(req) ? req : 'cthulhu'; }
  function useSp(id){ G.sp = KB.get(id) ? id : 'cthulhu'; G.SP = spOf(G.sp); return G.SP; }
  const now = () => G.t;
  // ---- the local target: the car, the aircraft, else the view centre
  function localTarget(){
    try { if (window.SGF1 && SGF1.F1 && SGF1.F1.on){ const C = SGF1.CAR, b = SGF1.crash && SGF1.crash.body ? SGF1.crash.body() : null;   // v31: the car's box for the contacts
      return b ? {id:G.localId, x:b.x, y:b.y, z:C.z, kind:'car', psi:b.psi, hl:b.hl, hw:b.hw, h:b.h} : {id:G.localId, x:C.x, y:C.y, z:C.z, kind:'car', psi:C.psi || 0}; } } catch (e){ /* */ }
    try { if (window.SGFly && SGFly.on){ const s = SGFly.state(); return {id:G.localId, x:s.x, y:s.y, z:s.z, kind:'air'}; } } catch (e){ /* */ }
    // (watching: the point the camera looks at, on the ground: a view target up in the air is not an aircraft to strike at, v31)
    const c = controls.target, gz = KW.ground(c.x, -c.z); return {id:G.localId, x:c.x, y:-c.z, z:Math.min(c.y, gz), kind:'cam', nocatch:true};
  }
  function targets(){ if (G.targets && G.targets.length) return G.targets; return [localTarget()]; }
  // ---- where it rises: water near the player (sea first), 1.2-3 km away; else the ground 1.8 km away
  function spawnPoint(x, y, mode){
    // the best water point around: about 1.7 km away (0.9-4.5 km), open water (most of a 150 m cross wet), the sea preferred
    let best = null;
    for (const r of [900, 1200, 1500, 1800, 2200, 2600, 3000, 3600, 4500, 5500, 7000, 9000]) for (let i = 0; i < 36; i++){
      const a = i*TAU/36, px = x + Math.cos(a)*r, py = y + Math.sin(a)*r; if (Math.abs(px) > HALF - 500 || Math.abs(py) > HALF - 500) continue;
      if (!KW.isWater(px, py)) continue;
      const wet = KW.isWater(px + 150, py) + KW.isWater(px - 150, py) + KW.isWater(px, py + 150) + KW.isWater(px, py - 150); if (wet < 3) continue;
      const v = typeof nat !== 'undefined' ? nat[cx2i(py)*N + cx2i(px)] : 1; if (mode === 'sea' && v !== 1) continue;
      const sc = Math.abs(r - 1700) + (v === 1 ? 0 : 250) + (4 - wet)*200;
      if (!best || sc < best.sc) best = {x:px, y:py, sc, d:KW.depthAt(px, py)};
    }
    if (best) return best;
    const a = Math.random()*TAU; return {x:x + Math.cos(a)*1800, y:y + Math.sin(a)*1800, d:0, land:true};
  }
  function pickExit(x, y){
    const L = EXITS[KW.cityKey()] || []; let best = null, far = null;
    for (const e of L){ const q = sgXY(e.ll[0], e.ll[1]), d = Math.hypot(q[0] - x, q[1] - y), o = Object.assign({x:q[0], y:q[1], d0:d}, e);
      if (d >= 4000 && (!best || d < best.d0)) best = o; if (!far || d > far.d0) far = o; }
    return best || far;
  }
  // ---- creature model in the scene
  function ensureModel(sp){
    sp = KB.get(sp) ? sp : (G.sp || 'cthulhu');
    if (!G.built){ G.built = true; KFX.init(); }
    let K = G.models[sp];
    if (!K){ K = sp === 'cthulhu' ? KM.get() : KSK.MODELS[sp].get(); G.models[sp] = K; scene.add(K.root); K.root.visible = false; }
    for (const id in G.models) if (id !== sp){ G.models[id].root.visible = false; if (G.models[id].hide) G.models[id].hide(); }
    G.K = K; G.root = K.root;
  }
  const _fq = new THREE.Quaternion(), _fa = new THREE.Vector3();
  function placeModel(O){
    const K = G.K; K.setPose(O.M, O); K.root.visible = true;
    K.root.position.set(O.W.x, O.W.z, -O.W.y); K.root.rotation.set(0, O.W.a, 0);
    // v31: a flinch (the army's hits, host only): the whole body recoils away from the hit about the ground under it, and shivers
    const P = G.P, fl = G.on && P && P.fl > 0 ? P.fl : 0;
    if (fl > 0){ const u = 1 - fl, a = 0.045*Math.sin(PI*Math.min(1, u*2.4))*fl + 0.005*Math.sin(G.t*29)*fl;
      _fa.set(-(P.fly || 0), 0, -(P.flx || 0)); if (_fa.lengthSq() > 1e-6){ _fa.normalize(); _fq.setFromAxisAngle(_fa, a); K.root.quaternion.premultiply(_fq); } }
    K.root.updateMatrixWorld(true);
    if (K.place) K.place(O, P);
  }
  // ---- start / stop
  function start(o){
    o = o || {};
    if (!SGR.on){ try { showToast('需要真实城市地图 · Needs the real city map'); } catch (e){ /* */ } return false; }
    if (G.on) stop(true);
    G.diff = Math.max(0, Math.min(2, o.difficulty === undefined ? G.diff : o.difficulty | 0)); G.goal = o.goal || G.goal; G.seed = (o.seed | 0) || ((Math.random()*1e9) | 0);
    G.spReq = o.species || (o.remote ? G.sp : 'cthulhu'); useSp(resolveSp(G.spReq, G.seed));
    ensureModel(G.sp); KW.wrapSkip();
    G.remote = !!o.remote; G.localId = o.localId || G.localId || 'local'; G.targets = null; G.buf.length = 0; G.rt = null;
    G.t = 0; G.dist = 0; G.lastP = null; G.result = null; G.caught = null; G.catchT = 0; G.destroyedN = 0; G.events.length = 0; G.lastK = 0; G.lastP2 = 0; G.feetPh = [0.5, 0.5]; G.shake = 0; G.nearN = 0; G.throwN = 0; G.obHits = 0; TCM.tc = null; obsReg();
    SHK.rum = SHK.jol = SHK.rumS = SHK.jolS = 0; if (!TR.loaded) loadTR(); SHK.lv = TR.shake; G.hindN = 0; G.armyHits = 0;
    if (o.keep !== true && !G.remote) KW.restore();
    const T = localTarget();
    let sp = null;
    if (o.spawn && typeof o.spawn === 'object' && isFinite(o.spawn.x)) sp = {x:+o.spawn.x, y:+o.spawn.y};
    else sp = spawnPoint(T.x, T.y, o.spawn === 'sea' ? 'sea' : 'auto');
    G.exit = G.goal === 'extract' ? pickExit(T.x, T.y) : null;
    G.sim = G.SP.Sim(ENV, {seed:G.seed, difficulty:G.diff, x:sp.x, y:sp.y, hdg:Math.atan2(T.x - sp.x, T.y - sp.y), destroy:!G.remote});
    G.P = G.sim.S; G.on = true; G.spawn = sp; G.O = G.SP.mkOut(); G.ctx = G.SP.mkCtx ? G.SP.mkCtx() : null; G.feetPh = (G.O.feet || []).map(() => 0.5);
    G.inkAcc = G.foamAcc = G.sprAcc = G.wakeAcc = G.slAcc = 0; KSX.stopLoop();
    // the mood: green sky, storm, sirens; traffic thins out
    G.tintGoal = 1;
    try { if (window.SGWx && SGWx.set){ G.wxPrev = SGWx.mode; SGWx.set('storm', false); } } catch (e){ G.wxPrev = null; }
    try { if (window.SGTraffic && SGTraffic.setDensity){ G.trfPrev = 1; SGTraffic.setDensity(0.45); } } catch (e){ /* */ }
    KFX.siren(true); G.sirenT = 32;
    // v33: the escape route through checkpoints (falls back to the single extraction point when the map has no roads for it)
    const cpOk = cpStart(T); if (!cpOk && G.exit && G.exit.cp) G.exit = null; navOn(true);
    hudShow(true); hudTitle(); textSync(); toast(cpOk ? `它从水下醒来……穿过 ${CP.list.length - 1} 个检查点逃出去！ · It wakes… Escape through ${CP.list.length - 1} checkpoints!` : '它从水下醒来…… · It wakes beneath the water…', 4);
    return true;
  }
  function stop(quiet){
    if (!G.on) return false;
    G.on = false; G.tintGoal = 0; KFX.siren(false); KFX.hide(); KSX.stopLoop();
    if (G.root) G.root.visible = false; if (G.K && G.K.hide) G.K.hide();
    SHK.rum = SHK.jol = SHK.rumS = SHK.jolS = 0;
    try { if (G.wxPrev && window.SGWx && SGWx.set) SGWx.set(G.wxPrev, false); } catch (e){ /* */ } G.wxPrev = null;
    try { if (G.trfPrev && window.SGTraffic && SGTraffic.setDensity) SGTraffic.setDensity(1); } catch (e){ /* */ } G.trfPrev = null;
    caughtEnd(); hudShow(false); resultHide(); cpEnd(); askHide();
    return true;
  }
  // ---- contract helpers
  function state(){ if (!G.sim || !G.SP) return null; if (G.remote && G.P) return G.SP.snap(G.P); return G.SP.snap(G.sim.S); }
  function applyState(s){
    if (!s || typeof s !== 'object') return false;
    const sp = KB.get(s.sp) ? s.sp : 'cthulhu';
    if (!G.on) start({remote:true, spawn:{x:+s.x || 0, y:+s.y || 0}, species:sp});
    else if (G.remote && sp !== G.sp) start({remote:true, spawn:{x:+s.x || 0, y:+s.y || 0}, species:sp, keep:true, localId:G.localId, goal:G.goal, difficulty:G.diff, seed:G.seed});
    if (!G.remote) return false;
    const u = G.SP.unsnap(s); const B = G.buf;
    if (B.length && u.t <= B[B.length - 1].t){ if (u.t < B[B.length - 1].t - 5){ B.length = 0; G.rt = null; } else return true; }
    B.push(u); while (B.length > 24) B.shift();
    return true;
  }
  // remote: the render time follows the newest snapshot ~0.25 s behind; states interpolated (or extrapolated briefly)
  const RS = {}, RS2 = {};
  function remoteStep(dt){
    const B = G.buf; if (!B.length) return null;
    const newest = B[B.length - 1].t, want = newest - 0.25;
    if (G.rt === null || Math.abs(G.rt - want) > 1.5) G.rt = want; else G.rt += dt*(1 + Math.max(-0.5, Math.min(0.5, (want - G.rt)*0.8)));
    let i = 0; while (i < B.length - 2 && B[i + 1].t <= G.rt) i++;
    const a = B[i], b = B[Math.min(i + 1, B.length - 1)];
    if (a === b){ Object.assign(RS, a); RS.t = G.rt; return RS; }
    G.SP.interp(a, b, (G.rt - a.t)/Math.max(1e-3, b.t - a.t), RS);
    if (G.rt > b.t){ const ex = Math.min(0.6, G.rt - b.t), tr = G.SP.travel ? G.SP.travel(b) : b.hdg; RS.x = b.x + Math.sin(tr)*b.v*ex; RS.y = b.y + Math.cos(tr)*b.v*ex; RS.g = (b.g + ex*b.v/G.SP.strideOf(b.v, b)) % 1; RS.t = b.t + ex; }
    return RS;
  }
  function setTargets(L){ G.targets = Array.isArray(L) && L.length ? L.filter(t => t && isFinite(t.x) && isFinite(t.y)).map(t => { const o = {id:t.id == null ? 'p' : t.id, x:+t.x, y:+t.y, z:+t.z || 0, nocatch:!!t.nocatch}; if (isFinite(t.psi)) o.psi = +t.psi; if (t.kind) o.kind = String(t.kind); return o; }) : null; return G.targets ? G.targets.length : 0; }
  function onDestroy(cb){ if (typeof cb === 'function') G.cbD.push(cb); return () => { const i = G.cbD.indexOf(cb); if (i >= 0) G.cbD.splice(i, 1); }; }
  function onCatch(cb){ if (typeof cb === 'function') G.cbC.push(cb); return () => { const i = G.cbC.indexOf(cb); if (i >= 0) G.cbC.splice(i, 1); }; }
  function destroy(L){
    if (!Array.isArray(L) || !L.length) return 0;
    const P = G.P || {x:0, y:0}; const out = KW.apply(L, P.x, P.y, G.t, false); G.destroyedN += out.length; return out.length;
  }
  function status(){
    const P = G.P; let d = null;
    if (P){ for (const T of targets()){ const dd = Math.hypot(T.x - P.x, T.y - P.y); if (d === null || dd < d) d = dd; } }
    return {on:G.on, phase:P ? P.phase : 'off', dist:d === null ? null : Math.round(d), timer:+G.t.toFixed(1), remaining:G.goal === 'survive' ? Math.max(0, Math.round(SURV[G.diff] - G.t)) : null,
      caught:G.caught ? G.caught.id : null, crushed:!!(G.caught && G.caught.crush), nearMisses:G.nearN || 0, throws:G.throwN || 0, obstacleHits:G.obHits || 0, result:G.result ? G.result.kind : null, goal:G.goal, exit:G.exit ? {zh:G.exit.zh, en:G.exit.en, dist:Math.round(Math.hypot(G.exit.x - localTarget().x, G.exit.y - localTarget().y))} : null,
      destroyed:G.destroyedN, difficulty:G.diff, remote:G.remote, species:G.sp,
      // v33: the checkpoints {n, passed, next:{n, x, y, dist}}, the creature's block {mode 0-3, x, y, n, dodged, toppled}, text on / off
      checkpoints:CP.on || CP.list.length ? {n:Math.max(0, CP.list.length - 1), passed:CP.list.filter(c => c.passed && !c.exit).length, skips:G.cpSkips || 0, next:CP.list[CP.idx] ? {n:CP.list[CP.idx].n, exit:!!CP.list[CP.idx].exit, x:Math.round(CP.list[CP.idx].x), y:Math.round(CP.list[CP.idx].y), dist:Math.round(Math.hypot(CP.list[CP.idx].x - localTarget().x, CP.list[CP.idx].y - localTarget().y))} : null} : null,
      block:G.on && !G.remote && G.sim && G.sim.S && G.sim.S.bInit ? {mode:G.sim.S.bm, x:Math.round(G.sim.S.bx), y:Math.round(G.sim.S.by), n:G.sim.S.bN, dodged:G.sim.S.bPass, gaveUp:G.sim.S.bGive, toppled:G.sim.S.bTopN} : null, text:textOn()};
  }
  // ---- v31: the army's side of the contract: hinder (a hit on the creature: it slows, flinches, turns on the shooter; never damage)
  // and body (where shells can hit: <= 24 spheres in world metres, [] without a creature; the objects are reused every frame)
  function hinder(h){ if (!G.on || G.remote || !G.sim || !G.sim.hinder || !h || typeof h !== 'object') return false; const ok = G.sim.hinder(h); if (ok) G.hindN = (G.hindN || 0) + 1; return ok; }
  const BODY = {out:[], f:-1, list:[]};
  function body(){
    if (!G.on || !G.P || !G.O || !G.SP || !G.SP.body || (G.P.r || 0) < 0.3){ BODY.list.length = 0; return BODY.list; }
    if (BODY.f !== G.frames){ BODY.f = G.frames; G.SP.body(G.O, G.P, BODY.out); BODY.list.length = 0; for (let i = 0; i < BODY.out.length && i < 24; i++) BODY.list.push(BODY.out[i]); }
    return BODY.list;
  }
  // ---- the world as the core sees it
  // v31: the army (window.SGArmy, by agent army; guarded): its units as targets the AI may attack, and the hits of the strikes
  const ARMY = {L:null, t:-1};
  function armyList(){ if (ARMY.t === G.frames) return ARMY.L; ARMY.t = G.frames; ARMY.L = null;
    try { const A = window.SGArmy; if (A && A.targets && !G.remote && (A.on === undefined || A.on)){ const L = A.targets(); if (Array.isArray(L) && L.length) ARMY.L = L; } } catch (e){ ARMY.L = null; }
    return ARMY.L; }
  function armyHit(id, h){ try { const A = window.SGArmy; if (A && A.hit) A.hit(id, h); G.armyHits = (G.armyHits || 0) + 1; } catch (e){ console.warn('[kaiju] army hit', e); } }
  const ENV = {
    ground:(x, y) => KW.ground(x, y), water:(x, y) => KW.isWater(x, y), targets:() => targets(), army:() => armyList(), armyHit:(id, h) => armyHit(id, h),
    route:() => routeNow(),     // v33: the player's predicted route in the escape mission (KI, 18_block.js), else null
    snap:(x, y, r) => roadSnap(x, y, r || 120),   // v33: the nearest drivable road point (a block point on a real street)
    bldNear:(x, y, r, cb) => KW.bldNear(x, y, r, cb), destroyed:(ti, i) => KW.destroyed(ti, i),
    onDestroy:L => { const P = G.sim.S, acc = KW.apply(L, P.x, P.y, G.t, false); if (!acc.length) return; G.destroyedN += acc.length; const b0 = L[0].b; if (b0) G.lastD = [b0.cx, b0.cy, b0.g, b0.h];
      // listeners get {tile, idx} (+ v30: the impact fx, fy, e, z when known, so a mirror's collapse can match the host's)
      const by = new Map(); for (const it of L) by.set(it.tile + ':' + it.idx, it);
      const out = acc.map(a => { const it = by.get(a.tile + ':' + a.idx), o = {tile:a.tile, idx:a.idx}; if (it && it.fx !== undefined){ o.fx = it.fx; o.fy = it.fy; o.e = it.e; if (it.z !== undefined) o.z = it.z; } return o; });
      for (const cb of G.cbD){ try { cb(out); } catch (e){ console.error('[kaiju] onDestroy', e); } } }
  };
  // ---- per frame
  const _v = new THREE.Vector3();
  function frame(t, dt){
    tintStep(dt);
    // one monotonic clock for the particles, the skin shader and the collapses (bld.js) - simulated steps advance it too
    G.clock += dt;
    if (!G.clockSet && window.SGBld && SGBld.kd && SGBld.kd.useClock){ G.clockSet = true; SGBld.kd.useClock(() => G.clock); }
    // particles and collapses keep going after a game (and for remote / API destruction without a creature)
    KFX.frame(G.clock, typeof nightF !== 'undefined' ? nightF : 0); if (window.SGBld && SGBld.kd && SGBld.kd.frame) SGBld.kd.frame();
    // v33: the road index for the checkpoints, in slices (the creature tab open, a game, or driving)
    if (!CP.RI && typeof SGR !== 'undefined' && SGR.on && SGR.lines && (G.on || (UI.pane && !UI.pane.hidden) || (window.SGF1 && SGF1.F1 && SGF1.F1.on))) roadIdxJob(2.5);
    if (!G.on) return;
    if (G.paused && !G.remote){ cpFrame(); return; }     // v33: the quit confirm is open
    const t0 = performance.now(); G.t += dt; G.frames++;
    let P;
    if (CP.on && !G.remote) routeUpdate(localTarget(), dt);
    if (G.remote){ P = remoteStep(dt); if (!P) return; G.P = P; if (G.SP.ctxStep) G.SP.ctxStep(G.ctx, P, ENV); G.SP.pose(P, ENV, G.O, G.ctx); mirrorTouch(P, dt); }
    else { const out = G.sim.step(dt); P = G.P = G.sim.S; G.O = G.sim.O; for (const e of out.events) onEvent(e); }
    G.partsClock = G.clock; G.partsWall = performance.now();
    const O = G.O; placeModel(O);
    // effects driven by the pose state (identical on host and mirror)
    poseEffects(P, O, dt);
    // goals / caught
    const L = localTarget();
    if (G.lastP && !G.caught){ const d = Math.hypot(L.x - G.lastP[0], L.y - G.lastP[1]); if (d < 200) G.dist += d; }
    G.lastP = [L.x, L.y];
    if (!G.remote && !G.result && !G.caught && L.kind !== 'cam'){
      if (G.goal === 'survive' && G.t >= SURV[G.diff]) win('survive');
      if (G.goal === 'extract' && !CP.on && G.exit && Math.hypot(L.x - G.exit.x, L.y - G.exit.y) < 160) win('extract');
      if (G.goal === 'extract' && CP.on && G.t >= SURV[G.diff]) win('timeout');     // v33: 10:00 without reaching the exit
    }
    cpStep(L, dt); cpFrame();
    // (the big map of window.SGNav open: the creature HUD steps aside)
    if (UI.hud){ let o = false; try { const N = window.SGNav; o = !!(N && N.isOpen); } catch (e){ o = false; } if (o !== UI.navO){ UI.navO = o; UI.hud.style.visibility = o ? 'hidden' : ''; } }
    // v33: the player left the vehicle the game put them in (the drive module's own exit, Esc in the aircraft): the mode ends too
    if (G.put && !G.result && !G.caught && !G.remote){ let left = false; try { left = G.put === 'car' ? !(window.SGF1 && SGF1.F1 && SGF1.F1.on) : G.put === 'fly' ? !(window.SGFly && SGFly.on) : false; } catch (e){ left = false; }
      if (left){ G.leftT = (G.leftT || 0) + dt; if (G.leftT > 0.25){ G.leftT = 0; quit(); return; } } else G.leftT = 0; }
    if (G.remote && P.phase === 'catch' && String(P.target) === String(G.localId) && !G.caught) caughtBegin({id:G.localId, x:P.ax, y:P.ay, z:P.az});
    if (G.remote && P.phase === 'crush' && String(P.target) === String(G.localId) && !G.caught) caughtBegin({id:G.localId, x:P.ax, y:P.ay, z:P.az}, true);
    if (G.caught) caughtStep(dt, O);
    KFX.beacon(G.exit ? G.exit.x : 0, G.exit ? G.exit.y : 0, !!G.exit && !G.result && !CP.on);
    KW.decoStep(G.t, ti => { const T = SGR.tiles.get(ti); return !!T && Math.hypot(T.cx - P.x, T.cy - P.y) < 1300; });
    if (G.sirenT > 0){ G.sirenT -= dt; if (G.sirenT <= 0) KFX.siren(false); }
    if (P.r > 0.6 && (G.panicT = (G.panicT || 0) - dt) <= 0){ G.panicT = 1; KW.panicTraffic(P.x, P.y, 320); }
    hudTick(P, L);
    const ms = performance.now() - t0; G.ms = G.ms*0.95 + ms*0.05; G.msMax = Math.max(G.msMax*0.995, ms);
  }
  function onEvent(e){
    G.events.push(e.e === 'destroy' ? {t:+G.t.toFixed(2), e:'destroy', n:e.list.length} : Object.assign({t:+G.t.toFixed(2)}, e)); if (G.events.length > 60) G.events.shift();
    if (e.e === 'catch'){ for (const cb of G.cbC){ try { cb(e.id); } catch (er){ console.error('[kaiju] onCatch', er); } } if (String(e.id) === String(G.localId)) caughtBegin({id:e.id, x:G.sim.S.ax, y:G.sim.S.ay, z:G.sim.S.az}); }
    // v31: the car is touched only by real contact (KB.Touch): crushed under a foot, thrown by a slam / a sweep / a gust, near misses
    if (e.e === 'crush'){ for (const cb of G.cbC){ try { cb(e.id, 'crush'); } catch (er){ console.error('[kaiju] onCatch', er); } } if (String(e.id) === String(G.localId)) caughtBegin({id:e.id, x:e.x, y:e.y, z:KW.ground(e.x, e.y)}, true); }
    if (e.e === 'throw' && String(e.id) === String(G.localId)) throwCar(e);
    if (e.e === 'near' && String(e.id) === String(G.localId)) nearMiss(e);
    if (e.e === 'roar') toast(SPX().roarMsg, 3.5);
    if (e.e === 'hit'){ const h = SPX().hits[e.k];   // a heavy blow: the destruction module's blast (guarded; anything it brings down goes to the listeners)
      if (h && h.boom && KW.blast){ try { const gz = KW.ground(e.x, e.y), L = noCar(() => KW.blast(e.x, e.y, gz, h.r, 0.9)); if (Array.isArray(L) && L.length) forwardDestroyed(L); } catch (er){ console.warn('[kaiju] blast', er); } } }
    if (e.e === 'burst') toast('它加速了！ · It is charging!', 2);
    // v33: cutting the player off (KI): a warning, a roar from it, a rumble; the tower it shoulders over onto the road
    if (e.e === 'block'){ G.blockN = (G.blockN || 0) + 1; toast('它要在前方拦截你！换条路 · IT IS CUTTING YOU OFF AHEAD — take another street!', 3.2); const P = G.sim.S, O = G.O;
      try { if (G.sp === 'cthulhu') KFX.roar(O.mouth[0], O.mouth[1], O.mouth[2], 0.7); else if (KSX.ROAR[G.sp]) KSX.ROAR[G.sp](O.mouth[0], O.mouth[1], O.mouth[2], 0.7); } catch (er){ /* */ } feed(0.18); void P; }
    if (e.e === 'blockAt'){ toast(e.mode === 3 ? '它在前方横穿马路！ · It is crossing the road ahead!' : '它挡在前面的路上！ · It is blocking the road ahead!', 2.6); feed(0.22); }
    if (e.e === 'topple'){ G.toppleN = (G.toppleN || 0) + 1; toast('它把大楼推倒在路上！ · It is toppling a tower onto the road!', 2.8); feed(0.3); }
    if (e.e === 'unblock' && e.why === 'passed'){ G.dodgeN = (G.dodgeN || 0) + 1; toast('躲过了拦截！ · You got past it!', 1.8); }
  }
  // the destruction module's blast may bring down more than the creature's contacts did: count it and tell the listeners
  function forwardDestroyed(L){ const acc = L.filter(a => a && isFinite(a.tile) && isFinite(a.idx)).map(a => ({tile:a.tile | 0, idx:a.idx | 0})); if (!acc.length) return;
    G.destroyedN += acc.length; for (const cb of G.cbD){ try { cb(acc); } catch (e){ console.error('[kaiju] onDestroy', e); } } }
  // footfalls, strike impacts, the roar, water streaming off it, eyes (per species: KSX.P[id])
  function poseEffects(P, O, dt){
    const night = typeof nightF !== 'undefined' ? nightF : 0, X = SPX(), sp = G.sp, feet = O.feet || [];
    if (X.foot){ const f = X.foot;
      for (let i = 0; i < feet.length; i++){
        const F = feet[i], ph = F.ph, prev = G.feetPh[i] === undefined ? ph : G.feetPh[i]; G.feetPh[i] = ph;
        if (P.v > 0.8 && P.r > 0.5 && ph < prev - 0.5 && !F.skip){       // a foot (an arm, a leg) comes down
          const x = F.ankle[0], y = F.ankle[1], gz = KW.ground(x, y), water = KW.isWater(x, y), d = camDist(x, y, gz);
          KFX.impact(x, y, water ? 0 : gz, f.r, water, f.k, 3, 0.55);
          if (sp === 'cthulhu') KFX.stomp(x, y, gz, 1); else if (KSX.STEP[sp] && ((G.stepN = (G.stepN || 0) + 1) % (feet.length > 4 ? 2 : 1)) === 0) KSX.STEP[sp](x, y, gz, 1);
          if (water) KFX.sfx('splash', x, y, 0, f.k);
          shakeEv(f.se || 0.3, x, y, gz, f.sR || 150, f.shake*Math.exp(-d/900));
          noCar(() => KW.tossTraffic(x, y, f.toss, f.k));
          KW.landmarkHit(x, y, gz, f.r, G.t, Math.min(1, 0.35 + 0.5*f.k));
        }
      }
    }
    // strike impacts
    const hp = G.SP.HIT_P[P.k], hx = X.hits[P.k];
    if (P.k && hp !== undefined && hx && G.lastK === P.k && G.lastP2 < hp && P.p >= hp){
      const gz = KW.ground(P.ax, P.ay), water = KW.isWater(P.ax, P.ay), d = camDist(P.ax, P.ay, gz);
      KFX.impact(P.ax, P.ay, water ? 0 : gz, hx.r, water, 1.3); shakeEv(hx.se || 0.75, P.ax, P.ay, gz, 230, 4*Math.exp(-d/700));
      if (!water && hx.boom) try { if (window.SGFX && SGFX.explosion) SGFX.explosion(P.ax, P.ay, gz, 1.2); } catch (e){ /* */ }
      KFX.sfx(water ? 'splash' : 'crunch', P.ax, P.ay, gz + 2, 1); noCar(() => KW.tossTraffic(P.ax, P.ay, 120, 1.2)); KW.landmarkHit(P.ax, P.ay, gz, 60, G.t, 0.9);
      if (hx.snap) KSX.snap(P.ax, P.ay, P.az, 1);
    }
    if (P.k === 6 && (G.lastK !== 6 || G.lastP2 > P.p)){ if (sp === 'cthulhu') KFX.roar(O.mouth[0], O.mouth[1], O.mouth[2], 1); else if (KSX.ROAR[sp]) KSX.ROAR[sp](O.mouth[0], O.mouth[1], O.mouth[2], 1); }
    G.lastK = P.k; G.lastP2 = P.p;
    if (X.efx) X.efx(P, O, dt, G);
    // water streaming off it while it rises and for a while after (and while it wades)
    const wet = P.r < 1 ? 1 : Math.max(0, 1 - (G.t - (G.riseEndT || G.t))/40);
    if (P.r >= 1 && !G.riseEndT) G.riseEndT = G.t;
    const wading = KW.isWater(P.x, P.y);
    KM.U.uWet.value = Math.max(wet, wading ? 0.8 : 0, 0.25); KM.U.uKT.value = G.clock;
    const rate = (P.r < 1 ? 260 : 0) + wet*120 + (wading ? 40 : 0);
    G.dripAcc += rate*dt;
    while (G.dripAcc > 1){ G.dripAcc--; if (sp === 'cthulhu') dripOne(O); else if (X.drip) dripAt(X.drip(O, G.SP)); }
    // eyes: a dim glow by day, burning at night (and while it roars)
    const ek = (0.35 + 1.4*night + (P.k === 6 ? 0.8 : 0))*(sp === 'shoggoth' ? 0.55 : 1);
    KM.U.uEye.value = 0.8 + 2.2*night + (P.k === 6 ? 1 : 0);
    KFX.eyes(O.eye, ek, P.r > 0.35);
  }
  const DRIP_B = ['root', 'sp1', 'sp2', 'chest', 'head', 'head', 'uarmL', 'uarmR', 'farmL', 'farmR', 'handL', 'handR', 'wf1L', 'wf1R', 'warmL', 'warmR', 'f3_2', 'f9_1', 'tL_6', 'tR_6', 'tL_9', 'tR_9'].map(n => KC.BI[n]);
  function dripOne(O){
    const bi = DRIP_B[(Math.random()*DRIP_B.length) | 0], p = KC.jointW(O, bi), r = bi === KC.BI.head ? 28 : bi <= KC.BI.chest ? 36 : 12, a = Math.random()*TAU;
    const x = p[0] + Math.cos(a)*r, y = p[1] + Math.sin(a)*r, z = p[2] + (Math.random() - 0.5)*r;
    if (z < 0) return;
    KFX.drip(x, y, z, Math.cos(a)*2, Math.sin(a)*2, -Math.random()*3, Math.sqrt(2*Math.max(1, z)/9.81) + 0.3);
  }
  function dripAt(S){ if (!S || !S[0]) return; const p = S[0], r = S[1] || 10, a = Math.random()*TAU, x = p[0] + Math.cos(a)*r, y = p[1] + Math.sin(a)*r, z = p[2] + (Math.random() - 0.5)*r;
    if (z < 0) return; KFX.drip(x, y, z, Math.cos(a)*2, Math.sin(a)*2, -Math.random()*3, Math.sqrt(2*Math.max(1, z)/9.81) + 0.3); }
  const camDist = (x, y, z) => { const c = camera.position; return Math.hypot(c.x - x, c.y - z, -c.z - y); };
  // ---- v31: the camera shake. v30 moved the camera by up to 6 m at ~6 Hz (sine sums) from every footfall, strike and collapse and
  // was unplayable near the creature. Now: a calm, readable shake - low-frequency smoothed value noise (two octaves; ~1.6 Hz rumble,
  // a ~4.5 Hz band for short jolts), mostly rotation (a few tenths of a degree), a small positional part, hard caps; a rumble level
  // and a jolt level fed by events with a distance falloff 1 / (1 + (d / R)^2); much less inside a car (the camera within 3 m of the
  // car: cockpit / bonnet / interior views) and while the car drives fast; only big events close by (a foot landing very near, a tower
  // falling next to you, a strike) reach the jolt. Levels (the 克苏鲁 tab, persisted): 0 off, 1 low (default), 2 medium.
  const SHK_LV = [null, {rot:0.35, pos:0.03, jrot:1.0, jpos:0.09, capR:1.2, capP:0.12}, {rot:0.7, pos:0.07, jrot:1.9, jpos:0.2, capR:2.2, capP:0.26}];
  const SHK = {lv:1, rum:0, jol:0, rumS:0, jolS:0, t:0, k:1, inCar:false, last:0, lg:0, out:{yaw:0, pitch:0, roll:0, x:0, y:0, deg:0, m:0}, ev:0,
    st:{n:0, maxDeg:0, maxM:0, sDeg:0, sM:0, inCar:0}, leg:null};
  function hsh(i){ let h = Math.imul(i | 0, 0x27d4eb2d) ^ 0x165667b1; h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0)/2147483648 - 1; }
  function vnoise(t, s){ const i = Math.floor(t), f = t - i, u = f*f*(3 - 2*f), a = hsh(i*131 + s*7919), b = hsh((i + 1)*131 + s*7919); return a + (b - a)*u; }
  const snz = (t, s) => 0.72*vnoise(t, s) + 0.28*vnoise(t*2.03 + 17.3, s + 3);
  // an event: energy e 0-1 at (x, y, z), falloff distance R (m); leg = the v30 amount (only for the before / after numbers in tests)
  function shakeEv(e, x, y, z, R, leg){
    if (SHK.leg && leg > 0) SHK.leg.a = Math.min(6, SHK.leg.a + leg);
    if (!(e > 0) || !G.on) return; const q = camDist(x, y, z)/(R || 200); feed(e/(1 + q*q));
  }
  function feed(a){ if (!(a > 0.002)) return; SHK.rum = Math.min(1, SHK.rum + a*0.55); if (a > 0.3) SHK.jol = Math.min(1, Math.max(SHK.jol, 0.2 + (a - 0.3)/0.7*0.8)); SHK.ev++; }
  // the destruction module's shakes (40_world.js: collapses, landings, blasts): shakeIn(a, x, y, z) with a = the v30 amount (0-6, already
  // damped by the distance as exp(-d / 800..900)); with the event's place the damping is redone as ours (1 / (1 + (d / 240)^2)), without
  // it a curve keeps the small, far ones out. Legacy: 40_world's shake(a) writes KG.G.shake = min(6, G.shake + a) - the accessor below
  // turns the increment into shakeIn(a) (no place)
  function shakeIn(a, x, y, z){
    if (!(a > 0)) return; if (SHK.leg) SHK.leg.a = Math.min(6, SHK.leg.a + a);
    if (!G.on) return; let e;
    if (isFinite(x) && isFinite(y)){ const d = camDist(x, y, isFinite(z) ? z : KW.ground(x, y)), e0 = Math.min(1, a*Math.exp(Math.min(3, d/850))/5), q = d/240; e = e0/(1 + q*q); }
    else e = Math.pow(Math.min(1, a/5), 1.6);
    feed(e);
  }
  Object.defineProperty(G, 'shake', {enumerable:true, get(){ return SHK.lg; }, set(v){ v = +v || 0; const d = v - SHK.lg; SHK.lg = Math.max(0, Math.min(6, v)); if (d > 1e-4) shakeIn(d); }});
  function shakeSet(lv){ if (lv !== undefined && [0, 1, 2].includes(+lv)){ if (!TR.loaded) loadTR(); TR.shake = SHK.lv = +lv; saveTR(); paneSync(); } return SHK.lv; }
  // the camera's distance to the player's car centre (< 3 m: a cockpit / bonnet / interior view) and the car's speed
  function carView(){ try { const F = window.SGF1; if (F && F.F1 && F.F1.on && F.CAR){ const C = F.CAR, c = camera.position, d = Math.hypot(c.x - C.x, c.y - ((C.z || 0) + 1.1), -c.z - C.y); return {inCar:d < 3, v:Math.abs(C.u || 0)}; } } catch (e){ /* */ } return null; }
  // per frame (prerender): levels decay and smooth, the offsets from the noise, scaled and capped; returns true if the camera moves
  const _sq = new THREE.Quaternion(), _se = new THREE.Euler(0, 0, 0, 'YXZ'), _sv = new THREE.Vector3();
  function shakeStep(dt){
    SHK.rum = Math.max(0, SHK.rum - dt*0.4); SHK.jol = Math.max(0, SHK.jol - dt*2.2); SHK.lg *= Math.exp(-dt*2.4);
    SHK.rumS += (SHK.rum - SHK.rumS)*Math.min(1, dt*7); SHK.jolS += (SHK.jol - SHK.jolS)*Math.min(1, dt*22);
    SHK.t += dt; const O = SHK.out; O.yaw = O.pitch = O.roll = O.x = O.y = O.deg = O.m = 0;
    const L = SHK_LV[SHK.lv];
    if (SHK.leg){ const a = SHK.leg.a, t = performance.now()/1000, m = a*Math.hypot(Math.sin(t*37)*0.6, Math.sin(t*41 + 1), Math.sin(t*33 + 2)*0.6); SHK.leg.n++; SHK.leg.max = Math.max(SHK.leg.max, m); SHK.leg.s2 += m*m; SHK.leg.a *= Math.exp(-(1/60)*2.4); }
    if (!L || !G.on || (SHK.rumS < 0.004 && SHK.jolS < 0.004)) return false;
    const cv = carView(); let k = 1, kj = 1; SHK.inCar = !!(cv && cv.inCar);
    if (cv){ const fast = clamp01((cv.v - 8)/30); k = (cv.inCar ? 0.35 : 1)*(1 - 0.55*fast); kj = (cv.inCar ? 0.45 : 1)*(1 - 0.4*fast); }
    SHK.k = k;
    const ar = L.rot*SHK.rumS*k, aj = L.jrot*Math.pow(SHK.jolS, 1.2)*kj, pr = L.pos*SHK.rumS*k, pj = L.jpos*Math.pow(SHK.jolS, 1.2)*kj, tr = SHK.t*1.6, tj = SHK.t*4.5;
    const cap = (v, c) => v < -c ? -c : v > c ? c : v;
    O.yaw = cap(ar*snz(tr, 1) + aj*snz(tj, 11), L.capR); O.pitch = cap(ar*snz(tr, 2) + aj*snz(tj, 12), L.capR); O.roll = cap(0.5*(ar*snz(tr*0.8, 3) + aj*snz(tj, 13)), L.capR*0.6);
    O.x = cap(pr*snz(tr*1.3, 4) + pj*snz(tj, 14), L.capP); O.y = cap(pr*snz(tr*1.3, 5) + pj*snz(tj, 15), L.capP);
    O.deg = Math.hypot(O.yaw, O.pitch, O.roll); O.m = Math.hypot(O.x, O.y);
    const S = SHK.st; S.n++; S.maxDeg = Math.max(S.maxDeg, O.deg); S.maxM = Math.max(S.maxM, O.m); S.sDeg += O.deg*O.deg; S.sM += O.m*O.m; if (SHK.inCar) S.inCar++;
    return O.deg > 1e-4 || O.m > 1e-5;
  }
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  function shakeStats(reset){ const S = SHK.st, L = SHK.leg, r = {level:SHK.lv, frames:S.n, maxDeg:+S.maxDeg.toFixed(3), rmsDeg:+Math.sqrt(S.sDeg/Math.max(1, S.n)).toFixed(3), maxM:+S.maxM.toFixed(3), rmsM:+Math.sqrt(S.sM/Math.max(1, S.n)).toFixed(4), inCarFrames:S.inCar, events:SHK.ev,
      rum:+SHK.rum.toFixed(3), jol:+SHK.jol.toFixed(3), v30:L ? {frames:L.n, maxM:+L.max.toFixed(2), rmsM:+Math.sqrt(L.s2/Math.max(1, L.n)).toFixed(2)} : null};
    if (reset){ S.n = 0; S.maxDeg = S.maxM = S.sDeg = S.sM = 0; S.inCar = 0; SHK.ev = 0; if (L){ L.n = 0; L.max = 0; L.s2 = 0; } } return r; }
  // ---- caught: hold the car, lift it to the face, camera from the car; then the result card
  // v31: crush = a foot (a stabbing leg, the rolling trunk) came down on the car: it is wrecked where it stands (held, flattened by the
  // damage model), a low camera beside it looks up at the foot on it, then the result card (被踩扁 CRUSHED)
  function caughtBegin(T, crush){
    if (G.caught) return; G.caught = {id:T.id, t0:G.t, x:T.x, y:T.y, z:T.z, crush:!!crush};
    try { if (window.SGF1 && SGF1.F1 && SGF1.F1.on){ SGF1.hold({thr:0, brk:crush ? 1 : 0, steer:0, hb:1}); if (!crush) SGF1.meshes(false); G.caught.car = true;
      if (crush){ const C = SGF1.CAR, F = SGF1.crash, b = F && F.body ? F.body() : null, m = b && b.m || 1500, ps = b ? b.psi : C.psi || 0;
        G.caught.x = C.x; G.caught.y = C.y; G.caught.z = C.z || 0; G.caught.psi = ps;
        if (F && F.hit) for (const [lx, ly] of [[1.6, 0.6], [-1.6, -0.6], [1.6, -0.6], [-1.6, 0.6]]) F.hit(0, 0, -9*m, C.x + Math.cos(ps)*lx - Math.sin(ps)*ly, C.y + Math.sin(ps)*lx + Math.cos(ps)*ly, (C.z || 0) + 1.5, 3e5, 'building'); } } } catch (e){ /* */ }
    try { if (window.SGFly && SGFly.on){ SGFly.pause(true); G.caught.air = true; } } catch (e){ /* */ }
    if (!crush){ if (!G.proxy){ G.proxy = carProxy(); scene.add(G.proxy); } G.proxy.visible = !!G.caught.car; }
    toast(crush ? '被踩扁了！ · CRUSHED!' : '被抓住了！ · CAUGHT!', 3);
    KFX.sfx('crunch', T.x, T.y, (T.z || 0) + 1, 1); if (crush) KFX.sfx('debris', T.x, T.y, (T.z || 0) + 1, 1);
    SHK.jol = Math.max(SHK.jol, crush ? 0.95 : 0.75); SHK.rum = Math.max(SHK.rum, 0.5); if (SHK.leg) SHK.leg.a = Math.min(6, SHK.leg.a + 3);
  }
  function caughtStep(dt, O){
    const C = G.caught, tip = O.hold || O.tip[0];
    if (!C.crush && G.proxy && G.proxy.visible){ G.proxy.position.set(tip[0], tip[2] - 1.2, -tip[1]); G.proxy.rotation.set(Math.sin(G.t*2.1)*0.5, G.t*0.8, Math.sin(G.t*1.7)*0.4); }
    if (!G.result && G.t - C.t0 > (C.crush ? 4.5 : 5.5) && G.goal !== 'mp') showResult(C.crush ? 'crushed' : 'caught');   // goal 'mp': the game server owns timers and results
  }
  // ---- v31: thrown by a slam / a sweeping limb / a wing gust (the damage model's impulse at the side it came from; a gust: no damage)
  function throwCar(e){
    try { const F = window.SGF1; if (!F || !F.F1 || !F.F1.on || !F.crash || G.caught) return false; const C = F.CAR, b = F.crash.body ? F.crash.body() : null, m = b && b.m || 1500;
      const vh = Math.hypot(e.vx, e.vy) || 1, nx = e.vx/vh, ny = e.vy/vh, E = e.k > 0 ? (e.src === 'slam' ? 1.7e5 : 0.45e5 + 1.3e5*e.k) : 0;
      if (F.crash.hit) F.crash.hit(e.vx*m, e.vy*m, e.vz*m, C.x - nx*1.2, C.y - ny*1.2, (C.z || 0) + 0.9, E, e.k > 0 ? 'building' : 'debris');
      else if (F.crash.impulse) F.crash.impulse(C.x - nx*3, C.y - ny*3, (C.z || 0) + 0.8, 6, vh + 4);
      else { C.r = (C.r || 0) + (Math.random() < 0.5 ? -1 : 1)*(0.8 + 0.08*vh); C.u = (C.u || 0)*0.6; }
      G.throwN++; if (e.k > 0){ KFX.sfx('crunch', C.x, C.y, (C.z || 0) + 1, 0.8 + 0.2*e.k); SHK.jol = Math.max(SHK.jol, 0.45 + 0.4*e.k); }
      if (e.src === 'slam') toast('被砸飞了！ · SMASHED!', 1.6); else if (e.src === 'gust') toast('狂风！ · WING GUST!', 1.4);
      return true; } catch (er){ console.warn('[kaiju] throw', er); return false; }
  }
  function nearMiss(e){ G.nearN++; toast(e.w === 'foot' ? '惊险！脚落在身旁 · NEAR MISS!' : e.w === 'pass' ? '惊险！擦身而过 · NEAR MISS!' : '惊险！ · NEAR MISS!', 1.5); }
  // the creature's push on the car without contact is gone: wrap the destruction module's blasts / traffic tosses so that they do not
  // reach the player's car (SGF1.crash.impulse muted for the call; the car is touched only by the creature's real contacts, above, and
  // by the debris of what falls - 40_world's collapse landings)
  const NOP = () => 0;
  function noCar(fn){ const F = window.SGF1, C = F && F.crash; let sv = null;
    try { if (C && typeof C.impulse === 'function'){ sv = C.impulse; C.impulse = NOP; } return fn(); } finally { if (sv) C.impulse = sv; } }
  // ---- v31: a mirror's own contacts for the local car (throws, near misses: the host decides catches and crushes)
  const TCM = {tc:null, out:{events:[]}, env:null, T:[]};
  function mirrorTouch(P, dt){
    if (!G.SP.parts){ TCM.tc = null; return; }
    if (!TCM.tc || TCM.sp !== G.sp){ TCM.sp = G.sp; TCM.env = Object.assign({}, ENV, {targets:() => { const L = localTarget(); L.nocatch = true; TCM.T[0] = L; return TCM.T; }});
      TCM.tc = KB.Touch({S:P, env:TCM.env, out:TCM.out, def:G.SP, O:G.O, di:G.diff, catchT(){}, crushT(){}}); }
    TCM.out.events.length = 0; if (P.phase === 'hunt') TCM.tc.step(dt, null); else TCM.tc.B.n = 0;
    for (const e of TCM.out.events){ if (e.e === 'throw') throwCar(e); else if (e.e === 'near') nearMiss(e); }
  }
  // ---- v31: the creature is solid for the player's car: window.SGF1.obstacles(fn) (drivecam) gets its feet, legs, tail, low body and
  // the arms on the streets as oriented boxes with a bottom height (the car passes under the belly and between the legs); m Infinity
  const OBX = {reg:false, out:[], pool:[], ids:new Map(), hits:0};
  function obsParts(){ if (!G.on || !G.P) return null; const B = G.remote ? TCM.tc && TCM.tc.B : G.sim && G.sim.touch && G.sim.touch.B; return B && B.ok && B.n ? B : null; }
  function obsFn(x, y, r){
    const B = obsParts(), out = OBX.out; out.length = 0; if (!B) return out;
    // (the drive module steps before this module's frame: the boxes are a frame old - moved on by their velocity)
    const age = Math.max(0, Math.min(0.1, (performance.now() - (G.partsWall || performance.now()))/1000)), gz = KW.ground(x, y), R = r || 40;
    for (let i = 0; i < B.n && out.length < 12; i++){ const o = B.L[i]; if (!KB.SOLID(o.k) || o.z0 > gz + 3.5) continue; const ex = o.hx + o.hy;
      const ox = o.x + o.vx*age, oy = o.y + o.vy*age; if (Math.abs(ox - x) > R + ex || Math.abs(oy - y) > R + ex) continue;
      let q = OBX.pool[out.length]; if (!q) q = OBX.pool[out.length] = {id:'', x:0, y:0, hx:1, hy:1, hdg:0, z0:0, z:0, h:1, m:Infinity, vx:0, vy:0, kind:'kaiju'};
      let id = OBX.ids.get(o.id); if (!id){ id = 'kj:' + o.id; OBX.ids.set(o.id, id); }
      const z0 = Math.max(o.z0, gz - 0.3); q.id = id; q.x = ox; q.y = oy; q.hx = o.hx; q.hy = o.hy; q.hdg = o.a; q.z0 = z0; q.z = z0; q.h = Math.max(0.5, o.z1 - z0); q.m = Infinity; q.vx = o.vx; q.vy = o.vy;
      out.push(q); }
    return out;
  }
  obsFn.onHit = (id, h) => { OBX.hits++; G.obHits = (G.obHits || 0) + 1; try { const C = SGF1.CAR, sp = h && h.speed || 0; if (sp > 3 && G.clock - (OBX.sndT || -9) > 0.6){ OBX.sndT = G.clock; KFX.sfx('crunch', C.x, C.y, (C.z || 0) + 1, Math.min(1, 0.35 + sp/25)); SHK.jol = Math.max(SHK.jol, Math.min(0.6, 0.15 + sp/40)); } } catch (e){ /* */ } };
  function obsReg(){ if (OBX.reg) return; try { const F = window.SGF1; if (F && typeof F.obstacles === 'function'){ F.obstacles(obsFn); OBX.reg = true; } } catch (e){ /* optional */ } }
  function caughtEnd(){
    if (!G.caught) return;
    try { if (G.caught.car && window.SGF1){ SGF1.hold(null); SGF1.meshes(true); } } catch (e){ /* */ }
    try { if (G.caught.air && window.SGFly) SGFly.pause(false); } catch (e){ /* */ }
    if (G.proxy) G.proxy.visible = false; G.caught = null;
  }
  function carProxy(){
    const g = new THREE.Group(), body = new THREE.MeshLambertMaterial({color:0x8a1c1c}), glass = new THREE.MeshLambertMaterial({color:0x1a2228}), tyre = new THREE.MeshLambertMaterial({color:0x111111});
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.75, 4.7), body); b.position.y = 0.65; g.add(b);
    const c = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.6, 2.4), glass); c.position.set(0, 1.3, -0.2); g.add(c);
    const wg = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 10); wg.rotateZ(PI/2);
    for (const [x, z] of [[0.9, 1.5], [-0.9, 1.5], [0.9, -1.5], [-0.9, -1.5]]){ const w = new THREE.Mesh(wg, tyre); w.position.set(x, 0.36, z); g.add(w); }
    g.visible = false; g.name = 'kaiju_carproxy'; return g;
  }
  // ================= v33 (lm30/kaiju5): the escape mission through checkpoints; the creature cuts you off; text off; quit =================
  // The escape goal (逃离任务 Escape route; solo, driving or flying) is a route: 4 / 5 / 6 checkpoints by difficulty on real streets
  // (trunk / primary / secondary / tertiary / local roads on the ground: not on viaducts, not across water), zig-zagging ~0.7-1.1 km
  // apart from the start towards the exit (a named exit 3.5-8 km away over land, else an evacuation point ~4.8 km away inland, away
  // from where the creature rose), then the exit. Each: a tall beam of light (amber = the next one, cyan = later, green = the exit;
  // unfogged, day and night), a ring standing across the road, a ring on the road and its number above; passed by driving through it
  // (the car's path between two frames within 15 m of its centre, at road level; an aircraft within 45 m and below 250 m); only the
  // next one counts (driving through a later one: 先过第 N 个 · checkpoint N first). The next one is the navigation destination
  // (window.SGNav.setDest, guarded); the remaining ones, the exit, the creature and its block point are markers on the minimap and the
  // big map (SGNav.markers('kaiju', fn)); the HUD always shows the arrow, the distance and the count. The route the player will drive
  // (SGNav.route() when it routes to the next checkpoint, then straight on through the rest to the exit) is the creature's env.route()
  // (KI in 18_block.js cuts the player off on it); the difficulty ramps with every checkpoint passed. Reaching the exit wins; at 10:00
  // the run ends as survived-but-not-out. Multiplayer games (remote creature, goal 'mp', setTargets) have no checkpoints.
  const CPN = [4, 5, 6], CPR = 15, CP_COL = {next:0xffc83a, later:0x59d8ff, exit:0x5dff8a};
  const CP = {on:false, list:[], idx:0, R:null, Rt:0, pv:0, lx:0, ly:0, has:false, navSet:-1, skipT:-9, group:null, geo:null, uT:{value:0}, shadow:null, RI:null, mk:[], planMs:0, cpsBuf:[]};
  // drivable road lines in a 500 m grid (once per map): trunk 2, primary 4, secondary 6, tertiary 8, local 10; not foreign. Built in
  // slices of a few ms per frame while the creature tab is open, a game runs or the player drives (the frame hook), finished at
  // once when a mission needs it before that (NYC / the Bay: ~0.5 M vertices)
  function roadIdxJob(budget){
    const Ls = typeof SGR !== 'undefined' && SGR.lines; if (!Ls || !Ls.length) return null;
    if (CP.RI && CP.RI.L === Ls) return CP.RI;
    let J = CP.RJ; if (!J || J.L !== Ls) J = CP.RJ = {L:Ls, i:0, cells:new Map(), C:500, H:HALF, ms:0, n:0};
    const t0 = performance.now(), C = J.C, H = J.H, cells = J.cells, N = Ls.length;
    while (J.i < N){
      const li = J.i++, l = Ls[li], c = l.c;
      if ((c === 2 || c === 4 || c === 6 || c === 8 || c === 10) && !(l.flags & 8)){ const P = l.P; let last = -1;
        for (let k = 0; k < P.length; k += 2){ const key = Math.floor((P[k + 1] + H)/C)*1000 + Math.floor((P[k] + H)/C); if (key === last) continue; last = key; let a = cells.get(key); if (!a) cells.set(key, a = []); if (a[a.length - 1] !== li){ a.push(li); J.n++; } } }
      if ((J.i & 511) === 0 && performance.now() - t0 > budget) break;
    }
    J.ms += performance.now() - t0;
    if (J.i >= N){ CP.RI = {L:Ls, C, cells, ms:+J.ms.toFixed(1), refs:J.n}; CP.RJ = null; return CP.RI; }
    return null;
  }
  function roadIdx(){ return roadIdxJob(1e9); }
  const CLS_PEN = {2:40, 4:0, 6:0, 8:10, 10:45};
  // the best road vertex near (x, y) within rMax (distance + a class penalty), on the ground, on land: {x, y, ux, uy (the road's direction), li, c, name}
  function roadSnap(x, y, rMax){
    const I = roadIdx(); if (!I) return null; const C = I.C, ci = Math.floor((x + HALF)/C), cj = Math.floor((y + HALF)/C), rc = Math.ceil(rMax/C);
    let best = null, bs = 1e18; const seen = new Set();
    for (let j = cj - rc; j <= cj + rc; j++) for (let i = ci - rc; i <= ci + rc; i++){ const a = I.cells.get(j*1000 + i); if (!a) continue;
      for (const li of a){ if (seen.has(li)) continue; seen.add(li); const l = I.L[li], P = l.P, E = l.E, pen = CLS_PEN[l.c] || 0;
        for (let k = 0; k < P.length; k += 2){ const d = Math.hypot(P[k] - x, P[k + 1] - y); if (d > rMax || d + pen >= bs) continue; if (E && E[k >> 1] > 0.6) continue;   // (on the ground: not on a viaduct or a ramp)
          if (KW.isWater(P[k], P[k + 1])) continue;
          const k2 = k + 2 < P.length ? k + 2 : k - 2; let ux = P[k2] - P[k], uy = P[k2 + 1] - P[k + 1]; if (k2 < k){ ux = -ux; uy = -uy; } const ul = Math.hypot(ux, uy) || 1;
          bs = d + pen; best = {x:P[k], y:P[k + 1], ux:ux/ul, uy:uy/ul, li, c:l.c, ow:l.flags & 1, name:l.name || null}; } } }
    return best;
  }
  function wetFrac(ax, ay, bx, by){ const d = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.ceil(d/120)); let w = 0; for (let i = 0; i <= n; i++){ const t = i/n; if (KW.isWater(ax + (bx - ax)*t, ay + (by - ay)*t)) w++; } return w/(n + 1); }
  // the route: [{x, y, ux, uy, n, exit, zh, en, road}] - n checkpoints, then the exit; null when the map has no roads for it
  function cpPlan(T, spawn, n, seed){
    const t0 = performance.now(), rng = KC.m.mulb(((seed | 0) ^ 0x5bd1e995) + 77), city = KW.cityKey(), inMap = (x, y) => Math.abs(x) < HALF - 600 && Math.abs(y) < HALF - 600;
    if (!roadIdx()) return null;
    // (the way out runs across the creature's front rather than straight away from it - slightly away: it can cut the route off
    // ahead of the player instead of only chasing from behind)
    let X = null; const ax = T.x - (spawn ? spawn.x : T.x), ay = T.y - (spawn ? spawn.y : T.y - 1), al = Math.hypot(ax, ay) || 1, side = (px, py) => Math.abs(((px - T.x)*ax + (py - T.y)*ay)/(al*(Math.hypot(px - T.x, py - T.y) || 1)) - 0.25)*900;
    for (const e of EXITS[city] || []){ const q = sgXY(e.ll[0], e.ll[1]), d = Math.hypot(q[0] - T.x, q[1] - T.y); if (d < 3500 || d > 8000) continue;
      const r = roadSnap(q[0], q[1], 700); if (!r || wetFrac(T.x, T.y, r.x, r.y) > 0.2) continue; const sc = Math.abs(d - 5000)*0.25 + side(r.x, r.y) - 250; if (!X || sc < X.sc) X = Object.assign({}, r, {sc, named:true, zh:e.zh, en:e.en}); }
    for (let k = 0; k < 24; k++) for (const D of [4800, 4200, 5500, 3700]){ const a = k*PI/12 + rng()*0.1, px = T.x + Math.sin(a)*D, py = T.y + Math.cos(a)*D; if (!inMap(px, py) || KW.isWater(px, py)) continue;
      const pre = Math.abs(D - 4800)*0.25 + side(px, py); if (X && pre >= X.sc) continue;
      const wf = wetFrac(T.x, T.y, px, py); if (wf > 0.15) continue; const sc = pre + wf*3000 + rng()*120; if (X && sc >= X.sc) continue;
      const r = roadSnap(px, py, 450); if (!r) continue; X = Object.assign({}, r, {sc, named:false, zh:'撤离点', en:'Evac point'}); }
    if (!X) return null;
    const L = [], dx = X.x - T.x, dy = X.y - T.y, D = Math.hypot(dx, dy) || 1, ux = dx/D, uy = dy/D, s0 = rng() < 0.5 ? 1 : -1;
    let px = T.x, py = T.y;
    for (let i = 1; i <= n; i++){
      const f = i/(n + 1), bx = T.x + dx*f, by = T.y + dy*f, side = (i % 2 ? 1 : -1)*s0, off = Math.min(0.12*D, 230 + 150*rng()); let got = null;
      for (const m of [1, 0.55, 0, -0.5]){ const qx = bx - uy*off*side*m, qy = by + ux*off*side*m; if (!inMap(qx, qy)) continue; const r = roadSnap(qx, qy, 380); if (!r) continue;
        if (Math.hypot(r.x - px, r.y - py) < (L.length ? 420 : 330) || Math.hypot(r.x - X.x, r.y - X.y) < 400) continue; if (wetFrac(px, py, r.x, r.y) > 0.3) continue; got = r; break; }
      if (got){ L.push(got); px = got.x; py = got.y; }
    }
    if (L.length < 3) return null;
    // (the road's width by class, two-way / one-way: the ring spans it and the pass radius covers its outer lanes)
    const RW = {2:[20, 11], 4:[15, 10], 6:[12, 8], 8:[9.5, 7], 10:[7, 5.5]}, wOf = r => (RW[r.c] || RW[10])[r.ow ? 1 : 0];
    const out = L.map((r, i) => ({x:r.x, y:r.y, ux:r.ux, uy:r.uy, n:i + 1, exit:false, road:r.name, c:r.c, w:wOf(r), passed:false}));
    out.push({x:X.x, y:X.y, ux:X.ux, uy:X.uy, n:L.length + 1, exit:true, zh:X.zh, en:X.en, named:X.named, road:X.name, c:X.c, w:wOf(X), passed:false});
    CP.planMs = +(performance.now() - t0).toFixed(1);
    return out;
  }
  const groundZ = (x, y) => { try { return typeof hC === 'function' ? hC(x, y) : KW.ground(x, y); } catch (e){ return 0; } };
  // a number (or the exit flag) for the sprite above a checkpoint
  function cpTex(c){
    try { const cv = document.createElement('canvas'); cv.width = cv.height = 96; const o = cv.getContext('2d'); if (!o || !o.fillText) return null;
      o.fillStyle = 'rgba(8,14,10,.78)'; o.beginPath(); o.arc(48, 48, 44, 0, PI*2); o.fill(); o.lineWidth = 6; o.strokeStyle = '#ffffff'; o.stroke(); o.fillStyle = '#ffffff';
      if (c.exit){ o.fillRect(32, 22, 6, 54); o.beginPath(); o.moveTo(38, 22); o.lineTo(72, 32); o.lineTo(38, 44); o.closePath(); o.fill(); }
      else { o.font = '700 56px system-ui, sans-serif'; o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillText(String(c.n), 48, 52); }
      const t = new THREE.CanvasTexture(cv); t.anisotropy = 2; return t; } catch (e){ return null; }
  }
  const BEAM_VS = 'varying float vY; varying float vD; varying vec3 vN; varying vec3 vV; void main(){ vY = position.y / 420.0; vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }';
  const BEAM_FS = 'uniform vec3 uC; uniform float uT; uniform float uA; varying float vY; varying float vD; varying vec3 vN; varying vec3 vV; void main(){ float f = abs(dot(normalize(vN), normalize(vV))); float core = pow(f, 1.4); float p = fract(vY * 5.0 - uT * 0.6); float a = uA * pow(1.0 - vY, 1.2) * (0.3 + 0.7 * core) * (0.72 + 0.28 * smoothstep(0.82, 1.0, p)) * smoothstep(30.0, 160.0, vD); gl_FragColor = vec4(uC * (0.75 + 0.5 * core), a); }';
  const SHADOW_FS = 'uniform float uT; uniform float uA; varying vec2 vP; void main(){ float r = length(vP); float rim = smoothstep(0.76, 0.92, r) * (1.0 - smoothstep(0.92, 1.0, r)); float pul = 0.55 + 0.45 * sin(uT * 5.0 - r * 7.0); float sh = (1.0 - smoothstep(0.15, 0.95, r)) * 0.5; vec3 c = mix(vec3(0.03, 0.0, 0.0), vec3(1.0, 0.16, 0.06), clamp(rim * pul * 1.4, 0.0, 1.0)); gl_FragColor = vec4(c, uA * max(sh, rim * pul)); }';
  function cpBuild(){
    cpDispose(); if (typeof THREE === 'undefined' || typeof scene === 'undefined') return;
    const g = new THREE.Group(); g.name = 'kaiju_checkpoints'; CP.group = g; scene.add(g);
    const beamG = new THREE.CylinderGeometry(8, 13, 420, 16, 1, true); beamG.translate(0, 210, 0);   // (thick and tall: seen over the towers km away)
    const torG = new THREE.TorusGeometry(9, 0.75, 8, 40), gndG = new THREE.RingGeometry(11.5, 14.2, 44); gndG.rotateX(-PI/2);
    const shG = new THREE.CircleGeometry(1, 48); shG.rotateX(-PI/2);
    CP.geo = [beamG, torG, gndG, shG];
    for (const c of CP.list){
      const col = new THREE.Color(c.exit ? CP_COL.exit : CP_COL.later), o = new THREE.Group(), gz = groundZ(c.x, c.y);
      const bm = new THREE.ShaderMaterial({uniforms:{uC:{value:col.clone()}, uT:CP.uT, uA:{value:0.45}}, transparent:true, depthWrite:false, side:THREE.DoubleSide, vertexShader:BEAM_VS, fragmentShader:BEAM_FS});
      const beam = new THREE.Mesh(beamG, bm); beam.frustumCulled = false; beam.renderOrder = 7;
      const rm = new THREE.MeshBasicMaterial({color:col.clone(), transparent:true, opacity:0.92, fog:false, depthWrite:false}), ring = new THREE.Mesh(torG, rm);
      const gm = new THREE.MeshBasicMaterial({color:col.clone(), transparent:true, opacity:0.6, fog:false, depthWrite:false, side:THREE.DoubleSide, polygonOffset:true, polygonOffsetFactor:-4}), gnd = new THREE.Mesh(gndG, gm);
      const rs = Math.max(1, ((c.w || 8)/2 + 2)/9); ring.scale.setScalar(rs); gnd.scale.set(rs, 1, rs); c.rs = rs;
      ring.position.y = 8.4*rs; ring.rotation.y = Math.atan2(c.ux, -c.uy); gnd.position.y = 0.35;
      o.add(beam, ring, gnd);
      const tex = cpTex(c); let spr = null; if (tex){ spr = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, color:0xffffff, transparent:true, depthWrite:false, fog:false})); spr.scale.set(10, 10, 1); spr.position.y = 24; spr.renderOrder = 8; o.add(spr); }
      o.position.set(c.x, gz, -c.y); o.name = 'kaiju_cp' + c.n; g.add(o);
      Object.assign(c, {o, gz, beam, ring, gnd, spr, bm, rm, gm});
    }
    const sm = new THREE.ShaderMaterial({uniforms:{uT:CP.uT, uA:{value:0}}, transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-6, vertexShader:'varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader:SHADOW_FS});
    CP.shadow = new THREE.Mesh(shG, sm); CP.shadow.visible = false; CP.shadow.renderOrder = 6; CP.shadow.scale.set(85, 1, 85); CP.shadow.frustumCulled = false; CP.shadow.name = 'kaiju_block'; g.add(CP.shadow);
    cpStyle();
  }
  function cpDispose(){
    if (!CP.group) return; try { scene.remove(CP.group); } catch (e){ /* */ }
    CP.group.traverse(o => { if (o.material){ if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    if (CP.geo) for (const gg of CP.geo) gg.dispose(); CP.geo = null; CP.group = null; CP.shadow = null;
  }
  // the colours: amber for the next one (brighter, pulsing), cyan for later ones, green for the exit; passed ones go
  function cpStyle(){
    for (let i = 0; i < CP.list.length; i++){ const c = CP.list[i]; if (!c.o) continue; c.o.visible = !c.passed;
      const next = i === CP.idx, hex = c.exit ? CP_COL.exit : next ? CP_COL.next : CP_COL.later;
      c.bm.uniforms.uC.value.setHex(hex); c.bm.uniforms.uA.value = next ? 0.7 : c.exit ? 0.55 : 0.3; c.rm.color.setHex(hex); c.rm.opacity = next || c.exit ? 0.95 : 0.45; c.gm.color.setHex(hex); c.gm.opacity = next ? 0.45 : 0.22;
      if (c.spr) c.spr.material.color.setHex(next || c.exit ? 0xffffff : 0x9fd9ee); }
  }
  function cpFrame(){
    if (!CP.group) return; CP.uT.value = G.clock;
    const c = CP.list[CP.idx]; if (c && c.ring){ const s = (c.rs || 1)*(1 + 0.06*Math.sin(G.clock*4)); c.ring.scale.set(s, s, s); }
    const S = G.on && !G.remote && G.sim ? G.sim.S : null, sh = CP.shadow;
    if (sh){ const on = !!(S && S.bm && S.phase === 'hunt' && !G.result); sh.visible = on; if (on){ sh.position.set(S.bx, groundZ(S.bx, S.by) + 0.6, -S.by); sh.material.uniforms.uA.value = S.bm === 1 ? 0.65 : 0.9; } }
  }
  // the route the player will drive, for the creature (env.route): from the car through the navigation route (when it leads to the
  // next checkpoint) or straight to it, then on through the rest to the exit; rebuilt every 0.3 s
  function routeNow(){ return CP.on && !G.remote && CP.R && CP.R.n > 1 ? CP.R : null; }
  function routeUpdate(L, dt){
    CP.Rt -= dt; if (CP.Rt > 0 && CP.R) return; CP.Rt = 0.3;
    const R = CP.R || (CP.R = {x:new Float64Array(640), y:new Float64Array(640), s:new Float64Array(640), junc:new Uint8Array(640), n:0, cps:[], ramp:0, v:0, nav:false});
    R.n = 0; R.cps.length = 0; R.nav = false;
    const push = (x, y, j) => { const n = R.n; if (n >= R.x.length) return; if (n){ const d = Math.hypot(x - R.x[n - 1], y - R.y[n - 1]); if (d < 1) return; R.s[n] = R.s[n - 1] + d; } else R.s[0] = 0; R.x[n] = x; R.y[n] = y; R.junc[n] = j ? 1 : 0; R.n = n + 1; };
    push(L.x, L.y, 0);
    const c0 = CP.list[CP.idx]; if (!c0) return;
    let nav = null; try { if (window.SGNav && typeof SGNav.route === 'function' && CP.navSet === CP.idx) nav = SGNav.route(); } catch (e){ nav = null; }
    const P = nav && Array.isArray(nav.pts) ? nav.pts : null;
    if (P && P.length > 1){ const e = P[P.length - 1]; if (e && Math.hypot(e[0] - c0.x, e[1] - c0.y) < 90){
      // (the first navigation point near the car: from there on; long routes thinned to <= 400 points, turns kept)
      let i0 = 0, bd = 1e18; for (let i = 0; i < Math.min(P.length, 60); i++){ const d = Math.hypot(P[i][0] - L.x, P[i][1] - L.y); if (d < bd){ bd = d; i0 = i; } }
      const st = Math.max(1, Math.ceil((P.length - i0)/400));
      for (let i = i0 + 1; i < P.length - 1; i++){ const a = P[i - 1], b = P[i], q = P[i + 1]; const t1 = Math.atan2(b[1] - a[1], b[0] - a[0]), t2 = Math.atan2(q[1] - b[1], q[0] - b[0]), turn = Math.abs(wrapA(t2 - t1)) > 0.45;
        if (turn || (i - i0) % st === 0) push(b[0], b[1], turn); }
      R.nav = true; } }
    for (let i = CP.idx; i < CP.list.length; i++){ const c = CP.list[i]; push(c.x, c.y, 1); let q = CP.cpsBuf[i]; if (!q) q = CP.cpsBuf[i] = {x:0, y:0, s:0}; q.x = c.x; q.y = c.y; q.s = R.s[R.n - 1]; R.cps.push(q); }
    R.ramp = Math.min(1, CP.idx/Math.max(1, CP.list.length - 1)); R.v = CP.pv;
  }
  const wrapA = KC.m.wrapA;
  function segDist(ax, ay, bx, by, px, py){ const dx = bx - ax, dy = by - ay, L2 = dx*dx + dy*dy; let t = L2 > 1e-6 ? ((px - ax)*dx + (py - ay)*dy)/L2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; return Math.hypot(ax + dx*t - px, ay + dy*t - py); }
  // per frame: the player's speed, passing the next checkpoint (or a later one first), reaching the exit
  function cpStep(L, dt){
    if (!CP.on) return; const px = CP.lx, py = CP.ly; CP.lx = L.x; CP.ly = L.y; if (!CP.has){ CP.has = true; return; }
    const dd = Math.hypot(L.x - px, L.y - py); if (dt > 0 && dd < 300) CP.pv += (dd/dt - CP.pv)*Math.min(1, dt*1.5);
    if (G.result || G.caught || L.kind === 'cam' || dd > 300) return;
    const c = CP.list[CP.idx]; if (!c) return; const air = L.kind === 'air', gz = c.gz === undefined ? groundZ(c.x, c.y) : c.gz;
    const passR = air ? 45 : Math.max(CPR, (c.w || 8)/2 + 9)*(c.exit ? 2 : 1), zOk = q => air ? (L.z || 0) - (q.gz === undefined ? gz : q.gz) < 250 : Math.abs((L.z === undefined ? gz : L.z) - (q.gz === undefined ? gz : q.gz)) < 10;
    if (segDist(px, py, L.x, L.y, c.x, c.y) < passR && zOk(c)){ cpPass(c); return; }
    for (let j = CP.idx + 1; j < CP.list.length; j++){ const q = CP.list[j]; if (q.exit) continue; if (segDist(px, py, L.x, L.y, q.x, q.y) < passR && zOk(q) && G.t - CP.skipT > 5){ CP.skipT = G.t; G.cpSkips = (G.cpSkips || 0) + 1; toast(`先通过第 ${c.n} 个检查点 · Checkpoint ${c.n} first`, 2.5); chime(0); } }
  }
  function cpPass(c){
    c.passed = true; c.t = +G.t.toFixed(1); CP.idx++; const n = CP.list.length - 1;
    G.events.push({t:+G.t.toFixed(2), e:'checkpoint', n:c.n, exit:!!c.exit}); if (G.events.length > 60) G.events.shift();
    if (c.exit){ chime(2); win('extract'); return; }
    chime(1); cpStyle(); cpNav(); CP.Rt = 0;
    toast(CP.idx >= n ? '检查点全部通过！冲向撤离点 · All checkpoints! Now the exit' : `检查点 ${c.n}/${n} ✓ · Checkpoint ${c.n}/${n}`, 2.6);
  }
  // window.SGNav (lm30/nav; guarded): the next checkpoint as the destination; markers for the checkpoints, the exit, the creature, its block
  function nav(){ const N = window.SGNav; return N && typeof N === 'object' ? N : null; }
  function cpNav(){ const N = nav(), c = CP.list[CP.idx]; if (!N || !c || typeof N.setDest !== 'function') return;
    try { N.setDest(c.x, c.y, {label:c.exit ? ['撤离 ' + c.zh, 'Exit · ' + c.en] : ['检查点 ' + c.n, 'Checkpoint ' + c.n], color:c.exit ? '#5dff8a' : '#ffc83a', kind:'checkpoint', r:c.exit ? 2*CPR : CPR, beacon:false, quiet:true}); CP.navSet = CP.idx; } catch (e){ console.warn('[kaiju] nav', e); } }
  function mk(i){ let m = CP.mk[i]; if (!m) m = CP.mk[i] = {x:0, y:0, icon:'', color:'', label:'', r:0, pulse:false}; return m; }
  const MKL = [];
  function markers(){
    MKL.length = 0; if (!G.on) return MKL; let i = 0;
    const P = G.P; if (P && (P.r || 0) > 0.3){ const m = mk(i++); m.x = P.x; m.y = P.y; m.icon = 'creature'; m.color = '#ff4a3a'; m.label = spOf(G.sp).zh; m.r = 40; m.pulse = true; MKL.push(m); }
    if (CP.on) for (let j = CP.idx; j < CP.list.length; j++){ const c = CP.list[j], m = mk(i++); m.x = c.x; m.y = c.y; m.icon = c.exit ? 'flag' : 'checkpoint'; m.color = c.exit ? '#5dff8a' : j === CP.idx ? '#ffc83a' : '#59d8ff'; m.label = c.exit ? '撤离 EXIT' : String(c.n); m.r = c.exit ? 2*CPR : CPR; m.pulse = j === CP.idx; MKL.push(m); }
    const S = !G.remote && G.sim ? G.sim.S : null; if (S && S.bm && S.phase === 'hunt'){ const m = mk(i++); m.x = S.bx; m.y = S.by; m.icon = '!'; m.color = '#ff3b30'; m.label = '拦截 Block'; m.r = 85; m.pulse = true; MKL.push(m); }
    return MKL;
  }
  function navOn(on){ const N = nav(); if (!N) return; try { if (typeof N.markers === 'function') N.markers('kaiju', on ? markers : null); if (!on && CP.navSet >= 0 && typeof N.clearDest === 'function') N.clearDest(); } catch (e){ console.warn('[kaiju] nav markers', e); } if (!on) CP.navSet = -1; }
  function cpStart(T){
    CP.on = false; CP.list = []; CP.idx = 0; CP.R = null; CP.Rt = 0; CP.pv = 0; CP.has = false; CP.skipT = -9; CP.navSet = -1; G.cpSkips = 0;
    if (G.goal !== 'extract' || G.remote || G.targets || !T || T.kind === 'cam') return false;
    let L = null; try { L = cpPlan(T, G.spawn, CPN[G.diff] || 5, G.seed); } catch (e){ console.warn('[kaiju] checkpoints', e); L = null; }
    if (!L) return false;
    CP.list = L; CP.on = true; const X = L[L.length - 1];
    G.exit = {x:X.x, y:X.y, zh:X.zh, en:X.en, d0:Math.hypot(X.x - T.x, X.y - T.y), cp:true};
    cpBuild(); cpNav(); return true;
  }
  function cpEnd(){ CP.on = false; navOn(false); cpDispose(); }
  // a short chime on the sound module's context ('fx' bus; nothing when sound is off): 1 passed, 2 the exit, 0 a wrong one
  function chime(kind){
    try { const A = window.SGAudio, E = A && A._test && A._test.LIVE; if (!A || !A.on || !E || !E.ctx || E.ctx.state !== 'running') return; const c = E.ctx, t0 = c.currentTime, dst = (E.bus && (E.bus.fx || E.bus.f1)) || E.out;
      const g = c.createGain(); g.gain.value = 0.0001; g.connect(dst);
      const notes = kind === 2 ? [784, 988, 1175, 1568] : kind === 1 ? [880, 1320] : [330, 262];
      notes.forEach((f, i) => { const o = c.createOscillator(), og = c.createGain(), t = t0 + i*0.09; o.type = kind ? 'sine' : 'triangle'; o.frequency.value = f; og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(kind ? 0.22 : 0.16, t + 0.015); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.45); o.connect(og); og.connect(dst); o.start(t); o.stop(t + 0.5); });
    } catch (e){ /* optional */ }
  }
  // ---- text off (T, the HUD's Aa button, the tab's 文字 Text row; persisted): the mode's toasts, warnings, labels, the result's
  // texts and the army's lines are hidden; the timer, the distances, the arrows and the checkpoint count stay as icons and numbers
  function textOn(){ if (!TR.loaded) loadTR(); return TR.txt !== false; }
  function textSet(on){ if (!TR.loaded) loadTR(); TR.txt = on === undefined ? !textOn() : !!on; saveTR(); textSync(); paneSync(); return TR.txt; }
  function textSync(){ try { if (typeof document !== 'undefined' && document.body && document.body.classList){ document.body.classList.toggle('kj-notext', !textOn()); }
    if (UI.q && UI.q.txt){ UI.q.txt.setAttribute('aria-pressed', String(!textOn())); } if (!textOn() && UI.toast) UI.toast.style.opacity = '0'; } catch (e){ /* */ } }
  // ---- quit (the HUD's 退出 Quit button, Esc with a confirm while a game runs): stop the game (the army, the effects and the sounds
  // stop with it), restore the city, leave the vehicle the game put the player in, back to the normal view
  function quitAsk(){
    if (!G.on) return false;
    if (G.result || G.caught || G.remote || G.goal === 'mp'){ quit(); return true; }
    uiInit(); if (!UI.ask) return false; if (!UI.ask.hidden){ askHide(); return true; }
    // (the game pauses while it asks: the creature and the clock stop, the car is held on the brakes)
    UI.ask.hidden = false; UI.askT = performance.now(); G.paused = true; try { if (window.SGF1 && SGF1.F1 && SGF1.F1.on){ SGF1.hold({thr:0, brk:1, steer:0, hb:0}); G.askHold = true; } } catch (e){ /* */ }
    const b = UI.ask.querySelector('[data-k="quit"]'); try { if (b) b.focus(); } catch (e){ /* */ } return true;
  }
  function askHide(){ if (UI.ask) UI.ask.hidden = true; G.paused = false; if (G.askHold){ G.askHold = false; try { if (!G.caught && window.SGF1) SGF1.hold(null); } catch (e){ /* */ } } }
  function quit(){
    askHide(); const put = G.put; G.put = null; const was = G.on;
    stop(); CP.list = []; CP.idx = 0; G.tint = 0; vignette(0); let n = 0; try { n = KW.restore(); } catch (e){ console.warn('[kaiju] restore', e); }   // (the green sky goes at once)
    try { const A = window.SGArmy; if (A && A.on && typeof A.stop === 'function') A.stop(); } catch (e){ /* */ }
    try { if (put === 'car' && window.SGF1 && SGF1.F1 && SGF1.F1.on){ SGF1.hold(null); SGF1.exit(); } } catch (e){ /* */ }
    try { if (put === 'fly' && window.SGFly && SGFly.on) SGFly.exit(); } catch (e){ /* */ }
    if (was && textOn()) try { showToast('已退出克苏鲁模式，城市已恢复 · Creature mode off, the city is restored'); } catch (e){ /* */ }
    return {quit:was, restored:n};
  }
  // the keys while a local game runs: Esc (quit, with the confirm), T (text). Driving: through the drive module's key hook
  // (SGF1.mp.key, chained with the multiplayer module's); otherwise a capture listener (the camera's T tilt yields while a game runs)
  function kjKey(c, e){
    if (UI.ask && !UI.ask.hidden){ if (c === 'Escape'){ askHide(); return true; } if (c === 'Enter'){ quit(); return true; } }
    if (!G.on || G.remote || G.goal === 'mp') return false;
    // (the big map open: Esc closes it first)
    if (c === 'Escape'){ try { const N = nav(); if (N && N.isOpen && typeof N.close === 'function'){ N.close(); return true; } } catch (er){ /* */ } quitAsk(); return true; }
    if (c === 'KeyT' && !(e && (e.repeat || e.altKey || e.shiftKey))){ textSet(); return true; }
    return false;
  }
  function keyHook(){
    try { const F = window.SGF1; if (!F || !F.mp || typeof F.mp.key !== 'function' || F.mp.__kj) return !!(F && F.mp && F.mp.__kj);
      const set0 = F.mp.key.bind(F.mp); let other = null; const fn = (c, e) => { try { if (kjKey(c, e)) return true; } catch (er){ console.warn('[kaiju] key', er); } return other ? !!other(c, e) : false; };
      F.mp.key = f => { other = typeof f === 'function' ? f : null; set0(fn); }; F.mp.__kj = true; set0(fn); return true; } catch (e){ return false; }
  }
  keyHook();
  function keyListen(){
    if (UI.keys || typeof addEventListener !== 'function') return; UI.keys = true;
    addEventListener('keydown', e => { const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return; if (e.ctrlKey || e.metaKey) return;
      if (kjKey(e.code, e)){ e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  }

  function win(kind){ if (G.result) return; if (G.sim) G.sim.win(); showResult(kind); }
  // ---- sky / camera: tint and shake applied just before the render, undone right after it (no other module sees them)
  const SAV = {bg:new THREE.Color(), fog:new THREE.Color(), sun:new THREE.Color(), hs:new THREE.Color(), hg:new THREE.Color(), si:1, hi:1, fn:0, ff:0, cam:new THREE.Vector3(), q:new THREE.Quaternion(), on:false, shook:false, last:0};
  const GREEN = new THREE.Color(0.28, 0.36, 0.25), GREEN_N = new THREE.Color(0.05, 0.08, 0.055), SUNG = new THREE.Color(0.75, 0.9, 0.62);
  function tintStep(dt){ G.tint += Math.max(-dt/6, Math.min(dt/8, G.tintGoal - G.tint)); }
  function prerender(){
    SAV.on = false; SAV.shook = false;
    const nowMs = performance.now(), dtR = SAV.last ? Math.min(0.1, Math.max(0, (nowMs - SAV.last)/1000)) : 1/60; SAV.last = nowMs;
    if (G.tint > 0.001){
      const k = G.tint, n = typeof nightF !== 'undefined' ? nightF : 0;
      SAV.on = true;
      if (scene.background && scene.background.isColor){ SAV.bg.copy(scene.background); scene.background.lerp(_c.copy(GREEN).lerp(GREEN_N, n), 0.55*k).multiplyScalar(1 - 0.25*k); }
      if (scene.fog){ SAV.fog.copy(scene.fog.color); SAV.fn = scene.fog.near; SAV.ff = scene.fog.far; scene.fog.color.lerp(_c.copy(GREEN).lerp(GREEN_N, n), 0.6*k); scene.fog.near *= 1 - 0.75*k; scene.fog.far *= 1 - 0.55*k; }
      if (typeof sun !== 'undefined'){ SAV.sun.copy(sun.color); SAV.si = sun.intensity; sun.color.lerp(SUNG, 0.5*k); sun.intensity *= 1 - 0.35*k; }
      if (typeof hemi !== 'undefined'){ SAV.hs.copy(hemi.color); SAV.hg.copy(hemi.groundColor); SAV.hi = hemi.intensity; hemi.color.lerp(GREEN, 0.4*k); hemi.intensity *= 1 - 0.2*k; }
      vignette(k);
    } else vignette(0);
    // the caught camera: from the car in the tentacle, looking at the face
    if (G.caught && G.on && G.caught.car && G.caught.crush){
      // crushed: a low camera beside the car, slowly circling, looking up at the foot on it
      const C = G.caught, u = Math.min(1, (G.t - C.t0)/4), a = (C.psi || 0) + PI/2 + 0.5*u, d = 24 + 10*u, gz = C.z || 0;
      SAV.camC = true; SAV.cam.copy(camera.position); SAV.q.copy(camera.quaternion);
      camera.position.set(C.x + Math.cos(a)*d, gz + 3 + 4*u, -(C.y + Math.sin(a)*d)); camera.lookAt(C.x, gz + 6 + 10*u, -C.y); camera.updateMatrixWorld(); }
    else if (G.caught && G.on && G.O && G.caught.car){
      // in front of the face (from the posed eyes), a little to the side and below them: the car in the tentacle between us and the face
      const O = G.O, u = Math.min(1, (G.t - G.caught.t0)/3), tip = O.hold || O.tip[0], E0 = O.eye[0], E1 = O.eye[1], em = [(E0[0] + E1[0])/2, (E0[1] + E1[1])/2, (E0[2] + E1[2])/2];
      let fx = em[0] - O.head[0], fy = em[1] - O.head[1]; const fl = Math.hypot(fx, fy) || 1; fx /= fl; fy /= fl;
      const d = (SPX().camD || 175) - 60*u, c = [em[0] + fx*d - fy*28, em[1] + fy*d + fx*28, em[2] - 22];
      SAV.camC = true; SAV.cam.copy(camera.position); SAV.q.copy(camera.quaternion);
      camera.position.set(c[0], c[2], -c[1]); camera.lookAt(em[0]*0.7 + tip[0]*0.3, em[2]*0.7 + tip[2]*0.3 - 8, -(em[1]*0.7 + tip[1]*0.3)); camera.updateMatrixWorld(); }
    else SAV.camC = false;
    // v31: the calm shake - a small turn of the view about its own axes and a few centimetres of offset (undone after the render)
    if (shakeStep(dtR)){ const O = SHK.out, D2R = PI/180; if (!SAV.camC){ SAV.cam.copy(camera.position); SAV.q.copy(camera.quaternion); }
      _se.set(O.pitch*D2R, O.yaw*D2R, O.roll*D2R, 'YXZ'); _sq.setFromEuler(_se); camera.quaternion.multiply(_sq);
      _sv.set(O.x, O.y, 0).applyQuaternion(SAV.q); camera.position.add(_sv); camera.updateMatrixWorld(); SAV.shook = true; }
  }
  const _c = new THREE.Color();
  function postrender(){
    if (SAV.on){ if (scene.background && scene.background.isColor) scene.background.copy(SAV.bg); if (scene.fog){ scene.fog.color.copy(SAV.fog); scene.fog.near = SAV.fn; scene.fog.far = SAV.ff; }
      if (typeof sun !== 'undefined'){ sun.color.copy(SAV.sun); sun.intensity = SAV.si; } if (typeof hemi !== 'undefined'){ hemi.color.copy(SAV.hs); hemi.groundColor.copy(SAV.hg); hemi.intensity = SAV.hi; } SAV.on = false; }
    if (SAV.camC){ camera.position.copy(SAV.cam); camera.quaternion.copy(SAV.q); camera.updateMatrixWorld(); SAV.camC = false; SAV.shook = false; }
    else if (SAV.shook){ camera.position.copy(SAV.cam); camera.quaternion.copy(SAV.q); camera.updateMatrixWorld(); SAV.shook = false; }
  }
  // ---- UI: vignette, toast, HUD, result card, tray card
  const CSS = `
.kjvig{position:fixed;inset:0;pointer-events:none;z-index:30;opacity:0;background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(8,26,10,.55) 100%), linear-gradient(rgba(60,110,40,.16), rgba(60,110,40,.16));mix-blend-mode:multiply;transition:opacity .3s}
.kjhud{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:62;pointer-events:none;font:500 12px/1.35 var(--font-mono, ui-monospace, monospace);color:#e8f2dc;text-align:center;text-shadow:0 1px 2px #000}
.kjhud .kjbox{display:inline-flex;gap:16px;align-items:center;background:rgba(10,22,12,.72);border:1px solid rgba(160,220,120,.35);border-radius:10px;padding:6px 14px;backdrop-filter:blur(3px)}
.kjhud b{font:700 14px var(--font-sans, system-ui, sans-serif);letter-spacing:.06em;color:#b8f08a}
.kjhud .kjv{font-size:15px;font-weight:700;color:#fff}
.kjhud small{display:block;font-size:9px;color:#a9c29a;letter-spacing:.1em}
.kjhud .kjarr{display:inline-block;width:18px;height:18px;transform-origin:50% 50%;color:#ff8a6a}
.kjhud .kjarr.ex{color:#7dff9e}
.kjhud .kjwarn{margin-top:6px;font:700 14px var(--font-sans, system-ui, sans-serif);color:#ffb08a;letter-spacing:.05em;min-height:18px;display:flex;gap:6px;align-items:center;justify-content:center}
.kjhud .kjwarn .kjwa{display:none;width:20px;height:20px;color:#ff4a3a;filter:drop-shadow(0 0 4px rgba(255,60,40,.7))}
.kjhud .kjwarn.on .kjwa{display:inline-block}
.kjhud .kjcpn{font:700 11px var(--font-mono, monospace);color:#ffd68a;margin-left:4px}
.kjhud .kjic{display:inline-block;width:13px;height:13px;vertical-align:-2px;margin-right:3px;opacity:.85;color:#b8f08a}
.kjhud .kjbtns2{display:flex;gap:6px;align-items:center}
.kjhud .kjb{pointer-events:auto;appearance:none;border:1px solid rgba(160,220,120,.45);background:rgba(28,48,30,.9);color:#e8f2dc;border-radius:7px;padding:4px 8px;font:600 12px var(--font-sans, system-ui, sans-serif);cursor:pointer;line-height:1.2;white-space:nowrap}
.kjhud .kjb:hover{background:#2f5a2c}.kjhud .kjb.q{border-color:#d0675a;background:rgba(120,30,24,.9)}.kjhud .kjb.q:hover{background:#9a2c22}
.kjhud .kjb[aria-pressed="true"]{text-decoration:line-through;opacity:.8}
.kjhud .kjb small{display:inline;font-size:10px;letter-spacing:0;color:inherit;opacity:.85}
.kjask{position:fixed;inset:0;z-index:72;display:grid;place-items:center;background:rgba(4,12,6,.45)}
.kjask[hidden]{display:none}
.kjask .kjcard{min-width:280px;max-width:90vw;background:rgba(14,26,16,.96);border:1px solid rgba(160,220,120,.4);border-radius:14px;padding:18px 22px;color:#e6f2dc;font:13px/1.5 var(--font-sans, system-ui, sans-serif);box-shadow:0 20px 60px rgba(0,0,0,.6)}
.kjask b{display:block;font-size:17px;margin-bottom:4px}.kjask p{margin:0 0 14px;color:#b9d2a8;font-size:12px}
.kjask .kjbtns{display:flex;gap:8px;justify-content:flex-end}
.kjask button{appearance:none;border:1px solid rgba(160,220,120,.5);background:#1f3a22;color:#e6f2dc;border-radius:8px;padding:7px 14px;cursor:pointer;font:600 13px var(--font-sans, system-ui, sans-serif)}
.kjask button.q{background:#8a2a22;border-color:#d0675a}
.kjres .kjmini{display:none;text-align:center}.kjres .kjmini .kjbig{font:700 40px var(--font-sans, system-ui, sans-serif);line-height:1}
.kjres .kjmini .kjnums{display:flex;gap:16px;justify-content:center;margin:10px 0 14px;font:700 15px var(--font-mono, monospace)}
body.kj-notext .kjtoast, body.kj-notext .kjhud small, body.kj-notext #kjNameB, body.kj-notext .kjhud .kjwt, body.kj-notext .kjhud .kjopt, body.kj-notext .armytoast, body.kj-notext .armyhud{display:none !important}
body.kj-notext .kjres .kjfull{display:none}body.kj-notext .kjres .kjmini{display:block}
body.kj-notext .kjhud .kjbox{gap:12px;padding:5px 10px}
/* v33: one row, never wrapped (the box is wider with the checkpoint cell and the buttons); below the drive HUD's button row */
.kjhud{width:max-content;max-width:98vw}.kjhud .kjbox{flex-wrap:nowrap;white-space:nowrap}.kjhud .kjbox > div{white-space:nowrap}
body.f1on .kjhud{top:60px}body.f1on .kjtoast{top:auto;bottom:150px}
@media (max-width:900px){ .kjhud .kjopt{display:none} .kjhud .kjbox{gap:10px;padding:5px 9px} .kjhud .kjb small{display:none} }
@media (max-width:560px){ .kjhud #kjNameB, .kjhud small{display:none} .kjhud .kjbox{gap:8px;padding:4px 8px} .kjhud .kjv{font-size:13px} .kjhud .kjarr{width:15px;height:15px} .kjtoast{font-size:14px;white-space:normal;width:92vw;text-align:center} }
.kjtoast{position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:63;pointer-events:none;font:700 18px var(--font-sans, system-ui, sans-serif);color:#d8ffc0;text-shadow:0 2px 8px #000, 0 0 20px rgba(80,160,60,.6);opacity:0;transition:opacity .4s;letter-spacing:.04em;white-space:nowrap}
.kjres{position:fixed;inset:0;z-index:70;display:grid;place-items:center;background:rgba(4,12,6,.55);backdrop-filter:blur(2px)}
.kjres[hidden]{display:none}
.kjres .kjcard{min-width:300px;max-width:90vw;background:rgba(14,26,16,.94);border:1px solid rgba(160,220,120,.4);border-radius:14px;padding:20px 24px;color:#e6f2dc;font:13px/1.5 var(--font-sans, system-ui, sans-serif);box-shadow:0 20px 60px rgba(0,0,0,.6)}
.kjres h2{margin:0 0 2px;font-size:26px;letter-spacing:.04em;color:#ff9a7a}
.kjres h2.win{color:#9cff7a}
.kjres .kjsub{color:#a9c29a;font:11px var(--font-mono, monospace);margin-bottom:12px}
.kjres dl{display:grid;grid-template-columns:auto auto;gap:4px 18px;margin:0 0 16px}
.kjres dt{color:#a9c29a}.kjres dd{margin:0;text-align:right;font-weight:700}
.kjres .kjbtns{display:flex;gap:8px;justify-content:flex-end}
.kjres button{appearance:none;border:1px solid rgba(160,220,120,.5);background:#1f3a22;color:#e6f2dc;border-radius:8px;padding:7px 14px;cursor:pointer;font:600 13px var(--font-sans, system-ui, sans-serif)}
.kjres button.pri{background:#4d8a36;border-color:#7dc45e}
.kjpick{margin-top:12px;padding-top:11px;border-top:1px solid var(--rule);display:flex;flex-direction:column;gap:7px}
.kjpick .kjhead b{display:flex;align-items:center;gap:7px;font-size:15px;font-weight:700;letter-spacing:.03em}
.kjpick .kjhead b i{display:grid;place-items:center;width:22px;height:22px;border-radius:6px;background:#17301c;color:#9cf07a}
.kjpick .kjhead b span{font-weight:500;color:var(--muted);font-size:12px}
.kjpick .kjhead small{display:block;font:400 10px/1.45 var(--font-mono);color:var(--muted);margin-top:2px}
.kjpick .kjlab{font:600 9.5px var(--font-mono);letter-spacing:.12em;color:var(--muted);margin-top:2px}
.kjpick .seg button small{display:block;font:400 8.5px var(--font-mono);color:var(--muted)}
.kjpick .kjrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.kjpick .kjgo{appearance:none;border:1px solid #2f5a26;background:#3d6e2c;color:#fff;border-radius:8px;padding:7px 14px;font:600 13px inherit;cursor:pointer}
.kjpane{display:flex;flex-direction:column;gap:9px;min-height:0;overflow-y:auto;flex:1 1 auto}
.kjpane .kjpick{margin-top:0;padding-top:0;border-top:0}
.kjhero{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;background:linear-gradient(135deg,#10251a,#1d3a22 60%,#2d4a1c);color:#e6f2dc;border:1px solid rgba(160,220,120,.35)}
.kjhero i{display:grid;place-items:center;width:40px;height:40px;border-radius:10px;background:#0b1a10;color:#9cf07a}
.kjhero b{display:block;font:700 16px var(--font-sans, system-ui, sans-serif);letter-spacing:.03em}
.kjhero small{display:block;font:400 10.5px/1.45 var(--font-mono, monospace);color:#b9d2a8;margin-top:2px}
.kjplay{appearance:none;border:1px solid #7dc45e;background:#4d8a36;color:#fff;border-radius:10px;padding:11px 14px;font:700 15px var(--font-sans, system-ui, sans-serif);letter-spacing:.03em;cursor:pointer;box-shadow:0 6px 18px rgba(40,90,30,.35)}
.kjplay:hover{background:#5a9c40}.kjplay small{display:block;font:500 10px var(--font-mono, monospace);opacity:.85;margin-top:2px;letter-spacing:0}
.kjnote{font:400 10.5px/1.45 var(--font-mono, monospace);color:var(--muted)}
.kjpane dl.keys{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;margin:2px 0 0;font:400 10.5px/1.4 var(--font-mono, monospace)}
.kjpane dl.keys dt{color:var(--ink);font-weight:600}.kjpane dl.keys dd{margin:0;color:var(--muted)}
.kjshort{margin-top:12px;padding-top:11px;border-top:1px solid var(--rule);display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.kjshort b{font-size:13px;flex:1 1 100%}.kjshort b span{color:var(--muted);font-weight:500;font-size:11.5px}
.kjshort button{appearance:none;border:1px solid var(--rule);background:var(--panel);color:var(--ink);border-radius:8px;padding:6px 10px;font:500 12px inherit;cursor:pointer}
.kjshort button.pri{background:#3d6e2c;border-color:#2f5a26;color:#fff;font-weight:600}
.dtab.kjtab i{background:#17301c;color:#9cf07a}.dtab.kjtab span{white-space:nowrap}
.kjpick .kjrest{appearance:none;border:1px solid var(--rule);background:var(--panel);color:var(--ink);border-radius:8px;padding:6px 10px;font:500 11px inherit;cursor:pointer}
.kjpick .seg.kjsp{grid-auto-flow:row;grid-template-columns:repeat(4,minmax(0,1fr))}
.kjpick .seg.kjsp button{border-left:0;padding-left:2px;padding-right:2px}.kjpick .seg.kjsp button:not(:nth-child(4n+1)){border-left:1px solid var(--rule)}.kjpick .seg.kjsp button:nth-child(n+5){border-top:1px solid var(--rule)}
`;
  const UI = {};
  function uiInit(){
    if (UI.done || typeof document === 'undefined') return; UI.done = true;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    UI.vig = document.createElement('div'); UI.vig.className = 'kjvig'; document.body.appendChild(UI.vig);
    UI.hud = document.createElement('div'); UI.hud.className = 'kjhud'; UI.hud.hidden = true;
    const CLK = '<svg class="kjic" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="11" r="7.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M10 6.5v5l3 2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M7 1.5h6" stroke="currentColor" stroke-width="2.2"/></svg>';
    const ARR = (id, c) => `<svg class="kjarr${c ? ' ' + c : ''}" id="${id}" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1 L16 17 L10 13 L4 17 Z" fill="currentColor"/></svg>`;
    UI.hud.innerHTML = `<div class="kjbox"><div id="kjNameB"><b id="kjName">克苏鲁 CTHULHU</b><small id="kjPh">—</small></div><div>${CLK}<span class="kjv" id="kjT">0:00</span><small id="kjTL">存活 SURVIVED</small></div>
<div title="怪兽 · The creature"><span class="kjic">${icon(13)}</span>${ARR('kjArr')} <span class="kjv" id="kjD">—</span><small>距离 DISTANCE</small></div>
<div id="kjExB" hidden title="下一个检查点 · Next checkpoint">${ARR('kjExA', 'ex')} <span class="kjv" id="kjExD">—</span><span class="kjcpn" id="kjCpN"></span><small id="kjExN">撤离 EXTRACTION</small></div>
<div class="kjopt" id="kjNB"><span class="kjv" id="kjN">0</span><small>倒塌 COLLAPSED</small></div>
<div class="kjbtns2"><button type="button" class="kjb" id="kjTxt" aria-pressed="false" title="文字 开 / 关 · Text on / off (T)">Aa</button><button type="button" class="kjb q" id="kjQuit" title="退出克苏鲁模式 · Quit the creature mode (Esc)">✕ <small>退出 Quit</small></button></div></div>
<div class="kjwarn" id="kjW">${ARR('kjWA', 'kjwa')}<span class="kjwt" id="kjWT"></span></div>`;
    document.body.appendChild(UI.hud);
    UI.toast = document.createElement('div'); UI.toast.className = 'kjtoast'; document.body.appendChild(UI.toast);
    UI.res = document.createElement('div'); UI.res.className = 'kjres'; UI.res.hidden = true; document.body.appendChild(UI.res);
    const q = id => UI.hud.querySelector('#' + id); UI.q = {name:q('kjName'), ph:q('kjPh'), t:q('kjT'), tl:q('kjTL'), arr:q('kjArr'), d:q('kjD'), exb:q('kjExB'), exa:q('kjExA'), exd:q('kjExD'), exn:q('kjExN'), n:q('kjN'), w:q('kjW'), wa:q('kjWA'), wt:q('kjWT'), cpn:q('kjCpN'), nb:q('kjNB'), txt:q('kjTxt'), quit:q('kjQuit')};
    if (UI.q.txt) UI.q.txt.addEventListener('click', e => { e.stopPropagation(); textSet(); });
    if (UI.q.quit) UI.q.quit.addEventListener('click', e => { e.stopPropagation(); quitAsk(); });
    // v33: the confirm for quitting a running game
    UI.ask = document.createElement('div'); UI.ask.className = 'kjask'; UI.ask.hidden = true;
    UI.ask.innerHTML = `<div class="kjcard" role="dialog" aria-label="退出 Quit"><b>退出克苏鲁模式？ · Quit the creature mode?</b><p>游戏结束，倒塌的建筑会恢复。<br>The game ends and the city is restored.</p><div class="kjbtns"><button type="button" data-k="stay">继续玩 Keep playing</button><button type="button" class="q" data-k="quit">退出 Quit</button></div></div>`;
    document.body.appendChild(UI.ask);
    UI.ask.querySelector('[data-k="stay"]').addEventListener('click', () => askHide()); UI.ask.querySelector('[data-k="quit"]').addEventListener('click', () => quit());
    UI.ask.addEventListener('click', e => { if (e.target === UI.ask) askHide(); });
    keyHook(); keyListen(); if (!TR.loaded) loadTR(); textSync();
    kjTab(); trayShortcut(); autoStart();
  }
  function vignette(k){ if (UI.vig){ const v = (+k).toFixed(2); if (UI.vigK !== v){ UI.vigK = v; UI.vig.style.opacity = v; } } }
  function hudShow(on){ uiInit(); if (UI.hud) UI.hud.hidden = !on; }
  function hudTitle(){ uiInit(); if (UI.q && UI.q.name){ const D = spOf(G.sp); UI.q.name.textContent = D.zh + ' ' + D.en.toUpperCase(); } }
  let toastT = 0;
  function toast(s, sec){ uiInit(); if (!UI.toast) return; if (TR.loaded && TR.txt === false){ UI.toast.style.opacity = '0'; return; } UI.toast.textContent = s; UI.toast.style.opacity = '1'; clearTimeout(toastT); toastT = setTimeout(() => { UI.toast.style.opacity = '0'; }, (sec || 2.5)*1000); }
  const fmt = s => Math.floor(s/60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const PHN = {rise:'苏醒 RISING', roar:'咆哮 ROAR', hunt:'追猎 HUNTING', catch:'捕获 CAUGHT', crush:'踩扁 CRUSHED', won:'—', done:'—'};
  function bearingTo(x, y){ const c = camera.position, f = new THREE.Vector3(); camera.getWorldDirection(f); const yawCam = Math.atan2(f.x, -f.z), b = Math.atan2(x - c.x, y + c.z); return b - yawCam; }
  function hudTick(P, L){
    if (!UI.hud || UI.hud.hidden || (G.frames % 6)) return;
    const q = UI.q, d = Math.hypot(L.x - P.x, L.y - P.y);
    q.ph.textContent = PHN[P.phase] || P.phase;
    if (G.goal === 'survive'){ q.t.textContent = fmt(Math.max(0, SURV[G.diff] - G.t)); q.tl.textContent = '坚持 HOLD OUT'; } else { q.t.textContent = fmt(G.t); q.tl.textContent = '存活 SURVIVED'; }
    q.d.textContent = d > 1000 ? (d/1000).toFixed(1) + ' km' : Math.round(d) + ' m';
    q.arr.style.transform = `rotate(${(bearingTo(P.x, P.y)*180/PI).toFixed(0)}deg)`;
    const C = CP.on ? CP.list[CP.idx] : null;
    if (C){ q.t.textContent = fmt(Math.max(0, SURV[G.diff] - G.t)); q.tl.textContent = '剩余 TIME LEFT'; }   // (the mission: 10:00 to get out)
    if (C){ q.exb.hidden = false; const de = Math.hypot(L.x - C.x, L.y - C.y), n = CP.list.length - 1; q.exd.textContent = de > 1000 ? (de/1000).toFixed(1) + ' km' : Math.round(de) + ' m';
      q.cpn.textContent = C.exit ? '⚑' : C.n + '/' + n; q.exn.textContent = C.exit ? '撤离 ' + C.zh + ' · ' + C.en : '检查点 CHECKPOINT'; q.exa.style.transform = `rotate(${(bearingTo(C.x, C.y)*180/PI).toFixed(0)}deg)`; q.exa.style.color = C.exit ? '#7dff9e' : '#ffc83a'; }
    else if (G.exit){ q.exb.hidden = false; const de = Math.hypot(L.x - G.exit.x, L.y - G.exit.y); q.exd.textContent = de > 1000 ? (de/1000).toFixed(1) + ' km' : Math.round(de) + ' m'; q.cpn.textContent = ''; q.exn.textContent = G.exit.zh + ' · ' + G.exit.en; q.exa.style.transform = `rotate(${(bearingTo(G.exit.x, G.exit.y)*180/PI).toFixed(0)}deg)`; q.exa.style.color = ''; }
    else q.exb.hidden = true;
    q.n.textContent = G.destroyedN; if (q.nb) q.nb.hidden = !!C;
    let w = '', wa = null; if (P.phase === 'hunt'){ const X = SPX(), wk = X.warn[P.k], wf = X.warnFn ? X.warnFn(P, d) : '', S = !G.remote && G.sim ? G.sim.S : null;
      if (wk && P.p < (G.SP.HIT_P[P.k] || 0.5)) w = wk; else if (wf) w = wf;
      else if (S && S.ahead && S.md === 0 && d > 300){ wa = [P.x, P.y]; w = '它在前方上空盘旋 · It circles over the road ahead'; }
      else if (S && S.bm && d > 220){ const db = Math.hypot(L.x - S.bx, L.y - S.by); wa = [S.bx, S.by]; w = S.bm === 1 ? `它要在前方拦截你！${db > 1000 ? (db/1000).toFixed(1) + ' km' : Math.round(db) + ' m'} · IT IS CUTTING YOU OFF AHEAD` : S.bm === 3 ? '它在前方横穿马路 · It is crossing the road ahead' : '它挡在前面的路上 — 换条路！ · It blocks the road ahead — take another street!'; }
      else if (d < 450) w = '它就在身后！ · IT IS RIGHT BEHIND YOU!'; else if (d < 900) w = '它在逼近 · It is closing in'; }
    if (q.wt.textContent !== w) q.wt.textContent = w;
    q.w.classList.toggle('on', !!wa); if (wa) q.wa.style.transform = `rotate(${(bearingTo(wa[0], wa[1])*180/PI).toFixed(0)}deg)`;
  }
  function showResult(kind){
    uiInit(); G.result = {kind, t:G.t};
    const win = kind !== 'caught' && kind !== 'crushed', L = localTarget(), ncp = CP.list.length ? CP.list.length - 1 : 0, pcp = CP.list.filter(c => c.passed && !c.exit).length;
    const title = win ? (kind === 'extract' ? '成功撤离 ESCAPED' : kind === 'timeout' ? '幸存 · 未撤离 SURVIVED · NOT OUT' : '幸存 SURVIVED') : kind === 'crushed' ? '被踩扁 CRUSHED' : '被抓住了 CAUGHT';
    const cpRow = ncp ? `<dt>检查点 Checkpoints</dt><dd>${pcp}/${ncp}</dd><dt>拦截 · 躲过 Blocks · got past</dt><dd>${G.sim && G.sim.S && G.sim.S.bN || 0} · ${G.sim && G.sim.S && G.sim.S.bPass || 0}</dd>` : '';
    UI.res.innerHTML = `<div class="kjcard"><div class="kjfull"><h2 class="${win ? 'win' : ''}">${title}</h2>
<div class="kjsub">${spOf(G.sp).zh} ${spOf(G.sp).en} · ${DIFFN[G.diff][0]} ${DIFFN[G.diff][1]} · ${G.goal === 'extract' && G.exit ? (ncp ? ncp + ' 个检查点 → ' : '') + '撤离点 ' + G.exit.zh + ' · ' + (ncp ? ncp + ' checkpoints → ' : '') + G.exit.en : '生存 ' + fmt(SURV[G.diff]) + ' SURVIVE'}</div>
<dl><dt>存活时间 Time survived</dt><dd>${fmt(G.t)}</dd>${cpRow}<dt>行驶距离 Distance travelled</dt><dd>${(G.dist/1000).toFixed(2)} km</dd><dt>惊险躲过 Near misses</dt><dd>${G.nearN || 0}</dd><dt>倒塌建筑 Buildings destroyed</dt><dd>${G.destroyedN}</dd></dl></div>
<div class="kjmini"><div class="kjbig" style="color:${win ? '#9cff7a' : '#ff9a7a'}">${win ? (kind === 'extract' ? '⚑ ✓' : '✓') : '✕'}</div><div class="kjnums"><span>⏱ ${fmt(G.t)}</span>${ncp ? `<span>⚑ ${pcp}/${ncp}</span>` : ''}<span>${(G.dist/1000).toFixed(1)} km</span></div></div>
<div class="kjbtns"><button type="button" data-k="exit" title="退出 · Quit">✕ 退出 Quit</button><button type="button" class="pri" data-k="again" title="再来一次 · Retry">↻ 再来一次 Retry</button></div></div>`;
    UI.res.hidden = false;
    UI.res.querySelector('[data-k="exit"]').onclick = () => quit();
    UI.res.querySelector('[data-k="again"]').onclick = () => { const o = {difficulty:G.diff, goal:G.goal, species:G.spReq}; stop(); caughtEnd(); try { if (window.SGF1 && SGF1.crash && SGF1.crash.repair) SGF1.crash.repair(); } catch (e){ /* */ } start(o); };
    if (win) toast(kind === 'extract' ? '逃出生天！ · You made it out!' : kind === 'timeout' ? '天亮了，它退回了深海……但你没能撤离 · You held out, but did not get out' : '天亮了，它退回了深海…… · You held out!', 3);
  }
  function resultHide(){ if (UI.res) UI.res.hidden = true; }
  // ---- the UI entry points: a dock tab of its own (克苏鲁 Cthulhu: one-click single-player "Play now" + options), a shortcut in
  // the drive pane, a "play solo" hook for the multiplayer pane, and #cthulhu / ?play=cthulhu in the URL to start right away.
  const TR = {diff:1, goal:'survive', veh:'drive', sp:'cthulhu', shake:1, txt:true};
  const SPPICK = () => spIds().map(id => [id, spOf(id).zh, spOf(id).en]).concat([['random', '随机', 'Random']]);
  const spLabel = id => id === 'random' ? ['巨怪', 'creature', '随机', 'Random'] : [spOf(id).zh, spOf(id).en, spOf(id).zh, spOf(id).en];
  const ICON = '<svg width="%s" height="%s" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1c4 0 6 3 6 6.5 0 2-1 3.5-2 4.5l1 6-2-1-1 2-1-3-1 3-1-2-2 1 1-6c-1-1-2-2.5-2-4.5C4 4 6 1 10 1z" fill="currentColor"/></svg>';
  const icon = n => ICON.replace('%s', n).replace('%s', n);
  function loadTR(){ try { const s = JSON.parse(localStorage.getItem('cb_kaiju') || 'null'); if (s){ TR.diff = Math.max(0, Math.min(2, s.diff | 0)); TR.goal = s.goal === 'extract' ? 'extract' : 'survive'; TR.veh = ['drive', 'fly', 'watch'].includes(s.veh) ? s.veh : 'drive'; TR.sp = s.sp === 'random' || KB.get(s.sp) ? s.sp : 'cthulhu'; TR.shake = [0, 1, 2].includes(s.shake) ? s.shake : 1; TR.txt = s.txt !== false; } } catch (e){ /* */ } TR.loaded = true; SHK.lv = TR.shake; }
  function saveTR(){ try { localStorage.setItem('cb_kaiju', JSON.stringify({diff:TR.diff, goal:TR.goal, veh:TR.veh, sp:TR.sp, shake:TR.shake, txt:TR.txt !== false})); } catch (e){ /* */ } }
  const VEHN = {drive:['驾车', 'Drive'], fly:['飞行', 'Fly'], watch:['观看', 'Watch']};
  function summary(){ const L = spLabel(TR.sp), n = CPN[TR.diff]; return `${L[2]} · ${VEHN[TR.veh][0]} · ${DIFFN[TR.diff][0]} · ${TR.goal === 'extract' ? '过 ' + n + ' 个检查点再撤离' : '坚持 ' + fmt(SURV[TR.diff])}  ·  ${L[3]} · ${VEHN[TR.veh][1]} · ${DIFFN[TR.diff][1]} · ${TR.goal === 'extract' ? n + ' checkpoints, then the exit' : 'survive ' + fmt(SURV[TR.diff])}`; }
  function openTab(){ const b = document.getElementById('kjTab'); if (b && typeof showCat === 'function'){ showCat('kj', true); const br = document.getElementById('brushRow'); if (br) br.hidden = true; } }
  function fixCols(){ const tabs = document.querySelector('.dock-tabs'); if (!tabs) return; const n = tabs.querySelectorAll('.dtab').length; if (n > 6) tabs.style.setProperty('grid-template-columns', `repeat(${n},minmax(0,1fr))`, 'important'); }
  function kjTab(){
    const tabs = document.querySelector('.dock-tabs'), tray = document.getElementById('tray'), foot = document.getElementById('brushRow');
    if (!tabs || !tray){ if ((kjTab.n = (kjTab.n || 0) + 1) < 40) setTimeout(kjTab, 500); return; }
    if (document.getElementById('kjTab')) return;
    loadTR();
    if (typeof CATS !== 'undefined') CATS.kj = ['克苏鲁', 'Cthulhu', 'view', '单人直接玩：巨物从海中升起追猎你，开车或飞行逃离 · Single player: a colossal creature hunts you through the city'];
    const b = document.createElement('button'); b.className = 'dtab kjtab'; b.setAttribute('role', 'tab'); b.dataset.cat = 'kj'; b.setAttribute('aria-selected', 'false'); b.id = 'kjTab';
    b.innerHTML = `<i>${icon(16)}</i><span>克苏鲁</span><small>Cthulhu</small>`; b.title = '克苏鲁 · Cthulhu — 单人直接玩 single player';
    const f1 = document.getElementById('f1Tab'); if (f1 && f1.parentNode === tabs) f1.after(b); else tabs.appendChild(b);
    b.addEventListener('click', () => { const tr = document.getElementById('tray'); if (typeof dockCat !== 'undefined' && dockCat === 'kj' && !tr.classList.contains('closed')){ tr.classList.add('closed'); return; } openTab(); paneSync(); });
    const p = document.createElement('div'); p.className = 'tray-pane kjpane'; p.dataset.cat = 'kj'; p.hidden = true; tray.insertBefore(p, foot || null); UI.pane = p;
    p.innerHTML = `<div class="kjhero"><i>${icon(26)}</i><div><b id="kjHeroT">逃离克苏鲁 · Escape Cthulhu</b><small>单人模式，不用服务器，点一下就开始。巨物从最近的水里升起，追着你的车，挡路的楼会被它踩塌。<br>Single player, no server needed — one click. It rises from the nearest water and hunts your car; buildings in its way collapse.</small></div></div>
<button type="button" class="kjplay" id="kjPlay">▶ 立即开始 · Play now<small id="kjSum"></small></button>
<div class="kjnote" id="kjWhere">从镜头所在的位置出发（先把地图移到想开始的地方）· Starts where the camera looks (move the map first).</div>
<div class="kjpick">
<div class="kjlab">怪兽 · CREATURE</div><div class="seg kjsp" role="group" aria-label="怪兽 Creature">${SPPICK().map(d => `<button type="button" data-ks="${d[0]}" aria-pressed="false">${d[1]}<small>${d[2]}</small></button>`).join('')}</div>
<div class="kjlab">难度 · DIFFICULTY</div><div class="seg" role="group" aria-label="难度 Difficulty">${DIFFN.map((d, i) => `<button type="button" data-kd="${i}" aria-pressed="false">${d[0]}<small>${d[1]}</small></button>`).join('')}</div>
<div class="kjlab">目标 · GOAL</div><div class="seg" role="group" aria-label="目标 Goal"><button type="button" data-kg="survive" aria-pressed="false">生存<small>Survive 10:00</small></button><button type="button" data-kg="extract" aria-pressed="false">逃离任务<small>Checkpoints → exit</small></button></div>
<div class="kjlab">方式 · AS</div><div class="seg" role="group" aria-label="方式 Vehicle"><button type="button" data-kv="drive" aria-pressed="false">驾车<small>Drive</small></button><button type="button" data-kv="fly" aria-pressed="false">飞行<small>Fly</small></button><button type="button" data-kv="watch" aria-pressed="false">观看<small>Watch</small></button></div>
<div class="kjlab">镜头震动 · CAMERA SHAKE</div><div class="seg" role="group" aria-label="镜头震动 Camera shake"><button type="button" data-kk="0" aria-pressed="false">关<small>Off</small></button><button type="button" data-kk="1" aria-pressed="false">弱<small>Low</small></button><button type="button" data-kk="2" aria-pressed="false">中<small>Medium</small></button></div>
<div class="kjlab">屏幕文字 · ON-SCREEN TEXT (T)</div><div class="seg" role="group" aria-label="屏幕文字 On-screen text"><button type="button" data-kt="1" aria-pressed="false">显示<small>Show</small></button><button type="button" data-kt="0" aria-pressed="false">隐藏<small>Hide (icons only)</small></button></div>
</div>
<dl class="keys"><dt>W / ↑ · S / ↓</dt><dd>油门 · 刹车 Throttle · brake</dd><dt>A D / ← →</dt><dd>转向 Steer</dd><dt>空格 Space</dt><dd>手刹 Handbrake</dd><dt>C · R</dt><dd>视角 · 复位 Camera · reset</dd><dt>T · Esc</dt><dd>文字开关 · 退出模式 Text on/off · quit the mode</dd><dt>手机 Phone</dt><dd>屏幕上的方向盘和踏板 On-screen wheel and pedals</dd></dl>
<div class="kjpick"><div class="kjrow"><button type="button" class="kjrest" id="kjRest">恢复城市 Restore city</button><button type="button" class="kjrest" id="kjMp">和朋友一起 → 多人 Multiplayer</button></div></div>`;
    p.querySelectorAll('[data-ks]').forEach(x => x.addEventListener('click', () => { TR.sp = x.dataset.ks; saveTR(); paneSync(); }));
    p.querySelectorAll('[data-kd]').forEach(x => x.addEventListener('click', () => { TR.diff = +x.dataset.kd; saveTR(); paneSync(); }));
    p.querySelectorAll('[data-kg]').forEach(x => x.addEventListener('click', () => { TR.goal = x.dataset.kg; saveTR(); paneSync(); }));
    p.querySelectorAll('[data-kv]').forEach(x => x.addEventListener('click', () => { TR.veh = x.dataset.kv; saveTR(); paneSync(); }));
    p.querySelectorAll('[data-kk]').forEach(x => x.addEventListener('click', () => { TR.shake = +x.dataset.kk; SHK.lv = TR.shake; saveTR(); paneSync(); }));
    p.querySelectorAll('[data-kt]').forEach(x => x.addEventListener('click', () => textSet(x.dataset.kt === '1')));
    p.querySelector('#kjPlay').addEventListener('click', () => uiStart());
    p.querySelector('#kjRest').addEventListener('click', () => { const n = KW.restore(); toast('城市已恢复 · City restored (' + n + ' tiles)', 2); });
    p.querySelector('#kjMp').addEventListener('click', () => { const t = document.getElementById('netTab'); if (t) t.click(); else toast('多人模块未加载 · No multiplayer module', 2); });
    paneSync(); fixCols(); setTimeout(fixCols, 1000); setTimeout(fixCols, 4000);
  }
  function paneSync(){
    const p = UI.pane; if (!p) return;
    p.querySelectorAll('[data-ks]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.ks === TR.sp)));
    const ht = p.querySelector('#kjHeroT'); if (ht){ const L = spLabel(TR.sp); ht.textContent = TR.sp === 'cthulhu' ? '逃离克苏鲁 · Escape Cthulhu' : `逃离${L[0]} · Escape the ${L[1]}`; }
    p.querySelectorAll('[data-kd]').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.kd === TR.diff)));
    p.querySelectorAll('[data-kg]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.kg === TR.goal)));
    p.querySelectorAll('[data-kv]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.kv === TR.veh)));
    p.querySelectorAll('[data-kk]').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.kk === TR.shake)));
    p.querySelectorAll('[data-kt]').forEach(x => x.setAttribute('aria-pressed', String((x.dataset.kt === '1') === (TR.txt !== false))));
    const sm = p.querySelector('#kjSum'); if (sm) sm.textContent = summary();
    const real = typeof SGR !== 'undefined' && SGR.on, w = p.querySelector('#kjWhere'), pl = p.querySelector('#kjPlay');
    if (w) w.textContent = real ? '从镜头所在的位置出发（先把地图移到想开始的地方）· Starts where the camera looks (move the map first).' : '需要真实城市地图：先在顶部选新加坡、湾区或纽约 · Needs a real city map: pick Singapore, Bay Area or New York at the top.';
    if (pl) pl.disabled = !real;
  }
  // a compact shortcut at the end of the drive pane (the full card lives in its own tab now)
  function trayShortcut(){
    const pane = document.querySelector('.tray-pane[data-cat="f1"]');
    if (!pane){ if ((trayShortcut.n = (trayShortcut.n || 0) + 1) < 40) setTimeout(trayShortcut, 500); return; }
    if (pane.querySelector('.kjshort')) return;
    if (!pane.querySelector('.flypick') && (trayShortcut.w = (trayShortcut.w || 0) + 1) < 10){ setTimeout(trayShortcut, 500); return; }
    const box = document.createElement('div'); box.className = 'kjshort';
    box.innerHTML = `<b>克苏鲁 <span>Cthulhu · 单人直接玩 single player</span></b><button type="button" class="pri" data-k="play">▶ 立即开始 Play now</button><button type="button" data-k="opt">选项 Options</button>`;
    box.querySelector('[data-k="play"]').addEventListener('click', () => uiStart());
    box.querySelector('[data-k="opt"]').addEventListener('click', () => { openTab(); paneSync(); });
    pane.appendChild(box);
  }
  // #cthulhu, #kaiju or ?play=cthulhu: open the tab and start as soon as the streets around the camera are loaded
  function autoStart(){
    let want = false;
    let spw = null;
    try { const h = decodeURIComponent((location.hash || '').toLowerCase()), q = new URLSearchParams(location.search), pm = (q.get('play') || q.get('mode') || '').toLowerCase();
      want = /cthulhu|kaiju|克苏鲁/.test(h) || /cthulhu|kaiju/.test(pm);
      for (const id of spIds().concat(['random'])) if (h.includes(id) || pm === id || (q.get('creature') || '').toLowerCase() === id){ want = true; spw = id; } } catch (e){ /* */ }
    if (!want) return;
    const t0 = performance.now();
    const tick = () => {
      const real = typeof SGR !== 'undefined' && SGR.on; let done = 0;
      try { if (real) for (const T of SGR.tiles.values()) if (T.done) done++; } catch (e){ /* */ }
      if (!document.getElementById('kjTab') || !(real && done >= 6 && window.SGF1) && performance.now() - t0 < 90000){ setTimeout(tick, 700); return; }
      openTab(); paneSync(); if (real) setTimeout(() => uiStart(spw ? {species:spw} : undefined), 600);
    };
    setTimeout(tick, 1500);
  }
  function uiStart(o){
    loadTR(); if (o && typeof o === 'object'){ if (o.difficulty !== undefined) TR.diff = Math.max(0, Math.min(2, o.difficulty | 0)); if (o.goal) TR.goal = o.goal === 'extract' ? 'extract' : 'survive'; if (o.veh && VEHN[o.veh]) TR.veh = o.veh; if (o.species && (o.species === 'random' || KB.get(o.species))) TR.sp = o.species; }
    if (!(typeof SGR !== 'undefined' && SGR.on)){ toast('需要真实城市地图 · Needs the real city map', 3); return false; }
    let put = null;
    try {
      if (TR.veh === 'drive' && window.SGF1 && !(SGF1.F1 && SGF1.F1.on)){ if (SGF1.enter(KW.isBay() || KW.isNyc() ? 'car' : 'free', {place:'here'}) !== false && SGF1.F1 && SGF1.F1.on) put = 'car'; }
      else if (TR.veh === 'fly' && window.SGFly && !SGFly.on){ SGFly.enter('dragonfly', {place:'air'}); if (SGFly.on) put = 'fly'; }
      else if (TR.veh === 'watch'){ if (window.SGF1 && SGF1.F1 && SGF1.F1.on) SGF1.exit(); if (window.SGFly && SGFly.on) SGFly.exit(); }
    } catch (e){ console.warn('[kaiju] vehicle', e); }
    const tr = document.getElementById('tray'); if (tr) tr.classList.add('closed');
    const ok = start({difficulty:TR.diff, goal:TR.goal, spawn:'auto', species:TR.sp});
    if (ok) G.put = put;
    if (ok && TR.veh !== 'watch') setTimeout(() => { if (G.on) toast(CP.on ? '快跑！穿过琥珀色光柱 · T 文字 · Esc 退出 — RUN! Drive through the amber beacons · T text · Esc quit' : '快跑！W 油门 · A/D 转向 · T 文字 · Esc 退出 — RUN! W throttle · A/D steer · T text · Esc quit', 4); }, 4500);
    return ok;
  }
  return {G, uiStart, start, stop, state, applyState, setTargets, onDestroy, onCatch, destroy, status, frame, prerender, postrender, uiInit, ENV, EXITS, SURV, showResult, localTarget, spawnPoint, pickExit, ensureModel, placeModel, caughtEnd,
    hinder, body, shakeEv, shakeIn, shakeSet, shakeStats, SHK, carView, obsFn, OBX, TCM, throwCar, caughtBegin, UI,
    species:() => spIds().map(id => ({id, zh:spOf(id).zh, en:spOf(id).en})), useSp, paneSync, TR,
    // v33
    CP, cpPlan, roadSnap, roadIdx, routeUpdate, routeNow, cpStep, cpPass, quit, quitAsk, textSet, textOn, kjKey, keyHook, markers, CPN, CPR};
})();

// ---- 60_api.js ----
/* ================= window.SGKaiju (the contract) and the hooks =================
   start(opts)        {seed, spawn:'auto' | 'sea' | {x, y}, difficulty:0-2, remote:false, goal:'survive' | 'extract', localId:'local', keep,
                      species:'cthulhu' (default) | 'kraken' | 'crab' | 'serpent' | 'shoggoth' | 'random' (picked from the seed)}
                      -> true; a new local game restores the city first unless keep:true
   species()          [{id, zh, en}] the creatures (v30)
   stop()             the creature sinks out of sight; destruction stays (restore() brings the city back)
   on                 boolean
   state()            {sp, t, x, y, z, hdg, phase, target, anim:[gait, speed, action, progress, ax, ay, az, wings, rise, look, ...species extras]}
                      (~150-190 bytes JSON; sp = the species id)
   applyState(s)      remote mode: buffer the host's snapshot (starts a remote creature if none, of species s.sp, and rebuilds it when
                      s.sp changes); drawn ~0.25 s behind, interpolated
   setTargets([{id, x, y, z}])  who it hunts (default: the local vehicle / view as id opts.localId); null / [] back to local
   onDestroy(cb)      cb([{tile, idx}]) when the local AI brings buildings down (stable ids: tile index + bld.js record index)
   destroy([{tile, idx}])  apply destruction received from the host
   onCatch(cb)        cb(targetId) when the AI catches a target
   status()           {on, phase, dist, timer, remaining, caught, result, goal, exit, destroyed, difficulty, remote, species}
   v31 (lm28/kaiju3): species 'reptile' (巨蜥兽 Titan Lizard) and 'wyvern' (飞龙 Wyvern) join the list; survive = 10:00 on every difficulty;
   hinder({x, y, z, k, src})  the army's hit on the creature (k 0-1, src the unit id): suppression slows it (<= 40 %, gone in a few
                      seconds), it flinches now and then and may turn on the shooter; never damage. Local games only (false otherwise).
   body()             [{x, y, z, r}] <= 24 spheres (world metres) where shells can hit; [] without a creature (objects reused per frame)
   The AI reads window.SGArmy.targets() (guarded) and attacks units it chooses; every strike calls SGArmy.hit(id, {x, y, z, e, fx, fy})
   for each unit it reaches. shake(level) 0 off / 1 low / 2 medium (the tab's setting) -> level; shakeStats(reset) the shake's numbers.
   The catch rework (every species): no proximity catch - a catch only when a grabbing part (tentacle club, claw jaws, jaws, talons,
   a pseudopod's end) touches the target's box in the strike's window; the aim follows the prey only until the strike is committed
   (a visible wind-up: 2.6 / 2.0 / 1.5 s before the hit by difficulty); no grab at a car right under it. The feet, legs, tail, low body
   and the arms on the streets are solid: window.SGF1.obstacles(fn) (drivecam) gets them as boxes {id, x, y, hx, hy, hdg, z0, h, m:
   Infinity, vx, vy} (the car passes under the belly, between the legs); a foot coming down on the car crushes it (phase 'crush',
   status().crushed, result 被踩扁 CRUSHED, onCatch(cb) gets (id, 'crush')); a slam landing on it or a limb sweeping into it throws it
   (damage, no catch); misses by a few metres: 惊险 NEAR MISS (status().nearMisses, the result card). 40_world's shake(a, x, y, z) may
   call KG.shakeIn(a, x, y, z); the old G.shake = ... writes still work (an accessor).
   v33 (lm30/kaiju5): goal 'extract' = the escape route: 4 / 5 / 6 checkpoints (by difficulty) on real roads, then the exit; status()
                      gains checkpoints {n, passed, skips, next:{n, exit, x, y, dist}}, block {mode 0 chase / 1 go / 2 wait / 3 cross, x, y, n,
                      dodged, gaveUp, toppled} and text; results 'extract' (all + the exit), 'timeout' (10:00, not out). The creature cuts the
                      player off on the route (18_block.js). quit() (= the HUD's 退出 Quit: stop, restore the city, leave the vehicle the game
                      put the player in), text(on) (on-screen text on / off, persisted; no argument: toggles), checkpoints() the route.
                      window.SGNav (guarded): setDest(next checkpoint), markers('kaiju', fn), route() (the player's route for the AI).
   Extras: play({difficulty, goal, veh, species}) (single player: vehicle + start, as the tab's Play button), restore(), sim(sec, dt) (advance in
   fixed steps, tests), pose(P, species) (show a pose without a game), stats(), _ (internals). */
const SGKaiju = {
  start:o => KG.start(o), stop:() => KG.stop(), get on(){ return KG.G.on; }, species:() => KG.species(),
  state:() => KG.state(), applyState:s => KG.applyState(s), setTargets:L => KG.setTargets(L),
  onDestroy:cb => KG.onDestroy(cb), destroy:L => KG.destroy(L), onCatch:cb => KG.onCatch(cb), status:() => KG.status(),
  restore:() => KW.restore(),
  hinder:h => KG.hinder(h), body:() => KG.body(), shake:lv => KG.shakeSet(lv), shakeStats:reset => KG.shakeStats(reset),
  play:o => KG.uiStart(o),
  quit:() => KG.quit(), text:on => KG.textSet(on), checkpoints:() => KG.CP.list.map(c => ({n:c.n, exit:!!c.exit, x:Math.round(c.x), y:Math.round(c.y), passed:!!c.passed, zh:c.zh, en:c.en, road:c.road ? c.road[0] || c.road[1] : null})),        // single player in one call: enter the car / aircraft from the saved (or given) options and start
  sim(sec, dt){ dt = dt || 1/30; const n = Math.round(sec/dt), t0 = performance.now(); for (let i = 0; i < n; i++) KG.frame(KG.G.t + dt, dt); return {steps:n, msPerStep:+((performance.now() - t0)/Math.max(1, n)).toFixed(3), status:KG.status()}; },
  pose(P, sp){ if (!KG.G.on) KG.useSp(sp || KG.G.sp || 'cthulhu'); const D = KG.G.SP; KG.ensureModel(KG.G.sp);
    const Q = Object.assign({t:0, x:0, y:0, z:0, hdg:0, g:0, v:0, k:0, p:0, ax:0, ay:0, az:0, w:0.5, r:1, ly:0}, P), ctx = D.mkCtx ? D.mkCtx() : null; if (ctx && D.ctxStep) D.ctxStep(ctx, Q, KG.ENV);
    const O = D.pose(Q, KG.ENV, D.mkOut(), ctx); KG.placeModel(O); KFX.frame(KG.G.clock, typeof nightF !== 'undefined' ? nightF : 0); KFX.eyes(O.eye, 0.4 + 1.6*(typeof nightF !== 'undefined' ? nightF : 0), true); return {sp:KG.G.sp, head:O.head.map(Math.round), tip:O.tip.map(p => p.map(Math.round))}; },
  stats(){ const K = KG.G.K; return {species:KG.G.sp, ms:+KG.G.ms.toFixed(3), msMax:+KG.G.msMax.toFixed(3), lodTris:K ? K.tris : null, buildMs:K ? Math.round(K.ms) : null, bones:KG.G.SP ? KG.G.SP.NB : KC.NB,
    lod:K ? K.lods.findIndex(m => m.visible) : null, destroyed:KG.G.destroyedN, kd:window.SGBld && SGBld.kd ? SGBld.kd.stats() : null, fx:KFX.inited ? {debris:KFX.P.deb.S.n, dust:KFX.P.dust.S.n, drips:KFX.P.drip.S.n} : null,
    bldIndexTiles:KW.BX.size, events:KG.G.events.slice(-8), shake:KG.shakeStats(false), army:{hinders:KG.G.hindN || 0, hits:KG.G.armyHits || 0, sup:KG.G.P ? +(KG.G.P.sup || 0).toFixed(2) : 0, focus:KG.G.P ? KG.G.P.armyId : null}, world:KW.stats()}; },
  _:{KC, KM, KW, KFX, KG, KB, KSK, KSX, KI}
};
if (typeof window !== 'undefined') window.SGKaiju = SGKaiju;
if (typeof HOOKS !== 'undefined'){
  HOOKS.boot.push(() => { try { KG.uiInit(); } catch (e){ console.error('[kaiju] ui', e); } });
  HOOKS.frame.push((t, dt) => KG.frame(t, dt));
  HOOKS.prerender.push((t, dt) => KG.prerender(t, dt));
  HOOKS.render.push(() => KG.postrender());
}

}

