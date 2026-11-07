import json, math
from shapely.geometry import Polygon, Point, LineString
from shapely.ops import unary_union
D=json.load(open('../ref_sg40g.json'))['targets']
D1=json.load(open('../ref_sg40g_1.json'))['targets']
def area(t,kind,a):
  for x in t['areas']:
    if x['kind']==kind and x['area']==a: return Polygon(x['ring']).buffer(0)
  raise Exception('no area %s %s'%(kind,a))
SPEC={
 'sgzoo':[('zoo',231232)],
 'sgriverwonders':[('zoo',76481)],
 'sgnightsafari':[('zoo',160956),('zoo',116975)],
 'sgbirdparadise':[('zoo',80462),('zoo',57184)],
 'sgsungeibuloh':None,
}
out={}
r1=lambda v: round(v,1)
for k,sp in SPEC.items():
  t=D1[k] if k in D1 else D[k]
  if sp:
    P=unary_union([area(t,*s) for s in sp]).buffer(0.5).buffer(-0.5)
  else:
    P=area(t,'nature_reserve',844721).intersection(Point(0,0).buffer(520))
  if P.geom_type!='Polygon': P=max(P.geoms,key=lambda g:g.area)
  P=Polygon(P.exterior).simplify(1.5)
  keep=[[r1(x),r1(z)] for x,z in list(P.exterior.coords)[:-1]]
  PB=P.buffer(4)
  blds=[]
  for b in t['buildings']:
    c=Point(*b['centroid'])
    if not PB.contains(c): continue
    R=Polygon(b['ring']).buffer(0)
    if R.area<6: continue
    mr=R.minimum_rotated_rectangle; cs=list(mr.exterior.coords)[:4]
    e1=math.hypot(cs[1][0]-cs[0][0],cs[1][1]-cs[0][1]); e2=math.hypot(cs[2][0]-cs[1][0],cs[2][1]-cs[1][1])
    if e1>=e2: ang=math.atan2(cs[1][1]-cs[0][1],cs[1][0]-cs[0][0]); L,W=e1,e2
    else: ang=math.atan2(cs[2][1]-cs[1][1],cs[2][0]-cs[1][0]); L,W=e2,e1
    ring=[[r1(x),r1(z)] for x,z in list(Polygon(b['ring']).simplify(0.3).exterior.coords)[:-1]]
    blds.append(dict(n=b.get('name') or '', o=b['osm'], h=b['h'], e=b['est'], t=b['type'], a=round(R.area), r=ring, ob=[r1(mr.centroid.x),r1(mr.centroid.y),r1(L),r1(W),round(ang,3)]))
  paths=[]
  for r in t['roads']:
    if r['cls'] not in (10,11,12): continue
    L=LineString(r['pts'])
    if not P.intersects(L): continue
    I=L.intersection(P.buffer(1))
    segs=[I] if I.geom_type=='LineString' else [g for g in getattr(I,'geoms',[]) if g.geom_type=='LineString']
    for s in segs:
      if s.length<4: continue
      paths.append([r['cls'], 1 if r.get('br') else 0]+[v for p in s.coords for v in (r1(p[0]),r1(p[1]))])
  pois=[[p['name'],p['kind'],r1(p['at'][0]),r1(p['at'][1])] for p in t['pois'] if P.buffer(10).contains(Point(*p['at']))]
  out[k]=dict(anchor=t['anchor'],keep=keep,area=round(P.area),bld=blds,paths=paths,pois=pois, bbox=[r1(v) for v in P.bounds])
  print(k,'keep',len(keep),'area',round(P.area),'bld',len(blds),'paths',len(paths),'pois',len(pois),'bounds',[round(v) for v in P.bounds], 'maxR',round(max(math.hypot(*p) for p in keep)))
json.dump(out,open('sites.json','w'))
