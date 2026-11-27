# stage 3 (gbareal; from hkreal): ground texture (subtropical palette: green shrub- and grassland hills of the country parks, urban grey, fish ponds;
# Shenzhen as muted context land) and the engine rasters at CELL
import sys, collections; sys.path.insert(0, '.')
from common import *
from raster import raster, polys_of
from PIL import Image, ImageDraw, ImageEnhance
from scipy import ndimage as ndi
import shapely.wkb
AREAS = pickle.load(open(OUT + 'raw_areas.pkl', 'rb'))
L = load('land.pkl'); F = load('fresh.pkl'); T2 = load('terrain.pkl')
land12 = np.load(OUT + 'land12.npy'); fw12 = np.load(OUT + 'fw12.npy'); dland = np.load(OUT + 'dland12.npy'); frm12 = np.load(OUT + 'frm12.npy')
n12 = land12.shape[0]
TX = 8192; RES = 2*HALF/TX
def kind_of(t):
    if t.get('boundary') in ('protected_area', 'national_park') or t.get('leisure') == 'nature_reserve': return 'protected_area'
    for k in ('aeroway', 'amenity', 'leisure', 'tourism', 'natural', 'landuse', 'man_made'):
        v = t.get(k)
        if v: return {'retail':'commercial', 'education':'school', 'farmyard':'farmland', 'plant_nursery':'farmland', 'greenhouse_horticulture':'farmland', 'flowerbed':'garden',
                      'schoolyard':'school', 'common':'park', 'parklet':'park', 'theme_park':'zoo', 'apron':'apron', 'runway':'apron', 'taxiway':'apron', 'marina':'pier', 'container_terminal':'industrial', 'port':'industrial'}.get(v, v)
    return None
LU = {  # kind: (priority, rgb)
 'residential':(1,(229,223,210)), 'commercial':(1,(232,220,210)), 'industrial':(1,(219,215,221)), 'military':(1,(214,212,198)), 'aerodrome':(1,(214,214,205)), 'apron':(3,(196,196,192)),
 'school':(2,(233,222,199)), 'college':(2,(233,222,199)), 'university':(2,(233,222,199)), 'kindergarten':(3,(233,222,199)), 'hospital':(2,(236,214,210)), 'institutional':(2,(230,220,206)),
 'religious':(2,(230,220,206)), 'railway':(2,(212,205,192)), 'construction':(2,(222,212,190)), 'brownfield':(2,(214,204,184)), 'quarry':(3,(205,195,178)), 'landfill':(3,(196,190,170)),
 'cemetery':(3,(175,196,150)), 'farmland':(3,(214,206,160)), 'orchard':(3,(170,186,128)), 'vineyard':(3,(186,184,128)), 'allotments':(3,(196,206,150)), 'parking':(3,(214,212,206)),
 'park':(4,(176,202,142)), 'garden':(4,(172,202,140)), 'recreation_ground':(4,(182,206,150)), 'village_green':(4,(182,206,150)), 'dog_park':(5,(190,206,152)), 'zoo':(4,(176,200,146)),
 'golf_course':(4,(160,198,128)), 'grass':(5,(184,204,150)), 'meadow':(5,(186,202,146)), 'grassland':(5,(184,198,144)), 'heath':(5,(176,186,138)),
 'forest':(6,(104,136,90)), 'wood':(6,(116,146,96)), 'protected_area':(4,(174,192,142)), 'scrub':(6,(140,160,108)), 'shrubbery':(7,(150,170,120)), 'wetland':(6,(156,168,126)),
 'sand':(7,(236,222,182)), 'beach':(7,(238,226,190)), 'bare_rock':(7,(196,188,172)), 'scree':(7,(196,188,172)), 'mud':(6,(170,160,140)), 'shingle':(7,(200,192,176)),
 'pitch':(8,(140,186,112)), 'track':(8,(196,128,100)), 'playground':(8,(221,205,170)), 'stadium':(7,(210,206,196)), 'sports_centre':(7,(214,210,200)),
 'pedestrian':(8,(222,214,199)), 'platform':(8,(206,201,190)), 'pier':(8,(200,194,182))}
from shapely.prepared import prep
LANDB = L['all'].buffer(15); FORP = prep(L['foreign'].buffer(-20)); LANDBP = prep(LANDB)
from shapely.strtree import STRtree
from shapely.ops import unary_union
from shapely.geometry import box as _bx
# the land cut in 2 km cells: clipping a land-use polygon touches only the pieces it overlaps
LPARTS = [q for gx in range(-(HALF//2000) - 1, HALF//2000 + 1) for gy in range(-(HALF//2000) - 1, HALF//2000 + 1) for q in [LANDB.intersection(_bx(gx*2000, gy*2000, gx*2000 + 2000, gy*2000 + 2000))] if not q.is_empty]
LTREE = STRtree(LPARTS)
items = []; nfor = 0
for oid, fway, t, wk in AREAS:
    k = kind_of(t)
    if k not in LU: continue
    if k == 'parking' and t.get('parking') in ('underground', 'multi-storey'): continue
    g = proj(shapely.wkb.loads(wk))
    if g.is_empty: continue
    if FORP.contains(g.representative_point()) and k not in ('forest', 'wood', 'park', 'golf_course', 'scrub', 'grassland', 'beach', 'sand', 'aerodrome', 'apron'): nfor += 1; continue    # Shenzhen: context only
    if k in ('protected_area', 'wetland', 'mud', 'beach', 'sand', 'military', 'aerodrome', 'meadow', 'grassland', 'scrub', 'wood'):
        g = g.buffer(0)
        if not LANDBP.contains(g):
            parts = [LPARTS[int(k)] for k in LTREE.query(g)]
            g = unary_union([g.intersection(q) for q in parts]) if parts else g.intersection(LANDB)
        if g.is_empty: continue
    items.append((LU[k][0], -g.area, k, g))
items.sort(key=lambda t: (t[0], t[1]))
print('landuse polygons', len(items), 'skipped in Shenzhen', nfor, collections.Counter(k for _, _, k, _ in items).most_common(30))
# building density (for the wild / urban split of unmapped land)
bc = np.zeros((int(np.ceil(2*HALF/300)) + 1, int(np.ceil(2*HALF/300)) + 1), np.float32)       # 300 m cells
BLD = pickle.load(open(OUT + 'raw_bld.pkl', 'rb'))
for oid, fway, t, wk in BLD:
    g = shapely.wkb.loads(wk); c = g.centroid; x, y = w(c.x, c.y)
    i = int((x + HALF)/300); j = int((y + HALF)/300)
    if 0 <= i < bc.shape[1] and 0 <= j < bc.shape[0]: bc[j, i] += 1
bcs = ndi.uniform_filter(bc, 3)
del BLD, AREAS
import gc; gc.collect()
img = Image.new('RGB', (TX, TX), (0, 0, 0)); dr = ImageDraw.Draw(img)
def P(c): return [((x + HALF)/RES, (HALF - y)/RES) for x, y in c]
def fill(g, rgb, outline=None):
    for p in polys_of(g):
        if len(p.exterior.coords) < 3: continue
        dr.polygon(P(p.exterior.coords), fill=rgb, outline=outline)
        for h in p.interiors: dr.polygon(P(h.coords), fill=None)
# sea: depth shading from the distance to land
d = np.clip(dland.astype(np.float32)/2500.0, 0, 1)**0.6
seac = np.stack([132 - 40*d, 168 - 36*d, 182 - 28*d], -1).astype(np.uint8)
img.paste(Image.fromarray(seac[::-1]).resize((TX, TX), Image.BILINEAR))
# land base: urban beige where there are buildings, dry golden grass / chaparral in the empty hills (by elevation and slope)
H = T2['H']; TB = 4096
Hz = ndi.zoom(H, TB/H.shape[0], order=1)[:TB, :TB]
dens = ndi.zoom(bcs, TB/bcs.shape[0], order=1)[:TB, :TB]
gy, gx = np.gradient(H, TS); slope = ndi.zoom(np.hypot(gx, gy), TB/H.shape[0], order=1)[:TB, :TB]
urban = np.clip(dens/18.0, 0, 1)
wild = np.clip(0.55 + np.clip((slope - 0.06)/0.12, 0, 1)*0.4 - urban*1.6, 0, 1).astype(np.float32)
del Hz, dens
noise = ndi.zoom(np.random.default_rng(7).random((256, 256)).astype(np.float32), TB/256, order=1)[:TB, :TB]
chap = (np.clip((slope - 0.18)/0.2, 0, 1)*np.clip(noise*1.6 - 0.3, 0, 1)).astype(np.float32)
del slope, noise
col = np.zeros((TB, TB, 3), np.uint8)
for c, (u, gw, gc_) in enumerate(zip((222, 219, 211), (152, 172, 118), (104, 134, 88))):
    col[..., c] = np.clip(u*(1 - wild) + (gw*(1 - chap) + gc_*chap)*wild, 0, 255).astype(np.uint8)
col = col[::-1]
landimg = Image.fromarray(col).resize((TX, TX), Image.BILINEAR)
del col
lm = Image.fromarray((land12[::-1]*255).astype(np.uint8)).resize((TX, TX), Image.NEAREST)
img.paste(landimg, (0, 0), lm)
# Shenzhen (context land): muted
fimg = Image.fromarray((frm12[::-1]*255).astype(np.uint8)).resize((TX, TX), Image.NEAREST)
mut = Image.blend(img, Image.new('RGB', (TX, TX), (210, 207, 198)), 0.6)
img.paste(mut, (0, 0), fimg); del mut, fimg
for pr, na, k, g in items:
    rgb = LU[k][1]
    if FORP.contains(g.representative_point()): rgb = tuple(int(v*0.4 + m*0.6) for v, m in zip(rgb, (210, 207, 198)))
    fill(g, rgb, outline=(236, 240, 228) if k == 'pitch' else None)
# water: bodies, salt ponds (each pond its own brine colour), pools, streams
SALT = [(196, 124, 132), (204, 150, 116), (150, 170, 140), (186, 110, 120), (172, 160, 118), (128, 160, 150)]
r = np.random.default_rng(3)
for p, g in L['fresh_list']:
    fill(g, SALT[int(r.integers(len(SALT)))] if p['kind'] == 'salt_pond' else (118, 158, 176))
for g in L['pools']: fill(g, (118, 190, 222))
WW = {'river':12, 'canal':9, 'drain':4, 'stream':3}
for p, g in L['wlines']:
    wd = WW.get(p['kind'], 3)
    if g.geom_type != 'LineString': continue
    dr.line(P(g.coords), fill=(118, 158, 176), width=max(1, int(round(wd/RES))))
# gbareal: also the full 8192 px texture (15.4 m/px, Hong Kong's 13.7 m/px class) for the sharp-ground option (b3c_ground8k.py bakes its roofs)
o8 = ImageEnhance.Brightness(ImageEnhance.Color(img).enhance(1.25)).enhance(0.9); o8.save(OUT + 'ground8k_base.webp', quality=92, method=4); del o8
out = img.resize((4096, 4096), Image.LANCZOS)
out = ImageEnhance.Color(out).enhance(1.25); out = ImageEnhance.Brightness(out).enhance(0.9)
out.save(OUT + 'ground.webp', quality=90, method=6)
out.resize((1200, 1200), Image.LANCZOS).save(OUT + 'prev_ground.png')
c0 = int((w(114.14, 0)[0] + HALF)/RES); c1 = int((w(114.24, 0)[0] + HALF)/RES); r0 = int((HALF - w(0, 22.34)[1])/RES); r1 = int((HALF - w(0, 22.27)[1])/RES)
img.crop((int((w(114.00, 0)[0] + HALF)/RES), int((HALF - w(0, 22.58)[1])/RES), int((w(114.12, 0)[0] + HALF)/RES), int((HALF - w(0, 22.50)[1])/RES))).save(OUT + 'prev_ground_ft.png')
img.crop((c0, r0, c1, r1)).resize((1000, int(1000*(r1 - r0)/(c1 - c0)))).save(OUT + 'prev_ground_kln.png')
print('texture done')
# ---------- engine rasters at CELL (row 0 = south) ----------
def down(mask): return ndi.zoom(mask.astype(np.float32), N/mask.shape[0], order=1)
codes = np.zeros((N, N), np.uint8)       # 0 land, 1 sea, 2 fresh water, 3 forest, 4 beach, 5 foreign (Shenzhen) land
fr_land = down(land12); fr_fw = down(fw12)
codes[(fr_land < 0.5) & (fr_fw <= 0.5)] = 1
codes[fr_fw > 0.5] = 2
codes[(codes == 0) & (down(frm12) > 0.5)] = 5
fo = np.asarray(raster([g for pr, na, k, g in items if k in ('forest', 'wood')], CELL)).astype(bool)
be = np.asarray(raster([g for pr, na, k, g in items if k in ('beach', 'sand')], CELL)).astype(bool)
codes[(codes == 0) & fo] = 3
codes[(codes == 0) & be] = 4
LC = {'residential':1, 'commercial':2, 'industrial':3, 'park':4, 'garden':4, 'recreation_ground':4, 'golf_course':4, 'zoo':4, 'grass':4, 'cemetery':4, 'village_green':4,
      'school':6, 'college':6, 'university':6, 'hospital':6, 'kindergarten':6, 'military':7, 'aerodrome':7}
luimg = Image.new('L', (N, N), 0)
for pr, na, k, g in items:
    if k in LC and not FORP.contains(g.representative_point()): raster([g], CELL, LC[k], luimg)
lu = np.asarray(luimg)
np.save(OUT + 'codes.npy', codes); np.save(OUT + 'lu.npy', lu)
print('codes', np.bincount(codes.ravel(), minlength=6), 'lu', np.bincount(lu.ravel(), minlength=8))
save(items, 'landuse.pkl')
import os
if os.path.exists(OUT + 'ground_base.webp'): os.remove(OUT + 'ground_base.webp')     # (b3b_speckle.py must start from this new texture)
