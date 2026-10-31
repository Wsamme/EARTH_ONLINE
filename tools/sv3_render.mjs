/* Star Vista exact-camera full-app render + isolated model silhouettes.
 * bash src/lm33/kit/browser.sh node tools/sv3_render.mjs baseline|round1|final
 * SOURCE=/absolute/model.js can load an earlier module for baseline evaluation.
 */
import fs from 'node:fs';import path from 'node:path';import{createRequire}from'node:module';
const require=createRequire(import.meta.url),{openApp}=require('../src/lm20/kit/appshot.js');
const out=process.env.BV_OUT||'/workspace/eo_codex_out',dir=path.join(out,'sv3'),round=process.argv[2]||'final',dest=path.join(dir,round);fs.mkdirSync(dest,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'))),source=fs.readFileSync(process.env.SOURCE||'src/sgbv/star_vista/star_vista.js','utf8');
const app=await openApp({near:'1.30687671,103.78846253,1700'}),{page,browser}=app;
try{
await page.evaluate(source=>{const t=__t;t.ev(source);t.ev("{const L=landmarks.find(l=>l.type==='sgbv_star_vista'),g=lmMeshes.get(L.id);lmGroup.remove(g);lmMeshes.delete(L.id);placeLandmarkMesh(L);window.__svModel=lmMeshes.get(L.id);}");
 const css=document.createElement('style');css.textContent='body *{visibility:hidden!important}canvas{visibility:visible!important}';document.head.appendChild(css);
 // White mask uses the actual model triangles. Vegetation and external plaza
 // meshes explicitly tagged by the module are excluded, not neighbouring city.
 t.ev("{const saved=lmMat;try{lmMat=()=>new THREE.MeshBasicMaterial();window.__svRaw=LANDMARKS.sgbv_star_vista.build();}finally{lmMat=saved;}__svRaw.position.copy(__svModel.position);__svRaw.rotation.copy(__svModel.rotation);}");
 const mask=new THREE.Group();__svRaw.updateMatrixWorld(true);__svRaw.traverse(m=>{if(!m.isMesh)return;for(let p=m;p;p=p.parent)if(p.userData.svContext)return;const g=m.geometry.clone();const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));mesh.matrixAutoUpdate=false;mesh.matrix.copy(m.matrixWorld);mask.add(mesh);});
 const scene=new THREE.Scene();scene.background=new THREE.Color(0);scene.add(mask);window.__svMask=scene;
},source);
const poses=[];
for(const v of manifest.views){if(process.env.ONLY&&!v.name.match(process.env.ONLY))continue;
 const r=await page.evaluate(({v,manifest})=>{const t=__t,c=v.camera,q=t.sgXY(c.lat,c.lon),a=t.sgXY(...manifest.anchor),y=t.hC(...a)+c.alt-manifest.ground;const h=c.heading*Math.PI/180,p=c.pitch*Math.PI/180;
 t.setTod(13);t.camera.position.set(q[0],y,-q[1]);t.camera.up.set(-Math.sin(h)*Math.sin(p),Math.cos(p),Math.cos(h)*Math.sin(p));const d=new THREE.Vector3(Math.sin(h)*Math.cos(p),Math.sin(p),-Math.cos(h)*Math.cos(p));t.camera.lookAt(t.camera.position.clone().add(d));t.controls.target.copy(t.camera.position).addScaledVector(d,100);t.camera.fov=2*Math.atan(Math.tan((c.hfov||60)*Math.PI/360)/1.6)*180/Math.PI;t.camera.aspect=1.6;t.camera.near=.25;t.camera.far=130000;t.camera.updateProjectionMatrix();t.camera.updateMatrixWorld(true);t.renderer.setPixelRatio(1);t.renderer.setSize(1600,1000,false);t.ev("runHooks('frame',1,0);runHooks('prerender',1,0)");t.renderer.render(t.scene,t.camera);const beauty=t.renderer.domElement.toDataURL('image/jpeg',.94).split(',')[1];t.renderer.render(__svMask,t.camera);const mask=t.renderer.domElement.toDataURL('image/png').split(',')[1];return {beauty,mask,position:t.camera.position.toArray(),direction:t.camera.getWorldDirection(new THREE.Vector3()).toArray()};},{v,manifest});
 fs.writeFileSync(path.join(dest,v.name+'.jpg'),Buffer.from(r.beauty,'base64'));fs.writeFileSync(path.join(dest,v.name+'_mask.png'),Buffer.from(r.mask,'base64'));delete r.beauty;delete r.mask;poses.push({...v,...r});console.log(round,v.name);
}
for(const night of [false,true]){const im=await page.evaluate(night=>{const t=__t,q=t.sgXY(1.30687671,103.78846253),y=t.hC(...q);t.setTod(night?20.5:13);t.camera.up.set(0,1,0);t.controls.target.set(q[0],y+32,-q[1]);t.camera.position.set(q[0]+185,y+122,-q[1]+185);t.camera.fov=42;t.camera.updateProjectionMatrix();t.controls.update();t.camera.near=.25;t.camera.updateProjectionMatrix();t.ev("runHooks('frame',1,0);runHooks('prerender',1,0)");t.renderer.render(t.scene,t.camera);return t.renderer.domElement.toDataURL('image/jpeg',.95).split(',')[1];},night);fs.writeFileSync(path.join(out,`star_vista_v3_hero_${night?'night':'day'}.jpg`),Buffer.from(im,'base64'));}
const stats=await page.evaluate(()=>BuonaVista.stats);fs.writeFileSync(path.join(dest,'verification.json'),JSON.stringify({pageErrors:app.errors,consoleErrors:app.consoleErrors,poses,stats},null,2));if(app.errors.length||app.consoleErrors.length)throw Error('App errors');
}finally{await browser.close();}
