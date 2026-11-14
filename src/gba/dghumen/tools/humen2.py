import json, math
exec(open('bridges.py').read().split('for key, span')[0])
v = R['dghumenbridge']; h = terr(v)
L = sorted([r for r in v['roads'] if r['cls'] == 0 and r.get('layer') == 1 and len(r['pts']) > 50], key=lambda r: -len(r['pts']))[:2]
A, B = L[0]['pts'], L[1]['pts']
# rough axis from before
cx0, cz0, ux0, uz0 = -64.7, 27.9, 0.79794, -0.60274
sel = lambda p: 300 < (p[0]-cx0)*ux0 + (p[1]-cz0)*uz0 < 2100
PA = [p for p in A if sel(p)]; PB = [p for p in B if sel(p)]; P = PA + PB
cx = sum(p[0] for p in P)/len(P); cz = sum(p[1] for p in P)/len(P)
sxx = sum((p[0]-cx)**2 for p in P); szz = sum((p[1]-cz)**2 for p in P); sxz = sum((p[0]-cx)*(p[1]-cz) for p in P)
ang = 0.5*math.atan2(2*sxz, sxx - szz); ux, uz = math.cos(ang), math.sin(ang)
if ux < 0: ux, uz = -ux, -uz
vx, vz = -uz, ux
lat = lambda p: (p[0]-cx)*vx + (p[1]-cz)*vz; lon = lambda p: (p[0]-cx)*ux + (p[1]-cz)*uz
print('centre', round(cx,1), round(cz,1), 'u', round(ux,5), round(uz,5))
for nm, Q in (('A', PA), ('B', PB)):
    print(nm, ' '.join(f'{round(lon(p))}:{round(lat(p),1)}' for p in sorted(Q, key=lon)[::3]))
s = -1200; out = []
while s < 1000:
    g = h(cx + ux*s, cz + uz*s); out.append(f'{s}:{round(g,1) if g is not None else "-"}'); s += 25
print(' '.join(out))
