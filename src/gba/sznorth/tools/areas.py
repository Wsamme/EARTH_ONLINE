# all OSM areas (raw_areas.pkl, read only) near each sznorth target, local metres (+x east, +z south)
import pickle, json, shapely.wkb
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad'
T={t['key']:t for t in json.load(open(SC+'/gba/targets.json'))['groups']['sznorth']}
KX,KY=103014.2,110734.9
rad={k:max(250,T[k]['r']*1.6) for k in T}
out={k:[] for k in T}
for oid,fw,tags,wk in pickle.load(open(SC+'/gbareal/out/raw_areas.pkl','rb')):
  g=shapely.wkb.loads(wk); b=g.bounds
  for k,t in T.items():
    x0=(b[0]-t['lon'])*KX; x1=(b[2]-t['lon'])*KX; z0=-(b[3]-t['lat'])*KY; z1=-(b[1]-t['lat'])*KY
    R=rad[k]
    if x1<-R or x0>R or z1<-R or z0>R: continue
    if (x1-x0)>8*R: continue
    rings=[]
    for p in (g.geoms if g.geom_type=='MultiPolygon' else [g]):
      if p.geom_type!='Polygon': continue
      rings.append([[round((x-t['lon'])*KX,1),round(-(y-t['lat'])*KY,1)] for x,y in p.exterior.coords])
    out[k].append({'id':('w' if fw else 'r')+str(oid),'tags':tags,'rings':rings})
json.dump(out,open(SC+'/gba/sznorth/tmp/areas.json','w'),ensure_ascii=False)
for k in out: print(k,len(out[k]))
