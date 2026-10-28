// GENERATED from hkreal/kit/insitu.js for the Greater Bay map (adapted copy, 2026-10-28): data from gbareal/out.
// In-situ landmark harness: the real map (terrain, water, real roads and buildings) around one or more Hong Kong landmarks,
// placed exactly like the app does (SG_PLACES lat/lon/rot, base on the highest ground within r, real buildings under the
// model's ground plan hidden). URL: insitu.html?m=<your landmark file>,../mod_roads/roads.js,../mod_bld/bld.js,insitu.js&k=key1,key2[&r=1600]
(() => {
  const q = new URLSearchParams(location.search);
  const focus = (q.get('k') || '').split(',').filter(Boolean), RAD = +(q.get('r') || 1500);
  const pip = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0])*(y - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
  const hull = pts => { pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0])*(b[1] - o[1]) - (a[1] - o[1])*(b[0] - o[0]), lo = [], up = [];
    for (const p of pts){ while (lo.length >= 2 && cr(lo[lo.length-2], lo[lo.length-1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--){ const p = pts[i]; while (up.length >= 2 && cr(up[up.length-2], up[up.length-1], p) <= 0) up.pop(); up.push(p); } up.pop(); lo.pop(); return lo.concat(up); };
  window.MODULE_INIT = async ENV => {
    const log = (...a) => console.log('[log]', ...a);
    const PL = new Map(); for (const p of SG_PLACES) PL.set(p.type, p);          // the last placement of a type wins (upgrades override)
    const fp = focus.map(k => PL.get(k)).filter(Boolean);
    if (!fp.length) throw new Error('no SG_PLACES entry for k=' + focus.join(','));
    const C = fp.map(p => sgXY(p.lat, p.lon)), near = (x, y, r) => C.some(c => Math.hypot(c[0] - x, c[1] - y) < r);
    const lmg = new THREE.Group(); ENV.scene.add(lmg);
    const hulls = []; window.LM = {};
    let id = 1;
    for (const p of PL.values()){
      const [x, y] = sgXY(p.lat, p.lon), def = LANDMARKS[p.type]; if (!def || !near(x, y, RAD)) continue;
      let hi = -Infinity; for (let a = 0; a < 12; a++) for (const f of [0, 0.35, 0.7]){ const h = hC(x + Math.cos(a/12*Math.PI*2)*def.r*f, y + Math.sin(a/12*Math.PI*2)*def.r*f); hi = Math.max(hi, h); }
      const top = hi + 0.6, lt = def.lt || (def.cat === 'new' ? {m:1, c:'#d6e4ff', k:0.6} : {m:0, c:'#ffc98a', k:0.9});
      LMCTX = {mats:new Map(), fx:[], rng:mulberry32(id*7919 + 13), u:{base:{value:top}, top:{value:top + def.h}, col:{value:new THREE.Color(lt.c)}, k:{value:lt.k}, mode:{value:lt.m}, even:{value:lt.e || 0}}};
      const t0 = performance.now(); let g;
      try { g = def.build(); } catch (e){ console.error('build ' + p.type, e); LMCTX = null; continue; }
      let tris = 0; g.traverse(o => { if (o.isMesh){ const a = o.geometry.attributes.position; tris += (o.geometry.index ? o.geometry.index.count : a.count)/3; } });
      lmMerge(g); LMCTX = null; const ms = performance.now() - t0;
      g.position.set(x, top, -y); g.rotation.y = p.rot || 0; lmg.add(g); g.updateMatrixWorld(true);
      const pts = [], v = new THREE.Vector3(); let rmax = 0;
      g.traverse(o => { if (!o.isMesh || !o.geometry.attributes.position) return; const a = o.geometry.attributes.position, st = Math.max(1, Math.floor(a.count/6000));
        for (let i = 0; i < a.count; i += st){ v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld); rmax = Math.max(rmax, Math.hypot(v.x - x, -v.z - y)); if (v.y - top < 25) pts.push([v.x, -v.z]); } });
      let H = hull(pts); if (H.length >= 3){ let cx = 0, cy = 0; for (const h of H){ cx += h[0]; cy += h[1]; } cx /= H.length; cy /= H.length; H = H.map(h => { const dx = h[0] - cx, dy = h[1] - cy, d = Math.hypot(dx, dy) || 1; return [h[0] + dx/d*3, h[1] + dy/d*3]; }); }
      const bb = [Math.min(...H.map(h => h[0])), Math.min(...H.map(h => h[1])), Math.max(...H.map(h => h[0])), Math.max(...H.map(h => h[1]))];
      hulls.push({type:p.type, P:H, bb}); LM[p.type] = {x, y, top, r:def.r, h:def.h, rot:p.rot || 0, hull:H, ms:Math.round(ms), tris:Math.round(tris), rmax:Math.round(rmax), lat:p.lat, lon:p.lon};
      if (focus.includes(p.type)) log(p.type, JSON.stringify({ms:Math.round(ms), tris:Math.round(tris), rmax:Math.round(rmax), r:def.r, h:def.h, top:+top.toFixed(1)}));
      id++;
    }
    // the real city around it
    const B = ENV.BASE, lines = [];
    if (B.roadChunks){   // since 28 Oct 06:14 the roads come in 8 km chunks (base.roadChunks, gba_rc<k>.bin.gz; gbareal/tools/rc_app.js)
      const ch = B.roadChunks.filter(Ck => C.some(c => Math.hypot(Math.max(0, Ck.bb[0] - c[0], c[0] - Ck.bb[2]), Math.max(0, Ck.bb[1] - c[1], c[1] - Ck.bb[3])) < RAD + 2500));
      for (const Ck of ch) for (const l of SGRoads.decode(await ENV.loadBin('../../out/gba_rc' + Ck.k + '.bin.gz'), B.names, B.refs)) lines.push(l);
      log('road chunks', ch.length, 'lines', lines.length);
    } else for (const l of SGRoads.decode(await ENV.loadBin('../../out/gba_roads.bin.gz'), B.names, B.refs)) lines.push(l);
    const bd = SGBld.decode(await ENV.loadBin('../../out/gba_bld0.bin.gz'));
    for (let k = 1; k <= (B.bldParts || 0); k++) bd.addPart(k, await ENV.loadBin('../../out/gba_bld' + k + '.bin.gz'));
    const T = B.TILE, TX = Math.round(2*HALF/T), only = new Set();
    for (let ty = 0; ty < TX; ty++) for (let tx = 0; tx < TX; tx++){ const cx = -HALF + (tx + 0.5)*T, cy = -HALF + (ty + 0.5)*T; if (near(cx, cy, RAD + 1500)) only.add(ty*TX + tx); }
    const inHull = B2 => { for (const h of hulls){ const b = h.bb; if (B2.cx < b[0] || B2.cx > b[2] || B2.cy < b[1] || B2.cy > b[3]) continue; if (pip(h.P, B2.cx, B2.cy)) return h; const R = B2.rings[0], n = R.length/2; let k = 0; for (let i = 0; i < n; i++) if (pip(h.P, R[2*i], R[2*i+1])) k++; if (k*2 > n) return h; } return null; };
    window.REAL = []; // real footprints near the focus, for the overlay
    for (const ti of only){
      const big = bd.big(ti); if (!big) continue; const list = big.concat(bd.small(ti) || []);
      for (const b of list) if (near(b.cx, b.cy, 700)) REAL.push({rings:b.rings, h:b.h, hidden:!!inHull(b), cx:b.cx, cy:b.cy});
      const r = SGBld.buildTile(ti, list, {skip:b => !!inHull(b)}); ENV.scene.add(r.group);
    }
    SGRoads.setStructSkip((x, y) => { for (const h of hulls){ const b = h.bb; if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue; if (pip(h.P, x, y)) return true; } return false; });
    const rr = SGRoads.build(lines, {only}); for (const t of rr.tiles.values()) for (const k of ['major', 'minor', 'paths']) if (t[k]) ENV.scene.add(t[k]);
    // real buildings that cut into a focus model without being hidden (partly inside its ground plan)
    for (const k of focus){ const L = LM[k]; if (!L) continue; const clash = [];
      for (const b of REAL){ if (b.hidden) continue; const R = b.rings[0], n = R.length/2; let c = 0; for (let i = 0; i < n; i++) if (pip(L.hull, R[2*i], R[2*i+1])) c++; if (c) clash.push({h:b.h, verts:n, inside:c, at:[Math.round(b.cx - L.x), Math.round(L.y - b.cy)]}); }
      log(k, 'hidden real buildings', REAL.filter(b => b.hidden && Math.hypot(b.cx - L.x, b.cy - L.y) < L.r*1.6).length, 'clashing (not hidden, partly inside the plan):', JSON.stringify(clash.slice(0, 12)));
    }
  };
  // 2-D plan overlay: real footprints (grey, hidden ones red), the model's ground plan hull (blue), model vertices below 4 m (green)
  window.overlay = (key, scale) => {
    const L = LM[key]; if (!L) return null;
    const S = 900, R = (scale || Math.max(80, L.r*1.4)), cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d');
    c.fillStyle = '#f4f2ec'; c.fillRect(0, 0, S, S);
    const P = (x, y) => [(x - L.x)/R*S/2 + S/2, -(y - L.y)/R*S/2 + S/2];
    c.strokeStyle = '#ddd'; c.lineWidth = 1; for (let g = -R; g <= R; g += 50){ let a = P(L.x + g, L.y - R), b = P(L.x + g, L.y + R); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); a = P(L.x - R, L.y + g); b = P(L.x + R, L.y + g); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    for (const b of REAL){ for (const ring of b.rings){ c.beginPath(); for (let i = 0; i < ring.length; i += 2){ const p = P(ring[i], ring[i+1]); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); } c.closePath(); c.fillStyle = b.hidden ? 'rgba(220,60,50,0.18)' : 'rgba(90,90,90,0.15)'; c.fill(); c.strokeStyle = b.hidden ? '#d33' : '#777'; c.lineWidth = 1.5; c.stroke(); } }
    // model ground section
    c.fillStyle = 'rgba(30,150,60,0.55)';
    const v = new THREE.Vector3();
    for (const o of LMMESHES(key)){ const a = o.geometry.attributes.position, st = Math.max(1, Math.floor(a.count/20000)); for (let i = 0; i < a.count; i += st){ v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld); if (v.y - L.top < 4){ const p = P(v.x, -v.z); c.fillRect(p[0] - 1, p[1] - 1, 2, 2); } } }
    c.strokeStyle = '#2255ee'; c.lineWidth = 2.5; c.beginPath(); L.hull.forEach((h, i) => { const p = P(h[0], h[1]); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); c.stroke();
    c.fillStyle = '#000'; c.font = '16px sans-serif'; c.fillText(`${key}  rot ${L.rot}  grid 50 m  (red = real footprints hidden under the model, grey = kept, blue = model plan hull, green = model below 4 m)`, 10, 20);
    const o0 = P(L.x, L.y); c.beginPath(); c.arc(o0[0], o0[1], 4, 0, 7); c.fillStyle = '#e0a000'; c.fill();
    return cv.toDataURL('image/png');
  };
  function LMMESHES(key){ const L = LM[key], out = []; for (const grp of ENV.scene.children) if (grp.isGroup) for (const g of grp.children) if (g.isGroup && Math.abs(g.position.x - L.x) < 0.01 && Math.abs(g.position.z + L.y) < 0.01) g.traverse(o => { if (o.isMesh) out.push(o); }); return out; }
  window.onView = ({x, y, dist}) => {};
})();
