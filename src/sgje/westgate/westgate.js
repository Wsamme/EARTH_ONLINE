/* Westgate: OSM ways 158234014 / 368005268. Original metre geometry.
 * Curved office curtain wall, shaded retail court, planted roofs and J-walk.
 * Reference images remain outside the repository. See REVIEW.md. */
{
const {register,scale,out,rect,center,Batch}=SGJE;
register('westgate','西城购物中心','Westgate',112,(b,D,G,g)=>{
 // Upper curtain plate is photo-fitted 2.8m west / 3.2m north of the simplified
 // OSM tower outline; its base and the mall retain the surveyed site polygon.
 const P=D.parts[0].p,T=SGJE.move(D.parts[1].p,-2.8,-3.2),H=141.1;
 const court=[[-77.5,-4],[-39.3,66.75],[58.9,15.55],[51.1,.45],[-32.7,43.25],[-62.5,-12]];
 // The mall roof is a landscaped terrace surrounding a long covered court.
 const north=[19,0,1,2,3,4];
 P.forEach((p,i)=>{const q=P[(i+1)%P.length],glass=north.includes(i);b.quad(glass?'#3c5d61':'#d3ceba',[p[0],-.8,p[1]],[q[0],-.8,q[1]],[q[0],28.8,q[1]],[p[0],28.8,p[1]],glass?2:0);});b.capHole(P,[court],28.8,'#9caaa0');
 b.facade(out(P,.08),.3,10.2,5,3.1,'#3c5d61','#aab8ae',.24);
 for(let y=10.2;y<28.5;y+=4.65){const O=out(P,.12);O.forEach((p,i)=>{if(north.includes(i))return;const q=O[(i+1)%O.length];b.beam([p[0],y,p[1]],[q[0],y,q[1]],.48,'#b6c1b7');});}
 // Large pale blank panels alternate with dark glazing and living walls.
 const F=out(P,.28);
 for(const i of [5,6,7,8,9,10,11,12,13,14,15,16,17,18]){
  const p=F[i],q=F[(i+1)%F.length],dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz),n=Math.max(1,Math.round(L/5));
  for(let j=0;j<n;j++){
   const a=j/n,c=(j+.93)/n,x=p[0]+dx*a,z=p[1]+dz*a,X=p[0]+dx*c,Z=p[1]+dz*c;
   let col=(i===7||i===10||i===14)?'#d9d2bc':j%5===1?'#5e7950':j%3===0?'#b6b9a8':'#617f80';
   b.quad(col,[x,10.7,z],[X,10.7,Z],[X,28.6,Z],[x,28.6,z],col==='#617f80'?2:0);
   if(i===7||i===10)for(let y=12;y<28;y+=.6)b.beam([x,y,z],[X,y,Z],.055,'#c8c3ae');
  }
 }
 b.rim(P,29.15,'#e0e0ce',.55);
 // Internal light court, galleries and slender columns; no solid roof slab.
 b.walls(court,0,25,'#3b5a5e',2);
 for(let y=5;y<26;y+=5){b.rim(out(court,1.3),y,'#d2d8cc',.7);b.rim(court,y+1.1,'#93aeb0',.12);}
 court.forEach(p=>b.box(p[0],0,p[1],.65,26,.65,'#dedfd1'));
 // Two glazed wings form the L-shaped court around the roof garden.
 for(const [a,c] of [[[-70,-8],[-36,55]],[[-36,55],[55,8]]]){
  const dx=c[0]-a[0],dz=c[1]-a[1],L=Math.hypot(dx,dz),nx=-dz/L,nz=dx/L;
  const cp=(x,t,y)=>[a[0]+dx*t+nx*x,y,a[1]+dz*t+nz*x];
  b.quad('#9ab8b7',cp(-8.5,0,27.2),cp(0,0,32.6),cp(0,1,32.6),cp(-8.5,1,27.2),2);
  b.quad('#9ab8b7',cp(0,0,32.6),cp(8.5,0,27.2),cp(8.5,1,27.2),cp(0,1,32.6),2);
  for(let d=0;d<=L;d+=3.5){b.beam(cp(-8.5,d/L,27.25),cp(0,d/L,32.65),.16,'#ced9d0');b.beam(cp(0,d/L,32.65),cp(8.5,d/L,27.25),.16,'#ced9d0');}
  for(let x=-6;x<=6;x+=3)b.beam(cp(x,0,32.6-Math.abs(x)*.635),cp(x,1,32.6-Math.abs(x)*.635),.1,'#c1d0c9');
 }
 for(const Q of [rect(-29,9,15,36,.48),rect(14,-1,38,12,.48),rect(35,-2,11,22,.48)])b.garden(Q,29.1);
 // Pool and paths visible in the central roof garden; play equipment omitted.
 b.prism(rect(-10,10,29,8,.05),28.95,29.05,'#4b9da9');
 for(const Q of [rect(-9,20,34,2,.48),rect(16,6,2,24,.48)])b.cap(Q,29.15,'#c9ccb8');
 // Photo-based winding beds and pale paths around the central terrace pool.
 for(const bed of [
  [[-48,-16],[-27,-21],[-7,-14],[1,-7],[-15,-2],[-33,-5],[-47,2]],
  [[16,-12],[33,-20],[42,-10],[38,2],[23,10],[10,5]],
  [[-30,26],[-16,25],[-4,27],[7,18],[14,23],[4,35],[-14,39],[-29,34]]
 ]){const R=SGJE.smooth(bed,2);b.garden(R,29.2,false);b.rim(out(R,.8),29.24,'#d2d4bf',.75);}
 for(const [x,z]of [[-38,-13],[-26,-15],[25,-13],[32,-5],[-19,32],[3,30]])b.tree(x,29.2,z,.58);
 const plant=rect(29,-1,20,13,-.47);b.prism(plant,28.8,33,'#a0a99d');b.roof(plant,33);
 // Tower footprint remains the surveyed OSM plate. The horizontal band rhythm
 // is 4.3m (owner's published floor-to-floor), with a higher crown screen.
 b.prism(T,-.7,7,'#647a72');b.garden(out(T,.25),7.1,false);
 b.prism(scale(T,.97),7.2,16,'#3c5358',2);
 b.facade(T,16,H-4,4.3,2.6,'#365b6b','#7f979b',.15);
 for(let y=17;y<H-3;y+=4.3){b.band(out(T,.26),y,.55,'#879b9c');b.rim(out(T,.42),y+.62,'#b3bfba',.13);}
 // Dark vertical split between the rounded and flat wings on the public face.
 const p=T[0],q=T[1];b.quad('#263f4c',[p[0],16,p[1]],[q[0],16,q[1]],[q[0],H-4,q[1]],[p[0],H-4,p[1]],2);
 b.cap(T,H-3.8,'#687a73');b.garden(scale(T,.82),H-3.7,false);
 b.walls(T,H-4,H,'#82938e');b.rim(T,H,'#b8c2b7',.32);
 for(let i=0;i<T.length;i++){const p=T[i],q=T[(i+1)%T.length],n=Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])/1.4);for(let j=0;j<n;j++){const t=j/n,x=p[0]+(q[0]-p[0])*t,z=p[1]+(q[1]-p[1])*t;b.box(x,H-3.8,z,.10,3.8,.10,'#b4bfb6');}}
 // LED lines are their own batched lmMat surface, preserving night uniforms.
 const led=new Batch(G.base),Q=out(T,.45);
 for(let y=17;y<H-5;y+=4.3)led.walls(Q,y+.84,y+1.02,'#8aaeb4',4);
 // Recessed vertical blue light seam, seen in CapitaLand's night photograph.
 const a=Q[1],c=Q[2],t=.28,u=.32;
 led.quad('#8aaeb4',[a[0]+(c[0]-a[0])*t,8,a[1]+(c[1]-a[1])*t],[a[0]+(c[0]-a[0])*u,8,a[1]+(c[1]-a[1])*u],[a[0]+(c[0]-a[0])*u,H-4,a[1]+(c[1]-a[1])*u],[a[0]+(c[0]-a[0])*t,H-4,a[1]+(c[1]-a[1])*t]);
 // Blank illuminated panels on the retail facade replace photographic signs.
 const sign=out(P,.4),v=sign[7],w=sign[8];
 led.quad('#c5d1ce',[v[0]*.35+w[0]*.65,15,v[1]*.35+w[1]*.65],[v[0]*.15+w[0]*.85,15,v[1]*.15+w[1]*.85],[v[0]*.15+w[0]*.85,22,v[1]*.15+w[1]*.85],[v[0]*.35+w[0]*.65,22,v[1]*.35+w[1]*.65]);
 led.flush(g,()=>{const source=lmMat({c:'#ffffff',vc:true,ds:true,m:0,lk:0}),m=source.clone(),prior=source.onBeforeCompile;
  m.customProgramCacheKey=()=> 'je-westgate-slow-led-v1';
  m.onBeforeCompile=function(sh,r){prior.call(this,sh,r);sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 float wgCycle=.5-.5*cos(uTime*.105+vWP.y*.018);
 vec3 wgHue=mix(vec3(.025,.16,.9),vec3(.43,.035,.72),wgCycle);
 totalEmissiveRadiance+=uNight*wgHue*.85;`);};return m;});
 // Level 2 bridge towards the station; small covered span stops at its edge.
 const bridge=[[-44,74],[-40,78],[-65,107],[-70,103]];
 b.prism(bridge,5.1,5.55,'#c1c7bb');b.walls(bridge,5.55,6.75,'#8ba2a0',2);b.prism(out(bridge,.3),8.4,8.65,'#c4d0c8');
 for(const p of [bridge[0],bridge[2]])b.box(p[0],0,p[1],.5,8.4,.5,'#9aa99d');
 // Covered entrance and blank illuminated sign panels.
 const canopy=rect(63,21,29,6,-.48);b.prism(canopy,5.4,5.7,'#d1d6c9');
 for(const x of [49,72])b.box(x,0,24,.45,5.4,.45,'#bfcabc');
 for(const [x,z]of [[-59,3],[57,10],[-30,63]])b.tree(x,0,z,.9);
});
// Keep labels and night-height uniforms at the modeled crown until shared data is regenerated.
LANDMARKS.sgje_westgate.h=141.1;
}
