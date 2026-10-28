# quick offline preview of a dumped landmark (z-buffer, flat shading): render.py dump.json out.png tx ty tz dist elev azim [W H fov]
import sys, json, math, numpy as np
from PIL import Image
D = json.load(open(sys.argv[1])); out = sys.argv[2]
tx, ty, tz, dist, el, az = map(float, sys.argv[3:9]); W = int(sys.argv[9]) if len(sys.argv) > 9 else 900; H = int(sys.argv[10]) if len(sys.argv) > 10 else 560; fov = float(sys.argv[11]) if len(sys.argv) > 11 else 40
e, a = math.radians(el), math.radians(az)
cam = np.array([tx + dist*math.cos(e)*math.sin(a), ty + dist*math.sin(e), tz + dist*math.cos(e)*math.cos(a)])   # az 0: camera at +z (south) looking north
f = np.array([tx, ty, tz]) - cam; f /= np.linalg.norm(f); r = np.cross(f, [0, 1, 0]); r /= np.linalg.norm(r); u = np.cross(r, f)
F = 0.5*H/math.tan(math.radians(fov)/2)
zb = np.full((H, W), np.inf); img = np.zeros((H, W, 3)); img[:] = (0.80, 0.86, 0.92)
L = np.array([0.4, 0.8, 0.3]); L /= np.linalg.norm(L)
for col, pos in D:
    c = np.array([int(col[i:i + 2], 16) for i in (1, 3, 5)])/255.0
    P = np.array(pos, dtype=float).reshape(-1, 3, 3)
    n = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); nl = np.linalg.norm(n, axis=1); ok = nl > 1e-9; P = P[ok]; n = n[ok]/nl[ok][:, None]
    sh = 0.42 + 0.58*np.abs(n @ L)
    Q = P - cam; xc = Q @ r; yc = Q @ u; zc = Q @ f
    vis = (zc > 1).all(axis=1)
    for k in np.nonzero(vis)[0]:
        sx = W/2 + F*xc[k]/zc[k]; sy = H/2 - F*yc[k]/zc[k]
        x0, x1 = max(0, int(sx.min())), min(W - 1, int(sx.max()) + 1); y0, y1 = max(0, int(sy.min())), min(H - 1, int(sy.max()) + 1)
        if x0 > x1 or y0 > y1: continue
        X, Y = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        d = (sy[1] - sy[2])*(sx[0] - sx[2]) + (sx[2] - sx[1])*(sy[0] - sy[2])
        if abs(d) < 1e-12: continue
        w0 = ((sy[1] - sy[2])*(X - sx[2]) + (sx[2] - sx[1])*(Y - sy[2]))/d; w1 = ((sy[2] - sy[0])*(X - sx[2]) + (sx[0] - sx[2])*(Y - sy[2]))/d; w2 = 1 - w0 - w1
        m = (w0 >= -1e-6) & (w1 >= -1e-6) & (w2 >= -1e-6)
        if not m.any(): continue
        z = w0*zc[k][0] + w1*zc[k][1] + w2*zc[k][2]
        sub = zb[y0:y1 + 1, x0:x1 + 1]; mm = m & (z < sub)
        sub[mm] = z[mm]; img[y0:y1 + 1, x0:x1 + 1][mm] = c*sh[k]
Image.fromarray((np.clip(img, 0, 1)*255).astype(np.uint8)).save(out)
