# plan.py key R out.png [osm-extra-filter]  -- plot ref buildings (with h labels), roads, and raw OSM features of interest near the anchor
import json,sys,math
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
k=sys.argv[1]; R=float(sys.argv[2]); out=sys.argv[3]
d=json.load(open('../../ref_szshekou.json')); t=d['targets'][k]
lat0=t['anchor']['lat']; lon0=t['anchor']['lon']
fig,ax=plt.subplots(figsize=(9,9),dpi=90)
def loc(c): return ((c[0]-lon0)*103014.2, -(c[1]-lat0)*110734.9)
# raw osm
for line in open('sk.geojsonseq'):
    f=json.loads(line.strip('\x1e\n')); p=f['properties']; g=f['geometry']
    if g['type'] not in ('LineString','Polygon','MultiPolygon','Point'): continue
    tags=p
    col=None
    if 'building' in p or 'building:part' in p: continue
    if p.get('natural')=='coastline': col='b'
    elif p.get('natural')=='water' or p.get('water'): col='c'
    elif p.get('barrier') in ('city_wall','wall'): col='m'
    elif p.get('historic'): col='r'
    elif p.get('man_made') in ('crane','pier'): col='orange'
    elif p.get('leisure') in ('park','garden') or p.get('landuse') in ('grass',): col='g'
    elif 'highway' in p: col='0.6'
    elif p.get('tourism') or p.get('amenity')=='place_of_worship': col='purple'
    if not col: continue
    def lines(c,typ):
        if typ=='Point': return [[c]]
        if typ=='LineString': return [c]
        if typ=='Polygon': return c
        return [r for poly in c for r in poly]
    for L in lines(g['coordinates'],g['type']):
        P=[loc(q) for q in L]
        if min(math.hypot(*q) for q in P)>R*1.2: continue
        xs=[q[0] for q in P]; zs=[q[1] for q in P]
        if g['type']=='Point':
            ax.plot(xs,zs,'o',color=col,ms=4); ax.text(xs[0],zs[0],(p.get('name') or p.get('historic') or p.get('man_made') or '')[:12],fontsize=6,color=col)
        else: ax.plot(xs,zs,'-',color=col,lw=0.7 if col=='0.6' else 1.2)
for b in t['buildings']:
    P=b['ring']
    if min(math.hypot(*q) for q in P)>R*1.2: continue
    xs=[q[0] for q in P]+[P[0][0]]; zs=[q[1] for q in P]+[P[0][1]]
    ax.fill(xs,zs,color='0.8',ec='k',lw=0.5)
    c=b['centroid']; ax.text(c[0],c[1],'%g'%b['h'],fontsize=5,ha='center')
ax.set_xlim(-R,R); ax.set_ylim(R,-R); ax.set_aspect('equal'); ax.grid(lw=0.3)
ax.set_title(k+' (+x east, +z south, down=south)')
plt.savefig(out); print('ok')
