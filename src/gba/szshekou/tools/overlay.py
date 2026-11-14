# offline overlay: hull of the model's vertices below 25 m (+3 m), which ref buildings get hidden, which clash
import json, sys
from shapely.geometry import MultiPoint, Polygon, Point
REF = json.load(open(sys.path[0] + '/../../ref_szshekou.json'))['targets']
for key in sys.argv[1:]:
    T = json.load(open(sys.path[0] + '/dump/%s.json' % key))
    ymin = min(min(t[1], t[4], t[7]) for t in T)
    pts = [(t[i], t[i+2]) for t in T for i in (0, 3, 6) if t[i+1] < 25 + 0 * ymin]
    H = MultiPoint(pts).convex_hull.buffer(3)
    hid, cl = [], []
    for b in REF[key]['buildings']:
        P = Polygon(b['ring']); n = len(b['ring']); inside = sum(H.contains(Point(p)) for p in b['ring'])
        if H.contains(P.centroid) or inside > n/2: hid.append('%s %.0fm' % (b['osm'], b['h']))
        elif inside: cl.append('%s %.0fm %d/%d' % (b['osm'], b['h'], inside, n))
    print(key, 'hull area %.0f' % H.area, '\n  hidden:', hid, '\n  clash:', cl)
