/* ★ The Metropolis, ways 1563020894 / 1563020891 / 1563020893.
 * 113.4 m measured maximum. Two staggered office slabs and recessed sky terraces.
 */
{
const {register,scale,center,rect}=SGBV;
register('metropolis','启汇城','The Metropolis',109,(b,D)=>{
 const podium=D.parts.flatMap(p=>p.p);const P0=[[-63,-8],[-22.5,-81.4],[7.4,-52.1],[-22.8,3.1]],P1=[[0,5.9],[29.5,-13.4],[66.6,55.4],[35,70],[17.9,39.7]];
 for(const [i,P]of [P0,P1].entries()){
  const H=i?106:113.4,C=center(P),L=scale(P,.96);b.prism(P,-1,6,'#7a8b87');
  b.facade(L,6,46,4.1,2.8,'#3a515a','#809597',.37);
  const sky=scale(P,.80);b.prism(sky,46,56,'#263e43',2);b.garden(scale(P,.98),46.15,false);b.prism(scale(P,1.02),55.5,H-1,'#455b62',2);b.facade(scale(P,1.024),56,H-1,4.1,3.1,'#40575f','#8b9f9e',.38);
  // Tall, clearly open columns on the recessed garden floor.
  P.forEach((p,j)=>{const q=P[(j+1)%P.length],n=Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])/12);for(let k=0;k<n;k++){const x=p[0]+(q[0]-p[0])*k/n,z=p[1]+(q[1]-p[1])*k/n;b.box(x,46,z,.6,9.8,.6,'#c2cbc5');if(k%2===0)b.tree(x*.9+C[0]*.1,46.2,z*.9+C[1]*.1,.6);}});
  b.roof(scale(P,1.02),H-1,i);b.band(scale(P,1.025),H-2,1,'#a5b5b0');
  // Light grey opaque service gable, visible from the south/west.
  const a=P[0],q=P[P.length-1];b.quad('#939fa0',[a[0],7,a[1]],[q[0],7,q[1]],[q[0],H-4,q[1]],[a[0],H-4,a[1]]);
 }
 b.prism(D.parts[2].p,0,5,'#a9b7b0');b.cap(D.parts[2].p,5.1,'#8aa4a2');
 for(const P of [rect(-18,22,58,24,-.65),rect(15,50,40,17,-.65)]){b.prism(P,0,4,'#aab7b1');b.facade(P,0,4,4,3,'#668286','#c4ceca');}
 for(const [x,z]of [[-66,9],[-58,32],[-20,62],[27,79],[76,51],[39,-20],[-13,-84]])b.tree(x,0,z,1.3);
});
}
