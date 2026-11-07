/* One Holland Village: OSM 1226724186 and verified northern residential ways.
 * Official 3 retail / up to 7 commercial floors; 34/28/3 residential floors.
 * Metre elevations are explicit estimates (112/98/12m), not stale tile heights.
 * Interlude is suspended under the ETFE court canopy, NOT Holland Piazza's fascia. */
{
const {register,scale,center,rect,lerp}=SGBV;
register('one_holland_village','One Holland Village','One Holland Village',215,(b,D,G,g)=>{
 const P=D.parts[0].p,I=scale(P,.67),W=scale(P,.94),L=4.4;
 // Porous retail ring: no filled slab across the public shopping street.
 b.prism(P,-.55,.1,'#c6c7bb');
 for(let f=0;f<3;f++){
  const y=f*L;
  b.capHole(P,[I],y+.2,'#b5b5a6');b.capHole(P,[I],y+L-.3,'#dedfd5');
  b.walls(W,y+.3,y+L-.4,'#344d4f',2);b.walls(scale(I,1.08),y+.3,y+L-.4,'#345251',2);
  for(const [ring,outer]of [[P,true],[I,false]])ring.forEach((p,i)=>{const q=ring[(i+1)%ring.length],dx=q[0]-p[0],dz=q[1]-p[1],len=Math.hypot(dx,dz),n=Math.max(1,Math.ceil(len/7));
   b.beam([p[0],y+L-.22,p[1]],[q[0],y+L-.22,q[1]],.36,'#edeee6');
   for(let j=0;j<n;j++){
    const t=j/n,x=lerp(p[0],q[0],t),z=lerp(p[1],q[1],t);b.box(x,y+.1,z,.30,L-.3,.30,'#dedfd6');
    if(f>0){b.beam([x,y+.75,z],[lerp(p[0],q[0],(j+1)/n),y+.75,lerp(p[1],q[1],(j+1)/n)],.10,'#827566');}
    if(f===0&&outer&&len>10){const a=Math.atan2(-dz,dx),mx=lerp(p[0],q[0],(j+.5)/n),mz=lerp(p[1],q[1],(j+.5)/n);b.box(mx,y+3.0,mz,Math.min(5.8,len/n-.3),.16,2.1,j%3?'#b9b6a6':'#a58c76',a);}
   }
  });
 }
 // Photo-interpreted inner retail bar separates the two pedestrian streets.
 // Its internal position is approximate; the external footprint remains OSM.
 const streetBar=rect(-6,-4,15,65,.45);
 b.prism(streetBar,.1,12.8,'#c9cec4');b.facade(scale(streetBar,1.001),.4,12.7,4.4,4.5,'#52716b','#dfe4da',.28);
 b.cap(streetBar,13.0,'#bdc7b8');b.rim(streetBar,13.3,'#e0e6da',.22);
 for(let i=0;i<4;i++){const x=-13+i*4.5,z=-17+i*9;b.box(x,13.0,z,3,.45,2,'#a9b8a1');b.cap(rect(x,z,2.8,1.8),13.48,'#6f895c');}
 // Seven-storey office podium confined to the residential/northwest end.
 const office=[P[0],P[1],P[2],P[3],I[3],I[2],I[1],I[0]];
 b.prism(office,13.2,28.0,'#c5c9c4');b.facade(scale(office,1.001),13.4,27.8,3.6,3.6,'#66817e','#dfdfd6',.24);
 b.cap(office,28.1,'#a4aea4');b.rim(office,28.5,'#dde0d4',.20);
 // Sky gardens, warm corridors, modest furniture, planters and public steps.
 for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length];if(i%2===0){const x=(p[0]+q[0])/2,z=(p[1]+q[1])/2,plan=rect(x*.88,z*.88,5,1.8,Math.atan2(-(q[1]-p[1]),q[0]-p[0]));b.prism(plan,13.1,13.65,'#b8bbae');b.cap(scale(plan,.88),13.7,'#5d7a4b');}}
 for(let i=0;i<I.length;i+=3){const p=I[i];b.tree(p[0]*.65,0,p[1]*.65,.85);b.box(p[0]*.68,.15,p[1]*.68,4,.45,1.1,'#969b8d',-.5);}
 for(let j=0;j<7;j++)b.box(26+j*.7,-.1+j*.18,64-j*.6,22,.19,1.0,'#a3a79b',-.6);
 for(const z of [-28,-5,22]){b.box(-5,.1,z,2,.7,3,'#a1aa99');b.cap(rect(-5,z,1.8,2.8),.82,'#688754');}
 const bridge=rect(-4,-20,44,4,-.4);b.prism(bridge,8.6,8.95,'#d5dacf');b.rim(bridge,9.9,'#8b8f80',.12);
 // 30x18m = 540m² plan ETFE canopy. Frame + pitched lightweight cushions.
 const cx=9,cz=22,ang=-.55,xf=(x,z,y)=>[cx+x*Math.cos(ang)+z*Math.sin(ang),y,cz-x*Math.sin(ang)+z*Math.cos(ang)];
 const canopy=new SGBV.Batch(G.base),art=new SGBV.Batch(G.base);
 for(const x of [-15,15])for(const z of [-9,9]){const a=xf(x,z,0),q=xf(x,z,15.8);b.beam(a,q,.38,'#e2e5dc');}
 for(let j=0;j<=6;j++){const z=-9+j*3;for(let k=0;k<6;k++){const x=-15+k*5,y=v=>15.9+1.3*(1-v*v/225);const A=xf(x,z,y(x)),B=xf(x+5,z,y(x+5));b.beam(A,B,.16,'#e5e8df');if(j<6){const C=xf(x+5,z+3,y(x+5)),E=xf(x,z+3,y(x));canopy.quad('#dce6df',A,B,C,E);}}}
 for(let k=0;k<=6;k++){const x=-15+k*5;b.beam(xf(x,-9,15.9+1.3*(1-x*x/225)),xf(x,9,15.9+1.3*(1-x*x/225)),.14,'#e7e9df');}
 // Original low-cost interpretation of the suspended colour-field, no lettering.
 const palette=['#e7a244','#d87863','#be6676','#9a79a0','#6d7da8','#4e91a6','#78aca5'];
 for(let j=0;j<5;j++)for(let k=0;k<41;k++){
  const x=-14.5+k*.72,z=-8+j*3.6,h=1.7+1.3*Math.sin(k*.16+j*.8),y=15.5;
  art.quad(palette[(Math.floor(k/6)+j)%palette.length],xf(x,z,y),xf(x+.20,z+2.8,y),xf(x+.20,z+2.8,y-h),xf(x,z,y-h));
 }
 canopy.flush(g,()=>{const source=lmMat({c:'#ffffff',vc:true,ds:true,m:0,glow:'#ffe6bf',gk:.20}),m=source.clone();m.onBeforeCompile=source.onBeforeCompile;m.customProgramCacheKey=()=>source.customProgramCacheKey()+':ohv-etfe';if(typeof LMCTX!=='undefined'&&LMCTX)LMCTX.mats.set('ohv-etfe',m);m.transparent=true;m.opacity=.43;m.depthWrite=false;return m;});
 art.flush(g,()=>lmMat({c:'#ffffff',vc:true,ds:true,m:0,glow:'#ffe0ae',gk:.30}));
 // Warm linear corridor lights visible in the landscape contractor's night photo.
 const lights=new SGBV.Batch(G.base);
 for(const ring of [P,I,streetBar])for(const y of [4.05,8.45,12.85])ring.forEach((p,i)=>{const q=ring[(i+1)%ring.length];lights.beam([p[0],y,p[1]],[q[0],y,q[1]],.10,'#ffe5bc');});
 lights.flush(g,()=>lmMat({c:'#ffffff',vc:true,ds:true,m:0,glow:'#ffdb9e',gk:.65}));
 // Verified OSM residential footprints. Remove only sub-metre zigzag detail.
 function simplify(P){return P.filter((p,i)=>{const a=P[(i+P.length-1)%P.length],c=P[(i+1)%P.length];return Math.abs((c[0]-a[0])*(p[1]-a[1])-(c[1]-a[1])*(p[0]-a[0]))/(Math.hypot(c[0]-a[0],c[1]-a[1])||1)>.28;});}
 for(const [i,part]of D.parts.slice(1).entries()){
  const Q=simplify(part.p),H=[112,98,12][i],floors=[34,28,3][i],F=(H-2)/floors;
  b.prism(Q,-.4,H-1.4,i===1?'#a9b8b5':'#d3d8cd');
  // Shared glass material and coloured spandrels; physical balcony groups.
  b.facade(scale(Q,1.002),1.0,H-2,F,i===2?4.2:4.5,i===1?'#627f7c':'#73938e','#dce0d5',0);
  for(let f=1;f<floors;f+=i===2?1:3){b.band(scale(Q,1.012),f*F,.20,'#dfe3da');}
  const C=center(Q);Q.forEach((p,k)=>{if(k%3===0)b.beam([p[0],.3,p[1]],[p[0],H-1,p[1]],.24,i===1?'#9daea8':'#dfe5da');});
  b.cap(Q,H-1.3,'#b8c2b5');b.rim(Q,H-.1,'#d6dfd1',.18);
  const plant=scale(Q,.45);b.prism(plant,H-1.3,H,'#a6b3a8');
  if(i===2){b.garden(scale(Q,.90),H-.1,false);for(let k=0;k<Q.length;k+=4)b.tree(Q[k][0],H,Q[k][1],.35);}
 }
});
}
