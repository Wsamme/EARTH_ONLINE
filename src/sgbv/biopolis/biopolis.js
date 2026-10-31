/* Biopolis phase one: Chromos, Matrix, Genome, Proteos, Helios,
 * Centros and Nanos, OSM ways 168243403/404/405/407/409/410/411.
 * Measured cluster maximum 77.7 m; individual roof levels are photo estimates.
 */
{
const {register,scale,center,out,inside}=SGBV;
register('biopolis','启奥城','Biopolis',190,(b,D,G)=>{
 const heights=[53,66,55,61,75.7,57,65],cols=['#8a9292','#8f9997','#809096','#9b9f97','#a4a598','#929a97','#a4a59d'];
 D.parts.forEach((part,i)=>{const P=part.p,H=heights[i];b.prism(P,-1,5,'#7d8b87');b.prism(P,5,H-2,cols[i]);b.facade(scale(P,1.004),5,H-3,4.1,3.5,i===1?'#688a8f':'#778b8d',cols[i],.65);
  b.roof(P,H-.4,i);const Q=scale(P,.77);b.rim(Q,H,'#b3b9ad',.35);if(i===4)b.cap(Q,H+.05,'#52677a');
  if(i===0||i===4||i===6){const O=out(P,.3),C=center(P);O.forEach((p,k)=>{const q=O[(k+1)%O.length];if((p[1]+q[1])/2>C[1]+4)return;const dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz),n=Math.max(1,Math.floor(L/4.5));b.quad('#ad9f8b',[p[0],5,p[1]],[q[0],5,q[1]],[q[0],H-1,q[1]],[p[0],H-1,p[1]]);for(let f=1;f<(H-6)/4.4;f++)for(let j=0;j<n;j++){if((f+j*3)%4===0)continue;let a=(j+.2)/n,c=(j+.78)/n,ox=(p[0]-C[0])*.003,oz=(p[1]-C[1])*.003,y=5+f*4.4;b.quad('#5a797d',[p[0]+dx*a+ox,y,p[1]+dz*a+oz],[p[0]+dx*c+ox,y,p[1]+dz*c+oz],[p[0]+dx*c+ox,y+.85,p[1]+dz*c+oz],[p[0]+dx*a+ox,y+.85,p[1]+dz*a+oz],2);}});}
  // Tall white external frame on Helios and Matrix laboratory glazing.
  if(i===4||i===1)P.forEach((p,k)=>{if(k%2===0)b.box(p[0],5,p[1],.65,H-5,.65,'#c3cbc5');});
  if(i===4){const Q=scale(P,.72),C=center(Q);Q.forEach(p=>b.beam([C[0],H+.3,C[1]],[p[0],H+.3,p[1]],.22,'#aab8b9'));}
 });
 // Dense laboratory rooftop services, screened wells and taller curtain-wall frames.
 D.parts.forEach((part,i)=>{const P=part.p,H=heights[i],C=center(P),Q=scale(P,.7);if(i!==4){b.walls(Q,H-.2,H+1.1,'#b6c0b7');for(let k=0;k<Q.length;k++){const p=Q[k],q=Q[(k+1)%Q.length];b.beam([p[0],H+.2,p[1]],[q[0],H+.2,q[1]],.28,'#d8dfd4');}}if(i===1||i===3)P.forEach(p=>b.beam([p[0],5,p[1]],[p[0],H,p[1]],.9,'#ccd5cb'));});
 // Landscape along the real park edge west of the laboratory blocks.
 for(let x=-196;x<-60;x+=12)for(let z=-155;z<171;z+=13){const px=x+Math.sin(z*.19+x)*5.4,pz=z+Math.cos(x*.13-z)*5.2;if(D.parts.some(p=>inside(scale(p.p,1.13),px,pz)))continue;b.tree(px,G.at(px,pz)-b.base,pz,1.2+.65*(.5+.5*Math.sin(x+z)));}
 // Enclosed high-level links with glazed sides and pale flat roofs.
 for(const [ia,ib,y]of [[0,4,24],[0,5,20],[5,1,24],[1,6,25],[1,2,23],[2,3,23],[4,6,28]]){const A=center(D.parts[ia].p),C=center(D.parts[ib].p),dx=C[0]-A[0],dz=C[1]-A[1],L=Math.hypot(dx,dz),a=Math.atan2(-dz,dx),x=(A[0]+C[0])/2,z=(A[1]+C[1])/2;b.box(x,y,z,L,3.5,4.5,'#729397',a,2);b.box(x,y+3.5,z,L,.45,5.1,'#cbd2cb',a);for(let k=-L/2;k<L/2;k+=4)b.box(x+k*Math.cos(a),y,z-k*Math.sin(a),.18,3.5,4.7,'#d0d6ce',a);}
 for(const [x,z]of [[-71,-4],[-18,11],[58,1],[57,67],[-17,85],[-150,-76],[-118,-39],[-55,45],[52,163],[146,90]])b.tree(x,0,z,1.8);
});
}
