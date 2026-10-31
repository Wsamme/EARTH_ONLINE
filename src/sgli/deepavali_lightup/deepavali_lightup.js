/* 2024-inspired LISHA light-up, drawn from OSM road centrelines. Original
 * ribbon geometry only: no letters, photographic textures or imported meshes. */
{
const {register,lerp}=SGLI;
register('deepavali_lightup','小印度屠妖节灯饰','Little India Deepavali Light-up',690,(b,D,G,g)=>{
 const flush=b.flush.bind(b);b.flush=group=>flush(group,mode=>{
  const m=lmMat({c:'#ffffff',vc:true,ds:true,m:0,lk:0,lc:mode===10?'#ffd082':'#bfc0ad',glow:mode===10?'#ffffff':undefined,gk:mode===10?.95:0});
  if(mode===10&&!m.userData.liFestival){const prior=m.onBeforeCompile;m.onBeforeCompile=function(sh,r){prior.call(this,sh,r);sh.fragmentShader=sh.fragmentShader.replace('em += uSelf * uSelfK;','em += vColor * uSelfK * (0.96 + 0.04 * sin(uTime * 0.65 + vWP.x * 0.13 + vWP.z * 0.09));');};m.customProgramCacheKey=()=> 'li-festival-ribbon-v1';m.userData.liFestival=true;}
  return m;
 });
 const gold='#ffbc42',pink='#ea48ba',green='#78ca68',orange='#ee8241',blue='#866ce4';
 const road=name=>{const A=D.streets.filter(s=>s.name===name).flatMap(s=>s.p),unique=[...new Map(A.map(p=>[p.join(','),p])).values()];return unique.sort((p,q)=>name==='Serangoon Road'?q[1]-p[1]:p[0]-q[0]);};
 const ser=road('Serangoon Road').filter(p=>p[1]>=-600&&p[1]<=297),camp=road('Campbell Lane'),dun=road('Dunlop Street');
 function sample(P,step,callback){let carry=step*.55,count=0;for(let i=0;i<P.length-1;i++){const p=P[i],q=P[i+1],dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz);while(carry<L){callback([lerp(p[0],q[0],carry/L),lerp(p[1],q[1],carry/L)],[dx/L,dz/L],count++);carry+=step;}carry-=L;}return count;}
 // Every motif lives in the vertical plane across its actual road tangent.
 function frame(c,t){const n=[-t[1],t[0]];const h=G.at(...c)-G.base+.04;return (u,y,v=0)=>[c[0]+n[0]*u+t[0]*v,h+y,c[1]+n[1]*u+t[1]*v];}
 function line(F,A,c,w=.055){for(let i=0;i<A.length-1;i++){const p=A[i],q=A[i+1],dx=q[0]-p[0],dy=q[1]-p[1],L=Math.hypot(dx,dy)||1,ox=-dy/L*w/2,oy=dx/L*w/2;b.quad(c,F(p[0]+ox,p[1]+oy),F(q[0]+ox,q[1]+oy),F(q[0]-ox,q[1]-oy),F(p[0]-ox,p[1]-oy),10);}}
 const curve=(F,cx,cy,rx,ry,c,n=20)=>line(F,Array.from({length:n+1},(_,i)=>[cx+rx*Math.cos(i/n*Math.PI*2),cy+ry*Math.sin(i/n*Math.PI*2)]),c);
 function petal(F,x,y,w,h,c){line(F,Array.from({length:17},(_,i)=>{const a=i/16*Math.PI*2;return [x+w*Math.sin(a)*(0.65+.35*Math.cos(a)),y+h*(1-Math.cos(a))/2];}),c);}
 function lotus(F,x,y,s){for(let j=-2;j<=2;j++)petal(F,x+j*.29*s,y,.4*s,(1.1-Math.abs(j)*.18)*s,j%2?gold:pink);line(F,[[x-1.1*s,y],[x,y-.32*s],[x+1.1*s,y]],gold);}
 function diya(F,x,y,s){line(F,Array.from({length:15},(_,i)=>{const a=i/14*Math.PI;return[x+Math.cos(a)*s,y-Math.sin(a)*s*.38];}),pink);line(F,[[x-s,y],[x+s,y]],gold);petal(F,x,y+.12*s,.27*s,1.0*s,orange);}
 function flower(F,x,y,s){line(F,Array.from({length:49},(_,i)=>{const a=i/48*Math.PI*2,r=s*(.78+.22*Math.cos(a*8));return[x+Math.cos(a)*r,y+Math.sin(a)*r];}),pink);curve(F,x,y,s*.4,s*.4,gold,16);}
 function peacock(F,x,y,sign){
  // Open wire fan and teardrop eyes, rather than opaque billboards.
  for(let j=0;j<7;j++){const a=-1.1+j*.29,tx=x+sign*(1.15+Math.cos(a)*1.25),ty=y+Math.sin(a)*1.25;line(F,[[x,y],[tx+sign*.65,ty+.6],[tx+sign*1.1,ty+.35],[tx+sign*.7,ty-.15],[x,y]],j%2?pink:gold);curve(F,tx+sign*.65,ty+.25,.18,.24,green,10);}
  curve(F,x,y,.68,.42,blue,20);line(F,[[x-sign*.45,y],[x-sign*.85,y+.75],[x-sign*.7,y+1.15],[x-sign*.4,y+1.12],[x-sign*.35,y+.83]],gold);line(F,[[x-sign*.7,y+1.15],[x-sign*1.0,y+1.07]],orange);
 }
 const gates=[];
 const archCount=sample(ser,32,(c,t,i)=>{const F=frame(c,t),w=i===21?4:i===20?5:6;gates.push({center:c,tangent:t,width:w});
  for(const u of [-w,w]){b.beam(F(u,0),F(u,8.2),.12,'#79817c');line(F,[[u,3.6],[u,8.3]],gold,.065);diya(F,u,4.8,.7);flower(F,u,7.6,.62);}
  b.beam(F(-w,8),F(w,8),.07,'#8b8c81');
  lotus(F,0,7.9,1.15);for(const u of [-(w-2.5),w-2.5]){diya(F,u,7.9,.65);flower(F,u*.62,8.4,.47);}
  line(F,Array.from({length:49},(_,j)=>{let u=-w+j/48*w*2;return[u,8.25+.25*Math.cos(u*.9)];}),green);
 });
 // One peacock gateway near the southern arrival, no invented text panel.
 if(gates.length>1){const F=frame(gates[1].center,gates[1].tangent);peacock(F,-1.7,9.1,-1);peacock(F,1.7,9.1,1);line(F,Array.from({length:33},(_,i)=>{const a=i/32*Math.PI;return[3.0*Math.cos(a),9.8+2.0*Math.sin(a)];}),gold,.09);}
 // Longitudinal garlands between successive arches, following the road bend.
 for(let i=0;i<gates.length-1;i++){const A=gates[i],B=gates[i+1];for(const side of [-1,1]){const F=frame(A.center,A.tangent),E=frame(B.center,B.tangent),p=F(side*(A.width-.25),7.7),q=E(side*(B.width-.25),7.7);for(let j=0;j<12;j++){const t=j/12,u=(j+1)/12,pt=v=>[lerp(p[0],q[0],v),lerp(p[1],q[1],v)-Math.sin(v*Math.PI)*.55,lerp(p[2],q[2],v)];const a=pt(t),d=pt(u);b.quad(j%3?gold:pink,a,d,[d[0],d[1]+.045,d[2]],[a[0],a[1]+.045,a[2]],10);}}}
 sample(camp,12,(c,t,i)=>{const F=frame(c,t);for(const u of [-3,3])b.beam(F(u,0),F(u,5.5),.07,'#8d8c7a');line(F,[[-3,5.4],[0,5.0],[3,5.4]],gold);flower(F,0,5.15,.45);
  // Compact festival stalls inside the pedestrian lane, on one side only.
  if(i%2===0){const p=F(2,0),a=Math.atan2(-t[1],t[0]);b.box(p[0],p[1],p[2],2.8,2.2,1.2,'#d4a474',a);b.box(p[0],p[1]+2.2,p[2],3,.18,1.5,i%4?pink:orange,a);}
 });
 sample(dun,22,(c,t)=>{const F=frame(c,t);line(F,[[-2.2,5.5],[0,5.1],[2.2,5.5]],gold);diya(F,0,5.25,.45);});
 g.userData.liLightup={arches:archCount,spacingMetres:32,clearanceMetres:7.1,widths:gates.map(v=>v.width),centres:gates.map(v=>v.center),tangents:gates.map(v=>v.tangent),roadIds:D.streets.map(s=>s.id)};
},[]);
}
