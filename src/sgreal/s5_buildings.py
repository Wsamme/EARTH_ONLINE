# stage 5: buildings: merge tile pieces, heights (HDB data, OSM floors, estimates), types, colours
import sys; sys.path.insert(0, '.')
from common import *
import collections, json as J, hashlib, re
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union
from shapely.prepared import prep
Bd = pickle.load(open(SGD + 'bld14.pkl', 'rb'))
L = load('land.pkl')
sgp = prep(L['sg'].buffer(60)); fop = prep(L['foreign'].buffer(60))
lu = np.load(OUT + 'lu25.npy')
def lu_at(x, y):
    i = min(N - 1, max(0, int((x + HALF)/CELL))); j = min(N - 1, max(0, int((y + HALF)/CELL))); return int(lu[j, i])
# HDB blocks keyed by OSM way id
hdb = {}
d = J.load(open(SGD + 'hdb3d-data-tree/hdb.json'))
for k, o in d['CityObjects'].items():
    a = o.get('attributes', {})
    m = re.match(r'way/(\d+)', a.get('osm_id', '') or k)
    if not m: continue
    def num(v, dflt=0):
        try: return float(v)
        except: return dflt
    hdb[m.group(1)] = {'h':num(a.get('height')), 'fl':int(num(a.get('hdb_max_floor_lvl'))), 'yr':int(num(a.get('hdb_year_completed'))), 'du':int(num(a.get('hdb_total_dwelling_units'))),
                       'com':a.get('hdb_commercial') == 'Y', 'mscp':a.get('hdb_multistorey_carpark') == 'Y', 'res':a.get('hdb_residential') == 'Y', 'mkt':a.get('hdb_market_hawker') == 'Y'}
del d
print('hdb blocks', len(hdb))
def osm_way(p):
    m = re.search(r'"record_id":"w(\d+)@', p.get('sources', '') or '')
    return m.group(1) if m else None
# merge pieces by id
pieces = collections.defaultdict(list); props = {}
for p, g in Bd['building']:
    pieces[p['id']].append(g); props[p['id']] = p
parts = collections.defaultdict(list)
for p, g in Bd['building_part']:
    parts[p['building_id']].append((p, g))
print('buildings', len(pieces), 'with parts', len(parts))
def merge(gs):
    if len(gs) == 1: return gs[0]
    u = unary_union([g.buffer(1e-6) for g in gs])
    return u
def polys(g):
    if g.geom_type == 'Polygon': return [g]
    if g.geom_type in ('MultiPolygon', 'GeometryCollection'): return [q for q in g.geoms if q.geom_type == 'Polygon']
    return []
def hsh(s, k=0): return int(hashlib.md5((s + str(k)).encode()).hexdigest()[:8], 16)/0xffffffff
def hexrgb(s):
    try:
        s = s.strip()
        if s.startswith('#') and len(s) == 7: return tuple(int(s[i:i+2], 16) for i in (1, 3, 5))
    except: pass
    return None
TYPES = {'hdb':1, 'condo':2, 'house':3, 'com':4, 'office':5, 'ind':6, 'civic':7, 'relig':8, 'hosp':9, 'trans':10, 'park':11, 'hotel':12, 'shed':13, 'foreign':14, 'tank':15}
HDB_WALL = [(238, 234, 222), (234, 228, 214), (241, 238, 230), (229, 226, 218), (240, 230, 214), (226, 232, 226), (232, 228, 236), (242, 236, 214)]
WALLS = {1:HDB_WALL, 2:[(236, 236, 232), (222, 226, 228), (214, 220, 224), (238, 232, 222), (205, 214, 220)], 3:[(242, 238, 228), (236, 228, 212), (244, 242, 236), (232, 222, 206)],
         4:[(232, 226, 216), (222, 218, 212), (236, 232, 226), (214, 210, 204)], 5:[(150, 172, 188), (132, 152, 168), (176, 190, 200), (196, 202, 206), (118, 140, 160), (164, 180, 186)],
         6:[(210, 212, 212), (196, 204, 210), (218, 216, 208), (188, 196, 200)], 7:[(230, 220, 202), (224, 214, 200), (236, 228, 214)], 8:[(238, 230, 210), (232, 220, 196)],
         9:[(236, 236, 232), (226, 230, 232)], 10:[(214, 220, 224), (200, 210, 216)], 11:[(206, 204, 198), (196, 194, 188)], 12:[(226, 222, 214), (160, 178, 190), (236, 230, 220)],
         13:[(186, 186, 180), (170, 176, 180)], 14:[(206, 204, 198), (196, 194, 190), (214, 210, 202)], 15:[(232, 232, 228)], 0:[(226, 222, 214), (216, 214, 208), (232, 228, 220)]}
ROOFS = {1:[0, 0, 5], 2:[0, 5, 1], 3:[2, 2, 7, 1, 6], 4:[0, 1], 5:[1, 0], 6:[3, 3, 0, 5], 7:[2, 0, 3], 8:[2, 7], 9:[0, 5], 10:[3, 5], 11:[1], 12:[0, 1], 13:[3, 1], 14:[0, 1, 3], 15:[5], 0:[0, 1, 3]}
def classify(p, A, x, y, has_h):
    c = p.get('class'); st = p.get('subtype'); luc = lu_at(x, y)
    if c in ('house', 'detached', 'semidetached_house', 'terrace', 'bungalow', 'villa', 'garage'): return 3
    if c in ('apartments', 'dormitory', 'residential') or st == 'residential':
        if c == 'residential' and A < 300 and not has_h: return 3
        return 2
    if c in ('office',): return 5
    if c in ('commercial', 'retail', 'supermarket', 'kiosk') or st == 'commercial': return 12 if c == 'hotel' else 4
    if c == 'hotel': return 12
    if c in ('industrial', 'warehouse', 'factory', 'manufacture') or st == 'industrial': return 6
    if c in ('school', 'university', 'college', 'kindergarten', 'public', 'civic', 'government', 'library', 'fire_station', 'police') or st in ('civic', 'education'): return 7
    if c in ('temple', 'church', 'mosque', 'shrine', 'cathedral', 'chapel') or st == 'religious': return 8
    if c in ('hospital',) or st == 'medical': return 9
    if c in ('train_station', 'hangar', 'transportation') or st == 'transportation': return 11 if c == 'parking' else 10
    if c in ('parking',): return 11
    if c in ('roof', 'shed', 'hut', 'carport') or st == 'outbuilding': return 13
    if c in ('storage_tank',): return 15
    # by land use
    if luc == 1: return 3 if A < 320 else 2
    if luc == 2: return 4
    if luc == 3: return 6
    if luc == 6: return 7
    if luc == 7: return 10 if A > 2000 else 6
    return 0
def estimate(t, A, x, y, r):
    # metres; r in 0..1 per building
    if t == 3: return 7.5 + 3.5*r
    if t == 13: return 3.5 + 1.5*r
    if t == 15: return 12 + 10*r
    if A < 40: return 3.2 + 1.5*r
    if A < 120: return 5 + 4*r
    if t == 2: return 18 + 34*r if A > 300 else 9 + 6*r
    if t == 1: return 36 + 12*r
    if t == 6: return (9 + 6*r) if A < 2500 else (14 + 14*r)
    if t == 4: return 10 + 12*r
    if t == 5: return 24 + 30*r
    if t == 7: return 14 + 6*r
    if t == 9: return 18 + 14*r
    if t == 10: return 12 + 8*r
    if t == 11: return 14 + 6*r
    if t == 12: return 30 + 30*r
    if t == 8: return 10 + 6*r
    return (6 + 5*r) if A < 400 else (10 + 8*r)
out = []
nh = collections.Counter(); skipped = collections.Counter()
for bid, gs in pieces.items():
    p = props[bid]
    if p.get('is_underground'): skipped['ug'] += 1; continue
    g = merge(gs)
    gp = proj(g)
    for poly in polys(gp):
        poly = poly.buffer(0)
        if poly.is_empty: continue
        for q in polys(poly):
            A = q.area; c = q.representative_point()
            src = p.get('@geometry_source')
            ins = sgp.contains(c)
            if not ins:
                if fop.contains(c) or not ins:
                    if A < 500: skipped['foreign small'] += 1; continue
                    foreign = True
            else: foreign = False
            if src != 'OpenStreetMap' and A < 60: skipped['ml small'] += 1; continue
            if A < 15: skipped['tiny'] += 1; continue
            q = q.simplify(0.35, preserve_topology=True)
            if q.is_empty or q.geom_type != 'Polygon' or q.area < 10: continue
            r = hsh(bid)
            way = osm_way(p) if src == 'OpenStreetMap' else None
            H = hdb.get(way) if way else None
            h = None; base = 0.0; fl = None
            if p.get('height') is not None: h = float(p['height']); nh['height'] += 1
            if H and H['h'] > 0:
                h = H['h']; fl = H['fl']; nh['hdb'] += 1
            elif p.get('num_floors') is not None and h is None:
                fl = int(p['num_floors']); h = fl*3.3 + (1.2 if fl > 2 else 0.4); nh['floors'] += 1
            if p.get('min_height') is not None: base = float(p['min_height'])
            elif p.get('min_floor') is not None: base = float(p['min_floor'])*3.3
            t = 14 if foreign else (1 if H else classify(p, A, c.x, c.y, h is not None))
            if H and not H['res']: t = 11 if H['mscp'] else 4 if (H['com'] or H['mkt']) else 7
            if h is None: h = estimate(t, A, c.x, c.y, r) if not foreign else (6 + 8*r if A < 3000 else 12 + 10*r); nh['est'] += 1
            h = max(2.5, min(h, 330.0))
            wall = hexrgb(p.get('facade_color') or '') or WALLS[t][int(r*997) % len(WALLS[t])]
            rc = hexrgb(p.get('roof_color') or '')
            roof = ROOFS[t][int(r*991) % len(ROOFS[t])]
            fh = 3.0 if t in (1, 2, 3) else 4.2 if t in (5, 12) else 5.0 if t in (6, 10) else 3.8
            out.append({'id':bid, 'g':q, 'h':round(h, 1), 'base':round(base, 1), 't':t, 'wall':wall, 'roof':roof, 'rc':rc, 'fh':fh, 'foreign':foreign,
                        'name':p.get('@name'), 'fl':fl, 'explicit':p.get('class') in ('house', 'detached', 'semidetached_house', 'terrace', 'bungalow', 'villa'), 'hdb':H, 'parts':bid in parts and bool(p.get('has_parts'))})
# small "houses" among HDB blocks are estate amenities (pavilions, bin centres, substations): one storey
from scipy.spatial import cKDTree
hc = np.array([[b['g'].centroid.x, b['g'].centroid.y] for b in out if b['t'] == 1])
kd = cKDTree(hc); nfix = 0
for b in out:
    if b['t'] == 3 and b['fl'] is None and not b.get('explicit'):
        c = b['g'].centroid
        if kd.query_ball_point([c.x, c.y], 90):
            b['t'] = 0; b['h'] = round(4.0 + 2.0*hsh(b['id'], 3), 1); b['wall'] = WALLS[0][int(hsh(b['id'], 4)*9) % 3]; b['roof'] = 0; nfix += 1
print('estate amenities', nfix)
print('kept', len(out), 'skipped', dict(skipped), 'heights', dict(nh))
# building parts replace their outline
pp = []
for bid, lst in parts.items():
    for p, g in lst:
        gp = proj(g).buffer(0)
        for q in polys(gp):
            if q.area < 4: continue
            q = q.simplify(0.25, preserve_topology=True)
            h = None
            if p.get('height') is not None: h = float(p['height'])
            elif p.get('num_floors') is not None: h = int(p['num_floors'])*3.3 + 0.6
            if h is None: continue
            base = float(p['min_height']) if p.get('min_height') is not None else float(p['min_floor'])*3.3 if p.get('min_floor') is not None else 0.0
            if h <= base + 0.5: continue
            pp.append({'bid':bid, 'g':q, 'h':round(h, 1), 'base':round(base, 1), 'wall':hexrgb(p.get('facade_color') or ''), 'rc':hexrgb(p.get('roof_color') or '')})
have_parts = set(x['bid'] for x in pp)
print('parts', len(pp), 'buildings with usable parts', len(have_parts))
save({'b':out, 'parts':pp, 'have_parts':have_parts}, 'buildings.pkl')
tc = collections.Counter(b['t'] for b in out); print('types', sorted(tc.items()))
