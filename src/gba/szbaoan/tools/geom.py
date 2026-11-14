# print local-metre geometry of chosen raw areas / ways around an anchor  usage: geom.py lat lon id1 id2 ...
import sys, pickle
sys.path.insert(0, '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/gbareal')
import common as C, shapely.wkb
lat0, lon0 = float(sys.argv[1]), float(sys.argv[2]); ids = set(sys.argv[3:])
X0, Y0 = C.w(lon0, lat0)
loc = lambda lon, lat: (round(C.w(lon, lat)[0] - X0, 1), round(-(C.w(lon, lat)[1] - Y0), 1))
for oid, fw, t, wk in pickle.load(open(C.OUT + 'raw_areas.pkl', 'rb')):
    k = ('w' if fw else 'r') + str(oid)
    if k in ids:
        g = shapely.wkb.loads(wk); gs = getattr(g, 'geoms', [g])
        for p in gs: print('A', k, t.get('name'), [loc(*c) for c in p.exterior.coords])
if any(i.startswith('W') for i in ids):
    for wid, t, cs in pickle.load(open(C.OUT + 'raw_ways.pkl', 'rb')):
        if 'W%d' % wid in ids: print('W', wid, t.get('name'), t.get('layer'), [loc(*c) for c in cs])
