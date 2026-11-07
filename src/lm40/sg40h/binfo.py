# python3 binfo.py ref.json key osm1,osm2,...   (or 'near:x,z,r')  -> ring dims, heights, parts
import sys, json, math
ref = json.load(open(sys.argv[1])); T = ref['targets'][sys.argv[2]]
sel = sys.argv[3]
def obb(r):
    best = None
    n = len(r)
    for i in range(n):
        a, b = r[i], r[(i + 1) % n]; dx, dz = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dz)
        if L < 1: continue
        ux, uz = dx / L, dz / L
        us = [p[0] * ux + p[1] * uz for p in r]; vs = [-p[0] * uz + p[1] * ux for p in r]
        A = (max(us) - min(us)) * (max(vs) - min(vs))
        if best is None or A < best[0]:
            best = (A, max(us) - min(us), max(vs) - min(vs), math.degrees(math.atan2(-uz, ux)))
    return best
for b in T['buildings']:
    ok = False
    if sel.startswith('near:'):
        x, z, r = map(float, sel[5:].split(',')); c = b['centroid']; ok = math.hypot(c[0] - x, c[1] - z) < r
    else:
        ok = b['osm'] in sel.split(',')
    if not ok: continue
    o = obb(b['ring'])
    print(b['osm'], repr(b['name']), 'h', b['h'], 'fl', b['floors'], 'est', b['est'], b['type'], 'area', b['area'], 'c', b['centroid'],
          'obb %.1f x %.1f ang(east->ccw) %.1f' % (o[1], o[2], o[3]) if o else '')
    if len(sys.argv) > 4: print('   ring', b['ring'])
    for p in b.get('parts', []) or []:
        print('   part', {k: v for k, v in p.items() if k != 'ring'}, 'n', len(p.get('ring', [])))
        if len(sys.argv) > 4: print('     ', p.get('ring'))
