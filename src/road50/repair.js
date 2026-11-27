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
let LASTWHY = '', LASTKEY = '';
const sameSet = C => { const s = new Set(); for (const c of C) if (Math.abs(c.e - c.e2) <= 1.2) s.add(c.li2 + ':' + Math.round(c.x) + ':' + Math.round(c.y)); return s; };
const lowSet = C => { const s = new Set(); for (const c of C) { const d = Math.abs(c.e - c.e2); if (d > 1.2 && d < 4.2 && lines[c.li2].c <= 10) s.add(c.li2 + ':' + Math.round(c.x) + ':' + Math.round(c.y)); } return s; };
// a new E profile for line li keeps every same-level contact and creates none (except those in 'allow' / dropping those in 'drop')
function keepsContacts(li, Enew, allowNew, allowLost, Qnew){
  const before = contacts(li), after = contacts(li, Enew, Qnew), A = sameSet(before), B = sameSet(after);
  const cl = k => lines[+k.split(':')[0]].c + ((lines[+k.split(':')[0]].flags & 2) ? 'b' : '');
  for (const k of A) if (!B.has(k) && !(allowLost && allowLost(k))){ LASTWHY = 'loses junction (c' + cl(k) + ')'; LASTKEY = k; return false; }
  for (const k of B) if (!A.has(k) && !(allowNew && allowNew(k))){ LASTWHY = 'makes a new junction (c' + cl(k) + ')'; LASTKEY = k; return false; }
  // no new low-clearance crossing either
  const L0 = lowSet(before), L1 = lowSet(after); for (const k of L1) if (!L0.has(k)){ LASTWHY = 'low clearance over c' + cl(k); LASTKEY = k; return false; }
  return true;
}
function setE(li, Enew, rule, x, y, o){
  const g = G[li]; g.E = Enew; g.dirty = true; chg(rule, li, x, y, o);
}
log(city, 'lines', lines.length);
const qkey = (X, Y) => X + ',' + Y;
buildIdx();
// ================================================================ R3 junction level continuity (ramp heights)
// Contacts where the data joins two drivable lines (a shared vertex, or a line end within 0.6 m of another line) at different
// heights (1.2 < |dE| <= 15 m) are not junctions for the roads module or traffic. H = the higher line there, Lo = the lower one.
//   - H is not bridge-tagged (its height is a pipeline ramp lift towards a deck) or H ends there (a deck end meeting a road):
//     H is pinned down to Lo's level at the contact: E_H(s) = min(E_H(s), e_Lo + g |s - s0|)  (a ramp of grade g away from it)
//   - H is a bridge deck passing through and Lo ends there (a slip road joining the deck): Lo is raised at its end:
//     E_Lo(s) = max(E_Lo(s), e_H - g d)
//   - else (a deck sharing a node mid-span with a road passing through): flagged.
// g = 5.5 % (the pipelines' ramp grade), raised to 8 % / 12 % if the ramp would otherwise change another junction of the line;
// every change keeps all other same-level contacts of the line and creates no low-clearance crossing, or it is flagged.
let VAT = null;
function levelConflicts(){
  const out = [], at = new Map(); VAT = at;
  for (let li = 0; li < G.length; li++){ if (!drv(li)) continue; const g = G[li], m = nv(g);
    for (let k = 0; k < m; k++){ const key = qkey(Math.round(g.Q[k*2]/2), Math.round(g.Q[k*2+1]/2)); let a = at.get(key); if (!a) at.set(key, a = []); a.push({li, k, end:(k === 0 || k === m - 1)}); } }
  const seen = new Set();
  for (const [key, A] of at){ if (A.length < 2) continue;
    for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++){ const p = A[i], q = A[j]; if (p.li === q.li) continue;
      const ep = eAt(G[p.li], p.k), eq = eAt(G[q.li], q.k), d = Math.abs(ep - eq); if (d <= 1.2 || d > 40) continue;
      const H = ep > eq ? p : q, Lo = ep > eq ? q : p, gH = G[H.li];
      const sk = H.li + ':' + Lo.li + ':' + key; if (seen.has(sk)) continue; seen.add(sk);
      out.push({H:H.li, Lo:Lo.li, sH:null, kH:H.k, kLo:Lo.k, endH:H.end, endLo:Lo.end, eH:Math.max(ep, eq), eL:Math.min(ep, eq), x:qx(gH, H.k), y:qy(gH, H.k)}); } }
  // line ends within 0.6 m of another line's segment (not at its vertices)
  for (let li = 0; li < G.length; li++){ if (!drv(li)) continue; const g = G[li], m = nv(g);
    for (const k of [0, m - 1]){ const x = qx(g, k), y = qy(g, k), e = eAt(g, k);
      for (const l2 of linesNear(x - 1, y - 1, x + 1, y + 1)){ if (l2 === li || !drv(l2)) continue; const h = G[l2], m2 = nv(h);
        for (let j = 0; j + 1 < m2; j++){ const ax = qx(h, j), ay = qy(h, j), ex = qx(h, j+1) - ax, ey = qy(h, j+1) - ay, L2 = ex*ex + ey*ey; if (L2 < 1e-6) continue;
          const u = ((x - ax)*ex + (y - ay)*ey)/L2; if (u <= 0.0 || u >= 1.0) continue; if (Math.hypot(ax + ex*u - x, ay + ey*u - y) > 0.6) continue;
          if (Math.hypot(ex, ey)*Math.min(u, 1 - u) < 0.3) continue;                 // at its vertex: done above
          const e2 = eAt(h, j) + (eAt(h, j+1) - eAt(h, j))*u, d = Math.abs(e - e2); if (d <= 1.2 || d > 40) continue;
          if (e > e2) out.push({H:li, Lo:l2, kH:k, endH:true, endLo:false, segLo:[j, u], eH:e, eL:e2, x, y});
          else out.push({H:l2, Lo:li, segH:[j, u], endH:false, kLo:k, endLo:true, eH:e2, eL:e, x, y});
        } } } }
  return out;
}
// a height cone from (li, s0, v0) with grade gr, propagated into the lines joined at the same level (shared vertices) wherever it changes
// a height: 'pin' lowers (min), 'raise' lifts (max). Returns Map li -> new E array, or null if it spreads over more than 120 lines.
function cone(li0, s00, v0, mode, gr, shifted){
  const res = new Map(), q = [[li0, s00, v0]], visits = new Map();
  while (q.length){
    const [li, sb, vb] = q.shift(); const n = (visits.get(li) || 0) + 1; visits.set(li, n); if (n > 4) continue;
    if (res.size > 120) return null;
    const g = G[li], s = arcS(g), E0 = g.E || new Array(nv(g)).fill(0), E = res.get(li) || E0.slice();
    for (let k = 0; k < nv(g); k++){
      const c = Math.max(0, vb + gr*Math.abs(s[k] - sb));
      if (mode === 'pin' ? c < E[k] - 0.01 : c > E[k] + 0.01){
        const was = E0[k]; E[k] = c;
        // lines joined here at the old level follow
        const A = VAT.get(qkey(Math.round(g.Q[k*2]/2), Math.round(g.Q[k*2+1]/2))) || [];
        for (const o of A){ if (o.li === li || shifted.has(o.li)) continue; const go = G[o.li]; if (o.k >= nv(go)) continue;
          const eo = (res.get(o.li) || go.E || [])[o.k] || 0; if (Math.abs(eo - was) <= 1.2 && (mode === 'pin' ? c < eo - 0.01 : c > eo + 0.01)) q.push([o.li, arcS(go)[o.k], c]); }
      }
    }
    res.set(li, E);
  }
  return res;
}
// a set of new E profiles keeps every same-level contact of every changed line (except 'allow') and makes no new one / low crossing
function keepsAll(CHG, allow, li0, Q0){
  const before = new Map(); for (const li of CHG.keys()) before.set(li, contacts(li));
  const save = new Map(); for (const [li, E] of CHG){ save.set(li, {Q:G[li].Q, E:G[li].E}); G[li].E = E; if (li === li0 && Q0) G[li].Q = Q0; }
  let ok = true;
  try {
    for (const li of CHG.keys()){
      const A = sameSet(before.get(li)), C1 = contacts(li), B = sameSet(C1), cl = k => lines[+k.split(':')[0]].c + ((lines[+k.split(':')[0]].flags & 2) ? 'b' : '');
      for (const k of A) if (!B.has(k) && !allow(k)){ LASTWHY = 'loses junction (c' + cl(k) + ')'; LASTKEY = k; ok = false; break; }
      if (!ok) break;
      for (const k of B) if (!A.has(k) && !allow(k)){ LASTWHY = 'makes a new junction (c' + cl(k) + ')'; LASTKEY = k; ok = false; break; }
      if (!ok) break;
      const L0 = lowSet(before.get(li)), L1 = lowSet(C1); for (const k of L1) if (!L0.has(k)){ LASTWHY = 'low clearance over c' + cl(k); LASTKEY = k; ok = false; break; }
      if (!ok) break;
    }
    // traffic joins one-way decks that continue at one vertex with a step <= 15 m: keep those; and lift no dead end into the air
    if (ok && VAT) for (const li of CHG.keys()){ const g = G[li], m = nv(g), Eb = save.get(li).E;
      for (const k of [0, m - 1]){ const key = qkey(Math.round(g.Q[k*2]/2), Math.round(g.Q[k*2+1]/2)), A = (VAT.get(key) || []).filter(o => o.li !== li);
        const ea = eAt(g, k), eb = Eb ? Eb[Math.min(k, Eb.length - 1)] : 0;
        if (!A.length){ if (ea > 1.5 && ea > eb + 0.5){ LASTWHY = 'lifts a dead end'; ok = false; break; } continue; }
        for (const o of A){ const go = G[o.li]; if (o.k >= nv(go)) continue; const e2 = eAt(go, o.k), e2b = CHG.has(o.li) ? ((save.get(o.li).E || [])[o.k] || 0) : e2;
          if (Math.abs(e2b - eb) <= 15 && Math.abs(e2 - ea) > 15){ LASTWHY = 'breaks a deck step join'; ok = false; break; } }
        if (!ok) break; }
      if (!ok) break; }
  } finally { for (const [li, o] of save){ G[li].Q = o.Q; G[li].E = o.E; } }
  return ok;
}
function sOn(g, s, k, seg){ if (seg) return s[seg[0]] + (s[seg[0]+1] - s[seg[0]])*seg[1]; return s[k]; }
if (RULES.has('R3')){
  let nC = 0, nFix = 0;
  for (let pass = 0; pass < 3; pass++){
    const CF = levelConflicts(); if (pass === 0) nC = CF.length; let fixed = 0; const shifted = new Set();
    CF.sort((a, b) => (a.eH - a.eL) - (b.eH - b.eL));
    for (const f of CF){
      if (shifted.has(f.H) || shifted.has(f.Lo)) continue;
      const gH = G[f.H], gL = G[f.Lo];
      // still a conflict? (an earlier fix may have solved it)
      const sH = arcS(gH), sL = arcS(gL), s0H = sOn(gH, sH, f.kH, f.segH), s0L = sOn(gL, sL, f.kLo, f.segLo);
      const eHn = f.segH ? eAt(gH, f.segH[0]) + (eAt(gH, f.segH[0]+1) - eAt(gH, f.segH[0]))*f.segH[1] : eAt(gH, f.kH);
      const eLn = f.segLo ? eAt(gL, f.segLo[0]) + (eAt(gL, f.segLo[0]+1) - eAt(gL, f.segLo[0]))*f.segLo[1] : eAt(gL, f.kLo);
      if (Math.abs(eHn - eLn) <= 1.2) continue;
      const key = f.Lo + ':' + Math.round(f.x) + ':' + Math.round(f.y), keyH = f.H + ':' + Math.round(f.x) + ':' + Math.round(f.y);
      const allow = k => k === key || k === keyH || k.endsWith(':' + Math.round(f.x) + ':' + Math.round(f.y));
      const brH = (lines[f.H].flags & 2) !== 0, brL = (lines[f.Lo].flags & 2) !== 0, dEc = eHn - eLn;
      // modes in order of preference: 'pin' = H down to Lo's level; 'raise' = Lo up to H's level (an approach ramp off a deck)
      const PIN = {mode:'pin', li:f.H, g:gH, s:sH, s0:s0H, tgt:eLn}, RAISE = {mode:'raise', li:f.Lo, g:gL, s:sL, s0:s0L, tgt:eHn};
      let modes;
      if (!brH) modes = [PIN, RAISE];                                     // H's height is a pipeline ramp lift
      else if (brL) modes = f.endH ? [PIN, RAISE] : f.endLo ? [RAISE, PIN] : [];
      else if (dEc > 8) modes = [RAISE, PIN];                             // a high deck: keep the deck, lift the approach
      else modes = f.endH ? [PIN, RAISE] : f.endLo ? [RAISE] : [RAISE];
      if (!modes.length){ if (pass === 0) flg('R3', f.x, f.y, {li:f.H, to:f.Lo, dE:+dEc.toFixed(1), why:'bridge decks share a node mid-span'}); continue; }
      let done = false, mode, li;
      for (const M of modes){ if (done) break; let g, s, s0, tgt; ({mode, li, g, s, s0, tgt} = M);
      for (const gr of [0.055, 0.08, 0.10]){
        // a contact on a segment: put a vertex there so the height is exact
        let Qn = null; const seg = mode === 'pin' ? f.segH : f.segLo, Eg = g.E || new Array(nv(g)).fill(0);
        let sStart = s0;
        if (seg){ const [j, u] = seg; Qn = g.Q.slice(); Qn.splice((j + 1)*2, 0, Math.round(g.Q[j*2] + (g.Q[j*2+2] - g.Q[j*2])*u), Math.round(g.Q[j*2+1] + (g.Q[j*2+3] - g.Q[j*2+1])*u)); }
        const CHG = (() => { if (!Qn) return cone(li, sStart, tgt, mode, gr, shifted);
          const sv = {Q:g.Q, E:g.E}; g.Q = Qn; g.E = Eg.slice(); g.E.splice(seg[0] + 1, 0, Eg[seg[0]] + (Eg[seg[0]+1] - Eg[seg[0]])*seg[1]);
          try { return cone(li, arcS(g)[seg[0] + 1], tgt, mode, gr, new Set([...shifted, li])); } finally { g.Q = sv.Q; g.E = sv.E; } })();
        if (!CHG){ LASTWHY = 'spreads over > 120 lines'; continue; }
        if (!keepsAll(CHG, allow, li, Qn)) continue;
        let mx = 0;
        for (const [l2, En] of CHG){ const g2 = G[l2], E0 = g2.E || new Array(nv(g2)).fill(0); if (l2 === li && Qn){ g2.Q = Qn; shifted.add(li); }
          for (let k = 0; k < Math.min(En.length, E0.length); k++) mx = Math.max(mx, Math.abs(En[k] - E0[k]));
          setE(l2, En, 'R3', f.x, f.y, {mode, dE:+(eHn - eLn).toFixed(2), grade:gr, other:mode === 'pin' ? f.Lo : f.H, bridge:!!(lines[l2].flags & 2), chain:CHG.size}); }
        if (CHG.size > 1) for (const l2 of CHG.keys()) shifted.add(l2);         // their vertex lists are unchanged, but keep the pass simple
        done = true; fixed++; break;
      }
      }
      if (!done && pass === 2) flg('R3', f.x, f.y, {li, to:mode === 'pin' ? f.Lo : f.H, dE:+(eHn - eLn).toFixed(1), mode, why:'10 % ramp ' + LASTWHY, key:LASTKEY});
    }
    nFix += fixed; log('R3 pass', pass, 'conflicts', CF.length, 'fixed', fixed);
  }
  log('R3: conflicts', nC, 'fixed', nFix, 'flagged', FLAG.filter(f => f.rule === 'R3').length);
}
// rebuild the roads module's junction graph and the traffic network on the current geometry
function curLines(){ return G.map((g, i) => ({c:lines[i].c, flags:(lines[i].flags & ~(4 | 32)) | (g.E && g.E.some(v => v > 0.05) ? 4 : 0), name:lines[i].name, ref:lines[i].ref, P:Float32Array.from(g.Q, v => v/4), E:g.E && g.E.some(v => v > 0.05) ? Float32Array.from(g.E) : null})); }
// ================================================================ R1 gap join (+ R2 chunk seams)
const D2 = {SGRoads:D.SGRoads, lines:curLines()}; D2.C = D.SGRoads._dbg.prep(D2.lines);
const N = TG.build(D2, {step:15});
buildIdx();
const anchors = new Set();                         // Q keys of vertices used as join points
const insertions = new Map();                      // li -> [{k, u, X, Y, e}]
const endMoves = [];                               // {li, end, X, Y, e, mode: 'move' | 'extend'}
const compatible = (c1, c2) => { const lo = Math.min(c1, c2), hi = Math.max(c1, c2); if (lo === 0) return hi <= 5; if (lo === 1) return hi <= 9; return true; };
if (RULES.has('R1') || RULES.has('R2')){
  let nDead = 0;
  for (const [nd, Nd] of N.NODE){
    if (Nd.arms !== 1) continue;
    const a = Nd.A[0], li = a.P.li, L = D2.lines[li], g = G[li], m = nv(g), atEnd = a.end ? (a.P.b >= N.J.LEN(li) - 0.01) : (a.P.a <= 0.01);
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
    if (!keepsContacts(li, E2, null, k => req.some(r => r.key === k), Q2)){ for (const r of req) flg('R4', r.x, r.y, {li, why:'raising: ' + LASTWHY}); continue; }
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
    if (!keepsContacts(li, En)){ flg('R5', x, y, {li, why:'re-grading: ' + LASTWHY}); continue; }
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
