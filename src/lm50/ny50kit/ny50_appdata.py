# Decoder for the staged New York app data (site/nycdata/*.bin, raw gzip) — what the app actually draws.
# The nycreal/out/*.pkl pipeline outputs that b9_refs.py needs are gone; this reads the encoded files written by b7_encode.py
# (formats: 'SGB2' tile index + buildings, 'SGR1' roads, nyc_base json). Coordinates: NYC metres x = (lon + 73.98)*84516,
# y = (lat - 40.70)*111048 (north up).
import gzip, json, base64, struct, numpy as np
D = '/home/claude/earth_online/site/nycdata/'
LON0, LAT0, MX, MY = -73.98, 40.70, 84516.0, 111048.0
HALF, Q = 28000, 4.0
def w(lon, lat): return ((lon - LON0)*MX, (lat - LAT0)*MY)
def ll(x, y): return (LON0 + x/MX, LAT0 + y/MY)
class Rd:
    def __init__(s, b, o=0): s.b = b; s.o = o
    def u8(s): v = s.b[s.o]; s.o += 1; return v
    def vu(s):
        v = 0; sh = 0; b = s.b
        while True:
            c = b[s.o]; s.o += 1; v |= (c & 127) << sh; sh += 7
            if c < 128: return v
    def vs(s): v = s.vu(); return -(v >> 1) - 1 if v & 1 else v >> 1
_base = None
def base():
    global _base
    if _base is None: _base = json.loads(gzip.decompress(open(D + 'nyc_base.bin', 'rb').read()))
    return _base
_H = None
def ground(x, y):
    global _H
    B = base()
    if _H is None: _H = np.frombuffer(base64.b64decode(B['H']), np.int16).reshape(B['TN'], B['TN'])/10.0
    TS, TN = B['TS'], B['TN']; fx = (x + HALF)/TS; fy = (y + HALF)/TS
    i = min(TN - 2, max(0, int(fx))); j = min(TN - 2, max(0, int(fy))); u = fx - i; v = fy - j
    return float(_H[j, i]*(1 - u)*(1 - v) + _H[j, i + 1]*u*(1 - v) + _H[j + 1, i]*(1 - u)*v + _H[j + 1, i + 1]*u*v)
_idx = None
def index():
    global _idx
    if _idx is None:
        b = gzip.decompress(open(D + 'nyc_bld0.bin', 'rb').read()); r = Rd(b); assert b[:4] == b'SGB2'; r.o = 4
        T = r.vu(); TX = r.vu(); nparts = r.vu(); nt = r.vu(); tiles = []
        for _ in range(nt): tiles.append([r.vu() for _ in range(7)])   # ti, nbig, bigLen, nsmall, k, off, smallLen
        off = r.o; meta = {}
        for ti, nb, bl, ns, k, so, sl in tiles: meta[ti] = (nb, off, bl, ns, k, so, sl); off += bl
        _idx = (b, T, TX, meta)
    return _idx
_parts = {}
def part(k):
    if k not in _parts: _parts[k] = gzip.decompress(open(D + 'nyc_bld%d.bin' % k, 'rb').read())
    return _parts[k]
def recs(buf, off, ln, ti, T, TX):
    r = Rd(buf, off); end = off + ln; ox = -HALF + (ti % TX)*T; oy = -HALF + (ti // TX)*T; out = []
    while r.o < end:
        fl = r.u8(); h = r.vu()/10; bs = r.vu()/10; wall = (r.u8(), r.u8(), r.u8()); rf = r.u8()
        rc = (r.u8(), r.u8(), r.u8()) if rf == 255 else None; seed = r.u8(); nr = r.vu(); px = py = 0; rings = []
        for _ in range(nr):
            n = r.vu(); ring = []
            for _ in range(n): px += r.vs(); py += r.vs(); ring.append((px/Q + ox, py/Q + oy))
            rings.append(ring)
        out.append({'t':fl & 31, 'part':bool(fl & 64), 'big':bool(fl & 128), 'h':h, 'base':bs, 'wall':wall, 'roof':rf if rc is None else None, 'rc':rc, 'rings':rings})
    return out
def buildings(x0, y0, x1, y1):
    """every app building record (big + small) of the tiles touching the box (NYC metres)"""
    b, T, TX, meta = index(); out = []
    for ty in range(int((y0 + HALF)//T), int((y1 + HALF)//T) + 1):
        for tx in range(int((x0 + HALF)//T), int((x1 + HALF)//T) + 1):
            ti = ty*TX + tx; m = meta.get(ti)
            if not m: continue
            nb, bo, bl, ns, k, so, sl = m
            out += recs(b, bo, bl, ti, T, TX)
            if sl: out += recs(part(k), so, sl, ti, T, TX)
    return out
_roads = None
def roads():
    global _roads
    if _roads is None:
        b = gzip.decompress(open(D + 'nyc_roads.bin', 'rb').read()); assert b[:4] == b'SGR1'; r = Rd(b, 4); n = r.vu(); px = py = 0; out = []
        names = base()['names']
        for _ in range(n):
            c = r.u8(); fl = r.u8(); ni = r.vu(); ri = r.vu(); nc = r.vu(); pts = []
            for _ in range(nc): px += r.vs(); py += r.vs(); pts.append((px/Q, py/Q))
            el = None
            if fl & 4: esc = 2.5 if fl & 32 else 5.0; el = [r.u8()/esc for _ in range(nc)]
            nm = names[ni] if ni else None
            out.append({'c':c, 'ow':bool(fl & 1), 'br':bool(fl & 2), 'link':bool(fl & 16), 'name':nm[0] if nm else '', 'zh':nm[1] if nm else '', 'ref':base()['refs'][ri] if ri else '', 'pts':pts, 'elev':el})
        _roads = out
    return _roads
if __name__ == '__main__':
    import time, sys; t = time.time()
    x, y = w(-73.9857, 40.7484); B = buildings(x - 200, y - 200, x + 200, y + 200)
    print('ESB box', len(B), 'records, max h', max(r['h'] for r in B), round(time.time() - t, 1), 's'); t = time.time()
    R = roads(); print('roads', len(R), 'with elev', sum(1 for r in R if r['elev']), round(time.time() - t, 1), 's; ground at ESB', round(ground(x, y), 1))
