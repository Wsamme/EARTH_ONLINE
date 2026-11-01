/* Integration checks in the built app, including terrain and replacement masks. */
import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{openApp}=require('../src/lm20/kit/appshot.js');
const app=await openApp({near:'1.3080,103.8535,1600',view:'li'});
const result=await app.page.evaluate(()=>{
 const t=__t,D=t.ev('SGLI.data'),kit=t.ev('SGLI'),landmarks={};
 for(const slug of ['li_shophouses','tekka_centre','mustafa_centre','little_india_arcade','city_square_mall','deepavali_lightup']){
  const L=t.landmarks.find(L=>L.type==='sgli_'+slug),g=L&&t.ev('lmMeshes').get(L.id);if(!g)throw Error('Missing '+slug);
  const q=t.sgXY(D[slug].lat,D[slug].lon),bb=new THREE.Box3().setFromObject(g),ground=t.hC(...q),samples=D[slug].parts.map(p=>{const c=kit.center(p.p);return t.hC(q[0]+c[0],q[1]-c[1])-ground;});
  landmarks[slug]={triangles:g.userData.bvTriangles,noHull:t.ev('LANDMARKS')['sgli_'+slug].noHull||false,bounds:[bb.min.toArray(),bb.max.toArray()],anchorGround:ground,partGroundRange:samples.length?[Math.min(...samples),Math.max(...samples)]:null,rows:g.userData.liRows||null};
 }
 const R=D.li_shophouses,q=t.sgXY(R.lat,R.lon);let masked=0;
 for(const p of R.parts){const c=kit.center(p.p),B={cx:q[0]+c[0],cy:q[1]-c[1],rings:[p.p.flatMap(v=>[q[0]+v[0],q[1]-v[1]])]};if(kit.skip(B))masked++;}
 return {landmarks,replacementMasks:{parts:R.parts.length,masked},rowHullPresent:t.SGR.hulls.has(t.landmarks.find(L=>L.type==='sgli_li_shophouses').id)};
});
const report={pageErrors:app.errors,consoleErrors:app.consoleErrors,...result};const out=process.env.LI_OUT||'/workspace/eo_li_out/commerce';fs.writeFileSync(out+'/integration_'+(process.env.LI_ROUND||'s2')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await app.browser.close();
if(app.errors.length||app.consoleErrors.length||result.rowHullPresent||result.replacementMasks.parts!==result.replacementMasks.masked)process.exitCode=1;
