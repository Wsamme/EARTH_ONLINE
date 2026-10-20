# stage 4 (New York): roads, paths, runways, rail from OSM ways: merged polylines with classes, widths and bridge heights
# (the big bridges get their real deck profiles in b4b_nycdecks.py)
import sys; sys.path.insert(0, '.')
from common import *
import collections
from shapely.geometry import LineString, MultiLineString, Point
from shapely.ops import linemerge, unary_union
from shapely.strtree import STRtree
WAYS = pickle.load(open(OUT + 'raw_ways.pkl', 'rb')); ROUTES = pickle.load(open(OUT + 'raw_routes.pkl', 'rb'))
L = load('land.pkl'); F = load('fresh.pkl')
HW = {'motorway':0, 'motorway_link':1, 'trunk':2, 'trunk_link':3, 'primary':4, 'primary_link':5, 'secondary':6, 'secondary_link':7, 'tertiary':8, 'tertiary_link':9,
      'residential':10, 'unclassified':10, 'living_street':10, 'road':10, 'residential_link':10, 'service':11, 'busway':11,
      'footway':12, 'cycleway':12, 'path':12, 'pedestrian':12, 'track':12, 'steps':12, 'bridleway':12, 'raceway':18}
WID = {0:(26, 13), 1:(6.5, 6.5), 2:(20, 11), 3:(6.5, 6.5), 4:(15, 10), 5:(6, 6), 6:(12, 8), 7:(5.5, 5.5), 8:(9.5, 7), 9:(5, 5), 10:(7, 5.5), 11:(4.5, 4), 12:(2.5, 2.5), 13:(60, 60), 14:(23, 23), 15:(4, 4), 16:(3, 3), 17:(4, 4), 18:(12, 12)}
# ways that belong to transit routes are drawn by the transit layer, not as plain rail
# (only the systems the transit layer draws: subway, PATH, LIRR, Metro-North, NJ Transit, SIR, AirTrain, light rail; Amtrak-only
# track such as the Hell Gate Bridge line stays plain rail)
from nyc_lines import select as _sel
transit_ways = set()
_RT = {r[0]: r for r in ROUTES}
for Ld in _sel(ROUTES):
    for rid in Ld['rids']:
        for typ, ref, role in _RT[rid][2]:
            if typ == 'w' and role in ('', 'forward', 'backward'): transit_ways.add(ref)
print('transit ways', len(transit_ways))
groups = collections.defaultdict(list); skipped = collections.Counter()
for wid, t, cs in WAYS:
    hw = t.get('highway'); rw = t.get('railway'); aw = t.get('aeroway'); mm = t.get('man_made')
    if hw in HW: c = HW[hw]; kd = hw
    elif aw == 'runway': c = 13; kd = 'runway'
    elif aw == 'taxiway': c = 14; kd = 'taxiway'
    elif rw in ('rail', 'narrow_gauge') and wid not in transit_ways and t.get('service') not in ('yard', 'spur', 'siding') : c = 15; kd = 'rail'
    elif rw == 'monorail': c = 16; kd = 'monorail'
    elif mm == 'pier': c = 17; kd = 'pier'
    else: skipped[hw or rw or aw or mm] += 1; continue
    if t.get('tunnel') in ('yes', 'building_passage', 'culvert') or t.get('covered') == 'yes' and c >= 11: skipped['tunnel'] += 1; continue
    try: layer = int(t.get('layer', '0').split(';')[0])
    except ValueError: layer = 0
    if layer < 0: skipped['under'] += 1; continue
    if c == 11 and t.get('service') in ('parking_aisle',) and t.get('bridge') != 'yes': kd = 'aisle'
    name = t.get('name'); zh = t.get('name:zh') or t.get('name:zh-Hans')
    br = t.get('bridge') not in (None, 'no')
    ow = t.get('oneway') in ('yes', '1', '-1') or (c in (0, 1) and t.get('oneway') != 'no') or t.get('junction') == 'roundabout'
    if t.get('oneway') == '-1': cs = cs[::-1]
    key = (c, kd, name, zh, t.get('ref'), br, ow, layer if br else 0, t.get('bridge:name') if br else None)
    groups[key].append(LineString([w(*q) for q in cs]))
print('skipped', skipped.most_common(12))
def tmerge(parts, tol=1.2):
    # merge pieces whose ends meet within tol metres (tile clipping leaves sub-metre gaps)
    P = [list(p.coords) for p in parts if len(p.coords) >= 2]
    key = lambda q: (int(math.floor(q[0]/tol)), int(math.floor(q[1]/tol)))
    idx = collections.defaultdict(list)
    for i, c in enumerate(P):
        for e, q in ((0, c[0]), (1, c[-1])): idx[key(q)].append((i, e))
    def near(q):
        k = key(q); out = []
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for (i, e) in idx.get((k[0] + dx, k[1] + dy), []):
                    r = P[i][0] if e == 0 else P[i][-1]
                    if abs(r[0] - q[0]) <= tol and abs(r[1] - q[1]) <= tol: out.append((i, e))
        return out
    used = [False]*len(P); out = []
    def extend(chain, i, e):
        # walk from piece i's end e onwards while the node has exactly one other unused piece
        while True:
            q = P[i][-1] if e == 1 else P[i][0]
            nb = [(j, f) for (j, f) in near(q) if j != i]
            if len(nb) != 1 or used[nb[0][0]]: return chain
            j, f = nb[0]; used[j] = True
            seg = P[j] if f == 0 else P[j][::-1]
            chain.extend(seg[1:]); i, e = j, (1 if f == 0 else 0)
    for i in range(len(P)):
        if used[i]: continue
        used[i] = True
        fwd = extend(list(P[i]), i, 1)
        back = extend(list(P[i][::-1]), i, 0)
        chain = back[::-1][:-len(P[i])] + fwd if len(back) > len(P[i]) else fwd
        out.append(LineString(chain))
    return out
lines = []
for key, parts in groups.items():
    for ln in tmerge(parts):
        if ln.length < 2: continue
        tol = 0.6 if key[0] <= 11 or key[0] in (13, 14) else 1.2
        ln = ln.simplify(tol)
        lines.append({'c':key[0], 'kd':key[1], 'name':key[2], 'zh':key[3], 'ref':key[4], 'br':key[5], 'ow':key[6], 'layer':key[7], 'bname':key[8], 'g':ln})
print('lines', len(lines), collections.Counter(l['c'] for l in lines))
# ---------- flyover heights ----------
road_idx = [i for i, l in enumerate(lines) if l['c'] <= 18]
tree = STRtree([l['g'] for l in lines])
sea_land = L['sg']                                   # land; water = not land
fresh = unary_union(F['sig'])
PRI = lambda l: (0 if l['c'] in (0, 2) else 1 if l['c'] in (4, 6, 8, 10, 15, 13, 14) else 2 if l['c'] in (1, 3, 5, 7, 9, 11, 18) else 3)   # 0 main carriageways stay lowest
bridges = [i for i, l in enumerate(lines) if l['br']]
cross = collections.defaultdict(set)   # bridge -> crossed lines
for i in bridges:
    g = lines[i]['g']
    for j in tree.query(g):
        j = int(j)
        if j == i: continue
        h = lines[j]['g']
        if not g.crosses(h): continue
        x = g.intersection(h)
        pts = [x] if x.geom_type == 'Point' else [q for q in getattr(x, 'geoms', []) if q.geom_type == 'Point']
        # ignore touches at the ends of either line
        ok = [q for q in pts if g.project(q) > 3 and g.project(q) < g.length - 3]
        if ok: cross[i].add(j)
level = {i: lines[i]['layer'] for i in bridges}
for it in range(6):
    ch = 0
    for i in bridges:
        lv = max(lines[i]['layer'], 1 if any((not lines[j]['br']) and lines[j]['c'] != 12 for j in cross[i]) else 0)
        for j in cross[i]:
            if lines[j]['br'] and (PRI(lines[j]), -lines[j]['g'].length) < (PRI(lines[i]), -lines[i]['g'].length):
                lv = max(lv, level[j] + 1)
        if any(lines[j]['c'] == 12 for j in cross[i]) and lv == 0 and lines[i]['c'] <= 11: lv = 0
        if lv != level[i]: level[i] = lv; ch += 1
    if not ch: break
# bridges over water: rise with the span over water
water_any = None
# (New York: the coastline is very detailed; sample the line every 4 m against the prepared land / fresh water instead of
# cutting it with the whole multipolygon)
import shapely
LANDP = sea_land.buffer(0.5); shapely.prepare(LANDP); shapely.prepare(fresh)
def over_water(g):
    L = g.length; n = max(3, int(L/4) + 1)
    P = shapely.get_coordinates(shapely.line_interpolate_point(g, np.linspace(0, L, n)))
    land = shapely.contains_xy(LANDP, P[:, 0], P[:, 1]); fr = shapely.contains_xy(fresh, P[:, 0], P[:, 1])
    return float((~land).mean())*L, float(fr.mean())*L
H_LEVEL = 6.6
# road surface at mid-span (m above the water); refined by b4b_nycdecks.py
BIG = {'George Washington Bridge':67.0, 'Verrazzano-Narrows Bridge':71.0, 'Verrazzano–Narrows Bridge':71.0, 'Verrazano-Narrows Bridge':71.0, 'Queensboro Bridge':41.5, 'Ed Koch Queensboro Bridge':41.5,
       'Brooklyn Bridge':41.0, 'Manhattan Bridge':43.0, 'Williamsburg Bridge':43.0, 'Robert F. Kennedy Bridge':46.0, 'Triborough Bridge':46.0, 'Bronx–Whitestone Bridge':45.0, 'Bronx-Whitestone Bridge':45.0,
       'Throgs Neck Bridge':46.0, 'Bayonne Bridge':68.0, 'Goethals Bridge':45.5, 'Outerbridge Crossing':46.0, 'Pulaski Skyway':44.0, 'Kosciuszko Bridge':40.0}
wls = [g2 for p2, gg in L['wlines'] for g2 in (gg.geoms if hasattr(gg, 'geoms') else [gg])]
wtree = STRtree(wls)
def wtree_q(g): return [wls[int(k)] for k in wtree.query(g)]
nf = collections.Counter()
for i in bridges:
    l = lines[i]; g = l['g']
    sea_len, fresh_len = over_water(g)
    if level[i] > 0:
        h = H_LEVEL*level[i] + (0.6 if l['c'] in (0, 2) else 0)
        kind = 'fly'
    elif sea_len > 40:
        cap = BIG.get(l['name'], 26.0)
        h = min(cap, 3.0 + sea_len*0.03) if cap <= 26 else cap; kind = 'sea'
    elif fresh_len > 25:
        h = min(9.0, 1.5 + fresh_len*0.05); kind = 'river'
    elif g.length > 220 and l['c'] <= 11:
        h = 6.0; kind = 'viaduct'
    elif l['c'] == 12 and g.length > 18 and not any(wl.crosses(g) for wl in wtree_q(g)):
        h = 5.6; kind = 'footbridge'        # overhead pedestrian bridges
    else:
        h = 0.0; kind = 'flat'
    l['hmax'] = h; l['bkind'] = kind; nf[kind] += 1
print('bridge kinds', nf, 'levels', collections.Counter(level.values()))
# per-vertex elevation: bridges have their own profile; elevated ends lift the connected approach roads (ramps)
GR = 0.055
ends = collections.defaultdict(list)   # endpoint key -> [(line index, which end)]
def qk(p): return (round(p[0]/1.5), round(p[1]/1.5))
def ends_at(p):
    k = qk(p); out = []
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1): out += ends.get((k[0] + dx, k[1] + dy), [])
    return out
for i, l in enumerate(lines):
    if l['c'] > 12 and l['c'] != 17: continue
    cs = list(l['g'].coords); ends[qk(cs[0])].append((i, 0)); ends[qk(cs[-1])].append((i, 1))
def arc(cs):
    d = [0.0]
    for a, b in zip(cs, cs[1:]): d.append(d[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    return d
contrib = collections.defaultdict(list)     # line -> [(kind, ...)]
for i in bridges:
    l = lines[i]
    if l['hmax'] <= 0.5: continue
    contrib[i].append(('own',))
def lift(j, e, h0, hops, seen):
    # approach line j, its end e touches an elevated end at height h0: ramp down along j
    if hops > 3 or j in seen or h0 < 0.3: return
    m = lines[j]
    if m['br'] and m.get('hmax', 0) > 0.5: return
    contrib[j].append(('ramp', e, h0))
    Lj = m['g'].length; rl = h0/GR
    if Lj < rl:   # ramp continues past the far end
        cs = list(m['g'].coords); far = cs[-1] if e == 0 else cs[0]; rest = h0*(1 - Lj/rl)
        for (k, f) in ends_at(far):
            if k != j and lines[k]['c'] <= 12 and lines[k]['c'] != 12 or (k != j and m['c'] == 12 and lines[k]['c'] == 12):
                lift(k, f, rest, hops + 1, seen | {j})
own_prof = {}
for i in list(contrib):
    l = lines[i]; cs = list(l['g'].coords); d = arc(cs); Lt = d[-1]; hm = l['hmax']
    conn = []
    for e, p in ((0, cs[0]), (1, cs[-1])):
        others = [(j, f) for (j, f) in ends_at(p) if j != i]
        nb_br = any(lines[j]['br'] and lines[j].get('hmax', 0) > 0.5 for j, f in others)
        appr = [(j, f) for (j, f) in others if not (lines[j]['br'] and lines[j].get('hmax', 0) > 0.5) and (lines[j]['c'] != 12 or l['c'] == 12) and lines[j]['c'] not in (13, 14, 15, 16)]
        conn.append((nb_br, appr))
    if l['bkind'] in ('river', 'sea', 'viaduct'):
        k = 2.2 if l['bkind'] == 'river' else 1.2
        own_prof[i] = lambda s, hm=hm, Lt=Lt, k=k: min(hm, 0.6 + min(s, Lt - s)*GR*k)
        continue
    ramp0 = not conn[0][0] and not conn[0][1]; ramp1 = not conn[1][0] and not conn[1][1]
    own_prof[i] = lambda s, hm=hm, Lt=Lt, r0=ramp0, r1=ramp1: min(hm, 0.4 + s*GR*1.6 if r0 else 1e9, 0.4 + (Lt - s)*GR*1.6 if r1 else 1e9)
    for e in (0, 1):
        h0 = own_prof[i](0 if e == 0 else Lt)
        for (j, f) in conn[e][1]: lift(j, f, h0, 0, {i})
elev = {}
for j, cl in contrib.items():
    m = lines[j]; cs = list(m['g'].coords); d = arc(cs); Lt = d[-1]
    # breakpoints where ramps end
    br = set()
    for c in cl:
        if c[0] == 'ramp':
            rl = c[2]/GR
            if rl < Lt: br.add(rl if c[1] == 0 else Lt - rl)
    # insert breakpoints and densify elevated parts to 25 m
    P = [cs[0]]; S = [0.0]
    for k in range(1, len(cs)):
        a, b, s0, s1 = cs[k-1], cs[k], d[k-1], d[k]
        cuts = sorted([x for x in br if s0 + 0.5 < x < s1 - 0.5])
        step = max(1, int(math.ceil((s1 - s0)/25)))
        cuts = sorted(set(cuts + [s0 + (s1 - s0)*t/step for t in range(1, step)]))
        for x in cuts:
            f = (x - s0)/(s1 - s0); P.append((a[0] + (b[0] - a[0])*f, a[1] + (b[1] - a[1])*f)); S.append(x)
        P.append(b); S.append(s1)
    hs = []
    for s in S:
        h = 0.0
        for c in cl:
            if c[0] == 'own': h = max(h, own_prof[j](s))
            else:
                e, h0 = c[1], c[2]; rl = h0/GR; t = s if e == 0 else Lt - s
                if t < rl: h = max(h, h0*(1 - t/rl))
        hs.append(round(h, 2))
    m['g'] = LineString(P); elev[j] = hs
print('elevated lines', len(elev), 'ramps', sum(1 for cl in contrib.values() for c in cl if c[0] == 'ramp'))
# ---------- the big bay bridges: a deck at their real clearance, ramping from the ground at each end ----------
TH = load('terrain.pkl')['H']
def hC(x, y):
    fx = min(TN - 1.0001, max(0, (x + HALF)/TS)); fy = min(TN - 1.0001, max(0, (y + HALF)/TS)); i, j = int(fx), int(fy); u, v = fx - i, fy - j
    h = (TH[j, i]*(1 - u) + TH[j, i + 1]*u)*(1 - v) + (TH[j + 1, i]*(1 - u) + TH[j + 1, i + 1]*u)*v
    return max(-0.3, float(h))
def bigcap(l):
    nm = (l['name'] or '')
    return BIG.get(nm) or BIG.get(nm.replace('–', '-'))
nb = 0
for i, l in enumerate(lines):
    if not l['br'] or l['c'] > 11: continue
    cap = bigcap(l)
    if cap is None: continue
    cs = list(l['g'].coords); P = [cs[0]]
    for a, b in zip(cs, cs[1:]):
        d = math.hypot(b[0] - a[0], b[1] - a[1]); n = max(1, int(math.ceil(d/25)))
        for k in range(1, n + 1): P.append((a[0] + (b[0] - a[0])*k/n, a[1] + (b[1] - a[1])*k/n))
    S = [0.0]
    for a, b in zip(P, P[1:]): S.append(S[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    Lt = S[-1]; g = [hC(*p) for p in P]; g0, g1 = g[0] + 0.6, g[-1] + 0.6
    E = []
    for s_, gg in zip(S, g):
        rp = 0.12 if cap > 40 else 0.05
        D = min(cap, g0 + s_*rp, g1 + (Lt - s_)*rp)
        E.append(round(max(0.0, D - gg), 2))
    l['g'] = LineString(P); elev[i] = E; nb += 1
print('big bay bridge lines', nb)
nv = collections.Counter(); ln = collections.Counter()
for l in lines: nv[l['c']] += len(l['g'].coords); ln[l['c']] += l['g'].length
print('vertices', sum(nv.values()), dict(nv)); print('km', {k: round(v/1000) for k, v in ln.items()})
save({'lines':lines, 'elev':elev}, 'roads.pkl')
