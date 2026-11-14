# extract OSM areas in a box round the dgcity targets -> areas.json (lon/lat rings) + the target plots from raw_bld
import pickle, json, shapely.wkb
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad'
B=(113.725,23.000,113.790,23.055)
KEYS=('leisure','natural','landuse','water','waterway','man_made','amenity','tourism','place','highway','area','name','name:en','building','historic','surface','height','building:levels','sport')
WANT={'w619355200','w520278681','w619355190','w520436667','w1387794621','w1077123840','w797864952','w520439671'}
def rings_of(g):
    polys=[g] if g.geom_type=='Polygon' else list(getattr(g,'geoms',[]))
    R=[]
    for p in polys:
        if p.geom_type!='Polygon': continue
        R.append([[round(x,7),round(y,7)] for x,y in p.exterior.coords]+[None]+[[ [round(x,7),round(y,7)] for x,y in h.coords] for h in p.interiors])
    return R
out=[]
for src in ('raw_areas.pkl',):
  for rec in pickle.load(open(SC+'/gbareal/out/'+src,'rb')):
    oid,fw,t,wk=rec[:4]
    g=shapely.wkb.loads(wk); b=g.bounds
    if b[2]<B[0] or b[0]>B[2] or b[3]<B[1] or b[1]>B[3]: continue
    if g.area<1e-10: continue
    tt={k:t[k] for k in KEYS if k in t}
    out.append({'id':('w' if fw else 'r')+str(oid),'t':tt,'r':rings_of(g)})
print('areas',len(out))
bl=pickle.load(open(SC+'/gbareal/out/raw_bld.pkl','rb'))
print(type(bl), len(bl))
x=bl[0] if isinstance(bl,list) else None
print(repr(x)[:300])
json.dump(out,open(SC+'/gba/dgcity/tools/areas.json','w'),ensure_ascii=False)
