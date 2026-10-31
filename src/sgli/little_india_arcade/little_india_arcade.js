/* Conserved shophouse row, OSM 176326900 and supplied Campbell Lane parts.
 * Ground arcades, plaster relief and individual shutter slats are geometry. */
{
const {register,scale,out,lerp}=SGLI;
register('little_india_arcade','小印度拱廊','Little India Arcade',66,(b,D)=>{
 const flush=b.flush.bind(b);b.flush=g=>flush(g,mode=>lmMat({c:'#ffffff',vc:true,ds:true,m:0,lk:0,glow:mode===4?'#ffe5ba':mode===5?'#e7f5e5':undefined,gk:mode===4?.65:mode===5?.4:0}));
 D.parts.forEach((part,index)=>{const P=part.p,eave=7.6,H=9.7,wall=['#edc99a','#e8b98d','#f0d3a7'][index%3],trim='#f4e6cc',blue='#377b8c';
  b.prism(P,-.7,.18,'#b6a395');b.prism(out(P,-1.35),.18,3.6,'#6a8074',5);b.prism(P,3.55,eave,wall);
  b.band(out(P,.09),3.55,.3,trim);b.band(out(P,.18),7.15,.18,trim);b.band(out(P,.27),7.45,.16,trim);
  // Long ridges run from each street gable to the backlane.
  const E=P.length===4?P:[P[0],P[1],P[3],P[4]],a=E[0],q=E[1],r=E[2],s=E[3];
  const A=[a[0],eave,a[1]],B=[q[0],eave,q[1]],C=[r[0],eave,r[1]],F=[s[0],eave,s[1]],R=[(a[0]+q[0])/2,H,(a[1]+q[1])/2],T=[(s[0]+r[0])/2,H,(s[1]+r[1])/2];
  b.quad('#a97058',A,F,T,R);b.quad('#b97c60',B,R,T,C);b.tri(wall,A,R,B);b.tri(wall,F,C,T);b.beam(R,T,.18,'#d1ac86');
  for(let k=1;k<14;k++){const t=k/14,M=(p,q)=>p.map((v,j)=>lerp(v,q[j],t));b.beam(M(A,R),M(F,T),.045,'#96634f');b.beam(M(B,R),M(C,T),.045,'#96634f');}
  // First short edge faces Campbell Lane; first parcel is the Serangoon strip.
  const edges=[0,2];
  edges.forEach(edge=>{const p=P[edge],q=P[(edge+1)%P.length],dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz),n=Math.max(1,Math.round(L/4.8)),ang=Math.atan2(-dz,dx),Q=(u,y,v=.07)=>[p[0]+dx/L*u-Math.sin(ang)*v,y,p[1]+dz/L*u-Math.cos(ang)*v];
   const block=(u,y,w,h,d,c,mode=0)=>{const v=Q(u,y,d*.5);b.box(v[0],y,v[2],w,h,d,c,ang,mode);};
   for(let j=0;j<n;j++){const u=(j+.5)*L/n,w=L/n;
    block(j*L/n,.18,.4,7.15,.32,trim);block(j*L/n,.2,.62,.3,.45,trim);block(j*L/n,6.85,.62,.27,.45,trim);
    // Open five-foot way behind the piers and a deep timber lintel.
    block(u,3.0,w-.42,.48,.28,wall);block(u,2.7,w*.76,.32,.15,'#e8d4a6',4);block(u,3.1,w-.4,.23,.9,'#577f70');
    for(let win=0;win<3;win++){const v=u+(win-1)*w*.25,ww=Math.min(.88,w*.21);
     block(v,4.5,ww+.18,2.25,.22,trim);block(v,4.6,ww,1.92,.29,blue);
     block(v,4.59,.045,1.95,.35,'#b8d2c7');
     for(let y=4.74;y<6.4;y+=.14)block(v,y,ww-.07,.055,.37,'#66a1a5');
     // Arched shutter transom and its raised plaster archivolt.
     for(let k=0;k<14;k++){const a=k/14*Math.PI,c=(k+1)/14*Math.PI;b.quad(trim,Q(v+Math.cos(a)*(ww/2+.13),6.48+Math.sin(a)*(ww/2+.13)),Q(v+Math.cos(c)*(ww/2+.13),6.48+Math.sin(c)*(ww/2+.13)),Q(v+Math.cos(c)*ww/2,6.48+Math.sin(c)*ww/2),Q(v+Math.cos(a)*ww/2,6.48+Math.sin(a)*ww/2));}
     block(v,4.35,ww+.28,.13,.4,trim);
    }
    // Small ornamental panels between window groups and cornice dentils.
    block(u,6.97,w*.36,.12,.22,'#d6b084');for(let k=0;k<6;k++)block(j*L/n+(k+.5)*w/6,7.25,.12,.15,.3,trim);
   }
   block(L,0,.4,7.15,.32,trim);
   if(edge===0){
    // Campbell Lane photograph: plaster gable with a raised keystone.
    b.beam(Q(0,7.6,.24),Q(L/2,9.7,.24),.16,'#cf9f76');b.beam(Q(L/2,9.7,.24),Q(L,7.6,.24),.16,'#cf9f76');
    block(L/2,7.75,.22,.46,.3,'#d5aa7e');
   }

  });
 });
},[]);
}
