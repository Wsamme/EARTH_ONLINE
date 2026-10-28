# Deck fix for the Avenue of Stars promenade (hk/hkx_kowloon) — for the integrator. Run from SC/hkreal AFTER b4b_hkdecks.py (and the
# other deck fixes):
#   cd SC/hkreal && python3 ../hk/hkx_kowloon/aos_deck_fix.py           (edits out/roads.pkl in place, like b4b_hkdecks.py)
#   python3 ../hk/hkx_kowloon/aos_deck_fix.py --dry                      (only prints what it would change)
#   then b7r_roads.py, b6_misc.py, b7b_base.py, stage.sh as usual.
# Why: the OSM way "Avenue of Stars" (a footway, bridge=yes, layer 1: the promenade is mapped as a viaduct over the water) gets the
# generic water-bridge height, 6.6 m over the harbour along its whole 440 m, while the land behind it (Salisbury Garden, the K11 forecourt)
# is at -0.3 .. 1 m in the app: the path floats 6 m above the promenade and the garden. The real promenade is level with the garden.
# What it does: every class-12 bridge line whose midpoint lies inside the promenade outline (OSM r14947605, grown by 6 m) — the
# promenade way itself and the short ramps onto it — gets its surface at the hkavenuestars models' deck, 1.0 m (world), i.e.
# elev = 1.0 - 0.06 (the path offset) - ground.
import sys, json; sys.path.insert(0, '.')
from common import *
from shapely.geometry import Polygon, LineString
DRY = '--dry' in sys.argv
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
R = load('roads.pkl'); lines = R['lines']; elev = R['elev']
TH = load('terrain.pkl')['H']
def hC(x, y):
    fx = min(TN - 1.0001, max(0, (x + HALF)/TS)); fy = min(TN - 1.0001, max(0, (y + HALF)/TS)); i, j = int(fx), int(fy); u, v = fx - i, fy - j
    h = (TH[j, i]*(1 - u) + TH[j, i + 1]*u)*(1 - v) + (TH[j + 1, i]*(1 - u) + TH[j + 1, i + 1]*u)*v
    return max(-0.3, float(h))
DECK, OFF = 1.0, 0.06
A = json.load(open(SC + 'hk/hkx_kowloon/areas.json'))['hkavenuestars']['self']['rings'][0]
ax, ay = w(114.175006, 22.293782)
poly = Polygon([(ax + p[0], ay - p[1]) for p in A]).buffer(6)
n = 0
for i, l in enumerate(lines):
    if l['c'] != 12 or not l['br']: continue
    g = l['g']
    if not poly.contains(g.interpolate(0.5, normalized=True)): continue
    cs = list(g.coords); old = elev.get(i)
    new = [round(max(0.0, DECK - OFF - hC(x, y)), 2) for x, y in cs]
    n += 1
    print('%-30s %3d pts  elev old %s  new %.2f..%.2f' % ((l['name'] or '-')[:30], len(cs), ('%.1f..%.1f' % (min(old), max(old))) if old else '-', min(new), max(new)))
    if not DRY: elev[i] = new
print(n, 'lines', 'checked (dry run)' if DRY else 'updated')
if not DRY and n: save(R, 'roads.pkl')
