// ===== v47 · hk/zz_models — downloaded glTF models (Sketchfab, CC BY 4.0) =====
// Free models chosen with the owner (27 Nov 2026), optimised with glTF-Transform (WebP textures at most 1024 px, quantised
// meshes) into hkdata/models/. Every one is CC BY 4.0: the authors are credited in MODELS below, in README / DATA_LICENSE and on
// the map. Loaded after the city is ready; until a model arrives the page keeps its own (hand-made or procedural) version.
//  - Bank of China Tower (Raise3D): replaces the hand-made hkboc (hk/admiralty). The model's tower is a 50 m square, mast tip
//    354.2 m above its plaza; scaled x1.0372 to the real 367.4 m tip (CTBUH), which makes the plan 51.9 m (real: 52 m). Its
//    tallest shaft faces the model's -z side; turned 164 deg so that shaft faces the real south-west side of the OSM footprint
//    (the corner order of the shafts, 315 / 160 / 110 / 210 m clockwise, then matches the real tower; no mirroring needed).
//    Night: the glass keeps the window-light grid of the landmark shader, the white frame glows (the light show).
//  - Taxi and double-decker bus (businessyuen): replace the near models of the 'taxi' and 'dd' traffic types. Their colours come
//    from small palette textures and are baked into vertex colours; they are scaled to the traffic sizes (taxi 4.6 x 2.0 x 1.75 m
//    with the roof sign, bus 12 x 2.9 x 4.4 m with mirrors). Head / tail lights and lit bus windows are marked by face direction
//    and colour (an estimate of where the lamps are).
// Needs THREE.GLTFLoader (r128, examples/js/loaders/GLTFLoader.js, added to the page by hkreal/patch_hk.py). Test handle: window.HKM.
(() => {
  const MODELS = {
    boc:  {file:'boc_raise3d.glb', title:'Bank of China Tower', author:'Raise3D', url:'https://sketchfab.com/3d-models/b99aa9bd3f574287bfb3e208705752de'},
    taxi: {file:'taxi.glb', title:'Taxi', author:'businessyuen', url:'https://sketchfab.com/3d-models/8ded9c1a90eb40f387e05b2b6cc6de62'},
    bus:  {file:'bus.glb', title:'Bus', author:'businessyuen', url:'https://sketchfab.com/3d-models/cc159e95590b49999c6e08793eb0a76a'},
  };
  const S = {state:'wait', loaded:{}, err:[], boc:0, veh:{}};
  window.HKM = S; S.MODELS = MODELS;
  const base = () => { try { return SGR_PATH + 'models/'; } catch (e){ return 'hkdata/models/'; } };
  const cache = new Map();
  function load(key){
    if (cache.has(key)) return cache.get(key);
    const p = new Promise((res, rej) => {
      if (!THREE.GLTFLoader){ rej(new Error('no GLTFLoader')); return; }
      new THREE.GLTFLoader().load(base() + MODELS[key].file, g => { S.loaded[key] = true; res(g.scene); }, undefined, e => rej(e));
    });
    cache.set(key, p); return p;
  }
  S.load = load;
  // ---------------------------------------------------------------- Bank of China Tower
  const BOC = {S:367.4/354.23, cx:38.5, cz:176.1, y0:-143.11, rot:2.863};
  function bocBuild(src){
    return function(){
      const g = new THREE.Group(), u = LMCTX.u, top = u.base.value;
      const L = landmarks.find(q => q.type === 'hkboc');
      // lowest ground under the tower square (its corners and centre), so the plaza sits on Garden Road's slope like the old model
      let gmin = Infinity;
      if (L){ const c = Math.cos(BOC.rot), s = Math.sin(BOC.rot);
        for (const [px, pz] of [[0, 0], [26, 26], [26, -26], [-26, 26], [-26, -26]]){ const x = px*c + pz*s, z = -px*s + pz*c; gmin = Math.min(gmin, hC(L.x + x, L.y - z)); } }
      const dy = isFinite(gmin) ? gmin - top - 0.3 : -0.3;
      const w = new THREE.Group(), m = src.clone(true);
      m.position.set(-BOC.cx, -BOC.y0, -BOC.cz); w.add(m); w.scale.setScalar(BOC.S); w.rotation.y = BOC.rot; w.position.y = dy;
      const uFrame = Object.assign({}, u, {mode:{value:0}});
      let n = 0;
      m.traverse(o => {
        if (!o.isMesh) return;
        const om = o.material, map = om.map || null, col = om.color ? om.color.clone() : new THREE.Color(1, 1, 1);
        if (map){ map.encoding = THREE.LinearEncoding; map.anisotropy = 4; map.needsUpdate = true; }
        const lum = 0.3*col.r + 0.59*col.g + 0.11*col.b, frame = !map && lum > 0.62;
        const mat = new THREE.MeshLambertMaterial({color:col, map, side:THREE.FrontSide, transparent:!!om.transparent, opacity:om.opacity !== undefined ? om.opacity : 1});
        if (frame) lmShader(mat, uFrame, '#f2f6ff', 1.25); else lmShader(mat, u, null, 0);
        LMCTX.mats.set('glb' + (n++), mat);
        o.material = mat; o.castShadow = true; o.receiveShadow = true;
      });
      g.add(w); g.userData.keep = [w];
      return g;
    };
  }
  function swapLandmark(type, build){
    const def = LANDMARKS[type]; if (!def) return false;
    def.build = build;
    for (const L of landmarks) if (L.type === type){
      const g0 = lmMeshes.get(L.id); if (g0){ lmGroup.remove(g0); g0.traverse(o => { if (o.geometry && !o.userData.glb) o.geometry.dispose(); }); lmMeshes.delete(L.id); }
      if (L.mats){ for (const m of L.mats.values()) m.dispose(); L.mats = null; } L.fx = [];
      placeLandmarkMesh(L);
    }
    return true;
  }
  // ---------------------------------------------------------------- vehicles: glTF -> traffic geometry
  function texSampler(map){
    const im = map && map.image; if (!im || !im.width) return null;
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0); const d = cx.getImageData(0, 0, im.width, im.height).data, W = im.width, H = im.height;
    return (u, v) => { u = u - Math.floor(u); v = v - Math.floor(v); const x = Math.min(W - 1, Math.floor(u*W)), y = Math.min(H - 1, Math.floor(v*H)), i = (y*W + x)*4; return [d[i]/255, d[i + 1]/255, d[i + 2]/255]; };
  }
  // dims: target length (x), width (z), height (y); the model's length axis is z, its front +z
  function vehGeo(src, dims, kind){
    src.updateMatrixWorld(true);
    const P = [], N = [], C = [], PA = [], LG = [];
    const v = new THREE.Vector3(), nv = new THREE.Vector3(), nm = new THREE.Matrix3();
    src.traverse(o => {
      if (!o.isMesh) return;
      const g0 = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, pos = g0.attributes.position, nor = g0.attributes.normal, uv = g0.attributes.uv;
      const smp = texSampler(o.material.map), base = o.material.color || new THREE.Color(1, 1, 1);
      nm.getNormalMatrix(o.matrixWorld);
      for (let i = 0; i < pos.count; i++){
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); P.push(v.x, v.y, v.z);
        if (nor){ nv.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize(); N.push(nv.x, nv.y, nv.z); } else N.push(0, 1, 0);
        let c = [base.r, base.g, base.b]; if (smp && uv){ const t = smp(uv.getX(i), uv.getY(i)); c = [c[0]*t[0], c[1]*t[1], c[2]*t[2]]; }
        C.push(c[0], c[1], c[2]); PA.push(0); LG.push(0);
      }
      if (g0 !== o.geometry) g0.dispose();
    });
    // bounds -> scale to the traffic size; length along x (model z -> x, model x -> -z)
    let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++){ mn[k] = Math.min(mn[k], P[i + k]); mx[k] = Math.max(mx[k], P[i + k]); }
    const sz = mx[2] - mn[2], sx = mx[0] - mn[0], sy = mx[1] - mn[1], cx = (mn[0] + mx[0])/2, cz = (mn[2] + mx[2])/2;
    const kL = dims[0]/sz, kW = dims[1]/sx, kH = dims[2]/sy;
    const P2 = new Float32Array(P.length), N2 = new Float32Array(N.length);
    for (let i = 0; i < P.length; i += 3){
      const X = (P[i + 2] - cz)*kL, Y = (P[i + 1] - mn[1])*kH, Z = -(P[i] - cx)*kW; P2[i] = X; P2[i + 1] = Y; P2[i + 2] = Z;
      let nx = N[i + 2]/kL, ny = N[i + 1]/kH, nz = -N[i]/kW; const l = Math.hypot(nx, ny, nz) || 1; N2[i] = nx/l; N2[i + 1] = ny/l; N2[i + 2] = nz/l;
    }
    // lamps (estimate): per triangle, by facing and colour
    const half = dims[0]/2;
    for (let t = 0; t < P2.length/9; t++){
      let ax = 0, ay = 0, az = 0, cr = 0, cg = 0, cb = 0, fx = 0, fy = 0, fz = 0;
      for (let j = 0; j < 3; j++){ const i = t*9 + j*3; ax += P2[i]/3; ay += P2[i + 1]/3; az += P2[i + 2]/3; cr += C[i]/3; cg += C[i + 1]/3; cb += C[i + 2]/3; fx += N2[i]/3; fy += N2[i + 1]/3; fz += N2[i + 2]/3; }
      const lum = 0.3*cr + 0.59*cg + 0.11*cb, hN = ay/dims[2];
      let L = 0;
      if (fx > 0.55 && ax > half*0.8 && hN < (kind === 'bus' ? 0.2 : 0.55) && lum > 0.6) L = 1;                       // headlamps: light, low, front
      else if (fx < -0.55 && ax < -half*0.8 && hN < (kind === 'bus' ? 0.25 : 0.6) && cr > 0.45 && cr > cg*1.6) L = 2;  // tail lamps: red, low, rear
      else if (kind === 'bus' && Math.abs(fz) > 0.7 && hN > 0.22 && hN < 0.92 && lum < 0.42 && Math.abs(cr - cb) < 0.25) L = 3;   // lit windows
      else if (kind === 'taxi' && fy > 0.3 && hN > 0.88 && lum > 0.7) L = 5;                                            // roof sign
      if (L) for (let j = 0; j < 3; j++) LG[t*3 + j] = L;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P2, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N2, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aPaint', new THREE.Float32BufferAttribute(PA, 1)); g.setAttribute('aLight', new THREE.Float32BufferAttribute(LG, 1));
    g.computeBoundingSphere();
    return g;
  }
  S.vehGeo = vehGeo;
  // ---------------------------------------------------------------- start
  const ready = () => { try { return SGR.on && landmarks.length > 20 && lmMeshes.size > 20 && !!THREE.GLTFLoader; } catch (e){ return false; } };
  let tries = 0;
  function tick(){
    if (!ready()){ if (++tries > 400){ S.state = 'timeout'; return; } setTimeout(tick, 700); return; }
    S.state = 'loading';
    const jobs = [];
    if (LANDMARKS.hkboc) jobs.push(load('boc').then(sc => { sc.traverse(o => { if (o.isMesh) o.userData.glb = true; }); swapLandmark('hkboc', bocBuild(sc)); S.boc = 1; try { if (SGR.on) sgrLandmarksChanged(); } catch (e){ } }).catch(e => S.err.push('boc: ' + e)));
    const T = window.SGTraffic;
    if (T && T.swapModel){
      jobs.push(load('taxi').then(sc => { S.veh.taxi = T.swapModel('taxi', vehGeo(sc, [4.6, 2.0, 1.75], 'taxi')); }).catch(e => S.err.push('taxi: ' + e)));
      jobs.push(load('bus').then(sc => { S.veh.dd = T.swapModel('dd', vehGeo(sc, [12.0, 2.9, 4.4], 'bus')); }).catch(e => S.err.push('bus: ' + e)));
    }
    Promise.all(jobs).then(() => { S.state = 'done'; });
  }
  setTimeout(tick, 2500);
})();
