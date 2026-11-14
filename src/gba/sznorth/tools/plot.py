import json,sys,matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad'
d=json.load(open(SC+'/gba/ref_sznorth.json'))['targets']
key=sys.argv[1]; lim=float(sys.argv[2]) if len(sys.argv)>2 else None
cx=float(sys.argv[3]) if len(sys.argv)>3 else 0; cz=float(sys.argv[4]) if len(sys.argv)>4 else 0
t=d[key]
fig,ax=plt.subplots(figsize=(10,10),dpi=90)
cols={15:'purple',16:'magenta',12:'#bbb',11:'#999',17:'brown'}
for r in t['roads']:
  xs=[p[0] for p in r['pts']]; zs=[-p[1] for p in r['pts']]
  c=cols.get(r['cls'],'orange' if r['cls']<=1 else 'k')
  ax.plot(xs,zs,color=c,lw=0.6 if r['cls']>=10 else 1.3, ls='--' if r.get('bridge') else '-')
for i,b in enumerate(t['buildings']):
  r=b['ring']; xs=[p[0] for p in r]+[r[0][0]]; zs=[-p[1] for p in r]+[-r[0][1]]
  ax.fill(xs,zs,alpha=0.35,color='C%d'%(i%10)); ax.plot(xs,zs,color='C%d'%(i%10),lw=0.8)
  c=b['centroid']; 
  ax.text(c[0],-c[1],'%d:%s %s'%(i,b.get('h'),(b.get('zh') or b.get('name') or '')[:10]),fontsize=6,clip_on=True)
N=json.load(open(SC+'/gba/sznorth/tmp/near.json'))[key]
for o in N:
  if o['kind']=='a':
    for r in o['rings']:
      ax.plot([p[0] for p in r],[-p[1] for p in r],color='g',lw=1.2,ls=':')
    nm=o['tags'].get('name','')
    ax.text(o['c'][0],-o['c'][1],'A:'+nm[:14]+' '+str(o['tags'].get('leisure') or o['tags'].get('landuse') or o['tags'].get('natural') or o['tags'].get('amenity') or ''),fontsize=6,color='g',clip_on=True)
A=json.load(open(SC+'/gba/sznorth/tmp/areas.json'))[key]
for o in A:
  tg=o['tags']; c=None
  if tg.get('natural')=='water' or tg.get('water'): c='b'
  elif tg.get('leisure') in ('pitch','track','stadium','park','garden') or tg.get('landuse') in ('grass',) or tg.get('natural') in ('wood',): c='lime'
  elif tg.get('highway') or tg.get('man_made'): c='brown'
  if c:
    for r in o['rings']: ax.fill([p[0] for p in r],[-p[1] for p in r],color=c,alpha=0.25)
for p in t['pois']:
  ax.plot(p['at'][0],-p['at'][1],'r.',ms=3); ax.text(p['at'][0],-p['at'][1],p['name'][:12],fontsize=5,color='r',clip_on=True)
ax.set_aspect('equal'); ax.grid(alpha=.3)
if lim: ax.set_xlim(cx-lim,cx+lim); ax.set_ylim(-cz-lim,-cz+lim)
plt.rcParams['font.sans-serif']=['Noto Sans CJK SC','WenQuanYi Zen Hei','DejaVu Sans']
plt.tight_layout(); plt.savefig(SC+'/gba/sznorth/tmp/plot_%s.png'%key)
