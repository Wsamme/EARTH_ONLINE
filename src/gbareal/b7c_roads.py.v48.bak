# gbareal: encode the roads as chunk files (gba_rc<k>) and update the road names / the chunk table in the base json (run after b7_encode)
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
from shapely.prepared import prep
LND = load('land.pkl'); hkp = prep(LND['core'].buffer(30)); nfor = collections.Counter()     # gbareal: foreign = outside HK + SZ + DG
wr = W(); wr.raw(b'SGR1'); recs = []
for i, l in enumerate(R['lines']):
    g = l['g']
    fo = not hkp.contains(g.interpolate(0.5, normalized=True))
    if fo and (l['c'] > 10 or l['c'] in (13, 14)): nfor['dropped'] += 1; continue        # context land: main roads only
    if not SQ.contains(g):
        g = g.intersection(SQ)
        if g.is_empty or g.geom_type != 'LineString': continue
        l = dict(l, g=g, _cut=True)
    l = dict(l, _fo=fo); nfor['foreign'] += fo
    recs.append((i, l))
print('Shenzhen roads', dict(nfor), flush=True)
# gbareal: the roads in chunks of 4 x 4 tiles (8 km; the sky blocks of the app), by the tile of each line's midpoint, one file per
# chunk (gba_rc<k>.bin.gz, 'SGR1' each); the app loads the chunks around the camera (base.roadChunks) and re-prepares the roads
CHB = 4; CHN = (TX + CHB - 1)//CHB
def chunk_of(g):
    m = g.interpolate(0.5, normalized=True); tx = min(TX - 1, max(0, int((m.x + HALF)//T))); ty = min(TX - 1, max(0, int((m.y + HALF)//T)))
    return (ty//CHB)*CHN + tx//CHB
import os, glob as _glob
for f in _glob.glob(OUT + 'gba_rc*.bin.gz'): os.remove(f)
byc = collections.defaultdict(list)
for i, l in recs: byc[chunk_of(l['g'])].append((i, l))
def enc(lst):
    wr = W(); wr.raw(b'SGR1'); wr.vu(len(lst)); px, py = 0, 0
    for i, l in lst:
        el = None if l.get('_cut') else R['elev'].get(i)
        cs = list(l['g'].coords)
        if el is not None and len(el) != len(cs): el = None
        hasel = el is not None and max(el) > 0.05
        flags = (1 if l['ow'] else 0) | (2 if l['br'] else 0) | (4 if hasel else 0) | (8 if l['_fo'] else 0) | (16 if l['kd'] and l['kd'].endswith('_link') else 0)
        esc = 2.5 if hasel and max(el) > 51 else 5.0
        if esc == 2.5: flags |= 32
        wr.u8(l['c']); wr.u8(flags); wr.vu(nm(l['name'], l['zh']) if l['c'] <= 11 or l['c'] in (13, 14) else 0); wr.vu(rf(l['ref'])); wr.vu(len(cs))
        for (x, y) in cs:
            qx, qy = round(x*Q), round(y*Q); wr.vs(qx - px); wr.vs(qy - py); px, py = qx, qy
        if hasel:
            for h in el: wr.u8(min(255, round(h*esc)))
    return wr.b
CH = []; tot = 0
for k in sorted(byc):
    z = wz('gba_rc%d.bin.gz' % k, enc(byc[k])); bx, by = k % CHN, k//CHN
    CH.append({'k':k, 'n':len(byc[k]), 'z':z, 'bb':[-HALF + bx*CHB*T, -HALF + by*CHB*T, min(HALF, -HALF + (bx + 1)*CHB*T), min(HALF, -HALF + (by + 1)*CHB*T)]}); tot += z
print('road chunks', len(CH), 'records', sum(c['n'] for c in CH), 'gz %.2f MB' % (tot/1e6), 'largest %.2f MB' % (max(c['z'] for c in CH)/1e6), flush=True)
# the whole network as one file too (gba_roads.bin.gz, same names table), for pages built before the chunks
wz('gba_roads.bin.gz', enc([r for k in sorted(byc) for r in byc[k]]))
import gzip as _gz
p = OUT + 'gba_base.json.gz'; Bj = json.loads(_gz.decompress(open(p, 'rb').read())); Bj['names'] = names; Bj['refs'] = refs; Bj['roadChunks'] = CH; Bj['roadChunkTiles'] = CHB
open(p, 'wb').write(_gz.compress(json.dumps(Bj, separators=(',', ':'), ensure_ascii=False).encode(), 9)); print('base names updated')
