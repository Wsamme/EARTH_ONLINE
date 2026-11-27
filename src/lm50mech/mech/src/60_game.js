
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
