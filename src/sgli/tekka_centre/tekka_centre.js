/* OSM 47198835. Two-storey market only; adjacent HDB towers stay generic.
 * Current purple paint from September 2023 reopening photographs. */
{
const {register,out,scale,lerp}=SGLI;
register('tekka_centre','竹脚中心','Tekka Centre',100,(b,D)=>{
 const P=D.parts[0].p,H=10,eave=7.5;
 const flush=b.flush.bind(b);b.flush=g=>flush(g,mode=>lmMat({c:'#ffffff',vc:true,ds:true,m:0,lk:0,glow:mode===4?'#fff0d5':mode===5?'#ffe1b5':undefined,gk:mode===4?.75:mode===5?.3:0}));
 b.prism(P,-1,.22,'#a8a59b');b.prism(scale(P,.965),.22,6.8,'#363d40');
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
 const R=out(P,.65),dist=(x,z)=>Math.min(...R.map((p,i)=>{const q=R[(i+1)%R.length],dx=q[0]-p[0],dz=q[1]-p[1],t=Math.max(0,Math.min(1,((x-p[0])*dx+(z-p[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-p[0]-t*dx,z-p[1]-t*dz);}));
 const roof=p=>[p[0],Math.min(H,eave+dist(...p)*.19),p[1]];
 const tris=THREE.ShapeUtils.triangulateShape(R.map(p=>new THREE.Vector2(...p)),[]);
 function tile(a,c,d,n){if(n===0){b.tri('#867d84',roof(a),roof(c),roof(d));return;}const ac=a.map((v,k)=>(v+c[k])/2),cd=c.map((v,k)=>(v+d[k])/2),da=d.map((v,k)=>(v+a[k])/2);tile(a,ac,da,n-1);tile(ac,c,cd,n-1);tile(da,cd,d,n-1);tile(ac,cd,da,n-1);}
 tris.forEach(t=>tile(...t.map(i=>R[i]),3));b.rim(R,eave,'#d9d2d7',.22);
 // Louvred entrance screens on the Buffalo Road / Serangoon corner.
 for(const edge of [25,46]){const p=P[edge],q=P[edge+1],dx=q[0]-p[0],dz=q[1]-p[1],a=Math.atan2(-dz,dx),L=Math.hypot(dx,dz),x=lerp(p[0],q[0],.28),z=lerp(p[1],q[1],.28);
  b.box(x,0,z,Math.min(13,L*.4),8.7,.5,'#9472ad',a);
  for(let y=4.7;y<7.4;y+=.22)b.box(x,y,z,Math.min(7,L*.22),.09,.72,'#c8cccd',a);
  b.box(lerp(p[0],q[0],.62),5.25,lerp(p[1],q[1],.62),6,1.1,.12,'#e7e0c6',a,4);
 }
},[]);
}
