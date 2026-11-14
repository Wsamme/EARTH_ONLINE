// decode hk_bld0.bin big buildings (port of SGBld.decList) -> JSON of buildings in a lon/lat box
const fs=require('fs'),zlib=require('zlib');
const SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
const u8=zlib.gunzipSync(fs.readFileSync(SC+'site/hkdata/hk_bld0.bin'));
let o=4;const vu0=()=>{let b=u8[o++];if(b<128)return b;let v=b&127,s=7;do{b=u8[o++];v+=(b&127)*Math.pow(2,s);s+=7;}while(b&128);return v;};
const magic=String.fromCharCode(u8[0],u8[1],u8[2],u8[3]);
const TILE=vu0(),TXN=vu0(),HALF0=TILE*TXN/2;const nParts=vu0(),nT=vu0(),idx=new Map();
for(let t=0;t<nT;t++){const ti=vu0();idx.set(ti,{nB:vu0(),lenB:vu0(),nS:vu0(),part:vu0(),offS:vu0(),lenS:vu0()});}
for(const e of idx.values()){e.offB=o;o+=e.lenB;}
function decListP(U,o0,ti,n){return decListU(U,o0,ti,n);}
function decList(o0,ti,n){return decListU(u8,o0,ti,n);}
function decListU(u8,o0,ti,n){let o=o0;const vu=()=>{let b=u8[o++];if(b<128)return b;let v=b&127,s=7;do{b=u8[o++];v+=(b&127)*Math.pow(2,s);s+=7;}while(b&128);return v;};
 const zz=()=>{const v=vu();return v%2?-(v+1)/2:v/2;};const ox=-HALF0+(ti%TXN)*TILE,oy=-HALF0+Math.floor(ti/TXN)*TILE,list=[];
 for(let k=0;k<n;k++){const f=u8[o++],h=vu()/10,base=vu()/10,wall=[u8[o],u8[o+1],u8[o+2]];o+=3;const rs=u8[o++];if(rs===255)o+=3;const seed=u8[o++],nr=vu(),rings=[];let px=0,py=0;
  for(let r=0;r<nr;r++){const m=vu(),R=[];for(let i=0;i<m;i++){px+=zz();py+=zz();R.push([+(ox+px/4).toFixed(1),+(oy+py/4).toFixed(1)]);}rings.push(R);}
  list.push({t:f&31,h,base,wall,seed,part:!!(f&64),rings,ti,k});}
 return list;}
const all=[];for(const [ti,e] of idx){if(e.nB)for(const B of decList(e.offB,ti,e.nB))all.push(B);}
if(process.argv[3]){const P=zlib.gunzipSync(fs.readFileSync(SC+'site/hkdata/hk_bld1.bin'));const save=u8;for(const [ti,e] of idx){if(!e.nS)continue;const L=decListP(P,e.offS,ti,e.nS);for(const b of L)all.push(b);}}
console.error('magic',magic,'TILE',TILE,'TXN',TXN,'big',all.length);
fs.writeFileSync(process.argv[2],JSON.stringify(all));
