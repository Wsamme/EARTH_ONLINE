/* Local original-geometry sanity check, no browser or external model data. */
const fs=require('node:fs'),vm=require('node:vm');
const THREE=require((process.env.BV_VENDOR||'/tmp/earth-online-vendor')+'/package/build/three.min.js');
const ctx={THREE,LANDMARKS:{},SG_PLACES:[],lmMat:()=>new THREE.MeshLambertMaterial({color:0xffffff,vertexColors:true,side:THREE.DoubleSide})};
vm.createContext(ctx);
for(const [file,mark,json] of [['src/sgbv/core.js','/* BV_FOOTPRINTS */','src/sgbv/footprints.json'],['src/sgje/core.js','/* JE_FOOTPRINTS */','src/sgje/footprints.json']])vm.runInContext(fs.readFileSync(file,'utf8').replace(mark,fs.readFileSync(json,'utf8')),ctx);
for(const slug of ['westgate','jem','j_den']){
 vm.runInContext(fs.readFileSync(`src/sgje/${slug}/${slug}.js`,'utf8'),ctx);
 const g=ctx.LANDMARKS[`sgje_${slug}`].build();let triangles=0,meshes=0;
 g.traverse(o=>{if(o.isMesh){meshes++;triangles+=o.geometry.attributes.position.count/3;for(const n of o.geometry.attributes.position.array)if(!Number.isFinite(n))throw Error(`${slug}: non-finite vertex`);}});
 const bb=new THREE.Box3().setFromObject(g);console.log(JSON.stringify({slug,triangles,meshes,bounds:{min:bb.min.toArray(),max:bb.max.toArray()}}));
}
