/* ================= v37 add-on: fuji — the land and sea around the Tokyo square out to Mount Fuji (lm33/fuji, window.SGFar) =================
   "Tokyo should include Fuji mountain". Only in the Tokyo build (SGR_PATH 'tyodata/'): after the city has loaded, tyodata/tyo_far.txt
   (built by lm33/fuji/mkfar.py from the AWS terrarium tiles and the Kanto OSM land cover) brings the real terrain around the 56 km square,
   lon 138.45-140.18, lat 35.0-36.1, at its true place in the Tokyo projection (Mount Fuji's summit, 35.3606 N 138.7274 E, 3776 m, is at
   x -92.6 km, y -33.2 km: ~99 km WSW of the square's centre), plus a coarse apron out to ~200 km that closes the horizon.
   - Terrain: an 80 m height grid in 14 x 11 chunks of 11.2 km (the square's 25 chunks are not drawn); each chunk is drawn at the
     coarsest of 7 steps (80 m ... 5.6 km) whose height error stays under ~1.3 px on screen (errors per chunk and step precomputed
     by the builder), with skirts against cracks; rebuilt a few per frame when the view moves; three.js frustum culls the chunks.
     Next to the square the heights blend over 1.6 km into the main terrain's edge (hAt), and a 40 m curtain under the main
     terrain's edge closes the last slivers: no gap, no step. A few hundred thousand triangles at most (~100-250 k from the towers).
   - Colours (fragment shader, from height, slope, a 160 m land-cover texture: urban / water / forest / field from OSM in the Kanto
     extract, rules and a towns list on the Fuji side): fields, suburbs, forest (autumn tints in October-November), subalpine scrub,
     Fuji's bare volcanic upper cone, rock on steep slopes, a snow cap whose snow line follows the date (SGLight.date): none in July-
     September, a dusting at the summit from October, down to ~1700 m in February, back up through May-June; SGWx snow lowers it.
     Next to the square the colour blends into the main ground texture's edge colours (sampled once from SGR.baseCv).
   - Water: the Fuji Five Lakes and Lake Ashi as water surfaces at their DEM levels (sea.material, the light module's water shader);
     Sagami Bay, Suruga Bay and the outer Tokyo Bay are the app's sea plane (enlarged to cover the region).
   - Air: an aerial perspective (bluish haze towards the fog colour that grows with distance and with the distance from the square,
     so it is continuous at the seam), the scene fog itself (on clear days its far distance is pushed out to the season's visibility,
     ~120 km in summer to ~210 km in winter, while the frame is drawn, and put back after it: the light and weather modules keep
     theirs), the camera's far plane raised to 260 km; rain, haze and heavy cloud (window.SGWx) pull the visibility in
     and hide Fuji; at night the far towns glow (urban cover), the land is lit by the app's moon / sky light.
   - hAt() outside the square returns the far terrain (flying there: the aircraft collide with Fuji), labels 富士山 Mount Fuji
     (3776 m), the lakes, 箱根 Hakone, 丹泽山地 Tanzawa, 相模湾 Sagami Bay (shown up to the current visibility).
   Test handle: window.SGFar {on, state, stats(), views, go(name), lod(), set(opts), H(x, y), hide(bool)}. */
{
const FJ = {state:'idle', on:false, err:null, hdr:null, H:null, A:null, cov:null, group:null, mat:null, chunks:[], lakes:[], apron:null, curtain:null,
  edgeTex:null, covTex:null, labels:[], cards:{}, q:[], lodT:0, ms:0, msMax:0, builds:0, tris:0, hidden:false, vis:1, clar:1, fogF:0, saved:null, hAt0:null,
  tau:1.3, budget:5, maxTris:450000, snow:4500, opts:{}, t0:0, loadMs:0, seamOk:false};
const fjSm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a)/(b - a))); return t*t*(3 - 2*t); };
function fjCity(){ if (window.SGFAR_OFF) return false; if (window.SGFAR_FORCE) return true; try { return typeof SGR_PATH !== 'undefined' && SGR_PATH === 'tyodata/'; } catch (e){ return false; } }
function fjPath(){ if (window.SGFAR_SRC) return window.SGFAR_SRC; try { return SGR_PATH + 'tyo_far.txt'; } catch (e){ return 'tyodata/tyo_far.txt'; } }

/* ---------- loading ---------- */
async function fjFetch(url){
  const r = await fetch(url); if (!r.ok) throw new Error(url + ' ' + r.status);
  const b64 = (await r.text()).trim();
  let u; try { u = new Uint8Array(await (await fetch('data:application/octet-stream;base64,' + b64)).arrayBuffer()); }   // native base64 decoding
  catch (e){ const bin = atob(b64); u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); }
  if (u[0] === 0x1f && u[1] === 0x8b) return await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  return u.buffer;
}
async function fjLoad(){
  FJ.state = 'loading'; FJ.t0 = performance.now();
  try {
    const buf = await fjFetch(fjPath()), dv = new DataView(buf);
    if (String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3)) !== 'SGF1') throw new Error('tyo_far: bad magic');
    const n = dv.getUint32(4, true), hd = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, n)));
    FJ.hdr = hd;
    const NX = hd.NX, NY = hd.NY, W = NX + 1, s = hd.sec;
    // heights: residuals of the predictor left + down - downleft
    const r = new Int16Array(buf, s.H[0], s.H[1] >> 1), q = new Int32Array(W*(NY + 1)), H = new Float32Array(W*(NY + 1));
    for (let j = 0; j <= NY; j++){ const o = j*W;
      for (let i = 0; i < W; i++){ const k = o + i; let p;
        if (j === 0) p = i ? q[k - 1] : 0; else if (i === 0) p = q[k - W]; else p = q[k - 1] + q[k - W] - q[k - W - 1];
        q[k] = r[k] + p; H[k] = q[k]*hd.HU; } }
    FJ.H = H;
    const ar = new Int16Array(buf, s.A[0], s.A[1] >> 1); FJ.A = new Float32Array(ar);
    // land cover: four 0..255 layers -> one RGBA texture (urban, water, forest, field)
    const CN = hd.CNX*hd.CNY, cv = new Uint8Array(buf, s.C[0], s.C[1]), rgba = new Uint8Array(CN*4);
    for (let k = 0; k < CN; k++){ rgba[k*4] = cv[k]; rgba[k*4 + 1] = cv[CN + k]; rgba[k*4 + 2] = cv[2*CN + k]; rgba[k*4 + 3] = cv[3*CN + k]; }
    FJ.cov = rgba;
    FJ.lakeBits = new Uint8Array(buf, s.L[0], s.L[1]);
    FJ.loadMs = performance.now() - FJ.t0;
    FJ.state = 'loaded';
  } catch (e){ FJ.state = 'error'; FJ.err = String(e && e.message || e); console.warn('[fuji] ' + FJ.err); }
}

/* ---------- heights ---------- */
// far terrain at (x, y) (bilinear on the 80 m grid; the apron beyond it); inside the square the main terrain
function fjHGrid(x, y){
  const hd = FJ.hdr, fx = (x - hd.GX0)/hd.R, fy = (y - hd.GY0)/hd.R;
  if (fx >= 0 && fy >= 0 && fx < hd.NX && fy < hd.NY){
    const i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, W = hd.NX + 1, k = j*W + i, H = FJ.H;
    return (H[k]*(1 - u) + H[k + 1]*u)*(1 - v) + (H[k + W]*(1 - u) + H[k + W + 1]*u)*v;
  }
  const ax = Math.min(hd.ANX - 1e-3, Math.max(0, (x - hd.AX0)/hd.AR)), ay = Math.min(hd.ANY - 1e-3, Math.max(0, (y - hd.AY0)/hd.AR));
  const i = ax | 0, j = ay | 0, u = ax - i, v = ay - j, W = hd.ANX + 1, k = j*W + i, A = FJ.A;
  return (A[k]*(1 - u) + A[k + 1]*u)*(1 - v) + (A[k + W]*(1 - u) + A[k + W + 1]*u)*v;
}
const fjOut = (x, y) => x < -HALF || x > HALF || y < -HALF || y > HALF;
// far water at (x, y): the sea (the plane at -1.6 m) or a lake ({lv}); null on land
const FJ_SEAW = {lv:-1.6};
function fjWater(x, y){
  if (FJ.state !== 'ready') return null;
  const hd = FJ.hdr, gi = Math.floor((x - hd.GX0)/hd.R), gj = Math.floor((y - hd.GY0)/hd.R);
  for (const L of hd.lakes){ const i = gi - L.i0, j = gj - L.j0; if (i >= 0 && j >= 0 && i < L.ni && j < L.nj && FJ.lakeBits[L.off + j*L.ni + i] && fjHGrid(x, y) < L.lv) return L; }
  return fjHGrid(x, y) < -1.7 ? FJ_SEAW : null;
}
// the 1.6 km next to the square follow the main terrain's edge (identical at the edge itself)
function fjSeam(){
  const hd = FJ.hdr, W = hd.NX + 1, BAND = 1600, H = FJ.H, h0 = FJ.hAt0;
  const i0 = Math.max(0, Math.floor((-HALF - BAND - hd.GX0)/hd.R)), i1 = Math.min(hd.NX, Math.ceil((HALF + BAND - hd.GX0)/hd.R));
  const j0 = Math.max(0, Math.floor((-HALF - BAND - hd.GY0)/hd.R)), j1 = Math.min(hd.NY, Math.ceil((HALF + BAND - hd.GY0)/hd.R));
  let n = 0, dmax = 0;
  for (let j = j0; j <= j1; j++){ const y = hd.GY0 + j*hd.R;
    for (let i = i0; i <= i1; i++){ const x = hd.GX0 + i*hd.R, d = Math.max(Math.abs(x), Math.abs(y)) - HALF;
      if (d < 0 || d > BAND) continue;
      const cx = Math.min(HALF, Math.max(-HALF, x)), cy = Math.min(HALF, Math.max(-HALF, y)), e = h0(cx, cy), w = 1 - fjSm(0, BAND, d), k = j*W + i;
      if (d === 0) dmax = Math.max(dmax, Math.abs(H[k] - e));
      H[k] = H[k] + (e - H[k])*w; n++; } }
  FJ.seamN = n; FJ.seamDiff = dmax;
}

/* ---------- the material ---------- */
const FJU = {fjCov:{value:null}, fjCovT:{value:new THREE.Vector4()}, fjEdge:{value:null}, fjHalf:{value:28000}, fjEdgeK:{value:0},
  fjSnow:{value:4500}, fjNight:{value:0}, fjAut:{value:0}, fjHarv:{value:0}, fjCam:{value:new THREE.Vector3()}, fjAirC:{value:new THREE.Color()},
  fjAirL:{value:45000}, fjAirK:{value:0.55}, fjHide:{value:0}, fjSea:{value:new THREE.Color(0x5a7470)}, fjLit:{value:0}, fjSqK:{value:12000},
  // the palette: taken from the main ground texture at the start (its urban, forest, field, park and water colours), so the far land
  // reads in the same map style; these are the fallbacks (the New York / Bay texture's colours)
  fjCU:{value:new THREE.Color(0.80, 0.78, 0.74)}, fjCF:{value:new THREE.Color(0.36, 0.49, 0.31)}, fjCG:{value:new THREE.Color(0.80, 0.76, 0.58)},
  fjCP:{value:new THREE.Color(0.62, 0.70, 0.50)}, fjCW:{value:new THREE.Color(0.42, 0.56, 0.63)}, fjFuji:{value:new THREE.Vector2()}, fjSunH:{value:new THREE.Vector2(1, 0)}, fjSil:{value:0}};
const FJ_VS_DECL = 'attribute float aH; varying vec3 vFW; varying float vFH; varying vec3 vFN;';
const FJ_VS = 'vFW = (modelMatrix*vec4(transformed, 1.0)).xyz; vFH = aH; vFN = objectNormal;';
const FJ_FS_DECL = `
uniform sampler2D fjCov, fjEdge; uniform vec4 fjCovT; uniform float fjHalf, fjEdgeK, fjSnow, fjNight, fjAut, fjHarv, fjAirL, fjAirK, fjHide, fjLit, fjSqK;
uniform vec3 fjCam, fjAirC, fjSea, fjCU, fjCF, fjCG, fjCP, fjCW; uniform vec2 fjFuji, fjSunH; uniform float fjSil;
varying vec3 vFW; varying float vFH; varying vec3 vFN;
float fjHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float fjNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(fjHash(i), fjHash(i + vec2(1.0, 0.0)), f.x), mix(fjHash(i + vec2(0.0, 1.0)), fjHash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fjSqD(vec2 P){ return max(abs(P.x), abs(P.y)) - fjHalf; }
float fjNoiseP(vec2 p, float P){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); float i0 = mod(i.x, P), i1 = mod(i.x + 1.0, P);
  return mix(mix(fjHash(vec2(i0, i.y)), fjHash(vec2(i1, i.y)), f.x), mix(fjHash(vec2(i0, i.y + 1.0)), fjHash(vec2(i1, i.y + 1.0)), f.x), f.y); }`;
const FJ_FS_COL = `
vec2 fP = vec2(vFW.x, -vFW.z); float fh = vFH, fD = distance(vFW, fjCam);
vec2 fUv = (fP - fjCovT.xy)*fjCovT.zw;
vec3 fN = normalize(vFN); float fsl = 1.0 - fN.y;
float n1 = fjNoise(fP/650.0), n2 = fjNoise(fP/2300.0 + 7.3), n3 = fjNoise(fP/160.0 + 3.1), n4 = fjNoise(fP/5200.0 + 1.7);
vec4 fcv;
if (fUv.x > 0.0 && fUv.y > 0.0 && fUv.x < 1.0 && fUv.y < 1.0) fcv = texture2D(fjCov, fUv);
else fcv = vec4(0.12*(1.0 - smoothstep(80.0, 300.0, fh)), 0.0, smoothstep(40.0, 260.0, fh + 300.0*fsl), 1.0 - smoothstep(60.0, 250.0, fh + 300.0*fsl));
float wU = fcv.r, wW = fcv.g, wF = fcv.b, wG = fcv.a;
// natural cover by height: forest (two tones in patches, autumn tints in Oct-Nov), subalpine scrub, Fuji's bare upper cone
vec3 cF = fjCF*mix(1.0, 0.86, smoothstep(0.35, 0.65, n1))*(0.9 + 0.2*n3);
float aut = fjAut*smoothstep(500.0, 1100.0, fh + 250.0*n2)*(1.0 - smoothstep(2000.0, 2400.0, fh))*smoothstep(0.45, 0.75, n3*0.5 + n1*0.5);
cF = mix(cF, cF*vec3(1.45, 1.08, 0.62), 0.45*aut);
// the tree line (~2300-2500 m on Fuji, ragged); on the east-south-east flank (Gotemba side, the Hoei craters' scoria field) the bare
// cinder reaches down to ~1500 m
vec2 fq0 = fP - fjFuji; float fdr = length(fq0), fse = 0.0;
// radial gullies on the cone: ragged tree line, streaks in the cinder, snow lying longer (lower) in the ravines
float fgul = 0.0;
if (fdr < 16000.0){ vec2 fu = fq0/max(fdr, 1.0); fse = smoothstep(0.55, 0.9, dot(fu, vec2(0.80, -0.60)))*(1.0 - smoothstep(9000.0, 13000.0, fdr));
  float ang = (atan(fu.y, fu.x) + 3.14159265)/6.2831853;
  fgul = (0.62*fjNoiseP(vec2(ang*48.0, fdr/1500.0), 48.0) + 0.38*fjNoiseP(vec2(ang*130.0, fdr/650.0 + 5.0), 130.0) - 0.5)*(1.0 - smoothstep(9000.0, 15000.0, fdr)); }
float tl = 2350.0 + 380.0*(n2 - 0.5) + 160.0*(n1 - 0.5) - 850.0*fse + 700.0*fgul;
vec3 cNat = mix(cF, mix(fjCF, fjCP, 0.45)*(0.88 + 0.24*n3), smoothstep(tl - 400.0, tl - 50.0, fh));
vec3 cSco = mix(vec3(0.37, 0.32, 0.31), vec3(0.46, 0.35, 0.31), smoothstep(0.3, 0.8, n3*0.6 + n1*0.4 + fgul))*(0.9 + 0.14*n4)*mix(1.0, 1.12, fse)*(1.0 + 0.3*fgul);
cNat = mix(cNat, cSco, smoothstep(tl - 50.0, tl + 260.0, fh));
// fields (paddies: greener in summer, straw-coloured after the harvest), parks and grass, suburbs and towns
vec3 cG = mix(mix(fjCG, fjCP, 0.55), fjCG, fjHarv)*(0.9 + 0.2*n3);
cG = mix(cG, fjCP*(0.92 + 0.16*n3), 0.35*smoothstep(0.4, 0.8, n2));
vec3 cU = fjCU*(0.9 + 0.16*n3)*(0.96 + 0.08*n1);
float uK = wU*mix(0.75, 1.15, n3*0.6 + n1*0.4);
vec3 c = cNat;
c = mix(c, cG, wG*(1.0 - wF));
c = mix(c, mix(cG, cU, 0.55), smoothstep(0.1, 0.35, uK)*(1.0 - wF*0.6));
c = mix(c, cU, smoothstep(0.35, 0.8, uK));
// steep slopes: rock and landslide scars
c = mix(c, vec3(0.62, 0.59, 0.55)*(0.88 + 0.2*n3), smoothstep(0.42, 0.62, fsl + 0.1*(n1 - 0.5)));
// snow: the snow line from the date, broken up by gullies and ridges, less on steep rock
float sn = smoothstep(fjSnow - 90.0, fjSnow + 70.0, fh + 260.0*(n2 - 0.5) + 180.0*(n1 - 0.5) + 70.0*(n3 - 0.5) - 420.0*max(0.0, fsl - 0.25) - 900.0*min(fgul, 0.0) - 260.0*fgul);
// under the trees the snow shows only through the gaps (frosted forest); open ground, scrub and cinder turn white
float snF = mix(0.38 + 0.25*n3, 1.0, max(smoothstep(tl - 380.0, tl - 60.0, fh), max(1.0 - wF, smoothstep(0.35, 0.6, fsl))));
c = mix(c, vec3(0.93, 0.94, 0.96)*(0.97 + 0.05*n3), sn*snF);
// water: lakes and rivers (land cover), the shallow sea floor under the sea plane
c = mix(c, fjCW, smoothstep(0.35, 0.75, wW)*(1.0 - sn));
c = mix(c, fjCW*vec3(0.92, 0.95, 0.97)*(0.92 + 0.12*n4), smoothstep(-0.2, -1.2, fh));
// next to the square: the main ground texture's edge colour
if (fjEdgeK > 0.0){
  vec2 q = clamp(fP, vec2(-fjHalf), vec2(fjHalf)); float t;
  if (q.y <= -fjHalf + 0.5 && abs(q.x) < fjHalf) t = (q.x + fjHalf)/(2.0*fjHalf);
  else if (q.x >= fjHalf - 0.5) t = 1.0 + (q.y + fjHalf)/(2.0*fjHalf);
  else if (q.y >= fjHalf - 0.5) t = 2.0 + (fjHalf - q.x)/(2.0*fjHalf);
  else t = 3.0 + (fjHalf - q.y)/(2.0*fjHalf);
  vec3 ec = texture2D(fjEdge, vec2(t*0.25, 0.5)).rgb;
  c = mix(c, ec, fjEdgeK*(1.0 - smoothstep(0.0, 2600.0, fjSqD(fP)))*(1.0 - sn));
}
diffuseColor.rgb = c;
float fjU = clamp(uK, 0.0, 1.0)*(1.0 - smoothstep(0.3, 0.7, wW));
// night: the towns' lights (sparkle near, an even glow far away); added after the aerial haze (lights shine through it)
vec3 fjGlow = vec3(0.0);
if (fjNight > 0.01){
  float sp = fjHash(floor(fP/38.0)), spk = mix(smoothstep(0.55, 0.98, sp)*2.4, 0.6, smoothstep(1500.0, 9000.0, fD));
  fjGlow = mix(vec3(1.0, 0.70, 0.40), vec3(0.95, 0.92, 0.85), 0.35*n3)*fjNight*fjLit*pow(fjU, 1.1)*spk*(0.7 + 0.6*n1)*2.0;
}`;
// the air: aerial perspective (grows with the distance from the camera and from the square: 0 at the seam), the weather's extra haze,
// then the scene fog; towards a low sun the haze in front of the far ranges is thinner than the bright sky behind them (sunset
// silhouettes: Fuji dark against the glow)
const FJ_FS_FOG = `
{ float fq = smoothstep(0.0, fjSqK, fjSqD(fP)), fa = fjAirK*(1.0 - exp(-fD/fjAirL))*fq;
  vec3 fvd = vFW - fjCam; vec2 fvh = fvd.xz/max(1.0, length(fvd.xz));
  float fsil = fjSil*smoothstep(0.45, 0.92, dot(fvh, fjSunH))*fq;
  fa *= 1.0 - 0.75*fsil;
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fjAirC, fa) + fjGlow*(1.0 - 0.55*fa);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fjAirC*vec3(0.5, 0.53, 0.68), 0.3*fsil);    // the shadowed side's blue-grey dusk tone
  #ifdef USE_FOG
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fjHide*smoothstep(12000.0, 40000.0, fD)*fq);
  #ifdef FOG_EXP2
  float fogFactor = 1.0 - exp(-fogDensity*fogDensity*fogDepth*fogDepth);
  #else
  float fogFactor = smoothstep(fogNear, fogFar, fogDepth);
  #endif
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor*(1.0 - 0.5*fsil));
  #endif
}`;
function fjMaterial(){
  const M = new THREE.MeshLambertMaterial({color:0xffffff});
  M.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, FJU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + FJ_VS_DECL).replace('#include <begin_vertex>', '#include <begin_vertex>\n' + FJ_VS);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + FJ_FS_DECL).replace('#include <color_fragment>', '#include <color_fragment>\n' + FJ_FS_COL)
      .replace('#include <fog_fragment>', FJ_FS_FOG);
  };
  M.customProgramCacheKey = () => 'fuji-far-2';
  return M;
}

/* ---------- chunks ---------- */
function fjChunkBuild(C, li){
  const hd = FJ.hdr, st = hd.steps[li], n = hd.CH/st, R = hd.R, W = hd.NX + 1, H = FJ.H;
  const ci = C.a*hd.CH, cj = C.b*hd.CH, x0 = hd.GX0 + ci*R, y0 = hd.GY0 + cj*R, half = hd.CH*R/2, ox = x0 + half, oy = y0 + half;
  const nv = (n + 1)*(n + 1), ns = 4*n, V = nv + ns;
  const pos = new Float32Array(V*3), nor = new Float32Array(V*3), ah = new Float32Array(V);
  const hg = (i, j) => H[Math.min(hd.NY, Math.max(0, j))*W + Math.min(hd.NX, Math.max(0, i))];
  for (let b = 0; b <= n; b++){ const j = cj + b*st;
    for (let a = 0; a <= n; a++){ const i = ci + a*st, k = b*(n + 1) + a, h = H[j*W + i];
      pos[k*3] = a*st*R - half; pos[k*3 + 1] = h; pos[k*3 + 2] = -(b*st*R - half); ah[k] = h;
      const gx = (hg(i + st, j) - hg(i - st, j))/(2*st*R), gy = (hg(i, j + st) - hg(i, j - st))/(2*st*R), L = Math.hypot(gx, gy, 1);
      nor[k*3] = -gx/L; nor[k*3 + 1] = 1/L; nor[k*3 + 2] = gy/L; } }
  // skirt: the border ring again, lowered (hides cracks between chunks drawn at different steps)
  const ring = [];
  for (let a = 0; a < n; a++) ring.push(a);                         // south edge, west -> east
  for (let b = 0; b < n; b++) ring.push(b*(n + 1) + n);             // east edge, south -> north
  for (let a = n; a > 0; a--) ring.push(n*(n + 1) + a);             // north edge, east -> west
  for (let b = n; b > 0; b--) ring.push(b*(n + 1));                 // west edge, north -> south
  const dep = 18 + 1.6*C.e[li];
  for (let r = 0; r < ns; r++){ const k = ring[r], s = nv + r; pos[s*3] = pos[k*3]; pos[s*3 + 1] = pos[k*3 + 1] - dep; pos[s*3 + 2] = pos[k*3 + 2]; nor[s*3] = nor[k*3]; nor[s*3 + 1] = nor[k*3 + 1]; nor[s*3 + 2] = nor[k*3 + 2]; ah[s] = ah[k]; }
  const idx = new (V > 65535 ? Uint32Array : Uint16Array)(n*n*6 + ns*6); let o = 0;
  for (let b = 0; b < n; b++) for (let a = 0; a < n; a++){
    const k = b*(n + 1) + a, k1 = k + 1, k2 = k + n + 1, k3 = k2 + 1;
    // split along the shorter diagonal (follows ridges and valleys better)
    if (Math.abs(pos[k*3 + 1] - pos[k3*3 + 1]) <= Math.abs(pos[k1*3 + 1] - pos[k2*3 + 1])){ idx[o++] = k; idx[o++] = k1; idx[o++] = k3; idx[o++] = k; idx[o++] = k3; idx[o++] = k2; }
    else { idx[o++] = k; idx[o++] = k1; idx[o++] = k2; idx[o++] = k1; idx[o++] = k3; idx[o++] = k2; } }
  for (let r = 0; r < ns; r++){ const a = ring[r], b = ring[(r + 1) % ns], sa = nv + r, sb = nv + (r + 1) % ns;
    idx[o++] = a; idx[o++] = sa; idx[o++] = b; idx[o++] = b; idx[o++] = sa; idx[o++] = sb; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('aH', new THREE.BufferAttribute(ah, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere();
  if (!C.mesh){ C.mesh = new THREE.Mesh(g, FJ.mat); C.mesh.position.set(ox, 0, -oy); C.mesh.matrixAutoUpdate = false; C.mesh.updateMatrix(); C.mesh.name = 'fuji-chunk'; FJ.group.add(C.mesh); }
  else { C.mesh.geometry.dispose(); C.mesh.geometry = g; }
  C.li = li; C.tris = n*n*2 + ns*2; FJ.builds++;
}
// screen-space error: the coarsest step whose height error stays under tau pixels at the chunk's distance from the camera
function fjLod(){
  const hd = FJ.hdr, cp = camera.position, K = (renderer.domElement.clientHeight || 800)/(2*Math.tan(camera.fov*Math.PI/360)), sz = hd.CH*hd.R;
  let tau = FJ.tau, tot = 0;
  for (let pass = 0; pass < 4; pass++){
    tot = 0;
    for (const C of FJ.chunks){
      const x0 = hd.GX0 + C.a*sz, y0 = hd.GY0 + C.b*sz, px = -cp.z;
      const dx = Math.max(x0 - cp.x, 0, cp.x - x0 - sz), dy = Math.max(y0 - px, 0, px - y0 - sz), dz = Math.max(C.lo - cp.y, 0, cp.y - C.hi);
      const d = Math.max(1, Math.hypot(dx, dy, dz)); C.d = d;
      let li = 0; for (let l = C.e.length - 1; l > 0; l--) if (C.e[l]*K/d <= tau){ li = l; break; }
      C.want = li; const n = hd.CH/hd.steps[li]; tot += n*n*2;
    }
    if (tot <= FJ.maxTris) break; tau *= 1.6;
  }
  FJ.tauEff = tau; FJ.wantTris = tot;
  FJ.q = FJ.chunks.filter(C => C.want !== C.li).sort((a, b) => a.d - b.d);
}
function fjBuildSome(){
  const t0 = performance.now(); let k = 0;
  while (FJ.q.length && (k === 0 || performance.now() - t0 < FJ.budget)){ const C = FJ.q.shift(); if (C.want !== C.li) fjChunkBuild(C, C.want); k++; }
  let t = 0; for (const C of FJ.chunks) t += C.tris || 0; FJ.tris = t;
}

/* ---------- lakes, apron, the curtain under the main terrain's edge ---------- */
function fjLakes(){
  const hd = FJ.hdr, R = hd.R;
  for (const L of hd.lakes){
    const P = [], I = []; let v = 0;
    for (let j = 0; j < L.nj; j++) for (let i = 0; i < L.ni; i++){
      if (!FJ.lakeBits[L.off + j*L.ni + i]) continue;
      const x = hd.GX0 + (L.i0 + i)*R, y = hd.GY0 + (L.j0 + j)*R;
      P.push(x, L.lv, -y, x + R, L.lv, -y, x + R, L.lv, -(y + R), x, L.lv, -(y + R)); I.push(v, v + 1, v + 2, v, v + 2, v + 3); v += 4; }
    if (!v) continue;
    const g = new THREE.BufferGeometry(), nor = new Float32Array(P.length); for (let k = 1; k < nor.length; k += 3) nor[k] = 1;
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(I); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, sea.material); m.renderOrder = 1; m.name = 'fuji-lake'; FJ.group.add(m); FJ.lakes.push(m);
  }
}
function fjApron(){
  const hd = FJ.hdr, W = hd.ANX + 1, P = [], N = [], AH = [], I = [];
  const gx1 = hd.GX0 + hd.NX*hd.R, gy1 = hd.GY0 + hd.NY*hd.R;
  for (let j = 0; j <= hd.ANY; j++) for (let i = 0; i <= hd.ANX; i++){
    const x = hd.AX0 + i*hd.AR, y = hd.AY0 + j*hd.AR, h = FJ.A[j*W + i];
    P.push(x, h, -y); AH.push(h);
    const a = FJ.A[j*W + Math.min(hd.ANX, i + 1)] - FJ.A[j*W + Math.max(0, i - 1)], b = FJ.A[Math.min(hd.ANY, j + 1)*W + i] - FJ.A[Math.max(0, j - 1)*W + i];
    const gx = a/(2*hd.AR), gy = b/(2*hd.AR), L = Math.hypot(gx, gy, 1); N.push(-gx/L, 1/L, gy/L); }
  for (let j = 0; j < hd.ANY; j++) for (let i = 0; i < hd.ANX; i++){
    const x = hd.AX0 + (i + 0.5)*hd.AR, y = hd.AY0 + (j + 0.5)*hd.AR;
    if (x > hd.GX0 && x < gx1 && y > hd.GY0 && y < gy1) continue;
    const k = j*W + i; I.push(k, k + 1, k + W + 1, k, k + W + 1, k + W); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aH', new THREE.Float32BufferAttribute(AH, 1));
  g.setIndex(I); g.computeBoundingSphere();
  FJ.apron = new THREE.Mesh(g, FJ.mat); FJ.apron.name = 'fuji-apron'; FJ.group.add(FJ.apron);
}
function fjCurtain(){
  if (FJ.curtain){ FJ.group.remove(FJ.curtain); FJ.curtain.geometry.dispose(); }
  const P = [], N = [], AH = [], I = [], h0 = FJ.hAt0, n = Math.round(2*HALF/TS), DEP = 40;
  const side = (fx, fy, nx, nz) => { const b = P.length/3;
    for (let k = 0; k <= n; k++){ const [x, y] = [fx(k*TS), fy(k*TS)], h = h0(x, y);
      P.push(x, h, -y, x, h - DEP, -y); N.push(nx, 0.5, nz, nx, 0.5, nz); AH.push(h, h); }
    for (let k = 0; k < n; k++){ const a = b + 2*k; I.push(a, a + 1, a + 2, a + 2, a + 1, a + 3, a, a + 2, a + 1, a + 2, a + 3, a + 1); } };
  side(s => -HALF + s, () => -HALF, 0, 1); side(() => HALF, s => -HALF + s, 1, 0); side(s => HALF - s, () => HALF, 0, -1); side(() => -HALF, s => HALF - s, -1, 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aH', new THREE.Float32BufferAttribute(AH, 1));
  g.setIndex(I); g.computeBoundingSphere();
  FJ.curtain = new THREE.Mesh(g, FJ.mat); FJ.curtain.name = 'fuji-curtain'; FJ.group.add(FJ.curtain);
}
// the sea outside the square: a second water layer at -0.05 m like the city's own sea mesh inside it (over the sea plane at -1.6 m), so
// the water looks the same on both sides of the edge; the far land (>= 0.3 m) hides it, the coast is where the terrain crosses it
function fjSeaRing(){
  const E = 250000, h = -0.05, Q = [[-E, -E, E, -HALF], [-E, HALF, E, E], [-E, -HALF, -HALF, HALF], [HALF, -HALF, E, HALF]], P = [], I = [];
  for (const [x0, y0, x1, y1] of Q){ const b = P.length/3; P.push(x0, h, -y0, x1, h, -y0, x1, h, -y1, x0, h, -y1); I.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  const g = new THREE.BufferGeometry(), nor = new Float32Array(P.length); for (let k = 1; k < nor.length; k += 3) nor[k] = 1;
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(I); g.computeBoundingSphere();
  FJ.ring = new THREE.Mesh(g, sea.material); FJ.ring.renderOrder = 1; FJ.ring.name = 'fuji-sea'; FJ.group.add(FJ.ring);
}
// the main ground texture's colours along the square's edge (a band 0-400 m inside), for the colour blend next to the seam
function fjEdgeColours(){
  let cv = null; try { cv = SGR.baseCv || (typeof texCv !== 'undefined' ? texCv : null); } catch (e){ cv = null; }
  const NS = 512, d = new Uint8Array(4*NS*4);
  if (!cv || !cv.width){ FJU.fjEdgeK.value = 0; return false; }
  const S = cv.width, ctx = cv.getContext('2d'), band = Math.max(2, Math.round(400/(2*HALF)*S));
  // four thin strips along the edges (not the whole 4096 px canvas)
  let st; try { st = [ctx.getImageData(0, S - band, S, band), ctx.getImageData(S - band, 0, band, S), ctx.getImageData(0, 0, S, band), ctx.getImageData(0, 0, band, S)]; } catch (e){ FJU.fjEdgeK.value = 0; return false; }
  for (let k = 0; k < 4*NS; k++){
    const e = Math.floor(k/NS), t = ((k % NS) + 0.5)/NS, I = st[e], D = I.data; let r = 0, g = 0, b = 0, c = 0;
    // e 0 south (left to right), 1 east (bottom to top), 2 north (right to left), 3 west (top to bottom): the shader's perimeter order
    const u = e === 0 ? t*S : e === 2 ? (1 - t)*S : 0, v = e === 1 ? (1 - t)*S : e === 3 ? t*S : 0, w = Math.max(1, Math.round(S/NS/2));
    for (let q = -w; q <= w; q++) for (let z = 0; z < band; z++){
      let x, y; if (e === 0 || e === 2){ x = Math.min(S - 1, Math.max(0, Math.round(u + q))); y = z; } else { x = z; y = Math.min(S - 1, Math.max(0, Math.round(v + q))); }
      const o = (y*I.width + x)*4; r += D[o]; g += D[o + 1]; b += D[o + 2]; c++; }
    d[k*4] = r/c; d[k*4 + 1] = g/c; d[k*4 + 2] = b/c; d[k*4 + 3] = 255; }
  if (FJ.edgeTex) FJ.edgeTex.dispose();
  const T = new THREE.DataTexture(d, 4*NS, 1, THREE.RGBAFormat); T.magFilter = T.minFilter = THREE.LinearFilter; T.wrapS = THREE.ClampToEdgeWrapping; T.needsUpdate = true;
  FJ.edgeTex = T; FJU.fjEdge.value = T; FJU.fjEdgeK.value = 0.9;
  fjPalette(cv);
  return true;
}
// the main texture's colours by class (medians of a 512 px copy): urban / open land, forest, fields, parks, water
function fjPalette(cv){
  const S = 512, c2 = document.createElement('canvas'); c2.width = c2.height = S; const x = c2.getContext('2d'); x.drawImage(cv, 0, 0, S, S);
  let d; try { d = x.getImageData(0, 0, S, S).data; } catch (e){ return; }
  const K = {U:[], F:[], G:[], P:[], W:[]};
  for (let o = 0; o < d.length; o += 4){ const r = d[o], g = d[o + 1], b = d[o + 2], L = 0.3*r + 0.59*g + 0.11*b;
    if (b > g + 6 && b > r + 22) K.W.push(o); else if (g > r + 14 && g > b + 14 && L < 150) K.F.push(o); else if (g > r + 8 && g > b + 20 && L >= 150) K.P.push(o);
    else if (r > b + 34 && g > b + 28 && L > 150) K.G.push(o); else if (Math.abs(r - g) < 14 && Math.abs(g - b) < 16 && L > 140) K.U.push(o); }
  const med = (L, k) => { const a = L.map(o => d[o + k]).sort((p, q) => p - q); return a[a.length >> 1]/255; };
  FJ.pal = {};
  for (const k of Object.keys(K)){ const L = K[k]; FJ.pal[k] = L.length; if (L.length < 200) continue; FJU['fjC' + k].value.setRGB(med(L, 0), med(L, 1), med(L, 2)); FJ.pal[k] = [L.length, '#' + FJU['fjC' + k].value.getHexString()]; }
}

/* ---------- season: snow line and autumn colours from the date ---------- */
// snow line (m) by day of the year: none July - September; a summit dusting in October; ~1700 m in February; up again in May - June
const FJ_SNOW = [[0, 2000], [20, 1800], [51, 1700], [79, 1900], [110, 2400], [140, 2900], [166, 3300], [181, 3650], [196, 4500], [274, 4500], [298, 3400], [319, 2800], [349, 2200], [366, 2000]];
function fjDate(){
  if (FJ.doyFix) return FJ.doyFix;     // test: SGFar.set({doyFix:100})
  let y, m, d; try { if (window.SGLight && SGLight.date){ [y, m, d] = SGLight.date.split('-').map(Number); } } catch (e){ /* */ }
  if (!y){ const t = new Date(); y = t.getFullYear(); m = t.getMonth() + 1; d = t.getDate(); }
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1))/864e5);
}
function fjSeason(){
  const doy = fjDate(); let s = 4500;
  for (let k = 0; k < FJ_SNOW.length - 1; k++){ const [a, ha] = FJ_SNOW[k], [b, hb] = FJ_SNOW[k + 1]; if (doy >= a && doy <= b){ s = ha + (hb - ha)*(doy - a)/(b - a); break; } }
  FJ.doy = doy; FJ.snow0 = s;
  const tri = (c, w) => Math.max(0, 1 - Math.abs(doy - c)/w);
  FJU.fjAut.value = tri(305, 28);                         // autumn leaves: mid-October to late November, peak early November
  FJU.fjHarv.value = Math.min(1, tri(300, 80)*1.6);      // rice stubble from September, ploughed / bare through the winter
  if (doy < 95 || doy > 335) FJU.fjHarv.value = 0.85;
  // visibility on clear days: ~135 km in July (haze) to ~235 km in January (the dry winter air: Fuji from Tokyo most days)
  FJ.visClear = 185000 + 50000*Math.cos(2*Math.PI*(doy - 15)/365);
}

/* ---------- per frame ---------- */
const FJ_UP = new THREE.Vector3();
function fjWeather(){
  const W = window.SGWx; let c = 1, snow = 0;
  if (W && W.state){ const s = W.state; c = (1 - Math.min(1, (s.vis || 0)))*(1 - Math.min(1, (s.ovc || 0)*1.05))*(1 - Math.min(1, (s.rain || 0)*1.2))*(1 - 0.72*Math.min(1, (s.cov || 0)))*(1 - 0.9*Math.min(1, s.deck || 0)); snow = s.snow || 0; }
  FJ.clar = Math.max(0, Math.min(1, c)); FJ.snowWx = snow;
}
function fjActive(){ return FJ.on && SGR.on && HALF === FJ.hdr.HALF && !FJ.hidden; }
function fjFrame(){
  if (FJ.state === 'idle'){ if (fjCity() && SGR.on && SGR.base && SGR.H) fjLoad(); return; }
  if (FJ.state === 'loaded'){ try { fjStart(); } catch (e){ FJ.state = 'error'; FJ.err = String(e && e.stack || e); if (FJ.group) FJ.group.visible = false; console.warn('[fuji] start', e); } return; }
  if (FJ.state !== 'ready') return;
  const act = fjActive(); FJ.group.visible = act;
  // the city's brown edge walls (sgSkirt) are replaced by the far terrain and its curtain
  try { if (typeof sgSkirtMesh !== 'undefined' && sgSkirtMesh && sgSkirtMesh.visible === act) sgSkirtMesh.visible = !act; } catch (e){ /* not in this build */ }
  if (!act) return;
  const t0 = performance.now();
  if (!FJ.seamOk && SGR.baseCv){ fjEdgeColours(); FJ.seamOk = true; }
  const cp = camera.position, now = performance.now();
  const mv = !FJ.lastCam || FJ.lastCam.distanceTo(cp) > Math.max(20, 0.01*Math.max(0, cp.y)) || camera.fov !== FJ.lastFov;
  if (mv || now - FJ.lodT > 1500){ fjLod(); FJ.lodT = now; FJ.lastCam = (FJ.lastCam || new THREE.Vector3()).copy(cp); FJ.lastFov = camera.fov; }
  if (FJ.q.length) fjBuildSome();
  if (!FJ.seasonT || now - FJ.seasonT > 4000){ fjSeason(); FJ.seasonT = now; }
  fjWeather();
  FJU.fjSnow.value = FJ.snow0 + (Math.min(FJ.snow0, 300) - FJ.snow0)*Math.min(1, FJ.snowWx);
  FJU.fjNight.value = typeof nightF === 'number' ? nightF : 0;
  FJU.fjLit.value = 0.6 + 0.4*(typeof NIGHT !== 'undefined' && NIGHT.uLit ? Math.min(1, NIGHT.uLit.value) : 1);
  FJU.fjSea.value.copy(sea.material.color);
  FJU.fjHide.value = Math.min(1, (1 - FJ.clar)*0.8);
  FJ.ms = FJ.ms*0.95 + (performance.now() - t0)*0.05; FJ.msMax = Math.max(FJ.msMax, performance.now() - t0);
}
// while the frame is drawn: the far plane out to 260 km and, on clear days, the fog out to the season's visibility (put back after it)
function fjPre(){
  if (FJ.state !== 'ready' || !fjActive()){
    FJ.saved = null;
    if (FJ.farSet && camera.far === 260000){ camera.far = FJ.far0 || 130000; camera.updateProjectionMatrix(); } FJ.farSet = false;
    return; }
  const f = scene.fog; FJ.saved = [f.near, f.far];
  const V = FJ.visClear*(1 + 0.25*Math.min(1, typeof nightF === 'number' ? nightF : 0));
  if (V > f.far) f.far = f.far + (V - f.far)*FJ.clar;
  FJ.fogF = f.far;
  // (left raised after the frame too: the labels are projected after it; the vehicle modules set their own far plane every frame)
  if (camera.far < 260000){ FJ.far0 = camera.far; camera.far = 260000; camera.updateProjectionMatrix(); FJ.farSet = true; }
  FJU.fjCam.value.copy(camera.position);
  // the air's colour: the horizon haze, a little bluer and darker (distant ranges read as blue-grey silhouettes)
  const L = 0.3*f.color.r + 0.59*f.color.g + 0.11*f.color.b;
  FJU.fjAirC.value.copy(f.color).multiply(_fjc.setRGB(0.80, 0.86, 0.97)).lerp(_fjc.setRGB(L, L, L), 0.15);
  FJU.fjAirL.value = 38000 + 30000*FJ.clar; FJU.fjAirK.value = 0.5;
  // the sun (below the horizon too: the light module's true sun) for the sunset silhouettes
  const sv = window.SGLight && SGLight.U && SGLight.U.lgSun ? SGLight.U.lgSun.value : sunDir, sh = Math.hypot(sv.x, sv.z);
  if (sh > 1e-4) FJU.fjSunH.value.set(sv.x/sh, sv.z/sh);
  const el = Math.asin(Math.max(-1, Math.min(1, sv.y)))*180/Math.PI;
  FJU.fjSil.value = fjSm(-10, -4, el)*(1 - fjSm(6, 16, el))*FJ.clar;
  // labels: only those inside the current visibility
  const vis = f.far*0.93, c = camera.position;
  for (const it of FJ.labels){ const d = Math.hypot(c.x - it.x, c.z + it.y, c.y - it.abs); it.near = d < Math.min(vis, it.maxR) ? 1e7 : 1; }
}
const _fjc = new THREE.Color();
function fjPost(){
  if (!FJ.saved) return;
  const f = scene.fog; f.near = FJ.saved[0]; f.far = FJ.saved[1];
  FJ.saved = null;
}
function fjStart(){
  const hd = FJ.hdr;
  FJ.hAt0 = hAt;
  fjSeam();
  FJ.mat = fjMaterial();
  const T = new THREE.DataTexture(FJ.cov, hd.CNX, hd.CNY, THREE.RGBAFormat); T.magFilter = T.minFilter = THREE.LinearFilter; T.needsUpdate = true; FJ.covTex = T;
  FJU.fjFuji.value.set(hd.fuji.x, hd.fuji.y);
  FJU.fjCov.value = T; FJU.fjCovT.value.set(hd.GX0, hd.GY0, 1/(hd.CNX*hd.CR), 1/(hd.CNY*hd.CR)); FJU.fjHalf.value = HALF;
  if (!FJU.fjEdge.value){ const d = new Uint8Array(4); FJU.fjEdge.value = new THREE.DataTexture(d, 1, 1, THREE.RGBAFormat); FJU.fjEdge.value.needsUpdate = true; }
  FJ.group = new THREE.Group(); FJ.group.name = 'fuji'; scene.add(FJ.group);
  FJ.chunks = hd.chunks.map(c => Object.assign({}, c, {li:-1, want:hd.steps.length - 1, mesh:null, tris:0, d:1e9}));
  fjLod(); for (const C of FJ.chunks) fjChunkBuild(C, C.want); FJ.q = [];
  fjLakes(); fjApron(); fjCurtain(); fjSeaRing();
  // the sea plane (200 km) must reach Suruga Bay and the apron: 440 km
  sea.scale.set(2.2, 2.2, 1);
  // hAt outside the square: the far terrain (aircraft, labels, anything sampling outside)
  const h0 = FJ.hAt0;
  hAt = function(x, y){ return (x < -HALF || x > HALF || y < -HALF || y > HALF) && FJ.state === 'ready' && SGR.on && HALF === hd.HALF ? fjHGrid(x, y) : h0(x, y); };
  fjSeason();
  FJ.state = 'ready'; FJ.on = true;
  try { syncLabels(); } catch (e){ /* */ }
  FJ.readyMs = performance.now() - FJ.t0;
  console.log('[t] fuji ready', Math.round(FJ.loadMs), 'ms load,', Math.round(FJ.readyMs), 'ms total,', FJ.chunks.length, 'chunks', FJ.tris || '');
}

/* ---------- labels ---------- */
const FJ_CARD = {'Mount Fuji':'far:fuji', 'Hakone':'far:hakone', 'Tanzawa Mountains':'far:tanzawa', 'Sagami Bay':'far:sagami', 'Lake Kawaguchi':'far:kawaguchi',
  'Lake Yamanaka':'far:yamanaka', 'Lake Sai':'far:sai', 'Lake Shōji':'far:shoji', 'Lake Motosu':'far:motosu', 'Lake Ashi':'far:ashi'};
// a card target for lm31/lmcard (key far:<slug>): the label's place
function fjCardTarget(key){
  const L = FJ.cards && FJ.cards[key]; if (!L) return null;
  const peak = L.k === 'peak';
  return {kind:'far', key, name:{zh:L.zh, en:L.en}, x:L.x, y:L.y, base:peak ? Math.max(0, L.h - 1800) : Math.max(0, L.h - 20), h:peak ? 1800 : 60, r:peak ? 9000 : L.k === 'lake' ? 2500 : 6000, label:true};
}
function fjLabels(){
  FJ.labels = [];
  if (FJ.state !== 'ready' || !FJ.on || typeof labelsEl === 'undefined') return;
  if (typeof showNatLabels !== 'undefined' && !showNatLabels) return;
  for (const L of FJ.hdr.labels){
    const el = document.createElement('div');
    el.className = 'lbl n' + (L.k === 'peak' ? ' peak big' : L.k === 'lake' ? ' lake' : '');
    el.innerHTML = (L.k === 'peak' ? '▲ ' : '') + L.zh + '<small>' + L.en + (L.sub ? ' · ' + L.sub : '') + '</small>';
    labelsEl.appendChild(el);
    // v37: the label opens its intro card (lm33/info_tyo: far:<slug>)
    const ck = FJ_CARD[L.en];
    if (ck){ el.classList.add('farlink'); el.style.pointerEvents = 'auto'; el.style.cursor = 'pointer'; FJ.cards[ck] = L;
      el.addEventListener('click', ev => { ev.stopPropagation(); try { if (window.SGCard) SGCard.open(ck); } catch (e){ /* no cards */ } }); }
    const it = {el, x:L.x, y:L.y, abs:L.h + (L.k === 'peak' ? 90 : L.k === 'lake' ? 25 : L.k === 'sea' ? 30 : 250), near:1, maxR:L.k === 'peak' ? 250000 : L.k === 'lake' ? 45000 : L.k === 'sea' ? 140000 : 95000, fuji:1};
    labelItems.push(it); FJ.labels.push(it);
  }
}
const _fjSync = syncLabels;
syncLabels = function(){ const r = _fjSync.apply(this, arguments); try { fjLabels(); } catch (e){ console.warn('[fuji] labels', e); } return r; };

HOOKS.frame.push(fjFrame);
HOOKS.prerender.push(fjPre);
HOOKS.render.push(fjPost);

/* ---------- the big map (lm30/nav, via post_far.py): a shaded relief of the far terrain under the city's tiles ---------- */
function fjMapImage(){
  if (FJ.mapCv) return FJ.mapCv;
  const hd = FJ.hdr, W = hd.CNX, Hh = hd.CNY, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
  const x = cv.getContext('2d'), im = x.createImageData(W, Hh), d = im.data, CN = W*Hh, C = FJ.cov;
  const P = k => FJU[k].value, cU = P('fjCU'), cF = P('fjCF'), cG = P('fjCG'), cW = [0x9f/255, 0xbc/255, 0xcb/255];
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++){
    const xw = hd.GX0 + (i + 0.5)*hd.CR, yw = hd.GY0 + (j + 0.5)*hd.CR, h = fjHGrid(xw, yw), o = ((Hh - 1 - j)*W + i)*4, k = j*W + i;
    const hx = fjHGrid(xw + hd.CR, yw) - fjHGrid(xw - hd.CR, yw), hy = fjHGrid(xw, yw + hd.CR) - fjHGrid(xw, yw - hd.CR);
    const sh = Math.max(0.55, Math.min(1.25, 1 + (-hx*0.7 + hy*0.7)/(2*hd.CR)*1.6));
    const u = C[k*4]/255, w = C[k*4 + 1]/255, f = C[k*4 + 2]/255, g = C[k*4 + 3]/255;
    let r = 0.86, gg = 0.84, b = 0.76;
    const mix = (c, t) => { r += (c.r - r)*t; gg += (c.g - gg)*t; b += (c.b - b)*t; };
    mix(cG, g*(1 - f)); mix(cF, f); mix(cU, Math.min(1, u*1.3));
    if (h > 2300){ const t = Math.min(1, (h - 2300)/300); r += (0.58 - r)*t; gg += (0.52 - gg)*t; b += (0.50 - b)*t; }
    if (h > FJU.fjSnow.value){ r = gg = b = 0.97; }
    r *= sh; gg *= sh; b *= sh;
    if (h < -1.7 || w > 0.5){ r = cW[0]; gg = cW[1]; b = cW[2]; }
    d[o] = Math.min(255, r*255); d[o + 1] = Math.min(255, gg*255); d[o + 2] = Math.min(255, b*255); d[o + 3] = Math.abs(xw) < HALF && Math.abs(yw) < HALF ? 0 : 255;
  }
  x.putImageData(im, 0, 0); FJ.mapCv = cv; return cv;
}
// the apron (5.6 km cells) under it: land / sea, shaded
function fjMapApron(){
  if (FJ.mapA) return FJ.mapA;
  const hd = FJ.hdr, W = hd.ANX + 1, Hh = hd.ANY + 1, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
  const x = cv.getContext('2d'), im = x.createImageData(W, Hh), d = im.data, A = FJ.A, cG = FJU.fjCG.value, cF = FJU.fjCF.value;
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++){ const h = A[j*W + i], o = ((Hh - 1 - j)*W + i)*4;
    if (h < 0){ d[o] = 0x9f; d[o + 1] = 0xbc; d[o + 2] = 0xcb; }
    else { const t = Math.min(1, h/600), sh = 1 + Math.max(-0.25, Math.min(0.2, (A[j*W + Math.max(0, i - 1)] - A[j*W + Math.min(W - 1, i + 1)])/2500));
      d[o] = (cG.r + (cF.r - cG.r)*t)*255*sh; d[o + 1] = (cG.g + (cF.g - cG.g)*t)*255*sh; d[o + 2] = (cG.b + (cF.b - cG.b)*t)*255*sh; }
    d[o + 3] = 255; }
  x.putImageData(im, 0, 0); FJ.mapA = cv; return cv;
}
function fjMapDraw(x, sx, sy, sc){
  if (FJ.state !== 'ready') return;
  const hd = FJ.hdr, cv = fjMapImage(), x0 = hd.GX0, y1 = hd.GY0 + hd.CNY*hd.CR, w = hd.CNX*hd.CR, h = hd.CNY*hd.CR;
  x.imageSmoothingEnabled = true;
  const ca = fjMapApron(), aw = (hd.ANX + 1)*hd.AR, ah = (hd.ANY + 1)*hd.AR;
  x.drawImage(ca, sx(hd.AX0 - hd.AR/2), sy(hd.AY0 - hd.AR/2 + ah), aw*sc, ah*sc);
  x.drawImage(cv, sx(x0), sy(y1), w*sc, h*sc);
  x.font = '600 13px system-ui, sans-serif'; x.textAlign = 'center'; x.lineWidth = 3; x.strokeStyle = 'rgba(255,255,255,0.85)'; x.fillStyle = '#2a2a2a';
  for (const L of hd.labels){
    if (L.k === 'lake' && sc < 0.02) continue;
    const px = sx(L.x), py = sy(L.y), t = (L.k === 'peak' ? '▲ ' : '') + L.zh + ' ' + L.en + (L.sub ? ' ' + L.sub : '');
    x.strokeText(t, px, py); x.fillText(t, px, py);
  }
}

/* ---------- test handle ---------- */
const FJ_VIEWS = {
  // [name]: camera lat, lon, height (m above sea), target lat, lon, height
  tower:   [35.6586, 139.7454, 255, 35.3606, 138.7274, 2500],     // Tokyo Tower's main deck towards Fuji
  shinjuku:[35.6896, 139.6917, 245, 35.3606, 138.7274, 2500],     // a Shinjuku tower top (~240 m) towards Fuji
  skytree: [35.7101, 139.8107, 450, 35.3606, 138.7274, 2500],
  plane:   [35.47, 138.86, 5200, 35.3606, 138.7274, 3000],        // a plane over the north-east flank, looking at the summit
  summit:  [35.3606, 138.7274, 4300, 35.30, 138.70, 1500],
  lakes:   [35.60, 138.80, 4200, 35.45, 138.72, 1200],
  hakone:  [35.30, 139.15, 2600, 35.22, 139.01, 700],
  seamW:   [35.66, 139.30, 900, 35.66, 139.5, 80],                // the square's west edge from outside
  seamWi:  [35.60, 139.52, 260, 35.62, 139.38, 120],              // the west edge from inside, low, looking out (Tama hills)
  seamN:   [35.86, 139.70, 320, 35.96, 139.66, 20],               // the north edge (Saitama) from inside
  seamE:   [35.62, 140.00, 300, 35.60, 140.12, 20],               // the east edge (Chiba) from inside
  seamS:   [35.33, 139.75, 1200, 35.42, 139.75, 0],               // the south edge over Tokyo Bay
  seamAir: [35.585, 139.33, 3200, 35.64, 139.46, 0],              // the west edge from the air (outside, looking east into the square)
  overview:[35.20, 139.90, 60000, 35.45, 139.20, 0, 1e9]
};
window.SGFar = {
  cardTarget:fjCardTarget,
  get on(){ return FJ.on; }, get state(){ return FJ.state; }, get err(){ return FJ.err; },
  hide(v){ FJ.hidden = !!v; },
  set(o){ Object.assign(FJ, o || {}); FJ.lodT = 0; FJ.seasonT = 0; },
  H:(x, y) => FJ.state === 'ready' ? fjHGrid(x, y) : null,
  // the region the view may be moved in (x0, y0, x1, y1, world metres) and the far water for the aircraft (lm33/fuji/post_far.py)
  get bounds(){ const h = FJ.hdr; return h ? [h.GX0 + 2000, h.GY0 + 2000, h.GX0 + h.NX*h.R - 2000, h.GY0 + h.NY*h.R - 2000] : null; },
  wet:(x, y) => fjWater(x, y) ? 1 : 0,
  wl:(x, y) => { const w = fjWater(x, y); return w ? w.lv : -1.6; },
  lod:() => { fjLod(); return {tau:FJ.tauEff, want:FJ.wantTris, q:FJ.q.length}; },
  views:FJ_VIEWS,
  mapDraw:fjMapDraw,
  go(name, fov){
    const v = FJ_VIEWS[name]; if (!v) return false;
    const h = FJ.hdr || {lon0:139.75, lat0:35.66, MX:90549.1, MY:110952.7}, xy = (la, lo) => [(lo - h.lon0)*h.MX, (la - h.lat0)*h.MY], p = xy(v[0], v[1]), t = xy(v[3], v[4]);
    // the orbit target ~1.5 km ahead in the direction of the view point (like a person looking from there: the light module's fog
    // follows the camera - target distance), unless a distance is given
    const dx = t[0] - p[0], dy = t[1] - p[1], dz = v[5] - v[2], L = Math.hypot(dx, dy, dz), k = Math.min(1, (v[6] || 1500)/L);
    camera.position.set(p[0], v[2], -p[1]); controls.target.set(p[0] + dx*k, v[2] + dz*k, -(p[1] + dy*k));
    // a telephoto test view looks at the horizon: the orbit camera's polar limit (1.38) would tilt it down (put back for wide views)
    if (fov){ camera.fov = fov; camera.updateProjectionMatrix(); if (FJ.pol0 === undefined) FJ.pol0 = controls.maxPolarAngle; controls.maxPolarAngle = fov < 25 ? 1.565 : FJ.pol0; }
    controls.update();
    return true;
  },
  stats:() => {
    const lv = {}; for (const C of FJ.chunks) lv[C.li] = (lv[C.li] || 0) + 1;
    return {state:FJ.state, err:FJ.err, on:FJ.on, active:FJ.state === 'ready' && fjActive(), loadMs:Math.round(FJ.loadMs), readyMs:Math.round(FJ.readyMs || 0), chunks:FJ.chunks.length, levels:lv,
      tris:FJ.tris, wantTris:FJ.wantTris, tau:FJ.tauEff, queue:FJ.q.length, builds:FJ.builds, ms:+FJ.ms.toFixed(3), msMax:+FJ.msMax.toFixed(1), lakes:FJ.lakes.length,
      snowLine:Math.round(FJU.fjSnow.value), doy:FJ.doy, autumn:+FJU.fjAut.value.toFixed(2), visClear:Math.round(FJ.visClear || 0), clarity:+FJ.clar.toFixed(3), fogFar:Math.round(FJ.fogF),
      seam:{n:FJ.seamN, maxDiff:+(FJ.seamDiff || 0).toFixed(2), edgeColours:FJU.fjEdgeK.value > 0}, labels:FJ.labels.length,
      fuji:FJ.state === 'ready' ? +fjHGrid(FJ.hdr.fuji.gx, FJ.hdr.fuji.gy).toFixed(1) : null};
  },
  U:FJU, _:FJ
};
}
