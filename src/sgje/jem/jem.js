/* Jem. OSM ways 620519197, 978644313 and office plate 368005256.
 * Original metre geometry; photographs inform facade / planting, never ship.
 * See REVIEW.md for the measured height and photo sources. */
{
const {register,scale,out,rect,center,lerp,Batch}=SGJE;
const jemClock={value:0};
if(typeof HOOKS!=='undefined')HOOKS.frame.push(t=>{jemClock.value=t;});
// Dedicated, batched luminous soffits and abstract LED glazing. lmMat retains
// the app's night schedule, fog and landmark lighting uniforms.
function jemLight(base,kind){
 const source=lmMat({c:'#ffffff',vc:true,ds:true,m:0,lk:0}),m=source.clone();
 const prior=source.onBeforeCompile;
 m.customProgramCacheKey=()=> 'jem-light-'+kind;
 m.onBeforeCompile=function(sh,r){prior.call(this,sh,r);sh.uniforms.jemClock=jemClock;
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 jemP;').replace('#include <begin_vertex>',`#include <begin_vertex>\njemP=position-vec3(0.0,${base.toFixed(5)},0.0);`);
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 jemP; uniform float jemClock;').replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>\n totalEmissiveRadiance += ${kind===1?'vec3(1.0,.65,.28)*.85':'mix(vec3(.65,.88,.21),vec3(.15,.60,.76),.5+.5*sin(jemP.x*.075+jemP.z*.08+jemClock*.12))*.90'}*uNight;`);
 };return m;
}
register('jem','裕廊东广场','Jem',112,(b,D,G,g)=>{
 const P=D.parts[0].p,A=D.parts[1].p,T=D.parts[2].p,H=82.8;
 const lights=new Batch(G.base),media=new Batch(G.base);
 // Ground-level cross-block passages are open beneath the elevated mall.
 const N=[...P.slice(2),P[0],[-33.59,48.87],[26.35,-29.55]],W=[P[0],P[1],P[2],[26.35,-29.55],[-33.59,48.87]];
 b.cap(P,.05,'#a8aaa2');b.prism(P,7.5,18.5,'#b2afa2');b.prism(N,18.5,29.5,'#b2afa2');b.cap(W,18.55,'#b2b7a8');
 b.prism(A,7.5,29.5,'#b8b9ad');b.cap(A,.05,'#afb2a5');
 function edgePanel(p,q,y,h,c,mode=0,t=0,u=1){b.quad(c,[lerp(p[0],q[0],t),y,lerp(p[1],q[1],t)],[lerp(p[0],q[0],u),y,lerp(p[1],q[1],u)],[lerp(p[0],q[0],u),y+h,lerp(p[1],q[1],u)],[lerp(p[0],q[0],t),y+h,lerp(p[1],q[1],t)],mode);}
 for(const [ix,Q] of [P,A].entries()){
  const O=out(Q,.12);O.forEach((p,i)=>{const q=O[(i+1)%O.length],L=Math.hypot(q[0]-p[0],q[1]-p[1]),n=Math.max(1,Math.ceil(L/4));
   // Portal bays at both ends of each through-block route; remaining retail
   // fronts are warm glass with tall slender columns under the upper podium.
   for(let j=0;j<n;j++){const t=j/n,u=(j+1)/n,open=(i===1||i===7||i===9||i===0)&&j%7===3;
    if(!open)edgePanel(p,q,.25,6.9,'#456166',2,t+.02/n,u-.02/n);
    b.box(lerp(p[0],q[0],t),.1,lerp(p[1],q[1],t),.45,7.4,.45,'#d5d5c7');
   }
   b.beam([p[0],7.3,p[1]],[q[0],7.3,q[1]],.42,'#dddcd1');
   // Staggered limestone and silver cassettes: broad opaque retail enclosure,
   // darker, finer perforated courses at the parapet, as in the official photos.
   const nc=Math.max(1,Math.ceil(L/3.3));for(let f=0;f<(!ix&&i<2?9:19);f++)for(let j=0;j<nc;j++){
    const t=j/nc+.012/nc,u=(j+1)/nc-.012/nc,y=7.6+f*1.14;
    const pat=(j*11+f*7+i*3)%17,shade=f>13?(pat<7?'#77796f':'#8b8b7f'):pat<4?'#d0cec1':pat<8?'#979b91':'#b9b9ac';
    edgePanel(p,q,y,1.09,shade,0,t,u);
   }
  });
 }
 b.rim(N,29.7,'#d6d6c6',.35);b.roof(scale(N,.98),29.6);b.rim(W,18.8,'#d6d6c6',.25);
 b.cap(A,29.6,'#757d74');b.rim(A,30,'#d9ded1',.3);
 for(let j=0;j<23;j++){const t=(j+.2)/24,q=[lerp(A[0][0],A[1][0],t),lerp(A[0][1],A[1][1],t)];b.beam([q[0],29.85,q[1]],[lerp(q[0],A[2][0],.91),29.85,lerp(q[1],A[2][1],.91)],.15,'#bfc7bb');}
 // Terraced western garden promenade, glass pavilions and stairs down toward
 // the station concourse. The layouts are photograph estimates on the OSM plate.
 const terraces=[{p:[[-72,12],[-43,-39],[-30,-35],[-52,15],[-45,41],[-52,53]],y:19},
 {p:[[-61,11],[-39,-28],[-27,-24],[-45,13],[-36,32],[-44,42]],y:24.5}];
 for(const {p,y} of terraces){b.prism(p,15.5,y,'#c7c9bc');b.facade(out(p,.04),y-3.6,y-.3,3.3,3.2,'#526d6b','#e0e1d6',.15);b.garden(scale(p,.86),y+.05);b.rim(p,y+1.15,'#cadbd5',.11);}
 for(const [x,z,w,d]of [[-45,-4,14,13],[-28,-30,12,10],[18,-57,26,16]]){const Q=rect(x,z,w,d,-.65);b.prism(Q,29.7,30.2,'#5e8387',2);for(let k=-w/2;k<=w/2;k+=3)b.box(x+k*.8,30.2,z+k*.6,.16,.15,d,'#b7c4bd',-.65);}
 // Office tower uses the exact independent OSM plate. Its continuous curtain
 // wall and alternate long elevation with planted terraces are distinct.
 b.prism(T,29.7,H-5,'#34555c',2);b.facade(out(T,.08),30,H-5.1,4.7,2.7,'#3e626b','#bfcac5',.18);
 const O=out(T,.8),p=O[0],q=O[1],dx=q[0]-p[0],dz=q[1]-p[1];
 for(let f=0;f<10;f++){
  const y=31.7+f*4.65;if(y>H-4)break;
  b.beam([p[0],y,p[1]],[q[0],y,q[1]],.78,'#e0e0d2');
  const end=O[2];b.beam([q[0],y,q[1]],[end[0],y,end[1]],.78,'#e0e0d2');
  lights.quad('#fff0c6',[q[0],y-.35,q[1]],[end[0],y-.35,end[1]],[end[0]+.7,y-.35,end[1]-.8],[q[0]+.7,y-.35,q[1]-.8]);
  lights.quad('#fff0c6',[p[0],y-.35,p[1]],[q[0],y-.35,q[1]],[q[0]+.7,y-.35,q[1]+.5],[p[0]+.7,y-.35,p[1]+.5]);
  // Glass balustrade above the luminous slab and staggered vine piers.
  b.quad('#82a09b',[p[0],y+.4,p[1]],[q[0],y+.4,q[1]],[q[0],y+1.25,q[1]],[p[0],y+1.25,p[1]],2);
  for(let j=0;j<6;j++){
   const t=(j+.28)/6,u=t+.065;edgePanel(p,q,y+.5,3.85,(f+j)%2?'#527444':'#63834d',0,t,u);
   const a=[lerp(p[0],q[0],t+.07),lerp(p[1],q[1],t+.07)],c=[lerp(p[0],q[0],t+.145),lerp(p[1],q[1],t+.145)];
   b.beam([a[0],y+.65,a[1]],[c[0],y+.65,c[1]],.5,'#698452');
  }
 }
 // Pale projecting service blades visible on the uninterrupted curtain side.
 {const blade=out(T,1.5),a=blade[2],c=blade[3];
 for(const t of [.13,.61]){const u=t+.235,dx=c[0]-a[0],dz=c[1]-a[1],L=Math.hypot(dx,dz),nx=dz/L*1.4,nz=-dx/L*1.4;const Q=[[lerp(a[0],c[0],t),lerp(a[1],c[1],t)],[lerp(a[0],c[0],u),lerp(a[1],c[1],u)],[lerp(a[0],c[0],u)+nx,lerp(a[1],c[1],u)+nz],[lerp(a[0],c[0],t)+nx,lerp(a[1],c[1],t)+nz]];b.prism(Q,26.5,H-4,'#bdc5bd');}}
 b.roof(T,H-4.5);
 for(const t of [.04,.78]){const u=t+.18,Q=[[lerp(T[0][0],T[1][0],t),lerp(T[0][1],T[1][1],t)],[lerp(T[0][0],T[1][0],u),lerp(T[0][1],T[1][1],u)],[lerp(T[3][0],T[2][0],u),lerp(T[3][1],T[2][1],u)],[lerp(T[3][0],T[2][0],t),lerp(T[3][1],T[2][1],t)]];const R=scale(Q,.8);b.prism(R,H-4.4,H-.15,'#7d877e');b.rim(R,H-.05,'#b9c3b8',.18);R.forEach((p,i)=>{const q=R[(i+1)%R.length],n=Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])/1.1);for(let j=0;j<n;j++){const x=lerp(p[0],q[0],j/n),z=lerp(p[1],q[1],j/n);b.box(x,H-4.3,z,.11,4.1,.11,'#bcc4b8');}});}
 b.garden(scale(T,.63),H-4.4,false);
 // Rooftop garden and a few lightweight pergolas, confined to the OSM roof.
 for(const [x,z]of [[-47,14],[-37,-5],[-26,-35],[39,-52],[48,-30],[-16,52]])b.tree(x,z>45?29.8:z<0?29.9:24.7,z,.65);
 for(const [x,z]of [[-10,-38],[24,-66]]){b.box(x,30,z,14,.25,8,'#9eaaa0',-.65);for(let j=-6;j<=6;j+=2)b.box(x+j*.8,30.35,z+j*.6,.13,.2,8,'#d6d8cc',-.65);}
 // L2 J-walk connection toward the MRT: open-sided canopy and real railings.
 const a=[-60,31],c=[-81,37],L=Math.hypot(c[0]-a[0],c[1]-a[1]),ang=Math.atan2(-(c[1]-a[1]),c[0]-a[0]),mx=(a[0]+c[0])/2,mz=(a[1]+c[1])/2;
 b.box(mx,6.8,mz,L,.5,5.5,'#bfc9bf',ang);b.box(mx,10.5,mz,L,.22,6,'#bdc9c1',ang);
 for(const side of [-1,1]){const nx=Math.sin(ang)*side*2.65,nz=Math.cos(ang)*side*2.65;b.beam([a[0]+nx,8.3,a[1]+nz],[c[0]+nx,8.3,c[1]+nz],.13,'#cbd7cc');for(let k=0;k<=L;k+=5)b.box(a[0]+(c[0]-a[0])*k/L+nx,7.3,a[1]+(c[1]-a[1])*k/L+nz,.16,3.2,.16,'#c3cdc4');}
 // MRT-facing interactive media glazing: abstract, slowly varying colour only.
 const mp=out(P,.32);for(const i of [0,1]){const a=mp[i],c=mp[(i+1)%mp.length];for(let j=0;j<8;j++){const t=.14+j*.085,u=t+.075;media.quad('#bbcdaa',[lerp(a[0],c[0],t),12,lerp(a[1],c[1],t)],[lerp(a[0],c[0],u),12,lerp(a[1],c[1],u)],[lerp(a[0],c[0],u),17.8,lerp(a[1],c[1],u)],[lerp(a[0],c[0],t),17.8,lerp(a[1],c[1],t)]);}}
 lights.flush(g,()=>jemLight(G.base,1));media.flush(g,()=>jemLight(G.base,2));
});
// Keep labels and night-height uniforms at the modeled crown until shared data is regenerated.
LANDMARKS.sgje_jem.h=82.8;
}
