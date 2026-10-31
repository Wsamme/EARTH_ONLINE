/* Local review cameras and geometry audit. No reference imagery is shipped. */
import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{openApp}=require('../src/lm20/kit/appshot.js');
const out=process.env.LI_OUT||'/workspace/eo_li_out/commerce';fs.mkdirSync(out,{recursive:true});
const {page,browser,errors,consoleErrors}=await openApp({near:'1.3080,103.8535,1600',view:'li'});
const slugs=(process.argv[2]||'tekka_centre,mustafa_centre,deepavali_lightup,little_india_arcade,city_square_mall').split(',');
await page.evaluate(()=>{const s=document.createElement('style');s.textContent='body *{visibility:hidden!important} canvas{visibility:visible!important}';document.head.appendChild(s);});
for(const slug of slugs)for(const night of [false,true]){
 const jpg=await page.evaluate(({slug,night})=>{const t=__t,D=t.ev('SGLI.data')[slug],q=t.sgXY(D.lat,D.lon),ground=t.hC(...q);t.setTod(night?20.5:13);t.camera.up.set(0,1,0);t.renderer.setPixelRatio(1);t.renderer.setSize(1400,1000,false);t.camera.aspect=1.4;t.camera.fov=45;t.camera.near=.3;
 const street=slug==='deepavali_lightup';
 t.controls.target.set(q[0]+(street?-140:0),ground+(street?7:D.height*.4),-q[1]+(street?70:0));
 t.camera.position.set(q[0]+(street?-210:160),ground+(street?2.2:110),-q[1]+(street?190:190));
 t.camera.updateProjectionMatrix();t.controls.update();t.ev("runHooks('frame',2,0);runHooks('prerender',2,0)");t.renderer.render(t.scene,t.camera);return t.renderer.domElement.toDataURL('image/jpeg',.94).split(',')[1];},{slug,night});
 fs.writeFileSync(`${out}/${slug}_review_${night?'night':'day'}.jpg`,Buffer.from(jpg,'base64'));
}
const stats=await page.evaluate(()=>{const models={};for(const k in LittleIndia.stats)models[k]=LittleIndia.stats[k];return models;});
fs.writeFileSync(`${out}/commerce_verification.json`,JSON.stringify({pageErrors:errors,consoleErrors,models:stats},null,2));console.log(JSON.stringify({pageErrors:errors,consoleErrors,models:stats}));await browser.close();if(errors.length||consoleErrors.length)process.exitCode=1;
