# extract OSM areas + named nodes in the OCT / Xili boxes (read-only on gbareal/out) -> szoct/tools/areas.json
import pickle, json, sys, shapely.wkb
OUT='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/gbareal/out/'
BOXES=[(113.955,22.518,114.000,22.550),(113.950,22.580,114.015,22.615)]
def inb(x,y): return any(b[0]<=x<=b[2] and b[1]<=y<=b[3] for b in BOXES)
A=[]
for oid,fw,t,wk in pickle.load(open(OUT+'raw_areas.pkl','rb')):
    g=shapely.wkb.loads(wk); c=g.centroid
    if not inb(c.x,c.y): continue
    geoms=list(g.geoms) if g.geom_type.startswith('Multi') else [g]
    rings=[[[round(x,6),round(y,6)] for x,y in gg.exterior.coords] for gg in geoms if gg.geom_type=='Polygon']
    A.append({'id':('w' if fw else 'r')+str(oid),'t':t,'rings':rings})
N=[]
for t,(lon,lat) in pickle.load(open(OUT+'raw_nodes.pkl','rb')):
    if inb(lon,lat) and (t.get('name') or t.get('tourism') or t.get('man_made')): N.append({'t':t,'at':[round(lon,6),round(lat,6)]})
json.dump({'areas':A,'nodes':N},open(sys.argv[1],'w'),ensure_ascii=False)
print(len(A),len(N))
