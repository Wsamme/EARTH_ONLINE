/* J'Den (聚鼎), OSM 158227102. Published future design, approximate.
 * CapitaLand: 150 m AMSL, 38 residential levels above two retail levels.
 * 139 m above grade assumes 11 m ground; not measured from obsolete JCube tiles.
 * Original H-plan geometry from the official brochure / artist impressions.
 */
{
const {register,rect,scale,out,ellipse,smooth}=SGJE;
register('j_den','聚鼎',"J'Den",83,(b,D,G,g)=>{
 const P=D.parts[0].p,angle=.188,H=139,base=11.2,fh=3.3,sky=base+21*fh;
 // The podium retains the OSM site polygon, with recessed double-height shopfronts.
 b.prism(P,-.8,1,'#bab5a8');
 b.prism(scale(P,.986),1,10.3,'#9b9582');
 b.facade(out(scale(P,.986),.06),1,9.8,4.5,3,'#6f8584','#b9b7a4',.18);
 b.band(P,5.2,.4,'#c9c3ad');b.band(P,10.25,.3,'#515b50');
 // The artist impression has a sweeping bronze veil with broad low scallops,
 // revealing a dark clerestory below the garden deck. Keep it within the site.
 const screen=scale(P,.997),veil=(x,z)=>9.95-3.45*Math.pow(Math.max(0,Math.sin((x*.94-z*.34+16)*.071)),2);
 screen.forEach((p,i)=>{const q=screen[(i+1)%screen.length],dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz),n=Math.ceil(L/1.2);for(let k=0;k<n;k++){
  const t=k/n,u=(k+1)/n,x=p[0]+dx*t,z=p[1]+dz*t,X=p[0]+dx*u,Z=p[1]+dz*u,h=veil(x,z),H=veil(X,Z);
  b.quad('#b2a07d',[x,5.65,z],[X,5.65,Z],[X,H,Z],[x,h,z]);
  b.box(x,5.65,z,.1,h-5.65,.22,'#c1af8b',Math.atan2(-dz,dx));
 }});
 b.garden(scale(P,.97),10.6,false);
 // Local plan axes follow the north OSM boundary; the tower's two staggered
 // residential wings and connecting circulation core occupy the southern half.
 const pt=(x,z)=>[-4+x*Math.cos(angle)+z*Math.sin(angle),14-x*Math.sin(angle)+z*Math.cos(angle)];
 const poly=(x,z,w,d)=>{const c=pt(x,z);return rect(c[0],c[1],w,d,angle);};
 const wings=[poly(0,-6,66,13.6),poly(-3,15,57,13.4)],core=poly(-2,4.5,22,12.5);
 b.prism(core,base,H-2.2,'#777b75');
 for(const [wi,T] of wings.entries()){
  for(const [lo,hi]of [[base,sky],[sky+fh,H-2.2]]){
   b.prism(scale(T,.965),lo,hi,'#657c86');
   b.facade(T,lo,hi,fh,2.8,'#6f8994','#3c4c52',.12);
  }
  // Thin projecting balcony slabs, glass rails and vertical bronze dividers.
  for(let f=0;f<38;f++){
   const y=base+f*fh;if(f===21)continue;
   b.band(out(T,.75),y,.24,'#aeb5ae');
   b.band(out(T,.78),y+.28,.62,'#62777e');
   b.rim(out(T,.8),y+.96,'#4c5c60',.085);
   // Three recessed balcony stacks along the broad elevations.
   for(const x of [-17,0,17])for(const side of [-1,1]){
    const z=(wi?15:-6)+side*7.35,c=pt(x+(wi?-3:0),z),a=angle;
    b.box(c[0],y+.3,c[1],6.6,1.0,.12,'#475f68',a,2);
    const d=pt(x+(wi?-3:0)-3.45,z);b.box(d[0],y,d[1],.22,fh,.8,'#a3977b',a);
   }
  }
  b.cap(out(T,.65),H-2.1,'#929b94');b.rim(out(T,.65),H-1.65,'#b7b6a7',.24);
  // The open level-24 sky terrace reads as one planted dark notch.
  b.garden(out(T,.5),sky+.08,false);
  for(const x of [-29,-18,0,18,29]){if(wi&&Math.abs(x)>27)continue;const c=pt(x+(wi?-3:0),wi?15:-6);b.box(c[0],sky,c[1],.65,fh,.65,'#9a9a86',angle);}
 }
 // Recessed roof services and a slender, bronze-edged crown.
 b.prism(poly(-2,4,18,14),H-2.1,H,'#858a7d');
 for(const x of [-31,-21,21,31]){const c=pt(x,-6);b.box(c[0],base,c[1],.5,H-base,.55,'#978a70',angle);}
 // L24 shrubs are small enough to preserve the open terrace silhouette.
 for(const x of [-25,-12,12,25])for(const z of [-6,15]){const c=pt(x,z);b.tree(c[0],sky+.2,c[1],.48);}
 // Roof garden, 50 m lake pool, curved leisure water and sheltered clubhouse.
 const pool=poly(-2,-27,51,6);b.prism(pool,10.67,10.78,'#539ba3');b.rim(pool,10.83,'#c2c7b6',.22);
 const leisure=ellipse(26,-14,10,16,24,.2);b.cap(leisure,10.75,'#5c9da1');b.rim(leisure,10.84,'#acbaa7',.22);
 // Softly rounded clubhouse glazing and its thin, projecting curved roof follow
 // the dusk impression; a small rear clerestory sits above the low front eave.
 const club=smooth(poly(-25,-38,17,14),2),clubRoof=out(club,.9);
 b.prism(club,10.7,14,'#607575',2);b.facade(out(club,.04),10.7,13.85,3.15,2.5,'#7b8a80','#6c6859',.1);
 b.prism(clubRoof,14,14.28,'#646a5c');b.rim(clubRoof,14.3,'#3e4b49',.12);
 const clerestory=smooth(poly(-25,-41,11,5),1);b.prism(clerestory,14.28,15.15,'#69817f',2);b.prism(out(clerestory,.35),15.15,15.35,'#59655d');
 for(const [x,z]of [[-43,-21],[-39,-5],[-34,-37],[-20,-39],[-4,-40],[14,-41],[32,-38],[40,-21],[40,1],[27,29],[17,42],[-22,29]])b.tree(x,10.7,z,.8);
 // Blank canopy fascia and short J'Walk connector at retail level two.
 const A=[38,7],B=[58,3];b.beam([A[0],5.7,A[1]],[B[0],5.7,B[1]],3.0,'#b9b5a5');b.beam([A[0],8.4,A[1]],[B[0],8.4,B[1]],3.4,'#b7b9ab');
 for(const side of [-1,1]){b.beam([38,6,7+side*1.45],[58,6,3+side*1.45],.12,'#6c7d7e');b.beam([38,7.15,7+side*1.45],[58,7.15,3+side*1.45],.12,'#6c7d7e');for(let t=0;t<=1;t+=.2)b.beam([38+20*t,5.9,7-4*t+side*1.45],[38+20*t,8.35,7-4*t+side*1.45],.12,'#76827c');}
});
// Keep labels and night-height uniforms at the modeled crown until shared data is regenerated.
LANDMARKS.sgje_j_den.h=139;
}
