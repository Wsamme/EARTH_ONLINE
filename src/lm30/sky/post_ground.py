# v33 sky (lm30/sky): ground detail for all three cities — a POSTS / EXTRA_POSTS file for sgreal/patch17.py.
# apply(src, city) inserts the ground-detail block (window.SGGround; it patches the terrain material's shader, see the JS header)
# into the page's main script right before the render loop (after every module: HOOKS, terrain, terrTex, sunDir, SGR ... in scope).
# Self-contained (generated from lm30/sky/ground.js by lm30/sky/mkpost.py); one replacement, asserted to match exactly once.
_JS = r'''/* ================= v33 sky: ground detail (lm30/sky/post_ground.py; all three cities) =================
   The real-map ground is the baked land-use texture (sgdata / baydata / nycdata ground.webp + the painted overlays) on the terrain
   mesh: ~14-18 m per texel, so up close it was blurry and flat. The terrain material (MeshLambertMaterial) gets procedural detail in
   its fragment shader (onBeforeCompile; no new downloads, no data change, one 256 px noise texture made at start):
   - land use classified per pixel from the texture colour itself (soft weights, so the edges between uses stay soft): grass, forest,
     dry grass / chaparral (Bay hills), sand, water, paved / urban;
   - per class: grass mottling and dry patches, tree crowns with sun-side relief (forest, shrubs), sand grain and ripples, paving
     grime and aggregate; a large-scale tone variation (~100-300 m) that breaks the flat colour at mid range;
   - up close the texture lookup is warped (organic edges) and bilinear-sharpened; anisotropic filtering 16x (when the GPU has it);
   - steep slopes turn to rock / bare soil; wet look in rain (darker, more saturated, sky sheen at grazing angles, puddles on paving;
     the ground dries over a few minutes after the rain, SGWx.wet); darker and bluer at night;
   - detail fades with distance (and with the noise mip levels): beyond ~9 km the ground is exactly as before.
   Snow (New York, lm30/sky/wx.js) is applied after this detail (marker gd-end). Test handle: window.SGGround {on, stats()}. */
{
const GD = {on:true, mat:null, ms:0, tex:null, aniso:0, frames:0};
const GDU = {gdOn:{value:0}, gdNoise:{value:null}, gdSunXZ:{value:new THREE.Vector2(0, 1)}, gdSunK:{value:0}, gdCam:{value:new THREE.Vector3()},
  gdWet:{value:0}, gdNight:{value:0}, gdDry:{value:0}, gdSky:{value:new THREE.Color()}, gdUvK:{value:1/56000}, gdTexN:{value:4096}};
// 256 px tileable noise: R fbm (fine..mid), G domed blobs (crowns, clumps), B low-frequency blotches, A per-texel grain
function gdNoiseTex(){
  const S = 256, d = new Uint8Array(S*S*4), rnd = mulberry32(73313), L = new Float32Array(256*256);
  for (let i = 0; i < L.length; i++) L[i] = rnd();
  const vn = (x, y, P) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, ux = fx*fx*(3 - 2*fx), uy = fy*fy*(3 - 2*fy);
    const i0 = ((xi % P) + P) % P, j0 = ((yi % P) + P) % P, i1 = (i0 + 1) % P, j1 = (j0 + 1) % P;
    const a = L[j0*256 + i0], b = L[j0*256 + i1], c = L[j1*256 + i0], e = L[j1*256 + i1];
    return a + (b - a)*ux + (c - a)*uy + (a - b - c + e)*ux*uy; };
  // blobs: jittered points on two grids (8 and 16 per tile), dome profile, varying radius
  const pts = [];
  for (const [n, k] of [[8, 1], [16, 0.75]]){ const C = S/n; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) pts.push([(i + 0.15 + 0.7*rnd())*C, (j + 0.15 + 0.7*rnd())*C, C*(0.45 + 0.4*rnd()), k*(0.75 + 0.25*rnd())]); }
  const G = new Float32Array(S*S);
  for (const [px, py, r, k] of pts){
    const r0 = Math.ceil(r);
    for (let y = Math.floor(py - r0); y <= py + r0; y++) for (let x = Math.floor(px - r0); x <= px + r0; x++){
      const dx = x + 0.5 - px, dy = y + 0.5 - py, q = 1 - (dx*dx + dy*dy)/(r*r); if (q <= 0) continue;
      const o = (((y % S) + S) % S)*S + (((x % S) + S) % S), h = k*Math.sqrt(q); if (h > G[o]) G[o] = h;
    }
  }
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++){
    const u = x/S, v = y/S, o = (y*S + x)*4;
    let f = 0, a = 0.5, w = 0; for (const P of [16, 32, 64, 128]){ f += a*vn(u*P, v*P, P); w += a; a *= 0.55; }
    f = Math.min(1, Math.max(0, (f/w - 0.5)*1.9 + 0.5));
    const b = Math.min(1, Math.max(0, ((0.65*vn(u*4, v*4, 4) + 0.35*vn(u*8 + 3, v*8 + 7, 8)) - 0.5)*2.1 + 0.5));
    d[o] = Math.round(f*255); d[o + 1] = Math.round(Math.min(1, G[y*S + x])*255); d[o + 2] = Math.round(b*255); d[o + 3] = Math.floor(rnd()*256);
  }
  const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); t.needsUpdate = true;
  return t;
}
const GD_FRAG_DECL = `
uniform sampler2D gdNoise; uniform vec2 gdSunXZ; uniform float gdOn, gdSunK, gdWet, gdNight, gdUvK, gdTexN, gdDry; uniform vec3 gdCam, gdSky;
varying vec3 vGdW; varying vec3 vGdN;`;
const GD_FRAG = `
float gdRefl = 0.0;
#ifdef USE_MAP
if (gdOn > 0.5){
  float gdD = distance(vGdW, gdCam);
  vec2 gdP = vec2(vGdW.x, -vGdW.z);                                            // world metres: x east, y north
  float gdNear = 1.0 - smoothstep(600.0, 2400.0, gdD), gdMid = 1.0 - smoothstep(2400.0, 9000.0, gdD);
  // four lookups of one 256 px noise tile at unrelated scales and angles, each warped by the larger one: no visible repeats
  vec2 gpA = mat2(0.819, 0.574, -0.574, 0.819)*gdP, gpB = mat2(0.909, -0.417, 0.417, 0.909)*gdP;
  vec4 gn4 = texture2D(gdNoise, gdP/1733.0 + vec2(0.13, 0.71));
  vec4 gn3 = texture2D(gdNoise, gdP/337.0 + vec2(0.31, 0.67) + (gn4.b - 0.5)*0.9);
  vec2 gw1 = (vec2(gn3.b, gn4.b) - 0.5)*0.28;
  vec4 gn1 = texture2D(gdNoise, gpA/57.0 + gw1), gn2 = texture2D(gdNoise, gpB/13.1 + (vec2(gn4.b, gn3.b) - 0.5)*0.7 + vec2(0.57, 0.11));
  vec4 gn5 = texture2D(gdNoise, gpB/83.0 + gw1.yx + vec2(0.21, 0.39));            // a second, unrelated crown field
  vec4 gns = texture2D(gdNoise, (gpA + mat2(0.819, 0.574, -0.574, 0.819)*gdSunXZ*1.4)/57.0 + gw1);   // the crowns' height one step towards the sun
  // up close: an organically warped, bilinear-sharpened lookup of the land-use texture (magnified texels only)
  vec2 gdTx = vUv*gdTexN; float gdMag = 1.0 - smoothstep(0.35, 0.8, max(length(dFdx(gdTx)), length(dFdy(gdTx))));
  float gdK = gdNear*gdMag;
  vec2 gdT = (vUv + (vec2(gn1.r, gn1.b) - 0.5)*9.0*gdUvK)*gdTexN - 0.5, gdI = floor(gdT), gdF = gdT - gdI;
  vec4 gdC = mapTexelToLinear(texture2D(map, (gdI + mix(gdF, smoothstep(0.12, 0.88, gdF), 0.85) + 0.5)/gdTexN, -16.0));
  vec3 c = mix(diffuseColor.rgb, diffuse*gdC.rgb, gdK);
  // land use from the colour (soft weights)
  float L = dot(c, vec3(0.3, 0.59, 0.11)), gr = c.g - max(c.r, c.b), ys = min(c.r, c.g) - c.b;
  float wW = smoothstep(0.05, 0.11, c.b - c.g);
  float wV = smoothstep(0.022, 0.08, gr)*(1.0 - wW);
  float wY = smoothstep(0.1, 0.19, ys)*(1.0 - wV)*(1.0 - wW);
  float wDg = wY*gdDry*(1.0 - smoothstep(0.76, 0.84, L)), wS = wY - wDg;          // golden hills only in the Bay build
  float wF = wV*(1.0 - smoothstep(0.52, 0.62, L)), wG = wV - wF;
  float wU = max(0.0, 1.0 - wV - wY - wW);
  float emb = (gn1.g - gns.g)*gdSunK;                                          // relief lit from the sun side
  float big = gn3.b - 0.5;
  // grass: mottled, dry patches, large-scale tone
  float dry = smoothstep(0.58, 0.8, 0.6*gn1.b + 0.4*gn3.r);
  vec3 cG = vec3(1.0 + 0.2*(gn1.r - 0.5) + 0.12*(gn2.r - 0.5)*gdNear + 0.24*big + 0.25*emb*smoothstep(0.5, 0.9, gn1.g)) * mix(vec3(1.0), vec3(1.1, 1.04, 0.8), 0.3*dry);
  // forest: tree crowns with gaps, lit on the sun side, a few yellower / bluer crowns
  float cr = smoothstep(0.3, 0.8, max(gn1.g, 0.92*gn5.g));
  vec3 cF = vec3(mix(0.66, 1.1, cr)*(1.0 + 1.5*emb)*(1.0 + 0.16*big)) * mix(vec3(1.0), vec3(1.08, 1.05, 0.84), 0.5*smoothstep(0.6, 0.85, gn1.b)) * mix(vec3(1.0), vec3(0.94, 1.0, 1.04), 0.4*smoothstep(0.6, 0.85, gn3.r));
  // dry grass (golden hills) with darker shrub clumps
  float sh = smoothstep(0.58, 0.8, max(gn1.g, 0.92*gn5.g));
  vec3 cD = vec3(1.0 + 0.14*(gn1.r - 0.5) + 0.1*(gn2.r - 0.5)*gdNear + 0.2*big) * mix(vec3(1.0), vec3(0.6, 0.66, 0.5)*(1.0 + 1.4*emb), 0.75*sh);
  // sand: grain, gentle ripples near the camera
  float rip = sin(dot(gdP, vec2(0.83, 0.55))*3.4 + 6.0*gn1.r)*(1.0 - smoothstep(120.0, 600.0, gdD));
  vec3 cS = vec3(1.0 + 0.07*(gn2.a - 0.5)*gdNear + 0.03*rip + 0.1*big);
  // paved / built-up: grime and aggregate, low contrast
  vec3 cU = vec3(1.0 + 0.12*big + 0.07*(gn1.r - 0.5) + 0.05*(gn2.a - 0.5)*gdNear - 0.05*smoothstep(0.62, 0.8, gn2.r)*gdNear);
  vec3 f = wG*cG + wF*cF + wDg*cD + wS*cS + wU*cU + vec3(wW);
  c *= mix(vec3(1.0), f, gdMid);
  // steep slopes: rock and bare soil
  float rk = smoothstep(0.1, 0.32, 1.0 - normalize(vGdN).y)*(1.0 - 0.75*wU)*(1.0 - wW)*gdMid;
  c = mix(c, vec3(0.57, 0.53, 0.47)*(0.8 + 0.4*gn1.r)*(1.0 + 0.5*emb), 0.55*rk);
  // rain: darker, more saturated; puddles on the paving; the sheen is added after the lighting
  float pud = smoothstep(0.6, 0.7, 0.55*gn3.b + 0.45*gn1.r)*wU*gdWet*gdNear;
  float wk = gdWet*(0.36*(wU + wS) + 0.2*(wV + wDg));
  float Lc = dot(c, vec3(0.3, 0.59, 0.11));
  c = mix(vec3(Lc), c, 1.0 + 0.3*gdWet)*(1.0 - wk)*(1.0 - 0.4*pud);
  gdRefl = gdWet*(0.2*wU + 0.08*wS)*gdMid + 0.7*pud;
  // night: darker and bluer
  c *= mix(vec3(1.0), vec3(0.84, 0.89, 1.04), gdNight);
  diffuseColor.rgb = max(c, vec3(0.0));
}
#endif
/*gd-end*/`;
const GD_REFL = `
if (gdRefl > 0.001){
  vec3 gdV = normalize(gdCam - vGdW);
  float gdFr = 0.04 + 0.96*pow(1.0 - clamp(gdV.y, 0.0, 1.0), 5.0);
  outgoingLight = mix(outgoingLight, gdSky, clamp(gdRefl*gdFr*1.5, 0.0, 0.8));
}
#include <envmap_fragment>`;
function gdPatch(M){
  if (!M || M.userData.gd) return;
  M.userData.gd = true;
  const o = M.onBeforeCompile, ok = M.customProgramCacheKey;
  M.onBeforeCompile = function(sh, r){
    if (o) o.call(this, sh, r);
    Object.assign(sh.uniforms, GDU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGdW; varying vec3 vGdN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGdW = (modelMatrix*vec4(transformed, 1.0)).xyz; vGdN = mat3(modelMatrix)*objectNormal;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>' + GD_FRAG_DECL)
      .replace('#include <map_fragment>', '#include <map_fragment>' + GD_FRAG)
      .replace('#include <envmap_fragment>', GD_REFL);
  };
  M.extensions = Object.assign(M.extensions || {}, {derivatives:true});
  M.customProgramCacheKey = () => 'terrain-gd|' + (ok && ok !== THREE.Material.prototype.customProgramCacheKey ? ok.call(M) : '');
  M.needsUpdate = true; GD.mat = M;
}
let GD_BAY = null;
function gdBay(){ if (GD_BAY === null){ try { GD_BAY = typeof SGR_BAY !== 'undefined' && !!SGR_BAY; } catch (e){ return false; } } return GD_BAY; }
function gdFrame(){
  const t0 = performance.now();
  if (typeof terrain === 'undefined' || !terrain) return;
  const M = terrain.material;
  if (M !== GD.mat){ if (!GD.tex) GDU.gdNoise.value = GD.tex = gdNoiseTex(); gdPatch(M); }
  // anisotropic filtering of the ground texture (16x when available; re-uploaded once)
  const an = SGR.on ? Math.min(16, renderer.capabilities.getMaxAnisotropy()) : 1;
  if (SGR.on && terrTex.anisotropy !== an && terrTex.image && terrTex.image.width > 1024){ terrTex.anisotropy = an; terrTex.needsUpdate = true; }
  const on = GD.on && SGR.on; GDU.gdOn.value = on ? 1 : 0;
  if (!on){ GD.ms = GD.ms*0.95 + (performance.now() - t0)*0.05; return; }
  GDU.gdCam.value.copy(camera.position); GDU.gdUvK.value = 1/(2*HALF); GDU.gdTexN.value = terrTex.image && terrTex.image.width || 4096;
  const sd = sunDir, h = Math.hypot(sd.x, sd.z);
  if (h > 1e-4) GDU.gdSunXZ.value.set(sd.x/h, -sd.z/h);
  GDU.gdSunK.value = wgdSm(0.02, 0.2, sd.y)*Math.min(2.2, 0.55/Math.max(0.25, sd.y))*Math.min(1.2, sun.intensity/0.72);
  let wet = 0; const W = window.SGWx; if (W){ if (W.wet !== undefined) wet = W.wet; else if (W.mode !== 'clear') wet = W.state.rain; }
  GDU.gdWet.value = wet;
  GDU.gdNight.value = typeof nightF === 'number' ? Math.min(1, nightF) : 0;
  GDU.gdSky.value.copy(scene.fog.color).lerp(scene.background, 0.35);
  GDU.gdDry.value = gdBay() ? 1 : 0;
  GD.ms = GD.ms*0.95 + (performance.now() - t0)*0.05; GD.frames++;
}
const wgdSm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a)/(b - a))); return t*t*(3 - 2*t); };
HOOKS.frame.push(gdFrame);
window.SGGround = {
  get on(){ return GD.on; }, set on(v){ GD.on = !!v; },
  stats:() => ({on:GD.on && SGR.on, ms:+GD.ms.toFixed(4), patched:!!GD.mat, aniso:terrTex.anisotropy, maxAniso:renderer.capabilities.getMaxAnisotropy(), wet:+GDU.gdWet.value.toFixed(3), night:+GDU.gdNight.value.toFixed(3), sunK:+GDU.gdSunK.value.toFixed(3)}),
  U:GDU
};
}
'''

def apply(src, city):
    a = '/* ================= loop ================= */'
    n = src.count(a)
    assert n == 1, ('post_ground: loop marker', n)
    return src.replace(a, _JS.replace('</script', '<\\/script') + '\n' + a)
