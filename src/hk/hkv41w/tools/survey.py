import json,math,gzip
B=json.load(open('w41/bld_big.json'));P=json.load(open('w41/places.json'))
base=json.loads(gzip.decompress(open('site/hkdata/hk_base.bin','rb').read()))
pois=base['pois']+base['places']
MX,MY=103014.2,110734.9
ll=lambda x,y:(22.34+y/MY,114.12+x/MX)
xy=lambda la,lo:((lo-114.12)*MX,(la-22.34)*MY)
def area(r): return abs(sum(r[i][0]*r[i-1][1]-r[i-1][0]*r[i][1] for i in range(len(r))))/2
def cen(r):
    a=0;cx=cy=0
    for i in range(len(r)):
        x0,y0=r[i-1];x1,y1=r[i];c=x0*y1-x1*y0;a+=c;cx+=(x0+x1)*c;cy+=(y0+y1)*c
    return cx/(3*a),cy/(3*a)
L=[(p,)+xy(p['lat'],p['lon']) for p in P if p['lat']]
out=[]
for b in B:
    r=b['rings'][0];cx,cy=cen(r)
    if not(-300<cx<5000 and -9800<cy<-5600): continue
    A=area(r)
    if not(b['h']>=80 or (A>=4000 and b['h']>=25)): continue
    near=None
    for p,lx,ly in L:
        dd=math.hypot(cx-lx,cy-ly); lim=(p['r'] or 40)*(1.0 if p['site'] else 0.8)
        if p['site'] and p['key']!='hkhku': lim=(p['r'] or 40)*0.8
        if dd<lim and (near is None or dd<near[1]): near=(p['key'],round(dd))
    la,lo=ll(cx,cy)
    pn=sorted(((math.hypot(q['x']-cx,q['y']-cy),q.get('en'),q.get('zh'),q.get('k')) for q in base['pois'] if abs(q['x']-cx)<60 and abs(q['y']-cy)<60))[:3]
    out.append({'lat':round(la,6),'lon':round(lo,6),'x':round(cx,1),'y':round(cy,1),'h':b['h'],'base':b['base'],'area':round(A),'part':b['part'],'t':b['t'],'covered_by':near,'pois':[(round(a),e,z,k) for a,e,z,k in pn],'n':len(r)})
out.sort(key=lambda o:-o['h'])
free=[o for o in out if not o['covered_by']]
print(len(out),len(free))
for o in free[:70]: print(o['h'],o['area'],o['lat'],o['lon'],o['x'],o['y'],o['part'],o['pois'][:2])
json.dump(out,open('w41/cand.json','w'))
