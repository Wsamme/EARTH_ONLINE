/* Biopolis phase one: Chromos, Matrix, Genome, Proteos, Helios,
 * Centros and Nanos, OSM ways 168243403/404/405/407/409/410/411.
 * Measured cluster maximum 77.7 m; individual roof levels are photo estimates.
 */
{
const {register,scale,center}=SGBV;
register('biopolis','启奥城','Biopolis',190,(b,D)=>{
 const heights=[53,66,55,61,75.7,57,65],cols=['#8a9292','#8f9997','#809096','#9b9f97','#a4a598','#929a97','#a4a59d'];
 D.parts.forEach((part,i)=>{const P=part.p,H=heights[i];b.prism(P,-1,5,'#7d8b87');b.prism(P,5,H-2,cols[i]);b.facade(scale(P,1.004),5,H-3,4.1,3.5,i===1?'#56777b':'#5a7075',cols[i],.65);
  b.roof(P,H-2,i);const Q=scale(P,.77);b.prism(Q,H-1,H,'#959d97');b.cap(scale(Q,.92),H+.05,i===4?'#52677a':'#a3aaa4');
  // Tall white external frame on Helios and Matrix laboratory glazing.
  if(i===4||i===1)P.forEach((p,k)=>{if(k%2===0)b.box(p[0],5,p[1],.65,H-5,.65,'#c3cbc5');});
  if(i===4){const Q=scale(P,.72),C=center(Q);Q.forEach(p=>b.beam([C[0],H+.3,C[1]],[p[0],H+.3,p[1]],.22,'#aab8b9'));}
 });
 // Enclosed high-level links with glazed sides and pale flat roofs.
 for(const [ia,ib,y]of [[0,4,24],[0,5,20],[5,1,24],[1,6,25],[1,2,23],[2,3,23],[4,6,28]]){const A=center(D.parts[ia].p),C=center(D.parts[ib].p),dx=C[0]-A[0],dz=C[1]-A[1],L=Math.hypot(dx,dz),a=Math.atan2(-dz,dx),x=(A[0]+C[0])/2,z=(A[1]+C[1])/2;b.box(x,y,z,L,3.5,4.5,'#729397',a,2);b.box(x,y+3.5,z,L,.45,5.1,'#cbd2cb',a);for(let k=-L/2;k<L/2;k+=4)b.box(x+k*Math.cos(a),y,z-k*Math.sin(a),.18,3.5,4.7,'#d0d6ce',a);}
 for(const [x,z]of [[-71,-4],[-18,11],[58,1],[57,67],[-17,85],[-150,-76],[-118,-39],[-55,45],[52,163],[146,90]])b.tree(x,0,z,1.8);
});
}
