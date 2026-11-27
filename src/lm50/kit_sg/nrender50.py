# lm50 (Singapore): shaded preview of an ndump50.js dump (replaces lm22/marina/nrender.py; same arguments).
#   python3 R/lm50/kit_sg/nrender50.py x.bin out.png tx ty tz dist elev azim [W H]
#   target (tx, ty, tz) in model coords (y up), camera at dist m, elevation deg, azimuth deg (0 = camera south of the target
#   looking north, 90 = camera east). Painter's algorithm with a per-pixel depth test in numpy; slow above ~150 k triangles.
import sys, json, math, struct
import numpy as np
from PIL import Image
f, out = sys.argv[1], sys.argv[2]; tx, ty, tz, dist, el, az = map(float, sys.argv[3:9])
W = int(sys.argv[9]) if len(sys.argv) > 9 else 600; H = int(sys.argv[10]) if len(sys.argv) > 10 else int(W*0.66)
b = open(f, 'rb').read(); hl = struct.unpack('<I', b[:4])[0]; head = json.loads(b[4:4 + hl]); X = np.frombuffer(b[4 + hl:], dtype=np.float32).reshape(-1, 3, 3).astype(np.float64)
cols = np.concatenate([np.tile([int(h['c'][i:i+2], 16) for i in (1, 3, 5)], (h['n'], 1)) for h in head]).astype(np.float64)
e, a = math.radians(el), math.radians(az)
eye = np.array([tx + math.sin(a)*math.cos(e)*dist, ty + math.sin(e)*dist, tz + math.cos(a)*math.cos(e)*dist]); T = np.array([tx, ty, tz])
fw = T - eye; fw /= np.linalg.norm(fw); rt = np.cross(fw, [0, 1, 0]); rt /= np.linalg.norm(rt); up = np.cross(rt, fw)
V = X - eye; cx = V @ rt; cy = V @ up; cz = V @ fw
foc = 0.5*H/math.tan(math.radians(25))
ok = (cz > 0.5).all(1); X, cx, cy, cz, cols = X[ok], cx[ok], cy[ok], cz[ok], cols[ok]
px = W/2 + foc*cx/cz; py = H/2 - foc*cy/cz
n = np.cross(X[:, 1] - X[:, 0], X[:, 2] - X[:, 0]); n /= (np.linalg.norm(n, axis=1)[:, None] + 1e-9)
L = np.array([0.45, 0.8, -0.35]); L /= np.linalg.norm(L); sh = 0.5 + 0.5*np.abs(n @ L)
img = np.full((H, W, 3), (222, 230, 238), np.float64); zb = np.full((H, W), np.inf)
for i in np.argsort(-cz.mean(1)):
    xs, ys = px[i], py[i]; x0, x1 = int(max(0, math.floor(xs.min()))), int(min(W - 1, math.ceil(xs.max()))); y0, y1 = int(max(0, math.floor(ys.min()))), int(min(H - 1, math.ceil(ys.max())))
    if x0 > x1 or y0 > y1: continue
    gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
    (ax_, bx_, cx_), (ay_, by_, cy_) = xs, ys; d = (by_ - cy_)*(ax_ - cx_) + (cx_ - bx_)*(ay_ - cy_)
    if abs(d) < 1e-9: continue
    l1 = ((by_ - cy_)*(gx - cx_) + (cx_ - bx_)*(gy - cy_))/d; l2 = ((cy_ - ay_)*(gx - cx_) + (ax_ - cx_)*(gy - cy_))/d; l3 = 1 - l1 - l2
    m = (l1 >= -1e-6) & (l2 >= -1e-6) & (l3 >= -1e-6)
    if not m.any(): continue
    z = l1*cz[i, 0] + l2*cz[i, 1] + l3*cz[i, 2]; sub = zb[y0:y1 + 1, x0:x1 + 1]; m &= z < sub
    sub[m] = z[m]; img[y0:y1 + 1, x0:x1 + 1][m] = cols[i]*sh[i]
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(out); print(out, len(X), 'tris')
