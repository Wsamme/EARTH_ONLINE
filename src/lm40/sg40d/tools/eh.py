import json, math, sys
from PIL import Image, ImageDraw
d = json.load(open(sys.argv[1])); t = d['targets']['sgemeraldhill']
B = t['buildings']
road = []
for r in t['roads']:
    if r['name'] == 'Emerald Hill Road': road.append(r['pts'])
def dseg(p, a, b):
    ax, az = b[0]-a[0], b[1]-a[1]; L = ax*ax+az*az or 1; u = max(0, min(1, ((p[0]-a[0])*ax + (p[1]-a[1])*az)/L))
    return math.hypot(p[0]-a[0]-u*ax, p[1]-a[1]-u*az)
def droad(p): return min(dseg(p, l[i], l[i+1]) for l in road for i in range(len(l)-1))
def cen(r): return (sum(p[0] for p in r)/len(r), sum(p[1] for p in r)/len(r))
cand = []
for i, b in enumerate(B):
    c = cen(b['ring'])
    if b['h'] <= 11 and b['type'] in ('house','commercial','generic','yes','residential','terrace') and (b.get('area') or 0) < 400 and droad(c) < 30 and c[1] < 200:
        cand.append(i)
# cluster by vertex proximity
par = {i: i for i in cand}
def f(i):
    while par[i] != i: par[i] = par[par[i]]; i = par[i]
    return i
def close(a, b):
    for p in B[a]['ring']:
        for q in B[b]['ring']:
            if math.hypot(p[0]-q[0], p[1]-q[1]) < 1.2: return True
    return False
for x in range(len(cand)):
    for y in range(x+1, len(cand)):
        a, b = cand[x], cand[y]
        ca, cb = cen(B[a]['ring']), cen(B[b]['ring'])
        if math.hypot(ca[0]-cb[0], ca[1]-cb[1]) < 40 and close(a, b): par[f(a)] = f(b)
cl = {}
for i in cand: cl.setdefault(f(i), []).append(i)
cls = sorted(cl.values(), key=lambda v: cen(B[v[0]]['ring'])[1])
W = 900; half = 245; s = W/(2*half)
img = Image.new('RGB', (W, W), (245, 245, 240)); dr = ImageDraw.Draw(img)
P = lambda p: ((p[0]+half)*s, (p[1]+half)*s)
for l in road: dr.line([P(p) for p in l], fill=(150, 150, 200), width=3)
for i, b in enumerate(B):
    if i not in par: dr.polygon([P(p) for p in b['ring']], outline=(150, 150, 150))
cols = [(200,60,60),(60,160,60),(60,60,200),(200,140,0),(150,0,150),(0,150,150),(120,80,40),(220,90,160)]
for k, v in enumerate(cls):
    for i in v: dr.polygon([P(p) for p in B[i]['ring']], fill=cols[k % len(cols)])
    c = cen(B[v[0]]['ring']); dr.text(P(c), str(k), fill=(0, 0, 0))
    print(k, len(v), 'z %.0f..%.0f' % (min(cen(B[i]['ring'])[1] for i in v), max(cen(B[i]['ring'])[1] for i in v)), 'x %.0f' % cen(B[v[0]]['ring'])[0], [B[i]['osm'] for i in v][:3], set((B[i]['type'], B[i]['h']) for i in v))
img.save(sys.argv[2])
json.dump([[B[i]['osm'] for i in v] for v in cls], open(sys.argv[3], 'w'))
