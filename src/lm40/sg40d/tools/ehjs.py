import json, math, sys
d = json.load(open(sys.argv[1])); t = d['targets']['sgemeraldhill']; B = t['buildings']
sel = json.load(open(sys.argv[2]))
idx = {b['osm']: i for i, b in enumerate(B) if b['osm'] != '-'}
road = [r['pts'] for r in t['roads'] if r['name'] == 'Emerald Hill Road']
def dseg(p, a, b):
    ax, az = b[0]-a[0], b[1]-a[1]; L = ax*ax+az*az or 1; u = max(0, min(1, ((p[0]-a[0])*ax + (p[1]-a[1])*az)/L))
    return math.hypot(p[0]-a[0]-u*ax, p[1]-a[1]-u*az)
def droad(p): return min(dseg(p, l[i], l[i+1]) for l in road for i in range(len(l)-1))
names = {'A':'', 'B':'_b', 'C':'_c', 'D':'_d', 'E':'_e', 'F':'_pp'}
out = {}
for k, ids in sel.items():
    rings = []
    for o in ids:
        r = B[idx[o]]['ring']
        # drop duplicate closing vertex
        if r[0] == r[-1]: r = r[:-1]
        # signed area -> make CCW in (x, z) consistently (positive)
        A = sum(r[i][0]*r[(i+1)%len(r)][1] - r[(i+1)%len(r)][0]*r[i][1] for i in range(len(r)))
        if A < 0: r = r[::-1]
        if o == 'w465127149':
            # Peranakan Place: the front is the Orchard Road (south) face
            best = max(range(len(r)), key=lambda i: (r[i][1] + r[(i+1)%len(r)][1]))
        else:
            cand = [i for i in range(len(r)) if math.hypot(r[(i+1)%len(r)][0]-r[i][0], r[(i+1)%len(r)][1]-r[i][1]) > 2.5]
            best = min(cand, key=lambda i: droad(((r[i][0]+r[(i+1)%len(r)][0])/2, (r[i][1]+r[(i+1)%len(r)][1])/2)))
        r = r[best:] + r[:best]
        rings.append((o, r))
    pts = [p for _, r in rings for p in r]
    cx = round(sum(p[0] for p in pts)/len(pts), 1); cz = round(sum(p[1] for p in pts)/len(pts), 1)
    out[k] = {'key': 'sgemeraldhill' + names[k], 'O': [cx, cz], 'osm': [o for o, _ in rings],
              'R': [[[round(p[0]-cx, 1), round(p[1]-cz, 1)] for p in r] for _, r in rings], 'pp': [o == 'w465127149' for o, _ in rings]}
    print(k, out[k]['key'], len(rings), out[k]['O'], 'rmax %.0f' % max(math.hypot(p[0]-cx, p[1]-cz) for p in pts))
json.dump(out, open(sys.argv[3], 'w'))
