// validates info_hk.js against hk/targets.json and the lm31 data contract (run: node validate.js)
const fs=require('fs'),path=require('path'),vm=require('vm');
const T=require(path.join(__dirname,'..','..','hk','targets.json'));
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'info_hk.js'),'utf8'),ctx);
const I=ctx.window.LM_INFO; if(!I) throw 'no LM_INFO';
const keys=new Set(); for(const g in T.groups) for(const t of T.groups[g]) keys.add(t.key);
// v39: the harbour-front keys (hk/hkv_*) are not targets; their entries come from labelled_v39.js
for(const k of Object.keys(require('./labelled_v39.js'))) if(!k.startsWith('__')) keys.add(k);
const ALLOWED=new Set(['k','y','a','h','fl','d','x','p']);
let err=[],warn=[],zls=[],ews=[];
const bil=(o,n,k)=>{ if(!o||typeof o.zh!=='string'||typeof o.en!=='string'||!o.zh.trim()||!o.en.trim()) err.push(`${n} not {zh,en} ${k}`); };
const trad=/[們這為來說國過對時會後們個裡麼於學們灣廣場馬鐵橋臺館樓廳區機與禮園賽術藝]/;
for(const k of Object.keys(I)){
  const e=I[k], base=k.startsWith('site:')?k.split(':')[1]:k;
  if(!keys.has(base)) err.push('unknown key '+k);
  for(const f in e) if(!ALLOWED.has(f)) err.push(`field ${f} ${k}`);
  if(e.p){ if(!I[e.p]) err.push('bad p '+k); continue; }
  bil(e.k,'k',k); bil(e.d,'d',k); if(e.a) bil(e.a,'a',k);
  if(e.y!=null&&(typeof e.y!=='string'||!/^(c\. )?\d{4}(–\d{4})?$/.test(e.y))) err.push('y '+k+' '+e.y);
  if(e.h!=null&&(typeof e.h!=='number'||!(e.h>0&&e.h<700))) err.push('h '+k);
  if(e.fl!=null&&(!Number.isInteger(e.fl)||e.fl<1||e.fl>130)) err.push('fl '+k);
  if(e.x){ if(!Array.isArray(e.x)||e.x.length>3) err.push('x '+k); else e.x.forEach(q=>bil(q,'x',k)); }
  if(!e.d) continue;
  const zl=[...e.d.zh].length, ew=e.d.en.trim().split(/\s+/).length; zls.push(zl); ews.push(ew);
  if(zl<60||zl>130||ew<35||ew>75) warn.push(`${k} zh${zl} en${ew}`);
  if(trad.test(e.d.zh+e.k.zh+(e.a?e.a.zh:''))) warn.push('traditional char? '+k+' '+(e.d.zh.match(trad)||[])[0]);
  if(/[一-鿿]/.test(e.d.en)) err.push('CJK in en '+k);
}
for(const k of keys) if(!I[k]) err.push('missing '+k);
const st=a=>`${Math.min(...a)}–${Math.max(...a)} (mean ${(a.reduce((s,v)=>s+v,0)/a.length).toFixed(0)})`;
console.log('entries',Object.keys(I).length,'targets',keys.size,'| zh chars',st(zls),'| en words',st(ews));
console.log('errors',err.length?err:'none'); console.log('warnings',warn.length?warn:'none');
process.exitCode=err.length?1:0;
