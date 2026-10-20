# stage 3b (Tokyo): bake the roofs of all buildings into the ground texture (13.7 m per pixel), so the far tiles — which only draw the
# big buildings in 3D — still show the grain of the neighbourhoods (the 3D houses appear on top when the camera comes near).
# Reads the compact arrays of b5 (out/bldA.npz).
import sys, os; sys.path.insert(0, '.')
from common import *
from PIL import Image, ImageDraw
S = 4096; SS = 2*S
if not os.path.exists(OUT + 'ground_base.webp'): Image.open(OUT + 'ground.webp').convert('RGB').save(OUT + 'ground_base.webp', quality=92)
img = Image.open(OUT + 'ground_base.webp').convert('RGB')
PAL = [(196, 194, 188), (120, 124, 128), (172, 96, 72), (150, 164, 176), (138, 160, 110), (230, 230, 226), (110, 90, 80), (190, 92, 60)]
Z = np.load(OUT + 'bldA.npz')
XY = Z['XY']; RS = Z['RS']; BR = Z['BR']; t = Z['t']; roof = Z['roof']; rc = Z['rc']; hrc = Z['hrc']; part = Z['part']
col = Image.new('RGB', (SS, SS), (0, 0, 0)); msk = Image.new('L', (SS, SS), 0)
dc = ImageDraw.Draw(col); dm = ImageDraw.Draw(msk)
P = np.empty_like(XY); P[:, 0] = (XY[:, 0] + HALF)/(2*HALF)*SS; P[:, 1] = (HALF - XY[:, 1])/(2*HALF)*SS
n = 0
for k in range(len(BR) - 1):
    if part[k]: continue
    a = RS[BR[k]]; b = RS[BR[k] + 1]
    if b - a < 4: continue
    tk = int(t[k])
    c = tuple(int(v) for v in rc[k]) if hrc[k] else PAL[roof[k] if roof[k] < len(PAL) else 0]
    if tk in (2, 4, 5, 6, 7, 10, 11, 12) and not hrc[k]: c = (184, 182, 176) if tk != 6 else (196, 196, 192)
    c = (int(c[0]*0.86), int(c[1]*0.86), int(c[2]*0.86))
    pts = [tuple(q) for q in P[a:b].tolist()]
    dc.polygon(pts, fill=c); dm.polygon(pts, fill=255); n += 1
    if n % 500000 == 0: print('drawn', n, flush=True)
print('drawn', n, flush=True)
del Z, XY, P
col = col.resize((S, S), Image.BOX); msk = msk.resize((S, S), Image.BOX)
G = np.asarray(img).astype(np.float32); C = np.asarray(col).astype(np.float32); A = np.asarray(msk).astype(np.float32)[..., None]/255.0
C = np.where(A > 0.01, C/np.maximum(A, 0.01), 0)
k = 0.8
out = G*(1 - A*k) + C*A*k
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(OUT + 'ground.webp', quality=90, method=6)
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)[1600:2400, 1900:2700]).save(OUT + 'prev_speckle_tyo.png')
print('saved', os.path.getsize(OUT + 'ground.webp'))
