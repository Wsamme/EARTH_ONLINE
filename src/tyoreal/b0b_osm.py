# stage 0b (Tokyo): everything but the buildings from out/tyo.osm.pbf, kept if it reaches the square (+ ~1 km margin).
# Writes raw_{nodes,ways,areas,routes}.pkl. Ways carry projected coordinates (numpy float64 (n, 2), metres) and a reduced tag set
# (Japan's import tags — source, KSJ2, note ... — are dropped to save memory); areas are WKB in lon / lat as in New York.
import sys, time, collections, gc; sys.path.insert(0, '.')
from common import *
import osmium
from osmium.filter import KeyFilter
PBF = OUT + 'tyo.osm.pbf'
X0, Y0, X1, Y1 = BBOX
inb = lambda lon, lat: X0 <= lon <= X1 and Y0 <= lat <= Y1
wkbf = osmium.geom.WKBFactory()
R = collections.defaultdict(list); t0 = time.time(); cnt = collections.Counter()
AREA_KEYS = ('landuse', 'leisure', 'natural', 'amenity', 'aeroway', 'water', 'waterway', 'boundary', 'man_made', 'tourism', 'place', 'highway', 'parking', 'golf', 'shop', 'railway', 'public_transport')
LINE_KEYS = ('highway', 'railway', 'aeroway', 'waterway', 'natural', 'man_made', 'route', 'type', 'place', 'tourism', 'amenity', 'leisure', 'historic', 'public_transport', 'shop', 'aerialway', 'bridge')
WKEEP = {'highway', 'railway', 'aeroway', 'waterway', 'natural', 'man_made', 'name', 'name:en', 'name:ja', 'name:zh', 'name:zh-Hans', 'name:zh-Hant', 'name:ja-Latn', 'name:ja_rm', 'ref', 'bridge', 'bridge:name',
         'bridge:name:en', 'bridge:structure', 'tunnel', 'covered', 'layer', 'oneway', 'junction', 'service', 'level', 'area', 'intermittent', 'location', 'aerialway', 'usage', 'electrified', 'operator', 'network',
         'lanes', 'construction', 'access', 'embankment', 'width', 'railway:preserved', 'passenger', 'colour', 'official_name', 'int_name', 'motorroad', 'toll', 'ele', 'height'}
DROP = ('source', 'KSJ2', 'note', 'fixme', 'FIXME', 'is_in', 'alt_name', 'old_name', 'nat_ref', 'description', 'gsi:', 'mlit:', 'yh:', 'addr:', 'ref:', 'check_date', 'survey')
def keep_area_tag(k):
    if k.startswith(DROP): return False
    if k.startswith('name:') and k not in ('name:en', 'name:ja', 'name:zh', 'name:zh-Hans', 'name:zh-Hant', 'name:ja-Latn', 'name:ja_rm'): return False
    return True
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
POIK = {'tourism', 'amenity', 'leisure', 'historic', 'man_made', 'natural', 'aeroway', 'railway', 'public_transport', 'shop', 'place'}
fp = osmium.FileProcessor(PBF).with_locations('flex_mem').with_areas(KeyFilter(*AREA_KEYS)).with_filter(KeyFilter(*sorted(set(AREA_KEYS + LINE_KEYS))))
for o in fp:
    if o.is_node():
        lon, lat = o.location.lon, o.location.lat
        if not inb(lon, lat): continue
        t = {k: v for k, v in ((tg.k, tg.v) for tg in o.tags) if keep_area_tag(k)}
        if not t.get('name') and t.get('natural') != 'peak': continue
        if not (POIK & t.keys()): continue
        R['nodes'].append((t, (lon, lat))); cnt['node'] += 1
    elif o.is_way():
        tg = o.tags
        hw = tg.get('highway'); rw = tg.get('railway'); ww = tg.get('waterway')
        lin = (hw is not None and tg.get('area') != 'yes') or rw is not None or tg.get('aeroway') in ('runway', 'taxiway') or ww in ('river', 'stream', 'canal', 'drain', 'ditch') \
              or tg.get('natural') == 'coastline' or tg.get('man_made') in ('pier', 'breakwater', 'groyne') or 'aerialway' in tg
        if not lin: continue
        try: cs = np.array([((n.lon - LON0)*MX, (n.lat - LAT0)*MY) for n in o.nodes])
        except osmium.InvalidLocationError: cnt['badloc'] += 1; continue
        if len(cs) < 2: continue
        mn = cs.min(0); mx = cs.max(0)
        if mx[0] < -HALF - 1000 or mn[0] > HALF + 1000 or mx[1] < -HALF - 1000 or mn[1] > HALF + 1000: continue
        t = {k: v for k, v in ((x.k, x.v) for x in tg) if k in WKEEP}
        R['ways'].append((o.id, t, cs)); cnt['way'] += 1
    elif o.is_relation():
        t = {k: v for k, v in ((x.k, x.v) for x in o.tags) if keep_area_tag(k)}
        if t.get('type') == 'route' and t.get('route') in ('subway', 'light_rail', 'train', 'tram', 'monorail', 'funicular', 'ferry', 'railway', 'aerialway'):
            R['routes'].append((o.id, t, [(m.type, m.ref, m.role) for m in o.members])); cnt['route'] += 1
    elif o.is_area():
        if not o.from_way(): continue          # multipolygon relations: from mp.osm.pbf (complete), below
        t = {k: v for k, v in ((x.k, x.v) for x in o.tags) if keep_area_tag(k)}
        if 'building' in t and t.get('building') != 'no' and not (t.keys() & {'landuse', 'leisure', 'amenity', 'aeroway', 'boundary', 'natural'}): continue
        try: b = area_bounds(o)
        except Exception: cnt['badarea'] += 1; continue
        if b is None or b[2] < X0 or b[0] > X1 or b[3] < Y0 or b[1] > Y1: continue
        try: g = bytes.fromhex(wkbf.create_multipolygon(o))
        except Exception: cnt['badarea'] += 1; continue
        R['areas'].append((o.orig_id(), o.from_way(), t, g)); cnt['area'] += 1
    s = cnt['way'] + cnt['area']
    if s and s % 200000 == 0 and s != cnt.get('_last'): cnt['_last'] = s; print(dict(cnt), round(time.time() - t0), flush=True)
print('file done', dict(cnt), round(time.time() - t0), 's', flush=True)
del fp; gc.collect()
# the multipolygon / boundary relations of the whole Kantō file with all their members (osmium tags-filter r/type=multipolygon,boundary):
# the long river, lake, forest and city polygons reaching beyond the extract are complete here
fp = osmium.FileProcessor(OUT + 'mp.osm.pbf').with_locations('flex_mem').with_areas(KeyFilter(*AREA_KEYS))
for o in fp:
    if not o.is_area() or o.from_way(): continue
    t = {k: v for k, v in ((x.k, x.v) for x in o.tags) if keep_area_tag(k)}
    if 'building' in t and t.get('building') != 'no' and not (t.keys() & {'landuse', 'leisure', 'amenity', 'aeroway', 'boundary', 'natural'}): continue
    try: b = area_bounds(o)
    except Exception: cnt['badrel'] += 1; continue
    if b is None or b[2] < X0 or b[0] > X1 or b[3] < Y0 or b[1] > Y1: continue
    try: g = bytes.fromhex(wkbf.create_multipolygon(o))
    except Exception: cnt['badrel'] += 1; continue
    R['areas'].append((o.orig_id(), False, t, g)); cnt['relarea'] += 1
print('relations done', dict(cnt), round(time.time() - t0), 's', flush=True)
del fp; gc.collect()
for k in ('nodes', 'ways', 'areas', 'routes'):
    pickle.dump(R[k], open(OUT + 'raw_%s.pkl' % k, 'wb'), protocol=4); print('saved', k, len(R[k]), round(time.time() - t0), flush=True)
