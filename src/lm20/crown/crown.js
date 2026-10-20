/* ================= v20 add-on: crown signs, billboards and LED screens of the CBD and Marina Bay (lm20/crown) =================
   The skyline's signage at its real places — the crown signs at the top of the CBD towers (Raffles Place, Collyer Quay,
   Marina Boulevard, Shenton Way, Marina Centre), the LED screens at Suntec, One Raffles Place and Clarke Quay, the media
   facade at Bugis and a rooftop frame sign — at the real face, height, size, mounting and lighting behaviour, but with
   INVENTED CONTENT ONLY: abstract geometric emblems (12 shapes below, none modelled on a real mark), bands of abstract
   glyphs (random strokes per sign; no letters of any name) and colours chosen away from the real tenants' colours.
   LED screens play abstract motion graphics. The research table is lm20/crown/SIGNAGE_TABLE.md.
   Placement:
   - on landmark models: horizontal cross-sections of the placed model (its merged meshes, world space) at the sign's heights;
     a ray from a point inside the tower along the sign's bearing finds the face, more rays check that the face is flat across
     the sign, the sign is set just in front of the outermost surface. Recomputed when a landmark is rebuilt or moved.
   - on real buildings: HOOKS.tile finds the building part containing the sign's point (tallest part for crown signs), the
     footprint edge facing the sign's bearing, and its roof height (lowest ground under the footprint + h, as bld.js draws it).
   Rendering: everything in two meshes (2 draw calls): A = MeshLambert with a procedural shader (emblems, glyph bands, LED
   programs, media facade, cabinets and frames; lit by day, self-lit at night, LED screens also by day), B = additive halos
   in front of the lit signs (night only). All animation on the shared LMT time uniform.
   Integration with lm20/signs: SGCrown.claims(B) says whether a real building carries one of these signs (see the report). */
{
const SGCrown = (() => {
  const D2R = Math.PI/180;
  // ---------------- the signage table ----------------
  // lm: landmark key and tw: [x, z] point inside the tower in the model's local metres (+x east, +z south before rotation),
  //     y: centre height above the model base;   at: [lat, lon] point inside the real building, minH: its minimum height,
  //     y < 0: centre below the roof, y >= 0: centre above the ground.
  // az: bearing the sign faces (deg, 0 N, 90 E); w, h: size (m); k: crown | led | media | roof; lay (crown): row = emblem +
  // glyph band, stack = emblem over band, emb = emblem only, band = glyph band only; e: emblem shape 0-11; c: [main, second]
  // colour; s: shift along the face (m, landmarks) or position along the footprint edge (0-1, real buildings); off: switch-off
  // time in hours after 22:00 (screens).
  const SPEC = [
    // Raffles Place / Battery Road / Collyer Quay
    {id:'uob-n', lm:'uob', tr:40, tw:[-50, -2], az:6, y:182, w:10, h:10, k:'crown', lay:'emb', e:0, c:['#ffd36b', '#ffffff']},
    {id:'uob-e', lm:'uob', tr:40, tw:[-50, -2], az:95, y:182, w:10, h:10, k:'crown', lay:'emb', e:0, c:['#ffd36b', '#ffffff']},
    {id:'ocbc-n', lm:'ocbc', tr:30, tw:[14, -28], az:27, y:192, w:30, h:7, k:'crown', lay:'row', e:2, c:['#3fe0cf', '#ffffff']},
    {id:'ocbc-s', lm:'ocbc', tr:30, tw:[14, -28], az:207, y:192, w:30, h:7, k:'crown', lay:'row', e:2, c:['#3fe0cf', '#ffffff']},
    {id:'maybank-n', at:[1.28592, 103.85250], minH:150, az:340, y:-8, w:8, h:8, k:'crown', lay:'emb', e:3, c:['#5cc8ff', '#ffffff']},
    {id:'maybank-e', at:[1.28592, 103.85250], minH:150, az:70, y:-7, w:24, h:6, k:'crown', lay:'row', e:3, c:['#5cc8ff', '#ffffff']},
    {id:'boc-n', at:[1.28574, 103.85224], minH:150, az:350, y:-7, w:12, h:8, k:'crown', lay:'stack', e:11, c:['#93f2b0', '#ffffff']},
    {id:'boc-w', at:[1.28574, 103.85224], minH:150, az:250, y:-7, w:12, h:8, k:'crown', lay:'stack', e:11, c:['#93f2b0', '#ffffff']},
    {id:'income-e', at:[1.28409, 103.85254], minH:90, az:100, y:-5, w:16, h:3.4, k:'crown', lay:'band', c:['#eaf2ff', '#b98cff']},
    {id:'ofc-e', at:[1.28311, 103.85198], minH:200, az:120, y:-10, w:30, h:7.5, k:'crown', lay:'row', e:8, c:['#ff86d6', '#ffffff']},
    {id:'ofc-w', at:[1.28311, 103.85198], minH:200, az:300, y:-10, w:30, h:7.5, k:'crown', lay:'row', e:8, c:['#ff86d6', '#ffffff']},
    {id:'oue-e', at:[1.28293, 103.85286], minH:80, az:100, y:-5, w:18, h:5, k:'crown', lay:'row', e:4, c:['#ffb347', '#ffffff']},
    {id:'chevron-e', at:[1.28417, 103.85197], minH:120, az:80, y:-8, w:10, h:10, k:'crown', lay:'emb', e:1, c:['#b6f05a', '#ffffff']},
    {id:'shub-n', at:[1.28329, 103.84963], minH:120, az:42, y:-5, w:26, h:4.6, k:'crown', lay:'band', c:['#fff1d6', '#ff9a3d']},
    {id:'shub-e', at:[1.28329, 103.84963], minH:120, az:130, y:-5, w:26, h:4.6, k:'crown', lay:'band', c:['#fff1d6', '#ff9a3d']},
    {id:'pru-e', at:[1.28278, 103.84987], minH:120, az:110, y:-5, w:20, h:4.5, k:'crown', lay:'row', e:9, c:['#7fe9ff', '#ffffff']},
    {id:'aia-e', at:[1.28199, 103.85110], minH:100, az:110, y:-5, w:12, h:5, k:'crown', lay:'row', e:6, c:['#ffd56b', '#ffffff']},
    {id:'gsh-n', at:[1.28308, 103.85048], minH:80, az:20, y:-4, w:16, h:3.2, k:'crown', lay:'band', c:['#d6b8ff', '#ffffff']},
    // Marina Boulevard / Marina View / Shenton Way
    {id:'asia1-e', lm:'asiasquare', tr:45, tw:[41, -40], az:123, y:195, w:30, h:6.5, k:'crown', lay:'row', e:5, c:['#a3ffc8', '#ffffff']},
    {id:'asia1-w', lm:'asiasquare', tr:45, tw:[41, -40], az:302, y:195, w:30, h:6.5, k:'crown', lay:'row', e:5, c:['#a3ffc8', '#ffffff']},
    {id:'asia2-w', lm:'asiasquare', tr:45, tw:[-35, 52], az:302, y:209, w:20, h:4, k:'crown', lay:'band', c:['#ffc27a', '#ffffff']},
    {id:'mbfc1-n', lm:'mbfc', tw:[-17, -70], tr:35, az:20, y:160, w:30, h:7.5, k:'crown', lay:'row', e:7, c:['#ff9d4d', '#ffffff']},
    {id:'mbfc1-e', lm:'mbfc', tw:[-17, -70], tr:35, az:110, y:160, w:30, h:7.5, k:'crown', lay:'row', e:7, c:['#ff9d4d', '#ffffff']},
    {id:'mbfc3-e', lm:'mbfc', tw:[10, 65], tr:40, az:98, y:197, w:30, h:9, k:'crown', lay:'row', e:10, c:['#b8a0ff', '#ffffff']},
    {id:'mbfc3-w', lm:'mbfc', tw:[10, 65], tr:40, az:278, y:197, w:30, h:9, k:'crown', lay:'row', e:10, c:['#b8a0ff', '#ffffff']},
    // City Hall / Marina Centre hotels
    {id:'swiss-se', lm:'rafflescity', tr:35, tw:[-51.3, 45.2], az:135, y:213, w:26, h:5.5, k:'crown', lay:'band', c:['#f2f7ff', '#4fd1c5']},
    {id:'swiss-ne', lm:'rafflescity', tr:35, tw:[-51.3, 45.2], az:45, y:213, w:26, h:5.5, k:'crown', lay:'band', c:['#f2f7ff', '#4fd1c5']},
    {id:'swiss-sw', lm:'rafflescity', tr:35, tw:[-51.3, 45.2], az:225, y:213, w:26, h:5.5, k:'crown', lay:'band', c:['#f2f7ff', '#4fd1c5']},
    {id:'panpac-s', at:[1.29253, 103.85865], minH:120, az:200, y:-5, w:20, h:4.5, k:'crown', lay:'row', e:9, c:['#ffe2c4', '#ff7a9c']},
    {id:'panpac-e', at:[1.29253, 103.85865], minH:120, az:110, y:-5, w:20, h:4.5, k:'crown', lay:'row', e:9, c:['#ffe2c4', '#ff7a9c']},
    {id:'mandarin-sw', at:[1.290537, 103.858253], minH:60, az:210, y:-5, w:14, h:8, k:'crown', lay:'stack', e:10, c:['#a8f0ff', '#ffffff']},
    {id:'prmb-s', at:[1.29150, 103.85697], minH:60, az:250, y:-4, w:18, h:3.6, k:'crown', lay:'band', c:['#ffc46b', '#ffffff']},
    // screens, media facade, rooftop frame
    {id:'suntec-nicoll', at:[1.293360, 103.856492], minH:25, az:306, y:16, w:12.3, h:14.3, k:'led', off:2},
    {id:'suntec-entr', at:[1.292952, 103.856860], minH:25, az:216, y:15.5, w:14, h:10.7, k:'led', off:2},
    {id:'oneraffles-led', lm:'oneraffles', tr:25, tw:[20, 25], az:95, y:11, w:14, h:7, k:'led', off:2},
    {id:'cqcentral-led', at:[1.289204, 103.847045], minH:12, az:130, y:10.5, w:16, h:9, k:'led', off:2.5},
    {id:'bugisplus-media', at:[1.299656, 103.854182], minH:18, az:39, y:13, w:56, h:16, k:'media', off:1},
    {id:'excelsior-roof', at:[1.29173, 103.85037], minH:60, az:135, y:0, w:22, h:4.5, k:'roof', c:['#ffffff', '#4f8dff'], off:3}
  ];

  // ---------------- small helpers ----------------
  const hex = s => { const v = parseInt(s.slice(1), 16); return [(v >> 16 & 255)/255, (v >> 8 & 255)/255, (v & 255)/255]; };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a)/(b - a))); return t*t*(3 - 2*t); };
  const pip = (R, x, y) => { let ins = false; const m = R.length >> 1; for (let i = 0, j = m - 1; i < m; j = i++){ const xi = R[i*2], yi = R[i*2+1], xj = R[j*2], yj = R[j*2+1]; if ((yi > y) !== (yj > y) && x < (xj - xi)*(y - yi)/(yj - yi) + xi) ins = !ins; } return ins; };
  const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0)/4294967296; };
  for (const sp of SPEC) sp.seed = hashStr(sp.id);
  let inited = false;
  // [lm28/ruin] signs on destroyed buildings / landmarks go with them (the bld.js kd registry; rebuilt on the next frame)
  let crHooked = false;
  function crHook(){
    if (crHooked) return;
    try { if (typeof SGBld === 'undefined' || !SGBld.kd || !SGBld.kd.onChange) return; crHooked = true;
      SGBld.kd.onChange(ev => { let hit = ev.t === 'restore' || ev.t === 'lm';
        if (!hit && ev.ti !== undefined){ const L = REALPL.get(ev.ti); if (L) for (const it of L) if (it.bi === ev.idx){ hit = true; break; } }
        if (hit){ dirty = true; lastBuild = -1e9; } }); } catch (e){ /* optional */ }
  }
  function crDead(it){
    try { const K = typeof SGBld !== 'undefined' && SGBld.kd; if (!K) return false;
      if (it.ti !== undefined && it.bi !== undefined && K.state && K.state(it.ti, it.bi)) return true;
      if (it.sp.lm && K.lmDead && K.lmDead(it.sp.lm)) return true; } catch (e){ /* optional */ }
    return false;
  }
  function init(){ inited = true; crHook(); for (const sp of SPEC) if (sp.at){ const q = sgXY(sp.at[0], sp.at[1]); sp.x = q[0]; sp.y2 = q[1]; CLB[0] = Math.min(CLB[0], q[0] - 150); CLB[1] = Math.min(CLB[1], q[1] - 150); CLB[2] = Math.max(CLB[2], q[0] + 150); CLB[3] = Math.max(CLB[3], q[1] + 150); } const c = sgXY(1.2865, 103.8535); CEN[0] = c[0]; CEN[1] = c[1]; }
  const REAL = SPEC.filter(s => s.at), BYLM = new Map();
  for (const s of SPEC) if (s.lm){ if (!BYLM.has(s.lm)) BYLM.set(s.lm, []); BYLM.get(s.lm).push(s); }

  // ---------------- state ----------------
  const U = {uN:{value:0}, uLH:{value:0}, uDim:{value:1}, fN:{value:36000}, fF:{value:115000}};
  const STATS = {placed:0, failed:{}, tris:0, halos:0, builds:0, lmMs:{}, flat:{}};
  const LMPL = new Map();        // landmark key -> {sig, items}
  const REALPL = new Map();      // tile index -> items
  let lmMore = false, dirty = false, lastBuild = -1e9, meshA = null, meshB = null, MA = null, MB = null, frameN = 0;
  const CEN = [0, 0], CLB = [Infinity, Infinity, -Infinity, -Infinity];      // CLB: box round all real-building signs

  // ---------------- landmark faces: horizontal sections of the placed model ----------------
  // returns, per height in Ys, a flat list of segments [x0, y0, x1, y1, ...] in world metres (x east, y north)
  function sections(g, Ys){
    g.updateMatrixWorld(true);
    const out = Ys.map(() => []), yLo = Math.min(...Ys), yHi = Math.max(...Ys);
    g.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || !o.geometry) return;
      const P = o.geometry.attributes.position; if (!P || P.isInterleavedBufferAttribute || P.itemSize !== 3) return;
      const a = P.array, n = P.count, e = o.matrixWorld.elements, I = o.geometry.index, ia = I ? I.array : null, nt = I ? I.count : n;
      const W = new Float32Array(n*3);
      for (let i = 0; i < n; i++){ const x = a[i*3], y = a[i*3+1], z = a[i*3+2];
        W[i*3] = e[0]*x + e[4]*y + e[8]*z + e[12]; W[i*3+1] = e[1]*x + e[5]*y + e[9]*z + e[13]; W[i*3+2] = e[2]*x + e[6]*y + e[10]*z + e[14]; }
      for (let t = 0; t + 2 < nt; t += 3){
        const A = ia ? ia[t] : t, B = ia ? ia[t+1] : t + 1, C = ia ? ia[t+2] : t + 2;
        const ya = W[A*3+1], yb = W[B*3+1], yc = W[C*3+1];
        const lo = Math.min(ya, yb, yc), hi = Math.max(ya, yb, yc);
        if (hi < yLo || lo > yHi || hi - lo < 1e-4) continue;
        for (let k = 0; k < Ys.length; k++){
          const Y = Ys[k]; if (Y < lo || Y > hi) continue;
          let c = 0, x0 = 0, z0 = 0, x1 = 0, z1 = 0;
          for (let q = 0; q < 3 && c < 2; q++){
            const p = q === 0 ? A : q === 1 ? B : C, r = q === 0 ? B : q === 1 ? C : A, yp = W[p*3+1], yr = W[r*3+1];
            if ((yp - Y)*(yr - Y) > 0 || yp === yr) continue;
            const s = (Y - yp)/(yr - yp), x = W[p*3] + (W[r*3] - W[p*3])*s, z = W[p*3+2] + (W[r*3+2] - W[p*3+2])*s;
            if (c === 0){ x0 = x; z0 = z; } else { x1 = x; z1 = z; } c++;
          }
          if (c === 2 && (x1 - x0)*(x1 - x0) + (z1 - z0)*(z1 - z0) > 1e-6) out[k].push(x0, -z0, x1, -z1);
        }
      }
    });
    return out;
  }
  // hits of the ray o + d t (0 <= t <= tmax) with the segments, sorted; n = segment normal turned along d
  function ray2(S, ox, oy, dx, dy, tmax){
    const H = [];
    for (let i = 0; i < S.length; i += 4){
      const ax = S[i], ay = S[i+1], ex = S[i+2] - ax, ey = S[i+3] - ay, den = dx*ey - dy*ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((ax - ox)*ey - (ay - oy)*ex)/den, u = ((ax - ox)*dy - (ay - oy)*dx)/den;
      if (t < 0 || t > tmax || u < -1e-6 || u > 1 + 1e-6) continue;
      let nx = ey, ny = -ex; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; if (nx*dx + ny*dy < 0){ nx = -nx; ny = -ny; }
      H.push({t, nx, ny});
    }
    return H.sort((a, b) => a.t - b.t);
  }
  // the signs of one landmark: frames {cx, cy (face point, world), nx, ny (outward), y (centre height)}
  function placeLandmark(L, specs){
    const t0 = performance.now(), g = lmMeshes.get(L.id), def = LANDMARKS[L.type];
    const items = [];
    if (!g || !def) return items;
    const c = Math.cos(L.rot), s = Math.sin(L.rot), base = L.top || 0;
    const Ys = [];
    for (const sp of specs){ const Y = base + sp.y; Ys.push(Y, Y - sp.h*0.45, Y + sp.h*0.45); }
    const SEC = sections(g, Ys);
    specs.forEach((sp, i) => {
      const ax = L.x + sp.tw[0]*c + sp.tw[1]*s, ay = L.y + sp.tw[0]*s - sp.tw[1]*c;
      const dx = Math.sin(sp.az*D2R), dy = Math.cos(sp.az*D2R), Y = base + sp.y;
      // the outermost surface of this tower along the bearing: the farthest hit within the tower's radius tr from the anchor
      // (models are built of several closed prisms, so the first hit can be an inner wall)
      const H = ray2(SEC[i*3], ax, ay, dx, dy, sp.tr || 40);
      if (!H.length){ STATS.failed[sp.id] = 'no face hit'; return; }
      const hit = H[H.length - 1], t0h = hit.t, nx = hit.nx, ny = hit.ny;
      const px = ax + dx*t0h, py = ay + dy*t0h, rx = -ny, ry = nx, s0 = sp.s || 0;
      // depth profile of the outermost surface across the sign (fins, bays, curved faces): rays along the normal from 6 m inside,
      // at three heights; the sign shrinks until the face is there all across it
      let w = sp.w, h = sp.h, prof = null;
      for (let tries = 0; tries < 7 && !prof; tries++){
        const K = Math.max(2, Math.min(16, Math.ceil(w/2.5))), d = [];
        for (let j = 0; j <= K; j++){
          const r = s0 - w/2 + w*j/K; let best = -1e9;
          for (const k of [0, 1, 2]){ const Hs = ray2(SEC[i*3 + k], px + rx*r - nx*6, py + ry*r - ny*6, nx, ny, 9.5); if (Hs.length) best = Math.max(best, Hs[Hs.length - 1].t - 6); }
          d.push(best);
        }
        if (d.every(v => v > -1e8)) prof = d; else { w *= 0.86; if (sp.k === 'crown') h *= 0.86; }
      }
      if (!prof){ STATS.failed[sp.id] = 'face too narrow'; return; }
      STATS.flat[sp.id] = +(Math.max(...prof) - Math.min(...prof)).toFixed(2);
      items.push({sp, px, py, s:s0, nx, ny, y:Y, w, h, prof, top:null});
    });
    STATS.lmMs[L.type] = +(performance.now() - t0).toFixed(1);
    return items;
  }
  function lmSig(L){ const g = lmMeshes.get(L.id); return g ? `${L.id}|${L.x}|${L.y}|${L.rot}|${L.top}|${g.uuid}` : ''; }
  function checkLandmarks(budget){
    if (typeof landmarks === 'undefined' || typeof lmMeshes === 'undefined') return false;
    const t0 = performance.now();
    for (const [key, specs] of BYLM){
      const L = landmarks.find(q => q.type === key), sig = L ? lmSig(L) : '';
      const cur = LMPL.get(key);
      if (cur && cur.sig === sig) continue;
      if (!sig){ if (cur){ LMPL.delete(key); dirty = true; } continue; }
      for (const sp of specs) delete STATS.failed[sp.id];
      LMPL.set(key, {sig, items:placeLandmark(L, specs)}); dirty = true;
      if (performance.now() - t0 > budget) return true;      // more next frame
    }
    return false;
  }

  // ---------------- real buildings (HOOKS.tile) ----------------
  function ringEdges(R){
    const m = R.length >> 1, E = []; let A2 = 0;
    for (let i = 0; i < m; i++){ const j = (i + 1) % m; A2 += R[i*2]*R[j*2+1] - R[j*2]*R[i*2+1]; }
    const sg = A2 >= 0 ? 1 : -1;
    for (let i = 0; i < m; i++){ const j = (i + 1) % m, ax = R[i*2], ay = R[i*2+1], bx = R[j*2], by = R[j*2+1], L = Math.hypot(bx - ax, by - ay);
      if (L < 0.8) continue; const ux = (bx - ax)/L, uy = (by - ay)/L; E.push({ax, ay, ux, uy, nx:uy*sg, ny:-ux*sg, L}); }
    return E;
  }
  function groundOf(R){ let g = Infinity; for (let i = 0; i < R.length; i += 2) g = Math.min(g, hC(R[i], R[i+1])); return g; }
  function bboxHas(R, x, y){ let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (let i = 0; i < R.length; i += 2){ const a = R[i], b = R[i+1]; if (a < x0) x0 = a; if (a > x1) x1 = a; if (b < y0) y0 = b; if (b > y1) y1 = b; } return x >= x0 && x <= x1 && y >= y0 && y <= y1; }
  // faces of a footprint: runs of consecutive edges turning less than ~20 deg (short jogs < 1.5 m don't break a face)
  function faces(R){
    const E = ringEdges(R), F = [];
    let cur = null;
    for (const e of E){
      if (cur && (e.L < 1.5 || e.nx*cur.nx0 + e.ny*cur.ny0 > 0.94)){ cur.E.push(e); if (e.L >= 1.5){ cur.sx += e.nx*e.L; cur.sy += e.ny*e.L; cur.L += e.L; } continue; }
      if (e.L < 1.5 && !cur) continue;
      cur = {E:[e], nx0:e.nx, ny0:e.ny, sx:e.nx*e.L, sy:e.ny*e.L, L:e.L}; F.push(cur);
    }
    if (F.length > 1){ const a = F[0], b = F[F.length - 1]; if (a.nx0*b.nx0 + a.ny0*b.ny0 > 0.94){ b.E.push(...a.E); b.sx += a.sx; b.sy += a.sy; b.L += a.L; F.shift(); } }
    for (const f of F){ const l = Math.hypot(f.sx, f.sy) || 1; f.nx = f.sx/l; f.ny = f.sy/l; }
    return F;
  }
  function placeReal(sp, B){
    const R = B.rings[0], g = groundOf(R), top = g + B.h, m = R.length >> 1;
    const dx = Math.sin(sp.az*D2R), dy = Math.cos(sp.az*D2R);
    // the face most nearly turned to the bearing, preferring faces long enough for the sign
    let fb = null, fs = -1e9;
    for (const f of faces(R)){ const d = f.nx*dx + f.ny*dy; if (d < 0.6) continue; const sc = d*0.5 + Math.min(1, f.L/(sp.w + 2))*0.5; if (sc > fs){ fs = sc; fb = f; } }
    if (!fb){ STATS.failed[sp.id] = 'no face towards ' + sp.az; return null; }
    const nx = fb.nx, ny = fb.ny, rx = -ny, ry = nx;
    // its midpoint (by length) and its extent across
    let acc = 0, px = 0, py = 0; const half = fb.L/2;
    for (const e of fb.E){ if (e.L < 1.5) continue; if (acc + e.L >= half){ const t = half - acc; px = e.ax + e.ux*t; py = e.ay + e.uy*t; break; } acc += e.L; }
    // the front of the outline across the sign (within 8 m behind the face); the sign shrinks until the face is there all across it
    // and stays within 4 m of a plane (curved channel letters) or 1.5 m (flat cabinets, screens)
    const front = r => { let b = -1e9; for (let i = 0; i < m; i++){ const jj = (i + 1) % m;
        const ra = (R[i*2] - px)*rx + (R[i*2+1] - py)*ry, da = (R[i*2] - px)*nx + (R[i*2+1] - py)*ny, rb = (R[jj*2] - px)*rx + (R[jj*2+1] - py)*ry, db = (R[jj*2] - px)*nx + (R[jj*2+1] - py)*ny;
        if ((ra - r)*(rb - r) > 0) continue; const d = Math.abs(rb - ra) < 1e-6 ? Math.max(da, db) : da + (db - da)*(r - ra)/(rb - ra); if (d > -8) b = Math.max(b, d); } return b; };
    const tol = sp.k === 'crown' ? 4 : 1.5, c = sp.s || 0;
    let w = sp.w, h = sp.h, prof = null;
    for (let it = 0; it < 14 && !prof; it++){
      const K = Math.max(2, Math.min(16, Math.ceil(w/2.5))), P = [];
      for (let j = 0; j <= K; j++){ const d = front(c - w/2 + w*j/K); if (d < -1e8) break; P.push(d); }
      if (P.length === K + 1 && Math.max(...P) - Math.min(...P) <= tol) prof = P;
      else { w *= 0.9; if (sp.k === 'crown' || sp.k === 'led') h *= 0.9; }
    }
    if (!prof){ STATS.failed[sp.id] = 'face too small'; return null; }
    const Y = sp.k === 'roof' ? top : sp.y < 0 ? top + sp.y : g + sp.y;
    STATS.flat[sp.id] = +(Math.max(...prof) - Math.min(...prof)).toFixed(2);
    // points just inside the face behind the sign's ends and centre (claims(): which building parts the sign covers)
    const pts = [-0.5, 0, 0.5].map(f => { const r = c + f*(w - 1); return [px + rx*r - nx*2, py + ry*r - ny*2]; });
    return {sp, px, py, s:c, nx, ny, y:Y, w, h, prof, top, ring:R, pts};
  }
  function tileHook(T, list, skip){
    if (!SGR.on) return null;
    if (!inited) init();
    const mine = REAL.filter(sp => Math.abs(sp.x - T.cx) <= 1060 && Math.abs(sp.y2 - T.cy) <= 1060);
    if (!mine.length) return null;
    const got = [];
    for (const sp of mine){
      let best = null;
      for (const B of list){
        if (B.foreign || B.h < sp.minH) continue;
        const R = B.rings[0]; if (!bboxHas(R, sp.x, sp.y2) || !pip(R, sp.x, sp.y2)) continue;
        if (skip && skip(B)) continue;
        if (sp.k === 'crown' || sp.k === 'roof'){ const sc = B.h + Math.min(0, (B.area - 600)/40); if (!best || sc > best.sc + 0.01 || (Math.abs(sc - best.sc) <= 0.01 && B.area > best.B.area)) best = {B, sc}; }
        else { const b0 = B.base > 2 ? B.base : 0; if (b0 <= sp.y - sp.h/2 && B.h >= sp.y + sp.h/2 && (!best || B.area > best.B.area)) best = {B, sc:0}; }
      }
      if (best){ const it = placeReal(sp, best.B); if (it){ it.ti = T.ti; it.bi = best.B.i; got.push(it); delete STATS.failed[sp.id]; } }
      else STATS.failed[sp.id] = 'building not found (tile ' + T.ti + ')';
    }
    const holder = new THREE.Group(); holder.name = 'sgcrown' + T.ti; holder.userData.lodMax = 1e9;
    holder.userData.dispose = () => { if (REALPL.get(T.ti) === got){ REALPL.delete(T.ti); dirty = true; } };
    REALPL.set(T.ti, got); dirty = true;
    return holder;
  }
  // does a real building carry one of these signs? (for lm20/signs: skip its lightbox / crown glow / mall screens there)
  // (the building part holding the sign's point, and every part behind the placed sign's span)
  function claims(B){
    if (!B || !B.rings) return null;
    if (!inited) init();
    const R = B.rings[0]; let k = null, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < R.length; i += 2){ const a = R[i], b = R[i+1]; if (a < x0) x0 = a; if (a > x1) x1 = a; if (b < y0) y0 = b; if (b > y1) y1 = b; }
    if (x1 < CLB[0] || x0 > CLB[2] || y1 < CLB[1] || y0 > CLB[3]) return null;           // far from every sign
    const has = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && pip(R, x, y);
    for (const sp of REAL){ if (B.h < sp.minH - 0.5 || !has(sp.x, sp.y2)) continue; k = k || {}; k[sp.k] = true; }
    for (const L of REALPL.values()) for (const it of L){
      if (k && k[it.sp.k]) continue;
      if (!it.pts.some(q => has(q[0], q[1]))) continue;
      const g = groundOf(R), b0 = B.base > 2 ? B.base : 0, y = it.sp.k === 'roof' ? it.y - 1 : it.y;
      if (g + B.h < y - it.h/2 || g + b0 > y + it.h/2) continue;          // the part doesn't reach the sign's height
      k = k || {}; k[it.sp.k] = true;
    }
    return k;
  }

  // ---------------- geometry ----------------
  function Geo(){ this.P = []; this.N = []; this.U = []; this.K = []; this.CA = []; this.CB = []; this.I = []; }
  Geo.prototype.v = function(x, h, y, n, u, v, K, CA, CB){ this.P.push(x, h, -y); this.N.push(n[0], n[1], n[2]); this.U.push(u, v); this.K.push(K[0], K[1], K[2], K[3]); this.CA.push(CA[0], CA[1], CA[2], CA[3]); this.CB.push(CB[0], CB[1], CB[2], CB[3]); return this.P.length/3 - 1; };
  // a sign frame F: centre (cx, cy) on the face, outward normal (nx, ny), right vector (rx, ry) = (-ny, nx)
  const at = (F, s, d) => [F.cx + F.rx*s + F.nx*d, F.cy + F.ry*s + F.ny*d];
  // quad facing +n on the plane d: s0..s1 across, y0..y1 up, uv u0..u1, v0..v1
  function quad(G, F, s0, s1, y0, y1, d, K, CA, CB, u0, u1, v0, v1){
    const n = [F.nx, 0, -F.ny], a = at(F, s0, d), b = at(F, s1, d);
    u0 = u0 === undefined ? 0 : u0; u1 = u1 === undefined ? 1 : u1; v0 = v0 === undefined ? 0 : v0; v1 = v1 === undefined ? 1 : v1;
    const i = G.v(a[0], y0, a[1], n, u0, v0, K, CA, CB); G.v(b[0], y0, b[1], n, u1, v0, K, CA, CB); G.v(b[0], y1, b[1], n, u1, v1, K, CA, CB); G.v(a[0], y1, a[1], n, u0, v1, K, CA, CB);
    G.I.push(i, i + 1, i + 2, i, i + 2, i + 3);
  }
  // box between d0 (wall side) and d1 (front): faces 1 front, 2 back, 4 right, 8 left, 16 top, 32 bottom
  function box(G, F, s0, s1, y0, y1, d0, d1, K, CA, CB, mask){
    mask = mask === undefined ? 63 : mask;
    const P = (s, y, d) => { const p = at(F, s, d); return [p[0], y, p[1]]; };
    const n = [F.nx, 0, -F.ny], r = [F.rx, 0, -F.ry];
    const face = (a, b, c, d, nn) => { const i = G.v(a[0], a[1], a[2], nn, 0, 0, K, CA, CB); G.v(b[0], b[1], b[2], nn, 1, 0, K, CA, CB); G.v(c[0], c[1], c[2], nn, 1, 1, K, CA, CB); G.v(d[0], d[1], d[2], nn, 0, 1, K, CA, CB); G.I.push(i, i + 1, i + 2, i, i + 2, i + 3); };
    if (mask & 1) face(P(s0, y0, d1), P(s1, y0, d1), P(s1, y1, d1), P(s0, y1, d1), n);
    if (mask & 2) face(P(s1, y0, d0), P(s0, y0, d0), P(s0, y1, d0), P(s1, y1, d0), [-n[0], 0, -n[2]]);
    if (mask & 4) face(P(s1, y0, d1), P(s1, y0, d0), P(s1, y1, d0), P(s1, y1, d1), r);
    if (mask & 8) face(P(s0, y0, d0), P(s0, y0, d1), P(s0, y1, d1), P(s0, y1, d0), [-r[0], 0, -r[2]]);
    if (mask & 16) face(P(s0, y1, d1), P(s1, y1, d1), P(s1, y1, d0), P(s0, y1, d0), [0, 1, 0]);
    if (mask & 32) face(P(s0, y0, d0), P(s1, y0, d0), P(s1, y0, d1), P(s0, y0, d1), [0, -1, 0]);
  }
  // halo (mesh B): soft quad in front of a lit sign
  function Halo(){ this.P = []; this.U = []; this.C = []; this.M = []; this.I = []; }
  function halo(HB, F, s, y, hw, hh, d, col, k, kind, seed, off, wide){
    const a = at(F, s - hw, d), b = at(F, s + hw, d), i = HB.P.length/3;
    for (const [p, h, u, v] of [[a, y - hh, -1, -1], [b, y - hh, 1, -1], [b, y + hh, 1, 1], [a, y + hh, -1, 1]]){
      HB.P.push(p[0], h, -p[1]); HB.U.push(u, v); HB.C.push(col[0], col[1], col[2], k); HB.M.push(kind, seed, off, 0); }
    HB.I.push(i, i + 1, i + 2, i, i + 2, i + 3);
    if (!wide) halo(HB, F, s, y, hw*1.9 + 4, hh*2.6 + 4, d + 0.3, col, k*0.4, kind, seed, off, true);
  }
  const offA = h => h === undefined ? 1 : Math.max(0, Math.min(0.995, h/8));     // switch-off hour (after 22:00) / 8; 1 = never
  const CAB = [0.16, 0.17, 0.19, 1], STEEL = [0.34, 0.35, 0.37, 1], RACE = [0.22, 0.23, 0.25, 1];
  function glyphCount(len, hgt){ return Math.max(3, Math.round(len/(hgt*0.74))); }
  // depth of the face under the sign at across-position r (from the sign's centre), from its profile
  function depFn(it){
    const P = it.prof, K = P.length - 1, w = it.w, lo = Math.min(...P), hi = Math.max(...P);
    if (hi - lo < 0.35) return {dep:() => hi, max:() => hi, flat:true};
    const dep = r => { const f = Math.min(K, Math.max(0, (r + w/2)/w*K)), j = Math.min(K - 1, Math.floor(f)), t = f - j; return P[j] + (P[j + 1] - P[j])*t; };
    return {dep, max:(a, b) => { let m = Math.max(dep(a), dep(b)); for (let j = 0; j <= K; j++){ const r = -w/2 + w*j/K; if (r > a && r < b) m = Math.max(m, P[j]); } return m; }, flat:false};
  }
  // pieces of a strip following the face from s0 to s1 (one piece where the face is flat): cb(frame of the piece, half length, j, n, flip)
  function pieces(F, D, s0, s1, cb){
    const n = D.flat ? 1 : Math.max(1, Math.min(14, Math.ceil((s1 - s0)/2.2)));
    for (let j = 0; j < n; j++){
      const a = s0 + (s1 - s0)*j/n, b = s0 + (s1 - s0)*(j + 1)/n, pa = at(F, a, D.dep(a)), pb = at(F, b, D.dep(b));
      let ux = pb[0] - pa[0], uy = pb[1] - pa[1]; const L = Math.hypot(ux, uy) || 1; ux /= L; uy /= L;
      let nx = uy, ny = -ux; if (nx*F.nx + ny*F.ny < 0){ nx = -nx; ny = -ny; }
      const Fj = {cx:(pa[0] + pb[0])/2, cy:(pa[1] + pb[1])/2, nx, ny, rx:-ny, ry:nx};
      cb(Fj, L/2, j, n, (Fj.rx*ux + Fj.ry*uy) < 0);
    }
  }
  // a glyph band following the face, with its raceway
  function bandStrip(G, F, D, s0, s1, y0, y1, dd, K4, CA, CB, race){
    pieces(F, D, s0, s1, (Fj, hl, j, n, flip) => {
      quad(G, Fj, -hl, hl, y0, y1, dd, K4, CA, CB, flip ? (j + 1)/n : j/n, flip ? j/n : (j + 1)/n);
      if (race) box(G, Fj, -hl - (j === 0 ? -0.2 : 0.02), hl + (j === n - 1 ? -0.2 : 0.02), (y0 + y1)/2 - (y1 - y0)*0.16, (y0 + y1)/2 + (y1 - y0)*0.16, 0.02, dd - 0.1, [0, 0, 0, 0], race, CB, 1 | 4 | 8 | 16 | 32);
    });
  }
  // write one sign
  function writeSign(G, HB, it){
    const sp = it.sp, F = {cx:it.px + -it.ny*it.s, cy:it.py + it.nx*it.s, nx:it.nx, ny:it.ny, rx:-it.ny, ry:it.nx}, Y = it.y, w = it.w, h = it.h, seed = sp.seed, D = depFn(it);
    const cA = sp.c ? hex(sp.c[0]) : [1, 1, 1], cB = sp.c ? hex(sp.c[1]) : [1, 1, 1], off = offA(sp.off);
    const A4 = [cA[0], cA[1], cA[2], 1], B4 = [cB[0], cB[1], cB[2], off];
    const cab = [CAB[0], CAB[1], CAB[2], off], K0 = [0, 0, 0, 0], dW = D.max(-w/2, w/2);
    const glow = [(cA[0] + cB[0])*0.5, (cA[1] + cB[1])*0.5, (cA[2] + cB[2])*0.5];
    if (sp.k === 'crown'){
      { const bw = (sp.lay === 'emb' ? Math.min(w, h) : w) + h*0.5, bh = h*1.45, back = [0.3, 0.33, 0.36, 1];
        pieces(F, D, -bw/2, bw/2, (Fj, hl, j, n) => box(G, Fj, -hl - 0.03, hl + 0.03, Y - bh/2, Y + bh/2, -0.4, 0.12, K0, back, B4, 1 | (j === n - 1 ? 4 : 0) | (j === 0 ? 8 : 0) | 16 | 32)); }
      const emb = (s0, s1, y0, y1, dd) => { const d = D.max(s0, s1); quad(G, F, s0, s1, y0, y1, d + dd, [1, seed, sp.e || 0, 0], A4, B4); };
      const band = (s0, s1, y0, y1, dd, col) => bandStrip(G, F, D, s0, s1, y0, y1, dd, [2, seed, glyphCount(s1 - s0, y1 - y0), (s1 - s0)/(y1 - y0)], col, B4, [RACE[0], RACE[1], RACE[2], 1]);
      if (sp.lay === 'emb'){ const e = Math.min(w, h); emb(-e/2, e/2, Y - e/2, Y + e/2, 0.45); halo(HB, F, 0, Y, e*0.95, e*0.95, dW + 1.2, glow, 0.7, 0, seed, off); }
      else if (sp.lay === 'band'){ band(-w/2, w/2, Y - h/2, Y + h/2, 0.42, A4); halo(HB, F, 0, Y, w*0.62 + h*0.6, h*1.35, dW + 1.2, cA, 0.66, 0, seed, off); }
      else if (sp.lay === 'stack'){ const es = h*0.62, bh = h*0.26; emb(-es/2, es/2, Y + h/2 - es, Y + h/2, 0.45); band(-w/2, w/2, Y - h/2, Y - h/2 + bh, 0.42, [cB[0], cB[1], cB[2], 1]); halo(HB, F, 0, Y, w*0.65 + h*0.4, h*0.95, dW + 1.2, glow, 0.66, 0, seed, off); }
      else { const e = h, bh = h*0.46, s1 = -w/2 + e, yb = Y - h*0.04; emb(-w/2, s1, Y - h/2, Y + h/2, 0.45); band(s1 + e*0.28, w/2, yb - bh/2, yb + bh/2, 0.42, [cB[0], cB[1], cB[2], 1]); halo(HB, F, 0, Y, w*0.62 + h*0.5, h*1.25, dW + 1.2, glow, 0.66, 0, seed, off); }
    } else if (sp.k === 'led'){
      box(G, F, -w/2 - 0.35, w/2 + 0.35, Y - h/2 - 0.35, Y + h/2 + 0.35, dW + 0.02, dW + 0.85, K0, cab, B4);
      quad(G, F, -w/2, w/2, Y - h/2, Y + h/2, dW + 0.88, [3, seed, w/h, h], [1, 1, 1, 1], [1, 1, 1, off]);
      halo(HB, F, 0, Y, w*0.75, h*0.78, dW + 1.6, [1, 1, 1], 0.42, 1, seed, off);
    } else if (sp.k === 'media'){
      quad(G, F, -w/2, w/2, Y - h/2, Y + h/2, dW + 0.3, [4, seed, w, h], [1, 1, 1, 1], [1, 1, 1, off]);
      halo(HB, F, 0, Y, w*0.6, h*0.7, dW + 1.4, [1, 1, 1], 0.16, 1, seed, off);
    } else if (sp.k === 'roof'){
      // lattice frame set back 2.5 m from the edge, glyph band on its front, lit from behind the letters
      const top = it.y, set = -2.5, y0 = top + 1.2, y1 = y0 + h, st = [STEEL[0], STEEL[1], STEEL[2], 1];
      const Fb = {cx:F.cx + it.nx*(set + dW), cy:F.cy + it.ny*(set + dW), nx:it.nx, ny:it.ny, rx:F.rx, ry:F.ry};
      box(G, Fb, -w/2, w/2, y0 - 0.15, y0 + 0.15, -0.3, 0, K0, st, B4); box(G, Fb, -w/2, w/2, y1 - 0.15, y1 + 0.15, -0.3, 0, K0, st, B4);
      for (let k = 0; k <= 6; k++){ const s = -w/2 + k*w/6; box(G, Fb, s - 0.12, s + 0.12, top - 0.2, y1 + 0.2, -0.3, 0, K0, st, B4, 1 | 2 | 4 | 8 | 16); }
      for (let k = 0; k < 6; k += 2){ const s = -w/2 + k*w/6 + w/12; box(G, Fb, s - 0.1, s + 0.1, top, y0, -2.4, -0.3, K0, st, B4, 1 | 4 | 8 | 16); }
      const n = glyphCount(w*0.92, h*0.8);
      quad(G, Fb, -w*0.46, w*0.46, y0 + h*0.1, y1 - h*0.1, 0.12, [2, seed, n, w*0.92/(h*0.8)], [cB[0], cB[1], cB[2], 1], [cB[0], cB[1], cB[2], off]);
      halo(HB, Fb, 0, (y0 + y1)/2, w*0.62, h*1.0, 1.0, cB, 0.3, 0, seed, off);
    }
  }

  // ---------------- materials ----------------
  const GLSL_COMMON = `
float sgH2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
vec3 sgHue(float h){ return clamp(abs(mod(h*6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
float sgSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba)/dot(ba, ba), 0.0, 1.0); return length(pa - ba*h); }
float sgBox(vec2 p, vec2 b, float r){ vec2 d = abs(p) - b + r; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r; }
float sgTri(vec2 p, float r){ const float k = 1.7320508; p.x = abs(p.x) - r; p.y = p.y + r/k; if (p.x + k*p.y > 0.0) p = vec2(p.x - k*p.y, -k*p.x - p.y)/2.0; p.x -= clamp(p.x, -2.0*r, 0.0); return -length(p)*sign(p.y); }
// abstract emblems (p in -1..1): x = distance to the main-colour shape, y = to the second-colour shape
vec2 sgEmblem(vec2 p, float id){
  float A = 1e3, B = 1e3;
  if (id < 0.5){ vec2 c = vec2(0.44, 0.44); A = max(abs(length(p) - 0.62) - 0.11, -(length(p - c) - 0.31)); B = length(p - c) - 0.19; }
  else if (id < 1.5){ A = min(min(length(p - vec2(0.0, 0.46)), length(p - vec2(-0.47, -0.34))), length(p - vec2(0.47, -0.34))) - 0.27; B = length(p + vec2(0.0, 0.07)) - 0.11; }
  else if (id < 2.5){ A = max(max(abs(p.x) + abs(p.y) - 0.92, -(abs(p.x) - 0.07)), -(abs(p.x) + abs(p.y) - 0.34)); B = abs(p.x) + abs(p.y) - 0.22; }
  else if (id < 3.5){ for (int k = 0; k < 3; k++){ float fk = float(k); float d = max(abs(p.y - (fk - 1.0)*0.44 - 0.13*sin(p.x*5.0 + fk*1.3)) - 0.075, abs(p.x) - 0.86); if (k == 1) B = d; else A = min(A, d); } }
  else if (id < 4.5){ A = sgTri(p - vec2(-0.2, -0.14), 0.62); B = max(sgTri(p - vec2(0.4, -0.3), 0.42), -(sgTri(p - vec2(-0.2, -0.14), 0.62) - 0.06)); }
  else if (id < 5.5){ A = abs(sgBox(p + vec2(0.2, 0.2), vec2(0.5), 0.14)) - 0.085; B = max(abs(sgBox(p - vec2(0.2, 0.2), vec2(0.5), 0.14)) - 0.085, -(abs(sgBox(p + vec2(0.2, 0.2), vec2(0.5), 0.14)) - 0.16)); }
  else if (id < 6.5){ vec2 q = abs(p) - 0.45; float qd = length(q) - 0.36; A = (p.x*p.y > 0.0) ? qd : 1e3; B = (p.x*p.y < 0.0) ? abs(qd + 0.06) - 0.07 : 1e3; }
  else if (id < 7.5){ for (int k = 0; k < 3; k++){ float fk = float(k), hh = 0.32 + fk*0.27; float d = sgBox(p - vec2(-0.55 + fk*0.55, -0.86 + hh), vec2(0.17, hh), 0.05); A = min(A, d); } B = length(p - vec2(-0.55, 0.32)) - 0.15; }
  else if (id < 8.5){ A = max(length(p - vec2(-0.1, 0.0)) - 0.82, p.x + 0.1); B = max(length(p - vec2(0.12, -0.16)) - 0.62, -(p.x - 0.12)); }
  else if (id < 9.5){ float l = max(length(p - vec2(0.0, -0.52)) - 0.96, length(p - vec2(0.0, 0.52)) - 0.96); A = max(l, -(length(p) - 0.3)); B = length(p) - 0.17; }
  else if (id < 10.5){ vec2 o = p - vec2(0.0, -0.5); for (int k = 0; k < 3; k++){ float r = 0.36 + float(k)*0.27; float d = max(abs(length(o) - r) - 0.075, -o.y); if (k == 1) B = d; else A = min(A, d); } B = min(B, length(o) - 0.13); }
  else { vec2 q = vec2(p.x + p.y, p.y - p.x)*0.7071; vec2 cq = abs(q) - 0.4; A = sgBox(vec2(abs(q.x) - 0.4, abs(q.y) - 0.4), vec2(0.2), 0.06); B = abs(p.x) + abs(p.y) - 0.16; }
  return vec2(A, B);
}
// one abstract glyph (q: cell-local, band-height units, y -0.5..0.5); a stem plus one of bowl / bar / slant / arc / dot
float sgGlyph(vec2 q, float gi, float seed){
  float h1 = sgH2(vec2(gi, seed)), h2 = sgH2(vec2(gi + 31.7, seed)), h3 = sgH2(vec2(gi + 63.1, seed)), h4 = sgH2(vec2(gi + 97.3, seed));
  float sx = (floor(h1*3.0) - 1.0)*0.12, sg = h4 < 0.5 ? -1.0 : 1.0;
  float y0 = h2 < 0.62 ? -0.36 : -0.06, y1 = h2 > 0.28 ? 0.36 : 0.06;
  float d = sgSeg(q, vec2(sx, y0), vec2(sx, y1));
  float m = floor(h3*6.0);
  if (m < 0.5) d = min(d, abs(length(q - vec2(sx == 0.0 ? 0.17*sg : -sx*1.15, 0.17*sg)) - 0.16));
  else if (m < 1.5) d = min(d, sgSeg(q, vec2(-0.2, 0.36*sg*step(0.3, h2)), vec2(0.2, 0.36*sg*step(0.3, h2))));
  else if (m < 2.5) d = min(d, sgSeg(q, vec2(-0.21, -0.36*sg), vec2(0.21, 0.36*sg)));
  else if (m < 3.5) d = min(d, max(abs(length(q) - 0.3), q.x*sg));
  else if (m < 4.5) d = min(d, length(q - vec2(-sx - 0.14*sg, 0.3*sg)) - 0.02);
  else d = min(d, sgSeg(q, vec2(sx, 0.36), vec2(sx + 0.2*sg, 0.2)));
  return d;
}
// distance to the strokes of a glyph band (uv 0..1, n glyphs, band aspect asp = length/height), band-height units
float sgBand(vec2 uv, float n, float asp, float seed){
  float cw = asp/n, gx = uv.x*n, gi = floor(gx);
  vec2 q = vec2((fract(gx) - 0.5)*cw, uv.y - 0.5);
  float spc = sgH2(vec2(gi + 7.7, seed));
  if (spc < 0.13 && gi > 0.5 && gi < n - 1.5) return 1.0;
  return sgGlyph(q, gi, seed) - 0.068;
}
// LED screen programmes: abstract motion graphics, a new one every 7 s
vec3 sgLed(vec2 uv, float asp, float seed, float t){
  float T = t/7.0 + seed*13.0, sl = floor(T), f = fract(T);
  float pr = floor(sgH2(vec2(sl, seed*7.0))*5.0);
  vec3 c1 = sgHue(sgH2(vec2(sl*3.1, seed))), c2 = sgHue(fract(sgH2(vec2(sl*5.7, seed)) + 0.33));
  vec2 p = vec2(uv.x*asp, uv.y);
  vec3 col;
  if (pr < 0.5){
    col = mix(c1*0.25, c2*0.65, uv.y);
    vec2 cc = vec2(asp*(0.66 + 0.3*(1.0 - smoothstep(0.0, 0.3, f))), 0.56);
    float d = length(p - cc) - 0.27; col = mix(col, mix(vec3(1.0, 0.96, 0.9), c1, 0.25), smoothstep(0.012, -0.012, d));
    vec2 bu = vec2((uv.x - 0.06)/0.46, (uv.y - 0.16)/0.16);
    if (bu.x > 0.0 && bu.x < 1.0 && bu.y > 0.0 && bu.y < 1.0 && f > 0.12) col = mix(col, vec3(1.0), step(sgBand(bu, 6.0, asp*0.46/0.16, sl + seed), 0.0)*0.95);
  } else if (pr < 1.5){
    float s = fract((p.x + p.y)*1.6 - t*0.55); col = mix(c1, c2, smoothstep(0.45, 0.55, s))*0.85;
    col = mix(col, vec3(1.0), smoothstep(0.08, 0.0, abs(uv.y - 0.5) - 0.12)*0.0);
  } else if (pr < 2.5){
    float r = length(p - vec2(asp*(0.5 + 0.25*sin(t*0.6 + seed*9.0)), 0.5 + 0.2*cos(t*0.5)));
    col = mix(c1, c2, 0.5 + 0.5*sin(r*13.0 - t*3.0))*0.8;
  } else if (pr < 3.5){
    col = mix(c2*0.55, mix(c1, vec3(1.0, 0.85, 0.6), 0.4), uv.y);
    float sd = length(p - vec2(asp*0.3, 0.6 + 0.06*sin(t*0.8))) - 0.16; col = mix(col, vec3(1.0, 0.95, 0.8), smoothstep(0.01, -0.01, sd));
    float hl = 0.3 + 0.07*sin(p.x*3.0 + t*0.4) + 0.03*sin(p.x*9.0 - t); col = mix(col, c2*0.22, step(uv.y, hl));
  } else {
    vec2 gq = floor(p*vec2(5.0, 5.0)); float hh = sgH2(gq + sl);
    col = sgHue(fract(hh*0.25 + sgH2(vec2(sl, 3.0))))*(0.35 + 0.65*step(0.5, fract(hh*7.0 + f*2.0)));
  }
  return col*smoothstep(0.0, 0.035, f)*(1.0 - smoothstep(0.965, 1.0, f));
}`;
  function mats(){
    if (MA) return;
    MA = new THREE.MeshLambertMaterial({color:0xffffff, polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-2});
    MA.extensions = {derivatives:true};
    MA.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, {uT:LMT, uN:U.uN, uLH:U.uLH, uDim:U.uDim});
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec2 aUv;
attribute vec4 aK;
attribute vec4 aCA;
attribute vec4 aCB;
uniform float uLH;
varying vec2 vSU;
varying vec4 vSK;
varying vec4 vSA;
varying vec4 vSB;
varying float vSOn;`).replace('#include <begin_vertex>', `#include <begin_vertex>
vSU = aUv; vSK = aK; vSA = aCA; vSB = aCB; vSOn = aCB.a > 0.998 ? 1.0 : step(uLH, aCB.a*8.0);`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform float uT;
uniform float uN;
uniform float uDim;
varying vec2 vSU;
varying vec4 vSK;
varying vec4 vSA;
varying vec4 vSB;
varying float vSOn;
${GLSL_COMMON}`).replace('#include <map_fragment>', `vec3 sgEm = vec3(0.0);
{
  float kind = vSK.x, nOn = uN*vSOn;
  if (kind < 0.5){ diffuseColor.rgb = vSA.rgb; }
  else if (kind < 1.5){
    vec2 p = vSU*2.0 - 1.0; vec2 d = sgEmblem(p, vSK.z);
    float aa = max(fwidth(p.x), 1e-4)*0.8, mA = smoothstep(aa, -aa, d.x), mB = smoothstep(aa, -aa, d.y);
    float far = smoothstep(0.05, 0.16, fwidth(p.x))*uN;
    float m = max(mA, mB); if (max(m, far*0.6) < 0.5) discard;
    vec3 c = mB > mA ? vSB.rgb : vSA.rgb;
    c = mix(c, mix(vSA.rgb, vSB.rgb, 0.35)*0.7, far*(1.0 - m));
    diffuseColor.rgb = c*0.92; sgEm = c/max(max(c.r, c.g), max(c.b, 0.05))*1.2*nOn*uDim;
  } else if (kind < 2.5){
    float d = sgBand(vSU, vSK.z, vSK.w, vSK.y);
    float aa = max(fwidth(vSU.y), 1e-4)*0.75, m = smoothstep(aa, -aa, d);
    float far = smoothstep(0.35, 0.9, fwidth(vSU.x*vSK.z))*uN;
    if (max(m, far*0.6) < 0.5) discard;
    float gl = sgH2(vec2(floor(vSU.x*vSK.z), vSK.y)); gl = gl < 0.13 ? 0.08 : 0.45 + 0.4*gl;
    vec3 c = vSA.rgb*mix(1.0, gl, far*(1.0 - m));
    diffuseColor.rgb = c*0.92; sgEm = c/max(max(vSA.r, vSA.g), max(vSA.b, 0.05))*1.2*nOn*uDim;
  } else if (kind < 3.5){
    vec3 c = sgLed(vSU, vSK.z, vSK.y, uT);
    float px = fwidth(vSU.y*vSK.w*10.0);
    vec2 g = fract(vSU*vec2(vSK.z*vSK.w, vSK.w)*10.0);
    float dots = mix(smoothstep(0.85, 0.55, length(g - 0.5)*1.4), 0.62, smoothstep(0.25, 0.8, px));
    diffuseColor.rgb = vec3(0.035);
    sgEm = c*dots*mix(0.6, 1.05, uN)*mix(1.0, vSOn, step(0.01, uN))*uDim;
  } else if (kind < 4.5){
    vec2 mm = vSU*vec2(vSK.z, vSK.w)/0.6, cell = floor(mm), g = fract(mm) - 0.5;
    float fp = fwidth(mm.x), dots = mix(smoothstep(0.32, 0.18, length(g)), 0.35, smoothstep(0.3, 0.9, fp));
    vec2 q = cell*0.6;
    float w = sin(q.x*0.16 + q.y*0.1 - uT*1.1 + vSK.y*20.0)*0.6 + 0.4*sin(length(q - vec2(vSK.z*0.5, 4.0))*0.35 - uT*1.7);
    vec3 c = sgHue(fract(q.x*0.006 + uT*0.02 + vSK.y))*0.6 + 0.4*vec3(0.92, 0.95, 1.0);
    diffuseColor.rgb = mix(vec3(0.2, 0.22, 0.24), vec3(0.3, 0.32, 0.34), dots);
    sgEm = c*dots*(0.2 + 0.8*smoothstep(-0.3, 0.9, w))*nOn*0.95;
  }
}`).replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += sgEm;`);
    };
    MA.customProgramCacheKey = () => 'sgcrownA1';
    MB = new THREE.ShaderMaterial({
      uniforms:{uT:LMT, uN:U.uN, uLH:U.uLH, uDim:U.uDim, fN:U.fN, fF:U.fF},
      vertexShader:`attribute vec2 aUv;
attribute vec4 aCol;
attribute vec4 aMd;
uniform float uT;
uniform float uN;
uniform float uLH;
uniform float uDim;
varying vec2 vUv2;
varying vec3 vC;
varying float vDist;
vec3 sgHue(float h){ return clamp(abs(mod(h*6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
void main(){
  vec4 mv = modelViewMatrix*vec4(position, 1.0);
  gl_Position = projectionMatrix*mv; vDist = -mv.z; vUv2 = aUv;
  float on = uN*uDim*(aMd.z > 0.998 ? 1.0 : step(uLH, aMd.z*8.0));
  vec3 c = aCol.rgb;
  if (aMd.x > 0.5) c = mix(sgHue(fract(uT*0.035 + aMd.y)), vec3(1.0), 0.45)*(0.75 + 0.25*sin(uT*1.3 + aMd.y*30.0));
  vC = c*aCol.a*on*(1.0 + 1.5*clamp((vDist - 300.0)/1500.0, 0.0, 1.0));      // far signs glow more (they read as glows, like in photos)
  if (on < 0.002) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
}`,
      fragmentShader:`uniform float fN;
uniform float fF;
varying vec2 vUv2;
varying vec3 vC;
varying float vDist;
void main(){
  vec2 q = abs(vUv2);
  float I = pow(max(0.0, 1.0 - q.x*q.x), 1.6)*pow(max(0.0, 1.0 - q.y*q.y), 1.6);
  gl_FragColor = vec4(vC*I*(1.0 - smoothstep(fN, fF, vDist)), 1.0);
}`,
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide
    });
  }

  // ---------------- (re)build the two meshes ----------------
  function dispose(m){ if (!m) return; scene.remove(m); m.geometry.dispose(); }
  function rebuild(){
    dirty = false; lastBuild = frameN; STATS.builds++;
    const G = new Geo(), HB = new Halo(), seen = new Set(), all = [];
    for (const v of LMPL.values()) all.push(...v.items);
    for (const v of REALPL.values()) all.push(...v);
    for (const it of all){ if (seen.has(it.sp.id) || crDead(it)) continue; seen.add(it.sp.id); writeSign(G, HB, it); }
    STATS.placed = seen.size;
    mats();
    dispose(meshA); dispose(meshB); meshA = meshB = null;
    if (!G.I.length) return;
    const ga = new THREE.BufferGeometry();
    ga.setAttribute('position', new THREE.Float32BufferAttribute(G.P, 3)); ga.setAttribute('normal', new THREE.Float32BufferAttribute(G.N, 3));
    ga.setAttribute('aUv', new THREE.Float32BufferAttribute(G.U, 2)); ga.setAttribute('aK', new THREE.Float32BufferAttribute(G.K, 4));
    ga.setAttribute('aCA', new THREE.Float32BufferAttribute(G.CA, 4)); ga.setAttribute('aCB', new THREE.Float32BufferAttribute(G.CB, 4));
    ga.setIndex(G.I); ga.computeBoundingSphere();
    meshA = new THREE.Mesh(ga, MA); meshA.name = 'sgcrownA'; meshA.receiveShadow = true; meshA.castShadow = false; meshA.matrixAutoUpdate = false; meshA.renderOrder = 1;
    scene.add(meshA);
    STATS.tris = G.I.length/3;
    if (HB.I.length){
      const gb = new THREE.BufferGeometry();
      gb.setAttribute('position', new THREE.Float32BufferAttribute(HB.P, 3)); gb.setAttribute('aUv', new THREE.Float32BufferAttribute(HB.U, 2));
      gb.setAttribute('aCol', new THREE.Float32BufferAttribute(HB.C, 4)); gb.setAttribute('aMd', new THREE.Float32BufferAttribute(HB.M, 4));
      gb.setIndex(HB.I); gb.computeBoundingSphere();
      meshB = new THREE.Mesh(gb, MB); meshB.name = 'sgcrownB'; meshB.renderOrder = 6; meshB.matrixAutoUpdate = false; meshB.visible = U.uN.value > 0.002;
      scene.add(meshB); STATS.halos = HB.I.length/6;
    }
  }

  // ---------------- hooks ----------------
  function frame(){
    frameN++;
    if (!SGR.on){ if (meshA) meshA.visible = false; if (meshB) meshB.visible = false; return; }
    if (!inited) init();
    if (lmMore || frameN % 20 === 1) lmMore = checkLandmarks(25);
    if (dirty && !lmMore && frameN - lastBuild > 10) rebuild();
    if (scene.fog){ U.fN.value = scene.fog.near; U.fF.value = scene.fog.far; }
    U.uDim.value = typeof LMS !== 'undefined' ? 0.75 + 0.25*LMS.dim.value : 1;
    const d = Math.hypot(camera.position.x - CEN[0], camera.position.z + CEN[1], camera.position.y*0.5);
    if (meshA) meshA.visible = d < 16000;
    if (meshB) meshB.visible = d < 18000 && U.uN.value > 0.002;
  }
  function time(tod, nf){
    U.uN.value = sm(0.05, 0.6, nf);
    U.uLH.value = (tod >= 22 || tod < 7) ? (tod < 12 ? tod + 24 : tod) - 22 : 0;
  }
  const API = {SPEC, STATS, U, claims, tileHook, frame, time, rebuild:() => { dirty = true; },
    flush(){ if (!inited) init(); lmMore = checkLandmarks(Infinity); rebuild(); return STATS.placed; },
    get items(){ const a = []; for (const v of LMPL.values()) a.push(...v.items); for (const v of REALPL.values()) a.push(...v); return a; },
    // where the signs are, for checks: [{id, lat, lon, h, az}]
    list(){ return this.items.map(it => ({id:it.sp.id, k:it.sp.k, cx:+(it.px - it.ny*it.s).toFixed(1), cy:+(it.py + it.nx*it.s).toFixed(1), nx:+it.nx.toFixed(3), ny:+it.ny.toFixed(3), lat:+(1.315 + it.py/110574).toFixed(6), lon:+(103.845 + it.px/111290.5).toFixed(6), y:+it.y.toFixed(1), w:+it.w.toFixed(1), h:+it.h.toFixed(1), az:Math.round((Math.atan2(it.nx, it.ny)/D2R + 360) % 360), top:it.top ? +it.top.toFixed(1) : null})); },
    get meshes(){ return [meshA, meshB]; }, version:'crown-1',
    // the real buildings this module signs (for lm20/signs or other decorators): point inside the building, min height, kind, bearing
    skipList(){ return REAL.map(sp => ({id:sp.id, lat:sp.at[0], lon:sp.at[1], minH:sp.minH, k:sp.k, az:sp.az})); },
    // camera in front of a sign (test shots): dist m out along its normal, dh m above it, turned yaw deg round it
    lookAt(id, dist, dh, yaw){ const it = this.items.find(q => q.sp.id === id); if (!it) return 'no ' + id; const cx = it.px - it.ny*it.s, cy = it.py + it.nx*it.s, a = Math.atan2(it.nx, it.ny) + (yaw || 0)*D2R;
      camera.position.set(cx + Math.sin(a)*dist, it.y + dh, -(cy + Math.cos(a)*dist)); controls.target.set(cx, it.y, -cy); controls.update(); if (typeof lodTick === 'function') lodTick(); return id; },
    // screen positions of the signs in view (for test shots): 'id x,y' (1280 x 800 canvas pixels)
    screen(){ const v = new THREE.Vector3(), W = renderer.domElement.clientWidth, H = renderer.domElement.clientHeight, out = [];
      camera.updateMatrixWorld(); for (const it of this.items){ const cx = it.px - it.ny*it.s, cy = it.py + it.nx*it.s; v.set(cx, it.y, -cy).project(camera); if (v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1) out.push(it.sp.id + ' ' + Math.round((v.x + 1)/2*W) + ',' + Math.round((1 - v.y)/2*H)); } return out.join('; '); },
    // cross-section of a placed landmark at a height above its base (world segments near it), for checks
    // distances to the outermost face of a landmark tower from a local anchor at heights ys and bearings azs
    probe(key, tw, ys, azs, tr){ const L = landmarks.find(q => q.type === key), g = L && lmMeshes.get(L.id); if (!g) return null; const c = Math.cos(L.rot), s = Math.sin(L.rot), ax = L.x + tw[0]*c + tw[1]*s, ay = L.y + tw[0]*s - tw[1]*c;
      const S = sections(g, ys.map(y => (L.top || 0) + y)); return ys.map((y, i) => y + ':' + azs.map(a => { const H = ray2(S[i], ax, ay, Math.sin(a*D2R), Math.cos(a*D2R), tr || 40); return H.length ? H[H.length - 1].t.toFixed(0) + '/' + Math.round((Math.atan2(H[H.length - 1].nx, H[H.length - 1].ny)/D2R + 360) % 360) : '-'; }).join(',')).join(' '); },
    debugSec(key, y){ const L = landmarks.find(q => q.type === key), g = L && lmMeshes.get(L.id); if (!g) return null; const S = sections(g, [(L.top || 0) + y])[0]; return {x:L.x, y:L.y, rot:L.rot, seg:Array.from(S, v => Math.round(v*10)/10)}; }};
  return API;
})();
if (typeof HOOKS !== 'undefined'){
  HOOKS.tile.push((T, list, skip) => SGCrown.tileHook(T, list, skip));
  HOOKS.time.push((tod, nf) => SGCrown.time(tod, nf));
  HOOKS.frame.push(() => SGCrown.frame());
}
if (typeof window !== 'undefined') window.SGCrown = SGCrown;
}
