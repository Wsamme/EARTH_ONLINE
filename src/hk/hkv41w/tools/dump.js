const fs=require('fs');const SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
global.THREE=require(SC+'vend/package/build/three.min.js');
global.LANDMARKS={};global.SITES={};global.SG_PLACES=[];
let T=[];const col=c=>typeof c==='string'?c:(c.c||'#888');
global.LTris=(g,a,c)=>{T.push([col(c),Array.from(a,v=>+v.toFixed(2))]);};
const box=(g,w,h,d,x,y,z,c)=>{const a=[];const P=[[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2],[x-w/2,y+h,z-d/2],[x+w/2,y+h,z-d/2],[x+w/2,y+h,z+d/2],[x-w/2,y+h,z+d/2]];
 for(const [i,j,k,l] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]])a.push(...P[i],...P[j],...P[k],...P[i],...P[k],...P[l]);T.push([col(c),a]);};
global.LBox=box;global.LCyl=(g,rt,rb,h,x,y,z,c)=>box(g,rb*2,h,rb*2,x,y,z,c);global.LSph=(g,r,x,y,z,c)=>box(g,r*2,r*2,r*2,x,y-r,z,c);
let s=1;global.LMCTX={rng:()=>{s=(s*16807)%2147483647;return s/2147483647;}};
eval(fs.readFileSync(SC+'hk/hkv41w/hkv41w.js','utf8'));
for(const k of process.argv[2].split(',')){T=[];LANDMARKS[k].build();fs.writeFileSync(SC+'w41/r/'+k+'.json',JSON.stringify(T));}
