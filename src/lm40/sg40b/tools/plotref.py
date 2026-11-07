import json,sys
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
ref, key, out = sys.argv[1], sys.argv[2], sys.argv[3]
half = float(sys.argv[4]) if len(sys.argv)>4 else 80
cx = float(sys.argv[5]) if len(sys.argv)>5 else 0; cz = float(sys.argv[6]) if len(sys.argv)>6 else 0
d=json.load(open(ref))['targets'][key]
fig,ax=plt.subplots(figsize=(7,7),dpi=90)
for r in d['roads']:
    p=r.get('pts') or r.get('line') or r.get('p')
    if not p: continue
    xs=[q[0] for q in p]; zs=[q[1] for q in p]
    ax.plot(xs,zs,'-',color='orange' if r.get('br') else '#bbb',lw=1 if r.get('cls',10)>=10 else 2.5)
    if r.get('name'): ax.text(xs[len(xs)//2],zs[len(zs)//2],r['name'],clip_on=True,fontsize=5,color='g')
for a in d.get('areas',[]):
    p=a.get('ring') or a.get('pts')
    if p: ax.fill([q[0] for q in p],[q[1] for q in p],color='#cfe8cf',alpha=0.4)
for b in d['buildings']:
    p=b['ring']; c=b['centroid']
    if abs(c[0]-cx)>half*1.3 or abs(c[1]-cz)>half*1.3: continue
    ax.fill([q[0] for q in p],[q[1] for q in p],facecolor='#ddd',edgecolor='k',lw=0.6)
    ax.text(c[0],c[1],'%s\n%s h%.0f'%((b.get('osm') or '-')[-5:], (b.get('name') or '')[:14], b.get('h') or 0),clip_on=True,fontsize=5,ha='center')
    for pt in b.get('parts') or []:
        pp=pt.get('ring')
        if pp: ax.plot([q[0] for q in pp]+[pp[0][0]],[q[1] for q in pp]+[pp[0][1]],'b-',lw=0.5)
for p in d['pois']:
    if abs(p['at'][0])<half and abs(p['at'][1])<half: ax.plot(*p['at'],'r.',ms=3); ax.text(p['at'][0],p['at'][1],p['name'][:16],clip_on=True,fontsize=4,color='r')
ax.set_xlim(cx-half,cx+half); ax.set_ylim(cz+half,cz-half); ax.set_aspect('equal'); ax.grid(True,lw=0.3)
plt.tight_layout(); plt.savefig(out)
