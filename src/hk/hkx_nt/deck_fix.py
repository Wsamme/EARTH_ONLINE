# Deck fix for two bridges of hk/hkx_nt (for the integrator). Run from SC/hkreal AFTER b4b_hkdecks.py (and after any other
# deck fix, e.g. hk/bridges/tm_deck_fix.py; it touches only the ways named below):
#   cd SC/hkreal && python3 ../hk/hkx_nt/deck_fix.py          (edits out/roads.pkl in place, like b4b_hkdecks.py)
#   python3 ../hk/hkx_nt/deck_fix.py --dry                     (only prints what it would change)
#   then b7r_roads.py, b6_misc.py, b7b_base.py, stage.sh as usual.
# Profiles: ../hk/hkx_nt/tools/profiles.py (sources there).
# 1. Shenzhen Bay Bridge: the generic rule puts the whole crossing at 13.8 m; the cable-stayed spans carry the road at ~37 m
#    (Jang 2005). The two main carriageways ("Shenzhen Bay Bridge", class 0, the OSM ways along the whole crossing) get the
#    profile szb_z(t) where it is higher than what they have: t = distance along the Hong Kong -> Shenzhen way from Ngau Hom Shek.
#    Everything outside t = 2.3-4.5 km stays as it is.
# 2. HZMB Hong Kong Link Road: the two main viaduct carriageways (the 9.3 km OSM ways from the HKSAR boundary at the west map
#    edge to Scenic Hill) get hklr_z(t), t from the boundary: the navigation viaduct's crest (50.5 m) over P17-P20, and level
#    16.0 m right to the boundary (b4b ramped that end down to the water although the HZMB main bridge continues beyond it).
#    The eastern end (t > 9 km, where b4b ramps down to the Scenic Hill tunnel portal) is kept.
import sys, math; sys.path.insert(0, '.'); sys.path.insert(0, '../hk/hkx_nt/tools')
from common import *
import profiles as PR
from shapely.geometry import Point
import pickle
DRY = '--dry' in sys.argv
SRC = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--src=')), None)
DST = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--dst=')), None)
R = pickle.load(open(SRC, 'rb')) if SRC else load('roads.pkl'); lines = R['lines']; elev = R['elev']
TH = load('terrain.pkl')['H']
def hC(x, y):
    fx = min(TN - 1.0001, max(0, (x + HALF)/TS)); fy = min(TN - 1.0001, max(0, (y + HALF)/TS)); i, j = int(fx), int(fy); u, v = fx - i, fy - j
    h = (TH[j, i]*(1 - u) + TH[j, i + 1]*u)*(1 - v) + (TH[j + 1, i]*(1 - u) + TH[j + 1, i + 1]*u)*v
    return max(-0.3, float(h))
OFF = 0.18
def dens(cs, step=10):
    P = [cs[0]]
    for a, b in zip(cs, cs[1:]):
        d = math.hypot(b[0] - a[0], b[1] - a[1]); n = max(1, int(math.ceil(d/step)))
        for k in range(1, n + 1): P.append((a[0] + (b[0] - a[0])*k/n, a[1] + (b[1] - a[1])*k/n))
    return P
def find(sub, c=0, minlen=0):
    return [i for i, l in enumerate(lines) if l['br'] and l['c'] == c and sub in ((l['name'] or '') + ' | ' + (l.get('bname') or '')) and l['g'].length > minlen]
from shapely.geometry import LineString
def apply(ids, axis, zf, keep):
    for i in ids:
        l = lines[i]; cs = list(l['g'].coords); old = list(elev.get(i) or [0.0]*len(cs))
        # densify to 10 m so the vertical curves are drawn (the old elevations resampled onto the new vertices)
        D0 = [0.0]
        for a, b in zip(cs, cs[1:]): D0.append(D0[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
        nc = dens(cs); D1 = [0.0]
        for a, b in zip(nc, nc[1:]): D1.append(D1[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
        import numpy as np
        oe = [float(np.interp(d, D0, old)) for d in D1]
        E = []
        for p, e0 in zip(nc, oe):
            t = axis.project(Point(p))
            if keep(t): E.append(round(e0, 2)); continue
            E.append(round(max(e0, zf(t) - OFF - hC(*p)) if zf is not PR.hklr_z else max(0.0, zf(t) - OFF - hC(*p)), 2))
        print('line %d %-50s %4d -> %4d vertices  max %.1f -> %.1f' % (i, (l['name'] or '')[:50], len(cs), len(nc), max(old), max(E)))
        if not DRY: l['g'] = LineString(nc); elev[i] = E
szb = find('Shenzhen Bay Bridge', 0, 4000)
assert len(szb) == 2, szb
ax = max((lines[i]['g'] for i in szb), key=lambda g: g.coords[0][0])      # the way that starts at the Hong Kong end (east)
apply(szb, ax, PR.szb_z, lambda t: t < 2200 or t > 4600)
hk = find('Hong Kong Link Road', 0, 9000)
assert len(hk) == 2, hk
ax2 = min((lines[i]['g'] for i in hk), key=lambda g: g.coords[0][0])        # the way that starts at the boundary (west)
apply(hk, ax2, PR.hklr_z, lambda t: t > 9000)
if not DRY:
    if DST: pickle.dump(R, open(DST, 'wb'), protocol=4)
    else: save(R, 'roads.pkl')
print('done' + (' (dry)' if DRY else ''))
