/* ================= gba: downloaded glTF models (Sketchfab, CC BY 4.0 / CC0) for the Greater Bay map ================= */
// Same approach as hk/zz_models and sgreal/zz_models, adapted to the Greater Bay page (the October engine, built from an older
// page template): free models, optimised (glTF-Transform: WebP textures at most 1024 px, quantised meshes) into gbadata/models/,
// loaded after the city is ready. Until a model arrives, or if its file is missing or broken, the page keeps its own hand-made
// (or procedural) version: every load error is caught and only logged in GBM.err. Entries with todo:true are never requested.
//  - lm: a model replaces LANDMARKS[key].build (mode 'replace') or is added to the hand-made build (mode 'add', which can cut
//    the hand-made parts it stands in for). The model is kept out of lmMerge (g.userData.keep) so its UVs and textures survive.
//    This page's template predates that rule (placeLandmarkMesh merges everything), so this module backports it: lmMerge is
//    wrapped to leave g.userData.keep parts alone. Materials become MeshLambertMaterial + lmShader (night lighting); maps are set
//    to LinearEncoding like the rest of the page. After a swap the landmark's ground-plan hull is recomputed, so the real
//    buildings under the model are hidden (and those only the old model covered come back).
//  - place: a model that is not a landmark, placed at lat / lon with a scale, a rotation and a ground rule (GBM.place). It can
//    hide the real buildings within a radius (a disc in SGR.discs, re-added after the network build resets that list).
//  - veh: a model replaces the near model of one traffic type through window.SGTraffic.swapModel(kind, geo). The traffic module
//    in this page's build (lm20/traffic as of 14 Nov) has no swapModel yet, so vehicle entries are skipped (GBM.info.veh says so).
// Coordinates (gbareal/common.py, gbareal/README.md): world x = (lon - 114.0520475)*103014.2 east, y = (lat - 22.6560705)*110734.9
// north; three.js position (x, h, -y); the map square is |x|, |y| <= HALF = 63000 m (lon 113.4405-114.6636, lat 22.0871-23.2249).
// Guangzhou (Canton Tower, Zhujiang New Town) lies west of the square: such entries are kept in the manifest (outside:true) but
// cannot be placed on this map.
// Needs THREE.GLTFLoader (r128, examples/js/loaders/GLTFLoader.js, added to this page by gbareal/patch_gba.py). Test handle: window.GBM.
(() => {
  const D2R = Math.PI/180;
  // ---------------------------------------------------------------- manifest
  // lm:    {key, mode:'replace'|'add', fit:{h | len | s, src, top?, lenAxis?}, bearing + front | rot, at?:[lat, lon], off?:[x, z],
  //         pivot?:[x, y0, z] (model units; default: plan centre, lowest point), ground:'min'|'max'|'base'|number, sink,
  //         cut:'model'|[{poly:[[x, z]...]}|{c:[x, z]|'model', r}] (landmark group coordinates), cutY, cutPad, night, drop}
  // place: {at:[lat, lon], fit, bearing + front | rot, pivot, ground:'min'|'max'|'centre'|number, sink, hide:r (m), hideH, drop}
  // veh:   {kind (traffic type), dims:[length, width, height] in m, len:'z'|'x', front:+1|-1, pick:/node name/, paint}
  // drop: /node name/ — parts removed from the model before placing (e.g. a photo-textured ground tile shipped with it).
  // Real dimensions carry their source in src; values marked 'estimate' are estimates. Bearings are compass bearings (degrees
  // clockwise from north) of the model axis named in front, measured in PHASE 2 against the OSM footprint.
  // Licences: the search notes say the Void.com uploads give no source for their CC BY claim: check before shipping (PHASE 2).
  const MODELS = {
    // ---- landmarks on this map (TODO: PHASE 2 — files not downloaded; front / bearing / pivot to be checked against the footprint)
    pingan: {todo:true, file:'pingan.glb', title:'Ping An Finance Center', author:'Void.com', licence:'CC BY 4.0 (claimed; source unverified)',
      url:'https://sketchfab.com/3d-models/36b8ba861f82470ab0e862e644e1269f',
      lm:{key:'hkpingan', mode:'replace', ground:'base',
          fit:{h:599.1, src:'https://www.skyscrapercenter.com/building/ping-an-finance-center/54 (architectural height; Wikipedia: 599.1 m)'},
          front:'+x', bearing:null /* TODO: square plan, chamfered corners: align to the OSM footprint w535860513 (gba/szcbd) */,
          at:null /* the landmark anchor 22.53664, 114.050355 = centroid of OSM w535860513 (gba/targets.json) */}},
    crtower: {todo:true, file:'crtower.glb', title:'China Resources Tower', author:'Void.com', licence:'CC BY 4.0 (claimed; source unverified)',
      url:'https://sketchfab.com/3d-models/612532ddba184bca8f253b508186c5ed',
      lm:{key:'hkcrtower', mode:'replace', ground:'base',
          fit:{h:392.5, src:'https://www.skyscrapercenter.com/building/china-resources-headquarters/14589 (architectural height; Wikipedia: 392.5 m)'},
          front:'+x', bearing:null /* round plan: only the rib phase matters */, at:null /* anchor 22.517785, 113.941611 = OSM w529272473 */}},
    icc: {todo:true, file:'icc.glb', title:'International Commerce Centre FBX', author:'patrick.young', licence:'CC BY 4.0',
      url:'https://sketchfab.com/3d-models/2d520f09767c4181b9476c3768aae6ed',   /* a 1.1k-face box tower (search notes); source data credited to the HKSAR CSDI portal */
      lm:{key:'hkicc', mode:'replace', ground:'base',
          fit:{h:484, src:'https://www.skyscrapercenter.com/building/international-commerce-centre/137 (484 m)'},
          front:'+x', bearing:null /* the hand-made model uses rot 0.763 rad (gbareal/app/hklm/westkowloon.js) */}},
    buddha: {todo:true, file:'buddha.glb', title:'Tian Tan Buddha', author:'Dystopia', licence:'CC BY 4.0',
      url:'https://sketchfab.com/3d-models/e98a9498fc6e4b5baede7d5b2de99104',   /* author's photogrammetry, 98k faces, with terrain base and plinth */
      lm:{key:'hkbuddha', mode:'add', cut:'model', cutY:0.5, ground:'base',
          fit:{h:34, src:'https://en.wikipedia.org/wiki/Tian_Tan_Buddha (the statue is 34 m; the model includes its base and terrain: set fit.top / pivot in PHASE 2)'},
          front:'+z', bearing:null /* faces down the steps (gbareal/app/hklm/lantau.js BU_DIR) */, drop:null /* TODO: the terrain base */}},
    // Bank of China Tower: the Hong Kong page's model (hk/zz_models) fits this map's hkboc unchanged (same hand-made landmark via
    // gbareal/app/hklm/admiralty.js, rot 0). TODO PHASE 2: copy site/hkdata/models/boc_raise3d.glb to site/gbadata/models/.
    boc: {todo:true, file:'boc_raise3d.glb', title:'Bank of China Tower', author:'Raise3D', licence:'CC BY 4.0', url:'https://sketchfab.com/3d-models/b99aa9bd3f574287bfb3e208705752de',
      lm:{key:'hkboc', mode:'replace', ground:'min', sink:0.3, pivot:[38.5, -143.11, 176.1], rot:2.863,
          fit:{s:367.4/354.23, src:'hk/zz_models: model mast tip 354.2 above its plaza scaled to the real 367.4 m tip (CTBUH)'},
          night:{lum:0.62, c:'#f2f6ff', k:1.25} /* the white frame glows, as on the Hong Kong page */}},
    // ---- Guangzhou: outside this map's square (lon < 113.4405): not placeable here (a Guangzhou map would need its own frame)
    cantontower: {todo:true, outside:true, file:'cantontower.glb', title:'Guangzhou tower', author:'Void.com', licence:'CC BY 4.0 (claimed; source unverified)',
      url:'https://sketchfab.com/3d-models/33a01343287045d0bad93f277feb4ca6',
      place:{at:[23.10889, 113.31889] /* https://en.wikipedia.org/wiki/Canton_Tower */, fit:{h:602, src:'https://en.wikipedia.org/wiki/Canton_Tower (602 m to the tip)'}, ground:'centre'}},
    // ---- traffic (TODO: PHASE 2; needs SGTraffic.swapModel in this page's traffic module)
    minibus: {todo:true, file:'minibus.glb', title:'Minibus', author:'businessyuen', licence:'CC BY 4.0', url:'https://sketchfab.com/3d-models/23b3d2c733764a6d9917bc46cc88c822',
      veh:{kind:null /* TODO: which traffic type (Hong Kong public light bus) */, dims:null, len:'z', front:1, paint:null}},
  };
  const S = {state:'wait', loaded:{}, err:[], lm:{}, placed:{}, veh:{}, info:{}};
  window.GBM = S; S.MODELS = MODELS;
  const isGBA = () => { try { return SGR_PATH === 'gbadata/'; } catch (e){ return false; } };
  const base = () => { try { return SGR_PATH + 'models/'; } catch (e){ return 'gbadata/models/'; } };
  const cache = new Map();
  function load(key){
    if (cache.has(key)) return cache.get(key);
    const p = new Promise((res, rej) => {
      const M = MODELS[key]; if (!M || !M.file){ rej(new Error('no model ' + key)); return; }
      if (!THREE.GLTFLoader){ rej(new Error('no GLTFLoader')); return; }
      new THREE.GLTFLoader().load(base() + M.file, g => { S.loaded[key] = true; res(g.scene); }, undefined, e => rej(new Error(M.file + ': ' + (e && e.message ? e.message : e && e.target && e.target.status ? 'HTTP ' + e.target.status : 'load failed'))));
    });
    p.catch(() => cache.delete(key));   // a failed load can be retried (e.g. after the file is added)
    cache.set(key, p); return p;
  }
  S.load = load;
  function bounds(src){ src.updateMatrixWorld(true); return new THREE.Box3().setFromObject(src); }
  S.bounds = key => load(key).then(sc => { const b = bounds(sc); return {min:b.min.toArray().map(v => +v.toFixed(3)), max:b.max.toArray().map(v => +v.toFixed(3))}; });
  // remove parts by node name (o.drop) from a clone
  function dropParts(m, re){ if (!re) return 0; const kill = []; m.traverse(q => { if (q !== m && re.test(q.name || '')) kill.push(q); }); for (const q of kill) if (q.parent) q.parent.remove(q); return kill.length; }
  const inSquare = (x, y) => Math.abs(x) <= HALF && Math.abs(y) <= HALF;

  // ---------------------------------------------------------------- backport: kept parts are not merged (template v47 rule)
  // placeLandmarkMesh in this page merges every mesh of a landmark into one mesh per material (positions, normals and vertex
  // colours only). Parts listed in g.userData.keep are taken out before the merge and put back after it.
  if (!String(placeLandmarkMesh).includes('userData.keep') && !String(lmMerge).includes('userData.keep')){
    const _lmMerge = lmMerge;
    lmMerge = function(g){   // eslint-disable-line no-func-assign
      const keep = (g && g.userData && g.userData.keep) || [];   // userData.keep
      for (const o of keep) g.remove(o);
      _lmMerge(g);
      for (const o of keep) g.add(o);
    };
  }

  // ---------------------------------------------------------------- transform data
  // the landmark being placed: placeLandmarkMesh builds landmarks one at a time and stores the mesh after build(), so the
  // first landmark of this type without a mesh is the one being built (initial placement, rebuildLandmarks, a brush copy)
  function curL(type){ let first = null; for (const L of landmarks) if (L.type === type){ if (!first) first = L; if (!lmMeshes.has(L.id)) return L; } return first; }
  // model yaw (three.js rotation.y) from a compass bearing of one of its axes; local yaw of the axes: +x 0, -z 90, -x 180, +z -90
  const AXIS = {'+x':0, '-z':90, '-x':180, '+z':-90};
  function worldRot(o){ if (typeof o.rot === 'number') return o.rot; if (typeof o.bearing === 'number') return (90 - o.bearing - (AXIS[o.front || '+x'] || 0))*D2R; return null; }
  // scale k and model pivot P (model units) from the fit data
  function fitData(src, o){
    const b = bounds(src), P = o.pivot || [(b.min.x + b.max.x)/2, b.min.y, (b.min.z + b.max.z)/2], f = o.fit || {};
    const k = typeof f.s === 'number' ? f.s : typeof f.h === 'number' ? f.h/Math.max(1e-6, (typeof f.top === 'number' ? f.top : b.max.y) - P[1])
      : typeof f.len === 'number' ? f.len/Math.max(1e-6, f.lenAxis === 'x' ? b.max.x - b.min.x : f.lenAxis === 'z' ? b.max.z - b.min.z : Math.max(b.max.x - b.min.x, b.max.z - b.min.z)) : 1;
    return {b, P, k};
  }
  // the model's plan (corners of its scaled, turned bounds) around (ox, oz) in a frame turned by r
  function planOf(b, P, k, r, ox, oz){
    const c = Math.cos(r), s = Math.sin(r), plan = [];
    for (const [mx, mz] of [[b.min.x, b.min.z], [b.max.x, b.min.z], [b.max.x, b.max.z], [b.min.x, b.max.z]]){ const x = (mx - P[0])*k, z = (mz - P[2])*k; plan.push([ox + x*c + z*s, oz - x*s + z*c]); }
    return plan;
  }
  // lowest / highest ground under a plan given in world (x, y): corners, edge midpoints and centre
  function groundUnder(planXY, cx, cy){
    const pts = planXY.slice(); for (let i = 0; i < 4; i++){ const a = planXY[i], q = planXY[(i + 1) % 4]; pts.push([(a[0] + q[0])/2, (a[1] + q[1])/2]); } pts.push([cx, cy]);
    let lo = Infinity, hi = -Infinity; for (const [x, y] of pts){ const h = hC(x, y); lo = Math.min(lo, h); hi = Math.max(hi, h); }
    return {lo, hi, c:hC(cx, cy)};
  }
  // landmark instance: scale k, pivot P, inner yaw rin, offset (ox, oz) and height dy in the landmark group
  function placeData(src, o, L, top){
    const {b, P, k} = fitData(src, o);
    const wr = worldRot(o), lr = L ? L.rot || 0 : 0, rin = wr === null ? 0 : wr - lr;
    let ox = 0, oz = 0;
    if (o.at && L && L.sg){ const [x, y] = sgXY(o.at[0], o.at[1]), wx = x - L.x, wz = -(y - L.y), c = Math.cos(lr), s = Math.sin(lr); ox = wx*c - wz*s; oz = wx*s + wz*c; }
    else if (o.off){ ox = o.off[0]; oz = o.off[1]; }
    const plan = planOf(b, P, k, rin, ox, oz);
    let dy = 0;
    if (typeof o.ground === 'number') dy = o.ground - top;
    else if (L && L.sg && o.ground !== 'base'){
      const c = Math.cos(lr), s = Math.sin(lr), w = ([gx, gz]) => [L.x + gx*c + gz*s, L.y + gx*s - gz*c];   // group (x, z) -> world (x, y)
      const g = groundUnder(plan.map(w), ...w([ox, oz]));
      if (isFinite(g.lo)) dy = (o.ground === 'max' ? g.hi : g.lo) - top;
    }
    dy -= o.sink !== undefined ? o.sink : (o.ground === 'base' ? 0 : 0.3);
    return {k, P, rin, ox, oz, dy, plan, b};
  }
  // the model's materials: Lambert (+ the landmark shader when u is given); very light untextured parts may glow at night
  function convert(m, u, o){
    const nt = o.night || null, uGlow = u ? Object.assign({}, u, {mode:{value:0}}) : null;
    let n = 0;
    m.traverse(q => {
      if (!q.isMesh) return;
      const om = q.material, map = om.map || null, col = om.color ? om.color.clone() : new THREE.Color(1, 1, 1);
      if (map){ map.encoding = THREE.LinearEncoding; map.anisotropy = 4; map.needsUpdate = true; }
      const mat = new THREE.MeshLambertMaterial({color:col, map, side:om.side !== undefined ? om.side : THREE.FrontSide, vertexColors:!!(q.geometry && q.geometry.attributes.color),
        transparent:!!om.transparent, opacity:om.opacity !== undefined ? om.opacity : 1, alphaTest:om.alphaTest || 0});
      if (u){
        const lum = 0.3*col.r + 0.59*col.g + 0.11*col.b;
        if (nt && !map && lum > (nt.lum || 0.62)) lmShader(mat, uGlow, nt.c || '#f2f6ff', nt.k || 1.0); else lmShader(mat, u, null, 0);
        if (LMCTX) LMCTX.mats.set('glb' + (n++), mat);
      }
      q.material = mat; q.castShadow = true; q.receiveShadow = true;
    });
  }
  const pip = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
  // cut hand-made parts out of a build: triangles whose centre lies inside one of the shapes (group coordinates) and above cutY
  function cutBuild(g, shapes, cutY){
    const keep = new Set((g.userData && g.userData.keep) || []);
    const inside = (x, y, z) => { if (y < cutY) return false; for (const s of shapes){ if (s.poly ? pip(s.poly, x, z) : (x - s.c[0])**2 + (z - s.c[1])**2 < s.r*s.r) return true; } return false; };
    g.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), M = new THREE.Matrix4(), meshes = [];
    const skip = o => { for (let p = o; p && p !== g; p = p.parent) if (keep.has(p)) return true; return false; };
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
      geo.dispose(); o.parent.remove(o);
      if (!P.length) continue;
      const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      if (N.length) ng.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); else ng.computeVertexNormals();
      if (C.length) ng.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      const nm = new THREE.Mesh(ng, o.material); nm.castShadow = o.castShadow; nm.receiveShadow = o.receiveShadow; g.add(nm);
    }
    return cut;
  }
  function padPoly(P, pad){ const cx = P.reduce((s, p) => s + p[0], 0)/P.length, cz = P.reduce((s, p) => s + p[1], 0)/P.length;
    return P.map(([x, z]) => { const dx = x - cx, dz = z - cz, l = Math.hypot(dx, dz) || 1; return [x + dx/l*pad*1.414, z + dz/l*pad*1.414]; }); }

  // ---------------------------------------------------------------- landmarks
  function lmBuild(key, src, oldBuild){
    const M = MODELS[key], o = M.lm;
    return function(){
      const top = LMCTX.u.base.value, L = curL(o.key);
      const g = o.mode === 'add' && oldBuild ? oldBuild.call(this) : new THREE.Group();
      const m = src.clone(true); dropParts(m, o.drop);   // bounds and fit from the model without the dropped parts
      const d = placeData(m, o, L, top), w = new THREE.Group();
      m.position.set(-d.P[0], -d.P[1], -d.P[2]); w.add(m); w.scale.setScalar(d.k); w.rotation.y = d.rin; w.position.set(d.ox, d.dy, d.oz);
      convert(m, LMCTX.u, o);
      if (o.mode === 'add' && o.cut){
        const shapes = o.cut === 'model' ? [{poly:padPoly(d.plan, o.cutPad !== undefined ? o.cutPad : 2)}] : o.cut.map(q => q.c === 'model' ? {c:[d.ox, d.oz], r:q.r} : q);
        S.lm[key + '_cut'] = cutBuild(g, shapes, o.cutY !== undefined ? o.cutY : 1);
      }
      g.add(w); g.userData.keep = ((g.userData && g.userData.keep) || []).concat([w]);
      S.info[key] = {k:+d.k.toFixed(4), rin:+d.rin.toFixed(4), ox:+d.ox.toFixed(2), oz:+d.oz.toFixed(2), dy:+d.dy.toFixed(2), size:[d.b.max.x - d.b.min.x, d.b.max.y - d.b.min.y, d.b.max.z - d.b.min.z].map(v => +(v*d.k).toFixed(2))};
      return g;
    };
  }
  // the hiding hulls of these landmarks are recomputed from their new meshes; tiles under the old and the new hulls are rebuilt
  function refreshHulls(ids){
    try {
      if (!SGR.on || !SGR.hulls) return;
      const set = new Set();
      for (const id of ids){ const H = SGR.hulls.get(id); if (H){ for (const ti of sgrTilesOfBB(H.bb, 10)) set.add(ti); SGR.hulls.delete(id); } }
      if (SGR.tiles && SGR.tiles.size){ for (const H of sgrLandmarkHulls()) for (const ti of sgrTilesOfBB(H.bb, 10)) set.add(ti); if (set.size) sgrQueueTiles(set); }
    } catch (e){ S.err.push('hulls: ' + e); }
  }
  const ORIG = {};
  function swapLandmark(type, build){
    const def = LANDMARKS[type]; if (!def) return false;
    def.build = build; const ids = [];
    for (const L of landmarks) if (L.type === type){
      const g0 = lmMeshes.get(L.id); if (g0){ lmGroup.remove(g0); g0.traverse(o => { if (o.geometry && !o.userData.glb) o.geometry.dispose(); }); lmMeshes.delete(L.id); }
      if (L.mats){ for (const m of L.mats.values()) m.dispose(); L.mats = null; } L.fx = [];
      placeLandmarkMesh(L); ids.push(L.id);
    }
    refreshHulls(ids);
    return true;
  }
  function applyLandmark(key, sc){
    const o = MODELS[key].lm, def = LANDMARKS[o.key]; if (!def) return false;
    if (!ORIG[o.key]) ORIG[o.key] = def.build;
    sc.traverse(q => { if (q.isMesh) q.userData.glb = true; });
    const ok = swapLandmark(o.key, lmBuild(key, sc, ORIG[o.key]));
    S.lm[key] = ok ? 1 : 0;
    return ok;
  }
  // PHASE 2 tuning: GBM.tune('pingan', {bearing:45}) changes the transform data and rebuilds; GBM.restore(key) puts the hand-made build back
  S.tune = (key, patch) => { const M = MODELS[key]; if (!M) return Promise.resolve(false); const o = M.lm || M.place; if (!o) return Promise.resolve(false); Object.assign(o, patch || {});
    return load(key).then(sc => M.lm ? applyLandmark(key, sc) : placeModel(key, sc)).catch(e => { S.err.push(key + ': ' + e); return false; }); };
  S.restore = key => { const M = MODELS[key]; if (!M) return false;
    if (M.place){ unplace(key); return true; }
    if (!M.lm || !ORIG[M.lm.key]) return false; const ok = swapLandmark(M.lm.key, ORIG[M.lm.key]); S.lm[key] = 0; return ok; };

  // ---------------------------------------------------------------- free-standing models: a model at lat / lon
  const group = new THREE.Group(); group.name = 'gbmodels'; scene.add(group); S.group = group;
  const discs = new Map();   // key -> SGR.discs entry hiding the real buildings under a placed model
  function pushDiscs(){ try { if (!SGR.discs) return; for (const d of discs.values()) if (!SGR.discs.includes(d)) SGR.discs.push(d); } catch (e){ } }
  HOOKS.net.push(pushDiscs);   // the network build resets SGR.discs
  function requeue(x, y, r){ try { if (SGR.on && SGR.tiles && SGR.tiles.size) sgrQueueTiles(sgrTilesOfBB([x - r, y - r, x + r, y + r], 10)); } catch (e){ S.err.push('requeue: ' + e); } }
  function unplace(key){
    const P = S.placed[key]; if (!P) return;
    group.remove(P.w); delete S.placed[key];
    const d = discs.get(key); if (d){ discs.delete(key); try { const i = SGR.discs.indexOf(d); if (i >= 0) SGR.discs.splice(i, 1); } catch (e){ } requeue(d.x, d.y, d.r); }
  }
  // Generic placement: o = {at:[lat, lon], fit:{h | len | s}, bearing + front | rot, pivot, ground:'min'|'max'|'centre'|number, sink,
  // hide:r, hideH, drop, night}. Returns the wrapper group (or null when the point is outside the square).
  function placeModel(key, src, opt){
    const M = MODELS[key] || {}, o = Object.assign({}, M.place || {}, opt || {});
    if (!o.at) throw new Error(key + ': no position');
    const [x, y] = sgXY(o.at[0], o.at[1]);
    if (!inSquare(x, y)){ S.info[key] = {outside:true}; return null; }
    unplace(key);
    const m = src.clone(true); dropParts(m, o.drop);
    const {b, P, k} = fitData(m, o), r = worldRot(o) || 0;
    // the plan in the world: the model group turns by r about +y; group (x, z) -> world (x, -z)
    const plan = planOf(b, P, k, r, 0, 0).map(([px, pz]) => [x + px, y - pz]);
    const g = groundUnder(plan, x, y);
    let gy = typeof o.ground === 'number' ? o.ground : o.ground === 'max' ? g.hi : o.ground === 'centre' ? g.c : g.lo;
    gy -= o.sink !== undefined ? o.sink : 0.3;
    const w = new THREE.Group(); m.position.set(-P[0], -P[1], -P[2]); w.add(m); w.scale.setScalar(k); w.rotation.y = r; w.position.set(x, gy, -y);
    w.name = 'gbm_' + key; convert(m, null, o); group.add(w);
    let hidden = false;
    if (o.hide > 0){ const d = {x, y, r:o.hide, t:-1}; if (o.hideH) d.h = o.hideH; discs.set(key, d); pushDiscs(); requeue(x, y, o.hide); try { hidden = SGR.discs.includes(d); } catch (e){ } }
    S.placed[key] = {w, x, y, gy, k, r};
    S.info[key] = {hidden, k:+k.toFixed(4), rot:+r.toFixed(4), x:+x.toFixed(1), y:+y.toFixed(1), ground:+gy.toFixed(2), size:[b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z].map(v => +(v*k).toFixed(2))};
    return w;
  }
  S.place = (key, opt) => load(key).then(sc => placeModel(key, sc, opt)).catch(e => { S.err.push(key + ': ' + e); return null; });
  S.unplace = unplace;
  S.ll2world = (lat, lon) => { const [x, y] = sgXY(lat, lon); return {x, y, ground:hC(x, y), inSquare:inSquare(x, y)}; };

  // ---------------------------------------------------------------- vehicles: glTF -> traffic geometry (as sgreal/zz_models)
  function texSampler(map){
    const im = map && map.image; if (!im || !im.width) return null;
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0); const d = cx.getImageData(0, 0, im.width, im.height).data, W = im.width, H = im.height;
    return (u, v) => { u = u - Math.floor(u); v = v - Math.floor(v); const x = Math.min(W - 1, Math.floor(u*W)), y = Math.min(H - 1, Math.floor(v*H)), i = (y*W + x)*4; return [d[i]/255, d[i + 1]/255, d[i + 2]/255]; };
  }
  // o: {dims:[length (x), width (z), height (y)], kind, len:'z'|'x', front:+1|-1, pick, paint:/material name/}; the result is in the
  // traffic format (position, normal, color, aPaint, aLight; x forward, y up, origin on the ground at the centre; real metres)
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
    let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++){ mn[k] = Math.min(mn[k], P[i + k]); mx[k] = Math.max(mx[k], P[i + k]); }
    const lz = (o.len || 'z') === 'z', fr = o.front === -1 ? -1 : 1, cx = (mn[0] + mx[0])/2, cz = (mn[2] + mx[2])/2;
    const sL = lz ? mx[2] - mn[2] : mx[0] - mn[0], sW = lz ? mx[0] - mn[0] : mx[2] - mn[2], sy = mx[1] - mn[1];
    const kL = dims[0]/sL, kW = dims[1]/sW, kH = dims[2]/sy;
    const map = (x, y, z) => lz ? [fr*(z - cz)*kL, (y - mn[1])*kH, -fr*(x - cx)*kW] : [fr*(x - cx)*kL, (y - mn[1])*kH, fr*(z - cz)*kW];
    const mapN = (x, y, z) => { const r = lz ? [fr*z/kL, y/kH, -fr*x/kW] : [fr*x/kL, y/kH, fr*z/kW], l = Math.hypot(r[0], r[1], r[2]) || 1; return [r[0]/l, r[1]/l, r[2]/l]; };
    const P2 = new Float32Array(P.length), N2 = new Float32Array(N.length);
    for (let i = 0; i < P.length; i += 3){ const a = map(P[i], P[i + 1], P[i + 2]), b = mapN(N[i], N[i + 1], N[i + 2]); P2.set(a, i); N2.set(b, i); }
    const nT = P2.length/9, paintT = new Uint8Array(nT);
    if (o.paint instanceof RegExp){ for (let t = 0; t < nT; t++) if (o.paint.test(mats[MI[t*3]].name || '')) paintT[t] = 1; }
    for (let t = 0; t < nT; t++) if (paintT[t]) for (let j = 0; j < 3; j++){ const i = (t*3 + j)*3; const l = Math.max(C[i], C[i + 1], C[i + 2]) || 1; C[i] = C[i + 1] = C[i + 2] = Math.min(1, 0.55 + 0.45*l); PA[t*3 + j] = 1; }
    // lamps (an estimate): per triangle, by facing, height and colour
    const half = dims[0]/2;
    for (let t = 0; t < nT; t++){
      if (paintT[t]) continue;
      let ax = 0, ay = 0, cr = 0, cg = 0, cb = 0, fx = 0, fy = 0, fz = 0;
      for (let j = 0; j < 3; j++){ const i = t*9 + j*3; ax += P2[i]/3; ay += P2[i + 1]/3; cr += C[i]/3; cg += C[i + 1]/3; cb += C[i + 2]/3; fx += N2[i]/3; fy += N2[i + 1]/3; fz += N2[i + 2]/3; }
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
    if (!T || !T.swapModel){ S.info.veh = 'no SGTraffic.swapModel in this build'; return false; }
    if (!o.kind || !o.dims) return false;
    const ok = T.swapModel(o.kind, vehGeo(sc, o));
    S.veh[o.kind] = ok ? key : 0;
    return ok;
  }

  // PHASE 2 helpers: the landmark group of a key (to inspect the swapped model), and a camera move to look at a point
  S.meshOf = type => { const L = landmarks.find(q => q.type === type); return L ? lmMeshes.get(L.id) || null : null; };
  S.look = (lat, lon, dx, dy, dz) => { const [x, y] = sgXY(lat, lon), h = hC(x, y); camera.position.set(x + (dx || -600), h + (dy || 400), -y + (dz || 700)); controls.target.set(x, h, -y); controls.update(); };
  // test hook: apply a scene that is already in memory as model key
  S.apply = (key, sc) => { const M = MODELS[key]; if (!M) return false; return M.lm ? applyLandmark(key, sc) : M.place ? placeModel(key, sc) : M.veh ? applyVehicle(key, sc) : false; };
  // credits: the models in use (title, author, licence, link); they also belong in README / DATA_LICENSE
  S.credits = () => Object.keys(MODELS).filter(k => S.lm[k] || S.placed[k] || Object.values(S.veh).includes(k)).map(k => { const M = MODELS[k]; return {title:M.title, author:M.author, licence:M.licence, url:M.url}; });

  // ---------------------------------------------------------------- start
  const ready = () => { try { return isGBA() && SGR.on && SGR.tiles && SGR.tiles.size > 0 && landmarks.length > 20 && lmMeshes.size > 20; } catch (e){ return false; } };
  let tries = 0;
  function tick(){
    try { if (typeof SGR_PATH !== 'undefined' && !isGBA()){ S.state = 'off'; return; } } catch (e){ }
    if (!ready()){ if (++tries > 600){ S.state = 'timeout'; return; } setTimeout(tick, 700); return; }
    if (!THREE.GLTFLoader){ S.state = 'no-loader'; return; }
    S.state = 'loading';
    const jobs = [];
    for (const key of Object.keys(MODELS)){
      const M = MODELS[key]; if (M.todo || M.outside) continue;
      if (M.lm){ if (!LANDMARKS[M.lm.key]) continue; jobs.push(load(key).then(sc => applyLandmark(key, sc)).catch(e => S.err.push(key + ': ' + e))); }
      else if (M.place){ jobs.push(load(key).then(sc => placeModel(key, sc)).catch(e => S.err.push(key + ': ' + e))); }
      else if (M.veh){ const T = window.SGTraffic; if (!T || !T.swapModel){ S.info.veh = 'no SGTraffic.swapModel in this build'; continue; } jobs.push(load(key).then(sc => applyVehicle(key, sc)).catch(e => S.err.push(key + ': ' + e))); }
    }
    Promise.all(jobs).then(() => { S.state = 'done'; });
  }
  setTimeout(tick, 2500);
})();
