/* IMM: OSM 33543880 (mall) and 429038696 (north car park).
 * Original metre geometry, +x east / +z south. Photos: Commons 2018/2025,
 * ICSC 2019 shopping-centre tours p5 (dusk). No image assets or logos ship.
 */
{
const {register,scale,out,rect,inside,Batch}=SGJE;
SGJE.data.imm.height=31.6;
SGJE.data.imm.height_source='Image-only reference meta.json: measured maximum 31.6 m; p90 roof 30.6 m, median roof 26.2 m';
register('imm','国际商品城','IMM',191,(b,D,G,g)=>{
 const P=D.parts.find(p=>p.id===33543880).p,C=D.parts.find(p=>p.id===429038696).p;
 const H=26.2,deck=13.2;
 // Three-storey retail base follows every turn of the surveyed OSM perimeter.
 b.prism(P,-.5,deck,'#c5c6bb');
 // The higher warehouse / office body is recessed behind the garden frontage.
 const T=[[-90.6,-25.55],[-66,-48],[71.89,-42.17],[92.46,134.19],[84.95,134.62],[89.58,139.69],[92.72,148.95],[92.51,160.18],[86.73,171.18],[79.09,177.83],[67.33,180.26],[60.57,179.53],[53.14,176.62],[-43.55,101.43],[-49.54,94.86],[-52.04,86.35],[-51.87,77.69],[-53,56],[-72,20]];
 b.prism(T,deck,H-.5,'#d5d4c5');b.cap(T,H-.5,'#a6aaa0');b.rim(T,H-.25,'#e3e1d4',.45);
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
 // The broad roof is a service deck at the measured median 26.2 m,
 // with a shallow central roof cover rising towards the 30.6 m p90 level.
 // Its two rectangles and tapering skirt are visible in the image-only top view.
 const lower=rect(13,49,113,187,.105),upper=rect(13,49,79,149,.105);
 b.prism(lower,H-.3,H+.2,'#bec2ba');
 lower.forEach((p,i)=>{const q=lower[(i+1)%4],r=upper[(i+1)%4],v=upper[i];b.quad('#d5d7cd',[p[0],H+.2,p[1]],[q[0],H+.2,q[1]],[r[0],30.3,r[1]],[v[0],30.3,v[1]]);});
 b.cap(upper,30.3,'#d8dad2');b.rim(upper,30.5,'#c5c9c1',.2);
 // The secondary southern cover and standing seams remain below the crown.
 b.prism(rect(36,145,58,42,.105),H-.25,28.6,'#cdd0c7');
 for(let z=-20;z<120;z+=13){const p=[13+Math.sin(.105)*(z-49),30.36,z];b.beam([p[0]-38,30.36,p[2]+4],[p[0]+38,30.36,p[2]-4],.045,'#b8beb7');}
 // Groups of cooling plant flank the central roof instead of scattered boxes.
 for(const [x,z,n,axis]of [[-21,-36,8,0],[37,-42,7,0],[66,20,7,1],[-55,16,5,1],[64,109,5,1]]){
  for(let j=0;j<n;j++){const xx=x+(axis?0:j*4.2),zz=z+(axis?j*7.8:0);if(!inside(T,xx,zz))continue;
   b.box(xx,H,zz,axis?4.5:3.5,1.8,axis?5.5:6,'#afb8b0');b.cap(SGJE.ellipse(xx,zz,1.3,1.3,10),H+1.86,'#526760');
   b.box(xx+.6,H-.1,zz+3,1,.6,1.4,'#a4b3ad');
  }
 }
 for(const z of [-38,-34])b.beam([-36,27,z],[57,27,z],.38,'#b0c8bc');
 // Narrow service housings seen on the east perimeter and a north lift head.
 for(const [x,z,w,d]of [[67,66,7,14],[60,-33,10,12],[-68,-17,8,10]])b.box(x,H-.2,z,w,5.6,d,'#c7cec3');
 // White tensile pavilions above the west garden. Four corner troughs and a
 // raised centre give each canopy its real light saddle silhouette.
 for(const [x,z,w,d]of [[-99,21,26,47],[-70,58,22,22]]){
  const Q=rect(x,z,w,d,-.62),mid=[x,20,z];
  Q.forEach((p,i)=>{const q=Q[(i+1)%4],m=[(p[0]+q[0])/2,18.7,(p[1]+q[1])/2];b.tri('#ebece1',[p[0],16.7,p[1]],m,mid);b.tri('#e3e6da',m,[q[0],16.7,q[1]],mid);b.box(p[0],deck,p[1],.18,3.5,.18,'#b4bdb3');});
 }
 screen.flush(g,()=>lmMat({c:'#ffffff',vc:true,ds:true,m:0,lk:0,glow:'#ffbc72',gk:.28}));
 lit.flush(g,()=>lmMat({c:'#ffffff',vc:true,ds:true,m:0,lk:0,glow:'#ffdfad',gk:.65}));
});
}
