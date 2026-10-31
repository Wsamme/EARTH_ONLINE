/* Little India exact-camera comparison (local only; references never committed or shipped).
 * Serve site/ (python3 -m http.server 8049 --directory site) after `bash tools/bv_build.sh --test`, then:
 *   bash src/lm33/kit/browser.sh node tools/li_compare.mjs [slug,...] [--round NAME] [--hero]
 * Env: LI_REFS (/workspace/li_refs), LI_OUT (/workspace/eo_li_out), URL.
 * Per view writes <slug>_<view>_day.jpg, <slug>_<view>_mask.png (target landmark only, white on black),
 * and <slug>_s_night.jpg; then tools/li_score.py computes IoU vs the footprint-clipped tile masks.
 */
import fs from 'node:fs';import path from 'node:path';import {createRequire}from'node:module';import{execFileSync}from'node:child_process';
const require=createRequire(import.meta.url),{openApp}=require('../src/lm20/kit/appshot.js');
const root=path.resolve(import.meta.dirname,'..'),refs=process.env.LI_REFS||'/workspace/li_refs',out=process.env.LI_OUT||'/workspace/eo_li_out';
const arg=(k,d)=>process.argv.includes(k)?process.argv[process.argv.indexOf(k)+1]:d;
const round=arg('--round','final'),dest=path.join(out,'renders',round);fs.mkdirSync(dest,{recursive:true});
const slugs=(process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:'').split(',').filter(Boolean);
const VIEWS=['n','e','s','w','top','close_ne','close_sw','street'];
const app=await openApp({near:'1.3080,103.8535,1600',view:'li'});const {page,browser}=app;
await page.evaluate(()=>{const css=document.createElement('style');css.textContent='body *{visibility:hidden!important}canvas{visibility:visible!important}';document.head.appendChild(css);__t.ev("HOOKS.prerender.push(()=>{if(window.__bvShot){camera.position.fromArray(__bvShot.position);camera.quaternion.fromArray(__bvShot.quaternion);camera.updateMatrixWorld(true);}});");});
const report=[];
for(const slug of slugs){
 const mp=path.join(refs,slug,'meta.json');if(!fs.existsSync(mp)){console.log('no refs for',slug);continue;}
 const meta=JSON.parse(fs.readFileSync(mp));const [W,H]=meta.image.size;
 for(const view of VIEWS){const shot=meta.shots[view];if(!shot)continue;
  for(const tod of (view==='s'||view==='close_sw'?[13,20.5]:[13])){
  const r=await page.evaluate(({shot,meta,W,H,tod,slug,mask})=>{const t=__t,q=t.sgXY(shot.lat,shot.lon),c=t.sgXY(meta.centroid.lat,meta.centroid.lon),ground=t.hC(...c);const h=shot.heading*Math.PI/180,p=shot.pitch*Math.PI/180;const y=ground+shot.alt-meta.height.ground_ellipsoidal_m;
   t.setTod(tod);t.camera.position.set(q[0],y,-q[1]);t.camera.up.set(-Math.sin(h)*Math.sin(p),Math.cos(p),Math.cos(h)*Math.sin(p));const L=[q[0]+Math.sin(h)*Math.cos(p)*100,y+Math.sin(p)*100,-q[1]-Math.cos(h)*Math.cos(p)*100];t.camera.lookAt(...L);
   t.camera.fov=2*Math.atan(Math.tan((shot.hfov||60)*Math.PI/360)/(W/H))*180/Math.PI;t.camera.aspect=W/H;t.camera.near=.3;t.camera.far=130000;t.camera.updateProjectionMatrix();t.camera.updateMatrixWorld(true);
   window.__bvShot={position:t.camera.position.toArray(),quaternion:t.camera.quaternion.toArray()};t.renderer.setPixelRatio(1);t.renderer.setSize(W,H,false);t.controls.target.set(...L);
   t.ev("runHooks('frame',2,0);runHooks('prerender',2,0)");t.renderer.setRenderTarget(null);t.renderer.setScissorTest(false);t.renderer.setViewport(0,0,W,H);t.renderer.render(t.scene,t.camera);
   const beauty=t.renderer.domElement.toDataURL('image/jpeg',.92).split(',')[1];let m=null;
   if(mask){const Lm=t.landmarks.find(L=>L.type==='sgli_'+slug),g=Lm&&t.ev('lmMeshes').get(Lm.id);if(g){const S=t.scene,bg=S.background,fog=S.fog,ov=S.overrideMaterial;g.traverse(o=>o.layers.enable(7));t.camera.layers.set(7);S.background=new THREE.Color(0);S.fog=null;S.overrideMaterial=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});t.renderer.render(S,t.camera);m=t.renderer.domElement.toDataURL('image/png').split(',')[1];S.background=bg;S.fog=fog;S.overrideMaterial=ov;t.camera.layers.set(0);g.traverse(o=>o.layers.disable(7));}}
   return {beauty,mask:m,ground,direction:t.camera.getWorldDirection(new THREE.Vector3()).toArray(),found:!!m};},{shot,meta,W,H,tod,slug,mask:tod===13});
  const tag=tod===13?'day':'night';fs.writeFileSync(path.join(dest,`${slug}_${view}_${tag}.jpg`),Buffer.from(r.beauty,'base64'));if(r.mask)fs.writeFileSync(path.join(dest,`${slug}_${view}_mask.png`),Buffer.from(r.mask,'base64'));
  const e=[Math.sin(shot.heading*Math.PI/180)*Math.cos(shot.pitch*Math.PI/180),Math.sin(shot.pitch*Math.PI/180),-Math.cos(shot.heading*Math.PI/180)*Math.cos(shot.pitch*Math.PI/180)];if(Math.hypot(...r.direction.map((x,i)=>x-e[i]))>1e-4)throw new Error('camera direction mismatch '+slug+'/'+view);
  report.push({slug,view,tod,landmark_found:r.found||tod!==13,app_ground:r.ground});console.log(round,slug,view,tag);}
 }
}
if(process.argv.includes('--hero'))for(const night of [false,true]){const W=1600,H=1000;const jpeg=await page.evaluate(({night,W,H})=>{window.__bvShot=null;const t=__t,q=t.sgXY(1.3078,103.8530);t.renderer.setSize(W,H,false);t.camera.aspect=W/H;t.camera.up.set(0,1,0);t.setTod(night?20.5:13);t.controls.target.set(q[0],12,-q[1]);t.camera.position.set(q[0]+150,520,-q[1]+820);t.camera.fov=42;t.camera.near=1;t.camera.updateProjectionMatrix();t.controls.update();t.ev("runHooks('frame',2,0);runHooks('prerender',2,0)");t.renderer.render(t.scene,t.camera);return t.renderer.domElement.toDataURL('image/jpeg',.94).split(',')[1];},{night,W,H});fs.writeFileSync(path.join(out,night?'li_area_hero_night.jpg':'li_area_hero_day.jpg'),Buffer.from(jpeg,'base64'));}
const stats=await page.evaluate(()=>{const s=LittleIndia.stats,o={};for(const k in s)o[k]=s[k];return {models:o,render:__t.renderer.info.render};});
fs.writeFileSync(path.join(dest,'verification.json'),JSON.stringify({pageErrors:app.errors,consoleErrors:app.consoleErrors,views:report,...stats},null,2));
await browser.close();
if(slugs.length)execFileSync('python3',[path.join(root,'tools/li_score.py'),refs,dest,out,...slugs],{stdio:'inherit'});
console.log(JSON.stringify({pageErrors:app.errors,consoleErrors:app.consoleErrors,models:stats.models}));if(app.errors.length||app.consoleErrors.length)process.exitCode=1;
