/* Buona Vista modelling kit, metres: +x east, +z south, y up.
 * Original hand-built landmarks; OSM contributors' footprint coordinates, ODbL.
 * Photo references inform the massing only. No image textures, external meshes,
 * logos or model text. Geometry is batched by material like the other landmarks.
 */
const SGBV = (() => {
  const data = /* BV_FOOTPRINTS */;
  const TAU = Math.PI*2, lerp = (a,b,t) => a+(b-a)*t;
  const center = P => { let a=0,x=0,z=0; P.forEach((p,i)=>{const q=P[(i+1)%P.length],v=p[0]*q[1]-q[0]*p[1];a+=v;x+=(p[0]+q[0])*v;z+=(p[1]+q[1])*v;});return [x/(3*a),z/(3*a)]; };
  const scale = (P,s,c=center(P)) => P.map(p=>[c[0]+(p[0]-c[0])*s,c[1]+(p[1]-c[1])*s]);
  const move = (P,x,z) => P.map(p=>[p[0]+x,p[1]+z]);
  const rect = (x,z,w,d,a=0) => [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(p=>[x+p[0]*Math.cos(a)+p[1]*Math.sin(a),z-p[0]*Math.sin(a)+p[1]*Math.cos(a)]);
  const ellipse = (x,z,rx,rz,n=32,a=0) => Array.from({length:n},(_,i)=>{let t=i/n*TAU;return [x+rx*Math.cos(t)*Math.cos(a)+rz*Math.sin(t)*Math.sin(a),z-rx*Math.cos(t)*Math.sin(a)+rz*Math.sin(t)*Math.cos(a)];});
  function smooth(P,n=1){for(let k=0;k<n;k++){let Q=[];P.forEach((p,i)=>{let q=P[(i+1)%P.length];Q.push([lerp(p[0],q[0],.2),lerp(p[1],q[1],.2)],[lerp(p[0],q[0],.8),lerp(p[1],q[1],.8)]);});P=Q;}return P;}
  const inside = (P,x,z) => {let b=false;P.forEach((p,i)=>{const q=P[(i+1)%P.length];if((p[1]>z)!==(q[1]>z)&&x<(q[0]-p[0])*(z-p[1])/(q[1]-p[1])+p[0])b=!b;});return b;};
  // The same base sampling as placeLandmarkMesh; compensate to the anchor ground.
  function ground(D,r){if(typeof hC!=='function')return {base:0,at:()=>0};const q=sgXY(D.lat,D.lon);let hi=-1e9;for(let a=0;a<12;a++)for(const f of [0,.35,.7])hi=Math.max(hi,hC(q[0]+Math.cos(a/12*TAU)*r*f,q[1]+Math.sin(a/12*TAU)*r*f));const top=hi+.6;return {base:hC(q[0],q[1])-top,at:(x,z)=>hC(q[0]+x,q[1]-z)-top};}
  const colors = new Map();
  function rgb(c){if(!colors.has(c))colors.set(c,new THREE.Color(c));return colors.get(c);}
  class Batch {
    constructor(base=0){this.base=base;this.buckets=new Map();}
    tri(c,a,b,d,mode=0){let B=this.buckets.get(mode);if(!B){B={p:[],c:[]};this.buckets.set(mode,B);}const C=rgb(c);for(const p of [a,b,d]){B.p.push(p[0],p[1]+this.base,p[2]);B.c.push(C.r,C.g,C.b);}}
    quad(c,a,b,d,e,mode=0){this.tri(c,a,b,d,mode);this.tri(c,a,d,e,mode);}
    cap(P,y,c,mode=0){const T=THREE.ShapeUtils.triangulateShape(P.map(p=>new THREE.Vector2(...p)),[]);const Y=typeof y==='function'?y:()=>y;for(const t of T)this.tri(c,...t.map(i=>[P[i][0],Y(P[i][0],P[i][1]),P[i][1]]),mode);}
    capHole(P,holes,y,c){const Q=[P,...holes],all=Q.flat(),T=THREE.ShapeUtils.triangulateShape(Q[0].map(p=>new THREE.Vector2(...p)),Q.slice(1).map(R=>R.map(p=>new THREE.Vector2(...p))));const Y=typeof y==='function'?y:()=>y;for(const t of T)this.tri(c,...t.map(i=>[all[i][0],Y(...all[i]),all[i][1]]));}
    walls(P,lo,hi,c,mode=0){const Y=typeof hi==='function'?hi:()=>hi;P.forEach((p,i)=>{const q=P[(i+1)%P.length];this.quad(c,[p[0],lo,p[1]],[q[0],lo,q[1]],[q[0],Y(...q),q[1]],[p[0],Y(...p),p[1]],mode);});}
    prism(P,lo,hi,c,mode=0){this.walls(P,lo,hi,c,mode);this.cap(P,hi,c,mode);}
    box(x,y,z,w,h,d,c,a=0,mode=0){this.prism(rect(x,z,w,d,a),y,y+h,c,mode);this.cap(rect(x,z,w,d,a),y,c,mode);}
    beam(a,b,w,c){const A=new THREE.Vector3(...a),D=new THREE.Vector3(...b).sub(A),L=D.length();if(L<.001)return;const U=new THREE.Vector3(0,1,0);if(Math.abs(D.y/L)>.98)U.set(1,0,0);const V=new THREE.Vector3().crossVectors(D,U).normalize().multiplyScalar(w/2),W=new THREE.Vector3().crossVectors(D,V).normalize().multiplyScalar(w/2);let R=p=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(v=>[p[0]+V.x*v[0]+W.x*v[1],p[1]+V.y*v[0]+W.y*v[1],p[2]+V.z*v[0]+W.z*v[1]]),P=R(a),Q=R(b);for(let i=0;i<4;i++)this.quad(c,P[i],P[(i+1)%4],Q[(i+1)%4],Q[i]);}
    band(P,y,h,c,grow=1){this.walls(scale(P,grow),y,y+h,c);}
    rim(P,y,c,w=.4){P.forEach((p,i)=>{const q=P[(i+1)%P.length];this.beam([p[0],y,p[1]],[q[0],y,q[1]],w,c);});}
    // Original fake reflections: floor/bay colour modulation, with physical mullions.
    facade(P,lo,hi,fh=4,bay=2.8,c='#4c6972',frame='#9baeb0',rail=.22){const C=rgb(c);P.forEach((p,i)=>{const q=P[(i+1)%P.length],dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz),n=Math.max(1,Math.round(L/bay)),nf=Math.max(1,Math.round((hi-lo)/fh));for(let j=0;j<n;j++){const t=j/n,u=(j+1)/n,a=[lerp(p[0],q[0],t),lerp(p[1],q[1],t)],b=[lerp(p[0],q[0],u),lerp(p[1],q[1],u)];for(let f=0;f<nf;f++){const y=lerp(lo,hi,f/nf),y1=lerp(lo,hi,(f+1)/nf),k=.83+.17*Math.sin(j*.58+i*1.3+f*.21)+.06*Math.cos(f*.85);const cc=C.clone().multiplyScalar(k);this.quad('#'+cc.getHexString(),[a[0],y,a[1]],[b[0],y,b[1]],[b[0],y1,b[1]],[a[0],y1,a[1]],2);}if(bay<5&&L>2)this.beam([a[0],lo,a[1]],[a[0],hi,a[1]],.12,frame);}if(rail)for(let y=lo;y<=hi+.01;y+=fh)this.beam([p[0],y,p[1]],[q[0],y,q[1]],rail,frame);});}
    roof(P,y,seed=0){const Q=scale(P,.82),bb=[Math.min(...Q.map(p=>p[0])),Math.min(...Q.map(p=>p[1])),Math.max(...Q.map(p=>p[0])),Math.max(...Q.map(p=>p[1]))];this.cap(P,y+.05,'#a5aaa6');this.rim(P,y+.6,'#c1c6c0',.55);let n=0;for(let x=bb[0]+3;x<bb[2]-3;x+=9)for(let z=bb[1]+3;z<bb[3]-3;z+=9){if(!inside(Q,x,z)||!inside(Q,x+3,z+3))continue;if((n+++seed)%3===0){this.box(x,y+.1,z,5,1.4,3,'#bac2bd');for(let a=-1;a<=1;a++)this.box(x+a*1.4,y+1.51,z,1,.08,2,'#69777a');}else if(n%3===0){this.box(x,y+.1,z,6,.18,5,'#526975');for(let a=-2;a<=2;a++)this.box(x+a*1.1,y+.3,z,.06,.03,5,'#9eacaf');}}
    }
    tree(x,y,z,s=1){this.box(x,y,z,.28*s,3.4*s,.28*s,'#685f4b');for(let j=0;j<2;j++){const r=(2.55-j*.55)*s,cy=y+(3.3+j*1.5)*s,n=7,R=[[-.65,.12],[-.4,.8],[0,1],[.5,.7],[.8,.05]].map(([h,k])=>ellipse(x+(j?.4:0)*s,z+(j?-.35:0)*s,r*k,r*k*.9,n).map(p=>[p[0],cy+h*r,p[1]]));for(let k=0;k<R.length-1;k++)for(let i=0;i<n;i++)this.quad((i+k+j)%3?'#527748':'#66894f',R[k][i],R[k][(i+1)%n],R[k+1][(i+1)%n],R[k+1][i]);}}
    garden(P,y,trees=true){this.cap(P,y,'#5b7848');this.rim(P,y+.35,'#bbc4b4',.45);const Q=scale(P,.8);if(trees)Q.forEach((p,i)=>{if(i%3===0)this.tree(p[0],y,p[1],.6);});}
    flush(g,materialFactory){let tris=0;for(const [mode,B]of this.buckets){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(B.p,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(B.c,3));geo.computeVertexNormals();const mat=materialFactory?materialFactory(mode):lmMat({c:'#ffffff',vc:true,ds:true,m:mode===2?1:0,lk:mode===2?.32:.16,fh:4,cw:2.8});const m=new THREE.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;g.add(m);tris+=B.p.length/9;}g.userData.bvTriangles=tris;return g;}
  }
  let masks=null;
  function skip(B){
    if(!masks){masks=Object.values(data).flatMap(D=>{const a=sgXY(D.lat,D.lon);return [...D.parts,...(D.context_parts||[])].map(part=>{const P=part.p.map(p=>[a[0]+p[0],a[1]-p[1]]);return {P,bb:[Math.min(...P.map(p=>p[0])),Math.min(...P.map(p=>p[1])),Math.max(...P.map(p=>p[0])),Math.max(...P.map(p=>p[1]))]};});});}
    const R=B.rings[0],P=[];for(let i=0;i<R.length;i+=2)P.push([R[i],R[i+1]]);
    const bb=[Math.min(...P.map(p=>p[0])),Math.min(...P.map(p=>p[1])),Math.max(...P.map(p=>p[0])),Math.max(...P.map(p=>p[1]))];
    return masks.some(M=>{const q=M.bb;if(bb[0]>q[2]||bb[2]<q[0]||bb[1]>q[3]||bb[3]<q[1])return false;return inside(M.P,B.cx,B.cy)||P.some(p=>inside(M.P,...p))||M.P.some(p=>inside(P,...p));});
  }
  // Constant-distance outward ring offset, for screens and cladding over glass.
  function out(P,d){let a=0;P.forEach((p,i)=>{const q=P[(i+1)%P.length];a+=p[0]*q[1]-q[0]*p[1];});const sign=a>0?1:-1;return P.map((p,i)=>{const a=P[(i+P.length-1)%P.length],c=P[(i+1)%P.length],u=[p[1]-a[1],a[0]-p[0]],v=[c[1]-p[1],p[0]-c[0]],L=Math.hypot(...u)||1,R=Math.hypot(...v)||1;const n=[sign*(u[0]/L+v[0]/R),sign*(u[1]/L+v[1]/R)],k=Math.max(.35,(n[0]*u[0]/L+n[1]*u[1]/L)*sign);return [p[0]+n[0]*d/k,p[1]+n[1]*d/k];});}
  const stats={};
  function register(slug,zh,en,r,build){const D=data[slug];const key='sgbv_'+slug;LANDMARKS[key]={zh,en,cat:'new',r,h:D.height,lt:{m:1,c:'#ffe1b1',k:.32,fh:4,cw:2.8,anim:'none'},build(){const G=ground(D,r),b=new Batch(G.base),g=new THREE.Group();build(b,D,G,g);stats[slug]={height:D.height,anchor:[D.lat,D.lon],osm:D.parts.map(p=>p.id)};b.flush(g);stats[slug].triangles=g.userData.bvTriangles;return g;}};SG_PLACES.push({type:key,lat:D.lat,lon:D.lon,rot:0});}
  return {data,register,Batch,skip,out,center,scale,move,rect,ellipse,smooth,inside,lerp,TAU,stats};
})();
