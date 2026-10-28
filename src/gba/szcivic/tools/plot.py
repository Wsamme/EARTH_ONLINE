# plot a ref target: buildings (grey, parts blue), roads by class, terrain contours; usage: plot.py key out.png [halfsize]
import json, sys, matplotlib, warnings; warnings.filterwarnings('ignore')
matplotlib.use('Agg'); import matplotlib.pyplot as plt, numpy as np
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad'
R=json.load(open(SC+'/gba/ref_szcivic.json'))['targets'][sys.argv[1]]
hs=float(sys.argv[3]) if len(sys.argv)>3 else R['radius']
cx=float(sys.argv[4]) if len(sys.argv)>4 else 0; cz=float(sys.argv[5]) if len(sys.argv)>5 else 0
fig,ax=plt.subplots(figsize=(9,9),dpi=80)
T=R['terrain']; n=T['n']; s=T['step']; g=np.array(T['rows_north_to_south'])
xs=(np.arange(n)-(n-1)/2)*s
cs=ax.contour(xs,xs,g,levels=12,colors='#b88',linewidths=0.5); ax.clabel(cs,fontsize=6)
col={0:'#c00',1:'#c00',15:'#000',16:'#808',17:'#06c',12:'#9a9',11:'#bbb',10:'#888'}
for r in R['roads']:
  p=np.array(r['pts']); c=col.get(r['cls'],'#e80'); lw=2.5 if r['cls']<10 else 1
  ax.plot(p[:,0],p[:,1],color=c,lw=lw,ls='--' if r.get('bridge') else '-')
for b in R['buildings']:
  p=np.array(b['ring']); ax.fill(p[:,0],p[:,1],fc='#ccc',ec='#444',lw=0.8)
  for q in b.get('parts',[]):
    pp=np.array(q['ring']); ax.fill(pp[:,0],pp[:,1],fc='none',ec='#03f',lw=0.7)
  ax.text(b['centroid'][0],b['centroid'][1],(b.get('name') or b['osm'])[:18]+' %s'%b['h'],fontsize=6)
for q in R['pois']:
  ax.plot(q['at'][0],q['at'][1],'g.',ms=3); ax.text(q['at'][0],q['at'][1],''.join(ch for ch in q.get('name','') if ord(ch)<128)[:10],fontsize=5,color='g')
ax.set_xlim(cx-hs,cx+hs); ax.set_ylim(cz+hs,cz-hs); ax.set_aspect('equal'); ax.grid(lw=0.3)
plt.tight_layout(); plt.savefig(sys.argv[2])
