# Shaded preview of an ndump.js binary (numpy z-buffer, Lambert light, no browser).
# usage: python3 nrender.py <x.bin> <out.png> tx ty tz dist elev azim [W H]
#   target (tx, ty, tz) in model coords (y up, z south); camera at distance dist, elevation elev (deg), azimuth azim (deg: 0 = camera
#   south of the target looking north, 90 = camera east of it), like the app views. Slow above ~150 k triangles at large W H.
import sys, struct, math
import numpy as np
from PIL import Image
f, out = sys.argv[1], sys.argv[2]; tx, ty, tz, dist, elev, azim = map(float, sys.argv[3:9])
W, H = (int(sys.argv[9]), int(sys.argv[10])) if len(sys.argv) > 10 else (600, 450)
b = open(f, 'rb').read(); assert b[:4] == b'TYD1'; n = struct.unpack('<I', b[4:8])[0]
rec = np.frombuffer(b, dtype=np.dtype([('p', '<f4', 9), ('c', 'u1', 4)]), count=n, offset=8)
P = rec['p'].reshape(n, 3, 3).astype(np.float64); C = rec['c'][:, :3].astype(np.float64)
e, a = math.radians(elev), math.radians(azim)
cam = np.array([tx + math.sin(a)*math.cos(e)*dist, ty + math.sin(e)*dist, tz + math.cos(a)*math.cos(e)*dist]); tgt = np.array([tx, ty, tz])
fw = tgt - cam; fw /= np.linalg.norm(fw); rt = np.cross(fw, [0, 1, 0]); rt /= np.linalg.norm(rt); up = np.cross(rt, fw)
V = P - cam; x = V @ rt; y = V @ up; z = V @ fw
fov = math.radians(45); fy = (H/2)/math.tan(fov/2)
N = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); N /= (np.linalg.norm(N, axis=1, keepdims=True) + 1e-12)
L = np.array([0.45, 0.8, 0.35]); L /= np.linalg.norm(L)
sh = 0.38 + 0.62*np.abs(N @ L); col = np.clip(C*sh[:, None], 0, 255)
img = np.full((H, W, 3), (205, 214, 222), np.uint8); zb = np.full((H, W), np.inf)
ok = (z > 0.5).all(1)
sx = W/2 + x/z*fy; sy = H/2 - y/z*fy
for i in np.nonzero(ok)[0]:
    xs, ys, zs = sx[i], sy[i], z[i]
    x0, x1 = int(max(0, math.floor(xs.min()))), int(min(W - 1, math.ceil(xs.max()))); y0, y1 = int(max(0, math.floor(ys.min()))), int(min(H - 1, math.ceil(ys.max())))
    if x0 > x1 or y0 > y1: continue
    gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
    d = (ys[1] - ys[2])*(xs[0] - xs[2]) + (xs[2] - xs[1])*(ys[0] - ys[2])
    if abs(d) < 1e-9: continue
    w0 = ((ys[1] - ys[2])*(gx - xs[2]) + (xs[2] - xs[1])*(gy - ys[2]))/d; w1 = ((ys[2] - ys[0])*(gx - xs[2]) + (xs[0] - xs[2])*(gy - ys[2]))/d; w2 = 1 - w0 - w1
    m = (w0 >= 0) & (w1 >= 0) & (w2 >= 0)
    if not m.any(): continue
    zz = 1/(w0/zs[0] + w1/zs[1] + w2/zs[2]); sub = zb[y0:y1 + 1, x0:x1 + 1]; m &= zz < sub
    sub[m] = zz[m]; img[y0:y1 + 1, x0:x1 + 1][m] = col[i]
Image.fromarray(img).save(out); print('wrote', out, n, 'triangles')
