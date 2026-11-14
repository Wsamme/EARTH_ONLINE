# Build the data block D for gba/sznorth/sznorth.js from gba/ref_sznorth.json and tmp/areas.json / tmp/near.json (OSM, read only).
# Landmarks: rings in each model's own frame (origin lat/lon, rot about +y; local +x = rot CCW from east, +z = 'south' before rot).
# Sites: rings in local east / south metres round the site anchor.
import json, math, sys
from matplotlib.path import Path
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad'
R = json.load(open(SC + '/gba/ref_sznorth.json'))['targets']
A = json.load(open(SC + '/gba/sznorth/tmp/areas.json'))
T = {t['key']: t for t in json.load(open(SC + '/gba/targets.json'))['groups']['sznorth']}
KX, KY = 103014.2, 110734.9
r1 = lambda v: round(v, 1)

def bld(key, oid):
    return [b for b in R[key]['buildings'] if b['osm'] == oid][0]
def area(key, oid):
    return [o for o in A[key] if o['id'] == oid][0]

def terr(key):
    t = R[key]['terrain']; st, n, G = t['step'], t['n'], t['rows_north_to_south']; h = (n - 1)/2
    def f(x, z):
        j = x/st + h; i = z/st + h
        j = min(max(j, 0), n - 1.001); i = min(max(i, 0), n - 1.001); j0, i0 = int(j), int(i); a, b = j - j0, i - i0
        return (G[i0][j0]*(1-a)*(1-b) + G[i0][j0+1]*a*(1-b) + G[i0+1][j0]*(1-a)*b + G[i0+1][j0+1]*a*b)
    return f

class Frame:
    # model frame: origin (ox, oz) in the ref's local east/south metres of `key`, rotation th (rad, CCW from east seen from above)
    def __init__(s, key, ox, oz, th, r):
        s.key, s.ox, s.oz, s.th, s.r = key, ox, oz, th, r
        t = T[key]; s.lat = t['lat'] - oz/KY; s.lon = t['lon'] + ox/KX
        f = terr(key); hi = -1e9
        for a in range(12):
            for ff in (0, 0.35, 0.7):
                x = ox + math.cos(a/12*2*math.pi)*r*ff; z = oz - math.sin(a/12*2*math.pi)*r*ff
                hi = max(hi, f(x, z))
        s.base = hi + 0.6; s.f = f
    def L(s, p):   # ref local (x east, z south) -> model local
        x, z = p[0] - s.ox, p[1] - s.oz; c, sn = math.cos(s.th), math.sin(s.th)
        return [r1(x*c - z*sn), r1(x*sn + z*c)]
    def W(s, p):   # model local -> ref local
        c, sn = math.cos(s.th), math.sin(s.th); x, z = p
        return [x*c + z*sn + s.ox, -x*sn + z*c + s.oz]
    def ring(s, R0): return [s.L(p) for p in R0]
    def grid(s, x0, x1, z0, z1, st):
        nx = int(round((x1 - x0)/st)) + 1; nz = int(round((z1 - z0)/st)) + 1; v = []
        for j in range(nz):
            for i in range(nx):
                w = s.W([x0 + i*st, z0 + j*st]); v.append(r1(s.f(w[0], w[1]) - s.base))
        return {'x0': x0, 'z0': z0, 'st': st, 'nx': nx, 'nz': nz, 'v': v}
    def place(s): return {'lat': round(s.lat, 7), 'lon': round(s.lon, 7), 'rot': round(s.th, 4), 'base': r1(s.base)}

def cen(P):
    a = cx = cz = 0
    for i in range(len(P)):
        x0, z0 = P[i]; x1, z1 = P[(i+1) % len(P)]; c = x0*z1 - x1*z0; a += c; cx += (x0 + x1)*c; cz += (z0 + z1)*c
    return [cx/(3*a), cz/(3*a)]
def pca_th(P):
    c = cen(P); sxx = szz = sxz = 0
    for p in P: dx, dz = p[0] - c[0], p[1] - c[1]; sxx += dx*dx; szz += dz*dz; sxz += dx*dz
    ang = 0.5*math.atan2(2*sxz, sxx - szz)   # major axis direction in x/z(south)
    return -ang                               # rot (CCW from east) of the major axis
D = {}; PL = {}

# ---- Shenzhen North station: x along the tracks (SE), z across (-z = east side / metro, +z = west square) ----
k = 'sznorthstation'; th = math.radians(-47.47)
F = Frame(k, 0, 0, th, 300)
fp = F.ring(bld(k, 'w1212433645')['ring'])
xs = [p[0] for p in fp]; zs = [p[1] for p in fp]
F = Frame(k, *F.W([(min(xs) + max(xs))/2, (min(zs) + max(zs))/2]), th, 300)
fp = F.ring(bld(k, 'w1212433645')['ring'])
stops = sorted(F.L(p['at'])[1] for p in R[k]['pois'] if p['name'] == '深圳北' and p['tags'].get('railway') == 'stop')
rails = [[F.L(q) for q in r['pts']] for r in R[k]['roads'] if r['cls'] == 15]
decks = [{'c': r['cls'], 'p': [F.L(q) for q in r['pts']], 'e': r.get('elev')} for r in R[k]['roads'] if r.get('bridge') and r['cls'] <= 12]
D['ns'] = {'fp': fp, 'part': F.ring(bld(k, 'w1212433645')['parts'][0]['ring']), 'metro': F.ring(bld(k, 'w370233869')['ring']),
           'stops': [r1(s) for s in stops], 'g': F.grid(-240, 240, -230, 200, 20)}
PL[k] = F.place(); print(k, PL[k], 'x', min(xs), max(xs), 'z', min(zs), max(zs))
print('  fp', fp); print('  stops', D['ns']['stops'])
for dk in decks:
    near = [p for p in dk['p'] if abs(p[0]) < 260 and abs(p[1]) < 250]
    if near: print('  deck near', dk['c'], near[:3], dk['e'][:3] if dk['e'] else None)

# ---- Art museum + library north (one grid, rot 32.57 deg) ----
th = math.radians(32.57)
k = 'szartmuseum'; ring = bld(k, 'w1178327405')['ring']; F = Frame(k, *cen(ring), th, 88)
D['art'] = {'fp': F.ring(ring)}; PL[k] = F.place(); print(k, PL[k], D['art'])
k = 'szlibnorth'; ring = bld(k, 'w1178327404')['ring']; pod = bld(k, 'w1299259311')['ring']; F = Frame(k, *cen(ring), th, 70)
D['lib'] = {'fp': F.ring(ring), 'pod': F.ring(pod), 'art': F.ring(bld(k, 'w1178327405')['ring'])}; PL[k] = F.place(); print(k, PL[k], D['lib'])

# ---- Science and technology museum ----
k = 'szscimuseum'; ring = bld(k, 'r19390442')['ring']; th = pca_th(ring); c = cen(ring)
F = Frame(k, c[0], c[1], th, 130)
D['sci'] = {'fp': F.ring(ring), 'site': F.ring(area(k, 'w1455699525')['rings'][0]), 'ann': F.ring(bld(k, 'w1455699535')['ring'])}
PL[k] = F.place(); print(k, PL[k], 'th deg', math.degrees(th)); print('  fp', D['sci']['fp'])

# ---- Galaxy twin towers: origin at the midpoint ----
k = 'szgalaxy'; w = bld(k, 'w1190193566')['ring']; e = bld(k, 'w1190193567')['ring']; cw, ce = cen(w), cen(e)
F = Frame(k, (cw[0] + ce[0])/2, (cw[1] + ce[1])/2, math.radians(28.27), 100)
D['gal'] = {'w': F.ring(w), 'e': F.ring(e), 'cw': F.L(cw), 'ce': F.L(ce)}; PL[k] = F.place(); print(k, PL[k], D['gal']['cw'], D['gal']['ce'])

# ---- Pingshan theatre: the cube w1258071571 inside the planted area w878478259 ----
k = 'szpingshantheatre'; ring = bld(k, 'w1258071571')['ring']; F = Frame(k, *cen(ring), math.radians(14.57), 70)
D['pst'] = {'fp': F.ring(ring), 'green': F.ring(area(k, 'w878478259')['rings'][0])}; PL[k] = F.place(); print(k, PL[k], D['pst']['fp'])

# ---- Hehu Xinju: all OSM pieces of the walled house; pond in front (NE) ----
k = 'szhehu'; th = None
# orientation from the long strips
import collections
hist = collections.Counter()
for b in R[k]['buildings']:
    rr = b['ring']
    for i in range(len(rr)):
        a, bb = rr[i], rr[(i+1) % len(rr)]; l = math.hypot(bb[0]-a[0], bb[1]-a[1])
        hist[round(math.degrees(math.atan2(-(bb[1]-a[1]), bb[0]-a[0])) % 90)] += l
th = math.radians(hist.most_common(1)[0][0]); print('hehu hist', hist.most_common(4))
area0 = area(k, 'w1088961704')['rings'][0]
pts = [p for b in R[k]['buildings'] for p in b['ring']]
F0 = Frame(k, 0, 0, th, 100); lp = [F0.L(p) for p in pts]
cx = (min(p[0] for p in lp) + max(p[0] for p in lp))/2; cz = (min(p[1] for p in lp) + max(p[1] for p in lp))/2
F = Frame(k, *F0.W([cx, cz]), th, 100)
D['hehu'] = {'b': [{'r': F.ring(b['ring']), 'h': b['h'], 'a': b['area']} for b in R[k]['buildings']],
             'pond': F.ring(area(k, 'w1088961705')['rings'][0]), 'wood': [F.ring(area(k, w)['rings'][0]) for w in ('w1088961698', 'w1088961701')],
             'area': F.ring(area0)}
PL[k] = F.place(); print(k, PL[k], 'th deg', math.degrees(th), 'n', len(D['hehu']['b']))
lp = [p for b in D['hehu']['b'] for p in b['r']]; print('  extent x', min(p[0] for p in lp), max(p[0] for p in lp), 'z', min(p[1] for p in lp), max(p[1] for p in lp), 'pond', D['hehu']['pond'][:3])

# ---- Dawan Shiju: one footprint; pond to the west (front) ----
k = 'szdawan'; ring = bld(k, 'w784652604')['ring']; F = Frame(k, *cen(ring), math.radians(9.5), 95)
D['dawan'] = {'fp': F.ring(ring), 'pond': F.ring(area(k, 'w784652605')['rings'][0])}; PL[k] = F.place(); print(k, PL[k], D['dawan'])

json.dump({'D': D, 'PL': PL}, open(SC + '/gba/sznorth/tmp/D_lm.json', 'w'), ensure_ascii=False, separators=(',', ':'))

# ================= sites (local east / south metres round each site anchor) =================
def shift(P, o): return [[r1(p[0] - o[0]), r1(p[1] - o[1])] for p in P]
def ll(key, o): t = T[key]; return {'lat': round(t['lat'] - o[1]/KY, 7), 'lon': round(t['lon'] + o[0]/KX, 7)}
def inside(P, pts): pa = Path(P); return [pa.contains_point(p) for p in pts]
def offset_poly(P, d):
    from shapely.geometry import Polygon
    g = Polygon(P).buffer(d, join_style=2).simplify(1.0)
    return [[r1(x), r1(z)] for x, z in list(g.exterior.coords)[:-1]]
def tg(o): return o['tags']
S = {}

# ---- Universiade: the stadium site (anchor = stadium centre) + the arena and natatorium landmarks ----
k = 'szuniversiade'
stad = area(k, 'w166214606')['rings'][0][:-1]; c = cen(stad); o = c
S['uni'] = {'stad': shift(stad, o), 'bld': shift(bld(k, 'r3220465')['ring'], o), 'pitch': shift(area(k, 'w219051961')['rings'][0][:-1], o),
            'track': shift(area(k, 'r15692057')['rings'][0][:-1], o), 'keep': shift(offset_poly(stad, 14), o)}
PL['szuniversiade'] = ll(k, o); print(k, PL[k], 'stad pts', len(stad))
ar = bld(k, 'w219058187')['ring']; F = Frame(k, *cen(ar), 0, 80)
D['uniA'] = {'fp': F.ring(ar)}; PL['szuniversiade_arena'] = F.place(); print('arena', PL['szuniversiade_arena'])
po = bld(k, 'w238462822')['ring']; th = pca_th(po); F = Frame(k, *cen(po), th, 110)
D['uniP'] = {'fp': F.ring(po)}; PL['szuniversiade_pool'] = F.place(); print('pool', PL['szuniversiade_pool'], math.degrees(th))
xs = [p[0] for p in D['uniP']['fp']]; zs = [p[1] for p in D['uniP']['fp']]; print('  pool extent', min(xs), max(xs), min(zs), max(zs))
xs = [p[0] for p in D['uniA']['fp']]; zs = [p[1] for p in D['uniA']['fp']]; print('  arena extent', min(xs), max(xs), min(zs), max(zs))

# ---- CUHK-Shenzhen: lower campus (szcuhksz) and upper campus (szcuhksz_upper) ----
k = 'szcuhksz'; rel = area(k, 'r10129044')['rings']
for name, ring in (('cu', [r for r in rel if len(r) == 29][0]), ('cuU', [r for r in rel if len(r) == 43][0])):
    ring = ring[:-1]; o = cen(ring); pa = Path(ring)
    bs = [b for b in R[k]['buildings'] if pa.contains_point(b['centroid'])]
    ar = []
    for a in A[k]:
        t = tg(a); kind = None
        if t.get('natural') == 'water': kind = 'w'
        elif t.get('leisure') in ('pitch', 'track'): kind = 'p' if t.get('leisure') == 'pitch' else 't'
        elif t.get('leisure') in ('garden', 'park') or t.get('landuse') in ('grass', 'forest'): kind = 'g'
        if not kind or not a['rings']: continue
        rr = a['rings'][0][:-1]
        if len(rr) < 3 or not any(pa.contains_point(p) for p in rr): continue
        if t.get('name') == '大运山自然公园': continue
        ar.append({'k': kind, 's': t.get('sport', ''), 'r': shift(rr, o)})
    S[name] = {'keep': shift(ring, o), 'b': [{'r': shift(b['ring'], o), 'h': b['h'], 'fl': b['floors'], 'n': b.get('zh') or '', 'a': b['area']} for b in bs], 'ar': ar}
    PL[name] = ll(k, o); print(name, PL[name], 'bld', len(bs), 'areas', len(ar))

# ---- Dafen: the village area (szdafen) ----
k = 'szdafen'; ring = area(k, 'w248181066')['rings'][0][:-1]; pa = Path(ring)
bs = [b for b in R[k]['buildings'] if pa.contains_point(b['centroid'])]
S['daf'] = {'keep': shift(ring, [0, 0]), 'b': [{'r': b['ring'], 'h': b['h'], 'a': b['area'], 'm': 1 if b['osm'] == 'w248181064' else 0} for b in bs],
            'roads': [{'c': r['cls'], 'p': r['pts']} for r in R[k]['roads'] if r['cls'] >= 8 and any(pa.contains_point(p) for p in r['pts'])]}
PL['szdafen'] = ll(k, [0, 0]); print('dafen', PL['szdafen'], len(bs), 'roads', len(S['daf']['roads']))

# ---- Guanlan ancient market (szguanlan): no OSM buildings; the lanes inside the market area ----
k = 'szguanlan'; ring = area(k, 'w1284417908')['rings'][0][:-1]; pa = Path(ring)
lanes = []
for r in R[k]['roads']:
    if r['cls'] in (10, 11, 12) and sum(pa.contains_point(p) for p in r['pts']) >= 1: lanes.append({'c': r['cls'], 'p': r['pts']})
S['gl'] = {'keep': ring, 'temple': area(k, 'w1430005827')['rings'][0][:-1], 'lanes': lanes,
           'ped': [a['rings'][0][:-1] for a in A[k] if tg(a).get('highway') == 'pedestrian']}
PL['szguanlan'] = ll(k, [0, 0]); print('guanlan', len(lanes))

json.dump({'D': D, 'S': S, 'PL': PL}, open(SC + '/gba/sznorth/tmp/D.json', 'w'), ensure_ascii=False, separators=(',', ':'))
import os; print('D.json', os.path.getsize(SC + '/gba/sznorth/tmp/D.json'))
