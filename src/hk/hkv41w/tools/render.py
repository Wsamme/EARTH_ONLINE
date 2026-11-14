import json,sys,math
import numpy as np
from PIL import Image,ImageDraw
k,out=sys.argv[1],sys.argv[2]; az=math.radians(float(sys.argv[3])); el=math.radians(float(sys.argv[4])); W=int(sys.argv[5]) if len(sys.argv)>5 else 700
T=json.load(open(k))
tris=[];cols=[]
for c,a in T:
    a=np.array(a).reshape(-1,3,3); tris.append(a); cols+= [c]*len(a)
X=np.concatenate(tris)
# camera: looking from direction (az from +x toward -z i.e. north?), elevation el
d=np.array([math.cos(el)*math.cos(az),math.sin(el),-math.cos(el)*math.sin(az)])  # from target to eye
r=np.cross([0,1,0],d); r/=np.linalg.norm(r); u=np.cross(d,r)
P=X.reshape(-1,3); sx=P@r; sy=P@u; dep=P@d
mn=np.array([sx.min(),sy.min()]); mx=np.array([sx.max(),sy.max()]); sc=(W-20)/max(mx-mn)
H=int((mx[1]-mn[1])*sc)+20
img=Image.new('RGB',(W,H),(225,232,238)); dr=ImageDraw.Draw(img)
sx=sx.reshape(-1,3); sy=sy.reshape(-1,3); dep=dep.reshape(-1,3).mean(1)
n=np.cross(X[:,1]-X[:,0],X[:,2]-X[:,0]); nl=np.linalg.norm(n,axis=1)+1e-9; n=n/nl[:,None]
L=np.array([0.4,0.8,0.3]);L/=np.linalg.norm(L)
sh=0.55+0.45*np.abs(n@L)
for i in np.argsort(dep):
    c=cols[i].lstrip('#'); rgb=[int(c[j:j+2],16) for j in (0,2,4)] if len(c)==6 else [136,136,136]
    rgb=tuple(int(v*sh[i]) for v in rgb)
    pts=[(10+(sx[i,j]-mn[0])*sc, H-10-(sy[i,j]-mn[1])*sc) for j in range(3)]
    dr.polygon(pts,fill=rgb)
img.save(out); print(out,len(X))
