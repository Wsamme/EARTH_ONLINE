/* ★ Solaris, ways 123988232, 777420337 and 777420338.
 * 80.1 m measured roof frame maximum. Asymmetric terraced volumes,
 * continuous rising perimeter garden, dense horizontal sunshades, atrium.
 */
{
const {register,scale,smooth,center,ellipse,lerp,out}=SGBV;
register('solaris','索拉里斯','Solaris',90,(b,D)=>{
 const P=smooth(D.parts[0].p),South=smooth(D.parts[1].p),North=smooth(D.parts[2].p);
 b.prism(P,-1,5,'#b1bfb1');
 // Lower shared floors, two unequal wings above, with a recessed glazed cut.
 b.facade(scale(P,.97),5,34,4.4,3.2,'#3f6563','#e0e5d8',.18);
 const volumes=[[South,34,75],[North,34,48]];
 for(const [Q,lo,hi]of volumes){b.prism(scale(Q,.97),lo,hi,'#52756e',2);b.facade(scale(Q,.975),lo,hi,4.4,3.8,'#6a8e83','#d9e3d5',.15);b.garden(scale(Q,.96),hi+.2);b.rim(Q,hi+.8,'#e4e8dc',.7);}
 // Multiple narrow louvres between each floor, projected beyond the glass.
 for(let y=6;y<75;y+=1.05){if((y-6)%15>9.0)continue;const Q=y<34?P:y<48?null:South;if(Q)b.prism(out(Q,1.05),y,y+.42,'#eef0e4');else for(const R of [South,North])b.prism(out(R,1.05),y,y+.42,'#eef0e4');}
 for(const [Q,H]of [[South,75],[North,48]])for(let y=19;y<H;y+=15){b.band(out(Q,.8),y,1.1,'#6c875b');b.rim(out(Q,1.15),y+.8,'#c9d8bb',.35);}
 // The planted ramp spirals continuously around the facade, four circuits.
 // A single continuous helical surface migrates from the full lower perimeter
 // onto the taller south wing. No disconnected high-level strips on the low wing.
 const resample=(R,n)=>{const L=[0];R.forEach((p,i)=>{const q=R[(i+1)%R.length];L.push(L[i]+Math.hypot(q[0]-p[0],q[1]-p[1]));});return Array.from({length:n},(_,k)=>{const d=L[R.length]*k/n;let j=0;while(L[j+1]<d)j++;const t=(d-L[j])/(L[j+1]-L[j]||1),p=R[j],q=R[(j+1)%R.length];return [lerp(p[0],q[0],t),lerp(p[1],q[1],t)];});};
 const area=R=>R.reduce((a,p,i)=>{const q=R[(i+1)%R.length];return a+p[0]*q[1]-q[0]*p[1];},0);
 let S=South.slice();if(area(P)*area(S)<0)S.reverse();let si=0;S.forEach((p,i)=>{if(Math.hypot(p[0]-P[0][0],p[1]-P[0][1])<Math.hypot(S[si][0]-P[0][0],S[si][1]-P[0][1]))si=i;});S=S.slice(si).concat(S.slice(0,si));
 const N=128,lowerPerim=resample(out(P,2.4),N),upperPerim=resample(out(S,2.4),N),CA=center(P),CC=center(S),path=[];
 for(let k=0;k<=N*4;k++){const y=5+k/(N*4)*68,u=Math.max(0,Math.min(1,(y-28)/20)),f=u*u*(3-2*u),i=k%N,p=[lerp(lowerPerim[i][0],upperPerim[i][0],f),y,lerp(lowerPerim[i][1],upperPerim[i][1],f)],cx=lerp(CA[0],CC[0],f),cz=lerp(CA[1],CC[1],f);path.push({p,q:[lerp(p[0],cx,.065),y,lerp(p[2],cz,.065)]});}
 for(let k=0;k<path.length-1;k++){const a=path[k],c=path[k+1],lower=p=>[p[0],p[1]-.6,p[2]],hedge=p=>[p[0],p[1]+1.2,p[2]];b.quad('#688857',a.p,c.p,c.q,a.q);b.quad('#cad9be',lower(a.p),lower(c.p),c.p,a.p);b.quad('#6f905e',a.p,c.p,hedge(c.p),hedge(a.p));if(k%18===0)b.tree(a.q[0],a.q[1]+.1,a.q[2],.6);}
 // Sloping glazed atrium between both wings, with repeated white roof ribs.
 const A=[[-27,-10],[-8,3],[31,21],[39,8],[-7,-18]];b.cap(A,(x,z)=>47-(x+z)*.035,'#93b1a5',2);for(let t=0;t<=1;t+=.065){let x=-25+57*t,z=-10+30*t;b.beam([x,47-(x+z)*.035,z],[x+8,47-(x+z+1)*.035,z-15],.3,'#d6e0d2');}
 // Angular, asymmetric frame follows the west end of the high garden.
 const R=[[-62,17],[-56,7],[-39,-3],[-23,1],[-30,19],[-10,34],[11,44],[3,50],[-41,36],[-56,30]];
 b.rim(R,79.5,'#f0f2e5',.8);
 for(const [i,j]of [[0,5],[1,5],[1,6],[2,6],[2,7],[3,8],[4,8]]){let a=R[i],q=R[j];b.beam([a[0],79.4,a[1]],[q[0],77.8,q[1]],.75,'#edf0e3');}
 for(const i of [0,2,4,6,8]){let p=R[i];b.beam([p[0],75,p[1]],[p[0],79.5,p[1]],.6,'#e6ecdc');}
 // Garden paths and deeper planting beds break up both flat roof lawns.
 for(const [Q,y]of [[North,48.3],[South,75.3]]){const C=center(Q);for(let i=0;i<Q.length;i+=3){let p=Q[i];b.beam([C[0],y+.1,C[1]],[p[0]*.85+C[0]*.15,y+.1,p[1]*.85+C[1]*.15],.5,'#b8b9a0');if(i%2===0)b.tree(p[0]*.8+C[0]*.2,y+.2,p[1]*.8+C[1]*.2,1.1);}for(let x=C[0]-10;x<C[0]+11;x+=10)for(let z=C[1]-6;z<C[1]+7;z+=9){const R=SGBV.rect(x,z,7,4);if(R.every(p=>SGBV.inside(Q,...p)))b.prism(R,y+.05,y+.4,'#6c8554');}}
 for(const [x,z]of [[-62,3],[-48,41],[19,52],[53,-27],[8,-66]])b.tree(x,0,z,1.3);
});
}
