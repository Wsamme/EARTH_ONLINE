# shared constants and helpers for the real Hong Kong data pipeline (v37)
import math, pickle, json
import numpy as np
from shapely.ops import transform as stransform
ROOT = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
BD = ROOT + 'hkdata/'; OUT = ROOT + 'hkreal/out/'
LON0, LAT0, MX, MY = 114.12, 22.34, 103014.2, 110734.9    # WGS84 metres per degree at 22.34 N
HALF, CELL, N = 28000, 25, 2240          # same square as Singapore / New York (56 x 56 km)
TS, TN = 70, 801
BBOX = (LON0 - HALF/MX - 0.01, LAT0 - HALF/MY - 0.01, LON0 + HALF/MX + 0.01, LAT0 + HALF/MY + 0.01)   # lon/lat with a margin
def w(lon, lat): return ((lon - LON0)*MX, (lat - LAT0)*MY)
def ll(x, y): return (LON0 + x/MX, LAT0 + y/MY)
def proj(g): return stransform(lambda x, y, z=None: ((np.asarray(x) - LON0)*MX, (np.asarray(y) - LAT0)*MY), g)
def load(name): return pickle.load(open(OUT + name, 'rb'))
def save(obj, name): pickle.dump(obj, open(OUT + name, 'wb'), protocol=4)
