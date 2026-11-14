# ring.py lat lon id1 id2 ...  -> rings (local metres) of OSM ways/relations (first outer ring) from sk.geojsonseq
import json,sys
lat0,lon0=float(sys.argv[1]),float(sys.argv[2]); ids=set(sys.argv[3:])
def loc(c): return [round((c[0]-lon0)*103014.2,1), round(-(c[1]-lat0)*110734.9,1)]
for line in open('sk.geojsonseq'):
    f=json.loads(line.strip('\x1e\n')); p=f['properties']; g=f['geometry']
    key=p['@type'][0]+str(p['@id'])
    if key not in ids: continue
    c=g['coordinates']
    if g['type']=='LineString': R=[c]
    elif g['type']=='Polygon': R=c
    elif g['type']=='MultiPolygon': R=[r for poly in c for r in poly]
    else: R=[[c]]
    for r in R: print(key,g['type'],json.dumps([loc(q) for q in r]))
