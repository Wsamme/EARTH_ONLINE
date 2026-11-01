/* Little India street-level beauty shots from a pedestrian camera (no references involved).
 *   bash src/lm33/kit/browser.sh node tools/li_street_shot.mjs [--tod 20.5] [--out DIR]
 * Cameras: name, lat, lng, heading (deg from north), pitch, horizontal fov, eye height above ground.
 */
import fs from 'node:fs';import path from 'node:path';import {createRequire}from'node:module';
const require=createRequire(import.meta.url),{openApp}=require('../src/lm20/kit/appshot.js');
const arg=(k,d)=>process.argv.includes(k)?process.argv[process.argv.indexOf(k)+1]:d;
const tods=arg('--tod','20.5').split(',').map(Number),out=arg('--out',process.env.LI_OUT||'/workspace/eo_li_out');fs.mkdirSync(out,{recursive:true});
const CAMS=[
 {name:'serangoon_rd_street',lat:1.30739,lng:103.85241,heading:33,pitch:6,fov:80,eye:1.7},
 {name:'serangoon_rd_street_n',lat:1.30831,lng:103.85299,heading:213,pitch:6,fov:80,eye:1.7},
];
const W=1600,H=900;
const app=await openApp({near:'1.3080,103.8535,1600',view:'li'});const {page,browser}=app;
await page.evaluate(()=>{const css=document.createElement('style');css.textContent='body *{visibility:hidden!important}canvas{visibility:visible!important}';document.head.appendChild(css);__t.ev("HOOKS.prerender.push(()=>{if(window.__bvShot){camera.position.fromArray(__bvShot.position);camera.quaternion.fromArray(__bvShot.quaternion);camera.updateMatrixWorld(true);}});");});
for(const c of CAMS)for(const tod of tods){
 const b64=await page.evaluate(async({c,W,H,tod})=>{const t=__t,q=t.sgXY(c.lat,c.lng),y=t.hC(...q)+c.eye,h=c.heading*Math.PI/180,p=c.pitch*Math.PI/180;
  t.setTod(tod);t.camera.position.set(q[0],y,-q[1]);t.camera.up.set(0,1,0);const L=[q[0]+Math.sin(h)*Math.cos(p)*100,y+Math.sin(p)*100,-q[1]-Math.cos(h)*Math.cos(p)*100];t.camera.lookAt(...L);
  t.camera.fov=2*Math.atan(Math.tan(c.fov*Math.PI/360)/(W/H))*180/Math.PI;t.camera.aspect=W/H;t.camera.near=.3;t.camera.far=130000;t.camera.updateProjectionMatrix();t.camera.updateMatrixWorld(true);
  window.__bvShot={position:t.camera.position.toArray(),quaternion:t.camera.quaternion.toArray()};t.renderer.setPixelRatio(1);t.renderer.setSize(W,H,false);t.controls.target.set(...L);
  for(let i=0;i<4;i++){t.ev("runHooks('frame',2,0);runHooks('prerender',2,0)");t.renderer.setRenderTarget(null);t.renderer.setScissorTest(false);t.renderer.setViewport(0,0,W,H);t.renderer.render(t.scene,t.camera);await new Promise(r=>setTimeout(r,250));}
  return t.renderer.domElement.toDataURL('image/jpeg',.92).split(',')[1];},{c,W,H,tod});
 const f=path.join(out,`li_${c.name}_${tod>=19||tod<6?'night':'day'}.jpg`);fs.writeFileSync(f,Buffer.from(b64,'base64'));console.log(f);
}
await browser.close();
console.log(JSON.stringify({pageErrors:app.errors.length,consoleErrors:app.consoleErrors.length}));
