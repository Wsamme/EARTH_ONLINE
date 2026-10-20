/* ================= v20 add-on: weather — clouds, haze, showers, thunderstorms (lm20/wx) =================
   Modes: 自动 Auto (a tropical day: clear mornings, cumulus by noon, maybe an afternoon storm, clear nights; one random plan per
   simulated day) · 晴 Clear · 多云 Cloudy · 雾霾 Haze · 阵雨 Rain · 雷暴 Storm. Default Clear (WX_DEFAULT); the choice is kept in
   localStorage. Changes ease in over ~5 s (wall clock, so slow frames don't stretch them).
   Drawing (all in world metres for the 1:1 map, scaled x0.62 on the 24 km generated islands):
   - one mesh (renderOrder 7): ~3 000 camera-facing puffs of a normal-mapped sprite atlas (cumulus, storm cells with towers and
     anvils, an overcast deck seen from above), rain-shaft cards and soft ground-shadow discs (high views); positions, wind drift,
     wrapping around the view, coverage and lighting are in the vertex/fragment shader; the clouds are sorted back-to-front
     (only the clouds present) every few frames;
     [v33 lm30/sky: no more flicker] the sorted order goes into one of two index buffers in turn (written whole, swapped in with
     setIndex) instead of re-uploading part of the buffer being drawn: the partial re-upload made a cloud or two vanish for exactly
     one frame at each re-sort (every 8 frames while the view moves, every second when it is still) — the "flashing" clouds;
     a new order is only uploaded when it changed; clouds about to appear are already in the list (no pop-in while the coverage
     changes); rain shafts fade in instead of switching on; the atlas tile is a vec2 varying (no wrong-tile pixels on GPUs that
     interpolate a constant inexactly);
   - rain streaks (renderOrder 8): 16 000 quads in a box around the camera, animated by a time uniform, only near the ground;
   - a lightning bolt ribbon (renderOrder 8, additive) only during a strike.
   Clear mode draws nothing and the frame hook returns at once.
   Colours: HOOKS.time snapshots what applyTime() set (sky, sun, hemi, sea, stars, night lights) and applies the weather on top;
   scene.fog near/far follow the camera distance in haze/rain (an outside change, e.g. allocWorld, becomes the new base). With
   clouds on, sun.intensity also dips while a cloud covers the sun over the view target (street/city views).
   [nyc/nycapp] New York City (SGR_NYC, tested lazily; Singapore unchanged): a temperate climate. Modes 自动 Auto · 晴 Clear · 多云 Cloudy ·
   雾霾 Haze · 雨 Rain (steady rain under a stratus deck) · 雷暴 Storm (summer) · 雾 Fog (grey harbour fog: thickest low over the water,
   the towers' tops above it) · 雪 Snow (flakes drifting down instead of rain streaks, roofs and open ground turning white: the
   building and ground materials get one extra uniform the first time it snows). Auto follows New York's climate for the light
   module's date (SGLight.date; one plan per day): winter snow days and cold rain, spring fog over the harbour, summer haze and
   afternoon thunderstorms, autumn clear days. state gains snow and fog (0..1) in New York.
   Test handle: window.SGWx {set(mode, instant = true), mode, state, day, quiet, hold, strike(dx, dz), stats(), bench(), menu(open),
   nyc (true in New York), plan (New York's Auto plan for the day)}. */
{
const WX_KEY = 'cityBrush.weather', WX_DEFAULT = 'clear';
const WX_MODES = [
  {id:'auto',   zh:'自动', en:'Auto',   ico:'auto'},
  {id:'clear',  zh:'晴',   en:'Clear',  ico:'sun'},
  {id:'cloudy', zh:'多云', en:'Cloudy', ico:'cloud'},
  {id:'haze',   zh:'雾霾', en:'Haze',   ico:'haze'},
  {id:'rain',   zh:'阵雨', en:'Rain',   ico:'rain'},
  {id:'storm',  zh:'雷暴', en:'Storm',  ico:'storm', long:'Thunderstorm'},
  {id:'fog',    zh:'雾',   en:'Fog',    ico:'fog',   long:'Harbour fog', nyc:true},
  {id:'snow',   zh:'雪',   en:'Snow',   ico:'snow',  nyc:true}
];
// [nyc/nycapp] the New York City build (SGR_NYC is a top-level const declared after the modules: only look once the page runs)
let WX_NYC = null;
function wxNyc(){ if (WX_NYC === null){ try { WX_NYC = typeof SGR_NYC !== 'undefined' && !!SGR_NYC; } catch (e){ return false; } } return WX_NYC; }
const wxModes = () => WX_MODES.filter(m => !m.nyc || wxNyc());
// cov: cumulus coverage · dark: cloud darkness · tow: towering growth · cb: active storm cells · deck: overcast layer
// rain: rain intensity · bolt: lightning rate · vis: low visibility · milk: milky haze tint · ovc: grey sky · blue: fair-weather blue · wind
const WX_PAR = ['cov', 'dark', 'tow', 'cb', 'deck', 'rain', 'bolt', 'vis', 'milk', 'ovc', 'blue', 'wind'];
const WX_TGT = {
  clear:  {cov:0,    dark:0,    tow:0,    cb:0,    deck:0,    rain:0,    bolt:0, vis:0,    milk:0,    ovc:0,    blue:0,    wind:0.4},
  cloudy: {cov:0.72, dark:0.08, tow:0.2,  cb:0,    deck:0,    rain:0,    bolt:0, vis:0.1,  milk:0,    ovc:0.16, blue:0.6,  wind:0.55},
  haze:   {cov:0.12, dark:0,    tow:0,    cb:0,    deck:0.12, rain:0,    bolt:0, vis:1,    milk:1,    ovc:0.12, blue:0,    wind:0.15},
  rain:   {cov:0.86, dark:0.6,  tow:0.42, cb:0.14, deck:0.5,  rain:0.55, bolt:0, vis:0.55, milk:0.12, ovc:0.74, blue:0,    wind:0.7},
  storm:  {cov:0.95, dark:1,    tow:1,    cb:0.42, deck:0.75, rain:1,    bolt:1, vis:0.74, milk:0,    ovc:1,    blue:0,    wind:1}
};
// New York: a stratus deck with steady rain (no towers), grey fog low over the water, snow under a white-grey sky
const WX_TGT_NY = {
  rain:   {cov:0.9,  dark:0.42, tow:0.12, cb:0.03, deck:0.8,  rain:0.6,  bolt:0, vis:0.5,  milk:0.06, ovc:0.85, blue:0,    wind:0.65, snow:0, fog:0},
  fog:    {cov:0.12, dark:0.04, tow:0,    cb:0,    deck:0.3,  rain:0,    bolt:0, vis:1,    milk:0.12, ovc:0.6,  blue:0,    wind:0.12, snow:0, fog:1},
  snow:   {cov:0.85, dark:0.18, tow:0.05, cb:0,    deck:0.85, rain:0,    bolt:0, vis:0.62, milk:0,    ovc:0.88, blue:0,    wind:0.45, snow:1, fog:0}
};
const wxS = {}, wxT = {};
for (const p of WX_PAR){ wxS[p] = 0; wxT[p] = 0; }
const WX = {dbg:{mode:'new', sortN:0, upN:0}, sortQ:new THREE.Quaternion(), wet:0, sig:-1, ms:0, sunI:0.72, shade:0, mode:WX_DEFAULT, day:0, instant:false, hold:false, applied:false, eff:'', last:0, frame:0, sortF:-99, sortT:0, sortP:new THREE.Vector3(), tod:null};
const wxSm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a)/(b - a))); return t*t*(3 - 2*t); };
const wxMod = (a, n) => ((a % n) + n) % n;
const wxK = () => HALF > 20000 ? 1 : 0.62;               // world scale: Singapore 1:1 (56 km) vs the generated islands (24 km)
const wxLum = c => 0.3*c.r + 0.59*c.g + 0.11*c.b;

/* ---------- the weather the Auto mode wants at a time of day (one plan per simulated day) ---------- */
function wxPlan(day){
  const r = mulberry32(day*7919 + 1301), p = {stormy:r() < 0.55, st:14 + r()*3.4, len:1.1 + r()*1.6, pk:0.68 + 0.32*r(), mist:r() < 0.45, cum:0.4 + 0.3*r()};
  if (!p.stormy) p.pk = 0;
  return p;
}
const wxVN = x => { const h = n => { const s = Math.sin(n*127.1 + 311.7)*43758.5453; return s - Math.floor(s); }; const i = Math.floor(x), f = x - i, u = f*f*(3 - 2*f); return h(i)*(1 - u) + h(i + 1)*u; };
function wxAuto(t, now){
  const P = wxPlan(WX.day), bump = (a, b, c, d) => wxSm(a, b, t)*(1 - wxSm(c, d, t));
  let cov = 0.06 + P.cum*bump(8.6, 12.6, 16.4, 20.4) + 0.14*(wxVN(now/75) - 0.5);
  const s = P.stormy ? bump(P.st - 0.7, P.st + 0.35, P.st + P.len - 0.2, P.st + P.len + 1.0)*P.pk : 0;
  const pre = P.stormy ? bump(P.st - 2.3, P.st - 0.15, P.st + P.len, P.st + P.len + 1.5) : 0;    // towers build up before the storm
  cov = Math.min(1, Math.max(0, cov));
  const mist = P.mist ? 0.8*bump(4.2, 5.8, 7.6, 9.6) : 0.22*bump(4.5, 6, 7.4, 8.8);
  return {cov:Math.max(cov, 0.95*s), dark:Math.max(0.08*cov, s), tow:Math.max(0.35*cov, pre), cb:pre*0.5*Math.max(0.6, P.pk), deck:0.9*s,
    rain:wxSm(0.4, 0.8, s), bolt:wxSm(0.55, 0.9, s), vis:Math.max(0.08*cov, 0.72*s, mist), milk:mist > 0.05 ? Math.min(1, mist*1.3)*(1 - s) : 0,
    ovc:Math.max(0.16*cov, s), blue:0.6*wxSm(0.1, 0.35, cov)*(1 - s), wind:0.45 + 0.55*Math.max(s, pre*0.5)};
}
// [nyc/nycapp] New York's climate (Central Park normals, rounded): by month the chance of a snow day, a rain day, a summer thunderstorm,
// harbour fog, haze and a cloudy day; the rest are clear
const WX_CLIM_NY = {
  snow:  [0.12, 0.12, 0.06, 0.01, 0, 0, 0, 0, 0, 0, 0.01, 0.07],
  rain:  [0.18, 0.17, 0.23, 0.26, 0.24, 0.17, 0.13, 0.14, 0.15, 0.18, 0.22, 0.21],
  storm: [0, 0, 0.01, 0.03, 0.07, 0.14, 0.17, 0.15, 0.08, 0.02, 0.01, 0],
  fog:   [0.04, 0.04, 0.06, 0.08, 0.09, 0.07, 0.04, 0.04, 0.05, 0.06, 0.05, 0.05],
  haze:  [0.01, 0.01, 0.01, 0.02, 0.04, 0.08, 0.10, 0.09, 0.04, 0.02, 0.01, 0.01],
  cloud: [0.30, 0.28, 0.26, 0.22, 0.20, 0.18, 0.15, 0.15, 0.17, 0.20, 0.27, 0.30]};
function wxYmdNy(){
  let q = null; try { if (window.SGLight && window.SGLight.enabled !== false) q = String(window.SGLight.date).split('-').map(Number); } catch (e){ q = null; }
  if (!q || q.length !== 3 || !q.every(Number.isFinite)){ const n = new Date(); q = [n.getFullYear(), n.getMonth() + 1, n.getDate()]; }
  return q;
}
function wxPlanNy(){
  const ymd = wxYmdNy(), key = ymd.join('-') + '/' + WX.day;
  if (WX.npc && WX.npc.key === key) return WX.npc;
  const r = mulberry32(ymd[0]*1031 + ymd[1]*67 + ymd[2]*7 + WX.day*7919 + 4409), mo = ymd[1] - 1, C = WX_CLIM_NY, u = r();
  let a = 0; const pick = k => { a += C[k][mo]; return u < a; };
  const type = pick('snow') ? 'snow' : pick('rain') ? 'rain' : pick('storm') ? 'storm' : pick('fog') ? 'fog' : pick('haze') ? 'haze' : pick('cloud') ? 'cloudy' : 'clear';
  const p = {key, ymd, mo, type, st:type === 'storm' ? 13.5 + 4*r() : 2 + 15*r(), len:type === 'storm' ? 1 + 1.4*r() : 3 + 9*r(), pk:0.6 + 0.4*r(), eve:r() < 0.3, cum:0.2 + 0.35*r(), summer:mo >= 4 && mo <= 8};
  WX.npc = p; return p;
}
function wxAutoNy(t, now){
  const P = wxPlanNy(), o = Object.assign({}, WX_TGT.clear, {snow:0, fog:0}), bump = (a, b, c, d) => wxSm(a, b, t)*(1 - wxSm(c, d, t)), mix = (A, k) => { for (const q in A) o[q] = o[q] + (A[q] - o[q])*k; };
  // fair-weather cumulus by day in the warm months
  o.cov = (P.summer ? P.cum : P.cum*0.5)*bump(9.5, 13, 17, 20) + 0.08*(wxVN(now/75) - 0.5); o.cov = Math.max(0, o.cov); o.tow = 0.3*o.cov; o.blue = 0.6*wxSm(0.1, 0.35, o.cov);
  if (P.type === 'cloudy' || P.type === 'rain' || P.type === 'snow') mix(WX_TGT.cloudy, 1);
  if (P.type === 'rain' || P.type === 'snow'){ const k = bump(P.st - 0.8, P.st + 0.6, P.st + P.len - 0.4, P.st + P.len + 1.2); mix(WX_TGT_NY[P.type], k*P.pk + (1 - P.pk)*k*0.6); o.ovc = Math.max(o.ovc, 0.5*bump(P.st - 3, P.st, P.st + P.len, P.st + P.len + 3)); }
  if (P.type === 'storm'){ const k = bump(P.st - 0.6, P.st + 0.35, P.st + P.len - 0.2, P.st + P.len + 0.9); const pre = bump(P.st - 2.4, P.st - 0.2, P.st + P.len, P.st + P.len + 1.5);
    o.cov = Math.max(o.cov, 0.4*pre); o.tow = Math.max(o.tow, pre); o.cb = 0.5*pre*P.pk; mix(WX_TGT.storm, k*P.pk); }
  if (P.type === 'fog'){ const k = P.eve ? bump(18.5, 20.5, 30, 31) : bump(-2, 1, 8.8 + 1.5*P.pk, 11 + 1.5*P.pk); mix(WX_TGT_NY.fog, k); }
  if (P.type === 'haze') mix(WX_TGT.haze, 0.55 + 0.35*bump(9, 13, 18, 21));
  return o;
}
function wxAutoNoteNy(){
  const P = wxPlanNy(), hm = h => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1)*60/10)*10).padStart(2, '0')}`, L = Math.round(P.len);
  return P.type === 'snow' ? `今天下雪：${hm(P.st)} 前后开始，约 ${L} 小时，屋顶和公园积白 · Snow from about ${hm(P.st)} for ~${L} h, roofs and parks turning white` :
    P.type === 'rain' ? `今天有雨：${hm(P.st)} 前后开始，约 ${L} 小时 · Rain from about ${hm(P.st)} for ~${L} h` :
    P.type === 'storm' ? `夏日午后雷阵雨，${hm(P.st)} 前后 · A summer thunderstorm around ${hm(P.st)}` :
    P.type === 'fog' ? (P.eve ? '傍晚起雾，港口和河面一片灰白 · Fog rolling over the harbour and the rivers in the evening' : '清晨港口大雾，上午渐散 · Morning fog over the harbour, lifting by late morning') :
    P.type === 'haze' ? '闷热的夏日雾霾 · A hazy, humid summer day' : P.type === 'cloudy' ? '多云，天色灰白 · Cloudy, grey skies' :
    P.summer ? '晴，午后有积云 · Fair, cumulus building in the afternoon' : '晴朗清爽 · Clear and crisp';
}
function wxAutoNote(){
  if (wxNyc()) return wxAutoNoteNy();
  const P = wxPlan(WX.day), hm = h => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1)*60/10)*10).padStart(2, '0')}`;
  return P.stormy ? `今天 ${hm(P.st)} 前后可能有雷阵雨，入夜转晴 · Thunderstorm likely around ${hm(P.st)}, clearing at night` :
    `今天晴间多云，午后积云发展 · Fair, cumulus building by midday`;
}

/* ---------- base colours from applyTime(), then the weather on top ---------- */
const WB = {ok:false, sky:new THREE.Color(), sun:new THREE.Color(), sI:0.72, hs:new THREE.Color(), hg:new THREE.Color(), hI:0.78, sea:new THREE.Color(), night:0, lamp:0, star:0, nf:0};
function wxSnap(nf){
  WB.sky.copy(scene.background); WB.sun.copy(sun.color); WB.sI = sun.intensity; WB.hs.copy(hemi.color); WB.hg.copy(hemi.groundColor); WB.hI = hemi.intensity;
  WB.sea.copy(sea.material.color); WB.night = NIGHT.uNight.value; WB.lamp = matLamp.opacity; WB.star = stars.material.opacity; WB.nf = nf; WB.ok = true;
}
const _wc = new THREE.Color(), _wg = new THREE.Color(), _wh = new THREE.Color(), _wm = new THREE.Color();
const FL = {t0:-9, pulses:null, bolt:false, x:0, y:0, z:0, g:0, F:0};   // lightning flash state
function wxEnv(){
  if (!WB.ok) return;
  const s = wxS, nf = WB.nf, day = 1 - nf, L = wxLum(WB.sky), F = FL.F*FL.g;
  const sky = _wc.copy(WB.sky);
  if (s.blue > 0.001) sky.lerp(_wg.setRGB(0.66, 0.77, 0.89).multiplyScalar(Math.max(0.25, L/0.88)), s.blue*0.62*day*day);   // soft blue behind fair-weather cumulus
  const dk = 1 - 0.47*s.dark;
  _wg.setRGB(L*0.92*dk, L*0.95*dk, L*0.985*dk); sky.lerp(_wg, s.ovc*0.88);                                     // overcast grey
  const mk = s.vis*s.milk;
  if (mk > 0.001){ _wm.setRGB(0.83, 0.8, 0.72).multiplyScalar(Math.min(1, 0.25 + L)).lerp(_wh.setRGB(0.21, 0.165, 0.13), nf*0.85); sky.lerp(_wm, mk*0.9); }
  if (s.fog > 0.001){ _wm.setRGB(0.78, 0.8, 0.82).multiplyScalar(Math.min(1, 0.3 + L)).lerp(_wh.setRGB(0.25, 0.22, 0.2), nf*0.8); sky.lerp(_wm, s.fog*0.85); }     // [nyc] grey fog (warm city glow at night)
  if (s.snow > 0.001){ _wm.setRGB(0.86, 0.87, 0.9).multiplyScalar(Math.min(1, 0.32 + L)).lerp(_wh.setRGB(0.24, 0.22, 0.24), nf*0.8); sky.lerp(_wm, s.snow*0.6); }  // [nyc] snow sky
  if (F > 0.001){ sky.r = Math.min(1, sky.r + 0.16*F); sky.g = Math.min(1, sky.g + 0.18*F); sky.b = Math.min(1, sky.b + 0.25*F); }
  scene.background.copy(sky); scene.fog.color.copy(sky);
  // light: weaker, greyer sun; a little more (and greyer) sky light, less of everything in a storm
  sun.intensity = WX.sunI = WB.sI*(1 - 0.3*s.ovc)*(1 - 0.8*s.dark)*(1 - 0.42*mk)*(1 - 0.1*s.cov*(1 - s.dark));
  _wg.setScalar(wxLum(WB.sun)); sun.color.copy(WB.sun).lerp(_wg, Math.min(1, 0.75*s.ovc)); if (mk > 0.001) sun.color.multiply(_wh.setRGB(1, 1 - 0.1*mk, 1 - 0.28*mk));
  hemi.intensity = WB.hI*(1 + 0.16*s.ovc + 0.12*mk - 0.34*s.dark*s.dark) + 0.5*F;
  const mx = Math.max(sky.r, sky.g, sky.b, 0.05); _wg.setRGB(sky.r/mx, sky.g/mx, sky.b/mx);
  hemi.color.copy(WB.hs).lerp(_wg, Math.min(1, 0.55*s.ovc + 0.5*mk)); hemi.groundColor.copy(WB.hg).multiplyScalar(1 - 0.18*s.dark);
  if (F > 0.001) hemi.color.lerp(_wg.setRGB(0.78, 0.84, 1), Math.min(0.8, F));
  // sea: greyer and darker under rain clouds, milky in haze
  _wg.setScalar(wxLum(WB.sea)).multiply(_wh.setRGB(0.92, 0.97, 1));
  sea.material.color.copy(WB.sea).lerp(_wg, 0.4*s.ovc).lerp(sky, 0.3*mk);
  stars.material.opacity = WB.star*(1 - wxSm(0.05, 0.55, s.cov + s.deck))*(1 - 0.85*s.vis);
  // under a dark storm sky a few windows and the street lamps come on
  NIGHT.uNight.value = Math.max(WB.night, 0.5*s.dark*s.ovc*day);
  matLamp.opacity = Math.max(WB.lamp, 0.42*s.dark*s.dark*day);
  WX.applied = true;
}
// fog distance: haze and rain pull it in, relative to the camera distance so the island overview stays readable
const FG = {bn:22000, bf:68000, sn:-1, sf:-1};
function wxFog(D, alt){
  const f = scene.fog;
  if (FG.sn < 0 || Math.abs(f.near - FG.sn) > 0.5 || Math.abs(f.far - FG.sf) > 0.5){ FG.bn = f.near; FG.bf = f.far; }   // someone (allocWorld) set a new base
  let n = FG.bn, fr = FG.bf;
  if (wxS.vis > 0.0005){
    const k = wxK(); let v = wxS.vis*(wxS.milk + (1 - wxS.milk)*(1 - 0.75*wxSm(1200*k, 9000*k, alt || 0))); const ln = Math.min(FG.bn, 60*k + 0.3*D), lf = Math.min(FG.bf, 2600*k + 1.6*D);
    let fw = 1; if (wxS.fog > 0.001){ const w = wxWet(), hi = wxSm(250*k, 1500*k, alt || 0); v = Math.min(1, v*(1 - wxS.fog*(0.45 - 0.45*w))*(1 - wxS.fog*0.55*hi)); fw = 1 - 0.7*wxS.fog*(0.4 + 0.6*w)*(1 - hi); }   // [nyc] harbour fog
    n = Math.exp(Math.log(FG.bn)*(1 - v) + Math.log(ln)*v); fr = Math.max(n + 200, Math.exp(Math.log(FG.bf)*(1 - v) + Math.log(lf)*v)*fw);
  }
  f.near = FG.sn = n; f.far = FG.sf = fr;
}

// [nyc] how much water is around the view target (0..1; sampled every ~0.5 s): the harbour fog is thickest over the water
function wxWet(){
  const now = performance.now(); if (WX.wetT && now - WX.wetT < 500) return WX.wet || 0; WX.wetT = now;
  let w = 0, n = 0; try { const t = controls.target; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++){ const x = t.x + i*700, y = -t.z + j*700; n++; if (Math.abs(x) >= HALF || Math.abs(y) >= HALF){ w++; continue; } const v = nat[cx2i(y)*N + cx2i(x)]; if (v === 1 || v === 2) w++; } } catch (e){ n = 1; }
  WX.wet = Math.min(1, 1.8*w/Math.max(1, n)); return WX.wet;
}
// [nyc] snow on the roofs and the open ground: one uniform added to the building material (SGBld) and the terrain the first time it snows
const WXSN = {value:0}, WXSG = {value:0}; let WX_SNOWMAT = false;
function wxSnowSurf(k){
  if (!WX_SNOWMAT){ if (k < 0.002) return; WX_SNOWMAT = true;
    try { const M = window.SGBld && SGBld.material; if (M){ const o = M.onBeforeCompile; M.onBeforeCompile = function(sh, r){ o.call(this, sh, r); sh.uniforms.uSnowR = WXSN;
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uSnowR;')
          .replace('float specularStrength = 0.0;', 'if (uSnowR > 0.001) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.92, 0.95), uSnowR * smoothstep(0.3, 0.75, sgUp));\nfloat specularStrength = 0.0;'); };
        M.customProgramCacheKey = () => 'sgbld-snow'; M.needsUpdate = true; } } catch (e){ /* no building module */ }
  }
  if (k >= 0.002){ try { const G = typeof terrain !== 'undefined' && terrain && terrain.material; if (G && !G.userData.snow){ G.userData.snow = true; const o = G.onBeforeCompile;
        const ok = G.customProgramCacheKey, snow = '\nif (uSnowG > 0.001){ float sgv = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.88, 0.9, 0.93), uSnowG * smoothstep(0.08, 0.3, sgv)); }';
        G.onBeforeCompile = function(sh, r){ if (o) o.call(this, sh, r); sh.uniforms.uSnowG = WXSG; sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uSnowG;');
          const at = sh.fragmentShader.includes('/*gd-end*/') ? '/*gd-end*/' : '#include <map_fragment>'; sh.fragmentShader = sh.fragmentShader.replace(at, at + snow); };   // [v33] after the ground detail
        G.customProgramCacheKey = () => 'terrain-snow|' + (ok && ok !== THREE.Material.prototype.customProgramCacheKey ? ok.call(G) : ''); G.needsUpdate = true; } } catch (e){ /* no terrain */ } }
  WXSN.value = 0.85*k; WXSG.value = 0.72*k;
}

/* ---------- cloud sprite atlas: 2 x 2 tiles of 128 px, RGB = surface normal (sprite space), A = density ---------- */
function wxAtlas(){
  const T = 128, W = 256, d = new Uint8Array(W*W*4), rnd = mulberry32(2718), P = new Float32Array(65536);
  for (let i = 0; i < 65536; i++) P[i] = rnd();
  const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, ux = fx*fx*(3 - 2*fx), uy = fy*fy*(3 - 2*fy);
    const a = P[((yi & 255) << 8) | (xi & 255)], b = P[((yi & 255) << 8) | ((xi + 1) & 255)], c = P[(((yi + 1) & 255) << 8) | (xi & 255)], e = P[(((yi + 1) & 255) << 8) | ((xi + 1) & 255)];
    return a + (b - a)*ux + (c - a)*uy + (a - b - c + e)*ux*uy; };
  const fbm = (x, y) => { let s = 0, a = 0.5, f = 1; for (let o = 0; o < 4; o++){ s += a*vn(x*f + o*17.3, y*f + o*9.1); f *= 2.03; a *= 0.5; } return s/0.9375; };
  const LAY = [   // bubbles [x, y, r] of three cumulus shapes (sprite space -1..1, y up)
    [[-0.58, -0.3, 0.27], [-0.3, -0.33, 0.32], [0, -0.32, 0.34], [0.3, -0.33, 0.31], [0.57, -0.3, 0.26], [-0.36, -0.02, 0.3], [-0.04, 0.02, 0.36], [0.3, -0.04, 0.3], [-0.12, 0.33, 0.3], [0.17, 0.28, 0.27]],
    [[-0.42, -0.36, 0.3], [-0.08, -0.38, 0.33], [0.3, -0.36, 0.31], [-0.28, -0.04, 0.32], [0.12, -0.06, 0.34], [-0.1, 0.27, 0.33], [0.2, 0.32, 0.26], [-0.02, 0.56, 0.24]],
    [[-0.62, -0.24, 0.22], [-0.38, -0.26, 0.25], [-0.12, -0.27, 0.27], [0.14, -0.26, 0.26], [0.4, -0.25, 0.25], [0.63, -0.22, 0.2], [-0.42, 0.02, 0.24], [-0.1, 0.03, 0.3], [0.24, 0.0, 0.27], [0.06, 0.26, 0.22]]
  ];
  for (let t = 0; t < 4; t++){
    const ox = (t & 1)*T, oy = (t >> 1)*T, sph = t < 3 ? LAY[t].map(b => [b[0] + (rnd() - 0.5)*0.06, b[1] + (rnd() - 0.5)*0.05, b[2]*(0.94 + 0.12*rnd())]) : null;
    for (let j = 0; j < T; j++) for (let i = 0; i < T; i++){
      const u = (i + 0.5)/T*2 - 1, v = (j + 0.5)/T*2 - 1, r = Math.hypot(u, v), o = ((oy + j)*W + ox + i)*4;
      let nx = 0, ny = 0, nz = 1, a = 0;
      const n1 = fbm(u*3.2 + t*11, v*3.2), n2 = fbm(u*7 + 40 + t*5, v*7 + 13);
      if (t < 3){
        let hm = 0, sw = 0, ax = 0, ay = 0, az = 0;
        for (const b of sph){
          const dx = u - b[0], dy = v - b[1], q = b[2]*b[2] - dx*dx - dy*dy; if (q <= 0) continue;
          const h = Math.sqrt(q), w = Math.exp(14*h);
          ax += w*dx/b[2]; ay += w*dy/b[2]; az += w*h/b[2]; sw += w; if (h > hm) hm = h;
        }
        if (sw > 0){ nx = ax/sw; ny = ay/sw; nz = az/sw; }
        nx += 0.45*(n2 - 0.5); ny += 0.45*(fbm(u*7 + 77, v*7 + 5) - 0.5);
        a = wxSm(0.0, 0.24, hm + 0.2*(n1 - 0.5)) * (0.8 + 0.2*n2);
      } else {   // flat, wispy layer (overcast deck, anvils)
        a = wxSm(0.36, 0.78, 0.62*n1 + 0.55*(1 - r*r)) * (0.75 + 0.25*n2);
        nx = 0.5*(n2 - 0.5); ny = 0.35 + 0.5*(n1 - 0.5); nz = 1;
      }
      a *= wxSm(1, 0.86, r);
      const l = Math.hypot(nx, ny, nz) || 1;
      d[o] = Math.round((nx/l*0.5 + 0.5)*255); d[o + 1] = Math.round((ny/l*0.5 + 0.5)*255); d[o + 2] = Math.round((nz/l*0.5 + 0.5)*255); d[o + 3] = Math.round(Math.min(1, a)*255);
    }
  }
  const tx = new THREE.DataTexture(d, W, W, THREE.RGBAFormat);
  tx.generateMipmaps = true; tx.minFilter = THREE.LinearMipmapLinearFilter; tx.magFilter = THREE.LinearFilter; tx.needsUpdate = true;
  return tx;
}

/* ---------- the cloud field: fair-weather cumulus, convective cells (towers + anvils), an overcast deck, rain shafts ----------
   Laid out once in metres for the 1:1 world (scaled by wxK() in the shader) over a square of FIELD m that wraps around the view. */
const FIELD = 64000, CBASE = 820;
const CL = {mesh:null, geo:null, mat:null, idx:null, n:0, x:null, z:null, y:null, p0:null, np:null, ord:null, key:null, cells:[]};
function wxBuildClouds(){
  const rnd = mulberry32(90731), clouds = [], cells = [];
  const tile = () => Math.floor(rnd()*3);
  // fair-weather cumulus on a jittered 17 x 17 grid
  const G = 17;
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++){
    const s = 0.6 + 1.5*Math.pow(rnd(), 1.7), Rc = 950*s, P = [], ang = rnd()*Math.PI*2, ca = Math.cos(ang), sa = Math.sin(ang), el = 0.5 + 0.35*rnd();
    const nb = 2 + Math.round(s*1.3), nu = 1 + Math.round(s*0.9);
    for (let b = 0; b < nb; b++){
      const t = nb > 1 ? b/(nb - 1) - 0.5 : 0, rr = Rc*(0.46 + 0.16*rnd()), u = t*Rc*1.2 + (rnd() - 0.5)*Rc*0.25, v = (rnd() - 0.5)*Rc*0.55*el;
      P.push([ca*u - sa*v, rr*0.4, sa*u + ca*v, rr, 0, 0, tile()]);
    }
    for (let b = 0; b < nu; b++){
      const rr = Rc*(0.36 + 0.14*rnd()), u = (rnd() - 0.5)*Rc*0.75, v = (rnd() - 0.5)*Rc*0.4;
      P.push([ca*u - sa*v, Rc*(0.5 + 0.3*b) + rr*0.25*rnd(), sa*u + ca*v, rr, 1, 0, tile()]);
    }
    clouds.push({x:(i + 0.15 + 0.7*rnd())/G, z:(j + 0.15 + 0.7*rnd())/G, rank:rnd(), kind:0, P, s});
  }
  // convective cells: base, body, a tower that grows with "tow" and an anvil sheared downwind
  for (let c = 0; c < 36; c++){
    const s = 1.8 + 0.6*rnd(), Rc = 1050*s, P = [], lean = 0.06 + 0.06*rnd();
    for (let b = 0; b < 5; b++){ const a = b/5*Math.PI*2 + rnd(), d = Rc*0.55*(b ? 1 : 0.2), rr = Rc*(0.5 + 0.12*rnd()); P.push([Math.cos(a)*d, rr*0.4, Math.sin(a)*d, rr, 0, 0, tile()]); }
    for (let b = 0; b < 3; b++){ const a = rnd()*Math.PI*2, d = Rc*0.3*rnd(), rr = Rc*(0.46 + 0.1*rnd()); P.push([Math.cos(a)*d, Rc*(0.55 + 0.35*b), Math.sin(a)*d, rr, 1, 0, tile()]); }
    for (let b = 0; b < 9; b++){ const lev = b/9, y = 2200 + b*800, rr = Rc*(0.66 - 0.1*lev)*(0.9 + 0.2*rnd()), a = b*2.4 + rnd(); P.push([y*lean + Math.cos(a)*Rc*0.3, y, Math.sin(a)*Rc*0.3, rr, 2, lev, Math.floor(rnd()*3)]); }
    for (let b = 0; b < 6; b++){ const u = -0.3 + 1.3*b/5 + (rnd() - 0.5)*0.2, An = 3400; P.push([9300*lean + u*An, 9300 + rnd()*400, (rnd() - 0.5)*2800, 1900 + 700*rnd(), 3, 1, 3]); }
    const cl = {x:rnd(), z:rnd(), rank:rnd(), kind:1, P, s, Rc}; clouds.push(cl); cells.push(cl);
  }
  // overcast deck (rain, storm)
  for (let c = 0; c < 100; c++) clouds.push({x:rnd(), z:rnd(), rank:rnd(), kind:2, P:[[0, 520 + 260*rnd(), 0, 3100 + 900*rnd(), 0, 0, 3]]});
  // rain shafts: under every cell and under the 100 biggest cumulus
  const big = clouds.filter(c => c.kind === 0).sort((a, b) => b.s - a.s).slice(0, 100), casters = clouds.filter(c => c.kind <= 1);
  // soft ground shadows of the cumulus and cells, seen from high up (camera above ~3 km)
  for (const c of casters){ const lo = c.P.filter(q => q[4] <= 1); clouds.push({x:c.x, z:c.z, rank:c.rank, kind:4, sk:c.kind, P:[[0, lo.reduce((a, q) => a + q[1], 0)/lo.length, 0, c.kind ? c.Rc*1.15 : 950*c.s*1.1, c.kind, 0, 0]]}); }
  for (const c of cells) clouds.push({x:c.x, z:c.z, rank:c.rank, kind:3, sk:1, P:[[0, 0, 0, c.Rc*1.1, 1, 0, 0]]});
  for (const c of big) clouds.push({x:c.x, z:c.z, rank:c.rank, kind:3, P:[[0, 0, 0, 950*c.s*0.85, 0, 0, 0]]});
  // vertex buffers: 4 corners per puff; puffs of a cloud stay together, lowest first
  let np = 0; for (const c of clouds){ c.P.sort((a, b) => a[1] - b[1]); np += c.P.length; }
  const nv = np*4, pos = new Float32Array(nv*3), aC = new Float32Array(nv*4), aP = new Float32Array(nv*4), aK = new Float32Array(nv*2);
  CL.n = clouds.length; CL.x = new Float32Array(CL.n); CL.z = new Float32Array(CL.n); CL.y = new Float32Array(CL.n); CL.p0 = new Uint16Array(CL.n); CL.np = new Uint8Array(CL.n);
  CL.ord = new Uint16Array(CL.n); CL.key = new Float32Array(CL.n); CL.kd = new Uint8Array(CL.n); CL.rk = new Float32Array(CL.n); CL.rr = new Float32Array(CL.n); CL.sk = new Uint8Array(CL.n); CL.cells = [];
  let p = 0;
  clouds.forEach((c, ci) => {
    CL.x[ci] = c.x; CL.z[ci] = c.z; CL.p0[ci] = p; CL.np[ci] = c.P.length; CL.ord[ci] = ci; CL.kd[ci] = c.kind; CL.rk[ci] = c.rank; CL.sk[ci] = c.sk ? 1 : 0; CL.rr[ci] = c.kind === 1 ? c.Rc*0.9 : 950*(c.s || 1)*0.85;
    CL.y[ci] = c.kind === 3 ? -CBASE*0.5 : c.P.reduce((s, q) => s + q[1], 0)/c.P.length;
    if (c.kind === 1) CL.cells.push(ci);
    for (const q of c.P){
      const seed = q[6] + 0.05 + 0.9*rnd();
      for (let k = 0; k < 4; k++){
        const v = p*4 + k;
        pos[v*3] = q[0]; pos[v*3 + 1] = q[1]; pos[v*3 + 2] = q[2];
        aC[v*4] = c.x; aC[v*4 + 1] = c.z; aC[v*4 + 2] = c.rank; aC[v*4 + 3] = c.kind;
        aP[v*4] = q[3]; aP[v*4 + 1] = q[4]; aP[v*4 + 2] = q[5]; aP[v*4 + 3] = seed;
        aK[v*2] = (k & 1) ? 1 : -1; aK[v*2 + 1] = (k & 2) ? 1 : -1;
      }
      p++;
    }
  });
  CL.cellRank = CL.cells.map(ci => clouds[ci].rank);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCloud', new THREE.BufferAttribute(aC, 4));
  g.setAttribute('aPuff', new THREE.BufferAttribute(aP, 4)); g.setAttribute('aCorner', new THREE.BufferAttribute(aK, 2));
  CL.idx = new THREE.BufferAttribute(new Uint16Array(np*6), 1); CL.idx.setUsage(THREE.DynamicDrawUsage); g.setIndex(CL.idx); g.setDrawRange(0, 0);
  CL.ib = [0, 1].map(() => new THREE.BufferAttribute(new Uint16Array(np*6), 1).setUsage(THREE.DynamicDrawUsage)); CL.cur = 0; g.setIndex(CL.ib[0]);   // two index buffers in turn
  CL.puffs = np; CL.geo = g;
  CL.mat = new THREE.ShaderMaterial({
    uniforms:{uOldTile:{value:0}, uTex:{value:wxAtlas()}, uField:{value:FIELD}, uK:{value:1}, uBase:{value:CBASE}, uCov:{value:0}, uDark:{value:0}, uTow:{value:0}, uCb:{value:0}, uDeck:{value:0},
      uRainA:{value:0}, uShY:{value:200}, uShadow:{value:0}, uShC:{value:new THREE.Color(0.06, 0.08, 0.11)}, uTime:{value:0}, uNearA:{value:0}, uNearB:{value:1}, uD:{value:1000}, uCut:{value:0}, uFlash:{value:0}, uOp:{value:1}, uSlant:{value:0.5},
      uOff:{value:new THREE.Vector2()}, uCen:{value:new THREE.Vector2()}, uWd:{value:new THREE.Vector2(1, 0)}, uFlashP:{value:new THREE.Vector3()},
      uSunW:{value:new THREE.Vector3(0, 1, 0)}, uRt:{value:new THREE.Vector3(1, 0, 0)}, uUp:{value:new THREE.Vector3(0, 1, 0)}, uBk:{value:new THREE.Vector3(0, 0, 1)}, uSunC:{value:new THREE.Color()}, uAmbC:{value:new THREE.Color()}, uGlowC:{value:new THREE.Color()}, uShaftC:{value:new THREE.Color()},
      uFogC:{value:new THREE.Color()}, uFogN:{value:1e5}, uFogF:{value:2e5}, uAspect:{value:1}, uView:{value:new THREE.Vector2(1, 1)}, uTgt:{value:new THREE.Vector2()}},
    vertexShader:`
attribute vec4 aCloud; attribute vec4 aPuff; attribute vec2 aCorner;
uniform float uField, uK, uBase, uCov, uDark, uTow, uCb, uDeck, uRainA, uTime, uNearA, uNearB, uD, uCut, uFlash, uOp, uSlant;
uniform vec2 uOff, uCen, uWd; uniform vec3 uFlashP, uSunW; uniform float uShY, uShadow;
varying vec2 vUv; varying vec4 vA; varying vec4 vB; varying vec3 vC; varying float vSeed; varying vec2 vTl;
void main(){
  float kind = aCloud.w, rank = aCloud.z, part = aPuff.y, lev = aPuff.z, tile = floor(aPuff.w), seed = fract(aPuff.w);
  vec2 c = aCloud.xy*uField + uOff;
  c = uCen + mod(c - uCen + 0.5*uField, uField) - 0.5*uField;                 // the field wraps around the view
  vec2 ec = abs(c - uCen);
  float al = 1.0 - smoothstep(0.36*uField, 0.5*uField, max(ec.x, ec.y));
  float covP = smoothstep(rank - 0.05, rank + 0.05, uCov), act = 0.0, pres = covP, dark = uDark*0.85, op = 0.97, swell = 1.0;
  if (kind > 0.5 && kind < 1.5){                                               // convective cell
    act = smoothstep(rank - 0.04, rank + 0.08, uCb); pres = max(covP, act); dark = uDark*(0.72 + 0.28*act);
    if (part > 1.5 && part < 2.5) pres *= smoothstep(lev, lev + 0.12, max(act*uTow, 0.42*uTow*covP));
    else if (part > 2.5){ pres *= smoothstep(0.8, 0.97, act*uTow); op = 0.75; }
  } else if (kind > 1.5 && kind < 2.5){ pres = smoothstep(rank - 0.08, rank + 0.08, uDeck)*smoothstep(0.7*uBase, 1.6*uBase, cameraPosition.y); op = 0.5; dark = uDark; }   // the deck is a veil seen from above (from below the grey sky stands in for it)
  else if (kind > 2.5 && kind < 3.5){ pres = (part > 0.5 ? smoothstep(rank - 0.04, rank + 0.08, uCb) : covP*smoothstep(rank - 0.08, rank, 0.25 + 0.4*uRainA))*uRainA; op = 0.85; }
  else if (kind > 3.5){ pres = part > 0.5 ? max(covP, smoothstep(rank - 0.04, rank + 0.08, uCb)) : covP; op = 0.34*uShadow; }
  if ((kind < 1.5 && part < 1.5) || kind > 3.5) swell = 1.0 + 0.32*uDark;      // storm clouds swell
  float R = aPuff.x*uK*mix(0.45, 1.0, pres)*swell*(1.0 + 0.05*sin(uTime*0.13 + seed*40.0));
  vec3 off = position*uK; off.xz *= swell;
  vec3 wc = vec3(c.x + off.x, uBase + off.y, c.y + off.z), wp;
  if (kind > 3.5){                                                             // ground shadow: a flat soft disc offset away from the sun
    vec2 sh = -uSunW.xz/max(uSunW.y, 0.3)*max(0.0, wc.y - uShY);
    float W = aPuff.x*uK*mix(0.5, 1.0, pres)*swell;
    wc = vec3(c.x + sh.x, uShY, c.y + sh.y); wp = wc + vec3(aCorner.x*W, 0.0, aCorner.y*W);
  } else if (kind > 2.5){                                                      // rain shaft: a vertical card turned to the camera
    vec2 tc = cameraPosition.xz - wc.xz; float hd = length(tc);
    vec3 rt = hd > 1.0 ? vec3(-tc.y, 0.0, tc.x)/hd : vec3(1.0, 0.0, 0.0);
    float W = aPuff.x*uK, v = aCorner.y*0.5 + 0.5;
    wp = vec3(wc.x, mix(-30.0, uBase + 40.0*uK, v), wc.z) + rt*aCorner.x*W;
    wp.xz += uWd*(1.0 - v)*W*0.45*uSlant;
    al *= smoothstep(0.7*W, 1.7*W, hd);
    wc.y = 0.5*uBase;
  } else {                                                                     // puff: a camera-facing sprite, flattened when seen from the side
    vec3 tc = cameraPosition - wc; float dc = length(tc);
    float sq = (part > 2.5 || kind > 1.5) ? 0.42 : (part > 1.5 ? 0.92 : 0.68);
    sq = mix(sq, 1.0, abs(tc.y)/max(dc, 1.0));
    vec3 rt = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    wp = wc + R*(aCorner.x*rt + aCorner.y*sq*up);
    al *= smoothstep(uNearA, uNearB, dc)*smoothstep(0.5*R, 1.5*R, dc);
  }
  vec4 mc = viewMatrix*vec4(wc, 1.0), mv = viewMatrix*vec4(wp, 1.0);
  float a = pres*al*op*uOp;
  gl_Position = a < 0.003 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix*mv;
  vUv = aCorner;
  float span = (kind > 0.5 && kind < 1.5) ? 5200.0 : 1500.0;
  vA = vec4(a, clamp((wp.y - uBase)/(span*uK), 0.0, 1.0), clamp(dark, 0.0, 1.0), kind > 3.5 ? 0.0 : uFlash*(0.18 + 0.82*exp(-distance(wc, uFlashP)/(3800.0*uK))));
  float cut = (kind < 1.5 && part < 1.5) ? uBase : ((part > 2.5 || (kind > 1.5 && kind < 2.5)) ? wc.y - 0.24*R : -1e6);
  vB = vec4(kind, wp.y, cut, 0.16*R);
  vC = vec3(-mv.z, uCut*(1.0 - smoothstep(0.7*uD, 0.98*uD, -mc.z)), tile);
  vSeed = seed; vTl = vec2(mod(tile, 2.0), floor(tile*0.5 + 0.25))*0.5;   // atlas tile offset: exact 0 / 0.5 per corner
}`,
    fragmentShader:`
uniform float uOldTile; uniform sampler2D uTex; uniform vec3 uSunW, uRt, uUp, uBk, uSunC, uAmbC, uGlowC, uShaftC, uShC, uFogC; uniform float uFogN, uFogF, uAspect; uniform vec2 uView, uTgt;
varying vec2 vUv; varying vec4 vA; varying vec4 vB; varying vec3 vC; varying float vSeed; varying vec2 vTl;
float wxH(float x){ return fract(sin(x*127.1)*43758.5453); }
float wxN(float x){ float i = floor(x), f = fract(x); return mix(wxH(i), wxH(i + 1.0), f*f*(3.0 - 2.0*f)); }
void main(){
  float a = vA.x; vec3 col;
  if (vB.x > 3.5){                                                             // ground shadow
    a *= (1.0 - smoothstep(0.2, 1.0, length(vUv)))*(0.75 + 0.25*wxN(vUv.x*2.5 + vUv.y*1.7 + vSeed*50.0));
    col = uShC;
  } else if (vB.x > 2.5){                                                      // rain shaft: soft grey streaks
    float v = vUv.y*0.5 + 0.5, u = vUv.x, s = wxN(u*6.0 + vSeed*91.0)*0.55 + wxN(u*17.0 + vSeed*37.0)*0.45;
    a *= (1.0 - smoothstep(0.25, 1.0, abs(u)))*smoothstep(0.0, 0.08, v)*(1.0 - smoothstep(0.8, 1.0, v))*mix(0.5, 1.0, s);
    col = uShaftC*(0.88 + 0.22*s);
  } else {
    vec4 tx = texture2D(uTex, (vUv*0.5 + 0.5)*0.5 + (uOldTile > 0.5 ? vec2(mod(vC.z, 2.0), floor(vC.z*0.5))*0.5 : vTl));   // uOldTile: test switch (the old decode)
    a *= tx.a*smoothstep(vB.z, vB.z + vB.w, vB.y)*(1.0 - smoothstep(0.82, 0.98, length(vUv)));   // flat cloud bases; no quad edges at small mips
    if (a < 0.004) discard;
    vec3 n = tx.rgb*2.0 - 1.0, nw = normalize(n.x*uRt + n.y*uUp + n.z*uBk);    // sprite normal -> world
    float hf = vA.y, lit = clamp(0.3 + 0.7*dot(nw, uSunW), 0.0, 1.0), sky = 0.86 + 0.14*nw.y;
    col = uAmbC*sky*mix(0.84, 1.0, hf) + uSunC*lit*mix(0.55, 1.0, hf)*(1.0 - 0.75*vA.z*(1.0 - hf));   // storm clouds: little direct sun below the tops
    col *= 1.0 - vA.z*mix(0.74, 0.1, max(hf*hf, 0.15 + 0.15*nw.y));
    col += uGlowC*(0.3 + 0.7*(1.0 - hf))*(0.6 - 0.4*nw.y);
  }
  col += vec3(0.8, 0.85, 1.0)*vA.w;
  if (vC.y > 0.001){                                                           // keep the view centre clear when zoomed in
    vec2 q = (gl_FragCoord.xy/uView*2.0 - 1.0 - uTgt)*vec2(uAspect, 1.0);
    a *= 1.0 - vC.y*(1.0 - smoothstep(0.2, 0.75, length(q)));
  }
  if (a < 0.004) discard;
  gl_FragColor = vec4(mix(col, uFogC, smoothstep(uFogN, uFogF, vC.x)*(vB.x > 2.5 && vB.x < 3.5 ? 0.55 : 1.0)), a);
}`,
    transparent:true, depthWrite:false, depthTest:true, side:THREE.DoubleSide, fog:false});
  CL.mesh = new THREE.Mesh(g, CL.mat); CL.mesh.frustumCulled = false; CL.mesh.renderOrder = 7; CL.mesh.visible = false; CL.mesh.name = 'wxClouds';
  scene.add(CL.mesh);
  wxSortWrite(true);
}
// how much of the sun a cloud hides at the view target (0..1)
function wxSunShade(){
  const U = CL.mat.uniforms, Fd = U.uField.value, ox = U.uOff.value.x, oz = U.uOff.value.y, cx = U.uCen.value.x, cz = U.uCen.value.y, k = U.uK.value, base = U.uBase.value, t = controls.target, sd = sunDir;
  if (sd.y < 0.08) return 0;
  const sw = 1 + 0.32*wxS.dark; let sh = 0;
  for (let i = 0; i < CL.n; i++){
    const kd = CL.kd[i]; if (kd > 1) continue;
    const r = CL.rk[i], pc = wxSm(r - 0.05, r + 0.05, wxS.cov), pres = kd ? Math.max(pc, wxSm(r - 0.04, r + 0.08, wxS.cb)) : pc;
    if (pres < 0.02) continue;
    const h = base + CL.y[i]*k - t.y, px = t.x + sd.x/sd.y*h, pz = t.z + sd.z/sd.y*h;
    const x = cx + wxMod(CL.x[i]*Fd + ox - cx + Fd/2, Fd) - Fd/2, z = cz + wxMod(CL.z[i]*Fd + oz - cz + Fd/2, Fd) - Fd/2;
    const d = Math.hypot(x - px, z - pz)/(CL.rr[i]*k*(0.45 + 0.55*pres)*sw);
    if (d < 1) sh = Math.max(sh, pres*(1 - wxSm(0.45, 1, d)));
  }
  return sh;
}
// back-to-front order of the clouds (and of the puffs inside each), written into the index buffer
function wxPres(i, m){
  m = m || 0;      // margin: also list the clouds that are just about to appear (the list is rebuilt only every few frames)
  const r = CL.rk[i], s = wxS, covP = wxSm(r - 0.05, r + 0.05, s.cov + m), act = wxSm(r - 0.04, r + 0.08, s.cb + m), rainA = Math.min(1, s.rain*1.6 + 2*m);
  switch (CL.kd[i]){
    case 0: return covP;
    case 1: return Math.max(covP, act);
    case 2: return wxSm(r - 0.08, r + 0.08, s.deck + m);
    case 3: return (CL.sk[i] ? act : covP*wxSm(r - 0.08, r, 0.25 + 0.4*rainA + m))*rainA;
    default: return (CL.sk[i] ? Math.max(covP, act) : covP)*(CL.mat.uniforms.uShadow.value > 0.002 ? 1 : 0);
  }
}
function wxSortWrite(first){
  const DB = WX.dbg, legacy = DB.mode === 'legacy' || DB.mode === 'full';
  const I = legacy ? CL.idx.array : CL.ib[CL.cur ^ 1].array, cam = camera.position, U = CL.mat.uniforms, Fd = U.uField.value, ox = U.uOff.value.x, oz = U.uOff.value.y, cx = U.uCen.value.x, cz = U.uCen.value.y, k = U.uK.value, base = U.uBase.value;
  let n = CL.n;
  if (!first){
    n = 0; const mg = legacy ? 0 : 0.035; for (let i = 0; i < CL.n; i++) if (wxPres(i, mg) > 0.003) CL.ord[n++] = i;
    for (let j = 0; j < n; j++){
      const i = CL.ord[j], x = cx + wxMod(CL.x[i]*Fd + ox - cx + Fd/2, Fd) - Fd/2, z = cz + wxMod(CL.z[i]*Fd + oz - cz + Fd/2, Fd) - Fd/2, y = CL.kd[i] === 4 ? U.uShY.value : base + CL.y[i]*k;
      CL.key[i] = (x - cam.x)*(x - cam.x) + (y - cam.y)*(y - cam.y) + (z - cam.z)*(z - cam.z);
    }
    CL.ord.subarray(0, n).sort((a, b) => CL.key[b] - CL.key[a]);
  }
  let w = 0;
  for (let j = 0; j < n; j++){
    const i = CL.ord[j], p0 = CL.p0[i], m = CL.np[i], up = cam.y < base + CL.y[i]*k;     // seen from below: top puffs first
    for (let q = 0; q < m; q++){ const v = (p0 + (up ? m - 1 - q : q))*4; I[w++] = v; I[w++] = v + 1; I[w++] = v + 3; I[w++] = v; I[w++] = v + 3; I[w++] = v + 2; }
  }
  DB.sortN++;
  if (legacy){       // the old way (kept for the before/after test): re-upload (part of) the buffer that is being drawn
    if (DB.mode === 'legacy'){ CL.idx.updateRange.offset = 0; CL.idx.updateRange.count = Math.max(1, w); }
    CL.idx.needsUpdate = true; CL.geo.setIndex(CL.idx); CL.geo.setDrawRange(0, w); return;
  }
  const A = CL.ib[CL.cur].array;
  if (!first && w === CL.geo.drawRange.count && CL.geo.index === CL.ib[CL.cur]){ let same = true; for (let j = 0; j < w; j++) if (A[j] !== I[j]){ same = false; break; } if (same) return; }
  const B = CL.ib[CL.cur ^ 1]; B.needsUpdate = true; CL.cur ^= 1; CL.geo.setIndex(B); CL.geo.setDrawRange(0, w); DB.upN++;
}

/* ---------- rain streaks: a box of falling quads around the camera, all motion in the vertex shader ---------- */
const RN = 16000, RAIN = {mesh:null, mat:null};
function wxBuildRain(){
  const nv = RN*4, pos = new Float32Array(nv*3), aK = new Float32Array(nv), aC = new Float32Array(nv*2), idx = new Uint16Array(RN*6), r = mulberry32(5150);
  for (let i = 0; i < RN; i++){
    const x = r(), y = r(), z = r(), w = r();
    for (let k = 0; k < 4; k++){ const v = i*4 + k; pos[v*3] = x; pos[v*3 + 1] = y; pos[v*3 + 2] = z; aK[v] = w; aC[v*2] = k >> 1; aC[v*2 + 1] = (k & 1) ? 1 : -1; }
    idx.set([i*4, i*4 + 1, i*4 + 3, i*4, i*4 + 3, i*4 + 2], i*6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aK', new THREE.BufferAttribute(aK, 1)); g.setAttribute('aCorner', new THREE.BufferAttribute(aC, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  RAIN.mat = new THREE.ShaderMaterial({
    uniforms:{uBox:{value:new THREE.Vector3(120, 80, 120)}, uCen:{value:new THREE.Vector3()}, uVel:{value:new THREE.Vector3(0, -9.5, 0)}, uT:{value:0}, uRain:{value:0}, uWob:{value:0}, uFade:{value:0.2},
      uLen:{value:0.075}, uW:{value:0.018}, uOp:{value:0.3}, uView:{value:new THREE.Vector2(1, 1)}, uCol:{value:new THREE.Color(0.75, 0.77, 0.8)}},
    vertexShader:`
attribute float aK; attribute vec2 aCorner;
uniform vec3 uBox, uCen, uVel; uniform float uT, uRain, uLen, uW, uOp, uWob; uniform vec2 uView;
varying float vA; varying float vT;
void main(){
  vA = 0.0; vT = aCorner.x; gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  if (aK > uRain) return;
  vec3 vel = uVel*(0.8 + 0.4*fract(aK*97.13));
  vec3 p = position*uBox + vel*uT;
  if (uWob > 0.0) p += uWob*vec3(sin(uT*1.7 + aK*61.0), 0.0, cos(uT*1.3 + aK*37.0));
  p = uCen + mod(p - uCen + 0.5*uBox, uBox) - 0.5*uBox;
  vec4 A = projectionMatrix*viewMatrix*vec4(p, 1.0), B = projectionMatrix*viewMatrix*vec4(p - vel*uLen, 1.0);
  if (A.w < 0.3 || B.w < 0.3) return;
  vec2 d = (A.xy/A.w - B.xy/B.w)*uView; float L = length(d); d = L > 0.001 ? d/L : vec2(0.0, 1.0);
  vec4 P = aCorner.x < 0.5 ? A : B;
  float px = uW*projectionMatrix[1][1]*0.5*uView.y/P.w;
  P.xy += vec2(-d.y, d.x)*aCorner.y*max(px, 1.1)/uView*P.w;
  gl_Position = P;
  vec3 h = p - uCen;
  vA = uOp*(1.0 - smoothstep(0.3, 0.5, max(length(h.xz)/uBox.x, abs(h.y)/uBox.y)))*min(1.0, px/0.9 + 0.4)*(0.55 + 0.45*fract(aK*13.7))*smoothstep(0.6, 2.5, A.w);
}`,
    fragmentShader:`
uniform vec3 uCol; uniform float uFade; varying float vA; varying float vT;
void main(){ float a = vA*mix(1.0, uFade, vT); if (a < 0.003) discard; gl_FragColor = vec4(uCol, a); }`,
    transparent:true, depthWrite:false, depthTest:true, side:THREE.DoubleSide, fog:false});
  RAIN.mesh = new THREE.Mesh(g, RAIN.mat); RAIN.mesh.frustumCulled = false; RAIN.mesh.renderOrder = 8; RAIN.mesh.visible = false; RAIN.mesh.name = 'wxRain';
  scene.add(RAIN.mesh);
}

/* ---------- lightning: a jagged ribbon (core + glow) from the cloud base to the ground, built at each strike ---------- */
const BOLT = {mesh:null, mat:null, geo:null, max:96};
function wxBuildBolt(){
  const nv = BOLT.max*2*4, g = new THREE.BufferGeometry(), idx = new Uint16Array(BOLT.max*2*6);
  for (let i = 0; i < BOLT.max*2; i++) idx.set([i*4, i*4 + 1, i*4 + 3, i*4, i*4 + 3, i*4 + 2], i*6);
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv*3), 3)); g.setAttribute('aB', new THREE.BufferAttribute(new Float32Array(nv*3), 3));
  g.setAttribute('aE', new THREE.BufferAttribute(new Float32Array(nv*4), 4)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.setDrawRange(0, 0);
  BOLT.mat = new THREE.ShaderMaterial({
    uniforms:{uView:{value:new THREE.Vector2(1, 1)}, uI:{value:0}, uFogC:{value:new THREE.Color()}, uFogN:{value:1e5}, uFogF:{value:2e5}},
    vertexShader:`
attribute vec3 aB; attribute vec4 aE;
uniform vec2 uView; uniform float uI, uFogN, uFogF;
varying float vA; varying float vS;
void main(){
  vec4 A = projectionMatrix*viewMatrix*vec4(position, 1.0), B = projectionMatrix*viewMatrix*vec4(aB, 1.0);
  vec4 P = aE.x < 0.5 ? A : B;
  vS = aE.y; vA = aE.w*uI*(1.0 - 0.75*smoothstep(uFogN, uFogF, P.w));
  if (A.w < 0.5 || B.w < 0.5){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec2 d = (A.xy/A.w - B.xy/B.w)*uView; float L = length(d); d = L > 0.001 ? d/L : vec2(1.0, 0.0);
  float px = max(aE.z, aE.z*3.0*projectionMatrix[1][1]*0.5*uView.y/P.w);
  P.xy += vec2(-d.y, d.x)*aE.y*px/uView*P.w;
  gl_Position = P;
}`,
    fragmentShader:`
varying float vA; varying float vS;
void main(){ float f = 1.0 - vS*vS; gl_FragColor = vec4(vec3(0.86, 0.9, 1.0), vA*f*f); }`,
    transparent:true, depthWrite:false, depthTest:true, blending:THREE.AdditiveBlending, side:THREE.DoubleSide, fog:false});
  BOLT.geo = g; BOLT.mesh = new THREE.Mesh(g, BOLT.mat); BOLT.mesh.frustumCulled = false; BOLT.mesh.renderOrder = 8; BOLT.mesh.visible = false; BOLT.mesh.name = 'wxBolt';
  scene.add(BOLT.mesh);
}
function wxBoltPath(a, b, rnd, it, amp){
  let P = [a, b];
  for (let k = 0; k < it; k++){
    const Q = [P[0]];
    for (let i = 1; i < P.length; i++){ const p = P[i - 1], q = P[i]; Q.push([(p[0] + q[0])/2 + (rnd() - 0.5)*amp, (p[1] + q[1])/2 + (rnd() - 0.5)*amp*0.35, (p[2] + q[2])/2 + (rnd() - 0.5)*amp], q); }
    P = Q; amp *= 0.56;
  }
  return P;
}
function wxBoltBuild(x, z, top, gy){
  const rnd = Math.random, k = wxK(), H = top - gy, gx = x + (rnd() - 0.5)*H*0.5, gz = z + (rnd() - 0.5)*H*0.5;
  const main = wxBoltPath([x, top, z], [gx, gy, gz], rnd, 5, H*0.32), lines = [[main, 1]];
  for (let b = 0; b < 3; b++){
    const i = 2 + Math.floor(rnd()*main.length*0.55), s = main[i], L = H*(0.22 + 0.2*rnd()), a = rnd()*Math.PI*2;
    lines.push([wxBoltPath(s, [s[0] + Math.cos(a)*L*0.7, Math.max(gy + 20*k, s[1] - L), s[2] + Math.sin(a)*L*0.7], rnd, 4, L*0.35), 0.45]);
  }
  const g = BOLT.geo, P = g.attributes.position.array, Bv = g.attributes.aB.array, E = g.attributes.aE.array;
  let q = 0;
  for (const pass of [[2.2, 1], [16, 0.2]]) for (const [pts, w] of lines) for (let i = 1; i < pts.length && q < BOLT.max*2; i++, q++){
    const a = pts[i - 1], b = pts[i];
    for (let c = 0; c < 4; c++){ const v = q*4 + c; P.set(a, v*3); Bv.set(b, v*3); E[v*4] = c >> 1; E[v*4 + 1] = (c & 1) ? 1 : -1; E[v*4 + 2] = pass[0]*(0.6 + 0.4*w); E[v*4 + 3] = pass[1]*w; }
  }
  g.attributes.position.needsUpdate = g.attributes.aB.needsUpdate = g.attributes.aE.needsUpdate = true; g.setDrawRange(0, q*6);
}

/* ---------- strikes ---------- */
const _wv = new THREE.Vector3(), _wf = new THREE.Vector3(), _wt = new THREE.Vector3();
function wxStrike(now, force, at){
  if (!CL.mesh) return;
  const U = CL.mat.uniforms, Fd = U.uField.value, ox = U.uOff.value.x, oz = U.uOff.value.y, cx = U.uCen.value.x, cz = U.uCen.value.y, k = U.uK.value, base = U.uBase.value;
  camera.getWorldDirection(_wf);
  const cand = [];
  CL.cells.forEach((ci, j) => {
    if (CL.cellRank[j] > wxS.cb + 0.02 && !force) return;
    const x = cx + wxMod(CL.x[ci]*Fd + ox - cx + Fd/2, Fd) - Fd/2, z = cz + wxMod(CL.z[ci]*Fd + oz - cz + Fd/2, Fd) - Fd/2;
    _wv.set(x - camera.position.x, base*0.5 - camera.position.y, z - camera.position.z); const d = _wv.length(), fw = _wv.dot(_wf)/Math.max(1, d);
    if (Math.max(Math.abs(x - cx), Math.abs(z - cz)) > 0.36*Fd) return;
    _wt.set(x, base*0.5, z).project(camera); const vis = Math.abs(_wt.x) < 0.85 && Math.abs(_wt.y) < 0.85 && _wt.z < 1;
    cand.push([x, z, (vis ? 4 : fw > 0.2 ? 0.6 : 0.15)*(d < 30000*k ? 1 : 0.3)*(CL.cellRank[j] < wxS.cb ? 1 : 0.2)]);
  });
  let x, z;
  if (at){ x = controls.target.x + at[0]; z = controls.target.z + at[1]; }
  else if (cand.length){ let t = 0; for (const c of cand) t += c[2]; let r = Math.random()*t; for (const c of cand){ r -= c[2]; if (r <= 0){ x = c[0]; z = c[1]; break; } } if (x === undefined){ x = cand[0][0]; z = cand[0][1]; } }
  else { const t = controls.target; x = t.x + _wf.x*3000*k + (Math.random() - 0.5)*4000*k; z = t.z + _wf.z*3000*k + (Math.random() - 0.5)*4000*k; }
  if (!at){ x += (Math.random() - 0.5)*1400*k; z += (Math.random() - 0.5)*1400*k; }
  const top = base + 120*k, bolt = force || Math.random() < 0.65;
  FL.t0 = now; FL.bolt = bolt; FL.x = x; FL.y = top; FL.z = z;
  const n = 2 + Math.floor(Math.random()*3); FL.pulses = [[0, 1]]; for (let i = 1; i < n; i++) FL.pulses.push([FL.pulses[i - 1][0] + 0.05 + Math.random()*0.12, 0.45 + 0.55*Math.random()]);
  FL.g = Math.min(1, Math.max(0.2, 9000*k/Math.max(1, Math.hypot(x - camera.position.x, z - camera.position.z, top - camera.position.y))));
  if (bolt){ if (!BOLT.mesh) wxBuildBolt(); wxBoltBuild(x, z, top, hC(x, -z)); }
  U.uFlashP.value.set(x, top, z);
}
function wxFlashAt(now){
  if (!FL.pulses) return 0;
  const t = WX.hold ? 0.015 : now - FL.t0; if (t > 1.2){ FL.pulses = null; return 0; }
  let f = 0; for (const p of FL.pulses) if (t >= p[0]) f += p[1]*Math.exp(-(t - p[0])/0.07);
  return Math.min(1.3, f);
}

/* ---------- per frame ---------- */
const _wd = new THREE.Vector2();
function wxFrame(){
  const now = performance.now()/1000, dt = Math.min(0.25, Math.max(0, now - (WX.last || now))); WX.last = now; WX.frame++;
  const ny = wxNyc(); if (ny && !WX.nyInit){ WX.nyInit = true; for (const p of ['snow', 'fog']) if (!WX_PAR.includes(p)){ WX_PAR.push(p); wxS[p] = 0; wxT[p] = 0; } }
  const tgt = WX.mode === 'auto' ? (ny ? wxAutoNy(tod, now) : wxAuto(tod, now)) : (ny && WX_TGT_NY[WX.mode]) || WX_TGT[WX.mode] || WX_TGT.clear;
  const f = WX.instant ? 1 : 1 - Math.exp(-dt/1.6); if (WX.instant) WX.instant2 = true; WX.instant = false;
  { const inst = WX.instant2 || f === 1, r = Math.min(1, (inst ? tgt.rain || 0 : wxS.rain)*1.25);   // [v33] wet ground
    WX.wet = inst ? r : r > WX.wet ? WX.wet + (r - WX.wet)*(1 - Math.exp(-dt*(todPlay ? 20 : 1)/18)) : Math.max(r, WX.wet - dt*(todPlay ? 20 : 1)/240); }
  let moving = false;
  for (const p of WX_PAR){ wxT[p] = tgt[p] || 0; const d = wxT[p] - wxS[p]; if (Math.abs(d) > 2e-4){ wxS[p] += d*f; moving = true; } else wxS[p] = wxT[p]; }
  const s = wxS, active = s.cov + s.deck + s.cb + s.vis + s.rain + s.ovc + s.blue + s.dark + (s.snow || 0) > 1e-4;
  if (ny) wxSnowSurf(s.snow || 0);
  // lightning
  let F = wxFlashAt(now);
  if (s.bolt > 0.05 && CL.mesh && !WX.hold && !WX.quiet){ if (!FL.next || now > FL.next + 30) FL.next = now + 1 + Math.random()*3; if (now >= FL.next){ wxStrike(now, false); FL.next = now + (1.3 + 5*Math.random())/(0.3 + s.bolt); F = wxFlashAt(now); } }
  FL.F = F;
  if (!active && !moving && !F){
    if (WX.applied){ wxEnv(); wxFog(camera.position.distanceTo(controls.target), 0); WX.applied = false; }
    if (CL.mesh) CL.mesh.visible = false; if (RAIN.mesh) RAIN.mesh.visible = false; if (BOLT.mesh) BOLT.mesh.visible = false;
    wxIcon(); return;
  }
  const D = camera.position.distanceTo(controls.target), k = wxK();
  if (moving || F > 0 || FL.was) wxEnv();
  FL.was = F > 0;
  const cp = camera.position, calt = cp.y - Math.max(0, hAt(cp.x, -cp.z));
  wxFog(D, calt);
  if (!CL.mesh && (s.cov + s.deck + s.cb + s.rain + (s.snow || 0)) > 1e-3){ wxBuildClouds(); wxBuildRain(); }
  renderer.getDrawingBufferSize(_wd);
  // clouds
  const cloudsOn = CL.mesh && (s.cov + s.deck + s.cb + s.rain) > 1e-3;
  if (CL.mesh) CL.mesh.visible = !!cloudsOn;
  if (cloudsOn){
    const U = CL.mat.uniforms, Fd = FIELD*k, ws = (6 + 9*s.wind)*k*(todPlay ? 45 : 1), wd = U.uWd.value.set(0.92, 0.39);
    U.uField.value = Fd; U.uK.value = k; U.uBase.value = CBASE*k;
    U.uOff.value.set(wxMod(U.uOff.value.x + wd.x*ws*dt, Fd), wxMod(U.uOff.value.y + wd.y*ws*dt, Fd));
    const t = controls.target, c = camera.position; U.uCen.value.set(t.x + 0.35*(c.x - t.x), t.z + 0.35*(c.z - t.z));
    U.uCov.value = s.cov; U.uDark.value = s.dark; U.uTow.value = s.tow; U.uCb.value = s.cb; U.uDeck.value = s.deck; U.uRainA.value = Math.min(1, s.rain*1.6); U.uSlant.value = 0.3 + 0.7*s.wind;
    U.uTime.value = now % 10000; U.uD.value = D; U.uFlash.value = F;
    const hi = wxSm(5000*k, 20000*k, D); U.uNearA.value = D*(0.1 + 0.1*hi); U.uNearB.value = D*(0.4 + 0.1*hi); U.uCut.value = 1 - wxSm(4000*k, 14000*k, D);
    _wt.copy(t).project(camera); U.uTgt.value.set(Math.max(-1, Math.min(1, _wt.x)), Math.max(-1, Math.min(1, _wt.y)));
    U.uView.value.copy(_wd); U.uAspect.value = _wd.x/Math.max(1, _wd.y);
    U.uSunW.value.copy(sunDir); const me = camera.matrixWorld.elements; U.uRt.value.set(me[0], me[1], me[2]).normalize(); U.uUp.value.set(me[4], me[5], me[6]).normalize(); U.uBk.value.set(me[8], me[9], me[10]).normalize();
    // cloud light from the clear-sky sun/sky of this hour (the ground light is dimmed separately)
    const sk = WB.sI/0.72, ak = WB.hI/0.78;
    U.uSunC.value.copy(WB.sun).multiplyScalar(0.55*sk*(1 - 0.25*s.dark));
    U.uAmbC.value.copy(WB.hs).multiplyScalar(ak).lerp(scene.background, 0.55).multiplyScalar(0.95*(1 - 0.2*s.dark));
    const dusk = wxSm(0.1, 0.45, WB.nf)*(1 - wxSm(0.6, 0.92, WB.nf));
    U.uGlowC.value.setRGB(1, 0.6, 0.32).multiplyScalar(0.1*wxSm(0.5, 1, WB.nf)*(SGR.on ? 1 : 0.7)).add(_wg.copy(WB.sun).lerp(scene.background, 0.3).multiplyScalar(0.7*dusk*(1 - 0.6*s.ovc)));
    U.uShaftC.value.copy(scene.background).multiplyScalar(0.62 - 0.18*s.dark).lerp(U.uAmbC.value, 0.2);
    U.uFogC.value.copy(scene.fog.color); U.uFogN.value = scene.fog.near; U.uFogF.value = scene.fog.far;
    U.uOp.value = 1; U.uOldTile.value = WX.dbg.oldTile ? 1 : 0;
    if (WX.hRef !== H){ WX.hRef = H; let m = 0; for (let i = 0; i < H.length; i += 7) if (H[i] > m) m = H[i]; WX.peak = m; }
    const alt = c.y - Math.max(0, hAt(c.x, -c.z)), mk = s.vis*s.milk;
    U.uShY.value = Math.min(CBASE*k*0.8, Math.max(200*k, WX.peak + 40)); U.uShC.value.copy(WB.hg).multiplyScalar(0.12);
    U.uShadow.value = wxSm(2200*k, 5000*k, alt)*Math.pow(1 - WB.nf, 2)*(1 - 0.8*s.ovc)*(1 - 0.7*mk)*Math.min(1, WB.sI/0.5);
    if (WX.frame % 4 === 0 || WX.instant2){ const sh = wxSunShade(); WX.shade = WX.instant2 ? sh : WX.shade + (sh - WX.shade)*(1 - Math.exp(-dt*4/1.2)); WX.instant2 = false; }
    sun.intensity = WX.sunI*(1 - 0.72*WX.shade*(1 - wxSm(2500*k, 7000*k, D)));
    const sig = s.cov + 3*s.cb + 7*s.deck + 11*s.rain + (U.uShadow.value > 0.002 ? 13 : 0);
    const lg = WX.dbg.mode === 'legacy' || WX.dbg.mode === 'full' || WX.dbg.mode === 'dbl';
    if (Math.abs(sig - WX.sig) > 0.01 || (lg ? (WX.frame - WX.sortF >= 8 && (now - WX.sortT > 1 || WX.sortP.distanceTo(c) > 0.05*D)) : (WX.frame - WX.sortF >= 3 && (now - WX.sortT > 0.5 || WX.sortP.distanceTo(c) > 0.004*D || WX.sortQ.angleTo(camera.quaternion) > 0.004)))){ WX.sortQ.copy(camera.quaternion); wxSortWrite(false); WX.sortF = WX.frame; WX.sortT = now; WX.sortP.copy(c); WX.sig = sig; }
  }
  // rain streaks near the ground
  if (RAIN.mesh){
    const sn = s.snow || 0, c = camera.position, alt = c.y - Math.max(0, hAt(c.x, -c.z)), near = 1 - wxSm(160, 650, alt), on = (s.rain + sn) > 0.003 && near > 0.01;
    RAIN.mesh.visible = on;
    if (on){
      const U = RAIN.mat.uniforms, ws = 1.2 + 5*s.wind*s.rain;
      camera.getWorldDirection(_wf); _wf.y = 0; if (_wf.lengthSq() > 1e-6) _wf.normalize();
      U.uCen.value.set(c.x + _wf.x*32, c.y + 4, c.z + _wf.z*32); U.uVel.value.set(0.92*ws, -9.5, 0.39*ws);
      U.uT.value = now % 1000; U.uRain.value = s.rain; U.uOp.value = (0.4 + 0.25*s.rain)*near; U.uView.value.copy(_wd);
      U.uCol.value.copy(WB.hs).multiplyScalar(0.62*WB.hI/0.78 + 0.1).lerp(scene.background, 0.3).lerp(_wg.setRGB(0.36, 0.38, 0.44), WB.nf*0.8); U.uCol.value.r = Math.min(1, U.uCol.value.r + 0.06*F); U.uCol.value.b = Math.min(1, U.uCol.value.b + 0.1*F);
      if (sn > s.rain){ const sw = 0.4 + 1.2*s.wind;      // [nyc] snowflakes: slow, drifting, wobbling, white dots
        U.uVel.value.set(0.92*sw, -1.15, 0.39*sw); U.uRain.value = sn; U.uWob.value = 0.55; U.uFade.value = 0.85; U.uLen.value = 0.06; U.uW.value = 0.05; U.uOp.value = (0.55 + 0.3*sn)*near;
        U.uCol.value.setRGB(0.93, 0.94, 0.97).multiplyScalar(0.55 + 0.45*(1 - WB.nf)).lerp(_wg.setRGB(1, 0.86, 0.66), 0.25*WB.nf); }
      else if (U.uWob.value){ U.uWob.value = 0; U.uFade.value = 0.2; U.uLen.value = 0.075; U.uW.value = 0.018; }
    }
  }
  // the bolt
  if (BOLT.mesh){
    const t = WX.hold ? 0.015 : now - FL.t0, on = FL.bolt && t < 0.5 && F > 0.02;
    BOLT.mesh.visible = on;
    if (on){ const U = BOLT.mat.uniforms; U.uI.value = Math.min(1.4, F*1.25); U.uView.value.copy(_wd); U.uFogN.value = scene.fog.near; U.uFogF.value = scene.fog.far; }
  }
  wxIcon();
}

/* ---------- UI: a weather button in the time bar with a small menu ---------- */
const WX_ICO = {
  sun:'<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.3M12 19.1v2.3M2.6 12h2.3M19.1 12h2.3M5.4 5.4 7 7M17 17l1.6 1.6M5.4 18.6 7 17M17 7l1.6-1.6"/>',
  moon:'<path d="M19.6 14.6A7.9 7.9 0 0 1 9.4 4.4a7.9 7.9 0 1 0 10.2 10.2z"/>',
  cloud:'<path d="M15.6 4.2a3.6 3.6 0 0 1 4 4.6M18.4 3l.5-1M21.4 6.1l1-.4"/><path d="M17 20H7.4a4.1 4.1 0 0 1-.5-8.17A5.6 5.6 0 0 1 17.6 10.5 4.75 4.75 0 0 1 17 20z"/>',
  haze:'<path d="M8.2 9.5a3.8 3.8 0 0 1 7.6 0"/><path d="M3 13h18M4.5 16.5h15M7 20h10"/><path d="M12 2.8v1.6M5.6 5.5l1.1 1.1M18.4 5.5l-1.1 1.1"/>',
  rain:'<path d="M16.8 14.6H7.6a3.7 3.7 0 0 1-.45-7.37A5.1 5.1 0 0 1 16.9 6a4.3 4.3 0 0 1-.1 8.6z"/><path d="M8.5 17.5 7.4 20.6M12.5 17.5l-1.1 3.1M16.5 17.5l-1.1 3.1"/>',
  storm:'<path d="M16.8 14.2H7.6a3.7 3.7 0 0 1-.45-7.37A5.1 5.1 0 0 1 16.9 5.6a4.3 4.3 0 0 1-.1 8.6z"/><path d="M12.6 12.4 10 17h3.6l-2.4 4.6"/>',
  auto:'<path d="M20.2 12a8.2 8.2 0 1 1-2.4-5.8"/><path d="M20.4 3.6v4.3h-4.3"/><circle cx="12" cy="12" r="2.6"/>',
  fog:'<path d="M16.8 11.6H7.6a3.7 3.7 0 0 1-.45-7.37A5.1 5.1 0 0 1 16.9 3a4.3 4.3 0 0 1-.1 8.6z"/><path d="M3.5 15h17M5.5 18.3h13M8 21.4h8"/>',
  snow:'<path d="M12 2.8v18.4M4 7.4l16 9.2M20 7.4 4 16.6"/><path d="M9.6 4.2 12 6l2.4-1.8M9.6 19.8 12 18l2.4 1.8M3.9 10.2l2.9.4.3-2.9M20.1 13.8l-2.9-.4-.3 2.9M20.1 10.2l-2.9.4-.3-2.9M3.9 13.8l2.9-.4.3 2.9"/>'
};
const WX_COL = {sun:'#c88a12', moon:'#5a6c96', cloud:'#5d6f7c', haze:'#9a8b6c', rain:'#3e6e92', storm:'#6c4fa3', auto:'#244d43', fog:'#6a7d8a', snow:'#5f86a8'};
const WX_NCOL = {sun:'#f1d78a', moon:'#c9d6f2', cloud:'#b9c8d2', haze:'#d8c9a6', rain:'#8fc0e6', storm:'#c3a8f0', auto:'#9fd3c3', fog:'#c8d4dc', snow:'#e2eef8'};
const wxSvg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${WX_ICO[k]}</svg>`;
function wxEffIco(){
  const s = wxS, nightNow = WB.nf > 0.5;
  if (WX.mode !== 'auto') return WX.mode === 'clear' ? (nightNow ? 'moon' : 'sun') : WX_MODES.find(m => m.id === WX.mode).ico;
  return s.bolt > 0.3 ? 'storm' : (s.snow || 0) > 0.25 ? 'snow' : s.rain > 0.25 ? 'rain' : (s.fog || 0) > 0.4 ? 'fog' : s.vis*s.milk > 0.45 ? 'haze' : s.cov > 0.32 ? 'cloud' : nightNow ? 'moon' : 'sun';
}
function wxIcon(){
  const el = document.getElementById('wxIco'); if (!el) return;
  const k = wxEffIco(); if (k === WX.eff) return; WX.eff = k;
  el.innerHTML = wxSvg(k); el.style.setProperty('--wxc', WX_COL[k]); el.style.setProperty('--wxn', WX_NCOL[k]);
}
function wxSyncUI(){
  const m = WX_MODES.find(q => q.id === WX.mode) || WX_MODES[1], b = document.getElementById('wxBtn'); if (!b) return;
  document.getElementById('wxZh').textContent = m.zh; document.getElementById('wxEn').textContent = m.en;
  b.title = `天气 ${m.zh} · Weather: ${m.long || m.en}`; b.setAttribute('aria-label', b.title);
  for (const x of document.querySelectorAll('#wxMenu [data-wx]')) x.setAttribute('aria-checked', String(x.dataset.wx === WX.mode));
  const note = document.getElementById('wxNote');
  if (note) note.textContent = WX.mode === 'auto' ? wxAutoNote() : {clear:'晴朗，与原来一样 · Clear sky, as before', cloudy:'晴间多云，积云飘移 · Scattered to broken cumulus drifting by',
    haze:'能见度低，远处城市隐入乳白雾霾 · Low visibility: the far city fades into milky haze', rain:'阵雨：天色灰暗，雨幕下垂 · Showers: grey sky, rain and rain shafts',
    storm:'雷暴：积雨云高耸，大雨与闪电 · Towering cumulonimbus, heavy rain and lightning', ...(wxNyc() ? {rain:'下雨：层云低垂，连绵细雨 · Steady rain under a low grey deck',
    fog:'雾：港口与河面灰白一片，高楼楼顶露出雾面 · Grey fog over the harbour and the rivers, the tower tops above it', snow:'下雪：雪花飘落，屋顶和公园积白 · Snowflakes drifting down, roofs and parks turning white'} : {})}[WX.mode];
  WX.eff = ''; wxIcon();
}
function wxSet(mode, instant){
  if (!wxModes().some(m => m.id === mode)) return false;
  WX.mode = mode; if (instant){ WX.instant = true; WX.last = 0; }
  try { localStorage.setItem(WX_KEY, mode); } catch (e){ /* storage may be blocked */ }
  wxSyncUI(); return true;
}
// the menu opens below the time bar on wide screens and above it on phones, flips if there is no room, and stays on screen
function wxPlace(m){
  const w = document.getElementById('wxWrap'), tb = document.getElementById('timebar'); if (!w || !tb) return;
  m.style.top = m.style.bottom = ''; m.style.setProperty('--wxdx', '0px');
  const wr = w.getBoundingClientRect(), tr = tb.getBoundingClientRect(), h = m.offsetHeight, gap = 8;
  const below = () => { m.style.top = (tr.bottom - wr.top + gap) + 'px'; m.style.bottom = 'auto'; };
  const above = () => { m.style.bottom = (wr.bottom - tr.top + gap) + 'px'; m.style.top = 'auto'; };
  const fitB = innerHeight - tr.bottom >= h + gap + 4, fitA = tr.top >= h + gap + 4;
  if (innerWidth <= 760) (fitA || !fitB ? above : below)(); else (fitB || !fitA ? below : above)();
  const r = m.getBoundingClientRect(); let dx = 0;
  if (r.left < 8) dx = 8 - r.left; else if (r.right > innerWidth - 8) dx = innerWidth - 8 - r.right;
  m.style.setProperty('--wxdx', Math.round(dx) + 'px');
}
function wxMenu(open, focus){
  const m = document.getElementById('wxMenu'), b = document.getElementById('wxBtn'); if (!m) return;
  m.hidden = !open; b.setAttribute('aria-expanded', String(!!open));
  const bar = document.getElementById('timebar'); if (bar) bar.style.zIndex = open ? '7' : '';   // above the dock while the menu is open
  if (!open) return;
  wxSyncUI(); wxPlace(m);
  const c = m.querySelector('[aria-checked="true"]'); if (c && focus) c.focus({preventScroll:true});
}
function wxUI(){
  const bar = document.getElementById('timebar'); if (!bar || document.getElementById('wxBtn')) return;
  const st = document.createElement('style');
  st.textContent = `
.wxwrap{position:relative;flex:none;display:flex}
.wxbtn{height:34px;display:flex;align-items:center;gap:6px;padding:0 10px 0 7px;border:1px solid var(--rule);background:var(--panel);border-radius:8px;cursor:pointer;color:var(--ink);white-space:nowrap}
.wxbtn:hover{background:var(--panel-2)}
.wxbtn[aria-expanded="true"]{background:var(--panel-2);border-color:var(--ink)}
.wxi{width:20px;height:20px;display:grid;place-items:center;color:var(--wxc,var(--muted))}
.wxi svg,.wxgrid svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;display:block}
.wxt{display:flex;flex-direction:column;align-items:flex-start;line-height:1.12}
.wxt b{font-size:12.5px;font-weight:500}
.wxt small{font:400 9.5px var(--font-mono);color:var(--muted)}
.wxmenu{position:absolute;top:calc(100% + 15px);left:50%;transform:translateX(calc(-50% + var(--wxdx, 0px)));width:258px;box-sizing:border-box;background:var(--panel);border:1px solid var(--rule);border-radius:10px;box-shadow:0 10px 32px rgba(27,30,28,.18);padding:10px 10px 11px;z-index:6;display:flex;flex-direction:column;gap:8px}
.wxhd{display:flex;align-items:baseline;gap:8px;padding:0 2px}
.wxhd b{font-size:13px;font-weight:500}
.wxhd small{font:400 10.5px var(--font-mono);color:var(--muted);letter-spacing:.07em;text-transform:uppercase}
.wxgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.wxgrid button{border:1px solid var(--rule);background:var(--panel);border-radius:7px;padding:7px 2px 6px;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;min-width:0;color:var(--ink)}
.wxgrid button:hover{background:var(--panel-2)}
.wxgrid button i{color:var(--wxc);display:grid;place-items:center}
.wxgrid button span{font-size:12px;line-height:1.15}
.wxgrid button small{font:400 9px var(--font-mono);color:var(--muted);white-space:nowrap}
.wxgrid button[aria-checked="true"]{border-color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink);background:var(--panel-2)}
.wxnote{margin:0;padding:0 2px;font-size:11px;line-height:1.45;color:var(--muted)}

body.night .wxbtn{background:#1f2a2f;border-color:#2d3b42;color:#eef2f3}
body.night .wxbtn:hover,body.night .wxbtn[aria-expanded="true"]{background:#2a373d;border-color:#46565e}
body.night .wxbtn .wxt small{color:#a9b5bb}
body.night .wxi{color:var(--wxn,#c9d6f2)}
body.night .wxmenu{background:#1f2a2f;border-color:#2d3b42;box-shadow:0 12px 34px rgba(8,12,16,.45)}
body.night .wxhd b,body.night .wxgrid button{color:#eef2f3}
body.night .wxhd small,body.night .wxgrid button small,body.night .wxnote{color:#a9b5bb}
body.night .wxgrid button{background:#24323a;border-color:#33434b}
body.night .wxgrid button:hover{background:#2c3b43}
body.night .wxgrid button i{color:var(--wxn)}
body.night .wxgrid button[aria-checked="true"]{background:#e9e6dc;border-color:#e9e6dc;box-shadow:none;color:#1b1e1c}
body.night .wxgrid button[aria-checked="true"] small{color:#686b65}
body.night .wxgrid button[aria-checked="true"] i{color:var(--wxc)}
@media (max-width:760px){
  .wxmenu{top:auto;bottom:calc(100% + 12px);left:auto;right:-4px;transform:translateX(var(--wxdx, 0px))}
  .wxbtn{padding:0 9px 0 6px;gap:5px}
  .wxt small{display:none}
  .wxmenu{padding:8px 8px 9px;gap:6px}
  .wxgrid button{padding:5px 2px 4px;gap:2px}
  .wxnote{font-size:10.5px;line-height:1.4}
}
@media (max-width:374px){ .wxt{display:none} .wxbtn{padding:0 7px} .timebar input[type=range]{min-width:80px} }`;
  document.head.appendChild(st);
  const w = document.createElement('div'); w.className = 'wxwrap'; w.id = 'wxWrap';
  w.innerHTML = `<button class="wxbtn" id="wxBtn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="wxMenu"><span class="wxi" id="wxIco"></span><span class="wxt"><b id="wxZh">晴</b><small id="wxEn">Clear</small></span></button>
<div class="wxmenu" id="wxMenu" role="menu" aria-label="天气 Weather" hidden><div class="wxhd"><b>天气</b><small>Weather</small></div><div class="wxgrid">${
  wxModes().map(m => `<button type="button" role="menuitemradio" aria-checked="false" data-wx="${m.id}" style="--wxc:${WX_COL[m.ico]};--wxn:${WX_NCOL[m.ico]}"><i>${wxSvg(m.ico)}</i><span>${m.zh}</span><small>${m.long || m.en}</small></button>`).join('')
}</div><p class="wxnote" id="wxNote"></p></div>`;
  const slider = document.getElementById('tSlider');
  if (slider && slider.parentNode === bar) slider.after(w); else bar.appendChild(w);
  document.getElementById('wxBtn').addEventListener('click', e => { e.stopPropagation(); wxMenu(document.getElementById('wxMenu').hidden, e.detail === 0); });
  document.getElementById('wxMenu').addEventListener('click', e => {
    const b = e.target.closest('[data-wx]'); if (!b) return;
    wxSet(b.dataset.wx, false); wxMenu(false);
    const m = WX_MODES.find(q => q.id === WX.mode);
    if (typeof showToast === 'function') showToast(`天气 ${m.zh} · Weather: ${m.long || m.en}`);
  });
  document.addEventListener('pointerdown', e => { const m = document.getElementById('wxMenu'); if (m && !m.hidden && !e.target.closest('#wxWrap')) wxMenu(false); }, true);
  addEventListener('resize', () => wxMenu(false));
  document.addEventListener('keydown', e => { const m = document.getElementById('wxMenu'); if (e.key === 'Escape' && m && !m.hidden){ wxMenu(false); document.getElementById('wxBtn').focus(); } });
  wxSyncUI();
}

/* ---------- hooks ---------- */
HOOKS.time.push((t, nf) => {
  if (WX.tod !== null){ if (WX.tod > 18 && t < 6) WX.day++; else if (WX.tod < 6 && t > 18) WX.day--; }    // the Auto plan changes every simulated day
  WX.tod = t;
  wxSnap(nf);
  if (WX.applied) wxEnv();
});
HOOKS.boot.push(() => {
  let m = null; try { m = localStorage.getItem(WX_KEY); } catch (e){ m = null; }
  if (wxNyc()){ const r = WX_MODES.find(q => q.id === 'rain'); if (r){ r.zh = '雨'; r.en = 'Rain'; } }      // [nyc] steady rain, not tropical showers
  WX.mode = wxModes().some(q => q.id === m) ? m : WX_DEFAULT;
  WX.day = Math.floor(Date.now()/864e5) % 1000; WX.instant = true;
  wxUI();
});
HOOKS.frame.push(() => { const t0 = performance.now(); wxFrame(); WX.ms = WX.ms*0.95 + (performance.now() - t0)*0.05; });
window.SGWx = {
  get wet(){ return WX.wet; },                     // [v33] 0..1 how wet the ground is (rain; dries slowly afterwards)
  dbg:WX.dbg,
  set:(m, instant) => wxSet(m, instant !== false),
  get mode(){ return WX.mode; },
  get state(){ const o = {}; for (const p of WX_PAR) o[p] = +wxS[p].toFixed(3); return o; },
  get day(){ return WX.day; }, set day(v){ WX.day = v|0; wxSyncUI(); },
  set hold(v){ WX.hold = !!v; }, get hold(){ return WX.hold; }, set quiet(v){ WX.quiet = !!v; },
  strike:(dx, dz) => { wxStrike(performance.now()/1000, true, dx !== undefined ? [dx, dz || 0] : null); return [FL.x, FL.y, FL.z].map(Math.round); },
  stats:() => ({ms:+WX.ms.toFixed(3), puffs:CL.puffs || 0, clouds:CL.n, rain:RN, cloudsOn:!!(CL.mesh && CL.mesh.visible), rainOn:!!(RAIN.mesh && RAIN.mesh.visible), boltOn:!!(BOLT.mesh && BOLT.mesh.visible), fog:[Math.round(scene.fog.near), Math.round(scene.fog.far)]}),
  menu:o => wxMenu(o),
  get nyc(){ return wxNyc(); }, get plan(){ return wxNyc() ? Object.assign({note:wxAutoNoteNy()}, wxPlanNy()) : null; },
  bench:() => { const t0 = performance.now(); for (let i = 0; i < 20; i++) wxSortWrite(false); const t1 = performance.now(); for (let i = 0; i < 20; i++) wxSunShade(); const t2 = performance.now(); for (let i = 0; i < 20; i++) wxEnv(); const t3 = performance.now();
    return {sort:(t1 - t0)/20, shade:(t2 - t1)/20, env:(t3 - t2)/20, drawn:CL.geo ? CL.geo.drawRange.count/6 : 0}; }
};
}
