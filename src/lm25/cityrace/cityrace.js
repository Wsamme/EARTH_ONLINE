// ===== City Brush v28 · lm25/cityrace — 城市竞速 City race (Singapore, SF Bay Area, New York; one module, decided at run time) =====
// Checkpoint races through the real streets of the map, solo or (through window.SGRace) with other players.
// - Route generator (pure, deterministic; the GEN section also runs in node: lm25/cityrace/test/gentest.js): a road graph from
//   SGR.lines (classes 0-10, one-way lines one way only, junctions at shared vertices at the same level, at line ends with a level
//   step, and geometric T / X junctions for the simplified US lines; tunnel mouths are dead ends; the largest strongly connected
//   part), an edge-based Dijkstra with turn penalties and no U-turns. Random routes from a seed: a start on a straight major road
//   near one of the city's hubs, a finish ~km away (or a loop back to the start), preferring major roads and flyovers / bridges.
//   Curated routes per city through via points (CURATED). Checkpoints past every turn (the junction exit) and every 300-600 m,
//   the finish at the end; gate width = the road width + 4 m. Same seed + same map data -> the same route on every client (only
//   + - * / sqrt in the decisions, ties broken by id; SGRace.hash(route) to compare).
// - The race: free drive (Singapore: the F1 car) or the road car (US maps: the car chosen in the tray) placed on the start line via
//   SGF1.tp, held during the countdown (five start lights; `at` = the GO moment in performance.now() time for synchronised starts),
//   checkpoints crossed forward within the gate width (missed gates are reported; R / the reset button = back to the last checkpoint
//   passed), split times against the best run, wrong-way warning, finish screen; best times, splits and the ghost of the best run
//   per route in localStorage (try/catch). Traffic stays on (it is a street race) unless switched off.
// - 3D: glowing arches over the road at the next two checkpoints (the next one pulsing, the finish chequered, numbered labels), a
//   floating arrow towards the route ahead, chevrons on the road, AI racers (solo; path followers with a grip / braking profile that
//   slow for the player, each other and the traffic: Singapore simple open-wheel racers, US maps the traffic module's car models),
//   the ghost (translucent). HUD inside the drive module's HUD: race panel (position, CP n/N, time, split vs best, distance and
//   direction to the next gate, ranking), the route ribbon over its minimap, lights, messages, results.
// - UI: a 城市竞速 City race section at the end of the drive tray pane (curated routes, a random route from a seed / length / loop,
//   traffic, AI rivals, ghost).
// API (window.SGRace): generate(seed, {km, loop}) -> route {id, seed, city, start:{x, y, z, hdg}, cps:[{x, y, z, w, hdg, s, kind}],
//   lengthM, path:{x, y, e, c, ow}, name:[zh, en], sub, roads, loop}; start(route | seed, {at, solo, traffic, ai, ghost, car}); stop();
//   progress() -> {cp, ncp, dist, t, finished, wrong, state, s, x, y, z, psi}; onFinish(cb) -> unsubscribe; setOpponents([{id, name,
//   cp, dist, t, finished, x?, y?, color?}]); routes(city) -> [{id, seed, city, name, sub, loop, lengthM, best}]; respawn(); best(id);
//   hash(route) / canon(route); state, route, result; _test {graph, go, drive (autopilot), ap, jump, tick, ...}.
{
//<GEN>
// ---- the route generator: pure functions of SGR.lines (no DOM, no three.js); the node tests run this part on the staged data ----
// Graph: every line of class 0-10 (expressway ... residential; no service roads, paths, foreign context) is split at its junction
// vertices (a vertex shared by two lines at the same level: E within 2.5 m; line ends always) into pieces; a piece is a directed edge
// each way (one-way lines: the drawing direction only). The largest strongly connected part is kept (tunnel portals, which are not
// mapped, and dead ends drop out of through routes because the search never turns back: no U-turns, no turns sharper than ~123 deg,
// no hidden U-turn through a short median gap). Search: edge-based Dijkstra (the state is the directed edge just driven), cost =
// metres x class factor + a turn penalty; ties broken by edge id; only + - * / and sqrt (bit-identical in every engine), so the same
// seed on the same map data gives the same route on every client.
const CRG = (() => {
  const WID = [[26, 13], [6.5, 6.5], [20, 11], [6.5, 6.5], [15, 10], [6, 6], [12, 8], [5.5, 5.5], [9.5, 7], [5, 5], [7, 5.5]];
  const CF = [1.0, 1.12, 1.0, 1.12, 1.06, 1.2, 1.15, 1.25, 1.3, 1.45, 2.4];
  const MAXC = 10;
  const rngOf = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; };
  const hash = s => { s = String(s); let h = 0x811c9dc5; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; };
  const sq = Math.sqrt, r2 = v => Math.round(v*100)/100;
  // ---- graph ----
  // Junctions: (1) a vertex shared by two lines (same 0.25 m cell) at the same level (E within 2.5 m); where a line END meets
  // another line at a different level (a level step in the data, e.g. a bridge approach given the deck profile next to a street
  // end) it is joined too (up to 20 m); (2) simplified data (long straight lines without vertices at their junctions, e.g. the
  // Manhattan avenues): a vertex of one line within 0.75 m of the interior of another line's segment at the same level, and two
  // segments crossing at ground level (classes 2-10, no bridges: expressways never cross at grade). Tunnel mouths (flags 64 / 128)
  // stay dead ends. Each piece between junctions
  // keeps its own polyline (VX / VY / VE from pOff, pN).
  function build(lines, opts){
    const t0 = Date.now(), n = lines.length, kq = (x, y) => (Math.round(x*4) + 200000)*400000 + (Math.round(y*4) + 200000);
    const ok = new Uint8Array(n); for (let li = 0; li < n; li++){ const l = lines[li]; if (l.c <= MAXC && !(l.flags & 8) && l.P.length >= 4) ok[li] = 1; }
    const cnt = new Map();
    for (let li = 0; li < n; li++){ if (!ok[li]) continue; const P = lines[li].P, m = P.length >> 1;
      for (let k = 0; k < m; k++){ const key = kq(P[2*k], P[2*k + 1]); cnt.set(key, (cnt.get(key) || 0) + (k === 0 || k === m - 1 ? 2 : 1)); } }
    // segment grid (64 m cells, exact cell traversal)
    const CS = 64, cells = new Map(), SL = [], SK = [];
    const cellKey = (cx, cy) => (cx + 4000)*8000 + (cy + 4000);
    const addCell = (cx, cy, id) => { const key = cellKey(cx, cy); let L = cells.get(key); if (!L) cells.set(key, L = []); if (L[L.length - 1] !== id) L.push(id); };
    for (let li = 0; li < n; li++){ if (!ok[li]) continue; const P = lines[li].P, m = P.length >> 1;
      for (let k = 0; k < m - 1; k++){ const id = SL.length; SL.push(li); SK.push(k); const ax = P[2*k], ay = P[2*k + 1], bx = P[2*k + 2], by = P[2*k + 3], dx = bx - ax, dy = by - ay;
        let cx = Math.floor(ax/CS), cy = Math.floor(ay/CS); const ex = Math.floor(bx/CS), ey = Math.floor(by/CS), sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1;
        let tx = dx !== 0 ? (sx > 0 ? (cx + 1)*CS - ax : ax - cx*CS)/Math.abs(dx) : Infinity, ty = dy !== 0 ? (sy > 0 ? (cy + 1)*CS - ay : ay - cy*CS)/Math.abs(dy) : Infinity;
        const ddx = dx !== 0 ? CS/Math.abs(dx) : Infinity, ddy = dy !== 0 ? CS/Math.abs(dy) : Infinity;
        addCell(cx, cy, id); let g = 0; while ((cx !== ex || cy !== ey) && g++ < 4000){ if (tx < ty){ tx += ddx; cx += sx; } else { ty += ddy; cy += sy; } addCell(cx, cy, id); } } }
    // cut points per line: [f (vertex index, fractional for a point inside a segment), x, y, e]
    const cuts = new Map(), addCut = (li, f, x, y, e) => { let L = cuts.get(li); if (!L) cuts.set(li, L = []); L.push([f, x, y, e]); };
    const Ez = (l, k, t) => l.E ? l.E[k] + (l.E[k + 1] - l.E[k])*t : 0;
    // (2a) a vertex on another line's segment
    const portal = (l, k, m) => (k === 0 && (l.flags & 64)) || (k === m - 1 && (l.flags & 128));
    for (let li = 0; li < n; li++){ if (!ok[li]) continue; const l = lines[li], P = l.P, m = P.length >> 1;
      for (let k = 0; k < m; k++){ if (portal(l, k, m)) continue; const x = P[2*k], y = P[2*k + 1], e = l.E ? l.E[k] : 0, cx = Math.floor(x/CS), cy = Math.floor(y/CS), fx = x - cx*CS, fy = y - cy*CS;
        const x0 = fx < 1 ? cx - 1 : cx, x1 = fx > CS - 1 ? cx + 1 : cx, y0 = fy < 1 ? cy - 1 : cy, y1 = fy > CS - 1 ? cy + 1 : cy; let hit = false;
        for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++){ const L = cells.get(cellKey(gx, gy)); if (!L) continue;
          for (const id of L){ const l2 = SL[id]; if (l2 === li) continue; const k2 = SK[id], Q = lines[l2].P, ax = Q[2*k2], ay = Q[2*k2 + 1], dx = Q[2*k2 + 2] - ax, dy = Q[2*k2 + 3] - ay, ll = dx*dx + dy*dy;
            if (ll < 1) continue; const t = ((x - ax)*dx + (y - ay)*dy)/ll; if (t <= 0 || t >= 1) continue; const L2 = sq(ll); if (t*L2 < 0.6 || (1 - t)*L2 < 0.6) continue;
            const px = ax + dx*t - x, py = ay + dy*t - y; if (px*px + py*py > 0.5625) continue; const e2 = Ez(lines[l2], k2, t); if (Math.abs(e2 - e) >= 2.5) continue;
            addCut(l2, k2 + t, x, y, e2); hit = true; } }
        if (hit) addCut(li, k, x, y, e); } }
    // (2b) two segments crossing at ground level (the crossing point belongs to one cell: each pair is found once)
    const gl = li => { const l = lines[li]; return l.c >= 2 && !(l.flags & 2) && l.c <= MAXC; };
    for (const [key, L] of cells){ if (L.length < 2) continue; const cx = Math.floor(key/8000) - 4000, cy = key - (cx + 4000)*8000 - 4000;
      for (let i = 0; i < L.length; i++){ const a = L[i], la = SL[a]; if (!gl(la)) continue; const A = lines[la], P = A.P, ka = SK[a], ax = P[2*ka], ay = P[2*ka + 1], adx = P[2*ka + 2] - ax, ady = P[2*ka + 3] - ay;
        if (A.E && (A.E[ka] > 1.5 || A.E[ka + 1] > 1.5)) continue;
        for (let j = i + 1; j < L.length; j++){ const b = L[j], lb = SL[b]; if (lb === la || !gl(lb)) continue; const B = lines[lb], Q = B.P, kb = SK[b], bx = Q[2*kb], by = Q[2*kb + 1], bdx = Q[2*kb + 2] - bx, bdy = Q[2*kb + 3] - by;
          if (B.E && (B.E[kb] > 1.5 || B.E[kb + 1] > 1.5)) continue;
          const den = adx*bdy - ady*bdx; if (den === 0) continue; const t = ((bx - ax)*bdy - (by - ay)*bdx)/den, u = ((bx - ax)*ady - (by - ay)*adx)/den;
          if (t <= 0 || t >= 1 || u <= 0 || u >= 1) continue; const La = sq(adx*adx + ady*ady), Lb = sq(bdx*bdx + bdy*bdy);
          if (t*La < 0.6 || (1 - t)*La < 0.6 || u*Lb < 0.6 || (1 - u)*Lb < 0.6) continue;
          const x = ax + adx*t, y = ay + ady*t; if (Math.floor(x/CS) !== cx || Math.floor(y/CS) !== cy) continue;
          addCut(la, ka + t, x, y, Ez(A, ka, t)); addCut(lb, kb + u, x, y, Ez(B, kb, u)); } } }
    // nodes and pieces
    const NX = [], NY = [], NZ = [], NEND = [], nmap = new Map();
    const nodeAt = (x, y, e, end) => { const key = kq(x, y); let L = nmap.get(key); if (!L) nmap.set(key, L = []); for (const id of L) if (Math.abs(NZ[id] - e) < 2.5){ if (end) NEND[id] = 1; return id; }
      for (const id of L) if ((end || NEND[id]) && Math.abs(NZ[id] - e) <= 20){ if (end) NEND[id] = 1; return id; }
      const id = NX.length; NX.push(x); NY.push(y); NZ.push(e); NEND.push(end ? 1 : 0); L.push(id); return id; };
    const pLi = [], pA = [], pB = [], pLen = [], pE = [], pC = [], pOw = [], pOff = [], pN = [], VX = [], VY = [], VE = [];
    for (let li = 0; li < n; li++){ if (!ok[li]) continue; const l = lines[li], P = l.P, E = l.E, m = P.length >> 1, ow = (l.flags & 1) ? 1 : 0;
      const C = []; for (let k = 0; k < m; k++) if (k === 0 || k === m - 1 || cnt.get(kq(P[2*k], P[2*k + 1])) >= 2) C.push([k, P[2*k], P[2*k + 1], E ? E[k] : 0]);
      const X = cuts.get(li); if (X) for (const c of X) C.push(c);
      C.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
      // a tunnel mouth (flags 64: at the start, 128: at the end; the tunnel itself is not mapped) is a closed dead end: its own node
      const solo = (x, y, e) => { const id = NX.length; NX.push(x); NY.push(y); NZ.push(e); NEND.push(0); return id; };
      let prev = C[0], a = (l.flags & 64) ? solo(prev[1], prev[2], prev[3]) : nodeAt(prev[1], prev[2], prev[3], true);
      for (let i = 1; i < C.length; i++){ const cu = C[i]; if (cu[0] - prev[0] < 1e-9 && cu[1] === prev[1] && cu[2] === prev[2]) continue;
        const end = cu[0] === m - 1, b = end && (l.flags & 128) ? solo(cu[1], cu[2], cu[3]) : nodeAt(cu[1], cu[2], cu[3], end), off = VX.length;
        VX.push(prev[1]); VY.push(prev[2]); VE.push(prev[3]);
        for (let k = Math.floor(prev[0]) + 1; k < cu[0]; k++){ VX.push(P[2*k]); VY.push(P[2*k + 1]); VE.push(E ? E[k] : 0); }
        VX.push(cu[1]); VY.push(cu[2]); VE.push(cu[3]);
        let len = 0, em = 0; for (let j = off + 1; j < VX.length; j++){ const dx = VX[j] - VX[j - 1], dy = VY[j] - VY[j - 1]; len += sq(dx*dx + dy*dy); } for (let j = off; j < VX.length; j++) if (VE[j] > em) em = VE[j];
        if (b !== a || len > 1){ pLi.push(li); pA.push(a); pB.push(b); pLen.push(len); pE.push(em); pC.push(l.c); pOw.push(ow); pOff.push(off); pN.push(VX.length - off); }
        else VX.length = VY.length = VE.length = off;
        a = b; prev = cu; } }
    const nN = NX.length, nP = pLi.length, nE = nP*2;
    const G = {lines, nN, nP, nE, NX:Float64Array.from(NX), NY:Float64Array.from(NY), pLi:Int32Array.from(pLi), pA:Int32Array.from(pA), pB:Int32Array.from(pB),
      pLen:Float64Array.from(pLen), pE:Float32Array.from(pE), pC:Uint8Array.from(pC), pOw:Uint8Array.from(pOw), pOff:Int32Array.from(pOff), pN:Int32Array.from(pN),
      VX:Float64Array.from(VX), VY:Float64Array.from(VY), VE:Float32Array.from(VE)};
    const GX = G.VX, GY = G.VY;
    // directions at both ends of a piece (over its first / last ~15 m)
    const SDX = new Float64Array(nE), SDY = new Float64Array(nE), EDX = new Float64Array(nE), EDY = new Float64Array(nE), eTo = new Int32Array(nE), eFrom = new Int32Array(nE), valid = new Uint8Array(nE);
    for (let p = 0; p < nP; p++){ const k0 = pOff[p], k1 = k0 + pN[p] - 1;
      let k = k0, d = 0; while (k < k1 && d < 15){ const dx = GX[k + 1] - GX[k], dy = GY[k + 1] - GY[k]; d += sq(dx*dx + dy*dy); k++; }
      let ax = GX[k] - GX[k0], ay = GY[k] - GY[k0], al = sq(ax*ax + ay*ay) || 1; ax /= al; ay /= al;
      k = k1; d = 0; while (k > k0 && d < 15){ const dx = GX[k] - GX[k - 1], dy = GY[k] - GY[k - 1]; d += sq(dx*dx + dy*dy); k--; }
      let bx = GX[k1] - GX[k], by = GY[k1] - GY[k], bl = sq(bx*bx + by*by) || 1; bx /= bl; by /= bl;
      const f = 2*p, r = f + 1;
      SDX[f] = ax; SDY[f] = ay; EDX[f] = bx; EDY[f] = by; eFrom[f] = pA[p]; eTo[f] = pB[p]; valid[f] = 1;
      SDX[r] = -bx; SDY[r] = -by; EDX[r] = -ax; EDY[r] = -ay; eFrom[r] = pB[p]; eTo[r] = pA[p]; valid[r] = pOw[p] ? 0 : 1; }
    Object.assign(G, {SDX, SDY, EDX, EDY, eTo, eFrom, valid});
    // barriers (Singapore: the Marina Bay Street Circuit's walls stand in free drive too): a piece at ground level that crosses a wall
    // line (the circuit centreline offset by opts.wallW to both sides) is closed both ways; roads along the circuit inside the walls and
    // flyovers over it stay open
    let nbar = 0;
    if (opts && opts.walls && opts.walls.length > 2){ const W = opts.wallW || 8, C0 = opts.walls, nW = C0.length, segs = [];
      for (const side of [1, -1]){ const off = []; for (let i = 0; i < nW; i++){ const a = C0[(i - 1 + nW) % nW], b = C0[(i + 1) % nW], dx = b[0] - a[0], dy = b[1] - a[1], l = sq(dx*dx + dy*dy) || 1; off.push([C0[i][0] - dy/l*W*side, C0[i][1] + dx/l*W*side]); }
        for (let i = 0; i < nW; i++) segs.push([off[i][0], off[i][1], off[(i + 1) % nW][0], off[(i + 1) % nW][1]]); }
      let bx0 = 1e18, by0 = 1e18, bx1 = -1e18, by1 = -1e18; for (const q of segs){ bx0 = Math.min(bx0, q[0], q[2]); bx1 = Math.max(bx1, q[0], q[2]); by0 = Math.min(by0, q[1], q[3]); by1 = Math.max(by1, q[1], q[3]); }
      const X = G.VX, Y = G.VY, E = G.VE;
      for (let p = 0; p < nP; p++){ const k0 = pOff[p], k1 = k0 + pN[p] - 1; let hit = false;
        for (let k = k0; k < k1 && !hit; k++){ const ax = X[k], ay = Y[k], bx = X[k + 1], by = Y[k + 1]; if (E[k] > 3 && E[k + 1] > 3) continue;
          if (Math.max(ax, bx) < bx0 || Math.min(ax, bx) > bx1 || Math.max(ay, by) < by0 || Math.min(ay, by) > by1) continue;
          for (const q of segs){ const dx = bx - ax, dy = by - ay, ex = q[2] - q[0], ey = q[3] - q[1], den = dx*ey - dy*ex; if (den === 0) continue;
            const t = ((q[0] - ax)*ey - (q[1] - ay)*ex)/den, u = ((q[0] - ax)*dy - (q[1] - ay)*dx)/den; if (t >= 0 && t <= 1 && u >= 0 && u <= 1){ hit = true; break; } } }
        if (hit){ valid[2*p] = valid[2*p + 1] = 0; nbar++; } } }
    // out / in adjacency (CSR)
    const csr = (key) => { const S = new Int32Array(nN + 1); for (let e = 0; e < nE; e++) if (valid[e]) S[key[e] + 1]++; for (let i = 0; i < nN; i++) S[i + 1] += S[i];
      const L = new Int32Array(S[nN]), w = S.slice(0, nN); for (let e = 0; e < nE; e++) if (valid[e]) L[w[key[e]]++] = e; return [S, L]; };
    [G.oS, G.oE] = csr(eFrom); [G.iS, G.iE] = csr(eTo);
    // node degree (distinct pieces): junctions are >= 3
    const deg = new Uint8Array(nN); for (let p = 0; p < nP; p++){ if (deg[pA[p]] < 255) deg[pA[p]]++; if (pB[p] !== pA[p] && deg[pB[p]] < 255) deg[pB[p]]++; } G.deg = deg;
    // the largest strongly connected component (Kosaraju, iterative)
    const comp = new Int32Array(nN).fill(-1), seen = new Uint8Array(nN), order = new Int32Array(nN), stN = new Int32Array(nN), stQ = new Int32Array(nN); let no = 0;
    for (let s = 0; s < nN; s++){ if (seen[s]) continue; let sp = 0; stN[0] = s; stQ[0] = G.oS[s]; seen[s] = 1;
      while (sp >= 0){ const v = stN[sp]; if (stQ[sp] < G.oS[v + 1]){ const w = eTo[G.oE[stQ[sp]++]]; if (!seen[w]){ seen[w] = 1; sp++; stN[sp] = w; stQ[sp] = G.oS[w]; } } else { order[no++] = v; sp--; } } }
    let nc = 0; const size = [];
    for (let i = nN - 1; i >= 0; i--){ const s = order[i]; if (comp[s] >= 0) continue; let sp = 0, sz = 0; stN[0] = s; comp[s] = nc;
      while (sp >= 0){ const v = stN[sp--]; sz++; for (let q = G.iS[v]; q < G.iS[v + 1]; q++){ const u = eFrom[G.iE[q]]; if (comp[u] < 0){ comp[u] = nc; stN[++sp] = u; } } }
      size.push(sz); nc++; }
    let main = 0; for (let c = 1; c < nc; c++) if (size[c] > size[main]) main = c;
    const use = new Uint8Array(nE); let nu = 0; for (let e = 0; e < nE; e++) if (valid[e] && comp[eFrom[e]] === main && comp[eTo[e]] === main){ use[e] = 1; nu++; }
    G.use = use; G.comp = comp; G.main = main;
    G.dist = new Float64Array(nE); G.pred = new Int32Array(nE); G.lenM = new Float64Array(nE); G.elevM = new Float64Array(nE); G.majM = new Float64Array(nE);
    let ncut = 0; for (const L of cuts.values()) ncut += L.length;
    G.stats = {nodes:nN, pieces:nP, edges:nE, usable:nu, mainNodes:size[main], comps:nc, geoCuts:ncut, barred:nbar, ms:Date.now() - t0};
    return G;
  }
  // spatial index of the usable pieces (250 m cells) for snapping points to the network
  function grid(G){
    if (G.cells) return G.cells; const C = new Map(), cs = 250;
    for (let p = 0; p < G.nP; p++){ if (!G.use[2*p] && !G.use[2*p + 1]) continue; const seen = new Set(), k0 = G.pOff[p], k1 = k0 + G.pN[p];
      const put = (x, y) => { const key = Math.floor(x/cs)*100003 + Math.floor(y/cs); if (seen.has(key)) return; seen.add(key); let L = C.get(key); if (!L) C.set(key, L = []); L.push(p); };
      for (let k = k0; k < k1; k++){ put(G.VX[k], G.VY[k]); if (k + 1 < k1){ const dx = G.VX[k + 1] - G.VX[k], dy = G.VY[k + 1] - G.VY[k], n = Math.ceil(sq(dx*dx + dy*dy)/(cs*0.4)); for (let j = 1; j < n; j++) put(G.VX[k] + dx*j/n, G.VY[k] + dy*j/n); } } }
    return G.cells = C;
  }
  // the nearest usable piece to (x, y) within r: {p, e (directed by dir or by one-way), s (metres from the edge start), d}
  function snap(G, x, y, r, dir, o){
    o = o || {}; const C = grid(G), cs = 250, R = Math.ceil(r/cs); let best = null, bd = 1e18;
    for (let gx = Math.floor(x/cs) - R; gx <= Math.floor(x/cs) + R; gx++) for (let gy = Math.floor(y/cs) - R; gy <= Math.floor(y/cs) + R; gy++){ const L = C.get(gx*100003 + gy); if (!L) continue;
      for (const p of L){ const c = G.pC[p]; if (o.maxC !== undefined && c > o.maxC) continue; if (o.name && !nameOk(G.lines[G.pLi[p]], o.name)) continue; let sAcc = 0; const k0 = G.pOff[p], k1 = k0 + G.pN[p] - 1, VX = G.VX, VY = G.VY;
        for (let k = k0; k < k1; k++){ const ax = VX[k], ay = VY[k], dx = VX[k + 1] - ax, dy = VY[k + 1] - ay, l2 = dx*dx + dy*dy, ll = sq(l2) || 1;
          let t = l2 > 0 ? ((x - ax)*dx + (y - ay)*dy)/l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; const px = ax + dx*t - x, py = ay + dy*t - y, d = sq(px*px + py*py);
          let e = 2*p, al = 1; if (dir){ const dt = (dx*dir[0] + dy*dir[1])/ll; if (dt < 0 && G.use[2*p + 1]) e = 2*p + 1; al = (e & 1) ? -dt : dt; } if (!G.use[e]) e = G.use[2*p] ? 2*p : 2*p + 1; if (!G.use[e]) continue;
          const sc = d + (dir ? (1 - al)*25 : 0) + (o.prefMajor ? c*2 : 0);
          if (sc < bd){ bd = sc; const sf = sAcc + ll*t; best = {p, e, s:(e & 1) ? G.pLen[p] - sf : sf, d}; } sAcc += ll; } } }
    return best && best.d <= r ? best : null;
  }
  function nameOk(l, re){ const nm = (l.name ? l.name[0] : '') + ' ' + (l.ref || ''); return re.test(nm); }
  // ---- search ----
  const H = {c:new Float64Array(1 << 16), id:new Int32Array(1 << 16), n:0};
  function hPush(c, id){ if (H.n >= H.c.length){ const c2 = new Float64Array(H.c.length*2); c2.set(H.c); H.c = c2; const i2 = new Int32Array(H.id.length*2); i2.set(H.id); H.id = i2; }
    let i = H.n++; while (i > 0){ const p = (i - 1) >> 1; if (H.c[p] < c || (H.c[p] === c && H.id[p] < id)) break; H.c[i] = H.c[p]; H.id[i] = H.id[p]; i = p; } H.c[i] = c; H.id[i] = id; }
  function hPop(){ const top = H.id[0], c = H.c[--H.n], id = H.id[H.n]; let i = 0;
    for (;;){ let l = 2*i + 1; if (l >= H.n) break; const r = l + 1; if (r < H.n && (H.c[r] < H.c[l] || (H.c[r] === H.c[l] && H.id[r] < H.id[l]))) l = r; if (H.c[l] > c || (H.c[l] === c && H.id[l] > id)) break; H.c[i] = H.c[l]; H.id[i] = H.id[l]; i = l; }
    H.c[i] = c; H.id[i] = id; return top; }
  const turnPen = ct => ct >= 0.94 ? 0 : ct >= 0.7 ? 8 : ct >= 0.17 ? 25 : ct >= -0.26 ? 45 : 90;
  // o: {e0, s0 (metres already driven on e0), maxCost, pen (per piece cost factors), target:{e, s} (stop there), onSettle(e) -> true stops}
  function search(G, o){
    const {dist, pred, lenM, elevM, majM} = G, e0 = o.e0, p0 = e0 >> 1, rest = G.pLen[p0] - o.s0;
    dist.fill(Infinity); pred.fill(-1); H.n = 0;
    dist[e0] = rest*CF[G.pC[p0]]; lenM[e0] = rest; elevM[e0] = G.pE[p0] > 4 ? rest : 0; majM[e0] = G.pC[p0] <= 4 ? rest : 0; hPush(dist[e0], e0);
    let best = Infinity, bestPred = -1; const T = o.target, maxC = o.maxCost || Infinity, pen = o.pen;
    while (H.n){ const c = H.c[0], e = hPop(); if (c > dist[e]) continue; if (c >= best || c > maxC) break;
      if (o.onSettle && o.onSettle(e)) break;
      const v = G.eTo[e], p = e >> 1, shortE = G.pLen[p] < 45, pe = pred[e];
      for (let q = G.oS[v]; q < G.oS[v + 1]; q++){ const f = G.oE[q]; if (!G.use[f] || (f >> 1) === p) continue;
        const ct = G.EDX[e]*G.SDX[f] + G.EDY[e]*G.SDY[f]; if (ct < -0.55) continue;
        if (shortE && pe >= 0 && G.EDX[pe]*G.SDX[f] + G.EDY[pe]*G.SDY[f] < -0.8) continue;
        const pf = f >> 1, cl = G.pC[pf], tp = turnPen(ct);
        if (T && f === T.e){ const cc = c + tp + T.s*CF[cl]*(pen ? pen[pf] : 1); if (cc < best){ best = cc; bestPred = e; } }
        const nc = c + tp + G.pLen[pf]*CF[cl]*(pen ? pen[pf] : 1);
        if (nc < dist[f]){ dist[f] = nc; pred[f] = e; const L = G.pLen[pf]; lenM[f] = lenM[e] + L; elevM[f] = elevM[e] + (G.pE[pf] > 4 ? L : 0); majM[f] = majM[e] + (cl <= 4 ? L : 0); hPush(nc, f); } } }
    return T ? (bestPred >= 0 ? {cost:best, pred:bestPred} : null) : null;
  }
  // the edge chain e0 .. e from the predecessor links of the last search
  function chain(G, e){ const out = []; let k = 0; while (e >= 0 && k++ < 100000){ out.push(e); e = G.pred[e]; } return out.reverse(); }
  // ---- route assembly ----
  // segs: [{e, a, b}] metres along each directed edge -> polyline with heights (E above ground), class, one-way, line index; junction marks
  function assemble(G, segs){
    const X = [], Y = [], Z = [], C = [], OW = [], LI = [], J = [];
    const put = (x, y, z, c, ow, li) => { const n = X.length; if (n && Math.abs(X[n - 1] - x) < 0.05 && Math.abs(Y[n - 1] - y) < 0.05) return; X.push(x); Y.push(y); Z.push(z); C.push(c); OW.push(ow); LI.push(li); };
    for (let i = 0; i < segs.length; i++){ const {e, a, b} = segs[i], p = e >> 1, li = G.pLi[p], k0 = G.pOff[p], k1 = k0 + G.pN[p] - 1, c = G.pC[p], ow = G.pOw[p], VX = G.VX, VY = G.VY, VE = G.VE;
      const ks = []; if (e & 1) for (let k = k1; k >= k0; k--) ks.push(k); else for (let k = k0; k <= k1; k++) ks.push(k);
      if (i > 0) J.push(X.length - 1);
      let s = 0;
      for (let j = 0; j < ks.length - 1; j++){ const ka = ks[j], kb = ks[j + 1], ax = VX[ka], ay = VY[ka], dx = VX[kb] - ax, dy = VY[kb] - ay, L = sq(dx*dx + dy*dy), za = VE[ka], zb = VE[kb];
        const s1 = s + L;
        if (s1 >= a && s <= b && L > 0){ const ta = Math.max(0, (a - s)/L), tb = Math.min(1, (b - s)/L);
          put(ax + dx*ta, ay + dy*ta, za + (zb - za)*ta, c, ow, li); put(ax + dx*tb, ay + dy*tb, za + (zb - za)*tb, c, ow, li); }
        s = s1; if (s > b) break; } }
    const n = X.length, S = new Float64Array(n); for (let i = 1; i < n; i++){ const dx = X[i] - X[i - 1], dy = Y[i] - Y[i - 1]; S[i] = S[i - 1] + sq(dx*dx + dy*dy); }
    return {X, Y, Z, C, OW, LI, S, J};
  }
  // point / unit direction at distance s along the assembled polyline
  function at(R, s, out){ const S = R.S, n = S.length; s = s < 0 ? 0 : s > S[n - 1] ? S[n - 1] : s; let lo = 0, hi = n - 1; while (hi - lo > 1){ const m = (lo + hi) >> 1; if (S[m] <= s) lo = m; else hi = m; }
    const L = S[hi] - S[lo] || 1, t = (s - S[lo])/L; out = out || {}; out.x = R.X[lo] + (R.X[hi] - R.X[lo])*t; out.y = R.Y[lo] + (R.Y[hi] - R.Y[lo])*t; out.z = R.Z[lo] + (R.Z[hi] - R.Z[lo])*t;
    out.dx = (R.X[hi] - R.X[lo])/L; out.dy = (R.Y[hi] - R.Y[lo])/L; out.i = lo; return out; }
  // direction from s - d to s + d (chord: smooth over short segments)
  function chord(R, s0, s1){ const a = at(R, s0), b = at(R, s1), dx = b.x - a.x, dy = b.y - a.y, l = sq(dx*dx + dy*dy) || 1; return [dx/l, dy/l]; }
  // checkpoints: past every turn (the exit of the junction), every 300-600 m on the straights, the finish at the end
  function checkpoints(G, R, segs){
    const tot = R.S[R.S.length - 1], turns = [], junc = [];
    for (let i = 1; i < segs.length; i++){ const v = G.eFrom[segs[i].e], j = R.J[i - 1]; if (j === undefined) continue; const s = R.S[j]; if (G.deg[v] >= 3) junc.push(s);
      if (s < 40 || s > tot - 40) continue; const u = chord(R, s - 30, s - 2), w = chord(R, s + 2, s + 30), ct = u[0]*w[0] + u[1]*w[1];
      if (ct < 0.82) turns.push({s, ct}); }
    const cps = [], add = (s, kind) => { cps.push({s, kind}); };
    const nearJ = s => { for (const q of junc) if (Math.abs(q - s) < 22) return q; return null; };
    const fill = (a, b) => { const n = Math.ceil((b - a)/560); for (let k = 1; k < n; k++){ let s = a + (b - a)*k/n; const q = nearJ(s); if (q !== null){ const s2 = q + 28 < b - 120 ? q + 28 : q - 28; if (s2 > a + 120) s = s2; } add(s, 'run'); } };
    let last = 0;
    for (const t of turns){ const s = t.s + (t.ct < 0.2 ? 26 : 22); if (s - last < 160 || s > tot - 90) continue; fill(last, s); add(s, 'turn'); last = s; }
    fill(last, tot); add(tot, 'finish');
    return cps;
  }
  function pack(G, R, segs, meta){
    const cpl = checkpoints(G, R, segs), p = {}, cps = [];
    for (const c of cpl){ at(R, c.s, p); const i = p.i, cl = R.C[i], ow = R.OW[i], d = chord(R, c.s - 6, c.s + 6);
      cps.push({x:r2(p.x), y:r2(p.y), e:r2(p.z), w:r2(WID[Math.min(10, cl)][ow ? 1 : 0] + 4), hdg:Math.round((90 - Math.atan2(d[1], d[0])*180/Math.PI + 360) % 360*10)/10, s:Math.round(c.s*10)/10, kind:c.kind, c:cl, ow}); }
    const d0 = chord(R, 0, 25), tot = R.S[R.S.length - 1];
    // the roads it uses most (for the description)
    const by = new Map(); for (let i = 1; i < R.X.length; i++){ const l = G.lines[R.LI[i]], nm = l.name ? l.name[0] : l.ref; if (!nm) continue; by.set(nm, (by.get(nm) || 0) + R.S[i] - R.S[i - 1]); }
    const roads = [...by.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 4).map(r => r[0]);
    let elev = 0; for (let i = 1; i < R.X.length; i++) if (R.Z[i] > 4) elev += R.S[i] - R.S[i - 1];
    return Object.assign({id:null, seed:null, city:null, start:{x:r2(R.X[0]), y:r2(R.Y[0]), e:r2(R.Z[0]), hdg:Math.round((90 - Math.atan2(d0[1], d0[0])*180/Math.PI + 360) % 360*10)/10},
      cps, lengthM:Math.round(tot), roads, elevM:Math.round(elev),
      path:{x:R.X.map(r2), y:R.Y.map(r2), e:R.Z.map(r2), c:R.C.slice(), ow:R.OW.slice()}}, meta);
  }
  // ---- random routes ----
  // start candidates: major roads (expressway / trunk / primary / secondary / tertiary, no slip roads), straight for 50 m behind and
  // 110 m ahead of the start line, the start 60 m into a piece of at least 170 m
  function starts(G){
    if (G.starts) return G.starts; const out = [];
    for (let e = 0; e < G.nE; e++){ if (!G.use[e]) continue; const p = e >> 1, c = G.pC[p], l = G.lines[G.pLi[p]]; if (c > 8 || (c & 1) || (l.flags & 16) || G.pLen[p] < 170 || G.pE[p] > 12) continue;
      if (G.SDX[e]*G.EDX[e] + G.SDY[e]*G.EDY[e] < 0.93) continue;
      out.push(e); }
    return G.starts = out;
  }
  function straightAt(G, e, s0){ const R = assemble(G, [{e, a:Math.max(0, s0 - 50), b:Math.min(G.pLen[e >> 1], s0 + 110)}]), n = R.X.length; if (n < 2) return false;
    const dx = R.X[n - 1] - R.X[0], dy = R.Y[n - 1] - R.Y[0], L = sq(dx*dx + dy*dy); return L > 0.985*R.S[n - 1]; }
  // seed + {km (3-12), loop, hubs:[[x, y, r]]} -> route (or null)
  function random(G, seed, o){
    o = o || {}; const rng = rngOf(hash(seed)), L = Math.max(2, Math.min(25, +o.km || 6))*1000, S = starts(G);
    if (!S.length) return null;
    for (let att = 0; att < 14; att++){
      // a start near one of the city's hubs (deterministic: the hub, then a candidate by index)
      let cand = S;
      if (o.hubs && o.hubs.length){ const h = o.hubs[Math.floor(rng()*o.hubs.length)]; cand = S.filter(e => { const p = e >> 1, a = G.pA[p], dx = G.NX[a] - h[0], dy = G.NY[a] - h[1]; return dx*dx + dy*dy < h[2]*h[2]; }); if (cand.length < 5) cand = S; }
      const e0 = cand[Math.floor(rng()*cand.length)], s0 = 60;
      if (!straightAt(G, e0, s0)) continue;
      const r = o.loop ? loopFrom(G, e0, s0, L, rng) : sprintFrom(G, e0, s0, L, rng);
      if (r) return r;
    }
    return null;
  }
  const finishOk = (G, e) => { const v = G.eTo[e]; for (let q = G.oS[v]; q < G.oS[v + 1]; q++){ const f = G.oE[q]; if (G.use[f] && (f >> 1) !== (e >> 1) && G.EDX[e]*G.SDX[f] + G.EDY[e]*G.SDY[f] > -0.55) return true; } return false; };
  function sprintFrom(G, e0, s0, L, rng, pen, lo, hi){
    lo = lo || 0.9; hi = hi || 1.12; const cand = [];
    search(G, {e0, s0, maxCost:L*2.2, pen, onSettle:e => { const p = e >> 1, len = G.pLen[p], m = G.lenM[e];
      if (m >= L*lo && m - len + 45 <= L*hi && G.pC[p] <= 8 && !(G.pC[p] & 1) && len >= 90 && e !== e0 && finishOk(G, e)){
        const sc = G.elevM[e]/m*1.2 + G.majM[e]/m*0.6 + rng(); cand.push({e, sc, m, len}); if (cand.length >= 60) return true; }
      return false; }});
    if (!cand.length) return null;
    let b = cand[0]; for (const c of cand) if (c.sc > b.sc) b = c;
    // the path again (the search state is overwritten by later searches): re-run to the chosen edge
    const ch = pathTo(G, e0, s0, b.e, pen); if (!ch) return null;
    const fin = Math.max(45, Math.min(b.len - 25, L - (b.m - b.len)));
    return segsOf(ch, s0, fin, G);
  }
  function pathTo(G, e0, s0, et, pen){ let hit = false; search(G, {e0, s0, pen, onSettle:e => (hit = e === et)}); return hit ? chain(G, et) : null; }
  function segsOf(ch, s0, fin, G){ return ch.map((e, i) => ({e, a:i === 0 ? s0 : 0, b:i === ch.length - 1 ? fin : G.pLen[e >> 1]})); }
  // a loop: out to a turning point ~45 % of the length away, back by other roads (the outbound pieces cost 6x), the finish on the start line
  function loopFrom(G, e0, s0, L, rng){
    const out = sprintFrom(G, e0, s0, L*0.45, rng, null, 0.8, 1.15); if (!out) return null;
    const used = new Float32Array(G.nP).fill(1); for (const s of out) used[s.e >> 1] = 6;
    const last = out[out.length - 1], back = search(G, {e0:last.e, s0:last.b, pen:used, target:{e:e0, s:s0}});
    if (!back) return null;
    const ch = chain(G, back.pred); ch.push(e0);
    const segs = out.slice(0, -1).concat(ch.map((e, i) => ({e, a:i === 0 ? last.b : 0, b:i === ch.length - 1 ? s0 : G.pLen[e >> 1]})));
    // merge the turning point (same edge twice: last of the outbound, first of the return)
    segs[out.length - 1] = {e:last.e, a:out[out.length - 1].a, b:G.pLen[last.e >> 1]};
    let tot = 0; for (const s of segs) tot += s.b - s.a; if (tot < L*0.7 || tot > L*1.45) return null;
    return segs;
  }
  // ---- routes through given points (curated): via [{x, y, dir:[dx, dy] | undefined, name: RegExp | undefined}] ----
  function via(G, pts, o){
    o = o || {}; const sn = [];
    for (let i = 0; i < pts.length; i++){ const q = pts[i], nx = pts[i + 1] || pts[i - 1], dir = q.dir || (i + 1 < pts.length ? [nx.x - q.x, nx.y - q.y] : [q.x - pts[i - 1].x, q.y - pts[i - 1].y]);
      const l = sq(dir[0]*dir[0] + dir[1]*dir[1]) || 1; const s = snap(G, q.x, q.y, q.r || (q.name ? 1200 : 150), [dir[0]/l, dir[1]/l], {name:q.name, maxC:q.maxC});
      if (!s) return {err:'snap ' + i}; sn.push(s); }
    let segs = [];
    for (let i = 0; i + 1 < sn.length; i++){ const A = sn[i], B = sn[i + 1], a0 = segs.length ? segs[segs.length - 1] : null;
      const e0 = a0 ? a0.e : A.e, s0 = a0 ? a0.b : A.s;
      if (B.e === e0 && B.s > s0 + 5){ if (a0) a0.b = B.s; else segs.push({e:e0, a:s0, b:B.s}); continue; }
      const r = search(G, {e0, s0, target:{e:B.e, s:B.s}}); if (!r) return {err:'leg ' + i};
      const ch = chain(G, r.pred); ch.push(B.e);
      const part = ch.map((e, k) => ({e, a:k === 0 ? s0 : 0, b:k === ch.length - 1 ? B.s : G.pLen[e >> 1]}));
      if (a0){ a0.b = G.pLen[a0.e >> 1]; part.shift(); } else part[0].a = A.s;
      segs = segs.concat(part); }
    return {segs};
  }
  // a curated route: def {via:[[lat, lon, hdg (compass deg, optional), name regexp (optional), snap radius (optional)]...], loop}
  function curated(G, def, xy){
    const pts = def.via.map(v => { const q = xy(v[0], v[1]), a = v[2] === undefined || v[2] === null ? null : v[2]*Math.PI/180;
      return {x:q[0], y:q[1], dir:a === null ? undefined : [Math.sin(a), Math.cos(a)], name:v[3] ? new RegExp(v[3], 'i') : undefined, r:v[4]}; });
    if (def.loop) pts.push(Object.assign({}, pts[0]));
    const r = via(G, pts); if (r.err) return r;
    const R = assemble(G, r.segs), out = pack(G, R, r.segs, {});
    let k = 0; while (k < R.S.length - 1 && R.S[k] < 110) k++; const dx = R.X[k] - R.X[0], dy = R.Y[k] - R.Y[0]; out.straight = sq(dx*dx + dy*dy) > 0.985*R.S[k];
    return out;
  }
  // what must be identical on every client for the same seed: start, checkpoints, length, the polyline
  const canon = r => r ? {s:[r.start.x, r.start.y, r.start.e, r.start.hdg], c:r.cps.map(c => [c.x, c.y, c.e, c.w, c.s]), L:r.lengthM, px:r.path.x, py:r.path.y} : null;
  return {build, snap, search, assemble, pack, random, via, curated, at, hash, rngOf, WID, starts, canon};
})();
// random starts near the busy parts of each map: [lat, lon, radius km]
const CITY_HUBS = {
  sg:[[1.2830, 103.8510, 2.5], [1.3040, 103.8320, 2.5], [1.3100, 103.8800, 3], [1.3530, 103.9450, 3], [1.3330, 103.7420, 3], [1.4360, 103.7860, 3], [1.3700, 103.8490, 3], [1.3150, 103.9300, 3], [1.3350, 103.8000, 3]],
  bay:[[37.7880, -122.4000, 2.5], [37.7650, -122.4150, 3], [37.8050, -122.2700, 3], [37.8700, -122.2700, 2.5], [37.3350, -121.8900, 4], [37.4440, -122.1600, 3], [37.3900, -122.0800, 3], [37.5630, -122.3250, 3], [37.5480, -121.9880, 3]],
  nyc:[[40.7550, -73.9850, 2.5], [40.7130, -74.0060, 2], [40.8100, -73.9500, 3], [40.6800, -73.9600, 4], [40.7400, -73.8700, 4], [40.8400, -73.8800, 4], [40.7280, -74.0650, 3], [40.5900, -74.1200, 4]]};
// curated routes: via points [lat, lon, compass heading (optional), road name regexp (optional), snap radius m (optional)]; loop: back to the start
const CURATED = {
  sg:[
    {id:'marina', zh:'滨海湾环线', en:'Marina Bay loop', sub:'本杰明·薛尔思大桥 · 尼诰大道 · Benjamin Sheares Bridge · Nicoll Hwy', loop:true,
      via:[[1.27900, 103.85700, 30, 'Bayfront'], [1.29000, 103.86400, 40, 'East Coast Parkway'], [1.30650, 103.87350, 251, 'Nicoll'], [1.29900, 103.86260, 225, 'Nicoll']]},
    {id:'orchard-changi', zh:'乌节路 → 樟宜', en:'Orchard → Changi', sub:'经东海岸公园大道 · via the ECP', via:[[1.30440, 103.83300, 113, 'Orchard'], [1.30100, 103.90500, 76, 'East Coast Parkway'], [1.31100, 103.94500, 80, 'East Coast Parkway'], [1.34500, 103.98322, 23, 'Airport Boulevard', 60]]},
    {id:'westcoast', zh:'西海岸高架', en:'West Coast viaduct', sub:'西海岸公路高架 · West Coast Highway', via:[[1.26900, 103.82200, 286, 'West Coast Highway'], [1.28000, 103.78340, 300, 'West Coast Highway'], [1.29800, 103.76400, 330, 'West Coast Highway']]},
    {id:'pie', zh:'泛岛快速公路', en:'PIE dash', sub:'加冷 → 武吉知马 · Kallang → Bukit Timah', via:[[1.32000, 103.87000, 290, 'Pan-Island'], [1.33300, 103.84000, 280, 'Pan-Island'], [1.33500, 103.80800, 270, 'Pan-Island']]},
    {id:'changi-coast', zh:'樟宜海岸', en:'Changi coast', sub:'沿机场跑道 · along the runways', via:[[1.31600, 103.98900, 112, 'Tanah Merah Coast'], [1.32300, 104.00950, 47, 'Tanah Merah Coast'], [1.34500, 104.02400, 8, 'Tanah Merah Coast'], [1.36000, 104.02600, 8]]}],
  bay:[
    {id:'ggb', zh:'内河码头 → 金门大桥', en:'Embarcadero → Golden Gate', sub:'海滨大道 · 金门大桥 · The Embarcadero · GG Bridge', via:[[37.79560, -122.39350, 315, 'Embarcadero'], [37.80600, -122.43500, 270, 'Marina'], [37.82000, -122.47850, 0, 'Golden Gate'], [37.83200, -122.48000, 0]]},
    {id:'sanmateo', zh:'圣马特奥大桥冲刺', en:'San Mateo Bridge sprint', sub:'福斯特城 → 海沃德 · Foster City → Hayward', via:[[37.56500, -122.27500, 60, 'CA 92|Younger'], [37.59500, -122.21000, 70, 'San Mateo|CA 92'], [37.62000, -122.14000, 70, 'CA 92']]},
    {id:'sv', zh:'硅谷 280 / 101', en:'Silicon Valley 280 / 101', sub:'沙丘路 → 280 → 佩奇米尔路 → 101 · Sand Hill → I-280 → Page Mill → US 101', via:[[37.42400, -122.20000, 253, 'Sand Hill'], [37.40000, -122.18500, 150, 'Junipero|I 280'], [37.41500, -122.14800, 33, 'Page Mill'], [37.43400, -122.13300, 33, 'Oregon'], [37.45200, -122.13200, 315, 'Bayshore|US 101'], [37.45500, -122.14900, 239, 'University']]},
    {id:'twinpeaks', zh:'双峰爬坡', en:'Twin Peaks climb', sub:'卡斯特罗 → 双峰 · Castro → Twin Peaks', via:[[37.76240, -122.43520, 240, 'Market'], [37.75400, -122.44400, 210, 'Portola|Market'], [37.75280, -122.44770, null, 'Twin Peaks']]},
    {id:'greathwy', zh:'大海滩公路', en:'Great Highway', sub:'海洋海滩 · 金门公园 · Ocean Beach · Golden Gate Park', via:[[37.73500, -122.50600, 0, 'Great Highway'], [37.76500, -122.50950, 0, 'Great Highway'], [37.76900, -122.49000, 90, 'Kennedy|Fulton']]}],
  nyc:[
    {id:'midtown', zh:'中城网格冲刺', en:'Midtown grid sprint', sub:'第六大道 · 57 街 · 公园大道 · 42 街 · 6th Ave · 57th · Park Ave · 42nd', via:[[40.74990, -73.98790, 29, 'Avenue of the Americas|6th'], [40.76300, -73.97850, 29, 'Avenue of the Americas|6th'], [40.76250, -73.97300, 119, '57th'], [40.75600, -73.97500, 209, 'Park Avenue'], [40.75300, -73.98000, 299, '42nd'], [40.75620, -73.98720, 299, '42nd']]},
    {id:'bridges', zh:'布鲁克林桥 · 曼哈顿桥', en:'Brooklyn & Manhattan bridges', sub:'跨东河一圈 · East River loop', loop:true, via:[[40.71300, -74.00390, 195, 'Centre'], [40.70570, -73.99640, 136, 'Brooklyn Bridge'], [40.70900, -73.99150, 337, 'Chrystie|Canal|Flatbush']]},
    {id:'fdr-wsh', zh:'罗斯福大道 · 西侧高速', en:'FDR / West Side Highway lap', sub:'曼哈顿下城一圈 · Lower Manhattan lap', loop:true, via:[[40.74800, -73.96800, 200, 'FDR'], [40.71000, -73.98000, 230, 'FDR'], [40.71500, -74.01300, 15, 'West Street|West Side|Joe DiMaggio'], [40.76000, -73.99900, 30, 'Joe DiMaggio|West Side|12th'], [40.75300, -73.97000, 120, '42nd']]},
    {id:'verrazzano', zh:'韦拉扎诺海峡大桥', en:'Verrazzano dash', sub:'布鲁克林 → 史坦顿岛 · Brooklyn → Staten Island', via:[[40.62000, -74.03000, 200, 'Gowanus|Belt|I 278'], [40.60650, -74.04500, 250, 'Verrazzano'], [40.60800, -74.07500, 270, 'Staten Island']]},
    {id:'gwb', zh:'乔治·华盛顿大桥', en:'George Washington Bridge', sub:'哈德逊河公园道 → 新泽西 · Henry Hudson Pkwy → New Jersey', via:[[40.83000, -73.95000, 20, 'Henry Hudson'], [40.85150, -73.95300, 290, 'George Washington'], [40.85300, -73.97500, 280]]}]};
//</GEN>
// ---------------------------------------------------------------- runtime: city, graph, routes, the prepared route (5 m samples)
const PI = Math.PI, TAU = PI*2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const wrapA = a => { a = (a + PI) % TAU; if (a < 0) a += TAU; return a - PI; };
const sstep = (a, b, x) => { const t = clamp((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t); };
const DRV = () => (typeof window !== 'undefined' && window.SGF1) || null;
// driving now? (SGF1 exposes its state as F1.on / state().on)
const drvOn = () => { const S = DRV(); return !!(S && (S.on !== undefined ? S.on : S.F1 && S.F1.on)); };
// the city of this page (the US flags are top-level consts declared after the modules: test them lazily)
function cityKey(){
  try { if (typeof SGR_NYC !== 'undefined' && SGR_NYC) return 'nyc'; } catch (e){ /* not declared yet */ }
  try { if (typeof SGR_BAY !== 'undefined' && SGR_BAY) return 'bay'; } catch (e){ /* not declared yet */ }
  const m = typeof document !== 'undefined' && document.querySelector('meta[name="citybrush-map"]'); return m && m.content ? m.content : 'sg';
}
const isUS = () => cityKey() !== 'sg';
const SIDE = () => isUS() ? -1 : 1;                 // + = left of the driving direction (Singapore keeps left, the US right)
const gndZ = (x, y) => { try { if (typeof SGRoads !== 'undefined' && SGRoads.ground) return SGRoads.ground(x, y); } catch (e){ /* */ } return hC(x, y); };
const llOf = (x, y) => [SG.lat0 + y/SG.MY, SG.lon0 + x/SG.MX];
const CR = {G:null, GL:null, cache:new Map(), buildMs:0, fin:[], opp:[], lastErr:null};
function graph(){
  if (!SGR.on || !SGR.lines) return null;
  if (!CR.G || CR.GL !== SGR.lines){ const t0 = performance.now(); CR.G = CRG.build(SGR.lines, {walls:cityKey() === 'sg' && SGR.base && Array.isArray(SGR.base.f1) ? SGR.base.f1 : null}); CR.GL = SGR.lines; CR.cache.clear(); CR.buildMs = Math.round(performance.now() - t0); }
  return CR.G;
}
function hubsOf(city){ return (CITY_HUBS[city] || []).map(h => { const q = sgXY(h[0], h[1]); return [q[0], q[1], h[2]*1000]; }); }
function curatedDef(seed, city){ if (typeof seed !== 'string') return null; const id = seed.replace(/^(sg|bay|nyc):/, ''); return (CURATED[city] || []).find(d => d.id === id) || null; }
// seed (number / string; a curated id like 'marina' or 'sg:marina') + {km 3-12, loop, city} -> route (cached per id)
function genRoute(seed, o){
  o = o || {}; const city = cityKey(); if (o.city && o.city !== city) return null;
  if (seed === undefined || seed === null || seed === '') seed = Math.floor(Math.random()*1e6);
  const def = curatedDef(seed, city), km = clamp(Math.round(+o.km || 6), 3, 12), loop = !!o.loop;
  const id = def ? city + ':' + def.id : `${city}:s${String(seed).replace(/[^\w.-]/g, '').slice(0, 24)}-${km}${loop ? 'L' : ''}`;
  if (CR.cache.has(id)) return CR.cache.get(id);
  const G = graph(); if (!G) return null;
  let r = null;
  if (def){ r = CRG.curated(G, def, sgXY); if (!r || r.err){ CR.lastErr = r && r.err; return null; } Object.assign(r, {name:[def.zh, def.en], sub:def.sub, loop:!!def.loop, curated:def.id}); }
  else { const segs = CRG.random(G, seed, {km, loop, hubs:hubsOf(city)}); if (!segs){ CR.lastErr = 'no route'; return null; }
    r = CRG.pack(G, CRG.assemble(G, segs), segs, {}); r.name = ['随机路线 #' + seed, 'Random #' + seed]; r.sub = r.roads.slice(0, 3).join(' · '); r.loop = loop; }
  // absolute heights in the browser (ground + height above ground)
  r.start.z = +(gndZ(r.start.x, r.start.y) + r.start.e).toFixed(2); for (const c of r.cps) c.z = +(gndZ(c.x, c.y) + c.e).toFixed(2);
  r.id = id; r.seed = def ? def.id : seed; r.city = city; r.opts = {km, loop}; r.km = +(r.lengthM/1000).toFixed(2);
  CR.cache.set(id, r); return r;
}
// the race's working copy of a route: samples every ~5 m (x, y, height above ground, surface z, tangent, class, one-way), checkpoints
// with their sample index, the speed profiles of the AI / autopilot
const RS = {N:0};
function prepRoute(route){
  const P = route.path, n = P.x.length, S = new Float64Array(n);
  for (let i = 1; i < n; i++) S[i] = S[i - 1] + Math.hypot(P.x[i] - P.x[i - 1], P.y[i] - P.y[i - 1]);
  const L = S[n - 1], N = Math.max(3, Math.ceil(L/5) + 1), st = L/(N - 1);
  const R = {N, st, L, x:new Float64Array(N), y:new Float64Array(N), e:new Float32Array(N), z:new Float32Array(N), zs:new Float32Array(N).fill(NaN), tx:new Float32Array(N), ty:new Float32Array(N),
    c:new Uint8Array(N), ow:new Uint8Array(N), hw:new Float32Array(N), kap:new Float32Array(N), cps:[], route};
  let j = 0;
  for (let k = 0; k < N; k++){ const s = Math.min(L, k*st); while (j < n - 2 && S[j + 1] < s) j++; const l = S[j + 1] - S[j] || 1, t = clamp((s - S[j])/l, 0, 1);
    R.x[k] = P.x[j] + (P.x[j + 1] - P.x[j])*t; R.y[k] = P.y[j] + (P.y[j + 1] - P.y[j])*t; R.e[k] = P.e[j] + (P.e[j + 1] - P.e[j])*t; const q = t < 0.5 ? j : j + 1; R.c[k] = P.c[q]; R.ow[k] = P.ow[q];
    R.z[k] = gndZ(R.x[k], R.y[k]) + R.e[k]; R.hw[k] = CRG.WID[Math.min(10, R.c[k])][R.ow[k] ? 1 : 0]/2; }
  for (let k = 0; k < N; k++){ const a = Math.max(0, k - 2), b = Math.min(N - 1, k + 2), dx = R.x[b] - R.x[a], dy = R.y[b] - R.y[a], l = Math.hypot(dx, dy) || 1; R.tx[k] = dx/l; R.ty[k] = dy/l; }
  // curvature over a 30 m window (junction corners of the polyline become ~15 m radius bends)
  for (let k = 0; k < N; k++){ const a = Math.max(0, k - 3), b = Math.min(N - 1, k + 3); const d = Math.abs(wrapA(Math.atan2(R.ty[b], R.tx[b]) - Math.atan2(R.ty[a], R.tx[a]))); R.kap[k] = b > a ? d/((b - a)*st) : 0; }
  route.cps.forEach((c, i) => { const k = clamp(Math.round(c.s/st), 0, N - 1); R.cps.push({i, k, s:c.s, x:c.x, y:c.y, z:c.z !== undefined ? c.z : gndZ(c.x, c.y) + (c.e || 0), w:c.w, tx:R.tx[k], ty:R.ty[k], kind:c.kind, last:i === route.cps.length - 1}); });
  return R;
}
// a speed profile: lateral grip a (m/s2), top speed vmax, braking b -> max speed per sample (look-ahead braking included)
function profile(R, a, vmax, b){
  const v = new Float32Array(R.N);
  for (let k = 0; k < R.N; k++) v[k] = Math.min(vmax, Math.sqrt(a/Math.max(R.kap[k], 1e-4)));
  for (let k = R.N - 2; k >= 0; k--) v[k] = Math.min(v[k], Math.sqrt(v[k + 1]*v[k + 1] + 2*b*R.st));
  return v;
}
// the lateral offset of the driving lane at sample k (+ = left of the route direction): the kerb-side half on two-way roads
function laneLat(R, k, col){
  const hw = R.hw[k], side = SIDE();
  if (R.ow[k]){ const span = Math.max(0, hw - 2.2); return col === undefined ? side*Math.min(1.8, span) : clamp(side*1.9*(col ? -1 : 1), -span, span); }
  const half = hw, cen = half/2; if (col === undefined || half < 6) return side*cen; return side*(cen + (col ? -1.4 : 1.4)*Math.min(1, (half - 4)/4));
}
// where along the route is (x, y, z): the nearest sample near the hint (or anywhere when lost) -> {k, s, lat, d}
const LOC = {k:0, s:0, lat:0, d:0};
function locate(R, x, y, z, hint, wide){
  const a = wide ? 0 : Math.max(0, hint - 40), b = wide ? R.N - 1 : Math.min(R.N - 1, hint + 120); let bk = a, bd = 1e18;
  for (let k = a; k <= b; k++){ const dx = R.x[k] - x, dy = R.y[k] - y, dz = R.z[k] - z, d = dx*dx + dy*dy + (Math.abs(dz) > 6 ? 1e6 : 0); if (d < bd){ bd = d; bk = k; } }
  const k = bk, dx = x - R.x[k], dy = y - R.y[k], along = dx*R.tx[k] + dy*R.ty[k];
  LOC.k = k; LOC.s = clamp(k*R.st + along, 0, R.L); LOC.lat = -dx*R.ty[k] + dy*R.tx[k]; LOC.d = Math.sqrt(Math.min(bd, dx*dx + dy*dy)); return LOC;
}
// the point at route distance s (+ lateral offset) -> out {x, y, z, tx, ty, k}
function along(R, s, lat, out){
  out = out || {}; const f = clamp(s/R.st, 0, R.N - 1), k = Math.min(R.N - 2, Math.floor(f)), t = f - k;
  const tx = R.tx[k] + (R.tx[k + 1] - R.tx[k])*t, ty = R.ty[k] + (R.ty[k + 1] - R.ty[k])*t, l = Math.hypot(tx, ty) || 1;
  out.tx = tx/l; out.ty = ty/l; out.k = k; out.x = R.x[k] + (R.x[k + 1] - R.x[k])*t - out.ty*(lat || 0); out.y = R.y[k] + (R.y[k + 1] - R.y[k])*t + out.tx*(lat || 0);
  out.z = R.z[k] + (R.z[k + 1] - R.z[k])*t;
  if (s < 0){ out.x = R.x[0] + R.tx[0]*s - R.ty[0]*(lat || 0); out.y = R.y[0] + R.ty[0]*s + R.tx[0]*(lat || 0); out.z = gndZ(out.x, out.y) + R.e[0]; out.tx = R.tx[0]; out.ty = R.ty[0]; out.k = 0; }
  else if (s > R.L){ const n = R.N - 1, d = s - R.L; out.x = R.x[n] + R.tx[n]*d - R.ty[n]*(lat || 0); out.y = R.y[n] + R.ty[n]*d + R.tx[n]*(lat || 0); out.z = gndZ(out.x, out.y) + R.e[n]; out.tx = R.tx[n]; out.ty = R.ty[n]; out.k = n; }
  return out;
}
// the drawn road surface near the car (the roads module's index; ground + height as a fallback), cached per sample
function surfZ(R, k){
  let z = R.zs[k]; if (z === z) return z;
  // only where the roads module already has the tile's surface index (no index builds from here: they take a while)
  try { if (typeof SGRoads !== 'undefined' && SGRoads.surfaceAt && (!SGRoads.surfaceReady || SGRoads.surfaceReady(R.x[k], R.y[k]))){ const r = SGRoads.surfaceAt(R.x[k], R.y[k], R.z[k]); if (r && Math.abs(r.z - R.z[k]) < 3){ R.zs[k] = r.z; return r.z; } } } catch (e){ /* */ }
  return R.z[k];
}
// best times (per route id, per browser): {t, splits:[], ghost:'base64 Float32 [t, x, y, z, psi]...', date}
const STORE = 'cb_cityrace_best:';
function bestGet(id){ try { const s = localStorage.getItem(STORE + id); return s ? JSON.parse(s) : null; } catch (e){ return null; } }
function bestPut(id, rec){
  try { localStorage.setItem(STORE + id, JSON.stringify(rec)); }
  catch (e){ try { delete rec.ghost; localStorage.setItem(STORE + id, JSON.stringify(rec)); } catch (e2){ /* storage blocked */ } }
}
function f32ToB64(a){ const u = new Uint8Array(a.buffer, a.byteOffset, a.byteLength); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
function b64ToF32(s){ try { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new Float32Array(u.buffer); } catch (e){ return null; } }
const fmtT = t => { if (!(t >= 0)) return '–'; const m = Math.floor(t/60), s = t - m*60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2); };
const fmtD = d => (d < 0 ? '−' : '+') + Math.abs(d).toFixed(2);
// ---------------------------------------------------------------- the race: countdown, checkpoints, timing, wrong way, respawn, finish
const RACE = {state:'off', route:null, R:null, o:null, t:0, clk:0, goAt:0, cp:0, splits:[], best:null, k:0, s:0, lat:0, d:0, wrong:false, wrongT:0, missT:0, missCp:-1, offT:0,
  px:0, py:0, pz:0, rec:null, recN:0, recT:0, ghost:null, prof:null, ap:null, trafficWas:null, lastLight:-1, msgT:0, finAt:0, result:null, frame:0, held:false};
const AIs = [];
function veh(){ const S = DRV(); return S && S.F1 && S.F1.veh === 'car' ? 'car' : 'f1'; }
// performance envelope of the player's vehicle (for the AI racers and the test autopilot)
function perf(){ return veh() === 'f1' ? {a:21, vmax:82, acc:11, brk:26} : {a:7.2, vmax:52, acc:4.2, brk:8.5}; }
function startRace(route, o){
  o = Object.assign({at:null, solo:true, traffic:true, ai:3, ghost:true}, o || {});
  if (route && !route.path && route.seed !== undefined) route = genRoute(route.seed, route.opts || {});
  if (!route || !route.path || !route.cps || !route.cps.length){ msg('没有可用的路线 · No route', 2, 'warn'); return false; }
  const S = DRV(); if (!S || !S.enter){ msg('需要驾驶模块 · The drive module is missing', 2, 'warn'); return false; }
  if (RACE.state !== 'off') stopRace('restart');
  // the vehicle: free drive (Singapore: the F1 car) or the road car (US maps: the car picked in the tray)
  try { if (window.SGFly && window.SGFly.on) window.SGFly.exit(); } catch (e){ /* */ }
  if (!drvOn() || (S.F1 && S.F1.mode !== 'free')){ if (drvOn()) S.exit(); const ok = isUS() ? S.enter('car', o.car ? {car:o.car} : {}) : S.enter('free'); if (!ok && !drvOn()) return false; }
  hudBuild(); fxInit();
  const R = prepRoute(route), P = perf();
  Object.assign(RACE, {state:'count', freeze:null, route, R, o, t:0, clk:0, cp:0, splits:[], k:0, s:0, lat:0, wrong:false, wrongT:0, missT:0, missCp:-1, offT:0, lastLight:-1, finAt:0, result:null, held:true,
    goAt:o.at != null ? +o.at : performance.now() + 5200, prof:profile(R, P.a*0.8, P.vmax, P.brk*0.7), rec:new Float32Array(5*4096), recN:0, recT:0});
  RACE.best = bestGet(route.id); RACE.ghost = o.ghost && RACE.best && RACE.best.ghost ? b64ToF32(RACE.best.ghost) : null;
  // the start grid: the player on pole, in the kerb-side lane
  placeOnRoute(0, laneLat(R, 0, 0));
  try { if (S.crash && S.crash.repair) S.crash.repair(); } catch (e){ /* */ }   // a fresh car for a fresh race
  // held on the grid: a firm pedal below the drive module's reverse threshold (> 0.5 at a standstill selects reverse)
  try { S.hold({thr:0, brk:0.45, steer:0, hb:0}); } catch (e){ /* */ }
  // traffic: on by default (a street race), off on request
  try { const T = window.SGTraffic; if (T && 'suspend' in T){ RACE.trafficWas = !!T.suspend; T.suspend = !o.traffic; } } catch (e){ /* */ }
  aiSetup(o.solo ? (o.ai | 0) : 0);
  fxRoute(); hudRace(true);
  msg(`${route.name[0]} · ${route.name[1]}`, 2.6);
  return true;
}
function stopRace(why){
  if (RACE.state === 'off') return;
  const S = DRV(); if (RACE.held && S && S.hold) try { S.hold(null); } catch (e){ /* */ }
  RACE.held = false; RACE.state = 'off';
  try { const T = window.SGTraffic; if (T && 'suspend' in T && RACE.trafficWas !== null){ T.suspend = RACE.trafficWas; RACE.trafficWas = null; } } catch (e){ /* */ }
  aiClear(); fxHide(); hudRace(false); if (why !== 'keep') resHide();
}
// put the player's vehicle on the route at distance s, lateral lat, facing along it, standing
function placeOnRoute(s, lat){
  const R = RACE.R, S = DRV(); if (!R || !S) return false; const p = along(R, s, lat), psi = Math.atan2(p.ty, p.tx), ll = llOf(p.x, p.y);
  let ok = false; try { ok = !!S.tp(ll[0], ll[1], 90 - psi*180/PI, p.z); } catch (e){ ok = false; }
  const C = S.CAR; if (C){ C.x = p.x; C.y = p.y; C.psi = psi; C.u = C.v = C.r = 0; C.delta = 0; if (!ok) C.z = C.zs = C.zv = p.z; }
  RACE.px = p.x; RACE.py = p.y; RACE.pz = C ? C.z : p.z; RACE.k = p.k; RACE.s = Math.max(0, s);
  return true;
}
// R / the reset button: back to the last checkpoint passed (or the start), standing, facing along the route
function respawn(){
  if (RACE.state !== 'run') return false; const R = RACE.R, last = RACE.cp > 0 ? R.cps[RACE.cp - 1] : null, s = last ? last.s : 0, k = last ? last.k : 0;
  try { const S = DRV(); if (S.crash && S.crash.repair) S.crash.repair(); } catch (e){ /* */ }
  placeOnRoute(s, laneLat(R, k)); RACE.wrong = false; RACE.wrongT = 0; RACE.missT = 0;
  msg(last ? `回到检查点 ${RACE.cp} · Back to checkpoint ${RACE.cp}` : '回到起点 · Back to the start', 1.6);
  return true;
}
function go(){
  RACE.state = 'run'; RACE.t = RACE.clk = Math.max(0, (performance.now() - RACE.goAt)/1000);
  const S = DRV(); if (RACE.held && S && S.hold) try { S.hold(null); } catch (e){ /* */ } RACE.held = false;
  lightsShow(-1); msg('出发！ GO!', 1.2, 'go');
}
// one frame of the race (dt = game seconds; the test autopilot calls it with its own steps)
function raceTick(dt){
  if (RACE.state === 'off') return;
  const S = DRV(); if (!S || !drvOn() || !S.CAR){ stopRace('exit'); return; }
  RACE.frame++;
  const R = RACE.R, C = S.CAR;
  if (RACE.state === 'count'){
    if (RACE.freeze != null) RACE.goAt = performance.now() + RACE.freeze*1000;   // tests: hold the countdown at a given moment
    const left = (RACE.goAt - performance.now())/1000; lightsShow(left);
    if (left <= 0) go();
    else { aiTick(dt, false); fxTick(dt); hudTick(); return; }
  }
  // solo: game time (follows the physics, also in the test autopilot's steps); multiplayer: wall clock from the shared GO moment
  if (RACE.state === 'run') RACE.t = RACE.o.solo ? RACE.t + dt : Math.max(0, (performance.now() - RACE.goAt)/1000);
  RACE.clk = RACE.o.solo ? RACE.clk + dt : Math.max(0, (performance.now() - RACE.goAt)/1000);   // the race clock keeps running after the player's finish (the AI finishing times)
  // progress along the route
  const L = locate(R, C.x, C.y, C.z, RACE.k, RACE.offT > 2 && RACE.frame % 30 === 0);
  if (L.d < 60 || RACE.offT > 2){ RACE.k = L.k; RACE.s = L.s; RACE.lat = L.lat; }
  RACE.d = L.d; RACE.offT = L.d > 60 ? RACE.offT + dt : 0;
  if (RACE.state === 'run'){
    // the next checkpoint: crossed forward within the gate width (and near its height)
    const cp = R.cps[RACE.cp];
    if (cp){ const a0 = (RACE.px - cp.x)*cp.tx + (RACE.py - cp.y)*cp.ty, a1 = (C.x - cp.x)*cp.tx + (C.y - cp.y)*cp.ty;
      if (a0 < 0 && a1 >= 0){ const t = -a0/((a1 - a0) || 1), cx = RACE.px + (C.x - RACE.px)*t, cy = RACE.py + (C.y - RACE.py)*t, lat = Math.abs(-(cx - cp.x)*cp.ty + (cy - cp.y)*cp.tx);
        if (lat <= cp.w/2 + 1.5 && Math.abs(C.z - cp.z) < 7) cpPass(cp);
        else if (lat < cp.w/2 + 30 && Math.abs(C.z - cp.z) < 9){ msg(`错过检查点 ${cp.i + 1} · Missed checkpoint — 回头或按 R · go back or press R`, 2.4, 'warn'); RACE.missCp = cp.i; } }
      // driven well past it without passing: a reminder
      if (RACE.cp < R.cps.length && RACE.s > cp.s + 70 && L.d < 40){ RACE.missT += dt; if (RACE.missT > 1.5 && RACE.missCp !== cp.i){ RACE.missCp = cp.i; msg(`错过检查点 ${cp.i + 1} · Missed checkpoint — 按 R 回去 · press R`, 2.6, 'warn'); } } else RACE.missT = 0; }
    // wrong way: moving against the route for a second
    const vx = Math.cos(C.psi)*C.u, vy = Math.sin(C.psi)*C.u, sp = Math.hypot(vx, vy), dot = sp > 0.1 ? (vx*R.tx[RACE.k] + vy*R.ty[RACE.k])/sp : 0;
    if (sp > 3 && dot < -0.35 && L.d < 40) RACE.wrongT += dt; else if (dot > 0.2 || sp < 1) RACE.wrongT = Math.max(0, RACE.wrongT - dt*2);
    RACE.wrong = RACE.wrongT > 1.0;
    // the ghost recording (10 Hz)
    if (RACE.t - RACE.recT >= 0.1 && RACE.recN < RACE.rec.length/5){ const q = RACE.recN*5; RACE.rec[q] = RACE.t; RACE.rec[q + 1] = C.x; RACE.rec[q + 2] = C.y; RACE.rec[q + 3] = C.z; RACE.rec[q + 4] = C.psi; RACE.recN++; RACE.recT = RACE.t; }
  }
  RACE.px = C.x; RACE.py = C.y; RACE.pz = C.z;
  aiTick(dt, RACE.state !== 'count'); fxTick(dt); hudTick();
}
function cpPass(cp){
  const t = RACE.t; RACE.splits.push(+t.toFixed(3)); RACE.cp = cp.i + 1; RACE.missT = 0;
  const b = RACE.best && RACE.best.splits ? RACE.best.splits[cp.i] : undefined, dl = typeof b === 'number' ? t - b : null;
  if (cp.last){ finish(); return; }
  msg(`检查点 ${RACE.cp}/${RACE.R.cps.length} · ${fmtT(t)}` + (dl !== null ? `  ${fmtD(dl)}` : ''), 1.5, dl === null ? '' : dl < 0 ? 'go' : 'warn');
  hudSplit(dl);
  fxRoute();
}
function finish(){
  const t = +RACE.t.toFixed(3), route = RACE.route, old = RACE.best, nb = !old || !(old.t > 0) || t < old.t;
  RACE.state = 'done'; RACE.finAt = performance.now();
  if (nb){ const g = RACE.rec.slice(0, RACE.recN*5); bestPut(route.id, {t, splits:RACE.splits.slice(), date:Date.now(), ghost:f32ToB64(g), name:route.name}); }
  const pos = rankList().findIndex(e => e.me) + 1;
  RACE.result = {id:route.id, t, splits:RACE.splits.slice(), best:nb ? t : old.t, newBest:nb, prevBest:old ? old.t : null, pos, n:rankList().length};
  msg(nb ? `完赛 ${fmtT(t)} · 新纪录 NEW BEST` : `完赛 Finished ${fmtT(t)}`, 3, nb ? 'purple' : 'go');
  fxRoute(); if (RACE.o.solo) resShow(); uiBest();   // multiplayer: the net client shows the results (the HUD keeps the time)
  for (const cb of CR.fin.slice()) try { cb(Object.assign({}, RACE.result)); } catch (e){ console.error(e); }
}
// the ranking: me + the AI racers + the opponents set from outside (finished first by time, then checkpoints, then distance to the next)
function progressOf(){ const R = RACE.R; if (!R) return null; const cp = R.cps[RACE.cp];
  return {cp:RACE.cp, ncp:R.cps.length, dist:RACE.state === 'done' ? 0 : Math.max(0, Math.round(cp ? (RACE.d < 60 ? cp.s - RACE.s : Math.hypot(cp.x - RACE.px, cp.y - RACE.py)) : 0)), t:+RACE.t.toFixed(3),
    finished:RACE.state === 'done', wrong:RACE.wrong, state:RACE.state, s:Math.round(RACE.s), x:+RACE.px.toFixed(1), y:+RACE.py.toFixed(1), z:+RACE.pz.toFixed(1), psi:DRV() && DRV().CAR ? +DRV().CAR.psi.toFixed(3) : 0}; }
function rankList(){
  const P = progressOf(); if (!P) return []; const L = [{id:'me', name:['你', 'You'], me:true, cp:P.cp, dist:P.dist, t:P.t, finished:P.finished, col:'#ff3b30'}];
  for (const a of AIs) L.push({id:a.id, name:a.name, ai:true, cp:a.cp, dist:a.dist, t:a.fin ? a.fin : RACE.clk, finished:!!a.fin, col:a.css});
  for (const o of CR.opp) L.push({id:o.id, name:Array.isArray(o.name) ? o.name : [String(o.name || o.id), String(o.name || o.id)], cp:o.cp | 0, dist:+o.dist || 0, t:+o.t || 0, finished:!!o.finished, col:o.color || '#8fc7ff', x:o.x, y:o.y});
  return L.sort((a, b) => (b.finished - a.finished) || (a.finished ? a.t - b.t : 0) || (b.cp - a.cp) || (a.dist - b.dist));
}
// ---------------------------------------------------------------- AI racers (solo): path followers on the route with a grip / braking
// profile, a skill factor, lanes, slowing for the player and the traffic ahead (not solid: they never ram anybody)
const AI_NAMES = [['阿凯', 'Kai'], ['美玲', 'Mei'], ['拉维', 'Ravi'], ['苏菲', 'Sofia'], ['马特', 'Matt']];
const AI_COLS = [[0.82, 0.1, 0.08], [0.1, 0.32, 0.86], [0.96, 0.62, 0.06], [0.08, 0.6, 0.3], [0.56, 0.2, 0.78]];
const AI_KEYS = ['sedan', 'suv', 'hatch', 'sedan', 'mpv'];
const OBQ = [], _ap = {}, _aq = {};
function aiClear(){ for (const a of AIs) fxCarFree(a.mesh); AIs.length = 0; }
function aiSetup(n){
  aiClear(); const R = RACE.R; if (!R || !n) return; const P = perf(); RACE.aiProf = profile(R, P.a*0.92, P.vmax*0.96, P.brk*0.8);
  const two = R.ow[0] ? R.hw[0] >= 5 : R.hw[0] >= 6;
  for (let i = 0; i < Math.min(5, n); i++){ const slot = i + 1, row = two ? slot >> 1 : slot, col = two ? slot & 1 : 0;
    const a = {id:'ai' + i, name:AI_NAMES[i], col, row, s:-(row*9 + (col ? 4.5 : 0)), lat:0, v:0, skill:0.8 + 0.035*(n - 1 - i) + 0.02*((i*7) % 3), cp:0, dist:0, fin:0, k:0, css:'#' + AI_COLS[i].map(v => Math.round(v*255).toString(16).padStart(2, '0')).join(''),
      mesh:fxCarMesh(AI_KEYS[i], AI_COLS[i], false), brake:0, laneT:0, yaw:0, z:0};
    a.lat = laneLat(R, 0, col); AIs.push(a); }
  aiTick(0, false);
}
function aiTick(dt, moving){
  const R = RACE.R; if (!R || !AIs.length) return; const S = DRV(), C = S && S.CAR, P = perf(), prof = RACE.aiProf, L = R.L;
  const pv = C ? C.u : 0, frame = RACE.frame;
  for (let i = 0; i < AIs.length; i++){ const a = AIs[i];
    if (moving && dt > 0){
      const kk = clamp(Math.round((a.s + a.v*0.8)/R.st), 0, R.N - 1); let vt = a.fin ? Math.max(0, a.v - 4*dt) : prof[kk]*a.skill;
      // early in the race the AI build up speed a little slower (no wheelspin start)
      const ahead = (s2, lat2, v2) => { const ds = s2 - a.s; if (ds > 2 && ds < 16 + a.v*0.9 && Math.abs(lat2 - a.lat) < 2.3){ vt = Math.min(vt, Math.max(0, v2) + Math.max(0, ds - 7)*0.6); return true; } return false; };
      let blocked = false;
      if (C && RACE.d < 30) blocked = ahead(RACE.s, RACE.lat, pv) || blocked;
      for (const b of AIs) if (b !== a) blocked = ahead(b.s, b.lat, b.v) || blocked;
      // the traffic near the AI (every 4th frame per car): their position along the route by projection
      if (!a.fin && (frame + i) % 4 === 0){ let ov2; const T = window.SGTraffic;
        if (T && T.obstacles && !T.suspend){ along(R, a.s, a.lat, _ap); const L2 = T.obstacles(_ap.x, _ap.y, 30 + a.v, OBQ);
          for (const o of L2){ const dx = o.x - _ap.x, dy = o.y - _ap.y, ds = dx*_ap.tx + dy*_ap.ty, rl = -dx*_ap.ty + dy*_ap.tx; if (Math.abs((o.z || 0) - _ap.z) > 4) continue;
            const ov = (o.vx || 0)*_ap.tx + (o.vy || 0)*_ap.ty; if (ds > 1 && ds < 14 + a.v*1.1 && Math.abs(rl) < 2.4){ const lim = Math.max(0, ov) + Math.max(0, ds - 8)*0.55; ov2 = ov2 === undefined ? lim : Math.min(ov2, lim); } } }
        a.obsV = ov2; }
      if (a.obsV !== undefined){ vt = Math.min(vt, a.obsV); blocked = true; }
      // pull out to pass on a wide road when blocked for a moment
      const k = clamp(Math.round(a.s/R.st), 0, R.N - 1); a.laneT = blocked ? a.laneT + dt : Math.max(0, a.laneT - dt*0.5);
      if (a.laneT > 1.2 && !a.fin){ a.col ^= 1; a.laneT = 0; }
      const latT = a.fin ? SIDE()*Math.max(0, R.hw[k] - 1.4) : laneLat(R, k, a.col), dlat = clamp(latT - a.lat, -2.2*dt, 2.2*dt); a.lat += dlat;
      const acc = vt > a.v ? Math.min(P.acc*(a.v < 12 ? 1 : 0.75), (vt - a.v)/dt) : Math.max(-P.brk, (vt - a.v)/dt);
      a.brake = acc < -1.5 ? 1 : 0; a.v = Math.max(0, a.v + acc*dt); a.s = Math.min(L + 30, a.s + a.v*dt); a.yaw = clamp(dlat/Math.max(0.5, a.v*dt), -0.25, 0.25)*0.6;
      if (!a.fin && a.s >= L){ a.fin = RACE.clk; }
    }
    // progress for the ranking
    let c = 0; while (c < R.cps.length && R.cps[c].s <= a.s) c++; a.cp = c; a.dist = a.fin ? 0 : Math.max(0, Math.round((R.cps[c] ? R.cps[c].s : L) - a.s));
    // pose
    const p = along(R, a.s, a.lat, _aq); a.k = p.k; let z = p.z;
    if (a.s >= 0 && p.k < R.N - 1){ const zs = surfZ(R, p.k); if (Math.abs(zs - p.z) < 3) z = zs; }
    a.z = a.z && Math.abs(a.z - z) < 4 ? a.z + (z - a.z)*Math.min(1, dt*10 || 1) : z;
    const k2 = Math.min(R.N - 1, p.k + 2), pitch = Math.atan2(R.z[k2] - R.z[Math.max(0, p.k - 1)], R.st*(k2 - Math.max(0, p.k - 1)) || 1);
    fxCarPose(a.mesh, p.x, p.y, a.z, Math.atan2(p.ty, p.tx) + a.yaw, pitch, a.brake, a.v);
  }
}
// ---------------------------------------------------------------- 3D: checkpoint gates (glowing arches at the road width, the next one
// bright and pulsing, the one after dim, the finish chequered), a floating arrow towards the next gate, chevrons on the road ahead,
// the AI racers' and the ghost's cars. Pooled: 3 gates, 1 arrow, 1 instanced chevron strip, <= 6 cars.
const FX = {grp:null, gates:[], arrow:null, chev:null, ghost:null, ghostKey:null, t:0, cars:[], geoF1:null, mats:{}};
const COL = {next:new THREE.Color(0x35f2ff), after:new THREE.Color(0x4d7dff), fin:new THREE.Color(0xffd23f), arrow:new THREE.Color(0xffc21a), wrong:new THREE.Color(0xff3b30)};
const NCHEV = 14;
const _m4 = new THREE.Matrix4(), _q4 = new THREE.Quaternion(), _e4 = new THREE.Euler(), _p4 = new THREE.Vector3(), _s4 = new THREE.Vector3(1, 1, 1), _gp = {};
function fxInit(){
  if (FX.grp) return; FX.grp = new THREE.Group(); FX.grp.name = 'cityrace'; FX.grp.visible = false; scene.add(FX.grp);
  for (let i = 0; i < 4; i++){ const g = {grp:new THREE.Group(), cp:-1, kind:'', geo:[], tube:null, glow:null, line:null, label:null, flag:null, flare:null};
    g.mTube = new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.95, depthWrite:true});
    g.mGlow = new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.22, depthWrite:false, blending:THREE.AdditiveBlending});
    g.mLine = new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.55, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2, side:THREE.DoubleSide});
    g.mFlare = new THREE.PointsMaterial({map:lampTex, size:7, sizeAttenuation:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, color:0xffffff});
    g.cv = document.createElement('canvas'); g.cv.width = 256; g.cv.height = 96; g.tex = new THREE.CanvasTexture(g.cv);
    g.mLabel = new THREE.SpriteMaterial({map:g.tex, transparent:true, depthWrite:false}); g.label = new THREE.Sprite(g.mLabel); g.grp.add(g.label);
    g.grp.visible = false; FX.grp.add(g.grp); FX.gates.push(g); }
  // the arrow: a chevron arrowhead with a short shaft, lying almost flat, pointing along +x
  const sh = new THREE.Shape(); sh.moveTo(1.3, 0); sh.lineTo(0.1, 1.05); sh.lineTo(0.1, 0.42); sh.lineTo(-1.1, 0.42); sh.lineTo(-1.1, -0.42); sh.lineTo(0.1, -0.42); sh.lineTo(0.1, -1.05); sh.closePath();
  const ag = new THREE.ExtrudeGeometry(sh, {depth:0.22, bevelEnabled:false}); ag.rotateX(-PI/2); ag.translate(0, -0.11, 0);
  FX.arrow = new THREE.Group(); FX.arrowM = new THREE.Mesh(ag, new THREE.MeshBasicMaterial({color:COL.arrow, transparent:true, opacity:0.92}));
  const ol = new THREE.Mesh(ag, new THREE.MeshBasicMaterial({color:0x1a1206, side:THREE.BackSide})); ol.scale.set(1.08, 1.3, 1.12); FX.arrowM.add(ol);
  FX.arrow.add(FX.arrowM); FX.grp.add(FX.arrow);
  // chevrons on the road (flat, instanced)
  const cs = new THREE.Shape(); cs.moveTo(0.55, 0); cs.lineTo(-0.35, 1.25); cs.lineTo(-0.95, 1.25); cs.lineTo(-0.05, 0); cs.lineTo(-0.95, -1.25); cs.lineTo(-0.35, -1.25); cs.closePath();
  const cg = new THREE.ShapeGeometry(cs); cg.rotateX(-PI/2);
  FX.chev = new THREE.InstancedMesh(cg, new THREE.MeshBasicMaterial({color:COL.next, transparent:true, opacity:0.6, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-3, polygonOffsetUnits:-3, side:THREE.DoubleSide}), NCHEV);
  FX.chev.instanceMatrix.setUsage(THREE.DynamicDrawUsage); FX.chev.frustumCulled = false; FX.grp.add(FX.chev);
}
function fxHide(){ if (FX.grp) FX.grp.visible = false; for (const g of FX.gates){ g.grp.visible = false; g.cp = -1; g.grp.userData.on = true; } if (FX.ghost) FX.ghost.visible = false; }
const disp = o => { if (o){ if (o.parent) o.parent.remove(o); if (o.geometry) o.geometry.dispose(); } };
// a gate at checkpoint cp: an arch over the road width (rounded posts and beam), a glow tube, a line on the road, flares, the label
function gateBuild(g, cp, n){
  for (const o of [g.tube, g.glow, g.line, g.flag, g.flare]) disp(o); if (g.flagTex){ g.flagTex.dispose(); g.flagTex = null; }
  const hw = cp.w/2 + 0.6, H = clamp(cp.w*0.42 + 3.2, 5.5, 9.5), pts = [];
  for (let i = 0; i <= 40; i++){ const t = i/40*PI, c = Math.cos(t), s = Math.sin(t); pts.push(new THREE.Vector3(-hw*Math.sign(c)*Math.pow(Math.abs(c), 0.28), H*Math.pow(s, 0.28) - 0.4, 0)); }
  const cur = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  g.tube = new THREE.Mesh(new THREE.TubeGeometry(cur, 72, 0.26, 8, false), g.mTube); g.glow = new THREE.Mesh(new THREE.TubeGeometry(cur, 48, 0.75, 8, false), g.mGlow);
  g.line = new THREE.Mesh(new THREE.PlaneGeometry(cp.w + 1, 1.1).rotateX(-PI/2), g.mLine); g.line.position.y = 0.12;
  const fp = new THREE.BufferGeometry(); fp.setAttribute('position', new THREE.Float32BufferAttribute([-hw, 0.8, 0, hw, 0.8, 0, -hw*0.55, H - 0.2, 0, hw*0.55, H - 0.2, 0], 3)); g.flare = new THREE.Points(fp, g.mFlare);
  g.grp.add(g.tube, g.glow, g.line, g.flare);
  if (cp.last || cp.start){ const c = document.createElement('canvas'); c.width = 256; c.height = 32; const x = c.getContext('2d'); for (let i = 0; i < 32; i++) for (let j = 0; j < 4; j++){ x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(i*8, j*8, 8, 8); }
    g.flagTex = new THREE.CanvasTexture(c); g.flag = new THREE.Mesh(new THREE.PlaneGeometry(hw*1.7, 1.2), new THREE.MeshBasicMaterial({map:g.flagTex, side:THREE.DoubleSide, transparent:true, opacity:0.95})); g.flag.position.y = H - 1.25; g.grp.add(g.flag); }
  // the label: number / FINISH
  const x = g.cv.getContext('2d'); x.clearRect(0, 0, 256, 96); x.font = '700 50px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 8; x.strokeStyle = 'rgba(0,0,0,.65)'; x.fillStyle = '#fff';
  const tx = cp.start ? (window.SGLang && SGLang.sel ? SGLang.sel('起点 START', '起点', 'START') : '起点 START') : cp.last ? (window.SGLang && SGLang.sel ? SGLang.sel('终点 FINISH', '终点', 'FINISH') : '终点 FINISH') : `${cp.i + 1} / ${n}`;   // [lm31/i18n] if (cp.last || cp.start) x.font = '700 42px system-ui, sans-serif'; x.strokeText(tx, 128, 50); x.fillText(tx, 128, 50); g.tex.needsUpdate = true;
  g.label.position.set(0, H + 1.7, 0); g.label.scale.set(6.4, 2.4, 1);
  // pose: across the road at the checkpoint (local x = the road's left-right axis)
  g.grp.position.set(cp.x, cp.z, -cp.y); g.grp.rotation.set(0, Math.atan2(cp.tx, -cp.ty), 0); g.cp = cp.i; g.H = H;
}
// which gates are up: the next checkpoint (bright), the one after (dim), the finish once it is the next or the one after
function fxRoute(){
  const R = RACE.R; if (!R || !FX.grp) return; FX.grp.visible = true; const n = R.cps.length, want = [], G3 = FX.gates.slice(0, 3);
  if (RACE.state !== 'done'){ for (let i = RACE.cp; i < Math.min(n, RACE.cp + 2); i++) want.push(i); }
  for (const g of G3) if (!want.includes(g.cp)){ g.grp.visible = false; g.cp = -1; }
  for (const i of want){ if (G3.some(g => g.cp === i)) continue; const g = G3.find(q => q.cp < 0); if (g){ gateBuild(g, R.cps[i], n); g.grp.visible = true; } }
  // the start line (shown until the car is 120 m into the race; a loop's finish gate appears there near the end)
  const st = FX.gates[3];
  if (st.cp !== -2){ gateBuild(st, {i:-2, start:true, x:R.x[0], y:R.y[0], z:R.z[0], w:R.hw[0]*2 + 4, tx:R.tx[0], ty:R.ty[0]}, n); st.cp = -2; }
  st.grp.visible = RACE.state !== 'done' && RACE.s < 120;
}
// cars: the AI racers (Singapore: simple open-wheel racers; the US maps: the traffic module's car models) and the ghost
function f1Geo(){
  if (FX.geoF1) return FX.geoF1; const pos = [], nor = [], col = [];
  const box = (x0, x1, y0, y1, z0, z1, c) => { const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1)/2, (y0 + y1)/2, (z0 + z1)/2).toNonIndexed(); const p = g.attributes.position.array, q = g.attributes.normal.array; for (let i = 0; i < p.length; i++){ pos.push(p[i]); nor.push(q[i]); } for (let i = 0; i < p.length/3; i++) col.push(c, c, c); g.dispose(); };
  const cyl = (x, z, r, w, c) => { const g = new THREE.CylinderGeometry(r, r, w, 14).rotateX(PI/2).translate(x, r, z).toNonIndexed(); const p = g.attributes.position.array, q = g.attributes.normal.array; for (let i = 0; i < p.length; i++){ pos.push(p[i]); nor.push(q[i]); } for (let i = 0; i < p.length/3; i++) col.push(c, c, c); g.dispose(); };
  const W = 1, K = 0.07, D = 0.25;
  box(-2.1, 1.0, 0.12, 0.62, -0.42, 0.42, W); box(1.0, 2.6, 0.16, 0.42, -0.22, 0.22, W); box(-1.2, 0.5, 0.12, 0.55, -0.95, -0.42, W); box(-1.2, 0.5, 0.12, 0.55, 0.42, 0.95, W);
  box(-2.3, -0.9, 0.55, 0.95, -0.25, 0.25, W); box(2.35, 2.85, 0.06, 0.16, -0.98, 0.98, D); box(-2.75, -2.35, 0.75, 0.95, -0.72, 0.72, D); box(-2.6, -2.45, 0.3, 0.8, -0.08, 0.08, K);
  box(-0.55, -0.1, 0.62, 0.92, -0.17, 0.17, 0.95); box(-0.2, 0.55, 0.62, 0.72, -0.35, 0.35, K); box(-2.1, 1.2, 0.04, 0.12, -0.75, 0.75, K);
  for (const [x, z] of [[1.66, -0.8], [1.66, 0.8], [-1.94, -0.78], [-1.94, 0.78]]) cyl(x, z, 0.36, z < 0 ? 0.38 : 0.38, K);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return FX.geoF1 = g;
}
function fxCarMesh(key, rgb, ghost){
  fxInit(); let m;
  if (veh() === 'f1' || !(window.SGTraffic && window.SGTraffic.model)){
    m = new THREE.Mesh(f1Geo(), ghost ? new THREE.MeshBasicMaterial({color:0x7fe0ff, transparent:true, opacity:0.32, depthWrite:false}) : new THREE.MeshStandardMaterial({color:new THREE.Color(rgb[0], rgb[1], rgb[2]), vertexColors:true, roughness:0.45, metalness:0.25}));
    m.matrixAutoUpdate = false; m.castShadow = !ghost;
  } else {
    const M = window.SGTraffic.model(key); let mat = M.mat;
    if (ghost){ mat = new THREE.MeshBasicMaterial({color:0x7fe0ff, transparent:true, opacity:0.3, depthWrite:false}); }
    else { const ic = new THREE.InstancedBufferAttribute(new Float32Array([rgb[0], rgb[1], rgb[2], 0]), 4); ic.setUsage(THREE.DynamicDrawUsage); M.geo.setAttribute('iCol', ic); }
    m = new THREE.InstancedMesh(M.geo, mat, 1); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.castShadow = !ghost; m.userData.inst = true; m.userData.rgb = rgb;
  }
  m.userData.ghost = ghost; m.visible = false; FX.grp.add(m); return m;
}
function fxCarFree(m){ if (!m) return; if (m.parent) m.parent.remove(m); if (m.geometry !== FX.geoF1) m.geometry.dispose(); if (m.material && (m.userData.ghost || !m.userData.inst)) m.material.dispose(); }
function fxCarPose(m, x, y, z, psi, pitch, brake, v){
  if (!m) return; _e4.set(0, psi, pitch || 0, 'YZX'); _q4.setFromEuler(_e4); _p4.set(x, z, -y); _m4.compose(_p4, _q4, _s4);
  if (m.userData.inst){ m.setMatrixAt(0, _m4); m.instanceMatrix.needsUpdate = true;
    if (!m.userData.ghost){ const ic = m.geometry.attributes.iCol; if (ic){ const f = (brake ? 1 : 0) + ((typeof nightF === 'number' ? nightF : 0) > 0.3 ? 8 : 0); if (ic.array[3] !== f){ ic.array[3] = f; ic.needsUpdate = true; } } } }
  else { m.matrix.copy(_m4); m.matrixWorldNeedsUpdate = true; }
  m.visible = true; void v;
}
// per frame: gate pulse, arrow, chevrons, ghost
function fxTick(dt){
  const R = RACE.R, S = DRV(); if (!R || !FX.grp || !S || !S.CAR) return; FX.t += dt || 0.016; const C = S.CAR, run = RACE.state !== 'done';
  const SG4 = FX.gates[3]; if (SG4.cp === -2){ SG4.grp.visible = RACE.state !== 'done' && RACE.s < 120 && RACE.cp < 2; SG4.mTube.color.setRGB(1, 1, 1); SG4.mGlow.color.copy(COL.fin); SG4.mGlow.opacity = 0.25; SG4.mLine.color.setRGB(1, 1, 1); SG4.mLine.opacity = 0.6; SG4.mFlare.color.copy(COL.fin); }
  for (const g of FX.gates){ if (g.cp < 0) continue; const cp = R.cps[g.cp], nxt = g.cp === RACE.cp, col = cp.last ? COL.fin : nxt ? COL.next : COL.after, pu = nxt ? 0.75 + 0.25*Math.sin(FX.t*6) : 0.45;
    g.mTube.color.copy(col).multiplyScalar(nxt ? 1 : 0.7); g.mTube.opacity = nxt ? 0.95 : 0.55; g.mGlow.color.copy(col); g.mGlow.opacity = 0.12 + 0.18*pu; g.mLine.color.copy(col); g.mLine.opacity = nxt ? 0.35 + 0.3*pu : 0.2;
    g.mFlare.color.copy(col); g.mFlare.size = nxt ? 6 + 3*pu : 4; g.mLabel.opacity = nxt ? 1 : 0.6; const sc = nxt ? 1 + 0.04*Math.sin(FX.t*6) : 1; g.glow.scale.set(sc, sc, sc); }
  // the arrow: 13 m ahead of the car, 3 m up, pointing at the route 35 m beyond the car (or at the next gate when off the route)
  const cp = R.cps[RACE.cp]; FX.arrow.visible = run && !!cp && RACE.state !== 'count';
  if (FX.arrow.visible){ const cs = Math.cos(C.psi), sn = Math.sin(C.psi), ax = C.x + cs*13, ay = C.y + sn*13; let tx, ty;
    if (RACE.d < 40){ along(R, Math.min(cp.s, RACE.s + 45), 0, _gp); tx = _gp.x; ty = _gp.y; if (Math.hypot(tx - ax, ty - ay) < 8){ tx = cp.x; ty = cp.y; } } else { tx = cp.x; ty = cp.y; }
    const h = Math.atan2(ty - ay, tx - ax); FX.arrow.position.set(ax, C.z + 3.1 + 0.15*Math.sin(FX.t*3), -ay); FX.arrow.rotation.set(0, h, 0); FX.arrowM.rotation.set(0, 0, 0.35);
    FX.arrowM.material.color.copy(RACE.wrong ? COL.wrong : COL.arrow); }
  // chevrons: every 8 m along the route ahead of the car, brighter near the next turn
  let n = 0;
  if (run && RACE.state !== 'count' && RACE.d < 40 && cp){ const s0 = Math.ceil((RACE.s + 9)/8)*8, nearTurn = cp.kind === 'turn' && cp.s - RACE.s < 220;
    FX.chev.material.opacity = nearTurn ? 0.75 : 0.42; FX.chev.material.color.copy(nearTurn ? COL.arrow : COL.next);
    for (let s = s0; n < NCHEV && s < Math.min(R.L, cp.s + 40); s += 8){ along(R, s, 0, _gp); const k = _gp.k, z = surfZ(R, k) + 0.1, rs = R.hw[k] < 6 ? 1.1 : 1.5;
      _e4.set(0, Math.atan2(_gp.ty, _gp.tx), 0, 'YZX'); _q4.setFromEuler(_e4); _p4.set(_gp.x, z, -_gp.y); _s4.set(rs, 1, rs); _m4.compose(_p4, _q4, _s4); FX.chev.setMatrixAt(n++, _m4); }
    _s4.set(1, 1, 1); }
  FX.chev.count = n; FX.chev.instanceMatrix.needsUpdate = true; FX.chev.visible = n > 0;
  // the ghost of the best run
  const G = RACE.ghost;
  if (G && G.length >= 10 && RACE.state === 'run'){ if (!FX.ghost || FX.ghostKey !== veh()){ if (FX.ghost) fxCarFree(FX.ghost); FX.ghost = fxCarMesh(veh() === 'car' ? 'sedan' : 'f1', [0.5, 0.9, 1], true); FX.ghostKey = veh(); }
    const nG = G.length/5, t = RACE.t; let lo = 0, hi = nG - 1; if (t >= G[hi*5]) lo = hi; else { while (hi - lo > 1){ const m = (lo + hi) >> 1; if (G[m*5] <= t) lo = m; else hi = m; } }
    const a = lo*5, b = Math.min(nG - 1, lo + 1)*5, f = G[b] > G[a] ? clamp((t - G[a])/(G[b] - G[a]), 0, 1) : 0;
    FX.gx = G[a + 1] + (G[b + 1] - G[a + 1])*f; FX.gy = G[a + 2] + (G[b + 2] - G[a + 2])*f;
    fxCarPose(FX.ghost, FX.gx, FX.gy, G[a + 3] + (G[b + 3] - G[a + 3])*f, G[a + 4] + wrapA(G[b + 4] - G[a + 4])*f, 0, 0, 0);
    FX.ghost.visible = Math.hypot(G[a + 1] - C.x, G[a + 2] - C.y) > 3.5; }
  else if (FX.ghost) FX.ghost.visible = false;
}
// ---------------------------------------------------------------- HUD: the race panel (position, checkpoint n/N, time, split vs best,
// distance to the next gate, ranking), wrong-way banner, messages, start lights, the route ribbon over the drive module's minimap,
// the finish screen. It lives inside the drive module's HUD (#f1Hud) and uses its styles (f1p, f1info, f1lights, f1res, f1map).
const CRCSS = `
.crp{margin-top:8px;width:220px;box-sizing:border-box;padding:9px 12px 10px}
.crp[hidden],.crmap[hidden]{display:none!important}
.crhd b{display:block;font-size:12.5px;font-weight:700;letter-spacing:.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.crhd small{display:block;font:400 10px var(--font-mono);color:#9fb0b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:1px 0 6px}
.crrow{display:flex;justify-content:space-between;align-items:baseline;font:500 12px var(--font-mono);margin-top:5px;font-variant-numeric:tabular-nums}
.crrow .g{color:#59e38a}.crrow .r{color:#ff6b5e}.crrow em{font-style:normal;color:#9fb0b8;font-size:10px}
.crnext{display:inline-flex;align-items:center;gap:5px}.crnext i{display:inline-block;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:9px solid #35f2ff;transform-origin:50% 60%}
.crwarn{position:absolute;left:50%;top:calc(21% + env(safe-area-inset-top,0px));transform:translateX(-50%);padding:8px 20px;border-radius:10px;background:rgba(175,22,18,.88);color:#fff;font:800 24px/1.2 var(--font-ui);letter-spacing:.08em;pointer-events:none;display:none;text-align:center}
.crwarn small{display:block;font:500 11px var(--font-mono);letter-spacing:.06em;opacity:.85}
.crwarn.on{display:block;animation:crbl .7s ease-in-out infinite alternate}
@keyframes crbl{from{opacity:1}to{opacity:.55}}
.crmsg{position:absolute;left:50%;top:calc(38% + env(safe-area-inset-top,0px));transform:translateX(-50%);font:700 20px/1.3 var(--font-ui);letter-spacing:.03em;text-align:center;padding:7px 15px;border-radius:10px;background:rgba(12,17,20,.62);opacity:0;transition:opacity .25s;pointer-events:none;max-width:calc(100% - 40px)}
.crmsg.on{opacity:1}.crmsg.go{color:#59e38a}.crmsg.warn{color:#ffcf4a}.crmsg.purple{color:#d39bf0}
.crlights{flex-direction:column;align-items:center;gap:8px}.crlights>div{display:flex;gap:10px}
.crlights b{font:800 15px var(--font-ui);letter-spacing:.12em;color:#cfd8dc}
.crmap{background:transparent!important;border-color:transparent!important;box-shadow:none!important;pointer-events:none}
.crres h3 small{font:500 11px var(--font-mono);color:#9fb0b8;margin-left:6px}
.crbig{font:600 30px/1.1 var(--font-mono);font-variant-numeric:tabular-nums;margin:2px 0 4px}.crbig small{font:600 11px var(--font-ui);color:#d39bf0;margin-left:8px;letter-spacing:.06em}
.crres li{grid-template-columns:22px 5px 1fr auto auto}
.crsplits{max-height:120px;overflow:auto;font:400 10.5px/1.5 var(--font-mono);color:#cfd8dc;margin:0 0 10px;display:grid;grid-template-columns:auto 1fr auto;gap:0 10px}
.crsplits .g{color:#59e38a}.crsplits .r{color:#ff6b5e}
@media (max-width:760px){ .crp{width:150px;padding:7px 9px} .crhd small{display:none} .crwarn{font-size:18px} .crmsg{font-size:15px} .crrow{font-size:11px} }
`;
const HUD = {el:null, q:null, last:{}, map:null, mctx:null, frame:0, obs:null};
function hudBuild(){
  if (HUD.q) return true; const h = document.getElementById('f1Hud'); if (!h) return false;
  const st = document.createElement('style'); st.textContent = CRCSS; document.head.appendChild(st);
  const col = h.querySelector('.f1top > div') || h;
  const p = document.createElement('div'); p.className = 'f1info f1p crp'; p.id = 'crPanel'; p.hidden = true;
  p.innerHTML = `<div class="crhd"><b id="crName">城市竞速 City race</b><small id="crSub"></small></div>
<div class="f1hdr"><b id="crPos">P–</b><small id="crPosN">/1</small><span id="crCp">CP 0/0</span></div>
<div class="f1lt" id="crT">0:00.00</div>
<div class="crrow"><span id="crDelta"><em>分段 SPLIT</em> –</span><span class="crnext"><i id="crArr"></i><span id="crNext">–</span></span></div>
<dl class="f1kv"><dt>最佳 Best</dt><dd id="crBest">–</dd><dt>全程 Length</dt><dd id="crLen">–</dd></dl><ol class="f1tower" id="crTower"></ol>`;
  col.appendChild(p);
  const add = (tag, cls, id, html) => { const e = document.createElement(tag); e.className = cls; e.id = id; if (html) e.innerHTML = html; h.appendChild(e); return e; };
  add('div', 'crwarn', 'crWarn', '逆行 · WRONG WAY<small>掉头或按 R · turn around or press R</small>');
  add('div', 'crmsg', 'crMsg');
  const L = add('div', 'f1lights crlights', 'crLights', '<div><span></span><span></span><span></span><span></span><span></span></div><b id="crLtxt">准备 READY</b>'); L.hidden = true;
  add('div', 'f1res f1p crres', 'crRes').hidden = true;
  const map = document.createElement('canvas'); map.className = 'f1map crmap'; map.id = 'crMap'; map.width = map.height = 176; map.hidden = true;
  const fm = h.querySelector('#f1Map'); if (fm && fm.nextSibling) h.insertBefore(map, fm.nextSibling); else h.appendChild(map);
  const $ = id => document.getElementById(id);
  HUD.el = h; HUD.q = {panel:p, name:$('crName'), sub:$('crSub'), pos:$('crPos'), posN:$('crPosN'), cp:$('crCp'), t:$('crT'), delta:$('crDelta'), arr:$('crArr'), next:$('crNext'), best:$('crBest'), len:$('crLen'),
    tower:$('crTower'), warn:$('crWarn'), msg:$('crMsg'), lights:L, lts:[...L.querySelectorAll('span')], ltxt:$('crLtxt'), res:$('crRes')};
  HUD.map = map; HUD.mctx = map.getContext('2d');
  // R (the drive module's reset key / button) during a race: back to the last checkpoint. The drive module handles the key first
  // (it resets on the spot and flashes '复位 · Reset'); the button is taken over before it sees the click.
  const rb = h.querySelector('#f1ResetB'); if (rb) rb.addEventListener('click', e => { if (RACE.state === 'run'){ e.stopImmediatePropagation(); e.preventDefault(); respawn(); } }, true);
  const fmsg = h.querySelector('#f1Msg');
  if (fmsg && typeof MutationObserver !== 'undefined'){ HUD.obs = new MutationObserver(() => { if (RACE.state === 'run' && /复位|Reset/.test(fmsg.textContent) && /\bon\b/.test(fmsg.className) && performance.now() - (HUD.rsT || 0) > 300){ HUD.rsT = performance.now(); fmsg.className = 'f1msg'; respawn(); } });
    HUD.obs.observe(fmsg, {childList:true, characterData:true, subtree:true, attributes:true, attributeFilter:['class']}); }
  return true;
}
function hudRace(on){
  if (!HUD.q) return; HUD.q.panel.hidden = !on; HUD.map.hidden = !on; HUD.last = {}; if (!on){ HUD.q.warn.className = 'crwarn'; lightsShow(-1); HUD.q.msg.className = 'crmsg'; return; }
  const r = RACE.route; HUD.q.name.textContent = `${r.name[0]} · ${r.name[1]}`; HUD.q.sub.textContent = r.sub || ''; HUD.q.len.textContent = (r.lengthM/1000).toFixed(2) + ' km';
  HUD.q.best.textContent = RACE.best ? fmtT(RACE.best.t) : '–'; HUD.q.delta.innerHTML = '<em>分段 SPLIT</em> –';
}
let msgT = null;
function msg(t, dur, cls){ if (!HUD.q){ try { showToast(t); } catch (e){ /* */ } return; } const m = HUD.q.msg; m.textContent = t; m.className = 'crmsg on' + (cls ? ' ' + cls : ''); clearTimeout(msgT); msgT = setTimeout(() => { m.className = 'crmsg'; }, (dur || 1.6)*1000); }
function lightsShow(left){
  if (!HUD.q) return; const L = HUD.q.lights; if (left < 0 || left > 9){ L.hidden = true; return; } L.hidden = false;
  const n = left > 5 ? 0 : clamp(Math.ceil(5 - left), 0, 5); if (n !== RACE.lastLight){ RACE.lastLight = n; HUD.q.lts.forEach((s, i) => s.classList.toggle('on', i < n)); HUD.q.ltxt.textContent = n ? `${Math.ceil(left)}` : '准备 READY'; }
}
const setT = (el, k, v) => { if (HUD.last[k] !== v){ HUD.last[k] = v; el.textContent = v; } };
function hudSplit(dl){ if (!HUD.q) return; HUD.q.delta.innerHTML = dl === null ? `<em>分段 SPLIT</em> ${fmtT(RACE.t)}` : `<em>对比最佳 vs BEST</em> <span class="${dl < 0 ? 'g' : 'r'}">${fmtD(dl)}</span>`; }
function hudTick(){
  if (!HUD.q || RACE.state === 'off') return; HUD.frame++; const q = HUD.q, R = RACE.R, P = progressOf();
  setT(q.t, 't', fmtT(RACE.t)); setT(q.cp, 'cp', `CP ${P.cp}/${P.ncp}`);
  const rk = rankList(), me = rk.findIndex(e => e.me) + 1; setT(q.pos, 'pos', 'P' + me); setT(q.posN, 'posN', '/' + rk.length);
  setT(q.next, 'next', RACE.state === 'done' ? '终点 FIN' : P.dist >= 1000 ? (P.dist/1000).toFixed(2) + ' km' : P.dist + ' m');
  // the little arrow: direction of the next gate relative to the car's heading
  const cp = R.cps[RACE.cp], C = DRV().CAR; if (cp && C){ const a = Math.atan2(cp.y - C.y, cp.x - C.x) - C.psi, d = Math.round(-wrapA(a)*180/PI/5)*5; if (HUD.last.arr !== d){ HUD.last.arr = d; q.arr.style.transform = `rotate(${d}deg)`; } }
  const wc = RACE.wrong && RACE.state === 'run' ? 'crwarn on' : 'crwarn'; if (HUD.last.warn !== wc){ HUD.last.warn = wc; q.warn.className = wc; }
  if (HUD.frame % 15 === 1 || HUD.last.tower === undefined){ const html = rk.slice(0, 6).map((e, i) => `<li class="${e.me ? 'me' : ''}"><span>${i + 1}</span><i style="background:${e.col}"></i><span>${e.name[1]}</span><small>${e.finished ? fmtT(e.t) : 'CP ' + e.cp}</small></li>`).join('');
    if (HUD.last.tower !== html){ HUD.last.tower = html; q.tower.innerHTML = html; } }
  if (HUD.frame % 2 === 0) mapDraw();
  if (RACE.state === 'done' && !q.res.hidden && HUD.frame % 30 === 0) resFill();
}
// the route ribbon, the gates, the opponents over the drive module's minimap (same scale, centre and heading-up rotation)
function mapDraw(){
  const cv = HUD.map, R = RACE.R, S = DRV(); if (!cv || cv.hidden || !R || !S || !S.CAR) return;
  const css = cv.clientWidth || 176, dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(css*dpr); if (cv.width !== W){ cv.width = cv.height = W; }
  const x = HUD.mctx, C = S.CAR, kmh = Math.abs(C.u)*3.6, sc = (kmh < 70 ? 0.5 : kmh < 170 ? 0.33 : 0.22)*dpr; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, W);
  x.save(); x.translate(W/2, W*0.58); x.rotate(C.psi - PI/2);
  const X = v => (v - C.x)*sc, Y = v => -(v - C.y)*sc, span = Math.ceil(W/sc/R.st), k0 = Math.max(0, RACE.k - span), k1 = Math.min(R.N - 1, RACE.k + span);
  x.lineCap = x.lineJoin = 'round';
  const seg = (a, b, st, w) => { if (b <= a) return; x.strokeStyle = st; x.lineWidth = w; x.beginPath(); for (let k = a; k <= b; k++){ if (k > a) x.lineTo(X(R.x[k]), Y(R.y[k])); else x.moveTo(X(R.x[k]), Y(R.y[k])); } x.stroke(); };
  seg(k0, Math.min(RACE.k, k1), 'rgba(53,242,255,.25)', 5*dpr); seg(Math.max(k0, RACE.k), k1, 'rgba(10,30,40,.55)', 8*dpr); seg(Math.max(k0, RACE.k), k1, 'rgba(53,242,255,.85)', 4.2*dpr);
  for (let i = RACE.cp; i < R.cps.length; i++){ const c = R.cps[i]; if (c.k < k0 - 2 || c.k > k1 + 2) continue; const cx = X(c.x), cy = Y(c.y);
    if (c.last){ x.fillStyle = '#fff'; x.fillRect(cx - 4*dpr, cy - 4*dpr, 8*dpr, 8*dpr); x.fillStyle = '#111'; x.fillRect(cx - 4*dpr, cy - 4*dpr, 4*dpr, 4*dpr); x.fillRect(cx, cy, 4*dpr, 4*dpr); }
    else { x.fillStyle = i === RACE.cp ? '#35f2ff' : 'rgba(77,125,255,.9)'; x.strokeStyle = '#06131a'; x.lineWidth = 1.5*dpr; x.beginPath(); x.arc(cx, cy, (i === RACE.cp ? 4.6 : 3.2)*dpr, 0, TAU); x.fill(); x.stroke(); } }
  // the next gate off the map: a mark at the rim
  const cp = R.cps[RACE.cp]; if (cp){ const dx = X(cp.x), dy = Y(cp.y), r = Math.hypot(dx, dy), lim = W*0.44; if (r > lim){ x.fillStyle = '#35f2ff'; x.beginPath(); x.arc(dx/r*lim, dy/r*lim, 3.5*dpr, 0, TAU); x.fill(); } }
  for (const a of AIs){ if (!a.mesh || !a.mesh.visible) continue; const p = along(R, Math.min(a.s, R.L), a.lat, _gp); x.fillStyle = a.css; x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 1*dpr; x.beginPath(); x.arc(X(p.x), Y(p.y), 3.4*dpr, 0, TAU); x.fill(); x.stroke(); }
  for (const o of CR.opp){ if (!(o.x === o.x && o.y === o.y) || o.x === undefined) continue; x.fillStyle = o.color || '#8fc7ff'; x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 1*dpr; x.beginPath(); x.arc(X(o.x), Y(o.y), 3.4*dpr, 0, TAU); x.fill(); x.stroke(); }
  if (FX.ghost && FX.ghost.visible){ x.strokeStyle = '#7fe0ff'; x.lineWidth = 1.6*dpr; x.beginPath(); x.arc(X(FX.gx), Y(FX.gy), 3.6*dpr, 0, TAU); x.stroke(); }
  x.restore();
  // the car on top (the ribbon covers the drive module's mark)
  x.save(); x.translate(W/2, W*0.58); x.fillStyle = '#ff3b30'; x.strokeStyle = '#fff'; x.lineWidth = 1.6*dpr; x.beginPath(); x.moveTo(0, -8*dpr); x.lineTo(5.5*dpr, 6*dpr); x.lineTo(0, 3*dpr); x.lineTo(-5.5*dpr, 6*dpr); x.closePath(); x.fill(); x.stroke(); x.restore();
}
// the finish screen
function resShow(){ if (!HUD.q) return; HUD.q.res.hidden = false; resFill(true); }
function resHide(){ if (HUD.q) HUD.q.res.hidden = true; }
function resFill(first){
  const q = HUD.q, r = RACE.result, R = RACE.R; if (!q || !r || !R) return; const rk = rankList(), me = rk.findIndex(e => e.me) + 1, best = RACE.best;
  const ol = rk.map((e, i) => `<li class="${e.me ? 'me' : ''}"><span>${i + 1}</span><i style="background:${e.col}"></i><span>${e.name[0]} ${e.name[1]}</span><small>${e.finished ? fmtT(e.t) : 'CP ' + e.cp + '/' + R.cps.length}</small><span></span></li>`).join('');
  if (!first){ const o = q.res.querySelector('ol'), h = q.res.querySelector('h3 b'); if (o && o.innerHTML !== ol) o.innerHTML = ol; if (h) h.textContent = `P${me}/${rk.length}`; return; }
  const sp = r.splits.map((t, i) => { const b = best && best.splits ? best.splits[i] : undefined, d = b !== undefined ? t - b : null;
    return `<span>${i + 1 === r.splits.length ? '终点 FIN' : 'CP ' + (i + 1)}</span><span>${fmtT(t)}</span><span class="${d === null ? '' : d < 0 ? 'g' : 'r'}">${d === null ? '' : fmtD(d)}</span>`; }).join('');
  q.res.innerHTML = `<h3>完赛 Finished · <b>P${me}/${rk.length}</b><small>${RACE.route.name[0]} · ${RACE.route.name[1]} · ${(RACE.route.lengthM/1000).toFixed(2)} km</small></h3>
<div class="crbig">${fmtT(r.t)}${r.newBest ? '<small>新纪录 NEW BEST</small>' : ''}</div>
<p>${r.newBest && r.prevBest ? '之前最佳 Previous best ' + fmtT(r.prevBest) + ' · ' + fmtD(r.t - r.prevBest) : !r.newBest ? '最佳 Best ' + fmtT(r.best) + ' · ' + fmtD(r.t - r.best) : '第一次完成这条路线 · First finish on this route'}</p>
<ol>${ol}</ol>
<div class="crsplits">${sp}</div>
<div class="f1btns"><button class="f1b f1p" type="button" data-a="again"><b>再来一次</b><small>RACE AGAIN</small></button><button class="f1b f1p" type="button" data-a="drive"><b>继续开</b><small>KEEP DRIVING</small></button><button class="f1b f1p x" type="button" data-a="exit"><b>退出比赛</b><small>EXIT RACE</small></button></div>`;
  q.res.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => { const a = b.dataset.a, route = RACE.route, o = RACE.o;
    if (a === 'again'){ stopRace(); startRace(route, Object.assign({}, o, {at:null})); } else if (a === 'drive'){ stopRace(); } else { stopRace(); try { DRV().exit(); } catch (e){ /* */ } } }));
}
// ---------------------------------------------------------------- the tray: a 城市竞速 City race section at the end of the drive pane
const UICSS = `
.crpick{margin-top:12px;padding-top:11px;border-top:1px solid var(--rule);display:flex;flex-direction:column;gap:7px}
.crhead b{display:flex;align-items:center;gap:7px;font-size:15px;font-weight:700;letter-spacing:.03em}
.crhead b i{font-style:normal;display:grid;place-items:center;width:22px;height:22px;border-radius:6px;background:#2a2410;color:#ffc21a;font-size:12px}
.crhead b span{font-weight:500;color:var(--muted);font-size:12px}
.crhead small{display:block;font:400 10px/1.45 var(--font-mono);color:var(--muted);margin-top:2px}
.crlab{font:600 9.5px var(--font-mono);letter-spacing:.12em;color:var(--muted);margin-top:2px}
.crroutes{display:grid;grid-template-columns:1fr 1fr;gap:5px}
.crroutes button{appearance:none;border:1px solid var(--rule);background:var(--panel);border-radius:7px;padding:5px 8px 6px;cursor:pointer;color:var(--ink);text-align:left;font:inherit;min-width:0}
.crroutes button b{display:block;font-size:11.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.crroutes button small{display:block;font:400 9px var(--font-mono);color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.crroutes button em{font-style:normal;font:600 8.5px var(--font-mono);color:#b8860b}
.crroutes button[aria-pressed="true"],.crrand[aria-pressed="true"]{border-color:var(--ink);background:var(--panel-2);box-shadow:inset 0 0 0 1px var(--ink)}
.crrand{display:flex;align-items:center;gap:6px;flex-wrap:wrap;border:1px solid var(--rule);border-radius:7px;padding:6px 8px;cursor:pointer}
.crrand input[type=text]{width:78px;font:500 12px var(--font-mono);padding:3px 6px;border:1px solid var(--rule);border-radius:5px;background:var(--panel);color:var(--ink)}
.crrand .seg{min-width:0}.crrand .seg button{padding:3px 7px;font-size:11px}
.crdice{appearance:none;border:1px solid var(--rule);background:var(--panel);border-radius:5px;cursor:pointer;padding:2px 7px;font-size:13px;color:var(--ink)}
.crrand label,.crfoot label{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--ink);cursor:pointer}
.crinfo{display:flex;gap:9px;align-items:center;min-height:56px;font:400 10px/1.45 var(--font-mono);color:var(--muted)}
.crinfo canvas{width:84px;height:56px;flex:none;border-radius:6px;background:var(--panel-2)}
.crinfo b{color:var(--ink);font:600 11.5px var(--font-ui);display:block}
.crfoot{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.crfoot .seg{min-width:0}.crfoot .seg button{padding:3px 7px;font-size:11px}
.crgo{appearance:none;border:0;border-radius:8px;padding:8px 14px;margin-left:auto;background:#ffc21a;color:#1b1406;font:700 13px var(--font-ui);cursor:pointer}
.crgo:hover{filter:brightness(1.08)}.crgo:disabled{opacity:.6;cursor:wait}
@media (max-width:760px){ .crhead small{display:none} .crroutes button small{display:none} }
`;
const UI = {box:null, sel:null, seed:'', km:6, loop:false, traffic:true, ai:3, ghost:true, n:0, w:0, gen:0};
function uiLoad(){ try { const s = JSON.parse(localStorage.getItem('cb_cityrace_ui_' + cityKey()) || 'null'); if (s) for (const k of ['sel', 'seed', 'km', 'loop', 'traffic', 'ai', 'ghost']) if (s[k] !== undefined) UI[k] = s[k]; } catch (e){ /* storage blocked */ } }
function uiSave(){ try { const o = {}; for (const k of ['sel', 'seed', 'km', 'loop', 'traffic', 'ai', 'ghost']) o[k] = UI[k]; localStorage.setItem('cb_cityrace_ui_' + cityKey(), JSON.stringify(o)); } catch (e){ /* */ } }
function uiInit(){
  const pane = document.querySelector('.tray-pane[data-cat="f1"]');
  if (!pane){ if ((UI.n = UI.n + 1) < 60) setTimeout(uiInit, 500); return; }
  // after the drive picker and the flying section (when present): give them a moment, then append at the end of the pane
  if (!pane.querySelector('.flypick') && (UI.w = UI.w + 1) < 8){ setTimeout(uiInit, 500); return; }
  if (pane.querySelector('.crpick')) return;
  const st = document.createElement('style'); st.textContent = UICSS; document.head.appendChild(st);
  uiLoad(); const city = cityKey(), defs = CURATED[city] || []; if (!UI.seed) UI.seed = String(1000 + Math.floor(Math.random()*9000));
  if (!UI.sel || (UI.sel !== 'random' && !defs.some(d => d.id === UI.sel))) UI.sel = defs.length ? defs[0].id : 'random';
  const box = document.createElement('div'); box.className = 'crpick'; UI.box = box;
  box.innerHTML = `<div class="crhead"><b><i>⚑</i>城市竞速 <span>City race</span></b><small>真实街道上的检查点赛：发车灯、计时、分段对比、对手与影子车 · Checkpoint races on the real streets: start lights, splits, rivals, ghost</small></div>
<div class="crlab">精选路线 · ROUTES</div>
<div class="crroutes" role="group" aria-label="路线 Routes">${defs.map(d => `<button type="button" data-cr="${d.id}" aria-pressed="false" title="${d.zh} · ${d.en} — ${d.sub || ''}"><b>${d.zh}</b><small>${d.en}</small><small class="crbest" data-best="${d.id}"></small></button>`).join('')}</div>
<div class="crlab">随机路线 · RANDOM ROUTE</div>
<div class="crrand" id="crRand" aria-pressed="false" role="button" tabindex="0"><span style="font-size:11px">种子 Seed</span><input type="text" id="crSeed" maxlength="12" aria-label="种子 Seed"><button type="button" class="crdice" id="crDice" title="换一个 New seed">🎲</button>
<div class="seg" role="group" aria-label="长度 Length">${[3, 6, 9, 12].map(k => `<button type="button" data-km="${k}" aria-pressed="false">${k} km</button>`).join('')}</div><label><input type="checkbox" id="crLoop"> 环线 Loop</label></div>
<div class="crinfo" id="crInfo"><canvas id="crPrev" width="168" height="112"></canvas><div id="crInfoT">–</div></div>
<div class="crfoot"><label title="街道上的车流 Street traffic"><input type="checkbox" id="crTraf"> 交通 Traffic</label><span style="font-size:11px">对手 AI</span><div class="seg" role="group" aria-label="AI 对手 AI rivals">${[0, 3, 5].map(n => `<button type="button" data-ai="${n}" aria-pressed="false">${n}</button>`).join('')}</div>
<label title="你最佳成绩的影子车 Your best run as a ghost"><input type="checkbox" id="crGhost"> 影子 Ghost</label><button type="button" class="crgo" id="crGo">开始比赛 Race ▸</button></div>`;
  pane.appendChild(box);
  const $ = id => box.querySelector('#' + id), seed = $('crSeed');
  seed.value = UI.seed; $('crLoop').checked = !!UI.loop; $('crTraf').checked = !!UI.traffic; $('crGhost').checked = !!UI.ghost;
  box.querySelectorAll('[data-cr]').forEach(b => b.addEventListener('click', () => { UI.sel = b.dataset.cr; uiSync(); }));
  const rnd = () => { UI.sel = 'random'; UI.seed = seed.value.trim() || UI.seed; uiSync(); };
  $('crRand').addEventListener('click', e => { if (e.target === $('crRand') || e.target.tagName === 'SPAN') rnd(); });
  seed.addEventListener('change', rnd); seed.addEventListener('focus', () => { if (UI.sel !== 'random'){ UI.sel = 'random'; uiSync(); } });
  seed.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') rnd(); });
  $('crDice').addEventListener('click', () => { seed.value = String(1000 + Math.floor(Math.random()*9000)); rnd(); });
  box.querySelectorAll('[data-km]').forEach(b => b.addEventListener('click', () => { UI.km = +b.dataset.km; UI.sel = 'random'; uiSync(); }));
  $('crLoop').addEventListener('change', e => { UI.loop = e.target.checked; UI.sel = 'random'; uiSync(); });
  $('crTraf').addEventListener('change', e => { UI.traffic = e.target.checked; uiSave(); });
  $('crGhost').addEventListener('change', e => { UI.ghost = e.target.checked; uiSave(); });
  box.querySelectorAll('[data-ai]').forEach(b => b.addEventListener('click', () => { UI.ai = +b.dataset.ai; uiSync(); }));
  $('crGo').addEventListener('click', () => uiGo());
  try { if (typeof CATS !== 'undefined' && CATS.f1 && !/城市竞速/.test(CATS.f1[3])) CATS.f1[3] += ' · 城市竞速 City race'; } catch (e){ /* */ }
  uiSync(); uiBest();
  const tab = document.getElementById('f1Tab'); if (tab) tab.addEventListener('click', () => setTimeout(() => { if (UI.pend) uiInfo(); }, 80));
}
function uiSeedArg(){ return /^\d+$/.test(UI.seed) ? +UI.seed : UI.seed; }
function uiSync(){
  const b = UI.box; if (!b) return; uiSave();
  b.querySelectorAll('[data-cr]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.cr === UI.sel)));
  b.querySelector('#crRand').setAttribute('aria-pressed', String(UI.sel === 'random'));
  b.querySelectorAll('[data-km]').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.km === UI.km)));
  b.querySelectorAll('[data-ai]').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.ai === UI.ai)));
  uiInfo();
}
// the selected route: generated lazily (the road graph is built on first use: ~0.5 s in Singapore, ~2 s in the US maps)
function uiRoute(){ return UI.sel === 'random' ? genRoute(uiSeedArg(), {km:UI.km, loop:UI.loop}) : genRoute(UI.sel); }
function uiInfo(){
  const t = UI.box && UI.box.querySelector('#crInfoT'); if (!t) return;
  // the road graph is built only when the section is on screen (it takes a moment: no hitch while the map loads)
  if (!UI.box.offsetParent){ UI.pend = true; return; } UI.pend = false; const g = ++UI.gen;
  const def = UI.sel !== 'random' ? (CURATED[cityKey()] || []).find(d => d.id === UI.sel) : null;
  if (!SGR.on || !SGR.lines){ t.innerHTML = '<b>地图加载中 · Map loading…</b>'; setTimeout(() => { if (g === UI.gen) uiInfo(); }, 1500); return; }
  if (!CR.G) t.innerHTML = `<b>${def ? def.zh + ' · ' + def.en : '随机路线 Random #' + UI.seed}</b>正在分析道路网… Analysing the road network…`;
  setTimeout(() => { if (g !== UI.gen) return; const r = uiRoute(); if (g !== UI.gen) return;
    if (!r){ t.innerHTML = `<b>没有找到路线 · No route</b>换一个种子试试 · try another seed`; uiPrev(null); return; }
    const best = bestGet(r.id); t.innerHTML = `<b>${r.name[0]} · ${r.name[1]}</b>${(r.lengthM/1000).toFixed(2)} km · ${r.cps.length} 检查点 checkpoints${r.loop ? ' · 环线 loop' : ''}<br>${r.sub || r.roads.join(' · ')}<br>最佳 Best ${best ? fmtT(best.t) : '–'}`;
    uiPrev(r); }, CR.G ? 0 : 60);
}
function uiPrev(r){
  const cv = UI.box && UI.box.querySelector('#crPrev'); if (!cv) return; const x = cv.getContext('2d'), W = cv.width, H = cv.height; x.clearRect(0, 0, W, H); if (!r) return;
  const X = r.path.x, Y = r.path.y; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < X.length; i++){ x0 = Math.min(x0, X[i]); x1 = Math.max(x1, X[i]); y0 = Math.min(y0, Y[i]); y1 = Math.max(y1, Y[i]); }
  const sc = Math.min((W - 16)/Math.max(1, x1 - x0), (H - 16)/Math.max(1, y1 - y0)), ox = (W - (x1 - x0)*sc)/2, oy = (H - (y1 - y0)*sc)/2, px = v => ox + (v - x0)*sc, py = v => H - oy - (v - y0)*sc;
  x.lineJoin = x.lineCap = 'round'; x.strokeStyle = '#e8302a'; x.lineWidth = 3; x.beginPath(); for (let i = 0; i < X.length; i++){ if (i) x.lineTo(px(X[i]), py(Y[i])); else x.moveTo(px(X[i]), py(Y[i])); } x.stroke();
  x.fillStyle = '#1a73e8'; for (const c of r.cps) if (!c.last && c.kind !== 'finish'){ x.beginPath(); x.arc(px(c.x), py(c.y), 2.4, 0, TAU); x.fill(); }
  x.fillStyle = '#16a34a'; x.beginPath(); x.arc(px(r.start.x), py(r.start.y), 5, 0, TAU); x.fill(); const f = r.cps[r.cps.length - 1]; x.fillStyle = '#111'; x.fillRect(px(f.x) - 4, py(f.y) - 4, 8, 8);
}
function uiBest(){ if (!UI.box) return; UI.box.querySelectorAll('[data-best]').forEach(e => { const b = bestGet(cityKey() + ':' + e.dataset.best); e.innerHTML = b ? `<em>最佳 BEST ${fmtT(b.t)}</em>` : ''; }); if (CR.G) uiInfo(); }
function uiGo(){
  const btn = UI.box && UI.box.querySelector('#crGo'); if (btn){ btn.disabled = true; btn.textContent = '生成路线… Building…'; }
  setTimeout(() => { const r = uiRoute(); if (btn){ btn.disabled = false; btn.textContent = '开始比赛 Race ▸'; }
    if (!r){ try { showToast('没有找到路线 · No route found'); } catch (e){ /* */ } return; }
    startRace(r, {solo:true, traffic:UI.traffic, ai:UI.ai, ghost:UI.ghost}); }, 30);
}
// ---------------------------------------------------------------- the test autopilot (follows the route: pure pursuit in the kerb-side
// lane, a grip / braking speed profile, a gap to the traffic and the AI ahead; stuck for 4 s -> respawn at the last checkpoint)
const AP = {on:false, k:0.9, stuckT:0, resp:0, maxD:0, wrong:0, crash:0, log:[], bias:0, biasS:-1};
const BIAS = [0, -2.2, 2.2, -3.6, 3.6, -1.2, 1.2];
const OBA = [];
function apInput(){
  const R = RACE.R, S = DRV(), C = S.CAR, f1 = veh() === 'f1', u = C.u, prof = RACE.prof;
  // after getting stuck the autopilot tries other lateral lines past that spot (an obstacle on its line)
  const bias = AP.biasS >= 0 && RACE.s < AP.biasS + 120 ? AP.bias : 0, k = RACE.k, la = clamp(6 + Math.abs(u)*0.5, 6, 42), kk = Math.min(R.N - 1, k + Math.round(la/R.st));
  const tgt = along(R, RACE.s + la, clamp(laneLat(R, kk) + bias, -R.hw[kk] + 1.2, R.hw[kk] - 1.2), _gp);
  let want = Math.atan2(tgt.y - C.y, tgt.x - C.x); if (RACE.d > 25){ const cp = R.cps[RACE.cp] || R.cps[R.cps.length - 1]; want = Math.atan2(cp.y - C.y, cp.x - C.x); }
  let vt = prof[clamp(Math.round((RACE.s + Math.max(8, u*0.9))/R.st), 0, R.N - 1)]*AP.k;
  vt = Math.min(vt, prof[clamp(Math.round((RACE.s + Math.max(20, u*2.2))/R.st), 0, R.N - 1)]*AP.k + 6);
  if (RACE.state === 'done') vt = 0;
  // the traffic and the AI ahead in the lane
  const cs = Math.cos(C.psi), sn = Math.sin(C.psi), T = window.SGTraffic, obs = T && T.obstacles && !T.suspend ? T.obstacles(C.x, C.y, 70, OBA) : [];
  let blk = 0; const band = AP.biasS >= 0 && RACE.s < AP.biasS + 120 ? 1.3 : 2.3;
  const chk = (x, y, vx, vy, z) => { const dx = x - C.x, dy = y - C.y, f = dx*cs + dy*sn, lat = -dx*sn + dy*cs; if (f > 2 && f < 60 && Math.abs(lat) < band && Math.abs((z || C.z) - C.z) < 3){ const ov = Math.max(0, vx*cs + vy*sn), lim = ov + Math.max(0, f - 9 - u*0.35)*0.5; if (lim < vt){ vt = lim; blk = lat > 0 ? 1 : -1; } } };
  for (const o of obs) chk(o.x, o.y, o.vx || 0, o.vy || 0, o.z);
  for (const a of AIs){ const p = along(R, a.s, a.lat, _aq); chk(p.x, p.y, p.tx*a.v, p.ty*a.v, a.z); }
  // held up by something slow or standing for 1.5 s: pass it on the other side (within the road)
  if (blk && vt < 4){ AP.blkT = (AP.blkT || 0) + 1/15; if (AP.blkT > 1.5){ AP.blkT = 0; AP.bias = -blk*3.2; AP.biasS = RACE.s; } } else AP.blkT = 0;
  const err = wrapA(want - C.psi), ms = f1 ? 0.36/(1 + (u/30)*(u/30)) + 0.05 : Math.min(0.55, 41/Math.max(1, u*u)) + 0.012;
  return {thr:u < vt - 0.4 ? clamp((vt - u)*0.3, 0.15, 1) : 0, brk:u > vt + 0.8 ? clamp((u - vt)*0.22, 0.08, 1) : 0, steer:clamp(err*2.3/Math.max(0.04, ms), -1, 1), hb:0};
}
function apStep(dt){
  const S = DRV(); if (!S || !S.CAR || RACE.state === 'off') return null; const C = S.CAR;
  AP.maxD = Math.max(AP.maxD, RACE.state === 'run' ? RACE.d : 0); if (RACE.wrong) AP.wrong++;
  const mv = Math.hypot(C.x - (AP.lx === undefined ? C.x : AP.lx), C.y - (AP.ly === undefined ? C.y : AP.ly))/Math.max(1e-3, dt); AP.lx = C.x; AP.ly = C.y;   // real movement (wheels can spin against a wall)
  if (RACE.state === 'run' && mv < 1.2){ AP.stuckT += dt; if (AP.stuckT > 4){ AP.stuckT = 0; AP.resp++; AP.log.push({t:+RACE.t.toFixed(1), cp:RACE.cp, s:Math.round(RACE.s), x:Math.round(C.x), y:Math.round(C.y)}); AP.bias = BIAS[AP.resp % BIAS.length]; AP.biasS = RACE.s; respawn(); } } else AP.stuckT = 0;
  return apInput();
}
// ---------------------------------------------------------------- hooks
HOOKS.boot.push(() => { setTimeout(uiInit, 400); });
HOOKS.frame.push((t, dt) => {
  if (RACE.state === 'off') return;
  if (AP.on && RACE.state !== 'count'){ const S = DRV(), inp = apStep(dt); if (S && inp) S.hold(inp); }
  const t0 = performance.now(); raceTick(dt); const ms = performance.now() - t0; CR.ms = CR.ms ? CR.ms*0.95 + ms*0.05 : ms; CR.msMax = Math.max(CR.msMax || 0, ms);
});
// ---------------------------------------------------------------- window.SGRace (the contract for the multiplayer client) + test handles
const SGRace = {
  // seed (number / string, or a curated id 'marina' / 'sg:marina') + {km 3-12, loop, city} -> route {id, seed, city, start:{x, y, z, hdg},
  // cps:[{x, y, z, w, hdg, s, kind}], lengthM, path:{x, y, e, c, ow}, name:[zh, en], ...}; null when the map is not ready / no route
  generate:(seed, o) => genRoute(seed, o),
  // route (object, or a seed / curated id) + {at: performance.now() time of the GO (null: a 5 s countdown from now), solo:true (AI racers,
  // ghost), traffic:true, ai:3, ghost:true, car (US maps: the road car)}
  start:(route, o) => startRace(route !== null && typeof route === 'object' ? route : genRoute(route, o), o),
  stop:() => { stopRace(); return true; },
  // {cp: checkpoints passed, ncp, dist: m to the next checkpoint, t: race seconds, finished, wrong, state, s: route metres, x, y, z, psi}
  progress:() => progressOf() || {cp:0, ncp:0, dist:0, t:0, finished:false, wrong:false, state:'off'},
  onFinish:cb => { if (typeof cb === 'function') CR.fin.push(cb); return () => { const i = CR.fin.indexOf(cb); if (i >= 0) CR.fin.splice(i, 1); }; },
  // [{id, name, cp, dist, t, finished, x?, y?, color?}] -> the ranking (and the minimap dots when x / y are given)
  setOpponents:list => { CR.opp = Array.isArray(list) ? list.filter(o => o && o.id !== undefined && o.id !== 'me').slice(0, 16) : []; return CR.opp.length; },
  routes:city => { const c = city || cityKey(); return (CURATED[c] || []).map(d => { const id = c + ':' + d.id, r = CR.cache.get(id), b = bestGet(id);
    return {id, seed:d.id, city:c, name:[d.zh, d.en], sub:d.sub, loop:!!d.loop, lengthM:r ? r.lengthM : null, best:b ? b.t : null}; }); },
  respawn:() => respawn(),
  best:id => bestGet(id),
  get state(){ return RACE.state; }, get route(){ return RACE.route; }, get result(){ return RACE.result; }, get city(){ return cityKey(); },
  // canonical form of a route (what must be identical on every client) and its hash
  canon:r => CRG.canon(r), hash:r => CRG.hash(JSON.stringify(CRG.canon(r))),
  _test:{
    graph:() => { const G = graph(); return G ? Object.assign({buildMs:CR.buildMs}, G.stats) : null; },
    // per-frame cost of the race (ms, smoothed / max) and what it draws
    stats:() => { let calls = 0, tris = 0; if (FX.grp) FX.grp.traverse(o => { if (o.visible && (o.isMesh || o.isPoints || o.isSprite) && o.geometry){ calls++; const g = o.geometry, n = g.index ? g.index.count : g.attributes.position.count; tris += o.isMesh ? n/3*(o.count || 1) : 0; } });
      return {ms:CR.ms ? +CR.ms.toFixed(3) : null, msMax:CR.msMax ? +CR.msMax.toFixed(2) : null, objects:calls, tris:Math.round(tris), ai:AIs.length, samples:RACE.R ? RACE.R.N : 0}; },
    go:() => { RACE.freeze = null; if (RACE.state === 'count') RACE.goAt = performance.now() - 1; raceTick(0); return RACE.state; },
    countdown:left => { RACE.freeze = left == null ? null : +left; return RACE.state; },
    // drive the route with the autopilot for up to sec seconds (60 Hz physics in 4-frame steps; the traffic stands still meanwhile)
    drive(sec, o){ o = o || {}; const S = DRV(); if (!S || RACE.state === 'off') return {err:'no race'}; AP.k = o.k || 0.9; if (o.reset !== false){ AP.resp = 0; AP.maxD = 0; AP.wrong = 0; AP.log = []; AP.bias = 0; AP.biasS = -1; AP.stuckT = 0; }
      if (RACE.state === 'count') this.go(); const t0 = performance.now(), n = Math.round(sec*15);
      const T = window.SGTraffic, live = o.traffic && T && T.warm && !T.suspend;   // live traffic: the traffic module steps along (it stands still otherwise)
      for (let i = 0; i < n && RACE.state === 'run'; i++){ const inp = apStep(4/60); if (!inp) break; S.sim(4/60, inp); raceTick(4/60); if (live && i % 3 === 2) try { T.warm(0.2); } catch (e){ /* */ } if (o.maxMs && performance.now() - t0 > o.maxMs) break;
        if (o.stop === 'gate' && i > 30){ const P = progressOf(); if (P.dist > 30 && P.dist < 55 && RACE.d < 20) break; } }
      const P = progressOf(); return Object.assign(P, {L:Math.round(RACE.R.L), resp:AP.resp, maxOff:Math.round(AP.maxD), wrongFrames:AP.wrong, respLog:AP.log.slice(0, 8), ms:Math.round(performance.now() - t0), result:RACE.result, ai:AIs.map(a => ({s:Math.round(a.s), v:+a.v.toFixed(1), fin:a.fin ? +a.fin.toFixed(2) : 0}))}); },
    ap(on, k){ AP.on = !!on; if (k) AP.k = k; if (!on){ const S = DRV(); if (S && RACE.state === 'run') S.hold(null); } return AP.on; },
    tick:dt => { raceTick(dt || 1/60); return progressOf(); },
    // jump to checkpoint i (as if 1..i had been passed; for tests): the car stands at checkpoint i, facing along the route
    jump(i){ const R = RACE.R; if (!R || RACE.state === 'off') return null; if (RACE.state === 'count') this.go(); i = clamp(i | 0, 0, R.cps.length - 1); RACE.cp = i; RACE.splits = RACE.splits.slice(0, i); while (RACE.splits.length < i) RACE.splits.push(+RACE.t.toFixed(3));
      const c = i ? R.cps[i - 1] : null; placeOnRoute(c ? c.s : 0, laneLat(R, c ? c.k : 0)); fxRoute(); return progressOf(); },
    get RACE(){ return RACE; }, get FX(){ return FX; }, get AIs(){ return AIs; }, get HUD(){ return HUD; }, get UI(){ return UI; }, CRG, CURATED, CITY_HUBS, genRoute, uiInit, uiSync
  }
};
window.SGRace = SGRace;
}
