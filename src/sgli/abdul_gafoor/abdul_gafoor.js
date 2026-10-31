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
function lights(b,g){for(const mode of [3,4,5])if(b.buckets.has(mode)){const q=new SGLI.Batch(b.base);q.buckets.set(mode,b.buckets.get(mode));q.flush(g,()=>lmMat(mode===5?{c:'#ffffff',vc:true,ds:true,glow:'#ffe0ad',gk:.85}:{c:'#ffffff',vc:true,ds:true,m:0,lc:mode===4?'#85e998':'#ffe3bf',lk:mode===4?.8:.85}));b.buckets.delete(mode);}}

register('abdul_gafoor','阿都卡夫回教堂','Masjid Abdul Gafoor',34,(b,D,G,g)=>{
 const K=kit(b,-.686),{box,prism,faces,panel,arch,arcTrim,lathe,beam,quad}=K;
 const cream='#ece6d6',white='#f6f1e6',green='#335e49',roof='#a7a89a';
 b.prism(D.parts[0].p,-1,1.65,'#c9c4b2');
 // Raised historic prayer hall within a real open arcade; eastern extension stays low.
 box(-7.4,1.65,-.6,17.8,7.6,23.2,cream,3);box(-7.4,9.05,-.6,18.2,.3,23.6,white,3);
 box(12.2,1.65,0,14.5,7.5,29,cream,3);
 const deck=rect(-7.5,0,24.4,29);prism(deck,6.7,7.1,cream,3);
 const arcades=faces(deck);
 for(const [i,E]of arcades.entries()){
  if(i===0)continue;const n=i%2===0?7:8,bay=E.L/n;
  for(let j=0;j<n;j++){
   const u=(j+.5)*bay,w=bay-.7,lo=1.7,hi=6.45;
   const p=E.F(j*bay,lo,.02);box(p[0],lo,p[2],.65,4.85,.65,cream,3);
   for(const off of [-.15,.15]){const q=E.F(j*bay+off,lo,.38);box(q[0],lo,q[2],.12,4.55,.12,white,3);}
   for(let k=0;k<24;k++){
    const t=k/24*Math.PI,v=(k+1)/24*Math.PI,r=w/2*(1-.13*(1-Math.abs(Math.sin(5*t)))),s=w/2*(1-.13*(1-Math.abs(Math.sin(5*v))));
    const x=u+Math.cos(t)*r,x1=u+Math.cos(v)*s,y=hi-w/2+Math.sin(t)*r,y1=hi-w/2+Math.sin(v)*s;
    quad(cream,E.F(x,y,.03),E.F(x1,y1,.03),E.F(x1,6.72,.03),E.F(x,6.72,.03),3);
   }
   arcTrim(E.F,u,lo,w,hi-lo,green,5);
   if(!(i===2&&j===3)){
    for(let v=-w/2+.15;v<w/2;v+=.38){const a=E.F(u+v,lo+.2,.1),q=E.F(u+v,lo+1,.1);beam(a,q,.11,white);}
    beam(E.F(u-w/2,lo+1.05,.1),E.F(u+w/2,lo+1.05,.1),.16,green);
   }
   // Small floral rosettes above each pier, without inscription or star text.
   const F=E.F;for(let s=0;s<6;s++){const t=s/6*Math.PI*2;panel(F,j*bay+Math.cos(t)*.18,6+Math.sin(t)*.18,.08,.08,green,.39);}
  }
  beam(E.F(0,7.05,.14),E.F(E.L,7.05,.14),.22,green);
  // Balustrade slots and continuous upper rail.
  for(let u=.25;u<E.L;u+=.6){panel(E.F,u,7.2,.24,.57,green,.08);}
  beam(E.F(0,7.95,.03),E.F(E.L,7.95,.03),.22,white);
 }
 // Clerestory windows, paired pilasters, terrace and 22 slender parapet turrets.
 for(const E of faces(rect(-7.4,-.6,17.9,23.3))){for(let u=1.5;u<E.L;u+=3){arch(E.F,u,7.35,1.05,1.45,green,.08);arcTrim(E.F,u,7.35,1.05,1.45,white);}}
 const turret=(x,z,y,w,h)=>{
  for(let i=0;i<3;i++){box(x,y+i*h/3,z,w*(1-i*.09),h/3,w*(1-i*.09),white,3);box(x,y+(i+1)*h/3-.12,z,w+.12,.13,w+.12,green);}
  lathe(x,z,y+h,w*.55,w*1.25,green,4,null,12);lathe(x,z,y+h+w*1.15,.04,.45,'#bca775',3,[[1,0],[1,1]],6);
 };
 const R=rect(-7.4,-.6,17.9,23.3),per=82.4;
 for(let i=0;i<22;i++){
  let d=(i+.5)*per/22,x,z;if(d<17.9){x=-16.35+d;z=-12.25;}else if((d-=17.9)<23.3){x=1.55;z=-12.25+d;}else if((d-=23.3)<17.9){x=1.55-d;z=11.05;}else{d-=17.9;x=-16.35;z=11.05-d;}turret(x,z,9.4,.38,2.1);
 }
 for(const [x,z]of [[-19,14],[4,14],[-19,-14],[4,-14]])turret(x,z,7.1,1.1,2.2);
 // Entrance sunburst: twenty-five geometric rays, blank panels instead of calligraphy.
 const F=(u,y,w=0)=>[u-7.5,y,14.65+w];
 const outline=[[-2.6,7],[-2.8,9.5],[-2,10.8],[-1,11.7],[0,13.6],[1,11.7],[2,10.8],[2.8,9.5],[2.6,7]];
 const t=THREE.ShapeUtils.triangulateShape(outline.map(p=>new THREE.Vector2(...p)),[]);for(const v of t)b.tri(white,...v.map(i=>K.T(...F(...outline[i],.14))),3);
 for(let i=0;i<25;i++){const a=i/25*Math.PI*2,c=(i+.65)/25*Math.PI*2;quad(i%2?green:'#c6ac65',F(Math.cos(a)*.48,9.25+Math.sin(a)*.48,.2),F(Math.cos(a)*1.75,9.25+Math.sin(a)*1.75,.2),F(Math.cos(c)*1.75,9.25+Math.sin(c)*1.75,.2),F(Math.cos(c)*.48,9.25+Math.sin(c)*.48,.2),3);}
 panel(F,0,6.4,3.5,.55,green,.23);panel(F,0,6.5,3.2,.25,'#e8d6a2',.25,5);
 for(const x of [-10.2,-4.8])turret(x,14.6,7,1.1,4.8);
 for(let i=0;i<6;i++)box(-7.5,.25+i*.23,16.1-i*.27,4.6,.23,.52,'#b7a998');
 // Hexagonal three-stage cupola with inset arched windows and small corner pinnacles.
 let y=9.3;for(let k=0;k<3;k++){
  const r=3.3-k*.55,H=1.9-k*.15,R=K.ring(-7.4,-1.3,r,6);prism(R,y,y+H,cream,3);
  for(const E of faces(R)){arch(E.F,E.L/2,y+.25,.72,H-.45,'#547d72',.04,5);arcTrim(E.F,E.L/2,y+.25,.72,H-.45,white);}
  prism(K.ring(-7.4,-1.3,r+.12,6),y+H-.16,y+H,white,3);y+=H;
 }
 lathe(-7.4,-1.3,y,1.7,3.8,green,4,null,24);
 lathe(-7.4,-1.3,y+3.6,.46,1.05,green,4,null,16);
 lathe(-7.4,-1.3,y+4.62,.05,.9,'#b7a464',3,[[1,0],[1,1]],6);
 for(const p of K.ring(-7.4,-1.3,2.05,6))turret(p[0],p[1],14.5,.33,1.3);
 // Extension's long arched window rhythm and restrained flat service roof.
 for(const E of faces(rect(12.2,0,14.55,29.05))){for(let u=1.5;u<E.L;u+=2.8){arch(E.F,u,2.2,1.35,3.2,'#456655',.08,2);arcTrim(E.F,u,2.2,1.35,3.2,white);}beam(E.F(0,8.7,.15),E.F(E.L,8.7,.15),.28,green);}
 box(12.2,9.15,0,14.6,.2,29.1,roof);box(13,9.35,-8,3,1.1,3,'#b7c2b6');
 lights(b,g);
},['sgabdulgafoor']);

}
