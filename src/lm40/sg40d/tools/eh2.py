import json, math, sys
d = json.load(open(sys.argv[1])); t = d['targets']['sgemeraldhill']; B = t['buildings']
cl = json.load(open(sys.argv[2]))
idx = {b['osm']: i for i, b in enumerate(B) if b['osm'] != '-'}
def cen(r): return (sum(p[0] for p in r)/len(r), sum(p[1] for p in r)/len(r))
def hull(pts):
    pts = sorted(set(pts)); 
    if len(pts) < 3: return pts
    cr = lambda o, a, b: (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0])
    lo, up = [], []
    for p in pts:
        while len(lo) >= 2 and cr(lo[-2], lo[-1], p) <= 0: lo.pop()
        lo.append(p)
    for p in reversed(pts):
        while len(up) >= 2 and cr(up[-2], up[-1], p) <= 0: up.pop()
        up.append(p)
    H = lo[:-1] + up[:-1]; cx = sum(h[0] for h in H)/len(H); cy = sum(h[1] for h in H)/len(H)
    return [(h[0] + (h[0]-cx)/(math.hypot(h[0]-cx, h[1]-cy) or 1)*3, h[1] + (h[1]-cy)/(math.hypot(h[0]-cx, h[1]-cy) or 1)*3) for h in H]
def pip(P, x, y):
    c = False
    for i in range(len(P)):
        a, b = P[i], P[i-1]
        if (a[1] > y) != (b[1] > y) and x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1]) + a[0]: c = not c
    return c
sel = {}
sel['A'] = cl[8]
sel['B'] = cl[1] + cl[3]
west = [b['osm'] for b in B if b['type'] == 'house' and b['h'] <= 7.5 and (b.get('area') or 0) < 400 and -32 < cen(b['ring'])[0] < 5 and -205 < cen(b['ring'])[1] < -25]
sel['C'] = west
sel['D'] = cl[10] + cl[11]
sel['E'] = cl[12] + cl[13] + ['w465127149']
for k, ids in sel.items():
    pts = [tuple(p) for o in ids for p in B[idx[o]]['ring']] if all(o in idx for o in ids) else None
    H = hull(pts)
    bad = []
    for i, b in enumerate(B):
        if b['osm'] in ids: continue
        c = cen(b['ring']); n = sum(pip(H, p[0], p[1]) for p in b['ring'])
        if pip(H, c[0], c[1]) or n*2 > len(b['ring']): bad.append((b['osm'], b['type'], b['h'], round(c[0]), round(c[1])))
        elif n: bad.append(('clash', b['osm'], n, len(b['ring'])))
    rb = []
    for r in t['roads']:
        if r['cls'] < 10 or r['cls'] > 12: continue
        P = r['pts']; m = P[len(P)//2] if len(P) % 2 else P[len(P)//2]  # approx: app uses vertex index (len>>1) for even/odd? use both
        m2 = P[(len(P)*2 >> 2) // 2] if False else P[(len(P)) // 2]
        if pip(H, m[0], m[1]): rb.append((r['name'], r['cls'], [round(m[0]), round(m[1])]))
    print(k, len(ids), 'hidden-not-mine', bad[:12], 'roads', rb)
json.dump(sel, open(sys.argv[3], 'w'))
