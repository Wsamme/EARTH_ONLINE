import json,sys
t=json.load(open(sys.argv[1]))['targets'][sys.argv[2]]
R=float(sys.argv[3]) if len(sys.argv)>3 else 1e9
print(t['meta'].get('note'))
for b in t['buildings']:
  c=b['centroid']
  if (c[0]**2+c[1]**2)**.5>R: continue
  print('B',b['osm'],b.get('name'),'h',b['h'],'fl',b['floors'],'est',b['est'],b['type'],'A',b['area'],'c',c)
  if len(sys.argv)>4: print('   ring',[[round(v,1) for v in p] for p in b['ring']])
  for p in b.get('parts') or []: print('   part',p.get('base'),p.get('top'),[[round(v,1) for v in q] for q in p['ring']] if len(sys.argv)>4 else len(p['ring']))
for r in t['roads']:
  if r.get('br') or r.get('name'): print('R',r['cls'],r['kd'],r.get('name'),'br' if r.get('br') else '', [[round(v,1) for v in p] for p in r['pts']][:12], [round(e,1) for e in r.get('elev',[])][:12])
for a in t.get('areas',[]): print('A',a['kind'],a.get('name'),a['area'])
for p in t['pois']: print('P',p)
