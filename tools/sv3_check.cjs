/* Star Vista-specific geometry contracts, using the repo's real r128 helpers. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),THREE=require(process.env.THREE_JS||'/tmp/bv/vendor/package/build/three.min.js');
const ctx=vm.createContext({THREE,LANDMARKS:{},SG_PLACES:[],lmMat:()=>new THREE.MeshLambertMaterial(),console});
const data=JSON.parse(fs.readFileSync(path.join(root,'src/sgbv/footprints.json')));
vm.runInContext(fs.readFileSync(path.join(root,'src/sgbv/core.js'),'utf8').replace('/* BV_FOOTPRINTS */',JSON.stringify(data)),ctx);
vm.runInContext(fs.readFileSync(path.join(root,'src/sgbv/star_vista/star_vista.js'),'utf8'),ctx);
const def=ctx.LANDMARKS.sgbv_star_vista,g=def.build(),box=new THREE.Box3().setFromObject(g);let triangles=0,roofTriangles=0,degenerate=0;
g.traverse(m=>{if(!m.isMesh)return;const p=m.geometry.attributes.position,n=m.geometry.attributes.normal;triangles+=p.count/3;for(let i=0;i<p.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2),cross=b.sub(a).cross(c.sub(a));if(cross.lengthSq()<1e-16)degenerate++;if(m.userData.svMode===5||m.userData.svMode===6){roofTriangles++;if(n.getY(i)<-.001)throw Error('Roof normal faces down');}for(let j=0;j<3;j++)if(!Number.isFinite(p.getX(i+j)+p.getY(i+j)+p.getZ(i+j)))throw Error('Nonfinite vertex');}});
if(triangles>100000)throw Error('Hero exceeds 100k local ceiling');if(Math.abs(box.max.y-74.5)>1)throw Error('Measured maximum mismatch');if(ctx.SG_PLACES.length!==1||!data.star_vista.parts.some(p=>p.id===104352121))throw Error('Wrong placement/OSM anchor');
console.log(JSON.stringify({triangles,roofTriangles,degenerate,maxHeight:box.max.y,bounds:[box.min.toArray(),box.max.toArray()],osm:104352121,placements:ctx.SG_PLACES.length},null,2));
