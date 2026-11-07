# build the data block for sg40h.js from the refs: python3 gen.py > data.js
import json, math
REF = json.load(open('../ref_sg40h.json'))['targets']
OUT = {}
def T(k): return REF[k]
def B(k, osm): return [b for b in T(k)['buildings'] if b['osm'] == osm][0]
def R1(p): return [round(p[0], 1), round(p[1], 1)]
def cen(r):
    a = cx = cz = 0
    for i in range(len(r)):
        x0, z0 = r[i - 1]; x1, z1 = r[i]; c = x0 * z1 - x1 * z0; a += c; cx += (x0 + x1) * c; cz += (z0 + z1) * c
    a *= 0.5; return [cx / (6 * a), cz / (6 * a)]
def ll(k, o):   # lat/lon of local point o in target k
    A = T(k)['anchor']; return [round(A['lat'] - o[1] / 110574, 7), round(A['lon'] + o[0] / 111290.5, 7)]
def rel(r, o): return [R1([p[0] - o[0], p[1] - o[1]]) for p in r]
PL = {}
# ---- Koon Seng terraces
k = 'sgkoonseng'; t = T(k)
A = (-87, 126); Bp = (3, 59); ux, uz = Bp[0] - A[0], Bp[1] - A[1]; L = math.hypot(ux, uz); ux /= L; uz /= L
units = []
for b in t['buildings']:
    c = b['centroid']; s = (c[0] - A[0]) * ux + (c[1] - A[1]) * uz; d = -(c[0] - A[0]) * uz + (c[1] - A[1]) * ux
    if 33 < s < (106 if d < 0 else 80) and 15 < abs(d) < 30 and len(b['ring']) == 4: units.append((s, d, b))
pts = [p for _, _, b in units for p in b['ring']]
o = [sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)]
U = []
NROW = set(b['osm'] for s_, d, b in units if d < 0)
for s, d, b in sorted(units, key=lambda u: (u[1] > 0, u[0])):
    r = b['ring']
    # front edge = the edge whose midpoint is closest to the road line
    best = None
    for i in range(4):
        a, c = r[i], r[(i + 1) % 4]; m = ((a[0] + c[0]) / 2, (a[1] + c[1]) / 2)
        dd = abs(-(m[0] - A[0]) * uz + (m[1] - A[1]) * ux)
        if best is None or dd < best[0]: best = (dd, i)
    i = best[1]; rr = [r[(i + j) % 4] for j in range(4)]   # rr[0]-rr[1] front edge
    U.append(rel(rr, o) + [b['osm']])
rows = {}
for side in ('n', 's'):
    uu = [u for u in U if (side == 'n') == (u[4] in NROW)]
    rows[side] = uu
OUT['koon'] = {}
for side, uu in rows.items():
    pts = [p for u in uu for p in u[:4]]; oo = [sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)]
    OUT['koon'][side] = {'o': R1([oo[0] + o[0], oo[1] + o[1]]), 'u': [[R1([p[0] - oo[0], p[1] - oo[1]]) for p in u[:4]] + [u[4]] for u in uu]}
# ---- Geylang Serai market + car park
k = 'sggeylangserai'; m = B(k, 'w201904037')['ring']; cp = B(k, 'w202975797')['ring']
o = cen(m); oc = cen(cp); OUT['gsm'] = {'m': rel(m, o), 'cp': rel(cp, oc), 'oc': R1(oc)}; PL[k] = ll(k, o); PL['sggeylangserai2'] = ll(k, oc)
# ---- PLQ
k = 'sgplq'; mall = B(k, 'w463063314')['ring']; t1 = B(k, 'w463063315')['ring']; t2 = B(k, 'w641462166')['ring']; pz = B(k, 'w722862132')['ring']
o = cen(mall + t1 + t2) if False else [0, -75]
OUT['plq'] = {'mall': rel(mall, o), 't1': rel(t1, o), 't2': rel(t2, o), 'pz': rel(pz, o), 'other': [rel(b['ring'], o) for b in T(k)['buildings'] if b['osm'] in ('w731518589',)]}; PL[k] = ll(k, o)
t3 = B(k, 'w463063316'); o3 = cen(t3['ring'])
OUT['plq3'] = {'pod': rel(t3['ring'], o3), 'tw': rel(t3['parts'][0]['ring'], o3)}; PL['sgplq3'] = ll(k, o3)
# ---- Expo
k = 'sgexpo'; e = B(k, 'r1337396')['ring']
o = [-170, 150]; OUT['expo'] = {'r': rel(e, o)}; PL[k] = ll(k, o)
hs = [B(k, x)['ring'] for x in ('w173028314', 'w173028315', 'w173028316', 'w173028317')]
o2 = cen(hs[1] + hs[2]) if False else [205, -265]
OUT['expo2'] = {'h': [rel(h, o2) for h in hs]}; PL['sgexpo2'] = ll(k, o2)
# ---- SUTD site (anchor-relative)
k = 'sgsutd'; t = T(k)
def pip(P, x, y):
    c = False
    for i in range(len(P)):
        a = P[i]; b = P[i - 1]
        if (a[1] > y) != (b[1] > y) and x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]: c = not c
    return c
KEEP = [(-202, -43), (-132, -31), (-105, -90), (14, -243), (71, -316), (175, -274), (326, -30), (298, -11), (250, 28), (210, 75), (202, 87), (158, 157), (137, 156), (88, 135), (54, 126), (40, 125), (14, 130), (-84, 138), (-170, 129), (-242, 111), (-236, 87)]
bl = []
for b in t['buildings']:
    c = b['centroid']
    if pip(KEEP, c[0], c[1]): bl.append([rel(b['ring'], [0, 0]), b['h'], b['floors'] or 0, b['name'] or '', b['osm']])
paths = [[R1(p) for p in r['pts']] for r in t['roads'] if r['cls'] in (11, 12) and all(pip(KEEP, p[0], p[1]) for p in r['pts'][:1])]
areas = [[a['kind'], rel(a['ring'], [0, 0])] for a in t['areas'] if a['kind'] in ('pitch', 'grass', 'park') and pip(KEEP, *cen(a['ring']))]
OUT['sutd'] = {'keep': [list(p) for p in KEEP], 'b': bl, 'p': paths, 'a': areas}
# ---- Changi chapel
k = 'sgchangichapel'; mu = B(k, 'w315753904')['ring']; o = cen(mu)
OUT['chapel'] = {'m': rel(mu, o)}; PL[k] = ll(k, o)
# ---- Senpaga / Red House
k = 'sgsenpaga'; tm = B(k, 'w334111719')['ring']; an = B(k, 'w334113516')['ring']; o = cen(tm)
OUT_SENP_O = o
OUT['senp'] = {'t': rel(tm, o), 'a': rel(an, o)}; PL[k] = ll(k, o)
k = 'sgredhouse'; rh = B(k, 'w310644618')['ring']; o = cen(rh); OUT['red'] = {'r': rel(rh, o)}; PL[k] = ll(k, o)
# ---- Sheares mainline (both carriageways) with app elevation
t = T('sgsheares'); OUT['sh'] = {'a': [R1(p) for p in t['roads'][363]['pts']], 'b': [R1(p) for p in t['roads'][364]['pts']], 'e': 7.2}
PL['sgsheares_anchor'] = [t['anchor']['lat'], t['anchor']['lon']]
# ---- Bedok jetty
t = T('sgbedokjetty')
OUT['jetty'] = {'shoreZ': -165, 'path': [[-66.9, -178.3], [66.8, 178.4]], 'tee': [[91.9, 169.5], [41.2, 188.4]], 'pier': [R1(p) for p in [a for a in t['areas'] if a['kind'] == 'pier'][0]['ring']],
                'beach': [[R1(p) for p in a['ring']] for a in t['areas'] if a['kind'] == 'beach']}
# ---- Changi Village site (anchor-relative)
t = T('sgchangivillage')
def bb(osm): return [R1(p) for p in [b for b in t['buildings'] if b['osm'] == osm][0]['ring']]
OUT['cv'] = {'hc': bb('w1111121176'), 'ft': bb('w174718382'), 'sheds': [bb(x) for x in ('w693988287', 'w693988290', 'w693988291')],
             'br': [[58.6, -141.2], [70.2, -176.4]],
             'paths': [[R1(p) for p in r['pts']] for r in t['roads'] if r['cls'] == 12],
             'beach': [[R1(p) for p in a['ring']] for a in t['areas'] if a['kind'] == 'beach'],
             'park': [[R1(p) for p in a['ring']] for a in t['areas'] if a['kind'] in ('park', 'grass', 'pedestrian')]}
# ---- Chek Jawa site
t = T('sgchekjawa')
OUT['cj'] = {'bw': [[[R1(p) for p in r['pts']], r.get('elev')] for r in t['roads'] if r.get('br')], 'vc': [R1(p) for p in t['buildings'][0]['ring']], 'rs': [R1(p) for p in t['buildings'][1]['ring']],
             'paths': [[R1(p) for p in r['pts']] for r in t['roads'] if not r.get('br')],
             'tower': [-90.4, -96.7], 'areas': [[a['kind'], [R1(p) for p in a['ring']]] for a in t['areas'] if a['area'] < 500000]}
print('const D = ' + json.dumps(OUT, separators=(',', ':')) + ';')
print('// placements: ' + json.dumps(PL))
KEEP_B = {'sgexpo': ('sgexpo', [-170, 150], [(-208, 355), (-217, 346), (21, 184), (-98, 46), (124, 0), (40, 166), (112, -130), (132.6, -103.6)]),
          'sgexpo2': ('sgexpo', [205, -265], [(137, -113), (113, -130), (132.6, -103.6)]),
          'sgsheares': ('sgsheares', [0, 0], [(-47.5, 40.8)]),
          'sgplq': ('sgplq', [0, -75], [(-13, -88)]),
          'sgsenpaga': ('sgsenpaga', OUT_SENP_O, [(-1.1, -31.7)])}
OUT['keepers'] = {}
for key, (rk, oo, cs) in KEEP_B.items():
    L = []
    for c in cs:
        b = min(T(rk)['buildings'], key=lambda b: math.hypot(b['centroid'][0] - c[0], b['centroid'][1] - c[1]))
        assert math.hypot(b['centroid'][0] - c[0], b['centroid'][1] - c[1]) < 2, (key, c)
        L.append([rel(b['ring'], oo), b['h']])
    OUT['keepers'][key] = L
# ---- shapely post-processing (expo band / arms / hall divisions, site keeps)
from shapely.geometry import Polygon, LineString, Point, MultiPolygon
from shapely.ops import unary_union
def coords(p): return [R1(c) for c in list(p.exterior.coords)[:-1]]
E = Polygon(OUT['expo']['r']).buffer(0)
band = E.buffer(-12, join_style=2).buffer(12, join_style=2).intersection(E)
if band.geom_type != 'Polygon': band = max(band.geoms, key=lambda g: g.area)
band = band.simplify(0.8)
arms = E.difference(band.buffer(0.5))
arms = [a for a in (arms.geoms if hasattr(arms, 'geoms') else [arms]) if a.area > 60]
# hall divisions: lines across the band perpendicular to its long axis every ~100 m
mr = band.minimum_rotated_rectangle; mc = list(mr.exterior.coords)
e1 = (mc[1][0] - mc[0][0], mc[1][1] - mc[0][1]); e2 = (mc[2][0] - mc[1][0], mc[2][1] - mc[1][1])
ax = e1 if math.hypot(*e1) > math.hypot(*e2) else e2; La = math.hypot(*ax); ux, uz = ax[0] / La, ax[1] / La
c0 = band.centroid; divs = []
for i in range(-4, 5):
    s = i * 100 + 50
    p = (c0.x + ux * s, c0.y + uz * s); ln = LineString([(p[0] - uz * 400, p[1] + ux * 400), (p[0] + uz * 400, p[1] - ux * 400)])
    g = ln.intersection(band)
    for s2 in (g.geoms if hasattr(g, 'geoms') else [g]):
        if s2.length > 20: divs.append([R1(c) for c in s2.coords])
OUT['expo'] = {'band': coords(band), 'arms': [coords(a.simplify(0.5)) for a in arms], 'divs': divs, 'c': R1([c0.x, c0.y]), 'u': [round(ux, 4), round(uz, 4)]}
# Changi Village keep: hawker centre + ferry terminal + sheds + bridge + linking corridors, minus other buildings
t = T('sgchangivillage')
G = [Polygon(OUT['cv']['hc']).buffer(5), Polygon(OUT['cv']['ft']).buffer(7)] + [Polygon(s).buffer(3) for s in OUT['cv']['sheds']]
G += [LineString(OUT['cv']['br']).buffer(9), Point(-22.3, -182.1).buffer(14), LineString([(-22, -150), (5, -120), (40, -60), (40, -10)]).buffer(10), LineString([(5, -150), (60, -150)]).buffer(9)]
K = unary_union(G)
others = [Polygon(b['ring']).buffer(2.5) for b in t['buildings'] if b['osm'] not in ('w1111121176', 'r17292513', 'w174718382', 'w693988287', 'w693988290', 'w693988291')]
K = K.difference(unary_union(others))
if K.geom_type != 'Polygon': K = max(K.geoms, key=lambda g: g.area)
OUT['cv']['keep'] = coords(K.simplify(1.0))
OUT['cv']['paths'] = [p for p in OUT['cv']['paths'] if LineString(p).intersects(K) and len(p) > 1]
# Chek Jawa keep: everything modelled + 25 m
pts = [p for bw in OUT['cj']['bw'] for p in bw[0]] + OUT['cj']['vc'] + OUT['cj']['rs'] + [OUT['cj']['tower']]
CJ = unary_union([LineString(bw[0]).buffer(22) if len(bw[0]) > 1 else Point(bw[0][0]).buffer(22) for bw in OUT['cj']['bw']] + [Polygon(OUT['cj']['vc']).buffer(30), Polygon(OUT['cj']['rs']).buffer(15), Point(*OUT['cj']['tower']).buffer(25),
                  LineString([(-150, 30), (-100, -40), (-90, -96)]).buffer(15)])
if CJ.geom_type != 'Polygon': CJ = unary_union([CJ, CJ.convex_hull.buffer(-40)]); CJ = CJ if CJ.geom_type == 'Polygon' else max(CJ.geoms, key=lambda g: g.area)
OUT['cj']['keep'] = coords(CJ.simplify(2.0))
OUT['cj']['paths'] = [p for p in OUT['cj']['paths'] if LineString(p).intersects(CJ)]
del OUT['cj']['areas']
print('const D = ' + json.dumps(OUT, separators=(',', ':')) + ';')
