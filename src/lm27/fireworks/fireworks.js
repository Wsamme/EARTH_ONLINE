// ===== City Brush v30 · lm27/fireworks — 烟花 Fireworks (Singapore, the Bay Area, New York) =====
// Aerial fireworks for the F1 race nights and for a show on demand. Shells are fired from mortars on barges (or open ground):
// a rising comet with a glittering gold tail (~150-300 m, 3.4-4.6 s up: linear drag on the ascent), then one of nine shells -
// peony (an even sphere, colour change or a pistil), chrysanthemum (stars with trailing sparks), willow (long-burning gold that droops
// and lingers ~6 s), ring (a flat ring turned to the audience, sometimes doubled), palm (thick gold comets curving down like fronds),
// crossette (stars that split into crosses with a pop), strobe (blinking white stars), crackle (gold glitter that ends in crackling
// pops), salute (a white flash and a bang) - many colours, a white-hot core and an additive glow halo on every star, gravity and drag,
// burn-out flicker. Each break lights the night briefly (the sky light (hemi) and the sky colour lifted for a few frames, the smoke
// around it lit in the shell's colour: no extra render pass); stars are reflected in the water (the same particles mirrored on the
// water plane, drawn at the water surface's depth: buildings and land hide them correctly); by day mostly white smoke puffs and dim
// colours; smoke drifts with the wind for ~30 s.
// GPU particles: two instanced pools (sparks: 32768 streak quads, smoke: 4096 billboards) whose motion is computed in the vertex
// shader from the spawn values (position, velocity, drag, spawn time, colours, mode) and one time uniform, like the KFX pools of
// lm25/kaiju: a launch writes the rocket (its comet, tail sparks, the mortar's flash and smoke), the break writes the shell's stars and
// their trailing sparks / splits / pops (spawn times in the future where they start later), so the CPU only writes spawn slots
// (partial uploads) and nothing per particle per frame. Slots are handed out in blocks (short- and long-lived apart; the lowest block
// whose particles have all ended is reused) so the instance count drawn stays near the live count. Three draw calls while a show
// runs (sparks, their reflection at night, smoke), none otherwise; the pools are only created on first use.
// Sound (synthesised on window.SGAudio's AudioContext, group 碰撞与爆炸 Crashes & effects: master volume / mute / group volume apply;
// silent while the sound is off): the mortar's thump, a whistle on some shells, the boom delayed by the distance (343 m/s), muffled
// and quieter far away, with echoes off the towers and the reverb send; crackle for crackle shells, pops for crossettes.
// Triggers: it watches the F1 race itself (window.SGF1: RACE.state 'grid' -> 'race' = lights out, RACE.order progress / finish
// times, TR.L, TR.startI; no f1d change): a salvo when the lights go out, a few shells when the leader starts the final lap, a 45 s
// finale when the leader takes the chequered flag (55 s and in the winner's red, white and gold when that is the player), a salute
// when the player finishes behind. Launch points: net.f1.fw ([[x, y]...], the circuit's own) when present, else the water nearest
// the start line (Singapore: the Marina Bay basin, where the National Day and race-night barges are).
// UI: a 烟花 Fireworks row at the end of the drive pane (.tray-pane[data-cat="f1"]): a ~45 s show where the camera looks (over
// water when there is water near), and stop; a small fireworks button in the time bar after dark does the same.
// Contract: window.SGFireworks {burst(x, y, z, opts), show(opts), stop(hard), on, stats(), launch(x, y, opts), _test}
//   burst: one shell at world (x, y, z) (z = height, m): {kind, size 0.3-2, colors:[css | palette name | [r, g, b]], t:delay s, rocket}
//   show: {x, y, r, seconds, intensity 0-1, points:[[x, y]...], seed, theme} -> {id, points, seconds, shells}
// Integration: EXTRA_MODS=lm27/fireworks/fireworks.js (Singapore, Bay, NYC; after f1d / audio, any order works: all lookups are lazy).
{
//<FWCORE>
// ---- the pure part (no three.js, no DOM): trajectories, the ascent, shells -> particle spawns, show plans, race watching, water
// points. World coordinates: x east, y north, z up (metres); times in seconds of the module's own clock.
const FWC = (() => {
  const G = 9.81, TAU = Math.PI*2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  function rng(seed){ let a = (seed >>> 0) || 0x9e3779b9; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0)/4294967296; }; }
  // firework colours (the chemistry's hues; blue and purple are the weak ones in real shells, kept a little brighter here)
  const PAL = {red:[1, 0.13, 0.08], orange:[1, 0.45, 0.08], gold:[1, 0.66, 0.24], yellow:[1, 0.88, 0.3], lime:[0.62, 1, 0.18], green:[0.18, 1, 0.36],
    cyan:[0.22, 0.92, 1], blue:[0.22, 0.4, 1], purple:[0.7, 0.28, 1], pink:[1, 0.4, 0.75], white:[1, 0.96, 0.9], silver:[0.85, 0.9, 1]};
  const THEMES = {mixed:['red', 'orange', 'gold', 'yellow', 'lime', 'green', 'cyan', 'blue', 'purple', 'pink', 'white', 'silver', 'red', 'green', 'blue', 'gold'],
    race:['red', 'white', 'red', 'white', 'silver'], usa:['red', 'white', 'blue', 'red', 'white', 'silver'], win:['red', 'white', 'gold', 'red', 'white', 'silver'],
    lap:['gold', 'white', 'silver', 'gold'], gold:['gold', 'white', 'gold']};
  const KINDS = ['peony', 'chrysanthemum', 'willow', 'ring', 'palm', 'crossette', 'strobe'];
  const ALIAS = {kamuro:'willow', brocade:'willow', dahlia:'peony', mine:'peony', comet:'palm', glitter:'crackle', crackling:'crackle', bang:'salute', ring2:'ring'};
  const kindOf = k => { k = String(k || 'peony').toLowerCase(); k = ALIAS[k] || k; return KINDS.indexOf(k) >= 0 || k === 'crackle' || k === 'salute' ? k : 'peony'; };
  const nrm = c => { const m = Math.max(c[0], c[1], c[2]); return m > 0.04 ? [c[0]/m, c[1]/m, c[2]/m] : PAL.gold.slice(); };
  // colours: palette names, #rgb / #rrggbb, rgb(...), [r, g, b] (0-1 or 0-255), CSS names through FWC.css (set by the runtime)
  function col(c){
    if (Array.isArray(c) && c.length >= 3){ const s = Math.max(c[0], c[1], c[2]) > 1.5 ? 1/255 : 1; return nrm([c[0]*s, c[1]*s, c[2]*s]); }
    if (typeof c === 'number' && isFinite(c)) return nrm([((c >> 16) & 255)/255, ((c >> 8) & 255)/255, (c & 255)/255]);
    if (typeof c !== 'string') return null;
    const s = c.trim().toLowerCase(); if (PAL[s]) return PAL[s].slice();
    let m = /^#([0-9a-f]{6})$/.exec(s); if (m){ const v = parseInt(m[1], 16); return nrm([((v >> 16) & 255)/255, ((v >> 8) & 255)/255, (v & 255)/255]); }
    m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(s); if (m) return nrm([parseInt(m[1], 16)/15, parseInt(m[2], 16)/15, parseInt(m[3], 16)/15]);
    m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/.exec(s); if (m) return nrm([+m[1]/255, +m[2]/255, +m[3]/255]);
    if (FWC.css){ try { const r = FWC.css(s); if (r) return nrm(r); } catch (e){ /* unknown name */ } }
    return null;
  }
  function cols(list){ const out = []; for (const c of (Array.isArray(list) ? list : [list])){ const v = col(c); if (v) out.push(v); } return out; }
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, a[2] + (b[2] - a[2])*t];
  // ---- motion with linear drag k (1/s) and gravity: x(t) = x0 + vT t + (v0 - vT)(1 - e^-kt)/k, vT = (0, 0, -g/k)
  function posAt(p, v, k, t, out){ const o = out || [0, 0, 0];
    if (k < 1e-4){ o[0] = p[0] + v[0]*t; o[1] = p[1] + v[1]*t; o[2] = p[2] + v[2]*t - 0.5*G*t*t; return o; }
    const e = (1 - Math.exp(-k*t))/k, vt = -G/k; o[0] = p[0] + v[0]*e; o[1] = p[1] + v[1]*e; o[2] = p[2] + vt*t + (v[2] - vt)*e; return o; }
  function velAt(v, k, t, out){ const o = out || [0, 0, 0];
    if (k < 1e-4){ o[0] = v[0]; o[1] = v[1]; o[2] = v[2] - G*t; return o; }
    const x = Math.exp(-k*t), vt = -G/k; o[0] = v[0]*x; o[1] = v[1]*x; o[2] = (v[2] - vt)*x + vt; return o; }
  // the ascent: a shell fired straight up with drag k reaches its apex at T with the muzzle speed v0(T); apexH(T) = height of that apex
  const apexH = (T, k) => -G*T/k + G/(k*k)*(Math.exp(k*T) - 1);
  const rocketV0 = (T, k) => G/k*(Math.exp(k*T) - 1);
  function rocketT(H, k){ let T = Math.sqrt(2*Math.max(1, H)/G); for (let i = 0; i < 40; i++){ const f = apexH(T, k) - H, d = rocketV0(T, k), s = f/Math.max(d, 1e-3); T = clamp(T - s, 0.05, 30); if (Math.abs(s) < 1e-7) break; } return T; }
  const ASC_K = 0.55;
  // evenly spread directions on the sphere (golden-angle spiral, turned and jittered so no two shells look the same)
  function fib(i, n, a0, jit, r, out){ const z = 1 - 2*(i + 0.5)/n, rr = Math.sqrt(Math.max(0, 1 - z*z)), a = a0 + i*2.399963229728653;
    let x = Math.cos(a)*rr + (r() - 0.5)*jit, y = Math.sin(a)*rr + (r() - 0.5)*jit, w = z + (r() - 0.5)*jit; const l = Math.hypot(x, y, w) || 1; out[0] = x/l; out[1] = y/l; out[2] = w/l; return out; }
  const P3 = [0, 0, 0], V3 = [0, 0, 0], D3 = [0, 0, 0], E1 = [0, 0, 0], E2 = [0, 0, 0], W3 = [0, 0, 0];
  const cross = (a, b, o) => { o[0] = a[1]*b[2] - a[2]*b[1]; o[1] = a[2]*b[0] - a[0]*b[2]; o[2] = a[0]*b[1] - a[1]*b[0]; return o; };
  const unit = o => { const l = Math.hypot(o[0], o[1], o[2]) || 1; o[0] /= l; o[1] /= l; o[2] /= l; return o; };
  // particle modes (the shader): 0 star, 1 strobe, 2 glitter / comet (sparkling tail), 3 ember (a tail spark), 4 glow (break flash,
  // sky glow, muzzle flash: no motion), 5 pop (a crackle flash)
  // sink.spark(x, y, z, t0, vx, vy, vz, life, r, g, b, size, r2, g2, b2, tChange, k, trail, mode, seed (+2 = over water))
  // sink.smoke(x, y, z, t0, vx, vy, vz, life, size0, size1, alpha, rise, r, g, b)
  function puffs(sink, B, t0, n, R, o, r, tint){
    const day = o.day || 0, a0 = day > 0.5 ? 0.5 : 0.2, g0 = day > 0.5 ? 0.94 : 0.78, tk = day > 0.5 ? 0.04 : 0.14;
    for (let i = 0; i < n; i++){ fib(i, n, r()*TAU, 0.5, r, D3); const d = R*0.32*Math.sqrt(r()), v = 2 + 5*r(), c = tint ? mixc([g0, g0, g0*1.01], tint, tk) : [g0, g0, g0];
      sink.smoke(B[0] + D3[0]*d, B[1] + D3[1]*d, B[2] + D3[2]*d*0.7, t0 + 0.05 + 0.3*r(), D3[0]*v, D3[1]*v, D3[2]*v*0.6, 24 + 16*r(), 6 + R*0.1, 30 + R*0.55 + 25*r(), a0*(0.7 + 0.6*r()), 0.2 + 0.35*r(), c[0], c[1], c[2]); }
  }
  // the rocket: from L, apex height H above L; o = {tilt:[hx, hy] (horizontal speed / vertical), palm, wet, day}; -> {T (burst time after
  // launch), B (burst point), vB (shell velocity there)}
  function rocket(sink, L, H, t0, o, r){
    o = o || {}; r = r || Math.random;
    const k = ASC_K, T = rocketT(H, k), v0 = rocketV0(T, k), tb = T*(0.93 + 0.05*r()), tl = o.tilt || [0, 0], wet = o.wet ? 2 : 0, palm = !!o.palm;
    const v = [v0*tl[0], v0*tl[1], v0], B = posAt(L, v, k, tb, [0, 0, 0]), vB = velAt(v, k, tb, [0, 0, 0]);
    let n = 0;
    sink.spark(L[0], L[1], L[2], t0, v[0], v[1], v[2], tb, 1.3, 0.95, 0.62, palm ? 1.45 : 0.7, 1.3, 0.95, 0.62, 99, k, palm ? 0.36 : 0.15, 2, r() + wet); n++;
    const ne = palm ? 36 : 14;
    for (let j = 0; j < ne; j++){ const te = tb*(j + r())/ne; posAt(L, v, k, te, P3); velAt(v, k, te, V3);
      sink.spark(P3[0], P3[1], P3[2], t0 + te, V3[0]*0.06 + (r() - 0.5)*3, V3[1]*0.06 + (r() - 0.5)*3, V3[2]*0.06 + (r() - 0.5)*2, palm ? 0.9 + r()*0.8 : 0.4 + r()*0.45,
        1, 0.6, 0.26, palm ? 0.55 : 0.34, 1, 0.6, 0.26, 99, 3, 0.05, 3, r() + wet); n++; }
    sink.spark(L[0], L[1], L[2] + 2, t0, 0, 0, 0, 0.2, 2.4, 1.7, 1.05, 6, 2.4, 1.7, 1.05, 99, 0, 0, 4, r() + wet); n++;      // the mortar's flash
    const day = o.day || 0, ga = day > 0.5 ? 0.42 : 0.2, gc = day > 0.5 ? 0.92 : 0.7;
    for (let j = 0; j < 2; j++) sink.smoke(L[0] + (r() - 0.5)*4, L[1] + (r() - 0.5)*4, L[2] + 3, t0 + 0.05*j, (r() - 0.5)*2, (r() - 0.5)*2, 3 + 2*r(), 14 + 6*r(), 3, 16 + 6*r(), ga, 0.4, gc, gc, gc);
    for (let j = 0; j < 4; j++){ const te = tb*(0.06 + 0.5*(j + r())/4); posAt(L, v, k, te, P3); sink.smoke(P3[0], P3[1], P3[2], t0 + te, 0, 0, 0, 9 + 6*r(), 2.5, 9 + 5*r(), ga*0.7, 0.25, gc, gc, gc); }
    return {T:tb, B, vB, n, v0, apex:T};
  }
  // one shell bursting at B (t0) with the shell's own velocity vB: o = {size, cols:[[r, g, b]...], wet, day, view:[x, y] (towards the
  // audience, horizontal unit)}; -> {kind, n, dur, R, col, loud, split (s after t0), crackle:{t, dur}}
  function shell(kind, sink, B, vB, t0, o, r){
    o = o || {}; r = r || Math.random; kind = kindOf(kind);
    const s = clamp(+o.size || 1, 0.3, 2), R = 92*s, wet = o.wet ? 2 : 0, day = o.day || 0;
    const C = o.cols && o.cols.length ? o.cols : [PAL[['red', 'green', 'blue', 'gold', 'purple', 'white'][Math.floor(r()*6)]]];
    const c1 = C[0], c2 = C[1] || C[0], c3 = C[2] || (C.length > 1 ? C[0] : PAL.white);
    const vb = vB || [0, 0, 0];
    const I = {kind, n:0, dur:0, R, col:c1, loud:1, split:0, crackle:null};
    // a star from B with direction d (unit) and speed v
    const star = (px, py, pz, tt, vx, vy, vz, life, c, size, c2x, tc, k, trail, mode, br) => {
      const bb = br === undefined ? 1 : br, cc = c2x || c;
      sink.spark(px, py, pz, tt, vx, vy, vz, life, c[0]*bb, c[1]*bb, c[2]*bb, size, cc[0]*bb, cc[1]*bb, cc[2]*bb, tc, k, trail, mode, r() + wet); I.n++;
      const e = tt - t0 + life; if (e > I.dur) I.dur = e; };
    const embers = (vx, vy, vz, k, life, n, ec, es, el, ek, mode) => {
      const v = W3; v[0] = vx; v[1] = vy; v[2] = vz;
      for (let j = 0; j < n; j++){ const te = life*(0.08 + 0.86*(j + r())/n); posAt(B, v, k, te, P3); velAt(v, k, te, V3);
        star(P3[0], P3[1], P3[2], t0 + te, V3[0]*0.1 + (r() - 0.5)*2.4, V3[1]*0.1 + (r() - 0.5)*2.4, V3[2]*0.1 + (r() - 0.5)*2, el*(0.7 + 0.6*r()), ec, es, null, 99, ek, 0.05, mode === undefined ? 3 : mode, 0.6); } };
    const glows = (gc, gs) => {
      const w = mixc(gc, PAL.white, 0.6);
      star(B[0], B[1], B[2], t0, 0, 0, 0, 0.15, w, (gs || 6.5)*s, null, 99, 0, 0, 4, 1.5);                  // the break flash
      if (day < 0.85) star(B[0], B[1], B[2], t0, 0, 0, 0, 1.6, gc, R*1.1, null, 99, 0, 0, 4, 0.035); // the lit sky and smoke around it
    };
    const a0 = r()*TAU;
    if (kind === 'peony'){
      const n = Math.round(120*Math.pow(s, 1.25)), k = 1.5, v0 = R*k*0.96, life = 1.6 + 0.5*r(), change = C.length > 1 && r() < 0.5;
      for (let i = 0; i < n; i++){ fib(i, n, a0, 0.07, r, D3); const v = v0*(0.93 + 0.07*r()), alt = !change && C.length > 1 && (i & 1);
        star(B[0], B[1], B[2], t0, D3[0]*v + vb[0], D3[1]*v + vb[1], D3[2]*v + vb[2], life*(0.9 + 0.2*r()), alt ? c2 : c1, 1.25*s, change ? c2 : null, change ? life*0.5 : 99, k, 0.08, 0); }
      if (r() < 0.5){ const m = Math.round(n*0.3); for (let i = 0; i < m; i++){ fib(i, m, a0, 0.1, r, D3); const v = v0*0.42*(0.9 + 0.1*r());
        star(B[0], B[1], B[2], t0, D3[0]*v + vb[0], D3[1]*v + vb[1], D3[2]*v + vb[2], life*0.85, c3, 1.05*s, null, 99, k, 0.06, 0); } }
      glows(c1); puffs(sink, B, t0, Math.round(6 + 5*s), R, o, r, c1);
    } else if (kind === 'chrysanthemum'){
      const n = Math.round(92*Math.pow(s, 1.2)), k = 1.25, v0 = R*k*0.92, life = 2.0 + 0.5*r(), ne = s >= 1 ? 5 : 4, ec = mixc(c1, PAL.gold, 0.45);
      for (let i = 0; i < n; i++){ fib(i, n, a0, 0.08, r, D3); const v = v0*(0.92 + 0.08*r()), vx = D3[0]*v + vb[0], vy = D3[1]*v + vb[1], vz = D3[2]*v + vb[2], li = life*(0.9 + 0.2*r());
        star(B[0], B[1], B[2], t0, vx, vy, vz, li, c1, 1.3*s, C.length > 1 ? c2 : null, C.length > 1 ? li*0.62 : 99, k, 0.45, 0);
        embers(vx, vy, vz, k, li, ne, ec, 0.42*s, 0.75, 2.6); }
      glows(c1); puffs(sink, B, t0, Math.round(7 + 5*s), R, o, r, c1);
    } else if (kind === 'willow'){
      const n = Math.round(78*s), k = 1.05, v0 = R*k*0.78, life = 4.6 + 1.2*r(), wc = mixc(PAL.gold, c1, o.tint ? 0.35 : 0.12), ec = mixc(wc, [1, 0.5, 0.18], 0.4);
      for (let i = 0; i < n; i++){ fib(i, n, a0, 0.1, r, D3); const v = v0*(0.9 + 0.1*r()), vx = D3[0]*v + vb[0], vy = D3[1]*v + vb[1], vz = D3[2]*v + vb[2], li = life*(0.85 + 0.3*r());
        star(B[0], B[1], B[2], t0, vx, vy, vz, li, wc, 1.25*s, null, 99, k, 1.15, 2, 1.0);
        embers(vx, vy, vz, k, li, 6, ec, 0.5*s, 1.7, 3.4); }
      glows(wc, 7); puffs(sink, B, t0, Math.round(9 + 6*s), R, o, r, wc);
    } else if (kind === 'ring'){
      const n = Math.round(54*s), k = 1.6, v0 = R*k*0.95, life = 1.8 + 0.4*r();
      const vw = o.view || [Math.cos(a0), Math.sin(a0)], e = (r() - 0.5)*0.7, yaw = (r() - 0.5)*0.5, cy = Math.cos(yaw), sy = Math.sin(yaw);
      const N0 = unit([(vw[0]*cy - vw[1]*sy)*Math.cos(e), (vw[0]*sy + vw[1]*cy)*Math.cos(e), Math.sin(e)]);
      const ring = (Nn, cc, vm, nn) => { unit(cross(Nn, Math.abs(Nn[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], E1)); cross(Nn, E1, E2); const b0 = r()*TAU;
        for (let i = 0; i < nn; i++){ const a = b0 + i/nn*TAU, ca = Math.cos(a), sa = Math.sin(a), v = vm*(0.97 + 0.03*r());
          star(B[0], B[1], B[2], t0, (E1[0]*ca + E2[0]*sa)*v + vb[0], (E1[1]*ca + E2[1]*sa)*v + vb[1], (E1[2]*ca + E2[2]*sa)*v + vb[2], life*(0.92 + 0.16*r()), cc, 1.3*s, null, 99, k, 0.07, 0); } };
      ring(N0, c1, v0, n);
      if (r() < 0.35){ const N1 = [E1[0], E1[1], E1[2]]; ring(N1, c2, v0*0.9, Math.round(n*0.85)); }
      const m = Math.round(18*s); for (let i = 0; i < m; i++){ fib(i, m, a0, 0.1, r, D3); const v = v0*0.25; star(B[0], B[1], B[2], t0, D3[0]*v + vb[0], D3[1]*v + vb[1], D3[2]*v + vb[2], life*0.8, c2, 0.8*s, null, 99, k, 0.04, 0); }
      glows(c1); puffs(sink, B, t0, Math.round(5 + 4*s), R, o, r, c1);
    } else if (kind === 'palm'){
      const m = 7 + Math.floor(r()*4), k = 0.95, v0 = R*k*0.95, life = 2.6 + 0.6*r(), pc = mixc(PAL.gold, c1, o.tint ? 0.4 : 0.15), ec = mixc(pc, [1, 0.5, 0.2], 0.3);
      for (let j = 0; j < m; j++){ const a = a0 + j/m*TAU + (r() - 0.5)*0.35, el = 0.22 + 0.62*r(), v = v0*(0.85 + 0.15*r());
        const vx = Math.cos(el)*Math.cos(a)*v + vb[0], vy = Math.cos(el)*Math.sin(a)*v + vb[1], vz = Math.sin(el)*v + vb[2], li = life*(0.9 + 0.2*r());
        star(B[0], B[1], B[2], t0, vx, vy, vz, li, pc, 2.4*s, null, 99, k, 0.9, 2, 1.25);
        embers(vx, vy, vz, k, li, 14, ec, 0.6*s, 1.3, 3.0); }
      glows(pc, 7); puffs(sink, B, t0, Math.round(6 + 4*s), R, o, r, pc);
    } else if (kind === 'crossette'){
      const m = 12 + Math.floor(r()*5), k = 1.35, v0 = R*k*0.5, ts = 0.7 + 0.25*r(), sc = C.length > 1 ? c1 : PAL.gold, cc = C.length > 1 ? c2 : c1;
      for (let j = 0; j < m; j++){ fib(j, m, a0, 0.12, r, D3); const v = v0*(0.92 + 0.08*r()), vel = [D3[0]*v + vb[0], D3[1]*v + vb[1], D3[2]*v + vb[2]];
        star(B[0], B[1], B[2], t0, vel[0], vel[1], vel[2], ts, sc, 1.35*s, null, 99, k, 0.2, 0);
        const P = posAt(B, vel, k, ts, [0, 0, 0]), V = velAt(vel, k, ts, [0, 0, 0]);
        unit(cross(V, Math.abs(V[2]) < 0.9*Math.hypot(V[0], V[1], V[2]) ? [0, 0, 1] : [1, 0, 0], E1)); unit(cross(V, E1, E2));
        const ph = r()*TAU, cp = Math.cos(ph), sp = Math.sin(ph), sv = 34*Math.sqrt(s);
        for (let q = 0; q < 4; q++){ const c = q === 0 ? cp : q === 1 ? -sp : q === 2 ? -cp : sp, d = q === 0 ? sp : q === 1 ? cp : q === 2 ? -sp : -cp;
          const dx = E1[0]*c + E2[0]*d, dy = E1[1]*c + E2[1]*d, dz = E1[2]*c + E2[2]*d;
          star(P[0], P[1], P[2], t0 + ts, V[0]*0.35 + dx*sv, V[1]*0.35 + dy*sv, V[2]*0.35 + dz*sv, 1.0 + 0.3*r(), cc, 1.15*s, null, 99, 1.8, 0.24, 0); }
        star(P[0], P[1], P[2], t0 + ts, 0, 0, 0, 0.09, [1, 0.9, 0.7], 2.4*s, null, 99, 0, 0, 5, 1.2); }
      I.split = ts; glows(sc); puffs(sink, B, t0, Math.round(6 + 4*s), R, o, r, cc);
    } else if (kind === 'strobe'){
      const n = Math.round(100*Math.pow(s, 1.2)), k = 1.45, v0 = R*k*0.9, life = 2.4 + 0.6*r(), sc = mixc(c1, PAL.white, C.length > 1 ? 0.5 : 0.65);
      for (let i = 0; i < n; i++){ fib(i, n, a0, 0.12, r, D3); const v = v0*(0.85 + 0.15*r());
        star(B[0], B[1], B[2], t0, D3[0]*v + vb[0], D3[1]*v + vb[1], D3[2]*v + vb[2], life*(0.9 + 0.2*r()), sc, 1.2*s, null, 99, k, 0.0, 1, 1.1); }
      glows(sc); puffs(sink, B, t0, Math.round(5 + 4*s), R, o, r, null);
    } else if (kind === 'crackle'){
      const n = Math.round(70*s), k = 1.55, v0 = R*k*0.72, life = 1.3 + 0.4*r(), gc = mixc(PAL.gold, c1, 0.3), pc = [1.3, 1.18, 0.95];
      let tmax = 0;
      for (let i = 0; i < n; i++){ fib(i, n, a0, 0.1, r, D3); const v = v0*(0.9 + 0.1*r()), vx = D3[0]*v + vb[0], vy = D3[1]*v + vb[1], vz = D3[2]*v + vb[2], li = life*(0.9 + 0.2*r());
        star(B[0], B[1], B[2], t0, vx, vy, vz, li, gc, 1.15*s, null, 99, k, 0.28, 2);
        embers(vx, vy, vz, k, li, 2, gc, 0.4*s, 0.6, 2.8);
        W3[0] = vx; W3[1] = vy; W3[2] = vz; posAt(B, W3, k, li, P3); const np = 2 + Math.floor(r()*3);
        for (let q = 0; q < np; q++){ const tp = li + r()*0.45; if (tp > tmax) tmax = tp; star(P3[0] + (r() - 0.5)*8, P3[1] + (r() - 0.5)*8, P3[2] + (r() - 0.5)*8 - 2*q, t0 + tp, 0, 0, -1, 0.05 + 0.04*r(), pc, 1.3*s, null, 99, 0, 0, 5, 1); } }
      I.crackle = {t:life*0.92, dur:Math.max(0.4, tmax - life*0.92)}; glows(gc); puffs(sink, B, t0, Math.round(6 + 4*s), R, o, r, gc);
    } else if (kind === 'salute'){
      star(B[0], B[1], B[2], t0, 0, 0, 0, 0.2, [1, 0.97, 0.92], 12*s, null, 99, 0, 0, 4, 2.0);
      if (day < 0.85) star(B[0], B[1], B[2], t0, 0, 0, 0, 1.0, [1, 0.95, 0.85], 45*s, null, 99, 0, 0, 4, 0.07);
      const n = Math.round(50*s); for (let i = 0; i < n; i++){ fib(i, n, a0, 0.3, r, D3); const v = 70*(0.6 + 0.4*r());
        star(B[0], B[1], B[2], t0, D3[0]*v, D3[1]*v, D3[2]*v, 0.3 + 0.2*r(), [1, 0.95, 0.85], 0.9*s, null, 99, 3.5, 0.06, 0, 1.4); }
      I.loud = 1.9; I.col = [1, 0.97, 0.92]; puffs(sink, B, t0, Math.round(4 + 3*s), 40*s, o, r, null);
    }
    return I;
  }
  // ---- show plans: cues {at (s after the start: the launch), p (launch point index, left -> right), kind, size, cols:[names], H, tilt:[lateral,
  // depth] (fractions of the vertical speed), whistle}
  const FIN_W = [['peony', 30], ['chrysanthemum', 24], ['strobe', 14], ['crackle', 14], ['crossette', 10], ['ring', 6], ['palm', 4]];
  const BODY_W = [['peony', 26], ['chrysanthemum', 20], ['willow', 8], ['ring', 9], ['palm', 9], ['crossette', 11], ['strobe', 9], ['crackle', 8]];
  function wpick(r, W){ let s = 0; for (const w of W) s += w[1]; let x = r()*s; for (const w of W){ x -= w[1]; if (x <= 0) return w[0]; } return W[0][0]; }
  function pcols(r, th, n){ const P = THEMES[th] || THEMES.mixed, out = []; for (let i = 0; i < n; i++){ let c = P[Math.floor(r()*P.length)], g = 0; while (out.indexOf(c) >= 0 && ++g < 8) c = P[Math.floor(r()*P.length)]; out.push(c); } return out; }
  const hOf = (r, size) => clamp(110 + 115*size + (r() - 0.5)*36, 150, 300);
  function plan(o, r){
    o = o || {}; r = r || Math.random;
    const n = Math.max(1, o.n | 0), th = o.theme || 'mixed', I = clamp(o.intensity === undefined || o.intensity === null ? 0.8 : +o.intensity, 0, 1), mid = (n - 1)/2;
    const D = clamp(+o.seconds || 45, 2, 600), Q = [];
    const cue = (at, p, kind, size, cl, ex) => { if (at > D + 0.01) return; Q.push(Object.assign({at:Math.max(0, at), p:clamp(Math.round(p), 0, n - 1), kind, size, cols:cl, H:hOf(r, size), tilt:[0, 0], whistle:r() < 0.15}, ex || {})); };
    const tiltOf = p => n > 1 ? (p/(n - 1) - 0.5)*0.34 : 0;
    const rp = () => Math.floor(r()*n);
    const pl = o.plan || 'show';
    if (pl === 'salvo'){            // lights out: every barge at once, then a second wave
      const K = ['peony', 'ring', 'strobe', 'crossette', 'peony'];
      for (let p = 0; p < n; p++) cue(p*0.1, p, K[p % K.length], 0.95, pcols(r, th, 2), {H:175 + (p % 2)*30, tilt:[tiltOf(p), 0], whistle:false});
      for (let p = 0; p < n; p++) cue(1.0 + p*0.1, n - 1 - p, p % 2 ? 'palm' : 'chrysanthemum', 0.9, pcols(r, th, 1), {H:215, tilt:[tiltOf(n - 1 - p)*0.7, 0], whistle:false});
      if (n < 3) for (let j = 0; j < 3 - n; j++) cue(0.5 + j*0.3, rp(), 'peony', 0.9, pcols(r, th, 2), {whistle:false});
      return Q.sort((a, b) => a.at - b.at);
    }
    if (pl === 'lap'){              // the leader starts the last lap
      cue(0, mid, 'willow', 1.1, ['gold'], {H:240, whistle:true});
      cue(1.1, 0, 'peony', 0.9, pcols(r, th, 2), {tilt:[tiltOf(0)*0.6, 0]}); cue(1.1, n - 1, 'peony', 0.9, pcols(r, th, 2), {tilt:[tiltOf(n - 1)*0.6, 0]});
      cue(2.5, mid, 'crossette', 1.0, pcols(r, th, 2)); cue(3.7, rp(), 'strobe', 0.9, ['white']);
      return Q.sort((a, b) => a.at - b.at);
    }
    if (pl === 'salute'){           // the player crosses the line behind the winner
      cue(0, mid, 'salute', 0.9, ['white'], {H:200}); cue(0.4, 0, 'peony', 0.9, pcols(r, th, 2)); cue(0.4, n - 1, 'peony', 0.9, pcols(r, th, 2)); cue(1.2, mid, 'ring', 1.0, pcols(r, th, 1));
      return Q.sort((a, b) => a.at - b.at);
    }
    const gap = () => (0.6 + 1.2*r())*(1.3 - 0.7*I);
    const fin = D >= 14 ? clamp(D*0.2, 6, 14) : 0, bodyEnd = D - fin - (fin ? 1.4 : 0);
    // opening: a big shell in the middle, a pair from the ends, a third
    cue(0, mid, 'peony', 1.3, pcols(r, th, 2), {whistle:true});
    { const cc = pcols(r, th, 1); if (n > 1){ cue(2.2, 0, 'chrysanthemum', 1.1, cc, {tilt:[-0.1, 0]}); cue(2.2, n - 1, 'chrysanthemum', 1.1, cc, {tilt:[0.1, 0]}); } else cue(2.2, 0, 'chrysanthemum', 1.1, cc); }
    if (D > 8) cue(4.0, mid, wpick(r, [['ring', 1], ['crossette', 1], ['palm', 1]]), 1.15, pcols(r, th, 2));
    const PAT = [
      t => { const k = wpick(r, [['peony', 3], ['chrysanthemum', 3], ['crossette', 2], ['strobe', 1], ['ring', 1], ['palm', 1]]), cc = pcols(r, th, 2), rev = r() < 0.5, sz = 0.75 + 0.35*r(), H = hOf(r, sz);   // fan
        for (let i = 0; i < n; i++){ const p = rev ? n - 1 - i : i; cue(t + i*0.24, p, k, sz, cc, {H, tilt:[tiltOf(p), 0]}); } return t + n*0.24; },
      t => { const k = wpick(r, BODY_W), cc = pcols(r, th, 2);   // pairs from the ends inwards
        for (let j = 0; j < Math.max(1, Math.floor(n/2)); j++){ const H = hOf(r, 1); cue(t, j, k, 1, cc, {H, tilt:[-0.12, 0]}); cue(t, n - 1 - j, k, 1, cc, {H, tilt:[0.12, 0]}); t += 0.9; }
        if (n & 1) cue(t, mid, wpick(r, BODY_W), 1.25, pcols(r, th, 2)); return t + 0.6; },
      t => { const m = 3 + Math.floor(r()*3); for (let j = 0; j < m; j++){ cue(t, rp(), wpick(r, BODY_W), 0.8 + 0.55*r(), pcols(r, th, r() < 0.5 ? 2 : 1), {tilt:[(r() - 0.5)*0.2, (r() - 0.5)*0.1]}); t += (0.7 + 0.9*r())*(1.3 - 0.5*I); } return t; },   // singles
      t => { const p = rp(), m = 6 + Math.floor(r()*4), cc = pcols(r, th, 2); for (let j = 0; j < m; j++) cue(t + j*0.17, p, 'peony', 0.55, [cc[j & 1]], {H:150 + j*12, tilt:[(j - m/2)*0.02, 0], whistle:false}); return t + m*0.17; },   // a chain
      t => { const cc = pcols(r, th, 3); for (let j = 0; j < 3; j++) cue(t + j*0.45, n > 2 ? 1 + (j % Math.max(1, n - 2)) : rp(), 'ring', 1, [cc[j]], {H:170 + 40*j}); return t + 1.4; },   // rings
      t => { for (let p = 0; p < n; p++) cue(t + p*0.12, p, 'willow', 1.15, ['gold'], {H:245 + (r() - 0.5)*20, tilt:[tiltOf(p)*0.5, 0]}); cue(t + 1.6, mid, 'strobe', 1, ['white']); return t + 3; },   // a willow curtain
      t => { const cc = pcols(r, th, 2); for (let p = 0; p < n; p++) cue(t + p*0.3, p, 'crossette', 0.95, cc, {tilt:[tiltOf(p)*1.2, 0]}); return t + n*0.3; },   // crossettes
      t => { cue(t, mid, 'palm', 1.2, ['gold'], {whistle:false}); cue(t + 0.9, rp(), 'chrysanthemum', 1, pcols(r, th, 2)); cue(t + 1.6, rp(), 'crackle', 1, ['gold']); return t + 2.4; }];   // palm + chrysanthemum + crackle
    let t = D > 8 ? 6.2 : 3.2, last = -1;
    while (t < bodyEnd - 0.8){ let k = Math.floor(r()*PAT.length); if (k === last) k = (k + 1) % PAT.length; last = k; t = PAT[k](t) + gap(); }
    if (fin){
      const f0 = D - fin, rate = 2.5 + 4.5*I; let tf = f0;
      while (tf < D - 1.8){ cue(tf, rp(), wpick(r, FIN_W), 0.55 + 0.6*r(), pcols(r, th, r() < 0.4 ? 2 : 1), {tilt:[(r() - 0.5)*0.3, (r() - 0.5)*0.1], whistle:r() < 0.08}); tf += (0.4 + 0.8*r())/(rate*(1 + 0.6*(tf - f0)/fin)); }
      for (let p = 0; p < n; p++) cue(D - 1.8 + p*0.06, p, 'willow', 1.25, ['gold'], {H:262, tilt:[tiltOf(p)*0.6, 0], whistle:false});
      for (let j = 0; j < Math.min(3, n + 1); j++) cue(D - 0.7 + j*0.18, rp(), 'salute', 1.0, ['white'], {H:225 + 20*j, whistle:false});
    }
    return Q.sort((a, b) => a.at - b.at);
  }
  // ---- the F1 race, read only: R = {state:'off'|'grid'|'race'|'done', laps, L (lap length), order:[{car (0 = the player), prog (m since the
  // start of lap 1), fin (finish time | null)}], since (s since the lights went out)}; W keeps what was seen; -> actions
  // [{a:'reset'|'salvo'|'lap'|'finale'|'salute', win}]. A race seen first less than a second after the lights went out (its short grid
  // phase missed) still gets its salvo.
  function raceStep(W, R){
    const out = [], st = R && R.state ? R.state : 'off';
    if (st !== W.prev){
      if (st === 'grid'){ W.final = false; W.fin = false; W.pfin = false; if (W.prev !== undefined) out.push({a:'reset'}); }
      if (st === 'race' && (W.prev === 'grid' || (W.prev !== undefined && R.since >= 0 && R.since < 1))) out.push({a:'salvo'});
      W.prev = st;
    }
    if ((st === 'race' || st === 'done') && R.order){
      let lead = -1e18, first = null;
      for (const e of R.order){ if (e.prog > lead) lead = e.prog; if (e.fin !== null && e.fin !== undefined && (!first || e.fin < first.fin)) first = e; }
      if (!W.final && !W.fin && R.laps > 1 && R.L > 0 && lead >= (R.laps - 1)*R.L){ W.final = true; out.push({a:'lap'}); }
      if (!W.fin && (first || st === 'done')){ W.fin = true; W.final = true; const win = first ? first.car === 0 : true; if (st === 'done') W.pfin = true; out.push({a:'finale', win}); }
      else if (W.fin && !W.pfin && st === 'done'){ W.pfin = true; out.push({a:'salute'}); }
    }
    return out;
  }
  // ---- launch points over water: the cells within R of (cx, cy) with water all around (deep >= o.deep m from any shore) that pass
  // o.accept(x, y), best by distance + o.score(x, y); then up to o.max points spread over that stretch of water (farthest-point
  // sampling, >= o.gap apart, within o.spread of the best)
  function pickWater(isW, cx, cy, o){
    o = o || {}; const R = o.R || 1200, st = o.step || 40, dm = o.deep || 60, max = o.max || 5, spr = o.spread || 260, gap = o.gap || 70;
    const deep = (x, y) => { for (let i = 0; i < 8; i++){ const a = i*Math.PI/4; if (!isW(x + Math.cos(a)*dm, y + Math.sin(a)*dm)) return false; } return true; };
    const C = [];
    for (let y = cy - R; y <= cy + R; y += st) for (let x = cx - R; x <= cx + R; x += st){ const d = Math.hypot(x - cx, y - cy); if (d > R || !isW(x, y) || (o.accept && !o.accept(x, y)) || !deep(x, y)) continue; C.push([x, y, d + (o.score ? o.score(x, y) : 0)]); }
    if (!C.length) return [];
    let b = C[0]; for (const c of C) if (c[2] < b[2]) b = c;
    const near = C.filter(c => Math.hypot(c[0] - b[0], c[1] - b[1]) <= spr), out = [[b[0], b[1]]];
    while (out.length < max){ let best = null, bd = gap; for (const c of near){ let m = 1e9; for (const q of out){ const d = Math.hypot(c[0] - q[0], c[1] - q[1]); if (d < m) m = d; } if (m > bd){ bd = m; best = c; } } if (!best) break; out.push([best[0], best[1]]); }
    return out;
  }
  // order points left -> right as seen from (ax, ay); the frame: u = to the right, d = away from the audience (unit, world x / y)
  function frameOf(pts, ax, ay){
    let cx = 0, cy = 0; for (const p of pts){ cx += p[0]; cy += p[1]; } cx /= pts.length || 1; cy /= pts.length || 1;
    let dx = cx - ax, dy = cy - ay; const l = Math.hypot(dx, dy); if (l < 1){ dx = 0; dy = 1; } else { dx /= l; dy /= l; }
    const ux = dy, uy = -dx, list = pts.slice().sort((a, b) => ((a[0] - cx)*ux + (a[1] - cy)*uy) - ((b[0] - cx)*ux + (b[1] - cy)*uy));
    return {list, ux, uy, dx, dy, cx, cy};
  }
  // particle slots in blocks of bs: a block is filled in order, then the lowest block whose particles have all ended is reused (else the
  // one that ends first: the pool is full), so the live slots stay packed at the start and the drawn count (used) stays small; short-
  // and long-lived particles fill separate blocks (two lanes), so a block is not kept alive by one long-burning star.
  // take(tEnd) -> slot; [lo, hi] = slots written since the last upload; idle(now) -> recomputes used, true when everything has ended
  function mkRing(cap, bs){ bs = bs || 256; const nb = Math.ceil(cap/bs);
    return {cap, bs, nb, bu:new Float64Array(nb).fill(-1e9), cb:[-1, -1], off:[0, 0], used:0, lo:1e9, hi:-1, until:-1e9, n:0, now:-1e9,
      take(tEnd){
        const ln = tEnd - this.now > 3.2 ? 1 : 0;
        if (this.cb[ln] < 0 || this.off[ln] >= this.bs || this.cb[ln]*this.bs + this.off[ln] >= this.cap){ this.cb[ln] = this.pick(); this.off[ln] = 0; }
        const c = this.cb[ln], i = c*this.bs + this.off[ln]++; if (tEnd > this.bu[c]) this.bu[c] = tEnd; if (tEnd > this.until) this.until = tEnd;
        if (i < this.lo) this.lo = i; if (i > this.hi) this.hi = i; if (i + 1 > this.used) this.used = Math.min(this.cap, (c + 1)*this.bs); this.n++; return i; },
      pick(){ let best = 0, bt = 1e300; for (let b = 0; b < this.nb; b++){ if (b === this.cb[0] || b === this.cb[1]) continue; if (this.bu[b] < this.now){ this.bu[b] = -1e9; return b; } if (this.bu[b] < bt){ bt = this.bu[b]; best = b; } } this.bu[best] = -1e9; return best; },
      idle(now){ this.now = now;
        if (now > this.until){ const was = this.used > 0; this.used = 0; this.cb[0] = this.cb[1] = -1; this.off[0] = this.off[1] = 0; this.bu.fill(-1e9); return was; }
        let hb = Math.max(this.cb[0], this.cb[1]); for (let b = this.nb - 1; b > hb; b--) if (this.bu[b] >= now){ hb = b; break; }
        this.used = Math.min(this.cap, (hb + 1)*this.bs); return false; }}; }
  return {G, PAL, THEMES, KINDS, kindOf, col, cols, posAt, velAt, apexH, rocketT, rocketV0, ASC_K, rocket, shell, plan, raceStep, pickWater, frameOf, mkRing, rng, clamp, css:null};
})();
//</FWCORE>
// ---- GPU pools: sparks (additive streak quads; the same instances mirrored on the water at night) and smoke (lit billboards)
const FWG = (() => {
  const SP_CAP = 32768, SM_CAP = 4096;
  const U = {uT:{value:0}, uH:{value:800}, uDay:{value:0}, uWL:{value:0}, uGain:{value:1}, uFogN:{value:1e6}, uFogF:{value:2e6}};
  const SU = {uT:U.uT, uTex:{value:null}, uWind:{value:new THREE.Vector3()}, uAmb:{value:new THREE.Color(0.1, 0.1, 0.1)}, uFogN:U.uFogN, uFogF:U.uFogF,
    uFL:{value:[0, 1, 2, 3].map(() => new THREE.Vector4(0, -1e5, 0, 0))}, uFC:{value:[0, 1, 2, 3].map(() => new THREE.Color(0, 0, 0))}};
  let inited = false, SP = null, SM = null, mSp = null, mMir = null, mSm = null, wetUntil = -1e9;
  const quad = () => { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]); g.instanceCount = 0; return g; };
  function pool(cap, bs, spec, g){ const R = FWC.mkRing(cap, bs); R.A = {}; for (const k in spec){ const a = new THREE.InstancedBufferAttribute(new Float32Array(cap*spec[k]), spec[k]); a.setUsage(THREE.DynamicDrawUsage); R.A[k] = a; g.setAttribute(k, a); } R.g = g; return R; }
  // the new slots go up as one range per attribute; a range three.js has not uploaded yet (no render since) is merged in
  function commit(S){ if (S.hi < 0) return; for (const k in S.A){ const a = S.A[k], s = a.itemSize, R = a.updateRange; let lo = S.lo*s, hi = (S.hi + 1)*s;
      if (R.count > 0){ lo = Math.min(lo, R.offset); hi = Math.max(hi, R.offset + R.count); } R.offset = lo; R.count = hi - lo; a.needsUpdate = true; } S.lo = 1e9; S.hi = -1; }
  const SPV = `attribute vec4 aP; attribute vec4 aV; attribute vec4 aC; attribute vec4 aD; attribute vec4 aX;
uniform float uT; uniform float uH; uniform float uDay; uniform float uMir; uniform float uWL; uniform float uGain; uniform float uFogN; uniform float uFogF;
varying vec4 vS; varying vec4 vK; varying vec2 vM;
float fwH(float n){ return fract(sin(n)*43758.5453123); }
vec3 fwPos(float t, float k, float g){
  if (k < 0.001) return aP.xyz + aV.xyz*t - vec3(0.0, 4.905*g*t*t, 0.0);
  float e = (1.0 - exp(-k*t))/k, vt = -9.81*g/k;
  return aP.xyz + vec3(aV.x*e, vt*t + (aV.y - vt)*e, aV.z*e);
}
void main(){
  float age = uT - aP.w, life = aV.w, mode = floor(aX.z + 0.5), seed = fract(aX.w), wet = step(1.5, aX.w);
  vS = vec4(0.0); vK = vec4(0.0); vM = vec2(mode, seed);
  if (age < 0.0 || age > life || (uMir > 0.5 && wet < 0.5)){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float u = age/life, k = aX.x, g = mode > 3.5 ? 0.0 : 1.0, sz = aC.w;
  vec3 hd = fwPos(age, k, g), tl = fwPos(max(age - aX.y, 0.0), k, g);
  float b = smoothstep(0.0, 0.035, age);
  if (mode < 0.5){ b *= 1.0 - smoothstep(0.7, 1.0, u); if (u > 0.55) b *= 0.45 + 0.55*step(0.3, fwH(floor(uT*28.0) + seed*97.0)); sz *= mix(1.0, 0.55, u); }
  else if (mode < 1.5){ float bl = step(0.6, fract(uT*(7.0 + 9.0*seed) + seed*7.0)); b *= mix(0.6, bl*1.9, step(0.3, u))*(1.0 - smoothstep(0.88, 1.0, u)); }
  else if (mode < 2.5){ b *= (1.0 - smoothstep(0.65, 1.0, u))*(0.75 + 0.5*fwH(floor(uT*36.0) + seed*53.0)); sz *= mix(1.0, 0.6, u); }
  else if (mode < 3.5){ b *= pow(1.0 - u, 1.6)*(0.35 + 0.65*step(0.25, fwH(floor(uT*24.0) + seed*31.0))); }
  else if (mode < 4.5){ b = smoothstep(0.0, 0.015, age)*exp(-3.2*u); sz *= 1.0 + 0.5*u; }
  else { b = smoothstep(0.0, 0.01, age)*(1.0 - u)*2.2; sz *= 1.0 + u; }
  vec3 col = mix(aC.rgb, aD.rgb, smoothstep(aD.w, aD.w + 0.15, age));
  if (uMir > 0.5){ hd.y = 2.0*uWL - hd.y; tl.y = 2.0*uWL - tl.y; }
  vec4 A = modelViewMatrix*vec4(tl, 1.0), B = modelViewMatrix*vec4(hd, 1.0);
  float zc = max(-B.z, 1.0), px = 2.0*zc/(projectionMatrix[1][1]*uH);
  float w = max(sz, (mode > 3.5 ? 1.5 : 1.15)*px), ext = (mode > 3.5 ? 2.2 : 3.4)*w;
  vec2 d = B.xy - A.xy; float l = length(d); vec2 dir = l > 1e-4 ? d/l : vec2(0.0, 1.0);
  float s = position.y*0.5 + 0.5;
  vec4 mv = mix(A, B, s);
  vec2 off = dir*position.y*ext + vec2(dir.y, -dir.x)*position.x*ext;
  vS = vec4(s*l + position.y*ext, position.x*ext, l, w);
  if (uMir > 0.5){
    off.y *= 2.6; off.x *= 1.3; mv.xy += off;
    mv.x += sin(mv.y*0.09 + uT*2.3 + seed*31.0)*w*1.6;
    vec3 n = normalize((viewMatrix*vec4(0.0, 1.0, 0.0, 0.0)).xyz), p0 = (viewMatrix*vec4(0.0, uWL, 0.0, 1.0)).xyz;
    float den = dot(n, mv.xyz), sc = abs(den) > 1e-6 ? dot(n, p0)/den : -1.0;
    if (sc <= 0.0){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    float c = abs(dot(n, normalize(mv.xyz)));
    b *= 0.1 + 0.6*pow(1.0 - c, 3.0);
    mv.xyz *= sc;
  } else mv.xy += off;
  float f = (1.0 - smoothstep(uFogN, uFogF, zc))*mix(1.0, 0.38, uDay)*uGain;
  f *= mode > 3.5 ? 1.0 : 1.0 + 0.35*(1.0 - uDay);
  vK = vec4(col*b*f, b*f*(mode > 3.5 ? 0.12 : 0.24)*(1.0 - 0.6*uDay));
  gl_Position = projectionMatrix*mv;
}`;
  const SPF = `uniform float uT; varying vec4 vS; varying vec4 vK; varying vec2 vM;
void main(){
  float a = vS.x, l = vS.z, w = vS.w;
  if (w <= 0.0) discard;
  float da = max(max(-a, a - l), 0.0), r = length(vec2(da, vS.y))/w, I, core;
  if (vM.x > 3.5){ core = exp(-r*r*1.2); I = core*0.7 + exp(-r*1.6)*0.3; core *= 0.5; }
  else {
    float g = l > 1e-4 ? clamp(a/l, 0.0, 1.0) : 1.0, tk = 0.16 + 0.84*g*g;
    core = exp(-r*r*2.2)*tk; I = core + exp(-r*1.5)*0.2*tk;
    if (vM.x > 1.5 && vM.x < 2.5 && l > w){
      float cl = w*1.7, ci = floor(a/cl), q = length(vec2(a - (ci + 0.5)*cl, vS.y))/w;
      float sp = step(0.72, fract(sin(ci*12.9898 + vM.y*78.233 + floor(uT*20.0)*4.1)*43758.5453));
      I += sp*exp(-q*q*3.0)*1.4*(1.0 - g*0.7)*step(0.0, a)*step(a, l);
    }
  }
  vec3 c = vK.rgb*I + vec3(vK.w*core);
  if (c.r + c.g + c.b < 0.003) discard;
  gl_FragColor = vec4(c, 1.0);
}`;
  const SMV = `attribute vec4 aP; attribute vec4 aV; attribute vec4 aS; attribute vec4 aC;
uniform float uT; uniform vec3 uWind; uniform vec3 uAmb; uniform vec4 uFL[4]; uniform vec3 uFC[4]; uniform float uFogN; uniform float uFogF;
varying vec2 vUv; varying vec4 vC;
void main(){
  float kt = uT - aP.w, u = kt/aV.w;
  vUv = vec2(0.0); vC = vec4(0.0);
  if (kt < 0.0 || u > 1.0){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec3 c = aP.xyz + aV.xyz*(1.0 - exp(-kt*0.7))/0.7 + uWind*kt + vec3(0.0, aS.w*kt, 0.0);
  float size = mix(aS.x, aS.y, 1.0 - exp(-kt*0.16));
  vec4 mv = modelViewMatrix*vec4(c, 1.0);
  float ro = aC.w*40.0 + kt*0.06*(aC.w - 0.5), cs = cos(ro), sn = sin(ro);
  mv.xy += vec2(position.x*cs - position.y*sn, position.x*sn + position.y*cs)*size;
  gl_Position = projectionMatrix*mv; vUv = position.xy*0.5 + 0.5;
  vec3 lit = uAmb;
  for (int i = 0; i < 4; i++){ vec3 dd = c - uFL[i].xyz; lit += uFC[i]*uFL[i].w/(1.0 + dot(dd, dd)/52900.0); }
  vC = vec4(aC.rgb*lit, aS.z*smoothstep(0.0, 0.05, u)*(1.0 - u)*(1.0 - u)*(1.0 - smoothstep(uFogN, uFogF, -mv.z)));
}`;
  const SMF = `uniform sampler2D uTex; varying vec2 vUv; varying vec4 vC;
void main(){ float a = texture2D(uTex, vUv).a*vC.a; if (a < 0.004) discard; gl_FragColor = vec4(vC.rgb, a); }`;
  function cloudTex(){
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); let a = 11;
    const r = () => { a = (a*16807) % 2147483647; return a/2147483647; };
    for (let i = 0; i < 34; i++){ const px = 64 + (r() - 0.5)*60, py = 64 + (r() - 0.5)*60, rr = 12 + r()*30, gr = x.createRadialGradient(px, py, 0, px, py, rr);
      gr.addColorStop(0, 'rgba(255,255,255,' + (0.25 + r()*0.35) + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); }
    const gr = x.createRadialGradient(64, 64, 22, 64, 64, 64); x.globalCompositeOperation = 'destination-in'; gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  function init(){
    if (inited) return true; if (typeof THREE === 'undefined' || typeof scene === 'undefined') return false; inited = true;
    const gs = quad(); SP = pool(SP_CAP, 256, {aP:4, aV:4, aC:4, aD:4, aX:4}, gs);
    for (let i = 0; i < SP_CAP; i++) SP.A.aP.array[i*4 + 3] = -1e9;
    const mk = mir => new THREE.ShaderMaterial({uniforms:Object.assign({}, U, {uMir:{value:mir}}), vertexShader:SPV, fragmentShader:SPF, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide});
    mSp = new THREE.Mesh(gs, mk(0)); mMir = new THREE.Mesh(gs, mk(1));
    const gm = quad(); SM = pool(SM_CAP, 128, {aP:4, aV:4, aS:4, aC:4}, gm);
    for (let i = 0; i < SM_CAP; i++) SM.A.aP.array[i*4 + 3] = -1e9;
    SU.uTex.value = cloudTex();
    mSm = new THREE.Mesh(gm, new THREE.ShaderMaterial({uniforms:SU, vertexShader:SMV, fragmentShader:SMF, transparent:true, depthWrite:false, side:THREE.DoubleSide}));
    [[mSp, 'fireworks_sparks', 9], [mMir, 'fireworks_reflection', 9], [mSm, 'fireworks_smoke', 8]].forEach(([m, n, o]) => { m.name = n; m.frustumCulled = false; m.renderOrder = o; m.visible = false; m.castShadow = m.receiveShadow = false; scene.add(m); });
    return true;
  }
  // the sink the core writes into (world x, y, z -> three.js x, z, -y)
  const sink = {
    spark(x, y, z, t0, vx, vy, vz, life, r, g, b, size, r2, g2, b2, tc, k, trail, mode, seed){
      const i = SP.take(t0 + life + 0.1), A = SP.A, j = i*4;
      A.aP.array[j] = x; A.aP.array[j + 1] = z; A.aP.array[j + 2] = -y; A.aP.array[j + 3] = t0;
      A.aV.array[j] = vx; A.aV.array[j + 1] = vz; A.aV.array[j + 2] = -vy; A.aV.array[j + 3] = life;
      A.aC.array[j] = r; A.aC.array[j + 1] = g; A.aC.array[j + 2] = b; A.aC.array[j + 3] = size;
      A.aD.array[j] = r2; A.aD.array[j + 1] = g2; A.aD.array[j + 2] = b2; A.aD.array[j + 3] = tc;
      A.aX.array[j] = k; A.aX.array[j + 1] = trail; A.aX.array[j + 2] = mode; A.aX.array[j + 3] = seed;
      if (seed >= 2 && t0 + life > wetUntil) wetUntil = t0 + life;
    },
    smoke(x, y, z, t0, vx, vy, vz, life, s0, s1, alpha, rise, r, g, b){
      const i = SM.take(t0 + life + 0.1), A = SM.A, j = i*4;
      A.aP.array[j] = x; A.aP.array[j + 1] = z; A.aP.array[j + 2] = -y; A.aP.array[j + 3] = t0;
      A.aV.array[j] = vx; A.aV.array[j + 1] = vz; A.aV.array[j + 2] = -vy; A.aV.array[j + 3] = life;
      A.aS.array[j] = s0; A.aS.array[j + 1] = s1; A.aS.array[j + 2] = alpha; A.aS.array[j + 3] = rise;
      A.aC.array[j] = r; A.aC.array[j + 1] = g; A.aC.array[j + 2] = b; A.aC.array[j + 3] = Math.random();
    }};
  // once per frame: the clock, the light, uploads of the new slots, what is drawn
  function frame(T, night){
    if (!inited) return 0;
    U.uT.value = T; U.uDay.value = 1 - night;
    U.uH.value = typeof renderer !== 'undefined' ? renderer.domElement.height || 800 : 800;
    const f = typeof scene !== 'undefined' && scene.fog; if (f && f.isFog){ U.uFogN.value = f.near; U.uFogF.value = f.far; } else { U.uFogN.value = 1e6; U.uFogF.value = 2e6; }
    SP.idle(T); SM.idle(T);
    commit(SP); commit(SM);
    SP.g.instanceCount = SP.used; SM.g.instanceCount = SM.used;
    mSp.visible = SP.used > 0; mSm.visible = SM.used > 0; mMir.visible = mSp.visible && night > 0.25 && T < wetUntil;
    return (mSp.visible ? 1 : 0) + (mMir.visible ? 1 : 0) + (mSm.visible ? 1 : 0);
  }
  function clear(){ if (!inited) return; for (const S of [SP, SM]){ S.until = -1e9; S.idle(0); S.lo = 1e9; S.hi = -1; S.g.instanceCount = 0; for (const k in S.A) S.A[k].updateRange.count = -1; } wetUntil = -1e9; mSp.visible = mMir.visible = mSm.visible = false; }
  function alive(T){ if (!inited) return {sparks:0, smoke:0}; let a = 0, b = 0; const P = SP.A.aP.array, V = SP.A.aV.array; for (let i = 0; i < SP.used; i++){ const t = T - P[i*4 + 3]; if (t >= 0 && t <= V[i*4 + 3]) a++; }
    const Q = SM.A.aP.array, W = SM.A.aV.array; for (let i = 0; i < SM.used; i++){ const t = T - Q[i*4 + 3]; if (t >= 0 && t <= W[i*4 + 3]) b++; } return {sparks:a, smoke:b}; }
  return {U, SU, init, sink, frame, clear, alive, get inited(){ return inited; }, get SP(){ return SP; }, get SM(){ return SM; }, get meshes(){ return [mSp, mMir, mSm]; }, until:() => inited ? Math.max(SP.until, SM.until) : -1e9, SP_CAP, SM_CAP};
})();
// ---- sound: own synthesis on the sound module's AudioContext, into its 'fx' bus (碰撞与爆炸 Crashes & effects: follows the master
// volume, mute and the group's volume; its reverb send follows them too); nothing while the sound is off. Delays: distance / 343 m/s.
const FWA = (() => {
  const C = {ctx:null, wn:null, bn:null, ck:null, last:{boom:-1, thump:-1, whistle:-1, crackle:-1, pop:-1}, n:{boom:0, thump:0, whistle:0, crackle:0, pop:0, dropped:0}};
  const _v = new THREE.Vector3(), _r = new THREE.Vector3();
  let EX = null;      // tests: an explicit engine {ctx (e.g. an OfflineAudioContext), bus:{fx}, wbus:{fx}}
  function eng(){
    if (EX){ if (C.ctx !== EX.ctx){ C.ctx = EX.ctx; bufs(EX.ctx); } return EX; }
    try { const A = window.SGAudio, E = A && A._test && A._test.LIVE; if (!A || !A.on || !E || !E.ctx || E.ctx.state !== 'running' || !E.bus || !E.bus.fx || E.err) return null;
      if (C.ctx !== E.ctx){ C.ctx = E.ctx; bufs(E.ctx); } return E; } catch (e){ return null; }
  }
  function bufs(c){
    const sr = c.sampleRate, mk = sec => c.createBuffer(1, Math.floor(sr*sec), sr);
    C.wn = mk(2); { const d = C.wn.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1; }
    C.bn = mk(3); { const d = C.bn.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++){ l = (l + 0.05*(Math.random()*2 - 1))/1.05; d[i] = l*3.4; } }
    C.ck = mk(1.5); { const d = C.ck.getChannelData(0), N = d.length; for (let p = 0; p < 190; p++){ const at = Math.floor(N*0.96*Math.pow(Math.random(), 0.85)), len = Math.floor(sr*(0.0012 + Math.random()*0.004)), a = (0.3 + 0.7*Math.random())*(1 - 0.55*at/N);
      for (let i = 0; i < len && at + i < N; i++) d[at + i] += (Math.random()*2 - 1)*a*Math.exp(-i/(len*0.28)); } }
  }
  function geo(x, y, z){ const c = camera.position, dx = x - c.x, dy = z - c.y, dz = -y - c.z, d = Math.hypot(dx, dy, dz);
    _v.set(dx, 0, dz); if (_v.lengthSq() < 1e-6) return {d, pan:0}; _v.normalize(); _r.set(1, 0, 0).applyQuaternion(camera.quaternion); _r.y = 0; if (_r.lengthSq() < 1e-6) return {d, pan:0}; _r.normalize();
    return {d, pan:Math.max(-0.85, Math.min(0.85, _v.dot(_r)))}; }
  function out(E, pan, send){ const c = E.ctx, g = c.createGain(); let n = g;
    if (c.createStereoPanner){ const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); n = p; } n.connect(E.bus.fx);
    const w = E.wbus && E.wbus.fx; if (w && send > 0){ const s = c.createGain(); s.gain.value = send; g.connect(s); s.connect(w); } return g; }
  function src(c, buf, t, off, dur, rate){ const s = c.createBufferSource(); s.buffer = buf; if (rate) s.playbackRate.value = rate; s.start(t, Math.min(off || 0, buf.duration - 0.01), Math.max(0.01, dur)); return s; }
  function env(c, t, peak, att, dec){ const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + att + dec); return g; }
  const gate = (k, min) => { const c = C.ctx, now = c.currentTime; if (now - C.last[k] < min){ C.n.dropped++; return false; } C.last[k] = now; C.n[k]++; return true; };
  const lpf = d => 260 + 5400/(1 + d/330);
  // the break: a low rumble of filtered noise, a crack close by, a sub thump, two echoes off the towers, more reverb far away
  function boom(x, y, z, size, loud){
    const E = eng(); if (!E) return false; const c = E.ctx, q = geo(x, y, z), d = q.d, att = Math.min(1.3, 1.25*(0.55 + 0.45*size)*(loud || 1)/(1 + d/380));
    if (att < 0.01 || !gate('boom', 0.035)) return false;
    const t0 = c.currentTime + Math.min(15, d/343) + 0.01, fc = lpf(d), dec = 0.8 + 0.7*size + Math.min(1.6, d/1500), o = out(E, q.pan, Math.min(0.9, 0.22 + d/2400));
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = fc; lp.Q.value = 0.6;
    const eg = env(c, t0, 0.8*att, 0.004, dec); src(c, C.bn, t0, Math.random()*1.5, dec + 0.1).connect(lp); lp.connect(eg); eg.connect(o);
    const nr = 1/(1 + d/260); if (nr > 0.12){ const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1700; const cg = env(c, t0, 0.55*att*nr*(loud > 1.5 ? 1.6 : 1), 0.002, 0.09); src(c, C.wn, t0, Math.random(), 0.14).connect(hp); hp.connect(cg); cg.connect(o); }
    const os = c.createOscillator(), og = env(c, t0, 0.95*att, 0.012, 0.7); os.type = 'sine'; os.frequency.setValueAtTime(66, t0); os.frequency.exponentialRampToValueAtTime(26, t0 + 0.6); os.connect(og); og.connect(o); os.start(t0); os.stop(t0 + 0.8);
    for (const [dl, k] of [[0.26 + Math.random()*0.32, 0.3], [0.8 + Math.random()*0.6, 0.15]]){ const dn = c.createDelay(2), dg = c.createGain(), l2 = c.createBiquadFilter(); dn.delayTime.value = dl; dg.gain.value = k; l2.type = 'lowpass'; l2.frequency.value = fc*0.55; eg.connect(dn); dn.connect(l2); l2.connect(dg); dg.connect(o); }
    return true;
  }
  // the mortar: a short low thump at the barge
  function thump(x, y, z, k){
    const E = eng(); if (!E) return false; const c = E.ctx, q = geo(x, y, z), d = q.d, att = Math.min(1, 0.85*(k || 1)/(1 + d/230)); if (att < 0.01 || !gate('thump', 0.05)) return false;
    const t0 = c.currentTime + Math.min(15, d/343) + 0.01, o = out(E, q.pan, Math.min(0.6, 0.1 + d/3000));
    const os = c.createOscillator(), og = env(c, t0, 0.75*att, 0.005, 0.28); os.type = 'sine'; os.frequency.setValueAtTime(150, t0); os.frequency.exponentialRampToValueAtTime(46, t0 + 0.16); os.connect(og); og.connect(o); os.start(t0); os.stop(t0 + 0.35);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(900, lpf(d)); const ng = env(c, t0, 0.45*att, 0.003, 0.14); src(c, C.wn, t0, Math.random(), 0.2).connect(lp); lp.connect(ng); ng.connect(o);
    return true;
  }
  // a whistling tail on the way up (falling pitch, a little warble)
  function whistle(x, y, z, dur, k){
    const E = eng(); if (!E) return false; const c = E.ctx, q = geo(x, y, z), d = q.d, att = Math.min(1, 0.8*(k || 1)/(1 + d/300)); if (att < 0.02 || !gate('whistle', 0.25)) return false;
    const t0 = c.currentTime + Math.min(15, d/343) + 0.05, T = Math.max(0.8, dur), o = out(E, q.pan, 0.25), f0 = 2900 + Math.random()*700;
    const os = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain(); os.type = 'sine';
    os.frequency.setValueAtTime(f0, t0); os.frequency.exponentialRampToValueAtTime(f0*0.42, t0 + T); lfo.frequency.value = 19 + Math.random()*8; lg.gain.value = 45; lfo.connect(lg); lg.connect(os.frequency);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.16*att, t0 + 0.12); g.gain.setValueAtTime(0.16*att, t0 + T*0.75); g.gain.exponentialRampToValueAtTime(0.0001, t0 + T);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.max(1800, lpf(d)*1.6); os.connect(g); g.connect(lp); lp.connect(o); os.start(t0); lfo.start(t0); os.stop(t0 + T + 0.05); lfo.stop(t0 + T + 0.05);
    return true;
  }
  // crackle (dragon eggs) and the crossettes' pops
  function crackle(x, y, z, dur, k, key){
    const E = eng(); if (!E) return false; const c = E.ctx, q = geo(x, y, z), d = q.d, att = Math.min(1.2, 1.0*(k || 1)/(1 + d/320)); if (att < 0.01 || !gate(key || 'crackle', 0.12)) return false;
    const t0 = c.currentTime + Math.min(15, d/343) + 0.01, T = Math.min(1.45, Math.max(0.12, dur)), o = out(E, q.pan, Math.min(0.8, 0.3 + d/2500));
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = key === 'pop' ? 500 : 800; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.max(700, lpf(d)*1.4);
    const g = c.createGain(); g.gain.setValueAtTime(0.75*att, t0); g.gain.setValueAtTime(0.75*att, t0 + T*0.7); g.gain.exponentialRampToValueAtTime(0.0001, t0 + T);
    src(c, C.ck, t0, key === 'pop' ? Math.random()*0.3 : 0, T, 0.85 + 0.3*Math.random()).connect(hp); hp.connect(lp); lp.connect(g); g.connect(o);
    return true;
  }
  return {boom, thump, whistle, crackle, pop:(x, y, z, k) => crackle(x, y, z, 0.16, (k || 1)*1.3, 'pop'), get stats(){ return Object.assign({}, C.n, {ctx:C.ctx ? C.ctx.state : 'none'}); }, live:() => !!eng(),
    // tests: render the sounds offline -> {name: {peak, rms}} (each sound alone, 4 s at 22.05 kHz, the listener at the camera)
    async offline(x, y, z){ const out = {};
      for (const [name, f] of [['boom', () => boom(x, y, z, 1, 1)], ['salute', () => boom(x, y, z, 1, 1.9)], ['thump', () => thump(x, y, z - 200, 1)], ['whistle', () => whistle(x, y, z - 100, 3, 1)], ['crackle', () => crackle(x, y, z, 1.2, 1)], ['pop', () => crackle(x, y, z, 0.16, 1.3, 'pop')]]){
        const ctx = new OfflineAudioContext(2, 22050*4, 22050), fx = ctx.createGain(), wb = ctx.createGain(); fx.connect(ctx.destination); wb.gain.value = 0.3; wb.connect(ctx.destination);
        EX = {ctx, bus:{fx}, wbus:{fx:wb}}; for (const k in C.last) C.last[k] = -1; let ok = false; try { ok = f(); } finally { EX = null; }
        const buf = await ctx.startRendering(), d = buf.getChannelData(0); let pk = 0, ss = 0, nan = 0; for (let i = 0; i < d.length; i++){ const v = d[i]; if (!isFinite(v)) nan++; else { if (Math.abs(v) > pk) pk = Math.abs(v); ss += v*v; } }
        let on = -1; for (let i = 0; i < d.length; i++) if (Math.abs(d[i]) > pk*0.1){ on = i/22050; break; }
        out[name] = {played:ok, peak:+pk.toFixed(3), rms:+Math.sqrt(ss/d.length).toFixed(4), onset:+on.toFixed(3), nan}; }
      C.ctx = null; return out; }};
})();
// ---- the runtime: the clock, shows (cue lists) and launches, events (sound, flashes), the race watcher, launch points
const FW = {T:0, seqs:[], EV:[], FL:[], sid:0, shells:0, ms:0, msMax:0, draws:0, lift:0, quiet:false, last:null,
  race:{W:{}, key:null, pts:null, log:[]}, col:new THREE.Color(1, 0.9, 0.7)};
const FX = {hOn:false, h0:0, h1:0, hc0:new THREE.Color(), hc1:new THREE.Color(), bOn:false, b0:new THREE.Color(), b1:new THREE.Color()};
const fwIsUS = () => { try { return typeof SGR_US !== 'undefined' && !!SGR_US; } catch (e){ return false; } };
const fwNight = () => typeof nightF === 'number' ? Math.max(0, Math.min(1, nightF)) : 0;
FWC.css = s => { try { const N = THREE.Color.NAMES; if (N && N[s] !== undefined){ const c = new THREE.Color(N[s]); return [c.r, c.g, c.b]; } } catch (e){ /* */ } return null; };
// the sea and fresh water of the land-cover raster (1 sea, 2 reservoirs / rivers)
function fwWater(x, y){ try { if (typeof nat === 'undefined' || typeof cx2i !== 'function') return false; const v = nat[cx2i(y)*N + cx2i(x)]; return v === 1 || v === 2; } catch (e){ return false; } }
function fwGround(x, y){ try { return Math.max(0, hC(x, y)); } catch (e){ return 0; } }
const _pv = new THREE.Vector3();
function fwInView(x, y, z){ try { _pv.set(x, z, -y).project(camera); return _pv.z > -1 && _pv.z < 1 && Math.abs(_pv.x) < 0.92 && _pv.y > -1 && _pv.y < 1.15; } catch (e){ return true; } }
// launch points [x, y, z, wet] ordered left -> right for an audience at (ax, ay)
function fwPts(list, ax, ay){
  const F = FWC.frameOf(list, ax, ay), L = F.list.map(p => { const w = fwWater(p[0], p[1]); return [p[0], p[1], w ? 0.8 : fwGround(p[0], p[1]) + 1, w]; });
  return {list:L, ux:F.ux, uy:F.uy, dx:F.dx, dy:F.dy, cx:F.cx, cy:F.cy, ax, ay, water:L.some(p => p[3])};
}
// a show where the camera looks: the nearest stretch of open water in view (within r of the look point), else open ground around it
function fwViewPts(o){
  const cam = camera.position, ax = cam.x, ay = -cam.z, given = o.x !== null && o.y !== null && isFinite(o.x) && isFinite(o.y);
  const tx = given ? +o.x : controls.target.x, ty = given ? +o.y : -controls.target.z, R = Math.max(200, Math.min(4000, +o.r || 1100));
  let L = FWC.pickWater(fwWater, tx, ty, {R, accept:given ? null : (x, y) => fwInView(x, y, 150)});
  if (!L.length){ let dx = tx - ax, dy = ty - ay; const l = Math.hypot(dx, dy); if (l < 1){ dx = 0; dy = 1; } else { dx /= l; dy /= l; } L = [-1, 0, 1].map(k => [tx + dy*k*110, ty - dx*k*110]); }
  return fwPts(L, ax, ay);
}
// the race: the circuit's own points (net.f1.fw), else water near the start line (Singapore: the Marina Bay basin)
function fwRacePts(TR){
  if (!TR || !TR.X) return null;
  if (FW.race.key === TR && FW.race.pts) return FW.race.pts;
  const F = TR.F || {}, i0 = TR.startI | 0, sx = TR.X[i0], sy = TR.Y[i0];
  let L = Array.isArray(F.fw) ? F.fw.filter(p => p && isFinite(p[0]) && isFinite(p[1])).map(p => [+p[0], +p[1]]) : [];
  if (!L.length && !fwIsUS() && typeof sgXY === 'function'){ const h = sgXY(1.2858, 103.8578); if (Math.hypot(h[0] - sx, h[1] - sy) < 3000) L = FWC.pickWater(fwWater, h[0], h[1], {R:520}); }
  if (!L.length) L = FWC.pickWater(fwWater, sx, sy, {R:1800});
  if (!L.length){ const nx = TR.NX ? TR.NX[i0] : 0, ny = TR.NY ? TR.NY[i0] : 1, dx = TR.DX ? TR.DX[i0] : 1, dy = TR.DY ? TR.DY[i0] : 0; L = [-1, 0, 1].map(k => [sx - nx*170 + dx*k*120, sy - ny*170 + dy*k*120]); }
  FW.race.key = TR; FW.race.pts = fwPts(L, sx, sy); return FW.race.pts;
}
function fwSeq(o, P){
  if (!FWG.init() || !P || !P.list.length) return null;
  const seed = isFinite(o.seed) ? o.seed >>> 0 : (Math.random()*4294967295) >>> 0, r = FWC.rng(seed), I = o.intensity === undefined || o.intensity === null ? 0.8 : FWC.clamp(+o.intensity, 0, 1);
  const cues = FWC.plan(Object.assign({}, o, {n:P.list.length, intensity:I}), r);
  const S = {id:++FW.sid, name:o.name || o.plan || 'show', tag:o.tag || 'manual', t0:FW.T, cues, i:0, P, r, scale:0.85 + 0.25*I, tint:o.theme === 'race' || o.theme === 'usa' || o.theme === 'win', dur:cues.length ? cues[cues.length - 1].at : 0, seed};
  FW.seqs.push(S); FW.last = P; fwUISync(); return S;
}
const fwView = (P, B) => { let x = P.ax - B[0], y = P.ay - B[1]; const l = Math.hypot(x, y) || 1; return [x/l, y/l]; };
// the mortar (thump, sometimes a whistle) now, the shell's break later: its stars are written when it breaks (a pending shell costs no
// particle slots), at the exact break time t0 (the shader places them from there)
function fwShellEvent(L, R, tb, kind, B, vB, o, r, whistle){
  if (L){ FW.EV.push({t:R ? tb - R.T : tb, a:'thump', x:L[0], y:L[1], z:L[2], k:0.6 + 0.35*o.size}); if (whistle && R) FW.EV.push({t:tb - R.T, a:'whistle', x:L[0], y:L[1], z:L[2] + 80, dur:R.T*0.85}); }
  FW.EV.push({t:tb, a:'shell', kind, B, vB, o, r});
}
function fwLaunch(S, c, tc){
  const P = S.P, L0 = P.list[c.p] || P.list[0], r = S.r, size = c.size*S.scale;
  const L = [L0[0] + (r() - 0.5)*6, L0[1] + (r() - 0.5)*6, L0[2]], tl = c.tilt || [0, 0];
  const hx = P.ux*tl[0] + P.dx*tl[1] + (r() - 0.5)*0.03, hy = P.uy*tl[0] + P.dy*tl[1] + (r() - 0.5)*0.03;
  const R = FWC.rocket(FWG.sink, L, c.H, tc, {tilt:[hx, hy], palm:c.kind === 'palm', wet:L0[3], day:1 - fwNight()}, r);
  FW.shells++; fwShellEvent(L, R, tc + R.T, c.kind, R.B, R.vB, {size, cols:FWC.cols(c.cols), wet:L0[3], view:fwView(P, R.B), tint:S.tint}, r, c.whistle);
}
function fwFire(e){
  if (e.a === 'shell'){
    const o = Object.assign({}, e.o, {day:1 - fwNight()}), B = e.B, I = FWC.shell(e.kind, FWG.sink, B, e.vB, e.t, o, e.r || Math.random);
    FW.FL.push({t:e.t, x:B[0], y:B[1], z:B[2], c:I.col || [1, 0.9, 0.7], k:(0.45 + 0.55*o.size)*(I.loud > 1.5 ? 2.2 : 1), e:0}); FW.sparksLast = I.n;
    if (I.crackle) FW.EV.push({t:e.t + I.crackle.t, a:'crackle', x:B[0], y:B[1], z:B[2], dur:I.crackle.dur, k:0.6 + 0.4*o.size});
    if (I.split) FW.EV.push({t:e.t + I.split, a:'pop', x:B[0], y:B[1], z:B[2], k:0.6 + 0.4*o.size});
    e = {t:e.t, a:'burst', x:B[0], y:B[1], z:B[2], size:o.size, loud:I.loud};
  }
  if (FW.quiet || FW.T - e.t > 0.6) return;     // fast-forwarded (tests): no sound for the past
  try {
    if (e.a === 'burst') FWA.boom(e.x, e.y, e.z, e.size, e.loud);
    else if (e.a === 'thump') FWA.thump(e.x, e.y, e.z, e.k);
    else if (e.a === 'whistle') FWA.whistle(e.x, e.y, e.z, e.dur, 1);
    else if (e.a === 'crackle') FWA.crackle(e.x, e.y, e.z, e.dur, e.k);
    else if (e.a === 'pop') FWA.pop(e.x, e.y, e.z, e.k);
  } catch (err){ /* sound is optional */ }
}
// the breaks light the night: the sky light and the sky colour lifted for a moment (applied around the render), the smoke lit by the
// four strongest flashes (smoke shader uniforms)
const FLS = [null, null, null, null];
function fwFlashes(){
  const T = FW.T, n = fwNight(), cp = camera.position, SU = FWG.SU; let tot = 0, r = 0, g = 0, b = 0;
  FLS[0] = FLS[1] = FLS[2] = FLS[3] = null;
  for (let i = FW.FL.length - 1; i >= 0; i--){ const f = FW.FL[i], a = T - f.t; if (a > 3.5){ FW.FL.splice(i, 1); continue; } if (a < 0){ f.e = 0; continue; }
    const e = f.e = f.k*(2.0*Math.exp(-a/0.07) + 0.3*Math.exp(-a/0.75)), d = Math.hypot(f.x - cp.x, f.z - cp.y, -f.y - cp.z)/1400, w = e/(1 + d*d);
    tot += w; r += f.c[0]*w; g += f.c[1]*w; b += f.c[2]*w;
    for (let k = 0; k < 4; k++){ if (!FLS[k] || FLS[k].e < e){ for (let m = 3; m > k; m--) FLS[m] = FLS[m - 1]; FLS[k] = f; break; } } }
  const gk = n*n;
  for (let k = 0; k < 4; k++){ const f = FLS[k]; if (f){ SU.uFL.value[k].set(f.x, f.z, -f.y, f.e*gk*0.35); SU.uFC.value[k].setRGB(f.c[0], f.c[1], f.c[2]); } else SU.uFL.value[k].set(0, -1e5, 0, 0); }
  FW.lift = Math.min(0.2, tot*0.07)*n;
  if (tot > 1e-4){ const m = Math.max(r, g, b) || 1; FW.col.setRGB(r/m, g/m, b/m); }
}
function fwEnv(){
  const SU = FWG.SU, n = fwNight();
  let k = 0.85*(1 - n) + 0.16; try { if (typeof hemi !== 'undefined') k = Math.min(1.05, hemi.intensity*0.7 + (typeof sun !== 'undefined' ? sun.intensity*0.42 : 0.2)); } catch (e){ /* */ }
  k = Math.max(0.1, k); const A = SU.uAmb.value; A.setRGB(k*0.72, k*0.72, k*0.74); try { if (typeof hemi !== 'undefined'){ A.r += hemi.color.r*k*0.3; A.g += hemi.color.g*k*0.3; A.b += hemi.color.b*k*0.3; } } catch (e){ /* */ }
  let w = 0.35; try { if (window.SGWx && SGWx.state) w = +SGWx.state.wind || 0.35; } catch (e){ /* */ }
  const s = 1.2 + 5.5*w; SU.uWind.value.set(0.92*s, 0.12, -0.39*s);
}
function fwStep(dt){
  FW.T += dt;
  fwRace();
  if (!FWG.inited) return;
  for (let i = FW.seqs.length - 1; i >= 0; i--){ const S = FW.seqs[i];
    while (S.i < S.cues.length){ const c = S.cues[S.i], tc = S.t0 + c.at; if (tc > FW.T) break; S.i++; try { fwLaunch(S, c, tc); } catch (e){ console.warn('[fireworks] launch', e); } }
    if (S.i >= S.cues.length){ FW.seqs.splice(i, 1); fwUISync(); } }
  // due events; at most two shells break per frame (a finale's simultaneous breaks are spread over a few frames: their stars keep the
  // exact break time t0, so a shell written a frame late only skips its first frame)
  let nb = 0;
  for (let i = 0; i < FW.EV.length;){ const e = FW.EV[i]; if (e.t <= FW.T && !(e.a === 'shell' && nb >= 2)){ if (e.a === 'shell') nb++; FW.EV[i] = FW.EV[FW.EV.length - 1]; FW.EV.pop(); fwFire(e); } else i++; }
  fwFlashes(); fwEnv();
  FW.draws = FWG.frame(FW.T, fwNight());
}
// ---- the F1 race (read only: SGF1.RACE / TR)
function fwRace(){
  const F = window.SGF1; if (!F) return; let R = null, TR = null; try { R = F.RACE; TR = F.TR; } catch (e){ return; } if (!R) return;
  const acts = FWC.raceStep(FW.race.W, {state:R.state, laps:R.laps, L:TR ? TR.L : 0, order:R.order, since:R.state === 'race' ? R.t - R.goT : -1});
  for (const a of acts){
    try {
      FW.race.log.push({T:+FW.T.toFixed(2), a:a.a, win:a.win}); if (FW.race.log.length > 30) FW.race.log.shift();
      if (a.a === 'reset'){ fwStopTag('race'); continue; }
      const P = fwRacePts(TR); if (!P) continue; const th = fwIsUS() ? 'usa' : 'race';
      if (a.a === 'salvo') fwSeq({plan:'salvo', theme:th, name:'race start', tag:'race'}, P);
      else if (a.a === 'lap') fwSeq({plan:'lap', theme:'lap', name:'final lap', tag:'race'}, P);
      else if (a.a === 'finale') fwSeq({plan:'show', seconds:a.win ? 55 : 45, intensity:a.win ? 1 : 0.72, theme:a.win ? 'win' : 'mixed', name:a.win ? 'victory finale' : 'finale', tag:'race'}, P);
      else if (a.a === 'salute') fwSeq({plan:'salute', theme:th, name:'salute', tag:'race'}, P);
    } catch (e){ console.warn('[fireworks] race', e); }
  }
}
function fwStopTag(tag){ const n = FW.seqs.length; FW.seqs = FW.seqs.filter(S => tag && S.tag !== tag); if (FW.seqs.length !== n) fwUISync(); }
// ---- the API
function fwBurst(x, y, z, o){
  o = o || {}; x = +x; y = +y; z = +z; if (!isFinite(x) || !isFinite(y)) return null; if (!FWG.init()) return null;
  const r = Math.random, tc = FW.T + Math.max(0, +o.t || 0), kind = FWC.kindOf(o.kind), day = 1 - fwNight(), size = FWC.clamp(+o.size || 1, 0.3, 2);
  let cl = FWC.cols(o.colors || o.cols || []); if (!cl.length) cl = FWC.cols([['red', 'gold', 'green', 'blue', 'purple', 'white', 'cyan', 'pink'][Math.floor(r()*8)], ['white', 'gold', 'red', 'green', 'blue'][Math.floor(r()*5)]]);
  const wet = fwWater(x, y), g = fwGround(x, y); if (!isFinite(z)) z = g + 200;
  const cam = camera.position, P = {ax:cam.x, ay:-cam.z};
  let R = null, B = [x, y, Math.max(z, g + 5)], L = null;
  if (o.rocket){ L = [x, y, wet ? 0.8 : g + 1]; R = FWC.rocket(FWG.sink, L, Math.max(30, B[2] - L[2]), tc, {wet, day, palm:kind === 'palm'}, r); B = R.B; }
  const tb = tc + (R ? R.T : 0); FW.shells++; FW.sparksLast = 0;
  fwShellEvent(L, R, tb, kind, B, R ? R.vB : [0, 0, 0], {size, cols:cl, wet, view:fwView(P, B)}, r, !!o.whistle);
  if (tb <= FW.T){ const e = FW.EV.pop(); fwFire(e); }      // now: the stars are written at once
  return {kind, at:+(tb - FW.T).toFixed(2), x:Math.round(B[0]), y:Math.round(B[1]), z:Math.round(B[2]), sparks:(tb <= FW.T ? FW.sparksLast : 0) + (R ? R.n : 0)};
}
function fwLaunchOne(x, y, o){ o = o || {}; const wet = fwWater(+x, +y), g = wet ? 0.8 : fwGround(+x, +y) + 1; return fwBurst(x, y, g + FWC.clamp(+o.height || 210, 60, 320), Object.assign({}, o, {rocket:true})); }
function fwShow(o){
  o = o || {}; if (!FWG.init()) return null;
  let P;
  if (Array.isArray(o.points) && o.points.length){ const L = o.points.filter(p => p && isFinite(p[0]) && isFinite(p[1])).map(p => [+p[0], +p[1]]); if (!L.length) return null; const cam = camera.position; P = fwPts(L, cam.x, -cam.z); }
  else P = fwViewPts(o);
  const S = fwSeq({plan:'show', seconds:FWC.clamp(+o.seconds || 45, 3, 600), intensity:o.intensity, theme:o.theme || 'mixed', seed:o.seed, name:o.name || 'show', tag:o.tag || 'manual'}, P);
  if (!S) return null;
  return {id:S.id, seconds:+S.dur.toFixed(1), shells:S.cues.length, water:P.water, points:P.list.map(p => [Math.round(p[0]), Math.round(p[1]), +p[2].toFixed(1), !!p[3]])};
}
function fwStop(hard){
  FW.seqs.length = 0;
  if (hard){ FW.EV.length = 0; FW.FL.length = 0; FW.lift = 0; FWG.clear(); }
  fwUISync(); return true;
}
function fwStats(){
  const al = FWG.alive(FW.T), SP = FWG.SP, SM = FWG.SM;
  return {on:fwOn(), T:+FW.T.toFixed(2), shows:FW.seqs.map(S => ({id:S.id, name:S.name, tag:S.tag, t:+(FW.T - S.t0).toFixed(1), dur:+S.dur.toFixed(1), shells:S.cues.length, launched:S.i})), shells:FW.shells,
    sparks:{cap:FWG.SP_CAP, drawn:SP ? SP.used : 0, alive:al.sparks, spawned:SP ? SP.n : 0}, smoke:{cap:FWG.SM_CAP, drawn:SM ? SM.used : 0, alive:al.smoke, spawned:SM ? SM.n : 0},
    drawCalls:FW.draws, ms:+FW.ms.toFixed(3), msMax:+FW.msMax.toFixed(3), events:FW.EV.length, flashes:FW.FL.length, lift:+FW.lift.toFixed(3), night:+fwNight().toFixed(2),
    points:FW.last ? FW.last.list.map(p => [Math.round(p[0]), Math.round(p[1]), !!p[3]]) : null, race:{state:FW.race.W.prev || null, log:FW.race.log.slice(-8), points:FW.race.pts ? FW.race.pts.list.map(p => [Math.round(p[0]), Math.round(p[1]), !!p[3]]) : null}, audio:FWA.stats, inited:FWG.inited};
}
const fwOn = () => FW.seqs.length > 0 || (FWG.inited && FW.T < FWG.until());
// ---- the UI: a 烟花 Fireworks row at the end of the drive pane, a fireworks button in the time bar after dark
const FWU = {row:null, tb:null, n:0, w:0, tn:0, t:0, st:''};
const FW_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/></svg>';
function fwCSS(){
  if (document.getElementById('fwCSS')) return; const st = document.createElement('style'); st.id = 'fwCSS';
  st.textContent = `.fwrow{margin-top:12px;padding-top:11px;border-top:1px solid var(--rule);display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.fwrow>b{font-size:13px;flex:1 1 100%;display:flex;align-items:center;gap:7px}.fwrow>b span{color:var(--muted);font-weight:500;font-size:11.5px}
.fwrow>b i{display:grid;place-items:center;width:22px;height:22px;border-radius:6px;background:#2b2140;color:#ffd27a}.fwrow>b i svg{width:16px;height:16px}
.fwrow button{appearance:none;border:1px solid var(--rule);background:var(--panel);color:var(--ink);border-radius:8px;padding:6px 10px;font:inherit;font-size:12px;font-weight:500;cursor:pointer}
.fwrow button.pri{background:#4b2a78;border-color:#3d2263;color:#fff;font-weight:600}
.fwrow button:disabled{opacity:.45;cursor:default}
.fwrow small{flex:1 1 100%;font:400 10px/1.45 var(--font-mono);color:var(--muted)}
.fwtb{display:none;width:34px;height:34px;flex:none;border:1px solid var(--rule);background:var(--panel);border-radius:8px;cursor:pointer;color:var(--ink);place-items:center;padding:0}
body.night .fwtb{display:grid}.fwtb svg{width:19px;height:19px}.fwtb:hover{background:var(--panel-2)}
.fwtb[aria-pressed="true"]{background:var(--ink);color:var(--panel)}`;
  document.head.appendChild(st);
}
const FW_NOTE = '约 45 秒，在镜头看着的地方（附近有水就在水上放）· F1 比赛熄灯、最后一圈和冲线时自动燃放 · ~45 s where the camera looks (over water when near) · F1 races: lights out, last lap, chequered flag';
function fwRow(){
  const pane = document.querySelector('.tray-pane[data-cat="f1"]');
  if (!pane){ if (++FWU.n < 60) setTimeout(fwRow, 500); return; }
  if (pane.querySelector('.fwrow')) return;
  // the other sections come first (drive cards, flying, the Cthulhu shortcut): give them a moment, then append after them either way
  if ((!pane.querySelector('.flypick') || !pane.querySelector('.kjshort')) && ++FWU.w < 12){ setTimeout(fwRow, 500); return; }
  fwCSS();
  const box = document.createElement('div'); box.className = 'fwrow';
  box.innerHTML = `<b><i>${FW_ICON}</i>烟花 <span>Fireworks</span></b><button type="button" class="pri" data-fw="go">▶ 放烟花 Launch show</button><button type="button" data-fw="stop" disabled>■ 停止 Stop</button><small id="fwNote">${FW_NOTE}</small>`;
  box.querySelector('[data-fw="go"]').addEventListener('click', () => fwUIStart());
  box.querySelector('[data-fw="stop"]').addEventListener('click', () => fwStop(false));
  pane.appendChild(box); FWU.row = box; fwUISync();
  // sections other modules add later (e.g. the city race picker) go above this row: move it back to the end a few times
  let moves = 0; const keep = () => { if (box.parentNode === pane && pane.lastElementChild !== box && moves++ < 6) pane.appendChild(box); };
  try { const mo = new MutationObserver(keep); mo.observe(pane, {childList:true}); setTimeout(() => mo.disconnect(), 60000); } catch (e){ /* */ }
  [2000, 6000, 15000].forEach(t => setTimeout(keep, t));
}
function fwTimebar(){
  const bar = document.getElementById('timebar'); if (!bar){ if (++FWU.tn < 40) setTimeout(fwTimebar, 500); return; }
  if (document.getElementById('fwTB')) return; fwCSS();
  const b = document.createElement('button'); b.type = 'button'; b.className = 'fwtb'; b.id = 'fwTB'; b.setAttribute('aria-pressed', 'false');
  b.title = '烟花表演（约 45 秒，镜头所看之处）· Fireworks show (~45 s, where the camera looks)'; b.setAttribute('aria-label', '烟花表演 Fireworks show'); b.innerHTML = FW_ICON;
  b.addEventListener('click', () => { if (FW.seqs.length) fwStop(false); else fwUIStart(); });
  bar.appendChild(b); FWU.tb = b;
}
function fwUIStart(){
  if (typeof SGR !== 'undefined' && !SGR.on){ if (typeof showToast === 'function') showToast('需要真实城市地图 · Needs the real city map'); return null; }
  const r = fwShow({seconds:45, intensity:0.85});
  if (r && typeof showToast === 'function') showToast(`烟花表演 · Fireworks show — ${r.water ? '水上 over the water' : '镜头所看之处 where the camera looks'} · 45 s`);
  return r;
}
function fwUISync(){
  const run = FW.seqs.length > 0, left = run ? Math.max(0, Math.ceil(Math.max(...FW.seqs.map(S => S.t0 + S.dur + 5)) - FW.T)) : 0, st = run + ':' + left;
  if (st === FWU.st) return; FWU.st = st;
  if (FWU.row){ const s = FWU.row.querySelector('[data-fw="stop"]'), n = FWU.row.querySelector('#fwNote'); if (s) s.disabled = !run; if (n) n.textContent = run ? `烟花表演中 · Show running — ${left} s` : FW_NOTE; }
  if (FWU.tb) FWU.tb.setAttribute('aria-pressed', String(run));
}
// ---- hooks
HOOKS.boot.push(() => { try { fwRow(); fwTimebar(); } catch (e){ console.warn('[fireworks] ui', e); } });
HOOKS.frame.push((t, dt) => {
  const a = performance.now(); fwStep(dt > 0 ? Math.min(dt, 0.1) : 0);
  if (FWG.inited){
    if (FW.lift > 0.003 && typeof scene !== 'undefined' && scene.background && scene.background.isColor){ const B = scene.background, k = FW.lift*0.1;
      FX.b0.copy(B); B.r = Math.min(1, B.r + FW.col.r*k); B.g = Math.min(1, B.g + FW.col.g*k); B.b = Math.min(1, B.b + FW.col.b*k); FX.b1.copy(B); FX.bOn = true; }
    if ((FWU.t += dt) > 0.5){ FWU.t = 0; fwUISync(); }
  }
  const ms = performance.now() - a; FW.ms = FW.ms*0.95 + ms*0.05; if (ms > FW.msMax) FW.msMax = ms;
});
HOOKS.prerender.push(() => {
  if (!FWG.inited || FW.lift <= 0.003 || typeof hemi === 'undefined') return;
  FX.h0 = hemi.intensity; FX.hc0.copy(hemi.color); hemi.intensity += FW.lift; hemi.color.lerp(FW.col, Math.min(0.3, FW.lift*1.2)); FX.h1 = hemi.intensity; FX.hc1.copy(hemi.color); FX.hOn = true;
});
HOOKS.render.push(() => {
  if (FX.hOn){ if (hemi.intensity === FX.h1 && hemi.color.equals(FX.hc1)){ hemi.intensity = FX.h0; hemi.color.copy(FX.hc0); } FX.hOn = false; }
  if (FX.bOn){ if (scene.background && scene.background.isColor && scene.background.equals(FX.b1)) scene.background.copy(FX.b0); FX.bOn = false; }
});
window.SGFireworks = {
  burst:(x, y, z, o) => { try { return fwBurst(x, y, z, o); } catch (e){ console.warn('[fireworks] burst', e); return null; } },
  show:o => { try { return fwShow(o); } catch (e){ console.warn('[fireworks] show', e); return null; } },
  launch:(x, y, o) => { try { return fwLaunchOne(x, y, o); } catch (e){ console.warn('[fireworks] launch', e); return null; } },
  stop:hard => fwStop(!!hard),
  get on(){ return fwOn(); },
  stats:() => fwStats(),
  get kinds(){ return FWC.KINDS.concat(['crackle', 'salute']); },
  // test handles: advance(sec) runs the clock (launches, events) without rendering; points(o) = where a show would go
  _test:{FWC, FWG, FWA, FW, advance(sec, step){ step = step || 1/30; const q = FW.quiet; FW.quiet = true; try { for (let t = 0; t < sec - 1e-9; t += step) fwStep(Math.min(step, sec - t)); } finally { FW.quiet = q; } return fwStats(); },
    points:o => { const P = fwViewPts(o || {}); return {water:P.water, list:P.list.map(p => [Math.round(p[0]), Math.round(p[1]), +p[2].toFixed(1), !!p[3]])}; },
    racePoints:() => { const F = window.SGF1, P = F && F.TR ? fwRacePts(F.TR) : null; return P ? P.list.map(p => [Math.round(p[0]), Math.round(p[1]), !!p[3]]) : null; },
    water:fwWater, ui:() => ({row:!!FWU.row, tb:!!FWU.tb, rowIndex:FWU.row ? [...FWU.row.parentNode.children].indexOf(FWU.row) : -1, sections:FWU.row ? [...FWU.row.parentNode.children].map(c => c.className) : null})}
};
}
