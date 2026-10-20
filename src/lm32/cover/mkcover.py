# v36: vector land cover for the sharp ground (lm32/detail): the polygons that were baked into ground.webp at 14-18 m per pixel,
# shipped as vectors so the app can draw them crisply near the camera (3D) and in the big map (2D).
# usage: python3 lm32/cover/mkcover.py sg|bay|nyc   ->  sgreal/site/<c>data/<c>_cover.txt (gzip, base64 text like the other data files)
# Format (little endian): 'CVR1', u8 nClass, per class: r g b (u8, the final colour after the same enhancement as ground.webp),
#   cr cg cb (casing colour for lines, 0 0 0 = none), u8 casing extra width (x4 m), u8 flags (1 = big map only, 2 = land under the
#   water: drawn before the sea in the big map); then varint nPoly, per polygon: varint class,
#   varint nPts, nPts x (zigzag varint dx, dy) in 0.5 m units, delta from the previous point of the whole stream; then varint nLine,
#   per line: varint class, varint width (x4 m), varint nPts, points as above. Polygons are exteriors only (ground.webp ignored
#   holes too), oriented the same way (so a non-zero fill unions overlaps), big ones cut on a 1 km grid; drawing order = file order.
import sys, os, io, gzip, base64, struct, pickle, collections
import numpy as np
city = sys.argv[1]
ROOT = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
D = {'sg': 'sgreal', 'bay': 'bayreal', 'nyc': 'nycreal'}[city]
sys.path.insert(0, ROOT + D)
os.chdir(ROOT + D)
from common import *
from raster import polys_of
from shapely.geometry import Polygon, LineString, box
from shapely.geometry.polygon import orient
from PIL import Image, ImageEnhance

items = load('landuse.pkl')                    # (priority, -area, kind, geom) sorted as drawn into ground.webp
L = load('land.pkl')
if city == 'sg':
    LU = {'residential':(229,223,209), 'commercial':(233,219,209), 'industrial':(219,214,221), 'military':(213,211,197), 'aerodrome':(216,216,207), 'airfield':(206,206,199),
     'school':(233,222,199), 'college':(233,222,199), 'university':(233,222,199), 'kindergarten':(233,222,199), 'hospital':(236,214,210), 'other':(224,220,207),
     'railway':(212,205,192), 'cemetery':(181,199,160), 'farmland':(212,219,168), 'allotments':(206,214,160),
     'park':(184,208,158), 'garden':(178,206,150), 'recreation_ground':(186,210,160), 'village_green':(186,210,160), 'dog_park':(190,208,160), 'zoo':(176,204,148),
     'golf_course':(170,205,138), 'grass':(193,213,163), 'meadow':(196,214,166), 'grassland':(196,214,166),
     'forest':(144,174,118), 'wood':(150,178,122), 'nature_reserve':(160,186,132), 'protected_area':(166,190,138), 'scrub':(170,190,138), 'wetland':(156,186,158),
     'sand':(236,222,182), 'beach':(239,226,186), 'bare_rock':(204,196,180), 'dam':(205,200,188),
     'pitch':(146,193,118), 'playground':(221,205,170), 'pedestrian':(222,214,199), 'platform':(206,201,190), 'pier':(205,198,184)}
    ENH = (1.45, 0.86); SKIP = set()
    F = load('fresh.pkl')
    fresh = [((128, 172, 198), g) for g in F['sig'] + F['flat']]
    WW = {'river':10, 'canal':9, 'drain':5, 'stream':3, 'ditch':2.5}; WCOL = (128, 172, 198); WCASE = ((150, 160, 160), 3)
else:
    src = open(ROOT + D + '/b3_texture.py').read()
    i0 = src.index('LU = {'); i1 = src.index('}', src.index("'pier'", i0)) + 1
    LU = {k: v[1] for k, v in eval(src[i0 + 5:i1]).items()}
    ENH = (1.25, 0.9)
    # the speckle pass (b3b_speckle.py) baked every roof into ground.webp over the land use: the plain urban classes stay in the
    # (blurred) texture so that grain is kept; the distinct covers (green, sand, water, paving, pitches...) are drawn sharp
    SKIP = {'residential', 'commercial', 'industrial', 'military', 'aerodrome', 'school', 'college', 'university', 'kindergarten', 'hospital',
            'institutional', 'religious', 'railway', 'construction', 'brownfield'}
    SALT = [(196, 124, 132), (204, 150, 116), (150, 170, 140), (186, 110, 120), (172, 160, 118), (128, 160, 150)]
    r = np.random.default_rng(3); fresh = []
    for p, g in L['fresh_list']:
        fresh.append((SALT[int(r.integers(len(SALT)))] if p['kind'] == 'salt_pond' else (118, 158, 176), g))
    WW = {'river':12, 'canal':9, 'drain':4, 'stream':3}; WCOL = (118, 158, 176); WCASE = None

def enh(rgb):
    im = Image.new('RGB', (1, 1), tuple(rgb))
    im = ImageEnhance.Color(im).enhance(ENH[0]); im = ImageEnhance.Brightness(im).enhance(ENH[1])
    return im.getpixel((0, 0))

classes, cidx = [], {}
def cls(rgb, case=None, flags=0):
    key = (tuple(rgb), case, flags)
    if key not in cidx:
        cidx[key] = len(classes); classes.append(key)
    return cidx[key]

GRID = 1000.0
def pieces(g):
    out = []
    for p in polys_of(g):
        if p.area < 3: continue
        q = Polygon(p.exterior.coords)
        if not q.is_valid: q = q.buffer(0)
        for e in polys_of(q):
            x0, y0, x1, y1 = e.bounds
            if x1 - x0 <= 1500 and y1 - y0 <= 1500:
                out.append(e); continue
            for gx in range(int(np.floor(x0/GRID)), int(np.floor(x1/GRID)) + 1):
                for gy in range(int(np.floor(y0/GRID)), int(np.floor(y1/GRID)) + 1):
                    c = e.intersection(box(gx*GRID, gy*GRID, (gx + 1)*GRID, (gy + 1)*GRID))
                    out.extend(k for k in polys_of(c) if k.area >= 1)
    res = []
    for e in out:
        e = e.simplify(0.5, preserve_topology=False)
        for k in polys_of(e):
            if k.area < 2: continue
            k = orient(Polygon(k.exterior.coords), 1.0)
            res.append(list(k.exterior.coords)[:-1])
    return res

polys = []          # (class, pts)
skipped = collections.Counter(); kept = collections.Counter()
if city == 'sg':
    # the land itself (s3_texture.py: context land, then Singapore), so the coast is sharp on the land side too
    for rgb, g in (((212, 209, 200), L['foreign']), ((226, 222, 210), L['sg'])):
        c = cls(enh(rgb), None, 2)
        for pts in pieces(g): polys.append((c, pts))
for pr, na, k, g in items:
    if k not in LU: skipped[k] += 1; continue
    c = cls(enh(LU[k]), None, 1 if k in SKIP else 0)       # the urban classes: only in the big map (3D keeps the roof grain)
    for pts in pieces(g):
        polys.append((c, pts)); kept[k] += 1
for rgb, g in fresh:
    c = cls(enh(rgb))
    for pts in pieces(g): polys.append((c, pts))
cp = cls(enh((118, 190, 222)))
for g in L['pools']:
    for pts in pieces(g): polys.append((cp, pts))
lines = []
lc = cls(enh(WCOL), (enh(WCASE[0]), WCASE[1]) if WCASE else None)
for p, g in L['wlines']:
    wd = WW.get(p['kind'], 3)
    for ln in (g.geoms if hasattr(g, 'geoms') else [g]):
        if ln.geom_type != 'LineString': continue
        ln = ln.simplify(0.5)
        if len(ln.coords) < 2: continue
        lines.append((lc, wd, list(ln.coords)))

buf = io.BytesIO()
def vu(v):
    v = int(v)
    while True:
        b = v & 127; v >>= 7
        if v: buf.write(bytes([b | 128]))
        else: buf.write(bytes([b])); return
def zz(v): return (v << 1) if v >= 0 else ((-v << 1) - 1)
last = [0, 0]
def pts_out(P):
    vu(len(P))
    for x, y in P:
        qx, qy = int(round(x*2)), int(round(y*2))
        vu(zz(qx - last[0])); vu(zz(qy - last[1])); last[0], last[1] = qx, qy
buf.write(b'CVR2'); buf.write(bytes([len(classes)]))
for (rgb, case, fl) in classes:
    buf.write(bytes(rgb)); buf.write(bytes(case[0] if case else (0, 0, 0))); buf.write(bytes([int(round((case[1] if case else 0)*4)), fl]))
vu(len(polys))
for c, P in polys: vu(c); pts_out(P)
vu(len(lines))
for c, wd, P in lines: vu(c); vu(int(round(wd*4))); pts_out(P)
raw = buf.getvalue()
gz = gzip.compress(raw, 9)
out = ROOT + 'sgreal/site/%sdata/%s_cover.txt' % (city, city)
open(out, 'w').write(base64.b64encode(gz).decode())
nv = sum(len(P) for _, P in polys) + sum(len(P) for _, _, P in lines)
print(city, 'classes', len(classes), 'polys', len(polys), 'lines', len(lines), 'verts', nv, 'raw', len(raw), 'gz', len(gz), 'txt', os.path.getsize(out))
print('kept', kept.most_common(12)); print('skipped', skipped.most_common(12))
