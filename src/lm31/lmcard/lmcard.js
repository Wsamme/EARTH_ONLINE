// ===== City Brush v35 · lm31/lmcard — 地标介绍卡 Landmark info cards (Singapore, SF Bay Area, New York; one module) =====
// "给所有landmark 增加点击交互的介绍卡": click / tap any landmark and an intro card opens.
// - What opens a card: a landmark model (ray against the placed landmark groups: bounding spheres first, then the meshes of the few
//   candidates, nearest hit; the terrain in front of it hides it), a landmark map label (.lbl.n.lm), a site label (NUS, NTU, Changi …)
//   and a site-building label (the NUS buildings). The labels stay pointer-events:none: a click is matched against the labels' own
//   screen boxes (placeLabels() already keeps _sx/_sy/ww/hh), so a camera drag that starts on a label still orbits.
// - Click vs drag: in the orbit tool a press that moves < 6 px (touch 12 px) and lasts < 650 ms is a click; drags orbit as before.
//   In the painting tools (the default 'R' brush, roads, terrain) a press that lands on a landmark / label is held back from the
//   brush; if it turns into a drag it is handed back to the brush (the press is replayed at its start point), if it stays a click
//   the card opens (so clicking a landmark never paints a dab on it). The 'landmark' placing tool is left alone.
// - The card: name (zh / en), kind, year, architect, height, floors, description, up to 3 facts, "part of" for secondary pieces,
//   飞近看 Fly closer (a smooth camera move framing the model), 导航到这里 Navigate here (SGNav.setDest, guarded), ✕ / Esc / a click on
//   empty ground closes it. Side card (right) on desktop, bottom sheet (drag the handle down to close) on screens <= 760 px.
// - Data: window.LM_INFO (see lm31/BRIEF.md): {k, y, a, h, fl, d, x, p}; keys = landmark keys, 'site:<key>', 'site:<key>:<en label>'.
//   A key resolves through p (parent) links; a key with no entry tries the longest placed labelled landmark key that is a prefix of it
//   (nytudor_b -> nytudor, nybrooklynbridge_m3 -> nybrooklynbridge), then a long common prefix (baybridgesf -> baybridgesas), then for
//   secondary pieces (label:false) the nearest labelled landmark within 400 m; with nothing found, a minimal card (name, kind from
//   cat, model height) — never an empty one.
// - Hover (mouse only): the cursor turns into a pointer and a soft ring lights the footprint (+ the label glows); label boxes are tested
//   at most every 40 ms, the model ray only after the mouse rests 110 ms. The open card's landmark keeps a steady ring.
// - Modes: no cards while driving / flying (body.f1on / flyon), in the creature mode (SGKaiju.on) or with the big map open; an open
//   card closes when one of them starts. Choice: no "i" button in the drive HUD — the drive view hides the map labels, the HUD owns
//   the screen edges and the touch controls, and a tap on a building while steering would be an accident; Navigate here already
//   covers "take me there", and the card is one tap away again after leaving the car.
// - Language: window.SGLang (lm31/i18n) when present (mode 'zh' | 'en' | 'both', on(fn) re-renders an open card); without it both.
//   The card renders each mode itself and carries data-i18n-off (lm31/i18n's opt-out) and translate="no".
// - Cost: nothing per frame. Work happens only on pointer / key events (and a 1 s mode check while a card is open).
// API: window.SGCard = {open(key | {x, y}), close(), isOpen, key, pick(clientX, clientY) -> {key, kind, via} | null, resolve(key),
//   info(key), stats(), _t:{…}}
{
const SGC = {open:false, T:null, R:null, picks:0, pickMs:0, pickMax:0, hovers:0, hoverMs:0, opens:0, langHooked:false, items:null, iSrc:null, iN:-1,
  down:null, held:null, replay:false, ptrs:new Set(), hot:null, hoverT:0, hoverTimer:0, lastLbl:0, cursorWas:null, modeTimer:0, built:false};
const SGC_INFO = () => (typeof window !== 'undefined' && window.LM_INFO) || {};
const sgcEsc = t => String(t == null ? '' : t).replace(/[&<>"]/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[ch]));

/* ---------- language ---------- */
function sgcMode(){ try { const L = window.SGLang; if (L && (L.mode === 'zh' || L.mode === 'en')) return L.mode; } catch (e){ } return 'both'; }
// a {zh, en} pair (or a plain string) as HTML for the current mode; both: "zh<span class=en>en</span>" (sep = the separator)
function sgcT(v, sep){
  if (v == null) return ''; if (typeof v !== 'object') return sgcEsc(v);
  const zh = v.zh || v.en || '', en = v.en || v.zh || '', m = sgcMode();
  if (m === 'zh') return sgcEsc(zh); if (m === 'en') return sgcEsc(en);
  return zh === en ? sgcEsc(zh) : `${sgcEsc(zh)}${sep === undefined ? ' ' : sep}<span class="en">${sgcEsc(en)}</span>`;
}
const sgcW = (zh, en) => sgcT({zh, en});
function sgcHookLang(){
  if (SGC.langHooked) return; try { const L = window.SGLang; if (L && typeof L.on === 'function'){ L.on(() => { if (SGC.open) sgcRender(); }); SGC.langHooked = true; } } catch (e){ }
}

/* ---------- what is clickable: the labels ---------- */
// label items (placeLabels keeps their screen box) mapped to targets; rebuilt when syncLabels() replaces labelItems
function sgcItems(){
  if (typeof labelItems === 'undefined') return [];
  if (SGC.items && SGC.iSrc === labelItems && SGC.iN === labelItems.length) return SGC.items;
  const key = (x, y) => x + ',' + y, lmXY = new Map(), siteXY = new Map(), subXY = new Map(), list = [], byL = new Map();
  if (typeof landmarks !== 'undefined') for (const L of landmarks){ const d = LANDMARKS[L.type]; if (d && d.label !== false) lmXY.set(key(L.x, L.y), L); }
  if (typeof sgSites !== 'undefined') for (const S of sgSites){ siteXY.set(key(S.x, S.y), S); if (S.labels) for (const b of S.labels) subXY.set(key(b.x, b.y), {S, b}); }
  for (const it of labelItems){
    const c = it.el && it.el.className || ''; let t = null;
    if (c.includes(' lm')){ const L = lmXY.get(key(it.x, it.y)); if (L) t = {kind:'lm', L}; else { const S = siteXY.get(key(it.x, it.y)); if (S) t = {kind:'site', S}; } }
    else if (c.includes(' poi') && subXY.size){ const s = subXY.get(key(it.x, it.y)); if (s) t = {kind:'sub', S:s.S, b:s.b}; }
    if (!t) continue; list.push({it, t}); if (t.kind === 'lm') byL.set(t.L.id, it);
  }
  SGC.items = list; SGC.byL = byL; SGC.iSrc = labelItems; SGC.iN = labelItems.length; return list;
}
function sgcLabelHit(cx, cy){
  if (typeof labelsEl !== 'undefined' && labelsEl && labelsEl.style.display === 'none') return null;
  const r = canvas.getBoundingClientRect(), px = cx - r.left, py = cy - r.top; let best = null, bd = 1e9;
  for (const o of sgcItems()){ const it = o.it; if (it.vis !== 1 || it._sx === undefined) continue;
    const hw = (it.ww || 90)/2 + 3, hh = (it.hh || 30)/2 + 3, dx = Math.abs(px - it._sx), dy = Math.abs(py - it._sy);
    if (dx > hw || dy > hh) continue; const d = dx*dx + dy*dy; if (d < bd){ bd = d; best = o; } }
  return best ? Object.assign({via:'label', it:best.it}, best.t) : null;
}

/* ---------- what is clickable: the models ---------- */
const SGC_RC = new THREE.Raycaster(), SGC_V2 = new THREE.Vector2(), SGC_SPH = new WeakMap(), SGC_S = new THREE.Sphere(), SGC_M = new THREE.Matrix4(), SGC_M2 = new THREE.Matrix4();
function sgcUnion(A, B){
  const d = A.center.distanceTo(B.center); if (d + B.radius <= A.radius) return; if (d + A.radius <= B.radius || d < 1e-6){ A.center.copy(B.center); A.radius = Math.max(A.radius, B.radius); return; }
  const R = (d + A.radius + B.radius)/2; A.center.lerp(B.center, (R - A.radius)/d); A.radius = R;
}
function sgcSphere(g, L){
  let s = SGC_SPH.get(g); if (s) return s;
  s = new THREE.Sphere(); let first = true; const add = S => { if (first){ s.copy(S); first = false; } else sgcUnion(s, S); };
  g.updateMatrixWorld(true);
  g.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return; const ge = o.geometry; if (!ge.boundingSphere) ge.computeBoundingSphere();
    if (o.isInstancedMesh){ const n = o.count, st = Math.max(1, Math.floor(n/1500)); for (let i = 0; i < n; i += st){ o.getMatrixAt(i, SGC_M); SGC_M2.multiplyMatrices(o.matrixWorld, SGC_M); add(SGC_S.copy(ge.boundingSphere).applyMatrix4(SGC_M2)); } }
    else add(SGC_S.copy(ge.boundingSphere).applyMatrix4(o.matrixWorld)); });
  const d = LANDMARKS[L.type];
  if (first){ s.center.set(L.x, (L.top || 0) + (d ? d.h/2 : 20), -L.y); s.radius = d ? Math.hypot(d.r, d.h/2) : 60; }
  s.radius *= 1.04; SGC_SPH.set(g, s); return s;
}
function sgcRayEnter(ray, s){
  const ox = s.center.x - ray.origin.x, oy = s.center.y - ray.origin.y, oz = s.center.z - ray.origin.z, d = ray.direction;
  const tca = ox*d.x + oy*d.y + oz*d.z, d2 = ox*ox + oy*oy + oz*oz - tca*tca, r2 = s.radius*s.radius; if (d2 > r2) return -1;
  const thc = Math.sqrt(r2 - d2); if (tca + thc < 0) return -1; return Math.max(0, tca - thc);
}
function sgcModelHit(cx, cy){
  if (typeof landmarks === 'undefined' || typeof lmMeshes === 'undefined' || !landmarks.length) return null;
  if (typeof lmGroup !== 'undefined' && !lmGroup.visible) return null;
  const r = canvas.getBoundingClientRect(); SGC_V2.set((cx - r.left)/r.width*2 - 1, -(cy - r.top)/r.height*2 + 1);
  SGC_RC.setFromCamera(SGC_V2, camera); SGC_RC.near = 0; SGC_RC.far = camera.far;
  const cand = [];
  for (const L of landmarks){ const g = lmMeshes.get(L.id); if (!g || !g.visible || !LANDMARKS[L.type]) continue; const t = sgcRayEnter(SGC_RC.ray, sgcSphere(g, L)); if (t >= 0) cand.push([t, L, g]); }
  if (!cand.length) return null;
  cand.sort((a, b) => a[0] - b[0]);
  let best = null, n = 0; const hits = [];
  for (const [t, L, g] of cand){
    if (best && t > best.d) break; if (++n > 14) break;
    hits.length = 0; g.traverseVisible(o => { if (o.isMesh && o.geometry && o.geometry.attributes.position && o.geometry.attributes.position.array) { try { o.raycast(SGC_RC, hits); } catch (e){ } } });
    for (const h of hits) if (!best || h.distance < best.d) best = {d:h.distance, L, p:h.point};
  }
  if (!best) return null;
  // the ground in front of it (hills, the far side of the island) hides it
  try { if (typeof hit === 'function'){ const q = hit({clientX:cx, clientY:cy}); if (q){ const gy = Math.max(0, hAt(q[0], q[1])), dx = q[0] - camera.position.x, dy = gy - camera.position.y, dz = -q[1] - camera.position.z;
    if (Math.sqrt(dx*dx + dy*dy + dz*dz) + 4 < best.d) return null; } } } catch (e){ }
  return {kind:'lm', L:best.L, via:'model', d:best.d};
}
function sgcPick(cx, cy, models){
  const t0 = performance.now(); let h = sgcLabelHit(cx, cy);
  if (!h && models !== false) h = sgcModelHit(cx, cy);
  const ms = performance.now() - t0; SGC.picks++; SGC.pickMs = ms; SGC.pickMax = Math.max(SGC.pickMax, ms); return h;
}

/* ---------- targets, keys, resolution ---------- */
function sgcTarget(h){
  if (!h) return null;
  if (h.kind === 'lm'){ const L = h.L, d = LANDMARKS[L.type] || {}; return {kind:'lm', key:L.type, L, name:{zh:d.zh, en:d.en}, x:L.x, y:L.y, base:L.top || 0, h:d.h || 30, r:d.r || 40, cat:d.cat, label:d.label !== false}; }
  if (h.kind === 'site'){ const S = h.S, D = (typeof SITES !== 'undefined' && SITES[S.key]) || {}; return {kind:'site', key:'site:' + S.key, S, name:{zh:S.zh, en:S.en}, x:S.x, y:S.y, base:(S.top || 60) - (D.h || 60), h:D.h || 60, r:D.r || 700, label:true}; }
  if (h.kind === 'sub'){ const S = h.S, b = h.b; return {kind:'sub', key:'site:' + S.key + ':' + (b.en || b.zh), S, b, name:{zh:b.zh || b.en, en:b.en || b.zh}, x:b.x, y:b.y, base:Math.max(0, (b.abs || 20) - 30), h:30, r:70, label:true}; }
  return null;
}
// a key -> a target on the map (a placed landmark, a site, a site-building label) or null
function sgcByKey(key){
  if (!key) return null; key = String(key);
  // v37: far-terrain places outside the map square (Tokyo: Mount Fuji, the lakes, Hakone ...) from window.SGFar
  if (key.startsWith('far:')){ try { return window.SGFar && SGFar.cardTarget ? SGFar.cardTarget(key) : null; } catch (e){ return null; } }
  if (key.startsWith('site:')){
    const p = key.slice(5), i = p.indexOf(':'), sk = i < 0 ? p : p.slice(0, i), lab = i < 0 ? null : p.slice(i + 1);
    const S = typeof sgSites !== 'undefined' ? sgSites.find(s => s.key === sk) : null; if (!S) return null;
    if (!lab) return sgcTarget({kind:'site', S});
    const b = (S.labels || []).find(q => q.en === lab || q.zh === lab); return b ? sgcTarget({kind:'sub', S, b}) : null;
  }
  if (typeof landmarks === 'undefined') return null;
  const L = landmarks.find(q => q.type === key); return L ? sgcTarget({kind:'lm', L}) : null;
}
// the parent landmark of a key with no entry: longest labelled placed key that is a prefix, a long common prefix, the nearest
function sgcGuessParent(T){
  if (T.kind !== 'lm' || typeof landmarks === 'undefined') return null;
  const k = T.key, I = SGC_INFO(); let best = null, bs = -1;
  for (const L of landmarks){ const d = LANDMARKS[L.type]; if (!d || d.label === false || L.type === k) continue;
    const q = L.type; if (q.length >= 4 && k.startsWith(q)){ const s = q.length*10 + (I[q] ? 5 : 0); if (s > bs){ bs = s; best = L; } } }
  if (best) return best;
  // a shared stem of 7+ characters (baybridgesf / baybridgesas), nearest of those
  let bd = 1e18;
  for (const L of landmarks){ const d = LANDMARKS[L.type]; if (!d || d.label === false || L.type === k) continue;
    let n = 0; const q = L.type; while (n < q.length && n < k.length && q[n] === k[n]) n++;
    if (n >= 7 && n >= Math.min(q.length, k.length) - 4){ const dd = (L.x - T.x)**2 + (L.y - T.y)**2; if (dd < bd){ bd = dd; best = L; } } }
  if (best && bd < 3000*3000) return best;
  if (T.label) return null;
  bd = 400*400; best = null;
  for (const L of landmarks){ const d = LANDMARKS[L.type]; if (!d || d.label === false || L.type === k) continue; const dd = (L.x - T.x)**2 + (L.y - T.y)**2; if (dd < bd){ bd = dd; best = L; } }
  return best;
}
// T (what was clicked) -> R = {T:clicked, D:target shown (the parent for a piece), e:LM_INFO entry | null, piece:bool, how}
function sgcResolve(T){
  const I = SGC_INFO(); let D = T, e = I[T.key], how = e ? 'entry' : 'none', hops = 0;
  while (e && e.p && hops++ < 6){ const P = sgcByKey(e.p); const pe = I[e.p];
    if (P){ D = P; e = pe || null; how = 'p'; } else if (pe){ e = pe; how = 'p-unplaced'; } else { e = null; how = 'p-missing'; break; } }
  if (!e && T.kind === 'lm' && D === T && !T.label){ const L = sgcGuessParent(T); if (L){ const P = sgcTarget({kind:'lm', L}); let pe = I[P.key], h2 = 0; let PD = P;
      while (pe && pe.p && h2++ < 6){ const Q = sgcByKey(pe.p); if (Q) PD = Q; pe = I[pe.p] || null; }
      D = PD; e = pe || null; how = 'guess'; } }
  return {T, D, e: e && !e.p ? e : null, piece:D !== T, how};
}

/* ---------- the card ---------- */
const SGC_CSS = `
.sgc{position:fixed;right:16px;top:calc(16px + env(safe-area-inset-top,0px));width:328px;max-height:calc(100% - 132px - env(safe-area-inset-top,0px));z-index:7;display:flex;flex-direction:column;
  background:var(--panel,#f8f7f3);color:var(--ink,#1b1e1c);border:1px solid var(--rule,#d8d5cb);border-radius:12px;box-shadow:0 14px 40px rgba(27,30,28,.22);font-family:var(--font-ui,system-ui,sans-serif);
  transform:translateX(12px);opacity:0;transition:transform .18s ease,opacity .18s ease;box-sizing:border-box;overflow:hidden}
.sgc.on{transform:none;opacity:1}
.sgc[hidden]{display:none!important}
.sgc .sgc-sc{overflow:auto;padding:14px 16px 14px;overscroll-behavior:contain}
.sgc .sgc-grab{display:none}
.sgc .sgc-x{position:absolute;right:8px;top:8px;width:30px;height:30px;border:0;border-radius:8px;background:transparent;cursor:pointer;font-size:15px;line-height:30px;color:var(--muted,#686b65)}
.sgc .sgc-x:hover{background:var(--panel-2,#efede6);color:var(--ink,#1b1e1c)}
.sgc .sgc-kind{font:600 10.5px/1.4 var(--font-mono,monospace);letter-spacing:.06em;text-transform:uppercase;color:var(--accent,#244d43);padding-right:30px}
.sgc .sgc-kind .en{margin-left:.35em;opacity:.75}
.sgc h2{margin:4px 30px 0 0;font-size:20px;line-height:1.25;font-weight:700;letter-spacing:.02em;overflow-wrap:anywhere}
.sgc .sgc-en{font:500 12px/1.35 var(--font-ui,system-ui);color:var(--muted,#686b65);margin-top:2px;overflow-wrap:anywhere}
.sgc .sgc-piece{margin-top:6px;font-size:11.5px;color:var(--muted,#686b65)}
.sgc .sgc-piece b{font-weight:600;color:var(--ink,#1b1e1c)}
.sgc .sgc-piece .en{margin-left:.3em}
.sgc dl{display:grid;grid-template-columns:auto 1fr;gap:5px 12px;margin:12px 0 0;font-size:12px;padding:10px 0 0;border-top:1px solid var(--rule,#d8d5cb)}
.sgc dt{color:var(--muted,#686b65);white-space:nowrap}
.sgc dt .en{font:400 9.5px var(--font-mono,monospace);margin-left:4px}
.sgc dd{margin:0;font-weight:500;overflow-wrap:anywhere}
.sgc dd .en{display:block;font-size:11px;font-weight:400;color:var(--muted,#686b65)}
.sgc dd.num{font:500 12.5px var(--font-mono,monospace);font-variant-numeric:tabular-nums}
.sgc .sgc-d{margin:12px 0 0;font-size:13px;line-height:1.62}
.sgc .sgc-d.en2{margin-top:6px;font-size:12px;line-height:1.55;color:#4c504a}
.sgc ul{margin:10px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px}
.sgc li{font-size:12px;line-height:1.45;padding-left:14px;position:relative}
.sgc li::before{content:'';position:absolute;left:3px;top:.6em;width:5px;height:5px;border-radius:50%;background:var(--accent,#244d43);opacity:.7}
.sgc li .en{display:block;color:var(--muted,#686b65);font-size:11px}
.sgc .sgc-none{margin:12px 0 0;font-size:12px;color:var(--muted,#686b65)}
.sgc .sgc-up{border:0;background:none;padding:0;font:inherit;color:var(--accent,#244d43);text-decoration:underline;cursor:pointer}
.sgc .sgc-btns{display:flex;gap:8px;padding:10px 16px 14px;border-top:1px solid var(--rule,#d8d5cb);background:var(--panel,#f8f7f3)}
.sgc .sgc-btns button{flex:1;min-height:36px;border:1px solid var(--rule,#d8d5cb);background:var(--panel,#f8f7f3);border-radius:8px;padding:6px 8px;font-size:12.5px;font-weight:600;cursor:pointer;line-height:1.2}
.sgc .sgc-btns button .en{display:block;font:500 9.5px var(--font-mono,monospace);color:var(--muted,#686b65);letter-spacing:.03em}
.sgc .sgc-btns button.go{background:var(--accent,#244d43);color:var(--accent-ink,#f8f7f3);border-color:var(--accent,#244d43)}
.sgc .sgc-btns button.go .en{color:rgba(248,247,243,.78)}
.sgc .sgc-btns button:hover{filter:brightness(.97)}
.sgc .sgc-btns button[disabled]{opacity:.45;cursor:default}
html.lang-zh .sgc .en,html.lang-en .sgc .en{margin-left:0}
.lbl.sgc-hot{text-shadow:0 0 3px var(--halo),0 0 8px rgba(255,196,96,.95),0 0 16px rgba(255,196,96,.7);background:rgba(255,214,140,.38);border-radius:6px;box-shadow:0 0 0 2px rgba(255,190,90,.55)}
.lbl.sgc-sel{text-decoration:underline;text-decoration-color:rgba(255,170,60,.9);text-underline-offset:3px}
@media (max-width:1330px) and (min-width:761px){.sgc{top:calc(124px + env(safe-area-inset-top,0px));max-height:calc(100% - 124px - 96px - env(safe-area-inset-top,0px))}}
@media (max-width:760px){
  .sgc{left:0;right:0;top:auto;bottom:0;width:auto;max-height:62vh;border-radius:16px 16px 0 0;border-bottom:0;transform:translateY(24px);padding-bottom:env(safe-area-inset-bottom,0px)}
  .sgc.on{transform:none}
  .sgc .sgc-grab{display:block;flex:none;height:22px;cursor:grab;touch-action:none;position:relative}
  .sgc .sgc-grab::after{content:'';position:absolute;left:50%;top:8px;width:40px;height:4px;margin-left:-20px;border-radius:2px;background:var(--rule,#d8d5cb)}
  .sgc .sgc-x{top:14px}
  .sgc .sgc-sc{padding-top:2px}
  .sgc h2{font-size:18px}
  .sgc.peek{max-height:calc(176px + env(safe-area-inset-bottom,0px))}
  .sgc.peek .sgc-sc{overflow:hidden;cursor:pointer}
}
@media (prefers-reduced-motion:reduce){.sgc{transition:none}}
`;
function sgcBuild(){
  if (SGC.built) return; SGC.built = true;
  const st = document.createElement('style'); st.textContent = SGC_CSS; document.head.appendChild(st);
  const el = document.createElement('section'); el.className = 'sgc'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'false');
  el.setAttribute('aria-labelledby', 'sgcName'); el.setAttribute('data-i18n-off', ''); el.setAttribute('translate', 'no');
  el.innerHTML = '<div class="sgc-grab" aria-hidden="true"></div><button class="sgc-x" type="button">✕</button><div class="sgc-sc"></div><div class="sgc-btns"><button type="button" data-a="fly"></button><button type="button" class="go" data-a="nav"></button></div>';
  document.body.appendChild(el); SGC.el = el;
  el.querySelector('.sgc-x').addEventListener('click', () => sgcClose());
  el.querySelector('.sgc-sc').addEventListener('click', () => { if (el.classList.contains('peek')) el.classList.remove('peek'); });
  el.addEventListener('click', e => { const b = e.target.closest('button[data-a]'); if (!b || b.disabled) return; const a = b.dataset.a;
    if (a === 'fly') sgcFly(); else if (a === 'nav') sgcNav(); else if (a === 'up'){ const T = sgcByKey(b.dataset.k); if (T) sgcShow(T, 'up'); } });
  // keep camera keys (WASD …) from reaching the map while a card button has focus? no: only Esc is ours
  // bottom sheet: drag the handle down to close
  const g = el.querySelector('.sgc-grab'); let gy = null, gid = null;
  g.addEventListener('pointerdown', e => { gy = e.clientY; gid = e.pointerId; try { g.setPointerCapture(e.pointerId); } catch (_){ } });
  g.addEventListener('pointermove', e => { if (gy === null || e.pointerId !== gid) return; const dy = Math.max(0, e.clientY - gy); el.style.transform = dy ? `translateY(${dy}px)` : ''; });
  const gu = e => { if (gy === null || e.pointerId !== gid) return; const dy = e.clientY - gy; gy = null; el.style.transform = ''; if (dy > 70) sgcClose(); else if (dy < 4 && e.type === 'pointerup') el.classList.toggle('peek'); };
  g.addEventListener('pointerup', gu); g.addEventListener('pointercancel', gu);
}
function sgcSheet(){ try { return !!(window.matchMedia && matchMedia('(max-width:760px)').matches); } catch (e){ return false; } }
function sgcFmtH(h){ return h >= 100 ? Math.round(h) + ' m' : (Math.round(h*10)/10) + ' m'; }
function sgcKind(R){
  const e = R.e, D = R.D; if (e && e.k) return e.k;
  if (D.kind === 'site'){ const k = D.S.key; return k.startsWith('changi') ? {zh:'机场', en:'Airport'} : k === 'gardens' ? {zh:'公园', en:'Gardens'} : k === 'uss' ? {zh:'主题乐园', en:'Theme park'} : /nus|ntu|smu|sutd|poly|campus|univ/i.test(k) ? {zh:'大学校园', en:'University campus'} : {zh:'园区', en:'Site'}; }
  if (D.kind === 'sub') return {zh:'校园建筑', en:'Campus building'};
  return D.cat === 'new' ? {zh:'现代地标', en:'Modern landmark'} : D.cat === 'old' ? {zh:'历史地标', en:'Historic landmark'} : {zh:'地标', en:'Landmark'};
}
function sgcRender(){
  const R = SGC.R, el = SGC.el; if (!R || !el) return;
  const m = sgcMode(), e = R.e, D = R.D, T = R.T, nm = (e && e.n) || D.name, rows = [];
  const zhN = nm.zh || nm.en || '', enN = nm.en || nm.zh || '';
  const head = m === 'en' ? sgcEsc(enN) : sgcEsc(zhN), sub = m === 'both' && enN !== zhN ? `<div class="sgc-en">${sgcEsc(enN)}</div>` : '';
  const dt = (zh, en) => `<dt>${m === 'en' ? sgcEsc(en) : sgcEsc(zh)}${m === 'both' ? `<span class="en">${sgcEsc(en)}</span>` : ''}</dt>`;
  if (e && e.y) rows.push(dt('建成', 'Built') + `<dd class="num">${sgcEsc(e.y)}</dd>`);
  if (e && e.a) rows.push(dt('设计', 'Architect') + `<dd>${sgcT(e.a, '')}</dd>`);
  const hh = e && e.h ? e.h : (!e && D.kind === 'lm' && D.h ? D.h : 0);
  if (hh) rows.push(dt('高度', 'Height') + `<dd class="num">${e && e.h ? '' : '≈ '}${sgcFmtH(hh)}</dd>`);
  if (e && e.fl) rows.push(dt('楼层', 'Floors') + `<dd class="num">${sgcEsc(e.fl)}${m === 'zh' ? ' 层' : ''}</dd>`);
  let body = '';
  if (e && e.d){ const d = e.d;
    if (typeof d !== 'object') body += `<p class="sgc-d">${sgcEsc(d)}</p>`;
    else if (m === 'zh') body += `<p class="sgc-d">${sgcEsc(d.zh || d.en)}</p>`;
    else if (m === 'en') body += `<p class="sgc-d">${sgcEsc(d.en || d.zh)}</p>`;
    else { body += `<p class="sgc-d">${sgcEsc(d.zh || d.en)}</p>`; if (d.en && d.zh) body += `<p class="sgc-d en2" lang="en">${sgcEsc(d.en)}</p>`; } }
  if (e && Array.isArray(e.x) && e.x.length) body += '<ul>' + e.x.slice(0, 3).map(f => `<li>${sgcT(f, '')}</li>`).join('') + '</ul>';
  if (!e || !e.d) body += `<p class="sgc-none">${sgcW('暂无详细介绍', 'No description yet')}</p>`;
  // a piece of a bigger landmark, or a building of a campus
  let piece = '';
  if (R.piece){ const pn = T.name || {}; piece = `<div class="sgc-piece">${sgcW('你点的是', 'You picked')}: <b>${m === 'en' ? sgcEsc(pn.en || pn.zh) : sgcEsc(pn.zh || pn.en)}</b>${m === 'both' && pn.en && pn.en !== pn.zh ? `<span class="en">${sgcEsc(pn.en)}</span>` : ''}</div>`; }
  else if (D.kind === 'sub'){ const S = D.S; piece = `<div class="sgc-piece">${sgcW('属于', 'Part of')}: <button type="button" class="sgc-up" data-a="up" data-k="site:${sgcEsc(S.key)}">${m === 'en' ? sgcEsc(S.en) : sgcEsc(S.zh)}${m === 'both' && S.en ? ' · ' + sgcEsc(S.en) : ''}</button></div>`; }
  el.querySelector('.sgc-sc').innerHTML = `<div class="sgc-kind">${sgcT(sgcKind(R))}</div><h2 id="sgcName">${head}</h2>${sub}${piece}${rows.length ? `<dl>${rows.join('')}</dl>` : ''}${body}`;
  const bl = (zh, en) => m === 'zh' ? sgcEsc(zh) : m === 'en' ? sgcEsc(en) : `${sgcEsc(zh)}<span class="en">${sgcEsc(en)}</span>`;
  const bf = el.querySelector('[data-a="fly"]'), bn = el.querySelector('[data-a="nav"]');
  bf.innerHTML = bl('飞近看', 'Fly closer'); bn.innerHTML = bl('导航到这里', 'Navigate here');
  bn.disabled = !(window.SGNav && typeof SGNav.setDest === 'function');
  el.querySelector('.sgc-x').setAttribute('aria-label', m === 'en' ? 'Close' : m === 'zh' ? '关闭' : '关闭 Close');
  el.setAttribute('lang', m === 'en' ? 'en' : 'zh');
}
function sgcBlocked(){
  try { const b = document.body.classList; if (b.contains('f1on') || b.contains('flyon')) return true; } catch (e){ }
  try { if (window.SGKaiju && SGKaiju.on) return true; } catch (e){ }
  try { if (window.SGNav && SGNav.isOpen) return true; } catch (e){ }
  return false;
}
function sgcShow(T, via){
  if (!T) return false; sgcBuild(); sgcHookLang();
  const R = sgcResolve(T); SGC.T = T; SGC.R = R; SGC.via = via || 'api'; SGC.opens++; if (SGC.el) SGC.el.classList.remove('peek');
  sgcRender(); const el = SGC.el; el.style.transform = '';
  if (el.hidden){ el.hidden = false; void el.offsetWidth; } el.classList.add('on'); SGC.open = true;
  sgcRing('sel', R.D); sgcSelLabel(R.D);
  if (!SGC.modeTimer) SGC.modeTimer = setInterval(() => { if (!SGC.open){ clearInterval(SGC.modeTimer); SGC.modeTimer = 0; return; } if (sgcBlocked()) sgcClose(); }, 1000);
  return true;
}
function sgcClose(){
  if (!SGC.open) return false; SGC.open = false; const el = SGC.el;
  el.classList.remove('on'); el.style.transform = ''; setTimeout(() => { if (!SGC.open) el.hidden = true; }, 200);
  sgcRing('sel', null); sgcSelLabel(null); if (SGC.modeTimer){ clearInterval(SGC.modeTimer); SGC.modeTimer = 0; }
  return true;
}
function sgcSelLabel(D){
  if (SGC.selEl){ SGC.selEl.classList.remove('sgc-sel'); SGC.selEl = null; }
  const it = D ? sgcLabelOf(D) : null; if (it && it.el){ it.el.classList.add('sgc-sel'); SGC.selEl = it.el; }
}
function sgcLabelOf(D){
  const list = sgcItems();
  if (D.kind === 'lm') return SGC.byL && SGC.byL.get(D.L.id) || null;
  for (const o of list){ if (D.kind === 'site' && o.t.kind === 'site' && o.t.S === D.S) return o.it; if (D.kind === 'sub' && o.t.kind === 'sub' && o.t.b === D.b) return o.it; }
  return null;
}

/* ---------- rings: hover and selection (one mesh each, made on first use; no per-frame work) ---------- */
function sgcRing(which, D){
  const k = which === 'hot' ? 'ringHot' : 'ringSel';
  if (!D){ if (SGC[k]) SGC[k].visible = false; return; }
  if (!SGC[k]){ const geo = new THREE.RingGeometry(which === 'hot' ? 0.955 : 0.94, 1, 128); geo.rotateX(-Math.PI/2);
    // a solid ring where it is in view + a faint see-through copy where buildings hide it
    const col = which === 'hot' ? 0xffc560 : 0xff9a3c, grp = new THREE.Group();
    const m1 = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color:col, transparent:true, opacity:which === 'hot' ? 0.75 : 0.9, depthTest:true, polygonOffset:true, polygonOffsetFactor:-4, polygonOffsetUnits:-8, depthWrite:false, side:THREE.DoubleSide, fog:false}));
    const m2 = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color:col, transparent:true, opacity:0.28, depthTest:false, depthWrite:false, side:THREE.DoubleSide, fog:false}));
    m1.renderOrder = 6; m2.renderOrder = 5; for (const m of [m1, m2]){ m.frustumCulled = false; grp.add(m); }
    grp.visible = false; grp.name = 'sgcard-' + which; scene.add(grp); SGC[k] = grp; }
  let r = D.r || 40, y = D.base || 0;
  if (D.kind === 'lm'){ const g = typeof lmMeshes !== 'undefined' && lmMeshes.get(D.L.id); if (g){ const s = sgcSphere(g, D.L); r = Math.max(12, Math.min(r*1.12, s.radius)); } else r *= 1.12; y = (D.L.top || 0) + 1; }
  else if (D.kind === 'sub'){ r = 45; y = (typeof hC === 'function' ? Math.max(0, hC(D.x, D.y)) : 0) + 1; }
  else { y = (typeof hC === 'function' ? Math.max(0, hC(D.x, D.y)) : 0) + 2; }
  const ms = SGC[k]; ms.position.set(D.x, y, -D.y); ms.scale.setScalar(Math.max(8, r)); ms.visible = true;
}

/* ---------- actions ---------- */
function sgcFly(){
  const R = SGC.R; if (!R || typeof flyTo !== 'function') return false;
  const D = R.D; let cx = D.x, cy = D.y, base = D.base || 0, h = D.h || 30, rad = D.r || 40;
  if (D.kind === 'lm'){ const g = typeof lmMeshes !== 'undefined' && lmMeshes.get(D.L.id); if (g){ const s = sgcSphere(g, D.L); cx = s.center.x; cy = -s.center.z; rad = Math.min(s.radius, Math.max(D.r || 40, h)*1.4); } base = D.L.top || 0; }
  else if (D.kind === 'sub'){ base = typeof hC === 'function' ? Math.max(0, hC(cx, cy)) : 0; h = 30; rad = 60; }
  else if (D.kind === 'site'){ base = typeof hC === 'function' ? Math.max(0, hC(cx, cy)) : 0; h = 40; }
  const tt = new THREE.Vector3(cx, base + h*0.38, -cy), size = Math.max(rad, h*0.75);
  const dist = Math.max(90, Math.min(D.kind === 'site' ? 3600 : 2600, size*2.5 + 40));
  const off = camera.position.clone().sub(controls.target); let az = Math.atan2(off.x, off.z); if (!isFinite(az)) az = 0.6;
  const el = (D.kind === 'site' ? 40 : h < 60 ? 50 : h < 120 ? 40 : h < 250 ? 30 : 24)*Math.PI/180;   // low buildings: look over the neighbours
  const to = new THREE.Vector3(tt.x + Math.sin(az)*Math.cos(el)*dist, tt.y + Math.sin(el)*dist, tt.z + Math.cos(az)*Math.cos(el)*dist);
  const gy = typeof hAt === 'function' ? Math.max(0, hAt(to.x, -to.z)) + 25 : 25; if (to.y < gy) to.y = gy;
  flyTo(to, tt, 1500); if (SGC.el && sgcSheet()) SGC.el.classList.add('peek');   // phones: the sheet steps down to a peek so the view shows
  SGC.flew = {x:Math.round(tt.x), y:Math.round(-tt.z), dist:Math.round(dist)}; return true;
}
function sgcNav(){
  const R = SGC.R; if (!R) return false; const N = window.SGNav; if (!(N && typeof N.setDest === 'function')) return false;
  const D = R.D, nm = (R.e && R.e.n) || D.name; let ok = false;
  try { ok = N.setDest(D.x, D.y, {label:[nm.zh || nm.en || '', nm.en || nm.zh || ''], kind:'landmark', r:Math.min(150, Math.max(25, (D.r || 40)*0.8))}); } catch (e){ console.error('[lmcard] setDest', e); }
  if (ok !== false){ const m = sgcMode(), t = m === 'zh' ? '已设为目的地 · 开车出发吧' : m === 'en' ? 'Destination set — start driving' : '已设为目的地 Destination set · 开车出发 start driving';
    try { if (typeof showToast === 'function') showToast(t); } catch (e){ } }
  SGC.navd = ok !== false; return ok !== false;
}

/* ---------- pointer events: click vs drag, hover ---------- */
function sgcToolOk(){ try { return (typeof effectiveTool === 'function' ? effectiveTool() : 'view') !== 'landmark'; } catch (e){ return true; } }
function sgcIsView(){ try { return (typeof effectiveTool === 'function' ? effectiveTool() : 'view') === 'view'; } catch (e){ return true; } }
function sgcDown(e){
  if (SGC.replay) return;
  if (e.isPrimary) SGC.ptrs.clear(); SGC.ptrs.add(e.pointerId);
  if (SGC.ptrs.size > 1){ SGC.down = null; if (SGC.held) sgcReplay(); return; }
  if (e.target !== canvas || e.button !== 0 || sgcBlocked() || !sgcToolOk()){ SGC.down = null; return; }
  SGC.down = {id:e.pointerId, x:e.clientX, y:e.clientY, t:performance.now(), touch:e.pointerType !== 'mouse', hit:undefined};
  if (!sgcIsView()){
    // a painting tool: a press on a landmark / label is held back from the brush until we know whether it is a click
    const h = sgcPick(e.clientX, e.clientY, true); SGC.down.hit = h;
    if (h){ SGC.held = {id:e.pointerId, init:{bubbles:true, cancelable:true, composed:true, clientX:e.clientX, clientY:e.clientY, screenX:e.screenX, screenY:e.screenY, button:0, buttons:1,
      pointerId:e.pointerId, pointerType:e.pointerType, isPrimary:e.isPrimary, width:e.width, height:e.height, pressure:e.pressure}}; e.stopImmediatePropagation(); }
  }
}
function sgcReplay(){
  const H = SGC.held; SGC.held = null; if (!H) return;
  SGC.replay = true; try { canvas.dispatchEvent(new PointerEvent('pointerdown', H.init)); } catch (err){ } SGC.replay = false;
}
function sgcMove(e){
  const D = SGC.down;
  if (D && e.pointerId === D.id){ const lim = D.touch ? 12 : 6; if (Math.abs(e.clientX - D.x) > lim || Math.abs(e.clientY - D.y) > lim){ SGC.down = null; if (SGC.held) sgcReplay(); } }
  if (e.pointerType === 'mouse' && !e.buttons) sgcHoverQ(e);
}
function sgcUp(e){
  SGC.ptrs.delete(e.pointerId); const D = SGC.down;
  if (!D || e.pointerId !== D.id){ return; }
  SGC.down = null; const held = SGC.held; SGC.held = null;
  if (e.type === 'pointercancel') return;
  if (performance.now() - D.t > (D.touch ? 550 : 650)) { if (held){ SGC.replay = true; try { canvas.dispatchEvent(new PointerEvent('pointerdown', held.init)); } catch (_){ } SGC.replay = false; } return; }
  if (sgcBlocked()) return;
  const h = D.hit !== undefined ? D.hit : sgcPick(D.x, D.y, true);
  if (h){ sgcShow(sgcTarget(h), h.via); if (held) e.stopImmediatePropagation(); }
  else if (SGC.open) sgcClose();
}
// hover: label boxes at most every 40 ms; the model ray once the mouse rests 110 ms
function sgcHoverQ(e){
  if (sgcBlocked() || !sgcToolOk() || e.target !== canvas){ sgcHot(null); return; }
  const now = performance.now(), x = e.clientX, y = e.clientY; SGC.hx = x; SGC.hy = y;
  if (now - SGC.lastLbl > 40){ SGC.lastLbl = now; const h = sgcLabelHit(x, y); if (h){ clearTimeout(SGC.hoverTimer); SGC.hoverTimer = 0; sgcHot(h); return; } if (SGC.hot && SGC.hot.via === 'label') sgcHot(null); }
  clearTimeout(SGC.hoverTimer);
  SGC.hoverTimer = setTimeout(() => { SGC.hoverTimer = 0; if (sgcBlocked()) return; const t0 = performance.now(); const h = sgcLabelHit(SGC.hx, SGC.hy) || sgcModelHit(SGC.hx, SGC.hy);
    SGC.hovers++; SGC.hoverMs = performance.now() - t0; sgcHot(h); }, 110);
}
function sgcHot(h){
  if (!h && !SGC.hot) return;
  const old = SGC.hot, same = old && h && old.kind === h.kind && (h.kind === 'lm' ? old.L === h.L : h.kind === 'site' ? old.S === h.S : old.b === h.b);
  if (same){ SGC.hot = h; return; }
  if (SGC.hotEl){ SGC.hotEl.classList.remove('sgc-hot'); SGC.hotEl = null; }
  SGC.hot = h || null;
  if (!h){ sgcRing('hot', null); if (canvas.style.cursor === 'pointer'){ canvas.style.cursor = SGC.cursorWas || ''; } SGC.cursorWas = null; return; }
  const T = sgcTarget(h); sgcRing('hot', T);
  const it = h.it || sgcLabelOf(T); if (it && it.el){ it.el.classList.add('sgc-hot'); SGC.hotEl = it.el; }
  if (canvas.style.cursor !== 'pointer'){ SGC.cursorWas = canvas.style.cursor; canvas.style.cursor = 'pointer'; }
}
function sgcKey(e){
  if (e.key !== 'Escape' || !SGC.open) return;
  const a = document.activeElement; if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') && !(SGC.el && SGC.el.contains(a))) return;
  sgcClose(); e.stopPropagation(); e.preventDefault();
}
function sgcBoot(){
  sgcBuild();
  window.addEventListener('pointerdown', sgcDown, true);
  window.addEventListener('pointermove', sgcMove, {capture:true, passive:true});
  window.addEventListener('pointerup', sgcUp, true);
  window.addEventListener('pointercancel', sgcUp, true);
  window.addEventListener('keydown', sgcKey, true);
  canvas.addEventListener('pointerleave', () => { clearTimeout(SGC.hoverTimer); SGC.hoverTimer = 0; sgcHot(null); });
  // a vehicle / creature mode starting closes the card (body class changes are rare: night, f1on, flyon …)
  try { new MutationObserver(() => { if ((SGC.open || SGC.hot) && sgcBlocked()){ sgcClose(); sgcHot(null); } }).observe(document.body, {attributes:true, attributeFilter:['class']}); } catch (e){ }
}
if (typeof HOOKS !== 'undefined' && HOOKS.boot) HOOKS.boot.push(sgcBoot); else setTimeout(sgcBoot, 0);

window.SGCard = {
  open(k){ if (k && typeof k === 'object' && isFinite(k.x) && isFinite(k.y)){ let best = null, bd = 1e18; if (typeof landmarks !== 'undefined') for (const L of landmarks){ const d = LANDMARKS[L.type]; if (!d || d.label === false) continue; const dd = (L.x - k.x)**2 + (L.y - k.y)**2; if (dd < bd){ bd = dd; best = L; } }
      return best && bd < 600*600 ? sgcShow(sgcTarget({kind:'lm', L:best}), 'api') : false; }
    return sgcShow(sgcByKey(k), 'api'); },
  close:() => sgcClose(),
  get isOpen(){ return SGC.open; },
  get key(){ return SGC.open && SGC.R ? SGC.R.D.key : null; },
  pick(cx, cy){ const h = sgcPick(cx, cy, true); const T = sgcTarget(h); return T ? {key:T.key, kind:T.kind, via:h.via} : null; },
  resolve(k){ const T = sgcByKey(k); if (!T) return null; const R = sgcResolve(T); return {key:T.key, shown:R.D.key, how:R.how, piece:R.piece, entry:!!R.e}; },
  info(k){ return SGC_INFO()[k] || null; },
  fly:() => sgcFly(), nav:() => sgcNav(),
  state(){ const el = SGC.el; return {open:SGC.open, key:SGC.R ? SGC.R.D.key : null, clicked:SGC.T ? SGC.T.key : null, how:SGC.R ? SGC.R.how : null, via:SGC.via || null, mode:sgcMode(),
    sheet:sgcSheet(), peek:!!(el && el.classList.contains('peek')), title:el && SGC.open ? (el.querySelector('h2') || {}).textContent : null, flew:SGC.flew || null, navd:!!SGC.navd,
    hot:SGC.hot ? sgcTarget(SGC.hot).key : null, ringHot:!!(SGC.ringHot && SGC.ringHot.visible), ringSel:!!(SGC.ringSel && SGC.ringSel.visible), cursor:canvas.style.cursor}; },
  stats(){ return {picks:SGC.picks, pickMs:+SGC.pickMs.toFixed(2), pickMaxMs:+SGC.pickMax.toFixed(2), hovers:SGC.hovers, hoverMs:+SGC.hoverMs.toFixed(2), opens:SGC.opens, items:SGC.items ? SGC.items.length : 0,
    landmarks:typeof landmarks !== 'undefined' ? landmarks.length : 0, entries:Object.keys(SGC_INFO()).length}; },
  // coverage of the loaded LM_INFO for the placed landmarks / sites of this page
  coverage(){ const I = SGC_INFO(), out = {lm:0, entry:0, viaP:0, guess:0, minimal:[], sites:0, siteEntry:0, subs:0, subEntry:0};
    if (typeof landmarks !== 'undefined') for (const L of landmarks){ const T = sgcTarget({kind:'lm', L}); const R = sgcResolve(T); out.lm++; if (R.e && !R.piece) out.entry++; else if (R.e && R.how === 'p') out.viaP++; else if (R.e) out.guess++; else out.minimal.push(L.type); }
    if (typeof sgSites !== 'undefined') for (const S of sgSites){ out.sites++; if (I['site:' + S.key]) out.siteEntry++; for (const b of S.labels || []){ out.subs++; if (I['site:' + S.key + ':' + (b.en || b.zh)]) out.subEntry++; } }
    out.minimalN = out.minimal.length; out.minimal = out.minimal.slice(0, 40); return out; },
  _t:{SGC, sgcPick, sgcResolve, sgcByKey, sgcItems, sgcLabelHit, sgcModelHit,
    tool:id => { if (id && typeof setTool === 'function') setTool(id); return typeof effectiveTool === 'function' ? effectiveTool() : null; },
    mesh:id => typeof lmMeshes !== 'undefined' ? lmMeshes.get(id) : null,
    undoN:() => typeof undoStack !== 'undefined' ? undoStack.length : -1, sites:() => typeof sgSites !== 'undefined' ? sgSites : []}
};
}
