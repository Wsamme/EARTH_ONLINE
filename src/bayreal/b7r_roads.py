# re-encode only the roads (after b4b_bridges) and update the road names in the base json
# stage 7 (Bay Area): binary encodings for the app.
#   bay_bld0 : 'SGB2' tile index + the big buildings (h >= 20 m, >= 900 m2, parts) of every tile, decoded at start
#   bay_bld1..k : the small buildings (houses, sheds ...) of the tiles, decoded per tile when the camera comes near
#   bay_roads ('SGR1'), bay_water ('SGW1'), bay_base (json, with precomputed statistics)
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
wz('bay_roads.bin.gz', wr.b)

import gzip as _gz
p = OUT + 'bay_base.json.gz'; Bj = json.loads(_gz.decompress(open(p, 'rb').read())); Bj['names'] = names; Bj['refs'] = refs
open(p, 'wb').write(_gz.compress(json.dumps(Bj, separators=(',', ':'), ensure_ascii=False).encode(), 9)); print('base names updated')
