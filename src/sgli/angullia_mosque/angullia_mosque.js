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
function lights(b,g){
 for(const mode of [3,4,5,8,9])if(b.buckets.has(mode)){
  const q=new SGLI.Batch(b.base);q.buckets.set(mode,b.buckets.get(mode));
  q.flush(g,()=>{
   const mat=lmMat(mode===8?{c:'#ffffff',vc:true,ds:true,m:0,lc:'#ffe6ca',lk:1.1}:mode===9?{c:'#ffffff',vc:true,ds:true,m:0,lc:'#ffe5c7',lk:.12,glow:'#fff0d5',gk:.18}:mode===5?{c:'#ffffff',vc:true,ds:true,glow:'#ffe0ad',gk:.85}:{c:'#ffffff',vc:true,ds:true,m:0,lc:mode===4?'#85e998':'#ffe3bf',lk:mode===4?.8:.85});
   if(mode===8&&!mat.userData.liNicheWash){
    const compile=mat.onBeforeCompile;
    mat.onBeforeCompile=function(sh,r){compile.call(this,sh,r);sh.uniforms.uEven={value:1};};
    mat.userData.liNicheWash=true;
   }
   return mat;
  });b.buckets.delete(mode);
 }
}

register('angullia_mosque','安古利亚清真寺','Masjid Angullia',34,(b,D,G,g)=>{
 const K=kit(b,.78),{box,prism,faces,panel,arch,arcTrim,lathe,beam,quad}=K;
 const coral='#a65f58',cream='#eee7d7',dark='#526b79',bronze='#967457';
 b.prism(D.parts[0].p,-1,.25,'#c7bca5');
 // Current 2020 prayer hall behind the independently conserved gatehouse.
 // Two near side-camera roof rays (2024-02, panos 00/01) put the upper
 // flank near local x=9 at a 19.55 m parapet: the new hall sets back from
 // the old OSM corner rather than inheriting its sharply tapering side.
 const hall=[[-8.6,-20],[9,-20],[9,12.2],[-10.45,12.2]];
 prism(hall,.25,19.2,coral,3);prism(hall,19.2,19.55,cream,3);
 // Tall blind/ glazed pointed arches, slim cream bands and inset patterned screens.
 const pointed=(F,u,y,w,h,c,off=.08,m=0)=>{
  const O=[[-w/2,0],[w/2,0],[w/2,h*.68],[w*.36,h*.83],[0,h],[-w*.36,h*.83],[-w/2,h*.68]];
  for(let i=1;i<O.length-1;i++)b.tri(c,K.T(...F(u+O[0][0],y+O[0][1],off)),K.T(...F(u+O[i][0],y+O[i][1],off)),K.T(...F(u+O[i+1][0],y+O[i+1][1],off)),m);
 };
 for(const [i,E]of faces(hall).entries()){
  const n=i===2?2:i===0?3:4;
  for(let j=0;j<n;j++){
   const u=(j+.5)*E.L/n,bw=E.L/n;
   if(i===2){
    pointed(E.F,u,3.5,bw-.5,10.4,cream,.06,3);pointed(E.F,u,3.65,bw-.85,10.1,j===0?dark:coral,.09,j===0?9:3);
    if(j===0)for(let y=4;y<12;y+=1.7)beam(E.F(u-bw*.35,y,.13),E.F(u+bw*.35,y,.13),.07,bronze);
   }else{
    // 2024-02 street views: a low screened ground storey, broad two-level
    // recessed glazing, and a separate upper niche band, not office windows.
    panel(E.F,u,.3,bw-.25,4.15,cream,.08);
    panel(E.F,u,1.3,bw-1.1,1.95,bronze,.11);
    panel(E.F,u,4.8,bw-.35,10.0,cream,.08);
    const glazed=i===1?j>0:i===3?j<3:false;
    if(glazed){
     pointed(E.F,u,6.4,bw-1.05,8.0,dark,.12,9);
     for(let y=7;y<13.7;y+=1.65)beam(E.F(u-bw*.4,y,.16),E.F(u+bw*.4,y,.16),.065,bronze);
     for(let v=-bw*.38;v<bw*.4;v+=1.35)beam(E.F(u+v,6.5,.16),E.F(u+v,13.4,.16),.065,bronze);
     panel(E.F,u,5.05,bw-.8,1.25,bronze,.18);
    }else{
     pointed(E.F,u,5.2,bw-1.0,9.1,bronze,.12);
    }
    // Diamond relief on the reddish jali; kept close to the physical screen.
    const lattice=(lo,hi,width)=>{
     for(let y=lo;y<hi-.35;y+=.66)for(let v=-width/2+.2;v<width/2-.35;v+=.66){
      const x=u+v;for(const [a,c]of [[[x,y],[x+.3,y+.33]],[[x+.3,y+.33],[x,y+.66]],[[x,y+.66],[x-.3,y+.33]],[[x-.3,y+.33],[x,y]]])beam(E.F(a[0],a[1],.2),E.F(c[0],c[1],.2),.035,coral);
     }
    };
    lattice(1.4,3.2,bw-1.1);
    if(glazed)lattice(5.1,6.25,bw-.9);else lattice(5.35,12.4,bw-1.25);
   }
   const sub=i===2?2:1;
   for(let k=0;k<sub;k++){
    const v=u+(k+.5-sub/2)*bw/sub,sw=bw/sub;
    pointed(E.F,v,15.2,sw-.65,3.35,cream,.08,3);pointed(E.F,v,15.38,sw-.95,3.02,bronze,.1,8);
    // Small upward sconces visible in the saved current-building night photograph.
    const lamp=E.F(v,15.08,.23);box(lamp[0],15.08,lamp[2],.28,.10,.24,'#e9dfcb',5);
    // Physical diamond jali lattice within each upper niche.
    for(let q=-sw*.31;q<sw*.32;q+=.45)for(let yy=15.6;yy<17.8;yy+=.5){beam(E.F(v+q,yy,.14),E.F(v+q+.22,yy+.25,.14),.045,cream);beam(E.F(v+q+.22,yy+.25,.14),E.F(v+q,yy+.5,.14),.045,cream);}
   }
   beam(E.F(j*bw,.3,.12),E.F(j*bw,19.4,.12),.2,cream);
  }
  for(const y of [4.65,14.85,19.45])beam(E.F(0,y,.13),E.F(E.L,y,.13),.17,cream);
  for(let u=.2;u<E.L;u+=.45){const p=E.F(u,19.55,0);box(p[0],19.55,p[2],.24,.35,.24,coral);}
 }
 const gateStart=new Map([...b.buckets].map(([mode,B])=>[mode,B.p.length]));
 // Conserved three-arch gate, freestanding behind the Serangoon Road pavement.
 const F=(u,y,w=0)=>[u-2.4,y,18.65+w];
 box(-2.4,4.65,18.4,19.3,.55,1.1,cream,3);box(-2.4,5.13,18.4,19.5,.18,1.25,coral,3);
 for(const x of [-11.75,-5.45,.85,7.15]){
  box(x,.2,18.4,.72,4.6,1.1,cream,3);
  for(let k=0;k<4;k++){box(x,5.3+k*.68,18.4,.6,.68,.6,cream,3);box(x,5.86+k*.68,18.4,.73,.12,.73,coral);}
  lathe(x,18.4,8.02,.4,.55,coral,3,null,8);
 }
 for(const u of [-6.3,0,6.3]){
  arcTrim(F,u,.25,5.35,4.15,cream);
  // Narrow grille leaves retain a visible central passage.
  if(u!==0)for(let v=-2.2;v<2.3;v+=.32)beam(F(u+v,.3,.1),F(u+v,3.1,.1),.055,'#547865');
 }
 for(let u=-9;u<9.3;u+=.4){const p=F(u,4.3,0);box(p[0],4.3,p[2],.13,.4,.13,'#52765d');}
 box(-2.4,5.45,18.4,4,.65,.28,'#7b8f7e');
 // Gatehouse scale is independent of the four-storey hall; current photos
 // show its finials at about 7 m, not at half the hall height.
 for(const [mode,B]of b.buckets)for(let j=(gateStart.get(mode)||0)+1;j<B.p.length;j+=3)B.p[j]=b.base+(B.p[j]-b.base)*.8;
 // Short rooftop corner tower, not a tall freestanding Ottoman minaret.
 box(6.7,19.4,10.6,2.3,4.4,2.3,coral,3);
 for(const E of faces(rect(6.7,10.6,2.32,2.32))){pointed(E.F,E.L/2,20.4,1.65,2.2,cream,.1,3);panel(E.F,E.L/2,21,1.05,.85,dark,.12);}
 K.frustum(6.7,10.6,23.8,2.5,2.5,0,0,1.3,bronze);
 lathe(6.7,10.6,25.1,.045,.5,bronze,3,[[1,0],[1,1]],6);
 // Roof pavilion's light steel lattice, with service plant screened behind.
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2;beam([Math.cos(a)*4,19.7,-5+Math.sin(a)*4],[0,22.2,-5],.07,'#b7b5a6');}
 box(-4,19.6,-14,3.5,1.2,3,'#b7b7aa');
 for(let i=0;i<5;i++)box(-4+i*.55,20.82,-14,.08,.05,2.4,'#6b7572');
 // Shallow entrance canopy and soffit lamps, observed in the night photograph.
 box(-2.4,4.2,13.9,12,.18,3,'#b1bdb3');
 for(const x of [-7,2])box(x,4.05,14,.3,.1,.3,'#efdcac',5);
 lights(b,g);
});

}
