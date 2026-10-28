import json, sys
from shapely.geometry import Polygon, Point
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
T={t['key']:t for t in json.load(open(SC+'gba/targets.json'))['groups']['szoct']}
A=json.load(open(SC+'gba/szoct/tools/areas.json'))
X0,Y0=114.0520475,22.6560705
def W(lon,lat): return ((lon-X0)*103014.2,(lat-Y0)*110734.9)
key=sys.argv[1]; t=T[key]; ax,ay=W(t['lon'],t['lat'])
def L(lon,lat): x,y=W(lon,lat); return (x-ax, -(y-ay))
site=[a for a in A['areas'] if a['id']==t['osm']][0]
K=Polygon([L(*p) for p in site['rings'][0]])
print(key,'keep area',round(K.area),'bounds',[round(v) for v in K.bounds])
for a in A['areas']:
    if a['id']==t['osm']: continue
    for r in a['rings']:
        P=Polygon([L(*p) for p in r])
        if not P.is_valid: P=P.buffer(0)
        if P.area<30: continue
        if K.intersection(P).area>0.6*P.area:
            tt={k:v for k,v in a['t'].items() if k in('name','leisure','landuse','natural','water','amenity','tourism','building','sport','man_made','historic')}
            print(' A',a['id'],tt,round(P.area),[round(v) for v in P.centroid.coords[0]])
for n in A['nodes']:
    p=Point(L(*n['at']))
    if K.contains(p): print(' N',{k:v for k,v in n['t'].items() if k in('name','tourism','amenity','man_made','historic','natural','leisure')},[round(v) for v in p.coords[0]])
