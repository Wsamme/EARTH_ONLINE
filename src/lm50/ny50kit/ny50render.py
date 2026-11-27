# shaded preview of a landmark dump (ny50tool.js dump): python3 ny50render.py <x.bin> <out.png> tx ty tz dist elev azim [W H]
# model coords (y up); camera orbits the target point (tx, ty, tz) at dist m, elevation / azimuth in degrees (azim 0 = from +z, i.e. from the
# model's south side looking north). Flat Lambert shading with a z-buffer (numpy), white background, 2x supersampling.
import sys, math, numpy as np
from PIL import Image
a = sys.argv; T = np.fromfile(a[1], dtype=np.float32).reshape(-1, 3, 6)
tx, ty, tz, dist, el, az = map(float, a[3:9]); W = int(a[9]) if len(a) > 9 else 600; H = int(a[10]) if len(a) > 10 else 450
S = 2; Wp, Hp = W*S, H*S
e, z = math.radians(el), math.radians(az)
cam = np.array([tx + dist*math.cos(e)*math.sin(z), ty + dist*math.sin(e), tz + dist*math.cos(e)*math.cos(z)])
f = np.array([tx, ty, tz]) - cam; f /= np.linalg.norm(f)
r = np.cross(f, [0, 1, 0]); r /= (np.linalg.norm(r) or 1); u = np.cross(r, f)
P = T[:, :, :3] - cam; X = P @ r; Y = P @ u; Zc = P @ f
fov = math.radians(40); fl = (Hp/2)/math.tan(fov/2)
ok = (Zc > 0.5).all(1); P2 = np.stack([Wp/2 + fl*X/Zc, Hp/2 - fl*Y/Zc], -1)
n = np.cross(T[:, 1, :3] - T[:, 0, :3], T[:, 2, :3] - T[:, 0, :3]); nl = np.linalg.norm(n, axis=1); nl[nl == 0] = 1; n /= nl[:, None]
L = np.array([0.45, 0.8, 0.35]); L /= np.linalg.norm(L)
sh = 0.35 + 0.65*np.abs(n @ L)
col = np.clip(T[:, :, 3:].mean(1)*sh[:, None], 0, 1)
img = np.ones((Hp, Wp, 3), np.float32); zb = np.full((Hp, Wp), np.inf, np.float32)
order = np.argsort(-Zc.mean(1))
for i in order:
    if not ok[i]: continue
    p = P2[i]; x0, x1 = int(max(0, math.floor(p[:, 0].min()))), int(min(Wp - 1, math.ceil(p[:, 0].max()))); y0, y1 = int(max(0, math.floor(p[:, 1].min()))), int(min(Hp - 1, math.ceil(p[:, 1].max())))
    if x0 > x1 or y0 > y1: continue
    xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
    (ax_, ay_), (bx_, by_), (cx_, cy_) = p
    d = (by_ - cy_)*(ax_ - cx_) + (cx_ - bx_)*(ay_ - cy_)
    if abs(d) < 1e-9: continue
    w0 = ((by_ - cy_)*(xs - cx_) + (cx_ - bx_)*(ys - cy_))/d; w1 = ((cy_ - ay_)*(xs - cx_) + (ax_ - cx_)*(ys - cy_))/d; w2 = 1 - w0 - w1
    m = (w0 >= 0) & (w1 >= 0) & (w2 >= 0)
    if not m.any(): continue
    zz = w0*Zc[i, 0] + w1*Zc[i, 1] + w2*Zc[i, 2]; sub = zb[y0:y1 + 1, x0:x1 + 1]; m &= zz < sub
    sub[m] = zz[m]; img[y0:y1 + 1, x0:x1 + 1][m] = col[i]
Image.fromarray((img*255).astype(np.uint8)).resize((W, H), Image.LANCZOS).save(a[2]); print('rendered', int(ok.sum()), 'tris ->', a[2])
