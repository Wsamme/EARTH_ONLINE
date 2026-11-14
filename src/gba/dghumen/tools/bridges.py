# measure the three suspension crossings from ref_dghumen.json: centre line, carriageway spacing, water extent along the axis
import json, math, sys
W = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/wipsrc/src/gba/'
R = json.load(open(W + 'ref_dghumen.json'))['targets']
def terr(v):
    T = v['terrain']; G = T['rows_north_to_south']; n = T['n']; st = T['step']; half = (n - 1)/2*st
    def h(x, z):
        fx = (x + half)/st; fz = (z + half)/st
        if not (0 <= fx < n - 1 and 0 <= fz < n - 1): return None
        i, j = int(fz), int(fx); u, w = fx - j, fz - i
        return (G[i][j]*(1-u) + G[i][j+1]*u)*(1-w) + (G[i+1][j]*(1-u) + G[i+1][j+1]*u)*w
    return h
for key, span in [('dghumenbridge', 888), ('dgnansha', 1688), ('dgdasha', 1200)]:
    v = R[key]; h = terr(v)
    L = sorted([r for r in v['roads'] if r['cls'] == 0 and r.get('layer') == 1 and len(r['pts']) > 50], key=lambda r: -len(r['pts']))[:2]
    A, B = L[0]['pts'], L[1]['pts']
    # axis by least squares over both lines
    P = A + B; cx = sum(p[0] for p in P)/len(P); cz = sum(p[1] for p in P)/len(P)
    sxx = sum((p[0]-cx)**2 for p in P); szz = sum((p[1]-cz)**2 for p in P); sxz = sum((p[0]-cx)*(p[1]-cz) for p in P)
    ang = 0.5*math.atan2(2*sxz, sxx - szz); ux, uz = math.cos(ang), math.sin(ang)
    if ux < 0: ux, uz = -ux, -uz
    vx, vz = -uz, ux
    lat = lambda p: (p[0]-cx)*vx + (p[1]-cz)*vz
    lon = lambda p: (p[0]-cx)*ux + (p[1]-cz)*uz
    la = sum(lat(p) for p in A)/len(A); lb = sum(lat(p) for p in B)/len(B)
    dev = max(abs(lat(p) - la) for p in A)
    print(key, 'centre', round(cx,1), round(cz,1), 'u', round(ux,5), round(uz,5), 'lat A', round(la,2), 'B', round(lb,2), 'maxdev', round(dev,2))
    s0 = min(lon(p) for p in P); s1 = max(lon(p) for p in P)
    wet = []; s = s0
    while s <= s1:
        x = cx + ux*s; z = cz + uz*s; g = h(x, z)
        wet.append((s, g)); s += 10
    runs = []; cur = None
    for s, g in wet:
        w = g is not None and g < -1.0
        if w and cur is None: cur = s
        if not w and cur is not None: runs.append((cur, s)); cur = None
    if cur is not None: runs.append((cur, s1))
    print('  extent', round(s0), round(s1), 'water runs (s0,s1,len):', [(round(a), round(b), round(b-a)) for a, b in runs])
    print('  profile', ' '.join(f'{round(s)}:{round(g,1) if g is not None else "-"}' for s, g in wet[::10]))
