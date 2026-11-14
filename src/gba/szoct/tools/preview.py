# offline preview of a harness dump: python3 preview.py <dump.bin> <out.png> [az el dist tx ty tz fov] [W H]
# perspective, flat Lambert shading, painter's sort (matplotlib PolyCollection). az 0 = camera south looking north.
import sys, struct, json, os, numpy as np, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
f = sys.argv[1]; out = sys.argv[2]; a = [float(v) for v in sys.argv[3:10]] if len(sys.argv) > 3 else []
W, H = (int(sys.argv[10]), int(sys.argv[11])) if len(sys.argv) > 11 else (1100, 720)
raw = open(f, 'rb').read(); o = 0; P = []; C = []
while o < len(raw):
    n, r, g, b, hc = struct.unpack_from('<IfffB', raw, o); o += 17
    pos = np.frombuffer(raw, dtype='<f4', count=n*3, offset=o).reshape(-1, 3); o += n*12
    if hc: col = np.frombuffer(raw, dtype='<f4', count=n*3, offset=o).reshape(-1, 3)*np.array([r, g, b]); o += n*12
    else: col = np.tile([r, g, b], (n, 1))
    P.append(pos); C.append(col)
P = np.concatenate(P).reshape(-1, 3, 3); C = np.concatenate(C).reshape(-1, 3, 3).mean(1)
side = json.load(open(f[:-4] + '.json')) if os.path.exists(f[:-4] + '.json') else {}
lo, hi = P.reshape(-1, 3).min(0), P.reshape(-1, 3).max(0)
az, el, dist, tx, ty, tz, fov = (a + [None]*7)[:7]
az = 30 if az is None else az; el = 25 if el is None else el
ctr = np.array([tx if tx is not None else (lo[0] + hi[0])/2, ty if ty is not None else lo[1] + (hi[1] - lo[1])*0.35, tz if tz is not None else (lo[2] + hi[2])/2])
if dist is None: dist = max(hi[0] - lo[0], hi[2] - lo[2], hi[1] - lo[1])*1.5
fov = fov or 38
A, E = np.radians(az), np.radians(el)
cam = ctr + dist*np.array([np.sin(A)*np.cos(E), np.sin(E), np.cos(A)*np.cos(E)])
fw = ctr - cam; fw /= np.linalg.norm(fw); rt = np.cross(fw, [0, 1, 0]); rt /= np.linalg.norm(rt); up = np.cross(rt, fw)
def proj(X):
    d = X - cam; z = d @ fw; x = d @ rt; y = d @ up; f = 1/np.tan(np.radians(fov)/2)
    return np.stack([x/np.maximum(z, 1e-3)*f, y/np.maximum(z, 1e-3)*f], -1), z
nrm = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); ln = np.linalg.norm(nrm, axis=1); ok = ln > 1e-9; P, C, nrm = P[ok], C[ok], nrm[ok]/ln[ok][:, None]
L = np.array([-0.45, 0.8, 0.4]); L /= np.linalg.norm(L)
sh = 0.55 + 0.45*np.abs(nrm @ L)
xy, z = proj(P.reshape(-1, 3)); xy = xy.reshape(-1, 3, 2); z = z.reshape(-1, 3)
vis = (z > 1).all(1); order = np.argsort(-z.mean(1)[vis])
fig = plt.figure(figsize=(W/100, H/100), dpi=100); ax = fig.add_axes([0, 0, 1, 1]); ax.set_facecolor('#e3e1d9')
asp = W/H; ax.set_xlim(-asp, asp); ax.set_ylim(-1, 1); ax.axis('off')
# ground grid (y = lo) and the site's keep / paints
g0 = lo[1]
def poly2(pts, y, **kw):
    X = np.array([[p[0], y, p[1]] for p in pts]); q, zz = proj(X)
    if (zz > 1).all(): ax.add_patch(plt.Polygon(q, closed=True, **kw))
for pp in side.get('paints', []): poly2(pp['P'], g0, fc=np.array(pp['c'])/255, ec='none', zorder=0)
if side.get('keep'): poly2(side['keep'], g0, fc='none', ec='#3355cc', lw=1, zorder=0)
pc = PolyCollection(xy[vis][order], facecolors=np.clip(C[vis][order]*sh[vis][order][:, None], 0, 1), edgecolors='none', antialiased=False, zorder=2)
ax.add_collection(pc)
if side.get('trees'):
    T = np.array([[t[0], g0 + t[2]*1.4, t[1]] for t in side['trees']]); q, zz = proj(T); m = zz > 1
    ax.scatter(q[m, 0], q[m, 1], s=np.clip(400*np.array([t[2] for t in side['trees']])[m]/zz[m]*dist/300, 0.5, 40), c='#5e7f48', zorder=1, linewidths=0)
fig.savefig(out, dpi=100); print('tris', len(P), 'cam', cam.round(1).tolist())
