# builds the D = {...} data line of szcbd.js from the ref / extract data (model frames: origin, rot)
import json, math, re
REF = json.load(open('../ref_szcbd.json'))['targets']; E = json.load(open('tmp/ext.json'))
T = {t['key']: t for t in json.load(open('../targets.json'))['groups']['szcbd']}
def rb(key, osm):
    for b in REF[key]['buildings']:
        if b['osm'] == osm: return b
    raise KeyError(osm)
def eb(key, osm):
    for b in E[key]['b']:
        if b['id'] == osm: return b
    raise KeyError(osm)
def frame(key, ox, oz, rot):
    c, s = math.cos(rot), math.sin(rot)
    f = lambda P: [[round((x - ox)*c - (z - oz)*s, 2), round((x - ox)*s + (z - oz)*c, 2)] for x, z in P]
    lat0, lon0 = T[key]['lat'], T[key]['lon']
    return f, round(lat0 - oz/110734.9, 7), round(lon0 + ox/103014.2, 7)
def ang(P, i):  # rot from edge i (east, south coords): CCW from east
    a, b = P[i], P[(i+1) % len(P)]; return math.atan2(-(b[1]-a[1]), b[0]-a[0])
D = {}
# Energy: origin at the middle of the complex, axes along the north tower's north edge
N = rb('szenergy', 'w776897365')['ring']; rot = ang(N, 0)
f, la, lo = frame('szenergy', 0.5, 42.5, rot)
D['energy'] = {'a': [la, lo, round(rot, 5)], 'N': f(N), 'L': f(rb('szenergy', 'w776897367')['ring']), 'S': f(rb('szenergy', 'w776897366')['ring'])}
# Dabaihui
R = rb('szdabaihui', 'w612997286')['ring']; rot = ang(R, 3)
f, la, lo = frame('szdabaihui', 0, 0, rot); D['dbh'] = {'a': [la, lo, round(rot, 5)], 'R': f(R)}
# Excellence: origin near the middle of the four towers
T1 = eb('szexcellence', 'w546581818')['rings'][0]; rot = math.atan2(-(T1[2][1]-T1[0][1]), T1[2][0]-T1[0][0])
f, la, lo = frame('szexcellence', 65, 50, rot)
D['exc'] = {'a': [la, lo, round(rot, 5)], 'T1': f(T1), 'T2': f(eb('szexcellence', 'w546581820')['rings'][0]), 'T3': f(eb('szexcellence', 'w546581821')['rings'][0]),
  'T4': f(eb('szexcellence', 'w546581823')['rings'][0]), 'X': f(eb('szexcellence', 'w776141713')['rings'][0]), 'P': f(eb('szexcellence', 'w776141711')['rings'][0]),
  'K': [f(eb('szexcellence', o)['rings'][0]) for o in ('w776141712', 'w776141715', 'w776141716')]}
# Press tower
B = rb('szpresstower', 'w925221216'); rot = 0.0
f, la, lo = frame('szpresstower', 0, 0, rot)
D['press'] = {'a': [la, lo, rot], 'parts': [[p['base'], p['top'], f(p['ring'])] for p in B['parts']]}
# CMB tower
B = rb('szcmbtower', 'w545225932'); tw = [p for p in B['parts'] if p['top'] > 200][0]['ring']; rot = ang(tw, 0)
f, la, lo = frame('szcmbtower', 0, 0, rot)
D['cmb'] = {'a': [la, lo, round(rot, 5)], 'R': f(B['ring']), 'tw': f(tw)}
# NEO A
R = rb('szneo', 'w665100526')['ring']; rot = ang(R, 0)
f, la, lo = frame('szneo', 0, 0, rot); D['neo'] = {'a': [la, lo, round(rot, 5)], 'R': f(R)}
# Upperhills: origin between the towers and the LOFT village
T1 = eb('szupperhills', 'w684494961')['rings'][0]; rot = ang(T1, 0)
f, la, lo = frame('szupperhills', -165, 5, rot)
lofts = []
from shapely.geometry import Polygon, Point
PLOT = Polygon(E['szupperhills']['areas']['w674566923']['rings'][0])
SKIP = {'w684494961', 'w684494959', 'w1393874916', 'w684494957', 'w684494962', 'w775816337', 'w775816338', 'w684494956'}
for b in E['szupperhills']['b']:
    r0 = b['rings'][0]; cx = sum(p[0] for p in r0)/len(r0); cz = sum(p[1] for p in r0)/len(r0)
    if b['id'] in SKIP or not PLOT.buffer(4).contains(Point(cx, cz)) or cz < -130: continue
    lofts.append([b['id'], b['h'], f(r0)])
D['uh'] = {'a': [la, lo, round(rot, 5)], 'T1': f(T1), 'T2': f(eb('szupperhills', 'w684494959')['rings'][0]), 'BP': f(eb('szupperhills', 'w1393874916')['rings'][0]),
  'M1': f(eb('szupperhills', 'w684494957')['rings'][0]), 'M2': f(eb('szupperhills', 'w684494962')['rings'][0]), 'L': lofts,
  'plot': f(E['szupperhills']['areas']['w674566923']['rings'][0]), 'MU': f(eb('szupperhills', 'w684494956')['rings'][0])}
# CEC
B = rb('szcec', 'w146862823'); rot = ang(B['ring'], 0)
f, la, lo = frame('szcec', 0, 0, rot); D['cec'] = {'a': [la, lo, round(rot, 5)], 'R': f(B['ring']), 'spine': f(B['parts'][0]['ring']), 'ends': [f(eb('szcec', o)['rings'][0]) for o in ('w781193993', 'w781193995')]}
# Gangxia North: the oculus plaza on the green strip south of Shennan Boulevard, east of Caitian Road (see report)
f, la, lo = frame('szgangxia', 85, -6, 0.0); D['gx'] = {'a': [la, lo, 0.0]}
js = 'const D = ' + json.dumps(D, separators=(',', ':')) + ';'
src = open('szcbd.js').read()
src = re.sub(r'^const D = .*;$', lambda m: js, src, count=1, flags=re.M)
open('szcbd.js', 'w').write(src)
print(len(js), {k: v['a'] for k, v in D.items()}, len(lofts))
