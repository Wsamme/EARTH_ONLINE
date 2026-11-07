// Offline silhouette preview of our original geometry, never reference meshes.
// Final verification uses the prescribed je_compare.mjs in the full app.
import fs from 'node:fs';import vm from 'node:vm';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),THREE=require('/tmp/earth-online-vendor/package/build/three.min.js');
const data=JSON.parse(fs.readFileSync('src/sgje/footprints.json')),ctx={THREE,LANDMARKS:{},SG_PLACES:[],lmMat:()=>({userData:{}})};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/sgbv/core.js','utf8').replace('/* BV_FOOTPRINTS */',JSON.stringify(data)),ctx);
vm.runInContext('const SGJE=SGBV;',ctx);vm.runInContext(fs.readFileSync(process.argv[3]||'src/sgje/ng_teng_fong/ng_teng_fong.js','utf8'),ctx);
const out=process.argv[2];fs.mkdirSync(out,{recursive:true});
vm.runInContext("var model=LANDMARKS.sgbv_ng_teng_fong.build();var vertices=[];model.traverse(m=>{if(m.isMesh)vertices=vertices.concat(Array.from(m.geometry.attributes.position.array))});",ctx);
const bounds=[[Infinity,Infinity,Infinity],[-Infinity,-Infinity,-Infinity]];
for(let i=0;i<ctx.vertices.length;i++){const v=ctx.vertices[i];if(!Number.isFinite(v))throw new Error('Non-finite vertex');const k=i%3;bounds[0][k]=Math.min(bounds[0][k],v);bounds[1][k]=Math.max(bounds[1][k],v);}
const report={triangles:ctx.vertices.length/9,batches:ctx.model.children.length,bounds,positions:ctx.vertices};
fs.writeFileSync(out+'/geometry.json',JSON.stringify(report));console.log(JSON.stringify({out,triangles:report.triangles,batches:report.batches,bounds}));
