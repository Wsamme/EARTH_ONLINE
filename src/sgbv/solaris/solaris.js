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
 for(let y=6;y<75;y+=1.05){const Q=y<34?P:y<48?null:South;if(Q)b.prism(out(Q,1.05),y,y+.42,'#eef0e4');else for(const R of [South,North])b.prism(out(R,1.05),y,y+.42,'#eef0e4');}
 // The planted ramp spirals continuously around the facade, four circuits.
 const Q=scale(P,1.028),N=Q.length;for(let lap=0;lap<4;lap++)for(let i=0;i<N;i++){let p=Q[i],q=Q[(i+1)%N],y=5+(lap+i/N)*15.8,y1=5+(lap+(i+1)/N)*15.8;let c=center(P),inset=v=>[lerp(v[0],c[0],.055),lerp(v[1],c[1],.055)],u=inset(p),v=inset(q);const limit=Math.min(y,y1)>48&&!SGBV.inside(scale(South,1.1),p[0],p[1]);if(limit)continue;b.quad('#668254',[p[0],y,p[1]],[q[0],y1,q[1]],[v[0],y1,v[1]],[u[0],y,u[1]]);b.quad('#b8cbb0',[p[0],y-1,p[1]],[q[0],y1-1,q[1]],[q[0],y1+.4,q[1]],[p[0],y+.4,p[1]]);if(i%7===0)b.tree(u[0],y+.1,u[1],.55);}
 // Sloping glazed atrium between both wings, with repeated white roof ribs.
 const A=[[-27,-10],[-8,3],[31,21],[39,8],[-7,-18]];b.cap(A,(x,z)=>47-(x+z)*.035,'#93b1a5',2);for(let t=0;t<=1;t+=.065){let x=-25+57*t,z=-10+30*t;b.beam([x,47-(x+z)*.035,z],[x+8,47-(x+z+1)*.035,z-15],.3,'#d6e0d2');}
 // Angular, asymmetric frame follows the west end of the high garden.
 const R=[[-62,17],[-56,7],[-39,-3],[-23,1],[-30,19],[-10,34],[11,44],[3,50],[-41,36],[-56,30]];
 b.rim(R,79.5,'#f0f2e5',.8);
 for(const [i,j]of [[0,5],[1,5],[1,6],[2,6],[2,7],[3,8],[4,8]]){let a=R[i],q=R[j];b.beam([a[0],79.4,a[1]],[q[0],77.8,q[1]],.75,'#edf0e3');}
 for(const i of [0,2,4,6,8]){let p=R[i];b.beam([p[0],75,p[1]],[p[0],79.5,p[1]],.6,'#e6ecdc');}
 // Garden paths and deeper planting beds break up both flat roof lawns.
 for(const [Q,y]of [[North,48.3],[South,75.3]]){const C=center(Q);for(let i=0;i<Q.length;i+=3){let p=Q[i];b.beam([C[0],y+.1,C[1]],[p[0]*.85+C[0]*.15,y+.1,p[1]*.85+C[1]*.15],1.1,'#b8b9a0');if(i%2===0)b.tree(p[0]*.8+C[0]*.2,y+.2,p[1]*.8+C[1]*.2,1.1);}b.prism(scale(Q,.65),y+.1,y+.55,'#788b59');}
 for(const [x,z]of [[-62,3],[-48,41],[19,52],[53,-27],[8,-66]])b.tree(x,0,z,1.3);
});
}
