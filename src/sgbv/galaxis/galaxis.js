/* Galaxis, OSM 175841412, measured 93.7 m. L-shaped office plate
 * on slender pilotis; alternating metal/glass north facade and horizontal
 * south facade. The low southern annex is part of the same footprint.
 */
{
const {register,scale,rect,center,out}=SGBV;
register('galaxis','星桥大厦','Galaxis',100,(b,D)=>{
 const P=D.parts[0].p;
 // Principal office block excludes the low, curving southern annex.
 const T=[[-32,-42],[-18.5,-66.4],[10,-57.9],[30.6,-52.3],[52.1,-49.6],[1,58],[-24,43],[-16.6,17.5],[4.8,-20.6]];
 b.prism(P,-1,4,'#99aaa1');b.prism(scale(P,.96),4,11,'#4f7273',2);
 b.prism(T,22,92.3,'#9eafa9');b.facade(scale(T,1.004),22,92.3,4.35,3.1,'#729198','#dbe2dc',.2);b.cap(T,92.5,'#bac4be');b.rim(T,93.4,'#dce2d7',.55);const R=scale(T,.88);R.forEach((p,i)=>{const q=R[(i+1)%R.length];for(let t=0;t<1;t+=.04)b.beam([p[0]+(q[0]-p[0])*t,92.6,p[1]+(q[1]-p[1])*t],[p[0]+(q[0]-p[0])*t,93.5,p[1]+(q[1]-p[1])*t],.12,'#b4beb7');});
 // Projecting white slab edges dominate the long south/east elevation.
 for(let y=24;y<91;y+=4.35){const O=out(T,.7);for(const i of [4,5,6,7,8]){const p=O[i],q=O[(i+1)%O.length];b.beam([p[0],y,p[1]],[q[0],y,q[1]],.75,'#dbe3db');b.beam([p[0],y+1.15,p[1]],[q[0],y+1.15,q[1]],.18,'#bccfc5');}}
 // Tall, airy columns carrying the raised office volume.
 T.forEach((p,i)=>{const q=T[(i+1)%T.length],n=Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])/12);for(let k=0;k<n;k++){const x=p[0]+(q[0]-p[0])*k/n,z=p[1]+(q[1]-p[1])*k/n;b.box(x,4,z,.9,18,.9,'#c9d5ce');}});
 // Staggered opaque cassette pattern on the north/west faces.
 for(const i of [0,1,2,3]){const O=out(T,.45);let p=O[i],q=O[(i+1)%T.length],dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz),n=Math.ceil(L/3.5);for(let f=0;f<16;f++)for(let j=0;j<n;j++){if((j+f*2)%5>2)continue;let t=(j+.08)/n,u=(j+.94)/n,y=22+f*4.35;const off=0;b.quad((j+f)%3?'#e0e5df':'#94aaa9',[p[0]+dx*t-off,y,p[1]+dz*t-off],[p[0]+dx*u-off,y,p[1]+dz*u-off],[p[0]+dx*u-off,y+3.4,p[1]+dz*u-off],[p[0]+dx*t-off,y+3.4,p[1]+dz*t-off]);}}
 const A=[[-30,26],[-16,18],[12,34],[6,48],[8,58],[-34,77],[-44,68]];
 b.prism(A,4,20,'#a8b7ab');b.facade(scale(A,1.005),5,19,4,3,'#5e8080','#d2dcd0',.7);b.garden(scale(A,.9),20.2);
 for(let y=7;y<20;y+=1.4)b.band(scale(A,1.02),y,.3,'#cbd8c9');
 for(const [x,z]of [[-33,-49],[-42,8],[-39,46],[17,42],[46,-25]])b.tree(x,0,z,1.3);
});
}
