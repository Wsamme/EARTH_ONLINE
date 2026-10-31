/* Local full-app verification for hub_east; no reference imagery or mesh input. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {openApp}=require('../src/lm20/kit/appshot.js');
const out=process.env.JE_OUT||'/workspace/eo_je_out/hub_east';
fs.mkdirSync(out,{recursive:true});
const slugs=['imm','perennial_business_city','jurong_east_mrt'];
const {page,browser,errors,consoleErrors}=await openApp({near:'1.3335,103.7430,2500',view:'je'});
try {
 const models=await page.evaluate(slugs=>{
  const t=__t, meshes=t.ev('lmMeshes');
  return slugs.map(slug=>{
   const L=t.landmarks.find(l=>l.type==='sgje_'+slug),g=L&&meshes.get(L.id);
   if(!g)throw Error('Missing landmark '+slug);
   let triangles=0,vertices=0,nonfinite=0,batches=0;
   g.traverse(m=>{if(!m.isMesh)return;batches++;const p=m.geometry.attributes.position;
    vertices+=p.count;triangles+=m.geometry.index?m.geometry.index.count/3:p.count/3;
    for(const v of p.array)if(!Number.isFinite(v))nonfinite++;
   });
   const box=new THREE.Box3().setFromObject(g);
   return {slug,...JurongEast.stats[slug],triangles,vertices,batches,nonfinite,bounds:{min:box.min.toArray(),max:box.max.toArray()}};
  });
 },slugs);
 for(const slug of slugs)for(const night of [false,true]){
  const jpeg=await page.evaluate(({slug,night})=>{
   const t=__t,D=t.ev('SGJE.data')[slug],q=t.sgXY(D.lat,D.lon),ground=t.hC(...q);
   t.setTod(night?20.5:13);t.camera.up.set(0,1,0);t.camera.fov=42;t.camera.near=1;
   t.controls.target.set(q[0],ground+D.height*.5,-q[1]);
   t.camera.position.set(q[0]+400,ground+260,-q[1]+440);t.controls.update();t.camera.updateProjectionMatrix();
   t.ev("runHooks('frame',2,0);runHooks('prerender',2,0)");
   t.renderer.render(t.scene,t.camera);return t.renderer.domElement.toDataURL('image/jpeg',.92).split(',')[1];
  },{slug,night});
  fs.writeFileSync(path.join(out,slug+(night?'_review_night.jpg':'_review_day.jpg')),Buffer.from(jpeg,'base64'));
 }
 const report={pageErrors:errors,consoleErrors,models};
 fs.writeFileSync(path.join(out,'hub_east_verification.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
 if(errors.length||consoleErrors.length||models.some(m=>m.nonfinite||!m.triangles||m.triangles>60000))process.exitCode=1;
}finally{await browser.close();}
