// Optional local photographic and low-eye night review; no external assets.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {openApp}=require('../src/lm20/kit/appshot.js');
const refs=process.env.JE_REFS||'/workspace/je_refs';
const out=process.env.JE_OUT||'/workspace/eo_je_out/health/review';
fs.mkdirSync(out,{recursive:true});
const app=await openApp({near:'1.33352,103.7455,1800',view:'je'});
try{
 for(const [name,dx,dy,dz,tod]of [['sw_day',-300,170,330,13],['sw_night',-300,130,330,20.5],['ne_day',310,190,-330,13],['close_day',-195,95,180,13],['street_night',-125,16,60,20.5],['balcony_night',-90,48,80,20.5]]){
  const data=await app.page.evaluate(({dx,dy,dz,tod})=>{
   const t=__t,q=t.sgXY(1.3335203000669698,103.7455027991624),y=t.hC(...q);
   t.setTod(tod);t.controls.target.set(q[0]-5,y+35,-q[1]-5);t.camera.position.set(q[0]+dx,y+dy,-q[1]+dz);
   t.camera.fov=42;t.camera.near=.3;t.camera.updateProjectionMatrix();t.controls.update();
   t.ev("runHooks('frame',2,0);runHooks('prerender',2,0)");t.renderer.render(t.scene,t.camera);
   return t.renderer.domElement.toDataURL('image/jpeg',.94).split(',')[1];
  },{dx,dy,dz,tod});fs.writeFileSync(`${out}/${name}.jpg`,Buffer.from(data,'base64'));
 }
 const stats=await app.page.evaluate(()=>JurongEast.stats.ng_teng_fong);
 fs.writeFileSync(`${out}/verification.json`,JSON.stringify({pageErrors:app.errors,consoleErrors:app.consoleErrors,stats,comparison:{available:fs.existsSync(`${refs}/ng_teng_fong/meta.json`),referencePath:`${refs}/ng_teng_fong/meta.json`,note:'These are photographic review views, not matched-camera IoU views.'}},null,2));
 console.log(JSON.stringify({pageErrors:app.errors,consoleErrors:app.consoleErrors,stats}));
 if(app.errors.length||app.consoleErrors.length)process.exitCode=1;
}finally{await app.browser.close();}
