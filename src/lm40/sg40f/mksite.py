import json
from shapely.geometry import Polygon, Point, LineString
from shapely.ops import unary_union
d=json.load(open('../ref_sg40f.json'))['targets']
R=lambda g,t=1.0: [[round(x,1),round(z,1)] for x,z in list(g.simplify(t).exterior.coords)[:-1]]
out={}
# Japanese garden
t=d['sgjapanesegarden']
P=[Polygon(a['ring']) for a in t['areas'] if a['area'] in (109856,19860)]
K=unary_union([p.buffer(0.5) for p in P]).buffer(-0.5)
jb=[]
for b in t['buildings']:
  c=Point(b['centroid'])
  if K.contains(c): jb.append({'o':b['osm'],'n':b['name'],'h':b['h'],'a':b['area'],'r':[[round(p[0],1),round(p[1],1)] for p in b['ring']]})
out['jp']={'a':[t['anchor']['lat'],t['anchor']['lon']],'keep':R(K,1.5),'b':jb,'area':K.area}
# paths inside keep (for tree avoidance)
pl=[]
for r in t['roads']:
  L=LineString(r['pts'])
  if L.intersects(K): pl.append([[round(p[0]),round(p[1])] for p in r['pts']])
out['jp']['paths']=pl
# Lakeside
t=d['sglakeside']
park=Polygon([a for a in t['areas'] if a['area']==382006][0]['ring'])
cg=Polygon(json.load(open('cg_hull_lake.json'))).buffer(10)
K2=park.difference(cg)
if K2.geom_type!='Polygon': K2=max(K2.geoms,key=lambda g:g.area)
lb=[]
for b in t['buildings']:
  if K2.contains(Point(b['centroid'])): lb.append({'o':b['osm'],'n':b['name'],'h':b['h'],'a':b['area'],'r':[[round(p[0],1),round(p[1],1)] for p in b['ring']]})
ar=[]
for a in t['areas']:
  if a['kind'] in ('wood','meadow','grass','garden'):
    g=Polygon(a['ring']).intersection(K2)
    if g.area>500:
      gs=[g] if g.geom_type=='Polygon' else [x for x in getattr(g,'geoms',[]) if x.geom_type=='Polygon']
      for x in gs:
        if x.area>500: ar.append({'k':a['kind'],'r':R(x,1.5)})
pl=[]
for r in t['roads']:
  if r['cls']>=11:
    L=LineString(r['pts'])
    if L.intersects(K2): pl.append([[round(p[0]),round(p[1])] for p in r['pts']])
out['lk']={'a':[t['anchor']['lat'],t['anchor']['lon']],'keep':R(K2,2.0),'b':lb,'areas':ar,'paths':pl,'area':K2.area}
print(len(out['jp']['keep']),len(out['jp']['b']),len(out['jp']['paths']),out['jp']['area'])
print(len(out['lk']['keep']),len(out['lk']['b']),len(out['lk']['areas']),len(out['lk']['paths']),out['lk']['area'])
json.dump(out,open('sites.json','w'),separators=(',',':'))
