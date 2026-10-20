/* ================= v22 add-on: weather — clouds, haze, showers, thunderstorms, and the Bay Area's marine layer (bay/fog) =================
   Same module as lm20/wx (Singapore behaves exactly as before: the Bay parts switch on only when SGR_BAY is defined); in the San
   Francisco Bay Area build it adds:
   - 雾 Fog · "Karl the Fog": the marine stratus deck over the Pacific (top ~215 m along the coast rising to ~550 m far out, +-40 m
     breathing) that pours through the Golden Gate under the bridge deck (top ~50 m in the strait, the deck and towers stand clear),
     covers the Sunset and the Richmond (top ~180-230 m), banks up against Twin Peaks / Sutro and the coastal hills and spills over
     their saddles like waterfalls (draped down the lee slopes, evaporating), and thins out across the bay towards the East Bay
     (patchy, top ~25-50 m). One draped, shader-lit sheet (1 draw call, ~90 k quads on a 150 m grid + a coarse deck over the ocean to
     the horizon), renderOrder 6.5, whose resting place is computed once per session from the real terrain (mfFieldGen: a max-level
     priority flood from the ocean + a Dijkstra path distance from the coast with the "first arrival" level along it; time-sliced over
     frames, ~1-3 s of work) — the weather's "reach" (km of that path) says how far it has come in. A flow map drifts its billows
     inland, down the lee slopes and through the strait; the top breathes; the front is lobed and thin fog breaks up into cells.
     Inside it (camera below the top) the scene fog closes in to ~260-680 m of grey, the light turns diffuse, the sky dome and the sun
     fade (the light module reads SGWx.state.ovc; the fog colour is finished here in a prerender hook after the light module's), at
     night it glows murky orange with the city's light, and street-lamp / neon glows fade with distance instead of piercing it.
   - 自动 Auto follows the Bay's climate for the light module's date (SGLight.date; one plan per day): June-September mostly fog days —
     in overnight, burnt back to the coast by ~10:20-11:40 (on "heavy" days it keeps the Sunset and the Gate grey all day), sunny inland
     afternoons with the bank waiting offshore, back in through the Gate from ~16:40-18:30; May/October some; winter: rain days from
     Pacific fronts (no thunder; ~7% of them a storm), cloudy or crisp clear days with some morning mist by the bay; haze 2-5% of days.
   Modes: 自动 Auto (in Singapore a tropical day: clear mornings, cumulus by noon, maybe an afternoon storm, clear nights; one random plan per
   simulated day) · 晴 Clear · 多云 Cloudy · 雾霾 Haze · 阵雨 Rain · 雷暴 Storm (· 雾 Fog in the Bay build). Default Clear (WX_DEFAULT);
   the choice is kept in localStorage. Changes ease in over ~5 s (wall clock, so slow frames don't stretch them).
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
   Test handle: window.SGWx {set(mode, instant = true), mode, state, day, quiet, hold, strike(dx, dz), stats(), bench(), menu(open),
   bay (true in the Bay build), plan (today's Auto plan + note), pin (re-roll the plans), autoAt(hour) (Auto's targets),
   marine {info(), at(lat, lon), build() (synchronously), ready, field}}. */
{
const WX_KEY = 'cityBrush.weather', WX_DEFAULT = 'clear';
const WX_MODES = [
  {id:'auto',   zh:'自动', en:'Auto',   ico:'auto'},
  {id:'clear',  zh:'晴',   en:'Clear',  ico:'sun'},
  {id:'cloudy', zh:'多云', en:'Cloudy', ico:'cloud'},
  {id:'haze',   zh:'雾霾', en:'Haze',   ico:'haze'},
  {id:'rain',   zh:'阵雨', en:'Rain',   ico:'rain'},
  {id:'storm',  zh:'雷暴', en:'Storm',  ico:'storm', long:'Thunderstorm'},
  {id:'fog',    zh:'雾',   en:'Fog',    ico:'fog',   long:'Karl the Fog', bay:true}
];
// the San Francisco Bay Area build (SGR_BAY is a top-level const declared after the modules: only look once the page is running)
let WX_BAY = null;
function wxBay(){ if (WX_BAY === null){ try { WX_BAY = typeof SGR_BAY !== 'undefined' && !!SGR_BAY; } catch (e){ return false; } } return WX_BAY; }
const wxBayMap = () => wxBay() && SGR.on;
// cov: cumulus coverage · dark: cloud darkness · tow: towering growth · cb: active storm cells · deck: overcast layer
// rain: rain intensity · bolt: lightning rate · vis: low visibility · milk: milky haze tint · ovc: grey sky · blue: fair-weather blue · wind
// mar: the marine layer (Bay map) · reach: how far it has come in from the open ocean (km of path; < 0: a bank offshore) · lvl: its top raised/lowered (m)
const WX_PAR = ['cov', 'dark', 'tow', 'cb', 'deck', 'rain', 'bolt', 'vis', 'milk', 'ovc', 'blue', 'wind', 'mar', 'reach', 'lvl'];
const WX_M0 = {mar:0, reach:-4, lvl:-40};
const WX_TGT = {
  clear:  {cov:0,    dark:0,    tow:0,    cb:0,    deck:0,    rain:0,    bolt:0, vis:0,    milk:0,    ovc:0,    blue:0,    wind:0.4},
  cloudy: {cov:0.72, dark:0.08, tow:0.2,  cb:0,    deck:0,    rain:0,    bolt:0, vis:0.1,  milk:0,    ovc:0.16, blue:0.6,  wind:0.55},
  haze:   {cov:0.12, dark:0,    tow:0,    cb:0,    deck:0.12, rain:0,    bolt:0, vis:1,    milk:1,    ovc:0.12, blue:0,    wind:0.15},
  rain:   {cov:0.86, dark:0.6,  tow:0.42, cb:0.14, deck:0.5,  rain:0.55, bolt:0, vis:0.55, milk:0.12, ovc:0.74, blue:0,    wind:0.7},
  storm:  {cov:0.95, dark:1,    tow:1,    cb:0.42, deck:0.75, rain:1,    bolt:1, vis:0.74, milk:0,    ovc:1,    blue:0,    wind:1},
  // Karl the Fog: clear sky above the deck; the deck has poured through the Gate, covers the west of the city and thins across the bay
  fog:    {cov:0,    dark:0,    tow:0,    cb:0,    deck:0,    rain:0,    bolt:0, vis:0,    milk:0,    ovc:0,    blue:0,    wind:0.5, mar:1, reach:12.5, lvl:0},
  // the same button away from the Bay map (generated islands): a plain grey ground mist
  mist:   {cov:0.1,  dark:0,    tow:0,    cb:0,    deck:0.2,  rain:0,    bolt:0, vis:0.9,  milk:0.85, ovc:0.4, blue:0,    wind:0.2}
};
for (const k in WX_TGT) for (const p in WX_M0) if (!(p in WX_TGT[k])) WX_TGT[k][p] = WX_M0[p];
const wxS = {}, wxT = {};
for (const p of WX_PAR){ wxS[p] = WX_M0[p] || 0; wxT[p] = wxS[p]; }
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
function wxAutoNote(){
  if (wxBay()) return wxBayNote();
  const P = wxPlan(WX.day), hm = h => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1)*60/10)*10).padStart(2, '0')}`;
  return P.stormy ? `今天 ${hm(P.st)} 前后可能有雷阵雨，入夜转晴 · Thunderstorm likely around ${hm(P.st)}, clearing at night` :
    `今天晴间多云，午后积云发展 · Fair, cumulus building by midday`;
}

/* ---------- Auto in the Bay Area: its climate for the light module's date (one plan per day) ----------
   Summer and autumn: the marine layer most days — in overnight, burnt back to the coast by late morning (on "heavy" days it keeps the
   Sunset and the Gate grey), sunny inland afternoons with the bank waiting offshore, back through the Golden Gate in the evening.
   Winter: rain days from Pacific fronts (no thunder, rarely a storm), crisp clear or cloudy days, some morning mist. Haze is rare. */
const WX_CLIM = {   // by month: chance of a fog day, a rain day, a cloudy day, a hazy day
  fog:   [0.05, 0.06, 0.08, 0.18, 0.45, 0.70, 0.80, 0.80, 0.65, 0.40, 0.15, 0.06],
  rain:  [0.33, 0.33, 0.27, 0.13, 0.05, 0.02, 0.00, 0.00, 0.02, 0.07, 0.20, 0.30],
  cloud: [0.20, 0.18, 0.18, 0.15, 0.10, 0.05, 0.03, 0.03, 0.04, 0.08, 0.15, 0.20],
  haze:  [0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.03, 0.05, 0.05, 0.04, 0.02]
};
function wxYmd(off){
  let q = null; try { if (window.SGLight && window.SGLight.enabled !== false) q = String(window.SGLight.date).split('-').map(Number); } catch (e){ q = null; }
  if (!q || q.length !== 3 || !q.every(Number.isFinite)){ const n = new Date(); q = [n.getFullYear(), n.getMonth() + 1, n.getDate() + (WX.day - WX.day0)]; }
  const d = new Date(q[0], q[1] - 1, q[2] + (off || 0));
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()];
}
function wxBayPlan(off){
  const ymd = wxYmd(off), key = ymd.join('-') + '/' + (WX.pin || 0);
  WX.bpc = WX.bpc || new Map(); if (WX.bpc.has(key)) return WX.bpc.get(key);
  const r = mulberry32(ymd[0]*1031 + ymd[1]*67 + ymd[2]*7 + (WX.pin || 0)*7919 + 271), mo = ymd[1] - 1;
  const C = WX_CLIM, u = r(), pr = C.rain[mo], pf = C.fog[mo], ph = C.haze[mo], pc = C.cloud[mo];
  const type = u < pr ? 'rain' : u < pr + pf ? 'fog' : u < pr + pf + ph ? 'haze' : u < pr + pf + ph + pc ? 'cloudy' : 'clear';
  const summer = mo >= 4 && mo <= 9, winter = mo >= 10 || mo <= 2;
  const p = {key, ymd, type, summer, winter,
    heavy:r() < (mo >= 5 && mo <= 7 ? 0.35 : 0.15),       // the fog keeps the coast grey all day
    off:10.3 + 1.3*r(),                                   // burnt back to the coast by
    back:16.7 + 1.8*r(),                                  // starts rolling in again
    deep:0.85 + 0.35*r(),                                 // how far in it gets overnight
    st:3 + 13*r(), len:4 + 8*r(), pk:0.55 + 0.4*r(), storm:r() < 0.07,
    cum:0.15 + 0.35*r(), mist:winter && r() < 0.22, sea:r()};
  if (type === 'fog' && !summer) p.heavy = false;
  WX.bpc.set(key, p); if (WX.bpc.size > 40) WX.bpc.delete(WX.bpc.keys().next().value);
  return p;
}
const wxHM = h => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1)*60/10)*10).padStart(2, '0')}`;
function wxBayNote(){
  const P = wxBayPlan(0), Y = wxBayPlan(-1), mf = Y.type === 'fog' && !(P.type === 'rain' && P.st < 10), am = mf ? '早晨有雾，' : '', amE = mf ? 'Foggy morning; ' : '';
  if (P.type === 'fog') return P.heavy ? `${am}卡尔雾整天守在海边，日落区和金门海峡阴凉，内陆晴热；${wxHM(P.back)} 后雾又涌进来 · ${amE}Karl the Fog hugs the coast all day (the Sunset and the Gate stay grey, sunny inland); rolling in again after ${wxHM(P.back)}` :
    `${am}约 ${wxHM(P.off)} 雾退到海上，午后晴朗；${wxHM(P.back)} 前后卡尔雾从金门海峡卷回来 · ${amE}burning back to the coast by ~${wxHM(P.off)}, sunny afternoon; Karl the Fog rolls back in through the Golden Gate around ${wxHM(P.back)}`;
  if (P.type === 'rain') return `${am}冬季锋面雨：${wxHM(P.st)} 前后开始，约 ${Math.round(P.len)} 小时${P.storm ? '，偶有雷声' : '，无雷暴'} · ${amE}Pacific front: rain from about ${wxHM(P.st)} for ~${Math.round(P.len)} h${P.storm ? ', a little thunder' : ', no thunderstorms'}`;
  if (P.type === 'haze') return `少见的雾霾天（山火烟雾飘来）· A rare hazy day (wildfire smoke drifting in)`;
  if (P.type === 'cloudy') return `${am}多云，层积云灰白 · ${amE}cloudy, grey stratocumulus`;
  return P.summer ? `${am}晴朗，内陆午后炎热 · ${amE}clear and sunny, a hot inland afternoon` : `${am}晴朗清爽${P.mist ? '，清晨湾边薄雾' : ''} · ${amE}clear and crisp${P.mist ? ', early mist by the bay' : ''}`;
}
// the marine layer through a fog day: [reach km, level m] at time t (the morning part belongs to the fog that came in the night before)
function wxFogDay(P, t, morning){
  const nR = 14*P.deep, lo = P.heavy ? 4.5 : -1.8;
  if (morning){   // 0 .. 14: the night's fog burning back
    const k = wxSm(8.2, P.off, t);
    return [nR + (lo - nR)*k, 10 - 55*k];
  }
  const k1 = wxSm(P.back, P.back + 2.4, t), k2 = wxSm(P.back + 1.8, P.back + 5.2, t);
  return [lo + (7 - lo)*k1 + (nR - 7)*k2, -45 + 40*k1 + 15*k2];
}
function wxAutoBay(t, now){
  const P = wxBayPlan(0), Y = wxBayPlan(-1), o = Object.assign({}, WX_TGT.clear), bump = (a, b, c, d) => wxSm(a, b, t)*(1 - wxSm(c, d, t));
  // the marine layer: the evening's fog stays overnight; on a fog day it waits offshore all afternoon and comes back in the evening
  let mar = 0, reach = -4, lvl = -40;
  const mornFog = Y.type === 'fog' && !(P.type === 'rain' && P.st < 10), fogDay = P.type === 'fog';   // a front arriving early sweeps it away
  if (mornFog && t < 14){                                   // last night's fog burning back to the coast
    [reach, lvl] = wxFogDay({deep:Y.deep, heavy:fogDay && P.heavy, off:P.off}, t, true);
    mar = fogDay ? 1 : 1 - wxSm(P.off + 0.4, 13.5, t);       // a fog day keeps its bank offshore, otherwise it dissolves
  }
  if (fogDay){
    if (!mornFog && t < 12){ mar = wxSm(5, 9, t); reach = -2.5; lvl = -40; }   // first day of a spell: the bank gathers offshore
    if (t >= 12){ [reach, lvl] = wxFogDay(P, t, false); mar = 1; }
  }
  o.mar = mar; o.reach = reach; o.lvl = lvl;
  if (P.type === 'rain'){
    const s = bump(P.st - 0.6, P.st + 0.5, P.st + P.len - 0.4, P.st + P.len + 0.8)*P.pk, pre = bump(P.st - 3, P.st - 0.3, P.st + P.len, P.st + P.len + 2.5);
    const after = bump(P.st + P.len - 0.5, P.st + P.len + 0.5, P.st + P.len + 3, P.st + P.len + 6);
    Object.assign(o, {cov:Math.max(0.75*pre, 0.95*s, 0.5*after), dark:Math.max(0.15*pre, 0.75*s), tow:0.12 + 0.2*after, cb:P.storm ? 0.3*s : 0, deck:Math.max(0.45*pre, 0.85*s),
      rain:wxSm(0.2, 0.7, s)*(0.55 + 0.45*P.pk), bolt:P.storm ? wxSm(0.5, 0.9, s) : 0, vis:Math.max(0.1*pre, 0.55*s), milk:0.12*s, ovc:Math.max(0.5*pre, s), blue:0.4*after*(1 - s), wind:0.45 + 0.5*s});
  } else if (P.type === 'cloudy'){
    const c = 0.55 + 0.2*P.sea + 0.06*(wxVN(now/90) - 0.5);
    Object.assign(o, {cov:c, dark:0.12, tow:0.1, deck:0.25, vis:0.12, ovc:0.32, blue:0.35, wind:0.5});
  } else if (P.type === 'haze'){
    Object.assign(o, {cov:0.08, deck:0.1, vis:0.8 - 0.25*bump(11, 13, 17, 19), milk:1, ovc:0.12, wind:0.15});
  } else {
    // fair: cumulus over the hills on spring and winter afternoons; fog days stay blue above the deck
    const cu = fogDay ? 0 : (P.summer ? 0.08 : P.cum)*bump(11, 13.5, 16.5, 19) + 0.04*(wxVN(now/75) - 0.5);
    Object.assign(o, {cov:Math.max(0, cu), tow:0.25*cu, blue:0.6*wxSm(0.1, 0.35, cu), ovc:0.12*cu, vis:0.06*cu, wind:fogDay ? 0.55 : 0.4});
  }
  // winter mornings: a little mist by the bay shore
  if (P.mist && P.type !== 'rain'){ const m = 0.55*bump(4.5, 6.5, 8.6, 10.4); o.vis = Math.max(o.vis, m); o.milk = Math.max(o.milk, m > 0.05 ? 1 : 0); }
  return o;
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
  if (F > 0.001){ sky.r = Math.min(1, sky.r + 0.16*F); sky.g = Math.min(1, sky.g + 0.18*F); sky.b = Math.min(1, sky.b + 0.25*F); }
  const fi = MF.in;                                                                                     // inside the marine layer: all grey
  if (fi > 0.001) sky.lerp(mfGrey(MF.gc), fi); else mfGrey(MF.gc);
  scene.background.copy(sky); scene.fog.color.copy(sky);
  // light: weaker, greyer sun; a little more (and greyer) sky light, less of everything in a storm
  sun.intensity = WX.sunI = WB.sI*(1 - 0.3*s.ovc)*(1 - 0.8*s.dark)*(1 - 0.42*mk)*(1 - 0.1*s.cov*(1 - s.dark))*(1 - 0.84*fi);   // the fog: diffuse light, no shadows to speak of
  _wg.setScalar(wxLum(WB.sun)); sun.color.copy(WB.sun).lerp(_wg, Math.min(1, 0.75*s.ovc + 0.8*fi)); if (mk > 0.001) sun.color.multiply(_wh.setRGB(1, 1 - 0.1*mk, 1 - 0.28*mk));
  hemi.intensity = WB.hI*(1 + 0.16*s.ovc + 0.12*mk - 0.34*s.dark*s.dark + 0.3*fi) + 0.5*F;
  const mx = Math.max(sky.r, sky.g, sky.b, 0.05); _wg.setRGB(sky.r/mx, sky.g/mx, sky.b/mx);
  hemi.color.copy(WB.hs).lerp(_wg, Math.min(1, 0.55*s.ovc + 0.5*mk + 0.85*fi)); hemi.groundColor.copy(WB.hg).multiplyScalar(1 - 0.18*s.dark);
  if (F > 0.001) hemi.color.lerp(_wg.setRGB(0.78, 0.84, 1), Math.min(0.8, F));
  // sea: greyer and darker under rain clouds, milky in haze
  _wg.setScalar(wxLum(WB.sea)).multiply(_wh.setRGB(0.92, 0.97, 1));
  sea.material.color.copy(WB.sea).lerp(_wg, Math.min(1, 0.4*s.ovc + 0.6*fi)).lerp(sky, 0.3*mk);
  stars.material.opacity = WB.star*(1 - wxSm(0.05, 0.55, s.cov + s.deck))*(1 - 0.85*s.vis)*(1 - fi);
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
    const k = wxK(), v = wxS.vis*(wxS.milk + (1 - wxS.milk)*(1 - 0.75*wxSm(1200*k, 9000*k, alt || 0))), ln = Math.min(FG.bn, 60*k + 0.3*D), lf = Math.min(FG.bf, 2600*k + 1.6*D);
    n = Math.exp(Math.log(FG.bn)*(1 - v) + Math.log(ln)*v); fr = Math.max(n + 200, Math.exp(Math.log(FG.bf)*(1 - v) + Math.log(lf)*v));
  }
  if (MF.in > 0.0005){ const v = MF.in; n = Math.exp(Math.log(Math.max(1, n))*(1 - v) + Math.log(4)*v); fr = Math.max(n + 60, Math.exp(Math.log(fr)*(1 - v) + Math.log(MF.vis)*v)); }
  f.near = FG.sn = n; f.far = FG.sf = fr;
}

/* ---------- Karl the Fog: the marine layer over the Bay map ---------- */
/*FIELD-BEGIN*/
// Where the layer rests, on a G-metre grid (once per session, time-sliced: a generator that yields every few thousand cells):
//  1. the open Pacific: water reached from the map's west edge without entering the Golden Gate (blocked east of its mouth);
//  2. a cap on the layer's top: ~250 m along the coast rising to ~520 m far offshore; poured into the strait it drops to ~70 m at the
//     bridge (the sea breeze squeezes it through) and ~45 m across the bay; ~190 m over land (lower on the headlands by the Gate) plus
//     orographic lift over high ground (it banks up against Twin Peaks, Sutro, San Bruno Mountain and the Santa Cruz Mountains);
//  3. a priority flood from the ocean keeping the highest level each cell can get: the layer creeps inland losing a little height
//     (more over warm land), rises against windward slopes up to the cap, cannot pass ridges above its top, and where a thin layer
//     spills over a crest it follows the lee slope down and evaporates (the "waterfalls" over Twin Peaks and the coastal hills);
//  4. the path distance from the coast (Dijkstra over the fogged cells, land costs more) sets how far the fog has come at a given time
//     (the weather's "reach"), how it thins out across the bay, and the direction it flows (down that distance).
function* mfFieldGen(o){
  const G = o.G, X0 = o.X0, Y0 = o.Y0, nx = o.nx, ny = o.ny, M = nx*ny, sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a)/(b - a))); return t*t*(3 - 2*t); };
  const oceanLvl = x => 215 + 330*sm(-29000, -70000, x);
  const g = new Float32Array(M), wat = new Uint8Array(M), ocean = new Uint8Array(M), urb = new Float32Array(M);
  const NI = [1, -1, 0, 0, 1, 1, -1, -1], NJ = [0, 0, 1, -1, 1, -1, 1, -1], NW = [1, 1, 1, 1, 1.4142, 1.4142, 1.4142, 1.4142];
  for (let j = 0; j < ny; j++){
    for (let i = 0; i < nx; i++){
      const x = X0 + i*G, y = Y0 + j*G, k = j*nx + i;
      let h = o.hAt(x, y); wat[k] = h < -0.05 ? 1 : 0;
      const q = G*0.3; h = Math.max(h, o.hAt(x + q, y), o.hAt(x - q, y), o.hAt(x, y + q), o.hAt(x, y - q));   // a crest between nodes still stops it
      g[k] = Math.max(0, h);
      if (o.lu){ let u = 0; for (let b = 0; b < 4; b++){ const v = o.lu(x + ((b & 1) - 0.5)*G*0.5, y + ((b >> 1) - 0.5)*G*0.5); if (v === 1 || v === 2 || v === 3 || v === 6 || v === 7) u += 0.25; } urb[k] = u; }
    }
    if ((j & 15) === 15) yield;
  }
  // 1. the open ocean
  const gateBlock = (x, y) => x > -29800 && y > 17800;
  { const st = new Int32Array(M); let sp = 0;
    for (let j = 0; j < ny; j++){ const k = j*nx; if (wat[k]){ ocean[k] = 1; st[sp++] = k; } }
    while (sp){ const k = st[--sp], i = k % nx, j = (k - i)/nx;
      for (let d = 0; d < 4; d++){ const ii = i + NI[d], jj = j + NJ[d]; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
        const n = jj*nx + ii; if (ocean[n] || !wat[n] || gateBlock(X0 + ii*G, Y0 + jj*G)) continue; ocean[n] = 1; st[sp++] = n; } } }
  // the bay: water reached from the Golden Gate (lakes and reservoirs inland are treated like the land around them)
  const bay = new Uint8Array(M);
  { const st = new Int32Array(M); let sp = 0;
    for (let k = 0; k < M; k++){ const x = X0 + (k % nx)*G, y = Y0 + Math.floor(k/nx)*G; if (wat[k] && !ocean[k] && x > -29800 && x < -25000 && y > 19000 && y < 23000){ bay[k] = 1; st[sp++] = k; } }
    while (sp){ const k = st[--sp], i = k % nx, j = (k - i)/nx;
      for (let d = 0; d < 4; d++){ const ii = i + NI[d], jj = j + NJ[d]; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
        const n = jj*nx + ii; if (bay[n] || !wat[n] || ocean[n]) continue; bay[n] = 1; st[sp++] = n; } } }
  yield;
  // separable box blur, twice (~ gaussian)
  const blur = (a, r) => { const t = new Float32Array(M), b = new Float32Array(a);
    for (let pass = 0; pass < 2; pass++){
      for (let j = 0; j < ny; j++){ let s = 0, c = 0; const row = j*nx; for (let i = -r; i < nx; i++){ if (i + r < nx){ s += b[row + i + r]; c++; } if (i - r - 1 >= 0){ s -= b[row + i - r - 1]; c--; } if (i >= 0) t[row + i] = s/c; } }
      for (let i = 0; i < nx; i++){ let s = 0, c = 0; for (let j = -r; j < ny; j++){ if (j + r < ny){ s += t[(j + r)*nx + i]; c++; } if (j - r - 1 >= 0){ s -= t[(j - r - 1)*nx + i]; c--; } if (j >= 0) b[j*nx + i] = s/c; } }
    }
    return b; };
  // 2. the cap
  const gs = blur(g, Math.round(600/G)); yield;
  const base = new Float32Array(M), lift = new Float32Array(M), wf = new Float32Array(M), lf = new Float32Array(M);
  for (let k = 0; k < M; k++){
    const x = X0 + (k % nx)*G, y = Y0 + Math.floor(k/nx)*G;
    if (ocean[k]) base[k] = oceanLvl(x);
    else if (bay[k]) base[k] = o.gate - 25*sm(-24000, -10000, x) + (oceanLvl(x) - o.gate)*(1 - sm(-30500, -26500, x));
    const gate = Math.exp(-((x + 25800)*(x + 25800) + (y - 20300)*(y - 20300))/(2*3000*3000));   // the headlands either side of the strait
    if (!ocean[k] && !bay[k]) base[k] = o.land - 120*gate;
    wf[k] = bay[k] || ocean[k] ? 1 : 0; lf[k] = ocean[k] || bay[k] ? 0 : 1;
    lift[k] = ocean[k] || bay[k] ? 0 : o.lift*gs[k]*(1 - 0.7*gate);
  }
  // each surface smoothed on its own (the strait's low level must not climb the headlands, nor they bleed onto the water)
  const r3 = Math.round(300/G), r6 = Math.round(600/G), bw = blur(base.map((v, k) => v*wf[k]), r6); yield;   // the ocean deck slopes down into the strait
  const ww = blur(wf, r6); yield;
  const bl = blur(base.map((v, k) => v*lf[k]), r3); yield;
  const wl = blur(lf, r3); yield;
  const lB = blur(lift, Math.round(150/G)), C = new Float32Array(M); yield;
  for (let k = 0; k < M; k++) C[k] = ocean[k] ? base[k] : bay[k] ? bw[k]/Math.max(1e-3, ww[k]) : bl[k]/Math.max(1e-3, wl[k]) + lB[k];
  yield;
  // 3. the fully developed layer: a max-level priority flood from the ocean (label-correcting, the level can rise against slopes) —
  // each cell gets the highest level any route can bring: it creeps inland losing a little height, rises against windward slopes up
  // to the cap, cannot pass ridges above its top; a thin spill down a lee slope loses height with the ground
  const F = new Float32Array(M).fill(-1e4); let cap = M*2, hk = new Int32Array(cap), hv = new Float32Array(cap), hn = 0;
  const push = (k, v) => { if (hn >= cap){ cap *= 2; const a = new Int32Array(cap), b = new Float32Array(cap); a.set(hk); b.set(hv); hk = a; hv = b; }
    let c = hn++; hk[c] = k; hv[c] = v; while (c > 0){ const p = (c - 1) >> 1; if (hv[p] >= hv[c]) break; const tk = hk[p], tv = hv[p]; hk[p] = hk[c]; hv[p] = hv[c]; hk[c] = tk; hv[c] = tv; c = p; } };
  const pop = () => { const k = hk[0]; hn--; if (hn){ hk[0] = hk[hn]; hv[0] = hv[hn]; let c = 0; for (;;){ const a = 2*c + 1, b = a + 1; let m = c; if (a < hn && hv[a] > hv[m]) m = a; if (b < hn && hv[b] > hv[m]) m = b; if (m === c) break; const tk = hk[m], tv = hv[m]; hk[m] = hk[c]; hv[m] = hv[c]; hk[c] = tk; hv[c] = tv; c = m; } } return k; };
  for (let k = 0; k < M; k++) if (ocean[k]){ F[k] = C[k]; push(k, F[k]); }
  let ops = 0;
  while (hn){
    const v = hv[0], c = pop(); if (v < F[c] - 1e-3) continue;
    const i = c % nx, j = (c - i)/nx, th = F[c] - g[c], al = o.lee*(1 - sm(60, 200, th));
    for (let d = 0; d < 8; d++){
      const ii = i + NI[d], jj = j + NJ[d]; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
      const n = jj*nx + ii; if (ocean[n]) continue;
      let cand = Math.min(C[n], F[c] - (wat[n] ? o.decW : o.decL)*NW[d]*G/1000 + o.rise*Math.max(0, g[n] - g[c]));   // banks up against rising ground
      if (g[n] < g[c]) cand -= al*(g[c] - g[n]);
      if (cand <= g[n] + 2) continue;
      if (cand > F[n] + 0.01){ F[n] = cand; push(n, cand); }
    }
    if ((++ops & 8191) === 0) yield;
  }
  const pops = ops;
  // a light smoothing of the level among fogged cells (no cell-sized steps)
  { const F2 = new Float32Array(F);
    for (let j = 1; j < ny - 1; j++){ for (let i = 1; i < nx - 1; i++){ const k = j*nx + i; if (F[k] <= g[k] + 2) continue; let s = F[k]*2, w = 2;
      for (let d = 0; d < 8; d++){ const n = k + NJ[d]*nx + NI[d]; if (F[n] > g[n] + 2){ const q = d < 4 ? 1 : 0.7; s += F[n]*q; w += q; } } F2[k] = Math.max(g[k] + 3, s/w); }
      if ((j & 63) === 63) yield; }
    F.set(F2); }
  yield;
  // 4. path distance from the coast (km; land costs more; offshore: minus the distance to the coast), and along it the level of the
  // advancing front ("first arrival"): a shallow layer pouring over a crest drapes down the lee slope and evaporates as it descends
  // (the waterfalls over the saddles of Twin Peaks and the coastal hills); once the fog keeps coming the basin fills to F (the shader
  // blends from Ff to F as the reach passes a cell by a few km)
  const D = new Float32Array(M).fill(1e4), Ff = new Float32Array(F), od = new Float32Array(M).fill(1e9), crest = new Float32Array(M), crTh = new Float32Array(M);
  const pushMin = (k, v) => push(k, -v);
  hn = 0;
  for (let k = 0; k < M; k++){ if (!ocean[k]) continue; crTh[k] = F[k]; const i = k % nx, j = (k - i)/nx;
    for (let d = 0; d < 8; d++){ const ii = i + NI[d], jj = j + NJ[d]; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue; if (!ocean[jj*nx + ii]){ od[k] = 0; pushMin(k, 0); break; } } }
  for (let pass = 0; pass < 2; pass++){                 // chamfer distance over the ocean
    const fw = pass === 0;
    for (let jq = 0; jq < ny; jq++){ const j = fw ? jq : ny - 1 - jq; for (let iq = 0; iq < nx; iq++){ const i = fw ? iq : nx - 1 - iq, k = j*nx + i; if (!ocean[k]) continue;
      for (let d = 0; d < 8; d++){ const ii = i + NI[d], jj = j + NJ[d]; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue; const n = jj*nx + ii; if (!ocean[n]) continue; const w = od[n] + NW[d]*G; if (w < od[k]) od[k] = w; } }
      if ((jq & 63) === 63) yield; }
  }
  for (let k = 0; k < M; k++) if (ocean[k]) D[k] = od[k] > 0 ? -Math.min(od[k], 4e5)/1000 : 0;
  while (hn){
    const v = -hv[0], c = pop(); if (v > Math.max(0, D[c]) + 1e-4) continue;
    const i = c % nx, j = (c - i)/nx;
    for (let d = 0; d < 8; d++){
      const ii = i + NI[d], jj = j + NJ[d]; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
      const n = jj*nx + ii; if (ocean[n] || F[n] <= g[n] + 2) continue;
      const nd = Math.max(0, D[c]) + NW[d]*G/1000*(wat[n] ? o.waterCost : o.landCost);
      if (nd >= D[n] - 1e-4) continue;
      D[n] = nd; push(n, -nd);
      // the last crest on the way (its memory fades ~30 m per km) and how thick the fog was there
      let cr = crest[c] - 30*NW[d]*G/1000, ct = crTh[c];
      if (g[n] >= cr){ cr = g[n]; ct = F[n] - g[n]; }
      crest[n] = cr; crTh[n] = ct;
      const drape = g[n] + Math.max(0, ct)*Math.exp(-(cr - g[n])/o.evap);
      Ff[n] = F[n] - (1 - sm(40, 120, ct))*Math.max(0, F[n] - drape);
    }
    if ((++ops & 8191) === 0) yield;
  }
  // density: it thins out across the warm bay and inland
  const dens = new Float32Array(M), fx = new Float32Array(M), fy = new Float32Array(M), spd = new Float32Array(M);
  for (let k = 0; k < M; k++){
    if (ocean[k]){ dens[k] = 1; continue; }
    if (F[k] <= g[k] + 2 || D[k] > 1e3){ dens[k] = 0; continue; }
    dens[k] = wat[k] ? Math.exp(-Math.max(0, D[k] - 4)/8) : Math.exp(-Math.max(0, D[k] - 9)/5);
  }
  // flow: down the path distance (onshore over the ocean, east through the Gate, down the lee slopes); faster where squeezed or falling
  for (let j = 0; j < ny; j++){
    for (let i = 0; i < nx; i++){
      const k = j*nx + i, Dk = D[k] < 1e3 ? D[k] : 0, dv = (a, b) => (a < 1e3 && b < 1e3) ? a - b : 0;
      const dx = dv(i < nx - 1 ? D[k + 1] : Dk, i > 0 ? D[k - 1] : Dk), dy = dv(j < ny - 1 ? D[k + nx] : Dk, j > 0 ? D[k - nx] : Dk), L = Math.hypot(dx, dy);
      if (L > 1e-6){ fx[k] = dx/L; fy[k] = dy/L; } else { fx[k] = 1; fy[k] = 0; }
      const gx = (i < nx - 1 ? g[k + 1] : g[k]) - (i > 0 ? g[k - 1] : g[k]), gy = (j < ny - 1 ? g[k + nx] : g[k]) - (j > 0 ? g[k - nx] : g[k]);
      spd[k] = Math.min(2.6, 1 + 5*Math.max(0, -(gx*fx[k] + gy*fy[k])/(2*G)) + (wat[k] && !ocean[k] && D[k] < 7 ? 0.7 : 0));
    }
    if ((j & 63) === 63) yield;
  }
  const urbB = blur(urb, Math.round(700/G));
  return {G, X0, Y0, nx, ny, g, F, Ff, D, dens, fx, fy, spd, urb:urbB, ocean, wat, C, pops};
}
/*FIELD-END*/
const MF_OPT = {G:150, X0:-36000, Y0:-36000, nx:Math.round(40000/150) + 1, ny:Math.round(72000/150) + 1, lift:0.36, lee:1.25, decW:1.5, decL:4, landCost:2.2, waterCost:0.7, rise:0.5, gate:50, land:190, evap:160};
const MF = {st:0, gen:null, f:null, mesh:null, mat:null, tex:null, in:0, vis:600, top:0, cover:0, t:0, ms:0, buildMs:0, quads:0, verts:0, gc:new THREE.Color(0.7, 0.72, 0.74), Dmax:22,
  Fm:null, Dm:null, Wm:null, Km:null};
const mfOceanLvl = x => 215 + 330*wxSm(-29000, -70000, x);
// breathing: slow swells rolling in from the west (~6 min, ~12 km) on a slower rise and fall; identical in the vertex shader
const mfBreath = (x, z, t) => 0.6*Math.sin(t*0.017 - x*0.00052) + 0.4*Math.sin(t*0.0071 + z*0.00031 + 1.3);

// a tiling texture for the top: RG = surface normal (x, z), B = billows (height), A = wisps. The billows are a sum of soft round
// bumps (three sizes, wrapped around the tile) so the lit top shows rounded cells and no lattice; the wisps are a smooth value noise.
function mfTex(){
  const W = 256, d = new Uint8Array(W*W*4), rnd = mulberry32(4417), Hb = new Float32Array(W*W), Hw = new Float32Array(W*W);
  for (const [n, r0, r1, amp] of [[55, 14, 30, 1.0], [210, 6, 13, 0.5], [650, 2.5, 6, 0.22]]) for (let b = 0; b < n; b++){
    const cx = Math.floor(rnd()*W), cy = Math.floor(rnd()*W), r = r0 + (r1 - r0)*rnd(), a = amp*(0.6 + 0.4*rnd()), R = Math.ceil(r*2.5);
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++){
      const q = (dx*dx + dy*dy)/(r*r); if (q > 6.25) continue;
      Hb[(((cy + dy) % W + W) % W)*W + (((cx + dx) % W + W) % W)] += a*Math.exp(-q);
    }
  }
  const OCT = [[4, 0.5], [8, 0.28], [16, 0.15], [32, 0.07]];
  const lat = OCT.map(([n]) => { const a = new Float32Array(n*n); for (let i = 0; i < n*n; i++) a[i] = rnd(); return a; });
  const vn = (a, n, u, v) => { const x = u*n, y = v*n, xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, ux = fx*fx*(3 - 2*fx), uy = fy*fy*(3 - 2*fy);
    const i0 = ((xi % n) + n) % n, j0 = ((yi % n) + n) % n, i1 = (i0 + 1) % n, j1 = (j0 + 1) % n;
    const A = a[j0*n + i0], B = a[j0*n + i1], C = a[j1*n + i0], E = a[j1*n + i1]; return A + (B - A)*ux + (C - A)*uy + (A - B - C + E)*ux*uy; };
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++){ let h = 0; OCT.forEach(([n, a], o) => { h += a*vn(lat[o], n, i/W, j/W); }); Hw[j*W + i] = h; }
  let lo = 1e9, hi = -1e9, lo2 = 1e9, hi2 = -1e9; for (let k = 0; k < W*W; k++){ lo = Math.min(lo, Hb[k]); hi = Math.max(hi, Hb[k]); lo2 = Math.min(lo2, Hw[k]); hi2 = Math.max(hi2, Hw[k]); }
  // normals: slopes scaled so that the steeper flanks of the billows lean ~40 degrees
  const gx = new Float32Array(W*W), gz = new Float32Array(W*W), gm = [];
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++){ const k = j*W + i; gx[k] = (Hb[j*W + (i + 1) % W] - Hb[j*W + (i + W - 1) % W])/(hi - lo); gz[k] = (Hb[((j + 1) % W)*W + i] - Hb[((j + W - 1) % W)*W + i])/(hi - lo); if ((k & 7) === 0) gm.push(Math.hypot(gx[k], gz[k])); }
  gm.sort((a, b) => a - b); const sc = 0.85/Math.max(1e-6, gm[Math.floor(gm.length*0.95)]);
  for (let k = 0; k < W*W; k++){
    const nx = -gx[k]*sc, nz = -gz[k]*sc, l = Math.hypot(nx, 1, nz);
    d[k*4] = Math.round((nx/l*0.5 + 0.5)*255); d[k*4 + 1] = Math.round((nz/l*0.5 + 0.5)*255); d[k*4 + 2] = Math.round((Hb[k] - lo)/(hi - lo)*255); d[k*4 + 3] = Math.round((Hw[k] - lo2)/(hi2 - lo2)*255);
  }
  const tx = new THREE.DataTexture(d, W, W, THREE.RGBAFormat);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.generateMipmaps = true; tx.minFilter = THREE.LinearMipmapLinearFilter; tx.magFilter = THREE.LinearFilter;
  try { tx.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); } catch (e){ /* no anisotropic filtering */ }
  tx.needsUpdate = true;
  return tx;
}

// the sheet: the fogged nodes of the field (+ a ring of fog-less ones it fades into), and a coarse deck over the ocean to the horizon
function* mfMeshGen(f){
  const {nx, ny, G, X0, Y0, g, F, Ff, D, dens, ocean} = f, M = nx*ny, Dmax = MF.Dmax;
  const pos = new Uint8Array(M);
  for (let k = 0; k < M; k++) pos[k] = ocean[k] || (F[k] > g[k] + 2 && D[k] < Dmax) ? 1 : 0;
  // fill the fog-less nodes next to fog (level: the mean of their fogged neighbours, density 0)
  const Fm = new Float32Array(F), Lm = new Float32Array(Ff), Dm = new Float32Array(D), Km = new Float32Array(dens), Wm = new Float32Array(M);
  for (let j = 0; j < ny; j++){
    for (let i = 0; i < nx; i++){
      const k = j*nx + i;
      if (pos[k]){ Wm[k] = ocean[k] ? 1 : 0; if (ocean[k]) Lm[k] = F[k]; continue; }
      let s = 0, sl = 0, sd = 0, w = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++){ const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue; const n = jj*nx + ii; if (pos[n]){ s += F[n]; sl += Ff[n]; sd += D[n]; w++; } }
      if (w){ Fm[k] = s/w; Lm[k] = sl/w; Dm[k] = sd/w + 0.4; } else { Fm[k] = Lm[k] = g[k] - 30; Dm[k] = 99; }
      Km[k] = 0; Wm[k] = 0;
    }
    if ((j & 63) === 63) yield;
  }
  MF.Fm = Fm; MF.Lm = Lm; MF.Dm = Dm; MF.Km = Km; MF.Wm = Wm;
  // vertices for the nodes of the quads that touch fog
  const vid = new Int32Array(M).fill(-1); let nv = 0, nq = 0;
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++){
    const k = j*nx + i; if (!(pos[k] | pos[k + 1] | pos[k + nx] | pos[k + nx + 1])) continue;
    nq++; for (const n of [k, k + 1, k + nx, k + nx + 1]) if (vid[n] < 0) vid[n] = nv++;
  }
  yield;
  // the outer deck: 1.2 km grid west of the map (and south of it, west of the coast), out to the sea plane's edge
  const OG = 1200, OX0 = -108000, OXN = Math.round((X0 - OX0)/OG), OYN = Math.round(216000/OG), SXN = Math.round((-19200 - X0)/OG), SYN = Math.round((Y0 + 108000)/OG);
  const nvO = (OXN + 1)*(OYN + 1) + (SXN + 1)*(SYN + 1), nqO = OXN*OYN + SXN*SYN;
  const NV = nv + nvO, P = new Float32Array(NV*3), aG = new Float32Array(NV), aL = new Float32Array(NV), aM = new Float32Array(NV*4), aF = new Float32Array(NV*3);
  const urb = f.urb, fxA = f.fx, fyA = f.fy, sp = f.spd;
  for (let k = 0; k < M; k++){ const v = vid[k]; if (v < 0) continue; const i = k % nx, j = (k - i)/nx;
    P[v*3] = X0 + i*G; P[v*3 + 1] = Fm[k]; P[v*3 + 2] = -(Y0 + j*G); aG[v] = g[k]; aL[v] = Lm[k];
    aM[v*4] = Dm[k]; aM[v*4 + 1] = Km[k]; aM[v*4 + 2] = urb[k]; aM[v*4 + 3] = Wm[k];
    aF[v*3] = fxA[k]; aF[v*3 + 1] = fyA[k]; aF[v*3 + 2] = sp[k]; }
  let v = nv;
  const outer = (x0, y0, cx, cy) => { const base = v; for (let b = 0; b <= cy; b++) for (let a = 0; a <= cx; a++){ const x = x0 + a*OG, y = y0 + b*OG;
    P[v*3] = x; P[v*3 + 1] = aL[v] = mfOceanLvl(x); P[v*3 + 2] = -y; aG[v] = 0; aM[v*4] = -12; aM[v*4 + 1] = 1; aM[v*4 + 2] = 0; aM[v*4 + 3] = 1; aF[v*3] = 1; aF[v*3 + 1] = 0; aF[v*3 + 2] = 1; v++; } return base; };
  const oA = outer(OX0, -108000, OXN, OYN), oB = outer(X0, -108000, SXN, SYN);
  const NQ = nq + nqO, I = NV > 65535 ? new Uint32Array(NQ*6) : new Uint16Array(NQ*6); let w = 0;
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++){
    const k = j*nx + i; if (!(pos[k] | pos[k + 1] | pos[k + nx] | pos[k + nx + 1])) continue;
    const a = vid[k], b = vid[k + 1], c = vid[k + nx], d = vid[k + nx + 1];
    I[w++] = a; I[w++] = b; I[w++] = d; I[w++] = a; I[w++] = d; I[w++] = c;
  }
  const quads = (o0, cx, cy) => { for (let b = 0; b < cy; b++) for (let a = 0; a < cx; a++){ const p = o0 + b*(cx + 1) + a, q = p + cx + 1; I[w++] = p; I[w++] = p + 1; I[w++] = q + 1; I[w++] = p; I[w++] = q + 1; I[w++] = q; } };
  quads(oA, OXN, OYN); quads(oB, SXN, SYN);
  yield;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('aG', new THREE.BufferAttribute(aG, 1)); geo.setAttribute('aL', new THREE.BufferAttribute(aL, 1));
  geo.setAttribute('aM', new THREE.BufferAttribute(aM, 4)); geo.setAttribute('aF', new THREE.BufferAttribute(aF, 3));
  geo.setIndex(new THREE.BufferAttribute(I, 1));
  MF.quads = NQ; MF.verts = NV;
  return geo;
}
function mfMaterial(){
  MF.tex = mfTex();
  return new THREE.ShaderMaterial({
    uniforms:{uTex:{value:MF.tex}, uT:{value:0}, uReach:{value:0}, uMar:{value:0}, uLvl:{value:0}, uBreath:{value:40}, uFlowL:{value:300}, uIn:{value:0},
      uSunW:{value:new THREE.Vector3(0, 1, 0)}, uSunC:{value:new THREE.Color()}, uAmbC:{value:new THREE.Color()}, uUnderC:{value:new THREE.Color()}, uGlowC:{value:new THREE.Color()},
      uFogC:{value:new THREE.Color()}, uFogN:{value:1e5}, uFogF:{value:2e5}},
    vertexShader:`
attribute float aG; attribute float aL; attribute vec4 aM; attribute vec3 aF;
uniform float uT, uLvl, uBreath, uReach;
varying vec3 vW; varying vec4 vM; varying vec3 vF; varying float vTh;
void main(){
  float br = uBreath*(0.6*sin(uT*0.017 - position.x*0.00052) + 0.4*sin(uT*0.0071 + position.z*0.00031 + 1.3));
  float lv = mix(aL, position.y, smoothstep(1.5, 5.0, uReach - aM.x));          // the advancing front's level, then the filled basin
  float top = lv + (uLvl + br)*max(aM.w, smoothstep(15.0, 110.0, lv - aG));     // deep fog breathes, a thin spill hardly
  vW = vec3(position.x, top, position.z); vM = aM; vF = aF; vTh = top - aG;
  gl_Position = projectionMatrix*viewMatrix*vec4(vW, 1.0);
}`,
    fragmentShader:`
uniform sampler2D uTex; uniform float uT, uReach, uMar, uFogN, uFogF, uFlowL, uIn;
uniform vec3 uSunW, uSunC, uAmbC, uUnderC, uGlowC, uFogC;
varying vec3 vW; varying vec4 vM; varying vec3 vF; varying float vTh;
void main(){
  vec2 p = vW.xz - vec2(uT*2.5, 0.0);                       // the whole layer drifts in on the onshore breeze
  vec2 fl = vec2(vF.x, -vF.y)*vF.z;                          // local flow (through the strait, down the lee slopes)
  float ph = uT/36.0, p0 = fract(ph), p1 = fract(ph + 0.5), wg = abs(1.0 - 2.0*p0);
  vec2 o0 = fl*(p0*uFlowL), o1 = fl*(p1*uFlowL);
  vec4 A = mix(texture2D(uTex, (p - o0)/1900.0), texture2D(uTex, (p - o1)/1900.0 + 0.5), wg);
  vec4 B = mix(texture2D(uTex, (p - 1.4*o0)/520.0 + 0.27), texture2D(uTex, (p - 1.4*o1)/520.0 + 0.77), wg);
  vec4 K = texture2D(uTex, vW.xz/12000.0 + vec2(uT*0.000004, 0.13)), K2 = texture2D(uTex, vW.xz/4700.0 + vec2(0.61, uT*0.000007));
  float sk = smoothstep(1.2, 2.2, vF.z);                     // pouring down a lee slope: streaks along the fall line
  if (sk > 0.01){
    vec2 q = (p - 1.4*o0)/520.0 + 0.27, d = fl/max(vF.z, 1.0)*(70.0/520.0);
    vec4 S = (texture2D(uTex, q + d) + texture2D(uTex, q - d) + texture2D(uTex, q + 2.0*d) + texture2D(uTex, q - 2.0*d))*0.25;
    B = mix(B, mix(B, S, 0.8), sk);
  }
  // cover: how far it has come in (a lumpy front) times how dense it is here; thin fog breaks up into cells and wisps
  float c = vM.y*smoothstep(0.0, 0.5, uReach - vM.x + 1.2*(K.a - 0.5) + 1.7*(K2.a - 0.5) + 1.0*(A.a - 0.5) + 0.35*(B.a - 0.5));
  float h = 0.6*A.b + 0.4*B.b, n1 = 0.5*A.b + 0.3*B.b + 0.2*K.b;
  float a = smoothstep(1.0 - c - 0.1, 1.0 - c + 0.06, n1)*smoothstep(0.0, 0.12, c);
  a *= uMar*smoothstep(0.0, 14.0, vTh + 18.0*(B.b - 0.55));  // thin where it meets the ground
  a = min(a, 0.985);
  if (a < 0.004) discard;
  // lit like a cloud top: billows facing the sun bright, the troughs between them and the thin edges a little grey
  vec3 n = normalize(vec3((A.r - 0.5)*1.6 + (B.r - 0.5)*1.0, 1.0, (A.g - 0.5)*1.6 + (B.g - 0.5)*1.0));
  vec3 V = normalize(cameraPosition - vW);
  float up = smoothstep(-0.06, 0.08, uSunW.y), lit = (0.72 + 0.28*max(dot(n, uSunW), 0.0))*up, ao = 0.82 + 0.18*h;
  float fwd = pow(max(dot(-V, uSunW), 0.0), 6.0)*up;                       // bright towards a low sun (forward scattering)
  vec3 col = (uAmbC*(0.8 + 0.2*n.y) + uSunC*(lit + 0.45*fwd))*ao*(0.96 + 0.08*K.b);
  col = mix(col*0.86, col, smoothstep(0.3, 0.9, c)) + uGlowC*vM.z;
  vec3 gn = normalize(cross(dFdx(vW), dFdy(vW))); gn *= sign(gn.y + 1e-4);                    // the sheet's upward normal (slopes too)
  if (dot(gn, cameraPosition - vW) < 0.0) col = mix(uUnderC*(0.94 + 0.1*A.b), uFogC, uIn) + uGlowC*vM.z*1.3;   // seen from below: the grey underside
  col = mix(col, uFogC, smoothstep(uFogN, uFogF, distance(cameraPosition, vW)));
  gl_FragColor = vec4(col, a);
}`,
    transparent:true, depthWrite:false, depthTest:true, side:THREE.DoubleSide, fog:false, extensions:{derivatives:true}});
}
// the layer at a world point: [top (m), cover 0..1, density, ground]
function mfAt(x, y, t){
  const f = MF.f, s = wxS; if (!f) return [0, 0, 0, 0];
  const br = MF.mat ? MF.mat.uniforms.uBreath.value*mfBreath(x, -y, t) : 0;
  if (x < f.X0){ const top = mfOceanLvl(x) + s.lvl + br; return [top, s.mar*(MF.fade || 0)*wxSm(0, 1, s.reach + 12), 1, 0]; }
  const u = Math.min(f.nx - 1.001, Math.max(0, (x - f.X0)/f.G)), v = Math.min(f.ny - 1.001, Math.max(0, (y - f.Y0)/f.G)), i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j, k = j*f.nx + i;
  const bl = A => (A[k]*(1 - a) + A[k + 1]*a)*(1 - b) + (A[k + f.nx]*(1 - a) + A[k + f.nx + 1]*a)*b;
  const gr = bl(f.g), dn = bl(MF.Km), D = bl(MF.Dm), lv = bl(MF.Lm) + (bl(MF.Fm) - bl(MF.Lm))*wxSm(1.5, 5, s.reach - D), top = lv + (s.lvl + br)*Math.max(bl(MF.Wm), wxSm(15, 110, lv - gr));
  return [top, s.mar*(MF.fade || 0)*dn*wxSm(0, 0.5, s.reach - D)*wxSm(0, 14, top - gr), dn, gr];
}
function mfStart(){
  MF.st = 1; MF.t0 = performance.now(); MF.work = 0;
  const o = Object.assign({hAt:(x, y) => hAt(x, y), lu:typeof sgLU === 'function' ? (x, y) => sgLU(x, y) : null}, MF_OPT);
  MF.gen = (function*(){ const f = yield* mfFieldGen(o); MF.f = f; const geo = yield* mfMeshGen(f); return geo; })();
}
function mfStep(budget){
  const t0 = performance.now();
  while (performance.now() - t0 < budget){
    const r = MF.gen.next();
    if (r.done){
      MF.gen = null; MF.mat = MF.mat || mfMaterial();
      MF.mesh = new THREE.Mesh(r.value, MF.mat); MF.mesh.frustumCulled = false; MF.mesh.renderOrder = 6.5; MF.mesh.name = 'wxMarine'; MF.mesh.visible = false;   // drawn after the city's lamps and glows (renderOrder 6): they stay under it
      scene.add(MF.mesh); MF.st = 2; MF.work += performance.now() - t0; MF.buildMs = MF.work; MF.wall = performance.now() - MF.t0;
      return true;
    }
  }
  MF.work += performance.now() - t0;
  return false;
}
// per frame: build when first wanted, then uniforms and the camera-inside factor
const _mfc = new THREE.Color();
function mfFrame(now, dt){
  const s = wxS, want = wxBayMap() && s.mar > 0.002;
  if (!want){ if (MF.mesh) MF.mesh.visible = false; MF.inT = 0; MF.in += (0 - MF.in)*(WX.snapM ? 1 : 1 - Math.exp(-Math.min(2, WX.wall || dt)/0.5)); if (MF.in < 1e-3) MF.in = 0; WX.snapM = false; return; }
  if (MF.st === 0) mfStart();
  if (MF.st === 1){ if (!mfStep(Math.min(400, Math.max(WX.snapM ? 40 : 9, 0.3*1000*(WX.wall || 0))))) return; }
  MF.t += dt*(todPlay ? 6 : 1);
  MF.fade = WX.snapM ? 1 : Math.min(1, (MF.fade || 0) + dt/2.5);              // fades in once built
  const U = MF.mat.uniforms, t = MF.t;
  MF.mesh.visible = true;
  U.uT.value = t; U.uReach.value = s.reach; U.uMar.value = Math.min(1, s.mar)*MF.fade; U.uLvl.value = s.lvl;
  U.uSunW.value.copy(sunDir);
  // above the deck it is the clear sky's light (the ground light under it is dimmed separately)
  U.uSunC.value.copy(WB.sun).multiplyScalar(WB.sI);
  U.uAmbC.value.copy(WB.hs).multiplyScalar(0.32*WB.hI/0.7).lerp(_mfc.copy(WB.sky).multiplyScalar(0.32), 0.25);
  U.uUnderC.value.copy(MF.gc).multiplyScalar(0.92);
  U.uGlowC.value.setRGB(1.0, 0.76, 0.52).multiplyScalar(0.5*wxSm(0.3, 0.9, WB.nf));
  // is the camera inside it?
  const c = camera.position, [top, cov] = mfAt(c.x, -c.z, t);
  MF.top = top; MF.cover = cov;
  MF.inT = cov*wxSm(top + 25, top - 35, c.y);
  MF.in += (MF.inT - MF.in)*(WX.snapM ? 1 : 1 - Math.exp(-Math.min(2, WX.wall || dt)/0.45)); if (Math.abs(MF.in - MF.inT) < 1e-3) MF.in = MF.inT;
  WX.snapM = false;
  MF.vis = 260 + 420*(1 - cov);
}
// the grey of the fog from inside: daylight through the deck, a murky orange glow of the city at night
function mfGrey(out){
  const L = Math.min(1, 0.1 + 0.95*wxLum(WB.sky)), nf = WB.nf;
  out.setRGB(0.79, 0.81, 0.83).multiplyScalar(L);
  out.r += 0.17*nf; out.g += 0.12*nf; out.b += 0.08*nf;
  return out;
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
    uniforms:{uBox:{value:new THREE.Vector3(120, 80, 120)}, uCen:{value:new THREE.Vector3()}, uVel:{value:new THREE.Vector3(0, -9.5, 0)}, uT:{value:0}, uRain:{value:0},
      uLen:{value:0.075}, uW:{value:0.018}, uOp:{value:0.3}, uView:{value:new THREE.Vector2(1, 1)}, uCol:{value:new THREE.Color(0.75, 0.77, 0.8)}},
    vertexShader:`
attribute float aK; attribute vec2 aCorner;
uniform vec3 uBox, uCen, uVel; uniform float uT, uRain, uLen, uW, uOp; uniform vec2 uView;
varying float vA; varying float vT;
void main(){
  vA = 0.0; vT = aCorner.x; gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  if (aK > uRain) return;
  vec3 vel = uVel*(0.8 + 0.4*fract(aK*97.13));
  vec3 p = position*uBox + vel*uT;
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
uniform vec3 uCol; varying float vA; varying float vT;
void main(){ float a = vA*mix(1.0, 0.2, vT); if (a < 0.003) discard; gl_FragColor = vec4(uCol, a); }`,
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
  const now = performance.now()/1000, wall = Math.max(0, now - (WX.last || now)), dt = Math.min(0.25, wall); WX.last = now; WX.frame++; WX.wall = wall;
  const tgt = WX.mode === 'auto' ? (wxBay() ? wxAutoBay(tod, now) : wxAuto(tod, now)) : WX.mode === 'fog' && !wxBayMap() ? WX_TGT.mist : WX_TGT[WX.mode] || WX_TGT.clear;
  const f = WX.instant ? 1 : 1 - Math.exp(-dt/1.6); if (WX.instant){ WX.instant2 = true; WX.snapM = true; } WX.instant = false;
  { const inst = WX.instant2 || f === 1, r = Math.min(1, (inst ? tgt.rain || 0 : wxS.rain)*1.25);   // [v33] wet ground
    WX.wet = inst ? r : r > WX.wet ? WX.wet + (r - WX.wet)*(1 - Math.exp(-dt*(todPlay ? 20 : 1)/18)) : Math.max(r, WX.wet - dt*(todPlay ? 20 : 1)/240); }
  let moving = false;
  for (const p of WX_PAR){ wxT[p] = tgt[p] !== undefined ? tgt[p] : WX_M0[p] || 0; const d = wxT[p] - wxS[p]; if (Math.abs(d) > 2e-4){ wxS[p] += d*f; moving = true; } else wxS[p] = wxT[p]; }
  const s = wxS;
  mfFrame(now, dt);                                                       // the marine layer (Bay map): build, uniforms, camera inside it?
  const fogIn = MF.in !== MF.inPrev; MF.inPrev = MF.in;
  WXU.addFog.value = wxBay() && (MF.in > 0.01 || s.vis > 0.05) ? 1 : 0;   // (the Singapore build keeps its look)
  if (WXU.addFog.value && WX.frame - (WX.glowScan || -1e9) > 120){            // glows made later by other modules (the roads' lamp heads ...)
    WX.glowScan = WX.frame;
    scene.traverse(o => { if (o.isPoints && o.material && o.material.isPointsMaterial && o.material.blending === THREE.AdditiveBlending && o.material.fog) wxGlowFog(o.material); });
  }
  const active = s.cov + s.deck + s.cb + s.vis + s.rain + s.ovc + s.blue + s.dark + s.mar + MF.in > 1e-4;
  // lightning
  let F = wxFlashAt(now);
  if (s.bolt > 0.05 && CL.mesh && !WX.hold && !WX.quiet){ if (!FL.next || now > FL.next + 30) FL.next = now + 1 + Math.random()*3; if (now >= FL.next){ wxStrike(now, false); FL.next = now + (1.3 + 5*Math.random())/(0.3 + s.bolt); F = wxFlashAt(now); } }
  FL.F = F;
  if (!active && !moving && !F && !fogIn){
    if (WX.applied){ wxEnv(); wxFog(camera.position.distanceTo(controls.target), 0); WX.applied = false; }
    if (CL.mesh) CL.mesh.visible = false; if (RAIN.mesh) RAIN.mesh.visible = false; if (BOLT.mesh) BOLT.mesh.visible = false;
    wxIcon(); return;
  }
  const D = camera.position.distanceTo(controls.target), k = wxK();
  if (moving || F > 0 || FL.was || fogIn) wxEnv();
  FL.was = F > 0;
  const cp = camera.position, calt = cp.y - Math.max(0, hAt(cp.x, -cp.z));
  wxFog(D, calt);
  if (!CL.mesh && (s.cov + s.deck + s.cb + s.rain) > 1e-3){ wxBuildClouds(); wxBuildRain(); }
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
    const c = camera.position, alt = c.y - Math.max(0, hAt(c.x, -c.z)), near = 1 - wxSm(160, 650, alt), on = s.rain > 0.003 && near > 0.01;
    RAIN.mesh.visible = on;
    if (on){
      const U = RAIN.mat.uniforms, ws = 1.2 + 5*s.wind*s.rain;
      camera.getWorldDirection(_wf); _wf.y = 0; if (_wf.lengthSq() > 1e-6) _wf.normalize();
      U.uCen.value.set(c.x + _wf.x*32, c.y + 4, c.z + _wf.z*32); U.uVel.value.set(0.92*ws, -9.5, 0.39*ws);
      U.uT.value = now % 1000; U.uRain.value = s.rain; U.uOp.value = (0.4 + 0.25*s.rain)*near; U.uView.value.copy(_wd);
      U.uCol.value.copy(WB.hs).multiplyScalar(0.62*WB.hI/0.78 + 0.1).lerp(scene.background, 0.3).lerp(_wg.setRGB(0.36, 0.38, 0.44), WB.nf*0.8); U.uCol.value.r = Math.min(1, U.uCol.value.r + 0.06*F); U.uCol.value.b = Math.min(1, U.uCol.value.b + 0.1*F);
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
  fog:'<path d="M8 3v8.5M16 3v8.5M2.8 9.2h18.4"/><path d="M8 4.6q4 4.6 8 0"/><path d="M2.5 13.4h19M4.5 16.9h15M7 20.4h10"/>'
};
const WX_COL = {sun:'#c88a12', moon:'#5a6c96', cloud:'#5d6f7c', haze:'#9a8b6c', rain:'#3e6e92', storm:'#6c4fa3', auto:'#244d43', fog:'#6a7d8a'};
const WX_NCOL = {sun:'#f1d78a', moon:'#c9d6f2', cloud:'#b9c8d2', haze:'#d8c9a6', rain:'#8fc0e6', storm:'#c3a8f0', auto:'#9fd3c3', fog:'#c8d4dc'};
const wxSvg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${WX_ICO[k]}</svg>`;
function wxEffIco(){
  const s = wxS, nightNow = WB.nf > 0.5;
  if (WX.mode !== 'auto') return WX.mode === 'clear' ? (nightNow ? 'moon' : 'sun') : WX_MODES.find(m => m.id === WX.mode).ico;
  const fog = wxBayMap() && s.mar > 0.5 && (MF.in > 0.3 || s.reach > 2.5);
  return s.bolt > 0.3 ? 'storm' : s.rain > 0.25 ? 'rain' : fog ? 'fog' : s.vis*s.milk > 0.45 ? 'haze' : s.cov > 0.32 ? 'cloud' : nightNow ? 'moon' : 'sun';
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
    storm:'雷暴：积雨云高耸，大雨与闪电 · Towering cumulonimbus, heavy rain and lightning',
    fog:wxBayMap() ? '卡尔雾：太平洋上的平流雾从金门海峡涌进湾区，盖住日落区和列治文区，翻过双峰泻下 · Karl the Fog: the marine layer pours through the Golden Gate, blankets the Sunset and the Richmond and spills over Twin Peaks' :
      '地面薄雾，能见度低 · Ground mist, low visibility'}[WX.mode];
  WX.eff = ''; wxIcon();
}
function wxSet(mode, instant){
  if (!WX_MODES.some(m => m.id === mode && (!m.bay || wxBay()))) return false;
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
  WX_MODES.filter(m => !m.bay || wxBay()).map(m => `<button type="button" role="menuitemradio" aria-checked="false" data-wx="${m.id}" style="--wxc:${WX_COL[m.ico]};--wxn:${WX_NCOL[m.ico]}"><i>${wxSvg(m.ico)}</i><span>${m.zh}</span><small>${m.long || m.en}</small></button>`).join('')
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

/* ---------- additive glows (street lamps, neon halos) in the fog: they fade out with distance instead of turning into fog-coloured
   dots — Bay build only, and only while the weather pulls the fog in (marine layer, haze, rain); clear weather looks as before ---------- */
const WXU = {addFog:{value:0}};
function wxGlowFog(mat){
  if (!mat || !mat.isMaterial || mat.userData.wxFog) return;
  mat.userData.wxFog = true;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    sh.uniforms.wxAddFog = WXU.addFog;
    sh.fragmentShader = 'uniform float wxAddFog;\n' + sh.fragmentShader.replace('#include <fog_fragment>', `#ifdef USE_FOG
  float wxFF = smoothstep(fogNear, fogFar, fogDepth);
  gl_FragColor.rgb = mix(mix(gl_FragColor.rgb, fogColor, wxFF), gl_FragColor.rgb*(1.0 - wxFF), wxAddFog);
#endif`);
  };
  mat.needsUpdate = true;
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
  WX.mode = WX_MODES.some(q => q.id === m && (!q.bay || wxBay())) ? m : WX_DEFAULT;
  if (wxBay()) try { wxGlowFog(matLamp); if (typeof matNeonGlow !== 'undefined') wxGlowFog(matNeonGlow); } catch (e){ /* not in this build */ }
  WX.day = WX.day0 = Math.floor(Date.now()/864e5) % 1000; WX.instant = true;
  wxUI();
});
HOOKS.frame.push(() => { const t0 = performance.now(); wxFrame(); WX.ms = WX.ms*0.95 + (performance.now() - t0)*0.05; });
// after the light module has made the fog colour from the sky (its prerender hook runs first): inside the marine layer it is the fog's grey
HOOKS.prerender.push(() => {
  if (MF.in > 0.001) scene.fog.color.lerp(MF.gc, MF.in);
  if (MF.mesh && MF.mesh.visible){ const U = MF.mat.uniforms; U.uFogC.value.copy(scene.fog.color); U.uFogN.value = scene.fog.near; U.uFogF.value = scene.fog.far; U.uIn.value = MF.in; }
});
window.SGWx = {
  get wet(){ return WX.wet; },                     // [v33] 0..1 how wet the ground is (rain; dries slowly afterwards)
  dbg:WX.dbg,
  set:(m, instant) => wxSet(m, instant !== false),
  get mode(){ return WX.mode; },
  get state(){ const o = {}; for (const p of WX_PAR) o[p] = +(wxS[p] || 0).toFixed(3); if (MF.in > o.ovc) o.ovc = +MF.in.toFixed(3); return o; },
  get bay(){ return wxBay(); }, get plan(){ return wxBay() ? Object.assign({}, wxBayPlan(0), {note:wxBayNote()}) : wxPlan(WX.day); },
  get pin(){ return WX.pin || 0; }, set pin(v){ WX.pin = v|0; wxSyncUI(); },
  autoAt:t => { const o = wxBay() ? wxAutoBay(t, 0) : wxAuto(t, 0), r = {}; for (const p in o) r[p] = +o[p].toFixed(3); return r; },
  marine:{info:() => ({state:MF.st, ready:MF.st === 2, quads:MF.quads, verts:MF.verts, buildMs:+(MF.buildMs || 0).toFixed(0), wallMs:+(MF.wall || 0).toFixed(0), inside:+MF.in.toFixed(3), top:+MF.top.toFixed(1), cover:+MF.cover.toFixed(3), vis:Math.round(MF.vis), visible:!!(MF.mesh && MF.mesh.visible)}),
    at:(lat, lon) => { const q = sgXY(lat, lon), r = mfAt(q[0], q[1], MF.t); return {top:+r[0].toFixed(1), cover:+r[1].toFixed(3), dens:+r[2].toFixed(3), ground:+r[3].toFixed(1)}; },
    build:() => { if (!wxBayMap()) return false; if (MF.st === 0) mfStart(); while (MF.st === 1) mfStep(1e9); return MF.info ? MF.info() : true; },
    get ready(){ return MF.st === 2; }, get field(){ return MF.f; }},
  get day(){ return WX.day; }, set day(v){ WX.day = v|0; wxSyncUI(); },
  set hold(v){ WX.hold = !!v; }, get hold(){ return WX.hold; }, set quiet(v){ WX.quiet = !!v; },
  strike:(dx, dz) => { wxStrike(performance.now()/1000, true, dx !== undefined ? [dx, dz || 0] : null); return [FL.x, FL.y, FL.z].map(Math.round); },
  stats:() => ({ms:+WX.ms.toFixed(3), puffs:CL.puffs || 0, clouds:CL.n, rain:RN, cloudsOn:!!(CL.mesh && CL.mesh.visible), rainOn:!!(RAIN.mesh && RAIN.mesh.visible), boltOn:!!(BOLT.mesh && BOLT.mesh.visible), fog:[Math.round(scene.fog.near), Math.round(scene.fog.far)],
    marine:MF.st ? {on:!!(MF.mesh && MF.mesh.visible), quads:MF.quads, inside:+MF.in.toFixed(3)} : null}),
  menu:o => wxMenu(o),
  bench:() => { const t0 = performance.now(); for (let i = 0; i < 20; i++) wxSortWrite(false); const t1 = performance.now(); for (let i = 0; i < 20; i++) wxSunShade(); const t2 = performance.now(); for (let i = 0; i < 20; i++) wxEnv(); const t3 = performance.now();
    return {sort:(t1 - t0)/20, shade:(t2 - t1)/20, env:(t3 - t2)/20, drawn:CL.geo ? CL.geo.drawRange.count/6 : 0}; }
};
}
