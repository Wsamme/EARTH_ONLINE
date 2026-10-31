/* Buona Vista EW21 / CC22. Ways 152592566, 823046125,
 * 1131873757, 1187773826. Only the above-ground station is massed;
 * the large underground Circle Line footprint is not a 19 m building.
 * The app supplies the real EW rail alignment, viaduct, moving trains and piers.
 */
{
const {register,rect,scale}=SGBV;
register('buona_vista_mrt','波那维斯达地铁站','Buona Vista MRT',143,(b,D)=>{
 const P=[[-115.5,-68.1],[40,-52.6],[38.1,-34.6],[-117.5,-45.7]];
 b.prism(scale(P,.97),0,4.6,'#a1b5ae');b.facade(scale(P,.98),1,6,5,4,'#4b8c82','#d6dfd1',.4);
 b.prism(P,6,7,'#c6cfc1');
 // Platforms remain visually open below the shallow mint-green roof.
 b.prism(P,10.4,11,'#aab9ac');b.prism(scale(P,1.025),17.2,17.7,'#8ab7a1');b.rim(scale(P,1.025),18.25,'#d3dfc9',.4);
 for(let x=-110;x<38;x+=12){let z=-56.6+(x+110)*.095;for(const sd of [-1,1]){b.box(x,7,z+sd*8,.5,10.1,.5,'#d3ddcc');b.box(x,11,z+sd*6.9,9,2.3,.15,'#5b8d84',-.095,2);b.box(x,13.3,z+sd*7,9,.3,.3,'#c6d5ca',-.095);}}
// Open transverse roof trusses under the eaves, not a solid facade.
 for(let x=-105;x<36;x+=12){const z=-56.6+(x+110)*.095;b.beam([x,14,z-9],[x,17.1,z],.25,'#dce4d5');b.beam([x,17.1,z],[x,14,z+9],.25,'#dce4d5');b.beam([x,14,z-9],[x,14,z+9],.22,'#bdccbf');}
 // Five raised rectangular roof lanterns, parallel to the track.
 for(let x=-95;x<35;x+=28){const z=-55+(x+95)*.095;b.box(x,18,z,13,1.2,6.8,'#d6ddcb',-.095);b.box(x,19.21,z,10,.12,4.5,'#73aab0',-.095,2);b.box(x,19.3,z,.18,.08,4.7,'#eef0dd',-.095);}
 const entry=[[-12.7,-35.5],[.9,-27.7],[-10.1,-7.8],[16,6.7],[38.1,-34.6]];
 b.prism(entry,0,4.5,'#b1beb2');b.cap(scale(entry,1.03),4.7,'#c5cdc1');b.rim(entry,5,'#dce3d4',.35);
 for(const j of [2,3]){const Q=D.parts[j].p;b.prism(Q,-.3,2.9,'#859b8e');b.cap(scale(Q,1.07),3.1,'#c4d0c2');b.facade(scale(Q,1.01),.5,2.8,3,3,'#5a8987','#c7d3c5');}
 // Platform-edge doors, handrails and continuous horizontal clerestory.
 for(let x=-111;x<38;x+=3){const z=-56.6+(x+110)*.095;b.box(x,7,z-8.2,.15,2.8,.25,'#cedacb');b.box(x,7,z+8.2,.15,2.8,.25,'#cedacb');}
 // Canopied walk to the Circle Line concourse; stairs beneath the entrance.
 b.beam([7,4,0],[32,4,48],3.5,'#c4d0c6');for(let k=0;k<12;k++)b.box(6+k*.6,.25+k*.27,-7+k,8,.25,1.3,'#bac3b6',-.48);
 for(const [x,z]of [[-116,-31],[-86,-30],[-46,-24],[35,18],[70,13]])b.tree(x,0,z,1.3);
});
}
/* Sleepers, four running rails and expansion joints follow the app's actual
 * EW route/profile. This decorates, rather than duplicates, its viaduct. */
{
let trackMaterial=null;
if(typeof HOOKS!=='undefined')HOOKS.net.push(()=>{
 if(!SGR.on||!net.mrt)return;
 if(trackMaterial)trackMaterial.dispose();
 trackMaterial=new THREE.MeshLambertMaterial({color:0xffffff,vertexColors:true,side:THREE.DoubleSide});
 const D=SGBV.data.buona_vista_mrt,A=sgXY(D.lat,D.lon),B=new SGBV.Batch(0),g=new THREE.Group();
 for(const R of net.mrt){if(R.line.code!=='EW')continue;for(let i=0;i<R.P.length-1;i++){
  const p=R.P[i],q=R.P[i+1],mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2;if(Math.hypot(mx-A[0],my-A[1])>650||R.cls[i]===2)continue;
  const a=[p[0]-A[0],A[1]-p[1]],c=[q[0]-A[0],A[1]-q[1]],dx=c[0]-a[0],dz=c[1]-a[1],L=Math.hypot(dx,dz);if(L<.01)continue;
  const nx=-dz/L,nz=dx/L,ang=Math.atan2(-dz,dx),y=R.yR[i],y1=R.yR[i+1];
  for(const side of [-1,1]){for(const gauge of [-.72,.72]){const o=side*1.9+gauge;B.beam([a[0]+nx*o,y+.37,a[1]+nz*o],[c[0]+nx*o,y1+.37,c[1]+nz*o],.12,'#9aacab');}
   const n=Math.ceil(L/1.2);for(let k=0;k<n;k++){const t=k/n,x=a[0]+dx*t+nx*side*1.9,z=a[1]+dz*t+nz*side*1.9;B.box(x,y+(y1-y)*t+.21,z,.25,.15,2.8,'#777364',ang);}
  }
  if(i%2===0)B.beam([a[0]-nx*4.65,y+.1,a[1]-nz*4.65],[a[0]+nx*4.65,y+.1,a[1]+nz*4.65],.12,'#69736e');
 }}
 B.flush(g,()=>trackMaterial);g.position.set(A[0],0,-A[1]);g.name='Buona Vista EW track detail';regionGroup.add(g);
 if(SGBV.stats.buona_vista_mrt)SGBV.stats.buona_vista_mrt.railTriangles=g.userData.bvTriangles;
});
}
