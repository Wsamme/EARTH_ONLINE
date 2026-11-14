// pick target footprints from the decoded building data, compute local rings + ground offsets -> _D.json
const fs=require('fs'),zlib=require('zlib');const SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
const B=JSON.parse(fs.readFileSync('_all2.json'));
const base=JSON.parse(zlib.gunzipSync(fs.readFileSync(SC+'site/hkdata/hk_base.bin')).toString());
const hb=Buffer.from(base.H,'base64'),TN=base.TN,TS=base.TS,HALF=base.HALF,H=new Float32Array(hb.length>>1);for(let i=0;i<H.length;i++)H[i]=hb.readInt16LE(i*2)/10;
const hAt=(x,y)=>{const fx=Math.min(TN-1.0001,Math.max(0,(x+HALF)/TS)),fy=Math.min(TN-1.0001,Math.max(0,(y+HALF)/TS));const i=Math.floor(fx),j=Math.floor(fy),u=fx-i,v=fy-j;const a=H[j*TN+i],b=H[j*TN+i+1],c=H[(j+1)*TN+i],d=H[(j+1)*TN+i+1];return Math.max(-0.3,(a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v);};
const X=lon=>(lon-114.12)*103014.2,Y=lat=>(lat-22.34)*110734.9,LON=x=>114.12+x/103014.2,LAT=y=>22.34+y/110734.9;
const area=R=>{let A=0;for(let i=0;i<R.length;i++){const j=(i+1)%R.length;A+=R[i][0]*R[j][1]-R[j][0]*R[i][1];}return A/2;};
// targets: key -> [lat, lon, hmin] ; picks the non-part/part record whose bbox centre is nearest and h>=hmin
const T=JSON.parse(fs.readFileSync('targets.json'));
const D={};
for(const [k,[lat,lon,hmin,maxd]] of Object.entries(T)){
  const px=X(lon),py=Y(lat);let best=null,bd=1e9;
  for(const b of B){if(b.h<hmin)continue;const R=b.rings[0];let mnx=1e9,mny=1e9,mxx=-1e9,mxy=-1e9;for(const p of R){mnx=Math.min(mnx,p[0]);mxx=Math.max(mxx,p[0]);mny=Math.min(mny,p[1]);mxy=Math.max(mxy,p[1]);}
    const d=Math.hypot((mnx+mxx)/2-px,(mny+mxy)/2-py);if(d<bd){bd=d;best={b,cx:(mnx+mxx)/2,cy:(mny+mxy)/2};}}
  if(!best||bd>(maxd||8)){console.error('MISS',k,bd);continue;}
  const {b,cx,cy}=best;let R=b.rings[0].map(p=>[+(p[0]-cx).toFixed(2),+(-(p[1]-cy)).toFixed(2)]);
  // local ring in x east, z south; make it CCW in (x,-z) i.e. standard orientation for THREE.Shape(x,-z)
  if(area(R.map(p=>[p[0],-p[1]]))<0)R.reverse();
  if(R.length>2&&R[0][0]===R[R.length-1][0]&&R[0][1]===R[R.length-1][1])R.pop();
  const rmax=Math.max(...R.map(p=>Math.hypot(p[0],p[1])));const r=Math.ceil(rmax+2);
  // app: top = max ground over r (12 dirs x 3 radii) + 0.6
  let hi=-1e9,lo=1e9;for(let a=0;a<12;a++)for(const f of [0,0.35,0.7]){const g=hAt(cx+Math.cos(a/12*Math.PI*2)*r*f,cy+Math.sin(a/12*Math.PI*2)*r*f);hi=Math.max(hi,g);lo=Math.min(lo,g);}
  let gmin=1e9;for(const p of b.rings[0])gmin=Math.min(gmin,hAt(p[0],p[1]));
  const top=hi+0.6,g0=hAt(cx,cy);
  D[k]={ll:[+LAT(cy).toFixed(6),+LON(cx).toFixed(6)],h:b.h,r,dy:+(top-g0).toFixed(1),deep:+(top-Math.min(gmin,lo)+5).toFixed(1),ring:R,holes:b.rings.length-1,t:b.t,d:+bd.toFixed(1)};
  console.error(k,'h',b.h,'r',r,'dy',D[k].dy,'deep',D[k].deep,'n',R.length,'d',bd.toFixed(1),'g0',g0.toFixed(1));
}
fs.writeFileSync('_D.json',JSON.stringify(D));
