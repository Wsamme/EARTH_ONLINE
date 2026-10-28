# Deck fix for the Lingdingyang Bridge of the Shenzhen-Zhongshan Link (gba/szbaoan, key szszlink) — for the integrator.
# Run from SC/gbareal AFTER b4b_hkdecks.py and the Hong Kong deck fixes (it touches only the two ways named below):
#   cd SC/gbareal && python3 ../gba/szbaoan/szlink_deck_fix.py          (edits out/roads.pkl in place, like b4b_hkdecks.py)
#   python3 ../gba/szbaoan/szlink_deck_fix.py --dry                      (only prints what it would change)
#   test on a copy: --src=<pickle> [--dst=<pickle>]                      (e.g. --src=out/roads_b4.pkl --dry)
#   then b6_misc.py, b7r_roads.py / b7c_roads.py (elev > 51 m is stored as u8/2.5, flag 32: up to 102 m), b7b_base.py, stage.sh.
# Why: the two carriageways of the Shenzhen-Cenxi Expressway over the bridge (OSM ways 1298785019 / 1298785020, bridge:name 深中大桥,
#   the bridge's name since 2024; old name 伶仃洋大桥) get the generic sea-crossing rule: 13.8 m over their whole 7.9 km. The real road
#   is 91 m above the sea at mid-span (People's Daily 2023-11-29; Jiemian; ourchinastory: "桥面距离海平面高达91米"), with 76.5 m
#   navigation clearance (same sources) under a 4 m deep, 49.7 m wide steel box girder (梁宽49.7m, 梁高4m: 163.com / 交通部 article
#   "伶仃洋上不伶仃"). Spans 580 + 1666 + 580 m (same article; Structurae), towers 270 m.
# Profile (road surface above the sea; t = metres along each way from the main-span centre, + toward Shenzhen / the West Artificial
#   Island; the main span and side spans are straight, the approaches curve: t is the arc length along the way):
#   |t| <= 833 (main span, towers at +-833.85): vertical curve 91.0 - t^2/(2*33320): 80.6 m at the towers, 82.3 m at +-760 (the
#     edges of the 1520 m navigable width): girder soffit 82.3 - 4.3 = 78.0 m >= the 76.5 m clearance;
#   |t| > 833: 2.5 % down the side spans (66.1 m at the anchorages, t = +-1413) and on along the approach viaducts until the existing
#     13.8 m is met (|t| ~ 3505), joined with a smooth maximum (no kink). Everything below the existing value is kept (the island end
#     and the western approach toward the Zhongshan Bridge keep their 13.8 m).
#   Only 91 m (mid-span) and the 76.5 m clearance are verified; the curve radius, the 2.5 % grades and the anchorage level are estimates.
# Densifies both ways to <= 10 m vertices (the curve needs them; b4 has ~22 m) and resamples the old elevations onto them.
import sys, math, pickle; sys.path.insert(0, '.')
from common import *
from shapely.geometry import LineString, Point
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
# the bridge frame (world metres, this build): main-span centre on the carriageways' mid line, unit axis toward the east tower
MX, MY = w(113.7255956, 22.5553435); UX, UY = math.cos(0.32976), math.sin(0.32976)
ZMID, RV, TT, G, ZBASE = 91.0, 33320.0, 833.0, 0.025, 13.8
def zprof(t):
    a = abs(t)
    if a <= TT: return ZMID - a*a/(2*RV)
    return ZMID - TT*TT/(2*RV) - G*(a - TT)
def smax(a, b, e=8.0): d = abs(a - b); return max(a, b) + ((e - d)**2/(4*e) if d < e else 0.0)   # C1 smooth maximum, exact beyond e
def dens(cs, step=10):
    P = [cs[0]]
    for a, b in zip(cs, cs[1:]):
        d = math.hypot(b[0] - a[0], b[1] - a[1]); n = max(1, int(math.ceil(d/step)))
        for k in range(1, n + 1): P.append((a[0] + (b[0] - a[0])*k/n, a[1] + (b[1] - a[1])*k/n))
    return P
ids = [i for i, l in enumerate(lines) if l['c'] == 0 and l['br'] and (l.get('bname') or '') == '深中大桥']
assert len(ids) == 2, ids
import numpy as np
for i in ids:
    l = lines[i]; cs = list(l['g'].coords); old = list(elev.get(i) or [0.0]*len(cs))
    nc = dens(cs); D0 = [0.0]; D1 = [0.0]
    for a, b in zip(cs, cs[1:]): D0.append(D0[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    for a, b in zip(nc, nc[1:]): D1.append(D1[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    oe = [float(np.interp(d, D0, old)) for d in D1]
    # arc length at the main-span centre (the vertex nearest the centre's normal line) and the direction of the way
    al = [(x - MX)*UX + (y - MY)*UY for x, y in nc]
    k0 = min(range(len(nc)), key=lambda k: abs(al[k])); sg = 1 if al[min(k0 + 1, len(nc) - 1)] > al[max(k0 - 1, 0)] else -1
    s0 = D1[k0] - sg*al[k0]
    E = []
    for p, d, e0 in zip(nc, D1, oe):
        t = sg*(d - s0); gz = hC(*p)
        zo = gz + e0 + OFF
        zn = smax(zprof(t), zo) if abs(t) > TT else zprof(t)
        E.append(round(max(0.0, zn - OFF - gz), 2))
    print('line %d %-28s %4d -> %4d vertices  t %.0f..%.0f  elev %.1f..%.1f -> %.1f..%.1f (max at t=%.0f)' % (i, (l.get('bname') or '')[:28], len(cs), len(nc),
          sg*(0 - s0), sg*(D1[-1] - s0), min(old), max(old), min(E), max(E), sg*(D1[E.index(max(E))] - s0)))
    for tt in (-3600, -3000, -2000, -1413, -833, -760, 0, 760, 833, 1413, 2000, 3000, 3500, 4000):
        k = min(range(len(nc)), key=lambda k: abs(sg*(D1[k] - s0) - tt))
        if abs(sg*(D1[k] - s0) - tt) < 6: print('    t %6d  road %.2f m  (old %.2f)' % (tt, E[k] + OFF + hC(*nc[k]), oe[k] + OFF + hC(*nc[k])))
    if not DRY: l['g'] = LineString(nc); elev[i] = E
if not DRY:
    if DST: pickle.dump(R, open(DST, 'wb'), protocol=4)
    else: save(R, 'roads.pkl')
print('Lingdingyang deck fix: ways', len(ids), '(dry run)' if DRY else '')
