/* OSM per-parcel Little India rows. Street View is an external visual reference,
 * never a texture. Compact front panels keep the district below 250k triangles. */
{
const {register,center,inside}=SGLI;
// The extract also contains modern hotels, a bus terminal and untagged HDBs.
// Keep those in the ordinary city pass rather than turning them into shophouses.
const source=SGLI.data.li_shophouses,contextIds=new Set([178436578,178436579,178436580]);
const excluded=source.parts.filter(p=>!contextIds.has(p.id)&&((p.area>600&&!+p.tags['building:levels']&&p.tags.building==='residential')||p.area>1500||/Tekka Place|Hilton Garden/i.test(p.tags.name||'')));
const excludeIds=new Set(excluded.map(p=>p.id));
source.parts=source.parts.filter(p=>!excludeIds.has(p.id));
register('li_shophouses','小印度店屋街区','Little India Shophouse Rows',850,(b,D,G,g)=>{
 const flush=b.flush.bind(b);b.flush=group=>flush(group,mode=>lmMat({c:'#ffffff',vc:true,ds:true,m:0,lk:0,glow:mode===4?'#ffdfac':mode===5?'#ffedc9':undefined,gk:mode===4?.8:mode===5?.45:0}));
 const palette=['#e6c66e','#b8d9c6','#94b9cf','#e3a6ae','#c5b4d5','#efe2bf','#dfad83','#73b9ab','#c4cf76','#dbcfb7','#789dc4','#dfb9c3'];
 const originalBase=b.base,used=[];
 function clip(P,V,k,sign){const R=[];P.forEach((p,i)=>{const q=P[(i+1)%P.length],a=V(p)-k,c=V(q)-k,A=a*sign>=0,B=c*sign>=0;if(A)R.push(p);if(A!==B){const t=a/(a-c);R.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}});return R;}
 for(const part of D.parts){
  // These two slabs have full detail in tekka_centre; their skip masks remain.
  if(contextIds.has(part.id))continue;
  const P=part.p,C=center(P);if(!C.every(Number.isFinite))continue;b.base=G.at(...C);
  const seed=(Math.imul(part.id,1664525)+1013904223)>>>0,tags=part.tags||{},street=part.front.street;
  const tagged=+tags['building:levels'],levels=tagged||((street==='Serangoon Road'||street==='Race Course Road')&&seed%5===0?3:2);
  const ground=3.9,measured=parseFloat(tags.height),H=measured>3?measured:ground+(levels-1)*3.3,eave=H-.2,wall=palette[seed%palette.length],trim='#f2ebd9';
  // Closest segment to the supplied nearest named street point.
  const target=part.front.point;let edge=0,best=Infinity;
  P.forEach((p,i)=>{const q=P[(i+1)%P.length],dx=q[0]-p[0],dz=q[1]-p[1],ll=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((target[0]-p[0])*dx+(target[1]-p[1])*dz)/ll)),d=Math.hypot(p[0]+dx*t-target[0],p[1]+dz*t-target[1])+.0001*Math.hypot((p[0]+q[0])/2-target[0],(p[1]+q[1])/2-target[1]);if(ll>2&&d<best){best=d;edge=i;}});
  const p=P[edge],q=P[(edge+1)%P.length],L=Math.hypot(q[0]-p[0],q[1]-p[1]),ux=(q[0]-p[0])/L,uz=(q[1]-p[1])/L;
  let nx=-uz,nz=ux;if((target[0]-(p[0]+q[0])/2)*nx+(target[1]-(p[1]+q[1])/2)*nz<0){nx=-nx;nz=-nz;}
  const F=(u,y,v=0)=>[p[0]+ux*u+nx*v,y,p[1]+uz*u+nz*v],V=r=>(r[0]-p[0])*nx+(r[1]-p[1])*nz,ang=Math.atan2(-uz,ux);
  const panel=(u,y,w,h,c,v=.04,mode=0)=>b.quad(c,F(u-w/2,y,v),F(u+w/2,y,v),F(u+w/2,y+h,v),F(u-w/2,y+h,v),mode);
  const bar=(u,y,w,h,d,c,v=0)=>{const r=F(u,y,v);b.box(r[0],y,r[2],w,h,d,c,ang);};
  // Real 1.8 m deep five-foot way: no opaque wall across the column line.
  const rear=clip(P,V,-1.8,-1);if(rear.length>=3)b.prism(rear,-.25,ground,wall);
  b.prism(P,ground,eave,wall);
  const n=Math.max(1,Math.min(5,Math.round(L/5.8))),bay=L/n;
  for(let j=0;j<=n;j++){const u=j*bay;bar(u,.03,.32,ground,.36,trim,-.15);panel(u,ground,.24,eave-ground,trim);}
  bar(L/2,3.35,L,.18,.55,trim);bar(L/2,eave-.3,L,.16,.46,trim);bar(L/2,eave,L,.16,.65,trim);
  for(let j=0;j<n;j++){
   const u=(j+.5)*bay,w=bay*.82;
   panel(u,.15,w,2.85,'#727b68',-1.79,5);panel(u,2.45,w,.07,trim,-1.77);panel(u,.15,.055,2.85,trim,-1.76);
   panel(u,3.45,w,.38,seed%4?'#e5d4b4':'#6b8e80',.08,4);
   const windows=bay<5.3?2:3;
   for(let f=1;f<levels;f++)for(let k=0;k<windows;k++){
    const x=u+(k-(windows-1)/2)*bay/(windows+.8),y=ground+(f-1)*3.3+.6,ww=Math.min(1.05,bay*.23),wh=Math.min(2.05,H-y-.4),shutter=['#376e68','#647f92','#715d58','#567760'][seed%4],lit=(seed+j*7+f*13+k)%19===0;
    panel(x,y,ww+.18,wh+.18,trim,.075);panel(x,y+.09,ww,wh-.02,lit?'#d0b98e':shutter,.085,lit?5:0);
    panel(x,y+.1,.035,wh-.03,trim,.095);
    // Five broad relief strokes remain legible at district LOD.
    if(!lit)for(let sl=1;sl<=5;sl++)panel(x,y+.15+sl*(wh-.25)/6,ww-.06,.055,'#98b1a2',.10);
   }
  }
  const depth=Math.max(...P.map(r=>-V(r))),rise=Math.min(1.8,depth*.13),ridge=-depth*.48;
  if(tags['roof:shape']==='flat'||levels>3||seed%5===0){b.cap(P,H+.25,'#b6b5a7');panel(L/2,H-.1,L,.6,wall);bar(L/2,H+.5,L,.15,.45,trim);}
  else{const Y=(x,z)=>eave+rise*Math.max(0,1-Math.abs(V([x,z])-ridge)/Math.max(1,depth*.52));
   for(const sign of [-1,1]){const R=clip(P,V,ridge,sign);if(R.length>=3)b.cap(R,Y,seed%2?'#ac654d':'#b97d5c');}
   // Party walls close the small roof wedges, staying on the actual footprint.
   P.forEach((r,i)=>{const s=P[(i+1)%P.length];b.quad(wall,[r[0],eave,r[1]],[s[0],eave,s[1]],[s[0],Y(...s),s[1]],[r[0],Y(...r),r[1]]);});
  }
  used.push({id:part.id,levels,height:H,ground:b.base});
 }
 b.base=originalBase;
 g.userData.liRows={units:used.length,excluded:excluded.map(p=>p.id),providedParts:1313,contextInTekka:[...contextIds],minHeight:Math.min(...used.map(p=>p.height)),maxHeight:Math.max(...used.map(p=>p.height)),groundRange:[Math.min(...used.map(p=>p.ground)),Math.max(...used.map(p=>p.ground))]};
},[]);
}
