# plan map of a site: keep (blue), buildings (grey, names), areas (water blue / green), roads, pois  -> png
import json, sys, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from shapely.geometry import Polygon, Point
plt.rcParams['font.sans-serif']=['Noto Sans CJK SC','WenQuanYi Zen Hei','DejaVu Sans']
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
T={t['key']:t for t in json.load(open(SC+'gba/targets.json'))['groups']['szoct']}
A=json.load(open(SC+'gba/szoct/tools/areas.json')); R=json.load(open(SC+'gba/ref_szoct.json'))['targets']
X0,Y0=114.0520475,22.6560705
def W(lon,lat): return ((lon-X0)*103014.2,(lat-Y0)*110734.9)
key=sys.argv[1]; t=T[key]; ax,ay=W(t['lon'],t['lat']); out=sys.argv[2]
def L(lon,lat): x,y=W(lon,lat); return (x-ax, -(y-ay))
site=[a for a in A['areas'] if a['id']==t['osm']][0]
K=Polygon([L(*p) for p in site['rings'][0]]); bx=K.bounds; pad=60
fig=plt.figure(figsize=(14,14*(bx[3]-bx[1]+2*pad)/(bx[2]-bx[0]+2*pad))); a=fig.add_axes([0,0,1,1]); a.set_aspect('equal')
a.set_xlim(bx[0]-pad,bx[2]+pad); a.set_ylim(bx[3]+pad,bx[1]-pad)
for ar in A['areas']:
    for r in ar['rings']:
        P=[L(*p) for p in r]; tg=ar['t']
        col='#9cc3e0' if tg.get('natural')=='water' or tg.get('water') else '#b7d9a0' if tg.get('natural') in('wood','scrub','grassland') or tg.get('landuse') in('forest','grass') or tg.get('leisure') in('garden','park','pitch') else None
        if col: a.fill(*zip(*P),color=col,alpha=0.6,lw=0)
        elif ar['id']!=t['osm']: a.plot(*zip(*P),color='#c9a',lw=0.6)
a.plot(*K.exterior.xy,color='b',lw=2)
for rd in R[key]['roads']:
    xs,ys=zip(*rd['pts']); a.plot(xs,ys,color='#888' if rd['cls']>=11 else '#c55',lw=0.5 if rd['cls']>=11 else 2)
for b in R[key]['buildings']:
    xs,ys=zip(*b['ring']); a.fill(xs,ys,color='#777',alpha=0.45); 
    nm=b.get('zh') or b.get('name')
    if K.buffer(20).contains(Point(b['centroid'])): a.text(*b['centroid'],(nm or '')+' %.0f'%b['h'],fontsize=6,color='k')
for n in A['nodes']:
    p=L(*n['at'])
    if K.buffer(30).contains(Point(p)) and n['t'].get('name'): a.plot(*p,'r.',ms=3); a.text(p[0],p[1],n['t']['name'],fontsize=6,color='r')
for g in range(-2000,2001,100): a.axvline(g,color='#eee',lw=0.4,zorder=-1); a.axhline(g,color='#eee',lw=0.4,zorder=-1)
fig.savefig(out,dpi=72)
