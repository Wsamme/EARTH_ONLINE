# offline version of the app's hide rule: model vertices below 25 m -> convex hull + 3 m; hidden / clashing ref buildings, roads
import json, sys, math
from shapely.geometry import MultiPoint, Polygon, LineString, Point
ref = json.load(open('../ref_szbaoan.json'))['targets']
key, dump = sys.argv[1], sys.argv[2]; tk = sys.argv[3] if len(sys.argv) > 3 else key
D = json.load(open(dump)); pts = []
for col, pos in D:
    for i in range(0, len(pos), 3):
        if pos[i + 1] < 25: pts.append((round(pos[i], 1), round(pos[i + 2], 1)))
H = MultiPoint(list(set(pts))).convex_hull
c = H.centroid; Hc = Polygon([(c.x + (x - c.x)*(1 + 3/max(1e-6, math.hypot(x - c.x, y - c.y))), c.y + (y - c.y)*(1 + 3/max(1e-6, math.hypot(x - c.x, y - c.y)))) for x, y in H.exterior.coords])
t = ref[tk]; hid, clash = [], []
for b in t['buildings']:
    R = b['ring']; inside = sum(Hc.contains(Point(p)) for p in R)
    if Hc.contains(Point(b['centroid'])) or inside > len(R)/2: hid.append((b['osm'], b.get('h'), round(b['area'])))
    elif inside: clash.append((b['osm'], b.get('h'), inside, len(R), b['centroid']))
rd = [(r['cls'], r.get('name'), r.get('bridge')) for r in t['roads'] if r['cls'] <= 10 and not r.get('bridge') and Hc.intersects(LineString(r['pts'])) and len(r['pts']) > 1]
print(key, 'hull area %.0f' % Hc.area, 'hidden', len(hid), hid[:12]); print('  clash', clash); print('  public at-grade roads crossing the hull:', len(rd), rd[:8])
