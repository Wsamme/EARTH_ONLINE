# list the buildings of this build (and named raw footprints) inside an OSM area / near a point: python3 inplot.py a:w123 [...] | n:lat,lon,r
import sys, os, pickle; HERE = os.path.dirname(os.path.abspath(__file__)) + '/'; sys.path.insert(0, HERE + '..')
from common import *
import shapely.wkb
from shapely.geometry import Point
from shapely.strtree import STRtree
R = pickle.load(open(HERE + 'names.pkl', 'rb')); idx = {(k, oid): (t, wk) for k, oid, t, wk in R if k in ('b', 'a')}
Bd = load('buildings.pkl')['b']; BT = STRtree([b['g'] for b in Bd])
for a in sys.argv[1:]:
    k, ref = a.split(':', 1)
    if k == 'n': lat, lon, r = map(float, ref.split(',')); g = Point(*w(lon, lat)).buffer(r)
    else: t, wk = idx[(k, ref)]; g = proj(shapely.wkb.loads(wk)).buffer(0)
    bb = sorted([Bd[int(i)] for i in BT.query(g) if Bd[int(i)]['g'].representative_point().within(g)], key=lambda b: -b['h'])
    print('##', a, len(bb))
    for b in bb[:8]:
        c = b['g'].centroid; lon, lat = ll(c.x, c.y)
        print('  %s h %.1f fl %s %dm2 %.6f,%.6f %s %s' % (b['id'], b['h'], b['fl'], b['g'].area, lat, lon, b['name'], b.get('zh')))
