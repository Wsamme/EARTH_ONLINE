// Local finite-geometry and budget check for the Jurong East interchange.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const THREE=require(process.env.THREE_JS||'/tmp/earth-online-vendor/package/build/three.min.js');
const ctx=vm.createContext({THREE,LANDMARKS:{},SG_PLACES:[],lmMat:()=>new THREE.MeshLambertMaterial(),console});
vm.runInContext(fs.readFileSync('src/sgbv/core.js','utf8').replace('/* BV_FOOTPRINTS */','{}'),ctx);
vm.runInContext(fs.readFileSync('src/sgje/core.js','utf8').replace('/* JE_FOOTPRINTS */',fs.readFileSync('src/sgje/footprints.json','utf8')),ctx);
vm.runInContext(fs.readFileSync('src/sgje/jurong_east_mrt/jurong_east_mrt.js','utf8'),ctx);
const g=ctx.LANDMARKS.sgje_jurong_east_mrt.build(),box=new THREE.Box3().setFromObject(g);
let triangles=0;g.traverse(o=>{if(!o.isMesh)return;for(const v of o.geometry.attributes.position.array)assert(Number.isFinite(v));triangles+=o.geometry.attributes.position.count/3;});
assert(triangles<60000);assert(box.max.y<=ctx.LANDMARKS.sgje_jurong_east_mrt.h+1);assert.equal(ctx.SG_PLACES.length,1);
console.log(JSON.stringify({triangles,bounds:{min:box.min.toArray(),max:box.max.toArray()}}));
