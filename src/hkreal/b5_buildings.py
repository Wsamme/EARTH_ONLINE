# stage 5 (Hong Kong): OSM buildings and building parts -> typed, height-estimated footprints (metres). About 45 % of the
# buildings carry building:levels (some a height); the others get a height drawn from the measured distribution of the tagged
# buildings of the same kind and size class (Hong Kong / Shenzhen separately), so the estate towers stay towers.
# Shenzhen (foreign context): only buildings >= 40 m or >= 3000 m2 are kept (its skyline across the Shenzhen River and Bay).
import sys, collections, hashlib, re; sys.path.insert(0, '.')
from common import *
import shapely.wkb
from shapely.geometry import Polygon, Point, box as _box
from shapely.strtree import STRtree
from shapely.prepared import prep
from hk_names import names as _names
BLD = pickle.load(open(OUT + 'raw_bld.pkl', 'rb'))
lu = np.load(OUT + 'lu.npy'); L = load('land.pkl')
HKP = prep(L['hk'])
# the business districts: towers are offices (Central / Admiralty / Wan Chai north, Causeway Bay, Quarry Bay, Tsim Sha Tsui,
# West Kowloon, Kowloon East)
CBD = [_box(*w(114.150, 22.276), *w(114.186, 22.288)), _box(*w(114.180, 22.276), *w(114.192, 22.284)), _box(*w(114.208, 22.283), *w(114.219, 22.291)),
       _box(*w(114.165, 22.293), *w(114.178, 22.302)), _box(*w(114.155, 22.300), *w(114.166, 22.307)), _box(*w(114.205, 22.307), *w(114.231, 22.326))]
inCBD = lambda x, y: any(b.contains(Point(x, y)) for b in CBD)
def hsh(s, k=0): return int(hashlib.md5((str(s) + ':' + str(k)).encode()).hexdigest()[:8], 16)/0xffffffff
def num(v):
    if v is None: return None
    v = str(v).strip().lower().replace(',', '.')
    m = re.match(r'^([0-9.]+)\s*(m|meters?|ft|feet|\'|)?', v)
    if not m: return None
    try: x = float(m.group(1))
    except ValueError: return None
    if m.group(2) in ('ft', 'feet', "'"): x *= 0.3048
    return x
TYPEMAP = {'house':3, 'detached':3, 'semidetached_house':3, 'terrace':2, 'bungalow':3, 'static_caravan':13, 'mobile_home':13, 'houseboat':13, 'cabin':3, 'farm':3,
    'apartments':2, 'residential':2, 'dormitory':2, 'mixed_use':2, 'commercial':4, 'retail':4, 'supermarket':4, 'kiosk':13, 'office':5,
    'industrial':6, 'warehouse':6, 'manufacture':6, 'service':6, 'storage_tank':15, 'school':7, 'university':7, 'college':7, 'kindergarten':7, 'public':7, 'civic':7, 'government':7,
    'fire_station':7, 'police':7, 'library':7, 'museum':7, 'townhall':7, 'courthouse':7, 'church':8, 'cathedral':8, 'chapel':8, 'mosque':8, 'temple':8, 'synagogue':8, 'religious':8, 'shrine':8,
    'hospital':9, 'clinic':9, 'train_station':10, 'transportation':10, 'hangar':10, 'terminal':10, 'parking':11, 'hotel':12, 'motel':12,
    'garage':13, 'garages':13, 'carport':13, 'shed':13, 'roof':13, 'greenhouse':13, 'hut':13, 'barn':6, 'stable':13, 'grandstand':7, 'stadium':7, 'sports_centre':7, 'ruins':13, 'construction':0, 'annexe':0}
# Hong Kong: white, cream and pale tiled towers (estates in pastel), grey and blue-grey glass offices, white-washed village houses
WALLS = {0:[(222,218,208),(206,204,198),(230,226,216)], 2:[(236,234,226),(226,220,204),(214,210,200),(232,214,196),(206,214,222),(222,228,214),(238,226,206),(200,196,190),(228,210,210),(214,222,230),(240,238,232)],
    3:[(240,238,232),(232,226,212),(226,218,206),(236,230,220),(214,212,206),(232,222,214)], 4:[(222,214,200),(206,200,192),(190,186,180),(228,222,210)],
    5:[(150,166,178),(176,188,198),(132,148,160),(196,204,210),(168,178,180),(118,136,150)], 6:[(214,212,206),(196,198,196),(226,222,214)], 7:[(226,218,200),(212,204,186),(232,226,212)], 8:[(232,214,180),(214,190,160)],
    9:[(234,232,226),(222,226,230)], 10:[(210,212,214),(226,226,222)], 11:[(200,200,196),(214,212,206)], 12:[(214,208,196),(180,192,202),(226,222,214)], 13:[(180,176,166),(160,156,150),(200,196,190)], 14:[(212,210,204),(196,198,200),(180,188,196),(224,220,212)], 15:[(226,226,222)]}
def roof_of(t, r, x, y):
    if t == 3: return 2 if r < 0.4 else 0 if r < 0.75 else 1       # the few pitched roofs: terracotta, concrete, grey
    if t in (2,): return 1 if r < 0.55 else 0
    if t in (13,): return 1 if r < 0.6 else 3
    return 5 if r < 0.35 else 0
def lu_at(x, y):
    i = min(N - 1, max(0, int((x + HALF)/CELL))); j = min(N - 1, max(0, int((y + HALF)/CELL)))
    return int(lu[j, i])
def num(v):
    if v is None: return None
    v = str(v).strip().lower().replace(',', '.')
    m = re.match(r'^([0-9.]+)\s*(m|meters?|ft|feet|\'|)?', v)
    if not m: return None
    try: x = float(m.group(1))
    except ValueError: return None
    if m.group(2) in ('ft', 'feet', "'"): x *= 0.3048
    return x
FLH = 3.1      # storey height (m): Hong Kong towers ~2.9-3.15 m floor to floor
GRP = lambda b: b if b in ('house', 'apartments', 'yes', 'residential', 'commercial', 'industrial', 'school', 'office', 'retail', 'hotel') else 'other'
ABIN = lambda A: 0 if A < 60 else 1 if A < 150 else 2 if A < 400 else 3 if A < 1000 else 4 if A < 3000 else 5
EMP = collections.defaultdict(list); TAG = []      # TAG: the measured buildings (x, y, area, h) for the local context
for oid, fway, t, wk in BLD:
    if 'building:part' in t and 'building' not in t: continue
    h = num(t.get('height')); lv = num(t.get('building:levels'))
    if h is None and lv: h = lv*FLH + (1.0 if lv > 2 else 0.6)
    if not h or h < 2: continue
    try: g = shapely.wkb.loads(wk); A = proj(g).area; c = g.representative_point()
    except Exception: continue
    fo = not HKP.contains(Point(*w(c.x, c.y)))
    EMP[(GRP(t.get('building', 'yes')), ABIN(A), fo)].append(h); EMP[(GRP(t.get('building', 'yes')), ABIN(A))].append(h)
    TAG.append((*w(c.x, c.y), A, h))
EMP = {k: np.sort(np.array(v)) for k, v in EMP.items() if len(v) >= 30}
print('empirical height classes', len(EMP), flush=True)
# v37b: the estimate is local. A building without height / levels takes its height from the measured buildings of similar footprint
# (area within x2.5) within 500 m when there are >= 8 of them (5th-85th percentile, by the building's hash); else from the class
# distribution below, capped by the neighbourhood (90th percentile of its measured heights, at least 12 m; 15 m with none). Caps:
# footprint < 150 m2: 12 m; < 400 m2: 30 m (or the similar neighbours' 90th percentile when their median is above 30 m);
# rural / low density (< 60 buildings within 500 m), forest cells, parks: 15 m (12 m in forest); the aerodrome outside the
# measured terminals: 15 m; schools / hospitals land: 35 m.
from scipy.spatial import cKDTree
TAG = np.array(TAG); TTREE = cKDTree(TAG[:, :2])
ALLC = []
for oid, fway, t, wk in BLD:
    if 'building:part' in t and 'building' not in t: continue
    try: c = shapely.wkb.loads(wk).representative_point(); ALLC.append(w(c.x, c.y))
    except Exception: pass
ATREE = cKDTree(np.array(ALLC)); codes_ = np.load(OUT + 'codes.npy')
def code_at(x, y):
    i = min(N - 1, max(0, int((x + HALF)/CELL))); j = min(N - 1, max(0, int((y + HALF)/CELL))); return int(codes_[j, i])
CTXN = collections.Counter()
def ctxh(x, y, A, bv, fo, r):
    nb = TTREE.query_ball_point((x, y), 500); hs = TAG[nb, 3] if nb else np.zeros(0)
    sim = np.sort(np.array([TAG[k, 3] for k in nb if A/2.5 <= TAG[k, 2] <= A*2.5]))
    if len(sim) >= 8: h = float(sim[int((0.05 + 0.80*r)*(len(sim) - 1))]); CTXN['similar neighbours'] += 1
    else:
        h = emp(bv, A, fo, r)
        if h is None: return None
        cap = max(12.0, float(np.percentile(hs, 90))) if len(hs) >= 3 else 15.0
        if h > cap: h = cap; CTXN['neighbourhood cap'] += 1
        CTXN['class draw'] += 1
    caps = []
    if A < 150: caps.append(12.0)
    elif A < 400: caps.append(float(np.percentile(sim, 90)) if len(sim) >= 8 and np.median(sim) > 30 else 30.0)
    dense = len(ATREE.query_ball_point((x, y), 500))
    lc = lu_at(x, y); cd = code_at(x, y)
    if dense < 60: caps.append(15.0)
    if cd == 3: caps.append(12.0)
    if lc == 4: caps.append(15.0)
    if lc == 7: caps.append(15.0)
    if lc == 6: caps.append(35.0)
    if caps and h > min(caps): h = min(caps); CTXN['capped'] += 1
    return h
def emp(bv, A, fo, r):
    for k in ((GRP(bv), ABIN(A), fo), (GRP(bv), ABIN(A))):
        v = EMP.get(k)
        if v is not None: return float(v[int((0.05 + 0.9*r)*(len(v) - 1))])
    return None
def estimate(t, A, r, insf, lcls):
    if t == 3: return 6.0 + 2.8*r if A < 220 else 7.5 + 2.5*r
    if t == 13: return 2.6 + 1.2*r
    if t == 2: return (10 + 4*r) if A < 1500 else (14 + 8*r)
    if t == 4: return (5 + 3*r) if A < 2500 else (8 + 4*r)
    if t == 5: return (10 + 6*r) if A < 1500 else (14 + 12*r)
    if t == 6: return 8 + 4*r
    if t == 7: return 8 + 6*r
    if t == 8: return 10 + 6*r
    if t == 9: return 14 + 10*r
    if t == 10: return 10 + 6*r
    if t == 11: return 10 + 4*r
    if t == 12: return 14 + 12*r
    if t == 15: return 10 + 6*r
    return (6 + 3*r) if A < 400 else (9 + 4*r)
out = []; parts_raw = []; nh = collections.Counter(); tc = collections.Counter()
for oid, fway, t, wk in BLD:
    if 'building:part' in t and 'building' not in t:
        parts_raw.append((t, wk)); continue
    if t.get('location') == 'underground' or t.get('building') in ('no', 'proposed', 'demolished', 'construction' if t.get('height') is None and t.get('building:levels') is None else '_'): continue
    try: g = proj(shapely.wkb.loads(wk)).buffer(0)
    except Exception: continue
    for q in (g.geoms if hasattr(g, 'geoms') else [g]):
        if q.geom_type != 'Polygon' or q.area < 12: continue
        q = q.simplify(0.3, preserve_topology=True)
        if q.is_empty or q.geom_type != 'Polygon' or q.area < 10: continue
        bid = '%s%d' % ('w' if fway else 'r', oid); r = hsh(bid); A = q.area; c = q.representative_point()
        bv = t.get('building', 'yes'); fo = not HKP.contains(c); insf = not fo; lcls = lu_at(c.x, c.y)
        tp = TYPEMAP.get(bv)
        if t.get('amenity') in ('school', 'college', 'university', 'library', 'townhall', 'fire_station', 'police', 'courthouse'): tp = 7
        elif t.get('amenity') == 'place_of_worship': tp = 8
        elif t.get('amenity') == 'hospital': tp = 9
        elif t.get('amenity') == 'parking' or t.get('parking') == 'multi-storey': tp = 11
        elif t.get('tourism') in ('hotel', 'motel'): tp = 12
        elif t.get('man_made') == 'storage_tank': tp = 15
        elif tp is None and t.get('shop'): tp = 4
        elif tp is None and t.get('office'): tp = 5
        h = num(t.get('height')); fl = None; base = num(t.get('min_height')) or 0.0
        lv = num(t.get('building:levels'))
        if h is not None: nh['height'] += 1
        elif lv: fl = int(lv); h = lv*FLH + (num(t.get('roof:levels')) or 0)*2.5 + (1.0 if lv > 2 else 0.6); nh['levels'] += 1
        if base == 0 and t.get('building:min_level'): base = (num(t.get('building:min_level')) or 0)*FLH
        if h is None:
            h = ctxh(c.x, c.y, A, bv, fo, r)
            if h is not None: nh['empirical'] += 1
        if tp is None and h is not None:          # measured heights / levels: houses, apartments, offices
            if h < 11.5 and A < 300 and lcls in (0, 1): tp = 3
            elif lcls == 3: tp = 6
            elif lcls == 6: tp = 7
            elif lcls == 7: tp = 10 if A > 2000 else 6
            elif h >= 40 and (lcls == 2 or inCBD(c.x, c.y)): tp = 5
            elif lcls == 2: tp = 4 if h < 25 else 5
            elif A < 45: tp = 13
            else: tp = 2
        if tp is None:            # building=yes: from the land use and the size
            if lcls == 1 or (lcls == 0 and A < 260 and h is not None and h < 12): tp = 3 if (A < 420 and not insf) or (insf and A < 140) else 2
            elif lcls == 2: tp = 4
            elif lcls == 3: tp = 6
            elif lcls == 6: tp = 7
            elif lcls == 7: tp = 10 if A > 2000 else 6
            elif A < 45: tp = 13
            elif insf: tp = 2 if (h or 0) < 30 else 5
            else: tp = 3 if A < 300 else 0
        if h is None: h = estimate(tp, A, r, insf, lcls); nh['est'] += 1
        if fo:
            if h < 40 and A < 3000: nh['shenzhen dropped'] += 1; continue
            tp = 14
        h = max(2.4, min(h, 600.0))
        wall = WALLS.get(tp, WALLS[0])[int(r*997) % len(WALLS.get(tp, WALLS[0]))]
        fh = 3.0 if tp in (2, 3) else 4.0 if tp in (5, 12) else 5.0 if tp in (6, 10) else 3.8
        en_, zh_ = _names(t)
        out.append({'id':bid, 'g':q, 'h':round(h, 1), 'base':round(base, 1), 't':tp, 'wall':wall, 'roof':roof_of(tp, r, c.x, c.y), 'rc':None, 'fh':fh, 'foreign':fo,
                    'name':en_, 'zh':zh_, 'fl':fl, 'explicit':bv in ('house', 'detached', 'semidetached_house', 'bungalow'), 'explicit_pitch':bv in ('detached', 'semidetached_house', 'bungalow'), 'hdb':None, 'parts':False})
        tc[tp] += 1
print('context estimates', dict(CTXN)); print('buildings', len(out), dict(nh), 'types', sorted(tc.items()), flush=True)
# New Territories village houses (building=house: 3 storeys, 8.2 m under the Small House Policy, flat roofs with a parapet):
# flat-roofed type 2; detached / bungalow / semi-detached keep the engine's pitched roof (type 3)
nrow = 0
for b in out:
    if b['t'] == 3 and not b['explicit_pitch']:
        b['t'] = 2; b['roof'] = 0 if hsh(b['id'], 3) < 0.7 else 1; nrow += 1
print('village houses -> flat roofs', nrow, flush=True)
geo = trA = qi = qj = None
del geo, trA, qi, qj
# building parts -> their building (smallest outline that contains the part's centroid)
tree = STRtree([b['g'] for b in out])
pp = []
for t, wk in parts_raw:
    try: g = proj(shapely.wkb.loads(wk)).buffer(0)
    except Exception: continue
    h = num(t.get('height')); lv = num(t.get('building:levels'))
    if h is None and lv: h = lv*FLH + 0.6
    if h is None: continue
    base = num(t.get('min_height'))
    if base is None: base = (num(t.get('building:min_level')) or 0)*FLH
    for q in (g.geoms if hasattr(g, 'geoms') else [g]):
        if q.geom_type != 'Polygon' or q.area < 4 or h <= base + 0.5: continue
        c = q.representative_point(); best = None
        for k in tree.query(c):
            b = out[int(k)]
            if b['g'].contains(c) and (best is None or b['g'].area < best['g'].area): best = b
        if best is None: continue
        best['parts'] = True
        pp.append({'bid':best['id'], 'g':q.simplify(0.25), 'h':round(h, 1), 'base':round(base, 1), 'wall':None, 'rc':None})
have = set(p['bid'] for p in pp)
# a building with parts keeps its outline where no part covers it (podium) — handled at encode time; mark
print('parts', len(pp), 'buildings with parts', len(have))
save({'b':out, 'parts':pp, 'have_parts':have}, 'buildings.pkl')
