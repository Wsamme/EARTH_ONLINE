# Stage 2: fix the city test (no district => outside), then join 3D-GloBFP heights (Che et al. 2024, CC BY 4.0) to each
# Overture footprint: the GloBFP polygon that contains the footprint's centroid (largest overlap if several).
import sys, json, gzip, base64, pickle, numpy as np, shapely, pyogrio
W = sys.argv[1]; D = '/home/claude/earth_online/site/gbadata/'; SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
S = pickle.load(open(W + '/s1.pkl', 'rb'))
B = json.loads(gzip.decompress(base64.b64decode(open(D + 'gba_base.txt').read())))
HALF, CELL, N = B['HALF'], B['CELL'], B['N']; LON0, LAT0, MX, MY = B['lon0'], B['lat0'], B['MX'], B['MY']
rl = np.frombuffer(base64.b64decode(B['pa']), '<u2').reshape(-1, 2); pa_ = np.repeat(rl[:, 0], rl[:, 1]).reshape(N, N).astype(np.int32)
cx, cy = S['cx'], S['cy']
i = np.clip(((cx + HALF)//CELL).astype(int), 0, N - 1); j = np.clip(((cy + HALF)//CELL).astype(int), 0, N - 1)
inside = pa_[j, i] > 0
print('dropped (no district cell)', int((~inside).sum()), 'of', len(cx))
g = shapely.from_wkb(S['g'])
H = np.full(len(g), np.nan)
files = [(SC + 'szdg/gfp2264/2264_112.5_22.5_113.75_23.75_guangdongCN.shp', (113.49, 22.42, 113.76, 23.17)),
         (SC + 'szdg3d/cn_academic/dl_globfp_2265/2265_113.75_22.5_115.0_23.75_HKMacauCN_guangdongCN.shp', (113.74, 22.49, 114.66, 23.17)),
         (SC + 'szdg3d/cn_academic/dl_globfp_2269/2269_112.5_20.0_115.0_22.5_HKMacauCN_guangdongCN.shp', (113.74, 22.42, 114.66, 22.51))]
cpt = shapely.points(cx, cy)
for f, bb in files:
    gdf = pyogrio.raw.read(f, bbox=bb, columns=['Height'])
    meta, fids, geom, fields = gdf
    gg = shapely.from_wkb(geom); hh = fields[0].astype(float)
    gg = shapely.transform(gg, lambda c: np.column_stack([(c[:, 0] - LON0)*MX, (c[:, 1] - LAT0)*MY]))
    tree = shapely.STRtree(gg)
    qi, ti = tree.query(cpt, predicate='within')
    # several containing polygons (duplicates): keep the max height
    for a, b in zip(qi, ti):
        if not (H[a] >= hh[b]): H[a] = hh[b]
    print(f.split('/')[-1][:5], 'polys', len(gg), 'matched', len(set(qi.tolist())), flush=True)
    del gg, tree, hh
S['inside'] = inside; S['gfp'] = H
pickle.dump(S, open(W + '/s2.pkl', 'wb'), protocol=4)
city = S['city']; A = S['A']
for nm, c in (('SZ', 1), ('DG', 2)):
    m = (city == c) & inside
    print(nm, 'n', int(m.sum()), 'with gfp height', int((m & np.isfinite(H)).sum()), 'gfp>=20', int((m & (H >= 20)).sum()), 'gfp>=50', int((m & (H >= 50)).sum()))
