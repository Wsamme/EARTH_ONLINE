// ===== City Brush v33 · lm30/nav — 导航与大地图 Navigation and the big map (Singapore, SF Bay Area, New York; one module) =====
// "开车可以导航，看大地图": turn-by-turn navigation while driving and a full-screen map of the whole city.
// - Routing graph (NAVG, below): all drivable roads of the map (classes 0-10), junctions found from shared vertices, T and X
//   junctions of the simplified US data, levels (flyovers), one-way lines, tunnel mouths; built once, lazily (when the player
//   drives, opens the map or a module asks for a route) as a generator run a few ms per frame (the page never freezes); edge-based
//   A* on travel time with turn penalties, highways preferred on long trips, resumable in slices too. Node tests: lm30/nav/test.
// - Navigation: a destination from the big map (click / tap), a search (landmarks, sites, places, POIs, stations, roads), the
//   favourites / recent list, or another module (SGNav.setDest); the route from the car (or, not driving, from the view); a route
//   ribbon on the road in 3D (chevrons flowing ahead, glowing at night, in the driving lane: left in Singapore, right in the US),
//   a beacon at the destination, the route and markers on the drive minimap, a turn card in the drive HUD (arrow drawn from the
//   real turn angle, distance to the turn, the next road, the remaining distance and time; "turn left / right / around to the route"
//   when the car does not point along it), re-routing when the car leaves the route or drives the wrong way (a banner), arrival
//   (banner, callback). Keys while driving: N = destination (the map with the search), M = big map (the drive sound moved to K
//   by lm30/nav/patch_f1d.py); not driving: M = big map, N = search (Shift+M keeps the tilt-shift toggle). Touch: the 导航 / 地图
//   buttons, tap the minimap.
// - Big map: the city's ground texture (water, parks, land use) washed light, roads by class drawn into cached tiles (256 px x
//   device pixels, rendered a slice per frame, kept in an LRU), rail lines, place names by zoom, landmarks, POIs, stations, the
//   car and its heading (or the view), the route, the destination, markers from providers; pan (drag), zoom (wheel, pinch, + / -),
//   centre on the car, click = set the destination (driving) or a card with 飞到这里 Fly here / 设为目的地 Set destination.
// API (window.SGNav; guard every call: window.SGNav && SGNav.f && SGNav.f(...)):
//   open({search}) / close() / toggle(); isOpen
//   setDest(x, y, {label, color, kind, r, onArrive, beacon}) world metres (x east, y north); clearDest()
//   route() -> {pts:[[x, y] ...] (the rest of the route from the car), len (m, remaining), eta (s), next:{x, y, turn, dist}} | null
//   markers(id, fn): fn() -> [{x, y, icon, color, label, r, pulse}] drawn on the minimap and the big map; markers(id, null) removes.
//     Built-in providers (replaceable by id): '_race' (city race gates), '_creature' (the creature; skipped when another provider
//     returns a marker with icon 'creature'), '_players' (other players in a room). icon: 'creature' | 'checkpoint' | 'flag' | 'star'
//     | 'car' | 'pin' | any emoji / short text.
//   on (bool, navigation active), state(), search(q), graph() (stats), _test {...}
{
//<NAVG>
// ---- the routing core: pure functions of the decoded road lines (no DOM, no three.js); the node tests run this part on the staged
// data (lm30/nav/test/navtest.js). Graph: every drivable line (classes 0-10, not foreign context) split at its junctions into pieces;
// junctions = vertices shared by two lines at the same level (E within 2.5 m; line ends also join a level step up to 20 m), a vertex
// of one line on another line's segment, and two segments crossing at ground level (the simplified US data); tunnel mouths are dead
// ends. Each piece is a directed edge each way (one-way lines: the drawing direction only); the largest strongly connected part is
// used. The build is a generator: it yields every few thousand steps so the page can run it in slices (a few ms per frame).
// Search: edge-based A* (the state is the directed edge just driven) on travel time (metres / class speed, small roads cost more on
// long trips away from both ends: highways preferred), turn penalties (crossing the oncoming traffic costs more: right turns in
// Singapore, left turns in the US maps), no U-turns except at the start (penalised); resumable in slices too.
const NAVG = (() => {
  const SPD = [25, 16.7, 19.4, 13.9, 15.3, 11.1, 13.3, 10.6, 11.7, 8.9, 8.3];   // m/s by class 0-10 (90 60 70 50 55 40 48 38 42 32 30 km/h)
  const VMAX = 25, MAXC = 10, sq = Math.sqrt;
  // ---- a small open-addressing hash: integer pair (ix, iy) -> int ----
  function IH(bits){ const cap = 1 << bits; return {cap, mask:cap - 1, kx:new Int32Array(cap), ky:new Int32Array(cap), v:new Int32Array(cap).fill(-1), n:0}; }
  function ihSlot(H, ix, iy){ let h = (Math.imul(ix, 73856093) ^ Math.imul(iy, 19349663)) & H.mask;
    while (H.v[h] !== -1 && (H.kx[h] !== ix || H.ky[h] !== iy)) h = (h + 1) & H.mask; return h; }
  function ihGrow(H){ const o = H; const N = IH(Math.log2(o.cap) + 1); for (let i = 0; i < o.cap; i++) if (o.v[i] !== -1){ const s = ihSlot(N, o.kx[i], o.ky[i]); N.kx[s] = o.kx[i]; N.ky[s] = o.ky[i]; N.v[s] = o.v[i]; N.n++; } return N; }

  // ---- build: lines -> graph (generator; yields a progress fraction 0..1) ----
  // the work of each phase is a plain function over an index range (fast, optimisable); run() calls it in chunks sized to ~2 ms and
  // yields when the slice time is used up
  // fn(i0, n, deadline) -> the next index: it checks the clock every few items and stops at the deadline
  function* run(Y, n, fn, p0, p1){ let i = 0; while (i < n){ i = fn(i, n, Y.t); if (Date.now() >= Y.t){ yield p0 + (p1 - p0)*i/n; if (!Y.ext) Y.t = Date.now() + Y.sl; } } }
  const DN = Date.now;
  function* build(lines, opts){
    opts = opts || {}; const t0 = Date.now(), n = lines.length, HALF = opts.HALF || 40000, Y = opts.Y || {sl:opts.slice || 4, t:Date.now() + (opts.slice || 4)};
    const ok = new Uint8Array(n); let nv = 0;
    yield* run(Y, n, (li, n, dl) => { for (; li < n; li++){ if ((li & 1023) === 0 && DN() > dl) return li; const l = lines[li]; if (l.c <= MAXC && !(l.flags & 8) && l.P.length >= 4){ ok[li] = 1; nv += l.P.length >> 1; } } return li; }, 0, 0.01);
    // (1) vertex use counts (line ends count twice)
    let H = IH(Math.max(16, Math.ceil(Math.log2(nv*1.6 + 64)))); yield 0.01;
    yield* run(Y, n, (li, n, dl) => { for (; li < n; li++){ if ((li & 63) === 0 && DN() > dl) return li; if (!ok[li]) continue; const P = lines[li].P, m = P.length >> 1;
      for (let k = 0; k < m; k++){ const ix = Math.round(P[2*k]*4), iy = Math.round(P[2*k + 1]*4), s = ihSlot(H, ix, iy), w = (k === 0 || k === m - 1) ? 2 : 1;
        if (H.v[s] === -1){ H.kx[s] = ix; H.ky[s] = iy; H.v[s] = w; H.n++; if (H.n*1.4 > H.cap) H = ihGrow(H); } else H.v[s] += w; } } return li; }, 0, 0.08);
    const cntAt = (x, y) => { const s = ihSlot(H, Math.round(x*4), Math.round(y*4)); return H.v[s] === -1 ? 0 : H.v[s]; };
    // (2) segment grid (64 m cells, exact cell traversal), CSR in two passes
    const CS = 64, GN = Math.ceil(2*HALF/CS) + 4, G0 = -HALF - 2*CS, cl = v => { const c = Math.floor((v - G0)/CS); return c < 0 ? 0 : c >= GN ? GN - 1 : c; };
    let nSeg = 0; for (let li = 0; li < n; li++) if (ok[li]) nSeg += (lines[li].P.length >> 1) - 1;
    const SL = new Int32Array(nSeg), SK = new Int32Array(nSeg); { let id = 0; for (let li = 0; li < n; li++){ if (!ok[li]) continue; const m = lines[li].P.length >> 1; for (let k = 0; k < m - 1; k++){ SL[id] = li; SK[id] = k; id++; } } }
    const cStart = new Int32Array(GN*GN + 1); let cItem = null, cFill = null;
    // the cells a segment passes through (DDA); pass 0 counts, pass 1 fills
    const walk = (id, pass) => { const P = lines[SL[id]].P, k = SK[id], ax = P[2*k], ay = P[2*k + 1], bx = P[2*k + 2], by = P[2*k + 3];
      let cx = cl(ax), cy = cl(ay); const ex = cl(bx), ey = cl(by), dx = bx - ax, dy = by - ay, sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1;
      let tx = dx !== 0 ? (sx > 0 ? G0 + (cx + 1)*CS - ax : ax - (G0 + cx*CS))/Math.abs(dx) : Infinity, ty = dy !== 0 ? (sy > 0 ? G0 + (cy + 1)*CS - ay : ay - (G0 + cy*CS))/Math.abs(dy) : Infinity;
      const ddx = dx !== 0 ? CS/Math.abs(dx) : Infinity, ddy = dy !== 0 ? CS/Math.abs(dy) : Infinity; let g = 0, c = cy*GN + cx;
      if (pass) cItem[cFill[c]++] = id; else cStart[c + 1]++;
      while ((cx !== ex || cy !== ey) && g++ < 4000){ if (tx < ty){ tx += ddx; cx += sx; } else { ty += ddy; cy += sy; } c = cy*GN + cx; if (pass) cItem[cFill[c]++] = id; else cStart[c + 1]++; } };
    yield* run(Y, nSeg, (id, n, dl) => { for (; id < n; id++){ if ((id & 511) === 0 && DN() > dl) return id; walk(id, 0); } return id; }, 0.08, 0.13);
    for (let i = 0; i < GN*GN; i++) cStart[i + 1] += cStart[i];
    cItem = new Int32Array(cStart[GN*GN]); cFill = cStart.slice(0, GN*GN);
    yield* run(Y, nSeg, (id, n, dl) => { for (; id < n; id++){ if ((id & 511) === 0 && DN() > dl) return id; walk(id, 1); } return id; }, 0.13, 0.18);
    cFill = null;
    // cut points per line: [f (vertex index, fractional inside a segment), x, y, e]
    const cuts = new Array(n); let ncut = 0; const addCut = (li, f, x, y, e) => { (cuts[li] || (cuts[li] = [])).push([f, x, y, e]); ncut++; };
    const Ez = (l, k, t) => l.E ? l.E[k] + (l.E[k + 1] - l.E[k])*t : 0;
    const portal = (l, k, m) => (k === 0 && (l.flags & 64)) || (k === m - 1 && (l.flags & 128));
    // (3) a vertex of one line on another line's segment (same level)
    yield* run(Y, n, (li, n, dl) => { for (; li < n; li++){ if ((li & 7) === 0 && DN() > dl) return li; if (!ok[li]) continue; const l = lines[li], P = l.P, m = P.length >> 1;
      for (let k = 0; k < m; k++){ if (portal(l, k, m)) continue; const x = P[2*k], y = P[2*k + 1], e = l.E ? l.E[k] : 0, cx = cl(x), cy = cl(y), fx = x - (G0 + cx*CS), fy = y - (G0 + cy*CS);
        const x0 = fx < 1 ? cx - 1 : cx, x1 = fx > CS - 1 ? cx + 1 : cx, y0 = fy < 1 ? cy - 1 : cy, y1 = fy > CS - 1 ? cy + 1 : cy; let hit = false;
        for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++){ const c = gy*GN + gx;
          for (let q = cStart[c]; q < cStart[c + 1]; q++){ const id = cItem[q], l2 = SL[id]; if (l2 === li) continue; const k2 = SK[id], Q = lines[l2].P, ax = Q[2*k2], ay = Q[2*k2 + 1], dx = Q[2*k2 + 2] - ax, dy = Q[2*k2 + 3] - ay, ll = dx*dx + dy*dy;
            if (ll < 1) continue; const t = ((x - ax)*dx + (y - ay)*dy)/ll; if (t <= 0 || t >= 1) continue; const L2 = sq(ll); if (t*L2 < 0.6 || (1 - t)*L2 < 0.6) continue;
            const px = ax + dx*t - x, py = ay + dy*t - y; if (px*px + py*py > 0.5625) continue; const e2 = Ez(lines[l2], k2, t); if (Math.abs(e2 - e) >= 2.5) continue;
            addCut(l2, k2 + t, x, y, e2); hit = true; } }
        if (hit) addCut(li, k, x, y, e); } } return li; }, 0.18, 0.4);
    // (4) two segments crossing at ground level (the crossing point belongs to one cell: each pair is found once)
    const gl = li => { const l = lines[li]; return l.c >= 2 && !(l.flags & 2); };
    yield* run(Y, GN*GN, (c, n, dl) => { for (; c < n; c++){ if ((c & 255) === 0 && DN() > dl) return c; const a0 = cStart[c], a1 = cStart[c + 1]; if (a1 - a0 < 2) continue; const cy = Math.floor(c/GN), cx = c - cy*GN;
      for (let i = a0; i < a1; i++){ const a = cItem[i], la = SL[a]; if (!gl(la)) continue; const A = lines[la], P = A.P, ka = SK[a]; if (A.E && (A.E[ka] > 1.5 || A.E[ka + 1] > 1.5)) continue;
        const ax = P[2*ka], ay = P[2*ka + 1], adx = P[2*ka + 2] - ax, ady = P[2*ka + 3] - ay;
        for (let j = i + 1; j < a1; j++){ const b = cItem[j], lb = SL[b]; if (lb === la || !gl(lb)) continue; const B = lines[lb], Q = B.P, kb = SK[b]; if (B.E && (B.E[kb] > 1.5 || B.E[kb + 1] > 1.5)) continue;
          const bx = Q[2*kb], by = Q[2*kb + 1], bdx = Q[2*kb + 2] - bx, bdy = Q[2*kb + 3] - by;
          const den = adx*bdy - ady*bdx; if (den === 0) continue; const t = ((bx - ax)*bdy - (by - ay)*bdx)/den, u = ((bx - ax)*ady - (by - ay)*adx)/den;
          if (t <= 0 || t >= 1 || u <= 0 || u >= 1) continue; const La = sq(adx*adx + ady*ady), Lb = sq(bdx*bdx + bdy*bdy);
          if (t*La < 0.6 || (1 - t)*La < 0.6 || u*Lb < 0.6 || (1 - u)*Lb < 0.6) continue;
          const x = ax + adx*t, y = ay + ady*t; if (cl(x) !== cx || cl(y) !== cy) continue;
          addCut(la, ka + t, x, y, Ez(A, ka, t)); addCut(lb, kb + u, x, y, Ez(B, kb, u)); } } } return c; }, 0.4, 0.5);
    cItem = null;
    // (5) nodes and pieces; a node is keyed by its 0.25 m position and its level (a chain of nodes per key)
    // capacities: nodes <= line ends + cut points (+ shared vertices); piece vertices <= vertices + 2 per cut; pieces <= lines + cuts + shared vertices
    let nLn = 0; for (let li = 0; li < n; li++) if (ok[li]) nLn++;
    const capN = 2*nLn + ncut + (H.n >> 1) + 64, capV = nv + 2*ncut + 2*nLn + 64, capP = nLn + ncut + (H.n >> 1) + 64;
    let nNn = 0, nPp = 0, nVv = 0;
    const NX = new Float64Array(capN), NY = new Float64Array(capN), NZ = new Float32Array(capN), NEND = new Uint8Array(capN), NNEXT = new Int32Array(capN); let NH = IH(Math.max(16, Math.ceil(Math.log2(nv*0.5 + 64))));
    const nodeAt = (x, y, e, end) => { const ix = Math.round(x*4), iy = Math.round(y*4), s = ihSlot(NH, ix, iy); let id = NH.v[s];
      for (let q = id; q >= 0; q = NNEXT[q]) if (Math.abs(NZ[q] - e) < 2.5){ if (end) NEND[q] = 1; return q; }
      for (let q = id; q >= 0; q = NNEXT[q]) if ((end || NEND[q]) && Math.abs(NZ[q] - e) <= 20){ if (end) NEND[q] = 1; return q; }
      const nid = nNn++; NX[nid] = x; NY[nid] = y; NZ[nid] = e; NEND[nid] = end ? 1 : 0; NNEXT[nid] = id;
      if (id === -1){ NH.kx[s] = ix; NH.ky[s] = iy; NH.n++; } NH.v[s] = nid; if (NH.n*1.4 > NH.cap){ const o = NH; NH = ihGrow(o); } return nid; };
    const solo = (x, y, e) => { const id = nNn++; NX[id] = x; NY[id] = y; NZ[id] = e; NEND[id] = 0; NNEXT[id] = -1; return id; };
    const pLi = new Int32Array(capP), pA = new Int32Array(capP), pB = new Int32Array(capP), pLen = new Float32Array(capP), pE = new Float32Array(capP), pC = new Uint8Array(capP), pOw = new Uint8Array(capP), pOff = new Int32Array(capP), pN = new Int32Array(capP),
      VX = new Float32Array(capV), VY = new Float32Array(capV), VE = new Float32Array(capV);
    yield* run(Y, n, (li, n, dl) => { for (; li < n; li++){ if ((li & 15) === 0 && DN() > dl) return li; if (!ok[li]) continue; const l = lines[li], P = l.P, E = l.E, m = P.length >> 1, ow = (l.flags & 1) ? 1 : 0;
      const C = []; for (let k = 0; k < m; k++) if (k === 0 || k === m - 1 || cntAt(P[2*k], P[2*k + 1]) >= 2) C.push([k, P[2*k], P[2*k + 1], E ? E[k] : 0]);
      const X = cuts[li]; if (X){ for (const c of X) C.push(c); cuts[li] = null; }
      C.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
      let prev = C[0], a = (l.flags & 64) ? solo(prev[1], prev[2], prev[3]) : nodeAt(prev[1], prev[2], prev[3], true);
      for (let i = 1; i < C.length; i++){ const cu = C[i]; if (cu[0] - prev[0] < 1e-9 && cu[1] === prev[1] && cu[2] === prev[2]) continue;
        const end = cu[0] === m - 1, b = end && (l.flags & 128) ? solo(cu[1], cu[2], cu[3]) : nodeAt(cu[1], cu[2], cu[3], end), off = nVv;
        VX[nVv] = prev[1]; VY[nVv] = prev[2]; VE[nVv++] = prev[3];
        for (let k = Math.floor(prev[0]) + 1; k < cu[0]; k++){ VX[nVv] = P[2*k]; VY[nVv] = P[2*k + 1]; VE[nVv++] = E ? E[k] : 0; }
        VX[nVv] = cu[1]; VY[nVv] = cu[2]; VE[nVv++] = cu[3];
        let len = 0, em = 0; for (let j = off + 1; j < nVv; j++){ const dx = VX[j] - VX[j - 1], dy = VY[j] - VY[j - 1]; len += sq(dx*dx + dy*dy); } for (let j = off; j < nVv; j++) if (VE[j] > em) em = VE[j];
        if (b !== a || len > 1){ const q = nPp++; pLi[q] = li; pA[q] = a; pB[q] = b; pLen[q] = len; pE[q] = em; pC[q] = l.c; pOw[q] = ow; pOff[q] = off; pN[q] = nVv - off; }
        else nVv = off;
        a = b; prev = cu; } } return li; }, 0.5, 0.68);
    H = null; NH = null;
    const nN = nNn, nP = nPp, nE = nP*2, G = {nN, nP, nE, HALF};
    const SRCA = [['NX', NX, nN], ['NY', NY, nN], ['NZ', NZ, nN], ['pLi', pLi, nP], ['pA', pA, nP], ['pB', pB, nP], ['pLen', pLen, nP], ['pE', pE, nP],
      ['pC', pC, nP], ['pOw', pOw, nP], ['pOff', pOff, nP], ['pN', pN, nP], ['VX', VX, nVv], ['VY', VY, nVv], ['VE', VE, nVv]];
    for (const [k, A, m] of SRCA){ G[k] = A.slice(0, m); if (Date.now() > Y.t){ yield 0.7; if (!Y.ext) Y.t = Date.now() + Y.sl; } }
    const GX = G.VX, GY = G.VY;
    // directions at both ends of a piece (over its first / last ~15 m): sd = leaving the start, ed = arriving at the end
    const SDX = new Float32Array(nP), SDY = new Float32Array(nP), EDX = new Float32Array(nP), EDY = new Float32Array(nP), eTo = new Int32Array(nE), eFrom = new Int32Array(nE), valid = new Uint8Array(nE);
    yield* run(Y, nP, (p, n, dl) => { for (; p < n; p++){ if ((p & 255) === 0 && DN() > dl) return p; const k0 = G.pOff[p], k1 = k0 + G.pN[p] - 1;
      let k = k0, d = 0; while (k < k1 && d < 15){ const dx = GX[k + 1] - GX[k], dy = GY[k + 1] - GY[k]; d += sq(dx*dx + dy*dy); k++; }
      let ax = GX[k] - GX[k0], ay = GY[k] - GY[k0], al = sq(ax*ax + ay*ay) || 1; SDX[p] = ax/al; SDY[p] = ay/al;
      k = k1; d = 0; while (k > k0 && d < 15){ const dx = GX[k] - GX[k - 1], dy = GY[k] - GY[k - 1]; d += sq(dx*dx + dy*dy); k--; }
      let bx = GX[k1] - GX[k], by = GY[k1] - GY[k], bl = sq(bx*bx + by*by) || 1; EDX[p] = bx/bl; EDY[p] = by/bl;
      const f = 2*p, r = f + 1; eFrom[f] = G.pA[p]; eTo[f] = G.pB[p]; valid[f] = 1; eFrom[r] = G.pB[p]; eTo[r] = G.pA[p]; valid[r] = G.pOw[p] ? 0 : 1; } return p; }, 0.72, 0.76);
    Object.assign(G, {SDX, SDY, EDX, EDY, eTo, eFrom, valid});
    // out / in adjacency (CSR)
    const csr = key => { const S = new Int32Array(nN + 1); for (let e = 0; e < nE; e++) if (valid[e]) S[key[e] + 1]++; for (let i = 0; i < nN; i++) S[i + 1] += S[i];
      const L = new Int32Array(S[nN]), w = S.slice(0, nN); for (let e = 0; e < nE; e++) if (valid[e]) L[w[key[e]]++] = e; return [S, L]; };
    [G.oS, G.oE] = csr(eFrom); yield 0.78; const [iS, iE] = csr(eTo); yield 0.8;
    const deg = new Uint8Array(nN); for (let p = 0; p < nP; p++){ if (deg[G.pA[p]] < 255) deg[G.pA[p]]++; if (G.pB[p] !== G.pA[p] && deg[G.pB[p]] < 255) deg[G.pB[p]]++; } G.deg = deg;
    // the largest strongly connected component (Kosaraju, iterative; both passes resumable: run() feeds them step budgets)
    const comp = new Int32Array(nN).fill(-1), seen = new Uint8Array(nN), order = new Int32Array(nN), stN = new Int32Array(nN), stQ = new Int32Array(nN);
    let no = 0, s1 = 0, sp = -1;
    const dfs1 = steps => { while (steps-- > 0){ if (sp < 0){ while (s1 < nN && seen[s1]) s1++; if (s1 >= nN) return true; sp = 0; stN[0] = s1; stQ[0] = G.oS[s1]; seen[s1] = 1; }
      const v = stN[sp]; if (stQ[sp] < G.oS[v + 1]){ const w = eTo[G.oE[stQ[sp]++]]; if (!seen[w]){ seen[w] = 1; sp++; stN[sp] = w; stQ[sp] = G.oS[w]; } } else { order[no++] = v; sp--; } } return false; };
    yield* run(Y, 1, (i, n, dl) => { while (DN() <= dl) if (dfs1(20000)) return 1; return 0; }, 0.8, 0.86);
    let nc = 0, i2 = nN - 1, sp2 = -1, sz = 0; const size = [];
    const dfs2 = steps => { while (steps-- > 0){ if (sp2 < 0){ if (sz){ size.push(sz); nc++; sz = 0; } while (i2 >= 0 && comp[order[i2]] >= 0) i2--; if (i2 < 0) return true; const s = order[i2]; sp2 = 0; stN[0] = s; comp[s] = nc; }
      const v = stN[sp2--]; sz++; for (let q = iS[v]; q < iS[v + 1]; q++){ const u = eFrom[iE[q]]; if (comp[u] < 0){ comp[u] = nc; stN[++sp2] = u; } } } return false; };
    yield* run(Y, 1, (i, n, dl) => { while (DN() <= dl) if (dfs2(20000)) return 1; return 0; }, 0.86, 0.9);
    let main = 0; for (let c = 1; c < nc; c++) if (size[c] > size[main]) main = c;
    const use = new Uint8Array(nE); let nu = 0; for (let e = 0; e < nE; e++) if (valid[e] && comp[eFrom[e]] === main && comp[eTo[e]] === main){ use[e] = 1; nu++; }
    G.use = use;
    // travel time per metre of each piece (s/m)
    G.pT = new Float32Array(nP); for (let p = 0; p < nP; p++) G.pT[p] = 1/SPD[G.pC[p]];
    yield 0.9;
    // (6) snapping grid of the usable pieces (200 m cells, CSR)
    const SC = 200, SN = Math.ceil(2*HALF/SC) + 2, S0 = -HALF - SC, sc = v => { const c = Math.floor((v - S0)/SC); return c < 0 ? 0 : c >= SN ? SN - 1 : c; };
    const gS = new Int32Array(SN*SN + 1), mark = new Int32Array(SN*SN).fill(-1); let gI = null, gF = null;
    const put = (p, c, pass) => { if (mark[c] === p) return; mark[c] = p; if (pass) gI[gF[c]++] = p; else gS[c + 1]++; };
    const each = (p, pass) => { const k0 = G.pOff[p], k1 = k0 + G.pN[p]; for (let k = k0; k < k1; k++){ put(p, sc(GX[k]) + sc(GY[k])*SN, pass); if (k + 1 < k1){ const dx = GX[k + 1] - GX[k], dy = GY[k + 1] - GY[k], nn = Math.ceil(sq(dx*dx + dy*dy)/(SC*0.4)); for (let j = 1; j < nn; j++) put(p, sc(GX[k] + dx*j/nn) + sc(GY[k] + dy*j/nn)*SN, pass); } } };
    yield* run(Y, nP, (p, n, dl) => { for (; p < n; p++){ if ((p & 255) === 0 && DN() > dl) return p; if (use[2*p] || use[2*p + 1]) each(p, 0); } return p; }, 0.9, 0.94);
    for (let i = 0; i < SN*SN; i++) gS[i + 1] += gS[i];
    gI = new Int32Array(gS[SN*SN]); gF = gS.slice(0, SN*SN); mark.fill(-1);
    yield* run(Y, nP, (p, n, dl) => { for (; p < n; p++){ if ((p & 255) === 0 && DN() > dl) return p; if (use[2*p] || use[2*p + 1]) each(p, 1); } return p; }, 0.94, 0.98);
    Object.assign(G, {gS, gI, SC, SN, S0});
    // search state
    G.dist = new Float64Array(nE); G.pred = new Int32Array(nE); G.stamp = new Uint32Array(nE); G.gen = 0;
    G.stats = {nodes:nN, pieces:nP, edges:nE, usable:nu, mainNodes:size[main], comps:nc, geoCuts:ncut, ms:Date.now() - t0};
    return G;
  }
  // memory estimate of the graph (bytes)
  function bytes(G){ let b = 0; for (const k in G){ const v = G[k]; if (v && v.buffer instanceof ArrayBuffer) b += v.byteLength; } return b; }

  // ---- snapping: the nearest usable piece to (x, y) within r: {p, e (directed by dir or by one-way), s (metres from the edge start), d, x, y, z}
  // o: {dir:[dx, dy] (prefer this way), zAbove (height of the point above the ground: prefer pieces at that level), maxC}
  function snap(G, x, y, r, o){
    o = o || {}; const SC = G.SC, SN = G.SN, R = Math.ceil(r/SC), cx = Math.floor((x - G.S0)/SC), cy = Math.floor((y - G.S0)/SC), VX = G.VX, VY = G.VY, VE = G.VE, dir = o.dir;
    let best = null, bs = 1e18; const seen = new Set();
    for (let gy = Math.max(0, cy - R); gy <= Math.min(SN - 1, cy + R); gy++) for (let gx = Math.max(0, cx - R); gx <= Math.min(SN - 1, cx + R); gx++){ const c = gy*SN + gx;
      for (let q = G.gS[c]; q < G.gS[c + 1]; q++){ const p = G.gI[q]; if (seen.has(p)) continue; seen.add(p); const cls = G.pC[p]; if (o.maxC !== undefined && cls > o.maxC) continue;
        let sAcc = 0; const k0 = G.pOff[p], k1 = k0 + G.pN[p] - 1;
        for (let k = k0; k < k1; k++){ const ax = VX[k], ay = VY[k], dx = VX[k + 1] - ax, dy = VY[k + 1] - ay, l2 = dx*dx + dy*dy, ll = Math.sqrt(l2) || 1;
          let t = l2 > 0 ? ((x - ax)*dx + (y - ay)*dy)/l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; const px = ax + dx*t - x, py = ay + dy*t - y, d = Math.sqrt(px*px + py*py);
          if (d <= r){ let e = 2*p, al = 1; if (dir){ const dt = (dx*dir[0] + dy*dir[1])/ll; if (dt < 0 && G.use[2*p + 1]) e = 2*p + 1; al = (e & 1) ? -dt : dt; }
            if (!G.use[e]) e = G.use[2*p] ? 2*p : 2*p + 1;
            if (G.use[e]){ const z = VE[k] + (VE[k + 1] - VE[k])*t, dz = o.zAbove !== undefined ? Math.abs(z - o.zAbove) : 0;
              const sc = d + (dir ? (1 - al)*14 : 0) + (dz > 3 ? 40 + dz*2 : dz) + (cls >= 10 ? 4 : 0);
              if (sc < bs){ bs = sc; const sf = sAcc + ll*t; best = {p, e, s:(e & 1) ? G.pLen[p] - sf : sf, d, x:ax + dx*t, y:ay + dy*t, z}; } } }
          sAcc += ll; } } }
    return best;
  }

  // ---- search (A*), resumable: job = start(G, sources, targets, o); step(G, job, budgetMs) -> true when done; job.res = {cost, chain} | null
  // sources [{e, s, c0 (extra cost)}], targets [{e, s}] (s metres from the start of the directed edge)
  const HP = {c:new Float64Array(1 << 15), id:new Int32Array(1 << 15), n:0};
  function hPush(H, c, id){ if (H.n >= H.c.length){ const c2 = new Float64Array(H.c.length*2); c2.set(H.c); H.c = c2; const i2 = new Int32Array(H.id.length*2); i2.set(H.id); H.id = i2; }
    let i = H.n++; while (i > 0){ const p = (i - 1) >> 1; if (H.c[p] <= c) break; H.c[i] = H.c[p]; H.id[i] = H.id[p]; i = p; } H.c[i] = c; H.id[i] = id; }
  function hPop(H){ const top = H.id[0], c = H.c[--H.n], id = H.id[H.n]; let i = 0;
    for (;;){ let l = 2*i + 1; if (l >= H.n) break; const r = l + 1; if (r < H.n && H.c[r] < H.c[l]) l = r; if (H.c[l] >= c) break; H.c[i] = H.c[l]; H.id[i] = H.id[l]; i = l; }
    H.c[i] = c; H.id[i] = id; return top; }
  // directions of a directed edge
  const sdx = (G, e) => (e & 1) ? -G.EDX[e >> 1] : G.SDX[e >> 1], sdy = (G, e) => (e & 1) ? -G.EDY[e >> 1] : G.SDY[e >> 1];
  const edx = (G, e) => (e & 1) ? -G.SDX[e >> 1] : G.EDX[e >> 1], edy = (G, e) => (e & 1) ? -G.SDY[e >> 1] : G.EDY[e >> 1];
  // turn penalty (s): ct = cos of the turn, cr > 0 = a left turn; lhd = left-hand traffic (Singapore: right turns cross the traffic)
  function turnPen(ct, cr, lhd){ if (ct >= 0.94) return 0; const cross = lhd ? cr < 0 : cr > 0;
    return ct >= 0.7 ? 2 : ct >= 0.17 ? (cross ? 11 : 6) : ct >= -0.26 ? (cross ? 15 : 9) : 20; }
  function start(G, sources, targets, o){
    o = o || {}; G.gen = (G.gen + 1) >>> 0; if (G.gen === 0){ G.stamp.fill(0); G.gen = 1; }
    const job = {hk:(o.hw || 1)/VMAX, relax:!!o.relax, sources, gen:G.gen, H:{c:new Float64Array(4096), id:new Int32Array(4096), n:0}, targets, tx:o.tx, ty:o.ty, ox:o.ox, oy:o.oy, lhd:!!o.lhd, long:o.long || 0, best:Infinity, bestPred:-1, bestT:-1, done:false, res:null, pops:0, ms:0, maxCost:o.maxCost || Infinity};
    for (const S of sources){ const p = S.e >> 1, g = (G.pLen[p] - S.s)*G.pT[p]*(S.k || 1) + (S.c0 || 0);
      if (G.stamp[S.e] !== G.gen || g < G.dist[S.e]){ G.stamp[S.e] = G.gen; G.dist[S.e] = g; G.pred[S.e] = -1; hPush(job.H, g + heur(G, job, S.e), S.e); }
      // a target on the source edge ahead of the start
      for (let i = 0; i < targets.length; i++){ const T = targets[i]; if (T.e === S.e && T.s >= S.s - 0.5){ const c = (T.s - S.s)*G.pT[p] + (S.c0 || 0); if (c < job.best){ job.best = c; job.bestPred = -2; job.bestT = i; job.src = S; } } } }
    return job;
  }
  function heur(G, job, e){ const v = G.eTo[e], dx = G.NX[v] - job.tx, dy = G.NY[v] - job.ty; return Math.sqrt(dx*dx + dy*dy)*job.hk; }
  // extra factor for small roads on a long trip, away from both ends (the main roads are preferred)
  function smallK(G, job, p, v){ if (!job.long || G.pC[p] < 8) return 1; const ax = G.NX[v] - job.ox, ay = G.NY[v] - job.oy, bx = G.NX[v] - job.tx, by = G.NY[v] - job.ty;
    return (ax*ax + ay*ay > 2.25e6 && bx*bx + by*by > 2.25e6) ? 1.35 : 1; }
  function step(G, job, budgetMs){
    if (job.done) return true; const t0 = Date.now(), H = job.H, T = job.targets, dist = G.dist, pred = G.pred, stamp = G.stamp, gen = job.gen, lhd = job.lhd; let k = 0;
    while (H.n){
      if ((++k & 255) === 0 && Date.now() - t0 > budgetMs){ job.ms += Date.now() - t0; return false; }
      const f = H.c[0], e = hPop(H); job.pops++;
      const g = dist[e]; if (f > g + heur(G, job, e) + 1e-6) continue;
      if (f >= job.best || g > job.maxCost) break;
      const v = G.eTo[e], p = e >> 1, shortE = G.pLen[p] < 45, pe = pred[e], ex = edx(G, e), ey = edy(G, e), d2 = G.deg[v] <= 2;
      for (let q = G.oS[v]; q < G.oS[v + 1]; q++){ const fe = G.oE[q]; if (!G.use[fe] || (fe >> 1) === p) continue;
        const fx = sdx(G, fe), fy = sdy(G, fe), ct = ex*fx + ey*fy;
        let tp = d2 ? 0 : turnPen(ct, ex*fy - ey*fx, lhd);
        if (!d2 && ct < -0.55){ if (!job.relax) continue; tp += 60; }
        if (shortE && pe >= 0 && edx(G, pe)*fx + edy(G, pe)*fy < -0.8){ if (!job.relax) continue; tp += 60; }   // no hidden U-turn through a short median gap
        const pf = fe >> 1, kf = smallK(G, job, pf, G.eTo[fe]);
        for (let i = 0; i < T.length; i++) if (T[i].e === fe){ const cc = g + tp + T[i].s*G.pT[pf]*kf; if (cc < job.best){ job.best = cc; job.bestPred = e; job.bestT = i; } }
        const nc = g + tp + G.pLen[pf]*G.pT[pf]*kf;
        if (stamp[fe] !== gen || nc < dist[fe]){ stamp[fe] = gen; dist[fe] = nc; pred[fe] = e; hPush(H, nc + heur(G, job, fe), fe); } } }
    job.done = true; job.ms += Date.now() - t0;
    if (job.bestT < 0){ job.res = null; return true; }
    const tg = T[job.bestT]; let chain;
    if (job.bestPred === -2) chain = [tg.e];
    else { chain = [tg.e]; let e = job.bestPred, n = 0; while (e >= 0 && n++ < 200000){ chain.push(e); e = pred[e]; } chain.reverse(); }
    // the source the chain starts from
    let src = job.src || null; if (job.bestPred !== -2) for (const S of job.sources || []) if (S.e === chain[0]) src = S;
    job.res = {cost:job.best, chain, target:tg, src};
    return true;
  }

  // ---- route assembly: chain of directed edges, s on the first edge, s on the last -> polyline + manoeuvres
  // R = {X, Y, E (height above ground), C (class), OW, LI (line), S (cumulative m), T (cumulative s), L, man:[{s, i, x, y, turn, ang, name, ref}]}
  function assemble(G, lines, chain, s0, s1, lhd){
    const X = [], Y = [], Ez = [], C = [], OW = [], LI = [], J = [];
    const put = (x, y, z, c, ow, li) => { const n = X.length; if (n && Math.abs(X[n - 1] - x) < 0.05 && Math.abs(Y[n - 1] - y) < 0.05) return; X.push(x); Y.push(y); Ez.push(z); C.push(c); OW.push(ow); LI.push(li); };
    for (let i = 0; i < chain.length; i++){ const e = chain[i], p = e >> 1, li = G.pLi[p], k0 = G.pOff[p], k1 = k0 + G.pN[p] - 1, c = G.pC[p], ow = G.pOw[p], VX = G.VX, VY = G.VY, VE = G.VE;
      const a = i === 0 ? s0 : 0, b = i === chain.length - 1 ? s1 : G.pLen[p];
      if (i > 0) J.push(X.length - 1);
      let s = 0; const rev = e & 1;
      for (let j = 0; j < k1 - k0; j++){ const ka = rev ? k1 - j : k0 + j, kb = rev ? ka - 1 : ka + 1, ax = VX[ka], ay = VY[ka], dx = VX[kb] - ax, dy = VY[kb] - ay, L = Math.sqrt(dx*dx + dy*dy), za = VE[ka], zb = VE[kb], s2 = s + L;
        if (s2 >= a && s <= b && L > 0){ const ta = Math.max(0, (a - s)/L), tb = Math.min(1, (b - s)/L);
          put(ax + dx*ta, ay + dy*ta, za + (zb - za)*ta, c, ow, li); put(ax + dx*tb, ay + dy*tb, za + (zb - za)*tb, c, ow, li); }
        s = s2; if (s > b) break; } }
    const n = X.length, S = new Float64Array(n), T = new Float64Array(n);
    for (let i = 1; i < n; i++){ const dx = X[i] - X[i - 1], dy = Y[i] - Y[i - 1], d = Math.sqrt(dx*dx + dy*dy); S[i] = S[i - 1] + d; T[i] = T[i - 1] + d/SPD[Math.min(10, C[i])]; }
    const R = {X:Float64Array.from(X), Y:Float64Array.from(Y), E:Float32Array.from(Ez), C:Uint8Array.from(C), OW:Uint8Array.from(OW), LI:Int32Array.from(LI), S, T, L:n ? S[n - 1] : 0, chain, man:[]};
    // manoeuvres at the junctions where there is a choice (a node with 3+ pieces)
    const nm = li => { const l = lines[li]; return l ? {name:l.name ? l.name : null, ref:l.ref || null} : {name:null, ref:null}; };
    for (let i = 1; i < chain.length; i++){ const v = G.eFrom[chain[i]], j = J[i - 1]; if (j === undefined || G.deg[v] < 3) continue; const s = S[j];
      if (s < 5) continue;
      const u = dirAtSide(R, s, -22), w = dirAtSide(R, s, 22), ct = u[0]*w[0] + u[1]*w[1], cr = u[0]*w[1] - u[1]*w[0], ang = Math.atan2(cr, ct)*180/Math.PI;
      // the most straight-on alternative at this node: are we leaving the obvious way?
      const ein = chain[i - 1], ex = edx(G, ein), ey = edy(G, ein); let bestAlt = -2, nAlt = 0, sideAlt = 0;
      for (let q = G.oS[v]; q < G.oS[v + 1]; q++){ const fe = G.oE[q]; if (!G.use[fe] || fe === chain[i] || (fe >> 1) === (ein >> 1)) continue; const c2 = ex*sdx(G, fe) + ey*sdy(G, fe); if (c2 < -0.55) continue; nAlt++; if (c2 > bestAlt){ bestAlt = c2; sideAlt = ex*sdy(G, fe) - ey*sdx(G, fe); } }
      if (!nAlt) continue;
      const a = Math.abs(ang); let turn = null;
      if (a < 20){ if (bestAlt > 0.9 && G.pC[chain[i] >> 1] !== G.pC[ein >> 1]) turn = sideAlt > cr ? 'keep-right' : 'keep-left'; else if (bestAlt > 0.94 && a > 6) turn = ang > 0 ? 'keep-left' : 'keep-right'; }
      else if (a < 45) turn = ang > 0 ? 'slight-left' : 'slight-right';
      else if (a < 120) turn = ang > 0 ? 'left' : 'right';
      else turn = ang > 0 ? 'sharp-left' : 'sharp-right';
      if (!turn) continue;
      const N2 = nm(G.pLi[chain[i] >> 1]); R.man.push({s, i:j, x:X[j], y:Y[j], turn, ang:Math.round(ang), name:N2.name, ref:N2.ref, c:G.pC[chain[i] >> 1]});
    }
    // merge manoeuvres closer than 25 m (a junction split in two nodes): keep the larger turn
    const M = []; for (const m of R.man){ const q = M[M.length - 1]; if (q && m.s - q.s < 25){ if (Math.abs(m.ang + q.ang) > 20 || Math.abs(m.ang) > Math.abs(q.ang)){ const ang = q.ang + m.ang; q.ang = ang; q.name = m.name; q.ref = m.ref; q.turn = turnOf(ang, q.turn); } continue; } M.push(m); }
    R.man = M; R.man.push({s:R.L, i:n - 1, x:X[n - 1], y:Y[n - 1], turn:'arrive', ang:0, name:null, ref:null});
    return R;
  }
  function turnOf(ang, def){ const a = Math.abs(ang); return a < 20 ? (def && def.startsWith('keep') ? def : (ang > 0 ? 'keep-left' : 'keep-right')) : a < 45 ? (ang > 0 ? 'slight-left' : 'slight-right') : a < 120 ? (ang > 0 ? 'left' : 'right') : (ang > 0 ? 'sharp-left' : 'sharp-right'); }
  // unit direction over the w metres before (w < 0) or after (w > 0) s
  function dirAtSide(R, s, w){ const a = at(R, w < 0 ? s + w : s), b = at(R, w < 0 ? s : s + w); const dx = b.x - a.x, dy = b.y - a.y, l = Math.sqrt(dx*dx + dy*dy) || 1; return [dx/l, dy/l]; }
  // point at distance s along the route
  function at(R, s, out){ const S = R.S, n = S.length; out = out || {}; if (n < 2){ out.x = n ? R.X[0] : 0; out.y = n ? R.Y[0] : 0; out.e = n ? R.E[0] : 0; out.i = 0; out.dx = 1; out.dy = 0; return out; }
    s = s < 0 ? 0 : s > S[n - 1] ? S[n - 1] : s; let lo = 0, hi = n - 1; while (hi - lo > 1){ const m = (lo + hi) >> 1; if (S[m] <= s) lo = m; else hi = m; }
    const L = S[hi] - S[lo] || 1, t = (s - S[lo])/L; out.x = R.X[lo] + (R.X[hi] - R.X[lo])*t; out.y = R.Y[lo] + (R.Y[hi] - R.Y[lo])*t; out.e = R.E[lo] + (R.E[hi] - R.E[lo])*t;
    out.dx = (R.X[hi] - R.X[lo])/L; out.dy = (R.Y[hi] - R.Y[lo])/L; out.i = lo; return out; }
  return {build, bytes, snap, start, step, assemble, at, SPD, turnPen};
})();
//</NAVG>

// ================================================================ runtime: city, units, state, the graph build, routing, progress
const NPI = Math.PI, NTAU = Math.PI*2;
const nClamp = (v, a, b) => v < a ? a : v > b ? b : v;
const nWrap = a => { a = (a + NPI) % NTAU; if (a < 0) a += NTAU; return a - NPI; };
const nEsc = t => String(t == null ? '' : t).replace(/[&<>"]/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[ch]));
let NCITY = null;
function navCity(){ if (NCITY) return NCITY; let c = 'sg'; try { if (typeof SGR_NYC !== 'undefined' && SGR_NYC) c = 'nyc'; else if (typeof SGR_BAY !== 'undefined' && SGR_BAY) c = 'bay'; } catch (e){ return 'sg'; } return NCITY = c; }
const navUS = () => navCity() !== 'sg';
const navLHD = () => navCity() === 'sg';
const navGnd = (x, y) => (typeof SGRoads !== 'undefined' && SGRoads.ground) ? SGRoads.ground(x, y) : hC(x, y);
// distances and times, bilingual / by country (the US maps in feet / miles)
function navDist(m){
  m = Math.max(0, m);
  if (navUS()){ if (m < 160.9) return Math.max(10, Math.round(m*3.28084/10)*10) + ' ft'; const mi = m/1609.34; return (mi < 10 ? mi.toFixed(1) : Math.round(mi)) + ' mi'; }
  if (m < 1000) return (m < 100 ? Math.max(5, Math.round(m/5)*5) : Math.round(m/10)*10) + ' m'; const km = m/1000; return (km < 10 ? km.toFixed(1) : Math.round(km)) + ' km';
}
// [lm31/i18n] language helpers: nLB() = bilingual (today's look); nLP(zh, en) = the name for the mode (zh || en when bilingual);
// nLT(s) = a bilingual string reduced to the mode; nLS(both, zh, en) = pick a variant
const nL1 = () => !!(window.SGLang && SGLang.mode && SGLang.mode !== 'both'), nLB = () => !nL1();
const nLP = (zh, en) => nL1() ? SGLang.pick(zh, en) : (zh || en);
const nLT = s => nL1() && SGLang.txt ? SGLang.txt(s) : s;
const nLS = (both, zh, en) => nL1() ? (SGLang.mode === 'zh' ? zh : en) : both;
if (typeof HOOKS !== 'undefined' && HOOKS.boot) HOOKS.boot.push(() => { try { if (window.SGLang && SGLang.on) SGLang.on(() => { try { for (const k in HN.last) delete HN.last[k]; BM.dirty = true; BM.lastCard = null; BM.places = null; navCardTick(true); bmCard(); } catch (e){ /* not built yet */ } }); } catch (e){ console.error('[nav] i18n', e); } });
function navTime(s){ const m = Math.max(1, Math.round(s/60)); if (m < 60) return m + nLS(' 分钟 min', ' 分钟', ' min'); const h = Math.floor(m/60), r = m % 60; return h + nLS(' 小时 h ', ' 小时 ', ' h ') + (r ? r + nLS(' 分 min', ' 分', ' min') : ''); }
const TURN_TXT = {left:['左转', 'Turn left'], right:['右转', 'Turn right'], 'slight-left':['稍向左', 'Bear left'], 'slight-right':['稍向右', 'Bear right'],
  'sharp-left':['向左急转', 'Sharp left'], 'sharp-right':['向右急转', 'Sharp right'], 'keep-left':['靠左行驶', 'Keep left'], 'keep-right':['靠右行驶', 'Keep right'],
  straight:['直行', 'Continue'], uturn:['掉头', 'U-turn'], arrive:['到达', 'Arrive'], start:['出发', 'Head off']};

// the drive module (window.SGF1): driving? the car
const navDrv = () => { const S = window.SGF1; return S && S.F1 && S.F1.on ? S : null; };
const navCar = () => { const S = navDrv(); return S ? S.CAR : null; };
const navRaceOn = () => { const S = window.SGF1; return !!(S && S.F1 && S.F1.on && S.F1.mode === 'race'); };

const NV = {
  G:null, gen:null, Y:{sl:5, t:0, ext:true}, sliceMax:0, prog:0, want:false, err:null, buildMs:0, cpuMs:0, t0:0, frames:0,
  dest:null, R:null, job:null, need:false, relax:false, lastReq:-1e9, reqs:0, reroutes:0, routeMs:0, pops:0, fail:null,
  k:0, s:0, off:0, offT:0, wrongT:0, arrivedT:0, msMax:0, ms:0, nFrame:0, from:null,
  prov:new Map(), mk:[], mkT:0, mkErr:0
};
function navWant(){ NV.want = true; }
function navReady(){ return !!(SGR && SGR.on && SGR.lines && SGR.base); }
// the graph: built in slices in the frame hook (5 ms per frame, 9 ms while a route is waiting or the big map is open)
function navBuildTick(){
  if (NV.G || !NV.want || !navReady() || NV.err) return;
  if (!NV.gen){ NV.t0 = performance.now(); NV.gen = NAVG.build(SGR.lines, {HALF:SGR.base.HALF, Y:NV.Y}); }
  const bud = (NV.dest || BM.open) ? 9 : 5, a = performance.now(); NV.Y.t = Date.now() + bud; NV.frames++;
  try { const r = NV.gen.next(), dt = performance.now() - a; NV.cpuMs += dt; if (dt > NV.sliceMax) NV.sliceMax = dt;
    if (r.done){ NV.G = r.value; NV.gen = null; NV.buildMs = performance.now() - NV.t0; NV.prog = 1; BM.dirty = true; navCardTick(true); }
    else NV.prog = r.value; }
  catch (e){ NV.err = String(e && e.message || e); NV.gen = null; console.error('nav graph', e); }
}
// ---- destination and route requests
function navSetDest(x, y, o){
  o = o || {}; if (!(isFinite(x) && isFinite(y))) return false;
  const lab = o.label, P = NV.dest;
  // the same destination again (a module calling every frame): keep the route, update the options
  if (P && Math.abs(P.x - x) < 1 && Math.abs(P.y - y) < 1 && (o.kind || 'dest') === P.kind){ if (lab) P.label = Array.isArray(lab) ? [String(lab[0] || ''), String(lab[1] || lab[0] || '')] : [String(lab), String(lab)];
    if (o.color) P.color = o.color; if (o.r !== undefined) P.r = +o.r || 0; if (typeof o.onArrive === 'function') P.onArrive = o.onArrive; return true; }
  NV.dest = {x:+x, y:+y, label:Array.isArray(lab) ? [String(lab[0] || ''), String(lab[1] || lab[0] || '')] : lab ? [String(lab), String(lab)] : navNameAt(x, y),
    color:o.color || '#ff3b6b', kind:o.kind || 'dest', r:+o.r || 0, onArrive:typeof o.onArrive === 'function' ? o.onArrive : null, beacon:o.beacon !== undefined ? !!o.beacon : o.kind !== 'checkpoint', icon:o.icon || null, t:performance.now()};
  NV.R = null; NV.fail = null; NV.k = 0; NV.s = 0; NV.offT = NV.wrongT = 0; NV.relax = false; navReq(true); navWant();
  if (!o.quiet && o.kind !== 'checkpoint') navRecent(NV.dest);
  navRibbonClear(); navBeacon(); BM.dirty = true; navCardTick(true); return true;
}
function navClearDest(){ NV.dest = null; NV.R = null; NV.job = null; NV.need = false; NV.fail = null; navRibbonClear(); navBeacon(); BM.dirty = true; navCardTick(true); return true; }
function navReq(now){ NV.need = true; NV.job = null; if (now) NV.lastReq = -1e9; }
// where the route starts: the car, or (not driving) the centre of the view
function navOrigin(){
  const C = navCar();
  if (C) return {x:C.x, y:C.y, dir:[Math.cos(C.psi), Math.sin(C.psi)], zA:C.z - navGnd(C.x, C.y), car:true};
  const T = controls.target; return {x:T.x, y:-T.z, dir:null, zA:undefined, car:false};
}
function navRouteTick(){
  const G = NV.G; if (!NV.dest || !G) return;
  const now = performance.now();
  if (NV.need && !NV.job && now - NV.lastReq > 1500){
    NV.need = false; NV.lastReq = now; NV.reqs++;
    const O = navOrigin(), D = NV.dest;
    const A = NAVG.snap(G, O.x, O.y, 250, {dir:O.dir, zAbove:O.zA}) || NAVG.snap(G, O.x, O.y, 1500, {dir:O.dir});
    const B = NAVG.snap(G, D.x, D.y, 600, {}) || NAVG.snap(G, D.x, D.y, 3000, {});
    if (!A || !B){ NV.fail = !A ? 'origin' : 'dest'; NV.R = null; navRibbonClear(); BM.dirty = true; navCardTick(true); return; }
    const src = [{e:A.e, s:A.s}], rv = A.e ^ 1; if (G.use[rv]) src.push({e:rv, s:G.pLen[A.p] - A.s, c0:O.car ? 35 : 0});
    const tg = [{e:B.e, s:B.s}], rb = B.e ^ 1; if (G.use[rb]) tg.push({e:rb, s:G.pLen[B.p] - B.s});
    const far = Math.hypot(B.x - A.x, B.y - A.y);
    NV.job = NAVG.start(G, src, tg, {tx:B.x, ty:B.y, ox:A.x, oy:A.y, lhd:navLHD(), long:far > 6000, hw:1.3, relax:NV.relax});
    NV.job.A = A; NV.job.B = B; NV.job.car = O.car;
  }
  if (NV.job){
    const J = NV.job; if (!NAVG.step(G, J, BM.open || !navDrv() ? 8 : 5)) return;
    NV.job = null; NV.routeMs = J.ms; NV.pops = J.pops;
    if (!J.res){ if (!NV.relax){ NV.relax = true; navReq(true); return; } NV.fail = 'route'; NV.R = null; navRibbonClear(); BM.dirty = true; navCardTick(true); return; }
    NV.relax = false; NV.fail = null;
    const src = J.res.src || {s:J.A.s}, R = NAVG.assemble(G, SGR.lines, J.res.chain, src.s, J.res.target.s, navLHD());
    R.from = {x:J.A.x, y:J.A.y}; R.to = {x:J.B.x, y:J.B.y}; R.car = J.car; R.t = now;
    if (NV.R && NV.R.car && J.car){ NV.reroutes++; navMsg(nLB() ? '重新规划路线<small>Re-routed · ' + navDist(R.L) + '</small>' : '\u2060' + nLS('', '重新规划路线 · ', 'Re-routed · ') + navDist(R.L), 1.6, 'warn', true); }
    NV.R = R; NV.k = 0; NV.s = 0; NV.offT = NV.wrongT = 0; NV.cache = null;
    navRibbonBuild(R); BM.dirty = true; navCardTick(true);
  }
}
// ---- progress along the route (driving): nearest point ahead within a window, level-aware; off-route and wrong-way timers
const NP = {x:0, y:0};
function navProgress(dt){
  const C = navCar(), R = NV.R; if (!C || !R || !R.car) return;
  const n = R.X.length; if (n < 2) return;
  const zA = C.z - navGnd(C.x, C.y), cs = Math.cos(C.psi), sn = Math.sin(C.psi);
  let best = 1e18, bi = NV.k, bt = 0, bd = 1e9, bdot = 1, blev = false; const i0 = Math.max(0, NV.k - 3), sLim = R.S[Math.min(n - 1, NV.k)] + 450;
  for (let i = i0; i < n - 1 && R.S[i] < sLim; i++){
    const ax = R.X[i], ay = R.Y[i], dx = R.X[i + 1] - ax, dy = R.Y[i + 1] - ay, l2 = dx*dx + dy*dy; if (l2 < 1e-6) continue;
    let t = ((C.x - ax)*dx + (C.y - ay)*dy)/l2; t = t < 0 ? 0 : t > 1 ? 1 : t; const px = ax + dx*t - C.x, py = ay + dy*t - C.y, d = Math.sqrt(px*px + py*py);
    const ez = R.E[i] + (R.E[i + 1] - R.E[i])*t, lev = Math.abs(ez - zA) > 4.5, ll = Math.sqrt(l2), dot = (dx*cs + dy*sn)/ll;
    const sc = d + (lev ? 60 : 0) + (i < NV.k ? 3 : 0);
    if (sc < best){ best = sc; bi = i; bt = t; bd = d; bdot = dot; blev = lev; }
  }
  NV.k = bi; NV.s = R.S[bi] + bt*(R.S[bi + 1] - R.S[bi]); NV.off = bd;
  const v = Math.abs(C.u);
  if ((bd > 26 || blev) && v > 1.2) NV.offT += dt; else NV.offT = Math.max(0, NV.offT - dt*2);
  if (bdot < -0.55 && C.u > 2.5 && bd < 30) NV.wrongT += dt; else NV.wrongT = Math.max(0, NV.wrongT - dt*2);
  if ((NV.offT > 1.3 || NV.wrongT > 3 || bd > 400) && !NV.job){ NV.offT = 0; NV.wrongT = 0; navReq(false); }
  // arrival
  const D = NV.dest, dd = Math.hypot(C.x - D.x, C.y - D.y), rest = R.L - NV.s;
  if ((rest < 16 && bd < 35) || dd < Math.max(24, D.r || 0)) navArrive();
}
function navArrive(){
  const D = NV.dest; if (!D) return; const cb = D.onArrive, lab = D.label;
  if (D.kind !== 'checkpoint') navMsg(nLB() ? `已到达 ${lab[0]}<small>Arrived · ${nEsc(lab[1])}</small>` : '\u2060' + nEsc(nLS('', '已到达 ' + lab[0], 'Arrived · ' + lab[1])), 3.2, 'go', true);
  NV.arrivedT = performance.now(); navClearDest();
  if (cb) try { cb(); } catch (e){ console.error('nav onArrive', e); }
}
// the rest of the route from the car (cached until the car passes a vertex or the route changes)
function navRouteInfo(){
  const R = NV.R; if (!R) return null;
  const k = R.car ? NV.k : 0, s = R.car ? NV.s : 0;
  if (NV.cache && NV.cache.R === R && NV.cache.k === k) { const c = NV.cache.o; c.len = Math.max(0, R.L - s); c.eta = navEta(R, s); const m = navNextMan(R, s); if (m){ c.next.x = m.x; c.next.y = m.y; c.next.turn = m.turn; c.next.dist = Math.max(0, m.s - s); c.next.name = m.name; } return c; }
  const pts = [], C = navCar(); if (C && R.car) pts.push([C.x, C.y]); for (let i = k + 1; i < R.X.length; i++) pts.push([R.X[i], R.Y[i]]);
  const m = navNextMan(R, s);
  const o = {pts, len:Math.max(0, R.L - s), eta:navEta(R, s), next:m ? {x:m.x, y:m.y, turn:m.turn, dist:Math.max(0, m.s - s), name:m.name} : null, dest:NV.dest ? {x:NV.dest.x, y:NV.dest.y, label:NV.dest.label.slice()} : null};
  NV.cache = {R, k, o}; return o;
}
function navEta(R, s){ const n = R.S.length; if (n < 2) return 0; let lo = 0, hi = n - 1; while (hi - lo > 1){ const m = (lo + hi) >> 1; if (R.S[m] <= s) lo = m; else hi = m; }
  const t = R.T[lo] + (R.T[hi] - R.T[lo])*((s - R.S[lo])/((R.S[hi] - R.S[lo]) || 1)); return Math.max(0, R.T[n - 1] - t); }
function navNextMan(R, s){ for (const m of R.man) if (m.s > s + 3) return m; return R.man[R.man.length - 1] || null; }

// ---- names near a point (for a clicked destination): a landmark, site, POI, station or place nearby, else the road
function navNameAt(x, y){
  let best = null, bd = 1e18; const consider = (zh, en, px, py, r) => { const d = Math.hypot(px - x, py - y); if (d < r && d < bd){ bd = d; best = [zh || en, en || zh]; } };
  try { if (typeof landmarks !== 'undefined' && typeof LANDMARKS !== 'undefined') for (const L of landmarks){ const d = LANDMARKS[L.type]; if (d && d.label !== false) consider(d.zh, d.en, L.x, L.y, 160); } } catch (e){ /* */ }
  const B = SGR.base; if (B){ for (const p of B.pois || []) consider(p.zh, p.en, p.x, p.y, 120); for (const p of B.stations || []) consider(p.zh, p.en, p.x, p.y, 120); }
  if (best) return best;
  // the nearest named road
  const G = NV.G; if (G){ const s = NAVG.snap(G, x, y, 200, {}); if (s){ const l = SGR.lines[G.pLi[s.p]]; if (l && (l.name || l.ref)) return l.name ? [l.name[1] || l.name[0], l.name[0]] : [l.ref, l.ref]; } }
  if (B) for (const p of B.places || []) consider(p.zh, p.en, p.x, p.y, 1500);
  return best || ['地图上的点', 'Point on the map'];
}
// ---- markers from providers (cached ~10 Hz)
function navMarkers(){
  const now = performance.now(); if (now - NV.mkT < 90) return NV.mk; NV.mkT = now; const out = NV.mk; out.length = 0; let custom = false;
  for (const [id, fn] of NV.prov){ if (id[0] === '_') continue; try { const L = fn(); if (L && L.length) for (const m of L){ if (!m || !isFinite(m.x) || !isFinite(m.y)) continue; if (m.icon === 'creature') custom = true; out.push(m); if (out.length > 300) break; } } catch (e){ if (NV.mkErr++ < 3) console.error('nav markers ' + id, e); } }
  for (const [id, fn] of NV.prov){ if (id[0] !== '_' || (id === '_creature' && custom)) continue; try { const L = fn(); if (L && L.length) for (const m of L) if (m && isFinite(m.x) && isFinite(m.y)) out.push(m); } catch (e){ if (NV.mkErr++ < 3) console.error('nav markers ' + id, e); } }
  return out;
}
// built-in providers: city race gates, the creature, other players
NV.prov.set('_race', () => { const S = window.SGRace; if (!S || !S.route || !S.state || S.state === 'off' || S.state === 'done') return null; const r = S.route, P = S.progress ? S.progress() : null, i0 = P ? P.cp : 0, out = [];
  for (let i = i0; i < Math.min(r.cps.length, i0 + 6); i++){ const c = r.cps[i]; out.push({x:c.x, y:c.y, icon:i === r.cps.length - 1 ? 'flag' : 'checkpoint', color:i === i0 ? '#35f2ff' : '#4d7dff', label:i === r.cps.length - 1 ? '终点 Finish' : 'CP ' + (i + 1), pulse:i === i0}); } return out; });
NV.prov.set('_creature', () => { const K = window.SGKaiju; if (!K || !K.on || !K.state) return null; const s = K.state(); return s && isFinite(s.x) ? [{x:s.x, y:s.y, icon:'creature', color:'#ff4436', label:'怪兽 Creature', pulse:true, r:60}] : null; });
NV.prov.set('_players', () => { const N = window.SGNet; if (!N || !N.remotes) return null; let L; try { L = N.remotes(); } catch (e){ return null; } const out = []; for (const r of L) if (r.x !== null && r.y !== null) out.push({x:r.x, y:r.y, icon:'car', color:'#8fc7ff', label:r.name || ''}); return out; });

// ================================================================ drive HUD: turn card, buttons, minimap overlay, messages
const NAV_CSS = `
.navcard{margin-top:8px;width:220px;box-sizing:border-box;padding:8px 10px 9px;pointer-events:auto}
.navcard[hidden],.navmm[hidden],.navbtn[hidden]{display:none!important}
.navrow{display:flex;align-items:center;gap:9px}
.navarr{width:52px;height:52px;flex:none;border-radius:9px;background:#1d6b42}
.navcard.far .navarr{background:#24323a}
.navtx{min-width:0;flex:1}
.navtx b{display:block;font:600 24px/1.05 var(--font-mono);font-variant-numeric:tabular-nums;letter-spacing:-.01em;white-space:nowrap}
.navtx span{display:block;font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.navtx small{display:block;font:400 10px var(--font-mono);color:#9fb0b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.navx{appearance:none;border:0;background:transparent;color:#9fb0b8;font:400 18px/1 var(--font-ui);cursor:pointer;padding:2px 2px 6px;align-self:flex-start}
.navx:hover{color:#fff}
.navsub{display:flex;justify-content:space-between;gap:8px;margin-top:7px;padding-top:6px;border-top:1px solid rgba(255,255,255,.1);font:500 11px var(--font-mono);color:#cfd8dc;font-variant-numeric:tabular-nums}
.navsub span:last-child{color:#9fb0b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px;text-align:right}
.navbar{height:3px;border-radius:2px;background:rgba(255,255,255,.12);margin-top:6px;overflow:hidden}.navbar i{display:block;height:100%;width:0;background:#59e38a}
.navmm{background:transparent!important;border-color:transparent!important;box-shadow:none!important;cursor:pointer;pointer-events:auto}
.navmsg{position:absolute;left:50%;top:calc(22% + env(safe-area-inset-top,0px));transform:translateX(-50%);font:700 21px/1.25 var(--font-ui);text-align:center;padding:9px 18px;border-radius:12px;background:rgba(12,17,20,.72);color:#eef2f3;opacity:0;transition:opacity .25s;pointer-events:none;max-width:calc(100% - 40px);z-index:2}
.navmsg small{display:block;font:500 11px var(--font-mono);letter-spacing:.04em;color:#cfd8dc;margin-top:2px}
.navmsg.on{opacity:1}.navmsg.go{color:#59e38a}.navmsg.warn{color:#ffcf4a}
.navbtn.on{background:rgba(29,107,66,.92)}
@media (max-width:760px){ .navcard{width:150px;padding:6px 8px 7px} .navarr{width:40px;height:40px} .navtx b{font-size:15px} .navtx small{display:none} .navsub{font-size:10px} .navsub span:last-child{display:none} .navbtn{display:none!important} .navmsg{font-size:16px} }
`;
const HN = {el:null, card:null, last:{}, mm:null, mctx:null, msg:null, msgT:null, btnN:null, btnM:null, arr:null, actx:null, frame:0};
function navHudBuild(){
  if (HN.el) return true; const h = document.getElementById('f1Hud'); if (!h) return false;
  const st = document.createElement('style'); st.textContent = NAV_CSS; document.head.appendChild(st);
  const col = h.querySelector('.f1top > div') || h;
  const c = document.createElement('div'); c.className = 'navcard f1p'; c.id = 'navCard'; c.hidden = true;
  c.innerHTML = `<div class="navrow"><canvas class="navarr" id="navArr" width="104" height="104"></canvas><div class="navtx" data-i18n-off><b id="navDist">–</b><span id="navRoad">–</span><small id="navTurn">–</small></div><button class="navx" id="navX" type="button" title="结束导航 End navigation" aria-label="结束导航 End navigation">×</button></div>
<div class="navbar"><i id="navBar"></i></div><div class="navsub" data-i18n-off><span id="navRem">–</span><span id="navDst">–</span></div>`;
  const f1free = col.querySelector('#f1Free'); if (f1free && f1free.nextSibling) col.insertBefore(c, f1free.nextSibling); else col.appendChild(c);
  const mm = document.createElement('canvas'); mm.className = 'f1map navmm'; mm.id = 'navMm'; mm.width = mm.height = 176; mm.hidden = true; mm.title = '大地图 Big map (M)';
  const fm = h.querySelector('#f1Map'); if (fm && fm.nextSibling) h.insertBefore(mm, fm.nextSibling); else h.appendChild(mm);
  const msg = document.createElement('div'); msg.className = 'navmsg'; msg.id = 'navMsg'; h.appendChild(msg);
  const btns = h.querySelector('.f1btns');
  if (btns){ const mk = (id, zh, en) => { const b = document.createElement('button'); b.className = 'f1b f1p navbtn'; b.id = id; b.type = 'button'; b.innerHTML = `<b>${zh}</b><small>${en}</small>`; btns.insertBefore(b, btns.firstChild); return b; };
    HN.btnM = mk('navMapB', '地图', 'MAP · M'); HN.btnN = mk('navNavB', '导航', 'NAV · N');
    HN.btnN.addEventListener('click', () => navOpen({search:true})); HN.btnM.addEventListener('click', () => navToggle()); }
  mm.addEventListener('click', e => { e.preventDefault(); navOpen({}); });
  c.querySelector('#navX').addEventListener('click', () => navClearDest());
  c.addEventListener('click', e => { if (e.target.id !== 'navX') navOpen({}); });
  const $ = id => h.querySelector('#' + id);
  HN.el = h; HN.card = c; HN.mm = mm; HN.mctx = mm.getContext('2d'); HN.msg = msg; HN.arr = $('navArr'); HN.actx = HN.arr.getContext('2d');
  HN.q = {dist:$('navDist'), road:$('navRoad'), turn:$('navTurn'), rem:$('navRem'), dst:$('navDst'), bar:$('navBar')};
  return true;
}
function navMsg(html, dur, cls, raw){
  if (!HN.msg || !navDrv()){ try { showToast(String(html).replace(/<small>/, ' · ').replace(/<[^>]+>/g, '')); } catch (e){ /* */ } return; }
  HN.msg.innerHTML = raw ? html : nEsc(html); HN.msg.className = 'navmsg on' + (cls ? ' ' + cls : ''); clearTimeout(HN.msgT); HN.msgT = setTimeout(() => { HN.msg.className = 'navmsg'; }, (dur || 2)*1000);
}
const NHP = {};
const nSet = (el, k, v) => { if (HN.last[k] !== v){ HN.last[k] = v; el.textContent = v; } };
// the turn arrow, drawn from the real angle: a stem up to the junction, then the exit at the turn angle (arrive: a flag)
function navArrowDraw(turn, ang, far){
  const x = HN.actx, W = HN.arr.width; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, W); const s = W/104;
  x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#fff'; x.fillStyle = '#fff';
  if (turn === 'arrive'){ x.lineWidth = 7*s; x.beginPath(); x.moveTo(36*s, 86*s); x.lineTo(36*s, 20*s); x.stroke(); x.beginPath(); x.moveTo(38*s, 20*s); x.lineTo(76*s, 30*s); x.lineTo(38*s, 44*s); x.closePath(); x.fill(); return; }
  if (turn === 'uturn'){ x.lineWidth = 8*s; x.beginPath(); x.moveTo(64*s, 92*s); x.lineTo(64*s, 44*s); x.arc(50*s, 44*s, 14*s, 0, NPI, true); x.lineTo(36*s, 62*s); x.stroke();
    x.beginPath(); x.moveTo(36*s, 76*s); x.lineTo(24*s, 58*s); x.lineTo(48*s, 58*s); x.closePath(); x.fill(); return; }
  if (turn === 'wait'){ x.lineWidth = 6*s; x.beginPath(); x.arc(52*s, 52*s, 26*s, -1.2, 3.6); x.stroke(); return; }
  let a = (turn === 'start' || far) ? 0 : nClamp(-ang*NPI/180, -2.7, 2.7);   // screen: up = ahead, + = right
  if (!far){ if (turn === 'keep-left') a = -0.42; else if (turn === 'keep-right') a = 0.42; else if (turn === 'slight-left') a = Math.min(a, -0.5); else if (turn === 'slight-right') a = Math.max(a, 0.5); }
  const jx = 52*s, jy = 58*s, L = 30*s, ex = jx + Math.sin(a)*L, ey = jy - Math.cos(a)*L;
  // other roads at the junction (faint)
  if (!far && turn !== 'start'){ x.strokeStyle = 'rgba(255,255,255,.28)'; x.lineWidth = 6*s; x.beginPath(); x.moveTo(jx, jy); x.lineTo(jx, jy - 34*s); x.stroke(); x.strokeStyle = '#fff'; }
  x.lineWidth = 8*s; x.beginPath(); x.moveTo(jx, 94*s); x.lineTo(jx, jy); x.quadraticCurveTo(jx, jy - 6*s, ex - Math.sin(a)*4*s, ey + Math.cos(a)*4*s); x.stroke();
  const hx = Math.sin(a), hy = -Math.cos(a), px = -hy, py = hx, tip = 13*s;
  x.beginPath(); x.moveTo(ex + hx*tip, ey + hy*tip); x.lineTo(ex + px*tip*0.9, ey + py*tip*0.9); x.lineTo(ex - px*tip*0.9, ey - py*tip*0.9); x.closePath(); x.fill();
}
// the card: every frame while driving (text and the arrow only when they change)
function navCardTick(force){
  if (!HN.card){ return; } const C = navCar(), on = !!(C && NV.dest && !navRaceOn());
  if (HN.card.hidden === on) HN.card.hidden = !on;
  if (HN.btnN){ const a = !!NV.dest; if (HN.last.btn !== a){ HN.last.btn = a; HN.btnN.classList.toggle('on', a); } }
  if (!on) return;
  const q = HN.q, R = NV.R, D = NV.dest;
  nSet(q.dst, 'dst', '→ ' + nLP(D.label[0], D.label[1]));
  if (!R || !R.car){
    const st = !NV.G ? nLS(`路网准备中 ${Math.round(NV.prog*100)}% · Preparing roads`, `路网准备中 ${Math.round(NV.prog*100)}%`, `Preparing roads ${Math.round(NV.prog*100)}%`) : NV.fail ? (NV.fail === 'origin' ? '附近没有道路 · No road nearby' : NV.fail === 'dest' ? '目的地附近没有道路 · No road at the destination' : '找不到路线 · No route') : '规划路线… · Routing…';
    nSet(q.dist, 'dist', NV.fail ? '!' : '…'); nSet(q.road, 'road', nLT(st)); nSet(q.turn, 'turn', nLB() ? D.label[1] : '');
    const dd = Math.hypot(C.x - D.x, C.y - D.y); nSet(q.rem, 'rem', nLS('直线 ', '直线 ', 'Straight line ') + navDist(dd)); if (HN.last.arr !== 'wait'){ HN.last.arr = 'wait'; navArrowDraw('wait', 0); } return;
  }
  const s = NV.s, m = navNextMan(R, s), dm = m ? Math.max(0, m.s - s) : 0, far = m && m.turn !== 'arrive' && dm > 1200;
  // the car does not point along the route (the start, a wrong way): first turn towards it
  // (the route's own direction where the car is, against the heading: corners ahead do not count)
  const k = Math.min(R.X.length - 2, NV.k), tg = Math.atan2(R.Y[k + 1] - R.Y[k], R.X[k + 1] - R.X[k]);
  const P = NAVG.at(R, Math.min(R.L, s + 12), NHP), rel = nWrap(Math.atan2(P.y - C.y, P.x - C.x) - C.psi), mis = R.L - s > 20 && Math.abs(nWrap(tg - C.psi)) > 1.05 && Math.abs(rel) > 0.8;
  if (mis){ const deg = Math.round(rel*180/NPI), u = Math.abs(deg) > 150, T2 = u ? ['掉头', 'Turn around'] : deg > 0 ? ['向左转向路线', 'Turn left to the route'] : ['向右转向路线', 'Turn right to the route'];
    nSet(q.dist, 'dist', navDist(Math.hypot(P.x - C.x, P.y - C.y))); nSet(q.road, 'road', nLS(T2[0], T2[0], T2[1])); nSet(q.turn, 'turn', nLB() ? T2[1] : ''); nSet(q.rem, 'rem', `${navDist(R.L - s)} · ${navTime(navEta(R, s))}`);
    const key = 'mis' + Math.round(deg/10); if (force || HN.last.arr !== key){ HN.last.arr = key; navArrowDraw(u ? 'uturn' : 'turn', u ? 175 : deg, false); HN.card.classList.remove('far'); } return; }
  nSet(q.dist, 'dist', navDist(dm));
  const T = TURN_TXT[m ? m.turn : 'straight'] || TURN_TXT.straight, nm = m && m.name ? (m.name[1] || m.name[0]) : m && m.ref ? m.ref : '', nmE = m && m.name ? (m.name[0] || m.name[1]) : nm;
  if (m && m.turn === 'arrive'){ nSet(q.road, 'road', nLP(D.label[0], D.label[1])); nSet(q.turn, 'turn', nLS('到达 Arrive · ' + D.label[1], '到达', 'Arrive')); }
  else if (far){ nSet(q.road, 'road', nLS('沿路直行 · Continue', '沿路直行', 'Continue')); nSet(q.turn, 'turn', nLS((nm ? '然后 then ' + T[1] + ' → ' + nm : T[0] + ' · ' + T[1]), nm ? '然后' + T[0] + ' → ' + nm : T[0], nmE ? 'then ' + T[1] + ' → ' + nmE : T[1])); }
  else { nSet(q.road, 'road', nLS(nm ? `${T[0]} · ${nm}` : `${T[0]} · ${T[1]}`, nm ? `${T[0]} · ${nm}` : T[0], nmE ? `${T[1]} · ${nmE}` : T[1])); nSet(q.turn, 'turn', nLB() ? (m && m.name && m.name[0] && m.name[1] && m.name[0] !== m.name[1] ? T[1] + ' · ' + m.name[0] : T[1]) : ''); }
  const rest = R.L - s; nSet(q.rem, 'rem', `${navDist(rest)} · ${navTime(navEta(R, s))}`);
  const pc = Math.round(nClamp(s/(R.L || 1), 0, 1)*100); if (HN.last.pc !== pc){ HN.last.pc = pc; q.bar.style.width = pc + '%'; }
  const key = (m ? m.turn + m.ang : 'x') + (far ? 'f' : ''); if (force || HN.last.arr !== key){ HN.last.arr = key; navArrowDraw(m ? m.turn : 'straight', m ? m.ang : 0, far); HN.card.classList.toggle('far', !!far); }
}
// the minimap overlay: the same scale, centre and heading-up rotation as the drive module's free-drive minimap
function navMiniDraw(){
  const cv = HN.mm; if (!cv) return; const C = navCar(), mk = navMarkers(), show = !!(C && !navRaceOn() && (NV.dest || mk.length));
  if (cv.hidden === show) cv.hidden = !show; if (!show || (HN.frame++ % 2)) return;
  const css = cv.clientWidth || 176, dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(css*dpr); if (cv.width !== W){ cv.width = cv.height = W; }
  const x = HN.mctx, kmh = Math.abs(C.u)*3.6, sc = (kmh < 70 ? 0.5 : kmh < 170 ? 0.33 : 0.22)*dpr, R = NV.R, half = W/sc*0.75;
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, W); x.save(); x.translate(W/2, W*0.58); x.rotate(C.psi - NPI/2);
  const X = v => (v - C.x)*sc, Y = v => -(v - C.y)*sc; x.lineCap = x.lineJoin = 'round';
  if (R && R.car){ const n = R.X.length, k0 = Math.max(0, NV.k);
    x.beginPath(); let started = false, lastX = 1e9, lastY = 1e9;
    x.moveTo(X(C.x), Y(C.y)); started = true;
    for (let i = k0 + 1; i < n; i++){ const px = R.X[i], py = R.Y[i]; if (Math.abs(px - C.x) > half*2.2 && Math.abs(py - C.y) > half*2.2 && R.S[i] - NV.s > half*3) { x.lineTo(X(px), Y(py)); break; } const sx = X(px), sy = Y(py); if (Math.abs(sx - lastX) + Math.abs(sy - lastY) < 1.5*dpr && i < n - 1) continue; lastX = sx; lastY = sy; x.lineTo(sx, sy); }
    if (started){ x.strokeStyle = 'rgba(6,30,48,.75)'; x.lineWidth = 8*dpr; x.stroke(); x.strokeStyle = '#3fb4ff'; x.lineWidth = 4.6*dpr; x.stroke(); } }
  else if (NV.dest){ x.setLineDash([5*dpr, 5*dpr]); x.strokeStyle = 'rgba(63,180,255,.85)'; x.lineWidth = 2.5*dpr; x.beginPath(); x.moveTo(X(C.x), Y(C.y)); x.lineTo(X(NV.dest.x), Y(NV.dest.y)); x.stroke(); x.setLineDash([]); }
  // markers and the destination (kept upright: drawn after undoing the rotation at their spot)
  const lim = W*0.45, drawAt = (wx, wy, fn) => { let dx = X(wx), dy = Y(wy); const cs = Math.cos(C.psi - NPI/2), sn = Math.sin(C.psi - NPI/2); let sx = dx*cs - dy*sn, sy = dx*sn + dy*cs; const r = Math.hypot(sx, sy + W*0.08), rim = r > lim; if (rim){ sx = sx/r*lim; sy = (sy + W*0.08)/r*lim - W*0.08; } x.save(); x.rotate(-(C.psi - NPI/2)); x.translate(sx, sy); fn(rim); x.restore(); };
  const t = performance.now()/1000;
  for (const m of mk) drawAt(m.x, m.y, rim => navIcon(x, m, dpr*(rim ? 0.75 : 1), t));
  if (NV.dest) drawAt(NV.dest.x, NV.dest.y, rim => navPin(x, NV.dest.color, dpr*(rim ? 0.8 : 1)));
  x.restore();
  x.save(); x.translate(W/2, W*0.58); x.fillStyle = '#ff3b30'; x.strokeStyle = '#fff'; x.lineWidth = 1.6*dpr; x.beginPath(); x.moveTo(0, -8*dpr); x.lineTo(5.5*dpr, 6*dpr); x.lineTo(0, 3*dpr); x.lineTo(-5.5*dpr, 6*dpr); x.closePath(); x.fill(); x.stroke(); x.restore();
}
// marker icons (canvas, at the current origin)
function navIcon(x, m, k, t){
  const col = m.color || '#ffcf4a', ic = m.icon || 'pin', r = 6*k;
  if (m.pulse){ const ph = (t*1.4) % 1; x.strokeStyle = col; x.globalAlpha = 1 - ph; x.lineWidth = 2*k; x.beginPath(); x.arc(0, 0, r + ph*12*k, 0, NTAU); x.stroke(); x.globalAlpha = 1; }
  if (ic === 'creature'){ x.fillStyle = col; x.strokeStyle = '#1a0606'; x.lineWidth = 1.5*k; x.beginPath(); for (let i = 0; i < 10; i++){ const a = i/10*NTAU - NPI/2, rr = i % 2 ? r*0.9 : r*1.7; x.lineTo(Math.cos(a)*rr, Math.sin(a)*rr); } x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#fff3b0'; x.beginPath(); x.arc(-2.2*k, -1*k, 1.3*k, 0, NTAU); x.arc(2.2*k, -1*k, 1.3*k, 0, NTAU); x.fill(); return; }
  if (ic === 'checkpoint'){ x.fillStyle = col; x.strokeStyle = '#061218'; x.lineWidth = 1.6*k; x.beginPath(); x.moveTo(0, -r*1.25); x.lineTo(r*1.05, 0); x.lineTo(0, r*1.25); x.lineTo(-r*1.05, 0); x.closePath(); x.fill(); x.stroke(); if (m.label && /\d/.test(m.label) && k > 0.8){ x.fillStyle = '#061218'; x.font = `700 ${7*k}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(m.label).replace(/\D+/g, '').slice(0, 2), 0, 0.5*k); } return; }
  if (ic === 'flag'){ x.fillStyle = '#fff'; x.fillRect(-4*k, -4*k, 8*k, 8*k); x.fillStyle = '#111'; x.fillRect(-4*k, -4*k, 4*k, 4*k); x.fillRect(0, 0, 4*k, 4*k); x.strokeStyle = '#111'; x.lineWidth = 1*k; x.strokeRect(-4*k, -4*k, 8*k, 8*k); return; }
  if (ic === 'car'){ x.fillStyle = col; x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 1*k; x.beginPath(); x.arc(0, 0, 3.6*k, 0, NTAU); x.fill(); x.stroke(); return; }
  if (ic === 'pin'){ navPin(x, col, k*0.85); return; }
  if (ic === 'star'){ x.fillStyle = col; x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = 1*k; x.beginPath(); for (let i = 0; i < 10; i++){ const a = i/10*NTAU - NPI/2, rr = i % 2 ? r*0.45 : r; x.lineTo(Math.cos(a)*rr, Math.sin(a)*rr); } x.closePath(); x.fill(); x.stroke(); return; }
  // any other text / emoji in a disc
  x.fillStyle = col; x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = 1*k; x.beginPath(); x.arc(0, 0, r*1.25, 0, NTAU); x.fill(); x.stroke();
  x.fillStyle = '#111'; x.font = `${9*k}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(ic).slice(0, 2), 0, 0.5*k);
}
function navPin(x, col, k){ x.fillStyle = col || '#ff3b6b'; x.strokeStyle = '#fff'; x.lineWidth = 1.8*k; x.beginPath(); x.arc(0, -11*k, 6.5*k, NPI*0.85, NPI*0.15); x.lineTo(0, 0); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#fff'; x.beginPath(); x.arc(0, -11*k, 2.4*k, 0, NTAU); x.fill(); }

// ================================================================ the route ribbon in 3D and the destination beacon
const RB = {mesh:null, geo:null, mat:null, n:0, step:4, beacon:null, bmat:null};
// seen from far (the main view, the big zoom-outs) the ribbon widens with the distance to the camera so that it stays visible
const RB_VS = `attribute float aS; attribute float aU; attribute vec2 aN; varying float vS; varying float vU;
void main(){ vS = aS; vU = aU; vec3 p = position; float d = distance(cameraPosition, p); float w = clamp(d * 0.012 - 1.0, 0.0, 40.0);
  p.xz += aN * (aU * 2.0 - 1.0) * w; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`;
const RB_FS = `uniform float uS0; uniform float uT; uniform float uNight; uniform float uLen; uniform float uFar; uniform vec3 uCol; varying float vS; varying float vU;
void main(){
  float ds = vS - uS0; if (ds < -3.0) discard;
  float edge = smoothstep(0.0, 0.2, vU) * smoothstep(1.0, 0.8, vU);
  float ch = fract((vS + abs(vU - 0.5) * 7.0) * 0.08 - uT * 0.9);
  float c = smoothstep(0.0, 0.12, ch) * (1.0 - smoothstep(0.28, 0.42, ch));
  float near = smoothstep(-3.0, 9.0, ds), far = 1.0 - smoothstep(uFar * 0.6, uFar, ds), end = 1.0 - smoothstep(uLen - 4.0, uLen, vS);
  float a = (0.3 + 0.5 * c) * edge * near * far * end;
  vec3 col = mix(uCol, vec3(0.92, 0.98, 1.0), c * 0.55) * (1.0 + uNight * 1.3);
  gl_FragColor = vec4(col, a * (0.9 + 0.5 * uNight));
}`;
function navRibbonMat(){
  if (RB.mat) return RB.mat;
  RB.mat = new THREE.ShaderMaterial({uniforms:{uS0:{value:0}, uT:{value:0}, uNight:{value:0}, uLen:{value:1e9}, uFar:{value:1100}, uCol:{value:new THREE.Color('#3a7cff')}}, vertexShader:RB_VS, fragmentShader:RB_FS,
    transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-4, polygonOffsetUnits:-8, side:THREE.DoubleSide});
  return RB.mat;
}
const RB_W = [[26, 13], [6.5, 6.5], [20, 11], [6.5, 6.5], [15, 10], [6, 6], [12, 8], [5.5, 5.5], [9.5, 7], [5, 5], [7, 5.5]];
function navRibbonClear(){ if (RB.mesh){ scene.remove(RB.mesh); RB.geo.dispose(); RB.mesh = null; RB.geo = null; } }
function navRibbonBuild(R){
  navRibbonClear(); if (!R || R.L < 5) return;
  const step = RB.step, n = Math.max(2, Math.floor(R.L/step) + 2), P = new Float32Array(n*2*3), S = new Float32Array(n*2), U = new Float32Array(n*2), NN = new Float32Array(n*4), off = new Float32Array(n), side = navLHD() ? 1 : -1, w = 2.4;
  const pt = {}; const xs = new Float64Array(n), ys = new Float64Array(n), es = new Float32Array(n), dxs = new Float32Array(n), dys = new Float32Array(n);
  for (let i = 0; i < n; i++){ const s = Math.min(R.L, i*step); NAVG.at(R, s, pt); xs[i] = pt.x; ys[i] = pt.y; es[i] = pt.e; const c = Math.min(10, R.C[pt.i]), ow = R.OW[pt.i]; off[i] = ow ? 0 : Math.min(3.6, RB_W[c][0]/4); }
  // smooth directions (±8 m) and lane offsets (±16 m)
  for (let i = 0; i < n; i++){ const a = Math.max(0, i - 2), b = Math.min(n - 1, i + 2), dx = xs[b] - xs[a], dy = ys[b] - ys[a], l = Math.hypot(dx, dy) || 1; dxs[i] = dx/l; dys[i] = dy/l; }
  const o2 = new Float32Array(n); for (let i = 0; i < n; i++){ let s = 0, c = 0; for (let j = Math.max(0, i - 4); j <= Math.min(n - 1, i + 4); j++){ s += off[j]; c++; } o2[i] = s/c; }
  for (let i = 0; i < n; i++){ const nx = -dys[i], ny = dxs[i], cx = xs[i] + nx*o2[i]*side, cy = ys[i] + ny*o2[i]*side, h = navGnd(cx, cy) + es[i] + 0.34;
    for (let j = 0; j < 2; j++){ const sg = j ? -1 : 1, q = (i*2 + j)*3, px = cx + nx*w*0.5*sg, py = cy + ny*w*0.5*sg; P[q] = px; P[q + 1] = h; P[q + 2] = -py; S[i*2 + j] = Math.min(R.L, i*step); U[i*2 + j] = j; NN[(i*2 + j)*2] = -nx; NN[(i*2 + j)*2 + 1] = ny; } }
  const I = new Uint32Array((n - 1)*6); for (let i = 0; i < n - 1; i++){ const a = i*2, q = i*6; I[q] = a; I[q + 1] = a + 1; I[q + 2] = a + 2; I[q + 3] = a + 1; I[q + 4] = a + 3; I[q + 5] = a + 2; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aS', new THREE.BufferAttribute(S, 1)); g.setAttribute('aU', new THREE.BufferAttribute(U, 1)); g.setAttribute('aN', new THREE.BufferAttribute(NN, 2)); g.setIndex(new THREE.BufferAttribute(I, 1));
  const m = new THREE.Mesh(g, navRibbonMat()); m.frustumCulled = false; m.renderOrder = 3; m.name = 'navRibbon';
  RB.geo = g; RB.mesh = m; RB.n = n; navRibbonMat().uniforms.uLen.value = R.L; scene.add(m);
}
function navRibbonTick(t){
  if (!RB.mesh) return; const R = NV.R, vis = !!(R && !navRaceOn() && !(BM.open && navDrv())); if (RB.mesh.visible !== vis) RB.mesh.visible = vis; if (!vis) return;
  const s0 = R.car ? NV.s : 0, U = RB.mat.uniforms, drv = !!navDrv(), far = drv ? 1100 : 1e7; U.uS0.value = s0; U.uT.value = t % 1000; U.uFar.value = far;
  const i0 = Math.max(0, Math.floor((s0 - 6)/RB.step)), i1 = Math.min(RB.n - 1, i0 + Math.ceil((drv ? 1150 : 1e7)/RB.step)); RB.geo.setDrawRange(i0*6, Math.max(0, i1 - i0)*6);
}
// a tall translucent beam at the destination (seen from far; not for checkpoints: their module draws its own)
function navBeacon(){
  const D = NV.dest;
  if (!D || !D.beacon){ if (RB.beacon) RB.beacon.visible = false; return; }
  if (!RB.beacon){
    RB.bmat = new THREE.ShaderMaterial({uniforms:{uT:{value:0}, uCol:{value:new THREE.Color('#ff3b6b')}, uNight:{value:0}}, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide,
      vertexShader:'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader:'uniform float uT; uniform vec3 uCol; uniform float uNight; varying vec2 vUv; void main(){ float e = 1.0 - abs(vUv.x - 0.5) * 2.0; float h = 1.0 - vUv.y; float p = 0.75 + 0.25 * sin(uT * 3.0 - vUv.y * 12.0); gl_FragColor = vec4(uCol * (0.6 + uNight), e * e * h * p * (0.55 + 0.35 * uNight)); }'});
    const g = new THREE.CylinderGeometry(5, 5, 260, 16, 1, true); g.translate(0, 130, 0);
    RB.beacon = new THREE.Mesh(g, RB.bmat); RB.beacon.frustumCulled = false; RB.beacon.renderOrder = 4; RB.beacon.name = 'navBeacon'; scene.add(RB.beacon);
  }
  RB.bmat.uniforms.uCol.value.set(D.color || '#ff3b6b'); RB.beacon.position.set(D.x, navGnd(D.x, D.y), -D.y); RB.beacon.visible = true;
}
function navNight(nf){ const v = nClamp(+nf || 0, 0, 1); if (RB.mat) RB.mat.uniforms.uNight.value = v; if (RB.bmat) RB.bmat.uniforms.uNight.value = v; }

// ================================================================ the big map
const BM_CSS = `
.navbm{position:fixed;inset:0;z-index:40;background:#a7c2cf;color:var(--ink,#1b1e1c);font-family:var(--font-ui,system-ui,sans-serif);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}
.navbm[hidden]{display:none!important}
.navbm canvas.bmc{position:absolute;inset:0;width:100%;height:100%;cursor:grab;display:block}
.navbm canvas.bmc.drag{cursor:grabbing}
.bmp{background:var(--panel,#fbfaf6);border:1px solid var(--rule,rgba(0,0,0,.12));border-radius:10px;box-shadow:0 10px 32px rgba(27,30,28,.18)}
.bmtop{position:absolute;left:16px;top:calc(16px + env(safe-area-inset-top,0px));width:min(380px,calc(100% - 150px));display:flex;flex-direction:column;gap:6px}
.bmsearch{display:flex;align-items:center;gap:6px;padding:4px 6px 4px 11px}
.bmsearch i{font-style:normal;color:var(--muted,#6b6f69);font-size:14px}
.bmsearch input{flex:1;min-width:0;border:0;background:transparent;font:500 14px var(--font-ui,system-ui);color:var(--ink,#1b1e1c);padding:7px 2px;outline:none}
.bmsearch button,.bmbtn{appearance:none;border:1px solid var(--rule,rgba(0,0,0,.12));background:var(--panel,#fbfaf6);color:var(--ink,#1b1e1c);border-radius:8px;cursor:pointer;font:600 12px var(--font-ui,system-ui);padding:6px 10px;white-space:nowrap}
.bmsearch button{border:0;background:transparent;font-size:16px;padding:4px 6px;color:var(--muted,#6b6f69)}
.bmres{max-height:min(56vh,430px);overflow:auto;padding:4px}
.bmres[hidden]{display:none}
.bmres h4{margin:6px 8px 3px;font:600 9.5px var(--font-mono,monospace);letter-spacing:.12em;color:var(--muted,#6b6f69)}
.bmres button{appearance:none;display:flex;align-items:center;gap:9px;width:100%;border:0;background:transparent;text-align:left;padding:6px 8px;border-radius:7px;cursor:pointer;color:var(--ink,#1b1e1c);font:inherit}
.bmres button:hover,.bmres button.on{background:var(--panel-2,rgba(0,0,0,.05))}
.bmres button i{font-style:normal;width:22px;text-align:center;font-size:15px;flex:none}
.bmres button span{flex:1;min-width:0}
.bmres button b{display:block;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bmres button small{display:block;font:400 10px var(--font-mono,monospace);color:var(--muted,#6b6f69);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bmres button em{font-style:normal;font:500 10px var(--font-mono,monospace);color:var(--muted,#6b6f69);flex:none}
.bmres p{margin:8px;font-size:12px;color:var(--muted,#6b6f69)}
.bmclose{position:absolute;right:16px;top:calc(16px + env(safe-area-inset-top,0px));display:flex;align-items:center;gap:7px;padding:7px 12px}
.bmclose b{font-size:16px;line-height:1}.bmclose small{font:500 10px var(--font-mono,monospace);color:var(--muted,#6b6f69)}
.bmzoom{position:absolute;right:16px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:6px}
.bmzoom button{width:40px;height:40px;padding:0;font-size:19px;font-weight:500;display:grid;place-items:center}
.bmcard{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(18px + env(safe-area-inset-bottom,0px));width:min(640px,calc(100% - 32px));box-sizing:border-box;padding:11px 13px;display:flex;align-items:center;gap:12px}
.bmcard[hidden]{display:none}
.bmcard .bi{font-size:22px;flex:none;width:30px;text-align:center}
.bmcard .bt{flex:1;min-width:0}
.bmcard .bt b{display:block;font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bmcard .bt small{display:block;font:400 11px var(--font-mono,monospace);color:var(--muted,#6b6f69);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.bmcard .bb{display:flex;gap:6px;flex:none}.bmcard .bb .bmbtn{padding:6px 9px}
.bmbtn.go{background:#1d6b42;border-color:#1d6b42;color:#fff}.bmbtn.go:hover{background:#238251}
.bmbtn.star{font-size:15px;padding:5px 9px}.bmbtn.star.on{color:#d39b00}
.bmstat{position:absolute;left:16px;bottom:calc(18px + env(safe-area-inset-bottom,0px));font:500 10px var(--font-mono,monospace);color:#25302f;background:rgba(251,250,246,.78);padding:3px 7px;border-radius:6px;pointer-events:none}
.bmscale{position:absolute;right:66px;bottom:calc(18px + env(safe-area-inset-bottom,0px));font:500 10px var(--font-mono,monospace);color:#25302f;pointer-events:none;text-align:center}
.bmscale i{display:block;height:5px;border:1.5px solid #25302f;border-top:0;margin-top:2px}
.bmhint{position:absolute;left:50%;top:calc(16px + env(safe-area-inset-top,0px));transform:translateX(-50%);font:500 11px var(--font-mono,monospace);color:#25302f;background:rgba(251,250,246,.82);padding:5px 10px;border-radius:7px;pointer-events:none;white-space:nowrap}
@media (max-width:1100px){ .bmhint{display:none} }
@media (max-width:760px){ .bmtop{left:10px;top:calc(10px + env(safe-area-inset-top,0px));width:calc(100% - 76px)} .bmclose{right:10px;top:calc(10px + env(safe-area-inset-top,0px));padding:8px 10px} .bmclose small{display:none}
  .bmzoom{right:10px} .bmzoom button{width:44px;height:44px} .bmcard{bottom:calc(10px + env(safe-area-inset-bottom,0px));flex-wrap:wrap;gap:8px} .bmcard .bb{width:100%;justify-content:flex-end} .bmstat{display:none} .bmscale{right:62px;bottom:auto;top:calc(64px + env(safe-area-inset-top,0px))} }
`;
const BM = {open:false, el:null, cv:null, ctx:null, W:0, H:0, dpr:1, cx:0, cy:0, sc:0.05, dirty:true, tiles:new Map(), tileT:0, tileMs:0, tilesMade:0, LI:null, liGen:null, liY:{sl:4, t:0, ext:true},
  ptr:new Map(), pinch:null, drag:null, follow:true, sel:null, lastDraw:0, drawMs:0, drawMsMax:0, frames:0, wTxt:new Map(), q:null, opened:0, gen:0,
  zD:null, fade:null, legacy:false, railMs:0, tileN:0, tileSum:0, swaps:0};
const BM_FADE = 220;
const BM_TS = 256, BM_ZMAX = 8, BM_TILEMAX = 140;
const BM_MINZ = [0, 0, 0, 0, 2, 2, 3, 3, 4, 4, 5, 8, 99, 2, 3, 2, 3, 7, 3];
const BM_FILL = ['#f39c3c', '#f39c3c', '#f7bf55', '#f7bf55', '#fbdc79', '#fbdc79', '#fdf3b6', '#fdf3b6', '#ffffff', '#ffffff', '#ffffff', '#fbfaf6', '#000', '#d6d2ca', '#dcd8d0', '#6b6b70', '#8a6db0', '#dccfb9', '#e3503e'];
const BM_CASE = ['#b8661c', '#b8661c', '#b98a2e', '#b98a2e', '#bfa148', '#bfa148', '#b9ad83', '#b9ad83', '#b3ad9f', '#b3ad9f', '#c2bcb0', '#cdc8bd', '#000', '#b9b5ad', '#c4c0b8', '#6b6b70', '#8a6db0', '#b8ab95', '#8f2a1e'];
const BM_WID = [26, 8, 20, 7, 15, 6, 12, 5.5, 9.5, 5, 7, 4.5, 2.5, 50, 20, 3, 3, 4, 12];
const BM_MINPX = [2.4, 1.2, 2.2, 1.1, 1.8, 1, 1.4, 0.9, 1.2, 0.8, 0.9, 0.6, 0.5, 1.5, 1, 1.2, 1.2, 0.8, 1.6];
function bmHalf(){ return SGR.base ? SGR.base.HALF : HALF; }
function navOpen(o){
  o = o || {}; if (!navReady()) { try { showToast('地图还在载入 · The map is still loading'); } catch (e){ /* */ } return false; }
  bmBuild(); navWant(); BM.liWant = true;
  if (!BM.open){ BM.open = true; BM.el.hidden = false; BM.opened = performance.now(); bmResize();
    const C = navCar(), T = controls.target, cx = C ? C.x : T.x, cy = C ? C.y : -T.z;
    if (!BM.sc0){ BM.sc0 = true; BM.sc = Math.max(bmMinSc(), 0.06); BM.cx = cx; BM.cy = cy; }
    else if (BM.follow || C){ BM.cx = cx; BM.cy = cy; }
    BM.follow = !!C; BM.sel = null; BM.dirty = true; bmCard(); }
  if (o.search){ setTimeout(() => { BM.q.focus(); BM.q.select(); bmResults(); }, 30); }
  return true;
}
function navClose(){ if (!BM.open) return false; BM.open = false; BM.el.hidden = true; BM.res.hidden = true; BM.ptr.clear(); BM.pinch = null; BM.drag = null; try { BM.q.blur(); } catch (e){ /* */ } BM.gen += 2; bmTrim(bmTileMem()); return true; }
function navToggle(o){ return BM.open ? (navClose(), false) : navOpen(o); }
function bmMinSc(){ return Math.min(BM.W, BM.H)/(2*bmHalf())*1.02; }
function bmBuild(){
  if (BM.el) return; const st = document.createElement('style'); st.textContent = BM_CSS; document.head.appendChild(st);
  const d = document.createElement('div'); d.className = 'navbm'; d.id = 'navBM'; d.hidden = true; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', '大地图 Big map');
  d.innerHTML = `<canvas class="bmc" id="bmCv" aria-label="城市地图 City map"></canvas>
<div class="bmhint">拖动平移 · 滚轮/双指缩放 · 点击选点 &nbsp;Drag · wheel / pinch · click a place</div>
<div class="bmtop"><div class="bmsearch bmp"><i>⌕</i><input id="bmQ" type="search" enterkeyhint="search" autocomplete="off" spellcheck="false" placeholder="搜索 地标、地点、车站、道路 · Search places, roads" aria-label="搜索 Search"><button type="button" id="bmQx" aria-label="清除 Clear">×</button></div>
<div class="bmres bmp" id="bmRes" hidden></div></div>
<button class="bmclose bmp" id="bmClose" type="button" aria-label="关闭地图 Close the map"><b>×</b><small>关闭 CLOSE · M</small></button>
<div class="bmzoom"><button class="bmbtn bmp" id="bmZi" type="button" aria-label="放大 Zoom in">+</button><button class="bmbtn bmp" id="bmZo" type="button" aria-label="缩小 Zoom out">−</button><button class="bmbtn bmp" id="bmLoc" type="button" title="回到车辆/视角 Centre" aria-label="回到车辆 Centre">◎</button><button class="bmbtn bmp" id="bmAll" type="button" title="全城 Whole city" aria-label="全城 Whole city">⤢</button></div>
<div class="bmcard bmp" id="bmCard" hidden></div><div class="bmstat" id="bmStat"></div><div class="bmscale" id="bmScale"><span>–</span><i></i></div>`;
  document.body.appendChild(d); BM.el = d; BM.cv = d.querySelector('#bmCv'); BM.ctx = BM.cv.getContext('2d'); BM.q = d.querySelector('#bmQ'); BM.res = d.querySelector('#bmRes'); BM.card = d.querySelector('#bmCard'); BM.stat = d.querySelector('#bmStat'); BM.scale = d.querySelector('#bmScale');
  d.querySelector('#bmClose').addEventListener('click', () => navClose());
  d.querySelector('#bmZi').addEventListener('click', () => bmZoom(2, BM.W/2, BM.H/2));
  d.querySelector('#bmZo').addEventListener('click', () => bmZoom(0.5, BM.W/2, BM.H/2));
  d.querySelector('#bmLoc').addEventListener('click', () => { const C = navCar(), T = controls.target; BM.cx = C ? C.x : T.x; BM.cy = C ? C.y : -T.z; BM.follow = !!C; if (BM.sc < 0.25) BM.sc = 0.25; BM.dirty = true; });
  d.querySelector('#bmAll').addEventListener('click', () => { BM.cx = 0; BM.cy = 0; BM.sc = bmMinSc(); BM.follow = false; BM.dirty = true; });
  d.querySelector('#bmQx').addEventListener('click', () => { BM.q.value = ''; BM.q.focus(); bmResults(); });
  BM.q.addEventListener('input', () => bmResults());
  BM.q.addEventListener('focus', () => bmResults());
  BM.q.addEventListener('keydown', e => { e.stopPropagation(); const L = [...BM.res.querySelectorAll('button[data-i]')]; let i = L.findIndex(b => b.classList.contains('on'));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); if (L.length){ i = (i + (e.key === 'ArrowDown' ? 1 : -1) + L.length) % L.length; L.forEach((b, j) => b.classList.toggle('on', j === i)); L[i].scrollIntoView({block:'nearest'}); } }
    else if (e.key === 'Enter'){ e.preventDefault(); const b = L[Math.max(0, i)]; if (b) b.click(); }
    else if (e.key === 'Escape'){ e.preventDefault(); if (BM.q.value){ BM.q.value = ''; bmResults(); } else { BM.res.hidden = true; BM.q.blur(); } } });
  BM.q.addEventListener('keyup', e => e.stopPropagation());
  BM.res.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (!b) return; const it = BM.resItems[+b.dataset.i]; if (it) bmPick(it); });
  document.addEventListener('pointerdown', e => { if (BM.open && !BM.res.hidden && !e.target.closest('.bmtop')) { BM.res.hidden = true; try { BM.q.blur(); } catch (_){ } } }, true);
  BM.card.addEventListener('click', e => { const b = e.target.closest('button[data-a]'); if (b) bmCardAct(b.dataset.a); });
  // pointers: drag to pan, two fingers to pinch, a short tap / click to pick
  const cv = BM.cv;
  cv.addEventListener('pointerdown', e => { try { cv.setPointerCapture(e.pointerId); } catch (_){ } BM.ptr.set(e.pointerId, {x:e.clientX, y:e.clientY, x0:e.clientX, y0:e.clientY, t:performance.now()});
    if (BM.ptr.size === 2){ const [a, b] = [...BM.ptr.values()]; BM.pinch = {d:Math.hypot(a.x - b.x, a.y - b.y) || 1, sc:BM.sc, mx:(a.x + b.x)/2, my:(a.y + b.y)/2}; BM.drag = null; }
    else if (BM.ptr.size === 1) BM.drag = {x:e.clientX, y:e.clientY, moved:0}; cv.classList.add('drag'); e.preventDefault(); });
  cv.addEventListener('pointermove', e => { const p = BM.ptr.get(e.pointerId); if (!p) return; const r = cv.getBoundingClientRect();
    if (BM.pinch && BM.ptr.size >= 2){ p.x = e.clientX; p.y = e.clientY; const [a, b] = [...BM.ptr.values()], d = Math.hypot(a.x - b.x, a.y - b.y) || 1, mx = (a.x + b.x)/2, my = (a.y + b.y)/2;
      const wx = BM.cx + (BM.pinch.mx - r.left - BM.W/2)/BM.sc, wy = BM.cy - (BM.pinch.my - r.top - BM.H/2)/BM.sc;
      BM.sc = bmClampSc(BM.pinch.sc*d/BM.pinch.d); BM.cx = wx - (mx - r.left - BM.W/2)/BM.sc; BM.cy = wy + (my - r.top - BM.H/2)/BM.sc; BM.pinch.sc = BM.sc; BM.pinch.d = d; BM.pinch.mx = mx; BM.pinch.my = my; BM.follow = false; BM.dirty = true; return; }
    if (BM.drag){ const dx = e.clientX - BM.drag.x, dy = e.clientY - BM.drag.y; BM.drag.x = e.clientX; BM.drag.y = e.clientY; BM.drag.moved += Math.abs(dx) + Math.abs(dy); if (BM.drag.moved > 4){ BM.cx -= dx/BM.sc; BM.cy += dy/BM.sc; BM.follow = false; BM.dirty = true; } }
    p.x = e.clientX; p.y = e.clientY; });
  const up = e => { const p = BM.ptr.get(e.pointerId); if (!p) return; BM.ptr.delete(e.pointerId); cv.classList.remove('drag');
    const wasPinch = !!BM.pinch; if (BM.ptr.size < 2) BM.pinch = null;
    if (!wasPinch && BM.drag && BM.drag.moved < 7 && performance.now() - p.t < 650 && e.type === 'pointerup'){ const r = cv.getBoundingClientRect(); bmClick(e.clientX - r.left, e.clientY - r.top); }
    if (!BM.ptr.size) BM.drag = null; else { const q = [...BM.ptr.values()][0]; BM.drag = {x:q.x, y:q.y, moved:99}; } };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(), k = Math.exp(-(e.deltaMode === 1 ? e.deltaY*30 : e.deltaY)*0.0018); bmZoom(k, e.clientX - r.left, e.clientY - r.top); }, {passive:false});
  cv.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('resize', () => { if (BM.open) bmResize(); });
}
function bmClampSc(s){ return nClamp(s, bmMinSc()*0.9, 3.2); }
function bmZoom(k, mx, my){ const wx = BM.cx + (mx - BM.W/2)/BM.sc, wy = BM.cy - (my - BM.H/2)/BM.sc; BM.sc = bmClampSc(BM.sc*k); BM.cx = wx - (mx - BM.W/2)/BM.sc; BM.cy = wy + (my - BM.H/2)/BM.sc; if (k < 1 || mx !== BM.W/2) BM.follow = false; BM.dirty = true; }
function bmResize(){ const W = BM.el.clientWidth || innerWidth, H = BM.el.clientHeight || innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
  BM.W = W; BM.H = H; BM.dpr = dpr; BM.cv.width = Math.round(W*dpr); BM.cv.height = Math.round(H*dpr); BM.dirty = true; }
const bmSX = x => (x - BM.cx)*BM.sc + BM.W/2, bmSY = y => (BM.cy - y)*BM.sc + BM.H/2;
const bmWX = sx => BM.cx + (sx - BM.W/2)/BM.sc, bmWY = sy => BM.cy - (sy - BM.H/2)/BM.sc;
// ---- the line index for the tiles: 1 km cells (CSR), built in slices the first time the map opens
function* bmIndexGen(lines, HALFm, Y){
  const CS = 1000, GN = Math.ceil(2*HALFm/CS) + 2, G0 = -HALFm - CS, n = lines.length, BB = new Float32Array(n*4), cl = v => { const c = Math.floor((v - G0)/CS); return c < 0 ? 0 : c >= GN ? GN - 1 : c; };
  const S = new Int32Array(GN*GN + 1); let i = 0;
  while (i < n){ for (; i < n; i++){ if ((i & 255) === 0 && Date.now() > Y.t) break; const l = lines[i]; if (l.c === 12 || l.c > 18){ BB[i*4] = 1; BB[i*4 + 2] = 0; continue; } const P = l.P; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (let k = 0; k < P.length; k += 2){ const x = P[k], y = P[k + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      BB[i*4] = x0; BB[i*4 + 1] = y0; BB[i*4 + 2] = x1; BB[i*4 + 3] = y1; for (let cy = cl(y0); cy <= cl(y1); cy++) for (let cx = cl(x0); cx <= cl(x1); cx++) S[cy*GN + cx + 1]++; }
    if (i < n) yield 0.5*i/n; }
  for (let c = 0; c < GN*GN; c++) S[c + 1] += S[c];
  const I = new Int32Array(S[GN*GN]), F = S.slice(0, GN*GN); i = 0;
  while (i < n){ for (; i < n; i++){ if ((i & 1023) === 0 && Date.now() > Y.t) break; if (BB[i*4] > BB[i*4 + 2]) continue; const x0 = BB[i*4], y0 = BB[i*4 + 1], x1 = BB[i*4 + 2], y1 = BB[i*4 + 3]; for (let cy = cl(y0); cy <= cl(y1); cy++) for (let cx = cl(x0); cx <= cl(x1); cx++) I[F[cy*GN + cx]++] = i; }
    if (i < n) yield 0.5 + 0.5*i/n; }
  return {CS, GN, G0, S, I, BB, stamp:new Uint32Array(n), gen:0};
}
function bmIndexTick(){
  if (BM.LI || !BM.liWant || !navReady()) return; if (!BM.liGen) BM.liGen = bmIndexGen(SGR.lines, bmHalf(), BM.liY);
  BM.liY.t = Date.now() + (BM.open ? 8 : 4); const r = BM.liGen.next(); if (r.done){ BM.LI = r.value; BM.liGen = null; BM.dirty = true; }
}
// ---- tiles: the ground texture (washed light) with the roads of one tile at one zoom (rail and stations are a vector overlay)
// the ground texture for the world square (wx0, wy1 top-left, side wm metres) into ctx at (dx, dy), side dpx
function bmGround(c, wx0, wy1, wm, dx, dy, dpx){
  const img = SGR.baseCv || SGR.img, H2 = bmHalf(); if (!img) return; const IW = img.width || 4096, ipm = IW/(2*H2);
  const ax = Math.max(-H2, wx0), bx = Math.min(H2, wx0 + wm), ay = Math.min(H2, wy1), by = Math.max(-H2, wy1 - wm); if (bx <= ax || ay <= by) return; const k = dpx/wm;
  c.imageSmoothingEnabled = true; c.drawImage(img, (ax + H2)*ipm, (H2 - ay)*ipm, (bx - ax)*ipm, (ay - by)*ipm, dx + (ax - wx0)*k, dy + (wy1 - ay)*k, (bx - ax)*k, (ay - by)*k);
  c.fillStyle = 'rgba(248,246,240,0.30)'; c.fillRect(dx + (ax - wx0)*k, dy + (wy1 - ay)*k, (bx - ax)*k, (ay - by)*k);
}
// v36 (lm32/detail): zoomed in, the tiles draw the land cover sharply (vectors over the old texture, the sea from the water mesh)
function bmGroundT(c, wx0, wy1, wm, px){
  const D = window.SGDetail;
  if (!D || !D.ready || wm/px > 9){ bmGround(c, wx0, wy1, wm, 0, 0, px); return; }
  const bld = wm/px <= 3.2;      // ~1:12 000 and closer: building footprints (and the Bay / New York roof grain washed out under them)
  D.paint(c, wx0, wy1, wm, 0, 0, px, {sea:true, map:true, bld, pre:bld && D.speckle ? 0.5 : 0});
  c.fillStyle = 'rgba(248,246,240,0.30)'; c.fillRect(0, 0, px, px);
}
function bmTileKey(z, tx, ty){ return (BM.legacy ? 16 + z : z)*1048576 + ty*1024 + tx; }
function bmTileRender(z, tx, ty){
  const LI = BM.LI, H2 = bmHalf(), TWm = 2*H2/(1 << z), x0 = -H2 + tx*TWm, y1 = H2 - ty*TWm, x1 = x0 + TWm, y0 = y1 - TWm, px = Math.round(BM_TS*Math.min(2, BM.dpr)), k = px/TWm;
  const cv = document.createElement('canvas'); cv.width = cv.height = px; const c = cv.getContext('2d'); c.lineCap = 'round'; c.lineJoin = 'round';
  bmGroundT(c, x0, y1, TWm, px);
  const m = 30/k + 40, gen = ++LI.gen, L = [], lines = SGR.lines, cl = v => { const q = Math.floor((v - LI.G0)/LI.CS); return q < 0 ? 0 : q >= LI.GN ? LI.GN - 1 : q; };
  for (let cy = cl(y0 - m); cy <= cl(y1 + m); cy++) for (let cx = cl(x0 - m); cx <= cl(x1 + m); cx++){ const ce = cy*LI.GN + cx;
    for (let q = LI.S[ce]; q < LI.S[ce + 1]; q++){ const i = LI.I[q]; if (LI.stamp[i] === gen) continue; LI.stamp[i] = gen; const l = lines[i]; if (BM_MINZ[l.c] > z) continue;
      const b = i*4; if (LI.BB[b] > x1 + m || LI.BB[b + 2] < x0 - m || LI.BB[b + 1] > y1 + m || LI.BB[b + 3] < y0 - m) continue; L.push(i); } }
  const byC = new Array(19); for (let i = 0; i < 19; i++) byC[i] = [];
  for (const i of L) byC[lines[i].c].push(i);
  const path = (i, simp) => { const P = lines[i].P; let lx = 1e9, ly = 1e9; for (let q = 0; q < P.length; q += 2){ const sx = (P[q] - x0)*k, sy = (y1 - P[q + 1])*k; if (q && q < P.length - 2 && Math.abs(sx - lx) + Math.abs(sy - ly) < simp) continue; if (q) c.lineTo(sx, sy); else c.moveTo(sx, sy); lx = sx; ly = sy; } };
  const wid = cls => Math.max(BM_MINPX[cls]*(px/BM_TS), BM_WID[cls]*k);
  const order = [11, 17, 13, 14, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 18];
  // casings (from zoom 3), then fills; foreign context paler
  if (z >= 3) for (const cls of order){ const A = byC[cls]; if (!A.length || cls === 13 || cls === 14) continue; c.strokeStyle = BM_CASE[cls]; c.lineWidth = wid(cls) + 1.6*(px/BM_TS); c.beginPath(); for (const i of A) path(i, 0.8); c.stroke(); }
  for (const cls of order){ const A = byC[cls]; if (!A.length) continue; c.strokeStyle = BM_FILL[cls]; c.lineWidth = wid(cls); c.globalAlpha = 1;
    c.beginPath(); let anyF = false; for (const i of A){ if (lines[i].flags & 8){ anyF = true; continue; } path(i, 0.8); } c.stroke();
    if (anyF){ c.globalAlpha = 0.45; c.beginPath(); for (const i of A) if (lines[i].flags & 8) path(i, 0.8); c.stroke(); c.globalAlpha = 1; } }
  // [v33 legacy test mode only] rail baked into the tiles: the cause of the thick / thin rail when coarser tiles were magnified
  if (BM.legacy){ for (const cls of [15, 16]){ const A = byC[cls]; if (!A.length) continue; c.strokeStyle = BM_FILL[cls]; c.lineWidth = Math.max(1.2*(px/BM_TS), 3*k); c.setLineDash([4*(px/BM_TS), 3*(px/BM_TS)]); c.beginPath(); for (const i of A) path(i, 0.8); c.stroke(); c.setLineDash([]); }
  if (z >= 2) for (const r of bmRailLines()){ const b = r.bb; if (b[0] > x1 || b[2] < x0 || b[1] > y1 || b[3] < y0) continue; c.strokeStyle = r.col; c.globalAlpha = 0.85; c.lineWidth = Math.max(1.4*(px/BM_TS), 4*k);
    c.beginPath(); let lx = 1e9, ly = 1e9; r.pts.forEach((p, q) => { const sx = (p[0] - x0)*k, sy = (y1 - p[1])*k; if (q && q < r.pts.length - 1 && Math.abs(sx - lx) + Math.abs(sy - ly) < 1) return; if (q) c.lineTo(sx, sy); else c.moveTo(sx, sy); lx = sx; ly = sy; }); c.stroke(); c.globalAlpha = 1; } }
  return cv;
}
// the tile zoom for the view: tiles drawn at 0.71-1.41 x their own resolution
function bmTileZ(){ return nClamp(Math.ceil(Math.log2(BM.sc*2*bmHalf()/BM_TS) - (BM.legacy ? 0.15 : 0.5)), 0, BM_ZMAX); }
// tile index range of the view (+ ring tiles around it) at zoom z
function bmRange(z, ring){ const H2 = bmHalf(), TWm = 2*H2/(1 << z), nT = 1 << z;
  return [Math.max(0, Math.floor((bmWX(0) + H2)/TWm) - ring), Math.min(nT - 1, Math.floor((bmWX(BM.W) + H2)/TWm) + ring), Math.max(0, Math.floor((H2 - bmWY(0))/TWm) - ring), Math.min(nT - 1, Math.floor((H2 - bmWY(BM.H))/TWm) + ring), TWm]; }
function bmReady(z){ if (!BM.LI) return false; const [tx0, tx1, ty0, ty1] = bmRange(z, 0); for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) if (!BM.tiles.has(bmTileKey(z, tx, ty))) return false; return true; }
// render missing visible tiles within a time budget (nearest the centre first)
// only the target zoom is rendered (tiles that left the view are never started), nearest the centre first, then one ring around
// the view for panning; returns the number rendered
function bmTilesTick(budget){
  if (!BM.open || !BM.LI) return 0; const z = bmTileZ(), H2 = bmHalf(); let made = 0;
  if (window.SGDetail && SGDetail.gen !== BM.dGen){ BM.dGen = SGDetail.gen; BM.tiles.clear(); BM.dirty = true; }   // v36: the sharp ground arrived
  if (BM.legacy && z > 2){ const [tx0, tx1, ty0, ty1] = bmRange(z, 0), f = 1 << (z - 2);   // [test] v33: the zoom-2 ancestors first
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++){ const k = bmTileKey(2, Math.floor(tx/f), Math.floor(ty/f)); if (!BM.tiles.has(k)){ BM.tiles.set(k, {cv:bmTileRender(2, Math.floor(tx/f), Math.floor(ty/f)), t:BM.gen}); made++; } } }
  for (const ring of [0, 1]){ const [tx0, tx1, ty0, ty1, TWm] = bmRange(z, ring), miss = [];
    // the target zoom's tiles in view are kept (touched) while they wait for the rest, so the cache never evicts them
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++){ const T = BM.tiles.get(bmTileKey(z, tx, ty)); if (T){ if (!ring) T.t = BM.gen; continue; } miss.push([tx, ty, Math.hypot((tx + 0.5)*TWm - H2 - BM.cx, H2 - (ty + 0.5)*TWm - BM.cy)]); }
    if (ring && (miss.length + BM.tiles.size > bmTileMax())) break;
    miss.sort((a, b) => a[2] - b[2]);
    const t0 = performance.now(); for (const [tx, ty] of miss){ const a = performance.now(), cv = bmTileRender(z, tx, ty), dt = performance.now() - a; BM.tiles.set(bmTileKey(z, tx, ty), {cv, t:BM.gen}); BM.tilesMade++; made++;
      BM.tileN++; BM.tileSum += dt; BM.tileMs = Math.max(BM.tileMs*0.9, dt); BM.dirty = true; if (performance.now() - t0 > budget) return made; } }
  const mx = bmTileMax(); if (BM.tiles.size > mx) bmTrim(mx - 8);
  return made;
}
// the tile cache: ~64 MB of pixels, at least 1.6 views' worth (large high-dpi screens: the old and the new zoom during a swap)
function bmTileMem(){ const px = Math.round(BM_TS*Math.min(2, BM.dpr)); return Math.floor(64e6/(px*px*4)); }
function bmTileMax(){ const tcss = BM_TS*0.7, view = (Math.ceil(BM.W/tcss) + 1)*(Math.ceil(BM.H/tcss) + 1); return Math.max(bmTileMem(), Math.ceil(view*1.6)); }
// least recently drawn first; tiles drawn or waited for in the last frames are never evicted
function bmTrim(keep){ if (BM.tiles.size <= keep) return; const L = [...BM.tiles.entries()].sort((a, b) => a[1].t - b[1].t); let n = BM.tiles.size;
  for (let i = 0; i < L.length && n > keep; i++) if (L[i][1].t < BM.gen - 1){ BM.tiles.delete(L[i][0]); n--; } }
// ---- rail / subway / MRT lines and heavy rail: a vector overlay at a constant screen width (never in the tiles), simplified per
// level of detail (Douglas-Peucker at 0.5 ... 512 m, cached as Path2D in world coordinates), culled by box
const RL = {lines:null, heavy:null, ms:0, n:0};
const RL_TOL = [0.5, 2, 8, 32, 128, 512];
function bmRailLines(){ if (RL.lines) return RL.lines; RL.lines = [];
  for (const m of (SGR.base && SGR.base.mrt) || []){ if (!m.pts || m.pts.length < 2) continue; const n = m.pts.length, P = new Float64Array(n*2); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < n; i++){ const x = m.pts[i][0], y = m.pts[i][1]; P[2*i] = x; P[2*i + 1] = y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    RL.lines.push({pts:m.pts, P:[P], col:m.col || '#777', bb:[x0, y0, x1, y1], paths:[]}); }
  // the road data's heavy rail (15) and monorail (16) lines, in 4 km chunks
  const cells = new Map(); for (const l of SGR.lines || []){ if (l.c !== 15 && l.c !== 16) continue; const P = l.P, key = l.c*1e6 + Math.floor(P[0]/4000)*1000 + Math.floor(P[1]/4000); let C = cells.get(key);
    if (!C) cells.set(key, C = {P:[], col:l.c === 16 ? BM_FILL[16] : '#77767a', bb:[1e9, 1e9, -1e9, -1e9], paths:[], dash:l.c === 15});
    const Q = Float64Array.from(P); C.P.push(Q); for (let k = 0; k < Q.length; k += 2){ C.bb[0] = Math.min(C.bb[0], Q[k]); C.bb[2] = Math.max(C.bb[2], Q[k]); C.bb[1] = Math.min(C.bb[1], Q[k + 1]); C.bb[3] = Math.max(C.bb[3], Q[k + 1]); } }
  RL.heavy = [...cells.values()];
  // zoomed out: one merged path per colour (shared trunk lines, few strokes)
  const g = new Map(); for (const o of RL.lines){ let G = g.get(o.col); if (!G) g.set(o.col, G = {P:[], col:o.col, bb:[1e9, 1e9, -1e9, -1e9], paths:[]}); G.P.push(o.P[0]); G.bb = [Math.min(G.bb[0], o.bb[0]), Math.min(G.bb[1], o.bb[1]), Math.max(G.bb[2], o.bb[2]), Math.max(G.bb[3], o.bb[3])]; }
  RL.groups = [...g.values()]; RL.all = {P:RL.lines.map(o => o.P[0]), paths:[]};
  return RL.lines;
}
// Douglas-Peucker (iterative) of a flat [x, y, ...] polyline
function bmDP(P, tol){ const n = P.length >> 1; if (n < 3) return P; const keep = new Uint8Array(n); keep[0] = keep[n - 1] = 1; const st = [0, n - 1], t2 = tol*tol;
  while (st.length){ const b = st.pop(), a = st.pop(); const ax = P[2*a], ay = P[2*a + 1], dx = P[2*b] - ax, dy = P[2*b + 1] - ay, l2 = dx*dx + dy*dy; let bi = -1, bd = t2;
    for (let i = a + 1; i < b; i++){ const px = P[2*i] - ax, py = P[2*i + 1] - ay; let d; if (l2 > 0){ const t = Math.max(0, Math.min(1, (px*dx + py*dy)/l2)), qx = px - dx*t, qy = py - dy*t; d = qx*qx + qy*qy; } else d = px*px + py*py; if (d > bd){ bd = d; bi = i; } }
    if (bi >= 0){ keep[bi] = 1; st.push(a, bi, bi, b); } }
  let m = 0; for (let i = 0; i < n; i++) if (keep[i]) m++; const O = new Float64Array(m*2); m = 0; for (let i = 0; i < n; i++) if (keep[i]){ O[2*m] = P[2*i]; O[2*m + 1] = P[2*i + 1]; m++; } return O; }
function bmRailPath(o, lv){ let p = o.paths[lv]; if (p) return p; p = new Path2D(); for (const P of o.P){ const Q = bmDP(P, RL_TOL[lv]); p.moveTo(Q[0], Q[1]); for (let k = 2; k < Q.length; k += 2) p.lineTo(Q[k], Q[k + 1]); } o.paths[lv] = p; return p; }
function bmRail(x, zf){
  if (typeof Path2D === 'undefined') return; const t0 = performance.now(), lines = bmRailLines(), sc = BM.sc, dpr = BM.dpr, tol = (zf < 4.5 ? 1.2 : 0.6)/sc; let lv = 0; while (lv < RL_TOL.length - 1 && RL_TOL[lv + 1] <= tol) lv++;
  const m = 20/sc, wx0 = bmWX(0) - m, wx1 = bmWX(BM.W) + m, wy0 = bmWY(BM.H) - m, wy1 = bmWY(0) + m, inV = b => !(b[0] > wx1 || b[2] < wx0 || b[1] > wy1 || b[3] < wy0);
  const w = zf < 3 ? 1.6 : zf < 5 ? 2.2 : zf < 6.5 ? 2.8 : 3.4;   // screen px
  x.save(); x.setTransform(dpr*sc, 0, 0, -dpr*sc, dpr*(BM.W/2 - BM.cx*sc), dpr*(BM.H/2 + BM.cy*sc)); x.lineCap = 'round'; x.lineJoin = 'round'; let n = 0;
  // heavy rail: thin grey dashes
  if (zf > 2.5){ x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = (w*0.7 + 1.6)/sc; for (const o of RL.heavy) if (inV(o.bb)){ x.stroke(bmRailPath(o, lv)); n++; }
    x.setLineDash([5/sc, 4/sc]); x.lineWidth = w*0.7/sc; for (const o of RL.heavy) if (inV(o.bb)){ x.strokeStyle = o.col; x.stroke(bmRailPath(o, lv)); } x.setLineDash([]); }
  // the network's coloured lines: a light halo under all, then the colours (zoomed out: merged per colour, one halo path)
  const vis = []; if (zf < 4.5){ for (const o of RL.groups) if (inV(o.bb)) vis.push(o); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = (w + 1.4)/sc; x.stroke(bmRailPath(RL.all, lv)); }
  else { for (const o of lines) if (inV(o.bb)) vis.push(o); x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = (w + 1.8)/sc; for (const o of vis) x.stroke(bmRailPath(o, lv)); }
  x.lineWidth = w/sc; for (const o of vis){ x.strokeStyle = o.col; x.stroke(bmRailPath(o, lv)); }
  x.restore(); RL.n = n + vis.length; RL.ms = RL.ms*0.8 + (performance.now() - t0)*0.2; BM.railMs = performance.now() - t0;
}
// ---- one frame of the map
function bmDraw(){
  const x = BM.ctx, dpr = BM.dpr, W = BM.W, H = BM.H, H2 = bmHalf(), t0 = performance.now(); BM.gen++;
  x.setTransform(dpr, 0, 0, dpr, 0, 0); x.fillStyle = '#9fbccb'; x.fillRect(0, 0, W, H);
  if (BM.legacy) bmTilesLegacy(x); else bmTilesDraw(x);
  const zf = Math.log2(BM.sc*2*H2/BM_TS);
  if (!BM.legacy) bmRail(x, zf);
  bmDrawRoute(x); bmLabels(x, zf); bmDrawMarks(x, zf);
  BM.drawMs = performance.now() - t0; BM.drawMsMax = Math.max(BM.drawMsMax*0.98, BM.drawMs); BM.frames++;
  bmStatus();
}
// One tile zoom on screen at a time: the zoom whose tiles all cover the view (zD) is shown, transformed to the current view (its
// missing tiles, e.g. after a pan, are plain ground: no line work), until every visible tile of the new target zoom is ready; then
// it swaps at once with a short crossfade. Never a magnified coarser tile next to sharp ones, so no thick / thin roads.
function bmTilesDraw(x){
  const z = bmTileZ(), now = performance.now();
  if (bmReady(z) && BM.zD !== z){ if (BM.zD !== null && Math.abs(BM.zD - z) <= 2) BM.fade = {z:BM.zD, t:now}; BM.zD = z; BM.swaps++; }
  const zD = BM.zD;
  if (zD === null || Math.abs(zD - z) > 1) bmGroundView(x); else bmLayer(x, zD, 1, true);
  if (BM.fade){ const a = 1 - (now - BM.fade.t)/BM_FADE; if (a <= 0 || Math.abs(BM.fade.z - z) > 2) BM.fade = null; else { bmLayer(x, BM.fade.z, a, false); BM.dirty = true; } }
}
function bmGroundView(x){ const wm = Math.max(bmWX(BM.W) - bmWX(0), bmWY(0) - bmWY(BM.H));
  bmGround(x, bmWX(0), bmWY(0), wm, 0, 0, wm*BM.sc); }
function bmLayer(x, z, alpha, fill){
  const H2 = bmHalf(), [tx0, tx1, ty0, ty1, TWm] = bmRange(z, 0); if ((tx1 - tx0 + 1)*(ty1 - ty0 + 1) > 600) return; x.globalAlpha = alpha;
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++){ const sx = bmSX(-H2 + tx*TWm), sy = bmSY(H2 - ty*TWm), sz = TWm*BM.sc, T = BM.tiles.get(bmTileKey(z, tx, ty));
    if (T){ T.t = BM.gen; x.drawImage(T.cv, sx, sy, sz, sz); } else if (fill) bmGround(x, -H2 + tx*TWm, H2 - ty*TWm, TWm, sx, sy, sz); }
  x.globalAlpha = 1;
}
// [test only] the v33 drawing: missing tiles filled with magnified coarser tiles (the "before" of the thick / thin rail bug)
function bmTilesLegacy(x){
  const H2 = bmHalf(), W = BM.W, H = BM.H;
  { const z = bmTileZ(), TWm = 2*H2/(1 << z), nT = 1 << z;
    const tx0 = Math.max(0, Math.floor((bmWX(0) + H2)/TWm)), tx1 = Math.min(nT - 1, Math.floor((bmWX(W) + H2)/TWm)), ty0 = Math.max(0, Math.floor((H2 - bmWY(0))/TWm)), ty1 = Math.min(nT - 1, Math.floor((H2 - bmWY(H))/TWm));
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++){ const sx = bmSX(-H2 + tx*TWm), sy = bmSY(H2 - ty*TWm), sz = TWm*BM.sc; let T = BM.tiles.get(bmTileKey(z, tx, ty));
      if (T){ T.t = BM.gen; x.drawImage(T.cv, sx, sy, sz, sz); continue; }
      let got = false; for (let zz = z - 1; zz >= 0; zz--){ const f = 1 << (z - zz), px = Math.floor(tx/f), py = Math.floor(ty/f), P = BM.tiles.get(bmTileKey(zz, px, py)); if (!P) continue; P.t = BM.gen; const ps = P.cv.width/f; x.drawImage(P.cv, (tx - px*f)*ps, (ty - py*f)*ps, ps, ps, sx, sy, sz, sz); got = true; break; }
      if (!got) bmGround(x, -H2 + tx*TWm, H2 - ty*TWm, TWm, sx, sy, sz); } }
}
function bmDrawRoute(x){
  const R = NV.R, D = NV.dest; x.lineCap = x.lineJoin = 'round';
  if (R){ const n = R.X.length, s0 = R.car ? NV.s : 0; const pass = (from, to, col, w) => { x.beginPath(); let lx = 1e9, ly = 1e9, st = false; for (let i = from; i <= to; i++){ const sx = bmSX(R.X[i]), sy = bmSY(R.Y[i]); if (st && i < to && Math.abs(sx - lx) + Math.abs(sy - ly) < 1.2) continue; if (st) x.lineTo(sx, sy); else { x.moveTo(sx, sy); st = true; } lx = sx; ly = sy; } x.strokeStyle = col; x.lineWidth = w; x.stroke(); };
    const k = R.car ? NV.k : 0;
    if (k > 0) pass(0, Math.min(n - 1, k + 1), 'rgba(90,100,110,.55)', 4);
    pass(k, n - 1, '#ffffff', 9); pass(k, n - 1, '#2f8cff', 5.2);
    // the manoeuvres ahead: small white dots
    x.fillStyle = '#fff'; x.strokeStyle = '#2f8cff'; x.lineWidth = 2; for (const m of R.man){ if (m.s < s0 || m.turn === 'arrive') continue; x.beginPath(); x.arc(bmSX(m.x), bmSY(m.y), 3.2, 0, NTAU); x.fill(); x.stroke(); }
    // walking legs: from the route ends to the clicked points (dashed)
    x.setLineDash([4, 4]); x.strokeStyle = 'rgba(47,140,255,.85)'; x.lineWidth = 2; x.beginPath(); if (D){ x.moveTo(bmSX(R.X[n - 1]), bmSY(R.Y[n - 1])); x.lineTo(bmSX(D.x), bmSY(D.y)); } x.stroke(); x.setLineDash([]); }
  else if (D){ const O = navOrigin(); x.setLineDash([6, 6]); x.strokeStyle = 'rgba(47,140,255,.8)'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(bmSX(O.x), bmSY(O.y)); x.lineTo(bmSX(D.x), bmSY(D.y)); x.stroke(); x.setLineDash([]); }
}
// labels: places by zoom, landmarks, stations, POIs; greedy placement without overlaps
const BM_PLK = {city:0, town:1, island:2, suburb:2, borough:2, quarter:3, village:3, neighbourhood:4, locality:5, hamlet:5, isolated_dwelling:7};
function bmLabels(x, zf){
  const B = SGR.base; if (!B) return; const W = BM.W, H = BM.H, boxes = [], fits = (bx, by, bw, bh) => { if (bx < 0 || by < 0 || bx + bw > W || by + bh > H) return false; for (const b of boxes) if (bx < b[0] + b[2] && bx + bw > b[0] && by < b[1] + b[3] && by + bh > b[1]) return false; boxes.push([bx, by, bw, bh]); return true; };
  const inV = (px, py) => { const sx = bmSX(px), sy = bmSY(py); return sx > -40 && sx < W + 40 && sy > -20 && sy < H + 20; };
  const font = BM.font || (BM.font = (getComputedStyle(document.body).getPropertyValue('--font-ui') || 'system-ui, sans-serif').trim());
  const tw = (t, f) => { const key = f + '|' + t; let w = BM.wTxt.get(key); if (w === undefined){ x.font = f; w = x.measureText(t).width; if (BM.wTxt.size > 4000) BM.wTxt.clear(); BM.wTxt.set(key, w); } return w; };
  const txt = (t, sx, sy, f, col, halo) => { x.font = f; x.lineWidth = 3; x.strokeStyle = halo || 'rgba(251,250,246,.92)'; x.strokeText(t, sx, sy); x.fillStyle = col; x.fillText(t, sx, sy); };
  x.textAlign = 'center'; x.textBaseline = 'middle';
  // reserve the car, the destination and the route ends
  const C = navCar(); if (C) boxes.push([bmSX(C.x) - 12, bmSY(C.y) - 12, 24, 24]); if (NV.dest) boxes.push([bmSX(NV.dest.x) - 10, bmSY(NV.dest.y) - 26, 20, 28]);
  let placed = 0; const MAXL = 170;
  // landmarks (the app's landmark models) and sites: a gold dot from zoom 2.5, the name from 4.5
  const lms = []; try { if (typeof landmarks !== 'undefined' && typeof LANDMARKS !== 'undefined') for (const L of landmarks){ const d = LANDMARKS[L.type]; if (!d || d.label === false) continue; lms.push([L.x, L.y, d.zh, d.en, (d.h || 0) + (d.r || 0)]); } } catch (e){ /* */ }
  try { if (typeof sgSites !== 'undefined') for (const s of sgSites) lms.push([s.x, s.y, s.zh, s.en, 400]); } catch (e){ /* */ }
  lms.sort((a, b) => b[4] - a[4]);
  if (zf > 1.5) for (const L of lms){ if (!inV(L[0], L[1])) continue; const sx = bmSX(L[0]), sy = bmSY(L[1]); x.fillStyle = '#d39b00'; x.strokeStyle = '#fff'; x.lineWidth = 1.5; x.beginPath(); x.arc(sx, sy, zf > 4 ? 4.2 : 3, 0, NTAU); x.fill(); x.stroke();
    if (zf > 4.3 && placed < MAXL){ const f = `600 ${zf > 6 ? 12 : 11}px ${font}`, t = nLP(L[2], L[3]), w = tw(t, f); if (fits(sx - w/2 - 2, sy - 22, w + 4, 15)){ txt(t, sx, sy - 14, f, '#7a5600'); placed++; if (zf > 6 && nLB() && L[3] && L[3] !== t){ const f2 = `400 10px ${font}`, w2 = tw(L[3], f2); if (fits(sx - w2/2, sy + 6, w2, 12)) txt(L[3], sx, sy + 12, f2, '#7a5600'); } } } }
  // places
  const pl = BM.places || (BM.places = (B.places || []).map(p => [p.x, p.y, p.zh || p.en, p.en, BM_PLK[p.k] !== undefined ? BM_PLK[p.k] : 6, p.pop || 0]).sort((a, b) => a[4] - b[4] || b[5] - a[5]));
  const maxP = zf < 1 ? 1 : zf < 2.2 ? 2 : zf < 3.4 ? 3 : zf < 4.6 ? 4 : zf < 5.6 ? 5 : 7;
  for (const p of pl){ if (p[4] > maxP || placed >= MAXL) break; if (!inV(p[0], p[1])) continue; const big = p[4] <= 1, sz = big ? 15 : p[4] <= 2 ? 13 : 11.5, f = `${big ? 700 : 600} ${sz}px ${font}`, sx = bmSX(p[0]), sy = bmSY(p[1]), pn = nLP(p[2], p[3]), w = tw(pn, f);
    if (!fits(sx - w/2 - 2, sy - sz*0.7, w + 4, sz*1.4 + (zf > 3.5 ? 11 : 0))) continue; txt(pn, sx, sy, f, big ? '#1f2a2c' : '#33413f'); placed++;
    if (zf > 3.5 && nLB() && p[3] && p[3] !== p[2]) txt(p[3], sx, sy + sz*0.95, `400 ${Math.max(9.5, sz - 3)}px ${font}`, '#4f5d5a'); }
  // stations
  if (zf > 4.6) for (const s of B.stations || []){ if (placed >= MAXL) break; if (!inV(s.x, s.y)) continue; const sx = bmSX(s.x), sy = bmSY(s.y), r = zf > 6 ? 3.6 : 2.6; x.fillStyle = '#fff'; x.strokeStyle = '#2b5fa8'; x.lineWidth = zf > 6 ? 2 : 1.6; x.beginPath(); x.arc(sx, sy, r, 0, NTAU); x.fill(); x.stroke();
    if (zf > 6.6){ const f = `600 10.5px ${font}`, t = nLP(s.zh, s.en), w = tw(t, f); if (fits(sx + 5, sy - 7, w + 4, 14)){ x.textAlign = 'left'; txt(t, sx + 7, sy, f, '#2b5fa8'); x.textAlign = 'center'; placed++; } } }
  // POIs by priority
  const icons = (() => { try { return typeof SGR_POI_ICON !== 'undefined' ? SGR_POI_ICON : {}; } catch (e){ return {}; } })();
  if (zf > 4.2) for (const p of B.pois || []){ if (placed >= MAXL) break; const need = p.pr <= 1 ? 4.2 : p.pr === 2 ? 6.2 : 7.2; if (zf < need || !inV(p.x, p.y)) continue; const sx = bmSX(p.x), sy = bmSY(p.y), ic = icons[p.k] || '•', t = nLP(p.zh, p.en), f = `500 10.5px ${font}`, w = tw(t, f) + 16;
    if (!fits(sx - w/2, sy - 7, w, 14)) continue; x.font = `11px ${font}`; x.fillStyle = '#333'; x.textAlign = 'left'; x.fillText(ic, sx - w/2, sy); txt(t, sx - w/2 + 15, sy, f, '#5b4636'); x.textAlign = 'center'; placed++; }
  BM.nLab = placed;
}
function bmDrawMarks(x, zf){
  const t = performance.now()/1000, mk = navMarkers(), dpr = 1;
  for (const m of mk){ const sx = bmSX(m.x), sy = bmSY(m.y); if (sx < -30 || sx > BM.W + 30 || sy < -30 || sy > BM.H + 30) continue;
    if (m.r && m.r*BM.sc > 6){ x.globalAlpha = 0.18; x.fillStyle = m.color || '#ffcf4a'; x.beginPath(); x.arc(sx, sy, m.r*BM.sc, 0, NTAU); x.fill(); x.globalAlpha = 1; }
    x.save(); x.translate(sx, sy); navIcon(x, m, 1.25, t); x.restore();
    if (m.label && zf > 3){ x.font = `600 11px ${BM.font || 'sans-serif'}`; x.textAlign = 'left'; x.lineWidth = 3; x.strokeStyle = 'rgba(251,250,246,.92)'; const ml = nLT(m.label); x.strokeText(ml, sx + 11, sy); x.fillStyle = '#222'; x.fillText(ml, sx + 11, sy); x.textAlign = 'center'; } }
  // the selected point (not driving)
  if (BM.sel){ x.save(); x.translate(bmSX(BM.sel.x), bmSY(BM.sel.y)); navPin(x, '#4d5a62', 1.2); x.restore(); }
  if (NV.dest){ x.save(); x.translate(bmSX(NV.dest.x), bmSY(NV.dest.y)); navPin(x, NV.dest.color, 1.35); x.restore(); }
  // the car (driving) or the view (camera target and the looking direction)
  const C = navCar();
  if (C){ const sx = bmSX(C.x), sy = bmSY(C.y), a = -C.psi + NPI/2; x.save(); x.translate(sx, sy); x.rotate(a); x.fillStyle = 'rgba(47,140,255,.18)'; x.beginPath(); x.arc(0, 0, 18, 0, NTAU); x.fill();
    x.fillStyle = '#ff3b30'; x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, -11); x.lineTo(7.5, 8); x.lineTo(0, 4); x.lineTo(-7.5, 8); x.closePath(); x.fill(); x.stroke(); x.restore(); }
  else { const T = controls.target, sx = bmSX(T.x), sy = bmSY(-T.z), dx = T.x - camera.position.x, dz = T.z - camera.position.z, a = Math.atan2(dx, -dz);
    x.save(); x.translate(sx, sy); x.rotate(a); const g = x.createRadialGradient(0, 0, 2, 0, 0, 46); g.addColorStop(0, 'rgba(47,140,255,.45)'); g.addColorStop(1, 'rgba(47,140,255,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 46, -NPI/2 - 0.55, -NPI/2 + 0.55); x.closePath(); x.fill();
    x.fillStyle = '#2f8cff'; x.strokeStyle = '#fff'; x.lineWidth = 2.5; x.beginPath(); x.arc(0, 0, 6.5, 0, NTAU); x.fill(); x.stroke(); x.restore(); }
}
function bmStatus(){
  const z = Math.log2(BM.sc*2*bmHalf()/BM_TS), st = !BM.LI ? `道路图层 ${BM.liGen ? '…' : ''}` : '', g = !NV.G ? (NV.want ? ` · 路网 Roads ${Math.round(NV.prog*100)}%` : '') : '';
  const s = `${st}缩放 z ${z.toFixed(1)}${g}`; if (BM.lastStat !== s){ BM.lastStat = s; BM.stat.textContent = s; }
  // scale bar: a round length near 90 px
  const mpp = 1/BM.sc, target = 90*mpp, us = navUS(); let len, lab;
  if (us){ const ft = target*3.28084; if (ft < 1000){ const v = [50, 100, 200, 500, 1000].find(v => v >= ft*0.6) || 1000; len = v/3.28084; lab = v + ' ft'; } else { const mi = target/1609.34, v = [0.25, 0.5, 1, 2, 5, 10, 20].find(v => v >= mi*0.6) || 20; len = v*1609.34; lab = v + ' mi'; } }
  else { const v = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].find(v => v >= target*0.6) || 20000; len = v; lab = v >= 1000 ? v/1000 + ' km' : v + ' m'; }
  const px = Math.round(len*BM.sc); if (BM.lastScale !== lab + px){ BM.lastScale = lab + px; BM.scale.firstChild.textContent = lab; BM.scale.querySelector('i').style.width = px + 'px'; }
}
// ---- clicks and the card at the bottom
function bmClick(sx, sy){
  const x = bmWX(sx), y = bmWY(sy), H2 = bmHalf(); if (Math.abs(x) > H2 || Math.abs(y) > H2) return;
  // a marker or a labelled thing under the pointer wins over the raw point
  let hit = null, bd = 16; for (const m of navMarkers()){ const d = Math.hypot(bmSX(m.x) - sx, bmSY(m.y) - sy); if (d < bd){ bd = d; hit = {x:m.x, y:m.y, label:m.label ? [m.label, m.label] : null}; } }
  const px = hit ? hit.x : x, py = hit ? hit.y : y, lab = (hit && hit.label) || navNameAt(px, py);
  if (navDrv()){ navSetDest(px, py, {label:lab}); BM.sel = null; }
  else { BM.sel = {x:px, y:py, label:lab}; }
  BM.dirty = true; bmCard();
}
function bmCard(){
  const c = BM.card; if (!c) return; const D = NV.dest, S = BM.sel, drv = !!navDrv();
  let html = '';
  if (S && !drv){ const fav = navIsFav(S.x, S.y);
    html = `<div class="bi">📍</div><div class="bt"><b>${nEsc(nLB() ? S.label[0] : nLP(S.label[0], S.label[1]))}</b><small>${nLB() ? nEsc(S.label[1]) + ' · ' : ''}${navDist(Math.hypot(S.x - navOrigin().x, S.y - navOrigin().y))}</small></div>
<div class="bb"><button class="bmbtn star${fav ? ' on' : ''}" data-a="favsel" type="button" title="收藏 Favourite">${fav ? '★' : '☆'}</button><button class="bmbtn" data-a="dest" type="button">设为目的地 Set destination</button><button class="bmbtn go" data-a="fly" type="button">飞到这里 Fly here</button></div>`; }
  else if (D){ const R = NV.R, info = R ? `${navDist(R.car ? R.L - NV.s : R.L)} · ${navTime(navEta(R, R.car ? NV.s : 0))}` : !NV.G ? `路网准备中 Preparing roads ${Math.round(NV.prog*100)}%` : NV.fail ? '找不到路线 · No route (直线 straight line)' : '规划路线… · Routing…', fav = navIsFav(D.x, D.y);
    html = `<div class="bi">🏁</div><div class="bt"><b>→ ${nEsc(nLB() ? D.label[0] : nLP(D.label[0], D.label[1]))}</b><small>${nLB() ? nEsc(D.label[1]) + ' · ' + info : nLT(info)}</small></div>
<div class="bb"><button class="bmbtn star${fav ? ' on' : ''}" data-a="fav" type="button" title="收藏 Favourite">${fav ? '★' : '☆'}</button><button class="bmbtn" data-a="clear" type="button">清除 Clear</button>${drv ? '<button class="bmbtn go" data-a="go" type="button">出发 Go ▸</button>' : '<button class="bmbtn go" data-a="flyd" type="button">飞到这里 Fly here</button>'}</div>`; }
  if (BM.lastCard !== html){ BM.lastCard = html; c.innerHTML = html; } c.hidden = !html;
}
function bmCardAct(a){
  const S = BM.sel, D = NV.dest;
  if (a === 'fly' && S){ navFly(S.x, S.y); BM.sel = null; navClose(); }
  else if (a === 'flyd' && D){ navFly(D.x, D.y); navClose(); }
  else if (a === 'dest' && S){ navSetDest(S.x, S.y, {label:S.label}); BM.sel = null; }
  else if (a === 'clear'){ navClearDest(); }
  else if (a === 'go'){ navClose(); }
  else if (a === 'fav' && D){ navFavToggle({x:D.x, y:D.y, label:D.label}); }
  else if (a === 'favsel' && S){ navFavToggle({x:S.x, y:S.y, label:S.label}); }
  BM.dirty = true; BM.lastCard = null; bmCard();
}
function navFly(x, y){ const g = Math.max(0, navGnd(x, y)); try { flyTo(new THREE.Vector3(x + 520, g + 620, -y + 760), new THREE.Vector3(x, g, -y), 1400); } catch (e){ camera.position.set(x + 520, g + 620, -y + 760); controls.target.set(x, g, -y); } }
// the frame: tiles in the remaining budget, redraw when something changed or ~12 times a second while something moves
function bmTick(t){
  if (!BM.open || BM.hold) return; if (BM.W !== (BM.el.clientWidth || innerWidth) || BM.H !== (BM.el.clientHeight || innerHeight)) bmResize();
  const C = navCar(); if (C && BM.follow){ if (Math.abs(C.x - BM.cx) + Math.abs(C.y - BM.cy) > 0.5/BM.sc){ BM.cx = C.x; BM.cy = C.y; BM.dirty = true; } }
  bmTilesTick(performance.now() - BM.opened < 800 ? 28 : 16);
  const now = performance.now(), live = C || NV.prov.size > 3 || navMarkers().some(m => m.pulse) || NV.job || BM.fade;
  if (BM.dirty || (live && now - BM.lastDraw > 80)){ BM.dirty = false; BM.lastDraw = now; bmDraw(); bmCard(); }
}

// ================================================================ search (landmarks, sites, places, POIs, stations, roads), favourites, recent
const SX = {idx:null, n:0};
const SX_KIND = {landmark:['★', '地标 Landmark', 0], site:['🎓', '园区 Site', 0], place:['◎', '地区 Area', 2], poi:['📍', '地点 Place', 1], station:['🚇', '车站 Station', 1], road:['🛣', '道路 Road', 3], fav:['★', '收藏 Favourite', 0], recent:['🕘', '最近 Recent', 0]};
function navIndex(){
  if (SX.idx) return SX.idx; const L = [], B = SGR.base || {}, seen = new Set();
  const add = (kind, zh, en, x, y, pr, icon, extra) => { zh = zh || en || ''; en = en || zh || ''; if (!zh || !isFinite(x) || !isFinite(y)) return; const key = kind + '|' + en.toLowerCase() + '|' + Math.round(x/300) + ',' + Math.round(y/300); if (seen.has(key)) return; seen.add(key);
    L.push({kind, zh, en, x, y, pr:pr || 0, icon, s:(zh + ' ' + en + ' ' + (extra || '')).toLowerCase(), zl:zh.toLowerCase(), el:en.toLowerCase()}); };
  try { if (typeof landmarks !== 'undefined' && typeof LANDMARKS !== 'undefined') for (const q of landmarks){ const d = LANDMARKS[q.type]; if (d && d.label !== false) add('landmark', d.zh, d.en, q.x, q.y, 0, '★'); } } catch (e){ /* */ }
  try { if (typeof sgSites !== 'undefined') for (const s of sgSites) add('site', s.zh, s.en, s.x, s.y, 0, '🎓'); } catch (e){ /* */ }
  const icons = (() => { try { return typeof SGR_POI_ICON !== 'undefined' ? SGR_POI_ICON : {}; } catch (e){ return {}; } })();
  for (const p of B.pois || []) add('poi', p.zh, p.en, p.x, p.y, p.pr || 3, icons[p.k] || '📍', p.k);
  for (const s of B.stations || []) add('station', s.zh, s.en, s.x, s.y, 1, '🚇', (s.codes || []).join(' ') + ' station 站');
  for (const p of B.places || []) add('place', p.zh, p.en, p.x, p.y, BM_PLK[p.k] !== undefined ? BM_PLK[p.k] : 6, '◎');
  for (const r of SGR.roadLabels || []) add('road', r.zh || r.en, r.en || r.zh, r.x, r.y, r.cls || 8, '🛣', r.ref || '');
  SX.idx = L; SX.n = L.length; return L;
}
function navSearch(q, lim){
  q = String(q || '').trim().toLowerCase(); if (!q) return []; const L = navIndex(), O = navOrigin(), out = [], words = q.split(/\s+/);
  for (const it of L){ const i = it.s.indexOf(q); let sc;
    if (i >= 0) sc = (i === 0 || it.el.startsWith(q) || it.zl.startsWith(q)) ? 0 : /[\s(·-]/.test(it.s[i - 1]) ? 1 : 2;
    else if (words.length > 1 && words.every(w => it.s.includes(w))) sc = 2.5; else continue;
    if (it.el === q || it.zl === q) sc -= 1.2;   // the exact name first
    const kp = it.kind === 'place' ? Math.min(2, it.pr)*0.3 : SX_KIND[it.kind][2]*0.35;
    const d = Math.hypot(it.x - O.x, it.y - O.y); out.push([sc + kp + Math.min(4, it.pr)*0.12 + Math.min(1.5, d/20000), it, d]); }
  out.sort((a, b) => a[0] - b[0]);
  // one road per name: the piece nearest to the origin
  const res = [], rseen = new Set(); for (const o of out){ const it = o[1]; if (it.kind === 'road'){ if (rseen.has(it.en)) continue; rseen.add(it.en); let best = it, bd = o[2]; for (const p of out) if (p[1].kind === 'road' && p[1].en === it.en && p[2] < bd){ bd = p[2]; best = p[1]; } res.push([best, bd]); } else res.push([it, o[2]]); if (res.length >= (lim || 10)) break; }
  return res.map(r => Object.assign({}, r[0], {d:Math.round(r[1])}));
}
// favourites and recent destinations per map (localStorage, guarded)
const NAV_KEY = () => 'cityBrush.nav.' + navCity();
function navStore(){ try { const s = JSON.parse(localStorage.getItem(NAV_KEY()) || 'null'); if (s && Array.isArray(s.fav) && Array.isArray(s.recent)) return s; } catch (e){ /* storage blocked */ } return {fav:[], recent:[]}; }
function navSave(s){ try { localStorage.setItem(NAV_KEY(), JSON.stringify(s)); } catch (e){ /* storage blocked */ } }
function navIsFav(x, y){ return navStore().fav.some(f => Math.hypot(f.x - x, f.y - y) < 40); }
function navFavToggle(p){ const s = navStore(), i = s.fav.findIndex(f => Math.hypot(f.x - p.x, f.y - p.y) < 40); if (i >= 0) s.fav.splice(i, 1); else s.fav.unshift({x:Math.round(p.x), y:Math.round(p.y), zh:p.label[0], en:p.label[1]}); s.fav = s.fav.slice(0, 20); navSave(s); return i < 0; }
function navRecent(D){ if (!D) return; const s = navStore(); s.recent = [{x:Math.round(D.x), y:Math.round(D.y), zh:D.label[0], en:D.label[1]}].concat(s.recent.filter(r => Math.hypot(r.x - D.x, r.y - D.y) > 40)).slice(0, 8); navSave(s); }
function bmResults(){
  if (!BM.res) return; const q = BM.q.value.trim(), O = navOrigin(); let html = '', items = [];
  const row = (it, i) => `<button type="button" data-i="${i}"><i>${nEsc(it.icon || SX_KIND[it.kind][0])}</i><span><b>${nEsc(nLB() ? it.zh : nLP(it.zh, it.en))}</b><small>${nLB() ? nEsc(it.en !== it.zh ? it.en + ' · ' : '') + SX_KIND[it.kind][1] : nLT(SX_KIND[it.kind][1])}</small></span><em>${navDist(Math.hypot(it.x - O.x, it.y - O.y))}</em></button>`;
  if (!q){ const s = navStore();
    if (s.fav.length){ html += '<h4>收藏 FAVOURITES</h4>'; for (const f of s.fav){ items.push({kind:'fav', zh:f.zh, en:f.en, x:f.x, y:f.y, icon:'★'}); html += row(items[items.length - 1], items.length - 1); } }
    if (s.recent.length){ html += '<h4>最近 RECENT</h4>'; for (const f of s.recent){ items.push({kind:'recent', zh:f.zh, en:f.en, x:f.x, y:f.y, icon:'🕘'}); html += row(items[items.length - 1], items.length - 1); } }
    if (!items.length) html = '<p>输入名称搜索地标、地点、车站或道路，或在地图上点击选点。<br>Type a landmark, place, station or road — or tap the map.</p>'; }
  else { items = navSearch(q, 12); html = items.length ? items.map(row).join('') : `<p>没有找到 “${nEsc(q)}” · Nothing found</p>`; }
  BM.resItems = items; BM.res.innerHTML = html; BM.res.hidden = false;
  const first = BM.res.querySelector('button[data-i]'); if (first && q) first.classList.add('on');
}
function bmPick(it){
  BM.res.hidden = true; try { BM.q.blur(); } catch (e){ /* */ }
  const lab = [it.zh, it.en];
  if (navDrv()){ navSetDest(it.x, it.y, {label:lab}); BM.sel = null; }
  else BM.sel = {x:it.x, y:it.y, label:lab};
  BM.cx = it.x; BM.cy = it.y; BM.follow = false; if (BM.sc < 0.12) BM.sc = 0.2; BM.dirty = true; BM.lastCard = null; bmCard();
}

// ================================================================ keys, the frame, the main-view map button, window.SGNav
// while driving the drive module takes the keys first (capture phase) and asks its key hook (SGF1.mp.key, used by the multiplayer
// module for chat): the hook is wrapped here (module code runs before the boot hooks that register it), nav keys first
function navKey(c, e){
  if (e && (e.ctrlKey || e.metaKey || e.altKey)) return false;
  if (BM.open){
    if (c === 'Escape' || c === 'KeyM'){ if (!e || !e.repeat) navClose(); return true; }
    if (c === 'KeyN' || c === 'Slash'){ BM.q.focus(); BM.q.select(); bmResults(); return true; }
    if (c === 'Equal' || c === 'NumpadAdd'){ bmZoom(1.6, BM.W/2, BM.H/2); return true; }
    if (c === 'Minus' || c === 'NumpadSubtract'){ bmZoom(1/1.6, BM.W/2, BM.H/2); return true; }
    if (!navDrv() && /^(Arrow(Up|Down|Left|Right)|Key[WASD])$/.test(c)){ const k = 90/BM.sc, d = {ArrowUp:[0, 1], KeyW:[0, 1], ArrowDown:[0, -1], KeyS:[0, -1], ArrowLeft:[-1, 0], KeyA:[-1, 0], ArrowRight:[1, 0], KeyD:[1, 0]}[c]; BM.cx += d[0]*k; BM.cy += d[1]*k; BM.follow = false; BM.dirty = true; return true; }
    return false;
  }
  if (c === 'KeyM' && !(e && e.shiftKey)){ if (!e || !e.repeat) navOpen({}); return true; }
  if (c === 'KeyN'){ if (!e || !e.repeat) navOpen({search:true}); return true; }
  return false;
}
try { const S = window.SGF1;
  if (S && S.mp && typeof S.mp.key === 'function' && !S.mp.key.navWrapped){ const orig = S.mp.key.bind(S.mp); let inner = null;
    const wrap = fn => { inner = typeof fn === 'function' ? fn : null; orig((c, e) => { if (navKey(c, e)) return true; return inner ? inner(c, e) : false; }); };
    wrap.navWrapped = true; S.mp.key = wrap; wrap(null); } } catch (e){ console.error('nav key hook', e); }
// not driving: M = the big map (Shift+M stays tilt-shift), N = search; with the map open its keys, and the view keys are held back
addEventListener('keydown', e => {
  if (navDrv()) return; const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  if (window.SGFly && window.SGFly.on) return; if (!navReady()) return;
  if (navKey(e.code, e)){ e.preventDefault(); e.stopImmediatePropagation(); return; }
  if (BM.open && !e.ctrlKey && !e.metaKey){ e.stopImmediatePropagation(); }   // the map is modal: no camera moves behind it
}, true);
// a 地图 Map button in the time bar (main view) next to the weather
function navMainBtn(){
  if (document.getElementById('navMainB')) return; const bar = document.getElementById('timebar'); if (!bar) return;
  const st = document.createElement('style'); st.textContent = `.navmainb{appearance:none;display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 10px 0 8px;border:1px solid var(--rule);border-radius:8px;background:var(--panel);color:var(--ink);cursor:pointer;font:inherit;flex:none}
.navmainb svg{width:18px;height:18px;flex:none}.navmainb span{display:flex;flex-direction:column;line-height:1.1;text-align:left}.navmainb b{font-size:12.5px;font-weight:600}.navmainb small{font:400 9.5px var(--font-mono);color:var(--muted)}
.navmainb:hover{background:var(--panel-2)}.navmainb.on{box-shadow:inset 0 0 0 1.5px #2f8cff}
@media (max-width:760px){ .navmainb small{display:none} .navmainb{height:32px;padding:0 8px} }`; document.head.appendChild(st);
  const b = document.createElement('button'); b.type = 'button'; b.className = 'navmainb'; b.id = 'navMainB'; b.title = '大地图 · Big map (M) · 搜索 Search (N)';
  b.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2.5 4.5l4.5-2 6 2 4.5-2v13l-4.5 2-6-2-4.5 2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7 2.5v13M13 4.5v13" stroke="currentColor" stroke-width="1.3"/></svg><span><b>地图</b><small>Map · M</small></span>';
  b.addEventListener('click', () => navToggle()); const wx = document.getElementById('wxWrap'); if (wx && wx.parentNode === bar) wx.after(b); else bar.appendChild(b);
}
// the frame hook: graph slices, route search slices, progress, HUD, minimap, ribbon, map
HOOKS.boot.push(() => { try { navMainBtn(); } catch (e){ console.error('nav ui', e); } });
HOOKS.time.push((tod, nf) => navNight(nf));
HOOKS.frame.push((t, dt) => {
  if (!SGR.on){ if (BM.open) navClose(); return; }
  const a = performance.now();
  if (!document.getElementById('navMainB')) { if ((NV.nFrame & 63) === 0) navMainBtn(); }
  NV.nFrame++;
  const drv = navDrv(); if (drv){ navWant(); if (!HN.el) navHudBuild(); }
  // a route planned from the view becomes a route from the car when driving starts
  if (drv && NV.dest && NV.R && !NV.R.car && !NV.job && !NV.need) navReq(true);
  navBuildTick(); bmIndexTick(); navRouteTick();
  if (drv && NV.R) navProgress(dt);
  if (HN.el){ navCardTick(false); navMiniDraw(); }
  navRibbonTick(t); if (RB.bmat && RB.beacon && RB.beacon.visible) RB.bmat.uniforms.uT.value = t % 1000;
  bmTick(t);
  const ms = performance.now() - a; NV.ms = NV.ms*0.95 + ms*0.05; if (NV.nFrame > 30) NV.msMax = Math.max(NV.msMax*0.995, ms);
  const mb = document.getElementById('navMainB'); if (mb){ const on = !!NV.dest; if (mb._on !== on){ mb._on = on; mb.classList.toggle('on', on); } }
});
window.SGNav = {
  open:o => navOpen(o), close:() => navClose(), toggle:o => navToggle(o), get isOpen(){ return BM.open; },
  setDest:(x, y, o) => navSetDest(x, y, o), clearDest:() => navClearDest(),
  route:() => navRouteInfo(),
  markers(id, fn){ id = String(id); if (fn === null || fn === undefined){ NV.prov.delete(id); } else if (typeof fn === 'function') NV.prov.set(id, fn); NV.mkT = 0; BM.dirty = true; return NV.prov.size; },
  get on(){ return !!NV.dest; },
  search:(q, n) => navSearch(q, n),
  graph(){ return NV.G ? Object.assign({buildMs:Math.round(NV.buildMs), cpuMs:Math.round(NV.cpuMs), frames:NV.frames, sliceMax:+NV.sliceMax.toFixed(1), MB:+(NAVG.bytes(NV.G)/1048576).toFixed(1)}, NV.G.stats) : {building:!!NV.gen, prog:+NV.prog.toFixed(3), frames:NV.frames, cpuMs:Math.round(NV.cpuMs), sliceMax:+NV.sliceMax.toFixed(1), err:NV.err}; },
  state(){ const R = NV.R, C = navCar(), r = R ? navRouteInfo() : null;
    return {dest:NV.dest ? {x:Math.round(NV.dest.x), y:Math.round(NV.dest.y), label:NV.dest.label, kind:NV.dest.kind} : null, routing:!!NV.job || NV.need, fail:NV.fail, graph:!!NV.G, prog:+NV.prog.toFixed(3),
      route:R ? {len:Math.round(R.L), min:+(R.T[R.T.length - 1]/60).toFixed(1), man:R.man.length, car:R.car, s:Math.round(NV.s), k:NV.k, off:+NV.off.toFixed(1), rest:Math.round(r.len), eta:Math.round(r.eta), next:r.next ? {turn:r.next.turn, dist:Math.round(r.next.dist), name:r.next.name} : null, ms:Math.round(NV.routeMs), pops:NV.pops} : null,
      reqs:NV.reqs, reroutes:NV.reroutes, car:C ? {x:Math.round(C.x), y:Math.round(C.y)} : null, map:{open:BM.open, tiles:BM.tiles.size, made:BM.tilesMade, tileMs:+BM.tileMs.toFixed(2), drawMs:+BM.drawMs.toFixed(2), drawMsMax:+BM.drawMsMax.toFixed(2), labels:BM.nLab || 0, index:!!BM.LI, sc:+BM.sc.toFixed(4), zD:BM.zD, railMs:+RL.ms.toFixed(2), tileAvgMs:+(BM.tileSum/Math.max(1, BM.tileN)).toFixed(2)},
      frameMs:+NV.ms.toFixed(3), frameMsMax:+NV.msMax.toFixed(3), providers:[...NV.prov.keys()], markers:navMarkers().length}; },
  _test:{NV, BM, RB, HN, NAVG, index:() => navIndex().length, view(x, y, sc){ if (x !== undefined){ BM.cx = x; BM.cy = y; } if (sc) BM.sc = sc; BM.follow = false; BM.dirty = true; return {cx:BM.cx, cy:BM.cy, sc:BM.sc}; },
    click:(sx, sy) => bmClick(sx, sy), pick:i => { const it = BM.resItems && BM.resItems[i]; if (it) bmPick(it); return !!it; }, card:a => bmCardAct(a), q(v){ BM.q.value = v; bmResults(); return (BM.resItems || []).map(r => r.zh + ' / ' + r.en + ' ' + r.kind); },
    // run the graph build / a pending route to the end now (tests)
    finish(ms){ const t0 = performance.now(); ms = ms || 60000; while (!NV.G && NV.want && !NV.err && performance.now() - t0 < ms){ NV.Y.t = Date.now() + 50; const r = NV.gen ? NV.gen.next() : (navBuildTick(), {done:false}); if (r && r.done){ NV.G = r.value; NV.gen = null; NV.buildMs = performance.now() - NV.t0; } }
      while ((NV.need || NV.job) && performance.now() - t0 < ms){ NV.lastReq = -1e9; navRouteTick(); } return {ms:Math.round(performance.now() - t0), graph:!!NV.G, route:!!NV.R}; },
    progress:dt => navProgress(dt || 1/60), arrow:(turn, ang) => navArrowDraw(turn, ang, false), tiles:(ms) => { const t0 = performance.now(); while (performance.now() - t0 < (ms || 2000)){ const n = BM.tilesMade; bmTilesTick(50); if (BM.tilesMade === n) break; } bmDraw(); return BM.tiles.size; },
    // per-piece cost (ms per call over n calls): progress, the turn card, the minimap overlay, the ribbon update, the markers, a map frame
    prof(n){ n = n || 60; const T = {}, run = (k, f) => { const a = performance.now(); for (let i = 0; i < n; i++) f(); T[k] = +((performance.now() - a)/n).toFixed(3); };
      run('progress', () => navProgress(1/60)); run('card', () => navCardTick(false)); run('minimap', () => { HN.frame = 0; navMiniDraw(); }); run('ribbon', () => navRibbonTick(1)); run('markers', () => { NV.mkT = 0; navMarkers(); });
      if (BM.open) run('mapDraw', () => bmDraw()); T.hook = +NV.ms.toFixed(3); return T; },
    // the map's tiles / overlay: legacy(true) = the v33 drawing (for before / after shots), tick(budget) one frame of tile work, draw()
    hold(v){ BM.hold = !!v; return BM.hold; },   // [test] freeze the map's own frame work (tiles, redraws) for still shots
    legacy(v){ BM.legacy = !!v; BM.zD = null; BM.fade = null; BM.dirty = true; return BM.legacy; }, tick:b => bmTilesTick(b === undefined ? 16 : b),
    draw(){ bmDraw(); return {drawMs:+BM.drawMs.toFixed(2), railMs:+BM.railMs.toFixed(2), rail:RL.n, zD:BM.zD, z:bmTileZ(), ready:bmReady(bmTileZ()), tiles:BM.tiles.size, fade:!!BM.fade}; },
    tileStats(){ return {n:BM.tileN, avgMs:+(BM.tileSum/Math.max(1, BM.tileN)).toFixed(2), maxMs:+BM.tileMs.toFixed(2), cache:BM.tiles.size, cap:bmTileMax(), swaps:BM.swaps}; },
    index2(ms){ const t0 = performance.now(); BM.liWant = true; while (!BM.LI && performance.now() - t0 < (ms || 20000)) bmIndexTick(); return !!BM.LI; }}
};
}
