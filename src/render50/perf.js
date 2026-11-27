/* ================= render50: speed (render50/perf.js, injected by render50/post_render50.py; every city) =================
   Measured with SC/render50/probe.js (see render50/AUDIT.md). Each part can be switched off on its own (window.R50.perf):
   - shadow: the sun's shadow map was re-rendered every frame (every caster in a box up to 6.4 km wide: buildings, trees, landmarks,
     vehicles). Now it is re-rendered when the shadow box or the sun moved, when the world changed (tiles built or rebuilt, a landmark
     placed), and otherwise on a short cycle for the moving casters: every 2nd frame while the camera is within
     ~600 m of the ground (vehicles, trains and ships have visible shadows there), every 4th frame above. (Geometry counts are not used as a change signal: modules
     create geometry near the view all the time.) Shadows of moving things
     lag by at most 1-3 frames (~16-50 ms at 60 fps).
   - labels: placeLabels() (DOM projection and decluttering of every label) is skipped while the camera, the viewport and the label
     list are unchanged (labels sit at fixed map positions); it still runs every 20th frame.
   ?r50perf=0 (or ?r50=0) turns this part off. Test handle: window.R50.perf {info(), shadow, labels}. */
{
const R50 = window.R50 = window.R50 || {parts:{}};
const PFOFF = /[?&]r50=0/.test(location.search) || /[?&]r50perf=0/.test(location.search);
const PF = {shadow:!PFOFF, labels:!PFOFF, f:0, shRun:0, shSkip:0, lbRun:0, lbSkip:0, s:new Float64Array(12), geo:-1, built:-1, nLm:-1,
  cm:new Float64Array(18), lbN:-1, lbF:0, camMoved:true, why:[0, 0, 0]};
R50.parts.perf = PF;
// camera state as numbers (matrixWorld + projection scale): did the view change since the last frame?
function pfCamChanged(){
  const a = camera.matrixWorld.elements, p = camera.projectionMatrix.elements, c = PF.cm; let ch = false;
  for (let i = 0; i < 16; i++) if (c[i] !== a[i]){ c[i] = a[i]; ch = true; }
  if (c[16] !== p[0] || c[17] !== p[5]){ c[16] = p[0]; c[17] = p[5]; ch = true; }
  return ch;
}
function pfShadow(){
  if (!PF.shadow || !renderer.shadowMap.enabled){ if (!renderer.shadowMap.autoUpdate) renderer.shadowMap.autoUpdate = true; return; }
  renderer.shadowMap.autoUpdate = false;
  const s = PF.s, sp = sun.position, tp = sun.target.position, sc = sun.shadow.camera;
  const v = [sp.x, sp.y, sp.z, tp.x, tp.y, tp.z, sc.left, sc.right, sc.top, sc.far, sun.intensity > 0.001 ? 1 : 0, sun.castShadow ? 1 : 0];
  let lightCh = false; for (let i = 0; i < 12; i++) if (s[i] !== v[i]){ s[i] = v[i]; lightCh = true; }
  // world changes: tiles (re)built, landmarks placed; things other modules add near the view are picked up by the cycle below
  const built = (typeof SGR !== 'undefined' && SGR.built) || 0, nLm = typeof landmarks !== 'undefined' && landmarks ? landmarks.length : 0;
  const worldCh = built !== PF.built || nLm !== PF.nLm; PF.built = built; PF.nLm = nLm;
  const low = camera.position.y - Math.max(0, hAt(camera.position.x, -camera.position.z)) < 600;
  const cyc = low ? 2 : 4;
  if (lightCh || worldCh || PF.f % cyc === 0){ renderer.shadowMap.needsUpdate = true; PF.shRun++; PF.why[lightCh ? 0 : worldCh ? 1 : 2]++; } else PF.shSkip++;
}
function pfPre(){
  PF.f++;
  PF.camMoved = pfCamChanged();
  pfShadow();
}
HOOKS.prerender.push(pfPre);
// labels: wrap placeLabels (a function declaration in the app scope: the loop calls it by name)
if (typeof placeLabels === 'function'){
  const pl0 = placeLabels;
  placeLabels = function(){
    if (PF.labels){
      const n = labelItems.length, w = canvas.clientWidth, h = canvas.clientHeight;
      const same = !PF.camMoved && labelItems === PF.lbArr && n === PF.lbN && w === PF.lbW && h === PF.lbH && (PF.f - PF.lbF) < 20;
      if (same){ PF.lbSkip++; return; }
      PF.lbArr = labelItems; PF.lbN = n; PF.lbW = w; PF.lbH = h; PF.lbF = PF.f;
    }
    PF.lbRun++;
    return pl0.apply(this, arguments);
  };
}
R50.perf = {
  get shadow(){ return PF.shadow; }, set shadow(v){ PF.shadow = !!v; if (!PF.shadow){ renderer.shadowMap.autoUpdate = true; } },
  get labels(){ return PF.labels; }, set labels(v){ PF.labels = !!v; },
  info:() => ({shadow:PF.shadow, labels:PF.labels, shadowRenders:PF.shRun, shadowSkips:PF.shSkip, shadowWhy:{light:PF.why[0], world:PF.why[1], cycle:PF.why[2]}, labelRuns:PF.lbRun, labelSkips:PF.lbSkip})
};
}
