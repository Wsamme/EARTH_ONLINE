/* Full-app exact-camera comparison. References stay local; no remote image services.
 * Serve site/, generate site/t_bv.html with mktest.py, then:
 * bash src/lm33/kit/browser.sh node tools/bv_compare.mjs --round round1
 * Env: URL, BV_REFS, BV_CAMERAS (fallback cams.jsonl), BV_OUT, BV_ONLY.
 */
import fs from 'node:fs';import path from 'node:path';import {createRequire}from'node:module';import{execFileSync}from'node:child_process';
const require=createRequire(import.meta.url),{openApp}=require('../src/lm20/kit/appshot.js');
const root=path.resolve(import.meta.dirname,'..'),refs=process.env.BV_REFS||path.join(root,'uploads/bv_refs'),out=process.env.BV_OUT||'/workspace/eo_codex_out';
const round=process.argv.includes('--round')?process.argv[process.argv.indexOf('--round')+1]:'final';const dest=path.join(out,round);fs.mkdirSync(dest,{recursive:true});
const fallback={};const cf=process.env.BV_CAMERAS||'/tmp/bv/cams.jsonl';if(fs.existsSync(cf))for(const line of fs.readFileSync(cf,'utf8').trim().split('\n')){const c=JSON.parse(line),p=c.out.split('/');fallback[p.at(-2)+'/'+path.basename(p.at(-1),'.jpg')]=c.cam;}
const slugs=process.env.BV_ONLY?.split(',')||['star_vista','metropolis','buona_vista_mrt','biopolis','fusionopolis_one','solaris','galaxis','mediacorp','rochester'];
const app=await openApp({near:'1.3013,103.7900,2500'});const {page,browser}=app;
const cameraReport=[];
await page.evaluate(()=>{const t=__t;const css=document.createElement('style');css.textContent='body *{visibility:hidden!important}canvas{visibility:visible!important}';document.head.appendChild(css);t.ev("HOOKS.prerender.push(()=>{if(window.__bvShot){camera.position.fromArray(__bvShot.position);camera.quaternion.fromArray(__bvShot.quaternion);camera.updateMatrixWorld(true);}});");document.querySelectorAll('body > :not(canvas):not(script):not(style)').forEach(e=>{if(!e.querySelector('canvas'))e.style.visibility='hidden';});});
for(const slug of slugs){const meta=JSON.parse(fs.readFileSync(path.join(refs,slug,'meta.json')));for(const view of ['n','e','s','w','top','street']){
 const shot=meta.shots[view]||fallback[slug+'/'+view];if(!shot)throw new Error('No exact camera recorded for '+slug+'/'+view);
 const camera=await page.evaluate(({shot,meta})=>{const t=__t,q=t.sgXY(shot.lat,shot.lon),c=t.sgXY(meta.centroid.lat,meta.centroid.lon),ground=t.hC(...c);const h=shot.heading*Math.PI/180,p=shot.pitch*Math.PI/180;const y=ground+shot.alt-meta.height.ground_ellipsoidal_m;t.setTod(13);t.camera.position.set(q[0],y,-q[1]);t.camera.up.set(-Math.sin(h)*Math.sin(p),Math.cos(p),Math.cos(h)*Math.sin(p));t.camera.lookAt(q[0]+Math.sin(h)*Math.cos(p)*100,y+Math.sin(p)*100,-q[1]-Math.cos(h)*Math.cos(p)*100);t.camera.fov=2*Math.atan(Math.tan((shot.hfov||60)*Math.PI/360)/1.6)*180/Math.PI;t.camera.aspect=1.6;t.camera.near=.3;t.camera.far=130000;t.camera.updateProjectionMatrix();t.camera.updateMatrixWorld(true);window.__bvShot={position:t.camera.position.toArray(),quaternion:t.camera.quaternion.toArray()};t.renderer.setSize(1600,1000,false);t.renderer.setPixelRatio(1);t.controls.target.set(q[0]+Math.sin(h)*Math.cos(p)*100,y+Math.sin(p)*100,-q[1]-Math.cos(h)*Math.cos(p)*100);t.ev("runHooks('frame',1,0);runHooks('prerender',1,0)");t.renderer.setRenderTarget(null);t.renderer.setScissorTest(false);t.renderer.setViewport(0,0,1600,1000);t.renderer.render(t.scene,t.camera);return {near:t.camera.near,direction:t.camera.getWorldDirection(new THREE.Vector3()).toArray(),position:__bvShot.position,fov:t.camera.fov,ground,jpeg:t.renderer.domElement.toDataURL('image/jpeg',.91).split(',')[1]};},{shot,meta});
 fs.writeFileSync(path.join(dest,slug+'_'+view+'.jpg'),Buffer.from(camera.jpeg,'base64'));delete camera.jpeg;cameraReport.push({slug,view,source:meta.shots[view]?'meta.json':'saved camera log',shot,...camera});console.log(round,slug,view);
 }
}
for(const night of [false,true]){const jpeg=await page.evaluate(night=>{window.__bvShot=null;const t=__t,q=t.sgXY(1.3013,103.7900);t.camera.up.set(0,1,0);t.setTod(night?20.5:13);t.controls.target.set(q[0],42,-q[1]);t.camera.position.set(q[0]+1050,830,-q[1]+1320);t.camera.fov=42;t.camera.updateProjectionMatrix();t.controls.update();t.camera.near=1;t.camera.updateProjectionMatrix();t.ev("runHooks('frame',1,0);runHooks('prerender',1,0)");t.renderer.render(t.scene,t.camera);return t.renderer.domElement.toDataURL('image/jpeg',.94).split(',')[1];},night);fs.writeFileSync(path.join(out,night?'hero_night.jpg':'hero_day.jpg'),Buffer.from(jpeg,'base64'));}
const stats=await page.evaluate(()=>({models:BuonaVista.stats,render:__t.renderer.info.render,tiles:__t.SGR.tiles.size}));
const totalTriangles=Object.values(stats.models).reduce((n,m)=>n+m.triangles+(m.railTriangles||0),0);if(totalTriangles>=400000)throw new Error('Buona Vista triangle budget exceeded: '+totalTriangles);stats.totalModelTriangles=totalTriangles;
for(const c of cameraReport){const h=c.shot.heading*Math.PI/180,p=c.shot.pitch*Math.PI/180,expected=[Math.sin(h)*Math.cos(p),Math.sin(p),-Math.cos(h)*Math.cos(p)];if(Math.hypot(...c.direction.map((x,i)=>x-expected[i]))>1e-5)throw new Error('Camera direction mismatch '+c.slug+'/'+c.view);}

fs.writeFileSync(path.join(dest,'verification.json'),JSON.stringify({pageErrors:app.errors,consoleErrors:app.consoleErrors,cameras:cameraReport,...stats},null,2));
await browser.close();
execFileSync('python3',[path.join(root,'tools/bv_sheet.py'),refs,dest,out,...slugs],{stdio:'inherit'});
console.log(JSON.stringify({pageErrors:app.errors,consoleErrors:app.consoleErrors,models:stats.models}));if(app.errors.length||app.consoleErrors.length)process.exitCode=1;
