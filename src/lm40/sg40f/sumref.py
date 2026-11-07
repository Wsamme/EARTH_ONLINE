import json,sys,math
d=json.load(open(sys.argv[1]))['targets']
keys=sys.argv[2].split(',') if len(sys.argv)>2 else d.keys()
def area(r):
  a=0
  for i in range(len(r)):
    x1,z1=r[i];x2,z2=r[(i+1)%len(r)];a+=x1*z2-x2*z1
  return abs(a)/2
for k in keys:
  t=d[k]; print('=====',k,t['anchor'],'R',t['radius'])
  bs=sorted(t['buildings'],key=lambda b:math.hypot(*b.get('centroid',[0,0])) if 'centroid' in b else 0)
  for b in bs:
    r=b['ring']; c=b.get('centroid') or [sum(p[0] for p in r)/len(r),sum(p[1] for p in r)/len(r)]
    if math.hypot(*c)>float(sys.argv[3] if len(sys.argv)>3 else 1e9): continue
    print(' B',b.get('osm'),repr(b.get('name')),'h',b.get('h'),'est' if b.get('est') else '','fl',b.get('floors'),b.get('type'),'A%.0f'%area(r),'c(%.0f,%.0f)'%tuple(c),'n',len(r),'parts',len(b.get('parts') or []))
  for p in t['pois']: print(' P',p)
