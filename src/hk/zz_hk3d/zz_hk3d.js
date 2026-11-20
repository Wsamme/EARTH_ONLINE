// ===== v42 · hk/zz_hk3d — Hong Kong's buildings from the official 3D map =====
// Every building of 100 m or more in Central, Sheung Wan, Admiralty, Wan Chai, Causeway Bay, Tsim Sha Tsui, Mong Kok and West
// Kowloon (49 map sheets), plus the podiums and parts of the hand-made complexes they replace, from the Lands Department's
// "3D Visualisation Map (Non-textured models)" (glTF, HK1980 Grid; 3d.map.gov.hk / CSDI portal). Geometry is simplified
// (about 9 triangles per metre of height) and packed into hkdata/hk3d.bin by hk/zz_hk3d/tools/build3d.py.
// Source: HKSAR Government, Lands Department (3D Visualisation Map; Building dataset for names, via DATA.GOV.HK); free use with attribution. The models carry no colour: the facade tones below are
// approximations (glass tones for towers of 150 m or more, concrete tones below), not data.
// Loading: after the city's landmarks are placed, the file is fetched; each building replaces the hand-made model whose anchor it
// contains (the landmark keeps its name, card and night-light mode) or is added as a new landmark named from LandsD data; hand-made parts inside
// it are emptied. The model's bottom is put on the lowest ground under its footprint. Phones load only named and very tall ones.
// Loads last (zz_): it may override keys defined by the other modules. Test handle: window.HK3D.
(() => {
  const S = {state:'wait', n:0, rep:0, hidden:0, added:0, ms:0, err:null};
  if (typeof window !== 'undefined') window.HK3D = S;
  const PAL_HI = ['#8fa4b4', '#7e95a8', '#9aabb6', '#a7b4bc', '#6f8799', '#b3bec4'];
  const PAL_LO = ['#d2cdc2', '#c7c9c6', '#d9d1bf', '#bdbfbd', '#cfc6b4', '#c4c0b6', '#dad7cf'];
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
      const list = J.b.filter(e => !mob || e.rep.length || e.h >= 180);
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
    const spec = {c:pal[hs % pal.length], lk:hi ? 0.5 : 0.4};
    const build = () => {
      const g = new THREE.Group(), geo = geoOf(e, buf, off0, q), top = LMCTX.u.base.value, P = geo.attributes.position.array;
      // lowest ground under the footprint (vertices in the lowest 3 m), so the model stands on the street, not on the hillside
      let gmin = Infinity; for (let i = 0; i < P.length; i += 3*Math.max(1, Math.floor(P.length/3/48))) if (P[i+1] < 3) gmin = Math.min(gmin, hC(x + P[i], y - P[i+2]));
      const dy = isFinite(gmin) ? Math.min(0, gmin - top + 0.3) : 0;
      lmAdd(g, geo, spec, 0, dy, 0); return g; };
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
