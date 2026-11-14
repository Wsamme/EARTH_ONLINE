const fs=require('fs');const B=JSON.parse(fs.readFileSync('_all2.json')),D=JSON.parse(fs.readFileSync('_D.json'));
const X=lon=>(lon-114.12)*103014.2,Y=lat=>(lat-22.34)*110734.9;
const hull=pts=>{pts.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];for(const p of pts){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(let i=pts.length-1;i>=0;i--){const p=pts[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p);}up.pop();lo.pop();return lo.concat(up);};
const pip=(R,x,y)=>{let c=false;for(let i=0,j=R.length-1;i<R.length;j=i++){const a=R[i],b=R[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
const cen=R=>{let A=0,sx=0,sy=0;const x0=R[0][0],y0=R[0][1];for(let i=0;i<R.length;i++){const j=(i+1)%R.length,ax=R[i][0]-x0,ay=R[i][1]-y0,bx=R[j][0]-x0,by=R[j][1]-y0,c=ax*by-bx*ay;A+=c;sx+=(ax+bx)*c;sy+=(ay+by)*c;}A/=2;return Math.abs(A)>1e-6?[x0+sx/(6*A),y0+sy/(6*A)]:[x0,y0];};
for(const [k,d] of Object.entries(D)){const ax=X(d.ll[1]),ay=Y(d.ll[0]);const sc=k==='hk41etunglin'?1.06:1.02;
 let P=hull(d.ring.map(p=>[ax+p[0]*sc,ay-p[1]*sc]));let c=[0,0];for(const p of P){c[0]+=p[0]/P.length;c[1]+=p[1]/P.length;}P=P.map(p=>{const dx=p[0]-c[0],dy=p[1]-c[1],L=Math.hypot(dx,dy)||1;return [p[0]+dx/L*3,p[1]+dy/L*3];});
 const hid=B.filter(b=>{const q=cen(b.rings[0]);return pip(P,q[0],q[1]);}).map(b=>b.h+'m/t'+b.t);console.log(k,hid.length,hid.join(' '));}
