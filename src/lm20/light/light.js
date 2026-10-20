/* ================= v21 add-on: light — the real sun, moon and sky over Singapore (lm20/light) =================
   Time of day follows the real sky at 1.35 N (or a generic 25 N site on the generated islands), for today's date
   (the date moves on when the simulated clock passes midnight; SGLight.date = 'YYYY-MM-DD' pins one):
   - sun and moon from low-precision ephemerides (sun ~0.01 deg, moon ~0.3 deg, moon phase from the sun-moon angle);
     in Singapore sunrise ~6:45-7:15 and sunset ~18:50-19:20 (UTC+8 at 103.8 E: solar noon ~12:55-13:15), the noon sun
     5-25 deg from the zenith, north of it from April to August;
   - everything else is a function of the sun's elevation (not of the clock): sky, haze, sun colour and strength, sky and
     ground bounce light, sea colour, and the night factor that switches the city lights (applyTime's keyframe table KF is
     rebuilt from this model every 10 minutes of the day, so window lights, lamps, neon, ads and wx follow it);
     only the fraction of lit windows (KF.lit) stays a clock schedule (people's habits);
   - a sky dome (1 draw call) behind everything: hazy gradient tied to the fog colour (scene.background, which wx may
     change), sun disc and aureole, twilight arch, Earth's shadow and the Belt of Venus, light-polluted night glow,
     a few stars turning with sidereal time, the moon with its real phase;
   - aerial perspective: the fog distance follows the view distance (a hazy 20-25 km visibility at street level, the
     island overview stays clear); wx pulls it in further for haze/rain;
   - water: the sea material reflects the sky with Fresnel and shows a sun (or moon) glitter path (shader only);
   - shadows: the shadow box is fitted to the view (pushed forward and widened for low views, snapped to light-space
     texels, deeper for a low sun).
   HOOKS.time runs before wx's (module order light, wx), so wx snapshots these values as its clear-sky base.
   Test handle: window.SGLight {info(), date, enabled, bench(), sun(t)}. */
{
const LGD = Math.PI/180;
const lgSm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a)/(b - a))); return t*t*(3 - 2*t); };
const LG_SITE = {sg:{lat:1.3521, lon:103.8198, tz:8, name:'Singapore'}, gen:{lat:25, lon:120, tz:8, name:'generic 25N'}};
const LG = {on:true, mode:-1, site:LG_SITE.gen, fixed:null, dayOff:0, prevT:null, ymd:[2026, 1, 1], key:'', inApply:false,
  el:45, az:0, mel:-90, maz:0, illum:0, night:0, sr:7, ss:19, noon:13, moonI:0, starK:0, dirSrc:'sun', span:0, fogN:0, fogF:0, ms:0,
  sunV:new THREE.Vector3(0, 1, 0), moonV:new THREE.Vector3(0, -1, 0), tmp:new THREE.Vector3()};

/* ---------- ephemerides (Astronomical Almanac low-precision formulae) ---------- */
function lgJD(y, m, d, hUT){ if (m <= 2){ y--; m += 12; } const A = Math.floor(y/100), B = 2 - A + Math.floor(A/4); return Math.floor(365.25*(y + 4716)) + Math.floor(30.6001*(m + 1)) + d + B - 1524.5 + hUT/24; }
function lgSunEq(jd){
  const n = jd - 2451545.0, L = (280.460 + 0.9856474*n) % 360, g = (357.528 + 0.9856003*n)*LGD;
  const lam = (L + 1.915*Math.sin(g) + 0.020*Math.sin(2*g))*LGD, eps = (23.439 - 0.0000004*n)*LGD;
  return [Math.atan2(Math.cos(eps)*Math.sin(lam), Math.cos(lam)), Math.asin(Math.sin(eps)*Math.sin(lam))];
}
function lgMoonEq(jd){
  const T = (jd - 2451545.0)/36525, s = a => Math.sin(a*LGD);
  const lam = (218.32 + 481267.881*T + 6.29*s(135.0 + 477198.87*T) - 1.27*s(259.3 - 413335.36*T) + 0.66*s(235.7 + 890534.22*T) + 0.21*s(269.9 + 954397.74*T) - 0.19*s(357.5 + 35999.05*T) - 0.11*s(186.5 + 966404.03*T))*LGD;
  const bet = (5.13*s(93.3 + 483202.02*T) + 0.28*s(228.2 + 960400.89*T) - 0.28*s(318.3 + 6003.15*T) - 0.17*s(217.6 - 407332.21*T))*LGD, e = 23.439*LGD;
  const x = Math.cos(bet)*Math.cos(lam), y = Math.cos(e)*Math.cos(bet)*Math.sin(lam) - Math.sin(e)*Math.sin(bet), z = Math.sin(e)*Math.cos(bet)*Math.sin(lam) + Math.cos(e)*Math.sin(bet);
  return [Math.atan2(y, x), Math.asin(z)];
}
const lgGMST = jd => ((280.46061837 + 360.98564736629*(jd - 2451545.0)) % 360 + 360) % 360;
// equatorial -> three.js direction (x east, y up, z south)
function lgLocal(eq, jd, site, out){
  const H = (lgGMST(jd) + site.lon)*LGD - eq[0], p = site.lat*LGD, d = eq[1];
  return out.set(-Math.cos(d)*Math.sin(H), Math.sin(p)*Math.sin(d) + Math.cos(p)*Math.cos(d)*Math.cos(H), -(Math.cos(p)*Math.sin(d) - Math.sin(p)*Math.cos(d)*Math.cos(H)));
}
const lgJDAt = t => lgJD(LG.ymd[0], LG.ymd[1], LG.ymd[2], t - LG.site.tz);
function lgSunDir(t, out){ const jd = lgJDAt(t); return lgLocal(lgSunEq(jd), jd, LG.site, out); }
const lgElev = v => Math.asin(Math.max(-1, Math.min(1, v.y)))/LGD;

/* ---------- the look as a function of the sun's elevation (deg) ----------
   zen/hor: sky at the zenith and at the horizon (hor = fog colour = scene.background); sun: colour and strength of the
   directional light (after sunset: the bright twilight sky on the sun's side); hs/hg/hI: sky light and ground bounce;
   sea: water body colour; glow: aureole around the sun; arch: twilight glow on the sun's side of the horizon;
   belt: Belt of Venus (pink band opposite the sun); shad: Earth's shadow (dark band under it); exp: gradient shape */
const LG_PAL = [
  // el     zen        hor        sun        sI    hs         hg         hI    sea        glow      glowK arch      archK beltK shadK exp
  [ 90,   '#6b9bcb', '#d6dee2', '#fff9ef', 0.72, '#e1e9ef', '#d2c9b6', 0.70, '#557471', '#fff6e6', 0.16, '#ffd9a8', 0,    0,    0,    0.45],
  [ 30,   '#6f9dcc', '#d8dfe2', '#fff6e8', 0.72, '#e2eaef', '#cfc6b2', 0.70, '#567471', '#fff3e0', 0.18, '#ffd9a8', 0,    0,    0,    0.45],
  [ 15,   '#78a2cb', '#dcdedb', '#ffecd0', 0.71, '#e3e8ec', '#c4b9a3', 0.64, '#58736f', '#ffeccc', 0.22, '#ffd09a', 0.04, 0,    0,    0.45],
  [  8,   '#7f9fc4', '#e0d9d0', '#ffd49c', 0.68, '#e0e0e2', '#b3a48c', 0.57, '#5a7170', '#ffdca8', 0.32, '#ffc88c', 0.12, 0,    0,    0.44],
  [  4,   '#8099bd', '#dccbbe', '#ffb46c', 0.62, '#dcd6d6', '#a08c74', 0.52, '#5a6c70', '#ffc488', 0.34, '#ffbe80', 0.20, 0.04, 0,    0.43],
  [  1.5, '#7c8fb6', '#d0b6aa', '#ff9550', 0.48, '#d6cac8', '#8c7764', 0.49, '#56636c', '#ffa060', 0.38, '#ffb274', 0.28, 0.10, 0.04, 0.42],
  [  0,   '#7183ab', '#c2a8a6', '#ff7e3e', 0.34, '#cabec6', '#76655b', 0.47, '#4e5a68', '#ff8a50', 0.40, '#ffa86a', 0.33, 0.14, 0.14, 0.41],
  [ -1.5, '#5a6fa0', '#ac949e', '#f07c56', 0.13, '#b0a8bc', '#625556', 0.44, '#434f61', '#f08c6a', 0.34, '#ff9a5e', 0.33, 0.16, 0.32, 0.40],
  [ -3.5, '#44599a', '#86819e', '#d08070', 0.08, '#8a90b4', '#4c4550', 0.42, '#37445a', '#d07a68', 0.24, '#f58c56', 0.30, 0.14, 0.45, 0.38],
  [ -6,   '#2f4a88', '#5c6890', '#8a7a98', 0.05, '#66749f', '#3c3842', 0.40, '#2a374e', '#a06c70', 0.14, '#d87c50', 0.27, 0.07, 0.35, 0.36],
  [ -9,   '#1e3062', '#40486a', '#6a6a8a', 0.04, '#4e5884', '#353138', 0.40, '#202b3e', '#704c50', 0.05, '#8c5442', 0.11, 0.02, 0.15, 0.34],
  [-13,   '#121c3a', '#33333f', '#5e6280', 0.045,'#42465c', '#3b3330', 0.43, '#18212d', '#000000', 0,    '#3a2a2a', 0.02, 0,    0,    0.32],
  [-18,   '#0e1426', '#302b30', '#5e6280', 0.05, '#3e404e', '#3f3329', 0.46, '#141b24', '#000000', 0,    '#000000', 0,    0,    0,    0.30],
  [-90,   '#0e1426', '#302b30', '#5e6280', 0.05, '#3e404e', '#3f3329', 0.46, '#141b24', '#000000', 0,    '#000000', 0,    0,    0,    0.30]
].map(r => r.map(v => typeof v === 'string' ? new THREE.Color(v) : v));
const LG_KEYS = ['el', 'zen', 'hor', 'sun', 'sI', 'hs', 'hg', 'hI', 'sea', 'glow', 'glowK', 'arch', 'archK', 'beltK', 'shadK', 'exp'];
const lgNewPal = () => { const P = {}; for (let k = 1; k < LG_KEYS.length; k++) P[LG_KEYS[k]] = typeof LG_PAL[0][k] === 'number' ? 0 : new THREE.Color(); return P; };
const LGP = lgNewPal();
const _lgc = new THREE.Color();
// palette at elevation el; morning (sun in the east) is a little paler and greyer than the evening
function lgPal(el, morning, P){
  P = P || LGP;
  let i = 0; while (i < LG_PAL.length - 2 && LG_PAL[i + 1][0] >= el) i++;
  const A = LG_PAL[i], B = LG_PAL[i + 1], u = Math.min(1, Math.max(0, (A[0] - el)/(A[0] - B[0])));
  for (let k = 1; k < LG_KEYS.length; k++){ const a = A[k], b = B[k]; if (typeof a === 'number') P[LG_KEYS[k]] = a + (b - a)*u; else P[LG_KEYS[k]].copy(a).lerp(b, u); }
  const m = morning ? 0.16*lgSm(14, 2, el)*lgSm(-12, -3, el) : 0;
  if (m > 0) for (const k of ['hor', 'zen', 'sun', 'hs', 'glow', 'arch']){ const c = P[k], l = 0.3*c.r + 0.59*c.g + 0.11*c.b; c.lerp(_lgc.setRGB(l, l, l*1.04), m); }
  if (m > 0){ P.archK *= 1 - 1.5*m; P.beltK *= 1 - 1.5*m; }
  return P;
}
// how much the city has switched to its night lights (window glow, lamps, neon) — by the light left in the sky
const LG_NIGHT = [[8, 0], [3, 0.06], [0, 0.25], [-2, 0.42], [-4, 0.6], [-6, 0.76], [-9, 0.9], [-12, 0.97], [-15, 1]];
function lgNight(el){ const T = LG_NIGHT; if (el >= T[0][0]) return 0; for (let i = 1; i < T.length; i++) if (el >= T[i][0]){ const a = T[i - 1], b = T[i], u = (a[0] - el)/(a[0] - b[0]); return a[1] + (b[1] - a[1])*u; } return 1; }
// fraction of lit windows by the clock (people's habits; Singapore keeps late hours)
const LG_LIT = [[0, 0.45], [2, 0.32], [4.5, 0.2], [6, 0.36], [7.5, 0.3], [9, 0.12], [17, 0.12], [18.5, 0.45], [19.5, 0.85], [20.5, 0.95], [22, 0.85], [23, 0.65], [24, 0.45]];
function lgLit(t){ const T = LG_LIT; for (let i = 1; i < T.length; i++) if (t <= T[i][0]){ const a = T[i - 1], b = T[i]; return a[1] + (b[1] - a[1])*(t - a[0])/(b[0] - a[0]); } return 0.45; }

/* ---------- the day: date, sunrise/sunset, KF table, phase labels, preset buttons ---------- */
const KF0 = KF.slice(), PH0 = PHASES.map(p => p.slice());
let PRE0 = null;
function lgDate(){
  let b; if (LG.fixed){ b = LG.fixed; } else { const n = new Date(); b = [n.getFullYear(), n.getMonth() + 1, n.getDate()]; }
  const d = new Date(b[0], b[1] - 1, b[2] + LG.dayOff);
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()];
}
function lgDay(){
  LG.site = SGR.on ? LG_SITE.sg : LG_SITE.gen; LG.mode = SGR.on ? 1 : 0; LG.ymd = lgDate();
  LG.key = LG.mode + ':' + LG.ymd.join('-');
  // sunrise / sunset / noon (2-minute scan)
  let prev = null, sr = 6.5, ss = 18.5, best = -2, noon = 12;
  for (let m = 0; m <= 1440; m += 2){ const t = m/60, e = lgElev(lgSunDir(t, LG.tmp)); if (prev !== null){ if (prev < -0.833 && e >= -0.833) sr = t; if (prev >= -0.833 && e < -0.833) ss = t; } if (e > best){ best = e; noon = t; } prev = e; }
  LG.sr = sr; LG.ss = ss; LG.noon = noon;
  // applyTime's keyframes every 10 minutes from the model
  KF.length = 0;
  const v = new THREE.Vector3();
  for (let i = 0; i <= 144; i++){
    const t = i/6, s = lgSunDir(t, v), el = lgElev(s), P = lgPal(el, s.x > 0, lgNewPal());
    KF.push({t, skyC:P.hor.clone(), sunC:P.sun.clone(), sI:P.sI, hsC:P.hs.clone(), hgC:P.hg.clone(), hI:P.hI, seaC:P.sea.clone(), night:lgNight(el), lit:lgLit(t)});
  }
  // phase names at the real times of this place and day
  const N = [sr - 0.9, sr + 0.25, sr + 2.4, noon - 0.9, noon + 1.2, ss - 0.9, ss + 0.2, ss + 0.75, 24];
  for (let i = 0; i < PHASES.length && i < N.length; i++) PHASES[i][0] = Math.round(N[i]*60)/60;
  // the dawn / noon / dusk / night buttons
  const bs = document.querySelectorAll('.tpre button');
  if (bs.length === 4){
    if (!PRE0) PRE0 = [...bs].map(b => b.dataset.t);
    const q = x => String(Math.round(x*12)/12);
    bs[0].dataset.t = q(sr - 0.1); bs[1].dataset.t = q(noon); bs[2].dataset.t = q(ss - 0.15); bs[3].dataset.t = '22';
  }
}
function lgRestore(){
  KF.length = 0; for (const k of KF0) KF.push(k);
  PH0.forEach((p, i) => { PHASES[i][0] = p[0]; });
  if (PRE0) document.querySelectorAll('.tpre button').forEach((b, i) => { b.dataset.t = PRE0[i]; });
  LG.key = '';
}

/* ---------- uniforms shared by the sky dome and the water ---------- */
const LGU = {
  lgZen:{value:new THREE.Color()}, lgHor:{value:new THREE.Color()}, lgGlowC:{value:new THREE.Color()}, lgArchC:{value:new THREE.Color()}, lgBeltC:{value:new THREE.Color(0.86, 0.6, 0.66)},
  lgCityC:{value:new THREE.Color(0.34, 0.25, 0.19)}, lgSunC:{value:new THREE.Color()}, lgMoonC:{value:new THREE.Color(0.94, 0.95, 1.0)}, lgGlintC:{value:new THREE.Color()},
  lgSun:{value:new THREE.Vector3(0, 1, 0)}, lgMoon:{value:new THREE.Vector3(0, -1, 0)}, lgGlint:{value:new THREE.Vector3(0, 1, 0)},
  lgGlowK:{value:0}, lgArchK:{value:0}, lgBeltK:{value:0}, lgShadK:{value:0}, lgCityK:{value:0}, lgOvc:{value:0}, lgExp:{value:0.45}, lgDiscK:{value:1}, lgStarK:{value:0},
  lgStarT:{value:0.9966}, lgMoonK:{value:0}, lgMoonR:{value:0.0066}, lgSunR:{value:0.0068}, lgTime:{value:0}, lgReflK:{value:0.75}, lgWaveK:{value:1}, lgOn:{value:1},
  lgStarRot:{value:new THREE.Matrix3()}, lgCam:{value:new THREE.Vector3()}
};
const LG_SKY_GLSL = `
uniform vec3 lgZen, lgHor, lgGlowC, lgArchC, lgBeltC, lgCityC, lgSun;
uniform float lgGlowK, lgArchK, lgBeltK, lgShadK, lgCityK, lgOvc, lgExp;
// clear sky along direction d (no discs, no stars): hazy gradient, aureole, twilight arch, Earth's shadow, Belt of Venus
vec3 lgSky(vec3 d){
  float hp = max(d.y, 0.0), t = pow(hp, lgExp);
  vec3 c = mix(lgHor, lgZen, t);
  float hl = length(d.xz), sl = length(lgSun.xz);
  float az = (hl > 1e-4 && sl > 1e-4) ? dot(d.xz/hl, lgSun.xz/sl) : 0.0, a01 = 0.5 + 0.5*az;
  float cs = max(dot(d, lgSun), 0.0), c2 = cs*cs, c4 = c2*c2, c16 = c4*c4*c4*c4;
  c += lgGlowC*lgGlowK*(0.22*c4 + 0.45*c16*c4*c4 + 0.8*pow(cs, 260.0));
  float low = exp(-hp*7.5);
  c += lgArchC*lgArchK*low*a01*a01*a01;
  float anti = (1.0 - a01)*(1.0 - a01);
  c = mix(c, c*vec3(0.6, 0.64, 0.8), lgShadK*anti*(1.0 - smoothstep(0.0, 0.08, hp)));
  c += lgBeltC*lgBeltK*anti*smoothstep(0.02, 0.1, hp)*(1.0 - smoothstep(0.12, 0.4, hp));
  c = mix(c, lgHor*(0.95 + 0.1*t), lgOvc);
  c += lgCityC*lgCityK*(0.35 + 0.65*low);                 // the city's light on the haze / the cloud deck
  return mix(c, lgHor, smoothstep(0.0, -0.04, d.y));
}`;

/* ---------- sky dome: a unit sphere around the camera, drawn first, at the far plane ---------- */
function lgBuildDome(){
  const geo = new THREE.SphereGeometry(1, 48, 24);
  const mat = new THREE.ShaderMaterial({
    uniforms:Object.assign({}, LGU),
    vertexShader:`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix*vec4((viewMatrix*vec4(position, 0.0)).xyz, 1.0);
  gl_Position = vec4(p.xy, p.w*0.99999, p.w);
}`,
    fragmentShader:LG_SKY_GLSL + `
uniform vec3 lgSunC, lgMoonC, lgMoon; uniform float lgDiscK, lgStarK, lgStarT, lgMoonK, lgMoonR, lgSunR, lgTime; uniform mat3 lgStarRot;
varying vec3 vDir;
float lgH(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7)))*43758.5453); }
void main(){
  vec3 d = normalize(vDir);
  vec3 c = lgSky(d);
  float vis = smoothstep(-0.004, 0.006, d.y);
  // sun disc (a little larger than life so it reads at 38 deg field of view)
  float cs = dot(d, lgSun);
  float sr = 1.0 - lgSunR*lgSunR*0.5;
  c = mix(c, lgSunC, lgDiscK*vis*smoothstep(sr - lgSunR*lgSunR*0.35, sr + lgSunR*lgSunR*0.2, cs));
  // stars: one candidate per ~0.8 deg cell, kept only if it lies on the sphere inside its cell; pinned to the sky
  if (lgStarK > 0.003 && d.y > 0.0){
    vec3 sd = lgStarRot*d, p = sd*72.0, cell = floor(p);
    float h = lgH(cell);
    if (h > lgStarT){
      vec3 j = vec3(lgH(cell + 17.3), lgH(cell + 41.9), lgH(cell + 73.1));
      vec3 sp = normalize(cell + 0.2 + 0.6*j);
      if (all(equal(floor(sp*72.0), cell))){
        float px = length(fwidth(sd)), ang = length(sd - sp);
        float m = (h - lgStarT)/(1.0 - lgStarT), b = 0.25 + 0.75*m*m*m;
        b *= 0.8 + 0.2*sin(lgTime*(2.0 + 3.0*j.x) + j.y*40.0);
        c += vec3(0.9 + 0.1*j.z, 0.92, 1.0 - 0.12*j.z)*b*lgStarK*smoothstep(1.5*px, 0.35*px, ang)*smoothstep(0.01, 0.3, d.y);
      }
    }
  }
  // moon: phase from the sun's direction, a few darker maria, faint earthshine, a soft halo in the haze
  if (lgMoonK > 0.002){
    float mc = dot(d, lgMoon);
    c += lgMoonC*lgMoonK*0.06*pow(max(mc, 0.0), 900.0)*vis;
    if (mc > 0.999){
      vec3 rt = normalize(cross(lgMoon, vec3(0.0, 1.0, 0.0)) + vec3(1e-5, 0.0, 0.0)), up = cross(rt, lgMoon);
      vec2 q = vec2(dot(d, rt), dot(d, up))/lgMoonR;
      float r2 = dot(q, q);
      if (r2 < 1.0){
        vec3 n = rt*q.x + up*q.y - lgMoon*sqrt(1.0 - r2);
        float lit = smoothstep(-0.06, 0.1, dot(n, lgSun));
        float mare = 1.0 - 0.22*smoothstep(0.35, 0.0, length(q - vec2(-0.25, 0.3))) - 0.18*smoothstep(0.3, 0.0, length(q - vec2(0.2, 0.05))) - 0.14*smoothstep(0.25, 0.0, length(q - vec2(-0.05, -0.35)));
        float edge = 1.0 - smoothstep(0.86, 1.0, r2);
        c += lgMoonC*lgMoonK*(lit*mare + 0.03)*edge*vis;
      }
    }
  }
  gl_FragColor = vec4(c, 1.0);
}`,
    depthTest:false, depthWrite:false, fog:false, side:THREE.BackSide, extensions:{derivatives:true}});
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = -1000; m.name = 'lgSky';
  scene.add(m); return m;
}

/* ---------- water: Fresnel sky reflection and a sun / moon glitter path on the sea material (and ponds) ---------- */
function lgWater(mat){
  if (!mat || mat.userData.lgWater) return;
  mat.userData.lgWater = true;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    Object.assign(sh.uniforms, LGU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLgW;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLgW = (modelMatrix*vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLgW;\nuniform vec3 lgGlint, lgGlintC, lgCam; uniform float lgReflK, lgWaveK, lgTime, lgOn;\n' + LG_SKY_GLSL)
      .replace('#include <envmap_fragment>', `#include <envmap_fragment>
if (lgOn > 0.5){
  vec3 lgV = lgCam - vLgW; float lgD = length(lgV); lgV /= lgD;   // lgCam: three.js does not upload cameraPosition for Lambert
  // ripples near the camera (fade out before they alias), a calm statistical surface further away
  vec2 lq = vLgW.xz; float lt = lgTime;
  float lw = lgWaveK*(1.0 - smoothstep(60.0, 900.0, lgD));
  vec2 lg = lw*(0.05*vec2(cos(lq.x*0.21 + lq.y*0.07 + lt*1.3), cos(lq.y*0.19 - lq.x*0.05 + lt*1.1))
             + 0.03*vec2(cos(lq.x*0.61 - lq.y*0.43 + lt*2.1), cos(lq.y*0.67 + lq.x*0.31 - lt*1.9)));
  vec3 lN = normalize(vec3(lg.x, 1.0, lg.y));
  float lc = max(dot(lN, lgV), 0.0), lF = 0.02 + 0.98*pow(1.0 - lc, 5.0);
  vec3 lR = reflect(-lgV, lN); lR.y = abs(lR.y);
  outgoingLight = mix(outgoingLight, lgSky(lR), lF*lgReflK);
  // glitter: Beckmann-like lobe of a wavy sea (slope rms ~0.13), sparkle near the camera
  vec3 lH = normalize(lgV + lgGlint); float lch = max(lH.y, 1e-3), lt2 = (1.0 - lch*lch)/(lch*lch);
  float lgl = exp(-lt2/0.017)*(0.35 + 0.65*lF)*smoothstep(-0.02, 0.06, lgGlint.y);
  lgl *= 1.0 + lw*1.8*(sin(lq.x*1.7 + lt*3.0)*sin(lq.y*1.9 - lt*2.6));
  outgoingLight += lgGlintC*max(lgl, 0.0);
  diffuseColor.a = mix(diffuseColor.a, 1.0, lF*lgReflK);
}`);
  };
  mat.needsUpdate = true;
}

/* ---------- applying a time of day ---------- */
const _lgv = new THREE.Vector3(), _lgm = new THREE.Vector3(), _lgh = new THREE.Color();
const LG_NIGHTDIR = new THREE.Vector3(0.28, 0.9, 0.33).normalize(), LG_M4 = new THREE.Matrix4();
function lgApply(t){
  const site = LG.site, jd = lgJDAt(t);
  const s = lgLocal(lgSunEq(jd), jd, site, LG.sunV), el = lgElev(s);
  const m = lgLocal(lgMoonEq(jd), jd, site, LG.moonV), mel = lgElev(m);
  LG.el = el; LG.az = Math.atan2(s.x, -s.z)/LGD; LG.mel = mel; LG.maz = Math.atan2(m.x, -m.z)/LGD;
  LG.illum = (1 - s.dot(m))/2;
  const morning = s.x > 0, P = lgPal(el, morning), night = lgNight(el);
  // moonlight (after twilight): brightness falls steeply away from full moon
  const moonI = 0.16*Math.pow(LG.illum, 1.6)*lgSm(-1, 12, mel)*lgSm(-3, -9, el);
  LG.moonI = moonI;
  // the directional light: the sun; in twilight the bright sky on the sun's side (raised so shadows stay sane);
  // at night the moon if it is up, else a faint glow from high up
  let dirI = P.sI;
  const dir = _lgv;
  if (moonI > Math.max(0.035, P.sI*0.9) && el < -4){
    dir.copy(m); if (dir.y < 0.12){ dir.y = 0.12; dir.normalize(); }
    dirI = Math.max(moonI, P.sI); sun.color.setRGB(0.74, 0.8, 0.92).lerp(P.sun, 0.25); LG.dirSrc = 'moon';
  } else if (el > -8.5){
    const eu = el >= 3 ? el : el + (12 - el)*lgSm(3, -3, el), h = Math.hypot(s.x, s.z) || 1;
    dir.set(s.x/h*Math.cos(eu*LGD), Math.sin(eu*LGD), s.z/h*Math.cos(eu*LGD)); sun.color.copy(P.sun); LG.dirSrc = el > 0 ? 'sun' : 'twilight';
  } else { dir.copy(LG_NIGHTDIR); sun.color.copy(P.sun); LG.dirSrc = 'night'; }
  sunDir.copy(dir);
  sun.intensity = dirI;
  // sky light and ground bounce; a full moon lifts the night a little
  hemi.color.copy(P.hs).multiplyScalar(1 + 0.6*moonI); hemi.groundColor.copy(P.hg); hemi.intensity = P.hI;
  scene.background.copy(P.hor); scene.fog.color.copy(P.hor);
  sea.material.color.copy(P.sea);
  // stars: few over a light-polluted city, none in twilight or under a bright moon
  LG.starK = lgSm(-9, -15, el)*(SGR.on ? 0.75 : 1)*(1 - 0.55*lgSm(0.5, 1, LG.illum)*lgSm(0, 15, mel));
  stars.material.opacity = LG.starK; stars.visible = false;
  // dome uniforms (the frame hook adds the weather on top)
  LG.zen = (LG.zen || new THREE.Color()).copy(P.zen); LG.hor = (LG.hor || new THREE.Color()).copy(P.hor);
  LGU.lgGlowC.value.copy(P.glow); LGU.lgGlowK.value = P.glowK; LGU.lgArchC.value.copy(P.arch); LGU.lgArchK.value = P.archK;
  LGU.lgBeltK.value = P.beltK; LGU.lgShadK.value = P.shadK; LGU.lgExp.value = P.exp;
  LGU.lgSun.value.copy(s);
  // sun disc: white-hot high up, orange and dimmer in the low haze
  const tr = lgSm(-0.6, 6, el), sc = LGU.lgSunC.value.copy(P.sun).lerp(_lgh.setRGB(1, 0.97, 0.9), lgSm(10, 40, el));
  sc.multiplyScalar((0.92 + 1.5*tr)/Math.max(sc.r, sc.g, sc.b, 0.01)); LG.discK = lgSm(-0.9, 0.3, el);
  LGU.lgMoon.value.copy(m);
  LG.moonK = lgSm(-1, 1.5, mel)*(0.25 + 0.75*lgSm(2, -8, el))*(0.35 + 0.65*Math.sqrt(LG.illum))*(LG.illum > 0.04 ? 1 : 0)*(0.55 + 0.45*lgSm(0, 15, mel));
  LGU.lgMoonC.value.setRGB(1, 0.74, 0.5).lerp(_lgh.setRGB(0.94, 0.95, 1), lgSm(1, 18, mel));   // low moon: yellow-orange through the haze
  LG.cityK = SGR.on ? 0.55 : 0.3;
  LG.night = night;
  // glitter on the water: the sun by day, the moon at night
  if (el > -1){ LGU.lgGlint.value.copy(s); LG.glint = (0.25 + 1.1*P.sI)*lgSm(-1, 2, el); LG.glintC = P.sun; }
  else { LGU.lgGlint.value.copy(m); LG.glint = 6*moonI; LG.glintC = LGU.lgMoonC.value; }
  // stars turn with the local sidereal time about the celestial pole (on the northern horizon at 1.35 N)
  const lst = (lgGMST(jd) + site.lon)*LGD, p = site.lat*LGD, ax = _lgm.set(0, Math.sin(p), -Math.cos(p));
  LGU.lgStarRot.value.setFromMatrix4(LG_M4.makeRotationAxis(ax, lst));
}

/* ---------- per frame: weather on top of the base sky, fog distance, the dome, the shadow box ---------- */
const _lgz = new THREE.Color(), _lgq = new THREE.Vector3(), _lgx = new THREE.Vector3(), _lgy = new THREE.Vector3(), _lgf = new THREE.Vector3(), LG_UP = new THREE.Vector3(0, 1, 0);
// the weather's state (read only while it is not clear, or still easing out of it)
const LGW = {ovc:0, milk:0, live:false};
function lgWeather(){
  const W = window.SGWx;
  if (!W || (W.mode === 'clear' && !LGW.live)){ LGW.ovc = LGW.milk = 0; return LGW; }
  const s = W.state; LGW.ovc = s.ovc; LGW.milk = s.vis*s.milk;
  LGW.live = W.mode !== 'clear' || s.ovc + s.vis + s.cov + s.deck > 1e-3;
  return LGW;
}
function lgFrame(t){
  if (!LG.on) return;
  if ((SGR.on ? 1 : 0) !== LG.mode && !LG.inApply){ LG.inApply = true; try { applyTime(); } finally { LG.inApply = false; } }
  // fog: aerial perspective that follows the view distance (wx pulls it in further for haze and rain)
  const D = camera.position.distanceTo(controls.target), k = HALF/28000, nk = 1 + 0.4*lgSm(0.3, 1, LG.night);
  LG.fogN = Math.min(SGR.on ? 36000 : 22000, 300*k + 0.9*D); LG.fogF = Math.max(LG.fogN + 2000, (22000*k + 3.2*D)*nk);
  scene.fog.near = LG.fogN; scene.fog.far = LG.fogF;
}
function lgPre(t){
  if (!LG.on || !LG.dome || !LG.zen) return;
  const t0 = performance.now();
  const {ovc, milk} = lgWeather();
  const oc = Math.min(1, ovc*0.95 + milk*0.85);
  LGU.lgHor.value.copy(scene.background);                         // the fog colour, with the weather on it
  const L = 0.3*scene.background.r + 0.59*scene.background.g + 0.11*scene.background.b;
  LGU.lgZen.value.copy(LG.zen).lerp(_lgz.setRGB(L, L, L*1.03), Math.min(1, ovc*0.85));
  LGU.lgOvc.value = oc;
  LGU.lgCityK.value = LG.cityK*LG.night*(0.25 + 0.9*ovc + 0.4*milk);
  LGU.lgDiscK.value = LG.discK*(1 - oc)*(1 - 0.5*milk);
  LGU.lgStarK.value = stars.material.opacity;                      // wx dims it under clouds
  LGU.lgMoonK.value = LG.moonK*(1 - oc);
  LGU.lgGlintC.value.copy(LG.glintC).multiplyScalar(LG.glint*(1 - 0.85*oc)*Math.min(1.2, sun.intensity/Math.max(0.03, LG.dirI0 || sun.intensity)));
  LGU.lgTime.value = t % 3600;
  LGU.lgStarT.value = SGR.on ? 0.9966 : 0.9925;
  LG.dome.position.copy(camera.position);
  LGU.lgCam.value.copy(camera.position);
  lgFogColour();
  lgShadow();
  LG.ms = LG.ms*0.95 + (performance.now() - t0)*0.05;
}
// the fog is the haze in front of the sky: its colour is the dome's horizon in the direction the camera looks
// (warm towards a low sun, the Earth's shadow on the other side); same formula as lgSky() at elevation 0
const _lgs = new THREE.Color();
function lgFogColour(){
  const U = LGU, c = scene.fog.color;
  camera.getWorldDirection(_lgf); _lgf.y = 0; const hl = _lgf.length();
  const sv = U.lgSun.value, sl = Math.hypot(sv.x, sv.z);
  const az = hl > 1e-4 && sl > 1e-4 ? (_lgf.x*sv.x + _lgf.z*sv.z)/(hl*sl) : 0, a01 = 0.5 + 0.5*az, anti = (1 - a01)*(1 - a01);
  const cs = hl > 1e-4 ? Math.max(0, (_lgf.x*sv.x + _lgf.z*sv.z)/hl) : 0, c4 = cs*cs*cs*cs;
  c.copy(U.lgHor.value);
  const g = U.lgGlowK.value*(0.22*c4 + 0.45*c4*c4*c4*c4*c4*c4 + 0.8*Math.pow(cs, 260));
  c.r += U.lgGlowC.value.r*g; c.g += U.lgGlowC.value.g*g; c.b += U.lgGlowC.value.b*g;
  const a = U.lgArchK.value*a01*a01*a01; c.r += U.lgArchC.value.r*a; c.g += U.lgArchC.value.g*a; c.b += U.lgArchC.value.b*a;
  const sh = U.lgShadK.value*anti; c.r *= 1 - 0.4*sh; c.g *= 1 - 0.36*sh; c.b *= 1 - 0.2*sh;
  const o = U.lgOvc.value; c.lerp(_lgs.copy(U.lgHor.value).multiplyScalar(0.95), o);
  const k = U.lgCityK.value; c.r += U.lgCityC.value.r*k; c.g += U.lgCityC.value.g*k; c.b += U.lgCityC.value.b*k;
}
// the shadow box: wider and pushed forward for low views, snapped to its texel grid in light space
function lgShadow(){
  const tg = controls.target, cp = camera.position, D = cp.distanceTo(tg);
  const ce = Math.asin(Math.max(-1, Math.min(1, (cp.y - tg.y)/Math.max(1, D))));
  const obl = 1 - lgSm(0.35, 1.0, ce);
  let span = Math.min(3200, Math.max(260, D*0.75))*(1 + 0.45*obl);
  span = Math.pow(2, Math.round(Math.log2(span)*8)/8);
  _lgf.set(tg.x - cp.x, 0, tg.z - cp.z); if (_lgf.lengthSq() > 1e-6) _lgf.normalize();
  const C = _lgq.copy(tg).addScaledVector(_lgf, span*0.5*obl);
  const z = sunDir; _lgx.crossVectors(LG_UP, z); if (_lgx.lengthSq() < 1e-8) _lgx.set(1, 0, 0); _lgx.normalize(); _lgy.crossVectors(z, _lgx);
  const tx = 2*span/sun.shadow.mapSize.x, a = Math.round(C.dot(_lgx)/tx)*tx, b = Math.round(C.dot(_lgy)/tx)*tx, c = C.dot(z);
  C.set(0, 0, 0).addScaledVector(_lgx, a).addScaledVector(_lgy, b).addScaledVector(z, c);
  const dist = Math.max(span*2.6 + 600, Math.min(7000, 420/Math.max(0.06, z.y)));
  sun.target.position.copy(C); sun.position.copy(z).multiplyScalar(dist).add(C);
  const cam = sun.shadow.camera, far = dist*2 + span*4 + 3000;
  if (span !== LG.span || cam.right !== span || Math.abs(cam.far - far) > far*0.05){
    LG.span = span; Object.assign(cam, {left:-span, right:span, top:span, bottom:-span, near:10, far}); cam.updateProjectionMatrix();
  }
}

/* ---------- hooks ---------- */
HOOKS.time.push(t => {
  if (!LG.on) return;
  // the date moves on with the simulated days (like the weather plan)
  if (LG.prevT !== null){ if (LG.prevT > 18 && t < 6) LG.dayOff++; else if (LG.prevT < 6 && t > 18) LG.dayOff--; }
  LG.prevT = t;
  const key = (SGR.on ? 1 : 0) + ':' + lgDate().join('-');
  if (key !== LG.key){
    lgDay();
    if (!LG.inApply){ LG.inApply = true; try { applyTime(); } finally { LG.inApply = false; } return; }   // rerun with the new table (night factor, labels)
  }
  lgApply(t);
  LG.dirI0 = sun.intensity;
  // the interface (labels with light text, dark bars) follows the light in the scene: dark from ~10 min before sunset
  document.body.classList.toggle('night', LG.el < 2.5);
});
HOOKS.frame.push(lgFrame);
HOOKS.prerender.push(lgPre);
HOOKS.boot.push(() => {
  LG.dome = lgBuildDome();
  lgWater(sea.material);
  try { if (typeof matSgrPond !== 'undefined'){ LG.pond = matSgrPond; LG.pond0 = matSgrPond.color.getHex(); matSgrPond.color.set('#5f7c76'); lgWater(matSgrPond); } } catch (e){ /* not in this build */ }
  LG.key = ''; applyTime();
});

window.SGLight = {
  info:() => ({site:LG.site.name, date:LG.ymd.join('-'), tod:+tod.toFixed(3), sun:{el:+LG.el.toFixed(2), az:+LG.az.toFixed(1)}, moon:{el:+LG.mel.toFixed(2), az:+LG.maz.toFixed(1), illum:+LG.illum.toFixed(3), light:+LG.moonI.toFixed(3), disc:+(LG.moonK || 0).toFixed(3)}, stars:+LG.starK.toFixed(3),
    sunrise:LG.sr.toFixed(3), sunset:LG.ss.toFixed(3), noon:LG.noon.toFixed(3), nightF:+nightF.toFixed(3), lit:+NIGHT.uLit.value.toFixed(3), dir:LG.dirSrc, sunI:+sun.intensity.toFixed(3), hemiI:+hemi.intensity.toFixed(3),
    sky:'#' + scene.background.getHexString(), zen:'#' + LGU.lgZen.value.getHexString(), fog:[Math.round(scene.fog.near), Math.round(scene.fog.far)], shadowSpan:Math.round(LG.span), ms:+LG.ms.toFixed(3)}),
  get date(){ return LG.ymd.join('-'); },
  set date(v){ if (!v || v === 'today'){ LG.fixed = null; } else { const q = String(v).split('-').map(Number); if (q.length === 3 && q.every(Number.isFinite)) LG.fixed = q; } LG.dayOff = 0; LG.key = ''; applyTime(); },
  get enabled(){ return LG.on; },
  set enabled(v){
    LG.on = !!v;
    if (!LG.on){ lgRestore(); if (LG.dome) LG.dome.visible = false; LGU.lgOn.value = 0; if (LG.pond) LG.pond.color.setHex(LG.pond0); scene.fog.near = SGR.on ? 36000 : 22000; scene.fog.far = SGR.on ? 115000 : 68000; LG.span = 0; shadowSpan = 0; }
    else { if (LG.dome) LG.dome.visible = true; LGU.lgOn.value = 1; LG.key = ''; if (LG.pond) LG.pond.color.set('#5f7c76'); }
    applyTime();
  },
  sun:t => { const v = lgSunDir(t, new THREE.Vector3()); return {el:+lgElev(v).toFixed(2), dir:[+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)]}; },
  bench:() => { const t0 = performance.now(); for (let i = 0; i < 200; i++) lgApply(tod); const t1 = performance.now(); for (let i = 0; i < 200; i++) lgPre(0); const t2 = performance.now(); return {apply:(t1 - t0)/200, frame:(t2 - t1)/200}; },
  U:LGU
};
}
