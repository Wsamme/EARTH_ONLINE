/* OSM 47198835. Market hall and the overlapping Buffalo Road HDB slabs restored in round 2.
 * Current purple paint from September 2023 reopening photographs. */
{
const {register,out,scale,lerp}=SGLI;
register('tekka_centre','竹脚中心','Tekka Centre',100,(b,D)=>{
 const P=D.parts[0].p,H=9.2,eave=9.0;
 // Reference p50 12.1 m / p90 13.6 m; 68.9 m max is HDB contamination.
 const verticalScale=1.32;
 const flush=b.flush.bind(b);b.flush=g=>{for(const B of b.buckets.values())for(let i=1;i<B.p.length;i+=3)B.p[i]=b.base+(B.p[i]-b.base)*verticalScale;return flush(g,mode=>lmMat({c:'#ffffff',vc:true,ds:true,m:0,lk:0,glow:mode===4?'#fff0d5':mode===5?'#ffe1b5':mode===6?'#ffe5b5':undefined,gk:mode===4?1.2:mode===5?.85:mode===6?.65:0}));};
 b.prism(P,-1,.22,'#a8a59b');b.prism(scale(P,.965),.22,6.8,'#8a8571',5);b.walls(P,7.42,9.0,'#9a7ab6');
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
 const roof=p=>{const v=-.624*p[0]+.781*p[1];let d=Infinity;R.forEach((a,i)=>{const q=R[(i+1)%R.length],dx=q[0]-a[0],dz=q[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz)));d=Math.min(d,Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz));});return [p[0],(v<4?8.6:8.8)+Math.min(.95,d*.12),p[1]];};
 const tris=THREE.ShapeUtils.triangulateShape(R.map(p=>new THREE.Vector2(...p)),[]);
 function tile(a,c,d,n){if(n===0){b.tri((-.624*a[0]+.781*a[1])<4?'#8db4b7':'#a4b397',roof(a),roof(c),roof(d));return;}const ac=a.map((v,k)=>(v+c[k])/2),cd=c.map((v,k)=>(v+d[k])/2),da=d.map((v,k)=>(v+a[k])/2);tile(a,ac,da,n-1);tile(ac,c,cd,n-1);tile(da,cd,d,n-1);tile(ac,cd,da,n-1);}
 tris.forEach(t=>tile(...t.map(i=>R[i]),3));b.rim(R,eave,'#d9d2d7',.22);
 // North hall: repeated sawtooth monitor roofs. The broad outer roof and
 // south gridded sheet roof stay separate from these raised ventilator strips.
 const UV=(u,v,y)=>[.781*u-.624*v,y,.624*u+.781*v];
 for(let u=-57;u<6;u+=5){const A=UV(u,-33,9.2),B=UV(u,-7,9.2),C=UV(u+4.8,-7,10.3),E=UV(u+4.8,-33,10.3);
  if([A,B,C,E].every(p=>SGLI.inside(P,p[0],p[2]))){b.quad('#66796b',A,B,C,E);b.quad('#344850',C,E,UV(u+4.8,-33,9.2),UV(u+4.8,-7,9.2));b.beam(C,E,.1,'#aab7ae');}
 }
 // Fine standing-seam grid and a few exhaust banks on the southern roof.
 for(let u=-10;u<75;u+=3.2)for(let v=6;v<40;v+=4){const A=UV(u,v,9.2),B=UV(u,v+3.8,9.2);if([A,B].every(p=>SGLI.inside(P,p[0],p[2])))b.beam(roof([A[0],A[2]]).map((v,i)=>v+(i===1?.035:0)),roof([B[0],B[2]]).map((v,i)=>v+(i===1?.035:0)),.055,'#c4d0c4');}
 for(let v=8;v<41;v+=8)for(let u=-10;u<72;u+=4){const A=UV(u,v,9.2),B=UV(u+3.8,v,9.2);if([A,B].every(p=>SGLI.inside(P,p[0],p[2])))b.beam(roof([A[0],A[2]]).map((v,i)=>v+(i===1?.035:0)),roof([B[0],B[2]]).map((v,i)=>v+(i===1?.035:0)),.05,'#b7c8c0');}
 for(const [u,v]of [[16,10],[31,13],[50,23],[22,34]]){const c=UV(u,v,9.2);b.box(c[0],9.2,c[2],3,.35,1.4,'#d2d9d4',-.67);for(let k=-1;k<=1;k++)b.box(c[0]+k*.7,9.56,c[2],.5,.04,1.1,'#647c7c',-.67);}

 // Raised central ventilation monitor, glazed below a pale cyan cap.
 {const c=UV(25,22,0),T=SGLI.rect(c[0],c[2],24,4,-.674);if(T.every(p=>SGLI.inside(P,...p))){b.prism(T,9.65,10.15,'#789fa1',5);b.cap(out(T,.3),10.3,'#b5c9c4');b.rim(T,10.3,'#d5ded2',.12);}}
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
 // OSM context ways, © OpenStreetMap contributors (ODbL). Full original
 // footprints, not shapes traced or reconstructed from the image silhouettes.
 // 661 / 663 are the residential slabs; 662 is the low service court.
 const context=[{"id":178436578,"p":[[-47.23,-68.32],[-46.45,-65.66],[-51.29,-64.49],[-51.44,-65.12],[-50.7,-65.3],[-51.17,-67.23],[-55.01,-66.3],[-54.53,-64.32],[-53.46,-64.58],[-53.29,-63.84],[-61.03,-61.97],[-63.12,-61.47],[-62.83,-60.29],[-66.12,-59.45],[-65.96,-61.93],[-69.57,-62.17],[-69.77,-59.18],[-75.61,-61.86],[-80.1,-53.39],[-79.1,-52.44],[-77.83,-53.39],[-77.09,-52.63],[-77.98,-51.54],[-76.76,-50.38],[-74.67,-50.93],[-73.75,-50.18],[-74.8,-46.1],[-65.17,-44.51],[-64.43,-47.9],[-57.43,-49.59],[-57.75,-50.94],[-53.93,-51.87],[-53.18,-48.76],[-44.29,-50.9],[-45.08,-54.17],[-40.08,-55.56],[-42.31,-63.51],[-38.65,-64.53],[-37.81,-61.55],[-29.91,-63.75],[-31.02,-67.72],[-29.92,-68.94],[-27.16,-66.45],[-22.66,-71.44],[-26.21,-74.64],[-27.35,-73.37],[-32.06,-77.61],[-35.8,-76.7],[-36.46,-79.44],[-35.72,-79.62],[-36.35,-82.27],[-39.99,-81.39],[-39.37,-78.84],[-38.72,-78.99],[-38.04,-76.19],[-44.91,-74.53],[-45.43,-76.69],[-50.11,-75.55],[-50.91,-74.59],[-51.17,-73.54],[-50.34,-68.84],[-49.34,-68.17],[-48.52,-67.96]]},{"id":178436579,"p":[[-70.65,5.14],[-62.12,12.28],[-58.1,11.5],[-57.51,14.5],[-57.95,14.59],[-57.55,16.63],[-53.99,15.93],[-54.39,13.89],[-54.69,13.95],[-55.28,10.93],[-48.9,9.68],[-48.37,11.12],[-46.8,11.91],[-44.9,11.68],[-43.0,10.86],[-42.11,9.52],[-41.96,7.82],[-44.29,-0.67],[-42.8,-1.07],[-41.92,2.18],[-38.87,1.36],[-39.83,-2.17],[-27.71,-0.09],[-29.42,2.2],[-29.75,1.95],[-31.38,4.15],[-28.87,6.01],[-27.23,3.79],[-27.46,3.63],[-25.28,0.69],[-19.44,5.03],[-13.73,-2.65],[-17.32,-5.32],[-16.17,-6.89],[-23.21,-12.12],[-24.13,-10.89],[-38.92,-13.81],[-39.56,-16.77],[-48.87,-14.75],[-48.02,-10.93],[-52.78,-9.86],[-50.95,-1.42],[-55.02,-0.55],[-55.94,-4.81],[-60.79,-3.76],[-62.38,-5.1],[-64.81,-2.19],[-67.9,-4.69],[-65.99,-7.05],[-64.81,-6.09],[-62.65,-8.74],[-70.21,-14.91],[-71.68,-13.1],[-72.86,-14.06],[-75.34,-11.01],[-76.26,-11.77],[-74.78,-13.58],[-74.93,-14.73],[-73.94,-14.85],[-74.78,-21.72],[-76.22,-21.54],[-76.32,-22.32],[-78.42,-23.63],[-77.51,-25.09],[-73.62,-22.66],[-72.06,-25.15],[-70.12,-23.94],[-64.9,-32.22],[-66.91,-33.49],[-66.15,-34.7],[-76.44,-41.18],[-82.52,-31.54],[-85.3,-33.29],[-86.77,-30.97],[-84.03,-29.25],[-88.55,-22.07],[-87.19,-8.75]]},{"id":178436580,"p":[[9.08,75.04],[0.47,67.12],[4.62,62.39],[6.69,64.27],[8.03,62.83],[5.93,60.9],[7.8,58.79],[10.44,61.1],[14.94,60.04],[15.45,62.27],[19.73,61.27],[17.77,52.92],[21.96,51.93],[21.18,48.31],[30.66,46.13],[31.77,50.73],[44.63,53.05],[46.68,50.14],[54.85,55.35],[53.12,57.99],[56.63,60.29],[52.25,66.91],[46.56,63.16],[43.45,67.86],[42.75,68.43],[41.64,68.07],[40.84,67.35],[41.59,62.58],[31.37,60.68],[31.3,62.17],[30.6,63.62],[29.09,64.49],[27.61,65.01],[27.88,71.25],[27.83,72.37],[27.14,73.48],[25.93,74.27],[21.6,74.79],[21.2,72.07],[16.1,73.35],[15.85,78.61],[15.29,79.05],[14.16,79.21],[12.97,79.11],[12.13,78.47],[12.31,74.14]]}];
 for(const part of context){const T=part.p,tower=part.id!==178436579,h=(tower?68.9:10.8)/verticalScale;
  b.prism(T,0,h,tower?'#c9dedb':'#bebeb1');b.cap(T,h,'#b4bab4');
  if(!tower){b.rim(T,h,'#e4e3d4',.2);continue;}
  const Q=out(T,.035);
  Q.forEach((p,i)=>{const q=Q[(i+1)%Q.length],dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz);if(L<3.7)return;const a=Math.atan2(-dz,dx),n=Math.max(1,Math.round(L/2.7));
   for(let f=0;f<20;f++){const y=(4+f*3.15)/verticalScale;
    b.box((p[0]+q[0])/2,y-.2,(p[1]+q[1])/2,L,.16,.12,'#f0f0e7',a);
    for(let j=0;j<n;j++){const t=(j+.5)/n,x=lerp(p[0],q[0],t),z=lerp(p[1],q[1],t),lit=(j*7+f*3+i)%11<3;
     const w=L/n*.345,c=Math.cos(a)*w,v=-Math.sin(a)*w;b.quad(lit?'#e5d9b6':'#50666a',[x-c,y,z-v],[x+c,y,z+v],[x+c,y+1.45/verticalScale,z+v],[x-c,y+1.45/verticalScale,z-v],lit?6:0);
     b.quad('#eff1e8',[x-c,y+1.5/verticalScale,z-v],[x+c,y+1.5/verticalScale,z+v],[x+c,y+1.65/verticalScale,z+v],[x-c,y+1.65/verticalScale,z-v]);
    }
   }
  });
 }

},[]);
}
