# stage 2 (gbareal): terrain from the AWS terrarium DEM (z12), water bodies and their levels, terrain vertices (TN x TN, TS m), the 25 m
# land / water rasters (Hong Kong used 12 m; 5040^2 px here).
# DEM: SC/gbadata/terrain (z12 x 3338-3353, y 1775-1790, 256 tiles; the 72 Hong Kong tiles are hard links to hkdata/terrain); the
# square needs x 3338-3352, y 1776-1790 (225 tiles), all present. The fallback below (a FLAT PLACEHOLDER: land 3.0 m, water 2.0 m,
# blended over 700 m; terrain.pkl 'demok' / base json 'demGap') only acts where a tile is missing - none now.
import sys, glob, os; sys.path.insert(0, '.')
from common import *
from raster import raster, arr
from scipy import ndimage as ndi
from PIL import Image, ImageDraw
L = load('land.pkl')
Z = 12; X0t, X1t, Y0t, Y1t = 3338, 3352, 1776, 1790
NX, NY = (X1t - X0t + 1)*256, (Y1t - Y0t + 1)*256
mos = np.zeros((NY, NX), np.float32); ok = np.zeros((NY, NX), bool); nt = 0
for f in glob.glob(ROOT + 'gbadata/terrain/*.png'):
    _, x, y = os.path.basename(f)[:-4].split('_'); x, y = int(x), int(y)
    if not (X0t <= x <= X1t and Y0t <= y <= Y1t): continue
    a = np.asarray(Image.open(f).convert('RGB')).astype(np.float32)
    mos[(y - Y0t)*256:(y - Y0t + 1)*256, (x - X0t)*256:(x - X0t + 1)*256] = a[..., 0]*256 + a[..., 1] + a[..., 2]/256 - 32768
    ok[(y - Y0t)*256:(y - Y0t + 1)*256, (x - X0t)*256:(x - X0t + 1)*256] = True; nt += 1
print('DEM tiles on disk in the square', nt, 'of', (X1t - X0t + 1)*(Y1t - Y0t + 1), 'range', mos[ok].min(), mos[ok].max(), flush=True)
med = ndi.median_filter(mos, size=5)
bad = ok & ((mos < -60) | (mos > 1000) | (np.abs(mos - med) > 150))
mos = np.where(bad, med, mos); print('despiked', int(bad.sum()), flush=True); del med
import shapely.wkb
SS = 256*2**Z
def mpx(lon, lat): return (lon + 180)/360*SS - X0t*256, (1 - np.log(np.tan(np.radians(lat)) + 1/np.cos(np.radians(lat)))/np.pi)/2*SS - Y0t*256
# urban DEM correction (as Hong Kong: the SRTM-based DEM carries the towers): building coverage at 1/2 DEM pixel
K = 2
cov = Image.new('L', (NX*K, NY*K), 0); dc = ImageDraw.Draw(cov)
for oid, fway, t, wk in pickle.load(open(OUT + 'raw_bld.pkl', 'rb')):
    if 'building:part' in t and 'building' not in t: continue
    g = shapely.wkb.loads(wk)
    for p in (g.geoms if hasattr(g, 'geoms') else [g]):
        xs, ys = mpx(np.array(p.exterior.coords)[:, 0], np.array(p.exterior.coords)[:, 1])
        if len(xs) >= 3: dc.polygon(list(zip(xs*K, ys*K)), fill=255)
for oid, fway, t, wk in pickle.load(open(OUT + 'raw_areas.pkl', 'rb')):
    if t.get('aeroway') != 'aerodrome': continue
    g = shapely.wkb.loads(wk)
    for p in (g.geoms if hasattr(g, 'geoms') else [g]):
        xs, ys = mpx(np.array(p.exterior.coords)[:, 0], np.array(p.exterior.coords)[:, 1])
        if len(xs) >= 3: dc.polygon(list(zip(xs*K, ys*K)), fill=255)
cov = np.asarray(cov.resize((NX, NY), Image.BOX)).astype(np.float32)/255.0
wb = np.clip((ndi.gaussian_filter(cov, 4) - 0.05)/0.12, 0, 1); del cov
lm_ = Image.new('L', (NX, NY), 0); dl = ImageDraw.Draw(lm_)
from raster import polys_of as _po
for p in _po(L['all']):
    cx, cy = np.array(p.exterior.coords).T; lo, la = ll(cx, cy); xs, ys = mpx(lo, la)
    if len(xs) >= 3: dl.polygon(list(zip(xs, ys)), fill=255)
    for h in p.interiors:
        cx, cy = np.array(h.coords).T; lo, la = ll(cx, cy); xs, ys = mpx(lo, la)
        if len(xs) >= 3: dl.polygon(list(zip(xs, ys)), fill=0)
lmk = np.asarray(lm_) > 0; del lm_
ero = ndi.minimum_filter(np.where(lmk & ok, mos, 1e4), size=(21, 21))
ero = np.where(ero >= 1e4, -1e4, ero)
op = ndi.maximum_filter(ero, size=(21, 21)); del ero
op = np.where(op <= -1e4 + 1, mos, op)
op = ndi.gaussian_filter(op, 1.5)
mos = np.where(ok, mos - wb*np.minimum(80.0, np.maximum(0, mos - op)), 0).astype(np.float32); del op, wb
print('urban DEM correction done', flush=True)
# the placeholder: distance (DEM px ~ 35 m) into the missing area, for the 700 m blend
dmiss = ndi.distance_transform_edt(~ok).astype(np.float32)
near = ndi.distance_transform_edt(~ok, return_distances=False, return_indices=True)
mosf = mos[near[0], near[1]]; del near                       # nearest valid height (for the blend only)
def sample(A, lon, lat, order=1):
    X, Y = mpx(lon, lat); return ndi.map_coordinates(A, [Y - 0.5, X - 0.5], order=order, mode='nearest')
def dem(lon, lat): return sample(mos, lon, lat)
def demok(lon, lat): return sample(ok.astype(np.float32), lon, lat) > 0.999
# ---- 25 m masks (Hong Kong: 12 m)
R = R12; n = int(2*HALF/R)
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
land_nw = land & ~fw; del land
lab, nl = ndi.label(fw)
print('bodies', nl, 'land km2 %.0f' % (land_nw.sum()*R*R/1e6), flush=True)
PH_LAND, PH_WATER = 3.0, 2.0
lvl = np.zeros(nl + 1, np.float32); lvl_ph = np.zeros(nl + 1, bool)
for k, sl in enumerate(ndi.find_objects(lab), 1):
    if sl is None: continue
    m = lab[sl] == k; js, is_ = np.nonzero(m)
    st = max(1, len(js)//400); js = js[::st] + sl[0].start; is_ = is_[::st] + sl[1].start
    x = -HALF + (is_ + 0.5)*R; y = -HALF + (js + 0.5)*R
    lon, lat = ll(x, y); h = dem(lon, lat); okk = demok(lon, lat)
    if okk.mean() >= 0.5: lvl[k] = max(0.3, float(np.percentile(h[okk], 30)) - 0.2)
    else: lvl[k] = PH_WATER; lvl_ph[k] = True
print('water bodies on the placeholder', int(lvl_ph.sum()), 'of', nl, flush=True)
# per fresh polygon: its level (b7 needs it; the 25 m label raster itself is not saved)
siglv = []
for q in sig:
    c = q.representative_point(); i = min(n - 1, max(0, int((c.x + HALF)/R))); j = min(n - 1, max(0, int((c.y + HALF)/R))); k = int(lab[j, i])
    siglv.append(round(float(lvl[k]) if k else 0.0, 2))
# ---- terrain vertices (vectorised)
X = -HALF + np.arange(TN)*TS
xs, ys = np.meshgrid(X, X)               # [j, i]
lon, lat = ll(xs, ys); lon = lon.ravel(); lat = lat.ravel()
Hd = dem(lon, lat).reshape(TN, TN); Hf = sample(mosf, lon, lat).reshape(TN, TN); Dm = sample(dmiss, lon, lat).reshape(TN, TN)*35.0
okv = Dm < 1.0                            # vertex on measured DEM
blend = np.clip(Dm/700.0, 0, 1)           # 0 at the edge of the measured DEM, 1 at 700 m inside the gap
del lon, lat
pi = np.clip(((xs + HALF)/R).astype(int), 0, n - 1); pj = np.clip(((ys + HALF)/R).astype(int), 0, n - 1)
water = ~land_nw
r = int(np.ceil(TS*1.2/R))
WL = np.where(fw, lvl[lab], 0.0).astype(np.float32); del lab
wmin = ndi.minimum_filter(np.where(water, WL, 1e4).astype(np.float32), size=2*r + 1)
wany = ndi.maximum_filter(water.astype(np.uint8), size=2*r + 1).astype(bool)
lany = ndi.maximum_filter(land_nw.astype(np.uint8), size=2*r + 1).astype(bool)
dland = (ndi.distance_transform_edt(~land_nw)*R).astype(np.float32)
W_ = water[pj, pi]; WA = wany[pj, pi]; LA = lany[pj, pi]; FW_ = fw[pj, pi]; DL = dland[pj, pi]; WLv = WL[pj, pi]; WM = wmin[pj, pi]
Hland = np.where(okv, Hd, Hf*(1 - blend) + PH_LAND*blend)            # measured, or the placeholder (blended near the measured edge)
Hsea = np.where(okv & (Hd < 2), np.clip(Hd, -28.0, -1.6), -1.6 - np.minimum(1.0, DL/800.0)*6)
H = np.where(W_ & ~LA, np.where(FW_, WLv - 1.5 - 2.0*np.minimum(1.0, DL/200.0), Hsea), np.where(WA, WM - 0.3, np.clip(Hland, 0.2, 1000.0))).astype(np.float32)
print('H range', H.min(), H.max(), 'peak at', np.unravel_index(H.argmax(), H.shape), 'vertices on measured DEM %.1f %%' % (100*okv.mean()), flush=True)
# the placeholder area as 2 km cells (for the app's note / overlay): a cell is a gap when < 50 % of its vertices are measured
c = TILE//TS
gap = []
for ty in range(TXN):
    for tx in range(TXN):
        blk = okv[int(ty*TILE/TS):int((ty + 1)*TILE/TS) + 1, int(tx*TILE/TS):int((tx + 1)*TILE/TS) + 1]
        if blk.mean() < 0.5: gap.append(ty*TXN + tx)
print('2 km cells on the placeholder', len(gap), 'of', TXN*TXN, flush=True)
save({'H':H, 'lvl':lvl, 'nl':nl, 'demok':okv, 'gapTiles':gap, 'ph':{'land':PH_LAND, 'water':PH_WATER, 'blend_m':700}}, 'terrain.pkl')
np.save(OUT + 'land12.npy', land_nw); np.save(OUT + 'frm12.npy', frm & land_nw); np.save(OUT + 'fw12.npy', fw); np.save(OUT + 'dland12.npy', dland.astype(np.float16))
save({'sig':sig, 'siglv':siglv, 'flat':flat, 'lvl':lvl.tolist()}, 'fresh.pkl')
hh = np.clip((H + 20)/(980)*255, 0, 255).astype(np.uint8)
im = Image.fromarray(hh[::-1]).convert('RGB').resize((900, 900)); a = np.asarray(im).copy()
gm = np.asarray(Image.fromarray((~okv[::-1]).astype(np.uint8)*255).resize((900, 900))) > 127
a[gm] = (a[gm]*0.6 + np.array([200, 60, 60])*0.4).astype(np.uint8)          # the placeholder tinted red in the preview
Image.fromarray(a).save(OUT + 'prev_H.png')
