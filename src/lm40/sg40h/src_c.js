// ================================================================ Singapore Expo: Halls 1-6 (1999) along the curved band, Halls 7-10 (2005, sgexpo2)
const EXPO = {sp:{kp:'#cfcac0', kr:'#9a9890', gl:{c:'#6f8796', m:1, fh:5, cw:4}, cl:'#d6d8d6', rb:'#b7bcbf', rf:'#c9ccca', lv:'#5d6468', cn:'#f2f2ee', po:'#9aa0a4', bs:'#8d8b86', ft:'#4f6f8a'}};
LANDMARKS.sgexpo = {zh:'新加坡博览中心', en:'Singapore Expo', cat:'new', r:430, h:20,
  lt:{m:0, c:'#eef3f6', k:0.3, e:0.7},
  build(){
    const g = new THREE.Group(), T = mkT(), band = D.expo.band, H = 18, hull = (() => { const p = band.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0])*(b[1] - o[1]) - (a[1] - o[1])*(b[0] - o[0]), lo = [], up = [];
      for (const q of p){ while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); } for (let i = p.length - 1; i >= 0; i--){ const q = p[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); } up.pop(); lo.pop(); return lo.concat(up); })();
    T.prism('bs', band, -4, 0.4);
    const inn = offR(band, -4.5);
    T.walls('cl', inn, 0.4, H); T.cap('rf', inn, H);
    for (let i = 0; i < band.length; i++){
      const a = band[i], b = band[(i + 1) % band.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.5) continue;
      const [nx, nz] = outN(band, i), m = lerp2(a, b, 0.5), probe = [m[0] + nx*40, m[1] + nz*40];
      const foyer = inPoly(hull, probe[0], probe[1]) && !inPoly(band, probe[0], probe[1]);
      const ai = [a[0] - nx*4.5, a[1] - nz*4.5], bi = [b[0] - nx*4.5, b[1] - nz*4.5];
      if (foyer){
        // foyer walkway along the inner side: sloping glass curtain wall under a roof edge
        T.q('gl', [a[0], 0.4, a[1]], [b[0], 0.4, b[1]], [bi[0], 12.5, bi[1]], [ai[0], 12.5, ai[1]]);
        T.q('rf', [a[0] + nx*1.5, 12.8, a[1] + nz*1.5], [b[0] + nx*1.5, 12.8, b[1] + nz*1.5], [bi[0], 12.8, bi[1]], [ai[0], 12.8, ai[1]]);
        if (L > 6) for (let k = 0; k <= Math.floor(L/7.5); k++){ const p = lerp2(a, b, k/Math.max(1, Math.floor(L/7.5))); T.beam('po', [p[0], 0.4, p[1]], [p[0] - nx*4.5, 12.6, p[1] - nz*4.5], 0.12); }
      } else {
        // metal-clad hall walls with vertical ribs
        T.q('cl', [a[0], 0.4, a[1]], [b[0], 0.4, b[1]], [b[0], H, b[1]], [a[0], H, a[1]]);
        T.q('rf', [a[0], H, a[1]], [b[0], H, b[1]], [bi[0], H, bi[1]], [ai[0], H, ai[1]]);
        const n = Math.floor(L/5); for (let k = 1; k < n; k++){ const p = lerp2(a, b, k/n); T.ob('rb', p[0] + nx*0.2, p[1] + nz*0.2, nx, nz, 0.2, 0.15, 0.4, H - 0.6, true); }
        T.q('rb', [a[0] + nx*0.05, 0.4, a[1] + nz*0.05], [b[0] + nx*0.05, 0.4, b[1] + nz*0.05], [b[0] + nx*0.05, 3.2, b[1] + nz*0.05], [a[0] + nx*0.05, 3.2, a[1] + nz*0.05]);
      }
    }
    T.walls('cn', offR(band, -0.05), H - 0.9, H + 0.6);
    // hall divisions and the motorised ventilation louvre ridges on the roof
    for (const dv of D.expo.divs){ const a = dv[0], b = dv[dv.length - 1]; T.seg('lv', a, b, 1.6, H, H + 1.8); T.seg('cn', a, b, 0.4, H, H + 2.4); }
    const u = D.expo.u;
    for (const dv of D.expo.divs){ for (const off of [-33, 33]){ const a = [dv[0][0] + u[0]*off, dv[0][1] + u[1]*off], b = [dv[dv.length - 1][0] + u[0]*off, dv[dv.length - 1][1] + u[1]*off];
      const pts = []; for (let k = 0; k <= 20; k++){ const p = lerp2(a, b, k/20); if (inPoly(inn, p[0], p[1])) pts.push(p); } if (pts.length > 3) T.seg('lv', pts[0], pts[pts.length - 1], 1.1, H, H + 1.2); } }
    // covered walkways (the arms of the footprint, incl. the link towards Halls 7-10)
    for (const ar of D.expo.arms){ T.prism('cn', ar, 4.6, 5.2); for (let i = 0; i < ar.length; i += 2){ const p = ar[i]; T.cyl('po', p[0], p[1], -1, 4.6, 0.16, 0.16, 6); } }
    keepers(T, 'sgexpo'); T.flush(g, EXPO.sp);
    return g;
  }};
SG_PLACES.push({type:'sgexpo', lat:1.3341434, lon:103.9589725, rot:0});
LANDMARKS.sgexpo2 = {zh:'新加坡博览中心', en:'Singapore Expo', cat:'new', r:195, h:18, label:false,
  lt:{m:0, c:'#eef3f6', k:0.3, e:0.7},
  build(){
    const g = new THREE.Group(), T = mkT();
    D.expo2.h.forEach((r, i) => {
      const H = i === 3 ? 15 : 16.5, b = obb(r);
      T.prism('bs', r, -4, 0.4); T.walls('cl', r, 0.4, H); T.cap('rf', r, H);
      facade(T, r, 0.4, H - 0.4, {fin:'rb', step:5, d:0.35, w:0.3});
      facade(T, r, 0.4, H, {band:'rb', fh:100, b0:2.6, bh:0.5, bd:0.1});
      T.ob('lv', b.cx, b.cz, b.ux, b.uz, b.L/2 - 8, 1.4, H, H + 1.6);
      for (const s of [-1, 1]) T.ob('lv', b.cx - b.uz*s*b.W/4, b.cz + b.ux*s*b.W/4, b.ux, b.uz, b.L/2 - 12, 0.9, H, H + 1.0);
      T.walls('cn', offR(r, -0.05), H - 0.8, H + 0.5);
      // glazed entrance bay on the short south-west end (towards the covered link)
      const e = [b.cx - b.ux*b.L/2, b.cz - b.uz*b.L/2]; T.ob('gl', e[0] - b.ux*0.3, e[1] - b.uz*0.3, b.ux, b.uz, 0.4, b.W/2 - 4, 0.4, 9);
    });
    keepers(T, 'sgexpo2'); T.flush(g, EXPO.sp);
    return g;
  }};
SG_PLACES.push({type:'sgexpo2', lat:1.3378966, lon:103.962342, rot:0});

// ================================================================ Changi Chapel and Museum: museum around a courtyard with the open-air replica chapel
LANDMARKS.sgchangichapel = {zh:'樟宜教堂与博物馆', en:'Changi Chapel and Museum', cat:'old', r:30, h:9,
  lt:{m:0, c:'#ffe6c4', k:0.35, e:0.8},
  build(){
    const g = new THREE.Group(), T = mkT(), m = D.chapel.m, b = obb(m), ux = b.ux, uz = b.uz, vx = -uz, vz = ux;
    const P = (s, t) => [b.cx + ux*s + vx*t, b.cz + uz*s + vz*t], V = (s, y, t) => { const p = P(s, t); return [p[0], y, p[1]]; };
    const cl = b.L/2 - 6.5, cw = b.W/2 - 5.5, court = [P(-cl, -cw), P(cl, -cw), P(cl, cw), P(-cl, cw)];
    T.prism('pl', m, -5, 0.4);
    T.walls('wa', m, 0.4, 6.4); T.walls('wa', court.slice().reverse(), 0.4, 6.4);
    // roof slab with a hole over the courtyard
    { const v = m.map(p => new THREE.Vector2(p[0], p[1])), h = court.map(p => new THREE.Vector2(p[0], p[1])), f = THREE.ShapeUtils.triangulateShape(v, [h]), all = m.concat(court);
      for (const t of f) T.tri('rf', [all[t[0]][0], 6.4, all[t[0]][1]], [all[t[1]][0], 6.4, all[t[1]][1]], [all[t[2]][0], 6.4, all[t[2]][1]]); }
    T.walls('tr', offR(m, 0.15), 5.7, 6.7);
    facade(T, m, 0.4, 5.6, {fin:'tr', step:1.2, d:0.18, w:0.08, finH:(k, i) => (k % 9 < 5 ? 0.95 : 0)});
    // the replica chapel: timber platform, posts and open pitched frame, altar with the cross, rows of benches
    const L2 = cl - 1.5, W2 = Math.min(cw - 1.2, 4.2);
    T.ob('tm', b.cx, b.cz, ux, uz, L2, W2, 0.4, 0.75);
    for (let k = 0; k <= 6; k++){ const s = -L2 + 2*L2*k/6; for (const t of [-W2 + 0.3, W2 - 0.3]){ const p = P(s, t); T.ob('tm', p[0], p[1], ux, uz, 0.13, 0.13, 0.75, 4.2); } }
    T.gab('at', b.cx, b.cz, ux, uz, L2 + 0.6, W2 + 0.9, 4.1, 2.2, null);
    for (const t of [-W2 + 0.3, W2 - 0.3]){ const p = P(0, t); T.ob('tm', p[0], p[1], ux, uz, L2, 0.12, 3.95, 4.2); }
    const al = P(L2 - 0.9, 0); T.ob('tm', al[0], al[1], ux, uz, 0.45, 1.2, 0.75, 1.75);
    const cr = P(L2 - 0.95, 0); T.ob('br', cr[0], cr[1], ux, uz, 0.05, 0.05, 1.75, 2.55); { const c2 = P(L2 - 0.95, 0); T.ob('br', c2[0], c2[1], ux, uz, 0.05, 0.28, 2.2, 2.3); }
    for (let k = 0; k < 6; k++){ const s = -L2 + 1.2 + k*1.5; for (const t of [-1.9, 1.9]){ const p = P(s, t); T.ob('tm', p[0], p[1], ux, uz, 0.22, 1.3, 0.75, 1.2); } }
    // glass and timber canopy over the courtyard
    for (let k = 0; k <= 5; k++){ const s = -cl + 2*cl*k/5, a = V(s, 6.9, -cw), c = V(s, 6.9, cw); T.beam('tm', a, c, 0.14); }
    T.q('gs', V(-cl, 7.05, -cw), V(cl, 7.05, -cw), V(cl, 7.05, cw), V(-cl, 7.05, cw));
    T.flush(g, {pl:'#a9a397', wa:'#e9e5dc', rf:'#8f8b84', tr:'#7a5a3e', tm:'#8a6440', at:'#6e5636', br:{c:'#c9a24a', glow:'#ffd27a', gk:0.8}, gs:{c:'#cfe3ea', op:0.35, ds:true}});
    return g;
  }};
SG_PLACES.push({type:'sgchangichapel', lat:1.3621854, lon:103.9740249, rot:0});

// ================================================================ Sri Senpaga Vinayagar Temple: 21 m Raja Gopuram towards Ceylon Road, gilded vimana dome
LANDMARKS.sgsenpaga = {zh:'斯里善巴加维纳雅加兴都庙', en:'Sri Senpaga Vinayagar Temple', cat:'old', r:40, h:21,
  lt:{m:0, c:'#ffe0b0', k:0.55, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), T = mkT(), t = D.senp.t, an = D.senp.a, b = obb(t);
    // axis: +s points to the Ceylon Road (north-east) end
    let ux = b.ux, uz = b.uz; if ((b.cx + ux*b.L/2 - 40)**2 + (b.cz + uz*b.L/2 + 20)**2 > (b.cx - ux*b.L/2 - 40)**2 + (b.cz - uz*b.L/2 + 20)**2){ ux = -ux; uz = -uz; }
    const vx = -uz, vz = ux, P = (s, w) => [b.cx + ux*s + vx*w, b.cz + uz*s + vz*w], hl = b.L/2;
    T.prism('gr', t, -4, 0.9);
    // mandapam hall, cornice and parapet with small shrine pavilions
    T.walls('wa', t, 0.9, 8.5); T.cap('rf', t, 8.5); T.walls('co', offR(t, 0.35), 7.6, 8.2); T.walls('wa', offR(t, -0.1), 8.5, 9.4);
    // sculpted parapet frieze: alternating painted niches along the top of the hall
    for (let i = 0; i < t.length; i++){ const a = t[i], c = t[(i + 1) % t.length], L = Math.hypot(c[0] - a[0], c[1] - a[1]), [nx, nz] = outN(t, i), n = Math.floor(L/1.6);
      for (let k = 0; k < n; k++){ const p = lerp2(a, c, (k + 0.2)/n), q = lerp2(a, c, (k + 0.8)/n), cc = ['ye', 'rd', 'bl', 'sh'][k % 4];
        T.q(cc, [p[0] + nx*0.08, 8.6, p[1] + nz*0.08], [q[0] + nx*0.08, 8.6, q[1] + nz*0.08], [q[0] + nx*0.08, 9.25, q[1] + nz*0.08], [p[0] + nx*0.08, 9.25, p[1] + nz*0.08]); } }
    for (const [s, w] of [[hl - 9, b.W/2 - 1.5], [hl - 9, -b.W/2 + 1.5], [-hl + 2, b.W/2 - 1.5], [-hl + 2, -b.W/2 + 1.5]]){ const p = P(s, w); T.ob('pa', p[0], p[1], ux, uz, 1.0, 1.0, 9.4, 11); T.hip('ye', p[0], p[1], ux, uz, 1.25, 1.25, 11, 1.2); }
    for (let s = -hl + 3; s < hl - 9; s += 3.2) for (const w of [b.W/2, -b.W/2]){ const p = P(s, w*0.98); T.ob('co', p[0], p[1], ux, uz, 0.3, 0.3, 0.9, 7.6); }
    // Raja Gopuram (21 m): solid base, five tapering tiers with sculpted bands, barrel-vault crown with kalasam finials
    const gs = hl - 3.6, gW = 6.2, gD = 3.6;
    T.ob('gr', ...P(gs, 0), ux, uz, gD, gW, 0.9, 7.5);
    T.ob('dk', ...P(gs + gD + 0.02, 0), ux, uz, 0.05, 1.3, 0.9, 5.2);
    let y = 7.5;
    const TC = ['pa', 'ye', 'rd', 'bl', 'pa'];
    for (let k = 0; k < 5; k++){
      const f0 = 1 - k*0.13, f1 = 1 - (k + 1)*0.13, h = 2.1;
      const a = [], c = [];
      for (const [s, w] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ const p0 = P(gs + s*gD*f0*0.92, w*gW*f0), p1 = P(gs + s*gD*f1*0.92, w*gW*f1); a.push([p0[0], y, p0[1]]); c.push([p1[0], y + h, p1[1]]); }
      for (let j = 0; j < 4; j++) T.q(TC[k], a[j], a[(j + 1) % 4], c[(j + 1) % 4], c[j]);
      T.ob('co', ...P(gs, 0), ux, uz, gD*f1*0.95 + 0.25, gW*f1 + 0.25, y + h - 0.3, y + h);
      for (let j = -2; j <= 2; j++){ const p = P(gs + gD*f0*0.95, j*gW*f0*0.38); T.ob('sh', p[0], p[1], ux, uz, 0.25, 0.45, y + 0.25, y + 1.6); const q = P(gs - gD*f0*0.95, j*gW*f0*0.38); T.ob('sh', q[0], q[1], ux, uz, 0.25, 0.45, y + 0.25, y + 1.6); }
      y += h;
    }
    { // barrel-vault crown along the width
      const n = 8, rr = gD*0.35, wl = gW*0.35;
      for (let k = 0; k < n; k++){ const a0 = Math.PI*k/n, a1 = Math.PI*(k + 1)/n; const q = (aa, w) => { const p = P(gs + Math.cos(aa)*rr, w); return [p[0], y + Math.sin(aa)*rr*1.5, p[1]]; };
        T.q('rd', q(a0, -wl), q(a1, -wl), q(a1, wl), q(a0, wl)); }
      for (let j = -2; j <= 2; j++){ const p = P(gs, j*wl*0.45); T.cyl('go', p[0], p[1], y + rr*1.4, y + rr*1.4 + 1.2, 0.28, 0.06, 6); }
    }
    // vimana over the sanctum with the gold-leaf dome
    const vp = P(-hl*0.45, 0);
    T.ob('pa', vp[0], vp[1], ux, uz, 3.0, 3.0, 8.5, 10.6); T.ob('ye', vp[0], vp[1], ux, uz, 2.3, 2.3, 10.6, 12.2); T.ob('pa', vp[0], vp[1], ux, uz, 1.6, 1.6, 12.2, 13.0);
    LLathe(g, [[0.01, 0], [1.55, 0.05], [1.9, 0.6], [1.75, 1.4], [1.1, 2.1], [0.35, 2.5], [0.2, 2.9], [0.32, 3.2], [0.05, 3.9]], vp[0], 13.0, vp[1], {c:'#d8a93a', glow:'#ffc25a', gk:0.9}, 12);
    // three-storey annex (classrooms, halls)
    T.prism('an', an, -4, 11.5, 'rf'); facade(T, an, 0.5, 11.5, {band:'co', fh:3.8, bh:0.35, bd:0.2}); T.walls('an', offR(an, -0.05), 11.5, 12.3);
    keepers(T, 'sgsenpaga');
    T.flush(g, {kp:'#ece4d2', kr:'#9d968a', gr:'#c9bfae', wa:'#f1e6cf', rf:'#9d968a', co:'#e4d2a8', pa:'#efe2c3', ye:'#e6b44c', rd:'#b9483a', bl:'#4f7fae', sh:'#d98a4a', dk:'#4a3b30', go:{c:'#d8a93a', glow:'#ffc25a', gk:0.9}, an:'#eee7d6'});
    return g;
  }};
SG_PLACES.push({type:'sgsenpaga', lat:1.3054387, lon:103.9024068, rot:0});

// ================================================================ The Red House (Katong): two-storey red-fronted building on East Coast Road
LANDMARKS.sgredhouse = {zh:'红屋（加东）', en:'The Red House (Katong)', cat:'old', r:22, h:11.5,
  lt:{m:0, c:'#ffe0b8', k:0.4, e:0.7, anim:'breathe'},
  build(){
    const g = new THREE.Group(), T = mkT(), r = D.red.r, b = obb(r);
    // front = the short end towards East Coast Road (south-east)
    let ux = b.ux, uz = b.uz; if (ux*0.55 + uz*0.83 < 0){ ux = -ux; uz = -uz; }
    const vx = -uz, vz = ux, hl = b.L/2, hw = b.W/2, V = (s, y, w) => [b.cx + ux*s + vx*w, y, b.cz + uz*s + vz*w];
    const fq = (c, w0, w1, y0, y1, e) => T.q(c, V(hl + e, y0, w0), V(hl + e, y0, w1), V(hl + e, y1, w1), V(hl + e, y1, w0));
    T.prism('wa', r, -3, 9.0, 'rf');
    T.gab('rf', b.cx - ux*1, b.cz - uz*1, ux, uz, hl - 1, hw + 0.4, 9.0, 2.5, 'wa');
    fq('red', -hw, hw, 0, 10.0, 0.06);
    for (const w of [-hw + 0.3, -hw/3, hw/3, hw - 0.3]){ const p = V(hl + 0.2, 0, w); T.ob('wt', p[0], p[2], ux, uz, 0.2, 0.25, 0, 10.2); }
    fq('wt', -hw, hw, 4.5, 4.9, 0.3); fq('wt', -hw, hw, 8.6, 9.0, 0.32); fq('wt', -hw, hw, 9.9, 10.2, 0.25);
    // arched openings: ground floor shopfront and upper windows (arch heads in white)
    for (const k of [-1, 0, 1]){
      const w = k*hw*2/3;
      fq('gl', w - 1.2, w + 1.2, 0.2, 3.4, 0.1);
      fq('gl', w - 0.7, w + 0.7, 5.4, 7.6, 0.1); fq('tm', w - 1.05, w - 0.72, 5.4, 7.6, 0.14); fq('tm', w + 0.72, w + 1.05, 5.4, 7.6, 0.14);
      for (let j = 0; j < 6; j++){ const a0 = Math.PI*j/6, a1 = Math.PI*(j + 1)/6, R = 0.85;
        T.q('wt', V(hl + 0.16, 7.6 + Math.sin(a0)*R*0.7, w + Math.cos(a0)*R), V(hl + 0.16, 7.6 + Math.sin(a1)*R*0.7, w + Math.cos(a1)*R), V(hl + 0.16, 7.6 + Math.sin(a1)*0.55*0.7, w + Math.cos(a1)*0.55), V(hl + 0.16, 7.6 + Math.sin(a0)*0.55*0.7, w + Math.cos(a0)*0.55)); }
    }
    T.flush(g, {wa:'#efe8dc', rf:'#9a4b36', red:'#c3262a', wt:'#f4efe6', gl:{c:'#2f3a40', glow:'#ffd08a', gk:0.6}, tm:'#5d3b27'});
    return g;
  }};
SG_PLACES.push({type:'sgredhouse', lat:1.3053905, lon:103.9036864, rot:0});

// ================================================================ Bedok Jetty (1966): the long fishing jetty of East Coast Park with its T-head
const JET = (() => {
  const J = D.jetty, A = J.path[0], B = J.path[1];
  // the jetty leaves the land where the path crosses the outer edge of the beach
  let s0 = 0; const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
  for (const ring of J.beach) for (let i = 0; i < ring.length; i++){ const p = ring[i], q = ring[(i + 1) % ring.length];
    const d = (B[0] - A[0])*(q[1] - p[1]) - (B[1] - A[1])*(q[0] - p[0]); if (Math.abs(d) < 1e-9) continue;
    const t = ((p[0] - A[0])*(q[1] - p[1]) - (p[1] - A[1])*(q[0] - p[0]))/d, u = ((p[0] - A[0])*(B[1] - A[1]) - (p[1] - A[1])*(B[0] - A[0]))/d;
    if (t > 0 && t < 1 && u >= 0 && u <= 1) s0 = Math.max(s0, t*L); }
  if (!s0) s0 = (J.shoreZ - A[1])/(B[1] - A[1])*L;
  const st = [A[0] + (B[0] - A[0])*s0/L, A[1] + (B[1] - A[1])*s0/L], o = lerp2(st, B, 0.5);
  return {st, o, ll:LL40(1.306883, 103.941632, o[0], o[1]), len:L - s0};
})();
LANDMARKS.sgbedokjetty = {zh:'勿洛海堤码头', en:'Bedok Jetty', cat:'old', r:Math.round(JET.len/2 + 45), h:7,
  lt:{m:0, c:'#fff0d8', k:0.25},
  build(){
    const g = new THREE.Group(), T = mkT(), o = JET.o, J = D.jetty, sh = p => [p[0] - o[0], p[1] - o[1]];
    const a = sh(JET.st), b = sh(J.path[1]), t0 = sh(J.tee[0]), t1 = sh(J.tee[1]), DK = 2.6, HW = 4.6;
    const run = (p, q, hw, posts) => {
      const dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz), ux = dx/L, uz = dz/L, vx = -uz, vz = ux;
      T.ob('dk', (p[0] + q[0])/2, (p[1] + q[1])/2, ux, uz, L/2, hw, DK - 0.45, DK, false, true);
      T.ob('be', (p[0] + q[0])/2, (p[1] + q[1])/2, ux, uz, L/2, hw - 0.5, DK - 1.2, DK - 0.45, true);
      for (const sg of [-1, 1]){ const ex = vx*sg*(hw - 0.08), ez = vz*sg*(hw - 0.08);
        T.ob('ra', (p[0] + q[0])/2 + ex, (p[1] + q[1])/2 + ez, ux, uz, L/2, 0.05, DK + 1.0, DK + 1.1, false);
        T.ob('ra', (p[0] + q[0])/2 + ex, (p[1] + q[1])/2 + ez, ux, uz, L/2, 0.03, DK + 0.5, DK + 0.56, false);
        for (let s = 0; s <= L; s += 2.5) T.box('ra', p[0] + ux*s + ex, DK, p[1] + uz*s + ez, 0.07, 1.1, 0.07);
        if (posts) for (let s = 2; s <= L - 1; s += 6) for (const f of [0.75, 0.1]) T.cyl('pi', p[0] + ux*s + vx*sg*hw*f, p[1] + uz*s + vz*sg*hw*f, -6, DK - 1.2, 0.3, 0.3, 6);
        for (let s = 12; s < L; s += 36) T.cyl('lb', p[0] + ux*s + ex*1.02, p[1] + uz*s + ez*1.02, DK + 0.25, DK + 0.95, 0.36, 0.36, 8);
      }
      return {L, ux, uz, vx, vz};
    };
    const R = run(a, b, HW, true); run(t1, t0, HW + 0.2, true);
    // covered shelters along the stem (open-sided, no seats) and street lights
    for (const f of [0.3, 0.58, 0.86]){ const c = [a[0] + R.ux*R.L*f, a[1] + R.uz*R.L*f];
      for (const s of [-5, 5]) for (const w of [-3.4, 3.4]) T.box('po', c[0] + R.ux*s + R.vx*w, DK, c[1] + R.uz*s + R.vz*w, 0.22, 2.9, 0.22);
      T.hip('ro', c[0], c[1], R.ux, R.uz, 6.2, 4.3, DK + 2.9, 1.4); }
    for (let s = 6; s < R.L; s += 24){ const c = [a[0] + R.ux*s + R.vx*(HW - 0.4), a[1] + R.uz*s + R.vz*(HW - 0.4)]; T.cyl('po', c[0], c[1], DK, DK + 5.5, 0.09, 0.07, 6); T.box('lm', c[0] - R.vx*0.4, DK + 5.4, c[1] - R.vz*0.4, 0.6, 0.18, 0.6); }
    T.flush(g, {dk:'#bdb6a8', be:'#8f8a80', ra:'#d9dcd8', pi:'#8b867c', lb:'#d9452f', po:'#6f757a', ro:'#3f6f8a', lm:{c:'#f2f0e8', glow:'#ffe2b0', gk:1.6}});
    return g;
  }};
SG_PLACES.push({type:'sgbedokjetty', lat:JET.ll[0], lon:JET.ll[1], rot:0});
