import json,sys
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
d=json.load(open(sys.argv[1])); ref=json.load(open('../ref_sg40f.json'))['targets'][sys.argv[3]]
fig,ax=plt.subplots(figsize=(8,8),dpi=80)
for p,rgb in d['paint']:
  ax.fill([q[0] for q in p],[q[1] for q in p],color=[c/255 for c in rgb],alpha=0.6)
k=d['keep']; ax.plot([q[0] for q in k]+[k[0][0]],[q[1] for q in k]+[k[0][1]],'r-',lw=1)
for r in ref['roads']:
  ax.plot([q[0] for q in r['pts']],[q[1] for q in r['pts']],'-',color='k' if r['cls']<11 else 'gray',lw=0.5)
for b in ref['buildings']:
  r=b['ring']; ax.plot([q[0] for q in r]+[r[0][0]],[q[1] for q in r]+[r[0][1]],'b-',lw=0.6)
L=d['low'][::max(1,len(d['low'])//20000)]; ax.plot([q[0] for q in L],[q[1] for q in L],'m.',ms=0.5)
ax.plot([t[0] for t in d['tree']],[t[1] for t in d['tree']],'g.',ms=1.5)
ax.plot([t[0] for t in d['lamp']],[t[1] for t in d['lamp']],'y.',ms=2)
lim=float(sys.argv[4]); ax.set_xlim(-lim,lim); ax.set_ylim(lim,-lim); ax.set_aspect('equal')
plt.tight_layout(); plt.savefig(sys.argv[2])
