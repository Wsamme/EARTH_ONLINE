# plot a ref target with OSM areas: plot.py key out.png [halfsize cx cz]
import json, sys, matplotlib, warnings; warnings.filterwarnings('ignore')
matplotlib.use('Agg'); import matplotlib.pyplot as plt, numpy as np
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad'
R=json.load(open(SC+'/gba/ref_dgcity.json'))['targets'][sys.argv[1]]
A=json.load(open(SC+'/gba/dgcity/tools/areas.json'))
la,lo=R['anchor']['lat'],R['anchor']['lon']
L=lambda p:((p[0]-lo)*103014.2,-(p[1]-la)*110734.9)
hs=float(sys.argv[3]) if len(sys.argv)>3 else R['radius']
cx=float(sys.argv[4]) if len(sys.argv)>4 else 0; cz=float(sys.argv[5]) if len(sys.argv)>5 else 0
fig,ax=plt.subplots(figsize=(8,8),dpi=90)
T=R['terrain']; n=T['n']; s=T['step']; g=np.array(T['rows_north_to_south'])
xs=(np.arange(n)-(n-1)/2)*s
cs=ax.contour(xs,xs,g,levels=12,colors='#b88',linewidths=0.5); ax.clabel(cs,fontsize=6)
for a in A:
  t=a['t']; c=None
  if t.get('natural')=='water' or 'water' in t: c='#9cf'
  elif t.get('leisure') in ('park','garden','pitch') or t.get('landuse') in ('grass','forest') or t.get('natural') in ('wood','scrub','grassland'): c='#cec'
  elif t.get('amenity') or t.get('tourism') or t.get('landuse') in ('commercial','construction'): c='none'
  if c is None: continue
  for rr in a['r']:
    ext=[]; 
    for p in rr:
      if p is None: break
      ext.append(L(p))
    p=np.array(ext)
    if c=='none': ax.plot(p[:,0],p[:,1],color='#f0a',lw=0.8,ls=':')
    else: ax.fill(p[:,0],p[:,1],fc=c,ec='#7a7',lw=0.4,alpha=0.6)
    if 'name' in t:
      m=p.mean(0)
      if abs(m[0]-cx)<hs and abs(m[1]-cz)<hs: ax.text(m[0],m[1],a['id']+' '+(t.get('name:en') or '')[:20],fontsize=5,color='#a06')
col={0:'#c00',1:'#c00',15:'#000',16:'#808',17:'#06c',12:'#9a9',11:'#bbb',10:'#888'}
for r in R['roads']:
  p=np.array(r['pts']); c=col.get(r['cls'],'#e80'); lw=2.5 if r['cls']<10 else 1
  ax.plot(p[:,0],p[:,1],color=c,lw=lw,ls='--' if r.get('bridge') else '-')
for b in R['buildings']:
  p=np.array(b['ring']); ax.fill(p[:,0],p[:,1],fc='#ccc',ec='#444',lw=0.8,alpha=0.8)
  ax.text(b['centroid'][0],b['centroid'][1],b['osm']+' %s'%b['h'],fontsize=6)
for q in R['pois']:
  ax.plot(q['at'][0],q['at'][1],'g.',ms=3)
ax.set_xlim(cx-hs,cx+hs); ax.set_ylim(cz+hs,cz-hs); ax.set_aspect('equal'); ax.grid(lw=0.3)
plt.tight_layout(); plt.savefig(sys.argv[2])
