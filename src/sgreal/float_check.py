import sys; sys.path.insert(0, '.')
from common import *
import collections
Bl = load('buildings.pkl')
fl = [b for b in Bl['b'] if b['base'] > 0.5 and not b['foreign']]
print('non-part buildings with base>0.5:', len(fl), 'of', len(Bl['b']))
print('  of which have parts (outline replaced):', sum(1 for b in fl if b['id'] in Bl['have_parts']))
fl2 = [b for b in fl if b['id'] not in Bl['have_parts']]
# region breakdown by x
reg = collections.Counter()
for b in fl2:
    c = b['g'].centroid; reg['east' if c.x > 8000 else 'west' if c.x < -8000 else 'central'] += 1
print(reg)
for b in sorted(fl2, key=lambda b: -b['g'].area)[:25]:
    c = b['g'].centroid; print(b['name'], b['t'], 'h', b['h'], 'base', b['base'], 'A', round(b['g'].area), 'at', round(c.x), round(c.y))
pf = [p for p in Bl['parts'] if p['base'] > 0.5]
print('parts with base:', len(pf), 'of', len(Bl['parts']))
