// ===== City Brush v48 · lm50mech/mech — 机甲 · Mech mode: pilot a giant mech and fight the creature (owner's request 28 Nov 2026) =====
// The mech: an original design built procedurally here (no franchise look, no logos, no text): a ~71 m heavy engineering walker in
// bone-white armour over a charcoal frame with safety-orange accents - a low, wide sensor head with a recessed visor band and an
// asymmetric antenna / dish, a deep chest with a crew hatch, heat vents, a back-mounted power pack with radiator fins and two exhaust
// stacks, rounded shoulder blocks carrying six-cell missile pods and floodlights, a beam emitter barrel on the right forearm, an
// armour plate on the left, orange knee caps, wide feet with heel spurs and toe caps. 24 rigid bones in one skinned mesh per level of
// detail (LOD 0 / 1 / 2, one draw call each + shadow; ~40 k / ~7 k / ~1.6 k triangles), a second small unlit mesh for the lamps, glow
// sprites and floodlight pools on the ground at night.
// Animation (procedural, every frame): world-space foot planting - each foot stays where it landed on the terrain (KW.ground: the
// street, or the bed where it wades) and steps to a target ahead of the body (cadence from the speed; idle shuffles when it turns),
// two-bone leg IK with the knee forward, pelvis height from the legs' reach plus a bob and a landing dip, lean / sway / twist, arms
// by two-bone IK (swinging against the legs, guard, punches, grabbing, aiming the beam), head look, finger open / close; heavy
// footfalls shake the camera (the creature mode's calm shake, KG.shakeEv) and throw up dust.
// The mode (window.SGMech; from the creature tab's 方式 AS row: 机甲 Mech, or #mech in the URL, #mech-<species> for another creature):
// the mech drops in at the camera's target (a road nearby), the creature rises (SGKaiju.start({mech:{hp}}): it hunts the mech, the
// army comes in and keeps hindering it). Third-person camera (mouse / drag / right stick; ground- and building-aware). Weapons:
// punches (alternating fists, hit test against SGKaiju.body() spheres), grab (wrench the creature and throw it off balance; next to a
// building: rip a chunk out and carry it, then throw it), the arm beam (hold; overheats), a 12-missile salvo from the shoulder pods
// (homing on the part under the crosshair), a stomp shockwave. The creature takes damage only in this mode (kaiju.js [v48 mech]
// hook: damage, onEvent) and falls when its hit points are gone; its strikes, stomps, sweeps and body hit the mech (shield first, then
// armour). Win / lose card. The mech's feet, legs, body, fists and every miss bring buildings down through the creature mode's own
// destruction (KW.apply / KW.blast: bld.js collapses, debris, dust, fires), throw traffic aside and hit landmarks.
// Sound synthesised on window.SGAudio's context ('fx' bus; nothing when the sound is off) plus its fx() one-shots.
// Lazy: nothing is built until the first game (model, HUD, listeners); the frame hook returns at once while the mode is off.
// Contract: window.SGMech {play(o), stop(), on, status(), input(o), act(name, on), sim(sec, dt), stats(), _}.
// Built from lm50mech/mech/src/*.js by lm50mech/mech/mk.sh (load after lm25/kaiju and lm28/army).
{
const SGMECH_ = (() => {
const PI = Math.PI, TAU = PI*2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a)*t;
const sstep = (a, b, x) => { const t = clamp((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t); };
const wrapA = a => { a = (a + PI) % TAU; if (a < 0) a += TAU; return a - PI; };
function mulb(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; }; }
// the creature mode's internals (lm25/kaiju): world (KW), effects (KFX), game (KG), presentation (KSX); guarded
const KJ = () => window.SGKaiju || null;
const KW_ = () => { const K = KJ(); return K && K._ ? K._.KW : null; };
const KFX_ = () => { const K = KJ(); return K && K._ ? K._.KFX : null; };
const KG_ = () => { const K = KJ(); return K && K._ ? K._.KG : null; };
const gnd = (x, y) => { const W = KW_(); try { return W ? Math.max(-18, W.ground(x, y)) : hC(x, y); } catch (e){ return 0; } };
const wet = (x, y) => { const W = KW_(); try { return W ? W.isWater(x, y) : false; } catch (e){ return false; } };
const night = () => typeof nightF !== 'undefined' ? nightF : 0;

// ---- 10_model.js ----
/* ================= the mech's model: skeleton, a small hard-surface mesh builder, the parts, LODs, lamps =================
   Model space: metres, y up, z forward, x = the mech's LEFT, origin on the ground between the feet (as the creature's model).
   Placed in the world by the group: position (X, ground, -Y), rotation.y = PI - hdg (hdg = compass heading). Rest pose: standing,
   arms hanging. Every bone rests at the identity rotation; geometry is authored in rest model space and bound rigidly (one bone per
   vertex) to a THREE.Skeleton shared by the three LOD meshes and the lamp mesh. */
const MK = (() => {
  // ---- the skeleton: [name, parent, rest x, y, z]
  const BS = [['root', null, 0, 37, 0], ['waist', 'root', 0, 41.5, 0], ['chest', 'waist', 0, 50, 0.5], ['head', 'chest', 0, 62.6, 2.2]];
  for (const [s, n] of [[1, 'L'], [-1, 'R']]){
    BS.push(['clav' + n, 'chest', s*9, 58, 0], ['uarm' + n, 'clav' + n, s*15.5, 57.5, 0], ['farm' + n, 'uarm' + n, s*16.5, 42.5, 0.3], ['hand' + n, 'farm' + n, s*17, 29.8, 0.8],
      ['fing' + n, 'hand' + n, s*17.6, 25.3, 0.9], ['thumb' + n, 'hand' + n, s*16.2, 28.6, 2.6]);
  }
  for (const [s, n] of [[1, 'L'], [-1, 'R']]) BS.push(['thigh' + n, 'root', s*7.5, 35, 0], ['shin' + n, 'thigh' + n, s*8, 20, 0.6], ['foot' + n, 'shin' + n, s*8.5, 5.5, -1], ['toe' + n, 'foot' + n, s*8.5, 2.2, 6.2]);
  const BI = {}; BS.forEach((b, i) => { BI[b[0]] = i; });
  const NB = BS.length, PAR = BS.map(b => b[1] === null ? -1 : BI[b[1]]), REST = BS.map(b => [b[2], b[3], b[4]]);
  const OFF = REST.map((r, i) => PAR[i] < 0 ? r.slice() : [r[0] - REST[PAR[i]][0], r[1] - REST[PAR[i]][1], r[2] - REST[PAR[i]][2]]);
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], len = a => Math.hypot(a[0], a[1], a[2]);
  const L_TH = len(sub(REST[BI.shinL], REST[BI.thighL])), L_SH = len(sub(REST[BI.footL], REST[BI.shinL]));
  const L_UA = len(sub(REST[BI.farmL], REST[BI.uarmL])), L_FA = len(sub(REST[BI.handL], REST[BI.farmL]));
  const ANK = REST[BI.footL][1];          // ankle height above the sole
  // ---- colours (linear-ish sRGB 0-1); lamps
  const C = {WHITE:[0.80, 0.78, 0.72], WHITE2:[0.70, 0.68, 0.62], DARK:[0.13, 0.14, 0.15], GUN:[0.30, 0.31, 0.33], STEEL:[0.52, 0.53, 0.54], ORANGE:[0.90, 0.40, 0.09], GLASS:[0.05, 0.10, 0.12], RUB:[0.07, 0.07, 0.07]};
  const LC = {LAMP:[1.0, 0.96, 0.86], CYAN:[0.55, 0.95, 1.0], AMBER:[1.0, 0.62, 0.18], RED:[1.0, 0.2, 0.14], VENT:[1.0, 0.42, 0.12]};
  // ---------------- the mesh builder ----------------
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _u = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3();
  function mat(x, y, z, rx, ry, rz){ _e.set(rx || 0, ry || 0, rz || 0, 'XYZ'); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(1, 1, 1); return _m.compose(_p, _q, _s).elements.slice(); }
  function matAB(p, q){ _d.set(q[0] - p[0], q[1] - p[1], q[2] - p[2]); const L = _d.length(); _d.normalize(); _q.setFromUnitVectors(_u, _d); _p.set((p[0] + q[0])/2, (p[1] + q[1])/2, (p[2] + q[2])/2); _s.set(1, 1, 1); return {M:_m.compose(_p, _q, _s).elements.slice(), L}; }
  const tp = (e, v) => [e[0]*v[0] + e[4]*v[1] + e[8]*v[2] + e[12], e[1]*v[0] + e[5]*v[1] + e[9]*v[2] + e[13], e[2]*v[0] + e[6]*v[1] + e[10]*v[2] + e[14]];
  const tn = (e, v) => { const x = e[0]*v[0] + e[4]*v[1] + e[8]*v[2], y = e[1]*v[0] + e[5]*v[1] + e[9]*v[2], z = e[2]*v[0] + e[6]*v[1] + e[10]*v[2], l = Math.hypot(x, y, z) || 1; return [x/l, y/l, z/l]; };
  function Bld(seed){ return {p:[], n:[], c:[], s:[], tris:0, rng:mulb(seed)}; }
  // convex faces [{v:[[x,y,z]...], n:[[...]] | null}] -> triangles (outward by the centroid test; flat normals unless given)
  function add(B, faces, e, col, bone, lit){
    let cx = 0, cy = 0, cz = 0, cn = 0; for (const f of faces) for (const v of f.v){ cx += v[0]; cy += v[1]; cz += v[2]; cn++; }
    const Cw = tp(e, [cx/cn, cy/cn, cz/cn]), jit = lit ? 1 : 1 + (B.rng() - 0.5)*0.07;
    for (const f of faces){
      const V = f.v.map(v => tp(e, v)), n = V.length; let nx = 0, ny = 0, nz = 0, fx = 0, fy = 0, fz = 0;
      for (let i = 0; i < n; i++){ const a = V[i], b = V[(i + 1) % n]; nx += (a[1] - b[1])*(a[2] + b[2]); ny += (a[2] - b[2])*(a[0] + b[0]); nz += (a[0] - b[0])*(a[1] + b[1]); fx += a[0]; fy += a[1]; fz += a[2]; }
      const l = Math.hypot(nx, ny, nz); if (l < 1e-9) continue; nx /= l; ny /= l; nz /= l;
      let N = f.n ? f.n.map(q => tn(e, q)) : null;
      if ((fx/n - Cw[0])*nx + (fy/n - Cw[1])*ny + (fz/n - Cw[2])*nz < 0){ V.reverse(); if (N) N.reverse(); nx = -nx; ny = -ny; nz = -nz; }
      for (let i = 1; i + 1 < n; i++) for (const k of [0, i, i + 1]){ const v = V[k]; B.p.push(v[0], v[1], v[2]);
        if (N) B.n.push(N[k][0], N[k][1], N[k][2]); else B.n.push(nx, ny, nz);
        const g = lit ? 1 : (0.74 + 0.26*sstep(0, 24, v[1]))*jit; B.c.push(Math.min(255, col[0]*g*255) | 0, Math.min(255, col[1]*g*255) | 0, Math.min(255, col[2]*g*255) | 0); B.s.push(bone); }
      B.tris += n - 2;
    }
  }
  // shapes (local space)
  function boxF(hx, hy, hz, b, tx, tz, zo){
    tx = tx || 1; tz = tz || 1; zo = zo || 0; b = Math.min(b || 0, hx*0.9, hy*0.9, hz*0.9);
    const T = (x, y, z) => { const f = (y + hy)/(2*hy); return [x*lerp(1, tx, f), y, z*lerp(1, tz, f) + zo*f]; };
    const F = [];
    if (b <= 1e-4){ const c = (sx, sy, sz) => T(sx*hx, sy*hy, sz*hz);
      for (const s of [-1, 1]){ F.push({v:[c(s, -1, -1), c(s, 1, -1), c(s, 1, 1), c(s, -1, 1)]}, {v:[c(-1, s, -1), c(1, s, -1), c(1, s, 1), c(-1, s, 1)]}, {v:[c(-1, -1, s), c(1, -1, s), c(1, 1, s), c(-1, 1, s)]}); }
      return F; }
    const V = (sx, sy, sz, a) => a === 0 ? T(sx*hx, sy*(hy - b), sz*(hz - b)) : a === 1 ? T(sx*(hx - b), sy*hy, sz*(hz - b)) : T(sx*(hx - b), sy*(hy - b), sz*hz);
    for (const s of [-1, 1]){
      F.push({v:[V(s, -1, -1, 0), V(s, 1, -1, 0), V(s, 1, 1, 0), V(s, -1, 1, 0)]}, {v:[V(-1, s, -1, 1), V(1, s, -1, 1), V(1, s, 1, 1), V(-1, s, 1, 1)]}, {v:[V(-1, -1, s, 2), V(1, -1, s, 2), V(1, 1, s, 2), V(-1, 1, s, 2)]});
    }
    // edges: along z (x/y signs), along y (x/z signs), along x (y/z signs)
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) F.push({v:[V(sx, sy, -1, 0), V(sx, sy, 1, 0), V(sx, sy, 1, 1), V(sx, sy, -1, 1)]});
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) F.push({v:[V(sx, -1, sz, 0), V(sx, 1, sz, 0), V(sx, 1, sz, 2), V(sx, -1, sz, 2)]});
    for (const sy of [-1, 1]) for (const sz of [-1, 1]) F.push({v:[V(-1, sy, sz, 1), V(1, sy, sz, 1), V(1, sy, sz, 2), V(-1, sy, sz, 2)]});
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) F.push({v:[V(sx, sy, sz, 0), V(sx, sy, sz, 1), V(sx, sy, sz, 2)]});
    return F;
  }
  function cylF(r0, r1, h, seg, smooth, caps){
    const F = [], sl = (r0 - r1)/h, P = (r, y, a) => [Math.cos(a)*r, y, Math.sin(a)*r], Nn = a => { const l = Math.hypot(1, sl); return [Math.cos(a)/l, sl/l, Math.sin(a)/l]; };
    const bot = [], top = [];
    for (let i = 0; i < seg; i++){ const a0 = i/seg*TAU, a1 = (i + 1)/seg*TAU;
      F.push({v:[P(r0, -h/2, a0), P(r0, -h/2, a1), P(r1, h/2, a1), P(r1, h/2, a0)], n:smooth ? [Nn(a0), Nn(a1), Nn(a1), Nn(a0)] : null});
      bot.push(P(r0, -h/2, a0)); top.push(P(r1, h/2, a0)); }
    if (caps !== false){ if (r0 > 1e-3) F.push({v:bot}); if (r1 > 1e-3) F.push({v:top}); }
    return F;
  }
  function sphF(r, seg){
    const F = [], rs = Math.max(3, seg >> 1), P = (i, j) => { const th = j/rs*PI, ph = i/seg*TAU; return [Math.sin(th)*Math.cos(ph), Math.cos(th), Math.sin(th)*Math.sin(ph)]; };
    for (let j = 0; j < rs; j++) for (let i = 0; i < seg; i++){
      const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1), sc = v => [v[0]*r, v[1]*r, v[2]*r];
      if (j === 0) F.push({v:[sc(a), sc(c), sc(d)], n:[a, c, d]}); else if (j === rs - 1) F.push({v:[sc(a), sc(b), sc(c)], n:[a, b, c]}); else F.push({v:[sc(a), sc(b), sc(c), sc(d)], n:[a, b, c, d]}); }
    return F;
  }
  // ---------------- the parts ----------------
  // L: level of detail 0 (full) / 1 / 2. Returns {B (body), LB (lamps), lamps: [{bone, p:[x,y,z], col, s}] (glow sprites, rest space)}
  function parts(L){
    const B = Bld(7), LB = Bld(9), lamps = [];
    const sg = n => L === 0 ? n : L === 1 ? Math.max(6, Math.round(n*0.5)) : Math.max(5, Math.round(n*0.3));
    const bv = b => L === 2 ? 0 : b;
    const box = (bn, col, x, y, z, hx, hy, hz, o, T) => { o = o || {}; add(T || B, boxF(hx, hy, hz, bv(o.b || 0), o.tx, o.tz, o.zo), mat(x, y, z, o.rx, o.ry, o.rz), col, BI[bn], T === LB); };
    const cyl = (bn, col, x, y, z, r0, r1, h, seg, o, T) => { o = o || {}; add(T || B, cylF(r0, r1, h, sg(seg), !!o.sm, o.caps), mat(x, y, z, o.rx, o.ry, o.rz), col, BI[bn], T === LB); };
    const cab = (bn, col, p, q, r0, r1, seg, sm) => { const m = matAB(p, q); add(B, cylF(r0, r1, m.L, sg(seg), !!sm), m.M, col, BI[bn]); };
    const sph = (bn, col, x, y, z, r, seg) => add(B, sphF(r, sg(seg)), mat(x, y, z), col, BI[bn]);
    const lamp = (bn, col, x, y, z, hx, hy, hz, s, o) => { box(bn, col, x, y, z, hx, hy, hz, o, LB); lamps.push({bone:BI[bn], p:[x, y, z], col, s:s || 4}); };
    const D0 = L === 0, D1 = L <= 1;
    const rivets = (bn, pts, ax) => { if (!D0) return; for (const p of pts) cyl(bn, C.STEEL, p[0], p[1], p[2], 0.22, 0.22, 0.3, 6, ax === 'x' ? {rz:PI/2} : ax === 'y' ? {} : {rx:PI/2}); };
    // ===== pelvis (root) and waist
    box('root', C.GUN, 0, 36.6, 0, 7.4, 3.0, 5.4, {b:1.0});
    box('root', C.WHITE, 0, 34.6, 4.7, 3.2, 3.4, 1.3, {b:0.5, tx:1.3});
    for (const s of [1, -1]){ box('root', C.WHITE, s*5.2, 35.2, 5.5, 2.4, 3.2, 0.7, {b:0.35, rx:-0.14}); if (D1) box('root', C.ORANGE, s*5.2, 37.6, 6.05, 2.0, 0.28, 0.12, {rx:-0.14}); }
    box('root', C.WHITE2, 0, 36.2, -5.7, 5.6, 2.8, 0.9, {b:0.4, rx:0.12});
    if (D0) for (let i = 0; i < 4; i++) box('root', C.DARK, -3 + i*2, 33.4, -5.2, 0.35, 0.8, 0.5);
    cyl('waist', C.GUN, 0, 40.6, 0, 5.3, 5.7, 4.6, 28, {sm:true});
    if (D1) for (const y of [39.0, 42.3]) cyl('waist', C.DARK, 0, y, 0, 5.95, 5.95, 0.5, 20, {sm:true});
    for (let i = 0; i < 3; i++) box('waist', C.WHITE, 0, 39.0 + i*1.75, 5.2 - i*0.05, 3.4 - i*0.2, 0.75, 0.9, {b:0.3});
    if (D0) for (const s of [1, -1]){ cab('waist', C.STEEL, [s*4.2, 38.0, 3.2], [s*4.6, 44.5, 3.4], 0.35, 0.35, 8); cab('waist', C.DARK, [s*4.2, 38.0, 3.2], [s*4.35, 41.0, 3.3], 0.6, 0.6, 8); cab('waist', C.STEEL, [s*4.0, 38.2, -3.6], [s*4.4, 44.5, -3.8], 0.35, 0.35, 8); }
    // ===== chest
    box('chest', C.WHITE, 0, 51.2, -0.2, 10.4, 6.4, 6.8, {b:1.4, tx:1.14, zo:0.6});
    box('chest', C.GUN, 0, 45.3, 0.2, 8.7, 1.5, 6.0, {b:0.6});
    box('chest', C.WHITE, 0, 51.6, 6.4, 8.2, 5.0, 1.3, {b:0.6, tx:1.1, rx:-0.12});
    box('chest', C.WHITE2, 0, 50.0, 7.5, 1.0, 3.6, 0.5, {b:0.2, rx:-0.12});
    for (const s of [1, -1]){ box('chest', C.ORANGE, s*7.3, 55.4, 6.75, 1.5, 0.22, 0.14, {rz:s*0.5, rx:-0.12}); box('chest', C.ORANGE, s*8.1, 54.5, 6.85, 1.2, 0.22, 0.14, {rz:s*0.5, rx:-0.12}); }
    box('chest', C.DARK, 0, 53.7, 7.75, 3.6, 1.9, 0.45, {b:0.3, rx:-0.12});
    lamp('chest', LC.CYAN, 0, 54.25, 8.2, 2.7, 0.32, 0.1, 3, {rx:-0.12});
    if (D0) for (const x of [-3.0, 3.0]) for (const y of [52.2, 55.2]) cyl('chest', C.STEEL, x, y, 8.15, 0.3, 0.3, 0.35, 8, {rx:PI/2 - 0.12});
    // heat vents (grilles; glow at night)
    for (const s of [1, -1]){
      box('chest', C.DARK, s*7.9, 48.6, 6.35, 1.9, 2.8, 0.5, {b:0.2, rx:-0.1});
      lamp('chest', LC.VENT, s*7.9, 48.6, 6.55, 1.5, 2.4, 0.08, 0, {rx:-0.1});
      if (D1) for (let i = 0; i < (D0 ? 6 : 3); i++){ const n = D0 ? 6 : 3; box('chest', C.GUN, s*7.9, 46.4 + (i + 0.5)*4.4/n, 6.85 - (i/n)*0.4, 1.8, 0.16, 0.25, {rx:-0.55}); }
      // chest floodlights
      box('chest', C.DARK, s*7.0, 55.9, 7.0, 1.2, 0.8, 0.6, {b:0.2});
      lamp('chest', LC.LAMP, s*7.0, 55.9, 7.62, 0.95, 0.55, 0.06, 5);
    }
    // collar, shoulder sockets
    cyl('chest', C.GUN, 0, 58.2, 0.6, 4.3, 3.9, 1.8, 18, {sm:true});
    box('chest', C.WHITE, 0, 58.6, 4.3, 5.0, 1.5, 1.2, {b:0.5, rx:-0.2});
    for (const s of [1, -1]){ box('chest', C.WHITE, s*5.7, 59.2, 1.0, 1.0, 2.2, 3.5, {b:0.4, rz:-s*0.12}); cyl('chest', C.GUN, s*12.4, 57.5, 0, 3.4, 3.4, 3.2, 24, {rz:PI/2, sm:true}); }
    // power pack with radiator fins and two exhaust stacks
    box('chest', C.GUN, 0, 52.2, -8.4, 7.4, 6.4, 2.4, {b:0.8});
    box('chest', C.WHITE2, 0, 57.0, -6.4, 6.0, 1.8, 2.0, {b:0.5});
    if (D1) for (let i = 0; i < (D0 ? 9 : 4); i++){ const n = D0 ? 9 : 4; box('chest', C.DARK, -6 + (i + 0.5)*12/n, 51.6, -11.2, 0.22, 4.6, 0.85); }
    for (const s of [1, -1]){ cyl('chest', C.GUN, s*4.6, 57.8, -9.3, 1.9, 1.7, 3.0, 12); cyl('chest', C.STEEL, s*4.6, 62.6, -9.6, 1.05, 1.0, 7.6, 14, {sm:true}); if (D1) cyl('chest', C.DARK, s*4.6, 66.5, -9.6, 1.25, 1.25, 0.45, 14); if (D0) box('chest', C.DARK, s*4.6, 66.95, -9.95, 0.9, 0.08, 0.75, {rx:-0.4}); }
    lamp('chest', LC.AMBER, 0, 59.2, -10.6, 0.55, 0.45, 0.4, 4);
    if (D0){ const pts = []; for (const x of [-8.6, -4.3, 0, 4.3, 8.6]) pts.push([x, 56.4, 6.85]); for (const x of [-7.6, 7.6]) for (const y of [47.0, 50.0, 53.0]) pts.push([x*0.94, y, 7.5 - (y - 47)*0.12]); rivets('chest', pts, 'z');
      for (const s of [1, -1]) box('chest', C.DARK, s*10.6, 51.2, 0, 0.08, 4.8, 5.4); box('chest', C.DARK, 0, 46.9, 6.95, 7.0, 0.1, 0.12); }
    // ===== head
    cyl('head', C.DARK, 0, 61.4, 1.6, 1.9, 1.9, 2.6, 12);
    box('head', C.WHITE, 0, 64.4, 2.4, 3.6, 2.2, 3.4, {b:0.6, tx:0.86, tz:0.9, zo:-0.4});
    box('head', C.DARK, 0, 64.6, 5.65, 3.05, 0.92, 0.4, {b:0.15});
    box('head', C.GLASS, 0, 64.6, 5.95, 2.8, 0.62, 0.16);
    for (const x of [-1.7, 0, 1.7]) lamp('head', LC.CYAN, x, 64.6, 6.12, x ? 0.42 : 0.6, 0.28, 0.06, x ? 3 : 4);
    box('head', C.GUN, 0, 62.9, 5.2, 2.6, 0.7, 0.9, {b:0.25, tx:0.8});
    box('head', C.WHITE2, 0, 65.85, 5.2, 3.3, 0.45, 1.0, {b:0.2});
    cyl('head', C.GUN, 0, 66.75, 0.9, 1.4, 1.2, 0.55, 12);
    for (const s of [1, -1]){ cyl('head', C.GUN, s*3.75, 64.2, 2.2, 1.1, 1.1, 1.2, 12, {rz:PI/2}); lamp('head', LC.AMBER, s*4.38, 64.2, 2.2, 0.06, 0.3, 0.3, 2); }
    cyl('head', C.DARK, 2.8, 68.6, 0.0, 0.12, 0.08, 4.6, 4); if (D1) cyl('head', C.DARK, 3.3, 67.7, -0.6, 0.1, 0.07, 3.0, 4);
    if (D1){ cyl('head', C.DARK, -3.6, 66.6, 1.0, 0.18, 0.18, 1.6, 6); cyl('head', C.GUN, -3.9, 67.6, 1.3, 0.2, 1.5, 0.55, 14, {rx:-0.6, rz:0.35}); }
    // ===== arms (s = +1 left, -1 right)
    for (const [s, n] of [[1, 'L'], [-1, 'R']]){
      const cl = 'clav' + n, ua = 'uarm' + n, fa = 'farm' + n, ha = 'hand' + n, fi = 'fing' + n, th = 'thumb' + n;
      // shoulder block with the missile pod and a floodlight
      box(cl, C.WHITE, s*16.4, 61.0, 0, 4.8, 3.3, 5.5, {b:1.2, tx:0.84, tz:0.86, rz:s*0.1});
      box(cl, C.WHITE2, s*20.9, 58.4, 0, 0.9, 3.7, 5.0, {b:0.4, rz:s*0.22});
      if (D1) for (const z of [-2.2, 2.2]) box(cl, C.ORANGE, s*16.4, 64.32, z, 3.9, 0.08, 0.45, {rz:s*0.1});
      box(cl, C.GUN, s*15.2, 65.4, -2.0, 3.0, 1.6, 3.2, {b:0.4});
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) cyl(cl, C.DARK, s*15.2 + (j - 0.5)*2.6, 67.05, -2.0 + (i - 1)*2.05, 0.82, 0.82, 0.3, 6);
      lamp(cl, LC.RED, s*17.9, 65.9, 1.0, 0.18, 0.18, 0.18, 1.5);
      box(cl, C.DARK, s*17.3, 59.3, 5.7, 1.3, 0.9, 0.6, {b:0.2});
      lamp(cl, LC.LAMP, s*17.3, 59.3, 6.32, 1.0, 0.62, 0.06, 6);
      if (D0) rivets(cl, [[s*13.0, 63.0, 4.7], [s*16.4, 63.4, 4.65], [s*19.6, 62.6, 4.4]], 'z');
      // upper arm
      sph(ua, C.GUN, s*15.5, 57.5, 0, 3.3, 22);
      box(ua, C.GUN, s*16.0, 50.0, 0, 2.6, 6.0, 2.7, {b:0.5});
      box(ua, C.WHITE, s*16.3, 50.8, 0.5, 3.0, 4.6, 3.2, {b:0.9, tx:1.12, tz:1.08});
      if (D0){ cab(ua, C.STEEL, [s*16.0, 54.5, -3.0], [s*16.4, 44.5, -2.6], 0.4, 0.4, 8); cab(ua, C.DARK, [s*16.0, 54.5, -3.0], [s*16.2, 49.5, -2.8], 0.7, 0.7, 8); }
      cyl(ua, C.GUN, s*16.5, 42.5, 0.3, 2.6, 2.6, 5.4, 24, {rz:PI/2, sm:true});
      if (D0) for (const sx of [1, -1]) cyl(ua, C.STEEL, s*16.5 + sx*2.75, 42.5, 0.3, 1.0, 1.0, 0.3, 6, {rz:PI/2});
      // forearm (gauntlet: wider at the wrist)
      box(fa, C.WHITE2, s*16.5, 43.0, -2.6, 2.4, 2.3, 0.7, {b:0.3});
      box(fa, C.WHITE, s*16.8, 35.8, 0.6, 3.3, 6.0, 3.5, {b:0.9, tx:0.84, tz:0.88});
      box(fa, C.GUN, s*16.8, 30.6, 0.8, 3.65, 0.7, 3.85, {b:0.25});
      if (D1) box(fa, C.ORANGE, s*16.8, 33.6, 4.2, 2.2, 0.28, 0.12);
      if (D0){ cab(fa, C.STEEL, [s*14.0, 41.0, 2.2], [s*14.1, 32.0, 2.6], 0.42, 0.42, 8); cab(fa, C.DARK, [s*14.0, 41.0, 2.2], [s*14.05, 36.5, 2.4], 0.75, 0.75, 8); }
      if (s < 0){
        // the beam emitter (right forearm): barrel, coils, muzzle; glow strips
        cyl(fa, C.DARK, s*16.8, 34.6, 4.75, 1.3, 1.3, 9.0, 16, {sm:true});
        for (let i = 0; i < (D0 ? 4 : D1 ? 2 : 0); i++) cyl(fa, C.GUN, s*16.8, 37.6 - i*(D0 ? 2.0 : 4.0), 4.75, 1.65, 1.65, 0.55, 16);
        cyl(fa, C.STEEL, s*16.8, 29.7, 4.75, 1.15, 1.5, 1.2, 16);
        lamp(fa, LC.CYAN, s*16.8, 29.05, 4.75, 0.75, 0.08, 0.75, 5);
        lamp(fa, LC.CYAN, s*16.8, 35.0, 6.08, 0.14, 3.0, 0.06, 0);
        box(fa, C.GUN, s*16.8, 39.6, 3.4, 1.5, 1.0, 1.4, {b:0.2});
      } else {
        // the armour plate (left forearm) with marker lamps
        box(fa, C.WHITE2, s*20.6, 36.4, 0.6, 0.7, 7.2, 4.5, {b:0.4});
        if (D1) box(fa, C.ORANGE, s*21.32, 36.4, 4.75, 0.08, 6.6, 0.3);
        lamp(fa, LC.AMBER, s*21.36, 42.0, 3.6, 0.06, 0.32, 0.32, 2); lamp(fa, LC.AMBER, s*21.36, 31.0, 3.6, 0.06, 0.32, 0.32, 2);
      }
      // hand: palm, back plate, the finger block (a closed fist; opens for a grab), thumb
      box(ha, C.GUN, s*17.0, 27.6, 0.9, 2.9, 2.3, 2.5, {b:0.5});
      box(ha, C.WHITE2, s*19.85, 27.8, 0.9, 0.5, 2.1, 2.4, {b:0.2});
      box(fi, C.GUN, s*15.9, 25.0, 0.9, 1.7, 1.8, 2.45, {b:0.45});
      if (D1) for (const z of [-0.75, 0.9, 2.55]) box(fi, C.DARK, s*15.15, 25.0, z, 0.95, 1.85, 0.12);
      if (D0) for (const z of [-0.75, 0.9, 2.55]) box(fi, C.STEEL, s*17.1, 23.35, z, 0.55, 0.3, 0.55, {b:0.1});
      box(th, C.GUN, s*15.7, 27.5, 3.0, 0.75, 1.6, 0.75, {b:0.2, rz:-s*0.3});
    }
    // ===== legs
    for (const [s, n] of [[1, 'L'], [-1, 'R']]){
      const tg = 'thigh' + n, sh = 'shin' + n, ft = 'foot' + n, to = 'toe' + n;
      sph(tg, C.GUN, s*7.5, 35, 0, 3.3, 22);
      box(tg, C.GUN, s*7.8, 28.0, 0.2, 3.3, 6.4, 3.5, {b:0.7, tx:1.1, tz:1.08});
      box(tg, C.WHITE, s*7.9, 28.6, 2.4, 3.5, 5.4, 1.9, {b:0.8, tx:1.08});
      box(tg, C.WHITE2, s*11.4, 29.4, 0.3, 0.8, 4.8, 3.3, {b:0.3});
      if (D1) box(tg, C.ORANGE, s*12.22, 29.4, 0.3, 0.08, 3.8, 0.4);
      box(tg, C.WHITE, s*11.7, 35.4, 0, 1.1, 2.9, 4.0, {b:0.4, rz:s*0.1});
      if (D0){ cab(tg, C.STEEL, [s*7.4, 33.0, -3.2], [s*7.9, 22.0, -2.6], 0.5, 0.5, 8); cab(tg, C.DARK, [s*7.4, 33.0, -3.2], [s*7.6, 28.0, -2.9], 0.85, 0.85, 8); rivets(tg, [[s*6.0, 33.0, 4.0], [s*9.8, 33.0, 4.0], [s*6.2, 24.5, 4.1], [s*9.6, 24.5, 4.1]], 'z'); }
      cyl(sh, C.GUN, s*8.0, 20.0, 0.6, 2.7, 2.7, 6.3, 24, {rz:PI/2, sm:true});
      if (D0) for (const sx of [1, -1]) cyl(sh, C.STEEL, s*8.0 + sx*3.2, 20.0, 0.6, 1.1, 1.1, 0.3, 6, {rz:PI/2});
      box(sh, C.ORANGE, s*8.0, 21.0, 3.6, 3.0, 2.7, 1.4, {b:0.7, tx:0.8});
      box(sh, C.GUN, s*8.3, 13.0, -0.2, 3.3, 6.9, 3.4, {b:0.7, tx:0.95});
      box(sh, C.WHITE, s*8.3, 13.6, 2.55, 3.5, 5.9, 1.5, {b:0.6, tx:1.08});
      box(sh, C.WHITE2, s*8.3, 14.6, -3.4, 2.8, 4.4, 1.5, {b:0.6, tx:1.1});
      for (const dx of [1.4, -1.4]){ cab(sh, C.STEEL, [s*8.3 + dx, 18.5, -2.4], [s*8.4 + dx, 8.2, -3.2], 0.55, 0.55, 8); if (D1) cab(sh, C.DARK, [s*8.3 + dx, 18.5, -2.4], [s*8.35 + dx, 13.0, -2.8], 0.85, 0.85, 8); }
      lamp(sh, LC.AMBER, s*8.3, 17.6, 4.12, 0.5, 0.22, 0.06, 2);
      if (D0) rivets(sh, [[s*6.0, 18.8, 4.05], [s*10.6, 18.8, 4.05], [s*6.2, 8.4, 3.9], [s*10.4, 8.4, 3.9]], 'z');
      // ankle, foot, toe
      cyl(ft, C.DARK, s*8.5, 5.5, -1, 2.3, 2.3, 5.2, 14, {rz:PI/2, sm:true});
      for (const dx of [3.05, -3.05]) box(ft, C.WHITE2, s*8.5 + dx, 6.0, -1, 0.55, 2.2, 2.6, {b:0.25});
      box(ft, C.WHITE, s*8.5, 2.6, 0.0, 4.4, 2.2, 5.6, {b:0.7, tx:0.78, tz:0.82, zo:-0.6});
      box(ft, C.RUB, s*8.5, 0.4, 0.2, 4.7, 0.4, 6.0, {b:0.15});
      box(ft, C.GUN, s*8.5, 1.6, -6.3, 2.6, 1.6, 1.4, {b:0.4, tz:0.7});
      box(to, C.WHITE2, s*8.5, 1.65, 8.3, 4.3, 1.55, 2.1, {b:0.5, tx:0.86, tz:0.8, zo:-0.4});
      if (D1) box(to, C.ORANGE, s*8.5, 3.18, 7.7, 3.4, 0.08, 0.45);
      box(to, C.RUB, s*8.5, 0.4, 8.4, 4.5, 0.4, 2.3, {b:0.12});
      if (D0) for (const dx of [-2.6, 0, 2.6]) box(to, C.DARK, s*8.5 + dx, 1.0, 10.45, 0.7, 0.6, 0.25, {b:0.1});
    }
    // ===== detail pass (LOD 0, some LOD 1): panel grooves, bolt rows and rings, hoses, pipes, handles, louvres
    if (D1){
      const groove = (bn, x, y, z, hx, hy, hz, o) => box(bn, C.DARK, x, y, z, hx, hy, hz, o);
      const row = (bn, p0, p1, n, ax) => { const pts = []; for (let i = 0; i < n; i++){ const t = n > 1 ? i/(n - 1) : 0.5; pts.push([lerp(p0[0], p1[0], t), lerp(p0[1], p1[1], t), lerp(p0[2], p1[2], t)]); } rivets(bn, pts, ax); };
      const ring = (bn, c, r, n, ax) => { const pts = []; for (let i = 0; i < n; i++){ const a = i/n*TAU; pts.push(ax === 'x' ? [c[0], c[1] + Math.cos(a)*r, c[2] + Math.sin(a)*r] : ax === 'y' ? [c[0] + Math.cos(a)*r, c[1], c[2] + Math.sin(a)*r] : [c[0] + Math.cos(a)*r, c[1] + Math.sin(a)*r, c[2]]); } rivets(bn, pts, ax); };
      const hose = (bn, p, q, sag, r, n) => { if (!D0) return; n = n || 6; let prev = p; for (let i = 1; i <= n; i++){ const t = i/n, m = [lerp(p[0], q[0], t) + sag[0]*4*t*(1 - t), lerp(p[1], q[1], t) + sag[1]*4*t*(1 - t), lerp(p[2], q[2], t) + sag[2]*4*t*(1 - t)]; cab(bn, C.RUB, prev, m, r, r, 6); prev = m; } };
      // chest: grooves across the plate, side seams, louvres on the pack, pipes to the stacks, handles, a small mast
      for (const y of [48.2, 53.0]) groove('chest', 0, y, 7.95 - (y - 51.6)*0.12, 7.6, 0.09, 0.1, {rx:-0.12});
      for (const s of [1, -1]){ groove('chest', s*4.2, 50.6, 7.85, 0.09, 4.2, 0.1, {rx:-0.12}); groove('chest', s*11.5, 54.5, 2.0, 0.1, 2.4, 3.2, {rz:-s*0.14}); }
      if (D0){
        for (const s of [1, -1]){ for (let i = 0; i < 5; i++) box('chest', C.DARK, s*7.45, 49.0 + i*1.3, -8.4, 0.12, 0.35, 1.8, {rz:s*0.6});
          cab('chest', C.STEEL, [s*2.2, 57.4, -10.2], [s*4.0, 58.9, -9.6], 0.45, 0.45, 8); cab('chest', C.STEEL, [s*6.2, 47.0, -10.6], [s*6.2, 56.5, -10.6], 0.35, 0.35, 8);
          cab('chest', C.GUN, [s*9.6, 46.6, 3.8], [s*9.6, 46.6, 6.0], 0.22, 0.22, 6); cab('chest', C.GUN, [s*9.6, 46.6, 6.0], [s*9.6, 49.0, 6.0], 0.22, 0.22, 6); cab('chest', C.GUN, [s*9.6, 49.0, 6.0], [s*9.6, 49.0, 3.8], 0.22, 0.22, 6);
          hose('chest', [s*3.0, 45.5, -6.4], [s*5.6, 57.2, -8.3], [s*1.5, 0, -1.2], 0.38, 7); }
        row('chest', [-7.2, 57.2, 6.9], [7.2, 57.2, 6.9], 9, 'z'); row('chest', [-6.8, 45.9, 6.5], [6.8, 45.9, 6.5], 9, 'z');
        row('chest', [-6.4, 58.0, -10.85], [6.4, 58.0, -10.85], 8, 'z'); row('chest', [-6.4, 46.0, -10.85], [6.4, 46.0, -10.85], 8, 'z');
        cyl('chest', C.DARK, -6.6, 61.5, -9.8, 0.1, 0.06, 6.5, 4); cyl('chest', C.GUN, -6.6, 58.6, -9.8, 0.45, 0.45, 0.9, 8);
        // waist: bolt ring, belt plates
        ring('waist', [0, 42.6, 0], 5.9, 16, 'y'); for (const s of [1, -1]) box('waist', C.WHITE2, s*5.6, 40.4, 0, 0.6, 1.8, 2.4, {b:0.2});
        row('root', [-6.2, 38.9, 5.45], [6.2, 38.9, 5.45], 7, 'z'); row('root', [-4.5, 36.3, -6.65], [4.5, 36.3, -6.65], 5, 'z');
        // head: brow bolts, vents on the cheeks
        row('head', [-2.6, 66.35, 5.9], [2.6, 66.35, 5.9], 5, 'z'); for (const s of [1, -1]) for (let i = 0; i < 3; i++) box('head', C.DARK, s*3.15, 63.5 + i*0.55, 4.2, 0.1, 0.12, 1.2, {rz:-s*0.14});
      }
      for (const [s, n] of [[1, 'L'], [-1, 'R']]){
        const cl = 'clav' + n, ua = 'uarm' + n, fa = 'farm' + n, ha = 'hand' + n, tg = 'thigh' + n, sh = 'shin' + n, ft = 'foot' + n, to = 'toe' + n;
        // shoulder block: seams, a vent, the pod's hatch rails
        groove(cl, s*16.4, 61.2, 5.0, 4.0, 0.09, 0.1, {rz:s*0.1}); groove(cl, s*12.2, 61.0, 0, 0.1, 2.6, 4.6);
        if (D0){ for (let i = 0; i < 4; i++) box(cl, C.DARK, s*19.4, 60.3 - i*0.8, -3.6, 0.6, 0.12, 1.4, {rz:s*0.22});
          for (const x of [-1.9, 1.9]) box(cl, C.STEEL, s*15.2 + x, 67.15, -2.0, 0.12, 0.08, 3.1); row(cl, [s*12.6, 63.1, -3.4], [s*12.6, 63.1, 3.4], 4, 'x');
          ring(cl, [s*12.4 - s*1.7, 57.5, 0], 2.7, 10, 'x'); }
        // upper arm: seams, elbow hoses, the elbow's bolt circles
        groove(ua, s*16.3, 51.0, 3.85, 2.6, 0.09, 0.1); groove(ua, s*19.45, 51.0, 0.5, 0.1, 4.0, 2.6);
        if (D0){ ring(ua, [s*16.5 + s*2.8, 42.5, 0.3], 1.8, 8, 'x'); ring(ua, [s*16.5 - s*2.8, 42.5, 0.3], 1.8, 8, 'x');
          hose(ua, [s*14.2, 46.0, -2.4], [s*14.6, 39.0, -1.6], [-s*0.6, -0.6, -2.2], 0.32, 6); row(ua, [s*13.6, 54.6, 3.6], [s*19.0, 54.6, 3.6], 4, 'z'); }
        // forearm: seams, wrist ring, knuckle studs
        groove(fa, s*16.8, 36.0, 4.05, 2.7, 0.09, 0.1); groove(fa, s*16.8, 38.5, 3.9, 0.09, 2.2, 0.1);
        if (D0){ ring(fa, [s*16.9, 31.3, 0.8], 3.9, 12, 'y'); row(fa, [s*14.0, 40.6, 3.6], [s*19.6, 40.6, 3.6], 4, 'z'); hose(fa, [s*19.0, 41.0, -1.8], [s*19.6, 31.4, -1.2], [s*1.0, 0, -0.8], 0.3, 6);
          for (const z of [-0.75, 0.9, 2.55]) cyl('fing' + n, C.STEEL, s*14.25, 25.3, z, 0.35, 0.35, 0.3, 6, {rz:PI/2}); row(ha, [s*20.4, 26.6, -0.6], [s*20.4, 26.6, 2.4], 3, 'x'); }
        // thigh: seams, the hip's bolt ring, knee hoses
        groove(tg, s*7.9, 28.6, 4.35, 3.0, 0.09, 0.1); groove(tg, s*7.9, 31.4, 4.3, 0.09, 2.4, 0.1); groove(tg, s*12.25, 29.4, -2.0, 0.1, 4.2, 0.08);
        if (D0){ hose(tg, [s*5.2, 24.0, -3.0], [s*5.4, 17.0, -2.6], [-s*0.8, -0.2, -1.6], 0.36, 6); hose(tg, [s*10.8, 24.0, -2.6], [s*10.9, 17.0, -2.4], [s*0.8, -0.2, -1.6], 0.36, 6);
          ring(sh, [s*8.0 + s*3.2, 20.0, 0.6], 2.0, 8, 'x'); ring(sh, [s*8.0 - s*3.2, 20.0, 0.6], 2.0, 8, 'x'); }
        // shin: side plates, seams, ankle pistons; foot: side panels, toe claws, heel bolts
        box(sh, C.WHITE2, s*11.85, 12.0, -0.4, 0.45, 4.6, 2.6, {b:0.2}); box(sh, C.WHITE2, s*4.75, 12.0, -0.4, 0.45, 4.6, 2.6, {b:0.2});
        groove(sh, s*8.3, 15.4, 4.1, 3.1, 0.09, 0.1); groove(sh, s*8.3, 11.0, 4.05, 0.09, 3.2, 0.1);
        if (D0){ row(sh, [s*12.35, 15.5, -2.4], [s*12.35, 8.5, -2.4], 4, 'x'); row(sh, [s*4.25, 15.5, -2.4], [s*4.25, 8.5, -2.4], 4, 'x');
          for (const dx of [2.2, -2.2]){ cab(sh, C.STEEL, [s*8.3 + dx, 9.5, 3.4], [s*8.4 + dx, 6.6, 2.4], 0.4, 0.4, 8); cab(sh, C.DARK, [s*8.3 + dx, 9.5, 3.4], [s*8.35 + dx, 8.3, 3.0], 0.6, 0.6, 8); }
          for (const sx of [1, -1]) box(ft, C.WHITE2, s*8.5 + sx*4.05, 2.4, 0.6, 0.35, 1.4, 3.6, {b:0.15}); row(ft, [s*8.5 - 2.0, 1.6, -7.75], [s*8.5 + 2.0, 1.6, -7.75], 3, 'z');
          for (const dx of [-2.6, 0, 2.6]) box(to, C.GUN, s*8.5 + dx, 0.9, 11.0, 0.55, 0.45, 0.6, {b:0.15, tz:0.5}); groove(to, s*8.5, 2.2, 10.3, 3.2, 0.08, 0.1, {rx:-0.6}); }
      }
    }
    return {B, LB, lamps};
  }
  // ---------------- the THREE objects ----------------
  function geo(B, smoothSkin){
    const n = B.s.length, g = new THREE.BufferGeometry(), si = new Uint8Array(n*4), sw = new Uint8Array(n*4);
    for (let i = 0; i < n; i++){ si[i*4] = B.s[i]; sw[i*4] = 255; }
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(B.p), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(B.n), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Uint8Array(B.c), 3, true));
    g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4, true));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 36, 0), 62); g.boundingBox = new THREE.Box3(new THREE.Vector3(-40, -10, -40), new THREE.Vector3(40, 80, 40));
    void smoothSkin; return g;
  }
  const GLOW_VS = 'attribute vec3 col; attribute float sz; uniform float uK; uniform float uScale; varying vec3 vC; void main(){ vC = col; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = clamp(sz * uK * uScale / max(1.0, -mv.z), 0.0, 96.0); gl_Position = projectionMatrix * mv; }';
  const GLOW_FS = 'uniform float uA; varying vec3 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; float a = pow(max(0.0, 1.0 - r), 2.2); gl_FragColor = vec4(vC * a * uA, a * uA); }';
  const POOL_VS = 'varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  const POOL_FS = 'uniform float uA; varying vec2 vP; void main(){ vec2 q = vec2(vP.x * 1.4, vP.y); float r = length(q); float a = (1.0 - smoothstep(0.15, 1.0, r)) * uA; gl_FragColor = vec4(vec3(1.0, 0.93, 0.8) * a, a); }';
  let MOD = null;
  function build(){
    if (MOD) return MOD;
    const t0 = performance.now(), root = new THREE.Group(); root.name = 'sgmech'; root.visible = false;
    const bones = BS.map((b, i) => { const o = new THREE.Bone(); o.name = 'mech_' + b[0]; o.position.set(OFF[i][0], OFF[i][1], OFF[i][2]); return o; });
    BS.forEach((b, i) => { if (PAR[i] >= 0) bones[PAR[i]].add(bones[i]); });
    root.add(bones[0]); root.updateMatrixWorld(true);
    const skel = new THREE.Skeleton(bones);
    const mat = new THREE.MeshLambertMaterial({vertexColors:true, skinning:true});
    const matL = new THREE.MeshBasicMaterial({vertexColors:true, skinning:true, color:0xffffff});
    const lods = [], tris = [];
    let lampsRest = null, litMesh = null;
    for (let L = 0; L < 3; L++){
      const P = parts(L), m = new THREE.SkinnedMesh(geo(P.B), mat); m.name = 'mech_lod' + L; m.castShadow = true; m.receiveShadow = true; m.visible = L === 0; root.add(m); m.bind(skel); lods.push(m); tris.push(P.B.tris);
      if (L === 0){ lampsRest = P.lamps; litMesh = new THREE.SkinnedMesh(geo(P.LB), matL); litMesh.name = 'mech_lamps'; root.add(litMesh); litMesh.bind(skel); litMesh.trisN = P.LB.tris; }
    }
    // glow sprites at the lamps (world positions written every frame), the floodlight pools on the ground
    const gl = lampsRest.filter(l => l.s > 0), gg = new THREE.BufferGeometry(), gp = new Float32Array(gl.length*3), gc = new Float32Array(gl.length*3), gs = new Float32Array(gl.length);
    gl.forEach((l, i) => { gc.set(l.col, i*3); gs[i] = l.s; });
    gg.setAttribute('position', new THREE.BufferAttribute(gp, 3)); gg.setAttribute('col', new THREE.BufferAttribute(gc, 3)); gg.setAttribute('sz', new THREE.BufferAttribute(gs, 1));
    const gm = new THREE.ShaderMaterial({uniforms:{uK:{value:1}, uA:{value:0.4}, uScale:{value:600}}, vertexShader:GLOW_VS, fragmentShader:GLOW_FS, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending});
    const glow = new THREE.Points(gg, gm); glow.frustumCulled = false; glow.name = 'mech_glow'; glow.renderOrder = 9;
    const pg = new THREE.PlaneGeometry(2, 2); pg.rotateX(-PI/2);
    const pm = new THREE.ShaderMaterial({uniforms:{uA:{value:0}}, vertexShader:POOL_VS, fragmentShader:POOL_FS, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, polygonOffset:true, polygonOffsetFactor:-4});
    const pools = [0, 1].map(i => { const q = new THREE.Mesh(pg, pm); q.name = 'mech_pool' + i; q.visible = false; q.renderOrder = 5; return q; });
    tris.push(litMesh.trisN);     // [LOD 0, LOD 1, LOD 2, lamps]
    MOD = {root, bones, skel, lods, lit:litMesh, tris, glow, glowL:gl, pools, mat, matL, ms:performance.now() - t0, lod:0};
    return MOD;
  }
  function attach(){ const M = build(); if (M.root.parent !== scene){ scene.add(M.root); scene.add(M.glow); for (const q of M.pools) scene.add(q); } return M; }
  function detach(){ if (!MOD) return; MOD.root.visible = false; MOD.glow.visible = false; for (const q of MOD.pools) q.visible = false; }
  // the pose: Q (NB quaternions [x,y,z,w], bone-local) and the root bone's position; group placement; level of detail by distance
  function setPose(Q, rootP, X, Y, Z, hdg, tilt){
    const M = MOD; if (!M) return;
    M.root.position.set(X, Z, -Y); M.root.rotation.set(tilt || 0, PI - hdg, 0, 'YXZ');     // (tilt: a fall forward about the feet)
    for (let i = 0; i < NB; i++){ const q = Q[i]; M.bones[i].quaternion.set(q[0], q[1], q[2], q[3]); }
    M.bones[0].position.set(rootP[0], rootP[1], rootP[2]);
    M.root.visible = true; M.root.updateMatrixWorld(true);
    const c = camera.position, d = Math.hypot(c.x - X, c.y - Z - 35, c.z + Y), L = d < 520 ? 0 : d < 1700 ? 1 : 2;
    if (L !== M.lod){ M.lods[M.lod].visible = false; M.lods[L].visible = true; M.lod = L; }
    M.lit.visible = L < 2;
  }
  // world position of a rest-space point carried by bone b (after setPose): out [x east, y north, z up]
  const _v = new THREE.Vector3(), _mi = new THREE.Matrix4();
  function boneW(b, p, out){ const M = MOD; _v.set(p[0] - REST[b][0], p[1] - REST[b][1], p[2] - REST[b][2]).applyMatrix4(M.bones[b].matrixWorld); out = out || [0, 0, 0]; out[0] = _v.x; out[1] = -_v.z; out[2] = _v.y; return out; }
  // lamps: glow sprites (brighter at night), floodlight pools ahead of the shoulders at night, the lamp mesh's brightness
  const _w = [0, 0, 0];
  function lights(nt, hdg, X, Y, beamK){
    const M = MOD; if (!M) return; const L = M.glowL, a = M.glow.geometry.attributes.position, A = a.array;
    for (let i = 0; i < L.length; i++){ boneW(L[i].bone, L[i].p, _w); A[i*3] = _w[0]; A[i*3 + 1] = _w[2]; A[i*3 + 2] = -_w[1]; }
    a.needsUpdate = true; M.glow.visible = M.root.visible;
    M.glow.material.uniforms.uA.value = 0.18 + 0.95*nt; M.glow.material.uniforms.uK.value = (0.7 + 0.8*nt)*(1 + 0.6*(beamK || 0));
    M.glow.material.uniforms.uScale.value = (renderer.domElement.height || 800)*0.9;
    const k = 0.55 + 1.1*nt; M.matL.color.setRGB(k, k, k);
    const on = nt > 0.15 && M.root.visible;
    for (let i = 0; i < 2; i++){ const q = M.pools[i]; q.visible = on; if (!on) continue; const s = i ? -1 : 1, fx = Math.sin(hdg), fy = Math.cos(hdg), rx = Math.cos(hdg), ry = -Math.sin(hdg);
      const px = X + fx*58 - rx*s*14, py = Y + fy*58 - ry*s*14; q.position.set(px, gnd(px, py) + 0.6, -py); q.rotation.set(0, PI - hdg, 0); q.scale.set(26, 1, 40); }
    M.pools[0].material.uniforms.uA.value = 0.22*sstep(0.15, 0.6, nt);
  }
  return {BS, BI, NB, PAR, REST, OFF, L_TH, L_SH, L_UA, L_FA, ANK, C, build, attach, detach, setPose, boneW, lights, parts, get M(){ return MOD; }};
})();

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
  // where a foot that lifts now should land: ahead of the body's predicted place at landing (the velocity anticipates the wanted one)
  function landAt(S, F, Trem, lead, turnRate){
    const vx = lerp(S.vx, S.wvx || 0, 0.5), vy = lerp(S.vy, S.wvy || 0, 0.5), Xb = S.X + vx*Trem, Yb = S.Y + vy*Trem, dh = wrapA(S.hdgWant - S.hdg), hL = S.hdg + clamp(dh, -turnRate*Trem*1.1, turnRate*Trem*1.1);
    const p = ideal(F.i, Xb, Yb, hL); F.bx = p[0] + vx*lead; F.by = p[1] + vy*lead; F.byaw = hL;
  }
  function startStep(S, i, Tsw, lead, turnRate){
    const F = S.feet[i];
    F.ax = F.x; F.ay = F.y; F.az = F.z; F.ayaw = F.yaw; F.dur = Tsw; F.u = 0; F.sw = true; F.lead = lead; F.tr = turnRate; landAt(S, F, Tsw, lead, turnRate); F.bz = gnd(F.bx, F.by);
    const d = Math.hypot(F.bx - F.x, F.by - F.y); F.lift = clamp(2.2 + 0.2*d, 2.2, 8.5) + Math.max(0, F.bz - F.az)*0.6;
    F.d = d; S.ev.push({e:'lift', i, x:F.x, y:F.y, z:F.z, d});
  }
  // how far a planted foot trails its place under the hip (m, horizontal)
  function lagOf(S, F){ const p = ideal(F.i, S.X, S.Y, S.hdg); return Math.hypot(F.x - p[0], F.y - p[1]); }
  // one step of the walk: inp {vx, vy (desired world velocity), hdg (desired heading or null), turn (rad/s)}
  function loco(S, inp, dt){
    S.t += dt; S.ev.length = 0;
    // velocity: heavy acceleration
    const ax = inp.vx - S.vx, ay = inp.vy - S.vy, al = Math.hypot(ax, ay), acc = (Math.hypot(inp.vx, inp.vy) > S.spd ? 7 : 10)*dt;
    const k = al > acc ? acc/al : 1; S.vx += ax*k; S.vy += ay*k; S.spd = Math.hypot(S.vx, S.vy); S.wvx = inp.vx; S.wvy = inp.vy;
    // heading
    if (inp.hdg !== null && inp.hdg !== undefined) S.hdgWant = inp.hdg; else if (S.spd > 1.2) S.hdgWant = Math.atan2(S.vx, S.vy);
    const tr = (inp.turn || 0.9)*dt, de = wrapA(S.hdgWant - S.hdg); S.hdg = wrapA(S.hdg + clamp(de, -tr, tr)); S.turnV = clamp(de, -tr, tr)/Math.max(dt, 1e-4);
    S.X += S.vx*dt; S.Y += S.vy*dt;
    // feet
    let anySw = false;
    for (const F of S.feet){
      if (!F.sw) continue; anySw = true;
      // a swing hurries when the stance foot trails too far (the body outruns the gait); the landing point follows the speed
      const O = S.feet[F.i ^ 1], lag = O.sw ? 0 : lagOf(S, O), hurry = 1 + clamp((lag - 9)*0.16, 0, 2.2);
      F.u += dt/F.dur*hurry;
      if (F.u < 0.6){ const bx0 = F.bx, by0 = F.by; landAt(S, F, Math.max(0.05, (1 - F.u)*F.dur/hurry), F.lead || 0, F.tr || 0.9); F.bx = lerp(bx0, F.bx, Math.min(1, dt*6)); F.by = lerp(by0, F.by, Math.min(1, dt*6)); F.bz = gnd(F.bx, F.by); }
      const u = Math.min(1, F.u), e = u*u*u*(u*(u*6 - 15) + 10);
      F.x = lerp(F.ax, F.bx, e); F.y = lerp(F.ay, F.by, e); F.h = F.lift*Math.pow(Math.sin(PI*u), 0.85); F.z = lerp(F.az, F.bz, e); F.yaw = F.ayaw + wrapA(F.byaw - F.ayaw)*e;
      F.pitch = 0.34*Math.sin(PI*clamp(u*2.2, 0, 1))*(1 - sstep(0.35, 0.55, u)) - 0.22*sstep(0.5, 0.82, u)*(1 - sstep(0.9, 1, u));
      if (F.u >= 1){ F.sw = false; F.h = 0; F.pitch = 0; F.x = F.bx; F.y = F.by; F.z = F.bz; F.yaw = F.byaw; S.ev.push({e:'land', i:F.i, x:F.x, y:F.y, z:F.z, k:clamp(0.35 + 0.035*S.spd + 0.04*(F.d || 0), 0.3, 1), water:wet(F.x, F.y)}); S.pel.v -= 1.2 + 0.09*S.spd; }
    }
    S.stepT += dt;
    const swF = S.feet.find(F => F.sw), vgo = Math.max(S.spd, Math.hypot(S.wvx || 0, S.wvy || 0)*0.6);
    // (running: the next foot may lift as the other comes down - a short flight phase)
    if (!S.lockFeet && (!swF || (vgo > 15 && swF.u > 0.82 && !S.feet[swF.i ^ 1].sw && swF.i !== S.next))){
      const tRate = inp.turn || 0.9;
      if (vgo > 0.7){
        const Tst = clamp(2.4 - 0.055*vgo, 1.05, 2.4), Tsw = Tst*0.78, lag = lagOf(S, S.feet[S.next]);
        if (S.stepT >= Tst || lag > 8 + 0.25*vgo){ startStep(S, S.next, Tsw, Tst*0.5, tRate); S.next ^= 1; S.stepT = 0; }
      } else if (!swF){
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
    const kS = 70, dS = 2*Math.sqrt(kS)*0.75; S.pel.v += (kS*(Math.max(target, 27 + S.extra.dy) - S.pel.y) - dS*S.pel.v)*dt; S.pel.y += S.pel.v*dt; S.pel.y = Math.max(Math.min(S.pel.y, py - S.Zb + 0.4), 26 + S.extra.dy);
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

// ---- 30_combat.js ----
/* ================= the fight: actions, weapons, hits on the creature, its hits on the mech, the city under the mech =================
   The creature's body is SGKaiju.body() (<= 24 spheres, world metres). Punch: alternating fists (1.15 s: wind-up, strike, recover),
   aimed at the nearest part of the creature in reach (else the crosshair), a hit when the fist passes within the part's radius + 7 m
   in the strike window: 34 damage, a shove, sparks. Grab: both hands reach out; a part of the creature in reach -> the mech wrenches it
   and throws it off balance (140, a 45 m shove sideways); else the building in front: a chunk is ripped out (the building comes
   down) and carried in the right hand until it is thrown at the crosshair (ballistic; 110 on the creature, a blast where it lands).
   Beam: from the right forearm's emitter to the crosshair while held, 44 / s on the creature, buildings on its line come down and
   burn, the ground scorches; it heats up (6.5 s of fire, 3.5 s cool-down when it overheats). Missiles: a salvo of 12 from the
   shoulder pods, homing on the part under the crosshair at launch (18 each, every 11 s). Stomp: a foot raised and slammed down: a
   shockwave (70 within 75 m of its feet, everything around falls). The creature's damage is SGKaiju.damage({k, x, y, z, push, px, py})
   (kaiju.js [v48 mech]). Its strikes reach the mech through SGKaiju.onEvent ('hit' events within the strike's radius, 'throw' events
   of sweeps / limbs on the mech's box) and the contact of its body spheres (pushed out; a fast-moving part hurts): shield (400,
   recharging after 4 s) first, then armour (1000). */
const ST = {on:false, S:null, diff:1, sp:'cthulhu', t:0, hp:1000, hpMax:1000, sh:400, shMax:400, shT:0, heat:0, over:0, mslCool:0, mslQ:[], act:null, beamOn:false, firing:false,
  carry:null, proj:[], msl:[], aim:{x:0, y:0, z:0, k:'sky', d:1e9, i:-1, dx:0, dy:1, dz:0}, stats:{dealt:0, hits:0, taken:0, bld:0, t0:0}, result:null, down:null, won:null, drop:null,
  unsub:null, side:0, sphP:[], sphV:[], sphCool:new Map(), dmgAcc:0, beamBld:null, beamBldT:0, frame:0, pending:null, hitMark:0, hurtK:0, resist:1, resistT:0, panicT:0, smokeT:0, mutTake:false};
const DIFF_HP = [4500, 6500, 9000], DIFF_IN = [0.6, 1.0, 1.4];
const MC = (() => {
  const H = ML;
  const body = () => { try { const K = KJ(); return K && K.on ? K.body() : []; } catch (e){ return []; } };
  const kjS = () => { try { const G = KG_().G; return G && G.on && G.sim ? G.sim.S : null; } catch (e){ return null; } };
  const kjT = () => { try { return KG_().G.t; } catch (e){ return ST.t; } };
  const shake = (e, x, y, z, R) => { try { KG_().shakeEv(e, x, y, z, R || 180, 0); } catch (er){ /* */ } };
  const KFXc = () => { const F = KFX_(); if (F && F.ensure) F.ensure(); return F; };
  // ---- the world position of a rest-space point on a bone (from the last pose)
  const W = (b, p) => H.toW(ST.S, H.boneM(ST.S, b, p));
  const FIST = [[16.4, 25.6, 0.9], [-16.4, 25.6, 0.9]], MUZZLE = [-16.8, 28.6, 4.75];
  const fistW = i => W(MK.BI[i ? 'handR' : 'handL'], FIST[i]);
  const muzzleW = () => W(MK.BI.farmR, MUZZLE);
  // ---- ray against the creature's spheres -> {t, i} (nearest) or null
  function raySph(o, d, L, maxT){
    let best = null; for (let i = 0; i < L.length; i++){ const s = L[i], ox = o[0] - s.x, oy = o[1] - s.y, oz = o[2] - s.z, b = ox*d[0] + oy*d[1] + oz*d[2], c = ox*ox + oy*oy + oz*oz - s.r*s.r, h = b*b - c;
      if (h < 0) continue; const t = -b - Math.sqrt(h); if (t < 0 || t > maxT) continue; if (!best || t < best.t) best = {t, i}; }
    return best;
  }
  // ---- a building containing the point (x, y, z), standing: the creature mode's index (KW.bldNear)
  function bldAt(x, y, z, r){
    const Wd = KW_(); if (!Wd) return null; let hit = null, bd = 1e9;
    try { Wd.bldNear(x, y, r + 40, b => { if (Wd.destroyed(b.ti, b.idx)) return; const d = Math.hypot(b.cx - x, b.cy - y) - b.r; if (d > r || z < b.z0 - r || z > b.z1 + r) return; if (d < bd){ bd = d; hit = b; } }); } catch (e){ return null; }
    return hit;
  }
  // march a ray through the city: the ground and the buildings (step m) -> {t, k:'ground'|'bld', b}
  function rayCity(o, d, maxT, step){
    step = step || 20; let tPrev = 0;
    for (let t = step; t <= maxT; t += step){
      const x = o[0] + d[0]*t, y = o[1] + d[1]*t, z = o[2] + d[2]*t;
      if (z < gnd(x, y)){ let a = tPrev, b = t; for (let k = 0; k < 6; k++){ const m = (a + b)/2; if (o[2] + d[2]*m < gnd(o[0] + d[0]*m, o[1] + d[1]*m)) b = m; else a = m; } return {t:b, k:'ground'}; }
      if (z < 650){ const B = bldAt(x, y, z, 2); if (B) return {t, k:'bld', b:B}; }
      tPrev = t;
    }
    return null;
  }
  // ---- the crosshair: the camera's centre ray against the creature, the city
  const _f = new THREE.Vector3();
  function aimUpdate(){
    const c = camera.position; camera.getWorldDirection(_f);
    const o = [c.x, -c.z, c.y], d = [_f.x, -_f.z, _f.y], A = ST.aim;
    A.dx = d[0]; A.dy = d[1]; A.dz = d[2];
    const L = body(), s = raySph(o, d, L, 3000), cty = rayCity(o, d, s ? s.t : 2400, 24);
    let t = 2400, k = 'sky', i = -1;
    if (s){ t = s.t; k = 'kaiju'; i = s.i; }
    if (cty && cty.t < t){ t = cty.t; k = cty.k; i = -1; }
    A.x = o[0] + d[0]*t; A.y = o[1] + d[1]*t; A.z = o[2] + d[2]*t; A.k = k; A.d = t; A.i = i;
    // aim assist for the weapons: the part nearest the ray (angle) within ~4 deg
    let bi = -1, ba = 0.07; for (let j = 0; j < L.length; j++){ const S = L[j], vx = S.x - o[0], vy = S.y - o[1], vz = S.z - o[2], l = Math.hypot(vx, vy, vz) || 1, ang = Math.acos(clamp((vx*d[0] + vy*d[1] + vz*d[2])/l, -1, 1)) - Math.atan(S.r/l); if (ang < ba){ ba = ang; bi = j; } }
    A.lock = bi;
  }
  // ---- hurting the creature
  function hurt(k, x, y, z, push, src){
    const K = KJ(); if (!K || !K.damage) return null; const S = ST.S; let px = x - S.X, py = y - S.Y; const l = Math.hypot(px, py) || 1; px /= l; py /= l;
    const r = K.damage({k, x, y, z, push:push || 0, px, py, src:'mech'}); if (!r) return null;
    ST.stats.dealt += k; ST.stats.hits++; ST.hitMark = 0.35; return r;
  }
  function sparks(x, y, z, n, sp){ try { if (window.SGFX && SGFX.sparks) SGFX.sparks(x, y, z, n || 30, sp || 22); } catch (e){ /* */ } const F = KFXc(); if (F) try { F.blastFlash(x, y, z, 0.5); } catch (e){ /* */ } }
  // ---- buildings: bring down everything touching the sphere (x, y, z, r); push direction (fx, fy) blended with radial; energy e
  function crushAt(x, y, z, r, fx, fy, e, out){
    const Wd = KW_(); if (!Wd) return 0; const L = [];
    try { Wd.bldNear(x, y, r + 60, b => { if (Wd.destroyed(b.ti, b.idx)) return; const d = Math.hypot(b.cx - x, b.cy - y) - b.r; if (d > r) return; if (z + r < b.z0 || z - r > b.z1) return;
      let ux = b.cx - x, uy = b.cy - y; const l = Math.hypot(ux, uy); if (l > 1){ ux /= l; uy /= l; } if (fx || fy){ ux = ux*0.4 + fx*0.6; uy = uy*0.4 + fy*0.6; const m = Math.hypot(ux, uy) || 1; ux /= m; uy /= m; }
      L.push({tile:b.ti, idx:b.idx, b, fx:Math.round(ux*1000)/1000, fy:Math.round(uy*1000)/1000, e:Math.round(clamp(e, 0, 1)*100)/100, z:Math.round(clamp(z, b.z0, b.z1))}); }); } catch (er){ return 0; }
    if (!L.length) return 0;
    let acc = []; try { acc = Wd.apply(L, x, y, kjT(), false) || []; } catch (er){ console.warn('[mech] apply', er); }
    ST.stats.bld += acc.filter(a => a.tile !== undefined).length;
    if (out) for (const it of L) out.push(it.b);
    return acc.length;
  }
  function blast(x, y, z, r, e){ const Wd = KW_(); if (!Wd || !Wd.blast) return 0; try { const L = Wd.blast(x, y, z, r, e) || []; const n = L.filter(a => a && a.tile !== undefined).length; ST.stats.bld += n; return n; } catch (er){ console.warn('[mech] blast', er); return 0; } }
  // ---- the mech's body against the city (every other frame): feet, shins, knees, pelvis, chest, fists
  const CR = [];
  function bodyCity(){
    const S = ST.S, Wd = KW_(); if (!Wd) return; const BI = MK.BI, sp = S.spd, fx = sp > 0.5 ? S.vx/sp : Math.sin(S.hdg), fy = sp > 0.5 ? S.vy/sp : Math.cos(S.hdg), e = clamp(0.42 + 0.02*sp, 0.42, 0.85);
    CR.length = 0;
    const pts = [[BI.footL, [8.5, 3, 1], 6.5], [BI.footR, [-8.5, 3, 1], 6.5], [BI.shinL, [8.3, 12, 0], 5.5], [BI.shinR, [-8.3, 12, 0], 5.5], [BI.thighL, [7.8, 27, 0.5], 5.5], [BI.thighR, [-7.8, 27, 0.5], 5.5],
      [BI.root, [0, 36, 0], 9.5], [BI.chest, [0, 51, 0], 11.5], [BI.head, [0, 64, 2], 4.5], [BI.handL, [16.5, 26.5, 0.9], 5], [BI.handR, [-16.5, 26.5, 0.9], 5], [BI.clavL, [16.4, 61, 0], 5.5], [BI.clavR, [-16.4, 61, 0], 5.5]];
    let n = 0;
    for (const [b, p, r] of pts){ const w = W(b, p); n += crushAt(w[0], w[1], w[2], r, fx, fy, b === BI.handL || b === BI.handR ? 0.8 : e, CR); }
    if (n){ let tall = 0; for (const b of CR) tall = Math.max(tall, b.h); if (tall > 18){ ST.resist = 0.55; ST.resistT = 0.45; shake(0.25, S.X, S.Y, S.Zb + 30, 200); } }
  }
  // ---- the creature's spheres against the mech: pushed out; a fast part hurts
  function contacts(dt){
    const S = ST.S, L = body(); if (!L.length){ ST.sphP.length = 0; return; }
    const z0 = S.Zb + 8, z1 = S.Zb + 62, R = 10;
    for (let i = 0; i < L.length; i++){
      const s = L[i], P = ST.sphP[i]; let vx = 0, vy = 0, vz = 0; if (P && dt > 0){ vx = (s.x - P[0])/dt; vy = (s.y - P[1])/dt; vz = (s.z - P[2])/dt; if (Math.hypot(vx, vy, vz) > 400){ vx = vy = vz = 0; } }
      ST.sphP[i] = [s.x, s.y, s.z];
      const cz = clamp(s.z, z0, z1), dx = S.X - s.x, dy = S.Y - s.y, dz = cz - s.z, d = Math.hypot(dx, dy, dz), ov = s.r + R - d; if (ov <= 0) continue;
      const hl = Math.hypot(dx, dy) || 1, nx = dx/hl, ny = dy/hl, push = Math.min(ov, 6);
      S.X += nx*push; S.Y += ny*push; const vn = S.vx*nx + S.vy*ny; if (vn < 0){ S.vx -= vn*nx; S.vy -= vn*ny; }
      const vrel = -(vx*nx + vy*ny) + Math.max(0, -vz)*0.5, c = ST.sphCool.get(i) || -9;
      if (vrel > 20 && ST.t - c > 0.8){ ST.sphCool.set(i, ST.t); take(clamp((vrel - 16)*3.2, 10, 170), s.x, s.y, 'body'); S.vx += nx*Math.min(14, vrel*0.25); S.vy += ny*Math.min(14, vrel*0.25); }
    }
  }
  // ---- the creature's strikes (SGKaiju.onEvent)
  function hitR(k){ try { const X = KJ()._.KSX.P[ST.sp] || KJ()._.KSX.P.cthulhu, h = X && X.hits && X.hits[k]; return h && h.r ? h.r*0.75 : 40; } catch (e){ return 40; } }
  function onKj(e){
    if (!ST.on || !e) return; const S = ST.S;
    if (e.e === 'defeated'){ MG.defeated(e); return; }
    if (e.e === 'fallen'){ MG.fallen(e); return; }
    if (ST.down || ST.won || ST.drop) return;
    if (e.e === 'hit' && isFinite(e.x)){ const P = kjS(); if (P && Math.hypot(e.x - P.x, e.y - P.y) < 35) return;
      const d = Math.hypot(e.x - S.X, e.y - S.Y), R = hitR(e.k) + 12, dz = (e.z || 0) - S.Zb; if (d > R || dz > 95) return;
      const base = {1:150, 2:150, 5:125, 8:70, 9:230}[e.k] || 115; take(base*(1 - 0.55*d/R), e.x, e.y, 'strike');
      let nx = S.X - e.x, ny = S.Y - e.y; const l = Math.hypot(nx, ny) || 1; S.vx += nx/l*9; S.vy += ny/l*9; }
    else if (e.e === 'throw' && String(e.id) === 'mech' && e.src !== 'slam'){ take(45 + 110*(+e.k || 0), S.X - (e.vx || 0), S.Y - (e.vy || 0), 'sweep'); S.vx += (e.vx || 0)*0.5; S.vy += (e.vy || 0)*0.5; }
  }
  // ---- damage to the mech: shield first, then armour
  function take(dmg, fx, fy, kind){
    if (ST.down || ST.won || !(dmg > 0)) return; dmg *= DIFF_IN[ST.diff] || 1; if (ST.mutTake) return;
    const S = ST.S; ST.stats.taken += dmg; ST.shT = 4; let rest = dmg;
    if (ST.sh > 0){ const a = Math.min(ST.sh, rest); ST.sh -= a; rest -= a; MF.snd('shield', S.X, S.Y, S.Zb + 50, Math.min(1, dmg/120)); }
    if (rest > 0){ ST.hp = Math.max(0, ST.hp - rest); MF.snd('clang', S.X, S.Y, S.Zb + 45, Math.min(1, rest/120)); }
    ST.hurtK = Math.min(1, ST.hurtK + 0.35 + dmg/250);
    let dx = fx - S.X, dy = fy - S.Y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    sparks(S.X + dx*9, S.Y + dy*9, S.Zb + 40 + 14*Math.sin(ST.t*7), Math.round(20 + dmg/6), 20);
    S.extra.lean -= Math.min(0.12, dmg/1500); shake(Math.min(1, 0.4 + dmg/220), S.X, S.Y, S.Zb + 40, 260);
    MU.flash(); if (ST.hp <= 0) MG.mechDown();
  }
  // ---------------- the actions ----------------
  // pick the part of the creature to strike: in front, within reach of the fist (from the shoulders), low enough
  function meleeTarget(reach){
    const S = ST.S, L = body(); let best = -1, bs = 1e9; const fx = Math.sin(S.hdg), fy = Math.cos(S.hdg);
    for (let i = 0; i < L.length; i++){ const s = L[i], dx = s.x - S.X, dy = s.y - S.Y, d = Math.hypot(dx, dy) - s.r, dz = s.z - S.Zb; if (d > reach || dz > 78 || dz < -5) continue;
      const fr = (dx*fx + dy*fy)/Math.max(1, Math.hypot(dx, dy)), sc = d - 25*fr + Math.abs(dz - 45)*0.3; if (sc < bs){ bs = sc; best = i; } }
    return best;
  }
  const aimHdg = () => Math.atan2(ST.aim.x - ST.S.X, ST.aim.y - ST.S.Y);
  function punch(){
    if (ST.down || ST.won || ST.drop) return false;
    if (ST.carry){ return throwRock(); }
    const A = ST.act; if (A && A.k === 'punch' && A.t < A.dur*0.55){ ST.pending = 'punch'; return true; } if (A && A.k !== 'punch') { ST.pending = 'punch'; return false; }
    ST.side ^= 1; const tg = meleeTarget(62);
    ST.act = {k:'punch', t:0, dur:1.15, side:ST.side, tgt:tg, hit:false, bld:false}; MF.snd('whoosh', ST.S.X, ST.S.Y, ST.S.Zb + 45, 0.8); return true;
  }
  function grab(){
    if (ST.down || ST.won || ST.drop) return false;
    if (ST.carry) return throwRock();
    if (ST.act){ ST.pending = 'grab'; return false; }
    ST.act = {k:'grab', t:0, dur:0.7, ph:'reach', tgt:meleeTarget(56), hold:-1}; MF.snd('servo', ST.S.X, ST.S.Y, ST.S.Zb + 40, 0.8); return true;
  }
  function stomp(){
    if (ST.down || ST.won || ST.drop) return false;
    if (ST.act || ST.S.feet.some(F => F.sw)){ ST.pending = 'stomp'; return false; }
    const S = ST.S; ST.act = {k:'stomp', t:0, dur:1.7, side:1, x0:S.feet[1].x, y0:S.feet[1].y, done:false}; S.lockFeet = true; MF.snd('servo', S.X, S.Y, S.Zb + 20, 1); return true;
  }
  function missiles(){
    if (ST.down || ST.won || ST.drop || ST.mslCool > 0 || ST.mslQ.length) return false;
    const lock = ST.aim.lock >= 0 ? ST.aim.lock : ST.aim.k === 'kaiju' ? ST.aim.i : -1, pt = [ST.aim.x, ST.aim.y, ST.aim.z];
    for (let i = 0; i < 12; i++) ST.mslQ.push({t:i*0.085, side:i & 1, cell:(i >> 1) % 6, lock, pt});
    ST.mslCool = 11; return true;
  }
  function throwRock(){ if (!ST.carry || (ST.act && ST.act.k !== 'carry')) return false; ST.act = {k:'throw', t:0, dur:1.0, rel:false}; MF.snd('servo', ST.S.X, ST.S.Y, ST.S.Zb + 50, 0.7); return true; }
  // ---- per frame: the actions drive the arms, the torso and the feet; hit tests
  function actions(dt){
    const S = ST.S, A = ST.act, BI = MK.BI; S.arm[0] = S.arm[1] = null; let twist = 0, cp = 0, look = null, face = null, vK = 1;
    S.clav[0] = S.clav[1] = 0; S.extra.dy = 0; const dk = 1 - Math.min(1, dt*3); S.extra.lean *= dk; S.extra.roll *= dk;
    if (A){ A.t += dt; const u = A.t/A.dur;
      if (A.k === 'punch'){
        const i = A.side, s = i ? -1 : 1, L = body(), sh = S.WP[BI[i ? 'uarmR' : 'uarmL']] || [s*15.5, 57.5, 0];
        let T = A.tgt >= 0 && L[A.tgt] ? [L[A.tgt].x, L[A.tgt].y, L[A.tgt].z] : [S.X + Math.sin(S.hdg)*40, S.Y + Math.cos(S.hdg)*40, S.Zb + 46];
        if (A.tgt < 0 && ST.aim.d < 120) T = [ST.aim.x, ST.aim.y, ST.aim.z];
        let E = H.toM(S, T[0], T[1], T[2]); const v = H.vsub(E, sh), vl = H.vlen(v), R = (MK.L_UA + MK.L_FA)*0.97; if (vl > R) E = H.vadd(sh, H.vsc(v, R/vl)); if (E[2] < 6) E[2] = 6;
        const G = [s*6.5, 51, 9.5], Wd = [s*13, 50.5, 1.5], I = idleP(i);
        let p; if (u < 0.25) p = lerp3(I, Wd, sstep(0, 1, u/0.25)); else if (u < 0.42) p = lerp3(Wd, E, Math.pow((u - 0.25)/0.17, 1.6)); else if (u < 0.58) p = E; else p = lerp3(E, I, sstep(0, 1, (u - 0.58)/0.42));
        void G; S.arm[i] = {p, pole:[s*0.7, -0.8, -0.35], wrist:u > 0.25 && u < 0.6 ? 0.05 : 0.2, open:0};
        twist = u < 0.25 ? s*0.28*sstep(0, 1, u/0.25) : u < 0.5 ? lerp(s*0.28, -s*0.48, sstep(0.25, 0.45, u)) : -s*0.48*(1 - sstep(0.58, 1, u));
        S.clav[i] = 0.18*Math.sin(PI*clamp(u*1.2, 0, 1)); face = Math.atan2(T[0] - S.X, T[1] - S.Y); look = T; vK = 0.45;
        if (u > 0.26 && u < 0.45) vK = 1.6;      // the step into the blow
        if (u > 0.36 && u < 0.62 && !A.hit){ const f = fistW(i);
          for (let j = 0; j < L.length; j++){ const sp = L[j]; if (Math.hypot(f[0] - sp.x, f[1] - sp.y, f[2] - sp.z) < sp.r + 7){ A.hit = true; hurt(34, sp.x, sp.y, sp.z, 7, 'punch'); sparks(f[0], f[1], f[2], 50, 26); MF.snd('punch', f[0], f[1], f[2], 1); shake(0.7, f[0], f[1], f[2], 220); ST.hitStop = 0.07; break; } }
          if (!A.bld){ const n = crushAt(f[0], f[1], f[2], 7, Math.sin(S.hdg), Math.cos(S.hdg), 0.95); if (n){ A.bld = true; MF.snd('punchB', f[0], f[1], f[2], 0.8); } try { KW_().landmarkHit(f[0], f[1], f[2], 10, kjT(), 0.9); } catch (e){ /* */ } }
        }
        if (u >= 1) ST.act = null;
      } else if (A.k === 'grab'){
        const L = body(), sp = A.hold >= 0 ? L[A.hold] : A.tgt >= 0 ? L[A.tgt] : null;
        let T = sp ? [sp.x, sp.y, Math.min(sp.z, S.Zb + 55)] : [S.X + Math.sin(S.hdg)*30, S.Y + Math.cos(S.hdg)*30, S.Zb + 34];
        let E = H.toM(S, T[0], T[1], T[2]); E[2] = clamp(E[2], 8, 28); E[0] = clamp(E[0], -6, 6); E[1] = clamp(E[1], 18, 56);
        if (A.ph === 'reach'){ const k = sstep(0, 1, u); for (let i = 0; i < 2; i++){ const s = i ? -1 : 1; S.arm[i] = {p:lerp3(idleP(i), [E[0] + s*6, E[1], E[2]], k), pole:[s*0.9, -0.6, -0.4], wrist:-0.1, open:k}; }
          vK = 0.25; face = sp ? Math.atan2(T[0] - S.X, T[1] - S.Y) : null; look = T;
          if (u >= 1){ const hm = H.toW(S, [E[0], E[1], E[2]]);
            let hit = -1; for (let j = 0; j < L.length; j++) if (Math.hypot(hm[0] - L[j].x, hm[1] - L[j].y, hm[2] - L[j].z) < L[j].r + 12){ hit = j; break; }
            if (hit >= 0){ A.ph = 'hold'; A.t = 0; A.dur = 1.5; A.hold = hit; MF.snd('clang', hm[0], hm[1], hm[2], 0.8); sparks(hm[0], hm[1], hm[2], 30, 14); }
            else { const b = bldAt(hm[0], hm[1], Math.min(hm[2], S.Zb + 20), 22) || bldAt(S.X + Math.sin(S.hdg)*30, S.Y + Math.cos(S.hdg)*30, S.Zb + 12, 26);
              if (b && b.h > 6){ crushAt(b.cx, b.cy, Math.min(b.z1, S.Zb + 30), 2, Math.sin(S.hdg + PI), Math.cos(S.hdg + PI), 0.75); ST.carry = {col:b.col || [0.6, 0.6, 0.58], s:clamp(b.r*0.45, 6, 12)}; MF.rockMake(ST.carry); A.ph = 'lift'; A.t = 0; A.dur = 0.8; MF.snd('crunch', b.cx, b.cy, S.Zb + 20, 0.9); }
              else { A.ph = 'miss'; A.t = 0; A.dur = 0.6; } } }
        } else if (A.ph === 'hold'){
          const k = sstep(0, 0.6, u), thr = u > 0.62; for (let i = 0; i < 2; i++){ const s = i ? -1 : 1; S.arm[i] = {p:[E[0] + s*5 - (thr ? 8 : 0)*sstep(0.6, 0.8, u), E[1] - 2*k, E[2] - 3*k], pole:[s*0.9, -0.6, -0.4], wrist:-0.2, open:thr ? 1 : 0.25}; }
          twist = 0.55*k - 1.0*sstep(0.6, 0.8, u); S.extra.lean = -0.06*k; vK = 0; look = T;
          if (thr && !A.thrown){ A.thrown = true; const fx = Math.sin(S.hdg), fy = Math.cos(S.hdg), rx = -Math.cos(S.hdg), ry = Math.sin(S.hdg);
            const tx = sp ? sp.x : T[0], ty = sp ? sp.y : T[1], r = KJ() && KJ().damage ? KJ().damage({k:140, x:S.X, y:S.Y, z:T[2], push:45, px:fx*0.5 + rx*0.85, py:fy*0.5 + ry*0.85, src:'mech'}) : null;
            if (r){ ST.stats.dealt += 140; ST.stats.hits++; ST.hitMark = 0.5; } sparks(tx, ty, T[2], 60, 20); MF.snd('punch', tx, ty, T[2], 1); shake(1, tx, ty, T[2], 300);
            const P = kjS(); if (P) blast(P.x + (fx*0.5 + rx*0.85)*40, P.y + (fy*0.5 + ry*0.85)*40, gnd(P.x, P.y), 45, 0.85); }
          if (u >= 1) ST.act = null;
        } else if (A.ph === 'lift'){
          const k = sstep(0, 1, u); S.arm[1] = {p:lerp3([E[0] - 4, E[1], E[2]], [-11, 63, -2], k), pole:[-0.9, -0.5, -0.3], wrist:0.4, open:0.6}; S.arm[0] = {p:lerp3([E[0] + 4, E[1], E[2]], idleP(0), k), pole:[0.6, -0.4, -1], wrist:0, open:0}; vK = 0.4;
          if (u >= 1) ST.act = {k:'carry', t:0, dur:1e9};
        } else { S.arm[0] = {p:lerp3([E[0] + 6, E[1], E[2]], idleP(0), u), pole:[0.6, -0.4, -1], open:1 - u}; S.arm[1] = {p:lerp3([E[0] - 6, E[1], E[2]], idleP(1), u), pole:[-0.6, -0.4, -1], open:1 - u}; vK = 0.5; if (u >= 1) ST.act = null; }
      } else if (A.k === 'carry'){
        S.arm[1] = {p:[-11, 63, -2], pole:[-0.9, -0.5, -0.3], wrist:0.4, open:0.6}; vK = 0.75;
      } else if (A.k === 'throw'){
        const back = [-12, 65, -9], fwd = [-6, 52, 24];
        S.arm[1] = {p:u < 0.35 ? lerp3([-11, 63, -2], back, sstep(0, 0.35, u)) : u < 0.52 ? lerp3(back, fwd, (u - 0.35)/0.17) : lerp3(fwd, idleP(1), sstep(0.52, 1, u)), pole:[-0.9, -0.5, -0.3], wrist:0.3, open:u > 0.46 ? 1 : 0.6};
        twist = u < 0.35 ? 0.35*sstep(0, 0.35, u) : u < 0.55 ? lerp(0.35, -0.45, (u - 0.35)/0.2) : -0.45*(1 - sstep(0.55, 1, u)); face = aimHdg(); vK = 0.4;
        if (u >= 0.46 && !A.rel){ A.rel = true; MF.rockThrow(); MF.snd('whoosh', S.X, S.Y, S.Zb + 55, 1); }
        if (u >= 1) ST.act = null;
      } else if (A.k === 'stomp'){
        const F = S.feet[A.side], s = A.side ? -1 : 1; S.lockFeet = true; vK = 0;
        const up = sstep(0, 0.45, u), down = sstep(0.47, 0.56, u); F.sw = false; F.h = 11*up*(1 - down); F.pitch = -0.25*up*(1 - down);
        const fx = Math.sin(S.hdg), fy = Math.cos(S.hdg); F.x = A.x0 + fx*4*up; F.y = A.y0 + fy*4*up; F.z = gnd(F.x, F.y);
        S.extra.lean = -0.05*up*(1 - down) + 0.06*down*(1 - sstep(0.6, 1, u)); S.extra.roll = s*0.05*up*(1 - down); S.extra.dy = -1.5*down*(1 - sstep(0.7, 1, u));
        for (let i = 0; i < 2; i++){ const sd = i ? -1 : 1, I = idleP(i); S.arm[i] = {p:[I[0] + sd*4*up, I[1] + 8*up*(1 - down), I[2] + 3], pole:[sd*0.6, -0.4, -1], wrist:0.1, open:0}; }
        if (u >= 0.56 && !A.done){ A.done = true; stompHit(F.x, F.y, F.z); }
        if (u >= 1){ ST.act = null; S.lockFeet = false; S.extra.roll = 0; }
      } else if (A.k === 'victory'){
        const k = sstep(0, 0.3, u)*(1 - sstep(0.85, 1, u)); S.arm[1] = {p:lerp3(idleP(1), [-15, 82, 4], k), pole:[-0.9, 0, -0.4], wrist:0, open:0}; look = null; S.cpitch = -0.1*k; vK = 0;
        if (u >= 1) ST.act = {k:'victory', t:0, dur:4};
      } else if (A.k === 'down'){
        vK = 0; const k1 = sstep(0, 1.4, A.t); S.extra.dy = -15*k1; S.extra.lean = 0.25*k1;
        for (let i = 0; i < 2; i++){ const s = i ? -1 : 1, I = idleP(i); S.arm[i] = {p:[I[0] + s*2, I[1] - 4*k1, I[2] + 10*k1], pole:[s*0.6, -0.4, -1], wrist:0.4, open:0.4}; }
      }
    }
    // the beam aims the right arm (unless the right arm is busy)
    const rBusy = A && ((A.k === 'punch' && A.side === 1) || A.k === 'grab' || A.k === 'throw' || A.k === 'carry' || A.k === 'victory' || A.k === 'down');
    ST.firing = ST.beamOn && !rBusy && ST.over <= 0 && !ST.down && !ST.won && !ST.drop;
    if (ST.firing){
      const sh = S.WP[BI.uarmR] || [-15.5, 57.5, 0], tg = H.toM(S, ST.aim.x, ST.aim.y, ST.aim.z), v = H.vsub(tg, sh), vl = H.vlen(v) || 1;
      let d = H.vsc(v, 1/vl); if (d[2] < 0.25){ d[2] = 0.25; d = H.vnorm(d); }
      S.arm[1] = {p:H.vadd(sh, H.vsc(d, (MK.L_UA + MK.L_FA)*0.985)), pole:[-0.7, -0.7, -0.2], wrist:0, open:0};
      S.clav[1] = 0.15; face = aimHdg(); vK = Math.min(vK, 0.6); look = [ST.aim.x, ST.aim.y, ST.aim.z]; cp = clamp(-Math.asin(clamp(d[1], -1, 1))*0.15, -0.12, 0.12);
    }
    // smooth the torso twist; the head looks at the creature's head / the target / the crosshair
    S.twist += (twist - S.twist)*Math.min(1, dt*(A && A.k === 'punch' ? 14 : 6)); S.cpitch += (cp - S.cpitch)*Math.min(1, dt*4);
    if (!look){ const L = body(); if (L.length){ let hi = L[0]; for (const s of L) if (s.z > hi.z) hi = s; look = [hi.x, hi.y, hi.z]; } }
    if (look){ const m = H.toM(S, look[0], look[1], look[2]), hd = H.vsub(m, [0, 64, 2]); const ly = Math.atan2(hd[0], hd[2]) - S.twist, lp = -Math.atan2(hd[1], Math.hypot(hd[0], hd[2]));
      S.look[0] += (clamp(wrapA(ly), -0.9, 0.9) - S.look[0])*Math.min(1, dt*3); S.look[1] += (clamp(lp, -0.5, 0.45) - S.look[1])*Math.min(1, dt*3); }
    else { S.look[0] *= 1 - Math.min(1, dt*2); S.look[1] *= 1 - Math.min(1, dt*2); }
    if (!ST.act && ST.pending){ const p = ST.pending; ST.pending = null; if (p === 'punch') punch(); else if (p === 'grab') grab(); else if (p === 'stomp') stomp(); }
    return {face, vK};
  }
  const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const idleP = i => H.idleArm(ST.S, i).p;
  function stompHit(x, y, z){
    const S = ST.S, L = body(); let hit = false;
    for (const s of L){ const d = Math.hypot(s.x - x, s.y - y) - s.r; if (d < 75 && s.z - z < 60){ hit = true; } }
    if (hit) hurt(70, x + Math.sin(S.hdg)*20, y + Math.cos(S.hdg)*20, z + 10, 10, 'stomp');
    blast(x + Math.sin(S.hdg)*12, y + Math.cos(S.hdg)*12, z, 42, 0.85);
    const F = KFXc(); if (F){ try { F.dustWave(x, y, z, 18, 0.7); F.impact(x, y, z, 30, wet(x, y), 1.1, 6, 0.8); } catch (e){ /* */ } }
    try { KW_().tossTraffic(x, y, 130, 1.4); KW_().landmarkHit(x, y, z, 40, kjT(), 1); } catch (e){ /* */ }
    shake(1, x, y, z, 320); MF.snd('stomp', x, y, z, 1); try { if (window.SGAudio && SGAudio.fx) SGAudio.fx('explosion', {x, y, z, k:0.7}); } catch (e){ /* */ }
  }
  // ---- the beam (per frame while firing): the line from the muzzle to the crosshair; what it hits
  function beam(dt){
    if (!ST.firing){ ST.heat = Math.max(0, ST.heat - dt/4); if (ST.over > 0){ ST.over -= dt; if (ST.over <= 0) ST.heat = Math.min(ST.heat, 0.6); } MF.beamShow(null); ST.dmgAcc = 0; return; }
    ST.heat += dt/6.5; if (ST.heat >= 1){ ST.heat = 1; ST.over = 3.5; MF.snd('overheat', ST.S.X, ST.S.Y, ST.S.Zb + 40, 1); MU.toast('Beam overheated', 1.6); }
    const o = muzzleW(); let d = [ST.aim.x - o[0], ST.aim.y - o[1], ST.aim.z - o[2]]; let dl = Math.hypot(d[0], d[1], d[2]);
    if (dl < 25){ d = [Math.sin(ST.S.hdg), Math.cos(ST.S.hdg), -0.1]; dl = 1; } d = [d[0]/dl, d[1]/dl, d[2]/dl];
    const L = body(), s = raySph(o, d, L, 2000); let t = s ? s.t : 2000, k = s ? 'kaiju' : 'sky', B = null;
    if ((ST.frame & 1) === 0 || !ST.beamHit){ const c = rayCity(o, d, t, 14); if (c && c.t < t){ t = c.t; k = c.k; B = c.b || null; } ST.beamHit = {t, k, B}; }
    else if (ST.beamHit.t < t){ t = ST.beamHit.t; k = ST.beamHit.k; B = ST.beamHit.B; }
    const hx = o[0] + d[0]*t, hy = o[1] + d[1]*t, hz = o[2] + d[2]*t;
    if (k === 'kaiju'){ ST.dmgAcc += 44*dt; if (ST.dmgAcc >= 9){ hurt(ST.dmgAcc, hx, hy, hz, 0, 'beam'); ST.dmgAcc = 0; } }
    else if (k === 'bld' && B){ if (ST.beamBld !== B){ ST.beamBld = B; ST.beamBldT = 0; } ST.beamBldT += dt; if (ST.beamBldT > 0.3){ crushAt(hx, hy, hz, 4, d[0], d[1], 0.9); const F = KFXc(); if (F) try { F.fireAt(hx, hy, hz, 6, 25, true); } catch (e){ /* */ } ST.beamBld = null; ST.beamHit = null; } }
    else if (k === 'ground' && (ST.scorchT = (ST.scorchT || 0) - dt) <= 0){ ST.scorchT = 0.25; try { if (window.SGFX && SGFX.scorch) SGFX.scorch(hx, hy, 6); } catch (e){ /* */ } try { KW_().tossTraffic(hx, hy, 18, 0.6); } catch (e){ /* */ } }
    if ((ST.sparkT = (ST.sparkT || 0) - dt) <= 0){ ST.sparkT = 0.09; if (k !== 'sky') sparks(hx, hy, hz, 14, 18); }
    MF.beamShow(o, [hx, hy, hz], k);
  }
  // ---- missiles: launches from the pods, homing, impacts
  const POD = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) POD.push([(j - 0.5)*2.6, 67.3, -2.0 + (i - 1)*2.05]);
  function missileStep(dt){
    const S = ST.S;
    if (ST.mslCool > 0) ST.mslCool -= dt;
    for (let q = ST.mslQ.length - 1; q >= 0; q--){ const Q = ST.mslQ[q]; Q.t -= dt; if (Q.t > 0) continue; ST.mslQ.splice(q, 1);
      const s = Q.side ? -1 : 1, p = POD[Q.cell], o = W(MK.BI[Q.side ? 'clavR' : 'clavL'], [s*15.2 + p[0], p[1], p[2]]), a = S.hdg + s*0.5 + (Q.cell - 2.5)*0.05;
      ST.msl.push({x:o[0], y:o[1], z:o[2], vx:Math.sin(a)*12 - Math.sin(S.hdg)*8, vy:Math.cos(a)*12 - Math.cos(S.hdg)*8, vz:55, t:0, lock:Q.lock, pt:Q.pt, puff:0, id:(ST.mslN = (ST.mslN || 0) + 1)});
      MF.snd('launch', o[0], o[1], o[2], 0.7); const F = KFXc(); if (F) try { F.flame(o[0], o[1], o[2], 0, 0, 4, 3, 7, 0.3, 0.9, 0); } catch (e){ /* */ } }
    const L = body(), F = KFXc();
    for (let i = ST.msl.length - 1; i >= 0; i--){
      const m = ST.msl[i]; m.t += dt; let tx, ty, tz;
      if (m.lock >= 0 && L[m.lock]){ const sp = L[m.lock]; tx = sp.x; ty = sp.y; tz = sp.z; } else { tx = m.pt[0]; ty = m.pt[1]; tz = m.pt[2]; }
      const sp0 = Math.hypot(m.vx, m.vy, m.vz) || 1, spd = Math.min(250, 60 + 300*m.t);
      if (m.t > 0.35){ let dx = tx - m.x, dy = ty - m.y, dz = tz - m.z; const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
        const k = Math.min(1, dt*(2.2 + 2*m.t)); let ux = m.vx/sp0 + (dx - m.vx/sp0)*k, uy = m.vy/sp0 + (dy - m.vy/sp0)*k, uz = m.vz/sp0 + (dz - m.vz/sp0)*k; const ul = Math.hypot(ux, uy, uz) || 1;
        m.vx = ux/ul*spd; m.vy = uy/ul*spd; m.vz = uz/ul*spd; }
      else { m.vz -= 30*dt; }
      m.x += m.vx*dt; m.y += m.vy*dt; m.z += m.vz*dt;
      if (F && (m.puff -= dt) <= 0){ m.puff = 0.035; try { F.flame(m.x, m.y, m.z, -m.vx*0.05, -m.vy*0.05, -m.vz*0.05, 1.6, 3.2, 0.18, 0.9, 0); F.dust(m.x, m.y, m.z, 0, 0, 0.6, 2.2, 9, 3.5, [0.62, 0.62, 0.6], 0.5, 0.3); } catch (e){ /* */ } }
      let boom = null;
      for (let j = 0; j < L.length; j++){ const s = L[j]; if (Math.hypot(m.x - s.x, m.y - s.y, m.z - s.z) < s.r + 3){ boom = 'kaiju'; break; } }
      if (!boom){ const g = gnd(m.x, m.y); if (m.z < g + 1) boom = 'ground'; else if (((ST.frame + m.id) & 1) === 0 && m.z < 650 && bldAt(m.x, m.y, m.z, 2)) boom = 'bld'; }
      if (!boom && m.t > 7) boom = 'air';
      if (boom){ ST.msl.splice(i, 1);
        try { if (window.SGFX && SGFX.explosion) SGFX.explosion(m.x, m.y, m.z, boom === 'kaiju' ? 0.9 : 0.75); } catch (e){ /* */ }
        try { if (window.SGAudio && SGAudio.fx) SGAudio.fx('explosion', {x:m.x, y:m.y, z:m.z, k:0.55}); } catch (e){ /* */ }
        if (boom === 'kaiju') hurt(18, m.x, m.y, m.z, 1.5, 'missile'); else if (boom !== 'air') blast(m.x, m.y, m.z, 18, 0.75);
        shake(0.35, m.x, m.y, m.z, 220); }
    }
    MF.mslShow(ST.msl);
  }
  // ---- the carried rock, thrown
  function projStep(dt){
    const L = body();
    for (let i = ST.proj.length - 1; i >= 0; i--){ const p = ST.proj[i]; p.t += dt; p.vz -= 9.81*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.z += p.vz*dt;
      let hit = null; for (let j = 0; j < L.length; j++){ const s = L[j]; if (Math.hypot(p.x - s.x, p.y - s.y, p.z - s.z) < s.r + p.s*0.6){ hit = 'kaiju'; break; } }
      if (!hit){ if (p.z < gnd(p.x, p.y) + p.s*0.3) hit = 'ground'; else if (p.z < 650 && bldAt(p.x, p.y, p.z, p.s*0.5)) hit = 'bld'; }
      if (!hit && p.t > 12) hit = 'air';
      if (hit){ ST.proj.splice(i, 1); MF.rockHide(p);
        if (hit === 'kaiju'){ hurt(110, p.x, p.y, p.z, 14, 'rock'); sparks(p.x, p.y, p.z, 40, 20); }
        else blast(p.x, p.y, Math.max(p.z, gnd(p.x, p.y)), 30, 0.9);
        const F = KFXc(); if (F) try { F.impact(p.x, p.y, p.z, 26, wet(p.x, p.y), 1, 8, p.s/6); for (let k = 0; k < 6; k++){ const a = k*1.05; F.chunk(p.x, p.y, p.z + 2, Math.cos(a)*14, Math.sin(a)*14, 10 + k, p.s*0.3, p.col, 40); } } catch (e){ /* */ }
        try { if (window.SGAudio && SGAudio.fx) SGAudio.fx('crunch', {x:p.x, y:p.y, z:p.z, k:1}); } catch (e){ /* */ }
        shake(0.8, p.x, p.y, p.z, 260); continue; }
      MF.rockPose(p, dt);
    }
  }
  return {body, aimUpdate, raySph, rayCity, bldAt, hurt, take, onKj, punch, grab, stomp, missiles, throwRock, actions, beam, missileStep, projStep, bodyCity, contacts, crushAt, blast, muzzleW, fistW, W, shake, kjS, kjT, POD};
})();

// ---- 40_fx.js ----
/* ================= effects and sound: the beam, the missiles, the carried rock, the drop's thrusters; own synthesis =================
   Particles reuse the creature mode's pools (KFX: dust, flames, debris, physics chunks, fires) and the flying mode's SGFX
   (explosions, sparks, scorch marks). Own meshes (built on first use): the beam (two additive cylinders: core and glow, a flare at
   the muzzle and at the impact), 24 instanced missiles, the rock. Sound on window.SGAudio's live context and its 'fx' bus (as the
   creature mode does), delayed and damped by the distance, panned: footfalls (a deep thud, a metal clank, hydraulic hiss), servo
   whine, punch whoosh / impact, shield zap, armour clang, the beam's hum (a loop while it fires), missile launches, the stomp, an
   alarm at low armour, a short fanfare. Nothing plays while the sound is off. */
const MF = (() => {
  // ---- meshes
  const BEAM_VS = 'varying vec3 vN; varying vec3 vV; varying float vY; void main(){ vY = position.y + 0.5; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }';
  const BEAM_FS = 'uniform vec3 uC; uniform float uA; uniform float uT; varying vec3 vN; varying vec3 vV; varying float vY; void main(){ float f = abs(dot(normalize(vN), normalize(vV))); float w = pow(f, 1.6); float n = 0.82 + 0.18 * sin(vY * 140.0 - uT * 60.0); gl_FragColor = vec4(uC * w * n * uA, w * uA); }';
  let FX = null;
  function ensure(){
    if (FX) return FX;
    const g = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true);
    const mk = (c, a) => new THREE.ShaderMaterial({uniforms:{uC:{value:new THREE.Color(c)}, uA:{value:a}, uT:{value:0}}, vertexShader:BEAM_VS, fragmentShader:BEAM_FS, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide});
    const core = new THREE.Mesh(g, mk(0xf2fdff, 1.0)), glow = new THREE.Mesh(g, mk(0x58d8ff, 0.55));
    for (const m of [core, glow]){ m.frustumCulled = false; m.visible = false; m.renderOrder = 8; scene.add(m); }
    // flares (muzzle, impact): additive sprites from a radial gradient
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const o = cv.getContext('2d'); let tex = null;
    if (o && o.createRadialGradient){ const gr = o.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(170,240,255,0.85)'); gr.addColorStop(1, 'rgba(60,180,255,0)'); o.fillStyle = gr; o.fillRect(0, 0, 64, 64); tex = new THREE.CanvasTexture(cv); }
    const fm = () => new THREE.SpriteMaterial({map:tex, color:0xffffff, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, fog:false});
    const fl0 = new THREE.Sprite(fm()), fl1 = new THREE.Sprite(fm()); for (const s of [fl0, fl1]){ s.visible = false; s.renderOrder = 9; scene.add(s); }
    // missiles: a body, a nose cone, four fins (merged), instanced
    const mg = missileGeo(), mm = new THREE.MeshLambertMaterial({color:0xd8d4c8}), msl = new THREE.InstancedMesh(mg, mm, 24); msl.count = 0; msl.frustumCulled = false; msl.name = 'mech_missiles'; scene.add(msl);
    FX = {core, glow, fl0, fl1, msl, rock:null, t:0}; return FX;
  }
  function missileGeo(){
    const parts = [new THREE.CylinderGeometry(0.5, 0.5, 5, 8), new THREE.ConeGeometry(0.5, 1.6, 8)]; parts[1].translate(0, 3.3, 0);
    for (let k = 0; k < 4; k++){ const f = new THREE.BoxGeometry(0.08, 1.4, 1.0); f.translate(0, -2.0, 0.75); f.rotateY(k*PI/2); parts.push(f); }
    const pos = [], nrm = []; for (const p of parts){ const q = p.index ? p.toNonIndexed() : p; pos.push(...q.attributes.position.array); nrm.push(...q.attributes.normal.array); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.rotateX(PI/2); return g;   // nose along +z
  }
  // the beam from o to h (world [x, y, z]); k what it hits; null hides it
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _dir = new THREE.Vector3(), _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion();
  function beamShow(o, h, k){
    const F = ensure(); if (!o){ F.core.visible = F.glow.visible = F.fl0.visible = F.fl1.visible = false; beamSnd(false); return; }
    F.t += 1/60; _a.set(o[0], o[2], -o[1]); _b.set(h[0], h[2], -h[1]); _dir.subVectors(_b, _a); const L = _dir.length(); _dir.normalize(); _q.setFromUnitVectors(_up, _dir);
    const fl = 0.85 + 0.15*Math.sin(F.t*53) + 0.08*Math.sin(F.t*91);
    for (const [m, r] of [[F.core, 1.3*fl], [F.glow, 4.2*fl]]){ m.visible = true; m.position.copy(_a).addScaledVector(_dir, L/2); m.quaternion.copy(_q); m.scale.set(r, L, r); m.material.uniforms.uT.value = F.t; }
    F.fl0.visible = true; F.fl0.position.copy(_a); F.fl0.scale.setScalar(16*fl); F.fl1.visible = k !== 'sky'; F.fl1.position.copy(_b); F.fl1.scale.setScalar((k === 'kaiju' ? 46 : 34)*fl);
    beamSnd(true, o, h);
  }
  // instanced missiles along their velocity
  const _o = new THREE.Object3D();
  function mslShow(L){
    const F = ensure(), M = F.msl; let n = 0;
    for (const m of L){ if (n >= 24) break; _o.position.set(m.x, m.z, -m.y); _a.set(m.x + m.vx, m.z + m.vz, -(m.y + m.vy)); _o.lookAt(_a); _o.updateMatrix(); M.setMatrixAt(n++, _o.matrix); }
    M.count = n; M.instanceMatrix.needsUpdate = true; M.visible = n > 0;
  }
  // the rock: an irregular block in the building's colour (in the right hand while carried, then flying and tumbling)
  function rockMake(C){
    const F = ensure(); if (F.rock){ scene.remove(F.rock); F.rock.geometry.dispose(); F.rock.material.dispose(); }
    const g = new THREE.DodecahedronGeometry(C.s*0.6, 0), p = g.attributes.position, sd = (C.s*1000) | 0;
    // (the polyhedron is not indexed: the same corner gets the same factor from a hash of its position, so the faces stay closed)
    for (let i = 0; i < p.count; i++){ const x = p.getX(i), y = p.getY(i), z = p.getZ(i), h = mulb((Math.round(x*50)*73856093) ^ (Math.round(y*50)*19349663) ^ (Math.round(z*50)*83492791) ^ sd)(), k = 0.75 + h*0.5; p.setXYZ(i, x*k*1.2, y*k*0.85, z*k); }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({color:new THREE.Color(C.col[0]*0.9, C.col[1]*0.9, C.col[2]*0.9), flatShading:true})); m.castShadow = true; m.name = 'mech_rock'; scene.add(m); F.rock = m; C.mesh = m; return m;
  }
  function rockHold(){ const F = FX; if (!F || !F.rock || !ST.carry) return; const h = MC.W(MK.BI.handR, [-15.6, 24.8, 0.9]); F.rock.visible = true; F.rock.position.set(h[0], h[2] + ST.carry.s*0.25, -h[1]); }
  function rockThrow(){
    const C = ST.carry; if (!C) return; ST.carry = null; const S = ST.S, h = MC.W(MK.BI.handR, [-15.6, 24.8, 0.9]), A = ST.aim;
    let dx = A.x - h[0], dy = A.y - h[1], dz = A.z - h[2]; const dh = Math.hypot(dx, dy) || 1, v = 175, T = Math.max(0.2, Math.hypot(dh, dz)/v);
    ST.proj.push({x:h[0], y:h[1], z:h[2], vx:dx/T, vy:dy/T, vz:dz/T + 0.5*9.81*T, t:0, s:C.s, col:C.col, mesh:C.mesh, w:[1.3, 0.7, 2.1]}); void S;
  }
  function rockPose(p){ if (!p.mesh) return; p.mesh.visible = true; p.mesh.position.set(p.x, p.z, -p.y); p.mesh.rotation.set(p.t*p.w[0], p.t*p.w[1], p.t*p.w[2]); }
  function rockHide(p){ if (p.mesh){ p.mesh.visible = false; } }
  function hideAll(){ if (!FX) return; beamShow(null); FX.msl.count = 0; FX.msl.visible = false; if (FX.rock) FX.rock.visible = false; }
  // ---------------- sound (own synthesis on SGAudio's context) ----------------
  function au(){ try { const A = window.SGAudio, E = A && A._test && A._test.LIVE; if (!A || !A.on || !E || !E.ctx || E.ctx.state !== 'running') return null; return E; } catch (e){ return null; } }
  const camD = (x, y, z) => { const c = camera.position; return Math.hypot(c.x - x, c.y - (z || 0), -c.z - y); };
  function panOf(x, y){ try { const c = camera.position, v = new THREE.Vector3(x - c.x, 0, -y - c.z), r = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); return v.normalize().dot(r.setY(0).normalize()) || 0; } catch (e){ return 0; } }
  const NB = {ctx:null, b:null};
  function noise(c){ if (NB.ctx === c && NB.b) return NB.b; const n = Math.floor(c.sampleRate*2), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0), r = mulb(4242); for (let i = 0; i < n; i++) d[i] = r()*2 - 1; NB.ctx = c; NB.b = b; return b; }
  function voice(x, y, z, k, reach){
    const E = au(); if (!E) return null; const c = E.ctx, d = camD(x, y, z), att = Math.min(1, (reach || 1.6)/(1 + d/600))*(k || 1); if (att < 0.015) return null;
    const g = c.createGain(), dst = (E.bus && (E.bus.fx || E.bus.f1)) || E.out; let n = g;
    if (c.createStereoPanner){ const p = c.createStereoPanner(); p.pan.value = clamp(panOf(x, y), -0.8, 0.8); g.connect(p); n = p; }
    n.connect(dst); if (E.rvIn && d > 250){ const s = c.createGain(); s.gain.value = Math.min(0.7, d/2500); g.connect(s); s.connect(E.rvIn); }
    return {c, g, t0:c.currentTime + Math.min(5, d/343) + 0.01, att};
  }
  const env = (g, t0, a, peak, hold, rel) => { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + a); g.gain.setValueAtTime(Math.max(0.0002, peak), t0 + a + hold); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + hold + rel); };
  function osc(c, type, f, t0, dur, dst, gain){ const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); g.gain.value = gain === undefined ? 1 : gain; o.connect(g); g.connect(dst); o.start(t0); o.stop(t0 + dur + 0.05); return o; }
  function nz(c, t0, dur, dst, type, f, q, gain){ const s = c.createBufferSource(), b = c.createBiquadFilter(), g = c.createGain(); s.buffer = noise(c); s.loop = true; b.type = type; b.frequency.value = f; if (q) b.Q.value = q; g.gain.value = gain === undefined ? 1 : gain; s.connect(b); b.connect(g); g.connect(dst); s.start(t0, (t0*7.31) % 1.5); s.stop(t0 + dur + 0.05); return {s, b, g}; }
  const SND = {
    step(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.005, 0.95*att*k, 0.05, 0.9); const o = osc(c, 'sine', 62, t0, 1.0, g, 1); o.frequency.exponentialRampToValueAtTime(26, t0 + 0.6);
      nz(c, t0, 0.5, g, 'lowpass', 300, 0.7, 0.9); const cl = nz(c, t0 + 0.02, 0.25, g, 'bandpass', 1300, 6, 0.35); cl.g.gain.setValueAtTime(0.35, t0 + 0.02); cl.g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
      const h = nz(c, t0 + 0.12, 0.6, g, 'highpass', 3500, 0.5, 0.0); h.g.gain.setValueAtTime(0.0001, t0 + 0.12); h.g.gain.exponentialRampToValueAtTime(0.16*k, t0 + 0.2); h.g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7); },
    servo(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.06, 0.22*att*k, 0.25, 0.3); const o = osc(c, 'sawtooth', 190, t0, 0.7, g, 0.5); o.frequency.linearRampToValueAtTime(310, t0 + 0.45); const b = c.createBiquadFilter(); void b; nz(c, t0, 0.6, g, 'bandpass', 900, 3, 0.4); },
    whoosh(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.12, 0.45*att*k, 0.08, 0.35); const n = nz(c, t0, 0.6, g, 'bandpass', 300, 1.2, 1); n.b.frequency.exponentialRampToValueAtTime(1400, t0 + 0.3); },
    punch(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.003, 1.0*att*k, 0.05, 1.2); for (const [f, a] of [[96, 1], [187, 0.45], [413, 0.3], [771, 0.18]]){ const o = osc(c, f > 300 ? 'square' : 'sine', f, t0, 1.3, g, a*0.5); o.frequency.exponentialRampToValueAtTime(f*0.7, t0 + 1.1); } nz(c, t0, 0.4, g, 'lowpass', 900, 0.8, 0.8); },
    punchB(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.004, 0.7*att*k, 0.05, 0.8); osc(c, 'sine', 70, t0, 0.9, g, 0.8).frequency.exponentialRampToValueAtTime(32, t0 + 0.7); nz(c, t0, 0.7, g, 'lowpass', 600, 0.7, 0.9); },
    clang(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.002, 0.8*att*k, 0.04, 1.4); for (const [f, a] of [[233, 0.5], [517, 0.35], [1131, 0.22], [1907, 0.12]]) osc(c, 'triangle', f, t0, 1.5, g, a); nz(c, t0, 0.3, g, 'bandpass', 2400, 2, 0.4); },
    shield(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.004, 0.55*att*k, 0.06, 0.45); const o = osc(c, 'sine', 1500, t0, 0.6, g, 0.6); o.frequency.exponentialRampToValueAtTime(260, t0 + 0.45); const o2 = osc(c, 'square', 760, t0, 0.3, g, 0.12); o2.frequency.exponentialRampToValueAtTime(180, t0 + 0.3); },
    launch(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.01, 0.5*att*k, 0.1, 0.9); const n = nz(c, t0, 1.1, g, 'bandpass', 500, 0.9, 1); n.b.frequency.exponentialRampToValueAtTime(2600, t0 + 0.8); osc(c, 'sine', 120, t0, 0.25, g, 0.6).frequency.exponentialRampToValueAtTime(50, t0 + 0.2); },
    stomp(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.004, 1.0*att*k, 0.1, 2.0); osc(c, 'sine', 48, t0, 2.2, g, 1).frequency.exponentialRampToValueAtTime(20, t0 + 1.8); nz(c, t0, 1.6, g, 'lowpass', 220, 0.7, 1); },
    overheat(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.01, 0.35*att*k, 0.6, 0.4); for (let i = 0; i < 3; i++) osc(c, 'square', 660, t0 + i*0.22, 0.12, g, 0.25); nz(c, t0, 1.0, g, 'highpass', 2500, 0.5, 0.5); },
    alarm(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.01, 0.22*att*k, 0.75, 0.1); osc(c, 'square', 880, t0, 0.38, g, 0.4); osc(c, 'square', 660, t0 + 0.4, 0.38, g, 0.4); },
    fanfare(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.01, 0.3*att*k, 1.6, 0.6); [523, 659, 784, 1047].forEach((f, i) => osc(c, 'square', f, t0 + i*0.16, i === 3 ? 0.9 : 0.15, g, 0.3)); },
    down(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.02, 0.4*att*k, 1.0, 1.0); const o = osc(c, 'sawtooth', 440, t0, 2.0, g, 0.3); o.frequency.exponentialRampToValueAtTime(55, t0 + 1.8); },
    thrust(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.3, 0.7*att*k, 2.2, 0.8); nz(c, t0, 3.4, g, 'lowpass', 700, 0.6, 1); osc(c, 'sawtooth', 70, t0, 3.4, g, 0.25); }
  };
  function snd(name, x, y, z, k){ try { const f = SND[name]; if (!f) return; const V = voice(x, y, z, 1, name === 'alarm' || name === 'fanfare' ? 40 : 1.8); if (V) f(V, k === undefined ? 1 : k); } catch (e){ /* optional */ } }
  // the beam's hum: a loop while it fires
  const BS = {on:false, o:null};
  function beamSnd(on, o, h){
    try { const E = au(); if (!on || !E){ if (BS.on && BS.n){ const c = BS.n.c, t = c.currentTime; BS.n.g.gain.cancelScheduledValues(t); BS.n.g.gain.setTargetAtTime(0.0001, t, 0.08); const N = BS.n; setTimeout(() => { try { for (const s of N.src) s.stop(); N.g.disconnect(); } catch (e){ /* */ } }, 600); } BS.on = false; BS.n = null; return; }
      const c = E.ctx, x = o ? o[0] : 0, y = o ? o[1] : 0, z = o ? o[2] : 0, d = camD(x, y, z), att = Math.min(1, 1.6/(1 + d/600));
      if (!BS.on){ const g = c.createGain(), dst = (E.bus && (E.bus.fx || E.bus.f1)) || E.out; g.gain.value = 0.0001; g.connect(dst); const t = c.currentTime, src = [];
        for (const [f, ty, a] of [[110, 'sawtooth', 0.35], [111.6, 'sawtooth', 0.3], [221, 'square', 0.08]]){ const os = c.createOscillator(), og = c.createGain(); os.type = ty; os.frequency.value = f; og.gain.value = a; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600; os.connect(og); og.connect(lp); lp.connect(g); os.start(t); src.push(os); }
        const ns = c.createBufferSource(); ns.buffer = noise(c); ns.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 1.4; const ng = c.createGain(); ng.gain.value = 0.25; ns.connect(bp); bp.connect(ng); ng.connect(g); ns.start(t); src.push(ns);
        BS.n = {c, g, src}; BS.on = true; }
      BS.n.g.gain.setTargetAtTime(0.32*att, c.currentTime, 0.05); void h;
    } catch (e){ BS.on = false; }
  }
  return {ensure, beamShow, mslShow, rockMake, rockHold, rockThrow, rockPose, rockHide, hideAll, snd, beamSnd, get FX(){ return FX; }};
})();

// ---- 50_ui.js ----
/* ================= the HUD (minimal, retro), phone controls, the controls card, the quit confirm, the result card =================
   Top left: the mech's shield and armour (segmented bars); top centre: the creature's hit points; top right: icon buttons (controls,
   camera distance, quit) - icon buttons carry no text labels (title / aria-label only). Centre: the crosshair (red over the creature,
   a hit marker when a blow lands). Bottom centre: the weapons (beam heat, missile reload, the carried rock). Red vignette when hit.
   Phones (window.CB_MOBILE or a coarse pointer): a move stick on the left (pushed to the rim = run), drag anywhere on the right to
   look, icon buttons for punch, beam (hold), missiles, grab / throw, stomp. English text only. */
const MU = (() => {
  const SVG = (p, vb) => `<svg viewBox="${vb || '0 0 24 24'}" aria-hidden="true">${p}</svg>`;
  const IC = {
    mech:SVG('<path d="M9 3h6v4H9zM5 8h14v7h-3v6h-3v-6h-2v6H8v-6H5z" fill="currentColor"/>'),
    foe:SVG('<path d="M12 2c4 0 6 3 6 6.5 0 2-1 3.4-2 4.3l1.2 6.2-2.2-1.4-1 2.4-1-3-1 3-1-2.4-2.2 1.4L9 12.8C8 11.9 7 10.5 7 8.5 7 5 8 2 12 2z" fill="currentColor"/>'),
    fist:SVG('<path d="M6 9h11a2 2 0 012 2v4a6 6 0 01-6 6h-2a5 5 0 01-5-5zM6 9V6a2 2 0 014 0v3M10 9V5a2 2 0 014 0v4M14 9V6a2 2 0 014 0v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'),
    beam:SVG('<path d="M3 15l7-3-1 4 12-8-7 3 1-4z" fill="currentColor"/><path d="M2 20h20" stroke="currentColor" stroke-width="2"/>'),
    rocket:SVG('<path d="M14 3c4 0 7 3 7 7l-7 7-4-4zM10 13l-4 1-3 3 4 1M11 14l-1 4-3 3-1-4" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.6" fill="#111"/>'),
    grab:SVG('<path d="M7 12V5a1.6 1.6 0 013.2 0v6M10.2 11V3.8a1.6 1.6 0 013.2 0V11M13.4 11V5a1.6 1.6 0 013.2 0v7M16.6 12V8a1.6 1.6 0 013.2 0v6a8 8 0 01-8 8h-1a7 7 0 01-6-3.5L3 14a1.6 1.6 0 012.6-1.9L7 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'),
    foot:SVG('<path d="M7 2h7v9l6 4v5H4v-5l3-2z" fill="currentColor"/><path d="M2 22h20" stroke="currentColor" stroke-width="2"/>'),
    run:SVG('<path d="M4 6l6 6-6 6M12 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4"/>'),
    rock:SVG('<path d="M5 9l5-5 7 2 3 7-4 7-9-1-3-6z" fill="currentColor"/>'),
    help:SVG('<path d="M9 9a3 3 0 116 0c0 2-3 2.5-3 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="18.5" r="1.4" fill="currentColor"/>'),
    cam:SVG('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>'),
    x:SVG('<path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>'),
    ok:SVG('<path d="M4 12l5 5L20 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>'),
    retry:SVG('<path d="M20 12a8 8 0 11-2.4-5.7M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'),
    clock:SVG('<circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9v4l3 2" fill="none" stroke="currentColor" stroke-width="2"/>'),
    bld:SVG('<path d="M4 21V9l5-3v15M9 21V3h8v18M17 21V10h3v11M2 21h20" fill="none" stroke="currentColor" stroke-width="1.8"/>'),
    shield:SVG('<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" fill="currentColor"/>')
  };
  const CSS = `
.mh,.mh *{box-sizing:border-box}
.mh{position:fixed;inset:0;pointer-events:none;z-index:60;font:500 11px/1.25 var(--font-mono,ui-monospace,Menlo,Consolas,monospace);color:#ece6d6;letter-spacing:.06em;text-transform:uppercase}
.mh[hidden],.mhtouch[hidden],.mhcard[hidden],.mhhelp[hidden]{display:none!important}
.mh svg{width:15px;height:15px;display:block}
.mhbox{position:absolute;background:rgba(14,14,12,.74);border:1px solid rgba(236,230,214,.32);padding:7px 9px;backdrop-filter:blur(2px)}
.mhme{left:12px;top:12px;width:236px}.mhfoe{left:50%;top:12px;transform:translateX(-50%);width:min(420px,52vw)}
.mhrow{display:flex;align-items:center;gap:7px;margin:3px 0}.mhrow .mhn{min-width:42px;text-align:right;font-variant-numeric:tabular-nums}
.mhbar{flex:1;height:10px;border:1px solid rgba(236,230,214,.45);position:relative;overflow:hidden;background:rgba(0,0,0,.35)}
.mhbar i{position:absolute;left:0;top:0;bottom:0;width:100%;background:#ece6d6;transition:width .12s}
.mhbar:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 9px,rgba(14,14,12,.9) 9px 11px)}
.mhbar.sh i{background:#8de9ff}.mhbar.hp i{background:#ffb03a}.mhbar.hp.low i{background:#ff4b36;animation:mhbl .5s steps(2) infinite}.mhbar.foe i{background:#ff4b36}
.mhfoe .mhname{display:flex;justify-content:space-between;gap:8px;margin-bottom:3px}.mhfoe .mhname b{font-weight:700;letter-spacing:.14em}
.mhbtns{position:absolute;right:12px;top:12px;display:flex;gap:6px;pointer-events:auto}
.mhb{width:34px;height:34px;display:grid;place-items:center;background:rgba(14,14,12,.78);border:1px solid rgba(236,230,214,.45);color:#ece6d6;cursor:pointer;padding:0}
.mhb:hover{background:#ece6d6;color:#141410}.mhb svg{width:17px;height:17px}
.mhx{position:absolute;left:50%;top:50%;width:44px;height:44px;margin:-22px 0 0 -22px;color:rgba(236,230,214,.9)}
.mhx svg{width:44px;height:44px}.mhx.on{color:#ff4b36}.mhx .hm{opacity:0;transition:opacity .08s}.mhx.hit .hm{opacity:1}
.mhw{left:50%;bottom:16px;transform:translateX(-50%);display:flex;gap:12px;align-items:center}
.mhw .mhwi{display:flex;align-items:center;gap:6px}.mhw .mhbar{width:84px;flex:none;height:8px}.mhw .mhbar i{background:#8de9ff}.mhw .mhbar.hot i{background:#ff4b36}
.mhw .mhwi.off{opacity:.35}.mhw .mhwi.rk{display:none}.mhw .mhwi.rk.on{display:flex;color:#ffb03a}
.mhtoast{position:absolute;left:50%;top:18%;transform:translateX(-50%);padding:6px 12px;background:rgba(14,14,12,.8);border:1px solid rgba(236,230,214,.4);letter-spacing:.16em;opacity:0;transition:opacity .25s;white-space:nowrap}
.mhvig{position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse at center,transparent 55%,rgba(255,40,20,.55) 100%)}
.mhscan{position:absolute;inset:0;opacity:.07;background:repeating-linear-gradient(0deg,transparent 0 2px,#000 2px 3px)}
.mhhelp{position:fixed;right:12px;top:56px;z-index:61;pointer-events:auto;width:270px}
.mhhelp dl{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;margin:0}.mhhelp dt{color:#ffb03a}.mhhelp dd{margin:0;text-transform:none;letter-spacing:.02em}
.mhcard{position:fixed;inset:0;z-index:62;display:grid;place-items:center;background:rgba(0,0,0,.42);pointer-events:auto;font:500 12px/1.4 var(--font-mono,ui-monospace,Menlo,Consolas,monospace);color:#ece6d6;letter-spacing:.06em}
.mhcard .mhc{background:rgba(14,14,12,.92);border:1px solid rgba(236,230,214,.45);padding:18px 20px;min-width:min(340px,86vw);max-width:92vw}
.mhcard h2{margin:0 0 4px;font:700 26px/1.1 var(--font-mono,ui-monospace,monospace);letter-spacing:.2em;text-transform:uppercase}.mhcard h2.win{color:#9cff7a}.mhcard h2.lose{color:#ff6a4a}
.mhcard .sub{opacity:.7;margin-bottom:12px;text-transform:uppercase;font-size:11px}
.mhcard dl{display:grid;grid-template-columns:18px 1fr auto;gap:5px 9px;align-items:center;margin:0 0 14px}.mhcard dl svg{width:15px;height:15px}.mhcard dd{margin:0;text-align:right;font-variant-numeric:tabular-nums}.mhcard dt{text-transform:uppercase;font-size:11px;opacity:.85}
.mhcard .row{display:flex;gap:8px;justify-content:flex-end}.mhcard .mhb{width:44px;height:40px}.mhcard .mhb.pri{background:#ece6d6;color:#141410}
.mhtouch{position:fixed;inset:0;z-index:59;pointer-events:none;touch-action:none}
.mhstick{position:absolute;left:18px;bottom:22px;width:132px;height:132px;border-radius:50%;border:1px solid rgba(236,230,214,.45);background:rgba(14,14,12,.3);pointer-events:auto;touch-action:none}
.mhstick i{position:absolute;left:50%;top:50%;width:54px;height:54px;margin:-27px 0 0 -27px;border-radius:50%;background:rgba(236,230,214,.55)}
.mhlook{position:absolute;right:0;top:64px;bottom:0;width:58%;pointer-events:auto;touch-action:none}
.mhact{position:absolute;right:14px;bottom:18px;display:grid;grid-template-columns:repeat(3,54px);gap:8px;pointer-events:auto}
.mhact .mhb{width:54px;height:54px}.mhact .mhb svg{width:24px;height:24px}.mhact .mhb.big{grid-column:3;grid-row:2 / span 2;height:116px}.mhact .mhb.on{background:#ece6d6;color:#141410}
@keyframes mhbl{50%{opacity:.4}}
@media (max-width:640px){.mhme{width:170px}.mhfoe{top:56px;width:62vw}.mhw{bottom:auto;top:96px}}
`;
  const U = {done:false};
  function init(){
    if (U.done) return U; U.done = true;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const h = document.createElement('div'); h.className = 'mh'; h.hidden = true;
    h.innerHTML = `<div class="mhscan"></div><div class="mhvig"></div>
<div class="mhbox mhme"><div class="mhrow" title="Shield">${IC.shield}<div class="mhbar sh"><i></i></div><span class="mhn" data-k="sh">400</span></div><div class="mhrow" title="Armour">${IC.mech}<div class="mhbar hp"><i></i></div><span class="mhn" data-k="hp">1000</span></div></div>
<div class="mhbox mhfoe"><div class="mhname"><span style="display:flex;gap:6px;align-items:center">${IC.foe}<b data-k="fn">CREATURE</b></span><span data-k="fp">100%</span></div><div class="mhbar foe"><i></i></div></div>
<div class="mhbtns"><button type="button" class="mhb" data-k="help" title="Controls" aria-label="Controls">${IC.help}</button><button type="button" class="mhb" data-k="cam" title="Camera distance (V)" aria-label="Camera distance">${IC.cam}</button><button type="button" class="mhb" data-k="quit" title="Quit (Esc)" aria-label="Quit">${IC.x}</button></div>
<div class="mhx">${SVG('<circle cx="22" cy="22" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M22 4v9M22 31v9M4 22h9M31 22h9" stroke="currentColor" stroke-width="1.6"/><path class="hm" d="M12 12l6 6M32 12l-6 6M12 32l6-6M32 32l-6-6" stroke="#ffb03a" stroke-width="2.4"/>', '0 0 44 44')}</div>
<div class="mhbox mhw"><span class="mhwi" data-k="beam" title="Beam heat">${IC.beam}<span class="mhbar"><i></i></span></span><span class="mhwi" data-k="msl" title="Missiles">${IC.rocket}<span class="mhbar"><i></i></span></span><span class="mhwi rk" data-k="rock" title="Carrying a rock">${IC.rock}</span></div>
<div class="mhtoast"></div>`;
    document.body.appendChild(h); U.h = h;
    const q = k => h.querySelector(`[data-k="${k}"]`);
    U.q = {sh:q('sh'), hp:q('hp'), fn:q('fn'), fp:q('fp'), shB:h.querySelector('.mhbar.sh i'), hpB:h.querySelector('.mhbar.hp i'), hpBar:h.querySelector('.mhbar.hp'), foeB:h.querySelector('.mhbar.foe i'),
      x:h.querySelector('.mhx'), beam:q('beam'), beamB:q('beam').querySelector('i'), beamBar:q('beam').querySelector('.mhbar'), msl:q('msl'), mslB:q('msl').querySelector('i'), rock:q('rock'), toast:h.querySelector('.mhtoast'), vig:h.querySelector('.mhvig')};
    q('help').addEventListener('click', e => { e.stopPropagation(); help(); });
    q('cam').addEventListener('click', e => { e.stopPropagation(); MG.camCycle(); });
    q('quit').addEventListener('click', e => { e.stopPropagation(); ask(); });
    // the controls card
    const hp = document.createElement('div'); hp.className = 'mh mhbox mhhelp'; hp.hidden = true; hp.style.position = 'fixed'; hp.style.inset = 'auto'; hp.style.right = '12px'; hp.style.top = '56px';
    hp.innerHTML = `<dl><dt>W A S D</dt><dd>Walk (arrows too)</dd><dt>Shift</dt><dd>Run</dd><dt>Mouse</dt><dd>Look (click to lock the pointer; drag works too)</dd><dt>Left click · E</dt><dd>Punch (throws a carried rock)</dd><dt>Right click · R</dt><dd>Arm beam (hold)</dd><dt>Q</dt><dd>Missile salvo</dd><dt>F</dt><dd>Grab the creature · rip a chunk off a building · throw it</dd><dt>Space</dt><dd>Stomp</dd><dt>V · wheel</dt><dd>Camera distance</dd><dt>Esc</dt><dd>Quit</dd></dl>`;
    document.body.appendChild(hp); U.help = hp;
    // quit confirm
    const a = document.createElement('div'); a.className = 'mhcard'; a.hidden = true;
    a.innerHTML = `<div class="mhc" role="dialog" aria-label="Quit"><h2>Leave the fight?</h2><div class="sub">The city is restored.</div><div class="row"><button type="button" class="mhb" data-k="stay" title="Keep fighting" aria-label="Keep fighting">${IC.x}</button><button type="button" class="mhb pri" data-k="go" title="Quit" aria-label="Quit">${IC.ok}</button></div></div>`;
    document.body.appendChild(a); U.ask = a;
    a.querySelector('[data-k="stay"]').addEventListener('click', () => askHide()); a.querySelector('[data-k="go"]').addEventListener('click', () => { askHide(); MG.stop(); });
    a.addEventListener('click', e => { if (e.target === a) askHide(); });
    const r = document.createElement('div'); r.className = 'mhcard'; r.hidden = true; document.body.appendChild(r); U.res = r;
    return U;
  }
  function show(on){ init(); U.h.hidden = !on; if (!on){ U.help.hidden = true; U.ask.hidden = true; U.res.hidden = true; touch(false); } }
  function help(on){ init(); U.help.hidden = on === undefined ? !U.help.hidden : !on; }
  function ask(){ init(); if (ST.result){ MG.stop(); return; } U.ask.hidden = false; ST.paused = true; try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e){ /* */ } }
  function askHide(){ if (U.ask) U.ask.hidden = true; ST.paused = false; }
  let toastT = 0;
  function toast(s, sec){ init(); const t = U.q.toast; t.textContent = s; t.style.opacity = '1'; clearTimeout(toastT); toastT = setTimeout(() => { t.style.opacity = '0'; }, (sec || 2.2)*1000); }
  function flash(){ ST.hurtK = Math.min(1, ST.hurtK + 0.3); }
  // per frame (every few frames for the numbers)
  function tick(dt){
    if (!U.done || U.h.hidden) return; const q = U.q;
    ST.hurtK = Math.max(0, ST.hurtK - dt*1.6); q.vig.style.opacity = (ST.hurtK*0.9 + (ST.hp < ST.hpMax*0.25 ? 0.25 + 0.15*Math.sin(ST.t*6) : 0)).toFixed(2);
    ST.hitMark = Math.max(0, ST.hitMark - dt); q.x.classList.toggle('hit', ST.hitMark > 0); q.x.classList.toggle('on', ST.aim.k === 'kaiju' || ST.aim.lock >= 0);
    if ((ST.frame % 4) !== 0) return;
    q.shB.style.width = (100*ST.sh/ST.shMax).toFixed(1) + '%'; q.hpB.style.width = (100*ST.hp/ST.hpMax).toFixed(1) + '%'; q.sh.textContent = Math.round(ST.sh); q.hp.textContent = Math.round(ST.hp); q.hpBar.classList.toggle('low', ST.hp < ST.hpMax*0.25);
    let fs = null; try { fs = KJ().status().mech; } catch (e){ fs = null; } const fp = fs ? fs.hp/fs.max : 1; q.foeB.style.width = (100*fp).toFixed(1) + '%'; q.fp.textContent = Math.ceil(100*fp) + '%';
    q.beamB.style.width = (100*(1 - ST.heat)).toFixed(0) + '%'; q.beamBar.classList.toggle('hot', ST.over > 0); q.beam.classList.toggle('off', ST.over > 0);
    q.mslB.style.width = (100*(1 - Math.max(0, ST.mslCool)/11)).toFixed(0) + '%'; q.msl.classList.toggle('off', ST.mslCool > 0); q.rock.classList.toggle('on', !!ST.carry);
  }
  function foeName(s){ init(); U.q.fn.textContent = s; }
  // ---- the result card
  const fmt = s => Math.floor(s/60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  function result(win){
    init(); const r = U.res, S = ST.stats, dn = ['Easy', 'Normal', 'Hard'][ST.diff] || '';
    r.innerHTML = `<div class="mhc" role="dialog" aria-label="Result"><h2 class="${win ? 'win' : 'lose'}">${win ? 'Victory' : 'Mech down'}</h2><div class="sub">${MG.foeEn()} · ${dn}</div>
<dl>${IC.clock}<dt>Time</dt><dd>${fmt(ST.t - S.t0)}</dd>${IC.fist}<dt>Damage dealt</dt><dd>${Math.round(S.dealt)}</dd>${IC.ok}<dt>Hits landed</dt><dd>${S.hits}</dd>${IC.shield}<dt>Damage taken</dt><dd>${Math.round(S.taken)}</dd>${IC.bld}<dt>Buildings destroyed</dt><dd>${S.bld}</dd></dl>
<div class="row"><button type="button" class="mhb" data-k="exit" title="Quit" aria-label="Quit">${IC.x}</button><button type="button" class="mhb pri" data-k="again" title="Fight again" aria-label="Fight again">${IC.retry}</button></div></div>`;
    r.hidden = false; try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e){ /* */ }
    r.querySelector('[data-k="exit"]').onclick = () => MG.stop(); r.querySelector('[data-k="again"]').onclick = () => MG.retry();
  }
  // ---- phone controls: a move stick, a look area, the action buttons
  const T = {built:false, stick:{id:null, x:0, y:0, cx:0, cy:0}, look:{id:null, x:0, y:0}};
  function touchBuild(){
    if (T.built) return; T.built = true;
    const d = document.createElement('div'); d.className = 'mhtouch'; d.hidden = true;
    d.innerHTML = `<div class="mhlook"></div><div class="mhstick"><i></i></div><div class="mhact"><button type="button" class="mhb" data-a="msl" aria-label="Missiles">${IC.rocket}</button><button type="button" class="mhb" data-a="grab" aria-label="Grab or throw">${IC.grab}</button><button type="button" class="mhb big" data-a="punch" aria-label="Punch">${IC.fist}</button><button type="button" class="mhb" data-a="beam" aria-label="Beam (hold)">${IC.beam}</button><button type="button" class="mhb" data-a="stomp" aria-label="Stomp">${IC.foot}</button></div>`;
    document.body.appendChild(d); T.d = d;
    const st = d.querySelector('.mhstick'), knob = st.querySelector('i'), lk = d.querySelector('.mhlook');
    const stickSet = (x, y) => { const r = st.getBoundingClientRect(), cx = r.left + r.width/2, cy = r.top + r.height/2, R = r.width/2; let dx = x - cx, dy = y - cy; const l = Math.hypot(dx, dy); if (l > R){ dx *= R/l; dy *= R/l; }
      knob.style.transform = `translate(${dx}px,${dy}px)`; MG.touchMove(dx/R, -dy/R); };
    st.addEventListener('pointerdown', e => { e.preventDefault(); T.stick.id = e.pointerId; try { st.setPointerCapture(e.pointerId); } catch (er){ /* */ } stickSet(e.clientX, e.clientY); });
    st.addEventListener('pointermove', e => { if (e.pointerId === T.stick.id) stickSet(e.clientX, e.clientY); });
    const up = e => { if (e.pointerId !== T.stick.id) return; T.stick.id = null; knob.style.transform = ''; MG.touchMove(0, 0); };
    st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
    lk.addEventListener('pointerdown', e => { e.preventDefault(); T.look.id = e.pointerId; T.look.x = e.clientX; T.look.y = e.clientY; try { lk.setPointerCapture(e.pointerId); } catch (er){ /* */ } });
    lk.addEventListener('pointermove', e => { if (e.pointerId !== T.look.id) return; MG.look((e.clientX - T.look.x)*2.2, (e.clientY - T.look.y)*2.2); T.look.x = e.clientX; T.look.y = e.clientY; });
    const lup = e => { if (e.pointerId === T.look.id) T.look.id = null; }; lk.addEventListener('pointerup', lup); lk.addEventListener('pointercancel', lup);
    for (const b of d.querySelectorAll('[data-a]')){ const a = b.dataset.a;
      b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (a === 'beam'){ ST.beamOn = true; b.classList.add('on'); } else MG.act(a); });
      const off = () => { if (a === 'beam'){ ST.beamOn = false; b.classList.remove('on'); } }; b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off); }
  }
  function touch(on){ if (on) touchBuild(); if (T.d) T.d.hidden = !on; }
  return {init, show, help, ask, askHide, toast, flash, tick, foeName, result, touch, IC, U};
})();

// ---- 60_game.js ----
/* ================= the mode: input, the third-person camera, the frame, start / stop, results; window.SGMech =================
   Keys (a capture listener that only acts while the mode runs): W A S D / arrows walk (relative to the camera), Shift runs, E or a
   left click punches, F grabs / throws, Q fires the missiles, R or the right button holds the beam, Space stomps, V cycles the
   camera distance, Esc asks to quit. Mouse: click the view to lock the pointer and look around (or drag), wheel zooms. Phones: the
   stick, the look area and the buttons of 50_ui.js. The camera orbits a point over the mech's right shoulder (yaw / pitch / distance),
   pulled in before the ground and standing buildings; the mode sets it in the frame hook so the creature mode's calm camera shake
   (its prerender) still applies on top. The app's orbit controls, map labels and tilt-shift are put aside while the mode runs and
   restored after. */
const CAM = {yaw:0, pitch:0.14, dist:150, dists:[105, 150, 230, 360], di:1, P:null, T:null, fov:55};
const IN = {keys:new Set(), tx:0, ty:0, drag:null, on:false, saved:null};
const MG = (() => {
  const MOVE = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight']);
  const KEYS = new Set([...MOVE, 'KeyE', 'KeyF', 'KeyQ', 'KeyR', 'Space', 'KeyV', 'Escape', 'Enter']);
  const mobile = () => { try { return !!window.CB_MOBILE || (window.matchMedia && matchMedia('(pointer: coarse)').matches); } catch (e){ return false; } };
  const cvs = () => { try { return renderer.domElement; } catch (e){ return null; } };
  // ---------------- input ----------------
  if (typeof addEventListener === 'function'){
    addEventListener('keydown', e => {
      if (!ST.on) return; const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return; if (e.ctrlKey || e.metaKey || e.altKey) return;
      const c = e.code; if (!KEYS.has(c)) return; e.preventDefault(); e.stopImmediatePropagation();
      const U = MU.U; if (U.ask && !U.ask.hidden){ if (c === 'Escape') MU.askHide(); else if (c === 'Enter'){ MU.askHide(); stop(); } return; }
      if (ST.result){ if (c === 'Escape' || c === 'Enter') stop(); return; }
      if (MOVE.has(c)){ IN.keys.add(c); return; }
      if (e.repeat) return;
      if (c === 'Escape') MU.ask(); else if (c === 'KeyE') MC.punch(); else if (c === 'KeyF') MC.grab(); else if (c === 'KeyQ') act('msl'); else if (c === 'Space') MC.stomp(); else if (c === 'KeyR') ST.beamOn = true; else if (c === 'KeyV') camCycle();
    }, true);
    addEventListener('keyup', e => { if (!ST.on) return; const c = e.code; if (!KEYS.has(c)) return; IN.keys.delete(c); if (c === 'KeyR') ST.beamOn = false; e.stopImmediatePropagation(); }, true);
    addEventListener('blur', () => { IN.keys.clear(); if (ST.on) ST.beamOn = false; });
  }
  const onCanvas = e => { const c = cvs(); return c && (e.target === c || (c.parentNode && c.parentNode.contains && e.target && e.target.tagName === 'CANVAS')); };
  const PD = e => {
    if (!ST.on || e.pointerType === 'touch' || !onCanvas(e)) return; e.preventDefault(); e.stopImmediatePropagation();
    if (ST.result || ST.paused) return;
    if (e.button === 2){ ST.beamOn = true; return; }
    if (e.button !== 0) return;
    if (document.pointerLockElement === cvs()){ MC.punch(); return; }
    IN.drag = {x:e.clientX, y:e.clientY, m:0};
  };
  const PM = e => {
    if (!ST.on || e.pointerType === 'touch') return;
    if (document.pointerLockElement === cvs()){ look(e.movementX || 0, e.movementY || 0); return; }
    if (IN.drag){ const dx = e.clientX - IN.drag.x, dy = e.clientY - IN.drag.y; IN.drag.x = e.clientX; IN.drag.y = e.clientY; IN.drag.m += Math.abs(dx) + Math.abs(dy); look(dx, dy); }
  };
  const PU = e => {
    if (!ST.on || e.pointerType === 'touch') return;
    if (e.button === 2){ ST.beamOn = false; return; }
    if (IN.drag && e.button === 0){ const click = IN.drag.m < 6; IN.drag = null;
      if (click && !ST.result && !ST.paused){ MC.punch(); if (!mobile()) try { const c = cvs(), r = c && c.requestPointerLock && c.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (er){ /* no pointer lock */ } } }
  };
  const CM = e => { if (ST.on && onCanvas(e)) e.preventDefault(); };
  const WH = e => { if (!ST.on || !onCanvas(e)) return; e.preventDefault(); e.stopImmediatePropagation(); CAM.dist = clamp(CAM.dist*Math.exp(e.deltaY*0.0012), 80, 520); };
  function listen(on){
    if (IN.on === on) return; IN.on = on; const f = on ? 'addEventListener' : 'removeEventListener';
    window[f]('pointerdown', PD, true); window[f]('pointermove', PM, true); window[f]('pointerup', PU, true); window[f]('contextmenu', CM, true); window[f]('wheel', WH, {capture:true, passive:false});
  }
  function look(dx, dy){ CAM.yaw = wrapA(CAM.yaw + dx*0.0027); CAM.pitch = clamp(CAM.pitch + dy*0.0021, -0.28, 1.15); }
  function touchMove(x, y){ IN.tx = x; IN.ty = y; }
  function camCycle(){ CAM.di = (CAM.di + 1) % CAM.dists.length; CAM.dist = CAM.dists[CAM.di]; }
  function act(a, on){
    if (!ST.on) return false;
    if (a === 'punch') return MC.punch(); if (a === 'grab' || a === 'throw') return MC.grab(); if (a === 'stomp') return MC.stomp();
    if (a === 'msl' || a === 'missiles'){ const ok = MC.missiles(); if (!ok && ST.mslCool > 0) MU.toast('Missiles reloading', 1.2); return ok; }
    if (a === 'beam'){ ST.beamOn = on === undefined ? !ST.beamOn : !!on; return ST.beamOn; }
    return false;
  }
  // ---------------- the app around the mode ----------------
  function saveApp(){
    if (IN.saved) return; const s = IN.saved = {en:controls.enabled, minD:controls.minDistance, maxP:controls.maxPolarAngle, damp:controls.enableDamping, fov:camera.fov, labels:null, tilt:false};
    controls.enabled = false;
    try { keysHeld.clear(); } catch (e){ /* */ }
    try { s.labels = labelItems; labelItems = []; } catch (e){ /* */ }
    try { if (TILT.on){ s.tilt = true; setTilt(false); } } catch (e){ /* */ }
  }
  function restoreApp(){
    const s = IN.saved; if (!s) return; IN.saved = null;
    controls.enabled = s.en; controls.minDistance = s.minD; controls.maxPolarAngle = s.maxP; controls.enableDamping = s.damp; camera.fov = s.fov; camera.updateProjectionMatrix();
    try { if (s.labels && !labelItems.length) labelItems = s.labels; } catch (e){ /* */ }
    try { if (s.tilt) setTilt(true); } catch (e){ /* */ }
  }
  // ---------------- the camera ----------------
  function camStep(dt){
    const S = ST.S; if (!S) return;
    let yaw = CAM.yaw, pitch = CAM.pitch, dist = CAM.dist, sh = clamp(1 - (dist - 150)/250, 0, 1)*13, fz = 54;
    if (ST.drop){ const u = clamp(ST.drop.t/ST.drop.dur, 0, 1); dist = lerp(330, CAM.dist, sstep(0.55, 1, u)); pitch = lerp(-0.12, CAM.pitch, sstep(0.6, 1, u)); fz = lerp(40, 54, u) + (ST.dropZ || 0)*0.6; sh = 0; }
    if (ST.down || ST.won){ CAM.yaw = wrapA(CAM.yaw + dt*0.12); dist = Math.max(dist, 220); sh = 0; pitch = Math.max(pitch, 0.25); }
    const T = [S.X + Math.cos(yaw)*sh, S.Y - Math.sin(yaw)*sh, S.Zb + fz], f = [Math.sin(yaw)*Math.cos(pitch), Math.cos(yaw)*Math.cos(pitch), -Math.sin(pitch)];
    let C = [T[0] - f[0]*dist, T[1] - f[1]*dist, T[2] - f[2]*dist];
    // pulled in before the ground and standing buildings on the line from the focus
    let k = 1; for (let i = 1; i <= 8; i++){ const u = i/8, q = [T[0] + (C[0] - T[0])*u, T[1] + (C[1] - T[1])*u, T[2] + (C[2] - T[2])*u];
      if (q[2] < gnd(q[0], q[1]) + 3 || (q[2] < 600 && MC.bldAt(q[0], q[1], q[2], 4))){ k = Math.max(0.18, (i - 1)/8); break; } }
    C = [T[0] + (C[0] - T[0])*k, T[1] + (C[1] - T[1])*k, T[2] + (C[2] - T[2])*k]; C[2] = Math.max(C[2], gnd(C[0], C[1]) + 4);
    if (!CAM.P || !dt){ CAM.P = C.slice(); CAM.T = T.slice(); }
    else { const a = Math.min(1, dt*9), b = Math.min(1, dt*12); for (let i = 0; i < 3; i++){ CAM.P[i] += (C[i] - CAM.P[i])*a; CAM.T[i] += (T[i] - CAM.T[i])*b; } CAM.P[2] = Math.max(CAM.P[2], gnd(CAM.P[0], CAM.P[1]) + 3); }
    camera.position.set(CAM.P[0], CAM.P[2], -CAM.P[1]); camera.up.set(0, 1, 0); camera.lookAt(CAM.T[0], CAM.T[2], -CAM.T[1]);
    const D = Math.hypot(CAM.P[0] - CAM.T[0], CAM.P[1] - CAM.T[1], CAM.P[2] - CAM.T[2]);
    camera.fov = CAM.fov; camera.near = 1.5; camera.far = D + HALF*4.5; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    controls.target.set(S.X, S.Zb + 18, -S.Y);
  }
  // ---------------- the frame ----------------
  const SPLASH = [0.88, 0.92, 0.95], DUST = [0.52, 0.49, 0.44];
  function frame(t, dt){
    if (!ST.on) return;
    const t0 = performance.now();
    if (!(typeof SGR !== 'undefined' && SGR.on)){ stop(); return; }
    const K = KJ(); if (!K || !K.on){ stop(); return; }
    try { KG_().G.paused = !!ST.paused; } catch (e){ /* */ }
    if (ST.paused){ camStep(0); return; }
    const S = ST.S; ST.t += dt; ST.frame++;
    ST.hitStop = Math.max(0, (ST.hitStop || 0) - dt); const mdt = ST.hitStop > 0 ? dt*0.2 : dt;
    // the drop: down from the sky on thrusters
    let zoff = 0;
    if (ST.drop){ const D = ST.drop; D.t += dt; const u = clamp(D.t/D.dur, 0, 1); zoff = 430*Math.pow(1 - u, 2.2); ST.dropZ = zoff;
      const F = KFX_(); if (F && F.ensure()) for (const Fo of S.feet){ try { F.flame(Fo.x, Fo.y, Fo.z + zoff + 1, 0, 0, -30, 5, 16, 0.35, 0.95, 0); if ((ST.frame & 3) === 0) F.dust(Fo.x, Fo.y, Fo.z + zoff - 4, 0, 0, -6, 5, 22, 3, [0.5, 0.5, 0.5], 0.5, 0.5); } catch (e){ /* */ } }
      if (u >= 1){ ST.drop = null; ST.dropZ = 0; zoff = 0; S.pel.v -= 9;
        MC.blast(S.X, S.Y, S.Zb, 30, 0.8); try { F.dustWave(S.X, S.Y, S.Zb, 22, 0.8); F.impact(S.X, S.Y, S.Zb, 34, wet(S.X, S.Y), 1.2, 6, 0.8); } catch (e){ /* */ }
        try { KW_().tossTraffic(S.X, S.Y, 150, 1.4); } catch (e){ /* */ } MC.shake(1, S.X, S.Y, S.Zb, 400); MF.snd('stomp', S.X, S.Y, S.Zb, 1);
        try { if (window.SGAudio && SGAudio.fx) SGAudio.fx('explosion', {x:S.X, y:S.Y, z:S.Zb, k:0.6}); } catch (e){ /* */ } MU.toast('Engage', 1.6); } }
    // input -> the walk
    const fr = MC.actions(mdt);
    let fw = 0, rt = 0, run = false;
    if (!ST.drop && !ST.down && !ST.won && !ST.result){
      const k = IN.keys; fw = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) + IN.ty; rt = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0) + IN.tx;
      run = k.has('ShiftLeft') || k.has('ShiftRight') || Math.hypot(IN.tx, IN.ty) > 0.93; }
    const ml = Math.hypot(fw, rt), mg = Math.min(1, ml), yaw = CAM.yaw, wd = wet(S.X, S.Y);
    if (ST.resistT > 0){ ST.resistT -= dt; if (ST.resistT <= 0) ST.resist = 1; }
    const vmax = (run ? 24 : 11)*(wd ? 0.6 : 1)*ST.resist*fr.vK;
    let vx = 0, vy = 0; if (ml > 0.05){ const dx = (Math.sin(yaw)*fw + Math.cos(yaw)*rt)/ml, dy = (Math.cos(yaw)*fw - Math.sin(yaw)*rt)/ml; vx = dx*mg*vmax; vy = dy*mg*vmax; }
    if (fr.vK > 1 && ml < 0.05 && ST.act && ST.act.k === 'punch'){ vx = Math.sin(S.hdg)*6; vy = Math.cos(S.hdg)*6; }     // (the step into a punch)
    ML.loco(S, {vx, vy, hdg:fr.face, turn:run ? 0.55 : fr.face !== null && fr.face !== undefined ? 1.25 : 0.9}, mdt);
    S.X = clamp(S.X, -HALF + 400, HALF - 400); S.Y = clamp(S.Y, -HALF + 400, HALF - 400);
    if (!ST.drop) MC.contacts(dt);
    ML.pose(S);
    // the fall when it is down
    let tilt = 0; if (ST.down){ const D = ST.down; D.t += dt; const u = clamp((D.t - 1.5)/1.5, 0, 1); tilt = 1.42*u*u;
      if (u >= 1 && !D.landed){ D.landed = true; const fx = Math.sin(S.hdg), fy = Math.cos(S.hdg); for (const d of [25, 50]) MC.blast(S.X + fx*d, S.Y + fy*d, gnd(S.X + fx*d, S.Y + fy*d), 26, 0.85);
        const F = KFX_(); try { F.dustWave(S.X + fx*36, S.Y + fy*36, S.Zb, 30, 0.9); } catch (e){ /* */ } MC.shake(1, S.X, S.Y, S.Zb, 400); try { if (window.SGAudio && SGAudio.fx) SGAudio.fx('crunch', {x:S.X, y:S.Y, z:S.Zb, k:1}); } catch (e){ /* */ } }
      if (D.t > 5.2 && !ST.result){ ST.result = 'lose'; MU.result(false); } }
    MK.setPose(S.Q, S.rootP, S.X, S.Y, S.Zb + zoff, S.hdg, tilt);
    // footfalls
    for (const e of S.ev){
      if (e.e === 'land' && !ST.drop){ const water = e.water, g = e.z, F = KFX_();
        if (F && F.ensure()) try { F.impact(e.x, e.y, water ? 0 : g, 9 + 6*e.k, water, 0.45 + 0.4*e.k, water ? 0 : 2, 0.4); if (!water) for (let i = 0; i < 4; i++){ const a = i*1.57 + S.hdg; F.dust(e.x + Math.cos(a)*6, e.y + Math.sin(a)*6, g + 1, Math.cos(a)*7, Math.sin(a)*7, 1, 6, 22, 7, DUST, 0.55, 0.5); } else for (let i = 0; i < 5; i++){ const a = i*1.26; F.dust(e.x, e.y, 1, Math.cos(a)*6, Math.sin(a)*6, 9, 5, 18, 3, SPLASH, 0.7, 1); } } catch (er){ /* */ }
        MF.snd('step', e.x, e.y, g, e.k); if (water) try { if (window.SGAudio && SGAudio.fx) SGAudio.fx('splash', {x:e.x, y:e.y, z:0, k:e.k}); } catch (er){ /* */ }
        MC.shake(0.22 + 0.25*e.k, e.x, e.y, g, 150);
        try { const W = KW_(); W.tossTraffic(e.x, e.y, 34, 0.9); W.landmarkHit(e.x, e.y, g, 13, MC.kjT(), 0.35 + 0.3*e.k); } catch (er){ /* */ }
        MC.crushAt(e.x, e.y, g + 4, 8.5, Math.sin(S.hdg), Math.cos(S.hdg), 0.55 + 0.3*e.k); }
      else if (e.e === 'lift' && e.d > 6 && !ST.drop) MF.snd('servo', e.x, e.y, e.z + 10, 0.35);
    }
    camStep(dt);
    if ((ST.frame & 1) === 0 || ST.firing) MC.aimUpdate();
    MC.beam(dt); MC.missileStep(dt); MC.projStep(dt); MF.rockHold();
    if ((ST.frame & 1) === 1 && !ST.drop) MC.bodyCity();
    // shield recharge, damage smoke, the alarm
    ST.shT -= dt; if (ST.shT <= 0 && !ST.down) ST.sh = Math.min(ST.shMax, ST.sh + 55*dt);
    const F = KFX_();
    if (ST.hp < ST.hpMax*0.5 && F && (ST.smokeT -= dt) <= 0){ ST.smokeT = ST.hp < ST.hpMax*0.25 ? 0.06 : 0.14; const p = MC.W(MK.BI.chest, [ST.frame & 2 ? 4.6 : -4.6, 66, -9.6]); try { F.dust(p[0], p[1], p[2], 0, 0, 5, 3, 14, 6, [0.12, 0.12, 0.12], 0.6, 2); if (ST.hp < ST.hpMax*0.25) F.flame(p[0], p[1], p[2] - 6, 0, 0, 3, 2, 5, 0.4, 0.9, 1); } catch (e){ /* */ } }
    if (ST.hp < ST.hpMax*0.25 && !ST.down && (ST.alarmT = (ST.alarmT || 0) - dt) <= 0){ ST.alarmT = 2.6; MF.snd('alarm', S.X, S.Y, S.Zb + 50, 1); }
    // the creature hunts the mech (its box: ~20 x 20 m, 70 m tall)
    try { K.setTargets([{id:'mech', x:S.X, y:S.Y, z:S.Zb, kind:'mech', nocatch:true, hl:10, hw:10, h:70, psi:0}]); } catch (e){ /* */ }
    if ((ST.panicT -= dt) <= 0){ ST.panicT = 1; try { KW_().panicTraffic(S.X, S.Y, 260); } catch (e){ /* */ } }
    MK.lights(night(), S.hdg, S.X, S.Y, ST.firing ? 1 : 0);
    // victory
    if (ST.won){ ST.won.t += dt; if (ST.won.t > 2 && !ST.won.pose){ ST.won.pose = true; ST.act = {k:'victory', t:0, dur:4}; MF.snd('fanfare', S.X, S.Y, S.Zb + 50, 1); }
      if (!ST.result && ((ST.won.tf && ST.t - ST.won.tf > 4.5) || ST.won.t > 11)){ ST.result = 'win'; MU.result(true); } }
    MU.tick(dt);
    const ms = performance.now() - t0; ST.ms = (ST.ms || ms)*0.95 + ms*0.05; ST.msMax = Math.max((ST.msMax || 0)*0.995, ms);
  }
  // ---------------- events from the creature ----------------
  function defeated(){ if (ST.won || ST.down) return; ST.won = {t:0, tf:0}; ST.beamOn = false; ST.act = null; MU.toast('Target down', 3); }
  function fallen(){ if (ST.won) ST.won.tf = ST.t; }
  function mechDown(){
    if (ST.down || ST.won) return; ST.down = {t:0, landed:false}; ST.beamOn = false; ST.act = {k:'down', t:0, dur:1e9}; ST.pending = null; ST.mslQ.length = 0;
    if (ST.carry){ ST.carry = null; MF.hideAll(); } MF.snd('down', ST.S.X, ST.S.Y, ST.S.Zb + 40, 1); MU.toast('Mech down', 3);
    try { const G = KG_().G; if (G.sim && G.sim.win) G.sim.win(); } catch (e){ /* */ }
  }
  const foeEn = () => { try { const d = KJ().species().find(s => s.id === ST.sp); return d ? d.en : 'Creature'; } catch (e){ return 'Creature'; } };
  // ---------------- start / stop ----------------
  function landNear(x, y){ if (!wet(x, y)) return [x, y]; for (const r of [150, 300, 500, 800, 1200, 1800, 2600]) for (let i = 0; i < 16; i++){ const a = i*TAU/16, px = x + Math.cos(a)*r, py = y + Math.sin(a)*r; if (!wet(px, py) && Math.abs(px) < HALF - 600 && Math.abs(py) < HALF - 600) return [px, py]; } return [x, y]; }
  function play(o){
    o = o || {};
    const toastApp = s => { try { showToast(s); } catch (e){ /* */ } };
    if (!(typeof SGR !== 'undefined' && SGR.on)){ toastApp('The mech mode needs the real city map'); return false; }
    const K = KJ(); if (!K || !K.damage || !K.onEvent){ toastApp('The mech mode needs the creature module'); return false; }
    if (ST.on) stop(true);
    const diff = clamp(o.difficulty === undefined ? 1 : o.difficulty | 0, 0, 2), species = o.species || 'cthulhu';
    try { if (window.SGF1 && SGF1.F1 && SGF1.F1.on) SGF1.exit(); } catch (e){ /* */ } try { if (window.SGFly && SGFly.on) SGFly.exit(); } catch (e){ /* */ }
    let x = isFinite(o.x) ? +o.x : controls.target.x, y = isFinite(o.y) ? +o.y : -controls.target.z;
    if (!isFinite(o.x)){ try { const r = KG_().roadSnap(x, y, 500); if (r){ x = r.x; y = r.y; } } catch (e){ /* */ } }
    [x, y] = landNear(x, y);
    saveApp(); MK.attach(); MF.ensure(); MU.init();
    controls.target.set(x, gnd(x, y), -y);
    let ok = false; try { ok = K.start({mech:{hp:DIFF_HP[diff]}, goal:'mech', difficulty:diff, species, spawn:o.spawn || 'auto', seed:o.seed}); } catch (e){ console.error('[mech] start', e); }
    if (!ok){ restoreApp(); MK.detach(); return false; }
    let hdg = 0; try { const G = KG_().G; ST.sp = G.sp; if (G.spawn) hdg = Math.atan2(G.spawn.x - x, G.spawn.y - y); } catch (e){ ST.sp = 'cthulhu'; }
    Object.assign(ST, {S:ML.newState(x, y, hdg), diff, hp:1000, hpMax:1000, sh:400, shMax:400, shT:0, heat:0, over:0, mslCool:0, act:null, beamOn:false, firing:false, carry:null, result:null, down:null, won:null,
      pending:null, side:0, dmgAcc:0, beamHit:null, beamBld:null, hurtK:0, hitMark:0, resist:1, resistT:0, paused:false, hitStop:0, alarmT:0});
    ST.mslQ.length = 0; ST.msl.length = 0; ST.proj.length = 0; ST.sphP.length = 0; ST.sphCool.clear();
    ST.stats = {dealt:0, hits:0, taken:0, bld:0, t0:ST.t};
    ST.drop = {t:0, dur:3.4}; ST.dropZ = 430;
    if (ST.unsub) try { ST.unsub(); } catch (e){ /* */ } ST.unsub = K.onEvent(MC.onKj);
    CAM.yaw = hdg; CAM.pitch = 0.14; CAM.P = null; CAM.di = 1; CAM.dist = CAM.dists[1];
    IN.keys.clear(); IN.tx = IN.ty = 0; listen(true);
    MU.show(true); MU.foeName(foeEn().toUpperCase()); MU.touch(mobile());
    if (!mobile()){ MU.help(true); setTimeout(() => { if (ST.on) MU.help(false); }, 9000); }
    ST.on = true; ST.frame = 0;
    MF.snd('thrust', x, y, gnd(x, y) + 200, 1);
    try { K.setTargets([{id:'mech', x, y, z:gnd(x, y), kind:'mech', nocatch:true, hl:10, hw:10, h:70, psi:0}]); } catch (e){ /* */ }
    camStep(0); ML.pose(ST.S); MK.setPose(ST.S.Q, ST.S.rootP, x, y, ST.S.Zb + 430, hdg, 0);
    return true;
  }
  function stop(quiet){
    if (!ST.on) return false; ST.on = false; const S = ST.S;
    if (ST.unsub) try { ST.unsub(); } catch (e){ /* */ } ST.unsub = null;
    MF.hideAll(); MF.beamSnd(false); MK.detach(); MU.show(false); listen(false); IN.keys.clear(); ST.beamOn = false; ST.carry = null; ST.msl.length = 0; ST.proj.length = 0; ST.mslQ.length = 0;
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e){ /* */ }
    try { const G = KG_().G; G.paused = false; } catch (e){ /* */ }
    restoreApp();
    if (S){ const gz = Math.max(0, S.Zb); controls.target.set(S.X, gz, -S.Y); camera.position.set(S.X - Math.sin(CAM.yaw)*420, gz + 330, -(S.Y - Math.cos(CAM.yaw)*420)); camera.lookAt(controls.target); controls.update(); }
    try { const K = KJ(); if (K && K.on) K.quit(); } catch (e){ console.warn('[mech] quit', e); }
    void quiet; return true;
  }
  function retry(){ const o = {difficulty:ST.diff, species:ST.sp}; const S = ST.S; if (S){ o.x = S.X; o.y = S.Y; } stop(true); return play(o); }
  // #mech (or ?play=mech): start as soon as the streets around the camera are loaded; #mech-<species> picks the creature
  function autoStart(){
    let want = false, sp = null;
    try { const h = decodeURIComponent((location.hash || '').toLowerCase()), q = new URLSearchParams(location.search), pm = (q.get('play') || q.get('mode') || '').toLowerCase();
      want = /(^|[#&/?])mech(\b|[-_=:])/.test(h) || pm === 'mech'; const m = h.match(/mech[-_=:]([a-z]+)/); if (m) sp = m[1]; } catch (e){ /* */ }
    if (!want) return;
    const t0 = performance.now();
    const tick = () => {
      const real = typeof SGR !== 'undefined' && SGR.on; let done = 0;
      try { if (real) for (const T of SGR.tiles.values()) if (T.done) done++; } catch (e){ /* */ }
      if (!(real && done >= 6 && window.SGKaiju) && performance.now() - t0 < 90000){ setTimeout(tick, 700); return; }
      if (real) setTimeout(() => play(sp ? {species:sp} : undefined), 600);
    };
    setTimeout(tick, 1500);
  }
  return {frame, play, stop, retry, act, look, touchMove, camCycle, defeated, fallen, mechDown, foeEn, autoStart, camStep, listen};
})();
// ---------------- the contract ----------------
const SGMech = {
  play:o => MG.play(o), stop:() => MG.stop(), get on(){ return ST.on; },
  status(){ const S = ST.S; let foe = null; try { foe = KJ().status().mech; } catch (e){ foe = null; }
    return {on:ST.on, phase:!ST.on ? 'off' : ST.result ? 'result' : ST.drop ? 'drop' : ST.down ? 'down' : ST.won ? 'won' : 'fight', result:ST.result, hp:Math.round(ST.hp), shield:Math.round(ST.sh), foe, species:ST.sp, difficulty:ST.diff,
      pos:S ? {x:Math.round(S.X), y:Math.round(S.Y), z:+S.Zb.toFixed(1), hdg:+S.hdg.toFixed(3), spd:+S.spd.toFixed(1)} : null, act:ST.act ? ST.act.k + (ST.act.ph ? ':' + ST.act.ph : '') : null,
      beam:{firing:ST.firing, heat:+ST.heat.toFixed(2), over:ST.over > 0}, missiles:{cool:+Math.max(0, ST.mslCool).toFixed(1), flying:ST.msl.length}, carry:!!ST.carry, aim:{k:ST.aim.k, d:Math.round(ST.aim.d)},
      stats:Object.assign({}, ST.stats, {dealt:Math.round(ST.stats.dealt), taken:Math.round(ST.stats.taken)})}; },
  // tests / automation: virtual input {fw, rt (-1..1), run, yaw, pitch, beam, dist}
  input(o){ o = o || {}; if (o.fw !== undefined || o.rt !== undefined){ IN.ty = +o.fw || 0; IN.tx = +o.rt || 0; } if (o.run !== undefined){ if (o.run) IN.keys.add('ShiftLeft'); else IN.keys.delete('ShiftLeft'); }
    if (isFinite(o.yaw)) CAM.yaw = +o.yaw; if (isFinite(o.pitch)) CAM.pitch = +o.pitch; if (isFinite(o.dist)) CAM.dist = +o.dist; if (o.beam !== undefined) ST.beamOn = !!o.beam; return true; },
  act:(a, on) => MG.act(a, on),
  // tests: put the mech at (x, y) facing hdg (feet replanted); point the camera so the crosshair looks at (x, y, z)
  place(x, y, hdg){ const S = ST.S; if (!S || !isFinite(x) || !isFinite(y)) return false; S.X = +x; S.Y = +y; if (isFinite(hdg)) S.hdg = S.hdgWant = +hdg; S.vx = S.vy = 0; S.Zb = gnd(S.X, S.Y); for (const F of S.feet) ML.placeFoot(S, F); CAM.P = null; return true; },
  face(x, y, z){ const S = ST.S; if (!S) return false; CAM.yaw = Math.atan2(x - S.X, y - S.Y); const dh = Math.hypot(x - S.X, y - S.Y); CAM.pitch = clamp(-Math.atan2((+z || 0) - (S.Zb + 54), dh + CAM.dist), -0.28, 1.15); CAM.P = null; return true; },
  // advance the creature and the mech in fixed steps (tests): {steps, msPerStep, status}
  sim(sec, dt){ dt = dt || 1/30; const n = Math.round(sec/dt), t0 = performance.now(), KG = KG_();
    for (let i = 0; i < n; i++){ try { if (KG) KG.frame(KG.G.t + dt, dt); } catch (e){ console.error('[mech] sim kaiju', e); } MG.frame(0, dt); }
    return {steps:n, msPerStep:+((performance.now() - t0)/Math.max(1, n)).toFixed(3), status:this.status()}; },
  stats(){ const M = MK.M; return {built:!!M, tris:M ? M.tris : null, buildMs:M ? Math.round(M.ms) : null, lod:M ? M.lod : null, bones:MK.NB, ms:+(ST.ms || 0).toFixed(3), msMax:+(ST.msMax || 0).toFixed(3)}; },
  _:{ST, MK, ML, MC, MF, MU, MG, CAM, IN}
};
if (typeof window !== 'undefined') window.SGMech = SGMech;
if (typeof HOOKS !== 'undefined'){
  HOOKS.frame.push((t, dt) => { if (ST.on) try { MG.frame(t, dt); } catch (e){ console.error('[mech] frame', e); } });
  HOOKS.boot.push(() => { try { MG.autoStart(); } catch (e){ console.error('[mech] autostart', e); } });
}
return SGMech;
})();
void SGMECH_;
}
