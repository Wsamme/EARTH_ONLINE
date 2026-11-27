// ===== bay/zz_models — downloaded glTF models (Sketchfab, CC BY 4.0 / CC0) for the San Francisco Bay Area map =====
// Same scheme as hk/zz_models: free models, optimised with glTF-Transform (WebP textures at most 1024 px, quantised meshes),
// go into baydata/models/ (SGR_PATH + 'models/'). They are loaded after the city is ready; until a model arrives (or when
// its file is missing, or an entry is still marked todo) the page keeps its own hand-made / procedural version.
// Three kinds of swap, all driven by data below:
//  - LM: a landmark key's build() is replaced by the textured model (g.userData.keep, so lmMerge leaves its UVs and maps
//    alone). Each entry carries the transform from the model's own space into the key's frame (the frame its hand-made
//    build uses, see the notes per entry): scale to a real size from a cited source, a turn onto the OSM footprint, and a
//    ground rule ('base' = the app's base height, 'abs' = metres above the sea, 'terrain' = the lowest ground under the
//    footprint). Materials become MeshLambertMaterial + lmShader so the night lighting still works; maps LinearEncoding.
//  - VEH: the near model of a road traffic type is replaced through window.SGTraffic.swapModel(kind, vehGeo(...)).
//  - RAIL: the cable cars (and other rail cars) are boxes in the app's one train InstancedMesh (net.trainMesh). An overlay
//    InstancedMesh per entry takes the pose of those cars every frame (HOOKS.frame runs after stepMovers) and the boxes are
//    shrunk to nothing, so no engine change is needed.
// Every file is credited in MODELS (and must be credited in README / DATA_LICENSE and on the map when it ships).
// Needs THREE.GLTFLoader (r128 examples/js/loaders/GLTFLoader.js, in the shared page template). Test handle: window.BAYM.
(() => {
  // ---------------------------------------------------------------- manifest
  // todo:true = planned, file not downloaded yet: never fetched. Candidates: scratchpad models_search/bay.json; plan: bay_plan.md.
  const MODELS = {
    ggb:      {file:'ggb.glb', title:'Golden Gate Bridge', author:'TODO', url:'TODO', license:'CC BY 4.0', todo:true},
    transam:  {file:'transamerica.glb', title:'Transamerica Pyramid', author:'TODO', url:'TODO', license:'CC BY 4.0', todo:true},
    alcatraz: {file:'alcatraz.glb', title:'Alcatraz', author:'TODO', url:'TODO', license:'CC BY 4.0', todo:true},
    cablecar: {file:'cablecar.glb', title:'Cable car', author:'TODO', url:'TODO', license:'CC BY 4.0', todo:true},
    streetcar:{file:'streetcar.glb', title:'Vintage streetcar', author:'TODO', url:'TODO', license:'CC BY 4.0', todo:true},
    taxi:     {file:'taxi.glb', title:'Taxi', author:'TODO', url:'TODO', license:'CC BY 4.0', todo:true},
    usbus:    {file:'usbus.glb', title:'Town bus', author:'TODO', url:'TODO', license:'CC BY 4.0', todo:true},
  };
  const S = {state:'wait', loaded:{}, err:[], lm:{}, veh:{}, rail:{}};
  window.BAYM = S; S.MODELS = MODELS;
  const base = () => { try { return SGR_PATH + 'models/'; } catch (e){ return 'baydata/models/'; } };
  const cache = new Map();
  function load(key){
    if (cache.has(key)) return cache.get(key);
    const M = MODELS[key];
    const p = new Promise((res, rej) => {
      if (!M || M.todo){ rej(new Error('todo')); return; }
      if (!THREE.GLTFLoader){ rej(new Error('no GLTFLoader')); return; }
      new THREE.GLTFLoader().load(base() + M.file, g => { S.loaded[key] = true; res(g.scene); }, undefined, e => rej(e));
    });
    cache.set(key, p); return p;
  }
  S.load = load;

  // ---------------------------------------------------------------- landmark transforms
  // Fields (metres, radians; model units are whatever the file uses):
  //   type    landmark key; model  MODELS key
  //   up      'y' (glTF default) or 'z' (a Z-up export: turned -90 deg about x first)
  //   org     [x, y, z] model point put on the frame origin (default: plan centre of the bounding box, its lowest y)
  //   fit     scale: {S} explicit, or ['x'|'y'|'z', metres] = bounding-box extent on that model axis, or
  //           ['d', [x, y, z], [x, y, z], metres] = distance between two model points (e.g. the two tower tops)
  //   rot     turn about y after scaling (the model's front onto the frame's axes; frame +x = rot of the SG_PLACES entry)
  //   at      [x, z] frame point the origin goes to (default [0, 0])
  //   ground  'base' (y = 0 at the app's base height) | 'abs' (y = metres above the sea) | 'terrain' (lowest hC under foot)
  //   y       extra lift (m) after the ground rule; foot  [[x, z], ...] frame points sampled for 'terrain'
  //   light   [base, top] absolute heights for the landmark shader's floodlight gradient (optional)
  //   frame   lum > this on an untextured material = painted frame that glows at night (optional, like the HK BoC)
  //   drop    material / mesh name substrings to leave out (e.g. a water slab the author modelled under a bridge)
  const LM = [
    // Golden Gate Bridge. Frame of bay/ggb (ggbridge): origin at mid-span, +z toward the San Francisco tower (south), +x = east
    // across the deck, towers at z = -640.25 / +640.25; the hand-made build is absolute-height (y = metres above the sea).
    // Real: towers 227 m (746 ft) above the water, main span 1,280 m (4,200 ft), side spans 343 m, 67 m clearance
    // (goldengate.org design & construction stats). The app's road surface on the suspended spans is 67.18 m: the model's deck
    // top should land there. NB the key also draws the approaches, both anchorages and the Fort Point arch: a model of the
    // suspension spans only would drop those (decide per model in phase 2).
    {type:'ggbridge', model:'ggb', up:'y', fit:['d', null, null, 1280.2], rot:0, ground:'abs', y:0, light:[-2, 228], frame:0.55, todo:true},
    // Transamerica Pyramid. Frame of bay/sfdt: origin = OSM footprint centre (54.6 m square, ring +-27.3), +x = east face
    // (rot 9 deg, the Financial District grid), y = 0 = the app's base (the plaza top). Real: 260 m (853 ft) to the tip, 48
    // floors, spire 65 m (Wikipedia, Transamerica Pyramid; CTBUH skyscrapercenter building 772). Wings face east / west.
    {type:'transamerica', model:'transam', up:'y', fit:['y', 260], rot:0, ground:'base', y:0, todo:true},
    // Alcatraz Island. Frame of bay/sfwater: origin 3 m north of the reference anchor 37.8267, -122.423 (x east, z south, rot 0);
    // the coastline (sfwater COAST) is anchor-relative, so its points sit at (x, z + 3) here; y absolute (metres above the sea).
    // OSM coastline: long axis 36 deg (from +x toward +z), 543 m x 205 m with the wharf; the centre of that box is (-4.0, -13.5) here.
    // Real: 511 m x 180 m, 41 m at the highest point (Wikipedia, Alcatraz Island). Fit the plan to the OSM coastline.
    {type:'alcatraz', model:'alcatraz', up:'y', fit:['x', 543], rot:0, at:[-4.0, -13.5], ground:'abs', y:0, todo:true},
  ];

  // bounding box of a scene in its own space (after the up fix)
  function bbox(o){ o.updateMatrixWorld(true); return new THREE.Box3().setFromObject(o); }
  function lmBuild(E, src){
    return function(){
      const g = new THREE.Group(), u = LMCTX.u, top = u.base.value;
      const m = src.clone(true);
      // drop unwanted parts by material / mesh name
      if (E.drop && E.drop.length){ const kill = []; m.traverse(o => { if (o.isMesh && E.drop.some(s => (o.name + '|' + (o.material && o.material.name)).includes(s))) kill.push(o); }); for (const o of kill) o.parent.remove(o); }
      const up = new THREE.Group(); up.add(m); if (E.up === 'z') up.rotation.x = -Math.PI/2;
      const bb = bbox(up), ext = bb.getSize(new THREE.Vector3());
      const org = E.org || [(bb.min.x + bb.max.x)/2, bb.min.y, (bb.min.z + bb.max.z)/2];
      let k = 1; const f = E.fit;
      if (f && f.S) k = f.S;
      else if (f && f[0] === 'd' && f[1] && f[2]) k = f[3]/Math.hypot(f[2][0] - f[1][0], f[2][1] - f[1][1], f[2][2] - f[1][2]);
      else if (f && 'xyz'.includes(f[0]) && f[0] !== 'd') k = f[1]/(ext[f[0]] || 1);
      const at = E.at || [0, 0];
      const off = new THREE.Group(); off.add(up); off.position.set(-org[0], -org[1], -org[2]);
      const w = new THREE.Group(); w.add(off); w.scale.setScalar(k); w.rotation.y = E.rot || 0;
      // ground rule: local y of the model's origin
      let y0 = 0;
      if (E.ground === 'abs') y0 = -top;
      else if (E.ground === 'terrain'){
        const L = landmarks.find(q => q.type === E.type); let gmin = Infinity;
        if (L && E.foot){ const c = Math.cos(L.rot), s = Math.sin(L.rot); for (const [px, pz] of E.foot){ const x = px*c + pz*s, z = -px*s + pz*c; gmin = Math.min(gmin, hC(L.x + x, L.y - z)); } }
        y0 = isFinite(gmin) ? gmin - top : 0;
      }
      w.position.set(at[0], y0 + (E.y || 0), at[1]);
      if (E.light){ u.base.value = E.light[0]; u.top.value = E.light[1]; }
      const uFrame = Object.assign({}, u, {mode:{value:0}});
      let n = 0;
      m.traverse(o => {
        if (!o.isMesh) return;
        const om = o.material, map = om.map || null, col = om.color ? om.color.clone() : new THREE.Color(1, 1, 1);
        if (map){ map.encoding = THREE.LinearEncoding; map.anisotropy = 4; map.needsUpdate = true; }
        const lum = 0.3*col.r + 0.59*col.g + 0.11*col.b, frame = E.frame && !map && lum > E.frame;
        const mat = new THREE.MeshLambertMaterial({color:col, map, side:om.side === THREE.DoubleSide ? THREE.DoubleSide : THREE.FrontSide,
          transparent:!!om.transparent, opacity:om.opacity !== undefined ? om.opacity : 1, alphaTest:om.alphaTest || 0, vertexColors:!!om.vertexColors});
        if (frame) lmShader(mat, uFrame, '#fff2dc', 1.1); else lmShader(mat, u, null, 0);
        LMCTX.mats.set('glb' + (n++), mat);
        o.material = mat; o.castShadow = true; o.receiveShadow = true;
      });
      g.add(w); g.userData.keep = [w];
      S.lm[E.type] = {k:+k.toFixed(5), ext:[ext.x, ext.y, ext.z].map(v => +v.toFixed(3)), h:+(ext.y*k).toFixed(2)};
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

  // ---------------------------------------------------------------- vehicles: glTF -> traffic geometry (as hk/zz_models)
  // Road types of the US mix (lm20/traffic VT, real metres L x W x H): taxi 4.60 x 1.78 x 1.48, sedan 4.70 x 1.80 x 1.45,
  // hatch 4.05 x 1.74 x 1.50, suv 4.65 x 1.88 x 1.72, pickup 5.60 x 2.02 x 1.92, usbus 12.2 x 2.60 x 3.30.
  // front: the model's forward axis ('+z' glTF convention, or '-z' / '+x' / '-x'); node: name substring of one vehicle in a pack.
  const VEH = [
    {kind:'taxi', model:'taxi', dims:[4.60, 1.78, 1.48], lamp:'taxi', front:'+z', todo:true},
    {kind:'usbus', model:'usbus', dims:[12.2, 2.60, 3.30], lamp:'bus', front:'+z', todo:true},
  ];
  // Rail cars (bay app SGR_TRAIN, metres L x H x W, one InstancedMesh box each): cable cars (line codes K*) 8.4 x 3.3 x 2.5,
  // F-line streetcar (MF) 14.5 x 3.4 x 2.6, Muni Metro (M*) 23 x 3.4 x 2.7, VTA (V*) 27 x 3.6 x 2.65.
  // Real Powell Street cable car: 27 ft 6 in x 8 ft, 10 ft 4 in high (cablecarmuseum.org/car-powell.html) = 8.38 x 2.44 x 3.15 m.
  const RAIL = [
    {key:'cable', model:'cablecar', test:c => c[0] === 'K', dims:[8.38, 2.44, 3.15], front:'+z', todo:true},
    {key:'streetcar', model:'streetcar', test:c => c === 'MF', dims:[14.5, 2.6, 3.4], front:'+z', todo:true},
  ];
  function texSampler(map){
    const im = map && map.image; if (!im || !im.width) return null;
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0); const d = cx.getImageData(0, 0, im.width, im.height).data, W = im.width, H = im.height;
    return (u, v) => { u = u - Math.floor(u); v = v - Math.floor(v); const x = Math.min(W - 1, Math.floor(u*W)), y = Math.min(H - 1, Math.floor(v*H)), i = (y*W + x)*4; return [d[i]/255, d[i + 1]/255, d[i + 2]/255]; };
  }
  // dims: target length (x), width (z), height (y); out: x forward, y up, origin on the ground at the centre
  function vehGeo(src, dims, kind, front, node){
    let root = src;
    if (node){ let hit = null; src.traverse(o => { if (!hit && o.name && o.name.includes(node)) hit = o; }); if (hit) root = hit; }
    const turn = new THREE.Matrix4().makeRotationY({'+z':0, '-z':Math.PI, '+x':-Math.PI/2, '-x':Math.PI/2}[front || '+z'] || 0);
    root.updateMatrixWorld(true);
    const P = [], N = [], C = [], PA = [], LG = [];
    const v = new THREE.Vector3(), nv = new THREE.Vector3(), nm = new THREE.Matrix3(), mw = new THREE.Matrix4();
    root.traverse(o => {
      if (!o.isMesh) return;
      const g0 = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, pos = g0.attributes.position, nor = g0.attributes.normal, uv = g0.attributes.uv;
      const smp = texSampler(o.material.map), bc = o.material.color || new THREE.Color(1, 1, 1);
      mw.multiplyMatrices(turn, o.matrixWorld); nm.getNormalMatrix(mw);
      for (let i = 0; i < pos.count; i++){
        v.fromBufferAttribute(pos, i).applyMatrix4(mw); P.push(v.x, v.y, v.z);
        if (nor){ nv.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize(); N.push(nv.x, nv.y, nv.z); } else N.push(0, 1, 0);
        let c = [bc.r, bc.g, bc.b]; if (smp && uv){ const t = smp(uv.getX(i), uv.getY(i)); c = [c[0]*t[0], c[1]*t[1], c[2]*t[2]]; }
        C.push(c[0], c[1], c[2]); PA.push(0); LG.push(0);
      }
      if (g0 !== o.geometry) g0.dispose();
    });
    if (!P.length) return null;
    // bounds -> scale to the target size; length along x (model z -> x, model x -> -z)
    let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++){ mn[k] = Math.min(mn[k], P[i + k]); mx[k] = Math.max(mx[k], P[i + k]); }
    const sz = mx[2] - mn[2], sx = mx[0] - mn[0], sy = mx[1] - mn[1], cx = (mn[0] + mx[0])/2, cz = (mn[2] + mx[2])/2;
    const kL = dims[0]/sz, kW = dims[1]/sx, kH = dims[2]/sy;
    const P2 = new Float32Array(P.length), N2 = new Float32Array(N.length);
    for (let i = 0; i < P.length; i += 3){
      P2[i] = (P[i + 2] - cz)*kL; P2[i + 1] = (P[i + 1] - mn[1])*kH; P2[i + 2] = -(P[i] - cx)*kW;
      let nx = N[i + 2]/kL, ny = N[i + 1]/kH, nz = -N[i]/kW; const l = Math.hypot(nx, ny, nz) || 1; N2[i] = nx/l; N2[i + 1] = ny/l; N2[i + 2] = nz/l;
    }
    // lamps (estimate): per triangle, by facing and colour
    const half = dims[0]/2;
    for (let t = 0; t < P2.length/9; t++){
      let ax = 0, ay = 0, cr = 0, cg = 0, cb = 0, fx = 0, fy = 0, fz = 0;
      for (let j = 0; j < 3; j++){ const i = t*9 + j*3; ax += P2[i]/3; ay += P2[i + 1]/3; cr += C[i]/3; cg += C[i + 1]/3; cb += C[i + 2]/3; fx += N2[i]/3; fy += N2[i + 1]/3; fz += N2[i + 2]/3; }
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

  // ---------------------------------------------------------------- rail overlay (cable cars, streetcars)
  // vehGeo's [length, width, height] = the entry's dims [L, W, H]; the app's box is centred at the car's mid-height, so the
  // overlay car stands on (box centre - box height / 2).
  const RS = {list:[], trains:null, M:new THREE.Matrix4(), M2:new THREE.Matrix4(), Z:new THREE.Matrix4().makeScale(0, 0, 0),
    p:new THREE.Vector3(), q:new THREE.Quaternion(), s:new THREE.Vector3(), one:new THREE.Vector3(1, 1, 1)};
  function railMesh(E){
    const cap = net.trains.reduce((a, T) => a + (E.test((T.R && T.R.line && T.R.line.code) || '') ? (T.cars || net.nCars) : 0), 0);
    if (E.mesh){ E.mesh.parent && E.mesh.parent.remove(E.mesh); E.mesh.dispose(); }
    const im = new THREE.InstancedMesh(E.geo, E.mat, Math.max(1, cap)); im.count = 0; im.frustumCulled = false; im.castShadow = true; im.receiveShadow = true;
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.name = 'bayrail_' + E.key; moverGroup.add(im); E.mesh = im; E.cap = cap;
  }
  function railFrame(){
    if (typeof showNet !== 'undefined' && !showNet) return;
    const im = net.trainMesh; if (!im || !net.trains || !net.trains.length || !RS.list.length) return;
    if (RS.trains !== net.trains){ RS.trains = net.trains; for (const E of RS.list) railMesh(E); }
    for (const E of RS.list) E.n = 0;
    let i = 0;
    for (const T of net.trains){
      const nc = T.cars || net.nCars, code = (T.R && T.R.line && T.R.line.code) || '';
      let E = null; for (const e of RS.list) if (e.test(code)){ E = e; break; }
      for (let k = 0; k < nc; k++, i++){
        if (!E || i >= im.count) continue;
        im.getMatrixAt(i, RS.M); RS.M.decompose(RS.p, RS.q, RS.s);
        if (RS.s.x > 0.01 && E.n < E.cap){ RS.p.y -= RS.s.y/2; RS.M2.compose(RS.p, RS.q, RS.one); E.mesh.setMatrixAt(E.n++, RS.M2); }
        im.setMatrixAt(i, RS.Z);
      }
    }
    for (const E of RS.list){ E.mesh.count = E.n; E.mesh.instanceMatrix.needsUpdate = true; E.mat.emissive.copy(im.material.emissive); }
    im.instanceMatrix.needsUpdate = true;
  }
  function railAdd(E, sc){
    const geo = vehGeo(sc, E.dims, 'rail', E.front, E.node); if (!geo) return false;
    E.geo = geo; E.mat = new THREE.MeshLambertMaterial({vertexColors:true, emissive:0x000000});
    RS.list.push(E); RS.trains = null;
    if (!RS.hooked && typeof HOOKS !== 'undefined' && HOOKS.frame){ HOOKS.frame.push(railFrame); RS.hooked = true; }
    return true;
  }
  S.rs = RS;

  // ---------------------------------------------------------------- start
  const ready = () => { try { return SGR.on && landmarks.length > 20 && lmMeshes.size > 20; } catch (e){ return false; } };
  let tries = 0;
  function tick(){
    if (!ready()){ if (++tries > 400){ S.state = 'timeout'; return; } setTimeout(tick, 700); return; }
    if (!THREE.GLTFLoader){ S.state = 'noloader'; return; }
    S.state = 'loading';
    const jobs = [];
    for (const E of LM){
      if (E.todo || !MODELS[E.model] || MODELS[E.model].todo || !LANDMARKS[E.type]) continue;
      jobs.push(load(E.model).then(sc => { sc.traverse(o => { if (o.isMesh) o.userData.glb = true; }); swapLandmark(E.type, lmBuild(E, sc)); }).catch(e => S.err.push(E.type + ': ' + e)));
    }
    const T = window.SGTraffic;
    if (T && T.swapModel) for (const E of VEH){
      if (E.todo || !MODELS[E.model] || MODELS[E.model].todo) continue;
      jobs.push(load(E.model).then(sc => { S.veh[E.kind] = T.swapModel(E.kind, vehGeo(sc, E.dims, E.lamp, E.front, E.node)); }).catch(e => S.err.push(E.kind + ': ' + e)));
    }
    for (const E of RAIL){
      if (E.todo || !MODELS[E.model] || MODELS[E.model].todo) continue;
      jobs.push(load(E.model).then(sc => { S.rail[E.key] = railAdd(E, sc); }).catch(e => S.err.push(E.key + ': ' + e)));
    }
    S.jobs = jobs.length;
    Promise.all(jobs).then(() => { S.state = 'done'; });
  }
  S.LM = LM; S.VEH = VEH; S.RAIL = RAIL;
  // test hooks (headless checks feed them a stand-in scene; the app's globals are not reachable from outside the page script)
  const probe = type => { const L = landmarks.find(q => q.type === type), g = L && lmMeshes.get(L.id); if (!g) return null;
    const bb = new THREE.Box3().setFromObject(g); return {top:+L.top.toFixed(2), y0:+bb.min.y.toFixed(2), y1:+bb.max.y.toFixed(2), kids:g.children.length}; };
  const trains = () => ({total:net.trains.length, cc:net.trains.filter(T => T.cc).length, overlay:RS.list.map(E => ({key:E.key, cap:E.cap, shown:E.mesh ? E.mesh.count : -1}))});
  S.fn = {lmBuild, swapLandmark, railAdd, railFrame, probe, trains};
  setTimeout(tick, 2500);
})();
