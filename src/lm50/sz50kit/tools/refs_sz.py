# Greater Bay map, Shenzhen lm50: reference data for the modellers, in the format of gbareal/targets/refs.py (gba/ref_<group>.json)
# plus 'areas' and 'meta' (as lm40). gbareal/out (the pipeline pickles refs.py reads) is gone from this machine, so this tool reads
# the app's own staged data instead (site/gbadata decoded by stage.py -> stage_sz.pkl: building rings / heights / types / parts, road
# lines with class / bridge flag / deck heights, the terrain grid) and takes OSM ids, names, levels, land-use areas and POIs from
# OSM (Overpass, cached per target box by osmbox.py). Local metres around the anchor: +x east, +z south.
# Code in src/lm50/sz50kit/tools, data in SC/lm50/sz (stage_sz.pkl ~126 MB, osmbox/ cache, web/geom.json). usage (H = SC/lm33/kit/heavy.sh):
#   python3 osmbox.py /home/claude/earth_online/src/lm50/targets_sz.json [group|key ...]            (network; no lock)
#   bash $H python3 refs_sz.py [group ...]                                                          -> src/lm50/ref_<group>.json
#   re-anchored refs for one key:  bash $H python3 refs_sz.py --reref sz50x_<n> <key> <lat> <lon> <radius m>
#                                  -> src/lm50/ref_sz50x_<n>.json (fetches the OSM box itself, ~10-60 s; then ~1 min under the lock)
#   if stage_sz.pkl is missing: bash $H python3 stage.py && bash $H python3 szcut.py  (decodes site/gbadata again, ~3 min, ~2 GB peak)
import sys, os, json, math, collections
SZ = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/lm50/sz/'
OUTD = '/home/claude/earth_online/src/lm50/'
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))   # code here, data in SZ
import appbld as A
import osmbox
from shapely.geometry import Polygon, Point, LineString, box
from shapely.ops import unary_union
from shapely.strtree import STRtree
TYPES = {14:'context (other region)', 0:'generic', 1:'hdb', 2:'apartment', 3:'house', 4:'commercial', 5:'office', 6:'industrial', 7:'civic', 8:'religious', 9:'hospital', 10:'transport', 11:'car park', 12:'hotel', 13:'shed', 15:'tank'}
NOTE = ('Greater Bay map frame (gbareal: lon0 114.052048203, lat0 22.656070182, 103014.2 / 110734.9 m per degree). Local metres around each anchor: '
        '+x east, +z south (three.js local axes before rotation). buildings = this build\'s footprints as the app has them (decoded from site/gbadata): '
        'ring, h (the app\'s height: OSM height / levels where mapped, otherwise an estimate; Shenzhen has levels on ~19 % of its OSM footprints, and '
        'part of the city comes from other footprint sources without heights), type, area, centroid; osm / name / zh / floors when an OSM building '
        'outline covers it (matched by position, so a footprint without osm is not in OSM or is split differently). parts = the app\'s building:part '
        'pieces inside the footprint with base / top. roads = the app\'s road lines: cls 0-1 freeway, 2-9 arterials, 10 local, 11 service, 12 path, '
        '13 runway, 14 taxiway, 15 rail, 16 people mover, 17 pier; bridge; elev = deck height above the ground per vertex (the app\'s data has no OSM '
        'layer). areas = OSM land-use / leisure / amenity / natural / tourism polygons clipped to the box. pois = named OSM nodes. terrain = ground '
        'heights (m) on a grid around the anchor (rows north to south; the app\'s grid). ground = terrain height at the anchor. sel = what was listed: '
        'the box, or for big sites only what lies within 200 m of the target\'s own footprint.')
def ring_of(P): return [A.w(lon, lat) for lon, lat in P]
def osm_polys(els):
    """OSM ways / relations of the box -> (kind, id, tags, polygon) in world metres"""
    out = []
    for e in els:
        t = e.get('tags', {}); rid = e['type'][0] + str(e['id'])
        try:
            if e['type'] == 'way' and 'geometry' in e:
                pts = [A.w(p['lon'], p['lat']) for p in e['geometry']]
                if len(pts) >= 4 and pts[0] == pts[-1]: out.append((rid, t, Polygon(pts).buffer(0)))
            elif e['type'] == 'relation':
                outers = [m for m in e.get('members', []) if m['type'] == 'way' and m.get('role') in ('outer', 'outline', '') and 'geometry' in m]
                inners = [m for m in e.get('members', []) if m['type'] == 'way' and m.get('role') == 'inner' and 'geometry' in m]
                import osmgeom
                OR = osmgeom.join([[[p['lon'], p['lat']] for p in m['geometry']] for m in outers]); IR = osmgeom.join([[[p['lon'], p['lat']] for p in m['geometry']] for m in inners])
                if OR:
                    g = unary_union([Polygon(ring_of(r)).buffer(0) for r in OR])
                    for r in IR: g = g.difference(Polygon(ring_of(r)).buffer(0))
                    out.append((rid, t, g))
        except Exception: pass
    return out
def terrain(ax, ay, rad):
    st = 35 if rad <= 700 else 70; nn = int(rad//st)
    return {'step':st, 'n':2*nn + 1, 'rows_north_to_south':[[round(A.ground(ax + i*st, ay - j*st), 1) for i in range(-nn, nn + 1)] for j in range(-nn, nn + 1)]}
AREA_KEYS = ('landuse', 'leisure', 'amenity', 'natural', 'tourism', 'man_made', 'historic')
def make(meta, key, lat, lon, rad, els, own=None):
    ax, ay = A.w(lon, lat); bx = box(ax - rad, ay - rad, ax + rad, ay + rad); sel = bx; selname = 'box'
    if rad > 800 and own is not None and not own.is_empty: sel = own.buffer(200).intersection(bx); selname = 'area+200m'
    loc = lambda x, y: [round(x - ax, 1), round(-(y - ay), 1)]
    T = {'name':(meta.get('en', key) + ' / ' + (meta.get('zh') or '')) if meta else key, 'meta':meta, 'anchor':{'lat':lat, 'lon':lon, 'osm':meta.get('osm') if meta else None},
         'radius':rad, 'sel':selname, 'ground':round(A.ground(ax, ay), 1), 'buildings':[], 'roads':[], 'areas':[], 'pois':[]}
    T['terrain'] = terrain(ax, ay, rad)
    OP = osm_polys(els)
    OB = [(i, t, g) for i, t, g in OP if (t.get('building') and t.get('building') != 'no') and not g.is_empty]
    OBT = STRtree([g for i, t, g in OB]) if OB else None
    # app buildings in the selection; parts attach to the non-part footprint that contains them
    idx = [int(i) for i in A.BT.query(sel, predicate='intersects')]
    base_recs = [i for i in idx if not A.S['bld'][i]['part']]; part_recs = [i for i in idx if A.S['bld'][i]['part']]
    BTl = STRtree([A.G[i] for i in base_recs]) if base_recs else None
    parts_of = collections.defaultdict(list); loose = []
    for i in part_recs:
        g = A.G[i]; p = g.representative_point(); host = None
        if BTl is not None:
            for j in BTl.query(p, predicate='intersects'): host = base_recs[int(j)]; break
        (parts_of[host].append(i) if host is not None else loose.append(i))
    def osm_match(g):
        if OBT is None: return None
        best = None; ba = 0
        for j in OBT.query(g):
            oi, t, og = OB[int(j)]
            try: a = og.intersection(g).area
            except Exception: continue
            if a > ba: ba, best = a, OB[int(j)]
        return best if best and ba > 0.4*min(g.area, best[2].area) else None
    for i in base_recs + loose:
        b = A.S['bld'][i]; g = A.G[i]
        if g.is_empty or (selname != 'box' and g.area < 60): continue
        c = g.centroid
        q = {'h':b['h'], 'type':TYPES.get(b['t'], str(b['t'])), 'area':round(g.area), 'centroid':loc(c.x, c.y), 'ring':[loc(x, y) for x, y in b['rings'][0]]}
        if b['base'] > 0: q['base'] = b['base']
        if len(b['rings']) > 1: q['holes'] = [[loc(x, y) for x, y in r] for r in b['rings'][1:]]
        if b['part']: q['part'] = True
        m = osm_match(g)
        if m:
            oi, t, og = m; q['osm'] = oi
            if t.get('name'): q['name'] = t.get('name:en') or t['name']
            if t.get('name'): q['zh'] = t['name']
            if t.get('building:levels'): q['floors'] = t['building:levels']
            if t.get('height'): q['h_osm'] = t['height']
        if parts_of.get(i): q['parts'] = [{'base':A.S['bld'][k]['base'], 'top':A.S['bld'][k]['h'], 'ring':[loc(x, y) for x, y in A.S['bld'][k]['rings'][0]]} for k in parts_of[i]]
        T['buildings'].append(q)
    # roads (the app's lines)
    for k in sorted(int(i) for i in A.LT.query(sel, predicate='intersects')):
        l = A.S['lines'][k]
        if l['c'] > 17: continue
        LG = A.LG[k]; el = l['E']; br = bool(l['f'] & 2)
        if el is None or LG.within(sel):
            gg = LG.intersection(sel)
            for ln in (gg.geoms if hasattr(gg, 'geoms') else [gg]):
                if ln.geom_type == 'LineString' and ln.length > 8:
                    q = {'cls':l['c'], 'bridge':br, 'pts':[loc(x, y) for x, y in ln.coords]}
                    if l['name']: q['name'] = l['name']
                    if el is not None and len(el) == len(l['P']): q['elev'] = [round(v, 1) for v in el]
                    T['roads'].append(q)
        else:   # elevated line crossing the selection: keep the vertices inside, with their deck heights
            keep = [(c, h) for c, h in zip(l['P'], el) if sel.contains(Point(c))] if len(el) == len(l['P']) else []
            if len(keep) >= 2:
                q = {'cls':l['c'], 'bridge':br, 'pts':[loc(*c) for c, h in keep], 'elev':[round(h, 1) for c, h in keep]}
                if l['name']: q['name'] = l['name']
                T['roads'].append(q)
    # areas
    for oi, t, g in OP:
        if t.get('building') and t.get('building') != 'no': continue
        kind = next((k + '=' + t[k] for k in AREA_KEYS if t.get(k)), None)
        if not kind or g.is_empty: continue
        try: gg = g.intersection(sel)
        except Exception: continue
        if gg.is_empty or gg.area < 200: continue
        for pg in (gg.geoms if hasattr(gg, 'geoms') else [gg]):
            if pg.geom_type != 'Polygon' or pg.area < 200: continue
            q = {'kind':kind, 'osm':oi, 'area':round(pg.area), 'ring':[loc(x, y) for x, y in list(pg.simplify(0.5).exterior.coords)[:-1]]}
            if t.get('name'): q['name'] = t['name']
            T['areas'].append(q)
    T['areas'].sort(key=lambda a: -a['area']); T['areas'] = T['areas'][:60]
    # pois
    PK = ('tourism', 'amenity', 'historic', 'man_made', 'leisure', 'building', 'height', 'railway', 'natural', 'aeroway', 'religion', 'shop', 'office')
    for e in els:
        if e['type'] != 'node' or not e.get('tags', {}).get('name'): continue
        x, y = A.w(e['lon'], e['lat'])
        if not sel.contains(Point(x, y)): continue
        t = e['tags']; T['pois'].append({'name':t['name'], 'tags':{a:v for a, v in t.items() if a in PK}, 'at':loc(x, y)})
    T['pois'] = sorted(T['pois'], key=lambda p: -len(p['tags']))[:80]
    return T
def own_poly(osm):
    import osmgeom
    G = osmgeom.load(); g = G.get(osm)
    if not g: return None
    P = unary_union([Polygon(ring_of(r)).buffer(0) for r in g['rings'] if len(r) >= 4])
    return P
if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--reref':
        name, key, lat, lon, rad = sys.argv[2], sys.argv[3], float(sys.argv[4]), float(sys.argv[5]), int(float(sys.argv[6]))
        TT = {t['key']: t for t in json.load(open(OUTD + 'targets_sz.json'))}
        meta = dict(TT.get(key, {'key':key})); meta['reref'] = {'lat':lat, 'lon':lon, 'radius':rad}
        d = osmbox.fetch_box('reref_' + name + '_' + key, lat, lon, rad)
        T = make(meta, key, lat, lon, rad, d['elements'])
        out = {'note':NOTE, 'targets':{key:T}}
        json.dump(out, open(OUTD + 'ref_%s.json' % name, 'w'), separators=(',', ':'), ensure_ascii=False)
        print('wrote', OUTD + 'ref_%s.json' % name, len(T['buildings']), 'buildings', len(T['roads']), 'roads', len(T['areas']), 'areas', len(T['pois']), 'pois')
        sys.exit()
    TJ = json.load(open(OUTD + 'targets_sz.json')); want = set(sys.argv[1:])
    groups = collections.OrderedDict()
    for t in TJ: groups.setdefault(t['group'], []).append(t)
    for grp, lst in groups.items():
        if want and grp not in want: continue
        out = {'note':NOTE, 'targets':{}}
        for t in lst:
            rad = osmbox.rad_of(t['r']); d = osmbox.fetch_box(t['key'], t['lat'], t['lon'], rad)
            T = make(t, t['key'], t['lat'], t['lon'], rad, d['elements'], own_poly(t['osm']) if rad > 800 else None)
            out['targets'][t['key']] = T
            print(grp, t['key'], rad, T['sel'], len(T['buildings']), 'buildings', len(T['roads']), 'roads', len(T['areas']), 'areas', len(T['pois']), 'pois', flush=True)
        f = OUTD + 'ref_%s.json' % grp
        json.dump(out, open(f, 'w'), separators=(',', ':'), ensure_ascii=False)
        print('wrote', f, os.path.getsize(f), flush=True)
    print('done')
