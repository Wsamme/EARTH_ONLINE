// ===== sg200 — more Singapore landmarks on their OSM footprints =====
// Each entry in SG200 was pushed by b01.js … b10.js. This file only builds them.
// Medium models share a few materials. Heroes add a second setback, mullions and a lit crown.
// No logos or writing. y = 0 is the placed ground.
{
if (typeof SG200 === 'undefined') var SG200 = [];
const PI = Math.PI;
const GL = (c, fh) => ({c:c, m:1, fh:fh || 4, cw:3.2, ds:true});
const POD = {c:'#d9d0c0', m:0, lk:0.3, ds:true};
const BAND = {c:'#e7e2d6', m:0, lk:0.4, ds:true};
const CROWN = {c:'#f4f1ea', m:0, glow:'#fff3cc', gk:1.1, ds:true};
const CREAM = {c:'#f3efe4', m:0, lk:0.45, ds:true};
const ROOF = {c:'#8d4638', m:0, lk:0.3, ds:true};
const GOLD = {c:'#e2b23c', glow:'#ffd56a', gk:0.9, m:0, ds:true};
const TILE = {c:'#3f9aaf', m:0, lc:'#e7f4ff', lk:0.6, ds:true};
const REDW = {c:'#a33b32', m:0, lk:0.4, ds:true};
// a small set of glass colours so neighbouring towers are not identical
const GLASSES = ['#6d8ea0','#4f7d78','#7a8494','#5d86a6','#6e7f72','#8a7968'].map(c => GL(c, 4));
const ctr = P => { let x=0,z=0; for (const p of P){ x+=p[0]; z+=p[1]; } return [x/P.length, z/P.length]; };
const scaleRing = (P,s,c) => P.map(p => [c[0]+(p[0]-c[0])*s, c[1]+(p[1]-c[1])*s]);
const sArea = P => { let A=0; for (let i=0;i<P.length;i++){ const a=P[i], b=P[(i+1)%P.length]; A+=a[0]*b[1]-b[0]*a[1]; } return A/2; };
function edgesF(P){ const sg = sArea(P)>0?1:-1, out=[];
  for (let i=0;i<P.length;i++){ const a=P[i], b=P[(i+1)%P.length], L=Math.hypot(b[0]-a[0], b[1]-a[1])||1e-6, ex=(b[0]-a[0])/L, ez=(b[1]-a[1])/L;
    out.push({L, F:(u,v,w)=>[a[0]+ex*u+ez*sg*(w||0), v, a[1]+ez*u-ex*sg*(w||0)]}); }
  return out; }
function bands(g, P, y0, y1, step, bh, col){
  const pos=[];
  for (let y=y0; y<y1-bh; y+=step){
    for (const e of edgesF(P)){ if (e.L<1.5) continue;
      const a=e.F(0,y,0.18), b=e.F(e.L,y,0.18), c=e.F(e.L,y+bh,0.18), d=e.F(0,y+bh,0.18);
      pos.push(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2], a[0],a[1],a[2], c[0],c[1],c[2], d[0],d[1],d[2]); }
  }
  if (pos.length) LTris(g, pos, col);
}
function mullions(g, P, y0, y1, sp){
  const pos=[];
  const seg=(a,b)=>{ const dx=b[0]-a[0], dy=b[1]-a[1], dz=b[2]-a[2], L=Math.hypot(dx,dy,dz); if(L<0.2) return;
    const d=[dx/L,dy/L,dz/L], up=Math.abs(d[1])<0.9?[0,1,0]:[1,0,0];
    let ux=d[1]*up[2]-d[2]*up[1], uy=d[2]*up[0]-d[0]*up[2], uz=d[0]*up[1]-d[1]*up[0]; const ul=Math.hypot(ux,uy,uz)||1; ux/=ul; uy/=ul; uz/=ul;
    const vx=d[1]*uz-d[2]*uy, vy=d[2]*ux-d[0]*uz, vz=d[0]*uy-d[1]*ux, r=0.16, n=4, R=[];
    const ring=p=>{ const Q=[]; for(let i=0;i<n;i++){ const t=(i+0.5)/n*PI*2; Q.push([p[0]+(ux*Math.cos(t)+vx*Math.sin(t))*r, p[1]+(uy*Math.cos(t)+vy*Math.sin(t))*r, p[2]+(uz*Math.cos(t)+vz*Math.sin(t))*r]); } return Q; };
    const A=ring(a), B=ring(b);
    for(let i=0;i<n;i++){ const j=(i+1)%n; pos.push(A[i][0],A[i][1],A[i][2], A[j][0],A[j][1],A[j][2], B[j][0],B[j][1],B[j][2], A[i][0],A[i][1],A[i][2], B[j][0],B[j][1],B[j][2], B[i][0],B[i][1],B[i][2]); }
  };
  for (const e of edgesF(P)){ if (e.L<4) continue; const n=Math.max(1, Math.round(e.L/sp));
    for (let k=0;k<=n;k++){ const p=e.F(e.L*k/n, y0, 0.28); seg(p, [p[0], y1, p[2]]); } }
  if (pos.length) LTris(g, pos, BAND);
}
function tower(it){
  const g=new THREE.Group(), P=it.P, c=ctr(P), h=it.h, hero=it.tier==='hero';
  const glass = GLASSES[it.way % GLASSES.length];
  const podH = Math.min(18, Math.max(5, h*0.08));
  LPoly(g, scaleRing(P, 1.03, c), -4, 4.2, POD);
  LPoly(g, P, 0, podH, POD);
  const yA = hero ? h*0.62 : h*0.8;
  const S = scaleRing(P, 0.9, c);
  LPoly(g, S, podH, Math.max(4, yA-podH), glass);
  bands(g, S, podH+4, yA-1, hero ? 8 : Math.max(9, (yA-podH)/6), hero?0.7:0.45, BAND);
  if (hero) mullions(g, S, podH, yA-1, 7);
  const U = scaleRing(S, hero?0.76:0.86, c);
  const h2 = hero ? h*0.22 : Math.max(3, h-yA-1.2);
  LPoly(g, U, yA, h2, glass);
  if (hero){
    const C = scaleRing(U, 0.72, c), yC = yA+h2, hC = Math.max(4, h-yC-1);
    LPoly(g, C, yC, hC, GL('#9eb6c6', 3.4));
    LPoly(g, scaleRing(C, 1.06, c), h-1.6, 1.5, CROWN);
    bands(g, C, yC+1, h-2, Math.max(4, hC/3), 0.35, CROWN);
  } else LPoly(g, scaleRing(U, 1.02, c), yA+h2-0.3, 1.1, BAND);
  return g;
}
function church(it){
  const g=new THREE.Group(), P=it.P, c=ctr(P), h=Math.max(it.h, 14);
  LPoly(g, P, 0, h*0.62, CREAM);
  bands(g, P, h*0.3, h*0.32, 10, 0.4, BAND);
  const top = scaleRing(P, 0.2, c);
  const pos=[];
  for (let i=0;i<P.length;i++){ const a=P[i], b=P[(i+1)%P.length];
    pos.push(a[0], h*0.62, a[1], b[0], h*0.62, b[1], top[0], h*0.92, top[1]); }
  LTris(g, pos, ROOF);
  // a corner tower and a pale spire, on the point farthest from the centre
  let far=P[0], bd=0; for (const p of P){ const d=Math.hypot(p[0]-c[0], p[1]-c[1]); if(d>bd){ bd=d; far=p; } }
  LBox(g, 3.2, h*0.35, 3.2, far[0], h*0.55, far[1], CREAM);
  LCone(g, 1.5, h*0.28, far[0], h*0.9, far[1], ROOF, 8);
  return g;
}
function mosque(it){
  const g=new THREE.Group(), P=it.P, c=ctr(P), h=Math.max(it.h, 14);
  const wall=h*0.55;
  LPoly(g, P, 0, wall, TILE);
  bands(g, P, wall-0.6, wall, 10, 0.45, CREAM);
  const rr=Math.min(8, Math.max(3.2, it.r*0.22));
  LCyl(g, rr*0.7, rr*0.85, rr*0.35, c[0], wall, c[1], CREAM, 10);
  LDome(g, rr, c[0], wall+rr*0.3, c[1], GOLD, 0.85, 16);
  let far=P[0], bd=0; for (const p of P){ const d=Math.hypot(p[0]-c[0], p[1]-c[1]); if(d>bd){ bd=d; far=p; } }
  LCyl(g, 1.1, 1.35, wall+rr, far[0], 0, far[1], TILE, 8);
  LDome(g, 1.5, far[0], wall+rr, far[1], GOLD, 0.8, 10);
  return g;
}
function temple(it){
  const g=new THREE.Group(), P=it.P, c=ctr(P), h=Math.max(it.h, 12);
  LPoly(g, P, 0, h*0.58, CREAM);
  bands(g, scaleRing(P, 1.02, c), 1.2, h*0.5, h*0.16, 0.35, REDW);
  const top=scaleRing(P, 0.25, c), pos=[];
  for (let i=0;i<P.length;i++){ const a=P[i], b=P[(i+1)%P.length];
    pos.push(a[0], h*0.58, a[1], b[0], h*0.58, b[1], top[0], h*0.92, top[1]); }
  LTris(g, pos, ROOF);
  LCyl(g, 0.7, 1.1, h*0.2, c[0], h*0.9, c[1], GOLD, 8);
  return g;
}
function civic(it){
  const g=new THREE.Group(), P=it.P, c=ctr(P), h=Math.max(it.h, 12);
  LPoly(g, P, 0, h*0.82, CREAM);
  bands(g, P, h*0.2, h*0.75, Math.max(6, h/5), 0.5, BAND);
  LPoly(g, scaleRing(P, 0.96, c), h*0.82, h*0.12, ROOF);
  LPoly(g, scaleRing(P, 1.03, c), h*0.78, 0.6, BAND);
  return g;
}
function bridge(it){
  const g=new THREE.Group(), P=it.P, h=Math.max(8, Math.min(it.h, 30));
  LPoly(g, P, h*0.35, 1.4, BAND);
  bands(g, P, h*0.35, h*0.35+1.4, 10, 0.3, CROWN);
  return g;
}
const MAKE = {tower:tower, block:tower, church:church, mosque:mosque, temple:temple, civic:civic, bridge:bridge};
for (const it of SG200){
  const cat = (it.kind==='tower' || it.kind==='block' || it.kind==='bridge') ? 'new' : 'old';
  const lt = cat==='new' ? {m:1, c:'#dce8f4', k:0.5} : {m:0, c:'#ffe0b8', k:0.7, e:0.35};
  LANDMARKS[it.k] = {zh:it.zh, en:it.en, cat:cat, r:it.r, h:it.h, lt:lt, build(){ return (MAKE[it.kind]||tower)(it); }};
  SG_PLACES.push({type:it.k, lat:it.lat, lon:it.lon, rot:0});
}
}
