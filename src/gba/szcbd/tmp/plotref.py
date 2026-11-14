import warnings; warnings.filterwarnings("ignore")
import json,sys,math
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
d=json.load(open(sys.argv[1]))['targets'][sys.argv[2]]
R=float(sys.argv[3]); out=sys.argv[4]
cx=float(sys.argv[5]) if len(sys.argv)>5 else 0; cz=float(sys.argv[6]) if len(sys.argv)>6 else 0
f,ax=plt.subplots(figsize=(7,7),dpi=90)
for b in d['buildings']:
  r=b['ring']; xs=[p[0] for p in r]+[r[0][0]]; zs=[p[1] for p in r]+[r[0][1]]
  ax.fill(xs,zs,color='#bbb' if b['h']<60 else '#777',ec='k',lw=0.4)
  c=b['centroid']
  if abs(c[0]-cx)<R and abs(c[1]-cz)<R and (b['h']>=40): ax.text(c[0],c[1],'%s\n%.0f'%(b['osm'][-4:],b['h']),fontsize=6,ha='center')
cols={15:'m',12:'g',11:'c',10:'b'}
for r in d['roads']:
  p=r['pts']; ax.plot([q[0] for q in p],[q[1] for q in p],color=cols.get(r['cls'],'r'),lw=0.6 if r['cls']>=10 else 1.5, ls='--' if r.get('bridge') else '-')
for p in d['pois']:
  if 'railway' in p['tags']: ax.plot(*p['at'],'k^',ms=3); ax.text(p['at'][0],p['at'][1],p['name'][:3].encode('ascii','ignore').decode(),fontsize=5)
ax.set_xlim(cx-R,cx+R); ax.set_ylim(cz+R,cz-R); ax.set_aspect('equal'); ax.grid(lw=0.2)
plt.tight_layout(); plt.savefig(out)
