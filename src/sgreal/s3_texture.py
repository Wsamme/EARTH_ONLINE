# stage 3: ground texture (land use, water, beaches) and the engine rasters at CELL
import sys; sys.path.insert(0, '.')
from common import *
from raster import raster, polys_of
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi
from shapely.geometry import box
B = pickle.load(open(SGD + 'base15.pkl', 'rb'))
L = load('land.pkl'); F = load('fresh.pkl')
sea = np.load(OUT + 'sea10.npy'); sgm = np.load(OUT + 'sg10.npy'); frm = np.load(OUT + 'for10.npy'); fw = np.load(OUT + 'fw10.npy'); dland = np.load(OUT + 'dland10.npy')
n10 = sea.shape[0]
TX = 8192; RES = 2*HALF/TX            # draw at 8192, ship 4096
def col(c): return tuple(int(v) for v in c)
LU = {  # kind: (priority, rgb)
 'residential':(1,(229,223,209)), 'commercial':(1,(233,219,209)), 'industrial':(1,(219,214,221)), 'military':(1,(213,211,197)), 'aerodrome':(1,(216,216,207)), 'airfield':(2,(206,206,199)),
 'school':(2,(233,222,199)), 'college':(2,(233,222,199)), 'university':(2,(233,222,199)), 'kindergarten':(3,(233,222,199)), 'hospital':(2,(236,214,210)), 'other':(1,(224,220,207)),
 'railway':(2,(212,205,192)), 'cemetery':(3,(181,199,160)), 'farmland':(3,(212,219,168)), 'allotments':(3,(206,214,160)),
 'park':(4,(184,208,158)), 'garden':(4,(178,206,150)), 'recreation_ground':(4,(186,210,160)), 'village_green':(4,(186,210,160)), 'dog_park':(5,(190,208,160)), 'zoo':(4,(176,204,148)),
 'golf_course':(4,(170,205,138)), 'grass':(5,(193,213,163)), 'meadow':(5,(196,214,166)), 'grassland':(5,(196,214,166)),
 'forest':(6,(144,174,118)), 'wood':(6,(150,178,122)), 'nature_reserve':(4,(160,186,132)), 'protected_area':(4,(166,190,138)), 'scrub':(6,(170,190,138)), 'wetland':(6,(156,186,158)),
 'sand':(7,(236,222,182)), 'beach':(7,(239,226,186)), 'bare_rock':(7,(204,196,180)), 'dam':(7,(205,200,188)),
 'pitch':(8,(146,193,118)), 'playground':(8,(221,205,170)), 'pedestrian':(8,(222,214,199)), 'platform':(8,(206,201,190)), 'pier':(8,(205,198,184))}
img = Image.new('RGB', (TX, TX), (0, 0, 0)); dr = ImageDraw.Draw(img)
def P(c): return [((x + HALF)/RES, (HALF - y)/RES) for x, y in c]     # image rows from the north
def fill(g, rgb, outline=None):
    for p in polys_of(g):
        if len(p.exterior.coords) < 3: continue
        dr.polygon(P(p.exterior.coords), fill=rgb, outline=outline)
        for h in p.interiors: dr.polygon(P(h.coords), fill=None)
# sea: depth shading from the 10 m distance-to-land map
d = np.clip(dland/1800.0, 0, 1)**0.6
seac = np.stack([143 - 40*d, 181 - 38*d, 202 - 30*d], -1).astype(np.uint8)
seaimg = Image.fromarray(seac[::-1]).resize((TX, TX), Image.BILINEAR)
img.paste(seaimg)
fill(L['foreign'], (212, 209, 200))
ext = frm.copy(); ext[904:4651, :] = False                     # land beyond the source data (copied edges)
mimg = Image.fromarray((ext[::-1]*255).astype(np.uint8)).resize((TX, TX), Image.NEAREST)
img.paste(Image.new('RGB', (TX, TX), (212, 209, 200)), (0, 0), mimg)
fill(L['sg'], (226, 222, 210))
# land use, by priority then area
items = []
for p, g in B['landuse']:
    k = p.get('kind')
    if k not in LU: continue
    g = proj(g)
    if g.is_empty: continue
    items.append((LU[k][0], -g.area, k, g))
items.sort(key=lambda t: (t[0], t[1]))
for pr, na, k, g in items:
    rgb = LU[k][1]
    fill(g, rgb, outline=(236, 240, 228) if k == 'pitch' else None)
# fresh water (all bodies, also the tiny ones), pools
for g in F['sig'] + F['flat']: fill(g, (128, 172, 198))
for g in L['pools']: fill(g, (118, 190, 222))
# drains, canals and streams drawn as lines
WW = {'river':10, 'canal':9, 'drain':5, 'stream':3, 'ditch':2.5}
for p, g in L['wlines']:
    wd = WW.get(p['kind'], 3)
    for ln in (g.geoms if hasattr(g, 'geoms') else [g]):
        if ln.geom_type != 'LineString': continue
        dr.line(P(ln.coords), fill=(150, 160, 160), width=max(1, int(round((wd + 3)/RES))))
        dr.line(P(ln.coords), fill=(128, 172, 198), width=max(1, int(round(wd/RES))))
from PIL import ImageEnhance
out = img.resize((4096, 4096), Image.LANCZOS)
out = ImageEnhance.Color(out).enhance(1.45); out = ImageEnhance.Brightness(out).enhance(0.86)
out.save(OUT + 'ground.webp', quality=90, method=6)
out.resize((1024, 1024), Image.LANCZOS).save(OUT + 'prev_ground.png')
# crops for checking
img.crop((int((w(103.83, 1.30)[0] + HALF)/RES), int((HALF - w(0, 1.30)[1])/RES), int((w(103.88, 1.30)[0] + HALF)/RES), int((HALF - w(0, 1.26)[1])/RES))).save(OUT + 'prev_ground_cbd.png')
print('texture done')
# ---------- engine rasters at CELL (row 0 = south) ----------
nC = N; f = int(CELL/10) if CELL % 10 == 0 else None
def down(mask, how='any'):
    # mask at 10 m -> CELL by area fraction (CELL = 25 m = 2.5 px): use zoom on float
    z = ndi.zoom(mask.astype(np.float32), N/mask.shape[0], order=1)
    return z
lu_r = {}
codes = np.zeros((N, N), np.uint8)       # 0 SG land, 1 sea, 2 fresh water, 3 forest, 4 beach, 5 foreign land
fr_sea = down(sea); fr_fw = down(fw); fr_for = down(frm & ~fw)
codes[fr_sea > 0.5] = 1
codes[(fr_fw > 0.5) & (fr_sea <= 0.5)] = 2
codes[(fr_for > 0.5) & (codes == 0)] = 5
# forest and beach cells from land use, rasterised at CELL
fo = np.asarray(raster([g for pr, na, k, g in items if k in ('forest', 'wood', 'nature_reserve', 'scrub', 'wetland')], CELL)).astype(bool)
be = np.asarray(raster([g for pr, na, k, g in items if k in ('beach', 'sand')], CELL)).astype(bool)
codes[(codes == 0) & fo] = 3
codes[(codes == 0) & be] = 4
# land-use class per cell for statistics and the zone view: 1 residential 2 commercial 3 industrial 4 park/green 5 office? (none) 6 public (school, hospital, university), 7 airport/military/port
LC = {'residential':1, 'commercial':2, 'industrial':3, 'park':4, 'garden':4, 'recreation_ground':4, 'golf_course':4, 'zoo':4, 'grass':4, 'meadow':4, 'cemetery':4, 'village_green':4,
      'school':6, 'college':6, 'university':6, 'hospital':6, 'kindergarten':6, 'military':7, 'aerodrome':7, 'airfield':7}
luimg = Image.new('L', (N, N), 0)
for pr, na, k, g in items:
    if k in LC: raster([g], CELL, LC[k], luimg)
lu = np.asarray(luimg)
np.save(OUT + 'codes25.npy', codes); np.save(OUT + 'lu25.npy', lu)
print('codes', np.bincount(codes.ravel(), minlength=6), 'lu', np.bincount(lu.ravel(), minlength=8))
save(items, 'landuse.pkl')
