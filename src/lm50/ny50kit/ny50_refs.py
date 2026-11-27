# lm50 New York refs: reference data for the landmark modellers -> R/lm50/ref_<group>.json  (same layout as nycreal/b9_refs.py, plus
# 'meta' = the targets row, 'areas', and OSM ids). nycreal/b9_refs.py needs nycreal/out/*.pkl, which no longer exist, so this tool reads
#   * the app's own staged data (site/nycdata/*.bin via ny50_appdata.py): the building footprints / heights / parts the app draws and
#     hides, the road centrelines with the app's deck heights (elev), the terrain (ground);
#   * OpenStreetMap (Overpass, live) for what the encoded data lacks: OSM way / relation ids, names, height / levels tags, building:part
#     pieces, land-use areas, named POIs.
# usage: python3 ny50_refs.py <targets_ny.json> <out dir> [group ...]      (heavy: run through SC/lm33/kit/heavy.sh)
#        python3 ny50_refs.py --one <key> <lat> <lon> <radius> <out.json>   (a corrected anchor, like lm40 reref.sh)
import sys, json, math, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ny50_appdata as A
from ny50_ovq import ov
from shapely.geometry import Polygon, Point, LineString, box
from shapely.ops import unary_union, polygonize, linemerge
from shapely.strtree import STRtree
TYPES = {0:'generic', 1:'residential', 2:'apartment', 3:'house', 4:'commercial', 5:'office', 6:'industrial', 7:'civic', 8:'religious', 9:'hospital', 10:'transport', 11:'car park', 12:'hotel', 13:'shed', 15:'tank'}
AREA_KEYS = {'leisure':('park', 'garden', 'stadium', 'pitch', 'playground', 'sports_centre', 'marina', 'golf_course', 'track'), 'landuse':('cemetery', 'railway', 'industrial', 'construction', 'grass', 'brownfield', 'religious'),
             'amenity':('university', 'college', 'school', 'hospital', 'parking', 'place_of_worship'), 'man_made':('pier', 'bridge', 'wastewater_plant', 'storage_tank'), 'tourism':('zoo', 'museum', 'attraction'),
             'natural':('water', 'beach', 'wood', 'scrub'), 'power':('plant',), 'aeroway':('apron', 'runway', 'taxiway', 'terminal'), 'place':('square',)}
def rad_of(r): return int(min(700, max(1.6*r, r + 60)))
def osm_polys(e):
    """shapely polygon(s) (NYC metres) of an Overpass way / relation with geometry"""
    if e['type'] == 'way':
        g = e.get('geometry') or []
        if len(g) >= 4 and g[0] == g[-1]: return [Polygon([A.w(p['lon'], p['lat']) for p in g]).buffer(0)]
        return []
    outer = [m for m in e.get('members', []) if m.get('type') == 'way' and m.get('geometry') and m.get('role') in ('outer', 'outline', '')]
    inner = [m for m in e.get('members', []) if m.get('type') == 'way' and m.get('geometry') and m.get('role') == 'inner']
    def rings(ms):
        ls = [LineString([A.w(p['lon'], p['lat']) for p in m['geometry']]) for m in ms if len(m['geometry']) >= 2]
        return list(polygonize(linemerge(ls))) if ls else []
    o = rings(outer); i = rings(inner)
    if not o: return []
    U = unary_union(o)
    if i: U = U.difference(unary_union(i))
    return [g.buffer(0) for g in (U.geoms if hasattr(U, 'geoms') else [U]) if not g.is_empty]
def fetch_osm(boxes):
    """one Overpass query for the union of the boxes (lat/lon s,w,n,e)"""
    parts = ''.join('way[building](%s);relation[building](%s);way["building:part"](%s);relation["building:part"](%s);way[~"^(leisure|landuse|amenity|man_made|tourism|natural|power|aeroway|place)$"~"."](%s);relation[~"^(leisure|landuse|amenity|man_made|tourism|natural|aeroway)$"~"."](%s);node[name](%s);' % ((b,)*7) for b in boxes)
    return ov('[out:json][timeout:600][maxsize:1073741824];(%s);out geom;' % parts)
def build_target(key, meta, lat, lon, rad, OSM, apb, R_lines, RT):
    ax, ay = A.w(lon, lat); bx = box(ax - rad, ay - rad, ax + rad, ay + rad)
    loc = lambda x, y: [round(x - ax, 1), round(-(y - ay), 1)]
    T = {'meta':meta, 'name':meta.get('en', key) if meta else key, 'anchor':{'lat':lat, 'lon':lon}, 'radius':rad, 'ground':round(A.ground(ax, ay), 1), 'buildings':[], 'roads':[], 'areas':[], 'pois':[]}
    ob = OSM['b']; obt = OSM['bt']; opt = OSM['pt']; op = OSM['p']
    # app buildings (what the app draws / hides), each matched to the OSM footprint it came from
    plain = [r for r in apb if not r['part']]; parts = [r for r in apb if r['part']]
    for r in plain:
        g = Polygon(r['rings'][0], r['rings'][1:]).buffer(0)
        if g.is_empty or not g.intersects(bx): continue
        best = None; bi = 0
        for i in obt.query(g):
            o = ob[int(i)]
            try: inter = o['g'].intersection(g).area
            except Exception: continue
            iou = inter/max(1, o['g'].union(g).area)
            if iou > bi: bi = iou; best = o
        c = g.centroid; t = best['tags'] if best and bi > 0.4 else {}
        e = {'osm':best['id'] if best and bi > 0.4 else None, 'match':round(bi, 2), 'name':t.get('name', ''), 'h':r['h'], 'base':r['base'], 'h_osm':t.get('height'), 'levels':t.get('building:levels'),
             'type':TYPES.get(r['t'], str(r['t'])), 'osm_building':t.get('building'), 'area':round(g.area), 'centroid':loc(c.x, c.y), 'ring':[loc(x, y) for x, y in r['rings'][0]]}
        if len(r['rings']) > 1: e['holes'] = [[loc(x, y) for x, y in h] for h in r['rings'][1:]]
        if t.get('wikidata'): e['wikidata'] = t['wikidata']
        T['buildings'].append(e)
    # app building parts (setback tiers with base / top heights) and the OSM building:part pieces they came from
    for r in parts:
        g = Polygon(r['rings'][0]).buffer(0)
        if g.is_empty or not g.intersects(bx): continue
        c = g.representative_point(); best = None; bi = 0
        for i in opt.query(g):
            o = op[int(i)]
            try: iou = o['g'].intersection(g).area/max(1, o['g'].union(g).area)
            except Exception: continue
            if iou > bi: bi = iou; best = o
        e = {'base':r['base'], 'top':r['h'], 'ring':[loc(x, y) for x, y in r['rings'][0]], 'osm_part':best['id'] if best and bi > 0.4 else None}
        # host: the plain app record containing the part, else the OSM building containing it (outlines of part-only buildings are not drawn)
        cl = loc(c.x, c.y); hb = [b for b in T['buildings'] if not b.get('parts_only') and Polygon(b['ring']).buffer(1).contains(Point(cl))]
        if hb: hb[0].setdefault('parts', []).append(e); continue
        ho = [o for o in (ob[int(i)] for i in obt.query(c)) if o['g'].buffer(1).contains(c)]; oid = ho[0]['id'] if ho else None
        ex = next((b for b in T['buildings'] if b.get('parts_only') and oid and b['osm'] == oid), None)
        if ex: ex['parts'].append(e); ex['h'] = max(ex['h'], r['h']); continue
        og = ho[0]['g'] if ho else g; oc = og.centroid; t = ho[0]['tags'] if ho else {}
        T['buildings'].append({'osm':oid, 'name':t.get('name', ''), 'h':r['h'], 'base':0.0, 'h_osm':t.get('height'), 'levels':t.get('building:levels'), 'type':TYPES.get(r['t'], str(r['t'])),
                               'parts_only':True, 'area':round(og.area), 'centroid':loc(oc.x, oc.y), 'ring':[loc(x, y) for x, y in (og.exterior.coords if og.geom_type == 'Polygon' else max(og.geoms, key=lambda q: q.area).exterior.coords)][:-1], 'parts':[e]})
    # roads: the app's centrelines; bridges / flyovers kept whole when inside the box (elev = deck height per vertex)
    for i in RT.query(bx):
        l = R_lines[int(i)]
        if l['c'] > 17: continue
        lg = LineString(l['pts']); el = l['elev']
        if lg.within(bx) or el is None:
            gg = lg.intersection(bx)
            for ln in (gg.geoms if hasattr(gg, 'geoms') else [gg]):
                if ln.geom_type == 'LineString' and ln.length > 8:
                    e = {'cls':l['c'], 'name':l['name'], 'zh':l['zh'], 'bridge':l['br'], 'pts':[loc(x, y) for x, y in ln.coords]}
                    if el is not None and lg.within(bx): e['elev'] = [round(v, 1) for v in el]
                    T['roads'].append(e)
        else:
            keep = [(c, h) for c, h in zip(l['pts'], el) if bx.contains(Point(c))]
            if len(keep) >= 2: T['roads'].append({'cls':l['c'], 'name':l['name'], 'zh':l['zh'], 'bridge':l['br'], 'pts':[loc(*c) for c, h in keep], 'elev':[round(h, 1) for c, h in keep]})
    # land-use areas clipped to the box (SITE keep polygons, parks, piers, campuses ...)
    for o in OSM['a']:
        if not o['g'].intersects(bx): continue
        gg = o['g'].intersection(bx)
        for q in (gg.geoms if hasattr(gg, 'geoms') else [gg]):
            if q.geom_type == 'Polygon' and q.area > 50:
                T['areas'].append({'osm':o['id'], 'kind':o['kind'], 'name':o['tags'].get('name', ''), 'area':round(q.area), 'ring':[loc(x, y) for x, y in q.simplify(0.5).exterior.coords][:-1]})
    for n in OSM['n']:
        x, y = n['xy']
        if bx.contains(Point(x, y)):
            T['pois'].append({'osm':n['id'], 'name':n['tags']['name'], 'tags':{k:v for k, v in n['tags'].items() if k in ('tourism', 'amenity', 'historic', 'man_made', 'leisure', 'building', 'height', 'railway', 'natural', 'shop', 'aeroway', 'public_transport', 'wikidata')}, 'at':loc(x, y)})
    T['pois'] = sorted(T['pois'], key=lambda p: math.hypot(*p['at']))[:150]
    return T
def prep_osm(el):
    b, p, a, n = [], [], [], []
    for e in el:
        t = e.get('tags', {}); i = e['type'][0] + str(e['id'])
        if e['type'] == 'node':
            if t.get('name'): n.append({'id':i, 'tags':t, 'xy':A.w(e['lon'], e['lat'])})
            continue
        gs = osm_polys(e)
        if not gs: continue
        g = unary_union(gs)
        if t.get('building:part'): p.append({'id':i, 'tags':t, 'g':g})
        elif t.get('building'): b.append({'id':i, 'tags':t, 'g':g})
        else:
            kind = next((v for k, vs in AREA_KEYS.items() if t.get(k) in vs for v in [k + '=' + t.get(k)]), None)
            if kind: a.append({'id':i, 'tags':t, 'g':g, 'kind':kind})
    seen = set(); dd = lambda L: [x for x in L if not (x['id'] in seen or seen.add(x['id']))]
    b, p, a, n = dd(b), dd(p), dd(a), dd(n)
    return {'b':b, 'bt':STRtree([o['g'] for o in b]) if b else STRtree([Point(0, 0)]), 'p':p, 'pt':STRtree([o['g'] for o in p]) if p else STRtree([Point(1e9, 1e9)]), 'a':a, 'n':n}
NOTE = ('Local metres around each anchor: +x east, +z south (three.js local axes before rotation). buildings = the app\'s own records (site/nycdata, '
        'what it draws and hides under a landmark hull): h / base = the app heights (m; from the New York City building import where mapped, else '
        'estimated), osm = the OSM way / relation the footprint came from (match = IoU), h_osm / levels = the OSM tags, parts = the app\'s building:part '
        'tiers (base / top) with their OSM part id. roads: cls as in the app, elev = the app\'s deck height above the ground per vertex (bridges kept whole '
        'when inside the box). areas: OSM land-use polygons clipped to the box. pois: named OSM nodes. ground = terrain height at the anchor. '
        'radius = max(1.6 r, r + 60), capped at 700 m. Heights of towers in the data are often wrong: use the verified h of the target.')
def run(targets, outpath):
    t0 = time.time(); boxes = []
    for k, lat, lon, rad, meta in targets:
        ax, ay = A.w(lon, lat); (w0, s0), (e0, n0) = A.ll(ax - rad, ay - rad), A.ll(ax + rad, ay + rad); boxes.append('%.6f,%.6f,%.6f,%.6f' % (s0, w0, n0, e0))
    OSM = prep_osm(fetch_osm(boxes)); print('osm: buildings', len(OSM['b']), 'parts', len(OSM['p']), 'areas', len(OSM['a']), 'pois', len(OSM['n']), '%.0f s' % (time.time() - t0), flush=True)
    R_lines = A.roads(); RT = STRtree([LineString(l['pts']) if len(l['pts']) >= 2 else Point(l['pts'][0]) for l in R_lines])
    out = {'note':NOTE, 'tool':'R/lm50/ny50_refs.py (app data site/nycdata + OSM Overpass %s)' % time.strftime('%Y-%m-%d'), 'targets':{}}
    for k, lat, lon, rad, meta in targets:
        ax, ay = A.w(lon, lat); apb = A.buildings(ax - rad, ay - rad, ax + rad, ay + rad)
        T = build_target(k, meta, lat, lon, rad, OSM, apb, R_lines, RT); out['targets'][k] = T
        print(k, len(T['buildings']), 'buildings', sum(len(b.get('parts', [])) for b in T['buildings']), 'parts', len(T['roads']), 'roads', len(T['areas']), 'areas', len(T['pois']), 'pois', flush=True)
    json.dump(out, open(outpath, 'w'), separators=(',', ':'), ensure_ascii=False); print('->', outpath, '%.1f MB' % (os.path.getsize(outpath)/1e6), '%.0f s' % (time.time() - t0))
if __name__ == '__main__':
    if sys.argv[1] == '--one':
        k, lat, lon, rad, op = sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), int(sys.argv[5]), sys.argv[6]
        run([(k, lat, lon, rad, {'key':k, 'note':'corrected anchor'})], op)
    else:
        TG = json.load(open(sys.argv[1])); od = sys.argv[2]; groups = sys.argv[3:] or sorted(set(t['group'] for t in TG))
        for g in groups:
            run([(t['key'], t['lat'], t['lon'], rad_of(t['r']), t) for t in TG if t['group'] == g], os.path.join(od, 'ref_%s.json' % g))
