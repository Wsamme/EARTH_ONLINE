# stage 7: binary encodings for the app
import sys; sys.path.insert(0, '.')
from common import *
import struct, gzip, base64, collections, hashlib
import mapbox_earcut as earcut
from shapely.geometry import box, Polygon, MultiPolygon
from shapely.ops import unary_union
from shapely.prepared import prep
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
    open(OUT + path, 'wb').write(gzip.compress(bytes(data), 9)); print(path, len(data), '->', len(gzip.compress(bytes(data), 9)))
Q = 4.0   # 0.25 m units
# ---------------- buildings ----------------
T = 2000; TX = int(2*HALF/T)
Bd = load('buildings.pkl')
from shapely.geometry import Point as _Pt
from shapely import affinity as _aff
_jc = w(103.989750, 1.360222); _ang = math.radians(90 - 113)       # long axis bearing 113 deg (from north)
JEWEL = _aff.rotate(_aff.scale(_Pt(_jc).buffer(1, 64), 101.3 + 4, 76 + 4), _ang, use_radians=True)
for b in Bd['b']:
    if b['g'].intersects(JEWEL) and not JEWEL.contains(b['g'].representative_point()):
        d = b['g'].difference(JEWEL)
        if d.geom_type == 'MultiPolygon': d = max(d.geoms, key=lambda q: q.area)
        if d.geom_type == 'Polygon' and d.area > 20: b['g'] = d; print('jewel clip', b.get('name'), round(d.area))
items = collections.defaultdict(list)
parts_by = collections.defaultdict(list)
for p in Bd['parts']: parts_by[p['bid']].append(p)

# ---- v20: ground floating buildings. OSM often maps only the upper parts of a building (a tower part from level 3 up)
# or gives a plain outline a min_height while the podium under it is not mapped: the block would hover. Fill under them.
from shapely.strtree import STRtree
_gnd = [b for b in Bd['b'] if not b['foreign'] and b['base'] <= 0.5]
_gtree = STRtree([b['g'] for b in _gnd])
def _support(g, lvl, self_id=None):
    out = []
    for i in _gtree.query(g):
        o = _gnd[int(i)]
        if o['id'] != self_id and o['h'] >= lvl - 1.5 and o['g'].intersects(g): out.append(o['g'])
    return out
nfix_plain = nfix_fill = 0; afill = 0
for b in Bd['b']:
    if b['foreign'] or b['base'] <= 0.5 or b['id'] in Bd['have_parts']: continue
    if b['h'] <= b['base'] + 0.5: b['base'] = 0.0; nfix_plain += 1; continue
    if b['h'] - b['base'] < 3: continue                 # canopies and link-way roofs stay up on their (unmodelled) posts
    sup = _support(b['g'], b['base'], b['id'])
    un = b['g'].difference(unary_union(sup).buffer(0.8)) if sup else b['g']
    if un.area > 0.3*b['g'].area: b['base'] = 0.0; nfix_plain += 1
byid = {b['id']:b for b in Bd['b']}
for bid, ps in list(parts_by.items()):
    b = byid.get(bid)
    if not b or b['foreign']: continue
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
                    f = {'bid':bid, 'g':q.simplify(0.3), 'h':p['base'], 'base':0.0, 'wall':p['wall'], 'rc':p['rc']}
                    have.append(f); afill += q.area; nfix_fill += 1
        have.append(p)
    parts_by[bid] = have
print('grounded plain outlines', nfix_plain, '; podium fillers under floating parts', nfix_fill, round(afill), 'm2')
def tile_of(x, y): return min(TX - 1, max(0, int((y + HALF)//T)))*TX + min(TX - 1, max(0, int((x + HALF)//T)))
nrec = 0
for b in Bd['b']:
    if b.get('name') == 'Changi Airport Terminal 5': continue      # v20: still under construction (opens mid-2030s)
    c = b['g'].representative_point(); ti = tile_of(c.x, c.y)
    seed = int(hashlib.md5(b['id'].encode()).hexdigest()[:6], 16) % 251
    if b['id'] in Bd['have_parts'] and not b['foreign']:
        for p in parts_by[b['id']]:
            items[ti].append({'g':p['g'], 'h':p['h'], 'base':p['base'], 't':b['t'], 'wall':p['wall'] or b['wall'], 'roof':b['roof'], 'rc':p['rc'] or b['rc'], 'seed':seed, 'foreign':False, 'part':True})
        continue
    items[ti].append(dict(b, seed=seed, part=False))
wb = W(); wb.raw(b'SGB1'); wb.vu(T); wb.vu(TX); wb.vu(len(items))
for ti in sorted(items):
    lst = items[ti]; tx, ty = ti % TX, ti // TX; ox, oy = -HALF + tx*T, -HALF + ty*T
    wb.vu(ti); wb.vu(len(lst))
    for b in lst:
        g = b['g']; A = g.area
        big = b['h'] >= 20 or A >= 900 or b['part']
        rings = [list(g.exterior.coords)[:-1]] + [list(r.coords)[:-1] for r in g.interiors if Polygon(r).area > 6]
        # exterior counter-clockwise, holes clockwise
        def area2(r): return sum(r[i][0]*r[(i+1) % len(r)][1] - r[(i+1) % len(r)][0]*r[i][1] for i in range(len(r)))
        if area2(rings[0]) < 0: rings[0] = rings[0][::-1]
        for k in range(1, len(rings)):
            if area2(rings[k]) > 0: rings[k] = rings[k][::-1]
        flags = (b['t'] & 31) | (32 if b['foreign'] else 0) | (64 if b['part'] else 0) | (128 if big else 0)
        wb.u8(flags); wb.vu(round(b['h']*10)); wb.vu(round(max(0, b['base'])*10))
        wb.u8(b['wall'][0]); wb.u8(b['wall'][1]); wb.u8(b['wall'][2])
        if b.get('rc'): wb.u8(255); wb.u8(b['rc'][0]); wb.u8(b['rc'][1]); wb.u8(b['rc'][2])
        else: wb.u8(b['roof'])
        wb.u8(b['seed'])
        wb.vu(len(rings))
        px, py = 0, 0
        for r in rings:
            wb.vu(len(r))
            for (x, y) in r:
                qx, qy = round((x - ox)*Q), round((y - oy)*Q)
                wb.vs(qx - px); wb.vs(qy - py); px, py = qx, qy
        nrec += 1
print('building records', nrec, 'tiles', len(items))
wz('sg_bld.bin.gz', wb.b)
# ---------------- roads ----------------
R = load('roads.pkl'); M = load('misc.pkl')
L = load('land.pkl'); sgp = prep(L['sg'].buffer(150)); fop = prep(L['foreign'])
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
sentosa = box(*w(103.80, 1.235), *w(103.845, 1.268)); changi = box(*w(103.975, 1.33), *w(104.0, 1.37))
wr = W(); wr.raw(b'SGR1')
recs = []
for i, l in enumerate(R['lines']):
    c = l['c']; g = l['g']
    m = g.interpolate(0.5, normalized=True)
    foreign = not sgp.contains(m) or fop.contains(m)
    if foreign and (c > 10 or c in (13, 14)): continue
    if c == 16 and not (sentosa.contains(m) or changi.contains(m)): continue
    recs.append((i, l, foreign))
wr.vu(len(recs)); px, py = 0, 0
for i, l, foreign in recs:
    el = R['elev'].get(i)
    cs = list(l['g'].coords)
    if el is not None and len(el) != len(cs): el = None
    hasel = el is not None and max(el) > 0.05
    flags = (1 if l['ow'] else 0) | (2 if l['br'] else 0) | (4 if hasel else 0) | (8 if foreign else 0) | (16 if l['kd'] and l['kd'].endswith('_link') else 0)
    wr.u8(l['c']); wr.u8(flags); wr.vu(nm(l['name'], l['zh']) if l['c'] <= 11 or l['c'] in (13, 14) else 0); wr.vu(rf(l['ref'])); wr.vu(len(cs))
    first = True
    for (x, y) in cs:
        qx, qy = round(x*Q), round(y*Q); wr.vs(qx - px); wr.vs(qy - py); px, py = qx, qy
    if hasel:
        for h in el: wr.u8(min(255, round(h*5)))
print('road records', len(recs), 'names', len(names), 'refs', len(refs))
wz('sg_roads.bin.gz', wr.b)
# ---------------- water ----------------
F = load('fresh.pkl'); T2 = load('terrain.pkl'); lab = np.load(OUT + 'lab10.npy')
lat_lo, lat_hi = 1.1435, 1.4825
y_hi = w(0, lat_hi)[1]; y_lo = w(0, lat_lo)[1]
ext = [box(-HALF - 10, y_hi - 5, HALF + 10, HALF + 10)]
# south: foreign land touching the data edge continues south if wide
strip = L['foreign'].intersection(box(-HALF, y_lo, HALF, y_lo + 12))
for q in polys_of(strip):
    x0, _, x1, _ = q.bounds
    if x1 - x0 > 1500: ext.append(box(x0, -HALF - 10, x1, y_lo + 6))
land_all = unary_union([L['sg'], L['foreign']] + ext).buffer(0)
sea = box(-HALF - 200, -HALF - 200, HALF + 200, HALF + 200).difference(land_all)
sea = sea.simplify(0.6)
def tri(poly):
    rings = [np.array(poly.exterior.coords)[:-1]] + [np.array(r.coords)[:-1] for r in poly.interiors]
    verts = np.concatenate(rings).astype(np.float64)
    ends = np.cumsum([len(r) for r in rings]).astype(np.uint32)
    idx = earcut.triangulate_float64(verts, ends)
    return verts, idx
def emit_mesh(wt, polys):
    V = []; I = []; base = 0
    for p in polys:
        if p.area < 1: continue
        v, idx = tri(p)
        V.append(v); I.append(idx + base); base += len(v)
    V = np.concatenate(V) if V else np.zeros((0, 2)); I = np.concatenate(I) if I else np.zeros(0, np.uint32)
    wt.vu(len(V)); wt.vu(len(I))
    wt.raw(np.round(V*Q).astype(np.int32).tobytes()); wt.raw(I.astype(np.uint32).tobytes())
    return len(V), len(I)
ww = W(); ww.raw(b'SGW1')
print('sea', emit_mesh(ww, polys_of(sea)))
# fresh water bodies with their levels
lvl = T2['lvl']
bodies = collections.defaultdict(list)
for g in F['sig']:
    c = g.representative_point(); i = min(5599, max(0, int((c.x + HALF)/10))); j = min(5599, max(0, int((c.y + HALF)/10)))
    k = int(lab[j, i]); bodies[round(float(lvl[k]) if k else 0.0, 2)].append(g.simplify(0.5))
ww.vu(len(bodies))
for lv, gs in bodies.items():
    ww.raw(struct.pack('<f', lv)); emit_mesh(ww, [p for g in gs for p in polys_of(g.buffer(0))])
# flat features: small ponds (kind 1), pools (2), piers (3)
LUi = load('landuse.pkl')
piers = [g for pr, na, k, g in LUi if k == 'pier']
flat = [(1, g) for g in F['flat']] + [(2, g) for g in L['pools']] + [(3, g) for g in piers]
ww.vu(3)
for kind in (1, 2, 3):
    gs = [p for k, g in flat if k == kind for p in polys_of(g.buffer(0).simplify(0.3))]
    ww.u8(kind); print('flat', kind, emit_mesh(ww, gs))
wz('sg_water.bin.gz', ww.b)
# ---------------- base json ----------------
def rle(a):
    a = a.astype(np.uint8).ravel(); out = bytearray(); i = 0; n = len(a)
    ch = np.flatnonzero(np.diff(a)) + 1; starts = np.concatenate([[0], ch]); lens = np.diff(np.concatenate([starts, [n]]))
    for s0, ln in zip(starts, lens):
        v = int(a[s0])
        while ln > 0:
            c = min(ln, 65535); out += struct.pack('<HH', v, c); ln -= c
    return base64.b64encode(bytes(out)).decode()
codes = np.load(OUT + 'codes25.npy'); lu = np.load(OUT + 'lu25.npy'); pa = np.load(OUT + 'pa25.npy'); rg = np.load(OUT + 'rg25.npy')
Hq = np.clip(np.round(T2['H']*10), -32000, 32000).astype(np.int16)
base = {'v':1, 'lon0':LON0, 'lat0':LAT0, 'MX':MX, 'MY':MY, 'HALF':HALF, 'CELL':CELL, 'N':N, 'TS':TS, 'TN':TN, 'TILE':T,
        'codes':rle(codes), 'lu':rle(lu), 'pa':rle(pa), 'H':base64.b64encode(Hq.tobytes()).decode(),
        'PAS':M['PAS'], 'REGS':M['REGS'], 'places':M['places'], 'pois':M['pois'], 'waters':M['waters'], 'mrt':M['mrt'], 'stations':M['stations'], 'f1':M['f1'],
        'names':names, 'refs':refs, **load('extra.pkl')}
s = json.dumps(base, separators=(',', ':'), ensure_ascii=False).encode()
wz('sg_base.json.gz', s)
