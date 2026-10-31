/* ★ The Rochester complex. Cranked single residential tower way 167472309,
 * hotel 167472303, mall 167472305. Overall measured height 138 m.
 * Hotel 102 m and mall 36 m use the OSM tags, checked against all six photos.
 */
{
const {register,scale,center,out}=SGBV;
register('rochester','罗切斯特综合体','The Rochester',113,(b,D)=>{
 const P=D.parts[0].p,H=138;
 b.prism(P,-1,10,'#ac9b8b');b.facade(scale(P,1.004),1,9,4,3,'#536e6b','#b6c0b4',.3);
 // One connected, angled floor plate, never separate towers.
 b.prism(P,10,H-7,'#a1b4a8');b.facade(scale(P,1.006),10,H-7,3.35,2.7,'#71978e','#cbd7cb',.28);
 for(let y=12;y<H-7;y+=3.35){b.band(scale(P,1.035),y,.34,'#c1cabe');b.rim(scale(P,1.03),y+1.15,'#8fa69a',.16);}
 // Rose-beige service spine, projecting balcony stacks and full-height fins.
 for(const i of [0,2,4,6]){const O=out(P,.35),p=O[i],q=O[(i+1)%P.length];b.quad('#bba79b',[p[0],10,p[1]],[q[0],10,q[1]],[q[0],H-7,q[1]],[p[0],H-7,p[1]]);}
 for(const i of [1,3,7]){const p=P[i];b.box(p[0],9,p[1],1.1,H-12,1.1,'#cfcec0');}
 b.prism(scale(P,.98),H-7,H-2,'#b6b4a3');b.facade(P,H-7,H-2,3.5,3,'#73958b','#cbd3c4',.4);b.roof(P,H-2);b.prism(scale(P,.68),H-1,H,'#c2cec0');
 // Low hotel wing and stepped glazed mall, correctly on the two other ways.
 const Hotel=D.parts[1].p,Mall=D.parts[2].p;
 b.prism(Hotel,0,102,'#899f96');b.facade(scale(Hotel,1.005),1,100,3.6,3,'#5b7b77','#c8d1c3',.4);b.roof(Hotel,102);
 b.prism(Mall,-1,13,'#9aa99b');b.facade(scale(Mall,1.005),1,13,4,3,'#688880','#cbd4c6',.5);b.prism(scale(Mall,.95),13,36,'#72908a',2);b.facade(scale(Mall,.955),13,36,3.5,3.4,'#65827e','#cbd6c8',.3);b.roof(scale(Mall,.96),36.1);
 // Repeated pitched conservatory bays across the mall's long roof.
 const A=Mall[0],Z=Mall[3];for(let t=.08;t<.92;t+=.075){let x=A[0]+(Z[0]-A[0])*t,z=A[1]+(Z[1]-A[1])*t;b.beam([x-6,36.4,z+2],[x,39,z-6],.55,'#e2e7d9');b.beam([x,39,z-6],[x+7,36.4,z-4],.55,'#d5dfd0');}

 Mall.forEach((p,i)=>{if(i%2===0)b.box(p[0],13,p[1],1,15,1,'#c4d0bf');});
 for(const [x,z]of [[-33,23],[-29,48],[19,46],[46,19],[37,-18],[-66,-55],[-39,-22],[78,43]])b.tree(x,0,z,1.4);
});
}
