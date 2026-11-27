# lm50 Tokyo: reference data per target group -> R/lm50/ref_<group>.json (format of the lm40 / v37 refs: anchor, radius, buildings with
# rings / heights / osm ids / parts, roads with bridge elevations, areas, pois, terrain).
# The v37 Tokyo refs tool (tyoreal/b9_refs.py) needs the pipeline outputs (tyoreal/out/*.pkl from the Kantō .pbf), which are no longer
# on this machine, so this tool is the HK/SG refs design re-built on what is here:
#   * buildings, parts, roads, bridge decks, POIs, terrain = the app's own staged data (site/tyodata, decoded by ty50_app.py): exactly
#     what the page draws (footprints simplified 0.35 m, heights as encoded: OSM / PLATEAU values or estimates)
#   * osm ids, names, levels, height tags, land-use areas = current OSM via Overpass (ty50_osm.py caches), matched to the app records
# usage: python3 ty50_refs.py [group ...]            (default: every group in targets_ty.json)
#        python3 ty50_refs.py --reref <out_suffix> <key> <lat> <lon> <radius>   (a corrected anchor for one key -> ref_<group>_<suffix>.json)
import json, os, sys, math, collections
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import ty50_app as A, ty50_osm as O
import numpy as np
import shapely
from shapely.geometry import Polygon, Point, LineString, box
from ty50_geom import geom
TYPES = A.TYPES
AREA_KEYS = ('landuse', 'leisure', 'amenity', 'tourism', 'historic', 'man_made', 'natural')
def rnd(v): return round(float(v), 1)
def load_targets():
    return json.load(open(os.path.join(HERE, 'targets_ty.json')))['targets']
_osm = {}
def osm_index(group):
    if group in _osm: return _osm[group]
    E = O.load(group)['elements']; bl, al, nodes = [], [], []
    for e in E:
        t = e.get('tags', {})
        if e['type'] == 'node':
            if t.get('name'): nodes.append(e)
            continue
        g = geom(e)
        if g is None or g.is_empty: continue
        if (t.get('building') or t.get('building:part')) and g.geom_type in ('Polygon', 'MultiPolygon'):
            bl.append((e, g, bool(t.get('building:part')) and not t.get('building')))
        k = next((k for k in AREA_KEYS if k in t), None)
        if k and g.geom_type in ('Polygon', 'MultiPolygon') and not t.get('building'): al.append((e, g, k))
    BT = shapely.STRtree([b[1] for b in bl]); AT = shapely.STRtree([a[1] for a in al]) if al else None
    _osm[group] = (bl, BT, al, AT, nodes); return _osm[group]
_rt = None
def road_tree():
    global _rt
    if _rt is None:
        R = A.roads(); G = [LineString(l['pts']) if len(l['pts']) >= 2 else Point(l['pts'][0]) for l in R]
        _rt = (R, G, shapely.STRtree(G))
    return _rt
def oid(e): return e['type'][0] + str(e['id'])
def make(meta, group, lat, lon, rad):
    ax, ay = A.w(lon, lat); bx = box(ax - rad, ay - rad, ax + rad, ay + rad)
    loc = lambda x, y: [rnd(x - ax), rnd(-(y - ay))]
    T = {'name':meta.get('en'), 'meta':{k: v for k, v in meta.items() if k not in ('lat', 'lon')}, 'anchor':{'lat':lat, 'lon':lon}, 'radius':rad,
         'ground':rnd(A.ground(ax, ay)), 'buildings':[], 'roads':[], 'areas':[], 'pois':[]}
    st = 35 if rad <= 450 else 70; nn = int(rad//st)
    T['terrain'] = {'step':st, 'n':2*nn + 1, 'rows_north_to_south':[[rnd(A.ground(ax + i*st, ay - j*st)) for i in range(-nn, nn + 1)] for j in range(-nn, nn + 1)]}
    bl, BT, al, AT, nodes = osm_index(group)
    recs = A.buildings(ax - rad, ay - rad, ax + rad, ay + rad)
    small = rad > 450
    outl = [b for b in recs if not b['part']]; parts = [b for b in recs if b['part']]
    polys = [Polygon(b['rings'][0]).buffer(0) for b in outl]
    used_parts = set()
    def match(pt, poly):
        best = None
        for i in BT.query(pt):
            e, g, ispart = bl[int(i)]
            if ispart or not g.contains(pt): continue
            iou = g.intersection(poly).area/max(1, g.union(poly).area) if poly is not None else 0
            if best is None or iou > best[0]: best = (iou, e, g)
        return best
    for b, P in zip(outl, polys):
        if small and b['area'] < 40: continue
        pt = Point(b['cx'], b['cy']); m = match(pt, P); t = m[1].get('tags', {}) if m else {}
        e = {'name':t.get('name:en') or t.get('name'), 'ja':t.get('name'), 'osm':oid(m[1]) if m else '-', 'iou':round(m[0], 2) if m else None,
             'h':rnd(b['h']), 'floors':t.get('building:levels'), 'h_osm':t.get('height'), 'est':not (t.get('height') or t.get('building:levels')),
             'type':TYPES.get(b['t'], str(b['t'])), 'area':round(b['area']), 'centroid':loc(b['cx'], b['cy']), 'ring':[loc(x, y) for x, y in b['rings'][0]]}
        if len(b['rings']) > 1: e['holes'] = [[loc(x, y) for x, y in R] for R in b['rings'][1:]]
        ps = []; bx0, by0, bx1, by1 = P.bounds; PB = None
        for k, q in enumerate(parts):
            if k in used_parts or not (bx0 - 1 <= q['cx'] <= bx1 + 1 and by0 - 1 <= q['cy'] <= by1 + 1): continue
            PB = PB or P.buffer(1)
            if PB.contains(Point(q['cx'], q['cy'])): ps.append({'base':rnd(q['base']), 'top':rnd(q['h']), 'ring':[loc(x, y) for x, y in q['rings'][0]]}); used_parts.add(k)
        if ps: e['parts'] = ps; e['outline_drawn_to'] = rnd(b['h'])
        T['buildings'].append(e)
    # parts whose building outline the app does not draw (a part starts at the ground): grouped under their OSM building
    orphan = collections.defaultdict(list)
    for k, q in enumerate(parts):
        if k in used_parts: continue
        pt = Point(q['cx'], q['cy']); m = match(pt, Polygon(q['rings'][0]).buffer(0))
        orphan[oid(m[1]) if m else 'part%d' % k].append((q, m))
    for key, L in orphan.items():
        m = L[0][1]; t = m[1].get('tags', {}) if m else {}
        if m:
            g = m[2]; g = max(g.geoms, key=lambda x: x.area) if g.geom_type == 'MultiPolygon' else g; ring = [loc(x, y) for x, y in list(g.exterior.coords)[:-1]]; c = g.centroid
        else:
            q = L[0][0]; ring = [loc(x, y) for x, y in q['rings'][0]]; c = Point(q['cx'], q['cy'])
        T['buildings'].append({'name':t.get('name:en') or t.get('name'), 'ja':t.get('name'), 'osm':key if m else '-', 'h':rnd(max(q['h'] for q, _ in L)),
            'floors':t.get('building:levels'), 'h_osm':t.get('height'), 'est':not (t.get('height') or t.get('building:levels')), 'type':'parts only',
            'area':round(Polygon([(p[0], p[1]) for p in ring]).area), 'centroid':loc(c.x, c.y), 'ring':ring, 'outline_drawn_to':None,
            'parts':[{'base':rnd(q['base']), 'top':rnd(q['h']), 'ring':[loc(x, y) for x, y in q['rings'][0]]} for q, _ in L]})
    # roads: bridges / flyovers kept whole (elev per vertex = the app's deck height above the ground), the rest clipped to the box
    R, G, RT = road_tree()
    for i in sorted(int(q) for q in RT.query(bx, predicate='intersects')):
        l = R[i]; g = G[i]
        if l['br'] and l['elev'] is not None:
            T['roads'].append({'cls':l['c'], 'name':l['name'], 'zh':l['zh'], 'ref':l['ref'], 'br':True, 'pts':[loc(x, y) for x, y in l['pts']], 'elev':[rnd(v) for v in l['elev']]})
            continue
        gg = g.intersection(bx)
        for ln in (gg.geoms if hasattr(gg, 'geoms') else [gg]):
            if ln.geom_type == 'LineString' and ln.length > 6:
                e = {'cls':l['c'], 'name':l['name'], 'zh':l['zh'], 'ref':l['ref'], 'br':l['br'], 'pts':[loc(x, y) for x, y in ln.coords]}
                T['roads'].append(e)
    # land-use / leisure / amenity … areas clipped to the box (for SITE keep polygons and context)
    if AT is not None:
        for i in AT.query(bx, predicate='intersects'):
            e, g, k = al[int(i)]; t = e.get('tags', {}); gg = g.intersection(bx)
            if gg.is_empty or gg.area < 150: continue
            for p in (gg.geoms if hasattr(gg, 'geoms') else [gg]):
                if p.geom_type != 'Polygon' or p.area < 150: continue
                T['areas'].append({'kind':t[k], 'key':k, 'name':t.get('name:en') or t.get('name'), 'ja':t.get('name'), 'osm':oid(e), 'area':round(p.area),
                                   'ring':[loc(x, y) for x, y in list(p.simplify(0.5).exterior.coords)[:-1]]})
    # POIs: the app's own (base.pois / stations) + OSM named nodes
    B = A.base()
    for p in B.get('pois', []):
        try:
            x, y = (p['x'], p['y']) if 'x' in p else (p[0], p[1])
        except Exception: continue
        if abs(x - ax) < rad and abs(y - ay) < rad: T['pois'].append({'src':'app', 'name':p.get('en'), 'zh':p.get('zh'), 'kind':p.get('k'), 'at':loc(x, y)})
    for p in B.get('stations', []):
        x, y = p['x'], p['y']
        if abs(x - ax) < rad and abs(y - ay) < rad: T['pois'].append({'src':'app-station', 'name':p.get('en'), 'zh':p.get('zh'), 'at':loc(x, y)})
    keep = ('tourism', 'amenity', 'historic', 'man_made', 'leisure', 'building', 'height', 'railway', 'natural', 'shop', 'religion', 'public_transport')
    for n in nodes:
        if 'lon' not in n: continue
        x, y = A.w(n['lon'], n['lat'])
        if abs(x - ax) < rad and abs(y - ay) < rad:
            t = n['tags']; T['pois'].append({'src':'osm', 'osm':'n%d' % n['id'], 'name':t.get('name'), 'en':t.get('name:en'), 'tags':{k: t[k] for k in keep if k in t}, 'at':loc(x, y)})
    T['pois'] = sorted(T['pois'], key=lambda p: math.hypot(*p['at']))[:150]
    return T
NOTE = ('Round lm50 (Tokyo). Local metres around each anchor: +x east, +z south (three.js local axes before rotation). buildings / parts / roads '
        '/ terrain = the app\'s own staged map data (site/tyodata, v37 build from the OSM Kantō extract of Oct 2026): exactly what the page '
        'draws; osm / name / ja / floors / h_osm = the current OSM building matched to the app record (iou = overlap of the two outlines; '
        '"-" = no OSM match). h = the app height (OSM / PLATEAU value or an estimate: est = true when OSM has neither height nor levels) - often '
        'wrong for towers: use meta.h / your research. parts: building:part pieces (base / top); a building with parts whose outline the app '
        'does not draw (a part starts at the ground) has type "parts only". roads: cls (0-1 freeway, 2-9 arterials, 10 local, 11 service, 12 '
        'path, 13 runway, 14 taxiway, 15 rail, 16 monorail, 17 pier); br = bridge; bridges / flyovers are kept whole with elev = the app\'s '
        'deck height above the ground per vertex. areas = OSM land-use / leisure / amenity / tourism / historic / man_made / water polygons '
        'clipped to the box. pois: src app (the page\'s labels) or osm (named nodes). radius = max(1.6 r, r + 60), capped at 700 m. '
        'ground = terrain height (m) at the anchor; terrain = grid rows north to south.')
def run_group(group, rows):
    out = {'note':NOTE, 'tool':'R/lm50/ty50_refs.py', 'targets':{}}
    for t in rows:
        rad = int(min(700, max(1.6*t['r'], t['r'] + 60)))
        out['targets'][t['key']] = T = make(t, group, t['lat'], t['lon'], rad)
        print(group, t['key'], len(T['buildings']), 'buildings', len(T['roads']), 'roads', len(T['areas']), 'areas', len(T['pois']), 'pois', flush=True)
    f = os.path.join(HERE, 'ref_%s.json' % group)
    json.dump(out, open(f, 'w'), separators=(',', ':'), ensure_ascii=False); print('wrote', f, round(os.path.getsize(f)/1e6, 1), 'MB', flush=True)
if __name__ == '__main__':
    TG = load_targets()
    if len(sys.argv) > 1 and sys.argv[1] == '--reref':
        suf, key, lat, lon, rad = sys.argv[2], sys.argv[3], float(sys.argv[4]), float(sys.argv[5]), int(sys.argv[6])
        t = next(x for x in TG if x['key'] == key); g = t['group']
        out = {'note':NOTE + ' Re-anchored copy for ' + key + '.', 'tool':'R/lm50/ty50_refs.py --reref', 'targets':{key: make(dict(t, lat=lat, lon=lon), g, lat, lon, rad)}}
        f = os.path.join(os.environ.get('REREF_DIR', HERE), 'ref_%s_%s.json' % (g, suf)); json.dump(out, open(f, 'w'), separators=(',', ':'), ensure_ascii=False); print('wrote', f)
        raise SystemExit(0)
    groups = sys.argv[1:] or sorted({t['group'] for t in TG})
    for g in groups: run_group(g, [t for t in TG if t['group'] == g])
