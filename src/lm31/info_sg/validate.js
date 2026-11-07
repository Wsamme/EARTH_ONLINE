const fs=require('fs'),vm=require('vm'),path=require('path');
const K=path.join(__dirname,'../kit');
const window={}; vm.runInNewContext(fs.readFileSync(path.join(__dirname,'info_sg.js'),'utf8'),{window});
const I=window.LM_INFO; if(!I) throw 'no LM_INFO';
const lm=JSON.parse(fs.readFileSync(K+'/lm_sg.json')), nus=JSON.parse(fs.readFileSync(K+'/nus_labels.json'));
const err=[]; const lab=new Set(lm.filter(x=>x.label!==false).map(x=>x.key));
const sites=['nus','ntu','uss','changiair','changit4','changicargo','gardens',
  // v40 (lm40 SITES)
  'sgsmu','sgdempsey','sglakeside','sgjapanesegarden','sgzoo','sgriverwonders','sgnightsafari','sgbirdparadise','sgsungeibuloh','sgsutd','sgchangivillage','sgchekjawa'];
const want=new Set([...lm.map(x=>x.key),...sites.map(s=>'site:'+s),...nus.map(x=>'site:nus:'+x[1])]);
for(const x of lm){const e=I[x.key]; if(!e){err.push('missing '+x.key);continue}
  if(x.label===false){ if(!e.p||!(lab.has(e.p)||(e.p.startsWith('site:')&&want.has(e.p)))) err.push('bad p '+x.key); }}
for(const k of want) if(!I[k]) err.push('missing '+k);
for(const k of Object.keys(I)) if(!want.has(k)) err.push('extra '+k);
let zl=[],el=[];
for(const [k,e] of Object.entries(I)){ if(e.p) continue;
  if(!e.d||!e.d.zh||!e.d.en) err.push('no d '+k);
  if(!e.k||!e.k.zh||!e.k.en) err.push('no k '+k);
  if(e.a&&(!e.a.zh||!e.a.en)) err.push('bad a '+k);
  if(e.y!==undefined&&typeof e.y!=='string') err.push('y not string '+k);
  for(const f of ['h','fl']) if(e[f]!==undefined&&typeof e[f]!=='number') err.push(f+' '+k);
  const zn=[...e.d.zh].length, en=e.d.en.split(/\s+/).length; zl.push(zn); el.push(en);
  if(zn<50||zn>140||en<30||en>75) console.log('len',k,zn,en);
  const allowed=new Set(['k','y','a','h','fl','d','x']); for(const f in e) if(!allowed.has(f)) err.push('field '+f+' '+k);
}
const st=a=>[Math.min(...a),Math.round(a.reduce((s,v)=>s+v,0)/a.length),Math.max(...a)];
console.log('entries',Object.keys(I).length,'labelled lm',lab.size,'secondary',lm.length-lab.size,'sites',sites.length,'nus',nus.length);
console.log('zh chars min/avg/max',st(zl),'en words',st(el));
console.log(err.length?err.join('\n'):'OK');
