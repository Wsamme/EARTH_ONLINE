# data block D for szluohu.js: the two sites (Dongmen, Huaqiangbei) from the refs and the OSM area rings (rings.json)
import json
from shapely.geometry import Polygon, Point, LineString
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
T = json.load(open(SC + 'gba/ref_szluohu.json'))['targets']; RG = json.load(open(SC + 'gba/szluohu/rings.json'))
MX, MY = 103014.2, 110734.9
r1 = lambda v: round(v, 1)
def loc(ring, lat0, lon0): return [[r1((lo - lon0)*MX), r1(-(la - lat0)*MY)] for la, lo in ring]
D = {}
# ---- Dongmen: anchor = the area centroid (= the ref anchor)
t = T['szdongmen']; a = t['anchor']
keep = loc(RG['w1238852261']['ring'][:-1], a['lat'], a['lon']); P = Polygon(keep)
B = []
for b in t['buildings']:
    if P.contains(Point(b['centroid'])): B.append({'r': [[r1(x), r1(z)] for x, z in b['ring']], 'h': r1(b['h']), 'id': b['osm']})
paths = []
for r in t['roads']:
    if r['cls'] in (10, 11, 12) and P.intersects(LineString(r['pts'])):
        L = LineString(r['pts']).intersection(P)
        for g in (L.geoms if hasattr(L, 'geoms') else [L]):
            if g.length > 8: paths.append({'c': r['cls'], 'p': [[r1(x), r1(y)] for x, y in g.coords]})
D['dm'] = {'lat': a['lat'], 'lon': a['lon'], 'keep': keep, 'b': B, 'paths': paths}
# ---- Huaqiangbei: anchor = the pedestrian mall's centroid (w588249188); ref coordinates shifted
t = T['szhuaqiangbei']; a = t['anchor']; c = RG['w588249188']['c']
dx, dz = (a['lon'] - c[1])*MX, -(a['lat'] - c[0])*MY
keep = loc(RG['w588249188']['ring'][:-1], c[0], c[1]); P = Polygon(keep)
inner = []
for b in t['buildings']:
    cc = Point(b['centroid'][0] + dx, b['centroid'][1] + dz)
    if P.contains(cc): inner.append({'r': [[r1(x + dx), r1(z + dz)] for x, z in b['ring']], 'h': r1(b['h']), 'id': b['osm'], 'a': round(b['area'])})
# frontage buildings: within 6 m of the street polygon (outside it), for the canopies along their faces
front = []
for b in t['buildings']:
    pg = Polygon([(x + dx, z + dz) for x, z in b['ring']])
    if not pg.is_valid or P.contains(pg.centroid): continue
    if pg.distance(P) < 4 and pg.area > 400: front.append({'r': [[r1(x), r1(z)] for x, z in pg.exterior.coords[:-1]], 'h': r1(b['h'])})
roads = []
for r in t['roads']:
    ls = LineString([(x + dx, z + dz) for x, z in r['pts']])
    if P.intersects(ls) and r['cls'] <= 10: roads.append({'c': r['cls'], 'p': [[r1(x), r1(y)] for x, y in ls.coords]})
D['hqb'] = {'lat': c[0], 'lon': c[1], 'keep': keep, 'inner': inner, 'front': front, 'roads': roads}
json.dump(D, open(SC + 'gba/szluohu/data.json', 'w'), separators=(',', ':'))
print('dm', len(D['dm']['b']), 'paths', len(D['dm']['paths']), '| hqb inner', len(inner), [(b['id'], b['h'], b['a']) for b in inner], 'front', len(front), 'roads', len(roads))
print('hqb keep bounds', P.bounds, 'anchor', c)
# ---- placements (street furniture) with clearances, so nothing stands in a building or on a public road
from shapely.ops import unary_union
def along(line, step, off=0):
    L = LineString(line); n = int(L.length//step); return [L.interpolate(off + i*step) for i in range(n + 1) if off + i*step <= L.length]
# Dongmen
dm = D['dm']; P = Polygon(dm['keep']); BU = unary_union([Polygon(b['r']).buffer(0) for b in dm['b']] + [Polygon(b['ring']).buffer(0) for b in T['szdongmen']['buildings']])
RD = unary_union([LineString(r['pts']).buffer(6) for r in T['szdongmen']['roads'] if r['cls'] <= 10])
lamps, trees = [], []
for p in dm['paths']:
    for q in along(p['p'], 22, 6):
        if P.buffer(-2).contains(q) and q.distance(BU) > 2.5 and not RD.contains(q): lamps.append([r1(q.x), r1(q.y)])
    for q in along(p['p'], 26, 17):
        if P.buffer(-3).contains(q) and q.distance(BU) > 5.5 and not RD.contains(q): trees.append([r1(q.x), r1(q.y)])
# thin out duplicates (paths overlap)
def thin(pts, d):
    out = []
    for p in pts:
        if all((p[0] - o[0])**2 + (p[1] - o[1])**2 > d*d for o in out): out.append(p)
    return out
dm['lamps'] = thin(lamps, 14); dm['trees'] = thin(trees, 14)
# the bell near Siyue Academy: the nearest open point to the academy with 7 m clearance
best = None
for i in range(-60, 61, 3):
    for j in range(-60, 61, 3):
        q = Point(34.5 + i, -108.2 + j)
        if P.buffer(-4).contains(q) and q.distance(BU) > 6 and not RD.contains(q):
            d = q.distance(Point(34.5, -108.2))
            if best is None or d < best[0]: best = (d, q)
dm['bell'] = [r1(best[1].x), r1(best[1].y)] if best else None
# Huaqiangbei
h = D['hqb']; P = Polygon(h['keep']); FB = unary_union([Polygon(b['r']).buffer(0) for b in h['front']])
ALLB = unary_union([Polygon([(x + dx, z + dz) for x, z in b['ring']]).buffer(0) for b in T['szhuaqiangbei']['buildings']])
RD = unary_union([LineString(r['p']).buffer(11) for r in h['roads']])
# the street axis: the polygon's medial line approximated by the mid-points of horizontal cuts
axis = []
x0, z0, x1, z1 = P.bounds
for z in range(int(z0) + 4, int(z1) - 3, 6):
    cut = LineString([(x0 - 5, z), (x1 + 5, z)]).intersection(P)
    segs = list(cut.geoms) if hasattr(cut, 'geoms') else [cut]
    segs = [s for s in segs if s.length > 3]
    if not segs: continue
    s = max(segs, key=lambda s: s.length); xs = [c[0] for c in s.coords]
    axis.append((min(xs), max(xs), z))
trees, lamps, cans = [], [], []
for i, (xa, xb, z) in enumerate(axis):
    w = xb - xa
    if i % 2 == 0:
        for f in ([0.3, 0.7] if w > 30 else [0.5]):
            q = Point(xa + w*f, z)
            if q.distance(ALLB) > 5 and not RD.contains(q): trees.append([r1(q.x), r1(q.y)])
    if i % 4 == 1:
        for f in ([0.12, 0.88] if w > 24 else [0.5]):
            q = Point(xa + w*f, z)
            if q.distance(ALLB) > 1.5 and not RD.contains(q): lamps.append([r1(q.x), r1(q.y)])
# canopies: along the frontage faces, segments of the street edge that lie within 4 m of a frontage building and off the roads
E = P.exterior; L = E.length; k = 0
seg = []
while k < L:
    a = E.interpolate(k); b = E.interpolate(min(L, k + 4))
    m = Point((a.x + b.x)/2, (a.y + b.y)/2)
    ok = m.distance(FB) < 4 and not RD.contains(m)
    if ok:
        dxs, dzs = b.x - a.x, b.y - a.y; l = (dxs*dxs + dzs*dzs)**0.5 or 1; nx, nz = -dzs/l, dxs/l
        if not P.contains(Point(m.x + nx*1.5, m.y + nz*1.5)): nx, nz = -nx, -nz
        seg.append([r1(a.x), r1(a.y), r1(b.x), r1(b.y), round(nx, 3), round(nz, 3)])
    k += 4
ent = []
for p in T['szhuaqiangbei']['pois']:
    if p.get('tags', {}).get('railway') == 'subway_entrance':
        q = Point(p['at'][0] + dx, p['at'][1] + dz)
        if P.buffer(3).contains(q) and not RD.contains(q): ent.append([r1(q.x), r1(q.y)])
h['ent'] = ent; print('entrances', ent)
h['trees'] = trees; h['lamps'] = lamps; h['cans'] = seg; h['axis'] = [[r1(a), r1(b), z] for a, b, z in axis]
json.dump(D, open(SC + 'gba/szluohu/data.json', 'w'), separators=(',', ':'))
print('dm lamps', len(dm['lamps']), 'trees', len(dm['trees']), 'bell', dm['bell'], '| hqb trees', len(trees), 'lamps', len(lamps), 'canopy segs', len(seg))
