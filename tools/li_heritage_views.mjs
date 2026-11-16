// Purposeful day/night detail checks even while a measured reference set is pending.
import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{openApp}=require('../src/lm20/kit/appshot.js');
const D=JSON.parse(fs.readFileSync('src/sgli/footprints.json'));
const out='/workspace/eo_li_out/heritage/details';fs.mkdirSync(out,{recursive:true});
const app=await openApp({view:'li',near:'1.308,103.8535,1600'}),{page,browser}=app;
const shots={veeramakaliamman:[55,28,35,10,20.1,12.5],srinivasa_perumal:[75,27,30,9,37.5,24.5],abdul_gafoor:[63,39,-68,8],angullia_mosque:[58,35,59,10],tan_teng_niah:[18,15,-28,4.5],indian_heritage_centre:[10,35,72,9]};
const selected=process.argv[2]?.split(',')||Object.keys(shots);
for(const [slug,shot]of Object.entries(shots).filter(([slug])=>selected.includes(slug)))for(const night of [false,true]){
 const jpeg=await page.evaluate(({slug,d,shot,night})=>{
  const t=__t,q=t.sgXY(d.lat,d.lon),y=t.hC(...q);t.setTod(night?20.5:13);t.renderer.setPixelRatio(1);t.renderer.setSize(1200,900,false);
  t.camera.aspect=4/3;t.camera.fov=42;t.camera.near=.5;t.camera.updateProjectionMatrix();t.camera.up.set(0,1,0);
  t.controls.target.set(q[0]+(shot[4]||0),y+shot[3],-q[1]+(shot[5]||0));t.camera.position.set(q[0]+shot[0],y+shot[1],-q[1]+shot[2]);t.controls.update();
  t.ev("runHooks('frame',2,0);runHooks('prerender',2,0)");t.renderer.render(t.scene,t.camera);
  return t.renderer.domElement.toDataURL('image/jpeg',.93).split(',')[1];
 },{slug,d:D[slug],shot,night});
 fs.writeFileSync(`${out}/${slug}_${night?'night':'day'}.jpg`,Buffer.from(jpeg,'base64'));
}
const check=await page.evaluate(()=>({models:window.LittleIndia.stats,retiredStillPlaced:__t.landmarks.filter(L=>['sgveeramakali','srinivasa','sgabdulgafoor','sgtantengniah'].includes(L.type)).map(L=>L.type)}));
const stats=check.models;if(check.retiredStillPlaced.length)throw new Error('Retired landmarks remain placed: '+check.retiredStillPlaced.join(','));
fs.writeFileSync(`${out}/verification.json`,JSON.stringify({pageErrors:app.errors,consoleErrors:app.consoleErrors,retiredStillPlaced:check.retiredStillPlaced,models:stats},null,2));
console.log(JSON.stringify({pageErrors:app.errors,consoleErrors:app.consoleErrors,retiredStillPlaced:check.retiredStillPlaced,models:stats}));await browser.close();
if(app.errors.length||app.consoleErrors.length)process.exitCode=1;
