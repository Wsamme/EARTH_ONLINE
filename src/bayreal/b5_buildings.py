# stage 5 (Bay Area): OSM buildings and building parts -> typed, height-estimated footprints (metres)
import sys, collections, hashlib, re; sys.path.insert(0, '.')
from common import *
import shapely.wkb
from shapely.geometry import Polygon
from shapely.strtree import STRtree
from shapely.prepared import prep
BLD = pickle.load(open(OUT + 'raw_bld.pkl', 'rb'))
AREAS = pickle.load(open(OUT + 'raw_areas.pkl', 'rb'))
lu = np.load(OUT + 'lu.npy'); land12 = np.load(OUT + 'land12.npy')
sf = None
for oid, fw, t, wk in AREAS:
    if t.get('boundary') == 'administrative' and t.get('admin_level') in ('6', '8') and t.get('name') == 'San Francisco': sf = proj(shapely.wkb.loads(wk)).buffer(0)
print('SF polygon', None if sf is None else round(sf.area/1e6, 1))
sfp = prep(sf) if sf is not None else None
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
WALLS = {0:[(226,220,210),(214,210,202),(232,226,214)], 2:[(232,228,216),(214,222,226),(236,214,190),(218,228,212),(240,226,200),(226,206,210),(208,214,224),(244,240,232),(228,224,214)],
    3:[(236,230,218),(222,214,198),(214,206,190),(200,206,210),(232,222,200),(240,236,226),(190,196,188),(226,212,190)], 4:[(226,220,208),(210,206,198),(196,190,182),(232,224,212)],
    5:[(182,194,204),(200,206,210),(168,180,190),(214,214,210)], 6:[(214,212,206),(196,198,196),(226,222,214)], 7:[(222,212,196),(206,196,180),(230,222,208)], 8:[(232,226,214),(218,206,186)],
    9:[(234,232,226),(222,226,230)], 10:[(210,212,214),(226,226,222)], 11:[(200,200,196),(214,212,206)], 12:[(226,218,206),(212,214,216)], 13:[(180,170,156),(160,150,140),(200,196,190)], 15:[(226,226,222)]}
def roof_of(t, r, x, y):
    if t == 3:
        south = y < -12000                                   # Peninsula / South Bay: more Spanish tile
        return 2 if r < (0.38 if south else 0.16) else 6 if r > 0.9 else 1
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
        if tp is None:            # building=yes: from the land use and the size
            if lcls == 1 or (lcls == 0 and A < 260 and h is not None and h < 12): tp = 3 if (A < 420 and not insf) or (insf and A < 140) else 2
            elif lcls == 2: tp = 4
            elif lcls == 3: tp = 6
            elif lcls == 6: tp = 7
            elif lcls == 7: tp = 10 if A > 2000 else 6
            elif A < 45: tp = 13
            elif insf: tp = 2 if (h or 0) < 30 else 5
            else: tp = 3 if A < 300 else 0
        if insf and tp == 3 and (h or 9) >= 7.5: tp = 2                 # San Francisco: flat-roofed row houses and flats
        if h is None: h = estimate(tp, A, r, insf, lcls); nh['est'] += 1
        h = max(2.4, min(h, 330.0))
        wall = WALLS.get(tp, WALLS[0])[int(r*997) % len(WALLS.get(tp, WALLS[0]))]
        if insf and tp in (2, 3): wall = WALLS[2][int(r*991) % len(WALLS[2])]
        fh = 3.0 if tp in (2, 3) else 4.0 if tp in (5, 12) else 5.0 if tp in (6, 10) else 3.8
        out.append({'id':bid, 'g':q, 'h':round(h, 1), 'base':round(base, 1), 't':tp, 'wall':wall, 'roof':roof_of(tp, r, c.x, c.y), 'rc':None, 'fh':fh, 'foreign':False,
                    'name':t.get('name'), 'zh':t.get('name:zh'), 'fl':fl, 'explicit':bv in ('house', 'detached', 'semidetached_house', 'bungalow'), 'hdb':None, 'parts':False})
        tc[tp] += 1
print('buildings', len(out), dict(nh), 'types', sorted(tc.items()))
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
