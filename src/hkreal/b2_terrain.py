# stage 2 (Hong Kong): real terrain from the AWS terrarium DEM (z12), water bodies and their levels, terrain vertices (TN x TN, TS m)
import sys, glob, os; sys.path.insert(0, '.')
from common import *
from raster import raster, arr
from scipy import ndimage as ndi
from PIL import Image
L = load('land.pkl')
# ---- DEM mosaic
Z = 12; X0t, X1t, Y0t, Y1t = 3342, 3350, 1783, 1790
mos = np.zeros(((Y1t - Y0t + 1)*256, (X1t - X0t + 1)*256), np.float32)
for f in glob.glob(BD + 'terrain/*.png'):
    _, x, y = os.path.basename(f)[:-4].split('_'); x, y = int(x), int(y)
    a = np.asarray(Image.open(f).convert('RGB')).astype(np.float32)
    mos[(y - Y0t)*256:(y - Y0t + 1)*256, (x - X0t)*256:(x - X0t + 1)*256] = a[..., 0]*256 + a[..., 1] + a[..., 2]/256 - 32768
print('dem range', mos.min(), mos.max())
# ---- Hong Kong: the DEM (SRTM-based here) carries the city's towers (Tsim Sha Tsui reads ~44 m, Wan Chai ~67 m, the airport
# platform ~19 m; the real ground is ~4-7 m). Bare-earth estimate: despike, then in built-up areas replace the surface by a grey
# opening over the land only (a flat ~740 m structuring element, lowering by at most 80 m: it removes bumps narrower than that and keeps planar slopes such as the Mid-Levels'),
# weighted by the building coverage (footprints from OSM), so the country parks' hills keep their real shape.
med = ndi.median_filter(mos, size=5)
bad = (mos < -60) | (mos > 1000) | (np.abs(mos - med) > 150)
mos = np.where(bad, med, mos); print('despiked', int(bad.sum()))
import shapely.wkb
from PIL import ImageDraw
SS = 256*2**Z
def mpx(lon, lat): return (lon + 180)/360*SS - X0t*256, (1 - np.log(np.tan(np.radians(lat)) + 1/np.cos(np.radians(lat)))/np.pi)/2*SS - Y0t*256
K = 4      # coverage raster at 1/4 DEM pixel
cov = Image.new('L', (mos.shape[1]*K, mos.shape[0]*K), 0); dc = ImageDraw.Draw(cov)
for oid, fway, t, wk in pickle.load(open(OUT + 'raw_bld.pkl', 'rb')):
    if 'building:part' in t and 'building' not in t: continue
    g = shapely.wkb.loads(wk)
    for p in (g.geoms if hasattr(g, 'geoms') else [g]):
        xs, ys = mpx(np.array(p.exterior.coords)[:, 0], np.array(p.exterior.coords)[:, 1])
        if len(xs) >= 3: dc.polygon(list(zip(xs*K, ys*K)), fill=255)
# the airport platform (Chek Lap Kok) counts as built: its terminals and the DEM noise over the flat reclamation
for oid, fway, t, wk in pickle.load(open(OUT + 'raw_areas.pkl', 'rb')):
    if t.get('aeroway') != 'aerodrome': continue
    g = shapely.wkb.loads(wk)
    for p in (g.geoms if hasattr(g, 'geoms') else [g]):
        xs, ys = mpx(np.array(p.exterior.coords)[:, 0], np.array(p.exterior.coords)[:, 1])
        if len(xs) >= 3: dc.polygon(list(zip(xs*K, ys*K)), fill=255)
cov = np.asarray(cov.resize(mos.shape[::-1], Image.BOX)).astype(np.float32)/255.0
covs = ndi.gaussian_filter(cov, 4)                       # ~140 m
wb = np.clip((covs - 0.05)/0.12, 0, 1)                    # 0 in the hills, 1 where >= 17 % of the ground is built
# land-only opening: the sea (≈ 0 m) must not pull the waterfront reclamations (4-7 m above the sea) down to the water
lm_ = Image.new('L', (mos.shape[1], mos.shape[0]), 0); dl = ImageDraw.Draw(lm_)
from raster import polys_of as _po
for p in _po(L['all']):
    cx, cy = np.array(p.exterior.coords).T; lo, la = ll(cx, cy); xs, ys = mpx(lo, la)
    if len(xs) >= 3: dl.polygon(list(zip(xs, ys)), fill=255)
    for h in p.interiors:
        cx, cy = np.array(h.coords).T; lo, la = ll(cx, cy); xs, ys = mpx(lo, la)
        if len(xs) >= 3: dl.polygon(list(zip(xs, ys)), fill=0)
lmk = np.asarray(lm_) > 0
ero = ndi.minimum_filter(np.where(lmk, mos, 1e4), size=(21, 21))
ero = np.where(ero >= 1e4, -1e4, ero)
op = ndi.maximum_filter(ero, size=(21, 21))
op = np.where(op <= -1e4 + 1, mos, op)
op = ndi.gaussian_filter(op, 1.5)
mos = mos - wb*np.minimum(80.0, np.maximum(0, mos - op))
print('urban DEM correction: max lowered %.1f m, built pixels %d' % (float((wb*1).max()), int((wb > 0.5).sum())))
def dem(lon, lat):
    S = 256*2**Z
    X = (lon + 180)/360*S - X0t*256
    Y = (1 - np.log(np.tan(np.radians(lat)) + 1/np.cos(np.radians(lat)))/np.pi)/2*S - Y0t*256
    return ndi.map_coordinates(mos, [Y - 0.5, X - 0.5], order=1, mode='nearest')
# ---- 12 m masks
R = 12; n = int(2*HALF/R)
land = arr(raster([L['all']], R)).astype(bool)
frm = arr(raster([L['foreign']], R)).astype(bool)
sig, flat = [], []
for p, g in L['fresh_list']:
    for q in (g.geoms if hasattr(g, 'geoms') else [g]):
        q = q.buffer(0)
        if q.is_empty: continue
        width = 2*q.area/max(1, q.length)
        (sig if (q.area > 3000 and width > 8) else flat).append(q)
fw = arr(raster(sig, R)).astype(bool) & land
land_nw = land & ~fw
lab, nl = ndi.label(fw)
print('bodies', nl, 'land km2 %.0f' % (land_nw.sum()*R*R/1e6))
# DEM at every 12 m pixel would be big: sample per body at its pixels (subsampled)
lvl = np.zeros(nl + 1, np.float32)
idx = ndi.find_objects(lab)
for k, sl in enumerate(idx, 1):
    if sl is None: continue
    m = lab[sl] == k; js, is_ = np.nonzero(m)
    st = max(1, len(js)//400); js = js[::st] + sl[0].start; is_ = is_[::st] + sl[1].start
    x = -HALF + (is_ + 0.5)*R; y = -HALF + (js + 0.5)*R
    lon, lat = ll(x, y); h = dem(lon, lat)
    lvl[k] = max(0.3, float(np.percentile(h, 30)) - 0.2)
# ---- terrain vertices
ii = np.arange(TN); X = -HALF + ii*TS
xs, ys = np.meshgrid(X, X)               # [j, i]
lon, lat = ll(xs, ys)
Hd = dem(lon.ravel(), lat.ravel()).reshape(TN, TN)
pi = np.clip(((xs + HALF)/R).astype(int), 0, n - 1); pj = np.clip(((ys + HALF)/R).astype(int), 0, n - 1)
water = ~land_nw
r = int(np.ceil(TS*1.2/R))
WL = np.where(fw, lvl[lab], 0.0).astype(np.float32)
wmin = ndi.minimum_filter(np.where(water, WL, 1e4).astype(np.float32), size=2*r + 1)
wany = ndi.maximum_filter(water.astype(np.uint8), size=2*r + 1).astype(bool)
lany = ndi.maximum_filter(land_nw.astype(np.uint8), size=2*r + 1).astype(bool)
dland = ndi.distance_transform_edt(~land_nw)*R
H = np.zeros((TN, TN), np.float32)
W_ = water[pj, pi]; WA = wany[pj, pi]; LA = lany[pj, pi]; FW_ = fw[pj, pi]
for j in range(TN):
    for i in range(TN):
        a, b = pj[j, i], pi[j, i]
        if W_[j, i] and not LA[j, i]:
            if FW_[j, i]: H[j, i] = WL[a, b] - 1.5 - 2.0*min(1.0, dland[a, b]/200.0)
            else: H[j, i] = max(-28.0, min(-1.6, Hd[j, i])) if Hd[j, i] < 2 else -1.6 - min(1.0, dland[a, b]/800.0)*6   # (DEM voids: no pits)
        elif WA[j, i]:
            H[j, i] = wmin[a, b] - 0.3
        else:
            H[j, i] = max(0.2, min(1000.0, Hd[j, i]))
print('H range', H.min(), H.max(), 'peak at', np.unravel_index(H.argmax(), H.shape))
save({'H':H, 'lvl':lvl, 'nl':nl}, 'terrain.pkl')
np.save(OUT + 'lab12.npy', lab.astype(np.int32)); np.save(OUT + 'land12.npy', land_nw); np.save(OUT + 'frm12.npy', frm & land_nw); np.save(OUT + 'fw12.npy', fw); np.save(OUT + 'dland12.npy', dland.astype(np.float32))
save({'sig':sig, 'flat':flat, 'lvl':lvl.tolist()}, 'fresh.pkl')
hh = np.clip((H + 20)/(980)*255, 0, 255).astype(np.uint8)
Image.fromarray(hh[::-1]).resize((800, 800)).save(OUT + 'prev_H.png')
