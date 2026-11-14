import warnings; warnings.filterwarnings("ignore")
import json,sys
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
E=json.load(open('tmp/ext.json'))[sys.argv[1]]; R=float(sys.argv[2]); out=sys.argv[3]
cx=float(sys.argv[4]) if len(sys.argv)>4 else 0; cz=float(sys.argv[5]) if len(sys.argv)>5 else 0
f,ax=plt.subplots(figsize=(7,7),dpi=90)
for a in E['areas'].values():
  for r in a['rings']: ax.plot([p[0] for p in r]+[r[0][0]],[p[1] for p in r]+[r[0][1]],'b-',lw=1)
for b in E['b']:
  for r in b['rings']:
    ax.fill([p[0] for p in r],[p[1] for p in r],color='#777' if b['h']>=60 else '#bbb',ec='k',lw=0.4)
  c=[sum(p[0] for p in b['rings'][0])/len(b['rings'][0]),sum(p[1] for p in b['rings'][0])/len(b['rings'][0])]
  ax.text(c[0],c[1],'%s\n%.0f'%(b['id'][-4:],b['h']),fontsize=5,ha='center')
ax.set_xlim(cx-R,cx+R); ax.set_ylim(cz+R,cz-R); ax.set_aspect('equal'); ax.grid(lw=0.2)
plt.tight_layout(); plt.savefig(out)
