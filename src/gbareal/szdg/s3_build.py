# Stage 3: the new Shenzhen + Dongguan buildings for the Greater Bay page.
# Footprints: Overture Maps 2026-11-18.0 (OpenStreetMap, ODbL; East Asian buildings, Shi et al., CC BY 4.0).
# Height, in this order: (1) the tall-building lists (CTBUH Skyscraper Center + Wikipedia/Wikidata/OSM positions; szdg3d/*_towers),
# (2) OSM height / building:levels as carried by Overture, (3) 3D-GloBFP 2020 (Che et al. 2024, CC BY 4.0; an ML estimate),
# (4) an estimate by footprint size (labelled as such in the stats below).
# Towers on hold (DG China Resources Land Center etc.) lose their planned height.
import sys, json, gzip, base64, pickle, hashlib, collections, numpy as np, shapely
W = sys.argv[1]; AMIN = float(sys.argv[2]) if len(sys.argv) > 2 else 100.0
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'; D = '/home/claude/earth_online/site/gbadata/'
S = pickle.load(open(W + '/s2.pkl', 'rb'))
B = json.loads(gzip.decompress(base64.b64decode(open(D + 'gba_base.txt').read())))
HALF, CELL, N = B['HALF'], B['CELL'], B['N']; LON0, LAT0, MX, MY = B['lon0'], B['lat0'], B['MX'], B['MY']
def rle_dec(s): rl = np.frombuffer(base64.b64decode(s), '<u2').reshape(-1, 2); return np.repeat(rl[:, 0], rl[:, 1]).reshape(N, N)
lu = rle_dec(B['lu']); codes = rle_dec(B['codes'])
def cell(x, y): return min(N - 1, max(0, int((y + HALF)//CELL))), min(N - 1, max(0, int((x + HALF)//CELL)))
t = S['t']; g = shapely.from_wkb(S['g']); cx, cy, city, A, osm, gfp = S['cx'], S['cy'], S['city'], S['A'], S['osm'], S['gfp']
n = len(g)
ids = t.column('id').to_pylist()
oh = np.array([np.nan if v is None else v for v in t.column('height').to_pylist()], float)
ofl = np.array([np.nan if v is None else v for v in t.column('num_floors').to_pylist()], float)
omin = np.array([0.0 if v is None else v for v in t.column('min_height').to_pylist()], float)
cls = t.column('class').to_pylist(); sub = t.column('subtype').to_pylist(); hasp = np.array(t.column('has_parts').to_pylist(), bool)
und = np.array([bool(v) for v in t.column('is_underground').to_pylist()])
print('class construction:', sum(1 for c in cls if c == 'construction'), 'underground', int(und.sum()))
FLH = 3.1
H = np.full(n, np.nan); HS = np.zeros(n, np.int8)        # source: 1 list, 2 OSM height, 3 OSM levels, 4 GloBFP, 5 estimate
m = np.isfinite(oh) & (oh >= 2); H[m] = oh[m]; HS[m] = 2
m = ~np.isfinite(H) & np.isfinite(ofl) & (ofl >= 1); H[m] = ofl[m]*FLH + np.where(ofl[m] > 2, 1.0, 0.6); HS[m] = 3
m = ~np.isfinite(H) & np.isfinite(gfp) & (gfp >= 2); H[m] = gfp[m]; HS[m] = 4
def hsh(s, k=0): return int(hashlib.md5((str(s) + ':' + str(k)).encode()).hexdigest()[:8], 16)/0xffffffff
m = ~np.isfinite(H)
for k in np.flatnonzero(m):
    a = A[k]; r = hsh(ids[k])
    H[k] = 3.0 + 1.5*r if a < 40 else 6.0 + 3*r if a < 120 else 9.0 + 6*r if a < 600 else 10.0 + 8*r
    HS[k] = 5
# ---- tall-building lists ----
HERE = __import__('os').path.dirname(__import__('os').path.abspath(__file__)) + '/data/'
ts = json.load(open(HERE + 'towers_sz.json'))['rows']
td = json.load(open(HERE + 'towers_dg.json'))
towers = [(r['name_en'], r.get('name_zh') or '', float(r['height_m']), r['lat'], r['lon']) for r in ts if r.get('lat') and r.get('height_m')]
towers += [(r['name_en'], r.get('name_zh') or '', float(r['height_m']), r['lat'], r['lon']) for r in td['towers_completed'] if r.get('lat') and r.get('height_m')]
onhold = [r for r in td['not_completed'] if r.get('lat') and any(s in (r.get('status') or '') for s in ('On Hold', 'Cancelled', 'Vision', 'Proposed'))]
tree = shapely.STRtree(g)
def match(lat, lon, rad=30):
    x, y = (lon - LON0)*MX, (lat - LAT0)*MY; p = shapely.points(x, y)
    c = tree.query(p, predicate='within')
    c = [int(k) for k in c]
    if not c:
        near = tree.query(p, predicate='dwithin', distance=rad)
        c = sorted((int(k) for k in near), key=lambda k: shapely.distance(g[k], p))[:1]
    return c
over = collections.Counter(); log = []; tower_of = {}
for name, zh, h, lat, lon in towers:
    c = match(lat, lon)
    if not c: over['no footprint'] += 1; log.append(('nofp', name, h)); continue
    c = [k for k in c if A[k] >= 150] or c
    k = min(c, key=lambda k: A[k])                         # the tower, not the podium around it
    if A[k] > 6000 and H[k] < 0.5*h: over['podium skipped'] += 1; log.append(('podium', name, h, round(A[k]), round(H[k], 1))); continue
    if HS[k] in (2, 3) and h < 0.75*H[k]: over['taller OSM neighbour kept'] += 1; log.append(('skiplow', name, h, round(H[k], 1))); continue
    if k in tower_of and tower_of[k][1] >= h: over['shared'] += 1; continue
    if abs(H[k] - h) > 0.03*h: over['changed'] += 1; log.append(('fix', name, h, round(H[k], 1), int(HS[k])))
    else: over['same'] += 1
    H[k] = h; HS[k] = 1; tower_of[k] = (name, h)
for r in onhold:
    for k in match(r['lat'], r['lon'], 20):
        if H[k] > 100:
            old = H[k]; H[k] = gfp[k] if np.isfinite(gfp[k]) and gfp[k] >= 2 else 12.0; HS[k] = 4 if np.isfinite(gfp[k]) else 5
            log.append(('onhold', r['name_en'], old, round(H[k], 1))); over['on hold lowered'] += 1
# unfinished towers: OSM carries their planned height. A building of 150 m or more that no completed list entry claims, near a
# CTBUH entry that is under construction / stalled / on hold / proposed (SZ: the CTBUH city data; DG: not_completed), loses it.
cb = json.load(open(HERE + 'ctbuh_sz_status.json'))['rows']
unf = [(b['name_intl'], b['status'], float(b['latitude']), float(b['longitude'])) for b in cb if b['status'] in ('UC', 'STO', 'OH', 'PRO') and b.get('latitude') and b.get('longitude')]
unf += [(r['name_en'], r.get('status'), r['lat'], r['lon']) for r in onhold]
ux = np.array([(lon - LON0)*MX for _, _, lat, lon in unf]); uy = np.array([(lat - LAT0)*MY for _, _, lat, lon in unf])
for k in np.flatnonzero((H >= 150) & (HS >= 2)):
    if k in tower_of: continue
    d = np.hypot(ux - cx[k], uy - cy[k]); q = int(d.argmin()) if len(d) else -1
    if q >= 0 and d[q] < 80:
        old = H[k]; H[k] = gfp[k] if np.isfinite(gfp[k]) and gfp[k] >= 2 else 12.0; HS[k] = 4 if np.isfinite(gfp[k]) else 5
        over['unfinished lowered'] += 1; log.append(('unfinished', unf[q][0], unf[q][1], round(old), round(H[k], 1), round(d[q])))
# Shenzhen: CTBUH's city data covers every building of 250 m or more, completed or not; a 250 m+ OSM height in Shenzhen with no
# CTBUH entry within 80 m is not a real completed tower (planned / mis-tagged), so it loses that height too.
cbx = np.array([(float(b['longitude']) - LON0)*MX for b in cb if b.get('latitude')]); cby = np.array([(float(b['latitude']) - LAT0)*MY for b in cb if b.get('latitude')])
for k in np.flatnonzero((H >= 250) & (HS >= 2) & (city == 1)):
    if k in tower_of: continue
    if np.hypot(cbx - cx[k], cby - cy[k]).min() >= 80:
        old = H[k]; H[k] = gfp[k] if np.isfinite(gfp[k]) and gfp[k] >= 2 else 12.0; HS[k] = 4 if np.isfinite(gfp[k]) else 5
        over['250m+ not in CTBUH lowered'] += 1; log.append(('notctbuh', ids[k][:8], round(old), round(H[k], 1)))
print('towers', len(towers), dict(over))
for l in log:
    if l[0] in ('onhold', 'skiplow', 'notctbuh') or l[0] == 'fix' and l[2] >= 200: print(' ', l)
# tall data heights with no list entry (to check)
unm = [k for k in np.flatnonzero(H >= 250) if k not in tower_of]
print('>=250 m without a list entry:', [(ids[k][:8], round(H[k]), int(HS[k]), round(LAT0 + cy[k]/MY, 5), round(LON0 + cx[k]/MX, 5)) for k in unm])
# ---- parts (OSM building:part via Overture) ----
pt = S['pt']; pg = shapely.from_wkb(S['pg']); pbid = pt.column('building_id').to_pylist()
ph = np.array([np.nan if v is None else v for v in pt.column('height').to_pylist()], float)
pfl = np.array([np.nan if v is None else v for v in pt.column('num_floors').to_pylist()], float)
pmin = np.array([0.0 if v is None else v for v in pt.column('min_height').to_pylist()], float)
idx = {v: k for k, v in enumerate(ids)}
parts = collections.defaultdict(list)
for j, b in enumerate(pbid):
    k = idx.get(b)
    if k is None: continue
    h = ph[j] if np.isfinite(ph[j]) else (pfl[j]*FLH + 0.6 if np.isfinite(pfl[j]) else np.nan)
    if not np.isfinite(h) or h <= pmin[j] + 0.5: continue
    parts[k].append((pg[j], float(h), float(pmin[j])))
for k, ps in parts.items():                                  # a listed tower: its tallest part takes the list height
    if k in tower_of:
        top = max(ps, key=lambda p: p[1])
        if abs(top[1] - tower_of[k][1]) > 0.03*tower_of[k][1]:
            log.append(('partfix', tower_of[k][0], top[1], tower_of[k][1])); ps[ps.index(top)] = (top[0], tower_of[k][1], top[2])
print('buildings with usable parts', len(parts), 'parts', sum(len(v) for v in parts.values()))
# ---- keep ----
keep = (A >= AMIN) | (HS <= 3) | np.array([k in parts for k in range(n)]) | (H >= 30)
keep &= ~und
print('AMIN', AMIN, 'keep', int(keep.sum()), 'SZ', int((keep & (city == 1)).sum()), 'DG', int((keep & (city == 2)).sum()))
for nm, c in (('SZ', 1), ('DG', 2)):
    mm = keep & (city == c)
    print(nm, 'height source list/osmH/osmLv/gfp/est', [int((mm & (HS == s)).sum()) for s in (1, 2, 3, 4, 5)],
          'h>=50', int((mm & (H >= 50)).sum()), 'h>=100', int((mm & (H >= 100)).sum()), 'h>=200', int((mm & (H >= 200)).sum()))
# ---- types and colours (as gbareal/b5_buildings.py) ----
TYPEMAP = {'house':3, 'detached':3, 'semidetached_house':3, 'terrace':2, 'bungalow':3, 'apartments':2, 'residential':2, 'dormitory':2, 'commercial':4,
    'retail':4, 'supermarket':4, 'kiosk':13, 'office':5, 'industrial':6, 'warehouse':6, 'manufacture':6, 'service':6, 'storage_tank':15, 'school':7,
    'university':7, 'college':7, 'kindergarten':7, 'public':7, 'civic':7, 'government':7, 'fire_station':7, 'police':7, 'library':7, 'museum':7,
    'church':8, 'temple':8, 'religious':8, 'hospital':9, 'clinic':9, 'train_station':10, 'transportation':10, 'hangar':10, 'parking':11, 'hotel':12,
    'garage':13, 'garages':13, 'carport':13, 'shed':13, 'roof':13, 'greenhouse':13, 'hut':13, 'stadium':7, 'sports_centre':7, 'grandstand':7}
SUBMAP = {'residential':2, 'industrial':6, 'commercial':4, 'education':7, 'outbuilding':13, 'service':6, 'civic':7, 'transportation':10, 'religious':8,
    'medical':9, 'entertainment':7, 'agricultural':6, 'military':7}
WALLS = {0:[(222,218,208),(206,204,198),(230,226,216)], 2:[(236,234,226),(226,220,204),(214,210,200),(232,214,196),(206,214,222),(222,228,214),(238,226,206),(200,196,190),(228,210,210),(214,222,230),(240,238,232)],
    3:[(240,238,232),(232,226,212),(226,218,206),(236,230,220),(214,212,206),(232,222,214)], 4:[(222,214,200),(206,200,192),(190,186,180),(228,222,210)],
    5:[(150,166,178),(176,188,198),(132,148,160),(196,204,210),(168,178,180),(118,136,150)], 6:[(214,212,206),(196,198,196),(226,222,214)], 7:[(226,218,200),(212,204,186),(232,226,212)], 8:[(232,214,180),(214,190,160)],
    9:[(234,232,226),(222,226,230)], 10:[(210,212,214),(226,226,222)], 11:[(200,200,196),(214,212,206)], 12:[(214,208,196),(180,192,202),(226,222,214)], 13:[(180,176,166),(160,156,150),(200,196,190)], 14:[(212,210,204),(196,198,200),(180,188,196),(224,220,212)], 15:[(226,226,222)]}
def roof_of(tp, r):
    if tp == 3: return 2 if r < 0.4 else 0 if r < 0.75 else 1
    if tp == 2: return 1 if r < 0.55 else 0
    if tp == 13: return 1 if r < 0.6 else 3
    return 5 if r < 0.35 else 0
W_ = lambda x, y: ((x - LON0)*MX, (y - LAT0)*MY)
CBD = [(114.045, 22.528, 114.070, 22.548), (113.928, 22.508, 113.956, 22.530), (113.880, 22.515, 113.910, 22.545), (114.098, 22.535, 114.125, 22.552), (113.735, 23.005, 113.765, 23.030)]
CBDm = [(*W_(a, b), *W_(c, d)) for a, b, c, d in CBD]
inCBD = lambda x, y: any(a <= x <= c and b <= y <= d for a, b, c, d in CBDm)
out = []; nparts = 0; tc = collections.Counter()
for k in np.flatnonzero(keep):
    gk = g[k]; r = hsh(ids[k]); h = float(max(2.4, min(H[k], 600.0)))
    j_, i_ = cell(cx[k], cy[k]); lc = int(lu[j_, i_])
    tp = TYPEMAP.get(cls[k]) if cls[k] else None
    if tp is None and sub[k]: tp = SUBMAP.get(sub[k])
    if tp is None or tp == 2 and h >= 40 and inCBD(cx[k], cy[k]):
        a = A[k]
        if h >= 40 and (lc == 2 or inCBD(cx[k], cy[k])): tp = 5
        elif lc == 3: tp = 6
        elif lc == 6: tp = 7
        elif lc == 7: tp = 10 if a > 2000 else 6
        elif lc == 2: tp = 4 if h < 25 else 5
        elif a < 45: tp = 13
        else: tp = 2
    wall = WALLS.get(tp, WALLS[0])[int(r*997) % len(WALLS.get(tp, WALLS[0]))]
    rec = {'id': ids[k], 'h': round(h, 1), 'base': round(float(omin[k]) if omin[k] < h - 1 else 0.0, 1), 't': tp, 'wall': wall, 'roof': roof_of(tp, r),
           'rc': None, 'hs': int(HS[k]), 'city': int(city[k])}
    polys = [q for q in (gk.geoms if hasattr(gk, 'geoms') else [gk]) if q.geom_type == 'Polygon']
    if k in parts:
        ps = parts[k]
        rec['parts'] = []
        for q, ph_, pb in ps:
            for qq in (q.geoms if hasattr(q, 'geoms') else [q]):
                if qq.geom_type == 'Polygon' and qq.area >= 4: rec['parts'].append({'g': shapely.to_wkb(qq.simplify(0.25)), 'h': round(min(ph_, 600.0), 1), 'base': round(pb, 1)})
        # the outline not covered by ground parts stays as a podium at the lowest raised part base (as b7 podium fillers)
        gu = shapely.union_all([q for q, ph_, pb in ps if pb <= 2]) if any(pb <= 2 for q, ph_, pb in ps) else None
        rest = gk.difference(gu.buffer(0.8)) if gu is not None else gk
        if rest.area > 0.25*gk.area:
            bases = [pb for q, ph_, pb in ps if pb > 2]
            ph0 = min(bases) if bases else min(h, 12.0)
            for qq in (rest.geoms if hasattr(rest, 'geoms') else [rest]):
                if qq.geom_type == 'Polygon' and qq.area >= 25: rec['parts'].append({'g': shapely.to_wkb(qq.simplify(0.3)), 'h': round(ph0, 1), 'base': 0.0})
        nparts += len(rec['parts'])
        polys = polys[:1]
    for q in polys:
        q = q.simplify(0.3, preserve_topology=True)
        if q.is_empty or q.geom_type != 'Polygon' or q.area < 10: continue
        out.append(dict(rec, g=shapely.to_wkb(q))); rec = dict(rec); rec.pop('parts', None)
    tc[tp] += 1
print('records', len(out), 'part pieces', nparts, 'types', sorted(tc.items()))
pickle.dump({'b': out, 'log': log, 'amin': AMIN}, open(W + '/s3.pkl', 'wb'), protocol=4)
