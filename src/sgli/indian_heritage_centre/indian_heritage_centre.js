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

register('indian_heritage_centre','印度文化馆','Indian Heritage Centre',42,(b,D,G,g)=>{
 const K=kit(b),{faces,panel,beam,quad}=K,P=D.parts[0].p,H=19.1,serviceTop=21.74;
 b.prism(P,-1,H,'#aeb3ae');b.cap(P,H+.04,'#667953');b.rim(P,H+.35,'#b3b8af',.3);
 const colors=['#b18430','#287d73','#b66435','#516f99','#b9aa43','#7e4162','#4b8c96','#c9a75a'];
 for(const i of [1]){
  const E=faces(P)[i],F=E.F,L=E.L-3;
  // Recessed street-level lobby; diagonal supports carry the glazed upper volume.
  panel(F,L/2,.2,L-.15,4.3,'#3e5d61',.04,2);
  for(let u=0;u<L;u+=4.3){beam(F(u,.2,.12),F(u,4.5,.12),.12,'#7b8075');}
  for(let u=1;u<L;u+=9){beam(F(u,.15,.7),F(Math.min(L,u+2.8),4.5,.7),.28,'#bdb9a7');}
  // Abstract painted mural behind the glass: multicolour fields with small
  // geometric figures/architectural motifs, no reproductions of photographs.
  const nx=Math.ceil(L/2.4),ny=7;
  for(let j=0;j<nx;j++)for(let k=0;k<ny;k++){
   const u=(j+.5)*L/nx,y=4.65+k*2.38,w=L/nx-.025,h=Math.min(2.35,H-y-.15);
   if(h<=0)continue;
   panel(F,u,y,w,h,colors[(j*3+k*5+i)%8],.07,7);
   if((j+k)%3===0){
    // Stylised mural figures: coloured robe, head medallion and bent arms.
    panel(F,u,y+.15,w*.26,1.1,colors[(j+k+4)%8],.09,7);
    const O=Array.from({length:10},(_,n)=>F(u+Math.cos(n/10*Math.PI*2)*.18,y+1.6+Math.sin(n/10*Math.PI*2)*.22,.09));
    for(let n=1;n<9;n++)b.tri('#dcc895',O[0],O[n],O[n+1],7);
    for(const s of [-1,1]){const A=F(u+s*.1,y+1.05,.1),B=F(u+s*.4,y+.8,.1);b.beam(A,B,.09,'#d2b97c');}
   }else{
    for(const v of [-.3,0,.3])panel(F,u+v*w,y+.25,.05,Math.min(1.5,h-.3),'#dac586',.09,7);
    for(const v of [.2,.65,1.1])if(v<h-.1)panel(F,u,y+v,w*.7,.055,'#ddbd67',.09,7);
   }
  }
  // A real stair rhythm behind the stepped facade, with horizontal landings.
  for(let j=0;j<36;j++){
   const u=.3+j*(L-.6)/36,y=4.7+j*(H-5.4)/36;
   beam(F(u,y,.12),F(u+(L-.6)/36,y,.12),.15,'#c3baa0');
   beam(F(u+(L-.6)/36,y,.12),F(u+(L-.6)/36,y+.45,.12),.08,'#bcb39a');
  }
  // Translucent lightly tinted glass sheets let the mural remain visible.
  const n=Math.ceil(L/2.5);
  for(let j=0;j<n;j++)panel(F,(j+.5)*L/n,4.6,L/n-.025,H-4.7,j%3?'#8ea9b1':'#77949f',.18,6);
  // Baoli diamond lattice, clipped analytically at the facade's actual bounds.
  for(const slope of [-.78,.78])for(let start=-25;start<L+25;start+=7.0){
   const y0=4.6,y1=H-.05;
   const u0=start,u1=start+(y1-y0)/slope;
   let lo=0,hi=1;const d=u1-u0;
   if(d>0){lo=Math.max(lo,-u0/d);hi=Math.min(hi,(L-u0)/d);}else{lo=Math.max(lo,(L-u0)/d);hi=Math.min(hi,-u0/d);}
   if(hi<=lo)continue;
   const a=F(u0+d*lo,y0+(y1-y0)*lo,.32),q=F(u0+d*hi,y0+(y1-y0)*hi,.32);
   beam(a,q,.19,'#5c5b4f');const A=F(u0+d*lo,y0+(y1-y0)*lo+.08,.35),B=F(u0+d*hi,y0+(y1-y0)*hi+.08,.35);beam(A,B,.045,'#ad9b77');
  }
  for(const y of [4.55,H])beam(F(0,y,.26),F(L,y,.26),.22,'#736d57');
  for(const u of [0,L])beam(F(u,4.5,.26),F(u,H,.26),.18,'#817b63');
  // Entrance soffit, blank lit information panels and stone steps.
  const a=F(L*.45,3.7,.25),q=F(L*.55,3.7,.25);beam(a,q,.12,'#ded3b7');
  panel(F,L*.52,1.1,1.3,1.7,'#d6c49c',.28,5);
  for(let j=0;j<3;j++){
   const R=[F(L*.32,.1+j*.15,.5),F(L*.65,.1+j*.15,.5),F(L*.65,.1+j*.15,1.4-j*.3),F(L*.32,.1+j*.15,1.4-j*.3)];b.quad('#b5b4a7',...R);
  }
 }
 // The southeast and rear elevations are opaque gallery walls, with small
 // vertical windows and distinct dark service fins, not a second mural facade.
 for(const i of [0,3,4,5]){
  const E=faces(P)[i];if(E.L<2)continue;
  panel(E.F,E.L/2,.15,E.L-.08,3.8,'#49585b',.045);
  if(i===4)for(const u of [E.L*.3,E.L*.46])for(let f=0;f<3;f++){
   panel(E.F,u,4.4+f*4.6,f===0?1:1.8,2.8,'#647e7b',.06,2);
   panel(E.F,u+2.7,4.4+f*4.6,.6,2.8,'#627371',.06,2);
  }
  if(i===3||i===4)for(const slope of [-.65,.65])for(let start=-25;start<E.L+25;start+=5.2){
   const y0=4.1,y1=H-.3,u0=start,u1=start+(y1-y0)/slope,d=u1-u0;
   let lo=0,hi=1;
   if(d>0){lo=Math.max(lo,-u0/d);hi=Math.min(hi,(E.L-u0)/d);}else{lo=Math.max(lo,(E.L-u0)/d);hi=Math.min(hi,-u0/d);}
   if(hi>lo)beam(E.F(u0+d*lo,y0+(y1-y0)*lo,.065),E.F(u0+d*hi,y0+(y1-y0)*hi,.065),.035,'#939e99');
  }
  for(const y of [4.1,9.1,14.1,19.1])beam(E.F(0,y,.06),E.F(E.L,y,.06),.06,'#929d99');
  if(i===5||i===3){
   const length=i===3?4.2:E.L;
   panel(E.F,length/2,.1,length,serviceTop-.1,'#3e484e',.14);
   for(let u=.12;u<length;u+=.33)beam(E.F(u,.15,.2),E.F(u,serviceTop,.2),.09,'#617077');
  }
 }
 // Tall carved stone entry portal at the end of the Campbell Lane glass front.
 const EF=faces(P)[1],u=EF.L-1.5;
 for(const x of [u-1.3,u+1.3]){
  beam(EF.F(x,.2,.6),EF.F(x,7.8,.6),.4,'#8b8c7a');
  for(let y=.4;y<7.6;y+=.35)panel(EF.F,x,y,.18,.18,'#b4ae8c',.83);
 }
 beam(EF.F(u-1.5,7.8,.6),EF.F(u+1.5,7.8,.6),.45,'#8b8c7a');
 panel(EF.F,u,.3,2.2,7,'#5b4f3c',.14);
 // Set-back dark roof service volume and planted terraces, visible in the refs.
 const roofPlate=scale(P,.86),core=scale(P,.62);b.prism(roofPlate,H+.05,20.5,'#39434a');b.cap(roofPlate,20.52,'#434c51');b.prism(core,20.5,serviceTop,'#39434a');b.cap(core,serviceTop+.05,'#434c51');
 for(const E of faces(core))for(let v=.25;v<E.L;v+=.4)beam(E.F(v,H+.12,.1),E.F(v,serviceTop,.1),.06,'#66747a');
 for(let v=1.3;v<EF.L-2;v+=2.6){const q=EF.F(v,H+.05,-1.3);b.tree(q[0],q[1],q[2],.32);}
 const SE=faces(P)[3];for(let v=7;v<SE.L-1;v+=2.5){const q=SE.F(v,H+.05,-1.2);b.tree(q[0],q[1],q[2],.3);}
 const C=center(core);b.box(C[0]-2,serviceTop+.05,C[1]-1,4,.55,3,'#a1aaa4');
 for(let j=-1;j<=1;j++)b.box(C[0]-2+j,serviceTop+.62,C[1]-1,.07,.04,2.4,'#586b69');
 // Transparent glass and colour-preserving mural light each form one shared batch.
 for(const mode of [6,7])if(b.buckets.has(mode)){
  const B=new SGLI.Batch(b.base);B.buckets.set(mode,b.buckets.get(mode));
  B.flush(g,()=>{
   const mat=lmMat(mode===6?{c:'#ffffff',vc:true,ds:true,m:0,lk:.1,op:.76}:{c:'#ffffff',vc:true,ds:true,m:0,lc:'#ffe4b6',lk:2.6});
   if(mode===6&&!mat.userData.liDayGlass){
    const compile=mat.onBeforeCompile;
    mat.onBeforeCompile=function(sh,r){compile.call(this,sh,r);sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a *= mix(1.0,0.24,uNight);');};
    mat.customProgramCacheKey=()=> 'sgli-ihc-day-glass-v1';mat.userData.liDayGlass=true;
   }
   return mat;
  });b.buckets.delete(mode);
 }
 lights(b,g);
});

}
