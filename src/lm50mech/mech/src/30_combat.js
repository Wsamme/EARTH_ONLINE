
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
    const S = ST.S, A = ST.act, BI = MK.BI; S.arm[0] = S.arm[1] = null; let twist = 0, cp = 0, look = null, face = null, vK = 1, lunge = null;
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
        if (u < 0.45 && vl > R*0.9){ const dx = T[0] - S.X, dy = T[1] - S.Y, dl = Math.hypot(dx, dy) || 1, k = Math.min(14, (vl - R*0.85)*2.2); lunge = [dx/dl*k, dy/dl*k]; }
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
          if (sp){ const dx = T[0] - S.X, dy = T[1] - S.Y, dl = Math.hypot(dx, dy) || 1; if (dl - sp.r > 24) lunge = [dx/dl*12, dy/dl*12]; }
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
    return {face, vK, lunge};
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
