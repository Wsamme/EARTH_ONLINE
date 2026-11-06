# lm40: reference data for the round-lm40 Singapore targets (copy of sgreal/s9_refs.py, extended):
#   real footprints / parts / roads / POIs around each target, in local metres (+x east, +z south), plus for lm40:
#   buildings[].osm  = OSM way / relation id of the footprint (from sgdata/bld14.pkl sources; '-' = not from OSM)
#   roads[].br       = OSM bridge flag; bridge lines are kept whole (not clipped) with 'elev' = per-vertex deck height (m, the app's)
#   areas[]          = land-use polygons (kind, area m2, ring clipped to the box) — parks, zoo, university, nature_reserve … for SITE keep polygons
#   meta             = the T40 row (zh, en, kind, r, osm, h, hs, note, unc)
# run from SC/sgreal through the heavy lock:  cd SC/sgreal && bash SC/lm33/kit/heavy.sh python3 SC/lm40/s40_refs.py [group ...]
# output: SC/lm40/ref_<group>.json  (ref radius RR = max(1.6 r, r + 60), capped at 700 m)
import sys; sys.path.insert(0, '.')
from common import *
from shapely.geometry import box, Point
from shapely.strtree import STRtree
B = pickle.load(open(SGD + 'base15.pkl', 'rb')); Bl = load('buildings.pkl'); RD = load('roads.pkl'); R = RD['lines']; ELEV = RD['elev']
OSM = pickle.load(open(ROOT + 'lm40/kit/osm_of.pkl', 'rb'))
TYPES = {0:'generic', 1:'HDB', 2:'condo', 3:'house', 4:'commercial', 5:'office', 6:'industrial', 7:'civic', 8:'religious', 9:'hospital', 10:'transport', 11:'car park', 12:'hotel', 13:'shed', 14:'foreign', 15:'tank'}
AREA_KINDS = {'park', 'garden', 'zoo', 'university', 'college', 'school', 'nature_reserve', 'wetland', 'beach', 'sand', 'pier', 'golf_course', 'recreation_ground', 'pitch', 'military', 'hospital', 'cemetery', 'forest', 'wood', 'grass', 'meadow', 'pedestrian', 'commercial', 'dam', 'protected_area'}
TARGETS = {}
exec(open(ROOT + 'lm40/targets_sg.py').read())
META = {t['key']:t for t in T40}
parts_by = {}
for p in Bl['parts']: parts_by.setdefault(p['bid'], []).append(p)
lu = [(p, proj(g)) for p, g in B['landuse'] if p.get('kind') in AREA_KINDS]
BT = STRtree([b['g'] for b in Bl['b']]); RT = STRtree([l['g'] for l in R]); LT = STRtree([g for p, g in lu])
for grp, lst in TARGETS.items():
    if len(sys.argv) > 1 and grp not in sys.argv[1:]: continue
    out = {'note':'Round lm40. Local metres around each anchor: +x east, +z south (three.js local axes before rotation). Real OSM/Overture data; heights are OSM values where floors/height are mapped, otherwise ESTIMATED (flag est) and often wrong for towers — use meta.h / your research. parts = OSM building:part pieces (base/top heights) where mapped. osm = OSM way/relation of the footprint. roads[].br = bridge (kept whole, elev = deck height per vertex). areas = land-use polygons clipped to the box.', 'targets':{}}
    for key, name, lat, lon, rad in lst:
        rad = min(rad, 700)
        ax, ay = w(lon, lat); bx = box(ax - rad, ay - rad, ax + rad, ay + rad)
        loc = lambda x, y: [round(x - ax, 1), round(-(y - ay), 1)]
        m = {k:v for k, v in META.get(key, {}).items() if k not in ('g', 'lat', 'lon')}
        T = {'name':name, 'meta':m, 'anchor':{'lat':lat, 'lon':lon}, 'radius':rad, 'buildings':[], 'roads':[], 'areas':[], 'pois':[]}
        small = rad > 450   # big site boxes: skip footprints under 40 m2 to keep the file small
        for bi in sorted(BT.query(bx)):
            b = Bl['b'][bi]; g = b['g']
            if not g.intersects(bx) or (small and g.area < 40): continue
            c = g.centroid
            e = {'name':b['name'], 'osm':OSM.get(b['id'], '-'), 'h':b['h'], 'floors':b['fl'], 'est':b['fl'] is None and not b['hdb'], 'type':TYPES[b['t']], 'area':round(g.area), 'centroid':loc(c.x, c.y), 'ring':[loc(x, y) for x, y in list(g.exterior.coords)[:-1]]}
            if b['id'] in Bl['have_parts']: e['parts'] = [{'base':p['base'], 'top':p['h'], 'ring':[loc(x, y) for x, y in list(p['g'].exterior.coords)[:-1]]} for p in parts_by.get(b['id'], [])]
            T['buildings'].append(e)
        for i in sorted(RT.query(bx)):
            l = R[i]
            if l['c'] > 12 or not l['g'].intersects(bx): continue
            if l['br']:
                e = {'cls':l['c'], 'kd':l['kd'], 'name':l['name'], 'br':True, 'pts':[loc(x, y) for x, y in l['g'].coords]}
                if i in ELEV: e['elev'] = [round(v, 1) for v in ELEV[i]]
                if l.get('hmax') is not None: e['hmax'] = round(l['hmax'], 1)
                T['roads'].append(e); continue
            gg = l['g'].intersection(bx)
            for ln in (gg.geoms if hasattr(gg, 'geoms') else [gg]):
                if ln.geom_type == 'LineString' and ln.length > 8: T['roads'].append({'cls':l['c'], 'kd':l['kd'], 'name':l['name'], 'pts':[loc(x, y) for x, y in ln.coords]})
        for li in sorted(LT.query(bx)):
            p, g = lu[li]
            if not g.intersects(bx) or g.area < 1500: continue
            gg = g.intersection(bx)
            for pg in (gg.geoms if hasattr(gg, 'geoms') else [gg]):
                if pg.geom_type != 'Polygon' or pg.area < 800: continue
                pg = pg.simplify(1.0)
                T['areas'].append({'kind':p.get('kind'), 'name':p.get('name'), 'area':round(g.area), 'ring':[loc(x, y) for x, y in list(pg.exterior.coords)[:-1]]})
        for p, g in B['pois']:
            q = proj(g) if g.geom_type == 'Point' else proj(g.representative_point())
            if bx.contains(q) and p.get('name') and p.get('kind') not in ('bench', 'waste_basket', 'atm', 'vending_machine', 'bicycle_parking', 'parking_entrance', 'bus_stop', 'toilets', 'taxi'): T['pois'].append({'name':p['name'], 'kind':p.get('kind'), 'at':loc(q.x, q.y)})
        T['pois'] = T['pois'][:80]
        out['targets'][key] = T
        print(grp, key, 'r', rad, 'bld', len(T['buildings']), 'roads', len(T['roads']), 'areas', len(T['areas']), 'pois', len(T['pois']))
    json.dump(out, open(ROOT + 'lm40/ref_%s.json' % grp, 'w'), ensure_ascii=False, separators=(',', ':'))
