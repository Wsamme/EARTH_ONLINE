import json,sys,math
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad'
d=json.load(open(SC+'/gba/ref_szshekou.json'))
k=sys.argv[1]; t=d['targets'][k]
mode=sys.argv[2] if len(sys.argv)>2 else 'b'
R=float(sys.argv[3]) if len(sys.argv)>3 else 1e9
if 'b' in mode:
  for b in t['buildings']:
    c=b['centroid']
    if math.hypot(*c)>R: continue
    print('B',b.get('osm'),b.get('type'),b.get('h'),b.get('floors'),b.get('area'),c,b.get('zh') or '',b.get('en') or b.get('name') or '', len(b['ring']), 'parts' if b.get('parts') else '')
if 'r' in mode:
  for r in t['roads']:
    p=r['pts'] if 'pts' in r else r.get('line')
    print('R',{kk:v for kk,v in r.items() if kk not in ('pts','line','elev')}, len(p) if p else None, p[:1] if p else None, p[-1:] if p else None, ('elev' in r and r['elev'][:3]) or '')
if 'p' in mode:
  for p in t['pois']: print('P',p)
if 't' in mode:
  T=t['terrain']; print({kk:v for kk,v in T.items() if kk!='h'})
  for row in T.get('h',T.get('grid',[])): print(' '.join('%5.1f'%v for v in row))
