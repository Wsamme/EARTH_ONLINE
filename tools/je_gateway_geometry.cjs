// Offline contract for this worker's four hand-built modules; no image/mesh input.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const THREE=require(process.env.THREE_JS||'/tmp/earth-online-vendor/package/build/three.min.js');
const ctx=vm.createContext({THREE,LANDMARKS:{},SG_PLACES:[],lmMat:()=>new THREE.MeshLambertMaterial(),console});
for(const [kind,marker]of [['sgbv','BV'],['sgje','JE']]){
 const data=fs.readFileSync(path.join(root,`src/${kind}/footprints.json`),'utf8');
 vm.runInContext(fs.readFileSync(path.join(root,`src/${kind}/core.js`),'utf8').replace(`/* ${marker}_FOOTPRINTS */`,data),ctx);
}
const slugs=['vision_exchange','jtc_summit','cpf_jurong','jurong_town_hall'];
for(const slug of slugs)vm.runInContext(fs.readFileSync(path.join(root,`src/sgje/${slug}/${slug}.js`),'utf8'),ctx);
const results=[];
for(const slug of slugs){
 const def=ctx.LANDMARKS['sgje_'+slug];if(!def)throw Error('Missing registration '+slug);
 const g=def.build(),box=new THREE.Box3().setFromObject(g);let triangles=0,degenerate=0;
 g.traverse(m=>{if(!m.isMesh)return;const p=m.geometry.attributes.position.array;
 for(const x of p)if(!Number.isFinite(x))throw Error(slug+' nonfinite geometry');
 triangles+=p.length/9;
 for(let i=0;i<p.length;i+=9){const a=new THREE.Vector3(p[i+3]-p[i],p[i+4]-p[i+1],p[i+5]-p[i+2]),b=new THREE.Vector3(p[i+6]-p[i],p[i+7]-p[i+1],p[i+8]-p[i+2]);if(a.cross(b).lengthSq()<1e-12)degenerate++;}
 });
 if(degenerate)throw Error(slug+' has '+degenerate+' degenerate triangles');
 if(triangles>60000)throw Error(slug+' exceeds 60k budget');
 if(box.min.y < -2 || box.max.y > 200)throw Error(slug+' implausible height');
 if(Math.abs(box.max.y-def.h)>.5)throw Error(slug+' registration height disagrees with geometry');
 const metaPath=path.join(process.env.JE_REFS||'/workspace/je_refs',slug,'meta.json');
 const measured=fs.existsSync(metaPath)?JSON.parse(fs.readFileSync(metaPath)).height:null;
 // Vision's old construction tiles include cranes at144.2m. Compare its
 // completed-building roof to the122.1m roofp90, never to the crane maximum.
 const measuredHeight=measured?(slug==='vision_exchange'?measured.roof_p90_m:measured.value_m):null;
 const heightError=measuredHeight===null?null:Math.abs(box.max.y-measuredHeight);
 if(heightError!==null&&heightError>(slug==='vision_exchange'?2.5:.5))throw Error(slug+' differs from measured roof by '+heightError.toFixed(2)+' m');
 results.push({slug,triangles,degenerate,bounds:{min:box.min.toArray(),max:box.max.toArray()},registeredHeight:def.h,measuredHeight,rawMeasuredMaximum:measured?.value_m??null,heightError});
}
if(ctx.SG_PLACES.length!==4)throw Error('Expected exactly four placements');
const reportArg=process.argv.indexOf('--browser-report');
let browserVerification=null;
if(reportArg>=0){
 const file=process.argv[reportArg+1];if(!file)throw Error('Missing browser report path');
 const report=JSON.parse(fs.readFileSync(file)),dir=path.dirname(file);
 if(report.pageErrors.length||report.consoleErrors.length)throw Error('Browser errors present');
 const views=['n','e','s','w','top','close_ne','close_sw','street'];
 const scores=JSON.parse(fs.readFileSync(path.resolve(dir,'../../je_iou.json')));
 for(const model of results){
  const actual=report.models[model.slug];
  if(views.some(v=>!Number.isFinite(scores[model.slug]?.views[v])||scores[model.slug].views[v]<0||scores[model.slug].views[v]>1))throw Error('Incomplete IoU scores '+model.slug);
  if(!actual||actual.triangles!==model.triangles||Math.abs(actual.height-model.registeredHeight)>.01)throw Error('Browser/geometry stats mismatch '+model.slug);
  for(const view of views)for(const tod of (['s','close_sw'].includes(view)?[13,20.5]:[13])){
   if(!report.views.some(v=>v.slug===model.slug&&v.view===view&&v.tod===tod&&v.landmark_found))throw Error('Missing rendered view '+model.slug+'/'+view+'/'+tod);
   const tag=tod===13?'day':'night',image=path.join(dir,`${model.slug}_${view}_${tag}.jpg`);
   if(!fs.existsSync(image)||fs.statSync(image).size<1000)throw Error('Missing image '+image);
   if(tod===13&&!fs.existsSync(path.join(dir,`${model.slug}_${view}_mask.png`)))throw Error('Missing silhouette '+model.slug+'/'+view);
  }
 }
 if(report.views.length!==40)throw Error('Expected forty final render records');
 browserVerification={report:file,renders:report.views.length,silhouettes:32,scoreSets:4,pageErrors:report.pageErrors,consoleErrors:report.consoleErrors};
}
console.log(JSON.stringify(browserVerification?{models:results,browserVerification}:results,null,2));
