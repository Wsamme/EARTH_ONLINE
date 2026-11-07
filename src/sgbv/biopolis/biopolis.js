/* Biopolis phase one: Chromos, Matrix, Genome, Proteos, Helios,
 * Centros and Nanos, OSM ways 168243403/404/405/407/409/410/411.
 * Measured cluster maximum 77.7 m; individual roof levels are photo estimates.
 */
{
const {register,scale,center,out,inside}=SGBV;
register('biopolis','启奥城','Biopolis',190,(b,D,G)=>{
 const heights=[53,66,55,61,75.7,57,65];
 // Chromos / Matrix / Genome / Proteos / Helios / Centros / Nanos.
 const cols=['#a89b88','#aab9bb','#aaa69d','#85999d','#b3a58f','#8c9191','#9b8e8b'];
 const glazing=['#69858b','#648791','#748d93','#54747e','#71888e','#5d7d82','#73858d'];
 const bays=[3.6,3.0,4.0,2.9,3.4,3.2,3.7];
 D.parts.forEach((part,i)=>{const P=part.p,H=heights[i];b.prism(P,-1,5,'#7d8b87');b.prism(P,5,H-2,cols[i]);b.facade(scale(P,1.004),5,H-3,4.1,bays[i],glazing[i],cols[i],i===2||i===5?.38:.18);
  // Different horizontal sunshade rhythms, kept close to the measured skins.
  const Oshade=out(P,.18);
  for(let y=8+(i%3)*.6;y<H-4;y+=i===2?4.1:i===5?2.05:8.2){
   Oshade.forEach((p,k)=>{const q=Oshade[(k+1)%Oshade.length];if((i+k)%3===0)return;b.beam([p[0]*.97+q[0]*.03,y,p[1]*.97+q[1]*.03],[q[0]*.97+p[0]*.03,y,q[1]*.97+p[1]*.03],i===5?.14:.22,i===3?'#a7b8bc':'#c0bfb2');});
  }
  if(i===3||i===5){const C=center(P);P.forEach((p,k)=>{const q=P[(k+1)%P.length];if(k%2)return;for(let t=.18;t<1;t+=.22){const x=p[0]+(q[0]-p[0])*t,z=p[1]+(q[1]-p[1])*t;b.beam([x,6,z],[x,H-4,z],.16,i===3?'#c0cbcc':'#b9b3aa');}});}
  // Ground-level recesses and shaded access: no signs or institutional logos.
  const doorEdge=out(P,.22),a=doorEdge[0],d=doorEdge[1],ex=(a[0]+d[0])/2,ez=(a[1]+d[1])/2,angle=Math.atan2(-(d[1]-a[1]),d[0]-a[0]);
  b.box(ex,.1,ez,6,2.5,.28,'#3f5d64',angle,2);b.box(ex,2.75,ez,7,.20,2.7,'#c1c9c4',angle);
  const bx=ex+4.3*Math.cos(angle),bz=ez-4.3*Math.sin(angle);b.box(bx,.1,bz,1.8,.6,1.6,'#9fa99d',angle);b.cap(SGBV.rect(bx,bz,1.6,1.4,angle),.73,'#607b53');

  b.roof(P,H-.4,i);const Q=scale(P,.77);b.rim(Q,H,'#b3b9ad',.35);if(i===4)b.cap(Q,H+.05,'#52677a');
  if(i===0||i===4||i===6){const O=out(P,.3),C=center(P);O.forEach((p,k)=>{const q=O[(k+1)%O.length];if((p[1]+q[1])/2>C[1]+4)return;const dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz),n=Math.max(1,Math.floor(L/4.5));b.quad(i===6?'#a18f8b':i===4?'#b6aa95':'#ad9f8b',[p[0],5,p[1]],[q[0],5,q[1]],[q[0],H-1,q[1]],[p[0],H-1,p[1]]);for(let f=1;f<(H-6)/4.4;f++)for(let j=0;j<n;j++){if((f+j*3)%4===0)continue;let a=(j+.2)/n,c=(j+.78)/n,ox=(p[0]-C[0])*.003,oz=(p[1]-C[1])*.003,y=5+f*4.4;b.quad('#5a797d',[p[0]+dx*a+ox,y,p[1]+dz*a+oz],[p[0]+dx*c+ox,y,p[1]+dz*c+oz],[p[0]+dx*c+ox,y+.85,p[1]+dz*c+oz],[p[0]+dx*a+ox,y+.85,p[1]+dz*a+oz],2);}});}
  // Tall white external frame on Helios and Matrix laboratory glazing.
  if(i===4||i===1)P.forEach((p,k)=>{if(k%2===0)b.box(p[0],5,p[1],.65,H-5,.65,'#c3cbc5');});
  if(i===4){const Q=scale(P,.72),C=center(Q);Q.forEach(p=>b.beam([C[0],H+.3,C[1]],[p[0],H+.3,p[1]],.22,'#aab8b9'));}
 });
 // Dense laboratory rooftop services, screened wells and taller curtain-wall frames.
 D.parts.forEach((part,i)=>{const P=part.p,H=heights[i],C=center(P),Q=scale(P,.7);if(i!==4){b.walls(Q,H-.2,H+1.1,'#b6c0b7');for(let k=0;k<Q.length;k++){const p=Q[k],q=Q[(k+1)%Q.length];b.beam([p[0],H+.2,p[1]],[q[0],H+.2,q[1]],.28,'#d8dfd4');}}if(i===1||i===3)P.forEach(p=>b.beam([p[0],5,p[1]],[p[0],H,p[1]],.9,'#ccd5cb'));});
 // Landscape along the real park edge west of the laboratory blocks.
 for(let x=-196;x<-60;x+=12)for(let z=-155;z<171;z+=13){const px=x+Math.sin(z*.19+x)*5.4,pz=z+Math.cos(x*.13-z)*5.2;if(D.parts.some(p=>inside(scale(p.p,1.13),px,pz)))continue;b.tree(px,G.at(px,pz)-b.base,pz,1.2+.65*(.5+.5*Math.sin(x+z)));}
 // Enclosed high-level links with glazed sides and pale flat roofs.
 for(const [link,[ia,ib,y]]of [[0,4,24],[0,5,20],[5,1,24],[1,6,25],[1,2,23],[2,3,23],[4,6,28]].entries()){
  const A=center(D.parts[ia].p),C=center(D.parts[ib].p),dx=C[0]-A[0],dz=C[1]-A[1],L=Math.hypot(dx,dz),bend=(link%2?1:-1)*4.0;
  const at=t=>[A[0]+dx*t-dz/L*bend*4*t*(1-t),A[1]+dz*t+dx/L*bend*4*t*(1-t)];
  for(let k=0;k<10;k++){const p=at(k/10),q=at((k+1)/10),vx=q[0]-p[0],vz=q[1]-p[1],len=Math.hypot(vx,vz),nx=-vz/len*2.25,nz=vx/len*2.25;
   b.beam([p[0],y,p[1]],[q[0],y,q[1]],.38,'#aebfbc');
   b.quad('#b2c0bf',[p[0]+nx,y,p[1]+nz],[q[0]+nx,y,q[1]+nz],[q[0]-nx,y,q[1]-nz],[p[0]-nx,y,p[1]-nz]);
   b.quad('#c5d0cb',[p[0]+nx*1.133,y+3.5,p[1]+nz*1.133],[q[0]+nx*1.133,y+3.5,q[1]+nz*1.133],[q[0]-nx*1.133,y+3.5,q[1]-nz*1.133],[p[0]-nx*1.133,y+3.5,p[1]-nz*1.133]);
   for(const sign of [-1,1]){b.quad('#66858e',[p[0]+nx*sign,y,p[1]+nz*sign],[q[0]+nx*sign,y,q[1]+nz*sign],[q[0]+nx*sign,y+3.5,q[1]+nz*sign],[p[0]+nx*sign,y+3.5,p[1]+nz*sign],2);b.beam([p[0]+nx*sign,y,p[1]+nz*sign],[p[0]+nx*sign,y+3.5,p[1]+nz*sign],.14,'#c5d0cb');}
  }
 }
 for(const [x,z]of [[-71,-4],[-18,11],[58,1],[57,67],[-17,85],[-150,-76],[-118,-39],[-55,45],[52,163],[146,90]])b.tree(x,0,z,1.8);
});
}
