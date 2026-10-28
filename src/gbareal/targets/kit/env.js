// GENERATED from hkreal/kit/env.js for the Greater Bay map (adapted copy, 2026-10-28): data from gbareal/out, the terrain drawn only
// in a window around the focus (TW m, default 9000: the full 1801^2 grid is too heavy here). Test environment for the real-map modules: same projection, terrain, lights, materials and night uniforms as the app.
// URL: env.html?m=module1.js,module2.js   (paths relative to this folder)
const W = 1400, Hh = 800;
const renderer = new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer:true});
renderer.setSize(W, Hh); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const BG = new THREE.Color('#e3e1d9'); scene.background = BG; scene.fog = new THREE.Fog(BG, 22000, 68000);
const camera = new THREE.PerspectiveCamera(38, W/Hh, 5, 130000);
const hemi = new THREE.HemisphereLight(0xffffff, 0xb7b1a2, 0.78); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.72); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.8; scene.add(sun); scene.add(sun.target);
const sea = new THREE.Mesh(new THREE.PlaneGeometry(200000, 200000), new THREE.MeshLambertMaterial({color:0x93aab0, transparent:true, opacity:0.86, depthWrite:false}));
sea.rotation.x = -Math.PI/2; sea.position.y = -1.6; sea.renderOrder = 1; scene.add(sea);

let HALF = 28000, TS = 70, TN = 801, H = null, BASE = null, TILE = 2000;
let LON0 = 103.845, LAT0 = 1.315, MX = 111290.5, MY = 110574;
const sgXY = (lat, lon) => [(lon - LON0)*MX, (lat - LAT0)*MY];
function hAt(x, y){
  const fx = Math.min(TN-1.0001, Math.max(0, (x+HALF)/TS)), fy = Math.min(TN-1.0001, Math.max(0, (y+HALF)/TS));
  const i = Math.floor(fx), j = Math.floor(fy), u = fx-i, v = fy-j;
  const a = H[j*TN+i], b = H[j*TN+i+1], c = H[(j+1)*TN+i], d = H[(j+1)*TN+i+1];
  return (a*(1-u) + b*u)*(1-v) + (c*(1-u) + d*u)*v;
}
const hC = (x, y) => Math.max(-0.3, hAt(x, y));     // in Singapore mode the ground near water sits at -0.3 m, just under the water surface (-0.05 m)

async function loadBin(path){
  const r = await fetch(path); if (!r.ok) throw new Error('fetch ' + path + ' ' + r.status);
  let buf = await r.arrayBuffer(); const u8 = new Uint8Array(buf);
  if (u8[0] === 0x1f && u8[1] === 0x8b){ const ds = new DecompressionStream('gzip'); buf = await new Response(new Blob([buf]).stream().pipeThrough(ds)).arrayBuffer(); }
  return buf;
}
async function loadJSON(path){ return JSON.parse(new TextDecoder().decode(await loadBin(path))); }
function b64u8(s){ const b = atob(s), o = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) o[i] = b.charCodeAt(i); return o; }

// terrain with the ground texture
let terrain = null;
function buildTerrain(img, cx, cy, tw){
  const i0 = Math.max(0, Math.floor((cx - tw + HALF)/TS)), i1 = Math.min(TN - 1, Math.ceil((cx + tw + HALF)/TS)), j0 = Math.max(0, Math.floor((cy - tw + HALF)/TS)), j1 = Math.min(TN - 1, Math.ceil((cy + tw + HALF)/TS));
  const NI = i1 - i0 + 1, NJ = j1 - j0 + 1;
  const pos = new Float32Array(NI*NJ*3), uv = new Float32Array(NI*NJ*2), idx = new Uint32Array((NI-1)*(NJ-1)*6); let o = 0;
  for (let jj = 0; jj < NJ; jj++) for (let ii = 0; ii < NI; ii++){ const i = i0 + ii, j = j0 + jj, k = jj*NI+ii; pos[k*3] = -HALF + i*TS; pos[k*3+1] = H[j*TN+i]; pos[k*3+2] = HALF - j*TS; uv[k*2] = i/(TN-1); uv[k*2+1] = j/(TN-1); }
  for (let j = 0; j < NJ-1; j++) for (let i = 0; i < NI-1; i++){ const a = j*NI+i, b = a+1, c = a+NI+1, d = a+NI; idx[o++] = a; idx[o++] = b; idx[o++] = c; idx[o++] = a; idx[o++] = c; idx[o++] = d; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
  const tex = new THREE.Texture(img); tex.needsUpdate = true; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.flipY = true;
  terrain = new THREE.Mesh(g, new THREE.MeshLambertMaterial({map:tex})); terrain.receiveShadow = true; scene.add(terrain);
}
// water: sea, fresh water bodies at their level, small ponds / pools / piers draped on the ground
function readWater(buf){
  const dv = new DataView(buf); let o = 4;
  const vu = () => { let v = 0, s = 0, b; do { b = dv.getUint8(o++); v += (b & 127)*Math.pow(2, s); s += 7; } while (b & 128); return v; };
  const mesh = () => { const nv = vu(), ni = vu(); const V = new Int32Array(buf.slice(o, o + nv*8)); o += nv*8; const I = new Uint32Array(buf.slice(o, o + ni*4)); o += ni*4; return {V, I}; };
  const sea = mesh(), nb = vu(), bodies = [];
  for (let k = 0; k < nb; k++){ const lv = dv.getFloat32(o, true); o += 4; bodies.push({lv, m:mesh()}); }
  const nf = vu(), flat = [];
  for (let k = 0; k < nf; k++){ const kind = dv.getUint8(o++); flat.push({kind, m:mesh()}); }
  return {sea, bodies, flat};
}
const matWater = new THREE.MeshLambertMaterial({color:0x93aab0, transparent:true, opacity:0.86, depthWrite:false});
function waterMesh(m, yf){
  const n = m.V.length/2, pos = new Float32Array(n*3);
  for (let i = 0; i < n; i++){ const x = m.V[i*2]/4, y = m.V[i*2+1]/4; pos[i*3] = x; pos[i*3+1] = yf(x, y); pos[i*3+2] = -y; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(m.I, 1));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n*3).map((v, i) => i % 3 === 1 ? 1 : 0), 3));
  return g;
}
function buildWater(Wd){
  const gw = new THREE.Group(); scene.add(gw);
  const s = new THREE.Mesh(waterMesh(Wd.sea, () => -0.05), matWater); s.renderOrder = 1; gw.add(s);
  for (const b of Wd.bodies){ const m = new THREE.Mesh(waterMesh(b.m, () => b.lv - 0.05), matWater); m.renderOrder = 1; gw.add(m); }
  const fm = {1:new THREE.MeshLambertMaterial({color:0x86b3c9, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-4}), 2:new THREE.MeshLambertMaterial({color:0x7cc4e2, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-4}), 3:new THREE.MeshLambertMaterial({color:0xb9b0a0})};
  for (const f of Wd.flat){ const m = new THREE.Mesh(waterMesh(f.m, f.kind === 3 ? (x, y) => Math.max(1.6, hC(x, y) + 0.3) : (x, y) => hC(x, y) + 0.12), fm[f.kind]); m.receiveShadow = true; gw.add(m); }
  return gw;
}
// views
function view(lat, lon, dist, elev, azim, night){
  const [x, y] = sgXY(lat, lon), gy = Math.max(0, hC(x, y));
  const e = elev*Math.PI/180, a = azim*Math.PI/180;
  camera.position.set(x + Math.sin(a)*Math.cos(e)*dist, gy + Math.sin(e)*dist, -y + Math.cos(a)*Math.cos(e)*dist);
  camera.lookAt(x, gy, -y); camera.near = Math.max(1, dist*0.02); camera.far = dist + HALF*4; camera.updateProjectionMatrix();
  const span = Math.min(3200, Math.max(260, dist*0.75));
  Object.assign(sun.shadow.camera, {left:-span, right:span, top:span, bottom:-span, near:10, far:span*8 + 3000}); sun.shadow.camera.updateProjectionMatrix();
  const sd = new THREE.Vector3(-0.45, 0.8, 0.4).normalize();
  sun.target.position.set(x, gy, -y); sun.position.copy(sd).multiplyScalar(span*2.6 + 600).add(sun.target.position);
  const n = night ? 1 : 0;
  scene.background.set(n ? '#101a2e' : '#e3e1d9'); scene.fog.color.copy(scene.background);
  sun.color.set(n ? '#8fa6d6' : '#fff3e2'); sun.intensity = n ? 0.16 : 0.72;
  hemi.color.set(n ? '#2b385e' : '#ffffff'); hemi.groundColor.set(n ? '#0d1018' : '#b7b1a2'); hemi.intensity = n ? 0.3 : 0.78;
  sea.material.color.set(n ? '#0f2338' : '#93aab0'); matWater.color.set(n ? '#0f2338' : '#93aab0');
  NIGHT.uNight.value = n; NIGHT.uLit.value = n ? 0.85 : 0.1; NIGHT.uDay.value = 1 - n; matLamp.opacity = n ? 0.9 : 0;
  if (window.onView) window.onView({x, y, dist, night:n});
  renderer.render(scene, camera);
  return renderer.info.render;
}
window.ENV = {scene, camera, renderer, sun, hemi, sgXY, hAt, hC, loadBin, loadJSON, b64u8, view, get HALF(){ return HALF; }, get TILE(){ return TILE; }, get BASE(){ return BASE; }};
window.view = view;
(async () => {
  try {
    BASE = await loadJSON('../../out/gba_base.json.gz');
    HALF = BASE.HALF; TS = BASE.TS; TN = BASE.TN; TILE = BASE.TILE; LON0 = BASE.lon0; LAT0 = BASE.lat0; MX = BASE.MX; MY = BASE.MY;
    const hb = b64u8(BASE.H); const h16 = new Int16Array(hb.buffer); H = new Float32Array(TN*TN); for (let i = 0; i < TN*TN; i++) H[i] = h16[i]/10;
    const Q = new URLSearchParams(location.search), mods = (Q.get('m') || '').split(',').filter(Boolean);
    for (const m of mods){ await new Promise((res, rej) => { const s = document.createElement('script'); s.src = m; s.onload = res; s.onerror = () => rej(new Error('load ' + m)); document.head.appendChild(s); }); }
    // terrain window centre: c=lat,lon, else the first focus key's SG_PLACES entry (k=...), else the map centre
    let cx = 0, cy = 0; const ks = (Q.get('k') || '').split(',').filter(Boolean), pl = window.SG_PLACES ? SG_PLACES.filter(p => ks.includes(p.type)) : [];
    if (Q.get('c')){ const [la, lo] = Q.get('c').split(',').map(Number); [cx, cy] = sgXY(la, lo); } else if (pl.length) [cx, cy] = sgXY(pl[pl.length-1].lat, pl[pl.length-1].lon);
    const img = new Image(); img.src = '../../out/ground.webp'; await img.decode(); buildTerrain(img, cx, cy, +(Q.get('tw') || 9000));
    buildWater(readWater(await loadBin('../../out/gba_water.bin.gz')));
    if (window.MODULE_INIT) await window.MODULE_INIT(window.ENV);
    window.READY = true;
  } catch (e){ console.error(e); window.READY = 'error: ' + e.message; }
})();
