import json, sys
from shapely.geometry import Polygon, Point
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
T={t['key']:t for t in json.load(open(SC+'gba/targets.json'))['groups']['szoct']}
A=json.load(open(SC+'gba/szoct/tools/areas.json')); R=json.load(open(SC+'gba/ref_szoct.json'))['targets']
X0,Y0=114.0520475,22.6560705
def W(lon,lat): return ((lon-X0)*103014.2,(lat-Y0)*110734.9)
key=sys.argv[1]; t=T[key]; ax,ay=W(t['lon'],t['lat'])
def L(lon,lat): x,y=W(lon,lat); return (x-ax, -(y-ay))
site=[a for a in A['areas'] if a['id']==t['osm']][0]
K=Polygon([L(*p) for p in site['rings'][0]]).buffer(float(sys.argv[2]) if len(sys.argv)>2 else 0)
n=0
for b in sorted(R[key]['buildings'],key=lambda b:-b['area']):
    if K.contains(Point(b['centroid'])):
        n+=1; print(b['osm'],b.get('name'),b.get('zh'),b['h'],b['floors'],b['type'],b['area'],b['centroid'],'P' if b.get('parts') else '')
print(n)
