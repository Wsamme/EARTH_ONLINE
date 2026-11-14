// Offline check + tiny software renderer (no browser): node soft.js <module.js> <key|site:key> <out.png> [views json] [night]
// Stubs the landmark helpers used by szhouhai.js (LTris only), runs build(), prints tris / materials / bbox / rmax / NaN count,
// and z-buffer renders flat-shaded views (material colour, Lambert from a fixed sun; night: glow / LED / window tint).
const fs = require('fs'), zlib = require('zlib'), path = require('path');
global.THREE = require('/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/vend/package/build/three.min.js');
const [file, key, out] = process.argv.slice(2); const views = process.argv[5] ? JSON.parse(process.argv[5]) : null;
const TRIS = []; // {p:Float32Array-like array, spec}
global.LANDMARKS = {}; global.SG_PLACES = []; global.SITES = {};
global.LTris = (g, pos, col) => { const sp = typeof col === 'string' ? {c:col} : col; for (let i = 0; i < pos.length; i++) if (!isFinite(pos[i])) { TRIS.nan = (TRIS.nan || 0) + 1; break; } TRIS.push({pos, sp, g}); return null; };
let seed = 7; const rng = () => { seed = (seed*16807) % 2147483647; return (seed - 1)/2147483646; };
global.LMCTX = {rng};
new Function(fs.readFileSync(file, 'utf8'))();
let g, isSite = key.startsWith('site:'), k = key.replace('site:', ''), def = isSite ? SITES[k] : LANDMARKS[k];
const paints = [], lamps = [], trees = [];
const t0 = Date.now();
if (isSite){ const gy0 = +(process.env.GY || 0); g = def.build({gy:(x, z) => gy0, paint:(P, c) => paints.push([P, c]), line:(P, w, c) => paints.push([P, c, w]), tree:(x, z, s, kd) => trees.push([x, z, s]), lamp:(x, y, z, c) => lamps.push([x, y, z]), rng}); }
else g = def.build();
const ms = Date.now() - t0;
let n = 0, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9, rmax = 0; const mats = new Set();
for (const T of TRIS){ n += T.pos.length/9; mats.add(JSON.stringify(T.sp)); for (let i = 0; i < T.pos.length; i += 3){ const x = T.pos[i], y = T.pos[i+1], z = T.pos[i+2]; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); z0 = Math.min(z0, z); z1 = Math.max(z1, z); rmax = Math.max(rmax, Math.hypot(x, z)); } }
let pts = 0; g.traverse && g.traverse(o => { if (o.isPoints) pts += o.geometry.attributes.position.count; });
console.log(key, JSON.stringify({tris:n, calls:TRIS.length, mats:mats.size, ms, rmax:Math.round(rmax), r:def.r, h:def.h, bb:[x0, x1, y0, y1, z0, z1].map(v => Math.round(v*10)/10), nan:TRIS.nan || 0, sprites:pts, paints:paints.length, trees:trees.length, lamps:lamps.length}));
if (!out) process.exit(0);
// ---------- render ----------
const W = +(process.env.W || 900), H = +(process.env.H || 600);
const cx = (x0 + x1)/2, cz = (z0 + z1)/2, cy = (y0 + y1)/2, R = Math.max(x1 - x0, y1 - y0, z1 - z0)*0.62;
const V = views || [[cx, cy, cz, R*2.6, 18, 200, 0], [cx, cy*0.8, cz, R*1.4, 8, 140, 0], [cx, cy, cz, R*2.6, 18, 200, 1]];
const hex = c => { const v = parseInt(c.slice(1), 16); return [(v >> 16)/255, ((v >> 8) & 255)/255, (v & 255)/255]; };
const imgs = [];
for (const [tx, ty, tz, d, el, az, night] of V){
  const e = el*Math.PI/180, a = az*Math.PI/180;
  // camera: azimuth 0 = camera south looking north (+z is south)
  const cam = [tx + Math.sin(a)*Math.cos(e)*d, ty + Math.sin(e)*d, tz + Math.cos(a)*Math.cos(e)*d];
  const f = [tx - cam[0], ty - cam[1], tz - cam[2]], fl = Math.hypot(...f); f[0] /= fl; f[1] /= fl; f[2] /= fl;
  let r = [f[2], 0, -f[0]]; const rl = Math.hypot(...r); r = r.map(v => -v/rl); const u = [r[1]*f[2] - r[2]*f[1], r[2]*f[0] - r[0]*f[2], r[0]*f[1] - r[1]*f[0]];
  const fov = 1/Math.tan(22*Math.PI/180);
  const zb = new Float32Array(W*H).fill(1e30), cb = new Float32Array(W*H*3);
  const bg = night ? [0.04, 0.05, 0.09] : [0.78, 0.84, 0.9]; for (let i = 0; i < W*H; i++){ cb[3*i] = bg[0]; cb[3*i+1] = bg[1]; cb[3*i+2] = bg[2]; }
  const sun = [0.45, 0.8, 0.4]; const sl = Math.hypot(...sun); sun[0] /= sl; sun[1] /= sl; sun[2] /= sl;
  const proj = (x, y, z) => { const dx = x - cam[0], dy = y - cam[1], dz = z - cam[2]; const zc = dx*f[0] + dy*f[1] + dz*f[2]; if (zc < 0.5) return null; return [W/2 + (dx*r[0] + dy*r[1] + dz*r[2])/zc*fov*H/2, H/2 - (dx*u[0] + dy*u[1] + dz*u[2])/zc*fov*H/2, zc]; };
  // ground grid
  for (const T of TRIS){ const sp = T.sp, base = hex(sp.c || '#888888'); const P = T.pos;
    for (let i = 0; i < P.length; i += 9){
      const A = [P[i], P[i+1], P[i+2]], Bv = [P[i+3], P[i+4], P[i+5]], C = [P[i+6], P[i+7], P[i+8]];
      const e1 = [Bv[0] - A[0], Bv[1] - A[1], Bv[2] - A[2]], e2 = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
      let nx = e1[1]*e2[2] - e1[2]*e2[1], ny = e1[2]*e2[0] - e1[0]*e2[2], nz = e1[0]*e2[1] - e1[1]*e2[0]; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      const vx = A[0] - cam[0], vy = A[1] - cam[1], vz = A[2] - cam[2]; if (nx*vx + ny*vy + nz*vz > 0){ nx = -nx; ny = -ny; nz = -nz; }
      let col;
      if (!night){ const l = 0.45 + 0.55*Math.max(0, nx*sun[0] + ny*sun[1] + nz*sun[2]); col = base.map(v => v*l); }
      else { col = base.map(v => v*0.06); const hN = Math.max(0, Math.min(1, (A[1] - y0)/Math.max(1, y1 - y0)));
        if (sp.glow){ const gcol = hex(sp.glow); col = col.map((v, j) => v + gcol[j]*(sp.gk || 1)*0.8); }
        const m = sp.m !== undefined ? sp.m : (def.lt ? def.lt.m : 0);
        if (m === 2){ const hue = [0, 0.33, 0.67].map(o => 0.5 + 0.5*Math.cos(6.283*(o + A[1]*0.003))); col = col.map((v, j) => v + hue[j]*0.85*(sp.lk || 0.6)); }
        else if (m === 1 && Math.abs(ny) < 0.5){ const fl2 = Math.floor(A[1]/(sp.fh || 3.8)), hz = Math.abs(nx) > Math.abs(nz) ? A[2] : A[0]; const rr = (Math.sin(fl2*12.9898 + Math.floor(hz/(sp.cw || 3))*78.233)*43758.5453) % 1; if (Math.abs(rr) < 0.55) col = col.map((v, j) => v + [0.9, 0.78, 0.55][j]*0.6); }
        else if (m === 0){ const lc = hex(sp.lc || (def.lt && def.lt.c) || '#ffffff'); const k = (sp.lk !== undefined ? sp.lk : (def.lt ? def.lt.k : 0.5)); col = col.map((v, j) => v + base[j]*lc[j]*k*(0.2 + 1.15*Math.pow(1 - hN, 1.7))*(1 - 0.55*Math.abs(ny))); } }
      const p = [proj(...A), proj(...Bv), proj(...C)]; if (!p[0] || !p[1] || !p[2]) continue;
      const minx = Math.max(0, Math.floor(Math.min(p[0][0], p[1][0], p[2][0]))), maxx = Math.min(W - 1, Math.ceil(Math.max(p[0][0], p[1][0], p[2][0])));
      const miny = Math.max(0, Math.floor(Math.min(p[0][1], p[1][1], p[2][1]))), maxy = Math.min(H - 1, Math.ceil(Math.max(p[0][1], p[1][1], p[2][1])));
      const ar = (p[1][0] - p[0][0])*(p[2][1] - p[0][1]) - (p[2][0] - p[0][0])*(p[1][1] - p[0][1]); if (Math.abs(ar) < 1e-9) continue;
      for (let yy = miny; yy <= maxy; yy++) for (let xx = minx; xx <= maxx; xx++){
        const px = xx + 0.5, py = yy + 0.5;
        const w0 = ((p[1][0] - px)*(p[2][1] - py) - (p[2][0] - px)*(p[1][1] - py))/ar, w1 = ((p[2][0] - px)*(p[0][1] - py) - (p[0][0] - px)*(p[2][1] - py))/ar, w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue; const zz = w0*p[0][2] + w1*p[1][2] + w2*p[2][2]; const id = yy*W + xx;
        if (zz < zb[id]){ zb[id] = zz; cb[3*id] = col[0]; cb[3*id+1] = col[1]; cb[3*id+2] = col[2]; } } } }
  // sprites (night lights) and site lamps
  if (night){ const sp2 = []; g.traverse && g.traverse(o => { if (o.isPoints){ const a = o.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) sp2.push([a[i], a[i+1], a[i+2]]); } }); for (const l of lamps) sp2.push(l);
    for (const s of sp2){ const q = proj(...s); if (!q) continue; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++){ const xx = Math.round(q[0]) + dx, yy = Math.round(q[1]) + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const id = yy*W + xx; cb[3*id] = 1; cb[3*id+1] = Math.min(1, cb[3*id+1] + 0.5); cb[3*id+2] = Math.min(1, cb[3*id+2] + 0.3); } } }
  imgs.push(cb);
}
// stitch side by side, write PNG
const TW = W*imgs.length, buf = Buffer.alloc((TW*3 + 1)*H);
for (let y = 0; y < H; y++){ buf[y*(TW*3 + 1)] = 0; for (let k2 = 0; k2 < imgs.length; k2++) for (let x = 0; x < W; x++){ const s = (y*W + x)*3, d = y*(TW*3 + 1) + 1 + (k2*W + x)*3; for (let j = 0; j < 3; j++) buf[d + j] = Math.max(0, Math.min(255, Math.round(Math.pow(imgs[k2][s + j], 1/1.4)*255))); } }
const crc = (() => { const t = []; for (let n2 = 0; n2 < 256; n2++){ let c = n2; for (let k3 = 0; k3 < 8; k3++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n2] = c >>> 0; } return b => { let c = 0xffffffff; for (const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }; })();
const chunk = (ty, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(ty), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ih = Buffer.alloc(13); ih.writeUInt32BE(TW, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 2;
fs.writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(buf)), chunk('IEND', Buffer.alloc(0))]));
console.log('wrote', out);
