/* Ng Teng Fong / Jurong Community Hospital, OSM 368005263, 368005259,
 * 320763066. Original metre geometry from OSM plans and published photographs.
 * References and uncertainty are documented in REVIEW.md. No image assets ship.
 */
{
const {register,scale,out,center,lerp,inside}=SGJE;
register('ng_teng_fong','黄廷方综合医院','Ng Teng Fong General Hospital',255,(b,D,G)=>{
 const stone='#d6d9cf',edge='#eef0e5',glass='#567475',dark='#46524e';
 // Hospital-specific batches: dark vegetation / cladding, cool ward windows,
 // and the gently warmer entrance and terrace soffits all use lmMat night state.
 const flush=b.flush.bind(b);
 b.flush=g=>flush(g,mode=>{
  const m=lmMat({c:'#ffffff',vc:true,ds:true,
   m:mode===2?1:0,lk:mode===2?.15:.035,lc:'#e2f1f3',fh:4.15,cw:2.5,
   glow:mode===4?'#fff0cd':undefined,gk:mode===4?.65:undefined});
  if(mode===2&&!m.userData.hospitalCool){m.userData.hospitalCool=true;const prior=m.onBeforeCompile;
   m.onBeforeCompile=(shader,renderer)=>{prior.call(m,shader,renderer);
    shader.fragmentShader=shader.fragmentShader.replace(
     'vec3 wc = mix(vec3(1.0, 0.8, 0.56), vec3(0.78, 0.87, 1.0), step(0.55, fract(r * 7.13)));',
     'vec3 wc = mix(vec3(.94, .94, .84), vec3(.79, .90, 1.0), step(.20, fract(r * 7.13)));');
   };m.customProgramCacheKey=()=> 'sgje-hospital-cool-wards-v1';
  }return m;
 });
 const glowQuad=(P,y)=>b.cap(P,y,'#e6e4ce',4);
 const cut=(P,test)=>{const Q=[];P.forEach((p,i)=>{const q=P[(i+1)%P.length],a=test(p),c=test(q);if(a>=0)Q.push(p);if((a<0)!==(c<0)){const t=a/(a-c);Q.push([lerp(p[0],q[0],t),lerp(p[1],q[1],t)]);}});return Q;};
 // Cladding in narrow vertical cassettes; large white areas and sparse green
 // panels match the clinic and four-level common diagnostic podium.
 function panels(P,lo,hi){
  b.prism(P,lo,hi,stone);const Q=out(P,.08);
  Q.forEach((p,i)=>{const q=Q[(i+1)%Q.length],L=Math.hypot(q[0]-p[0],q[1]-p[1]),n=Math.max(1,Math.round(L/1.65));
   for(let j=0;j<n;j++)for(let y=lo+.25,f=0;y<hi-.3;y+=4.15,f++){
    const a=j/n,c=(j+.88)/n,Y=Math.min(y+3.85,hi-.18),k=(j*13+i*7+f*3)%17;
    const col=k<8?glass:k<11?'#9aac9a':k===11?'#718e6d':stone;
    b.quad(col,[lerp(p[0],q[0],a),y,lerp(p[1],q[1],a)],[lerp(p[0],q[0],c),y,lerp(p[1],q[1],c)],[lerp(p[0],q[0],c),Y,lerp(p[1],q[1],c)],[lerp(p[0],q[0],a),Y,lerp(p[1],q[1],a)],k<8?2:0);
   }
  });
  for(let y=lo+4.15;y<hi;y+=4.15)b.band(out(P,.12),y,.16,edge);
 }
 function terraceRing(P,y){
  // Opaque rounded balcony front, inset dark green planting, and a fine rail.
  b.prism(P,y,y+.24,edge);b.band(P,y+.24,.65,stone);
  b.walls(scale(P,.987),y+.82,y+1.22,'#4c6c43');b.capHole(scale(P,.987),[scale(P,.96)],y+1.22,'#547449');
  b.walls(scale(P,.993),y+1.17,y+1.25,'#b6c3b6');
 }
 function ward(P,lo,hi,floors){
  // Sawtooth ward bays sit behind the projecting balcony edge. This is a
  // local planar construction, not a sampled or approximated reference mesh.
  const inset=scale(P,.88),core=[];
  inset.forEach((p,i)=>{const q=inset[(i+1)%inset.length],dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz),n=L>25?Math.round(L/5.5):1;
   for(let j=0;j<n;j++){const t=j/n;core.push([p[0]+dx*t,p[1]+dz*t]);if(n>1){const u=(j+.68)/n,mid=[p[0]+dx*u,p[1]+dz*u],c=center(P),v=[c[0]-mid[0],c[1]-mid[1]],k=1.1/(Math.hypot(...v)||1);core.push([mid[0]+v[0]*k,mid[1]+v[1]*k]);}}
  });const fh=(hi-lo)/floors;
  b.prism(core,lo,hi-.5,dark);b.facade(out(core,.06),lo+.7,hi-.5,fh,2.65,glass,'#c0cbc3',0);
  for(let f=0;f<=floors;f++){
   const y=lo+f*fh;terraceRing(P,y);
   if(f<floors)P.forEach((p,i)=>{if(i%7||i===0)return;const c=center(P),dx=c[0]-p[0],dz=c[1]-p[1],d=Math.hypot(dx,dz)||1;
    const x=p[0]+dx/d*.8,z=p[1]+dz/d*.8;
    b.box(x,y+1.2,z,1.8,.45+(i+f)%3*.15,1.0,(i+f)%2?'#527746':'#617d4f');
   });
   // A shallow staggered row of bay reveals, rather than a flat curtain wall.
   const Q=scale(P,.98);Q.forEach((p,i)=>{const q=Q[(i+1)%Q.length],L=Math.hypot(q[0]-p[0],q[1]-p[1]);if(L<18||f===floors)return;
    const n=Math.round(L/5.2),nx=(q[1]-p[1])/L,nz=-(q[0]-p[0])/L;
    for(let j=0;j<n;j++){const t=(j+.5)/n,x=lerp(p[0],q[0],t),z=lerp(p[1],q[1],t);b.beam([x,y+1.0,z],[x+nx*.85,y+fh-.15,z+nz*.85],.24,stone);}
   });
  }
  b.cap(scale(P,.95),hi+.3,'#929c91');b.rim(P,hi+1.1,stone,.28);
 }
 const B=D.parts.find(p=>p.id===368005263).p,C=D.parts.find(p=>p.id===368005259).p,A=D.parts.find(p=>p.id===320763066).p;
 panels(B,-.5,17);panels(C,-.5,17);panels(A,-.5,34);
 // Two articulated ward wings. Their long footprint, rounded lobes and gables
 // are OSM-derived; height split is a photographic estimate pending references.
 const Bnorth=cut(B,p=>5-p[0]-p[1]),Bsouth=cut(B,p=>p[0]+p[1]-5);
 ward(scale(Bnorth,.98),17,54.35,9);ward(scale(Bsouth,.98),17,71,13);
 // Continuous high north-east service/window face; broad blank crown on top.
 const spine=cut([B[0],...B.slice(1,6),B[61],B[62],[-16,-22]],p=>p[0]+p[1]-10);
 panels(spine,17,69);b.walls(out(spine,.12),69,75,stone);b.cap(spine,75,stone);
 // Round external stair drums with individual white landing edges.
 for(const [x,z,h]of [[-20,40,54.35],[-17,-44,71],[52,52,71]]){
  const R=SGJE.ellipse(x,z,2.3,2.3,14);b.prism(R,17,h,'#a6ada1');
  for(let y=17;y<h;y+=4.15){b.band(out(R,.3),y,.24,edge);b.band(R,y+1.0,.075,'#dce2d4');}
 }
 // Community hospital's broad podium supports the more compact ward slab.
 const CW=cut(C,p=>p[0]-100);ward(scale(CW,.94),17,49.5,8);
 // Plant-screened roof courts and limited mechanical enclosures.
 for(const [P,h]of [[A,34],[Bnorth,55.45],[Bsouth,72.1],[CW,50.6]]){
  const c=center(P);b.box(c[0],h,c[1],12,1.2,7,'#89938a');
  for(let k=0;k<5;k++)b.box(c[0]-5+k*2.4,h+1.2,c[1],1.7,.18,5,'#53656a');
 }
 // Sheltered clinic-to-ward public bridge across the internal street.
 function bridge(p,q,y,width){
  const dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz),nx=-dz/L*width/2,nz=dx/L*width/2;
  const P=[[p[0]+nx,p[1]+nz],[q[0]+nx,q[1]+nz],[q[0]-nx,q[1]-nz],[p[0]-nx,p[1]-nz]];
  b.prism(P,y,y+.45,stone);b.facade(P,y+.45,y+4.0,3.55,2.8,glass,'#c6d2ca',.12);b.prism(out(P,.4),y+4,y+4.35,edge);
  for(let t=0;t<=1;t+=.08){const x=lerp(p[0],q[0],t),z=lerp(p[1],q[1],t);b.beam([x+nx,y+4.35,z+nz],[x-nx,y+4.35,z-nz],.12,'#a6b9b2');}
 }
 bridge([-109,-75],[-59,-40],9,7);
 bridge([66,53],[104,79],9,6);
 // Deep entrance overhangs with pale columns, recessed glazing and blank signs.
 function entrance(P,indices){const Q=out(P,.6);for(const i of indices){const p=Q[i],q=Q[(i+1)%Q.length],L=Math.hypot(q[0]-p[0],q[1]-p[1]);if(L<9)continue;
  const dx=(q[0]-p[0])/L,dz=(q[1]-p[1])/L,nx=dz*5,nz=-dx*5;
  const R=[p,q,[q[0]+nx,q[1]+nz],[p[0]+nx,p[1]+nz]];
  b.prism(R,4.4,4.85,stone);glowQuad(R,4.39);
  for(let s=5;s<L;s+=10)b.box(p[0]+dx*s+nx*.7,0,p[1]+dz*s+nz*.7,.8,4.4,.8,stone);
  const mid=[(p[0]+q[0])/2,(p[1]+q[1])/2];b.box(mid[0],3.05,mid[1],3.8,.65,.15,'#dfeddf',Math.atan2(-dz,dx),4);
 }}
 entrance(B,[24,37]);entrance(C,[18,20]);entrance(A,[2]);
 // Roof greenery stays inside the mapped podiums; no speculative helipad.
 for(const P of [B,C]){const Q=scale(P,.88);for(let i=0;i<Q.length;i+=8){const p=Q[i];if(inside(P,...p))b.tree(p[0],17.1,p[1],.55);}}
});
}
