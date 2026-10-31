// Offline geometric validation; full-app browser comparison remains the final check.
const fs=require('fs'),vm=require('vm'),path=require('path');
const THREE=require('/tmp/earth-online-vendor/package/build/three.min.js');
const data=JSON.parse(fs.readFileSync('src/sgli/footprints.json'));
const builds={},ctx={THREE,console,LANDMARKS:{},SG_PLACES:[],lmMat:s=>new THREE.MeshBasicMaterial({color:s.c,vertexColors:!!s.vc,side:THREE.DoubleSide})};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/sgbv/core.js','utf8').replace('/* BV_FOOTPRINTS */',JSON.stringify(data)),ctx);
ctx.builds=builds;vm.runInContext('const SGLI=Object.assign({},SGBV,{register:(slug,zh,en,r,build,replaces)=>{builds[slug]={build,replaces};}});',ctx);
for(const slug of process.argv.slice(2)){
 vm.runInContext(fs.readFileSync(`src/sgli/${slug}/${slug}.js`,'utf8'),ctx);
 const b=vm.runInContext('new SGLI.Batch(0)',ctx),g=new THREE.Group();builds[slug].build(b,data[slug],{base:0},g);b.flush(g);
 let triangles=0,meshes=0;g.traverse(o=>{if(!o.isMesh)return;meshes++;const a=o.geometry.attributes.position.array;for(const v of a)if(!Number.isFinite(v))throw Error(slug+' nonfinite position');triangles+=a.length/9;});
 const bb=new THREE.Box3().setFromObject(g);console.log(JSON.stringify({slug,triangles,meshes,min:bb.min.toArray(),max:bb.max.toArray(),replaces:builds[slug].replaces}));
}
