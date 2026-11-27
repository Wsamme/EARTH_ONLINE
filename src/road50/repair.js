// road50/repair.js — rule-based repairs of a city's encoded road data (SGR1), written to a test stage folder.
//   node road50/repair.js <city> --out <stage folder> [--dir <source data folder>] [--log <json>]
// Works on the staged road file(s) the page loads (decode -> repair -> re-encode, same names / refs indices, so the base file is
// unchanged and copied as is). Every change is logged (rule, line, position, numbers). Rules (see README in this folder):
//   R1 gap join     a dead end (traffic graph: one drivable arm at a line end; not a tunnel mouth, not the map edge) within GAP m of
//                   another drivable road ahead of it (or within 2 m), at the same level (|dE| <= 1.2 m), compatible classes:
//                   the end is moved onto that road (<= 1 m) or extended to it by one vertex, and a vertex is inserted there.
//   R2 chunk seam   (Greater Bay chunks) two line ends on a chunk border within 1 m: both take the same position.
//   R3 level step   line ends meeting other drivable lines at one vertex with 1.2 < |dE| <= 15 m: the ending, non-bridge line's height
//                   profile is eased to the other level over |dE| / 5.5 % (the pipelines' ramp grade), at most its own length and
//                   12 %; skipped (flagged) if that would break or create any other junction of the line.
//   R4 clearance    a bridge-tagged line crossing an at-grade drivable road with no junction and less than 4.2 m between the decks
//                   (or at the same level: a false junction): the bridge's profile is raised to 5.0 m over that road with 5.5 % ramps
//                   inside the bridge line; skipped (flagged) where the bridge is too short for the ramps or another contact changes.
//   R5 steep        a height jump of more than 12 % (and > 1 m) between two vertices of a line: the profile is re-graded to 8 % by
//                   spreading the jump to both sides within the line (upper and lower envelope mean), keeping the line's end heights
//                   and every junction contact; else flagged.
// Never adds a road: R1 only joins an existing road end to an existing road within GAP metres.
'use strict';
const path = require('path'), fs = require('fs'), lib = require('./lib.js'), TG = require('./tgraph.js');
const args = process.argv.slice(2), city = args[0];
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i+1] : null; };
const OUTD = opt('out'); if (!OUTD) throw new Error('--out <stage folder>');
const RULES = new Set((opt('rules') || 'R1,R2,R3,R4,R5').split(','));
const GAP = +(opt('gap') || 6), T0 = Date.now(), log = (...a) => console.log('[' + ((Date.now() - T0)/1000).toFixed(1) + 's]', ...a);
const D = lib.loadCity(city, opt('dir')), CI = lib.CITIES[city], lines = D.lines, HALF = D.HALF;
// raw records, aligned with D.lines
const files = [];                 // [{name, recs, off}]
if (CI.chunks){ let off = 0; for (const ch of [...D.base.roadChunks].sort((a, b) => a.k - b.k)){ const name = 'gba_rc' + ch.k + '.txt', recs = lib.decodeRaw(lib.readGz(path.join(D.D, name))); files.push({name, recs, off, k:ch.k}); off += recs.length; } }
else files.push({name:CI.roads, recs:lib.decodeRaw(lib.readGz(path.join(D.D, CI.roads))), off:0});
const REC = []; for (const F of files) for (const r of F.recs) REC.push(r);
if (REC.length !== lines.length) throw new Error('record count mismatch');
// editable geometry per line: Q (int quarter metres) and E (float metres or null)
const scOf = r => (r.f & 32) ? 2.5 : 5;
const G = REC.map(r => ({Q:Array.from(r.Q), E:r.E ? Array.from(r.E, v => v/scOf(r)) : null, dirty:false}));
const CH = [];                    // change log
const FLAG = [];                  // flagged for the owner (not changed)
const chg = (rule, li, x, y, o) => CH.push(Object.assign({rule, li, x:+x.toFixed(1), y:+y.toFixed(1), c:lines[li].c, name:(lines[li].name && lines[li].name[0]) || lines[li].ref || ''}, o || {}));
const flg = (rule, x, y, o) => FLAG.push(Object.assign({rule, x:+x.toFixed(1), y:+y.toFixed(1)}, o || {}));
const drv = li => lines[li].c <= 10 && !(lines[li].flags & 8);
const qx = (g, k) => g.Q[k*2]/4, qy = (g, k) => g.Q[k*2+1]/4, nv = g => g.Q.length >> 1;
const eAt = (g, k) => g.E ? g.E[k] : 0;
function arcS(g){ const m = nv(g), s = new Float64Array(m); for (let k = 1; k < m; k++) s[k] = s[k-1] + Math.hypot(qx(g, k) - qx(g, k-1), qy(g, k) - qy(g, k-1)); return s; }
// ---------------------------------------------------------------- spatial index of drivable segments (current geometry)
const CS = 16, NCX = Math.ceil(2*HALF/CS) + 2;
let SIDX = null;
function buildIdx(){
  SIDX = new Map();
  for (let li = 0; li < G.length; li++){ if (lines[li].c > 11 || (lines[li].flags & 8)) continue; addIdx(li); }
}
function addIdx(li){
  const g = G[li], m = nv(g);
  for (let k = 0; k + 1 < m; k++){
    const ax = qx(g, k), ay = qy(g, k), bx = qx(g, k+1), by = qy(g, k+1), n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)/(CS*0.5)));
    let last = -1; for (let i = 0; i <= n; i++){ const key = (Math.floor((ay + (by - ay)*i/n + HALF)/CS) + 1)*NCX + Math.floor((ax + (bx - ax)*i/n + HALF)/CS) + 1; if (key === last) continue; last = key;
      let a = SIDX.get(key); if (!a) SIDX.set(key, a = new Set()); a.add(li); }
  }
}
function linesNear(x0, y0, x1, y1){
  const out = new Set();
  for (let gy = Math.floor((Math.min(y0, y1) + HALF)/CS); gy <= Math.floor((Math.max(y0, y1) + HALF)/CS) + 2; gy++)
    for (let gx = Math.floor((Math.min(x0, x1) + HALF)/CS); gx <= Math.floor((Math.max(x0, x1) + HALF)/CS) + 2; gx++){ const a = SIDX.get(gy*NCX + gx); if (a) for (const li of a) out.add(li); }
  return out;
}
// contacts of line li with other lines (classes 0-11) in its current geometry: shared vertices, crossings, ends on segments;
// each with both heights. Key -> {x, y, e, e2, li2}
function contacts(li, E, Q){
  const g0 = G[li], g = Q ? {Q, E:E || null} : g0, m = nv(g), out = [], EE = Q ? E : (E || g0.E);
  const e1 = k => EE ? EE[k] : 0;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (let k = 0; k < m; k++){ x0 = Math.min(x0, qx(g, k)); x1 = Math.max(x1, qx(g, k)); y0 = Math.min(y0, qy(g, k)); y1 = Math.max(y1, qy(g, k)); }
  for (const l2 of linesNear(x0 - 2, y0 - 2, x1 + 2, y1 + 2)){
    if (l2 === li || lines[l2].c > 11) continue; const h = G[l2], m2 = nv(h);
    for (let k = 0; k + 1 < m; k++){
      const ax = qx(g, k), ay = qy(g, k), ex = qx(g, k+1) - ax, ey = qy(g, k+1) - ay;
      for (let j = 0; j + 1 < m2; j++){
        const cx = qx(h, j), cy = qy(h, j), fx = qx(h, j+1) - cx, fy = qy(h, j+1) - cy, den = ex*fy - ey*fx;
        if (Math.abs(den) < 1e-9) continue;
        const u = ((cx - ax)*fy - (cy - ay)*fx)/den, v = ((cx - ax)*ey - (cy - ay)*ex)/den;
        if (u < -1e-6 || u > 1 + 1e-6 || v < -1e-6 || v > 1 + 1e-6) continue;
        const ea = e1(k) + (e1(k+1) - e1(k))*Math.min(1, Math.max(0, u)), eb = eAt(h, j) + (eAt(h, j+1) - eAt(h, j))*Math.min(1, Math.max(0, v));
        out.push({x:ax + ex*u, y:ay + ey*u, e:ea, e2:eb, li2:l2, k, u});
      }
    }
  }
  return out;
}
// contacts at the same level (<= 1.2 m, the roads module's junction test), as a set of rounded keys
const sameSet = C => { const s = new Set(); for (const c of C) if (Math.abs(c.e - c.e2) <= 1.2) s.add(c.li2 + ':' + Math.round(c.x) + ':' + Math.round(c.y)); return s; };
const lowSet = C => { const s = new Set(); for (const c of C) { const d = Math.abs(c.e - c.e2); if (d > 1.2 && d < 4.2 && lines[c.li2].c <= 10) s.add(c.li2 + ':' + Math.round(c.x) + ':' + Math.round(c.y)); } return s; };
// a new E profile for line li keeps every same-level contact and creates none (except those in 'allow' / dropping those in 'drop')
function keepsContacts(li, Enew, allowNew, allowLost, Qnew){
  const before = contacts(li), after = contacts(li, Enew, Qnew), A = sameSet(before), B = sameSet(after);
  for (const k of A) if (!B.has(k) && !(allowLost && allowLost(k))) return false;
  for (const k of B) if (!A.has(k) && !(allowNew && allowNew(k))) return false;
  // no new low-clearance crossing either
  const L0 = lowSet(before), L1 = lowSet(after); for (const k of L1) if (!L0.has(k)) return false;
  return true;
}
function setE(li, Enew, rule, x, y, o){
  const g = G[li]; g.E = Enew; g.dirty = true; chg(rule, li, x, y, o);
}
log(city, 'lines', lines.length);
// ================================================================ R1 gap join (+ R2 chunk seams)
D.C = D.SGRoads._dbg.prep(lines);
const N = TG.build(D, {step:15});
buildIdx();
const anchors = new Set();                         // Q keys of vertices used as join points
const qkey = (X, Y) => X + ',' + Y;
const insertions = new Map();                      // li -> [{k, u, X, Y, e}]
const endMoves = [];                               // {li, end, X, Y, e, mode: 'move' | 'extend'}
const compatible = (c1, c2) => { const lo = Math.min(c1, c2), hi = Math.max(c1, c2); if (lo === 0) return hi <= 5; if (lo === 1) return hi <= 9; return true; };
if (RULES.has('R1') || RULES.has('R2')){
  let nDead = 0;
  for (const [nd, Nd] of N.NODE){
    if (Nd.arms !== 1) continue;
    const a = Nd.A[0], li = a.P.li, L = lines[li], g = G[li], m = nv(g), atEnd = a.end ? (a.P.b >= N.J.LEN(li) - 0.01) : (a.P.a <= 0.01);
    if (!atEnd) continue; nDead++;
    const end = a.end, k = end ? m - 1 : 0, x = qx(g, k), y = qy(g, k), e = eAt(g, k);
    if ((end ? (L.flags & 128) : (L.flags & 64)) || Math.abs(x) > HALF - 30 || Math.abs(y) > HALF - 30) continue;
    if (anchors.has(qkey(g.Q[k*2], g.Q[k*2+1]))) continue;
    // nearest drivable segment of another line
    let best = null;
    for (const l2 of linesNear(x - GAP, y - GAP, x + GAP, y + GAP)){
      if (l2 === li || !drv(l2)) continue; const h = G[l2], m2 = nv(h);
      for (let j = 0; j + 1 < m2; j++){
        const ax = qx(h, j), ay = qy(h, j), ex = qx(h, j+1) - ax, ey = qy(h, j+1) - ay, l2s = ex*ex + ey*ey;
        let u = l2s > 1e-9 ? ((x - ax)*ex + (y - ay)*ey)/l2s : 0; u = u < 0 ? 0 : u > 1 ? 1 : u;
        const d = Math.hypot(ax + ex*u - x, ay + ey*u - y);
        if (d <= GAP && (!best || d < best.d)) best = {d, l2, j, u, px:ax + ex*u, py:ay + ey*u, e2:eAt(h, j) + (eAt(h, j+1) - eAt(h, j))*u};
      }
    }
    if (!best) continue;
    const L2 = lines[best.l2];
    // ahead of the end, or within 2 m
    const kp = end ? m - 2 : 1, ux = x - qx(g, kp), uy = y - qy(g, kp), ul = Math.hypot(ux, uy) || 1, cs = best.d > 1e-6 ? (ux*(best.px - x) + uy*(best.py - y))/(ul*best.d) : 1;
    const why = [];
    if (best.d > 2 && cs < 0.6) why.push('not ahead');
    if (Math.abs(best.e2 - e) > 1.2) why.push('level ' + (best.e2 - e).toFixed(1));
    if (!compatible(L.c, L2.c)) why.push('classes ' + L.c + '/' + L2.c);
    if (!!(L.flags & 2) !== !!(L2.flags & 2) && Math.max(e, best.e2) > 2) why.push('bridge / ground');
    if (why.length){ if (best.d <= GAP && !why.includes('not ahead')) flg('R1', x, y, {li, to:best.l2, d:+best.d.toFixed(1), why:why.join(', ')}); continue; }
    // join point (quantised); a vertex of the target within 0.3 m is used as is
    const h = G[best.l2]; let X = Math.round(best.px*4), Y = Math.round(best.py*4), ins = true;
    for (const jj of [best.j, best.j + 1]) if (Math.hypot(qx(h, jj) - X/4, qy(h, jj) - Y/4) <= 0.3){ X = h.Q[jj*2]; Y = h.Q[jj*2+1]; ins = false; }
    if (ins){ let A = insertions.get(best.l2); if (!A) insertions.set(best.l2, A = []); A.push({k:best.j, u:best.u, X, Y, e:best.e2}); }
    anchors.add(qkey(X, Y)); anchors.add(qkey(g.Q[k*2], g.Q[k*2+1]));
    const mode = best.d <= 1.0 ? 'move' : 'extend';
    endMoves.push({li, end, X, Y, e:best.e2, mode});
    chg(D.chunkOf && Math.abs(best.d) <= 1 && isSeam(x, y) ? 'R2' : 'R1', li, x, y, {to:best.l2, toName:(L2.name && L2.name[0]) || L2.ref || '', d:+best.d.toFixed(2), dE:+(best.e2 - e).toFixed(2), mode, cTo:L2.c});
  }
  // apply: insertions (descending per line), then the end moves
  for (const [l2, A] of insertions){
    const h = G[l2]; A.sort((p, q) => q.k - p.k || q.u - p.u);
    for (const p of A){ h.Q.splice((p.k + 1)*2, 0, p.X, p.Y); if (h.E) h.E.splice(p.k + 1, 0, p.e); }
    h.dirty = true;
  }
  for (const M of endMoves){
    const g = G[M.li], m = nv(g), k = M.end ? m - 1 : 0;
    if (M.mode === 'move'){ g.Q[k*2] = M.X; g.Q[k*2+1] = M.Y; if (g.E) g.E[k] = M.e; }
    else if (M.end){ g.Q.push(M.X, M.Y); if (g.E) g.E.push(M.e); }
    else { g.Q.unshift(M.X, M.Y); if (g.E) g.E.unshift(M.e); }
    if (!g.E && Math.abs(M.e) > 0.05){ g.E = new Array(nv(g)).fill(0); g.E[M.end ? nv(g) - 1 : 0] = M.e; }
    g.dirty = true;
  }
  log('R1/R2: dead ends', nDead, 'joined', endMoves.length, 'inserted vertices', [...insertions.values()].reduce((s, a) => s + a.length, 0), 'flagged', FLAG.filter(f => f.rule === 'R1').length);
  buildIdx();
}
function isSeam(x, y){ const fx = ((x + HALF) % 8000 + 8000) % 8000, fy = ((y + HALF) % 8000 + 8000) % 8000; return Math.min(fx, 8000 - fx) < 0.6 || Math.min(fy, 8000 - fy) < 0.6; }
// ================================================================ R3 level steps at shared vertices
if (RULES.has('R3')){
  const at = new Map();                            // Q key -> [{li, k, end}]
  for (let li = 0; li < G.length; li++){ if (!drv(li)) continue; const g = G[li], m = nv(g);
    for (let k = 0; k < m; k++){ const key = qkey(Math.round(g.Q[k*2]/2), Math.round(g.Q[k*2+1]/2)); let a = at.get(key); if (!a) at.set(key, a = []); a.push({li, k, end:k === 0 ? 0 : k === m - 1 ? 1 : -1}); } }
  let nStep = 0, nFix = 0;
  for (const [key, A] of at){
    if (A.length < 2 || !A.some(o => o.end >= 0)) continue;
    let emin = Infinity, emax = -Infinity; for (const o of A){ const e = eAt(G[o.li], o.k); emin = Math.min(emin, e); emax = Math.max(emax, e); }
    if (emax - emin <= 1.2) continue; nStep++;
    // the anchor level: a line passing through, else a bridge-tagged line, else the most important class; ties: higher
    const score = o => (o.end < 0 ? 100 : 0) + ((lines[o.li].flags & 2) ? 50 : 0) + (20 - lines[o.li].c) + eAt(G[o.li], o.k)*0.01;
    const anc = A.reduce((b, o) => score(o) > score(b) ? o : b, A[0]), eA = eAt(G[anc.li], anc.k);
    const x = qx(G[anc.li], anc.k), y = qy(G[anc.li], anc.k);
    for (const o of A){
      if (o === anc || o.end < 0) continue; const g = G[o.li], e0 = eAt(g, o.k), dE = eA - e0; if (Math.abs(dE) <= 1.2) continue;
      if (Math.abs(dE) > 15){ flg('R3', x, y, {li:o.li, dE:+dE.toFixed(1), why:'step > 15 m'}); continue; }
      if (lines[o.li].flags & 2){ flg('R3', x, y, {li:o.li, dE:+dE.toFixed(1), why:'both bridge decks (profiles kept)'}); continue; }
      const s = arcS(g), Lt = s[s.length - 1]; let Lr = Math.abs(dE)/0.055; if (Lr > Lt) Lr = Lt;
      if (Math.abs(dE)/Lr > 0.12){ flg('R3', x, y, {li:o.li, dE:+dE.toFixed(1), len:+Lt.toFixed(0), why:'line too short for a 12 % ramp'}); continue; }
      const En = new Array(nv(g)); for (let k = 0; k < nv(g); k++){ const d = o.end ? Lt - s[k] : s[k]; const f = d < Lr ? 1 - d/Lr : 0; const v = eAt(g, k) + dE*f*f*(3 - 2*f)/1; En[k] = v < 0 ? 0 : v; }
      En[o.k] = eA;
      const anchorKey = anc.li + ':' + Math.round(x) + ':' + Math.round(y);
      if (!keepsContacts(o.li, En, k2 => k2.split(':')[1] + ':' + k2.split(':')[2] === Math.round(x) + ':' + Math.round(y))){ flg('R3', x, y, {li:o.li, dE:+dE.toFixed(1), why:'easing would change another junction'}); continue; }
      setE(o.li, En, 'R3', x, y, {dE:+dE.toFixed(2), ramp:+Lr.toFixed(0), to:anc.li}); nFix++;
    }
  }
  log('R3: step vertices', nStep, 'eased lines', nFix, 'flagged', FLAG.filter(f => f.rule === 'R3').length);
}
// ================================================================ R4 clearance over at-grade roads (bridge-tagged upper line)
if (RULES.has('R4')){
  let nC = 0, nFix = 0;
  for (let li = 0; li < G.length; li++){
    if (!drv(li) || !(lines[li].flags & 2)) continue;
    const C = contacts(li).filter(c => drv(c.li2) && !(lines[c.li2].flags & 2) && c.e2 < 1.2 && c.e - c.e2 < 4.2 && c.u > 0.001 && c.u < 0.999 && !isVertexContact(li, c));
    if (!C.length) continue;
    const g = G[li], s = arcS(g), Lt = s[s.length - 1], E0 = eAt(g, 0), E1 = eAt(g, nv(g) - 1);
    const req = C.map(c => { const sr = s[c.k] + (s[c.k+1] - s[c.k])*c.u, h = c.e2 + 5.0; return {s:sr, h, x:c.x, y:c.y, g:Math.max(0.055, (h - E0)/Math.max(0.5, sr), (h - E1)/Math.max(0.5, Lt - sr)), key:c.li2 + ':' + Math.round(c.x) + ':' + Math.round(c.y)}; });
    nC += req.length;
    if (req.some(r => r.g > 0.10)){ for (const r of req) flg('R4', r.x, r.y, {li, why:'bridge too short to clear the road below with <= 10 % ramps'}); continue; }
    // a vertex at each crossing, then the raised profile: max(own, h - g |s - s_r|); the line's end heights stay
    const Q2 = g.Q.slice(), E2 = g.E ? g.E.slice() : new Array(nv(g)).fill(0), S2 = Array.from(s);
    for (const r of req.slice().sort((p, q) => q.s - p.s)){
      let k = 0; while (k < S2.length - 2 && S2[k+1] < r.s) k++;
      if (Math.abs(S2[k] - r.s) < 0.5 || Math.abs(S2[k+1] - r.s) < 0.5) continue;
      const f = (r.s - S2[k])/(S2[k+1] - S2[k]);
      Q2.splice((k + 1)*2, 0, Math.round(Q2[k*2] + (Q2[k*2+2] - Q2[k*2])*f), Math.round(Q2[k*2+1] + (Q2[k*2+3] - Q2[k*2+1])*f));
      E2.splice(k + 1, 0, E2[k] + (E2[k+1] - E2[k])*f); S2.splice(k + 1, 0, r.s);
    }
    const was = Math.max(...E2);
    for (let k = 1; k < S2.length - 1; k++) for (const r of req){ const v = r.h - r.g*Math.abs(S2[k] - r.s); if (v > E2[k]) E2[k] = v; }
    if (!keepsContacts(li, E2, null, k => req.some(r => r.key === k), Q2)){ for (const r of req) flg('R4', r.x, r.y, {li, why:'raising would change another junction'}); continue; }
    g.Q = Q2; setE(li, E2, 'R4', req[0].x, req[0].y, {crossings:req.length, maxE:+Math.max(...E2).toFixed(1), was:+was.toFixed(1), grade:+Math.max(...req.map(r => r.g)).toFixed(3)}); nFix++;
  }
  log('R4: low crossings', nC, 'raised bridges', nFix, 'flagged', FLAG.filter(f => f.rule === 'R4').length);
}
function isVertexContact(li, c){ const g = G[li]; const k = c.u < 0.5 ? c.k : c.k + 1; return Math.hypot(qx(g, k) - c.x, qy(g, k) - c.y) < 0.3; }
// ================================================================ R5 steep jumps inside a line
if (RULES.has('R5')){
  let nS = 0, nFix = 0;
  for (let li = 0; li < G.length; li++){
    if (!drv(li)) continue; const g = G[li]; if (!g.E) continue; const m = nv(g), s = arcS(g);
    let steep = false; for (let k = 0; k + 1 < m; k++){ const d = s[k+1] - s[k], de = Math.abs(g.E[k+1] - g.E[k]); if (de > 1.0 && de > 0.12*d){ steep = true; break; } }
    if (!steep) continue; nS++;
    const gr = 0.08, up = g.E.slice(), dn = g.E.slice();
    // fixed vertices: the two ends and every vertex shared with another line (junction heights stay)
    const fixed = new Uint8Array(m); fixed[0] = fixed[m-1] = 1;
    for (const c of contacts(li)) if (Math.abs(c.e - c.e2) <= 1.2){ const k = c.u < 0.5 ? c.k : c.k + 1; if (Math.hypot(qx(g, k) - c.x, qy(g, k) - c.y) < 0.3) fixed[k] = 1; }
    for (let k = 1; k < m; k++) up[k] = Math.max(up[k], up[k-1] - gr*(s[k] - s[k-1]));
    for (let k = m - 2; k >= 0; k--) up[k] = Math.max(up[k], up[k+1] - gr*(s[k+1] - s[k]));
    for (let k = 1; k < m; k++) dn[k] = Math.min(dn[k], dn[k-1] + gr*(s[k] - s[k-1]));
    for (let k = m - 2; k >= 0; k--) dn[k] = Math.min(dn[k], dn[k+1] + gr*(s[k+1] - s[k]));
    const En = g.E.map((v, k) => fixed[k] ? v : Math.max(0, (up[k] + dn[k])/2));
    let still = false; for (let k = 0; k + 1 < m; k++){ const d = s[k+1] - s[k], de = Math.abs(En[k+1] - En[k]); if (de > 1.0 && de > 0.12*d){ still = true; break; } }
    const kx = Math.floor(m/2), x = qx(g, kx), y = qy(g, kx);
    if (still){ flg('R5', x, y, {li, why:'jump next to a fixed junction / line end'}); continue; }
    if (!keepsContacts(li, En)){ flg('R5', x, y, {li, why:'re-grading would change a junction or clearance'}); continue; }
    let mx = 0; for (let k = 0; k < m; k++) mx = Math.max(mx, Math.abs(En[k] - g.E[k]));
    setE(li, En, 'R5', x, y, {maxChange:+mx.toFixed(2)}); nFix++;
  }
  log('R5: steep lines', nS, 're-graded', nFix, 'flagged', FLAG.filter(f => f.rule === 'R5').length);
}
// ================================================================ write
fs.mkdirSync(OUTD, {recursive:true});
let nDirty = 0;
for (let i = 0; i < G.length; i++){
  const g = G[i], r = REC[i]; if (!g.dirty) continue; nDirty++;
  r.Q = Int32Array.from(g.Q);
  let mx = 0; if (g.E) for (const v of g.E) mx = Math.max(mx, v);
  if (g.E && mx > 0.05){ const sc = mx > 51 ? 2.5 : 5; r.f = (r.f | 4) & ~32 | (sc === 2.5 ? 32 : 0); r.E = Uint8Array.from(g.E, v => Math.min(255, Math.max(0, Math.round(v*sc)))); }
  else { r.f &= ~(4 | 32); r.E = null; }
}
for (const F of files){
  const raw = lib.encodeRaw(F.recs), z = require('zlib').gzipSync(raw, {level:9});
  fs.writeFileSync(path.join(OUTD, F.name), F.name.endsWith('.txt') ? z.toString('base64') : z);
}
// the other data files of the city are linked unchanged (so the stage is a complete data folder; symlinks, to save disk)
for (const f of fs.readdirSync(D.D)){ const src = path.join(D.D, f); if (fs.statSync(src).isDirectory()) continue; if (files.some(F => F.name === f)) continue; const dst = path.join(OUTD, f); if (!fs.existsSync(dst)) fs.symlinkSync(src, dst); }
const byRule = {}; for (const c of CH) byRule[c.rule] = (byRule[c.rule] || 0) + 1;
const flagBy = {}; for (const f of FLAG) flagBy[f.rule + (f.why ? ': ' + f.why.replace(/[-0-9.]+/g, '#') : '')] = (flagBy[f.rule + (f.why ? ': ' + f.why.replace(/[-0-9.]+/g, '#') : '')] || 0) + 1;
const rep = {city, src:D.D, out:OUTD, lines:lines.length, changedLines:nDirty, changes:byRule, flagged:flagBy, rules:[...RULES], gap:GAP};
fs.writeFileSync(opt('log') || path.join(__dirname, 'out', city + '_repair.json'), JSON.stringify({summary:rep, changes:CH, flags:FLAG}));
log(JSON.stringify(rep));
