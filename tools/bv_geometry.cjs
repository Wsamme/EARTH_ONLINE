// Geometry-level contract: all nine modules, finite coordinates, real anchors,
// connected OSM plans, measured maximum heights and shared triangle budget.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),THREE=require(process.env.THREE_JS||'/tmp/bv/vendor/package/build/three.min.js');
const specs=[];const ctx=vm.createContext({THREE,LANDMARKS:{},SG_PLACES:[],lmMat:s=>{specs.push(s);return new THREE.MeshLambertMaterial()},console});
const data=JSON.parse(fs.readFileSync(path.join(root,'src/sgbv/footprints.json')));
vm.runInContext(fs.readFileSync(path.join(root,'src/sgbv/core.js'),'utf8').replace('/* BV_FOOTPRINTS */',JSON.stringify(data)),ctx);
for(const slug of Object.keys(data))vm.runInContext(fs.readFileSync(path.join(root,`src/sgbv/${slug}/${slug}.js`),'utf8'),ctx);
const results=[];let total=0;
for(const [key,def]of Object.entries(ctx.LANDMARKS)){const g=def.build(),box=new THREE.Box3().setFromObject(g);let n=0;g.traverse(m=>{if(!m.isMesh)return;const a=m.geometry.attributes.position.array;for(const x of a)if(!Number.isFinite(x))throw new Error(key+' has nonfinite vertices');n+=a.length/9;});const slug=key.replace('sgbv_','');if(Math.abs(box.max.y-data[slug].height)>5)throw new Error(key+' height exceeds 5 m tolerance: '+box.max.y);total+=n;results.push({slug,triangles:n,maxHeight:+box.max.y.toFixed(2),measured:data[slug].height,osm:data[slug].parts.map(p=>p.id)});}
if(results.length!==9||ctx.SG_PLACES.length!==9)throw new Error('Expected nine unique definitions and placements');if(total>=400000)throw new Error('Triangle budget exceeded: '+total);if(specs.some(s=>s.m>1))throw new Error('Unexpected LED lighting mode on office materials');console.log(JSON.stringify({total,models:results},null,2));
