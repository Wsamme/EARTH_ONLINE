# plot.py keys... [--origin lat,lon] [--half m] [--out f.png] [--labels]
import json,sys,matplotlib
matplotlib.use('Agg'); import matplotlib.pyplot as plt
args=sys.argv[1:]; ref='../ref_sg40g.json'; out='plan.png'; half=None; org=None; labels=False; keys=[]; extra=[]
i=0
while i<len(args):
  a=args[i]
  if a=='--ref': ref=args[i+1]; i+=2; continue
  if a=='--out': out=args[i+1]; i+=2; continue
  if a=='--half': half=float(args[i+1]); i+=2; continue
  if a=='--origin': org=[float(v) for v in args[i+1].split(',')]; i+=2; continue
  if a=='--labels': labels=True; i+=1; continue
  keys.append(a); i+=1
d=json.load(open(ref))['targets']
if org is None: org=[d[keys[0]]['anchor']['lat'],d[keys[0]]['anchor']['lon']]
fig,ax=plt.subplots(figsize=(10,10),dpi=90)
seenb=set(); seena=set(); seenr=set()
col={'zoo':'#f4c27a','forest':'#bfe3b0','nature_reserve':'#d8f0d0','park':'#a8e090','military':'#dddddd','pedestrian':'#eeeeee'}
for k in keys:
  t=d[k]; dx=(t['anchor']['lon']-org[1])*111290.5; dz=-(t['anchor']['lat']-org[0])*110574
  for a in t.get('areas',[]):
    key=(a['kind'],a['area'],round(a['ring'][0][0]+dx),round(a['ring'][0][1]+dz))
    xs=[p[0]+dx for p in a['ring']]; zs=[p[1]+dz for p in a['ring']]
    if a['kind'] in ('nature_reserve','forest'): continue
    ax.fill(xs,zs,color=col.get(a['kind'],'#eee'),alpha=0.35,lw=0)
    ax.plot(xs+[xs[0]],zs+[zs[0]],color='#c08020' if a['kind']=='zoo' else '#888',lw=0.8)
    if labels: ax.text(sum(xs)/len(xs),sum(zs)/len(zs),f"{a['kind']} {a['area']}",fontsize=6,color='#a06010')
  for r in t['roads']:
    xs=[p[0]+dx for p in r['pts']]; zs=[p[1]+dz for p in r['pts']]
    kk=(round(xs[0],0),round(zs[0],0),len(xs))
    if kk in seenr: continue
    seenr.add(kk)
    c={12:'#b05050'}.get(r['cls'],'#4060a0'); lw=0.5 if r['cls']>=11 else 1.5
    if r.get('br'): c='#ff00ff'; lw=1.5
    ax.plot(xs,zs,color=c,lw=lw)
    if labels and r.get('name') and r['cls']<12: ax.text(xs[len(xs)//2],zs[len(zs)//2],r['name'],fontsize=5,color='#204080')
  for b in t['buildings']:
    xs=[p[0]+dx for p in b['ring']]; zs=[p[1]+dz for p in b['ring']]
    kk=(round(b['centroid'][0]+dx),round(b['centroid'][1]+dz))
    if kk in seenb: continue
    seenb.add(kk)
    ax.fill(xs,zs,color='#606060' if not b.get('name') else '#202080',alpha=0.7)
    if labels and b.get('name'): ax.text(b['centroid'][0]+dx,b['centroid'][1]+dz,b['name'][:22],fontsize=5,color='#000080')
  for p in t['pois']:
    if labels: ax.plot(p['at'][0]+dx,p['at'][1]+dz,'r.',ms=2); ax.text(p['at'][0]+dx,p['at'][1]+dz,p['name'][:18],fontsize=4.5,color='#c00000')
ax.set_aspect('equal'); ax.invert_yaxis()
if half: ax.set_xlim(-half,half); ax.set_ylim(half,-half)
ax.grid(True,lw=0.2)
plt.tight_layout(); plt.savefig(out); print('wrote',out)
