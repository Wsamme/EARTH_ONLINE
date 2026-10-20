// ---------- City Brush v32 (lm29) · hqsc: Silicon Valley company headquarters in Santa Clara and Sunnyvale ----------
// Keys: svnvidia(+_b) svintel(+_b) svamd(+_b) svamat svpanw svservicenow(+_b) svlab126(+_b) svsynopsys(+_b).
// Every building stands on its real OSM footprint (rings inlined below, local metres: +x east, +z south, rot 0).
// Architecture, landscape and lighting only: no logos, names, signs, brand colours or company art on any model.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const HQD = {"svnvidia":{"lat":37.372484,"lon":-121.967223,"ground":14.0,"c":[-2,-87],"b":[{"i":11,"h":23.4,"n":"NVIDIA Voyager","r":[[-83.1,27.6],[-81.6,-101.6],[-26.7,-133.1],[83.8,-68.9],[84.0,16.5],[-8.0,70.1]]},{"i":9,"h":3.5,"n":"","r":[[4.7,102.2],[5.0,80.0],[60.2,48.5],[78.1,58.6],[78.6,122.4],[59.5,132.9]]}]},"svnvidia_b":{"lat":37.370637,"lon":-121.967087,"ground":14.0,"c":[10,118],"b":[{"i":8,"h":22.0,"n":"NVIDIA Endeavor","r":[[-91.1,79.0],[-89.2,-81.6],[-47.0,-106.2],[-5.7,-83.7],[14.4,-75.6],[33.4,-64.2],[52.9,-49.8],[90.8,-26.2],[91.7,24.6],[-47.7,105.3]]}]},"svintel":{"lat":37.387881,"lon":-121.964483,"ground":8.1,"c":[-78,-9],"b":[{"i":3,"h":20.2,"n":"Robert Noyce Building","r":[[14.0,-2.2],[60.8,-26.5],[77.7,5.9],[129.6,-21.1],[154.9,27.4],[56.2,78.7]]},{"i":1,"h":13.4,"n":"Garage B","r":[[-154.9,-28.5],[-57.7,-79.2],[-22.4,-11.7],[-119.6,39.0]]}]},"svintel_c":{"lat":37.387359,"lon":-121.964925,"ground":8.1,"c":[-117,49],"b":[{"i":2,"h":7.0,"n":"Intel SC9","r":[[-61.9,-10.3],[26.0,-57.2],[62.3,10.5],[-25.6,57.5]]}]},"svintel_b":{"lat":37.387169,"lon":-121.961935,"ground":8.1,"c":[147,70],"b":[{"i":4,"h":12.4,"n":"Garage A","r":[[-56.6,-32.3],[6.2,-64.7],[56.4,32.4],[-6.4,64.7]]}]},"svamd":{"lat":37.382683,"lon":-121.96993,"ground":9.0,"c":[121,13],"b":[{"i":1,"h":25.0,"n":"","r":[[-74.8,-48.1],[1.3,-48.4],[1.5,-4.8],[-74.7,-4.6]]},{"i":3,"h":25.0,"n":"","r":[[30.0,-28.4],[73.7,-28.6],[74.2,47.7],[30.5,47.9]]}]},"svamd_b":{"lat":37.383323,"lon":-121.972512,"ground":9.0,"c":[-107,-58],"b":[{"i":2,"h":25.2,"n":"","r":[[81.7,42.4],[81.8,-25.8],[118.4,-25.7],[118.3,42.4]]},{"i":4,"h":25.2,"n":"","r":[[-19.6,44.7],[49.4,44.6],[49.4,81.5],[-19.6,81.6]]},{"i":5,"h":23.0,"n":"","r":[[-35.3,-66.5],[8.4,-66.6],[8.7,8.6],[-35.0,8.7]]},{"i":8,"h":25.0,"n":"","r":[[78.9,93.6],[79.0,69.6],[143.3,69.8],[143.2,93.8]]},{"i":6,"h":12.5,"n":"","r":[[18.1,-41.9],[68.2,-42.0],[68.2,-33.9],[18.1,-33.8]]},{"i":7,"h":13.3,"n":"","r":[[-142.7,-89.4],[-138.1,-89.4],[-138.1,-94.0],[-71.4,-94.4],[-71.4,-89.8],[-65.6,-89.8],[-65.1,-3.8],[-61.0,-3.8],[-61.0,3.4],[-58.7,3.4],[-58.6,15.3],[-64.8,15.4],[-64.5,70.6],[-70.0,70.7],[-70.0,75.6],[-136.3,75.9],[-136.3,70.8],[-141.8,70.8]]}]},"svamat":{"lat":37.378035,"lon":-121.979737,"ground":11.4,"c":[-224,-15],"b":[{"i":6,"h":21.5,"n":"Applied Materials Building 1","r":[[42.2,17.8],[76.3,18.0],[76.3,10.4],[97.2,10.6],[97.3,-11.1],[128.6,-10.9],[128.8,92.0],[103.5,92.0],[103.5,105.8],[66.8,105.8],[66.6,91.8],[42.4,92.0]]},{"i":8,"h":24.9,"n":"Applied Materials Building 2","r":[[63.5,-106.4],[129.4,-106.7],[129.4,-96.7],[125.3,-96.7],[125.6,-39.3],[129.4,-39.3],[129.4,-30.6],[63.8,-30.4]]},{"i":9,"h":13.3,"n":"","r":[[-51.4,-0.2],[-39.1,-51.8],[45.7,-51.1],[45.7,0.0],[19.7,0.7],[20.1,36.7],[-31.7,23.4],[-27.9,5.0]]},{"i":11,"h":5.5,"n":"","r":[[7.2,-86.9],[43.9,-87.2],[43.8,-104.8],[57.6,-104.9],[57.9,-64.0],[7.4,-63.7]]},{"i":7,"h":25.6,"n":"Applied Materials Building 12","r":[[-130.1,-15.9],[-120.6,-57.3],[-103.3,-53.3],[-102.9,-56.6],[-96.1,-56.7],[-95.9,-51.6],[-52.4,-41.7],[-61.9,-0.3],[-81.1,-4.6],[-81.1,-1.7],[-88.0,-1.5],[-88.2,-6.3]]}]},"svpanw":{"lat":37.3832,"lon":-121.98298,"ground":10.6,"c":[-60,-111],"b":[{"i":29,"h":26.6,"n":"","r":[[-114.3,-70.9],[-74.3,-70.8],[-74.4,-17.8],[-71.8,-17.9],[-72.7,-4.8],[-79.1,23.0],[-113.5,22.8]]},{"i":30,"h":26.6,"n":"","r":[[0.1,-68.6],[40.6,-69.0],[41.4,17.5],[0.9,19.2]]},{"i":31,"h":26.6,"n":"","r":[[-54.7,46.5],[-33.0,41.2],[-10.5,39.2],[-7.7,42.5],[41.8,42.5],[43.5,82.1],[-51.4,81.3],[-50.6,60.0],[-54.3,56.8]]},{"i":28,"h":6.4,"n":"","r":[[-102.5,84.3],[-102.1,35.9],[-71.5,36.6],[-71.4,47.1],[-75.1,47.4],[-74.8,84.7]]},{"i":27,"h":12.6,"n":"","r":[[78.3,-86.6],[193.0,-87.3],[193.9,64.4],[79.2,65.1]]},{"i":33,"h":11.2,"n":"","r":[[-194.7,-79.5],[-191.0,-79.5],[-191.0,-83.3],[-138.1,-83.4],[-137.9,83.2],[-141.7,83.2],[-141.7,86.9],[-190.7,87.0],[-190.7,82.5],[-194.5,82.5]]}]},"svservicenow":{"lat":37.375493,"lon":-121.96242,"ground":11.8,"c":[166,23],"b":[{"i":10,"h":11.0,"n":"ServiceNow","r":[[-57.8,-18.8],[-52.1,-25.9],[-47.8,-32.3],[-44.1,-38.8],[-41.0,-45.7],[-37.0,-60.6],[-36.6,-72.7],[-25.3,-72.5],[-25.4,-76.4],[-17.0,-76.7],[-17.0,-77.6],[-2.0,-78.2],[-2.0,-72.3],[0.0,-72.2],[-1.0,-56.9],[-3.2,-45.5],[-6.3,-34.8],[-10.7,-24.0],[-15.6,-14.3],[-21.2,-5.5],[-27.6,2.0],[-28.9,0.8],[-33.0,5.2],[-42.6,-4.2],[-45.5,-1.1],[-52.3,-7.6],[-49.1,-10.3]]},{"i":7,"h":10.6,"n":"","r":[[-52.7,49.2],[-42.3,42.6],[-48.2,33.1],[-26.7,20.6],[-16.5,34.5],[-10.1,40.2],[1.0,47.8],[14.1,54.1],[28.0,57.5],[24.0,94.9],[11.7,92.8],[-0.6,89.0],[-11.3,84.7],[-21.2,79.3],[-32.4,71.7],[-40.9,63.9],[-47.8,56.6]]},{"i":11,"h":10.0,"n":"","r":[[-4.6,4.0],[1.9,-11.4],[6.8,-26.2],[9.1,-24.2],[13.6,-39.3],[17.8,-39.3],[18.0,-90.7],[22.5,-90.7],[22.5,-95.2],[52.3,-95.1],[52.3,-91.0],[57.1,-90.9],[56.5,34.5],[51.6,34.5],[51.6,39.2],[23.6,39.0],[23.6,40.8],[16.1,40.8],[16.1,36.2],[14.0,34.1],[13.2,34.8],[7.7,30.0],[8.2,29.2],[6.5,27.7],[8.8,18.2],[5.4,14.8],[4.7,15.4],[-0.9,10.3],[-0.2,9.6],[-4.2,6.2],[-3.4,5.4]]}]},"svservicenow_b":{"lat":37.375304,"lon":-121.964549,"ground":11.8,"c":[-22,44],"b":[{"i":8,"h":11.4,"n":"ServiceNow","r":[[-17.8,-9.0],[-17.8,-21.0],[-15.6,-35.1],[-5.7,-66.6],[73.6,-65.8],[79.4,-52.9],[87.9,-23.0],[85.0,27.7],[70.6,27.8],[69.3,-23.3],[28.4,-23.1],[28.5,-9.2]]},{"i":12,"h":11.1,"n":"","r":[[-15.4,14.9],[28.8,14.9],[28.6,28.4],[85.0,27.7],[83.1,40.7],[73.8,69.1],[-4.1,70.0],[-8.3,57.9],[-12.6,42.8],[-13.8,28.1]]},{"i":9,"h":12.3,"n":"ServiceNow","r":[[-87.4,59.3],[-73.3,-70.4],[-33.9,-66.1],[-40.4,-6.6],[-33.3,-5.9],[-34.5,5.2],[-41.5,4.4],[-47.9,63.5]]}]},"svlab126":{"lat":37.409414,"lon":-122.035773,"ground":6.6,"c":[20,-46],"b":[{"i":6,"h":26.6,"n":"Amazon SJC10","r":[[-82.1,28.0],[-79.3,21.1],[-78.1,-13.4],[-75.2,-12.5],[-68.6,-31.6],[-65.5,-30.2],[-56.5,-48.2],[-34.0,-23.6],[-49.4,37.0]]},{"i":7,"h":17.9,"n":"Amazon SJC11","r":[[-92.7,123.2],[-83.5,87.1],[-81.5,87.7],[-79.1,80.0],[-80.3,79.7],[-79.8,78.2],[-24.6,93.2],[-25.2,96.6],[-22.3,97.8],[-21.7,95.1],[-13.8,96.9],[-11.3,97.0],[-8.5,98.2],[-9.0,120.1],[-9.9,119.9],[-11.4,143.8],[-23.8,143.8],[-24.6,145.8],[-37.1,144.2],[-44.1,142.6],[-45.1,144.8],[-66.4,137.8],[-76.8,131.7],[-76.3,128.1]]},{"i":5,"h":8.6,"n":"Amazon SJC32","r":[[-85.7,-77.8],[-83.5,-94.2],[-82.8,-94.1],[-81.4,-97.5],[-84.8,-98.1],[-83.9,-101.8],[-80.2,-110.5],[-69.9,-128.4],[-67.9,-127.1],[-65.7,-137.1],[-35.3,-129.3],[-38.1,-118.5],[-36.6,-118.1],[-44.0,-89.9],[-45.5,-90.3],[-48.5,-77.6],[-50.1,-77.8],[-52.5,-69.5],[-56.2,-70.0],[-55.7,-66.0],[-83.0,-58.2],[-84.4,-66.7],[-84.4,-70.4],[-83.4,-77.3]]},{"i":4,"h":11.0,"n":"Amazon SJC13","r":[[-66.1,-174.0],[-59.5,-199.4],[-47.4,-196.3],[-47.5,-198.8],[-35.7,-198.7],[-26.4,-197.7],[-13.0,-195.0],[-13.0,-192.0],[5.4,-185.6],[4.3,-182.0],[18.9,-174.7],[2.1,-156.5],[-1.9,-152.8],[-16.8,-155.5],[-26.5,-158.0],[-26.9,-156.4],[-56.5,-163.6],[-56.1,-165.3],[-65.4,-167.6],[-64.2,-173.3]]},{"i":3,"h":11.5,"n":"","r":[[-17.5,16.4],[-13.9,2.0],[-5.6,4.1],[13.4,-71.3],[6.7,-73.0],[10.7,-88.9],[18.9,-86.8],[38.8,-165.9],[30.0,-168.1],[32.2,-176.7],[39.6,-174.9],[45.5,-198.5],[81.5,-189.5],[20.3,52.9],[-17.3,43.4],[-10.9,18.1]]},{"i":22,"h":12.6,"n":"","r":[[-8.8,189.0],[-7.4,183.8],[-8.5,183.5],[52.9,-50.7],[56.5,-49.7],[57.5,-53.5],[91.9,-44.5],[28.2,198.7]]}]},"svlab126_b":{"lat":37.406811,"lon":-122.036453,"ground":6.6,"c":[-40,243],"b":[{"i":1,"h":8.9,"n":"","r":[[-26.4,-6.3],[-22.9,-17.5],[-18.4,-25.0],[-13.2,-31.2],[-8.5,-35.7],[-2.3,-39.9],[-4.4,-29.8],[10.0,-43.0],[14.0,-45.6],[12.4,-40.9],[27.1,-36.4],[7.7,36.4],[-2.8,33.4],[-6.6,45.7],[-10.8,39.1],[-14.6,27.5],[-21.7,25.1],[-19.3,13.5],[-22.9,8.1],[-24.1,2.2],[-21.7,-4.9]]}]},"svsynopsys":{"lat":37.398443,"lon":-122.032526,"ground":12.0,"c":[86,-138],"b":[{"i":9,"h":13.8,"n":"Synopsys Building 6","r":[[-17.5,65.2],[-3.0,9.3],[6.8,11.9],[7.8,6.9],[15.4,8.8],[16.2,4.6],[52.6,14.4],[36.1,79.1]]},{"i":31,"h":13.8,"n":"","r":[[-52.4,-21.9],[-37.8,-75.8],[-32.1,-74.3],[-30.5,-80.1],[-6.2,-73.5],[-7.9,-67.6],[-0.1,-65.5],[-13.1,-17.3],[-15.3,-17.9],[-16.0,-15.1],[-19.0,-15.9],[-19.8,-13.1]]}]},"svsynopsys_b":{"lat":37.396596,"lon":-122.034044,"ground":12.0,"c":[-48,67],"b":[{"i":2,"h":21.4,"n":"Synopsys, Building 1","r":[[-89.2,-65.6],[-79.1,-108.9],[-4.5,-88.9],[-16.8,-45.3]]},{"i":19,"h":8.9,"n":"Synopsys","r":[[27.7,-32.1],[48.0,-108.3],[89.0,-96.9],[68.8,-20.3]]},{"i":21,"h":11.7,"n":"","r":[[-8.0,97.7],[5.3,47.3],[11.3,48.7],[13.9,37.2],[8.4,35.7],[21.5,-14.1],[68.9,-2.2],[40.8,109.8]]},{"i":0,"h":3.8,"n":"Synopsys, Building 2","r":[[-82.1,72.7],[-61.5,-4.3],[-20.9,6.4],[-39.7,84.0]]}]}};
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a)*t;
// ---- triangle batches (one LTris call per colour spec) ----
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const Q = (o, a, b, c, d) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]);
const T3 = (o, a, b, c) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
// ---- plan polygons [[x, z], ...] ----
const sarea = P => { let s = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; };
const orient = P => { const Q2 = []; for (const p of P){ const l = Q2[Q2.length - 1]; if (!l || Math.hypot(p[0] - l[0], p[1] - l[1]) > 0.4) Q2.push([p[0], p[1]]); }
  if (Q2.length > 3 && Math.hypot(Q2[0][0] - Q2[Q2.length - 1][0], Q2[0][1] - Q2[Q2.length - 1][1]) < 0.4) Q2.pop(); return sarea(Q2) > 0 ? Q2 : Q2.reverse(); };
const enrm = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1; return [dz/L, -dx/L]; };   // outward for positive area
function offP(P, d){ const n = P.length, R = [];
  for (let i = 0; i < n; i++){ const a = P[(i + n - 1) % n], b = P[i], c = P[(i + 1) % n], n1 = enrm(a, b), n2 = enrm(b, c);
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const k = Math.max(0.35, 1 + n1[0]*n2[0] + n1[1]*n2[1]); R.push([b[0] + mx/k*d, b[1] + mz/k*d]); } return R; }
const inP = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
const dSeg = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx*dx + dz*dz || 1, t = clamp(((x - a[0])*dx + (z - a[1])*dz)/L2, 0, 1); return Math.hypot(x - a[0] - t*dx, z - a[1] - t*dz); };
const dEdge = (P, x, z) => { let d = 1e9; for (let i = 0; i < P.length; i++) d = Math.min(d, dSeg(x, z, P[i], P[(i + 1) % P.length])); return d; };
const bbox = P => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of P){ x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); } return [x0, z0, x1, z1]; };
function pole(P){ const [x0, z0, x1, z1] = bbox(P); let best = [(x0 + x1)/2, (z0 + z1)/2, 0];
  for (let i = 1; i < 16; i++) for (let j = 1; j < 16; j++){ const x = lerp(x0, x1, i/16), z = lerp(z0, z1, j/16); if (!inP(P, x, z)) continue; const d = dEdge(P, x, z); if (d > best[2]) best = [x, z, d]; } return best; }
const mainAng = P => { let L = 0, a = 0; for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i + 1) % P.length], l = Math.hypot(q[0] - p[0], q[1] - p[1]); if (l > L){ L = l; a = Math.atan2(q[1] - p[1], q[0] - p[0]); } } return a; };
function cap(o, P, y){ const tri = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const t of tri) o.push(P[t[0]][0], y, P[t[0]][1], P[t[1]][0], y, P[t[1]][1], P[t[2]][0], y, P[t[2]][1]); }
function wall(o, P, y0, y1){ for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; Q(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } }
function ringBand(o, P, d, y0, y1){ const A = offP(P, d); wall(o, A, y0, y1); if (d > 0.02){ const I = P; for (let i = 0; i < P.length; i++){ const a = A[i], b = A[(i + 1) % P.length], c = I[(i + 1) % P.length], e = I[i]; Q(o, [a[0], y1, a[1]], [b[0], y1, b[1]], [c[0], y1, c[1]], [e[0], y1, e[1]]); Q(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [c[0], y0, c[1]], [e[0], y0, e[1]]); } } }
// oriented box (centre x, z; bottom y) into a batch, no bottom face
function boxB(o, x, y, z, w, h, d, ry){ const c = Math.cos(ry || 0), s = Math.sin(ry || 0), hw = w/2, hd = d/2;
  const P = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(p => [x + p[0]*c - p[1]*s, z + p[0]*s + p[1]*c]);
  wall(o, P, y, y + h); Q(o, [P[0][0], y + h, P[0][1]], [P[1][0], y + h, P[1][1]], [P[2][0], y + h, P[2][1]], [P[3][0], y + h, P[3][1]]); }
// prism between two points (steel members)
function segP(o, a, b, r, n){ n = n || 4; const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2] - d[2]*up[1], uy = d[2]*up[0] - d[0]*up[2], uz = d[0]*up[1] - d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz - d[2]*uy, vy = d[2]*ux - d[0]*uz, vz = d[0]*uy - d[1]*ux;
  const ring = p => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*r, s = Math.sin(t)*r; R.push([p[0] + ux*c + vx*s, p[1] + uy*c + vy*s, p[2] + uz*c + vz*s]); } return R; };
  const A = ring(a), B = ring(b); for (let i = 0; i < n; i++){ const j = (i + 1) % n; Q(o, A[i], A[j], B[j], B[i]); } }
// ---- shared palette (neutral, invented) ----
const C = {
  conc:'#c9c4b9', dark:'#2c2f33', roof:'#c3c3bd', pave:'#bdb6a8', lawn:'#7d955c',
  trunk:'#5a4a3c', oak:'#5b7445', red:'#3f5a3d', carW:'#d8d9da', carD:'#3b3e44', steel:'#6b6f73',
  lamp:{c:'#f4ecd8', glow:'#ffdcae', gk:1.4},
};
C.concD = C.pave; C.deck = C.roof; C.mech = '#aeb1b2'; C.plane = C.oak; C.carS = C.carW;
// ---- trees, cars ----
function treeB(B, x, z, s, kind, r, y0){ y0 = y0 || 0; const T = B.p(C.trunk), j = (r() - 0.5)*0.3; s *= 1 + j;
  if (kind === 'red'){ // redwood: tall cone tiers
    segP(T, [x, y0 - 0.5, z], [x, y0 + 3*s, z], 0.35*s, 4); const L = B.p(C.red);
    for (let k = 0; k < 3; k++){ const yb = y0 + (2 + k*3.2)*s, rr = (3.0 - k*0.75)*s, ht = 5*s, n = 6, a0 = r()*TAU;
      for (let i = 0; i < n; i++){ const a = a0 + i/n*TAU, b = a0 + (i + 1)/n*TAU; T3(L, [x + Math.cos(a)*rr, yb, z + Math.sin(a)*rr], [x + Math.cos(b)*rr, yb, z + Math.sin(b)*rr], [x, yb + ht, z]); } }
    return; }
  const L = B.p(kind === 'plane' ? C.plane : C.oak), th = (kind === 'plane' ? 3.4 : 2.6)*s;
  segP(T, [x, y0 - 0.5, z], [x, y0 + th + 1, z], 0.28*s, 4);
  const rr = (kind === 'plane' ? 3.4 : 3.9)*s, hc = (kind === 'plane' ? 5.6 : 4.4)*s, yc = y0 + th, n = 6, a0 = r()*TAU, top = [x, yc + hc, z], bot = [x, yc - 0.3*s, z];
  const R1 = [], R2 = []; for (let i = 0; i < n; i++){ const a = a0 + i/n*TAU, a2 = a + PI/n; R1.push([x + Math.cos(a)*rr*0.85, yc + hc*0.3, z + Math.sin(a)*rr*0.85]); R2.push([x + Math.cos(a2)*rr*0.7, yc + hc*0.72, z + Math.sin(a2)*rr*0.7]); }
  for (let i = 0; i < n; i++){ const j2 = (i + 1) % n; T3(L, bot, R1[j2], R1[i]); T3(L, R1[i], R1[j2], R2[i]); T3(L, R2[i], R1[j2], R2[j2]); T3(L, R2[i], R2[j2], top); }
}
function carB(B, x, y, z, ry, r){ const k = r(), col = k < 0.45 ? C.carW : k < 0.75 ? C.carS : C.carD; const o = B.p(col);
  boxB(o, x, y, z, 4.5, 0.85, 1.85, ry); boxB(o, x - Math.cos(ry)*0.3, y + 0.85, z - Math.sin(ry)*0.3, 2.4, 0.6, 1.6, ry); }
// trees scattered in a polygon (kept clear of the given buildings)
function grove(B, P, n, kinds, r, avoid, s){ let k = 0, tries = 0; const [x0, z0, x1, z1] = bbox(P);
  while (k < n && tries++ < n*30){ const x = lerp(x0, x1, r()), z = lerp(z0, z1, r()); if (!inP(P, x, z) || dEdge(P, x, z) < 2) continue;
    if (avoid && avoid.some(A => inP(A, x, z) || dEdge(A, x, z) < 5)) continue; treeB(B, x, z, (s || 1)*(0.85 + r()*0.3), kinds[(r()*kinds.length) | 0], r); k++; } }
// trees inside the convex hull of the key's own footprints (so the app's hide-hull does not grow), clear of the buildings
function campusTrees(B, D, n, kinds, r, s, skip){ const all = []; for (const b of D.b) for (const p of b.r) all.push(p); const H = offP(hullP(all), -4), Bs = D.b.map(b => orient(b.r));
  let k = 0, tries = 0; const [x0, z0, x1, z1] = bbox(H);
  while (k < n && tries++ < n*40){ const x = lerp(x0, x1, r()), z = lerp(z0, z1, r()); if (!inP(H, x, z)) continue; if (Bs.some(A => inP(A, x, z) || dEdge(A, x, z) < (skip || 7))) continue;
    treeB(B, x, z, (s || 1)*(0.85 + r()*0.3), kinds[(r()*kinds.length) | 0], r); k++; } }
function rowTrees(B, a, b, step, kind, r, s){ const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.floor(L/step)); for (let i = 0; i <= n; i++){ const t = i/n; treeB(B, lerp(a[0], b[0], t), lerp(a[1], b[1], t), (s || 1)*(0.9 + r()*0.2), kind, r); } }
// paved / lawn plate with a skirt (the ground is flat here; y = 0 is the highest ground + 0.6 m)
function plate(B, P, col, y){ y = y === undefined ? -0.3 : y; const o = B.p(col); cap(o, P, y); wall(o, P, -2.5, y); }
// ---- generic office building on a real footprint ----
// o: {h facade top, fl floors, g0 ground-floor height, style 'curtain' | 'band', glass spec, sp spandrel colour, mul mullion colour, mw mullion step,
//     par parapet, roof colour, screen (rooftop mechanical screen), piers (vertical piers every n m), fin depth, lobby}
function office(B, P, o, r){
  P = orient(P); const h = o.h, fl = o.fl, g0 = o.g0 || 4.8, fh = (h - g0)/Math.max(1, fl - 1), par = o.par === undefined ? 1.2 : o.par;
  const G = B.p(o.glass), S = B.p(o.sp), M = B.p(o.mul || o.sp), Rf = B.p(o.roof || C.roof);
  wall(B.p(o.sp), offP(P, 0.15), -3, 0.15);                                     // plinth
  wall(G, P, 0, h);                                                                // glass skin (lit windows at night)
  for (let k = 1; k < fl; k++){ const y = g0 + (k - 1)*fh;                         // floor lines / spandrels
    if (o.style === 'band') ringBand(S, P, 0.18, y - (o.sh || 1.25), y + 0.35); else ringBand(S, P, 0.1, y - (o.spH || 0.35), y + 0.3);
    if (o.blades) ringBand(B.p(o.bladeC || o.sp), P, o.blades, y + 0.3, y + 0.45); }
  if (o.style === 'band' && o.sill) ringBand(S, P, 0.12, 0.15, o.sill);
  ringBand(B.p(o.cap || o.sp), P, 0.2, h - (o.style === 'band' ? 1.4 : 0.6), h + par);   // parapet / roof band
  wall(Rf, offP(P, -0.25), h, h + par - 0.1);
  cap(Rf, P, h + 0.05);
  // vertical rhythm: mullion fins (curtain) or piers (band)
  const step = o.mw || 1.6, fd = o.fin || 0.32;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = enrm(a, b), tx = (b[0] - a[0])/L, tz = (b[1] - a[1])/L;
    if (o.style === 'band'){ if (!o.piers) continue; const m = Math.max(1, Math.round(L/o.piers));
      for (let k = 0; k <= m; k++){ const t = k/m*L, x = a[0] + tx*t, z = a[1] + tz*t; boxB(S, x + n[0]*0.2, 0, z + n[1]*0.2, 0.9, h + par*0.6, 0.5, Math.atan2(tz, tx)); } continue; }
    const m = Math.max(1, Math.round(L/step));
    for (let k = 1; k < m; k++){ const t = k/m*L, x = a[0] + tx*t, z = a[1] + tz*t, big = o.major && k % o.major === 0, dd = big ? fd*2.2 : fd*0.5;
      Q(M, [x, 0.2, z], [x + n[0]*dd, 0.2, z + n[1]*dd], [x + n[0]*dd, h, z + n[1]*dd], [x, h, z]); } }
  // corner returns
  for (const p of P) boxB(M, p[0], 0, p[1], 0.5, h, 0.5, 0);
  // lobby: a taller clear-glass band with a canopy on the longest edge
  if (o.lobby !== false){ let L = 0, li = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > L){ L = l; li = i; } }
    const a = P[li], b = P[(li + 1) % P.length], n = enrm(a, b), mx = (a[0] + b[0])/2, mz = (a[1] + b[1])/2, ang = Math.atan2(b[1] - a[1], b[0] - a[0]), w = Math.min(L*0.4, 22);
    boxB(B.p(o.canopy || C.steel), mx + n[0]*2.2, g0 - 0.2, mz + n[1]*2.2, w, 0.45, 4.4, ang); }
  // arcade: a colonnade with a canopy slab along the two longest edges (covered walks between the buildings)
  if (o.arcade){ const E = []; for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i + 1) % P.length]; E.push([Math.hypot(q[0] - p[0], q[1] - p[1]), i]); } E.sort((x, y) => y[0] - x[0]);
    const AC = B.p(o.arcC || o.mul || o.sp);
    for (const [L, i] of E.slice(0, 2)){ const p = P[i], q = P[(i + 1) % P.length], n = enrm(p, q), tx = (q[0] - p[0])/L, tz = (q[1] - p[1])/L, ang = Math.atan2(tz, tx), dd = o.arcade;
      boxB(AC, (p[0] + q[0])/2 + n[0]*dd/2, g0 - 0.6, (p[1] + q[1])/2 + n[1]*dd/2, L - 2, 0.6, dd, ang);
      const m = Math.max(1, Math.round(L/7.5)); for (let k = 0; k <= m; k++){ const t = 1 + (L - 2)*k/m; boxB(AC, p[0] + tx*t + n[0]*(dd - 0.4), 0, p[1] + tz*t + n[1]*(dd - 0.4), 0.55, g0 - 0.6, 0.55, ang); } } }
  // rooftop mechanical screen and units
  if (o.screen !== false){ const pl = pole(P), ang = mainAng(P), w = clamp(pl[2]*1.3, 5, 30), d = clamp(pl[2]*1.0, 4, 18), hs = o.sch || 3.6, MS = B.p(o.mech || C.mech);
    if (pl[2] > 4){ boxB(MS, pl[0], h, pl[1], w, hs, d, ang); const ca = Math.cos(ang), sa = Math.sin(ang);
      for (let k = 0; k < 3; k++){ const u = (r() - 0.5)*w*0.6; boxB(B.p(C.dark), pl[0] + ca*u, h + hs, pl[1] + sa*u, 2.2, 0.8, 2.2, ang); }
      // roof hatches / small skylights and duct runs round the screen
      for (let k = 0; k < 6; k++){ const u = (r() - 0.5)*pl[2]*2.6, v = (r() - 0.5)*pl[2]*1.6, x = pl[0] + ca*u - sa*v, z = pl[1] + sa*u + ca*v;
        if (inP(P, x, z) && dEdge(P, x, z) > 3 && (Math.abs(u) > w/2 + 2 || Math.abs(v) > d/2 + 2)) boxB(MS, x, h, z, 2.5 + r()*3, 0.9, 1.6 + r()*2, ang); }
      if (o.pv){ const PVc = B.p(o.pvc || '#2b3240'); for (let u = -pl[2]*1.6; u <= pl[2]*1.6; u += 4.2) for (let v = -pl[2]*1.6; v <= pl[2]*1.6; v += 2.4){ const x = pl[0] + ca*u - sa*v, z = pl[1] + sa*u + ca*v;
        if (!inP(P, x, z) || dEdge(P, x, z) < 3 || (Math.abs(u) < w/2 + 3 && Math.abs(v) < d/2 + 3)) continue;
        const a = [x - ca*1.8 + sa*0.9, h + 0.4, z - sa*1.8 - ca*0.9], b = [x + ca*1.8 + sa*0.9, h + 0.4, z + sa*1.8 - ca*0.9], c = [x + ca*1.8 - sa*0.9, h + 1.0, z + sa*1.8 + ca*0.9], e = [x - ca*1.8 - sa*0.9, h + 1.0, z - sa*1.8 + ca*0.9]; Q(PVc, a, b, c, e); } } } }
  return P;
}
// ---- parking structure on a real footprint ----
function garage(B, P, o, r){
  P = orient(P); const h = o.h, lv = o.lv, fh = h/lv, CN = B.p(o.conc || C.conc), DK = B.p(C.dark), DE = B.p(o.deck || C.deck);
  wall(CN, P, -3, 0.2);
  wall(DK, offP(P, -1.4), 0, h);                                                   // the dark decks behind the openings
  for (let k = 1; k <= lv; k++){ const y = k*fh; ringBand(CN, P, 0.05, y - 0.35, y + (k === lv ? 1.15 : 0.95)); }
  for (let k = 1; k < lv; k++) cap(DE, offP(P, -1.3), k*fh - 0.3);
  cap(DE, P, h + 0.02);
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = enrm(a, b), m = Math.max(1, Math.round(L/(o.bay || 9)));
    for (let k = 0; k < m; k++){ const t = k/m, x = lerp(a[0], b[0], t) - n[0]*0.45, z = lerp(a[1], b[1], t) - n[1]*0.45; boxB(CN, x, 0, z, 0.7, h, 0.7, 0); } }
  // stair / lift cores at the two ends of the long axis
  const ang = mainAng(P), ca = Math.cos(ang), sa = Math.sin(ang); let pmin = null, pmax = null, umin = 1e9, umax = -1e9; const pl = pole(P);
  for (const p of P){ const u = (p[0] - pl[0])*ca + (p[1] - pl[1])*sa; if (u < umin){ umin = u; pmin = p; } if (u > umax){ umax = u; pmax = p; } }
  for (const [p, sg] of [[pmin, 1], [pmax, -1]]){ const cx = p[0] + (pl[0] - p[0])*0.12, cz = p[1] + (pl[1] - p[1])*0.12; if (!inP(P, cx, cz)) continue;
    boxB(CN, cx, 0, cz, 6.5, h + 4, 6.5, ang); boxB(B.p(o.cglass || '#5d6a72'), cx + ca*sg*0.1, 1, cz + sa*sg*0.1, 6.8, h + 2.5, 5.2, ang); }
  // parked cars on the top deck and light poles
  const I = offP(P, -3.5), [x0, z0, x1, z1] = bbox(P), R = Math.hypot(x1 - x0, z1 - z0)/2, cx0 = (x0 + x1)/2, cz0 = (z0 + z1)/2;
  for (let u = -R; u <= R; u += 5.6) for (let v = -R; v <= R; v += 2.7){ const x = cx0 + ca*u - sa*v, z = cz0 + sa*u + ca*v;
    if (((Math.round((u + R)/5.6)) % 3) === 1) continue; if (!inP(I, x, z) || r() > (o.fill || 0.55)) continue; carB(B, x, h + 0.02, z, ang + HP, r); }
  if (o.pv){ const PVc = B.p(o.pvc || '#2b3240'), ST = B.p(C.steel);   // solar carport canopies in long rows
    for (let u = -R; u <= R; u += 16.8){ let run = []; const flush = () => { if (run.length > 2){ const a = run[0], b = run[run.length - 1];
        for (const p of run.filter((q, i) => i % 3 === 0)) segP(ST, [p[0], h, p[1]], [p[0], h + 3.6, p[1]], 0.18, 4);
        const ex = -sa*3.4, ez = ca*3.4; Q(PVc, [a[0] - ex, h + 3.4, a[1] - ez], [b[0] - ex, h + 3.4, b[1] - ez], [b[0] + ex, h + 4.3, b[1] + ez], [a[0] + ex, h + 4.3, a[1] + ez]); } run = []; };
      for (let v = -R; v <= R; v += 3){ const x = cx0 + ca*u - sa*v, z = cz0 + sa*u + ca*v; if (inP(I, x, z) && dEdge(I, x, z) > 3.5) run.push([x, z]); else flush(); } flush(); } }
  else for (let u = -R; u <= R; u += 24) for (let v = -R; v <= R; v += 24){ const x = cx0 + ca*u - sa*v, z = cz0 + sa*u + ca*v; if (!inP(I, x, z)) continue;
    boxB(B.p(C.steel), x, h, z, 0.25, 7, 0.25, 0); boxB(B.p(C.lamp), x, h + 7, z, 1.6, 0.25, 0.5, ang); }
  return P;
}
// ---- the NVIDIA roofs: a faceted triangular lattice clipped to the plan, with triangular skylights ----
function clipConvex(poly, P){ // poly: [[x, y, z]...] clipped by the convex plan P (positive area)
  let out = poly;
  for (let i = 0; i < P.length && out.length; i++){ const a = P[i], b = P[(i + 1) % P.length], n = enrm(a, b), inp = [];
    const sd = p => (p[0] - a[0])*n[0] + (p[2] - a[1])*n[1];
    for (let k = 0; k < out.length; k++){ const p = out[k], q = out[(k + 1) % out.length], dp = sd(p), dq = sd(q);
      if (dp <= 0) inp.push(p); if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)){ const t = dp/(dp - dq); inp.push([lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerp(p[2], q[2], t)]); } }
    out = inp; }
  return out; }
function hullP(P){ const pts = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0])*(b[1] - o[1]) - (a[1] - o[1])*(b[0] - o[0]);
  const lo = [], up = []; for (const p of pts){ while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--){ const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  lo.pop(); up.pop(); return orient(lo.concat(up)); }
function lattice(P, s, ang, hf){ // node heights hf(i, j, x, z); returns {node(i, j), rh(x, z), cells}
  const u = [Math.cos(ang)*s, Math.sin(ang)*s], v = [Math.cos(ang + PI/3)*s, Math.sin(ang + PI/3)*s], det = u[0]*v[1] - u[1]*v[0];
  const ij = (x, z) => [(x*v[1] - z*v[0])/det, (u[0]*z - u[1]*x)/det];
  let i0 = 1e9, i1 = -1e9, j0 = 1e9, j1 = -1e9; for (const p of P){ const [a, b] = ij(p[0], p[1]); i0 = Math.min(i0, a); i1 = Math.max(i1, a); j0 = Math.min(j0, b); j1 = Math.max(j1, b); }
  i0 = Math.floor(i0) - 1; i1 = Math.ceil(i1) + 1; j0 = Math.floor(j0) - 1; j1 = Math.ceil(j1) + 1;
  const H = new Map(), key = (i, j) => i*10007 + j;
  const node = (i, j) => { const x = i*u[0] + j*v[0], z = i*u[1] + j*v[1]; let y = H.get(key(i, j)); if (y === undefined){ y = hf(i, j, x, z); H.set(key(i, j), y); } return [x, y, z]; };
  const rh = (x, z) => { const [a, b] = ij(x, z), i = Math.floor(a), j = Math.floor(b), fa = a - i, fb = b - j;
    if (fa + fb < 1){ const p = node(i, j), q = node(i + 1, j), w = node(i, j + 1); return p[1] + (q[1] - p[1])*fa + (w[1] - p[1])*fb; }
    const p = node(i + 1, j + 1), q = node(i, j + 1), w = node(i + 1, j); return p[1] + (q[1] - p[1])*(1 - fa) + (w[1] - p[1])*(1 - fb); };
  const cells = []; for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++){ cells.push([node(i, j), node(i + 1, j), node(i, j + 1), i, j, 0]); cells.push([node(i + 1, j), node(i + 1, j + 1), node(i, j + 1), i, j, 1]); }
  return {node, rh, cells};
}
// o: {s grid, ang, hf, ov overhang, slope (glass lean), fd fascia depth, sky(i, j, t) -> skylight scale or 0, glass, roof, skyc, fasc, mul, mw}
function triRoofBuilding(B, Praw, o, r){
  const P = hullP(orient(Praw)), Lt = lattice(P, o.s, o.ang, o.hf), RF = B.p(o.roof), SK = B.p(o.skyc), FA = B.p(o.fasc);
  const SF = B.p(o.soffit || o.fasc), dn = o.fd - 0.3;
  for (const c of Lt.cells){ const tri = [c[0], c[1], c[2]], cl = clipConvex(tri, P); if (cl.length < 3) continue;
    for (let k = 1; k < cl.length - 1; k++){ T3(RF, cl[0], cl[k], cl[k + 1]); T3(SF, ...[cl[0], cl[k], cl[k + 1]].map(p => [p[0], p[1] - dn, p[2]])); }
    const full = cl.length === 3 && Math.abs(cl[0][0] - tri[0][0]) + Math.abs(cl[1][0] - tri[1][0]) + Math.abs(cl[2][0] - tri[2][0]) < 0.01;
    const k = full ? o.sky(c[3], c[4], c[5]) : 0;
    if (k > 0){ const cx = (tri[0][0] + tri[1][0] + tri[2][0])/3, cy = (tri[0][1] + tri[1][1] + tri[2][1])/3, cz = (tri[0][2] + tri[1][2] + tri[2][2])/3;
      const S = tri.map(p => [cx + (p[0] - cx)*k, cy + (p[1] - cy)*k + 0.35, cz + (p[2] - cz)*k]);
      T3(SK, S[0], S[1], S[2]); const RM = B.p(o.fasc); for (let m = 0; m < 3; m++){ const p = S[m], q = S[(m + 1) % 3]; Q(RM, [p[0], p[1] - 0.4, p[2]], [q[0], q[1] - 0.4, q[2]], q, p); } } }
  // fascia round the roof edge (sampled every ~2 m so it follows the facets)
  const E = [], Fb = [];
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.ceil(L/2));
    for (let k = 0; k < m; k++){ const t = k/m; E.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]); } }
  for (let i = 0; i < E.length; i++){ const p = E[i], q = E[(i + 1) % E.length], yp = Lt.rh(p[0], p[1]), yq = Lt.rh(q[0], q[1]);
    Q(FA, [p[0], yp - o.fd, p[1]], [q[0], yq - o.fd, q[1]], [q[0], yq + 0.15, q[1]], [p[0], yp + 0.15, p[1]]); }
  // sloped glass wall under the overhang, cassette mullions, soffit
  const Ft = offP(P, -o.ov), Fbt = offP(P, -o.ov - o.slope), G = B.p(o.glass), MU = B.p(o.mul), SO = B.p(o.soffit || o.fasc);
  for (let i = 0; i < Ft.length; i++){ const a = Ft[i], b = Ft[(i + 1) % Ft.length], a2 = Fbt[i], b2 = Fbt[(i + 1) % Ft.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.round(L/o.mw));
    for (let k = 0; k < m; k++){ const t0 = k/m, t1 = (k + 1)/m, p = [lerp(a[0], b[0], t0), lerp(a[1], b[1], t0)], q = [lerp(a[0], b[0], t1), lerp(a[1], b[1], t1)], p2 = [lerp(a2[0], b2[0], t0), lerp(a2[1], b2[1], t0)], q2 = [lerp(a2[0], b2[0], t1), lerp(a2[1], b2[1], t1)];
      const yp = Lt.rh(p[0], p[1]) - o.fd, yq = Lt.rh(q[0], q[1]) - o.fd;
      Q(G, [p2[0], 0, p2[1]], [q2[0], 0, q2[1]], [q[0], yq, q[1]], [p[0], yp, p[1]]);
      const n = enrm(a, b), d = k % 4 === 0 ? 0.7 : 0.3; Q(MU, [p2[0], 0, p2[1]], [p2[0] + n[0]*d, 0, p2[1] + n[1]*d], [p[0] + n[0]*d, yp, p[1] + n[1]*d], [p[0], yp, p[1]]);
      if (o.floors) for (const fy of o.floors){ if (fy > Math.min(yp, yq) - 1) continue; const tt = fy/Math.max(yp, 1), pp = [lerp(p2[0], p[0], tt), lerp(p2[1], p[1], tt)], qq = [lerp(q2[0], q[0], fy/Math.max(yq, 1)), lerp(q2[1], q[1], fy/Math.max(yq, 1))];
        Q(MU, [pp[0], fy - 0.25, pp[1]], [qq[0], fy - 0.25, qq[1]], [qq[0] + n[0]*0.25, fy + 0.25, qq[1] + n[1]*0.25], [pp[0] + n[0]*0.25, fy + 0.25, pp[1] + n[1]*0.25]); } } }
  // raised seams along every lattice edge (each type-0 cell owns its three edges once), clipped to the plan
  if (o.seam){ const SM = B.p(o.seam), w = o.sw || 0.35;
    for (const c of Lt.cells){ if (c[5]) continue; for (const [a, b] of [[c[0], c[1]], [c[0], c[2]], [c[1], c[2]]]){
      let t0 = 0, t1 = 1; for (let i = 0; i < P.length; i++){ const e0 = P[i], n = enrm(e0, P[(i + 1) % P.length]), da = (a[0] - e0[0])*n[0] + (a[2] - e0[1])*n[1], db = (b[0] - e0[0])*n[0] + (b[2] - e0[1])*n[1];
        if (da > 0 && db > 0){ t0 = 1; t1 = 0; break; } if (da > 0) t0 = Math.max(t0, da/(da - db)); else if (db > 0) t1 = Math.min(t1, da/(da - db)); }
      if (t1 - t0 < 0.02) continue; const p = [lerp(a[0], b[0], t0), lerp(a[1], b[1], t0), lerp(a[2], b[2], t0)], q = [lerp(a[0], b[0], t1), lerp(a[1], b[1], t1), lerp(a[2], b[2], t1)];
      const dx = q[0] - p[0], dz = q[2] - p[2], L = Math.hypot(dx, dz) || 1, nx = -dz/L*w, nz = dx/L*w;
      Q(SM, [p[0] + nx, p[1] + 0.05, p[2] + nz], [q[0] + nx, q[1] + 0.05, q[2] + nz], [q[0], q[1] + 0.3, q[2]], [p[0], p[1] + 0.3, p[2]]);
      Q(SM, [p[0], p[1] + 0.3, p[2]], [q[0], q[1] + 0.3, q[2]], [q[0] - nx, q[1] + 0.05, q[2] - nz], [p[0] - nx, p[1] + 0.05, p[2] - nz]); } } }
  // terrace paving under the overhang + plinth
  const PV = B.p(o.pave || C.pave); cap(PV, P, 0.08); wall(B.p(C.concD), P, -3, 0.08);
  return {P, Lt, Ft, Fbt};
}
// ---- common landmark wrapper ----
const LT = {m:0, c:'#fff0d8', k:0.3, e:0.4};
function key(k, zh, en, h, label, fn, extra){
  const D = HQD[k];
  LANDMARKS[k] = Object.assign({zh, en, cat:'new', r:10, h, lt:Object.assign({}, LT), build(){ const g = new THREE.Group(), B = mkB(), r = LMCTX.rng; fn(B, D, r, g); B.flush(g); return g; }}, label === false ? {label:false} : {}, extra || {});
  // r = the furthest footprint vertex + margin
  let R = 0; for (const b of D.b) for (const p of b.r) R = Math.max(R, Math.hypot(p[0], p[1])); LANDMARKS[k].r = Math.ceil(R + 12);
  SG_PLACES.push({type:k, lat:D.lat, lon:D.lon, rot:0});
}
const ring = (D, i) => D.b[i].r;

// =====================================================================================================================
// NVIDIA: Voyager (2022, north) with the solar trellis park, and Endeavor (2018, south) — Gensler; faceted triangular roofs
// =====================================================================================================================
const NV = {glass:{c:'#5d6b74', m:1, fh:4.6, cw:2.44, lk:0.12}, roof:'#3d4146', sky:{c:'#c9d6dc', glow:'#ffd9a2', gk:0.55}, fasc:'#2f3236', mul:'#45494e', seam:'#53585e', soffit:{c:'#cfcdc7', glow:'#ffe6c4', gk:0.18}};
key('svnvidia', '英伟达总部', 'NVIDIA headquarters (Endeavor & Voyager)', 33, true, (B, D, r) => {
  const P = orient(ring(D, 0)), ang = mainAng(hullP(P));
  // Voyager: 70 ft (21.3 m) triangular grid, roof rippling ~9 m, cantilever > 9 m beyond the sloped glass, 4 levels inside
  const R0 = triRoofBuilding(B, P, {s:21.3, ang, ov:8.5, slope:1.8, fd:1.6, mw:2.44, floors:[5.2, 10.0, 14.8],
    hf:(i, j, x, z) => 26 + 3.6*Math.sin(x*0.021 + z*0.012 + 0.6) + 2.6*Math.sin(z*0.029 - x*0.008 + 1.9) + (((i + j) % 2) ? 0.6 : -0.6),
    sky:(i, j, t) => { const hsh = Math.abs(Math.sin(i*12.9898 + j*78.233 + t*37.719)*43758.5453) % 1; return hsh < 0.5 ? 0.3 + hsh*0.3 : 0; },
    glass:NV.glass, roof:NV.roof, skyc:NV.sky, fasc:NV.fasc, mul:NV.mul, seam:NV.seam, sw:0.45, soffit:NV.soffit}, r);
  // exposed buckling-restrained brace frames on the glass (chevrons, dark steel)
  const Ft = R0.Ft, Fb = R0.Fbt, ST = B.p(NV.fasc);
  for (let i = 0; i < Ft.length; i++){ const a = Ft[i], b = Ft[(i + 1) % Ft.length], a2 = Fb[i], b2 = Fb[(i + 1) % Ft.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 30) continue;
    const n = enrm(a, b), m = Math.floor(L/21.3);
    for (let k = 1; k < m; k += 2){ const t0 = (k - 0.5)/m, t1 = (k + 0.5)/m, tm = k/m, o2 = 0.6;
      const pB0 = [lerp(a2[0], b2[0], t0) + n[0]*o2, 0, lerp(a2[1], b2[1], t0) + n[1]*o2], pB1 = [lerp(a2[0], b2[0], t1) + n[0]*o2, 0, lerp(a2[1], b2[1], t1) + n[1]*o2];
      const ym = 10.5, fm = 10.5/17, pm = [lerp(lerp(a2[0], b2[0], tm), lerp(a[0], b[0], tm), fm) + n[0]*o2, ym, lerp(lerp(a2[1], b2[1], tm), lerp(a[1], b[1], tm), fm) + n[1]*o2];
      segP(ST, pB0, pm, 0.3, 4); segP(ST, pB1, pm, 0.3, 4); } }
  // the solar trellis park between the buildings: branching steel "trees" carrying a triangular frame of PV panels, two raised tree houses
  const T = orient(ring(D, 1)), Th = hullP(T), hT = 9.6, PVc = B.p({c:'#262d38', ds:true}), FR = B.p(NV.seam), TL = lattice(Th, 7.2, ang, () => hT);
  for (const c of TL.cells){ const cl = clipConvex([c[0], c[1], c[2]], Th); if (cl.length < 3) continue; const cx = (cl[0][0] + cl[1][0] + cl[2][0])/3, cz = (cl[0][2] + cl[1][2] + cl[2][2])/3;
    if (((c[3]*7 + c[4]*3 + c[5]) % 5) !== 0){ const k = 0.86; for (let m = 1; m < cl.length - 1; m++) T3(PVc, ...[cl[0], cl[m], cl[m + 1]].map(p => [cx + (p[0] - cx)*k, hT + 0.25, cz + (p[2] - cz)*k])); }
    for (let m = 0; m < cl.length; m++) if ((m + c[5]) % 3 === 0) segP(FR, [cl[m][0], hT, cl[m][2]], [cl[(m + 1) % cl.length][0], hT, cl[(m + 1) % cl.length][2]], 0.13, 4); }
  wall(FR, offP(Th, 0.1), hT - 0.5, hT + 0.3);
  const pl = pole(Th), cols = [];
  for (let k = 0; k < 7; k++){ const a = k/7*TAU + 0.3, rr = pl[2]*(k % 2 ? 0.55 : 0.8), x = pl[0] + Math.cos(a)*rr, z = pl[1] + Math.sin(a)*rr; if (inP(Th, x, z)) cols.push([x, z]); }
  cols.push([pl[0], pl[1]]);
  for (const [x, z] of cols){ segP(FR, [x, -0.5, z], [x, 5.2, z], 0.35, 6); for (let m = 0; m < 4; m++){ const a = m/4*TAU + 0.4, e = [x + Math.cos(a)*5.5, hT - 0.2, z + Math.sin(a)*5.5]; segP(FR, [x, 5.2, z], e, 0.2, 4); } }
  const WD = B.p('#8b6f52'), GL = B.p(NV.glass);
  for (const [k, sg] of [[0.45, 1], [0.45, -1]]){ const x = pl[0] + Math.cos(ang)*pl[2]*k*sg, z = pl[1] + Math.sin(ang)*pl[2]*k*sg;
    for (const [dx, dz] of [[-2.2, -1.6], [2.2, -1.6], [2.2, 1.6], [-2.2, 1.6]]) segP(FR, [x + dx, -0.3, z + dz], [x + dx, 4.0, z + dz], 0.14, 4);
    boxB(WD, x, 4.0, z, 6.2, 0.4, 4.8, ang); boxB(GL, x, 4.4, z, 5.6, 2.8, 4.2, ang); boxB(WD, x, 7.2, z, 6.4, 0.35, 5.0, ang);
    for (let s = 0; s < 8; s++) boxB(WD, x - Math.cos(ang)*(3.6 + s*0.9)*sg, 0.5*s, z - Math.sin(ang)*(3.6 + s*0.9)*sg, 0.9, 0.12, 1.4, ang); }
  plate(B, offP(T, -0.5), C.lawn, -0.25);
  // the park between Voyager and Endeavor: lawns and the tree-lined walkway (Endeavor's plan from its own key)
  const DB = HQD.svnvidia_b, ox = DB.c[0] - D.c[0], oz = DB.c[1] - D.c[1], EN = orient(DB.b[0].r.map(p => [p[0] + ox, p[1] + oz])), VB = bbox(R0.P), EB = bbox(EN);
  const gap = [[Math.max(VB[0], EB[0]) + 10, VB[3] - 30], [Math.min(VB[2], EB[2]) - 10, VB[3] - 30], [Math.min(VB[2], EB[2]) - 10, EB[1] + 30], [Math.max(VB[0], EB[0]) + 10, EB[1] + 30]];
  let nt = 0; for (let k = 0; k < 900 && nt < 60; k++){ const x = lerp(gap[0][0], gap[1][0], r()), z = lerp(gap[0][1], gap[2][1], r());
    if (inP(R0.P, x, z) || inP(EN, x, z) || dEdge(R0.P, x, z) < 6 || dEdge(EN, x, z) < 32 || inP(Th, x, z) || dEdge(Th, x, z) < 3) continue; treeB(B, x, z, 1.0, nt % 4 ? 'oak' : 'red', r); nt++; }
}, {lt:{m:0, c:'#fff0d8', k:0.25, e:0.4}});
key('svnvidia_b', '英伟达总部 Endeavor', 'NVIDIA Endeavor', 24, false, (B, D, r) => {
  const P = orient(ring(D, 0)), ang = mainAng(hullP(P));
  // Endeavor: two storeys under one undulating geodesic roof of triangular facets, the facets angled up and down at the edge
  triRoofBuilding(B, P, {s:15.2, ang, ov:5.0, slope:1.2, fd:1.3, mw:2.44, floors:[5.6],
    hf:(i, j, x, z) => 17.5 + 3.2*Math.cos(x*0.016 - 0.4)*Math.cos(z*0.014 + 0.3) + (((i + 2*j) % 3) === 0 ? 2.6 : ((i + 2*j) % 3 === 1 ? -1.4 : 0.4)),
    sky:(i, j, t) => { const hsh = Math.abs(Math.sin(i*12.9898 + j*78.233 + t*37.719)*43758.5453) % 1; return hsh < 0.9 ? 0.26 + hsh*0.12 : 0; },
    glass:NV.glass, roof:NV.roof, skyc:NV.sky, fasc:NV.fasc, mul:NV.mul, seam:NV.seam, sw:0.3, soffit:NV.soffit}, r);
});

// =====================================================================================================================
// Intel: the Robert Noyce Building (six storeys, ribbon windows between light precast bands) with SC9 and Garage B; Garage A
// =====================================================================================================================
const IN = {glass:{c:'#435059', m:1, fh:3.9, cw:1.6, lk:0.12}, sp:'#d9d5cc', cap:'#cdc8be'};
key('svintel', '英特尔总部（罗伯特·诺伊斯大楼）', 'Intel headquarters (Robert Noyce Building)', 29, true, (B, D, r) => {
  const N = office(B, ring(D, 0), {h:24.2, fl:6, g0:4.7, style:'band', sh:0.95, glass:IN.glass, sp:IN.sp, cap:IN.cap, piers:9, sill:1.0, par:1.3}, r);
  garage(B, ring(D, 1), {h:13.4, lv:4, conc:'#cfcac0'}, r);
  campusTrees(B, D, 20, ['oak', 'plane', 'red'], r);
  // entrance plaza with trees on the street side of the Noyce Building
  const pl = pole(N); for (let k = 0; k < 14; k++){ const a = k/14*TAU, x = pl[0] + Math.cos(a)*(pl[2] + 16), z = pl[1] + Math.sin(a)*(pl[2] + 16); if (z < pl[1] - 4 && !inP(N, x, z) && dEdge(N, x, z) > 5) treeB(B, x, z, 1.0, 'oak', r); }
});
key('svintel_c', '英特尔 SC9 楼', 'Intel SC9', 14, false, (B, D, r) => {
  office(B, ring(D, 0), {h:8.6, fl:2, g0:4.3, style:'band', sh:1.3, glass:IN.glass, sp:IN.sp, cap:IN.cap, sill:0.9, par:1.0, sch:2.6, pv:true}, r);
});
key('svintel_b', '英特尔总部 A 停车楼', 'Intel headquarters Garage A', 20, false, (B, D, r) => { garage(B, ring(D, 0), {h:12.4, lv:4, conc:'#cfcac0'}, r); });

// =====================================================================================================================
// AMD: 2485 Augustine Drive, Santa Clara Square office (six storeys, glass with light horizontal bands) + sister buildings
// =====================================================================================================================
const AM = {glass:{c:'#56646c', m:1, fh:4.1, cw:1.5, lk:0.12}, sp:'#e6e6e2', mul:'#b9bdbf'};
key('svamd', '超威半导体（AMD）总部', 'AMD headquarters', 30, true, (B, D, r) => {
  for (let i = 0; i < 2; i++) office(B, ring(D, i), {h:25.4, fl:6, g0:4.9, style:'curtain', glass:AM.glass, sp:AM.sp, mul:AM.mul, mw:1.52, major:5, fin:0.35, par:1.2, arcade:4.5, lobby:false}, r);
  campusTrees(B, D, 12, ['oak', 'plane'], r);
});
key('svamd_b', '圣克拉拉广场办公楼', 'Santa Clara Square offices', 30, false, (B, D, r) => {
  for (let i = 0; i < 4; i++) office(B, ring(D, i), {h:i === 3 ? 25.0 : 25.2, fl:6, g0:4.9, style:'curtain', glass:AM.glass, sp:AM.sp, mul:AM.mul, mw:1.52, major:5, fin:0.35, par:1.2, arcade:i === 3 ? 0 : 4.5, lobby:false}, r);
  office(B, ring(D, 4), {h:10.5, fl:2, g0:5, style:'curtain', glass:AM.glass, sp:AM.sp, mul:AM.mul, mw:1.52, par:1.0, sch:2.4}, r);
  garage(B, ring(D, 5), {h:13.3, lv:5, conc:'#d6d3cc', pv:true}, r);
  campusTrees(B, D, 34, ['oak', 'plane'], r);
});

// =====================================================================================================================
// Applied Materials: Bowers Avenue campus — Building 1 (3050 Bowers), Building 2, Building 12 and the garage
// =====================================================================================================================
const AP = {glass:{c:'#3f4b52', m:1, fh:4.1, cw:1.6, lk:0.12}, sp:'#d3cbbd', cap:'#c8c0b1'};
key('svamat', '应用材料公司总部', 'Applied Materials headquarters', 30, true, (B, D, r) => {
  office(B, ring(D, 0), {h:21.6, fl:5, g0:5.0, style:'band', sh:1.5, glass:AP.glass, sp:AP.sp, cap:AP.cap, sill:1.0, piers:12}, r);
  office(B, ring(D, 1), {h:25.0, fl:6, g0:5.0, style:'band', sh:1.5, glass:AP.glass, sp:AP.sp, cap:AP.cap, sill:1.0, piers:12}, r);
  garage(B, ring(D, 2), {h:13.3, lv:4, conc:'#cdc6b8'}, r);
  office(B, ring(D, 3), {h:5.5, fl:1, g0:5.5, style:'band', glass:AP.glass, sp:AP.sp, cap:AP.cap, sill:1.0, par:0.8, screen:false, lobby:false}, r);
  office(B, ring(D, 4), {h:25.6, fl:6, g0:5.2, style:'band', sh:1.5, glass:AP.glass, sp:AP.sp, cap:AP.cap, sill:1.0, piers:12}, r);
  campusTrees(B, D, 30, ['oak', 'red', 'plane'], r);
});

// =====================================================================================================================
// Palo Alto Networks: 3000 Tannery Way — three eight-storey glass towers (Gensler, 2017), the two-storey amenity building, two garages
// =====================================================================================================================
const PA = {glass:{c:'#5b6a74', m:1, fh:4.2, cw:1.5, lk:0.12}, sp:'#eceeee', mul:'#c7cbcd'};
key('svpanw', '派拓网络总部', 'Palo Alto Networks headquarters', 40, true, (B, D, r) => {
  const T = [];
  for (let i = 0; i < 3; i++) T.push(office(B, ring(D, i), {h:34.2, fl:8, g0:4.8, style:'curtain', glass:PA.glass, sp:PA.sp, mul:PA.mul, mw:1.5, major:6, fin:0.4, par:1.5, sch:4.2, blades:0.9}, r));
  T.push(office(B, ring(D, 3), {h:9.6, fl:2, g0:5.0, style:'curtain', glass:PA.glass, sp:PA.sp, mul:PA.mul, mw:1.5, par:1.0, sch:2.4}, r));
  garage(B, ring(D, 4), {h:12.6, lv:5, conc:'#d2d0ca', pv:true}, r);
  garage(B, ring(D, 5), {h:11.2, lv:4, conc:'#d2d0ca', pv:true}, r);
  // the central court between the towers: lawn and trees
  const [x0, z0, x1, z1] = bbox([].concat(...T.slice(0, 3)));
  plate(B, [[x0 + 6, z0 + 6], [x1 - 6, z0 + 6], [x1 - 6, z1 - 6], [x0 + 6, z1 - 6]].map(p => [p[0], p[1]]), C.lawn, -0.3);
  campusTrees(B, D, 46, ['oak', 'plane', 'red'], r);
});

// =====================================================================================================================
// ServiceNow: 2225 Lawson Lane (the two linked three-storey buildings round a court + garage) and the curved five-storey pair
// =====================================================================================================================
const SN = {glass:{c:'#4e5b63', m:1, fh:4.2, cw:1.5, lk:0.12}, sp:'#d4d0c6', mul:'#a7abad', cap:'#c9c4b9'};
key('svservicenow', 'ServiceNow 总部', 'ServiceNow headquarters', 28, true, (B, D, r) => {
  // 2215 / 2225 Lawson Lane (Lawson Lane East, 2013): two curved five-storey buildings in glass and precast concrete, the five-level garage
  for (let i = 0; i < 2; i++) office(B, ring(D, i), {h:22.6, fl:5, g0:5.0, style:'band', sh:1.0, glass:SN.glass, sp:SN.sp, cap:SN.cap, sill:0.9, piers:7.5, par:1.3}, r);
  garage(B, ring(D, 2), {h:15.5, lv:5, pv:true}, r);
  campusTrees(B, D, 18, ['oak', 'plane'], r);
});
key('svservicenow_b', 'ServiceNow 劳森巷西园区', 'ServiceNow Lawson Lane West', 28, false, (B, D, r) => {
  // Lawson Lane West (2022): two five-storey glass buildings round a court (the north one with its two-storey amenity wing) and the garage (six levels above grade)
  const A = office(B, ring(D, 0), {h:22.6, fl:5, g0:5.0, style:'curtain', glass:SN.glass, sp:'#e3e1dc', mul:'#b4b8ba', mw:1.5, major:4, fin:0.4, par:1.3, pv:true}, r);
  const A2 = office(B, ring(D, 1), {h:22.6, fl:5, g0:5.0, style:'curtain', glass:SN.glass, sp:'#e3e1dc', mul:'#b4b8ba', mw:1.5, major:4, fin:0.4, par:1.3, pv:true}, r);
  garage(B, ring(D, 2), {h:18.4, lv:6}, r);
  campusTrees(B, D, 22, ['oak', 'plane'], r, 0.95, 6);
});

// =====================================================================================================================
// Amazon Lab126: Moffett Towers (Jay Paul) — faceted eight-storey towers in glass and limestone, the long garages
// =====================================================================================================================
const LB = {glass:{c:'#566770', m:1, fh:4.3, cw:1.5, lk:0.14}, sp:'#d9cfbb', mul:'#c9bea8', stone:'#d6cbb5', canopy:'#c3c3bd'};
function moffett(B, Pr, h, r){
  const P = office(B, Pr, {h, fl:8, g0:5.2, style:'curtain', glass:LB.glass, sp:LB.sp, mul:LB.mul, mw:1.55, major:4, fin:0.4, par:1.6, sch:4.0, cap:LB.stone}, r);
  // limestone frames: two-storey base piers and full-height stone fins at every corner
  const S = B.p(LB.stone);
  for (const p of P) boxB(S, p[0], 0, p[1], 1.6, h + 2.2, 1.6, 0);
  ringBand(S, P, 0.3, 0, 1.2);
  ringBand(S, P, 0.25, 9.3, 10.1);
  // thin roof canopy overhanging the top floor
  const RC = B.p(LB.canopy); const O = offP(P, 2.4); cap(RC, O, h + 1.0); wall(RC, O, h + 0.4, h + 1.0); cap(RC, O, h + 0.4);
  return P;
}
key('svlab126', '亚马逊 Lab126 园区（莫菲特塔）', 'Amazon Lab126 campus (Moffett Towers)', 40, true, (B, D, r) => {
  const T = [];
  for (let i = 0; i < 4; i++) T.push(moffett(B, ring(D, i), 34.6, r));
  garage(B, ring(D, 4), {h:12.8, lv:4, conc:'#d5cfc2'}, r);
  garage(B, ring(D, 5), {h:12.8, lv:4, conc:'#d5cfc2'}, r);
  // the landscaped strip between the towers and the garages
  campusTrees(B, D, 44, ['red', 'oak', 'oak'], r, 1.0, 6);
});
key('svlab126_b', '莫菲特塔', 'Moffett Towers', 40, false, (B, D, r) => { moffett(B, ring(D, 0), 34.6, r); });

// =====================================================================================================================
// Synopsys: 675 Almanor Avenue (four storeys, 2020, roof terrace) and its five-level garage; the older Synopsys buildings south of Almanor
// =====================================================================================================================
const SY = {glass:{c:'#55636b', m:1, fh:4.2, cw:1.5, lk:0.12}, sp:'#d9d9d6', mul:'#8f9496', panel:'#b8b4ab'};
key('svsynopsys', '新思科技总部', 'Synopsys headquarters', 24, true, (B, D, r) => {
  const P = office(B, ring(D, 0), {h:17.6, fl:4, g0:5.0, style:'curtain', glass:SY.glass, sp:SY.sp, mul:SY.mul, mw:1.55, major:3, fin:0.4, par:1.2, sch:3.2}, r);
  // roof terrace: a timber deck with planters and a pergola on one end of the roof
  const ang = mainAng(P), pl = pole(P), ca = Math.cos(ang), sa = Math.sin(ang), x = pl[0] + ca*pl[2]*0.9, z = pl[1] + sa*pl[2]*0.9;
  if (inP(P, x, z)){ boxB(B.p('#9a7b5c'), x, 17.65, z, 16, 0.25, 11, ang); for (let k = -2; k <= 2; k++) boxB(B.p(SY.mul), x + ca*k*3.6, 17.9, z + sa*k*3.6, 0.3, 3.0, 10, ang);
    boxB(B.p(SY.mul), x, 20.9, z, 16, 0.3, 10.5, ang); for (let k = 0; k < 4; k++) treeB(B, x + ca*(k - 1.5)*4.2 - sa*6.2, z + sa*(k - 1.5)*4.2 + ca*6.2, 0.45, 'oak', r, 17.6); }
  garage(B, ring(D, 1), {h:15.3, lv:5, conc:'#d0ccc3'}, r);
  campusTrees(B, D, 8, ['red', 'oak'], r);
});
key('svsynopsys_b', '新思科技园区', 'Synopsys campus', 26, false, (B, D, r) => {
  office(B, ring(D, 0), {h:21.4, fl:5, g0:5.0, style:'curtain', glass:SY.glass, sp:SY.sp, mul:SY.mul, mw:1.55, major:3, fin:0.4, par:1.2}, r);
  office(B, ring(D, 1), {h:9.2, fl:2, g0:4.8, style:'band', sh:1.2, glass:SY.glass, sp:SY.sp, sill:0.9, piers:9, par:1.0, sch:2.4}, r);
  garage(B, ring(D, 2), {h:11.7, lv:4, conc:'#d0ccc3'}, r);
  office(B, ring(D, 3), {h:9.2, fl:2, g0:4.8, style:'band', sh:1.2, glass:SY.glass, sp:SY.sp, sill:0.9, piers:9, par:1.0, sch:2.4, pv:true}, r);
  campusTrees(B, D, 26, ['red', 'oak'], r);
});
}
