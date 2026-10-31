/* EW24 / NS1 Jurong East. OSM ways 33737976 and 881935994.
 * Original metre geometry: elevated concourse, three island platforms, red
 * space-frame roof and the 2020 temporary bus interchange photographed in 2023.
 * Existing app viaducts and moving trains are retained. No logos or text. */
{
const {register,scale,inside}=SGJE;
register('jurong_east_mrt','裕廊东地铁站','Jurong East MRT',205,(b,D)=>{
 const P=D.parts[0].p,B=D.parts[1].p;
 // OSM's long edges fix the track azimuth, 29.3 degrees east of south.
 const pt=(u,y,v)=>[.49*u+.872*v,y,.872*u-.49*v];
 const plan=(u,v,w,d)=>[[u-w/2,v-d/2],[u+w/2,v-d/2],[u+w/2,v+d/2],[u-w/2,v+d/2]].map(([u,v])=>{const p=pt(u,0,v);return [p[0],p[2]];});
 const beam=(u,y,v,U,Y,V,w,c)=>b.beam(pt(u,y,v),pt(U,Y,V),w,c);
 const box=(u,y,v,w,h,d,c,mode=0)=>b.prism(plan(u,v,w,d),y,y+h,c,mode);
 // Independent lamp material; the white roofs and concrete stay dark at night.
 const oldFlush=b.flush.bind(b);
 b.flush=g=>oldFlush(g,mode=>lmMat({c:'#ffffff',vc:true,ds:true,m:mode===2?1:0,lk:mode===2?.17:0,lc:'#e6eddc',fh:4,cw:3,glow:mode===4?'#ffedce':undefined,gk:mode===4?.62:undefined}));
 const lamp=(u,y,v,w,d)=>box(u,y,v,w,.09,d,'#e9dfc5',4);
 // Open pilotis below the concourse; no filled ground-to-roof extrusion.
 b.prism(scale(P,.965),5.6,6.4,'#a9aaa0');
 b.prism(scale(P,.95),6.4,9.9,'#6e7975',2);
 b.band(scale(P,.97),9.7,.7,'#d1cec0');
 for(let u=-102;u<76;u+=14)for(const v of [56,80,95]){
  const p=pt(u,0,v);if(!inside(P,p[0],p[2]))continue;
  box(u,-.3,v,1.25,11.7,1.25,'#b8b8a9');
 }
 // Three islands with dark half-height doors; four rail slots remain open.
 for(const [v,u0,u1,w]of [[49,-63,75,9],[71,-109,75,10],[94,-62,75,9]]){
  box((u0+u1)/2,10.3,v,u1-u0,.65,w,'#b9b8a7');
  for(const sd of [-1,1]){
   box((u0+u1)/2,10.96,v+sd*(w/2-.35),u1-u0,.07,.24,'#d9c26f');
   for(let u=u0+1;u<u1-1;u+=3.1){
    box(u,11.05,v+sd*w/2,2.8,1.35,.13,'#496163',2);
    box(u,12.4,v+sd*w/2,3.05,.13,.23,'#acb7b0');
    box(u-1.46,11,v+sd*w/2,.10,1.6,.20,'#b8c0b7');
   }
  }
  for(let u=u0+6;u<u1;u+=12){
   box(u,10.95,v,0.48,5.7,.48,'#d7c7a3');
   box(u,15.8,v,5,.55,1,'#c4c1b3');lamp(u,15.72,v,2.7,.27);
   box(u,13.6,v+1.5,1.9,.64,.13,'#d1dccb',4);
  }
 }
 // Roofs have chamfered section edges and broad pale flat lids, as seen in
 // the close exterior photo; deep red triangulated soffits are left open.
 function roof(u0,u1,v0,v1,top){
  const profile=[[v0,top-3.5],[v0+3.4,top],[v1-3.4,top],[v1,top-3.5]];
  for(let j=0;j<3;j++){
   const [v,y]=profile[j],[V,Y]=profile[j+1];
   b.quad(j===1?'#ced1c6':'#b9beb2',pt(u0,y,v),pt(u1,y,v),pt(u1,Y,V),pt(u0,Y,V));
   beam(u0,y+.04,v,u1,y+.04,v,.20,'#e0e0d1');
   for(let u=u0;u<u1;u+=3.1)beam(u,y+.07,v,u,Y+.07,V,.055,'#a6b0a7');
  }
  beam(u0,top,v1-3.4,u1,top,v1-3.4,.2,'#e0e0d1');
  for(let u=u0;u<=u1;u+=6.2){
   for(let j=0;j<3;j++){
    const [v,y]=profile[j],[V,Y]=profile[j+1];
    beam(u,y-.25,v,u,Y-.25,V,.14,'#8f5149');
    beam(u,top-4.4,v,u,top-4.4,V,.14,'#97584e');
    beam(u,top-4.4,v,u,Y-.35,V,.12,'#97584e');
    if(u+6.2<=u1){beam(u,top-4.4,v,u+6.2,Y-.35,V,.11,'#97584e');beam(u,y-.35,v,u+6.2,top-4.4,V,.11,'#97584e');}
   }
  }
  for(const v of [v0,v1])beam(u0,top-3.7,v,u1,top-3.7,v,.3,'#a36256');
 }
 roof(-62.7,75.8,43.5,71.6,22);
 roof(-62.7,75.8,71.6,99.6,22);
 roof(-110.1,-63,53.2,83.0,21.3);
 // Narrow glazed gutters/skylights subdivide the principal lids.
 for(const v of [52,63,80,91]){
  box(5.5,22.035,v,134,.055,1.35,'#849d98',2);
  for(let u=-60;u<74;u+=3.1)box(u,22.1,v,.08,.08,1.42,'#d1d8ca');
 }
 // Two stair cores at the third-platform extension, beneath the main eaves.
 for(const [u,v]of [[-83,67],[54,86]]){
  box(u,0,v,7,10.4,7,'#aaa99b');
  box(u,10.4,v,7.1,3.7,6.6,'#a8a99a');
  for(let k=0;k<16;k++)box(u-8+k*.55,.1+k*.34,v,0.6,.34,3.4,'#bdbdb0');
 }
 // Bus interchange: its OSM shape is a set of shallow, branching concourse
 // canopies. Keep the open boarding edges and salmon horizontal louvres.
 b.prism(B,-.25,.23,'#b9b8a8');
 b.prism(B,5.8,6.18,'#b8a39a');b.cap(B,6.22,'#bdafa3');
 const Q=scale(B,.996);
 Q.forEach((p,i)=>{
  const q=Q[(i+1)%Q.length],dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz),n=Math.max(1,Math.ceil(L/8));
  for(let k=0;k<n;k++){
   const x=p[0]+dx*(k+.5)/n,z=p[1]+dz*(k+.5)/n;
   b.box(x,.23,z,.28,5.55,.28,'#d5d3c7');
   if(k%2===0)b.box(x,5.68,z,1.6,.08,.65,'#e4e4ce',Math.atan2(-dz,dx),4);
  }
  for(let y=3.4;y<5.75;y+=.58)b.beam([p[0],y,p[1]],[q[0],y,q[1]],.15,'#a7786b');
  b.beam([p[0],6.3,p[1]],[q[0],6.3,q[1]],.28,'#b49d91');
 });
 // Roof seams and low service blocks stay inside the bus canopy footprint.
 const bb=[Math.min(...B.map(p=>p[0])),Math.max(...B.map(p=>p[0])),Math.min(...B.map(p=>p[1])),Math.max(...B.map(p=>p[1]))];
 for(let x=bb[0]+2;x<bb[1];x+=4)for(let z=bb[2]+2;z<bb[3];z+=4){
  if(inside(B,x,z)&&inside(B,x,z+3.8))b.beam([x,6.25,z],[x,6.25,z+3.8],.055,'#a48d82');
 }
});
}
