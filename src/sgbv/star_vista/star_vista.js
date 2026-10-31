/* ★ The Star Vista: OSM way 104352121. Envelope 169.2 × 128.8 m;
 * measured overall height 74.5 m. Hand-built split aluminium shells, no signage.
 * The shell control sections are design estimates from all six reference photos.
 */
{
const {register,scale,ellipse,lerp}=SGBV;
register('star_vista','星悦汇','The Star Vista',97,(b,D)=>{
 const P=D.parts[0].p;
 b.prism(scale(P,.99),-1,3,'#9ca6a1');
 // Set-back shopping galleries: two wings, open central amphitheatre to the east.
 const north=[[-69,-47],[-40,-52],[1,-42],[42,-30],[71,-20],[70,-3],[35,-7],[-5,-17],[-65,-14]];
 const south=[[-74,0],[-41,4],[-7,17],[24,35],[56,43],[41,61],[-8,42],[-58,28],[-77,21]];
 for(let f=0;f<3;f++)for(const Q of [north,south]){const R=scale(Q,1-f*.026);b.prism(R,3+f*5.3,7+f*5.3,'#627b7d',2);b.facade(scale(R,1.003),3+f*5.3,7+f*5.3,4,3.3,'#668180','#afbdb8',.18);b.prism(scale(R,1.025),7+f*5.3,7.8+f*5.3,'#c5ccc5');b.rim(scale(R,1.02),8.9+f*5.3,'#bec7c0',.25);}
 // Rock auditorium bulk held above the plaza, with a dark faceted underside.
 b.prism([[-67,-32],[-40,-40],[-6,-29],[27,-10],[30,12],[-5,18],[-63,4]],27,49,'#687b7c');
 function shell(s){const n=28,top=[],bottom=[];const Z=(t,inner)=>s===0?(inner?-10+32*t*t:-51+33*t*t):(inner?1+39*t*t:29+34*t*t);const Y=(t,u)=>s===0?65.5-5*t-3*u:74.5-12*t-2*u;
  for(let i=0;i<=n;i++){const t=i/n,x=-66+(s===0?138:117)*t;top.push([[x,Y(t,0),Z(t,false)],[x,Y(t,1),Z(t,true)]]);bottom.push([[x*.91,43-7*t,Z(t,false)*.82],[x*.91,37-5*t,Z(t,true)*.84]]);}
  for(let i=0;i<n;i++){const A=top[i],B=top[i+1],C=bottom[i],E=bottom[i+1];b.quad(i%3?'#c9cec7':'#b8c2bc',A[0],B[0],B[1],A[1]);for(let k=0;k<2;k++){b.quad(i%4?'#b9c4be':'#a8b8b1',C[k],E[k],B[k],A[k]);for(let j=0;j<4;j++){const t=j/4,u=(j+1)/4;const L=A[k].map((v,l)=>lerp(v,B[k][l],t)),R=A[k].map((v,l)=>lerp(v,B[k][l],u));const V=C[k].map((v,l)=>lerp(v,E[k][l],t));b.beam(V,L,.15,'#e0e4dc');if(j===0)b.beam(L,R,.16,'#dce1d8');}}
   b.quad('#596b6b',C[0],C[1],E[1],E[0]);
   // Diagonal lattice follows the sloping, faceted roof, not a flat decal.
   const a=A[0].map((v,k)=>v+(k===1?.12:0)),bb=B[1].map((v,k)=>v+(k===1?.12:0));b.beam(a,bb,.24,'#e6e8de');
   if(i%3===0)b.beam(A[0].map((v,k)=>v+(k===1?.2:0)),A[1].map((v,k)=>v+(k===1?.2:0)),.32,'#e8e9e1');
  }
  for(const i of [0,n])b.quad('#bec9c2',bottom[i][0],bottom[i][1],top[i][1],top[i][0]);
  for(let u=0;u<=1;u+=.125)for(let i=0;i<n;i++)b.beam(top[i][0].map((v,k)=>lerp(v,top[i][1][k],u)+(k===1?.18:0)),top[i+1][0].map((v,k)=>lerp(v,top[i+1][1][k],u)+(k===1?.18:0)),.17,'#e1e5dc');
 }
 shell(0);shell(1);
 // A second folded aluminium ribbon under the northern auditorium shell.
 const ribbon=[[-70,-45],[-32,-42],[11,-30],[53,-14],[73,-6],[69,6],[35,-2],[-7,-15],[-67,-17]];
 b.prism(ribbon,22,(x,z)=>39-(x+65)*.045,'#b5c1ba');b.rim(ribbon,39,'#d8dfd5',.55);
 // Two large diagonal roof fans distinguish the shells in plan.
 for(const s of [0,1]){const p=[-60,s?74:65,s?2:-47];for(let k=0;k<10;k++){const t=k/9,x=-60+(s?108:127)*t,z=s?30+33*t*t:-12+32*t*t,y=s?74-12*t:65-5*t;b.beam(p,[x,y+.4,z],.32,'#e5e9e0');}}

 // Fan-shaped amphitheatre seating, steps and the open-air atrium.
 for(let k=0;k<9;k++){const R=ellipse(41,15,18+k*2.2,13+k*1.4,32);const arc=R.filter(p=>p[0]>36);if(arc.length>2){b.prism(arc,2+k*.53,2.4+k*.53,k%2?'#aeb6a8':'#c5cbbb');}}
 for(const [x,z]of [[-56,-25],[-10,-19],[18,-4],[12,26]])b.beam([x,3,z],[x+4,36,z],1.4,'#c4ccc2');
 for(const [x,z]of [[-81,-32],[-72,41],[-27,47],[8,62],[69,35],[78,-27]])b.tree(x,0,z,1.6);
});
}
