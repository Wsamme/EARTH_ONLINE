# shared constants and helpers for the real-Singapore data pipeline
import math, pickle, json
import numpy as np
from shapely.ops import transform as stransform
ROOT = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
SGD = ROOT + 'sgdata/'; OUT = ROOT + 'sgreal/out/'
LON0, LAT0, MX, MY = 103.845, 1.315, 111290.5, 110574.0
HALF, CELL, N = 28000, 25, 2240
TS, TN = 70, 801
def w(lon, lat): return ((lon - LON0)*MX, (lat - LAT0)*MY)
def ll(x, y): return (LON0 + x/MX, LAT0 + y/MY)
def proj(g): return stransform(lambda x, y, z=None: ((np.asarray(x) - LON0)*MX, (np.asarray(y) - LAT0)*MY), g)
def load(name): return pickle.load(open(OUT + name, 'rb'))
def save(obj, name): pickle.dump(obj, open(OUT + name, 'wb'), protocol=4)
