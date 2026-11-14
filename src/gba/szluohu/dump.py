import json,sys
t=json.load(open(sys.argv[1]))['targets'][sys.argv[2]]
ids=sys.argv[3:]
for b in t['buildings']:
  if ids and b['osm'] not in ids: continue
  print(b['osm'],b.get('h'),b.get('names'),b.get('type'),b.get('area'),b.get('centroid'))
  print('  ring',b['ring'])
  for p in b.get('parts') or []:
    print('  part',p['base'],p['top'],p['ring'])
