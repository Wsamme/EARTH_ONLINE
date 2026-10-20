# stage 6 (Hong Kong): districts (Hong Kong neighbourhoods: Voronoi cells of the suburb / town / quarter places inside each of the
# 18 districts; the Shenzhen subdistricts), regions (the 18 districts, the Shenzhen districts), labels (places, POIs, waters), rail
# (MTR, Light Rail, trams, the Peak Tram, Shenzhen Metro) with elevation flags and deck heights on the bridges, stations, the Ngong
# Ping 360 ropeway, runways, stands, district lines
import sys, collections, re; sys.path.insert(0, '.')
from common import *
import shapely.wkb
from shapely.geometry import Point, LineString, MultiPoint, box, Polygon
from shapely.ops import unary_union, linemerge, voronoi_diagram
from shapely.prepared import prep
from shapely.strtree import STRtree
from PIL import Image
from raster import raster, polys_of
from hk_names import names as _names, DISTRICT_EN, s2
SQ = box(-HALF, -HALF, HALF, HALF)
A = pickle.load(open(OUT + 'raw_areas.pkl', 'rb'))
NODES = pickle.load(open(OUT + 'raw_nodes.pkl', 'rb'))
L = load('land.pkl'); LAND = L['all']; HKL = L['sg']; landp = prep(LAND.buffer(400)); hkp = prep(L['hk'])
def zhof(t): return _names(t)[1]
def enof(t): return _names(t)[0] or _names(t)[1]
def geo(wk):
    try: return proj(shapely.wkb.loads(wk)).buffer(0)
    except Exception: return None
# ---------------- districts ----------------
HKD, SZD, SZS = [], [], []          # Hong Kong's 18 districts, Shenzhen districts, Shenzhen subdistricts (jiedao)
for oid, fw, t, wk in A:
    if t.get('boundary') != 'administrative' or not t.get('name'): continue
    al = t.get('admin_level'); g = None
    if al == '6':
        g = geo(wk)
        if g is None or g.is_empty: continue
        c = g.representative_point()
        if hkp.contains(c) and t.get('name:en', '').endswith('District'): HKD.append((t.get('name:en').replace(' District', ''), t, g))
        elif not hkp.contains(c) and (t.get('name') or '').endswith('区') and g.intersects(SQ) and t.get('name') in ('罗湖区', '福田区', '南山区', '宝安区', '龙岗区', '盐田区', '龙华区'): SZD.append((t.get('name:en') or t['name'], t, g))
    elif al == '8':
        g = geo(wk)
        if g is None or g.is_empty: continue
        c = g.representative_point()
        if not hkp.contains(c) and g.intersects(SQ): SZS.append((t.get('name:en') or t['name'], t, g))
print('HK districts', len(HKD), 'Shenzhen districts', len(SZD), 'subdistricts', len(SZS))
assert len(HKD) == 18, [d[0] for d in HKD]
# Hong Kong neighbourhoods: Voronoi cells of the suburb / town / quarter places (deduplicated by name), clipped to their district
seedsrc = [(t, w(lon, lat)) for t, (lon, lat) in NODES if t.get('place') in ('suburb', 'town', 'quarter')]
for oid, fw, t, wk in A:
    if t.get('place') in ('suburb', 'town', 'quarter') and t.get('name'):
        g = geo(wk)
        if g is not None and not g.is_empty: c = g.representative_point(); seedsrc.append((t, (c.x, c.y)))
seeds = {}
for t, (x, y) in seedsrc:
    en, zh = enof(t), zhof(t)
    if not zh or not hkp.contains(Point(x, y)) or not landp.contains(Point(x, y)): continue
    pr = {'town':0, 'suburb':1, 'quarter':2}[t['place']]
    k = zh
    if k not in seeds or pr < seeds[k][0]: seeds[k] = (pr, en, zh, x, y, t)
seeds = sorted(seeds.values(), key=lambda s: s[0])
room = 254 - len(SZS)
seeds = seeds[:max(18, room - 4)]
print('HK neighbourhood seeds', len(seeds))
D = []        # (en, tags, geom) in raster order: later ones overwrite
for nm, t, g in SZS:
    g = g.intersection(SQ)
    if g.area < 2e5 or LAND.intersection(g).area < 1e5: continue
    D.append((nm, t, g))
nempty = 0
for dn, dt, dg in HKD:
    mine = [k for k, s_ in enumerate(seeds) if dg.contains(Point(s_[3], s_[4]))]
    if not mine:
        D.append((dn, dt, dg.intersection(SQ))); nempty += 1; continue
    # the Voronoi cells of the district's own seeds, clipped to the district (so the cells tile it exactly)
    if len(mine) == 1: cells = {mine[0]: dg}
    else:
        vor = voronoi_diagram(MultiPoint([(seeds[k][3], seeds[k][4]) for k in mine]), envelope=dg.envelope.buffer(2000)); cells = {}
        for cell in vor.geoms:
            for k in mine:
                if cell.contains(Point(seeds[k][3], seeds[k][4])): cells[k] = cell.intersection(dg); break
    for k, g in cells.items():
        if g.is_empty: continue
        s_ = seeds[k]; D.append((s_[1] or s_[2], dict(s_[5], **{'name:en':s_[1] or s_[2]}), g))
print('districts without seeds', nempty)
if len(D) > 254:
    keep = set(id(d) for d in sorted(D, key=lambda d: -LAND.intersection(d[2]).area)[:254]); D = [d for d in D if id(d) in keep]
paimg = Image.new('L', (N, N), 0); PAS = []; PG = []
for i, (nm, t, g) in enumerate(D, 1):
    raster([g], CELL, i, paimg)
    gl = g.intersection(LAND); c = (gl if not gl.is_empty else g).representative_point()
    PAS.append({'en':nm, 'zh':zhof(t) or nm, 'x':round(c.x), 'y':round(c.y), 'km2':round(gl.area/1e6, 2)}); PG.append(g)
assert len(PAS) < 255, len(PAS)
pa = np.asarray(paimg)
rgimg = Image.new('L', (N, N), 0); REGS = []
for nm, t, g in HKD + SZD:
    g = g.intersection(SQ); gl = g.intersection(LAND)
    if gl.area < 1e6: continue
    raster([g], CELL, len(REGS) + 1, rgimg); c = gl.representative_point()
    REGS.append({'en':nm, 'zh':zhof(t) or nm, 'x':round(c.x), 'y':round(c.y), 'r':round(math.sqrt(gl.area/math.pi))})
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
PK = {'city':'city', 'town':'town', 'suburb':'suburb', 'quarter':'quarter', 'neighbourhood':'neighbourhood', 'village':'neighbourhood', 'hamlet':'locality', 'locality':'locality', 'island':'island', 'islet':'island'}
places = []; seenp = set()
for t, (lon, lat) in NODES:
    k = PK.get(t.get('place'))
    if not k: continue
    x, y = w(lon, lat)
    if not (-HALF < x < HALF and -HALF < y < HALF) or not landp.contains(Point(x, y)): continue
    nm = enof(t); key = (nm, round(x/500), round(y/500))
    if not nm: continue
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
    nm = enof(t)
    if not nm: continue
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
WFIX = {'后海灣 Deep Bay - 深圳湾 Shenzhen Bay':('Deep Bay (Shenzhen Bay)', '后海湾（深圳湾）'), '大鹏湾 - 大鵬灣 Mirs Bay':('Mirs Bay', '大鹏湾'),
        '大濠水道 / 大嶼海峽 Lantau Channel':('Lantau Channel', '大屿海峡'), '担杆水道 / 擔桿水道 Dangan Channel':('Dangan Channel', '担杆水道')}
def wname(t):
    if t.get('name') in WFIX: return WFIX[t['name']]
    return enof(t), zhof(t)
for t, (lon, lat) in NODES:
    nm = t.get('name')
    if not nm: continue
    k = t.get('natural') if t.get('natural') in ('bay', 'strait') else t.get('place') if t.get('place') in ('sea', 'ocean') else None
    if not k: continue
    x, y = w(lon, lat)
    if not (-HALF < x < HALF and -HALF < y < HALF): continue
    en, zh = wname(t)
    if not en: continue
    waters.append({'en':en, 'zh':zh, 'k':k, 'kd':None, 'x':round(x), 'y':round(y), 'mz':13, 'b':0})
for oid, fw, t, wk in A:
    if not t.get('name') or t.get('natural') not in ('bay', 'strait'): continue
    g = geo(wk)
    if g is None or g.is_empty: continue
    gs = g.intersection(SQ).difference(LAND)
    if gs.area < 2e5: continue
    c = gs.representative_point(); en, zh = wname(t)
    if not en: continue
    big = gs.area > 5e6
    waters.append({'en':en, 'zh':zh, 'k':t['natural'], 'kd':None, 'x':round(c.x), 'y':round(c.y), 'mz':10 if big else 12, 'b':1 if big else 0})
for d, g in L['fresh_list']:
    nm = d.get('name')
    if not nm or g.area < 1.5e5 or ';' in nm: continue
    c = g.representative_point()
    if not SQ.contains(c): continue
    big = g.area > 1.5e6; en, zh = _names({'name':nm, 'name:zh':d.get('zh')})
    waters.append({'en':en or zh, 'zh':zh, 'k':'reservoir' if d.get('water') == 'reservoir' or 'Reservoir' in nm else 'lake', 'kd':d.get('kind'), 'x':round(c.x), 'y':round(c.y), 'mz':10 if big else 13, 'b':1 if big else 0})
# Victoria Harbour is not mapped as a named water area: its label at the middle of the harbour
x, y = w(114.172, 22.290); waters.append({'en':'Victoria Harbour', 'zh':'维多利亚港', 'k':'bay', 'kd':None, 'x':round(x), 'y':round(y), 'mz':9, 'b':1})
ws = {}
for t in waters:
    k = (t['en'], round(t['x']/8000), round(t['y']/8000))
    if k not in ws or t['b'] > ws[k]['b']: ws[k] = t
waters = sorted(ws.values(), key=lambda t: t['mz'])
print('named waters', len(waters), [(t['en'], t['zh'], t['k']) for t in waters[:30]])
# ---------------- rail transit ----------------
ROUTES = {r[0]: r for r in pickle.load(open(OUT + 'raw_routes.pkl', 'rb'))}
from hk_lines import select as _select
LINES = [(d['code'], d['rids'], d['en'], d['zh'], d['col'], d['grp'], d['lrt']) for d in _select(list(ROUTES.values()))]
print('lines', len(LINES))
need = set()
for code, rids, *_ in LINES:
    for rid in rids:
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
# deck heights for the tracks on the road bridges (the Airport Express / Tung Chung Line on the lower decks of Tsing Ma and
# Kap Shui Mun): the lowest road deck within 25 m (b4b sets those decks)
RD = load('roads.pkl'); dv = []
for i_, l_ in enumerate(RD['lines']):
    E_ = RD['elev'].get(i_)
    if E_ is None or not l_['br'] or l_['c'] > 12 or max(E_) < 15: continue
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
    s = (t.get('network', '') + ' ' + t.get('operator', '') + ' ' + t.get('name', '')).lower()
    if 'light rail' in s or '輕鐵' in s or t.get('station') == 'light_rail' or t.get('light_rail') == 'yes': return 'lr'
    if 'peak tram' in s or '山頂纜車' in s: return 'peak'
    if '深圳地铁' in s or 'shenzhen metro' in s: return 'szm'
    if 'mtr' in s or '港鐵' in s or '港铁' in s: return 'mtr'
    return None
stations = []
# candidates: station nodes, then station areas (many MTR stations are mapped as areas), then the stop positions (railway=stop with
# subway / train / light_rail = yes) for stations mapped by their platforms only; duplicates (same name within 400 m) are skipped
SCAND = [(t, ll2) for t, ll2 in NODES if t.get('railway') in ('station', 'halt') or (t.get('public_transport') == 'station' and any(t.get(k) == 'yes' for k in ('train', 'subway', 'light_rail', 'monorail', 'tram', 'funicular')))]
for oid, fw, t, wk in A:
    if t.get('railway') == 'station' or (t.get('public_transport') == 'station' and t.get('bus') != 'yes' and t.get('amenity') != 'bus_station'):
        g = geo(wk)
        if g is not None and not g.is_empty: c = g.representative_point(); SCAND.append((t, ll(c.x, c.y)))
SCAND += [(t, ll2) for t, ll2 in NODES if t.get('railway') == 'stop' and any(t.get(k) == 'yes' for k in ('train', 'subway', 'light_rail'))]
for t, (lon, lat) in SCAND:
    if not t.get('name'): continue
    if t.get('bus') == 'yes' and t.get('railway') not in ('station', 'halt'): continue
    x, y = w(lon, lat)
    if not (-HALF < x < HALF and -HALF < y < HALF): continue
    g = GRPTAG(t)
    codes = []
    for code, rid, en, zh, col, grp, lrt in LINES:
        if g and grp != g: continue
        if grp == 'tram': continue
        if any(abs(p[0] - x) < 90 and abs(p[1] - y) < 90 and math.hypot(p[0] - x, p[1] - y) < 90 for p in allpts[code]): codes.append(code)
    if not codes: continue
    nm = enof(t) or t['name']; nm = re.sub(r'\s+(Station)$', '', nm)
    if any(s['en'] == nm and math.hypot(s['x'] - x, s['y'] - y) < 400 for s in stations): continue
    stations.append({'en':nm, 'zh':zhof(t) or nm, 'codes':codes, 'x':round(x), 'y':round(y)})
print('stations', len(stations), collections.Counter(s['codes'][0][0] for s in stations))
# ---------------- the Ngong Ping 360 ropeway (aerialway=gondola): its stations are the turning points of the line ----------------
ropes = []
for wid, t, cs in pickle.load(open(OUT + 'raw_ways.pkl', 'rb')):
    if t.get('aerialway') in ('gondola', 'cable_car') and ('Ngong Ping' in (t.get('name') or '') or '昂坪' in (t.get('name') or '')):
        ln = LineString([w(*c) for c in cs]).simplify(25)
        ropes.append({'en':'Ngong Ping 360', 'zh':'昂坪360缆车', 'pts':[[round(x, 1), round(y, 1)] for x, y in ln.coords]})
print('ropeways', [(r['en'], len(r['pts'])) for r in ropes])
# ---------------- runways and stands ----------------
R = load('roads.pkl'); Bl = load('buildings.pkl')
runways = []
for l in R['lines']:
    if l['c'] != 13 or l['g'].length < 900: continue
    cs = list(l['g'].coords); a, b = cs[0], cs[-1]
    runways.append({'a':[round(a[0], 1), round(a[1], 1)], 'b':[round(b[0], 1), round(b[1], 1)], 'len':round(l['g'].length), 'name':l['name'] or ''})
print('runways', [(r['len'], r['name'], [round(v, 4) for v in ll(*r['a'])][::-1]) for r in runways])
AIRPORTS = {'HKG':(113.905, 22.300, 113.950, 22.325)}
APBOX = {'HKG':(113.860, 22.280, 113.960, 22.345)}
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
save({'PAS':PAS, 'REGS':REGS, 'places':places, 'pois':pois, 'waters':waters, 'mrt':mrt, 'stations':stations, 'f1':[], 'runways':runways, 'stands':stands, 'palines':palines, 'ropes':ropes}, 'misc.pkl')
print('saved')
