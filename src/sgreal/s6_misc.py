# stage 6: planning areas, regions, labels (places, POIs, water names), MRT/LRT with elevation flags, F1
import sys; sys.path.insert(0, '.')
from common import *
import collections, re, ast
from raster import raster
from PIL import Image
from shapely.geometry import shape, Point, LineString
from shapely.strtree import STRtree
B = pickle.load(open(SGD + 'base15.pkl', 'rb'))
L = load('land.pkl')
src = open(ROOT + 'sg/prep.py').read()
PAZH = ast.literal_eval(re.search(r'^PAZH = (\{.*?\})$', src, re.M).group(1))
REGZH = ast.literal_eval(re.search(r'^REGZH = (\{.*?\})$', src, re.M).group(1))
def rings(g): return [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
pas = json.load(open(ROOT + 'sg/2-planning-area.geojson'))['features']
regs = json.load(open(ROOT + 'sg/1-region.geojson'))['features']
paimg = Image.new('L', (N, N), 0); rgimg = Image.new('L', (N, N), 0)
PAS, REGS = [], []
for i, ft in enumerate(pas, 1):
    g = proj(shape(ft['geometry'])).buffer(0); raster([g], CELL, i, paimg)
    nm = ft['properties']['name']; c = g.representative_point()
    PAS.append({'en':nm.title().replace("'S", "'s"), 'zh':PAZH.get(nm, nm.title()), 'x':round(c.x), 'y':round(c.y), 'km2':round(g.area/1e6, 2)})
for i, ft in enumerate(regs, 1):
    g = proj(shape(ft['geometry'])).buffer(0); raster([g], CELL, i, rgimg)
    nm = ft['properties']['name']; c = g.representative_point()
    REGS.append({'en':nm.title(), 'zh':REGZH.get(nm, nm), 'x':round(c.x), 'y':round(c.y), 'r':round(math.sqrt(g.area/math.pi))})
pa = np.asarray(paimg); rg = np.asarray(rgimg)
for i, P in enumerate(PAS, 1):
    m = pa == i; vals = rg[m]; P['reg'] = int(np.bincount(vals).argmax()) if vals.size else 0
np.save(OUT + 'pa25.npy', pa)
# labels: places
zh = lambda p: p.get('name:zh-Hans') or p.get('name:zh') or p.get('name:zh-Hant')
sgl = L['sg'].buffer(300)
from shapely.prepared import prep
sgp = prep(sgl)
places = []
for p, g in B['places']:
    q = proj(g)
    if not sgp.contains(q): continue
    places.append({'en':p.get('name:en') or p.get('name'), 'zh':zh(p), 'k':p.get('kind_detail'), 'x':round(q.x), 'y':round(q.y), 'mz':p.get('min_zoom', 15), 'pop':p.get('population', 0)})
print('places', len(places), collections.Counter(p['k'] for p in places))
POIK = {'theme_park':1, 'zoo':1, 'aquarium':1, 'attraction':2, 'museum':2, 'mall':2, 'stadium':2, 'university':2, 'college':3, 'hospital':2, 'hotel':3, 'viewpoint':3, 'aerodrome':1, 'ferry_terminal':2,
        'place_of_worship':3, 'marketplace':3, 'park':3, 'nature_reserve':2, 'golf_course':3, 'beach':2, 'castle':2, 'monument':2, 'memorial':3, 'library':3, 'theatre':2, 'arts_centre':2,
        'garden':2, 'sports_centre':3, 'terminal':2, 'bus_station':3, 'convention_centre':2, 'casino':2, 'fort':2, 'lighthouse':2, 'planetarium':2, 'water_park':2, 'swimming_pool':4, 'national_park':2, 'peak':2, 'cinema':3}
pois = []
for p, g in B['pois']:
    k = p.get('kind'); pr = POIK.get(k)
    if pr is None or not p.get('name'): continue
    q = proj(g) if g.geom_type == 'Point' else proj(g.representative_point())
    if not sgp.contains(q): continue
    mz = p.get('min_zoom', 18)
    if pr >= 3 and mz > 15 and not zh(p): continue
    pois.append({'en':p.get('name:en') or p['name'], 'zh':zh(p), 'k':k, 'kd':p.get('kind_detail'), 'x':round(q.x), 'y':round(q.y), 'mz':mz, 'pr':pr})
pois.sort(key=lambda p: (p['mz'], p['pr']))
# drop duplicates (same name within 300 m)
seen = []; keep = []
for p in pois:
    if any(s['en'] == p['en'] and abs(s['x'] - p['x']) < 300 and abs(s['y'] - p['y']) < 300 for s in seen[-400:]): continue
    seen.append(p); keep.append(p)
pois = keep[:1400]
print('pois', len(pois), collections.Counter(p['k'] for p in pois).most_common(20))
# named water bodies (reservoirs, big rivers)
waters = []
for p, g in B['water']:
    nm = p.get('name')
    if not nm or g.geom_type != 'Point' or p.get('kind') in ('ocean', 'swimming_pool', 'fountain'): continue
    q = proj(g)
    if not sgp.contains(q): continue
    waters.append({'en':p.get('name:en') or nm, 'zh':zh(p), 'k':p.get('kind'), 'kd':p.get('kind_detail'), 'x':round(q.x), 'y':round(q.y), 'mz':p.get('min_zoom', 15)})
waters.sort(key=lambda t: t['mz']); print('named waters', len(waters), [(t['en'], t['zh'], t['k']) for t in waters[:25]])
# MRT / LRT from sgrail, with elevation from OSM rail pieces (bridge = viaduct, tunnel = underground)
rails = []
for p, g in B['roads']:
    if p.get('kind') != 'rail' or p.get('kind_detail') not in ('subway', 'monorail', 'light_rail', 'rail'): continue
    for ln in (g.geoms if g.geom_type == 'MultiLineString' else [g] if g.geom_type == 'LineString' else []):
        rails.append((2 if p.get('is_tunnel') else 1 if p.get('is_bridge') else 0, proj(ln), p.get('kind_detail') in ('monorail', 'light_rail')))
rtree = STRtree([r[1] for r in rails])
rail = json.load(open(ROOT + 'sg/sgrail.json'))['features']
COLS = {'East West Line':('#009645', 'EW', '东西线'), 'North South Line':('#d42e12', 'NS', '南北线'), 'Circle Line':('#fa9e0d', 'CC', '环线'), 'Downtown Line':('#005ec4', 'DT', '滨海市区线'),
        'North East Line':('#9900aa', 'NE', '东北线'), 'Thomson-East Coast Line':('#9d5b25', 'TE', '汤申—东海岸线'), 'Bukit Panjang LRT':('#748477', 'BP', '武吉班让轻轨'),
        'Sengkang LRT (East Loop)':('#748477', 'SE', '盛港轻轨'), 'Sengkang LRT (West Loop)':('#748477', 'SW', '盛港轻轨'), 'Punggol LRT (East Loop)':('#748477', 'PE', '榜鹅轻轨'), 'Punggol LRT (West Loop)':('#748477', 'PW', '榜鹅轻轨')}
stations = []
for f in rail:
    p = f['properties']
    if f['geometry']['type'] == 'Point' and p.get('stop_type') == 'station':
        lon, lat = f['geometry']['coordinates']; x, y = w(lon, lat)
        stations.append({'en':p['name'], 'zh':p.get('name_zh-Hans', p['name']), 'codes':[c.strip() for c in p.get('station_codes', '').split('-')], 'x':round(x), 'y':round(y)})
def resample(P, step):
    ls = LineString(P); n = max(2, int(ls.length/step) + 1)
    return [ls.interpolate(ls.length*k/(n - 1)).coords[0] for k in range(n)]
mrt = []
for f in rail:
    p = f['properties']; g = f['geometry']
    if g['type'] not in ('LineString', 'MultiLineString') or p['name'] not in COLS: continue
    col, pre, zhn = COLS[p['name']]
    for part in ([g['coordinates']] if g['type'] == 'LineString' else g['coordinates']):
        P = resample([w(c[0], c[1]) for c in part], 20)
        flags = []
        for q in P:
            pt = Point(q); best = None; bd = 45
            lrt = pre in ('BP', 'SE', 'SW', 'PE', 'PW')
            for k in rtree.query(pt.buffer(45)):
                if rails[int(k)][2] != lrt: continue
                dd = rails[int(k)][1].distance(pt)
                if dd < bd: bd = dd; best = rails[int(k)][0]
            flags.append(-1 if best is None else best)
        # fill gaps (no OSM match) from neighbours
        for it in range(2):
            for i in range(len(flags)):
                if flags[i] < 0:
                    l = next((flags[j] for j in range(i - 1, -1, -1) if flags[j] >= 0), None); r = next((flags[j] for j in range(i + 1, len(flags)) if flags[j] >= 0), None)
                    flags[i] = l if l is not None else r if r is not None else 2
        mrt.append({'name':p['name'], 'zh':zhn, 'code':pre, 'col':col, 'pts':[[round(q[0], 1), round(q[1], 1)] for q in P], 'el':''.join(str(v) for v in flags)})
print('mrt parts', len(mrt), 'stations', len(stations), [(m['code'], dict(collections.Counter(m['el']))) for m in mrt])
f1 = json.load(open(ROOT + 'sg/sg-2008.geojson'))['features'][0]['geometry']['coordinates']
F1 = [[round(w(c[0], c[1])[0], 1), round(w(c[0], c[1])[1], 1)] for c in f1]
save({'PAS':PAS, 'REGS':REGS, 'places':places, 'pois':pois, 'waters':waters, 'mrt':mrt, 'stations':stations, 'f1':F1}, 'misc.pkl')
np.save(OUT + 'rg25.npy', rg)
