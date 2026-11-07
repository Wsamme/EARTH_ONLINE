/* Local future-design and night-cycle verification. No reference assets ship. */
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{openApp}=require('../src/lm20/kit/appshot.js');
const out=(process.env.JE_OUT||'/workspace/eo_je_out/malls_west')+'/design';fs.mkdirSync(out,{recursive:true});
const app=await openApp({near:'1.3335,103.7430,2500',view:'je'}),{page,browser}=app;
await page.evaluate(()=>{const s=document.createElement('style');s.textContent='body *{visibility:hidden!important}canvas{visibility:visible!important}';document.head.appendChild(s);});
const shots=[
 {name:'j_den_day',slug:'j_den',lat:1.333339084,lon:103.74018296,dx:-200,dy:95,dz:290,tod:13,target:65},
 {name:'j_den_night',slug:'j_den',lat:1.333339084,lon:103.74018296,dx:-200,dy:95,dz:290,tod:20.5,target:65},
 {name:'j_den_deck_night',slug:'j_den',lat:1.333339084,lon:103.74018296,dx:-70,dy:45,dz:-90,tod:20.5,target:12},
 {name:'jem_night',slug:'jem',lat:1.33318363,lon:103.74339489,dx:-190,dy:100,dz:-210,tod:20.5,target:35},
 ...[0,15,30,45,60].map(time=>({name:'westgate_cycle_'+time,slug:'westgate',lat:1.33425486,lon:103.74286557,dx:170,dy:100,dz:230,tod:20.5,target:60,time}))
];
for(const v of shots){
 const b64=await page.evaluate(v=>{const t=__t,q=t.sgXY(v.lat,v.lon),y=t.hC(...q);t.renderer.setSize(1280,900,false);t.camera.aspect=1280/900;t.camera.up.set(0,1,0);t.camera.fov=42;t.camera.near=.3;t.camera.far=130000;t.camera.updateProjectionMatrix();t.controls.target.set(q[0],y+v.target,-q[1]);t.camera.position.set(q[0]+v.dx,y+v.dy,-q[1]+v.dz);t.controls.update();t.setTod(v.tod);t.ev(`LMT.value=${v.time||0};runHooks('frame',${v.time||0},0);runHooks('prerender',${v.time||0},0)`);t.renderer.setRenderTarget(null);t.renderer.setViewport(0,0,1280,900);t.renderer.render(t.scene,t.camera);return t.renderer.domElement.toDataURL('image/jpeg',.93).split(',')[1];},v);
 fs.writeFileSync(`${out}/${v.name}.jpg`,Buffer.from(b64,'base64'));console.log(v.name);
}
const stats=await page.evaluate(()=>({models:JurongEast.stats,heights:Object.fromEntries(['westgate','jem','j_den'].map(s=>[s,__t.LANDMARKS['sgje_'+s].h]))}));
fs.writeFileSync(`${out}/verification.json`,JSON.stringify({pageErrors:app.errors,consoleErrors:app.consoleErrors,shots:shots.map(s=>s.name),...stats},null,2));
await browser.close();if(app.errors.length||app.consoleErrors.length)process.exitCode=1;
