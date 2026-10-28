# szcivic data: footprints / parts from ref_szcivic.json, park outlines / water / woods from areas.json -> the `const D = ...` line of szcivic.js
import json, re, sys
from shapely.geometry import Polygon, Point
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad'
T=json.load(open(SC+'/gba/ref_szcivic.json'))['targets']; A=json.load(open(SC+'/gba/szcivic/tools/areas.json'))
TG={t['key']:t for t in json.load(open(SC+'/gba/targets.json'))['groups']['szcivic']}
r1=lambda P:[[round(x,1),round(z,1)] for x,z in P]
def bld(key, osm): return [b for b in T[key]['buildings'] if b['osm']==osm][0]
def bparts(key, osm): b=bld(key, osm); return {'ring':r1(b['ring']), 'parts':[{'b':p['base'],'t':p['top'],'r':r1(p['ring'])} for p in b.get('parts',[])]}
def loc(key):
    a=T[key]['anchor']; return lambda q:((q[0]-a['lon'])*103014.2, -(q[1]-a['lat'])*110734.9)
def area_rings(key, ids=None, pred=None, near=None, simp=0.0, clip=None):
    L=loc(key); out=[]
    for a in A:
        if ids and a['id'] not in ids: continue
        if pred and not pred(a['t']): continue
        for rr in a['r']:
            ext=rr[:rr.index(None)] if None in rr else rr
            P=[L(q) for q in ext]
            if near is not None and not Polygon(P).buffer(0).intersects(near): continue
            g=Polygon(P).buffer(0)
            if clip is not None: g=g.intersection(clip)
            if simp: g=g.simplify(simp)
            if g.is_empty or g.area<30: continue
            gs=[g] if g.geom_type=='Polygon' else [q for q in g.geoms if q.geom_type=='Polygon']
            for gg in gs: out.append({'id':a['id'],'n':a['t'].get('name',''),'k':a['t'].get('natural') or a['t'].get('leisure') or a['t'].get('landuse') or a['t'].get('water') or a['t'].get('man_made') or '', 'r':r1(list(gg.exterior.coords)[:-1])})
    return out
D={'a':{k:[TG[k]['lat'],TG[k]['lon'],TG[k]['r']] for k in TG}}
D['civic']=bparts('szcivic','r10837975')
D['lib']=bparts('szlibrary','w146867406'); D['link']=r1(bld('szlibrary','w146867408')['ring'])
D['ch']=bparts('szconcerthall','w146867409')
D['moc']=bparts('szmocape','w456331569')
D['cp']=bparts('szchildpalace','w269895570')
D['bc']=bparts('szbookcity','w925221215')
D['ft']=bparts('szfutianport','w130965710')
D['ftb']={'lo':[[85.9,294.6],[69.7,39.3]], 'up':[[68.0,39.5],[84.1,294.7]], 'ylo':13.2, 'yup':19.8}
D['hg']=bparts('szhuanggang','w1493617272'); D['hg2']=bparts('szhuanggang','w1499360238')
# sites
def site(key, osm, simp):
    keep=area_rings(key, ids={osm}, simp=simp)
    keep.sort(key=lambda e:-Polygon(e['r']).area)
    K=Polygon(keep[0]['r'])
    return keep, K
for key, osm, nm in (('szlianhuashan','w41281446','lhs'), ('szcentralpark','r17354200','cpk'), ('szmangrove','w545246937','mg')):
    keep,K=site(key, osm, 1.5)
    K0=Polygon(keep[0]['r'])
    if nm=='lhs':   # leave the Guan Shanyue Art Museum (not part of this site) out of the keep
        gm=[b for b in T[key]['buildings'] if b['osm']=='w170144292'][0]
        from shapely.geometry import LineString
        from shapely.ops import nearest_points
        M=Polygon(gm['ring']).buffer(6, join_style=2); c=M.centroid; q=nearest_points(K0.exterior, c)[0]
        M=M.union(LineString([(c.x,c.y),(q.x+(q.x-c.x)*0.05,q.y+(q.y-c.y)*0.05)]).buffer(2.5))
        K0=K0.difference(M); K0=max(K0.geoms, key=lambda p:p.area) if K0.geom_type!='Polygon' else K0
        keep[0]['r']=r1(list(K0.exterior.coords)[:-1])
    print(nm, 'keep areas', [round(Polygon(e['r']).area) for e in keep])
    S={'keep':keep[0]['r'], 'more':[e['r'] for e in keep[1:]]}
    allK=[Polygon(e['r']) for e in keep]
    zone=allK[0]
    for p in allK[1:]: zone=zone.union(p)
    S['water']=[e for e in area_rings(key, pred=lambda t:t.get('natural')=='water' or t.get('water') or t.get('waterway')=='riverbank', near=zone.buffer(60), simp=1.0)]
    S['green']=[e for e in area_rings(key, pred=lambda t:t.get('natural') in ('wood','forest','scrub','wetland') or t.get('landuse') in ('forest',) or t.get('wetland'), near=zone.buffer(150 if nm=='mg' else 20), simp=2.0, clip=zone.buffer(150 if nm=='mg' else 0))]
    S['lawn']=[e for e in area_rings(key, pred=lambda t:t.get('landuse') in ('grass',) or t.get('leisure') in ('garden','pitch') or t.get('natural')=='grassland', near=zone, simp=1.0)]
    S['plaza']=[e for e in area_rings(key, pred=lambda t:t.get('highway')=='pedestrian' or t.get('place')=='square' or (t.get('leisure')=='park' and t.get('tourism')=='viewpoint'), near=zone, simp=0.5)]
    S['bld']=[{'r':r1(b['ring']),'h':b['h'],'n':b.get('zh') or b.get('name') or '','osm':b['osm']} for b in T[key]['buildings'] if Polygon(S['keep']).contains(Point(b['centroid']))]
    S['paths']=[{'c':r['cls'],'p':r1(r['pts']),'b':1 if r.get('bridge') else 0,'e':r.get('elev')} for r in T[key]['roads'] if r['cls'] in (11,12,17) and zone.buffer(5).intersects(Polygon(r['pts']).buffer(0) if len(r['pts'])>=3 and False else Point(r['pts'][0]).buffer(1)) ]
    S['pois']=[{'n':p['name'],'t':p['tags'],'at':p['at']} for p in T[key]['pois'] if p['tags'] and zone.buffer(10).contains(Point(p['at'])) and not p['tags'].get('railway')]
    D[nm]=S
s=json.dumps(D,separators=(',',':'),ensure_ascii=False)
f=SC+'/gba/szcivic/szcivic.js'; js=open(f).read()
js=re.sub(r'^const D = .*$', lambda m:'const D = '+s+';', js, count=1, flags=re.M)
open(f,'w').write(js); print('D', len(s), {k:len(json.dumps(v)) for k,v in D.items()})
for nm in ('lhs','cpk','mg'): print(nm, {k:len(v) for k,v in D[nm].items()}, [b['n'] for b in D[nm]['bld']][:30])
