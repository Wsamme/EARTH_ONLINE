# list raw OSM ways / areas / nodes in a lon/lat box (read only)  usage: python3 probe.py lon0 lat0 lon1 lat1 [skipre]
import sys, pickle, re
sys.path.insert(0, '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/gbareal')
import common as C, shapely.wkb
b = list(map(float, sys.argv[1:5])); skip = re.compile(sys.argv[5]) if len(sys.argv) > 5 else None
inb = lambda lon, lat: b[0] <= lon <= b[2] and b[1] <= lat <= b[3]
for oid, fw, t, wk in pickle.load(open(C.OUT + 'raw_areas.pkl', 'rb')):
    g = shapely.wkb.loads(wk); c = g.centroid
    if inb(c.x, c.y): print('A', ('w' if fw else 'r') + str(oid), round(C.proj(g).area), '%.6f,%.6f' % (c.y, c.x), t)
for oid, fw, t, wk in pickle.load(open(C.OUT + 'raw_bld.pkl', 'rb')):
    g = shapely.wkb.loads(wk); c = g.centroid
    if inb(c.x, c.y): print('B', ('w' if fw else 'r') + str(oid), round(C.proj(g).area), '%.6f,%.6f' % (c.y, c.x), t)
for t, (lon, lat) in pickle.load(open(C.OUT + 'raw_nodes.pkl', 'rb')):
    if inb(lon, lat): print('N', '%.6f,%.6f' % (lat, lon), t)
for wid, t, cs in pickle.load(open(C.OUT + 'raw_ways.pkl', 'rb')):
    if any(inb(*p) for p in cs[::max(1, len(cs)//20)] + [cs[-1]]):
        s = str(t)
        if skip and skip.search(s): continue
        print('W', wid, len(cs), '%.6f,%.6f -> %.6f,%.6f' % (cs[0][1], cs[0][0], cs[-1][1], cs[-1][0]), t)
