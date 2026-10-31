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
// Projecting balcony stacks on the long cranked elevation, one connected tower.
 {const a=P[2],c=P[3],dx=c[0]-a[0],dz=c[1]-a[1],angle=Math.atan2(-dz,dx);for(const t of [.28,.5,.73]){const x=a[0]+dx*t,z=a[1]+dz*t;for(let y=14;y<126;y+=3.35){b.box(x,y,z,4,.25,2.1,'#cdd8cb',angle);b.box(x,y+1.2,z,4,.12,2.15,'#a7bfb1',angle);}}}
 // Rose-beige service spine, projecting balcony stacks and full-height fins.
 for(const i of [0,2,4,6]){const O=out(P,.45),p=O[i],end=O[(i+1)%P.length],L=Math.hypot(end[0]-p[0],end[1]-p[1]),t=Math.min(1,8/L),q=[p[0]+(end[0]-p[0])*t,p[1]+(end[1]-p[1])*t];b.quad('#c1afa6',[p[0],10,p[1]],[q[0],10,q[1]],[q[0],H-7,q[1]],[p[0],H-7,p[1]]);for(let y=17;y<118;y+=3.35){const C=center(P),ox=(p[0]-C[0])*.004,oz=(p[1]-C[1])*.004;b.quad('#64817b',[p[0]+(q[0]-p[0])*.22+ox,y,p[1]+(q[1]-p[1])*.22+oz],[p[0]+(q[0]-p[0])*.8+ox,y,p[1]+(q[1]-p[1])*.8+oz],[p[0]+(q[0]-p[0])*.8+ox,y+1.5,p[1]+(q[1]-p[1])*.8+oz],[p[0]+(q[0]-p[0])*.22+ox,y+1.5,p[1]+(q[1]-p[1])*.22+oz],2);}}
 for(const i of [1,3,7]){const p=P[i];b.box(p[0],9,p[1],1.1,H-12,1.1,'#cfcec0');}
 b.band(out(P,.48),H-18,11,'#c1afa6');
 {const O=out(P,.75);O.forEach((p,i)=>{const q=O[(i+1)%O.length],L=Math.hypot(q[0]-p[0],q[1]-p[1]),n=Math.max(1,Math.floor(L/3));for(let j=0;j<n;j++)for(let y=H-17;y<H-7;y+=3.35){const t=(j+.1)/n,u=(j+.82)/n;b.quad('#617d79',[p[0]+(q[0]-p[0])*t,y,p[1]+(q[1]-p[1])*t],[p[0]+(q[0]-p[0])*u,y,p[1]+(q[1]-p[1])*u],[p[0]+(q[0]-p[0])*u,y+1.65,p[1]+(q[1]-p[1])*u],[p[0]+(q[0]-p[0])*t,y+1.65,p[1]+(q[1]-p[1])*t],2);}});}
b.prism(scale(P,.98),H-7,H-2,'#b6b4a3');b.facade(P,H-7,H-2,3.5,3,'#73958b','#cbd3c4',.4);b.roof(P,H-2);b.prism(scale(P,.68),H-1,H,'#c2cec0');
 // Low hotel wing and stepped glazed mall, correctly on the two other ways.
 const Hotel=D.parts[1].p,Mall=D.parts[2].p;
 b.prism(Hotel,0,102,'#899f96');b.facade(scale(Hotel,1.005),1,100,3.6,3,'#5b7b77','#c8d1c3',.4);b.roof(Hotel,102);Hotel.forEach(p=>b.box(p[0],0,p[1],.5,102,.5,'#c9d4c6'));
 b.prism(Mall,-1,13,'#9aa99b');b.facade(scale(Mall,1.005),1,13,4,3,'#688880','#cbd4c6',.5);b.prism(scale(Mall,.95),13,36,'#72908a',2);b.facade(scale(Mall,.955),13,36,3.5,3.4,'#65827e','#cbd6c8',.3);b.roof(scale(Mall,.96),36.1);
 // Repeated pitched conservatory bays across the mall's long roof.
 const A=Mall[0],Z=Mall[3];for(let t=.08;t<.92;t+=.075){let x=A[0]+(Z[0]-A[0])*t,z=A[1]+(Z[1]-A[1])*t;b.beam([x-6,36.4,z+2],[x,39,z-6],.55,'#e2e7d9');b.beam([x,39,z-6],[x+7,36.4,z-4],.55,'#d5dfd0');}

 Mall.forEach((p,i)=>{if(i%2===0)b.box(p[0],13,p[1],1,15,1,'#c4d0bf');});
 for(const [x,z]of [[-33,23],[-29,48],[19,46],[46,19],[37,-18],[-66,-55],[-39,-22],[78,43]])b.tree(x,0,z,1.4);
});
}
