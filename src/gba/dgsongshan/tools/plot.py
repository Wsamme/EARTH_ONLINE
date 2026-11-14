import json, sys, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
W='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/wipsrc/src/gba/'
R=json.load(open(W+'ref_dgsongshan.json'))['targets']
for k in sys.argv[1:]:
  v=R[k]; fig,ax=plt.subplots(figsize=(10,10))
  for r in v['roads']:
    p=r['pts']; c='blue' if r['cls']==15 else ('k' if r['cls']<=10 else '0.6'); ax.plot([q[0] for q in p],[-q[1] for q in p],color=c,lw=0.6 if r['cls']>10 else 1.2)
  for i,b in enumerate(v['buildings']):
    p=b['ring']; ax.fill([q[0] for q in p],[-q[1] for q in p],color='r' if b['h']>20 else 'orange',alpha=0.6)
    ax.text(b['centroid'][0],-b['centroid'][1],str(i),fontsize=6)
  for p in v['pois']: ax.plot(p['at'][0],-p['at'][1],'g.'); ax.text(p['at'][0],-p['at'][1],p['name'][:6],fontsize=5,color='g')
  ax.set_aspect('equal'); ax.grid(lw=0.3); fig.savefig(W+'dgsongshan/tools/p_'+k+'.png',dpi=80); plt.close(fig)
