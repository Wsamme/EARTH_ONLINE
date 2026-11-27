// ===== v47 · tyo/zz_models — downloaded glTF models for Tokyo (Sketchfab, CC BY 4.0 / CC0) =====
// Same pattern as hk/zz_models: free models are optimised (glTF-Transform, WebP textures at most 1024 px) into tyodata/models/
// and loaded after the city is ready; until a model arrives (or if its file is missing) the page keeps its own hand-made or
// procedural version. Candidates: scratchpad models_search/tyo.json (the index there is noted per entry as 'cand').
//  - Landmarks: MODELS[k].lm names the LANDMARKS key the model replaces. The model is placed by the transform data MODELS[k].T,
//    in the landmark's own local frame (the group the engine places at the landmark and turns by its SG_PLACES rot; local +x east,
//    -z north when rot is 0):
//      h     real height (m) of the model's top above its base; the model is scaled uniformly to it (hSrc: where the figure is from)
//      s     explicit uniform scale instead of h (for models whose bounding box includes things that are not the building)
//      up    'y' (glTF default) or 'z' (a Z-up export: turned -90 deg about x first)
//      pivot 'base' (default: centre of the model's plan bounding box, at its lowest point) or [x, y, z] in model units
//      ry    turn about +y (rad, three.js sense) so the model's front matches the OSM footprint in the local frame
//      at    [x, z] local position of the pivot (default [0, 0])
//      mirror true if the model is built mirror-image (scale x -1; faces drawn double-sided)
//      ground 'min' (default: the lowest real ground under the model's plan, so a foundation never floats), 'base' (the engine's
//            landmark base, i.e. the highest ground round the landmark), or a number (absolute height above the sea, for bridges)
//      sink  metres pushed into the ground (default 0.3)
//      lit   {lum, c, k}: untextured parts lighter than lum glow c (strength k) at night, like the Bank of China's frame
//      mode  window-light mode of the landmark shader for the model (0 floodlit, 1 window grid); default the landmark's own
//  - Traffic: MODELS[k].veh names the traffic type whose near model is replaced (window.SGTraffic.swapModel), dims = [length,
//    width, height] in metres (null = keep the model's own proportions, scaled by length), paint = [r, g, b, tol]: triangles of
//    that colour become body paint tinted by each vehicle's colour (so one car model gives the whole colour mix).
// Entries with todo:true are planned (file not downloaded yet) and are never requested. Every author is credited below; the
// lead adds them to README / DATA_LICENSE and the on-map credits (TYM.credits() lists the loaded ones).
// glTF-Transform's quantisation stores positions / normals / UVs as normalised integers; three r128 reads such attributes raw on
// the CPU (BufferAttribute.getX does not denormalise), so every loaded model is converted to plain floats first (dequant): the
// engine's landmark ground plan (sgrLandmarkHulls), the ground fit and the vehicle colour baking all read positions and UVs.
// Needs THREE.GLTFLoader (r128, examples/js/loaders/GLTFLoader.js, in the shared page template). Test handle: window.TYM.
(() => {
  const MODELS = {
    // ---------------------------------------------------------------- landmarks
    // Tokyo Tower: 333 m (en.wikipedia "Architectural 333 m"). The hand-made tower's square is turned by FD phi = 0.58959 rad
    // (frame rotation.y = -phi), its centre at the local origin (rot 0). FootTown (5 storeys, between the legs) is part of the
    // hand-made build and goes with it unless the model has it.
    tokyotower: {todo:true, lm:'tytokyotower', cand:0, file:'tokyotower.glb', title:'Tokyo Tower/Japanese Radio Tower', author:'zebadiahsantos',
      license:'CC BY 4.0', url:'https://sketchfab.com/3d-models/5eb3686fb3364ffa8f956eabfa388da6',
      T:{h:333, hSrc:'https://en.wikipedia.org/wiki/Tokyo_Tower', ry:-0.58959 /* + k*PI/2 once the model's axes are known */, at:[0, 0], ground:'min',
        lit:{lum:0.7, c:'#ffa64d', k:1.2}}},
    // Shinjuku Park Tower: 235 m to the tip (CTBUH 235 m, architectural top 232.6 m). Rot 0; the three towers' rings are FD.towers.
    parktower: {todo:true, lm:'typarktower', cand:4, file:'parktower.glb', title:'Shinjuku Park Tower (Tokyo)', author:'aitortilla01',
      license:'CC BY 4.0', url:'https://sketchfab.com/3d-models/0b53fac684a448349220104e8309956c',
      T:{h:235, hSrc:'https://www.skyscrapercenter.com/building/shinjuku-park-tower/1076', ry:0 /* TODO: from FD.typarktower.towers */, at:[0, 0], ground:'min'}},
    // Tokyo Opera City Tower: 234 m (en.wikipedia, roof). Rot 0; the square shaft (FD parts) is turned: its sides run at -38.0 deg
    // in the local (x, z) plane, centre at the origin.
    operacity: {todo:true, lm:'tyoperacity', cand:3, file:'operacity.glb', title:'Tokyo Opera City Tower', author:'azusa.miuyuuma',
      license:'CC BY 4.0', url:'https://sketchfab.com/3d-models/1b9e387be57649ea9d6751bcec2c1e27',
      T:{h:234, hSrc:'https://en.wikipedia.org/wiki/Tokyo_Opera_City_Tower', ry:0 /* TODO: model axis -> 38.0 deg */, at:[0, 0], ground:'min'}},
    // Meiji Jingu Otorii: 12 m high, 17.1 m wide (the hand-made module's figures; the module says the torii spans north-south).
    otorii: {todo:true, lm:'tymeijiotorii', cand:7, file:'torii.glb', title:'Torii Gate', author:'panrichi',
      license:'CC BY 4.0', url:'https://sketchfab.com/3d-models/bcad7f0d07984d6b8d5d1f63c7949d84',
      T:{h:12, hSrc:'TODO (tyo/shibuya: "12 m high, 17.1 m wide"; confirm with a URL)', ry:0 /* TODO: span north-south */, at:[0, 0], ground:'min'}},
    // ---------------------------------------------------------------- traffic (near models)
    // Made-up late-90s Japanese sedan (no real badge): the 'sedan' type, 4.70 x 1.80 m (traffic.js VT), height from the model.
    sedan: {todo:true, veh:'sedan', cand:33, file:'sedan.glb', title:"Tozzo '98 - Low poly model", author:'DanielZhabotinsky',
      license:'CC BY 4.0', url:'https://sketchfab.com/3d-models/d43bb748da364af2b3f0a9348365f0fb',
      dims:[4.70, 1.80, null], paint:null /* TODO: the body colour of the model, e.g. [r, g, b, 0.12] */, kind:'car'},
  };
  const S = {state:'wait', loaded:{}, err:[], lm:{}, veh:{}, scenes:{}};
  window.TYM = S; S.MODELS = MODELS;
  const base = () => { try { return SGR_PATH + 'models/'; } catch (e){ return 'tyodata/models/'; } };
  // ---------------------------------------------------------------- loading
  // normalised (or integer) vertex attributes -> Float32, denormalised as the GPU would (see the header)
  function dequant(root){
    root.traverse(o => {
      if (!o.isMesh || !o.geometry) return; const g = o.geometry; let ch = false;
      for (const name of ['position', 'normal', 'uv', 'uv2', 'color']){
        const a = g.attributes[name]; if (!a) continue;
        const arr = a.isInterleavedBufferAttribute ? a.data.array : a.array; if (arr instanceof Float32Array) continue;
        const C = arr.constructor, M = !a.normalized ? 1 : C === Int8Array ? 127 : C === Uint8Array ? 255 : C === Int16Array ? 32767 : C === Uint16Array ? 65535 : C === Int32Array ? 2147483647 : C === Uint32Array ? 4294967295 : 1;
        const n = a.count, s = a.itemSize, out = new Float32Array(n*s);
        for (let i = 0; i < n; i++) for (let k = 0; k < s; k++){
          const raw = a.isInterleavedBufferAttribute ? arr[i*a.data.stride + a.offset + k] : arr[i*s + k];
          out[i*s + k] = M === 1 ? raw : Math.max(raw/M, -1); }
        g.setAttribute(name, new THREE.BufferAttribute(out, s)); ch = true;
      }
      if (ch){ g.computeBoundingBox(); g.computeBoundingSphere(); }
    });
    return root;
  }
  S.dequant = dequant;
  const cache = new Map();
  function load(key){
    if (cache.has(key)) return cache.get(key);
    const p = new Promise((res, rej) => {
      if (!THREE.GLTFLoader){ rej(new Error('no GLTFLoader')); return; }
      new THREE.GLTFLoader().load(base() + MODELS[key].file, g => { S.loaded[key] = true; S.scenes[key] = dequant(g.scene); res(g.scene); }, undefined, e => rej(e));
    });
    cache.set(key, p); return p;
  }
  S.load = load;
  // ---------------------------------------------------------------- landmarks
  // local (x, z) of landmark L -> ground height (the group is at (L.x, top, -L.y), turned by L.rot)
  const groundAt = (L, x, z) => { const c = Math.cos(L.rot || 0), s = Math.sin(L.rot || 0), wx = x*c + z*s, wz = -x*s + z*c; return hC(L.x + wx, L.y - wz); };
  function lmBuild(key, src){
    const M = MODELS[key], T = M.T || {};
    return function(){
      const g = new THREE.Group(), u = LMCTX.u, top = u.base.value, L = landmarks.find(q => q.type === M.lm);
      // up-axis fix, then the model's bounding box in that frame
      const upG = new THREE.Group(), m = src.clone(true); upG.add(m);
      if (T.up === 'z') upG.rotation.x = -Math.PI/2;
      upG.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(upG);
      const piv = Array.isArray(T.pivot) ? T.pivot : [(bb.min.x + bb.max.x)/2, bb.min.y, (bb.min.z + bb.max.z)/2];
      const sc = T.s || (T.h ? T.h/Math.max(1e-6, bb.max.y - piv[1]) : 1);
      upG.position.set(-piv[0], -piv[1], -piv[2]);
      const w = new THREE.Group(); w.add(upG);
      w.scale.set(T.mirror ? -sc : sc, sc, sc); w.rotation.y = T.ry || 0;
      const at = T.at || [0, 0]; w.position.set(at[0], 0, at[1]);
      // ground: the plan corners, edge midpoints and centre of the placed model
      let dy = 0;
      if (typeof T.ground === 'number') dy = T.ground - top;
      else if (T.ground !== 'base' && L){
        w.updateMatrixWorld(true); const v = new THREE.Vector3(); let gmin = Infinity;
        const xs = [bb.min.x, (bb.min.x + bb.max.x)/2, bb.max.x], zs = [bb.min.z, (bb.min.z + bb.max.z)/2, bb.max.z];
        for (const x of xs) for (const z of zs){ v.set(x, bb.min.y, z).applyMatrix4(upG.matrixWorld); gmin = Math.min(gmin, groundAt(L, v.x, v.z)); }
        if (isFinite(gmin)) dy = gmin - top;
      }
      w.position.y = dy - (T.sink !== undefined ? T.sink : 0.3);
      // materials: Lambert + the landmark shader (night lighting, window grid), textures in linear space like the rest of the scene
      const uM = T.mode !== undefined ? Object.assign({}, u, {mode:{value:T.mode}}) : u, uLit = Object.assign({}, u, {mode:{value:0}});
      const done = new Map(); let n = 0;
      m.traverse(o => {
        if (!o.isMesh) return;
        const om = o.material; if (done.has(om)){ o.material = done.get(om); o.castShadow = o.receiveShadow = true; return; }
        const map = om.map || null, col = om.color ? om.color.clone() : new THREE.Color(1, 1, 1);
        if (map){ map.encoding = THREE.LinearEncoding; map.anisotropy = 4; map.needsUpdate = true; }
        const lum = 0.3*col.r + 0.59*col.g + 0.11*col.b, lit = T.lit && !map && lum > T.lit.lum;
        const mat = new THREE.MeshLambertMaterial({color:col, map, vertexColors:!!(o.geometry && o.geometry.attributes.color),
          side:T.mirror ? THREE.DoubleSide : (om.side !== undefined ? om.side : THREE.FrontSide), transparent:!!om.transparent,
          opacity:om.opacity !== undefined ? om.opacity : 1, alphaTest:om.alphaTest || 0});
        if (lit) lmShader(mat, uLit, T.lit.c, T.lit.k); else lmShader(mat, uM, null, 0);
        LMCTX.mats.set('glb' + (n++), mat); done.set(om, mat);
        o.material = mat; o.castShadow = true; o.receiveShadow = true;
      });
      g.add(w); g.userData.keep = [w];
      return g;
    };
  }
  S.lmBuild = lmBuild;
  function swapLandmark(type, build){
    const def = LANDMARKS[type]; if (!def) return false;
    def.build = build;
    for (const L of landmarks) if (L.type === type){
      const g0 = lmMeshes.get(L.id); if (g0){ lmGroup.remove(g0); g0.traverse(o => { if (o.geometry && !o.userData.glb) o.geometry.dispose(); }); lmMeshes.delete(L.id); }
      if (L.mats){ for (const m of L.mats.values()) m.dispose(); L.mats = null; } L.fx = [];
      placeLandmarkMesh(L);
      // the ground plan (hull) is cached per landmark id: drop it so it is taken again from the model, and redo the old one's tiles
      try { if (SGR.on && SGR.hulls){ const H = SGR.hulls.get(L.id); SGR.hulls.delete(L.id); if (H) sgrQueueTiles(sgrTilesOfBB(H.bb, 10)); } } catch (e){ }
    }
    try { if (SGR.on) sgrLandmarksChanged(); } catch (e){ }
    return true;
  }
  // apply a loaded (or test) scene to a landmark entry; also used to re-tune T from the console: TYM.apply('tokyotower', TYM.scenes.tokyotower)
  S.apply = (key, scene) => {
    const M = MODELS[key]; if (!M || !M.lm || !LANDMARKS[M.lm] || !scene) return false;
    scene.traverse(o => { if (o.isMesh) o.userData.glb = true; });
    const ok = swapLandmark(M.lm, lmBuild(key, scene)); if (ok) S.lm[key] = 1; return ok;
  };
  // ---------------------------------------------------------------- vehicles: glTF -> traffic geometry (after hk/zz_models vehGeo)
  function texSampler(map){
    const im = map && map.image; if (!im || !im.width) return null;
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0); const d = cx.getImageData(0, 0, im.width, im.height).data, W = im.width, H = im.height;
    // glTF UVs have v down from the top of the image (the loader sets flipY false), so v maps straight to the canvas row
    return (u, v) => { u = u - Math.floor(u); v = v - Math.floor(v); const x = Math.min(W - 1, Math.floor(u*W)), y = Math.min(H - 1, Math.floor(v*H)), i = (y*W + x)*4; return [d[i]/255, d[i + 1]/255, d[i + 2]/255]; };
  }
  // dims: target length (x), width (z), height (y), null = scale by length; the model's length axis is z, its front +z
  // opt.paint = [r, g, b, tol]: triangles near that colour get aPaint 1 (tinted by the vehicle's colour) and a light base colour
  function vehGeo(src, dims, kind, opt){
    opt = opt || {}; src.updateMatrixWorld(true);
    const P = [], N = [], C = [];
    const v = new THREE.Vector3(), nv = new THREE.Vector3(), nm = new THREE.Matrix3();
    src.traverse(o => {
      if (!o.isMesh) return;
      const g0 = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, pos = g0.attributes.position, nor = g0.attributes.normal, uv = g0.attributes.uv, vc = g0.attributes.color;
      const smp = texSampler(o.material.map), base = o.material.color || new THREE.Color(1, 1, 1);
      nm.getNormalMatrix(o.matrixWorld);
      for (let i = 0; i < pos.count; i++){
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); P.push(v.x, v.y, v.z);
        if (nor){ nv.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize(); N.push(nv.x, nv.y, nv.z); } else N.push(0, 1, 0);
        let c = [base.r, base.g, base.b]; if (smp && uv){ const t = smp(uv.getX(i), uv.getY(i)); c = [c[0]*t[0], c[1]*t[1], c[2]*t[2]]; }
        if (vc){ c = [c[0]*vc.getX(i), c[1]*vc.getY(i), c[2]*vc.getZ(i)]; }
        C.push(c[0], c[1], c[2]);
      }
      if (g0 !== o.geometry) g0.dispose();
    });
    let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++){ mn[k] = Math.min(mn[k], P[i + k]); mx[k] = Math.max(mx[k], P[i + k]); }
    const sz = mx[2] - mn[2], sx = mx[0] - mn[0], sy = mx[1] - mn[1], cx = (mn[0] + mx[0])/2, cz = (mn[2] + mx[2])/2;
    const kL = dims[0]/sz, kW = dims[1] ? dims[1]/sx : kL, kH = dims[2] ? dims[2]/sy : kL;
    const H = sy*kH, half = dims[0]/2;
    const P2 = new Float32Array(P.length), N2 = new Float32Array(N.length), PA = new Float32Array(P.length/3), LG = new Float32Array(P.length/3);
    for (let i = 0; i < P.length; i += 3){
      P2[i] = (P[i + 2] - cz)*kL; P2[i + 1] = (P[i + 1] - mn[1])*kH; P2[i + 2] = -(P[i] - cx)*kW;
      let nx = N[i + 2]/kL, ny = N[i + 1]/kH, nz = -N[i]/kW; const l = Math.hypot(nx, ny, nz) || 1; N2[i] = nx/l; N2[i + 1] = ny/l; N2[i + 2] = nz/l;
    }
    for (let t = 0; t < P2.length/9; t++){
      let ax = 0, ay = 0, cr = 0, cg = 0, cb = 0, fx = 0, fy = 0, fz = 0;
      for (let j = 0; j < 3; j++){ const i = t*9 + j*3; ax += P2[i]/3; ay += P2[i + 1]/3; cr += C[i]/3; cg += C[i + 1]/3; cb += C[i + 2]/3; fx += N2[i]/3; fy += N2[i + 1]/3; fz += N2[i + 2]/3; }
      const lum = 0.3*cr + 0.59*cg + 0.11*cb, hN = ay/H;
      // body paint
      if (opt.paint){ const [pr, pg, pb, tol] = opt.paint; if (Math.abs(cr - pr) < tol && Math.abs(cg - pg) < tol && Math.abs(cb - pb) < tol){
        for (let j = 0; j < 3; j++){ const i = t*9 + j*3; PA[t*3 + j] = 1; C[i] = C[i + 1] = C[i + 2] = 0.95; } continue; } }
      // lamps (estimate): per triangle, by facing, height and colour
      let L = 0;
      if (fx > 0.55 && ax > half*0.8 && hN < (kind === 'bus' ? 0.2 : 0.55) && lum > 0.6) L = 1;                       // headlamps: light, low, front
      else if (fx < -0.55 && ax < -half*0.8 && hN < (kind === 'bus' ? 0.25 : 0.6) && cr > 0.45 && cr > cg*1.6) L = 2;  // tail lamps: red, low, rear
      else if (kind === 'bus' && Math.abs(fz) > 0.7 && hN > 0.22 && hN < 0.92 && lum < 0.42 && Math.abs(cr - cb) < 0.25) L = 3;   // lit windows
      else if (kind === 'taxi' && fy > 0.3 && hN > 0.88 && lum > 0.7) L = 5;                                            // roof sign
      if (L) for (let j = 0; j < 3; j++) LG[t*3 + j] = L;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P2, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N2, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aPaint', new THREE.BufferAttribute(PA, 1)); g.setAttribute('aLight', new THREE.BufferAttribute(LG, 1));
    g.computeBoundingSphere();
    return g;
  }
  S.vehGeo = vehGeo;
  S.applyVeh = (key, scene) => {
    const M = MODELS[key], T = window.SGTraffic; if (!M || !M.veh || !scene || !T || !T.swapModel) return false;
    const ok = T.swapModel(M.veh, vehGeo(scene, M.dims, M.kind, {paint:M.paint})); S.veh[M.veh] = ok; return ok;
  };
  // placement check for tuning T (the app's names are not global, so tests and the console read them through here):
  // world bounds of the model, the real ground at the landmark, its ground-plan hull
  S.probe = key => {
    const M = MODELS[key]; if (!M || !M.lm) return null;
    const L = landmarks.find(q => q.type === M.lm), g = L && lmMeshes.get(L.id); if (!g) return null;
    g.updateMatrixWorld(true); const k = g.userData.keep && g.userData.keep[0], bb = new THREE.Box3().setFromObject(k || g), H = SGR.hulls && SGR.hulls.get(L.id), r1 = v => Math.round(v*10)/10;
    return {model:!!k, x:r1(L.x), y:r1(L.y), rot:L.rot, base:r1(L.top), ground:r1(hC(L.x, L.y)), bottom:r1(bb.min.y), top:r1(bb.max.y),
      size:[r1(bb.max.x - bb.min.x), r1(bb.max.y - bb.min.y), r1(bb.max.z - bb.min.z)], hull:H ? H.bb.map(r1) : null};
  };
  S.credits = () => Object.keys(S.loaded).map(k => { const M = MODELS[k]; return `${M.title} by ${M.author} (${M.license}) ${M.url}`; });
  // ---------------------------------------------------------------- start
  const ready = () => { try { return SGR.on && landmarks.length > 20 && lmMeshes.size > 20 && !!THREE.GLTFLoader; } catch (e){ return false; } };
  let tries = 0;
  function tick(){
    const keys = Object.keys(MODELS).filter(k => !MODELS[k].todo && MODELS[k].file);
    if (!keys.length){ S.state = 'idle'; return; }          // nothing downloaded yet: no requests at all
    if (!ready()){ if (++tries > 400){ S.state = 'timeout'; return; } setTimeout(tick, 700); return; }
    S.state = 'loading';
    const jobs = keys.map(k => {
      const M = MODELS[k];
      if (M.lm && !LANDMARKS[M.lm]) return Promise.resolve();
      return load(k).then(sc => { if (M.lm) S.apply(k, sc); else if (M.veh) S.applyVeh(k, sc); }).catch(e => S.err.push(k + ': ' + (e && e.message || e)));
    });
    Promise.all(jobs).then(() => { S.state = 'done'; });
  }
  setTimeout(tick, 2500);
})();
