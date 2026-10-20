# reference data for the v20 site remakes (NUS, NTU, Changi terminals): every real building, road, land-use patch and POI
# in a box, in local metres around an anchor (+x east, +z south)
import sys; sys.path.insert(0, '.')
from common import *
from shapely.geometry import box, Point, mapping
from shapely.ops import unary_union
B = pickle.load(open(SGD + 'base15.pkl', 'rb')); Bl = load('buildings.pkl'); R = load('roads.pkl'); X = load('extra.pkl')
TYPES = {0:'generic', 1:'HDB', 2:'condo', 3:'house', 4:'commercial', 5:'office', 6:'industrial', 7:'civic', 8:'religious', 9:'hospital', 10:'transport', 11:'car park', 12:'hotel', 13:'shed', 14:'foreign', 15:'tank'}
SITES = {
 'nus':   ('National University of Singapore, Kent Ridge campus (incl. University Town, NUH)', 1.2985, 103.7760, (103.7660, 1.2885, 103.7890, 1.3105)),
 'ntu':   ('Nanyang Technological University, Yunnan Garden campus', 1.3470, 103.6820, (103.6735, 1.3375, 103.6930, 1.3605)),
 'changi':('Changi Airport passenger terminals T1-T4, apron, hangars', 1.3550, 103.9890, (103.9700, 1.3270, 104.0060, 1.3740)),
}
KEEPLU = ('university', 'college', 'pitch', 'grass', 'park', 'garden', 'pedestrian', 'forest', 'wood', 'meadow', 'playground', 'recreation_ground', 'hospital', 'school', 'aerodrome', 'airfield', 'apron', 'platform', 'military', 'industrial', 'commercial', 'residential', 'golf_course', 'water', 'scrub', 'sand', 'parking')
parts_by = {}
for p in Bl['parts']: parts_by.setdefault(p['bid'], []).append(p)
for key, (name, lat, lon, bb) in SITES.items():
    if len(sys.argv) > 1 and key not in sys.argv[1:]: continue
    ax, ay = w(lon, lat); x0, y0 = w(bb[0], bb[1]); x1, y1 = w(bb[2], bb[3]); bx = box(x0, y0, x1, y1)
    loc = lambda x, y: [round(x - ax, 1), round(-(y - ay), 1)]
    ring = lambda g: [loc(x, y) for x, y in list(g.exterior.coords)[:-1]]
    T = {'name':name, 'anchor':{'lat':lat, 'lon':lon}, 'box_local':[loc(x0, y1), loc(x1, y0)],
         'note':'Local metres around the anchor: +x east, +z south. Heights: OSM/HDB values where mapped, otherwise ESTIMATED (est:true). parts = OSM building:part pieces with base/top heights. The app hides every real building whose centroid lies inside a site keep polygon.',
         'buildings':[], 'roads':[], 'landuse':{}, 'pois':[]}
    for b in Bl['b']:
        g = b['g']
        if not g.intersects(bx): continue
        c = g.centroid
        e = {'id':b['id'][:12], 'name':b['name'], 'h':b['h'], 'base':b['base'], 'floors':b['fl'], 'est':b['fl'] is None and not b['hdb'] and b['h'] is not None, 'type':TYPES[b['t']], 'area':round(g.area), 'centroid':loc(c.x, c.y), 'ring':ring(g)}
        if list(g.interiors): e['holes'] = [[loc(x, y) for x, y in list(r.coords)[:-1]] for r in g.interiors]
        if b['id'] in Bl['have_parts']: e['parts'] = [{'base':p['base'], 'top':p['h'], 'ring':ring(p['g'])} for p in parts_by.get(b['id'], [])]
        T['buildings'].append(e)
    for l in R['lines']:
        if l['c'] > 18 or not l['g'].intersects(bx): continue
        gg = l['g'].intersection(bx)
        for ln in (gg.geoms if hasattr(gg, 'geoms') else [gg]):
            if ln.geom_type == 'LineString' and ln.length > 4: T['roads'].append({'cls':l['c'], 'name':l['name'], 'pts':[loc(x, y) for x, y in ln.coords]})
    by = {}
    for p, g in B['landuse']:
        k = p.get('kind')
        if k not in KEEPLU: continue
        gp = proj(g)
        if not gp.intersects(bx): continue
        by.setdefault(k, []).append(gp.buffer(0.3).intersection(bx))
    for k, gs in by.items():
        u = unary_union(gs).buffer(-0.3).simplify(1.0)
        out = []
        for q in (u.geoms if hasattr(u, 'geoms') else [u]):
            if q.geom_type == 'Polygon' and q.area > 150:
                e = {'ring':ring(q), 'area':round(q.area)}
                if list(q.interiors): e['holes'] = [[loc(x, y) for x, y in list(r.coords)[:-1]] for r in q.interiors if r.envelope.area > 100]
                out.append(e)
        if out: T['landuse'][k] = out
    for p, g in B['pois']:
        q = proj(g) if g.geom_type == 'Point' else proj(g.representative_point())
        if bx.contains(q) and p.get('name') and p.get('kind') not in ('bench', 'waste_basket', 'atm', 'vending_machine', 'bicycle_parking', 'parking_entrance', 'toilets', 'drinking_water', 'parking_space'):
            T['pois'].append({'name':p['name'], 'kind':p.get('kind'), 'at':loc(q.x, q.y)})
    if key == 'changi':
        T['stands_v19'] = [[*loc(s[0], s[1]), s[2]] for s in X['stands'] if bx.contains(Point(s[0], s[1]))]
        T['stands_note'] = 'stands_v19 = the synthetic stands of the current app: [x, z, rotY] local; rotY is the three.js rotation about +y of a plane whose nose points along local +x (i.e. the nose points toward the terminal).'
        T['runways'] = [{'a':loc(*r['a']), 'b':loc(*r['b']), 'len':r['len'], 'name':r['name']} for r in X['runways'] if bx.intersects(Point(*r['a']).buffer(4000))]
    js = json.dumps(T, ensure_ascii=False, separators=(',', ':'))
    open(ROOT + 'lm20/ref_%s.json' % key, 'w').write(js)
    print(key, 'buildings', len(T['buildings']), 'roads', len(T['roads']), 'landuse', {k:len(v) for k, v in T['landuse'].items()}, 'pois', len(T['pois']), 'bytes', len(js))
