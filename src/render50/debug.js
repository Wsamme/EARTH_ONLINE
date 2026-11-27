/* ================= render50: test handle (render50/debug.js; only with ?r50dbg=1) =================
   The app runs inside one function scope, so headless probes cannot reach the renderer or the frame functions. With ?r50dbg=1
   this exposes window.__r50 {renderer, scene, camera, controls, HOOKS, sgXY, setTod, sea, SGR, prof(on), P}; prof(true) wraps the
   per-frame functions (and the hooks) with timers that add into __r50.P.t while __r50.P.on is set. Nothing happens without the flag. */
if (/[?&]r50dbg=1/.test(location.search)){
  const P = {t:{}, on:false};
  const wrap = (k, f) => function(){ const t = performance.now(); try { return f.apply(this, arguments); } finally { if (P.on) P.t[k] = (P.t[k] || 0) + performance.now() - t; } };
  let profOn = false;
  window.__r50 = {renderer, scene, camera, controls, HOOKS, sgXY, setTod, sea, P,
    get SGR(){ return typeof SGR !== 'undefined' ? SGR : null; }, get N(){ return N; }, get HALF(){ return HALF; }, get nat(){ return nat; },
    prof(){
      if (profOn) return; profOn = true;
      for (const k of ['frame', 'prerender', 'render']) HOOKS[k] = HOOKS[k].map((f, i) => wrap('hook.' + k + i + ' ' + String(f).slice(0, 50).replace(/\s+/g, ' '), f));
      if (typeof placeLabels === 'function') placeLabels = wrap('placeLabels', placeLabels);
      if (typeof stepCars === 'function') stepCars = wrap('stepCars', stepCars);
      if (typeof stepMovers === 'function') stepMovers = wrap('stepMovers', stepMovers);
      if (typeof stepLmFx === 'function') stepLmFx = wrap('stepLmFx', stepLmFx);
      if (typeof stepQueue === 'function') stepQueue = wrap('stepQueue', stepQueue);
      if (typeof sgrStep === 'function') sgrStep = wrap('sgrStep', sgrStep);
      if (typeof lodTick === 'function') lodTick = wrap('lodTick', lodTick);
      if (typeof navStep === 'function') navStep = wrap('navStep', navStep);
      const l0 = loop; loop = function(now){ const t = performance.now(); l0(now); if (P.on){ P.frames = (P.frames || 0) + 1; P.t['loop total'] = (P.t['loop total'] || 0) + performance.now() - t; } };
    }
  };
}
