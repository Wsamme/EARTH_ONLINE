/* Mustafa's mapped Syed Alwi blocks. OSM 47198841, 178437069/70/71/74.
 * Photo-derived green glazing, pale cladding and bright continuous shopfronts. */
{
const {register,out,scale,lerp,center}=SGLI;
register('mustafa_centre','慕达发中心','Mustafa Centre',155,(b,D)=>{
 const flush=b.flush.bind(b);b.flush=g=>flush(g,mode=>lmMat({c:'#ffffff',vc:true,ds:true,m:0,lk:0,glow:mode===2?'#e1eee0':mode===4?'#fff1d3':mode===5?'#6dde87':mode===6?'#eedcc4':undefined,gk:mode===2?.22:mode===4?1:mode===5?.8:mode===6?.1:0}));
 for(const part of D.parts){const P=part.p,bridge=part.id===178437074,H=bridge?13.2:part.id===178437069?25.8:22.5;
  if(bridge){
   // This mapped narrow part connects across the lane; keep the clearance open.
   b.prism(P,5.4,5.7,'#b6bdad');b.prism(scale(P,.98),5.7,12.7,'#4a7970',2);b.facade(out(P,.04),5.7,12.7,3.5,2.2,'#658d80','#d4dacb',.14);b.prism(out(P,.2),12.7,H,'#cbd1be');continue;
  }
  b.prism(P,-1,H,'#d5d5c5',6);const Q=out(P,.06);
  Q.forEach((p,i)=>{const q=Q[(i+1)%Q.length],dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz);if(L<2)return;const a=Math.atan2(-dz,dx),n=Math.max(1,Math.round(L/4));
   // Older pale hotel / retail block at the west, greener glazing on the extension.
   const old=part.id===47198841;
   for(let j=0;j<n;j++){
    const t=(j+.5)/n,x=lerp(p[0],q[0],t),z=lerp(p[1],q[1],t),w=L/n;
    b.box(x,.3,z,w-.24,3.5,.16,'#99aa91',a,4);
    b.box(x,0,z,.42,4.6,.48,'#7c7d68',a);
    b.box(x,3.8,z,w-.15,.78,.22,['#d7d9b5','#8eb584','#d3bb93'][j%3],a,4);
    b.box(x,4.7,z,w,.2,1.4,'#dedbc5',a,4);
    for(let y=6;y<H-2;y+=4.1){
     b.box(x,y,z,w*(old?.55:.94),2.75,.17,old?'#41685d':'#477b71',a,2);
     b.box(x,y-.4,z,w,.38,.35,old?'#e5e4d5':'#abbcb0',a);
     if(old){b.box(x-w*.32*Math.cos(a),y,z+w*.32*Math.sin(a),.16,2.9,.23,'#bdc7b6',a);}
    }
    if(j%4===1)b.box(x,5,z,w*.84,2.5,.2,'#b7c1a2',a,5);
   }
   // Continuous green and off-white fascia bands, with narrow sunshades.
   for(const y of [5.2,9.8,14.0,18.1])if(y<H-1){b.box((p[0]+q[0])/2,y,(p[1]+q[1])/2,L,.3,.52,'#6c927c',a);}
  });
  b.roof(P,H-.8,part.id%4);b.rim(P,H,'#e3e1d0',.35);
  // Recessed mechanical screens: real service equipment, no arbitrary towers.
  const C=center(P);b.box(C[0],H-.5,C[1],5,1.2,4,'#a6b2a6',Math.atan2(-(P[1][1]-P[0][1]),P[1][0]-P[0][0]));
 }
},[]);
}
