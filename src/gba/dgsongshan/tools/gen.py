# Generates the data block (D) of dgsongshan.js from gba/ref_dgsongshan.json (real OSM footprints / heights of this build).
import json, math
from shapely.geometry import Polygon, MultiPoint, Point
W='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/wipsrc/src/gba/'
R=json.load(open(W+'ref_dgsongshan.json'))['targets']
KX,KY=103014.2,110734.9
def rr(ring): 
  r=[[round(p[0],1),round(p[1],1)] for p in ring]
  if r[0]==r[-1]: r=r[:-1]
  return r
D={}
def site(k, sel, pad=8, shift=(0,0)):
  v=R[k]; a=v['anchor']; bs=[b for b in v['buildings'] if sel(b)]
  pts=[p for b in bs for p in b['ring']]
  hull=MultiPoint(pts).convex_hull.buffer(pad, join_style=2).simplify(1.5)
  # every ref building whose centroid lies inside the keep is rebuilt
  allb=[b for b in v['buildings'] if hull.contains(Point(b['centroid']))]
  sx,sz=shift
  out={'lat':round(a['lat']-sz/KY,7),'lon':round(a['lon']+sx/KX,7),
       'keep':[[round(x-sx,1),round(z-sz,1)] for x,z in list(hull.exterior.coords)[:-1]],
       'b':[{'r':[[p[0]-sx,p[1]-sz] for p in rr(b['ring'])],'h':b['h'],'n':b.get('zh') or '','t':b['type'],'o':b['osm']} for b in allb]}
  for b in out['b']: b['r']=[[round(x,1),round(z,1)] for x,z in b['r']]
  rad=max(math.hypot(x,z) for x,z in out['keep'])
  out['rad']=round(rad)
  D[k]=out; return out
# Ox Horn: the campus clusters (leave out the apartments south of the expressway and the plots east of the campus road)
o=site('dgoxhorn', lambda b: b['centroid'][1] < 480 and b['centroid'][0] < 540)
v=R['dgoxhorn']
o['tram']=[[[round(p[0],1),round(p[1],1)] for p in r['pts']] for r in v['roads'] if r['cls']==15 or r.get('rail')]
o['stops']=[[round(p['at'][0],1),round(p['at'][1],1)] for p in v['pois'] if p['tags'].get('railway')=='tram_stop']
print('ox cls', sorted(set(r['cls'] for r in v['roads'])), 'tram', len(o['tram']), 'stops', len(o['stops']))
site('dgdgut', lambda b: math.hypot(*b['centroid']) < 917)
site('dgcsns', lambda b: True)
# Guanyinshan: the summit temple terrace round the statue (OSM w1336365406 观世音菩萨); anchor shifted onto the statue
st=[b for b in R['dgguanyin']['buildings'] if b['osm']=='w1336365406'][0]
cx,cz=st['centroid']
site('dgguanyin', lambda b: abs(b['centroid'][0]-870)<130 and abs(b['centroid'][1]-330)<130, pad=10, shift=(cx,cz))
site('dgnanshe', lambda b: True, pad=10)
for k in ['dgbasketball','dgstation','dgsouthstation']:
  v=R[k]; a=v['anchor']; b=v['buildings'][0]
  D[k]={'lat':a['lat'],'lon':a['lon'],'fp':rr(b['ring']),'h':b['h'],'o':b['osm'],'ground':v['ground'],
        'rad':round(max(math.hypot(*p) for p in b['ring'])),
        'rail':[[[round(p[0],1),round(p[1],1)] for p in r['pts']] for r in v['roads'] if r['cls']==15]}
  # enclosed halls: the parts of the station footprint more than 24 m from the tracks (the platforms / tracks stay open under the roof)
  from shapely.geometry import LineString
  from shapely.ops import unary_union
  fp=Polygon(D[k]['fp']); rl=[LineString(r) for r in D[k]['rail'] if len(r)>1]
  if rl:
    hall=fp.difference(unary_union([l.buffer(24) for l in rl]))
    gs=getattr(hall,'geoms',[hall])
    D[k]['halls']=[[[round(x,1),round(z,1)] for x,z in list(gg.simplify(1.0).exterior.coords)[:-1]] for gg in gs if gg.geom_type=='Polygon' and gg.area>600]
  else: D[k]['halls']=[]
  print(k,'halls',[round(Polygon(h).area) for h in D[k]['halls']], 'rails', len(rl))
for k,v in D.items(): print(k, v.get('rad'), len(v.get('b',[])), v.get('h'), v['lat'], v['lon'])
json.dump(D, open(W+'dgsongshan/tools/D.json','w'), separators=(',',':'), ensure_ascii=False)
