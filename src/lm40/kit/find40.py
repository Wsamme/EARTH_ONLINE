# lm40: name search on the Singapore data the app uses, with OSM ids.  cd SC/sgreal && python3 SC/lm40/kit/find40.py 'regex' ...
#   B = building footprint (osm id, name, h, floors, area m2, centroid lat,lon)   P = named POI   L = named land-use / park area
#   R = named road / path line (kind, bridge flag, length m, midpoint lat,lon; no OSM ids are kept for roads)
#   'near:lat,lon,r' as a pattern lists every building (named or not) whose centroid is within r m (largest first)
import sys, re; sys.path.insert(0, '.')
from common import *
Bl = load('buildings.pkl'); RL = [l for l in load('roads.pkl')['lines'] if l.get('name')]; B = pickle.load(open(SGD + 'base15.pkl', 'rb')); OSM = pickle.load(open(ROOT + 'lm40/kit/osm_of.pkl', 'rb'))
def bl(b):
    c = b['g'].centroid; lon, lat = ll(c.x, c.y)
    return '  B %-10s %-42s h %-6s fl %-4s A %-7d %.6f,%.6f' % (OSM.get(b['id'], '-'), (b['name'] or '')[:42], b['h'], b['fl'], round(b['g'].area), lat, lon)
for pat in sys.argv[1:]:
    print('==', pat)
    if pat.startswith('near:'):
        la, lo, r = map(float, pat[5:].split(',')); x0, y0 = w(lo, la)
        hits = [b for b in Bl['b'] if abs(b['g'].centroid.x - x0) < r and abs(b['g'].centroid.y - y0) < r and math.hypot(b['g'].centroid.x - x0, b['g'].centroid.y - y0) < r]
        for b in sorted(hits, key=lambda b: -b['g'].area)[:12]: print(bl(b))
        from shapely.geometry import Point
        pt = Point(x0, y0).buffer(r)
        k = 0
        for pp, g in B['pois']:
            q = g if g.geom_type == 'Point' else g.representative_point(); qx, qy = w(q.x, q.y)
            if pp.get('name') and math.hypot(qx - x0, qy - y0) < r and pp.get('kind') not in ('bus_stop', 'atm', 'taxi', 'parking', 'parking_entrance', 'bench', 'waste_basket'):
                print('  P %-44s %-14s %.6f,%.6f' % (pp['name'][:44], pp.get('kind'), q.y, q.x)); k += 1
                if k >= 8: break
        for l in [l for l in RL if l['br'] and l['g'].intersects(pt)][:6]:
            q = l['g'].interpolate(0.5, normalized=True); lon, lat = ll(q.x, q.y)
            print('  R %-40s %-12s br %-5s L %-6d mid %.6f,%.6f' % (l['name'][:40], l['kd'], l['br'], round(l['g'].length), lat, lon))
        continue
    rx = re.compile(pat, re.I)
    for b in sorted([b for b in Bl['b'] if b['name'] and rx.search(b['name'])], key=lambda b: -b['g'].area)[:6]: print(bl(b))
    k = 0
    for p, g in B['pois']:
        if p.get('name') and rx.search(p['name']):
            q = g if g.geom_type == 'Point' else g.representative_point(); print('  P %-44s %-14s %.6f,%.6f' % (p['name'][:44], p.get('kind'), q.y, q.x)); k += 1
            if k >= 4: break
    k = 0
    for p, g in B['landuse']:
        if p.get('name') and rx.search(p['name']):
            q = g.representative_point(); print('  L %-44s %-14s A %-8d %.6f,%.6f' % (p['name'][:44], p.get('kind'), round(proj(g).area), q.y, q.x)); k += 1
            if k >= 3: break
    k = 0
    for l in sorted([l for l in RL if rx.search(l['name'])], key=lambda l: (not l['br'], -l['g'].length)):
        q = l['g'].interpolate(0.5, normalized=True); lon, lat = ll(q.x, q.y)
        print('  R %-40s %-12s br %-5s L %-6d mid %.6f,%.6f' % (l['name'][:40], l['kd'], l['br'], round(l['g'].length), lat, lon)); k += 1
        if k >= 4: break
