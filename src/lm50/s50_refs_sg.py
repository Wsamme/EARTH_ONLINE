# lm50 (Singapore): reference data for the round-lm50 targets — same output format as lm40/s40_refs.py (ref_<group>.json).
# Why a new tool: the lm40 pipeline read SC/sgdata/base15.pkl + SC/sgreal/out/{buildings,roads}.pkl + SC/lm40/kit/osm_of.pkl,
# and none of these exist any more. This one rebuilds the same content from what is left:
#   - buildings / parts / roads / bridge deck heights: decoded from the PRODUCTION data the app streams
#     (/home/claude/earth_online/site/sgdata/sg_bld.bin, sg_roads.bin, sg_base.bin) — exactly what the app draws and hides;
#   - osm ids, names, floors, OSM heights, land-use areas and named POIs: OSM API 0.6 /map (api.openstreetmap.org) for each
#     target box, cached gzip in SC/lm50/sg/osm/; each app footprint gets the OSM way / relation it overlaps best (IoU >= 0.5,
#     else '-'), the app's part records are grouped back under their building outline (parts: base / top / ring).
# Local metres around each anchor: +x east, +z south. Ref radius RR = max(1.6 r, r + 60), capped at 700 m.
# usage:  cd SC && bash lm33/kit/heavy.sh python3 /home/claude/earth_online/src/lm50/s50_refs_sg.py [group ...]   (all groups if none)
#         REREF='<group>_<n>|<key>|<lat>|<lon>|<radius>' ... python3 s50_refs_sg.py <group>_<n>   -> ref_<group>_<n>.json (one corrected anchor)
# output: /home/claude/earth_online/src/lm50/ref_<group>.json
import sys, os, json, gzip, math, time, urllib.request, collections
import xml.etree.ElementTree as ET
from shapely.geometry import Polygon, box, Point, LineString
from shapely.ops import unary_union
from shapely.strtree import STRtree
R = '/home/claude/earth_online/src/'; SITE = '/home/claude/earth_online/site/sgdata/'
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'; CACHE = SC + 'lm50/sg/osm/'
LON0, LAT0, MX, MY = 103.845, 1.315, 111290.5, 110574.0
def w(lon, lat): return ((lon - LON0)*MX, (lat - LAT0)*MY)
def ll(x, y): return (LON0 + x/MX, LAT0 + y/MY)
TYPES = {0:'generic', 1:'HDB', 2:'condo', 3:'house', 4:'commercial', 5:'office', 6:'industrial', 7:'civic', 8:'religious', 9:'hospital', 10:'transport', 11:'car park', 12:'hotel', 13:'shed', 14:'foreign', 15:'tank'}
AREA_KINDS = {'park', 'garden', 'zoo', 'university', 'college', 'school', 'nature_reserve', 'wetland', 'beach', 'sand', 'pier', 'golf_course', 'recreation_ground', 'pitch', 'military', 'hospital', 'cemetery', 'forest', 'wood', 'grass', 'meadow', 'pedestrian', 'commercial', 'dam', 'protected_area', 'stadium', 'sports_centre', 'place_of_worship', 'theme_park', 'water_park', 'marina', 'harbour', 'industrial', 'railway', 'retail'}
SKIP_POI = {'bench', 'waste_basket', 'atm', 'vending_machine', 'bicycle_parking', 'parking_entrance', 'bus_stop', 'toilets', 'taxi', 'parking', 'recycling', 'drinking_water', 'charging_station', 'motorcycle_parking', 'post_box', 'telephone', 'fire_hydrant', 'street_lamp'}

# ---------------------------------------------------------------- production data decoders (format: sgreal/s7_encode.py)
class Rd:
    def __init__(s, b): s.b = b; s.o = 0
    def u8(s): v = s.b[s.o]; s.o += 1; return v
    def vu(s):
        v = 0; m = 1
        while True:
            c = s.b[s.o]; s.o += 1; v += (c & 127)*m; m <<= 7
            if not c & 128: return v
    def vs(s): v = s.vu(); return -(v + 1)//2 if v & 1 else v//2
def load_bld():
    d = Rd(gzip.decompress(open(SITE + 'sg_bld.bin', 'rb').read())); assert bytes(d.b[:4]) == b'SGB1'; d.o = 4
    T = d.vu(); TX = d.vu(); H0 = T*TX/2; nT = d.vu(); out = []
    for _ in range(nT):
        ti = d.vu(); n = d.vu(); ox = -H0 + (ti % TX)*T; oy = -H0 + (ti // TX)*T
        for k in range(n):
            f = d.u8(); h = d.vu()/10; base = d.vu()/10; d.o += 3; rs = d.u8()
            if rs == 255: d.o += 3
            seed = d.u8(); nr = d.vu(); rings = []; px = py = 0
            for r in range(nr):
                m = d.vu(); P = []
                for i in range(m): px += d.vs(); py += d.vs(); P.append((ox + px/4, oy + py/4))
                rings.append(P)
            out.append({'t':f & 31, 'foreign':bool(f & 32), 'part':bool(f & 64), 'h':h, 'base':base, 'seed':seed, 'rings':rings, 'ti':ti, 'k':k})
    return out
def load_names():
    raw = gzip.decompress(open(SITE + 'sg_base.bin', 'rb').read())
    try: B = json.loads(raw)
    except Exception: return None
    return B.get('names')
def load_roads():
    d = Rd(gzip.decompress(open(SITE + 'sg_roads.bin', 'rb').read())); assert bytes(d.b[:4]) == b'SGR1'; d.o = 4
    n = d.vu(); px = py = 0; out = []
    for i in range(n):
        c = d.u8(); f = d.u8(); ni = d.vu(); ri = d.vu(); np_ = d.vu(); P = []
        for k in range(np_): px += d.vs(); py += d.vs(); P.append((px/4, py/4))
        E = None
        if f & 4: sc = 2.5 if f & 32 else 5; E = [d.u8()/sc for _ in range(np_)]
        out.append({'c':c, 'br':bool(f & 2), 'ni':ni, 'pts':P, 'elev':E})
    return out

# ---------------------------------------------------------------- OSM API (cached)
def osm_map(lat0, lon0, lat1, lon1, depth=0):
    os.makedirs(CACHE, exist_ok=True)
    fn = CACHE + '%.5f_%.5f_%.5f_%.5f.osm.gz' % (lat0, lon0, lat1, lon1)
    if os.path.exists(fn): return [gzip.decompress(open(fn, 'rb').read())]
    url = 'https://api.openstreetmap.org/api/0.6/map?bbox=%.6f,%.6f,%.6f,%.6f' % (lon0, lat0, lon1, lat1)
    for a in range(4):
        try:
            q = urllib.request.Request(url, headers={'User-Agent':'citybrush-refs/1.0'})
            data = urllib.request.urlopen(q, timeout=120).read(); open(fn, 'wb').write(gzip.compress(data, 6)); time.sleep(1.0); return [data]
        except urllib.error.HTTPError as e:
            if e.code == 400 and depth < 4:     # too many nodes: split in four
                lm, om = (lat0 + lat1)/2, (lon0 + lon1)/2
                return sum([osm_map(a0, o0, a1, o1, depth + 1) for a0, a1 in ((lat0, lm), (lm, lat1)) for o0, o1 in ((lon0, om), (om, lon1))], [])
            if e.code in (429, 509, 503, 504): time.sleep(10*(a + 1)); continue
            raise
        except Exception as e:
            print('  osm retry', a, e); time.sleep(5*(a + 1))
    raise RuntimeError('OSM API failed for ' + url)
def parse_osm(chunks):
    nodes, ways, rels = {}, {}, {}
    for data in chunks:
        root = ET.fromstring(data)
        for el in root:
            if el.tag == 'node':
                nodes[el.get('id')] = (float(el.get('lon')), float(el.get('lat')), {t.get('k'):t.get('v') for t in el.findall('tag')})
            elif el.tag == 'way':
                ways[el.get('id')] = ([nd.get('ref') for nd in el.findall('nd')], {t.get('k'):t.get('v') for t in el.findall('tag')})
            elif el.tag == 'relation':
                rels[el.get('id')] = ([(m.get('type'), m.get('ref'), m.get('role')) for m in el.findall('member')], {t.get('k'):t.get('v') for t in el.findall('tag')})
    return nodes, ways, rels
def way_poly(nodes, refs):
    pts = [w(*nodes[r][:2]) for r in refs if r in nodes]
    if len(pts) < 4 or refs[0] != refs[-1] or len(pts) != len(refs): return None
    g = Polygon(pts)
    if not g.is_valid: g = g.buffer(0)
    return g if g.area > 1 else None
def rel_poly(nodes, ways, members):
    outer = [ways[r][0] for t, r, role in members if t == 'way' and role in ('outer', '') and r in ways]
    if not outer: return None
    segs = [[w(*nodes[x][:2]) for x in rf if x in nodes] for rf in outer]
    try:
        from shapely.ops import polygonize
        g = unary_union(list(polygonize([LineString(s) for s in segs if len(s) >= 2])))
        return g if not g.is_empty and g.area > 1 else None
    except Exception: return None
def num(v):
    if v is None: return None
    try: return float(str(v).replace('m', '').replace(',', '.').split(';')[0].strip())
    except Exception: return None

def main():
    T50 = json.load(open(R + 'lm50/targets_sg.json'))
    groups = collections.OrderedDict()
    for t in T50: groups.setdefault(t['group'], []).append(t)
    if os.environ.get('REREF'):
        g, k, la, lo, rr = os.environ['REREF'].split('|'); base = dict(next((t for t in T50 if t['key'] == k), {'key':k}))
        base.update(lat=float(la), lon=float(lo), _rr=int(rr)); groups = {g:[base]}
    want = sys.argv[1:] or list(groups)
    print('decoding production data ...'); BL = load_bld(); RDS = load_roads(); NAMES = load_names() or []
    # building records -> shapely; parts of one building = consecutive part records with the same seed in one tile
    recs = []
    for b in BL:
        try:
            g = Polygon(b['rings'][0], b['rings'][1:]) if len(b['rings'][0]) >= 3 else None
            if g is not None and not g.is_valid: g = g.buffer(0)
        except Exception: g = None
        if g is None or g.is_empty: continue
        b['g'] = g; recs.append(b)
    grp_id = {}; gid = 0; prev = None
    for b in recs:
        if b['part']:
            if not (prev and prev['part'] and prev['seed'] == b['seed'] and prev['ti'] == b['ti'] and prev['k'] == b['k'] - 1): gid += 1
            grp_id[id(b)] = gid
        prev = b
    BT = STRtree([b['g'] for b in recs])
    rl = [(r, LineString(r['pts'])) for r in RDS if r['c'] <= 12 and len(r['pts']) >= 2]
    RT = STRtree([g for r, g in rl])
    for grp in want:
        if grp not in groups: print('no group', grp); continue
        out = {'note':'Round lm50 (s50_refs_sg.py). Local metres around each anchor: +x east, +z south. buildings/parts/roads are the PRODUCTION app data (sgdata/sg_bld.bin, sg_roads.bin) = what the app draws and hides; h = the app height (OSM height / levels, else ESTIMATED: est true) and often wrong for towers: use meta.h / your research. osm / name / floors / osm_h come from the OSM API footprint overlapping the app footprint best (IoU >= 0.5; osm "-" = no match). parts = the app part records of one building (base / top / ring). roads[].br = bridge (kept whole, elev = the app deck height per vertex, m). areas = OSM land-use polygons with a node in the box, clipped to it. pois = named OSM nodes.', 'targets':{}}
        for t in groups[grp]:
            key = t['key']; lat, lon = t['lat'], t['lon']; rad = min(700, t.get('_rr') or int(max(t['r']*1.6, t['r'] + 60)))
            ax, ay = w(lon, lat); bx = box(ax - rad, ay - rad, ax + rad, ay + rad)
            loc = lambda x, y: [round(x - ax, 1), round(-(y - ay), 1)]
            dla, dlo = rad/MY + 0.0003, rad/MX + 0.0003
            nodes, ways, rels = parse_osm(osm_map(lat - dla, lon - dlo, lat + dla, lon + dlo))
            # OSM footprints in the box
            obld = []; oparts = []; oareas = []
            for wid, (refs, tg) in ways.items():
                kind = tg.get('landuse') or tg.get('leisure') or tg.get('amenity') or tg.get('natural') or tg.get('tourism') or tg.get('man_made')
                if 'building' in tg or 'building:part' in tg or (kind in AREA_KINDS):
                    g = way_poly(nodes, refs)
                    if g is None: continue
                    if 'building:part' in tg: oparts.append(('w' + wid, tg, g))
                    elif 'building' in tg: obld.append(('w' + wid, tg, g))
                    if kind in AREA_KINDS: oareas.append(('w' + wid, kind, tg, g))
            for rid, (mem, tg) in rels.items():
                if tg.get('type') not in ('multipolygon', 'building'): continue
                kind = tg.get('landuse') or tg.get('leisure') or tg.get('amenity') or tg.get('natural') or tg.get('tourism')
                if 'building' in tg or kind in AREA_KINDS:
                    g = rel_poly(nodes, ways, mem)
                    if g is None: continue
                    if 'building' in tg: obld.append(('r' + rid, tg, g))
                    if kind in AREA_KINDS: oareas.append(('r' + rid, kind, tg, g))
            OT = STRtree([g for _, _, g in obld]) if obld else None
            PT = STRtree([g for _, _, g in oparts]) if oparts else None
            def best(g, tree, lst):
                if tree is None: return None
                bi, bv = None, 0.0
                for i in tree.query(g):
                    o = lst[int(i)][2]
                    try: inter = g.intersection(o).area; iou = inter/(g.union(o).area or 1)
                    except Exception: continue
                    if iou > bv: bi, bv = int(i), iou
                return (lst[bi], bv) if bi is not None and bv >= 0.5 else None
            def ent_of(m):
                if not m: return {'osm':'-', 'name':None, 'floors':None, 'osm_h':None}
                (oid, tg, g), iou = m
                return {'osm':oid, 'name':tg.get('name') or tg.get('name:en'), 'floors':num(tg.get('building:levels')), 'osm_h':num(tg.get('height'))}
            T = {'name':t.get('en', key), 'meta':{k:v for k, v in t.items() if k not in ('lat', 'lon', '_rr')}, 'anchor':{'lat':lat, 'lon':lon}, 'radius':rad, 'buildings':[], 'roads':[], 'areas':[], 'pois':[]}
            small = rad > 450
            hits = [recs[int(i)] for i in BT.query(bx)]; hits = [b for b in hits if b['g'].intersects(bx)]
            partgroups = collections.OrderedDict()
            for b in hits:
                if b['part']: partgroups.setdefault(grp_id[id(b)], []).append(b); continue
                g = b['g']
                if small and g.area < 40: continue
                c = g.centroid; e = ent_of(best(g, OT, obld))
                T['buildings'].append({'name':e['name'], 'osm':e['osm'], 'h':b['h'], 'base':b['base'], 'floors':e['floors'], 'osm_h':e['osm_h'], 'est':e['floors'] is None and e['osm_h'] is None and b['t'] != 1,
                    'type':TYPES.get(b['t'], str(b['t'])), 'area':round(g.area), 'centroid':loc(c.x, c.y), 'ring':[loc(x, y) for x, y in list(g.exterior.coords)[:-1]]})
            for gi, ps in partgroups.items():
                U = unary_union([p['g'] for p in ps]); hull = U if U.geom_type == 'Polygon' else U.convex_hull
                m = best(hull, OT, obld)
                if m and m[0][2].geom_type == 'Polygon': outline = m[0][2]
                else: outline = hull
                e = ent_of(m if m else None)
                if not m:   # no outline match: try the OSM outline that contains most of the parts
                    for oid, tg, og in obld:
                        if og.intersection(U).area > 0.6*U.area: e = ent_of(((oid, tg, og), 1.0)); outline = og if og.geom_type == 'Polygon' else outline; break
                c = outline.centroid
                T['buildings'].append({'name':e['name'], 'osm':e['osm'], 'h':max(p['h'] for p in ps), 'base':0.0, 'floors':e['floors'], 'osm_h':e['osm_h'], 'est':False, 'type':TYPES.get(ps[0]['t'], str(ps[0]['t'])),
                    'area':round(outline.area), 'centroid':loc(c.x, c.y), 'ring':[loc(x, y) for x, y in list(outline.exterior.coords)[:-1]],
                    'parts':[{'base':p['base'], 'top':p['h'], 'osm':ent_of(best(p['g'], PT, oparts))['osm'], 'ring':[loc(x, y) for x, y in list(p['g'].exterior.coords)[:-1]]} for p in ps]})
            for i in RT.query(bx):
                r, g = rl[int(i)]
                if not g.intersects(bx): continue
                nm = NAMES[r['ni']] if r['ni'] and r['ni'] < len(NAMES) else None
                nm = (nm[0] or nm[1]) if isinstance(nm, list) else nm
                if r['br']:
                    e = {'cls':r['c'], 'name':nm, 'br':True, 'pts':[loc(x, y) for x, y in r['pts']]}
                    if r['elev']: e['elev'] = [round(v, 1) for v in r['elev']]
                    T['roads'].append(e); continue
                gg = g.intersection(bx)
                for ln in (gg.geoms if hasattr(gg, 'geoms') else [gg]):
                    if ln.geom_type == 'LineString' and ln.length > 8: T['roads'].append({'cls':r['c'], 'name':nm, 'pts':[loc(x, y) for x, y in ln.coords]})
            for oid, kind, tg, g in oareas:
                if not g.intersects(bx) or g.area < 1500: continue
                gg = g.intersection(bx)
                for pg in (gg.geoms if hasattr(gg, 'geoms') else [gg]):
                    if pg.geom_type != 'Polygon' or pg.area < 800: continue
                    pg = pg.simplify(1.0)
                    T['areas'].append({'kind':kind, 'name':tg.get('name'), 'osm':oid, 'area':round(g.area), 'ring':[loc(x, y) for x, y in list(pg.exterior.coords)[:-1]]})
            for nid, (lo_, la_, tg) in nodes.items():
                if not tg.get('name'): continue
                kind = tg.get('amenity') or tg.get('tourism') or tg.get('historic') or tg.get('leisure') or tg.get('shop') or tg.get('public_transport') or tg.get('railway') or tg.get('man_made') or tg.get('building') or tg.get('office')
                if kind in SKIP_POI: continue
                q = w(lo_, la_)
                if bx.contains(Point(q)): T['pois'].append({'name':tg['name'], 'kind':kind, 'osm':'n' + nid, 'at':loc(*q)})
            T['pois'].sort(key=lambda p: math.hypot(*p['at'])); T['pois'] = T['pois'][:80]
            out['targets'][key] = T
            nm_ = sum(1 for b in T['buildings'] if b['osm'] != '-')
            print(grp, key, 'r', rad, 'bld', len(T['buildings']), '(osm-matched %d)' % nm_, 'roads', len(T['roads']), 'areas', len(T['areas']), 'pois', len(T['pois']), flush=True)
        json.dump(out, open(R + 'lm50/ref_%s.json' % grp, 'w'), ensure_ascii=False, separators=(',', ':'))
        print('wrote', R + 'lm50/ref_%s.json' % grp)
if __name__ == '__main__': main()
