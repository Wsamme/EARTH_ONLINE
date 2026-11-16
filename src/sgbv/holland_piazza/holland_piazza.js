/* Holland Piazza, OSM 152752624. Measured 12.1m envelope.
 * Completed facade from LN9267's 2024 photo (61); tiles show construction.
 * Original procedural coloured panels, no photograph textures or lettering. */
{
const {register,scale,center,lerp}=SGBV;
register('holland_piazza','Holland Piazza','Holland Piazza',37,(b,D,G,g)=>{
 const P=D.parts[0].p,I=scale(P,.91),C=center(P);
 // Recessed shopfronts and open canopy edge; keep the ground arcade porous.
 b.prism(scale(P,.79),-.4,4.0,'#788e88');b.facade(scale(P,.85),.25,3.8,3.55,3.2,'#345357','#9faeaa',0);
 b.prism(P,3.75,4.12,'#a8ada5');
 b.prism(I,4.1,9.15,'#a3b2a5');
 b.facade(scale(P,.975),4.15,7.8,3.65,2.5,'#344a51','#76898c',0);
 const lamps=new SGBV.Batch(G.base),fascia=new SGBV.Batch(G.base);
 const palette=['#aaa447','#b3ae50','#b1ae64','#b5a171','#b28b7b','#9f8184','#8b8693'];
 // Physical segmented fascia with a gently undulating top and lower glazing edge.
 let distance=0;P.forEach((p,i)=>{const q=P[(i+1)%P.length],dx=q[0]-p[0],dz=q[1]-p[1],len=Math.hypot(dx,dz),n=Math.max(1,Math.ceil(len/.8));
  for(let k=0;k<n;k++){
   const t=k/n,u=(k+1)/n,a=[lerp(p[0],q[0],t),lerp(p[1],q[1],t)],c=[lerp(p[0],q[0],u),lerp(p[1],q[1],u)],s=distance+len*t;
   const top=9.55+.42*Math.sin(s*.16)+.18*Math.cos(s*.34),bottom=7.5+.34*Math.sin(s*.16+.3);
   for(let j=0;j<3;j++){const lo=lerp(bottom,top,j/3),hi=lerp(bottom,top,(j+1)/3);fascia.quad(palette[(Math.floor(s*.6)+j*2+i)%palette.length],[a[0],lo,a[1]],[c[0],lo,c[1]],[c[0],hi,c[1]],[a[0],hi,a[1]]);}
   if(k%3===0)b.beam([a[0],bottom,a[1]],[a[0],top,a[1]],.035,'#9a9f8d');
  }
  if(len>5){const n=Math.ceil(len/5);for(let k=0;k<n;k++){const t=(k+.5)/n,x=lerp(p[0],q[0],t),z=lerp(p[1],q[1],t),a=Math.atan2(-dz,dx);b.box(x,.05,z,.26,3.8,.26,'#b7bdb0');b.box(x,3.42,z,Math.min(4.4,len/n),.15,1.8,'#a7afa3',a);}}
  lamps.beam([p[0],3.68,p[1]],[q[0],3.68,q[1]],.09,'#ffe4b7');distance+=len;
 });
 // Setback roof-level accommodation / plant rather than a full third slab.
 const roof=[[-7,-9],[11,-10],[13,3],[-5,3]];b.cap(P,9.20,'#99a594');b.prism(roof,9.2,11.45,'#a6aaa0');b.cap(roof,11.55,'#a6b1a1');
 b.facade(scale(roof,1.001),9.45,11.25,1.8,3.4,'#587472','#c4cbbd',0);b.rim(roof,11.8,'#a8b7a2',.20);
 b.box(C[0]-3,11.55,C[1]-2,3.8,.55,4.0,'#9aa798');
 for(const [x,z]of [[-7,9],[-3,14],[5,9]]){b.box(x,9.25,z,2.3,.45,1.7,'#9da88f');b.cap(SGBV.rect(x,z,2.1,1.5),9.73,'#5d7d4e');b.tree(x,9.7,z,.40);}
 // A sheltered corner entry, external stair and blank warm retail panel band.
 for(let i=0;i<10;i++)b.box(7+i*.25,.10+i*.24,20-i*.55,2.8,.25,.65,'#a3ada1',-.3);
 b.beam([8,2.8,20],[10.3,5.0,15],.10,'#9eada9');
 fascia.flush(g,()=>lmMat({c:'#ffffff',vc:true,ds:true,m:0,glow:'#d8b77c',gk:.085}));
 lamps.flush(g,()=>{const m=lmMat({c:'#ffffff',vc:true,ds:true,m:0,glow:'#ffe0aa',gk:.60});m.userData.bvThinLight=true;return m;});
});
}
