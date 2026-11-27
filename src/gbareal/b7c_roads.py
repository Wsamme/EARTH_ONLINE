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
# ---- frame gz: inside the October square the released road records (site/gbadata gba_rc*: Hong Kong with its deck fixes, Shenzhen,
# Dongguan, the context) are decoded and re-encoded unchanged (same quantised coordinates and heights), minus the old context roads
# whose midpoint is in Guangzhou; the fresh roads are Guangzhou's (whole ways) and, outside the core, the parts outside the October square
if FRAME == 'gz':
    import base64, json as _json
    from shapely.geometry import LineString as _LS
    OLDSRC = __import__('os').environ.get('GBA_OLDDATA', '/home/claude/earth_online/site/gbadata/')
    _ld = lambda n: gzip.decompress(base64.b64decode(open(OLDSRC + n).read()))
    OB = _json.loads(_ld('gba_base.txt')); assert OB['HALF'] == OLD_HALF
    GZP = prep(LND['gz']); OBOX = box(-OLD_HALF, -OLD_HALF, OLD_HALF, OLD_HALF); OBOXP = prep(OBOX)
    nn = collections.Counter(); keep = []
    for i, l in recs:
        m = l['g'].interpolate(0.5, normalized=True)
        if GZP.contains(m): keep.append((i, l)); nn['fresh Guangzhou'] += 1; continue
        if not OBOXP.intersects(l['g']): keep.append((i, l)); nn['fresh outside'] += 1; continue
        d = l['g'].difference(OBOX)
        for q in (d.geoms if hasattr(d, 'geoms') else [d]):
            if q.geom_type == 'LineString' and q.length > 1: keep.append((i, dict(l, g=q, _cut=True))); nn['fresh outside (cut at the October edge)'] += 1
    recs = keep
    class Rd:
        def __init__(s, b): s.b = b; s.p = 0
        def u8(s): v = s.b[s.p]; s.p += 1; return v
        def vu(s):
            v = 0; sh = 0
            while True:
                c = s.b[s.p]; s.p += 1; v |= (c & 127) << sh; sh += 7
                if c < 128: return v
        def vs(s): v = s.vu(); return (v >> 1) ^ -(v & 1)
    ON, ORF = OB['names'], OB['refs']; oi = -1
    for C in OB['roadChunks']:
        r = Rd(_ld('gba_rc%d.txt' % C['k'])); assert r.b[:4] == b'SGR1'; r.p = 4; n = r.vu(); px = py = 0
        for _ in range(n):
            c = r.u8(); fl = r.u8(); ni = r.vu(); ri = r.vu(); m = r.vu(); cs = []
            for _ in range(m): px += r.vs(); py += r.vs(); cs.append((px/Q, py/Q))
            el = None
            if fl & 4: esc = 2.5 if fl & 32 else 5.0; el = [r.u8()/esc for _ in range(m)]
            g = _LS(cs); oi -= 1
            if GZP.contains(g.interpolate(0.5, normalized=True)): nn['released, dropped (in Guangzhou)'] += 1; continue
            nm_ = ON[ni] if ni else ['', '']
            recs.append((oi, {'c':c, 'ow':bool(fl & 1), 'br':bool(fl & 2), '_fo':bool(fl & 8), 'kd':'x_link' if fl & 16 else None, 'name':nm_[0] or None, 'zh':nm_[1] or None,
                              'ref':ORF[ri] if ri else None, 'g':g, '_el':el})); nn['released, kept'] += 1
        assert r.p == len(r.b), ('chunk not fully read', C['k'])
    print('gz road merge', dict(nn), flush=True)
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
        el = l['_el'] if '_el' in l else None if l.get('_cut') else R['elev'].get(i)
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
if FRAME != 'gz': wz('gba_roads.bin.gz', enc([r for k in sorted(byc) for r in byc[k]]))       # (frame gz: not written; the page loads the chunks)
import gzip as _gz
p = OUT + 'gba_base.json.gz'; Bj = json.loads(_gz.decompress(open(p, 'rb').read())); Bj['names'] = names; Bj['refs'] = refs; Bj['roadChunks'] = CH; Bj['roadChunkTiles'] = CHB
open(p, 'wb').write(_gz.compress(json.dumps(Bj, separators=(',', ':'), ensure_ascii=False).encode(), 9)); print('base names updated')
