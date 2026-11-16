/* Mustafa's mapped Syed Alwi blocks. OSM 47198841, 178437069/70/71/74.
 * Photo-derived green glazing, pale cladding and bright continuous shopfronts. */
{
const {register,out,scale,lerp,center,ellipse}=SGLI;
register('mustafa_centre','慕达发中心','Mustafa Centre',155,(b,D)=>{
 const flush=b.flush.bind(b);b.flush=g=>flush(g,mode=>lmMat({c:'#ffffff',vc:true,ds:true,m:0,lk:0,glow:mode===2?'#e1eee0':mode===4?'#fff1d3':mode===5?'#6dde87':mode===6?'#eedcc4':undefined,gk:mode===2?.35:mode===4?1.35:mode===5?1.0:mode===6?.035:0}));
 for(const part of D.parts){const P=part.p,bridge=part.id===178437074,H=bridge?9.6:part.id===178437069?26.9:part.id===47198841?21.2:22.5;
  if(bridge){
   // This mapped narrow part connects across the lane; keep the clearance open.
   b.prism(P,5.4,5.7,'#b6bdad');b.prism(scale(P,.98),5.7,9.1,'#4a7970',2);b.facade(out(P,.04),5.7,9.1,3.5,2.2,'#658d80','#d4dacb',.14);b.prism(out(P,.2),9.1,H,'#cbd1be');continue;
  }
  b.prism(P,-1,H,'#d9dad5',6);if(part.id===178437071)b.prism(P,5.4,H-.6,'#477b71',2);const Q=out(P,.06),mullions=out(P,.20);
  Q.forEach((p,i)=>{const q=Q[(i+1)%Q.length],dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz);if(L<2)return;const a=Math.atan2(-dz,dx),n=Math.max(1,Math.round(L/4));
   // Older pale hotel / retail block at the west, greener glazing on the extension.
   const old=part.id===47198841;
   for(let j=0;j<n;j++){
    const t=(j+.5)/n,x=lerp(p[0],q[0],t),z=lerp(p[1],q[1],t),w=L/n;
    b.box(x,.3,z,w-.24,3.5,.16,'#99aa91',a,4);
    b.box(x,0,z,.42,4.6,.48,'#7c7d68',a);
    b.box(x,3.8,z,w-.15,.78,.22,['#d7d9b5','#8eb584','#d3bb93'][j%3],a,4);
    b.box(x,4.7,z,w,.2,1.4,'#dedbc5',a,4);
    // Shop glazing transoms and door stiles, under the continuous canopy.
    b.box(x,.3,z,.075,3.5,.22,'#d8ded1',a);
    b.box(x,2.75,z,w-.24,.065,.23,'#d8ded1',a);

    for(let y=old?5.5:6;y<H-2;y+=old?3.7:4.1){
     b.box(x,y,z,w*(old?.55:.94),old?2.3:2.75,.17,old?'#35464e':'#477b71',a,2);
     b.box(x,y-.4,z,w,.38,.35,old?'#e1e2dd':'#abbcb0',a);
     // Thin paired mullions divide the extension's broad green window bays.
     if(!old)for(const k of [-1,1]){const u=lerp(mullions[i][0],mullions[(i+1)%Q.length][0],t)+Math.cos(a)*k*w*.23,v=lerp(mullions[i][1],mullions[(i+1)%Q.length][1],t)-Math.sin(a)*k*w*.23,c=Math.cos(a)*.033,d=-Math.sin(a)*.033;b.quad('#c0c9bc',[u-c,y,v-d],[u+c,y,v+d],[u+c,y+2.75,v+d],[u-c,y+2.75,v-d]);}
     // Service/parking frontage: narrow open slots behind pale guard rails.
     if(part.id===178437070&&i===2){b.box(x,y+.3,z,w*.82,.75,.24,'#394b48',a);for(const r of [.38,.7])b.box(x,y+r,z,w*.85,.055,.29,'#aebcae',a);}

     if(old){b.box(x-w*.32*Math.cos(a),y,z+w*.32*Math.sin(a),.16,2.5,.23,'#bdc7b6',a);
      // October 2022 shows rectangular dark transoms on the pale block.
      b.box(x,y+2.15,z,w*.55,.15,.22,'#bec5c4',a);
     }
    }
    if(j%4===1)b.box(x,5,z,w*.84,2.5,.2,'#b7c1a2',a,5);
   }
   // Continuous green and off-white fascia bands, with narrow sunshades.
   for(const y of (old?[5.1,8.8,12.5,16.2,19.9]:[5.2,9.8,14.0,18.1]))if(y<H-1){b.box((p[0]+q[0])/2,y,(p[1]+q[1])/2,L,.3,.52,'#6c927c',a);}
  });
  b.roof(P,H-.8,part.id%4);b.rim(P,H,'#e3e1d0',.35);
  if(part.id===178437069){
   // Broad green restaurant roof dome, visible in the measured south/top views.
   // OSM footprint + measured 38.3 m maximum; no imported surface geometry.
   b.cap(P,H-.74,'#4d5357');
   const cx=80,cz=72,r=11.4,base=26.9,rise=11.4;
   b.prism(ellipse(cx,cz,r,r,32),26.15,base,'#69847b');
   for(let k=0;k<8;k++)for(let j=0;j<32;j++){
    const pt=(i,n)=>{const t=i/8*Math.PI/2,a=n/32*Math.PI*2;return[cx+r*Math.cos(t)*Math.cos(a),base+rise*Math.sin(t),cz+r*Math.cos(t)*Math.sin(a)];};
    b.quad(j%4===0?'#557d75':'#60857a',pt(k,j),pt(k,j+1),pt(k+1,j+1),pt(k+1,j));
   }

   // Stainless lamella spirals and the maintenance ladder are shown in the
   // dome fabricator's 2018 photographs (Geometrica), not invented ornament.
   const skin=(t,a)=>[cx+(r+.025)*Math.cos(t)*Math.cos(a),base+(rise+.025)*Math.sin(t),cz+(r+.025)*Math.cos(t)*Math.sin(a)];
   for(const sign of [-1,1])for(let j=0;j<16;j++)for(let k=0;k<8;k++){
    const t=k/8*Math.PI/2,u=(k+1)/8*Math.PI/2,a=j/16*Math.PI*2;
    b.beam(skin(t,a+sign*t),skin(u,a+sign*u),.035,'#8da9a2');
   }
   const rail=(t,side)=>[cx-(r+.08)*Math.cos(t)*.74+side*.24*.67,base+(rise+.08)*Math.sin(t),cz+(r+.08)*Math.cos(t)*.67+side*.24*.74];
   for(let k=0;k<36;k++){const t=k/36*Math.PI,u=(k+1)/36*Math.PI;for(const side of [-1,1])b.beam(rail(t,side),rail(u,side),.045,'#c3ceca');b.beam(rail(t,-1),rail(t,1),.04,'#c3ceca');}
   // Diagonal metal cassettes on the modern, taller retail wing.
   const R=out(P,.18);for(const edge of [1,3]){const p=R[edge],q=R[(edge+1)%R.length],dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz),n=Math.max(1,Math.floor(L/5.5));
    for(let f=0;f<4;f++)for(let j=0;j<n;j++){const t=j/n,u=(j+1)/n,y=9+f*5.0,pt=(v,Y)=>[lerp(p[0],q[0],v),Y,lerp(p[1],q[1],v)];b.quad((j+f)%2?'#53616a':'#6c777b',pt(t,y),pt(u,y+1.25),pt(u,y+2.2),pt(t,y+3.5));}
   }
  }

  // Recessed mechanical screens: real service equipment, no arbitrary towers.
  const C=center(P);b.box(C[0],H-.5,C[1],5,1.2,4,'#a6b2a6',Math.atan2(-(P[1][1]-P[0][1]),P[1][0]-P[0][0]));
 }
},[]);
}
