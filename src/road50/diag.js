// road50/diag.js — road network diagnostics for one city, on the data the page loads (or a test stage).
//   node road50/diag.js <city> [--dir <data folder>] [--tag <name>] [--out <folder>] [--png] [--pairs 40x50] [--mode app|fix]
// Builds the roads module's junction graph (roads.js prep) and the traffic system's drivable network (tgraph.js = traffic.js
// rules), then reports components, dead ends (classified), gaps, level conflicts, steps, steep grades, roads in water, one-way
// sinks / closed one-way sets, and offline route tests. Writes <out>/<city>_<tag>.json (summary + problem list) and with --png
// a problem map per district (<out>/<city>_<tag>_<district>.png).
'use strict';
const path = require('path'), fs = require('fs');
const lib = require('./lib.js'), TG = require('./tgraph.js'), {Canvas} = require('./png.js');
const args = process.argv.slice(2), city = args[0];
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i+1] : null; };
const flag = k => args.includes('--' + k);
const OUT = opt('out') || path.join(__dirname, 'out'), TAG = opt('tag') || 'before';
fs.mkdirSync(OUT, {recursive:true});
const T0 = Date.now(), log = (...a) => console.log('[' + ((Date.now() - T0)/1000).toFixed(1) + 's]', ...a);
const D = lib.loadCity(city, opt('dir'));
const lines = D.lines, HALF = D.HALF, B = D.base;
log(city, 'lines', lines.length);
D.C = D.SGRoads._dbg.prep(lines); const C = D.C, J = C.J;
log('prep: junction nodes', J.nN);
const N = TG.build(D, {step:15});
log('traffic network: links', N.DL.length, 'pieces', N.PC.length, 'nodes', N.NODE.size, 'movements', N.nMoves);
// ---------------------------------------------------------------- land codes (0 land, 1 sea, 2 reservoir / river, 3 forest, 4 beach, 5 foreign)
const NN = B.N, CELL = B.CELL;
const codes = (() => { const s = Buffer.from(B.codes, 'base64'), out = new Uint8Array(NN*NN); let o = 0;
  for (let i = 0; i + 3 < s.length; i += 4){ const v = s[i] | (s[i+1] << 8), c = s[i+2] | (s[i+3] << 8); if (v) out.fill(v, o, Math.min(NN*NN, o + c)); o += c; } return out; })();
const c2i = v => Math.min(NN - 1, Math.max(0, Math.floor((v + HALF)/CELL)));
const codeAt = (x, y) => codes[c2i(y)*NN + c2i(x)];
const isWater = (x, y) => { const k = codeAt(x, y); return k === 1 || k === 2; };
// ---------------------------------------------------------------- helpers
const drv = N.drivable, PROB = [];
const prob = (type, x, y, o) => PROB.push(Object.assign({type, x:+x.toFixed(1), y:+y.toFixed(1)}, o || {}));
const Eat = (L, k) => L.E ? L.E[k] : 0;
const pieceLen = P => P.b - P.a;
let totLen = 0; for (const P of N.PC) totLen += pieceLen(P);
// segment grid over drivable lines (16 m cells)
const CS = 16, NCX = Math.ceil(2*HALF/CS) + 2, grid = new Map();
const gk = (x, y) => (Math.floor((y + HALF)/CS) + 1)*NCX + Math.floor((x + HALF)/CS) + 1;
function segsInGrid(filter){
  grid.clear();
  for (let li = 0; li < lines.length; li++){ const L = lines[li]; if (!filter(li, L)) continue; const P = L.P, m = P.length >> 1;
    for (let k = 0; k + 1 < m; k++){
      const ax = P[k*2], ay = P[k*2+1], bx = P[k*2+2], by = P[k*2+3], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)/(CS*0.5)));
      let last = -1; for (let i = 0; i <= n; i++){ const key = gk(ax + (bx - ax)*i/n, ay + (by - ay)*i/n); if (key === last) continue; last = key; let a = grid.get(key); if (!a) grid.set(key, a = []); if (a[a.length-1] !== li*65536 + k) a.push(li*65536 + k); }
    } }
}
// nearest segment of another line to (x, y) within r: [dist, li, k, u, e]
function nearestSeg(x, y, r, exclude){
  let best = null; const seen = new Set();
  for (let gy = Math.floor((y - r + HALF)/CS) + 1; gy <= Math.floor((y + r + HALF)/CS) + 1; gy++)
    for (let gx = Math.floor((x - r + HALF)/CS) + 1; gx <= Math.floor((x + r + HALF)/CS) + 1; gx++){
      const a = grid.get(gy*NCX + gx); if (!a) continue;
      for (const id of a){ if (seen.has(id)) continue; seen.add(id); const li = Math.floor(id/65536), k = id % 65536; if (exclude(li)) continue;
        const P = lines[li].P, ax = P[k*2], ay = P[k*2+1], ex = P[k*2+2] - ax, ey = P[k*2+3] - ay, l2 = ex*ex + ey*ey;
        let u = l2 > 1e-9 ? ((x - ax)*ex + (y - ay)*ey)/l2 : 0; u = u < 0 ? 0 : u > 1 ? 1 : u;
        const d = Math.hypot(ax + ex*u - x, ay + ey*u - y);
        if (d <= r && (!best || d < best[0])){ const L = lines[li]; best = [d, li, k, u, L.E ? L.E[k] + (L.E[k+1] - L.E[k])*u : 0]; } }
    }
  return best;
}
// ---------------------------------------------------------------- 1. components
const W = TG.weak(N), wl = new Map();
for (const P of N.PC){ const r = W[P.f]; wl.set(r, (wl.get(r) || 0) + pieceLen(P)); }
const wsort = [...wl.entries()].sort((a, b) => b[1] - a[1]), mainW = wsort[0][0];
const NU = TG.build(D, {step:15, uturnDead:true});
const SA = TG.scc(N); let slA = new Float64Array(SA.nc); for (const dl of N.DL) slA[SA.comp[dl.id]] += dl.len; let mainSA = 0; for (let i = 1; i < SA.nc; i++) if (slA[i] > slA[mainSA]) mainSA = i;
// SCC metrics with turning round at dead ends (traffic vehicles vanish there instead: car parks, portals)
const S = TG.scc(NU), sl = new Float64Array(S.nc); for (const dl of NU.DL) sl[S.comp[dl.id]] += dl.len;
let mainS = 0; for (let i = 1; i < S.nc; i++) if (sl[i] > sl[mainS]) mainS = i;
let dirLen = 0; for (const dl of N.DL) dirLen += dl.len;
// components > 1 km other than the main one: where they are
const compInfo = new Map();
for (const P of N.PC){ const r = W[P.f]; if (r === mainW) continue; let o = compInfo.get(r); if (!o){ o = {len:0, x:0, y:0, n:0, cls:99, names:new Set()}; compInfo.set(r, o); }
  const L = lines[P.li], p = N.posAt(P.li, (P.a + P.b)/2); o.len += pieceLen(P); o.x += p[0]; o.y += p[1]; o.n++; if (L.c < o.cls) o.cls = L.c; if (L.name && L.name[0] && o.names.size < 4) o.names.add(L.name[0]); }
const bigOther = [...compInfo.values()].filter(o => o.len >= 1000).sort((a, b) => b.len - a.len).map(o => ({len:Math.round(o.len), x:Math.round(o.x/o.n), y:Math.round(o.y/o.n), cls:o.cls, names:[...o.names]}));
for (const o of bigOther.slice(0, 200)) prob('island', o.x, o.y, {len:o.len, cls:o.cls, names:o.names});
log('weak components', wl.size, 'main', (wsort[0][1]/totLen*100).toFixed(1) + '%', 'others >=1 km', bigOther.length, '| SCC main', (sl[mainS]/dirLen*100).toFixed(1) + '%');
// closed one-way sets: SCCs (not the main one) with no movement out of them; and those with no movement into them
const sOut = new Uint8Array(S.nc), sIn = new Uint8Array(S.nc);
for (const dl of NU.DL) for (const o of NU.OUTS[dl.id]){ const a = S.comp[dl.id], b = S.comp[o]; if (a !== b){ sOut[a] = 1; sIn[b] = 1; } }
let closedSets = 0, closedLen = 0, sinkLinks = 0, srcLinks = 0;
const sCount = new Int32Array(S.nc); for (const dl of N.DL) sCount[S.comp[dl.id]]++;
const sDone = new Uint8Array(S.nc);
for (const dl of N.DL){ const s = S.comp[dl.id]; if (s === mainS || sDone[s]) continue; sDone[s] = 1;
  if (W[dl.id] !== mainW) continue;                                          // islands are counted above
  if (!sOut[s]){ if (sCount[s] > 1){ closedSets++; closedLen += sl[s]; const p = N.linkPos(dl, dl.len/2); prob('oneway_trap', p[0], p[1], {links:sCount[s], len:Math.round(sl[s])}); } else sinkLinks++; }
  else if (!sIn[s]){ if (sCount[s] > 1){ const p = N.linkPos(dl, dl.len/2); prob('oneway_noentry', p[0], p[1], {links:sCount[s], len:Math.round(sl[s])}); } else srcLinks++; }
}
// ---------------------------------------------------------------- 2. dead ends, sinks, sources
segsInGrid((li, L) => L.c <= 11 && !(L.flags & 8));
const chunkBorder = (x, y) => { if (!D.chunkOf) return false; const fx = ((x + HALF) % 8000 + 8000) % 8000, fy = ((y + HALF) % 8000 + 8000) % 8000; return Math.min(fx, 8000 - fx) < 0.6 || Math.min(fy, 8000 - fy) < 0.6; };
const DE = {total:0, tunnel:0, edge:0, chunk:0, gap3:0, gap6:0, gap12:0, levelgap:0, service:0, deckend:0, water:0, culdesac:0, oneway:0};
let owSink = 0, owSource = 0;
for (const [nd, Nd] of N.NODE){
  // sinks / sources at nodes with >= 2 arms
  if (Nd.arms >= 2){ for (const a of Nd.A){ if (a.in !== null && !N.OUTS[a.in].length){ owSink++; prob('sink', Nd.x, Nd.y, {li:a.P.li}); }
    if (a.out !== null){ let has = false; for (const b of Nd.A) if (b.in !== null && N.OUTS[b.in].includes(a.out)){ has = true; break; } if (!has){ owSource++; prob('source', Nd.x, Nd.y, {li:a.P.li}); } } } }
  if (Nd.arms !== 1) continue;
  const a = Nd.A[0], li = a.P.li, L = lines[li], m = L.P.length >> 1, atEnd = a.end ? (a.P.b >= J.LEN(li) - 0.01) : (a.P.a <= 0.01);
  if (!atEnd) continue;                                                       // (a cut inside a line with one arm: not a line end)
  const k = a.end ? m - 1 : 0, x = L.P[k*2], y = L.P[k*2+1], e = Eat(L, k);
  DE.total++; if (L.flags & 1) DE.oneway++;
  const tunnel = (a.end ? (L.flags & 128) : (L.flags & 64)) !== 0;
  let kind;
  if (tunnel) kind = 'tunnel';
  else if (Math.abs(x) > HALF - 30 || Math.abs(y) > HALF - 30) kind = 'edge';
  else if (chunkBorder(x, y)) kind = 'chunk';
  else {
    const nb = nearestSeg(x, y, 12, l2 => l2 === li || !drv(l2) && lines[l2].c !== 11);
    let nbD = nb && drv(nb[1]) ? nb : nearestSeg(x, y, 12, l2 => l2 === li || !drv(l2));
    // ahead of the end (the line's outward direction within ~53 degrees) or within 2 m
    if (nbD){ const j = a.end ? Math.max(0, m - 2) : Math.min(m - 1, 1), ux = x - L.P[j*2], uy = y - L.P[j*2+1], ul = Math.hypot(ux, uy) || 1;
      const PB = lines[nbD[1]].P, qx = PB[nbD[2]*2] + (PB[nbD[2]*2+2] - PB[nbD[2]*2])*nbD[3] - x, qy = PB[nbD[2]*2+1] + (PB[nbD[2]*2+3] - PB[nbD[2]*2+1])*nbD[3] - y, ql = Math.hypot(qx, qy) || 1;
      nbD.push((ux*qx + uy*qy)/(ul*ql)); if (nbD[0] > 2 && nbD[5] < 0.6) nbD = null; }
    if (nbD && Math.abs(nbD[4] - e) <= 1.5) kind =nbD[0] <= 3 ? 'gap3' : nbD[0] <= 6 ? 'gap6' : 'gap12';
    else if (nbD && nbD[0] <= 6) kind = 'levelgap';
    else if (nb && lines[nb[1]].c === 11 && nb[0] <= 3) kind = 'service';
    else if (e > 2) kind = 'deckend';
    else if (isWater(x, y)) kind = 'water';
    else kind = 'culdesac';
    if (kind.startsWith('gap') || kind === 'levelgap') Object.assign(Nd, {gapTo:nbD});
  }
  DE[kind]++;
  if (kind !== 'culdesac' && kind !== 'service') prob('dead_' + kind, x, y, {li, end:a.end, e:+e.toFixed(1), c:L.c, ow:!!(L.flags & 1), br:!!(L.flags & 2), d:Nd.gapTo ? +Nd.gapTo[0].toFixed(1) : undefined, to:Nd.gapTo ? Nd.gapTo[1] : undefined});
}
log('dead ends', JSON.stringify(DE), 'sinks', owSink, 'sources', owSource);
// ---------------------------------------------------------------- 3. crossings: false junctions / low clearance / missed junctions
segsInGrid((li, L) => drv(li));
const XC = {falsejunc:0, lowclear:0, missedjunc:0, overpass:0, atgrade:0};
{ const done = new Set();
  for (const [key, a] of grid){ if (a.length < 2) continue;
    for (let p = 0; p < a.length; p++) for (let q = p + 1; q < a.length; q++){
      const iA = Math.floor(a[p]/65536), kA = a[p] % 65536, iB = Math.floor(a[q]/65536), kB = a[q] % 65536; if (iA === iB) continue;
      const pk = iA < iB ? a[p] + ':' + a[q] : a[q] + ':' + a[p]; if (done.has(pk)) continue;
      const LA = lines[iA], LB = lines[iB], PA = LA.P, PB = LB.P;
      const ax = PA[kA*2], ay = PA[kA*2+1], ex = PA[kA*2+2] - ax, ey = PA[kA*2+3] - ay, cx = PB[kB*2], cy = PB[kB*2+1], fx = PB[kB*2+2] - cx, fy = PB[kB*2+3] - cy, den = ex*fy - ey*fx;
      if (Math.abs(den) < 1e-9) continue;
      const u = ((cx - ax)*fy - (cy - ay)*fx)/den, v = ((cx - ax)*ey - (cy - ay)*ex)/den;
      if (u <= 1e-6 || u >= 1 - 1e-6 || v <= 1e-6 || v >= 1 - 1e-6) continue;
      const x = ax + ex*u, y = ay + ey*u; if (gk(x, y) !== key) continue; done.add(pk);
      const eA = LA.E ? LA.E[kA] + (LA.E[kA+1] - LA.E[kA])*u : 0, eB = LB.E ? LB.E[kB] + (LB.E[kB+1] - LB.E[kB])*v : 0, de = Math.abs(eA - eB);
      const brA = !!(LA.flags & 2), brB = !!(LB.flags & 2);
      if (de <= 1.2){ if (brA !== brB && Math.max(eA, eB) < 1.2 && (brA ? LA : LB).c <= 10){ XC.falsejunc++; prob('falsejunc', x, y, {a:iA, b:iB, eA:+eA.toFixed(1), eB:+eB.toFixed(1)}); } else XC.atgrade++; }
      else if (de < 4.2){ XC.lowclear++; prob('lowclear', x, y, {a:iA, b:iB, eA:+eA.toFixed(1), eB:+eB.toFixed(1), brA, brB}); }
      else if (!brA && !brB){ XC.missedjunc++; prob('missedjunc', x, y, {a:iA, b:iB, eA:+eA.toFixed(1), eB:+eB.toFixed(1)}); }
      else XC.overpass++;
    } }
}
log('crossings', JSON.stringify(XC));
// ---------------------------------------------------------------- 4. level steps at shared vertices, steep grades, roads in water
const ST = {step1_3:0, step3_15:0, step15:0, steep:0, inwater:0, inwaterM:0, shortdeck:0};
for (let nd = 0, NNn = C.nodeOff.length - 1; nd < NNn; nd++){
  const o0 = C.nodeOff[nd], o1 = C.nodeOff[nd+1]; if (o1 - o0 < 2) continue;
  let emin = Infinity, emax = -Infinity, anyEnd = false, nD = 0, x = 0, y = 0;
  for (let j = o0; j < o1; j++){ const li = C.incL[j]; if (!drv(li)) continue; const L = lines[li], k = C.incV[j], m = L.P.length >> 1, e = Eat(L, k); nD++; if (e < emin) emin = e; if (e > emax) emax = e; if (k === 0 || k === m - 1) anyEnd = true; x = L.P[k*2]; y = L.P[k*2+1]; }
  if (nD < 2 || !anyEnd) continue; const de = emax - emin; if (de <= 1.2) continue;
  if (de <= 3) ST.step1_3++; else if (de <= 15) ST.step3_15++; else ST.step15++;
  prob('step', x, y, {de:+de.toFixed(1), lo:+emin.toFixed(1), hi:+emax.toFixed(1)});
}
for (let li = 0; li < lines.length; li++){
  const L = lines[li]; if (!drv(li)) continue; const P = L.P, m = P.length >> 1, br = (L.flags & 2) !== 0;
  if (L.E) for (let k = 0; k + 1 < m; k++){ const d = Math.hypot(P[k*2+2] - P[k*2], P[k*2+3] - P[k*2+1]), de = Math.abs(L.E[k+1] - L.E[k]); if (de > 1.0 && de > 0.12*d){ ST.steep++; prob('steep', (P[k*2] + P[k*2+2])/2, (P[k*2+1] + P[k*2+3])/2, {li, de:+de.toFixed(1), d:+d.toFixed(1)}); } }
  // at grade over water for > 60 m (sampled every 5 m; the land codes are 25-50 m cells)
  let run = 0, rx = 0, ry = 0, s = 0;
  for (let k = 0; k + 1 < m; k++){
    const ax = P[k*2], ay = P[k*2+1], bx = P[k*2+2], by = P[k*2+3], d = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(d/5));
    for (let i = 0; i < n; i++){ const f = i/n, x = ax + (bx - ax)*f, y = ay + (by - ay)*f, e = L.E ? L.E[k] + (L.E[k+1] - L.E[k])*f : 0;
      if (e < 1.0 && isWater(x, y)){ if (!run){ rx = x; ry = y; } run += d/n; } else { if (run > 60){ ST.inwater++; ST.inwaterM += run; prob('inwater', rx, ry, {li, len:Math.round(run), br}); } run = 0; } }
  }
  if (run > 60){ ST.inwater++; ST.inwaterM += run; prob('inwater', rx, ry, {li, len:Math.round(run), br}); }
}
// bridge decks that stop over water: dead-end (or deck-end) bridge line ends with E > 2 on a water cell
for (const p of PROB) if (p.type === 'dead_deckend' && isWater(p.x, p.y)){ ST.shortdeck++; p.type = 'dead_shortdeck'; }
ST.inwaterM = Math.round(ST.inwaterM);
log('levels / water', JSON.stringify(ST));
// ---------------------------------------------------------------- 5. route tests
const pairs = (opt('pairs') || '40x50').split('x').map(Number);
const rng = (() => { let s = 0x9e3779b9 ^ (city.charCodeAt(0)*7919); return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s/4294967296; }; })();
const cum = new Float64Array(N.DL.length); { let a = 0; for (let i = 0; i < N.DL.length; i++){ a += N.DL[i].len; cum[i] = a; } }
const pick = () => { const r = rng()*cum[cum.length - 1]; let lo = 0, hi = cum.length - 1; while (lo < hi){ const m = (lo + hi) >> 1; if (cum[m] < r) lo = m + 1; else hi = m; } return lo; };
const RT = {pairs:0, ok:0, fail:0, failIsland:0, failOneway:0, detourMed:0, detour3:0, far:0};
const det = [], fails = [];
for (let o = 0; o < pairs[0]; o++){
  const s = pick(), Ps = N.PC[N.DL[s].piece], dist = TG.dijkstra(N, Ps.r !== null ? [Ps.f, Ps.r] : [Ps.f], -1), ps = N.linkPos(N.DL[s], N.DL[s].len/2);
  for (let q = 0; q < pairs[1]; q++){
    const t = pick(); RT.pairs++;
    const Pt = N.PC[N.DL[t].piece], dt = Math.min(dist[Pt.f], Pt.r !== null ? dist[Pt.r] : Infinity);
    const pt = N.linkPos(N.DL[t], N.DL[t].len/2), eu = Math.hypot(pt[0] - ps[0], pt[1] - ps[1]);
    if (dt < Infinity){ RT.ok++; if (eu > 1000){ RT.far++; const r = (dt + N.DL[t].len/2)/eu; det.push(r); } continue; }
    RT.fail++; const island = W[s] !== W[t]; if (island) RT.failIsland++; else RT.failOneway++;
    const small = island ? (W[s] === mainW ? 'dest' : W[t] === mainW ? 'origin' : 'both') : (SA.comp[s] === mainSA ? 'dest' : 'origin');
    fails.push({o:[Math.round(ps[0]), Math.round(ps[1])], d:[Math.round(pt[0]), Math.round(pt[1])], why:island ? 'not connected' : 'one-way', off:small,
      oc:lines[N.DL[s].li].c, dc:lines[N.DL[t].li].c});
  }
}
det.sort((a, b) => a - b); RT.detourMed = det.length ? +det[det.length >> 1].toFixed(2) : 0; RT.detour3 = det.filter(r => r > 3).length;
RT.okPct = +(RT.ok/RT.pairs*100).toFixed(1);
log('routes', JSON.stringify(RT));
// ---------------------------------------------------------------- summary
const pc = {}; for (const p of PROB) pc[p.type] = (pc[p.type] || 0) + 1;
const summary = {city, tag:TAG, dir:D.D, lines:lines.length, drivableKm:+(totLen/1000).toFixed(1), links:N.DL.length, nodes:N.NODE.size, junctionNodes:J.nN,
  weakComponents:wl.size, mainWeakPct:+(wsort[0][1]/totLen*100).toFixed(2), otherComponentsOver1km:bigOther.length, otherKm:+((totLen - wsort[0][1])/1000).toFixed(1),
  mainSccPctApp:+(slA[mainSA]/dirLen*100).toFixed(2), mainSccPct:+(sl[mainS]/dirLen*100).toFixed(2), closedOnewaySets:closedSets, closedOnewayKm:+(closedLen/1000).toFixed(2), sinkLinksInMain:sinkLinks, sourceLinksInMain:srcLinks,
  deadEnds:DE, onewaySinks:owSink, onewaySources:owSource, crossings:XC, levels:ST, routes:RT, problemCounts:pc, topIslands:bigOther.slice(0, 25)};
fs.writeFileSync(path.join(OUT, city + '_' + TAG + '.json'), JSON.stringify({summary, fails:fails.slice(0, 400), problems:PROB}, null, 0));
console.log(JSON.stringify(summary, null, 1));
// ---------------------------------------------------------------- maps
const DIST = {
  sg:[['cbd', 1.2840, 103.8510], ['jurong', 1.3330, 103.7420], ['tampines', 1.3530, 103.9440]],
  hk:[['central', 22.2830, 114.1650], ['kowloon', 22.3150, 114.1720], ['shatin', 22.3800, 114.1900]],
  nyc:[['midtown', 40.7550, -73.9850], ['downtown_bk', 40.7000, -73.9900], ['queens', 40.7400, -73.8800]],
  tyo:[['chiyoda', 35.6810, 139.7600], ['shinjuku', 35.6900, 139.7000], ['shibuya', 35.6580, 139.7010]],
  bay:[['sf', 37.7850, -122.4100], ['oakland', 37.8050, -122.2700], ['sanjose', 37.3350, -121.8900]],
  gba:[['futian', 22.5400, 114.0550], ['luohu', 22.5450, 114.1150], ['dongguan', 23.0200, 113.7500]],
};
if (flag('png')){
  const sev = new Uint8Array(N.DL.length);  // 0 main SCC, 1 main weak (one-way trapped), 2 island
  for (const dl of NU.DL) sev[dl.id] = S.comp[dl.id] === mainS ? 0 : W[dl.id] === mainW ? 1 : 2;
  const COLS = {island:[230,30,30], oneway_trap:[255,140,0], oneway_noentry:[255,190,90], sink:[40,40,40], source:[120,120,120], dead_gap3:[220,0,220], dead_gap6:[220,0,220], dead_gap12:[170,60,200],
    dead_levelgap:[110,40,160], dead_deckend:[0,90,255], dead_shortdeck:[0,40,170], dead_water:[0,160,255], dead_chunk:[255,0,120], dead_tunnel:[150,150,150], falsejunc:[0,200,200], lowclear:[230,200,0], missedjunc:[0,170,60], step:[30,30,200], steep:[160,110,40], inwater:[0,120,255]};
  for (const [nm, lat, lon] of DIST[city] || []){
    const cx = (lon - B.lon0)*B.MX, cy = (lat - B.lat0)*B.MY, Wm = 7000, px = 1400, sc = px/Wm;
    const X = x => (x - cx)*sc + px/2, Y = y => px/2 - (y - cy)*sc;
    const cv = new Canvas(px, px, [248, 247, 243]);
    for (let li = 0; li < lines.length; li++){ const L = lines[li]; if (L.c > 12 || (L.flags & 8) && L.c > 10) continue; const P = L.P; let near = false;
      for (let k = 0; k < P.length; k += 2) if (Math.abs(P[k] - cx) < Wm*0.6 && Math.abs(P[k+1] - cy) < Wm*0.6){ near = true; break; } if (!near) continue;
      if (!drv(li)){ const col = L.c === 11 ? [205, 203, 196] : [225, 222, 214]; for (let k = 0; k + 3 < P.length; k += 2) cv.line(X(P[k]), Y(P[k+1]), X(P[k+2]), Y(P[k+3]), 1, col); } }
    for (const dl of N.DL){ const L = lines[dl.li], P = L.P; if (Math.abs(P[0] - cx) > Wm && Math.abs(P[P.length-2] - cx) > Wm) continue;
      const s = sev[dl.id], w = L.c <= 1 ? 3 : L.c <= 5 ? 2.4 : L.c <= 9 ? 1.8 : 1.2, col = s === 0 ? (L.E && L.E[0] + L.E[(P.length >> 1) - 1] > 4 ? [70, 100, 140] : [95, 95, 95]) : s === 1 ? [255, 140, 0] : [230, 30, 30];
      const o = N.C.vOff[dl.li], pa = N.posAt(dl.li, dl.a), pb = N.posAt(dl.li, dl.b); let prev = [X(pa[0]), Y(pa[1])];
      for (let k = 0; k < (P.length >> 1); k++){ const sv = N.C.VS[o + k]; if (sv <= dl.a || sv >= dl.b) continue; const q = [X(P[k*2]), Y(P[k*2+1])]; cv.line(prev[0], prev[1], q[0], q[1], s ? w + 1 : w, col); prev = q; }
      cv.line(prev[0], prev[1], X(pb[0]), Y(pb[1]), s ? w + 1 : w, col); }
    for (const p of PROB){ const x = X(p.x), y = Y(p.y); if (x < -20 || y < -20 || x > px + 20 || y > px + 20) continue; const col = COLS[p.type] || [0, 0, 0];
      if (p.type === 'sink' || p.type === 'source' || p.type === 'step' || p.type === 'lowclear') cv.ring(x, y, 6, 2, col);
      else if (p.type === 'island') cv.ring(x, y, 10, 3, col); else cv.disc(x, y, p.type === 'dead_tunnel' ? 3 : 4.5, col); }
    const f = path.join(OUT, city + '_' + TAG + '_' + nm + '.png'); cv.save(f); log('map', f);
  }
}
