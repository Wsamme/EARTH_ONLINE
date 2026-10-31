/* Compare every oriented triangle to v3, independent of material batching. */
const fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process'),crypto=require('node:crypto');
const THREE=require(process.env.THREE_JS||'/tmp/bv/vendor/package/build/three.min.js');
function model(source){const ctx=vm.createContext({THREE,LANDMARKS:{},SG_PLACES:[],lmMat:()=>new THREE.MeshLambertMaterial(),console});vm.runInContext(fs.readFileSync('src/sgbv/core.js','utf8').replace('/* BV_FOOTPRINTS */',fs.readFileSync('src/sgbv/footprints.json','utf8')),ctx);vm.runInContext(source,ctx);const g=ctx.LANDMARKS.sgbv_star_vista.build(),tri=[];let lighting=0;g.updateMatrixWorld(true);g.traverse(m=>{if(!m.isMesh)return;let lamp=false;for(let o=m;o;o=o.parent)if(o.userData.svLighting)lamp=true;if(lamp){lighting+=m.geometry.attributes.position.count/3;return;}const p=m.geometry.attributes.position;for(let i=0;i<p.count;i+=3){let a=[];for(let j=0;j<3;j++)a.push(new THREE.Vector3().fromBufferAttribute(p,i+j).applyMatrix4(m.matrixWorld).toArray());tri.push(JSON.stringify(a));}});tri.sort();return {triangles:tri.length,lightingTriangles:lighting,totalTriangles:tri.length+lighting,sha256:crypto.createHash('sha256').update(tri.join('\n')).digest('hex')};}
const original=cp.execFileSync('git',['show','9e9e32a:src/sgbv/star_vista/star_vista.js'],{encoding:'utf8'});
// Only the two open-arc calls may change the v3 architectural triangles.
const current=fs.readFileSync('src/sgbv/star_vista/star_vista.js','utf8');
let fixed=original;for(const name of ['facade','rim']){const re=new RegExp('b\\.'+name+'\\(rimOuter[^;]+;');const call=current.match(re)?.[0];if(!call)throw Error('Cannot locate open-arc call');fixed=fixed.replace(re,call);}
const before=model(original),permitted=model(fixed),after=model(fs.readFileSync('src/sgbv/star_vista/star_vista.js','utf8'));
if(permitted.sha256!==after.sha256||before.triangles-after.triangles!==264)throw Error('Unexpected v3 geometry change beyond the 264 closing-chord triangles');
console.log(JSON.stringify({before,permitted,after,onlyOpenArcDeletion:true},null,2));
