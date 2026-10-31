/* Night reference review: full app, local test copy, browser-lock/appshot flow.
 * bash src/lm33/kit/browser.sh node tools/sv_night_render.mjs
 * Only writes outside the repository. Does not fetch photo or tile references.
 */
import fs from 'node:fs';import{createRequire}from'node:module';
const require=createRequire(import.meta.url),{openApp}=require('../src/lm20/kit/appshot.js');
const out='/workspace/eo_codex_out',dir=out+'/sv_night';fs.mkdirSync(dir,{recursive:true});
const views=[{name:'front',dx:210,dy:35,dz:95,targetY:33,fov:46},{name:'side',dx:110,dy:75,dz:180,targetY:33,fov:47},{name:'plaza',dx:95,dy:52,dz:50,targetY:5,tx:32,tz:8,fov:51},{name:'hero',dx:110,dy:75,dz:180,targetY:32,fov:42}];
const reports=[];
for(const show of (process.env.SV_MODE?[Number(process.env.SV_MODE)]:[0,1])){
 const app=await openApp({page:'t_bv.html?show='+show,near:'1.30687671,103.78846253,1700'});const{page,browser}=app;
 try{

 await page.evaluate(()=>{const css=document.createElement('style');css.textContent='body *{visibility:hidden!important}canvas{visibility:visible!important}';document.head.appendChild(css);});
 async function render(v,time,tod=20.5){return await page.evaluate(({v,time,tod})=>{const t=__t,q=t.sgXY(1.30687671,103.78846253),y=t.hC(...q);t.setTod(tod);t.camera.up.set(0,1,0);t.controls.target.set(q[0]+(v.tx||0),y+v.targetY,-q[1]+(v.tz||0));t.camera.position.set(q[0]+v.dx,y+v.dy,-q[1]+v.dz);t.camera.fov=v.fov;t.camera.aspect=1.6;t.camera.near=.25;t.camera.updateProjectionMatrix();t.controls.update();t.renderer.setPixelRatio(1);t.renderer.setSize(1600,1000,false);t.ev(`runHooks('frame',${time},0);runHooks('prerender',${time},0)`);t.renderer.render(t.scene,t.camera);return t.renderer.domElement.toDataURL('image/jpeg',.95).split(',')[1];},{v,time,tod});}
 for(const v of views){fs.writeFileSync(`${dir}/${v.name}_${show}.jpg`,Buffer.from(await render(v,show?4:0),'base64'));}
 for(let i=0;i<=8;i++)fs.writeFileSync(`${dir}/cycle_${show}_${i}.jpg`,Buffer.from(await render(views[3],i*(show?1:2.5)),'base64'));
 fs.writeFileSync(`${dir}/day_${show}.jpg`,Buffer.from(await render(views[3],4,13),'base64'));
 const stats=await page.evaluate(()=>({stats:BuonaVista.stats,programs:__t.renderer.info.programs.map(p=>({name:p.name,diagnostics:p.diagnostics?{runnable:p.diagnostics.runnable}:null}))}));
 reports.push({show,pageErrors:app.errors,consoleErrors:app.consoleErrors,...stats});
 if(app.errors.length||app.consoleErrors.length)throw Error('App errors');
 }finally{await browser.close();}
}
fs.copyFileSync(dir+'/hero_0.jpg',out+'/star_vista_night_hero.jpg');fs.copyFileSync(dir+'/hero_1.jpg',out+'/star_vista_show_night.jpg');fs.writeFileSync(dir+'/verification.json',JSON.stringify(reports,null,2));
