/* Local review cameras and geometry audit. No reference imagery is shipped. */
import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{openApp}=require('../src/lm20/kit/appshot.js');
const out=process.env.LI_OUT||'/workspace/eo_li_out/commerce';fs.mkdirSync(out,{recursive:true});
const {page,browser,errors,consoleErrors}=await openApp({near:'1.3080,103.8535,1600',view:'li'});
const slugs=(process.argv[2]||'tekka_centre,mustafa_centre,deepavali_lightup,little_india_arcade,city_square_mall').split(',');
await page.evaluate(()=>{const s=document.createElement('style');s.textContent='body *{visibility:hidden!important} canvas{visibility:visible!important}';document.head.appendChild(s);});
for(const slug of slugs)for(const shot of ['day','night','street_night']){
 const night=shot!=='day';
 const jpg=await page.evaluate(({slug,night,shot})=>{const t=__t,D=t.ev('SGLI.data')[slug],q=t.sgXY(D.lat,D.lon),ground=t.hC(...q);t.setTod(night?20.5:13);t.camera.up.set(0,1,0);t.renderer.setPixelRatio(1);t.renderer.setSize(1400,1000,false);t.camera.aspect=1.4;t.camera.fov=45;t.camera.near=.3;
 const street=slug==='deepavali_lightup',close=shot==='street_night'&&!street;
 const cameras={tekka_centre:[125,80,-125],mustafa_centre:[-155,90,175],little_india_arcade:[65,48,-90],city_square_mall:[-155,85,165]},v=cameras[slug]||[160,110,190];
 let target=[0,D.height*.4,0],eye=close?[v[0]*.7,4.5,v[2]*.7]:v;
 if(street){const lm=t.landmarks.find(L=>L.type==='sgli_'+slug),g=t.ev('lmMeshes').get(lm.id),c=g.userData.liLightup.centres;target=[c[2][0],6.5,c[2][1]];eye=[c[0][0]+3,2.2,c[0][1]-5];}
 t.controls.target.set(q[0]+target[0],ground+target[1],-q[1]+target[2]);
 t.camera.position.set(q[0]+eye[0],ground+eye[1],-q[1]+eye[2]);
 t.camera.updateProjectionMatrix();t.controls.update();t.ev("runHooks('frame',2,0);runHooks('prerender',2,0)");t.renderer.render(t.scene,t.camera);return t.renderer.domElement.toDataURL('image/jpeg',.94).split(',')[1];},{slug,night,shot});
 fs.writeFileSync(`${out}/${slug}_review_${shot}.jpg`,Buffer.from(jpg,'base64'));
}
const stats=await page.evaluate(()=>{const models={};for(const k in LittleIndia.stats)models[k]=LittleIndia.stats[k];return models;});
fs.writeFileSync(`${out}/commerce_verification.json`,JSON.stringify({pageErrors:errors,consoleErrors,models:stats},null,2));console.log(JSON.stringify({pageErrors:errors,consoleErrors,models:stats}));await browser.close();if(errors.length||consoleErrors.length)process.exitCode=1;

const matched=slugs.filter(s=>s!=='deepavali_lightup'&&fs.existsSync('/workspace/li_refs/'+s+'/meta.json'));if(matched.length)execFileSync(process.execPath,['tools/li_compare.mjs',matched.join(','),'--round',process.env.LI_ROUND||'r1'],{stdio:'inherit'});

if(fs.existsSync(out+'/li_iou.json'))fs.copyFileSync(out+'/li_iou.json',out+'/li_iou_'+(process.env.LI_ROUND||'r1')+'.json');
