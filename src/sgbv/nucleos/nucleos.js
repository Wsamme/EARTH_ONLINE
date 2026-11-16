/* Original OSM-part model. The supplied AGWMS image is a design render;
 * current tile images govern the built envelope and dark/light panel distribution. */
{
const {register,scale,center,lerp}=SGBV;
register('nucleos','Nucleos','Nucleos',86,(b,D,G,g)=>{
 const lights=new SGBV.Batch(G.base);
 for(const part of D.parts){const P=part.p,t=part.tags,id=part.id;
  if(id===1562916648){b.prism(P,15.8,18,'#a7b4a2');b.garden(scale(P,.92),18.05,false);continue;}
  const bridge=id===1562916649,low=id===1562916646;
  const H=bridge?39.5:low?19:id===1562916645?47.5:49.5,lo=bridge?28:0;
  b.prism(scale(P,.995),lo,H,'#6b757d');
  // Original irregular vertical glazing cells, dark spandrels and pale folded panels.
  const Q=SGBV.out(P,.07);
  Q.forEach((p,i)=>{const q=Q[(i+1)%Q.length],L=Math.hypot(q[0]-p[0],q[1]-p[1]),n=Math.max(1,Math.round(L/2.6));
   for(let j=0;j<n;j++)for(let f=0;f<Math.round((H-lo)/6.8);f++){
    const y=lo+f*6.8,hi=Math.min(H,y+6.8),u=j/n,v=(j+1)/n,A=[lerp(p[0],q[0],u),lerp(p[1],q[1],u)],B=[lerp(p[0],q[0],v),lerp(p[1],q[1],v)],seed=(j*7+i*11+f*3)%13,glass=seed<4;
    const back=id===1562916647&&p[1]<-40&&q[1]<-40;const c=back&&!glass?'#727f8c':glass?(seed%2?'#425961':'#637780'):(seed%3===0?'#c1c9cb':seed%3===1?'#8e9da4':'#abb6bb');
    b.quad(c,[A[0],y+.12,A[1]],[B[0],y+.12,B[1]],[B[0],hi-.12,B[1]],[A[0],hi-.12,A[1]],glass?2:0);
    if(glass)b.quad('#697c81',[A[0],y+3.25,A[1]],[B[0],y+3.25,B[1]],[B[0],y+3.35,B[1]],[A[0],y+3.35,A[1]]);
   }
  });
  if(!bridge){b.facade(scale(P,1.003),.4,5.6,5.2,5.5,'#526b6d','#b2bdbc',.14);b.roof(P,H);}
  else{b.band(P,28,.7,'#c8ceca',1.006);b.band(P,39,0.5,'#c2cbc3');}
  if(!low&&!bridge){
   // Roof service screens sit above the seven deep lab floors, not extra office levels.
   const R=scale(P,.91);b.walls(R,H+.5,H+4.8,'#909b9d');b.rim(R,H+4.8,'#b1babb',.22);
   const C=center(P);for(let k=-1;k<=1;k++){const x=C[0]+k*12,z=C[1];if(SGBV.inside(R,x,z))b.box(x,H+.2,z,8,3.5,6,'#a9b2ae');}
   // Transverse plant partitions seen on the north aerial.
   const z0=Math.min(...R.map(p=>p[1])),z1=Math.max(...R.map(p=>p[1]));
   for(let z=z0+10;z<z1-4;z+=13){let xs=[];for(let x=-42;x<45;x+=1)if(SGBV.inside(R,x,z))xs.push(x);if(xs.length>3)b.beam([xs[0],H+3.8,z],[xs.at(-1),H+3.8,z],.38,'#b1b8b4');}
  }
 }
 // Private cool-white lab-window shader; no warm randomized office defaults.
 const flush=b.flush.bind(b);b.flush=group=>flush(group,mode=>{const source=lmMat({c:'#ffffff',vc:true,ds:true,m:0,lk:.08,lc:'#dcebf5'}),m=source.clone();m.onBeforeCompile=function(sh,r){source.onBeforeCompile.call(this,sh,r);if(mode===2)sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
float h4=abs(vWN.x)>abs(vWN.z)?vWP.z:vWP.x;
float r4=fract(sin(floor((vWP.y-uBase)/6.8)*12.9898+floor(h4/2.6)*78.233)*43758.5453);
float o4=step(r4,.38)*step(.18,fract(h4/2.6))*step(.30,fract((vWP.y-uBase)/6.8))*(1.0-step(.5,abs(vWN.y)));
totalEmissiveRadiance+=vec3(.64,.79,.87)*o4*uNight*.46;
`);};m.customProgramCacheKey=()=>source.customProgramCacheKey()+':nucleos-cool-'+mode;if(typeof LMCTX!=='undefined'&&LMCTX)LMCTX.mats.set('nucleos-surface-'+mode,m);return m;});
 b.box(-24,5.5,-61,23,.32,3.2,'#b33532',-.30);
 // Planted bridge and hanging garden walls: kept within mapped low-wing envelopes.
 for(const [x,z,w]of [[-39,-43,1.6],[-40,-25,1.4],[27,9,12]]){
  b.box(x,12,z,w,6.0,1.0,'#466c48');for(let k=0;k<5;k++)b.box(x+(k-2)*w/5,10.2+(k%3)*.6,z-.6,.35,7-(k%3),.20,k%2?'#617b4c':'#3e6544');
 }
 const link=D.parts.find(p=>p.id===1562916649).p;lights.rim(link,28.15,'#e6f2ef',.14);lights.rim(link,39.55,'#e6f2ef',.12);b.garden(scale(link,.88),39.6,false);
 for(const p of [link[0],link[3]])b.tree(p[0],39.65,p[1],.45);
 const north=D.parts.find(p=>p.id===1562916647).p,C=center(north);
 b.box(C[0],54.0,C[1],4,.7,3,'#aeb8b6');
 for(const p of [[-28,-5],[0,7],[28,12]]){lights.box(p[0],17.8,p[1],4,.12,.6,'#e6f1ed');b.box(p[0],-.15,p[1],6,.6,2,'#b3bbaa');b.tree(p[0],.5,p[1],.65);}
 lights.flush(g,()=>{const m=lmMat({c:'#ffffff',vc:true,ds:true,m:0,glow:'#e4f1f3',gk:.42});m.userData.bv4Light=true;return m;});
});
}
