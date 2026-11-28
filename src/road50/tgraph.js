// road50/tgraph.js — the traffic system's drivable network (lm20/traffic/traffic.js), rebuilt offline for the whole map.
// Same topology rules as traffic.js: drivable = class 0-10, not foreign (flag 8); junction nodes from the roads module
// (SGRoads._dbg.prep -> C.J); a line is cut at interior junction nodes with >= 3 drivable arm ends; line ends that are not
// junction nodes become virtual nodes, shared by ends at the same vertex (0.5 m hash) and level (<= 1.5 m) or, for one-way decks
// that continue collinear, a level step <= 15 m (vSame); links: one per direction per piece (one-way: forward only);
// movements at a node: every in-arm to every out-arm except U-turns (|turn| > 2.75 rad or the same arm), which are allowed only
// where nothing else is and never at dead ends. Geometry uses the raw polylines (topology is the same as on the smoothed ones).
// opts.mode: 'app' = traffic.js exactly (default); 'fix' = with the road50 traffic.js changes (see TRAFFIC_FIX in the report).
'use strict';
const PI = Math.PI, TAU = 2*PI;
const wrapA = a => { while (a > PI) a -= TAU; while (a <= -PI) a += TAU; return a; };
function build(D, opts){
  opts = opts || {};
  const lines = D.lines, C = D.C || (D.C = D.SGRoads._dbg.prep(lines)), J = C.J, VB = J.nN, n = lines.length;
  const skip = opts.skip || null;                                   // optional Uint8Array: 1 = not drivable (e.g. hidden lines)
  const drivable = li => { const L = lines[li]; return (L.tun ? L.tc : L.c) <= 10 && !(L.flags & 8) && !(skip && skip[li]); };
  const arms = new Uint8Array(VB).fill(255);
  const nodeArms = nd => { let v = arms[nd]; if (v !== 255) return v; let a = 0;
    for (let q = J.nIO[nd]; q < J.nIO[nd+1]; q++){ const li = J.nIL[q]; if (!drivable(li)) continue; const s = J.nIS[q], Lt = J.LEN(li); a += (s < 0.3 || s > Lt - 0.3) ? 1 : 2; }
    arms[nd] = a > 254 ? 254 : a; return a; };
  const vEnd = (li, end) => { const L = lines[li], P = L.P, m = P.length >> 1, k = end ? m - 1 : 0; return {x:P[k*2], y:P[k*2+1], e:L.E ? L.E[k] : 0}; };
  const lineEndDir = (li, end) => { const P = lines[li].P, m = P.length >> 1, k = end ? m - 1 : 0, j = end ? Math.max(0, m - 3) : Math.min(m - 1, 2);
    const dx = P[j*2] - P[k*2], dy = P[j*2+1] - P[k*2+1], l = Math.hypot(dx, dy) || 1; return [dx/l, dy/l]; };
  const isJEnd = (l2, e2end) => { for (let p = J.lJO[l2]; p < J.lJO[l2+1]; p++){ const sr = J.lJS[p]; if ((e2end === 0 && sr <= 0.001) || (e2end === 1 && sr >= J.LEN(l2) - 0.001)) return true; } return false; };
  const STEP = opts.step !== undefined ? opts.step : 15;
  function vSame(li, end, cb){
    const q = vEnd(li, end), h = C.slot(Math.round(q.x*2), Math.round(q.y*2)), nd = C.HN[h];
    if (nd < 0 || nd === undefined) return;
    for (let j = C.nodeOff[nd]; j < C.nodeOff[nd+1]; j++){
      const l2 = C.incL[j], k2 = C.incV[j]; if (l2 === li || !drivable(l2)) continue;
      const L2 = lines[l2], m2 = L2.P.length >> 1; if (k2 !== 0 && k2 !== m2 - 1) continue;
      const e2 = L2.E ? L2.E[k2] : 0, e2end = k2 === 0 ? 0 : 1;
      if (Math.abs(e2 - q.e) > 1.5){
        const L = lines[li]; if (Math.abs(e2 - q.e) > STEP || !(L.flags & 1) || !(L2.flags & 1) || e2end === end) continue;
        const d1 = lineEndDir(li, end), d2 = lineEndDir(l2, e2end); if (-(d1[0]*d2[0] + d1[1]*d2[1]) < 0.9) continue;
      }
      if (!isJEnd(l2, e2end)) cb(l2, e2end);
    }
  }
  const vnode = (li, end) => { let best = VB + li*2 + end; vSame(li, end, (l2, e2) => { const id = VB + l2*2 + e2; if (id < best) best = id; }); return best; };
  // pieces and links
  const LP = new Array(n);                          // line -> [pieces]
  const PC = [];                                    // pieces: {li, a, b, na, nb, f, r}
  const DL = [];                                    // links: {id, li, dir, a, b, len, from, to, piece}
  for (let li = 0; li < n; li++){
    if (!drivable(li)){ LP[li] = null; continue; }
    const L = lines[li], ow = (L.flags & 1) !== 0, Lraw = J.LEN(li), j0 = J.lJO[li], j1 = J.lJO[li+1];
    let n0 = -1, n1 = -1; const cuts = [];
    for (let j = j0; j < j1; j++){
      const sr = J.lJS[j], nd = J.lJN[j];
      if (sr <= 0.001){ n0 = nd; continue; } if (sr >= Lraw - 0.001){ n1 = nd; continue; }
      if (nodeArms(nd) < 3) continue;
      if (cuts.length && Math.abs(cuts[cuts.length-1][0] - sr) < 0.5) continue;
      cuts.push([sr, nd]);
    }
    if (n0 < 0) n0 = vnode(li, 0); if (n1 < 0) n1 = vnode(li, 1);
    const pts = [[0, n0], ...cuts, [Lraw, n1]], ps = [];
    for (let i = 0; i + 1 < pts.length; i++){
      const a = pts[i][0], b = pts[i+1][0]; if (b - a < 0.3) continue;
      const P = {id:PC.length, li, a, b, na:pts[i][1], nb:pts[i+1][1], f:null, r:null};
      P.f = DL.length; DL.push({id:DL.length, li, dir:1, a, b, len:b - a, from:P.na, to:P.nb, piece:P.id});
      if (!ow){ P.r = DL.length; DL.push({id:DL.length, li, dir:-1, a, b, len:b - a, from:P.nb, to:P.na, piece:P.id}); }
      PC.push(P); ps.push(P);
    }
    LP[li] = ps;
  }
  // position on a line at raw arc length s
  const vO = C.vOff, VS = C.VS;
  function posAt(li, s){
    const P = lines[li].P, o = vO[li], m = P.length >> 1;
    if (s <= 0) return [P[0], P[1]]; if (s >= VS[o+m-1]) return [P[m*2-2], P[m*2-1]];
    let lo = 0, hi = m - 2; while (lo < hi){ const md = (lo + hi + 1) >> 1; if (VS[o+md] <= s) lo = md; else hi = md - 1; }
    const d = VS[o+lo+1] - VS[o+lo], f = d > 1e-6 ? (s - VS[o+lo])/d : 0;
    return [P[lo*2] + (P[lo*2+2] - P[lo*2])*f, P[lo*2+1] + (P[lo*2+3] - P[lo*2+1])*f];
  }
  const linkPos = (dl, u) => dl.dir > 0 ? posAt(dl.li, dl.a + u) : posAt(dl.li, dl.b - u);
  function eAtS(li, s){
    const L = lines[li], E = L.E; if (!E) return 0; const o = vO[li], m = L.P.length >> 1;
    if (s <= 0) return E[0]; if (s >= VS[o+m-1]) return E[m-1];
    let lo = 0, hi = m - 2; while (lo < hi){ const md = (lo + hi + 1) >> 1; if (VS[o+md] <= s) lo = md; else hi = md - 1; }
    const d = VS[o+lo+1] - VS[o+lo], f = d > 1e-6 ? (s - VS[o+lo])/d : 0; return E[lo] + (E[lo+1] - E[lo])*f;
  }
  const linkE = (dl, u) => dl.dir > 0 ? eAtS(dl.li, dl.a + u) : eAtS(dl.li, dl.b - u);
  // nodes: arms and movements
  const nodeIds = new Set(); for (const P of PC){ nodeIds.add(P.na); nodeIds.add(P.nb); }
  const OUTS = new Array(DL.length);                // link -> [out link ids]
  for (let i = 0; i < DL.length; i++) OUTS[i] = [];
  const NODE = new Map();
  let nMoves = 0;
  for (const nd of nodeIds){
    const A = [];
    const addPieceEnds = ps => { if (!ps) return; for (const P of ps){
      if (P.na === nd) A.push({P, end:0, in:P.r, out:P.f});
      if (P.nb === nd) A.push({P, end:1, in:P.f, out:P.r}); } };
    let x, y, dead = false, real = nd < VB;
    if (real){
      const seen = new Set();
      for (let q = J.nIO[nd]; q < J.nIO[nd+1]; q++){ const li = J.nIL[q]; if (seen.has(li)) continue; seen.add(li); if (!drivable(li)) continue; addPieceEnds(LP[li]); }
      x = J.NX[nd]; y = J.NY[nd];
    } else {
      const li = (nd - VB) >> 1, e = (nd - VB) & 1; addPieceEnds(LP[li]);
      vSame(li, e, l2 => addPieceEnds(LP[l2]));
      const P = lines[li].P; x = e ? P[P.length - 2] : P[0]; y = e ? P[P.length - 1] : P[1]; dead = A.length < 2;
    }
    for (const a of A){
      const dl = DL[a.out !== null ? a.out : a.in], leaving = a.out !== null, d = Math.min(8, dl.len*0.5);
      let p0, p1; if (leaving){ p0 = linkPos(dl, 0); p1 = linkPos(dl, d); } else { p0 = linkPos(dl, dl.len); p1 = linkPos(dl, dl.len - d); }
      const vx = p1[0] - p0[0], vy = p1[1] - p0[1], l = Math.hypot(vx, vy) || 1; a.ux = vx/l; a.uy = vy/l;
    }
    for (const Ai of A){
      if (Ai.in === null) continue;
      const list = [];
      for (const Ao of A){ if (Ao.out === null) continue;
        const d = wrapA(Math.atan2(Ao.uy, Ao.ux) - Math.atan2(-Ai.uy, -Ai.ux)); const turn = Ao === Ai ? 3 : (Math.abs(d) > 2.75 ? 3 : 0);
        list.push({Ao, turn}); }
      const nonU = list.filter(m => m.turn !== 3 && m.Ao !== Ai);
      let use = nonU.length ? nonU : (dead || A.length < 2 ? [] : list);
      if (!use.length && opts.uturnDead) use = list.filter(m => m.Ao === Ai);          // analysis only: turn round at a dead end
      for (const m of use){ OUTS[Ai.in].push(m.Ao.out); nMoves++; }
    }
    NODE.set(nd, {x, y, real, dead, arms:A.length, A});
  }
  return {lines, C, J, VB, DL, PC, LP, OUTS, NODE, nMoves, drivable, posAt, linkPos, linkE, eAtS, vEnd};
}
// strongly connected components (iterative Tarjan) over links
function scc(N){
  const n = N.DL.length, idx = new Int32Array(n).fill(-1), low = new Int32Array(n), on = new Uint8Array(n), comp = new Int32Array(n).fill(-1);
  const st = [], cs = [], ci = new Int32Array(n); let I = 0, nc = 0;
  for (let s = 0; s < n; s++){
    if (idx[s] >= 0) continue;
    cs.push(s); idx[s] = low[s] = I++; st.push(s); on[s] = 1; ci[s] = 0;
    while (cs.length){
      const v = cs[cs.length - 1], O = N.OUTS[v];
      if (ci[v] < O.length){
        const w = O[ci[v]++];
        if (idx[w] < 0){ idx[w] = low[w] = I++; st.push(w); on[w] = 1; ci[w] = 0; cs.push(w); }
        else if (on[w] && idx[w] < low[v]) low[v] = idx[w];
      } else {
        cs.pop(); if (cs.length){ const u = cs[cs.length - 1]; if (low[v] < low[u]) low[u] = low[v]; }
        if (low[v] === idx[v]){ let w; do { w = st.pop(); on[w] = 0; comp[w] = nc; } while (w !== v); nc++; }
      }
    }
  }
  return {comp, nc};
}
// weak components over links (movement edges + the two directions of a piece)
function weak(N){
  const n = N.DL.length, par = new Int32Array(n); for (let i = 0; i < n; i++) par[i] = i;
  const f = a => { while (par[a] !== a){ par[a] = par[par[a]]; a = par[a]; } return a; };
  const u = (a, b) => { a = f(a); b = f(b); if (a !== b) par[a] = b; };
  for (let i = 0; i < n; i++) for (const o of N.OUTS[i]) u(i, o);
  for (const P of N.PC) if (P.r !== null) u(P.f, P.r);
  const comp = new Int32Array(n); for (let i = 0; i < n; i++) comp[i] = f(i);
  return comp;
}
// Dijkstra over links (cost = link length) from link s; returns dist Float64Array (Infinity = unreachable)
function dijkstra(N, s, target){
  const n = N.DL.length, dist = new Float64Array(n).fill(Infinity), H = [];
  const push = (d, v) => { H.push([d, v]); let i = H.length - 1; while (i > 0){ const p = (i - 1) >> 1; if (H[p][0] <= H[i][0]) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
  const pop = () => { const t = H[0], l = H.pop(); if (H.length){ H[0] = l; let i = 0; for (;;){ const a = i*2 + 1, b = a + 1; let m = i; if (a < H.length && H[a][0] < H[m][0]) m = a; if (b < H.length && H[b][0] < H[m][0]) m = b; if (m === i) break; [H[m], H[i]] = [H[i], H[m]]; i = m; } } return t; };
  for (const v of (Array.isArray(s) ? s : [s])){ dist[v] = 0; push(0, v); }
  while (H.length){ const [d, v] = pop(); if (d > dist[v]) continue; if (v === target) break; const nd = d + N.DL[v].len; for (const w of N.OUTS[v]) if (nd < dist[w]){ dist[w] = nd; push(nd, w); } }
  return dist;
}
module.exports = {build, scc, weak, dijkstra};
