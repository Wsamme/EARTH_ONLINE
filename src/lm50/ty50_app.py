# lm50 Tokyo: decoder of the app's staged map data (site/tyodata/tyo_*.bin = gzip of the tyoreal/b7_encode.py streams), so the refs
# show exactly what the page draws. The Tokyo pipeline outputs (tyoreal/out/*.pkl, the Kantō .pbf) are no longer on this machine.
#   buildings: SGB2 tile index (tyo_bld0) + big records per tile, small records in tyo_bld1..6; record = flags u8 (type & 31, part 64,
#              big 128), h/10 varint, base/10 varint, wall rgb, roof (palette idx | 255 + rgb), seed, nrings, rings of zigzag deltas
#              (quarter metres, restarting at each building, relative to the 2 km tile origin)
#   roads:     SGR1 (class, flags: 1 oneway, 2 bridge, 4 elev, 16 link, 32 elev/2.5; name / ref index; global zigzag deltas; elev bytes)
#   base:      JSON (names, refs, pois, stations, places, terrain H int16 dm on the TS grid …)
# Projection (tyoreal/README.md): x = (lon - 139.75)*90549.1, y = (lat - 35.66)*110952.7 (y north).
import gzip, json, os, base64
import numpy as np
SRC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.environ.get('TYODATA', os.path.join(os.path.dirname(SRC), 'site', 'tyodata'))
LON0, LAT0, MX, MY = 139.75, 35.66, 90549.1, 110952.7
def w(lon, lat): return ((lon - LON0)*MX, (lat - LAT0)*MY)
def ll(x, y): return (LAT0 + y/MY, LON0 + x/MX)
TYPES = {0:'generic', 2:'apartment', 3:'house', 4:'commercial', 5:'office', 6:'industrial', 7:'civic', 8:'religious', 9:'hospital', 10:'transport', 11:'car park', 12:'hotel', 13:'shed', 15:'tank'}
def _rd(name): return gzip.decompress(open(os.path.join(DATA, name), 'rb').read())
class Rd:
    def __init__(s, b, o=0): s.b = b; s.o = o
    def u8(s): v = s.b[s.o]; s.o += 1; return v
    def vu(s):
        b = s.b; o = s.o; v = b[o]; o += 1
        if v < 128: s.o = o; return v
        v &= 127; sh = 7
        while True:
            c = b[o]; o += 1; v |= (c & 127) << sh; sh += 7
            if c < 128: break
        s.o = o; return v
    def zz(s): v = s.vu(); return -((v + 1) >> 1) if v & 1 else v >> 1
_base = None
def base():
    global _base
    if _base is None: _base = json.loads(_rd('tyo_base.bin'))
    return _base
_H = None
def ground(x, y):
    """terrain height (m) as the app's hC (bilinear on the TS grid)"""
    global _H
    B = base()
    if _H is None: _H = np.frombuffer(base64.b64decode(B['H']), dtype='<i2').reshape(B['TN'], B['TN']).astype(np.float64)/10
    HALF, TS, TN = B['HALF'], B['TS'], B['TN']
    fx = (x + HALF)/TS; fy = (y + HALF)/TS; i = min(TN - 2, max(0, int(fx))); j = min(TN - 2, max(0, int(fy))); u = fx - i; v = fy - j
    return float(_H[j, i]*(1 - u)*(1 - v) + _H[j, i + 1]*u*(1 - v) + _H[j + 1, i]*(1 - u)*v + _H[j + 1, i + 1]*u*v)
_idx = None
def _index():
    global _idx
    if _idx is None:
        b0 = _rd('tyo_bld0.bin'); assert b0[:4] == b'SGB2'
        r = Rd(b0, 4); T = r.vu(); TX = r.vu(); nparts = r.vu(); nt = r.vu(); idx = {}
        for _ in range(nt):
            ti = r.vu(); idx[ti] = dict(nB=r.vu(), lenB=r.vu(), nS=r.vu(), part=r.vu(), offS=r.vu(), lenS=r.vu())
        o = r.o
        for ti in idx: idx[ti]['offB'] = o; o += idx[ti]['lenB']   # big sections follow in index order
        _idx = dict(T=T, TX=TX, HALF=T*TX/2, idx=idx, b0=b0, parts={})
    return _idx
def _declist(buf, o, ti, n, I):
    T, TX, HALF = I['T'], I['TX'], I['HALF']; ox = -HALF + (ti % TX)*T; oy = -HALF + (ti // TX)*T
    r = Rd(buf, o); out = []
    for k in range(n):
        f = r.u8(); h = r.vu()/10; bs = r.vu()/10; r.o += 3
        rs = r.u8()
        if rs == 255: r.o += 3
        seed = r.u8(); nr = r.vu(); rings = []; px = py = 0
        for _ in range(nr):
            m = r.vu(); P = np.empty((m, 2))
            for i in range(m): px += r.zz(); py += r.zz(); P[i, 0] = ox + px/4; P[i, 1] = oy + py/4
            if m >= 3: rings.append(P)
        if not rings: continue
        P = rings[0]; x = P[:, 0]; y = P[:, 1]; xn = np.roll(x, -1); yn = np.roll(y, -1); c = x*yn - xn*y; A = c.sum()/2
        cx, cy = (((x + xn)*c).sum()/(6*A), ((y + yn)*c).sum()/(6*A)) if abs(A) > 1e-6 else (x.mean(), y.mean())
        out.append(dict(t=f & 31, part=bool(f & 64), big=bool(f & 128), h=h, base=bs, seed=seed, rings=rings, cx=float(cx), cy=float(cy), area=abs(float(A)), tile=ti, i=k))
    return out
_tc = {}
def tile(ti):
    """all building records of one 2 km tile (big then small; parts follow their building)"""
    if ti in _tc: return _tc[ti]
    I = _index(); e = I['idx'].get(ti)
    if not e: _tc[ti] = []; return []
    L = _declist(I['b0'], e['offB'], ti, e['nB'], I) if e['nB'] else []
    if e['nS']:
        p = e['part']
        if p not in I['parts']: I['parts'][p] = _rd('tyo_bld%d.bin' % p)
        L += _declist(I['parts'][p], e['offS'], ti, e['nS'], I)
    _tc[ti] = L; return L
def buildings(x0, y0, x1, y1):
    I = _index(); T, TX, HALF = I['T'], I['TX'], I['HALF']; out = []
    for j in range(int((y0 + HALF)//T) - 1, int((y1 + HALF)//T) + 2):
        for i in range(int((x0 + HALF)//T) - 1, int((x1 + HALF)//T) + 2):
            if 0 <= i < TX and 0 <= j < TX:
                for B in tile(j*TX + i):
                    if x0 <= B['cx'] <= x1 and y0 <= B['cy'] <= y1: out.append(B)
    return out
_roads = None
def roads():
    """[{c, ow, br, link, name:(en, zh), ref, pts (n,2), elev (n,) or None}] — every road / rail / path record the app draws"""
    global _roads
    if _roads is not None: return _roads
    b = _rd('tyo_roads.bin'); assert b[:4] == b'SGR1'
    B = base(); names = B['names']; refs = B['refs']
    r = Rd(b, 4); n = r.vu(); px = py = 0; out = []
    for _ in range(n):
        c = r.u8(); fl = r.u8(); ni = r.vu(); ri = r.vu(); m = r.vu(); P = np.empty((m, 2))
        for i in range(m): px += r.zz(); py += r.zz(); P[i, 0] = px/4; P[i, 1] = py/4
        el = None
        if fl & 4:
            esc = 2.5 if fl & 32 else 5.0; el = np.frombuffer(b, np.uint8, m, r.o).astype(np.float64)/esc; r.o += m
        nm = names[ni] if ni else ['', '']
        out.append(dict(c=c, ow=bool(fl & 1), br=bool(fl & 2), link=bool(fl & 16), name=nm[0] or None, zh=nm[1] or None, ref=refs[ri] if ri else None, pts=P, elev=el))
    _roads = out; return out
if __name__ == '__main__':
    import sys, time
    t0 = time.time(); x, y = w(139.7671, 35.6812); L = buildings(x - 300, y - 300, x + 300, y + 300)
    print('Tokyo Station 600 m box:', len(L), 'records', sum(1 for B in L if B['part']), 'parts', round(time.time() - t0, 1), 's; tallest',
          sorted(((B['h'], round(B['cx'] - x), round(B['cy'] - y)) for B in L), reverse=True)[:5])
    print('ground at Tokyo Station', round(ground(x, y), 1), 'base keys', sorted(base().keys())[:30])
    if '--roads' in sys.argv:
        t0 = time.time(); R = roads(); print('roads', len(R), round(time.time() - t0, 1), 's, bridges with elev', sum(1 for l in R if l['elev'] is not None))
