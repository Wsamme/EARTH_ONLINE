/* Regression contracts for PR #5 findings. Uses the real r128 geometry helpers. */
const fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process'),assert=require('node:assert/strict');
const THREE=require(process.env.THREE_JS||'/tmp/bv/vendor/package/build/three.min.js'),data=JSON.parse(fs.readFileSync('src/sgbv/footprints.json'));
const cache=new Map();const lmMat=spec=>{const key=JSON.stringify(spec);if(!cache.has(key))cache.set(key,new THREE.MeshLambertMaterial({vertexColors:true}));return cache.get(key);};
const ctx=vm.createContext({THREE,LANDMARKS:{},SG_PLACES:[],lmMat,console,HOOKS:{frame:[]},landmarks:[],lmMeshes:new Map(),sgXY:(lat,lon)=>[(lon-103.845)*111290.5,(lat-1.315)*110574],hC:()=>0});
function loadCore(text){vm.runInContext(text.replace('/* BV_FOOTPRINTS */',JSON.stringify(data)),ctx);}
loadCore(fs.readFileSync('src/sgbv/core.js','utf8'));
for(const slug of ['rochester','star_vista','metropolis','fusionopolis_one'])vm.runInContext(fs.readFileSync(`src/sgbv/${slug}/${slug}.js`,'utf8'),ctx);
ctx.LANDMARKS.sgbv_rochester.build();
const original=[...cache.values()].map(m=>({m,compile:m.onBeforeCompile,data:JSON.stringify(m.userData),defines:m.defines}));
const star=ctx.LANDMARKS.sgbv_star_vista.build();
for(const o of original){assert.equal(o.m.onBeforeCompile,o.compile);assert.equal(JSON.stringify(o.m.userData),o.data);assert.equal(o.m.defines,o.defines);}
let owned=0;star.traverse(o=>{if(o.isMesh&&o.material.userData.svCourtOwner==='star_vista'){owned++;assert(!original.some(x=>x.m===o.material));assert.equal(o.material.defines.SV_OWN_COURT,1);}});assert(owned>0);
// The real app merge deliberately resets mesh shadow flags: test AFTER it.
const app=fs.readFileSync('src/city-brush-v16.html','utf8'),a=app.indexOf('function lmMerge(g){'),b=app.indexOf('\nconst LANDMARKS =',a);vm.runInContext(app.slice(a,b),ctx);
ctx.starGroup=star;ctx.landmarks.push({type:'sgbv_star_vista',id:1});ctx.lmMeshes.set(1,star);vm.runInContext('lmMerge(starGroup);HOOKS.frame.forEach(f=>f(1,0));',ctx);
let strips=0;star.traverse(o=>{if(o.isMesh&&o.material.userData.svThinStrip){strips++;assert.equal(o.castShadow,false);}});assert(strips>=3);
assert.equal(ctx.LANDMARKS.sgbv_metropolis.zh,'The Metropolis');assert.equal(ctx.LANDMARKS.sgbv_fusionopolis_one.zh,'启汇城一期');
vm.runInContext(`{const b=new SGBV.Batch(),segments=[];b.beam=(a,q)=>segments.push([a,q]);b.facade([[0,0],[10,0],[10,10]],0,4,4,3,'#555555','#999999',.2,false);b.rim([[0,0],[10,0],[10,10]],4,'#ffffff',.2,false);if(segments.some(([a,q])=>Math.abs(a[0]-q[0])>1&&Math.abs(a[2]-q[2])>1))throw Error('Open arc has a closing diagonal');}`,ctx);
const source=fs.readFileSync('src/sgbv/star_vista/star_vista.js','utf8');for(const base of source.matchAll(/pow\(([^,\n]+)/g))assert(/^(max|abs)\(/.test(base[1]),'Unsafe pow base: '+base[1]);
const old=cp.execFileSync('git',['show','a69f9f2:src/sgbv/core.js'],{encoding:'utf8'}).replace('const SGBV =','const OLD_BV =');vm.runInContext(old.replace('/* BV_FOOTPRINTS */',JSON.stringify(data)),ctx);
const masks=vm.runInContext(`(()=>{const d=SGBV.data.buona_vista_mrt,a=sgXY(d.lat,d.lon);let n=0;for(let x=-115;x<100;x+=2)for(let z=-65;z<110;z+=2){const cx=a[0]+x,cy=a[1]-z,B={cx,cy,rings:[[cx-.25,cy-.25,cx+.25,cy-.25,cx+.25,cy+.25,cx-.25,cy+.25]]};if(OLD_BV.skip(B)&&!SGBV.skip(B))n++;}return n;})()`,ctx);assert(masks>0);
console.log(JSON.stringify({materialIsolation:true,ownedCourtMaterials:owned,postMergeStripMaterials:strips,openArc:true,allPowBasesGuarded:true,labels:true,undergroundOnlyGridSamplesRestored:masks},null,2));
