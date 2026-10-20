# stage 9b (Tokyo): reference data for the landmark authors: real footprints / parts / roads (with deck heights) / POIs and the
# terrain around each target of tyo/targets.json (made by b9_targets.py); local metres around the anchor (+x east, +z south)
# -> SC/tyo/ref_<group>.json. usage: python3 b9_refs.py [group ...]      (reads the compact building arrays of b5: out/bldA.npz)
import sys, collections; sys.path.insert(0, '.')
from common import *
from shapely.geometry import box, Point
import shapely
Z = np.load(OUT + 'bldA.npz'); Zd = {k: Z[k] for k in ('XY', 'RS', 'BR', 'h', 'base', 't', 'part', 'haveparts', 'owner', 'osm', 'oid', 'fw', 'area', 'cx', 'cy', 'name', 'est')}; del Z
XY, RS, BR = Zd['XY'], Zd['RS'], Zd['BR']
NAMES = load('bld_names.pkl')
R = load('roads.pkl'); NODES = pickle.load(open(OUT + 'raw_nodes.pkl', 'rb'))
H = load('terrain.pkl')['H']
NXY = np.array([w(lon, lat) for t, (lon, lat) in NODES])
def ground(x, y):
    fx = (x + HALF)/TS; fy = (y + HALF)/TS; i = min(TN - 2, max(0, int(fx))); j = min(TN - 2, max(0, int(fy))); u = fx - i; v = fy - j
    return float(H[j, i]*(1 - u)*(1 - v) + H[j, i + 1]*u*(1 - v) + H[j + 1, i]*(1 - u)*v + H[j + 1, i + 1]*u*v)
TYPES = {0:'generic', 2:'apartment', 3:'house', 4:'commercial', 5:'office', 6:'industrial', 7:'civic', 8:'religious', 9:'hospital', 10:'transport', 11:'car park', 12:'hotel', 13:'shed', 15:'tank'}
TJ = json.load(open(ROOT + 'tyo/targets.json'))
TARGETS = {g: [(e['key'], e['en'] + ' — ' + e['notes'], e['lat'], e['lon'], max(120, min(1600, int(e['r']*1.6)))) for e in L] for g, L in TJ['groups'].items()}
LT = shapely.STRtree([l['g'] for l in R['lines']])
osm_of = lambda k: ('w' if Zd['fw'][k] else 'r') + str(int(Zd['oid'][k]))
idx_of = {int(o): i for i, o in enumerate(Zd['osm'])}          # original (b0a) index -> record
parts_of = collections.defaultdict(list)
for k in np.nonzero(Zd['part'])[0]:
    o = int(Zd['owner'][k])
    if o >= 0 and o in idx_of: parts_of[idx_of[o]].append(k)
def ring(k): return XY[RS[BR[k]]:RS[BR[k] + 1]].astype(np.float64)
os_ = __import__('os'); os_.makedirs(ROOT + 'tyo', exist_ok=True)
for grp, lst in TARGETS.items():
    if len(sys.argv) > 1 and grp not in sys.argv[1:]: continue
    out = {'note':'Local metres around each anchor: +x east, +z south (three.js local axes before rotation). Real OSM data; heights: '
           'measured (OSM height, from the PLATEAU / GSI imports) or storeys x 3.1 m + 0.8 m where mapped (about a third of the Tokyo buildings), '
           'otherwise estimated from the land use, footprint and type (est = true: the right class, not the right building). parts = OSM '
           'building:part pieces with base / top heights (their outline is not drawn when a part starts at the ground). terrain = ground heights '
           '(m) on a 35 / 70 m grid around the anchor (rows north to south; the bare-earth estimate, see BRIEF). roads: cls (0-1 freeway, 2-9 '
           'arterials, 10 local, 11 service, 12 path, 13 runway, 14 taxiway, 15 rail, 16 monorail, 17 pier), elev = deck height above the '
           'ground per vertex when the road is a bridge / flyover. ground = terrain height (m) at the anchor.', 'targets':{}}
    for key, name, lat, lon, rad in lst:
        ax, ay = w(lon, lat); bx = box(ax - rad, ay - rad, ax + rad, ay + rad)
        loc = lambda x, y: [round(x - ax, 1), round(-(y - ay), 1)]
        T = {'name':name, 'anchor':{'lat':lat, 'lon':lon}, 'radius':rad, 'ground':round(ground(ax, ay), 1), 'buildings':[], 'roads':[], 'pois':[]}
        st = 35 if rad <= 700 else 70; nn = int(rad//st)
        T['terrain'] = {'step':st, 'n':2*nn + 1, 'rows_north_to_south':[[round(ground(ax + i*st, ay - j*st), 1) for i in range(-nn, nn + 1)] for j in range(-nn, nn + 1)]}
        m = np.nonzero((Zd['cx'] > ax - rad) & (Zd['cx'] < ax + rad) & (Zd['cy'] > ay - rad) & (Zd['cy'] < ay + rad) & ~Zd['part'])[0]
        for k in m:
            P = ring(k); c = P[:-1].mean(0); ni = int(Zd['name'][k]); nm = NAMES[ni] if ni >= 0 else None
            e = {'name':nm[1] or nm[0] if nm else None, 'ja':nm[0] if nm else None, 'osm':osm_of(k), 'h':round(float(Zd['h'][k]), 1), 'est':bool(Zd['est'][k]),
                 'type':TYPES.get(int(Zd['t'][k]), str(int(Zd['t'][k]))), 'area':round(float(Zd['area'][k])), 'centroid':loc(*c), 'ring':[loc(x, y) for x, y in P[:-1]]}
            if Zd['haveparts'][k]: e['parts'] = [{'base':round(float(Zd['base'][q]), 1), 'top':round(float(Zd['h'][q]), 1), 'ring':[loc(x, y) for x, y in ring(q)[:-1]]} for q in parts_of.get(k, [])]
            T['buildings'].append(e)
        for i in sorted(int(q) for q in LT.query(bx, predicate='intersects')):
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
                keep = [(c, h) for c, h in zip(cs, el) if bx.contains(Point(c))] if len(el) == len(cs) else []
                if len(keep) >= 2: T['roads'].append({'cls':l['c'], 'name':l['name'], 'bridge':bool(l['br']), 'layer':l.get('layer', 0), 'pts':[loc(*c) for c, h in keep], 'elev':[round(h, 1) for c, h in keep]})
        for q in np.nonzero((np.abs(NXY[:, 0] - ax) < rad) & (np.abs(NXY[:, 1] - ay) < rad))[0]:
            t = NODES[q][0]; x, y = NXY[q]
            if t.get('name'):
                T['pois'].append({'name':t['name'], 'en':t.get('name:en'), 'tags':{k:v for k, v in t.items() if k in ('tourism', 'amenity', 'historic', 'man_made', 'leisure', 'building', 'height', 'railway', 'natural', 'shop', 'aeroway')}, 'at':loc(x, y)})
        T['pois'] = T['pois'][:120]
        out['targets'][key] = T
        print(grp, key, len(T['buildings']), 'buildings', len(T['roads']), 'roads', len(T['pois']), 'pois', flush=True)
    json.dump(out, open(ROOT + 'tyo/ref_%s.json' % grp, 'w'), separators=(',', ':'), ensure_ascii=False)
print('done')
