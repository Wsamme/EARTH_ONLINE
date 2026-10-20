# reference data for the v21 port remake: PSA container terminals + Jurong Port: buildings, roads, land use, coastline (quay edges), POIs
import sys; sys.path.insert(0, '.')
from common import *
from shapely.geometry import box, Point
from shapely.ops import unary_union
B = pickle.load(open(SGD + 'base15.pkl', 'rb')); Bl = load('buildings.pkl'); R = load('roads.pkl'); L = load('land.pkl')
TYPES = {0:'generic', 1:'HDB', 2:'condo', 3:'house', 4:'commercial', 5:'office', 6:'industrial', 7:'civic', 8:'religious', 9:'hospital', 10:'transport', 11:'car park', 12:'hotel', 13:'shed', 14:'foreign', 15:'tank'}
AREAS = {
 'pasirpanjang':('Pasir Panjang Terminal (PSA, berths P1-P6) and the Pasir Panjang wharves', 1.2760, 103.7700, (103.7420, 1.2600, 103.7980, 1.2960)),
 'keppel':('Keppel, Brani and the former Tanjong Pagar container terminals (PSA city terminals), incl. the Keppel Distripark', 1.2640, 103.8360, (103.8180, 1.2500, 103.8540, 1.2800)),
 'jurongport':('Jurong Port (multipurpose: bulk, general cargo, cement)', 1.3020, 103.7140, (103.6980, 1.2900, 103.7300, 1.3150)),
 'tuas':('Tuas Port (new automated mega port, phase 1 berths) and the Tuas industrial waterfront', 1.2450, 103.6250, (103.5900, 1.2000, 103.6700, 1.2900)),
}
sgland = L['sg']
for key, (name, lat, lon, bb) in AREAS.items():
    ax, ay = w(lon, lat); x0, y0 = w(bb[0], bb[1]); x1, y1 = w(bb[2], bb[3]); bx = box(x0, y0, x1, y1)
    loc = lambda x, y: [round(x - ax, 1), round(-(y - ay), 1)]
    ring = lambda g: [loc(x, y) for x, y in list(g.exterior.coords)[:-1]]
    T = {'name':name, 'anchor':{'lat':lat, 'lon':lon}, 'box_local':[loc(x0, y1), loc(x1, y0)],
         'note':'Local metres around the anchor: +x east, +z south. coast = land/sea boundary lines (the quay edges), land on the left when walking along them. Heights est:true are estimates.',
         'buildings':[], 'roads':[], 'landuse':{}, 'coast':[], 'pois':[]}
    for b in Bl['b']:
        g = b['g']
        if not g.intersects(bx) or g.area < 40: continue
        c = g.centroid
        T['buildings'].append({'name':b['name'], 'h':b['h'], 'floors':b['fl'], 'est':b['fl'] is None and not b['hdb'], 'type':TYPES[b['t']], 'area':round(g.area), 'centroid':loc(c.x, c.y), 'ring':ring(g)})
    for l in R['lines']:
        if l['c'] > 12 or not l['g'].intersects(bx): continue
        gg = l['g'].intersection(bx)
        for ln in (gg.geoms if hasattr(gg, 'geoms') else [gg]):
            if ln.geom_type == 'LineString' and ln.length > 4: T['roads'].append({'cls':l['c'], 'name':l['name'], 'pts':[loc(x, y) for x, y in ln.coords]})
    by = {}
    for p, g in B['landuse']:
        k = p.get('kind')
        gp = proj(g)
        if not gp.intersects(bx): continue
        by.setdefault(k, []).append(gp.buffer(0.3).intersection(bx))
    for k, gs in by.items():
        u = unary_union(gs).buffer(-0.3).simplify(2.0)
        out = [{'ring':ring(q), 'area':round(q.area)} for q in (u.geoms if hasattr(u, 'geoms') else [u]) if q.geom_type == 'Polygon' and q.area > 400]
        if out: T['landuse'][k] = out
    cl = sgland.intersection(bx)
    for q in (cl.geoms if hasattr(cl, 'geoms') else [cl]):
        if q.geom_type != 'Polygon': continue
        bd = q.exterior.difference(bx.exterior.buffer(1))
        for ln in (bd.geoms if hasattr(bd, 'geoms') else [bd]):
            if ln.geom_type == 'LineString' and ln.length > 30: T['coast'].append([loc(x, y) for x, y in ln.simplify(1.5).coords])
    for p, g in B['pois']:
        q = proj(g) if g.geom_type == 'Point' else proj(g.representative_point())
        if bx.contains(q) and p.get('name') and p.get('kind') not in ('bench', 'waste_basket', 'atm', 'vending_machine', 'bicycle_parking', 'parking_entrance', 'toilets', 'drinking_water', 'bus_stop'):
            T['pois'].append({'name':p['name'], 'kind':p.get('kind'), 'at':loc(q.x, q.y)})
    js = json.dumps(T, ensure_ascii=False, separators=(',', ':'))
    open(ROOT + 'lm20/ref_port_%s.json' % key, 'w').write(js)
    print(key, 'buildings', len(T['buildings']), 'roads', len(T['roads']), 'landuse', {k:len(v) for k, v in T['landuse'].items()}, 'coast', len(T['coast']), 'pois', len(T['pois']), 'bytes', len(js))
