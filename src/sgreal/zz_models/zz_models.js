// ===== v47 · sgreal/zz_models — downloaded glTF models for the Singapore map (Sketchfab, CC BY 4.0 / CC0) =====
// Same approach as hk/zz_models: free models, optimised (glTF-Transform: WebP textures at most 1024 px, quantised meshes) into
// sgdata/models/, loaded after the city is ready. Until a model arrives, or if its file is missing or broken, the page keeps
// its own hand-made (or procedural) version: every load error is caught and only logged in SGM.err.
//  - landmarks: a model replaces LANDMARKS[key].build (mode 'replace'), or is added to the hand-made build (mode 'add'), which
//    can cut the hand-made parts it stands in for out of that build (cut: 'model' = the model's own plan, or local shapes) and
//    keep the rest (podiums, plazas, piers). The model is kept out of lmMerge (g.userData.keep, see placeLandmarkMesh) so its
//    UVs and textures survive; its materials become MeshLambertMaterial + lmShader so night lighting works; maps are set to
//    LinearEncoding like the rest of the page. Per-model transform data (fit below): scale to a real dimension taken from a
//    cited source (height h to the model's top, or plan length len), turn to a compass bearing (or a raw rotation), place at a
//    surveyed point (at: lat / lon) and on the ground (the lowest ground under the model's plan, the landmark's base level, or
//    a given elevation).
//  - traffic: a model replaces the near model of one traffic type through window.SGTraffic.swapModel(kind, geo); vehGeo() bakes
//    palette textures into vertex colours, turns the model to x forward, scales it to the real size, marks body parts that take
//    the per-vehicle paint (aPaint) and guesses where the lamps are (aLight).
// MODELS lists every planned model; entries with todo:true are not loaded at all (no request) until their file is in
// sgdata/models/ and their transform data has been checked. Credits: SGM.credits() lists the models in use (title, author,
// licence, link); they also belong in README / DATA_LICENSE.
// Needs THREE.GLTFLoader (r128, examples/js/loaders/GLTFLoader.js, in the shared page template). Test handle: window.SGM.
(() => {
  const D2R = Math.PI/180;
  // ---------------------------------------------------------------- manifest
  // lm: {key, mode:'replace'|'add', fit:{h | len | s, src, top?, lenAxis?}, bearing + front | rot, at?:[lat, lon], off?:[x, z],
  //      pivot?:[x, y0, z] (model units; default: plan centre, lowest point), ground:'min'|'max'|'base'|number, base (m, with 'base'), sink,
  //      cut:'model'|[{poly:[[x, z]...]}|{c:[x, z]|'model', r}] (landmark group coordinates), cutY, cutPad, cutLive, night}
  // veh: {kind (traffic type), dims:[length, width, height] in m, len:'z'|'x' (the model's length axis), front:+1|-1,
  //       pick:/node name/, paint:/material name/|'auto'|null}
  // Dimensions: real values with their source in src; plan values marked 'estimate' are estimates. Bearings are compass
  // bearings (degrees clockwise from north) of the model axis named in front, measured in PHASE 2 against the OSM footprint.
  const MODELS = {
    // ---- landmarks (TODO: PHASE 2 — files not downloaded yet; front / bearing / at to be checked against the OSM footprint)
    mbs: {todo:true, file:'mbs.glb', title:'Marina Bay Sands 298', author:'hencui', licence:'CC BY 4.0', url:'https://sketchfab.com/3d-models/8f36faf12e904f8bb66bf694ae78d850',
      lm:{key:'mbs', mode:'add', cut:'model', cutY:6, ground:'base',
          fit:{h:206.9, src:'https://www.skyscrapercenter.com/building/marina-bay-sands-hotel-tower-1/2730 (architectural height, to the SkyPark)'},
          front:'+x', bearing:null /* TODO: the hotel axis runs 16-35 deg east of north (lm22/marina) */, at:null /* TODO: centre of the three towers */}},
    merlion: {todo:true, file:'merlion.glb', title:'Merlion_ Statue_0208175521_texture', author:'Wan_Jun_Shen', licence:'CC BY 4.0', url:'https://sketchfab.com/3d-models/f71520e907ec43718e60694e201cd251',
      lm:{key:'merlion', mode:'add', cut:[{c:'model', r:4.2}] /* the hand-made statue; its drum (0.15-0.95 m) stays */, cutY:1.0, ground:'base', base:0.95 /* TODO: 0.15 if the model has its own plinth */,
          fit:{h:8.6, src:'https://visitsingapore.com/see-do-singapore/recreation-leisure/viewpoints/merlion-park'},
          front:'+z', bearing:90 /* faces east over the bay (lm22/marina, Merlion Park) */, at:[1.286784, 103.854502] /* statue position as in lm22/marina (E 20.3, N -2.9 from 1.28681 N, 103.85432 E) */}},
    helix: {todo:true, file:'helix.glb', title:'Helix Bridge', author:'Sengchor', licence:'CC BY 4.0', url:'https://sketchfab.com/3d-models/1221edc4c2454b29b3b6adcd6fdefb0e',
      lm:{key:'helix', mode:'replace', ground:'base',
          fit:{len:280, src:'https://www.arup.com/projects/helix-bridge (280 m long)'},
          front:'+x', bearing:null /* TODO: chord of the real curved alignment (lm22/marina helix) */}},
    // ---- traffic (TODO: PHASE 2)
    bus: {todo:true, file:'bus.glb', title:'Generic Town Bus', author:'own.guest', licence:'CC BY 4.0', url:'https://sketchfab.com/3d-models/14fe03d792914d51b6c6250b393c44fd',
      veh:{kind:'bus', dims:[12.0, 2.55, 3.2] /* traffic.js VT 'bus' (Singapore 12 m single-deck) */, len:'z', front:1, paint:null}},
  };
  const S = {state:'wait', loaded:{}, err:[], lm:{}, veh:{}, info:{}};
  window.SGM = S; S.MODELS = MODELS;
  const isSG = () => { try { return SGR_PATH === 'sgdata/'; } catch (e){ return false; } };
  const base = () => { try { return SGR_PATH + 'models/'; } catch (e){ return 'sgdata/models/'; } };
  const cache = new Map();
  function load(key){
    if (cache.has(key)) return cache.get(key);
    const p = new Promise((res, rej) => {
      const M = MODELS[key]; if (!M || !M.file){ rej(new Error('no model ' + key)); return; }
      if (!THREE.GLTFLoader){ rej(new Error('no GLTFLoader')); return; }
      const url = base() + M.file;
      new THREE.GLTFLoader().load(url, g => { S.loaded[key] = true; res(g.scene); }, undefined, e => rej(new Error((e && e.message) || ('cannot load ' + url + (e && e.target && e.target.status ? ' (HTTP ' + e.target.status + ')' : '')))));
    });
    cache.set(key, p); return p;
  }
  S.load = load;
  // native size of a loaded model (model units): bounds, for working out the transform data in PHASE 2
  function bounds(src){ src.updateMatrixWorld(true); return new THREE.Box3().setFromObject(src); }
  S.bounds = key => load(key).then(sc => { const b = bounds(sc); return {min:b.min.toArray().map(v => +v.toFixed(3)), max:b.max.toArray().map(v => +v.toFixed(3))}; });

  // ---------------------------------------------------------------- landmarks
  // the landmark being placed: placeLandmarkMesh builds landmarks one at a time and stores the mesh after build(), so the
  // first landmark of this type without a mesh is the one being built (initial placement, rebuildLandmarks, a brush copy)
  function curL(type){ let first = null; for (const L of landmarks) if (L.type === type){ if (!first) first = L; if (!lmMeshes.has(L.id)) return L; } return first; }
  // model yaw in the world (three.js rotation.y) from a compass bearing of one of its axes; local yaw of the axes: +x 0, -z 90, -x 180, +z -90
  const AXIS = {'+x':0, '-z':90, '-x':180, '+z':-90};
  function worldRot(o){ if (typeof o.rot === 'number') return o.rot; if (typeof o.bearing === 'number') return (90 - o.bearing - (AXIS[o.front || '+x'] || 0))*D2R; return null; }
  // transform data for one landmark instance: scale k, model pivot (cx, y0, cz), inner yaw, offset (ox, oz) and height dy in the landmark group
  function placeData(src, o, L, top){
    const b = bounds(src), P = o.pivot || [(b.min.x + b.max.x)/2, b.min.y, (b.min.z + b.max.z)/2];
    const f = o.fit || {};
    const k = typeof f.s === 'number' ? f.s : typeof f.h === 'number' ? f.h/Math.max(1e-6, (typeof f.top === 'number' ? f.top : b.max.y) - P[1])
      : typeof f.len === 'number' ? f.len/Math.max(1e-6, f.lenAxis === 'x' ? b.max.x - b.min.x : f.lenAxis === 'z' ? b.max.z - b.min.z : Math.max(b.max.x - b.min.x, b.max.z - b.min.z)) : 1;
    const wr = worldRot(o), lr = L ? L.rot || 0 : 0, rin = wr === null ? 0 : wr - lr;
    // offset in the landmark group: a surveyed point (only for the landmark at its real place) or a local offset
    let ox = 0, oz = 0;
    if (o.at && L && L.sg){ const [x, y] = sgXY(o.at[0], o.at[1]), wx = x - L.x, wz = -(y - L.y), c = Math.cos(lr), s = Math.sin(lr); ox = wx*c - wz*s; oz = wx*s + wz*c; }
    else if (o.off){ ox = o.off[0]; oz = o.off[1]; }
    // the model's plan in the group (corners of its scaled, turned bounds) and the same points in the world
    const cr = Math.cos(rin), sr = Math.sin(rin), plan = [];
    for (const [mx, mz] of [[b.min.x, b.min.z], [b.max.x, b.min.z], [b.max.x, b.max.z], [b.min.x, b.max.z]]){ const x = (mx - P[0])*k, z = (mz - P[2])*k; plan.push([ox + x*cr + z*sr, oz - x*sr + z*cr]); }
    let dy = 0;
    if (typeof o.ground === 'number') dy = o.ground - top;
    else if (L && L.sg && o.ground !== 'base'){
      const c = Math.cos(lr), s = Math.sin(lr), pts = plan.slice();
      for (let i = 0; i < 4; i++){ const a = plan[i], q = plan[(i + 1) % 4]; pts.push([(a[0] + q[0])/2, (a[1] + q[1])/2]); }
      pts.push([ox, oz]);
      let lo = Infinity, hi = -Infinity;
      for (const [gx, gz] of pts){ const X = L.x + gx*c + gz*s, Z = -L.y - gx*s + gz*c, h = hC(X, -Z); lo = Math.min(lo, h); hi = Math.max(hi, h); }
      if (isFinite(lo)) dy = (o.ground === 'max' ? hi : lo) - top;
    }
    if (o.ground === 'base' || !(L && L.sg)) dy += o.base || 0;          // base: local height of the model's lowest point (e.g. on a hand-made drum)
    dy -= o.sink !== undefined ? o.sink : (o.ground === 'base' ? 0 : 0.3);
    return {k, P, rin, ox, oz, dy, plan, b};
  }
  // the model's materials: Lambert + the landmark shader; very light untextured parts may glow at night (o.night: {lum, c, k})
  function convert(m, o){
    const u = LMCTX.u, nt = o.night || null, uGlow = Object.assign({}, u, {mode:{value:0}});
    let n = 0;
    m.traverse(q => {
      if (!q.isMesh) return;
      const om = q.material, map = om.map || null, col = om.color ? om.color.clone() : new THREE.Color(1, 1, 1);
      if (map){ map.encoding = THREE.LinearEncoding; map.anisotropy = 4; map.needsUpdate = true; }
      const mat = new THREE.MeshLambertMaterial({color:col, map, side:om.side !== undefined ? om.side : THREE.FrontSide, vertexColors:!!(q.geometry && q.geometry.attributes.color),
        transparent:!!om.transparent, opacity:om.opacity !== undefined ? om.opacity : 1, alphaTest:om.alphaTest || 0});
      const lum = 0.3*col.r + 0.59*col.g + 0.11*col.b;
      if (nt && !map && lum > (nt.lum || 0.62)) lmShader(mat, uGlow, nt.c || '#f2f6ff', nt.k || 1.0); else lmShader(mat, u, null, 0);
      LMCTX.mats.set('glb' + (n++), mat);
      q.material = mat; q.castShadow = true; q.receiveShadow = true;
    });
  }
  const pip = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
  // cut hand-made parts out of a build: triangles whose centre lies inside one of the shapes (group coordinates) and above
  // cutY are dropped; live and kept parts are left alone (cutLive drops the live parts too)
  function cutBuild(g, shapes, cutY, cutLive){
    const live = new Set((g.userData && g.userData.live) || []), keep = new Set((g.userData && g.userData.keep) || []);
    if (cutLive && live.size){ for (const o of live) if (o.parent) o.parent.remove(o); g.userData.live = []; if (g.userData.spin) g.userData.spin = null; live.clear(); }
    const inside = (x, y, z) => { if (y < cutY) return false; for (const s of shapes){ if (s.poly ? pip(s.poly, x, z) : (x - s.c[0])**2 + (z - s.c[1])**2 < s.r*s.r) return true; } return false; };
    g.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), M = new THREE.Matrix4(), meshes = [];
    const skip = o => { for (let p = o; p && p !== g; p = p.parent) if (live.has(p) || keep.has(p)) return true; return false; };
    g.traverse(o => { if (o.isMesh && !skip(o)) meshes.push(o); });
    let cut = 0;
    for (const o of meshes){
      M.multiplyMatrices(inv, o.matrixWorld);
      const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); geo.applyMatrix4(M);
      const pos = geo.attributes.position.array, nor = geo.attributes.normal ? geo.attributes.normal.array : null, col = geo.attributes.color ? geo.attributes.color.array : null;
      const P = [], N = [], C = [];
      for (let t = 0; t < pos.length; t += 9){
        const x = (pos[t] + pos[t + 3] + pos[t + 6])/3, y = (pos[t + 1] + pos[t + 4] + pos[t + 7])/3, z = (pos[t + 2] + pos[t + 5] + pos[t + 8])/3;
        if (inside(x, y, z)){ cut++; continue; }
        for (let j = 0; j < 9; j++){ P.push(pos[t + j]); if (nor) N.push(nor[t + j]); if (col) C.push(col[t + j]); }
      }
      geo.dispose();
      o.parent.remove(o);
      if (!P.length) continue;
      const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      if (N.length) ng.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); else ng.computeVertexNormals();
      if (C.length) ng.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      const nm = new THREE.Mesh(ng, o.material); nm.castShadow = o.castShadow; nm.receiveShadow = o.receiveShadow; g.add(nm);
    }
    return cut;
  }
  // build() for a landmark with a model: replaces the hand-made build, or adds the model to it
  function lmBuild(key, src, oldBuild){
    const M = MODELS[key], o = M.lm;
    return function(){
      const top = LMCTX.u.base.value, L = curL(o.key);
      const g = o.mode === 'add' && oldBuild ? oldBuild.call(this) : new THREE.Group();
      const d = placeData(src, o, L, top);
      const w = new THREE.Group(), m = src.clone(true);
      m.position.set(-d.P[0], -d.P[1], -d.P[2]); w.add(m); w.scale.setScalar(d.k); w.rotation.y = d.rin; w.position.set(d.ox, d.dy, d.oz);
      convert(m, o);
      if (o.mode === 'add' && o.cut){
        // shapes in group coordinates; c:'model' is a circle round the model's own position
        const shapes = o.cut === 'model' ? [{poly:padPoly(d.plan, o.cutPad !== undefined ? o.cutPad : 2)}] : o.cut.map(q => q.c === 'model' ? {c:[d.ox, d.oz], r:q.r} : q);
        S.lm[key + '_cut'] = cutBuild(g, shapes, o.cutY !== undefined ? o.cutY : 1, !!o.cutLive);
      }
      g.add(w); g.userData.keep = ((g.userData && g.userData.keep) || []).concat([w]);
      S.info[key] = {k:+d.k.toFixed(4), rin:+d.rin.toFixed(4), ox:+d.ox.toFixed(2), oz:+d.oz.toFixed(2), dy:+d.dy.toFixed(2), size:[d.b.max.x - d.b.min.x, d.b.max.y - d.b.min.y, d.b.max.z - d.b.min.z].map(v => +(v*d.k).toFixed(2))};
      return g;
    };
  }
  // a convex-ish plan grown by pad metres (from its centre)
  function padPoly(P, pad){ const cx = P.reduce((s, p) => s + p[0], 0)/P.length, cz = P.reduce((s, p) => s + p[1], 0)/P.length;
    return P.map(([x, z]) => { const dx = x - cx, dz = z - cz, l = Math.hypot(dx, dz) || 1; return [x + dx/l*pad*1.414, z + dz/l*pad*1.414]; }); }
  // swap a landmark's build and rebuild its placed instances (as hk/zz_models)
  const ORIG = {};
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
  function applyLandmark(key, sc){
    const o = MODELS[key].lm, def = LANDMARKS[o.key]; if (!def) return false;
    if (!ORIG[o.key]) ORIG[o.key] = def.build;
    sc.traverse(q => { if (q.isMesh) q.userData.glb = true; });
    const ok = swapLandmark(o.key, lmBuild(key, sc, ORIG[o.key]));
    S.lm[key] = ok ? 1 : 0;
    try { if (SGR.on) sgrLandmarksChanged(); } catch (e){ }
    return ok;
  }
  // PHASE 2 tuning: SGM.tune('merlion', {bearing:92, ground:'min'}) changes the transform data and rebuilds; SGM.restore(key) puts the hand-made build back
  S.tune = (key, patch) => { const M = MODELS[key]; if (!M || !M.lm) return Promise.resolve(false); Object.assign(M.lm, patch || {}); return load(key).then(sc => applyLandmark(key, sc)).catch(e => { S.err.push(key + ': ' + e); return false; }); };
  S.restore = key => { const M = MODELS[key]; if (!M || !M.lm || !ORIG[M.lm.key]) return false; const ok = swapLandmark(M.lm.key, ORIG[M.lm.key]); S.lm[key] = 0; try { if (SGR.on) sgrLandmarksChanged(); } catch (e){ } return ok; };

  // ---------------------------------------------------------------- vehicles: glTF -> traffic geometry
  function texSampler(map){
    const im = map && map.image; if (!im || !im.width) return null;
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0); const d = cx.getImageData(0, 0, im.width, im.height).data, W = im.width, H = im.height;
    return (u, v) => { u = u - Math.floor(u); v = v - Math.floor(v); const x = Math.min(W - 1, Math.floor(u*W)), y = Math.min(H - 1, Math.floor(v*H)), i = (y*W + x)*4; return [d[i]/255, d[i + 1]/255, d[i + 2]/255]; };
  }
  // o: {dims:[length (x), width (z), height (y)], kind, len:'z'|'x', front:+1|-1, pick, paint}; the result is in the traffic format
  // (position, normal, color, aPaint, aLight; x forward, y up, origin on the ground at the centre; real metres)
  function vehGeo(src, o){
    const dims = o.dims, kind = o.kind || '', busy = kind === 'bus' || kind === 'dd' || kind === 'artic';
    let root = src;
    if (o.pick){ root = null; src.traverse(q => { if (!root && o.pick.test(q.name || '')) root = q; }); if (!root) throw new Error('no node ' + o.pick); }
    src.updateMatrixWorld(true);
    const P = [], N = [], C = [], PA = [], LG = [], MI = [], mats = [];
    const v = new THREE.Vector3(), nv = new THREE.Vector3(), nm = new THREE.Matrix3();
    root.traverse(q => {
      if (!q.isMesh) return;
      const g0 = q.geometry.index ? q.geometry.toNonIndexed() : q.geometry, pos = g0.attributes.position, nor = g0.attributes.normal, uv = g0.attributes.uv, vc = g0.attributes.color;
      const smp = texSampler(q.material.map), bc = q.material.color || new THREE.Color(1, 1, 1);
      let mi = mats.indexOf(q.material); if (mi < 0){ mi = mats.length; mats.push(q.material); }
      nm.getNormalMatrix(q.matrixWorld);
      for (let i = 0; i < pos.count; i++){
        v.fromBufferAttribute(pos, i).applyMatrix4(q.matrixWorld); P.push(v.x, v.y, v.z);
        if (nor){ nv.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize(); N.push(nv.x, nv.y, nv.z); } else N.push(0, 1, 0);
        let c = [bc.r, bc.g, bc.b]; if (smp && uv){ const t = smp(uv.getX(i), uv.getY(i)); c = [c[0]*t[0], c[1]*t[1], c[2]*t[2]]; }
        if (vc){ c = [c[0]*vc.getX(i), c[1]*vc.getY(i), c[2]*vc.getZ(i)]; }
        C.push(c[0], c[1], c[2]); PA.push(0); LG.push(0); MI.push(mi);
      }
      if (g0 !== q.geometry) g0.dispose();
    });
    if (!P.length) throw new Error('empty model');
    // bounds -> real size; the model's length axis becomes x (forward), a turn about y (no mirroring)
    let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++){ mn[k] = Math.min(mn[k], P[i + k]); mx[k] = Math.max(mx[k], P[i + k]); }
    const lz = (o.len || 'z') === 'z', fr = o.front === -1 ? -1 : 1, cx = (mn[0] + mx[0])/2, cz = (mn[2] + mx[2])/2;
    const sL = lz ? mx[2] - mn[2] : mx[0] - mn[0], sW = lz ? mx[0] - mn[0] : mx[2] - mn[2], sy = mx[1] - mn[1];
    const kL = dims[0]/sL, kW = dims[1]/sW, kH = dims[2]/sy;
    const map = (x, y, z) => lz ? [fr*(z - cz)*kL, (y - mn[1])*kH, -fr*(x - cx)*kW] : [fr*(x - cx)*kL, (y - mn[1])*kH, fr*(z - cz)*kW];
    const mapN = (x, y, z) => { const r = lz ? [fr*z/kL, y/kH, -fr*x/kW] : [fr*x/kL, y/kH, fr*z/kW], l = Math.hypot(r[0], r[1], r[2]) || 1; return [r[0]/l, r[1]/l, r[2]/l]; };
    const P2 = new Float32Array(P.length), N2 = new Float32Array(N.length);
    for (let i = 0; i < P.length; i += 3){ const a = map(P[i], P[i + 1], P[i + 2]), b = mapN(N[i], N[i + 1], N[i + 2]); P2.set(a, i); N2.set(b, i); }
    // paint: parts tinted by each vehicle's colour (white base so the palette colour shows as it is)
    const nT = P2.length/9, paintT = new Uint8Array(nT);
    if (o.paint instanceof RegExp){ for (let t = 0; t < nT; t++) if (o.paint.test(mats[MI[t*3]].name || '')) paintT[t] = 1; }
    else if (o.paint === 'auto'){
      // the colour with the most surface among the light-to-mid, not glassy parts (an estimate of the body colour)
      const area = new Map(), keyOf = t => { const i = t*9; return [C[i], C[i + 1], C[i + 2]].map(c => Math.round(c*12)).join(','); };
      for (let t = 0; t < nT; t++){ const i = t*9, l = 0.3*C[i] + 0.59*C[i + 1] + 0.11*C[i + 2]; if (l < 0.18) continue;
        const ax = P2[i + 3] - P2[i], ay = P2[i + 4] - P2[i + 1], az = P2[i + 5] - P2[i + 2], bx = P2[i + 6] - P2[i], by = P2[i + 7] - P2[i + 1], bz = P2[i + 8] - P2[i + 2];
        const A = Math.hypot(ay*bz - az*by, az*bx - ax*bz, ax*by - ay*bx)/2, k = keyOf(t); area.set(k, (area.get(k) || 0) + A); }
      let best = null, bA = 0; for (const [k, A] of area) if (A > bA){ bA = A; best = k; }
      if (best) for (let t = 0; t < nT; t++) if (keyOf(t) === best) paintT[t] = 1;
    }
    for (let t = 0; t < nT; t++) if (paintT[t]) for (let j = 0; j < 3; j++){ const i = (t*3 + j)*3; const l = Math.max(C[i], C[i + 1], C[i + 2]) || 1; C[i] = C[i + 1] = C[i + 2] = Math.min(1, 0.55 + 0.45*l); PA[t*3 + j] = 1; }
    // lamps (an estimate): per triangle, by facing, height and colour
    const half = dims[0]/2;
    for (let t = 0; t < nT; t++){
      let ax = 0, ay = 0, cr = 0, cg = 0, cb = 0, fx = 0, fy = 0, fz = 0;
      for (let j = 0; j < 3; j++){ const i = t*9 + j*3; ax += P2[i]/3; ay += P2[i + 1]/3; cr += C[i]/3; cg += C[i + 1]/3; cb += C[i + 2]/3; fx += N2[i]/3; fy += N2[i + 1]/3; fz += N2[i + 2]/3; }
      if (paintT[t]) continue;
      const lum = 0.3*cr + 0.59*cg + 0.11*cb, hN = ay/dims[2];
      let L = 0;
      if (fx > 0.55 && ax > half*0.8 && hN < (busy ? 0.2 : 0.55) && lum > 0.6) L = 1;                           // headlamps: light, low, front
      else if (fx < -0.55 && ax < -half*0.8 && hN < (busy ? 0.25 : 0.6) && cr > 0.45 && cr > cg*1.6) L = 2;      // tail lamps: red, low, rear
      else if (busy && Math.abs(fz) > 0.7 && hN > 0.22 && hN < 0.92 && lum < 0.42 && Math.abs(cr - cb) < 0.25) L = 3;   // lit windows
      else if (kind === 'taxi' && fy > 0.3 && hN > 0.88 && lum > 0.7) L = 5;                                     // roof sign
      if (L) for (let j = 0; j < 3; j++) LG[t*3 + j] = L;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P2, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N2, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aPaint', new THREE.Float32BufferAttribute(PA, 1)); g.setAttribute('aLight', new THREE.Float32BufferAttribute(LG, 1));
    g.computeBoundingSphere();
    return g;
  }
  S.vehGeo = vehGeo;
  function applyVehicle(key, sc){
    const T = window.SGTraffic, o = MODELS[key].veh;
    if (!T || !T.swapModel) return false;
    const ok = T.swapModel(o.kind, vehGeo(sc, o));
    S.veh[o.kind] = ok ? key : 0;
    return ok;
  }

  // test hook: apply a scene that is already in memory (e.g. built in the console) as model key
  // test handles: the page's landmark state is not global (app.js is one script scope)
  S.dbg = {landmarks:() => landmarks, meshes:() => lmMeshes, defs:() => LANDMARKS, sgXY:(lat, lon) => sgXY(lat, lon)};
  S.apply = (key, sc) => { const M = MODELS[key]; if (!M) return false; return M.lm ? applyLandmark(key, sc) : M.veh ? applyVehicle(key, sc) : false; };

  // ---------------------------------------------------------------- credits (the models in use)
  S.credits = () => Object.keys(MODELS).filter(k => S.lm[k] || Object.values(S.veh).includes(k)).map(k => { const M = MODELS[k]; return {title:M.title, author:M.author, licence:M.licence, url:M.url}; });

  // ---------------------------------------------------------------- start
  const ready = () => { try { return isSG() && SGR.on && landmarks.length > 20 && lmMeshes.size > 20 && !!THREE.GLTFLoader; } catch (e){ return false; } };
  let tries = 0;
  function tick(){
    try { if (typeof SGR_PATH !== 'undefined' && !isSG()){ S.state = 'off'; return; } } catch (e){ }
    if (!ready()){ if (++tries > 400){ S.state = 'timeout'; return; } setTimeout(tick, 700); return; }
    S.state = 'loading';
    const jobs = [];
    for (const key of Object.keys(MODELS)){
      const M = MODELS[key]; if (M.todo) continue;
      if (M.lm){ if (!LANDMARKS[M.lm.key]) continue; jobs.push(load(key).then(sc => applyLandmark(key, sc)).catch(e => S.err.push(key + ': ' + e))); }
      else if (M.veh){ const T = window.SGTraffic; if (!T || !T.swapModel) continue; jobs.push(load(key).then(sc => applyVehicle(key, sc)).catch(e => S.err.push(key + ': ' + e))); }
    }
    Promise.all(jobs).then(() => { S.state = 'done'; });
  }
  setTimeout(tick, 2500);
})();
