/* Holland Road Shopping Centre: OSM way 152638469.
 * Current 2024 cream/red elevation. Measured envelope 19.7m incl. roof plant.
 * Original procedural geometry; no photo textures or modeled lettering. */
{
const {register,scale,center,out,lerp}=SGBV;
register('holland_road_sc','Holland Road Shopping Centre','Holland Road Shopping Centre',55,(b,D,G,g)=>{
 const P=D.parts[0].p,C=center(P),I=scale(P,.91),O=out(P,.12);
 b.prism(I,3.3,14.5,'#d5cdb5');b.prism(scale(P,.82),-.6,3.3,'#8f968a');b.cap(P,14.65,'#90958a');
 // Open covered arcade: setback shop glazing and a continuous projecting soffit.
 b.facade(scale(P,.86),.25,3.3,3.05,3.2,'#344a48','#aaa99a',0);
 b.prism(P,3.25,3.65,'#ded9c7');
 P.forEach((p,i)=>{const q=P[(i+1)%P.length],dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz),n=Math.max(1,Math.round(L/5.1)),a=Math.atan2(-dz,dx);
  for(let j=0;j<n;j++){
   const t=(j+.5)/n,x=lerp(p[0],q[0],t),z=lerp(p[1],q[1],t),w=L/n-.26;
   // Cream piers and projecting red/pink boxed bays across four levels.
   b.box(lerp(p[0],q[0],j/n),-.1,lerp(p[1],q[1],j/n),.35,3.5,.35,'#d0cbbd');
   for(let f=0;f<3;f++){
    const y=3.65+f*3.45,glass=[p[0]+dx*j/n,y+1.05,p[1]+dz*j/n];
    b.quad('#dcd5bf',[p[0]+dx*j/n,y,p[1]+dz*j/n],[p[0]+dx*(j+1)/n,y,p[1]+dz*(j+1)/n],[p[0]+dx*(j+1)/n,y+3.45,p[1]+dz*(j+1)/n],[p[0]+dx*j/n,y+3.45,p[1]+dz*j/n]);
    // Dark ribbon behind the projecting frame, thin cream transom above.
    const ux=dx/L,uz=dz/L,ox=(O[i][0]+O[(i+1)%O.length][0]-p[0]-q[0])/2,oz=(O[i][1]+O[(i+1)%O.length][1]-p[1]-q[1])/2;
    b.quad('#465552',[x+ox-ux*w/2,y+1.05,z+oz-uz*w/2],[x+ox+ux*w/2,y+1.05,z+oz+uz*w/2],[x+ox+ux*w/2,y+2.65,z+oz+uz*w/2],[x+ox-ux*w/2,y+2.65,z+oz-uz*w/2],2);
    const red=(j+f+i)%4===0?'#c98b7c':'#b86b70';
    if(i<=7){b.box(x,y-.02,z,w,1.08,.32,red,a);for(const v of [-1,1])b.box(x+v*ux*(w/2-.14),y,z+v*uz*(w/2-.14),.28,3.45,.5,red,a);}
   }
   if(i<=7)b.box(x,2.8,z,Math.min(w,3.4),.38,.20,'#e8d8b2',a,2);
  }
 });
 // Rounded corner follows the multi-segment OSM road edge rather than a box.
 b.rim(P,14.95,'#b66b73',.38);b.rim(scale(P,.97),15.25,'#ded2bd',.25);
 // Roof carpark: faded surface, dashed bays, exposed service ducts and red parapet.
 b.rim(scale(P,.98),15.0,'#bf7d78',.55);
 // Stepped green upper deck and the characteristic curved red roof canopy.
 const R=scale(P,.92);function clipZ(Q,z){const out=[];Q.forEach((p,i)=>{const q=Q[(i+1)%Q.length],a=p[1]<z,c=q[1]<z;if(a)out.push(p);if(a!==c){const t=(z-p[1])/(q[1]-p[1]);out.push([lerp(p[0],q[0],t),z]);}});return out;}
 const green=clipZ(R,6);b.prism(green,14.65,15.2,'#a8aaa0');b.cap(green,15.22,'#809789');
 const curb=scale(P,.80);b.capHole(P,[curb],15.45,'#b66870');
 const court=SGBV.rect(-4,11,8,12,-.5);b.cap(court,14.73,'#5d9c87');b.rim(court,14.85,'#e2dccb',.14);
 for(let i=0;i<4;i++)b.box(-5+i*1.3,14.8,10+i*.5,.7,.7,.7,['#d8b35c','#b88171','#7b9aa8','#c7ad70'][i]);
 const roof=scale(P,.76);for(let i=0;i<roof.length;i++){const p=roof[i],q=roof[(i+1)%roof.length];if(Math.hypot(q[0]-p[0],q[1]-p[1])>8)for(let t=.1;t<.9;t+=.17){const x=lerp(p[0],q[0],t),z=lerp(p[1],q[1],t);b.box(x,14.68,z,2.1,.025,.09,'#d4cbb2',-.55);}}
 const N=P[10],S=P[6];b.box(S[0]+5,14.7,S[1]-9,10,2.6,7,'#c5a493',-.55);b.box(S[0]+5,17.3,S[1]-9,10.5,.25,7.5,'#b66f73',-.55);
 b.box(N[0]+4,14.7,N[1]+9,6,1.5,6,'#b8b7a6',-.35);
 b.box(C[0]-2,14.7,C[1],3.4,5,3.4,'#7d8783');
 for(const z of [-5,1,7]){b.box(C[0]+3,14.7,C[1]+z,2.4,1.1,2.8,'#9ca69d');b.box(C[0]+3,15.82,C[1]+z,1.8,.07,2.2,'#637672');}
 for(const i of [1,3,5,8,10]){const p=P[i];b.box(p[0]*.92,14.7,p[1]*.92,.08,1.8,.08,'#aeb2a6');b.box(p[0]*.92,16.45,p[1]*.92,1.5,.12,.45,'#e4d9bc',0,2);}
 // Continuous arcade soffit and blank illuminated panels, informed by LTA's
 // historical night photograph; current-colour photometry is not documented.
 const lights=new SGBV.Batch(G.base);
 P.forEach((p,i)=>{const q=P[(i+1)%P.length];if(i>7)return;lights.beam([p[0],3.17,p[1]],[q[0],3.17,q[1]],.12,'#ffe4b8');const dx=q[0]-p[0],dz=q[1]-p[1],len=Math.hypot(dx,dz),n=Math.max(1,Math.round(len/5.1));for(let j=0;j<n;j++){const t=(j+.5)/n,x=lerp(p[0],q[0],t),z=lerp(p[1],q[1],t);lights.box(x,2.82,z,Math.min(3.4,len/n-.4),.30,.25,'#ffe3aa',Math.atan2(-dz,dx));}});
 lights.flush(g,()=>lmMat({c:'#ffffff',vc:true,ds:true,m:0,glow:'#ffdeb0',gk:.70}));

});
}
