const fs=require('fs');const SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
global.self=global; global.window=global;
global.THREE=require(SC+'vend/package/build/three.min.js');
global.LANDMARKS={};global.SITES={};global.SG_PLACES=[];
let tris=0,bad=0,ylo=1e9,yhi=-1e9;
global.LTris=(g,a,c)=>{if(a.length%9)bad++;for(let i=0;i<a.length;i++){if(!isFinite(a[i]))bad++; if(i%3==1){ylo=Math.min(ylo,a[i]);yhi=Math.max(yhi,a[i]);}}tris+=a.length/9;};
global.LBox=global.LCyl=global.LSph=()=>{};
let s=1;global.LMCTX={rng:()=>{s=(s*16807)%2147483647;return s/2147483647;}};
eval(fs.readFileSync(SC+'hk/hkv41w/hkv41w.js','utf8'));
for(const k in LANDMARKS){tris=0;bad=0;ylo=1e9;yhi=-1e9;try{LANDMARKS[k].build();console.log(k,'tris',tris,'bad',bad,'y',ylo.toFixed(1),yhi.toFixed(1));}catch(e){console.log(k,'ERR',e.stack.split('\n').slice(0,3).join(' '));}}
console.log(SG_PLACES);
