# stage 2: real terrain from the AWS terrarium DEM (z12), water bodies and their levels, terrain vertices (TN x TN, TS m)
import sys, glob, os; sys.path.insert(0, '.')
from common import *
from raster import raster, arr
from scipy import ndimage as ndi
from PIL import Image
L = load('land.pkl')
# ---- DEM mosaic
Z = 12; X0t, X1t, Y0t, Y1t = 3623, 3642, 1608, 1621
mos = np.zeros(((Y1t - Y0t + 1)*256, (X1t - X0t + 1)*256), np.float32)
for f in glob.glob(BD + 'terrain/*.png'):
    _, x, y = os.path.basename(f)[:-4].split('_'); x, y = int(x), int(y)
    a = np.asarray(Image.open(f).convert('RGB')).astype(np.float32)
    mos[(y - Y0t)*256:(y - Y0t + 1)*256, (x - X0t)*256:(x - X0t + 1)*256] = a[..., 0]*256 + a[..., 1] + a[..., 2]/256 - 32768
print('dem range', mos.min(), mos.max())
def dem(lon, lat):
    S = 256*2**Z
    X = (lon + 180)/360*S - X0t*256
    Y = (1 - np.log(np.tan(np.radians(lat)) + 1/np.cos(np.radians(lat)))/np.pi)/2*S - Y0t*256
    return ndi.map_coordinates(mos, [Y - 0.5, X - 0.5], order=1, mode='nearest')
# ---- 12 m masks
R = 12; n = int(2*HALF/R)
land = arr(raster([L['sg']], R)).astype(bool)
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
# Tokyo: the terrarium tiles here are a surface model (buildings and trees raise the city by 10-60 m: Odaiba reads 20-60 m, the
# Marunouchi towers' blocks 15-20 m). A grey opening over 630 m (9 x 9 vertices) removes everything narrower than that (buildings,
# stadiums, tree belts) and keeps the valleys and the plateaus (Yamanote, Musashino, the Tama Hills); then a light smoothing.
# Over land only (the sea's depths must not pull the coastal land down): below, once the masks exist.
pi = np.clip(((xs + HALF)/R).astype(int), 0, n - 1); pj = np.clip(((ys + HALF)/R).astype(int), 0, n - 1)
water = ~land_nw
r = int(np.ceil(TS*0.65/R))          # (Tokyo: a 48 m shore band; New York 84 m. The narrow piers and landfills of the bay stay above the water)
WL = np.where(fw, lvl[lab], 0.0).astype(np.float32)
wmin = ndi.minimum_filter(np.where(water, WL, 1e4).astype(np.float32), size=2*r + 1)
wany = ndi.maximum_filter(water.astype(np.uint8), size=2*r + 1).astype(bool)
lany = ndi.maximum_filter(land_nw.astype(np.uint8), size=2*r + 1).astype(bool)
dland = ndi.distance_transform_edt(~land_nw)*R
LV_ = land_nw[pj, pi]
_e = ndi.grey_erosion(np.where(LV_, Hd, 1e4).astype(np.float32), size=(9, 9))
_o = ndi.grey_dilation(np.where(LV_ & (_e < 9e3), _e, -1e4).astype(np.float32), size=(9, 9))
_o = np.where(LV_ & (_o > -9e3), _o, Hd)
_w = ndi.gaussian_filter(LV_.astype(np.float32), 1.2); _s = ndi.gaussian_filter(np.where(LV_, _o, 0).astype(np.float32), 1.2)
Hd = np.where(LV_, _s/np.maximum(_w, 1e-3), Hd).astype(np.float32)
del _e, _o, _w, _s
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
            H[j, i] = max(1.5, min(700.0, Hd[j, i]))          # (Tokyo: land >= 1.5 m beyond the shore band, clear of the sea surface)
print('H range', H.min(), H.max(), 'peak at', np.unravel_index(H.argmax(), H.shape))
save({'H':H, 'lvl':lvl, 'nl':nl}, 'terrain.pkl')
np.save(OUT + 'lab12.npy', lab.astype(np.int32)); np.save(OUT + 'land12.npy', land_nw); np.save(OUT + 'fw12.npy', fw); np.save(OUT + 'dland12.npy', dland.astype(np.float32))
save({'sig':sig, 'flat':flat, 'lvl':lvl.tolist()}, 'fresh.pkl')
hh = np.clip((H + 20)/(140)*255, 0, 255).astype(np.uint8)
Image.fromarray(hh[::-1]).resize((800, 800)).save(OUT + 'prev_H.png')
