{
const {register,rect,scale,center,out}=SGLI;

// Local architectural frame mapped back to the OSM east/south coordinates.
function kit(b,a=0,ox=0,oz=0){
 const C=Math.cos(a),S=Math.sin(a),T=(x,y,z)=>[ox+x*C+z*S,y,oz-x*S+z*C];
 const P=R=>R.map(([x,z])=>{const q=T(x,0,z);return [q[0],q[2]];});
 const box=(x,y,z,w,h,d,c,m=0)=>{const q=T(x,y,z);b.box(q[0],y,q[2],w,h,d,c,a,m);};
 const beam=(p,q,w,c,m=0)=>{
  const start=b.buckets.get(0)?.p.length||0;b.beam(T(...p),T(...q),w,c);
  if(m){const A=b.buckets.get(0);if(!A||A.p.length===start)return;let B=b.buckets.get(m);if(!B){B={p:[],c:[]};b.buckets.set(m,B);}B.p.push(...A.p.splice(start));B.c.push(...A.c.splice(start));}
 };
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
  const skirt=F(u,y,.25);frustum(skirt[0],skirt[2],y,.40*h,.34*h,.23*h,.24*h,.34*h,robe,m);
  cube(0,.2*h,.24,.25*h,.36*h,.3*h,robe);
  const head=F(u,y+.58*h,.27);
  lathe(head[0],head[2],head[1],.115*h,.22*h,skin,m,[[0,0],[.85,.12],[1,.48],[.8,.87],[0,1]],6);
  lathe(head[0],head[2],y+.79*h,.11*h,.18*h,'#e8c364',m,[[1,0],[.85,.35],[.4,.8],[0,1]],6);
  for(const s of [-1,1]){const A=F(u+s*.1*h,y+.49*h,.3),B=F(u+s*.32*h,y+.39*h,.42),Q=F(u+s*.34*h,y+.6*h,.46);beam(A,B,.1*h,skin,m);beam(B,Q,.09*h,skin,m);}
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
  const R=rect(x,z,w,d);const Q=[[x-w*.3,z],[x+w*.3,z],[x+w*.3,z],[x-w*.3,z]];
  for(let i=0;i<4;i++){const j=(i+1)%4;quad(c,[R[i][0],y,R[i][1]],[R[j][0],y,R[j][1]],[Q[j][0],y+h,Q[j][1]],[Q[i][0],y+h,Q[i][1]]);}
  beam([x-w*.3,y+h,z],[x+w*.3,y+h,z],.23,'#75614f');
  for(let u=-w*.48;u<w*.49;u+=.28)for(const s of [-1,1])beam([x+u,y,z+s*d/2],[x+u*.6,y+h,z],.055,'#a88466');
 };
 return {T,P,box,beam,quad,prism,ring,lathe,frustum,faces,panel,arch,arcTrim,palette,deity,tower,tiledRoof};
}
// Dedicated architectural illumination still uses the app's shared lmMat cache.
// Ordinary surfaces continue through SGBV's shared batched PBR materials.
function lights(b,g){for(const mode of [3,4,5,8])if(b.buckets.has(mode)){const q=new SGLI.Batch(b.base);q.buckets.set(mode,b.buckets.get(mode));q.flush(g,()=>lmMat(mode===5?{c:'#ffffff',vc:true,ds:true,glow:'#ffe0ad',gk:.85}:{c:'#ffffff',vc:true,ds:true,m:0,lc:mode===4?'#85e998':'#ffe3bf',lk:mode===4?.8:mode===8?.65:1.65}));b.buckets.delete(mode);}}

// The legacy anchor/OSM 481614952 is an ancillary building; see REVIEW.md.
register('srinivasa_perumal','斯里尼维沙柏鲁马兴都庙','Sri Srinivasa Perumal Temple',80,(b,D,G,g)=>{
 const K=kit(b,1.504,37.5,24.5),W=kit(b),{box,lathe,tower,panel,deity}=K;
 const gate=D.parts.find(p=>p.id===481614952).p;
 b.prism(gate,-.7,4.8,'#dbdcd0');
 b.cap(gate,4.85,'#e8e8dd');b.rim(gate,5,'#bbc9c6',.16);
 for(const E of W.faces(gate))for(let u=1.3;u<E.L;u+=2.5){W.panel(E.F,u,.9,1.2,2.3,'#7eaaa9',.06,2);}
 b.box(54.5,4.85,1.4,5,.13,8,'#87b3bd');
 box(0,.3,0,13.3,6.6,9.5,'#718894');
 const F=(u,y,w=0)=>[u,y,4.78+w];
 panel(F,0,.35,3.1,5.15,'#263f3f',.05);panel(F,0,.4,2.6,4.5,'#87714b',.07,8);
 for(const s of [-1,1]){panel(F,s*6.1,.5,.4,5.8,'#d7cba7',.12,3);deity(F,s*3.35,1,2.75,s+4,8);deity(F,s*5.3,1.3,2.1,s+7,8);}
 box(0,6.6,0,13.8,.38,10,'#caa3aa',3);tower(0,0,13.2,9.3,7,18,5);
 // Central shrine recesses interrupt the figure bands on the road-facing tiers.
 for(let k=0;k<5;k++){
  const Y=7+k*1.74,D=9.3*(1-.43*k/5);
  panel((u,y,w=0)=>[u,y,D/2+w],0,Y+.12,.85,1.3,'#334d51',.08);
 }
 panel(F,0,5.7,3.1,.14,'#e5d3ac',.13,5);
 // Temple halls and side buildings use all four mapped OSM temple outlines.
 const heights={454182405:7.3,454182408:7.9,454182454:6.8,455155906:14.8};
 for(const part of D.parts.filter(p=>p.id!==481614952)){
  const P=part.p,H=heights[part.id];b.prism(P,-.7,H,'#e6d9ba');b.cap(P,H+.04,'#a49275');b.rim(P,H+.24,'#c3aa71',.32);
  if(part.id===455155906){
   // PGP Hall is a three-storey civic hall, not a single-storey temple arcade.
   const C=center(P),angle=.748;
   b.cap(P,(x,z)=>14.8+.6*Math.max(0,1-Math.abs((x-C[0])*Math.sin(angle)+(z-C[1])*Math.cos(angle))/14),'#bfc3bc');
   for(const E of W.faces(P)){
    const n=Math.max(1,Math.round(E.L/3.5)),bw=E.L/n;
    for(let j=0;j<n;j++){
     const u=(j+.5)*bw;
     W.panel(E.F,u,.65,bw-.35,3.5,'#617578',.08,2);
     for(const y of [4.9,9.5])W.panel(E.F,u,y,1,2.5,'#8b9290',.08,2);
     // Recessed square floral lattice and raised pale lotus-like rosettes.
     for(let k=0;k<3;k++)for(let f=0;f<2;f++){
      const v=u+(k-1)*bw*.25,y=8+f*2.3;W.panel(E.F,v,y,.64,.64,'#b49a9b',.06);
      W.panel(E.F,v,y+.07,.5,.5,'#e5d9c5',.09);
     }
     if(j%2===0)for(const [du,dy]of [[0,0],[-.32,.32],[.32,.32],[0,.65]])W.panel(E.F,u+du,8.9+dy,.4,.4,'#efe8d5',.13);
    }
    for(const y of [4.5,6.7,13.9])b.beam(E.F(0,y,.15),E.F(E.L,y,.15),.24,'#c4aca4');
    b.beam(E.F(0,4.3,1),E.F(E.L,4.3,1),.18,'#c6c8bd');
   }
   b.roof(scale(P,.87),14.8,1);
   continue;
  }
  for(const E of W.faces(P)){
   const n=Math.max(1,Math.floor(E.L/3.25));
   for(let j=0;j<n;j++){
    const u=(j+.5)*E.L/n;W.arch(E.F,u,.65,Math.min(2,E.L/n-.35),4,'#465a59',.06);W.arcTrim(E.F,u,.65,Math.min(2,E.L/n-.35),4,'#dfcdb1');
    W.panel(E.F,u,H-1.6,Math.min(2,E.L/n-.2),.52,'#9a6257',.08);
    const p=E.F(j*E.L/n,.1,.12);b.box(p[0],.1,p[2],.33,H-.1,.33,'#c0ab7d');
    if(j%2===0){const q=E.F(u,H+.35,.03);b.box(q[0],H+.35,q[2],.7,.55,.7,'#c5bfaa');W.lathe(q[0],q[2],H+.9,.45,.6,'#ceac64',3,null,8);}
   }
  }
 }
 // Sanctum above the northeast/southwest axis of the main mandapam.
 const S=kit(b,.017,20,10);S.tower(0,0,7.1,7.1,6.9,14.1,2);
 for(const [x,z]of [[18.2,31.8],[-28,10]]){
  const T=kit(b,.017,x,z);T.tower(0,0,3.6,3.6,7.4,11.6,1);
 }
 // Red/white short boundary wings on either side of the entrance; no oversized landuse slab.
 for(const s of [-1,1]){
  box(s*12.1,.15,3.8,10.5,2.7,.42,'#ece4cd');box(s*12.1,2.8,3.8,10.8,.16,.65,'#d0b273');
  for(let u=7;u<17;u+=.9)box(s*u,.3,4.03,.43,2.4,.035,'#a74839');
 }
 // Documented covered link between gateway and mandapam, not a filled courtyard.
 const link=kit(b,.015,27,23.5);
 link.box(0,5.2,0,19,.18,3.8,'#b6c3b6');
 for(const x of [-8,-3,3,8])for(const z of [-1.6,1.6])link.box(x,.2,z,.17,5,.17,'#c9c8b2');
 // Silver flagstaff and low stepped entrance plinth.
 W.lathe(29,24,.3,.55,11.3,'#c7be8e',0,[[1,0],[.6,.08],[.2,.1],[.14,1]],10);
 for(let i=0;i<3;i++)box(0,i*.13,6.4-i*.3,4.2,.13,.6,'#c4bca8');
 lights(b,g);
},['srinivasa']);

}
