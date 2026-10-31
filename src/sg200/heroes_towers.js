// The twenty remaining hero towers. Each one keeps its OSM footprint and gets
// its own shaft, facade rhythm and crown. Medium-tier landmarks are untouched.
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
  F.c = c; F.ry = -Math.atan2(F.si, F.co);
  F.W = (u,v) => [c[0] + u*F.co - v*F.si, c[1] + u*F.si + v*F.co];
  return F;
}
function setBuild(k, h, lt, fn){ const L = LANDMARKS[k]; if (!L) return; L.h = h; L.lt = lt; L.cat = 'new'; L.build = fn; }
function glass(c, fh, cw){ return {c:c, m:1, fh:fh||3.6, cw:cw||3.0, ds:true}; }
const WHITE = {c:'#f3f0e8', m:0, lk:0.45, ds:true};
const CREAM = {c:'#e6dcc8', m:0, ds:true};
const CONC = {c:'#d4cfc4', m:0, ds:true};
const DARK = {c:'#2a3138', m:0, ds:true};
const CROWN = {c:'#f7f3ea', glow:'#fff1c4', gk:1.15, m:0, ds:true};
function shelves(g, P, y0, y1, step, th, col, sc){
  const c = ctr(P);
  for (let y=y0; y<y1-th; y+=step) LPoly(g, scaleRing(P, sc||1.035, c), y, th, col);
}
function posts(g, P, y0, h, sp, col){
  for (let i=0;i<P.length;i++){
    const a=P[i], b=P[(i+1)%P.length], L=Math.hypot(b[0]-a[0], b[1]-a[1]);
    if (L<3) continue;
    const n=Math.max(1, Math.round(L/sp));
    for (let k=0;k<=n;k++){ const t=k/n; LBox(g, 0.32, h, 0.32, a[0]+(b[0]-a[0])*t, y0, a[1]+(b[1]-a[1])*t, col); }
  }
}
function oct(F, u, v, r){
  const P=[];
  for (let i=0;i<8;i++){ const a=i/8*PI*2+PI/8; P.push(F.W(u+Math.cos(a)*r, v+Math.sin(a)*r)); }
  return P;
}
function boxAt(g, F, u, v, w, h, d, y, col){ const q=F.W(u,v); return LBox(g, w, h, d, q[0], y, q[1], col, F.ry); }

// Marina Bay Residences: the real plan, a fine balcony shelf every floor, a small lit cap.
setBuild('s2014', 245, {m:1, c:'#d5e4ee', k:0.55}, function(){
  const it=BY.s2014, g=new THREE.Group(), P=it.P, c=ctr(P);
  const G = glass('#6f92a8', 3.3, 2.4);
  LPoly(g, scaleRing(P, 1.04, c), 0, 14, CONC);
  LPoly(g, P, 14, 214, G);
  shelves(g, P, 16, 224, 3.6, 0.22, WHITE, 1.045);
  const cap = scaleRing(P, 0.78, c);
  LPoly(g, cap, 228, 14, glass('#b7c9d4', 3.2, 2.8));
  LPoly(g, scaleRing(cap, 1.08, c), 240, 2.2, CROWN);
  return g;
});

// One Raffles Quay North: teal glass, heavy horizontal bands, a tall louvered crown.
setBuild('s2015', 245, {m:1, c:'#cfe4ea', k:0.5}, function(){
  const it=BY.s2015, g=new THREE.Group(), P=it.P, c=ctr(P);
  LPoly(g, scaleRing(P, 1.05, c), 0, 16, {c:'#e7e2d6', m:0, ds:true});
  const S = scaleRing(P, 0.82, c);
  LPoly(g, S, 16, 196, glass('#3f7f86', 4.2, 3.4));
  shelves(g, S, 20, 206, 8, 0.7, WHITE, 1.04);
  posts(g, S, 16, 196, 14, WHITE);
  const C = scaleRing(S, 0.9, c);
  LPoly(g, C, 212, 28, {c:'#e7eef0', m:0, ds:true});
  shelves(g, C, 214, 238, 2.2, 0.28, CROWN, 1.02);
  return g;
});

// One Raffles Quay South: the same language, a shorter crown.
setBuild('s2028', 140, {m:1, c:'#cfe4ea', k:0.5}, function(){
  const it=BY.s2028, g=new THREE.Group(), P=it.P, c=ctr(P);
  LPoly(g, scaleRing(P, 1.04, c), 0, 14, {c:'#e7e2d6', m:0, ds:true});
  const S = scaleRing(P, 0.8, c);
  LPoly(g, S, 14, 106, glass('#3f7f86', 4.2, 3.4));
  shelves(g, S, 18, 116, 8, 0.65, WHITE, 1.04);
  const C = scaleRing(S, 0.88, c);
  LPoly(g, C, 120, 16, {c:'#e7eef0', m:0, ds:true});
  shelves(g, C, 122, 134, 2.4, 0.26, CROWN, 1.02);
  return g;
});

// One Shenton 1: curved plan, a white balcony rib on every floor.
setBuild('s2016', 214, {m:1, c:'#e7eef2', k:0.5}, function(){
  const it=BY.s2016, g=new THREE.Group(), P=it.P, c=ctr(P);
  LPoly(g, P, 0, 200, glass('#8ea6b4', 3.2, 4));
  shelves(g, P, 4, 198, 3.3, 0.45, WHITE, 1.12);
  LPoly(g, scaleRing(P, 0.7, c), 200, 10, WHITE);
  LPoly(g, scaleRing(P, 0.85, c), 208, 1.4, CROWN);
  return g;
});

// One Shenton 2: the shorter sibling, same ribs.
setBuild('s2018', 178, {m:1, c:'#e7eef2', k:0.5}, function(){
  const it=BY.s2018, g=new THREE.Group(), P=it.P, c=ctr(P);
  LPoly(g, P, 0, 164, glass('#8ea6b4', 3.2, 4));
  shelves(g, P, 4, 162, 3.3, 0.42, WHITE, 1.1);
  LPoly(g, scaleRing(P, 0.72, c), 164, 10, WHITE);
  LPoly(g, scaleRing(P, 0.86, c), 172, 1.3, CROWN);
  return g;
});

// Singapore Land Tower: dark glass cut by thick white horizontal stripes, a set-back penthouse.
setBuild('s2017', 190, {m:1, c:'#d5d0c8', k:0.45}, function(){
  const it=BY.s2017, g=new THREE.Group(), P=it.P, c=ctr(P);
  const S = scaleRing(P, 0.72, c);
  LPoly(g, scaleRing(P, 1.02, c), 0, 12, CONC);
  LPoly(g, S, 12, 156, glass('#4a463f', 3.8, 3.2));
  shelves(g, S, 16, 164, 6.5, 0.85, WHITE, 1.05);
  const C = scaleRing(S, 0.62, c);
  LPoly(g, C, 168, 18, glass('#6a655c', 3.4, 3));
  LPoly(g, scaleRing(C, 1.1, c), 184, 2, CROWN);
  return g;
});

// Pickering Operations Complex: Kenzo Tange, concrete bands like its neighbour OCBC, round end cores, a mast.
setBuild('s2021', 177, {m:1, c:'#e4e0d6', k:0.4}, function(){
  const it=BY.s2021, g=new THREE.Group(), P=it.P, F=frame(P), c=ctr(P);
  for (let y=0; y<158; y+=4.2){
    LPoly(g, P, y, 1.35, CONC);
    LPoly(g, scaleRing(P, 0.97, c), y+1.35, 2.85, glass('#243038', 3.2, 6));
  }
  const e1=F.W(F.u0, (F.v0+F.v1)/2), e2=F.W(F.u1, (F.v0+F.v1)/2);
  LCyl(g, 5.5, 5.5, 162, e1[0], 0, e1[1], CONC, 16);
  LCyl(g, 5.5, 5.5, 162, e2[0], 0, e2[1], CONC, 16);
  LPoly(g, scaleRing(P, 0.55, c), 158, 8, CONC);
  LCyl(g, 0.35, 0.15, 16, c[0], 166, c[1], {c:'#d8d4cc', glow:'#fff6d0', gk:0.4, m:0, ds:true}, 6);
  return g;
});

// NTUC Centre: a broad podium, an inset blue tower, vertical fins, a frame crown.
setBuild('s2022', 163, {m:1, c:'#d5e6f2', k:0.55}, function(){
  const it=BY.s2022, g=new THREE.Group(), P=it.P, c=ctr(P);
  LPoly(g, P, 0, 18, {c:'#e4dfd4', m:0, ds:true});
  shelves(g, P, 4, 16, 4, 0.4, WHITE, 1.02);
  const S = scaleRing(P, 0.48, c);
  LPoly(g, S, 18, 128, glass('#3d6f90', 3.8, 2.6));
  posts(g, S, 18, 128, 6, WHITE);
  const C = scaleRing(S, 1.08, c);
  LPoly(g, C, 146, 12, {c:'#e8eef2', m:0, ds:true});
  LPoly(g, scaleRing(S, 0.7, c), 158, 4, CROWN);
  return g;
});

// Scotts Square: a lattice podium and a tower of staggered balcony pixels.
setBuild('s2023', 159, {m:1, c:'#e6e8ea', k:0.5}, function(){
  const it=BY.s2023, g=new THREE.Group(), P=it.P, F=frame(P), c=ctr(P);
  LPoly(g, P, 0, 16, {c:'#c8c4bc', m:0, ds:true});
  for (let i=0;i<P.length;i++){
    const a=P[i], b=P[(i+1)%P.length], L=Math.hypot(b[0]-a[0], b[1]-a[1]);
    if (L<8) continue;
    const n=Math.round(L/6);
    for (let k=0;k<n;k++){
      const t=k/n, x=a[0]+(b[0]-a[0])*t, z=a[1]+(b[1]-a[1])*t;
      const x2=a[0]+(b[0]-a[0])*((k+1)/n), z2=a[1]+(b[1]-a[1])*((k+1)/n);
      LBeam(g, [x, 1, z], [x2, 15, z2], 0.18, WHITE, 4);
      LBeam(g, [x2, 1, z2], [x, 15, z], 0.18, WHITE, 4);
    }
  }
  const uc=(F.u0+F.u1)/2, vc=(F.v0+F.v1)/2;
  const shaft=[F.W(uc-10, vc-8), F.W(uc+10, vc-8), F.W(uc+10, vc+8), F.W(uc-10, vc+8)];
  LPoly(g, shaft, 16, 130, glass('#9aa7b0', 3.4, 3.2));
  let s=23; const rnd=()=>{ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
  for (let y=18; y<142; y+=3.4){
    for (let i=0;i<6;i++) for (const side of [-1, 1]){
      if (rnd()<0.4) continue;
      const u=uc-9+i*3.2, v=vc+side*8;
      const q=F.W(u, v);
      LBox(g, 2.4, 2.2, 0.6+rnd()*1.6, q[0], y, q[1], WHITE, F.ry);
    }
  }
  LPoly(g, scaleRing(shaft, 0.8, ctr(shaft)), 146, 8, CROWN);
  return g;
});

// Chevron House: bronze glass with a sawtooth of fins down the long face.
setBuild('s2024', 152, {m:1, c:'#e6d7b8', k:0.45}, function(){
  const it=BY.s2024, g=new THREE.Group(), P=it.P, F=frame(P), c=ctr(P);
  const G = glass('#8a7048', 3.6, 2.8);
  LPoly(g, P, 0, 140, G);
  const n=Math.max(6, Math.round(F.du/4));
  for (let i=0;i<n;i++){
    const u=F.u0+F.du*(i+0.5)/n;
    const q=F.W(u, F.v1);
    LBox(g, 3.4, 136, 2.2, q[0], 2, q[1], G, F.ry+(i%2?0.55:-0.55));
  }
  LPoly(g, scaleRing(P, 0.9, c), 140, 8, {c:'#c4a36a', m:0, ds:true});
  LPoly(g, scaleRing(P, 1.02, c), 147, 1.6, CROWN);
  return g;
});

// OUE Downtown Tower 2: a bronze octagon on its podium, dark corner piers.
setBuild('s2025', 150, {m:1, c:'#e4d2b0', k:0.4}, function(){
  const it=BY.s2025, g=new THREE.Group(), F=frame(it.P), c=ctr(it.P);
  LPoly(g, it.P, 0, 12, {c:'#c4b49a', m:0, ds:true});
  const uc=(F.u0+F.u1)/2, vc=(F.v0+F.v1)/2, r=Math.min(F.du, F.dv)*0.28;
  const O=oct(F, uc, vc, r);
  LPoly(g, O, 12, 128, glass('#8d6a3e', 3.8, 4));
  for (const p of O) LBox(g, 1.4, 128, 1.4, p[0], 12, p[1], {c:'#5c4630', m:0, ds:true});
  LPoly(g, scaleRing(O, 1.05, c), 140, 6, {c:'#d8c4a4', m:0, ds:true});
  LPoly(g, scaleRing(O, 0.7, c), 146, 3, CROWN);
  return g;
});

// UIC Building: a white concrete grid of punched windows, not a curtain wall.
setBuild('s2030', 123, {m:0, c:'#f0ece4', k:0.35, e:0.15}, function(){
  const it=BY.s2030, g=new THREE.Group(), P=it.P, c=ctr(P);
  LPoly(g, scaleRing(P, 1.04, c), 0, 8, CONC);
  const S=scaleRing(P, 0.78, c);
  LPoly(g, S, 8, 108, WHITE);
  const win={c:'#2c3844', glow:'#ffd9a8', gk:0.2, m:0, ds:true};
  for (let i=0;i<S.length;i++){
    const a=S[i], b=S[(i+1)%S.length], dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx, dz);
    if (L<4) continue;
    const n=Math.max(1, Math.floor(L/3.2)), ang=Math.atan2(-(dz/L), dx/L);
    for (let f=0; f<22; f++) for (let k=0; k<n; k++){
      const t=(k+0.5)/n;
      LBox(g, 1.5, 2.1, 0.35, a[0]+dx*t, 12+f*4.4, a[1]+dz*t, win, ang);
    }
  }
  LPoly(g, scaleRing(S, 1.03, c), 116, 3, CONC);
  return g;
});

// Tokio Marine Centre: stone corner piers, a glass centre bay, a set-back crown.
setBuild('s2032', 121, {m:1, c:'#d5e0ea', k:0.5}, function(){
  const it=BY.s2032, g=new THREE.Group(), F=frame(it.P);
  const uc=(F.u0+F.u1)/2, vc=(F.v0+F.v1)/2;
  const wu=Math.min(F.du*0.7, 36), wv=Math.min(F.dv*0.7, 32);
  boxAt(g, F, uc, vc, wu, 100, wv, 8, glass('#5d7e96', 3.6, 2.8));
  boxAt(g, F, uc-wu/2, vc, 3.2, 108, wv+0.6, 0, {c:'#d9d3c6', m:0, ds:true});
  boxAt(g, F, uc+wu/2, vc, 3.2, 108, wv+0.6, 0, {c:'#d9d3c6', m:0, ds:true});
  boxAt(g, F, uc, vc, wu+6, 8, wv+6, 0, CONC);
  boxAt(g, F, uc, vc, wu*0.7, 12, wv*0.7, 108, glass('#8eabbe', 3.2, 3));
  boxAt(g, F, uc, vc, wu*0.78, 1.6, wv*0.78, 119, CROWN);
  return g;
});

// 6 Raffles Quay: 1980s beige stone and dark glass in thick horizontal bands.
setBuild('s2037', 112, {m:1, c:'#e8dcc8', k:0.4}, function(){
  const it=BY.s2037, g=new THREE.Group(), P=it.P, c=ctr(P);
  const S=scaleRing(P, 0.86, c);
  LPoly(g, P, 0, 10, CREAM);
  for (let y=10; y<100; y+=5){
    LPoly(g, S, y, 2.2, glass('#3e4a52', 3.2, 4));
    LPoly(g, scaleRing(S, 1.03, c), y+2.2, 2.8, CREAM);
  }
  LPoly(g, scaleRing(S, 0.9, c), 102, 8, CREAM);
  LPoly(g, scaleRing(S, 0.95, c), 108, 1.5, CROWN);
  return g;
});

// OUE Bayfront: a colonnaded base and a glass tower with horizontal fins and a wedge crown.
setBuild('s2040', 100, {m:1, c:'#d7e6ea', k:0.55}, function(){
  const it=BY.s2040, g=new THREE.Group(), F=frame(it.P), P=it.P;
  const uc=(F.u0+F.u1)/2, vc=(F.v0+F.v1)/2;
  boxAt(g, F, uc, vc, F.du-2, 12, F.dv-2, 0, {c:'#e6e0d4', m:0, ds:true});
  for (let u=F.u0+3; u<F.u1-3; u+=5){
    const q=F.W(u, F.v1-1);
    LCyl(g, 0.45, 0.55, 8, q[0], 0, q[1], WHITE, 8);
  }
  const hip = F.W(uc, F.v1-6);
  hipRoof(g, hip[0], hip[1], Math.min(22, F.du*0.4), 10, 8, 3.2, {c:'#8d4038', m:0, ds:true}, F.ry, 0.4);
  const S=[F.W(uc-12, vc-8), F.W(uc+12, vc-10), F.W(uc+14, vc+8), F.W(uc-10, vc+10)];
  LPoly(g, S, 12, 74, glass('#4f8c96', 3.4, 6));
  shelves(g, S, 14, 82, 3.6, 0.35, WHITE, 1.06);
  // wedge crown: a slab that rises toward one end
  const a=F.W(uc-14, vc), b=F.W(uc+14, vc), c=F.W(uc, vc+1);
  LTris(g, [a[0],86,a[1], b[0],86,b[1], b[0],98,b[1], a[0],86,a[1], b[0],98,b[1], a[0],92,a[1]], {c:'#d5e4e8', m:0, glow:'#fff3c8', gk:0.6, ds:true});
  return g;
});

// Hilton Singapore Orchard: the old Mandarin pair. A podium, a 144 m tower with a top disc, and a shorter wing.
setBuild('s2047', 144, {m:1, c:'#e6d8c4', k:0.4}, function(){
  const it=BY.s2047, g=new THREE.Group(), F=frame(it.P), P=it.P;
  LPoly(g, P, 0, 14, {c:'#6e5a48', m:0, ds:true});
  const uc=(F.u0+F.u1)/2, vc=(F.v0+F.v1)/2;
  const bronze = glass('#6a5344', 3.2, 2.2);
  boxAt(g, F, uc-16, vc, 22, 144, 18, 0, bronze);
  boxAt(g, F, uc+18, vc+6, 18, 96, 16, 0, bronze);
  for (let y=16; y<140; y+=8){
    boxAt(g, F, uc-16, vc, 22.6, 0.35, 18.6, y, {c:'#c4b09a', m:0, ds:true});
    if (y<90) boxAt(g, F, uc+18, vc+6, 18.5, 0.35, 16.5, y, {c:'#c4b09a', m:0, ds:true});
  }
  const top=F.W(uc-16, vc);
  LCyl(g, 14, 14, 4, top[0], 140, top[1], {c:'#8a7260', glow:'#ffe0b0', gk:0.7, m:0, ds:true}, 20);
  LCyl(g, 8, 8, 3, top[0], 144, top[1], CROWN, 16);
  return g;
});

// AIA Tower: green glass held in white vertical fins, a framed crown.
setBuild('s2053', 83, {m:1, c:'#d7eee4', k:0.55}, function(){
  const it=BY.s2053, g=new THREE.Group(), P=it.P, c=ctr(P);
  const S=scaleRing(P, 0.82, c);
  LPoly(g, P, 0, 8, WHITE);
  LPoly(g, S, 8, 66, glass('#2f6d5c', 3.4, 2.2));
  posts(g, S, 8, 66, 3.2, WHITE);
  LPoly(g, scaleRing(S, 1.06, c), 74, 6, WHITE);
  LPoly(g, scaleRing(S, 0.7, c), 80, 3, CROWN);
  return g;
});

// Pan Pacific Orchard: four stacked terraces (forest, beach, garden, cloud) and three room bars. 140 m.
setBuild('s2055', 140, {m:1, c:'#e7f2ea', k:0.6, e:0.35}, function(){
  const it=BY.s2055, g=new THREE.Group(), F=frame(it.P);
  const uc=(F.u0+F.u1)/2, vc=(F.v0+F.v1)/2;
  const GREEN={c:'#3c7a46', m:0, ds:true}, SAND={c:'#e4d0a4', m:0, ds:true};
  const WATER={c:'#3aa0b8', glow:'#c8f6ff', gk:0.35, m:0, ds:true};
  const ROOM=glass('#d9d4ca', 3.2, 2.6), GL=glass('#8eabb6', 3.4, 3);
  const bx=(u,v,w,h,d,y,col)=>boxAt(g, F, uc+u, vc+v, w, h, d, y, col);
  bx(0, 0, 30, 1.2, 20, 0, GREEN);
  for (let i=0;i<4;i++) for (let j=0;j<3;j++) bx(-12+i*8, -8+j*8, 1.1, 16, 1.1, 0, {c:'#6d5a48', m:0, ds:true});
  bx(-4, 0, 14, 26, 20, 16, ROOM);
  bx(8, -2, 16, 26, 12, 16, GL);
  bx(0, 0, 36, 1.3, 26, 42, SAND);
  bx(3, 1, 14, 0.5, 9, 43.3, WATER);
  for (const [u,v] of [[-12,-8],[11,-7],[9,8],[-8,7]]){
    const q=F.W(uc+u, vc+v);
    LCyl(g, 0.22, 0.32, 4.2, q[0], 43, q[1], {c:'#6a4a32', m:0, ds:true}, 5);
    LCone(g, 1.4, 2.4, q[0], 47, q[1], GREEN, 6);
  }
  bx(5, 1, 14, 26, 20, 56, ROOM);
  bx(-8, -2, 16, 26, 12, 56, GL);
  bx(0, 0, 36, 1.2, 26, 82, GREEN);
  bx(-2, -1, 18, 24, 16, 96, ROOM);
  bx(9, 3, 12, 24, 12, 96, GL);
  bx(0, 0, 34, 0.8, 24, 120, WHITE);
  for (let i=0;i<3;i++) bx(-10+i*10, 0, 0.55, 16, 0.55, 121, WHITE);
  bx(0, 0, 38, 1.4, 28, 136, CROWN);
  return g;
});

// The Octagon: the footprint is the octagon. Beige stone, vertical slots, a lip at the top.
setBuild('s2057', 80, {m:1, c:'#e8dfd0', k:0.4}, function(){
  const it=BY.s2057, g=new THREE.Group(), P=it.P, c=ctr(P);
  LPoly(g, P, 0, 72, glass('#c4b49a', 3.6, 2.4));
  posts(g, P, 0, 72, 4.5, {c:'#efe8dc', m:0, ds:true});
  LPoly(g, scaleRing(P, 1.06, c), 72, 3.2, CREAM);
  LPoly(g, scaleRing(P, 0.72, c), 75, 5, {c:'#d9cfc0', m:0, ds:true});
  LPoly(g, scaleRing(P, 0.8, c), 79, 1.2, CROWN);
  return g;
});

// Bank of Singapore Centre: a stone podium, a blue glass shaft, a lit crown.
setBuild('s2059', 76, {m:1, c:'#d5e4f0', k:0.55}, function(){
  const it=BY.s2059, g=new THREE.Group(), P=it.P, c=ctr(P);
  LPoly(g, P, 0, 12, {c:'#d9d2c4', m:0, ds:true});
  shelves(g, P, 3, 11, 3.5, 0.35, WHITE, 1.015);
  const S=scaleRing(P, 0.7, c);
  LPoly(g, S, 12, 54, glass('#3c6e90', 3.4, 2.6));
  posts(g, S, 12, 54, 5, WHITE);
  const C=scaleRing(S, 0.82, c);
  LPoly(g, C, 66, 8, glass('#8eafc4', 3, 3));
  LPoly(g, scaleRing(C, 1.1, c), 73, 2, CROWN);
  return g;
});
}
