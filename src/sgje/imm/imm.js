/* IMM: OSM 33543880 (mall) and 429038696 (north car park).
 * Original metre geometry, +x east / +z south. Photos: Commons 2018/2025,
 * ICSC 2019 shopping-centre tours p5 (dusk). No image assets or logos ship.
 */
{
const {register,scale,out,rect,inside,Batch}=SGJE;
register('imm','国际商品城','IMM',191,(b,D,G,g)=>{
 const P=D.parts.find(p=>p.id===33543880).p,C=D.parts.find(p=>p.id===429038696).p;
 const H=30,deck=13.2;
 // Three-storey retail base follows every turn of the surveyed OSM perimeter.
 b.prism(P,-.5,deck,'#c5c6bb');
 // The higher warehouse / office body is recessed behind the garden frontage.
 const T=[[-90.6,-25.55],[-66,-48],[71.89,-42.17],[92.46,134.19],[84.95,134.62],[89.58,139.69],[92.72,148.95],[92.51,160.18],[86.73,171.18],[79.09,177.83],[67.33,180.26],[60.57,179.53],[53.14,176.62],[-43.55,101.43],[-49.54,94.86],[-52.04,86.35],[-51.87,77.69],[-53,56],[-72,20]];
 b.prism(T,deck,H-1,'#d5d4c5');b.cap(T,H-1,'#a6aaa0');b.rim(T,H-.3,'#e3e1d4',.55);
 // Cream cladding and continuous recessed grey ribbon windows. Physical seams
 // keep the rounded southern end legible at street distance.
 const O=out(T,.08);
 for(let f=0;f<3;f++){
  const y=15.2+f*4.4;
  b.walls(O,y,y+1.65,'#8c9c97');b.rim(O,y-.05,'#e4e3d8',.13);b.rim(O,y+1.7,'#b4b9ad',.13);
 }
 O.forEach((p,i)=>{const q=O[(i+1)%O.length],n=Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])/2.7);for(let j=0;j<n;j++){const t=j/n,x=p[0]+(q[0]-p[0])*t,z=p[1]+(q[1]-p[1])*t;b.beam([x,deck,z],[x,H-1,z],.055,'#b7b9ad');}});
 // North multi-storey car park: dark open ventilation slots, broad slab edges,
 // and closely spaced upright piers, rather than an office curtain wall.
 b.prism(C,-.4,25.5,'#b6b8ad');
 const CO=out(C,.12);
 for(let y=3.3;y<25;y+=4.2){b.walls(CO,y,y+2.3,'#596360');b.rim(CO,y-.2,'#d0d0c1',.48);b.rim(CO,y+2.4,'#cbcbbd',.28);}
 CO.forEach((p,i)=>{const q=CO[(i+1)%CO.length],n=Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])/6.5);for(let j=0;j<n;j++){const t=j/n;b.box(p[0]+(q[0]-p[0])*t,0,p[1]+(q[1]-p[1])*t,.65,25.5,.65,'#d3d3c5');}});
 b.cap(C,25.5,'#9c9f95');b.rim(C,26.2,'#d0d1c3',.48);
 // Parking stalls and plant courts are low roof details, kept on their own roof.
 for(let x=-55;x<60;x+=5.5)for(let z=-98;z<-35;z+=17){if(inside(C,x,z)&&inside(C,x+4,z+8)){b.box(x,25.54,z,.09,.025,7.5,'#dddcc9');}}
 // Low street frontage: charcoal shop frames and grey-green glazing below the
 // planted upper deck. Pink/orange luminous panel wall is photo-observed.
 const front=[P[8],P[9],P[10],P[11],P[12],P[13]];
 b.facade(front,.8,8.1,7.3,3.1,'#628984','#363e3d',.15,false);
 const lit=new Batch(G.base),screen=new Batch(G.base);
 const frontOuter=out(P,.16);
 for(const i of [8,9,10,11,12]){
  const p=frontOuter[i],q=frontOuter[i+1],n=Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])/4.2);
  for(let j=0;j<n;j++)for(let k=0;k<2;k++){
   const t=(j+.035)/n,u=(j+.965)/n,y=8.25+k*2.25;
   screen.quad(['#c75d65','#d16c68','#bd5667','#d78068'][(j+k*3)%4],[p[0]+(q[0]-p[0])*t,y,p[1]+(q[1]-p[1])*t],[p[0]+(q[0]-p[0])*u,y,p[1]+(q[1]-p[1])*u],[p[0]+(q[0]-p[0])*u,y+2.08,p[1]+(q[1]-p[1])*u],[p[0]+(q[0]-p[0])*t,y+2.08,p[1]+(q[1]-p[1])*t]);
  }
  b.beam([p[0],8.1,p[1]],[q[0],8.1,q[1]],.2,'#394441');b.beam([p[0],12.8,p[1]],[q[0],12.8,q[1]],.22,'#394441');
 }
 // Landscaped retail roof, visible above the low west facade.
 const garden=[[-103,-8],[-124,21],[-54,73],[-54,60],[-68,25],[-81,2]];
 b.garden(garden,deck+.06,false);
 for(const [x,z]of [[-110,20],[-96,32],[-81,44],[-65,54],[-96,1]])b.tree(x,deck+.1,z,.85);
 const path=[[-119,20],[-114,14],[-62,55],[-59,65]];b.cap(path,deck+.15,'#b9b5a6');
 // Entrance glass / blank light box and shallow metal-and-glass hoods.
 for(const i of [9,13,25]){
  const p=P[i],q=P[(i+1)%P.length],dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz),x=(p[0]+q[0])/2,z=(p[1]+q[1])/2,a=Math.atan2(-dz,dx),w=Math.min(17,L*.72);
  b.box(x,0,z,w,7,.3,'#314b4c',a,2);lit.box(x,5.6,z,w*.75,1.2,.36,'#f4dfbd',a);
  const nx=dz/L*2.3,nz=-dx/L*2.3;
  b.box(x+nx,6.8,z+nz,w+2,.28,5.3,'#a9b8b3',a);
  for(const t of [-.42,.42]){const px=x+dx/L*w*t+nx*1.7,pz=z+dz/L*w*t+nz*1.7;b.box(px,0,pz,.35,6.8,.35,'#c7ccc2');}
  lit.box(x+nx,6.68,z+nz,w-.5,.09,2.8,'#e1cfb0',a);
 }
 // Small rooftop mechanical enclosures, with dark louvres and no invented logo.
 for(const [x,z,w,d]of [[20,42,17,12],[49,95,14,16],[-17,5,13,11]]){
  if(!inside(T,x,z))continue;b.box(x,H-.9,z,w,.85,d,'#aeb6ad');b.box(x,H-.04,z,w*.8,.04,d*.72,'#64726e');
  for(let j=-2;j<=2;j++)b.box(x+j*w/6,H-.1,z,.12,.06,d*.72,'#c1c8bf');
 }
 screen.flush(g,()=>lmMat({c:'#ffffff',vc:true,ds:true,m:0,lk:0,glow:'#ffbc72',gk:.28}));
 lit.flush(g,()=>lmMat({c:'#ffffff',vc:true,ds:true,m:0,lk:0,glow:'#ffdfad',gk:.65}));
});
}
