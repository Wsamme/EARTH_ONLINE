/* ★ The Star Vista / Star Performing Arts Centre. OSM way 104352121.
 * Original folded surfaces, metre control sections checked against the supplied
 * photo cameras. 74.5 m measured maximum; public project height 75 m.
 * No photograph textures, extracted meshes, signs or logos. See REVIEW.md.
 */
{
const {register,scale,lerp}=SGBV;
// Procedural environment: pale sky, distant dark tree line and abstract blocks.
// CubeTexture exists in r128; no network assets or render-target recursion.
let svEnv=null;
function environment(){
 if(svEnv||typeof document==='undefined')return svEnv;
 const faces=[];
 for(let k=0;k<6;k++){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,128);g.addColorStop(0,'#cfdeea');g.addColorStop(.48,'#9cb8c8');g.addColorStop(.52,'#667c77');g.addColorStop(1,'#b1b7af');x.fillStyle=g;x.fillRect(0,0,128,128);if(k!==2&&k!==3)for(let i=0;i<10;i++){const h=12+(i*13+k*7)%30;x.fillStyle=i%2?'#879c9f':'#c0cccd';x.fillRect(i*15-5,69-h,10,h);}faces.push(c);}
 svEnv=new THREE.CubeTexture(faces);svEnv.needsUpdate=true;return svEnv;
}
register('star_vista','星悦汇','The Star Vista',97,(b,D,G,g)=>{
 const metal=3,glass=2,light=4;
 const oldFlush=b.flush.bind(b);
 b.flush=(group)=>{const result=oldFlush(group,mode=>{
  const m=lmMat({c:'#ffffff',vc:true,ds:true,m:mode===glass?1:0,lc:'#ffe2b0',lk:mode===glass?.22:.12,fh:4.4,cw:2.6,glow:mode===light?'#ffe5ba':mode===9?'#3768de':mode===metal?'#c0d6df':undefined,gk:mode===light?.8:mode===9?.55:mode===metal?.065:undefined});
  if(mode===metal||mode===glass||mode===5||mode===6||mode===9){m.envMap=environment();m.combine=THREE.MixOperation;m.reflectivity=mode===glass?.32:(mode===metal||mode===9)?.19:.025;if(mode===metal||mode===9)m.emissive=new THREE.Color('#101b20');m.flatShading=true;m.needsUpdate=true;}
  return m;
 });const modes=[...b.buckets.keys()];group.children.slice(-modes.length).forEach((m,i)=>{m.userData.svMode=modes[i];if(modes[i]===0||modes[i]===light)m.castShadow=false;});return result;};
 const plazaHole=SGBV.ellipse(32,8,13,14,48);b.capHole(scale(D.parts[0].p,.985),[plazaHole],1.2,'#a6b6af');b.walls(scale(D.parts[0].p,.985),-.5,1.2,'#9caea6');b.cap(plazaHole,-1.6,'#8b9f98');
 const glowBeam=(a,q,w=.25)=>{const tri=b.tri.bind(b);b.tri=(c,p,q,r)=>tri(c,p,q,r,light);b.beam(a,q,w,'#f4e5cc');b.tri=tri;};
 const mix=(a,q,t)=>a.map((v,k)=>lerp(v,q[k],t));
 const tone=(i,j)=>['#ccd5d6','#ced7d8','#cbd4d5','#d0d9da','#cdd6d7'][(i*7+j*3)%5];
 // Roof sections follow the bend of each shell. Crossfall and the east fan are
 // independent: neither shell is a constant-height extrusion or a swept box.
 const Nouter=[[-58,66,-44.6],[-27,71,-44],[1,73.5,-41],[27,71,-30],[48,68,-20]];
 const Ninner=[[-60,63,-17.5],[-36,65,-19.3],[0,69,-9.3],[18,69,1],[32,66,12]];
 const Sinner=[[-60,65,-8.8],[-42,70,-9.6],[-10,74,-.2],[3,74,7.4],[38,74.3,48.9]];
 const Souter=[[-62,66,13.1],[-34,69,31.4],[-15,69,35],[6,70,40.5],[29,66,63.6]];
 function edge(A,t){const v=t*(A.length-1),i=Math.min(A.length-2,Math.floor(v));return mix(A[i],A[i+1],v-i);}
 function surface(A,B,t,u){return mix(edge(A,t),edge(B,t),u);}
 function plate(A,B,mode=metal,up=true){const n=32;for(let i=0;i<n;i++){
  const t=i/n,v=(i+1)/n;for(let j=0;j<12;j++){const u=j/12,w=(j+1)/12,a=surface(A,B,t,u),q=surface(A,B,v,u),r=surface(A,B,v,w),s=surface(A,B,t,w);const color=mode===5?['#b4b5ad','#b5b6af','#b6b7b1'][i%3]:mode===6?['#879c9f','#8a9ea1','#8c9fa2'][i%3]:mode===0?'#718285':tone(i,j);if(up)b.quad(color,a,s,r,q,mode);else b.quad(color,a,q,r,s,mode);}
 }}
 function face(top,bottom,seed,reverse=false){
  // Large folds are fixed by control sections; narrow panel seams subdivide the
  // planes without smoothing their normals. Every vertex is non-indexed.
  for(let seg=0;seg<top.length-1;seg++){const A=top[seg],B=top[seg+1],C=bottom[seg],E=bottom[seg+1],L=Math.hypot(B[0]-A[0],B[2]-A[2]),n=Math.ceil(L/1.25);
   for(let i=0;i<n;i++)for(let j=0;j<16;j++){const t=i/n,u=(i+1)/n,v=j/16,w=(j+1)/16;const at=(t,v)=>t+v<=1?C.map((a,k)=>a+t*(E[k]-a)+v*(A[k]-a)):B.map((a,k)=>a+(1-t)*(A[k]-a)+(1-v)*(E[k]-a));const p=at(t,v),q=at(u,v),r=at(u,w),s=at(t,w);const poly=[[t,v],[u,v],[u,w],[t,w]];
    for(const sign of [-1,1]){let result=[];for(let k=0;k<poly.length;k++){const a=poly[k],d=poly[(k+1)%poly.length],fa=sign*(a[0]+a[1]-1),fd=sign*(d[0]+d[1]-1);if(fa>=-1e-8)result.push(a);if((fa>0&&fd<0)||(fa<0&&fd>0)){const f=fa/(fa-fd);result.push([lerp(a[0],d[0],f),lerp(a[1],d[1],f)]);}}if(result.length>=3)for(let k=1;k<result.length-1;k++)b.tri(tone(i+seed,j+seg),at(...result[0]),at(...result[reverse?k+1:k]),at(...result[reverse?k:k+1]),seed===11&&seg>0&&j>=4&&j<=11?9:metal);}}
   for(let i=0;i<=n;i++){const t=i/n,a=mix(C,E,t),q=mix(A,B,t);b.beam(a,q,.045,'#8d9e9f');}
   for(let j=1;j<16;j++)b.beam(mix(C,A,j/16),mix(E,B,j/16),.035,'#a4b2b2');
   // Quiet diagonal structural lines read through the pale screened cladding.
   b.beam(seg%2?A:C,seg%2?E:B,.095,'#a4b5b8');
   if(seg===1||seg===3){const p=mix(mix(C,E,.4),mix(A,B,.4),.52),q=mix(mix(C,E,.47),mix(A,B,.47),.52),r=mix(mix(C,E,.47),mix(A,B,.47),.57),s=mix(mix(C,E,.4),mix(A,B,.4),.57);b.quad('#839ca0',p,q,r,s,metal);}
  }
 }
 function shell(A,B,north){
  const lowerA=A.map((p,i)=>[p[0]*.94+(north?0:1)-11*(1-i/4),north?41-i*.15:39-i*.5,p[2]*.93]);
  const lowerB=B.map((p,i)=>[p[0]*.95-10*(1-i/4),north?42-i*.2:39-i*.45,p[2]*.93]);
  plate(A,B,north?5:6);face(A,lowerA,north?2:5,true);face(B,lowerB,north?7:11);
  // Western end: two folded planes separated by a real recessed glass slot.
  const U=A[0],V=B[0],C=lowerA[0],E=lowerB[0],lo=55.5,hi=59;
  const atY=(p,q,y)=>mix(p,q,(y-p[1])/(q[1]-p[1]));
  const c=atY(C,U,lo),e=atY(E,V,lo),a=atY(C,U,hi),d=atY(E,V,hi);
  face([c,e],[C,E],31);face([U,V],[a,d],37);
  const inset=p=>[p[0]+2.7,p[1],p[2]];b.quad('#607e86',inset(c),inset(e),inset(d),inset(a),glass);
  for(const [p,q]of [[c,e],[a,d]])b.beam(p,q,.24,'#d6dfd9');
  for(let j=1;j<10;j++)b.beam(mix(inset(c),inset(e),j/10),mix(inset(a),inset(d),j/10),.1,'#adbfbd');
  const i=A.length-1;b.quad('#bdc8c8',lowerA[i],A[i],B[i],lowerB[i],metal);
  plate(lowerA,lowerB,0,false);
  // Roof seams, transverse ribs and diagonal grid. The broad southern roof has
  // a fan of diagonals rather than the previous uniform ladder texture.
  for(let i=0;i<=32;i++){const t=i/32;b.beam(edge(A,t).map((v,k)=>v+(k===1?.08:0)),edge(B,t).map((v,k)=>v+(k===1?.08:0)),i%4===0?.22:.09,'#e0e5e1');}
  for(let j=0;j<=8;j++)for(let i=0;i<32;i++){const p=surface(A,B,i/32,j/8),q=surface(A,B,(i+1)/32,j/8);p[1]+=.1;q[1]+=.1;b.beam(p,q,.11,'#dce2df');}
  if(north){for(const t of [.08,.16,.24])for(const u of [.3,.65]){const Q=[[t-.025,u-.08],[t+.025,u-.08],[t+.025,u+.08],[t-.025,u+.08]].map(([t,u])=>{const p=surface(A,B,t,u);p[1]+=.035;return p;});b.quad('#899c9d',Q[0],Q[3],Q[2],Q[1],5);}
   for(let i=0;i<16;i++)b.beam(edge(A,i/16).map((v,k)=>v+(k===1?.15:0)),edge(B,Math.min(1,i/16+.25)).map((v,k)=>v+(k===1?.15:0)),.2,'#edf0eb');}
  else{for(let u=0;u<=1;u+=.1){const bend=surface(A,B,.43,.22);bend[1]+=.25;const q=surface(A,B,1,u);q[1]+=.25;b.beam(bend,q,.25,'#e2e8e3');}for(let u=0;u<=1;u+=.1){const p=surface(A,B,0,u),q=surface(A,B,.43,.22);p[1]+=.2;q[1]+=.2;b.beam(p,q,.24,'#e0e6e2');}}
  if(!north){const p=surface(A,B,.43,.22),q=surface(A,B,1,.78);p[1]+=.38;q[1]+=.38;b.beam(p,q,1.1,'#dfe7e3');
   const slit=[];for(let i=0;i<=16;i++){const t=.37+i/16*.33,u=.72+.08*Math.sin(i/16*Math.PI);const p=surface(A,B,t,u);slit.push([p[0],p[1]+.16,p[2]]);}for(let i=0;i<slit.length-1;i++)b.beam(slit[i],slit[i+1],.65,'#647f83');}
  for(let i=0;i<=110;i++){const p=edge(A,i/110),q=edge(B,i/110);p[1]+=.06;q[1]+=.06;b.beam(p,q,.045,north?'#cbd0c9':'#bac8c9');}
  // Reveal: a deep inset dark walk around the building, with independent upper
  // and lower edges. Horizontal depth is 3–6 m, not a line painted on the wall.
  const ribbonTopA=lowerA.map((p,i)=>north&&i===4?[65,37.5,-14]:[A[i][0]*1.025-10*(1-i/4),p[1]-2.5,A[i][2]*1.025]);
  const ribbonTopB=lowerB.map((p,i)=>north&&i===4?[39,37.5,18]:[B[i][0]*1.025-10*(1-i/4),p[1]-2.5,B[i][2]*1.025]);
  const ribbonBottomA=ribbonTopA.map((p,i)=>[p[0]*.90,north?24+i*.3:[29,30,32,33,30][i],p[2]*.80]);
  const ribbonBottomB=ribbonTopB.map((p,i)=>[p[0]*.90,north?[29,30,32,33,30][i]:25-i*.15,p[2]*.80]);
  plate(ribbonTopA,ribbonTopB,0);face(ribbonTopA,ribbonBottomA,19,true);face(ribbonTopB,ribbonBottomB,23);
  for(const i of [0,4])b.quad('#b2c0c0',ribbonBottomA[i],ribbonBottomB[i],ribbonTopB[i],ribbonTopA[i],metal);
  plate(ribbonBottomA,ribbonBottomB,0,false);
  for(const E of [ribbonTopA,ribbonTopB])for(let i=0;i<E.length-1;i++){b.beam(E[i],E[i+1],.25,'#e5e8e1');glowBeam(E[i].map((v,k)=>v+(k===1?.2:0)),E[i+1].map((v,k)=>v+(k===1?.2:0)),.35);const p=E[i].map((v,k)=>v+(k===1?-.2:0)),q=E[i+1].map((v,k)=>v+(k===1?-.2:0));b.quad('#f5ddaf',p,q,q.map((v,k)=>v+(k===1?-.1:0)),p.map((v,k)=>v+(k===1?-.1:0)),light);}
  // Dark recessed curtain wall inside the slot and sparse supporting posts.
  for(const E of [lowerA,lowerB])for(let i=0;i<E.length-1;i++){const p=E[i],q=E[i+1],a=[p[0]*.92,p[1]-2.8,p[2]*.92],d=[q[0]*.92,q[1]-2.8,q[2]*.92];b.quad('#293c40',a,d,[d[0],d[1]+3,d[2]],[a[0],a[1]+3,a[2]],glass);}
 }
 shell(Nouter,Ninner,true);shell(Sinner,Souter,false);
 // Eastern nose: the high roof stops at the reveal; a separate lower apron
 // cantilevers forward. This step is visible in both top and east photographs.
 {const a=[48,55,-20],d=[32,55,12],e=[63,53.5,-13.7],f=[38,53.5,17.5],c=[58,40,-11],h=[35,40,14];
 b.quad('#c6d0ce',a,e,f,d,metal);b.quad('#bdc8c8',e,c,h,f,metal);
 b.quad('#b4c2c2',a,[45,40,-16],c,e,metal);b.quad('#b7c5c5',d,f,h,[30,40,10],metal);
 b.quad('#53696d',[45,40,-16],[30,40,10],h,c);
 for(let i=0;i<=18;i++){const t=i/18;b.beam(mix(a,d,t),mix(e,f,t),.09,'#e6eae5');}
 for(let i=0;i<=9;i++){const t=i/9;b.beam(mix(a,e,t),mix(d,f,t),.1,'#dce4df');}
 for(let i=0;i<=16;i++){const t=i/16;b.beam(mix(e,f,t),mix(c,h,t),.05,'#a1b1b1');}}

 // Distinct auditorium mass behind the open foyer. Its eastern edge is recessed
 // 20–30 m behind the shell eaves, leaving the 33 m grand atrium open.
 const theatre=[[-55,-12],[-33,-15],[-12,-7],[8,7],[4,29],[-27,29],[-54,14]];
 b.prism(theatre,24,58,'#687b7d');b.cap(theatre,24,'#596f74');b.facade([[8,7],[4,29]],24,50,4.3,2.7,'#516b74','#96adae',.12);
 // Deep rear wall of the naturally ventilated foyer: the court stays open in
 // front of this curved glazing. This is not a floor-to-roof fill at the eave.
 b.facade([[-25,-12],[-15,-6],[-8,6],[-8,18],[-18,26]],-1.4,32.8,4.1,2.7,'#314b54','#849da0',.1);
 // Set-back shopping galleries: B1/L1/L2, with a mezzanine/foyer above. Neither
 // base wing crosses the eastern atrium void. Terrace levels follow the slope.
 const north=[[-64,-40],[-28,-42],[6,-33],[39,-19],[54,-7],[50,3],[33,0],[12,-11],[-17,-17],[-60,-18]];
 const south=[[-61,12],[-38,19],[-10,29],[18,44],[30,52],[23,57],[-5,43],[-39,32],[-66,23]];
 for(const [Q,start]of [[north,1],[south,2]])for(let f=0;f<3;f++){
  const R=scale(Q,1-f*.026),lo=start+f*4.5,hi=lo+3.8;b.prism(R,lo,hi,'#758d91',glass);b.facade(R,lo,hi,3.8,2.5,'#79969b','#b1c1c0',.14);b.prism(scale(R,1.06),hi,hi+.65,'#cad2cd');b.rim(scale(R,1.05),hi+1.2,'#b8c7c2',.1);
 }
 for(const Q of [north,south]){const R=scale(Q,.87);b.facade(R,15.2,23.4,4.1,2.3,'#7e989c','#afbfbc',.14);b.prism(scale(R,1.12),23.4,24.1,'#bbc9c4');}
 // Continuous low glazed entrance hood on the north promenade, tucked below
 // the large theatre overhang and segmented along the changing perimeter.
 const hoodOuter=[[-70,-40],[-60,-52],[-25,-53],[5,-42],[37,-28],[59,-12]],hoodInner=[[-64,-35],[-56,-44],[-24,-45],[4,-35],[32,-22],[52,-7]];
 for(let i=0;i<hoodOuter.length-1;i++)for(let j=0;j<8;j++){const t=j/8,u=(j+1)/8,p=hoodOuter[i].map((v,k)=>lerp(v,hoodOuter[i+1][k],t)),q=hoodOuter[i].map((v,k)=>lerp(v,hoodOuter[i+1][k],u)),r=hoodInner[i].map((v,k)=>lerp(v,hoodInner[i+1][k],u)),s=hoodInner[i].map((v,k)=>lerp(v,hoodInner[i+1][k],t));b.quad('#92adb0',[p[0],5.4,p[1]],[s[0],6.8,s[1]],[r[0],6.8,r[1]],[q[0],5.4,q[1]],glass);b.beam([p[0],5.45,p[1]],[s[0],6.85,s[1]],.12,'#c6d4cc');if(j%4===0)b.beam([p[0],0,p[1]],[p[0],5.4,p[1]],.2,'#b6c7c0');}
 // Northeast entrance connector follows the projecting OSM wing toward MRT.
 const link=[[28,-44],[50,-39],[79,-47],[82,-40],[78,-20],[80,-8],[74,-1],[66,-9],[64,-20],[51,-27],[38,-32]],linkY=(x,z)=>6.3+.04*(x-40);
 b.cap(link,linkY,'#9db7b8',glass);for(let i=0;i<link.length;i++){const p=link[i],q=link[(i+1)%link.length];b.beam([p[0],linkY(...p),p[1]],[q[0],linkY(...q),q[1]],.17,'#c4d1ca');if(i%2===0)b.beam([p[0],0,p[1]],[p[0],linkY(...p),p[1]],.22,'#b6c8bf');}
 for(let x=35;x<82;x+=3)for(let z=-45;z<-7;z+=3)if(SGBV.inside(link,x,z)&&SGBV.inside(link,x+3,z))b.beam([x,linkY(x,z)+.04,z],[x+3,linkY(x+3,z)+.04,z],.08,'#c7d3cc');
 // Curving recessed glazed amphitheatre rim, with a true central opening.
 const arc=(r,zr,angle)=>[32+r*Math.cos(angle),8+zr*Math.sin(angle)];
 for(let k=0;k<11;k++)for(let j=0;j<32;j++){const t=-1.35+j/32*2.7,u=-1.35+(j+1)/32*2.7,r=12+k*1.95,zr=13+k*1.45,y=-1.8+k*.58,p=arc(r,zr,t),q=arc(r,zr,u),s=arc(r-1.95,zr-1.45,t),v=arc(r-1.95,zr-1.45,u);b.quad('#a6b7af',[...p.slice(0,1),y,p[1]],[q[0],y,q[1]],[v[0],y,v[1]],[s[0],y,s[1]]);b.quad('#84998e',[p[0],y-.58,p[1]],[q[0],y-.58,q[1]],[q[0],y,q[1]],[p[0],y,p[1]]);}
 for(let j=0;j<48;j++){const t=-1.4+j/48*2.8,u=-1.4+(j+1)/48*2.8,p=arc(37,30,t),q=arc(37,30,u),s=arc(32,25,t),v=arc(32,25,u);b.quad('#97b1b5',[p[0],5,p[1]],[q[0],5,q[1]],[v[0],6.8,v[1]],[s[0],6.8,s[1]],glass);b.beam([p[0],5,p[1]],[s[0],6.8,s[1]],.1,'#c7d3ce');}
 // A two-level curved retail rim beneath the amphitheatre canopy. The court
 // remains open: only the annular galleries are built, with a planted outer edge.
 const rimOuter=[],rimInner=[];for(let j=0;j<=48;j++){const t=-1.4+j/48*2.8;rimOuter.push(arc(37,30,t));rimInner.push(arc(31.5,24.5,t));}
 const rimPlan=[...rimOuter,...rimInner.slice().reverse()];b.prism(rimPlan,-.5,1.7,'#879f9e',glass);b.cap(rimPlan,3.3,'#bcc8be');
 b.facade(rimOuter,1.7,5.1,3.4,2.5,'#718e94','#b7c7c1',.1);b.rim(rimOuter,5.05,'#d4ded4',.18);for(let i=0;i<rimOuter.length-1;i++)glowBeam([rimOuter[i][0],5.2,rimOuter[i][1]],[rimOuter[i+1][0],5.2,rimOuter[i+1][1]],.18);
 const plantOuter=rimOuter.map(p=>[p[0]-.8,p[1]]),plantInner=rimOuter.map(p=>[p[0]-2,p[1]]);b.cap([...plantOuter,...plantInner.reverse()],2.7,'#55764a');
 // Foyer supports: pale sloping columns and shaded soffits, not a filled podium.
 for(const [x,z,dx,dz]of [[-54,-18,3,2],[-31,-10,3,1],[-5,1,3,-1],[18,13,1,-2],[27,30,-2,-2],[-45,25,3,-2],[-20,30,3,-2]])b.beam([x,0,z],[x+dx,35,z+dz],1.05,'#d3d9d2');
 for(const [x,z]of [[-28,-7],[-4,5],[18,18]]){glowBeam([x,23.8,z],[x+10,23.8,z+3],.3);b.quad('#f0ddbb',[x-2,1.3,z-2],[x+2,1.3,z-2],[x+2,1.3,z+2],[x-2,1.3,z+2],light);}
 // Glazed west fissure and an open escalator/ramp behind it.
 b.facade([[-60,-14],[-57,12]],3,34,5,2.3,'#6c8990','#afc0bd',.1);
 for(const [a,q]of [[[34,1,5],[10,17,-3]],[[9,17,-3],[-14,28,-10]]]){b.beam(a,q,2.6,'#8d9f9d');for(const dz of [-1.4,1.4])b.beam([a[0],a[1]+1,a[2]+dz],[q[0],q[1]+1,q[2]+dz],.14,'#ced7cf');}
 // Landscaped roof walk in the sinuous gap; roof equipment stays below the rim.
 const garden=[[-57,-15],[-34,-16],[-4,-8],[20,6],[34,23],[30,27],[16,10],[-6,-4],[-36,-12],[-57,-11]];
 b.garden(garden,55,false);for(let i=0;i<3;i++)b.box(-49+i*7,62,-32,4,1.4,3,'#a3b0af');
 // Street context is a separate mesh, explicitly excluded from silhouette masks.
 const c=new SGBV.Batch(G.base),ctx=new THREE.Group();ctx.userData.svContext=true;
 c.prism(scale(D.parts[0].p,1.01),-.7,-.15,'#bbc3b9');
 for(const [x,z]of [[-77,-32],[-72,32],[-40,44],[-12,54],[43,57],[72,20],[70,-20],[-20,-50]]){c.box(x,0,z,5,.5,3,'#a9b3a4');c.tree(x,.5,z,1.05);}
 for(let i=0;i<7;i++)c.box(57+i*.8,-.2+i*.23,28,1.1,.25,14,'#c3cbc0',-.6);
 for(const Q of [[[-72,-18],[-63,-18],[-63,1],[-72,1]],[[42,-15],[59,-9],[58,-4],[41,-10]]]){c.prism(Q,5.3,5.6,'#c3d0cc');for(const p of Q)c.beam([p[0],0,p[1]],[p[0],5.3,p[1]],.2,'#b7c7c0');}
 c.flush(ctx);g.add(ctx);
});
}
