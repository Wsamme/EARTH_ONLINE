# stage 4b (Hong Kong): deck profiles for the big bridges (edits roads.pkl in place; then b7 / b7r encode the roads).
# Every bridge is one structure: all its OSM ways (both directions, both levels, the approach viaducts in its corridor) share one
# profile along the bridge axis, so the pieces meet at the joints:
#   z(t) = min( P(t), ground_A + grade*(t - tA), ground_B + grade*(tB - t) )      (road surface, m above the water)
#   P(t) = max( base, hump over every water stretch: cap - crown*((t - tc)/hw)^2 inside, falling at 'grade' outside )
# Double-deck bridges (Tsing Ma, Kap Shui Mun: roads on top, the Airport Express / Tung Chung Line tracks and the typhoon lanes
# inside the stiffening truss): the lower level is the same profile 'gap' metres lower.
# Heights (road surface at mid-span; sources in README.md):
#   Tsing Ma: navigation clearance 62 m (Structurae; the Marine Department's vessel height limit there is 57 m) -> lower 63.0,
#     upper 69.5 (the truss depth ~7.5 m: an estimate, like Kap Shui Mun's 7.46 m girder)
#   Kap Shui Mun: clearance 47 m, deck depth 7.46 m (Structurae; MD limit 41 m) -> lower 48.0, upper 54.5; the Lantau Link deck
#     runs on level (~54 m, an estimate) across Ma Wan between the two bridges, and falls to the ground only at Tsing Yi and Lantau
#   Stonecutters: clearance 73.5 m (Wikipedia, Structurae; MD limit 68.5 m) -> 77.0 (twin steel box ~3.5 m, estimate)
#   Ting Kau: no published clearance found; MD limit 53 m + the 5 m margin of Tsing Ma (62 / 57) and Stonecutters (73.5 / 68.5)
#     -> underside ~58 m -> road ~61.0 (estimate)
#   Bridges with only an MD vessel height limit: limit + 5 m margin + ~2.5 m deck (estimates): Cheung Tsing / Tsing Tsuen /
#     Tsing Yi bridges (17 m) 24.5, Ap Lei Chau Bridge (14 m) 21.5, Tseung Kwan O Cross Bay Bridge (17 m at its main span) 24.5,
#     the HZMB Hong Kong Link Road viaduct (10-12 m over most of its length) 16.0 (its three high navigation arches, 41 m, are
#     not placed: their positions are not in the data)
#   Shenzhen Bay Bridge, the Tuen Mun - Chek Lap Kok Link southern viaduct: the generic sea-bridge rule of b4 (3 m + 3 % of the
#     water length, at most 26 m)
import sys, collections; sys.path.insert(0, '.')
from common import *
from shapely.geometry import LineString, Point, box
DRY = '--dry' in sys.argv
R = load('roads_b4.pkl'); lines = R['lines']; elev = R['elev']        # (always from the b4 output: re-runnable)
TH = load('terrain.pkl')['H']
def hC(x, y):
    fx = min(TN - 1.0001, max(0, (x + HALF)/TS)); fy = min(TN - 1.0001, max(0, (y + HALF)/TS)); i, j = int(fx), int(fy); u, v = fx - i, fy - j
    h = (TH[j, i]*(1 - u) + TH[j, i + 1]*u)*(1 - v) + (TH[j + 1, i]*(1 - u) + TH[j + 1, i + 1]*u)*v
    return max(-0.3, float(h))
def dens(cs, step=25):
    P = [cs[0]]
    for a, b in zip(cs, cs[1:]):
        d = math.hypot(b[0] - a[0], b[1] - a[1]); n = max(1, int(math.ceil(d/step)))
        for k in range(1, n + 1): P.append((a[0] + (b[0] - a[0])*k/n, a[1] + (b[1] - a[1])*k/n))
    return P
lay = lambda l: l.get('layer') or 0
LAND12 = np.load(OUT + 'land12.npy'); n12 = LAND12.shape[0]
def wetAt(x, y):      # sea or fresh water (the 12 m land mask of b2; river levels can stand above 0)
    i = min(n12 - 1, max(0, int((x + HALF)/12))); j = min(n12 - 1, max(0, int((y + HALF)/12))); return not LAND12[j, i]
HAS = lambda l, *subs: any(x in ((l['name'] or '') + ' | ' + (l.get('bname') or '')) for x in subs)
B = [  # key, name substrings, level rule, upper cap, gap (lower = upper - gap), options
 dict(k='tsingma', sub=('Tsing Ma Bridge',), lvl=lambda l: 'U' if l['c'] <= 3 and lay(l) >= 3 else 'L', cap=69.5, gap=6.5, grade=0.04, corr=400, cls=10, base=54.5, free=(22.350, 114.060)),
 dict(k='kapshuimun', sub=('Kap Shui Mun Bridge', 'Lantau Link'), lvl=lambda l: 'U' if l['c'] <= 3 and lay(l) >= 3 else 'L', cap=54.5, gap=6.5, grade=0.04, corr=400, cls=10, base=54.0, free=(22.350, 114.060)),
 dict(k='stonecutters', sub=('Stonecutters Bridge', 'Ngong Shuen Chau Viaduct', 'East Tsing Yi Viaduct'), lvl=lambda l: 'U', cap=77.0, grade=0.05, corr=900),
 dict(k='tingkau', sub=('Ting Kau Bridge', 'Ting Kau Viaduct'), lvl=lambda l: 'U', cap=61.0, grade=0.045, corr=600),
 dict(k='cheungtsing', sub=('Cheung Tsing Bridge',), lvl=lambda l: 'U', cap=24.5, grade=0.05, corr=700),
 dict(k='apleichau', sub=('Ap Lei Chau Bridge',), lvl=lambda l: 'U', cap=21.5, grade=0.045, corr=150, cls=12),
 dict(k='crossbay', sub=('Cross Bay Bridge', 'Cross Bay Link'), lvl=lambda l: 'U', cap=24.5, grade=0.045, corr=300, cls=12),
 dict(k='hklr', sub=('Hong Kong Link Road',), lvl=lambda l: 'U', cap=16.0, crown=0.0, base=16.0, grade=0.04, corr=300, cls=11),
]
ends = collections.defaultdict(list)
qk = lambda p: (round(p[0]/1.5), round(p[1]/1.5))
for i, l in enumerate(lines):
    cs = l['g'].coords; ends[qk(cs[0])].append((i, 0)); ends[qk(cs[-1])].append((i, 1))
def ends_at(p):
    k = qk(p); out = []
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1): out += ends.get((k[0] + dx, k[1] + dy), [])
    return out
done = {}; report = []
for S in B:
    cls_ok = (lambda c: c == 15) if S.get('rail') else (lambda c, m=S.get('cls', 3): c <= m)
    def match(l):
        if not l['br'] or not cls_ok(l['c']): return False
        if not HAS(l, *S['sub']): return False
        if S.get('bbox'):
            bb = S['bbox']; c = l['g'].centroid
            if not (bb[0] <= c.x <= bb[2] and bb[1] <= c.y <= bb[3]): return False
        return True
    main = [i for i, l in enumerate(lines) if match(l) and i not in done]
    if not main: print('NOT FOUND', S['k']); continue
    P = np.array([p for i in main for p in lines[i]['g'].coords])
    c0 = P.mean(0); U, Sv, Vt = np.linalg.svd(P - c0, full_matrices=False); u = Vt[0]; v = np.array([-u[1], u[0]])
    tOf = lambda p: float((p[0] - c0[0])*u[0] + (p[1] - c0[1])*u[1]); dOf = lambda p: abs(float((p[0] - c0[0])*v[0] + (p[1] - c0[1])*v[1]))
    t0m = min(tOf(p) for p in P); t1m = max(tOf(p) for p in P)
    # approach viaducts in the corridor (elevated motorway / trunk carriageways along the axis)
    sel = set(main)
    if S.get('corr'):
        for i, l in enumerate(lines):
            if i in sel or i in done or not l['br'] or l['c'] > 3 or lay(l) < 1: continue
            cs = list(l['g'].coords)
            if all(dOf(p) < 70 and t0m - S['corr'] <= tOf(p) <= t1m + S['corr'] for p in cs): sel.add(i)
    allp = [p for i in sel for p in lines[i]['g'].coords]
    tA = min(tOf(p) for p in allp); tB = max(tOf(p) for p in allp)
    pA = min(allp, key=tOf); pB = max(allp, key=tOf); gA = hC(*pA) + 0.6; gB = hC(*pB) + 0.6
    # 'free': the end near this point (Ma Wan, between Tsing Ma and Kap Shui Mun) continues on the next deck: it ramps from the base level, not the ground
    fq = w(S['free'][1], S['free'][0]) if S.get('free') else None
    freeA = bool(fq) and math.hypot(pA[0] - fq[0], pA[1] - fq[1]) < 900; freeB = bool(fq) and math.hypot(pB[0] - fq[0], pB[1] - fq[1]) < 900
    # water stretches along the axis
    # (sampled along the bridge's own lines, which may curve away from the straight axis)
    wt = sorted(tOf(p) for i in main for p in dens(list(lines[i]['g'].coords), 10) if wetAt(*p))
    runs = []
    for t in wt:
        if runs and t - runs[-1][1] < 40: runs[-1][1] = t
        else: runs.append([t, t])
    runs = [(a, b) for a, b in runs if b - a >= 60]
    crown, ext, grade = S.get('crown', 2.0), S.get('ext', 120.0), S['grade']
    def Pz(t, cap):
        z = -1e9
        for a, b in runs:
            tc = (a + b)/2; hw = (b - a)/2 + ext; d = abs(t - tc)
            z = max(z, cap - crown*(d/hw)**2 if d <= hw else cap - crown - grade*(d - hw))
        base = S.get('base')
        if base == 'cap' and runs: base = cap - crown if min(r[0] for r in runs) - ext <= t <= max(r[1] for r in runs) + ext else None
        if base is not None and base != 'cap': z = max(z, base - (S['cap'] - cap))       # (the lower deck: the same gap below)
        if z < -1e8: z = cap
        bL = (S.get('base') or 0) - (S['cap'] - cap)     # a free end starts from the next deck's level (the base) instead of the ground
        return z if S.get('noends') else min(z, (bL if freeA else gA) + grade*(t - tA), (bL if freeB else gB) + grade*(tB - t))
    nE = 0; mx = collections.defaultdict(float)
    for i in sel:
        l = lines[i]; lv = S['lvl'](l); cap = S['cap'] - (S.get('gap', 0) if lv == 'L' else 0)
        cs = dens(list(l['g'].coords))
        E = [round(max(0.0, Pz(tOf(p), cap) - 0.18 - hC(*p)), 2) for p in cs]
        if not DRY: l['g'] = LineString(cs); elev[i] = E; l['br'] = True
        done[i] = S['k']; nE += 1; mx[lv] = max(mx[lv], max(E))
    report.append((S['k'], len(main), len(sel), [(round(a), round(b)) for a, b in runs], round(tB - tA), round(gA, 1), round(gB, 1), {k: round(v, 1) for k, v in mx.items()}))
    print('%-11s main %3d lines %3d  water %s  length %5d m  ends %.1f / %.1f  max E %s' % report[-1], 'free ends', freeA, freeB, flush=True)
# roads joining a raised end: ramp down at 5.5 % (only raises, never lowers what they had)
def lift(j, e, h0, hops, seen, GR=0.055):
    if hops > (12 if GR < 0.05 else 4) or j in seen or j in done or h0 < 0.3: return
    m = lines[j]
    if m['c'] in (13, 14): return
    cs = list(m['g'].coords); D = [0.0]
    for a, b in zip(cs, cs[1:]): D.append(D[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    Lt = D[-1]; rl = h0/GR
    if Lt < 1: return
    if rl > 25 and max(D[k + 1] - D[k] for k in range(len(D) - 1)) > 25:
        cs = dens(cs); D = [0.0]
        for a, b in zip(cs, cs[1:]): D.append(D[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
        old = elev.get(j)
        if old is not None:
            # resample the old elevation onto the denser vertices
            oc = list(m['g'].coords); OD = [0.0]
            for a, b in zip(oc, oc[1:]): OD.append(OD[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
            old = [float(np.interp(d, OD, old)) for d in D]
        m['g'] = LineString(cs); elev[j] = old if old is not None else [0.0]*len(cs)
    E = list(elev.get(j) or [0.0]*len(cs))
    for k, d in enumerate(D):
        s = d if e == 0 else Lt - d
        if s < rl: E[k] = max(E[k], round(h0*(1 - s/rl), 2))
    elev[j] = E; nl[0] += 1
    if Lt < rl:
        far = cs[-1] if e == 0 else cs[0]; rest = h0*(1 - Lt/rl)
        for (k, f) in ends_at(far):
            if k != j and (lines[k]['c'] <= 12 if m['c'] <= 12 else lines[k]['c'] == m['c']): lift(k, f, rest, hops + 1, seen | {j}, GR)
nl = [0]
if not DRY:
    for i in list(done):
        cs = lines[i]['g'].coords; E = elev[i]
        for e, p, h in ((0, cs[0], E[0]), (1, cs[-1], E[-1])):
            if h < 0.5: continue
            for (j, f) in ends_at(p):
                if j == i or j in done: continue
                if lines[i]['c'] == 15:                      # rail: long approach viaducts (1.5 %), rail only
                    if lines[j]['c'] == 15: lift(j, f, h, 0, {i}, 0.015)
                elif lines[j]['c'] != 12 or lines[i]['c'] == 12: lift(j, f, h, 0, {i})
print('deck lines set', len(done), '; joining roads ramped', nl[0])
if not DRY: save({'lines':lines, 'elev':elev}, 'roads.pkl')
json.dump(report, open(OUT + 'decks_report.json', 'w'))
