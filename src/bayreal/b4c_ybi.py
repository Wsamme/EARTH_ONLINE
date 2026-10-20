# stage 4c: the Yerba Buena Island tunnel. The 90 m terrain grid stands above the real portals (the hill is smoothed over the
# cut), so road ends that would climb the hillside are trimmed where they enter the hill: they end at the slope like a portal.
import sys; sys.path.insert(0, '.')
from common import *
from shapely.geometry import box, LineString
R = load('roads.pkl'); TH = load('terrain.pkl')['H']
def hC(x, y):
    fx = min(TN - 1.0001, max(0, (x + HALF)/TS)); fy = min(TN - 1.0001, max(0, (y + HALF)/TS)); i, j = int(fx), int(fy); u, v = fx - i, fy - j
    return max(-0.3, float((TH[j, i]*(1 - u) + TH[j, i + 1]*u)*(1 - v) + (TH[j + 1, i]*(1 - u) + TH[j + 1, i + 1]*u)*v))
YB = box(*w(-122.372, 37.806), *w(-122.358, 37.816)); n = 0
for i, l in enumerate(R['lines']):
    if l['c'] > 1 or not l['g'].intersects(YB): continue
    el = R['elev'].get(i); cs = list(l['g'].coords)
    bad = [((el is None or el[k] < 0.05) and hC(*c) > 57.0) for k, c in enumerate(cs)]
    a, b = 0, len(cs)
    while a < b and bad[a]: a += 1
    while b > a and bad[b - 1]: b -= 1
    if (a, b) == (0, len(cs)): continue
    if b - a < 2: print('line', i, 'fully inside the hill: dropped to 2 pts kept as is'); continue
    l['g'] = LineString(cs[a:b])
    if el is not None: R['elev'][i] = el[a:b]
    n += 1; print('trimmed', i, l['name'], len(cs), '->', b - a)
print('ybi trimmed', n)
save(R, 'roads.pkl')
