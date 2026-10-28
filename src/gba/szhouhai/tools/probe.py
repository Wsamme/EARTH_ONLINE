import json
from shapely.geometry import Polygon, Point
D=json.load(open('areas.json'))
R=json.load(open('../../ref_szhouhai.json'))['targets']
MX,MY=103014.2,110734.9
def L(lat0,lon0): return lambda p: ((p[0]-lon0)*MX, -(p[1]-lat0)*MY)
A={a['id']:a for a in D['areas']}
for key,aid in (('szszu','r13900447'),('sztalentpark','r18459537')):
  t=R[key]; f=L(t['anchor']['lat'],t['anchor']['lon'])
  K=Polygon([f(p) for p in A[aid]['rings'][0]])
  print(key,'keep area',round(K.area), 'bounds',[round(v) for v in K.bounds])
  ins=[b for b in t['buildings'] if K.contains(Point(b['centroid']))]
  print(' buildings inside',len(ins), 'of',len(t['buildings']))
  import collections
  print(' types',collections.Counter(b['type'] for b in ins))
  print(' floors known',sum(1 for b in ins if b.get('floors')), 'parts',sum(1 for b in ins if b.get('parts')))
  hs=sorted(b['h'] for b in ins); print(' h', hs[::max(1,len(hs)//15)])
  for b in ins:
    if b['h']>40 or b['area']>3000: print('   ',b.get('zh') or b.get('name'),b['osm'],b['h'],b.get('floors'),round(b['area']),[round(c) for c in b['centroid']])
  # areas inside
  c=collections.Counter()
  for a in D['areas']:
    if a['id']==aid: continue
    r=a['rings'][0] if a['rings'] else None
    if not r: continue
    P=Polygon([f(p) for p in r])
    if not P.is_valid: P=P.buffer(0)
    if K.contains(P.representative_point()):
      tg=a['t']; k=tg.get('leisure') or tg.get('landuse') or tg.get('natural') or tg.get('amenity') or tg.get('highway') or tg.get('building') or tg.get('man_made') or '?'
      c[k]+=1
  print(' areas',c)
  # check other keys inside
  for k2,t2 in R.items():
    if k2==key: continue
    x,z=f((t2['anchor']['lon'],t2['anchor']['lat']))
    if K.contains(Point(x,z)): print(' !! target inside keep:',k2,round(x),round(z))
