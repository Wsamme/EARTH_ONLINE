import sys; sys.path.insert(0, '.')
from common import *
import collections
from shapely.ops import unary_union
Bl = load('buildings.pkl'); byid = {b['id']:b for b in Bl['b']}
pb = collections.defaultdict(list)
for p in Bl['parts']: pb[p['bid']].append(p)
reg = collections.Counter(); bad = []
for bid, ps in pb.items():
    b = byid.get(bid)
    if not b or b['foreign']: continue
    g0 = unary_union([p['g'] for p in ps if p['base'] <= 0.5]) if any(p['base'] <= 0.5 for p in ps) else None
    fa = unary_union([p['g'] for p in ps if p['base'] > 0.5]) if any(p['base'] > 0.5 for p in ps) else None
    if fa is None: continue
    unsup = fa if g0 is None else fa.difference(g0.buffer(1))
    frac = unsup.area/max(1, fa.area)
    if frac > 0.3:
        c = b['g'].centroid; r = 'east' if c.x > 8000 else 'west' if c.x < -8000 else 'central'; reg[r] += 1
        bad.append((frac, b['name'], b['t'], round(c.x), round(c.y), [(p['base'], p['h']) for p in ps][:6], round(fa.area)))
print('buildings whose raised parts are mostly unsupported:', len(bad), reg)
for x in sorted(bad, key=lambda t: -t[-1])[:40]: print(x)
