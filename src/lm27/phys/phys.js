// ===== City Brush v30 · lm27/phys — window.SGPhys: a small pooled rigid-body engine (debris chunks, thrown vehicles, fallen props) =====
// Bodies are oriented boxes (struct-of-arrays pool, 640 slots, no per-frame allocations): gravity, semi-implicit integration with a
// quaternion, 1-2 sub-steps per frame; contacts with
//   - the ground: the 8 box corners against the map's surface (hC; a road deck from SGRoads.surfaceAt where its index is ready; the roof
//     of a building the body lies on), sequential impulses with restitution (only above 1.5 m/s: resting contacts do not bounce) and
//     Coulomb friction at every touching corner, so chunks tumble, roll over and come to rest on a face;
//   - water (the app's nat grid: sea, rivers): a splash (window.SGFX.splash + SGAudio 'splash') on entry, heavy drag, it sinks and is
//     gone 6 m down;
//   - the real buildings: their footprints as oriented boxes (longest edge = axis, base / roof heights) in a per-tile 25 m grid built in
//     slices of 2 ms from the same tile lists bld.js draws (destroyed ones, __kd === 1, are low rubble mounds; standing bitten towers
//     stay solid); sides push out with restitution and friction, roofs are ground;
//   - each other (cheap): spheres of the mean half extent through a hashed 4 m grid, positional split by mass, impulses with friction;
//   - the player's car (window.SGF1): an oriented box; the body bounces off by the mass ratio and the car gets the impulse and the
//     damage through SGF1.crash.hit (the destruct patch of f1d.js) when the hit is hard enough.
// Bodies sleep after 0.5 s at rest (no integration, no matrix writes) and wake on impulses or when hit by an awake body; they fade out
// at the end of their life (chunks 40-90 s); a full pool recycles the oldest drawn body. Drawn bodies are one InstancedMesh (an
// irregular chunk geometry, per-instance colour, shadows): only awake / changed slots rewrite their matrix. Vehicles handed over by
// the traffic module are "external" bodies (not drawn here): the owner reads their pose with pose(id, out).
// Cost: < 1 ms per frame for 400 awake bodies on the test machine (node test lm27/destruct/test/t_phys.js).
// [lm30/phys2] v33: materials (concrete, brick, glass, steel, wood, asphalt, vehicle: density, restitution, friction, rolling
// resistance; pairs combine them: friction sqrt(mu1 mu2), restitution the larger); big concrete pieces break in two or three on a hard
// landing (momentum kept, a dust puff, at most 4 a step, only while the pool is below 380 bodies); heavy pieces (> 6 t) trail dust
// while they fall fast, pieces over 3 t throw a puff where they land (one dust event a step) (SGPhys.dust = fn(x, y, z, size, col) from the creature's effects, else window.SGFX.dust); a sleeping body
// that lost what it rested on (the body under it moved, the roof under it fell) wakes up (24 checked per step, round robin); box
// a new kind 'beam' (a steel section: long, thin). Spawn option mat:'concrete'|'brick'|'glass'|'steel'|'wood'|'asphalt'|'car'.
// API (window.SGPhys):
//   spawn(kind, {x, y, z, vx, vy, vz, w, h, d, col:[r, g, b] 0-1, life, spin, wx, wy, wz, hdg, tilt, q:[x, y, z, w], m, e, mu, draw, mat}) -> id | -1
//        kinds: 'chunk' (concrete, default), 'slab', 'glass' (small, light), 'beam' (steel), 'car' / 'prop' (external: draw false unless given);
//        w = size along x (length), d = along y (width), h = along z (height), metres; world x east, y north, z up
//   impulse(x, y, z, r, k)  radial push (k m/s at the centre, falling off to 0 at r, an upward share) on the bodies, the traffic
//                           (SGTraffic.toss) and the player's car (SGF1.crash.impulse); returns the number of bodies pushed
//   pose(id, out) -> out {x, y, z, qx, qy, qz, qw, vx, vy, vz, wx, wy, wz, sleep, wet, alive} (world frame) or null; kill(id);
//   wake(x, y, r); clear(); step(dt) (tests); stats() -> {alive, awake, sleeping, drawn, ext, ms, msMax, cap, bixTiles, ...}
{
const SGPhys = (() => {
  'use strict';
  const CAP = 640, G = 9.81, PI = Math.PI;
  const F_DRAW = 1, F_EXT = 2, F_SLEEP = 4, F_WET = 8, F_SPLASH = 16, F_DIRTY = 32, F_VEH = 64, F_TOUCH = 128, F_ROOF = 256, F_FADE = 512;
  const K_CHUNK = 0, K_SLAB = 1, K_GLASS = 2, K_CAR = 3, K_PROP = 4, K_BEAM = 5;
  const KINDS = {chunk:K_CHUNK, slab:K_SLAB, glass:K_GLASS, car:K_CAR, prop:K_PROP, beam:K_BEAM};
  // [lm30/phys2] materials: density (kg/m3 of the box; broken pieces are porous), restitution, friction, rolling resistance on the ground
  const MATS = {concrete:[1500, 0.16, 0.66, 3.5], brick:[1300, 0.12, 0.72, 4], glass:[2500, 0.08, 0.45, 6], steel:[1800, 0.3, 0.42, 2.2], wood:[550, 0.32, 0.55, 2.5],
    asphalt:[1700, 0.12, 0.75, 4], car:[0, 0.22, 0.75, 3.5]};
  const MATN = ['concrete', 'brick', 'glass', 'steel', 'wood', 'asphalt', 'car'], MATI = {}; MATN.forEach((k, i) => { MATI[k] = i; });
  const MAT = new Uint8Array(CAP), RR = new Float64Array(CAP);
  const AL = new Uint8Array(CAP), GEN = new Uint16Array(CAP), KIND = new Uint8Array(CAP), FL = new Uint16Array(CAP);
  const f64 = () => new Float64Array(CAP);
  const PX = f64(), PY = f64(), PZ = f64(), VX = f64(), VY = f64(), VZ = f64(), QX = f64(), QY = f64(), QZ = f64(), QW = f64(), WX = f64(), WY = f64(), WZ = f64();
  const HX = f64(), HY = f64(), HZ = f64(), IM = f64(), IIX = f64(), IIY = f64(), IIZ = f64(), RAD = f64(), RC = f64(), E = f64(), MU = f64(), MASS = f64();
  const AGE = f64(), LIFE = f64(), SLT = f64(), GZ = f64(), GX = f64(), GY = f64(), GT = f64(), CR = f64(), CG = f64(), CB = f64(), HITT = f64();
  const WAT = new Uint8Array(CAP), BCL = new Array(CAP).fill(null), BCX = new Array(CAP).fill(null), FT = new Float64Array(CAP), DT = new Float64Array(CAP);
  let HI = -1, NAL = 0;
  const T = {t:0, ms:0, msMax:0, steps:0, spawned:0, recycled:0, splashes:0, carHits:0, sunk:0, last:0, splT:-1e9};
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  // ---------------------------------------------------------------- the world
  function terrain(x, y){ try { return typeof hC === 'function' ? hC(x, y) : 0; } catch (e){ return 0; } }
  function natAt(x, y){ try { if (typeof nat === 'undefined' || typeof cx2i !== 'function') return -1; return nat[cx2i(y)*N + cx2i(x)]; } catch (e){ return -1; } }
  function isWater(x, y){ const v = natAt(x, y); if (v === 1 || v === 2) return true; if (v >= 0) return false; try { return typeof hAt === 'function' && hAt(x, y) < -1; } catch (e){ return false; } }
  function deck(x, y, z){
    try { if (typeof SGRoads !== 'undefined' && SGRoads.surfaceReady && SGRoads.surfaceAt && SGRoads.surfaceReady(x, y)){ const r = SGRoads.surfaceAt(x, y, z + 1); if (r && isFinite(r.z)) return r.z; } } catch (e){ /* optional */ }
    return -1e9;
  }
  // ---------------------------------------------------------------- the buildings: oriented boxes per 2 km tile, a 25 m grid, built in slices
  const BIX = {tiles:new Map(), CS:25, MARGIN:6, job:null, ms:0};
  const half = () => { try { return typeof HALF !== 'undefined' ? HALF : 28000; } catch (e){ return 28000; } };
  const tileSize = () => { try { return (SGR.base && SGR.base.TILE) || 2000; } catch (e){ return 2000; } };
  function tileOf(x, y){ const Ts = tileSize(), H = half(), TX = Math.round(2*H/Ts), tx = Math.floor((x + H)/Ts), ty = Math.floor((y + H)/Ts); return tx < 0 || ty < 0 || tx >= TX || ty >= TX ? -1 : ty*TX + tx; }
  function tileList(ti){
    try { const Tt = SGR.tiles && SGR.tiles.get(ti); if (Tt && Tt.bld && Tt.bld.list) return Tt.bld.list; } catch (e){ /* */ }
    try { const L = window.SGBld && SGBld.kd && SGBld.kd.live && SGBld.kd.live(ti); if (L && L.list) return L.list; } catch (e){ /* */ }
    return null;
  }
  function skipFn(){ try { if (typeof sgrSkipB === 'function') return sgrSkipB.orig || sgrSkipB; } catch (e){ /* */ } return null; }
  function bixTile(ti){
    let X = BIX.tiles.get(ti); const list = tileList(ti);
    if (X && X.list === list) return X;
    if (!list) return null;
    const Ts = tileSize(), H = half(), TX = Math.round(2*H/Ts), NC = Math.round(Ts/BIX.CS);
    X = {ti, list, x0:-H + (ti % TX)*Ts, y0:-H + Math.floor(ti/TX)*Ts, NC, cells:new Array(NC*NC), k:0, ready:false, n:0,
      cx:[], cy:[], ux:[], uy:[], hu:[], hv:[], z0:[], z1:[], h:[], base:[], B:[]};
    BIX.tiles.set(ti, X);
    if (BIX.tiles.size > 24){ for (const k of BIX.tiles.keys()){ if (k !== ti){ BIX.tiles.delete(k); break; } } }
    return X;
  }
  function bixWork(X, budget){
    const t0 = now(), L = X.list, skip = skipFn(), CS = BIX.CS, M = BIX.MARGIN;
    while (X.k < L.length){
      const B = L[X.k++];
      if (B && B.rings && B.rings.length && !(skip && !B.__kd && skip(B))){
        const R = B.rings[0], m = R.length/2; let best = -1, ux = 1, uy = 0;
        for (let i = 0; i < m; i++){ const j = (i + 1) % m, dx = R[j*2] - R[i*2], dy = R[j*2 + 1] - R[i*2 + 1], l2 = dx*dx + dy*dy; if (l2 > best){ best = l2; const l = Math.sqrt(l2) || 1; ux = dx/l; uy = dy/l; } }
        let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
        for (let i = 0; i < m; i++){ const x = R[i*2], y = R[i*2 + 1], a = x*ux + y*uy, b = -x*uy + y*ux; if (a < a0) a0 = a; if (a > a1) a1 = a; if (b < b0) b0 = b; if (b > b1) b1 = b; }
        const am = (a0 + a1)/2, bm = (b0 + b1)/2, cx = am*ux - bm*uy, cy = am*uy + bm*ux, hu = (a1 - a0)/2, hv = (b1 - b0)/2;
        if (hu > 0.5 && hv > 0.5){
          const k = X.n++; X.cx.push(cx); X.cy.push(cy); X.ux.push(ux); X.uy.push(uy); X.hu.push(hu); X.hv.push(hv); X.z0.push(NaN); X.z1.push(NaN); X.h.push(B.h); X.base.push(B.base > 2 && B.base < B.h - 0.5 ? B.base : 0); X.B.push(B);
          const ex = Math.abs(ux)*hu + Math.abs(uy)*hv + M, ey = Math.abs(uy)*hu + Math.abs(ux)*hv + M;
          const i0 = Math.max(0, Math.floor((cx - ex - X.x0)/CS)), i1 = Math.min(X.NC - 1, Math.floor((cx + ex - X.x0)/CS)), j0 = Math.max(0, Math.floor((cy - ey - X.y0)/CS)), j1 = Math.min(X.NC - 1, Math.floor((cy + ey - X.y0)/CS));
          for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){ const c = j*X.NC + i; (X.cells[c] || (X.cells[c] = [])).push(k); }
        }
      }
      if ((X.k & 63) === 0 && now() - t0 > budget) break;
    }
    BIX.ms += now() - t0;
    if (X.k >= L.length){ X.ready = true; if (BIX.job === X) BIX.job = null; }
    return X.ready;
  }
  // the record's heights, lazily (ground at its centre)
  function bixZ(X, k){
    if (X.z0[k] !== X.z0[k]){ const g = terrain(X.cx[k], X.cy[k]); X.z0[k] = g + X.base[k] - 1.5; X.z1[k] = g + X.h[k]; }
    const B = X.B[k]; if (B && B.__kd === 1) return Math.min(X.z1[k], X.z0[k] + 1.5 + Math.min(16, 0.05*X.h[k] + 2));
    return X.z1[k];
  }
  // records of the cell under (x, y); null while the tile is not indexed (a job is queued)
  function bixCell(x, y){
    const ti = tileOf(x, y); if (ti < 0) return null;
    const X = bixTile(ti); if (!X) return null;
    if (!X.ready){ if (!BIX.job) BIX.job = X; return null; }
    const i = Math.floor((x - X.x0)/BIX.CS), j = Math.floor((y - X.y0)/BIX.CS); if (i < 0 || j < 0 || i >= X.NC || j >= X.NC) return null;
    QX_.X = X; return X.cells[j*X.NC + i] || null;
  }
  const QX_ = {X:null};
  // ---------------------------------------------------------------- ground cache: terrain / deck / roof under a body (refreshed as it moves)
  function groundRefresh(i){
    const x = PX[i], y = PY[i], z = PZ[i];
    let g = terrain(x, y); const w = isWater(x, y); WAT[i] = w ? 1 : 0;
    if (w) g = Math.min(g, -40);
    const dk = deck(x, y, z); if (dk > g && dk < z + 1.5) g = dk;
    FL[i] &= ~F_ROOF;
    const L = bixCell(x, y); BCL[i] = L; BCX[i] = L ? QX_.X : null;
    if (L){ const X = QX_.X; for (let q = 0; q < L.length; q++){ const k = L[q], dx = x - X.cx[k], dy = y - X.cy[k], lu = dx*X.ux[k] + dy*X.uy[k], lv = -dx*X.uy[k] + dy*X.ux[k];
      if (Math.abs(lu) > X.hu[k] || Math.abs(lv) > X.hv[k]) continue; const z1 = bixZ(X, k); if (z1 > g && z1 < z + 2.5){ g = z1; FL[i] |= F_ROOF; } } }
    GZ[i] = g; GX[i] = x; GY[i] = y; GT[i] = T.t;
  }
  function groundZ(i){
    const dx = PX[i] - GX[i], dy = PY[i] - GY[i], lim = (FL[i] & F_ROOF) ? 0.35 : 1.2;
    if (dx*dx + dy*dy > lim*lim || T.t - GT[i] > 0.8 || PZ[i] < GZ[i] - 3) groundRefresh(i);
    return GZ[i];
  }
  // ---------------------------------------------------------------- spawning
  let rs = 12345; const rnd = () => { rs = (rs*16807) % 2147483647; return rs/2147483647; };
  function freeSlot(){
    for (let i = 0; i < CAP; i++) if (!AL[i]) return i;
    // recycle the oldest drawn non-vehicle body (sleeping ones first)
    let best = -1, bs = -1;
    for (let i = 0; i < CAP; i++){ if (FL[i] & F_EXT) continue; const s = AGE[i] + ((FL[i] & F_SLEEP) ? 1000 : 0); if (s > bs){ bs = s; best = i; } }
    if (best >= 0){ T.recycled++; kill_(best); }
    return best;
  }
  function setMass(i, m){
    const lx = 2*HX[i], ly = 2*HY[i], lz = 2*HZ[i];
    MASS[i] = m; IM[i] = 1/m;
    IIX[i] = 12/(m*(ly*ly + lz*lz)); IIY[i] = 12/(m*(lx*lx + lz*lz)); IIZ[i] = 12/(m*(lx*lx + ly*ly));
  }
  function spawn(kind, o){
    o = o || {}; const k = KINDS[kind] !== undefined ? KINDS[kind] : K_CHUNK;
    const i = freeSlot(); if (i < 0) return -1;
    AL[i] = 1; GEN[i] = (GEN[i] + 1) & 1023; KIND[i] = k; NAL++; if (i > HI) HI = i; T.spawned++;
    const ext = k === K_CAR || k === K_PROP, draw = o.draw !== undefined ? !!o.draw : !ext;
    FL[i] = (draw ? F_DRAW : 0) | (ext ? F_EXT : 0) | (k === K_CAR ? F_VEH : 0) | F_DIRTY;
    PX[i] = +o.x || 0; PY[i] = +o.y || 0; PZ[i] = +o.z || 0; VX[i] = +o.vx || 0; VY[i] = +o.vy || 0; VZ[i] = +o.vz || 0;
    const w = Math.max(0.05, +o.w || (k === K_GLASS ? 0.5 : k === K_BEAM ? 4 : 1.2)), d = Math.max(0.05, +o.d || (k === K_GLASS ? 0.4 : k === K_SLAB ? w*0.9 : k === K_BEAM ? 0.3 : w*0.8)), h = Math.max(0.03, +o.h || (k === K_GLASS ? 0.05 : k === K_SLAB ? w*0.18 : k === K_BEAM ? 0.35 : w*0.7));
    HX[i] = w/2; HY[i] = d/2; HZ[i] = h/2; RAD[i] = Math.sqrt(HX[i]*HX[i] + HY[i]*HY[i] + HZ[i]*HZ[i]); RC[i] = Math.max(0.12, (HX[i] + HY[i] + HZ[i])/3*1.12);
    const mn = o.mat && MATS[o.mat] ? o.mat : k === K_GLASS ? 'glass' : k === K_CAR ? 'car' : k === K_BEAM ? 'steel' : 'concrete', MP = MATS[mn];
    MAT[i] = MATI[mn]; RR[i] = MP[3];
    const dens = k === K_CAR ? 0 : MP[0];
    setMass(i, o.m > 0 ? +o.m : k === K_CAR ? 1500 : Math.max(0.5, dens*w*d*h));
    if (o.q){ QX[i] = o.q[0]; QY[i] = o.q[1]; QZ[i] = o.q[2]; QW[i] = o.q[3]; }
    else { const tl = o.tilt !== undefined ? +o.tilt : ext ? 0 : 0.6, a = o.hdg !== undefined ? +o.hdg : rnd()*PI*2, b = (rnd() - 0.5)*2*tl, c = (rnd() - 0.5)*2*tl;
      // yaw a, then small pitch b / roll c (z-up frame): q = qz(a) * qy(b) * qx(c)
      const ca = Math.cos(a/2), sa = Math.sin(a/2), cb = Math.cos(b/2), sb = Math.sin(b/2), cc = Math.cos(c/2), sc = Math.sin(c/2);
      QW[i] = ca*cb*cc + sa*sb*sc; QX[i] = ca*cb*sc - sa*sb*cc; QY[i] = ca*sb*cc + sa*cb*sc; QZ[i] = sa*cb*cc - ca*sb*sc; }
    const sp = o.spin !== undefined ? +o.spin : ext ? 0 : 2 + rnd()*4;
    if (o.wx !== undefined || o.wy !== undefined || o.wz !== undefined){ WX[i] = +o.wx || 0; WY[i] = +o.wy || 0; WZ[i] = +o.wz || 0; }
    else { const ax = rnd() - 0.5, ay = rnd() - 0.5, az = rnd() - 0.5, al = Math.hypot(ax, ay, az) || 1; WX[i] = ax/al*sp; WY[i] = ay/al*sp; WZ[i] = az/al*sp; }
    E[i] = o.e !== undefined ? +o.e : MP[1]; MU[i] = o.mu !== undefined ? +o.mu : MP[2]; FT[i] = 0; DT[i] = 0;
    AGE[i] = 0; LIFE[i] = o.life > 0 ? +o.life : ext ? 120 : 40 + rnd()*50; SLT[i] = 0; HITT[i] = 0;
    const c = o.col || (k === K_GLASS ? [0.55, 0.62, 0.66] : [0.56, 0.55, 0.52]); CR[i] = c[0]; CG[i] = c[1]; CB[i] = c[2];
    GT[i] = -1e9; groundRefresh(i);
    if (draw) renderInit();
    return i | (GEN[i] << 10);
  }
  const slotOf = id => { if (!(id >= 0)) return -1; const i = id & 1023; return i < CAP && AL[i] && GEN[i] === (id >> 10) ? i : -1; };
  function kill_(i){ if (!AL[i]) return; AL[i] = 0; NAL--; BCL[i] = null; BCX[i] = null; FL[i] = (FL[i] & F_DRAW) | F_DIRTY; KILLED.push(i); }
  const KILLED = [];
  function kill(id){ const i = slotOf(id); if (i >= 0) kill_(i); return i >= 0; }
  function wake_(i){ if (FL[i] & F_SLEEP){ FL[i] &= ~F_SLEEP; SLT[i] = 0; } FL[i] |= F_DIRTY; }
  function wake(x, y, r){ let n = 0; for (let i = 0; i <= HI; i++){ if (!AL[i]) continue; const dx = PX[i] - x, dy = PY[i] - y; if (dx*dx + dy*dy < r*r){ wake_(i); GT[i] = -1e9; n++; } } return n; }
  // ---------------------------------------------------------------- integration
  // scratch (typed arrays: no boxed doubles in closure slots)
  const RM = new Float64Array(9), BB = new Float64Array(3);
  function rot(i){
    const x = QX[i], y = QY[i], z = QZ[i], w = QW[i];
    RM[0] = 1 - 2*(y*y + z*z); RM[1] = 2*(x*y - z*w); RM[2] = 2*(x*z + y*w);
    RM[3] = 2*(x*y + z*w); RM[4] = 1 - 2*(x*x + z*z); RM[5] = 2*(y*z - x*w);
    RM[6] = 2*(x*z - y*w); RM[7] = 2*(y*z + x*w); RM[8] = 1 - 2*(x*x + y*y);
  }
  // world inverse inertia times a vector (R diag(iI) R^T v) -> BB[0]..BB[2]
  function iiw(i, vx, vy, vz){
    const a0 = (RM[0]*vx + RM[3]*vy + RM[6]*vz)*IIX[i], a1 = (RM[1]*vx + RM[4]*vy + RM[7]*vz)*IIY[i], a2 = (RM[2]*vx + RM[5]*vy + RM[8]*vz)*IIZ[i];
    BB[0] = RM[0]*a0 + RM[1]*a1 + RM[2]*a2; BB[1] = RM[3]*a0 + RM[4]*a1 + RM[5]*a2; BB[2] = RM[6]*a0 + RM[7]*a1 + RM[8]*a2;
  }
  function integrate(i, h){
    if (FL[i] & F_WET){
      const k = Math.exp(-2.4*h), sink = KIND[i] === K_CAR ? 0.7 : 1.4; VX[i] *= k; VY[i] *= k; VZ[i] = VZ[i]*k - sink*(1 - k);
      const kw = Math.exp(-1.6*h); WX[i] *= kw; WY[i] *= kw; WZ[i] *= kw;
    } else {
      VZ[i] -= G*h; const k = 1 - 0.012*h; VX[i] *= k; VY[i] *= k; VZ[i] *= k;
      const kw = 1 - 0.05*h; WX[i] *= kw; WY[i] *= kw; WZ[i] *= kw;
      // vehicles: at most ~1.3 turns a second (debris may spin faster)
      if (KIND[i] === K_CAR){ const w2 = WX[i]*WX[i] + WY[i]*WY[i] + WZ[i]*WZ[i]; if (w2 > 64){ const s = 8/Math.sqrt(w2); WX[i] *= s; WY[i] *= s; WZ[i] *= s; } }
    }
    PX[i] += VX[i]*h; PY[i] += VY[i]*h; PZ[i] += VZ[i]*h;
    const qx = QX[i], qy = QY[i], qz = QZ[i], qw = QW[i], wx = WX[i], wy = WY[i], wz = WZ[i], hh = 0.5*h;
    let nx = qx + hh*(wx*qw + wy*qz - wz*qy), ny = qy + hh*(wy*qw + wz*qx - wx*qz), nz = qz + hh*(wz*qw + wx*qy - wy*qx), nw = qw + hh*(-wx*qx - wy*qy - wz*qz);
    const l = 1/Math.sqrt(nx*nx + ny*ny + nz*nz + nw*nw); QX[i] = nx*l; QY[i] = ny*l; QZ[i] = nz*l; QW[i] = nw*l;
  }
  // ---------------------------------------------------------------- contacts: ground (box corners), water, buildings
  const CPX = new Float64Array(8), CPY = new Float64Array(8), CPZ = new Float64Array(8), CPP = new Float64Array(8), CPJ = new Float64Array(8);
  function groundContacts(i, h){
    const gz = groundZ(i), z = PZ[i];
    // water: the surface at sea level (the bed far below)
    if (WAT[i] && z < 0.2){
      if (!(FL[i] & F_WET)){ FL[i] |= F_WET; if (!(FL[i] & F_SPLASH)){ FL[i] |= F_SPLASH; splash(i); } }
      if (z < -6 || (KIND[i] === K_CAR && z < -4.5)){ T.sunk++; kill_(i); return false; }
    }
    if (z - RAD[i] > gz + 0.02) return false;
    rot(i);
    const hx = HX[i], hy = HY[i], hz = HZ[i]; let n = 0, maxPen = 0;
    for (let c = 0; c < 8; c++){
      const sx = (c & 1) ? hx : -hx, sy = (c & 2) ? hy : -hy, sz = (c & 4) ? hz : -hz;
      const rx = RM[0]*sx + RM[1]*sy + RM[2]*sz, ry = RM[3]*sx + RM[4]*sy + RM[5]*sz, rz = RM[6]*sx + RM[7]*sy + RM[8]*sz, pen = gz - (z + rz);
      if (pen <= 0) continue;
      CPX[n] = rx; CPY[n] = ry; CPZ[n] = rz; CPP[n] = pen; CPJ[n] = 0; n++; if (pen > maxPen) maxPen = pen;
    }
    if (!n) return false;
    const im = IM[i], mu = MU[i]*GMU; let hard = 0;
    for (let it = 0; it < 2; it++){
      for (let c = 0; c < n; c++){
        const rx = CPX[c], ry = CPY[c], rz = CPZ[c];
        const vcx = VX[i] + WY[i]*rz - WZ[i]*ry, vcy = VY[i] + WZ[i]*rx - WX[i]*rz, vcz = VZ[i] + WX[i]*ry - WY[i]*rx;
        if (it === 0 && -vcz > hard) hard = -vcz;
        // normal (0, 0, 1): r x n = (ry, -rx, 0)
        iiw(i, ry, -rx, 0); const kn = im + (BB[0]*ry - BB[1]*rx);
        const e = it === 0 && vcz < -1.5 ? E[i] : 0;
        let jn = -(1 + e)*vcz/kn; const j0 = CPJ[c]; CPJ[c] = Math.max(0, j0 + jn); jn = CPJ[c] - j0;
        if (jn !== 0){ VZ[i] += jn*im; WX[i] += BB[0]*jn; WY[i] += BB[1]*jn; WZ[i] += BB[2]*jn; }
        // friction along the sliding direction
        const ux = VX[i] + WY[i]*rz - WZ[i]*ry, uy = VY[i] + WZ[i]*rx - WX[i]*rz, ut = Math.hypot(ux, uy);
        if (ut > 1e-5 && CPJ[c] > 0){
          const tx = ux/ut, ty = uy/ut, cx = -rz*ty, cy = rz*tx, cz = rx*ty - ry*tx;
          iiw(i, cx, cy, cz); const kt = im + ((BB[1]*rz - BB[2]*ry)*tx + (BB[2]*rx - BB[0]*rz)*ty);
          const jt = -Math.min(ut/kt, mu*CPJ[c]/n*1.6);
          VX[i] += jt*tx*im; VY[i] += jt*ty*im; WX[i] += BB[0]*jt; WY[i] += BB[1]*jt; WZ[i] += BB[2]*jt;
        }
      }
    }
    PZ[i] += Math.max(0, maxPen - 0.005)*0.8;
    // rolling resistance on the ground (stops endless rocking; by material)
    const kr = Math.exp(-(n >= 3 ? RR[i] : 0.8)*h); WX[i] *= kr; WY[i] *= kr; WZ[i] *= kr;
    FL[i] |= F_TOUCH;
    // [lm30/phys2] a hard landing: big concrete / brick pieces break, heavy ones throw up dust
    if (hard > 5 && !(FL[i] & F_EXT)){
      if (hard > 7.5 && MASS[i] > 700 && FT[i] < 2 && (MAT[i] === 0 || MAT[i] === 1) && (KIND[i] === K_CHUNK || KIND[i] === K_SLAB) && FRQn < FRQ.length){ let dup = false; for (let q = 0; q < FRQn; q++) if (FRQ[q] === i) dup = true; if (!dup){ FRQ[FRQn] = i; FRV[FRQn] = hard; FRQn++; } }
      else if (MASS[i] > 3000) dust(i, PX[i], PY[i], gz, Math.cbrt(MASS[i])*0.25*Math.min(1.6, hard/7));
    }
    return true;
  }
  function bldContacts(i){
    const L = BCL[i]; if (!L) return;
    const X = BCX[i], r = RC[i] + 0.15;
    for (let q = 0; q < L.length; q++){
      const k = L[q], z1 = bixZ(X, k); if (PZ[i] - r > z1 - 0.05 || PZ[i] + r < X.z0[k]) continue;
      const ux = X.ux[k], uy = X.uy[k], dx = PX[i] - X.cx[k], dy = PY[i] - X.cy[k], lu = dx*ux + dy*uy, lv = -dx*uy + dy*ux;
      const ou = X.hu[k] + r - Math.abs(lu), ov = X.hv[k] + r - Math.abs(lv); if (ou <= 0 || ov <= 0) continue;
      const oz = z1 + r - PZ[i];
      if (oz < ou && oz < ov && oz < r + 1){ GT[i] = -1e9; continue; }   // on / at the roof: the ground cache takes it
      let nx, ny, pen; if (ou < ov){ const s = lu >= 0 ? 1 : -1; nx = ux*s; ny = uy*s; pen = ou; } else { const s = lv >= 0 ? 1 : -1; nx = -uy*s; ny = ux*s; pen = ov; }
      PX[i] += nx*pen; PY[i] += ny*pen;
      const vn = VX[i]*nx + VY[i]*ny;
      if (vn < 0){ const e = vn < -1.5 ? E[i] + 0.1 : 0; VX[i] -= (1 + e)*vn*nx; VY[i] -= (1 + e)*vn*ny;
        const tx = -ny, ty = nx, vt = VX[i]*tx + VY[i]*ty, dvt = -Math.sign(vt)*Math.min(Math.abs(vt), MU[i]*(-vn)*(1 + e)); VX[i] += dvt*tx; VY[i] += dvt*ty; VZ[i] *= 0.98;
        WZ[i] += vt*0.15/Math.max(0.3, RC[i]); FL[i] |= F_TOUCH; }
    }
  }
  function splash(i){
    T.splashes++; if (KIND[i] !== K_CAR && (MASS[i] < 150 || T.t - T.splT < 0.12)) return; T.splT = T.t;   // rate-limited: many chunks hit the water at once
    const s = clamp(Math.cbrt(MASS[i])/(KIND[i] === K_CAR ? 7 : 10), 0.2, 2.5), x = PX[i], y = PY[i];
    try { if (window.SGFX && SGFX.splash) SGFX.splash(x, y, 0, s); } catch (e){ /* optional */ }
    if (s > 0.6) try { if (window.SGAudio && SGAudio.fx) SGAudio.fx('splash', {x, y, z:0, k:clamp(s/2, 0.2, 1)}); } catch (e){ /* optional */ }
  }
  // ---------------------------------------------------------------- [lm30/phys2] dust, fracture, lost support
  let GMU = 1;   // ground friction factor (1: streets)
  const DU = {n:0, fn:null, total:0, frac:0, woke:0};
  function dust(i, x, y, z, size){
    if (DU.n >= 1) return; DU.n++; DU.total++;
    const col = MAT[i] === 2 ? null : [CR[i]*0.6 + 0.24, CG[i]*0.6 + 0.23, CB[i]*0.6 + 0.21];
    try { if (typeof API.dust === 'function'){ API.dust(x, y, z, size, col); return; } const F = typeof window !== 'undefined' && window.SGFX; if (F && F.dust) F.dust(x, y, z, clamp(size/3, 0.3, 1)); } catch (e){ /* optional */ }
  }
  const FRQ = new Int32Array(8), FRV = new Float64Array(8); let FRQn = 0;
  // a big piece lands hard: it breaks in two (three when it is heavy) along its longest side; momentum kept, the pieces fly a little apart
  function fracture(i, hard){
    if (!AL[i] || NAL > 380) return;   // never at the cost of recycling or the frame budget (a big collapse already fills the pool)
    rot(i); const hx = HX[i], hy = HY[i], hz = HZ[i]; let ax = 0, hl = hx; if (hy > hl){ ax = 1; hl = hy; } if (hz > hl){ ax = 2; hl = hz; }
    if (hl < 0.6) return;
    const np = MASS[i] > 6000 ? 3 : 2, ux = RM[ax], uy = RM[3 + ax], uz = RM[6 + ax], seg = 2*hl/np, x0 = PX[i], y0 = PY[i], z0 = PZ[i], q = [QX[i], QY[i], QZ[i], QW[i]];
    const col = [CR[i], CG[i], CB[i]], life = Math.max(8, LIFE[i] - AGE[i]), sp = Math.min(3, hard*0.25), vx = VX[i], vy = VY[i], vz = VZ[i], mat = MATN[MAT[i]];
    for (let k = 0; k < np; k++){
      const off = -hl + seg*(k + 0.5), f = 0.92 + 0.16*rnd(), px = x0 + ux*off, py = y0 + uy*off, pz = z0 + uz*off + 0.02, sgn = (k + 0.5)/np - 0.5;
      const dims = [hx*2, hy*2, hz*2]; dims[ax] = seg*f;
      if (k === 0){ HX[i] = dims[0]/2; HY[i] = dims[1]/2; HZ[i] = dims[2]/2; PX[i] = px; PY[i] = py; PZ[i] = pz; RAD[i] = Math.sqrt(HX[i]*HX[i] + HY[i]*HY[i] + HZ[i]*HZ[i]); RC[i] = Math.max(0.12, (HX[i] + HY[i] + HZ[i])/3*1.12);
        setMass(i, Math.max(0.5, MATS[mat][0]*dims[0]*dims[1]*dims[2])); VX[i] += ux*sgn*sp; VY[i] += uy*sgn*sp; VZ[i] += Math.abs(sgn)*sp*0.5; WX[i] += (rnd() - 0.5)*2; WY[i] += (rnd() - 0.5)*2; FT[i]++; FL[i] |= F_DIRTY; GT[i] = -1e9; wake_(i); continue; }
      const c = 0.9 + 0.2*rnd(), id = spawn(KIND[i] === K_SLAB ? 'slab' : 'chunk', {x:px, y:py, z:pz, vx:vx + ux*sgn*sp + (rnd() - 0.5), vy:vy + uy*sgn*sp + (rnd() - 0.5), vz:Math.abs(vz)*0.15 + Math.abs(sgn)*sp*0.5,
        w:dims[0], d:dims[1], h:dims[2], q, col:[col[0]*c, col[1]*c, col[2]*c], life, mat, spin:1.5 + rnd()*2});
      const j = slotOf(id); if (j >= 0) FT[j] = FT[i];
    }
    DU.frac++; dust(i, x0, y0, z0 - hz*0.5, Math.cbrt(MASS[i]*np)*0.35);
  }
  // a sleeping body checks (24 a step, round robin) that it still rests on something: the ground / a roof under its lowest corner, or a
  // body under it in the grid; otherwise it wakes (the body below moved away, the roof under it fell)
  let SUPI = 0;
  function supportCheck(){
    if (HI < 0) return; let n = 0;
    for (let c = 0; c <= HI && n < 24; c++){
      const i = SUPI = (SUPI + 1) % (HI + 1); if (!AL[i] || !(FL[i] & F_SLEEP) || (FL[i] & F_WET)) continue; n++;
      rot(i); const low = PZ[i] - (Math.abs(RM[6])*HX[i] + Math.abs(RM[7])*HY[i] + Math.abs(RM[8])*HZ[i]);
      if (T.t - GT[i] > 2) GT[i] = -1e9; const gz = groundZ(i); if (low - gz < 0.12) continue;
      let sup = false; const a = CXI[i], b = CYI[i];
      for (let da = -1; da <= 1 && !sup; da++) for (let db = -1; db <= 1 && !sup; db++){
        for (let j = HEAD[ghash(a + da, b + db)]; j >= 0; j = NEXT[j]){
          if (j === i || CXI[j] !== a + da || CYI[j] !== b + db) continue;
          const dz = PZ[i] - PZ[j], rr = RAD[i] + RAD[j]; if (dz <= 0.02 || dz > rr) continue;
          const dx = PX[i] - PX[j], dy = PY[i] - PY[j]; if (dx*dx + dy*dy < rr*rr*0.6){ sup = true; break; } }
      }
      if (!sup){ wake_(i); GT[i] = -1e9; DU.woke++; }
    }
  }
  // ---------------------------------------------------------------- body - body: hashed 4 m grid; box corners against the other box
  // Broadphase: bounding spheres in a hashed 4 m grid. Narrowphase: the 8 corners of each box tested inside the other one (its local
  // frame, the axis of least penetration = the face normal), up to 8 contacts per pair resolved with impulses at the corners (normal +
  // friction, both bodies' rotation); a sleeping body acts as fixed unless it is hit hard. Edge-edge contacts are not detected (debris).
  const GS = 4, GM = 4095, HEAD = new Int32Array(GM + 1), NEXT = new Int32Array(CAP), CXI = new Int32Array(CAP), CYI = new Int32Array(CAP);
  const ghash = (a, b) => ((a & 63) << 6) | (b & 63);     // 64 x 64 buckets of 4 m cells (cells 256 m apart share one; filtered)
  function gridBuild(){
    HEAD.fill(-1);
    for (let i = 0; i <= HI; i++){ if (!AL[i]) continue; const a = Math.floor(PX[i]/GS), b = Math.floor(PY[i]/GS), k = ghash(a, b); CXI[i] = a; CYI[i] = b; NEXT[i] = HEAD[k]; HEAD[k] = i; }
  }
  const RA = new Float64Array(9), RB = new Float64Array(9);
  function rotTo(i, R){ rot(i); R[0] = RM[0]; R[1] = RM[1]; R[2] = RM[2]; R[3] = RM[3]; R[4] = RM[4]; R[5] = RM[5]; R[6] = RM[6]; R[7] = RM[7]; R[8] = RM[8]; }
  // contacts of the pair: point (world), normal (pushing a away from b), depth
  const PCX = new Float64Array(16), PCY = new Float64Array(16), PCZ = new Float64Array(16), PNX = new Float64Array(16), PNY = new Float64Array(16), PNZ = new Float64Array(16), PCD = new Float64Array(16);
  let PN = 0;
  // corners of box a inside box b; sg = +1: normal pushes a away from b (as stored), -1: the roles are swapped (store the negated normal)
  function cornersIn(a, Ra, b, Rb, sg){
    const hx = HX[a]*0.97, hy = HY[a]*0.97, hz = HZ[a]*0.97, bx = HX[b], by = HY[b], bz = HZ[b];
    for (let c = 0; c < 8 && PN < 16; c++){
      const sx = (c & 1) ? hx : -hx, sy = (c & 2) ? hy : -hy, sz = (c & 4) ? hz : -hz;
      const wx = PX[a] + Ra[0]*sx + Ra[1]*sy + Ra[2]*sz, wy = PY[a] + Ra[3]*sx + Ra[4]*sy + Ra[5]*sz, wz = PZ[a] + Ra[6]*sx + Ra[7]*sy + Ra[8]*sz;
      const dx = wx - PX[b], dy = wy - PY[b], dz = wz - PZ[b];
      const lx = Rb[0]*dx + Rb[3]*dy + Rb[6]*dz, ox = bx - Math.abs(lx); if (ox <= 0) continue;
      const ly = Rb[1]*dx + Rb[4]*dy + Rb[7]*dz, oy = by - Math.abs(ly); if (oy <= 0) continue;
      const lz = Rb[2]*dx + Rb[5]*dy + Rb[8]*dz, oz = bz - Math.abs(lz); if (oz <= 0) continue;
      let nx, ny, nz, d;
      if (ox <= oy && ox <= oz){ const s = lx >= 0 ? 1 : -1; nx = Rb[0]*s; ny = Rb[3]*s; nz = Rb[6]*s; d = ox; }
      else if (oy <= oz){ const s = ly >= 0 ? 1 : -1; nx = Rb[1]*s; ny = Rb[4]*s; nz = Rb[7]*s; d = oy; }
      else { const s = lz >= 0 ? 1 : -1; nx = Rb[2]*s; ny = Rb[5]*s; nz = Rb[8]*s; d = oz; }
      PCX[PN] = wx; PCY[PN] = wy; PCZ[PN] = wz; PNX[PN] = nx*sg; PNY[PN] = ny*sg; PNZ[PN] = nz*sg; PCD[PN] = d; PN++;
    }
  }
  // impulse response of body i at arm r along unit u: Ii (r x u) -> (BB[0], BB[1], BB[2]), returns u . ((Ii (r x u)) x r)
  function angK(i, R, rx, ry, rz, ux, uy, uz){
    const cx = ry*uz - rz*uy, cy = rz*ux - rx*uz, cz = rx*uy - ry*ux;
    const a0 = (R[0]*cx + R[3]*cy + R[6]*cz)*IIX[i], a1 = (R[1]*cx + R[4]*cy + R[7]*cz)*IIY[i], a2 = (R[2]*cx + R[5]*cy + R[8]*cz)*IIZ[i];
    BB[0] = R[0]*a0 + R[1]*a1 + R[2]*a2; BB[1] = R[3]*a0 + R[4]*a1 + R[5]*a2; BB[2] = R[6]*a0 + R[7]*a1 + R[8]*a2;
    return ux*(BB[1]*rz - BB[2]*ry) + uy*(BB[2]*rx - BB[0]*rz) + uz*(BB[0]*ry - BB[1]*rx);
  }
  function pairResolve(i, j){
    const fixJ = (FL[j] & F_SLEEP) !== 0, PMU = Math.sqrt(MU[i]*MU[j]);
    let maxD = 0, mx = 0, my = 0, mz = 0;
    for (let c = 0; c < PN; c++){ if (PCD[c] > maxD){ maxD = PCD[c]; mx = PNX[c]; my = PNY[c]; mz = PNZ[c]; } }
    // a vertical contact: the lower body acts ten times heavier (stacks do not sink into the ground)
    let mi = IM[i], mj = fixJ ? 0 : IM[j], si = 1, sj = 1;
    if (mz > 0.7){ mj *= 0.1; sj = 0.1; } else if (mz < -0.7){ mi *= 0.1; si = 0.1; }
    let hard = 0;
    for (let it = 0; it < 2; it++) for (let c = 0; c < PN; c++){
      const nx = PNX[c], ny = PNY[c], nz = PNZ[c];
      const rix = PCX[c] - PX[i], riy = PCY[c] - PY[i], riz = PCZ[c] - PZ[i], rjx = PCX[c] - PX[j], rjy = PCY[c] - PY[j], rjz = PCZ[c] - PZ[j];
      const vx = (VX[i] + WY[i]*riz - WZ[i]*riy) - (fixJ ? 0 : VX[j] + WY[j]*rjz - WZ[j]*rjy), vy = (VY[i] + WZ[i]*rix - WX[i]*riz) - (fixJ ? 0 : VY[j] + WZ[j]*rjx - WX[j]*rjz), vz = (VZ[i] + WX[i]*riy - WY[i]*rix) - (fixJ ? 0 : VZ[j] + WX[j]*rjy - WY[j]*rjx);
      const vn = vx*nx + vy*ny + vz*nz; if (vn >= 0) continue;
      if (-vn > hard) hard = -vn;
      const ki = angK(i, RA, rix, riy, riz, nx, ny, nz)*si, bi0 = BB[0]*si, bi1 = BB[1]*si, bi2 = BB[2]*si;
      let kj = 0, bj0 = 0, bj1 = 0, bj2 = 0; if (!fixJ){ kj = angK(j, RB, rjx, rjy, rjz, nx, ny, nz)*sj; bj0 = BB[0]*sj; bj1 = BB[1]*sj; bj2 = BB[2]*sj; }
      const e = it === 0 && vn < -1.5 ? Math.max(E[i], E[j]) : 0, jn = -(1 + e)*vn/(mi + mj + ki + kj);
      VX[i] += jn*nx*mi; VY[i] += jn*ny*mi; VZ[i] += jn*nz*mi; WX[i] += bi0*jn; WY[i] += bi1*jn; WZ[i] += bi2*jn;
      if (!fixJ){ VX[j] -= jn*nx*mj; VY[j] -= jn*ny*mj; VZ[j] -= jn*nz*mj; WX[j] -= bj0*jn; WY[j] -= bj1*jn; WZ[j] -= bj2*jn; }
      // friction
      const tvx = vx - vn*nx, tvy = vy - vn*ny, tvz = vz - vn*nz, tl = Math.sqrt(tvx*tvx + tvy*tvy + tvz*tvz);
      if (tl > 1e-5){ const tx = tvx/tl, ty = tvy/tl, tz = tvz/tl, kti = angK(i, RA, rix, riy, riz, tx, ty, tz)*si, ti0 = BB[0]*si, ti1 = BB[1]*si, ti2 = BB[2]*si;
        let ktj = 0, tj0 = 0, tj1 = 0, tj2 = 0; if (!fixJ){ ktj = angK(j, RB, rjx, rjy, rjz, tx, ty, tz)*sj; tj0 = BB[0]*sj; tj1 = BB[1]*sj; tj2 = BB[2]*sj; }
        const jt = -Math.min(tl/(mi + mj + kti + ktj), PMU*jn);
        VX[i] += jt*tx*mi; VY[i] += jt*ty*mi; VZ[i] += jt*tz*mi; WX[i] += ti0*jt; WY[i] += ti1*jt; WZ[i] += ti2*jt;
        if (!fixJ){ VX[j] -= jt*tx*mj; VY[j] -= jt*ty*mj; VZ[j] -= jt*tz*mj; WX[j] -= tj0*jt; WY[j] -= tj1*jt; WZ[j] -= tj2*jt; } }
    }
    // position: split the deepest penetration by inverse mass
    const ms = mi + mj, d = Math.max(0, maxD - 0.004)*0.7;
    if (ms > 0 && d > 0){ PX[i] += mx*d*mi/ms; PY[i] += my*d*mi/ms; PZ[i] += mz*d*mi/ms; if (!fixJ){ PX[j] -= mx*d*mj/ms; PY[j] -= my*d*mj/ms; PZ[j] -= mz*d*mj/ms; } }
    if (mz > 0.5) FL[i] |= F_TOUCH; if (mz < -0.5 && !fixJ) FL[j] |= F_TOUCH;
    if (fixJ && hard > 2.5) wake_(j);
    // [lm30/phys2] a sleeping body on top of one that moves wakes up with it (stacks follow what they stand on)
    else if (fixJ && mz < -0.5 && VX[i]*VX[i] + VY[i]*VY[i] + VZ[i]*VZ[i] > 0.25){ wake_(j); GT[j] = -1e9; }
  }
  function pairs(){
    for (let i = 0; i <= HI; i++){
      if (!AL[i] || (FL[i] & F_SLEEP)) continue;
      const a = CXI[i], b = CYI[i];
      for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++){
        let j = HEAD[ghash(a + da, b + db)];
        for (; j >= 0; j = NEXT[j]){
          if (j === i || CXI[j] !== a + da || CYI[j] !== b + db) continue;
          if (j < i && !(FL[j] & F_SLEEP)) continue;     // awake pairs once
          const dx = PX[j] - PX[i], dy = PY[j] - PY[i], dz = PZ[j] - PZ[i], rr = RAD[i] + RAD[j];
          if (dx*dx + dy*dy + dz*dz >= rr*rr) continue;
          rotTo(i, RA);
          // separating axes of box i: j's centre farther than its bounding radius from the box -> apart
          const lx = RA[0]*dx + RA[3]*dy + RA[6]*dz, ly = RA[1]*dx + RA[4]*dy + RA[7]*dz, lz = RA[2]*dx + RA[5]*dy + RA[8]*dz, rj = RAD[j];
          if (Math.abs(lx) > HX[i] + rj || Math.abs(ly) > HY[i] + rj || Math.abs(lz) > HZ[i] + rj) continue;
          rotTo(j, RB);
          const mx = -(RB[0]*dx + RB[3]*dy + RB[6]*dz), my = -(RB[1]*dx + RB[4]*dy + RB[7]*dz), mz = -(RB[2]*dx + RB[5]*dy + RB[8]*dz), ri = RAD[i];
          if (Math.abs(mx) > HX[j] + ri || Math.abs(my) > HY[j] + ri || Math.abs(mz) > HZ[j] + ri) continue;
          PN = 0;
          cornersIn(i, RA, j, RB, 1); cornersIn(j, RB, i, RA, -1);
          if (PN) pairResolve(i, j);
        }
      }
    }
  }
  // ---------------------------------------------------------------- the player's car (an oriented box; SGF1.crash.hit gets the impulse)
  const CAR = {on:false, x:0, y:0, z:0, cs:1, sn:0, hl:2.4, hw:0.95, hh:1.5, vx:0, vy:0, m:1600};
  function carSnap(){
    CAR.on = false;
    try { const F = window.SGF1; if (!F || !F.F1 || !F.F1.on) return;
      if (F.crash && F.crash.body){ const b = F.crash.body(); if (!b) return; CAR.x = b.x; CAR.y = b.y; CAR.z = b.z; CAR.cs = Math.cos(b.psi); CAR.sn = Math.sin(b.psi); CAR.hl = b.hl; CAR.hw = b.hw; CAR.hh = b.h || 1.5; CAR.vx = b.vx; CAR.vy = b.vy; CAR.m = b.m || 1600; CAR.on = true; return; }
      const C = F.CAR; CAR.x = C.x; CAR.y = C.y; CAR.z = C.z; CAR.cs = Math.cos(C.psi); CAR.sn = Math.sin(C.psi); CAR.vx = C.u*CAR.cs - C.v*CAR.sn; CAR.vy = C.u*CAR.sn + C.v*CAR.cs;
      const TP = window.SGTraffic && SGTraffic.player; CAR.hl = TP && TP.hl ? TP.hl : 2.4; CAR.hw = TP && TP.hw ? TP.hw : 0.95; CAR.hh = 1.5; CAR.m = 1600; CAR.on = true; } catch (e){ CAR.on = false; }
  }
  function carContacts(){
    if (!CAR.on) return;
    for (let i = 0; i <= HI; i++){
      if (!AL[i] || (FL[i] & F_SLEEP)) continue;
      const dx = PX[i] - CAR.x, dy = PY[i] - CAR.y, r = RC[i]; if (Math.abs(dx) > CAR.hl + r + 2 || Math.abs(dy) > CAR.hl + r + 2) continue;
      if (PZ[i] - r > CAR.z + CAR.hh || PZ[i] + r < CAR.z) continue;
      const lu = dx*CAR.cs + dy*CAR.sn, lv = -dx*CAR.sn + dy*CAR.cs, ou = CAR.hl + r - Math.abs(lu), ov = CAR.hw + r - Math.abs(lv); if (ou <= 0 || ov <= 0) continue;
      const oz = CAR.z + CAR.hh + r - PZ[i];
      let nx = 0, ny = 0, nz = 0, pen;
      if (oz < ou && oz < ov){ nz = 1; pen = oz; }       // on the roof / bonnet
      else if (ou < ov){ const s = lu >= 0 ? 1 : -1; nx = CAR.cs*s; ny = CAR.sn*s; pen = ou; } else { const s = lv >= 0 ? 1 : -1; nx = -CAR.sn*s; ny = CAR.cs*s; pen = ov; }
      PX[i] += nx*pen; PY[i] += ny*pen; PZ[i] += nz*pen;
      const rvx = VX[i] - CAR.vx, rvy = VY[i] - CAR.vy, rvz = VZ[i], vn = rvx*nx + rvy*ny + rvz*nz; if (vn >= 0) continue;
      const mb = MASS[i], mc = CAR.m, mr = mb*mc/(mb + mc), e = 0.15, j = -(1 + e)*vn*mr;
      VX[i] += j*nx/mb; VY[i] += j*ny/mb; VZ[i] += j*nz/mb; FL[i] |= F_TOUCH | F_DIRTY;
      const En = 0.5*mr*vn*vn;
      if (En > 1500 && T.t - HITT[i] > 0.3){ HITT[i] = T.t; T.carHits++;
        try { const F = window.SGF1; if (F && F.crash && F.crash.hit) F.crash.hit(-j*nx, -j*ny, -j*nz, PX[i] - nx*r, PY[i] - ny*r, PZ[i] - nz*r, En, (FL[i] & F_VEH) ? 'car' : 'debris'); } catch (e2){ /* optional */ } }
    }
  }
  // ---------------------------------------------------------------- per frame
  function step(dt){
    if (!(dt > 0) || !NAL){ if (KILLED.length) render(); return; }
    const t0 = now(); dt = Math.min(dt, 0.05); T.t += dt; T.steps++;
    if (BIX.job) bixWork(BIX.job, 2);
    const n = dt > 0.021 ? 2 : 1, h = dt/n;
    gridBuild(); carSnap(); DU.n = 0; FRQn = 0;
    supportCheck();
    for (let s = 0; s < n; s++){
      for (let i = 0; i <= HI; i++){
        if (!AL[i] || (FL[i] & F_SLEEP)) continue;
        FL[i] &= ~F_TOUCH;
        integrate(i, h);
      }
      if (s === 0) pairs();
      for (let i = 0; i <= HI; i++){
        if (!AL[i] || (FL[i] & F_SLEEP)) continue;
        bldContacts(i);
        groundContacts(i, h);
      }
    }
    carContacts();
    // [lm30/phys2] the pieces that broke on landing; heavy pieces falling fast trail dust
    for (let q = 0; q < FRQn; q++) fracture(FRQ[q], FRV[q]);
    FRQn = 0;
    // sleep, life, fade
    let awake = 0;
    for (let i = 0; i <= HI; i++){
      if (!AL[i]) continue;
      AGE[i] += dt;
      if (AGE[i] > LIFE[i]){ if (AGE[i] > LIFE[i] + 2.5){ kill_(i); continue; } FL[i] |= F_FADE | F_DIRTY; if (FL[i] & F_SLEEP){ FL[i] |= F_DIRTY; } }
      if (FL[i] & F_SLEEP) continue;
      awake++;
      if (MASS[i] > 6000 && VZ[i] < -7 && !(FL[i] & (F_EXT | F_WET)) && (DT[i] -= dt) <= 0){ DT[i] = 0.3; dust(i, PX[i], PY[i], PZ[i], Math.cbrt(MASS[i])*0.12); }
      const v2 = VX[i]*VX[i] + VY[i]*VY[i] + VZ[i]*VZ[i], w2 = WX[i]*WX[i] + WY[i]*WY[i] + WZ[i]*WZ[i];
      if ((FL[i] & F_TOUCH) && v2 < 0.06 && w2 < 0.12){ SLT[i] += dt; if (SLT[i] > 0.5){ FL[i] |= F_SLEEP | F_DIRTY; VX[i] = VY[i] = VZ[i] = WX[i] = WY[i] = WZ[i] = 0; } }
      else if ((FL[i] & F_WET) && v2 < 0.5){ SLT[i] = 0; }
      else SLT[i] = 0;
      FL[i] |= F_DIRTY;
    }
    while (HI >= 0 && !AL[HI] && !(FL[HI] & F_DIRTY)) HI--;
    render();
    T.awake = awake;
    const ms = now() - t0; T.ms = T.ms*0.95 + ms*0.05; T.msMax = Math.max(T.msMax*0.995, ms); T.last = ms;
  }
  // ---------------------------------------------------------------- impulses
  function impulse(x, y, z, r, k){
    if (!(r > 0) || !(k > 0)) return 0; let n = 0;
    for (let i = 0; i <= HI; i++){
      if (!AL[i]) continue; const dx = PX[i] - x, dy = PY[i] - y, dz = PZ[i] - (z || 0), d = Math.sqrt(dx*dx + dy*dy + dz*dz); if (d > r) continue;
      const f = 1 - d/r, dv = k*f*((FL[i] & F_EXT) ? clamp(Math.sqrt(1500/MASS[i]), 0.25, 1.4) : 1), hl = Math.hypot(dx, dy) || 1;
      let ux = dx/hl, uy = dy/hl, uz = 0.55 + Math.max(0, dz)/(d + 1); const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
      VX[i] += ux*dv; VY[i] += uy*dv; VZ[i] += uz*dv;
      const sp = dv*0.35/Math.max(0.4, RC[i]); WX[i] += (rnd() - 0.5)*sp - uy*sp; WY[i] += (rnd() - 0.5)*sp + ux*sp; WZ[i] += (rnd() - 0.5)*sp;
      wake_(i); GT[i] = -1e9; n++;
    }
    try { if (window.SGTraffic && SGTraffic.toss) SGTraffic.toss(x, y, z || 0, r, k); } catch (e){ /* optional */ }
    try { const F = window.SGF1; if (F && F.crash && F.crash.impulse) F.crash.impulse(x, y, z || 0, r, k); } catch (e){ /* optional */ }
    return n;
  }
  function pose(id, out){
    const i = slotOf(id); if (i < 0){ if (out) out.alive = false; return null; }
    out = out || {}; out.x = PX[i]; out.y = PY[i]; out.z = PZ[i]; out.qx = QX[i]; out.qy = QY[i]; out.qz = QZ[i]; out.qw = QW[i];
    out.vx = VX[i]; out.vy = VY[i]; out.vz = VZ[i]; out.wx = WX[i]; out.wy = WY[i]; out.wz = WZ[i]; out.sleep = !!(FL[i] & F_SLEEP); out.wet = !!(FL[i] & F_WET); out.alive = true;
    out.hx = HX[i]; out.hy = HY[i]; out.hz = HZ[i]; out.age = AGE[i];
    return out;
  }
  function setLife(id, life){ const i = slotOf(id); if (i < 0) return false; LIFE[i] = life; return true; }
  function push(id, dvx, dvy, dvz, dwx, dwy, dwz){ const i = slotOf(id); if (i < 0) return false; VX[i] += dvx || 0; VY[i] += dvy || 0; VZ[i] += dvz || 0; WX[i] += dwx || 0; WY[i] += dwy || 0; WZ[i] += dwz || 0; wake_(i); return true; }
  function clear(){ for (let i = 0; i <= HI; i++) if (AL[i]) kill_(i); render(); return true; }
  // ---------------------------------------------------------------- drawing: one InstancedMesh of irregular chunks
  const RN = {mesh:null, M:null, C:null, ok:typeof THREE !== 'undefined'};
  function chunkGeo(){
    // a box with chamfered, jittered corners (broken concrete), unit size, centred
    const g = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2), p = g.attributes.position; let s = 7;
    const r = () => { s = (s*16807) % 2147483647; return s/2147483647; };
    for (let i = 0; i < p.count; i++){ const x = p.getX(i), y = p.getY(i), z = p.getZ(i), corner = Math.abs(x) > 0.4 && Math.abs(y) > 0.4 && Math.abs(z) > 0.4;
      const k = corner ? 0.78 + 0.1*r() : 0.92 + 0.12*r(); p.setXYZ(i, x*k + (r() - 0.5)*0.06, y*k + (r() - 0.5)*0.06, z*k + (r() - 0.5)*0.06); }
    // weld-free: keep flat-ish faces via computeVertexNormals on the non-indexed copy
    const ng = g.toNonIndexed(); ng.computeVertexNormals(); g.dispose(); return ng;
  }
  function renderInit(){
    if (RN.mesh || !RN.ok || typeof scene === 'undefined') return;
    const geo = chunkGeo(), mat = new THREE.MeshLambertMaterial({color:0xffffff});
    const m = new THREE.InstancedMesh(geo, mat, CAP); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAP*3), 3); m.instanceColor.setUsage(THREE.DynamicDrawUsage);
    m.count = 0; m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; m.name = 'sgphys';
    RN.mesh = m; RN.M = m.instanceMatrix.array; RN.C = m.instanceColor.array; RN.M.fill(0); scene.add(m);
  }
  function writeM(i, s){
    const M = RN.M, o = i*16; if (!s){ for (let k = 0; k < 16; k++) M[o + k] = 0; return; }
    // world (x east, y north, z up) -> three (x, z, -y); body axes: x length, y width, z height -> three local (x, z, -y)
    rot(i); const sx = 2*HX[i]*s, sy = 2*HZ[i]*s, sz = 2*HY[i]*s;
    // three columns: c0 = M r(:,0), c1 = M r(:,2), c2 = -M r(:,1); M(v) = (v.x, v.z, -v.y)
    M[o] = RM[0]*sx; M[o + 1] = RM[6]*sx; M[o + 2] = -RM[3]*sx; M[o + 3] = 0;
    M[o + 4] = RM[2]*sy; M[o + 5] = RM[8]*sy; M[o + 6] = -RM[5]*sy; M[o + 7] = 0;
    M[o + 8] = -RM[1]*sz; M[o + 9] = -RM[7]*sz; M[o + 10] = RM[4]*sz; M[o + 11] = 0;
    M[o + 12] = PX[i]; M[o + 13] = PZ[i]; M[o + 14] = -PY[i]; M[o + 15] = 1;
  }
  function render(){
    if (!RN.mesh){ for (let q = 0; q < KILLED.length; q++){ const i = KILLED[q]; if (!AL[i]) FL[i] = 0; } KILLED.length = 0; return; }
    let lo = CAP, hi = -1;
    for (let q = 0; q < KILLED.length; q++){ const i = KILLED[q]; if (AL[i]) continue; if (FL[i] & F_DRAW){ writeM(i, 0); if (i < lo) lo = i; if (i > hi) hi = i; } FL[i] = 0; }
    KILLED.length = 0;
    let top = -1;
    for (let i = 0; i <= HI; i++){
      if (!AL[i]) continue;
      if (FL[i] & F_DRAW) top = i;
      if (!(FL[i] & F_DIRTY)) continue;
      FL[i] &= ~F_DIRTY; if (!(FL[i] & F_DRAW)) continue;
      const s = (FL[i] & F_FADE) ? clamp(1 - (AGE[i] - LIFE[i])/2.5, 0, 1) : 1;
      writeM(i, s); const C = RN.C; C[i*3] = CR[i]; C[i*3 + 1] = CG[i]; C[i*3 + 2] = CB[i];
      if (i < lo) lo = i; if (i > hi) hi = i;
    }
    if (hi > top) top = hi;
    RN.mesh.count = top + 1; RN.mesh.visible = top >= 0;
    if (hi >= lo){ const a = RN.mesh.instanceMatrix, c = RN.mesh.instanceColor; a.updateRange.offset = lo*16; a.updateRange.count = (hi - lo + 1)*16; a.needsUpdate = true; c.updateRange.offset = lo*3; c.updateRange.count = (hi - lo + 1)*3; c.needsUpdate = true; }
  }
  function stats(){
    let alive = 0, sleeping = 0, drawn = 0, ext = 0, wet = 0;
    for (let i = 0; i <= HI; i++){ if (!AL[i]) continue; alive++; if (FL[i] & F_SLEEP) sleeping++; if (FL[i] & F_DRAW) drawn++; if (FL[i] & F_EXT) ext++; if (FL[i] & F_WET) wet++; }
    return {alive, awake:alive - sleeping, sleeping, drawn, ext, wet, cap:CAP, ms:+T.ms.toFixed(3), msMax:+T.msMax.toFixed(3), last:+T.last.toFixed(3), steps:T.steps, spawned:T.spawned, recycled:T.recycled,
      splashes:T.splashes, carHits:T.carHits, sunk:T.sunk, bixTiles:BIX.tiles.size, bixMs:+BIX.ms.toFixed(1), drawCount:RN.mesh ? RN.mesh.count : 0, dust:DU.total, fractures:DU.frac, supportWakes:DU.woke};
  }
  const API = {spawn, impulse, pose, kill, wake, clear, step, stats, setLife, push, isWater, tileOf, get count(){ return NAL; }, CAP, dust:null, MATS:MATN,
    _:{AL, FL, PX, PY, PZ, VX, VY, VZ, QX, QY, QZ, QW, WX, WY, WZ, HX, HY, HZ, MASS, BIX, bixTile, bixWork, bixCell, T, F_SLEEP, F_WET, slotOf, groundRefresh, RN, MAT, E, MU, DU, fracture}};
  return API;
})();
if (typeof window !== 'undefined') window.SGPhys = SGPhys;
if (typeof HOOKS !== 'undefined') HOOKS.frame.push((t, dt) => { try { SGPhys.step(dt); } catch (e){ console.error('[phys]', e); } });
}
