import sys, re; sys.path.insert(0, '.')
from common import *
Bl = load('buildings.pkl')
B = pickle.load(open(SGD + 'base15.pkl', 'rb'))
for pat in sys.argv[1:]:
    rx = re.compile(pat, re.I); print('==', pat)
    hits = [b for b in Bl['b'] if b['name'] and rx.search(b['name'])]
    for b in sorted(hits, key=lambda b: -b['g'].area)[:6]:
        c = b['g'].centroid; lon, lat = ll(c.x, c.y); print('  B', b['name'], 'h', b['h'], 'A', round(b['g'].area), '%.5f,%.5f' % (lat, lon))
    k = 0
    for p, g in B['pois']:
        if p.get('name') and rx.search(p['name']):
            q = g if g.geom_type == 'Point' else g.representative_point(); print('  P', p['name'], p.get('kind'), '%.5f,%.5f' % (q.y, q.x)); k += 1
            if k >= 4: break
