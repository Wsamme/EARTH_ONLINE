# q.py <regex> [lat,lon anchor] : OSM features (east extract) whose tags match; prints id, geom type, tags, local centroid / extent
import json, sys, re, math, os
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
pat = re.compile(sys.argv[1]); anc = [float(v) for v in sys.argv[2].split(',')] if len(sys.argv) > 2 else None
def loc(lon, lat): return ((lon - anc[1])*103014.2, -(lat - anc[0])*110734.9)
def pts(c):
    if isinstance(c[0], (int, float)): yield c
    else:
        for x in c: yield from pts(x)
for line in open(SC + 'gba/szeast/osm/east.geojsonseq'):
    f = json.loads(line.strip('\x1e\n')); p = f['properties']; s = json.dumps(p, ensure_ascii=False)
    if not pat.search(s): continue
    P = list(pts(f['geometry']['coordinates'])); cx = sum(q[0] for q in P)/len(P); cy = sum(q[1] for q in P)/len(P)
    ex = ''
    if anc and os.environ.get('R'):
        c0 = loc(cx, cy)
        if math.hypot(*c0) > float(os.environ['R']): continue
    if anc:
        L = [loc(*q[:2]) for q in P]; c = loc(cx, cy); ex = 'c=(%.0f,%.0f) x[%.0f,%.0f] z[%.0f,%.0f] n=%d' % (c[0], c[1], min(q[0] for q in L), max(q[0] for q in L), min(q[1] for q in L), max(q[1] for q in L), len(L))
    print(f.get('id'), f['geometry']['type'], s[:260], '%.6f,%.6f' % (cy, cx), ex)
