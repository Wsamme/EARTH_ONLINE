# stage 3 (Tokyo): ground texture (Kantō palette: green parks, shrine woods and hills, paddy / farm fields, grey-beige city) and the engine rasters at CELL
import sys, collections; sys.path.insert(0, '.')
from common import *
from raster import raster, polys_of
from PIL import Image, ImageDraw, ImageEnhance
from scipy import ndimage as ndi
import shapely.wkb
AREAS = pickle.load(open(OUT + 'raw_areas.pkl', 'rb'))
L = load('land.pkl'); F = load('fresh.pkl'); T2 = load('terrain.pkl')
land12 = np.load(OUT + 'land12.npy'); fw12 = np.load(OUT + 'fw12.npy'); dland = np.load(OUT + 'dland12.npy')
n12 = land12.shape[0]
TX = 8192; RES = 2*HALF/TX
def kind_of(t):
    if t.get('boundary') in ('protected_area', 'national_park') or t.get('leisure') == 'nature_reserve': return 'protected_area'
    for k in ('aeroway', 'amenity', 'leisure', 'tourism', 'natural', 'landuse', 'man_made'):
        v = t.get(k)
        if v: return {'retail':'commercial', 'education':'school', 'farmyard':'farmland', 'plant_nursery':'farmland', 'greenhouse_horticulture':'farmland', 'flowerbed':'garden',
                      'schoolyard':'school', 'rice':'paddy', 'paddy':'paddy', 'common':'park', 'parklet':'park', 'theme_park':'zoo', 'apron':'apron', 'runway':'apron', 'taxiway':'apron', 'marina':'pier'}.get(v, v)
    return None
LU = {  # kind: (priority, rgb)
 'residential':(1,(229,223,210)), 'commercial':(1,(232,220,210)), 'industrial':(1,(219,215,221)), 'military':(1,(214,212,198)), 'aerodrome':(1,(214,214,205)), 'apron':(3,(196,196,192)),
 'school':(2,(233,222,199)), 'college':(2,(233,222,199)), 'university':(2,(233,222,199)), 'kindergarten':(3,(233,222,199)), 'hospital':(2,(236,214,210)), 'institutional':(2,(230,220,206)),
 'religious':(2,(230,220,206)), 'railway':(2,(212,205,192)), 'construction':(2,(222,212,190)), 'brownfield':(2,(214,204,184)), 'quarry':(3,(205,195,178)), 'landfill':(3,(196,190,170)),
 'cemetery':(3,(175,196,150)), 'farmland':(3,(196,204,150)), 'paddy':(3,(170,196,138)), 'orchard':(3,(170,186,128)), 'vineyard':(3,(186,184,128)), 'allotments':(3,(196,206,150)), 'parking':(3,(214,212,206)),
 'park':(4,(176,202,142)), 'garden':(4,(172,202,140)), 'recreation_ground':(4,(182,206,150)), 'village_green':(4,(182,206,150)), 'dog_park':(5,(190,206,152)), 'zoo':(4,(176,200,146)),
 'golf_course':(4,(160,198,128)), 'grass':(5,(184,204,150)), 'meadow':(5,(186,202,146)), 'grassland':(5,(184,198,144)), 'heath':(5,(176,186,138)),
 'forest':(6,(104,136,90)), 'wood':(6,(116,146,96)), 'protected_area':(4,(174,192,142)), 'scrub':(6,(140,160,108)), 'shrubbery':(7,(150,170,120)), 'wetland':(6,(156,168,126)),
 'sand':(7,(236,222,182)), 'beach':(7,(238,226,190)), 'bare_rock':(7,(196,188,172)), 'scree':(7,(196,188,172)), 'mud':(6,(170,160,140)), 'shingle':(7,(200,192,176)),
 'pitch':(8,(140,186,112)), 'track':(8,(196,128,100)), 'playground':(8,(221,205,170)), 'stadium':(7,(210,206,196)), 'sports_centre':(7,(214,210,200)),
 'pedestrian':(8,(222,214,199)), 'platform':(8,(206,201,190)), 'pier':(8,(200,194,182))}
from shapely.prepared import prep
LANDB = L['sg'].buffer(15)
items = []
for oid, fway, t, wk in AREAS:
    k = kind_of(t)
    if k not in LU: continue
    if k == 'parking' and t.get('parking') in ('underground', 'multi-storey'): continue
    g = proj(shapely.wkb.loads(wk))
    if g.is_empty: continue
    if k in ('protected_area', 'wetland', 'mud', 'beach', 'sand', 'military', 'aerodrome', 'meadow', 'grassland', 'scrub', 'wood'):
        g = g.buffer(0).intersection(LANDB)
        if g.is_empty: continue
    items.append((LU[k][0], -g.area, k, g))
items.sort(key=lambda t: (t[0], t[1]))
print('landuse polygons', len(items), collections.Counter(k for _, _, k, _ in items).most_common(30))
# building density (for the wild / urban split of unmapped land)
bc = np.zeros((n12//25 + 1, n12//25 + 1), np.float32)       # 300 m cells
_Z = np.load(OUT + 'bld_raw.npz'); _p = _Z['XY'][_Z['RS'][_Z['BR'][:-1]]]          # first vertex of every building
_i = ((_p[:, 0] + HALF)/300).astype(int); _j = ((_p[:, 1] + HALF)/300).astype(int); _k = (_i >= 0) & (_j >= 0) & (_i < bc.shape[1]) & (_j < bc.shape[0])
np.add.at(bc, (_j[_k], _i[_k]), 1); del _Z, _p, _i, _j, _k
bcs = ndi.uniform_filter(bc, 3)/2.0          # (Tokyo's footprints are about half the size of New York's: same urban threshold)
del AREAS
import gc; gc.collect()
img = Image.new('RGB', (TX, TX), (0, 0, 0)); dr = ImageDraw.Draw(img)
def P(c): return [((x + HALF)/RES, (HALF - y)/RES) for x, y in c]
def fill(g, rgb, outline=None):
    for p in polys_of(g):
        if len(p.exterior.coords) < 3: continue
        dr.polygon(P(p.exterior.coords), fill=rgb, outline=outline)
        for h in p.interiors: dr.polygon(P(h.coords), fill=None)
# sea: depth shading from the distance to land
d = np.clip(dland/2500.0, 0, 1)**0.6
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
for c, (u, gw, gc_) in enumerate(zip((222, 219, 211), (170, 184, 136), (124, 146, 100))):
    col[..., c] = np.clip(u*(1 - wild) + (gw*(1 - chap) + gc_*chap)*wild, 0, 255).astype(np.uint8)
col = col[::-1]
landimg = Image.fromarray(col).resize((TX, TX), Image.BILINEAR)
del col
lm = Image.fromarray((land12[::-1]*255).astype(np.uint8)).resize((TX, TX), Image.NEAREST)
img.paste(landimg, (0, 0), lm)
for pr, na, k, g in items:
    fill(g, LU[k][1], outline=(236, 240, 228) if k == 'pitch' else None)
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
out = img.resize((4096, 4096), Image.LANCZOS)
out = ImageEnhance.Color(out).enhance(1.25); out = ImageEnhance.Brightness(out).enhance(0.9)
out.save(OUT + 'ground.webp', quality=90, method=6)
out.resize((1200, 1200), Image.LANCZOS).save(OUT + 'prev_ground.png')
c0 = int((w(139.68, 0)[0] + HALF)/RES); c1 = int((w(139.83, 0)[0] + HALF)/RES); r0 = int((HALF - w(0, 35.73)[1])/RES); r1 = int((HALF - w(0, 35.62)[1])/RES)
img.crop((c0, r0, c1, r1)).resize((1000, int(1000*(r1 - r0)/(c1 - c0)))).save(OUT + 'prev_ground_tyo.png')
print('texture done')
# ---------- engine rasters at CELL (row 0 = south) ----------
def down(mask): return ndi.zoom(mask.astype(np.float32), N/mask.shape[0], order=1)
codes = np.zeros((N, N), np.uint8)       # 0 land, 1 sea, 2 fresh water, 3 forest, 4 beach
fr_land = down(land12); fr_fw = down(fw12)
codes[(fr_land < 0.5) & (fr_fw <= 0.5)] = 1
codes[fr_fw > 0.5] = 2
fo = np.asarray(raster([g for pr, na, k, g in items if k in ('forest', 'wood')], CELL)).astype(bool)
be = np.asarray(raster([g for pr, na, k, g in items if k in ('beach', 'sand')], CELL)).astype(bool)
codes[(codes == 0) & fo] = 3
codes[(codes == 0) & be] = 4
LC = {'residential':1, 'commercial':2, 'industrial':3, 'park':4, 'garden':4, 'recreation_ground':4, 'golf_course':4, 'zoo':4, 'grass':4, 'cemetery':4, 'village_green':4,
      'school':6, 'college':6, 'university':6, 'hospital':6, 'kindergarten':6, 'military':7, 'aerodrome':7}
luimg = Image.new('L', (N, N), 0)
for pr, na, k, g in items:
    if k in LC: raster([g], CELL, LC[k], luimg)
lu = np.asarray(luimg)
np.save(OUT + 'codes.npy', codes); np.save(OUT + 'lu.npy', lu)
print('codes', np.bincount(codes.ravel(), minlength=6), 'lu', np.bincount(lu.ravel(), minlength=8))
save(items, 'landuse.pkl')
