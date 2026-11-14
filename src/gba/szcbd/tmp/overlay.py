# offline overlay: hull of the lower-25 m vertices grown 3 m vs this build's footprints (hidden if centroid inside or > half outline inside)
import json, sys, math, pickle
sys.path.insert(0, '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/gbareal')
from common import *
from shapely.geometry import MultiPoint, Point, Polygon
from shapely.strtree import STRtree
L = json.load(open(sys.argv[1])); keys = sys.argv[2].split(',') if len(sys.argv) > 2 else list(L)
Bd = load('buildings.pkl')['b']; BT = STRtree([b['g'] for b in Bd])
for k in keys:
    d = L[k]; ax, ay = w(d['lon'], d['lat'])
    # model three.js (x, z) -> world (x, y): x east, -z north
    hullw = MultiPoint([(ax + x, ay - z) for x, z in d['pts']]).convex_hull.buffer(3)
    hid, clash = [], []
    for i in BT.query(hullw):
        b = Bd[int(i)]; g = b['g']
        inside = g.centroid.within(hullw) or g.intersection(hullw).area > 0.5*g.area
        if inside: hid.append((b['id'], round(b['h']), b.get('zh') or b.get('name'), round(g.area)))
        elif g.intersection(hullw).area > 5: clash.append((b['id'], round(b['h']), b.get('zh') or b.get('name'), round(g.intersection(hullw).area)))
    print('==', k, 'hull area', round(hullw.area), 'hidden', len(hid)); print('  hidden:', sorted(hid, key=lambda r: -r[1])[:14]); print('  CLASH:', clash)
