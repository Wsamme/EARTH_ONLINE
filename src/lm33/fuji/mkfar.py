# fuji (v37): the land and sea around the Tokyo square out to Mount Fuji -> sgreal/site/tyodata/tyo_far.txt (gzip as base64).
# usage: python3 lm33/fuji/mkfar.py            (reads tyodata/terrain/12_x_y.png, x 3623-3642, y 1608-1621; optional out/cover_osm.npz
#        from far_osm.py: building vertices + OSM land-use masks of the Kanto extract)
# Projection (the Tokyo square's): x = (lon - 139.75)*90549.1, y = (lat - 35.66)*110952.7 (metres; three.js (x, h, -y)).
# Contents (little endian, after gzip):
#   'SGF1' | u32 n | n bytes JSON header | sections (offsets in header.sec, bytes from the start of the buffer):
#   H  int16 (NY+1)*(NX+1): heights in HU (0.25 m) on the R = 80 m grid from (GX0, GY0), row 0 = south, stored as residuals of the
#      predictor left + down - downleft (first row: left, first column: down); the square's inside is 0 (never drawn)
#   C  u8 4 layers * CNY*CNX on the 160 m cover grid (same origin): urban (0-255), water, forest, field (0/255 masks; OSM where the
#      Kanto extract has data, height / slope rules and the towns list elsewhere)
#   A  int16 (ANY+1)*(ANX+1) metres: the apron (5.6 km grid out to ~200 km: extrapolated land / sea, only to close the horizon)
#   L  u8 lake masks (per lake: nj*ni cells of the 80 m grid, 1 = water)
import sys, os, glob, math, json, struct, gzip, base64, time
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
D = SC + 'lm33/fuji/'; OUT = D + 'out/'; os.makedirs(OUT, exist_ok=True)
DST = SC + 'sgreal/site/tyodata/tyo_far.txt'
LON0, LAT0, MX, MY = 139.75, 35.66, 90549.1, 110952.7
HALF = 28000
R, GX0, GY0, NX, NY, CH = 80, -117600, -72800, 1960, 1540, 140      # 14 x 11 chunks of 11.2 km (140 cells); square = chunks (8..12, 4..8)
CR, CNX, CNY = 160, 980, 770
AR, AX0, AY0, ANX, ANY = 5600, -117600 - 16*5600, -72800 - 24*5600, 74, 74
HU = 0.25
t0 = time.time()
lonof = lambda x: LON0 + x/MX
latof = lambda y: LAT0 + y/MY
wx = lambda lon: (lon - LON0)*MX
wy = lambda lat: (lat - LAT0)*MY

# ---------------- DEM mosaic (AWS terrarium z12) ----------------
Z, X0t, X1t, Y0t, Y1t = 12, 3623, 3642, 1608, 1621
mos = np.zeros(((Y1t - Y0t + 1)*256, (X1t - X0t + 1)*256), np.float32)
nt = 0
for f in glob.glob(SC + 'tyodata/terrain/12_*.png'):
    _, x, y = os.path.basename(f)[:-4].split('_'); x, y = int(x), int(y)
    if not (X0t <= x <= X1t and Y0t <= y <= Y1t): continue
    a = np.asarray(Image.open(f).convert('RGB')).astype(np.float32)
    mos[(y - Y0t)*256:(y - Y0t + 1)*256, (x - X0t)*256:(x - X0t + 1)*256] = a[..., 0]*256 + a[..., 1] + a[..., 2]/256 - 32768
    nt += 1
assert nt == 280, nt
print('dem', nt, 'tiles, range', mos.min(), mos.max(), flush=True)
S = 256*2**Z
def mpx(lon, lat):
    X = (np.asarray(lon) + 180)/360*S - X0t*256
    la = np.radians(np.asarray(lat)); Y = (1 - np.log(np.tan(la) + 1/np.cos(la))/np.pi)/2*S - Y0t*256
    return X, Y
def pll(X, Y):
    lon = (X + X0t*256)/S*360 - 180; n = np.pi - 2*np.pi*(Y + Y0t*256)/S
    return lon, np.degrees(np.arctan(np.sinh(n)))
# despike: the tiles have a few hundred bad pixels (spikes, pits, short streaks) more than 60 m off their 5 x 5 median
_md = ndi.median_filter(mos, 5); _bad = np.abs(mos - _md) > 60
_bad = ndi.binary_dilation(_bad, iterations=1) & (np.abs(mos - _md) > 20)
print('despiked', int(_bad.sum()), 'pixels'); mos = np.where(_bad, _md, mos).astype(np.float32); del _md
mosS = ndi.gaussian_filter(mos, 0.9)          # ~31 m pixels -> the 80 m grid
def dem(lon, lat, src=None):
    X, Y = mpx(lon, lat)
    return ndi.map_coordinates(mosS if src is None else src, [Y - 0.5, X - 0.5], order=1, mode='nearest')
LONA, LONB = pll(0.5, 0)[0], pll(mos.shape[1] - 0.5, 0)[0]
LATA, LATB = pll(0, mos.shape[0] - 0.5)[1], pll(0, 0.5)[1]
print('data lon %.4f..%.4f lat %.4f..%.4f' % (LONA, LONB, LATA, LATB))

# ---------------- the 80 m grid ----------------
xs = GX0 + np.arange(NX + 1)*R; ys = GY0 + np.arange(NY + 1)*R
XX, YY = np.meshgrid(xs, ys)                  # [j, i]
LO, LA = lonof(XX), latof(YY)
valid = (LO >= LONA) & (LO <= LONB) & (LA >= LATA) & (LA <= LATB)
Hd = dem(LO.ravel(), LA.ravel()).reshape(XX.shape).astype(np.float32)
inside = (np.abs(XX) < HALF) & (np.abs(YY) < HALF)
print('grid', XX.shape, 'valid %.1f %%' % (100*valid.mean()), '%.0f s' % (time.time() - t0), flush=True)

# ---------------- Mount Fuji: the summit (Kengamine 3776 m; the 31 m DEM peaks at ~3754 m) ----------------
FUJI = (138.7274, 35.3606, 3776.0)
fx, fy = wx(FUJI[0]), wy(FUJI[1])
d = np.hypot(XX - fx, YY - fy); near = d < 2500
jm, im = np.unravel_index(np.argmax(np.where(near, Hd, -1e9)), Hd.shape)
pk = Hd[jm, im]; dpk = np.hypot(XX - XX[jm, im], YY - YY[jm, im])
Hd += np.where(dpk < 900, (FUJI[2] - pk)*np.exp(-(dpk/380)**2), 0).astype(np.float32)
print('fuji grid peak %.1f -> %.1f at %.0f, %.0f (summit %.0f, %.0f)' % (pk, Hd[jm, im], XX[jm, im], YY[jm, im], fx, fy))

# ---------------- sea: the terrarium tiles have no bathymetry here (sea = 0 m exactly): zero cells connected to the data border ----------------
z0 = mos <= 0.01
labm, n = ndi.label(z0)
bm = np.zeros(z0.shape, bool); bm[0, :] = bm[-1, :] = bm[:, 0] = bm[:, -1] = True
ids = set(np.unique(labm[bm])) - {0}
# Tokyo Bay (it reaches the square's edge, the data border is far): components that touch the square's south edge
qx, qy = mpx(lonof(np.linspace(-HALF, HALF, 400)), latof(np.full(400, -HALF - 200.0)))
ids |= set(np.unique(labm[np.clip(qy.astype(int), 0, z0.shape[0] - 1), np.clip(qx.astype(int), 0, z0.shape[1] - 1)])) - {0}
sizes = ndi.sum(np.ones(z0.shape, np.float32), labm, range(1, n + 1))
seaM = np.isin(labm, [k for k in ids if sizes[k - 1] > 2000])
del labm
Xg, Yg = mpx(LO.ravel(), LA.ravel())
seaF = ndi.map_coordinates(seaM.astype(np.float32), [Yg - 0.5, Xg - 0.5], order=1, mode='nearest').reshape(XX.shape)
sea = (seaF > 0.5) & valid
dco = ndi.distance_transform_edt(sea | ~valid)*R
print('sea %.0f km2, zero components %d' % (sea.sum()*R*R/1e6, n))
# ---------------- lakes (Fuji Five Lakes, Lake Ashi): flat DEM water at the DEM's own level ----------------
# seeds (lon, lat) inside each lake; the level is the DEM's (its water surface: the official levels are within ~1-4 m)
LAKES = [('河口湖', 'Lake Kawaguchi', 138.757, 35.517), ('山中湖', 'Lake Yamanaka', 138.870, 35.418), ('西湖', 'Lake Sai', 138.685, 35.497),
         ('精进湖', 'Lake Shōji', 138.607, 35.487), ('本栖湖', 'Lake Motosu', 138.588, 35.465), ('芦之湖', 'Lake Ashi', 139.010, 35.203)]
pxa = (math.cos(math.radians(35.4))*40075016/S)**2
lakes = []; lakeMask = np.zeros(Hd.shape, bool); Lsec = bytearray()
for zh, en, lon, lat in LAKES:
    X, Y = mpx(lon, lat); xi, yi = int(X), int(Y); w = 160
    sub = mos[yi - w:yi + w, xi - w:xi + w]
    win = np.round(mos[yi - 7:yi + 8, xi - 7:xi + 8]); v, c = np.unique(win, return_counts=True); lv = float(v[np.argmax(c)])
    m = np.abs(sub - lv) <= 2.0
    lb, _ = ndi.label(m)
    ids = set(np.unique(lb[w - 10:w + 10, w - 10:w + 10])) - {0}
    if not ids: print('lake not found', en); continue
    sz = {k: (lb == k).sum() for k in ids}
    keep = np.isin(lb, [k for k in ids if sz[k] > 30])
    keep = ndi.binary_closing(keep, iterations=2)
    keep = ndi.binary_dilation(keep, iterations=1) & (sub <= lv + 4)
    area = keep.sum()*pxa/1e6
    # to the 80 m grid: fraction of water around each vertex
    jj, ii = np.nonzero(keep); lo, la = pll(ii + xi - w + 0.5, jj + yi - w + 0.5)
    gx, gy = (wx(lo) - GX0)/R, (wy(la) - GY0)/R
    i0, i1, j0, j1 = int(gx.min()) - 2, int(gx.max()) + 3, int(gy.min()) - 2, int(gy.max()) + 3
    sx, sy = np.meshgrid(GX0 + np.arange(i0, i1 + 1)*R, GY0 + np.arange(j0, j1 + 1)*R)
    Xs, Ys = mpx(lonof(sx), latof(sy))
    fr = ndi.map_coordinates(ndi.gaussian_filter(keep.astype(np.float32), 0.8), [Ys - (yi - w) - 0.5, Xs - (xi - w) - 0.5], order=1, mode='constant')
    wm = fr > 0.35
    Hd[j0:j1 + 1, i0:i1 + 1] = np.where(wm, np.minimum(Hd[j0:j1 + 1, i0:i1 + 1], lv - 2.5 - 3.5*np.clip(fr - 0.35, 0, 1)), Hd[j0:j1 + 1, i0:i1 + 1])
    lakeMask[j0:j1 + 1, i0:i1 + 1] |= wm
    cell = ndi.binary_dilation(wm, iterations=1)[:-1, :-1] | ndi.binary_dilation(wm, iterations=1)[1:, 1:]   # cells (j0..j1-1, i0..i1-1)
    cj, ci = np.nonzero(wm); cx, cy = float(sx[wm].mean()), float(sy[wm].mean())
    k = np.argmin((sx[wm] - cx)**2 + (sy[wm] - cy)**2); lx, ly = float(sx[wm][k]), float(sy[wm][k])
    lakes.append({'zh':zh, 'en':en, 'lv':lv, 'i0':i0, 'j0':j0, 'ni':i1 - i0, 'nj':j1 - j0, 'off':len(Lsec), 'lx':round(lx), 'ly':round(ly), 'km2':round(area, 2)})
    Lsec += cell.astype(np.uint8).tobytes()
    print('lake %-16s level %.1f m, %.2f km2 (DEM), grid box %dx%d' % (en, lv, area, i1 - i0, j1 - j0))

# ---------------- land cover (160 m cells) ----------------
cxs = GX0 + (np.arange(CNX) + 0.5)*CR; cys = GY0 + (np.arange(CNY) + 0.5)*CR
CXX, CYY = np.meshgrid(cxs, cys)
Hc = Hd[::2, ::2][:CNY, :CNX]*0.25 + Hd[1::2, ::2][:CNY, :CNX]*0.25 + Hd[::2, 1::2][:CNY, :CNX]*0.25 + Hd[1::2, 1::2][:CNY, :CNX]*0.25
gyc, gxc = np.gradient(Hc, CR)
slope = np.hypot(gxc, gyc)
seaC = sea[::2, ::2][:CNY, :CNX] & sea[1::2, 1::2][:CNY, :CNX]
validC = valid[1::2, 1::2][:CNY, :CNX]
U = np.zeros((CNY, CNX), np.float32); Wt = np.zeros((CNY, CNX), np.float32); F = np.zeros((CNY, CNX), np.float32); G = np.zeros((CNY, CNX), np.float32)
osm = None
if os.path.exists(OUT + 'cover_osm.npz'):
    osm = np.load(OUT + 'cover_osm.npz'); print('osm cover: bld nodes', int(osm['bld'].sum()))
if osm is not None:
    bld = osm['bld'].astype(np.float32)
    # urban: building vertices per 160 m cell (a dense Tokyo suburb has ~1500-3000), smoothed a little, plus the urban land use
    ub = np.clip(np.sqrt(ndi.gaussian_filter(bld, 0.7)/1400.0), 0, 1)
    U = np.maximum(ub, 0.55*osm['urban']/255.0)
    Wt = osm['water']/255.0; F = osm['forest']/255.0; G = osm['field']/255.0
    covered = ndi.maximum_filter(((bld > 0) | (osm['forest'] > 0) | (osm['field'] > 0) | (osm['urban'] > 0)).astype(np.uint8), size=25) > 0   # ~4 km
else:
    covered = np.zeros((CNY, CNX), bool)
# outside the Kanto extract (Yamanashi, Shizuoka: the Fuji side): towns as soft urban blobs (centres approximate, ~1 km), rules for the rest
TOWNS = [('Kofu', 138.568, 35.662, 3.2), ('Fujiyoshida', 138.808, 35.487, 2.0), ('Fujikawaguchiko', 138.760, 35.500, 1.2), ('Gotemba', 138.935, 35.309, 2.2),
         ('Susono', 138.907, 35.174, 1.6), ('Mishima', 138.919, 35.118, 2.0), ('Numazu', 138.864, 35.096, 2.6), ('Fuji', 138.676, 35.161, 2.8),
         ('Fujinomiya', 138.621, 35.222, 2.2), ('Otsuki', 138.940, 35.610, 1.4), ('Tsuru', 138.905, 35.551, 1.2), ('Uenohara', 139.108, 35.630, 1.0),
         ('Oyama', 138.990, 35.360, 0.9), ('Yamanakako', 138.870, 35.410, 0.7), ('Kai', 138.515, 35.660, 1.8), ('Yamanashi', 138.687, 35.693, 1.3),
         ('Fuefuki', 138.640, 35.645, 1.6), ('Chuo', 138.515, 35.600, 1.2), ('Minami-Alps', 138.465, 35.610, 1.2), ('Fujikawa', 138.461, 35.561, 0.6), ('Ichikawamisato', 138.502, 35.565, 0.7)]
tb = np.zeros((CNY, CNX), np.float32)
for nm, lon, lat, r in TOWNS:
    dd = np.hypot(CXX - wx(lon), CYY - wy(lat))/1000.0
    tb = np.maximum(tb, 0.7*np.exp(-(dd/r)**2))
flatlow = (slope < 0.06) & (Hc < 700)
tb *= flatlow
nc = ~covered & validC
U = np.where(nc, np.maximum(U, tb), U)
# rules where OSM has nothing: forest on slopes and hills, fields on the flat valley floors, nothing above the tree line (the shader
# makes that rock / scoria / scrub); OSM forest gaps in the Kanto mountains are filled by the same rule
ruleF = (Hc > 25) & ((slope > 0.06) | (Hc > 900)) & (Hc < 2500) & ~seaC
ruleG = ~ruleF & (Hc > 0.5) & (Hc < 900) & (slope < 0.08) & ~seaC
ruleF |= ~ruleG & (Hc > 0.5) & (Hc < 2500) & ~seaC
fill = (U < 0.25) & (Wt < 0.5) & (F < 0.5) & (G < 0.5)
F = np.where(fill & ruleF, 1, F); G = np.where(fill & ruleG & nc, np.maximum(G, 0.8), G)
# lakes from the DEM into the water layer
lmC = lakeMask[::2, ::2][:CNY, :CNX] | lakeMask[1::2, 1::2][:CNY, :CNX]
Wt = np.maximum(Wt, lmC.astype(np.float32))
# beyond the data (the strips in the north and south): the nearest data cell's cover
_d, (_cj, _ci) = ndi.distance_transform_edt(~validC, return_indices=True)
U, Wt, F, G = [np.where(validC, A_, (1 - np.clip(_d/4.0, 0, 1))*A_[_cj, _ci] + np.clip(_d/4.0, 0, 1)*ndi.gaussian_filter(A_[_cj, _ci], 8)) for A_ in (U, Wt, F, G)]
cov = np.stack([U, Wt, F, G]).clip(0, 1)
covU8 = (cov*255 + 0.5).astype(np.uint8)
print('cover: urban mean %.3f (cells > 0.3: %.1f %%), water %.1f %%, forest %.1f %%, field %.1f %%, osm-covered %.1f %%' % (U.mean(), 100*(U > 0.3).mean(), 100*Wt.mean(), 100*F.mean(), 100*G.mean(), 100*covered.mean()))

# ---------------- final heights on the grid ----------------
H = np.where(sea, -2.5 - np.minimum(25.5, dco/40.0), np.maximum(Hd, np.where(lakeMask, -50.0, 0.3))).astype(np.float32)
# beyond the data (a few km in the north and south): the nearest data value, land sinking towards the plain
if (~valid).any():
    dist, (ij, ii_) = ndi.distance_transform_edt(~valid, return_indices=True)
    hn = H[ij, ii_]; dkm = dist*R/1000.0
    ext = np.where(hn > 3, 3 + (hn - 3)*np.exp(-dkm/12.0), hn)
    Hx = np.where(valid, H, ext).astype(np.float32)
    wv = np.clip(dist/6.0, 0, 1)
    H = np.where(valid, H, (1 - wv)*Hx + wv*ndi.gaussian_filter(Hx, 18)).astype(np.float32)
H[inside] = 0
Hq = np.round(H/HU).astype(np.int32)
assert Hq.max() < 32767 and Hq.min() > -32768
# predictor residuals
P = np.zeros_like(Hq)
P[1:, 1:] = Hq[1:, :-1] + Hq[:-1, 1:] - Hq[:-1, :-1]
P[0, 1:] = Hq[0, :-1]; P[1:, 0] = Hq[:-1, 0]
res = (Hq - P)
assert np.abs(res).max() < 32767, np.abs(res).max()
Hsec = res.astype('<i2').tobytes()
print('H: range %.1f..%.1f m, residual |max| %d' % (H.min(), H.max(), np.abs(res).max()))

# ---------------- apron: 5.6 km grid out to ~200 km, closing the horizon ----------------
axs = AX0 + np.arange(ANX + 1)*AR; ays = AY0 + np.arange(ANY + 1)*AR
AXX, AYY = np.meshgrid(axs, ays)
ALO, ALA = lonof(AXX), latof(AYY)
ingrid = (AXX >= GX0) & (AXX <= GX0 + NX*R) & (AYY >= GY0) & (AYY <= GY0 + NY*R)
# land polygons beyond the data (approximate coasts: Izu, the Boso tip, the Pacific coast of Chiba and Ibaraki, Shizuoka in the west)
LAND = [
  [(137.0, 34.95), (138.47, 34.95), (138.47, 37.5), (137.0, 37.5)],                                                           # west: Shizuoka, Yamanashi, Nagano
  [(137.0, 35.95), (140.66, 35.95), (140.60, 36.15), (140.58, 36.31), (140.62, 36.55), (140.75, 36.9), (140.9, 37.5), (137.0, 37.5)],  # north: the Kanto plain, Ibaraki
  [(140.10, 35.95), (140.70, 35.94), (140.83, 35.80), (140.87, 35.72), (140.72, 35.70), (140.47, 35.55), (140.40, 35.36), (140.32, 35.15), (140.10, 35.11), (140.10, 35.95)],  # Chiba east
  [(138.75, 35.06), (139.15, 35.06), (139.15, 34.85), (138.98, 34.60), (138.85, 34.65), (138.75, 34.85)],                   # Izu peninsula
  [(139.80, 35.06), (140.15, 35.06), (140.10, 35.11), (139.99, 34.95), (139.86, 34.89), (139.79, 34.97)]]                    # the Boso tip
def inpoly(px_, py_, poly):
    res_ = np.zeros(px_.shape, bool); n_ = len(poly)
    for k in range(n_):
        x1, y1 = poly[k]; x2, y2 = poly[(k + 1) % n_]
        c = ((y1 > py_) != (y2 > py_)) & (px_ < (x2 - x1)*(py_ - y1)/(y2 - y1 + 1e-12) + x1)
        res_ ^= c
    return res_
landA = np.zeros(AXX.shape, bool)
for p in LAND: landA |= inpoly(ALO, ALA, p)
# nearest data value (from a coarse copy of the grid), sinking with the distance from the data
gi = np.clip(np.round((AXX - GX0)/R).astype(int), 0, NX); gj = np.clip(np.round((AYY - GY0)/R).astype(int), 0, NY)
Hg = np.where(inside, 20.0, H)       # the square: plain
Avalid = ingrid & valid[gj, gi]
dA, (aj, ai) = ndi.distance_transform_edt(~Avalid, return_indices=True)
hn = Hg[gj[aj, ai], gi[aj, ai]]
dkm = dA*AR/1000.0
A = np.where(Avalid, Hg[gj, gi], np.where(landA, np.maximum(6.0, 6 + (np.maximum(hn, 6) - 6)*np.exp(-dkm/25.0)), -20.0))
A = np.where(ingrid & ~Avalid, Hg[gj, gi], A)
Asec = np.round(A).astype('<i2').tobytes()
print('apron %dx%d, land %.0f %%' % (ANX + 1, ANY + 1, 100*landA.mean()))

# ---------------- chunks: 14 x 11 of 11.2 km (140 cells); per LOD step (1, 2, 4, 7, 14, 28, 70 cells) the largest height error ----------------
STEPS = [1, 2, 4, 7, 14, 28, 70]
chunks = []
for cb in range(NY//CH):
    for ca in range(NX//CH):
        x0, y0 = GX0 + ca*CH*R, GY0 + cb*CH*R
        if x0 >= -HALF and x0 + CH*R <= HALF and y0 >= -HALF and y0 + CH*R <= HALF: continue
        h = H[cb*CH:cb*CH + CH + 1, ca*CH:ca*CH + CH + 1].astype(np.float64)
        e = [0.0]
        for st in STEPS[1:]:
            c = h[::st, ::st]; m = c.shape[0] - 1
            t = np.arange(CH + 1)/st; k = np.minimum(t.astype(int), m - 1); f = t - k
            a0 = c[k][:, k]; a1 = c[k][:, k + 1]; a2 = c[k + 1][:, k]; a3 = c[k + 1][:, k + 1]
            up = (a0*(1 - f)[None, :] + a1*f[None, :])*(1 - f)[:, None] + (a2*(1 - f)[None, :] + a3*f[None, :])*f[:, None]
            e.append(round(float(np.abs(h - up).max()), 1))
        chunks.append({'a':ca, 'b':cb, 'e':e, 'lo':round(float(h.min()), 1), 'hi':round(float(h.max()), 1)})
print('chunks', len(chunks), 'max errors per step', [max(c['e'][k] for c in chunks) for k in range(len(STEPS))])

# ---------------- test only: the square's terrain at 70 m for the standalone harness (lm33/fuji/test) ----------------
tq = -HALF + np.arange(801)*70.0; TX_, TY_ = np.meshgrid(tq, tq)
th = dem(lonof(TX_).ravel(), latof(TY_).ravel()).reshape(TX_.shape)
tz = ndi.map_coordinates(seaM.astype(np.float32), [mpx(lonof(TX_).ravel(), latof(TY_).ravel())[1] - 0.5, mpx(lonof(TX_).ravel(), latof(TY_).ravel())[0] - 0.5], order=1).reshape(TX_.shape)
th = np.where(tz > 0.5, -1.6 - 4*np.clip(tz - 0.5, 0, 1), np.clip(th, 0.2, 260))
open(OUT + 'test_sq.bin', 'wb').write(np.round(th*10).astype('<i2').tobytes())

# ---------------- labels ----------------
LABELS = [
  {'zh':'富士山', 'en':'Mount Fuji', 'sub':'3776 m', 'lon':FUJI[0], 'lat':FUJI[1], 'h':3776, 'k':'peak'},
  {'zh':'箱根', 'en':'Hakone', 'lon':139.025, 'lat':35.235, 'k':'area'},
  {'zh':'丹泽山地', 'en':'Tanzawa Mountains', 'lon':139.150, 'lat':35.470, 'k':'area'},
  {'zh':'相模湾', 'en':'Sagami Bay', 'lon':139.350, 'lat':35.180, 'k':'sea'},
]
for L_ in LABELS:
    L_['x'] = round(wx(L_['lon'])); L_['y'] = round(wy(L_['lat']))
    if 'h' not in L_:
        jj_, ii_ = int(round((L_['y'] - GY0)/R)), int(round((L_['x'] - GX0)/R)); L_['h'] = round(float(max(0, H[jj_, ii_])))
for lk in lakes: LABELS.append({'zh':lk['zh'], 'en':lk['en'], 'x':lk['lx'], 'y':lk['ly'], 'h':lk['lv'], 'k':'lake'})

# ---------------- write ----------------
hdr = {'v':1, 'GX0':GX0, 'GY0':GY0, 'R':R, 'NX':NX, 'NY':NY, 'CH':CH, 'HU':HU, 'CR':CR, 'CNX':CNX, 'CNY':CNY,
       'AR':AR, 'AX0':AX0, 'AY0':AY0, 'ANX':ANX, 'ANY':ANY, 'HALF':HALF, 'lon0':LON0, 'lat0':LAT0, 'MX':MX, 'MY':MY,
       'fuji':{'x':round(fx), 'y':round(fy), 'h':FUJI[2], 'gx':float(XX[jm, im]), 'gy':float(YY[jm, im])}, 'lakes':lakes, 'labels':LABELS, 'steps':STEPS, 'chunks':chunks,
       'src':'AWS Terrain Tiles (terrarium z12), OpenStreetMap (Kanto extract) land cover', 'built':time.strftime('%Y-%m-%d')}
secs = [('H', Hsec), ('C', covU8.tobytes()), ('A', Asec), ('L', bytes(Lsec))]
def build(hdr):
    js = json.dumps(hdr, ensure_ascii=False, separators=(',', ':')).encode()
    return js
off = 0
hdr['sec'] = {k: [0, len(b)] for k, b in secs}
for _ in range(3):      # the header length depends on the offsets
    js = build(hdr); off = 8 + len(js); off += (-off) % 4
    for k, b in secs: hdr['sec'][k] = [off, len(b)]; off += len(b); off += (-off) % 4
js = build(hdr); base = 8 + len(js); pad0 = (-base) % 4
buf = bytearray(b'SGF1' + struct.pack('<I', len(js) + pad0) + js + b' '*pad0)
assert len(buf) == hdr['sec']['H'][0], (len(buf), hdr['sec']['H'][0])
for k, b in secs:
    assert len(buf) == hdr['sec'][k][0]; buf += b; buf += b'\0'*((-len(buf)) % 4)
gz = gzip.compress(bytes(buf), 9)
os.makedirs(os.path.dirname(DST), exist_ok=True)
b64 = base64.b64encode(gz)
open(DST, 'wb').write(b64)
print('raw %.2f MB, gzip %.2f MB, base64 %.2f MB -> %s' % (len(buf)/1e6, len(gz)/1e6, len(b64)/1e6, DST))
print('sections', {k: round(len(b)/1e6, 2) for k, b in secs})
# previews
hp = np.clip(np.where(H > 0, 60 + np.sqrt(np.maximum(H, 0))*3.2, 30 + H), 0, 255).astype(np.uint8)
Image.fromarray(hp[::-1]).resize((NX//2, NY//2)).save(OUT + 'prev_H.png')
cp = np.stack([covU8[0], covU8[2], np.maximum(covU8[1], covU8[3]//3)], -1)
Image.fromarray(cp[::-1]).save(OUT + 'prev_cover.png')
print('done %.0f s' % (time.time() - t0))
