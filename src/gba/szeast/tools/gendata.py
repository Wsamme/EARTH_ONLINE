# gendata.py -> data.json : the real geometry each szeast model / site is built on (local metres, +x east, +z south)
# sources: gba/ref_szeast.json (this build's buildings / roads / terrain) and osm/east.geojsonseq (an extract of hkdata/guangdong.osm.pbf)
import json, math, os
from shapely.geometry import Polygon, LineString, Point
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
H = SC + 'gba/szeast/'
REF = json.load(open(SC + 'gba/ref_szeast.json'))['targets']
TG = {t['key']: t for t in json.load(open(SC + 'gba/targets.json'))['groups']['szeast']}
OSM = {}
for line in open(H + 'osm/east.geojsonseq'):
    f = json.loads(line.strip('\x1e\n')); OSM[f.get('id')] = f
def anc(k): return (TG[k]['lat'], TG[k]['lon'])
def L(a, q): return [round((q[0] - a[1])*103014.2, 2), round(-(q[1] - a[0])*110734.9, 2)]
def geo(k, i, simp=0):
    f = OSM[i]; g = f['geometry']; c = g['coordinates']; a = anc(k)
    if g['type'] == 'Point': return L(a, c)
    if g['type'] == 'LineString': P = [L(a, q) for q in c]
    elif g['type'] == 'Polygon': P = [L(a, q) for q in c[0]]
    else: P = [L(a, q) for q in max(c, key=lambda p: len(p[0]))[0]]
    if P[0] == P[-1] and len(P) > 3: P = P[:-1]
    if simp:
        s = (Polygon(P).simplify(simp) if g['type'] != 'LineString' else LineString(P).simplify(simp))
        P = [[round(x, 2), round(z, 2)] for x, z in (s.exterior.coords[:-1] if g['type'] != 'LineString' else s.coords)]
    return P
def r2(P): return [[round(p[0], 2), round(p[1], 2)] for p in P]
def ter(k): T = REF[k]['terrain']; return {'s': T['step'], 'n': T['n'], 'h': T['rows_north_to_south']}
def bl(b): return {'r': r2(b['ring']), 'h': b['h'], 'id': b['osm'], 'nm': b.get('zh') or b.get('en') or '', 'ty': b['type'], 'lv': b.get('floors')}
def roads(k, cls, inside=None, buf=0):
    out = []
    for r in REF[k]['roads']:
        if r['cls'] not in cls: continue
        P = r['pts']
        if inside is not None:
            ls = LineString(P).intersection(inside.buffer(buf))
            if ls.is_empty: continue
            parts = [ls] if ls.geom_type == 'LineString' else [g for g in getattr(ls, 'geoms', []) if g.geom_type == 'LineString']
            for g in parts:
                if g.length > 4: out.append({'c': r['cls'], 'b': bool(r.get('bridge')), 'p': r2(g.coords)})
        else: out.append({'c': r['cls'], 'b': bool(r.get('bridge')), 'p': r2(P)})
    return out
D = {}
# ---- TV tower: the round podium footprint (w275168893)
k = 'szwutongtv'; D[k] = {'ring': r2(REF[k]['buildings'][0]['ring']), 'peak': [p['at'] for p in REF[k]['pois'] if p['name'] == '小梧桐'][0], 'T': ter(k)}
# ---- Big Wutong summit
k = 'szwutong'; D[k] = {'rock': [p['at'] for p in REF[k]['pois'] if p['name'] == '鹏城第一峰'][0], 'peak': [p['at'] for p in REF[k]['pois'] if p['name'] == '梧桐山'][0],
    'paths': roads(k, [10, 11, 12], Point(0, 0).buffer(320)), 'T': ter(k)}
# ---- Hongfa Temple: its OSM area w246372603 and the 42 building footprints in it
k = 'szhongfa'; A = Polygon(geo(k, 'a492745206'))
D[k] = {'area': geo(k, 'a492745206', 0.5), 'b': [bl(b) for b in REF[k]['buildings'] if A.buffer(12).contains(Point(b['centroid']))],
    'paths': roads(k, [11, 12], A, 8), 'T': ter(k)}
# ---- Vanke Center: the building w247777666, the pavilion block w995102896 in the garden, the site (school area w1210907099)
k = 'szvanke'; B = {b['osm']: b for b in REF[k]['buildings']}
D[k] = {'ring': r2(B['w247777666']['ring']), 'sq': r2(B['w995102896']['ring']), 'site': geo(k, 'a2421814198', 0.5), 'T': ter(k)}
# ---- Chung Ying Street: the centreline (w333856692 + w1553756750), boundary stones, warning bell, museum, the shops along it
k = 'szchungying'; st = geo(k, 'w333856692') + geo(k, 'w1553756750')[1:]
S = LineString(st)
shops = [bl(b) for b in REF[k]['buildings'] if S.distance(Point(b['centroid'])) < 24 and b['area'] < 1500]
D[k] = {'st': st, 'stones': {nm: geo(k, i) for nm, i in [('二号界碑', 'n14136257964'), ('三号界碑', 'n14136257969'), ('六号界碑', 'n6403225119'), ('中英街界碑', 'n6403225118')]},
    'bell': geo(k, 'n6944601612'), 'museum': geo(k, 'a1483675406', 0.3), 'shops': shops, 'T': ter(k),
    'paths': roads(k, [10, 11, 12], S, 40)}
# ---- Dapeng Fortress: the walled town (w404249608), its four gates, the named halls, every footprint inside, the lanes
k = 'szdapeng'; F = Polygon(geo(k, 'a808499216'))
named = {'北门': 'a808499214', '东门': 'a2454717094', '南门': 'a2987822748', '西门': 'a2989319042'}
D[k] = {'wall': geo(k, 'a808499216', 0.5), 'gates': {nm: geo(k, i, 0.3) for nm, i in named.items()},
    'b': [bl(b) for b in REF[k]['buildings'] if F.buffer(-2).contains(Point(b['centroid']))],
    'named': {OSM[i]['properties'].get('name'): geo(k, i, 0.3) for i in ['a2987721576', 'a2987721578', 'a2987721580', 'a2987721600', 'a2987834842', 'a2987834844', 'a2987844278', 'a2989319052', 'a2989319056', 'a2989319062', 'a2989319072', 'a2989319074', 'a2454717096']},
    'lanes': roads(k, [10, 11, 12], F, -1), 'T': ter(k)}
# ---- Jiaochangwei: the guesthouse village (w523210525), the beach (w523210518)
k = 'szjiaochangwei'; V = Polygon(geo(k, 'a1046421050')); FT = Polygon([[p[0] + (TG['szdapeng']['lon'] - TG[k]['lon'])*103014.2, p[1] - (TG['szdapeng']['lat'] - TG[k]['lat'])*110734.9] for p in D['szdapeng']['wall']])
D[k] = {'village': geo(k, 'a1046421050', 0.5), 'beach': geo(k, 'a1046421036', 0.5),
    'b': [bl(b) for b in REF[k]['buildings'] if V.contains(Point(b['centroid'])) and not FT.buffer(10).contains(Point(b['centroid']))],
    'lanes': roads(k, [10, 11, 12], V, 0), 'T': ter(k)}
# ---- Dameisha: the beach park (w730043029), the sand (w192579211), the coastline, the winged-figure sculptures, the Wish Tower
k = 'szdameisha'
D[k] = {'park': geo(k, 'a1460086058', 0.5), 'sand': geo(k, 'a385158422', 0.5), 'coast': geo(k, 'w101315829', 0.5),
    'sculpt': [geo(k, i) for i in ['n5778243389', 'n5778243390', 'n5778243391', 'n5778243392', 'n5778243393', 'n5778243394', 'n5778243395', 'n5778243396']],
    'wish': geo(k, 'a1990228396', 0.2), 'paths': roads(k, [11, 12], Polygon(geo(k, 'a1460086058')), 5), 'T': ter(k)}
# ---- OCT East, Interlaken Town (r9079150), its lake, the buildings in it
k = 'szocteast'; TW = Polygon(geo(k, 'a18158301'))
D[k] = {'town': geo(k, 'a18158301', 0.5), 'lake': geo(k, 'a18158303', 0.5),
    'b': [bl(b) for b in REF[k]['buildings'] if TW.buffer(20).contains(Point(b['centroid']))],
    'paths': roads(k, [10, 11, 12], TW, 10), 'T': ter(k)}
# ---- Yantian Port (w261283912) and its quay line
k = 'szyantian'; PA = Polygon(geo(k, 'a522567824'))
co = []
for i in ['w586095163', 'w101316135']:
    g = LineString(geo(k, i)).intersection(PA.buffer(25))
    for s in ([g] if g.geom_type == 'LineString' else list(getattr(g, 'geoms', []))):
        if s.geom_type == 'LineString' and s.length > 60: co.append(r2(s.simplify(2).coords))
D[k] = {'port': geo(k, 'a522567824', 1), 'quay': co, 'b': [bl(b) for b in REF[k]['buildings'] if PA.contains(Point(b['centroid']))],
    'hq': geo(k, 'a1127635396', 0.5), 'T': ter(k)}
# ---- Shenzhen Reservoir: the main dam (a17025245) and the west auxiliary dam (w51191239), the memorial stele
k = 'szreservoir'
D[k] = {'dam': geo(k, 'a17025245', 1.0), 'dam2': geo(k, 'a102382478', 1.0), 'stele': geo(k, 'n5800085489'), 'lake': geo(k, 'a834493', 4.0), 'T': ter(k)}
# ---- Fairy Lake Botanical Garden: pagodas, pavilions, the petrified forest, the lake
k = 'szxianhu'
D[k] = {'garden': geo(k, 'a541719364', 3), 'lake': geo(k, 'a4677951', 1), 'mirror': geo(k, 'a102382882', 1), 'fern': geo(k, 'a492745216', 0.5),
    'longzun': geo(k, 'n13770062419'), 'benhuan': geo(k, 'w928213021', 0.2),
    'pav': {'两宜亭': geo(k, 'n7123728560'), '望湖亭': geo(k, 'n13770062372'), '揽胜亭': geo(k, 'w271413485', 0.2), '听雨亭': geo(k, 'w1504806501', 0.2), '登云亭': geo(k, 'n8377423000')},
    'fossil': geo(k, 'a2690354780' if 'a2690354780' in OSM else 'w1345177390', 0.5), 'paths': roads(k, [11, 12]), 'T': ter(k)}
# ---- keep polygons (real buildings with their centroid inside are hidden by the app) and the real buildings each site rebuilds
from shapely.ops import unary_union
def kp(G, simp=1.0):
    G = G.simplify(simp)
    if G.geom_type != 'Polygon': G = max(G.geoms, key=lambda q: q.area)
    return [[round(x, 1), round(z, 1)] for x, z in G.exterior.coords[:-1]]
def inside(k, G): return [bl(b) for b in REF[k]['buildings'] if G.contains(Point(b['centroid']))]
k = 'szchungying'; G = unary_union([LineString(D[k]['st']).buffer(15), Point(D[k]['bell']).buffer(13), LineString([D[k]['st'][0], D[k]['bell']]).buffer(7)]); D[k]['keep'] = kp(G); D[k]['shops'] = inside(k, Polygon(D[k]['keep']))
k = 'szdapeng'; G = Polygon(D[k]['wall']).buffer(6); D[k]['keep'] = kp(G); D[k]['b'] = inside(k, Polygon(D[k]['keep']))
k = 'szjiaochangwei'; G = Polygon(D[k]['village']).difference(FT.buffer(12)); D[k]['keep'] = kp(G); D[k]['b'] = inside(k, Polygon(D[k]['keep']))
k = 'szdameisha'; G = Polygon(D[k]['park']); D[k]['keep'] = kp(G); D[k]['b'] = inside(k, Polygon(D[k]['keep']))
k = 'szocteast'; G = Polygon(D[k]['town']); D[k]['keep'] = kp(G); D[k]['b'] = inside(k, Polygon(D[k]['keep']))
k = 'szyantian'; D[k]['keep'] = kp(Polygon(D[k]['port']), 2); D[k]['b'] = inside(k, Polygon(D[k]['keep']))
k = 'szreservoir'; G = unary_union([Polygon(D[k]['dam']).buffer(8), Polygon(D[k]['dam2']).buffer(8)]); D[k]['keep'] = kp(G); D[k]['b'] = inside(k, Polygon(D[k]['keep'])); D[k]['keep2'] = kp(Polygon(D[k]['dam2']).buffer(8))
k = 'szxianhu'; D[k]['bc'] = [[round(b['centroid'][0], 1), round(b['centroid'][1], 1), round(math.sqrt(b['area'])/1.6 + 6, 1)] for b in REF[k]['buildings']]
D[k]['keep'] = kp(Polygon(D[k]['benhuan']).buffer(6), 0.5)
k = 'szwutong'; D[k]['keep'] = kp(Point(D[k]['peak']).buffer(70), 2)
json.dump(D, open(H + 'tools/data.json', 'w'), separators=(',', ':'), ensure_ascii=False)
for k, v in D.items(): print(k, {kk: (len(vv) if isinstance(vv, (list, dict)) else vv) for kk, vv in v.items()})
print(os.path.getsize(H + 'tools/data.json'))
