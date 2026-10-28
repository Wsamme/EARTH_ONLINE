# plot a site: park outline + water + wood/grass areas (areas.json) + ref roads/buildings, local metres round the target anchor
import json, sys, warnings; warnings.filterwarnings('ignore')
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt, numpy as np
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad'
key=sys.argv[1]; R=json.load(open(SC+'/gba/ref_szcivic.json'))['targets'][key]; A=json.load(open(SC+'/gba/szcivic/tools/areas.json'))
la0,lo0=R['anchor']['lat'],R['anchor']['lon']
L=lambda p:((p[0]-lo0)*103014.2, -(p[1]-la0)*110734.9)
hs=float(sys.argv[3]); fig,ax=plt.subplots(figsize=(10,10),dpi=80)
cmap={'water':'#8cc','wetland':'#bdb','wood':'#8b8','forest':'#8b8','grass':'#cec','park':'none','pitch':'#eca','scrub':'#ac9','garden':'#dfd','pedestrian':'#ddd','mud':'#cb9','sand':'#ee9'}
for a in A:
  t=a['t']; k=t.get('natural') or t.get('leisure') or t.get('landuse') or t.get('highway') or t.get('man_made')
  if k not in cmap: continue
  for rr in a['r']:
    ext=rr[:rr.index(None)] if None in rr else rr
    p=np.array([L(q) for q in ext])
    if np.abs(p).min()>hs*1.5: continue
    ax.fill(p[:,0],p[:,1],fc=cmap[k],ec='#555' if k=='park' else 'none',lw=1.5 if k=='park' else 0,alpha=0.8)
    if k=='park' and t.get('name:en'): ax.text(p[:,0].mean(),p[:,1].mean(),t.get('name:en','')[:30],fontsize=7,color='m')
for r in R['roads']:
  p=np.array(r['pts']); ax.plot(p[:,0],p[:,1],color='#c00' if r['cls']<10 else ('#000' if r['cls']==15 else '#999'),lw=2 if r['cls']<10 else 0.6,ls='--' if r.get('bridge') else '-')
for b in R['buildings']:
  p=np.array(b['ring']); ax.fill(p[:,0],p[:,1],fc='#777',ec='k',lw=0.5)
T=R['terrain']; n=T['n']; s=T['step']; g=np.array(T['rows_north_to_south']); xs=(np.arange(n)-(n-1)/2)*s
cs=ax.contour(xs,xs,g,levels=15,colors='#b66',linewidths=0.4); ax.clabel(cs,fontsize=5)
for q in R['pois']:
  if q['tags']: ax.plot(q['at'][0],q['at'][1],'b.',ms=3); ax.text(q['at'][0],q['at'][1],''.join(ch for ch in q.get('name','') if ord(ch)<128)[:12],fontsize=5)
ax.set_xlim(-hs,hs); ax.set_ylim(hs,-hs); ax.set_aspect('equal'); ax.grid(lw=0.3); plt.tight_layout(); plt.savefig(sys.argv[2])
