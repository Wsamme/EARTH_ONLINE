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
  const R=rect(x,z,w,d);const Q=[[x-w*.3,z],[x+w*.3,z],[x+w*.3,z],[x-w*.3,z]];
  for(let i=0;i<4;i++){const j=(i+1)%4;quad(c,[R[i][0],y,R[i][1]],[R[j][0],y,R[j][1]],[Q[j][0],y+h,Q[j][1]],[Q[i][0],y+h,Q[i][1]]);}
  beam([x-w*.3,y+h,z],[x+w*.3,y+h,z],.23,'#75614f');
  for(let u=-w*.48;u<w*.49;u+=.28)for(const s of [-1,1])beam([x+u,y,z+s*d/2],[x+u*.6,y+h,z],.055,'#a88466');
 };
 return {T,P,box,beam,quad,prism,ring,lathe,frustum,faces,panel,arch,arcTrim,palette,deity,tower,tiledRoof};
}
// Dedicated architectural illumination still uses the app's shared lmMat cache.
// Ordinary surfaces continue through SGBV's shared batched PBR materials.
function lights(b,g){for(const mode of [3,4,5])if(b.buckets.has(mode)){const q=new SGLI.Batch(b.base);q.buckets.set(mode,b.buckets.get(mode));q.flush(g,()=>lmMat(mode===5?{c:'#ffffff',vc:true,ds:true,glow:'#ffe0ad',gk:.85}:{c:'#ffffff',vc:true,ds:true,m:0,lc:mode===4?'#85e998':'#ffe3bf',lk:mode===4?.8:2.65}));b.buckets.delete(mode);}}

// OSM 155991884 (hall), 1078263462 (annex). Painted plaster relief is geometry.
register('veeramakaliamman','维拉马卡里亚曼兴都庙','Sri Veeramakaliamman Temple',38,(b,D,G,g)=>{
 const K=kit(b,1.012),{box,beam,faces,panel,arch,lathe,tower,deity}=K;
 const hall=D.parts[0].p,annex=D.parts[1].p;
 b.prism(hall,-1,7.2,'#bcb5a1');b.cap(hall,7.23,'#5f7964');
 b.prism(annex,-1,24.2,'#ede5d3');b.cap(annex,24.22,'#a6a69a');
 // Six-storey annex: red end walls, paired small windows and pedimented central bay.
 for(const E of kit(b).faces(annex)){
  const n=Math.max(1,Math.round(E.L/3.3));
  for(let f=0;f<6;f++){const y=.55+f*3.8;
   for(let j=0;j<n;j++){const u=(j+.5)*E.L/n;
    for(const s of [-1,1]){kit(b).panel(E.F,u+s*.37,y+1,.45,1.25,'#35464c',.08,2);}
    if(j===Math.floor(n/2)){kit(b).panel(E.F,u,y+.7,1.9,2,'#d0c9b7',.04);kit(b).arch(E.F,u,y+2.5,2,.7,'#f8ecdb',.11);}
   }
   const p=E.F(0,y+3.55,.15),q=E.F(E.L,y+3.55,.15);b.beam(p,q,.18,'#a36762');
  }
  for(const u of [.4,E.L-.4])kit(b).panel(E.F,u,.3,.8,23.6,'#a25151',.13);
 }
 b.rim(annex,24.6,'#e8ddc7',.3);b.prism(scale(annex,.45),24.2,26.9,'#d5d2c7');
 b.roof(scale(annex,.86),24.25);
 // Hall's alternating red/white compound panels and sculpted parapet shrines.
 for(const E of kit(b).faces(hall)){
  for(let u=.25;u<E.L;u+=.85)kit(b).panel(E.F,u,.7,.41,5.2,'#a3473c',.04);
  for(let u=.7;u<E.L;u+=2.2){const p=E.F(u,7.45,.05);b.box(p[0],7.45,p[2],.85,.6,.65,'#a6bbc6');kit(b).deity(E.F,u,7.5,.9,Math.floor(u),3);}
 }
 b.rim(hall,7.25,'#d1b365',.25);b.rim(hall,7.5,'#9eb9cf',.25);
 // Gateway straddles the measured street wall at local z=24.1 (east/southeast).
 // The previous centre at z=21.1 put its front against the wall and read as a roof tower.
 box(-.6,.35,24.1,10,6.6,5.9,'#a3c0c9',3);
 const F=(u,y,w=0)=>[u-.6,y,27.08+w];
 panel(F,0,.45,3.4,5.1,'#243a38',.05);panel(F,0,.6,2.9,4.5,'#8f7340',.075,5);
 for(const u of [-4,-2.9,2.9,4]){panel(F,u,.7,.25,5.8,'#e1d8b0',.12,3);deity(F,u,1.4,2.2,Math.floor(u+5),3);}
 tower(-.6,24.1,9.8,5.7,6.95,18.9,4);
 // Main Kali vimana plus smaller sanctum towers, clear of the front court.
 tower(-.5,2.2,5.7,5.7,7.3,14.1,2);lathe(-.5,2.2,13.7,1.03,1.4,'#cfb365',3,null,16);
 for(const [x,z]of [[-6.5,5.4],[5.2,5.4],[-6.8,12],[5.8,12]])tower(x,z,2.5,2.5,7.3,10.9,1);
 // Green ribbed hall roof and pale barrel skylight visible in the reference views.
 for(let z=0;z<17;z+=3.1)box(0,7.3,z,17.4,.16,.13,'#a7ad8b');
 // Small red sheet-roofed side bay immediately north of the gateway.
 box(11.5,7.35,20.1,7.4,.16,7.1,'#bb705f');
 for(let i=0;i<12;i++){const t=i/12*Math.PI,u=(i+1)/12*Math.PI;K.quad('#d0d2c4',[-8,7.4+Math.sin(t)*1.3,9+Math.cos(t)*2],[8,7.4+Math.sin(t)*1.3,9+Math.cos(t)*2],[8,7.4+Math.sin(u)*1.3,9+Math.cos(u)*2],[-8,7.4+Math.sin(u)*1.3,9+Math.cos(u)*2]);}
 lathe(-.6,16.6,.3,.55,10.9,'#c3c5b9',0,[[1,0],[.6,.1],[.2,.12],[.15,1]],8);
 // White entrance canopy: modest projection, no festival decorations or lettering.
 for(let i=0;i<10;i++){const t=i/10*Math.PI,u=(i+1)/10*Math.PI;K.quad('#deded3',[-.6+3.5*Math.cos(t),4.2+1.4*Math.sin(t),26.9],[-.6+3.5*Math.cos(t),4.2+1.4*Math.sin(t),29.9],[-.6+3.5*Math.cos(u),4.2+1.4*Math.sin(u),29.9],[-.6+3.5*Math.cos(u),4.2+1.4*Math.sin(u),26.9]);}
 for(const x of [-4.1,2.9])box(x,.1,29.6,.1,4.1,.1,'#adb9b8');
 for(const x of [-2.8,1.6])box(x,4.1,28.6,.22,.06,.55,'#e9d9b9',5);
 for(const E of kit(b).faces(hall))kit(b).panel(E.F,E.L/2,6.25,E.L-.2,.55,'#d7c3a4',.06,3);
 lights(b,g);
},['sgveeramakali']);

}
