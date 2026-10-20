# stage 9b (Hong Kong): reference data for the landmark authors: real footprints / parts / roads (with deck heights) / POIs and the
# terrain around each target of hk/targets.json (made by b9_targets.py); local metres around the anchor (+x east, +z south)
# -> SC/hk/ref_<group>.json. usage: python3 b9_refs.py [group ...]
import sys, collections; sys.path.insert(0, '.')
from common import *
from shapely.geometry import box, Point
Bl = load('buildings.pkl'); R = load('roads.pkl'); NODES = pickle.load(open(OUT + 'raw_nodes.pkl', 'rb'))
T2 = load('terrain.pkl'); H = T2['H']
def ground(x, y):
    fx = (x + HALF)/TS; fy = (y + HALF)/TS; i = min(TN - 2, max(0, int(fx))); j = min(TN - 2, max(0, int(fy))); u = fx - i; v = fy - j
    return float(H[j, i]*(1 - u)*(1 - v) + H[j, i + 1]*u*(1 - v) + H[j + 1, i]*(1 - u)*v + H[j + 1, i + 1]*u*v)
TYPES = {14:'foreign (Shenzhen)', 0:'generic', 2:'apartment', 3:'house', 4:'commercial', 5:'office', 6:'industrial', 7:'civic', 8:'religious', 9:'hospital', 10:'transport', 11:'car park', 12:'hotel', 13:'shed', 15:'tank'}
TJ = json.load(open(ROOT + 'hk/targets.json'))
TARGETS = {g: [(e['key'], e['en'] + ' — ' + e['notes'], e['lat'], e['lon'], max(120, min(1600, int(e['r']*1.6)))) for e in L] for g, L in TJ['groups'].items()}
from shapely.strtree import STRtree
BT = STRtree([b['g'] for b in Bl['b']]); LT = STRtree([l['g'] for l in R['lines']])
parts_by = collections.defaultdict(list)
for p in Bl['parts']: parts_by[p['bid']].append(p)
os_ = __import__('os'); os_.makedirs(ROOT + 'hk', exist_ok=True)
for grp, lst in TARGETS.items():
    if len(sys.argv) > 1 and grp not in sys.argv[1:]: continue
    out = {'note':'Local metres around each anchor: +x east, +z south (three.js local axes before rotation). Real OSM data; heights are OSM values where height/levels are mapped (about 55 % of the Hong Kong buildings: levels x 3.1 m + 1 m, or height), otherwise drawn from the measured distribution of similar buildings (right class, not the right building). parts = OSM building:part pieces with base/top heights. terrain = ground heights (m) on a 35 m grid around the anchor (rows north to south, the bare-earth estimate: see BRIEF). roads: cls (see FORMATS), elev = deck height above the ground per vertex when the road is a bridge / flyover. ground = terrain height (m) at the anchor.', 'targets':{}}
    for key, name, lat, lon, rad in lst:
        ax, ay = w(lon, lat); bx = box(ax - rad, ay - rad, ax + rad, ay + rad)
        loc = lambda x, y: [round(x - ax, 1), round(-(y - ay), 1)]
        T = {'name':name, 'anchor':{'lat':lat, 'lon':lon}, 'radius':rad, 'ground':round(ground(ax, ay), 1), 'buildings':[], 'roads':[], 'pois':[]}
        st = 35 if rad <= 700 else 70; nn = int(rad//st)
        T['terrain'] = {'step':st, 'n':2*nn + 1, 'rows_north_to_south':[[round(ground(ax + i*st, ay - j*st), 1) for i in range(-nn, nn + 1)] for j in range(-nn, nn + 1)]}
        for bi in sorted(int(k) for k in BT.query(bx, predicate='intersects')):
            b = Bl['b'][bi]; g = b['g']
            c = g.centroid
            e = {'name':b['name'], 'zh':b.get('zh'), 'osm':b['id'], 'h':b['h'], 'floors':b['fl'], 'type':TYPES.get(b['t'], str(b['t'])), 'area':round(g.area), 'centroid':loc(c.x, c.y), 'ring':[loc(x, y) for x, y in list(g.exterior.coords)[:-1]]}
            if b['id'] in Bl['have_parts']: e['parts'] = [{'base':p['base'], 'top':p['h'], 'ring':[loc(x, y) for x, y in list(p['g'].exterior.coords)[:-1]]} for p in parts_by.get(b['id'], [])]
            T['buildings'].append(e)
        for i in sorted(int(k) for k in LT.query(bx, predicate='intersects')):
            l = R['lines'][i]
            if l['c'] > 17: continue
            el = R['elev'].get(i); cs = list(l['g'].coords)
            if l['g'].within(bx) or el is None:
                gg = l['g'].intersection(bx)
                for ln in (gg.geoms if hasattr(gg, 'geoms') else [gg]):
                    if ln.geom_type == 'LineString' and ln.length > 8:
                        e = {'cls':l['c'], 'name':l['name'], 'bridge':bool(l['br']), 'layer':l.get('layer', 0), 'pts':[loc(x, y) for x, y in ln.coords]}
                        if el is not None and len(el) == len(cs) and l['g'].within(bx): e['elev'] = [round(v, 1) for v in el]
                        T['roads'].append(e)
            else:
                # elevated line crossing the box: keep the vertices inside (with their deck heights)
                keep = [(c, h) for c, h in zip(cs, el) if bx.contains(Point(c))] if len(el) == len(cs) else []
                if len(keep) >= 2: T['roads'].append({'cls':l['c'], 'name':l['name'], 'bridge':bool(l['br']), 'layer':l.get('layer', 0), 'pts':[loc(*c) for c, h in keep], 'elev':[round(h, 1) for c, h in keep]})
        for t, (lon2, lat2) in NODES:
            x, y = w(lon2, lat2)
            if bx.contains(Point(x, y)) and t.get('name'):
                T['pois'].append({'name':t['name'], 'tags':{k:v for k, v in t.items() if k in ('tourism', 'amenity', 'historic', 'man_made', 'leisure', 'building', 'height', 'railway', 'natural', 'shop', 'aeroway')}, 'at':loc(x, y)})
        T['pois'] = T['pois'][:120]
        out['targets'][key] = T
        print(grp, key, len(T['buildings']), 'buildings', len(T['roads']), 'roads', len(T['pois']), 'pois', flush=True)
    json.dump(out, open(ROOT + 'hk/ref_%s.json' % grp, 'w'), separators=(',', ':'), ensure_ascii=False)
print('done')
