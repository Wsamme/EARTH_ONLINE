/* Elementum, OSM 981964001. SOM: 12 storeys, 63m.
 * CTBUH's conflicting 92.6m is documented, not reconciled with invented stacks.
 * Original U-shaped lab plates and open podium, no logos or extracted meshes. */
{
const {register,scale,center,lerp}=SGBV;
let elEnv=null;function environment(){if(elEnv||typeof document==='undefined')return elEnv;const faces=[];for(let i=0;i<6;i++){const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,32);g.addColorStop(0,'#bfd3df');g.addColorStop(.55,'#8ba4ad');g.addColorStop(1,'#657772');x.fillStyle=g;x.fillRect(0,0,32,32);faces.push(c);}elEnv=new THREE.CubeTexture(faces);elEnv.needsUpdate=true;return elEnv;}

if(typeof HOOKS!=='undefined'&&HOOKS.frame)HOOKS.frame.push(()=>{for(const L of landmarks){if(!['sgbv_elementum','sgbv_holland_piazza'].includes(L.type))continue;const g=lmMeshes.get(L.id);if(g)g.traverse(o=>{if(o.isMesh&&o.material.userData.bvThinLight)o.castShadow=false;});}});
register('elementum','Elementum','Elementum',88,(b,D,G,g)=>{
 const P=D.parts[0].p,lights=new SGBV.Batch(G.base),skylight=new SGBV.Batch(G.base);
 const hole=SGBV.rect(-13,14,10,14,-.25),H=63;
 // A genuinely open ground forum: only the service cores, retail edge and columns.
 const north=[P[19],P[18],P[17],P[16],[8,-19],[-48,-19]];
 b.prism(north,-.3,7.5,'#7e928d');b.facade(scale(north,1.002),.3,6.8,5.8,3.6,'#39595d','#a8b3a8',0);
 for(const [x,z]of [[-42,-12],[-29,12],[-15,40],[16,18],[22,-5],[0,-18]]){
  b.prism(SGBV.ellipse(x,z,.78,.78,10),0,8.0,'#b1b4a8');b.prism(SGBV.ellipse(x,z,1.3,1.3,10),7.4,8.0,'#bdc0b2');
 }
 for(const y of [8.0,13.0,18.0]){b.capHole(P,[hole],y,'#bac5bd');b.walls(P,y-.5,y,'#c2cac3');b.walls(hole,y-.5,y,'#c2cac3');}
 b.walls(scale(P,.975),8.2,17.5,'#58777b',2);b.walls(scale(hole,1.05),8.2,17.5,'#526c70',2);
 for(const y of [8.0,13.0,18.0])b.rim(P,y,'#bdc9c4',.28);
 // Open sky light above the forum, supported by a lightweight diagonal grid.
 skylight.cap(hole,18.12,'#b7d5db',2);
 for(let k=-4;k<=4;k+=2)b.beam([-13+k,18.2,7],[-13+k,18.2,21],.12,'#8b9f9d');
 for(let k=0;k<4;k++)b.beam([-18,18.2,7+k*4.5],[-8,18.2,7+k*4.5],.12,'#8b9f9d');
 // Main lab floors: the inner west arm recedes floor by floor into planted terraces.
 function plate(i){const W=[lerp(P[0][0],P[1][0],.96-i*.075),lerp(P[0][1],P[1][1],.96-i*.075)],E=[lerp(P[4][0],P[2][0],.70-i*.05),lerp(P[4][1],P[2][1],.70-i*.05)];
  return[W,P[0],...P.slice(4,20).reverse(),E,[E[0]-13,E[1]-8],[9+i*.55,6],[5+i*.4,-8-i*.5],[-24-i*.4,-9-i*.5],[-34-i*.8,5],[W[0]+13-i*.35,W[1]-6]];
 }
 for(let f=0;f<9;f++){
  const Q=plate(f),lo=18+f*5,hi=lo+5,lower=scale(Q,.992),glass=scale(Q,.989);
  b.prism(glass,lo+.55,hi-1.25,'#557c87',2);b.cap(Q,hi,'#b8c8c9');
  // Sloping aluminium eaves: inward lower edge, sharply defined outward top lip.
  Q.forEach((p,i)=>{const q=Q[(i+1)%Q.length],a=lower[i],c=lower[(i+1)%Q.length];
   b.quad('#b5c5c8',[a[0],hi-1.25,a[1]],[c[0],hi-1.25,c[1]],[q[0],hi,q[1]],[p[0],hi,p[1]]);
   b.quad('#b4c4c5',[p[0],lo,p[1]],[q[0],lo,q[1]],[q[0],lo+.55,q[1]],[p[0],lo+.55,p[1]]);
  });
  b.walls(Q,lo+2.05,lo+2.55,'#bdcdd0');
  b.facade(scale(glass,1.0005),lo+.6,hi-1.3,3.1,3.2,'#6c929c','#98afb0',0);
  if(f<8){const w=Q[0],bed=SGBV.rect(w[0]+6,w[1]-3,9,3,-.5);b.prism(bed,hi+.02,hi+.35,'#a8b8aa');b.cap(scale(bed,.90),hi+.38,'#5a7a50');if(f%2===0)b.tree(w[0]+6,hi+.38,w[1]-3,.45);}
 }
 // A 900m² garden follows the open U, avoiding planting beneath lab floors.
 const basePlate=plate(0),W=basePlate[0],E=[lerp(P[4][0],P[2][0],.70),lerp(P[4][1],P[2][1],.70)];
 const open=[[W[0]+13,W[1]-6],[-34,5],[-24,-9],[5,-8],[9,6],[E[0]-13,E[1]-8]];
 const area=Math.abs(open.reduce((a,p,i)=>{const q=open[(i+1)%open.length];return a+p[0]*q[1]-q[0]*p[1];},0))/2;
 const garden=scale(open,Math.sqrt((900+140)/area));b.capHole(garden,[hole],18.04,'#6a8954');
 for(const [x,z]of [[-23,4],[-25,13],[-20,25],[-2,2],[-2,11],[-8,27],[-13,35],[-13,43]]){
  if(!SGBV.inside(garden,x,z)||SGBV.inside(hole,x,z))continue;
  const bed=SGBV.rect(x,z,4.0,2.6);b.prism(bed,18.1,18.7,'#bdc7b6');b.cap(scale(bed,.9),18.75,'#54774d');b.tree(x,18.75,z,.85);
 }
 for(const z of [26,32,38])b.box(-13,18.06,z,5,.08,1.0,'#bec9b6',-.2);
 // Warm forum soffit / wall graze; cool lab windows use a separate shared material.
 P.forEach((p,i)=>{const q=P[(i+1)%P.length];lights.beam([p[0],7.7,p[1]],[q[0],7.7,q[1]],.12,'#ffe2b3');});
 for(const x of [-42,-29,-15,0,16])lights.box(x,7.65,0,5,.10,1.5,'#ffe1b3');
 for(const [x,z]of [[-45,-17],[-25,-22],[4,-22]])lights.box(x,.2,z,.25,6.8,.12,'#f5d09b');
 lights.flush(g,()=>{const m=lmMat({c:'#ffffff',vc:true,ds:true,m:0,glow:'#ffdfa6',gk:.50});m.userData.bvThinLight=true;return m;});
 skylight.flush(g,()=>{const old=lmMat({c:'#ffffff',vc:true,ds:true,m:0,lc:'#d8e9f1',lk:.1}),m=old.clone();m.onBeforeCompile=old.onBeforeCompile;m.customProgramCacheKey=()=>old.customProgramCacheKey()+':elementum-skylight';m.transparent=true;m.opacity=.35;m.depthWrite=false;if(typeof LMCTX!=='undefined'&&LMCTX)LMCTX.mats.set('elementum-skylight',m);return m;});
 // Shared physical material per mode, preserving the app's night-window shader.
 const flush=b.flush.bind(b);b.flush=(group)=>flush(group,mode=>{
  const key='elementum-pbr-'+mode;if(typeof LMCTX!=='undefined'&&LMCTX?.mats.has(key))return LMCTX.mats.get(key);
  const source=lmMat({c:'#ffffff',vc:true,ds:true,m:mode===2?1:0,lc:mode===2?'#d8eafa':'#ffe0ad',lk:mode===2?.24:.06,fh:5,cw:2.8});
  const m=new THREE.MeshStandardMaterial({color:source.color,side:source.side,vertexColors:true,roughness:mode===2?.28:.65,metalness:mode===2?.16:.08,envMap:environment(),envMapIntensity:mode===2?.35:.45});const previous=source.onBeforeCompile;m.onBeforeCompile=function(sh,r){previous.call(this,sh,r);if(mode!==2){sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 elP;').replace('#include <begin_vertex>','#include <begin_vertex>\nelP=position-vec3(0.0,'+G.base.toFixed(6)+',0.0);');sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 elP;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(.14,.088,.041)*uNight*(1.0-smoothstep(6.5,10.0,elP.y));');}};m.customProgramCacheKey=()=>source.customProgramCacheKey()+':'+key;if(typeof LMCTX!=='undefined'&&LMCTX)LMCTX.mats.set(key,m);return m;
 });
 // Rail-corridor edge: an original path, terraced planters and entry bridge.
 for(let i=0;i<7;i++)b.box(40+i*.9,-.15+i*.15,8,1.0,.18,20,'#b6c2b2');
 for(const [x,z]of [[-55,15],[-41,37],[-26,60],[43,5],[32,-30]]){b.box(x,.1,z,4,.55,2.5,'#a5b29d');b.tree(x,.65,z,.95);}
 b.prism(SGBV.rect(33,20,21,5,-.4),1.2,1.65,'#aebdab');b.rim(SGBV.rect(33,20,21,5,-.4),2.7,'#94a89e',.10);
});
}
