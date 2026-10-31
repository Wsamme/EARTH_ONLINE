/* ★ Fusionopolis One: ways 175841411, 173033567, 173033568,
 * 173033570. Symbiosis / Connexis North / South, measured 135.9 m.
 * Three curved floor plates, white sky gardens, roof oculi and connecting bridges.
 */
{
const {register,scale,center,smooth,ellipse}=SGBV;
register('fusionopolis_one','启汇城一期','Fusionopolis One',90,(b,D)=>{
 b.prism(D.parts[0].p,-1,8,'#a5bcb1');b.facade(D.parts[0].p,1,8,6,4,'#638f88','#d2ddd1',.6);
 const heights=[135.9,129,111];
 D.parts.slice(1).forEach((part,i)=>{const P=smooth(part.p,1),H=heights[i];b.prism(P,8,H-11,'#497f7c',2);b.facade(scale(P,1.003),8,H-11,4.25,3.4,'#4d8280','#a9cbc3',.4);
  for(const y of [15,48,91]){b.band(scale(P,1.025),y,1.4,'#d4e1d6');b.band(scale(P,1.02),y+1.4,2,'#b7cdc0');P.forEach((p,k)=>{if(k%4===0){const q=P[(k+3)%P.length];b.beam([p[0],y+1,p[1]],[q[0],y+3.1,q[1]],.25,'#dce6db');}});}
  // Broad upper garden occupies four floors, articulated with white uprights.
  b.band(scale(P,1.018),96,1.5,'#d8e4d8');P.forEach((p,k)=>{if(k%2===0)b.box(p[0],98,p[1],.45,14,.45,'#dce7de');});
  b.prism(scale(P,.99),H-11,H-3,'#97bdb7',2);b.facade(scale(P,1.002),H-11,H-3,3.4,4.5,'#78a29e','#c6dbcf',.4);
  b.prism(scale(P,1.02),H-3,H-1,'#d8e4da');
  // Shallow sloping white crown and elliptical recessed roof garden.
  const C=center(P),Q=scale(P,1.015),Y=(x,z)=>H-1+Math.max(-2,Math.min(1,(z-C[1])*.075));b.cap(Q,Y,'#dbe5dc');
  const O=ellipse(C[0],C[1],i===2?8:11,i===2?13:16,32,-.35);b.cap(O,H+.1,'#a4b8a8');b.garden(scale(O,.55),H+.14,false);b.rim(O,H+.4,'#e4e9de',.65);
  for(let j=-3;j<=3;j++)b.beam([C[0]+j*2,H+.35,C[1]-10],[C[0]+j*2,H+.35,C[1]+10],.12,'#d3ddc8');
 });
 // Suspended bridges, slender white lattice sides and roof.
 for(const [a,c,y]of [[[-4,-24],[13,9],104],[[-24,11],[-4,-25],73],[[-9,-16],[13,12],117]]){
  b.beam([a[0],y,a[1]],[c[0],y,c[1]],3,'#93b5ae');b.beam([a[0],y+3,a[1]],[c[0],y+3,c[1]],.6,'#dde6dd');for(let t=0;t<1;t+=.125){let x=a[0]+(c[0]-a[0])*t,z=a[1]+(c[1]-a[1])*t;b.beam([x,y,z-1.6],[x,y+3,z+1.6],.3,'#e0e8df');}
 }
 for(const [x,z]of [[-43,39],[-58,5],[39,-62],[56,44],[-29,-57]])b.tree(x,0,z,1.2);
});
}
