/* ================= render50: ocean (render50/water.js, injected by render50/post_render50.py; every city) =================
   The sea material (sea.material: the 200 km sea plane, the real-map sea polygon and the inland water bodies; the lakes of the Fuji
   module) gets a physically based water surface on top of the light module's sky (lm20/light: lgSky(), LGU uniforms):
   - waves: one procedural slope map (256 px, ~40 directional waves with integer wave numbers so it tiles; made once at start from a
     fixed seed) sampled at three scales that drift with the wind (SGWx.state.wind); the detail a pixel cannot resolve is not dropped
     but moved into the roughness of the sun / moon lobe (variance kept), so the glitter path stays right at every distance;
   - Fresnel (Schlick, F0 = 0.02 for water) between the water body colour (the light module's palette) and the reflection;
   - reflection: the analytic sky of the light module along the wave-perturbed reflected ray, plus (quality 1 / 2) a planar mirror pass
     of the scene at reduced resolution (skyline, hills, ships, the city's night lights), distorted by the wave slopes; the sky in that
     pass is left transparent and comes from lgSky(), so the dome is not drawn twice; trees, minor roads and small buildings are left
     out of the mirror pass, shadows are not re-rendered for it, and it is skipped when no water is on screen or the camera is high;
   - sun / moon glint: GGX (Trowbridge-Reitz) lobe with the Smith visibility term and Fresnel at the half vector;
   - shore: a signed distance-to-coast texture made from the land / water grid (nat) gives a thin moving foam line at the coast and
     calmer water in enclosed basins (fewer waves within a few hundred metres of land); a rendering heuristic, not bathymetry
     (the map data has no water depths).
   Quality: 2 = mirror pass at 1/2 resolution, 1 = 1/3, 0 = sky reflection only. Phones (CB_MOBILE) start at 0 without the coast
   texture; desktops start at 2 and step down when frames are slow (EMA of the frame time > 34 ms for 3 s). ?r50q=0|1|2 pins a level,
   ?r50=0 turns the whole render50 block off, ?r50water=0 only this part. Test handle: window.R50.water {info(), set(q), on}. */
{
const R50 = window.R50 = window.R50 || {parts:{}};
const R5Q = /[?&]r50q=(\d)/.exec(location.search), R5OFF = /[?&]r50=0/.test(location.search) || /[?&]r50water=0/.test(location.search);
const R5 = {on:false, q:window.CB_MOBILE ? 0 : 2, pinned:R5Q ? +R5Q[1] : -1, rt:null, ema:16, slow:0, lastT:0, lastStep:0, pass:false, passMs:0, passCalls:0,
  vis:1, visF:0, coast:null, coastM:0, var:[0, 0, 0], hidden:[], dome:null, bg:null, cc:new THREE.Color(), skipWhy:'', frames:0, ran:0};
if (R5.pinned >= 0) R5.q = Math.min(2, R5.pinned);
const R5U = {
  r5On:{value:0}, r5Nrm:{value:null}, r5Refl:{value:null}, r5ReflOn:{value:0}, r5TexM:{value:new THREE.Matrix4()}, r5PlaneY:{value:-0.05},
  r5Px:{value:0.001}, r5Wind:{value:new THREE.Vector2(0.8, 0.6)}, r5Amp:{value:1}, r5Coast:{value:null}, r5CoastOn:{value:0},
  r5CoastT:{value:new THREE.Vector4(0, 0, 1, 1)}, r5Var:{value:new THREE.Vector3()}, r5SunK:{value:4.0}, r5FoamK:{value:0.55}, r5Rough0:{value:0.0016}
};
R50.parts.water = R5;

/* ---------- the wave slope map: tileable sum of directional waves (fixed seed) ---------- */
function r5SlopeTex(){
  const S = 256, rnd = mulberry32(50077), W = [];
  // integer wave numbers (cycles per tile) around the wind direction (+x), spectrum ~ k^-3.5 with a cos^4 spread
  for (let n = 0; W.length < 40 && n < 4000; n++){
    const kx = Math.round((rnd()*2 - 1)*22), ky = Math.round((rnd()*2 - 1)*22), k = Math.hypot(kx, ky);
    if (k < 2.5 || k > 23) continue;
    const c = kx/k; if (c < -0.2) continue;
    const spread = Math.pow(Math.max(0, 0.35 + 0.65*c), 4);
    if (rnd() > spread + 0.04) continue;
    W.push([kx, ky, Math.pow(k, -1.75)*(0.6 + 0.4*rnd()), rnd()*Math.PI*2]);
  }
  const sx = new Float32Array(S*S), sy = new Float32Array(S*S), TAU = Math.PI*2;
  for (const [kx, ky, a, ph] of W){
    // slope of a*cos(2pi(k.p) + ph): -a*2pi*k*sin(...); rows / columns of the sine table make this separable-cheap
    const cx = new Float32Array(S), sxx = new Float32Array(S), cy = new Float32Array(S), syy = new Float32Array(S);
    for (let i = 0; i < S; i++){ cx[i] = Math.cos(TAU*kx*i/S); sxx[i] = Math.sin(TAU*kx*i/S); cy[i] = Math.cos(TAU*ky*i/S + ph); syy[i] = Math.sin(TAU*ky*i/S + ph); }
    const gx = -a*TAU*kx, gy = -a*TAU*ky;
    for (let j = 0; j < S; j++){ const c1 = cy[j], s1 = syy[j]; for (let i = 0; i < S; i++){ const s = sxx[i]*c1 + cx[i]*s1, o = j*S + i; sx[o] += gx*s; sy[o] += gy*s; } }
  }
  let v = 0, m = 0; for (let o = 0; o < S*S; o++){ v += sx[o]*sx[o] + sy[o]*sy[o]; m = Math.max(m, Math.abs(sx[o]), Math.abs(sy[o])); }
  v /= S*S;
  const rms = Math.sqrt(v), scale = 1/(3*rms), d = new Uint8Array(S*S*4);   // stored slope / (3 rms) in [-1, 1] (clipped: < 0.3 % of texels)
  for (let o = 0; o < S*S; o++){ d[o*4] = Math.round(127.5 + 127.5*Math.max(-1, Math.min(1, sx[o]*scale))); d[o*4 + 1] = Math.round(127.5 + 127.5*Math.max(-1, Math.min(1, sy[o]*scale))); d[o*4 + 2] = 128; d[o*4 + 3] = 255; }
  const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  t.anisotropy = Math.min(window.CB_MOBILE ? 2 : 4, renderer.capabilities.getMaxAnisotropy()); t.needsUpdate = true;
  R5.waves = W.length; R5.slopeRms = rms;
  return t;   // the shader multiplies the decoded value by 3 to get slopes in units of the map's rms slope
}

/* ---------- signed distance to the coast (from the land / water grid), for the foam line and sheltered water ---------- */
function r5CoastTex(){
  if (typeof nat === 'undefined' || !nat || !N) return null;
  const M = Math.min(2048, N), f = N/M, A = new Float32Array(M*M), Bd = new Float32Array(M*M), INF = 1e9;
  const water = new Uint8Array(M*M);
  for (let j = 0; j < M; j++){ const jj = Math.min(N - 1, Math.floor((j + 0.5)*f))*N; for (let i = 0; i < M; i++){ const v = nat[jj + Math.min(N - 1, Math.floor((i + 0.5)*f))]; water[j*M + i] = v === 1 || v === 2 ? 1 : 0; } }
  // chamfer distance (1, sqrt 2) in texels: A = distance from water texels to land, Bd = from land to water
  for (let o = 0; o < M*M; o++){ A[o] = water[o] ? INF : 0; Bd[o] = water[o] ? 0 : INF; }
  const D2 = Math.SQRT2;
  for (const G of [A, Bd]){
    for (let j = 0; j < M; j++) for (let i = 0; i < M; i++){ const o = j*M + i; let v = G[o]; if (!v) continue;
      if (i > 0) v = Math.min(v, G[o - 1] + 1); if (j > 0){ v = Math.min(v, G[o - M] + 1); if (i > 0) v = Math.min(v, G[o - M - 1] + D2); if (i < M - 1) v = Math.min(v, G[o - M + 1] + D2); } G[o] = v; }
    for (let j = M - 1; j >= 0; j--) for (let i = M - 1; i >= 0; i--){ const o = j*M + i; let v = G[o]; if (!v) continue;
      if (i < M - 1) v = Math.min(v, G[o + 1] + 1); if (j < M - 1){ v = Math.min(v, G[o + M] + 1); if (i < M - 1) v = Math.min(v, G[o + M + 1] + D2); if (i > 0) v = Math.min(v, G[o + M - 1] + D2); } G[o] = v; }
  }
  // signed metres (water > 0), stored as 128 + 127*sign*sqrt(|d| / 2400 m)
  const tx = 2*HALF/M, d = new Uint8Array(M*M);
  for (let o = 0; o < M*M; o++){ const s = water[o] ? (A[o] - 0.5)*tx : -(Bd[o] - 0.5)*tx, q = Math.sqrt(Math.min(1, Math.abs(s)/2400)); d[o] = Math.round(128 + (s >= 0 ? 127 : -127)*q); }
  const t = new THREE.DataTexture(d, M, M, THREE.LuminanceFormat);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
  R5.coastM = M; R5.coastTx = tx;
  R5U.r5CoastT.value.set(HALF, HALF, 1/(2*HALF), 1/(2*HALF));
  return t;
}

/* ---------- the shader (appended after the light module's water block, which it replaces while on) ---------- */
const R5_DECL = `
uniform sampler2D r5Nrm, r5Refl, r5Coast; uniform mat4 r5TexM; uniform vec2 r5Wind; uniform vec3 r5Var; uniform vec4 r5CoastT;
uniform float r5On, r5ReflOn, r5PlaneY, r5Px, r5Amp, r5CoastOn, r5SunK, r5FoamK, r5Rough0;`;
const R5_FRAG = `
if (r5On > 0.5){
  vec3 wV = lgCam - vLgW; float wD = length(wV); wV /= wD;
  vec2 wP = vLgW.xz; float wT = lgTime;
  // coast: signed distance (m, water > 0) -> calmer water near land, foam line at the coast
  float wC = 2400.0, wCalm = 1.0;
  if (r5CoastOn > 0.5){
    float cq = texture2D(r5Coast, vec2((wP.x + r5CoastT.x)*r5CoastT.z, (-wP.y + r5CoastT.y)*r5CoastT.w)).r*255.0 - 128.0;
    wC = sign(cq)*(cq/127.0)*(cq/127.0)*2400.0;
    wCalm = 0.45 + 0.55*smoothstep(20.0, 700.0, wC);
  }
  // pixel footprint on the water (m): stretched along the view by 1/cos
  float wCos = max(wV.y, 0.03), wFp = wD*r5Px/sqrt(wCos);
  vec2 wd = r5Wind, wq = vec2(-wd.y, wd.x);
  // three scales of the slope map (tile sizes 61, 17.3, 5.9 m), drifting with the wind at roughly their phase speeds
  vec2 u1 = vec2(dot(wP, wd), dot(wP, wq))/61.0 - vec2(wT*0.0262, 0.0);
  vec2 u2 = vec2(dot(wP, vec2(wd.x*0.94 - wd.y*0.34, wd.y*0.94 + wd.x*0.34)), dot(wP, vec2(-wd.y*0.94 - wd.x*0.34, wd.x*0.94 - wd.y*0.34)))/17.3 - vec2(wT*0.0412, wT*0.006);
  vec2 u3 = vec2(dot(wP, vec2(wd.x*0.87 + wd.y*0.5, wd.y*0.87 - wd.x*0.5)), dot(wP, vec2(-wd.y*0.87 + wd.x*0.5, wd.x*0.87 + wd.y*0.5)))/5.9 + vec2(wT*0.071, -wT*0.012);
  // how much of each scale one pixel still resolves (the map has ~45 texels per smallest wave)
  float k1 = 1.0/(1.0 + pow(wFp/(61.0/24.0), 2.0)), k2 = 1.0/(1.0 + pow(wFp/(17.3/24.0), 2.0)), k3 = 1.0/(1.0 + pow(wFp/(5.9/24.0), 2.0));
  float a1 = 0.55*r5Amp*wCalm, a2 = 0.38*r5Amp*wCalm, a3 = 0.26*r5Amp*wCalm;   // slope rms per scale
  vec2 s1 = (texture2D(r5Nrm, u1).rg*2.0 - 1.0)*3.0, s2 = (texture2D(r5Nrm, u2).rg*2.0 - 1.0)*3.0, s3 = (texture2D(r5Nrm, u3).rg*2.0 - 1.0)*3.0;
  // back to world axes (each scale was sampled in its own rotated frame)
  vec2 sl = a1*k1*(s1.x*wd + s1.y*wq) * 0.12
          + a2*k2*(s2.x*vec2(wd.x*0.94 - wd.y*0.34, wd.y*0.94 + wd.x*0.34) + s2.y*vec2(-wd.y*0.94 - wd.x*0.34, wd.x*0.94 - wd.y*0.34)) * 0.12
          + a3*k3*(s3.x*vec2(wd.x*0.87 + wd.y*0.5, wd.y*0.87 - wd.x*0.5) + s3.y*vec2(-wd.y*0.87 + wd.x*0.5, wd.x*0.87 + wd.y*0.5)) * 0.12;
  // variance the pixel cannot show -> roughness (GGX alpha^2 ~ 2 sigma^2), plus the sub-texel capillary floor
  float wLost = 0.0144*(a1*a1*(1.0 - k1*k1) + a2*a2*(1.0 - k2*k2) + a3*a3*(1.0 - k3*k3)) + 0.0144*0.08*r5Amp*wCalm;
  float wA2 = clamp(r5Rough0 + 2.0*wLost, 0.0008, 0.5);
  vec3 wN = normalize(vec3(-sl.x, 1.0, -sl.y));
  float wNV = max(dot(wN, wV), 0.002);
  float wF = 0.02 + 0.98*pow(1.0 - wNV, 5.0);
  vec3 wR = reflect(-wV, wN); wR.y = abs(wR.y);
  vec3 wEnv = lgSky(wR);
  // planar mirror of the scene (premultiplied: the sky in it is transparent)
  if (r5ReflOn > 0.5){
    vec4 pc = r5TexM*vec4(vLgW.x, r5PlaneY, vLgW.z, 1.0);
    vec2 ruv = pc.xy/pc.w + sl*vec2(0.55, 0.9)*(0.06 + 0.94/(1.0 + wD*0.0015));
    vec4 rc = texture2D(r5Refl, ruv);
    float rw = (1.0 - smoothstep(2.0, 3.2, abs(vLgW.y - r5PlaneY)))*smoothstep(0.0, 0.03, ruv.x)*smoothstep(1.0, 0.97, ruv.x)*smoothstep(0.0, 0.02, ruv.y)*smoothstep(1.0, 0.97, ruv.y);
    wEnv = mix(wEnv, rc.rgb + wEnv*(1.0 - rc.a), rw);
  }
  // sun / moon: GGX lobe, Smith visibility, Fresnel at the half vector
  vec3 wL = lgGlint, wH = normalize(wV + wL);
  float wNL = max(dot(wN, wL), 0.0), wNH = max(dot(wN, wH), 0.0), wdd = wNH*wNH*(wA2 - 1.0) + 1.0;
  float wDg = wA2/(3.14159*wdd*wdd);
  float wVis = 0.5/(wNL*sqrt(wNV*wNV*(1.0 - wA2) + wA2) + wNV*sqrt(wNL*wNL*(1.0 - wA2) + wA2) + 1e-4);
  float wFH = 0.02 + 0.98*pow(1.0 - max(dot(wV, wH), 0.0), 5.0);
  vec3 wSpec = lgGlintC*min(wDg*wVis*wFH*wNL*r5SunK, 24.0)*smoothstep(-0.02, 0.05, wL.y);
  vec3 wCol = mix(outgoingLight, wEnv, wF) + wSpec;
  // foam: a thin broken line at the coast, moving with the waves (weaker in calm water and at night by the body colour)
  if (r5CoastOn > 0.5 && r5FoamK > 0.0 && wC < 40.0){
    float fn = texture2D(r5Nrm, u2*0.37 + vec2(wT*0.011, 0.0)).r*0.6 + texture2D(r5Nrm, u3*0.5).g*0.4;
    float band = (1.0 - smoothstep(0.0, 6.0 + 10.0*fn, wC + 2.0*sin(wT*0.9 + dot(wP, wd)*0.08)))*smoothstep(-4.0, 0.0, wC);
    float foam = band*smoothstep(0.42, 0.62, fn)*r5FoamK*r5Amp*(1.0 - smoothstep(600.0, 2500.0, wD));
    wCol = mix(wCol, (outgoingLight + vec3(0.35))*1.15 + lgGlintC*0.15, foam);
  }
  outgoingLight = wCol;
  diffuseColor.a = mix(diffuseColor.a, 1.0, max(wF, r5ReflOn*0.5));
}
`;
function r5Patch(mat){
  if (!mat || mat.userData.r5) return false;
  if (!mat.userData.lgWater) return false;           // needs the light module's water (lgSky, LGU, vLgW)
  mat.userData.r5 = true;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    Object.assign(sh.uniforms, R5U);
    let f = sh.fragmentShader;
    const A = 'if (lgOn > 0.5){', G = 'gl_FragColor = vec4( outgoingLight, diffuseColor.a );';
    if (f.indexOf(A) < 0 || f.indexOf(G) < 0 || f.indexOf('lgSky(') < 0){ console.warn('render50 water: shader anchors missing, left as it was'); return; }
    f = f.replace(A, 'if (lgOn > 0.5 && r5On < 0.5){').replace('#include <common>', '#include <common>\n' + R5_DECL).replace(G, R5_FRAG + G);
    sh.fragmentShader = f;
  };
  mat.needsUpdate = true;
  return true;
}

/* ---------- the mirror pass ---------- */
const r5Cam = new THREE.PerspectiveCamera(), _r5p = new THREE.Vector3(), _r5t = new THREE.Vector3(), _r5u = new THREE.Vector3(), _r5d = new THREE.Vector3();
const _r5pl = new THREE.Plane(), _r5cp = new THREE.Vector4(), _r5q = new THREE.Vector4(), _r5n = new THREE.Vector3(0, 1, 0), _r5ray = new THREE.Vector3();
const R5_SCALE = [0, 1/3, 1/2];
function r5Target(){
  const s = R5_SCALE[R5.q] || 0; if (!s) return null;
  const w = Math.max(64, Math.round(renderer.domElement.width*s)), h = Math.max(64, Math.round(renderer.domElement.height*s));
  if (!R5.rt){ R5.rt = new THREE.WebGLRenderTarget(w, h, {minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter, format:THREE.RGBAFormat, depthBuffer:true, stencilBuffer:false}); R5.rt.texture.generateMipmaps = false; R5U.r5Refl.value = R5.rt.texture; }
  else if (R5.rt.width !== w || R5.rt.height !== h) R5.rt.setSize(w, h);
  return R5.rt;
}
// rough share of the screen that shows water (rays through a 10 x 7 grid onto the water plane, land / water grid lookup; no occlusion)
function r5WaterOnScreen(py){
  let n = 0, w = 0; const cp = camera.position;
  for (let j = 0; j < 7; j++) for (let i = 0; i < 10; i++){
    _r5ray.set((i + 0.5)/10*2 - 1, (j + 0.5)/7*2 - 1, 0.5).unproject(camera).sub(cp);
    n++; if (_r5ray.y >= -1e-6) continue;
    const t = (py - cp.y)/_r5ray.y, x = cp.x + _r5ray.x*t, z = cp.z + _r5ray.z*t;
    if (t*_r5ray.length() > r5Cam.far) continue;
    if (Math.abs(x) > HALF || Math.abs(z) > HALF){ w++; continue; }
    const v = nat[cx2i(-z)*N + cx2i(x)]; if (v === 1 || v === 2) w++;
  }
  return w/n;
}
function r5Hide(on){
  const H = R5.hidden;
  if (on){
    H.length = 0;
    const push = o => { if (o && o.visible){ o.visible = false; H.push(o); } };
    push(R5.dome);
    if (typeof SGR !== 'undefined' && SGR.tiles) for (const T of SGR.tiles.values()){
      push(T.trees); if (T.road){ push(T.road.minor); push(T.road.paths); }
      if (T.bld) push(T.bld.small);
    }
    if (typeof forestMesh !== 'undefined') push(forestMesh);
    sea.material.visible = false;
  } else {
    for (const o of H) o.visible = true; H.length = 0;
    sea.material.visible = true;
  }
}
function r5Pass(){
  R5.pass = false; R5U.r5ReflOn.value = 0;
  if (!R5.on || R5.q === 0){ R5.skipWhy = 'quality 0'; return; }
  const cp = camera.position, py = R5U.r5PlaneY.value, above = cp.y - py;
  if (above < 0.8){ R5.skipWhy = 'camera at the water'; return; }
  if (above > 6500){ R5.skipWhy = 'camera high'; return; }
  const D = cp.distanceTo(controls.target);
  r5Cam.far = Math.min(camera.far, Math.max(6000, D*3 + above*4, 9000));
  if ((R5.frames++ % 6) === 0) R5.visF = r5WaterOnScreen(py);
  if (R5.visF < 0.015){ R5.skipWhy = 'no water on screen'; return; }
  const rt = r5Target(); if (!rt){ R5.skipWhy = 'no target'; return; }
  const t0 = performance.now();
  // the mirrored camera (as three.js Reflector does it): position and look-at point reflected in the plane, up vector reflected
  camera.updateMatrixWorld();
  _r5p.set(cp.x, 2*py - cp.y, cp.z);
  camera.getWorldDirection(_r5d); _r5t.copy(cp).add(_r5d); _r5t.y = 2*py - _r5t.y;
  _r5u.set(0, 1, 0).applyQuaternion(camera.quaternion); _r5u.y = -_r5u.y;
  r5Cam.position.copy(_r5p); r5Cam.up.copy(_r5u); r5Cam.lookAt(_r5t);
  r5Cam.fov = camera.fov; r5Cam.aspect = camera.aspect; r5Cam.near = camera.near; r5Cam.updateProjectionMatrix(); r5Cam.updateMatrixWorld(); r5Cam.matrixWorldInverse.copy(r5Cam.matrixWorld).invert();
  const M = R5U.r5TexM.value; M.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1); M.multiply(r5Cam.projectionMatrix); M.multiply(r5Cam.matrixWorldInverse);
  // oblique near plane = the water plane (nothing below the water shows in the mirror)
  _r5pl.setFromNormalAndCoplanarPoint(_r5n, _r5t.set(0, py, 0)); _r5pl.applyMatrix4(r5Cam.matrixWorldInverse);
  _r5cp.set(_r5pl.normal.x, _r5pl.normal.y, _r5pl.normal.z, _r5pl.constant);
  const P = r5Cam.projectionMatrix.elements;
  _r5q.set((Math.sign(_r5cp.x) + P[8])/P[0], (Math.sign(_r5cp.y) + P[9])/P[5], -1, (1 + P[10])/P[14]);
  _r5cp.multiplyScalar(2/_r5cp.dot(_r5q));
  P[2] = _r5cp.x; P[6] = _r5cp.y; P[10] = _r5cp.z + 1 - 0.003; P[14] = _r5cp.w;
  // render: transparent sky, no shadow update, no water, no small things
  const bg = scene.background, au = renderer.shadowMap.autoUpdate, ar = renderer.info.autoReset, cur = renderer.getRenderTarget(), ca = renderer.getClearAlpha();
  renderer.getClearColor(R5.cc);
  const calls0 = renderer.info.render.calls;
  r5Hide(true); scene.background = null; renderer.shadowMap.autoUpdate = false; renderer.info.autoReset = false;
  try {
    renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0);
    renderer.render(scene, r5Cam);
  } finally {
    renderer.setRenderTarget(cur); renderer.setClearColor(R5.cc, ca);
    scene.background = bg; renderer.shadowMap.autoUpdate = au; renderer.info.autoReset = ar; r5Hide(false);
  }
  R5.passCalls = renderer.info.render.calls - calls0; if (ar) renderer.info.reset();
  R5U.r5ReflOn.value = 1; R5.pass = true; R5.ran++;
  R5.passMs = R5.passMs*0.9 + (performance.now() - t0)*0.1;
}

/* ---------- per frame: uniforms, adaptive quality, mirror pass ---------- */
function r5Pre(t){
  if (!R5.on) return;
  const now = performance.now();
  if (R5.lastT){ const dt = Math.min(250, now - R5.lastT); R5.ema = R5.ema*0.95 + dt*0.05; }
  R5.lastT = now;
  // adaptive quality (not when pinned): step down after 3 s of slow frames, back up at most once every 30 s when fast
  if (R5.pinned < 0 && !document.hidden){
    if (R5.ema > 34 && R5.q > 0){ R5.slow += 1; if (R5.slow > 90 && now - R5.lastStep > 3000){ R5.q--; R5.slow = 0; R5.lastStep = now; } }
    else if (R5.ema < 17 && R5.q < (window.CB_MOBILE ? 0 : 2) && now - R5.lastStep > 30000 && R5.ran > 0){ R5.q++; R5.lastStep = now; R5.slow = 0; }
    else R5.slow = Math.max(0, R5.slow - 1);
  }
  const W = window.SGWx, wind = W && W.state && typeof W.state.wind === 'number' ? W.state.wind : 0.4;
  R5U.r5Amp.value = 0.7 + 0.9*wind;
  R5U.r5PlaneY.value = (typeof SGR !== 'undefined' && SGR.on) ? -0.05 : sea.position.y;
  R5U.r5Px.value = 2*Math.tan(camera.fov*Math.PI/360)/Math.max(1, renderer.domElement.height);
  r5Pass();
}
function r5Start(){
  if (R5OFF || R5.on) return;
  if (!r5Patch(sea.material)){ R5.skipWhy = 'no light-module water'; return; }
  R5U.r5Nrm.value = r5SlopeTex();
  R5.dome = scene.getObjectByName('lgSky') || null;
  R5U.r5On.value = 1; R5.on = true;
}
function r5Coast(){
  if (!R5.on || window.CB_MOBILE || R5.coast) return;
  try { R5.coast = r5CoastTex(); } catch (e){ console.warn('render50 coast', e); R5.coast = null; }
  if (R5.coast){ R5U.r5Coast.value = R5.coast; R5U.r5CoastOn.value = 1; }
}
HOOKS.boot.push(() => { try { r5Start(); } catch (e){ console.error('render50 water', e); } });
HOOKS.prerender.push(r5Pre);
// the land / water grid is filled once the map data is in (and again after a city switch): build the coast texture when the city is built
HOOKS.frame.push(() => { if (R5.on && !R5.coast && typeof SGR !== 'undefined' && SGR.on && SGR.water && (R5.cw = (R5.cw || 0) + 1) > 30) r5Coast(); });

R50.water = {
  get on(){ return R5.on; },
  set on(v){ R5.on = !!v && !!sea.material.userData.r5; R5U.r5On.value = R5.on ? 1 : 0; R5U.r5ReflOn.value = 0; },
  set(q){ R5.pinned = Math.max(0, Math.min(2, q|0)); R5.q = R5.pinned; },
  auto(){ R5.pinned = -1; },
  U:R5U,
  info:() => ({on:R5.on, q:R5.q, pinned:R5.pinned, pass:R5.pass, skip:R5.pass ? '' : R5.skipWhy, passMs:+R5.passMs.toFixed(2), passCalls:R5.passCalls, waterOnScreen:+R5.visF.toFixed(3),
    rt:R5.rt ? [R5.rt.width, R5.rt.height] : null, emaMs:+R5.ema.toFixed(1), coast:R5.coastM ? {M:R5.coastM, texelM:+R5.coastTx.toFixed(1)} : null, waves:R5.waves, slopeRms:R5.slopeRms ? +R5.slopeRms.toFixed(3) : null})
};
}
