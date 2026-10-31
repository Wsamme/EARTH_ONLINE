/* Runtime mask/material/shadow audit; imported by bv_refine_render.mjs. */
import fs from 'node:fs';import{execFileSync}from'node:child_process';
export async function audit(page,out){
 const fp=fs.readFileSync('src/sgbv/footprints.json','utf8'),old=execFileSync('git',['show','a69f9f2:src/sgbv/core.js'],{encoding:'utf8'}).replace('/* BV_FOOTPRINTS */',fp).replace('const SGBV =','window.__oldMaskKit =');
 await page.evaluate(code=>{__t.ev(code);},old);
 const report=await page.evaluate(()=>{const t=__t,restored=[],mrt=t.landmarks.find(l=>l.type==='sgbv_buona_vista_mrt'),M=t.ev('lmMeshes').get(mrt.id),tris=[],v=new THREE.Vector3();M.updateMatrixWorld(true);
  M.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position,c=o.geometry.attributes.color;for(let i=0;i<p.count;i+=3){if(c){const r=c.getX(i),g=c.getY(i),b=c.getZ(i);if((g>r*1.12&&g>b*1.12&&g<.6)||(Math.abs(r-104/255)<.001&&Math.abs(g-95/255)<.001&&Math.abs(b-75/255)<.001))continue;}const a=[];for(let k=0;k<3;k++)a.push(v.fromBufferAttribute(p,i+k).applyMatrix4(o.matrixWorld).toArray());tris.push(a);}});
  const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const pip=(P,p)=>{let b=false;for(let i=0,j=P.length-1;i<P.length;j=i++)if((P[i][1]>p[1])!==(P[j][1]>p[1])&&p[0]<(P[j][0]-P[i][0])*(p[1]-P[i][1])/(P[j][1]-P[i][1])+P[i][0])b=!b;return b;};
  const intersect=(a,b,c,d)=>{const x=cross(a,b,c),y=cross(a,b,d),z=cross(c,d,a),w=cross(c,d,b);return x*y<-.0001&&z*w<-.0001;};
  for(const[ti,list]of t.SGR.bldData.tiles){for(const B of list){if(!B.rings?.length)continue;if(!__oldMaskKit.skip(B)||t.ev('SGBV').skip(B))continue;
   const P=[];for(let i=0;i<B.rings[0].length;i+=2)P.push([B.rings[0][i],-B.rings[0][i+1]]);
   const lo=Math.min(...P.map(p=>t.hC(p[0],-p[1]))),base=B.base>2&&B.base<B.h-.5?B.base:0,y0=lo+base,y1=lo+B.h;
   const bb=[Math.min(...P.map(p=>p[0])),Math.min(...P.map(p=>p[1])),Math.max(...P.map(p=>p[0])),Math.max(...P.map(p=>p[1]))];let hits=0;
   for(const a of tris){if(Math.max(...a.map(p=>p[1]))<y0+.05||Math.min(...a.map(p=>p[1]))>y1-.05)continue;const Q=a.map(p=>[p[0],p[2]]);if(Math.max(...Q.map(p=>p[0]))<bb[0]||Math.min(...Q.map(p=>p[0]))>bb[2]||Math.max(...Q.map(p=>p[1]))<bb[1]||Math.min(...Q.map(p=>p[1]))>bb[3])continue;
    if(Q.some(p=>pip(P,p))||P.some(p=>pip(Q,p))||Q.some((p,i)=>P.some((q,j)=>intersect(p,Q[(i+1)%3],q,P[(j+1)%P.length]))))hits++;
   }
   restored.push({tile:ti,index:B.i,height:B.h,lat:1.315+B.cy/110574,lon:103.845+B.cx/111290.5,stationTriangleOverlapCandidates:hits,ring:P});
  }}
  const stripProblems=[],sharedProblems=[];for(const L of t.landmarks){const g=t.ev('lmMeshes').get(L.id);if(!g)continue;g.traverse(o=>{if(!o.isMesh)return;if(o.material.userData.svThinStrip&&o.castShadow)stripProblems.push(L.type);if(L.type!=='sgbv_star_vista'&&o.material.userData.svCourtCut)sharedProblems.push(L.type);});}
  return{restored,stripProblems,sharedProblems,mrtArchitecturalTriangles:tris.length};
 });
 fs.writeFileSync(out+'/bugbot_runtime.json',JSON.stringify(report,null,2));
 if(report.stripProblems.length||report.sharedProblems.length)throw Error('Material/shadow isolation regression');
 // Low neighbouring-landmark views make a local court-shaped hole observable.
 for(const slug of ['rochester','metropolis','buona_vista_mrt']){
  const data=await page.evaluate(slug=>{const t=__t,D=t.ev('SGBV.data')[slug],q=t.sgXY(D.lat,D.lon),y=t.hC(...q);t.setTod(13);t.camera.up.set(0,1,0);t.controls.target.set(q[0]+25,y+5,-q[1]+8);t.camera.position.set(q[0]+105,y+9,-q[1]+100);t.camera.fov=55;t.camera.near=.3;t.camera.updateProjectionMatrix();t.controls.update();t.ev("runHooks('frame',2,0);runHooks('prerender',2,0)");t.renderer.render(t.scene,t.camera);return t.renderer.domElement.toDataURL('image/jpeg',.94).split(',')[1];},slug);
  fs.writeFileSync(out+'/neighbor_'+slug+'.jpg',Buffer.from(data,'base64'));
 }
 return report;
}
