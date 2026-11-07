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
 const extra=group.userData.liLightup;
 const collisions=[];
 if(extra)for(let i=0;i<extra.centres.length;i++)for(const side of [-1,1]){
  const c=extra.centres[i],t=extra.tangents[i],w=extra.widths[i],pole=[c[0]-t[1]*side*w,c[1]+t[0]*side*w];
  for(const [other,entry]of Object.entries(D))for(const part of entry.parts){
   const local=[pole[0]-(entry.lon-D[slug].lon)*111320*Math.cos(D[slug].lat*Math.PI/180),pole[1]+(entry.lat-D[slug].lat)*111320];
   ctx.auditPoint=local;ctx.auditPoly=part.p;
   if(vm.runInContext('SGLI.inside(auditPoly,...auditPoint)',ctx))collisions.push({arch:i,side,slug:other,osm:part.id});
  }
 }
 if(collisions.length)throw Error('Poles inside mapped landmark buildings: '+JSON.stringify(collisions));
 const result={slug,triangles:tris,batches,minY,maxY,heightAboveAnchorGround:maxY+.6,invalid,...(extra?{arches:extra.arches,spacingMetres:extra.spacingMetres,clearanceMetres:extra.clearanceMetres,mappedBuildingPoleCollisions:collisions}: {})};
 const out=process.env.LI_OUT||'/workspace/eo_li_out/commerce';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(`${out}/${slug}_geometry_audit.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}
