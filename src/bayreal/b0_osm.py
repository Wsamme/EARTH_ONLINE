# stage 0: read the Northern California OSM extract, keep everything inside the Bay Area square (lon/lat geometries)
import sys, time, collections; sys.path.insert(0, '.')
from common import *
import osmium, shapely.wkb
from shapely.geometry import box, LineString, Point
from osmium.filter import KeyFilter
PBF = BD + 'norcal.osm.pbf'
X0, Y0, X1, Y1 = BBOX; BB = box(*BBOX)
inb = lambda lon, lat: X0 <= lon <= X1 and Y0 <= lat <= Y1
wkbf = osmium.geom.WKBFactory()
T = lambda o: {t.k: t.v for t in o.tags}
R = collections.defaultdict(list); routes = []; t0 = time.time(); cnt = collections.Counter()
AREA_KEYS = ('building', 'building:part', 'landuse', 'leisure', 'natural', 'amenity', 'aeroway', 'water', 'waterway', 'boundary', 'man_made', 'tourism', 'place', 'highway', 'parking', 'golf', 'shop')
LINE_KEYS = ('highway', 'railway', 'aeroway', 'waterway', 'natural', 'man_made', 'route', 'type', 'place', 'tourism', 'amenity', 'leisure', 'historic', 'public_transport', 'shop')
fp = osmium.FileProcessor(PBF).with_locations('flex_mem').with_areas(KeyFilter(*AREA_KEYS)).with_filter(KeyFilter(*sorted(set(AREA_KEYS + LINE_KEYS))))
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
BKEEP = {'building', 'building:part', 'height', 'min_height', 'building:levels', 'building:min_level', 'roof:levels', 'name', 'name:zh', 'roof:colour', 'building:colour', 'roof:shape', 'roof:height', 'amenity', 'shop', 'tourism', 'location', 'layer', 'man_made', 'leisure', 'office', 'religion', 'aeroway', 'parking', 'railway', 'public_transport', 'type', 'wikidata'}
POIK = {'tourism', 'amenity', 'leisure', 'historic', 'man_made', 'natural', 'aeroway', 'railway', 'public_transport', 'shop', 'place'}
for o in fp:
    if o.is_node():
        lon, lat = o.location.lon, o.location.lat
        if not inb(lon, lat): continue
        t = T(o)
        if not t.get('name') and t.get('natural') != 'peak': continue
        if not (POIK & t.keys()): continue
        R['nodes'].append((t, (lon, lat))); cnt['node'] += 1
    elif o.is_way():
        t = T(o)
        lin = ('highway' in t and t.get('area') != 'yes') or 'railway' in t or t.get('aeroway') in ('runway', 'taxiway') or ('waterway' in t and t['waterway'] in ('river', 'stream', 'canal', 'drain', 'ditch')) \
              or t.get('natural') == 'coastline' or t.get('man_made') in ('pier', 'breakwater', 'groyne')
        if not lin: continue
        try: cs = [(n.lon, n.lat) for n in o.nodes]
        except osmium.InvalidLocationError: continue
        if len(cs) < 2: continue
        xs = [c[0] for c in cs]; ys = [c[1] for c in cs]
        if max(xs) < X0 or min(xs) > X1 or max(ys) < Y0 or min(ys) > Y1: continue
        R['ways'].append((o.id, t, cs)); cnt['way'] += 1
    elif o.is_relation():
        t = T(o)
        if t.get('type') == 'route' and t.get('route') in ('subway', 'light_rail', 'train', 'tram', 'monorail', 'funicular', 'ferry', 'railway'):
            routes.append((o.id, t, [(m.type, m.ref, m.role) for m in o.members])); cnt['route'] += 1
    elif o.is_area():
        t = T(o)
        try: b = area_bounds(o)
        except Exception: cnt['badarea'] += 1; continue
        if b is None or b[2] < X0 or b[0] > X1 or b[3] < Y0 or b[1] > Y1: continue
        try: g = bytes.fromhex(wkbf.create_multipolygon(o))
        except Exception: cnt['badarea'] += 1; continue
        if 'building' in t or 'building:part' in t:
            if t.get('building') in ('no', None) and 'building:part' not in t: pass
            else: R['bld'].append((o.orig_id(), o.from_way(), {k: v for k, v in t.items() if k in BKEEP}, g)); cnt['bld'] += 1; continue
        R['areas'].append((o.orig_id(), o.from_way(), t, g)); cnt['area'] += 1
    if sum(cnt.values()) % 200000 == 0: print(dict(cnt), round(time.time() - t0), flush=True)
R['routes'] = routes
print('done', dict(cnt), round(time.time() - t0), 's', flush=True)
pickle.dump(dict(R), open(OUT + 'raw.pkl', 'wb'), protocol=4)
print('saved', round(time.time() - t0), flush=True)
