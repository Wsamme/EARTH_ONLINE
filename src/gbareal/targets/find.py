# Find OSM objects by name in the Greater Bay build data (gbareal/out, read only) for new landmark targets.
# usage: python3 find.py <regex> [<regex> ...]      (TOP=n results per pattern, default 5; BOX=lon0,lat0,lon1,lat1 to restrict)
# -> kind (b building / a area / n node), id (w/r/n), names, height/levels, lat, lon (footprint centroid), area m2, type, region
# First run writes names.pkl here (all named buildings / areas / nodes, lon/lat WKB; ~1 min, ~1 GB peak: run it through lm33/kit/heavy.sh).
import sys, re, os, pickle
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..'); import common as C
import shapely.wkb
from shapely.geometry import Point
HERE = os.path.dirname(os.path.abspath(__file__)) + '/'
NK = ('name', 'name:en', 'name:zh', 'name:zh-Hans', 'name:zh-Hant', 'alt_name', 'official_name', 'old_name', 'short_name')
KEEP = NK + ('height', 'building:levels', 'building', 'amenity', 'tourism', 'leisure', 'historic', 'man_made', 'landuse', 'railway', 'aeroway', 'bridge', 'natural', 'place', 'religion', 'building:part', 'station')
def nm(t): return ' | '.join(t[k] for k in NK if t.get(k))
if not os.path.exists(HERE + 'names.pkl'):
    R = []
    for kind, f in (('b', 'raw_bld.pkl'), ('a', 'raw_areas.pkl')):
        for oid, fw, t, wk in pickle.load(open(C.OUT + f, 'rb')):
            if any(t.get(k) for k in NK): R.append((kind, ('w' if fw else 'r') + str(oid), {k: t[k] for k in KEEP if k in t}, wk))
    for t, (lon, lat) in pickle.load(open(C.OUT + 'raw_nodes.pkl', 'rb')):
        if any(t.get(k) for k in NK): R.append(('n', 'n', {k: t[k] for k in KEEP if k in t}, Point(lon, lat).wkb))
    pickle.dump(R, open(HERE + 'names.pkl', 'wb'), protocol=4); print('index', len(R))
R = pickle.load(open(HERE + 'names.pkl', 'rb'))
box = [float(v) for v in os.environ['BOX'].split(',')] if os.environ.get('BOX') else None
pats = [re.compile(p, re.I) for p in sys.argv[1:]]
TOP = int(os.environ.get('TOP', '5'))
for p in pats:
    m = []
    for kind, oid, t, wk in R:
        if not p.search(nm(t)): continue
        g = shapely.wkb.loads(wk)
        c = g.centroid
        if box and not (box[0] <= c.x <= box[2] and box[1] <= c.y <= box[3]): continue
        a = C.proj(g).area if kind != 'n' else 0
        m.append((a, kind, oid, t, c))
    m.sort(key=lambda r: -r[0])
    print('##', p.pattern, len(m))
    for a, kind, oid, t, c in m[:TOP]:
        h = t.get('height') or (t.get('building:levels') and t['building:levels'] + 'L') or ''
        typ = t.get('building') or t.get('amenity') or t.get('tourism') or t.get('leisure') or t.get('historic') or t.get('man_made') or t.get('railway') or t.get('aeroway') or t.get('landuse') or t.get('natural') or ''
        print('%s:%s\t%s\th=%s\t%.6f,%.6f\t%dm2\t%s' % (kind, oid, nm(t)[:80], h, c.y, c.x, a, typ))
