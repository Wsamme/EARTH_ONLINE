# v48 (lm50mech): the smallest hook in lm25/kaiju/kaiju.js for the mech mode (lm50mech/mech/mech.js).
# Applies once to the pristine file (backup kaiju.js.v48.bak); every replacement must match exactly once.
import sys
P = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/earth_online/src/lm25/kaiju/kaiju.js'
s = open(P).read()
assert 'v48 (lm50mech)' not in s, 'already patched'
def R(a, b):
    global s
    n = s.count(a)
    assert n == 1, (n, a[:90])
    s = s.replace(a, b)

# header
R("// Integration: lm25/kaiju/kaiju.js is built from src/*.js",
  "// v48 (lm50mech): the mech mode (lm50mech/mech/mech.js, window.SGMech) fights the creature. Only in a game started with start({mech:\n"
  "// {hp}}) (goal 'mech') the creature can be hurt (SGKaiju.damage) and defeated (it topples over, crushing the blocks it lands on);\n"
  "// every other mode is unchanged. Added: damage(h), onEvent(cb), status().mech, setTargets keeps hl / hw / h (the target's box),\n"
  "// the 机甲 Mech choice next to Drive / Fly / Watch (shown only when window.SGMech exists; Play hands over to SGMech.play), #mech is\n"
  "// left to the mech module. The hand-edited block is marked [v48 mech] (the src/*.js copies of mk.sh are not on this machine).\n"
  "// Integration: lm25/kaiju/kaiju.js is built from src/*.js")
# events for listeners (the mech reads the strikes) + the mech state
R("  const G = {on:false, remote:false, diff:1, goal:'survive',", "  const G = {cbE:[], mech:null, dead:null, knock:null, on:false, remote:false, diff:1, goal:'survive',")
# start: the mech option, its own HUD
R("    G.remote = !!o.remote; G.localId = o.localId || G.localId || 'local'; G.targets = null; G.buf.length = 0; G.rt = null;",
  "    G.remote = !!o.remote; G.localId = o.localId || G.localId || 'local'; G.targets = null; G.buf.length = 0; G.rt = null;\n"
  "    // [v48 mech] a mech fight: the creature has hit points (only here)\n"
  "    G.dead = null; G.knock = null; G.mech = o.mech && !G.remote ? {hp:Math.max(1, +o.mech.hp || 6000), max:Math.max(1, +o.mech.hp || 6000), hits:0, lastT:-9} : null;")
R("    hudShow(true); hudTitle(); textSync();", "    hudShow(!G.mech); hudTitle(); textSync();")
R("    caughtEnd(); hudShow(false); resultHide(); cpEnd(); askHide();", "    caughtEnd(); hudShow(false); resultHide(); cpEnd(); askHide(); G.dead = null; G.knock = null; G.mech = null;")
# setTargets keeps the target's box
R("if (isFinite(t.psi)) o.psi = +t.psi; if (t.kind) o.kind = String(t.kind); return o; })",
  "if (isFinite(t.psi)) o.psi = +t.psi; if (t.kind) o.kind = String(t.kind); for (const k of ['hl', 'hw', 'h']) if (isFinite(t[k]) && t[k] > 0) o[k] = +t[k]; return o; })")
# status
R("      destroyed:G.destroyedN, difficulty:G.diff, remote:G.remote, species:G.sp,",
  "      destroyed:G.destroyedN, difficulty:G.diff, remote:G.remote, species:G.sp, mech:G.mech ? {hp:Math.round(G.mech.hp), max:G.mech.max, hits:G.mech.hits, dead:!!G.dead, landed:!!(G.dead && G.dead.landed)} : null,")
# hinder / body: nothing on a fallen creature
R("  function hinder(h){ if (!G.on || G.remote ||", "  function hinder(h){ if (!G.on || G.remote || G.dead ||")
R("    if (!G.on || !G.P || !G.O || !G.SP || !G.SP.body || (G.P.r || 0) < 0.3){ BODY.list.length = 0; return BODY.list; }",
  "    if (!G.on || G.dead || !G.P || !G.O || !G.SP || !G.SP.body || (G.P.r || 0) < 0.3){ BODY.list.length = 0; return BODY.list; }")
# frame: the fallen creature no longer thinks
R("    else { const out = G.sim.step(dt); P = G.P = G.sim.S; G.O = G.sim.O; for (const e of out.events) onEvent(e); }",
  "    else if (G.dead){ P = G.P = G.sim.S; deadStep(P, dt); }     // [v48 mech]\n"
  "    else { const out = G.sim.step(dt); P = G.P = G.sim.S; G.O = G.sim.O; for (const e of out.events) onEvent(e); if (G.knock) knockStep(P, dt); }")
R("    KFX.eyes(O.eye, ek, P.r > 0.35);", "    KFX.eyes(O.eye, G.dead ? 0 : ek, P.r > 0.35 && !G.dead);")
# placeModel: the fall
R("    K.root.updateMatrixWorld(true);\n", "    if (G.dead) deadTilt(K);     // [v48 mech]\n    K.root.updateMatrixWorld(true);\n")
# onEvent: listeners
R("  function onEvent(e){\n", "  function onEvent(e){\n    for (const cb of G.cbE){ try { cb(e); } catch (er){ console.error('[kaiju] onEvent', er); } }     // [v48 mech]\n")
# the mech block (damage, knock-back, the fall), before the contract helpers of 60_api's KG export
R("  function hinder(h){ if (!G.on || G.remote || G.dead ||",
  """  // ================= [v48 mech] the mech fight (lm50mech): damage, a knock-back, the fall =================
  // damage({k, x, y, z, src, push, px, py}): k hit points off (start({mech:{hp}}) games only); k >= 6 also flinches / slows it like an
  // army hit; push (m) with the unit direction (px, py) shoves it back over ~1.2 s (it stumbles; its feet keep stepping). At 0 hp it
  // falls: a shudder, then it topples in the push direction about its feet, the blocks under the fall line collapse (KW.blast), a dust
  // wave, a rumble; it stays lying there (status().mech.dead / landed; events 'defeated', 'fallen' to onEvent listeners).
  function damage(h){
    if (!G.on || G.remote || !G.mech || G.dead || !G.sim || !h || typeof h !== 'object') return false;
    const k = Math.max(0, +h.k || 0); if (!(k > 0)) return false;
    const M = G.mech, S = G.sim.S; M.hp = Math.max(0, M.hp - k); M.hits++; M.lastT = G.t;
    let px = +h.px || 0, py = +h.py || 0; if (!(Math.hypot(px, py) > 0.1) && isFinite(+h.x)){ px = S.x - +h.x; py = S.y - +h.y; } const pl = Math.hypot(px, py); if (pl > 1e-3){ px /= pl; py /= pl; } else { px = -Math.sin(S.hdg); py = -Math.cos(S.hdg); }
    if (k >= 6 && G.sim.hinder) try { G.sim.hinder({x:isFinite(+h.x) ? +h.x : S.x, y:isFinite(+h.y) ? +h.y : S.y, z:+h.z || 0, k:Math.min(1, k/30), src:h.src === undefined ? 'mech' : h.src}); } catch (e){ /* */ }
    if (+h.push > 0){ const d = Math.min(80, +h.push); G.knock = {vx:px*d/0.8, vy:py*d/0.8, t:0, dur:1.2}; }
    if (M.hp <= 0){ G.dead = {t0:G.t, fx:px, fy:py, landed:false, a:0}; S.k = 0; S.p = 0; S.v = 0; G.knock = null;
      const e = {e:'defeated', x:S.x, y:S.y}; for (const cb of G.cbE){ try { cb(e); } catch (er){ console.error('[kaiju] onEvent', er); } }
      try { if (G.sp === 'cthulhu') KFX.roar(G.O.mouth[0], G.O.mouth[1], G.O.mouth[2], 0.8); else if (KSX.ROAR[G.sp]) KSX.ROAR[G.sp](G.O.mouth[0], G.O.mouth[1], G.O.mouth[2], 0.8); } catch (er){ /* */ } }
    return {hp:Math.round(M.hp), max:M.max, dead:!!G.dead};
  }
  // the shove: eases out over dur; the gait advances with the distance (it stumbles back)
  function knockStep(P, dt){
    const N = G.knock; N.t += dt; const u = N.t/N.dur; if (u >= 1){ G.knock = null; return; }
    const f = 2*(1 - u)*dt/N.dur*0.8, dx = N.vx*f, dy = N.vy*f; P.x += dx; P.y += dy;
    if (G.SP.strideOf) P.g = (P.g + Math.hypot(dx, dy)/G.SP.strideOf(Math.max(4, P.v || 0), P)) % 1;
  }
  // the fallen creature: posed standing still, shuddering, then tipped over about its feet (deadTilt in placeModel)
  function deadStep(P, dt){
    const D = G.dead, t = G.t - D.t0; P.v = 0; P.k = 0; P.p = 0; P.t += dt;
    if (G.SP.ctxStep) G.SP.ctxStep(G.ctx, P, ENV); G.SP.pose(P, ENV, G.O, G.ctx);
    const u = Math.max(0, Math.min(1, (t - 1.1)/2.7)); D.a = 1.42*u*u;
    if (u >= 1 && !D.landed){ D.landed = true; const L = 300*(G.SP.fallLen || 1), gz0 = KW.ground(P.x, P.y);
      for (const d of [40, 95, 150, 205, 260].map(v => v*L/300)){ const x = P.x + D.fx*d, y = P.y + D.fy*d; try { const acc = KW.blast(x, y, KW.ground(x, y), 58, 0.95); if (Array.isArray(acc) && acc.length) forwardDestroyed(acc); } catch (e){ /* */ } }
      try { const mx = P.x + D.fx*L*0.5, my = P.y + D.fy*L*0.5, gz = KW.ground(mx, my); KFX.dustWave(mx, my, gz, 90, 1.4); KFX.rumble(mx, my, gz, 7, 1); KFX.sfx('crunch', mx, my, gz + 10, 1); shakeEv(1, mx, my, gz, 600, 5); } catch (e){ /* */ }
      void gz0; const e = {e:'fallen', x:P.x + D.fx*L*0.5, y:P.y + D.fy*L*0.5}; for (const cb of G.cbE){ try { cb(e); } catch (er){ console.error('[kaiju] onEvent', er); } } }
    G.dripAcc = 0;
  }
  const _dq = new THREE.Quaternion(), _da = new THREE.Vector3();
  function deadTilt(K){
    const D = G.dead, t = G.t - D.t0, sh = t < 1.3 ? 0.012*Math.sin(t*23)*(1 - t/1.3) : 0, b = D.landed ? 0.02*Math.exp(-(t - 3.8)*2.5)*Math.sin((t - 3.8)*9) : 0;
    _da.set(-D.fy, 0, -D.fx); if (_da.lengthSq() < 1e-6) return; _da.normalize(); _dq.setFromAxisAngle(_da, D.a + sh + b); K.root.quaternion.premultiply(_dq);
    if (D.landed) K.root.position.y -= Math.min(10, (t - 3.8)*1.5);
  }
  function hinder(h){ if (!G.on || G.remote || G.dead ||""")
# exports
R("    hinder, body, shakeEv, shakeIn,", "    hinder, body, damage, deadStep, shakeEv, shakeIn,")
R("  hinder:h => KG.hinder(h), body:() => KG.body(),",
  "  hinder:h => KG.hinder(h), body:() => KG.body(),\n"
  "  // [v48 mech] (lm50mech): the creature's hit points in a mech game, and every core event ({e:'hit', k, x, y, z}, {e:'throw', id, ...},\n"
  "  // {e:'near'}, {e:'act', k}, {e:'defeated'}, {e:'fallen'} ...) for the mech module; onEvent returns an unsubscribe function\n"
  "  damage:h => KG.damage(h), onEvent:cb => { if (typeof cb !== 'function') return () => {}; KG.G.cbE.push(cb); return () => { const i = KG.G.cbE.indexOf(cb); if (i >= 0) KG.G.cbE.splice(i, 1); }; },")
# the 机甲 Mech choice
R("const VEHN = {drive:['驾车', 'Drive'], fly:['飞行', 'Fly'], watch:['观看', 'Watch']};",
  "const VEHN = {drive:['驾车', 'Drive'], fly:['飞行', 'Fly'], watch:['观看', 'Watch'], mech:['机甲', 'Mech']};     // [v48 mech] mech: lm50mech")
R("TR.veh = ['drive', 'fly', 'watch'].includes(s.veh) ? s.veh : 'drive';", "TR.veh = ['drive', 'fly', 'watch'].concat(window.SGMech ? ['mech'] : []).includes(s.veh) ? s.veh : 'drive';")
R('<button type="button" data-kv="watch" aria-pressed="false">观看<small>Watch</small></button></div>',
  '<button type="button" data-kv="watch" aria-pressed="false">观看<small>Watch</small></button>${window.SGMech ? \'<button type="button" data-kv="mech" aria-pressed="false" title="机甲 · Pilot a giant mech and fight it">机甲<small>Mech</small></button>\' : \'\'}</div>')
R("    if (!(typeof SGR !== 'undefined' && SGR.on)){ toast('需要真实城市地图 · Needs the real city map', 3); return false; }\n    let put = null;",
  "    if (!(typeof SGR !== 'undefined' && SGR.on)){ toast('需要真实城市地图 · Needs the real city map', 3); return false; }\n"
  "    if (TR.veh === 'mech'){ if (window.SGMech && typeof SGMech.play === 'function'){ const tr = document.getElementById('tray'); if (tr) tr.classList.add('closed'); return SGMech.play({difficulty:TR.diff, species:TR.sp}); } TR.veh = 'drive'; }     // [v48 mech]\n"
  "    let put = null;")
R("      want = /cthulhu|kaiju|克苏鲁/.test(h) || /cthulhu|kaiju/.test(pm);",
  "      want = /cthulhu|kaiju|克苏鲁/.test(h) || /cthulhu|kaiju/.test(pm);\n      if (/mech/.test(h) || /mech/.test(pm)) return;     // [v48 mech] #mech: the mech module starts it")
open(P, 'w').write(s)
print('patched', len(s))
