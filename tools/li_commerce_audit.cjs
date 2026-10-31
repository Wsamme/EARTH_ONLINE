/* Pure geometry audit, independent of the shared browser lock. */
const fs=require('fs'),vm=require('vm');
const THREE=require('/tmp/earth-online-vendor/package/build/three.min.js');
const D=JSON.parse(fs.readFileSync('src/sgli/footprints.json'));
const ctx={THREE,console,LANDMARKS:{},SG_PLACES:[],lmMat:()=>({userData:{}}),hC:()=>0,sgXY:()=>[0,0]};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/sgbv/core.js','utf8').replace('/* BV_FOOTPRINTS */','{}'),ctx);
vm.runInContext(fs.readFileSync('src/sgli/core.js','utf8').replace('/* LI_FOOTPRINTS */',JSON.stringify(D)),ctx);
for(const slug of ['tekka_centre','mustafa_centre','deepavali_lightup','little_india_arcade','city_square_mall']){
 vm.runInContext(fs.readFileSync(`src/sgli/${slug}/${slug}.js`,'utf8'),ctx);
 const group=ctx.LANDMARKS['sgli_'+slug].build();let invalid=0,tris=0,maxY=-Infinity,minY=Infinity,batches=0;
 group.traverse(o=>{if(!o.isMesh)return;batches++;const p=o.geometry.attributes.position.array;tris+=p.length/9;for(let j=0;j<p.length;j++){if(!Number.isFinite(p[j]))invalid++;if(j%3===1){minY=Math.min(minY,p[j]);maxY=Math.max(maxY,p[j]);}}});
 if(invalid||tris>(slug==='deepavali_lightup'?80000:60000))throw Error(slug+' invalid/budget '+invalid+'/'+tris);
 console.log(JSON.stringify({slug,triangles:tris,batches,minY,maxY,invalid,extras:group.userData.liLightup}));
}
