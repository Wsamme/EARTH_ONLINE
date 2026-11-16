/* Fusionopolis Two: independent OSM footprints, folded Innovis crown,
 * Kinesis curtain wall and the cleanroom block's expressed K-bracing. */
{
const {register,scale,lerp,center}=SGBV;
if(typeof HOOKS!=='undefined'&&HOOKS.frame)HOOKS.frame.push(()=>{for(const L of landmarks){if(!['sgbv_nucleos','sgbv_fusionopolis_two'].includes(L.type))continue;const g=lmMeshes.get(L.id);if(g)g.traverse(o=>{if(o.isMesh&&o.material.userData.bv4Light)o.castShadow=false;});}});
register('fusionopolis_two','Fusionopolis Two','Fusionopolis Two',115,(b,D,G,g)=>{
 const lights=new SGBV.Batch(G.base);
 for(const part of D.parts){const P=part.p,id=part.id,inn=id===448605477,syn=id===448605478,H=inn?97: syn?48:64,fh=inn?5.1:syn?8:5.4;
  // Slightly recessed glazing, aluminium bands, and varied occupied labs.
  b.prism(scale(P,.996),0,H,'#548da9',2);
  b.facade(SGBV.out(P,.04),7,H,fh,5.2,'#71a6bd','#9cabb0',0);
  for(let y=7;y<H;y+=fh)b.band(P,y,.36,'#87a9b9',1.003);
  b.facade(SGBV.out(P,.10),.3,6.7,6.4,5.5,'#547c84','#bec9c6',.2);
  for(let y=17;y<H;y+=20.4)b.band(P,y,1.1,'#315d71',1.004);
  const C=center(P),LP=SGBV.out(P,.30);
  if(inn){
   // Angular folded roof rises to the measured 105.2m maximum.
   const roof=(x,z)=>Math.min(105.2,97.3+7.9*Math.max(0,Math.min(1,(z-C[1]+32)/62)));
   b.walls(P,H,roof,'#618496',2);b.cap(P,roof,'#839498');
   for(let x=-58;x<5;x+=2.6){const zs=[];for(let z=-4;z<72;z+=1)if(SGBV.inside(scale(P,.96),x,z))zs.push(z);if(zs.length>2)b.beam([x,roof(x,zs[0])+.15,zs[0]],[x,roof(x,zs.at(-1))+.15,zs.at(-1)],.16,'#b0bdc1');}
   const R=scale(P,.89);b.walls(R,H+1,(x,z)=>roof(x,z)+.0,'#7a8e95');
   P.forEach((p,i)=>{const q=P[(i+1)%P.length];b.beam([p[0],roof(...p),p[1]],[q[0],roof(...q),q[1]],.35,'#bbc9ca');lights.beam([LP[i][0],roof(...p),LP[i][1]],[LP[(i+1)%P.length][0],roof(...q),LP[(i+1)%P.length][1]],.28,'#e6f4ff');});
   // Dusk-photo V motif: fine cool-white accent lines, no signage.
   for(const i of [0,1,2]){const p=LP[i];lights.beam([p[0],65,p[1]],[p[0],roof(...P[i]),p[1]],.24,'#e6f1ff');}
   const p=LP[1],q=LP[2],mid=[lerp(p[0],q[0],.5),lerp(p[1],q[1],.5)];
   for(const a of [p,q])lights.beam([mid[0],78,mid[1]],[a[0],roof(...a),a[1]],.20,'#e6f1ff');
   // A recessed sky garden (opaque rear wall avoids inventing a through tunnel).
   const A=P[0],B=P[1],u=.25,v=.75,pp=[lerp(A[0],B[0],u),lerp(A[1],B[1],u)],qq=[lerp(A[0],B[0],v),lerp(A[1],B[1],v)];
   b.quad('#233d49',[pp[0]-.15,62,pp[1]],[qq[0]-.15,62,qq[1]],[qq[0]-.15,71,qq[1]],[pp[0]-.15,71,pp[1]]);
  }else{b.roof(P,H);}
  // Inverted-V lobby supports and expressed cleanroom braces.
  P.forEach((p,i)=>{const q=P[(i+1)%P.length],L=Math.hypot(q[0]-p[0],q[1]-p[1]);if(L<15)return;
   const n=Math.max(1,Math.round(L/(syn?19:14)));
   for(let j=0;j<n;j++){const A=[lerp(p[0],q[0],j/n),lerp(p[1],q[1],j/n)],B=[lerp(p[0],q[0],(j+1)/n),lerp(p[1],q[1],(j+1)/n)],M=[(A[0]+B[0])/2,(A[1]+B[1])/2];
    b.beam([A[0],6.8,A[1]],[M[0],.2,M[1]],.7,'#bbc6c7');b.beam([M[0],.2,M[1]],[B[0],6.8,B[1]],.7,'#bbc6c7');
    if(syn)for(let y=8;y<42;y+=16){b.beam([A[0],y,A[1]],[M[0],y+8,M[1]],.7,'#9eafb6');b.beam([M[0],y+8,M[1]],[A[0],y+16,A[1]],.7,'#9eafb6');b.beam([M[0],y+8,M[1]],[B[0],y+8,B[1]],.7,'#9eafb6');}
   }
   lights.beam([LP[i][0],6.6,LP[i][1]],[LP[(i+1)%P.length][0],6.6,LP[(i+1)%P.length][1]],.20,'#ffe1b8');
  });
  for(const [dx,dz]of [[0,0],[8,0]])lights.box(C[0]+dx,6.0,C[1]+dz,5,.15,2,'#ffe4bc');
 }
 // Dedicated glazing shader: blue-white occupied labs, restrained facade sheen.
 const flush=b.flush.bind(b);b.flush=group=>flush(group,mode=>{
  const source=lmMat({c:'#ffffff',vc:true,ds:true,m:0,lk:mode===2?.04:.08,lc:mode===2?'#c9e6ff':'#ffe1b5'}),m=source.clone();
  m.onBeforeCompile=function(sh,r){source.onBeforeCompile.call(this,sh,r);if(mode===2)sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.18,.39,.52),.28);\nfloat gridH4=abs(vWN.x)>abs(vWN.z)?vWP.z:vWP.x;\nfloat gridX4=fract(gridH4/1.55),gridY4=fract((vWP.y-uBase)/1.30);\nfloat mull4=clamp(step(.974,gridX4)+step(.95,gridY4),0.0,1.0);\nfloat pane4=.9+.1*fract(sin(floor(gridH4/1.55)*2.71+floor((vWP.y-uBase)/1.30)*3.13)*437.1);\ndiffuseColor.rgb=mix(diffuseColor.rgb*pane4,vec3(.36,.48,.54),mull4*.68);').replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
float f4=floor((vWP.y-uBase)/5.1);float h4=abs(vWN.x)>abs(vWN.z)?vWP.z:vWP.x;
float c4=floor(h4/3.2);float r4=fract(sin(f4*12.9898+c4*78.233)*43758.5453);
float o4=step(r4,.24)*step(.20,fract(h4/3.2))*step(.30,fract((vWP.y-uBase)/5.1))*(1.0-step(.5,abs(vWN.y)));
totalEmissiveRadiance+=uNight*(vec3(.45,.65,.83)*o4*.65*(1.0-mull4)+vec3(.025,.05,.09));
`);};m.customProgramCacheKey=()=>source.customProgramCacheKey()+':f2-blue-white-'+mode;
  if(typeof LMCTX!=='undefined'&&LMCTX)LMCTX.mats.set('f2-glass-'+mode,m);return m;
 });
 // Covered link and modest planted forecourts between the laboratory blocks.
 b.box(-8,5,-15,8,.5,25,'#9aafb2');b.facade(SGBV.rect(-8,-15,8,25),5.5,9.5,4,6,'#607d87','#a7b7b8',.14);
 for(const [x,z]of [[-35,2],[15,-25],[38,5],[-28,52]]){b.box(x,.1,z,6,.6,2.5,'#a8b5a9');b.tree(x,.7,z,.7);}
 lights.flush(g,()=>{const m=lmMat({c:'#ffffff',vc:true,ds:true,m:0,glow:'#daeaff',gk:1.35});m.userData.bv4Light=true;return m;});
});
}
