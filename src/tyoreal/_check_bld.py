# check the vectorized encoder: decode SGB2 (index + big sections) and part files, verify record counts and byte consumption,
# compare a few buildings with the source arrays
import sys, gzip; sys.path.insert(0, '.')
from common import *
def rd(b):
    o = [0]
    def u8():
        v = b[o[0]]; o[0] += 1; return v
    def vu():
        v = 0; s = 0
        while True:
            c = b[o[0]]; o[0] += 1; v |= (c & 127) << s; s += 7
            if not (c & 128): return v
    def vs():
        v = vu(); return -((v + 1) >> 1) if v & 1 else v >> 1
    return o, u8, vu, vs
def records(b, n):
    o, u8, vu, vs = rd(b); out = []
    for _ in range(n):
        px = py = 0
        f = u8(); h = vu()/10; base = vu()/10; w3 = (u8(), u8(), u8()); r = u8()
        rc = (u8(), u8(), u8()) if r == 255 else None
        seed = u8(); nr = vu(); rings = []
        for k in range(nr):
            m = vu(); P = []
            for j in range(m): px += vs(); py += vs(); P.append((px/4, py/4))
            rings.append(P)
        out.append((f, h, base, w3, r, rc, seed, rings))
    return out, o[0]
b0 = gzip.decompress(open(OUT + 'tyo_bld0.bin.gz', 'rb').read())
assert b0[:4] == b'SGB2'
o, u8, vu, vs = rd(b0); o[0] = 4
T = vu(); TX = vu(); nparts = vu(); nt = vu(); idx = []
for _ in range(nt): idx.append((vu(), vu(), vu(), vu(), vu(), vu(), vu()))
pos = o[0]; nb = 0; ns = 0
parts = {k: gzip.decompress(open(OUT + 'tyo_bld%d.bin.gz' % k, 'rb').read()) for k in range(1, nparts + 1)}
bad = 0; sample = None
for ti, nbig, lbig, nsm, k, off, lsm in idx:
    recs, used = records(b0[pos:pos + lbig], nbig)
    if used != lbig: bad += 1
    pos += lbig; nb += nbig
    recs2, used2 = records(parts[k][off:off + lsm], nsm)
    if used2 != lsm: bad += 1
    ns += nsm
    if sample is None and nsm > 100: sample = (ti, recs2[:3])
print('tiles', nt, 'parts', nparts, 'big', nb, 'small', ns, 'bad sections', bad, 'end', pos, len(b0))
ti, rs = sample; ox = -HALF + (ti % TX)*T; oy = -HALF + (ti // TX)*T
for r in rs: print('flags', r[0], 'h', r[1], 'wall', r[3], 'roof', r[4], 'seed', r[6], 'ring0', [(round(x + ox, 1), round(y + oy, 1)) for x, y in r[7][0]][:5])
# the tile with Marunouchi
x, y = w(139.7650, 35.6820); tq = int((y + HALF)//T)*TX + int((x + HALF)//T)
pos = o0 = None
p = 0
o, u8, vu, vs = rd(b0); o[0] = 4; vu(); vu(); vu(); n = vu(); ents = [(vu(), vu(), vu(), vu(), vu(), vu(), vu()) for _ in range(n)]; p = o[0]
for ti, nbig, lbig, nsm, k, off, lsm in ents:
    if ti == tq:
        recs, used = records(b0[p:p + lbig], nbig)
        hs = sorted([r[1] for r in recs], reverse=True)
        print('tile', ti, 'big', nbig, 'tallest', hs[:12], 'parts', sum(1 for r in recs if r[0] & 64))
        ox = -HALF + (ti % TX)*T; oy = -HALF + (ti // TX)*T
        for r in recs:
            if r[1] >= 180: print('  h', r[1], 'flags', r[0], 'base', r[2], 'seed', r[6], 'ring0', [(round(a + ox), round(b + oy)) for a, b in r[7][0][:4]])
    p += lbig
