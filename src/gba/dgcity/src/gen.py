# dgcity data extraction: ref_dgcity.json + tools/areas.json -> src/data.json (local metres, +x east, +z south)
import json
from shapely.geometry import Polygon, Point, LineString
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/wipsrc/src/gba/'
T=json.load(open(SC+'ref_dgcity.json'))['targets']
A=json.load(open(SC+'dgcity/tools/areas.json'))
r1=lambda v:round(v,1)
def ring(r): return [[r1(p[0]),r1(p[1])] for p in r]
def ext(r):
  o=[]
  for p in r:
    if p is None: break
    o.append(p)
  return o
def area_local(aid,la,lo):
  for a in A:
    if a['id']==aid: return [[r1((p[0]-lo)*103014.2),r1(-(p[1]-la)*110734.9)] for p in ext(a['r'][0])][:-1]
def bld(k,osm):
  for b in T[k]['buildings']:
    if b['osm']==osm: return {'r':ring(b['ring']),'h':b['h'],'id':osm}
D={}
D['ch']={k:bld('dgcityhall',o) for k,o in [('main','r19166415'),('n','r19166414'),('e','r19166412'),('w','r19166413')]}
D['ch']['links']=[bld('dgcityhall',o) for o in ('w1389046914','w1389046915','w1389046918')]
D['ch']['grounds']=area_local('w619355200',23.023436,113.746648)
for key,o in [('yulan','w520281241'),('library','w520281240'),('exhibition','w520278682'),('tba','w1458006477'),('minying','w1287829518'),('yingen','w520439670')]:
  D[key]=bld('dg'+key,o)
def site(key,aid,cls=(11,12),extra_ids=()):
  t=T[key]; la,lo=t['anchor']['lat'],t['anchor']['lon']
  keep=area_local(aid,la,lo); P=Polygon(keep)
  S={'lat':la,'lon':lo,'keep':keep,'areas':[],'paths':[],'b':[]}
  for a in A:
    if a['id']==aid: continue
    tg=a['t']; kind=('water' if tg.get('natural')=='water' or tg.get('water') else 'wood' if tg.get('natural')=='wood' or tg.get('landuse')=='forest' else 'grass' if tg.get('landuse') in ('grass','flowerbed') else None)
    if not kind: continue
    r=[[r1((p[0]-lo)*103014.2),r1(-(p[1]-la)*110734.9)] for p in ext(a['r'][0])][:-1]
    if len(r)<3: continue
    try:
      q=Polygon(r)
      if not q.is_valid or q.area<20: continue
      if P.contains(q.representative_point()) and q.area<P.area*0.6: S['areas'].append({'k':kind,'r':r,'id':a['id']})
    except Exception: pass
  for rd in t['roads']:
    if rd['cls'] in cls and not rd['bridge']:
      L=LineString(rd['pts'])
      if P.intersects(L):
        g=P.intersection(L)
        for seg in (getattr(g,'geoms',[g])):
          if seg.geom_type=='LineString' and seg.length>4: S['paths'].append({'c':rd['cls'],'p':[[r1(x),r1(z)] for x,z in seg.coords]})
  for b in t['buildings']:
    if P.contains(Point(b['centroid'])): S['b'].append({'r':ring(b['ring']),'h':b['h'],'id':b['osm'],'zh':b.get('zh')})
  return S
D['sq']=site('dgsquare','w520278681')
D['ky']=site('dgkeyuan','w619355190')
D['qf']=site('dgqifeng','w520436667')
qf=T['dgqifeng']; D['qf']['pois']=[{'n':p['name'],'t':list(p['tags'].values())[0],'at':p['at']} for p in qf['pois'] if p['tags'].get('natural')=='peak' or p['tags'].get('amenity')=='shelter']
for k in ('sq','ky','qf'):
  s=D[k]; print(k,len(s['keep']),'areas',len(s['areas']),'paths',len(s['paths']),'bld',[(b['id'],b['zh'],b['h'],len(b['r'])) for b in s['b']])
json.dump(D,open(SC+'dgcity/src/data.json','w'),ensure_ascii=False,separators=(',',':'))
import os; print(os.path.getsize(SC+'dgcity/src/data.json'))
