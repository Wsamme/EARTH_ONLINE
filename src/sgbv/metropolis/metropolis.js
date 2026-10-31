/* ★ The Metropolis, ways 1563020894 / 1563020891 / 1563020893.
 * 113.4 m measured maximum. Two staggered office slabs and recessed sky terraces.
 */
{
const {register,scale,center,rect,out}=SGBV;
register('metropolis','启汇城','The Metropolis',109,(b,D)=>{
 const podium=D.parts.flatMap(p=>p.p);const P0=[[-63,-8],[-22.5,-81.4],[7.4,-52.1],[-22.8,3.1]],P1=[[0,5.9],[29.5,-13.4],[66.6,55.4],[35,70],[17.9,39.7]];
 for(const [i,P]of [P0,P1].entries()){
  const H=i?106:113.4,C=center(P),L=scale(P,.91);b.prism(P,-1,6,'#7a8b87');
  b.facade(L,6,48,4.1,2.8,'#5b7680','#aababc',.65);
  const sky=scale(P,.80);b.prism(sky,48,58,'#263e43',2);b.garden(scale(P,.98),48.15,false);b.prism(scale(P,1.02),57.5,H-1,'#455b62',2);b.facade(scale(P,1.024),58,H-1,4.1,3.1,'#607d88','#b1bfc1',.65);
  // Tall, clearly open columns on the recessed garden floor.
  P.forEach((p,j)=>{const q=P[(j+1)%P.length],n=Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])/12);for(let k=0;k<n;k++){const x=p[0]+(q[0]-p[0])*k/n,z=p[1]+(q[1]-p[1])*k/n;b.box(x,48,z,.6,9.8,.6,'#c2cbc5');if(k%2===0)b.tree(x*.9+C[0]*.1,48.2,z*.9+C[1]*.1,.6);}});
  b.roof(scale(P,1.026),H-.9,i);
  // Recessed rooftop service court and continuous perforated perimeter screen.
  const court=scale(P,.73);b.cap(court,H-.72,'#7b8989');b.rim(court,H-.5,'#c4ccc4',.32);
b.band(scale(P,1.025),H-2,1,'#a5b5b0');
  // Light grey opaque service gable, visible from the south/west.
  const O=out(P,1.3),a=O[0],q=O[O.length-1];b.quad('#939fa0',[a[0],7,a[1]],[q[0],7,q[1]],[q[0],H-4,q[1]],[a[0],H-4,a[1]]);
 }
 // The sheltered plaza between the slabs and the oval entrance canopy.
 const oval=SGBV.ellipse(-13,37,13,9,32,-.5);b.prism(oval,8,8.5,'#c7cdc1');b.rim(oval,8.9,'#dce1d5',.3);
 for(const [x,z]of [[-22,37],[-5,34]])b.box(x,0,z,.4,8,.4,'#cbd2c7');
 b.prism(D.parts[2].p,0,5,'#a9b7b0');b.cap(D.parts[2].p,5.1,'#8aa4a2');
 for(const P of [rect(-18,22,58,24,-.65),rect(15,50,40,17,-.65)]){b.prism(P,0,4,'#aab7b1');b.facade(P,0,4,4,3,'#668286','#c4ceca');}
 // Low retail podium from the app's legacy OSM polygons. Its old generic
 // 75 m estimate caused the false tower occluding the southwest street view.
 for(const [i,part]of D.context_parts.entries()){const Q=part.p,H=i?9:12;b.prism(Q,-1,H,'#6d7e78');b.facade(SGBV.out(Q,.08),2,H-.5,3.5,2.8,'#55787c','#b6c4bb',.25);b.cap(Q,H+.1,'#646c67');b.rim(Q,H+.4,'#c5cec1',.4);}
 const canopy=SGBV.ellipse(-64,70,16,10,32,-.55);b.prism(canopy,13.5,14,'#c2c7b8');b.rim(canopy,14.3,'#e3e5d8',.25);
 for(let x=-122;x<-18;x+=7)for(let z=22;z<102;z+=7){if(SGBV.inside(D.context_parts[0].p,x,z)&&SGBV.inside(D.context_parts[0].p,x+6,z))b.beam([x,12.25,z],[x+6,12.25,z],.2,'#c5cfc2');}
 for(const [x,z]of [[-66,9],[-58,32],[-20,62],[27,79],[76,51],[39,-20],[-13,-84]])b.tree(x,0,z,1.3);
});
}
