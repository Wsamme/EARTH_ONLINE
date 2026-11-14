# gendata.py -> data.json : the compact data block D of szshekou.js (local metres round each anchor: +x east, +z south)
# Sources: gba/ref_szshekou.json (this build's footprints, roads, terrain) and an osmium extract of gbareal/data/gba.osm.pbf
# (tools/sk.geojsonseq: OSM areas, parts, crane rails, nodes that are not in the refs).
import json, math, sys
from shapely.geometry import Polygon, LineString, Point, MultiLineString
from shapely.ops import unary_union
HERE = sys.path[0] + '/'
REF = json.load(open(HERE + '../../ref_szshekou.json'))['targets']
F = {}
for line in open(HERE + 'sk.geojsonseq'):
    f = json.loads(line.strip('\x1e\n')); p = f['properties']; F.setdefault(p['@type'][0] + str(p['@id']), []).append(f)
def rnd(v, k=1): return round(v, k)
def loc(lat0, lon0, c): return [rnd((c[0] - lon0)*103014.2), rnd(-(c[1] - lat0)*110734.9)]
def rings(key, lat0, lon0):
    out = []
    for f in F.get(key, []):
        g = f['geometry']; c = g['coordinates']
        if g['type'] == 'LineString': R = [c]
        elif g['type'] == 'Polygon': R = c[:1]
        elif g['type'] == 'MultiPolygon': R = [poly[0] for poly in c]
        elif g['type'] == 'Point': R = [[c]]
        else: continue
        for r in R: out.append([loc(lat0, lon0, q) for q in r])
        if g['type'] != 'LineString': break
    return out
def ring(key, T):
    R = rings(key, T['lat'], T['lon']); R.sort(key=lambda r: -len(r))
    r = R[0]
    if len(r) > 2 and r[0] == r[-1]: r = r[:-1]
    return r
def tags(key): return F[key][0]['properties']
def terr(k):
    T = REF[k]['terrain']; return {'s':T['step'], 'n':T['n'], 'h':[v for row in T['rows_north_to_south'] for v in row]}
def anc(k): a = REF[k]['anchor']; return {'lat':a['lat'], 'lon':a['lon']}
def bl(k, osm): return next(b for b in REF[k]['buildings'] if b['osm'] == osm)
def simp(r, tol=0.4):
    P = Polygon(r).simplify(tol, preserve_topology=True); return [[rnd(x), rnd(z)] for x, z in list(P.exterior.coords)[:-1]]
D = {}
# ---------------- Sea World: the Minghua ship, its basin and the plaza ----------------
k = 'szseaworld'; T = anc(k)
ship = bl(k, 'w105683429')['ring']
basin = ring('w261597655', T)
foun = [loc(T['lat'], T['lon'], F[n][0]['geometry']['coordinates']) for n in ('n4856001438', 'n4856001439', 'n4856001440', 'n4856001441')]
D[k] = dict(T, ship=ship, basin=simp(basin, 0.6), foun=foun, area=ring('w543176177', T), tr=terr(k))
# ---------------- Design Society: the OSM building and its parts ----------------
k = 'szdesignsociety'; T = anc(k)
parts = []
for pid in ['w783232515', 'w783232511', 'w783232512', 'w783232513', 'w783232514', 'w783232518', 'w783232519', 'w783232516', 'w783232520', 'w783232517']:
    pr = tags(pid); parts.append({'id':pid, 'lv':int(pr.get('building:levels', 0)), 'ml':int(pr.get('building:min_level', 0)), 'rs':pr.get('roof:shape', ''),
        'rd':float(pr.get('roof:direction', 0) or 0), 'r':ring(pid, T)})
D[k] = dict(T, out=ring('w740022003', T), site=ring('w740022007', T), parts=parts)
# ---------------- Shekou Cruise Center ----------------
k = 'szcruise'; T = anc(k)
B = bl(k, 'r12528133')
D[k] = dict(T, out=B['ring'], parts=[[p['base'], p['top'], p['ring']] for p in B['parts']], glass=ring('w493093174', T))
# ---------------- Chiwan Tin Hau Temple ----------------
k = 'szchiwantinhau'; T = anc(k)
bs = [[b['ring'], b['h'], b['osm'], b['type']] for b in REF[k]['buildings'] if b['type'] in ('religious', 'shed') and math.hypot(*b['centroid']) < 125]
ponds = []
for kk, L in F.items():
    pr = L[0]['properties']
    if pr.get('natural') == 'water':
        r = rings(kk, T['lat'], T['lon'])
        if r and max(math.hypot(*q) for q in r[0]) < 140: ponds.append(simp(r[0], 0.3))
D[k] = dict(T, b=bs, ponds=ponds, tr=terr(k))
# temple outline (place_of_worship)
for kk, L in F.items():
    pr = L[0]['properties']
    if pr.get('amenity') == 'place_of_worship' and pr.get('name', '').find('天后') >= 0:
        r = rings(kk, T['lat'], T['lon'])
        if r and math.hypot(*Polygon(r[0]).centroid.coords[0]) < 120: D[k]['wall'] = simp(r[0], 0.5)
# ---------------- Song emperor's tomb ----------------
k = 'szsongtomb'; T = anc(k)
D[k] = dict(T, out=ring('r16115644', T), wall=rings('w249003126', T['lat'], T['lon'])[0], path=rings('w249003125', T['lat'], T['lon'])[0],
            grave=loc(T['lat'], T['lon'], F['n11911125335'][0]['geometry']['coordinates']), gate=loc(T['lat'], T['lon'], F['n2557028302'][0]['geometry']['coordinates']),
            statue=loc(T['lat'], T['lon'], F['n11059418443'][0]['geometry']['coordinates']), tr=terr(k))
# ---------------- Chiwan Left Fort ----------------
k = 'szleftfort'; T = anc(k)
D[k] = dict(T, fort=loc(T['lat'], T['lon'], F['n5212583677'][0]['geometry']['coordinates']), lin=loc(T['lat'], T['lon'], F['n5212583676'][0]['geometry']['coordinates']),
            steps=rings('w1190097002', T['lat'], T['lon'])[0], tr=terr(k))
# ---------------- Nantou Ancient City ----------------
k = 'sznantou'; T = anc(k)
area = ring('w219961346', T); AP = Polygon(area)
rd = []
for r in REF[k]['roads']:
    L = LineString(r['pts'])
    if L.intersects(AP.buffer(15)) and r['cls'] in (8, 9, 10, 11, 12): rd.append([r['cls'], [[rnd(x), rnd(z)] for x, z in r['pts']]])
inb = [[b['ring'], b['h'], b['osm']] for b in REF[k]['buildings'] if AP.contains(Point(b['centroid']))]
D[k] = dict(T, area=area, roads=rd, b=inb, gate=ring('w1183877518', T), guild=ring('w1303250676', T), xinguo=ring('w1303250678', T), xinguo2=ring('w1303250679', T), tr=terr(k))
# ---------------- Qianhai Stone Park ----------------
k = 'szqianhaistone'; T = anc(k)
park = ring('w542328084', T); PP = Polygon(park)
stone = loc(T['lat'], T['lon'], F['n5212858640'][0]['geometry']['coordinates'])
rd = []
for r in REF[k]['roads']:
    L = LineString(r['pts'])
    if r['cls'] in (11, 12) and L.intersects(PP.buffer(5)): rd.append([r['cls'], [[rnd(x), rnd(z)] for x, z in r['pts']]])
D[k] = dict(T, park=simp(park, 0.8), stone=stone, roads=rd)
# ---------------- Qianhai International Conference Center / Shimao Qianhai Centre ----------------
k = 'szqhconf'; T = anc(k); D[k] = dict(T, out=bl(k, 'w858787224')['ring'])
k = 'szqhshimao'; T = anc(k); D[k] = dict(T, out=bl(k, 'w773895107')['ring'])
# ---------------- Qianhai Youth Innovation Hub ----------------
k = 'szqhhub'; T = anc(k)
area = ring('w376516134', T); AP = Polygon(area)
hb = [[b['ring'], b['h'], b['osm'], b.get('en', '')] for b in REF[k]['buildings'] if AP.buffer(2).contains(Point(b['centroid']))]
rd = []
for r in REF[k]['roads']:
    L = LineString(r['pts'])
    if r['cls'] in (11, 12) and L.intersects(AP): rd.append([r['cls'], [[rnd(x), rnd(z)] for x, z in r['pts']]])
D[k] = dict(T, area=area, b=hb, roads=rd)
# ---------------- Shekou Container Terminal ----------------
k = 'szshekouport'; T = anc(k)
area = ring('r15788753', T); AP = Polygon(area)
rails = {n: rings(n, T['lat'], T['lon'])[0] for n in ('w1071215524', 'w1071215525', 'w1071215526', 'w1071215527', 'w1071215528', 'w1071215529')}
rd = [[r['cls'], [[rnd(x), rnd(z)] for x, z in r['pts']]] for r in REF[k]['roads'] if LineString(r['pts']).intersects(AP)]
# yard: free space for container stacks, rows parallel to the long east quay (rail w1071215528)
q = rails['w1071215528']; ux, uz = q[1][0] - q[0][0], q[1][1] - q[0][1]; L = math.hypot(ux, uz); ux /= L; uz /= L; vx, vz = -uz, ux
quays = [LineString(rails[n]) for n in ('w1071215527', 'w1071215528', 'w1071215529')]
block = unary_union([LineString(p).buffer(9.0 if c <= 10 else 7.5) for c, p in rd] + [Ln.buffer(62) for Ln in quays] +
                    [LineString(rails[n]).buffer(28) for n in ('w1071215524', 'w1071215525', 'w1071215526')] +
                    [Polygon(b['ring']).buffer(8) for b in REF[k]['buildings']])
yard = AP.buffer(-14).difference(block)
# north gate / office area (z < -560) stays empty: the gate complex and the office blocks there
yard = yard.difference(Polygon([[-800, -2000], [800, -2000], [800, -560], [-800, -560]]))
P2 = lambda u, v: (u*ux + v*vx, u*uz + v*vz)
us = [px*ux + pz*uz for px, pz in area]; vs = [px*vx + pz*vz for px, pz in area]
rows = []
v = min(vs)
while v < max(vs):
    for i in range(6):     # a block of 6 rows (2.44 m + 0.4 m) then a 22 m RTG lane / truck lane
        vv = v + i*2.85
        line = LineString([P2(min(us) - 50, vv), P2(max(us) + 50, vv)])
        seg = line.intersection(yard)
        geoms = [seg] if seg.geom_type == 'LineString' else list(getattr(seg, 'geoms', []))
        for g in geoms:
            if g.geom_type != 'LineString' or g.length < 40: continue
            a, b = g.coords[0], g.coords[-1]
            ua, ub = a[0]*ux + a[1]*uz, b[0]*ux + b[1]*uz
            rows.append([rnd(min(ua, ub)), rnd(max(ua, ub)), rnd(vv)])
    v += 6*2.85 + 20
D[k] = dict(T, area=simp(area, 1.0), rails=rails, roads=rd, rows=rows, ax=[round(ux, 5), round(uz, 5)])
print({k: len(json.dumps(v)) for k, v in D.items()}, 'rows', len(rows), 'yard m2', int(yard.area))
json.dump(D, open(HERE + 'data.json', 'w'), separators=(',', ':'), ensure_ascii=False)
# ---- post: keep polygons for the sites (concave, shapely) ----
from shapely.geometry import mapping
def ext(g, tol=0.8):
    if g.geom_type == 'MultiPolygon': g = max(g.geoms, key=lambda q: q.area)
    g = g.simplify(tol, preserve_topology=True); return [[rnd(x), rnd(z)] for x, z in list(g.exterior.coords)[:-1]]
S = D['szseaworld']; kp = unary_union([Polygon(S['ship']).buffer(4), Polygon(S['basin']).buffer(1.5)])
S['keep'] = ext(kp)
inside = [b['osm'] + ' %.0f' % b['h'] for b in REF['szseaworld']['buildings'] if kp.contains(Point(b['centroid']))]
print('seaworld keep hides', inside)
json.dump(D, open(HERE + 'data.json', 'w'), separators=(',', ':'), ensure_ascii=False)
D['szshekouport']['sheds'] = [[b['ring'], b['h']] for b in REF['szshekouport']['buildings'] if Polygon(D['szshekouport']['area']).contains(Point(b['centroid']))]
D['szqianhaistone']['b'] = [[b['ring'], b['h']] for b in REF['szqianhaistone']['buildings'] if Polygon(D['szqianhaistone']['park']).contains(Point(b['centroid']))]
json.dump(D, open(HERE + 'data.json', 'w'), separators=(',', ':'), ensure_ascii=False)
