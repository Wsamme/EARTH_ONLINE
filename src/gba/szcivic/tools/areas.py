# extract OSM areas (parks, water, wetland, grass, woods, piers, pitches ...) in a box round the szcivic sites -> areas.json (lon/lat rings)
import pickle, json, sys, shapely.wkb
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad'
B=(114.005,22.495,114.105,22.575)
KEYS=('leisure','natural','landuse','water','waterway','man_made','amenity','tourism','place','highway','area','wetland','name','name:en','building','historic','surface')
out=[]
for oid,fw,t,wk in pickle.load(open(SC+'/gbareal/out/raw_areas.pkl','rb')):
    g=shapely.wkb.loads(wk); b=g.bounds
    if b[2]<B[0] or b[0]>B[2] or b[3]<B[1] or b[1]>B[3]: continue
    if g.area<2e-9: continue
    tt={k:t[k] for k in KEYS if k in t}
    if not any(k in tt for k in ('leisure','natural','landuse','water','waterway','man_made','amenity','tourism','area','wetland','place','highway')): continue
    polys=[g] if g.geom_type=='Polygon' else list(getattr(g,'geoms',[]))
    rings=[]
    for p in polys:
        if p.geom_type!='Polygon': continue
        rings.append([[round(x,7),round(y,7)] for x,y in p.exterior.coords]+[None]+[[ [round(x,7),round(y,7)] for x,y in h.coords] for h in p.interiors])
    out.append({'id':('w' if fw else 'r')+str(oid),'t':tt,'r':rings})
json.dump(out,open(SC+'/gba/szcivic/tools/areas.json','w'),ensure_ascii=False)
print(len(out))
