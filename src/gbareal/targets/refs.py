# Greater Bay map (gbareal): reference data for the Shenzhen / Dongguan landmark authors (hkreal/b9_refs.py for the new frame):
# real footprints / parts / roads (with deck heights) / POIs and the terrain around each target of gba/targets.json (targets.py),
# in local metres around the anchor (+x east, +z south) -> SC/gba/ref_<group>.json.  Reads gbareal/out (read only) and names.pkl here.
# Box = 1.6 r around the anchor (120 .. 1600 m); for big sites (box > 800 m) only what lies within 200 m of the target's own OSM area
# is listed (keeps the files small; the in-situ harness shows the rest).
# usage (from SC): bash lm33/kit/heavy.sh python3 gbareal/targets/refs.py [group ...]   (needs names.pkl: see targets.py)
import sys, os, json, pickle, collections
HERE = os.path.dirname(os.path.abspath(__file__)) + '/'; sys.path.insert(0, HERE + '..')
from common import *
import shapely.wkb
from shapely.geometry import box, Point
from shapely.strtree import STRtree
TJ = json.load(open(ROOT + 'gba/targets.json'))
want = set(sys.argv[1:])
Bl = load('buildings.pkl'); R = load('roads.pkl'); T2 = load('terrain.pkl'); H = T2['H']; del T2
NM = pickle.load(open(HERE + 'names.pkl', 'rb'))
AREA = {oid: wk for k, oid, t, wk in NM if k in ('a', 'b')}
NODES = [(t, shapely.wkb.loads(wk)) for k, oid, t, wk in NM if k == 'n' and t.get('name')]; del NM
NODES = [(t, w(p.x, p.y)) for t, p in NODES]
def ground(x, y):
    fx = (x + HALF)/TS; fy = (y + HALF)/TS; i = min(TN - 2, max(0, int(fx))); j = min(TN - 2, max(0, int(fy))); u = fx - i; v = fy - j
    return float(H[j, i]*(1 - u)*(1 - v) + H[j, i + 1]*u*(1 - v) + H[j + 1, i]*(1 - u)*v + H[j + 1, i + 1]*u*v)
TYPES = {14:'context (other region)', 0:'generic', 2:'apartment', 3:'house', 4:'commercial', 5:'office', 6:'industrial', 7:'civic', 8:'religious', 9:'hospital', 10:'transport', 11:'car park', 12:'hotel', 13:'shed', 15:'tank'}
BT = STRtree([b['g'] for b in Bl['b']]); LT = STRtree([l['g'] for l in R['lines']]); byid = {b['id']: b for b in Bl['b']}
parts_by = collections.defaultdict(list)
for p in Bl['parts']: parts_by[p['bid']].append(p)
NT = STRtree([Point(xy) for t, xy in NODES])
for grp, lst in TJ['groups'].items():
    if want and grp not in want: continue
    out = {'note':'Greater Bay map frame (gbareal). Local metres around each anchor: +x east, +z south (three.js local axes before rotation). Real OSM '
           'data of this build; heights are OSM values where height / levels are mapped (levels x 3.1 m + 1 m), otherwise estimated from similar '
           'buildings (right class, not the right building; Shenzhen has levels on ~19 % of its footprints, Dongguan ~3 %). parts = OSM building:part '
           'pieces with base / top heights. terrain = ground heights (m) on a grid around the anchor (rows north to south; the bare-earth estimate). '
           'roads: cls 0-1 freeway, 2-9 arterials, 10 local, 11 service, 12 path, 13 runway, 14 taxiway, 15 rail, 16 people mover, 17 pier; elev = '
           'deck height above the ground per vertex for bridges / flyovers. ground = terrain height (m) at the anchor. sel = what was listed: the box, '
           'or for big sites only what lies within 200 m of the target\'s own OSM area.', 'targets':{}}
    for e in lst:
        key, lat, lon = e['key'], e['lat'], e['lon']; rad = max(120, min(1600, int(e['r']*1.6)))
        ax, ay = w(lon, lat); bx = box(ax - rad, ay - rad, ax + rad, ay + rad); sel = bx; selname = 'box'
        if rad > 800 and e.get('osm') and e['osm'] in AREA:
            sel = proj(shapely.wkb.loads(AREA[e['osm']])).buffer(200).intersection(bx); selname = 'area+200m'
        loc = lambda x, y: [round(x - ax, 1), round(-(y - ay), 1)]
        T = {'name':e['en'] + ' / ' + e['zh'], 'anchor':{'lat':lat, 'lon':lon, 'osm':e.get('osm')}, 'radius':rad, 'sel':selname, 'ground':round(ground(ax, ay), 1), 'buildings':[], 'roads':[], 'pois':[]}
        st = 35 if rad <= 700 else 70; nn = int(rad//st)
        T['terrain'] = {'step':st, 'n':2*nn + 1, 'rows_north_to_south':[[round(ground(ax + i*st, ay - j*st), 1) for i in range(-nn, nn + 1)] for j in range(-nn, nn + 1)]}
        for bi in sorted(int(k) for k in BT.query(sel, predicate='intersects')):
            b = Bl['b'][bi]; g = b['g']; c = g.centroid
            if selname != 'box' and g.area < 60: continue
            q = {'name':b['name'], 'zh':b.get('zh'), 'osm':b['id'], 'h':b['h'], 'floors':b['fl'], 'type':TYPES.get(b['t'], str(b['t'])), 'area':round(g.area), 'centroid':loc(c.x, c.y), 'ring':[loc(x, y) for x, y in list(g.exterior.coords)[:-1]]}
            if not q['name']: del q['name']
            if not q['zh']: del q['zh']
            if b['id'] in Bl['have_parts']: q['parts'] = [{'base':p['base'], 'top':p['h'], 'ring':[loc(x, y) for x, y in list(p['g'].exterior.coords)[:-1]]} for p in parts_by.get(b['id'], [])]
            T['buildings'].append(q)
        for i in sorted(int(k) for k in LT.query(sel, predicate='intersects')):
            l = R['lines'][i]
            if l['c'] > 17: continue
            el = R['elev'].get(i); cs = list(l['g'].coords)
            if el is None or (l['g'].within(sel)):
                gg = l['g'].intersection(sel)
                for ln in (gg.geoms if hasattr(gg, 'geoms') else [gg]):
                    if ln.geom_type == 'LineString' and ln.length > 8:
                        q = {'cls':l['c'], 'name':l['name'], 'bridge':bool(l['br']), 'layer':l.get('layer', 0), 'pts':[loc(x, y) for x, y in ln.coords]}
                        if el is not None and len(el) == len(cs): q['elev'] = [round(v, 1) for v in el]
                        if not q['name']: del q['name']
                        T['roads'].append(q)
            else:   # elevated line crossing the selection: keep the vertices inside (with their deck heights)
                keep = [(c, h) for c, h in zip(cs, el) if sel.contains(Point(c))] if len(el) == len(cs) else []
                if len(keep) >= 2: T['roads'].append({'cls':l['c'], 'name':l['name'], 'bridge':bool(l['br']), 'layer':l.get('layer', 0), 'pts':[loc(*c) for c, h in keep], 'elev':[round(h, 1) for c, h in keep]})
        for k in NT.query(sel, predicate='contains'):
            t, (x, y) = NODES[int(k)]
            T['pois'].append({'name':t['name'], 'tags':{a:v for a, v in t.items() if a in ('tourism', 'amenity', 'historic', 'man_made', 'leisure', 'building', 'height', 'railway', 'natural', 'aeroway', 'religion')}, 'at':loc(x, y)})
        T['pois'] = sorted(T['pois'], key=lambda p: -len(p['tags']))[:80]
        out['targets'][key] = T
        print(grp, key, rad, selname, len(T['buildings']), 'buildings', len(T['roads']), 'roads', len(T['pois']), 'pois', flush=True)
    json.dump(out, open(ROOT + 'gba/ref_%s.json' % grp, 'w'), separators=(',', ':'), ensure_ascii=False)
    print('wrote', grp, os.path.getsize(ROOT + 'gba/ref_%s.json' % grp), flush=True)
print('done')
