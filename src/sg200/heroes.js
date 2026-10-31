// Fine rebuilds of the hero-tier landmarks. Loaded after engine.js, so it only
// replaces those build functions. Medium-tier entries are left alone.
// No lettering. Each model follows a published photo of that building.
{
const BY = {}; for (const it of SG200) BY[it.k] = it;
const PI = Math.PI;
const ctr = P => { let x=0,z=0; for (const p of P){ x+=p[0]; z+=p[1]; } return [x/P.length, z/P.length]; };
const scaleRing = (P,s,c) => P.map(p => [c[0]+(p[0]-c[0])*s, c[1]+(p[1]-c[1])*s]);
function frame(P){
  const c = ctr(P); let xx=0,zz=0,xz=0;
  for (const p of P){ const x=p[0]-c[0], z=p[1]-c[1]; xx+=x*x; zz+=z*z; xz+=x*z; }
  const base = 0.5*Math.atan2(2*xz, xx-zz);
  const measure = ang => {
    const co=Math.cos(ang), si=Math.sin(ang); let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;
    for (const p of P){ const x=p[0]-c[0], z=p[1]-c[1], u=x*co+z*si, v=-x*si+z*co;
      if (u<u0) u0=u; if (u>u1) u1=u; if (v<v0) v0=v; if (v>v1) v1=v; }
    return {co, si, u0, u1, v0, v1, du:u1-u0, dv:v1-v0};
  };
  let F = measure(base); if (F.dv > F.du) F = measure(base + PI/2);
  F.c = c; F.W = (u,v) => [c[0] + u*F.co - v*F.si, c[1] + u*F.si + v*F.co];
  return F;
}
function arch(hw, ht){
  const rise = Math.min(hw*0.95, ht*0.55), P=[[-hw,0],[hw,0],[hw, ht-rise]];
  for (let i=0;i<=7;i++){ const a=PI*(1-i/7); P.push([Math.cos(a)*hw, ht-rise+Math.sin(a)*rise]); }
  P.push([-hw, ht-rise]); return P;
}
// F(across, up, out) -> [x,y,z]. Draw a filled arch and its rim.
function paintArch(g, F, across, yb, hw, ht, hole, rim, rimC, holeC){
  const pts = arch(hw, ht), oH=[], oR=[];
  const push=(o, w)=>{ for (let i=1;i<pts.length-1;i++){ const A=F(across+pts[0][0], yb+pts[0][1], w), B=F(across+pts[i][0], yb+pts[i][1], w), C=F(across+pts[i+1][0], yb+pts[i+1][1], w); o.push(A[0],A[1],A[2], B[0],B[1],B[2], C[0],C[1],C[2]); } };
  push(oH, 0.06); push(oR, 0.22);
  LTris(g, oH, holeC); LTris(g, oR, rimC);
}
function faceU(F, u, sign){ return (across, y, w) => { const q=F.W(u + sign*(w||0), across); return [q[0], y, q[2] === undefined ? q[1] : q[1]]; }; }
// W returns [x,z]. face returns [x,y,z].
function faceAlongU(F, u, sign){ return (v, y, w) => { const q = F.W(u + sign*(w||0), v); return [q[0], y, q[1]]; }; }
function faceAlongV(F, v, sign){ return (u, y, w) => { const q = F.W(u, v + sign*(w||0)); return [q[0], y, q[1]]; }; }
const farPt = P => { const c=ctr(P); let b=P[0], d=0; for (const p of P){ const q=Math.hypot(p[0]-c[0], p[1]-c[1]); if (q>d){ d=q; b=p; } } return b; };
function setBuild(k, h, lt, fn){ const L = LANDMARKS[k]; if (!L) return; L.h = h; L.lt = lt; L.cat = 'old'; L.build = fn; }
const WARM = {m:0, c:'#ffd7a6', k:0.85, e:0.4};
const BRICK = {c:'#8d4e3c', m:0, lk:0.35, ds:true};
const CREAM = {c:'#f4efe4', m:0, lk:0.55, ds:true};
const WHITE = {c:'#f7f4ee', m:0, lk:0.6, ds:true};
const BLUEW = {c:'#d7e4ee', m:0, lk:0.4, ds:true};
const DARK = {c:'#1b2430', glow:'#ffd9a6', gk:0.25, m:0, ds:true};
const STAIN = {c:'#1c3a32', glow:'#9dffc2', gk:0.45, m:0, ds:true};
const GOLD = {c:'#e2b23c', glow:'#ffd56a', gk:1.15, m:0, ds:true};
const MINT = {c:'#c5ddd0', m:0, lc:'#e7fff4', lk:0.55, ds:true};
const MINT2 = {c:'#9fc9b6', m:0, lk:0.4, ds:true};
const REDR = {c:'#8d3a32', m:0, lk:0.35, ds:true};
const GREY = {c:'#c5c0b6', m:0, lk:0.3, ds:true};
const GLASS = {c:'#8e9ea6', m:1, fh:3.6, cw:2.8, ds:true};

// Wesley Methodist: red-brick Gothic tower with cream tracery, pinnacles and a lit nave.
setBuild('s2001', 32, WARM, function(){
  const it = BY.s2001, g = new THREE.Group(), P = it.P, F = frame(P);
  const uc=(F.u0+F.u1)/2, vc=(F.v0+F.v1)/2;
  LPoly(g, P, 0, 1.4, BRICK);
  const nave = [F.W(uc-18, vc-7), F.W(uc+14, vc-7), F.W(uc+14, vc+7), F.W(uc-18, vc+7)];
  LPoly(g, nave, 0, 14, BRICK);
  LPoly(g, scaleRing(nave, 1.04, ctr(nave)), 13.2, 0.7, CREAM);
  const side = faceAlongV(F, vc+7, 1);
  for (const u of [uc-12, uc-4, uc+4]) paintArch(g, side, u, 2.2, 1.5, 8.5, 0.15, 0.02, CREAM, STAIN);
  // square tower at the east end of the nave
  const tx = uc+14, tz = vc;
  LBox(g, 8.2, 22, 8.2, F.W(tx, tz)[0], 0, F.W(tx, tz)[1], BRICK);
  LBox(g, 8.6, 1.2, 8.6, F.W(tx, tz)[0], 21.2, F.W(tx, tz)[1], CREAM);
  const tf = faceAlongU(F, tx+4.1, 1);
  paintArch(g, tf, tz, 6, 1.3, 9, 0.2, 0.02, CREAM, STAIN);
  paintArch(g, tf, tz, 16.5, 0.9, 4.2, 0.2, 0.02, CREAM, STAIN);
  for (const dv of [-3.6, 3.6]) for (const du of [-3.6, 3.6]){
    const q = F.W(tx+du, tz+dv);
    LCone(g, 0.7, 5.5, q[0], 22, q[1], CREAM, 6);
  }
  return g;
});

// Saints Peter and Paul: white Gothic front, three porch arches, rose window, dark spire.
setBuild('s2003', 30, WARM, function(){
  const it = BY.s2003, g = new THREE.Group(), P = it.P, F = frame(P), c = ctr(P);
  const uc=(F.u0+F.u1)/2, vc=(F.v0+F.v1)/2, hw=Math.min(11, F.dv*0.42), len=Math.min(28, F.du*0.7);
  const u0=uc-len*0.45, u1=uc+len*0.55;
  const nave=[F.W(u0,vc-hw), F.W(u1,vc-hw), F.W(u1,vc+hw), F.W(u0,vc+hw)];
  LPoly(g, nave, 0, 12, WHITE);
  // gable
  const ridge = F.W((u0+u1)/2, vc);
  LTris(g, [F.W(u0,vc-hw)[0],12,F.W(u0,vc-hw)[1], F.W(u0,vc+hw)[0],12,F.W(u0,vc+hw)[1], ridge[0],16.5,ridge[1],
    F.W(u1,vc-hw)[0],12,F.W(u1,vc-hw)[1], ridge[0],16.5,ridge[1], F.W(u1,vc+hw)[0],12,F.W(u1,vc+hw)[1]], {c:'#d9d3c6', m:0, ds:true});
  const front = faceAlongU(F, u1, 1);
  for (const v of [vc-4.2, vc, vc+4.2]){
    paintArch(g, front, v, 0.4, 1.7, 6.2, 0.35, 0.05, CREAM, DARK);
    const col = F.W(u1+0.3, v-2.1); LCyl(g, 0.38, 0.48, 6.2, col[0], 0, col[1], GREY, 8);
  }
  const colR = F.W(u1+0.3, vc+4.2+2.1); LCyl(g, 0.38, 0.48, 6.2, colR[0], 0, colR[1], GREY, 8);
  // rose window
  LCyl(g, 1.7, 1.7, 0.35, F.W(u1+0.4, vc)[0], 8.2, F.W(u1+0.4, vc)[1], DARK, 16).rotation.z = PI/2;
  // tower and spire
  const tp = F.W(u1-2.2, vc);
  LBox(g, 6.4, 14, 6.4, tp[0], 10, tp[1], WHITE);
  for (const s of [-1, 1]){ const q=F.W(u1-2.2, vc+s*2.6); LCone(g, 0.45, 3.2, q[0], 24, q[1], WHITE, 5); }
  LCone(g, 2.3, 12, tp[0], 24, tp[1], {c:'#3a4148', m:0, ds:true}, 8);
  LCyl(g, 0.08, 0.08, 2.2, tp[0], 36, tp[1], CREAM, 4);
  const long = faceAlongV(F, vc+hw, 1);
  for (let u=u0+4; u<u1-4; u+=5.5) paintArch(g, long, u, 2, 1.15, 6.5, 0.2, 0.02, CREAM, STAIN);
  return g;
});

// Kum Yan: glass hall with a tall grey louver tower and a flat cap.
setBuild('s2004', 27, {m:1, c:'#d5e4ee', k:0.55}, function(){
  const it = BY.s2004, g = new THREE.Group(), P = it.P, c = ctr(P), F = frame(P);
  LPoly(g, P, 0, 12, GLASS);
  const bands = {c:'#d5dbe2', m:0, lk:0.45, ds:true};
  for (let y=3.2; y<12; y+=3.2) LPoly(g, scaleRing(P, 1.015, c), y, 0.28, bands);
  const q = F.W(F.u1-3, (F.v0+F.v1)/2);
  LBox(g, 5.2, 16, 5.2, q[0], 8, q[1], {c:'#b7b3aa', m:0, ds:true});
  LBox(g, 3.2, 12, 0.35, q[0], 10, q[1], {c:'#8d9398', m:0, ds:true});
  LBox(g, 7.2, 0.6, 7.2, q[0], 23.4, q[1], {c:'#9aa3a8', m:0, glow:'#e8f4ff', gk:0.4, ds:true});
  LBox(g, 3.4, 3.2, 3.4, q[0], 20.2, q[1], GLASS);
  return g;
});

// Masjid Omar Kampong Melaka: low white hall, red pitched roofs, cream minaret with a gold onion.
setBuild('s2006', 35, WARM, function(){
  const it = BY.s2006, g = new THREE.Group(), P = it.P, c = ctr(P);
  LPoly(g, P, 0, 5.5, WHITE);
  const roof = scaleRing(P, 0.55, c);
  const pos=[];
  for (let i=0;i<P.length;i++){ const a=P[i], b=P[(i+1)%P.length];
    pos.push(a[0],5.5,a[1], b[0],5.5,b[1], roof[Math.min(i, roof.length-1)][0], 9.2, roof[Math.min(i, roof.length-1)][1]); }
  LTris(g, pos, REDR);
  LPoly(g, scaleRing(P, 0.72, c), 8.6, 0.45, REDR);
  const m = farPt(P);
  LCyl(g, 1.7, 2.15, 18, m[0], 0, m[1], CREAM, 10);
  for (let y=4; y<16; y+=3.2) LCyl(g, 1.85, 1.85, 0.35, m[0], y, m[1], WHITE, 10);
  LCyl(g, 2.3, 2.3, 0.7, m[0], 17.6, m[1], CREAM, 10);
  LLathe(g, [[0.4,0],[1.5,0.4],[1.9,1.6],[1.3,3.2],[0.45,4.6],[0.08,5.4]].map(p=>[p[0],p[1]]), m[0], 18.2, m[1], GOLD, 16);
  return g;
});

// Masjid Bencoolen: mint-green hall, arched arcade, geometric upper windows, gold dome on the corner tower.
setBuild('s2007', 26, {m:0, c:'#e7fff2', k:0.7, e:0.35}, function(){
  const it = BY.s2007, g = new THREE.Group(), P = it.P, F = frame(P);
  const vc=(F.v0+F.v1)/2;
  LPoly(g, P, 0, 16, MINT);
  LPoly(g, scaleRing(P, 1.01, ctr(P)), 15.4, 0.7, MINT2);
  const front = faceAlongV(F, F.v1, 1);
  const n = Math.max(4, Math.round(F.du/6));
  for (let i=0;i<n;i++){ const u = F.u0 + F.du*(i+0.5)/n;
    paintArch(g, front, u, 0.6, 1.7, 4.4, 0.25, 0.02, WHITE, DARK);
    paintArch(g, front, u, 6.4, 1.35, 4.6, 0.2, 0.02, WHITE, DARK);
    paintArch(g, front, u, 11.4, 1.15, 3.6, 0.18, 0.02, WHITE, DARK);
  }
  const q = F.W(F.u0+5, F.v1-5);
  LBox(g, 8, 18, 8, q[0], 0, q[1], MINT);
  LDome(g, 3.6, q[0], 18, q[1], GOLD, 0.85, 18);
  LCyl(g, 0.15, 0.35, 2.4, q[0], 21.2, q[1], GOLD, 6);
  const q2 = F.W(F.u1-3, F.v0+3);
  LBox(g, 3.2, 20, 3.2, q2[0], 0, q2[1], MINT2);
  LDome(g, 1.5, q2[0], 20, q2[1], GOLD, 0.7, 12);
  return g;
});

// Sacred Heart: white neoclassical nave, columned pediment, tiered tower with blue-trimmed windows and a cupola.
setBuild('s2009', 34, WARM, function(){
  const it = BY.s2009, g = new THREE.Group(), P = it.P, F = frame(P);
  const vc=(F.v0+F.v1)/2, u0=F.u0+1, u1=F.u1-1, v0=F.v0+1, v1=F.v1-1;
  const nave=[F.W(u0,v0), F.W(u1,v0), F.W(u1,v1), F.W(u0,v1)];
  LPoly(g, nave, 0, 11, WHITE);
  LPoly(g, scaleRing(nave, 0.92, ctr(nave)), 11, 0.7, REDR);
  const side = faceAlongV(F, v1, 1);
  for (let u=u0+4; u<u1-6; u+=4.2) paintArch(g, side, u, 1.4, 1.15, 5.6, 0.22, 0.02, BLUEW, DARK);
  // portico at the tower end
  const uf = u1;
  for (let i=0;i<4;i++){ const v=v0+ (v1-v0)*(i+0.5)/4; const q=F.W(uf+1.2, v); LCyl(g, 0.45, 0.55, 8, q[0], 0, q[1], WHITE, 10); }
  const ped = [F.W(uf, v0+1), F.W(uf, v1-1), F.W(uf+0.4, vc)];
  LTris(g, [ped[0][0],8,ped[0][1], ped[1][0],8,ped[1][1], ped[2][0],12.4,ped[2][1]], WHITE);
  const tp = F.W(uf-3.2, vc);
  LBox(g, 7.2, 16, 7.2, tp[0], 8, tp[1], WHITE);
  LCyl(g, 3.1, 3.3, 8, tp[0], 24, tp[1], WHITE, 12);
  LCyl(g, 3.35, 3.35, 0.35, tp[0], 27.2, tp[1], BLUEW, 12);
  LDome(g, 2.6, tp[0], 32, tp[1], WHITE, 0.7, 14);
  LCyl(g, 0.08, 0.12, 2.4, tp[0], 33.6, tp[1], CREAM, 4);
  // blue window slits on the round stage
  return g;
});

// Chesed-El Synagogue: white two-storey classical block, arched openings, pediment, a band of red roof tiles.
setBuild('s2011', 18, WARM, function(){
  const it = BY.s2011, g = new THREE.Group(), P = it.P, F = frame(P), c = ctr(P);
  LPoly(g, P, 0, 12, WHITE);
  LPoly(g, scaleRing(P, 1.03, c), 5.6, 0.45, CREAM);
  LPoly(g, scaleRing(P, 1.02, c), 11.4, 0.7, CREAM);
  const front = faceAlongV(F, F.v1, 1);
  const n = Math.max(3, Math.round(F.du/5));
  for (let i=0;i<n;i++){ const u=F.u0+F.du*(i+0.5)/n;
    paintArch(g, front, u, 0.8, 1.3, 3.8, 0.2, 0.02, CREAM, DARK);
    paintArch(g, front, u, 6.6, 1.05, 3.4, 0.18, 0.02, CREAM, DARK);
  }
  const vc=(F.v0+F.v1)/2, uc=(F.u0+F.u1)/2;
  LTris(g, [F.W(uc-6, F.v1)[0],12,F.W(uc-6, F.v1)[1], F.W(uc+6, F.v1)[0],12,F.W(uc+6, F.v1)[1], F.W(uc, F.v1+0.2)[0],16.5,F.W(uc, F.v1+0.2)[1]], WHITE);
  LPoly(g, [F.W(uc-5, vc-3), F.W(uc+5, vc-3), F.W(uc+5, vc+3), F.W(uc-5, vc+3)], 11.6, 0.5, REDR);
  return g;
});

// Tan Si Chong Su: red columns, stone walls, a grey tiled roof with upturned eaves and a gold ridge.
setBuild('s2013', 16, {m:0, c:'#ffd0a0', k:0.9, e:0.45}, function(){
  const it = BY.s2013, g = new THREE.Group(), P = it.P, c = ctr(P);
  LPoly(g, scaleRing(P, 0.92, c), 0, 6.2, GREY);
  for (const p of P) LCyl(g, 0.42, 0.55, 6.4, p[0], 0, p[1], REDR, 8);
  const eave = scaleRing(P, 1.08, c), ridge = scaleRing(P, 0.35, c);
  const pos=[];
  for (let i=0;i<P.length;i++){
    const a=eave[i], b=eave[(i+1)%eave.length], r=ridge[i%eave.length] || ridge[ridge.length-1];
    const lift = (i%2)?1.4:0.2;
    pos.push(a[0],6.2+lift,a[1], b[0],6.2,b[1], c[0],11.5,c[1]);
  }
  LTris(g, pos, {c:'#6a6e72', m:0, ds:true});
  LCyl(g, 0.25, 0.25, 6, c[0], 8, c[1], GOLD, 6);
  for (const p of eave) LCone(g, 0.35, 1.3, p[0], 7.2, p[1], GOLD, 5);
  const front = P[0];
  LBox(g, 3.2, 4.2, 0.4, front[0], 0.4, front[1], REDR);
  return g;
});

const FIN = {c:'#f4f1ea', m:0, lk:0.5, ds:true};
const CONC = {c:'#b7b4ae', m:0, lk:0.25, ds:true};
const DARKF = {c:'#2a2e33', m:0, lk:0.2, ds:true};
const REDP = {c:'#c0392b', glow:'#ff6a4a', gk:0.7, m:0, ds:true};

// Singapore Chinese Cultural Centre: glass base, white finned hall, deep roof.
setBuild('s2002', 36, {m:1, c:'#f3efe6', k:0.45}, function(){
  const it = BY.s2002, g = new THREE.Group(), P = it.P, c = ctr(P), F = frame(P);
  LPoly(g, P, 0, 8, GLASS);
  LPoly(g, scaleRing(P, 0.86, c), 8, 20, FIN);
  const face = faceAlongV(F, F.v1 * 0.86, 1);
  for (let u = F.u0 + 2; u < F.u1 - 2; u += 2.4){
    const a = F.W(u, F.v1 * 0.9), b = F.W(u + 0.2, F.v1 * 0.9);
    LBox(g, 0.22, 18, 0.5, a[0], 9, a[1], FIN);
  }
  LPoly(g, scaleRing(P, 1.12, c), 27.2, 1.4, FIN);
  LPoly(g, scaleRing(P, 0.4, c), 8, 18, {c:'#8d2e2e', glow:'#ffb0a0', gk:0.6, m:0, ds:true});
  return g;
});

// Red Dot Design Museum: brick colonial hall plus the glass porch with red hanging screens.
setBuild('s2010', 12, WARM, function(){
  const it = BY.s2010, g = new THREE.Group(), P = it.P, c = ctr(P), F = frame(P);
  LPoly(g, P, 0, 7.5, BRICK);
  LPoly(g, scaleRing(P, 1.02, c), 7.2, 0.6, CREAM);
  const face = faceAlongV(F, F.v1, 1);
  const n = Math.max(3, Math.round(F.du / 5));
  for (let i = 0; i < n; i++) paintArch(g, face, F.u0 + F.du * (i + 0.5) / n, 1.2, 1.1, 4.2, 0, 0, CREAM, DARK);
  const tp = F.W((F.u0 + F.u1) / 2, (F.v0 + F.v1) / 2);
  LBox(g, 4.2, 6, 4.2, tp[0], 7, tp[1], BRICK);
  LBox(g, 4.8, 0.5, 4.8, tp[0], 12.6, tp[1], CREAM);
  // glass porch and the red mesh curtains, on the long front
  const porch = [F.W(F.u0 + 2, F.v1), F.W(F.u1 - 2, F.v1), F.W(F.u1 - 2, F.v1 + 6), F.W(F.u0 + 2, F.v1 + 6)];
  LPoly(g, porch, 0, 6.5, GLASS);
  LPoly(g, scaleRing(porch, 1.04, ctr(porch)), 6.2, 0.35, FIN);
  for (let i = 0; i < 5; i++){
    const u = F.u0 + 4 + (F.du - 8) * i / 4;
    const q = F.W(u, F.v1 + 3);
    LBox(g, 1.1, 4.5, 0.12, q[0], 1.2, q[1], REDP);
  }
  return g;
});

// Indian Heritage Centre: hexagonal glass, a cantilevered concrete box, angled columns.
setBuild('s2012', 18, {m:1, c:'#d5dde4', k:0.4}, function(){
  const it = BY.s2012, g = new THREE.Group(), P = it.P, F = frame(P);
  const uc = (F.u0 + F.u1) / 2, vc = (F.v0 + F.v1) / 2;
  const glass = [F.W(F.u0, F.v0), F.W(uc, F.v0), F.W(uc, F.v1), F.W(F.u0, F.v1)];
  LPoly(g, glass, 0, 14, {c:'#c5d0d8', m:1, fh:1.6, cw:1.6, ds:true});
  const slab = [F.W(uc - 2, F.v0 + 1), F.W(F.u1 - 1, F.v0 + 1), F.W(F.u1 - 1, F.v1 - 1), F.W(uc - 2, F.v1 - 1)];
  LPoly(g, slab, 7, 6.5, CONC);
  LPoly(g, scaleRing(P, 0.7, ctr(P)), 14.5, 3.2, DARKF);
  for (const u of [uc + 1, uc + 4]){
    const q = F.W(u, vc);
    const col = LBox(g, 0.7, 7, 0.7, q[0], 0, q[1], CONC);
    col.rotation.z = u < uc + 2 ? 0.28 : -0.22;
  }
  const rib = F.W(F.u1 - 1.2, vc);
  LBox(g, 1.4, 16, Math.max(4, F.dv * 0.5), rib[0], 0, rib[1], DARKF);
  return g;
});

// Sri Thendayuthapani: a stepped, banded gopuram over a grey gateway. Sculpture is suggested by the tiers, not figures.
setBuild('s2008', 24, {m:0, c:'#ffe0b0', k:0.8, e:0.35}, function(){
  const it = BY.s2008, g = new THREE.Group(), P = it.P, c = ctr(P), F = frame(P);
  LPoly(g, P, 0, 6, {c:'#e6e0d4', m:0, ds:true});
  const door = faceAlongV(F, F.v1, 1);
  paintArch(g, door, (F.u0 + F.u1) / 2, 0.4, 2.2, 5.2, 0, 0, {c:'#8d8a84', m:0, ds:true}, DARK);
  const cols = ['#e7c56a','#d24b4b','#2f9d9a','#f2efe6','#6d4d92','#e7c56a','#d24b4b'];
  let y = 6, w = Math.min(10, F.dv * 0.8), d = Math.min(7, F.du * 0.35);
  const q = F.W((F.u0 + F.u1) / 2, F.v1 - d * 0.4);
  for (let i = 0; i < 7; i++){
    LBox(g, d, 2.0, w, q[0], y, q[1], {c:cols[i], m:0, glow: i % 2 ? '#ffd9a0' : '#000000', gk: i % 2 ? 0.25 : 0, ds:true});
    y += 2.05; w *= 0.82; d *= 0.84;
  }
  LDome(g, w * 0.7, q[0], y, q[1], {c:'#e7c56a', m:0, ds:true}, 0.8, 10);
  return g;
});

// China Cultural Centre: grey panel block, a white faceted blade, and a tower with an open bay and a red ring.
setBuild('s2046', 48, WARM, function(){
  const it = BY.s2046, g = new THREE.Group(), P = it.P, c = ctr(P), F = frame(P);
  LPoly(g, P, 0, 22, CONC);
  const face = faceAlongV(F, F.v1, 1);
  for (let y = 3; y < 20; y += 4.2){
    for (let u = F.u0 + 3; u < F.u1 - 3; u += 4){
      const q = F.W(u, F.v1 + 0.2);
      LBox(g, 2.2, 2.2, 0.25, q[0], y, q[1], GLASS);
    }
  }
  const blade = F.W((F.u0 + F.u1) / 2, F.v1 - 1);
  LBox(g, 3.2, 32, 7, blade[0], 0, blade[1], FIN);
  const tw = F.W((F.u0 + F.u1) / 2, (F.v0 + F.v1) / 2);
  LBox(g, 8, 16, 3, tw[0], 22, tw[1] - 2.2, CONC);
  LBox(g, 8, 16, 3, tw[0], 22, tw[1] + 2.2, CONC);
  LCyl(g, 2.2, 2.2, 0.6, tw[0], 28, tw[1], REDP, 16);
  LBox(g, 14, 2.2, 12, tw[0], 38, tw[1], FIN);
  return g;
});

// SkyHelix Sentosa: an open white spiral around a mast, with a ring at the top.
setBuild('s2005', 36, {m:0, c:'#fff6e0', k:0.5, e:0.2}, function(){
  const it = BY.s2005, g = new THREE.Group(), c = ctr(it.P);
  LCyl(g, 1.1, 1.4, 32, c[0], 0, c[1], FIN, 10);
  const turns = 36;
  for (let i = 0; i < turns; i++){
    const a = i / turns * PI * 2 * 2.4;
    const y = 1.5 + i * 0.82;
    const rad = 6.2;
    const x = c[0] + Math.cos(a) * rad, z = c[1] + Math.sin(a) * rad;
    const deck = LBox(g, 5.4, 0.35, 2.4, x, y, z, i % 6 === 0 ? GOLD : FIN);
    deck.rotation.y = -a;
  }
  LCyl(g, 6.2, 6.2, 0.4, c[0], 32.5, c[1], FIN, 20);
  LCyl(g, 0.8, 1.6, 3.2, c[0], 33, c[1], GOLD, 8);
  return g;
});
}
