/* Exact local-reference cameras, full-app beauty and isolated architecture masks.
 * bash src/lm33/kit/browser.sh node tools/bv_refine_render.mjs before|after
 * No Google service calls. Photos/outputs remain outside git.
 */
import fs from 'node:fs';import path from 'node:path';import{createRequire}from'node:module';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';
import{audit}from'./bv_bugbot_runtime.mjs';
const require=createRequire(import.meta.url),{openApp}=require('../src/lm20/kit/appshot.js');
const stage=process.argv[2]||'after',base='/workspace/eo_codex_out/bv_batch1',out=base+'/'+stage;fs.mkdirSync(out,{recursive:true});
const data=JSON.parse(fs.readFileSync('src/sgbv/footprints.json')),slugs=process.env.BV_ONLY?.split(',')||Object.keys(data),fallback={};
if(fs.existsSync('/tmp/bv/cams.jsonl'))for(const s of fs.readFileSync('/tmp/bv/cams.jsonl','utf8').trim().split('\n')){const q=JSON.parse(s),p=q.out.split('/');fallback[p.at(-2)+'/'+path.basename(p.at(-1),'.jpg')]=q.cam;}
const sourceHashes={};for(const f of ['core',...slugs]){const p=f==='core'?'src/sgbv/core.js':`src/sgbv/${f}/${f}.js`;sourceHashes[f]=createHash('sha256').update(fs.readFileSync(p)).digest('hex');}
const generatedPageHash=createHash('sha256').update(fs.readFileSync('site/t_bv.html')).digest('hex');
const oldCore=execFileSync('git',['show','a69f9f2:src/sgbv/core.js'],{encoding:'utf8'}).replace('/* BV_FOOTPRINTS */',JSON.stringify(data));
const maskOnly=process.env.BV_MASK_ONLY==='1',annotations=JSON.parse(fs.readFileSync('tools/bv_refine_annotations.json')).views;
const oldModels=Object.fromEntries(slugs.map(slug=>[slug,execFileSync('git',['show',`a69f9f2:src/sgbv/${slug}/${slug}.js`],{encoding:'utf8'})]));
const app=await openApp({near:'1.3013,103.7900,2500'}),{page,browser}=app,poses=[];
try{
 await page.evaluate(()=>{const css=document.createElement('style');css.textContent='body *{visibility:hidden!important}canvas{visibility:visible!important}';document.head.appendChild(css);});
 for(const slug of slugs){
  const meta=JSON.parse(fs.readFileSync('/workspace/bv_refs/'+slug+'/meta.json'));
  for(const baseline of [false,true])await page.evaluate(({slug,baseline,oldSource})=>{const t=__t;t.ev(`{const L=landmarks.find(l=>l.type==='sgbv_${slug}'),placed=lmMeshes.get(L.id),saved=lmMat;let raw;try{lmMat=()=>new THREE.MeshLambertMaterial({vertexColors:true});raw=${baseline?oldSource:'LANDMARKS[L.type].build()'};}finally{lmMat=saved;}raw.position.copy(placed.position);raw.rotation.copy(placed.rotation);window.__bvRaw=raw;}`);
   const raw=window.__bvRaw;raw.updateMatrixWorld(true);const scene=new THREE.Scene();scene.background=new THREE.Color(0);const white=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}),v=new THREE.Vector3();
   const D=__t.ev(`SGBV.data.${slug}`),q=t.sgXY(D.lat,D.lon),ground=t.hC(...q);
   raw.traverse(m=>{if(!m.isMesh)return;for(let o=m;o;o=o.parent)if(o.userData.svLighting||o.userData.svContext)return;const p=m.geometry.attributes.position,c=m.geometry.attributes.color,keep=[];
    for(let i=0;i<p.count;i+=3){if(c){const r=c.getX(i),g=c.getY(i),b=c.getZ(i);if((g>r*1.12&&g>b*1.12&&g<.6)||(Math.abs(r-104/255)<.001&&Math.abs(g-95/255)<.001&&Math.abs(b-75/255)<.001))continue;}const tri=[];for(let k=0;k<3;k++)tri.push(v.fromBufferAttribute(p,i+k).applyMatrix4(m.matrixWorld).toArray());if(Math.max(...tri.map(p=>p[1]))<ground+3)continue;for(const a of tri)keep.push(...a);}
    if(keep.length){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(keep,3));scene.add(new THREE.Mesh(geo,white));}
   });window.__bvMasks=window.__bvMasks||{};window.__bvMasks[baseline?'before':'after']=scene;raw.traverse(m=>{m.geometry?.dispose();});
  },{slug,baseline,oldSource:`(()=>{const LANDMARKS={},SG_PLACES=[],HOOKS={frame:[],net:[]};${oldCore}\n${oldModels[slug]}\nreturn LANDMARKS['sgbv_${slug}'].build();})()`});
  for(const view of ['n','e','s','w','top','street']){
   if(maskOnly&&!annotations.some(a=>a.slug===slug&&a.view===view))continue;
   const shot=meta.shots[view]||fallback[slug+'/'+view];if(!shot){console.log('NO CAMERA',slug,view);continue;}
   const result=await page.evaluate(({shot,meta})=>{const t=__t,q=t.sgXY(shot.lat,shot.lon),a=t.sgXY(meta.centroid.lat,meta.centroid.lon),y=t.hC(...a)+shot.alt-meta.height.ground_ellipsoidal_m,h=shot.heading*Math.PI/180,p=shot.pitch*Math.PI/180;
    t.setTod(13);t.camera.position.set(q[0],y,-q[1]);t.camera.up.set(-Math.sin(h)*Math.sin(p),Math.cos(p),Math.cos(h)*Math.sin(p));const d=new THREE.Vector3(Math.sin(h)*Math.cos(p),Math.sin(p),-Math.cos(h)*Math.cos(p));t.camera.lookAt(t.camera.position.clone().add(d));t.controls.target.copy(t.camera.position).addScaledVector(d,100);t.camera.fov=2*Math.atan(Math.tan((shot.hfov||60)*Math.PI/360)/1.6)*180/Math.PI;t.camera.aspect=1.6;t.camera.near=.3;t.camera.far=130000;t.camera.updateProjectionMatrix();t.camera.updateMatrixWorld(true);t.renderer.setPixelRatio(1);t.renderer.setSize(1600,1000,false);t.ev("runHooks('frame',1,0);runHooks('prerender',1,0)");
    t.renderer.render(t.scene,t.camera);const beauty=t.renderer.domElement.toDataURL('image/jpeg',.93).split(',')[1];t.renderer.render(__bvMasks.after,t.camera);const mask=t.renderer.domElement.toDataURL('image/png').split(',')[1];t.renderer.render(__bvMasks.before,t.camera);const beforeMask=t.renderer.domElement.toDataURL('image/png').split(',')[1];return{beauty,mask,beforeMask,position:t.camera.position.toArray(),direction:t.camera.getWorldDirection(new THREE.Vector3()).toArray(),fov:t.camera.fov};
   },{shot,meta});
   if(!maskOnly)fs.writeFileSync(`${out}/${slug}_${view}.jpg`,Buffer.from(result.beauty,'base64'));fs.writeFileSync(`${out}/${slug}_${view}_mask.png`,Buffer.from(result.mask,'base64'));fs.writeFileSync(`${base}/before/${slug}_${view}_mask.png`,Buffer.from(result.beforeMask,'base64'));delete result.beforeMask;delete result.beauty;delete result.mask;poses.push({slug,view,shot,...result});console.log(stage,slug,view);
  }
  await page.evaluate(()=>{Object.values(__bvMasks).forEach(g=>g.traverse(o=>{o.geometry?.dispose();}));__bvMasks={};});
 }
 if(maskOnly){fs.writeFileSync(out+'/mask_provenance.json',JSON.stringify({sourceHashes,generatedPageHash,poses,filter:'exact bark colour, green foliage, geometry below 3m; same filter both versions'},null,2));} else {
 let bugbot=null;if(stage==='after')bugbot=await audit(page,out);
 // Night checks reuse existing anchor framing; no synthetic texture assets.
 for(const slug of slugs){const data=await page.evaluate(slug=>{const t=__t,D=t.ev('SGBV.data')[slug],q=t.sgXY(D.lat,D.lon),y=t.hC(...q),r=t.LANDMARKS['sgbv_'+slug].r;t.setTod(20.5);t.camera.up.set(0,1,0);t.controls.target.set(q[0],y+D.height*.42,-q[1]);t.camera.position.set(q[0]+r*1.9,y+D.height*.9,-q[1]+r*2);t.camera.fov=42;t.camera.updateProjectionMatrix();t.controls.update();t.ev("runHooks('frame',3,0);runHooks('prerender',3,0)");t.renderer.render(t.scene,t.camera);return t.renderer.domElement.toDataURL('image/jpeg',.93).split(',')[1];},slug);fs.writeFileSync(out+'/'+slug+'_night.jpg',Buffer.from(data,'base64'));}
 const report=await page.evaluate(()=>({models:BuonaVista.stats,programs:__t.renderer.info.programs.map(p=>({runnable:p.diagnostics?.runnable??true})),coreMaterialCount:__t.renderer.info.programs.length}));
 report.bugbot=bugbot;report.sourceHashes=sourceHashes;report.generatedPageHash=generatedPageHash;
 fs.writeFileSync(out+'/verification.json',JSON.stringify({...report,poses,pageErrors:app.errors,consoleErrors:app.consoleErrors},null,2));
 if(app.errors.length||app.consoleErrors.length||report.programs.some(p=>!p.runnable))throw Error('Page/console/shader errors');
}
}finally{await browser.close();}
