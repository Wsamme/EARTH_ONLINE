# vet points against the existing NYC landmark hulls (hulls_existing.json from ny50tool.js hulls) and site keep polygons
import json, math
from shapely.geometry import Polygon, Point
MX, MY, LON0, LAT0 = 84516.0, 111048.0, -73.98, 40.70
H = json.load(open(__import__('os').path.dirname(__import__('os').path.abspath(__file__)) + '/ny50_hulls_existing.json'))
def w(lat, lon): return ((lon - LON0)*MX, (lat - LAT0)*MY)
POLY = []
for k, o in H['landmarks'].items():
    if o['hull'] and len(o['hull']) >= 3: POLY.append((k, o['mod'], Polygon([w(a, b) for a, b in o['hull']])))
for k, s in H['sites'].items():
    if s['keep']:
        x0, y0 = w(s['lat'], s['lon']); POLY.append((k, s['mod'], Polygon([(x0 + x, y0 - z) for x, z in s['keep']]).buffer(0)))
from shapely.strtree import STRtree
T = STRtree([p for _, _, p in POLY])
def vet(lat, lon, geom=None):
    """-> (inside_key or None, nearest_key, distance m) ; geom: shapely polygon in NYC metres (optional, tests overlap > 30 %)"""
    P = Point(w(lat, lon)); g = geom if geom is not None else P
    best = (None, 1e9); inside = None
    for i in T.query(g.buffer(400)):
        k, m, poly = POLY[int(i)]; d = poly.distance(P)
        if geom is not None and poly.intersects(geom) and poly.intersection(geom).area > 0.3*geom.area: inside = inside or k
        if geom is None and poly.contains(P): inside = inside or k
        if d < best[1]: best = (k, d)
    return inside, best[0], round(best[1])
