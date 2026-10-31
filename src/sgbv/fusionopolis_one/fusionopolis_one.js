/* ★ Fusionopolis One: ways 175841411, 173033567, 173033568,
 * 173033570. Symbiosis / Connexis North / South, measured 135.9 m.
 * Three curved floor plates, white sky gardens, roof oculi and connecting bridges.
 */
{
const {register,scale,center,smooth,ellipse}=SGBV;
register('fusionopolis_one','启汇城一期','Fusionopolis One',90,(b,D)=>{
 b.prism(D.parts[0].p,-1,8,'#a5bcb1');b.facade(D.parts[0].p,1,8,6,4,'#638f88','#d2ddd1',.6);
 const heights=[135.9,132,125];
 D.parts.slice(1).forEach((part,i)=>{const P=smooth(part.p,1),H=heights[i];b.prism(P,8,H-18,'#497f7c',2);b.facade(scale(P,1.003),8,H-11,4.25,3.4,'#6b9c99','#d0e0d7',.65);
  for(const y of [15,48,91]){b.band(scale(P,1.025),y,1.4,'#d4e1d6');b.band(scale(P,1.02),y+1.4,2,'#b7cdc0');P.forEach((p,k)=>{if(k%4===0){const q=P[(k+3)%P.length];b.beam([p[0],y+1,p[1]],[q[0],y+3.1,q[1]],.25,'#dce6db');}});}
  // White triangulated sky-garden balustrades, prominent at district scale.
  const O=SGBV.out(P,.9);for(const y of [13,48,H-49])O.forEach((p,k)=>{const q=O[(k+1)%O.length],L=Math.hypot(q[0]-p[0],q[1]-p[1]),n=Math.max(1,Math.ceil(L/5));for(let j=0;j<n;j++){const t=j/n,u=(j+1)/n,a=[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t],c=[p[0]+(q[0]-p[0])*u,p[1]+(q[1]-p[1])*u];b.beam([a[0],y,a[1]],[c[0],y+3,c[1]],.3,'#e5ede3');b.beam([a[0],y+3,a[1]],[c[0],y,c[1]],.3,'#dbe7dc');}});
  // Broad upper garden occupies four floors, articulated with white uprights.
  b.band(scale(P,1.018),96,1.5,'#d8e4d8');P.forEach((p,k)=>{if(k%2===0)b.box(p[0],98,p[1],.45,14,.45,'#dce7de');});
  b.walls(scale(P,.99),H-18,H-12,'#97bdb7',2);b.facade(scale(P,1.002),H-18,H-12,3.4,4.5,'#78a29e','#c6dbcf',.4);

  // Swept crown: the high rim drops across the curved floor plate.
  const C=center(P),Q=scale(P,1.02),Y=(x,z)=>{const u=Math.max(0,Math.min(1,((x-C[0])*.22+(z-C[1])*.08+4)/10));return H-1-10*u*u*(3-2*u);};
  b.walls(Q,H-12,Y,'#d9e6dd');if(i===2)b.cap(Q,Y,'#e3ece3');
  if(i!==2){const O=ellipse(C[0],C[1],i===0?17:10,i===0?21:23,40,i===0?-.45:-.1);const h=H-13;b.capHole(Q,[O],Y,'#e3ece3');b.walls(O,h,Y,'#bdcec1');b.cap(O,h+.05,i===0?'#abaea0':'#6c8c50');for(let k=0;k<O.length;k++){let a=O[k],q=O[(k+1)%O.length];b.beam([a[0],Y(...a)+.2,a[1]],[q[0],Y(...q)+.2,q[1]],.45,'#e7eee2');}if(i===1)for(let j=-6;j<=6;j++)b.beam([C[0]-5,h+.12,C[1]+j*2.2],[C[0]+5,h+.12,C[1]+j*2.2],.14,'#b6cfa3');}

  // Four-storey white sky-garden cage with open-looking planted recesses.
  const low=H-49,high=H-25;
  for(let y=low;y<=high;y+=4)b.band(scale(P,1.035),y,.65,'#e5ece1');
  P.forEach((p,k)=>{const q=P[(k+1)%P.length],L=Math.hypot(q[0]-p[0],q[1]-p[1]);if(k%2===0||L>8)b.beam([p[0]*1.006,low,p[1]*1.006],[p[0]*1.006,high,p[1]*1.006],.55,'#e8eee5');});
  b.band(scale(P,1.025),low-1,1,'#dbe6d7');

 });
 // Suspended bridges, slender white lattice sides and roof.
 for(const [a,c,y]of [[[-4,-24],[13,9],104],[[-24,11],[-4,-25],73],[[-9,-16],[13,12],117]]){
  b.beam([a[0],y,a[1]],[c[0],y,c[1]],3,'#93b5ae');b.beam([a[0],y+3,a[1]],[c[0],y+3,c[1]],.6,'#dde6dd');for(let t=0;t<1;t+=.125){let x=a[0]+(c[0]-a[0])*t,z=a[1]+(c[1]-a[1])*t;b.beam([x,y,z-1.6],[x,y+3,z+1.6],.3,'#e0e8df');}
 }
 for(const [x,z]of [[-43,39],[-58,5],[39,-62],[56,44],[-29,-57]])b.tree(x,0,z,1.2);
});
}
