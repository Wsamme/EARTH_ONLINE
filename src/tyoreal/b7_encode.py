# stage 7 (Tokyo): binary encodings for the app (formats as New York, sgreal/mod_bld SGB2):
#   tyo_bld0 : 'SGB2' tile index + the big buildings (h >= HB m, area >= AB m2, parts) of every tile, decoded at start
#   tyo_bld1..k : the small buildings of the tiles, decoded per tile when the camera comes near
#   tyo_roads ('SGR1'), tyo_water ('SGW1'), tyo_base (json, with precomputed statistics)
# The ~3.7 million building records are encoded vectorized (numpy token stream -> varints), not one Python call per field.
# usage: python3 b7_encode.py [HB AB] [--bld-only]
import sys, collections, hashlib, struct, gzip, base64, time; sys.path.insert(0, '.')
from common import *
import mapbox_earcut as earcut
from shapely.geometry import box, Polygon, Point
from raster import polys_of
t0 = time.time()
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
args = [a for a in sys.argv[1:] if not a.startswith('--')]
HB, AB = (float(args[0]), float(args[1])) if len(args) >= 2 else (30.0, 1500.0)
BLD_ONLY = '--bld-only' in sys.argv
M = load('misc.pkl')
pa = np.load(OUT + 'pa.npy')
# ---------------- buildings ----------------
Z = np.load(OUT + 'bldA.npz')
XY = Z['XY']; RS = Z['RS']; BR = Z['BR']          # (float32; converted per chunk)
h = Z['h'].astype(np.float64); base = Z['base'].astype(np.float64); tt = Z['t'].astype(np.int64); wall = Z['wall']; roof = Z['roof']; rc = Z['rc']; hrc = Z['hrc']
part = Z['part']; havep = Z['haveparts']; owner = Z['owner']; osm = Z['osm']; A = Z['area'].astype(np.float64); cx = Z['cx'].astype(np.float64); cy = Z['cy'].astype(np.float64); est = Z['est']
nb = len(h); print('buildings', nb, 'big threshold', HB, 'm or', AB, 'm2', flush=True)
# owner (original index) -> output index
oi = np.full(int(osm.max()) + 1, -1, np.int64); oi[osm] = np.arange(nb)
own = np.where(part, oi[np.maximum(owner, 0)], -1)
part = part & (own >= 0)
# a building with parts: its outline is drawn only where no part starts at the ground (as a podium up to the lowest part base)
pmin = np.full(nb, 1e9); np.minimum.at(pmin, own[part], base[part])
drop_outline = havep & (pmin <= 0.5)
pod = havep & ~drop_outline
h = np.where(pod, np.minimum(h, np.where(pmin < 1e8, pmin, h)), h)
use = ~drop_outline & ~(part & (h <= base + 0.5))
# grounded floating outlines (no parts): a min_height without anything under it is dropped to the ground
base = np.where(~part & (base > 0.5) & ((h <= base + 0.5) | (h - base < 3)), 0.0, base)
base = np.where(~part, 0.0, base)       # (Tokyo: plain outlines with a min_height are canopies / walkways; drawn from the ground)
# tile of each record: the building's own centre; parts go with their building
tcx = np.where(part, cx[np.maximum(own, 0)], cx); tcy = np.where(part, cy[np.maximum(own, 0)], cy)
tile = np.clip(((tcy + HALF)//T).astype(np.int64), 0, TX - 1)*TX + np.clip(((tcx + HALF)//T).astype(np.int64), 0, TX - 1)
big = (h >= HB) | (A >= AB) | part | pod
# seeds: big records and parts a hash of the OSM building (parts of one building share it); small ones low entropy (the decoder mixes in the index)
key = np.where(part, Z['oid'][np.maximum(own, 0)], Z['oid'])
seed_full = ((key.astype(np.uint64)*np.uint64(2654435761)) % np.uint64(251)).astype(np.int64)
seed = np.where(big, seed_full, seed_full % 16)
# ---------------- statistics (floor area -> residents and jobs; precomputed, the app does not decode every building) ----------------
FHt = np.select([np.isin(tt, [1, 2, 3, 11]), np.isin(tt, [5, 12]), np.isin(tt, [6, 10])], [3.0, 4.2, 5.0], 3.8)
JOBS = {k: v*0.68 for k, v in {0:1/130, 4:1/32, 5:1/22, 6:1/80, 7:1/60, 8:1/220, 9:1/40, 10:1/110, 11:0, 12:1/75}.items()}
PEOPLE = {2:0.585/40, 3:0.585/55}          # (Tokyo: smaller dwellings per person than New York)
cnt = ~part & ~np.isin(tt, [13, 15])
fl = np.maximum(1, np.round((h - base)/FHt)); gfa = A*fl
jr = np.array([JOBS.get(k, 0) for k in range(16)]); pr = np.array([PEOPLE.get(k, 0) for k in range(16)])
popv = gfa*pr[tt]; jobv = gfa*jr[tt]
pi_ = np.clip(((cx + HALF)/CELL).astype(int), 0, N - 1); pj_ = np.clip(((cy + HALF)/CELL).astype(int), 0, N - 1); pav = pa[pj_, pi_].astype(np.int64)
npa = len(M['PAS']) + 1
byPa = np.zeros((npa, 4))
for col, v in enumerate((popv, jobv, np.ones(nb), gfa)): np.add.at(byPa[:, col], pav[cnt], v[cnt])
byType = np.zeros(16); np.add.at(byType, tt[cnt], gfa[cnt])
ST = {'n':int(cnt.sum()), 'gfa':float(gfa[cnt].sum()), 'pop':float(popv[cnt].sum()), 'jobs':float(jobv[cnt].sum()), 'tall':int((cnt & (h >= 100)).sum())}
zc = np.select([np.isin(tt, [2, 3]), tt == 5, tt == 6, np.isin(tt, [7, 9]), np.isin(tt, [4, 12])], [1, 5, 3, 6, 2], 0)
OD = {}
m = cnt & (zc > 0)
kx = ((cx[m] + HALF)//1000).astype(np.int64); ky = ((cy[m] + HALF)//1000).astype(np.int64); kz = zc[m]
kk = (kx*100 + ky)*10 + kz; uk, inv = np.unique(kk, return_inverse=True)
g0 = np.bincount(inv, gfa[m]); g1 = np.bincount(inv, cx[m]*gfa[m]); g2 = np.bincount(inv, cy[m]*gfa[m])
od = [[int(k % 10), round(a), round(b/a), round(c/a)] for k, a, b, c in zip(uk, g0, g1, g2) if a > 2000]
print('stats: n %d pop %.0f jobs %.0f gfa %.1f km2 tall %d' % (ST['n'], ST['pop'], ST['jobs'], ST['gfa']/1e6, ST['tall']), flush=True)
# ---------------- the token stream ----------------
def varint_bytes(val, isv):
    """val int64 >= 0 tokens; isv: varint (True) or one raw byte (False) -> uint8 array"""
    val = val.astype(np.uint64)
    nbt = np.ones(len(val), np.int64)
    for k in range(1, 6): nbt += (isv & (val >= np.uint64(1 << (7*k)))).astype(np.int64)
    tot = int(nbt.sum()); tok = np.repeat(np.arange(len(val)), nbt)
    start = np.cumsum(nbt) - nbt; j = np.arange(tot) - start[tok]
    v = val[tok] >> (np.uint64(7)*j.astype(np.uint64))
    out = np.where(isv[tok], (v & np.uint64(127)) | np.where(j < nbt[tok] - 1, np.uint64(128), np.uint64(0)), v & np.uint64(255)).astype(np.uint8)
    return out, nbt
def encode(sel_b):
    """records of the buildings sel_b (already in stream order: tile, then file order; parts consecutive) -> bytes per tile"""
    nbk = len(sel_b)
    # rings of these buildings
    rb0 = BR[sel_b]; rb1 = BR[sel_b + 1]; nr = rb1 - rb0
    ridx = np.repeat(rb0, nr) + (np.arange(nr.sum()) - np.repeat(np.cumsum(nr) - nr, nr))
    rbld = np.repeat(np.arange(nbk), nr)
    vs0 = RS[ridx]; vs1 = RS[ridx + 1] - 1          # drop the closing vertex
    nv = vs1 - vs0
    # interiors under 6 m2 dropped; rings with < 3 vertices dropped (the exterior keeps the building)
    vi = np.repeat(vs0, nv) + (np.arange(nv.sum()) - np.repeat(np.cumsum(nv) - nv, nv))
    rid = np.repeat(np.arange(len(ridx)), nv)
    X = XY[vi, 0].astype(np.float64); Y = XY[vi, 1].astype(np.float64)
    Xn = np.roll(X, -1); Yn = np.roll(Y, -1)
    last = np.cumsum(nv) - 1; first = np.cumsum(nv) - nv
    Xn[last] = X[first]; Yn[last] = Y[first]
    a2 = np.bincount(rid, X*Yn - Xn*Y, minlength=len(ridx))
    ext = np.concatenate([[True], rbld[1:] != rbld[:-1]])
    keepr = (nv >= 3) & (ext | (np.abs(a2) > 12))
    # orientation: exterior counter-clockwise, holes clockwise
    rev = (ext & (a2 < 0)) | (~ext & (a2 > 0))
    posr = np.arange(len(vi)) - first[rid]
    vi2 = np.where(rev[rid], vs0[rid] + (nv[rid] - 1 - posr), vi)
    kv = keepr[rid]; vi2 = vi2[kv]; rid2 = rid[kv]
    ridk = np.nonzero(keepr)[0]
    nr2 = np.bincount(rbld[ridk], minlength=nbk)
    # tile origins and quantized coordinates
    tl = tile[sel_b]; ox = -HALF + (tl % TX)*T; oy = -HALF + (tl // TX)*T
    vb = rbld[rid2]
    qx = np.round((XY[vi2, 0] - ox[vb])*Q).astype(np.int64); qy = np.round((XY[vi2, 1] - oy[vb])*Q).astype(np.int64)
    # deltas run through the rings of one building and restart from 0 at each building's first vertex (sgreal/mod_bld decList)
    newt = np.concatenate([[True], vb[1:] != vb[:-1]])
    dx = qx - np.concatenate([[0], qx[:-1]]); dy = qy - np.concatenate([[0], qy[:-1]])
    dx[newt] = qx[newt]; dy[newt] = qy[newt]
    zz = lambda d: np.where(d < 0, ((-d) << 1) - 1, d << 1)
    # header tokens per building: flags, h, base, w0, w1, w2, roof (1 or 4), seed, nrings
    hr = hrc[sel_b]; hl = 9 + 3*hr.astype(np.int64)
    nv2 = np.bincount(rid2, minlength=len(ridx))[ridk]           # vertices per kept ring
    btok = hl + nr2 + 2*np.bincount(rbld[ridk], nv2, minlength=nbk).astype(np.int64)
    bstart = np.cumsum(btok) - btok; ntok = int(btok.sum())
    val = np.zeros(ntok, np.int64); isv = np.zeros(ntok, bool)
    flags = (tt[sel_b] & 31) | np.where(part[sel_b], 64, 0) | np.where(big[sel_b], 128, 0)
    hv = np.round(h[sel_b]*10).astype(np.int64); bv = np.round(np.maximum(0, base[sel_b])*10).astype(np.int64)
    W3 = wall[sel_b].astype(np.int64)
    val[bstart] = flags; val[bstart + 1] = hv; isv[bstart + 1] = True; val[bstart + 2] = bv; isv[bstart + 2] = True
    val[bstart + 3] = W3[:, 0]; val[bstart + 4] = W3[:, 1]; val[bstart + 5] = W3[:, 2]
    rcs = rc[sel_b].astype(np.int64)
    val[bstart + 6] = np.where(hr, 255, roof[sel_b])
    m_ = np.nonzero(hr)[0]
    for k in range(3): val[bstart[m_] + 7 + k] = rcs[m_, k]
    sp = bstart + 6 + np.where(hr, 4, 1)
    val[sp] = seed[sel_b]; val[sp + 1] = nr2; isv[sp + 1] = True
    # rings: n, then the coordinates
    rk_b = rbld[ridk]
    # offset of each kept ring inside its building's token run
    rr_before = np.cumsum(np.concatenate([[0], (1 + 2*nv2)[:-1]]))
    bfirst = np.searchsorted(rk_b, np.arange(nbk))          # first kept ring of each building
    ring_base = rr_before - rr_before[np.minimum(bfirst[rk_b], len(rr_before) - 1)]
    rpos = bstart[rk_b] + hl[rk_b] + ring_base
    val[rpos] = nv2; isv[rpos] = True
    vpos_r = np.repeat(rpos + 1, nv2) + 2*(np.arange(nv2.sum()) - np.repeat(np.cumsum(nv2) - nv2, nv2))
    val[vpos_r] = zz(dx); isv[vpos_r] = True; val[vpos_r + 1] = zz(dy); isv[vpos_r + 1] = True
    by, nbt = varint_bytes(val, isv)
    boff = np.concatenate([[0], np.cumsum(nbt)])
    bb = boff[bstart]; be = boff[bstart + btok]
    out = {}
    ut, ti0 = np.unique(tl, return_index=True)
    tend = np.concatenate([ti0[1:], [nbk]])
    cntt = {}
    for t_, a_, e_ in zip(ut, ti0, tend):
        out[int(t_)] = by[bb[a_]:be[e_ - 1]].tobytes(); cntt[int(t_)] = int(e_ - a_)
    return out, cntt
# stream order: tile, then parts right after their building's slot (sorted by owner key), then file order
order_key = np.where(part, own, np.arange(nb)).astype(np.float64) + np.where(part, 0.5, 0.0)
bsel = np.nonzero(use & big)[0]; ssel = np.nonzero(use & ~big)[0]
bsel = bsel[np.lexsort((order_key[bsel], tile[bsel]))]; ssel = ssel[np.lexsort((order_key[ssel], tile[ssel]))]
print('records: big', len(bsel), 'small', len(ssel), flush=True)
bigP, bigN = encode(bsel); print('big encoded', sum(len(v) for v in bigP.values()), 'B', round(time.time() - t0), 's', flush=True)
smallP, smallN = {}, {}
CH = 250000
# split ssel on tile boundaries into ~600k chunks
tl_s = tile[ssel]; cuts = [0]
while cuts[-1] < len(ssel):
    c = min(len(ssel), cuts[-1] + CH)
    if c < len(ssel):
        c = int(np.searchsorted(tl_s, tl_s[c], side='left'))
        if c <= cuts[-1]: c = int(np.searchsorted(tl_s, tl_s[cuts[-1]], side='right'))
    cuts.append(c)
for a_, b_ in zip(cuts, cuts[1:]):
    P_, N_ = encode(ssel[a_:b_]); smallP.update(P_); smallN.update(N_)
    print('small encoded', b_, round(time.time() - t0), 's', flush=True)
tiles = sorted(set(bigP) | set(smallP))
print('big', len(bsel), sum(len(v) for v in bigP.values()), 'B; small', len(ssel), sum(len(v) for v in smallP.values()), 'B', flush=True)
LIM = 10.9e6
def split(budget):
    parts = [[]]; size = 0
    for ti in tiles:
        if size + len(smallP.get(ti, b'')) > budget and parts[-1]: parts.append([]); size = 0
        parts[-1].append(ti); size += len(smallP.get(ti, b''))
    return parts
budget = 42e6
while True:
    parts = split(budget); zs = [len(gzip.compress(b''.join(smallP.get(t, b'') for t in p), 6)) for p in parts]
    print('  try budget %.1f MB -> parts %s' % (budget/1e6, [round(z/1e6, 2) for z in zs]), flush=True)
    if max(zs) <= LIM: break
    budget *= 0.9
print('small parts', len(parts), [round(z/1e6, 2) for z in zs], flush=True)
loc = {}
for k, p in enumerate(parts, 1):
    off = 0
    for ti in p: loc[ti] = (k, off); off += len(smallP.get(ti, b''))
    wz('tyo_bld%d.bin.gz' % k, b''.join(smallP.get(t, b'') for t in p))
import glob as _g, os as _o
for f in _g.glob(OUT + 'tyo_bld*.bin.gz'):
    k = int(_o.path.basename(f)[7:].split('.')[0])
    if k > len(parts): _o.remove(f)
w0 = W(); w0.raw(b'SGB2'); w0.vu(T); w0.vu(TX); w0.vu(len(parts)); w0.vu(len(tiles))
for ti in tiles:
    k, off = loc[ti]
    w0.vu(ti); w0.vu(bigN.get(ti, 0)); w0.vu(len(bigP.get(ti, b''))); w0.vu(smallN.get(ti, 0)); w0.vu(k); w0.vu(off); w0.vu(len(smallP.get(ti, b'')))
for ti in tiles: w0.raw(bigP.get(ti, b''))
z0 = wz('tyo_bld0.bin.gz', w0.b)
if z0 > 10.9e6: print('BLD0 TOO BIG', z0); raise SystemExit(3)
json.dump({'HB':HB, 'AB':AB, 'big':int(len(bsel)), 'small':int(len(ssel)), 'parts':len(parts), 'bld0_gz':z0, 'stats':ST}, open(OUT + 'bld_report.json', 'w'))
stats = {'n':ST['n'], 'gfa':round(ST['gfa']), 'pop':round(ST['pop']), 'jobs':round(ST['jobs']), 'tall':ST['tall'], 'byType':[round(v) for v in byType],
         'byPa':[[round(p[0]), round(p[1]), int(p[2]), round(p[3])] for p in byPa], 'od':od}
json.dump({'stats':stats, 'bldParts':len(parts)}, open(OUT + 'bld_stats.json', 'w'))
del Z, XY, smallP, bigP
if BLD_ONLY: print('buildings only: done', round(time.time() - t0), 's'); raise SystemExit(0)
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
# Tokyo: drop the paths that only duplicate a road's sidewalk (OSM Japan maps many sidewalks and crossings as separate footways:
# >= 75 % of the path within 9 m of a road centreline), paths under 25 m, unnamed service roads under 40 m (driveways), and parking aisles (inside the car parks)
import shapely
roads_g = np.array([l['g'] for l in R['lines'] if l['c'] <= 10], dtype=object); rtree = shapely.STRtree(roads_g)
drop = set(); nside = nshort = naisle = 0
pidx = [i for i, l in enumerate(R['lines']) if l['c'] == 12]
for c0 in range(0, len(pidx), 40000):
    ch = pidx[c0:c0 + 40000]
    G = np.array([R['lines'][i]['g'] for i in ch], dtype=object); Ls = shapely.length(G)
    nsamp = np.maximum(2, (Ls/5).astype(int) + 1)
    owner = np.repeat(np.arange(len(ch)), nsamp); frac = (np.arange(nsamp.sum()) - np.repeat(np.cumsum(nsamp) - nsamp, nsamp))/np.repeat(nsamp - 1, nsamp)
    pts = shapely.line_interpolate_point(G[owner], frac, normalized=True)
    hit = np.zeros(len(pts), bool)
    qi, qj = rtree.query(pts, predicate='dwithin', distance=9.0)
    hit[qi] = True
    f = np.bincount(owner, hit, minlength=len(ch))/nsamp
    for k, i in enumerate(ch):
        l = R['lines'][i]
        if Ls[k] < 25: drop.add(i); nshort += 1
        elif f[k] >= 0.75 and not l['br']: drop.add(i); nside += 1
for i, l in enumerate(R['lines']):
    if l['c'] == 11 and l['kd'] == 'aisle' and not l['br']: drop.add(i); naisle += 1
    elif l['c'] == 11 and not l['br'] and not l['name'] and l['g'].length < 40: drop.add(i); nshort += 1          # (driveways and service stubs)
print('roads dropped: sidewalk / crossing paths', nside, 'short paths', nshort, 'parking aisles', naisle, flush=True)
del roads_g, rtree
# road pieces that carry only a ref (Shuto Expressway segments: C2, B, K1 ...) take the name of the other pieces with the same ref
# (the most common one), so their labels read 'Central Circular Route C2', never a bare / null name
_rn = collections.defaultdict(collections.Counter)
for l in R['lines']:
    if l['ref'] and (l['name'] or l['zh']) and l['c'] <= 9: _rn[l['ref']][(l['name'], l['zh'])] += 1
nfill = 0
for l in R['lines']:
    if l['ref'] and not l['name'] and not l['zh'] and l['ref'] in _rn:
        l['name'], l['zh'] = _rn[l['ref']].most_common(1)[0][0]; nfill += 1
print('ref-only road pieces named from their ref', nfill, flush=True)
SQ = box(-HALF + 5, -HALF + 5, HALF - 5, HALF - 5)
wr = W(); wr.raw(b'SGR1'); recs = []
for i, l in enumerate(R['lines']):
    if i in drop: continue
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
        for hh in el: wr.u8(min(255, round(hh*esc)))
print('road records', len(recs), 'names', len(names), 'refs', len(refs), flush=True)
wz('tyo_roads.bin.gz', wr.b)
del R
# ---------------- water ----------------
L = load('land.pkl'); F = load('fresh.pkl'); T2 = load('terrain.pkl'); lab = np.load(OUT + 'lab12.npy', mmap_mode='r')
sea = box(-HALF - 200, -HALF - 200, HALF + 200, HALF + 200).difference(L['sg'].buffer(0)).simplify(0.6)
def tri(poly):
    rings = [np.array(poly.exterior.coords)[:-1]] + [np.array(r.coords)[:-1] for r in poly.interiors]
    verts = np.concatenate(rings).astype(np.float64); ends = np.cumsum([len(r) for r in rings]).astype(np.uint32)
    return verts, earcut.triangulate_float64(verts, ends)
def emit_mesh(wt, polys):
    V = []; I = []; b0 = 0
    for p in polys:
        if p.area < 1: continue
        v, idx = tri(p); V.append(v); I.append(idx + b0); b0 += len(v)
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
wz('tyo_water.bin.gz', ww.b)
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
base_ = {'v':2, 'city':'tyo', 'lon0':LON0, 'lat0':LAT0, 'MX':MX, 'MY':MY, 'HALF':HALF, 'CELL':CELL, 'N':N, 'TS':TS, 'TN':TN, 'TILE':T, 'bldParts':len(parts),
        'codes':rle(codes), 'lu':rle(lu), 'pa':rle(pa), 'H':base64.b64encode(Hq.tobytes()).decode(),
        'names':names, 'refs':refs, 'stats':stats, **{k: M[k] for k in ('PAS', 'REGS', 'places', 'pois', 'waters', 'mrt', 'stations', 'f1', 'runways', 'stands', 'palines')}}
wz('tyo_base.json.gz', json.dumps(base_, separators=(',', ':'), ensure_ascii=False).encode())
print('done', round(time.time() - t0), 's')
