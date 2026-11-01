/* City Square Mall: four-storey retail plate + mapped nine-level annex.
 * Curved glazed atrium, metal roof, planted setbacks and entrance eco-canopy. */
{
const {register,out,scale,lerp,inside}=SGLI;
register('city_square_mall','城市广场','City Square Mall',114,(b,D)=>{
 const flush=b.flush.bind(b);b.flush=g=>flush(g,mode=>lmMat({c:'#ffffff',vc:true,ds:true,m:0,lk:0,glow:mode===2?'#ffddb1':mode===4?'#fff0d7':mode===5?'#b7d9e9':undefined,gk:mode===2?.28:mode===4?1.0:mode===5?.8:0}));
 const P=D.parts[0].p,T=D.parts[1].p,podium=25.0,top=51.6;
 // Local front-parallel / rearward frame, derived from the OSM edge.
 const a=P[0],q=P[1],dx=q[0]-a[0],dz=q[1]-a[1],L=Math.hypot(dx,dz),ux=dx/L,uz=dz/L,nx=uz,nz=-ux;
 const F=(u,y,v=0)=>[a[0]+ux*u+nx*v,y,a[1]+uz*u+nz*v];
 const U=p=>(p[0]-a[0])*ux+(p[1]-a[1])*uz;
 function half(R,k,sign){const out=[];R.forEach((p,i)=>{const q=R[(i+1)%R.length],vp=U(p)-k,vq=U(q)-k,A=sign*vp>=0,B=sign*vq>=0;if(A)out.push(p);if(A!==B){const t=vp/(vp-vq);out.push([lerp(p[0],q[0],t),lerp(p[1],q[1],t)]);}});return out;}
 const slabs=[half(half(T,27,1),61,-1),half(half(T,72,1),103,-1)];
 b.prism(P,-1,podium,'#b4b7b0');b.facade(out(P,.04),.5,podium-.6,5.8,3.3,'#506e71','#c8cfc6',.2);
 for(let y=5.8;y<podium;y+=5.8)b.band(out(P,.13),y,.45,'#cfcec3');
 // January 2023 / March 2024 service-road elevations: broad off-white
 // metal wall panels above a low stone plinth, not all-over green glazing.
 const cladding=out(P,.21);
 for(const edge of [6,7,8,9,10]){const a=cladding[edge],q=cladding[(edge+1)%P.length],dx=q[0]-a[0],dz=q[1]-a[1],len=Math.hypot(dx,dz),ang=Math.atan2(-dz,dx),n=Math.max(1,Math.round(len/3));
  b.quad('#e0e1db',[a[0],4.8,a[1]],[q[0],4.8,q[1]],[q[0],podium,q[1]],[a[0],podium,a[1]]);
  b.quad('#b8b6a6',[a[0],.2,a[1]],[q[0],.2,q[1]],[q[0],4.8,q[1]],[a[0],4.8,a[1]]);
  for(let y=6.5;y<podium;y+=2.4)b.beam([a[0],y,a[1]],[q[0],y,q[1]],.035,'#c7cbc5');
  for(let j=0;j<n;j++){const t=(j+.5)/n,x=lerp(a[0],q[0],t),z=lerp(a[1],q[1],t);if(j%3===1)b.box(x,9.4,z,.42,2.7,.10,'#72858a',ang);}
 }

 b.roof(P,podium-.7);b.prism(T,podium,48.1,'#a4aaa4');for(const S of slabs)b.prism(S,48.1,51.2,'#a4aaa4');b.cap(T,48.15,'#789a92');
 // The upper leased annex floors have long glazed bands and pale piers.
 const Q=out(T,.05);Q.forEach((p,i)=>{const q=Q[(i+1)%Q.length],dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz),a=Math.atan2(-dz,dx),n=Math.max(1,Math.round(L/6.5));
  for(let y=26.4;y<top-2;y+=5.1){b.box((p[0]+q[0])/2,y,(p[1]+q[1])/2,L,1.5,.1,'#526f72',a,2);for(let j=0;j<=n;j++)b.box(lerp(p[0],q[0],j/n),y-.1,lerp(p[1],q[1],j/n),.45,2,.35,'#bac1b6',a);}
 });for(const S of slabs){b.roof(S,51.1,2);b.rim(S,51.6,'#c6cbbf',.4);}
 // The tall north/northwest service faces are also opaque; the eastern
 // glazed feature bay and occupied terrace elevations remain exposed.
 const upperClad=out(T,.23);
 for(const edge of [0,8]){const p=upperClad[edge],q=upperClad[(edge+1)%T.length];
  b.quad('#dce0da',[p[0],podium,p[1]],[q[0],podium,q[1]],[q[0],48.1,q[1]],[p[0],48.1,p[1]]);
  for(let y=27;y<48;y+=2.4)b.beam([p[0],y,p[1]],[q[0],y,q[1]],.035,'#cbd0c9');
 }

 // Highest measured element is roof plant/screen, not the adjacent residences.
 {const c=F(45,51.2,94),ang=Math.atan2(-dz,dx);b.box(c[0],51.2,c[2],8,4.5,6,'#b8c2ba',ang);for(let y=51.6;y<55.5;y+=.38)b.box(c[0],y,c[2],8.05,.07,6.05,'#8a9d96',ang);}

 // Main Serangoon/City Green front, inside the OSM retail plate.
 // Pale western signage bay: the real frontage is not uninterrupted glass.
 b.quad('#c5c4b9',F(.4,5,-.15),F(36.5,5,-.15),F(36.5,podium,-.15),F(.4,podium,-.15));
 for(const u of [8,27])for(const y of [6.2,10.7,15.2]){const w=8.5,h=2.6;b.quad('#527174',F(u-w/2,y,-.18),F(u+w/2,y,-.18),F(u+w/2,y+h,-.18),F(u-w/2,y+h,-.18),2);}
 for(const u of [1,18,36])b.beam(F(u,5,-.25),F(u,podium,-.25),.22,'#d8d7cb');
 const glassStart=37,glassEnd=L-4,roofY=u=>28.2;
 for(let u=glassStart;u<glassEnd;u+=2.8){const e=Math.min(glassEnd,u+2.8),v=-.35-1.5*Math.sin((u-glassStart)/(glassEnd-glassStart)*Math.PI),w=-.35-1.5*Math.sin((e-glassStart)/(glassEnd-glassStart)*Math.PI);
  // Curtain wall above the retail floor, with visible mullions and curved eave.
  b.quad('#739b9c',F(u,5.8,v),F(e,5.8,w),F(e,roofY(e)-.4,w),F(u,roofY(u)-.4,v),2);
  b.beam(F(u,0,v),F(u,roofY(u),v),.14,'#c9d0c6');
  for(let y=5.8;y<roofY(u)-.5;y+=2.2)b.beam(F(u,y,v),F(e,Math.min(y,roofY(e)-.4),w),.09,'#cbd3c8');
  b.quad('#b8cbc4',F(u,28.2,v),F(e,28.2,w),F(e,28.2,7),F(u,28.2,7),2);
  b.beam(F(u,roofY(u),v-.25),F(e,roofY(e),w-.25),.13,'#e4dfc8');
  // Thin LED edge, not a large glowing opaque wall.
  const A=F(u,roofY(u)-.22,v-.31),B=F(e,roofY(e)-.22,w-.31);b.quad('#c5d6db',A,B,[B[0],B[1]+.08,B[2]],[A[0],A[1]+.08,A[2]],5);
 }
 // Broad white barrel spans the retail hall. Green ribs/skylight strip
 // follow the newly supplied top photograph; the rear slabs stay independent.
 const roofV=v=>28.2+2.5*Math.sin(Math.max(0,Math.min(1,(v-7)/28))*Math.PI);
 for(let u=4;u<103;u+=3){const e=Math.min(103,u+3);for(let k=0;k<16;k++){const v=7+k/16*28,w=7+(k+1)/16*28;b.quad('#d6dcd3',F(u,roofV(v),v),F(e,roofV(v),v),F(e,roofV(w),w),F(u,roofV(w),w));}}
 for(const u of [4,103])for(let k=0;k<16;k++){const v=7+k/16*28,w=7+(k+1)/16*28;b.quad('#73999a',F(u,podium,v),F(u,podium,w),F(u,roofV(w),w),F(u,roofV(v),v),2);b.beam(F(u,podium,v),F(u,roofV(v),v),.12,'#b7c8bf');}
 for(let u=6;u<103;u+=7)for(let k=0;k<16;k++){const v=7+k/16*28,w=7+(k+1)/16*28;b.beam(F(u,roofV(v)+.04,v),F(u,roofV(w)+.04,w),.11,'#8bab9d');}
 for(let v=33;v<37;v+=.5)b.quad('#7ba197',F(4,roofV(v)+.07,v),F(103,roofV(v)+.07,v),F(103,roofV(v+.5)+.07,v+.5),F(4,roofV(v+.5)+.07,v+.5));
 // Raised photovoltaic bed on the lower west roof, seen in the reference top.
 {const c=F(13,25.1,56),ang=Math.atan2(-dz,dx);b.box(c[0],25.1,c[2],22,1.0,16,'#cbbfa5',ang);for(let u=3;u<23;u+=5)for(let v=49;v<63;v+=2){const c=F(u,26.14,v);b.box(c[0],26.14,c[2],4.6,.12,1.65,'#506c88',ang);}}
 // Solid western entrance/signage bay; blank panels replace all retail branding.
 const panelAngle=Math.atan2(-dz,dx);
 for(const [u,y,w,h]of [[19,17,12,3.2],[30,11,7,2],[70,12,8,1.5]]){const v=F(u,y,-.12);b.box(v[0],y,v[2],w,h,.15,'#e8dfc4',panelAngle,4);}
 // Roof garden beds restricted to the low roof outside the nine-level block.
 for(let u=5;u<34;u+=7){const c=F(u,podium,75);if(inside(P,c[0],c[2])&&!inside(T,c[0],c[2])){b.box(c[0],podium,c[2],5,.5,3,'#b8b8a6',panelAngle);b.box(c[0],podium+.5,c[2],4.6,.3,2.6,'#658449',panelAngle);b.tree(c[0],podium+.7,c[2],.65);}}
 // Planted roof terrace behind the barrel hall, outside the taller annex.
 for(let u=42;u<101;u+=12){const c=F(u,podium,43);if(inside(P,c[0],c[2])&&!inside(T,c[0],c[2])){b.box(c[0],podium,c[2],7,.45,2.5,'#b3b9a8',panelAngle);b.box(c[0],podium+.45,c[2],6.6,.35,2.2,'#5d8245',panelAngle);}}
 // Ground floor entrance glazing and canopy stanchions.
 for(let u=40;u<L-6;u+=5.6){const c=F(u,.3,-.2);b.box(c[0],.3,c[2],4.8,4.5,.12,'#7c9d97',panelAngle,2);const a=F(u-2.4,.3,-.3),e=F(u-2.4,5,-.3);b.beam(a,e,.12,'#d1d7c9');}
 // Compact edge of the park eco-canopy; full City Green park stays context.
 for(let u=8;u<35;u+=3){const e=Math.min(35,u+3);for(let k=0;k<4;k++){const v=-2+k*1.5,w=v+1.5,Y=(u,v)=>5.6+.6*Math.sin((u-8)/27*Math.PI)-v*.06;b.quad(k%2?'#809979':'#b0c1b7',F(u,Y(u,v),v),F(e,Y(e,v),v),F(e,Y(e,w),w),F(u,Y(u,w),w),k%2?0:2);b.beam(F(u,Y(u,v),v),F(e,Y(e,v),v),.1,'#d4d7c7');}}
 for(const u of [9,32]){const A=F(u,0,-1),B=F(u,5.8,-1);b.beam(A,B,.3,'#e0dfd2');}
},[]);
}
