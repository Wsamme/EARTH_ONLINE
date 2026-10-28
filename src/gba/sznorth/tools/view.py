# software render of tmp/dump.bin: an oblique view with flat shading (painter's sort), for a quick look without a browser
import numpy as np, json, sys, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
P = np.fromfile('tmp/dump.bin', dtype=np.float32).reshape(-1, 3, 3); C = json.load(open('tmp/dump.json'))
az, el = float(sys.argv[1]), float(sys.argv[2]); out = sys.argv[3]
a, e = np.radians(az), np.radians(el)
# camera looking from azimuth a (0 = from south, +z) elevation e
fwd = np.array([-np.sin(a)*np.cos(e), -np.sin(e), -np.cos(a)*np.cos(e)])
right = np.cross(fwd, [0, 1, 0]); right /= np.linalg.norm(right); up = np.cross(right, fwd)
X = P @ right; Y = P @ up; Dp = (P @ fwd).mean(1)
n = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); n /= (np.linalg.norm(n, axis=1, keepdims=True) + 1e-9)
L = np.array([0.4, 0.8, 0.45]); L /= np.linalg.norm(L); sh = 0.45 + 0.55*np.abs(n @ L)
rgb = np.array([[int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16)] for c in C])/255.0
cols = np.clip(rgb*sh[:, None], 0, 1)
o = np.argsort(-Dp)
fig, ax = plt.subplots(figsize=(14, 8), dpi=80)
ax.add_collection(PolyCollection(np.stack([X, Y], -1)[o], facecolors=cols[o], edgecolors='none'))
ax.autoscale(); ax.set_aspect('equal'); ax.axis('off'); plt.tight_layout(); plt.savefig(out)
