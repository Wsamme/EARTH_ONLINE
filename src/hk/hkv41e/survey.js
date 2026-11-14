const fs=require('fs'),zlib=require('zlib');const SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
const B=JSON.parse(fs.readFileSync('_all2.json')),P=JSON.parse(fs.readFileSync('_places.json'));
const base=JSON.parse(zlib.gunzipSync(fs.readFileSync(SC+'site/hkdata/hk_base.bin')).toString());
const X=lon=>(lon-114.12)*103014.2,Y=lat=>(lat-22.34)*110734.9,LON=x=>114.12+x/103014.2,LAT=y=>22.34+y/110734.9;
// area box: east island
const x0=X(114.168),x1=X(114.262),y1=Y(22.2965),y0=Y(22.195);
const inBox=(x,y)=>x>x0&&x<x1&&y>y0&&y<y1&&!(y>Y(22.2925)&&x<X(114.19));
// group parts (consecutive part records with same seed in a tile)
const groups=[];let cur=null;
for(const b of B){ if(b.part&&cur&&cur.part&&cur.ti===b.ti&&cur.seed===b.seed&&b.k===cur.lastk+1){cur.items.push(b);cur.lastk=b.k;continue;} cur={ti:b.ti,seed:b.seed,part:b.part,items:[b],lastk:b.k};groups.push(cur);}
const area=R=>{let A=0;for(let i=0;i<R.length;i++){const j=(i+1)%R.length;A+=R[i][0]*R[j][1]-R[j][0]*R[i][1];}return Math.abs(A/2);};
const pois=[...base.pois,...base.places].filter(p=>p.x>x0-200&&p.x<x1+200&&p.y>y0-200&&p.y<y1+200);
const pip=(R,x,y)=>{let c=false;for(let i=0,j=R.length-1;i<R.length;j=i++){const a=R[i],b=R[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
const out=[];
for(const g of groups){const items=g.items;let H=0,maxA=0,outer=null;for(const b of items){H=Math.max(H,b.h);const a=area(b.rings[0]);if(a>maxA){maxA=a;outer=b.rings[0];}}
 // union bbox
 let mnx=1e9,mny=1e9,mxx=-1e9,mxy=-1e9;for(const b of items)for(const p of b.rings[0]){mnx=Math.min(mnx,p[0]);mxx=Math.max(mxx,p[0]);mny=Math.min(mny,p[1]);mxy=Math.max(mxy,p[1]);}
 const cx=(mnx+mxx)/2,cy=(mny+mxy)/2; if(!inBox(cx,cy))continue;
 if(!(H>=80||(maxA>=6000&&H>=20)))continue;
 const near=P.filter(p=>Math.hypot(X(p.lon)-cx,Y(p.lat)-cy)<(p.r||50)+20).map(p=>p.k);
 const nm=pois.map(p=>({p,d:Math.hypot(p.x-cx,p.y-cy),in:items.some(b=>pip(b.rings[0],p.x,p.y))})).filter(o=>o.in||o.d<40).sort((a,b)=>a.d-b.d).slice(0,3).map(o=>o.p.zh+'/'+o.p.en+'('+o.p.k+','+o.d.toFixed(0)+(o.in?',in':'')+')');
 out.push({h:H,area:Math.round(maxA),parts:items.length,t:items[0].t,lat:+LAT(cy).toFixed(6),lon:+LON(cx).toFixed(6),cx:+cx.toFixed(1),cy:+cy.toFixed(1),w:Math.round(mxx-mnx),d:Math.round(mxy-mny),covered:near,names:nm});}
out.sort((a,b)=>b.h-a.h);fs.writeFileSync('_survey_raw.json',JSON.stringify(out,null,0));
for(const o of out.filter(o=>!o.covered.length).slice(0,70))console.log(o.h,o.area,o.parts,'t'+o.t,o.lat,o.lon,o.w+'x'+o.d,o.names.join(' ; '));
console.log('total',out.length,'uncovered',out.filter(o=>!o.covered.length).length);
console.log('covered:',out.filter(o=>o.covered.length).slice(0,40).map(o=>o.h+':'+o.covered.join('+')).join(' '));
