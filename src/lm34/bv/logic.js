// 纬壹 / 波那维斯达地标。每栋楼都坐在自己的 OSM 轮廓上（BV_FP），
// 高度用参考图 meta 里量到的屋顶减地面。局部坐标：x 向东，z 向南，y 向上。
// 材质走页面里的 LTris / lmMat，所以晚上会跟着城市的夜景灯一起亮。
(function () {
  if (typeof LANDMARKS === 'undefined' || typeof SG_PLACES === 'undefined' || typeof LTris === 'undefined') return;

  const TAU = Math.PI * 2;

  // ---------- 小工具：把很多三角形先攒进同一种材质，最后一次交给 LTris ----------
  function batch() {
    const M = new Map();
    return {
      p(col) {
        const k = typeof col === 'string' ? col : JSON.stringify(col);
        let e = M.get(k);
        if (!e) { e = { col: col, a: [] }; M.set(k, e); }
        return e.a;
      },
      flush(g) {
        M.forEach(function (e) { if (e.a.length) LTris(g, e.a, e.col); });
      }
    };
  }
  function tri(o, a, b, c) { o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); }
  function quad(o, a, b, c, d) { tri(o, a, b, c); tri(o, a, c, d); }
  function cen(P) {
    let x = 0, z = 0;
    for (let i = 0; i < P.length; i++) { x += P[i][0]; z += P[i][1]; }
    return [x / P.length, z / P.length];
  }
  function area(P) {
    let a = 0;
    for (let i = 0; i < P.length; i++) { const b = P[(i + 1) % P.length]; a += P[i][0] * b[1] - b[0] * P[i][1]; }
    return a / 2;
  }
  function pip(P, x, z) {
    let c = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const a = P[i], b = P[j];
      if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / ((b[1] - a[1]) || 1e-9) + a[0]) c = !c;
    }
    return c;
  }
  function clean(P) {
    const o = [];
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      if (!o.length || Math.hypot(p[0] - o[o.length - 1][0], p[1] - o[o.length - 1][1]) > 0.2) o.push([p[0], p[1]]);
    }
    if (o.length > 2 && Math.hypot(o[0][0] - o[o.length - 1][0], o[0][1] - o[o.length - 1][1]) < 0.2) o.pop();
    return o;
  }
  // 半平面裁切：留下 f(p) >= 0 的部分。用来把楼切成高低两段。
  function clipPoly(P, f) {
    if (!P || P.length < 3) return [];
    const out = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length], fa = f(a), fb = f(b);
      if (fa >= -1e-6) out.push(a);
      if ((fa >= 0) !== (fb >= 0)) {
        const t = fa / (fa - fb);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return clean(out);
  }
  function edgeOut(P, i) {
    const a = P[i], b = P[(i + 1) % P.length];
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
    let nx = dz / L, nz = -dx / L;
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    if (pip(P, mx + nx * 0.6, mz + nz * 0.6)) { nx = -nx; nz = -nz; }
    return { a: a, b: b, nx: nx, nz: nz, L: L, mx: mx, mz: mz, ang: Math.atan2(nz, nx) };
  }
  function lineHit(p, d, q, e) {
    const den = d[0] * e[1] - d[1] * e[0];
    if (Math.abs(den) < 1e-8) return null;
    const t = ((q[0] - p[0]) * e[1] - (q[1] - p[1]) * e[0]) / den;
    return [p[0] + d[0] * t, p[1] + d[1] * t];
  }
  // dist > 0 向外扩。尖角会被限制，避免偏移后戳出一根长刺。
  function offsetPoly(P, dist) {
    const n = P.length;
    if (n < 3) return P;
    const E = [];
    for (let i = 0; i < n; i++) E.push(edgeOut(P, i));
    const Q = [];
    for (let i = 0; i < n; i++) {
      const e0 = E[(i - 1 + n) % n], e1 = E[i];
      const p0 = [e0.a[0] + e0.nx * dist, e0.a[1] + e0.nz * dist];
      const d0 = [e0.b[0] - e0.a[0], e0.b[1] - e0.a[1]];
      const p1 = [e1.a[0] + e1.nx * dist, e1.a[1] + e1.nz * dist];
      const d1 = [e1.b[0] - e1.a[0], e1.b[1] - e1.a[1]];
      let hit = lineHit(p0, d0, p1, d1);
      if (!hit || Math.hypot(hit[0] - P[i][0], hit[1] - P[i][1]) > Math.abs(dist) * 5 + 2) {
        hit = [P[i][0] + e1.nx * dist, P[i][1] + e1.nz * dist];
      }
      Q.push(hit);
    }
    return clean(Q);
  }
  function safeOffset(P, dist) {
    const Q = offsetPoly(P, dist);
    if (Q.length < 3) return P.slice();
    const a0 = Math.abs(area(P)), a1 = Math.abs(area(Q));
    if (a0 > 1 && (a1 < a0 * 0.25 || a1 > a0 * 4)) return P.slice();
    return Q;
  }
  function chaikin(P, k) {
    let Q = P;
    for (let it = 0; it < k; it++) {
      const N = [];
      for (let i = 0; i < Q.length; i++) {
        const a = Q[i], b = Q[(i + 1) % Q.length];
        N.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
      }
      Q = N;
    }
    return Q;
  }
  function resample(P, n) {
    const seg = [];
    let L = 0;
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      seg.push({ a: a, b: b, s: L, l: l });
      L += l;
    }
    if (L < 1) return P.slice();
    const out = [];
    let j = 0;
    for (let k = 0; k < n; k++) {
      const s = k * L / n;
      while (j < seg.length - 1 && seg[j].s + seg[j].l < s) j++;
      const g = seg[j], t = g.l > 1e-6 ? (s - g.s) / g.l : 0;
      out.push([g.a[0] + (g.b[0] - g.a[0]) * t, g.a[1] + (g.b[1] - g.a[1]) * t]);
    }
    return out;
  }
  function smooth(P, n) { return resample(chaikin(clean(P), 2), n || 36); }

  function cap(o, P, y, flip) {
    if (!P || P.length < 3) return;
    let faces = null;
    try {
      faces = THREE.ShapeUtils.triangulateShape(P.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), []);
    } catch (e) { faces = null; }
    if (faces && faces.length) {
      for (let i = 0; i < faces.length; i++) {
        const f = faces[i], A = P[f[0]], B = P[f[1]], C = P[f[2]];
        if (!A || !B || !C) continue;
        if (flip) tri(o, [C[0], y, C[1]], [B[0], y, B[1]], [A[0], y, A[1]]);
        else tri(o, [A[0], y, A[1]], [B[0], y, B[1]], [C[0], y, C[1]]);
      }
      return;
    }
    const c = cen(P);
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      if (flip) tri(o, [b[0], y, b[1]], [a[0], y, a[1]], [c[0], y, c[1]]);
      else tri(o, [c[0], y, c[1]], [a[0], y, a[1]], [b[0], y, b[1]]);
    }
  }
  function walls(o, P, y0, y1) {
    if (y1 <= y0 || !P) return;
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      quad(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]);
    }
  }
  function extrude(o, P, y0, y1) {
    if (!P || P.length < 3 || y1 <= y0 + 0.01) return;
    walls(o, P, y0, y1);
    cap(o, P, y1, false);
    cap(o, P, y0, true);
  }
  function slab(o, P, y, t) { extrude(o, P, y, y + t); }
  // 沿边的水平挑板（遮阳百叶 / 楼板挑檐）：一根边、一个高度、向外伸 depth 米。
  function finEdge(o, e, y, depth, lip) {
    const a = e.a, b = e.b, n0 = 0.04;
    const a0 = [a[0] + e.nx * n0, y, a[1] + e.nz * n0];
    const b0 = [b[0] + e.nx * n0, y, b[1] + e.nz * n0];
    const a1 = [a[0] + e.nx * depth, y, a[1] + e.nz * depth];
    const b1 = [b[0] + e.nx * depth, y, b[1] + e.nz * depth];
    quad(o, a0, b0, b1, a1);
    if (lip) {
      const y2 = y + lip;
      quad(o, a1, b1, [b1[0], y2, b1[2]], [a1[0], y2, a1[2]]);
    }
  }
  function beam(o, a, b, r) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const L = Math.hypot(dx, dy, dz);
    if (L < 1e-3) return;
    const d = [dx / L, dy / L, dz / L];
    const up = Math.abs(d[1]) < 0.85 ? [0, 1, 0] : [1, 0, 0];
    let ux = d[1] * up[2] - d[2] * up[1], uy = d[2] * up[0] - d[0] * up[2], uz = d[0] * up[1] - d[1] * up[0];
    const ul = Math.hypot(ux, uy, uz) || 1;
    ux /= ul; uy /= ul; uz /= ul;
    const vx = d[1] * uz - d[2] * uy, vy = d[2] * ux - d[0] * uz, vz = d[0] * uy - d[1] * ux;
    function ring(p) {
      const s = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
      const R = [];
      for (let i = 0; i < 4; i++) R.push([p[0] + (ux * s[i][0] + vx * s[i][1]) * r, p[1] + (uy * s[i][0] + vy * s[i][1]) * r, p[2] + (uz * s[i][0] + vz * s[i][1]) * r]);
      return R;
    }
    const A = ring(a), B = ring(b);
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; quad(o, A[i], A[j], B[j], B[i]); }
  }
  function cylY(o, x, y0, y1, r, seg) {
    seg = seg || 10;
    if (y1 < y0) { const t = y0; y0 = y1; y1 = t; }
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * TAU, a1 = (i + 1) / seg * TAU;
      const c0 = Math.cos(a0) * r, s0 = Math.sin(a0) * r, c1 = Math.cos(a1) * r, s1 = Math.sin(a1) * r;
      quad(o, [x + c0, y0, s0], [x + c1, y0, s1], [x + c1, y1, s1], [x + c0, y1, s0]);
    }
  }
  function ellipse(cx, cz, rx, rz, n, rot) {
    const p = [], c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    for (let i = 0; i < n; i++) {
      const t = i / n * TAU, x = Math.cos(t) * rx, z = Math.sin(t) * rz;
      p.push([cx + x * c - z * s, cz + x * s + z * c]);
    }
    return p;
  }
  function bounds(P) {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < P.length; i++) {
      x0 = Math.min(x0, P[i][0]); x1 = Math.max(x1, P[i][0]);
      z0 = Math.min(z0, P[i][1]); z1 = Math.max(z1, P[i][1]);
    }
    return { x0: x0, x1: x1, z0: z0, z1: z1 };
  }
  // 屋顶上的光伏条：沿 x 切成一条条深色带。
  function stripes(B, P, y, col, w, gap) {
    const bb = bounds(P), o = B.p(col);
    for (let x = bb.x0 + 1.2; x < bb.x1 - 1; x += w + gap) {
      let Q = clipPoly(P, function (p) { return p[0] - x; });
      Q = clipPoly(Q, function (p) { return x + w - p[0]; });
      if (Q.length >= 3) cap(o, Q, y, false);
    }
  }
  function treeAt(B, x, y, z, s) {
    const tr = B.p({ c: '#6d543c', m: 0, ds: true });
    const lf = B.p({ c: '#4f8a3c', m: 0, ds: true });
    const lf2 = B.p({ c: '#3d6e32', m: 0, ds: true });
    cylY(tr, x, y, y + 1.6 * s, 0.18 * s, 5);
    cylY(lf, x, y + 1.3 * s, y + 3.1 * s, 1.15 * s, 6);
    cylY(lf2, x, y + 2.4 * s, y + 4.0 * s, 0.75 * s, 6);
  }
  // 玻璃幕墙：整面玻璃 + 每层一条横档 + 每隔几米一根竖梃。
  function curtain(B, P, y0, y1, opt) {
    P = clean(P);
    if (P.length < 3 || y1 <= y0) return;
    const glass = B.p(opt.glass), mull = B.p(opt.mull), band = B.p(opt.band || opt.mull);
    const bay = opt.bay || 3.2, fh = opt.fh || 4.0;
    walls(glass, safeOffset(P, -(opt.inset || 0.15)), y0, y1);
    for (let i = 0; i < P.length; i++) {
      const e = edgeOut(P, i);
      if (e.L < 1.2) continue;
      for (let y = y0 + 0.15; y < y1 - 0.2; y += fh) finEdge(band, e, y, opt.bandD || 0.55, opt.bandH || 0.28);
      const nB = Math.max(1, Math.round(e.L / bay));
      for (let k = 0; k <= nB; k++) {
        const t = k / nB;
        const x = e.a[0] + (e.b[0] - e.a[0]) * t, z = e.a[1] + (e.b[1] - e.a[1]) * t;
        beam(mull, [x + e.nx * 0.12, y0, z + e.nz * 0.12], [x + e.nx * 0.12, y1, z + e.nz * 0.12], opt.mw || 0.09);
      }
    }
    if (opt.parapet) {
      const O = safeOffset(P, 0.35);
      walls(band, O, y1, y1 + opt.parapet);
      cap(band, O, y1 + opt.parapet, false);
    }
  }
  // 实墙 + 窗洞。窗是贴在墙外的深色片，晚上靠 glow 发光。
  function punched(B, P, y0, y1, opt) {
    P = clean(P);
    if (P.length < 3) return;
    extrude(B.p(opt.wall), P, y0, y1);
    const win = B.p(opt.win), frm = B.p(opt.frame || opt.wall);
    const bay = opt.bay || 4.2, fh = opt.fh || 3.7, ww = opt.ww || 2.15, wh = opt.wh || 1.55, sill = opt.sill || 1.05;
    for (let i = 0; i < P.length; i++) {
      const e = edgeOut(P, i);
      if (e.L < 2.4) continue;
      if (opt.skip && opt.skip(e)) continue;
      const nB = Math.max(1, Math.round(e.L / bay));
      const tw = Math.min(ww, e.L / nB * 0.72);
      for (let k = 0; k < nB; k++) {
        const t = (k + 0.5) / nB;
        const x = e.a[0] + (e.b[0] - e.a[0]) * t, z = e.a[1] + (e.b[1] - e.a[1]) * t;
        const tx = (e.b[0] - e.a[0]) / e.L, tz = (e.b[1] - e.a[1]) / e.L;
        for (let y = y0 + sill; y + wh < y1 - 0.35; y += fh) {
          const o = 0.08;
          const hw = tw / 2;
          const a = [x - tx * hw + e.nx * o, y, z - tz * hw + e.nz * o];
          const b = [x + tx * hw + e.nx * o, y, z + tz * hw + e.nz * o];
          const c = [b[0], y + wh, b[2]];
          const d = [a[0], y + wh, a[2]];
          quad(win, a, b, c, d);
          finEdge(frm, { a: [x - tx * hw, z - tz * hw], b: [x + tx * hw, z + tz * hw], nx: e.nx, nz: e.nz }, y + wh, 0.22, 0.12);
        }
      }
    }
  }
  function parapet(B, P, y, h, col) {
    const O = safeOffset(P, 0.25);
    walls(B.p(col), O, y, y + h);
  }
  function pave(B, P) {
    if (!P || P.length < 3) return;
    slab(B.p({ c: '#d9d5cc', m: 0, lk: 0.05, ds: true }), P, 0, 0.22);
  }

  // 颜色。m:1 是玻璃塔的“格子窗夜景”，m:0 是泛光。不要在模型上写任何标志。
  const GL = { c: '#9eb0b8', m: 1, fh: 3.8, cw: 3.0, ds: true, glow: '#d5e4ee', gk: 0.04 };
  const GLB = { c: '#7f949e', m: 1, fh: 3.6, cw: 2.8, ds: true, glow: '#c9dbe6', gk: 0.04 };
  const MULL = { c: '#e7e4dc', m: 0, lk: 0.25, ds: true };
  const MULLD = { c: '#c5c8cc', m: 0, lk: 0.2, ds: true };
  const WHITE = { c: '#f3f5f4', m: 0, lk: 0.35, ds: true };
  const CONC = { c: '#cfc8bc', m: 0, lk: 0.12, ds: true };
  const WIN = { c: '#1b242c', m: 0, glow: '#ffd0a4', gk: 0.85, ds: true };
  const SOLAR = { c: '#1a3348', m: 0, glow: '#16324a', gk: 0.05, ds: true };
  const GRASS = { c: '#5c9144', m: 0, ds: true };
  const TEAL = { c: '#6fbfae', m: 0, lk: 0.15, ds: true };
  const METAL = { c: '#c9bba6', m: 0, lk: 0.22, ds: true };

  function byName(F, name) {
    for (let i = 0; i < F.parts.length; i++) if (F.parts[i].name === name) return clean(F.parts[i].p);
    return null;
  }
  function byId(F, id) {
    for (let i = 0; i < F.parts.length; i++) if (F.parts[i].id === id) return clean(F.parts[i].p);
    return null;
  }

  // ============================================================================================
  // 星悦汇 The Star Vista：北翼是罩在中庭上的折面玻璃壳，南翼是较低的坡屋顶。
  // ============================================================================================
  function buildStar(B, F) {
    // 折面壳不用“从中心放射”的圆顶：先把真实轮廓三角化，再细分，
    // 每个顶点按位置抬高。这样格子是铺在屋顶上的，不会汇到一个点。
    const P = byName(F, 'The Star Vista');
    pave(B, P);
    const bb = bounds(P);
    // 几块大平面，而不是一团随机起伏：北坡抬到一条斜脊，南坡再落回较低的屋面。
    // 脊的高度向两侧降低，所以从北面看是一整片往上收的折面。
    function hAt(x, z) {
      const u = (x - bb.x0) / (bb.x1 - bb.x0 || 1);
      const v = (z - bb.z0) / (bb.z1 - bb.z0 || 1); // 0 在北
      const side = 1 - Math.min(0.55, Math.abs(u - 0.46) * 0.7);
      const ridgeV = 0.34;
      let y;
      if (v <= ridgeV) {
        const t = v / ridgeV;
        y = 16 + (64 * side - 16) * t;
        // 北坡再被一条斜缝分成两块，接近照片里那道斜向的大折线。
        const seam = u * 0.85 + v;
        if (seam < 0.62) y += (0.62 - seam) * 22 * t;
      } else {
        const t = (v - ridgeV) / (1 - ridgeV);
        y = 64 * side * (1 - t) * 0.72 + 20 * t;
      }
      return Math.max(16, Math.min(74.5, y));
    }
    let pts = P.map(function (p) { return [p[0], p[1]]; });
    let faces = null;
    try { faces = THREE.ShapeUtils.triangulateShape(P.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), []); }
    catch (e) { faces = null; }
    if (!faces || !faces.length) {
      faces = [];
      for (let i = 1; i < P.length - 1; i++) faces.push([0, i, i + 1]);
    }
    for (let pass = 0; pass < 2; pass++) {
      const mid = new Map(), next = [];
      function mp(i, j) {
        const a = i < j ? i : j, b = i < j ? j : i, k = a + ':' + b;
        if (mid.has(k)) return mid.get(k);
        const id = pts.length;
        pts.push([(pts[a][0] + pts[b][0]) / 2, (pts[a][1] + pts[b][1]) / 2]);
        mid.set(k, id);
        return id;
      }
      for (let t = 0; t < faces.length; t++) {
        const f = faces[t], ab = mp(f[0], f[1]), bc = mp(f[1], f[2]), ca = mp(f[2], f[0]);
        next.push([f[0], ab, ca], [ab, f[1], bc], [ca, bc, f[2]], [ab, bc, ca]);
      }
      faces = next;
    }
    const gA = B.p({ c: '#e4ece7', m: 0, lk: 0.4, glow: '#f4fff6', gk: 0.08, ds: true });
    const gB = B.p({ c: '#c5d0cb', m: 0, lk: 0.28, glow: '#e7f3ea', gk: 0.05, ds: true });
    const mu = B.p(WHITE);
    const V = pts.map(function (p) { return [p[0], hAt(p[0], p[1]), p[1]]; });
    const seen = new Set();
    function edge(i, j) {
      const a = i < j ? i : j, b = i < j ? j : i, k = a + ':' + b;
      if (seen.has(k)) return;
      seen.add(k);
      if (Math.hypot(V[i][0] - V[j][0], V[i][2] - V[j][2]) < 8) return;
      beam(mu, V[i], V[j], 0.16);
    }
    for (let t = 0; t < faces.length; t++) {
      const f = faces[t], o = (t & 1) ? gA : gB;
      tri(o, V[f[0]], V[f[1]], V[f[2]]);
      edge(f[0], f[1]); edge(f[1], f[2]); edge(f[2], f[0]);
    }
    // 裙房：轮廓外墙，14 米以下是玻璃格子，再接到壳的檐口。
    const glass = B.p({ c: '#c5d0cc', m: 1, fh: 4.0, cw: 3.2, ds: true, glow: '#e7f2ea', gk: 0.06 });
    const band = B.p(WHITE);
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      const ya = hAt(a[0], a[1]), yb = hAt(b[0], b[1]);
      quad(glass, [a[0], 0.3, a[1]], [b[0], 0.3, b[1]], [b[0], 14, b[1]], [a[0], 14, a[1]]);
      quad(glass, [a[0], 14, a[1]], [b[0], 14, b[1]], [b[0], yb, b[1]], [a[0], ya, a[1]]);
      const e = edgeOut(P, i);
      if (e.L > 2) {
        for (let y = 0.4; y < 14; y += 4) finEdge(band, e, y, 0.4, 0.2);
      }
    }
  }

  // ============================================================================================
  // 大都会：两座横线条玻璃塔 + 中间的玻璃连廊。T1 113 m，T2 104 m。
  // ============================================================================================
  function louverTower(B, P, H, opt) {
    P = resample(chaikin(clean(P), 1), opt.n || 22);
    const glass = B.p(opt.dark ? GLB : GL);
    const fin = B.p(opt.fin || MULLD);
    const belt0 = H * 0.40, belt1 = H * 0.53;
    walls(glass, safeOffset(P, -0.2), 0.3, H);
    // 腰部退进一圈，做成空中大堂那条深色槽。
    walls(B.p({ c: '#5e727c', m: 1, fh: 4.2, cw: 4.5, ds: true, glow: '#d5e4f0', gk: 0.08 }), safeOffset(P, -2.4), belt0, belt1);
    for (let i = 0; i < P.length; i++) {
      const e = edgeOut(P, i);
      if (e.L < 1.5) continue;
      for (let y = 3.6; y < H - 1; y += opt.fh || 3.55) {
        if (y > belt0 - 0.2 && y < belt1 + 0.2) continue;
        finEdge(fin, e, y, 0.85, 0.16);
      }
      const nB = Math.max(1, Math.round(e.L / 8));
      for (let k = 0; k <= nB; k++) {
        const t = k / nB, x = e.a[0] + (e.b[0] - e.a[0]) * t, z = e.a[1] + (e.b[1] - e.a[1]) * t;
        beam(B.p(MULL), [x, 0.3, z], [x, H, z], 0.07);
      }
    }
    parapet(B, P, H, 2.4, MULLD);
    cap(B.p({ c: '#c5ccd1', m: 0, ds: true }), safeOffset(P, -1.2), H + 0.15, false);
    const c = cen(P);
    extrude(B.p(CONC), [[c[0] - 6, c[1] - 4], [c[0] + 6, c[1] - 4], [c[0] + 5, c[1] + 5], [c[0] - 4, c[1] + 4]], H, H + 5.5);
  }
  function buildMetro(B, F) {
    const t1 = byName(F, 'The Metropolis Tower 1');
    const t2 = byName(F, 'The Metropolis Tower 2');
    const link = byId(F, 1563020893);
    pave(B, t1); pave(B, t2);
    louverTower(B, t1, 113, { fh: 3.5 });
    louverTower(B, t2, 104, { fh: 3.5, dark: true });
    if (link) {
      curtain(B, link, 3.5, 14, { glass: { c: '#b7c6c4', m: 1, fh: 3.5, cw: 2.6, ds: true, glow: '#e8fff6', gk: 0.12 }, mull: WHITE, band: WHITE, bay: 2.8, fh: 3.5, bandD: 0.35, parapet: 0.8 });
      cap(B.p({ c: '#d5e6e2', m: 0, glow: '#e8fff8', gk: 0.2, ds: true }), safeOffset(link, -0.4), 14.05, false);
    }
  }

  // ============================================================================================
  // 波那维斯达站：绿顶站房跨在东西线高架两侧，下面是柱子和站厅。
  // ============================================================================================
  function pathFrame(pts) {
    const d = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
      d.push([dx / L, dz / L]);
    }
    return d;
  }
  function ribbon(B, pts, y0, y1, halfW, col) {
    const o = B.p(col), dir = pathFrame(pts);
    const L = [], R = [];
    for (let i = 0; i < pts.length; i++) {
      const nx = dir[i][1], nz = -dir[i][0];
      L.push([pts[i][0] + nx * halfW, pts[i][1] + nz * halfW]);
      R.push([pts[i][0] - nx * halfW, pts[i][1] - nz * halfW]);
    }
    for (let i = 0; i < pts.length - 1; i++) {
      quad(o, [L[i][0], y1, L[i][1]], [L[i + 1][0], y1, L[i + 1][1]], [R[i + 1][0], y1, R[i + 1][1]], [R[i][0], y1, R[i][1]]);
      quad(o, [L[i][0], y0, L[i][1]], [R[i][0], y0, R[i][1]], [R[i + 1][0], y0, R[i + 1][1]], [L[i + 1][0], y0, L[i + 1][1]]);
      quad(o, [L[i][0], y0, L[i][1]], [L[i + 1][0], y0, L[i + 1][1]], [L[i + 1][0], y1, L[i + 1][1]], [L[i][0], y1, L[i][1]]);
      quad(o, [R[i + 1][0], y0, R[i + 1][1]], [R[i][0], y0, R[i][1]], [R[i][0], y1, R[i][1]], [R[i + 1][0], y1, R[i + 1][1]]);
    }
    return { L: L, R: R };
  }
  // 把折线按固定步长重新取样，柱子和列车才不会被原始顶点的疏密带着走。
  function resampleOpen(pts, step) {
    const seg = [];
    let L = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      seg.push({ a: pts[i], b: pts[i + 1], s: L, l: l });
      L += l;
    }
    if (!seg.length) return pts.slice();
    const out = [];
    let j = 0;
    for (let s = 0; s <= L + 1e-6; s += step) {
      while (j < seg.length - 1 && seg[j].s + seg[j].l < s) j++;
      const g = seg[j], t = g.l > 1e-6 ? Math.min(1, (s - g.s) / g.l) : 0;
      out.push([g.a[0] + (g.b[0] - g.a[0]) * t, g.a[1] + (g.b[1] - g.a[1]) * t]);
    }
    return out;
  }
  function buildMRT(B, F) {
    const station = byId(F, 152592566);
    const annex = byId(F, 1131873757);
    const canopy = byId(F, 1187773826);
    const north = resampleOpen(BV_RAIL.north, 16).filter(function (p) { return p[0] > -190 && p[0] < 210; });
    const south = resampleOpen(BV_RAIL.south, 16).filter(function (p) { return p[0] > -190 && p[0] < 210; });
    function zAtX(pts, x) {
      if (x <= pts[0][0]) return pts[0][1];
      const last = pts[pts.length - 1];
      if (x >= last[0]) return last[1];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        if ((a[0] <= x && b[0] >= x) || (b[0] <= x && a[0] >= x)) {
          const t = (x - a[0]) / ((b[0] - a[0]) || 1);
          return a[1] + (b[1] - a[1]) * t;
        }
      }
      return pts[0][1];
    }
    // 屋顶按同一个 x 取两条轨道的中点，宽度盖住两侧轨道再加檐。
    const mid = [];
    for (let x = -140; x <= 60; x += 12) mid.push([x, (zAtX(north, x) + zAtX(south, x)) / 2]);
    const deckY = 10.15, roofY = 14.6;
    const span = Math.abs(zAtX(north, -40) - zAtX(south, -40));
    const roofHalf = span / 2 + 7;
    function track(pts) {
      ribbon(B, pts, deckY - 1.15, deckY, 2.35, CONC);
      ribbon(B, pts, deckY, deckY + 0.18, 1.55, { c: '#3a3d40', m: 0, ds: true });
      const dir = pathFrame(pts), rail = B.p({ c: '#6a6e72', m: 0, glow: '#ffe2b0', gk: 0.15, ds: true });
      for (let s = -1; s <= 1; s += 2) {
        for (let i = 0; i < pts.length - 1; i++) {
          const w = 0.55 * s;
          const a = pts[i], b = pts[i + 1];
          const ax = a[0] + dir[i][1] * w, az = a[1] - dir[i][0] * w;
          const bx = b[0] + dir[i + 1][1] * w, bz = b[1] - dir[i + 1][0] * w;
          quad(rail, [ax, deckY + 0.28, az], [bx, deckY + 0.28, bz], [bx, deckY + 0.42, bz], [ax, deckY + 0.42, az]);
        }
      }
      const col = B.p(CONC);
      for (let i = 0; i < pts.length; i += 2) {
        cylY(col, pts[i][0], 0, deckY - 1.15, 0.55, 8);
      }
    }
    track(north); track(south);
    // 绿顶：宽 34 m，只盖车站那一段（x 大约 -130 到 50）。
    const roofPts = mid.filter(function (p) { return p[0] > -135 && p[0] < 55; });
    if (roofPts.length >= 2) {
      const sides = ribbon(B, roofPts, roofY, roofY + 0.7, roofHalf, TEAL);
      const pier = B.p(CONC);
      for (let i = 0; i < roofPts.length; i += 2) {
        cylY(pier, sides.L[i][0], 0, roofY, 0.7, 6);
        cylY(pier, sides.R[i][0], 0, roofY, 0.7, 6);
      }
      const glass = B.p({ c: '#9eb4b6', m: 1, fh: 3.2, cw: 2.4, ds: true, glow: '#e5fff6', gk: 0.1 });
      for (let side = 0; side < 2; side++) {
        const S = side ? sides.R : sides.L;
        for (let i = 0; i < S.length - 1; i++) {
          quad(glass, [S[i][0], deckY + 0.4, S[i][1]], [S[i + 1][0], deckY + 0.4, S[i + 1][1]], [S[i + 1][0], roofY, S[i + 1][1]], [S[i][0], roofY, S[i][1]]);
        }
      }
      // 屋顶上四个通风天窗，沿站台均匀排开。
      const sk = B.p({ c: '#d9d2c4', m: 0, ds: true });
      for (let k = 1; k <= 4; k++) {
        const i = Math.round(k * (roofPts.length - 1) / 5);
        const p = roofPts[i];
        extrude(sk, [[p[0] - 7, p[1] - 4.2], [p[0] + 7, p[1] - 4.2], [p[0] + 7, p[1] + 4.2], [p[0] - 7, p[1] + 4.2]], roofY + 0.85, roofY + 2.5);
      }
    }
    // 南侧站厅：z 越大越靠南，轨道在北侧，所以只把轮廓的南半边做成实体站房。
    if (station) {
      const hall = clipPoly(station, function (p) { return p[1] + 28; });
      const use = hall.length >= 4 ? hall : station;
      extrude(B.p(CONC), use, 0.2, 7.2);
      curtain(B, safeOffset(use, -0.3), 7.2, deckY, { glass: GL, mull: MULLD, band: CONC, bay: 3.2, fh: 3.4, bandD: 0.3, inset: 0.1 });
    }
    if (annex) extrude(B.p(CONC), annex, 0.2, 8);
    if (canopy && Math.abs(area(canopy)) > 40) {
      slab(B.p(MULLD), canopy, 6.2, 0.4);
      cylY(B.p(CONC), cen(canopy)[0], 0, 6.2, 0.4, 6);
    }
    // 一列东西线列车，停在北侧轨道靠车站的位置。没有文字、没有标志。
    const cars = B.p({ c: '#e8e6e2', m: 0, glow: '#fff2d8', gk: 0.15, ds: true });
    const stripe = B.p({ c: '#b23b3b', m: 0, ds: true });
    let i0 = 0;
    for (let i = 1; i < north.length; i++) if (Math.abs(north[i][0] + 40) < Math.abs(north[i0][0] + 40)) i0 = i;
    for (let k = 0; k < 6; k++) {
      const i = i0 + k;
      if (i >= north.length - 1) break;
      const a = north[i], b = north[i + 1];
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      const dx = b[0] - a[0], dz = b[1] - a[1];
      const ang = Math.atan2(dz, dx);
      const box = [[-7.4, -1.45], [7.4, -1.45], [7.4, 1.45], [-7.4, 1.45]].map(function (p) {
        const c = Math.cos(ang), s = Math.sin(ang);
        return [mx + p[0] * c - p[1] * s, mz + p[0] * s + p[1] * c];
      });
      extrude(cars, box, deckY + 0.5, deckY + 4.15);
      extrude(stripe, safeOffset(box, 0.05), deckY + 2.3, deckY + 2.7);
    }
  }

  // ============================================================================================
  // 启奥园一期：三座带空中花园白环的曲面塔。北塔屋顶是椭圆草坪。
  // ============================================================================================
  function towerBands(B, P, H) {
    const ys = [0.22, 0.42, 0.62, 0.82];
    for (let i = 0; i < ys.length; i++) {
      const y0 = H * ys[i], y1 = y0 + 6.2;
      const O = safeOffset(P, 1.35);
      walls(B.p(WHITE), O, y0, y1);
      cap(B.p(WHITE), O, y1, false);
      cap(B.p(GRASS), safeOffset(P, 0.4), y0 + 0.35, false);
      // 白环上的交叉撑，远看就是照片里那几道斜格子。
      const br = B.p({ c: '#f7f8f6', m: 0, lk: 0.4, ds: true });
      for (let e = 0; e < O.length; e++) {
        const ed = edgeOut(O, e);
        if (ed.L < 4) continue;
        const nS = Math.max(1, Math.round(ed.L / 7));
        for (let k = 0; k < nS; k++) {
          const t0 = k / nS, t1 = (k + 1) / nS;
          const ax = ed.a[0] + (ed.b[0] - ed.a[0]) * t0, az = ed.a[1] + (ed.b[1] - ed.a[1]) * t0;
          const bx = ed.a[0] + (ed.b[0] - ed.a[0]) * t1, bz = ed.a[1] + (ed.b[1] - ed.a[1]) * t1;
          beam(br, [ax + ed.nx * 0.2, y0 + 0.4, az + ed.nz * 0.2], [bx + ed.nx * 0.2, y1 - 0.4, bz + ed.nz * 0.2], 0.12);
          beam(br, [bx + ed.nx * 0.2, y0 + 0.4, bz + ed.nz * 0.2], [ax + ed.nx * 0.2, y1 - 0.4, az + ed.nz * 0.2], 0.12);
        }
      }
      // 环上零星的树，表示空中花园。
      for (let e = 0; e < P.length; e += 2) {
        const ed = edgeOut(P, e);
        if (ed.L < 6) continue;
        treeAt(B, ed.mx + ed.nx * 1.6, y1, ed.mz + ed.nz * 1.6, 0.7);
      }
    }
  }
  function buildFusion(B, F) {
    const parent = byName(F, 'Fusionopolis 1');
    const cn = smooth(byName(F, 'Connexis North'), 40);
    const cs = smooth(byName(F, 'Connexis South'), 32);
    const sy = smooth(byName(F, 'Symbiosis'), 40);
    pave(B, parent);
    const glass = { c: '#b7c6cc', m: 1, fh: 4.0, cw: 2.6, ds: true, glow: '#e4f0f4', gk: 0.05 };
    function one(P, H, roof) {
      curtain(B, P, 0.3, H, { glass: glass, mull: WHITE, band: { c: '#d5dde0', m: 0, ds: true }, bay: 2.8, fh: 4.0, bandD: 0.42, bandH: 0.18, mw: 0.07, parapet: 1.1 });
      towerBands(B, P, H);
      roof(P, H);
    }
    one(cn, 134.1, function (P, H) {
      const c = cen(P);
      const oval = ellipse(c[0], c[1], 13.5, 21, 28, 0.15);
      cap(B.p(GRASS), oval, H + 0.4, false);
      walls(B.p(WHITE), safeOffset(oval, 1.3), H + 0.3, H + 3.2);
      // 草坪里再套一圈更小的绿，接近屋顶那只“眼睛”。
      cap(B.p({ c: '#6ea354', m: 0, ds: true }), ellipse(c[0], c[1], 7, 12, 20, 0.15), H + 0.55, false);
    });
    one(cs, 123, function (P, H) {
      const c = cen(P);
      const disk = ellipse(c[0], c[1], 11, 14, 24, 0.4);
      cap(B.p({ c: '#d5dbde', m: 0, ds: true }), disk, H + 0.3, false);
      walls(B.p(WHITE), disk, H, H + 2.2);
    });
    one(sy, 134.1, function (P, H) {
      const c = cen(P);
      cylY(B.p({ c: '#dfe4e6', m: 0, ds: true }), c[0], H, H + 3.2, 12, 20);
      cylY(B.p(MULLD), c[0], H + 3.2, H + 4.4, 7, 16);
      cap(B.p({ c: '#ece8e2', m: 0, ds: true }), ellipse(c[0], c[1], 7, 7, 16, 0), H + 4.4, false);
    });
    // 三座塔中间的玻璃中庭，大约 16 m 高。
    const court = ellipse(0, 4, 16, 18, 24, 0.2);
    curtain(B, court, 0.3, 16, { glass: { c: '#c5d4d0', m: 1, fh: 4, cw: 2.4, ds: true, glow: '#f2fff8', gk: 0.16 }, mull: WHITE, band: WHITE, bay: 2.6, fh: 4, parapet: 0.6 });
    // 通向星桥的天桥，画到两栋楼的中点，另一半由星桥那边接上。
    const tube = B.p({ c: '#e7eee8', m: 0, lk: 0.3, ds: true });
    const spine = [[22, -6], [36, -16], [48, -28], [58, -40]];
    for (let i = 0; i < spine.length - 1; i++) {
      const y = 16 + Math.sin(i / 2 * Math.PI) * 3;
      const y2 = 16 + Math.sin((i + 1) / 2 * Math.PI) * 3;
      beam(tube, [spine[i][0], y, spine[i][1]], [spine[i + 1][0], y2, spine[i + 1][1]], 2.1);
    }
  }

  // ============================================================================================
  // Solaris：整栋楼是一圈圈白楼板，南高北低，绿坡道绕着外圈往上爬。
  // ============================================================================================
  function buildSolaris(B, F) {
    const P = smooth(byName(F, 'Solaris'), 56);
    pave(B, P);
    const bb = bounds(P);
    function roofH(z) {
      const t = (z - bb.z0) / (bb.z1 - bb.z0 || 1); // 0 北，1 南
      return 46 + t * 34.1;
    }
    const fh = 3.55;
    const glass = { c: '#d5ddd8', m: 1, fh: 3.55, cw: 3.0, ds: true, glow: '#f3fff6', gk: 0.05 };
    for (let y = 0.4; y < 80; y += fh) {
      const zCut = bb.z0 + (y - 46) / 34.1 * (bb.z1 - bb.z0);
      let Q = y <= 46.2 ? P : clipPoly(P, function (p) { return p[1] - zCut; });
      if (Q.length < 4) continue;
      const wave = 1.15 + 0.55 * Math.sin(y * 0.18);
      const plate = safeOffset(Q, wave);
      slab(B.p(WHITE), plate, y + fh - 0.62, 0.55);
      walls(B.p(glass), safeOffset(Q, -0.8), y + 0.45, y + fh - 0.7);
      // 绿坡道：沿外轮廓连续的一段，随楼层转动。用顶点法线偏移，避免每条边各甩一块碎片。
      const spin = (y / 80) * TAU * 1.65;
      const VN = [];
      for (let i = 0; i < Q.length; i++) {
        const e0 = edgeOut(Q, (i - 1 + Q.length) % Q.length), e1 = edgeOut(Q, i);
        let nx = e0.nx + e1.nx, nz = e0.nz + e1.nz, L = Math.hypot(nx, nz) || 1;
        VN.push([nx / L, nz / L]);
      }
      const yb = y + fh - 0.05;
      let run = [];
      function flushRun() {
        if (run.length < 2) { run = []; return; }
        const g = B.p({ c: '#3f7a38', m: 0, ds: true });
        for (let k = 0; k < run.length - 1; k++) {
          const a = run[k], b = run[k + 1];
          quad(g, [a.i[0], yb, a.i[1]], [b.i[0], yb, b.i[1]], [b.o[0], yb, b.o[1]], [a.o[0], yb, a.o[1]]);
          quad(B.p(WHITE), [a.o[0], yb - 0.55, a.o[1]], [b.o[0], yb - 0.55, b.o[1]], [b.o[0], yb, b.o[1]], [a.o[0], yb, a.o[1]]);
        }
        const m = run[run.length >> 1];
        treeAt(B, (m.i[0] + m.o[0]) / 2, yb, (m.i[1] + m.o[1]) / 2, 1.6);
        run = [];
      }
      for (let i = 0; i < Q.length; i++) {
        const e = edgeOut(Q, i);
        let dAng = Math.abs(e.ang - spin);
        while (dAng > Math.PI) dAng -= TAU;
        dAng = Math.abs(dAng);
        const deep = Math.exp(-dAng * dAng * 2.2);
        if (deep > 0.55) {
          const extra = 2.4 + deep * 2.8, j = (i + 1) % Q.length;
          function off(idx, dist) { return [Q[idx][0] + VN[idx][0] * dist, Q[idx][1] + VN[idx][1] * dist]; }
          if (!run.length) run.push({ i: off(i, wave), o: off(i, wave + extra) });
          run.push({ i: off(j, wave), o: off(j, wave + extra) });
        } else flushRun();
      }
      flushRun();
    }
    // 南端尖顶加一层折面玻璃，对应西南翼那个三角网格中庭顶。
    const tip = clipPoly(P, function (p) { return p[1] - (bb.z0 + 0.72 * (bb.z1 - bb.z0)); });
    if (tip.length >= 4) {
      const c = cen(tip), ring = resample(tip, 16);
      const g = B.p({ c: '#dfe8e4', m: 0, glow: '#f4fff8', gk: 0.1, ds: true });
      const mu = B.p(WHITE);
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i], b = ring[(i + 1) % ring.length];
        const ya = 70 + (i % 2) * 3, yb = 70 + ((i + 1) % 2) * 3;
        tri(g, [c[0], 80, c[1]], [a[0], ya, a[1]], [b[0], yb, b[1]]);
        beam(mu, [c[0], 80, c[1]], [a[0], ya, a[1]], 0.16);
        beam(mu, [a[0], ya, a[1]], [b[0], yb, b[1]], 0.14);
      }
    }
    // 北屋面花园
    const northCap = clipPoly(P, function (p) { return (bb.z0 + 0.28 * (bb.z1 - bb.z0)) - p[1]; });
    if (northCap.length >= 4) {
      const bb2 = bounds(northCap);
      for (let x = bb2.x0 + 4; x < bb2.x1 - 3; x += 8) for (let z = bb2.z0 + 4; z < bb2.z1 - 3; z += 8) {
        if (pip(northCap, x, z)) treeAt(B, x, 46.4, z, 1.1);
      }
    }
  }

  // ============================================================================================
  // 星桥 Galaxis：棋盘格幕墙，东侧低层是紫色玻璃，底下架空。
  // ============================================================================================
  function buildGalaxis(B, F) {
    const P = clean(byName(F, 'Galaxis'));
    pave(B, P);
    const H = 93.7, fh = 3.85, bay = 4.35;
    const light = { c: '#e6e8ea', m: 0, lk: 0.2, ds: true };
    const dark = { c: '#5c6770', m: 1, fh: 3.85, cw: 4.35, ds: true, glow: '#d5dde4', gk: 0.12 };
    const purple = { c: '#6d4578', m: 1, fh: 3.6, cw: 3.2, ds: true, glow: '#e6d0f0', gk: 0.2 };
    // 内衬一层深色，格子之间不会漏空。
    walls(B.p({ c: '#3e464c', m: 0, ds: true }), safeOffset(P, -0.4), 0.3, H);
    const col = B.p(CONC);
    for (let i = 0; i < P.length; i++) {
      const e = edgeOut(P, i);
      if (e.L < 2) continue;
      const east = e.nx > 0.25;
      const nB = Math.max(1, Math.round(e.L / bay));
      const nF = Math.round(H / fh);
      for (let k = 0; k < nB; k++) {
        const t0 = k / nB, t1 = (k + 1) / nB;
        const ax = e.a[0] + (e.b[0] - e.a[0]) * t0, az = e.a[1] + (e.b[1] - e.a[1]) * t0;
        const bx = e.a[0] + (e.b[0] - e.a[0]) * t1, bz = e.a[1] + (e.b[1] - e.a[1]) * t1;
        for (let f = 0; f < nF; f++) {
          const y0 = 0.3 + f * fh, y1 = Math.min(H, y0 + fh - 0.18);
          // 东侧底部两层架空，只留柱。
          if (east && f < 2) continue;
          const spec = (east && f < 6) ? purple : ((k + f) & 1 ? light : dark);
          const o = 0.12;
          quad(B.p(spec),
            [ax + e.nx * o, y0, az + e.nz * o], [bx + e.nx * o, y0, bz + e.nz * o],
            [bx + e.nx * o, y1, bz + e.nz * o], [ax + e.nx * o, y1, az + e.nz * o]);
        }
        if (east) cylY(col, (ax + bx) / 2 + e.nx * 0.2, 0, 0.3 + 2 * fh, 0.42, 6);
      }
    }
    parapet(B, P, H, 1.4, light);
    cap(B.p({ c: '#d5d8dc', m: 0, ds: true }), safeOffset(P, -1), H + 0.1, false);
    const c = cen(P);
    extrude(B.p(MULLD), [[c[0] - 8, c[1] - 5], [c[0] + 9, c[1] - 4], [c[0] + 7, c[1] + 6], [c[0] - 6, c[1] + 5]], H, H + 4.2);
    // 天桥的另一半，接到和启奥园约定的中点。
    const tube = B.p({ c: '#e7eee8', m: 0, lk: 0.3, ds: true });
    const spine = [[-8, 22], [-22, 30], [-36, 38], [-48, 46]];
    for (let i = 0; i < spine.length - 1; i++) {
      beam(tube, [spine[i][0], 18, spine[i][1]], [spine[i + 1][0], 19.5, spine[i + 1][1]], 2.1);
    }
  }

  // ============================================================================================
  // 新传媒园区：北端是较低的绿屋顶，主体是香槟金曲面，屋顶有圆形冷却塔。
  // ============================================================================================
  function buildMedia(B, F) {
    const raw = byName(F, 'Mediacorp');
    const P = smooth(raw, 52);
    pave(B, P);
    const head = clipPoly(P, function (p) { return -18 - p[1]; }); // z 越小越北
    const body = clipPoly(P, function (p) { return p[1] + 8; });
    curtain(B, safeOffset(P, -0.5), 0.3, 16, { glass: { c: '#8ea0a6', m: 1, fh: 4, cw: 3.2, ds: true, glow: '#dceaf0', gk: 0.06 }, mull: METAL, band: METAL, bay: 3.4, fh: 4.0, bandD: 0.4, bandH: 0.35 });
    if (head.length >= 4) {
      walls(B.p(METAL), head, 16, 24);
      cap(B.p(GRASS), safeOffset(head, -1.5), 24.15, false);
      stripes(B, safeOffset(head, -4), 24.3, { c: '#3e6a34', m: 0, ds: true }, 2.2, 1.4);
    }
    if (body.length >= 4) {
      const Bin = safeOffset(body, -1.2);
      curtain(B, Bin, 16, 70, { glass: { c: '#b3a894', m: 1, fh: 4.15, cw: 3.6, ds: true, glow: '#f0e6d4', gk: 0.05 }, mull: METAL, band: { c: '#d9cbb8', m: 0, lk: 0.25, ds: true }, bay: 3.6, fh: 4.15, bandD: 0.7, bandH: 0.45, mw: 0.1 });
      // 西侧女儿墙收到实测的 76 m。
      for (let i = 0; i < body.length; i++) {
        const e = edgeOut(body, i);
        if (e.nx > -0.35 || e.L < 3) continue;
        quad(B.p(METAL),
          [e.a[0], 70, e.a[1]], [e.b[0], 70, e.b[1]], [e.b[0], 76, e.b[1]], [e.a[0], 76, e.a[1]]);
      }
      cap(B.p({ c: '#b7b3ac', m: 0, ds: true }), safeOffset(body, -2), 70.1, false);
      const c = cen(body);
      const tanks = [[-6, -6, 8], [8, 8, 7], [-2, 28, 9], [6, 48, 6.5], [-4, 70, 7]];
      for (let i = 0; i < tanks.length; i++) {
        const t = tanks[i];
        if (!pip(body, c[0] + t[0], c[1] + t[1])) continue;
        cylY(B.p({ c: '#c5c8c4', m: 0, ds: true }), c[0] + t[0], 70, 76, t[2], 14);
        cylY(B.p(MULLD), c[0] + t[0], 76, 77.2, t[2] * 0.72, 12);
      }
      // 屋脊上的一排设备，顶视图里是沿长向的格子。
      for (let z = -10; z < 90; z += 14) {
        if (!pip(body, c[0], c[1] + z)) continue;
        extrude(B.p(MULLD), [[c[0] - 4, c[1] + z], [c[0] + 5, c[1] + z], [c[0] + 5, c[1] + z + 8], [c[0] - 4, c[1] + z + 8]], 70, 73.5);
      }
    }
  }

  // ============================================================================================
  // 生物城一期：七座褐色实验楼围着院子，屋顶有光伏，楼与楼之间有连廊。
  // ============================================================================================
  function buildBiopolis(B, F) {
    const spec = {
      Helios: { h: 78, wall: '#a07858' },
      Matrix: { h: 61, wall: '#8d735c' },
      Nanos: { h: 52, wall: '#9a8068' },
      Proteos: { h: 48, wall: '#b08970' },
      Genome: { h: 46, wall: '#8a7560' },
      Centros: { h: 44, wall: '#a48b72' },
      Chromos: { h: 42, wall: '#96785f' }
    };
    const info = [];
    F.parts.forEach(function (part) {
      const s = spec[part.name];
      if (!s) return;
      const P = clean(part.p);
      pave(B, P);
      const wall = { c: s.wall, m: 0, lk: 0.18, ds: true };
      punched(B, P, 0.3, s.h, { wall: wall, win: WIN, frame: { c: '#efe6da', m: 0, ds: true }, bay: 4.1, fh: 3.65, ww: 2.2, wh: 1.6 });
      parapet(B, P, s.h, 1.1, { c: '#efe6da', m: 0, ds: true });
      stripes(B, safeOffset(P, -1.6), s.h + 0.15, SOLAR, 3.2, 1.5);
      // Helios 最长的那一面是通高玻璃槽，不是窗洞墙。
      if (part.name === 'Helios' || part.name === 'Matrix') {
        let bi = 0, bl = 0;
        for (let i = 0; i < P.length; i++) { const e = edgeOut(P, i); if (e.L > bl) { bl = e.L; bi = i; } }
        const e = edgeOut(P, bi);
        const t0 = part.name === 'Helios' ? 0.28 : 0.35, t1 = part.name === 'Helios' ? 0.72 : 0.7;
        const ax = e.a[0] + (e.b[0] - e.a[0]) * t0, az = e.a[1] + (e.b[1] - e.a[1]) * t0;
        const bx = e.a[0] + (e.b[0] - e.a[0]) * t1, bz = e.a[1] + (e.b[1] - e.a[1]) * t1;
        const o = 0.28, y0 = part.name === 'Matrix' ? s.h * 0.45 : 4;
        quad(B.p(GLB), [ax + e.nx * o, y0, az + e.nz * o], [bx + e.nx * o, y0, bz + e.nz * o], [bx + e.nx * o, s.h - 1, bz + e.nz * o], [ax + e.nx * o, s.h - 1, az + e.nz * o]);
      }
      info.push({ c: cen(P), h: s.h, name: part.name });
    });
    // 距离近的楼之间搭一条白连廊。
    for (let i = 0; i < info.length; i++) for (let j = i + 1; j < info.length; j++) {
      const a = info[i], b = info[j], d = Math.hypot(a.c[0] - b.c[0], a.c[1] - b.c[1]);
      if (d < 28 || d > 70) continue;
      const y = 8;
      beam(B.p(WHITE), [a.c[0], y, a.c[1]], [b.c[0], y, b.c[1]], 2.4);
      beam(B.p({ c: '#d5ddd8', m: 1, fh: 3, cw: 2, ds: true }), [a.c[0], y + 1.6, a.c[1]], [b.c[0], y + 1.6, b.c[1]], 1.6);
    }
  }

  // ============================================================================================
  // 罗切斯特：北侧商场（36 m）+ 住宅塔（120 m，设备到 138 m）+ 酒店（102 m），阳台横线条。
  // ============================================================================================
  function balconyTower(B, P, H, opt) {
    P = clean(P);
    const fh = opt.fh, wall = opt.wall, glass = opt.glass;
    const plate = safeOffset(P, opt.over || 1.15);
    const inn = safeOffset(P, -0.35);
    for (let y = 0.4; y < H - 0.5; y += fh) {
      slab(B.p(wall), plate, y + fh - 0.42, 0.38);
      walls(B.p(glass), inn, y + 0.35, y + fh - 0.5);
    }
    // 屋顶设备层收到实测高度（住宅塔 138 m），主体停在官方高度。
    if (opt.crown && opt.crown > H) {
      const C = safeOffset(P, -1.5);
      curtain(B, C, H, opt.crown, { glass: GLB, mull: wall, band: wall, bay: 3.2, fh: 3.6, bandD: 0.4, parapet: 1.2 });
    } else parapet(B, P, H, 1.3, wall);
  }
  function buildRochester(B, F) {
    const tower = byName(F, 'The Rochester');
    const hotel = byName(F, 'Park Avenue Hotel');
    const mall = byName(F, 'Rochester Mall');
    const wallT = { c: '#d2c4b4', m: 0, lk: 0.16, ds: true };
    const wallH = { c: '#c3b6a8', m: 0, lk: 0.14, ds: true };
    const glass = { c: '#6d8490', m: 1, fh: 3.15, cw: 2.4, ds: true, glow: '#ffe6c4', gk: 0.08 };
    pave(B, tower); pave(B, hotel); pave(B, mall);
    balconyTower(B, tower, 120, { fh: 3.15, wall: wallT, glass: glass, over: 1.2, crown: 138 });
    balconyTower(B, hotel, 102, { fh: 3.2, wall: wallH, glass: glass, over: 1.05, crown: 108 });
    // 屋顶泳池，顶视图里是几块蓝。
    function pools(P, y, list) {
      const c = cen(P);
      for (let i = 0; i < list.length; i++) {
        const q = list[i];
        const r = [[c[0] + q[0], c[1] + q[1]], [c[0] + q[0] + q[2], c[1] + q[1]], [c[0] + q[0] + q[2], c[1] + q[1] + q[3]], [c[0] + q[0], c[1] + q[1] + q[3]]];
        if (!pip(P, c[0] + q[0] + q[2] / 2, c[1] + q[1] + q[3] / 2)) continue;
        extrude(B.p({ c: '#3a84b0', m: 0, glow: '#8fd0ff', gk: 0.15, ds: true }), r, y, y + 0.45);
      }
    }
    pools(tower, 120.2, [[-6, -4, 8, 5], [4, 2, 6, 4], [-2, 6, 5, 3.5]]);
    pools(hotel, 102.2, [[-3, -2, 7, 4]]);
    if (mall) {
      curtain(B, mall, 0.3, 36, { glass: { c: '#c5c2b8', m: 1, fh: 4.2, cw: 3.4, ds: true, glow: '#fff0d8', gk: 0.08 }, mull: wallT, band: wallT, bay: 3.6, fh: 4.2, bandD: 0.4, bandH: 0.4, parapet: 1.0 });
      stripes(B, safeOffset(mall, -2), 36.2, SOLAR, 3.4, 1.2);
      // 屋面格栅，顶视图北楼那片白网格。
      const bb = bounds(mall), bm = B.p(WHITE);
      for (let x = bb.x0 + 3; x < bb.x1; x += 7) {
        let zA = null;
        for (let z = bb.z0; z <= bb.z1; z += 2) {
          const inside = pip(mall, x, z);
          if (inside && zA === null) zA = z;
          if ((!inside || z + 2 > bb.z1) && zA !== null) {
            beam(bm, [x, 37.1, zA], [x, 37.1, z], 0.18);
            zA = null;
          }
        }
      }
    }
  }

  function reg(key, zh, en, slug, r, h, lt, fn) {
    const F = BV_FP[slug];
    LANDMARKS[key] = {
      zh: zh, en: en, cat: 'new', r: r, h: h, lt: lt,
      build: function () {
        const g = new THREE.Group(), B = batch();
        try { fn(B, F); } catch (err) { console.error('bv ' + key, err); }
        B.flush(g);
        return g;
      }
    };
    SG_PLACES.push({ type: key, lat: F.lat, lon: F.lon, rot: 0 });
  }

  const LT = { m: 0, c: '#ffe2c4', k: 0.32, e: 0.35, anim: 'breathe' };
  reg('bvstar', '星悦汇', 'The Star Vista', 'star_vista', 110, 75, LT, buildStar);
  reg('bvmetro', '大都会', 'The Metropolis', 'metropolis', 100, 113, LT, buildMetro);
  reg('bvmrt', '波那维斯达站', 'Buona Vista MRT', 'buona_vista_mrt', 140, 19, { m: 0, c: '#d8fff0', k: 0.4, e: 0.6 }, buildMRT);
  reg('bvbio', '生物城', 'Biopolis', 'biopolis', 170, 78, LT, buildBiopolis);
  reg('bvfusion', '启奥园一期', 'Fusionopolis One', 'fusionopolis_one', 90, 136, LT, buildFusion);
  reg('bvsolaris', '索拉里斯', 'Solaris @ one-north', 'solaris', 80, 80, LT, buildSolaris);
  reg('bvgalaxis', '星桥', 'Galaxis', 'galaxis', 90, 94, LT, buildGalaxis);
  reg('bvmedia', '新传媒园区', 'Mediacorp Campus', 'mediacorp', 120, 76, LT, buildMedia);
  reg('bvrochester', '罗切斯特', 'The Rochester', 'rochester', 100, 138, LT, buildRochester);

  // 介绍卡。只写核对过的事实：年份、高度来源、建筑是什么。
  const INFO = {
    bvstar: { k: { zh: '商场 · 表演场地', en: 'Mall and performing arts venue' }, y: '2012', h: 75,
      d: { zh: '星悦汇在波那维斯达地铁站旁边，2012 年开幕。最显眼的是罩在露天中庭上的那层折面玻璃壳，壳下是商场和表演场地。模型按实测屋顶高度约 75 米来做。',
           en: 'The Star Vista opened in 2012 beside Buona Vista MRT. Its landmark is the faceted glass shell over the open atrium, with shops and a performance venue underneath. The model uses the measured roof height of about 75 m.' } },
    bvmetro: { k: { zh: '办公双塔', en: 'Twin office towers' }, y: '2013', h: 113,
      d: { zh: '大都会是波那维斯达的一对办公楼。较高的一座约 113 米，另一座约 104 米，外立面是密的水平遮阳条，两塔之间有一座玻璃连廊。',
           en: 'The Metropolis is a pair of offices at Buona Vista. The taller tower is about 113 m and the other about 104 m, both wrapped in horizontal sunshades, with a glass link between them.' } },
    bvmrt: { k: { zh: '地铁站', en: 'MRT station' }, y: '1988',
      d: { zh: '波那维斯达站是东西线和环线的换乘站。东西线在高架上，站房屋顶是一条青绿色的长盖，盖上有一排通风天窗；环线在地下。模型包含站房和这一段高架轨道。',
           en: 'Buona Vista is the interchange of the East West Line and the Circle Line. The East West Line is elevated under a long teal roof with a row of roof vents; the Circle Line is underground. The model includes the station and this stretch of viaduct.' } },
    bvbio: { k: { zh: '科研园区', en: 'Research campus' }, y: '2003', h: 78,
      d: { zh: '生物城一期是纬壹的生物医学园区，2003 年启用。七座实验楼围着中央庭院，楼名是 Helios、Matrix、Nanos、Proteos、Genome、Centros 和 Chromos，楼与楼之间有连廊，屋顶铺了光伏。',
           en: 'Biopolis phase 1 is the biomedical campus at one-north, opened in 2003. Seven lab blocks — Helios, Matrix, Nanos, Proteos, Genome, Centros and Chromos — sit around a court, linked by bridges, with solar panels on the roofs.' } },
    bvfusion: { k: { zh: '科研办公', en: 'Research offices' }, y: '2008', h: 134,
      d: { zh: '启奥园一期 2008 年落成，三座曲面塔是 Connexis North、Connexis South 和 Symbiosis，高度大约 134 米、123 米和 134 米。塔身每隔一段有一圈白色空中花园，北塔屋顶是一块椭圆草坪。',
           en: 'Fusionopolis One was completed in 2008. Its three curved towers are Connexis North, Connexis South and Symbiosis, about 134 m, 123 m and 134 m. White sky-garden bands wrap the towers, and the north tower is topped by an oval lawn.' } },
    bvsolaris: { k: { zh: '办公楼', en: 'Office building' }, y: '2010', h: 80, a: { zh: '杨经文', en: 'Ken Yeang' },
      d: { zh: 'Solaris 在纬壹，约 2010 年落成，高约 80 米。白色楼板一层层挑出，一条种了树的坡道绕着外立面盘上去，南翼高、北翼低。',
           en: 'Solaris at one-north was completed around 2010 and is about 80 m tall. White floor plates step out in layers, and a planted ramp spirals up the outside. The south wing is the tall one.' } },
    bvgalaxis: { k: { zh: '办公楼', en: 'Office building' }, h: 94,
      d: { zh: '星桥（启奥园 5）是一座约 17 层、实测约 94 米的办公楼，立面是深浅相间的棋盘格，东侧底部有一段紫色玻璃和架空层，并有天桥连向启奥园一期。',
           en: 'Galaxis (Fusionopolis 5) is a 17-storey office, about 94 m as measured. The facade is a light-and-dark checker, with a purple glass bay and a pilotis on the lower east side, and a bridge toward Fusionopolis One.' } },
    bvmedia: { k: { zh: '广播电视园区', en: 'Broadcast campus' }, h: 76,
      d: { zh: '新传媒园区在纬壹的媒体城，主体是一座香槟金色的曲面楼，北端有一片较低的绿色屋顶，主屋顶上是一排圆形冷却塔和设备。模型最高处按实测约 76 米。',
           en: 'The Mediacorp campus at Mediapolis is a champagne-metal curved block, with a lower green roof on the north end and round cooling towers along the main roof. The model peaks at the measured height of about 76 m.' } },
    bvrochester: { k: { zh: '住宅 · 商场 · 酒店', en: 'Housing, mall and hotel' }, y: '2011', h: 138,
      d: { zh: '罗切斯特综合体在星悦汇西侧，2011 年前后落成。北侧是约 36 米的商场，中间住宅塔主体约 120 米（含屋顶设备到实测约 138 米），南侧酒店约 102 米。阳台是一层层挑出的横板。',
           en: 'The Rochester complex, just west of The Star Vista, was completed around 2011. A mall of about 36 m sits on the north, the residential tower is about 120 m to the roof (about 138 m with roof plant), and the hotel is about 102 m. Balconies are stacked as horizontal slabs.' } }
  };
  if (typeof window !== 'undefined') window.LM_INFO = Object.assign(window.LM_INFO || {}, INFO);

  // 高架轨道在车站这一小段改由模型来画，避免和通用高架桥叠在一起。
  const api = {
    skipRail: function (x0, y0, x1, y1) {
      if (typeof sgXY !== 'function') return false;
      const c = sgXY(BV_FP.buona_vista_mrt.lat, BV_FP.buona_vista_mrt.lon);
      const mx = (x0 + x1) / 2 - c[0], my = (y0 + y1) / 2 - c[1];
      return mx > -200 && mx < 220 && my > -35 && my < 110;
    }
  };
  if (typeof window !== 'undefined') window.BV = api;

  // ?view=bv 或 #bv：镜头拉到纬壹 / 波那维斯达，而不是默认的滨海湾。
  function bvWanted() {
    try {
      const q = new URLSearchParams(location.search);
      const v = String(q.get('view') || '').toLowerCase();
      const h = String(location.hash || '').replace(/^#/, '').toLowerCase();
      return v === 'bv' || v === 'buonavista' || v === 'one-north' || v === 'onenorth' || h === 'bv' || h === 'one-north' || h === 'onenorth';
    } catch (e) { return false; }
  }
  if (typeof HOOKS !== 'undefined' && HOOKS.boot) {
    HOOKS.boot.push(function () {
      if (typeof sgView !== 'function' || sgView._bv) return;
      const orig = sgView;
      sgView = function () {
        if (!bvWanted()) return orig();
        const t = sgXY(1.3016, 103.7900);
        controls.target.set(t[0], 40, -t[1]);
        camera.position.set(t[0] + 1350, 920, -t[1] + 1560);
      };
      sgView._bv = true;
    });
  }
})();
