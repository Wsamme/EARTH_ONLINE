// Second pass on the hero buildings that still read as boxes or floating slabs.
// Loaded after heroes.js, so these build functions replace the first attempt.
// Neighbour buildings can be hidden for a comparison photo via __sgx.look(..., solo).
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
function faceAlongU(F, u, sign){ return (v, y, w) => { const q = F.W(u + sign*(w||0), v); return [q[0], y, q[1]]; }; }
function faceAlongV(F, v, sign){ return (u, y, w) => { const q = F.W(u, v + sign*(w||0)); return [q[0], y, q[1]]; }; }
function fan(g, F, across, pts, w, col){
  const o=[];
  for (let i=1;i<pts.length-1;i++){
    const A=F(across+pts[0][0], pts[0][1], w), B=F(across+pts[i][0], pts[i][1], w), C=F(across+pts[i+1][0], pts[i+1][1], w);
    o.push(A[0],A[1],A[2], B[0],B[1],B[2], C[0],C[1],C[2]);
  }
  if (o.length) LTris(g, o, col);
}
function lancet(hw, ht){
  const yk = ht*0.66, P=[[-hw,0],[hw,0],[hw,yk]];
  for (let i=1;i<=5;i++){ const t=i/5; P.push([hw*(1-t), yk+(ht-yk)*Math.sin(t*PI/2)]); }
  for (let i=4;i>=0;i--){ const t=i/5; P.push([-hw*(1-t), yk+(ht-yk)*Math.sin(t*PI/2)]); }
  return P;
}
function archPts(hw, ht){
  const rise=Math.min(hw, ht*0.48), P=[[-hw,0],[hw,0],[hw, ht-rise]];
  for (let i=0;i<=6;i++){ const a=PI*(1-i/6); P.push([Math.cos(a)*hw, ht-rise+Math.sin(a)*rise]); }
  P.push([-hw, ht-rise]); return P;
}
function opening(g, F, across, yb, pts, rim, hole){
  const moved = pts.map(p => [p[0], p[1]+yb]);
  fan(g, F, across, moved.map(p => [p[0]*1.18, p[1]*1.02]), 0.28, rim);
  fan(g, F, across, moved, 0.08, hole);
}
function rose(g, F, across, y, r, rim, hole){
  const ring=[], disc=[];
  const C0=F(across, y, 0.3), C1=F(across, y, 0.1);
  for (let i=0;i<18;i++){
    const a0=i/18*PI*2, a1=(i+1)/18*PI*2;
    const A=F(across+Math.cos(a0)*r, y+Math.sin(a0)*r, 0.3), B=F(across+Math.cos(a1)*r, y+Math.sin(a1)*r, 0.3);
    const A2=F(across+Math.cos(a0)*r*0.72, y+Math.sin(a0)*r*0.72, 0.12), B2=F(across+Math.cos(a1)*r*0.72, y+Math.sin(a1)*r*0.72, 0.12);
    ring.push(C0[0],C0[1],C0[2], A[0],A[1],A[2], B[0],B[1],B[2]);
    disc.push(C1[0],C1[1],C1[2], A2[0],A2[1],A2[2], B2[0],B2[1],B2[2]);
  }
  LTris(g, ring, rim); LTris(g, disc, hole);
  for (let i=0;i<8;i++){
    const a=i/8*PI*2;
    const q=F(across+Math.cos(a)*r*0.35, y+Math.sin(a)*r*0.35, 0.2);
    LBox(g, 0.12, r*0.7, 0.12, q[0], y-r*0.35, q[1], rim);
  }
}
function setBuild(k, h, lt, fn){
  const L = LANDMARKS[k]; if (!L) return;
  L.h = h; L.lt = lt; L.build = fn;
}
const WARM = {m:0, c:'#ffd7a6', k:0.9, e:0.45};
const BRICK = {c:'#8a4636', m:0, lk:0.4, ds:true};
const CREAM = {c:'#f3eadc', m:0, lk:0.55, ds:true};
const WHITE = {c:'#f6f3ec', m:0, lk:0.6, ds:true};
const STONE = {c:'#c8c2b6', m:0, lk:0.3, ds:true};
const DARK = {c:'#1a222c', glow:'#ffd9a8', gk:0.3, m:0, ds:true};
const STAIN = {c:'#16362e', glow:'#b6ffd4', gk:0.55, m:0, ds:true};
const GOLD = {c:'#e2b23c', glow:'#ffd56a', gk:1.1, m:0, ds:true};
const REDR = {c:'#8d3830', m:0, lk:0.35, ds:true};
const BLUEW = {c:'#c5d7ea', m:0, lk:0.45, ds:true};
const MINT = {c:'#c5ddd0', m:0, lc:'#e9fff4', lk:0.5, ds:true};
const MINT2 = {c:'#8fbfaa', m:0, ds:true};
const GREY = {c:'#b7b3ab', m:0, ds:true};
const GLASS = {c:'#8ea0aa', m:1, fh:3.4, cw:2.6, ds:true};
const POT = [[0.05,0],[0.28,0.02],[0.36,0.22],[0.22,0.48],[0.16,0.62],[0.22,0.78],[0.06,0.98]];

function boxAt(g, F, u, v, w, h, d, y, col){
  const q = F.W(u, v);
  return LBox(g, w, h, d, q[0], y, q[1], col, F.ry);
}

// Sri Thendayuthapani: the gopuram stands on the entrance wall, not above it.
setBuild('s2008', 28, WARM, function(){
  const it = BY.s2008, g = new THREE.Group(), F = frame(it.P);
  const uc=(F.u0+F.u1)/2, vc=(F.v0+F.v1)/2;
  LPoly(g, it.P, 0, 0.35, {c:'#e7e0d2', m:0, ds:true});
  const gw = Math.min(8.5, F.du*0.34), gd = 6.5;
  const gv = F.v1 - gd*0.5;
  // compound walls on the ground, broken only by the gate
  const side = Math.max(2, (F.du - gw)/2 - 0.3);
  boxAt(g, F, F.u0+side/2, F.v1-0.7, side, 5.4, 1.3, 0, CREAM);
  boxAt(g, F, F.u1-side/2, F.v1-0.7, side, 5.4, 1.3, 0, CREAM);
  boxAt(g, F, uc, F.v0+0.7, F.du-1, 4.6, 1.1, 0, CREAM);
  boxAt(g, F, F.u0+0.6, vc, 1.1, 4.6, F.dv-2, 0, CREAM);
  boxAt(g, F, F.u1-0.6, vc, 1.1, 4.6, F.dv-2, 0, CREAM);
  const cols = ['#e6c15a','#c4453c','#2f8f8a','#f4efe6','#6b4c8a','#d86a32','#3d6eae','#e6c15a'];
  for (let s of [-1, 1]){
    const n = Math.max(2, Math.floor(side/2.4));
    for (let i=0;i<n;i++){
      const u = (s<0?F.u0:F.u1-side) + side*(i+0.5)/n;
      const face = faceAlongV(F, F.v1, 1);
      opening(g, face, u, 1.3, archPts(0.55, 2.2), CREAM, {c:cols[i%cols.length], m:0, ds:true});
      const q = F.W(u, F.v1+0.15);
      LCone(g, 0.22, 0.7, q[0], 4.6, q[1], GOLD, 5);
    }
  }
  // gate and tower, from the ground, overlapping the wall
  boxAt(g, F, uc, gv, gw, 8.2, gd, 0, {c:'#7e7a74', m:0, ds:true});
  const door = faceAlongV(F, gv+gd/2, 1);
  opening(g, door, uc, 0.15, archPts(1.55, 5.6), STONE, DARK);
  // hall behind the gate
  const hallV = gv - gd*0.5 - Math.min(6, F.dv*0.22);
  boxAt(g, F, uc, hallV, Math.min(18, F.du*0.7), 6.2, Math.min(12, F.dv*0.4), 0, {c:'#ddd4c4', m:0, ds:true});
  const hq = F.W(uc, hallV);
  hipRoof(g, hq[0], hq[1], Math.min(18, F.du*0.7), Math.min(12, F.dv*0.4), 6.2, 2.6, REDR, F.ry, 0.4);
  let y = 8.2, w = gw*0.98, d = gd*0.92;
  for (let i=0;i<8;i++){
    const col = {c:cols[i%cols.length], m:0, ds:true};
    boxAt(g, F, uc, gv, w, 1.25, d, y, col);
    const nU = Math.max(3, Math.round(w/1.05)), nV = Math.max(2, Math.round(d/1.15));
    for (let k=0;k<nU;k++){
      const u = uc - w/2 + w*(k+0.5)/nU;
      for (const s of [-1, 1]){
        const q = F.W(u, gv + s*(d/2));
        LBox(g, 0.38, 0.85, 0.4, q[0], y+0.15, q[1], {c:cols[(i+k+2)%cols.length], m:0, ds:true}, F.ry);
      }
    }
    for (let k=0;k<nV;k++){
      const v = gv - d/2 + d*(k+0.5)/nV;
      for (const s of [-1, 1]){
        const q = F.W(uc + s*(w/2), v);
        LBox(g, 0.4, 0.85, 0.38, q[0], y+0.15, q[1], {c:cols[(i+k+4)%cols.length], m:0, ds:true}, F.ry);
      }
    }
    boxAt(g, F, uc, gv, w+0.55, 0.28, d+0.45, y+1.25, CREAM);
    y += 1.58; w *= 0.86; d *= 0.88;
  }
  const tq = F.W(uc, gv);
  const vault = LCyl(g, Math.max(0.8, d*0.48), Math.max(0.8, d*0.48), Math.max(1.2, w*1.15), tq[0], y - w*0.2, tq[1], {c:'#2f8f8a', m:0, ds:true}, 14);
  vault.rotation.z = PI/2; vault.rotation.y = F.ry;
  for (let k=-3;k<=3;k++){
    const q = F.W(uc + k*Math.max(0.6, w*0.28), gv);
    LLathe(g, POT.map(p => [p[0]*0.9, p[1]*1.15]), q[0], y + Math.max(d, 1.2)*0.7, q[1], GOLD, 8);
  }
  return g;
});

// Wesley: Gothic nave with a steep roof, buttresses, a rose, and a pinnacled tower, plus the modern annex.
setBuild('s2001', 34, WARM, function(){
  const it = BY.s2001, g = new THREE.Group(), F = frame(it.P);
  const uc=(F.u0+F.u1)/2, vc=(F.v0+F.v1)/2;
  LPoly(g, it.P, 0, 0.3, {c:'#c4b5a4', m:0, ds:true});
  const u0=uc-16, u1=uc+10, v0=vc-7.2, v1=vc+7.2;
  boxAt(g, F, (u0+u1)/2, vc, u1-u0, 12, v1-v0, 0, BRICK);
  for (let u=u0+2; u<u1-1; u+=4.6){
    boxAt(g, F, u, v1, 0.7, 11.2, 1.3, 0, BRICK);
    boxAt(g, F, u, v0, 0.7, 11.2, 1.3, 0, BRICK);
  }
  const side = faceAlongV(F, v1, 1);
  for (let u=u0+3; u<u1-2; u+=5) opening(g, side, u, 1.6, lancet(1.15, 7.4), CREAM, STAIN);
  const nq = F.W((u0+u1)/2, vc);
  gable(g, nq[0], nq[1], u1-u0, v1-v0, 12, 7.5, REDR, F.ry);
  const end = faceAlongU(F, u0, -1);
  rose(g, end, vc, 8.5, 2.2, CREAM, STAIN);
  // tower overlapping the east end, from the ground
  const tx=u1, tz=vc;
  boxAt(g, F, tx, tz, 9.2, 24, 9.2, 0, BRICK);
  for (const du of [-4.3, 4.3]) for (const dv of [-4.3, 4.3]) boxAt(g, F, tx+du, tz+dv, 1.35, 23, 1.35, 0, CREAM);
  const tf = faceAlongU(F, tx+4.6, 1);
  opening(g, tf, tz, 3, lancet(1.15, 8.2), CREAM, STAIN);
  opening(g, tf, tz, 13.2, lancet(0.85, 5.4), CREAM, STAIN);
  opening(g, tf, tz-2.2, 19.2, lancet(0.55, 3.2), CREAM, STAIN);
  opening(g, tf, tz+2.2, 19.2, lancet(0.55, 3.2), CREAM, STAIN);
  for (let k=-3;k<=3;k++) if (Math.abs(k)!==0) boxAt(g, F, tx+k*1.15, tz+4.7, 0.7, 1.5, 0.7, 24, CREAM);
  boxAt(g, F, tx, tz, 10, 0.45, 10, 24, CREAM);
  for (const du of [-4.2, 4.2]) for (const dv of [-4.2, 4.2]){
    const q = F.W(tx+du, tz+dv);
    LCone(g, 0.85, 6.2, q[0], 24.2, q[1], CREAM, 6);
    LCone(g, 0.28, 1.4, q[0], 30.2, q[1], GOLD, 5);
  }
  // modern annex beside the nave
  boxAt(g, F, u0-12, vc+2, 16, 9, 12, 0, WHITE);
  boxAt(g, F, u0-12, vc+2, 14.5, 6.5, 0.4, 1.2, GLASS);
  boxAt(g, F, u0-12, vc+8.2, 14, 0.4, 1.2, 8.6, {c:'#dfe7ee', glow:'#fff6e4', gk:0.8, m:0, ds:true});
  return g;
});

// Saints Peter and Paul: porch of three arches, rose, pinnacles and a dark spire.
setBuild('s2003', 36, WARM, function(){
  const it = BY.s2003, g = new THREE.Group(), F = frame(it.P);
  const uc=(F.u0+F.u1)/2, vc=(F.v0+F.v1)/2;
  const hw=8.2, len=26, u0=uc-8, u1=uc+18;
  boxAt(g, F, (u0+u1)/2, vc, len, 12.5, hw*2, 0, WHITE);
  const nq = F.W((u0+u1)/2, vc);
  gable(g, nq[0], nq[1], len, hw*2, 12.5, 6.5, {c:'#d5cfc3', m:0, ds:true}, F.ry);
  const front = faceAlongU(F, u1+2.2, 1);
  for (const v of [vc-4.4, vc, vc+4.4]){
    opening(g, front, v, 0.2, archPts(1.7, 6.4), CREAM, DARK);
    const q = F.W(u1+2.4, v-2.2);
    LCyl(g, 0.42, 0.5, 6.6, q[0], 0, q[1], STONE, 8);
  }
  const qR = F.W(u1+2.4, vc+4.4+2.2);
  LCyl(g, 0.42, 0.5, 6.6, qR[0], 0, qR[1], STONE, 8);
  boxAt(g, F, u1+2.2, vc, 1.2, 0.55, 12, 6.6, CREAM);
  rose(g, faceAlongU(F, u1, 1), vc, 9.4, 1.8, CREAM, STAIN);
  const side = faceAlongV(F, vc+hw, 1);
  for (let u=u0+3; u<u1-3; u+=4.8) opening(g, side, u, 2, lancet(1.05, 6.8), CREAM, STAIN);
  const tp = F.W(u1-2.4, vc);
  LBox(g, 6.6, 12, 6.6, tp[0], 11, tp[1], WHITE, F.ry);
  for (const s of [-1, 1]){
    const q = F.W(u1-2.4, vc+s*2.8);
    LCone(g, 0.4, 3.4, q[0], 23, q[1], WHITE, 5);
  }
  LCone(g, 2.15, 13, tp[0], 23, tp[1], {c:'#3c434c', m:0, ds:true}, 8);
  LBox(g, 0.12, 2.4, 0.12, tp[0], 36, tp[1], CREAM);
  LBox(g, 0.9, 0.12, 0.12, tp[0], 37.5, tp[1], CREAM);
  return g;
});

// Kum Yan: a real glass grid, a finned tower and a flat cap, not a tinted box.
setBuild('s2004', 28, {m:1, c:'#d5e6f0', k:0.6}, function(){
  const it = BY.s2004, g = new THREE.Group(), F = frame(it.P), c = ctr(it.P);
  LPoly(g, it.P, 0, 11.5, {c:'#c5ced6', m:0, ds:true});
  const face = faceAlongV(F, F.v1, 1);
  const cols = Math.max(3, Math.round(F.du/4.2)), rows = 3;
  for (let i=0;i<cols;i++) for (let r=0;r<rows;r++){
    const u = F.u0 + F.du*(i+0.5)/cols;
    fan(g, face, u, [[-1.5, 1.1+r*3.3],[1.5, 1.1+r*3.3],[1.5, 3.5+r*3.3],[-1.5, 3.5+r*3.3]], 0.2, GLASS);
  }
  for (let u=F.u0; u<=F.u1; u+=F.du/cols){
    const q=F.W(u, F.v1);
    LBox(g, 0.22, 11.2, 0.45, q[0], 0.2, q[1], WHITE, F.ry);
  }
  const q = F.W(F.u1-4, (F.v0+F.v1)/2);
  LBox(g, 6.2, 16, 6.2, q[0], 8, q[1], {c:'#b9b6af', m:0, ds:true}, F.ry);
  for (let i=-2;i<=2;i++) LBox(g, 0.18, 12, 5.4, q[0]+i*0.7, 10, q[1], {c:'#8e9499', m:0, ds:true}, F.ry);
  LBox(g, 3.6, 3.4, 3.6, q[0], 20, q[1], GLASS, F.ry);
  LBox(g, 8.4, 0.7, 8.4, q[0], 23.6, q[1], {c:'#d5dbe0', glow:'#e7f3ff', gk:0.6, m:0, ds:true}, F.ry);
  // brown panel bay
  const b = F.W(F.u0+6, F.v0+4);
  LBox(g, 8, 11, 0.4, b[0], 0, b[1], {c:'#8a7362', m:0, ds:true}, F.ry);
  return g;
});

// Masjid Omar: a low white hall under red hips, and a minaret that stands on that hall.
setBuild('s2006', 34, WARM, function(){
  const it = BY.s2006, g = new THREE.Group(), F = frame(it.P);
  const uc=(F.u0+F.u1)/2, vc=(F.v0+F.v1)/2;
  const hw=Math.min(14, F.du*0.32), hd=Math.min(16, F.dv*0.32);
  boxAt(g, F, uc, vc, hw*2, 5.2, hd*2, 0, WHITE);
  const q = F.W(uc, vc);
  hipRoof(g, q[0], q[1], hw*2, hd*2, 5.2, 3.4, REDR, F.ry, 0.6);
  hipRoof(g, q[0], q[1], hw*1.1, hd*1.1, 8.2, 2.2, REDR, F.ry, 0.3);
  const side = faceAlongV(F, vc+hd, 1);
  for (let u=uc-hw+3; u<uc+hw-2; u+=4.5) opening(g, side, u, 0.8, archPts(1.2, 3.2), CREAM, DARK);
  // minaret on the corner of the hall
  const mx = uc+hw-1.2, mz = vc+hd-1.2, mp = F.W(mx, mz);
  LCyl(g, 1.85, 2.2, 20, mp[0], 0, mp[1], CREAM, 12);
  for (let y=3; y<18; y+=3.4){
    LCyl(g, 2.05, 2.05, 0.35, mp[0], y, mp[1], WHITE, 12);
    const face = faceAlongU(F, mx+1.9, 1);
    opening(g, face, mz, y+0.4, archPts(0.45, 1.6), CREAM, DARK);
  }
  LCyl(g, 2.5, 2.5, 0.8, mp[0], 19.6, mp[1], CREAM, 12);
  for (let i=0;i<8;i++){
    const a=i/8*PI*2;
    LBox(g, 0.45, 1.1, 0.45, mp[0]+Math.cos(a)*2.1, 20.2, mp[1]+Math.sin(a)*2.1, CREAM);
  }
  LLathe(g, [[0.2,0],[1.3,0.3],[1.7,1.4],[1.15,2.8],[0.4,4.1],[0.08,5]], mp[0], 21.2, mp[1], GOLD, 14);
  // gate posts along the front of the compound
  for (const u of [F.u0+2, F.u1-2]){
    const p = F.W(u, F.v1-1);
    LBox(g, 0.7, 3.2, 0.7, p[0], 0, p[1], WHITE);
    LSph(g, 0.35, p[0], 3.4, p[1], WHITE);
  }
  return g;
});

// Masjid Bencoolen: mint hall, three storeys of arches, a corner dome that clears the roof.
setBuild('s2007', 28, {m:0, c:'#e7fff2', k:0.75, e:0.4}, function(){
  const it = BY.s2007, g = new THREE.Group(), F = frame(it.P);
  const uc=(F.u0+F.u1)/2, vc=(F.v0+F.v1)/2;
  boxAt(g, F, uc, vc, F.du-1, 15.5, F.dv-1, 0, MINT);
  boxAt(g, F, uc, vc, F.du+0.4, 0.6, F.dv+0.4, 15.2, MINT2);
  const front = faceAlongV(F, F.v1, 1);
  const n = Math.max(5, Math.round(F.du/5.5));
  for (let i=0;i<n;i++){
    const u = F.u0 + F.du*(i+0.5)/n;
    opening(g, front, u, 0.4, archPts(1.55, 4.2), WHITE, DARK);
    opening(g, front, u, 5.6, archPts(1.25, 3.8), WHITE, DARK);
    opening(g, front, u, 10.4, archPts(1.05, 3.2), WHITE, DARK);
  }
  // corner tower from the ground, in front of the hall so the dome is seen
  const tu = F.u0+5, tv = F.v1-5;
  boxAt(g, F, tu, tv, 9, 17.5, 9, 0, MINT);
  const tq = F.W(tu, tv);
  LDome(g, 4.4, tq[0], 17.5, tq[1], GOLD, 0.9, 18);
  LCyl(g, 0.12, 0.28, 2.6, tq[0], 21.2, tq[1], GOLD, 6);
  const disc = LCyl(g, 0.7, 0.7, 0.12, tq[0]+0.55, 23.6, tq[1], GOLD, 12);
  disc.rotation.z = 0.6;
  const tu2 = F.u1-3, tv2 = F.v0+3;
  boxAt(g, F, tu2, tv2, 3.4, 22, 3.4, 0, MINT2);
  const q2 = F.W(tu2, tv2);
  LDome(g, 1.6, q2[0], 22, q2[1], GOLD, 0.75, 12);
  for (let y=4; y<20; y+=4) LBox(g, 3.6, 0.25, 3.6, q2[0], y, q2[1], WHITE, F.ry);
  return g;
});

// Sacred Heart: columned portico, pediment, and a tiered cupola with blue-trimmed windows.
setBuild('s2009', 36, WARM, function(){
  const it = BY.s2009, g = new THREE.Group(), F = frame(it.P);
  const vc=(F.v0+F.v1)/2, u0=F.u0+1.2, u1=F.u1-1.2, v0=F.v0+1, v1=F.v1-1;
  boxAt(g, F, (u0+u1)/2, vc, u1-u0, 11, v1-v0, 0, WHITE);
  const nq = F.W((u0+u1)/2, vc);
  gable(g, nq[0], nq[1], (u1-u0)*0.92, (v1-v0)*0.55, 11, 2.2, REDR, F.ry);
  const side = faceAlongV(F, v1, 1);
  for (let u=u0+3.5; u<u1-8; u+=4.4) opening(g, side, u, 1.5, archPts(1.15, 5.8), BLUEW, DARK);
  for (let i=0;i<6;i++){
    const v = v0 + (v1-v0)*(i+0.5)/6;
    const q = F.W(u1+1.1, v);
    LCyl(g, 0.48, 0.58, 8.2, q[0], 0, q[1], WHITE, 10);
  }
  boxAt(g, F, u1+1.1, vc, 1.4, 0.7, v1-v0, 8.2, WHITE);
  const ped = [F.W(u1+0.4, v0+0.8), F.W(u1+0.4, v1-0.8), F.W(u1+0.5, vc)];
  LTris(g, [ped[0][0],8.6,ped[0][1], ped[1][0],8.6,ped[1][1], ped[2][0],13.2,ped[2][1], ped[0][0],8.6,ped[0][1], ped[2][0],13.2,ped[2][1], ped[1][0],8.6,ped[1][1]], WHITE);
  const tp = F.W(u1-4.2, vc);
  LBox(g, 7.4, 10, 7.4, tp[0], 8, tp[1], WHITE, F.ry);
  LCyl(g, 3.15, 3.35, 8.5, tp[0], 18, tp[1], WHITE, 14);
  for (let i=0;i<8;i++){
    const a=i/8*PI*2;
    const q=[tp[0]+Math.cos(a)*3.2, tp[1]+Math.sin(a)*3.2];
    LBox(g, 0.35, 4.2, 0.8, q[0], 20, q[1], BLUEW, a);
  }
  LCyl(g, 3.5, 3.5, 0.4, tp[0], 26.4, tp[1], BLUEW, 14);
  LCyl(g, 2.3, 2.5, 4.2, tp[0], 26.8, tp[1], WHITE, 12);
  LDome(g, 2.3, tp[0], 31, tp[1], WHITE, 0.75, 14);
  LBox(g, 0.12, 2.6, 0.12, tp[0], 32.6, tp[1], CREAM);
  LBox(g, 0.85, 0.12, 0.12, tp[0], 34.4, tp[1], CREAM);
  return g;
});

// Chesed-El: projecting side bays, two arcades, balconies, a pediment with an oculus, red tiles.
setBuild('s2011', 18, WARM, function(){
  const it = BY.s2011, g = new THREE.Group(), F = frame(it.P);
  const uc=(F.u0+F.u1)/2, vc=(F.v0+F.v1)/2;
  boxAt(g, F, uc, vc, F.du-1, 11.5, F.dv-1, 0, WHITE);
  boxAt(g, F, F.u0+4, vc, 6, 12.4, F.dv+0.6, 0, WHITE);
  boxAt(g, F, F.u1-4, vc, 6, 12.4, F.dv+0.6, 0, WHITE);
  boxAt(g, F, uc, vc, F.du+0.6, 0.45, F.dv+0.4, 5.4, CREAM);
  boxAt(g, F, uc, vc, F.du+0.4, 0.55, F.dv+0.3, 11.6, CREAM);
  const front = faceAlongV(F, F.v1, 1);
  const n = Math.max(4, Math.round(F.du/4.2));
  for (let i=0;i<n;i++){
    const u = F.u0 + F.du*(i+0.5)/n;
    opening(g, front, u, 0.6, archPts(1.15, 3.6), CREAM, DARK);
    opening(g, front, u, 6.4, archPts(0.95, 3.2), CREAM, DARK);
    const q = F.W(u, F.v1+0.8);
    LBox(g, 2.2, 0.18, 1.1, q[0], 6.15, q[1], WHITE, F.ry);
  }
  LTris(g, [F.W(uc-5, F.v1)[0],12,F.W(uc-5, F.v1)[1], F.W(uc+5, F.v1)[0],12,F.W(uc+5, F.v1)[1], F.W(uc, F.v1+0.3)[0],16.2,F.W(uc, F.v1+0.3)[1]], WHITE);
  rose(g, front, uc, 13.6, 0.7, CREAM, DARK);
  const rq = F.W(uc, vc);
  hipRoof(g, rq[0], rq[1], Math.min(12, F.du*0.4), Math.min(8, F.dv*0.45), 11.8, 1.6, REDR, F.ry, 0.2);
  return g;
});

// Tan Si Chong Su: stone hall, red columns, two hips with upturned corners and a gold ridge.
setBuild('s2013', 16, {m:0, c:'#ffd0a0', k:0.9, e:0.5}, function(){
  const it = BY.s2013, g = new THREE.Group(), F = frame(it.P);
  const uc=(F.u0+F.u1)/2, vc=(F.v0+F.v1)/2;
  const Lu=Math.min(F.du-1, 22), Lv=Math.min(F.dv-1, 16);
  boxAt(g, F, uc, vc, Lu, 5.6, Lv, 0, {c:'#c9c3b8', m:0, ds:true});
  for (const du of [-Lu/2, Lu/2]) for (const dv of [-Lv/2, Lv/2]){
    const q = F.W(uc+du, vc+dv);
    LCyl(g, 0.42, 0.55, 6.2, q[0], 0, q[1], REDR, 8);
  }
  const q = F.W(uc, vc);
  hipRoof(g, q[0], q[1], Lu+1.4, Lv+1.4, 5.6, 2.8, {c:'#6a6e74', m:0, ds:true}, F.ry, 0.5);
  hipRoof(g, q[0], q[1], Lu*0.55, Lv*0.55, 8.2, 2.2, {c:'#5c6166', m:0, ds:true}, F.ry, 0.3);
  LCyl(g, 0.22, 0.22, Lu*0.7, q[0], 10.2, q[1], GOLD, 6, F.ry);
  for (const du of [-Lu/2-0.4, Lu/2+0.4]) for (const dv of [-Lv/2-0.4, Lv/2+0.4]){
    const e = F.W(uc+du, vc+dv);
    LCone(g, 0.35, 1.6, e[0], 6.4, e[1], GOLD, 5);
  }
  const door = faceAlongV(F, vc+Lv/2, 1);
  opening(g, door, uc, 0.2, archPts(1.4, 3.8), REDR, DARK);
  boxAt(g, F, uc, vc+Lv/2+1.2, 6, 0.35, 2.4, 3.6, REDR);
  return g;
});

// Red Dot: the long brick hall with arched windows, a white cupola, and the glass porch with red screens.
setBuild('s2010', 14, WARM, function(){
  const it = BY.s2010, g = new THREE.Group(), F = frame(it.P);
  const uc=(F.u0+F.u1)/2, vc=(F.v0+F.v1)/2;
  boxAt(g, F, uc, vc, F.du-0.6, 7.2, F.dv-0.6, 0, BRICK);
  boxAt(g, F, uc, vc, F.du+0.3, 0.55, F.dv+0.2, 7.1, CREAM);
  const front = faceAlongV(F, F.v1, 1);
  const n = Math.max(4, Math.round(F.du/4.5));
  for (let i=0;i<n;i++){
    const u = F.u0+F.du*(i+0.5)/n;
    opening(g, front, u, 1.1, archPts(1.05, 3.8), CREAM, DARK);
    opening(g, front, u, 0.15, archPts(0.7, 1.05), CREAM, DARK);
  }
  boxAt(g, F, uc, vc, 5.2, 5.5, 5.2, 7.4, BRICK);
  boxAt(g, F, uc, vc, 6, 0.45, 6, 12.6, CREAM);
  const cup = F.W(uc, vc);
  LDome(g, 1.6, cup[0], 13, cup[1], CREAM, 0.7, 12);
  // glass porch proud of the front, with white braces and red hanging screens
  boxAt(g, F, uc, F.v1+3.2, Math.min(F.du-2, 28), 6.4, 6, 0, GLASS);
  for (let i=-2;i<=2;i++){
    const q = F.W(uc+i*4.2, F.v1+3.2);
    const a = LBox(g, 0.28, 6.2, 0.28, q[0], 0, q[1], WHITE);
    a.rotation.z = i%2 ? 0.35 : -0.35;
    LBox(g, 1.3, 4.6, 0.12, q[0], 0.8, q[1], {c:'#c0392b', glow:'#ff5a40', gk:0.55, m:0, ds:true}, F.ry);
  }
  return g;
});

// Indian Heritage Centre: hex glass, a cantilevered concrete box on raking columns, a ribbed end.
setBuild('s2012', 20, {m:1, c:'#d5dee6', k:0.45}, function(){
  const it = BY.s2012, g = new THREE.Group(), F = frame(it.P);
  const uc=(F.u0+F.u1)/2, vc=(F.v0+F.v1)/2;
  const split = F.u0 + F.du*0.38;
  boxAt(g, F, (F.u0+split)/2, vc, split-F.u0-0.4, 15, F.dv-1, 0, {c:'#d5dee8', m:1, fh:1.5, cw:1.5, ds:true});
  // diamond mullions on the glass wing
  const face = faceAlongV(F, F.v1, 1);
  for (let i=0;i<8;i++){
    const u = F.u0 + (split-F.u0)*(i+0.5)/8;
    const q1 = F.W(u, F.v1+0.3), q2 = F.W(u+2.2, F.v1+0.3);
    LBeam(g, [q1[0], 1, q1[1]], [q2[0], 14, q2[1]], 0.12, WHITE, 4);
    LBeam(g, [q2[0], 1, q2[1]], [q1[0], 14, q1[1]], 0.12, WHITE, 4);
  }
  // cantilevered box
  boxAt(g, F, split+F.du*0.22, vc, F.du*0.42, 6.5, F.dv-2, 7.2, {c:'#b7b4ae', m:0, ds:true});
  boxAt(g, F, split+F.du*0.22, vc, F.du*0.36, 5.5, F.dv-6, 0.4, GLASS);
  for (const du of [-4, 0, 4]){
    const a = F.W(split+F.du*0.22+du, vc-2), b = F.W(split+F.du*0.22+du+1.6, vc+2);
    LBeam(g, [a[0], 0.2, a[1]], [b[0], 7.2, b[1]], 0.45, {c:'#9a9690', m:0, ds:true}, 5);
  }
  boxAt(g, F, F.u1-F.du*0.12, vc, F.du*0.2, 18, F.dv-1.5, 0, {c:'#2c3036', m:0, ds:true});
  for (let v=F.v0+2; v<F.v1-2; v+=1.6) boxAt(g, F, F.u1-0.4, v, 0.35, 17, 0.3, 0.4, {c:'#1a1d22', m:0, ds:true});
  // planted roof tray
  boxAt(g, F, split-2, vc, 8, 2.2, F.dv-4, 15, {c:'#3d6b45', m:0, ds:true});
  return g;
});

// China Cultural Centre: grey grid, a white blade, and a tower with an open bay and a red ring.
setBuild('s2046', 46, WARM, function(){
  const it = BY.s2046, g = new THREE.Group(), F = frame(it.P);
  const uc=(F.u0+F.u1)/2, vc=(F.v0+F.v1)/2;
  boxAt(g, F, uc, vc-2, F.du-2, 20, F.dv-6, 0, {c:'#c5c1b8', m:0, ds:true});
  const front = faceAlongV(F, F.v1-4, 1);
  for (let y=2; y<18; y+=4.2) for (let u=F.u0+4; u<F.u1-4; u+=4.4){
    fan(g, front, u, [[-1.3,y], [1.3,y], [1.3,y+2.4], [-1.3,y+2.4]], 0.25, GLASS);
  }
  // white faceted blade, no lettering
  const b0=F.W(uc, F.v1-1), b1=F.W(uc-2.2, F.v1-8), b2=F.W(uc+2.2, F.v1-8);
  const blade=[];
  const tri=(A,yA,B,yB,C,yC)=>blade.push(A[0],yA,A[1], B[0],yB,B[1], C[0],yC,C[1]);
  tri(b0,0, b1,0, b2,0); tri(b0,32, b2,32, b1,32);
  tri(b0,0, b0,32, b1,32); tri(b0,0, b1,32, b1,0);
  tri(b0,0, b2,0, b2,32); tri(b0,0, b2,32, b0,32);
  LTris(g, blade, WHITE);
  // tower with a void
  boxAt(g, F, uc, vc-6, 10, 16, 2.4, 20, GREY);
  boxAt(g, F, uc, vc+2, 10, 16, 2.4, 20, GREY);
  rose(g, faceAlongV(F, vc+0.2, 1), uc, 28, 2.4, {c:'#c0392b', glow:'#ff6a4a', gk:0.9, m:0, ds:true}, DARK);
  boxAt(g, F, uc, vc-2, 16, 2.4, 14, 36, {c:'#f4f1ea', glow:'#fff4d8', gk:0.45, m:0, ds:true});
  // glass link up the middle
  boxAt(g, F, uc, vc-2, 3.2, 16, 3.2, 20, GLASS);
  return g;
});

if (window.__sgx){
  window.__sgx.face = function(type){
    const it = BY[type]; if (!it) return 0.5;
    const P = it.P, c = ctr(P); let xx=0,zz=0,xz=0;
    for (const p of P){ const x=p[0]-c[0], z=p[1]-c[1]; xx+=x*x; zz+=z*z; xz+=x*z; }
    const base = 0.5*Math.atan2(2*xz, xx-zz);
    const span = ang => {
      const co=Math.cos(ang), si=Math.sin(ang); let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;
      for (const p of P){ const x=p[0]-c[0], z=p[1]-c[1], u=x*co+z*si, v=-x*si+z*co;
        if (u<u0)u0=u; if (u>u1)u1=u; if (v<v0)v0=v; if (v>v1)v1=v; }
      return [u1-u0, v1-v0, -Math.atan2(si, co)];
    };
    let a = span(base); if (a[1] > a[0]) a = span(base+Math.PI/2);
    return a[2];
  };
  const look = window.__sgx.look.bind(window.__sgx);
  window.__sgx.look = function(type, dist, heading, elev, night, aim, solo){
    const ok = look(type, dist, heading, elev, night, aim);
    if (solo && ok){
      const L = landmarks.find(q => q.type === type);
      const keep = L ? lmMeshes.get(L.id) : null;
      for (const [, mesh] of lmMeshes) mesh.visible = mesh === keep;
      if (typeof city !== 'undefined') city.visible = false;
      if (typeof sgGroup !== 'undefined') sgGroup.visible = false;
      if (typeof SGR !== 'undefined' && SGR.group) SGR.group.visible = false;
      if (typeof forestMesh !== 'undefined' && forestMesh) forestMesh.visible = false;
      if (typeof roadGroup !== 'undefined') roadGroup.visible = false;
      if (typeof flowGroup !== 'undefined') flowGroup.visible = false;
      scene.traverse(obj => {
        if (obj.name && (obj.name.indexOf('sgbld') === 0 || obj.name.indexOf('sgr-') === 0)) obj.visible = false;
      });
      document.querySelectorAll('.lbl').forEach(el => { el.style.display = 'none'; });
    }
    return ok;
  };
}
}
