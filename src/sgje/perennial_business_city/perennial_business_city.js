/* Perennial Business City — OSM way 173029751, original procedural geometry.
 * Eight levels, 49.05 m maximum from the owner's sectional plan. The former
 * warehouse's deep floorplate is retained; this is one connected building.
 */
{
const {register,scale,rect,out,inside,lerp}=SGJE;
SGJE.data.perennial_business_city.height=49.05;
SGJE.data.perennial_business_city.height_source='Official owner sectional plan: 3 x 7.5 m + 3 x 5 m + 7.5 m + 4.05 m; roof frame 49.05 m; reference meta roof p90 49.2 m';
register('perennial_business_city','鹏瑞利商务城','Perennial Business City',178,(b,D)=>{
 const P=D.parts[0].p;
 const T=[P[0],P[1],P[11],...P.slice(12)];
 // Broad pale structural envelope, with the rounded southwest carpark ramp below
 // the open upper roof frame. Floor levels follow the published section.
 b.prism(P,-.5,22.5,'#d3d5cb');b.prism(T,22.5,45,'#dce0d7');
 const ring=out(P,.08),upper=out(T,.10);
 const face=(a,q,y,h,c,mode=0)=>b.quad(c,[a[0],y,a[1]],[q[0],y,q[1]],[q[0],y+h,q[1]],[a[0],y+h,a[1]],mode);
 const cut=(p,q,t)=>[lerp(p[0],q[0],t),lerp(p[1],q[1],t)];
 // Continuous ribbon windows separated by deep white spandrels, rather than
 // an all-glass office tower. Lower public floors have taller teal glazing.
 for(let i=0;i<ring.length;i++){
  const p=ring[i],q=ring[(i+1)%ring.length],L=Math.hypot(q[0]-p[0],q[1]-p[1]);
  if(L<8||(i>=1&&i<=10))continue;
  const a=cut(p,q,.055),d=cut(p,q,.945);
  b.facade([a,d],.7,6.9,6.2,2.4,'#679b9b','#c9d6cd',.15,false);
  const tall=(i===0||i===12||i>=18&&i<=20);
  b.facade([a,d],8.4,tall?20.8:13.3,tall?6.2:4.9,2.4,'#70a2a2','#cbd5cb',.14,false);
  if(!tall)b.facade([a,d],16.2,20.2,4,2.7,'#749b9b','#cad4cd',.12,false);
  b.beam([p[0],7.5,p[1]],[q[0],7.5,q[1]],.38,'#e3e4d9');
 }
 for(let i=0;i<upper.length;i++){
  const p=upper[i],q=upper[(i+1)%upper.length],L=Math.hypot(q[0]-p[0],q[1]-p[1]);if(L<10)continue;
  // Alternating blank service panels and glazed bays reproduce the industrial
  // proportions visible in the owner's completed-building photographs.
  for(const [lo,hi]of [[23.5,25.5],[28.5,30.5],[33.5,35.5],[39,43.7]]){
   const a=cut(p,q,.07),d=cut(p,q,.93);
   b.facade([a,d],lo,hi,hi-lo,2.8,'#668a8d','#c8d1ca',.10,false);
  }
  for(let y of [22.5,27.5,32.5,37.5,45])b.beam([p[0],y,p[1]],[q[0],y,q[1]],.22,'#e6e7de');
  // Subtle panel joints in the opaque piers.
  const n=Math.ceil(L/6);for(let j=0;j<=n;j++){const a=cut(p,q,j/n);b.beam([a[0],22.6,a[1]],[a[0],44.8,a[1]],.045,'#c2c8c0');}
 }
 // Tall olive/gold perforated screens are the characteristic vertical accents.
 // These stand just proud of the white wall; no sign lettering is reproduced.
 for(const [edge,t0,t1]of [[0,.72,.99],[12,.02,.18],[20,.05,.45],[24,.03,.19]]){
  const p=ring[edge],q=ring[(edge+1)%ring.length],a=cut(p,q,t0),d=cut(p,q,t1),L=Math.hypot(d[0]-a[0],d[1]-a[1]);
  face(a,d,7.7,37.3,'#aeb184');
  const n=Math.max(2,Math.round(L/.85));for(let j=0;j<=n;j++){
   const u=cut(a,d,j/n),v=cut(a,d,Math.min(1,(j+.43)/n));
   for(let k=0;k<13;k++)face(u,v,8+k*2.8,(k+j)%2?2.1:2.65,(j+k)%3?'#c5c39a':'#b8ba89');
  }
 }
 // The rounded southwest projection is the eight-level carpark spiral,
 // visible in both southwest reference images; its roof sits below the frame.
 // Open dark slots, white slab edges and uprights follow the actual OSM arc.
 const A=P.slice(1,12),AO=out(A,.13);b.walls(A,0,40,'#647371');
 for(let i=0;i<AO.length-1;i++){
  const p=AO[i],q=AO[i+1];
  face(p,q,.4,39.2,'#536466');
  for(let y=0;y<=40;y+=5){face(p,q,y,.65,'#dce0d6');}
  b.beam([p[0],0,p[1]],[p[0],40.5,p[1]],.50,'#dce0d6');
 }
 const inner=scale(A,.47);b.capHole(A,[inner],40.05,'#b8bfb3');
 b.rim(A,40.55,'#dce0d6',.45);b.walls(inner,35,40.05,'#687b75');b.cap(inner,35,'#394d4c');
 b.rim(inner,40.55,'#dce0d6',.32);
 // Low entrance hood below the main office frontage.
 b.prism(rect(-88,11,27,8,-.61),6.9,7.25,'#d3dcd2');
 for(const [x,z]of [[-98,4],[-79,18]])b.box(x,0,z,.45,7,.45,'#d7dfd5');
 // Roof garden and solar farm, documented by the owner. Garden/plant positions
 // are schematic inside the true envelope until matched-camera refs arrive.
 b.cap(T,45.02,'#adb5aa');b.rim(T,45.65,'#e1e4d6',.4);
 const garden=[[-97,-58],[-57,-114],[-11,-82],[3,-52],[-21,-16],[-67,-25]];
 b.garden(garden,45.1,false);
 for(const [x,z]of [[-77,-52],[-60,-83],[-37,-89],[-21,-57],[-46,-39]])b.tree(x,45.2,z,.60);
 // A pale open roof frame above the northern garden, with genuine openings.
 for(let edge=0;edge<T.length;edge++){
  const p=T[edge],q=T[(edge+1)%T.length],L=Math.hypot(q[0]-p[0],q[1]-p[1]);if(L<12)continue;
  b.beam([p[0],48.8,p[1]],[q[0],48.8,q[1]],.5,'#dce1d5');
  const n=Math.ceil(L/15);for(let j=0;j<=n;j++){const a=cut(p,q,j/n);b.box(a[0],45,a[1],.45,4.05,.45,'#dce1d5');}
 }
 const Q=scale(T,.88);
 for(let x=-77;x<121;x+=7)for(let z=-72;z<103;z+=5){
  if(!inside(Q,x,z)||!inside(Q,x+5,z+3)||inside(garden,x,z))continue;
  b.quad('#405d68',[x,45.3,z],[x+5,45.3,z],[x+5,45.85,z+3],[x,45.85,z+3]);
  b.beam([x+2.5,45.32,z],[x+2.5,45.87,z+3],.035,'#b1bdb7');
 }
 // Recessed plant enclosures remain below the rooftop frame.
 for(const [x,z]of [[30,-28],[53,-12],[74,5]]){b.box(x,45.15,z,12,2.4,8,'#a7b0a8',-.6);for(let i=-4;i<=4;i+=2)b.box(x+i,47.6,z,1.3,.1,5,'#667873',-.6);}
 // Blank entrance light panels and warm glazed vestibules, kept under canopies.
 for(const [x,z,a]of [[-88,11,-.61],[25,91,-.61],[113,42,.66]]){
  b.box(x,1,z,12,5,.25,'#5d8a8b',a,2);b.box(x,6.4,z,16,.3,4,'#d7dfd4',a);
  b.box(x,5.5,z,4,.65,.3,'#eadfba',a,4);
 }
 // Night output uses the app's shared lmMat shader. Solid walls stay dark;
 // modest occupied windows replace any speculative decorative light show.
 const flush=b.flush.bind(b);b.flush=g=>flush(g,mode=>lmMat({c:'#ffffff',vc:true,ds:true,m:mode===2?1:0,lc:'#ffe4be',lk:mode===2?.16:0,fh:5,cw:2.8,glow:mode===4?'#ffe3aa':undefined,gk:mode===4?.38:0}));
});
}
