// ===== lm34/bv：波那维斯达 / 纬壹（one-north）九座地标 =====
//
// 这一段是手写的建筑模型，不是自动挤出的方盒子，也不读取谷歌三维瓦片。
// 平面用的是 OpenStreetMap 的真实轮廓（见同目录 bv_data.js 里的 BV），
// 高度用参考图 meta.json 里量到的「屋顶减地面」。
//
// 坐标（和城市里其它地标一样）：
//   x 朝东，z 朝南，y 朝上。原点是这组轮廓的面积加权中心。
//   y = 0 是地面。整栋楼稍后会被放到地形上，所以这里不要加经纬度。
//
// 画法：同一种颜色先收进一个数组，最后合成一次 LTris。
// 这样一座楼只有十几个网格，浏览器负担得起。
//
// 依赖外层已经准备好的：THREE、LANDMARKS、SG_PLACES、LTris。
// 本文件和 bv_data.js 必须包在同一个 { } 里，BV 才看得见。

const BVp = Math.PI, BVtau = Math.PI * 2;

// ---------- 小工具：平面多边形（点是 [x, z]） ----------

// 多边形面积的两倍。大于 0 表示逆时针（从天上往下看）。
function bvArea(P){
  let a = 0;
  for (let i = 0; i < P.length; i++){ const q = P[(i + 1) % P.length]; a += P[i][0] * q[1] - q[0] * P[i][1]; }
  return a / 2;
}
// 三角剖分要求逆时针，这里统一一下方向。
function bvCCW(P){ return bvArea(P) < 0 ? P.slice().reverse() : P.slice(); }
function bvCtr(P){
  let x = 0, z = 0;
  for (const p of P){ x += p[0]; z += p[1]; }
  return [x / P.length, z / P.length];
}
function bvBox(P){
  let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
  for (const p of P){ if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < z0) z0 = p[1]; if (p[1] > z1) z1 = p[1]; }
  return [x0, z0, x1, z1];
}
// 点在多边形里吗（射线法）。
function bvIn(P, x, z){
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++){
    const yi = P[i][1], yj = P[j][1];
    if ((yi > z) !== (yj > z) && x < (P[j][0] - P[i][0]) * (z - yi) / (yj - yi + 1e-9) + P[i][0]) c = !c;
  }
  return c;
}
// 把轮廓向内（d>0）或向外（d<0）推一圈。拐角做了限制，避免尖刺拉得很长。
function bvOff(P, d){
  const n = P.length; if (n < 3) return P.slice();
  const sg = bvArea(P) > 0 ? -1 : 1, out = [];
  for (let i = 0; i < n; i++){
    const p = P[(i + n - 1) % n], c = P[i], q = P[(i + 1) % n];
    let e1x = c[0] - p[0], e1z = c[1] - p[1], e2x = q[0] - c[0], e2z = q[1] - c[1];
    const l1 = Math.hypot(e1x, e1z) || 1, l2 = Math.hypot(e2x, e2z) || 1;
    e1x /= l1; e1z /= l1; e2x /= l2; e2z /= l2;
    let nx = (e1z + e2z) * sg, nz = -(e1x + e2x) * sg;
    const ml = Math.hypot(nx, nz) || 1; nx /= ml; nz /= ml;
    const cs = Math.max(0.42, (nx * e1z * sg + nz * -e1x * sg));
    let md = d / cs; const lim = Math.abs(d) * 2.6; if (Math.abs(md) > lim) md = Math.sign(md) * lim;
    out.push([c[0] + nx * md, c[1] + nz * md]);
  }
  return out;
}
// 每个顶点的外向法线（逆时针多边形的右侧）。
function bvOutN(P){
  const n = P.length, N = [];
  for (let i = 0; i < n; i++){
    const p = P[(i + n - 1) % n], c = P[i], q = P[(i + 1) % n];
    let e1x = c[0] - p[0], e1z = c[1] - p[1], e2x = q[0] - c[0], e2z = q[1] - c[1];
    const l1 = Math.hypot(e1x, e1z) || 1, l2 = Math.hypot(e2x, e2z) || 1;
    e1x /= l1; e1z /= l1; e2x /= l2; e2z /= l2;
    let nx = e1z + e2z, nz = -e1x - e2x, L = Math.hypot(nx, nz) || 1;
    N.push([nx / L, nz / L]);
  }
  return N;
}
// 沿边每 step 米取一个点，附带外向法线和这一小段的长度。
function bvSamp(P, step){
  const out = [];
  for (let i = 0; i < P.length; i++){
    const a = P[i], b = P[(i + 1) % P.length];
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    if (L < 0.2) continue;
    const n = Math.max(1, Math.round(L / step)), nx = dz / L, nz = -dx / L;
    for (let k = 0; k < n; k++){
      const t = (k + 0.5) / n;
      out.push({x: a[0] + dx * t, z: a[1] + dz * t, nx, nz, L: L / n, ang: Math.atan2(dz, dx)});
    }
  }
  return out;
}
function bvEll(cx, cz, rx, rz, rot, n){
  const P = [], c = Math.cos(rot || 0), s = Math.sin(rot || 0);
  n = n || 28;
  for (let i = 0; i < n; i++){
    const a = i / n * BVtau, x = Math.cos(a) * rx, z = Math.sin(a) * rz;
    P.push([cx + x * c - z * s, cz + x * s + z * c]);
  }
  return P;
}

// ---------- 往三角形数组里加形状 ----------

function bvQ(o, a, b, c, d){ o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]); }
function bvWall(o, P, y0, y1){
  for (let i = 0; i < P.length; i++){
    const a = P[i], b = P[(i + 1) % P.length];
    bvQ(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]);
  }
}
function bvCap(o, P, y){
  if (P.length < 3) return;
  let faces;
  try { faces = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []); }
  catch (e){ return; }
  for (const f of faces){
    if (!f || f.length < 3) continue;
    const a = P[f[0]], b = P[f[1]], c = P[f[2]];
    if (!a || !b || !c) continue;
    o.push(a[0], y, a[1], b[0], y, b[1], c[0], y, c[1]);
  }
}
function bvPrism(o, P, y0, y1, bot){ bvWall(o, P, y0, y1); bvCap(o, P, y1); if (bot) bvCap(o, P, y0); }
// 两圈点数相同的多边形，连成一圈侧壁（楼板、退台会用到）。
function bvLoft(o, A, y0, B, y1){
  const n = Math.min(A.length, B.length);
  for (let i = 0; i < n; i++){
    const j = (i + 1) % n;
    bvQ(o, [A[i][0], y0, A[i][1]], [A[j][0], y0, A[j][1]], [B[j][0], y1, B[j][1]], [B[i][0], y1, B[i][1]]);
  }
}
function bvBox3(o, w, h, d, x, y, z, ry){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), hw = w / 2, hd = d / 2;
  const R = (px, py, pz) => [x + px * c + pz * s, py, z - px * s + pz * c];
  const P = [R(-hw, y, -hd), R(hw, y, -hd), R(hw, y, hd), R(-hw, y, hd), R(-hw, y + h, -hd), R(hw, y + h, -hd), R(hw, y + h, hd), R(-hw, y + h, hd)];
  for (const [a, b, e, f] of [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]]) bvQ(o, P[a], P[b], P[e], P[f]);
}
function bvCyl(o, x, y, z, r, h, seg){
  seg = seg || 8;
  for (let i = 0; i < seg; i++){
    const a0 = i / seg * BVtau, a1 = (i + 1) / seg * BVtau;
    const c0 = Math.cos(a0) * r, s0 = Math.sin(a0) * r, c1 = Math.cos(a1) * r, s1 = Math.sin(a1) * r;
    bvQ(o, [x + c0, y, z + s0], [x + c1, y, z + s1], [x + c1, y + h, z + s1], [x + c0, y + h, z + s0]);
  }
  bvCap(o, bvEll(x, z, r, r, 0, seg), y + h);
}
// 沿一条边放一根水平装饰带（出挑 push 米，厚度 t）。
function bvEdgeBand(o, P, y, h, t, push){
  for (let i = 0; i < P.length; i++){
    const a = P[i], b = P[(i + 1) % P.length];
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    if (L < 0.35) continue;
    const ang = Math.atan2(dz, dx), nx = dz / L, nz = -dx / L;
    bvBox3(o, L, h, t, (a[0] + b[0]) / 2 + nx * (push + t / 2), y, (a[1] + b[1]) / 2 + nz * (push + t / 2), -ang);
  }
}
// 玻璃幕墙：整片玻璃 + 每层一条横带 + 每隔 bay 米一根通高竖梃。
function bvCurtain(glass, band, mull, P, y0, y1, opt){
  opt = opt || {};
  const fh = opt.fh || 3.8, bay = opt.bay || 3.4;
  const Pin = bvOff(P, 0.35);
  bvWall(glass, Pin, y0, y1);
  bvCap(glass, P, y1);
  for (let y = y0 + fh; y < y1 - 0.4; y += fh) bvEdgeBand(band, P, y, opt.bh || 0.42, opt.bt || 0.38, opt.push || 0.05);
  const S = bvSamp(P, bay);
  for (const s of S) bvBox3(mull, 0.14, y1 - y0, 0.22, s.x + s.nx * 0.16, y0, s.z + s.nz * 0.16, -s.ang);
}
// 实墙开窗：墙是一种颜色，窗洞是稍稍探出来的深色玻璃，夜里会亮。
function bvPunch(wall, win, P, y0, y1, opt){
  opt = opt || {};
  const fh = opt.fh || 3.6, bay = opt.bay || 3.6;
  bvWall(wall, P, y0, y1);
  bvCap(wall, P, y1);
  const S = bvSamp(P, bay);
  const wh = fh * (opt.wh || 0.55), ww = Math.min(bay * 0.62, 2.4);
  for (let y = y0 + fh * 0.22; y + wh < y1 - 0.3; y += fh){
    for (const s of S){
      bvBox3(win, ww, wh, 0.18, s.x + s.nx * 0.12, y, s.z + s.nz * 0.12, -s.ang);
    }
  }
}
// 横百叶：玻璃退后，每层一块挑出的遮阳板（大都会）。
function bvLouver(glass, fin, P, y0, y1, fh){
  // 玻璃是主体，横竖梃只是深色金属线，不能盖成白塑料百叶。
  bvWall(glass, bvOff(P, 0.28), y0, y1);
  bvCap(glass, P, y1);
  for (let y = y0 + 0.2; y < y1 - 0.15; y += fh) bvEdgeBand(fin, P, y, 0.1, 0.32, 0.02);
  const S = bvSamp(P, 2.8);
  for (const s of S) bvBox3(fin, 0.08, y1 - y0, 0.14, s.x + s.nx * 0.08, y0, s.z + s.nz * 0.08, -s.ang);
}
// 住宅阳台：每层一圈楼板，后面是玻璃（罗切斯特）。
function bvBalc(slab, glass, P, y0, y1, fh, depth){
  const n = Math.max(1, Math.round((y1 - y0) / fh));
  const step = (y1 - y0) / n;
  const outer = bvOff(P, -depth);
  for (let i = 0; i < n; i++){
    const y = y0 + i * step;
    bvLoft(slab, outer, y, outer, y + 0.18);
    bvCap(slab, outer, y + 0.18);
    bvWall(glass, P, y + 0.18, y + step);
  }
  bvCap(slab, outer, y1);
}
// 像素立面：每一格一种灰，留一条细缝当窗框（盖拉西斯）。
function bvPixel(cols, P, y0, y1, fh, bay, tint){
  const S = bvSamp(P, bay);
  const nF = Math.max(1, Math.round((y1 - y0) / fh));
  const step = (y1 - y0) / nF;
  const gap = 0.16;
  for (let f = 0; f < nF; f++){
    const y = y0 + f * step;
    const purple = tint && f < 3;
    for (let i = 0; i < S.length; i++){
      const s = S[i];
      const h = Math.abs(Math.sin(i * 12.9898 + f * 78.233) * 43758.5453);
      const u = h - Math.floor(h);
      const ci = purple ? (u < 0.55 ? 4 : 5) : (u < 0.28 ? 0 : u < 0.55 ? 1 : u < 0.8 ? 2 : 3);
      const ww = Math.max(0.4, s.L - gap), hh = step - gap;
      bvBox3(cols[ci], ww, hh, 0.25, s.x + s.nx * 0.2, y + gap * 0.5, s.z + s.nz * 0.2, -s.ang);
    }
  }
}
// 屋顶光伏：深色屋面上一排排蓝色电池板。
function bvSolar(base, cell, P, y){
  bvCap(base, P, y);
  const b = bvBox(P);
  for (let x = b[0] + 1.2; x < b[2] - 0.6; x += 3.3){
    for (let z = b[1] + 1.2; z < b[3] - 0.6; z += 5.2){
      if (!bvIn(P, x, z) || !bvIn(P, x, z + 2)) continue;
      bvBox3(cell, 2.3, 0.12, 4.2, x, y, z + 2, 0);
    }
  }
}
function bvTree(trunk, leaf, x, y, z, s){
  bvCyl(trunk, x, y, z, 0.12 * s, 1.3 * s, 5);
  const seg = 7;
  for (let k = 0; k < 2; k++){
    const r = (1.15 - k * 0.28) * s, yy = y + (1.2 + k * 0.7) * s, h = 1.1 * s;
    for (let i = 0; i < seg; i++){
      const a0 = i / seg * BVtau, a1 = (i + 1) / seg * BVtau;
      leaf.push(
        x + Math.cos(a0) * r, yy, z + Math.sin(a0) * r,
        x + Math.cos(a1) * r, yy, z + Math.sin(a1) * r,
        x, yy + h, z);
    }
  }
}
// 把一批同色三角形交给地标系统。col 可以是 '#rrggbb'，也可以是带夜景参数的对象。
function bvFlush(g, bucket){
  for (const e of bucket.values()) if (e.a.length) LTris(g, e.a, e.col);
}
function bvBag(){ return new Map(); }
function bvGet(M, col){
  const k = typeof col === 'string' ? col : JSON.stringify(col);
  let e = M.get(k); if (!e){ e = {col, a: []}; M.set(k, e); }
  return e.a;
}

// 夜景：m=1 是办公窗格（按层高 fh、开间 cw 随机亮灯），m=0 是整体暖色泛光。
const bvG = (hex, fh, cw) => ({c: hex, m: 1, fh: fh || 3.8, cw: cw || 3.2, lc: '#d7e6ff', lk: 0.72, rf: 0.22});
// 有色反射玻璃：rf 是反射强度。对照渲染和站内材质都会读它。
const bvGlass = (hex, fh, cw, rf) => ({c: hex, m: 1, fh: fh || 3.8, cw: cw || 3.2, lc: '#c5daf0', lk: 0.5, rf: rf == null ? 0.62 : rf});
const bvMetal = (hex, rf) => ({c: hex, m: 0, lc: '#e4eef4', lk: 0.14, rf: rf == null ? 0.34 : rf});
const bvW = (hex, lk) => ({c: hex, m: 0, lc: '#ffd7a8', lk: lk == null ? 0.35 : lk, rf: 0.06});
const bvT = (hex, op) => ({c: hex, m: 0, op: op, lc: '#e8f4ff', lk: 0.2});

function bvPart(slug, id){
  const p = BV[slug].parts.find(q => q.id === id);
  return bvCCW(p.pts.map(q => q.slice()));
}
function bvByName(slug, name){
  const p = BV[slug].parts.find(q => q.name === name);
  return p ? bvCCW(p.pts.map(q => q.slice())) : null;
}

// ---------- 星悦汇：两片折面玻璃壳，罩在露天中庭上 ----------
function bvStar(g){
  const P = bvPart('star_vista', 104352121);
  const M = bvBag();
  // 从远处看，玻璃壳是一整块反光的实体，不是透出来的骨架。夜里按幕墙亮窗。
  const glass = bvGet(M, bvMetal('#d4dadc', 0.46));
  const glass2 = bvGet(M, bvMetal('#c3cbcf', 0.42));
  const frame = bvGet(M, bvMetal('#6a787e', 0.34));
  const podium = bvGet(M, bvGlass('#5a7382', 4.0, 3.4, 0.58));
  const mull = bvGet(M, bvMetal('#d5dee4', 0.22));
  const soffit = bvGet(M, bvMetal('#8b969c', 0.2));
  const deck = bvGet(M, '#9aa8a4');
  // 斜向格子上的折面。高度在格子点上取值，每一小格是一块平面，看起来才是折板而不是揉皱的纸。
  const ang = 0.55, ca = Math.cos(ang), sa = Math.sin(ang);
  const toG = (x, z) => [x * ca + z * sa, -x * sa + z * ca];
  const toW = (u, v) => [u * ca - v * sa, u * sa + v * ca];
  const hAt = (x, z) => {
    const g2 = toG(x, z), u = g2[0], v = g2[1];
    const lobe = Math.abs(u) < 14 ? 0.62 : 1;          // 两翼之间略低，对应中庭
    const across = Math.max(0.15, 1 - Math.abs(v) / 78);
    const fold = ((Math.floor(u / 18) + Math.floor(v / 16)) & 1) ? 4 : 0;
    return Math.max(46, Math.min(74, 50 + 22 * across * lobe + fold));
  };
  // 下面几层是真正的玻璃幕墙，壳从它们头顶挑出去。
  bvCurtain(podium, mull, mull, P, 0, 22, {fh: 4.0, bay: 3.2, bh: 0.28, bt: 0.22, push: 0.04});
  bvCap(deck, P, 0.2);
  const Shell = bvOff(P, -8);
  for (let i = 0; i < P.length; i++){
    const a = P[i], b = P[(i + 1) % P.length], c = Shell[i], d = Shell[(i + 1) % Shell.length];
    bvQ(soffit, [a[0], 22, a[1]], [b[0], 22, b[1]], [d[0], 22, d[1]], [c[0], 22, c[1]]);
  }
  // 斜向格子：四角都在轮廓里才铺一块折板，边上用真实轮廓的墙接上。
  const step = 14;
  const gb = [1e9, 1e9, -1e9, -1e9];
  for (const p of Shell){ const g2 = toG(p[0], p[1]); if (g2[0] < gb[0]) gb[0] = g2[0]; if (g2[1] < gb[1]) gb[1] = g2[1]; if (g2[0] > gb[2]) gb[2] = g2[0]; if (g2[1] > gb[3]) gb[3] = g2[1]; }
  const iu0 = Math.floor(gb[0] / step) - 1, iu1 = Math.ceil(gb[2] / step) + 1;
  const iv0 = Math.floor(gb[1] / step) - 1, iv1 = Math.ceil(gb[3] / step) + 1;
  const at = (i, j) => { const w = toW(i * step, j * step); return [w[0], hAt(w[0], w[1]), w[1], bvIn(Shell, w[0], w[1])]; };
  for (let i = iu0; i < iu1; i++) for (let j = iv0; j < iv1; j++){
    const A = at(i, j), B = at(i + 1, j), C = at(i + 1, j + 1), D = at(i, j + 1);
    if (!(A[3] && B[3] && C[3] && D[3])) continue;
    const batch = ((i + j) & 1) ? glass : glass2;
    batch.push(A[0], A[1], A[2], B[0], B[1], B[2], C[0], C[1], C[2], A[0], A[1], A[2], C[0], C[1], C[2], D[0], D[1], D[2]);
    bvQ(frame, A, B, [B[0], B[1] + 0.7, B[2]], [A[0], A[1] + 0.7, A[2]]);
    bvQ(frame, A, D, [D[0], D[1] + 0.7, D[2]], [A[0], A[1] + 0.7, A[2]]);
  }
  // 挑出的金属壳，底边接在裙房以上，所以下面的玻璃楼层露在外面。
  for (let i = 0; i < Shell.length; i++){
    const a = Shell[i], b = Shell[(i + 1) % Shell.length];
    const ha = hAt(a[0], a[1]), hb = hAt(b[0], b[1]);
    bvQ(glass, [a[0], 22, a[1]], [b[0], 22, b[1]], [b[0], hb, b[1]], [a[0], ha, a[1]]);
    bvQ(frame, [a[0], ha, a[1]], [b[0], hb, b[1]], [b[0], hb + 0.7, b[1]], [a[0], ha + 0.7, a[1]]);
  }
  bvFlush(g, M);
}

// ---------- 大都会：双塔 + 横百叶 ----------
function bvMetro(g){
  const t1 = bvPart('metropolis', 1563020894);
  const t2 = bvPart('metropolis', 1563020891);
  const link = bvPart('metropolis', 1563020893);
  const M = bvBag();
  const glass = bvGet(M, bvGlass('#243e4c', 3.35, 2.8, 0.7));
  const fin = bvGet(M, bvMetal('#5c7080', 0.4));
  const pod = bvGet(M, bvGlass('#314a58', 4.2, 4, 0.45));
  const roof = bvGet(M, bvMetal('#6a7c88', 0.25));
  const core = bvGet(M, bvMetal('#4a5e6c', 0.3));
  // 西塔略高，顶上有设备层，贴近实测 113 米；东塔平屋顶。
  bvLouver(glass, fin, t1, 0, 106, 3.35);
  bvBox3(core, 16, 7.2, 14, bvCtr(t1)[0] + 4, 106, bvCtr(t1)[1] - 6, 0.4);
  bvCap(roof, bvOff(t1, 2), 106.05);
  bvLouver(glass, fin, t2, 0, 102, 3.35);
  bvCap(roof, bvOff(t2, 2), 102.05);
  bvPrism(pod, link, 0, 14, true);
  bvEdgeBand(fin, link, 13.4, 0.6, 0.8, 0.1);
  // 两塔之间的玻璃连廊（低区一整条，高区一条）。
  const c1 = bvCtr(t1), c2 = bvCtr(t2);
  bvBox3(pod, Math.hypot(c2[0] - c1[0], c2[1] - c1[1]) * 0.55, 12, 8, (c1[0] + c2[0]) / 2, 4, (c1[1] + c2[1]) / 2, -Math.atan2(c2[1] - c1[1], c2[0] - c1[0]));
  bvFlush(g, M);
}

// ---------- 波纳维斯达站：高架东西线站屋 + 轨道 ----------
function bvMRT(g){
  const M = bvBag();
  const conc = bvGet(M, '#d5d3cc');
  const teal = bvGet(M, bvW('#5eb6ae', 0.45));
  const mint = bvGet(M, '#9ed3b0');
  const glass = bvGet(M, bvG('#c5dde4', 4, 3.5));
  const steel = bvGet(M, '#6e787c');
  const railC = bvGet(M, '#3a4044');
  const white = bvGet(M, '#f2f3f1');
  const rails = BV.buona_vista_mrt.rail || [];
  // 两条高架线几乎平行，取更靠近站屋轮廓的那一条当中心线。
  const hall = bvPart('buona_vista_mrt', 152592566);
  const hc = bvCtr(hall);
  let line = rails[0] || [];
  let best = 1e9;
  for (const R of rails){
    let d = 1e9;
    for (const p of R) d = Math.min(d, Math.hypot(p[0] - hc[0], p[1] - hc[1]));
    if (d < best){ best = d; line = R; }
  }
  if (line.length < 4){ bvPrism(conc, hall, 0, 12, true); bvFlush(g, M); return; }
  let bi = 0, bd = 1e9;
  for (let i = 0; i < line.length; i++){ const d = Math.hypot(line[i][0] - hc[0], line[i][1] - hc[1]); if (d < bd){ bd = d; bi = i; } }
  // 沿中心线走，累计长度，站屋大约 150 米，轨道再向两边伸出一截。
  const cum = [0];
  for (let i = 1; i < line.length; i++) cum.push(cum[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  const s0 = cum[bi];
  const roofHalf = 76, trackHalf = 150;
  const deckY = 10.3, roofY = 17.6;
  const seg = (half, halfW, y0, y1, batch, lip) => {
    for (let i = 0; i < line.length - 1; i++){
      const m = (cum[i] + cum[i + 1]) / 2;
      if (Math.abs(m - s0) > half) continue;
      const a = line[i], b = line[i + 1];
      const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
      const nx = dz / L, nz = -dx / L;
      const A = [a[0] + nx * halfW, y0, a[1] + nz * halfW], B = [b[0] + nx * halfW, y0, b[1] + nz * halfW];
      const C = [b[0] - nx * halfW, y0, b[1] - nz * halfW], D = [a[0] - nx * halfW, y0, a[1] - nz * halfW];
      const A2 = [A[0], y1, A[2]], B2 = [B[0], y1, B[2]], C2 = [C[0], y1, C[2]], D2 = [D[0], y1, D[2]];
      bvQ(batch, D2, C2, B2, A2);
      if (lip){ bvQ(batch, A, B, B2, A2); bvQ(batch, C, D, D2, C2); }
    }
  };
  seg(trackHalf, 5.2, deckY, deckY + 0.7, conc, true);
  seg(roofHalf, 11.5, roofY, roofY + 0.85, mint, false);
  seg(roofHalf, 11.5, roofY - 0.35, roofY + 0.15, teal, true);
  // 站台玻璃和柱。
  for (let i = 0; i < line.length - 1; i += 2){
    const m = cum[Math.min(line.length - 1, i)];
    if (Math.abs(m - s0) > roofHalf - 6) continue;
    const a = line[i], b = line[Math.min(line.length - 1, i + 1)];
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, nx = dz / L, nz = -dx / L;
    if (Math.abs(m - s0) < roofHalf - 10){
      bvQ(glass, [a[0] + nx * 7, 1, a[1] + nz * 7], [a[0] + nx * 7, deckY, a[1] + nz * 7], [a[0] + nx * 9.5, deckY, a[1] + nz * 9.5], [a[0] + nx * 9.5, 1, a[1] + nz * 9.5]);
      bvQ(glass, [a[0] - nx * 9.5, 1, a[1] - nz * 9.5], [a[0] - nx * 9.5, deckY, a[1] - nz * 9.5], [a[0] - nx * 7, deckY, a[1] - nz * 7], [a[0] - nx * 7, 1, a[1] - nz * 7]);
    }
    if (i % 6 === 0){
      bvBox3(white, 0.45, roofY - deckY, 0.45, a[0] + nx * 8, deckY, a[1] + nz * 8, 0);
      bvBox3(white, 0.45, roofY - deckY, 0.45, a[0] - nx * 8, deckY, a[1] - nz * 8, 0);
    }
    if (i % 8 === 0 && Math.abs(m - s0) > 30){
      bvBox3(conc, 1.1, deckY, 0.8, a[0], 0, a[1], Math.atan2(dz, dx));
    }
    // 两条钢轨
    bvBox3(railC, L, 0.18, 0.28, (a[0] + b[0]) / 2 + nx * 1.7, deckY + 0.7, (a[1] + b[1]) / 2 + nz * 1.7, -Math.atan2(dz, dx));
    bvBox3(railC, L, 0.18, 0.28, (a[0] + b[0]) / 2 - nx * 1.7, deckY + 0.7, (a[1] + b[1]) / 2 - nz * 1.7, -Math.atan2(dz, dx));
  }
  // 屋面上五个通风方盒子，沿站屋均匀排开。
  let placed = 0;
  for (let i = 0; i < line.length && placed < 5; i++){
    const u = (cum[i] - (s0 - 50)) / 100;
    if (u > placed / 4 && Math.abs(cum[i] - s0) < 52){
      const p = line[i], q = line[Math.min(line.length - 1, i + 1)];
      bvBox3(steel, 9, 1.15, 4.2, p[0], roofY + 0.8, p[1], -Math.atan2(q[1] - p[1], q[0] - p[0]));
      placed++;
    }
  }
  // 地面小出入口，用它们自己的轮廓。
  bvPrism(glass, bvPart('buona_vista_mrt', 1131873757), 0, 6, true);
  bvPrism(white, bvPart('buona_vista_mrt', 1187773826), 4.5, 6.2, true);
  bvFlush(g, M);
}

// ---------- 启奥城：七座实验楼，天桥相连 ----------
function bvBio(g){
  const spec = [
    ['Helios', 77.7, 'tan'],
    ['Matrix', 61, 'glass'],
    ['Nanos', 52, 'glass'],
    ['Proteos', 48, 'tan'],
    ['Genome', 46, 'tan'],
    ['Centros', 44, 'mix'],
    ['Chromos', 40, 'tan']
  ];
  const M = bvBag();
  const tan = bvGet(M, bvW('#c4a88a', 0.28));
  const win = bvGet(M, bvGlass('#4e6878', 3.6, 3.4, 0.55));
  const glass = bvGet(M, bvGlass('#3e5a68', 3.7, 3.2, 0.6));
  const band = bvGet(M, '#efe6da');
  const roof = bvGet(M, '#b9c0c4');
  const cell = bvGet(M, '#3d5f86');
  const bridge = bvGet(M, bvG('#d5e2ea', 3.2, 3));
  const white = bvGet(M, '#f3f5f4');
  const blocks = [];
  for (const [name, h, kind] of spec){
    const P = bvByName('biopolis', name);
    if (!P) continue;
    blocks.push({name, h, c: bvCtr(P), P});
      if (kind === 'glass'){
      bvCurtain(glass, band, white, P, 0, h, {fh: 3.7, bay: 3.3, bh: 0.28, bt: 0.32});
      // 矩阵楼是整片玻璃，屋顶不再铺光伏；其余玻璃楼仍有电池板。
      if (name === 'Matrix') bvCap(roof, P, h + 0.05);
      else bvSolar(roof, cell, bvOff(P, 1.2), h + 0.05);
    } else if (kind === 'mix'){
      bvPunch(tan, win, P, 0, h * 0.62, {fh: 3.6, bay: 3.5});
      bvCurtain(glass, band, white, P, h * 0.62, h, {fh: 3.6, bay: 3.4, bh: 0.25});
      bvCap(roof, P, h + 0.02);
    } else {
      bvPunch(tan, win, P, 0, h, {fh: 3.55, bay: name === 'Helios' ? 4.0 : 3.5, wh: name === 'Helios' ? 0.48 : 0.58});
      bvEdgeBand(band, P, h - 1.2, 1.2, 0.6, 0.05);
      if (name === 'Helios') bvCap(roof, P, h + 0.02);
      else bvSolar(roof, cell, bvOff(P, 1), h + 0.05);
    }
  }
  // 靠得近的楼之间拉玻璃天桥。太远的不拉，避免桥悬在路中央。
  for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++){
    const A = blocks[i], B = blocks[j];
    const dx = B.c[0] - A.c[0], dz = B.c[1] - A.c[1], L = Math.hypot(dx, dz);
    if (L < 42 || L > 92) continue;
    const ang = Math.atan2(dz, dx);
    const y = 14;
    bvBox3(bridge, L - 18, 3.4, 4.2, (A.c[0] + B.c[0]) / 2, y, (A.c[1] + B.c[1]) / 2, -ang);
    if (L < 78) bvBox3(bridge, L - 22, 3.2, 3.6, (A.c[0] + B.c[0]) / 2, 28, (A.c[1] + B.c[1]) / 2, -ang);
  }
  bvFlush(g, M);
}

// ---------- 启汇城一期：三座弧形塔 + 空中花园带 ----------
function bvFus(g){
  const M = bvBag();
  const glass = bvGet(M, bvGlass('#3d6e68', 4.0, 3.0, 0.66));
  const white = bvGet(M, bvMetal('#f4f6f4', 0.18));
  const mull = bvGet(M, bvMetal('#d7e0dc', 0.22));
  const green = bvGet(M, '#5e8a52');
  const pod = bvGet(M, bvGlass('#4a6a68', 4.2, 4, 0.4));
  const dome = bvGet(M, bvGlass('#7eb8b4', 4, 4, 0.5));
  const leaf = bvGet(M, '#6f9a58');
  const trunk = bvGet(M, '#6d5a48');
  const towers = [
    ['Connexis North', 134, 0.46],
    ['Connexis South', 123, 0.32],
    ['Symbiosis', 134, 0.3]
  ];
  const outer = bvPart('fusionopolis_one', 175841411);
  bvPrism(pod, outer, 0, 16, true);
  const cents = [];
  for (const [name, h, er] of towers){
    const P = bvByName('fusionopolis_one', name);
    if (!P) continue;
    bvCurtain(glass, mull, mull, P, 16, h, {fh: 3.8, bay: 2.6, bh: 0.16, bt: 0.2, push: 0.02});
    // 每隔大约五层，一条厚的白色空中花园，上面铺一窄条绿。
    // 白色空中花园带要比绿植更醒目，绿只是带顶上的一薄层。
    for (let y = 30; y < h - 10; y += 18){
      bvEdgeBand(white, P, y, 4.2, 2.2, 0.15);
      bvEdgeBand(green, P, y + 4.2, 0.45, 2.4, 0.1);
    }
    const c = bvCtr(P), b = bvBox(P);
    const rx = (b[2] - b[0]) * er, rz = (b[3] - b[1]) * er;
    const E = bvEll(c[0], c[1], rx, rz, 0.4, 32);
    bvPrism(green, E, h + 0.15, h + 0.55, false);
    bvEdgeBand(white, E, h + 0.2, 1.3, 0.45, 0);
    // 草坪上散几棵树
    for (let k = 0; k < 7; k++){
      const a = k / 7 * BVtau;
      bvTree(trunk, leaf, c[0] + Math.cos(a) * rx * 0.45, h + 0.55, c[1] + Math.sin(a) * rz * 0.45, 1.1);
    }
    cents.push(c);
  }
  // 三塔中间的玻璃圆厅，坐在裙房上。
  if (cents.length === 3){
    const cx = (cents[0][0] + cents[1][0] + cents[2][0]) / 3, cz = (cents[0][1] + cents[1][1] + cents[2][1]) / 3;
    const R = bvEll(cx, cz, 14, 11, 0.3, 24);
    bvWall(dome, R, 16, 24);
    for (let k = 0; k <= 5; k++){
      const a = k / 5 * Math.PI / 2, rr = Math.cos(a), yy = 24 + Math.sin(a) * 6;
      const A = bvEll(cx, cz, 14 * rr, 11 * rr, 0.3, 24);
      if (k) bvLoft(dome, bvEll(cx, cz, 14 * Math.cos((k - 1) / 5 * Math.PI / 2), 11 * Math.cos((k - 1) / 5 * Math.PI / 2), 0.3, 24), 24 + Math.sin((k - 1) / 5 * Math.PI / 2) * 6, A, yy);
    }
    // 北塔和共生塔之间那条肋状连桥。
    const a = cents[0], b = cents[2];
    const mx = (a[0] + b[0]) / 2 + 8, mz = (a[1] + b[1]) / 2;
    for (let i = 0; i < 8; i++){
      const t = i / 8, t2 = (i + 1) / 8;
      const p = [a[0] * (1 - t) * (1 - t) + mx * 2 * (1 - t) * t + b[0] * t * t, 22, a[1] * (1 - t) * (1 - t) + mz * 2 * (1 - t) * t + b[1] * t * t];
      const q = [a[0] * (1 - t2) * (1 - t2) + mx * 2 * (1 - t2) * t2 + b[0] * t2 * t2, 26, a[1] * (1 - t2) * (1 - t2) + mz * 2 * (1 - t2) * t2 + b[1] * t2 * t2];
      bvBox3(white, Math.hypot(q[0] - p[0], q[2] - p[2]) + 0.4, 3.2, 4.5, (p[0] + q[0]) / 2, 24, (p[2] + q[2]) / 2, -Math.atan2(q[2] - p[2], q[0] - p[0]));
    }
  }
  bvFlush(g, M);
}

// ---------- 索拉里斯：层层退台的白楼板 + 绕楼的绿坡 ----------
function bvSol(g){
  const M = bvBag();
  const white = bvGet(M, '#f4f6f4');
  const glass = bvGet(M, bvGlass('#4a6268', 4.2, 3.2, 0.48));
  const green = bvGet(M, '#6ea364');
  const soil = bvGet(M, '#8a9a62');
  const trunk = bvGet(M, '#6a5344');
  const leaf = bvGet(M, '#5e944c');
  const frame = bvGet(M, '#fbfbfb');
  const south = bvByName('solaris', 'Solaris South Tower');
  const north = bvByName('solaris', 'Solaris North Tower');
  const outer = bvPart('solaris', 123988232);
  bvPrism(white, outer, 0, 5, true);
  bvCap(soil, bvOff(outer, 6), 5.05);
  // 每一层楼板向外微微起伏，玻璃缩在里面，外圈种树。这就是照片里那一圈圈白带子。
  const stack = (P, floors, fh, amp) => {
    const N = bvOutN(P);
    for (let f = 0; f < floors; f++){
      const y = 5 + f * fh;
      const wave = P.map((p, i) => {
        const w = Math.sin(i * 0.85 + f * 0.7) * amp;
        return [p[0] + N[i][0] * w, p[1] + N[i][1] * w];
      });
      bvLoft(white, wave, y, wave, y + 0.85);
      bvCap(white, wave, y + 0.85);
      bvWall(glass, bvOff(P, 1.4), y + 0.85, y + fh);
      if (f % 2 === 0){
        for (let i = 0; i < wave.length; i += 2){
          const p = wave[i];
          bvTree(trunk, leaf, p[0] + N[i][0] * 1.1, y + 0.85, p[1] + N[i][1] * 1.1, 1.15);
        }
      }
    }
    bvCap(green, P, 5 + floors * fh);
  };
  stack(south, 15, 4.7, 4.8);   // 起伏加大，轮廓才不像一层层方盒子
  bvEdgeBand(frame, south, 5 + 15 * 4.7, 5, 0.7, 0.2);
  stack(north, 9, 4.6, 3.6);
  // 绕南塔爬升的那条连续绿坡。sample 转一圈多，高度跟着走。
  const samp = bvSamp(south, 3.2);
  const turns = 2.4, total = Math.floor(samp.length * turns);
  let prev = null;
  for (let i = 0; i <= total; i++){
    const s = samp[i % samp.length];
    const y = 6 + (74 - 6) * (i / total);
    const a = [s.x + s.nx * 1.2, y, s.z + s.nz * 1.2];
    const b = [s.x + s.nx * 7.2, y, s.z + s.nz * 7.2];
    if (prev){
      bvQ(white, prev.a, prev.b, b, a);
      bvQ(green, [prev.a[0], prev.a[1] + 0.25, prev.a[2]], [prev.b[0], prev.b[1] + 0.25, prev.b[2]], [b[0], b[1] + 0.25, b[2]], [a[0], a[1] + 0.25, a[2]]);
      bvQ(frame, [prev.b[0], prev.b[1] - 0.7, prev.b[2]], prev.b, b, [b[0], b[1] - 0.7, b[2]]);
    }
    prev = {a, b};
  }
  // 南侧那片带斜撑的玻璃中庭，贴在南塔最长的一条边上。
  let li = 0, lL = 0;
  for (let i = 0; i < south.length; i++){
    const a = south[i], b = south[(i + 1) % south.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L > lL){ lL = L; li = i; }
  }
  const ea = south[li], eb = south[(li + 1) % south.length];
  const edx = eb[0] - ea[0], edz = eb[1] - ea[1], eL = Math.hypot(edx, edz) || 1;
  const enx = edz / eL, enz = -edx / eL;
  for (let f = 0; f < 12; f++){
    const y = 8 + f * 5;
    bvQ(glass,
      [ea[0] + enx * 1.2, y, ea[1] + enz * 1.2],
      [eb[0] + enx * 1.2, y, eb[1] + enz * 1.2],
      [eb[0] + enx * 1.2, y + 5, eb[1] + enz * 1.2],
      [ea[0] + enx * 1.2, y + 5, ea[1] + enz * 1.2]);
    bvQ(frame,
      [ea[0] + enx * 1.5, y, ea[1] + enz * 1.5],
      [eb[0] + enx * 1.5, y + 5, eb[1] + enz * 1.5],
      [eb[0] + enx * 1.9, y + 5, eb[1] + enz * 1.9],
      [ea[0] + enx * 1.9, y, ea[1] + enz * 1.9]);
  }
  bvFlush(g, M);
}

// ---------- 盖拉西斯：像素立面、底部紫色、大屋檐 ----------
function bvGal(g){
  const P = bvPart('galaxis', 175841412);
  const M = bvBag();
  // 0 亮灰 1 中灰 2 深玻璃 3 白，4/5 是底部的紫。
  const cols = ['#b4bdc4', '#7a868e', '#3a4650', '#d0d6db', '#5a3d70', '#73558c'].map(hex => bvGet(M, bvGlass(hex, 4.5, 3.4, 0.35)));
  const roof = bvGet(M, bvMetal('#b4babf', 0.2));
  const edge = bvGet(M, '#eceee9');
  const dark = bvGet(M, '#3e4650');
  const shaftTop = 84;
  bvPixel(cols, P, 0, shaftTop, 4.5, 3.5, true);
  const cap = bvOff(P, -6.5);
  bvPrism(roof, cap, shaftTop, 93.7, false);
  bvEdgeBand(edge, cap, shaftTop, 1.1, 0.6, 0);
  // 屋檐下的一条深色阴影，让出挑读得出来。
  bvEdgeBand(dark, P, shaftTop - 1.2, 1.2, 0.4, 0.05);
  bvCap(dark, bvOff(P, 4), 8); // 入口雨篷的一点暗示：内院低屋顶
  bvFlush(g, M);
}

// ---------- 新传媒：银白色水平线条的叶子形综合体 ----------
function bvMedia(g){
  const P = bvPart('mediacorp', 352920078);
  const M = bvBag();
  const metal = bvGet(M, bvGlass('#7e908c', 3.6, 3.6, 0.48));
  const band = bvGet(M, bvMetal('#e7eeea', 0.2));
  const green = bvGet(M, '#7d9a68');
  const equip = bvGet(M, '#b7bec3');
  const drum = bvGet(M, '#d5dbde');
  const glass = bvGet(M, bvGlass('#5e7874', 4, 4, 0.5));
  // 整片叶子先做到 46 米（北端的绿屋顶就在这个高度），南边的脊再往上长。
  bvCurtain(metal, band, band, P, 0, 46, {fh: 3.6, bay: 4.2, bh: 0.55, bt: 0.55, push: 0.05});
  // 用一条水平线把叶子切成南北两段。z 越小越靠北。
  const clip = (P0, keep) => {
    const out = [];
    for (let i = 0; i < P0.length; i++){
      const a = P0[i], b = P0[(i + 1) % P0.length], ia = keep(a), ib = keep(b);
      const hit = () => {
        const t = ( -15 - a[1]) / (b[1] - a[1] + 1e-9);
        return [a[0] + (b[0] - a[0]) * t, -15];
      };
      if (ia && ib) out.push(b);
      else if (ia && !ib) out.push(hit());
      else if (!ia && ib){ out.push(hit()); out.push(b); }
    }
    return out.length > 3 ? bvCCW(out) : null;
  };
  const south = clip(P, p => p[1] > -15);
  const north = clip(P, p => p[1] < -15);
  if (south){
    bvCurtain(metal, band, band, south, 46, 70, {fh: 3.6, bay: 4.2, bh: 0.5, bt: 0.5, push: 0.02});
    bvCap(equip, south, 70.05);
    const c = bvCtr(south);
    // 南段屋面上的圆形设备（照片里那几只圆盘）。
    bvCyl(drum, c[0] - 6, 70, c[1] - 10, 7, 3.2, 16);
    bvCyl(drum, c[0] + 8, 70, c[1] + 6, 6, 2.6, 14);
    bvCyl(drum, c[0] - 2, 70, c[1] + 16, 5, 2.2, 12);
    bvBox3(equip, 16, 2.4, 8, c[0] + 2, 70, c[1] + 30, 0.3);
  }
  if (north){
    bvCap(green, bvOff(north, 2), 46.2);
    const c = bvCtr(north);
    for (let k = 0; k < 6; k++){
      const a = k / 6 * BVtau;
      bvTree(bvGet(M, '#6a5344'), bvGet(M, '#6e9854'), c[0] + Math.cos(a) * 8, 46.2, c[1] + Math.sin(a) * 6, 1.2);
    }
  }
  // 北端入口的玻璃厅。
  const nc = north ? bvCtr(north) : bvCtr(P);
  bvCyl(glass, nc[0], 0, nc[1] + 8, 10, 12, 12);
  bvFlush(g, M);
}

// ---------- 罗切斯特：住宅塔、酒店塔、商场 ----------
function bvRoch(g){
  const mall = bvPart('rochester', 167472305);
  const home = bvPart('rochester', 167472309);
  const hotel = bvPart('rochester', 167472303);
  const M = bvBag();
  const glass = bvGet(M, bvGlass('#5a7080', 3.25, 2.8, 0.55));
  const glassH = bvGet(M, bvGlass('#4e6878', 3.4, 2.8, 0.6));
  const slab = bvGet(M, bvMetal('#e4e0d8', 0.12));
  const terra = bvGet(M, bvW('#c9a090', 0.4));
  const mallC = bvGet(M, bvW('#e6e1d8', 0.3));
  const win = bvGet(M, bvGlass('#5a7080', 4.2, 4, 0.4));
  const roof = bvGet(M, '#c5ccd0');
  const pool = bvGet(M, '#3f86b0');
  const cell = bvGet(M, '#355a86');
  const base = bvGet(M, '#d9d3ca');
  // 商场 36 米，屋顶光伏。
  bvPunch(mallC, win, mall, 0, 36, {fh: 4.4, bay: 5.5, wh: 0.45});
  bvSolar(base, cell, bvOff(mall, 1), 36.1);
  // 住宅：37 层阳台，短边铺陶土色，屋顶泳池。OSM 标 120 米，实测含屋顶构筑到 138，这里屋顶屏风收到 130。
  bvBalc(slab, glass, home, 0, 120, 3.25, 1.35);
  // 短边换成陶土色竖条，让侧面不是一整片玻璃。
  for (let i = 0; i < home.length; i++){
    const a = home[i], b = home[(i + 1) % home.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L > 22) continue;
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const nx = (b[1] - a[1]) / L, nz = -(b[0] - a[0]) / L;
    bvBox3(terra, L, 120, 0.4, (a[0] + b[0]) / 2 + nx * 1.5, 0, (a[1] + b[1]) / 2 + nz * 1.5, -ang);
  }
  bvEdgeBand(slab, home, 120, 8, 0.5, 0.2);
  const hc = bvCtr(home);
  bvBox3(pool, 10, 0.4, 5, hc[0] - 4, 120.2, hc[1] + 2, 0.4);
  bvBox3(pool, 7, 0.4, 4, hc[0] + 6, 120.2, hc[1] - 3, 0.2);
  bvBox3(roof, 8, 6, 6, hc[0], 120, hc[1] + 8, 0);
  // 酒店塔更偏玻璃，少一点阳台。
  bvCurtain(glassH, slab, slab, hotel, 0, 102, {fh: 3.4, bay: 3.0, bh: 0.28, bt: 0.45, push: 0.15});
  bvEdgeBand(slab, hotel, 102, 6, 0.45, 0.1);
  bvBox3(pool, 8, 0.35, 4, bvCtr(hotel)[0], 102.2, bvCtr(hotel)[1], 0.6);
  bvFlush(g, M);
}

// 给玻璃用的天空反射。对照页自己也会做一张；这里是放进城市页面时用的。
function bvMakeEnv(){
  if (typeof document === 'undefined') return null;
  const mk = (top, mid, bot, sun) => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, 64);
    grd.addColorStop(0, top); grd.addColorStop(0.6, mid); grd.addColorStop(1, bot);
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    if (sun){ g.fillStyle = 'rgba(255,248,230,0.9)'; g.beginPath(); g.arc(42, 16, 7, 0, 6.3); g.fill(); }
    return c;
  };
  const tex = new THREE.CubeTexture([
    mk('#8eb8dc', '#d7e6f0', '#8aa46c', 1), mk('#7eadd4', '#d2e3ee', '#7e9a64', 1),
    mk('#c5dff0', '#e7f1f6', '#d5e4ef', 0), mk('#6d8a58', '#7f9a68', '#5c7848', 0),
    mk('#8eb8dc', '#d7e6f0', '#8aa46c', 1), mk('#7eadd4', '#d2e3ee', '#7e9a64', 0)
  ]);
  tex.needsUpdate = true;
  return tex;
}
try { window.BV_ENV = bvMakeEnv(); } catch (e){ /* 没有页面时跳过 */ }

// ---------- 登记进城市 ----------
// r 大约是占地半径，用来决定名字从多远能看见；h 是最高点，夜景灯光用它算楼有多高。
function bvReg(key, zh, en, h, r, fn, lat, lon){
  LANDMARKS[key] = {zh, en, cat: 'new', r, h, lt: {m: 1, c: '#d5e4f2', k: 0.62, e: 0.4, anim: 'breathe'}, build(){
    const g = new THREE.Group();
    fn(g);
    return g;
  }};
  SG_PLACES.push({type: key, lat, lon, rot: 0});
}
bvReg('bvstar', '星悦汇', 'The Star Vista', 74.5, 110, bvStar, BV.star_vista.lat, BV.star_vista.lon);
bvReg('bvmetropolis', '大都会', 'The Metropolis', 113.4, 100, bvMetro, BV.metropolis.lat, BV.metropolis.lon);
bvReg('bvmrt', '波纳维斯达站', 'Buona Vista MRT', 19, 130, bvMRT, BV.buona_vista_mrt.lat, BV.buona_vista_mrt.lon);
bvReg('bvbiopolis', '启奥城', 'Biopolis', 77.7, 200, bvBio, BV.biopolis.lat, BV.biopolis.lon);
bvReg('bvfusion', '启汇城一期', 'Fusionopolis One', 135.9, 90, bvFus, BV.fusionopolis_one.lat, BV.fusionopolis_one.lon);
bvReg('bvsolaris', '索拉里斯', 'Solaris @ one-north', 80.1, 80, bvSol, BV.solaris.lat, BV.solaris.lon);
bvReg('bvgalaxis', '盖拉西斯', 'Galaxis', 93.7, 100, bvGal, BV.galaxis.lat, BV.galaxis.lon);
bvReg('bvmediacorp', '新传媒', 'Mediacorp Campus', 76, 140, bvMedia, BV.mediacorp.lat, BV.mediacorp.lon);
bvReg('bvrochester', '罗切斯特', 'The Rochester', 130, 100, bvRoch, BV.rochester.lat, BV.rochester.lon);

// 介绍卡。点地标时 lmcard 会来读。只写核对过的事实。
const bvInfo = {
  bvstar: {k:{zh:'商场 · 表演场地', en:'Mall and performance venue'}, y:'2012', h:74.5, a:{zh:'Aedas（安德鲁·布朗伯格）', en:'Aedas (Andrew Bromberg)'},
    d:{zh:'星悦汇在波纳维斯达地铁站旁边，2012 年开幕。折面玻璃壳罩着一个露天中庭，里面是商场和可容纳约五千人的剧院。壳顶分成两片翼，边缘低下去，中间高起来。',
       en:'The Star Vista opened in 2012 beside Buona Vista MRT. A faceted glass shell covers an open-air atrium, with a mall and an auditorium of about 5,000 seats. The roof is two wings, low at the eaves and high along the ridge.'}},
  bvmetropolis: {k:{zh:'办公双塔', en:'Twin office towers'}, h:113,
    d:{zh:'大都会是波纳维斯达路口的一对办公楼，立面以密密的水平遮阳板为主，两塔之间有低层裙房和玻璃连廊。模型高度按实测屋顶减去地面，约 113 米。',
       en:'The Metropolis is a pair of offices at the Buona Vista junction. The facades are dense horizontal sunshades, with a low podium and a glazed link between the towers. The model uses the measured roof-minus-ground height, about 113 m.'}},
  bvmrt: {k:{zh:'地铁站', en:'MRT station'}, y:'1988 / 2011', h:19,
    d:{zh:'波纳维斯达站是东西线与环线的换乘站。东西线高架，1988 年开通；环线在地下，2011 年开通。模型画的是高架站屋：薄荷绿屋面、五个通风盒，以及穿过站台的高架轨道。',
       en:'Buona Vista is the interchange of the East West Line and the Circle Line. The East West Line is elevated and opened in 1988; the Circle Line is underground and opened in 2011. The model is the elevated station: a mint roof, five vent boxes, and the viaduct through the platforms.'}},
  bvbiopolis: {k:{zh:'生物医药园区', en:'Biomedical campus'}, y:'2003', h:77.7, a:{zh:'扎哈·哈迪德建筑事务所', en:'Zaha Hadid Architects'},
    d:{zh:'启奥城一期是纬壹的生物医药园区，2003 年启用，总图由扎哈·哈迪德事务所设计。七座楼以生物学术语命名：和易（Helios）、矩阵（Matrix）、纳米（Nanos）、蛋白（Proteos）、基因组（Genome）、中心（Centros）、染色体（Chromos），楼与楼之间有天桥。',
       en:'Biopolis phase 1 opened in 2003 as the biomedical campus of one-north, masterplanned by Zaha Hadid Architects. Seven blocks are named Helios, Matrix, Nanos, Proteos, Genome, Centros and Chromos, and linked by bridges.'}},
  bvfusion: {k:{zh:'科研办公', en:'Research offices'}, y:'2008', h:135.9, a:{zh:'黑川纪章建筑都市设计事务所', en:'Kisho Kurokawa Architects and Associates'},
    d:{zh:'启汇城一期 2008 年落成，包括共生（Symbiosis）以及汇联北座、南座（Connexis）。三座弧形玻璃塔上有一圈圈空中花园，屋顶有椭圆形草坪。北座和共生塔约 134 米，南座约 123 米。',
       en:'Fusionopolis One was completed in 2008: Symbiosis plus Connexis North and South. Three curved glass towers carry stacked sky gardens and oval lawns on the roof. North and Symbiosis are about 134 m, South about 123 m.'}},
  bvsolaris: {k:{zh:'办公 · 绿坡', en:'Offices with a green ramp'}, y:'2010', h:80, a:{zh:'杨经文 / T.R. Hamzah & Yeang', en:'Ken Yeang / T.R. Hamzah & Yeang'},
    d:{zh:'索拉里斯在纬壹，2010 年落成，设计者杨经文。南塔约 15 层、北塔约 9 层，外圈是连续的绿化坡道，绕着楼往上爬，楼板呈一层层白色退台。',
       en:'Solaris at one-north was completed in 2010, designed by Ken Yeang. The south tower is about 15 storeys and the north tower about 9. A continuous planted ramp climbs around the outside, and the floors read as stacked white terraces.'}},
  bvgalaxis: {k:{zh:'办公', en:'Offices'}, h:93.7,
    d:{zh:'盖拉西斯在启汇城一期旁边。立面是深浅不一的方格子，底下几层偏紫，屋顶有一大块出挑的平板。模型高度用的是实测约 94 米。',
       en:'Galaxis stands beside Fusionopolis One. Its facade is a grid of light and dark pixels, with a purple tint on the lowest floors and a wide overhanging roof slab. The model uses the measured height of about 94 m.'}},
  bvmediacorp: {k:{zh:'广播园区', en:'Broadcast campus'}, y:'2015', h:76,
    d:{zh:'新传媒在纬壹的园区是一座叶子形的银白色建筑，水平线条很密。北端屋顶是绿化平台，南段屋面上有圆形设备。模型最高约 76 米，和实测一致。',
       en:'Mediacorp\'s one-north campus is a leaf-shaped silver building with tight horizontal bands. The north roof is planted; the south roof carries round mechanical drums. The model tops out near the measured 76 m.'}},
  bvrochester: {k:{zh:'住宅 · 酒店 · 商场', en:'Homes, hotel and mall'}, h:130,
    d:{zh:'罗切斯特这组建筑包括住宅塔（The Rochester，OSM 标高 120 米、37 层）、柏宁酒店（Park Avenue Rochester，102 米）和罗切斯特商场（36 米，屋顶有光伏）。住宅以阳台为主，短边是陶土色。',
       en:'The Rochester group is a residential tower (tagged 120 m, 37 storeys), the Park Avenue Rochester hotel (102 m) and Rochester Mall (36 m, with roof photovoltaics). The homes read as balcony slabs, with terracotta end walls.'}}
};
const bvWin = typeof window !== 'undefined' ? window : globalThis;
try { bvWin.LM_INFO = Object.assign(bvWin.LM_INFO || {}, bvInfo); } catch (e){ /* 介绍卡模块还没加载时先挂在全局上 */ }

// 通用高架模型会在车站位置再盖一座白色站棚。这里告诉它：离我们这座站 160 米以内的站，不要再画那座通用站棚。
bvWin.BV_SKIP_ST = function(S){
  try {
    for (let i = 0; i < landmarks.length; i++){
      const L = landmarks[i];
      if (L.type === 'bvmrt' && Math.hypot(L.x - S.x, L.y - S.y) < 160) return true;
    }
  } catch (e){ /* 地标还没放 */ }
  return false;
};

// 打开 index.html?view=bv 或 #buonavista，镜头直接落到纬壹这片，而不是滨海湾。
bvWin.bvApplyView = function(){
  let want = false;
  try {
    const q = new URLSearchParams(location.search);
    const h = (location.hash || '').toLowerCase();
    const v = (q.get('view') || '').toLowerCase();
    want = v === 'bv' || v === 'buonavista' || v === 'one-north' || h.indexOf('buonavista') >= 0 || h === '#bv' || h.indexOf('one-north') >= 0;
  } catch (e){ want = false; }
  if (!want || typeof sgXY !== 'function') return;
  const t = sgXY(1.3022, 103.7896), y = 36;
  controls.target.set(t[0], y, -t[1]);
  camera.position.set(t[0] + 820, y + 480, -t[1] + 1040);
  try { controls.update(); } catch (e){ /* 控件还没就绪 */ }
};
