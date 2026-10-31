/* Full-app r128 lighting review. Browser lock: bash src/lm33/kit/browser.sh
 * node tools/sv_night_render.mjs. SV_LIVE=1 accepts commands in
 * /tmp/sv_night_command.json: {round,frames:false} or {stop:true}.
 * Comparison cameras hide generic streamed context, traffic and synthetic city. The other
 * eight landmarks, terrain and all Star Vista surfaces remain. Full context is
 * restored for heroes, animation and day checks.
 */
import fs from 'node:fs';import{createRequire}from'node:module';import{createHash}from'node:crypto';
const require=createRequire(import.meta.url),{openApp}=require('../src/lm20/kit/appshot.js');
const out='/workspace/eo_codex_out',dir=out+'/sv_night';fs.mkdirSync(dir,{recursive:true});
const initialViews=[
 {name:'sw',dx:-155,dy:4,dz:95,targetY:34,fov:46,tod:19.6,comparison:true},
 {name:'front',dx:-35,dy:3,dz:85,targetY:39,fov:85,comparison:true},
 {name:'east',dx:90,dy:3,dz:25,targetY:40,fov:85,comparison:true},
 {name:'plaza',dx:22,dy:.3,dz:13,tx:52,tz:15,targetY:2.4,fov:60,comparison:true},
 {name:'hero',dx:160,dy:100,dz:185,targetY:34,fov:42}
];
const app=await openApp({page:process.env.SV_URL_SHOW===undefined?'t_bv.html':'t_bv.html?show='+process.env.SV_URL_SHOW,near:'1.30687671,103.78846253,1700'}),{page,browser}=app;
try{
 const initialMode=await page.evaluate(()=>{const L=__t.landmarks.find(l=>l.type==='sgbv_star_vista');return [...L.mats.values()].find(m=>m.userData.svShow).userData.svShow.value;});
 if(initialMode!==Number(process.env.SV_URL_SHOW||0))throw Error('URL show override mismatch');
 await page.evaluate(()=>{const css=document.createElement('style');css.textContent='body *{visibility:hidden!important}canvas{visibility:visible!important}';document.head.appendChild(css);});
 async function round(cmd){
  const source=fs.readFileSync('src/sgbv/star_vista/star_vista.js','utf8');
  if(process.env.SV_LIVE)await page.evaluate(source=>{const t=__t;t.ev(source);t.ev("{const L=landmarks.find(l=>l.type==='sgbv_star_vista'),g=lmMeshes.get(L.id);lmGroup.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();});for(const m of L.mats.values())m.dispose();lmMeshes.delete(L.id);placeLandmarkMesh(L);window.__svModel=lmMeshes.get(L.id);}");},source);
  else await page.evaluate(()=>{__t.ev("window.__svModel=lmMeshes.get(landmarks.find(l=>l.type==='sgbv_star_vista').id);");});
  if(cmd.setup)await page.evaluate(code=>__t.ev(code),cmd.setup);
  const views=cmd.views||initialViews,roundDir=dir+'/'+cmd.round;fs.mkdirSync(roundDir,{recursive:true});
  async function render(v,time,show,tod=v.tod??20.5){return await page.evaluate(({v,time,show,tod})=>{
   const t=__t,q=t.sgXY(1.30687671,103.78846253),y=t.hC(...q);
   __svModel.traverse(o=>{if(o.isMesh&&o.material.userData.svShow)o.material.userData.svShow.value=show;});
   t.setTod(tod);t.camera.up.set(0,1,0);t.controls.target.set(q[0]+(v.tx||0),y+v.targetY,-q[1]+(v.tz||0));t.camera.position.set(q[0]+v.dx,y+v.dy,-q[1]+v.dz);t.camera.fov=v.fov;t.camera.aspect=1.6;t.camera.near=.08;t.camera.updateProjectionMatrix();t.controls.update();t.renderer.setPixelRatio(1);t.renderer.setSize(1600,1000,false);
   t.ev(`runHooks('frame',${time},0);runHooks('prerender',${time},0);city.visible=${!v.comparison};if(cars)cars.visible=${!v.comparison};`);
   t.SGR.group.visible=!v.comparison;t.scene.traverse(o=>{if(o.name==='traffic')o.visible=!v.comparison;});
   for(const T of t.SGR.tiles.values())if(T.bld?.group)T.bld.group.visible=!v.comparison;
   t.renderer.render(t.scene,t.camera);return t.renderer.domElement.toDataURL('image/jpeg',.95).split(',')[1];
  },{v,time,show,tod});}
  for(const show of [0,1]){
   for(const v of views){const data=Buffer.from(await render(v,show?4:0,show),'base64');fs.writeFileSync(`${roundDir}/${v.name}_${show}.jpg`,data);fs.writeFileSync(`${dir}/${v.name}_${show}.jpg`,data);}
   if(cmd.frames!==false){for(let i=0;i<=8;i++)fs.writeFileSync(`${dir}/cycle_${show}_${i}.jpg`,Buffer.from(await render(views.find(v=>v.name==='hero'),i*(show?1:2.5),show),'base64'));
    fs.writeFileSync(`${dir}/day_${show}.jpg`,Buffer.from(await render(views.find(v=>v.name==='hero'),4,show,13),'base64'));}
  }
  const details=await page.evaluate(()=>{
   const t=__t,q=t.sgXY(1.30687671,103.78846253),y=t.hC(...q);t.scene.updateMatrixWorld(true);
   const r=new THREE.Raycaster(new THREE.Vector3(q[0]+32,y+90,-q[1]+8),new THREE.Vector3(0,-1,0));
   const meshes=[];t.scene.traverse(o=>{if(o.isMesh&&o.geometry?.attributes.position?.array)meshes.push(o);});const hits=r.intersectObjects(meshes,false).filter(h=>h.object.isMesh).slice(0,24).map(h=>({y:h.point.y-y,name:h.object.name,material:h.object.material.type,star:!!(h.object.parent===__svModel),color:h.object.material.color?.getHexString()}));
   const roots=t.scene.children.map(o=>({type:o.type,name:o.name,children:o.children.length,visible:o.visible}));return {roots,stats:BuonaVista.stats,programs:t.renderer.info.programs.map(p=>({name:p.name,runnable:p.diagnostics?.runnable??true})),poolVerticalHits:hits};
  });
  const initialTerrainCut=await page.evaluate(()=>__t.ev('!!terrain.material.userData.svCourtCut'));
  if(!initialTerrainCut)throw Error('Recessed court terrain mask missing');
  const report={initialTerrainCut,initialUrlShow:initialMode,round:cmd.round,source_sha256:createHash('sha256').update(source).digest('hex'),views,pageErrors:app.errors,consoleErrors:app.consoleErrors,...details};
  fs.writeFileSync(roundDir+'/verification.json',JSON.stringify(report,null,2));fs.writeFileSync(dir+'/verification.json',JSON.stringify(report,null,2));
  if(app.errors.length||app.consoleErrors.length||details.programs.some(p=>!p.runnable))throw Error('App/shader errors');
  fs.copyFileSync(dir+'/hero_0.jpg',out+'/star_vista_night_hero.jpg');fs.copyFileSync(dir+'/hero_1.jpg',out+'/star_vista_show_night.jpg');console.log('ROUND COMPLETE',cmd.round);
 }
 if(process.env.SV_LIVE){let last='';while(true){const s=fs.existsSync('/tmp/sv_night_command.json')?fs.readFileSync('/tmp/sv_night_command.json','utf8'):'';if(s&&s!==last){last=s;const cmd=JSON.parse(s);if(cmd.stop)break;await round(cmd);}await new Promise(r=>setTimeout(r,500));}}
 else await round({round:process.env.SV_ROUND||'final',frames:!process.env.SV_QUICK});
}finally{await browser.close();}
