# lm50 Tokyo: OSM element (Overpass "out geom") -> shapely geometry in the app's metres (x east, y north)
import collections
import ty50_app as A
from shapely.geometry import Polygon, LineString
from shapely.ops import unary_union
def geom(e):
    """OSM element (out geom) -> shapely polygon in app metres (x east, y north) or LineString for open ways"""
    if e['type'] == 'way':
        P = [A.w(p['lon'], p['lat']) for p in e.get('geometry', [])]
        if len(P) >= 4 and P[0] == P[-1]: return Polygon(P).buffer(0)
        return LineString(P) if len(P) >= 2 else None
    outs, ins = [], []
    rings = collections.defaultdict(list)
    for m in e.get('members', []):
        if m.get('type') != 'way' or not m.get('geometry'): continue
        P = [A.w(p['lon'], p['lat']) for p in m['geometry']]
        (ins if m.get('role') == 'inner' else outs).append(P)
    def close(seg):     # join open member ways into rings
        segs = [s[:] for s in seg]; R = []
        while segs:
            r = segs.pop(0)
            while r[0] != r[-1]:
                for i, s in enumerate(segs):
                    if s[0] == r[-1]: r += s[1:]; segs.pop(i); break
                    if s[-1] == r[-1]: r += s[::-1][1:]; segs.pop(i); break
                else: break
            if len(r) >= 4 and r[0] == r[-1]: R.append(Polygon(r).buffer(0))
        return R
    O_ = close(outs); I_ = close(ins)
    if not O_: return None
    g = unary_union(O_)
    if I_: g = g.difference(unary_union(I_))
    return g
