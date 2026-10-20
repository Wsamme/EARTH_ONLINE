// ===== nyc/nymidtown2: Midtown Manhattan landmarks on their real OSM footprints (City Brush v25, New York 1:1) =====
// Rockefeller Center (30 Rockefeller Plaza, the sunken plaza with the rink and flags, the Channel Gardens, the two Fifth Avenue
// buildings), St Patrick's Cathedral, 432 Park Avenue, Central Park Tower, Steinway Tower (111 West 57th Street with Steinway
// Hall), Times Square (One Times Square, the screens of the bow-tie on the real facades, the TKTS red steps) and the United
// Nations Headquarters (Secretariat, General Assembly, Conference Building, the flag row on First Avenue).
// Every model is built in the Midtown street-grid frame: local +x = along the streets to the east-south-east, local +z = along
// the avenues to the south-south-west (rot = -0.5096, measured on the footprints). Footprints come from nyc/ref_midtown2.json.
// Screens show abstract motion graphics only (no text, no brands). Flags are plain coloured fabric.
{
const PI = Math.PI, TAU = PI*2, ROT = -0.5096;
// ---------------- triangle batches: everything of one colour spec becomes one LTris call (one material, double-sided) ----------------
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quad = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const tri = (o, a, b, c) => o.push(...a, ...b, ...c);
// axis-aligned box
function abox(o, x0, x1, y0, y1, z0, z1, noBot){
  const P = [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
  const F = noBot ? [[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]] : [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]];
  for (const [a, b, c, d] of F) quad(o, P[a], P[b], P[c], P[d]);
}
// rotated box (w along local x before rotation ry, d along z), base at y
function rbox(o, w, h, d, x, y, z, ry){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), R = (u, v) => [x + u*c + v*s, z - u*s + v*c], hw = w/2, hd = d/2;
  const q = [R(-hw, -hd), R(hw, -hd), R(hw, hd), R(-hw, hd)];
  const P = [...q.map(p => [p[0], y, p[1]]), ...q.map(p => [p[0], y + h, p[1]])];
  for (const [a, b, cc, e] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) quad(o, P[a], P[b], P[cc], P[e]);
}
// extruded polygon [[x, z], ...] from y0 to y1 (walls + top cap, optional bottom)
function prism(o, P, y0, y1, top = true, bot = false){
  const n = P.length;
  for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n]; quad(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
  if (top || bot){ const T = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
    for (const t of T){ if (top) tri(o, [P[t[0]][0], y1, P[t[0]][1]], [P[t[1]][0], y1, P[t[1]][1]], [P[t[2]][0], y1, P[t[2]][1]]); if (bot) tri(o, [P[t[0]][0], y0, P[t[0]][1]], [P[t[1]][0], y0, P[t[1]][1]], [P[t[2]][0], y0, P[t[2]][1]]); } }
}
// flat polygon at height y
function flat(o, P, y){ const T = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []); for (const t of T) tri(o, [P[t[0]][0], y, P[t[0]][1]], [P[t[1]][0], y, P[t[1]][1]], [P[t[2]][0], y, P[t[2]][1]]); }
// cylinder / regular prism, radius r (or [rb, rt]), n sides
function cyl(o, x, z, r, y0, y1, n, top = true, a0 = 0){
  const rb = Array.isArray(r) ? r[0] : r, rt = Array.isArray(r) ? r[1] : r;
  for (let i = 0; i < n; i++){ const t0 = a0 + i/n*TAU, t1 = a0 + (i + 1)/n*TAU;
    quad(o, [x + Math.cos(t0)*rb, y0, z + Math.sin(t0)*rb], [x + Math.cos(t1)*rb, y0, z + Math.sin(t1)*rb], [x + Math.cos(t1)*rt, y1, z + Math.sin(t1)*rt], [x + Math.cos(t0)*rt, y1, z + Math.sin(t0)*rt]);
    if (top && rt > 0) tri(o, [x, y1, z], [x + Math.cos(t1)*rt, y1, z + Math.sin(t1)*rt], [x + Math.cos(t0)*rt, y1, z + Math.sin(t0)*rt]); }
}
// surface of revolution [[r, y], ...]
function lathe(o, pts, x, z, n, a0 = 0){
  for (let k = 0; k < pts.length - 1; k++){ const [r0, y0] = pts[k], [r1, y1] = pts[k + 1];
    for (let i = 0; i < n; i++){ const t0 = a0 + i/n*TAU, t1 = a0 + (i + 1)/n*TAU;
      quad(o, [x + Math.cos(t0)*r0, y0, z + Math.sin(t0)*r0], [x + Math.cos(t1)*r0, y0, z + Math.sin(t1)*r0], [x + Math.cos(t1)*r1, y1, z + Math.sin(t1)*r1], [x + Math.cos(t0)*r1, y1, z + Math.sin(t0)*r1]); } }
}
// beam between two points (n-sided)
function seg(o, a, b, r, n = 4){
  const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = p => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*r, s = Math.sin(t)*r; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a), Bq = ring(b); for (let i = 0; i < n; i++){ const j = (i + 1) % n; quad(o, A[i], A[j], Bq[j], Bq[i]); }
}
// a vertical quad on the segment a-b (plan points), y0..y1, pushed out along the outward normal by off
function wallQ(o, a, b, y0, y1, off){
  let nx = 0, nz = 0; if (off){ const dx = b[0]-a[0], dz = b[1]-a[1], L = Math.hypot(dx, dz) || 1; nx = dz/L*off; nz = -dx/L*off; }
  quad(o, [a[0]+nx, y0, a[1]+nz], [b[0]+nx, y0, b[1]+nz], [b[0]+nx, y1, b[1]+nz], [a[0]+nx, y1, a[1]+nz]);
}
// signed area (x, z plan; > 0 = counter-clockwise seen with +z down, i.e. clockwise seen from above)
const area = P => { let s = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; };
// vertical strips (window bands / fins) along each edge of a polygon: width w every step, from y0 to y1, offset out
function stripsP(o, P, y0, y1, step, w, off, minL = 3){
  const s = area(P) > 0 ? -1 : 1;           // outward normal side
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], dx = b[0]-a[0], dz = b[1]-a[1], L = Math.hypot(dx, dz); if (L < minL) continue;
    const ux = dx/L, uz = dz/L, nx = -uz*s*off, nz = ux*s*off, n = Math.max(1, Math.floor((L - 0.6)/step)), m = (L - n*step)/2;
    for (let k = 0; k < n; k++){ const t = m + (k + 0.5)*step;
      quad(o, [a[0] + ux*(t - w/2) + nx, y0, a[1] + uz*(t - w/2) + nz], [a[0] + ux*(t + w/2) + nx, y0, a[1] + uz*(t + w/2) + nz], [a[0] + ux*(t + w/2) + nx, y1, a[1] + uz*(t + w/2) + nz], [a[0] + ux*(t - w/2) + nx, y1, a[1] + uz*(t - w/2) + nz]); } }
}
// horizontal bands round a polygon at heights ys (height hb), offset out
function bandsP(o, P, ys, hb, off){
  const s = area(P) > 0 ? -1 : 1;
  for (const y of ys) for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], dx = b[0]-a[0], dz = b[1]-a[1], L = Math.hypot(dx, dz); if (L < 0.2) continue;
    const nx = -dz/L*s*off, nz = dx/L*s*off; quad(o, [a[0]+nx, y, a[1]+nz], [b[0]+nx, y, b[1]+nz], [b[0]+nx, y + hb, b[1]+nz], [a[0]+nx, y + hb, a[1]+nz]); }
}
const rect = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const shift = (P, dx, dz) => P.map(p => [p[0] - dx, p[1] - dz]);
// plan point -> lat/lon of the Midtown frame (origin = ref anchor of the target)
const LL = (lat0, lon0, fx, fz) => { const ex = fx*Math.cos(ROT) + fz*Math.sin(ROT), ez = -fx*Math.sin(ROT) + fz*Math.cos(ROT); return {lat:+(lat0 - ez/111048).toFixed(7), lon:+(lon0 + ex/84516).toFixed(7)}; };
const place = (type, lat0, lon0, fx, fz) => { const p = LL(lat0, lon0, fx, fz); SG_PLACES.push({type, lat:p.lat, lon:p.lon, rot:ROT}); };
// red aviation lights
const AVI = {c:'#b02018', glow:'#ff2a1a', gk:2.2};

// ===== 432 Park Avenue (Rafael Viñoly, 2015): 425.5 m, a 28.5 m square of white architectural concrete, six 3.05 m square windows
// per face and floor (4.72 m floor to floor), five open two-storey windbreaks every 12 floors (plus the open top), a limestone
// podium wrapping the tower on 57th Street and the west. Origin: tower centre. Ref anchor 40.7616, -73.9719.
LANDMARKS.nypark432 = {zh:'公园大道432号', en:'432 Park Avenue', cat:'new', r:42, h:426,
  lt:{m:1, c:'#fff0dc', k:0.5, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB();
  const conc = {c:'#ebe8e1', m:0, lk:0.22, lc:'#fff2dc'}, glass = {c:'#3a434c', m:1, fh:4.72, cw:4.75}, core = {c:'#8f8b84', m:0, lk:0.15};
  const mech = {c:'#d8d2c6', glow:'#ffdcae', gk:0.55}, lime = {c:'#d9d1c0', m:0, lk:0.6}, podG = {c:'#4b545c', m:1, fh:4.5, cw:3.2}, roof = '#8a8780';
  const H = 425.5, S = 14.25, FH = 4.72, WN = 3.05, CW = (2*S - 6*WN)/7, DEP = 0.42;
  const C = B.p(conc), Gl = B.p(glass), Co = B.p(core), Me = B.p(mech);
  // the sequence of 12-floor blocks and open windbreaks (top down: open crown, 12 floors, windbreak ...)
  const solid = [[0, 85.66], [95.1, 151.74], [161.18, 217.82], [227.26, 283.9], [293.34, 349.98], [359.42, 416.06]];
  const open = [[85.66, 95.1], [151.74, 161.18], [217.82, 227.26], [283.9, 293.34], [349.98, 359.42], [416.06, H]];
  const colX = []; for (let i = 0; i <= 6; i++) colX.push(-S + i*(CW + WN) + CW/2);          // column centres along a face
  // glass skin of the solid blocks (inset), slabs and columns in front of it
  for (const [y0, y1] of solid){
    const gy0 = y0 < 1 ? 0 : y0;
    abox(Gl, -S + DEP, S - DEP, gy0, y1, -S + DEP, S - DEP, true);
  }
  // perimeter columns (full height, every face) and floor slabs
  for (let f = 0; f < 4; f++){
    const R = f === 0 ? (u, v) => [u, v] : f === 1 ? (u, v) => [-v, u] : f === 2 ? (u, v) => [-u, -v] : (u, v) => [v, -u];
    for (const cx of colX){ const a = R(cx - CW/2, S), b = R(cx + CW/2, S - DEP);
      abox(C, Math.min(a[0], b[0]), Math.max(a[0], b[0]), 0, H, Math.min(a[1], b[1]), Math.max(a[1], b[1]), true); }
  }
  // floor slabs: one per floor (solid and open parts alike); the lobby is taller
  const slabs = []; for (let y = 10.2; y < H - 1; y += FH) slabs.push(y);
  for (const y of slabs){
    const t = FH - WN;    // spandrel height
    abox(C, -S, S, y - t/2, y + t/2, S - DEP, S); abox(C, -S, S, y - t/2, y + t/2, -S, -S + DEP);
    abox(C, S - DEP, S, y - t/2, y + t/2, -S + DEP, S - DEP); abox(C, -S, -S + DEP, y - t/2, y + t/2, -S + DEP, S - DEP);
  }
  // open windbreaks: the 9 m concrete core with the illuminated mechanical cylinders, slabs inside
  for (const [y0, y1] of open){
    abox(Co, -S + DEP, S - DEP, y0 - 0.5, y0 + 0.4, -S + DEP, S - DEP);
    abox(Co, -4.6, 4.6, y0, y1, -4.6, 4.6, true);
    for (const [cx, cz] of [[-8.5, -8.5], [8.5, -8.5], [-8.5, 8.5], [8.5, 8.5], [0, -9.2], [0, 9.2], [-9.2, 0], [9.2, 0]]) cyl(Me, cx, cz, 1.55, y0 + 0.4, y1 - 0.9, 10);
  }
  abox(Co, -S, S, H - 0.6, H, -S, S);                                              // roof slab
  B.p(roof).push(...[]); abox(B.p(roof), -S + DEP, S - DEP, H - 0.65, H - 0.6, -S + DEP, S - DEP);
  // lobby: tall glass ground floor
  // podium on 57th Street and the west side: limestone, 30 m (OSM)
  const pod = shift([[-20.2, 10.7], [-20.8, -32.8], [17.4, -33.2], [17.5, -18.1], [-11.2, -17.7], [-11.0, 10.5]], 3.25, -3.8);
  prism(B.p(lime), pod, -5, 30, true);
  bandsP(B.p(podG), pod, [5.2, 10.4, 15.6, 20.8], 3.1, 0.06);
  stripsP(B.p(lime), pod, 0, 30, 4.2, 0.9, 0.12);
  abox(B.p(lime), -S - 0.4, S + 0.4, -5, 0.4, -S - 0.4, S + 0.4);
  B.flush(g);
  // aviation lights on the roof corners
  const A = B.p(AVI); for (const [x, z] of [[-S + 0.6, -S + 0.6], [S - 0.6, -S + 0.6], [-S + 0.6, S - 0.6], [S - 0.6, S - 0.6]]) abox(A, x - 0.3, x + 0.3, H, H + 0.7, z - 0.3, z + 0.3);
  B.flush(g);
  return g; }};
place('nypark432', 40.7616, -73.9719, 3.25, -3.8);

// ===== Steinway Tower, 111 West 57th Street (SHoP, 2021): 435 m on an 18 m wide slab through the middle of the lot. The east and
// west faces are bands of glazed terracotta piers (six tones of white-beige) with bronze between, each pier rising to one step of
// the "feathered" setbacks; the south face steps back as it rises (OSM: thirteen 1.7 m steps from 200 to 435 m), the north face
// (glass with bronze mullions, reflective panels in the crown) rises sheer to the pinnacle. Steinway Hall (1925, Warren & Wetmore,
// 16 storeys, L-shaped) forms the base: limestone 57th Street front with the arched Ionic display window, setbacks above the 12th
// floor, a chamfered colonnaded 13th-15th, and the campanile with its pyramidal copper roof and lantern.
// Origin: the tower slab centre. Ref anchor 40.7647, -73.9776.
LANDMARKS.nysteinway = {zh:'斯坦威大厦', en:'Steinway Tower (111 West 57th Street)', cat:'new', r:46, h:435,
  lt:{m:1, c:'#ffe6c4', k:0.55, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB();
  const terra = {c:'#e3d9c6', m:0, lk:0.55, lc:'#ffe2bc'}, terraTop = {c:'#e8dfcc', m:0, lk:0.4, glow:'#ffdcae', gk:0.28}, bronze = {c:'#6d5640', m:0, lk:0.2};
  const glass = {c:'#4a5258', m:1, fh:4.3, cw:2.2}, refl = {c:'#9aa6ad', m:0, lk:0.35}, parap = {c:'#a8bcc4', op:0.45};
  const lime = {c:'#d8cdb4', m:0, lk:0.85}, brick = {c:'#c7b293', m:0, lk:0.7}, copper = {c:'#6f9b88', m:0, lk:0.5}, win = {c:'#3e4246', m:1, fh:4.0, cw:2.4}, gran = '#9a8a85';
  const T = B.p(terra), Tt = B.p(terraTop), Br = B.p(bronze), Gl = B.p(glass), Rf = B.p(refl), Pa = B.p(parap);
  const XW = 9.1, Z0 = 12.45, Z1 = -12.45;               // slab: x +-9.1, south face z 12.45, north face z -12.45
  const tops = [200, 248, 283, 308, 328, 343, 358, 373, 383, 393, 405, 417];
  // steps (strips) from the south face northwards: [zSouth, zNorth, top]
  const steps = tops.map((t, i) => [Z0 - i*1.7, Z0 - (i + 1)*1.7, t]); steps.push([Z0 - 12*1.7, Z1, 435]);
  // body of each step: glass/bronze core slightly inside the pier line, glass face to the south
  for (const [zs, zn, top] of steps){
    abox(Gl, -XW + 0.5, XW - 0.5, 30, top - (top > 383 ? 0 : 1.2), zn, zs, true);
    if (top <= 383) abox(B.p('#5c5a56'), -XW + 0.5, XW - 0.5, top - 1.2, top - 1.0, zn, zs);   // terrace floor
  }
  // glass parapets on each terrace (south edge), bronze mullions on the south faces of the steps
  for (let i = 0; i < steps.length - 1; i++){ const [zs, , top] = steps[i], nxt = steps[i + 1][2];
    if (top <= 383) wallQ(Pa, [XW - 0.5, zs], [-XW + 0.5, zs], top - 1.0, top + 0.3, 0);
    for (let x = -XW + 1.2; x < XW - 0.6; x += 1.52) abox(Br, x - 0.07, x + 0.07, Math.max(30, top - 60), top - 1.0, zs - 0.05, zs + 0.12);
    void nxt;
  }
  // the south face below the first step (z = Z0) from 30 m to 200 m: glass with bronze mullions
  for (let x = -XW + 1.2; x < XW - 0.6; x += 1.52) abox(Br, x - 0.08, x + 0.08, 30, 199, Z0 - 0.02, Z0 + 0.16);
  // the north face: sheer glass with bronze mullions to 383 m, then reflective panels over the concrete pinnacle walls
  for (let x = -XW + 1.2; x < XW - 0.6; x += 1.52) abox(Br, x - 0.08, x + 0.08, 30, 382, Z1 - 0.16, Z1 + 0.02);
  abox(Rf, -XW + 0.5, XW - 0.5, 383, 434, Z1 - 0.05, Z1 + 0.6);
  for (let y = 386; y < 434; y += 4.3) abox(Br, -XW + 0.5, XW - 0.5, y, y + 0.25, Z1 - 0.12, Z1);
  // floor lines (bronze spandrels) on north and south glass
  for (let y = 34.3; y < 382; y += 4.3){ abox(Br, -XW + 0.5, XW - 0.5, y, y + 0.35, Z1 - 0.1, Z1 + 0.02); if (y < 199) abox(Br, -XW + 0.5, XW - 0.5, y, y + 0.35, Z0 - 0.02, Z0 + 0.1); }
  // east and west faces: terracotta piers, one per step, each to its step's top; bronze between
  for (const sx of [-1, 1]){
    for (const [zs, zn, top] of steps){
      const npi = zs - zn > 3 ? 3 : 1;
      for (let k = 0; k < npi; k++){ const za = zn + (zs - zn)*(k + 0.5)/npi, w = npi > 1 ? 0.8 : 0.85;
        const P = top > 380 ? Tt : T;
        abox(T, sx > 0 ? XW - 0.5 : -XW - 0.15, sx > 0 ? XW + 0.15 : -XW + 0.5, 30, Math.min(top, 380), za - w/2, za + w/2);
        if (top > 380) abox(P, sx > 0 ? XW - 0.5 : -XW - 0.15, sx > 0 ? XW + 0.15 : -XW + 0.5, 380, top, za - w/2, za + w/2);
        // the wave of the glazed blocks: a slight swell every few floors
        for (let y = 36; y < top - 4; y += 8.6) abox(T, sx > 0 ? XW + 0.15 : -XW - 0.3, sx > 0 ? XW + 0.3 : -XW - 0.15, y, y + 2.2, za - w/2 + 0.12, za + w/2 - 0.12);
      }
      // bronze between the piers
      abox(Br, sx > 0 ? XW - 0.52 : -XW + 0.47, sx > 0 ? XW - 0.47 : -XW + 0.52, 30, top - 0.5, zn, zs);
    }
  }
  // tower base on 57th Street (OSM 0-30 m part) and the slab's lower floors behind Steinway Hall
  abox(Gl, -XW + 0.5, XW - 0.5, 0, 30, Z1, Z0, true);
  const pod = rect(-4.9, 9.1, 12.45, 30.1);
  prism(B.p(lime), pod, -5, 30, true); bandsP(B.p(win), pod, [3, 8.5, 13, 17.5, 22, 26.5], 2.6, 0.05);
  // ---- Steinway Hall (relative to the tower origin): west wing from 57th to 58th Street, north wing along 58th Street
  const L = B.p(lime), Bk = B.p(brick), W = B.p(win), Cu = B.p(copper);
  const front = rect(-21.6, -4.95, 8.5, 30.3);                 // the 57th Street building (depth ~22 m)
  const west = rect(-21.8, -9.2, -31.2, 8.5), north = rect(-9.2, 9.0, -31.3, -12.5);
  prism(L, front, -5, 15, false); prism(Bk, front, 15, 48, true);
  prism(Bk, west, -5, 40, true); prism(Bk, north, -5, 36, true); prism(L, rect(-21.8, 9.0, -31.3, -26), -5, 9, false);
  abox(Bk, -21.8, -9.2, 40, 47, -10, 8.5);                     // 58th Street setbacks
  // 57th Street front: granite water table, the Ionic display window with lunette, frieze, windows
  abox(B.p(gran), -21.7, -4.85, -5, 1.4, 29.9, 30.5);
  abox(W, -17.5, -9.1, 1.5, 11.5, 30.25, 30.45);
  for (const x of [-17.5, -14.7, -11.9, -9.1]) cyl(L, x, 30.55, 0.45, 1.4, 11.6, 8);
  abox(L, -21.7, -4.85, 12.0, 14.5, 30.3, 30.75);
  { const Wn = B.p(win); for (let i = 0; i < 8; i++){ const t0 = i/8*PI, t1 = (i + 1)/8*PI; tri(Wn, [-13.3, 11.6, 30.47], [-13.3 + Math.cos(t0)*3.9, 11.6 + Math.sin(t0)*2.2, 30.47], [-13.3 + Math.cos(t1)*3.9, 11.6 + Math.sin(t1)*2.2, 30.47]); } }
  for (let y = 16; y < 46; y += 3.9) for (const x of [-19.6, -16.9, -14.2, -11.5, -8.8, -6.6]) abox(W, x - 0.7, x + 0.7, y, y + 2.3, 30.28, 30.4);
  abox(L, -21.9, -4.7, 46.6, 48.2, 8.3, 30.5);                 // cornice of the 12th floor
  // 13th-15th floors: chamfered, colonnaded; 16th set back; the pyramidal copper roof with lantern
  const ch = [[-19.6, 12.2], [-17.6, 10.2], [-9.0, 10.2], [-7.0, 12.2], [-7.0, 24.6], [-9.0, 26.6], [-17.6, 26.6], [-19.6, 24.6]];
  prism(L, ch, 48, 59.5, true); stripsP(W, ch, 49, 58, 1.7, 0.75, 0.05, 1.5);
  abox(L, -19.9, -6.7, 59.5, 60.6, 10.0, 26.8);
  prism(Bk, rect(-17.0, -9.6, 14.6, 22.2), 60.6, 64.5, true); abox(L, -17.3, -9.3, 64.5, 65.3, 14.3, 22.5);
  const pyr = [[-17.3, 14.3], [-9.3, 14.3], [-9.3, 22.5], [-17.3, 22.5]], apex = [-13.3, 70.5, 18.4];
  for (let i = 0; i < 4; i++){ const a = pyr[i], b = pyr[(i + 1) % 4]; tri(Cu, [a[0], 65.3, a[1]], [b[0], 65.3, b[1]], apex); }
  cyl(Cu, -13.3, 18.4, 0.9, 69.2, 72.4, 8); cyl(Cu, -13.3, 18.4, [0.9, 0.05], 72.4, 74.0, 8);
  // windows of the brick walls
  stripsP(W, west, 10, 39, 2.9, 1.2, 0.05); stripsP(W, north, 10, 35, 2.9, 1.2, 0.05);
  stripsP(W, rect(-21.6, -4.95, 8.5, 30.3).slice(0, 2).concat([[-4.95, 8.5]]), 16, 46, 2.9, 1.2, 0.05);
  B.flush(g);
  const A = B.p(AVI); abox(A, -0.4, 0.4, 435, 436, Z1 + 1.5, Z1 + 2.3); B.flush(g);
  return g; }};
place('nysteinway', 40.7647, -73.9776, -4.1, -25.35);

// ===== Central Park Tower, 217 West 57th Street (Adrian Smith + Gordon Gill, 2020): 472 m, 98 storeys. A glass and satin
// stainless-steel tower of interlocking volumes on the OSM parts: the main shaft (22 x 30 m) to the 466 m roof with the crown of
// narrow slats and vertical light strips to 472 m, notched corners above 237 / 332 m, a west wing to 163 m, a south wing to 127 m,
// and the 8.5 m cantilever over the Art Students League on the east from 89 m to 433 m (zinc-clad east face). Pinstripe stainless
// fins flush with the glass, tall narrow horizontal bands at the setbacks. Base: the Nordstrom store, fluted "wave" glass, 44 m.
// Origin: main shaft centre. Ref anchor 40.7663, -73.981.
LANDMARKS.nycpt = {zh:'中央公园大厦', en:'Central Park Tower', cat:'new', r:58, h:472,
  lt:{m:1, c:'#eaf2ff', k:0.6, anim:'cycle', c2:'#d8e6ff'}, build(){
  const g = new THREE.Group(), B = mkB();
  const glass = {c:'#7f93a3', m:1, fh:4.4, cw:2.6}, fin = {c:'#d6dadd', m:0, lk:0.3}, band = {c:'#e3e6e8', m:0, lk:0.45}, zinc = {c:'#7c8086', m:1, fh:4.4, cw:2.6};
  const crown = {c:'#cfd5da', m:0, lk:0.3, glow:'#eef4ff', gk:0.75}, base = {c:'#c4d0d6', m:1, fh:5.8, cw:2.0, lk:0.9}, flute = {c:'#e4ecef', m:0, lk:0.5}, roof = '#77797c';
  const Gl = B.p(glass), F = B.p(fin), Bd = B.p(band), Zn = B.p(zinc), Cr = B.p(crown);
  const o = [10.5, -18.3], R = P => shift(P, o[0], o[1]);
  // volumes [plan, y0, y1, faceMaterial]
  const shaftLo = R(rect(-0.7, 21.7, -33.0, -3.5));
  const shaftHi = R([[-0.7, -28.0], [-0.7, -7.9], [2.5, -7.9], [2.5, -3.5], [21.7, -3.5], [21.7, -33.0], [3.95, -33.0], [3.95, -28.0]]);   // NW and SW notches
  const vols = [
    [R(rect(-19.8, -0.8, -32.6, -20.7)), 44, 163, Gl],          // west wing
    [R(rect(-0.6, 21.8, -3.4, 5.0)), 44, 127, Gl],              // south wing
    [shaftLo, 44, 237, Gl],
    [R([[-0.7, -28.0], [-0.7, -3.5], [21.7, -3.5], [21.7, -33.0], [3.95, -33.0], [3.95, -28.0]]), 237, 332, Gl],
    [shaftHi, 332, 466, Gl],
    [R(rect(21.7, 30.2, -27.9, -4.0)), 89, 433, Zn],            // cantilever over the Art Students League
    [R(rect(21.7, 30.1, -30.1, -27.9)), 89, 332, Zn],
    [R(rect(21.7, 30.1, -32.7, -30.1)), 89, 237, Zn],
  ];
  for (const [P, y0, y1, M] of vols){
    prism(M, P, y0, y1, true, y0 > 50);
    if (M !== Zn || true) stripsP(F, P, y0 + 0.5, y1 - 0.3, 1.52, 0.16, 0.06, 2);
    bandsP(Bd, P, [y1 - 3.2], 3.2, 0.1);                         // a tall narrow band at every setback
  }
  // horizontal bands on the shaft (more and larger towards the top)
  bandsP(Bd, shaftLo, [88, 163.5, 200], 2.4, 0.1); bandsP(Bd, shaftHi, [372, 404, 430, 452], 3.0, 0.1);
  // the crown: an open screen of narrow slats with vertical light strips round the roof, 466 -> 472 m
  const cP = shaftHi, s = area(cP) > 0 ? -1 : 1;
  for (let i = 0; i < cP.length; i++){ const a = cP[i], b = cP[(i + 1) % cP.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]); if (L < 1) continue;
    const ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L, n = Math.max(1, Math.round(L/1.25));
    for (let k = 0; k < n; k++){ const t = (k + 0.5)*L/n, x = a[0] + ux*t, z = a[1] + uz*t;
      rbox(Cr, 0.32, 6.4 + (k % 3 === 1 ? 0.0 : 0.0), 0.7, x - uz*s*0.2, 465.6, z + ux*s*0.2, Math.atan2(-uz, ux)); } }
  abox(B.p(roof), -11.0, 11.0, 465.5, 466.0, -14.5, 14.5);
  prism(B.p('#9aa0a5'), R([[9.2, -10.5], [9.0, -21.8], [15.4, -21.9], [15.3, -12.9], [15.6, -10.7]]), 466, 471, true);
  // the base: Nordstrom (fluted wave glass, 0-44 m) on the whole lot, the 23 m strip on 58th Street
  const lot = R([[-37.8, 5.9], [-38.0, -35.4], [21.7, -35.6], [21.8, 20.4], [-23.8, 20.6], [-23.8, 5.8]]);
  prism(B.p(base), lot, -5, 44, true);
  prism(B.p(base), R(rect(-38.0, 21.7, -40.2, -35.4)), -5, 23, true);
  // flutes: serpentine vertical ribs on the base glass
  const Fl = B.p(flute), sl = area(lot) > 0 ? -1 : 1;
  for (let i = 0; i < lot.length; i++){ const a = lot[i], b = lot[(i + 1) % lot.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]); if (L < 4) continue;
    const ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L, nx = -uz*sl, nz = ux*sl;
    for (let t = 0.8; t < L - 0.5; t += 1.6){ const w = 0.25 + 0.2*Math.sin(t*0.9); const x = a[0] + ux*t + nx*w, z = a[1] + uz*t + nz*w; rbox(Fl, 0.3, 39, 0.3, x, 4.5, z, Math.atan2(-uz, ux)); } }
  bandsP(Bd, lot, [0, 4.0, 43.2], 0.8, 0.12);
  // the landmark 1780 Broadway front kept at the west end of the lot (brick and limestone, 8 storeys)
  const bw = R(rect(-38.0, -33.0, -35.4, 5.9));
  prism(B.p({c:'#b3876a', m:0, lk:0.6}), bw, -5, 36, true); stripsP(B.p({c:'#3c4043', m:1, fh:4.2, cw:2.4}), bw, 5, 34, 2.6, 1.3, 0.06);
  // a low kerb stone inside the Art Students League's footprint under the cantilever: brings the OSM cantilever parts (89-433 m)
  // into the model's ground plan so that the app hides them (the League building itself stays: its centroid is further east)
  abox(B.p(roof), ...[25.2, 25.8].map(x => x - o[0]), 0, 0.3, ...[-19.0, -18.4].map(z => z - o[1]));
  abox(B.p(roof), ...[25.6, 26.2].map(x => x - o[0]), 0, 0.3, ...[-7.6, -7.0].map(z => z - o[1]));
  B.flush(g);
  const A = B.p(AVI); for (const [x, z] of [[-10.5, -14], [10.5, -14], [-10.5, 14], [10.5, 14]]) abox(A, x - 0.3, x + 0.3, 472, 472.8, z - 0.3, z + 0.3); B.flush(g);
  return g; }};
place('nycpt', 40.7663, -73.981, 10.5, -18.3);

// vertex-coloured triangles (many plain colours in one material): pos [x,y,z ...], cols [r,g,b per vertex]
function vcTris(g, pos, cols, spec){
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
  return lmAdd(g, geo, Object.assign({ds:true, vc:true}, spec), 0, 0, 0, 0);
}
const hex3 = h => { const v = parseInt(h.slice(1), 16); return [(v >> 16 & 255)/255, (v >> 8 & 255)/255, (v & 255)/255]; };
// plain flag colours (no national designs: single-colour fabric)
const FLAGC = ['#c8102e', '#003da5', '#ffffff', '#009a44', '#ffcd00', '#ef7d00', '#5b2c83', '#00a3e0', '#7a1f2b', '#1d5f3a', '#e8e1cf', '#d6336c', '#2a2f8f', '#8cc63f'].map(hex3);
// a flagpole with a flag hanging from it (flag in the plane through the pole along direction (ux, uz))
function flagpole(PB, FP, FC, x, z, y0, h, ux, uz, fw, fh, ci, rng){
  seg(PB, [x, y0, z], [x, y0 + h, z], 0.06, 4);
  const sway = 0.25 + rng()*0.35, c = FLAGC[ci % FLAGC.length], y1 = y0 + h - 0.25, yb = y1 - fh;
  const A = [x, y1, z], Bp = [x + ux*fw, y1 - 0.05, z + uz*fw + sway*0.4], C = [x + ux*fw, yb - 0.05, z + uz*fw + sway], D = [x, yb, z];
  const M = [x + ux*fw*0.5, (y1 + yb)/2, z + uz*fw*0.5 + sway*0.6];
  for (const [p, q, r] of [[A, Bp, M], [Bp, C, M], [C, D, M], [D, A, M]]){ FP.push(...p, ...q, ...r); for (let k = 0; k < 3; k++) FC.push(...c); }
}

// ===== Rockefeller Center (1933-40): 30 Rockefeller Plaza (Raymond Hood, 259 m, 66 floors) — an Indiana-limestone slab of
// stepped setbacks with continuous vertical window strips, the Top of the Rock decks (67th-70th floors) with their glass screens —
// its low wings and the 1250 Sixth Avenue block, the private street Rockefeller Plaza, the sunken Lower Plaza with the skating rink,
// the gilded Prometheus over the fountain and the ring of flagpoles (plain coloured flags), the Channel Gardens with their six
// planters, and the two Fifth Avenue buildings (La Maison Francaise, British Empire Building) with their roof gardens. All massing
// on the OSM parts. Origin: middle of the 49th-50th Street block between 30 Rock and Fifth Avenue (frame -35, -5.5).
LANDMARKS.nyrockefeller = {zh:'洛克菲勒中心', en:'Rockefeller Center', cat:'old', r:150, h:260,
  lt:{m:0, c:'#ffe2b8', k:0.85, e:0.55, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const lime = {c:'#d6cdb9', m:0, lk:0.9}, strip = {c:'#6c6b68', m:1, fh:3.9, cw:2.0}, shop = {c:'#3e454c', m:1, fh:4.5, cw:3.0, lk:1.1};
  const pave = {c:'#c9c3b7', m:0, lk:0.35}, road = '#606366', ice = {c:'#e9f2f6', m:0, lk:0.9}, green = '#55803f', water = {c:'#8db6c9', m:0, lk:0.6};
  const glassP = {c:'#b9d1db', op:0.4}, pole = {c:'#d0d3d5', m:0, lk:0.4}, gold = {c:'#d6a43c', m:0, lk:1.2, glow:'#ffcc66', gk:0.35}, roofc = '#8a877f', gard = '#6f9a4e';
  const O = [-35, -5.5], R = P => shift(P, O[0], O[1]), X = x => x - O[0], Z = z => z - O[1];
  const L = B.p(lime), S = B.p(strip);
  // ---- 30 Rock: plan tiled into non-overlapping columns, each to its own top (OSM parts)
  const cols = [
    [-114.1, -93.5, -14.5, 4.6, 245], [-93.5, -23.0, -14.5, 4.6, 260], [-23.0, -18.4, -14.5, 4.6, 235], [-18.4, -16.1, -14.5, 4.6, 190], [-16.1, -13.6, -14.5, 4.6, 133],
  ];
  for (const [zA, zB] of [[-20.5, -14.5], [4.6, 10.7]]) for (const [x0, x1, t] of [[-96.6, -43.9, 245], [-43.9, -35.9, 220], [-35.9, -28.8, 175], [-28.8, -23.0, 125]]) cols.push([x0, x1, zA, zB, t]);
  // low wings along 49th / 50th Street and the west block
  for (const [zA, zB] of [[-29.9, -20.5], [10.7, 18.7]]) for (const [x0, x1, t] of [[-150.9, -78.5, 43], [-78.5, -53.1, 40], [-53.1, -28.7, 20]]) cols.push([x0, x1, zA, zB, t]);
  cols.push([-150.9, -114.1, -20.5, 10.7, 43], [-114.1, -96.6, -20.5, -14.5, 43], [-114.1, -96.6, 4.6, 10.7, 43]);
  for (const [x0, x1, z0, z1, t] of cols){
    const P = R(rect(x0, x1, z0, z1));
    prism(L, P, 9.5, t, true);
    stripsP(S, P, 11, t - (t > 100 ? 2.2 : 1.4), 1.92, 0.78, 0.07, 1.8);
    abox(L, X(x0) - 0.15, X(x1) + 0.15, t - 0.9, t, Z(z0) - 0.15, Z(z1) + 0.15);       // parapet coping
  }
  // the base (0-10 m) on the whole lot, shop fronts; the 1250 Sixth Avenue block (10-70 m)
  const lot = R([[-176.7, 18.4], [-176.6, -27.8], [-155.8, -27.8], [-155.6, -34.5], [-15.5, -34.3], [-15.5, -21.6], [-13.7, -21.6], [-13.6, -15.0], [-13.7, 10.7], [-15.5, 10.7], [-15.4, 23.1], [-156.7, 22.8], [-156.7, 18.4]]);
  prism(L, lot, -5, 10, true); bandsP(B.p(shop), lot, [0.6], 6.6, 0.06); bandsP(L, lot, [9.2], 0.9, 0.12);
  const six = R(rect(-176.7, -150.9, -29.5, 18.4));
  prism(L, six, 10, 70, true); stripsP(S, six, 11, 68.5, 1.92, 1.0, 0.07);
  // the entrance on Rockefeller Plaza: a recessed three-bay portal with the gilded relief panel above
  abox(B.p(shop), X(-13.75), X(-13.55), 0.5, 8.5, Z(-10), Z(0.5)); abox(B.p(gold), X(-13.7), X(-13.45), 10.5, 15.5, Z(-9.5), Z(0));
  // Top of the Rock: glass screens on the 67th-floor terraces (245 m) and the 70th-floor roof deck (260 m)
  const Gp = B.p(glassP);
  for (const P of [R(rect(-114.1, -93.5, -14.5, 4.6)), R(rect(-96.6, -43.9, -20.5, -14.5)), R(rect(-96.6, -43.9, 4.6, 10.7))]) bandsP(Gp, P, [245], 2.6, 0.05);
  bandsP(Gp, R(rect(-93.5, -23.0, -14.5, 4.6)), [260], 1.4, 0.05);
  for (let x = -92; x < -24; x += 6) abox(B.p(road), X(x), X(x + 2.5), 260, 261.2, Z(-12), Z(2));
  // ---- the two Fifth Avenue buildings (La Maison Francaise south, British Empire Building north): limestone, parts from OSM
  const fifth = [
    [rect(43.2, 102.6, -36.6, -14.2), [[rect(43.2, 71.6, -29.9, -20.6), 35], [rect(43.2, 71.6, -33.0, -29.9), 30], [rect(43.2, 71.6, -20.6, -17.8), 30], [rect(71.6, 102.6, -33.4, -18.2), 25]]],
    [rect(43.4, 103.0, 2.6, 25.0), [[rect(43.5, 71.9, 9.3, 18.6), 35], [rect(43.5, 71.9, 6.4, 9.3), 30], [rect(43.5, 71.9, 18.6, 21.5), 30], [rect(71.9, 102.9, 6.0, 21.0), 25]]],
  ];
  for (const [ring, parts] of fifth){
    const P = R(ring); prism(L, P, -5, 20, true); stripsP(S, P, 4.5, 19, 2.6, 1.15, 0.07); bandsP(B.p(shop), P, [0.4], 3.8, 0.07); bandsP(L, P, [19.0], 1.0, 0.12);
    for (const [pr, t] of parts){ const Q = R(pr); prism(L, Q, 20, t, true); stripsP(S, Q, 21, t - 1, 2.6, 1.15, 0.07); }
    // roof gardens on the 20 m roofs: hedges and lawn
    const gr = B.p(green); for (const [pr] of parts.slice(1, 3)) flat(gr, R(pr), 20.15);
  }
  // ---- ground: paving of the plaza and Rockefeller Plaza (the private street), the Channel Gardens
  const Pv = B.p(pave);
  flat(B.p(road), R(rect(-4.0, 4.0, -36.0, 25.6)), 0.08);
  flat(Pv, R(rect(43.3, 103.0, -14.2, 2.6)), 0.04); abox(Pv, X(43.3), X(103.0), -2.0, 0.0, Z(-14.2), Z(2.6), true);
  const Gn = B.p(green), Fw = B.p({c:'#d39a3a', m:0, lk:0.5});
  for (let k = 0; k < 6; k++){ const x0 = 47.5 + k*9.4; abox(Pv, X(x0), X(x0 + 7.2), 0, 0.75, Z(-9.4), Z(-3.4)); flat(Gn, R(rect(x0 + 0.3, x0 + 6.9, -9.1, -3.7)), 0.8);
    for (let j = 0; j < 5; j++) abox(Fw, X(x0 + 0.8 + j*1.3), X(x0 + 1.5 + j*1.3), 0.8, 1.15, Z(-8.6), Z(-4.2)); }
  // ---- the sunken Lower Plaza (4.5 m deep) with the rink, Prometheus over the fountain, the flag ring at street level
  const sx0 = 5.5, sx1 = 41.0, sz0 = -23.5, sz1 = 10.5, dep = -4.6;
  // plaza paving round the pit (and over Rockefeller Plaza's sidewalks)
  for (const [a0, a1, b0, b1] of [[-13.6, 43.3, -36.0, sz0], [-13.6, 43.3, sz1, 25.6], [-13.6, sx0, sz0, sz1], [sx1, 43.3, sz0, sz1]]){ flat(Pv, R(rect(a0, a1, b0, b1)), 0.04); abox(Pv, X(a0), X(a1), -2.0, 0.0, Z(b0), Z(b1), true); }
  // pit walls and floor
  const pit = R(rect(sx0, sx1, sz0, sz1));
  for (let i = 0; i < 4; i++){ const a = pit[i], b = pit[(i + 1) % 4]; quad(B.p(pave), [a[0], dep, a[1]], [b[0], dep, b[1]], [b[0], 0.05, b[1]], [a[0], 0.05, a[1]]); }
  flat(Pv, pit, dep); flat(B.p(ice), R(rect(9.5, 40.0, -16.0, 3.0)), dep + 0.08);
  abox(B.p(ice), X(9.3), X(40.2), dep, dep + 1.1, Z(-16.2), Z(-15.9)); abox(B.p(ice), X(9.3), X(40.2), dep, dep + 1.1, Z(2.9), Z(3.2));
  abox(B.p(ice), X(39.9), X(40.2), dep, dep + 1.1, Z(-16.2), Z(3.2));
  // the restaurant terraces under the north and south walkways (glass fronts)
  abox(B.p(shop), X(sx0), X(sx1), dep, -0.6, Z(sz0 + 0.1), Z(sz0 + 0.4)); abox(B.p(shop), X(sx0), X(sx1), dep, -0.6, Z(sz1 - 0.4), Z(sz1 - 0.1));
  // the fountain wall and pool on the west side with Prometheus (gilded, on his ring)
  abox(B.p(pave), X(sx0), X(sx0 + 1.2), dep, 0.0, Z(-12.5), Z(-0.5)); flat(B.p(water), R(rect(sx0 + 1.2, 8.8, -13.5, 0.5)), dep + 0.6);
  abox(B.p(pave), X(sx0 + 1.2), X(9.0), dep, dep + 0.6, Z(-13.5), Z(-13.2)); abox(B.p(pave), X(8.7), X(9.0), dep, dep + 0.6, Z(-13.5), Z(0.5));
  const Au = B.p(gold), px = X(7.3), pz = Z(-6.5);
  for (let i = 0; i < 18; i++){ const t0 = i/18*TAU, t1 = (i + 1)/18*TAU, rr = 2.3; seg(Au, [px, dep + 3.0 + Math.sin(t0)*rr, pz + Math.cos(t0)*rr], [px, dep + 3.0 + Math.sin(t1)*rr, pz + Math.cos(t1)*rr], 0.16, 4); }
  seg(Au, [px, dep + 2.6, pz - 1.3], [px + 0.3, dep + 3.4, pz + 0.3], 0.55, 6); seg(Au, [px + 0.3, dep + 3.4, pz + 0.3], [px, dep + 3.0, pz + 1.6], 0.42, 6);
  seg(Au, [px, dep + 3.0, pz + 1.6], [px + 0.2, dep + 4.4, pz + 1.0], 0.2, 4); cyl(Au, px + 0.2, pz + 1.0, 0.35, dep + 4.3, dep + 4.9, 6);
  seg(Au, [px, dep + 2.6, pz - 1.3], [px - 0.1, dep + 1.6, pz - 2.4], 0.22, 4);
  // walkway railings at street level round the pit
  const Rl = B.p(pole);
  for (const [a, b] of [[[sx0, sz0], [sx1, sz0]], [[sx0, sz1], [sx1, sz1]], [[sx0, sz0], [sx0, sz1]], [[sx1, sz0], [sx1, -13.0]], [[sx1, 1.5], [sx1, sz1]]]) {
    const A = R([a])[0], Bq = R([b])[0]; seg(Rl, [A[0], 1.05, A[1]], [Bq[0], 1.05, Bq[1]], 0.05, 4); }
  // steps from the Channel Gardens down into the plaza
  for (let k = 0; k < 8; k++) abox(Pv, X(sx1 - 3.6 + k*0.45), X(sx1 + 0.4), dep + (k + 1)*0.57 - 0.57, dep + (k + 1)*0.57, Z(-12.8), Z(1.3));
  // ---- the flag ring: plain coloured flags on ~100 poles round the rim of the Lower Plaza
  const FPos = [], FCol = [], PB = B.p(pole); let ci = Math.floor(rng()*14);
  const ring = [];
  for (let x = sx0 + 0.8; x <= sx1 - 0.5; x += 1.55){ ring.push([x, sz0 - 1.0, 1, 0]); ring.push([x, sz1 + 1.0, 1, 0]); }
  for (let z = sz0 + 1.0; z <= sz1 - 1.0; z += 1.55){ ring.push([sx0 - 1.0, z, 0, 1]); if (z < -13.5 || z > 1.8) ring.push([sx1 + 1.0, z, 0, 1]); }
  for (const [x, z, ux, uz] of ring){ const q = R([[x, z]])[0], fx = q[0], fz = q[1];
    seg(PB, [fx, 0, fz], [fx, 9.0, fz], 0.055, 4); cyl(PB, fx, fz, 0.1, 9.0, 9.2, 5);
    const dirx = uz ? 0 : 1, dirz = uz ? 1 : 0, c = FLAGC[(ci++) % FLAGC.length], y1 = 8.75, yb = 7.35, sw = 0.2 + rng()*0.3;
    const A = [fx, y1, fz], Bp = [fx + dirx*1.6, y1 - 0.05, fz + dirz*1.6 + (dirx ? sw : 0)], C = [fx + dirx*1.6 + (dirz ? sw : 0), yb, fz + dirz*1.6 + (dirx ? sw*1.4 : 0)], D = [fx, yb, fz];
    for (const [p, qq, r] of [[A, Bp, C], [A, C, D]]){ FPos.push(...p, ...qq, ...r); for (let k = 0; k < 3; k++) FCol.push(...c); } }
  // lamp standards along the plaza
  for (let z = -33; z < 24; z += 9){ const q = R([[-11.5, z]])[0]; seg(PB, [q[0], 0, q[1]], [q[0], 4.2, q[1]], 0.08, 4); abox(B.p({c:'#fff1d6', glow:'#ffe2b0', gk:0.9}), q[0] - 0.25, q[0] + 0.25, 4.2, 4.8, q[1] - 0.25, q[1] + 0.25); }
  B.flush(g);
  vcTris(g, FPos, FCol, {c:'#ffffff', m:0, lk:0.45});
  return g; }};
place('nyrockefeller', 40.7587, -73.9787, -35, -5.5);

// gable roof over the box x0..x1, z0..z1 from y (eaves) to y + h, ridge along x (ax = true) or z; ends closed
function gableP(o, x0, x1, z0, z1, y, h, ax){
  if (ax){ const zm = (z0 + z1)/2;
    quad(o, [x0, y, z0], [x1, y, z0], [x1, y + h, zm], [x0, y + h, zm]); quad(o, [x1, y, z1], [x0, y, z1], [x0, y + h, zm], [x1, y + h, zm]);
    tri(o, [x0, y, z0], [x0, y + h, zm], [x0, y, z1]); tri(o, [x1, y, z1], [x1, y + h, zm], [x1, y, z0]); }
  else { const xm = (x0 + x1)/2;
    quad(o, [x0, y, z1], [x0, y, z0], [xm, y + h, z0], [xm, y + h, z1]); quad(o, [x1, y, z0], [x1, y, z1], [xm, y + h, z1], [xm, y + h, z0]);
    tri(o, [x0, y, z0], [x1, y, z0], [xm, y + h, z0]); tri(o, [x1, y, z1], [x0, y, z1], [xm, y + h, z1]); }
}
// lancet (pointed) window on a wall: centre c along the wall direction, width w, sill y0, springing y1, apex y1 + w*0.75
// wall given by point a (plan), unit direction u, outward normal n (plan), offset off
function lancet(o, a, u, n, c, w, y0, y1, off){
  const P = (t, y) => [a[0] + u[0]*t + n[0]*off, y, a[1] + u[1]*t + n[1]*off];
  quad(o, P(c - w/2, y0), P(c + w/2, y0), P(c + w/2, y1), P(c - w/2, y1));
  const k = 5, ap = y1 + w*0.75;
  for (let i = 0; i < k; i++){ const t0 = i/k, t1 = (i + 1)/k, f = t => [c - w/2 + w*t, y1 + (ap - y1)*Math.sin(Math.min(t, 1 - t)*PI)];
    const A = f(t0), Bq = f(t1); quad(o, P(A[0], y1), P(Bq[0], y1), P(Bq[0], Bq[1]), P(A[0], A[1])); }
}

// ===== St Patrick's Cathedral (James Renwick Jr., 1858-78; spires 1888; Lady Chapel 1906): Gothic Revival in white marble,
// on the OSM footprint. West front on Fifth Avenue with the two 100.6 m spires (square towers, octagonal belfries with pinnacles,
// octagonal spires), the central gable with the bronze portal and the rose window; nave with aisles, buttresses and pinnacles,
// clerestory, slate roofs; transept with gabled ends and great windows; the choir with its apse, ambulatory chapels and the
// Lady Chapel towards Madison Avenue. The Archbishop's residence and the rectory stay as the real buildings.
// Origin: frame point (-27, -8.2) of the ref (cathedral middle). Front (Fifth Avenue) towards -x.
LANDMARKS.nystpatricks = {zh:'圣帕特里克大教堂', en:"St. Patrick's Cathedral", cat:'old', r:80, h:101,
  lt:{m:0, c:'#ffe0b5', k:0.95, e:0.55, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const marble = {c:'#e7e2d7', m:0, lk:0.95}, slate = {c:'#6d7b7d', m:0, lk:0.35}, glass = {c:'#323c4a', glow:'#ffb969', gk:0.22}, rose = {c:'#3a3550', glow:'#ffcf8c', gk:0.65};
  const bronze = '#5b4a35', shade = {c:'#cfc9bd', m:0, lk:0.85};
  const M = B.p(marble), Sl = B.p(slate), Gw = B.p(glass), Sh = B.p(shade);
  const zc = 0.3;                        // nave axis
  // ---- nave and aisles (x -31.5 .. 2.7), crossing + transept (2.7 .. 25.9), choir (25.9 .. 48.5) + apse
  const NW = 7.3, AW = 19.0, EAV = 33, RID = 43.5, AEAV = 17, AROOF = 23.5;
  abox(M, -31.6, 48.5, -5, EAV, zc - NW, zc + NW);                              // nave + choir walls (clerestory)
  gableP(Sl, -31.6, 48.5, zc - NW - 0.6, zc + NW + 0.6, EAV, RID - EAV, true);
  for (const s of [-1, 1]){
    const z0 = zc + s*NW, z1 = s < 0 ? -18.75 : 19.4;
    abox(M, -31.6, 2.7, -5, AEAV, Math.min(z0, z1), Math.max(z0, z1));          // aisles
    // lean-to aisle roofs
    quad(Sl, [-31.6, AEAV, z1 + s*0.4], [2.7, AEAV, z1 + s*0.4], [2.7, AROOF, z0], [-31.6, AROOF, z0]);
    // choir aisles / ambulatory
    const z2 = s < 0 ? -18.8 : 18.3;
    abox(M, 25.9, 54.6, -5, 16, Math.min(z0, z2), Math.max(z0, z2));
    quad(Sl, [25.9, 16, z2 + s*0.4], [54.6, 16, z2 + s*0.4], [54.6, 22, z0], [25.9, 22, z0]);
  }
  // transept
  abox(M, 2.7, 25.9, -5, EAV, -23.2, 22.9); gableP(Sl, 2.0, 26.6, -23.2, 22.9, EAV, RID - EAV, false);
  // apse: half polygon round x 48.5
  const ap = []; for (let i = 0; i <= 6; i++){ const t = -PI/2 + i/6*PI; ap.push([48.5 + Math.cos(t)*6.0, zc + Math.sin(t)*NW]); }
  prism(M, ap, -5, EAV, false);
  for (let i = 0; i < ap.length - 1; i++){ const a = ap[i], b = ap[i + 1]; tri(Sl, [a[0], EAV, a[1]], [b[0], EAV, b[1]], [48.5, RID, zc]); }
  // radiating chapels round the ambulatory and the Lady Chapel (x 54 .. 77)
  const ch = [[54.6, -18.8], [57.1, -12.3], [60.1, -11.8], [62.0, -9.1], [61.6, -5.7], [61.6, 5.0], [62.0, 8.6], [60.1, 11.1], [56.8, 11.6], [54.7, 18.1]];
  prism(M, ch, -5, 14, true);
  const lady = [[54.0, -5.4], [74.2, -5.8], [77.1, -2.7], [77.0, 1.9], [74.2, 4.8], [54.0, 5.0]];
  prism(M, lady, -5, 21, false);
  gableP(Sl, 54.0, 74.2, -5.9, 5.1, 21, 8.4, true);
  for (const [a, b] of [[[74.2, -5.8], [77.1, -2.7]], [[77.1, -2.7], [77.0, 1.9]], [[77.0, 1.9], [74.2, 4.8]]]) tri(Sl, [a[0], 21, a[1]], [b[0], 21, b[1]], [74.2, 29.4, -0.4]);
  // ---- buttresses with pinnacles along the aisles, transept and choir
  const pin = (x, z, y, h, r) => { cyl(M, x, z, r, y, y + h*0.35, 4, false, PI/4); cyl(M, x, z, [r, 0.05], y + h*0.35, y + h, 4, false, PI/4); };
  for (let x = -31.6; x <= 2.8; x += 6.85){ for (const zb of [-18.75, 19.4]){ const s = zb < 0 ? -1 : 1; abox(M, x - 0.8, x + 0.8, -5, AEAV + 2, Math.min(zb, zb + s*2.0), Math.max(zb, zb + s*2.0)); pin(x, zb + s*1.0, AEAV + 2, 7.5, 0.9); }
    pin(x, zc - NW - 0.3, EAV, 6, 0.6); pin(x, zc + NW + 0.3, EAV, 6, 0.6); }
  for (let x = 25.9; x <= 54.7; x += 7.2) for (const zb of [-18.8, 18.3]){ const s = zb < 0 ? -1 : 1; abox(M, x - 0.75, x + 0.75, -5, 18, Math.min(zb, zb + s*1.8), Math.max(zb, zb + s*1.8)); pin(x, zb + s*0.9, 18, 6.5, 0.8); }
  for (const [x, z] of [[2.7, -23.2], [25.9, -23.2], [2.7, 22.9], [25.9, 22.9]]){ abox(M, x - 1.2, x + 1.2, -5, 38, z - 1.2, z + 1.2); pin(x, z, 38, 10, 1.1); }
  // ---- windows: aisle lancets, clerestory, transept great windows, choir
  const L = (a, b, c, w, y0, y1, off, n) => { const dx = b[0]-a[0], dz = b[1]-a[1], len = Math.hypot(dx, dz); lancet(Gw, a, [dx/len, dz/len], n, c, w, y0, y1, off); };
  for (let k = 0; k < 5; k++){ const c = -31.6 + 6.85*(k + 0.5) + 31.6;
    L([-31.6, 19.4], [2.7, 19.4], c, 3.0, 4.5, 12.5, 0.08, [0, 1]); L([-31.6, -18.75], [2.7, -18.75], c, 3.0, 4.5, 12.5, 0.08, [0, -1]);
    L([-31.6, zc + NW], [2.7, zc + NW], c, 3.4, 24.5, 29.5, 0.08, [0, 1]); L([-31.6, zc - NW], [2.7, zc - NW], c, 3.4, 24.5, 29.5, 0.08, [0, -1]); }
  for (let k = 0; k < 4; k++){ const c = 7.2*(k + 0.5);
    L([25.9, zc + NW], [54, zc + NW], c, 3.2, 22.5, 28.5, 0.08, [0, 1]); L([25.9, zc - NW], [54, zc - NW], c, 3.2, 22.5, 28.5, 0.08, [0, -1]);
    L([25.9, 18.3], [54.6, 18.3], c, 2.6, 4, 11, 0.08, [0, 1]); L([25.9, -18.8], [54.6, -18.8], c, 2.6, 4, 11, 0.08, [0, -1]); }
  for (const [zf, nz] of [[22.9, 1], [-23.2, -1]]){ L([2.7, zf], [25.9, zf], 11.6, 8.5, 7, 24, 0.08, [0, nz]); }
  for (let k = 0; k < 3; k++) for (const [zf, nz] of [[5.0, 1], [-5.6, -1]]) L([54.0, zf], [74.2, zf], 3.4 + k*6.6, 2.6, 5, 15, 0.08, [0, nz]);
  // transept gable ends: rose-like oculus above the great window, pinnacled gables
  for (const zf of [22.95, -23.25]){ const s = zf > 0 ? 1 : -1; cyl(B.p(rose), 14.3, zf + s*0.1, 2.6, 27.6, 27.7, 16); }
  // ---- the west front: towers, central gable, portal, rose window
  const TW = [[-40.3, -31.6, -18.8, -10.6], [-40.0, -31.4, 11.0, 19.4]];
  abox(M, -40.3, -31.6, -5, EAV, -10.6, 11.0);                                   // central bay
  gableP(M, -40.6, -38.6, -10.6, 11.0, EAV, 13.5, false);
  for (const [x0, x1, z0, z1] of TW){
    const cx = (x0 + x1)/2, cz = (z0 + z1)/2, hw = (x1 - x0)/2 + 0.3;
    abox(M, cx - hw, cx + hw, -5, 52, cz - hw, cz + hw);
    // corner buttresses stepping up, with pinnacles at the belfry stage
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]){ const bx = cx + sx*hw, bz = cz + sz*hw;
      abox(M, bx - 1.1, bx + 1.1, -5, 30, bz - 1.1, bz + 1.1); abox(M, bx - 0.8, bx + 0.8, 30, 50, bz - 0.8, bz + 0.8); pin(bx, bz, 50, 15, 0.9); }
    // belfry: octagon with tall openings, gablets, then the octagonal spire
    cyl(M, cx, cz, hw*0.98, 52, 68, 8, false, PI/8);
    for (let i = 0; i < 8; i++){ const t = PI/8 + (i + 0.5)/8*TAU, r = hw*0.98*Math.cos(PI/8) + 0.06;
      const a = [cx + Math.cos(t)*r - Math.sin(t)*1.0, cz + Math.sin(t)*r + Math.cos(t)*1.0];
      lancet(Gw, a, [Math.sin(t), -Math.cos(t)], [Math.cos(t), Math.sin(t)], 1.0, 1.7, 55, 63.5, 0.02);
      const b0 = [cx + Math.cos(t)*r, cz + Math.sin(t)*r];
      tri(Sh, [b0[0] - Math.sin(t)*1.6, 68, b0[1] + Math.cos(t)*1.6], [b0[0] + Math.sin(t)*1.6, 68, b0[1] - Math.cos(t)*1.6], [b0[0] + Math.cos(t)*0.2, 72.5, b0[1] + Math.sin(t)*0.2]); }
    cyl(M, cx, cz, [hw*0.92, 0.25], 68, 99.2, 8, false, PI/8);
    for (const y of [74, 80, 86, 92]) cyl(Sh, cx, cz, hw*0.92*(1 - (y - 68)/31.2) + 0.25, y, y + 0.6, 8, false, PI/8);
    // cross finial
    abox(Sh, cx - 0.12, cx + 0.12, 99.2, 100.6, cz - 0.12, cz + 0.12); abox(Sh, cx - 0.12, cx + 0.12, 99.85, 100.1, cz - 0.55, cz + 0.55);
    // tower windows (lancets on the front and sides)
    L([x0, z1 + 0.3], [x0, z0 - 0.3], (z1 - z0)/2 + 0.3, 2.2, 22, 34, 0.35, [-1, 0]);
    L([x0, z1 + 0.3], [x0, z0 - 0.3], (z1 - z0)/2 + 0.3, 2.6, 38, 47, 0.35, [-1, 0]);
  }
  // portal: deep pointed arch with bronze doors, flanking side portals in the towers, the rose window, gable pinnacles
  const fr = [-40.3, 11.0], fu = [0, -1], fn = [-1, 0];
  lancet(B.p(bronze), fr, fu, fn, 10.8, 6.6, 0, 11, 0.12);
  for (let k = 1; k <= 3; k++) lancet(Sh, fr, fu, fn, 10.8, 6.6 + k*1.1, 0, 11 + k*0.2, 0.12 - k*0.04);
  lancet(B.p(bronze), [-40.0, 19.4], fu, fn, 4.2, 3.0, 0, 7, 0.4); lancet(B.p(bronze), [-40.3, -10.6], fu, fn, 4.1, 3.0, 0, 7, 0.4);
  { const R0 = 4.6, cy = 25.5, cz = 0.2, Ro = B.p(rose), N = 24;
    for (let i = 0; i < N; i++){ const t0 = i/N*TAU, t1 = (i + 1)/N*TAU; tri(Ro, [-40.45, cy, cz], [-40.45, cy + Math.sin(t0)*R0, cz + Math.cos(t0)*R0], [-40.45, cy + Math.sin(t1)*R0, cz + Math.cos(t1)*R0]); }
    for (let i = 0; i < 12; i++){ const t = i/12*TAU; seg(Sh, [-40.55, cy, cz], [-40.55, cy + Math.sin(t)*R0, cz + Math.cos(t)*R0], 0.12, 3); }
    for (let i = 0; i < 32; i++){ const t0 = i/32*TAU, t1 = (i + 1)/32*TAU; seg(Sh, [-40.55, cy + Math.sin(t0)*R0, cz + Math.cos(t0)*R0], [-40.55, cy + Math.sin(t1)*R0, cz + Math.cos(t1)*R0], 0.3, 3); } }
  pin(-40.6, 0.2, 46.5, 5, 0.6); pin(-40.0, -10.6, 33, 9, 0.7); pin(-40.0, 11.0, 33, 9, 0.7);
  // steps on Fifth Avenue
  for (let k = 0; k < 3; k++) abox(Sh, -42.6 + k*0.6, -40.3, -1, 0.15 + k*0.17, -16.5, 17.5);
  B.flush(g);
  return g; }};
place('nystpatricks', 40.7585738, -73.9763195, 0, 0);

// ===== United Nations Headquarters (Harrison & Abramovitz with Le Corbusier, Niemeyer and the Board of Design, 1952) =====
// On the OSM footprints, split into keys so that each part sits on its own ground: nyun = the 155 m Secretariat slab (blue-green
// glass curtain walls with aluminium mullions on the long east and west faces, windowless white Vermont marble end walls, the dark
// louvred mechanical bands at the 6th, 16th and 28th floors and the top); nyunconf = the Conference Building along the river;
// nyunga = the General Assembly Building (marble side walls, concave sweeping roof, the shallow dome) with the link to the
// Secretariat and the visitors' pavilion; nyunflags = the row of 194 flagpoles along First Avenue from 42nd to 48th Street
// (plain coloured flags). The whole complex stands on one platform level (UNP = 8 m above sea level, the DEM drops ~13 m from
// First Avenue to the river there): each part offsets its geometry from the app's base height (LMCTX.u.base) to that level and
// carries its podium walls down to the real ground. Frame origin of the coordinates below: ref anchor 40.7489, -73.968.
const UNP = 8.0, UNA = [40.7489, -73.968];
const unOff = () => UNP - ((LMCTX && LMCTX.u && LMCTX.u.base) ? LMCTX.u.base.value : 0);
LANDMARKS.nyun = {zh:'联合国总部', en:'United Nations Headquarters', cat:'new', r:64, h:168,
  lt:{m:1, c:'#e8f2ff', k:0.55, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB(), y0 = unOff();
  const glass = {c:'#5f9a95', m:1, fh:3.81, cw:1.25}, marble = {c:'#e9e6df', m:0, lk:0.85}, alu = {c:'#c9ced0', m:0, lk:0.3}, louvre = {c:'#3f4446', m:0, lk:0.2};
  const pave = {c:'#cdc8bd', m:0, lk:0.3}, lobby = {c:'#39434a', m:1, fh:6, cw:3, lk:1.0}, conc = '#a7a59f';
  const Gl = B.p(glass), Mb = B.p(marble), Al = B.p(alu), Lv = B.p(louvre), Pv = B.p(pave);
  const XW = 10.8, ZN = -45.0, ZS = 45.0, H = 155.0, T = y0;      // slab: x +-10.8 (east +x), z -45 (north) .. 45 (south)
  // podium / plaza level and foundations down to the real ground
  abox(Pv, -24, 14, T - 14, T, -52, 48); abox(B.p(conc), XW + 0.2, 16, T - 14, T - 0.05, -60, 52);
  // the lobby storey (recessed glass) and the slab
  abox(B.p(lobby), -XW + 1.5, XW - 1.5, T, T + 7.6, ZN + 1, ZS - 1, true);
  abox(Gl, -XW + 0.25, XW - 0.25, T + 7.6, T + H - 4.5, ZN + 0.8, ZS - 0.8, true);
  // marble end walls (north and south), full height, flush with the curtain walls
  for (const z of [ZN, ZS]) abox(Mb, -XW, XW, T + 7.6, T + H, z < 0 ? ZN : ZS - 0.8, z < 0 ? ZN + 0.8 : ZS);
  abox(Mb, -XW, XW, T + H - 4.5, T + H, ZN, ZS);                  // the parapet / roof box
  // mullions on the long faces (every 1.27 m), floor lines
  for (const sx of [-1, 1]){ const xf = sx*(XW - 0.25);
    for (let z = ZN + 1.45; z < ZS - 1.0; z += 1.27) abox(Al, sx > 0 ? xf : xf - 0.12, sx > 0 ? xf + 0.12 : xf, T + 7.6, T + H - 4.5, z - 0.05, z + 0.05);
    for (let y = T + 11.4; y < T + H - 5; y += 3.81) abox(Al, sx > 0 ? xf : xf - 0.08, sx > 0 ? xf + 0.08 : xf, y, y + 0.22, ZN + 0.8, ZS - 0.8);
    // mechanical floors: louvre bands
    for (const [a, b] of [[25.0, 32.6], [63.0, 70.6], [109.0, 116.6], [143.0, 150.6]]) abox(Lv, sx > 0 ? xf : xf - 0.18, sx > 0 ? xf + 0.18 : xf, T + a, T + b, ZN + 0.8, ZS - 0.8);
  }
  // roof plant
  abox(B.p(conc), -6, 6, T + H, T + H + 3.5, -30, 30);
  // entrance canopy on the west (visitors' plaza)
  abox(B.p(conc), -24, -XW, T + 5.6, T + 6.1, -14, 4); for (const z of [-13, -5, 3]) cyl(B.p(conc), -23, z, 0.25, T, T + 5.6, 6);
  B.flush(g);
  const A = B.p(AVI); for (const z of [ZN + 1, ZS - 1]) abox(A, -0.3, 0.3, T + H + 3.5, T + H + 4.2, z - 0.3, z + 0.3); B.flush(g);
  return g; }};
place('nyun', UNA[0], UNA[1], -8.6, 1.4);

LANDMARKS.nyunconf = {zh:'联合国会议楼', en:'United Nations Conference Building', cat:'new', r:78, h:30, label:false,
  lt:{m:1, c:'#e8f2ff', k:0.5, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB(), T = unOff();
  const conc = {c:'#d9d6cf', m:0, lk:0.6}, glass = {c:'#516a72', m:1, fh:4.5, cw:2.4}, pave = {c:'#cdc8bd', m:0, lk:0.3}, roof = '#8b8d8c', green = '#5d8a48';
  const o = [28, -60], R = P => shift(P, o[0], o[1]);
  const lo = R([[2.0, 6.5], [1.7, -43.9], [-0.6, -43.8], [-1.5, -113.5], [9.4, -113.6], [9.4, -117.1], [45.2, -117.3], [45.2, -113.9], [54.3, -114.0], [48.9, 5.2]]);
  const hi = R([[2.0, -0.8], [1.7, -43.9], [1.0, -43.9], [0.7, -98.6], [4.7, -98.6], [5.1, -106.4], [39.8, -107.3], [39.6, -0.6]]);
  // the river podium (over the FDR Drive tunnel) down to the real ground, the five-storey block, the delegates' floors
  prism(B.p(conc), lo, T - 16, T + 2.0, true);
  prism(B.p(glass), lo, T + 2.0, T + 14.0, false); bandsP(B.p(conc), lo, [T + 6.0, T + 10.0], 0.9, 0.06);
  prism(B.p(conc), lo, T + 14.0, T + 15.2, true);
  prism(B.p(glass), hi, T + 15.2, T + 21.8, false); prism(B.p(conc), hi, T + 21.8, T + 23.0, true);
  stripsP(B.p(conc), lo, T + 2.0, T + 14.0, 7.6, 0.7, 0.08, 6);
  flat(B.p(roof), shift(hi, 0, 0), T + 23.05);
  // the garden terrace to the north of the building (frame z -117 .. -132)
  flat(B.p(green), R(rect(9.4, 45.2, -131, -117.4)), T + 2.05); abox(B.p(pave), ...[9.4, 58.7].map(x => x - o[0]), T - 16, T + 2.0, -131 - o[1], -117.3 - o[1]);
  B.flush(g);
  return g; }};
place('nyunconf', UNA[0], UNA[1], 28, -60);

LANDMARKS.nyunga = {zh:'联合国大会堂', en:'United Nations General Assembly Building', cat:'new', r:78, h:38, label:false,
  lt:{m:0, c:'#fff0dc', k:0.75, e:0.5, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB(), T = unOff();
  const marble = {c:'#ebe8e1', m:0, lk:0.8}, glass = {c:'#4b6670', m:1, fh:4.5, cw:2.4, lk:0.9}, roof = {c:'#c9c6bd', m:0, lk:0.35}, dome = {c:'#b9bcb8', m:0, lk:0.5};
  const pave = {c:'#cdc8bd', m:0, lk:0.3}, conc = '#a7a59f';
  const o = [-43, -125], Rr = P => shift(P, o[0], o[1]);
  // plan: west side and east side polylines (south -> north), the wall top rises to the north end, the roof sags in the middle
  const W = Rr([[-68.2, -66.1], [-68.2, -95.6], [-69.6, -125.2], [-71.7, -143.5], [-74.1, -160.3], [-78.2, -182.2]]);
  const E = Rr([[-18.8, -66.4], [-19.2, -76.6], [-19.0, -117.9], [-15.7, -149.5], [-12.4, -166.3], [-9.0, -183.0]]);
  const hz = z => { const t = Math.min(1, Math.max(0, (z - (-66 - o[1]))/(-117))); return 17.5 + 11.0*Math.pow(t, 1.6); };
  const M = B.p(marble), Gl = B.p(glass), Rf = B.p(roof);
  // podium / foundations
  prism(B.p(pave), Rr([[-80, -60], [-6, -60], [-6, -190], [-82, -190]]), T - 12, T, true);
  for (const [P, sgn] of [[W, -1], [E, 1]]) for (let i = 0; i < P.length - 1; i++){ const a = P[i], b = P[i + 1];
    quad(M, [a[0], T, a[1]], [b[0], T, b[1]], [b[0], T + hz(b[1]), b[1]], [a[0], T + hz(a[1]), a[1]]); void sgn; }
  // south end (marble) and north end (the great glass entrance wall with marble frame)
  const s0 = W[0], s1 = E[0], n0 = W[W.length - 1], n1 = E[E.length - 1];
  quad(M, [s0[0], T, s0[1]], [s1[0], T, s1[1]], [s1[0], T + hz(s1[1]), s1[1]], [s0[0], T + hz(s0[1]), s0[1]]);
  quad(Gl, [n0[0], T, n0[1]], [n1[0], T, n1[1]], [n1[0], T + hz(n1[1]) - 1.2, n1[1]], [n0[0], T + hz(n0[1]) - 1.2, n0[1]]);
  abox(M, n0[0], n1[0], T + hz(n1[1]) - 1.2, T + hz(n1[1]) + 0.3, n1[1] - 0.6, n1[1] + 0.6);
  for (let k = 0; k <= 12; k++){ const t = k/12, x = n0[0] + (n1[0] - n0[0])*t, z = n0[1] + (n1[1] - n0[1])*t; abox(M, x - 0.25, x + 0.25, T, T + hz(z) - 1.0, z - 0.4, z + 0.3); }
  // concave roof: ruled strips across, sagging 3.5 m in the middle
  const N = 5;
  for (let i = 0; i < W.length - 1; i++) for (let k = 0; k < N; k++){
    const P = (a, b, t) => { const x = a[0] + (b[0] - a[0])*t, z = a[1] + (b[1] - a[1])*t; return [x, z]; };
    const t0 = k/N, t1 = (k + 1)/N, sag = t => 3.5*Math.sin(t*PI);
    const a0 = P(W[i], E[i], t0), a1 = P(W[i], E[i], t1), b0 = P(W[i + 1], E[i + 1], t0), b1 = P(W[i + 1], E[i + 1], t1);
    quad(Rf, [a0[0], T + hz(a0[1]) - sag(t0), a0[1]], [a1[0], T + hz(a1[1]) - sag(t1), a1[1]], [b1[0], T + hz(b1[1]) - sag(t1), b1[1]], [b0[0], T + hz(b0[1]) - sag(t0), b0[1]]); }
  // the shallow dome over the Assembly Hall (OSM: centre frame -42.5, -126, r ~17, top 32 m)
  const dc = Rr([[-42.5, -126.0]])[0], yb = T + hz(dc[1]) - 3.0;
  lathe(B.p(dome), [[17.2, yb - 0.5], [17.2, yb + 1.2], [15.5, yb + 4.0], [12.0, yb + 6.6], [7.0, yb + 8.4], [2.5, yb + 9.2], [0.01, yb + 9.4]], dc[0], dc[1], 28);
  // link to the Secretariat (OSM 0-18 m) and the visitors' pavilion (glass, 4 m)
  const link = Rr(rect(-19.2, -1.4, -102.6, -76.7)); prism(Gl, link, T, T + 16.8, false); prism(M, link, T + 16.8, T + 18, true);
  const pav = Rr(rect(-93.5, -68.2, -95.6, -80.2)); prism(Gl, pav, T - 6, T + 3.6, false); prism(B.p(roof), pav, T + 3.6, T + 4.0, true);
  // marble fins on the long walls
  for (const P of [W, E]) for (let i = 0; i < P.length - 1; i++){ const a = P[i], b = P[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(L/6);
    for (let k = 1; k < n; k++){ const t = k/n, x = a[0] + (b[0] - a[0])*t, z = a[1] + (b[1] - a[1])*t; void x; void z; } }
  B.flush(g); void conc;
  return g; }};
place('nyunga', UNA[0], UNA[1], -43, -125);

// the flag row along First Avenue (x = -105 in the frame), 42nd -> 48th Street; the poles stand on the real ground (DEM profile)
const UNFG = [8.4, 8.9, 9.5, 10.3, 11.3, 12.4, 13.2, 12.6, 12.3, 12.2, 12.2, 12.5, 13.0, 13.6, 14.4, 14.1, 13.8, 13.5, 13.2, 12.9, 12.6, 12.4, 12.3, 12.2, 12.1, 12.0, 11.9, 11.8, 11.7, 11.6, 11.5, 11.3, 11.2, 11.0, 10.7, 10.3, 10.0, 9.9, 9.9, 9.7, 9.5, 9.3, 9.0, 8.8, 8.5, 8.3, 8.0, 7.8, 7.6];
LANDMARKS.nyunflags = {zh:'联合国旗帜', en:'United Nations flag row', cat:'new', r:252, h:14, label:false,
  lt:{m:0, c:'#fff0dc', k:0.5, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng, base = (LMCTX && LMCTX.u && LMCTX.u.base) ? LMCTX.u.base.value : 0;
  const pole = {c:'#d5d8da', m:0, lk:0.5}, PB = B.p(pole), FP = [], FC = [];
  const oz = -162, z0 = 80 - oz, z1 = -402 - oz, n = 194;
  const gp = z => { const i = (82 - (z + oz))/10, k = Math.max(0, Math.min(UNFG.length - 2, Math.floor(i))), t = Math.min(1, Math.max(0, i - k)); return UNFG[k]*(1 - t) + UNFG[k + 1]*t; };
  for (let i = 0; i < n; i++){
    const z = z0 + (z1 - z0)*i/(n - 1), yb = gp(z) - base, h = 10.5;
    seg(PB, [0, yb - 1.0, z], [0, yb + h, z], 0.055, 4); cyl(PB, 0, z, 0.09, yb + h, yb + h + 0.15, 5);
    const c = FLAGC[Math.floor(rng()*FLAGC.length)], c2 = FLAGC[Math.floor(rng()*FLAGC.length)], y1 = yb + h - 0.2, ylo = y1 - 1.25, sw = 0.15 + rng()*0.35, fw = 1.9;
    // flag towards the avenue (-x), drooping; two plain colour fields (top / bottom) at most
    const A = [0, y1, z], Bq = [-fw, y1 - 0.15, z + sw], C = [-fw, ylo - 0.15, z + sw*1.4], D = [0, ylo, z], Mt = [0, (y1 + ylo)/2, z], Mb = [-fw, (y1 + ylo)/2 - 0.15, z + sw*1.2];
    const two = rng() < 0.4;
    for (const [p, q, r, cc] of [[A, Bq, Mb, c], [A, Mb, Mt, c], [Mt, Mb, C, two ? c2 : c], [Mt, C, D, two ? c2 : c]]){ FP.push(...p, ...q, ...r); for (let k = 0; k < 3; k++) FC.push(...cc); }
  }
  B.flush(g); vcTris(g, FP, FC, {c:'#ffffff', m:0, lk:0.4});
  return g; }};
place('nyunflags', UNA[0], UNA[1], -105, -162);

// generated by tools/gentsq.py: Times Square screens on the real facades (panels [x0, z0, x1, z1, y0, y1, seed, roofY|-1] in the key frame)
const TSQK = {
  nytsq1:{lat:40.7568001, lon:-73.9865958, r:69, b:["r38", "r76"], p:[[0.55,16.32,0.59,29.76,4.6,18.8,0.140,-1.0],[0.55,16.32,0.59,29.76,19.8,33.5,0.741,-1.0],[-0.36,30.93,-0.58,45.10,4.6,33.5,0.505,-1.0],[-0.66,46.37,-1.56,53.78,5.8,14.7,0.449,-1.0],[-0.66,46.37,-1.56,53.78,15.7,24.1,0.869,-1.0],[-0.66,46.37,-1.56,53.78,25.1,33.5,0.160,-1.0],[0.17,-66.75,0.26,-46.91,4.8,16.9,0.267,-1.0],[0.17,-66.75,0.26,-46.91,17.9,29.5,0.648,-1.0],[0.26,-45.82,0.31,-34.59,6.0,29.5,0.270,-1.0],[0.32,-33.25,0.39,-15.31,4.9,17.0,0.776,-1.0],[0.32,-33.25,0.39,-15.31,18.0,29.5,0.032,-1.0],[0.40,-14.46,0.43,-6.81,4.9,12.8,0.315,-1.0],[0.40,-14.46,0.43,-6.81,13.8,21.1,0.396,-1.0],[0.40,-14.46,0.43,-6.81,22.1,29.5,0.459,-1.0]]},
  nytsq2:{lat:40.7566073, lon:-73.9859817, r:81, b:["r1", "r10"], p:[[18.77,76.52,15.66,69.55,4.9,17.0,0.380,-1.0],[18.77,76.52,15.66,69.55,18.0,29.5,0.344,-1.0],[15.22,68.31,12.69,59.09,5.4,29.5,0.379,-1.0],[12.41,58.09,7.17,39.01,5.7,17.4,0.705,-1.0],[6.97,38.26,4.46,29.15,4.7,29.5,0.380,-1.0],[0.35,0.42,-2.35,-11.49,5.6,20.8,0.428,-1.0],[0.35,0.42,-2.35,-11.49,21.8,36.5,0.362,-1.0],[-2.66,-12.85,-5.05,-23.38,5.5,36.5,0.153,-1.0],[-5.21,-24.09,-9.15,-41.50,5.7,20.8,0.996,-1.0],[-5.21,-24.09,-9.15,-41.50,21.8,36.5,0.971,-1.0],[-9.43,-42.75,-11.46,-51.68,5.9,15.8,0.769,-1.0],[-9.43,-42.75,-11.46,-51.68,16.8,26.1,0.294,-1.0],[-9.43,-42.75,-11.46,-51.68,27.1,36.5,0.003,-1.0],[-11.72,-52.82,-12.98,-58.40,6.4,36.5,0.106,-1.0]]},
  nytsq3:{lat:40.7575515, lon:-73.9860762, r:13, b:["r6"], p:[[2.21,-7.63,2.32,3.97,6.5,13.8,0.128,-1.0],[2.21,-7.63,2.32,3.97,14.8,21.7,0.550,-1.0],[2.21,-7.63,2.32,3.97,22.7,29.5,0.872,-1.0],[-6.80,3.40,-6.78,7.58,5.6,29.5,0.399,-1.0]]},
  nytsq4:{lat:40.7579824, lon:-73.9852868, r:90, b:["r120", "r5", "d201"], p:[[8.54,72.45,6.15,58.80,6.3,18.0,0.225,18.7],[8.54,72.45,6.15,58.80,19.0,30.2,0.588,18.7],[6.02,58.03,3.98,46.34,4.6,30.2,0.905,18.7],[3.75,45.07,2.05,35.30,5.0,17.3,0.132,18.7],[3.75,45.07,2.05,35.30,18.3,30.2,0.571,18.7],[1.88,34.34,-0.37,21.45,6.1,30.2,0.659,18.7],[15.26,82.44,9.12,73.83,6.2,30.2,0.984,18.7],[-3.29,3.25,-3.51,-12.07,4.9,29.5,0.579,-1.0],[-3.53,-13.11,-3.81,-31.83,4.6,12.6,0.919,-1.0],[-3.53,-13.11,-3.81,-31.83,13.6,21.0,0.057,-1.0],[-3.53,-13.11,-3.81,-31.83,22.0,29.5,0.851,-1.0],[-3.82,-32.48,-3.96,-42.36,6.2,17.6,0.890,-1.0],[-3.82,-32.48,-3.96,-42.36,18.6,29.5,0.595,-1.0],[-3.98,-43.46,-4.08,-50.08,5.7,13.3,0.261,-1.0],[-3.98,-43.46,-4.08,-50.08,14.3,21.4,0.314,-1.0],[-3.98,-43.46,-4.08,-50.08,22.4,29.5,0.131,-1.0],[-4.12,-78.08,-4.20,-87.65,5.2,29.5,0.262,16.9]]},
  nytsq5:{lat:40.7587658, lon:-73.9854848, r:73, b:["r9", "d165", "d166", "d167"], p:[[2.82,11.59,6.08,25.45,5.2,30.5,0.190,-1.0],[13.36,44.74,11.42,48.19,6.5,30.5,0.926,-1.0],[11.34,48.77,13.80,59.65,5.5,30.5,0.902,-1.0],[13.97,60.37,15.84,68.64,5.3,17.6,0.697,-1.0],[13.97,60.37,15.84,68.64,18.6,30.5,0.783,-1.0],[-6.92,-29.02,-5.06,-22.77,4.7,12.8,0.265,18.6],[-6.92,-29.02,-5.06,-22.77,13.8,21.5,0.881,18.6],[-6.92,-29.02,-5.06,-22.77,22.5,30.1,0.370,18.6],[-11.83,-48.58,-7.22,-30.14,5.9,13.4,0.807,13.9],[-11.83,-48.58,-7.22,-30.14,14.4,21.5,0.668,13.9],[-11.83,-48.58,-7.22,-30.14,22.5,29.5,0.932,13.9],[-13.25,-55.15,-12.10,-49.72,5.0,29.5,0.155,14.6]]},
  nytsq6:{lat:40.7588873, lon:-73.9854347, r:8, b:["d179"], p:[[-1.37,-5.71,1.37,5.71,5.2,17.8,0.251,19.5],[-1.37,-5.71,1.37,5.71,18.8,31.0,0.051,19.5]]},
  nytsq7:{lat:40.7588921, lon:-73.9846708, r:18, b:["tsx"], p:[[0.00,0.50,-0.07,-15.67,5.4,31.5,0.945,-1.0],[0.03,5.93,0.01,1.65,4.6,17.8,0.148,-1.0],[0.03,5.93,0.01,1.65,18.8,31.5,0.308,-1.0]]},
};

// ===== Times Square: LED screens with abstract motion graphics (no text, no logos, no adverts) =====
// One material per key: vertex colours carry the screen coordinates (r = 1000*width_dm + 3 + u*990, g = 1000*height_dm + 3 + v*990,
// b = programme seed); the fragment shader draws one of six abstract programmes, changing every 8 s, self-lit by day and
// very bright at night (on the shared LMT time uniform).
const TSQ_GLSL = `
vec3 tsqHue(float h){ return clamp(abs(mod(h*6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
float tsqH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
vec3 tsqLed(vec2 uv, float asp, float seed, float t){
  float T = t/8.0 + seed*17.0, sl = floor(T), f = fract(T);
  float pr = floor(tsqH(vec2(sl, seed*13.0))*6.0);
  float h0 = tsqH(vec2(sl*1.7, seed + 0.3));
  vec3 c1 = tsqHue(h0), c2 = tsqHue(fract(h0 + 0.33 + 0.2*tsqH(vec2(sl, 4.0)))), c3 = tsqHue(fract(h0 + 0.62));
  vec2 p = vec2(uv.x*asp, uv.y);
  vec3 col;
  if (pr < 0.5){
    col = mix(c2*0.35, c1*0.9, uv.y);
    vec2 cc = vec2(asp*fract(0.15 + f*0.7 + seed), 0.45 + 0.25*sin(t*0.7 + seed*6.0));
    col = mix(col, vec3(1.0, 0.97, 0.9), smoothstep(0.03, -0.03, length(p - cc) - 0.28));
    col = mix(col, c3, step(0.5, fract(p.x*1.5 - t*0.4))*step(uv.y, 0.16));
  } else if (pr < 1.5){
    float s = fract((p.x - p.y*0.8)*1.4 - t*0.6); col = mix(mix(c1, c2, step(0.5, s)), c3, step(0.85, s))*0.95;
  } else if (pr < 2.5){
    vec2 cc = vec2(asp*(0.5 + 0.35*sin(t*0.5 + seed*9.0)), 0.5 + 0.3*cos(t*0.4 + seed));
    float r = length(p - cc); col = mix(c1, c2, 0.5 + 0.5*sin(r*14.0 - t*3.5))*(0.75 + 0.25*sin(r*3.0 - t));
  } else if (pr < 3.5){
    vec2 q = floor(p*vec2(6.0, 6.0)); float hh = tsqH(q + sl*3.1);
    col = tsqHue(fract(h0 + hh*0.35))*(0.3 + 0.7*step(0.45, fract(hh*7.0 + f*1.7)));
  } else if (pr < 4.5){
    float nb = max(6.0, floor(asp*9.0)), bi = floor(uv.x*nb), bh = 0.15 + 0.8*abs(sin(t*(1.1 + tsqH(vec2(bi, seed))*2.0) + bi));
    col = mix(c2*0.12, mix(c1, c3, uv.y), step(uv.y, bh)*step(0.12, fract(uv.x*nb)));
  } else {
    float w = sin(p.x*3.0 + t*1.2 + seed*5.0)*0.12 + sin(p.x*7.0 - t*0.8)*0.05;
    float b = fract((uv.y + w)*3.0 - t*0.15); col = mix(c1, c2, smoothstep(0.3, 0.7, b))*mix(0.55, 1.0, uv.y) + c3*0.25*step(0.92, b);
  }
  float edge = smoothstep(0.0, 0.012, min(min(uv.x, 1.0 - uv.x)*asp, min(uv.y, 1.0 - uv.y)));
  return col*(0.25 + 0.75*smoothstep(0.0, 0.05, f)*(1.0 - smoothstep(0.95, 1.0, f)))*edge;
}`;
function tsqLedMat(k){
  const m = lmMat({c:'#ffffff', vc:true, ds:true, m:0, lk:0, cw:7.77});
  if (m.userData.nytsq) return m; m.userData.nytsq = 1;
  const base = m.onBeforeCompile, kk = k || 1;
  m.onBeforeCompile = function nytsqLED(sh){
    base(sh);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + TSQ_GLSL)
      .replace('#include <color_fragment>', `vec3 tsqC = vec3(0.0);
#ifdef USE_COLOR
{ float Wd = floor(vColor.r/1000.0), Hd = floor(vColor.g/1000.0);
  vec2 suv = clamp(vec2((vColor.r - Wd*1000.0 - 3.0)/990.0, (vColor.g - Hd*1000.0 - 3.0)/990.0), 0.0, 1.0);
  float sdq = floor(vColor.b*997.0 + 0.5)/997.0;     // the interpolated seed is not bit-exact: quantise it before hashing
  tsqC = tsqLed(suv, max(Wd, 1.0)/max(Hd, 1.0), sdq, uTime); }
#endif
diffuseColor.rgb = vec3(0.03) + tsqC*0.3;`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += tsqC*(' + (0.7*kk).toFixed(2) + ' + 1.25*uNight);');
  };
  m.customProgramCacheKey = () => 'nytsqLED1|' + kk;
  return m;
}
// a screen: plan points a -> b (the face looks along the outward normal), y0..y1; adds to pos/col arrays
function tsqPanel(P, C, a, b, y0, y1, seed){
  const W = Math.hypot(b[0] - a[0], b[1] - a[1]), Wd = Math.max(1, Math.round(W*10)), Hd = Math.max(1, Math.round((y1 - y0)*10));
  const V = (u, v) => [1000*Wd + 3 + u*990, 1000*Hd + 3 + v*990, Math.round(seed*997)/997];
  const A = [a[0], y0, a[1]], Bq = [b[0], y0, b[1]], Cq = [b[0], y1, b[1]], D = [a[0], y1, a[1]];
  P.push(...A, ...Bq, ...Cq, ...A, ...Cq, ...D); C.push(...V(0, 0), ...V(1, 0), ...V(1, 1), ...V(0, 0), ...V(1, 1), ...V(0, 1));
}
function tsqMesh(g, P, C, k){
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, tsqLedMat(k)); m.castShadow = false; m.receiveShadow = false; g.add(m); return m;
}

// ===== One Times Square (1904; 25 storeys, 110.6 m): the narrow wedge at the south end of the bow-tie, wrapped in screens — the
// famous stack on the north end (screens wider than the 7 m tip, 10-80 m), screens on the Broadway and Seventh Avenue sides, and
// on the roof the 23 m mast with the New Year's Eve ball (LED, slowly cycling colours). OSM: tower part 0-110.6 m (frame z 32..51),
// north wedge 0-80 m. Origin: frame point (-12, 33) of the timessq ref (anchor 40.7564, -73.9862).
LANDMARKS.nytimessq = {zh:'时代广场', en:'Times Square', cat:'new', r:30, h:135,
  lt:{m:1, c:'#ffe9cc', k:0.6, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const o = [-12, 33], R = P => shift(P, o[0], o[1]);
  const body = {c:'#b9b2a6', m:0, lk:0.5}, frame = '#232528', steel = {c:'#8c9094', m:0, lk:0.4}, ball = {c:'#eef3f8', m:2, lk:1.3, glow:'#ffffff', gk:0.25};
  const tower = R([[-21.4, 51.3], [-20.4, 32.1], [-7.7, 31.2], [-2.2, 51.5]]), wedge = R([[-20.4, 32.1], [-20.3, 8.8], [-13.6, 8.9], [-7.7, 31.2]]);
  prism(B.p(body), tower, -5, 110.6, true); prism(B.p(body), wedge, -5, 80, true);
  stripsP(B.p({c:'#4a4f55', m:1, fh:4.2, cw:2.2}), tower, 84, 109, 2.2, 1.1, 0.06);
  // roof: parapet and the ball mast
  bandsP(B.p(body), tower, [110.6], 1.1, 0.0);
  const mc = R([[-12.3, 42.0]])[0];
  for (const [dx, dz] of [[-1.2, -1.2], [1.2, -1.2], [1.2, 1.2], [-1.2, 1.2]]) seg(B.p(steel), [mc[0] + dx, 110.6, mc[1] + dz], [mc[0] + dx*0.35, 133.5, mc[1] + dz*0.35], 0.12, 4);
  for (let y = 113; y < 133; y += 4) abox(B.p(steel), mc[0] - 1.25 + (y - 110)*0.035, mc[0] + 1.25 - (y - 110)*0.035, y, y + 0.2, mc[1] - 1.25 + (y - 110)*0.035, mc[1] + 1.25 - (y - 110)*0.035);
  const Bl = B.p(ball); { const r = 1.85, cy = 132.6, n = 10, m = 7;
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++){ const t0 = i/n*TAU, t1 = (i + 1)/n*TAU, p0 = j/m*PI, p1 = (j + 1)/m*PI;
      const P = (t, p) => [mc[0] + Math.sin(p)*Math.cos(t)*r, cy - Math.cos(p)*r, mc[1] + Math.sin(p)*Math.sin(t)*r];
      quad(Bl, P(t0, p0), P(t1, p0), P(t1, p1), P(t0, p1)); } }
  // screens: [face a, face b (plan, frame coords), y0, y1] — north stack (wider than the tip), Broadway side, Seventh Avenue side
  const SP = [], SC = [], Fr = B.p(frame);
  const scr = (a, b, y0, y1, out) => { const A = R([a])[0], Bq = R([b])[0], dx = Bq[0] - A[0], dz = Bq[1] - A[1], L = Math.hypot(dx, dz), nx = dz/L, nz = -dx/L;
    const a2 = [A[0] + nx*out, A[1] + nz*out], b2 = [Bq[0] + nx*out, Bq[1] + nz*out];
    tsqPanel(SP, SC, a2, b2, y0, y1, rng());
    // cabinet behind the screen
    quad(Fr, [A[0] + nx*(out - 0.05), y0 - 0.3, A[1] + nz*(out - 0.05)], [Bq[0] + nx*(out - 0.05), y0 - 0.3, Bq[1] + nz*(out - 0.05)], [Bq[0] + nx*(out - 0.05), y1 + 0.3, Bq[1] + nz*(out - 0.05)], [A[0] + nx*(out - 0.05), y1 + 0.3, A[1] + nz*(out - 0.05)]);
    for (const P of [[A, a2], [Bq, b2]]) quad(Fr, [P[0][0], y0 - 0.3, P[0][1]], [P[1][0], y0 - 0.3, P[1][1]], [P[1][0], y1 + 0.3, P[1][1]], [P[0][0], y1 + 0.3, P[0][1]]);
    abox(Fr, Math.min(A[0], a2[0], Bq[0], b2[0]), Math.max(A[0], a2[0], Bq[0], b2[0]), y1 + 0.2, y1 + 0.5, Math.min(A[1], a2[1], Bq[1], b2[1]), Math.max(A[1], a2[1], Bq[1], b2[1])); };
  // north end: stack of screens hung on a frame wider than the tip (from x -22.5 to -8.5 at z 8.0)
  const stack = [[6.0, 16.5], [17.3, 27.5], [28.3, 38.0], [38.8, 49.5], [50.3, 59.0], [59.8, 69.5], [70.3, 79.5]];
  for (const [y0, y1] of stack){ const w = 6.5 + rng()*1.5; scr([-15.0 - w, 7.6], [-15.0 + w, 7.6], y0, y1, 0.6); }
  // frame posts holding the wide stack to the wedge
  for (const x of [-21.5, -8.5]) seg(Fr, R([[x, 8.4]]).map(p => [p[0], 4, p[1]])[0], R([[x, 8.4]]).map(p => [p[0], 80.5, p[1]])[0], 0.25, 4);
  // Broadway (east) side of the wedge and the tower, Seventh Avenue (west) side
  for (const [y0, y1] of [[5.5, 24], [25, 52], [53, 79]]) scr([-13.6, 8.9], [-7.7, 31.2], y0, y1, 0.7);
  for (const [y0, y1] of [[5.5, 30], [31, 62], [63, 96]]) scr([-7.7, 31.2], [-2.2, 51.5], y0, y1, 0.7);
  for (const [y0, y1] of [[5.5, 26], [27, 55], [56, 79]]) scr([-20.4, 32.1], [-20.3, 8.8], y0, y1, 0.7);
  for (const [y0, y1] of [[5.5, 34], [35, 70], [71, 100]]) scr([-21.4, 51.3], [-20.4, 32.1], y0, y1, 0.7);
  // south face on 42nd Street: one tall screen
  scr([-2.2, 51.5], [-21.4, 51.3], 30, 66, 0.7);
  B.flush(g); tsqMesh(g, SP, SC, 1);
  return g; }};
place('nytimessq', 40.7564, -73.9862, -12, 33);

// ===== the screens of the bow-tie on the real buildings (keys nytsq1..7, unlabelled): generated panels on the facades that face
// the square (tools/gentsq.py; each key's panels lie on one side of the square so that no real building is hidden), each with its
// cabinet; above low roofs the screens stand on steel frames ("spectaculars").
function tsqKey(k){
  const D = TSQK[k];
  return {zh:'时代广场屏幕', en:'Times Square screens', cat:'new', r:D.r, h:60, label:false, lt:{m:0, c:'#ffffff', k:0.3, anim:'none'}, build(){
    const g = new THREE.Group(), B = mkB(), Fr = B.p('#202225'), St = B.p({c:'#6e7277', m:0, lk:0.3}), P = [], C = [];
    for (const [x0, z0, x1, z1, y0, y1, sd, roof] of D.p){
      const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz) || 1, nx = dz/L, nz = -dx/L;
      // the outward normal points away from the building: panels were placed 0.75 m out; cabinet back towards the wall
      const bx = -nx*0.55, bz = -nz*0.55;
      // decide the facing: the panel generator stored a -> b with the outward normal on the right-hand side or left; test both
      tsqPanel(P, C, [x0, z0], [x1, z1], y0, y1, sd);
      quad(Fr, [x0 + bx, y0 - 0.35, z0 + bz], [x1 + bx, y0 - 0.35, z1 + bz], [x1 + bx, y1 + 0.35, z1 + bz], [x0 + bx, y1 + 0.35, z0 + bz]);
      quad(Fr, [x0 - bx*0.05, y1 + 0.35, z0 - bz*0.05], [x1 - bx*0.05, y1 + 0.35, z1 - bz*0.05], [x1 + bx, y1 + 0.35, z1 + bz], [x0 + bx, y1 + 0.35, z0 + bz]);
      if (roof > 0 && y1 > roof + 1){
        // steel frame behind a screen standing above a low roof: posts and braces down to the roof, back 3 m
        const n = Math.max(2, Math.round(L/4));
        for (let i = 0; i <= n; i++){ const t = i/n, px = x0 + dx*t + bx, pz = z0 + dz*t + bz;
          seg(St, [px, Math.max(y0, roof - 0.5), pz], [px, y1 + 0.3, pz], 0.12, 4);
          seg(St, [px - nx*1.25, roof, pz - nz*1.25], [px, y1 - 1.0, pz], 0.08, 4); }
        for (const y of [roof + 2, (roof + y1)/2, y1 - 1]) seg(St, [x0 + bx, y, z0 + bz], [x1 + bx, y, z1 + bz], 0.08, 4);
      }
    }
    B.flush(g); tsqMesh(g, P, C, 1);
    return g; }};
}
for (const k of Object.keys(TSQK)){ LANDMARKS[k] = tsqKey(k); SG_PLACES.push({type:k, lat:TSQK[k].lat, lon:TSQK[k].lon, rot:ROT}); }

// ===== the TKTS booth in Father Duffy Square (2008): 27 red glass steps rising 4.9 m to the north over the glass ticket booth,
// lit red from within at night; the statue of Father Duffy before a Celtic cross to the north, George M. Cohan's to the south.
// Footprint from OSM (frame of a point at 40.7590, -73.9851; the steps' plan is the trapezoid below). Unlabelled key.
LANDMARKS.nytkts = {zh:'TKTS红色台阶', en:'TKTS red steps', cat:'new', r:30, h:8, label:false,
  lt:{m:0, c:'#ffffff', k:0.4, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB();
  const red = {c:'#c8141c', m:0, lk:0.3, glow:'#ff2a22', gk:0.85}, edge = {c:'#e9e6e0', m:0, lk:0.5}, glass = {c:'#4c5d66', m:1, fh:3, cw:2, lk:1.0}, bronze = {c:'#4f4436', m:0, lk:0.7}, granite = {c:'#8f8a84', m:0, lk:0.6};
  // trapezoid: south edge z -12.1 (x -0.2 .. 10.4), north edge z -29.9 (x -4.7 .. 10.0); centre (3.8, -21.5)
  const c0 = [3.8, -21.5], xs = z => { const t = (z - (-12.1))/(-17.8); return [-0.2 + (-4.7 + 0.2)*t - c0[0], 10.4 + (10.0 - 10.4)*t - c0[0]]; };
  const Rd = B.p(red), E = B.p(edge);
  const N = 27, zS = -12.1, zN = -29.9, Ht = 4.9;
  for (let i = 0; i < N; i++){
    const za = zS + (zN - zS)*i/N - c0[1], zb = zS + (zN - zS)*(i + 1)/N - c0[1], y = Ht*(i + 1)/N, [xa0, xa1] = xs(za + c0[1]), [xb0, xb1] = xs(zb + c0[1]);
    quad(Rd, [xa0, y, za], [xa1, y, za], [xb1, y, zb], [xb0, y, zb]);                                  // tread
    quad(Rd, [xa0, y - Ht/N, za], [xa1, y - Ht/N, za], [xa1, y, za], [xa0, y, za]);                    // riser
    abox(E, xa0, xa1, y - 0.02, y + 0.01, za - 0.04, za + 0.04);
  }
  // the booth under the steps: glass sides, the back wall
  const [n0, n1] = xs(zN), [s0, s1] = xs(zS);
  quad(B.p(glass), [s0, 0, zS - c0[1]], [n0, 0, zN - c0[1]], [n0, Ht, zN - c0[1]], [s0, Ht/N, zS - c0[1]]);
  quad(B.p(glass), [s1, 0, zS - c0[1]], [n1, 0, zN - c0[1]], [n1, Ht, zN - c0[1]], [s1, Ht/N, zS - c0[1]]);
  quad(B.p(glass), [n0, 0, zN - c0[1]], [n1, 0, zN - c0[1]], [n1, Ht, zN - c0[1]], [n0, Ht, zN - c0[1]]);
  abox(B.p(granite), n0 - 0.4, n1 + 0.4, -1.5, 0.15, zN - c0[1] - 0.4, zS - c0[1] + 0.4);
  // glass railings along both sides
  for (const s of [0, 1]){ const a = s ? [s1, zS - c0[1]] : [s0, zS - c0[1]], b = s ? [n1, zN - c0[1]] : [n0, zN - c0[1]]; quad(B.p({c:'#cfe3ea', op:0.35}), [a[0], Ht/N, a[1]], [b[0], Ht, b[1]], [b[0], Ht + 1.1, b[1]], [a[0], Ht/N + 1.1, a[1]]); }
  // Father Duffy (north, before a Celtic cross) and George M. Cohan (south): bronze figures on granite pedestals
  const fig = (x, z, rot) => { abox(B.p(granite), x - 1.0, x + 1.0, -1, 2.4, z - 1.0, z + 1.0); cyl(B.p(bronze), x, z, [0.45, 0.32], 2.4, 4.0, 8); cyl(B.p(bronze), x, z, 0.2, 4.0, 4.5, 6); void rot; };
  fig(2.0 - c0[0], -35.5 - c0[1], 0); abox(B.p(granite), 2.0 - c0[0] - 0.3, 2.0 - c0[0] + 0.3, 2.4, 8.2, -37.4 - c0[1], -36.9 - c0[1]); abox(B.p(granite), 2.0 - c0[0] - 1.3, 2.0 - c0[0] + 1.3, 6.6, 7.1, -37.4 - c0[1], -36.9 - c0[1]);
  cyl(B.p(granite), 2.0 - c0[0], -37.15 - c0[1], 0.9, 6.85, 6.86, 12);
  fig(3.0 - c0[0], 4.0 - c0[1], 0);
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'nytkts', ...LL(40.7590, -73.9851, 3.8, -21.5), rot:ROT});
}
