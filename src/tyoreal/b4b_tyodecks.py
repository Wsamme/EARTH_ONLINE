# stage 4b (Tokyo): real deck profiles for the big bay bridges (edits roads.pkl in place; then b7 / b7r encode the roads).
# Same method as New York (nycreal/b4b_nycdecks.py): every bridge is one structure; all its OSM ways (both decks, both directions, the
# approach viaducts in its corridor) share one profile along the bridge axis:
#   z(t) = min( P(t), ground_A + grade*(t - tA), ground_B + grade*(tB - t) )      (road surface, m above the sea)
#   P(t) = max( base, hump over every water stretch: cap - crown*((t - tc)/hw)^2 inside, falling at 'grade' outside )
# Double-deck bridges: the lower deck is the same profile 'gap' metres lower. Roads joining a raised end get a 5.5 % ramp.
# Heights (road surface at mid-span), sources checked 2026-10-16 (Japanese Wikipedia):
#   Rainbow Bridge (レインボーブリッジ): girder clearance 52 m (designed >= 50 m for the shipping channel); lower deck (Route 482, the
#     Yurikamome, walkways) 54.0 = clearance + ~2 m deck; upper deck (Shuto Daiba Route) 61.5 (deck-to-deck gap 7.5 m: estimate)
#   Tokyo Gate Bridge (東京ゲートブリッジ): navigation clearance A.P. +54.6 m (A.P. = Tokyo Bay datum ~1.1 m below mean sea level)
#     -> ~53.5 m above the sea; road 56.0 (clearance + ~2.5 m deck structure: estimate)
#   Yokohama Bay Bridge (横浜ベイブリッジ): clearance about 55 m; lower deck (Route 357) 57.0 (+2 m deck), upper deck (Shuto Bayshore
#     Route) 65.0 (gap 8 m: estimate)
#   Tsurumi Tsubasa Bridge (鶴見つばさ橋): "海面から路面までの高さ 57m" (sea to road surface 57 m) -> 57.0
#   Tokyo Bay Aqua-Line bridge section (アクアブリッジ, 4384 m, Umihotaru - Kisarazu): no sourced height (raised near Umihotaru for a
#     2 000 GT ship channel) -> the generic sea-bridge rule of b4 is kept
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
B = [  # key, names (OSM bridge:name or name), level rule, upper cap, gap (lower = upper - gap), options
 dict(k='rainbow', names=set(), bbox=(250, -3000, 2600, -1700), lvl=lambda l: 'U' if l['c'] <= 1 else 'L', cap=61.5, gap=7.5, grade=0.045, base=26.0, noends=True, corr=0, cls=12, anyname=True, minlayer=2,
      exclude={'Shuto Expressway Route 1 Haneda Line', 'Shinagawa Pier Line', 'Aomi Daiba kurosuwōku'}, linkx=1500),
 dict(k='gate', names={'東京ゲートブリッジ', 'Tokyo Gate Bridge'}, bname=True, lvl=lambda l: 'U', cap=56.0, grade=0.04, corr=0, cls=12),
 dict(k='baybridge', names={'横浜ベイブリッジ', 'Yokohama Bay Bridge'}, bname=True, lvl=lambda l: 'U' if l['c'] <= 1 else 'L', cap=65.0, gap=8.0, grade=0.04, corr=900),
 dict(k='tsubasa', names={'鶴見つばさ橋', 'Tsurumi Tsubasa Bridge'}, bname=True, lvl=lambda l: 'U', cap=57.0, grade=0.05, corr=1800),
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
        if not S.get('anyname') and not (l['name'] in S['names'] or (S.get('bname') and l.get('bname') in S['names'])): return False
        if S.get('minlayer') and (l.get('layer') or 0) < S['minlayer'] and l.get('hmax', 0) < 12: return False
        if l['name'] in S.get('exclude', ()): return False
        if S.get('linkx') is not None and l['c'] == 1 and l['g'].centroid.x < S['linkx']: return False
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
        if base is not None and base != 'cap': z = max(z, base)
        if z < -1e8: z = cap
        return z if S.get('noends') else min(z, gA + grade*(t - tA), gB + grade*(tB - t))
    nE = 0; mx = collections.defaultdict(float)
    for i in sel:
        l = lines[i]; lv = S['lvl'](l); cap = S['cap'] - (S.get('gap', 0) if lv == 'L' else 0)
        cs = dens(list(l['g'].coords))
        E = [round(max(0.0, Pz(tOf(p), cap) - 0.18 - hC(*p)), 2) for p in cs]
        if not DRY: l['g'] = LineString(cs); elev[i] = E; l['br'] = True
        done[i] = S['k']; nE += 1; mx[lv] = max(mx[lv], max(E))
    report.append((S['k'], len(main), len(sel), [(round(a), round(b)) for a, b in runs], round(tB - tA), round(gA, 1), round(gB, 1), {k: round(v, 1) for k, v in mx.items()}))
    print('%-11s main %3d lines %3d  water %s  length %5d m  ends %.1f / %.1f  max E %s' % report[-1], flush=True)
# roads joining a raised end: ramp down at 5.5 % (only raises, never lowers what they had)
def lift(j, e, h0, hops, seen, GR=0.055):
    if hops > (12 if GR < 0.05 else 4) or j in seen or j in done or h0 < 0.3: return
    m = lines[j]
    if m['c'] in (13, 14): return
    if m['br'] and m.get('bkind') == 'fly' and elev.get(j) is not None and max(elev[j]) > 0.5: return      # (Tokyo: a stacked Shuto viaduct keeps its own level)
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
