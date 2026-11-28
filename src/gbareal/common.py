# shared constants and helpers for the Greater Bay map pipeline (gbareal: Dongguan + Shenzhen + Hong Kong in one square)
# The projection is Hong Kong's (hkreal/common.py: WGS84 metres per degree at 22.34 N) moved by a whole number of tiles:
#   x_gba = x_hk + 7000, y_gba = y_hk - 35000      (HK_DX, HK_DY below)
# so every Hong Kong coordinate keeps its metric, the Hong Kong 2 km tiles, 70 m terrain vertices and 50 m cells coincide with
# the Hong Kong map's (the HK square -28 .. 28 km is tiles tx 21..48, ty 0..27 here), and Hong Kong's southern edge is unchanged.
# Square: 126 x 126 km, lon 113.4405 - 114.6636, lat 22.0871 - 23.2249 (Hong Kong: 56 x 56 km).
import math, pickle, json
import numpy as np
from shapely.ops import transform as stransform
import os as _os
ROOT = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
MX, MY = 103014.2, 110734.9          # metres per degree (Hong Kong's, kept so the Hong Kong modules' offsets stay exact)
HK_DX, HK_DY = 7000.0, -35000.0      # Hong Kong frame -> this frame
LON0, LAT0 = 114.12 - HK_DX/MX, 22.34 - HK_DY/MY      # the origin: the same in both frames (world x / y of all content unchanged)
FRAME = _os.environ.get('GBA_FRAME', 'gba')
if FRAME == 'gz':
    # v48 (lm50): all of Guangzhou. Same origin and metres per degree; the square grows symmetrically to HALF 147 km (294 x 294 km,
    # lon 112.625 - 115.479, lat 21.329 - 23.984): 147 km is the smallest half-width that is an odd number of km (2 km tile edges stay
    # on the same lattice: old tile (tx, ty) = new (tx + 42, ty + 42)) and a multiple of 70 m and 140 m (terrain vertices coincide)
    # and that reaches Conghua's northern tip (23.93 N). 100 m cells (N 2940, 8.6 M cells; was 50 m, 6.35 M), 140 m terrain
    # (TN 2101, 4.4 M vertices; was 70 m, 3.2 M), 50 m fine rasters (5880^2 px; was 25 m, 5040^2).
    GZ = _os.environ.get('GZ_ROOT', ROOT + 'lm50/gz/')
    BD = ROOT + 'hkdata/'; OUT = GZ + 'out/'; DATA = GZ + 'data/'; DEM = GZ + 'dl/terrain/'
    PBF = DATA + 'gba.osm.pbf'
    PBFS = [GZ + 'dl/osm/hong_kong.osm.pbf', GZ + 'dl/osm/macau.osm.pbf', GZ + 'dl/osm/guangdong.osm.pbf']   # openstreetmap.fr extracts
    HALF = 147000; CELL = int(_os.environ.get('GZ_CELL', '100')); N = 2*HALF//CELL      # GZ_CELL=140: N 2100, 4.41 M cells (fewer than October's 6.35 M)
    TS, TN = 140, 2101
    TILE = 2000; TXN = 2*HALF//TILE      # 147 x 147 tiles
    R12 = 50
    OLD_HALF = 63000                     # the October square (lon 113.4405 - 114.6636, lat 22.0871 - 23.2249)
else:
    BD = ROOT + 'hkdata/'; OUT = ROOT + 'gbareal/out/'; DATA = ROOT + 'gbareal/data/'; DEM = ROOT + 'gbadata/terrain/'
    PBF = DATA + 'gba.osm.pbf'          # osmium extract -b 113.48,22.08,114.67,23.22 of hkdata/guangdong.osm.pbf (complete ways)
    PBFS = [PBF]
    HALF, CELL, N = 63000, 50, 2520      # 50 m engine cells (N*N must stay near the Hong Kong map's 2240^2: browser memory)
    TS, TN = 70, 1801                    # 70 m terrain grid, as Hong Kong
    TILE = 2000; TXN = 2*HALF//TILE      # 63 x 63 tiles
    R12 = 25                             # the fine water / land rasters (Hong Kong: 12 m; 25 m here: 5040^2 px)
    OLD_HALF = HALF
assert N == 2*HALF//CELL and TN == 2*HALF//TS + 1
BBOX = (LON0 - HALF/MX - 0.01, LAT0 - HALF/MY - 0.01, LON0 + HALF/MX + 0.01, LAT0 + HALF/MY + 0.01)   # lon/lat with a margin
def w(lon, lat): return ((lon - LON0)*MX, (lat - LAT0)*MY)
def ll(x, y): return (LON0 + x/MX, LAT0 + y/MY)
def proj(g): return stransform(lambda x, y, z=None: ((np.asarray(x) - LON0)*MX, (np.asarray(y) - LAT0)*MY), g)
def load(name): return pickle.load(open(OUT + name, 'rb'))
def save(obj, name): pickle.dump(obj, open(OUT + name, 'wb'), protocol=4)
# regions: 0 Hong Kong, 1 Shenzhen (without the Shenshan cooperation zone), 2 Dongguan, 3 other (Macau, Zhuhai, Zhongshan, Guangzhou,
# Huizhou: context like Shenzhen was in the Hong Kong map). Polygons (metres, this frame) in land.pkl: 'hk', 'sz', 'dg', 'core'.
REG_NAMES = ['hk', 'sz', 'dg', 'other', 'gz']      # gz (region 4): Guangzhou (frame gz only); 'core' = hk + sz + dg (+ gz)
