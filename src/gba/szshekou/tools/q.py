import json,sys
# usage: q.py lat lon radius_m [filter-substring]
lat0,lon0,R=map(float,sys.argv[1:4]); flt=sys.argv[4] if len(sys.argv)>4 else ''
import math
def loc(c): return ((c[0]-lon0)*103014.2, -(c[1]-lat0)*110734.9)
for line in open('sk.geojsonseq'):
    f=json.loads(line.strip('\x1e\n')); p=f['properties']; g=f['geometry']
    c=g['coordinates']
    pts=[]
    def walk(c):
        if isinstance(c[0],(int,float)): pts.append(c)
        else:
            for x in c: walk(x)
    walk(c)
    L=[loc(q) for q in pts]
    near=min(math.hypot(*q) for q in L)
    if near>R: continue
    tags={k:v for k,v in p.items() if not k.startswith('@') and not (k.startswith('name:') and k!='name:en') and k not in ('source','ref','wikidata','wikipedia','check_date')}
    s=json.dumps(tags,ensure_ascii=False)
    if flt and not any(x in s for x in flt.split('|')): continue
    xs=[q[0] for q in L]; zs=[q[1] for q in L]
    print(p['@type'][0]+str(p['@id']),g['type'][:4],len(L),'x[%.0f,%.0f] z[%.0f,%.0f]'%(min(xs),max(xs),min(zs),max(zs)),s[:260])
