import json,math,gzip,base64,struct
import numpy as np
B=json.load(open('w41/bld_big.json'))
bj=json.loads(gzip.decompress(open('site/hkdata/hk_base.bin','rb').read()))
TN,TS,HALF=bj['TN'],bj['TS'],bj['HALF']
H=np.frombuffer(base64.b64decode(bj['H']),dtype='<i2').astype(np.float32)/10
def hAt(x,y):
    fx=min(TN-1.0001,max(0,(x+HALF)/TS));fy=min(TN-1.0001,max(0,(y+HALF)/TS))
    i=int(fx);j=int(fy);u=fx-i;v=fy-j
    a=H[j*TN+i];b=H[j*TN+i+1];c=H[(j+1)*TN+i];d=H[(j+1)*TN+i+1]
    return float((a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v)
hC=lambda x,y:max(0.4,hAt(x,y))
MX,MY=103014.2,110734.9
xy=lambda la,lo:((lo-114.12)*MX,(la-22.34)*MY)
def cen(r):
    a=0;cx=cy=0
    for i in range(len(r)):
        x0,y0=r[i-1];x1,y1=r[i];c=x0*y1-x1*y0;a+=c;cx+=(x0+x1)*c;cy+=(y0+y1)*c
    return cx/(3*a),cy/(3*a),abs(a/2)
ALL=[(b,)+cen(b['rings'][0]) for b in B]
def pick(x,y,R,filt):
    return [b for b,cx,cy,A in ALL if math.hypot(cx-x,cy-y)<R and filt(b,cx-x,cy-y,A)]
T={
 'stanchart':(xy(22.28043,114.15902),12,lambda b,dx,dy,A:b['t']==4),
 'landmark':(xy(22.28125,114.15772),40,lambda b,dx,dy,A:b['h']>12),
 'belchers':(xy(22.2852,114.1333),100,lambda b,dx,dy,A:b['h']>30),
 'fourseasons':((3820,-5940),60,lambda b,dx,dy,A:b['h']>100),
 'centralmkt':((3649,-6198),5,lambda b,dx,dy,A:True),
 'swmsb':((3065,-5960),6,lambda b,dx,dy,A:A>2000),
 'threepp':((4947.3,-6980.6),5,lambda b,dx,dy,A:b['h']>100),
}
OUT={};SV=[]
for k,((x,y),R,f) in T.items():
    bs=pick(x,y,R,f)
    # dedupe
    seen=set();U=[]
    for b in bs:
        key=(b['h'],b['base'],round(cen(b['rings'][0])[2]))
        if key in seen: continue
        seen.add(key);U.append(b)
    # anchor: centroid of union bbox
    pts=[p for b in U for p in b['rings'][0]]
    ox=(min(p[0] for p in pts)+max(p[0] for p in pts))/2; oy=(min(p[1] for p in pts)+max(p[1] for p in pts))/2
    r=max(math.hypot(p[0]-ox,p[1]-oy) for p in pts)
    g=[hC(ox+r*s*math.cos(a),oy+r*s*math.sin(a)) for s in (0,0.35,0.7) for a in np.linspace(0,2*math.pi,9)[:-1]]
    base=max(g)+0.6
    x0=-r-10;z0=-r-10;s=8;n=int((2*r+20)/s)+2
    G=[round(hC(ox+x0+i*s,oy-(z0+j*s))-base,1) for j in range(n) for i in range(n)]
    from shapely.geometry import Polygon as SP
    def simp(r):
        if len(r)<=16: return r
        q=SP(r).simplify(0.45,preserve_topology=True)
        return list(q.exterior.coords)[:-1] if q.geom_type=='Polygon' and q.area>0.97*SP(r).area else r
    parts=[[b['base'],b['h'],[[round(p[0]-ox,2),round(-(p[1]-oy),2)] for p in simp(b['rings'][0])],b['wall']] for b in U]
    parts.sort(key=lambda p:-(p[1]))
    lat=22.34+oy/MY;lon=114.12+ox/MX
    OUT[k]={'lat':round(lat,7),'lon':round(lon,7),'r':round(r,1),'base':round(base,2),'gnd':round(hC(ox,oy),2),'G':{'x0':round(x0,1),'z0':round(z0,1),'s':s,'nx':n,'nz':n,'v':G},'parts':parts}
    print(k,round(lat,6),round(lon,6),'r',round(r),'base',round(base,1),'gnd',round(hC(ox,oy),1),[(p[0],p[1],len(p[2])) for p in parts])
json.dump(OUT,open('w41/D.json','w'),separators=(',',':'))
