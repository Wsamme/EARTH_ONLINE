// ===== v47 · nyc/zz_models — downloaded glTF models (Sketchfab, CC BY 4.0) for the New York page =====
// Same scheme as hk/zz_models: free models, optimised with glTF-Transform (WebP textures at most 1024 px, quantised meshes) into
// nycdata/models/ (SGR_PATH + 'models/'). Loaded after the city is ready; until a model arrives (or when its file is missing) the
// page keeps its own hand-made / procedural version. Authors are credited in MODELS below (and must also go to README /
// DATA_LICENSE and the map credits when a model goes live).
// PHASE 1 (27 Nov 2026): the files are not downloaded yet. Every entry is marked todo:true and is never requested, so this module
// does nothing on the live page. To switch one on: put the file in nycdata/models/, set its MODELS entry's file name, drop
// todo, then fill the transform in LM / VEH from the downloaded file (see the plan, models_search/nyc_plan.md).
//
// Landmark swap (LM): the model replaces LANDMARKS[type].build. The new build puts the model in the landmark's own local frame
// (the frame the hand-made build used: origin, +x / +z axes as described in that build's header comment; the engine then turns
// it by L.rot and places it at L.x, L.y). Per entry:
//   model  MODELS key
//   H      real height (m) from the model's base to its top, with src (a source URL); the scale is H / model height unless S
//   S      explicit scale (overrides H)
//   y0, y1 the model's own base / top y (model units; default: its bounding box)
//   c      [cx, cz] the model point that goes on the frame origin (model units; default: the bounding-box centre)
//   rot    turn about y (radians, applied after scaling) so the model's faces line up with the hand-made frame
//   off    [x, z] where that point goes in the frame (m; default [0, 0])
//   ground 'min' (default): sink to the lowest ground under the model's corners, like hk/zz_models (the engine's frame sits
//          at the highest ground within r); a number: the model base at that height in the frame (y = 0 is the engine's
//          top); 'abs:<m>': the base at <m> metres above the datum (frames that work in absolute heights, e.g. the bridges)
//   cut    {y, r}: keep the hand-made build and cut from it every triangle above y within r m of the frame origin (e.g. the
//          Statue of Liberty: keep the island, the fort and Hunt's pedestal, replace only the copper statue); no cut = whole
//          build replaced
//   night  {frame:{lum, c, k}}: untextured materials lighter than lum glow c at night (k strength); {glow:[{re, c, k}]}:
//          materials / meshes whose name matches re glow (e.g. a torch flame). Everything else keeps the landmark shader
//          (window-light grid of the landmark's lt mode)
//   hull   'keep' (default): the OSM buildings the old model hid stay hidden; 'new': recompute the hull from the model
// Traffic swap (VEH): the model replaces the near model of one traffic type (SGTraffic.swapModel). Per entry:
//   model, fwd (the model's front: '+z' | '-z' | '+x' | '-x'), L (target length, m: the traffic type's real length in
//   lm20/traffic/traffic.js VT), fit ('L': one scale from the length, the model keeps its proportions; 'xyz': stretch to
//   [L, W, H]), paint ('dominant': faces in the model's main body colour take the per-car palette colour; null: colours
//   baked as modelled), kind ('car' | 'taxi' | 'bus': where to look for lamps)
// Needs THREE.GLTFLoader (r128 examples/js/loaders/GLTFLoader.js, in the shared page template). Test handle: window.NYM.
(() => {
  // ---------------------------------------------------------------- manifest (candidates: models_search/nyc.json)
  const SF = 'https://sketchfab.com/3d-models/';
  const MODELS = {
    // landmarks
    empire:    {file:'empire.glb',    title:'Empire State Building',  author:'augustgamer1808', url:SF + '1861035217f44bd4aab593aa73d85106', lic:'CC BY 4.0', todo:true},
    chrysler:  {file:'chrysler.glb',  title:'Chrysler Building',      author:'NanoRay',         url:SF + '26be9287b12d4234af009e4162135897', lic:'CC BY 4.0', todo:true},
    liberty:   {file:'liberty.glb',   title:'Statue Of Liberty',      author:'gravityjack',     url:SF + '84094e8d5e724b5c882cf576ca12e44e', lic:'CC BY 4.0', todo:true},
    onewtc:    {file:'onewtc.glb',    title:'One World Trade Center', author:'NanoRay',         url:SF + '44e60b2d0d764fdab74d33703847d38e', lic:'CC BY 4.0', todo:true},
    wtc3:      {file:'wtc3.glb',      title:'3 World Trade Center',   author:'NanoRay',         url:SF + '47d1943cfa97409e983a7acab4f109f1', lic:'CC BY 4.0', todo:true},
    woolworth: {file:'woolworth.glb', title:'Woolworth Building',     author:'augustgamer1808', url:SF + 'ca4d7aa385eb4c45b516fb4df9c9255e', lic:'CC BY 4.0', todo:true},
    park432:   {file:'park432.glb',   title:'432 Park Avenue',        author:'NanoRay',         url:SF + 'd1071ed9bd9549a5a03c83b72fbaffd1', lic:'CC BY 4.0', todo:true},
    wall40:    {file:'wall40.glb',    title:'40 Wall Street',         author:'NanoRay',         url:SF + 'f393883a2c1e4eb196dd1853e06cd6cb', lic:'CC BY 4.0', todo:true},
    citigroup: {file:'citigroup.glb', title:'Citigroup Center',       author:'NanoRay',         url:SF + 'ff93086fa20345d4b4562ce95095e292', lic:'CC BY 4.0', todo:true},
    spiral:    {file:'spiral.glb',    title:'Hudson Spiral',          author:'NanoRay',         url:SF + 'e6064ac813614942b3417c91c25040d2', lic:'CC BY 4.0', todo:true},
    guggen:    {file:'guggenheim.glb', title:'Guggenheim NYC',        author:'vSpline',         url:SF + '11551548e9784079bd6e2f4d6eecbe96', lic:'CC BY 4.0', todo:true},
    abyssin:   {file:'abyssinian.glb', title:'Abyssinian Church',     author:'UofA-CDH',        url:SF + '9c714741b77f41f7ba8ba607c684bdb0', lic:'CC BY 4.0', todo:true},
    // traffic
    taxi:      {file:'taxi.glb',      title:"Canyon '75 Taxi - Low poly model", author:'DanielZhabotinsky', url:SF + '9e8f92a215784f3d8aaaaeab1bef54c4', lic:'CC BY 4.0', todo:true},
    sedan:     {file:'sedan.glb',     title:"Kiri '86 - Low poly model",        author:'DanielZhabotinsky', url:SF + '5c17c582ef9549798f694b660feea42a', lic:'CC BY 4.0', todo:true},
    van:       {file:'van.glb',       title:"Shvan '92 - Low poly model",       author:'DanielZhabotinsky', url:SF + '09d718c9cf72401b8534d265a06a803f', lic:'CC BY 4.0', todo:true},
    bus:       {file:'bus.glb',       title:'Generic Town Bus',                 author:'own.guest',         url:SF + '14fe03d792914d51b6c6250b393c44fd', lic:'CC BY 4.0', todo:true},
  };
  // ---------------------------------------------------------------- landmark swaps (TODO: rot / c / y0 / y1 from each file)
  // Heights: the figure the hand-made build also uses (its header comment), with the source below.
  const WP = 'https://en.wikipedia.org/wiki/';
  const LM = {
    // frame: origin = tower axis, +x = Fifth Avenue (east)
    nyempire:    {model:'empire',    H:443.2, src:WP + 'Empire_State_Building', rot:0},          // tip (roof 381.0 m)
    // frame: origin = tower axis, +z = 42nd Street (south), the lot's Lexington Avenue side at +x
    nychrysler:  {model:'chrysler',  H:319,   src:WP + 'Chrysler_Building', rot:0},              // spire tip (roof 282 m)
    // statue only (the model has no pedestal): keep the island, Fort Wood and the pedestal; the statue frame is turned RY =
    // 0.569 rad in the build, front +z there, base at y 49.4 (the build's SY); 46 m base to torch
    nyliberty:   {model:'liberty',   H:46.0,  src:WP + 'Statue_of_Liberty', rot:0.569, ground:49.4, cut:{y:49.45, r:14},
                  night:{glow:[{re:/flame|torch|fire/i, c:'#ffc23c', k:2.4}]}},
    // frame: the footprint square, all faces alike; +z = the south-south-west face
    nyonewtc:    {model:'onewtc',    H:541.3, src:WP + 'One_World_Trade_Center', rot:0},         // architectural (spire) height
    // frame: +x = Church Street (east), -x = Greenwich Street / the memorial
    nywtc:       {model:'wtc3',      H:329,   src:WP + '3_World_Trade_Center', rot:0},
    // frame: +x = Broadway (east front), -x = the light court, -z = Barclay St
    nywoolworth: {model:'woolworth', H:241,   src:WP + 'Woolworth_Building', rot:0},
    // frame: origin = tower centre (the podium is part of the hand-made build only)
    nypark432:   {model:'park432',   H:425.5, src:WP + '432_Park_Avenue', rot:0},
    // frame: -z = Wall Street (north front), +z = Pine Street
    nywallst:    {model:'wall40',    H:283,   src:WP + '40_Wall_Street', rot:0},
    // frame: origin = tower axis, -x = Lexington Avenue (west), -z = 54th Street
    nycitigroup: {model:'citigroup', H:279,   src:WP + 'Citigroup_Center', rot:0},
    // frame: the nyspiral anchor, grid turned 0.8 deg to the block
    nyspiral:    {model:'spiral',    H:314,   src:WP + 'The_Spiral_(New_York_City)', rot:0},
    // no published overall height: scale S from the OSM footprint once the file is in (TODO), +x = east
    nyguggenheim:{model:'guggen',    S:null,  src:'OSM footprint (TODO)', rot:0},
    // no published height: scale S from the OSM footprint (ABY_R in nyharlem) once the file is in (TODO); -z = 138th Street
    nyabyssinian:{model:'abyssin',   S:null,  src:'OSM footprint (TODO)', rot:0},
  };
  // ---------------------------------------------------------------- traffic swaps (lengths: VT in lm20/traffic/traffic.js)
  const VEH = {
    taxi:  {model:'taxi',  fwd:'+z', L:4.60, W:1.78, H:1.48, fit:'L', paint:null,       kind:'taxi'},   // yellow as modelled
    sedan: {model:'sedan', fwd:'+z', L:4.70, W:1.80, H:1.45, fit:'L', paint:'dominant', kind:'car'},
    van:   {model:'van',   fwd:'+z', L:5.20, W:1.95, H:2.10, fit:'L', paint:'dominant', kind:'car'},
    usbus: {model:'bus',   fwd:'+z', L:12.2, W:2.60, H:3.30, fit:'L', paint:null,       kind:'bus'},
  };

  const S = {state:'wait', loaded:{}, err:[], lm:{}, veh:{}};
  window.NYM = S; S.MODELS = MODELS; S.LM = LM; S.VEH = VEH;
  const live = k => MODELS[k] && MODELS[k].file && !MODELS[k].todo;
  const base = () => { try { return SGR_PATH + 'models/'; } catch (e){ return 'nycdata/models/'; } };
  const cache = new Map();
  function load(key){
    if (cache.has(key)) return cache.get(key);
    const p = new Promise((res, rej) => {
      if (!live(key)){ rej(new Error('not available')); return; }
      if (!THREE.GLTFLoader){ rej(new Error('no GLTFLoader')); return; }
      new THREE.GLTFLoader().load(base() + MODELS[key].file, g => { S.loaded[key] = true; res(g.scene); }, undefined, e => rej(e));
    });
    cache.set(key, p); return p;
  }
  S.load = load;

  // ---------------------------------------------------------------- landmarks
  // drop the triangles of the hand-made build above y within r of the frame origin (the frame of group g)
  function cutAbove(g, y, r){
    g.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), M = new THREE.Matrix4(), v = new THREE.Vector3();
    const drop = [];
    g.traverse(o => {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
      M.multiplyMatrices(inv, o.matrixWorld);
      const g0 = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, pos = g0.attributes.position, n = pos.count/3 | 0;
      const keepT = new Uint8Array(n); let kept = 0;
      for (let t = 0; t < n; t++){
        // by the triangle's centroid: faces lying on y (e.g. the pedestal top) stay, the statue's lowest band goes
        let sx = 0, sy = 0, sz = 0;
        for (let j = 0; j < 3; j++){ v.fromBufferAttribute(pos, t*3 + j).applyMatrix4(M); sx += v.x/3; sy += v.y/3; sz += v.z/3; }
        if (sy <= y || sx*sx + sz*sz > r*r){ keepT[t] = 1; kept++; }
      }
      if (kept === n){ if (g0 !== o.geometry) g0.dispose(); return; }
      if (!kept){ drop.push(o); if (g0 !== o.geometry) g0.dispose(); return; }
      const g1 = new THREE.BufferGeometry();
      for (const name of Object.keys(g0.attributes)){
        const a = g0.attributes[name], sz = a.itemSize, arr = new a.array.constructor(kept*3*sz); let w = 0;
        for (let t = 0; t < n; t++) if (keepT[t]) for (let j = 0; j < 3*sz; j++) arr[w++] = a.array[t*3*sz + j];
        g1.setAttribute(name, new THREE.BufferAttribute(arr, sz, a.normalized));
      }
      if (g0 !== o.geometry) g0.dispose();
      o.geometry.dispose(); o.geometry = g1;
    });
    for (const o of drop){ o.parent.remove(o); o.geometry.dispose(); }
  }
  // materials -> MeshLambertMaterial + the landmark shader (night lighting); texture maps kept (linear, as in hk/zz_models)
  function lmMaterials(m, spec, u){
    const nt = spec.night || {}, uFrame = Object.assign({}, u, {mode:{value:0}});
    let n = 0;
    m.traverse(o => {
      if (!o.isMesh) return;
      const om = o.material, map = om.map || null, col = om.color ? om.color.clone() : new THREE.Color(1, 1, 1);
      if (map){ map.encoding = THREE.LinearEncoding; map.anisotropy = 4; map.needsUpdate = true; }
      const mat = new THREE.MeshLambertMaterial({color:col, map, vertexColors:!!om.vertexColors, side:om.side === THREE.DoubleSide ? THREE.DoubleSide : THREE.FrontSide,
        transparent:!!om.transparent, opacity:om.opacity !== undefined ? om.opacity : 1, alphaTest:om.alphaTest || 0});
      const name = (om.name || '') + ' ' + (o.name || ''), lum = 0.3*col.r + 0.59*col.g + 0.11*col.b;
      const gl = (nt.glow || []).find(q => q.re.test(name));
      if (gl) lmShader(mat, uFrame, gl.c, gl.k);
      else if (nt.frame && !map && lum > nt.frame.lum) lmShader(mat, uFrame, nt.frame.c, nt.frame.k);
      else lmShader(mat, u, null, 0);
      LMCTX.mats.set('glb' + (n++), mat);
      o.material = mat; o.castShadow = true; o.receiveShadow = true;
    });
  }
  function modelBuild(type, spec, src, oldBuild){
    src.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(src);
    const y0 = spec.y0 !== undefined ? spec.y0 : bb.min.y, y1 = spec.y1 !== undefined ? spec.y1 : bb.max.y;
    const c = spec.c || [(bb.min.x + bb.max.x)/2, (bb.min.z + bb.max.z)/2];
    const sc = spec.S || spec.H/(y1 - y0), off = spec.off || [0, 0], rot = spec.rot || 0;
    S.lm[type] = {bb:[bb.min.toArray(), bb.max.toArray()], scale:sc};
    const build = function(){
      const g = spec.cut ? oldBuild.call(this) : new THREE.Group(), u = LMCTX.u, top = u.base.value;
      if (spec.cut) cutAbove(g, spec.cut.y, spec.cut.r);
      // ground: the model base in the frame (y = 0 is the engine's top: the highest ground within r, + 0.6 m)
      let dy = -0.3;
      if (typeof spec.ground === 'number') dy = spec.ground;
      else if (typeof spec.ground === 'string' && spec.ground.startsWith('abs:')) dy = +spec.ground.slice(4) - top;
      else {
        const L = landmarks.find(q => q.type === type); let gmin = Infinity;
        if (L){ const cr = Math.cos(rot), sr = Math.sin(rot), cl = Math.cos(L.rot), sl = Math.sin(L.rot);
          for (const [mx, mz] of [[c[0], c[1]], [bb.min.x, bb.min.z], [bb.min.x, bb.max.z], [bb.max.x, bb.min.z], [bb.max.x, bb.max.z]]){
            const px = (mx - c[0])*sc, pz = (mz - c[1])*sc, lx = off[0] + px*cr + pz*sr, lz = off[1] - px*sr + pz*cr;   // model -> frame
            const x = lx*cl + lz*sl, z = -lx*sl + lz*cl; gmin = Math.min(gmin, hC(L.x + x, L.y - z)); } }   // frame -> map
        if (isFinite(gmin)) dy = gmin - top - 0.3;
      }
      const w = new THREE.Group(), m = src.clone(true);
      m.position.set(-c[0], -y0, -c[1]); w.add(m); w.scale.setScalar(sc); w.rotation.y = rot; w.position.set(off[0], dy, off[1]);
      lmMaterials(m, spec, u);
      g.add(w); g.userData.keep = (g.userData.keep || []).concat([w]);
      return g;
    };
    // a model that fails to build falls back to the hand-made one
    return function(){ try { return build.call(this); } catch (e){ S.err.push(type + ' build: ' + e); return oldBuild.call(this); } };
  }
  function rebuild(type){
    for (const L of landmarks) if (L.type === type){
      const g0 = lmMeshes.get(L.id); if (g0){ lmGroup.remove(g0); g0.traverse(o => { if (o.geometry && !o.userData.glb) o.geometry.dispose(); }); lmMeshes.delete(L.id); }
      if (L.mats){ for (const m of L.mats.values()) m.dispose(); L.mats = null; } L.fx = [];
      placeLandmarkMesh(L);
    }
  }
  const OLD = {};
  function swapLandmark(type, build, newHull){
    const def = LANDMARKS[type]; if (!def) return false;
    if (!OLD[type]) OLD[type] = def.build;
    def.build = build; rebuild(type);
    if (newHull){ try { for (const L of landmarks) if (L.type === type) SGR.hulls.delete(L.id); } catch (e){ } }
    try { if (SGR.on) sgrLandmarksChanged(); } catch (e){ }
    return true;
  }
  // test handle: put the hand-made model back (NYM.restore('nyempire'))
  S.restore = type => { const def = LANDMARKS[type]; if (!def || !OLD[type]) return false; def.build = OLD[type]; delete OLD[type]; rebuild(type);
    try { if (SGR.on) sgrLandmarksChanged(); } catch (e){ } S.lm[type] = 'restored'; return true; };

  // ---------------------------------------------------------------- vehicles: glTF -> traffic geometry
  function texSampler(map){
    const im = map && map.image; if (!im || !im.width) return null;
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0); const d = cx.getImageData(0, 0, im.width, im.height).data, W = im.width, H = im.height;
    return (u, v) => { u = u - Math.floor(u); v = v - Math.floor(v); const x = Math.min(W - 1, Math.floor(u*W)), y = Math.min(H - 1, Math.floor(v*H)), i = (y*W + x)*4; return [d[i]/255, d[i + 1]/255, d[i + 2]/255]; };
  }
  // model axes -> traffic axes (x forward, y up, z to the right-hand side as in hk/zz_models: model +z front -> x, model x -> -z)
  const AX = {'+z':(x, z) => [z, -x], '-z':(x, z) => [-z, x], '+x':(x, z) => [x, z], '-x':(x, z) => [-x, -z]};
  function vehGeo(src, V){
    src.updateMatrixWorld(true);
    const P = [], N = [], C = [];
    const v = new THREE.Vector3(), nv = new THREE.Vector3(), nm = new THREE.Matrix3(), ax = AX[V.fwd] || AX['+z'];
    src.traverse(o => {
      if (!o.isMesh) return;
      const g0 = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, pos = g0.attributes.position, nor = g0.attributes.normal, uv = g0.attributes.uv, vc = g0.attributes.color;
      const smp = texSampler(o.material.map), bc = o.material.color || new THREE.Color(1, 1, 1);
      nm.getNormalMatrix(o.matrixWorld);
      for (let i = 0; i < pos.count; i++){
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); const a = ax(v.x, v.z); P.push(a[0], v.y, a[1]);
        if (nor){ nv.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize(); const b = ax(nv.x, nv.z); N.push(b[0], nv.y, b[1]); } else N.push(0, 1, 0);
        let c = [bc.r, bc.g, bc.b];
        if (vc){ c = [c[0]*vc.getX(i), c[1]*vc.getY(i), c[2]*vc.getZ(i)]; }
        if (smp && uv){ const t = smp(uv.getX(i), uv.getY(i)); c = [c[0]*t[0], c[1]*t[1], c[2]*t[2]]; }
        C.push(c[0], c[1], c[2]);
      }
      if (g0 !== o.geometry) g0.dispose();
    });
    // bounds -> origin on the ground at the centre, scaled to the traffic size
    const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++){ mn[k] = Math.min(mn[k], P[i + k]); mx[k] = Math.max(mx[k], P[i + k]); }
    const kL = V.L/(mx[0] - mn[0]), kH = V.fit === 'xyz' ? V.H/(mx[1] - mn[1]) : kL, kW = V.fit === 'xyz' ? V.W/(mx[2] - mn[2]) : kL;
    const cx = (mn[0] + mx[0])/2, cz = (mn[2] + mx[2])/2, n = P.length/3;
    const P2 = new Float32Array(P.length), N2 = new Float32Array(N.length), PA = new Float32Array(n), LG = new Float32Array(n);
    for (let i = 0; i < P.length; i += 3){
      P2[i] = (P[i] - cx)*kL; P2[i + 1] = (P[i + 1] - mn[1])*kH; P2[i + 2] = (P[i + 2] - cz)*kW;
      let nx = N[i]/kL, ny = N[i + 1]/kH, nz = N[i + 2]/kW; const l = Math.hypot(nx, ny, nz) || 1; N2[i] = nx/l; N2[i + 1] = ny/l; N2[i + 2] = nz/l;
    }
    const dims = [(mx[0] - mn[0])*kL, (mx[1] - mn[1])*kH, (mx[2] - mn[2])*kW];
    // body paint: the colour covering the most surface (quantised) takes the per-car palette colour (iCol)
    if (V.paint === 'dominant'){
      const area = new Map(), key = i => Math.round(C[i]*12) + ',' + Math.round(C[i + 1]*12) + ',' + Math.round(C[i + 2]*12), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
      for (let t = 0; t < n/3; t++){ const i = t*9; e1.set(P2[i + 3] - P2[i], P2[i + 4] - P2[i + 1], P2[i + 5] - P2[i + 2]); e2.set(P2[i + 6] - P2[i], P2[i + 7] - P2[i + 1], P2[i + 8] - P2[i + 2]);
        const k = key(i); area.set(k, (area.get(k) || 0) + e1.cross(e2).length()); }
      let best = null, ba = 0; for (const [k, a] of area) if (a > ba){ ba = a; best = k; }
      for (let t = 0; t < n/3; t++){ const i = t*9; if (key(i) !== best) continue; for (let j = 0; j < 3; j++){ PA[t*3 + j] = 1; C[i + j*3] = C[i + j*3 + 1] = C[i + j*3 + 2] = 1; } }
    }
    // lamps (estimate, as in hk/zz_models): per triangle, by facing, height and colour
    const half = dims[0]/2, hgt = dims[1];
    for (let t = 0; t < n/3; t++){
      let ax_ = 0, ay = 0, cr = 0, cg = 0, cb = 0, fx = 0, fy = 0, fz = 0;
      for (let j = 0; j < 3; j++){ const i = t*9 + j*3; ax_ += P2[i]/3; ay += P2[i + 1]/3; cr += C[i]/3; cg += C[i + 1]/3; cb += C[i + 2]/3; fx += N2[i]/3; fy += N2[i + 1]/3; fz += N2[i + 2]/3; }
      if (PA[t*3]) continue;
      const lum = 0.3*cr + 0.59*cg + 0.11*cb, hN = ay/hgt, bus = V.kind === 'bus';
      let Lg = 0;
      if (fx > 0.55 && ax_ > half*0.8 && hN < (bus ? 0.2 : 0.55) && lum > 0.6) Lg = 1;                         // headlamps
      else if (fx < -0.55 && ax_ < -half*0.8 && hN < (bus ? 0.25 : 0.6) && cr > 0.45 && cr > cg*1.6) Lg = 2;    // tail lamps
      else if (bus && Math.abs(fz) > 0.7 && hN > 0.22 && hN < 0.92 && lum < 0.42 && Math.abs(cr - cb) < 0.25) Lg = 3;   // lit windows
      else if (V.kind === 'taxi' && fy > 0.3 && hN > 0.88 && lum > 0.7) Lg = 5;                                  // roof light
      if (Lg) for (let j = 0; j < 3; j++) LG[t*3 + j] = Lg;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P2, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N2, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aPaint', new THREE.BufferAttribute(PA, 1)); g.setAttribute('aLight', new THREE.BufferAttribute(LG, 1));
    g.computeBoundingSphere(); g.userData.dims = dims;
    return g;
  }
  S.vehGeo = vehGeo;

  // ---------------------------------------------------------------- start
  const jobsLM = () => Object.keys(LM).filter(t => LANDMARKS[t] && live(LM[t].model) && (LM[t].S || LM[t].H));
  const jobsVEH = () => Object.keys(VEH).filter(k => live(VEH[k].model));
  const ready = () => { try { return SGR.on && landmarks.length > 20 && lmMeshes.size > 20 && !!THREE.GLTFLoader; } catch (e){ return false; } };
  let tries = 0;
  function tick(){
    if (!jobsLM().length && !jobsVEH().length){ S.state = 'idle'; return; }   // nothing downloaded yet: leave the page alone
    if (!ready()){ if (++tries > 400){ S.state = 'timeout'; return; } setTimeout(tick, 700); return; }
    S.state = 'loading';
    const jobs = [];
    for (const type of jobsLM()){ const spec = LM[type];
      jobs.push(load(spec.model).then(sc => { sc.traverse(o => { if (o.isMesh) o.userData.glb = true; });
        swapLandmark(type, modelBuild(type, spec, sc, LANDMARKS[type].build), spec.hull === 'new'); }).catch(e => S.err.push(type + ': ' + e))); }
    const T = window.SGTraffic;
    if (T && T.swapModel) for (const k of jobsVEH()){ const V = VEH[k];
      jobs.push(load(V.model).then(sc => { const g = vehGeo(sc, V); S.veh[k] = {ok:T.swapModel(k, g), dims:g.userData.dims}; }).catch(e => S.err.push(k + ': ' + e))); }
    Promise.all(jobs).then(() => { S.state = 'done'; });
  }
  // test handles: run the swaps again (after switching an entry on), and hand in a stand-in scene for a model key
  S.run = () => { tries = 0; tick(); };
  S.info = type => { try { const L = landmarks.find(q => q.type === type); if (!L) return 'no landmark'; const g = lmMeshes.get(L.id); if (!g) return 'no mesh';
    const bb = new THREE.Box3().setFromObject(g); return {kept:(g.userData.keep || []).length, top:+L.top.toFixed(2), y:[+bb.min.y.toFixed(1), +bb.max.y.toFixed(1)], swapped:!!OLD[type]}; }
    catch (e){ return 'error ' + e; } };
  S.counts = () => { try { return {landmarks:landmarks.length, meshes:lmMeshes.size}; } catch (e){ return 'error ' + e; } };
  S.inject = (key, scene) => { if (!MODELS[key]) return false; MODELS[key].todo = false; cache.set(key, Promise.resolve(scene)); return true; };
  setTimeout(tick, 2500);
})();
