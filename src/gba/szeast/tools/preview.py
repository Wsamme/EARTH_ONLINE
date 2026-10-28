# preview.py <dumpdir> <key> [az el dist tx ty tz] [out.png] : quick painter's-algorithm render of a nodetest dump (flat shading)
import sys, numpy as np
from PIL import Image, ImageDraw
d, k = sys.argv[1], sys.argv[2]
P = np.fromfile(f'{d}/{k}.pos', np.float32).reshape(-1, 3, 3); C = np.fromfile(f'{d}/{k}.col', np.float32).reshape(-1, 3, 3).mean(1)
az, el, dist = [float(v) for v in sys.argv[3:6]] if len(sys.argv) > 5 else (200, 30, 0)
c = P.reshape(-1, 3); lo, hi = c.min(0), c.max(0); ctrp = (lo + hi)/2
if len(sys.argv) > 8: ctrp = np.array([float(v) for v in sys.argv[6:9]])
R = np.linalg.norm(hi - lo)/2
dist = dist or R*2.6
a, e = np.radians(az), np.radians(el)
# camera: azimuth 0 = camera south (+z) looking north
eye = ctrp + dist*np.array([np.sin(a)*np.cos(e), np.sin(e), np.cos(a)*np.cos(e)])
f = ctrp - eye; f /= np.linalg.norm(f); r = np.cross(f, [0, 1, 0]); r /= np.linalg.norm(r); u = np.cross(r, f)
V = P - eye; x = V @ r; y = V @ u; z = V @ f
W, H = 1100, 700; fl = W*0.9
ok = (z > 1).all(1)
sx = W/2 + fl*x/np.maximum(z, 1e-3); sy = H/2 - fl*y/np.maximum(z, 1e-3)
n = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); nl = np.linalg.norm(n, axis=1) + 1e-9; n = n/nl[:, None]
L = np.array([0.4, 0.8, 0.45]); L /= np.linalg.norm(L)
sh = 0.45 + 0.55*np.abs(n @ L)
order = np.argsort(-z.mean(1))
img = Image.new('RGB', (W, H), (200, 214, 228)); dr = ImageDraw.Draw(img)
for i in order:
    if not ok[i] or nl[i] < 1e-7: continue
    col = tuple(int(min(255, v*255*sh[i])) for v in C[i])
    dr.polygon([(sx[i, 0], sy[i, 0]), (sx[i, 1], sy[i, 1]), (sx[i, 2], sy[i, 2])], fill=col)
out = sys.argv[9] if len(sys.argv) > 9 else f'{d}/{k}_{int(az)}_{int(el)}.png'
img.save(out); print(out, len(P))
