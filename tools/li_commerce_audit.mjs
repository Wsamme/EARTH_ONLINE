/* Local geometry-only check; no reference images or network services. */
import fs from 'node:fs';import vm from 'node:vm';import{createRequire}from'node:module';
const require=createRequire(import.meta.url),THREE=require('/tmp/earth-online-vendor/package/build/three.min.js');
const D=JSON.parse(fs.readFileSync('src/sgli/footprints.json')),ctx={THREE,LANDMARKS:{},SG_PLACES:[],lmMat:()=>new THREE.MeshBasicMaterial(),console,hC:(x,z)=>Math.sin(x/150)*2+Math.cos(z/170),sgXY:()=>[0,0]};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/sgbv/core.js','utf8').replace('/* BV_FOOTPRINTS */','{}')+fs.readFileSync('src/sgli/core.js','utf8').replace('/* LI_FOOTPRINTS */',JSON.stringify(D)),ctx);
for(const slug of (process.argv[2]||'li_shophouses').split(',')){
 vm.runInContext(fs.readFileSync(`src/sgli/${slug}/${slug}.js`,'utf8'),ctx);
 const g=ctx.LANDMARKS['sgli_'+slug].build(),box=new THREE.Box3().setFromObject(g);let invalid=0;g.traverse(o=>{if(o.isMesh)for(const v of o.geometry.attributes.position.array)if(!Number.isFinite(v))invalid++;});
 const report={slug,triangles:g.userData.bvTriangles,batches:g.children.length,invalid,bounds:[box.min.toArray(),box.max.toArray()],rows:g.userData.liRows};console.log(JSON.stringify(report));
 if(invalid||(slug==='li_shophouses'&&report.triangles>250000))process.exitCode=1;
}
