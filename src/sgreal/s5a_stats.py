import sys; sys.path.insert(0,'.')
from common import *
import collections, json as J
from shapely.prepared import prep
Bd = pickle.load(open(SGD + 'bld14.pkl', 'rb'))
L = load('land.pkl'); sg = prep(L['sg'].buffer(50))
ids = collections.Counter(p['id'] for p, g in Bd['building'])
print('unique ids', len(ids), 'multi-piece', sum(1 for v in ids.values() if v > 1))
src = collections.Counter(); cls = collections.Counter(); hasf = collections.Counter(); area = collections.Counter()
for p, g in Bd['building']:
    c = g.centroid
    ins = sg.contains(proj(c))
    s = p.get('@geometry_source'); src[(ins, s)] += 1
    if ins:
        cls[(p.get('class'), p.get('subtype'))] += 1
        hasf[(s, p.get('num_floors') is not None or p.get('height') is not None)] += 1
print(src); print(hasf); print(cls.most_common(40))
