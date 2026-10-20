# stage 2: 10 m masks, water bodies and levels, terrain heights (TN x TN, TS m)
import sys; sys.path.insert(0, '.')
from common import *
from raster import raster, arr
from scipy import ndimage as ndi
from shapely.geometry import Polygon
L = load('land.pkl')
R = 10; n = int(2*HALF/R)
sgm = arr(raster([L['sg']], R)).astype(bool)
frm = arr(raster([L['foreign']], R)).astype(bool)
# extend beyond the source data (lat 1.143–1.483): copy the edge rows outward (Johor to the north, Batam to the south)
lat_lo, lat_hi = 1.1435, 1.4825
j_lo = int((w(0, lat_lo)[1] + HALF)/R) + 1; j_hi = int((w(0, lat_hi)[1] + HALF)/R) - 1
frm[j_hi:, :] = True                                    # Johor mainland beyond the data
south = np.repeat(frm[j_lo:j_lo+1, :], j_lo, axis=0)
south = ndi.binary_opening(south, structure=np.ones((1, 151), bool))   # only wide land (Batam) continues south
frm[:j_lo, :] |= south
print('data rows', j_lo, j_hi, 'of', n)
# significant fresh water bodies take part in the terrain; tiny ponds and narrow drains are drawn flat later
sig, flat = [], []
for p, g in L['fresh_list']:
    for q in (g.geoms if hasattr(g, 'geoms') else [g]):
        q = q.buffer(0)
        if q.is_empty: continue
        width = 2*q.area/max(1, q.length)
        (sig if (q.area > 3000 and width > 7) else flat).append(q)
fw = arr(raster(sig, R)).astype(bool) & (sgm | frm)
land = (sgm | frm) & ~fw
sea = ~(sgm | frm)
print('sig fresh', len(sig), 'flat', len(flat), 'land %.0f km2' % (land.sum()*R*R/1e6))
# water body labels and levels
lab, nl = ndi.label(fw)
dcoast = ndi.distance_transform_edt(land)*R          # metres from any water (inside land)
dland = ndi.distance_transform_edt(~land)*R          # metres from land (inside water)
# base land heights (before hills): low, rising gently inland
ys, xs = np.mgrid[0:n, 0:n]
def sm(a, b, x): t = np.clip((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t)
rng = np.random.default_rng(1965)
def vnoise(scale, seed):
    g = np.random.default_rng(seed).random((n//scale + 3, n//scale + 3)).astype(np.float32)
    return ndi.zoom(g, scale, order=3)[:n, :n]
noise = (vnoise(150, 1) - 0.5)*1.0 + (vnoise(40, 2) - 0.5)*0.35
base = 1.8 + 2.2*sm(0, 150, dcoast) + 7.0*sm(150, 2600, dcoast) + 6.0*noise*sm(150, 1200, dcoast)
# hills: (lat, lon, height, radius m)
HILLS = [[1.3546, 103.7764, 148, 620], [1.3590, 103.7520, 118, 480], [1.3505, 103.7610, 55, 520], [1.3790, 103.7640, 40, 700],
  [1.3650, 103.8100, 40, 2500], [1.3840, 103.8150, 25, 1800], [1.2930, 103.7740, 42, 420], [1.2905, 103.7800, 46, 380], [1.2865, 103.7875, 42, 420],
  [1.2717, 103.8197, 92, 360], [1.2770, 103.8110, 62, 400], [1.2553, 103.8172, 52, 280], [1.2943, 103.8458, 36, 220], [1.3150, 103.8150, 18, 900],
  [1.3470, 103.6820, 22, 900], [1.3600, 103.6900, 45, 2000], [1.4120, 103.7880, 38, 1500], [1.3300, 103.7950, 20, 1200], [1.3370, 103.7780, 22, 700],
  [1.3980, 103.7050, 45, 1600], [1.4200, 103.7150, 35, 1300], [1.3900, 103.7350, 40, 1100], [1.4000, 103.6750, 30, 1400],   # Lim Chu Kang / Tengah / western catchment
  [1.4110, 103.9600, 60, 700], [1.4130, 103.9800, 30, 600], [1.4000, 104.0450, 45, 900], [1.3850, 104.0650, 50, 800],     # Pulau Ubin, Tekong
  [1.3700, 103.8700, 12, 1500], [1.3550, 103.9000, 10, 1800], [1.3300, 103.9300, 12, 1500], [1.3850, 103.8450, 18, 900],   # gentle rises in the east and north-east
  [1.2590, 103.8102, 32, 220], [1.3090, 103.8380, 20, 400], [1.3020, 103.8480, 20, 250],        # Sentosa (Imbiah, Siloso), Mount Elizabeth, Fort Canning area
  [1.2760, 103.8330, 25, 300], [1.2860, 103.8380, 18, 220], [1.3200, 103.7620, 25, 700], [1.3330, 103.7470, 25, 600]]       # Telok Blangah, Pearl's Hill, Clementi / Bukit Batok rises
hl = np.zeros((n, n), np.float32)
for la, lo, hh, rr in HILLS:
    x, y = w(lo, la); ci, cj = (x + HALF)/R, (y + HALF)/R; k = int(rr*3/R)
    i0, i1, j0, j1 = max(0, int(ci) - k), min(n, int(ci) + k), max(0, int(cj) - k), min(n, int(cj) + k)
    gx = (np.arange(i0, i1) - ci)*R; gy = (np.arange(j0, j1) - cj)*R
    hl[j0:j1, i0:i1] += hh*np.exp(-(gx[None, :]**2 + gy[:, None]**2)/(rr*rr))
base = base + hl*(1 + 0.22*((vnoise(38, 3) - 0.5)*2)) * sm(0, 120, dcoast)
base = np.where(land, base, 0).astype(np.float32)
# level of each significant fresh water body: 10th percentile of the bank heights, a little below
ring = ndi.binary_dilation(fw, iterations=3) & land
lvl = np.zeros(nl + 1, np.float32)
bank_lab = ndi.grey_dilation(lab, size=7)
for k in range(1, nl + 1):
    m = ring & (bank_lab == k)
    v = base[m]
    lvl[k] = max(0.0, (np.percentile(v, 10) if v.size else 0.0) - 0.6)
WL = np.where(fw, lvl[lab], 0.0).astype(np.float32)          # water level per water pixel (sea = 0)
# terrain vertices
H = np.zeros((TN, TN), np.float32)
water = ~land
# nearest-water level map for land pixels near water (to set the band level)
idx = ndi.distance_transform_edt(land, return_distances=False, return_indices=True)
WLn = WL[idx[0], idx[1]]
r = int(np.ceil(TS*1.5/R))
wmin = ndi.minimum_filter(np.where(water, WL, 1e4).astype(np.float32), size=2*r + 1)   # lowest water level within the band radius
wany = ndi.maximum_filter(water.astype(np.uint8), size=2*r + 1).astype(bool)
lany = ndi.maximum_filter(land.astype(np.uint8), size=2*r + 1).astype(bool)
for tj in range(TN):
    for ti in range(TN):
        x = -HALF + ti*TS; y = -HALF + tj*TS
        i = min(n - 1, max(0, int((x + HALF)/R))); j = min(n - 1, max(0, int((y + HALF)/R)))
        if water[j, i] and not lany[j, i]:
            d = dland[j, i]
            H[tj, ti] = WL[j, i] - (2.0 + 14.0*min(1.0, d/1500.0)**0.7) if not fw[j, i] else WL[j, i] - 1.5 - 2.0*min(1.0, d/200.0)
        elif wany[j, i]:
            H[tj, ti] = wmin[j, i] - 0.3
        else:
            H[tj, ti] = base[j, i]
print('H range', H.min(), H.max())
save({'H':H, 'lvl':lvl, 'nl':nl}, 'terrain.pkl')
np.save(OUT + 'lab10.npy', lab.astype(np.int32)); np.save(OUT + 'sea10.npy', sea); np.save(OUT + 'sg10.npy', sgm); np.save(OUT + 'for10.npy', frm); np.save(OUT + 'fw10.npy', fw)
np.save(OUT + 'base10.npy', base); np.save(OUT + 'dland10.npy', dland.astype(np.float32))
save({'sig':sig, 'flat':flat, 'lvl':lvl.tolist()}, 'fresh.pkl')
# preview
from PIL import Image
img = np.zeros((n, n, 3), np.uint8)
img[sea] = (120, 160, 185); img[frm & ~fw] = (200, 196, 186); img[sgm & ~fw] = (225, 220, 205); img[fw] = (90, 150, 200)
Image.fromarray(img[::-1][::4, ::4]).save(OUT + 'prev_land.png')
hh = np.clip((H + 20)/80*255, 0, 255).astype(np.uint8)
Image.fromarray(hh[::-1]).resize((800, 800)).save(OUT + 'prev_H.png')
