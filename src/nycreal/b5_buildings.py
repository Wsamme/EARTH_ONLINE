# stage 5 (New York): OSM buildings and building parts -> typed, height-estimated footprints (metres). Most New York City
# buildings carry the city's measured heights (building import); skyscrapers have building:parts with min_height.
import sys, collections, hashlib, re; sys.path.insert(0, '.')
from common import *
import shapely.wkb
from shapely.geometry import Polygon
from shapely.strtree import STRtree
from shapely.prepared import prep
BLD = pickle.load(open(OUT + 'raw_bld.pkl', 'rb'))
AREAS = pickle.load(open(OUT + 'raw_areas.pkl', 'rb'))
lu = np.load(OUT + 'lu.npy'); land12 = np.load(OUT + 'land12.npy')
# the dense core: New York City, Hudson County (Jersey City, Hoboken ...) and Newark - row houses, walk-ups, flat roofs
core = []; nyc = None
for oid, fw, t, wk in AREAS:
    if t.get('boundary') != 'administrative': continue
    nm = t.get('name'); al = t.get('admin_level')
    if nm in ('City of New York', 'New York City', 'New York') and al == '5': nyc = proj(shapely.wkb.loads(wk)).buffer(0); core.append(nyc)
    elif nm == 'Hudson County' and al == '6': core.append(proj(shapely.wkb.loads(wk)).buffer(0))
    elif nm in ('Newark', 'Yonkers', 'Elizabeth', 'Bayonne') and al == '8': core.append(proj(shapely.wkb.loads(wk)).buffer(0))
from shapely.ops import unary_union
sf = unary_union(core) if core else None
print('core polygon km2', None if sf is None else round(sf.area/1e6, 1), 'nyc', nyc is not None)
sfp = prep(sf) if sf is not None else None
# Manhattan's business districts (Midtown, Downtown) and Downtown Brooklyn / Long Island City / Jersey City waterfront: towers are offices
from shapely.geometry import box as _box
CBD = [_box(*w(-74.0200, 40.7000), *w(-73.9990, 40.7160)), _box(*w(-74.0050, 40.7420), *w(-73.9640, 40.7660)), _box(*w(-73.9950, 40.6880), *w(-73.9800, 40.6960)),
       _box(*w(-73.9450, 40.7420), *w(-73.9330, 40.7520)), _box(*w(-74.0440, 40.7140), *w(-74.0300, 40.7300))]
inCBD = lambda x, y: any(b.contains(Point(x, y)) for b in CBD)
from shapely.geometry import Point
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
# New York: red / brown / buff brick, brownstone, limestone and white brick (apartments, row houses); siding and brick (houses)
WALLS = {0:[(220,212,200),(206,200,192),(226,218,206)], 2:[(176,104,82),(152,96,78),(196,128,96),(214,196,168),(228,218,196),(132,90,74),(204,170,140),(186,112,88),(226,224,216),(168,140,118),(206,190,166)],
    3:[(232,228,218),(214,206,190),(200,204,206),(176,110,88),(226,216,196),(196,186,170),(214,218,214),(160,104,86)], 4:[(222,214,200),(206,198,186),(190,178,166),(228,220,206)],
    5:[(182,194,204),(200,206,210),(168,180,190),(214,214,210)], 6:[(214,212,206),(196,198,196),(226,222,214)], 7:[(222,212,196),(206,196,180),(230,222,208)], 8:[(232,226,214),(218,206,186)],
    9:[(234,232,226),(222,226,230)], 10:[(210,212,214),(226,226,222)], 11:[(200,200,196),(214,212,206)], 12:[(226,218,206),(212,214,216)], 13:[(180,170,156),(160,150,140),(200,196,190)], 15:[(226,226,222)]}
def roof_of(t, r, x, y):
    if t == 3: return 1 if r < 0.5 else 6 if r < 0.78 else 0 if r < 0.92 else 2       # asphalt shingle greys and browns
    if t in (2,): return 1 if r < 0.55 else 0
    if t in (13,): return 1 if r < 0.6 else 3
    return 5 if r < 0.35 else 0
def lu_at(x, y):
    i = min(N - 1, max(0, int((x + HALF)/CELL))); j = min(N - 1, max(0, int((y + HALF)/CELL)))
    return int(lu[j, i])
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
    if t.get('location') == 'underground' or t.get('building') in ('no', 'proposed', 'demolished', 'construction' if t.get('height') is None else '_'): continue
    try: g = proj(shapely.wkb.loads(wk)).buffer(0)
    except Exception: continue
    for q in (g.geoms if hasattr(g, 'geoms') else [g]):
        if q.geom_type != 'Polygon' or q.area < 12: continue
        q = q.simplify(0.3, preserve_topology=True)
        if q.is_empty or q.geom_type != 'Polygon' or q.area < 10: continue
        bid = '%s%d' % ('w' if fway else 'r', oid); r = hsh(bid); A = q.area; c = q.representative_point()
        bv = t.get('building', 'yes'); insf = bool(sfp and sfp.contains(c)); lcls = lu_at(c.x, c.y)
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
        elif lv: fl = int(lv); h = lv*3.2 + (num(t.get('roof:levels')) or 0)*2.5 + (1.0 if lv > 2 else 0.6); nh['levels'] += 1
        if base == 0 and t.get('building:min_level'): base = (num(t.get('building:min_level')) or 0)*3.2
        if tp is None and insf and h is not None:          # New York core, measured heights: houses / row houses, apartments, offices
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
        h = max(2.4, min(h, 545.0))
        wall = WALLS.get(tp, WALLS[0])[int(r*997) % len(WALLS.get(tp, WALLS[0]))]
        fh = 3.0 if tp in (2, 3) else 4.0 if tp in (5, 12) else 5.0 if tp in (6, 10) else 3.8
        out.append({'id':bid, 'g':q, 'h':round(h, 1), 'base':round(base, 1), 't':tp, 'wall':wall, 'roof':roof_of(tp, r, c.x, c.y), 'rc':None, 'fh':fh, 'foreign':False,
                    'name':t.get('name'), 'zh':t.get('name:zh'), 'fl':fl, 'explicit':bv in ('house', 'detached', 'semidetached_house', 'bungalow'), 'hdb':None, 'parts':False})
        tc[tp] += 1
print('buildings', len(out), dict(nh), 'types', sorted(tc.items()), flush=True)
# attached rows (Brooklyn brownstones, Queens row houses, Jersey City walk-ups): houses sharing walls with two neighbours (or one,
# when they are 3+ storeys) have flat roofs -> type 2 (the engine gives type 3 pitched roofs)
import numpy as _np
hs = [k for k, b in enumerate(out) if b['t'] == 3]
geo = _np.array([b['g'] for b in out], dtype=object)
trA = STRtree(geo)
import shapely as _shp
qi, qj = trA.query(_shp.buffer(_np.array([out[k]['g'] for k in hs], dtype=object), 0.45, quad_segs=2), predicate='intersects')
nbc = collections.Counter()
for a, b in zip(qi, qj):
    if hs[a] != b: nbc[hs[a]] += 1
nrow = 0
for k in hs:
    n = nbc.get(k, 0); b = out[k]
    if n >= 2 or (n == 1 and b['h'] >= 9.5):
        b['t'] = 2; b['roof'] = roof_of(2, hsh(b['id'], 3), 0, 0); nrow += 1
        if b['wall'] in WALLS[3]: b['wall'] = WALLS[2][int(hsh(b['id'], 5)*991) % len(WALLS[2])]
print('attached houses -> row houses (flat roofs)', nrow, 'of', len(hs), flush=True)
del geo, trA, qi, qj
# building parts -> their building (smallest outline that contains the part's centroid)
tree = STRtree([b['g'] for b in out])
pp = []
for t, wk in parts_raw:
    try: g = proj(shapely.wkb.loads(wk)).buffer(0)
    except Exception: continue
    h = num(t.get('height')); lv = num(t.get('building:levels'))
    if h is None and lv: h = lv*3.2 + 0.6
    if h is None: continue
    base = num(t.get('min_height'))
    if base is None: base = (num(t.get('building:min_level')) or 0)*3.2
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
