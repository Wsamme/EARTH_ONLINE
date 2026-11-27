# load stage_sz.pkl with spatial indexes (shapely)
import pickle
from shapely.geometry import Polygon, LineString, Point, box
from shapely.strtree import STRtree
S = pickle.load(open('/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/lm50/sz/stage_sz.pkl', 'rb')); F = S['frame']
def w(lon, lat): return ((lon - F['lon0'])*F['MX'], (lat - F['lat0'])*F['MY'])
def ll(x, y): return (y/F['MY'] + F['lat0'], x/F['MX'] + F['lon0'])
G = []
for b in S['bld']:
    try: g = Polygon(b['rings'][0], b['rings'][1:]).buffer(0)
    except Exception: g = Polygon(b['rings'][0]).buffer(0)
    G.append(g)
BT = STRtree(G)
LG = [LineString(l['P']) if len(l['P']) > 1 else Point(l['P'][0]) for l in S['lines']]
LT = STRtree(LG)
H = S['H']; HALF, TS, TN = F['HALF'], F['TS'], F['TN']
def ground(x, y):
    fx = (x + HALF)/TS; fy = (y + HALF)/TS; i = min(TN - 2, max(0, int(fx))); j = min(TN - 2, max(0, int(fy))); u = fx - i; v = fy - j
    return float(H[j, i]*(1 - u)*(1 - v) + H[j, i + 1]*u*(1 - v) + H[j + 1, i]*(1 - u)*v + H[j + 1, i + 1]*u*v)
def at(lat, lon, r=30):
    x, y = w(lon, lat); q = Point(x, y).buffer(r)
    return sorted([(S['bld'][int(i)], G[int(i)]) for i in BT.query(q, predicate='intersects')], key=lambda t: -t[0]['h'])
