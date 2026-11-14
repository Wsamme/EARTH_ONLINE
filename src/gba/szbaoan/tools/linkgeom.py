# Lingdingyang Bridge frame from this build's data (read only): towers = the two pairs of OSM bridge:support islets, east anchorage =
# r13688120 (note 锚碇). Writes tools/link.json: frame + both deck lines + islet rings in the model's local frame (x along the axis
# toward Shenzhen, z across, +z = the left side looking east... three.js local: world (x,y) -> local (u, -v) after rotation).
import sys, pickle, json, math
sys.path.insert(0, '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/gbareal')
import common as C, shapely.wkb
A = {}
for oid, fw, t, wk in pickle.load(open(C.OUT + 'raw_areas.pkl', 'rb')):
    k = ('w' if fw else 'r') + str(oid)
    if k in ('w1022190925', 'w1022190926', 'w1022190927', 'w1022190928', 'r13688120', 'w689375211', 'w1292765148', 'w1465183400'):
        g = C.proj(shapely.wkb.loads(wk)); A[k] = g
cW = [(A['w1022190925'].centroid.x + A['w1022190926'].centroid.x)/2, (A['w1022190925'].centroid.y + A['w1022190926'].centroid.y)/2]
cE = [(A['w1022190927'].centroid.x + A['w1022190928'].centroid.x)/2, (A['w1022190927'].centroid.y + A['w1022190928'].centroid.y)/2]
span = math.hypot(cE[0] - cW[0], cE[1] - cW[1]); ux, uy = (cE[0] - cW[0])/span, (cE[1] - cW[1])/span
R = pickle.load(open(C.OUT + 'roads_b4.pkl', 'rb')); L = R['lines']; E = R['elev']
ids = [i for i, l in enumerate(L) if l['c'] == 0 and l['br'] and (l.get('bname') or '') == '深中大桥']
print('deck lines', ids)
# refine the axis: the mid line of the two carriageways over the main span
from shapely.geometry import Point
M = [(cW[0] + cE[0])/2, (cW[1] + cE[1])/2]
def loc(x, y): dx, dy = x - M[0], y - M[1]; return (dx*ux + dy*uy, -(-dx*uy + dy*ux))   # (along, local z: + = right of the axis looking along +x... three.js z)
off = []
for i in ids:
    for x, y in L[i]['g'].coords:
        a, z = loc(x, y)
        if abs(a) < 800: off.append((i, z))
for i in ids: zs = [z for j, z in off if j == i]; print('line', i, 'mean z over main span %.2f' % (sum(zs)/len(zs)), 'n', len(zs))
zm = sum(z for _, z in off)/len(off); print('carriageway mid line offset from the islet axis %.2f m' % zm)
# shift the origin onto the deck mid line
vx, vy = -uy, ux          # world left normal; local z = -(left) so a point at local z has world offset -z*(vx,vy)
M = [M[0] - zm*vx, M[1] - zm*vy]
lon, lat = C.ll(*M); rot = math.atan2(uy, ux)
out = {'lat':lat, 'lon':lon, 'rot':rot, 'span':span, 'M':M, 'u':[ux, uy], 'lines':{}, 'rings':{}}
for i in ids:
    cs = list(L[i]['g'].coords); out['lines'][str(i)] = {'p':[[round(v, 2) for v in loc(x, y)] for x, y in cs], 'e':E.get(i), 'ow':L[i].get('ow')}
for k, g in A.items():
    gs = getattr(g, 'geoms', [g]); out['rings'][k] = [[[round(v, 1) for v in loc(x, y)] for x, y in p.exterior.coords] for p in gs]
for k in ('w1022190925', 'w1022190926', 'w1022190927', 'w1022190928', 'r13688120'): print(k, 'centroid local', [round(v, 1) for v in loc(A[k].centroid.x, A[k].centroid.y)], 'area', round(A[k].area))
print('frame lat %.7f lon %.7f rot %.5f span %.1f' % (lat, lon, rot, span))
json.dump(out, open('tools/link.json', 'w'))
