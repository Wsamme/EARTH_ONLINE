# render.py dump.json out.png az el [cx cy cz span] : flat-shaded orthographic render (painter's algorithm) of a nodetest dump
import json, sys, math
import numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
T = np.array(json.load(open(sys.argv[1])), dtype=float); out = sys.argv[2]
views = [tuple(map(float, v.split(','))) for v in sys.argv[3:]] or [(200, 30)]
P = T[:, :9].reshape(-1, 3, 3); C = T[:, 9:12]
fig, axs = plt.subplots(1, len(views), figsize=(6*len(views), 5.5), dpi=110)
if len(views) == 1: axs = [axs]
L = np.array([-0.45, 0.8, 0.4]); L /= np.linalg.norm(L)
for ax, v in zip(axs, views):
    az, el = math.radians(v[0]), math.radians(v[1])
    # camera direction (from target to camera): azimuth 0 = camera south (+z) looking north
    d = np.array([math.sin(az)*math.cos(el), math.sin(el), math.cos(az)*math.cos(el)])
    right = np.cross([0, 1, 0], d); right /= np.linalg.norm(right); up = np.cross(d, right)
    X = P @ right; Y = P @ up; Z = P @ d
    nrm = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); ln = np.linalg.norm(nrm, axis=1); ok = ln > 1e-9
    nrm[ok] /= ln[ok, None]; nrm[(nrm @ d) < 0] *= -1
    sh = 0.55 + 0.45*np.clip(np.abs(nrm @ L), 0, 1)
    order = np.argsort(Z.mean(axis=1))
    polys = np.stack([X, Y], axis=2)[order]; cols = np.clip(C[order]*sh[order, None], 0, 1)
    ax.add_collection(PolyCollection(polys, facecolors=cols, edgecolors='none'))
    ax.set_xlim(X.min(), X.max()); ax.set_ylim(Y.min(), Y.max()); ax.set_aspect('equal'); ax.set_facecolor('#e3e1d9'); ax.set_title('az %g el %g' % v[:2], fontsize=8)
plt.tight_layout(); plt.savefig(out); print('ok', len(P))
