
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
