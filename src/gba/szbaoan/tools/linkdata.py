# sample both deck ways of the Lingdingyang Bridge every ~25 m as [t, x, z] in the szszlink frame -> tools/linkdata.js (pasted into szbaoan.js)
import json, math
d = json.load(open('tools/link.json'))
out = {}
for k, v in d['lines'].items():
    p = v['p']; D = [0.0]
    for a, b in zip(p, p[1:]): D.append(D[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    k0 = min(range(len(p)), key=lambda i: abs(p[i][0])); sg = 1 if p[min(k0 + 1, len(p) - 1)][0] > p[max(k0 - 1, 0)][0] else -1
    s0 = D[k0] - sg*p[k0][0]
    S = []
    n = int(D[-1]//25)
    for j in range(n + 1):
        s = D[-1]*j/n; i = max(0, min(len(p) - 2, next((q for q in range(len(D) - 1) if D[q + 1] >= s), len(p) - 2)))
        f = (s - D[i])/((D[i + 1] - D[i]) or 1); x = p[i][0] + (p[i + 1][0] - p[i][0])*f; z = p[i][1] + (p[i + 1][1] - p[i][1])*f
        S.append([round(sg*(s - s0), 1), round(x, 1), round(z, 1)])
    if S[0][0] > S[-1][0]: S.reverse()
    out[k] = S
    print(k, len(S), S[0], S[-1])
A = list(out.values())
open('tools/linkdata.js', 'w').write('const LKD = ' + json.dumps(A, separators=(',', ':')) + ';\n')
# sub-key anchors (szszlink frame -> lat/lon)
lat0, lon0, rot = d['lat'], d['lon'], d['rot']; ux, uy = math.cos(rot), math.sin(rot)
def ll(x, z):
    X = x*ux + z*uy; Y = x*uy - z*ux
    return lat0 + Y/110734.9, lon0 + X/103014.2
for nm, t in (('w', -2630), ('e', 2790)):
    pts = [min(S, key=lambda q: abs(q[0] - t)) for S in A]; x = sum(q[1] for q in pts)/2; z = sum(q[2] for q in pts)/2
    la, lo = ll(x, z); print(nm, 't', t, 'local', round(x, 1), round(z, 1), 'lat %.7f lon %.7f' % (la, lo))
print('main', lat0, lon0, rot)
