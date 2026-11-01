{
const {register,rect,scale,center,out}=SGLI;

// Local architectural frame mapped back to the OSM east/south coordinates.
function kit(b,a=0,ox=0,oz=0){
 const C=Math.cos(a),S=Math.sin(a),T=(x,y,z)=>[ox+x*C+z*S,y,oz-x*S+z*C];
 const P=R=>R.map(([x,z])=>{const q=T(x,0,z);return [q[0],q[2]];});
 const box=(x,y,z,w,h,d,c,m=0)=>{const q=T(x,y,z);b.box(q[0],y,q[2],w,h,d,c,a,m);};
 const beam=(p,q,w,c)=>b.beam(T(...p),T(...q),w,c);
 const quad=(c,p,q,r,s,m=0)=>b.quad(c,T(...p),T(...q),T(...r),T(...s),m);
 const prism=(R,lo,hi,c,m=0)=>b.prism(P(R),lo,hi,c,m);
 const ring=(x,z,r,n=12)=>Array.from({length:n},(_,i)=>[x+r*Math.cos(i/n*Math.PI*2),z+r*Math.sin(i/n*Math.PI*2)]);
 const lathe=(x,z,y,r,h,c,m=0,profile=null,n=12)=>{
  const A=profile||[[.7,0],[1,.16],[1.08,.36],[.93,.58],[.58,.8],[.15,.96],[0,1]];
  for(let j=0;j<A.length-1;j++)for(let i=0;i<n;i++){
   const t=i/n*Math.PI*2,u=(i+1)/n*Math.PI*2,[r0,y0]=A[j],[r1,y1]=A[j+1];
   quad(c,[x+r*r0*Math.cos(t),y+h*y0,z+r*r0*Math.sin(t)],[x+r*r0*Math.cos(u),y+h*y0,z+r*r0*Math.sin(u)],[x+r*r1*Math.cos(u),y+h*y1,z+r*r1*Math.sin(u)],[x+r*r1*Math.cos(t),y+h*y1,z+r*r1*Math.sin(t)],m);
  }
 };
 const frustum=(x,z,y,w,d,wt,dt,h,c,m=0)=>{const R=rect(x,z,w,d),Q=rect(x,z,wt,dt);for(let i=0;i<4;i++){const j=(i+1)%4;quad(c,[...R[i].slice(0,1),y,R[i][1]],[R[j][0],y,R[j][1]],[Q[j][0],y+h,Q[j][1]],[Q[i][0],y+h,Q[i][1]],m);}b.cap(P(Q),y+h,c,m);};
 const faces=R=>{let area=0;R.forEach((p,i)=>{const q=R[(i+1)%R.length];area+=p[0]*q[1]-q[0]*p[1];});return R.map((p,i)=>{const q=R[(i+1)%R.length],L=Math.hypot(q[0]-p[0],q[1]-p[1]),ex=(q[0]-p[0])/L,ez=(q[1]-p[1])/L,s=area>0?1:-1;return {L,F:(u,y,w=0)=>[p[0]+ex*u+ez*s*w,y,p[1]+ez*u-ex*s*w]};});};
 const panel=(F,u,y,w,h,c,off=.06,m=0)=>quad(c,F(u-w/2,y,off),F(u+w/2,y,off),F(u+w/2,y+h,off),F(u-w/2,y+h,off),m);
 const arch=(F,u,y,w,h,c,off=.06,m=0,cusps=0)=>{
  const O=[[-w/2,0],[w/2,0]],n=24;
  for(let i=0;i<=n;i++){const t=i/n*Math.PI,r=w/2*(1-(cusps?.13*(1-Math.abs(Math.sin(cusps*t))):0));O.push([Math.cos(t)*r,h-w/2+Math.sin(t)*r]);}
  const I=THREE.ShapeUtils.triangulateShape(O.map(p=>new THREE.Vector2(...p)),[]);for(const t of I)b.tri(c,...t.map(i=>T(...F(u+O[i][0],y+O[i][1],off))),m);
 };
 const arcTrim=(F,u,y,w,h,c,cusps=0)=>{let prev=null;for(let i=0;i<=32;i++){const t=i/32*Math.PI,r=w/2*(1-(cusps?.13*(1-Math.abs(Math.sin(cusps*t))):0)),p=F(u+Math.cos(t)*r,y+h-w/2+Math.sin(t)*r,.16);if(prev)beam(prev,p,.13,c);prev=p;}for(const s of [-1,1])beam(F(u+s*w/2,y,.16),F(u+s*w/2,y+h-w/2,.16),.14,c);};
 const palette=['#739ec5','#dc9baf','#c4b0d3','#ecc15c','#f0dfcc','#64a8a0','#d76352','#747ac0'];
 const deity=(F,u,y,h,i,m=3)=>{const skin=i%3?'#d6b29b':'#6a9fc7',robe=palette[i%palette.length];
  // Projected three-dimensional relief: skirt, torso, head, crown and bent arms.
  const cube=(du,dy,dw,w,hh,d,c)=>{const p=F(u+du,y+dy,dw);box(p[0],p[1],p[2],w,hh,d,c,m);};
  cube(0,0,.25,.40*h,.18*h,.34*h,robe);cube(0,.16*h,.24,.25*h,.4*h,.3*h,robe);
  cube(0,.58*h,.27,.19*h,.2*h,.23*h,skin);cube(0,.79*h,.27,.16*h,.16*h,.21*h,'#e8c364');
  for(const s of [-1,1]){const A=F(u+s*.1*h,y+.49*h,.3),B=F(u+s*.32*h,y+.39*h,.42),Q=F(u+s*.34*h,y+.6*h,.46);beam(A,B,.1*h,skin);beam(B,Q,.09*h,skin);}
  panel(F,u,y+.3*h,.06*h,.24*h,'#e8c364',.43,m);
 };
 const tower=(x,z,w,d,base,top,tiers,m=3)=>{
  const th=(top-base-2.3)/tiers;
  for(let k=0;k<tiers;k++){
   const f=k/tiers,W=w*(1-.49*f),D=d*(1-.43*f),Y=base+k*th;
   frustum(x,z,Y,W,D,W-.65,D-.42,th-.30,'#9ba9ba',m);
   box(x,Y+th-.34,z,W+.45,.22,D+.4,'#cba5c1',m);box(x,Y+th-.12,z,W+.65,.12,D+.6,'#738bb8',m);
   for(const {F,L}of faces(rect(x,z,W,D))){const n=Math.max(2,Math.floor(L/1.05));for(let j=0;j<n;j++){const u=(j+.5)*L/n;panel(F,u,Y+.22,.78,th-.5,'#4d728e',.035,m);deity(F,u,Y+.26,Math.min(1.6,th-.5),j+k*7,m);if(j%2===0){const p=F(u,Y+th,.12);lathe(p[0],p[2],p[1],.22,.42,palette[(j+k)%8],m,null,8);}}}
  }
  // Barrel-shaped sala crown and a row of kalasam finials.
  const Y=top-2.3,W=w*.51,D=d*.57;
  box(x,Y,z,W,.4,D,'#97b4cf',m);
  for(let i=0;i<12;i++){const t=i/12*Math.PI,q=(i+1)/12*Math.PI;quad('#bfa5c6',[x-W/2,Y+.4+Math.sin(t)*1.15,z+Math.cos(t)*D/2],[x+W/2,Y+.4+Math.sin(t)*1.15,z+Math.cos(t)*D/2],[x+W/2,Y+.4+Math.sin(q)*1.15,z+Math.cos(q)*D/2],[x-W/2,Y+.4+Math.sin(q)*1.15,z+Math.cos(q)*D/2],m);}
  for(let i=0;i<7;i++)lathe(x+(i-3)*W/7,z,top-.72,.16,.72,'#d6b35d',m,null,8);
 };
 const tiledRoof=(x,z,w,d,y,h,c)=>{
  // Equal-pitch hips converge onto the short ridge implied by the real plan.
  const R=rect(x,z,w,d),longX=w>=d,r=Math.abs(w-d)/2;
  const A=longX?[x-r,z]:[x,z-r],B=longX?[x+r,z]:[x,z+r];
  const Q=longX?[A,B,B,A]:[A,A,B,B];
  for(let i=0;i<4;i++){
   const j=(i+1)%4;quad(c,[R[i][0],y,R[i][1]],[R[j][0],y,R[j][1]],[Q[j][0],y+h,Q[j][1]],[Q[i][0],y+h,Q[i][1]]);
   const n=Math.ceil(Math.hypot(R[j][0]-R[i][0],R[j][1]-R[i][1])/.28);
   for(let k=0;k<n;k++){
    const t=(k+.5)/n,px=R[i][0]+(R[j][0]-R[i][0])*t,pz=R[i][1]+(R[j][1]-R[i][1])*t;
    const dx=B[0]-A[0],dz=B[1]-A[1],v=Math.max(0,Math.min(1,((px-A[0])*dx+(pz-A[1])*dz)/(dx*dx+dz*dz||1)));
    beam([px,y,pz],[A[0]+dx*v,y+h,A[1]+dz*v],.055,'#a88466');
   }
  }
  beam([A[0],y+h,A[1]],[B[0],y+h,B[1]],.23,'#75614f');
 };
 return {T,P,box,beam,quad,prism,ring,lathe,frustum,faces,panel,arch,arcTrim,palette,deity,tower,tiledRoof};
}
// Dedicated architectural illumination still uses the app's shared lmMat cache.
// Ordinary surfaces continue through SGBV's shared batched PBR materials.
function lights(b,g){for(const mode of [3,4,5,8])if(b.buckets.has(mode)){const q=new SGLI.Batch(b.base);q.buckets.set(mode,b.buckets.get(mode));q.flush(g,()=>lmMat(mode===5?{c:'#ffffff',vc:true,ds:true,glow:'#ffe0ad',gk:.85}:{c:'#ffffff',vc:true,ds:true,m:0,lc:mode===4?'#85e998':'#ffe3bf',lk:mode===4?.8:mode===8?1.25:.7}));b.buckets.delete(mode);}}

register('tan_teng_niah','陈东龄故居','House of Tan Teng Niah',23,(b,D,G,g)=>{
 const K=kit(b,2.49),{box,faces,panel,arch,arcTrim,beam,quad,lathe}=K;
 const P=[[-5.8,-12],[8.75,-12],[8.75,3.45],[5.5,3.45],[5.5,12.75],[-2.7,12.75],[-2.7,3.45],[-5.8,3.45]];
 const colors=['#d94f67','#e5bd42','#367bb1','#3b9e79','#9766ad','#df7e46','#bd4540','#51aeb1'];
 b.prism(D.parts[0].p,-.7,.32,'#8d897b');
 // The upper floor projects above a recessed entrance five-foot way.
 K.prism(P,3.85,7.6,'#4d8bc3');
 const lower=[[-5.8,-12],[8.75,-12],[8.75,3.45],[5.5,3.45],[5.5,11.15],[-2.7,11.15],[-2.7,3.45],[-5.8,3.45]];
 K.prism(lower,.32,3.85,'#548ec4');
 let index=0;
 for(const E of faces(P)){
  const front=E.F(E.L/2,0)[2]>12;
  const lit=front?8:3;
  const n=Math.max(1,Math.round(E.L/2.65)),bay=E.L/n;
  for(let j=0;j<n;j++,index++){
   const u=(j+.5)*bay,w=Math.min(1.4,bay*.63),col=front?['#d48f9c','#e2c34e','#71b0b5'][j%3]:'#8fba9b';
   if(front)panel(E.F,u,3.92,bay-.06,3.35,['#a65d65','#447363','#a65a52'][j%3],.025,lit);
   // Deep painted shutter rebates, contrasting lunettes and carved floral panels.
   if(front){arch(E.F,u,4.35,w+.32,2.75,'#d9c58f',.06,lit);arch(E.F,u,4.47,w+.07,2.53,'#577c60',.09,lit);}
   else{panel(E.F,u,4.35,w+.32,2.75,'#c9d6bd',.06,lit);panel(E.F,u,4.47,w+.07,2.53,'#94b397',.09,lit);}
   panel(E.F,u,4.48,w,1.94,'#454941',.11);
   for(const s of [-1,1]){
    panel(E.F,u+s*w*.25,4.52,w*.45,1.89,col,.13,lit);
    for(let y=4.75;y<6.32;y+=.17)beam(E.F(u+s*w*.25-w*.18,y,.16),E.F(u+s*w*.25+w*.18,y,.16),.052,front?['#4a9f94','#d0b848','#5d85b1'][j%3]:'#a2bb9d');
    panel(E.F,u+s*w*.25,4.58,w*.3,.4,front?['#6ba5b7','#a5bd80','#c897aa'][j%3]:'#a2be9f',.18,lit);
   }
   if(front)arcTrim(E.F,u,4.35,w+.35,2.78,'#d7b044');
   if(front)for(let t=0;t<5;t++){const a=t/5*Math.PI;panel(E.F,u+Math.cos(a)*w*.32,6.65+Math.sin(a)*.23,.1,.12,'#d8bb65',.19,lit);}
   if(front)for(const v of [j*bay,(j+1)*bay]){
    panel(E.F,v,3.88,.26,3.5,colors[(index+3)%8],.15,lit);
    for(const s of [-1,1])beam(E.F(v+s*.08,4.15,.18),E.F(v+s*.08,6.95,.18),.042,'#e8c76c');
    panel(E.F,v,7.04,.48,.28,colors[(index+5)%8],.2,lit);
   }
   if(!front){panel(E.F,u,.75,w+.25,2.5,'#b6c5ac',.06);panel(E.F,u,.8,w,2,'#6f945d',.08);for(let y=1;y<2.65;y+=.18)beam(E.F(u-w*.43,y,.1),E.F(u+w*.43,y,.1),.045,'#a8b382');}
  }
  // Painted cornices, tiny bracket dentils, individually coloured fascia boards.
  for(const [y,h,c]of [[3.65,.18,'#c49939'],[3.84,.16,'#438e6b'],[7.3,.15,'#d4af61'],[7.55,.16,'#6b648a']]){
   beam(E.F(0,y,.15),E.F(E.L,y,.15),h,front?c:'#b2c3ad');
  }
  for(let u=.12;u<E.L;u+=.28){panel(E.F,u,7.7,.23,.52,front?colors[Math.floor(u/.28)%8]:'#c2cebb',.3,lit);const p=E.F(u,7.25,.18),q=E.F(u,7.5,.4);beam(p,q,.10,'#c4b39b');}
 }
 // Recessed red front wall and richly carved timber doors, all inscription panels blank.
 const F=(u,y,w=0)=>[u+1.4,y,11.18+w];
 panel(F,0,.35,8.18,3.45,'#b9494e',.01,8);
 for(const u of [-2.55,0,2.55]){
  panel(F,u,.5,u===0?1.7:1.45,2.65,'#bfaa78',.05);
  for(const s of [-1,1])for(let j=0;j<3;j++){
   const x=u+s*(u===0?.4:.34),y=.7+j*.72;panel(F,x,y,.52,.55,'#8f7651',.075);panel(F,x,y+.05,.42,.44,'#c6b485',.085);
  }
  panel(F,u,3.2,1.9,.38,'#4e7587',.07,3);
 }
 for(const [x,c]of [[-2.48,'#3c78b4'],[5.28,'#d6bd4a']]){
  box(x,.3,12.48,.55,3.55,.58,c,8);box(x,.3,12.48,.76,.25,.8,'#454f48');box(x,3.65,12.48,.75,.2,.8,'#b3a07a');
  // Warm globe lamps in the 2023 night photograph.
  lathe(x,12.8,3.85,.2,.35,'#efce83',5,null,10);
 }
 box(1.4,3.78,12,8.6,.15,2,'#c6b68c');
 // Two intersecting Chinese bamboo-tile hip roofs, visible ridge and narrow tile rolls.
 K.tiledRoof(1.47,-4.3,16.1,17.2,7.8,3.585,'#b17454');
 const q=K.T(1.4,0,8.2),R=kit(b,2.49+Math.PI/2,q[0],q[2]);R.tiledRoof(0,0,10.5,9.4,7.8,3.135,'#b97a58');
 // Shallow over-door tiled canopy and modest rear air-conditioning plant.
 box(1.4,3.8,11.8,8.7,.16,2.15,'#4e8076');
 for(let u=-2.8;u<5.8;u+=.28)beam([u,3.95,10.8],[u,3.85,12.8],.08,'#5e927e');
 for(const x of [-3.8,7.2])box(x,2.7,-11.9,1,.65,.5,'#c3bdb0');
 lights(b,g);
},['sgtantengniah']);

}
