# geo.py lat,lon id1 id2 ... : local coords of OSM features (east extract) -> JSON {id: [[x,z],...]}
import json, sys
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
anc = [float(v) for v in sys.argv[1].split(',')]; want = set(sys.argv[2:])
def loc(q): return [round((q[0] - anc[1])*103014.2, 1), round(-(q[1] - anc[0])*110734.9, 1)]
out = {}
for line in open(SC + 'gba/szeast/osm/east.geojsonseq'):
    f = json.loads(line.strip('\x1e\n'))
    if f.get('id') not in want: continue
    g = f['geometry']; c = g['coordinates']
    if g['type'] == 'Point': out[f['id']] = [loc(c)]
    elif g['type'] == 'LineString': out[f['id']] = [loc(q) for q in c]
    elif g['type'] == 'Polygon': out[f['id']] = [loc(q) for q in c[0]]
    elif g['type'] == 'MultiPolygon': out[f['id']] = [[loc(q) for q in P[0]] for P in c]
print(json.dumps(out))
