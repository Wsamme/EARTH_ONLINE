// ===== v42 · hk/zz_hk3d — Hong Kong's buildings from the official 3D map =====
// v46 (27 Nov 2026): the official BUILDINGS are out again; the hand-made landmarks and the map footprints are back. hk3d.bin now holds
// only the official infrastructure models (footbridges, covered walkways, the Central–Mid-Levels escalator, kiosks, vents) on all
// staged sheets, built with HK3D_INFRA_ONLY=1 (tools/build3d.py), minus the waterfront observation wheel (the page has its own
// turning wheel). They replace and hide nothing: no landmark is swapped, and no map building under a walkway is removed
// (nohull). Phones skip the file. The notes below describe v42–v45, when the file also carried buildings; the code for that
// (facade styles, replacing landmarks) is kept and simply not used by an infrastructure-only file.
// Every building of 100 m or more in Central, Sheung Wan, Admiralty, Wan Chai, Causeway Bay, Tsim Sha Tsui, Mong Kok and West
// Kowloon (49 map sheets), plus the podiums and parts of the hand-made complexes they replace, from the Lands Department's
// "3D Visualisation Map (Non-textured models)" (glTF, HK1980 Grid; 3d.map.gov.hk / CSDI portal). Geometry is simplified
// (about 9 triangles per metre of height; v44: landmarks and towers of 150 m or more keep up to 20,000
// triangles, 50 per metre) and packed into hkdata/hk3d.bin by hk/zz_hk3d/tools/build3d.py.
// Source: HKSAR Government, Lands Department (3D Visualisation Map; Building dataset for names, via DATA.GOV.HK); free use with attribution. The models carry no colour: the facade tones below are
// approximations (glass tones for towers of 150 m or more, concrete tones below), not data. v44: a hand-made landmark that is
// replaced lends its facade colour to the official model (the main colour of its walls, by area). Every model gets a window grid
// by day (world-space, like the night windows, so it needs no texture), fading to the average tone in the distance.
// Loading: after the city's landmarks are placed, the file is fetched; each building replaces the hand-made model whose anchor it
// contains (the landmark keeps its name, card and night-light mode) or is added as a new landmark named from LandsD data; hand-made parts inside
// it are emptied. The model's bottom is put on the lowest ground under its footprint. Phones load only named and very tall ones.
// Loads last (zz_): it may override keys defined by the other modules. Test handle: window.HK3D.
(() => {
  const S = {state:'wait', n:0, rep:0, hidden:0, added:0, ms:0, err:null};
  if (typeof window !== 'undefined') window.HK3D = S;
  const PAL_HI = ['#8fa4b4', '#7e95a8', '#9aabb6', '#a7b4bc', '#6f8799', '#b3bec4'];
  const PAL_LO = ['#d2cdc2', '#c7c9c6', '#d9d1bf', '#bdbfbd', '#cfc6b4', '#c4c0b6', '#dad7cf'];
  // ---- v45 facade patterns, on top of the engine's landmark material (night windows use the same floor / column grid) ----
  // u = position along each vertical face (from the foot of the building's centre on that face), y = height above the street.
  // 0 punched windows, 1 curtain wall, 2 vertical fins, 3 horizontal ribbons, 4 X-bracing (Bank of China), 5 round portholes (Jardine).
  // Each glass cell gets a small random tone so a facade is not one flat colour; far away it fades to the cell average.
  const DAY_GLSL = `
float hkWin = 0.0, hkFr = 0.0, hkY = 0.0, hkU = 0.0, hkV = 0.0;
{
  vec3 Nw2 = normalize(vWN);
  float vert = 1.0 - step(0.45, abs(Nw2.y));
  vec2 tg = normalize(vec2(-Nw2.z, Nw2.x) + vec2(1e-5, 0.0));
  float u = dot(vWP.xz - uCtr.xz, tg), y = vWP.y - uBase - uY0;
  float far = smoothstep(380.0, 2000.0, distance(vWP, uCam));   // own uniform: three does not set cameraPosition for Lambert
  float fy = fract(y / uFH), fx = fract(u / uCW);
  float rnd = fract(sin(dot(floor(vec2(u / uCW, y / uFH)), vec2(12.9898, 78.233))) * 43758.5453);
  float win = 0.0, cov = 0.0;
  if (uPat < 0.5 || (uPat > 0.5 && uPat < 1.5)){ win = step(uSill, fy) * step(uMul, fx); cov = (1.0 - uSill) * (1.0 - uMul); }
  else if (uPat < 2.5){ win = step(uMul, fx); cov = 1.0 - uMul; }
  else if (uPat < 3.5){ win = step(uSill, fy); cov = 1.0 - uSill; }
  else if (uPat < 4.5){
    // one X per module: module height uP, face half width uR; the diagonals run corner to corner, joints at module ends
    float a = u / (2.0 * uR), b = y / uP, w = uLW / min(uP, 2.0 * uR);
    float la = abs(fract(b + a) - 0.5), lb = abs(fract(b - a) - 0.5), hd = min(fract(b), 1.0 - fract(b));
    float frame = max(1.0 - step(w * 0.5, min(la, lb)), (1.0 - step(w * 0.35, hd)) * step(0.5, uSill));   // uSill > 0.5: joint bars
    frame = max(frame, step(uR - uLW * 0.6, abs(u))) * step(0.0, y);
    win = (1.0 - frame) * (0.9 + 0.1 * step(0.05, fx) * step(0.07, fy)); cov = 0.8;
  } else {
    vec2 c = vec2(fx - 0.5, fy - 0.5) * vec2(uCW, uFH); win = 1.0 - step(uR, length(c)); cov = 3.1416 * uR * uR / (uCW * uFH);
  }
  // sloped faces (crowns, Bank of China's glass roofs) of glass buildings are glass too
  float slope = step(0.45, abs(Nw2.y)) * (1.0 - step(0.97, abs(Nw2.y)));
  if (uPat > 0.5 && uPat < 2.5 || uPat > 3.5 && uPat < 4.5) vert = max(vert, slope);
  if (slope > 0.5 && uPat > 3.5 && uPat < 4.5){ win = 0.92; cov = 0.92; }
  win = mix(win, cov, far) * vert * step(uBase + 4.0, vWP.y);
  vec3 gl = uGlass * mix(0.82 + 0.36 * rnd, 1.0, far);
  diffuseColor.rgb = mix(diffuseColor.rgb, gl, win * uWK);
  // walls darken towards the street (light blocked by the street canyon), over the first ~8 m
  diffuseColor.rgb *= mix(0.6, 1.0, smoothstep(0.0, 8.0, vWP.y - uBase - uY0 + (uPat > 3.5 && uPat < 4.5 ? uY0 : 0.0)));
  hkWin = win * uWK; hkY = y; hkU = u; hkV = vert;
  if (uPat > 3.5 && uPat < 4.5) hkFr = (1.0 - win) * vert * step(0.0, y);
}`;
  // after lighting: glass reflects a sky gradient (Fresnel) with a sun highlight by day; landmark light patterns at night
  const OUT_GLSL = `
{
  float day = 1.0 - uNight;
  if (hkWin > 0.01 && uRefl > 0.0){
    vec3 Nr = normalize(vWN), Vv = normalize(vWP - uCam), Rr = reflect(Vv, Nr);
    float fres = 0.06 + 0.55 * pow(1.0 - max(dot(-Vv, Nr), 0.0), 4.0);
    vec3 sky = mix(uSkyH, vec3(0.55, 0.68, 0.82), clamp(Rr.y * 1.8, 0.0, 1.0));
    sky = mix(vec3(0.24, 0.27, 0.30), sky, smoothstep(-0.05, 0.05, Rr.y));          // below the horizon it sees the city and harbour
    vec3 sd = normalize(uSunP - uSunT);
    float sp = pow(max(dot(Rr, sd), 0.0), 220.0) * 1.8 * step(0.0, sd.y);
    outgoingLight = mix(outgoingLight, sky * day + outgoingLight * uNight, clamp(fres * hkWin * uRefl, 0.0, 1.0)) + vec3(sp * hkWin * uRefl * day);
  }
  if (uNP > 0.5 && uNight > 0.01){
    vec3 em = vec3(0.0);
    if (uNP < 1.5) em = vec3(0.92, 0.95, 1.0) * hkFr * 1.1;                                   // lit frame lines (X bracing)
    else if (uNP < 2.5){ float yy = max(hkY, 0.0) / max(uTop - uBase, 1.0); float per = mix(9.0, 2.2, yy);   // neon bands, denser to the top
      float band = 1.0 - step(0.16, fract(hkY / per)); vec3 hue = 0.5 + 0.5 * cos(6.2832 * (fract(hkY * 0.004 - uTime * 0.05) + vec3(0.0, 0.33, 0.67)));
      em = hue * band * hkV * 1.2; }
    else if (uNP < 3.5){ float gx = 1.0 - step(0.08, fract(hkU / 4.8)), gy = 1.0 - step(0.06, fract(hkY / 4.2));   // light grid on a dark facade
      vec3 hue = 0.55 + 0.45 * cos(6.2832 * (uTime * 0.03 + vec3(0.0, 0.33, 0.67))); em = hue * max(gx, gy) * hkV * 0.9; }
    else if (uNP < 4.5) em = vec3(1.0, 0.97, 0.9) * smoothstep(uTop - uBase - 45.0, uTop - uBase - 5.0, hkY) * 0.9;   // floodlit crown
    else if (uNP < 5.5) em = vec3(0.95, 0.9, 0.75) * hkWin * 0.55;                              // whole tower glowing like a lantern
    else em = vec3(0.9, 0.95, 1.0) * (1.0 - step(6.0, uTop - uBase - hkY)) * hkV;              // light band around the top
    outgoingLight += em * uNight;
  }
}`;
  // curtain-wall glass tones for generic towers (approximations)
  const GLASS = ['#3d566b', '#4a6275', '#56707f', '#3f5a5c', '#5d6f7d', '#46586a', '#62788a'];
  // Landmark facades, keyed by the hand-made landmark the official model replaces. Facade type and colours follow a sourced
  // reference table (Wikipedia en/zh, SkyscraperPage, CTBUH, the architects' pages, the Tourism Commission's Symphony of Lights
  // pages; colours there are approximations, glass is darkened a little where it would vanish against its frame).
  // Bank of China: 52 m square plan, diagonals on all four faces as a chain of diamonds (horizontal bars hidden), modules of about
  // 13 floors / 52 m from about 28 m up (slope heights 79.9 / 132 / 210.6 / 288 m); in the official model the tower plan measures
  // +/-32.1 m with vertices at 80.1, 131.9, 184 and 287.9 m, which is what is used here. pat: see DAY_GLSL.
  // np (night, from the reference table's lighting notes): 1 lit frame lines (Bank of China; the table marks this look as typical,
  // not described in its sources), 2 neon bands denser towards the top in scrolling colours (The Center), 3 colour light grid on
  // the black facade (Cheung Kong Center), 4 floodlit crown (Two IFC), 5 whole tower lit like a lantern (AIA Central),
  // 6 light band around the top (HSBC).
  const STYLE = {
    hkboc:{np:1, pat:4, frame:'#dadddf', glass:'#71889a', P:51.95, r:32.1, y0:28.15, lw:2.0, sill:0, mul:0, wk:1, fh:4.0, cw:3.2},
    hkifc2:{np:4, pat:2, frame:'#e4e1d8', glass:'#8ea2b0', sill:0, mul:0.2, wk:0.95, fh:4.2, cw:1.6},
    hkifc1:{pat:2, frame:'#e4e1d8', glass:'#8ea2b0', sill:0, mul:0.2, wk:0.95, fh:4.0, cw:1.6},
    hk41w_fourseasons:{pat:1, frame:'#d8d8d4', glass:'#93a2ab', sill:0.12, mul:0.1, wk:0.9, fh:3.4, cw:1.6},
    hkcheungkong:{np:3, pat:1, frame:'#5b6268', glass:'#262c31', sill:0.06, mul:0.05, wk:0.95, fh:2.1, cw:2.4},   // black curtain wall, 2.4 x 2.1 m panels
    hkhsbc:{np:6, pat:2, frame:'#b8bdc0', glass:'#6f7c84', sill:0, mul:0.28, wk:0.9, fh:4.4, cw:4.8},
    hk41w_stanchart:{pat:2, frame:'#b79c93', glass:'#86939b', sill:0, mul:0.3, wk:0.85, fh:3.8, cw:2.4},
    hkjardine:{pat:5, frame:'#d3d6d8', glass:'#3c4850', sill:0, mul:0, wk:1, fh:3.6, cw:2.6, r:0.95},       // round windows
    hkthecenter:{np:2, pat:3, frame:'#6e7880', glass:'#8796a2', sill:0.3, mul:0, wk:0.9, fh:4.0, cw:2.0},
    hklippo:{pat:1, frame:'#3a4656', glass:'#2a4166', sill:0.1, mul:0.08, wk:0.9, fh:3.6, cw:1.8},          // dark blue glass
    hkthreegarden:{pat:1, frame:'#b5bcc1', glass:'#8399a8', sill:0.1, mul:0.08, wk:0.9, fh:3.8, cw:1.6},
    hkvaia:{np:5, pat:2, frame:'#c7cccf', glass:'#88a3ab', sill:0, mul:0.18, wk:0.9, fh:3.8, cw:1.6},
    hkexchange:{pat:3, frame:'#c2aea2', glass:'#8f9ca5', sill:0.45, mul:0, wk:0.95, fh:3.8, cw:2.0},          // granite and silver glass bands
    hkvboa:{pat:0, frame:'#ecebe6', glass:'#3b4650', sill:0.35, mul:0.3, wk:0.85, fh:3.6, cw:2.4},
    hk41w_landmark:{pat:1, frame:'#3a3f44', glass:'#454e55', sill:0.1, mul:0.08, wk:0.9, fh:3.8, cw:1.6},
    hkvalexandra:{pat:3, frame:'#8e9497', glass:'#3e4850', sill:0.45, mul:0, wk:0.85, fh:3.6, cw:2.0},
    hkvccb:{pat:2, frame:'#cdd1d3', glass:'#8d9aa2', sill:0, mul:0.2, wk:0.9, fh:3.8, cw:1.8},
    hkvfefc:{pat:1, frame:'#9c7e36', glass:'#c2a04a', sill:0.1, mul:0.08, wk:0.9, fh:3.6, cw:1.8},          // gold glass
    hkcgo:{pat:1, frame:'#e2e4e4', glass:'#98a7af', sill:0.12, mul:0.1, wk:0.9, fh:4.0, cw:1.6},
    hklegco:{pat:1, frame:'#d5d8d9', glass:'#9aa8b0', sill:0.12, mul:0.1, wk:0.9, fh:4.0, cw:1.6},
    hkvqgo:{pat:0, frame:'#cfc9be', glass:'#404a52', sill:0.35, mul:0.35, wk:0.85, fh:3.4, cw:2.2},
    hkbocold:{pat:0, frame:'#a7a196', glass:'#3f4549', sill:0.4, mul:0.45, wk:0.85, fh:3.6, cw:2.0},
    hkvcosco:{pat:1, frame:'#b9bec1', glass:'#7b8892', sill:0.1, mul:0.08, wk:0.9, fh:3.6, cw:1.6},
    hkvhangseng:{pat:2, frame:'#c9ccce', glass:'#7c8990', sill:0, mul:0.25, wk:0.9, fh:3.8, cw:2.0},
  };
  const EDGE = new Map();
  function edgeMat(hex){
    let m = EDGE.get(hex); if (m) return m;
    m = new THREE.LineBasicMaterial({color:hex, transparent:true, opacity:0.55, depthWrite:false});
    const U = {uCam:{value:camPos()}};
    m.onBeforeCompile = sh => { Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vEP;').replace('#include <project_vertex>', '#include <project_vertex>\nvEP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vEP; uniform vec3 uCam;')
        .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity * (1.0 - smoothstep(250.0, 1400.0, distance(vEP, uCam))) );'); };
    EDGE.set(hex, m); return m;
  }
  const skyH = () => { try { return scene.background && scene.background.isColor ? scene.background : new THREE.Color('#e3e1d9'); } catch (e){ return new THREE.Color('#e3e1d9'); } };
  const sunV = k => { try { return k === 'position' ? sun.position : sun.target.position; } catch (e){ return k === 'position' ? new THREE.Vector3(1, 2, 1) : new THREE.Vector3(); } };
  const camPos = () => { try { return camera.position; } catch (e){ return new THREE.Vector3(0, 1e5, 0); } };
  function facade(mat, st, cx, cz){
    if (mat.userData.hk3dDay) return mat;
    mat.userData.hk3dDay = true;
    const prev = mat.onBeforeCompile, U = {uGlass:{value:new THREE.Color(st.glass)}, uSill:{value:st.sill}, uMul:{value:st.mul}, uWK:{value:st.wk}, uCam:{value:camPos()},
      uPat:{value:st.pat || 0}, uP:{value:st.P || 50}, uLW:{value:st.lw || 1.2}, uR:{value:st.r || 0.6}, uY0:{value:st.y0 || 0}, uCtr:{value:new THREE.Vector3(cx, 0, cz)},
      uRefl:{value:st.refl !== undefined ? st.refl : (st.pat === 1 || st.pat === 2 || st.pat === 4 ? 1 : 0.45)}, uNP:{value:st.np || 0},
      uSkyH:{value:skyH()}, uSunP:{value:sunV('position')}, uSunT:{value:sunV('target')}};
    mat.onBeforeCompile = sh => { prev(sh); Object.assign(sh.uniforms, U); S.day = (S.day || 0) + 1;
      sh.fragmentShader = sh.fragmentShader.replace('uniform float uCW;', 'uniform float uCW; uniform vec3 uCam; uniform vec3 uGlass; uniform float uSill; uniform float uMul; uniform float uWK; uniform float uPat; uniform float uP; uniform float uLW; uniform float uR; uniform float uY0; uniform vec3 uCtr; uniform float uRefl; uniform float uNP; uniform vec3 uSkyH; uniform vec3 uSunP; uniform vec3 uSunT;')
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + DAY_GLSL)
        .replace('#include <envmap_fragment>', '#include <envmap_fragment>\n' + OUT_GLSL); };   // r128 Lambert: just before gl_FragColor
    mat.needsUpdate = true; return mat;
  }
  const shade = (hex, k) => { const c = new THREE.Color(hex); return '#' + (k > 0 ? c.lerp(new THREE.Color('#ffffff'), k) : c.lerp(new THREE.Color('#0b1218'), -k)).getHexString(); };
  // main wall colour of a placed hand-made model: area of its near-vertical triangles, by material colour
  function wallColour(g){
    if (!g) return null; const acc = new Map(), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
    g.traverse(o => { if (!o.isMesh || !o.material || !o.material.color || !o.geometry) return; const P = o.geometry.attributes.position, I = o.geometry.index; if (!P) return;
      const key = o.material.color.getHexString(); let s = 0, cnt = I ? I.count : P.count;
      for (let t = 0; t < cnt; t += 3){ const i0 = I ? I.getX(t) : t, i1 = I ? I.getX(t+1) : t+1, i2 = I ? I.getX(t+2) : t+2;
        a.fromBufferAttribute(P, i0); b.fromBufferAttribute(P, i1); c.fromBufferAttribute(P, i2); n.subVectors(b, a).cross(c.sub(a)); const ar = n.length()/2;
        if (ar > 0 && Math.abs(n.y)/(2*ar) < 0.4) s += ar; }
      acc.set(key, (acc.get(key) || 0) + s); });
    let best = null, bs = 0; for (const [k, v] of acc) if (v > bs){ bs = v; best = k; }
    return best ? '#' + best : null;
  }
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const ready = () => { try { return SGR.on && landmarks.length > 20 && lmMeshes.size > 20; } catch (e){ return false; } };
  const base = () => { try { return SGR_PATH; } catch (e){ return 'hkdata/'; } };
  function tick(){ if (!ready()){ setTimeout(tick, 600); return; } S.state = 'fetch'; load(); }
  setTimeout(tick, 1500);
  async function load(){
    const t0 = performance.now();
    try {
      if (typeof window !== 'undefined' && window.CB_MOBILE){ S.state = 'phone'; return; }   // v46: phones skip the footbridges
      const r = await fetch(base() + 'hk3d.bin'); if (!r.ok){ S.state = 'nofile'; return; }
      const buf = await r.arrayBuffer(), dv = new DataView(buf);
      if (dv.getUint32(0, true) !== 0x44334b48){ S.state = 'badfile'; return; }        // 'HK3D'
      const n = dv.getUint32(4, true), J = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, n))), off0 = (8 + n + 3) & ~3;
      const mob = typeof window !== 'undefined' && window.CB_MOBILE;
      let list = J.b.filter(e => e.kind === 'infra' && (!mob || e.rep.length || e.h >= 180));   // v46: infrastructure only
      if (typeof location !== 'undefined' && /hk3dtest/.test(location.search)) list = list.slice().sort((a, b) => b.nt - a.nt).slice(0, 16);   // test handle: the 16 largest only
      S.n = list.length; S.state = 'place';
      let i = 0;
      const step = () => { const tEnd = performance.now() + 24; while (i < list.length && performance.now() < tEnd) put(list[i++], buf, off0, J.q); if (i < list.length) setTimeout(step, 0); else done(t0); };
      step();
    } catch (e){ S.state = 'error'; S.err = String(e); }
  }
  function done(t0){ try { if (SGR.on) sgrLandmarksChanged(); } catch (e){ }
    try { syncLabels(); } catch (e){ }        // map labels for the newly named buildings
    S.state = 'done'; S.ms = Math.round(performance.now() - t0); }
  function swapOut(L){
    const g = lmMeshes.get(L.id); if (g){ lmGroup.remove(g); g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); lmMeshes.delete(L.id); }
    if (L.mats){ for (const m of L.mats.values()) m.dispose(); L.mats = null; } L.fx = [];
  }
  function geoOf(e, buf, off0, q){
    const pos = new Int16Array(buf, off0 + e.off, e.nv*3), idx = new Uint16Array(buf, off0 + e.off + e.nv*6, e.nt*3), f = new Float32Array(e.nv*3);
    for (let i = 0; i < e.nv; i++){ f[i*3] = pos[i*3]*q; f[i*3+1] = pos[i*3+2]*q; f[i*3+2] = -pos[i*3+1]*q; }   // x east, y up, z = -north
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(f, 3)); g.setIndex(new THREE.BufferAttribute(new Uint16Array(idx), 1));
    return g;
  }
  function put(e, buf, off0, q){
    const [x, y] = sgXY(e.lat, e.lon), hi = e.h >= 150, hs = hash(e.id), pal = hi ? PAL_HI : PAL_LO;
    const rk0 = e.rep[0]; let own = null;
    if (rk0 && LANDMARKS[rk0]) for (const L of landmarks) if (L.type === rk0){ own = wallColour(lmMeshes.get(L.id)); break; }
    const wall = own || pal[hs % pal.length];
    // v45: a landmark with its own facade style (STYLE, keyed by the landmark it replaces) uses that; the rest get a pattern by height:
    // towers of 150 m+ a curtain wall, 60-150 m ribbon windows or punched windows (by hash), lower blocks punched windows.
    let st = STYLE[rk0] ? Object.assign({}, STYLE[rk0]) : null, frameC;
    if (e.kind === 'infra'){ st = {pat:0, glass:'#9a9a94', sill:0, mul:0, wk:0, refl:0, fh:3.0, cw:3.0}; frameC = '#bdbcb5'; }   // footbridges, kiosks, vents: plain concrete
    else if (st){ frameC = st.frame; }
    else if (hi){ const gl = GLASS[hs % GLASS.length]; st = {pat:1, glass:gl, sill:0.12, mul:0.1, wk:0.9, fh:3.8, cw:1.6}; frameC = shade(gl, 0.45); }
    else if (e.h >= 60 && (hs >> 3) % 2){ st = {pat:3, glass:shade(wall, -0.55), sill:0.42, mul:0, wk:0.85, fh:3.4, cw:2.0}; frameC = wall; }
    else { st = {pat:0, glass:shade(wall, -0.5), sill:0.38, mul:0.34, wk:0.8, fh:3.1, cw:2.6}; frameC = wall; }
    const spec = {c:frameC, lk:e.kind === 'infra' ? 0 : hi ? 0.5 : 0.4, fh:st.fh, cw:st.cw};
    const build = () => {
      const g = new THREE.Group(), geo = geoOf(e, buf, off0, q), top = LMCTX.u.base.value, P = geo.attributes.position.array;
      // lowest ground under the footprint (vertices in the lowest 3 m), so the model stands on the street, not on the hillside
      let gmin = Infinity; for (let i = 0; i < P.length; i += 3*Math.max(1, Math.floor(P.length/3/48))) if (P[i+1] < 3) gmin = Math.min(gmin, hC(x + P[i], y - P[i+2]));
      const dy = isFinite(gmin) ? Math.min(0, gmin - top + 0.3) : 0;
      const m = lmAdd(g, geo, spec, 0, dy, 0); facade(m.material, Object.assign({}, st, {y0:(st.y0 || 0) + dy}), x, -y);
      // v45: the building's sharp edges (corners, roof lines, setbacks) as thin lines, fading out with distance
      if (e.h >= 6){ const ln = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 28), edgeMat(shade(frameC, -0.4))); ln.position.set(0, dy, 0); g.add(ln); }
      return g; };
    const rk = e.rep[0];
    if (rk && LANDMARKS[rk]){
      const def = LANDMARKS[rk]; def.build = build; def.r = 8; def.h = e.h; def.hk3d = e.id;
      for (const L of landmarks) if (L.type === rk){ swapOut(L); L.x = x; L.y = y; L.rot = 0; try { placeLandmarkMesh(L); } catch (err){ S.err = rk + ': ' + err; } }
      S.rep++;
    } else {
      const k = 'hk3d_' + e.id;
      // real name from the Lands Department building data (see tools/addnames.py); map label only for named towers of 100 m or more,
      // shown when the camera is near (1.2 km, or 2.5 km for 250 m and taller) so the skyline does not fill with text
      const lab = !!(e.lab && e.h >= 100);
      LANDMARKS[k] = {zh:e.zh || e.en || '', en:e.zh ? (e.en || '') : '', cat:'hk3d', label:lab, nohull:e.kind === 'infra', near:e.h >= 250 ? 2500 : 1200, r:8, h:e.h, lt:{m:hi ? 1 : 0, c:hi ? '#d6e4ff' : '#ffc98a', k:e.kind === 'infra' ? 0 : hi ? 0.6 : 0.8}, hk3d:e.id, build};
      const L = {id:lmSeq++, type:k, x, y, rot:0, sg:true}; landmarks.push(L);
      try { placeLandmarkMesh(L); S.added++; } catch (err){ landmarks.pop(); S.err = k + ': ' + err; }
    }
    for (const hk of e.hide.concat(e.rep.slice(1))){ const def = LANDMARKS[hk]; if (!def) continue; def.build = () => new THREE.Group(); def.label = false;   // emptied: no geometry, no name tag
      for (const L of landmarks) if (L.type === hk){ swapOut(L); try { placeLandmarkMesh(L); } catch (err){ } } S.hidden++; }
  }
})();
