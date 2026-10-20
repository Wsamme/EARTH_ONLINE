// ===== City Brush v31 · lm28/army — 军队 · the army: tanks and ground troops that HINDER the creature (they can never hurt it) =====
// When a local creature game starts (window.SGKaiju, single player) the army comes in over the real roads (SGR.lines) of all three
// cities: convoys of main battle tanks, 8x8 armoured personnel carriers and troop trucks drive in on a road graph built around the
// fight (time-sliced, A* that avoids the creature), stop 300-1000 m from it between it and the player (sometimes right on the
// player's route), put concrete barriers across the road and dismount infantry squads (riflemen, machine gunners, anti-tank
// launcher teams) onto the verges. Reinforcement waves every 60-90 s (<= 30 vehicles, <= 150 soldiers alive). They fire at the
// creature's body (SGKaiju.body() spheres): tank cannon (flash cone, fireball, smoke ring, tracer; the shell bursts on its hide),
// the APC's automatic cannon, machine-gun and rifle tracers, rockets with smoke trails; every hit calls SGKaiju.hinder({x, y, z, k,
// src}) (it slows, flinches, turns on them - it never takes damage). When it comes close they retreat (troops board, or run) and
// regroup further back. The creature attacks them (its AI reads SGArmy.targets() and calls SGArmy.hit(id, {x, y, z, e, fx, fy}));
// anything under its feet / limbs / body is crushed: a hit tank brews up (fireball, the turret blown off - an SGPhys body when
// present - a burning wreck under a smoke column, ammunition cooking off), big blows throw vehicles (SGPhys), soldiers are knocked
// over, scatter and leave (no gore). Tanks, APCs, trucks and the barriers are solid for the player's car (SGF1.obstacles, when the
// drive module offers it). Sound synthesised on SGAudio's context (cannon with the distance delay of sound, bursts, the rocket's
// whoosh, the firefight, engines and tracks, radio squelch), respecting mute / master / group volumes.
// Models: original, generic, no insignia, flags, numbers or text; camouflage per city (Singapore jungle greens, Bay Area desert tan,
// New York urban greys). Instanced: two LODs per kind, one draw call per kind and level (+ shadows), soldiers animated in the vertex
// shader (run, sprint, kneel and fire, prone, crouch, aim, launcher on the shoulder, knocked down, diving), particles on the GPU.
// UI: 军队 Army 开 On / 关 Off in the 克苏鲁 pane (persisted, default on), a HUD line and a toast for each wave during a game.
// Contract: window.SGArmy {start(opts), stop(), on, enabled, targets(), hit(id, {x, y, z, e, fx, fy}), stats(), sim(sec, dt), _test}
// Sources: lm28/army/src/*.js, built by lm28/army/mk.sh -> lm28/army/army.js (load after lm25/kaiju and lm27/phys: EXTRA_MODS).
{

//<ARCORE>
// ---- 10_graph.js: the pure part (no three.js, no DOM; the node tests run it on the staged road data) ----
// Math.hypot allocates its arguments in V8 (garbage on every call): these do not
const ARH = (x, y) => Math.sqrt(x*x + y*y), ARH3 = (x, y, z) => Math.sqrt(x*x + y*y + z*z);
// A road graph around the battle: SGR.lines of classes 0-10 (no service roads, paths, foreign context) whose bounding box meets a square
// of +-R around a centre. Nodes: line ends, vertices shared by two lines (same 0.25 m cell), T junctions (a line end within 1 m of another
// line's segment) and X junctions (two ground-level segments of classes 2-10 crossing, not bridges: the simplified US data has long
// straight lines without vertices at their crossings). Edges: the line pieces between nodes (both ways; one-way lines cost more the wrong
// way: convoys may use them). Only the largest connected part is used for deployment. Built in time slices (job.step(ms)).
const ARG = (() => {
  const MAXC = 10, Q = 4;                     // classes 0-10; keys in 0.25 m units
  const keyOf = (x, y) => (Math.round(x*Q) + 524288)*1048576 + (Math.round(y*Q) + 524288);
  const CF = [1.0, 1.05, 1.0, 1.05, 1.0, 1.1, 1.05, 1.15, 1.15, 1.25, 1.6];   // cost per metre by class (convoys like big roads)
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  // per-line bounding boxes, once per lines array
  function boxes(lines, from, to, B){
    for (let i = from; i < to; i++){ const P = lines[i].P; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (let k = 0; k < P.length; k += 2){ const x = P[k], y = P[k + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      B[i*4] = x0; B[i*4 + 1] = y0; B[i*4 + 2] = x1; B[i*4 + 3] = y1; }
  }
  const BOXC = {lines:null, B:null, done:0};
  // segment intersection: t on a-b, u on c-d (proper or touching within eps)
  function segX(ax, ay, bx, by, cx, cy, dx, dy, out){
    const rx = bx - ax, ry = by - ay, sx = dx - cx, sy = dy - cy, den = rx*sy - ry*sx;
    if (Math.abs(den) < 1e-9) return false;
    const qx = cx - ax, qy = cy - ay, t = (qx*sy - qy*sx)/den, u = (qx*ry - qy*rx)/den;
    if (t <= 1e-4 || t >= 1 - 1e-4 || u <= 1e-4 || u >= 1 - 1e-4) return false;
    out[0] = t; out[1] = u; return true;
  }
  // the build job: step(ms) -> true when done; G (the graph) when done
  function job(lines, cx, cy, R){
    const J = {phase:0, i:0, lines, cx, cy, R, sel:[], G:null, ms:0, t0:now()};
    const x0 = cx - R, x1 = cx + R, y0 = cy - R, y1 = cy + R;
    let cuts = null, segGrid = null, pts = null, keyN = null;
    J.step = budget => {
      const t0 = now(), over = () => now() - t0 > budget;
      while (!J.G){
        if (J.phase === 0){            // bounding boxes (shared by every later build)
          if (BOXC.lines !== lines){ BOXC.lines = lines; BOXC.B = new Float32Array(lines.length*4); BOXC.done = 0; }
          while (BOXC.done < lines.length){ const e = Math.min(lines.length, BOXC.done + 150); boxes(lines, BOXC.done, e, BOXC.B); BOXC.done = e; if (over()) return finish(t0); }
          J.phase = 1; J.i = 0;
        }
        if (J.phase === 1){            // select the lines
          const B = BOXC.B;
          while (J.i < lines.length){ const e = Math.min(lines.length, J.i + 2000);
            for (let i = J.i; i < e; i++){ const l = lines[i]; if (l.c > MAXC || (l.flags & 8)) continue; if (B[i*4] > x1 || B[i*4 + 2] < x0 || B[i*4 + 1] > y1 || B[i*4 + 3] < y0) continue; J.sel.push(i); }
            J.i = e; if (over()) return finish(t0); }
          J.phase = 2; J.i = 0; cuts = new Map(); segGrid = new Map();
        }
        if (J.phase === 2){            // ground-level segments into a 60 m grid (for T / X junctions); resumable inside a line
          if (J.k === undefined) J.k = 0;
          while (J.i < J.sel.length){
            const li = J.sel[J.i], l = lines[li], P = l.P, E = l.E;
            if (!(l.flags & 2)) for (let k = J.k; k + 3 < P.length; k += 2){ const ev = E ? Math.max(E[k >> 1], E[(k >> 1) + 1]) : 0;
              if ((k & 63) === 0 && k > J.k && over()){ J.k = k; return finish(t0); }
              if (ev > 1.2) continue;
              const ax = P[k], ay = P[k + 1], bx = P[k + 2], by = P[k + 3];
              const gx0 = Math.floor(Math.min(ax, bx)/60), gx1 = Math.floor(Math.max(ax, bx)/60), gy0 = Math.floor(Math.min(ay, by)/60), gy1 = Math.floor(Math.max(ay, by)/60);
              if ((gx1 - gx0 + 1)*(gy1 - gy0 + 1) > 400) continue;
              for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++){ const kk = gx*100003 + gy; let a = segGrid.get(kk); if (!a){ a = []; segGrid.set(kk, a); } a.push(li, k); } }
            J.i++; J.k = 0; if ((J.i & 7) === 0 && over()) return finish(t0); }
          J.phase = 3; J.cells = [...segGrid.entries()]; J.i = 0;
        }
        if (J.phase === 3){            // crossings and T junctions -> cut points on the lines (the same point inserted into both)
          const o = [0, 0];
          const addCut = (li, k, t, x, y) => { let a = cuts.get(li); if (!a){ a = []; cuts.set(li, a); } a.push(k + t*2, x, y); };
          while (J.i < J.cells.length){ const e = Math.min(J.cells.length, J.i + 1);
            for (let ci = J.i; ci < e; ci++){ const C = J.cells[ci][1], ck = J.cells[ci][0], cgx = Math.round(ck/100003), cgy = ck - cgx*100003;
              const inCell = (x, y) => Math.floor(x/60) === cgx && Math.floor(y/60) === cgy;
              for (let a = 0; a < C.length; a += 2){ const la = C[a], ka = C[a + 1], LA = lines[la], PA = LA.P;
                const ax = PA[ka], ay = PA[ka + 1], bx = PA[ka + 2], by = PA[ka + 3];
                for (let b = a + 2; b < C.length; b += 2){ const lb = C[b], kb = C[b + 1]; if (lb === la) continue; const LB = lines[lb], PB = LB.P;
                  const cx_ = PB[kb], cy_ = PB[kb + 1], dx = PB[kb + 2], dy = PB[kb + 3];
                  // X: both ordinary streets at grade
                  if (LA.c >= 2 && LB.c >= 2 && segX(ax, ay, bx, by, cx_, cy_, dx, dy, o)){ const x = ax + (bx - ax)*o[0], y = ay + (by - ay)*o[0];
                    if (inCell(x, y)){ addCut(la, ka, o[0], x, y); addCut(lb, kb, o[1], x, y); } }
                }
              }
              // T: a line end on another line's segment (within 1 m)
              for (let a = 0; a < C.length; a += 2){ const la = C[a], ka = C[a + 1], PA = lines[la].P, nA = PA.length;
                for (let end = 0; end <= nA - 2; end += nA - 2){ if (ka !== end && ka + 2 !== end) continue; const ex = PA[end], ey = PA[end + 1]; if (!inCell(ex, ey)) continue;
                  for (let b = 0; b < C.length; b += 2){ const lb = C[b], kb = C[b + 1]; if (lb === la) continue; const PB = lines[lb].P;
                    const cx_ = PB[kb], cy_ = PB[kb + 1], dx = PB[kb + 2] - cx_, dy = PB[kb + 3] - cy_, L2 = dx*dx + dy*dy; if (L2 < 1e-6) continue;
                    const t = ((ex - cx_)*dx + (ey - cy_)*dy)/L2; if (t <= 0.002 || t >= 0.998) continue;
                    const px = cx_ + dx*t - ex, py = cy_ + dy*t - ey; if (px*px + py*py > 1.0) continue;
                    addCut(lb, kb, t, ex, ey); } } }
            }
            J.i = e; if (over()) return finish(t0); }
          J.phase = 4; J.i = 0; pts = new Array(J.sel.length); keyN = new Map();
        }
        if (J.phase === 4){            // the lines' points with the cuts inserted; vertex use counts
          while (J.i < J.sel.length){ const e = Math.min(J.sel.length, J.i + 8);
            for (let s = J.i; s < e; s++){ const li = J.sel[s], l = lines[li], P = l.P, E = l.E, n = P.length >> 1, C = cuts.get(li);
              const X = [], Y = [], Z = [];
              let ci = 0, CC = null; if (C){ CC = []; for (let q = 0; q < C.length; q += 3) CC.push([C[q], C[q + 1], C[q + 2]]); CC.sort((a, b) => a[0] - b[0]); }
              for (let k = 0; k < n; k++){
                X.push(P[2*k]); Y.push(P[2*k + 1]); Z.push(E ? E[k] : 0);
                if (CC) while (ci < CC.length && CC[ci][0] < 2*k + 2){ const c = CC[ci++], f = (c[0] - 2*k)/2; if (f <= 0 || f >= 1) continue;
                  const lx = X[X.length - 1], ly = Y[Y.length - 1]; if (Math.abs(c[1] - lx) < 0.3 && Math.abs(c[2] - ly) < 0.3) continue;
                  X.push(c[1]); Y.push(c[2]); Z.push(E && k + 1 < n ? E[k] + (E[k + 1] - E[k])*f : (E ? E[k] : 0)); }
              }
              pts[s] = {X, Y, Z};
              for (let k = 0; k < X.length; k++){ const kk = keyOf(X[k], Y[k]); keyN.set(kk, (keyN.get(kk) || 0) + (k === 0 || k === X.length - 1 ? 2 : 1)); }
            }
            J.i = e; if (over()) return finish(t0); }
          J.phase = 5; J.i = 0;
          J.N = {map:new Map(), X:[], Y:[], Z:[]}; J.Ed = {a:[], b:[], len:[], cls:[], ow:[], off:[0], gx:[], gy:[], gz:[], line:[]};
        }
        if (J.phase === 5){            // nodes and edges
          const N = J.N, Ed = J.Ed;
          const node = (x, y, z) => { const kk = keyOf(x, y); let i = N.map.get(kk); if (i === undefined){ i = N.X.length; N.map.set(kk, i); N.X.push(x); N.Y.push(y); N.Z.push(z); } return i; };
          while (J.i < J.sel.length){ const e = Math.min(J.sel.length, J.i + 8);
            for (let s = J.i; s < e; s++){ const li = J.sel[s], l = lines[li], p = pts[s], n = p.X.length; if (n < 2) continue;
              let a = node(p.X[0], p.Y[0], p.Z[0]), k0 = 0, len = 0;
              for (let k = 1; k < n; k++){ len += ARH(p.X[k] - p.X[k - 1], p.Y[k] - p.Y[k - 1]);
                if (k === n - 1 || keyN.get(keyOf(p.X[k], p.Y[k])) > 1){ const b = node(p.X[k], p.Y[k], p.Z[k]);
                  if (b !== a && len > 0.5){ Ed.a.push(a); Ed.b.push(b); Ed.len.push(len); Ed.cls.push(l.c); Ed.ow.push(l.flags & 1); Ed.line.push(li);
                    for (let q = k0; q <= k; q++){ Ed.gx.push(p.X[q]); Ed.gy.push(p.Y[q]); Ed.gz.push(p.Z[q]); } Ed.off.push(Ed.gx.length); }
                  a = b; k0 = k; len = 0; } }
            }
            J.i = e; if (over()) return finish(t0); }
          J.phase = 6;
        }
        if (J.phase >= 6 && J.phase <= 8){ compile(J, J.phase - 6); cuts = segGrid = pts = keyN = null; J.cells = null; J.phase++; if (J.phase === 9) J.G = J.C; if (over()) return finish(t0); }
      }
      return finish(t0);
    };
    function finish(t0){ J.ms += now() - t0; return !!J.G; }
    return J;
  }
  // typed arrays, CSR adjacency, the largest component, a node grid
  function compile(J, part){
    if (part === 1) return compile1(J.C);
    if (part === 2) return compile2(J.C);
    const N = J.N, Ed = J.Ed, nn = N.X.length, ne = Ed.a.length;
    const G = J.C = {n:nn, ne, cx:J.cx, cy:J.cy, R:J.R, X:Float64Array.from(N.X), Y:Float64Array.from(N.Y), Z:Float32Array.from(N.Z),
      ea:Int32Array.from(Ed.a), eb:Int32Array.from(Ed.b), elen:Float32Array.from(Ed.len), ecls:Uint8Array.from(Ed.cls), eow:Uint8Array.from(Ed.ow), eline:Int32Array.from(Ed.line),
      goff:Int32Array.from(Ed.off), gx:Float32Array.from(Ed.gx), gy:Float32Array.from(Ed.gy), gz:Float32Array.from(Ed.gz), ms:0, lines:J.lines.length};
    const deg = new Int32Array(nn + 1); for (let e = 0; e < ne; e++){ deg[G.ea[e]]++; deg[G.eb[e]]++; }
    const off = new Int32Array(nn + 1); for (let i = 0; i < nn; i++) off[i + 1] = off[i] + deg[i];
    const adj = new Int32Array(off[nn]), fill = off.slice(0, nn);
    for (let e = 0; e < ne; e++){ adj[fill[G.ea[e]]++] = e; adj[fill[G.eb[e]]++] = e; }
    G.off = off; G.adj = adj; G.deg = deg;
    J.N = J.Ed = null;
  }
  function compile1(G){
    const nn = G.n, ne = G.ne, off = G.off, adj = G.adj;
    // components
    const comp = new Int32Array(nn).fill(-1), stack = []; let nc = 0, best = -1, bestN = 0;
    for (let s = 0; s < nn; s++){ if (comp[s] >= 0) continue; let cnt = 0; comp[s] = nc; stack.push(s);
      while (stack.length){ const v = stack.pop(); cnt++; for (let q = off[v]; q < off[v + 1]; q++){ const e = adj[q], w = G.ea[e] === v ? G.eb[e] : G.ea[e]; if (comp[w] < 0){ comp[w] = nc; stack.push(w); } } }
      if (cnt > bestN){ bestN = cnt; best = nc; } nc++; }
    G.comp = comp; G.main = best; G.mainN = bestN; G.nComp = nc;
    // best class touching each node
    const ncls = new Uint8Array(nn).fill(255); for (let e = 0; e < ne; e++){ const c = G.ecls[e]; if (c < ncls[G.ea[e]]) ncls[G.ea[e]] = c; if (c < ncls[G.eb[e]]) ncls[G.eb[e]] = c; }
    G.ncls = ncls;
  }
  function compile2(G){
    const nn = G.n, ne = G.ne;
    // node grid (100 m)
    const grid = new Map(); for (let i = 0; i < nn; i++){ const k = Math.floor(G.X[i]/100)*100003 + Math.floor(G.Y[i]/100); let a = grid.get(k); if (!a){ a = []; grid.set(k, a); } a.push(i); }
    G.grid = grid;
    // A* scratch
    G.gs = new Float64Array(nn); G.fs = new Float64Array(nn); G.from = new Int32Array(nn); G.fromE = new Int32Array(nn); G.seen = new Int32Array(nn); G.stamp = 0; G.heap = new Int32Array(Math.max(16, ne*2 + 16));
    return G;
  }
  // nearest node of the main component within r (filter(i) optional)
  function nearest(G, x, y, r, filter){
    let best = -1, bd = r*r; const g0x = Math.floor((x - r)/100), g1x = Math.floor((x + r)/100), g0y = Math.floor((y - r)/100), g1y = Math.floor((y + r)/100);
    for (let gy = g0y; gy <= g1y; gy++) for (let gx = g0x; gx <= g1x; gx++){ const a = G.grid.get(gx*100003 + gy); if (!a) continue;
      for (const i of a){ if (G.comp[i] !== G.main) continue; const dx = G.X[i] - x, dy = G.Y[i] - y, d = dx*dx + dy*dy; if (d < bd && (!filter || filter(i))){ bd = d; best = i; } } }
    return best;
  }
  // A* as a job that runs over several frames (one at a time per graph: the scratch arrays are shared): step(ms) -> undefined while
  // running, then the path or null
  function astarJob(G, s, t, avoid){
    if (s < 0 || t < 0 || G.comp[s] !== G.comp[t]) return {step:() => null, done:true, path:null};
    const st = ++G.stamp, gs = G.gs, fs = G.fs, from = G.from, fromE = G.fromE, seen = G.seen, H = G.heap, tx = G.X[t], ty = G.Y[t];
    let hn = 0, it = 0;
    const push = v => { let i = hn++; H[i] = v; while (i > 0){ const p = (i - 1) >> 1; if (fs[H[p]] <= fs[v]) break; H[i] = H[p]; i = p; } H[i] = v; };
    const pop = () => { const top = H[0], v = H[--hn]; let i = 0; for (;;){ let c = 2*i + 1; if (c >= hn) break; if (c + 1 < hn && fs[H[c + 1]] < fs[H[c]]) c++; if (fs[H[c]] >= fs[v]) break; H[i] = H[c]; i = c; } H[i] = v; return top; };
    seen[s] = st; gs[s] = 0; fs[s] = ARH(G.X[s] - tx, G.Y[s] - ty); from[s] = -1; fromE[s] = -1; push(s);
    const J = {done:false, path:undefined, it:0, ms:0};
    J.step = budget => {
      if (J.done) return J.path;
      if (G.stamp !== st){ J.done = true; return J.path = null; }       // another search took the scratch arrays
      const t0 = now();
      while (hn > 0){
        const v = pop(); if (v === t){ hn = 0; break; } if (++it > 400000){ J.done = true; return J.path = null; }
        for (let q = G.off[v]; q < G.off[v + 1]; q++){ const e = G.adj[q], fwd = G.ea[e] === v, w = fwd ? G.eb[e] : G.ea[e];
          let c = G.elen[e]*CF[G.ecls[e]]*(G.eow[e] && !fwd ? 2.5 : 1);
          if (avoid){ const o0 = G.goff[e], o1 = G.goff[e + 1] - 1, mx = (G.gx[o0] + G.gx[o1])*0.5, my = (G.gy[o0] + G.gy[o1])*0.5; c *= avoid(mx, my); }
          const ng = gs[v] + c;
          if (seen[w] !== st || ng < gs[w]){ seen[w] = st; gs[w] = ng; fs[w] = ng + ARH(G.X[w] - tx, G.Y[w] - ty); from[w] = v; fromE[w] = e; if (hn < H.length) push(w); } }
        if ((it & 63) === 0 && now() - t0 > budget){ J.ms += now() - t0; J.it = it; return undefined; }
      }
      J.ms += now() - t0; J.it = it; J.done = true;
      return J.path = seen[t] === st ? trace(G, s, t) : null;
    };
    return J;
  }
  function trace(G, s, t){
    const from = G.from, fromE = G.fromE;
    const E = []; for (let v = t; v !== s; v = from[v]){ E.push(fromE[v]); if (E.length > 100000) return null; } E.reverse();
    const X = [], Y = [], Z = []; let v = s;
    for (const e of E){ const fwd = G.ea[e] === v, o0 = G.goff[e], o1 = G.goff[e + 1];
      if (fwd) for (let q = o0; q < o1; q++){ if (X.length && q === o0) continue; X.push(G.gx[q]); Y.push(G.gy[q]); Z.push(G.gz[q]); }
      else for (let q = o1 - 1; q >= o0; q--){ if (X.length && q === o1 - 1) continue; X.push(G.gx[q]); Y.push(G.gy[q]); Z.push(G.gz[q]); }
      v = fwd ? G.eb[e] : G.ea[e]; }
    if (!X.length){ X.push(G.X[s]); Y.push(G.Y[s]); Z.push(G.Z[s]); }
    return mkPath(X, Y, Z, E.length);
  }
  // A* in one go (tests): edge cost = length x class factor x (wrong way on a one-way line 2.5) x avoid(mid x, mid y) (>= 1)
  function astar(G, s, t, avoid){ const J = astarJob(G, s, t, avoid); let p; while ((p = J.step(1e9)) === undefined); return p; }
  // a path: points, cumulative distance, speed limits from the turn angles
  function mkPath(X, Y, Z, ne){
    const n = X.length, P = {n, X:Float64Array.from(X), Y:Float64Array.from(Y), Z:Float32Array.from(Z), S:new Float64Array(n), V:new Float32Array(n), L:0, edges:ne || 0};
    for (let i = 1; i < n; i++) P.S[i] = P.S[i - 1] + ARH(X[i] - X[i - 1], Y[i] - Y[i - 1]);
    P.L = P.S[n - 1];
    for (let i = 0; i < n; i++){
      if (i === 0 || i === n - 1){ P.V[i] = 30; continue; }
      // the turn over ~15 m around this vertex
      let a = i - 1, b = i + 1; while (a > 0 && P.S[i] - P.S[a] < 12) a--; while (b < n - 1 && P.S[b] - P.S[i] < 12) b++;
      const ux = X[i] - X[a], uy = Y[i] - Y[a], vx = X[b] - X[i], vy = Y[b] - Y[i], lu = ARH(ux, uy) || 1, lv = ARH(vx, vy) || 1;
      const c = (ux*vx + uy*vy)/(lu*lv), ang = Math.acos(Math.max(-1, Math.min(1, c)));
      P.V[i] = ang < 0.12 ? 30 : Math.max(3.5, Math.min(30, 9/ang));
    }
    return P;
  }
  // position on a path at distance s (clamped), lateral offset lat (+ = left of travel), into out {x, y, z, hx, hy}
  function at(P, s, lat, out){
    const n = P.n; if (n === 1){ out.x = P.X[0]; out.y = P.Y[0]; out.z = P.Z[0]; out.hx = 1; out.hy = 0; out.i = 0; return out; }
    s = s < 0 ? 0 : s > P.L ? P.L : s;
    let i = out.i !== undefined && out.i >= 0 && out.i < n - 1 && P.S[out.i] <= s ? out.i : 0;
    while (i < n - 2 && P.S[i + 1] < s) i++;
    const seg = P.S[i + 1] - P.S[i], f = seg > 1e-6 ? (s - P.S[i])/seg : 0;
    let dx = P.X[i + 1] - P.X[i], dy = P.Y[i + 1] - P.Y[i]; const l = ARH(dx, dy) || 1; dx /= l; dy /= l;
    out.x = P.X[i] + (P.X[i + 1] - P.X[i])*f - dy*lat; out.y = P.Y[i] + (P.Y[i + 1] - P.Y[i])*f + dx*lat;
    out.z = P.Z[i] + (P.Z[i + 1] - P.Z[i])*f; out.hx = dx; out.hy = dy; out.i = i;
    return out;
  }
  // the speed limit ahead over the next d metres (curves)
  function vAhead(P, s, d, i0){
    let i = i0 || 0; while (i < P.n - 1 && P.S[i] < s) i++;
    let v = 30; for (; i < P.n && P.S[i] < s + d; i++){ const dd = Math.max(0, P.S[i] - s), lim = Math.sqrt(P.V[i]*P.V[i] + 2*2.5*dd); if (lim < v) v = lim; }
    return v;
  }
  return {job, nearest, astar, astarJob, mkPath, at, vAhead, keyOf, CF, BOXC};
})();

// ---- 11_army.js: the army's simulation (pure): waves, convoys, roadblocks, fire control, retreat / regroup, the creature's blows ----
// World x east, y north, z up (metres); headings h = math angle (rad from +x, counter-clockwise). env supplies the world:
//   ground(x, y), lines, side (+1 keep left, -1 keep right), K (the creature, refreshed by the caller every frame: {on, fire, x, y, vx,
//   vy, n, S:Float32Array(4 x 32) spheres x y z r}), PL (the player {x, y, vx, vy}), CAM ({x, y, z}), hinder(x, y, z, k, src),
//   fx (callbacks for the view: see FXNULL), rand().
const ARC = (() => {
  const PI = Math.PI, TAU = PI*2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const wrap = a => { a = (a + PI) % TAU; if (a < 0) a += TAU; return a - PI; };
  // vehicles: sizes (m), masses, speeds, turret pivot (x, z), gun trunnion (x, z) and length, fire control
  const SPEC = {
    tank:{kind:'tank', L:7.7, W:3.7, H:2.45, hx:3.85, hy:1.85, m:56000, v:17, acc:2.4, r:4.4, hp:2, tx:-0.3, tz:1.62, gx:1.55, gz:2.02, glen:5.3,
      gun:{rate:0.6, elev:[-0.12, 0.38], reload:[6.5, 9.5], range:[120, 2600], kind:'shell'}, mg:{x:-0.55, y:-0.55, z:2.95, range:1300}},
    apc:{kind:'apc', L:7.9, W:2.95, H:2.3, hx:3.95, hy:1.48, m:24000, v:19, acc:2.8, r:4.2, hp:1.2, tx:0.7, tz:2.18, gx:0.75, gz:2.5, glen:2.6,
      gun:{rate:1.1, elev:[-0.15, 0.85], reload:[2.4, 4.0], range:[60, 2000], kind:'ac'}, seats:8},
    truck:{kind:'truck', L:8.3, W:2.55, H:3.25, hx:4.15, hy:1.28, m:13000, v:19, acc:2.2, r:4.2, hp:0.8, seats:12}
  };
  const SOL = {run:4.3, sprint:6.2, reach:{rifle:750, mg:900, at:650}};
  // the weight k (0-1) of each hit on the creature (SGKaiju.hinder): shells and rockets go at once, small arms add up per unit (<= 0.15 / 0.6 s)
  const HK = {shell:0.45, rocket:0.35, ac:0.04, mg:0.04, rifle:0.012};
  const CAPS = {veh:30, sol:150, wreck:12};
  const KINDN = {tank:'tank', apc:'apc', truck:'apc'};
  // anim ids for the view (soldier vertex shader)
  const AN = {stand:0, run:1, kneel:2, prone:3, crouch:4, sprint:5, down:6, aim:7, tube:8, dive:9};
  const FXNULL = {cannon(){}, ac(){}, mg(){}, rifle(){}, rocket(){}, impact(){}, brew(){}, turretPop(){}, knock(){}, wave(){}, dismount(){}, crushed(){}, retreat(){}};

  function Army(env, opts){
    opts = opts || {};
    const R = env.rand || Math.random;
    const A = {on:false, T:0, V:[], S:[], Q:[], D:[], req:[], plan:null, G:null, job:null, gc:null, nid:1, wave:0, nextWave:0, ceaseT:0, imp:[], impN:0,
      st:{shots:0, shells:0, rockets:0, bursts:0, hits:0, misses:0, hinders:0, hinderK:0, destroyed:0, crushed:0, thrown:0, knocked:0, waves:0, retreats:0, advances:0, spawnV:0, spawnS:0, pathFail:0, gone:0},
      msg:null, ms:0, msMax:0, tgt:[], tgtPool:[], hk:[], hkN:0, hkT:0, tidyT:0, profT:0, fx:env.fx || FXNULL, firstWave:opts.firstWave === undefined ? 6 : opts.firstWave, interval:opts.interval || [60, 90], scale:opts.scale || 1};
    const K = env.K, PL = env.PL, CAM = env.CAM;
    const tmp = {i:0}, tmp2 = {i:0};
    for (let i = 0; i < 256; i++) A.imp.push({t:-1, kind:'', idx:0, ox:0, oy:0, oz:1, k:0, u:null});

    // ---------------------------------------------------------------- the road graph around the fight (rebuilt in slices as it moves)
    function graphStep(budget){
      if (A.job){ if (A.job.step(budget)){ A.G = A.job.G; A.gc = [A.job.cx, A.job.cy]; A.job = null; } return; }
      const cx = K.on ? (K.x*0.55 + PL.x*0.45) : PL.x, cy = K.on ? (K.y*0.55 + PL.y*0.45) : PL.y;
      if (!A.G || ARH(cx - A.gc[0], cy - A.gc[1]) > 1500) A.job = ARG.job(env.lines, cx, cy, 3600);
    }
    // the graph at once (tests / screenshots)
    function graphNow(){ if (!A.job) graphStep(0); if (A.job){ A.job.step(1e9); graphStep(0); } return A.G; }
    // ---------------------------------------------------------------- deployment: where to stand, where to come from
    function nodeOk(G, i){ return G.comp[i] === G.main && G.Z[i] < 0.6; }
    function pickAnchor(mode, exclude){
      const G = A.G; if (!G || !K.on) return -1;
      let bx = PL.x - K.x, by = PL.y - K.y, bl = ARH(bx, by); if (bl < 1){ bx = 1; by = 0; bl = 1; } const ux = bx/bl, uy = by/bl;
      const sp = ARH(PL.vx, PL.vy), rx = PL.x + PL.vx*clamp(25, 0, 700/Math.max(sp, 1)), ry = PL.y + PL.vy*clamp(25, 0, 700/Math.max(sp, 1));
      const rng = mode === 'retreat' ? [620, 1100, 820] : mode === 'advance' ? [450, 1000, 650] : mode === 'route' ? [330, 1050, 600] : [330, 1000, 620];
      let best = -1, bs = -1e9, dcx = 0, dcy = 0, dn = 0;
      if (exclude){ for (let i = 0; i < exclude.V.length; i++){ const V = exclude.V[i]; if (alive(V) && V.st !== 'queue'){ dcx += V.x; dcy += V.y; dn++; } } if (dn){ dcx /= dn; dcy /= dn; } else { dcx = exclude.ax; dcy = exclude.ay; dn = 1; } }
      const kv = ARH(K.vx, K.vy), kux = kv > 1 ? K.vx/kv : 0, kuy = kv > 1 ? K.vy/kv : 0;
      // where the creature will be when the convoy gets there (a new position ahead of it, a retreat from where it is about to be)
      const lead = mode === 'retreat' ? 8 : mode === 'advance' ? 15 : 25, kx = K.x + K.vx*lead, ky = K.y + K.vy*lead;
      for (let i = 0; i < G.n; i++){
        if (!nodeOk(G, i)) continue;
        const dx = G.X[i] - kx, dy = G.Y[i] - ky, d = ARH(dx, dy); if (d < rng[0] || d > rng[1]) continue;
        if (ARH(G.X[i] - K.x, G.Y[i] - K.y) < rng[0]*0.8) continue;
        let s = -Math.abs(d - rng[2])/260 + (bl > 200 ? 1.5*(dx*ux + dy*uy)/d : 0);
        if (mode === 'route' && sp > 2){
          const qx = rx - PL.x, qy = ry - PL.y, ql = qx*qx + qy*qy, t = clamp(((G.X[i] - PL.x)*qx + (G.Y[i] - PL.y)*qy)/ql, 0, 1), ex = PL.x + qx*t - G.X[i], ey = PL.y + qy*t - G.Y[i];
          s += 2.6*Math.exp(-ARH(ex, ey)/70) + (t > 0.15 ? 0.5 : -0.5);
        }
        const c = G.ncls[i]; s += c <= 6 ? 0.45 : c <= 8 ? 0.2 : 0;
        if (G.deg[i] >= 3) s += 0.2;
        for (const D of A.D){ if (D === exclude || D.st === 'gone') continue; const ddx = D.ax - G.X[i], ddy = D.ay - G.Y[i]; if (ddx*ddx + ddy*ddy < 230*230) s -= 3; }
        if (ARH(G.X[i] - PL.x, G.Y[i] - PL.y) < 60) s -= 1;     // not on top of the player
        if (dn){ s -= ARH(G.X[i] - dcx, G.Y[i] - dcy)/450; if (kv > 1) s -= 1.2*Math.max(0, (dx*kux + dy*kuy)/d); }   // a short drive, out of its path
        s += R()*0.7;
        if (s > bs){ bs = s; best = i; }
      }
      return best;
    }
    function avoidFn(){ const kx = K.x, ky = K.y, px = K.x + K.vx*20, py = K.y + K.vy*20;
      return (x, y) => { const d1 = ARH(x - kx, y - ky), d2 = ARH(x - px, y - py), a = Math.max(0, 1 - d1/500), b = Math.max(0, 1 - d2/420); return 1 + 45*a*a + 25*b*b; }; }
    function pickSpawn(anchor){
      const G = A.G, ax = G.X[anchor], ay = G.Y[anchor], dka = ARH(ax - K.x, ay - K.y), C = [];
      for (let i = 0; i < G.n; i++){
        if (!nodeOk(G, i) || i === anchor) continue;
        const d = ARH(G.X[i] - ax, G.Y[i] - ay); if (d < (A.wave <= 1 ? 300 : 420) || d > 1300) continue;
        const dk = ARH(G.X[i] - K.x, G.Y[i] - K.y); if (dk < dka + 180) continue;
        const dc = ARH(G.X[i] - CAM.x, G.Y[i] - CAM.y);
        let s = -Math.abs(d - (A.wave <= 1 ? 400 : 720))/350 + (dk - dka)/700 + (G.ncls[i] <= 6 ? 0.5 : 0) + (dc < 380 ? -2 : 0) + R()*0.6;
        C.push(s, i);
      }
      const out = []; for (let k = 0; k < 4 && C.length; k++){ let bi = -1, bs = -1e9; for (let j = 0; j < C.length; j += 2) if (C[j] > bs){ bs = C[j]; bi = j; } if (bi < 0) break; out.push(C[bi + 1]); C[bi] = -1e9; }
      return out;
    }
    // ---------------------------------------------------------------- units
    function mkVeh(kind, D){
      const sp = SPEC[kind], n = A.nid++;
      const V = {id:'v' + n, n, kind, sp, D, st:'queue', x:0, y:0, z:0, h:0, pitch:0, roll:0, v:0, path:null, s:0, lane:0, pc:{i:0}, slot:null, ord:0,
        ty:0, gp:0, aimI:-1, aimT:0, reload:2 + R()*4, mgT:R()*3, mgN:0, mgDt:0, acN:0, acDt:0, recoil:0, rock:0, hp:sp.hp, burn:0, burnT:0, tGone:0, phys:-1,
        q:[0, 0, 0, 1], useQ:false, wreckT:0, crushed:0, carry:[], lamp:0, trk:0, whl:0, svx:0, svy:0, tvx:0, tvy:0, tvz:0, tw:[0, 0, 0], seed:R(), lod:0, hk:0, hx:0, hy:0, hz:0, born:A.T, waitT:0, hidden:true, fireN:0, mgI:-1, mgS:-9, cx:0, cy:0, cz:0, physT:0};
      A.V.push(V); D.V.push(V); A.st.spawnV++; return V;
    }
    function mkSquad(kind, D, carrier, roles){
      const n = A.nid++, Q = {id:'q' + n, n, kind, D, carrier, men:[], st:'ride', cx:0, cy:0, r:6, hk:0, hx:0, hy:0, hz:0, kindT:kind, mgS:-9};
      for (const role of roles){
        const S = {n:A.nid++, Q, role, st:'ride', x:0, y:0, z:0, h:0, vx:0, vy:0, vz:0, tx:0, ty:0, th:0, anim:AN.stand, animP:AN.stand, bl:1, ph:R(), fireT:2 + R()*5, fp:0, burst:0, burstDt:0,
          aim:0, look:0, downT:0, tumble:0, tumbleK:1, seed:R(), skin:R(), pose:role === 'at' ? AN.tube : (R() < 0.3 ? AN.prone : R() < 0.75 ? AN.kneel : AN.aim), hidden:true, outT:0, leaveT:0, lod:0, slotX:0, slotY:0, back:0, aimI:-1, coverT:0};
        Q.men.push(S); A.S.push(S);
      }
      A.Q.push(Q); D.Q.push(Q); if (carrier) carrier.carry.push(Q); A.st.spawnS += roles.length; return Q;
    }
    const alive = V => V.st !== 'wreck' && V.st !== 'gone' && V.st !== 'thrown';
    const visS = S => S.st !== 'ride' && S.st !== 'gone';
    function counts(){
      let veh = 0, tanks = 0, apcs = 0, trucks = 0, wrecks = 0, sol = 0, active = 0;
      for (const V of A.V){ if (V.st === 'gone') continue; if (alive(V)){ veh++; if (V.kind === 'tank') tanks++; else if (V.kind === 'apc') apcs++; else trucks++; } else wrecks++; }
      for (const S of A.S){ if (S.st === 'gone') continue; sol++; if (S.st !== 'leave' && S.st !== 'flee') active++; }
      return {veh, tanks, apcs, trucks, wrecks, sol, active};
    }
    // ---------------------------------------------------------------- waves
    const WAVES = [[3, 2, 1], [3, 1, 2], [4, 2, 1], [4, 2, 2], [3, 2, 2], [3, 1, 1]];   // tanks, APCs, trucks
    function spawnWave(){
      if (!A.G || !K.on) return false;
      const c = counts(); let [nt, na, nk] = WAVES[Math.min(A.wave, WAVES.length - 1)];
      for (const r of A.req){ c.veh += r.t + r.a + r.k; c.sol += r.a*8 + r.k*10; }
      nt = Math.round(nt*A.scale); na = Math.round(na*A.scale); nk = Math.round(nk*A.scale);
      // caps: vehicles and soldiers alive
      let room = CAPS.veh - c.veh; const sRoom = CAPS.sol - c.sol;
      nt = Math.min(nt, room); room -= nt; na = Math.min(na, room, Math.floor(sRoom/8)); room -= na; nk = Math.min(nk, room, Math.max(0, Math.floor((sRoom - na*8)/10)));
      if (nt + na + nk <= 0) return false;
      // one or two detachments: armour on the player's route, the rest in a firing line between the creature and the player
      const parts = (nt + na + nk) >= 5 ? [[Math.ceil(nt*0.6), Math.min(1, na), 0, 'route'], [nt - Math.ceil(nt*0.6), na - Math.min(1, na), nk, 'line']] : [[nt, na, nk, A.wave % 2 ? 'route' : 'line']];
      // planned over the next frames (one search per frame: no hitch)
      for (const [t, a, k, mode] of parts) if (t + a + k > 0) A.req.push({mode, t, a, k, an:undefined, sp:null, i:0, wave:A.wave + 1});
      A.wave++; A.st.waves++;
      A.msg = {t:A.T, wave:A.wave, tanks:nt, apcs:na, trucks:nk}; A.fx.wave(A.msg);
      return true;
    }
    // ---------------------------------------------------------------- the planner: one road search at a time, run over several frames
    // (wave requests first, then detachments that want to move); A.plan = {kind:'req' | 'move', ...}
    function planStep(budget){
      if (!A.G || !K.on) return;
      if (!A.plan){
        let Dr = null, Dm = null; for (const D of A.D){ if (!D.want || D.st === 'gone') continue; if (D.want === 'retreat'){ Dr = D; break; } if (!Dm) Dm = D; }
        if (Dr) A.plan = {kind:'move', D:Dr, mode:'retreat', an:undefined, job:null};
        else if (A.req.length) A.plan = {kind:'req', r:A.req.shift(), an:undefined, sp:null, i:0, job:null};
        else if (Dm) A.plan = {kind:'move', D:Dm, mode:Dm.want, an:undefined, job:null};
        if (!A.plan) return;
      }
      const P = A.plan;
      if (P.kind === 'req'){
        const r = P.r;
        if (P.an === undefined){ P.an = pickAnchor(r.mode); if (P.an < 0){ A.plan = null; A.st.pathFail++; } return; }
        if (!P.sp){ P.sp = pickSpawn(P.an); if (!P.sp.length){ A.plan = null; A.st.pathFail++; } return; }
        if (!P.job){ if (P.i >= P.sp.length){ A.plan = null; A.st.pathFail++; return; } P.job = ARG.astarJob(A.G, P.sp[P.i++], P.an, avoidFn()); }
        const path = P.job.step(budget); if (path === undefined) return;
        P.job = null; if (!path || path.L < 200) return;
        A.plan = null;
        const G = A.G, D = {n:A.nid++, mode:r.mode, st:'move', ax:G.X[P.an], ay:G.Y[P.an], node:P.an, V:[], Q:[], path, planT:2, born:A.T, fx:0, fy:0, moves:0, holdT:0, wave:r.wave, want:null, bars:false, boardT:0, next:null, order:null};
        A.D.push(D);
        for (let i = 0; i < r.t; i++) mkVeh('tank', D);
        for (let i = 0; i < r.a; i++){ const V = mkVeh('apc', D); mkSquad('squad', D, V, ['rifle', 'rifle', 'mg', 'rifle', 'rifle', 'rifle']); mkSquad('launcher', D, V, ['at', 'rifle']); }
        for (let i = 0; i < r.k; i++){ const V = mkVeh('truck', D); mkSquad('squad', D, V, ['rifle', 'rifle', 'mg', 'rifle', 'rifle', 'at', 'rifle', 'rifle', 'mg', 'rifle']); }
        convoy(D, path);
        return;
      }
      // a detachment moves (retreat / advance): its new anchor, then the road there from the node nearest to its vehicles
      const D = P.D;
      if (D.st === 'gone' || !D.want){ A.plan = null; return; }
      if (P.an === undefined){ P.an = pickAnchor(P.mode, D); if (P.an < 0){ A.plan = null; D.want = null; D.planT = 4; } return; }
      if (!P.job){
        let cx = 0, cy = 0, n = 0; for (const V of D.V) if (alive(V) && V.st !== 'queue'){ cx += V.x; cy += V.y; n++; }
        if (!n){ cx = D.ax; cy = D.ay; } else { cx /= n; cy /= n; }
        const s0 = ARG.nearest(A.G, cx, cy, 400); if (s0 < 0){ A.plan = null; D.want = null; D.planT = 4; A.st.pathFail++; return; }
        P.job = ARG.astarJob(A.G, s0, P.an, avoidFn()); }
      const path = P.job.step(budget); if (path === undefined) return;
      A.plan = null; D.want = null;
      if (!path || path.L < 60){ A.st.pathFail++; D.planT = 3; return; }
      moveOut(D, P.mode, P.an, path);
    }
    // vehicles enter the path one after the other; order: tanks first (they lead), then APCs, then trucks
    function convoy(D, path){
      const L = D.V.filter(alive).sort((a, b) => (a.kind === 'tank' ? 0 : a.kind === 'apc' ? 1 : 2) - (b.kind === 'tank' ? 0 : b.kind === 'apc' ? 1 : 2));
      D.order = L; D.path = path; D.st = 'move';
      L.forEach((V, i) => { V.ord = i; V.path = path; V.s = 0; V.pc.i = 0; V.v = 0; V.st = 'queue'; V.hidden = true; V.slot = null; V.lane = (env.side || 1)*(V.kind === 'tank' ? 2.1 : 2.4); });
    }
    // ---------------------------------------------------------------- slots at the anchor (on the approach road: a roadblock across it at the
    // front, the rest behind; infantry on the verges / pavements either side, launcher teams at the front corners)
    function slots(D){
      const P = D.path, L = P.L, f = ARG.at(P, L, 0, tmp), hx = f.hx, hy = f.hy, kx = K.x - D.ax, ky = K.y - D.ay, kl = ARH(kx, ky) || 1;
      D.fx = kx/kl; D.fy = ky/kl;
      const face = Math.atan2(ky, kx);
      let iv = 0, tk = 0;
      for (const V of D.order){ if (!alive(V)) continue;
        let s, lat, h;
        if (V.kind === 'tank' && tk < 2){ s = L - 3; lat = (tk === 0 ? 1 : -1)*2.7; h = face; tk++; }
        else { s = Math.max(5, L - 14 - 15*iv); lat = (iv % 2 ? -1 : 1)*1.6*(env.side || 1); h = V.kind === 'tank' ? face : NaN; iv++; }
        const q = ARG.at(P, s, lat, tmp2);
        V.slot = {x:q.x, y:q.y, z:q.z, h:isNaN(h) ? Math.atan2(q.hy, q.hx) : h, s};
      }
      // infantry: 4 m apart along both verges from the front back; the launcher teams at the front corners
      let k = 0;
      for (const Q of D.Q){ for (const S of Q.men){
        let s, lat;
        if (S.role === 'at'){ s = L - 2 - 4*(k % 3); lat = (k % 2 ? 1 : -1)*(8.5 + R()*2); }
        else { const j = k++; s = Math.max(3, L - 6 - Math.floor(j/2)*4.2); lat = (j % 2 ? 1 : -1)*(7 + R()*3.5); }
        const q = ARG.at(P, s, lat, tmp2); S.slotX = q.x + (R() - 0.5)*1.5; S.slotY = q.y + (R() - 0.5)*1.5; } }
    }
    // ---------------------------------------------------------------- vehicles
    function leaderOf(V){ const O = V.D.order; if (!O) return null; for (let i = V.ord - 1; i >= 0; i--){ const L = O[i]; if (L && alive(L)) return L; } return null; }
    function vehStep(V, dt){
      const sp = V.sp;
      V.recoil = Math.max(0, V.recoil - dt*1.6); V.rock = Math.max(0, V.rock - dt*1.4);
      if (V.st === 'queue'){
        const Ld = leaderOf(V);
        if (Ld && (Ld.st === 'queue' || (Ld.st === 'drive' && Ld.s < 24))) return;
        V.st = 'drive'; V.hidden = false; V.v = Ld ? Math.min(Ld.v, sp.v) : 6; place(V, 0);
      }
      if (V.st === 'drive'){
        const P = V.path, stop = Math.max(2, P.L - 4 - 15*V.ord), Ld = leaderOf(V);
        let vt = Math.min(sp.v, ARG.vAhead(P, V.s, 45, V.pc.i));
        vt = Math.min(vt, Math.sqrt(2*1.8*Math.max(0, stop - V.s)) + 0.3);
        if (Ld && Ld.st === 'drive'){ const d = ARH(Ld.x - V.x, Ld.y - V.y); vt = Math.min(vt, Math.max(0, (d - 17)*0.7)); }
        V.v += clamp(vt - V.v, -4.5*dt, sp.acc*dt);
        V.s += V.v*dt; place(V, dt);
        V.trk += V.v*dt; V.whl += V.v*dt;
        if (V.s >= stop - 0.4 && V.v < 1.5){ V.st = 'park'; V.waitT = 0; if (!V.slot) slots(V.D); }
      } else if (V.st === 'park'){
        const S = V.slot; if (!S){ V.st = 'hold'; } else {
          const dx = S.x - V.x, dy = S.y - V.y, d = ARH(dx, dy);
          if (d > 0.6){ const mv = Math.min(d, 3.2*dt), a = Math.atan2(dy, dx), rev = Math.abs(wrap(a - V.h)) > PI*0.6;
            V.h = turnTo(V.h, rev ? a + PI : a, 1.2*dt); V.x += dx/d*mv; V.y += dy/d*mv; V.trk += (rev ? -mv : mv); V.whl += (rev ? -mv : mv); V.v = mv/dt; }
          else { V.v = 0; const e = wrap(S.h - V.h); V.h = turnTo(V.h, S.h, 0.7*dt); V.trk += Math.sign(e)*0.7*dt*1.8; if (Math.abs(e) < 0.02){ V.st = 'hold'; V.D.holdT = A.T; } }
          V.z = env.ground(V.x, V.y) + (S.z || 0)*0;
          V.waitT += dt; if (V.waitT > 25){ V.x = S.x; V.y = S.y; V.h = S.h; V.st = 'hold'; }
          terrain(V);
        }
      } else if (V.st === 'hold'){ V.v = 0; }
      else if (V.st === 'thrown'){ thrownStep(V, dt); return; }
      else if (V.st === 'wreck'){ V.burnT = Math.max(0, V.burnT - dt); V.wreckT += dt; shoveStep(V, dt); return; }
      shoveStep(V, dt);
      if (sp.gun) gunStep(V, dt);
      if (sp.mg) mgStep(V, dt);
    }
    function turnTo(h, a, mx){ const e = wrap(a - h); return h + clamp(e, -mx, mx); }
    function place(V, dt){
      const q = ARG.at(V.path, V.s, V.lane, V.pc);
      V.x = q.x; V.y = q.y; tmp.i = tmp2.i = q.i;
      // heading from the road a few metres either side (smooth through the corners)
      const a = ARG.at(V.path, V.s + 3.5, V.lane, tmp), b = ARG.at(V.path, V.s - 3.5, V.lane, tmp2);
      const hd = Math.atan2(a.y - b.y, a.x - b.x); V.h = dt > 0 ? turnTo(V.h, hd, Math.max(0.5, 2.2*dt + Math.abs(V.v)*0.12*dt)) : hd;
      V.z = env.ground(V.x, V.y) + q.z;
      V.pitch = 0; V.roll = 0;
      if (q.z < 0.3) terrain(V); else { const zf = ARG.at(V.path, V.s + 3, 0, tmp).z, zb = ARG.at(V.path, V.s - 3, 0, tmp2).z; V.pitch = Math.atan2(zf - zb, 6); }
    }
    function terrain(V){
      const c = Math.cos(V.h), s = Math.sin(V.h), hl = V.sp.L*0.42, hw = V.sp.W*0.42, g = env.ground;
      const gf = g(V.x + c*hl, V.y + s*hl), gb = g(V.x - c*hl, V.y - s*hl), gl = g(V.x - s*hw, V.y + c*hw), gr = g(V.x + s*hw, V.y - c*hw);
      V.pitch = Math.atan2(gf - gb, 2*hl); V.roll = Math.atan2(gl - gr, 2*hw); V.z = Math.max(V.z, (gf + gb + gl + gr)*0.25);
    }
    function shoveStep(V, dt){ if (V.svx || V.svy){ V.x += V.svx*dt; V.y += V.svy*dt; const k = Math.exp(-3.5*dt); V.svx *= k; V.svy *= k; if (Math.abs(V.svx) + Math.abs(V.svy) < 0.05){ V.svx = V.svy = 0; } V.z = env.ground(V.x, V.y); } }
    // thrown (no physics engine in the view): a ballistic arc, a tumble, then it rests on its roof or its side
    function thrownStep(V, dt){
      if (V.phys >= 0) return;          // the view's physics engine owns the pose
      V.x += V.tvx*dt; V.y += V.tvy*dt; V.z += V.tvz*dt; V.tvz -= 9.81*dt;
      V.pitch += V.tw[0]*dt; V.roll += V.tw[1]*dt; V.h += V.tw[2]*dt;
      const g = env.ground(V.x, V.y);
      if (V.z <= g && V.tvz < 0){ V.z = g; if (Math.abs(V.tvz) > 4){ V.tvz *= -0.25; V.tvx *= 0.5; V.tvy *= 0.5; V.tw[0] *= 0.5; V.tw[1] *= 0.5; V.tw[2] *= 0.5; A.fx.impact('land', V.x, V.y, g, 0, 0, 1, 0.6, V); }
        else { V.roll = Math.round(V.roll/(PI/2))*(PI/2); V.pitch = Math.round(V.pitch/PI)*PI; V.st = 'wreck'; V.tvx = V.tvy = V.tvz = 0; } }
    }
    // ---------------------------------------------------------------- fire control
    const aimC = new Float32Array(64);
    // a sphere to aim at: within the weapon's elevation, weighted by its area (the low, big ones), lead from the creature's motion
    function chooseAim(x, y, z, maxEl){
      if (!K.fire || K.n <= 0) return -1;
      let tot = 0, lowest = -1, lz = 1e9;
      for (let i = 0; i < K.n; i++){ const o = i*4, sx = K.S[o], sy = K.S[o + 1], sz = K.S[o + 2], r = K.S[o + 3]; aimC[i] = 0;
        if (sz + r < env.ground(sx, sy) + 2) continue;
        const el = Math.atan2(sz - z, ARH(sx - x, sy - y)); if (sz < lz){ lz = sz; lowest = i; }
        if (el > maxEl) continue; aimC[i] = r*r; tot += r*r; }
      if (tot <= 0) return lowest;
      let u = R()*tot; for (let i = 0; i < K.n; i++){ u -= aimC[i]; if (u <= 0 && aimC[i] > 0) return i; }
      return lowest;
    }
    const AP = {x:0, y:0, z:0, d:0};
    function aimPoint(i, x, y, z, vel, out){
      const o = i*4, sx = K.S[o], sy = K.S[o + 1], sz = K.S[o + 2], d0 = ARH3(sx - x, sy - y, sz - z), t = d0/vel;
      out.x = sx + K.vx*t; out.y = sy + K.vy*t; out.z = sz; out.d = ARH3(out.x - x, out.y - y, out.z - z); return out;
    }
    const MZ = {x:0, y:0, z:0, dx:0, dy:0, dz:0};
    function muzzle(V, out){
      const sp = V.sp, c = Math.cos(V.h), s = Math.sin(V.h), yaw = V.h + V.ty, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(V.gp), spp = Math.sin(V.gp);
      const px = V.x + c*sp.tx, py = V.y + s*sp.tx, pz = V.z + sp.tz;
      const ox = px + cy*(sp.gx - 0), oy = py + sy*(sp.gx - 0), oz = V.z + sp.gz + Math.sin(V.pitch)*sp.gx;
      out.dx = cy*cp; out.dy = sy*cp; out.dz = spp;
      out.x = ox + out.dx*sp.glen; out.y = oy + out.dy*sp.glen; out.z = oz + out.dz*sp.glen; out.px = px; out.py = py; out.pz = pz; return out;
    }
    function gunStep(V, dt){
      const g = V.sp.gun; V.reload -= dt;
      let want = 0, wantP = 0, have = false;
      if (K.fire && V.st !== 'queue'){
        V.aimT -= dt;
        if (V.aimI < 0 || V.aimI >= K.n || V.aimT <= 0){ V.aimI = chooseAim(V.x, V.y, V.z + V.sp.gz, g.elev[1] - 0.02); V.aimT = 4 + R()*5; }
        if (V.aimI >= 0){ const vel = g.kind === 'shell' ? 900 : 1000, ap = aimPoint(V.aimI, V.x, V.y, V.z + V.sp.gz, vel, AP);
          if (ap.d < g.range[1] + 200){ have = true; want = wrap(Math.atan2(ap.y - V.y, ap.x - V.x) - V.h); wantP = clamp(Math.atan2(ap.z - V.z - V.sp.gz, ARH(ap.x - V.x, ap.y - V.y)) - V.pitch, g.elev[0], g.elev[1]); } }
      }
      const e = wrap(want - V.ty); V.ty = wrap(V.ty + clamp(e, -g.rate*dt, g.rate*dt));
      const ep = wantP - V.gp; V.gp += clamp(ep, -0.25*dt, 0.25*dt);
      if (!have || A.ceaseT > 0) return;
      const aligned = Math.abs(e) < 0.03 && Math.abs(ep) < 0.03, d = AP.d;
      if (!aligned || d < g.range[0] || d > g.range[1] || V.reload > 0 || V.st === 'drive' && V.v > 5) return;
      if (g.kind === 'shell'){ fireShell(V, d); V.reload = g.reload[0] + R()*(g.reload[1] - g.reload[0]); }
      else { V.acN = 3 + ((R()*3) | 0); V.acDt = 0; V.reload = g.reload[0] + R()*(g.reload[1] - g.reload[0]); }
      V.aimT = Math.min(V.aimT, 1.5 + R()*2);
    }
    function fireShell(V, d){
      const m = muzzle(V, MZ), hit = R() < 0.82, t = d/900;
      A.st.shots++; A.st.shells++; V.recoil = 1; V.rock = 1; V.fireN++;
      A.fx.cannon(V, m.x, m.y, m.z, m.dx, m.dy, m.dz, hit ? d : d*1.7, hit);
      if (hit) queueHit('shell', V.aimI, m.x, m.y, m.z, t, HK.shell, V); else A.st.misses++;
    }
    function acStep(V, dt){
      if (V.acN <= 0) return; V.acDt -= dt; if (V.acDt > 0) return; V.acDt = 0.2;
      V.acN--; if (V.aimI < 0 || V.aimI >= K.n) return;
      const m = muzzle(V, MZ), d = ARH3(K.S[V.aimI*4] - m.x, K.S[V.aimI*4 + 1] - m.y, K.S[V.aimI*4 + 2] - m.z), hit = R() < 0.85;
      V.recoil = 0.6; A.st.shots++; V.fireN++;
      A.fx.ac(V, m.x, m.y, m.z, m.dx, m.dy, m.dz, hit ? d : d*1.5, hit);
      if (hit) queueHit('ac', V.aimI, m.x, m.y, m.z, d/1000, HK.ac, V); else A.st.misses++;
    }
    // the tank's roof machine gun: bursts at the creature (no slewing: a remote mount), tracers every 3rd round
    function mgStep(V, dt){
      const mg = V.sp.mg; if (!mg || !K.fire || A.ceaseT > 0) return;
      if (V.mgN > 0){ V.mgDt -= dt; if (V.mgDt <= 0){ V.mgDt = 0.075; V.mgN--; mgRound(V, mg); } return; }
      V.mgT -= dt; if (V.mgT > 0) return; V.mgT = 2.5 + R()*4;
      if (V.mgI < 0 || V.mgI >= K.n || R() < 0.3) V.mgI = chooseAim(V.x, V.y, V.z + 3, 0.9);
      if (V.mgI < 0) return; const o = V.mgI*4, d = ARH(K.S[o] - V.x, K.S[o + 1] - V.y); if (d > mg.range) return;
      V.mgN = 6 + ((R()*8) | 0); V.mgDt = 0; A.st.bursts++;
      if (R() < 0.75) queueHit('mg', V.mgI, V.x, V.y, V.z + mg.z, d/850, HK.mg, V);
    }
    function mgRound(V, mg){
      if (V.mgI < 0 || V.mgI >= K.n) return;
      const c = Math.cos(V.h + V.ty), s = Math.sin(V.h + V.ty), cb = Math.cos(V.h), sb = Math.sin(V.h);
      const x = V.x + cb*V.sp.tx + c*mg.x - s*mg.y, y = V.y + sb*V.sp.tx + s*mg.x + c*mg.y, z = V.z + mg.z, o = V.mgI*4;
      const tx = K.S[o] + (R() - 0.5)*K.S[o + 3]*0.9, ty = K.S[o + 1] + (R() - 0.5)*K.S[o + 3]*0.9, tz = K.S[o + 2] + (R() - 0.5)*K.S[o + 3]*0.9, dx = tx - x, dy = ty - y, dz = tz - z, d = ARH3(dx, dy, dz) || 1;
      A.fx.mg(V, x, y, z, dx/d, dy/d, dz/d, d, V.mgN % 3 === 0);
    }
    // ---------------------------------------------------------------- impacts in flight: resolved on the creature's body when they arrive
    function queueHit(kind, idx, x, y, z, t, k, u){
      if (idx < 0 || idx >= K.n) return;
      let e = null; for (const q of A.imp) if (q.t < 0){ e = q; break; } if (!e) return;
      const o = idx*4, cx = K.S[o], cy = K.S[o + 1], cz = K.S[o + 2];
      let ox = x - cx, oy = y - cy, oz = z - cz; const l = ARH3(ox, oy, oz) || 1; ox = ox/l + (R() - 0.5)*0.9; oy = oy/l + (R() - 0.5)*0.9; oz = oz/l + (R() - 0.5)*0.9;
      const l2 = ARH3(ox, oy, oz) || 1; e.t = A.T + t; e.kind = kind; e.idx = idx; e.ox = ox/l2; e.oy = oy/l2; e.oz = oz/l2; e.k = k; e.u = u; A.impN++;
    }
    function impactStep(){
      for (const e of A.imp){ if (e.t < 0 || e.t > A.T) continue; e.t = -1; A.impN--;
        if (!K.on || e.idx >= K.n) continue;
        const o = e.idx*4, r = K.S[o + 3], x = K.S[o] + e.ox*r, y = K.S[o + 1] + e.oy*r, z = K.S[o + 2] + e.oz*r;
        A.st.hits++; A.fx.impact(e.kind, x, y, z, e.ox, e.oy, e.oz, e.k, e.u);
        hinderAdd(e.u, x, y, z, e.k);
      }
    }
    // the creature's suppression: big hits go at once, small arms add up per unit and go every 0.6 s
    function hinderAdd(u, x, y, z, k){
      if (!u) return;
      if (k >= 0.15){ A.st.hinders++; A.st.hinderK += k; env.hinder(x, y, z, k, u.id || (u.Q ? u.Q.id : 'army')); return; }
      const H = u.Q ? u.Q : u; if (!H.hk) A.hk[A.hkN++] = H; H.hk += k; H.hx = x; H.hy = y; H.hz = z;
    }
    function hinderFlush(dt){ if ((A.hkT -= dt) > 0) return; A.hkT = 0.6;
      for (let i = 0; i < A.hkN; i++){ const H = A.hk[i]; const k = Math.min(0.15, H.hk); if (k > 0){ A.st.hinders++; A.st.hinderK += k; env.hinder(H.hx, H.hy, H.hz, k, H.id); } H.hk = 0; A.hk[i] = null; } A.hkN = 0; }
    // ---------------------------------------------------------------- infantry
    function squadStep(Q, dt){
      const C = Q.carrier;
      let n = 0, sx = 0, sy = 0;
      for (const S of Q.men){
        solStep(S, dt);
        if (visS(S) && S.st !== 'leave'){ n++; sx += S.x; sy += S.y; }
      }
      if (n){ Q.cx = sx/n; Q.cy = sy/n; let r = 3; for (const S of Q.men) if (visS(S) && S.st !== 'leave') r = Math.max(r, ARH(S.x - Q.cx, S.y - Q.cy) + 1.5); Q.r = r; }
      else if (C && Q.st === 'ride'){ Q.cx = C.x; Q.cy = C.y; Q.r = 3; }
      // dismount once the carrier holds its slot
      if (Q.st === 'ride' && C && C.st === 'hold' && Q.D.st === 'hold'){ Q.st = 'out'; let i = 0; for (const S of Q.men){ if (S.st === 'ride'){ S.st = 'wait'; S.outT = 0.4 + 0.45*i++; } } }
      if (Q.st === 'board' && C){ let left = 0; for (const S of Q.men) if (S.st !== 'ride' && S.st !== 'gone' && S.st !== 'leave' && S.st !== 'flee' && S.st !== 'air' && S.st !== 'down' && S.st !== 'up') left++; if (!left) Q.st = 'ride'; }
      if (Q.st !== 'gone'){ let all = true; for (let i = 0; i < Q.men.length; i++) if (Q.men[i].st !== 'gone'){ all = false; break; } if (all) Q.st = 'gone'; }
    }
    function rearOf(V, out){ const c = Math.cos(V.h), s = Math.sin(V.h), r = V.sp.hx + 0.8; out.x = V.x - c*r; out.y = V.y - s*r; return out; }
    const RO = {x:0, y:0};
    function moveTo(S, x, y, v, dt){ const dx = x - S.x, dy = y - S.y, d = ARH(dx, dy); if (d < 0.15) return true; const m = Math.min(d, v*dt); S.x += dx/d*m; S.y += dy/d*m; S.h = turnTo(S.h, Math.atan2(dy, dx), 8*dt); S.ph += m/1.7; S.z = env.ground(S.x, S.y); return d - m < 0.15; }
    function setAnim(S, a){ if (S.anim === a) return; S.animP = S.anim; S.anim = a; S.bl = 0; }
    function solStep(S, dt){
      S.bl = Math.min(1, S.bl + dt*4); S.fp = Math.max(0, S.fp - dt*7);
      const Q = S.Q, C = Q.carrier;
      switch (S.st){
        case 'ride': if (C){ S.x = C.x; S.y = C.y; S.z = C.z; S.h = C.h; } S.hidden = true; return;
        case 'gone': S.hidden = true; return;
        case 'wait': S.outT -= dt; if (C){ rearOf(C, RO); S.x = RO.x; S.y = RO.y; S.z = env.ground(RO.x, RO.y); S.h = C.h + PI; }
          if (S.outT <= 0){ S.st = 'out'; S.hidden = false; A.fx.dismount(S); } else return; // falls through
        case 'out': S.hidden = false; setAnim(S, AN.run); if (moveTo(S, S.slotX, S.slotY, SOL.run, dt)){ S.st = 'hold'; setAnim(S, S.pose); } break;
        case 'hold': {
          const kx = K.on ? K.x - S.x : Math.cos(S.h), ky = K.on ? K.y - S.y : Math.sin(S.h);
          S.h = turnTo(S.h, Math.atan2(ky, kx), 2.5*dt);
          if (S.coverT > 0){ S.coverT -= dt; setAnim(S, S.pose === AN.prone ? AN.prone : AN.crouch); S.burst = 0; break; }   // taking cover: heads down, no fire
          setAnim(S, S.pose); solFire(S, dt); break; }
        case 'flee': setAnim(S, AN.sprint); if (moveTo(S, S.tx, S.ty, SOL.sprint, dt)){ S.st = S.back ? 'out' : 'leave'; S.leaveT = 0; if (!S.back) leaveTarget(S); } break;
        case 'leave': setAnim(S, AN.sprint); S.leaveT += dt; if (moveTo(S, S.tx, S.ty, SOL.sprint*0.9, dt) || S.leaveT > 40 || (S.leaveT > 8 && ARH(S.x - CAM.x, S.y - CAM.y) > 600)){ S.st = 'gone'; S.hidden = true; A.st.gone++; } break;
        case 'board': setAnim(S, AN.run); if (!C || !alive(C)){ S.st = 'leave'; leaveTarget(S); break; } rearOf(C, RO); if (moveTo(S, RO.x, RO.y, SOL.run*1.1, dt)){ S.st = 'ride'; S.hidden = true; } break;
        case 'air': {
          S.x += S.vx*dt; S.y += S.vy*dt; S.z += S.vz*dt; S.vz -= 9.81*dt; S.tumble = Math.min(1, S.tumble + dt*2.2*Math.max(S.tumbleK, 0.8)); setAnim(S, S.tumbleK < 0.5 ? AN.dive : AN.down);
          const g = env.ground(S.x, S.y); if (S.z <= g && S.vz < 0){ S.z = g; S.st = 'down'; S.downT = S.tumbleK < 0.5 ? 0.8 + R()*0.8 : 2.2 + R()*3; S.vx = S.vy = S.vz = 0; }
          break; }
        case 'down': S.tumble = Math.min(1, S.tumble + dt*3); S.downT -= dt; if (S.downT <= 0){ S.st = 'up'; S.downT = 0.9; } break;
        case 'up': S.tumble = Math.max(0, S.tumble - dt*1.25); S.downT -= dt; if (S.downT <= 0 || S.tumble <= 0){ S.tumble = 0; setAnim(S, AN.crouch); if (S.back){ S.st = 'out'; } else { S.st = 'flee'; fleeTarget(S, 50 + R()*40); } } break;
      }
      // the player's car: dive out of its way
      if (S.st !== 'air' && S.st !== 'down' && S.st !== 'up' && !S.hidden){
        const vx = PL.vx, vy = PL.vy, sp = ARH(vx, vy);
        if (sp > 3){ const dx = S.x - PL.x, dy = S.y - PL.y, ahead = (dx*vx + dy*vy)/sp, lat = Math.abs(dx*vy - dy*vx)/sp;
          if (ahead > -1 && ahead < sp*1.1 + 4 && lat < 2.6){ const sgn = (dx*vy - dy*vx) >= 0 ? 1 : -1, nx = vy/sp*sgn, ny = -vx/sp*sgn;
            S.st = 'air'; S.vx = nx*5.5; S.vy = ny*5.5; S.vz = 2.2; S.tumbleK = 0.35; S.tumble = 0; S.back = 1; A.st.knocked++; A.fx.knock(S, 0.2); } }
      }
    }
    function fleeTarget(S, dist){ let ax = S.x - K.x, ay = S.y - K.y; const l = ARH(ax, ay) || 1; const j = (R() - 0.5)*0.9, c = Math.cos(j), s = Math.sin(j); const ux = (ax*c - ay*s)/l, uy = (ax*s + ay*c)/l; S.tx = S.x + ux*dist; S.ty = S.y + uy*dist; }
    function leaveTarget(S){ fleeTarget(S, 250 + R()*150); }
    function solFire(S, dt){
      if (!K.fire || A.ceaseT > 0) return;
      if (S.burst > 0){ S.burstDt -= dt; if (S.burstDt <= 0){ S.burstDt = S.role === 'mg' ? 0.09 : 0.12; S.burst--; S.fp = 1; solRound(S); } return; }
      S.fireT -= dt; if (S.fireT > 0) return;
      const reach = SOL.reach[S.role] || 700;
      if (S.aimI < 0 || S.aimI >= K.n || R() < 0.25) S.aimI = chooseAim(S.x, S.y, S.z + 1.4, S.role === 'at' ? 0.6 : 1.1);
      if (S.aimI < 0){ S.fireT = 1; return; }
      const o = S.aimI*4, dx = K.S[o] - S.x, dy = K.S[o + 1] - S.y, dz = K.S[o + 2] - S.z - 1.4, d = ARH3(dx, dy, dz);
      S.aim = clamp(Math.atan2(dz, ARH(dx, dy)), -0.2, 1.1);
      if (d > reach){ S.fireT = 1.5 + R(); return; }
      if (S.role === 'at'){ S.fireT = 13 + R()*8; S.fp = 1; fireRocket(S, d); return; }
      S.burst = S.role === 'mg' ? 7 + ((R()*6) | 0) : 2 + ((R()*3) | 0); S.burstDt = 0; S.fireT = S.role === 'mg' ? 2.5 + R()*3 : 1.8 + R()*3; A.st.bursts++;
      if (R() < 0.6) queueHit(S.role === 'mg' ? 'mg' : 'rifle', S.aimI, S.x, S.y, S.z + 1.4, d/820, S.role === 'mg' ? HK.mg : HK.rifle, S);
    }
    function solRound(S){
      if (S.aimI < 0 || S.aimI >= K.n) return; const o = S.aimI*4, r = K.S[o + 3];
      const c = Math.cos(S.h), s = Math.sin(S.h), hz = S.pose === AN.prone ? 0.35 : S.pose === AN.kneel ? 1.05 : 1.45, x = S.x + c*0.8, y = S.y + s*0.8, z = S.z + hz;
      const tx = K.S[o] + (R() - 0.5)*r, ty = K.S[o + 1] + (R() - 0.5)*r, tz = K.S[o + 2] + (R() - 0.5)*r, dx = tx - x, dy = ty - y, dz = tz - z, d = ARH3(dx, dy, dz) || 1;
      A.fx.rifle(S, x, y, z, dx/d, dy/d, dz/d, d, S.role === 'mg' ? (S.burst % 3 === 0) : R() < 0.3);
    }
    function fireRocket(S, d){
      const c = Math.cos(S.h), s = Math.sin(S.h), x = S.x + c*0.7 - s*(-0.2), y = S.y + s*0.7 + c*(-0.2), z = S.z + 1.2;
      const ap = aimPoint(S.aimI, x, y, z, 230, AP), dx = ap.x - x, dy = ap.y - y, dz = ap.z - z, l = ARH3(dx, dy, dz) || 1, hit = R() < 0.76, t = l/230 + 0.15;
      A.st.shots++; A.st.rockets++;
      A.fx.rocket(S, x, y, z, dx/l, dy/l, dz/l, hit ? l : l*1.6, hit, t);
      if (hit) queueHit('rocket', S.aimI, x, y, z, t, HK.rocket, S.Q); else A.st.misses++;
    }
    // ---------------------------------------------------------------- the creature's blows (SGArmy.hit) and its body (crushing)
    function destroyV(V, how, e, fx, fy){
      if (!alive(V)) return false;
      A.st.destroyed++; if (how === 'crush') A.st.crushed++;
      V.hp = 0; V.burn = 1; V.burnT = 55 + R()*45; V.wreckT = 0; V.v = 0; V.svx = V.svy = 0; V.mgN = V.acN = 0;
      // the crew and passengers bail out (dazed, then they run)
      for (const Q of V.carry){ for (const S of Q.men){ if (S.st !== 'ride') continue; S.st = 'air'; S.hidden = false; S.x = V.x + (R() - 0.5)*2; S.y = V.y + (R() - 0.5)*2; S.z = V.z + 1.2;
        const a = R()*TAU, v = 3 + R()*4; S.vx = Math.cos(a)*v; S.vy = Math.sin(a)*v; S.vz = 2 + R()*3; S.tumble = 0; S.tumbleK = 1; S.back = 0; A.st.knocked++; } Q.st = 'flee'; }
      V.carry.length = 0;
      const big = V.kind === 'tank' ? e >= 0.72 : e >= 0.42;
      if (how === 'crush'){ V.crushed = 1; V.st = 'wreck'; V.pitch *= 0.3; V.roll *= 0.3; }
      else if (big){ V.st = 'thrown'; A.st.thrown++; const k = V.kind === 'tank' ? 0.55 : 1, sp = (6 + 22*e)*k;
        V.tvx = fx*sp; V.tvy = fy*sp; V.tvz = (5 + 13*e)*k; V.tw[0] = (R() - 0.5)*3*k; V.tw[1] = (R() - 0.5)*5*k; V.tw[2] = (R() - 0.5)*2*k; }
      else V.st = 'wreck';
      if (V.kind === 'tank' && how !== 'crush' && (R() < 0.75 || big)){ V.tGone = 1; A.fx.turretPop(V, fx*(2 + 4*e) + (R() - 0.5)*4, fy*(2 + 4*e) + (R() - 0.5)*4, 14 + 16*R()); }
      A.fx.brew(V, how, e); cover(V.x, V.y, 45);
      return true;
    }
    // soldiers holding near a blast take cover for a few seconds
    function cover(x, y, r){ for (let i = 0; i < A.S.length; i++){ const S = A.S[i]; if (S.st !== 'hold') continue; const dx = S.x - x, dy = S.y - y; if (dx*dx + dy*dy < r*r) S.coverT = Math.max(S.coverT, 2 + R()*3); } }
    function knock(S, fromX, fromY, e, fx, fy){
      if (!visS(S) || S.st === 'air') return false;
      let dx = S.x - fromX, dy = S.y - fromY; const l = ARH(dx, dy) || 1; dx /= l; dy /= l;
      if (fx !== undefined && (fx || fy)){ dx = dx*0.5 + fx*0.5; dy = dy*0.5 + fy*0.5; const l2 = ARH(dx, dy) || 1; dx /= l2; dy /= l2; }
      const v = 5 + 13*e*(0.6 + 0.4*R());
      S.st = 'air'; S.hidden = false; S.vx = dx*v; S.vy = dy*v; S.vz = 2.5 + 7*e*R(); S.tumble = 0; S.tumbleK = 1; S.back = 0; S.burst = 0; A.st.knocked++; A.fx.knock(S, e);
      return true;
    }
    function hit(id, o){
      o = o || {}; const e = clamp(+o.e || 0.5, 0, 1); let fx = +o.fx || 0, fy = +o.fy || 0;
      if (id && id[0] === 'v'){ const V = A.V.find(v => v.id === id); if (!V || V.st === 'gone') return false;
        if (!fx && !fy){ const dx = V.x - (o.x === undefined ? K.x : +o.x), dy = V.y - (o.y === undefined ? K.y : +o.y), l = ARH(dx, dy) || 1; fx = dx/l; fy = dy/l; }
        if (!alive(V)){ if (V.st === 'wreck' && e > 0.5){ V.svx += fx*e*6; V.svy += fy*e*6; } return true; }
        const thr = V.kind === 'tank' ? 0.45 : 0.25;
        if (e >= thr) destroyV(V, 'hit', e, fx, fy);
        else { V.hp -= e*2.2; V.svx += fx*e*9; V.svy += fy*e*9; A.fx.impact('scrape', V.x, V.y, V.z + 1.5, fx, fy, 0.3, e, V); if (V.hp <= 0) destroyV(V, 'hit', e, fx, fy); }
        // the people nearby are knocked about too
        for (const S of A.S) if (visS(S) && ARH(S.x - V.x, S.y - V.y) < 12) knock(S, V.x, V.y, e*0.7, fx, fy);
        return true; }
      if (id && id[0] === 'q'){ const Q = A.Q.find(q => q.id === id); if (!Q || Q.st === 'gone') return false;
        const x = o.x === undefined ? Q.cx : +o.x, y = o.y === undefined ? Q.cy : +o.y, R0 = 9 + 14*e;
        for (const S of Q.men){ if (!visS(S)) continue; const d = ARH(S.x - x, S.y - y);
          if (d < R0) knock(S, x, y, e*(1 - 0.5*d/R0), fx, fy); else if (S.st === 'hold' || S.st === 'out'){ S.st = 'flee'; S.back = 0; fleeTarget(S, 60 + R()*50); } }
        cover(x, y, R0 + 40);
        // other squads close by scatter too
        for (const S of A.S) if (S.Q !== Q && visS(S) && (S.st === 'hold' || S.st === 'out') && ARH(S.x - x, S.y - y) < R0 + 10){ S.st = 'flee'; S.back = 1; fleeTarget(S, 30 + R()*25); }
        return true; }
      return false;
    }
    // every frame: anything under a body sphere (feet, limbs, the belly) is crushed; troops near it scatter
    function crushStep(){
      if (!K.on || K.n <= 0) return;
      for (let i = 0; i < K.n; i++){
        const o = i*4, sx = K.S[o], sy = K.S[o + 1], sz = K.S[o + 2], r = K.S[o + 3];
        if (sz - r > 40) continue;               // nowhere near the ground
        for (const V of A.V){ if (V.st === 'gone' || V.st === 'queue' || V.st === 'thrown' || V.crushed) continue;
          const mz = V.z + V.sp.H*0.5, dz = sz - mz; if (Math.abs(dz) > r + V.sp.H*0.5) continue;
          const rr = Math.sqrt(Math.max(0, r*r - Math.max(0, Math.abs(dz) - V.sp.H*0.5)**2)), d = ARH(V.x - sx, V.y - sy);
          if (d < rr + V.sp.r*0.6){ const fx = (V.x - sx)/(d || 1), fy = (V.y - sy)/(d || 1);
            if (alive(V)){ destroyV(V, 'crush', 1, fx, fy); A.fx.crushed(V); } else { V.crushed = 1; V.burnT = Math.max(V.burnT, 20); } } }
        for (const S of A.S){ if (S.hidden || S.st === 'air') continue;
          const dz = sz - (S.z + 0.9); if (Math.abs(dz) > r + 0.9) continue;
          const rr = Math.sqrt(Math.max(0, r*r - Math.max(0, Math.abs(dz) - 0.9)**2)), d = ARH(S.x - sx, S.y - sy);
          if (d < rr + 1.2) knock(S, sx, sy, 0.75);
          else if (d < rr + 28 && (S.st === 'hold' || S.st === 'out')){ S.st = 'flee'; S.back = 1; fleeTarget(S, rr + 45 - d + R()*20); }
          else if (d < rr + 90 && S.st === 'hold' && S.coverT <= 0 && R() < 0.02) S.coverT = 1.5 + R()*2.5; }
      }
    }
    // ---------------------------------------------------------------- detachments: hold, retreat, regroup
    function detStep(D, dt){
      if (D.st === 'gone') return;
      D.planT -= dt; if (D.planT > 0) return; D.planT = 0.8 + R()*0.6;
      let live = false; for (let i = 0; i < D.V.length && !live; i++) if (alive(D.V[i])) live = true; for (let i = 0; i < D.Q.length && !live; i++) if (D.Q[i].st !== 'gone') live = true;
      if (!live){ D.st = 'gone'; return; }
      if (!K.on) return;
      const dk = ARH(D.ax - K.x, D.ay - K.y), appr = dk > 1 ? ((D.ax - K.x)*(-K.vx) + (D.ay - K.y)*(-K.vy))/dk : 0;
      if (D.st === 'hold' || D.st === 'move'){
        const close = dk < 240 || (dk < 360 && appr > 3);
        if (close){ redeploy(D, 'retreat'); return; }
        if (D.st === 'hold' && dk > 1450 && A.T - D.holdT > 20) redeploy(D, 'advance');
        if (D.st === 'move' && D.order && D.order.every(V => !alive(V) || V.st === 'hold' || V.st === 'park')) D.st = 'hold';
      }
      if (D.st === 'board'){
        D.boardT -= 0.8; const waiting = D.Q.some(Q => Q.st === 'board' && Q.carrier && alive(Q.carrier));
        if (!waiting || D.boardT <= 0 || dk < 170){ for (const Q of D.Q) if (Q.st === 'board'){ for (const S of Q.men) if (S.st === 'board' || S.st === 'out' || S.st === 'hold'){ S.st = 'flee'; S.back = 0; fleeTarget(S, 80 + R()*60); } Q.st = 'flee'; }
          go(D); }
      }
    }
    function redeploy(D, mode){ if (!D.want) D.want = mode; D.planT = 1.5; }
    function moveOut(D, mode, an, path){
      const G = A.G;
      if (mode === 'retreat') A.st.retreats++; else A.st.advances++;
      D.mode = mode; D.ax = G.X[an]; D.ay = G.Y[an]; D.node = an; D.next = path; D.moves++;
      // the infantry: back into their carriers if they are close, else they run for it
      let boarding = 0;
      for (const Q of D.Q){ if (Q.st === 'gone') continue; const C = Q.carrier;
        const canBoard = C && alive(C) && Q.st !== 'ride' && Q.st !== 'flee' && ARH(Q.cx - C.x, Q.cy - C.y) < 160;
        if (canBoard){
          Q.st = 'board'; boarding++; for (const S of Q.men) if (S.st === 'hold' || S.st === 'out' || S.st === 'flee' && S.back) { S.st = 'board'; S.back = 0; } }
        else if (Q.st !== 'ride'){ Q.st = 'flee'; for (const S of Q.men) if (S.st === 'hold' || S.st === 'out'){ S.st = 'flee'; S.back = 0; fleeTarget(S, 120 + R()*100); } } }
      A.fx.retreat(D, mode);
      if (boarding){ D.st = 'board'; D.boardT = 14; } else go(D);
    }
    // vehicles leave for the new anchor: each from where it stands onto the new path
    function go(D){
      const P = D.next; if (!P) return; D.next = null;
      const L = D.V.filter(V => alive(V) && V.st !== 'queue').sort((a, b) => ARH(a.x - P.X[0], a.y - P.Y[0]) - ARH(b.x - P.X[0], b.y - P.Y[0]));
      for (const V of D.V) if (V.st === 'queue'){ V.st = 'gone'; V.hidden = true; for (const Q of V.carry) for (const S of Q.men){ S.st = 'gone'; } }
      D.order = L; D.st = 'move'; D.path = P;
      L.forEach((V, i) => {
        const X = [V.x], Y = [V.y], Z = [0]; const d0 = ARH(P.X[0] - V.x, P.Y[0] - V.y);
        if (d0 > 2){ const n = Math.ceil(d0/8); for (let k = 1; k < n; k++){ X.push(V.x + (P.X[0] - V.x)*k/n); Y.push(V.y + (P.Y[0] - V.y)*k/n); Z.push(0); } }
        for (let k = 0; k < P.n; k++){ X.push(P.X[k]); Y.push(P.Y[k]); Z.push(P.Z[k]); }
        V.path = ARG.mkPath(X, Y, Z); V.ord = i; V.s = 0; V.pc.i = 0; V.slot = null; V.st = 'drive'; V.hidden = false; V.v = 0;
        V.lane = (env.side || 1)*(V.kind === 'tank' ? 2.1 : 2.4); V.D = D;
      });
    }
    // ---------------------------------------------------------------- housekeeping: wrecks and the gone
    function tidy(){
      let wrecks = 0; for (let i = A.V.length - 1; i >= 0; i--){ const V = A.V[i]; if (V.st === 'wreck') wrecks++; }
      if (wrecks > CAPS.wreck){ // the oldest burnt-out wreck far from the camera goes
        let best = null, bt = -1; for (const V of A.V){ if (V.st !== 'wreck' || V.burnT > 0) continue; const d = ARH(V.x - CAM.x, V.y - CAM.y); if (d > 250 && V.wreckT > bt){ bt = V.wreckT; best = V; } }
        if (best){ best.st = 'gone'; best.hidden = true; } }
      if (A.V.length > 80){ A.V = A.V.filter(V => V.st !== 'gone'); for (const D of A.D) D.V = D.V.filter(V => V.st !== 'gone'); }
      if (A.S.length > 260){ A.S = A.S.filter(S => S.st !== 'gone'); for (const Q of A.Q) Q.men = Q.men.filter(S => S.st !== 'gone'); A.Q = A.Q.filter(Q => Q.men.length); }
      if (A.D.length > 30) A.D = A.D.filter(D => D.st !== 'gone');
    }
    // ---------------------------------------------------------------- the step
    function lap(k){ const PR = env.prof; if (!PR) return; const t = env.now(), d = t - A.profT; A.profT = t; const e = PR[k] || (PR[k] = [0, 0, 0]); e[0] += d; e[1] = Math.max(e[1], d); e[2]++; }
    function step(dt){
      if (!A.on) return;
      const t0 = env.now ? env.now() : 0;
      A.T += dt; A.ceaseT = K.cease ? 1 : 0;
      if (env.prof) A.profT = env.now();
      graphStep(env.budget || 1.5); lap('graph'); if (!A.job) planStep(env.budget || 1.5); lap('plan');
      if (A.T >= A.nextWave && A.G && K.on && !K.cease){ const ok = spawnWave(); A.nextWave = A.T + (!ok ? 5 : A.wave === 1 ? 35 + R()*10 : A.interval[0] + R()*(A.interval[1] - A.interval[0])); } lap('wave');
      for (const D of A.D) detStep(D, dt); lap('det');
      for (const V of A.V){ if (V.st === 'gone') continue; vehStep(V, dt); if (V.acN > 0) acStep(V, dt); } lap('veh');
      for (const Q of A.Q) if (Q.st !== 'gone') squadStep(Q, dt); lap('sol');
      impactStep(); crushStep(); hinderFlush(dt); lap('hit');
      if ((A.tidyT -= dt) <= 0){ A.tidyT = 2; tidy(); }
      if (env.now){ const ms = env.now() - t0; A.ms = A.ms*0.95 + ms*0.05; A.msMax = Math.max(A.msMax*0.995, ms); }
    }
    function tgtObj(k){ let o = A.tgtPool[k]; if (!o){ o = {id:'', x:0, y:0, z:0, r:0, kind:'', sub:'', st:'', n:0}; A.tgtPool[k] = o; } return o; }
    function targets(){
      const T = A.tgt; let k = 0;
      for (let i = 0; i < A.V.length; i++){ const V = A.V[i]; if (!alive(V) || V.hidden) continue; const o = tgtObj(k); o.id = V.id; o.x = V.x; o.y = V.y; o.z = V.z + V.sp.H*0.5; o.r = V.sp.r; o.kind = KINDN[V.kind]; o.sub = V.kind; o.st = V.st; o.n = 0; T[k++] = o; }
      for (let i = 0; i < A.Q.length; i++){ const Q = A.Q[i]; if (Q.st === 'gone' || Q.st === 'ride') continue; let n = 0; for (let j = 0; j < Q.men.length; j++){ const S = Q.men[j]; if (!S.hidden && S.st !== 'leave' && S.st !== 'gone') n++; } if (!n) continue;
        const o = tgtObj(k); o.id = Q.id; o.x = Q.cx; o.y = Q.cy; o.z = env.ground(Q.cx, Q.cy) + 1; o.r = Q.r; o.kind = Q.kind; o.sub = Q.kind; o.st = Q.st; o.n = n; T[k++] = o; }
      if (T.length !== k) T.length = k;
      return T;
    }
    // tests / screenshots: dispatch a wave now and put every detachment still on the road straight into its positions (troops out)
    function deployNow(){
      if (!K.on) return 0; if (!A.G || A.job) graphNow(); if (!A.G) return 0;
      if (!A.req.length && !A.plan && spawnWave()) A.nextWave = A.T + (A.wave === 1 ? 35 + R()*10 : A.interval[0] + R()*(A.interval[1] - A.interval[0]));
      let g = 0; while ((A.req.length || A.plan) && g++ < 80) planStep(1e9);
      let n = 0;
      for (const D of A.D){ if (D.st !== 'move' || !D.order) continue; slots(D);
        for (const V of D.order){ if (!alive(V) || !V.slot) continue; V.x = V.slot.x; V.y = V.slot.y; V.h = V.slot.h; V.z = env.ground(V.x, V.y); V.st = 'hold'; V.hidden = false; V.v = 0; V.s = V.path.L; terrain(V); n++; }
        D.st = 'hold'; D.holdT = A.T;
        for (const Q of D.Q){ Q.st = 'out'; for (const S of Q.men){ if (S.st !== 'ride') continue; S.x = S.slotX; S.y = S.slotY; S.z = env.ground(S.x, S.y); S.st = 'hold'; S.hidden = false; S.anim = S.animP = S.pose; S.bl = 1;
          S.h = Math.atan2(K.y - S.y, K.x - S.x); } } }
      return n;
    }
    function start(o){
      o = o || {}; stop(); A.on = true; A.T = 0; A.wave = 0; A.nextWave = o.firstWave === undefined ? A.firstWave : o.firstWave; A.msg = null;
      for (const k in A.st) A.st[k] = 0; A.ms = A.msMax = 0;
      if (o.scale) A.scale = o.scale;
      return true;
    }
    function stop(){ A.on = false; A.req.length = 0; A.plan = null; A.V.length = 0; A.S.length = 0; A.Q.length = 0; A.D.length = 0; for (const e of A.imp) e.t = -1; A.impN = 0; for (let i = 0; i < A.hkN; i++) A.hk[i] = null; A.hkN = 0; A.tgt.length = 0; return true; }
    function stats(){ const c = counts(); return Object.assign({on:A.on, t:+A.T.toFixed(1), wave:A.wave, nextWave:+Math.max(0, A.nextWave - A.T).toFixed(1), graph:A.G ? {nodes:A.G.n, main:A.G.mainN, ms:A.G.ms} : null, building:!!A.job,
      dets:A.D.filter(D => D.st !== 'gone').map(D => ({n:D.n, st:D.st, mode:D.mode, d:K.on ? Math.round(ARH(D.ax - K.x, D.ay - K.y)) : null, v:D.V.filter(alive).length, q:D.Q.filter(Q => Q.st !== 'gone').length})),
      ms:+A.ms.toFixed(3), msMax:+A.msMax.toFixed(3)}, c, A.st); }
    return Object.assign(A, {start, stop, step, targets, hit, stats, counts, destroyV, knock, spawnWave, pickAnchor, planStep, slots, deployNow, graphNow, alive, chooseAim, muzzle, SPEC, AN});
  }
  return {Army, SPEC, AN, CAPS, HK, wrap, clamp, FXNULL};
})();
//</ARCORE>

// ---- 20_models.js: the models (original, generic: no insignia, flags, numbers or text), built procedurally as flat-shaded triangle soups
// with two per-vertex attributes: aPart (0 hull / body, 1 turret, 2 gun; soldiers: 0-12 body parts) and aMat (material zone). Built in
// a "world-local" frame (x forward, y left, z up, origin on the ground under the centre) and stored in three.js axes (x, z, -y).
const ARM = (() => {
  const PI = Math.PI, TAU = PI*2;
  // materials (aMat): vehicles 0 paint (camouflage), 1 dark metal, 2 track, 3 glass / optics, 4 front lamp, 5 rear lamp, 6 tyre, 7 canvas,
  // 8 soot / exhaust, 9 light metal / concrete; soldiers 10 uniform (camouflage), 11 vest / webbing, 12 skin, 13 boots / gloves, 14 helmet,
  // 15 weapon, 16 pack, 17 tube (olive)
  function Builder(){
    const P = [], N = [], PT = [], MT = [];
    let part = 0, mat = 0;
    const B = {P, N, PT, MT, tris:0,
      set(p, m){ if (p !== undefined) part = p; if (m !== undefined) mat = m; return B; },
      // a triangle in local coords; ref = a point inside the solid (orients the face outwards)
      tri(a, b, c, ref){
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        let nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx; const l = Math.hypot(nx, ny, nz); if (l < 1e-9) return B;
        nx /= l; ny /= l; nz /= l;
        if (ref){ const mx = (a[0] + b[0] + c[0])/3 - ref[0], my = (a[1] + b[1] + c[1])/3 - ref[1], mz = (a[2] + b[2] + c[2])/3 - ref[2];
          if (nx*mx + ny*my + nz*mz < 0){ const t = b; b = c; c = t; nx = -nx; ny = -ny; nz = -nz; } }
        for (const p of [a, b, c]){ P.push(p[0], p[2], -p[1]); N.push(nx, nz, -ny); PT.push(part); MT.push(mat); }
        B.tris++; return B;
      },
      quad(a, b, c, d, ref){ B.tri(a, b, c, ref); B.tri(a, c, d, ref); return B; },
      // an axis-aligned box (centre, size); o.skip = 'bottom' etc.; o.taper = top scale (x, y)
      box(cx, cy, cz, sx, sy, sz, o){
        o = o || {}; const hx = sx/2, hy = sy/2, hz = sz/2, tx = (o.tx === undefined ? 1 : o.tx)*hx, ty = (o.ty === undefined ? 1 : o.ty)*hy, ox = o.ox || 0;
        const b = [[cx - hx, cy - hy, cz - hz], [cx + hx, cy - hy, cz - hz], [cx + hx, cy + hy, cz - hz], [cx - hx, cy + hy, cz - hz]];
        const t = [[cx - tx + ox, cy - ty, cz + hz], [cx + tx + ox, cy - ty, cz + hz], [cx + tx + ox, cy + ty, cz + hz], [cx - tx + ox, cy + ty, cz + hz]];
        const r = [cx + ox*0.5, cy, cz];
        if (!o.noBottom) B.quad(b[0], b[1], b[2], b[3], r);
        if (!o.noTop) B.quad(t[0], t[1], t[2], t[3], r);
        for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; B.quad(b[i], b[j], t[j], t[i], r); }
        return B;
      },
      // a side profile [[x, z]...] (convex or star-shaped around its mean) extruded across y0..y1
      profileY(pr, y0, y1, o){
        o = o || {}; let mx = 0, mz = 0; for (const p of pr){ mx += p[0]; mz += p[1]; } mx /= pr.length; mz /= pr.length; const r = [mx, (y0 + y1)/2, mz];
        for (let i = 0; i < pr.length; i++){ const a = pr[i], b = pr[(i + 1) % pr.length]; if (o.skipEdge && o.skipEdge(i)) continue; B.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], r); }
        if (!o.noCaps) for (const y of [y0, y1]){ const c = [mx, y, mz]; for (let i = 0; i < pr.length; i++){ const a = pr[i], b = pr[(i + 1) % pr.length]; B.tri(c, [a[0], y, a[1]], [b[0], y, b[1]], [mx, (y0 + y1)/2, mz]); } }
        return B;
      },
      // a cross-section [[y, z]...] extruded along x0..x1
      profileX(pr, x0, x1, o){
        o = o || {}; let my = 0, mz = 0; for (const p of pr){ my += p[0]; mz += p[1]; } my /= pr.length; mz /= pr.length; const r = [(x0 + x1)/2, my, mz];
        for (let i = 0; i < pr.length; i++){ const a = pr[i], b = pr[(i + 1) % pr.length]; B.quad([x0, a[0], a[1]], [x0, b[0], b[1]], [x1, b[0], b[1]], [x1, a[0], a[1]], r); }
        if (!o.noCaps) for (const x of [x0, x1]){ const c = [x, my, mz]; for (let i = 0; i < pr.length; i++){ const a = pr[i], b = pr[(i + 1) % pr.length]; B.tri(c, [x, a[0], a[1]], [x, b[0], b[1]], r); } }
        return B;
      },
      // a top-view polygon [[x, y]...] from z0 to z1, the top inset by k (chamfered / sloped sides), centred at (ox, oy)
      prismZ(pl, z0, z1, k, o){
        o = o || {}; let mx = 0, my = 0; for (const p of pl){ mx += p[0]; my += p[1]; } mx /= pl.length; my /= pl.length; const r = [mx, my, (z0 + z1)/2];
        const top = pl.map(p => [mx + (p[0] - mx)*(1 - k), my + (p[1] - my)*(1 - k)]);
        for (let i = 0; i < pl.length; i++){ const j = (i + 1) % pl.length, a = pl[i], b = pl[j], c = top[j], d = top[i];
          B.quad([a[0], a[1], z0], [b[0], b[1], z0], [c[0], c[1], z1], [d[0], d[1], z1], r); }
        for (let i = 0; i < pl.length; i++){ const j = (i + 1) % pl.length; B.tri([mx, my, z1], [top[i][0], top[i][1], z1], [top[j][0], top[j][1], z1], r); if (!o.noBottom) B.tri([mx, my, z0], [pl[i][0], pl[i][1], z0], [pl[j][0], pl[j][1], z0], r); }
        return B;
      },
      // a cylinder along axis 'x' | 'y' | 'z' from c - len/2 to c + len/2; r1 = radius at the far end (cone)
      cyl(ax, cx, cy, cz, r, len, seg, o){
        o = o || {}; const r1 = o.r1 === undefined ? r : o.r1, h = len/2, ring = [];
        const at = (a, rr, s) => { const u = Math.cos(a)*rr, v = Math.sin(a)*rr; return ax === 'x' ? [cx + s, cy + u, cz + v] : ax === 'y' ? [cx + u, cy + s, cz + v] : [cx + u, cy + v, cz + s]; };
        const ref = [cx, cy, cz], a0 = o.a0 || 0;
        for (let i = 0; i < seg; i++){ const a = a0 + i*TAU/seg, b = a0 + (i + 1)*TAU/seg;
          B.quad(at(a, r, -h), at(b, r, -h), at(b, r1, h), at(a, r1, h), ref);
          if (!o.noCap0) B.tri(at(0, 0, -h), at(a, r, -h), at(b, r, -h), ref);
          if (!o.noCap1 && r1 > 0) B.tri(at(0, 0, h), at(a, r1, h), at(b, r1, h), ref); }
        return B;
      },
      // a low-poly sphere / dome (zc = centre); top only when o.dome; squash z by o.sz
      sphere(cx, cy, cz, r, seg, rings, o){
        o = o || {}; const sz = o.sz || 1, t0 = o.dome ? 0 : -PI/2, ref = [cx, cy, cz + (o.dome ? r*0.3*sz : 0)];
        const pt = (i, j) => { const th = t0 + (PI/2 - t0)*j/rings, ph = i*TAU/seg; return [cx + Math.cos(th)*Math.cos(ph)*r, cy + Math.cos(th)*Math.sin(ph)*r, cz + Math.sin(th)*r*sz]; };
        for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++){ const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1); if (j === rings - 1) B.tri(a, b, c, ref); else B.quad(a, b, c, d, ref); }
        if (o.dome && !o.open){ for (let i = 0; i < seg; i++) B.tri([cx, cy, cz], pt(i, 0), pt(i + 1, 0), ref); }
        return B;
      },
      geo(){
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
        g.setAttribute('aPart', new THREE.Float32BufferAttribute(PT, 1)); g.setAttribute('aMat', new THREE.Float32BufferAttribute(MT, 1));
        g.computeBoundingSphere(); return g;
      }};
    return B;
  }
  const mirrorY = pts => pts.concat(pts.slice().reverse().map(p => [p[0], -p[1]]));
  // ================================================================ main battle tank (generic): hull with a sloped glacis, side skirts over
  // seven road wheels, tracks, an angular turret with a long smoothbore gun, a commander's cupola, a remote weapon mount, smoke dischargers
  function tank(B, lod, turretOnly){
    const S = ARC.SPEC.tank, tx = S.tx, tz0 = 1.55;
    if (!turretOnly){
      B.set(0, 0);
      if (lod){
        B.profileY([[-3.6, 0.45], [3.0, 0.45], [3.7, 1.1], [2.3, 1.55], [-3.5, 1.58]], -1.8, 1.8);
        B.set(0, 2); for (const sy of [1, -1]) B.box(-0.05, sy*1.5, 0.48, 7.2, 0.62, 0.92, {noTop:true});
      } else {
        // lower hull between the tracks, then the upper hull / sponsons over the tracks
        B.profileY([[-3.55, 0.5], [2.95, 0.5], [3.55, 0.95], [3.62, 1.12], [2.35, 1.5], [-3.35, 1.55], [-3.6, 1.3]], -1.18, 1.18);
        B.profileY([[-3.62, 1.12], [3.3, 1.12], [3.62, 1.14], [2.35, 1.52], [-3.38, 1.56]], -1.82, 1.82);
        // glacis details: driver's hatch, periscopes, lamps; engine deck grilles; rear plate exhaust; tow points
        B.set(0, 1).box(2.45, 0.35, 1.53, 0.55, 0.5, 0.05); B.set(0, 3); for (const y of [0.15, 0.35, 0.55]) B.box(2.78, y, 1.47, 0.08, 0.13, 0.07);
        B.set(0, 4); for (const sy of [1, -1]) B.box(3.38, sy*1.45, 1.17, 0.12, 0.3, 0.12);
        B.set(0, 5); for (const sy of [1, -1]) B.box(-3.63, sy*1.55, 1.3, 0.06, 0.22, 0.12);
        B.set(0, 1); for (const sy of [1, -1]) B.box(-2.55, sy*0.55, 1.575, 1.5, 0.75, 0.04);
        B.box(-1.55, 0, 1.575, 0.35, 1.9, 0.035);
        B.set(0, 8).box(-3.61, 0, 0.95, 0.05, 1.5, 0.45);
        B.set(0, 1); for (const sy of [1, -1]) B.box(3.6, sy*0.85, 0.82, 0.18, 0.18, 0.18);
        B.set(0, 0); for (const sy of [1, -1]) B.box(-3.0, sy*1.62, 1.68, 1.1, 0.35, 0.25);    // stowage bins on the rear deck
        // side skirts: six panels a side
        for (const sy of [1, -1]) for (let i = 0; i < 6; i++){ const x0 = -3.3 + i*1.09; B.set(0, 0).box(x0 + 0.52, sy*1.86, 0.88, 1.03, 0.08, 0.52); }
        // running gear: the track belt (no side caps), the inner wall, seven road wheels, sprocket and idler a side
        const tp = [[-3.05, 0.02], [2.9, 0.02], [3.4, 0.32], [3.68, 0.66], [3.5, 0.94], [-3.45, 0.98], [-3.74, 0.76], [-3.52, 0.3]];
        for (const sy of [1, -1]){
          B.set(0, 2).profileY(tp, sy*1.22, sy*1.8, {noCaps:true});
          B.set(0, 1).profileY(tp.map(p => [p[0]*0.98, Math.min(0.9, Math.max(0.1, p[1]))]), sy*1.24, sy*1.25, {});
          for (let i = 0; i < 7; i++){ const x = -2.72 + i*0.9; B.set(0, 6).cyl('y', x, sy*1.6, 0.4, 0.37, 0.36, 10); B.set(0, 9).cyl('y', x, sy*1.79, 0.4, 0.15, 0.06, 6); }
          B.set(0, 1).cyl('y', -3.42, sy*1.55, 0.78, 0.33, 0.5, 12); B.cyl('y', 3.38, sy*1.55, 0.66, 0.3, 0.5, 10);
        }
      }
    }
    // the turret (part 1) around the ring at (tx, *): coordinates relative to the hull origin
    const ox = turretOnly ? -tx : 0, oz = turretOnly ? -tz0 : 0;
    const T = (x, y, z) => [x + tx + ox, y, z + oz];
    B.set(1, 0);
    if (lod){
      B.prismZ(mirrorY([[1.9, 0.5], [1.3, 1.7], [-2.5, 1.6]]).map(p => [p[0] + tx + ox, p[1]]), tz0 + oz, 2.4 + oz, 0.08);
      B.set(2, 1).box(tx + ox + S.gx + S.glen/2 + 0.2, 0, S.gz + oz, S.glen - 0.4, 0.22, 0.22);
      return B;
    }
    const tpl = mirrorY([[1.98, 0.42], [1.45, 1.72], [-1.45, 1.8], [-2.55, 1.5], [-2.72, 0.5]]).map(p => [p[0] + tx + ox, p[1]]);
    B.prismZ(tpl, tz0 + oz, 2.42 + oz, 0.1);
    // roof details: cupola with vision blocks and hatch, gunner's sight, loader's hatch, remote weapon mount, dischargers, basket, aerials
    B.set(1, 0).cyl('z', ...T(-0.55, 0.75, 2.53), 0.4, 0.22, 10);
    B.set(1, 3); for (let i = 0; i < 6; i++){ const a = i*TAU/6 + 0.3; B.box(...T(-0.55 + Math.cos(a)*0.38, 0.75 + Math.sin(a)*0.38, 2.56), 0.08, 0.08, 0.08); }
    B.set(1, 1).cyl('z', ...T(-0.55, 0.75, 2.66), 0.32, 0.05, 10);
    B.set(1, 0).box(...T(0.95, 0.62, 2.6), 0.55, 0.42, 0.36); B.set(1, 3).box(...T(1.23, 0.62, 2.62), 0.02, 0.3, 0.2);
    B.set(1, 1).box(...T(-0.6, -0.55, 2.45), 0.6, 0.6, 0.05);
    // remote weapon mount (the machine gun fires from here)
    B.set(1, 0).box(...T(-0.55, -0.55, 2.62), 0.5, 0.42, 0.3); B.set(1, 1).box(...T(-0.35, -0.55, 2.86), 0.55, 0.16, 0.16); B.cyl('x', ...T(0.25, -0.55, 2.88), 0.025, 1.0, 5);
    B.set(1, 3).box(...T(-0.38, -0.36, 2.86), 0.1, 0.15, 0.12);
    B.set(1, 1); for (const sy of [1, -1]) for (let i = 0; i < 4; i++) B.cyl('x', ...T(1.15 - i*0.04, sy*(1.42 + (i % 2)*0.12), 2.15 + Math.floor(i/2)*0.12), 0.05, 0.24, 6);
    B.set(1, 1).box(...T(-2.85, 0, 1.95), 0.4, 2.6, 0.04).box(...T(-3.03, 0, 2.08), 0.04, 2.6, 0.3); for (const sy of [1, -1]) B.box(...T(-2.85, sy*1.3, 2.08), 0.4, 0.04, 0.3);
    B.set(0, 7).box(...T(-2.85, 0.35, 2.02), 0.32, 0.7, 0.16);       // a rolled tarp in the basket
    B.set(1, 1); for (const sy of [1, -1]) B.box(...T(-2.2, sy*1.1, 3.4), 0.025, 0.025, 2.0);
    B.set(1, 0); for (const sy of [1, -1]) B.box(...T(-1.9, sy*1.86, 2.0), 1.3, 0.12, 0.45);      // side stowage boxes
    // gun (part 2): mantlet, thermal sleeve, fume extractor, muzzle reference; trunnion at (tx + gx, gz)
    const gx = tx + S.gx + ox, gz = S.gz + oz;
    B.set(2, 0).box(gx + 0.25, 0, gz, 0.7, 0.85, 0.62, {tx:0.8});
    B.set(2, 1).cyl('x', gx + 1.75, 0, gz, 0.14, 2.3, 10);
    B.set(2, 0).cyl('x', gx + 3.15, 0, gz, 0.185, 0.75, 10);
    B.set(2, 1).cyl('x', gx + 4.4, 0, gz, 0.105, 1.85, 10);
    B.cyl('x', gx + 5.25, 0, gz, 0.125, 0.12, 10);
    B.set(1, 1).cyl('x', gx + 0.35, -0.55, gz + 0.08, 0.035, 0.5, 5);     // coaxial gun
    return B;
  }
  // ================================================================ armoured personnel carrier (generic 8x8): boat-shaped hull, eight big wheels, a small
  // turret with an automatic cannon, rear ramp door, trim vane
  function apc(B, lod){
    const S = ARC.SPEC.apc, tx = S.tx;
    B.set(0, 0);
    if (lod){
      B.profileY([[-3.95, 0.7], [3.3, 0.7], [3.95, 1.3], [2.6, 2.05], [-3.9, 2.1]], -1.45, 1.45);
      B.set(0, 6); for (const x of [-2.9, -1.55, 1.15, 2.5]) for (const sy of [1, -1]) B.box(x, sy*1.25, 0.6, 1.1, 0.4, 1.1, {});
      B.set(1, 0).box(tx, 0, 2.38, 1.6, 1.4, 0.55, {tx:0.85, ty:0.85}); B.set(2, 1).box(tx + S.gx + 1.25, 0, S.gz, 2.5, 0.12, 0.12);
      return B;
    }
    // hull: lower with the wheel wells, upper with sloped sides (prism inset), the bow
    B.profileY([[-3.95, 0.72], [3.15, 0.72], [3.95, 1.28], [3.92, 1.48], [-3.95, 1.5]], -1.45, 1.45);
    B.prismZ([[3.92, 1.45], [2.7, 1.47], [-3.95, 1.47], [-3.95, -1.47], [2.7, -1.47], [3.92, -1.45]], 1.5, 2.12, 0.1);
    B.set(0, 1).box(3.4, 0, 1.36, 0.1, 2.3, 0.5);          // trim vane
    B.set(0, 3); for (const y of [0.55, 0.75, 0.95]) B.box(2.95, y, 2.0, 0.08, 0.14, 0.08);
    B.set(0, 1).box(2.5, 0.75, 2.13, 0.6, 0.55, 0.04).box(-1.2, 0, 2.13, 1.3, 1.6, 0.04);    // hatches
    B.box(-3.97, 0, 1.25, 0.04, 1.5, 1.2);                 // rear ramp door outline
    B.set(0, 4); for (const sy of [1, -1]) B.box(3.82, sy*1.2, 1.55, 0.1, 0.24, 0.12);
    B.set(0, 5); for (const sy of [1, -1]) B.box(-3.97, sy*1.25, 1.75, 0.05, 0.18, 0.12);
    B.set(0, 8).box(-2.9, -1.47, 1.85, 0.6, 0.04, 0.25);
    B.set(0, 0); for (const sy of [1, -1]) B.box(-0.2, sy*1.48, 1.85, 2.6, 0.08, 0.35);       // side stowage
    // wheels with arches
    for (const x of [-2.9, -1.55, 1.15, 2.5]) for (const sy of [1, -1]){
      B.set(0, 6).cyl('y', x, sy*1.24, 0.6, 0.58, 0.44, 14); B.set(0, 9).cyl('y', x, sy*1.47, 0.6, 0.24, 0.04, 8); B.set(0, 1).cyl('y', x, sy*1.5, 0.6, 0.07, 0.05, 6);
      B.set(0, 0).box(x, sy*1.42, 1.32, 1.4, 0.16, 0.08); }
    // turret (part 1), cannon (part 2)
    B.set(1, 0).prismZ([[tx + 0.85, 0.55], [tx + 0.35, 0.78], [tx - 0.8, 0.78], [tx - 0.9, -0.78], [tx + 0.35, -0.78], [tx + 0.85, -0.55]], 2.12, 2.7, 0.14);
    B.set(1, 1).cyl('z', tx - 0.35, 0.4, 2.75, 0.28, 0.1, 8); B.set(1, 3).box(tx + 0.45, -0.45, 2.78, 0.3, 0.22, 0.16);
    B.set(1, 1); for (const sy of [1, -1]) for (let i = 0; i < 3; i++) B.cyl('x', tx + 0.6, sy*(0.78 + i*0.08), 2.45 + (i % 2)*0.08, 0.04, 0.2, 6);
    const gx = tx + S.gx, gz = S.gz;
    B.set(2, 0).box(gx + 0.1, 0, gz, 0.35, 0.42, 0.32); B.set(2, 1).cyl('x', gx + 1.35, 0, gz, 0.06, 2.2, 8); B.cyl('x', gx + 0.6, 0, gz, 0.09, 0.6, 8); B.cyl('x', gx + 2.38, 0, gz, 0.075, 0.12, 8);
    return B;
  }
  // ================================================================ troop truck (generic 6x6): cab-over cab with a sloped windscreen, chassis, cargo bed
  // with a canvas tilt on hoops, six wheels
  function truck(B, lod){
    B.set(0, 0);
    if (lod){
      B.profileY([[2.4, 1.0], [4.15, 1.0], [4.15, 2.0], [3.85, 2.85], [2.4, 2.9]], -1.25, 1.25);
      B.set(0, 7).box(-1.0, 0, 2.35, 6.3, 2.5, 1.6); B.set(0, 6); for (const x of [3.2, -1.6, -3.0]) for (const sy of [1, -1]) B.box(x, sy*1.05, 0.58, 1.1, 0.4, 1.1);
      return B;
    }
    B.profileY([[2.4, 1.02], [4.15, 1.02], [4.15, 1.98], [3.88, 2.82], [2.4, 2.9]], -1.25, 1.25);
    B.set(0, 3).quad([4.17, 1.1, 2.05], [4.17, -1.1, 2.05], [3.9, -1.1, 2.75], [3.9, 1.1, 2.75], [3.0, 0, 2]);
    for (const sy of [1, -1]) B.quad([3.95, sy*1.26, 1.65], [3.0, sy*1.26, 1.65], [3.0, sy*1.26, 2.6], [3.75, sy*1.26, 2.6], [3.3, 0, 2]);
    B.set(0, 1).box(4.22, 0, 1.2, 0.18, 2.5, 0.25).box(4.17, 0, 1.6, 0.06, 1.3, 0.45);     // bumper, grille
    B.set(0, 4); for (const sy of [1, -1]) B.box(4.25, sy*0.95, 1.22, 0.06, 0.25, 0.15);
    B.set(0, 1); for (const sy of [1, -1]) B.box(3.8, sy*1.38, 2.3, 0.05, 0.05, 0.4);          // mirrors
    B.set(0, 1).box(-0.8, 0, 0.95, 7.0, 1.0, 0.22).box(1.0, 1.15, 0.9, 0.9, 0.35, 0.45);     // chassis, fuel tank
    B.set(0, 0).box(-0.95, 0, 1.33, 6.4, 2.5, 0.55, {noBottom:true});                       // cargo bed sides
    B.set(0, 5); for (const sy of [1, -1]) B.box(-4.17, sy*1.05, 1.15, 0.05, 0.22, 0.12);
    // canvas tilt with hoop ridges
    const cv = [[-1.27, 1.6], [1.27, 1.6], [1.27, 2.85], [0.92, 3.18], [-0.92, 3.18], [-1.27, 2.85]];
    B.set(0, 7).profileX(cv, -4.12, 2.2);
    for (let i = 0; i < 5; i++){ const x = -3.8 + i*1.45; B.profileX(cv.map(p => [p[0]*1.012, 1.6 + (p[1] - 1.6)*1.012]), x - 0.04, x + 0.04, {noCaps:true}); }
    // wheels
    for (const x of [3.2, -1.6, -3.0]) for (const sy of [1, -1]){ B.set(0, 6).cyl('y', x, sy*1.05, 0.58, 0.56, 0.42, 14); B.set(0, 9).cyl('y', x, sy*1.27, 0.58, 0.25, 0.03, 8); }
    B.set(0, 0); for (const sy of [1, -1]) B.box(3.2, sy*1.1, 1.28, 1.25, 0.5, 0.06);          // front wings
    return B;
  }
  // ================================================================ a soldier (~1.8 m; helmet, vest, pack, rifle or launcher tube); parts for the shader's
  // skeleton: 0 pelvis, 1 torso, 2 head, 3/4 left upper / fore arm, 5/6 right, 7/8 left thigh / shin, 9/10 right, 11 rifle, 12 tube
  function soldier(B, lod){
    const box = (p, m, cx, cy, cz, sx, sy, sz, o) => B.set(p, m).box(cx, cy, cz, sx, sy, sz, o);
    if (lod){
      box(0, 10, 0, 0, 1.0, 0.22, 0.34, 0.2); box(1, 10, 0, 0, 1.3, 0.28, 0.44, 0.42, {tx:1.0, ty:1.05}); box(2, 14, 0.01, 0, 1.68, 0.28, 0.27, 0.24, {tx:0.7, ty:0.7});
      for (const s of [1, -1]){ const a = s > 0 ? 3 : 5, l = s > 0 ? 7 : 9;
        box(a, 10, 0, s*0.23, 1.31, 0.1, 0.1, 0.28, {noTop:true, noBottom:true}); box(a + 1, 10, 0, s*0.23, 1.04, 0.09, 0.09, 0.26, {noTop:true});
        box(l, 10, 0, s*0.1, 0.74, 0.15, 0.15, 0.44, {noTop:true, noBottom:true}); box(l + 1, 13, 0.03, s*0.1, 0.28, 0.14, 0.13, 0.5, {noTop:true}); }
      box(11, 15, 0.47, 0, 0, 0.95, 0.06, 0.1); box(12, 17, 0.02, 0, 0, 1.15, 0.12, 0.12);
      return B;
    }
    // pelvis, belt
    box(0, 10, 0, 0, 1.0, 0.22, 0.35, 0.2); box(0, 11, 0, 0, 1.08, 0.24, 0.37, 0.06);
    // torso (tapering out to the chest), vest with pouches, pack, neck
    box(1, 10, 0, 0, 1.29, 0.24, 0.38, 0.42, {tx:1.0, ty:1.12});
    box(1, 11, 0.01, 0, 1.3, 0.31, 0.43, 0.33, {tx:1.0, ty:1.05}); for (const y of [-0.12, 0, 0.12]) box(1, 11, 0.17, y, 1.2, 0.05, 0.1, 0.12);
    box(1, 16, -0.22, 0, 1.3, 0.16, 0.32, 0.36, {tx:0.9}); box(1, 16, -0.2, 0, 1.08, 0.12, 0.3, 0.1);
    box(1, 12, 0, 0, 1.535, 0.09, 0.1, 0.08);
    // head and helmet
    B.set(2, 12).sphere(0.01, 0, 1.64, 0.1, 6, 3, {sz:1.15}); B.set(2, 14).sphere(0, 0, 1.665, 0.145, 8, 3, {dome:true, sz:0.85});
    B.set(2, 14).cyl('z', 0, 0, 1.67, 0.152, 0.025, 8, {noCap0:true, noCap1:true});
    // arms: shoulder (0, +-0.22, 1.45) -> elbow 1.17 -> wrist 0.92; hands
    for (const s of [1, -1]){ const a = s > 0 ? 3 : 5;
      box(a, 10, 0, s*0.225, 1.31, 0.115, 0.115, 0.3, {tx:0.85, ty:0.85}); box(a + 1, 10, 0, s*0.225, 1.05, 0.1, 0.1, 0.26, {tx:0.8, ty:0.8}); box(a + 1, 13, 0.01, s*0.225, 0.88, 0.08, 0.06, 0.09); }
    // legs: hip (0, +-0.1, 0.95) -> knee 0.52 -> ankle 0.1; boots forward
    for (const s of [1, -1]){ const l = s > 0 ? 7 : 9;
      box(l, 10, 0, s*0.1, 0.74, 0.16, 0.155, 0.44, {tx:0.82, ty:0.85}); box(l + 1, 10, 0, s*0.1, 0.33, 0.13, 0.12, 0.38, {tx:0.8, ty:0.82});
      box(l + 1, 13, 0.035, s*0.1, 0.065, 0.27, 0.12, 0.13); box(l + 1, 11, 0.075, s*0.1, 0.55, 0.05, 0.13, 0.12); }
    // rifle (part 11): stock at the origin, muzzle at +0.95 (x); magazine, handguard, optic
    box(11, 15, 0.12, 0, -0.01, 0.24, 0.05, 0.11); box(11, 15, 0.42, 0, 0.01, 0.36, 0.06, 0.1); box(11, 15, 0.43, 0, -0.09, 0.08, 0.04, 0.14, {ox:0.03});
    box(11, 15, 0.7, 0, 0.0, 0.22, 0.05, 0.065); B.set(11, 15).cyl('x', 0.9, 0, 0.01, 0.012, 0.2, 4); box(11, 15, 0.42, 0, 0.08, 0.12, 0.035, 0.05);
    // launcher tube (part 12): along x from -0.55 to +0.6, sight on the left
    B.set(12, 17).cyl('x', 0.02, 0, 0, 0.06, 1.15, 8); B.set(12, 15).box(0.15, 0.09, 0.04, 0.14, 0.05, 0.1).box(-0.05, 0, -0.1, 0.06, 0.04, 0.14);
    B.set(12, 15).cyl('x', 0.57, 0, 0, 0.068, 0.05, 8, {noCap1:true});
    return B;
  }
  // concrete barrier (jersey profile) for the roadblocks
  function barrier(B){ B.set(0, 9).profileX([[-0.32, 0], [0.32, 0], [0.3, 0.08], [0.13, 0.3], [0.1, 0.82], [-0.1, 0.82], [-0.13, 0.3], [-0.3, 0.08]], -1.5, 1.5); return B; }
  const cache = {};
  function geo(kind, lod){
    const k = kind + lod; if (cache[k]) return cache[k];
    const B = Builder();
    if (kind === 'tank') tank(B, lod); else if (kind === 'turret') tank(B, lod, true); else if (kind === 'apc') apc(B, lod); else if (kind === 'truck') truck(B, lod);
    else if (kind === 'soldier') soldier(B, lod); else if (kind === 'barrier') barrier(B);
    const g = B.geo(); g.userData.tris = B.tris; return cache[k] = g;
  }
  // turret pivot / trunnion per vehicle kind for the shader: (pivot x, pivot z, trunnion x rel. pivot, trunnion z) in three.js axes
  function pivots(kind){ const S = ARC.SPEC[kind === 'turret' ? 'tank' : kind]; if (!S || !S.gun) return [0, 0, 0, 0];
    return kind === 'turret' ? [0, 0, S.gx, S.gz - 1.55] : [S.tx, kind === 'tank' ? 1.55 : 2.12, S.gx, S.gz]; }
  return {Builder, geo, pivots, tank, apc, truck, soldier};
})();

// ---- 30_render.js: materials (Lambert + injected code: camouflage per city, turret / gun / recoil, track tread, lamps, burnt wrecks; the
// soldiers' skeleton in the vertex shader) and the instanced meshes (two levels of detail per kind, packed every frame)
const ARR = (() => {
  const PAL = {
    sg: {cam:[0x4a5a30, 0x2f3b22, 0x6b5a3c, 0x1c1e18], uni:[0x56653f, 0x39432f, 0x4d5a38], canvas:0x575e3d, dust:0x6a5e48},
    bay:{cam:[0x9c8b64, 0x6c6a47, 0x7a5f3e, 0x3b3528], uni:[0xa08f6c, 0x776c50, 0x8c7d5c], canvas:0x8a7b58, dust:0x9c8e72},
    nyc:{cam:[0x76797a, 0x4b4f52, 0xa3a5a3, 0x262829], uni:[0x6f7476, 0x4a4f52, 0x5d6265], canvas:0x5d6163, dust:0x7c7a74}};
  const U = {uCam:{value:[0, 1, 2, 3].map(() => new THREE.Color())}, uUni:{value:[0, 1, 2].map(() => new THREE.Color())}, uCanvas:{value:new THREE.Color()}, uDust:{value:new THREE.Color()},
    uNightA:{value:0}, uTimeA:{value:0}};
  function palette(city){ const P = PAL[city] || PAL.sg; P.cam.forEach((c, i) => U.uCam.value[i].setHex(c)); P.uni.forEach((c, i) => U.uUni.value[i].setHex(c)); U.uCanvas.value.setHex(P.canvas); U.uDust.value.setHex(P.dust); }
  // ---------------------------------------------------------------- GLSL
  const COMMON_V = `
attribute float aPart; attribute float aMat;
varying vec3 vObj; varying float vMat; varying vec4 vI1; varying float vTrk;
vec3 toL(vec3 p){ return vec3(p.x, -p.z, p.y); }
vec3 toT(vec3 p){ return vec3(p.x, p.z, -p.y); }
mat3 mP(float a){ float c = cos(a), s = sin(a); return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c); }
mat3 mR(float a){ float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 mY(float a){ float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }
`;
  // vehicles: aV0 = (turret yaw, gun pitch, recoil 0-1, track phase m), aV1 = (camo seed, burnt 0-1, turret gone, lamps 0-1)
  const VEH_V = COMMON_V + `
attribute vec4 aV0; attribute vec4 aV1; uniform vec4 uPiv;
vec3 armyVeh(vec3 p, bool nrm){
  if (aPart < 0.5) return p;
  vec3 piv = nrm ? vec3(0.0) : vec3(uPiv.x, uPiv.y, 0.0);
  vec3 q = p - piv;
  if (aPart > 1.5){
    vec3 tr = nrm ? vec3(0.0) : vec3(uPiv.z, uPiv.w - uPiv.y, 0.0);
    vec3 g = q - tr; if (!nrm) g.x -= aV0.z*0.5;
    float c = cos(aV0.y), s = sin(aV0.y); g = vec3(c*g.x - s*g.y, s*g.x + c*g.y, g.z);
    q = g + tr;
  }
  float c = cos(aV0.x), s = sin(aV0.x);
  q = vec3(c*q.x + s*q.z, q.y, -s*q.x + c*q.z);
  if (aV1.z > 0.5 && !nrm) return piv - vec3(0.0, 0.4, 0.0);
  return piv + q;
}`;
  // soldiers: aS0 = (anim prev, anim, blend, phase), aS1 = (fire pulse, aim pitch, head yaw, weapon 0 rifle / 1 mg / 2 tube), aS2 = (seed, skin, tumble, 0)
  const SOL_V = COMMON_V + `
attribute vec4 aS0; attribute vec4 aS1; attribute vec4 aS2;
// pose: L = hips / knees (L, R), A = shoulders / elbows (L, R), B = (adduction L, R, torso lean, pelvis drop), C = (body pitch, weapon mode, -, head yaw)
void pose(float id, float ph, float tum, out vec4 L, out vec4 A, out vec4 B, out vec4 C){
  float s = sin(ph*6.2832), c = cos(ph*6.2832);
  L = vec4(0.06, 0.1, -0.04, 0.06); A = vec4(0.5, 1.15, 0.3, 1.3); B = vec4(0.35, 0.3, 0.04, 0.0); C = vec4(0.0, 2.0, 0.0, 0.0);
  if (id < 0.5){ }
  else if (id < 1.5){ L = vec4(0.55*s, 0.2 + 1.0*max(0.0, c), -0.55*s, 0.2 + 1.0*max(0.0, -c)); A = vec4(0.8, 1.35, 0.4, 1.6); B = vec4(0.5, 0.45, 0.2, 0.03*abs(c)); C = vec4(0.0, 1.0, 0.0, 0.0); }
  else if (id < 2.5){ L = vec4(1.45, 1.5, -0.12, 1.62); A = vec4(1.3, 0.3, 0.55, 1.45); B = vec4(0.45, -0.25, 0.08, 0.45); C = vec4(0.0, 0.0, 0.0, 0.0); }
  else if (id < 3.5){ L = vec4(0.05, 0.1, -0.15, 0.25); A = vec4(2.75, 0.35, 1.8, 1.4); B = vec4(0.45, -0.25, 0.0, 0.0); C = vec4(1.48, 0.0, 0.0, 0.0); }
  else if (id < 4.5){ L = vec4(1.6, 2.3, 1.45, 2.2); A = vec4(0.9, 1.4, 0.5, 1.7); B = vec4(0.45, 0.4, 0.55, 0.55); C = vec4(0.0, 2.0, 0.0, 0.0); }
  else if (id < 5.5){ L = vec4(0.75*s, 0.25 + 1.3*max(0.0, c), -0.75*s, 0.25 + 1.3*max(0.0, -c)); A = vec4(0.2 - 0.7*s, 1.5, 0.2 + 0.7*s, 1.5); B = vec4(0.1, 0.1, 0.32, 0.04*abs(c)); C = vec4(0.0, 1.0, 0.0, 0.5*sin(ph*1.3)); }
  else if (id < 6.5){ L = vec4(0.35*tum, 0.5*tum, 0.1, 0.25); A = vec4(2.2*tum, 0.5, 1.2*tum, 0.3); B = vec4(-0.4*tum, -0.5*tum, -0.2*tum, 0.0); C = vec4(-1.52*tum, 1.0, 0.0, 0.0); }
  else if (id < 7.5){ L = vec4(0.18, 0.08, -0.12, 0.05); A = vec4(1.3, 0.3, 0.55, 1.45); B = vec4(0.45, -0.25, 0.02, 0.0); C = vec4(0.0, 0.0, 0.0, 0.0); }
  else if (id < 8.5){ L = vec4(1.45, 1.5, -0.12, 1.62); A = vec4(1.15, 0.9, 1.0, 1.5); B = vec4(0.4, 0.2, 0.05, 0.45); C = vec4(0.0, 3.0, 0.0, 0.0); }
  else { L = vec4(-0.1, 0.4, 0.3, 0.2); A = vec4(2.8*tum, 0.2, 2.6*tum, 0.3); B = vec4(0.2, 0.2, 0.0, 0.0); C = vec4(1.45*tum, 1.0, 0.0, 0.0); }
}
void armySol(vec3 pos, vec3 nrm, out vec3 P, out vec3 Nn){
  vec3 v = toL(pos), n = toL(nrm);
  float tum = aS2.z;
  vec4 La, Aa, Ba, Ca, Lb, Ab, Bb, Cb;
  pose(aS0.x, aS0.w, tum, La, Aa, Ba, Ca); pose(aS0.y, aS0.w, tum, Lb, Ab, Bb, Cb);
  float w = aS0.z; vec4 L = mix(La, Lb, w), A = mix(Aa, Ab, w), B = mix(Ba, Bb, w), C = mix(Ca, Cb, w);
  float rm = w > 0.5 ? Cb.y : Ca.y, aim = aS1.y, fp = aS1.x, hy = aS1.z + C.w;
  float aimK = (rm < 0.5 || (rm > 2.5 && rm < 3.5)) ? 1.0 : 0.0;
  A.x += aim*aimK; A.z += aim*aimK; A.z -= fp*0.15*aimK; A.x -= fp*0.1*aimK; B.z -= fp*0.05;
  int part = int(aPart + 0.5);
  mat3 R = mat3(1.0); vec3 p = v;
  if (part >= 7 && part <= 10){
    bool left = part <= 8; float hip = left ? L.x : L.z, kn = left ? L.y : L.w;
    vec3 H = vec3(0.0, left ? 0.1 : -0.1, 0.95), K = vec3(0.0, H.y, 0.52);
    if (part == 7 || part == 9){ R = mP(hip); p = H + R*(v - H); }
    else { vec3 k2 = H + mP(hip)*(K - H); R = mP(hip - kn); p = k2 + R*(v - K); }
  } else if (part >= 3 && part <= 6){
    bool left = part <= 4; float sh = left ? A.x : A.z, el = left ? A.y : A.w, ad = left ? -B.x : B.y;
    vec3 S = vec3(0.0, left ? 0.225 : -0.225, 1.45), E = vec3(0.0, S.y, 1.17);
    if (part == 3 || part == 5){ R = mP(sh)*mR(ad); p = S + R*(v - S); }
    else { vec3 e2 = S + mP(sh)*mR(ad)*(E - S); R = mP(sh + el)*mR(ad); p = e2 + R*(v - E); }
  } else if (part == 2){ vec3 Nk = vec3(0.0, 0.0, 1.52); R = mY(hy); p = Nk + R*(v - Nk); }
  vec3 Pv = vec3(0.0, 0.0, 1.0); mat3 lean = mP(-B.z);
  if (part >= 1 && part <= 6){ R = lean*R; p = Pv + lean*(p - Pv); }
  mat3 bodyR = mP(-C.x);
  if (part == 11 || part == 12){
    bool tube = part == 12; float wpn = aS1.w;
    if ((tube && wpn < 1.5) || (!tube && wpn > 1.5)){ P = vec3(0.0, -60.0, 0.0); Nn = nrm; return; }
    vec3 anc, d; bool world = false;
    if (rm < 0.5){ anc = vec3(0.1, -0.15, 1.42); d = vec3(cos(aim), 0.0, sin(aim)); world = true; }
    else if (rm < 1.5){ anc = vec3(0.26, 0.02, 1.2); d = normalize(vec3(0.25, 0.72, 0.62)); }
    else if (rm < 2.5){ anc = vec3(0.25, -0.08, 1.1); d = normalize(vec3(0.85, 0.12, -0.5)); }
    else { anc = vec3(-0.05, -0.17, 1.53); d = vec3(cos(aim), 0.0, sin(aim)); world = true; }
    if (tube && rm < 2.5){ anc = vec3(-0.18, -0.12, 1.3); d = normalize(vec3(0.25, 0.25, 0.94)); world = false; }
    if (world) anc.x -= fp*0.07;
    anc = Pv + lean*(anc - Pv); anc.z -= B.w; anc = bodyR*anc; anc.z += 0.16*abs(sin(C.x));
    if (!world) d = bodyR*(lean*d);
    vec3 up = abs(d.z) > 0.95 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 0.0, 1.0);
    vec3 yv = normalize(cross(up, d)), zv = cross(d, yv);
    mat3 W = mat3(d, yv, zv);
    P = toT(anc + W*v); Nn = toT(W*n); return;
  }
  p.z -= B.w; p = bodyR*p; p.z += 0.16*abs(sin(C.x)); R = bodyR*R;
  P = toT(p); Nn = toT(R*n);
}`;
  // the palette (fragment): material zones, camouflage from the rest position, burnt wrecks, dust low down; lamps glow
  const COMMON_F = `
uniform vec3 uCam[4]; uniform vec3 uUni[3]; uniform vec3 uCanvas; uniform vec3 uDust; uniform float uNightA; uniform float uTimeA;
varying vec3 vObj; varying float vMat; varying vec4 vI1; varying float vTrk;
vec3 camo(vec3 p, float seed, vec3 c0, vec3 c1, vec3 c2, vec3 c3, float sc){
  vec3 q = p*sc + vec3(seed*13.0, seed*7.0, seed*5.0);
  float a = sin(q.x*1.7 + sin(q.z*2.3 + q.y*1.1)*1.6) + sin(q.z*1.9 + q.y*1.3 + sin(q.x*2.1)*1.4);
  float b = sin(q.x*2.9 - q.z*1.7 + sin(q.y*2.6 + q.x)*1.2 + 2.0) + sin(q.y*3.1 + q.z*2.2 + 1.0);
  vec3 c = c0;
  c = mix(c, c1, step(0.5, a));
  c = mix(c, c2, step(0.85, b)*step(a, 0.9));
  c = mix(c, c3, step(1.45, a + b*0.35));
  return c;
}
vec3 armyCol(out vec3 em){
  float m = floor(vMat + 0.5); vec3 c = uCam[0]; em = vec3(0.0);
  float seed = vI1.x;
  if (m < 0.5) c = camo(vObj, seed, uCam[0], uCam[1], uCam[2], uCam[3], 0.33);
  else if (m < 1.5) c = uCam[3]*0.7 + vec3(0.03);
  else if (m < 2.5) c = vec3(0.13, 0.125, 0.115)*(0.7 + 0.45*step(0.45, fract((vObj.x + vTrk)*3.1)));
  else if (m < 3.5) c = vec3(0.05, 0.07, 0.085);
  else if (m < 4.5){ c = vec3(0.8, 0.8, 0.74); em = vec3(1.0, 0.95, 0.82)*(uNightA*1.4)*vI1.w; }
  else if (m < 5.5){ c = vec3(0.45, 0.05, 0.04); em = vec3(1.0, 0.08, 0.04)*(0.25 + uNightA)*vI1.w; }
  else if (m < 6.5) c = vec3(0.085, 0.085, 0.08);
  else if (m < 7.5) c = uCanvas;
  else if (m < 8.5) c = vec3(0.07, 0.065, 0.06);
  else if (m < 9.5) c = vec3(0.56, 0.55, 0.52);
  else if (m < 10.5) c = camo(vObj, seed, uUni[0], uUni[1], uUni[2], uUni[1]*0.7, 3.3);
  else if (m < 11.5) c = uUni[1]*0.82;
  else if (m < 12.5) c = mix(vec3(0.86, 0.66, 0.52), vec3(0.4, 0.27, 0.19), vI1.y);
  else if (m < 13.5) c = vec3(0.075, 0.07, 0.065);
  else if (m < 14.5) c = camo(vObj, seed + 0.3, uUni[0], uUni[1], uUni[2], uUni[1]*0.8, 2.6)*0.92;
  else if (m < 15.5) c = vec3(0.085, 0.085, 0.09);
  else if (m < 16.5) c = uUni[2]*0.9;
  else c = uCanvas*0.85;
  if (m < 9.5 && vObj.y < 1.0) c = mix(c, uDust, 0.35*(1.0 - max(vObj.y, 0.0)));
  float burnt = vI1.z;
  if (burnt > 0.0){   // soot with smooth rust-brown patches where the paint burnt off, greyer ash on the upper surfaces
    float n1 = sin(vObj.x*1.35 + vObj.z*0.9 + 1.7)*sin(vObj.y*2.3 - vObj.x*0.62) + 0.35*sin(vObj.z*3.1 + vObj.x*2.2);
    vec3 soot = mix(vec3(0.045, 0.042, 0.04), vec3(0.17, 0.10, 0.06), smoothstep(0.25, 0.85, n1*0.5 + 0.5)*0.75);
    soot = mix(soot, vec3(0.2, 0.19, 0.18), smoothstep(1.6, 2.6, vObj.y)*0.35);
    c = mix(c, soot, burnt*0.92); }
  return c;
}`;
  // ---------------------------------------------------------------- materials
  function vehMat(kind){
    const piv = ARM.pivots(kind), m = new THREE.MeshLambertMaterial({color:0xffffff});
    const UP = {value:new THREE.Vector4(piv[0], piv[1], piv[2], piv[3])};
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U); sh.uniforms.uPiv = UP;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + VEH_V)
        .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = armyVeh(vec3(normal), true);')
        .replace('#include <begin_vertex>', 'vec3 transformed = armyVeh(vec3(position), false);\n  vObj = position; vMat = aMat; vI1 = vec4(aV1.x, 0.5, aV1.y, aV1.w); vTrk = aV0.w;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + COMMON_F)
        .replace('#include <color_fragment>', '#include <color_fragment>\n  vec3 armyEm; diffuseColor.rgb = armyCol(armyEm);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += armyEm;');
    };
    m.customProgramCacheKey = () => 'armyVeh';
    const d = new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});
    d.onBeforeCompile = sh => { sh.uniforms.uPiv = UP;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + VEH_V).replace('#include <begin_vertex>', 'vec3 transformed = armyVeh(vec3(position), false);'); };
    d.customProgramCacheKey = () => 'armyVehD';
    return {m, d, UP};
  }
  function solMat(){
    const m = new THREE.MeshLambertMaterial({color:0xffffff});
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + SOL_V)
        .replace('#include <beginnormal_vertex>', 'vec3 armyP, armyN; armySol(position, normal, armyP, armyN); vec3 objectNormal = armyN;')
        .replace('#include <begin_vertex>', 'vec3 transformed = armyP;\n  vObj = position; vMat = aMat; vI1 = vec4(aS2.x, aS2.y, 0.0, 0.0); vTrk = 0.0;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + COMMON_F)
        .replace('#include <color_fragment>', '#include <color_fragment>\n  vec3 armyEm; diffuseColor.rgb = armyCol(armyEm);');
    };
    m.customProgramCacheKey = () => 'armySol';
    const d = new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});
    d.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + SOL_V)
      .replace('#include <begin_vertex>', 'vec3 armyP, armyN; armySol(position, vec3(0.0, 1.0, 0.0), armyP, armyN); vec3 transformed = armyP;'); };
    d.customProgramCacheKey = () => 'armySolD';
    return {m, d};
  }
  // ---------------------------------------------------------------- instanced meshes
  const R = {built:false, group:null, sets:{}, list:[], tris:0, ms:0};
  function iMesh(geo, mat, cap, attrs, shadow, name){
    const g = geo.clone(), A = {};
    for (const k in attrs){ const a = new THREE.InstancedBufferAttribute(new Float32Array(cap*attrs[k]), attrs[k]); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(k, a); A[k] = a; }
    const m = new THREE.InstancedMesh(g, mat.m, cap); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.count = 0; m.frustumCulled = false;
    m.castShadow = !!shadow; m.receiveShadow = !!shadow; if (mat.d) m.customDepthMaterial = mat.d; m.name = name; m.visible = false;
    R.group.add(m);
    const S = {mesh:m, cap, n:0, M:m.instanceMatrix.array, A, AL:Object.keys(attrs).map(k => A[k].array), attrs, tris:geo.userData.tris || 0, name};
    R.list.push(S); return S;
  }
  function build(){
    if (R.built) return true; if (typeof THREE === 'undefined' || typeof scene === 'undefined') return false;
    R.built = true; R.group = new THREE.Group(); R.group.name = 'army'; scene.add(R.group);
    const VA = {aV0:4, aV1:4}, SA = {aS0:4, aS1:4, aS2:4};
    for (const k of ['tank', 'apc', 'truck']){ const mt = vehMat(k); R.sets[k] = [iMesh(ARM.geo(k, 0), mt, 40, VA, true, 'army_' + k), iMesh(ARM.geo(k, 1), mt, 40, VA, false, 'army_' + k + '_far')]; }
    { const mt = vehMat('turret'); R.sets.turret = [iMesh(ARM.geo('turret', 0), mt, 16, VA, true, 'army_turret')]; }
    { const mt = solMat(); R.sets.sol = [iMesh(ARM.geo('soldier', 0), mt, 200, SA, true, 'army_soldier'), iMesh(ARM.geo('soldier', 1), mt, 200, SA, false, 'army_soldier_far')]; }
    { const m = new THREE.MeshLambertMaterial({color:0xa9a69e}); const g = ARM.geo('barrier', 0); const im = new THREE.InstancedMesh(g, m, 96); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.count = 0; im.frustumCulled = false; im.castShadow = true; im.receiveShadow = true; im.name = 'army_barrier'; im.visible = false; R.group.add(im);
      R.sets.barrier = [{mesh:im, cap:96, n:0, M:im.instanceMatrix.array, A:{}, AL:[], attrs:{}, tris:g.userData.tris, name:'army_barrier'}]; R.list.push(R.sets.barrier[0]); }
    return true;
  }
  // per frame: begin, put instances, end (uploads the used ranges)
  function begin(){ for (const S of R.list) S.n = 0; }
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);
  // world pose (x, y, z, heading h, pitch, roll) -> three matrix: yaw about Y by h, then pitch (nose up = about the vehicle's left axis), roll
  function poseM(x, y, z, h, pitch, roll, sy){
    _e.set(0, h, 0, 'YXZ'); _q.setFromEuler(_e);
    if (pitch || roll){ const qp = Q2.setFromAxisAngle(AXZ, pitch), qr = Q3.setFromAxisAngle(AXX, roll); _q.multiply(qp).multiply(qr); }
    _p.set(x, z, -y); _s.set(1, sy || 1, 1); return _m.compose(_p, _q, _s);
  }
  const Q2 = new THREE.Quaternion(), Q3 = new THREE.Quaternion(), AXZ = new THREE.Vector3(0, 0, 1), AXX = new THREE.Vector3(1, 0, 0);
  // world quaternion (z up, SGPhys) at a body centre -> three matrix for a model whose origin is hz below the centre (along the body's z)
  function quatM(cx, cy, cz, qx, qy, qz, qw, hz, sy){
    // world (x, y, z) -> three (x, z, -y): the rotation maps likewise: q3 = (qx, qz, -qy, qw)
    _q.set(qx, qz, -qy, qw); const up = _p.set(0, 1, 0).applyQuaternion(_q); const ox = -up.x*hz, oy = -up.y*hz, oz = -up.z*hz;
    _p.set(cx + ox, cz + oy, -cy + oz); _s.set(1, sy || 1, 1); return _m.compose(_p, _q, _s);
  }
  // the same written straight into the instance array from a pose object P (no Matrix4, no boxed arguments: draw() runs every frame):
  // P = {x, y, z, h, p (pitch), r (roll), s (y scale)} or, with P.useQ, a world quaternion (z up) at the body centre {x, y, cz, qx, qy, qz, qw, hz}
  const PZ = {x:0, y:0, z:0, h:0, p:0, r:0, s:1, useQ:false, cz:0, qx:0, qy:0, qz:0, qw:1, hz:0};
  function putP(S, P, a0, a1, a2){
    if (S.n >= S.cap) return -1; const i = S.n++, M = S.M, o = i*16, sy = P.s;
    let r00, r01, r02, r10, r11, r12, r20, r21, r22, px, py, pz;
    if (P.useQ){ const x = P.qx, y = P.qz, z = -P.qy, w = P.qw;      // world (x, y, z) -> three (x, z, -y)
      r00 = 1 - 2*(y*y + z*z); r01 = 2*(x*y - z*w); r02 = 2*(x*z + y*w); r10 = 2*(x*y + z*w); r11 = 1 - 2*(x*x + z*z); r12 = 2*(y*z - x*w); r20 = 2*(x*z - y*w); r21 = 2*(y*z + x*w); r22 = 1 - 2*(x*x + y*y);
      px = P.x - r01*P.hz; py = P.cz - r11*P.hz; pz = -P.y - r21*P.hz; }
    else { const ch = Math.cos(P.h), sh = Math.sin(P.h), cp = Math.cos(P.p), sp = Math.sin(P.p), cr = Math.cos(P.r), sr = Math.sin(P.r);
      r00 = ch*cp; r01 = -ch*sp*cr + sh*sr; r02 = ch*sp*sr + sh*cr; r10 = sp; r11 = cp*cr; r12 = -cp*sr; r20 = -sh*cp; r21 = sh*sp*cr + ch*sr; r22 = -sh*sp*sr + ch*cr;
      px = P.x; py = P.z; pz = -P.y; }
    M[o] = r00; M[o + 1] = r10; M[o + 2] = r20; M[o + 3] = 0; M[o + 4] = r01*sy; M[o + 5] = r11*sy; M[o + 6] = r21*sy; M[o + 7] = 0;
    M[o + 8] = r02; M[o + 9] = r12; M[o + 10] = r22; M[o + 11] = 0; M[o + 12] = px; M[o + 13] = py; M[o + 14] = pz; M[o + 15] = 1;
    const AL = S.AL, q = i*4;
    for (let k = 0; k < AL.length; k++){ const v = k === 0 ? a0 : k === 1 ? a1 : a2, arr = AL[k]; arr[q] = v[0]; arr[q + 1] = v[1]; arr[q + 2] = v[2]; arr[q + 3] = v[3]; }
    return i;
  }
  function put(S, m, a0, a1, a2){
    if (S.n >= S.cap) return -1; const i = S.n++; m.toArray(S.M, i*16);
    const AL = S.AL, o = i*4;
    for (let k = 0; k < AL.length; k++){ const v = k === 0 ? a0 : k === 1 ? a1 : a2, arr = AL[k]; arr[o] = v[0]; arr[o + 1] = v[1]; arr[o + 2] = v[2]; arr[o + 3] = v[3]; }
    return i;
  }
  function end(){
    let tris = 0;
    for (const S of R.list){ const m = S.mesh; m.count = S.n; m.visible = S.n > 0;
      if (S.n){ m.instanceMatrix.updateRange.offset = 0; m.instanceMatrix.updateRange.count = S.n*16; m.instanceMatrix.needsUpdate = true;
        for (const k in S.A){ const a = S.A[k]; a.updateRange.offset = 0; a.updateRange.count = S.n*S.attrs[k]; a.needsUpdate = true; }
        tris += S.n*S.tris; } }
    R.tris = tris;
  }
  function hide(){ if (!R.built) return; for (const S of R.list){ S.n = 0; S.mesh.count = 0; S.mesh.visible = false; } R.tris = 0; }
  function stats(){ if (!R.built) return null; const o = {}; for (const S of R.list) if (S.n) o[S.name] = S.n; return {inst:o, tris:R.tris, draws:R.list.filter(S => S.n).length, modelTris:Object.fromEntries(R.list.map(S => [S.name, S.tris]))}; }
  return {U, PAL, palette, build, begin, put, putP, PZ, end, hide, stats, poseM, quatM, R, VEH_V, SOL_V, COMMON_F};
})();

// ---- 31_fx.js: the battle's GPU particles (like lm27/fireworks): two instanced pools whose motion is computed in the vertex shader from
// the spawn values and one clock, so the CPU only writes spawn slots (partial uploads) - nothing per particle per frame.
//   glow pool (additive): sparks (ballistic streaks), tracers (straight streaks), flashes, fire (rising, cooling), rocket flares, embers
//   smoke pool (alpha): puffs that drift, rise, grow and fade (gun smoke, smoke rings, dust, exhaust, smoke columns over wrecks), lit for
//   the time of day and, near fires, by the flames
// Effects (world x, y, z): muzzle(), ring(), dust(), tracer(), sparks(), shellHit(), acHit(), smallHit(), rocket(), fireball(), burn(), exhaust().
const ARF = (() => {
  const SP_CAP = 8192, SM_CAP = 4096;
  const U = {uT:{value:0}, uH:{value:800}, uDay:{value:1}, uFogN:{value:1e6}, uFogF:{value:2e6}};
  const SU = {uT:U.uT, uTex:{value:null}, uWind:{value:new THREE.Vector3()}, uAmb:{value:new THREE.Color(1, 1, 1)}, uNight:{value:0}, uFogN:U.uFogN, uFogF:U.uFogF};
  let inited = false, SP = null, SM = null, mSp = null, mSm = null;
  const T = {now:0, n:0, sp:0, sm:0};
  function mkRing(cap, bs){ bs = bs || 256; const nb = Math.ceil(cap/bs);
    return {cap, bs, nb, bu:new Float64Array(nb).fill(-1e9), cb:[-1, -1], off:[0, 0], used:0, lo:1e9, hi:-1, until:-1e9, n:0, now:-1e9,
      take(tEnd){
        const ln = tEnd - this.now > 2.5 ? 1 : 0;
        if (this.cb[ln] < 0 || this.off[ln] >= this.bs || this.cb[ln]*this.bs + this.off[ln] >= this.cap){ this.cb[ln] = this.pick(); this.off[ln] = 0; }
        const c = this.cb[ln], i = c*this.bs + this.off[ln]++; if (tEnd > this.bu[c]) this.bu[c] = tEnd; if (tEnd > this.until) this.until = tEnd;
        if (i < this.lo) this.lo = i; if (i > this.hi) this.hi = i; if (i + 1 > this.used) this.used = Math.min(this.cap, (c + 1)*this.bs); this.n++; return i; },
      pick(){ let best = 0, bt = 1e300; for (let b = 0; b < this.nb; b++){ if (b === this.cb[0] || b === this.cb[1]) continue; if (this.bu[b] < this.now){ this.bu[b] = -1e9; return b; } if (this.bu[b] < bt){ bt = this.bu[b]; best = b; } } this.bu[best] = -1e9; return best; },
      idle(now){ this.now = now;
        if (now > this.until){ const was = this.used > 0; this.used = 0; this.cb[0] = this.cb[1] = -1; this.off[0] = this.off[1] = 0; this.bu.fill(-1e9); return was; }
        let hb = Math.max(this.cb[0], this.cb[1]); for (let b = this.nb - 1; b > hb; b--) if (this.bu[b] >= now){ hb = b; break; }
        this.used = Math.min(this.cap, (hb + 1)*this.bs); return false; }}; }
  const quad = () => { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]); g.instanceCount = 0; return g; };
  function pool(cap, bs, spec, g){ const R = mkRing(cap, bs); R.A = {}; R.AL = []; for (const k in spec){ const a = new THREE.InstancedBufferAttribute(new Float32Array(cap*spec[k]), spec[k]); a.setUsage(THREE.DynamicDrawUsage); R.A[k] = a; R.AL.push(a); g.setAttribute(k, a); } R.g = g; return R; }
  function commit(S){ if (S.hi < 0) return; for (const a of S.AL){ const s = a.itemSize, R = a.updateRange; let lo = S.lo*s, hi = (S.hi + 1)*s;
      if (R.count > 0){ lo = Math.min(lo, R.offset); hi = Math.max(hi, R.offset + R.count); } R.offset = lo; R.count = hi - lo; a.needsUpdate = true; } S.lo = 1e9; S.hi = -1; }
  // glow: aP (pos, t0), aV (vel, life), aC (rgb, size0), aX (size1, drag, mode, len / gravity)
  const SPV = `attribute vec4 aP; attribute vec4 aV; attribute vec4 aC; attribute vec4 aX;
uniform float uT; uniform float uH; uniform float uDay; uniform float uFogN; uniform float uFogF;
varying vec4 vS; varying vec4 vK; varying float vM;
vec3 pAt(float t, float k, float g){
  if (k < 0.001) return aP.xyz + aV.xyz*t - vec3(0.0, 4.905*g*t*t, 0.0);
  float e = (1.0 - exp(-k*t))/k, vt = -9.81*g/k;
  return aP.xyz + vec3(aV.x*e, vt*t + (aV.y - vt)*e, aV.z*e);
}
void main(){
  float age = uT - aP.w, life = aV.w, mode = floor(aX.z + 0.5);
  vS = vec4(0.0); vK = vec4(0.0); vM = mode;
  if (age < 0.0 || age > life){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float u = age/life, k = aX.y, sz = mix(aC.w, aX.x, u), b = 1.0;
  vec3 hd, tl; bool streak = mode < 0.5 || (mode > 0.5 && mode < 1.5) || (mode > 3.5 && mode < 4.5);
  vec3 col = aC.rgb;
  if (mode < 0.5){ hd = pAt(age, k, 1.0); tl = pAt(max(age - 0.045, 0.0), k, 1.0); b = 1.0 - u; col *= mix(vec3(1.0), vec3(1.0, 0.55, 0.25), u); }
  else if (mode < 1.5){ hd = aP.xyz + aV.xyz*age; float L = aX.w; vec3 dv = normalize(aV.xyz); tl = hd - dv*min(L, length(aV.xyz)*age); b = 1.0; }
  else if (mode < 2.5){ hd = tl = aP.xyz + aV.xyz*age; b = exp(-4.0*u)*(1.0 - u); }
  else if (mode < 3.5){ hd = tl = pAt(age, k, -aX.w); b = smoothstep(0.0, 0.08, u)*(1.0 - u)*(1.0 - u)*mix(1.3, 0.75, uDay);
    col = mix(vec3(1.0, 0.82, 0.5), mix(vec3(1.0, 0.48, 0.12), vec3(0.6, 0.12, 0.03), smoothstep(0.35, 0.9, u)), smoothstep(0.0, 0.3, u)); }
  else if (mode < 4.5){ hd = aP.xyz + aV.xyz*age; tl = hd - normalize(aV.xyz)*aX.w; b = 0.85 + 0.3*fract(sin(uT*91.0 + aP.w*13.0)*4375.5); }
  else { hd = tl = pAt(age, k, -aX.w); b = (1.0 - u)*(0.5 + 0.5*step(0.5, fract(sin(floor(uT*14.0) + aP.w*37.0)*4375.5))); }
  vec4 A = modelViewMatrix*vec4(tl, 1.0), B = modelViewMatrix*vec4(hd, 1.0);
  float zc = max(-B.z, 1.0), px = 2.0*zc/(projectionMatrix[1][1]*uH);
  float w = max(sz, 1.2*px), ext;
  vec4 mv;
  if (streak){
    ext = (mode > 0.5 && mode < 1.5 ? 2.6 : 3.2)*w;
    vec2 d = B.xy - A.xy; float l = length(d); vec2 dir = l > 1e-4 ? d/l : vec2(0.0, 1.0);
    float s = position.y*0.5 + 0.5; mv = mix(A, B, s);
    mv.xy += dir*position.y*ext + vec2(dir.y, -dir.x)*position.x*ext;
    vS = vec4(s*l + position.y*ext, position.x*ext, l, w);
  } else { ext = 2.4*w; mv = B; mv.xy += position.xy*ext; vS = vec4(position.x*ext, position.y*ext, -1.0, w); }
  float f = (1.0 - smoothstep(uFogN, uFogF, zc))*mix(1.0, 0.5, uDay), wc = 0.3;
  if (mode > 0.5 && mode < 1.5){ col *= mix(vec3(1.0), vec3(1.0, 0.62, 0.42), uDay); wc = mix(0.3, 0.12, uDay); }
  vK = vec4(col*b*f, b*f*wc);
  gl_Position = projectionMatrix*mv;
}`;
  const SPF = `varying vec4 vS; varying vec4 vK; varying float vM;
void main(){
  float w = vS.w; if (w <= 0.0) discard;
  float r, I, core;
  if (vS.z < 0.0){ r = length(vS.xy)/w; core = exp(-r*r*1.4); I = core*0.8 + exp(-r*2.2)*0.14; core *= 0.45; }
  else { float a = vS.x, l = vS.z, da = max(max(-a, a - l), 0.0); r = length(vec2(da, vS.y))/w; float g = l > 1e-4 ? clamp(a/l, 0.0, 1.0) : 1.0, tk = 0.25 + 0.75*g; core = exp(-r*r*2.2)*tk; I = core + exp(-r*1.5)*0.2*tk; }
  vec3 c = vK.rgb*I + vec3(vK.w*core);
  if (c.r + c.g + c.b < 0.003) discard;
  gl_FragColor = vec4(c, 1.0);
}`;
  // smoke: aP (pos, t0), aV (vel, life), aS (size0, size1, alpha, rise), aC (rgb, fire-lit 0-1)
  const SMV = `attribute vec4 aP; attribute vec4 aV; attribute vec4 aS; attribute vec4 aC;
uniform float uT; uniform vec3 uWind; uniform vec3 uAmb; uniform float uNight; uniform float uFogN; uniform float uFogF;
varying vec2 vUv; varying vec4 vC;
void main(){
  float kt = uT - aP.w, u = kt/aV.w;
  vUv = vec2(0.0); vC = vec4(0.0);
  if (kt < 0.0 || u > 1.0){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec3 c = aP.xyz + aV.xyz*(1.0 - exp(-kt*1.1))/1.1 + uWind*kt*(0.3 + 0.7*min(1.0, kt*0.3)) + vec3(0.0, aS.w*kt, 0.0);
  float size = mix(aS.x, aS.y, 1.0 - exp(-kt*2.2/aV.w*2.0));
  vec4 mv = modelViewMatrix*vec4(c, 1.0);
  float sd = fract(aP.w*7.31 + aC.w*3.0 + aP.x*0.013), ro = sd*6.2832 + kt*0.08*(sd - 0.5), cs = cos(ro), sn = sin(ro);
  mv.xy += vec2(position.x*cs - position.y*sn, position.x*sn + position.y*cs)*size;
  gl_Position = projectionMatrix*mv; vUv = position.xy*0.5 + 0.5;
  float lit = floor(aC.w*10.0)/10.0;
  vec3 col = aC.rgb*uAmb + vec3(1.0, 0.42, 0.12)*lit*(0.25 + 0.9*uNight)*(1.0 - smoothstep(0.0, 0.45, u));
  vC = vec4(col, aS.z*smoothstep(0.0, 0.06, u)*(1.0 - u)*(1.0 - u*0.4)*(1.0 - smoothstep(uFogN, uFogF, -mv.z)));
}`;
  const SMF = `uniform sampler2D uTex; varying vec2 vUv; varying vec4 vC;
void main(){ float a = texture2D(uTex, vUv).a*vC.a; if (a < 0.004) discard; gl_FragColor = vec4(vC.rgb, a); }`;
  function cloudTex(){
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); let a = 23;
    const r = () => { a = (a*16807) % 2147483647; return a/2147483647; };
    for (let i = 0; i < 36; i++){ const px = 64 + (r() - 0.5)*60, py = 64 + (r() - 0.5)*60, rr = 12 + r()*30, gr = x.createRadialGradient(px, py, 0, px, py, rr);
      gr.addColorStop(0, 'rgba(255,255,255,' + (0.25 + r()*0.35) + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); }
    const gr = x.createRadialGradient(64, 64, 22, 64, 64, 64); x.globalCompositeOperation = 'destination-in'; gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  function init(){
    if (inited) return true; if (typeof THREE === 'undefined' || typeof scene === 'undefined') return false; inited = true;
    const gs = quad(); SP = pool(SP_CAP, 256, {aP:4, aV:4, aC:4, aX:4}, gs); for (let i = 0; i < SP_CAP; i++) SP.A.aP.array[i*4 + 3] = -1e9;
    mSp = new THREE.Mesh(gs, new THREE.ShaderMaterial({uniforms:U, vertexShader:SPV, fragmentShader:SPF, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide}));
    const gm = quad(); SM = pool(SM_CAP, 128, {aP:4, aV:4, aS:4, aC:4}, gm); for (let i = 0; i < SM_CAP; i++) SM.A.aP.array[i*4 + 3] = -1e9;
    SU.uTex.value = cloudTex();
    mSm = new THREE.Mesh(gm, new THREE.ShaderMaterial({uniforms:SU, vertexShader:SMV, fragmentShader:SMF, transparent:true, depthWrite:false, side:THREE.DoubleSide}));
    [[mSp, 'army_glow', 9], [mSm, 'army_smoke', 8]].forEach(([m, n, o]) => { m.name = n; m.frustumCulled = false; m.renderOrder = o; m.visible = false; m.castShadow = m.receiveShadow = false; scene.add(m); });
    return true;
  }
  // world (x east, y north, z up) -> three (x, z, -y)
  function glow(x, y, z, t0, vx, vy, vz, life, r, g, b, s0, s1, drag, mode, ext){
    if (!inited) return; const i = SP.take(t0 + life + 0.1), j = i*4, A = SP.A;
    A.aP.array[j] = x; A.aP.array[j + 1] = z; A.aP.array[j + 2] = -y; A.aP.array[j + 3] = t0;
    A.aV.array[j] = vx; A.aV.array[j + 1] = vz; A.aV.array[j + 2] = -vy; A.aV.array[j + 3] = life;
    A.aC.array[j] = r; A.aC.array[j + 1] = g; A.aC.array[j + 2] = b; A.aC.array[j + 3] = s0;
    A.aX.array[j] = s1; A.aX.array[j + 1] = drag; A.aX.array[j + 2] = mode; A.aX.array[j + 3] = ext; T.sp++;
  }
  function puff(x, y, z, t0, vx, vy, vz, life, s0, s1, alpha, rise, r, g, b, lit){
    if (!inited) return; const i = SM.take(t0 + life + 0.1), j = i*4, A = SM.A;
    A.aP.array[j] = x; A.aP.array[j + 1] = z; A.aP.array[j + 2] = -y; A.aP.array[j + 3] = t0;
    A.aV.array[j] = vx; A.aV.array[j + 1] = vz; A.aV.array[j + 2] = -vy; A.aV.array[j + 3] = life;
    A.aS.array[j] = s0; A.aS.array[j + 1] = s1; A.aS.array[j + 2] = alpha; A.aS.array[j + 3] = rise;
    A.aC.array[j] = r; A.aC.array[j + 1] = g; A.aC.array[j + 2] = b; A.aC.array[j + 3] = (lit || 0)*0.999 + Math.random()*0.0009; T.sm++;
  }
  const rnd = (a, b) => a + Math.random()*(b - a);
  // a unit vector perpendicular to d (and its partner)
  const E1 = [0, 0, 0], E2 = [0, 0, 0];
  function basis(dx, dy, dz){ let ax = Math.abs(dz) < 0.9 ? 0 : 1, ay = 0, az = Math.abs(dz) < 0.9 ? 1 : 0;
    let x = dy*az - dz*ay, y = dz*ax - dx*az, z = dx*ay - dy*ax; let l = ARH3(x, y, z) || 1; E1[0] = x/l; E1[1] = y/l; E1[2] = z/l;
    E2[0] = dy*E1[2] - dz*E1[1]; E2[1] = dz*E1[0] - dx*E1[2]; E2[2] = dx*E1[1] - dy*E1[0]; }
  // ---------------------------------------------------------------- effects
  // the main gun: a long flash cone forward, a fireball at the muzzle, the smoke ring, dust kicked up around the vehicle by the blast
  function muzzle(x, y, z, dx, dy, dz, k, gx, gy, gz){
    const t = T.now; k = k || 1;
    glow(x, y, z, t, dx*6, dy*6, dz*6, 0.12, 1, 0.85, 0.55, 2.2*k, 5.5*k, 0, 2, 0);
    glow(x + dx*2*k, y + dy*2*k, z + dz*2*k, t, dx*30, dy*30, dz*30, 0.09, 1, 0.7, 0.35, 1.6*k, 4.2*k, 0, 2, 0);
    for (let i = 0; i < 8*k; i++){ const v = rnd(30, 90); glow(x, y, z, t, dx*v + rnd(-6, 6), dy*v + rnd(-6, 6), dz*v + rnd(-6, 6), rnd(0.08, 0.2), 1, 0.65, 0.3, 0.5*k, 1.8*k, 6, 3, 0); }
    ring(x, y, z, dx, dy, dz, k);
    if (gz !== undefined) dust(gx, gy, gz, 7*k, 10, 0.5);
  }
  function ring(x, y, z, dx, dy, dz, k){
    const t = T.now; basis(dx, dy, dz); const n = Math.round(12*k);
    for (let i = 0; i < n; i++){ const a = i/n*Math.PI*2, ca = Math.cos(a), sa = Math.sin(a), rx = E1[0]*ca + E2[0]*sa, ry = E1[1]*ca + E2[1]*sa, rz = E1[2]*ca + E2[2]*sa, f = rnd(6, 14)*k;
      puff(x + rx*0.6, y + ry*0.6, z + rz*0.6, t + rnd(0, 0.04), rx*rnd(5, 8)*k + dx*f, ry*rnd(5, 8)*k + dy*f, rz*rnd(5, 8)*k + dz*f, rnd(2.5, 4.5), 0.8*k, rnd(2.6, 4)*k, 0.5, 0.4, 0.82, 0.8, 0.76, 0); }
    for (let i = 0; i < 4*k; i++){ const f = rnd(4, 20); puff(x + dx*f*0.3, y + dy*f*0.3, z + dz*f*0.3, t + rnd(0, 0.1), dx*f, dy*f, dz*f, rnd(3, 6), 1.5*k, rnd(4, 6)*k, 0.42, 0.5, 0.78, 0.76, 0.72, 0); }
  }
  function dust(x, y, z, r, n, a){
    const t = T.now;
    for (let i = 0; i < n; i++){ const an = Math.random()*Math.PI*2, d = rnd(0.3, 1)*r, v = rnd(2, 6);
      puff(x + Math.cos(an)*d, y + Math.sin(an)*d, z + 0.4, t + rnd(0, 0.15), Math.cos(an)*v, Math.sin(an)*v, rnd(0.2, 1.2), rnd(2.5, 5), 1.2, rnd(3.5, 6), a || 0.45, 0.25, 0.62, 0.56, 0.46, 0); }
  }
  // a tracer: a bright streak flying at speed (m/s) for dist metres; colour by kind
  const TC = {shell:[1, 0.8, 0.5], mg:[1, 0.45, 0.18], ac:[1, 0.65, 0.3], rifle:[1, 0.55, 0.25]};
  function tracer(x, y, z, dx, dy, dz, dist, speed, kind, len, w){
    const c = TC[kind] || TC.mg, life = Math.max(0.03, dist/speed);
    glow(x, y, z, T.now, dx*speed, dy*speed, dz*speed, life, c[0], c[1], c[2], w || 0.18, w || 0.18, 0, 1, len || 18);
  }
  function sparks(x, y, z, nx, ny, nz, n, sp, t0){
    const t = t0 === undefined ? T.now : t0;
    for (let i = 0; i < n; i++){ let vx = nx + rnd(-0.8, 0.8), vy = ny + rnd(-0.8, 0.8), vz = nz + rnd(-0.4, 1.0); const l = ARH3(vx, vy, vz) || 1, v = rnd(0.3, 1)*sp;
      glow(x, y, z, t, vx/l*v, vy/l*v, vz/l*v, rnd(0.4, 1.1), 1, 0.75, 0.35, 0.22, 0.12, 0.6, 0, 0); }
  }
  // a shell bursting on the creature's hide: flash, fireball, sparks, dark smoke
  function shellHit(x, y, z, nx, ny, nz, k){
    const t = T.now; k = k || 1;
    glow(x, y, z, t, 0, 0, 0, 0.22, 1, 0.78, 0.45, 5*k, 12*k, 0, 2, 0);
    for (let i = 0; i < 8*k; i++){ const vx = nx*rnd(4, 14) + rnd(-7, 7), vy = ny*rnd(4, 14) + rnd(-7, 7), vz = nz*rnd(4, 14) + rnd(-5, 9);
      glow(x, y, z, t + rnd(0, 0.05), vx, vy, vz, rnd(0.5, 1.1), 1, 0.8, 0.4, rnd(2, 3.5)*k, rnd(5, 8)*k, 2.4, 3, 1.5); }
    sparks(x, y, z, nx, ny, nz, Math.round(22*k), 32*k);
    for (let i = 0; i < 7*k; i++){ const v = rnd(2, 7); puff(x + nx*2, y + ny*2, z + nz*2, t + rnd(0.05, 0.25), nx*v + rnd(-2, 2), ny*v + rnd(-2, 2), nz*v + rnd(0, 3), rnd(4, 8), 3*k, rnd(9, 15)*k, 0.65, 1.2, 0.16, 0.15, 0.14, 0.6); }
  }
  function acHit(x, y, z, nx, ny, nz){
    const t = T.now;
    glow(x, y, z, t, 0, 0, 0, 0.12, 1, 0.85, 0.6, 1.8, 4.5, 0, 2, 0);
    for (let i = 0; i < 3; i++) glow(x, y, z, t, nx*rnd(3, 8) + rnd(-3, 3), ny*rnd(3, 8) + rnd(-3, 3), nz*rnd(3, 8) + rnd(-2, 4), rnd(0.3, 0.6), 1, 0.7, 0.35, 1, 2.5, 2, 3, 1);
    sparks(x, y, z, nx, ny, nz, 6, 20);
    puff(x + nx, y + ny, z + nz, t + 0.05, nx*3, ny*3, nz*3 + 1, rnd(2.5, 4), 1.5, 5, 0.45, 0.8, 0.22, 0.21, 0.2, 0.3);
  }
  function smallHit(x, y, z, nx, ny, nz){ glow(x, y, z, T.now, 0, 0, 0, 0.07, 1, 0.8, 0.5, 0.7, 1.4, 0, 2, 0); sparks(x, y, z, nx, ny, nz, 2, 12); }
  // an anti-tank rocket: back-blast, a flare that flies at speed, its smoke trail laid along the path (future start times)
  function rocket(x, y, z, dx, dy, dz, dist, t){
    const t0 = T.now, v = dist/Math.max(0.05, t - 0.15);
    glow(x, y, z, t0, 0, 0, 0, 0.1, 1, 0.85, 0.6, 1.2, 2.5, 0, 2, 0);
    for (let i = 0; i < 6; i++){ const f = rnd(4, 14); puff(x - dx*1.2, y - dy*1.2, z - dz*1.2, t0 + rnd(0, 0.05), -dx*f + rnd(-2, 2), -dy*f + rnd(-2, 2), -dz*f + rnd(-1, 2), rnd(2, 3.5), 0.8, rnd(2.5, 4), 0.5, 0.4, 0.8, 0.78, 0.74, 0); }
    glow(x + dx*0.5, y + dy*0.5, z + dz*0.5, t0 + 0.15, dx*v, dy*v, dz*v, Math.max(0.05, t - 0.15), 1, 0.75, 0.4, 0.45, 0.45, 0, 4, 2.5);
    const n = Math.min(120, Math.round(dist/2.6));
    for (let i = 0; i < n; i++){ const f = (i + 0.5)/n, d = f*dist; puff(x + dx*d, y + dy*d, z + dz*d, t0 + 0.15 + f*(t - 0.15), rnd(-0.4, 0.4), rnd(-0.4, 0.4), rnd(-0.2, 0.4), rnd(3, 5.5), 0.9, rnd(2.0, 3.2), 0.36, 0.3, 0.86, 0.85, 0.82, 0); }
  }
  // a vehicle brewing up (or a big hit): a rolling fireball, sparks, dark smoke billowing
  function fireball(x, y, z, k){
    const t = T.now;
    glow(x, y, z + 1, t, 0, 0, 0, 0.3, 1, 0.72, 0.38, 4*k, 11*k, 0, 2, 0);
    for (let i = 0; i < 18*k; i++){ const a = Math.random()*Math.PI*2, e = rnd(-0.1, 1.2), v = rnd(3, 11)*k;
      glow(x, y, z + 1, t + rnd(0, 0.15), Math.cos(a)*Math.cos(e)*v, Math.sin(a)*Math.cos(e)*v, Math.sin(e)*v + 4, rnd(0.8, 1.8), 1, 0.8, 0.4, rnd(2, 3.5)*k, rnd(5, 9)*k, 1.8, 3, 3); }
    sparks(x, y, z + 1.5, 0, 0, 1, Math.round(40*k), 26*k);
    for (let i = 0; i < 14*k; i++){ const a = Math.random()*Math.PI*2, v = rnd(1, 6);
      puff(x + Math.cos(a)*2, y + Math.sin(a)*2, z + rnd(1, 4), t + rnd(0.1, 0.6), Math.cos(a)*v, Math.sin(a)*v, rnd(3, 9), rnd(7, 14), 3*k, rnd(10, 18)*k, 0.7, 1.5, 0.1, 0.095, 0.09, 0.8); }
  }
  // a burning wreck, per call (the runtime calls it a few times a second): flames and a dark column; intensity 0-1
  function burn(x, y, z, k, night){
    const t = T.now;
    for (let i = 0; i < Math.round(3*k + Math.random()); i++) glow(x + rnd(-1.2, 1.2), y + rnd(-1.2, 1.2), z + rnd(0, 0.6), t + rnd(0, 0.1), rnd(-0.6, 0.6), rnd(-0.6, 0.6), rnd(1, 3), rnd(0.5, 1.0), 1, 0.8, 0.4, rnd(0.6, 1.1)*(0.6 + 0.6*k), rnd(1.6, 2.6)*(0.6 + 0.6*k), 1.2, 3, 2.5);
    if (Math.random() < 0.55) puff(x + rnd(-1, 1), y + rnd(-1, 1), z + 1.5, t, rnd(-0.5, 0.5), rnd(-0.5, 0.5), rnd(2, 4), rnd(9, 16), 1.6, rnd(7, 13)*(0.5 + 0.6*k), 0.62, 2.2, 0.1, 0.095, 0.09, 0.7*k);
    if (night > 0.3 && Math.random() < 0.3) glow(x + rnd(-1, 1), y + rnd(-1, 1), z + 1, t, rnd(-1, 1), rnd(-1, 1), rnd(2, 5), rnd(1.5, 3), 1, 0.6, 0.2, 0.08, 0.05, 0.4, 5, 1.2);
  }
  function exhaust(x, y, z, vx, vy, k){ puff(x, y, z, T.now, vx + rnd(-0.5, 0.5), vy + rnd(-0.5, 0.5), rnd(0.5, 1.5), rnd(1.5, 3), 0.5, rnd(1.6, 2.6), 0.28*k, 0.4, 0.16, 0.155, 0.15, 0); }
  // once per frame: clock, light, uploads, visibility
  function frame(now, night, wind){
    if (!inited) return 0;
    T.now = now; U.uT.value = now; U.uDay.value = 1 - night; SU.uNight.value = night;
    const a = 0.22 + 0.78*(1 - night); SU.uAmb.value.setRGB(a, a, a*1.02);
    U.uH.value = typeof renderer !== 'undefined' ? renderer.domElement.height || 800 : 800;
    const f = typeof scene !== 'undefined' && scene.fog; if (f && f.isFog){ U.uFogN.value = f.near; U.uFogF.value = f.far; } else { U.uFogN.value = 1e6; U.uFogF.value = 2e6; }
    if (wind) SU.uWind.value.set(wind[0], 0, -wind[1]);
    SP.idle(now); SM.idle(now); commit(SP); commit(SM);
    SP.g.instanceCount = SP.used; SM.g.instanceCount = SM.used;
    mSp.visible = SP.used > 0; mSm.visible = SM.used > 0;
    return (mSp.visible ? 1 : 0) + (mSm.visible ? 1 : 0);
  }
  function clear(){ if (!inited) return; for (const S of [SP, SM]){ S.until = -1e9; S.idle(0); S.lo = 1e9; S.hi = -1; S.g.instanceCount = 0; for (const a of S.AL) a.updateRange.count = -1; } mSp.visible = mSm.visible = false; }
  function stats(){ return inited ? {glowUsed:SP.used, smokeUsed:SM.used, glowSpawned:T.sp, smokeSpawned:T.sm} : null; }
  return {init, frame, clear, stats, muzzle, ring, dust, tracer, sparks, shellHit, acHit, smallHit, rocket, fireball, burn, exhaust, glow, puff, T, get inited(){ return inited; }, mkRing};
})();

// ---- 32_audio.js: the battle's sounds, synthesised on window.SGAudio's AudioContext (no files): weapons and explosions into its 'fx' bus
// (碰撞与爆炸 Crashes & effects), engines and tracks into 'trf' (交通 Traffic); both follow the master volume, mute and the group volumes
// (and their reverb sends); nothing while the sound is off. Sound travels at 343 m/s: a distant cannon is seen before it is heard.
//   cannon (crack, boom, sub thump, echoes off the towers), shell / rocket bursts, the cannon of the APCs, machine-gun bursts, the rifle
//   firefight (a crackle bed that follows how many troops are firing near the listener), the rocket's whoosh, a vehicle brewing up (and
//   ammunition cooking off), tank engines and track clatter (one continuous voice for the nearest moving vehicles), radio chatter (noise
//   only: band-limited bursts with syllable gating and squelch clicks, never words).
const ARA = (() => {
  const C = {ctx:null, wn:null, bn:null, ck:null, rd:null, last:{}, n:{}, dropped:0, eng:null, bed:null, radioT:6};
  const _v = new THREE.Vector3(), _r = new THREE.Vector3();
  let EX = null;      // tests: {ctx, bus:{fx, trf}, wbus:{fx, trf}}
  function eng(){
    if (EX){ if (C.ctx !== EX.ctx){ C.ctx = EX.ctx; bufs(EX.ctx); } return EX; }
    try { const A = window.SGAudio, E = A && A._test && A._test.LIVE; if (!A || !A.on || !E || !E.ctx || E.ctx.state !== 'running' || !E.bus || !E.bus.fx || E.err) return null;
      if (C.ctx !== E.ctx){ voicesDrop(); C.ctx = E.ctx; bufs(E.ctx); } return E; } catch (e){ return null; }
  }
  function bufs(c){
    const sr = c.sampleRate, mk = sec => c.createBuffer(1, Math.floor(sr*sec), sr);
    C.wn = mk(2); { const d = C.wn.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1; }
    C.bn = mk(3); { const d = C.bn.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++){ l = (l + 0.05*(Math.random()*2 - 1))/1.05; d[i] = l*3.4; } }
    // the firefight: sparse rifle cracks at random, some doubled / tripled (2 s loop)
    C.ck = mk(2); { const d = C.ck.getChannelData(0), N = d.length; for (let p = 0; p < 60; p++){ let at = Math.floor(Math.random()*N*0.97); const reps = Math.random() < 0.4 ? 2 + Math.floor(Math.random()*3) : 1;
      for (let r = 0; r < reps; r++, at += Math.floor(sr*0.085)){ const len = Math.floor(sr*(0.004 + Math.random()*0.01)), a = 0.35 + 0.65*Math.random(); for (let i = 0; i < len && at + i < N; i++) d[at + i] += (Math.random()*2 - 1)*a*Math.exp(-i/(len*0.22)); } } }
    // radio: noise gated by syllables (1.6 s)
    C.rd = mk(1.6); { const d = C.rd.getChannelData(0), N = d.length; let g = 0, tgt = 0, next = 0; for (let i = 0; i < N; i++){ if (i >= next){ tgt = Math.random() < 0.72 ? 0.4 + Math.random()*0.6 : 0; next = i + Math.floor(sr*(0.06 + Math.random()*0.16)); } g += (tgt - g)*0.004; d[i] = (Math.random()*2 - 1)*g*(0.7 + 0.3*Math.sin(i/sr*2*Math.PI*(140 + 40*Math.sin(i/sr*3)))); } }
  }
  function geo(x, y, z){ const c = camera.position, dx = x - c.x, dy = z - c.y, dz = -y - c.z, d = ARH3(dx, dy, dz);
    _v.set(dx, 0, dz); if (_v.lengthSq() < 1e-6) return {d, pan:0}; _v.normalize(); _r.set(1, 0, 0).applyQuaternion(camera.quaternion); _r.y = 0; if (_r.lengthSq() < 1e-6) return {d, pan:0}; _r.normalize();
    return {d, pan:Math.max(-0.85, Math.min(0.85, _v.dot(_r)))}; }
  function out(E, pan, send, bus){ const c = E.ctx, g = c.createGain(); let n = g; bus = bus || 'fx';
    if (c.createStereoPanner){ const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); n = p; } n.connect(E.bus[bus] || E.bus.fx);
    const w = E.wbus && E.wbus[bus]; if (w && send > 0){ const s = c.createGain(); s.gain.value = send; g.connect(s); s.connect(w); } return g; }
  function src(c, buf, t, off, dur, rate){ const s = c.createBufferSource(); s.buffer = buf; if (rate) s.playbackRate.value = rate; s.start(t, Math.min(off || 0, buf.duration - 0.01), Math.max(0.01, dur)); return s; }
  function env(c, t, peak, att, dec){ const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + att + dec); return g; }
  const gate = (k, min) => { const c = C.ctx, now = c.currentTime; if (now - (C.last[k] || -9) < min){ C.dropped++; return false; } C.last[k] = now; C.n[k] = (C.n[k] || 0) + 1; return true; };
  const lpf = d => 240 + 6000/(1 + d/300);
  const delay = d => Math.min(12, d/343) + 0.01;
  // the tank gun: a supersonic crack, the boom and a sub thump, echoes
  function cannon(x, y, z, k){
    const E = eng(); if (!E) return false; const c = E.ctx, q = geo(x, y, z), d = q.d, att = Math.min(1.5, 1.6*(k || 1)/(1 + d/420));
    if (att < 0.01 || !gate('cannon', 0.06)) return false;
    const t0 = c.currentTime + delay(d), fc = lpf(d), o = out(E, q.pan, Math.min(0.9, 0.25 + d/2000));
    const nr = 1/(1 + d/200);
    if (nr > 0.1){ const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400; const cg = env(c, t0, 0.9*att*nr, 0.001, 0.06); src(c, C.wn, t0, Math.random(), 0.1).connect(hp); hp.connect(cg); cg.connect(o); }
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = fc; lp.Q.value = 0.7;
    const eg = env(c, t0, 0.95*att, 0.003, 1.4 + Math.min(1.5, d/1200)); src(c, C.bn, t0, Math.random()*1.2, 2.6).connect(lp); lp.connect(eg); eg.connect(o);
    const os = c.createOscillator(), og = env(c, t0, 1.0*att, 0.006, 0.55); os.type = 'sine'; os.frequency.setValueAtTime(78, t0); os.frequency.exponentialRampToValueAtTime(28, t0 + 0.5); os.connect(og); og.connect(o); os.start(t0); os.stop(t0 + 0.7);
    for (const [dl, kk] of [[0.3 + Math.random()*0.4, 0.32], [0.9 + Math.random()*0.7, 0.18]]){ const dn = c.createDelay(2), dg = c.createGain(), l2 = c.createBiquadFilter(); dn.delayTime.value = dl; dg.gain.value = kk; l2.type = 'lowpass'; l2.frequency.value = fc*0.5; eg.connect(dn); dn.connect(l2); l2.connect(dg); dg.connect(o); }
    return true;
  }
  // a burst (shell, rocket, vehicle): rumble + crack + crunch, size 0.3-2
  function boom(x, y, z, size, key){
    const E = eng(); if (!E) return false; const c = E.ctx, q = geo(x, y, z), d = q.d, att = Math.min(1.3, 1.2*(0.5 + 0.5*size)/(1 + d/380));
    if (att < 0.01 || !gate(key || 'boom', 0.05)) return false;
    const t0 = c.currentTime + delay(d), fc = lpf(d), dec = 0.7 + 0.8*size + Math.min(1.4, d/1500), o = out(E, q.pan, Math.min(0.9, 0.25 + d/2400));
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = fc*(0.8 + 0.2*size); lp.Q.value = 0.6;
    const eg = env(c, t0, 0.85*att, 0.004, dec); src(c, C.bn, t0, Math.random()*1.5, dec + 0.1).connect(lp); lp.connect(eg); eg.connect(o);
    const nr = 1/(1 + d/260); if (nr > 0.12){ const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.8; const cg = env(c, t0, 0.5*att*nr, 0.002, 0.18); src(c, C.wn, t0, Math.random(), 0.25).connect(bp); bp.connect(cg); cg.connect(o); }
    const os = c.createOscillator(), og = env(c, t0, 0.8*att*size, 0.01, 0.6); os.type = 'sine'; os.frequency.setValueAtTime(60, t0); os.frequency.exponentialRampToValueAtTime(24, t0 + 0.55); os.connect(og); og.connect(o); os.start(t0); os.stop(t0 + 0.75);
    return true;
  }
  // a repeating gun: n rounds at the given interval (machine gun ~13/s, the APC cannon ~5/s)
  function burst(x, y, z, n, iv, heavy){
    const E = eng(); if (!E) return false; const c = E.ctx, q = geo(x, y, z), d = q.d, att = Math.min(1, (heavy ? 0.9 : 0.6)/(1 + d/(heavy ? 300 : 220)));
    if (att < 0.008 || !gate(heavy ? 'ac' : 'mg', 0.12)) return false;
    const t0 = c.currentTime + delay(d), o = out(E, q.pan, Math.min(0.8, 0.2 + d/2000)), bp = c.createBiquadFilter(); bp.type = heavy ? 'lowpass' : 'bandpass'; bp.frequency.value = heavy ? Math.min(2600, lpf(d)) : Math.min(1800, 500 + lpf(d)*0.4); bp.Q.value = 0.9; bp.connect(o);
    for (let i = 0; i < n; i++){ const t = t0 + i*iv*(0.92 + Math.random()*0.16), g = env(c, t, att*(0.8 + 0.2*Math.random()), 0.001, heavy ? 0.16 : 0.05); src(c, C.wn, t, Math.random()*1.8, heavy ? 0.2 : 0.07).connect(g); g.connect(bp);
      if (heavy){ const os = c.createOscillator(), og = env(c, t, att*0.6, 0.002, 0.12); os.frequency.setValueAtTime(110, t); os.frequency.exponentialRampToValueAtTime(45, t + 0.1); os.connect(og); og.connect(o); os.start(t); os.stop(t + 0.15); } }
    return true;
  }
  // the rocket leaving the tube: a thump, then a rising hiss
  function whoosh(x, y, z, dur){
    const E = eng(); if (!E) return false; const c = E.ctx, q = geo(x, y, z), d = q.d, att = Math.min(1, 0.8/(1 + d/200)); if (att < 0.01 || !gate('whoosh', 0.2)) return false;
    const t0 = c.currentTime + delay(d), o = out(E, q.pan, 0.3), T = Math.min(3, Math.max(0.6, dur));
    const os = c.createOscillator(), og = env(c, t0, 0.7*att, 0.003, 0.25); os.frequency.setValueAtTime(130, t0); os.frequency.exponentialRampToValueAtTime(40, t0 + 0.2); os.connect(og); og.connect(o); os.start(t0); os.stop(t0 + 0.3);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2; bp.frequency.setValueAtTime(500, t0); bp.frequency.exponentialRampToValueAtTime(2400, t0 + 0.35); bp.frequency.exponentialRampToValueAtTime(900, t0 + T);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.6*att, t0 + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t0 + T);
    src(c, C.wn, t0, Math.random(), T + 0.05).connect(bp); bp.connect(g); g.connect(o);
    return true;
  }
  // ammunition cooking off in a burning wreck: pops over a few seconds
  function cookoff(x, y, z){
    const E = eng(); if (!E) return false; const c = E.ctx, q = geo(x, y, z), d = q.d, att = Math.min(1, 0.7/(1 + d/260)); if (att < 0.01 || !gate('cook', 0.5)) return false;
    const t0 = c.currentTime + delay(d) + 0.6, o = out(E, q.pan, 0.4), hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 400; hp.connect(o);
    for (let i = 0; i < 9; i++){ const t = t0 + Math.random()*3.5, g = env(c, t, att*(0.3 + 0.7*Math.random()), 0.001, 0.08); src(c, C.wn, t, Math.random()*1.8, 0.12).connect(g); g.connect(hp); }
    return true;
  }
  // radio chatter at a vehicle near the listener (noise only)
  function radio(x, y, z){
    const E = eng(); if (!E) return false; const c = E.ctx, q = geo(x, y, z), d = q.d, att = Math.min(0.5, 0.35/(1 + d/40)); if (att < 0.02 || !gate('radio', 3)) return false;
    const t0 = c.currentTime + 0.02, o = out(E, q.pan, 0.1), T = 0.8 + Math.random()*0.8;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700 + Math.random()*600; bp.Q.value = 1.6; const ws = c.createWaveShaper(); { const n = 256, cv = new Float32Array(n); for (let i = 0; i < n; i++){ const xx = i/(n - 1)*2 - 1; cv[i] = Math.tanh(xx*3); } ws.curve = cv; }
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(att, t0 + 0.02); g.gain.setValueAtTime(att, t0 + T); g.gain.exponentialRampToValueAtTime(0.0001, t0 + T + 0.04);
    src(c, C.rd, t0, Math.random()*(1.6 - T), T + 0.05, 0.95 + Math.random()*0.1).connect(ws); ws.connect(bp); bp.connect(g); g.connect(o);
    for (const tt of [t0, t0 + T]){ const cg = env(c, tt, att*0.8, 0.001, 0.03), h = c.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = 2500; src(c, C.wn, tt, Math.random(), 0.05).connect(h); h.connect(cg); cg.connect(o); }
    return true;
  }
  // ---------------------------------------------------------------- continuous voices: engines + tracks ('trf'), the firefight bed ('fx')
  function voices(E){
    if (C.eng && C.eng.ctx === E.ctx) return true;
    const c = E.ctx, t = c.currentTime;
    // engine: two detuned saws through a low-pass, track clatter: noise through a band-pass, gated by a square LFO (link rate ~ speed)
    const vg = c.createGain(); vg.gain.value = 0; const pan = c.createStereoPanner ? c.createStereoPanner() : null; if (pan){ vg.connect(pan); pan.connect(E.bus.trf || E.bus.fx); } else vg.connect(E.bus.trf || E.bus.fx);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; lp.Q.value = 1.2; lp.connect(vg);
    const o1 = c.createOscillator(), o2 = c.createOscillator(); o1.type = 'sawtooth'; o2.type = 'sawtooth'; o1.frequency.value = 34; o2.frequency.value = 34*1.51; const og2 = c.createGain(); og2.gain.value = 0.45; o1.connect(lp); o2.connect(og2); og2.connect(lp); o1.start(t); o2.start(t);
    const nb = c.createBufferSource(); nb.buffer = C.wn; nb.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 0.8; const tg = c.createGain(); tg.gain.value = 0;
    const lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 8; const lg = c.createGain(); lg.gain.value = 0; lfo.connect(lg); lg.connect(tg.gain);
    nb.connect(bp); bp.connect(tg); tg.connect(vg); nb.start(t); lfo.start(t);
    C.eng = {ctx:c, vg, pan, lp, o1, o2, tg, lg, lfo, nb};
    // the firefight bed (fx)
    const fg = c.createGain(); fg.gain.value = 0; const fp = c.createStereoPanner ? c.createStereoPanner() : null; if (fp){ fg.connect(fp); fp.connect(E.bus.fx); } else fg.connect(E.bus.fx);
    const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 3000; fl.connect(fg);
    const fs = c.createBufferSource(); fs.buffer = C.ck; fs.loop = true; fs.connect(fl); fs.start(t);
    if (E.wbus && E.wbus.fx){ const s = c.createGain(); s.gain.value = 0.5; fg.connect(s); s.connect(E.wbus.fx); }
    C.bed = {fg, fp, fl, fs};
    return true;
  }
  function voicesDrop(){
    try { if (C.eng){ const V = C.eng; for (const n of [V.o1, V.o2, V.nb, V.lfo]) try { n.stop(); } catch (e){ /* */ } V.vg.disconnect(); } } catch (e){ /* */ }
    try { if (C.bed){ try { C.bed.fs.stop(); } catch (e){ /* */ } C.bed.fg.disconnect(); } } catch (e){ /* */ }
    C.eng = C.bed = null;
  }
  // per ~0.1 s: eng = {lv 0-1, sp m/s, pan}, fight = {lv, pan, d}
  function update(engP, fight){
    const E = eng(); if (!E){ return; }
    if (!engP && !fight){ if (C.eng){ const t = C.ctx.currentTime; C.eng.vg.gain.setTargetAtTime(0, t, 0.3); C.bed.fg.gain.setTargetAtTime(0, t, 0.3); } return; }
    voices(E); const c = E.ctx, t = c.currentTime, V = C.eng, B = C.bed;
    const lv = engP ? engP.lv : 0, sp = engP ? engP.sp : 0;
    V.vg.gain.setTargetAtTime(0.5*lv, t, 0.25); if (V.pan) V.pan.pan.setTargetAtTime(engP ? engP.pan : 0, t, 0.2);
    const f = 30 + sp*2.2; V.o1.frequency.setTargetAtTime(f, t, 0.4); V.o2.frequency.setTargetAtTime(f*1.51, t, 0.4); V.lp.frequency.setTargetAtTime(260 + sp*30 + 300*lv, t, 0.3);
    V.lfo.frequency.setTargetAtTime(2 + sp*1.6, t, 0.3); V.lg.gain.setTargetAtTime(Math.min(0.5, sp*0.05)*(engP && engP.tracks ? 1 : 0.2), t, 0.3);
    const fl = fight ? fight.lv : 0; B.fg.gain.setTargetAtTime(0.55*fl, t, 0.4); if (B.fp) B.fp.pan.setTargetAtTime(fight ? fight.pan : 0, t, 0.3); B.fl.frequency.setTargetAtTime(fight ? lpf(fight.d)*0.8 + 600 : 2000, t, 0.4);
  }
  function stop(){ voicesDrop(); }
  return {cannon, boom, burst, whoosh, cookoff, radio, update, stop, geo, live:() => !!eng(), get stats(){ return Object.assign({ctx:C.ctx ? C.ctx.state : 'none', dropped:C.dropped, voices:!!C.eng}, C.n); },
    // tests: render each sound offline -> {name: {played, peak, rms, onset}}
    async offline(x, y, z){ const outp = {};
      for (const [name, f] of [['cannon', () => cannon(x, y, z, 1)], ['boom', () => boom(x, y, z, 1)], ['mg', () => burst(x, y, z, 8, 0.075, false)], ['ac', () => burst(x, y, z, 4, 0.2, true)], ['whoosh', () => whoosh(x, y, z, 1.5)], ['cookoff', () => cookoff(x, y, z)], ['radio', () => radio(x, y, z)]]){
        const ctx = new OfflineAudioContext(2, 22050*5, 22050), fx = ctx.createGain(), trf = ctx.createGain(), wb = ctx.createGain(); fx.connect(ctx.destination); trf.connect(ctx.destination); wb.gain.value = 0.3; wb.connect(ctx.destination);
        EX = {ctx, bus:{fx, trf}, wbus:{fx:wb, trf:wb}}; C.last = {}; let ok = false; try { ok = f(); } finally { EX = null; }
        const buf = await ctx.startRendering(), d = buf.getChannelData(0); let pk = 0, ss = 0, nan = 0; for (let i = 0; i < d.length; i++){ const v = d[i]; if (!isFinite(v)) nan++; else { if (Math.abs(v) > pk) pk = Math.abs(v); ss += v*v; } }
        let on = -1; for (let i = 0; i < d.length; i++) if (Math.abs(d[i]) > pk*0.1){ on = i/22050; break; }
        outp[name] = {played:ok, peak:+pk.toFixed(3), rms:+Math.sqrt(ss/d.length).toFixed(4), onset:+on.toFixed(3), nan}; }
      C.ctx = null; return outp; }};
})();

// ---- 40_runtime.js: the army in the app - the creature (SGKaiju: body spheres, status, hinder), the player (SGF1 / SGFly / the view), the
// view callbacks (particles, sounds), thrown vehicles and blown-off turrets (window.SGPhys when present), burning wrecks, the instances,
// the drive module's obstacles (SGF1.obstacles when present), starting and stopping with local creature games
const ARX = (() => {
  const PI = Math.PI;
  const K = {on:false, fire:false, cease:false, x:0, y:0, vx:0, vy:0, n:0, S:new Float32Array(4*32), phase:'off', sp:'', src:'none', top:0};
  const PL = {x:0, y:0, vx:0, vy:0, kind:'cam'}, CAM = {x:0, y:0, z:0};
  const X = {A:null, enabled:true, clock:0, st:null, stT:0, lastTimer:0, kx:0, ky:0, kt:-1, night:0, fight:0, sndT:0, radioT:8, burnT:0, exT:0, turrets:[], bars:[], barN:0,
    obsReg:false, obsN:0, ms:0, msMax:0, msR:0, draws:0, lastWave:null, events:[], wavesShown:0, pp:{}, hinders:0, city:'sg', bodyErr:0};
  const now = () => performance.now();
  const city = () => { try { if (typeof SGR_NYC !== 'undefined' && SGR_NYC) return 'nyc'; } catch (e){ /* */ } try { if (typeof SGR_BAY !== 'undefined' && SGR_BAY) return 'bay'; } catch (e){ /* */ } return 'sg'; };
  const ground = (x, y) => typeof hC === 'function' ? hC(x, y) : 0;
  // ---------------------------------------------------------------- the army core with the app as its world
  const env = {K, PL, CAM, ground, side:1, lines:null, rand:Math.random, now, budget:1.5,
    hinder(x, y, z, k, src){ X.hinders++; try { const S = window.SGKaiju; if (S && S.hinder) S.hinder({x, y, z, k, src}); } catch (e){ /* optional */ } },
    fx:null};
  // ---------------------------------------------------------------- view callbacks: particles and sound
  const FXV = {
    cannon(V, x, y, z, dx, dy, dz, dist, hit){
      ARF.muzzle(x, y, z, dx, dy, dz, 1, V.x, V.y, V.z);
      ARF.tracer(x + dx*3, y + dy*3, z + dz*3, dx, dy, dz, dist, 900, 'shell', 34, 0.32);
      ARA.cannon(x, y, z, 1);
    },
    ac(V, x, y, z, dx, dy, dz, dist, hit){
      ARF.glow(x, y, z, ARF.T.now, dx*4, dy*4, dz*4, 0.07, 1, 0.8, 0.45, 0.6, 1.6, 0, 2, 0);
      ARF.tracer(x + dx*1.5, y + dy*1.5, z + dz*1.5, dx, dy, dz, dist, 1000, 'ac', 22, 0.2);
      if (Math.random() < 0.5) ARF.puff(x, y, z, ARF.T.now, dx*5, dy*5, dz*5, 1.5, 0.4, 1.6, 0.3, 0.3, 0.8, 0.78, 0.74, 0);
      ARA.burst(x, y, z, 1, 0.2, true);
    },
    mg(V, x, y, z, dx, dy, dz, dist, tr){
      if (tr) ARF.tracer(x + dx, y + dy, z + dz, dx, dy, dz, dist, 850, 'mg', 14, 0.13);
      if (Math.random() < 0.6) ARF.glow(x + dx*0.9, y + dy*0.9, z + dz*0.9, ARF.T.now, 0, 0, 0, 0.05, 1, 0.75, 0.4, 0.25, 0.5, 0, 2, 0);
      if (X.clock - V.mgS > 0.9){ V.mgS = X.clock; ARA.burst(x, y, z, (V.mgN || 0) + 1, 0.075, false); }
    },
    rifle(S, x, y, z, dx, dy, dz, dist, tr){
      ARF.glow(x + dx*0.2, y + dy*0.2, z + dz*0.2, ARF.T.now, 0, 0, 0, 0.05, 1, 0.75, 0.4, 0.12, 0.3, 0, 2, 0);
      if (tr) ARF.tracer(x + dx*0.5, y + dy*0.5, z + dz*0.5, dx, dy, dz, Math.min(dist, 900), 820, 'rifle', 9, 0.07);
      const d = ARH3(x - CAM.x, y - CAM.y, z - CAM.z); X.fight = Math.min(1.4, X.fight + 0.07/(1 + d/140)); X.fightX = x; X.fightY = y; X.fightZ = z;
      if (S.role === 'mg' && X.clock - S.Q.mgS > 1.1){ S.Q.mgS = X.clock; ARA.burst(x, y, z, (S.burst || 0) + 1, 0.09, false); }
    },
    rocket(S, x, y, z, dx, dy, dz, dist, hit, t){ ARF.rocket(x, y, z, dx, dy, dz, dist, t); ARA.whoosh(x, y, z, t); ARF.dust(x - dx*2, y - dy*2, S.z, 3, 4, 0.4); },
    impact(kind, x, y, z, nx, ny, nz, k, u){
      if (kind === 'shell'){ ARF.shellHit(x, y, z, nx, ny, nz, 1); ARA.boom(x, y, z, 1, 'hit'); }
      else if (kind === 'rocket'){ ARF.shellHit(x, y, z, nx, ny, nz, 0.75); ARA.boom(x, y, z, 0.7, 'hit'); }
      else if (kind === 'ac'){ ARF.acHit(x, y, z, nx, ny, nz); if (Math.random() < 0.4) ARA.boom(x, y, z, 0.25, 'achit'); }
      else if (kind === 'land'){ ARF.dust(x, y, z, 5, 10, 0.55); ARF.sparks(x, y, z + 0.5, 0, 0, 1, 14, 9); ARA.boom(x, y, z, 0.6, 'land'); }
      else if (kind === 'scrape'){ ARF.sparks(x, y, z, nx, ny, nz || 0.3, 16, 12); ARA.boom(x, y, z, 0.3, 'scrape'); }
      else ARF.smallHit(x, y, z, nx, ny, nz);
    },
    brew(V, how, e){
      const k = V.kind === 'tank' ? 1.25 : 0.95;
      ARF.fireball(V.x, V.y, V.z + 0.6, k);
      try { if (window.SGFX && SGFX.scorch) SGFX.scorch(V.x, V.y, 7 + 3*k); } catch (er){ /* */ }
      ARA.boom(V.x, V.y, V.z + 1, 1.6, 'brew'); if (V.kind === 'tank' && how !== 'crush') ARA.cookoff(V.x, V.y, V.z + 1);
      X.events.push([+X.clock.toFixed(1), 'brew', V.id, how]); if (X.events.length > 40) X.events.shift();
    },
    turretPop(V, vx, vy, vz){ turretPop(V, vx, vy, vz); },
    knock(S, e){ ARF.dust(S.x, S.y, S.z, 1.2, e > 0.5 ? 3 : 1, 0.35); },
    crushed(V){ ARF.sparks(V.x, V.y, V.z + 1, 0, 0, 1, 30, 14); ARA.boom(V.x, V.y, V.z, 1.2, 'crush'); },
    wave(m){ X.lastWave = Object.assign({at:X.clock}, m); X.events.push([+X.clock.toFixed(1), 'wave', m.wave, m.tanks, m.apcs, m.trucks]); if (X.events.length > 40) X.events.shift(); if (typeof ARU !== 'undefined') ARU.waveToast(m); },
    dismount(){}, retreat(D, mode){ X.events.push([+X.clock.toFixed(1), mode, D.n]); if (X.events.length > 40) X.events.shift(); }
  };
  env.fx = FXV;
  // ---------------------------------------------------------------- the creature: SGKaiju.body() spheres (kaiju3), else a stand-in from its pose
  const FB = [];
  function readKaiju(dt){
    const S = window.SGKaiju; K.on = false; K.fire = false; K.n = 0;
    if (!S || !S.on) return;
    X.stT -= dt; if (X.stT <= 0 || !X.st){ X.stT = 0.5; try { X.st = S.status(); } catch (e){ X.st = null; } }
    const st = X.st; if (!st || st.remote) return;
    K.phase = st.phase; K.cease = !!(st.result || st.caught);
    let L = null;
    if (S.body){ try { L = S.body(); K.src = 'body'; } catch (e){ L = null; X.bodyErr++; } }
    let n = 0;
    if (L && L.length){ for (const b of L){ if (n >= 32) break; if (!b || !isFinite(b.x) || !isFinite(b.r)) continue; const o = n*4; K.S[o] = b.x; K.S[o + 1] = b.y; K.S[o + 2] = b.z; K.S[o + 3] = b.r; n++; } }
    else if (!S.body) n = standIn(S);
    K.n = n;
    if (!n) return;
    // the centre on the ground (the creature's position from its state, else the big spheres' mean) and its velocity
    let cx = 0, cy = 0, w = 0; const G = S._ && S._.KG && S._.KG.G;
    if (G && G.P && isFinite(G.P.x)){ cx = G.P.x; cy = G.P.y; w = 1; }
    else { for (let i = 0; i < n; i++){ const r = K.S[i*4 + 3], ww = r*r; cx += K.S[i*4]*ww; cy += K.S[i*4 + 1]*ww; w += ww; } cx /= w; cy /= w; }
    if (X.kt >= 0 && dt > 0){ const vx = (cx - X.kx)/dt, vy = (cy - X.ky)/dt; if (ARH(vx, vy) < 80){ K.vx += (vx - K.vx)*Math.min(1, dt*2); K.vy += (vy - K.vy)*Math.min(1, dt*2); } }
    X.kx = cx; X.ky = cy; X.kt = 1; K.x = cx; K.y = cy;
    let top = 0; for (let i = 0; i < n; i++) top = Math.max(top, K.S[i*4 + 2] + K.S[i*4 + 3]); K.top = top;
    K.on = true; K.fire = !K.cease && top > ground(cx, cy) + 20;
  }
  // without SGKaiju.body(): spheres from the posed skeleton (feet / ankles, a column from the hips to the head, hands, tentacle tips)
  function standIn(S){
    K.src = 'pose';
    let G = null; try { G = S._ && S._.KG && S._.KG.G; } catch (e){ G = null; }
    const O = G && G.O; if (!O || !O.W) return 0;
    let n = 0; const put = (p, r) => { if (!p || n >= 32 || !isFinite(p[0]) || !isFinite(p[2])) return; const o = n*4; K.S[o] = p[0]; K.S[o + 1] = p[1]; K.S[o + 2] = p[2]; K.S[o + 3] = r; n++; };
    const eye = O.eye && O.eye[0], head = O.head && isFinite(O.head[2]) ? O.head : eye; if (!head) return 0;
    const gz = ground(O.W.x, O.W.y), H = Math.max(40, head[2] - gz);
    const mid = O.chest && isFinite(O.chest[2]) ? O.chest : [O.W.x, O.W.y, gz + H*0.6];
    for (let i = 0; i < 4; i++){ const f = (i + 1)/5; put([O.W.x + (mid[0] - O.W.x)*f, O.W.y + (mid[1] - O.W.y)*f, gz + H*(0.12 + 0.6*f)], H*0.1); }
    put(mid, H*0.12); put(head, H*0.08);
    if (O.feet) for (const F of O.feet){ if (F && F.ankle) put(F.ankle, Math.max(6, H*0.045)); if (n >= 26) break; }
    if (O.hands) for (const h of O.hands) put(h, Math.max(4, H*0.035));
    if (O.tip) for (const t of O.tip) put(t, Math.max(3, H*0.02));
    return n;
  }
  // ---------------------------------------------------------------- the player and the view
  function readPlayer(){
    const c = camera.position; CAM.x = c.x; CAM.y = -c.z; CAM.z = c.y;
    try { const F = window.SGF1; if (F && F.F1 && F.F1.on){ const C = F.CAR, sp = C.u || 0; PL.x = C.x; PL.y = C.y; PL.vx = Math.cos(C.psi)*sp; PL.vy = Math.sin(C.psi)*sp; PL.kind = 'car'; return; } } catch (e){ /* */ }
    try { const Y = window.SGFly; if (Y && Y.on){ const s = Y.state(); PL.x = s.x; PL.y = s.y; PL.vx = PL.vy = 0; PL.kind = 'air'; return; } } catch (e){ /* */ }
    const t = controls.target; PL.x = t.x; PL.y = -t.z; PL.vx = PL.vy = 0; PL.kind = 'cam';
  }
  // ---------------------------------------------------------------- thrown vehicles and loose turrets (SGPhys external bodies, else our own arc)
  const PO = {};
  function physOn(){ return !!(window.SGPhys && SGPhys.spawn && SGPhys.pose); }
  function thrownStep(V, dt){
    if (V.phys < 0 && physOn()){
      const sp = V.sp, id = SGPhys.spawn('prop', {x:V.x, y:V.y, z:V.z + sp.H*0.5 + 0.3, vx:V.tvx, vy:V.tvy, vz:V.tvz, w:sp.L, d:sp.W, h:sp.H, m:sp.m, hdg:V.h, tilt:0, wx:V.tw[0], wy:V.tw[1], wz:V.tw[2], life:900, draw:false, e:0.12, mu:0.7});
      if (id >= 0){ V.phys = id; V.physT = 0; }
    }
    if (V.phys >= 0){
      const P = SGPhys.pose(V.phys, PO);
      if (!P){ V.phys = -1; V.st = 'wreck'; return; }
      V.q[0] = P.qx; V.q[1] = P.qy; V.q[2] = P.qz; V.q[3] = P.qw; V.useQ = true; V.cx = P.x; V.cy = P.y; V.cz = P.z;
      V.x = P.x; V.y = P.y; V.z = P.z - V.sp.H*0.5; V.physT += dt;
      if ((P.sleep && V.physT > 0.5) || V.physT > 14 || P.wet){ V.st = 'wreck'; try { SGPhys.kill(V.phys); } catch (e){ /* */ } V.phys = -1; if (P.wet) V.st = 'gone'; }
    }
  }
  function turretPop(V, vx, vy, vz){
    if (X.turrets.length >= 10){ const old = X.turrets.shift(); if (old.phys >= 0) try { SGPhys.kill(old.phys); } catch (e){ /* */ } }
    const c = Math.cos(V.h), s = Math.sin(V.h), x = V.x + c*V.sp.tx, y = V.y + s*V.sp.tx, z = V.z + 2.0;
    const T = {x, y, z, h:V.h + V.ty, q:[0, 0, 0, 1], useQ:false, phys:-1, vx, vy, vz, w:[(Math.random() - 0.5)*4, (Math.random() - 0.5)*4, (Math.random() - 0.5)*3], pitch:0, roll:0, seed:V.seed, gp:V.gp, rest:false, t:0, burnT:25 + Math.random()*20};
    if (physOn()){ const id = SGPhys.spawn('prop', {x, y, z:z + 0.5, vx, vy, vz, w:4.6, d:3.6, h:1.0, m:15000, hdg:T.h, tilt:0, wx:T.w[0], wy:T.w[1], wz:T.w[2], life:900, draw:false, e:0.2, mu:0.6}); if (id >= 0) T.phys = id; }
    X.turrets.push(T);
    ARF.fireball(x, y, z, 0.6);
  }
  function turretStep(T, dt){
    T.t += dt;
    if (T.phys >= 0){ const P = SGPhys.pose(T.phys, PO); if (!P){ T.phys = -1; T.rest = true; return; } T.q[0] = P.qx; T.q[1] = P.qy; T.q[2] = P.qz; T.q[3] = P.qw; T.useQ = true; T.x = P.x; T.y = P.y; T.z = P.z; if (P.sleep && T.t > 1){ T.rest = true; } return; }
    if (T.rest) return;
    T.x += T.vx*dt; T.y += T.vy*dt; T.z += T.vz*dt; T.vz -= 9.81*dt; T.pitch += T.w[0]*dt; T.roll += T.w[1]*dt; T.h += T.w[2]*dt;
    const g = ground(T.x, T.y); if (T.z < g && T.vz < 0){ T.z = g; if (T.vz < -5){ T.vz *= -0.3; T.vx *= 0.5; T.vy *= 0.5; ARF.dust(T.x, T.y, g, 3, 6, 0.5); } else { T.rest = true; T.pitch = Math.round(T.pitch/PI)*PI; T.roll = Math.round(T.roll/PI)*PI; } }
  }
  // ---------------------------------------------------------------- roadblock barriers (placed when a detachment first holds)
  function barriers(D){
    if (D.bars) return; D.bars = true;
    const P = D.path; if (!P || P.n < 2) return; const L = P.L, q = ARG.at(P, L, 0, {i:0}), hx = q.hx, hy = q.hy, h = Math.atan2(hy, hx) + PI/2;
    for (const lat of [-6.2, -3.1, 3.1, 6.2]){ const x = q.x + hx*9 - hy*lat, y = q.y + hy*9 + hx*lat;
      const B = X.bars[X.barN++ % 48] || (X.bars[(X.barN - 1) % 48] = {}); B.x = x; B.y = y; B.z = ground(x, y) + q.z; B.h = h + (Math.random() - 0.5)*0.25; B.vx = B.vy = 0; B.on = true; }
  }
  // ---------------------------------------------------------------- the drive module's obstacles (agent drivecam: SGF1.obstacles(fn))
  // [{id, x, y, hx, hy, hdg, z0 (= z, the bottom), h, m, vx, vy}] near (x, y): the vehicles (heavy: the car bounces off a tank), wrecks,
  // the concrete barriers; the array and its objects are reused (filled by index: no garbage)
  const OBS = [], OBP = [], BID = [];
  function obsObj(k){ let o = OBP[k]; if (!o){ o = {id:'', x:0, y:0, hx:0, hy:0, hdg:0, z:0, z0:0, h:0, m:0, vx:0, vy:0}; OBP[k] = o; } return o; }
  function obstacles(x, y, r){
    const A = X.A; let k = 0;
    if (A && A.on){
      for (let i = 0; i < A.V.length; i++){ const V = A.V[i]; if (V.hidden || V.st === 'gone' || V.st === 'queue' || (V.st === 'thrown' && V.z > ground(V.x, V.y) + 1)) continue;
        if (Math.abs(V.x - x) > r + 6 || Math.abs(V.y - y) > r + 6) continue;
        const o = obsObj(k); o.id = V.id; o.x = V.x; o.y = V.y; o.hx = V.sp.hx; o.hy = V.sp.hy; o.hdg = V.useQ ? yawOfQ(V.q) : V.h; o.h = V.crushed ? 1.3 : V.sp.H; o.m = V.st === 'wreck' ? V.sp.m*1.3 : V.sp.m; o.z = o.z0 = V.z;
        const mv = V.st === 'drive' ? V.v : 0; o.vx = Math.cos(V.h)*mv; o.vy = Math.sin(V.h)*mv; OBS[k++] = o; }
      for (let i = 0; i < X.bars.length; i++){ const B = X.bars[i]; if (!B || !B.on || Math.abs(B.x - x) > r + 3 || Math.abs(B.y - y) > r + 3) continue;
        const o = obsObj(k); o.id = BID[i] || (BID[i] = 'b' + i); o.x = B.x; o.y = B.y; o.hx = 1.5; o.hy = 0.32; o.hdg = B.h; o.h = 0.82; o.m = 1800; o.z = o.z0 = B.z; o.vx = o.vy = 0; OBS[k++] = o; }
    }
    if (OBS.length !== k) OBS.length = k; X.obsN = k; return OBS;
  }
  obstacles.onHit = (id, o) => {
    const A = X.A; if (!A || !o) return; const jx = +o.jx || 0, jy = +o.jy || 0;
    if (id[0] === 'b'){ const B = X.bars[+id.slice(1)]; if (B){ B.vx += jx/1800; B.vy += jy/1800; B.w = (Math.random() - 0.5)*ARH(jx, jy)/1800; } return; }
    const V = A.V.find(v => v.id === id); if (!V) return;
    V.svx += jx/V.sp.m; V.svy += jy/V.sp.m;
    if ((+o.speed || 0) > 6) ARF.sparks(V.x, V.y, V.z + 1, 0, 0, 1, 10, 8);
    for (const S of A.S) if (!S.hidden && ARH(S.x - V.x, S.y - V.y) < 9 && S.st === 'hold'){ S.st = 'flee'; S.back = 1; S.tx = S.x + (S.x - V.x)*2; S.ty = S.y + (S.y - V.y)*2; }
  };
  function yawOfQ(q){ const x = q[0], y = q[1], z = q[2], w = q[3]; return Math.atan2(2*(w*z + x*y), 1 - 2*(y*y + z*z)); }
  function obsRegister(){
    if (X.obsReg) return; const F = window.SGF1; if (!F || typeof F.obstacles !== 'function') return;
    try { F.obstacles(obstacles); X.obsReg = true; } catch (e){ console.warn('[army] obstacles', e); X.obsReg = true; }
  }
  // ---------------------------------------------------------------- start / stop
  function ensure(){
    if (X.A) return X.A;
    env.lines = (typeof SGR !== 'undefined' && SGR.lines) || [];
    X.A = ARC.Army(env, {}); return X.A;
  }
  function start(o){
    if (typeof SGR === 'undefined' || !SGR.on || !SGR.lines) return false;
    const A = ensure(); env.lines = SGR.lines; X.city = city(); env.side = X.city === 'sg' ? 1 : -1;
    ARR.build(); ARR.palette(X.city); ARF.init();
    A.start(o || {}); X.kt = -1; K.vx = K.vy = 0; X.turrets.length = 0; X.lastWave = null; X.events.length = 0; X.hinders = 0;
    for (const B of X.bars) if (B) B.on = false;
    if (typeof ARU !== 'undefined') ARU.hud(true);
    return true;
  }
  function stop(){
    const A = X.A; if (!A || !A.on) return false;
    for (const V of A.V) if (V.phys >= 0){ try { SGPhys.kill(V.phys); } catch (e){ /* */ } }
    for (const T of X.turrets) if (T.phys >= 0){ try { SGPhys.kill(T.phys); } catch (e){ /* */ } }
    A.stop(); X.turrets.length = 0; for (const B of X.bars) if (B) B.on = false;
    ARR.hide(); ARA.stop(); if (typeof ARU !== 'undefined') ARU.hud(false);
    return true;
  }
  // a local creature game starts / restarts / ends -> the army follows (multiplayer mirrors: off)
  function watch(dt){
    const S = window.SGKaiju, A = X.A;
    let kOn = false, remote = false, timer = 0;
    try { if (S && S.on){ kOn = true; const st = X.st; if (st){ remote = !!st.remote; timer = st.timer || 0; } } } catch (e){ /* */ }
    const want = X.enabled && kOn && !remote && typeof SGR !== 'undefined' && SGR.on;
    if (want && (!A || !A.on)){ if (X.st) start(); }
    else if (!want && A && A.on) stop();
    else if (want && A && A.on && timer + 2 < X.lastTimer) start();          // the game was restarted (Retry)
    X.lastTimer = timer;
  }
  // ---------------------------------------------------------------- per frame
  const a0 = [0, 0, 0, 0], a1 = [0, 0, 0, 0], a2 = [0, 0, 0, 0];
  function frame(t, dt){
    const t0 = now();
    X.clock += dt;
    if (!(typeof SGR !== 'undefined' && SGR.on)){ if (X.A && X.A.on) stop(); return; }
    X.night = typeof nightF !== 'undefined' ? nightF : 0;
    readKaiju(dt); watch(dt);
    const A = X.A;
    if (A && A.on){
      readPlayer(); obsRegister();
      A.step(dt);
      for (const V of A.V) if (V.st === 'thrown') thrownStep(V, dt);
      for (const T of X.turrets) turretStep(T, dt);
      for (const D of A.D) if (D.st === 'hold' && !D.bars) barriers(D);
      for (const B of X.bars) if (B && B.on && (B.vx || B.vy)){ B.x += B.vx*dt; B.y += B.vy*dt; B.h += (B.w || 0)*dt; const k = Math.exp(-4*dt); B.vx *= k; B.vy *= k; B.w = (B.w || 0)*k; if (Math.abs(B.vx) + Math.abs(B.vy) < 0.03) B.vx = B.vy = 0; B.z = ground(B.x, B.y); }
      effects(A, dt); sound(A, dt);
      if (typeof ARU !== 'undefined') ARU.tick(A, dt);
    }
    X.draws = ARF.frame(X.clock, X.night, [3, 1.5]);
    const ms = now() - t0; X.ms = X.ms*0.95 + ms*0.05; X.msMax = Math.max(X.msMax*0.995, ms);
  }
  // burning wrecks, exhaust, the turrets' small fires
  function effects(A, dt){
    X.burnT -= dt; X.exT -= dt; const doB = X.burnT <= 0, doE = X.exT <= 0; if (doB) X.burnT = 0.13; if (doE) X.exT = 0.3;
    if (!doB && !doE) return;
    for (const V of A.V){
      if (V.hidden || V.st === 'gone') continue;
      const d = ARH(V.x - CAM.x, V.y - CAM.y);
      if (doB && V.burnT > 0 && d < 3500){ const k = Math.min(1, V.burnT/60); const c = Math.cos(V.h), s = Math.sin(V.h), bx = V.x - c*V.sp.L*0.25, by = V.y - s*V.sp.L*0.25; ARF.burn(bx, by, V.z + (V.crushed ? 0.8 : V.sp.H*0.6), k, X.night); }
      if (doE && V.st === 'drive' && V.v > 2 && d < 600){ const c = Math.cos(V.h), s = Math.sin(V.h); ARF.exhaust(V.x - c*V.sp.L*0.48, V.y - s*V.sp.L*0.48, V.z + 1.4, -c*V.v*0.3, -s*V.v*0.3, Math.min(1, 0.4 + V.v*0.05)); }
    }
    if (doB) for (const T of X.turrets){ if (T.t < T.burnT && ARH(T.x - CAM.x, T.y - CAM.y) < 2500) ARF.burn(T.x, T.y, T.z + 0.6, 0.35*(1 - T.t/T.burnT), X.night); }
  }
  // engines, the firefight bed, radio chatter
  function sound(A, dt){
    X.fight *= Math.exp(-dt*1.2);
    X.sndT -= dt; if (X.sndT > 0) return; X.sndT = 0.12;
    if (!ARA.live()) return;
    let lv = 0, best = null, bd = 1e9;
    for (const V of A.V){ if (V.hidden || V.st === 'gone' || V.st === 'wreck' || V.st === 'thrown' || V.st === 'queue') continue;
      const d = ARH3(V.x - CAM.x, V.y - CAM.y, V.z - CAM.z); if (d > 700) continue; const mv = V.v > 0.5 ? 1 : 0.35; lv += mv/(1 + (d/70)*(d/70)); if (d < bd){ bd = d; best = V; } }
    const engP = best ? {lv:Math.min(1, lv), sp:best.v || 0, pan:ARA.geo(best.x, best.y, best.z).pan, tracks:best.kind === 'tank'} : null;
    const fight = X.fight > 0.01 ? {lv:Math.min(1, X.fight), pan:ARA.geo(X.fightX, X.fightY, X.fightZ).pan, d:ARH(X.fightX - CAM.x, X.fightY - CAM.y)} : null;
    ARA.update(engP, fight);
    X.radioT -= 0.12; if (X.radioT <= 0 && best && bd < 160){ X.radioT = 7 + Math.random()*12; ARA.radio(best.x, best.y, best.z + 2); }
  }
  // ---------------------------------------------------------------- instances (before the render)
  function draw(){
    const A = X.A; if (!A || !A.on || !ARR.R.built) return;
    const t0 = now();
    ARR.begin(); const sets = ARR.R.sets, P = ARR.PZ;
    for (let i = 0; i < A.V.length; i++){ const V = A.V[i];
      if (V.hidden || V.st === 'gone' || V.st === 'queue') continue;
      const d = ARH3(V.x - CAM.x, V.y - CAM.y, V.z - CAM.z); if (d > 7000) continue;
      const S = sets[V.kind][d < (V.kind === 'tank' ? 450 : 380) ? 0 : 1];
      const r = V.recoil, rec = r > 0.8 ? (1 - r)/0.2 : r/0.8, rock = V.rock > 0 ? -0.035*V.rock*Math.cos((1 - V.rock)*14) : 0;
      P.useQ = V.useQ; P.x = V.x; P.y = V.y; P.z = V.z; P.h = V.h; P.p = V.pitch + rock; P.r = V.roll; P.s = V.crushed ? 0.55 : 1;
      P.cz = V.cz; P.qx = V.q[0]; P.qy = V.q[1]; P.qz = V.q[2]; P.qw = V.q[3]; P.hz = V.sp.H*0.5;
      const alive = V.st !== 'wreck' && V.st !== 'thrown';
      a0[0] = V.ty; a0[1] = V.gp; a0[2] = rec; a0[3] = V.trk;
      a1[0] = V.seed; a1[1] = alive ? 0 : 1; a1[2] = V.tGone ? 1 : 0; a1[3] = alive ? 1 : 0;
      ARR.putP(S, P, a0, a1);
    }
    for (let i = 0; i < X.turrets.length; i++){ const T = X.turrets[i];
      P.useQ = T.useQ; P.x = T.x; P.y = T.y; P.z = T.z; P.h = T.h; P.p = T.pitch; P.r = T.roll; P.s = 1; P.cz = T.z; P.qx = T.q[0]; P.qy = T.q[1]; P.qz = T.q[2]; P.qw = T.q[3]; P.hz = 0.5;
      a0[0] = 0; a0[1] = T.gp; a0[2] = 0; a0[3] = 0; a1[0] = T.seed; a1[1] = 1; a1[2] = 0; a1[3] = 0; ARR.putP(sets.turret[0], P, a0, a1);
    }
    P.useQ = false; P.p = 0; P.r = 0; P.s = 1;
    for (let i = 0; i < A.S.length; i++){ const S = A.S[i];
      if (S.hidden) continue;
      const d = ARH3(S.x - CAM.x, S.y - CAM.y, S.z - CAM.z); if (d > 1100) continue;
      const set = sets.sol[d < 240 ? 0 : 1];
      P.x = S.x; P.y = S.y; P.z = S.z; P.h = S.h;
      a0[0] = S.animP; a0[1] = S.anim; a0[2] = S.bl; a0[3] = S.ph;
      a1[0] = S.fp; a1[1] = S.aim; a1[2] = S.look; a1[3] = S.role === 'at' ? 2 : S.role === 'mg' ? 1 : 0;
      a2[0] = S.seed; a2[1] = S.skin; a2[2] = S.tumble; a2[3] = 0;
      ARR.putP(set, P, a0, a1, a2);
    }
    for (let i = 0; i < X.bars.length; i++){ const B = X.bars[i]; if (!B || !B.on) continue; const d = ARH(B.x - CAM.x, B.y - CAM.y); if (d > 1500) continue; P.x = B.x; P.y = B.y; P.z = B.z; P.h = B.h; ARR.putP(sets.barrier[0], P, a0, a1); }
    ARR.end();
    ARR.U.uNightA.value = X.night; ARR.U.uTimeA.value = X.clock;
    X.msR = X.msR*0.95 + (now() - t0)*0.05;
  }
  return {X, K, PL, CAM, env, FXV, start, stop, frame, draw, readKaiju, readPlayer, obstacles, standIn, city};
})();

// ---- 50_ui.js: a row in the 克苏鲁 pane (军队 Army 开 On / 关 Off, persisted, default on), a HUD line under the creature HUD while a game
// runs (军队 12 坦克 · 6 装甲车 · 60 士兵), a toast when reinforcements arrive
const ARU = (() => {
  const KEY = 'cb_army';
  const U = {row:null, hud:null, line:null, toast:null, toastT:0, tickT:0, n:0, css:false, text:''};
  function load(){ try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s.on === 'boolean') ARX.X.enabled = s.on; } catch (e){ /* default on */ } }
  function save(){ try { localStorage.setItem(KEY, JSON.stringify({on:ARX.X.enabled})); } catch (e){ /* */ } }
  function css(){
    if (U.css || typeof document === 'undefined') return; U.css = true;
    const st = document.createElement('style'); st.id = 'armyCSS';
    st.textContent = `.armyrow{display:flex;flex-direction:column;gap:6px}
.armyrow .armynote{font:400 10px/1.45 var(--font-mono, ui-monospace, monospace);color:var(--muted)}
.armyhud{margin-top:6px;display:inline-flex;gap:10px;align-items:center;background:rgba(14,20,12,.72);border:1px solid rgba(190,200,140,.35);border-radius:9px;padding:4px 11px;font:600 12px/1.3 var(--font-sans, system-ui, sans-serif);color:#e9eed8;letter-spacing:.02em}
.armyhud b{color:#d9e59a;font-weight:700;letter-spacing:.06em}.armyhud small{font:400 10px var(--font-mono, ui-monospace, monospace);color:#b5bf9a}
.armyhud i{display:inline-grid;place-items:center;width:16px;height:16px;color:#d9e59a}.armyhud[hidden]{display:none}
.armytoast{display:block;margin:6px auto 0;max-width:92vw;font:700 13px var(--font-sans, system-ui, sans-serif);color:#f0f5d0;text-shadow:0 1px 4px #000;opacity:0;transition:opacity .35s;letter-spacing:.03em;white-space:normal}
.armyfix{position:fixed;left:50%;top:76px;transform:translateX(-50%);z-index:62;pointer-events:none;text-align:center}`;
    document.head.appendChild(st);
  }
  const ICON = '<svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><path d="M2 13h16v3H2zM4 10h9l2 3H4zM8 7h5v3H8zM13 8.2l6-1.2v1.2l-6 1.2z" fill="currentColor"/></svg>';
  // the pane row (after the creature options)
  function row(){
    const pane = document.querySelector('.tray-pane[data-cat="kj"]');
    if (!pane){ if (++U.n < 80) setTimeout(row, 500); return; }
    if (pane.querySelector('.armyrow')) return;
    css(); load();
    const box = document.createElement('div'); box.className = 'armyrow';
    box.innerHTML = `<div class="kjlab">军队 · ARMY</div><div class="seg" role="group" aria-label="军队 Army"><button type="button" data-ka="1" aria-pressed="false">开<small>On</small></button><button type="button" data-ka="0" aria-pressed="false">关<small>Off</small></button></div>
<div class="armynote">坦克和地面部队设路障、开火拖慢怪兽（只能阻碍，伤不了它），怪兽也会攻击他们 · Tanks and troops set roadblocks and fire to slow the creature (they can only hinder it); it fights back</div>`;
    box.querySelectorAll('[data-ka]').forEach(b => b.addEventListener('click', () => { set(b.dataset.ka === '1'); }));
    // after the options block of the pane (the one with the difficulty buttons), else at its end
    const picks = [...pane.querySelectorAll('.kjpick')], opt = picks.find(p => p.querySelector('[data-kd]')) || picks[0];
    if (opt) opt.appendChild(box); else pane.appendChild(box);
    U.row = box; sync();
  }
  function set(on){ ARX.X.enabled = !!on; save(); sync(); if (!on) ARX.stop(); }
  function sync(){ if (!U.row) return; U.row.querySelectorAll('[data-ka]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.ka === '1') === ARX.X.enabled))); }
  // the HUD line inside the creature HUD (or a fixed box of its own)
  function hudEl(){
    if (U.hud && U.hud.isConnected) return U.hud;
    css(); const host = document.querySelector('.kjhud');
    const wrap = document.createElement('div'); wrap.className = host ? 'armywrap' : 'armyfix';
    wrap.innerHTML = `<div class="armyhud" hidden><i>${ICON}</i><span class="armyl"></span></div><div class="armytoast"></div>`;
    (host || document.body).appendChild(wrap);
    U.hud = wrap; U.line = wrap.querySelector('.armyhud'); U.toast = wrap.querySelector('.armytoast');
    return wrap;
  }
  function hud(on){ if (typeof document === 'undefined') return; hudEl(); U.line.hidden = !on; if (!on){ U.toast.style.opacity = '0'; U.text = ''; } }
  function tick(A, dt){
    if (typeof document === 'undefined') return;
    if ((U.tickT -= dt) > 0) return; U.tickT = 0.5;
    hudEl(); if (U.line.hidden) U.line.hidden = false;
    const c = A.counts(), apcs = c.apcs + c.trucks;
    const lm = window.SGLang && SGLang.mode;   // [lm31/i18n] one language in 中 / EN mode
    const tx = lm === 'zh' ? `<b>军队</b> ${c.tanks} 坦克 · ${apcs} 装甲车 · ${c.active} 士兵${c.wrecks ? ' · ' + c.wrecks + ' 被毁' : ''}` : lm === 'en' ? `<b>Army</b> ${c.tanks} tanks · ${apcs} APCs · ${c.active} troops${c.wrecks ? ' · ' + c.wrecks + ' lost' : ''}` :
      `<b>军队</b> ${c.tanks} 坦克 · ${apcs} 装甲车 · ${c.active} 士兵 <small>ARMY ${c.tanks} tanks · ${apcs} APCs · ${c.active} troops${c.wrecks ? ' · ' + c.wrecks + ' 被毁 lost' : ''}</small>`;
    if (tx !== U.text){ U.text = tx; U.line.querySelector('.armyl').innerHTML = tx; }
  }
  function toast(s, sec){ if (typeof document === 'undefined') return; hudEl(); U.toast.textContent = s; U.toast.style.opacity = '1'; clearTimeout(U.toastT); U.toastT = setTimeout(() => { if (U.toast) U.toast.style.opacity = '0'; }, (sec || 4)*1000); }
  function waveToast(m){
    const p = [], q = [];
    if (m.tanks){ p.push(m.tanks + ' 辆坦克'); q.push(m.tanks + (m.tanks > 1 ? ' tanks' : ' tank')); }
    if (m.apcs){ p.push(m.apcs + ' 辆装甲车'); q.push(m.apcs + (m.apcs > 1 ? ' APCs' : ' APC')); }
    if (m.trucks){ p.push(m.trucks + ' 辆运兵车'); q.push(m.trucks + (m.trucks > 1 ? ' troop trucks' : ' troop truck')); }
    toast(m.wave === 1 ? `军队出动：${p.join('、')} · The army is moving in: ${q.join(', ')}` : `增援抵达：${p.join('、')} · Reinforcements: ${q.join(', ')}`, 4.5);
  }
  function init(){ if (typeof document === 'undefined') return; load(); row(); }
  return {init, row, hud, tick, toast, waveToast, set, sync, U};
})();

// ---- 99_tail.js: window.SGArmy (the contract) and the hooks ----
/* window.SGArmy
   start(opts)    put the army in the field now ({firstWave: s, scale: 0.5-2}); normally automatic: it starts with a local creature game
                  (SGKaiju.on && !SGKaiju.status().remote, the toggle on) and stops with it; a multiplayer mirror never starts it
   stop()         everything leaves the map (wrecks, turrets, barriers too)
   on             running (units in the field or on their way)
   enabled        the 军队 Army toggle (persisted in localStorage 'cb_army', default true); setting it false stops a running army
   targets()      [{id, x, y, z, r, kind:'tank'|'apc'|'squad'|'launcher', sub, st, n}] the units the creature may attack (live vehicles,
                  squads on foot); the array and its objects are reused every call
   hit(id, {x, y, z, e, fx, fy})   the creature's blow on a unit (e 0-1 energy, fx / fy the unit direction of the blow): vehicles are
                  shoved / brew up / get thrown (tanks need e >= 0.45 to brew up, >= 0.72 to be thrown), squads are knocked over around
                  (x, y) and the rest scatter; true when the unit exists
   stats()        {on, t, wave, nextWave, veh, tanks, apcs, trucks, wrecks, sol, active, shots, shells, rockets, hits, hinders, destroyed,
                  crushed, thrown, knocked, retreats, ..., ms (sim), msView (instances), draws, tris, fx, audio, kaiju:'body'|'pose'}
   sim(sec, dt)   tests: advance the creature (SGKaiju.sim) and the army together in fixed steps
   _test          {deploy() (dispatch a wave and put every detachment in position at once), graph() (finish the road graph now),
                  views() (camera suggestions near the units), audio() (offline renders of every sound), ARC, ARG, ARX, ARR, ARF, ARA, ARU, ARM} */
const SGArmy = {
  start:o => ARX.start(o), stop:() => ARX.stop(),
  get on(){ return !!(ARX.X.A && ARX.X.A.on); },
  get enabled(){ return ARX.X.enabled; }, set enabled(v){ ARU.set(!!v); },
  targets(){ const A = ARX.X.A; return A && A.on ? A.targets() : (ARX.X.none || (ARX.X.none = [])); },
  hit(id, h){ const A = ARX.X.A; if (!A || !A.on || typeof id !== 'string') return false; try { return A.hit(id, h || {}); } catch (e){ console.error('[army] hit', e); return false; } },
  stats(){ const A = ARX.X.A, X = ARX.X; const s = A ? A.stats() : {on:false};
    return Object.assign(s, {enabled:X.enabled, msFrame:+X.ms.toFixed(3), msFrameMax:+X.msMax.toFixed(3), msView:+X.msR.toFixed(3), kaiju:ARX.K.src, kn:ARX.K.n, hindersSent:X.hinders, obstacles:{registered:X.obsReg, last:X.obsN},
      render:ARR.stats(), fx:ARF.stats(), fxDraws:X.draws, audio:ARA.stats, turrets:X.turrets.length, events:X.events.slice(-12), lastWave:X.lastWave}); },
  sim(sec, dt){ dt = dt || 1/30; const n = Math.max(1, Math.round(sec/dt)), t0 = performance.now(); let km = 0;
    for (let i = 0; i < n; i++){ const S = window.SGKaiju; if (S && S.on && S.sim){ const k0 = performance.now(); S.sim(dt, dt); km += performance.now() - k0; } ARX.frame(ARX.X.clock + dt, dt); }
    return {steps:n, msPerStep:+((performance.now() - t0)/n).toFixed(3), kaijuMsPerStep:+(km/n).toFixed(3), stats:SGArmy.stats()}; },
  _test:{
    deploy(){ const A = ARX.X.A; if (!A || !A.on) return 0; SGArmy._test.graph(); return A.deployNow(); },
    graph(){ const A = ARX.X.A; if (!A || !A.on) return null; const G = A.graphNow(); return G ? {nodes:G.n, main:G.mainN, ms:+A.G.ms.toFixed(1)} : null; },
    views(){ const A = ARX.X.A; if (!A) return []; const out = [];
      for (const D of A.D){ if (D.st === 'gone') continue; const V = D.V.find(v => A.alive(v) && !v.hidden) || D.V[0]; if (!V) continue;
        out.push({det:D.n, st:D.st, x:Math.round(V.x), y:Math.round(V.y), h:+V.h.toFixed(2), fx:+D.fx.toFixed(2), fy:+D.fy.toFixed(2), units:D.V.length, squads:D.Q.length}); }
      return out; },
    audio(){ return ARA.offline(0, 0, 0); },
    ARC, ARG, ARX, ARR, ARF, ARA, ARU, ARM}
};
if (typeof window !== 'undefined') window.SGArmy = SGArmy;
if (typeof HOOKS !== 'undefined'){
  HOOKS.boot.push(() => { try { ARU.init(); } catch (e){ console.error('[army] ui', e); } });
  HOOKS.frame.push((t, dt) => ARX.frame(t, dt));
  HOOKS.prerender.push(() => ARX.draw());
}
}

