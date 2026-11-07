/* Local reference cameras only. Never fetch Google services or mesh data. */
import fs from 'node:fs';import{createHash}from'node:crypto';import{createRequire}from'node:module';const require=createRequire(import.meta.url),{openApp}=require('../src/lm20/kit/appshot.js');
const out='/workspace/eo_codex_out/bv_batch4/'+(process.argv[2]||'round1');fs.mkdirSync(out,{recursive:true});
const sourceHashes={};for(const p of ['src/sgbv/core.js','src/sgbv/footprints.json','src/sgbv/nucleos/nucleos.js','src/sgbv/fusionopolis_two/fusionopolis_two.js','site/t_bv.html'])sourceHashes[p]=createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const app=await openApp({url:'http://127.0.0.1:8048/',near:'1.3109,103.7940,2500'}),{page,browser}=app;let shots=[];
try{
 await page.evaluate(()=>{const s=document.createElement('style');s.textContent='body *{visibility:hidden!important}canvas{visibility:visible!important}';document.head.appendChild(s);});
 for(const slug of ['nucleos','fusionopolis_two']){if(process.env.BV_NEW_ONLY&&process.env.BV_NEW_ONLY!==slug)continue;
  const meta=JSON.parse(fs.readFileSync('/workspace/bv_refs/'+slug+'/meta.json'));
  await page.evaluate(slug=>{const t=__t;t.ev(`{const L=landmarks.find(l=>l.type==='sgbv_${slug}'),placed=lmMeshes.get(L.id),saved=lmMat;let raw;try{lmMat=()=>new THREE.MeshLambertMaterial({vertexColors:true});raw=LANDMARKS[L.type].build();}finally{lmMat=saved;}raw.position.copy(placed.position);raw.rotation.copy(placed.rotation);window.__newRaw=raw;}`);
   const scene=new THREE.Scene();scene.background=new THREE.Color(0);const white=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});__newRaw.traverse(o=>{if(o.isMesh)o.material=white;});scene.add(__newRaw);window.__newMask=scene;
  },slug);
  for(const [view,shot]of Object.entries(meta.shots)){if(!shot.request)continue;if(process.env.BV_QUICK==='1'&&!['n','e','s','w','top','street'].includes(view))continue;
   const data=await page.evaluate(({meta,shot,view,slug})=>{
    const t=__t,q=t.sgXY(shot.lat,shot.lon),a=t.sgXY(meta.centroid.lat,meta.centroid.lon),y=t.hC(...a)+shot.alt-meta.height.ground_ellipsoidal_m,h=shot.heading*Math.PI/180,p=shot.pitch*Math.PI/180,d=new THREE.Vector3(Math.sin(h)*Math.cos(p),Math.sin(p),-Math.cos(h)*Math.cos(p));
    t.camera.position.set(q[0],y,-q[1]);t.camera.up.set(-Math.sin(h)*Math.sin(p),Math.cos(p),Math.cos(h)*Math.sin(p));t.camera.lookAt(t.camera.position.clone().add(d));t.controls.target.copy(t.camera.position).addScaledVector(d,100);t.camera.fov=2*Math.atan(Math.tan((shot.hfov||60)*Math.PI/360)/1.6)*180/Math.PI;t.camera.aspect=1.6;t.camera.near=.3;t.camera.far=130000;t.camera.updateProjectionMatrix();t.camera.updateMatrixWorld(true);t.renderer.setPixelRatio(1);t.renderer.setSize(1600,1000,false);
    const images={};for(const [mode,tod]of [['day',13],['night',20.5]]){t.setTod(tod);t.ev("runHooks('frame',2,0);runHooks('prerender',2,0)");t.renderer.render(t.scene,t.camera);images[mode]=t.renderer.domElement.toDataURL('image/jpeg',.93).split(',')[1];}
    t.renderer.render(__newMask,t.camera);images.mask=t.renderer.domElement.toDataURL('image/png').split(',')[1];return images;
   },{meta,shot,view,slug});
   for(const [k,bytes]of Object.entries(data))fs.writeFileSync(out+'/'+slug+'_'+view+'_'+k+(k==='mask'?'.png':'.jpg'),Buffer.from(bytes,'base64'));shots.push({slug,view,shot});console.log(slug,view);
  }
 }
 const report=await page.evaluate(()=>({models:BuonaVista.stats,programs:__t.renderer.info.programs.map(p=>({runnable:p.diagnostics?.runnable??true}))}));fs.writeFileSync(out+'/verification.json',JSON.stringify({...report,sourceHashes,shots,pageErrors:app.errors,consoleErrors:app.consoleErrors},null,2));if(app.errors.length||app.consoleErrors.length||report.programs.some(x=>!x.runnable))throw Error('App errors');
}finally{await browser.close();}
