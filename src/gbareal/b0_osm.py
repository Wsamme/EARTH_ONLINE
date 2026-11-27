# stage 0 (gbareal): read the extract of the new square (Hong Kong, Shenzhen, Dongguan, the delta around), keep everything inside it (lon/lat
# geometries). Writes raw_{nodes,ways,bld,areas,routes}.pkl
import sys, time, collections, gc; sys.path.insert(0, '.')
from common import *
import osmium
from osmium.filter import KeyFilter
# PBFS: common.py (frame gba: the bbox extract of the Guangdong file; frame gz: the openstreetmap.fr extracts hong_kong, macau, guangdong)
# frame gz: outside the core cities (HK, SZ, DG, GZ, 1 km margin) and outside the October square, only context is kept: big buildings
# (>= 3000 m2, or tagged >= 40 m / 13 levels), land-cover / water / admin / place areas, roads up to tertiary, rail, rivers, coastline,
# named place nodes and peaks (memory: the 294 km square holds the whole Pearl River Delta)
import shapely
from shapely.geometry import box as _box
if FRAME == 'gz':
    _RG = pickle.load(open(DATA + 'regions.pkl', 'rb'))
    _ol0, _oa0 = ll(-OLD_HALF, -OLD_HALF); _ol1, _oa1 = ll(OLD_HALF, OLD_HALF)
    KEEP = shapely.union_all([_RG['hk'], _RG['sz'], _RG['dg'], _RG['gz']]).buffer(0.01).union(_box(_ol0, _oa0, _ol1, _oa1)); shapely.prepare(KEEP)
    inkeep = lambda lon, lat: shapely.contains_xy(KEEP, lon, lat)
else: inkeep = lambda lon, lat: True
CTX_HW = {'motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link', 'secondary', 'secondary_link', 'tertiary', 'tertiary_link'}
CTX_AREA = lambda t: t.get('boundary') == 'administrative' or 'place' in t or t.get('natural') in ('water', 'wood', 'scrub', 'grassland', 'beach', 'sand', 'wetland', 'bare_rock', 'heath', 'mud') \
    or t.get('landuse') in ('forest', 'reservoir', 'basin', 'salt_pond', 'grass', 'meadow', 'farmland', 'orchard', 'aquaculture') or t.get('waterway') in ('riverbank', 'dock') or 'water' in t \
    or t.get('leisure') in ('park', 'golf_course', 'nature_reserve') or t.get('aeroway') in ('aerodrome', 'apron', 'runway') or t.get('boundary') in ('protected_area', 'national_park')
def big_bld(t, g):
    def f(v):
        try: return float(str(v).split(';')[0].replace('m', '').strip())
        except Exception: return 0.0
    if f(t.get('height')) >= 40 or f(t.get('building:levels')) >= 13: return True
    b = g.bounds; return (b[2] - b[0])*MX*(b[3] - b[1])*MY >= 3000 and g.area*MX*MY >= 3000
import shapely.wkb as _swkb
X0, Y0, X1, Y1 = BBOX
inb = lambda lon, lat: X0 <= lon <= X1 and Y0 <= lat <= Y1
wkbf = osmium.geom.WKBFactory()
T = lambda o: {t.k: t.v for t in o.tags}
R = collections.defaultdict(list); t0 = time.time(); cnt = collections.Counter()
seen = {'n':set(), 'w':set(), 'r':set(), 'a':set()}
AREA_KEYS = ('building', 'building:part', 'landuse', 'leisure', 'natural', 'amenity', 'aeroway', 'water', 'waterway', 'boundary', 'man_made', 'tourism', 'place', 'highway', 'parking', 'golf', 'shop')
LINE_KEYS = ('highway', 'railway', 'aeroway', 'waterway', 'natural', 'man_made', 'route', 'type', 'place', 'tourism', 'amenity', 'leisure', 'historic', 'public_transport', 'shop', 'aerialway')
def area_bounds(o):
    x0 = y0 = 1e9; x1 = y1 = -1e9
    for r in o.outer_rings():
        for n in r:
            x, y = n.lon, n.lat
            if x < x0: x0 = x
            if x > x1: x1 = x
            if y < y0: y0 = y
            if y > y1: y1 = y
    return (x0, y0, x1, y1) if x1 >= x0 else None
BKEEP = {'building', 'building:part', 'height', 'min_height', 'building:levels', 'building:min_level', 'roof:levels', 'name', 'name:zh', 'name:zh-Hans', 'name:zh-Hant', 'name:en', 'building:levels:underground', 'construction', 'roof:colour', 'building:colour', 'roof:shape', 'roof:height',
         'amenity', 'shop', 'tourism', 'location', 'layer', 'man_made', 'leisure', 'office', 'religion', 'aeroway', 'parking', 'railway', 'public_transport', 'type', 'wikidata', 'building:material', 'roof:material'}
POIK = {'tourism', 'amenity', 'leisure', 'historic', 'man_made', 'natural', 'aeroway', 'railway', 'public_transport', 'shop', 'place'}
for PBF in PBFS:
    _LOC = 'flex_mem' if FRAME != 'gz' else 'sparse_file_array,' + OUT + 'b0_nodes.idx'     # frame gz: node locations on disk (the in-memory index took the run to 3.2 GB)
    fp = osmium.FileProcessor(PBF).with_locations(_LOC).with_areas(KeyFilter(*AREA_KEYS)).with_filter(KeyFilter(*sorted(set(AREA_KEYS + LINE_KEYS))))
    dup = collections.Counter()
    for o in fp:
        if o.is_node():
            lon, lat = o.location.lon, o.location.lat
            if not inb(lon, lat): continue
            t = T(o)
            if not t.get('name') and t.get('natural') != 'peak': continue
            if not (POIK & t.keys()): continue
            if not inkeep(lon, lat) and 'place' not in t and t.get('natural') != 'peak': cnt['node_ctx_skip'] += 1; continue
            if o.id in seen['n']: dup['node'] += 1; continue
            seen['n'].add(o.id)
            R['nodes'].append((t, (lon, lat))); cnt['node'] += 1
        elif o.is_way():
            t = T(o)
            lin = ('highway' in t and t.get('area') != 'yes') or 'railway' in t or t.get('aeroway') in ('runway', 'taxiway') or ('waterway' in t and t['waterway'] in ('river', 'stream', 'canal', 'drain', 'ditch')) \
                  or t.get('natural') == 'coastline' or t.get('man_made') in ('pier', 'breakwater', 'groyne') or 'aerialway' in t
            if not lin: continue
            try: cs = [(n.lon, n.lat) for n in o.nodes]
            except osmium.InvalidLocationError: continue
            if len(cs) < 2: continue
            xs = [c[0] for c in cs]; ys = [c[1] for c in cs]
            if max(xs) < X0 or min(xs) > X1 or max(ys) < Y0 or min(ys) > Y1: continue
            if 'highway' in t and t['highway'] not in CTX_HW and not inkeep(xs[0], ys[0]) and not inkeep(xs[-1], ys[-1]) and not inkeep(xs[len(xs)//2], ys[len(ys)//2]): cnt['way_ctx_skip'] += 1; continue
            if 'waterway' in t and t['waterway'] not in ('river', 'canal') and not inkeep(xs[0], ys[0]) and not inkeep(xs[-1], ys[-1]): cnt['way_ctx_skip'] += 1; continue
            if o.id in seen['w']: dup['way'] += 1; continue
            seen['w'].add(o.id)
            R['ways'].append((o.id, t, cs)); cnt['way'] += 1
        elif o.is_relation():
            t = T(o)
            if t.get('type') == 'route' and t.get('route') in ('subway', 'light_rail', 'train', 'tram', 'monorail', 'funicular', 'ferry', 'railway', 'aerialway'):
                if o.id in seen['r']: dup['route'] += 1; continue
                seen['r'].add(o.id)
                R['routes'].append((o.id, t, [(m.type, m.ref, m.role) for m in o.members])); cnt['route'] += 1
        elif o.is_area():
            t = T(o)
            try: b = area_bounds(o)
            except Exception: cnt['badarea'] += 1; continue
            if b is None or b[2] < X0 or b[0] > X1 or b[3] < Y0 or b[1] > Y1: continue
            key = (o.from_way(), o.orig_id())
            if key in seen['a']: dup['area'] += 1; continue
            try: g = bytes.fromhex(wkbf.create_multipolygon(o))
            except Exception: cnt['badarea'] += 1; continue
            seen['a'].add(key)
            if FRAME == 'gz' and not inkeep((b[0] + b[2])/2, (b[1] + b[3])/2) and not inkeep(b[0], b[1]) and not inkeep(b[2], b[3]):
                if 'building' in t or 'building:part' in t:
                    if t.get('building') in ('no', None) and 'building:part' not in t: pass
                    elif not big_bld(t, _swkb.loads(g)): cnt['bld_ctx_skip'] += 1; continue
                elif not CTX_AREA(t): cnt['area_ctx_skip'] += 1; continue
            if 'building' in t or 'building:part' in t:
                if t.get('building') in ('no', None) and 'building:part' not in t: pass
                else: R['bld'].append((o.orig_id(), o.from_way(), {k: v for k, v in t.items() if k in BKEEP}, g)); cnt['bld'] += 1; continue
            R['areas'].append((o.orig_id(), o.from_way(), t, g)); cnt['area'] += 1
        if sum(cnt.values()) % 200000 == 0: print(dict(cnt), round(time.time() - t0), flush=True)
    print('file done', PBF.split('/')[-1], dict(cnt), 'duplicates skipped', dict(dup), round(time.time() - t0), 's', flush=True)
    del fp; gc.collect()
    if FRAME == 'gz' and __import__('os').path.exists(OUT + 'b0_nodes.idx'): __import__('os').remove(OUT + 'b0_nodes.idx')
del seen; gc.collect()
for k in ('nodes', 'ways', 'bld', 'areas', 'routes'):
    pickle.dump(R[k], open(OUT + 'raw_%s.pkl' % k, 'wb'), protocol=4); print('saved', k, len(R[k]), round(time.time() - t0), flush=True)
