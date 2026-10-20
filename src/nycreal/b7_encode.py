# stage 7 (New York): binary encodings for the app.
#   nyc_bld0 : 'SGB2' tile index + the big buildings (h >= 20 m, >= 900 m2, parts) of every tile, decoded at start
#   nyc_bld1..k : the small buildings (houses, sheds ...) of the tiles, decoded per tile when the camera comes near
#   nyc_roads ('SGR1'), nyc_water ('SGW1'), nyc_base (json, with precomputed statistics)
import sys, collections, hashlib, struct, gzip, base64; sys.path.insert(0, '.')
from common import *
import mapbox_earcut as earcut
from shapely.geometry import box, Polygon, Point
from shapely.ops import unary_union
from shapely.strtree import STRtree
from raster import polys_of
class W:
    def __init__(s): s.b = bytearray()
    def u8(s, v): s.b.append(int(v) & 255)
    def vu(s, v):
        v = int(v); assert v >= 0, v
        while True:
            c = v & 127; v >>= 7
            if v: s.b.append(c | 128)
            else: s.b.append(c); return
    def vs(s, v): v = int(v); s.vu((v << 1) ^ (v >> 63) if v < 0 else v << 1)
    def raw(s, bb): s.b += bb
def wz(path, data):
    z = gzip.compress(bytes(data), 9); open(OUT + path, 'wb').write(z); print(path, len(data), '->', len(z), flush=True); return len(z)
Q = 4.0
T = 2000; TX = int(2*HALF/T)
M = load('misc.pkl')
pa = np.load(OUT + 'pa.npy')
# ---------------- buildings ----------------
Bd = load('buildings.pkl')
parts_by = collections.defaultdict(list)
for p in Bd['parts']: parts_by[p['bid']].append(p)
_gnd = [b for b in Bd['b'] if b['base'] <= 0.5]
_gtree = STRtree([b['g'] for b in _gnd])
def _support(g, lvl, self_id=None):
    return [o['g'] for o in (_gnd[int(i)] for i in _gtree.query(g)) if o['id'] != self_id and o['h'] >= lvl - 1.5 and o['g'].intersects(g)]
nfix_plain = nfix_fill = 0
for b in Bd['b']:
    if b['base'] <= 0.5 or b['id'] in Bd['have_parts']: continue
    if b['h'] <= b['base'] + 0.5: b['base'] = 0.0; nfix_plain += 1; continue
    if b['h'] - b['base'] < 3: continue
    sup = _support(b['g'], b['base'], b['id'])
    un = b['g'].difference(unary_union(sup).buffer(0.8)) if sup else b['g']
    if un.area > 0.3*b['g'].area: b['base'] = 0.0; nfix_plain += 1
byid = {b['id']:b for b in Bd['b']}
for bid, ps in list(parts_by.items()):
    b = byid.get(bid)
    if not b: continue
    ps.sort(key=lambda p: p['base']); have = []
    for p in ps:
        if p['base'] > 2 and p['h'] - p['base'] >= 3 and p['base'] <= 60:
            sup = [q['g'] for q in have if q['h'] >= p['base'] - 1.5] + _support(p['g'], p['base'], bid)
            un = p['g'].difference(unary_union(sup).buffer(0.6)) if sup else p['g']
            if un.area > max(40, 0.25*p['g'].area):
                for q in (un.geoms if hasattr(un, 'geoms') else [un]):
                    q = q.buffer(-0.3).buffer(0.3)
                    if q.geom_type == 'MultiPolygon': q = max(q.geoms, key=lambda z: z.area)
                    if q.is_empty or q.geom_type != 'Polygon' or q.area < 25: continue
                    have.append({'bid':bid, 'g':q.simplify(0.3), 'h':p['base'], 'base':0.0, 'wall':p['wall'], 'rc':p['rc']}); nfix_fill += 1
        have.append(p)
    parts_by[bid] = have
print('grounded plain outlines', nfix_plain, '; podium fillers', nfix_fill, flush=True)
def tile_of(x, y): return min(TX - 1, max(0, int((y + HALF)//T)))*TX + min(TX - 1, max(0, int((x + HALF)//T)))
big_items = collections.defaultdict(list); small_items = collections.defaultdict(list)
# statistics (the app shows them without decoding every building): floor area -> residents and jobs
FH = lambda t: 3 if t in (1, 2, 3, 11) else 4.2 if t in (5, 12) else 5 if t in (6, 10) else 3.8
JOBS = {k: v*0.68 for k, v in {0:1/130, 4:1/32, 5:1/22, 6:1/80, 7:1/60, 8:1/220, 9:1/40, 10:1/110, 11:0, 12:1/75}.items()}
PEOPLE = {2:0.585/52, 3:0.585/68}
npa = len(M['PAS']) + 1
ST = {'n':0, 'gfa':0.0, 'pop':0.0, 'jobs':0.0, 'tall':0, 'byType':[0.0]*16, 'byPa':[[0.0, 0.0, 0, 0.0] for _ in range(npa)]}
OD = {}
def pa_of(x, y):
    i = min(N - 1, max(0, int((x + HALF)/CELL))); j = min(N - 1, max(0, int((y + HALF)/CELL))); return int(pa[j, i])
# the big buildings (decoded at start, drawn far away) must fit one staged file (<= 15 MB as base64): New York has very many
# buildings of 20 m+, so the threshold rises until they fit (the rest stream in with the small ones)
import sys as _sys
HB, AB = float(_sys.argv[1]) if len(_sys.argv) > 1 else 20.0, float(_sys.argv[2]) if len(_sys.argv) > 2 else 900.0
print('big threshold', HB, 'm or', AB, 'm2', flush=True)
for b in Bd['b']:
    c = b['g'].representative_point(); ti = tile_of(c.x, c.y)
    seed = int(hashlib.md5(str(b['id']).encode()).hexdigest()[:6], 16) % 251
    t = b['t']; A = b['g'].area
    if t not in (13, 15):
        fl = max(1, round((b['h'] - b['base'])/FH(t))); g = A*fl
        pop = g*PEOPLE.get(t, 0); jobs = g*JOBS.get(t, 0); P = ST['byPa'][pa_of(c.x, c.y)]
        ST['n'] += 1; ST['gfa'] += g; ST['pop'] += pop; ST['jobs'] += jobs; ST['byType'][t] += g; ST['tall'] += b['h'] >= 100
        P[0] += pop; P[1] += jobs; P[2] += 1; P[3] += g
        z = 1 if t in (2, 3) else 5 if t == 5 else 3 if t == 6 else 6 if t in (7, 9) else 2 if t in (4, 12) else 0
        if z:
            key = (int((c.x + HALF)//1000), int((c.y + HALF)//1000), z); o = OD.get(key)
            if o is None: o = OD[key] = [0.0, 0.0, 0.0]
            o[0] += g; o[1] += c.x*g; o[2] += c.y*g
    if b['id'] in Bd['have_parts']:
        for p in parts_by[b['id']]:
            big_items[ti].append({'g':p['g'], 'h':p['h'], 'base':p['base'], 't':t, 'wall':p['wall'] or b['wall'], 'roof':b['roof'], 'rc':p['rc'] or b['rc'], 'seed':seed, 'part':True})
        continue
    rec = dict(b, seed=seed, part=False)
    if b['h'] >= HB or A >= AB: big_items[ti].append(rec)
    else: small_items[ti].append(rec)
print('stats: n %d pop %.0f jobs %.0f gfa %.1f km2 tall %d' % (ST['n'], ST['pop'], ST['jobs'], ST['gfa']/1e6, ST['tall']), flush=True)
def area2(r): return sum(r[i][0]*r[(i+1) % len(r)][1] - r[(i+1) % len(r)][0]*r[i][1] for i in range(len(r)))
def enc_tile(lst, ti, big):
    wb = W(); tx, ty = ti % TX, ti // TX; ox, oy = -HALF + tx*T, -HALF + ty*T
    for b in lst:
        g = b['g']
        if not big and len(g.exterior.coords) > 6: g = g.simplify(0.25)
        if g.geom_type != 'Polygon' or g.is_empty: continue
        rings = [list(g.exterior.coords)[:-1]] + [list(r.coords)[:-1] for r in g.interiors if Polygon(r).area > 6]
        if len(rings[0]) < 3: continue
        if area2(rings[0]) < 0: rings[0] = rings[0][::-1]
        for k in range(1, len(rings)):
            if area2(rings[k]) > 0: rings[k] = rings[k][::-1]
        flags = (b['t'] & 31) | (64 if b['part'] else 0) | (128 if big else 0)
        wb.u8(flags); wb.vu(round(b['h']*10)); wb.vu(round(max(0, b['base'])*10))
        wb.u8(b['wall'][0]); wb.u8(b['wall'][1]); wb.u8(b['wall'][2])
        if b.get('rc'): wb.u8(255); wb.u8(b['rc'][0]); wb.u8(b['rc'][1]); wb.u8(b['rc'][2])
        else: wb.u8(b['roof'])
        wb.u8(b['seed']); wb.vu(len(rings))
        px, py = 0, 0
        for r in rings:
            wb.vu(len(r))
            for (x, y) in r:
                qx, qy = round((x - ox)*Q), round((y - oy)*Q); wb.vs(qx - px); wb.vs(qy - py); px, py = qx, qy
    return bytes(wb.b)
tiles = sorted(set(big_items) | set(small_items))
bigP = {ti: enc_tile(big_items[ti], ti, True) for ti in tiles}
smallP = {ti: enc_tile(small_items[ti], ti, False) for ti in tiles}
print('big', sum(len(v) for v in big_items.values()), sum(len(v) for v in bigP.values()), 'B; small', sum(len(v) for v in small_items.values()), sum(len(v) for v in smallP.values()), 'B', flush=True)
# small payloads into parts of <= ~11.5 MB gzip
LIM = 10.9e6
def split(budget):
    parts = [[]]; size = 0
    for ti in tiles:
        if size + len(smallP[ti]) > budget and parts[-1]: parts.append([]); size = 0
        parts[-1].append(ti); size += len(smallP[ti])
    return parts
budget = 30e6
while True:
    parts = split(budget); zs = [len(gzip.compress(b''.join(smallP[t] for t in p), 6)) for p in parts]
    if max(zs) <= LIM: break
    budget *= 0.85
print('small parts', len(parts), [round(z/1e6, 2) for z in zs], flush=True)
loc = {}
for k, p in enumerate(parts, 1):
    off = 0
    for ti in p: loc[ti] = (k, off); off += len(smallP[ti])
    wz('nyc_bld%d.bin.gz' % k, b''.join(smallP[t] for t in p))
w0 = W(); w0.raw(b'SGB2'); w0.vu(T); w0.vu(TX); w0.vu(len(parts)); w0.vu(len(tiles))
for ti in tiles:
    k, off = loc[ti]
    w0.vu(ti); w0.vu(len(big_items[ti])); w0.vu(len(bigP[ti])); w0.vu(len(small_items[ti])); w0.vu(k); w0.vu(off); w0.vu(len(smallP[ti]))
for ti in tiles: w0.raw(bigP[ti])
z0 = wz('nyc_bld0.bin.gz', w0.b)
if z0 > 10.9e6: print('BLD0 TOO BIG', z0); raise SystemExit(3)
del Bd, big_items, small_items, bigP, smallP, _gnd, _gtree, byid, parts_by
# ---------------- roads ----------------
R = load('roads.pkl')
names = ['']; nidx = {}
def nm(en, zh):
    if not en and not zh: return 0
    k = (en or '', zh or '')
    if k not in nidx: nidx[k] = len(names); names.append([en or '', zh or ''])
    return nidx[k]
refs = ['']; ridx = {}
def rf(r):
    if not r: return 0
    if r not in ridx: ridx[r] = len(refs); refs.append(r)
    return ridx[r]
SQ = box(-HALF + 5, -HALF + 5, HALF - 5, HALF - 5)
wr = W(); wr.raw(b'SGR1'); recs = []
for i, l in enumerate(R['lines']):
    g = l['g']
    if not SQ.contains(g):
        g = g.intersection(SQ)
        if g.is_empty or g.geom_type != 'LineString': continue
        l = dict(l, g=g, _cut=True)
    recs.append((i, l))
wr.vu(len(recs)); px, py = 0, 0
for i, l in recs:
    el = None if l.get('_cut') else R['elev'].get(i)
    cs = list(l['g'].coords)
    if el is not None and len(el) != len(cs): el = None
    hasel = el is not None and max(el) > 0.05
    flags = (1 if l['ow'] else 0) | (2 if l['br'] else 0) | (4 if hasel else 0) | (16 if l['kd'] and l['kd'].endswith('_link') else 0)
    esc = 2.5 if hasel and max(el) > 51 else 5.0
    if esc == 2.5: flags |= 32
    wr.u8(l['c']); wr.u8(flags); wr.vu(nm(l['name'], l['zh']) if l['c'] <= 11 or l['c'] in (13, 14) else 0); wr.vu(rf(l['ref'])); wr.vu(len(cs))
    for (x, y) in cs:
        qx, qy = round(x*Q), round(y*Q); wr.vs(qx - px); wr.vs(qy - py); px, py = qx, qy
    if hasel:
        for h in el: wr.u8(min(255, round(h*esc)))
print('road records', len(recs), 'names', len(names), 'refs', len(refs), flush=True)
wz('nyc_roads.bin.gz', wr.b)
del R
# ---------------- water ----------------
L = load('land.pkl'); F = load('fresh.pkl'); T2 = load('terrain.pkl'); lab = np.load(OUT + 'lab12.npy', mmap_mode='r')
sea = box(-HALF - 200, -HALF - 200, HALF + 200, HALF + 200).difference(L['sg'].buffer(0)).simplify(0.6)
def tri(poly):
    rings = [np.array(poly.exterior.coords)[:-1]] + [np.array(r.coords)[:-1] for r in poly.interiors]
    verts = np.concatenate(rings).astype(np.float64); ends = np.cumsum([len(r) for r in rings]).astype(np.uint32)
    return verts, earcut.triangulate_float64(verts, ends)
def emit_mesh(wt, polys):
    V = []; I = []; base = 0
    for p in polys:
        if p.area < 1: continue
        v, idx = tri(p); V.append(v); I.append(idx + base); base += len(v)
    V = np.concatenate(V) if V else np.zeros((0, 2)); I = np.concatenate(I) if I else np.zeros(0, np.uint32)
    wt.vu(len(V)); wt.vu(len(I)); wt.raw(np.round(V*Q).astype(np.int32).tobytes()); wt.raw(I.astype(np.uint32).tobytes())
    return len(V), len(I)
ww = W(); ww.raw(b'SGW1')
print('sea', emit_mesh(ww, polys_of(sea)), flush=True)
lvl = T2['lvl']; nlab = lab.shape[0]; bodies = collections.defaultdict(list)
for g in F['sig']:
    c = g.representative_point(); i = min(nlab - 1, max(0, int((c.x + HALF)/12))); j = min(nlab - 1, max(0, int((c.y + HALF)/12)))
    k = int(lab[j, i]); bodies[round(float(lvl[k]) if k else 0.0, 2)].append(g.simplify(0.5))
ww.vu(len(bodies))
for lv, gs in bodies.items():
    ww.raw(struct.pack('<f', lv)); emit_mesh(ww, [p for g in gs for p in polys_of(g.buffer(0))])
LUi = load('landuse.pkl')
piers = [g for pr, na, k, g in LUi if k == 'pier']
flat = [(1, g) for g in F['flat']] + [(2, g) for g in L['pools']] + [(3, g) for g in piers]
ww.vu(3)
for kind in (1, 2, 3):
    gs = [p for k, g in flat if k == kind for p in polys_of(g.buffer(0).simplify(0.3))]
    ww.u8(kind); print('flat', kind, emit_mesh(ww, gs), flush=True)
wz('nyc_water.bin.gz', ww.b)
# ---------------- base json ----------------
def rle(a):
    a = a.astype(np.uint8).ravel(); out = bytearray(); n = len(a)
    ch = np.flatnonzero(np.diff(a)) + 1; starts = np.concatenate([[0], ch]); lens = np.diff(np.concatenate([starts, [n]]))
    for s0, ln in zip(starts, lens):
        v = int(a[s0])
        while ln > 0:
            c = min(ln, 65535); out += struct.pack('<HH', v, c); ln -= c
    return base64.b64encode(bytes(out)).decode()
codes = np.load(OUT + 'codes.npy'); lu = np.load(OUT + 'lu.npy')
Hq = np.clip(np.round(T2['H']*10), -32000, 32000).astype(np.int16)
stats = {'n':ST['n'], 'gfa':round(ST['gfa']), 'pop':round(ST['pop']), 'jobs':round(ST['jobs']), 'tall':ST['tall'], 'byType':[round(v) for v in ST['byType']],
         'byPa':[[round(p[0]), round(p[1]), p[2], round(p[3])] for p in ST['byPa']],
         'od':[[k[2], round(o[0]), round(o[1]/o[0]), round(o[2]/o[0])] for k, o in OD.items() if o[0] > 2000]}
base = {'v':2, 'city':'nyc', 'lon0':LON0, 'lat0':LAT0, 'MX':MX, 'MY':MY, 'HALF':HALF, 'CELL':CELL, 'N':N, 'TS':TS, 'TN':TN, 'TILE':T, 'bldParts':len(parts),
        'codes':rle(codes), 'lu':rle(lu), 'pa':rle(pa), 'H':base64.b64encode(Hq.tobytes()).decode(),
        'names':names, 'refs':refs, 'stats':stats, **{k: M[k] for k in ('PAS', 'REGS', 'places', 'pois', 'waters', 'mrt', 'stations', 'f1', 'runways', 'stands', 'palines')}}
wz('nyc_base.json.gz', json.dumps(base, separators=(',', ':'), ensure_ascii=False).encode())
print('done')
