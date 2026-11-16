/* Local reference cameras only. Never fetch Google services or mesh data. */
import fs from 'node:fs';import{createHash}from'node:crypto';import{createRequire}from'node:module';const require=createRequire(import.meta.url),{openApp}=require('../src/lm20/kit/appshot.js');
const out='/workspace/eo_codex_out/bv_batch3/'+(process.argv[2]||'round1');fs.mkdirSync(out,{recursive:true});
const sourceHashes={};for(const p of ['src/sgbv/core.js','src/sgbv/footprints.json','src/sgbv/elementum/elementum.js','src/sgbv/holland_piazza/holland_piazza.js','site/t_bv.html'])sourceHashes[p]=createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const app=await openApp({near:'1.3109,103.7940,2500'}),{page,browser}=app;let shots=[];
try{
 await page.evaluate(()=>{const s=document.createElement('style');s.textContent='body *{visibility:hidden!important}canvas{visibility:visible!important}';document.head.appendChild(s);});
 for(const slug of ['holland_piazza','elementum']){if(process.env.BV_NEW_ONLY&&process.env.BV_NEW_ONLY!==slug)continue;
  const meta=JSON.parse(fs.readFileSync('/workspace/bv_refs/'+slug+'/meta.json'));
  await page.evaluate(slug=>{const t=__t;t.ev(`{const L=landmarks.find(l=>l.type==='sgbv_${slug}'),placed=lmMeshes.get(L.id),saved=lmMat;let raw;try{lmMat=()=>new THREE.MeshLambertMaterial({vertexColors:true});raw=LANDMARKS[L.type].build();}finally{lmMat=saved;}raw.position.copy(placed.position);raw.rotation.copy(placed.rotation);window.__newRaw=raw;}`);
   const scene=new THREE.Scene();scene.background=new THREE.Color(0);const white=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});__newRaw.traverse(o=>{if(o.isMesh)o.material=white;});scene.add(__newRaw);window.__newMask=scene;
  },slug);
  for(const [view,shot]of Object.entries(meta.shots)){if(process.env.BV_PHOTOS_ONLY==='1')continue;if(process.env.BV_QUICK==='1'&&!['n','e','s','w','top','street'].includes(view))continue;
   const data=await page.evaluate(({meta,shot,view,slug})=>{
    const t=__t,q=t.sgXY(shot.lat,shot.lon),a=t.sgXY(meta.centroid.lat,meta.centroid.lon),y=t.hC(...a)+shot.alt-meta.height.ground_ellipsoidal_m,h=shot.heading*Math.PI/180,p=shot.pitch*Math.PI/180,d=new THREE.Vector3(Math.sin(h)*Math.cos(p),Math.sin(p),-Math.cos(h)*Math.cos(p));
    t.camera.position.set(q[0],y,-q[1]);t.camera.up.set(-Math.sin(h)*Math.sin(p),Math.cos(p),Math.cos(h)*Math.sin(p));t.camera.lookAt(t.camera.position.clone().add(d));t.controls.target.copy(t.camera.position).addScaledVector(d,100);t.camera.fov=2*Math.atan(Math.tan((shot.hfov||60)*Math.PI/360)/1.6)*180/Math.PI;t.camera.aspect=1.6;t.camera.near=.3;t.camera.far=130000;t.camera.updateProjectionMatrix();t.camera.updateMatrixWorld(true);t.renderer.setPixelRatio(1);t.renderer.setSize(1600,1000,false);
    const images={};for(const [mode,tod]of [['day',13],['night',20.5]]){t.setTod(tod);t.ev("runHooks('frame',2,0);runHooks('prerender',2,0)");t.renderer.render(t.scene,t.camera);images[mode]=t.renderer.domElement.toDataURL('image/jpeg',.93).split(',')[1];}
    t.renderer.render(__newMask,t.camera);images.mask=t.renderer.domElement.toDataURL('image/png').split(',')[1];return images;
   },{meta,shot,view,slug});
   for(const [k,bytes]of Object.entries(data))fs.writeFileSync(out+'/'+slug+'_'+view+'_'+k+(k==='mask'?'.png':'.jpg'),Buffer.from(bytes,'base64'));shots.push({slug,view,shot});console.log(slug,view);
  }
 }
 // Approximate photographic views, explicitly not surveyed cameras.
 const photoViews=[
 {name:'elementum_front',slug:'elementum',x:135,y:2,z:60,tx:-8,ty:29,tz:5,fov:48},
 {name:'elementum_setbacks',slug:'elementum',x:40,y:3,z:112,tx:-15,ty:30,tz:4,fov:50},
 {name:'elementum_garden',slug:'elementum',x:-10,y:19.5,z:28,tx:-30,ty:24,tz:5,fov:57},
 {name:'elementum_atrium',slug:'elementum',x:-11,y:2,z:29,tx:-13,ty:8,tz:-5,fov:65},
 {name:'elementum_hero',slug:'elementum',x:165,y:91,z:155,tx:-8,ty:26,tz:7,fov:40},
 {name:'piazza_photo61',slug:'holland_piazza',x:-42,y:2,z:33,tx:0,ty:5,tz:6,fov:52}];
 for(const v of photoViews){if(process.env.BV_NEW_ONLY&&process.env.BV_NEW_ONLY!==v.slug)continue;if(process.env.BV_PHOTO_FILTER&&v.name!==process.env.BV_PHOTO_FILTER)continue;for(const [mode,tod]of [['day',13],['night',20.5]]){const bytes=await page.evaluate(({v,tod})=>{const t=__t,comparison=!v.name.includes('hero');const context=()=>{t.ev(`city.visible=${!comparison};if(cars)cars.visible=${!comparison};`);t.SGR.group.visible=!comparison;for(const T of t.SGR.tiles.values())if(T.bld?.group)T.bld.group.visible=!comparison;t.scene.traverse(o=>{if(o.name==='traffic')o.visible=!comparison;});for(const L of t.landmarks){const g=t.ev('lmMeshes').get(L.id);if(g)g.visible=!comparison||L.type==='sgbv_'+v.slug||L.type===(v.slug==='elementum'?'sgbv_metropolis':'sgbv_holland_road_sc');}};context();const D=t.ev('SGBV.data')[v.slug],q=t.sgXY(D.lat,D.lon),y=t.hC(...q);t.setTod(tod);t.camera.up.set(0,1,0);t.camera.position.set(q[0]+v.x,y+v.y,-q[1]+v.z);t.controls.target.set(q[0]+v.tx,y+v.ty,-q[1]+v.tz);t.camera.fov=v.fov;t.camera.near=.3;t.camera.far=130000;t.camera.updateProjectionMatrix();t.renderer.setPixelRatio(1);t.renderer.setSize(1600,1000,false);t.controls.update();t.ev("runHooks('frame',2,0);runHooks('prerender',2,0)");context();t.renderer.render(t.scene,t.camera);const beauty=t.renderer.domElement.toDataURL('image/jpeg',.93).split(',')[1];let mask=null;if(v.slug==='elementum'){t.renderer.render(__newMask,t.camera);mask=t.renderer.domElement.toDataURL('image/png').split(',')[1];}return{beauty,mask};},{v,tod});fs.writeFileSync(out+'/'+v.name+'_'+mode+'.jpg',Buffer.from(bytes.beauty,'base64'));if(bytes.mask)fs.writeFileSync(out+'/'+v.name+'_'+mode+'_mask.png',Buffer.from(bytes.mask,'base64'));}}
 const report=await page.evaluate(()=>({models:BuonaVista.stats,programs:__t.renderer.info.programs.map(p=>({runnable:p.diagnostics?.runnable??true}))}));fs.writeFileSync(out+'/verification.json',JSON.stringify({...report,sourceHashes,shots,photoViews:photoViews.filter(v=>(!process.env.BV_NEW_ONLY||v.slug===process.env.BV_NEW_ONLY)&&(!process.env.BV_PHOTO_FILTER||v.name===process.env.BV_PHOTO_FILTER)),pageErrors:app.errors,consoleErrors:app.consoleErrors},null,2));if(app.errors.length||app.consoleErrors.length||report.programs.some(x=>!x.runnable))throw Error('App errors');
}finally{await browser.close();}
