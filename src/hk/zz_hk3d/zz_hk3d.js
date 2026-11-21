// ===== v42 · hk/zz_hk3d — Hong Kong's buildings from the official 3D map =====
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
  // ---- v44 facade: day window grid on top of the engine's landmark material (night windows use the same floor / column grid) ----
  const DAY_GLSL = `
{
  vec3 Nw2 = normalize(vWN);
  float vert = 1.0 - step(0.45, abs(Nw2.y));
  float hz2 = abs(Nw2.x) > abs(Nw2.z) ? vWP.z : vWP.x;
  float wy = step(uSill, fract(vWP.y / uFH)), wx = step(uMul, fract(hz2 / uCW));
  float above = step(uBase + 5.0, vWP.y);
  float far = smoothstep(350.0, 1800.0, distance(vWP, uCam));   // own uniform: three does not set cameraPosition for Lambert
  float cov = (1.0 - uSill) * (1.0 - uMul);
  float win = mix(wy * wx, cov, far) * vert * above;
  diffuseColor.rgb = mix(diffuseColor.rgb, uGlass, win * uWK);
}`;
  const camPos = () => { try { return camera.position; } catch (e){ return new THREE.Vector3(0, 1e5, 0); } };
  function facade(mat, st){
    if (mat.userData.hk3dDay) return mat;
    mat.userData.hk3dDay = true;
    const prev = mat.onBeforeCompile, U = {uGlass:{value:new THREE.Color(st.glass)}, uSill:{value:st.sill}, uMul:{value:st.mul}, uWK:{value:st.wk}, uCam:{value:camPos()}};
    mat.onBeforeCompile = sh => { prev(sh); Object.assign(sh.uniforms, U); S.day = (S.day || 0) + 1;
      sh.fragmentShader = sh.fragmentShader.replace('uniform float uCW;', 'uniform float uCW; uniform vec3 uCam; uniform vec3 uGlass; uniform float uSill; uniform float uMul; uniform float uWK;')
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + DAY_GLSL); };
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
      const r = await fetch(base() + 'hk3d.bin'); if (!r.ok){ S.state = 'nofile'; return; }
      const buf = await r.arrayBuffer(), dv = new DataView(buf);
      if (dv.getUint32(0, true) !== 0x44334b48){ S.state = 'badfile'; return; }        // 'HK3D'
      const n = dv.getUint32(4, true), J = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, n))), off0 = (8 + n + 3) & ~3;
      const mob = typeof window !== 'undefined' && window.CB_MOBILE;
      let list = J.b.filter(e => !mob || e.rep.length || e.h >= 180);
      if (typeof location !== 'undefined' && /hk3dtest/.test(location.search)) list = list.filter(e => e.rep.length).slice(0, 16);   // test handle: a few landmarks only
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
    // towers: light frame, darker glass on a 3.8 m floor / 3 m column grid; lower blocks: wall with windows on 3.1 m / 2.6 m
    const st = hi ? {glass:shade(wall, -0.4), sill:0.3, mul:0.2, wk:0.85, fh:3.8, cw:3.0} : {glass:shade(wall, -0.5), sill:0.38, mul:0.34, wk:0.8, fh:3.1, cw:2.6};
    const spec = {c:hi ? shade(wall, 0.25) : wall, lk:hi ? 0.5 : 0.4, fh:st.fh, cw:st.cw};
    const build = () => {
      const g = new THREE.Group(), geo = geoOf(e, buf, off0, q), top = LMCTX.u.base.value, P = geo.attributes.position.array;
      // lowest ground under the footprint (vertices in the lowest 3 m), so the model stands on the street, not on the hillside
      let gmin = Infinity; for (let i = 0; i < P.length; i += 3*Math.max(1, Math.floor(P.length/3/48))) if (P[i+1] < 3) gmin = Math.min(gmin, hC(x + P[i], y - P[i+2]));
      const dy = isFinite(gmin) ? Math.min(0, gmin - top + 0.3) : 0;
      const m = lmAdd(g, geo, spec, 0, dy, 0); facade(m.material, st); return g; };
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
      LANDMARKS[k] = {zh:e.zh || e.en || '', en:e.zh ? (e.en || '') : '', cat:'hk3d', label:lab, near:e.h >= 250 ? 2500 : 1200, r:8, h:e.h, lt:{m:hi ? 1 : 0, c:hi ? '#d6e4ff' : '#ffc98a', k:hi ? 0.6 : 0.8}, hk3d:e.id, build};
      const L = {id:lmSeq++, type:k, x, y, rot:0, sg:true}; landmarks.push(L);
      try { placeLandmarkMesh(L); S.added++; } catch (err){ landmarks.pop(); S.err = k + ': ' + err; }
    }
    for (const hk of e.hide.concat(e.rep.slice(1))){ const def = LANDMARKS[hk]; if (!def) continue; def.build = () => new THREE.Group(); def.label = false;   // emptied: no geometry, no name tag
      for (const L of landmarks) if (L.type === hk){ swapOut(L); try { placeLandmarkMesh(L); } catch (err){ } } S.hidden++; }
  }
})();
