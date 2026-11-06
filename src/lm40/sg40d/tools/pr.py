import json, sys, math
d = json.load(open(sys.argv[1])); t = d['targets'][sys.argv[2]]; R = float(sys.argv[3]) if len(sys.argv) > 3 else 60
for i, b in enumerate(t['buildings']):
    ring = b['ring']; cx = sum(p[0] for p in ring)/len(ring); cz = sum(p[1] for p in ring)/len(ring)
    if math.hypot(cx, cz) < R:
        print(i, b['osm'], b['name'], 'h', b['h'], 'fl', b['floors'], 'est', b.get('est'), b['type'], 'area', b.get('area'))
        print('   ring', [[round(p[0],1), round(p[1],1)] for p in ring])
        for p in b.get('parts') or []:
            print('   part', {k: v for k, v in p.items() if k != 'ring'}, [[round(q[0],1), round(q[1],1)] for q in p.get('ring', [])])
for r in t['roads']:
    if r.get('name'): 
        pts = r['pts']; m = min(math.hypot(*p) for p in pts)
        if m < R: print('road', r['cls'], r['name'], r.get('br'), [[round(p[0]), round(p[1])] for p in pts][:8])
for p in t['pois']:
    if math.hypot(*p['at']) < R: print('poi', p)
