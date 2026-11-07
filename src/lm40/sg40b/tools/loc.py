# usage: loc.py ref.json key osm[,osm2] [theta_deg|auto] [cx cz]   -> placement + rings in the local frame
import json,sys,math
ref,key,osms=sys.argv[1],sys.argv[2],sys.argv[3].split(',')
t=json.load(open(ref))['targets'][key]; A=t['anchor']
bs=[b for b in t['buildings'] if b['osm'] in osms]
main=bs[0]; R=main['ring']
# area centroid
def cen(P):
    a=0;cx=0;cz=0
    for i in range(len(P)):
        x0,z0=P[i];x1,z1=P[(i+1)%len(P)];c=x0*z1-x1*z0;a+=c;cx+=(x0+x1)*c;cz+=(z0+z1)*c
    return cx/(3*a),cz/(3*a)
cx,cz=cen(R)
if len(sys.argv)>6: cx,cz=float(sys.argv[5]),float(sys.argv[6])
th=sys.argv[4] if len(sys.argv)>4 else 'auto'
if th=='auto':
    best=0;ang=0
    for i in range(len(R)):
        x0,z0=R[i];x1,z1=R[(i+1)%len(R)];L=math.hypot(x1-x0,z1-z0)
        if L>best: best=L; ang=math.atan2(-(z1-z0),x1-x0)  # CCW from east
    th=ang
else: th=math.radians(float(th))
while th>math.pi/2: th-=math.pi
while th<-math.pi/2: th+=math.pi
c,s=math.cos(th),math.sin(th)
def loc(p): dx,dz=p[0]-cx,p[1]-cz; return [round(dx*c-dz*s,1),round(dx*s+dz*c,1)]
lat=A['lat']-cz/110574; lon=A['lon']+cx/111290.5
print("SG_PLACES.push({type:'%s', lat:%.6f, lon:%.6f, rot:%.4f});  // centroid ref (%.1f,%.1f) theta %.1f deg"%(key,lat,lon,th,cx,cz,math.degrees(th)))
for b in bs:
    print(b['osm'],b.get('name'),'h',b['h'],'ring',json.dumps([loc(p) for p in b['ring']]).replace(' ',''))
    for p in b.get('parts') or []: print('  part',p.get('base'),p.get('top'),json.dumps([loc(q) for q in p['ring']]).replace(' ',''))
for r in t['roads']:
    P=[loc(p) for p in r['pts']]
    near=[p for p in P if abs(p[0])<45 and abs(p[1])<45]
    if near: print('  road',r['cls'],r['kd'],r.get('name'),'br' if r.get('br') else '',r.get('elev') or '',json.dumps(near[:6]).replace(' ',''))
