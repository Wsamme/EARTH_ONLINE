// evaluate all hk modules (like lmx/count.js) and dump placements with r, h
const fs=require('fs'),vm=require('vm');const SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
const dirs=fs.readdirSync(SC+'hk').filter(d=>fs.existsSync(`${SC}hk/${d}/${d}.js`)&&d!=='hkv41e');
const stub=new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>0:stub,apply:()=>stub,construct:()=>stub});
const ctx={LANDMARKS:{},SITES:{},SG_PLACES:[],Math,JSON,Object,Array,Number,String,Set,Map,Float32Array,Float64Array,Uint8Array,Uint16Array,Uint32Array,Int32Array,console,isFinite,parseFloat,parseInt};
const sb=new Proxy(ctx,{has:()=>true,get:(t,k)=>(k in t?t[k]:(k===Symbol.unscopables?undefined:stub)),set:(t,k,v)=>{t[k]=v;return true;}});
const from={};
for(const d of dirs){try{new Function('sb',`with (sb) {\n${fs.readFileSync(`${SC}hk/${d}/${d}.js`,'utf8')}\n}`)(sb);}catch(e){console.error(d,e.message);} for(const k of [...Object.keys(ctx.LANDMARKS),...Object.keys(ctx.SITES)]) if(!from[k]) from[k]=d;}
const out=ctx.SG_PLACES.map(p=>{const o=ctx.LANDMARKS[p.type]||{};return {k:p.type,lat:p.lat,lon:p.lon,r:o.r,h:o.h,en:o.en,mod:from[p.type]};});
for(const [k,s] of Object.entries(ctx.SITES)) out.push({k,lat:s.lat,lon:s.lon,r:s.r,en:s.en,site:1,mod:from[k]});
fs.writeFileSync(process.argv[2],JSON.stringify(out));console.error('places',out.length);
