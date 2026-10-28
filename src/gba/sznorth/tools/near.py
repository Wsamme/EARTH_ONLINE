# list named OSM objects (areas/buildings/nodes from gbareal/targets/names.pkl, read only) near each sznorth target, local metres
import pickle, json, sys, shapely.wkb
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad'
T={t['key']:t for t in json.load(open(SC+'/gba/targets.json'))['groups']['sznorth']}
R=pickle.load(open(SC+'/gbareal/targets/names.pkl','rb'))
KX,KY=103014.2,110734.9
out={}
for k,t in T.items():
  out[k]=[]
rad={k:max(250,T[k]['r']*1.8) for k in T}
for kind,oid,tags,wk in R:
  g=shapely.wkb.loads(wk); c=g.centroid
  for k,t in T.items():
    dx=(c.x-t['lon'])*KX; dz=-(c.y-t['lat'])*KY
    if abs(dx)<rad[k] and abs(dz)<rad[k]:
      rings=[]
      if g.geom_type in('Polygon','MultiPolygon'):
        for p in (g.geoms if g.geom_type=='MultiPolygon' else [g]):
          rings.append([[round((x-t['lon'])*KX,1),round(-(y-t['lat'])*KY,1)] for x,y in p.exterior.coords])
      out[k].append({'kind':kind,'id':oid,'tags':tags,'c':[round(dx,1),round(dz,1)],'rings':rings})
json.dump(out,open(SC+'/gba/sznorth/tmp/near.json','w'),ensure_ascii=False)
for k in out: print(k,len(out[k]))
