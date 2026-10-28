# szoct site data (local metres round each target anchor, +x east, +z south) -> tools/data.json, read by mk.py
import json
from shapely.geometry import Polygon, Point, LineString, MultiPolygon
from shapely.ops import unary_union
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
T={t['key']:t for t in json.load(open(SC+'gba/targets.json'))['groups']['szoct']}
A=json.load(open(SC+'gba/szoct/tools/areas.json')); R=json.load(open(SC+'gba/ref_szoct.json'))['targets']
X0,Y0=114.0520475,22.6560705
def W(lon,lat): return ((lon-X0)*103014.2,(lat-Y0)*110734.9)
r1=lambda v: round(v,1)
def ring(P, tol=0.6):
    P=P.simplify(tol, preserve_topology=True)
    c=list(P.exterior.coords)[:-1]
    if P.exterior.is_ccw: pass
    return [[r1(x),r1(y)] for x,y in c]
def polys(g):
    if g.is_empty: return []
    if g.geom_type=='Polygon': return [g]
    if hasattr(g,'geoms'): return [p for p in g.geoms if p.geom_type=='Polygon']
    return []
SITES=['szwindow','szsplendid','szhappyvalley','szocth','szoctloft','szsafari','szsustech','szhitsz']
EXTRA={'szwindow':['w264194869']}   # the Louvre-pyramid entrance stands just outside the park polygon
OUT={}
for key in SITES:
    t=T[key]; ax,ay=W(t['lon'],t['lat'])
    L=lambda lon,lat:((W(lon,lat)[0]-ax), -(W(lon,lat)[1]-ay))
    site=[a for a in A['areas'] if a['id']==t['osm']][0]
    K=Polygon([L(*p) for p in site['rings'][0]]).buffer(0)
    blds=R[key]['buildings']
    ex=[b for b in blds if b['osm'] in EXTRA.get(key,[])]
    if ex: K=unary_union([K]+[Polygon(b['ring']).buffer(14, join_style=2) for b in ex]).buffer(0)
    if K.geom_type!='Polygon': K=max(polys(K), key=lambda p:p.area)
    K=Polygon(K.exterior)
    d={'keep':ring(K,1.0),'b':[],'w':[],'wood':[],'grass':[],'pitch':[],'track':[],'p':[],'poi':[]}
    for b in blds:
        if not (K.contains(Point(b['centroid'])) or b['osm'] in EXTRA.get(key,[])): continue
        P=Polygon(b['ring']).buffer(0)
        if P.area<12: continue
        d['b'].append({'id':b['osm'],'n':(b.get('zh') or b.get('name') or ''),'en':b.get('name') or '','h':b['h'],'fl':b['floors'],'t':b['type'],'a':round(P.area),'r':ring(P,0.4)})
    for a in A['areas']:
        if a['id']==t['osm']: continue
        tg=a['t']
        kind='pitch' if tg.get('leisure')=='pitch' else 'track' if tg.get('leisure')=='track' else 'w' if (tg.get('natural')=='water' or tg.get('water')) else 'wood' if (tg.get('natural') in ('wood','scrub') or tg.get('landuse')=='forest') else 'grass' if (tg.get('landuse') in ('grass','meadow') or tg.get('leisure') in ('garden','park') or tg.get('natural')=='grassland') else None
        if not kind: continue
        for rr in a['rings']:
            P=Polygon([L(*p) for p in rr]).buffer(0)
            for q in polys(P.intersection(K)):
                if q.area>=60: d[kind].append(ring(q,1.0))
    for rd in R[key]['roads']:
        if rd['cls'] not in (10,11,12) or rd['bridge']: continue
        ln=LineString(rd['pts']).intersection(K)
        for s in ([ln] if ln.geom_type=='LineString' else list(getattr(ln,'geoms',[]))):
            if s.geom_type=='LineString' and s.length>15: d['p'].append([[r1(x),r1(y)] for x,y in s.simplify(1.0).coords])
    for n in A['nodes']:
        p=L(*n['at'])
        if K.buffer(10).contains(Point(p)) and n['t'].get('name'): d['poi'].append([n['t']['name'],r1(p[0]),r1(p[1])])
    d['ground']=R[key]['ground']
    OUT[key]=d
    print(key,{k:len(v) if isinstance(v,list) else v for k,v in d.items()})
json.dump(OUT,open(SC+'gba/szoct/tools/data.json','w'),ensure_ascii=False,separators=(',',':'))
import os; print(os.path.getsize(SC+'gba/szoct/tools/data.json'))
# --- extra OSM features from the full extract (tools/osm/oct.geojsonseq = osmium extract of gbareal/data/gba.osm.pbf):
# Happy Valley's roller-coaster tracks (roller_coaster=track ways, layer), the drop tower node 太空梭, the water-park outline;
# Splendid China's Horse Battle Arena outline.
FEAT={}
for l in open(SC+'gba/szoct/tools/osm/oct.geojsonseq'):
    f=json.loads(l.strip('\x1e')); FEAT.setdefault(f['properties'].get('@id'),[]).append(f)
def locf(key, cs):
    t=T[key]; ax,ay=W(t['lon'],t['lat']); return [[r1(W(*c)[0]-ax), r1(-(W(*c)[1]-ay))] for c in cs]
def way(i, key):
    for f in FEAT.get(i,[]):
        if f['geometry']['type']=='LineString': return locf(key, f['geometry']['coordinates']), f['properties']
hv=OUT['szhappyvalley']
hv['bullet']=[{'pts':way(i,'szhappyvalley')[0],'layer':int(way(i,'szhappyvalley')[1].get('layer',0))} for i in (1426564270,1426564269,1426564271,1426564272,936620421)]
hv['milin']=[{'pts':way(i,'szhappyvalley')[0],'layer':int(way(i,'szhappyvalley')[1].get('layer',0))} for i in (1426564274,1426564275,1426564276,1426564273,1426564278)]
hv['drop']=[f for f in FEAT[6942405222]][0]['geometry']['coordinates']; hv['drop']=locf('szhappyvalley',[hv['drop']])[0]
hv['wpark']=way(1564674154,'szhappyvalley')[0][:-1]
OUT['szsplendid']['arena']=way(757864452,'szsplendid')[0][:-1]
json.dump(OUT,open(SC+'gba/szoct/tools/data.json','w'),ensure_ascii=False,separators=(',',':'))
print('extra', hv['drop'], len(hv['wpark']), len(OUT['szsplendid']['arena']))
