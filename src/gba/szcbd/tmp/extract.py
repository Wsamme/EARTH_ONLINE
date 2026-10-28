# dump this build's buildings (rings in local metres: +x east, +z south) around anchors, plus named areas' rings
import sys, os, pickle, json
sys.path.insert(0, '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/gbareal')
from common import *
import shapely.wkb
from shapely.geometry import Point
from shapely.strtree import STRtree
T = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/gbareal/targets/'
R = pickle.load(open(T + 'names.pkl', 'rb')); idx = {oid: (k, t, wk) for k, oid, t, wk in R if k in ('b', 'a')}
jobs = json.loads(sys.argv[1]); out = {}
Bd = load('buildings.pkl')['b']; BT = STRtree([b['g'] for b in Bd])
for key, lat, lon, rad, areas in jobs:
    ax, ay = w(lon, lat); L = lambda x, y: [round(x - ax, 1), round(-(y - ay), 1)]
    g = Point(ax, ay).buffer(rad)
    bl = []
    for i in BT.query(g):
        b = Bd[int(i)]
        if not b['g'].representative_point().within(g): continue
        gg = b['g']; gs = getattr(gg, 'geoms', [gg])
        bl.append({'id': b['id'], 'h': round(b['h'], 1), 'fl': b['fl'], 'name': b.get('name'), 'zh': b.get('zh'), 'rings': [[L(x, y) for x, y in p.exterior.coords[:-1]] for p in gs]})
    ar = {}
    for a in areas:
        k, t, wk = idx[a]; gg = proj(shapely.wkb.loads(wk)); gs = getattr(gg, 'geoms', [gg])
        ar[a] = {'tags': t, 'rings': [[L(x, y) for x, y in p.exterior.coords[:-1]] for p in gs]}
    out[key] = {'b': bl, 'areas': ar}
    print(key, len(bl), file=sys.stderr)
json.dump(out, open(sys.argv[2], 'w'))
print(list(Bd[0].keys()), file=sys.stderr)
