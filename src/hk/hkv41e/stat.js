const fs=require('fs');const SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
global.THREE=require(SC+'vend/package/build/three.min.js');
const app=fs.readFileSync(SC+'site/hk-app.js','utf8').split('\n');
const helpers=app.slice(3039,3157).join('\n');
const code=`let LMCTX=null; const NIGHT={uNight:{value:0}}, LMT={value:0}, LMS={show:{},occ:{},dim:{}}; const LM_GLSL='', LM_UNI=''; function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
${helpers}
const LANDMARKS={}, SG_PLACES=[], SITES={};
${fs.readFileSync(process.argv[2],'utf8')}
return {LANDMARKS,SG_PLACES,run:(k)=>{LMCTX={mats:new Map(),fx:[],rng:mulberry32(1),u:{}};const t0=Date.now();const g=LANDMARKS[k].build();let calls=0;g.traverse(o=>{if(o.isMesh)calls++;});lmMerge(g);let tris=0,ymin=1e9,ymax=-1e9,rmax=0;g.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;tris+=p.count/3;for(let i=0;i<p.count;i++){const y=p.getY(i);ymin=Math.min(ymin,y);ymax=Math.max(ymax,y);rmax=Math.max(rmax,Math.hypot(p.getX(i),p.getZ(i)));}}});return {k,calls,tris,ms:Date.now()-t0,mats:LMCTX.mats.size,ymin:+ymin.toFixed(1),ymax:+ymax.toFixed(1),rmax:+rmax.toFixed(1),r:LANDMARKS[k].r,h:+LANDMARKS[k].h.toFixed(1),label:LANDMARKS[k].label!==false};}};`;
const M=new Function(code)();
let tot=0;for(const k of Object.keys(M.LANDMARKS)){const s=M.run(k);tot+=s.tris;console.log(JSON.stringify(s));}
console.log('places',M.SG_PLACES.length,'tris total',tot);
