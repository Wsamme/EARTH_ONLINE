/* City Square Mall: four-storey retail plate + mapped nine-level back block.
 * Curved glazed atrium, metal roof, planted setbacks and entrance eco-canopy. */
{
const {register,out,scale,lerp,inside}=SGLI;
register('city_square_mall','城市广场','City Square Mall',114,(b,D)=>{
 const flush=b.flush.bind(b);b.flush=g=>flush(g,mode=>lmMat({c:'#ffffff',vc:true,ds:true,m:0,lk:0,glow:mode===2?'#ffddb1':mode===4?'#fff0d7':mode===5?'#b7d9e9':undefined,gk:mode===2?.35:mode===4?.85:mode===5?.45:0}));
 const P=D.parts[0].p,T=D.parts[1].p,podium=22.4,top=41.4;
 b.prism(P,-1,podium,'#b4b7b0');b.facade(out(P,.04),.5,podium-.6,4.5,3.3,'#506e71','#c8cfc6',.2);
 for(let y=4.5;y<podium;y+=4.5)b.band(out(P,.13),y,.45,'#cfcec3');
 b.roof(P,podium-.7);b.prism(T,podium,top-1,'#a4aaa4');
 // Upper parking/service floors have long ventilation openings and pale piers.
 const Q=out(T,.05);Q.forEach((p,i)=>{const q=Q[(i+1)%Q.length],dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz),a=Math.atan2(-dz,dx),n=Math.max(1,Math.round(L/6.5));
  for(let y=23.5;y<top-2;y+=3.3){b.box((p[0]+q[0])/2,y,(p[1]+q[1])/2,L,1.5,.1,'#495a59',a);for(let j=0;j<=n;j++)b.box(lerp(p[0],q[0],j/n),y-.1,lerp(p[1],q[1],j/n),.45,2,.35,'#bac1b6',a);}
 });b.roof(T,top-1.0,2);b.rim(T,top,'#c6cbbf',.4);
 // Main Serangoon/City Green front, strictly inside the OSM retail plate.
 const a=P[0],q=P[1],dx=q[0]-a[0],dz=q[1]-a[1],L=Math.hypot(dx,dz),ux=dx/L,uz=dz/L,nx=uz,nz=-ux;
 const F=(u,y,v=0)=>[a[0]+ux*u+nx*v,y,a[1]+uz*u+nz*v];
 const glassStart=37,glassEnd=L-4,roofY=u=>27.2+6.2*Math.cos((u-glassStart)/(glassEnd-glassStart)*Math.PI*.5);
 for(let u=glassStart;u<glassEnd;u+=2.8){const e=Math.min(glassEnd,u+2.8),v=.35+1.5*Math.sin((u-glassStart)/(glassEnd-glassStart)*Math.PI),w=.35+1.5*Math.sin((e-glassStart)/(glassEnd-glassStart)*Math.PI);
  // Curtain wall above the retail floor, with visible mullions and curved eave.
  b.quad('#739b9c',F(u,podium,v),F(e,podium,w),F(e,roofY(e)-.4,w),F(u,roofY(u)-.4,v),2);
  b.beam(F(u,0,v),F(u,roofY(u),v),.14,'#c9d0c6');
  for(let y=24;y<roofY(u)-.5;y+=2.2)b.beam(F(u,y,v),F(e,Math.min(y,roofY(e)-.4),w),.09,'#cbd3c8');
  // Curved roof barrel with a 22 m span into the retail plate.
  for(let k=0;k<8;k++){const s=k/8,t=(k+1)/8,Y=(u,v)=>roofY(u)+1.6*Math.sin(v*Math.PI);b.quad('#c6ccc3',F(u,Y(u,s),v+22*s),F(e,Y(e,s),w+22*s),F(e,Y(e,t),w+22*t),F(u,Y(u,t),v+22*t));}
  b.beam(F(u,roofY(u),v-.25),F(e,roofY(e),w-.25),.13,'#e4dfc8');
  // Thin LED edge, not a large glowing opaque wall.
  const A=F(u,roofY(u)-.22,v-.31),B=F(e,roofY(e)-.22,w-.31);b.quad('#c5d6db',A,B,[B[0],B[1]+.08,B[2]],[A[0],A[1]+.08,A[2]],5);
 }
 // Solid western entrance/signage bay; blank panels replace all retail branding.
 const panelAngle=Math.atan2(-dz,dx);
 for(const [u,y,w,h]of [[19,17,12,3.2],[30,11,7,2],[70,12,8,1.5]]){const v=F(u,y,-.12);b.box(v[0],y,v[2],w,h,.15,'#e8dfc4',panelAngle,4);}
 // Roof garden beds restricted to the low roof outside the nine-level block.
 for(let u=5;u<34;u+=7){const c=F(u,podium,14);if(inside(P,c[0],c[2])&&!inside(T,c[0],c[2])){b.box(c[0],podium,c[2],5,.5,3,'#b8b8a6',panelAngle);b.box(c[0],podium+.5,c[2],4.6,.3,2.6,'#658449',panelAngle);b.tree(c[0],podium+.7,c[2],.65);}}
 // Compact edge of the park eco-canopy; full City Green park stays context.
 for(let u=8;u<35;u+=3){const e=Math.min(35,u+3);for(let k=0;k<4;k++){const v=-2+k*1.5,w=v+1.5,Y=(u,v)=>5.6+.6*Math.sin((u-8)/27*Math.PI)-v*.06;b.quad(k%2?'#809979':'#b0c1b7',F(u,Y(u,v),v),F(e,Y(e,v),v),F(e,Y(e,w),w),F(u,Y(u,w),w),k%2?0:2);b.beam(F(u,Y(u,v),v),F(e,Y(e,v),v),.1,'#d4d7c7');}}
 for(const u of [9,32]){const A=F(u,0,-1),B=F(u,5.8,-1);b.beam(A,B,.3,'#e0dfd2');}
},[]);
}
