# Stage 4: rewrite the Greater Bay building files. Hong Kong and context records are copied byte for byte from the current files;
# the Shenzhen and Dongguan records are replaced by stage 3's. Format and split as gbareal/b7_encode.py (SGB2, part files <= 10.9 MB gz).
# The base json gets the new part count and the building statistics recomputed with b7's formulas.
import sys, json, gzip, base64, pickle, hashlib, collections, struct, numpy as np, shapely
from shapely.geometry import Polygon
W = sys.argv[1]; OUTD = sys.argv[2]; HB, AB = 20.0, 900.0
O = W + '/orig/'
def load(f): return gzip.decompress(base64.b64decode(open(O + f).read()))
B = json.loads(load('gba_base.txt'))
HALF, CELL, N, Q = B['HALF'], B['CELL'], B['N'], 4.0; LON0, LAT0, MX, MY = B['lon0'], B['lat0'], B['MX'], B['MY']
T = 2000; TX = int(2*HALF/T)
rl = np.frombuffer(base64.b64decode(B['pa']), '<u2').reshape(-1, 2); pa_ = np.repeat(rl[:, 0], rl[:, 1]).reshape(N, N).astype(np.int32)
PAS = B['PAS']; px_ = np.array([p['x'] for p in PAS], float); py_ = np.array([p['y'] for p in PAS], float); preg = np.array([p['reg'] for p in PAS])
pcity = np.array([0 if 1 <= g <= 18 else 2 if g == 27 else 1 for g in preg])
def city_pa(x, y):
    x = np.atleast_1d(np.asarray(x, float)); y = np.atleast_1d(np.asarray(y, float))
    i = np.clip(((x + HALF)//CELL).astype(int), 0, N - 1); j = np.clip(((y + HALF)//CELL).astype(int), 0, N - 1); v = pa_[j, i]
    bd = np.full(len(x), np.inf); best = np.zeros(len(x), int)
    for k in (0, 256, 512):
        ids = v + k; ok = (v > 0) & (ids <= len(PAS)); ii = np.clip(ids - 1, 0, len(PAS) - 1)
        d = np.where(ok, np.hypot(px_[ii] - x, py_[ii] - y), np.inf); m = d < bd; bd[m] = d[m]; best[m] = ids[m]
    nod = np.isinf(bd)
    return np.where(nod, 3, pcity[np.clip(best - 1, 0, len(PAS) - 1)]), np.where(nod, 0, best)
class R:
    def __init__(s, b, p=0): s.b = b; s.p = p
    def u8(s): v = s.b[s.p]; s.p += 1; return v
    def vu(s):
        v = 0; sh = 0
        while True:
            c = s.b[s.p]; s.p += 1; v |= (c & 127) << sh; sh += 7
            if not c & 128: return v
    def vs(s): v = s.vu(); return (v >> 1) ^ -(v & 1)
b0 = load('gba_bld0.txt'); small = {k: load('gba_bld%d.txt' % k) for k in range(1, B['bldParts'] + 1)}
r = R(b0, 4); TT = r.vu(); TXX = r.vu(); npart = r.vu(); nt = r.vu(); assert TT == T and TXX == TX
idx = [tuple(r.vu() for _ in range(7)) for _ in range(nt)]
def dec(buf, start, length, n, ti):
    rr = R(buf, start); tx, ty = ti % TX, ti // TX; ox, oy = -HALF + tx*T, -HALF + ty*T; recs = []
    for _ in range(n):
        p0 = rr.p; fl = rr.u8(); h = rr.vu()/10; base = rr.vu()/10; rr.u8(); rr.u8(); rr.u8()
        if rr.u8() == 255: rr.u8(); rr.u8(); rr.u8()
        rr.u8(); nr = rr.vu(); px = py = 0; outer = None
        for k in range(nr):
            m = rr.vu(); pts = []
            for _ in range(m): px += rr.vs(); py += rr.vs(); pts.append((ox + px/Q, oy + py/Q))
            if k == 0: outer = np.array(pts)
        x, y = outer[:, 0], outer[:, 1]; A = 0.5*abs(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1)))
        recs.append({'raw': bytes(buf[p0:rr.p]), 't': fl & 31, 'fo': bool(fl & 32), 'part': bool(fl & 64), 'h': h, 'base': base, 'A': A, 'x': x.mean(), 'y': y.mean()})
    assert rr.p == start + length
    return recs
old_big = {}; old_small = {}; off = r.p
for (ti, nb, lb, ns, k, so, ls) in idx:
    old_big[ti] = dec(b0, off, lb, nb, ti); off += lb
    old_small[ti] = dec(small[k], so, ls, ns, ti)
allold = [(ti, b, rec) for d, b in ((old_big, True), (old_small, False)) for ti, L in d.items() for rec in L]
xs = np.array([rec['x'] for _, _, rec in allold]); ys = np.array([rec['y'] for _, _, rec in allold])
oc, opa = city_pa(xs, ys)
kept_big = collections.defaultdict(list); kept_small = collections.defaultdict(list); dropped = collections.Counter(); keptrecs = []
for (ti, big, rec), c, p in zip(allold, oc, opa):
    if c in (1, 2) and not rec['fo']: dropped[int(c)] += 1; continue
    rec['pa'] = int(p); (kept_big if big else kept_small)[ti].append(rec); keptrecs.append(rec)
print('old records', len(allold), 'dropped SZ', dropped[1], 'DG', dropped[2], 'kept', len(keptrecs), flush=True)
# ---- new records ----
S3 = pickle.load(open(W + '/s3.pkl', 'rb'))
def tile_of(x, y): return min(TX - 1, max(0, int((y + HALF)//T)))*TX + min(TX - 1, max(0, int((x + HALF)//T)))
def area2(r): return sum(r[i][0]*r[(i+1) % len(r)][1] - r[(i+1) % len(r)][0]*r[i][1] for i in range(len(r)))
class Wr:
    def __init__(s): s.b = bytearray()
    def u8(s, v): s.b.append(int(v) & 255)
    def vu(s, v):
        v = int(v); assert v >= 0, v
        while True:
            c = v & 127; v >>= 7
            if v: s.b.append(c | 128)
            else: s.b.append(c); return
    def vs(s, v): v = int(v); s.vu((v << 1) ^ (v >> 63) if v < 0 else v << 1)
def enc(b, g, ti, big, part):
    wb = Wr(); tx, ty = ti % TX, ti // TX; ox, oy = -HALF + tx*T, -HALF + ty*T
    if not big and len(g.exterior.coords) > 6: g = g.simplify(0.25)
    if g.geom_type != 'Polygon' or g.is_empty: return None
    rings = [list(g.exterior.coords)[:-1]] + [list(r.coords)[:-1] for r in g.interiors if Polygon(r).area > 6]
    if len(rings[0]) < 3: return None
    if area2(rings[0]) < 0: rings[0] = rings[0][::-1]
    for k in range(1, len(rings)):
        if area2(rings[k]) > 0: rings[k] = rings[k][::-1]
    seed = int(hashlib.md5(str(b['id']).encode()).hexdigest()[:6], 16) % 251
    flags = (b['t'] & 31) | (64 if part else 0) | (128 if big else 0)
    wb.u8(flags); wb.vu(round(b['h']*10)); wb.vu(round(max(0, b['base'])*10))
    wb.u8(b['wall'][0]); wb.u8(b['wall'][1]); wb.u8(b['wall'][2]); wb.u8(b['roof']); wb.u8(seed); wb.vu(len(rings))
    px, py = 0, 0
    for rg in rings:
        wb.vu(len(rg))
        for (x, y) in rg:
            qx, qy = round((x - ox)*Q), round((y - oy)*Q); wb.vs(qx - px); wb.vs(qy - py); px, py = qx, qy
    return bytes(wb.b)
new_big = collections.defaultdict(list); new_small = collections.defaultdict(list); newrecs = []
for b in S3['b']:
    g = shapely.from_wkb(b['g']); c = g.representative_point(); ti = tile_of(c.x, c.y); A = g.area
    if b.get('parts'):
        for p in b['parts']:
            pg = shapely.from_wkb(p['g']); raw = enc(dict(b, h=p['h'], base=p['base']), pg, ti, True, True)
            if raw: new_big[ti].append(raw)
        newrecs.append({'t': b['t'], 'h': b['h'], 'base': 0.0, 'A': A, 'x': c.x, 'y': c.y}); continue
    big = b['h'] >= HB or A >= AB
    raw = enc(b, g, ti, big, False)
    if raw: (new_big if big else new_small)[ti].append(raw); newrecs.append({'t': b['t'], 'h': b['h'], 'base': b['base'], 'A': A, 'x': c.x, 'y': c.y})
print('new big', sum(len(v) for v in new_big.values()), 'small', sum(len(v) for v in new_small.values()), flush=True)
_, npa_ = city_pa(np.array([r['x'] for r in newrecs]), np.array([r['y'] for r in newrecs]))
for r_, p in zip(newrecs, npa_): r_['pa'] = int(p)
# ---- assemble ----
tiles = sorted(set(kept_big) | set(kept_small) | set(new_big) | set(new_small))
bigP = {ti: b''.join([r_['raw'] for r_ in kept_big[ti]] + new_big[ti]) for ti in tiles}
smallP = {ti: b''.join([r_['raw'] for r_ in kept_small[ti]] + new_small[ti]) for ti in tiles}
nB = {ti: len(kept_big[ti]) + len(new_big[ti]) for ti in tiles}; nS = {ti: len(kept_small[ti]) + len(new_small[ti]) for ti in tiles}
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
import os
os.makedirs(OUTD, exist_ok=True)
def wtxt(name, data):
    z = gzip.compress(bytes(data), 9); s = base64.b64encode(z); open(OUTD + '/' + name, 'wb').write(s); print(name, len(data), '->', len(z), 'gz,', len(s), 'b64', flush=True); return len(s)
loc = {}
for k, p in enumerate(parts, 1):
    off = 0
    for ti in p: loc[ti] = (k, off); off += len(smallP[ti])
    wtxt('gba_bld%d.txt' % k, b''.join(smallP[t] for t in p))
w0 = Wr(); w0.b += b'SGB2'; w0.vu(T); w0.vu(TX); w0.vu(len(parts)); w0.vu(len(tiles))
for ti in tiles:
    k, off = loc[ti]; w0.vu(ti); w0.vu(nB[ti]); w0.vu(len(bigP[ti])); w0.vu(nS[ti]); w0.vu(k); w0.vu(off); w0.vu(len(smallP[ti]))
for ti in tiles: w0.b += bigP[ti]
z0 = wtxt('gba_bld0.txt', w0.b)
# ---- statistics (b7 formulas) ----
FH = lambda t: 3 if t in (1, 2, 3, 11) else 4.2 if t in (5, 12) else 5 if t in (6, 10) else 3.8
JOBS = {k: v*0.68 for k, v in {0:1/130, 4:1/32, 5:1/22, 6:1/80, 7:1/60, 8:1/220, 9:1/40, 10:1/110, 11:0, 12:1/75}.items()}
PEOPLE = {2:0.585/21, 3:0.585/30}
npa = len(PAS) + 1
ST = {'n':0, 'gfa':0.0, 'pop':0.0, 'jobs':0.0, 'tall':0, 'byType':[0.0]*16, 'byPa':[[0.0, 0.0, 0, 0.0] for _ in range(npa)]}; OD = {}
for b in keptrecs + newrecs:
    if b.get('part') or b.get('fo') and False: continue
    t = b['t']
    if t in (13, 14, 15): continue
    fl = max(1, round((b['h'] - b['base'])/FH(t))); g = b['A']*fl; pop = g*PEOPLE.get(t, 0); jobs = g*JOBS.get(t, 0); P = ST['byPa'][b['pa']]
    ST['n'] += 1; ST['gfa'] += g; ST['pop'] += pop; ST['jobs'] += jobs; ST['byType'][t] += g; ST['tall'] += b['h'] >= 100
    P[0] += pop; P[1] += jobs; P[2] += 1; P[3] += g
    z = 1 if t in (2, 3) else 5 if t == 5 else 3 if t == 6 else 6 if t in (7, 9) else 2 if t in (4, 12) else 0
    if z:
        key = (int((b['x'] + HALF)//1000), int((b['y'] + HALF)//1000), z); o = OD.get(key)
        if o is None: o = OD[key] = [0.0, 0.0, 0.0]
        o[0] += g; o[1] += b['x']*g; o[2] += b['y']*g
old = B['stats']
B['stats'] = {'n':ST['n'], 'gfa':round(ST['gfa']), 'pop':round(ST['pop']), 'jobs':round(ST['jobs']), 'tall':ST['tall'], 'byType':[round(v) for v in ST['byType']],
              'byPa':[[round(p[0]), round(p[1]), p[2], round(p[3])] for p in ST['byPa']],
              'od':[[k[2], round(o[0]), round(o[1]/o[0]), round(o[2]/o[0])] for k, o in OD.items() if o[0] > 2000]}
print('stats old n %d pop %d jobs %d tall %d od %d -> new n %d pop %d jobs %d tall %d od %d' % (old['n'], old['pop'], old['jobs'], old['tall'], len(old['od']),
      B['stats']['n'], B['stats']['pop'], B['stats']['jobs'], B['stats']['tall'], len(B['stats']['od'])))
B['bldParts'] = len(parts)
wtxt('gba_base.txt', json.dumps(B, separators=(',', ':'), ensure_ascii=False).encode())
