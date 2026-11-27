// ===== v48 · hk/zz_tex — Hong Kong buildings with photo textures (Lands Department, 3D Visualisation Map: Individualised models) =====
// Source: HKSAR Government, Lands Department, Open3Dhk (https://3d.map.gov.hk/), Download API, GLTF, one 1:1000 map sheet per
// zip. Free use including commercial, on condition that the Government and the website are credited as the source and the
// Government's ownership of the data is acknowledged (credit on the map: patch_hk.py). Only the BUILDING models are used.
// Prepared on the owner's Mac (tools/conv.py, tools/pack.mjs): WebP textures (1024 px for towers of 150 m or more, 512 px from
// 40 m, 256 px below), quantised and lightly simplified meshes, one GLB per sheet with each building's translation relative to
// the sheet origin; tools/manifest.py writes hkdata/tex/<sheet>.json (origin as lat / lon, per building: page x, y, a hiding
// radius, height). hkdata/tex/sheets.json lists the sheets.
// Streaming: the sheets whose box is within 2.5 km of the camera target are loaded one at a time, nearest first; sheets beyond
// 4.5 km are dropped. Each building is set down on the page's terrain (its base on the lowest ground under its box). The map
// footprints under it are hidden (SGR.discs), and a hand-made landmark whose anchor lies inside an official building is hidden
// too (its name label stays): the photo-textured model is the real building. At night the darker (glass) parts of the photo
// facades get a lit-window pattern: an estimate, like the procedural buildings. Phones skip this (data size). Test handle: HKT.
(() => {
  const S = {state:'wait', loaded:{}, loading:null, err:[], sheets:[], hidLm:new Set()};
  window.HKT = S;
  if (typeof window !== 'undefined' && window.CB_MOBILE){ S.state = 'phone'; return; }
  const base = () => { try { return SGR_PATH + 'tex/'; } catch (e){ return 'hkdata/tex/'; } };
  const group = new THREE.Group(); group.name = 'hktex'; S.group = group;
  const NEAR = 2500, FAR = 4500;
  function dequant(root){
    root.traverse(o => { if (!o.isMesh) return; const g = o.geometry;
      for (const name of Object.keys(g.attributes)){ const a = g.attributes[name]; if (!a.normalized || a.array instanceof Float32Array) continue;
        const A = a.array, k = A instanceof Int8Array ? 127 : A instanceof Uint8Array ? 255 : A instanceof Int16Array ? 32767 : A instanceof Uint16Array ? 65535 : 1;
        const F = new Float32Array(A.length); for (let i = 0; i < A.length; i++) F[i] = Math.max(-1, A[i]/k);
        g.setAttribute(name, new THREE.BufferAttribute(F, a.itemSize, false)); } });
  }
  const NIGHTU = () => (typeof NIGHT !== 'undefined' && NIGHT.uNight) ? NIGHT.uNight : {value:0};
  function texMat(om){
    const map = om.map || null; if (map){ map.encoding = THREE.LinearEncoding; map.anisotropy = 4; map.needsUpdate = true; }
    const m = new THREE.MeshLambertMaterial({color:om.color ? om.color.clone() : new THREE.Color(1, 1, 1), map, side:THREE.FrontSide});
    m.onBeforeCompile = sh => {
      sh.uniforms.uNt = NIGHTU();
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPt;\nvarying vec3 vWNt;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPt = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWNt = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPt;\nvarying vec3 vWNt;\nuniform float uNt;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  { vec3 n = normalize(vWNt); float side = 1.0 - step(0.5, abs(n.y)); float l = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
    float fl = floor(vWPt.y/3.3); float hz = abs(n.x) > abs(n.z) ? vWPt.z : vWPt.x; float cl = floor(hz/2.2);
    float r = fract(sin(fl*12.9898 + cl*78.233)*43758.5453);
    float on = step(r, 0.5)*step(0.25, fract(vWPt.y/3.3))*step(0.2, fract(hz/2.2));
    totalEmissiveRadiance += (vec3(1.0, 0.84, 0.6)*on*side*smoothstep(0.5, 0.15, l)*0.9 + diffuseColor.rgb*0.05)*uNt; }`);
    };
    return m;
  }
  // hiding the map footprints under the official buildings: SGR.discs is rebuilt with the network, so ours are put back
  const discs = [];
  function ensureDiscs(){ try { if (!SGR.discs) return; for (const d of discs) if (!SGR.discs.includes(d)) SGR.discs.push(d); } catch (e){ } }
  function requeue(bb){ try { sgrQueueTiles(sgrTilesOfBB([bb[0] - 60, bb[1] - 60, bb[2] + 60, bb[3] + 60], 10)); } catch (e){ } }
  function hideLandmarks(){
    try { for (const L of landmarks){ const g = lmMeshes.get(L.id); if (!g) continue; let inside = false;
        for (const k in S.loaded){ const M = S.loaded[k].M; if (L.x < M.bb[0] - 60 || L.x > M.bb[2] + 60 || L.y < M.bb[1] - 60 || L.y > M.bb[3] + 60) continue;
          for (const b of M.b) if ((L.x - b[1])*(L.x - b[1]) + (L.y - b[2])*(L.y - b[2]) < b[3]*b[3]){ inside = true; break; } if (inside) break; }
        if (inside && g.visible){ g.visible = false; S.hidLm.add(L.id); } else if (!inside && S.hidLm.has(L.id)){ g.visible = true; S.hidLm.delete(L.id); } } } catch (e){ }
  }
  function loadSheet(M){
    S.loading = M.sheet;
    return new Promise(res => {
      new THREE.GLTFLoader().load(base() + M.sheet + '.glb', gl => {
        const sc = gl.scene; dequant(sc);
        const g = new THREE.Group(); g.position.set(M.x0, 0, -M.y0); g.add(sc); group.add(g); g.updateMatrixWorld(true);
        sc.traverse(o => { if (o.isMesh){ o.material = texMat(o.material); o.castShadow = true; o.receiveShadow = true; } });
        const box = new THREE.Box3();
        for (const n of sc.children){ box.setFromObject(n); if (box.isEmpty()) continue;
          let gmin = Infinity; const xs = [box.min.x, (box.min.x + box.max.x)/2, box.max.x], zs = [box.min.z, (box.min.z + box.max.z)/2, box.max.z];
          for (const x of xs) for (const z of zs){ try { gmin = Math.min(gmin, hC(x, -z)); } catch (e){ } }
          if (isFinite(gmin)) n.position.y += gmin - box.min.y - 0.3; }
        for (const b of M.b) discs.push({x:b[1], y:b[2], r:b[3], t:-1, h:1e9, tex:M.sheet});
        ensureDiscs(); requeue(M.bb);
        S.loaded[M.sheet] = {M, g}; S.loading = null; hideLandmarks(); res(true);
      }, undefined, e => { S.err.push(M.sheet + ': ' + e); S.loading = null; S.bad = S.bad || {}; S.bad[M.sheet] = 1; res(false); });
    });
  }
  function dropSheet(k){
    const E = S.loaded[k]; if (!E) return;
    group.remove(E.g); E.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material){ if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    for (let i = discs.length - 1; i >= 0; i--) if (discs[i].tex === k){ const j = SGR.discs ? SGR.discs.indexOf(discs[i]) : -1; if (j >= 0) SGR.discs.splice(j, 1); discs.splice(i, 1); }
    delete S.loaded[k]; requeue(E.M.bb); hideLandmarks();
  }
  const dist = (M, x, y) => Math.hypot(Math.max(M.bb[0] - x, 0, x - M.bb[2]), Math.max(M.bb[1] - y, 0, y - M.bb[3]));
  function stream(){
    try {
      ensureDiscs(); if (S.hidLm.size || Object.keys(S.loaded).length) hideLandmarks();
      const tx = controls.target.x, ty = -controls.target.z;
      for (const k in S.loaded) if (dist(S.loaded[k].M, tx, ty) > FAR) dropSheet(k);
      if (!S.loading){ let best = null, bd = 1e18;
        for (const M of S.sheets){ if (S.loaded[M.sheet] || (S.bad && S.bad[M.sheet])) continue; const d = dist(M, tx, ty); if (d < NEAR && d < bd){ bd = d; best = M; } }
        if (best) loadSheet(best); }
      S.state = 'stream';
    } catch (e){ S.err.push(String(e)); }
  }
  const ready = () => { try { return SGR.on && landmarks.length > 20 && lmMeshes.size > 20 && !!THREE.GLTFLoader; } catch (e){ return false; } };
  let tries = 0;
  async function start(){
    if (!ready()){ if (++tries > 400){ S.state = 'timeout'; return; } setTimeout(start, 700); return; }
    try {
      const r = await fetch(base() + 'sheets.json'); if (!r.ok){ S.state = 'nofile'; return; }
      const list = await r.json();
      const only = (location.search.match(/[?&]tex=([^&]+)/) || [])[1]; if (only === 'off'){ S.state = 'off'; return; }
      for (const k of list.sheets){ if (only && !only.split(',').includes(k)) continue; const q = await fetch(base() + k + '.json'); if (q.ok) S.sheets.push(await q.json()); }
      scene.add(group); S.state = 'stream'; stream(); setInterval(stream, 1500);
    } catch (e){ S.state = 'error'; S.err.push(String(e)); }
  }
  setTimeout(start, 3000);
})();
