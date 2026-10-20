# stage 6 (Bay Area): districts (cities, CDPs, San Francisco neighbourhoods), counties, labels (places, POIs, waters),
# rail transit (BART, Caltrain, Muni Metro, streetcars, cable cars, VTA) with elevation flags, stations, runways, stands, district lines
import sys, collections, re; sys.path.insert(0, '.')
from common import *
import shapely.wkb
from shapely.geometry import Point, LineString, MultiPoint, box, Polygon
from shapely.ops import unary_union, linemerge, voronoi_diagram
from shapely.prepared import prep
from shapely.strtree import STRtree
from PIL import Image
from raster import raster, polys_of
from zh_names import zh as zhn, ZH
SQ = box(-HALF, -HALF, HALF, HALF)
A = pickle.load(open(OUT + 'raw_areas.pkl', 'rb'))
NODES = pickle.load(open(OUT + 'raw_nodes.pkl', 'rb'))
L = load('land.pkl'); LAND = L['sg']; landp = prep(LAND.buffer(400))
def zhof(t): return zhn(t.get('name:en') or t.get('name'), t.get('name:zh-Hans') or t.get('name:zh') or t.get('name:zh-CN'))
def geo(wk):
    try: return proj(shapely.wkb.loads(wk)).buffer(0)
    except Exception: return None
# ---------------- districts ----------------
cities, cdps, counties, sf = [], [], [], None
for oid, fw, t, wk in A:
    b = t.get('boundary'); al = t.get('admin_level'); nm = t.get('name')
    if not nm: continue
    if b == 'administrative' and al == '6' and nm == 'San Francisco': sf = geo(wk); continue
    if b == 'administrative' and al == '6' and nm.endswith('County'): g = geo(wk); counties.append((nm, t, g)); continue
    if b == 'administrative' and al == '8' and not nm.startswith('Unincorporated'): cities.append((nm, t, geo(wk))); continue
    if b == 'census' or (b == 'place' and t.get('place') == 'village'): cdps.append((nm, t, geo(wk)))
print('cities', len(cities), 'cdps', len(cdps), 'counties', len(counties), 'sf', sf is not None)
# San Francisco: Voronoi cells of the well-known neighbourhoods (place nodes with a Chinese name in the dictionary)
sfp = prep(sf); hood = {}
for t, (lon, lat) in NODES:
    if t.get('place') not in ('neighbourhood', 'suburb', 'quarter'): continue
    nm = t.get('name'); x, y = w(lon, lat)
    if nm in ZH and sfp.contains(Point(x, y)) and nm not in ('Presidio of San Francisco', 'Downtown'):
        key = ZH[nm]
        if key not in hood: hood[key] = (nm, x, y)
seeds = list(hood.values())
print('SF hoods', len(seeds), sorted(s[0] for s in seeds))
vor = voronoi_diagram(MultiPoint([(s[1], s[2]) for s in seeds]), envelope=sf.envelope.buffer(3000))
sfhood = []
for cell in vor.geoms:
    for s in seeds:
        if cell.contains(Point(s[1], s[2])):
            g = cell.intersection(sf)
            if not g.is_empty: sfhood.append((s[0], {'name':s[0]}, g))
D = []        # (en, tags, geom) in raster order: later ones overwrite
for nm, t, g in cdps + cities:
    if g is None or g.is_empty: continue
    g = g.intersection(SQ)
    if g.area < 2e5 or LAND.intersection(g).area < 1e5: continue
    D.append((nm, t, g))
D += sfhood
paimg = Image.new('L', (N, N), 0); PAS = []; PG = []
for i, (nm, t, g) in enumerate(D, 1):
    raster([g], CELL, i, paimg)
    gl = g.intersection(LAND); c = (gl if not gl.is_empty else g).representative_point()
    PAS.append({'en':nm, 'zh':zhof(t) or nm, 'x':round(c.x), 'y':round(c.y), 'km2':round(gl.area/1e6, 2)}); PG.append(g)
assert len(PAS) < 255, len(PAS)
pa = np.asarray(paimg)
rgimg = Image.new('L', (N, N), 0); REGS = []
for i, (nm, t, g) in enumerate([(n, t, g) for n, t, g in counties if g is not None] + [('San Francisco', {'name':'San Francisco'}, sf)], 1):
    g = g.intersection(SQ); gl = g.intersection(LAND)
    if gl.area < 1e6: continue
    raster([g], CELL, len(REGS) + 1, rgimg); c = gl.representative_point()
    REGS.append({'en':nm, 'zh':zhof(t) or zhn(nm) or nm, 'x':round(c.x), 'y':round(c.y), 'r':round(math.sqrt(gl.area/math.pi))})
rg = np.asarray(rgimg)
for i, P in enumerate(PAS, 1):
    m = pa == i; vals = rg[m]; P['reg'] = int(np.bincount(vals).argmax()) if vals.size else 0
print('PAS', len(PAS), 'REGS', [(r['en'], r['zh']) for r in REGS])
np.save(OUT + 'pa.npy', pa); np.save(OUT + 'rg.npy', rg)
bnd = unary_union([g.boundary for g in PG])
bl2 = bnd.intersection(LAND.buffer(-35))
bl2 = linemerge(bl2) if bl2.geom_type == 'MultiLineString' else bl2
palines = []
for ln in (bl2.geoms if hasattr(bl2, 'geoms') else [bl2]):
    if ln.geom_type != 'LineString' or ln.length < 60: continue
    ln = ln.simplify(8); palines.append([[round(x), round(y)] for x, y in ln.coords])
print('pa lines', len(palines), sum(len(p) for p in palines))
# ---------------- places ----------------
PK = {'city':'city', 'town':'town', 'suburb':'suburb', 'quarter':'quarter', 'neighbourhood':'neighbourhood', 'village':'town', 'hamlet':'neighbourhood', 'locality':'locality', 'island':'island', 'islet':'island'}
places = []; seenp = set()
for t, (lon, lat) in NODES:
    k = PK.get(t.get('place'))
    if not k: continue
    x, y = w(lon, lat)
    if not (-HALF < x < HALF and -HALF < y < HALF) or not landp.contains(Point(x, y)): continue
    nm = t.get('name:en') or t.get('name'); key = (nm, round(x/500), round(y/500))
    if key in seenp: continue
    seenp.add(key)
    try: pop = int(str(t.get('population', '0')).replace(',', '').split('.')[0] or 0)
    except ValueError: pop = 0
    places.append({'en':nm, 'zh':zhof(t), 'k':k, 'x':round(x), 'y':round(y), 'mz':{'city':8, 'town':10, 'suburb':12, 'quarter':13, 'island':12}.get(k, 14), 'pop':pop})
places.sort(key=lambda p: (p['mz'], -p['pop']))
places = places[:2600]
print('places', len(places), collections.Counter(p['k'] for p in places))
# ---------------- POIs ----------------
def poi_kind(t):
    for key, vals in (('aeroway', ('aerodrome',)), ('tourism', ('theme_park', 'zoo', 'aquarium', 'museum', 'attraction', 'viewpoint', 'hotel')), ('shop', ('mall',)),
                      ('amenity', ('university', 'college', 'hospital', 'library', 'theatre', 'arts_centre', 'cinema', 'ferry_terminal', 'bus_station', 'marketplace', 'place_of_worship', 'casino', 'planetarium')),
                      ('leisure', ('stadium', 'park', 'nature_reserve', 'golf_course', 'garden', 'water_park', 'sports_centre')), ('historic', ('castle', 'fort', 'monument', 'memorial')),
                      ('man_made', ('lighthouse',)), ('natural', ('beach', 'peak')), ('boundary', ('national_park', 'protected_area'))):
        v = t.get(key)
        if v in vals: return 'nature_reserve' if v == 'protected_area' else v
    return None
cand = []
for t, (lon, lat) in NODES:
    k = poi_kind(t)
    if k and t.get('name'): cand.append((k, t, w(lon, lat), 0.0))
for oid, fw, t, wk in A:
    k = poi_kind(t)
    if not k or not t.get('name'): continue
    if k in ('park', 'golf_course', 'nature_reserve', 'national_park', 'garden') and not t.get('wikidata'):
        pass
    g = geo(wk)
    if g is None or g.is_empty: continue
    if k in ('park', 'nature_reserve', 'national_park', 'garden', 'golf_course') and g.area < 40000 and not t.get('wikidata'): continue
    c = g.representative_point(); cand.append((k, t, (c.x, c.y), g.area))
pois = []
for k, t, (x, y), ar in cand:
    if not (-HALF < x < HALF and -HALF < y < HALF) or not landp.contains(Point(x, y)): continue
    wd = bool(t.get('wikidata')); z = zhof(t)
    if k == 'aerodrome': pr = 1 if t.get('iata') else 2 if wd else 3
    elif k in ('theme_park', 'zoo', 'aquarium'): pr = 1 if wd else 2
    elif k == 'stadium': pr = 1 if wd and ar > 30000 else 2 if wd else 3
    elif k == 'university': pr = 1 if wd and ar > 4e5 else 2 if wd else 3
    elif k in ('park', 'nature_reserve', 'national_park'): pr = 1 if ar > 9e6 and wd else 2 if (wd or ar > 1e6) else 3
    elif k in ('museum', 'attraction', 'viewpoint', 'castle', 'fort', 'monument', 'lighthouse', 'beach', 'peak', 'theatre', 'arts_centre', 'mall', 'garden', 'ferry_terminal', 'planetarium', 'golf_course'): pr = 2 if wd else 3
    elif k in ('hospital', 'college', 'library', 'memorial', 'hotel', 'cinema', 'marketplace', 'place_of_worship', 'sports_centre', 'bus_station', 'casino', 'water_park'): pr = 3 if (wd or k in ('hospital', 'college')) else 4
    else: pr = 4
    if pr >= 4 and not z: continue
    if pr >= 3 and not wd and not z and k not in ('park', 'hospital', 'college', 'beach', 'peak', 'viewpoint', 'museum', 'golf_course'): continue
    nm = t.get('name:en') or t['name']
    if '(closed' in nm: continue
    pois.append({'en':nm, 'zh':z, 'k':k, 'kd':None, 'x':round(x), 'y':round(y), 'mz':{1:10, 2:13, 3:15, 4:17}[pr], 'pr':pr, '_a':ar, '_w':wd})
pois.sort(key=lambda p: (p['pr'], not p['_w'], -p['_a']))
seen = []; keep = []
for p in pois:
    if any(s['en'] == p['en'] and abs(s['x'] - p['x']) < 600 and abs(s['y'] - p['y']) < 600 for s in seen): continue
    seen.append(p); keep.append(p)
pois = keep[:3000]
for p in pois: p.pop('_a'); p.pop('_w')
print('pois', len(pois), collections.Counter(p['pr'] for p in pois), collections.Counter(p['k'] for p in pois).most_common(22))
print('  pr1', [p['en'] for p in pois if p['pr'] == 1][:60])
# ---------------- named waters ----------------
waters = []
for t, (lon, lat) in NODES:
    nm = t.get('name')
    if not nm: continue
    k = t.get('natural') if t.get('natural') in ('bay', 'strait') else t.get('place') if t.get('place') in ('sea', 'ocean') else None
    if not k: continue
    x, y = w(lon, lat)
    if not (-HALF < x < HALF and -HALF < y < HALF): continue
    big = k in ('sea', 'ocean', 'strait') or nm in ('San Francisco Bay', 'San Pablo Bay', 'Richardson Bay', 'San Leandro Bay', 'Half Moon Bay', 'Oakland Estuary')
    waters.append({'en':t.get('name:en') or nm, 'zh':zhof(t), 'k':k, 'kd':None, 'x':round(x), 'y':round(y), 'mz':10 if big else 13, 'b':1 if big else 0})
for d, g in L['fresh_list']:
    nm = d.get('name')
    if not nm or g.area < 1.5e5 or ';' in nm or re.match(r'^[A-Z]{1,3}\d', nm) or 'Evaporator' in nm: continue
    c = g.representative_point()
    if not SQ.contains(c): continue
    big = g.area > 1.5e6
    waters.append({'en':nm, 'zh':d.get('zh') or zhn(nm), 'k':'reservoir' if d.get('water') == 'reservoir' or 'Reservoir' in nm else 'lake', 'kd':d.get('kind'), 'x':round(c.x), 'y':round(c.y), 'mz':10 if big else 13, 'b':1 if big else 0})
BIGW = [('San Francisco Bay', '旧金山湾', 37.640, -122.265), ('San Francisco Bay', '旧金山湾', 37.790, -122.370), ('Pacific Ocean', '太平洋', 37.640, -122.560),
        ('Golden Gate', '金门海峡', 37.8115, -122.4790), ('Richardson Bay', '理查森湾', 37.872, -122.487), ('Raccoon Strait', '浣熊海峡', 37.8605, -122.4475),
        ('Oakland Estuary', '奥克兰河口', 37.7845, -122.2600), ('San Leandro Bay', '圣莱安德罗湾', 37.7470, -122.2300), ('South San Francisco Bay', '南旧金山湾', 37.515, -122.110),
        ('San Pablo Strait', '圣帕布罗海峡', 37.935, -122.430), ('Half Moon Bay', '半月湾', 37.4850, -122.4700)]
waters = [t for t in waters if t['en'] not in set(b[0] for b in BIGW)]
for en, z, la, lo in BIGW:
    x, y = w(lo, la); waters.append({'en':en, 'zh':z, 'k':'bay', 'kd':None, 'x':round(x), 'y':round(y), 'mz':9, 'b':1})
ws = {}
for t in waters:
    k = (t['en'], round(t['x']/8000), round(t['y']/8000))
    if k not in ws or t['b'] > ws[k]['b']: ws[k] = t
waters = sorted(ws.values(), key=lambda t: t['mz'])
print('named waters', len(waters), [(t['en'], t['zh'], t['k']) for t in waters[:30]])
# ---------------- rail transit ----------------
ROUTES = {r[0]: r for r in pickle.load(open(OUT + 'raw_routes.pkl', 'rb'))}
LINES = [  # code, relation, en, zh, colour, group, lrt
    ('BY', 2827683, 'BART Yellow Line', 'BART 黄线', '#ffe800', 'bart', 0), ('BR', 2851612, 'BART Red Line', 'BART 红线', '#ed1c24', 'bart', 0),
    ('BG', 2851726, 'BART Green Line', 'BART 绿线', '#4db848', 'bart', 0), ('BB', 2851725, 'BART Blue Line', 'BART 蓝线', '#00aeef', 'bart', 0),
    ('BO', 2851510, 'BART Orange Line', 'BART 橙线', '#faa61a', 'bart', 0), ('CT', 9605482, 'Caltrain', '加州火车', '#c8102e', 'cal', 0),
    ('MN', 63223, 'Muni Metro N Judah', '轻轨 N 线', '#004988', 'muni', 1), ('MT', 63250, 'Muni Metro T Third Street', '轻轨 T 线', '#d40843', 'muni', 1),
    ('MK', 63572, 'Muni Metro K Ingleside', '轻轨 K 线', '#549dbf', 'muni', 1), ('ML', 2124174, 'Muni Metro L Taraval', '轻轨 L 线', '#932290', 'muni', 1),
    ('MM', 91022, 'Muni Metro M Ocean View', '轻轨 M 线', '#008851', 'muni', 1), ('MJ', 2877693, 'Muni Metro J Church', '轻轨 J 线', '#e18813', 'muni', 1),
    ('MF', 2007933, 'F Market & Wharves', 'F 线复古电车', '#d8c45c', 'muni', 1),
    ('KH', 1959009, 'Powell-Hyde Cable Car', '鲍威尔-海德缆车', '#913108', 'cable', 1), ('KM', 1959010, 'Powell-Mason Cable Car', '鲍威尔-梅森缆车', '#913108', 'cable', 1),
    ('KC', 2852264, 'California Street Cable Car', '加利福尼亚街缆车', '#913108', 'cable', 1),
    ('VB', 2989876, 'VTA Blue Line', 'VTA 轻轨蓝线', '#3bb4e6', 'vta', 1), ('VG', 2989877, 'VTA Green Line', 'VTA 轻轨绿线', '#a0cf65', 'vta', 1),
    ('VO', 10561835, 'VTA Orange Line', 'VTA 轻轨橙线', '#f79729', 'vta', 1)]
need = set()
for code, rid, *_ in LINES:
    for ty, ref, role in ROUTES[rid][2]:
        if ty == 'w' and role in ('', 'forward', 'backward'): need.add(ref)
WAYS = {}
for wid, t, cs in pickle.load(open(OUT + 'raw_ways.pkl', 'rb')):
    if wid in need: WAYS[wid] = (t, [w(*c) for c in cs])
print('route ways', len(need), 'found', len(WAYS))
def elflag(t):
    try: lay = int(t.get('layer', '0'))
    except ValueError: lay = 0
    if t.get('tunnel') in ('yes', 'building_passage', 'covered') or t.get('location') == 'underground' or lay < 0: return 2
    if t.get('bridge') in ('yes', 'viaduct', 'cantilever') or lay > 0: return 1
    return 0
def chain(rid):
    runs = []; cur = None
    for ty, ref, role in ROUTES[rid][2]:
        if ty != 'w' or role not in ('', 'forward', 'backward') or ref not in WAYS: continue
        t, P = WAYS[ref]; f = elflag(t); seg = [(x, y, f) for x, y in P]
        if cur is None: cur = seg; continue
        e0, e1 = cur[0], cur[-1]; s0, s1 = seg[0], seg[-1]
        dd = lambda a, b: math.hypot(a[0] - b[0], a[1] - b[1])
        if len(runs) == 0 and len(cur) == len(WAYS[ref][1]) and False: pass
        opts = [(dd(e1, s0), 'a'), (dd(e1, s1), 'b'), (dd(e0, s0), 'c'), (dd(e0, s1), 'd')]
        d, o = min(opts)
        if d > 30: runs.append(cur); cur = seg; continue
        if o == 'a': cur = cur + seg[1:]
        elif o == 'b': cur = cur + seg[::-1][1:]
        elif o == 'c': cur = cur[::-1] + seg[1:]
        else: cur = cur[::-1] + seg[::-1][1:]
    if cur: runs.append(cur)
    return runs
def resample(run, step=20):
    xs = [p[0] for p in run]; ys = [p[1] for p in run]; fl = [p[2] for p in run]
    cum = [0.0]
    for i in range(1, len(run)): cum.append(cum[-1] + math.hypot(xs[i] - xs[i-1], ys[i] - ys[i-1]))
    Lr = cum[-1]
    if Lr < 1: return []
    n = max(2, int(Lr/step) + 1); out = []; j = 1
    for k in range(n):
        s = Lr*k/(n - 1)
        while j < len(run) - 1 and cum[j] < s: j += 1
        f = (s - cum[j-1])/max(1e-9, cum[j] - cum[j-1])
        out.append((xs[j-1] + (xs[j] - xs[j-1])*f, ys[j-1] + (ys[j] - ys[j-1])*f, fl[j] if f > 0.5 else fl[j-1]))
    return out
mrt = []; kept = collections.defaultdict(dict); allpts = collections.defaultdict(list)
inside = lambda p: -HALF + 50 < p[0] < HALF - 50 and -HALF + 50 < p[1] < HALF - 50
for code, rid, en, zh, col, grp, lrt in LINES:
    G = kept['bart' if grp == 'bart' else grp if grp in ('cal', 'vta') else 'muni']
    for run in chain(rid):
        R = resample(run)
        for p in R: allpts[code].append(p)
        ok = [inside(p) and not any((round(p[0]/10) + a, round(p[1]/10) + b) in G for a in (-1, 0, 1) for b in (-1, 0, 1)) for p in R]
        i = 0
        while i < len(R):
            if not ok[i]: i += 1; continue
            j = i
            while j < len(R) and ok[j]: j += 1
            seg = R[max(0, i - 1):min(len(R), j + 1)]
            if j - i >= 8:
                mrt.append({'name':en, 'zh':zh, 'code':code, 'col':col, 'pts':[[round(p[0], 1), round(p[1], 1)] for p in seg], 'el':''.join(str(p[2]) for p in seg), 'grp':grp})
            i = j
        for p in R:
            if inside(p): G[(round(p[0]/10), round(p[1]/10))] = 1
print('mrt parts', len(mrt), [(m['code'], len(m['pts']), dict(collections.Counter(m['el']))) for m in mrt])
# stations
GRPTAG = lambda t: 'bart' if 'BART' in (t.get('network', '') + t.get('operator', '')) or t.get('station') == 'subway' and 'Muni' not in t.get('network', '') else \
    'cal' if 'Caltrain' in (t.get('network', '') + t.get('operator', '')) else 'vta' if 'VTA' in (t.get('network', '') + t.get('operator', '')) or 'Valley Transportation' in t.get('operator', '') else \
    'muni' if 'Muni' in t.get('network', '') or 'Municipal' in t.get('operator', '') else None
stations = []
for t, (lon, lat) in NODES:
    if not (t.get('railway') in ('station', 'halt') or t.get('public_transport') == 'station') or not t.get('name'): continue
    x, y = w(lon, lat)
    if not (-HALF < x < HALF and -HALF < y < HALF): continue
    g = GRPTAG(t)
    codes = []
    for code, rid, en, zh, col, grp, lrt in LINES:
        if grp == 'cable' or (g and grp != g): continue
        if any(abs(p[0] - x) < 90 and abs(p[1] - y) < 90 and math.hypot(p[0] - x, p[1] - y) < 90 for p in allpts[code]): codes.append(code)
    if not codes: continue
    nm = t.get('name:en') or t['name']; nm = re.sub(r'\s+(BART|Caltrain|Station)$', '', nm)
    if any(s['en'] == nm and math.hypot(s['x'] - x, s['y'] - y) < 400 for s in stations): continue
    stations.append({'en':nm, 'zh':zhof(t) or nm, 'codes':codes, 'x':round(x), 'y':round(y)})
print('stations', len(stations), collections.Counter(s['codes'][0][0] for s in stations))
# ---------------- runways and stands ----------------
R = load('roads.pkl'); Bl = load('buildings.pkl')
runways = []
for l in R['lines']:
    if l['c'] != 13 or l['g'].length < 900: continue
    cs = list(l['g'].coords); a, b = cs[0], cs[-1]
    runways.append({'a':[round(a[0], 1), round(a[1], 1)], 'b':[round(b[0], 1), round(b[1], 1)], 'len':round(l['g'].length), 'name':l['name'] or ''})
print('runways', [(r['len'], r['name'], [round(v, 4) for v in ll(*r['a'])][::-1]) for r in runways])
AIRPORTS = {'SFO':(-122.405, 37.600, -122.360, 37.635), 'OAK':(-122.235, 37.700, -122.195, 37.725), 'SJC':(-121.935, 37.355, -121.915, 37.380)}
stands = []
for ap, (lo0, la0, lo1, la1) in AIRPORTS.items():
    CH = box(*w(lo0, la0), *w(lo1, la1))
    taxi = [l['g'] for l in R['lines'] if l['c'] == 14 and l['g'].intersects(CH)]
    rds = [l['g'] for l in R['lines'] if l['c'] <= 10 and l['g'].intersects(CH)]
    bl = [b['g'] for b in Bl['b'] if b['g'].intersects(CH)]
    tt, rt, bt = STRtree(taxi), STRtree(rds), STRtree(bl)
    terms = [b for b in Bl['b'] if b['t'] == 10 and b['g'].area > 6000 and b['g'].intersects(CH)]
    n0 = len(stands)
    for b in terms:
        g = b['g'].simplify(4)
        if g.geom_type != 'Polygon': continue
        ring = g.exterior; Lr = ring.length
        for k in range(int(Lr/58)):
            s0 = (k + 0.5)*58; p = ring.interpolate(s0); q = ring.interpolate(min(Lr, s0 + 3)); r = ring.interpolate(max(0, s0 - 3))
            tx, ty = q.x - r.x, q.y - r.y; n = math.hypot(tx, ty) or 1; nx, ny = ty/n, -tx/n
            c = Point(p.x + nx*40, p.y + ny*40)
            if g.contains(c): nx, ny = -nx, -ny; c = Point(p.x + nx*40, p.y + ny*40)
            dt = min((taxi[int(i)].distance(c) for i in tt.query(c.buffer(260))), default=1e9)
            dr = min((rds[int(i)].distance(c) for i in rt.query(c.buffer(60))), default=1e9)
            hit = any(bl[int(i)].intersects(c.buffer(14)) for i in bt.query(c.buffer(14)))
            if dt > 260 or dr < 45 or hit: continue
            if any(math.hypot(c.x - s[0], c.y - s[1]) < 56 for s in stands): continue
            stands.append([round(c.x, 1), round(c.y, 1), round(math.atan2(-ny, -nx), 3)])
    print('stands', ap, len(stands) - n0, 'terminals', len(terms))
save({'PAS':PAS, 'REGS':REGS, 'places':places, 'pois':pois, 'waters':waters, 'mrt':mrt, 'stations':stations, 'f1':[], 'runways':runways, 'stands':stands, 'palines':palines}, 'misc.pkl')
print('saved')
