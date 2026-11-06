# plot ref target: buildings (labelled with osm id / name / h), areas, roads, pois
import json,sys,matplotlib
matplotlib.use('Agg'); import matplotlib.pyplot as plt
ref,key,out=sys.argv[1],sys.argv[2],sys.argv[3]; half=float(sys.argv[4]) if len(sys.argv)>4 else 150
cx=float(sys.argv[5]) if len(sys.argv)>5 else 0; cz=float(sys.argv[6]) if len(sys.argv)>6 else 0
t=json.load(open(ref))['targets'][key]
fig,ax=plt.subplots(figsize=(9,9),dpi=80)
for a in t.get('areas',[]):
  r=a['ring']; ax.fill([p[0] for p in r],[p[1] for p in r],alpha=0.15,label=a['kind']); 
  c=(sum(p[0] for p in r)/len(r),sum(p[1] for p in r)/len(r)); ax.text(c[0],c[1],a['kind'],fontsize=6,color='green')
for rd in t['roads']:
  P=rd['pts']; ax.plot([p[0] for p in P],[p[1] for p in P],color='orange' if rd['cls']<10 else '#bbb',lw=1.5 if rd['cls']<10 else .7)
  if rd.get('name') and rd['cls']<11: m=P[len(P)//2]; ax.text(m[0],m[1],rd['name'],fontsize=5,color='#a60')
for b in t['buildings']:
  r=b['ring']; ax.fill([p[0] for p in r],[p[1] for p in r],fc='#ccd',ec='k',lw=.5,alpha=.8)
  c=b['centroid']
  if abs(c[0]-cx)<half and abs(c[1]-cz)<half: ax.text(c[0],c[1],'%s\n%s h%s'%((b.get('name') or '')[:18],b.get('osm'),b.get('h')),fontsize=5,ha='center')
  for p in b.get('parts') or []:
    rr=p.get('ring'); 
    if rr: ax.plot([q[0] for q in rr+[rr[0]]],[q[1] for q in rr+[rr[0]]],'b--',lw=.5)
for p in t['pois']:
  ax.plot(*p['at'],'r.',ms=3); ax.text(p['at'][0],p['at'][1],p['name'][:20],fontsize=4,color='r')
ax.set_xlim(cx-half,cx+half); ax.set_ylim(cz+half,cz-half); ax.set_aspect('equal'); ax.grid(lw=.3)
plt.savefig(out,bbox_inches='tight')
