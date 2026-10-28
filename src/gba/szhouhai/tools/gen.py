# Build the data block D for szhouhai.js from gba/ref_szhouhai.json and tools/areas.json (OSM areas, read from gbareal/out).
# Local metres round each key's anchor (+x east, +z south). Rings are rounded to 0.1 m (towers) or 0.5 m (sites).
import json, sys
from shapely.geometry import Polygon, Point, LineString
R = json.load(open('../../ref_szhouhai.json'))['targets']
A = {a['id']: a for a in json.load(open('areas.json'))['areas']}
MX, MY = 103014.2, 110734.9
def L(key):
    a = R[key]['anchor']; return lambda p: ((p[0] - a['lon'])*MX, -(p[1] - a['lat'])*MY)
r1 = lambda P: [[round(x, 1), round(z, 1)] for x, z in P]
def bld(key, osm): return next(b for b in R[key]['buildings'] if b['osm'] == osm)
def ring(key, osm): return r1(bld(key, osm)['ring'])
def parts(key, osm): return [[p['base'], p['top'], r1(p['ring'])] for p in bld(key, osm).get('parts', [])]
D = {}
D['crt'] = {}
D['tc'] = {'s': ring('sztencent', 'w694152192'), 'n': ring('sztencent', 'w694152193'), 'link': ring('sztencent', 'w775462996')}
D['hk'] = {'parts': parts('szhanking', 'w925221226'), 'pod': ring('szhanking', 'w707365790'), 'ring': ring('szhanking', 'w925221226')}
D['ob'] = {'ring': ring('szonebay', 'w571169591')}
D['bi'] = {'t1': ring('szbayinno', 'w781258408'), 't2': ring('szbayinno', 'w781258407'), 'l1': ring('szbayinno', 'w1270117300'), 'l2': ring('szbayinno', 'w1270117301')}
D['cmb'] = {'parts': parts('szcmbhq', 'w1443942674'), 'ring': ring('szcmbhq', 'w1443942674')}
D['hy'] = {'ring': ring('szhuiyun', 'w1169311439')}
D['bp'] = {'ring': ring('szbayport', 'w240804171')}
# ---- sites ----
def enc(P, q=0.5): return [v for x, z in P for v in (int(round(x/q)), int(round(z/q)))]
def site(key, aid, kinds):
    f = L(key); K = Polygon([f(p) for p in A[aid]['rings'][0]]).buffer(0)
    out = {'keep': enc(list(K.exterior.coords)[:-1]), 'b': [], 'a': []}
    for b in R[key]['buildings']:
        if not K.contains(Point(b['centroid'])): continue
        e = {'o': b['osm'], 'h': b['h'], 'r': enc(b['ring'])}
        if b.get('floors'): e['f'] = b['floors']
        nm = b.get('zh') or b.get('name')
        if nm: e['n'] = nm
        if b.get('parts'): e['p'] = [[p['base'], p['top'], enc(p['ring'])] for p in b['parts']]
        out['b'].append(e)
    for a in A.values():
        if a['id'] == aid or not a['rings']: continue
        t = a['t']; k = None
        for kk, vals in kinds.items():
            for tag, v in vals:
                if t.get(tag) == v or (v == '*' and t.get(tag)): k = kk; break
            if k: break
        if not k: continue
        for rg, hl in zip(a['rings'], a['holes'] or [[]]*len(a['rings'])):
            P = Polygon([f(p) for p in rg]).buffer(0)
            if P.is_empty: continue
            C = P.intersection(K)
            if C.is_empty or C.area < 30: continue
            gs = list(C.geoms) if C.geom_type.startswith('Multi') or C.geom_type == 'GeometryCollection' else [C]
            for g in gs:
                if g.geom_type != 'Polygon' or g.area < 30: continue
                g = g.simplify(0.6)
                out['a'].append([k, enc(list(g.exterior.coords)[:-1])])
    return out, f, K
KIND = {'water': [('natural', 'water'), ('leisure', 'swimming_pool'), ('amenity', 'fountain')], 'pitch': [('leisure', 'pitch')], 'track': [('leisure', 'track')],
        'wood': [('natural', 'wood'), ('natural', 'scrub'), ('landuse', 'forest')], 'grass': [('landuse', 'grass'), ('leisure', 'garden'), ('landuse', 'flowerbed'), ('leisure', 'golf_course'), ('landuse', 'plant_nursery'), ('leisure', 'park')],
        'plaza': [('highway', 'pedestrian'), ('area', 'yes')], 'park': [('amenity', 'parking')], 'shingle': [('natural', 'shingle'), ('natural', 'wetland')], 'play': [('leisure', 'playground')]}
tp, ftp, Ktp = site('sztalentpark', 'r18459537', KIND)
# the Talent Starlight Bridge (man_made=bridge area) and the pi Bridge (the OSM path "Pie Bridge")
tp['star'] = enc([ftp(p) for p in A['w736632011']['rings'][0]][:-1])
pie = [rd for rd in R['sztalentpark']['roads'] if rd.get('name') == 'Pie Bridge']
tp['pie'] = [enc(rd['pts']) for rd in pie]
# the lake shore inside the park (for the promenade lamps), simplified
lake = Polygon([ftp(p) for p in A['r10175109']['rings'][0]]).buffer(0)
sh = lake.exterior.simplify(2.0)
tp['lake'] = enc(list(sh.coords)[:-1], 1.0)
# paths (cls 12) inside the park, for lamps along them
pp = []
for rd in R['sztalentpark']['roads']:
    if rd['cls'] != 12 or rd.get('bridge'): continue
    ls = LineString(rd['pts'])
    if ls.length < 25 or not Ktp.contains(ls.interpolate(0.5, normalized=True)): continue
    pp.append(enc(list(ls.simplify(1.5).coords), 1.0))
tp['paths'] = pp
tp['rd'] = [[r_['cls'], enc(list(LineString(r_['pts']).simplify(2.0).coords), 1.0)] for r_ in R['sztalentpark']['roads'] if r_['cls'] <= 12 and not r_.get('bridge') and Ktp.buffer(10).intersects(LineString(r_['pts']))]
D['tp'] = tp
su, fsu, Ksu = site('szszu', 'r13900447', KIND)
rd = []
for r_ in R['szszu']['roads']:
    if r_['cls'] > 12 or r_.get('bridge'): continue
    ls = LineString(r_['pts']).intersection(Ksu.buffer(8))
    for g_ in (list(ls.geoms) if ls.geom_type.startswith('Multi') else [ls]):
        if g_.is_empty or g_.geom_type != 'LineString' or g_.length < 8: continue
        rd.append([r_['cls'], enc(list(g_.simplify(2.0).coords), 1.0)])
su['rd'] = rd
D['su'] = su
s = json.dumps(D, separators=(',', ':'), ensure_ascii=False)
open('data.js', 'w').write('const D = ' + s + ';\n')
print('bytes', len(s), 'tp b', len(tp['b']), 'a', len(tp['a']), 'paths', len(pp), 'su b', len(su['b']), 'a', len(su['a']))
