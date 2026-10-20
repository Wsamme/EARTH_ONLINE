# stage 6 (Tokyo): districts (neighbourhoods inside the 23 special wards; the wards of Yokohama / Kawasaki / Saitama / Chiba; the other
# cities and towns), regions (the 23 wards and the municipalities), labels (places, POIs, waters), rail (tyo_lines: JR, Shinkansen,
# Tokyo Metro, Toei, private railways, AGT, monorails, trams) with elevation flags and deck heights on the bridges, stations, Haneda's
# runways and stands, district lines
import sys, collections, re; sys.path.insert(0, '.')
from common import *
import shapely.wkb
from shapely.geometry import Point, LineString, MultiPoint, box, Polygon
from shapely.ops import unary_union, linemerge, voronoi_diagram
from shapely.prepared import prep
from shapely.strtree import STRtree
from PIL import Image
from raster import raster, polys_of
from ja_names import zh_of, en_of, kanji_zh
SQ = box(-HALF, -HALF, HALF, HALF)
A = pickle.load(open(OUT + 'raw_areas.pkl', 'rb'))
NODES = pickle.load(open(OUT + 'raw_nodes.pkl', 'rb'))
L = load('land.pkl'); LAND = L['sg']; landp = prep(LAND.buffer(400))
def zhof(t): return zh_of(t) if t.get('name') else None
def geo(wk):
    try: return proj(shapely.wkb.loads(wk)).buffer(0)
    except Exception: return None
# ---------------- districts ----------------
# OSM Japan: admin_level 4 prefectures, 7 municipalities (the 23 special wards, cities, towns), 8 the wards of the designated cities
muni, dwards, wards23 = [], [], []
for oid, fw, t, wk in A:
    if t.get('boundary') != 'administrative' or not t.get('name'): continue
    al = t.get('admin_level')
    if al not in ('7', '8'): continue
    g = geo(wk)
    if g is None or g.is_empty: continue
    g = g.intersection(SQ)
    if g.area < 2e5 or LAND.intersection(g).area < 1e5: continue
    if al == '7': muni.append((t, g))
    else: dwards.append((t, g))
DES = ('横浜市', '川崎市', 'さいたま市', '千葉市', '相模原市')
for t, g in muni:
    if t['name'].endswith('区') and not any(t['name'].startswith(d) for d in DES): wards23.append((t, g))
print('municipalities', len(muni), 'designated-city wards', len(dwards), 'special wards', len(wards23))
W23 = unary_union([g for t, g in wards23]) if wards23 else Polygon()
w23p = prep(W23.buffer(1))
# neighbourhood seeds inside the 23 wards: place = suburb / quarter / neighbourhood with a wikidata entry or an English name (the
# well-known ones), at most ~170, the bigger kinds first
seedsrc = []
for t, (lon, lat) in NODES:
    pl = t.get('place')
    if pl in ('suburb', 'quarter', 'neighbourhood') and t.get('name'):
        x, y = w(lon, lat); seedsrc.append(({'suburb':0, 'quarter':1, 'neighbourhood':2}[pl], 0 if t.get('wikidata') else 1, 0 if t.get('name:en') else 1, t, x, y))
seedsrc.sort(key=lambda s_: s_[:3])
seeds = []
for pr_, wd_, en_, t, x, y in seedsrc:
    if not w23p.contains(Point(x, y)): continue
    if wd_ and en_: continue
    if any(math.hypot(x - s_[1], y - s_[2]) < 650 for s_ in seeds): continue
    seeds.append((t, x, y))
    if len(seeds) >= 175: break
print('neighbourhood seeds in the 23 wards', len(seeds))
hoods = []
if seeds:
    vor = voronoi_diagram(MultiPoint([(s_[1], s_[2]) for s_ in seeds]), envelope=W23.envelope.buffer(3000))
    cells = list(vor.geoms); ct = STRtree(cells)
    for t, x, y in seeds:
        c = next((cells[int(i)] for i in ct.query(Point(x, y)) if cells[int(i)].contains(Point(x, y))), None)
        if c is None: continue
        # inside its own ward only (cells do not cross ward lines)
        wd = next((g for tw, g in wards23 if g.contains(Point(x, y))), None)
        g = c.intersection(wd if wd is not None else W23)
        if not g.is_empty and g.area > 5e4: hoods.append((t['name'], t, g))
# the parts of a ward no seed reached stay with the ward
D = []
for t, g in wards23:
    D.append((t['name'], t, g))          # drawn first: the neighbourhood cells overwrite it
D += [(t['name'], t, g) for t, g in dwards]
dw = unary_union([g for t, g in dwards]) if dwards else Polygon()
for t, g in muni:
    if (t, g) in wards23 or any(t['name'].startswith(d) for d in DES) and dw.intersection(g).area > 0.5*g.area: continue
    D.append((t['name'], t, g))
room = 254 - len(hoods)
if len(D) > room:
    keep = set(id(d) for d in sorted(D, key=lambda d: -LAND.intersection(d[2]).area)[:room]); D = [d for d in D if id(d) in keep]
D += hoods
paimg = Image.new('L', (N, N), 0); PAS = []; PG = []
for i, (nm, t, g) in enumerate(D, 1):
    raster([g], CELL, i, paimg)
    gl = g.intersection(LAND); c = (gl if not gl.is_empty else g).representative_point()
    PAS.append({'en':en_of(t) or nm, 'zh':zhof(t) or nm, 'x':round(c.x), 'y':round(c.y), 'km2':round(gl.area/1e6, 2)}); PG.append(g)
assert len(PAS) < 255, len(PAS)
pa = np.asarray(paimg)
# regions: the 23 special wards and the municipalities (cities and towns; designated cities whole)
rgimg = Image.new('L', (N, N), 0); REGS = []
for t, g in muni:
    gl = g.intersection(LAND)
    if gl.area < 1e6: continue
    raster([g], CELL, len(REGS) + 1, rgimg); c = gl.representative_point()
    REGS.append({'en':en_of(t) or t['name'], 'zh':zhof(t) or t['name'], 'x':round(c.x), 'y':round(c.y), 'r':round(math.sqrt(gl.area/math.pi))})
assert len(REGS) < 255
rg = np.asarray(rgimg)
for i, P in enumerate(PAS, 1):
    m = pa == i; vals = rg[m]; P['reg'] = int(np.bincount(vals).argmax()) if vals.size else 0
print('PAS', len(PAS), 'REGS', len(REGS), [(r['en'], r['zh']) for r in REGS][:80])
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
    nm = en_of(t) or t.get('name'); key = (nm, round(x/500), round(y/500))
    if key in seenp: continue
    seenp.add(key)
    try: pop = int(str(t.get('population', '0')).replace(',', '').split('.')[0] or 0)
    except ValueError: pop = 0
    places.append({'en':nm, 'zh':zhof(t), 'k':k, 'x':round(x), 'y':round(y), 'mz':{'city':8, 'town':10, 'suburb':12, 'quarter':13, 'island':12}.get(k, 14), 'pop':pop})
places.sort(key=lambda p: (p['mz'], -p['pop']))
places = [p for p in places if p['k'] != 'neighbourhood' or p['pop'] or len(places) < 2600][:2600]
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
    nm = en_of(t) or t['name']
    if '(closed' in nm or 'Sex' in nm.split(): continue
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
    big = k in ('sea', 'ocean', 'strait') or nm in ('東京湾',)
    waters.append({'en':en_of(t) or nm, 'zh':zhof(t), 'k':k, 'kd':None, 'x':round(x), 'y':round(y), 'mz':10 if big else 13, 'b':1 if big else 0})
for d, g in L['fresh_list']:
    nm = d.get('name')
    if not nm or g.area < 1.5e5 or ';' in nm: continue
    c = g.representative_point()
    if not SQ.contains(c): continue
    big = g.area > 1.5e6
    waters.append({'en':nm, 'zh':d.get('zh') or nm, 'k':'reservoir' if d.get('water') == 'reservoir' else 'river' if d.get('kind') == 'river' else 'lake', 'kd':d.get('kind'), 'x':round(c.x), 'y':round(c.y), 'mz':10 if big else 13, 'b':1 if big else 0})
BIGW = [('Tokyo Bay', '东京湾', 35.540, 139.860), ('Tokyo Bay', '东京湾', 35.450, 139.780), ('Sumida River', '隅田川', 35.7280, 139.8020), ('Sumida River', '隅田川', 35.6720, 139.7900),
        ('Arakawa River', '荒川', 35.7520, 139.7900), ('Arakawa River', '荒川', 35.6860, 139.8460), ('Tama River', '多摩川', 35.5720, 139.6850), ('Tama River', '多摩川', 35.6250, 139.5650),
        ('Edogawa River', '江户川', 35.7200, 139.8950), ('Edogawa River', '江户川', 35.8200, 139.8900), ('Naka River', '中川', 35.7300, 139.8550), ('Tsurumi River', '鹤见川', 35.5150, 139.6600),
        ('Port of Tokyo', '东京港', 35.6150, 139.7850), ('Port of Yokohama', '横滨港', 35.4500, 139.6650), ('Port of Kawasaki', '川崎港', 35.5000, 139.7500), ('Kyū-Edogawa River', '旧江户川', 35.6580, 139.8700),
        ('Shingashi River', '新河岸川', 35.7900, 139.6600), ('Ara River (Sumida)', '隅田川', 35.7560, 139.7510), ('Ayase River', '绫濑川', 35.7700, 139.8250), ('Funabashi Port', '船桥港', 35.6800, 139.9850)]
_bz = set(b[1] for b in BIGW); waters = [t for t in waters if t['en'] not in set(b[0] for b in BIGW) and t['zh'] not in _bz]
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
from tyo_lines import select as _select
_WIN = pickle.load(open(OUT + 'rail_ways_in.pkl', 'rb'))          # (b4_roads: metres of each railway way inside the square)
LINES = [(d['code'], d['rids'], d['en'], d['zh'], d['col'], d['grp'], d['lrt']) for d in _select(list(ROUTES.values()), _WIN)]
del _WIN
print('lines', len(LINES))
need = set()
for code, rids, *_ in LINES:
    for rid in rids:
        for ty, ref, role in ROUTES[rid][2]:
            if ty == 'w' and role in ('', 'forward', 'backward'): need.add(ref)
WAYS = {}
for wid, t, cs in pickle.load(open(OUT + 'raw_ways.pkl', 'rb')):
    if wid in need: WAYS[wid] = (t, [tuple(c) for c in cs])
print('route ways', len(need), 'found', len(WAYS))
def elflag(t):
    try: lay = int(t.get('layer', '0'))
    except ValueError: lay = 0
    if t.get('tunnel') in ('yes', 'building_passage', 'covered') or t.get('location') == 'underground' or lay < 0: return 2
    if t.get('bridge') in ('yes', 'viaduct', 'cantilever', 'trestle') or lay > 0: return 1
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
# deck heights for the transit tracks on the road bridges (the Yurikamome on the Rainbow Bridge's lower deck): the lowest road deck
# within 25 m (b4b sets those decks)
RD = load('roads.pkl'); dv = []
for i_, l_ in enumerate(RD['lines']):
    E_ = RD['elev'].get(i_)
    if E_ is None or not l_['br'] or l_['c'] > 12 or max(E_) < 40: continue          # (Tokyo: only the bay bridges' decks, not the Shuto viaducts beside the tracks)
    for p_, e_ in zip(l_['g'].coords, E_): dv.append((p_[0], p_[1], e_))
from scipy.spatial import cKDTree
DV = np.array(dv) if dv else np.zeros((0, 3)); DT = cKDTree(DV[:, :2]) if len(DV) else None
del RD
SPECIAL = []
def zof(p):
    if p[2] != 1: return 0.0
    if DT is not None:
        ii = DT.query_ball_point(p[:2], 25)
        if ii: return float(min(DV[k, 2] for k in ii))
    for bx_, z_ in SPECIAL:
        if bx_.contains(Point(p[0], p[1])): return z_
    return 0.0
mrt = []; kept = collections.defaultdict(dict); allpts = collections.defaultdict(list)
inside = lambda p: -HALF + 50 < p[0] < HALF - 50 and -HALF + 50 < p[1] < HALF - 50
def chain_all(rids):
    out = []
    for rid in rids: out += chain(rid)
    return out
for code, rids, en, zh, col, grp, lrt in LINES:
    G = kept[grp]
    for run in chain_all(rids):
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
                zz = [round(zof(p), 1) for p in seg]
                d_ = {'name':en, 'zh':zh, 'code':code, 'col':col, 'pts':[[round(p[0], 1), round(p[1], 1)] for p in seg], 'el':''.join(str(p[2]) for p in seg), 'grp':grp}
                if any(z > 0 for z in zz): d_['z'] = zz
                mrt.append(d_)
            i = j
        for p in R:
            if inside(p): G[(round(p[0]/10), round(p[1]/10))] = 1
print('mrt parts', len(mrt), [(m['code'], len(m['pts']), dict(collections.Counter(m['el'])), max(m.get('z', [0]))) for m in mrt])
# stations
def GRPTAG(t):
    s = (t.get('network', '') + ' ' + t.get('operator', '') + ' ' + t.get('name:en', '')).lower()
    if '新幹線' in s or 'shinkansen' in s: return {'shink', 'jr'}
    if '東京地下鉄' in s or '東京メトロ' in s or 'tokyo metro' in s: return {'metro'}
    if '東京都交通局' in s or '都営' in s or 'toei' in s: return {'toei', 'tram', 'agt'}
    if '横浜市交通局' in s or '横浜市営' in s: return {'ysub'}
    if 'jr' in s or '旅客鉄道' in s: return {'jr', 'shink'}
    if 'モノレール' in s or 'monorail' in s: return {'mono'}
    if 'ゆりかもめ' in s or 'yurikamome' in s or 'シーサイド' in s or 'ニューシャトル' in s: return {'agt'}
    return None
from scipy.spatial import cKDTree as _KD
KDT = {c: _KD(np.array([(p[0], p[1]) for p in P])) for c, P in allpts.items() if P}
stations = []
for t, (lon, lat) in NODES:
    if not (t.get('railway') in ('station', 'halt') or (t.get('public_transport') == 'station' and any(t.get(k) == 'yes' for k in ('train', 'subway', 'light_rail', 'monorail', 'tram')))) or not t.get('name'): continue
    if t.get('bus') == 'yes' and t.get('railway') not in ('station', 'halt'): continue
    x, y = w(lon, lat)
    if not (-HALF < x < HALF and -HALF < y < HALF): continue
    g = GRPTAG(t)
    codes = []
    for code, rid, en, zh, col, grp, lrt in LINES:
        if g and grp not in g and not (grp == 'priv' and g == {'agt'}): continue
        if code in KDT and KDT[code].query_ball_point((x, y), 90, return_length=True) > 0: codes.append(code)
    if not codes: continue
    nm = en_of(t) or t['name']; nm = re.sub(r'\s+Station$', '', nm)
    if any(s_['en'] == nm and set(s_['codes']) & set(codes) and math.hypot(s_['x'] - x, s_['y'] - y) < 500 for s_ in stations): continue
    stations.append({'en':nm, 'zh':zhof(t) or nm, 'codes':codes[:8], 'x':round(x), 'y':round(y)})
print('stations', len(stations), collections.Counter(s_['codes'][0][0] for s_ in stations))
# ---------------- runways and stands ----------------
R = load('roads.pkl')
# terminal buildings near Haneda from the compact building arrays (b5)
_Zf = np.load(OUT + 'bldA.npz'); _Z = {k: _Zf[k] for k in ('cx', 'cy', 'part', 'RS', 'BR', 'XY', 't')}; del _Zf; _x0, _y0 = w(139.735, 35.510); _x1, _y1 = w(139.840, 35.580)
_m = np.nonzero((_Z['cx'] > _x0) & (_Z['cx'] < _x1) & (_Z['cy'] > _y0) & (_Z['cy'] < _y1) & ~_Z['part'])[0]
Bl = {'b':[]}
for _k in _m:
    _a = _Z['RS'][_Z['BR'][_k]]; _b = _Z['RS'][_Z['BR'][_k] + 1]
    Bl['b'].append({'g':Polygon(_Z['XY'][_a:_b].astype(np.float64)), 't':int(_Z['t'][_k])})
del _Z
runways = []
for l in R['lines']:
    if l['c'] != 13 or l['g'].length < 900: continue
    cs = list(l['g'].coords); a, b = cs[0], cs[-1]
    runways.append({'a':[round(a[0], 1), round(a[1], 1)], 'b':[round(b[0], 1), round(b[1], 1)], 'len':round(l['g'].length), 'name':l['name'] or ''})
print('runways', [(r['len'], r['name'], [round(v, 4) for v in ll(*r['a'])][::-1]) for r in runways])
AIRPORTS = {'HND':(139.760, 35.535, 139.800, 35.565)}
APBOX = {'HND':(139.735, 35.510, 139.840, 35.580)}
for r_ in runways:
    m_ = ll((r_['a'][0] + r_['b'][0])/2, (r_['a'][1] + r_['b'][1])/2); r_['ap'] = next((k for k, b in APBOX.items() if b[0] <= m_[0] <= b[2] and b[1] <= m_[1] <= b[3]), '')
print('runways at the three airports', [(r_['ap'], r_['len']) for r_ in runways if r_['ap']])
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
