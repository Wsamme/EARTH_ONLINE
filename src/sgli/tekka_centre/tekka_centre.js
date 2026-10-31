/* OSM 47198835. Two-storey market only; adjacent HDB towers stay generic.
 * Current purple paint from September 2023 reopening photographs. */
{
const {register,out,scale,lerp}=SGLI;
register('tekka_centre','竹脚中心','Tekka Centre',100,(b,D)=>{
 const P=D.parts[0].p,H=9.2,eave=9.0;
 // Reference p50 12.1 m / p90 13.6 m; 68.9 m max is HDB contamination.
 const verticalScale=1.32;
 const flush=b.flush.bind(b);b.flush=g=>{for(const B of b.buckets.values())for(let i=1;i<B.p.length;i+=3)B.p[i]=b.base+(B.p[i]-b.base)*verticalScale;return flush(g,mode=>lmMat({c:'#ffffff',vc:true,ds:true,m:0,lk:0,glow:mode===4?'#fff0d5':mode===5?'#ffe1b5':undefined,gk:mode===4?.75:mode===5?.3:0}));};
 b.prism(P,-1,.22,'#a8a59b');b.prism(scale(P,.965),.22,6.8,'#363d40');b.walls(P,7.42,9.0,'#9a7ab6');
 // Sheltered market and first-floor galleries: the open bays sit behind the columns.
 const Q=out(P,.06);
 Q.forEach((p,i)=>{const q=Q[(i+1)%Q.length],dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz);if(L<6)return;
  const a=Math.atan2(-dz,dx),n=Math.max(1,Math.round(L/5.5));
  for(let j=0;j<n;j++){
   const t=(j+.5)/n,x=lerp(p[0],q[0],t),z=lerp(p[1],q[1],t),w=L/n;
   b.box(x,.25,z,.46,7.05,.46,'#e4e1d8',a);
   b.box(x,3.65,z,w,.25,.42,'#eee9da',a);
   b.box(x,4.0,z,w-.48,.85,.22,'#a49bbb',a);
   for(let k=-2;k<=2;k++)b.box(x+Math.cos(a)*k*w/6,4.85,z-Math.sin(a)*k*w/6,.06,.7,.08,'#b9c0bb',a);
   if(j%2===0)b.box(x,2.7,z,w*.65,.46,.12,'#e4d9ba',a,4);
   b.box(x,6.98,z,w*.6,.06,.9,'#e5dfc9',a,5);
  }
  b.box((p[0]+q[0])/2,6.65,(p[1]+q[1])/2,L,.85,.65,'#9a7ab6',a);
  b.box((p[0]+q[0])/2,7.42,(p[1]+q[1])/2,L,.14,.9,'#d4c7d9',a);
  // Broken colour strokes follow the repainted façade, rather than invented signage.
  for(let j=0;j<n;j+=2){const t=(j+.5)/n;b.box(lerp(p[0],q[0],t),6.9+(j%3)*.12,lerp(p[1],q[1],t),Math.min(5,L/n*.8),.13,.73,['#e6b637','#ed8b68','#a3bb53'][j%3],a);}
 });
 // Shallow pitched roof with deep eaves. Subdivided OSM triangles produce a
 // continuous hip surface on the irregular market plan, without filling its notches.
 const R=out(P,.65);
 // Two broad parallel ridge lines follow the market wings. Boundary recesses
 // remain plan details, not a source of tiny conical roof peaks.
 const roof=p=>{const v=-.624*p[0]+.781*p[1];return [p[0],v<4?9.05:9.15,p[1]];};
 const tris=THREE.ShapeUtils.triangulateShape(R.map(p=>new THREE.Vector2(...p)),[]);
 function tile(a,c,d,n){if(n===0){b.tri((-.624*a[0]+.781*a[1])<4?'#6596a1':'#819079',roof(a),roof(c),roof(d));return;}const ac=a.map((v,k)=>(v+c[k])/2),cd=c.map((v,k)=>(v+d[k])/2),da=d.map((v,k)=>(v+a[k])/2);tile(a,ac,da,n-1);tile(ac,c,cd,n-1);tile(da,cd,d,n-1);tile(ac,cd,da,n-1);}
 tris.forEach(t=>tile(...t.map(i=>R[i]),3));b.rim(R,eave,'#d9d2d7',.22);
 // North hall: repeated sawtooth monitor roofs. The broad outer roof and
 // south gridded sheet roof stay separate from these raised ventilator strips.
 const UV=(u,v,y)=>[.781*u-.624*v,y,.624*u+.781*v];
 for(let u=-57;u<6;u+=5){const A=UV(u,-33,9.2),B=UV(u,-7,9.2),C=UV(u+4.8,-7,10.3),E=UV(u+4.8,-33,10.3);
  if([A,B,C,E].every(p=>SGLI.inside(P,p[0],p[2]))){b.quad('#66796b',A,B,C,E);b.quad('#344850',C,E,UV(u+4.8,-33,9.2),UV(u+4.8,-7,9.2));b.beam(C,E,.1,'#aab7ae');}
 }
 // Fine standing-seam grid and a few exhaust banks on the southern roof.
 for(let u=-10;u<75;u+=3.2)for(let v=6;v<40;v+=4){const A=UV(u,v,9.2),B=UV(u,v+3.8,9.2);if([A,B].every(p=>SGLI.inside(P,p[0],p[2])))b.beam(A,B,.055,'#c4d0c4');}
 for(let v=8;v<41;v+=8)for(let u=-10;u<72;u+=4){const A=UV(u,v,9.2),B=UV(u+3.8,v,9.2);if([A,B].every(p=>SGLI.inside(P,p[0],p[2])))b.beam(A,B,.05,'#b7c8c0');}
 for(const [u,v]of [[16,10],[31,13],[50,23],[22,34]]){const c=UV(u,v,9.2);b.box(c[0],9.2,c[2],3,.35,1.4,'#d2d9d4',-.67);for(let k=-1;k<=1;k++)b.box(c[0]+k*.7,9.56,c[2],.5,.04,1.1,'#647c7c',-.67);}

 // Entrance stair and short access ramp stay inside the front footprint.
 {const p=P[25],q=P[26],dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz),a=Math.atan2(-dz,dx),F=(u,v,y)=>[p[0]+dx/L*u-dz/L*v,y,p[1]+dz/L*u+dx/L*v];
  for(let j=0;j<8;j++){const c=F(L*.62,1+j*.32,.18);b.box(c[0],.18,c[2],5,(j+1)*.12,.34,'#c8b8a4',a);}
  const A=F(L*.62+3.4,1,.18),B=F(L*.62+3.4,12,1.14),C=F(L*.62+5,12,1.14),E=F(L*.62+5,1,.18);
  b.quad('#b9b3a4',A,B,C,E);b.beam(F(L*.62+5,1,1.0),F(L*.62+5,12,1.95),.065,'#c7ceca');
  const c=F(L*.62,.9,3.4);b.box(c[0],3.4,c[2],7,.16,2.8,'#668d9d',a);
 }
 // Louvred entrance screens on the Buffalo Road / Serangoon corner.
 for(const edge of [25,46]){const p=P[edge],q=P[edge+1],dx=q[0]-p[0],dz=q[1]-p[1],a=Math.atan2(-dz,dx),L=Math.hypot(dx,dz),x=lerp(p[0],q[0],.28),z=lerp(p[1],q[1],.28);
  b.box(x,0,z,Math.min(13,L*.4),8.7,.5,'#9472ad',a);
  for(let y=4.7;y<7.4;y+=.22)b.box(x,y,z,Math.min(7,L*.22),.09,.72,'#c8cccd',a);
  b.box(lerp(p[0],q[0],.62),5.25,lerp(p[1],q[1],.62),6,1.1,.12,'#e7e0c6',a,4);
 }
},[]);
}
