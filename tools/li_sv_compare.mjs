/* Little India street-level comparison against local Street View references (REFERENCE ONLY: never committed or shipped).
 *   bash src/lm33/kit/browser.sh node tools/li_sv_compare.mjs [slug|streets/<name>,...] [--round NAME] [--every N]
 * Env: LI_SV (/workspace/li_streetview), LI_OUT (/workspace/eo_li_out), URL.
 * For each manifest entry renders the model from the pano camera (ground + 2.5 m, heading/pitch/fov) by day and night,
 * plus a whole-scene silhouette mask and the target landmark mask; tools/li_sv_score.py builds sheets + skyline IoU.
 */
import fs from 'node:fs';import path from 'node:path';import {createRequire}from'node:module';import{execFileSync}from'node:child_process';
const require=createRequire(import.meta.url),{openApp}=require('../src/lm20/kit/appshot.js');
const root=path.resolve(import.meta.dirname,'..'),sv=process.env.LI_SV||'/workspace/li_streetview',out=process.env.LI_OUT||'/workspace/eo_li_out';
const arg=(k,d)=>process.argv.includes(k)?process.argv[process.argv.indexOf(k)+1]:d;
const round=arg('--round','final'),every=+arg('--every','1'),dest=path.join(out,'sv',round);fs.mkdirSync(dest,{recursive:true});
const sets=(process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:'').split(',').filter(Boolean);
const app=await openApp({near:'1.3080,103.8535,1600',view:'li'});const {page,browser}=app;
await page.evaluate(()=>{const css=document.createElement('style');css.textContent='body *{visibility:hidden!important}canvas{visibility:visible!important}';document.head.appendChild(css);__t.ev("HOOKS.prerender.push(()=>{if(window.__bvShot){camera.position.fromArray(__bvShot.position);camera.quaternion.fromArray(__bvShot.quaternion);camera.updateMatrixWorld(true);}});");});
for(const set of sets){
 const man=JSON.parse(fs.readFileSync(path.join(sv,set,'manifest.json'))).filter((_,i)=>i%every===0);const slug=set.startsWith('streets/')?null:set;
 const od=path.join(dest,set.replace('/','_'));fs.mkdirSync(od,{recursive:true});
 for(const s of man){const [W,H]=s.size||[640,640];const base=s.file.replace(/\.jpg$/,'');
  for(const tod of [13,20.5]){
   const r=await page.evaluate(({s,W,H,tod,slug,masks})=>{const t=__t,q=t.sgXY(s.lat,s.lng),y=t.hC(...q)+2.5,h=s.heading*Math.PI/180,p=s.pitch*Math.PI/180;
    t.setTod(tod);t.camera.position.set(q[0],y,-q[1]);t.camera.up.set(-Math.sin(h)*Math.sin(p),Math.cos(p),Math.cos(h)*Math.sin(p));const L=[q[0]+Math.sin(h)*Math.cos(p)*100,y+Math.sin(p)*100,-q[1]-Math.cos(h)*Math.cos(p)*100];t.camera.lookAt(...L);
    t.camera.fov=2*Math.atan(Math.tan(s.fov*Math.PI/360)/(W/H))*180/Math.PI;t.camera.aspect=W/H;t.camera.near=.3;t.camera.far=130000;t.camera.updateProjectionMatrix();t.camera.updateMatrixWorld(true);
    window.__bvShot={position:t.camera.position.toArray(),quaternion:t.camera.quaternion.toArray()};t.renderer.setPixelRatio(1);t.renderer.setSize(W,H,false);t.controls.target.set(...L);
    const R=()=>{t.ev("runHooks('frame',2,0);runHooks('prerender',2,0)");t.renderer.setRenderTarget(null);t.renderer.setScissorTest(false);t.renderer.setViewport(0,0,W,H);t.renderer.render(t.scene,t.camera);};R();
    const beauty=t.renderer.domElement.toDataURL('image/jpeg',.9).split(',')[1];let all=null,lm=null;
    if(masks){/* silhouette pass: normal materials, magenta void instead of sky/fog; sky dome, sprites, points hidden */
     const S=t.scene,bg=S.background,fog=S.fog,hid=[];S.background=new THREE.Color(0xff00ff);const fn=fog&&[fog.near,fog.far,fog.density];if(fog){fog.near=1e9;fog.far=2e9;if('density' in fog)fog.density=0;}
     S.traverse(o=>{if(!o.visible)return;let big=false;if(o.geometry){if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();const bs=o.geometry.boundingSphere;big=!!bs&&bs.radius*o.matrixWorld.getMaxScaleOnAxis()>15000&&!o.isInstancedMesh;}
      const m=Array.isArray(o.material)?o.material[0]:o.material;if(o.isSprite||o.isPoints||big||(m&&(m.blending===THREE.AdditiveBlending||(m.transparent&&m.opacity<.5)))){hid.push(o);o.visible=false;}});
     R();all=t.renderer.domElement.toDataURL('image/png').split(',')[1];
     const Lm=slug&&t.landmarks.find(L=>L.type==='sgli_'+slug),g=Lm&&t.ev('lmMeshes').get(Lm.id);if(g){const ov=S.overrideMaterial;S.background=new THREE.Color(0);S.overrideMaterial=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});g.traverse(o=>o.layers.enable(7));t.camera.layers.set(7);t.renderer.render(S,t.camera);lm=t.renderer.domElement.toDataURL('image/png').split(',')[1];t.camera.layers.set(0);g.traverse(o=>o.layers.disable(7));S.overrideMaterial=ov;}
     hid.forEach(o=>o.visible=true);S.background=bg;if(fog){[fog.near,fog.far]=fn;if('density' in fog)fog.density=fn[2];}}
    return {beauty,all,lm};},{s,W,H,tod,slug,masks:tod===13});
   fs.writeFileSync(path.join(od,`${base}_${tod===13?'day':'night'}.jpg`),Buffer.from(r.beauty,'base64'));
   if(r.all)fs.writeFileSync(path.join(od,`${base}_all.png`),Buffer.from(r.all,'base64'));if(r.lm)fs.writeFileSync(path.join(od,`${base}_lm.png`),Buffer.from(r.lm,'base64'));
  }
  console.log(round,set,base);}
}
await browser.close();
if(sets.length)execFileSync('python3',[path.join(root,'tools/li_sv_score.py'),sv,dest,out,round,...sets],{stdio:'inherit'});
console.log(JSON.stringify({pageErrors:app.errors.length,consoleErrors:app.consoleErrors.length,first:String(app.consoleErrors[0]||app.errors[0]||'').slice(0,200)}));if(app.errors.length||app.consoleErrors.length)process.exitCode=1;
