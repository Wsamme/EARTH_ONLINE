import json,sys,math
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
ref,key,out=sys.argv[1:4]; half=float(sys.argv[4]) if len(sys.argv)>4 else 150
t=json.load(open(ref))['targets'][key]
fig,ax=plt.subplots(figsize=(7,7),dpi=90)
for a in t.get('areas',[]):
  for r in ([a['ring']] if 'ring' in a else a.get('rings',[])):
    xs=[p[0] for p in r]+[r[0][0]]; zs=[p[1] for p in r]+[r[0][1]]
    ax.fill(xs,zs,alpha=0.15,color={'park':'g','water':'b'}.get(a.get('kind') or a.get('type'),'y'))
    c=(sum(xs)/len(xs),sum(zs)/len(zs)); ax.text(c[0],c[1],str(a.get('kind') or a.get('type'))+' '+str(a.get('name') or ''),fontsize=5,color='darkgreen')
for rd in t['roads']:
  P=rd['pts'] if 'pts' in rd else rd.get('p')
  xs=[p[0] for p in P]; zs=[p[1] for p in P]
  c=rd.get('cls',10); ax.plot(xs,zs,'-',lw=2.5 if c<10 else 1 if c<12 else 0.5,color='r' if rd.get('br') else ('k' if c<12 else 'gray'))
for b in t['buildings']:
  r=b['ring']; xs=[p[0] for p in r]+[r[0][0]]; zs=[p[1] for p in r]+[r[0][1]]
  ax.fill(xs,zs,alpha=0.35,color='tab:blue'); ax.plot(xs,zs,'b-',lw=0.6)
  c=b.get('centroid') or [sum(xs)/len(xs),sum(zs)/len(zs)]
  if abs(c[0])<half and abs(c[1])<half: ax.text(c[0],c[1],'%s\n%s h%s'%(b.get('osm'),(b.get('name') or '')[:18],b.get('h')),fontsize=5)
  for p in b.get('parts') or []:
    r=p['ring']; ax.plot([q[0] for q in r]+[r[0][0]],[q[1] for q in r]+[r[0][1]],'m-',lw=0.4)
for p in t['pois']:
  ax.plot(*p['at'],'k.',ms=2); ax.text(p['at'][0],p['at'][1],p['name'][:20],fontsize=4,color='purple')
ax.set_xlim(-half,half); ax.set_ylim(half,-half); ax.set_aspect('equal'); ax.grid(alpha=.3)
plt.tight_layout(); plt.savefig(out)
