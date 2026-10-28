// szeast test add-on (copied from gba/szoct/tools/sitekit.js) for the Greater Bay in-situ kit: builds one SITE (&site=key) like the app's placeSites() (ctx.gy = hC, paint /
// line draped meshes, ctx.tree instanced, ctx.lamp points), hides the real buildings whose centroid is inside its keep, and
// pushes a tiny probe landmark at the site anchor so the kit centres the terrain and streams the real city there.
// Load order in m=: ../../../gba/szoct/szoct.js,../../../sgreal/mod_roads/roads.js,../../../sgreal/mod_bld/bld.js,insitu.js,../../../gba/szoct/tools/sitekit.js
(() => {
  const q = new URLSearchParams(location.search), key = q.get('site'); if (!key) return;
  const S = SITES[key]; if (!S){ console.error('no site ' + key); return; }
  LANDMARKS.szeast_probe = {zh:'probe', en:'probe', cat:'new', r:2, h:1, build(){ const g = new THREE.Group(); LBox(g, 0.2, 0.2, 0.2, 0, -5, 0, '#888'); return g; }};
  SG_PLACES.push({type:'szeast_probe', lat:S.lat, lon:S.lon, rot:0});
  const pip = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0])*(y - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
  const [ax, ay] = sgXY(S.lat, S.lon);
  const keepW = S.keep ? S.keep.map(p => [ax + p[0], ay - p[1]]) : (() => { const P = []; for (let i = 0; i < 48; i++){ const a = i/48*Math.PI*2; P.push([ax + Math.cos(a)*S.r, ay + Math.sin(a)*S.r]); } return P; })();
  const bt = SGBld.buildTile; let hid = 0;
  SGBld.buildTile = (ti, list, opts) => { const sk = opts && opts.skip; return bt(ti, list, Object.assign({}, opts, {skip:b => { if (pip(keepW, b.cx, b.cy)){ hid++; return true; } return sk ? sk(b) : false; }})); };
  const orig = window.MODULE_INIT;
  window.MODULE_INIT = async ENV => {
    await orig(ENV);
    const T0 = performance.now(), rng = mulberry32(0x5173 + 977), trees = [], lamps = [], lc = [], paints = [];
    const ctx = {gy:(x, z) => hC(ax + x, ay - z), paint:(P, rgb) => paints.push({P, rgb}), line:(L, w, rgb) => paints.push({L, w, rgb}), tree:(x, z, s, k) => trees.push([x, z, s || 3, k || 'd']), lamp:(x, y, z, rgb) => { lamps.push(x, y, z); lc.push(rgb[0]/255, rgb[1]/255, rgb[2]/255); }, rng};
    let lo = Infinity, hi = -Infinity; for (const p of keepW.concat([[ax, ay]])){ const h = hC(p[0], p[1]); lo = Math.min(lo, h); hi = Math.max(hi, h); }
    const lt = S.lt || {m:1, c:'#dfe8f5', k:0.6};
    LMCTX = {mats:new Map(), fx:[], rng, u:{base:{value:lo}, top:{value:hi + (S.h || 60)}, col:{value:new THREE.Color(lt.c)}, k:{value:lt.k}, mode:{value:lt.m}, even:{value:lt.e || 0}, anim:{value:0}, col2:{value:new THREE.Color(lt.c2 || '#8fd8ff')}, ph:{value:0.3}}};
    let g; try { g = S.build(ctx); } catch (e){ console.error('site build ' + key, e && e.stack); LMCTX = null; return; }
    let tris = 0, calls = 0; g.traverse(o => { if (o.isMesh){ calls++; const a = o.geometry.attributes.position; tris += (o.geometry.index ? o.geometry.index.count : a.count)/3; } });
    lmMerge(g); LMCTX = null; const ms = performance.now() - T0;
    g.position.set(ax, 0, -ay); ENV.scene.add(g);
    // ground paint: draped flat meshes slightly above the terrain
    const pg = new THREE.Group(); pg.position.set(ax, 0, -ay); ENV.scene.add(pg);
    for (const p of paints){
      let poly = p.P; if (!poly){ const L = p.L, w = p.w/2, Lf = [], Rt = []; for (let i = 0; i < L.length; i++){ const a = L[Math.max(0, i - 1)], b = L[Math.min(L.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz) || 1; Lf.push([L[i][0] - dz/d*w, L[i][1] + dx/d*w]); Rt.push([L[i][0] + dz/d*w, L[i][1] - dx/d*w]); }
        const pos = []; for (let i = 0; i < L.length - 1; i++){ const A = Lf[i], Bq = Lf[i+1], C = Rt[i+1], E = Rt[i]; for (const v of [A, Bq, C, A, C, E]) pos.push(v[0], ctx.gy(v[0], v[1]) + 0.35, v[1]); }
        const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.computeVertexNormals(); pg.add(new THREE.Mesh(ge, new THREE.MeshLambertMaterial({color:new THREE.Color(p.rgb[0]/255, p.rgb[1]/255, p.rgb[2]/255), side:THREE.DoubleSide, polygonOffset:true, polygonOffsetFactor:-3}))); continue; }
      const tri = THREE.ShapeUtils.triangulateShape(poly.map(v => new THREE.Vector2(v[0], v[1])), []), pos = [];
      for (const t of tri) for (const i of t) pos.push(poly[i][0], ctx.gy(poly[i][0], poly[i][1]) + 0.3, poly[i][1]);
      const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.computeVertexNormals();
      pg.add(new THREE.Mesh(ge, new THREE.MeshLambertMaterial({color:new THREE.Color(p.rgb[0]/255, p.rgb[1]/255, p.rgb[2]/255), side:THREE.DoubleSide, polygonOffset:true, polygonOffsetFactor:-2})));
    }
    if (trees.length){ const geo = new THREE.ConeGeometry(1, 1, 6); geo.translate(0, 0.5, 0); const im = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({color:0x5e7f48}), trees.length), m = new THREE.Matrix4();
      trees.forEach((t, i) => { const s = t[2], y = ctx.gy(t[0], t[1]); m.makeScale(s, s*(t[3] === 'palm' ? 3.2 : 2.4), s); m.setPosition(t[0], y + s*0.6, t[1]); im.setMatrixAt(i, m); }); pg.add(im); }
    if (lamps.length){ const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(lamps, 3)); ge.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3));
      const pm = new THREE.Points(ge, new THREE.PointsMaterial({size:3, vertexColors:true, sizeAttenuation:true, transparent:true, depthWrite:false})); pg.add(pm); window.__lampMat = pm.material; }
    let rmax = 0; g.traverse(o => { if (o.isMesh){ const a = o.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) rmax = Math.max(rmax, Math.hypot(a[i], a[i+2])); } });
    console.log('[log] site', key, JSON.stringify({ms:Math.round(ms), tris:Math.round(tris), parts:calls, mats:'', rmax:Math.round(rmax), r:S.r, trees:trees.length, lamps:lamps.length/3, paints:paints.length, hiddenReal:hid}));
    const ov = window.onView; window.onView = v => { if (window.__lampMat) window.__lampMat.opacity = v.night ? 0.95 : 0; pg.children.forEach(o => { if (o.isMesh && o.material.color && !o.isInstancedMesh) o.material.emissive && o.material.emissive.setScalar(0); }); if (ov) ov(v); };
  };
})();
