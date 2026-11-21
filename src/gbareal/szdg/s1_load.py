# Stage 1: Overture buildings (+parts) for Shenzhen and Dongguan -> projected polygons in the Greater Bay frame, city per building.
# City raster: the page's own district raster (gba_base 'pa', 50 m cells; ids stored mod 256, resolved by the nearest district centre).
import sys, json, gzip, base64, numpy as np, pyarrow.parquet as pq, pyarrow as pa, shapely, pickle
W = sys.argv[1]; D = '/home/claude/earth_online/site/gbadata/'
B = json.loads(gzip.decompress(base64.b64decode(open(D + 'gba_base.txt').read())))
HALF, CELL, N = B['HALF'], B['CELL'], B['N']; LON0, LAT0, MX, MY = B['lon0'], B['lat0'], B['MX'], B['MY']
rl = np.frombuffer(base64.b64decode(B['pa']), '<u2').reshape(-1, 2)
pa_ = np.repeat(rl[:, 0], rl[:, 1]).reshape(N, N).astype(np.int32)
PAS = B['PAS']; px_ = np.array([p['x'] for p in PAS], float); py_ = np.array([p['y'] for p in PAS], float); preg = np.array([p['reg'] for p in PAS])
pcity = np.array([0 if 1 <= g <= 18 else 2 if g == 27 else 1 for g in preg])
def city_of(x, y):
    i = np.clip(((x + HALF)//CELL).astype(int), 0, N - 1); j = np.clip(((y + HALF)//CELL).astype(int), 0, N - 1); v = pa_[j, i]
    best_d = np.full(len(x), np.inf); best = np.zeros(len(x), int)
    for k in (0, 256, 512):
        ids = v + k; ok = (ids >= 1) & (ids <= len(PAS)) & ~((k == 0) & (v == 0)); ii = np.clip(ids - 1, 0, len(PAS) - 1)
        d = np.where(ok, np.hypot(px_[ii] - x, py_[ii] - y), np.inf); m = d < best_d; best_d[m] = d[m]; best[m] = ids[m]
    return np.where(np.isinf(best_d), 3, pcity[np.clip(best - 1, 0, len(PAS) - 1)]), np.where(np.isinf(best_d), 0, best)
def load(files, keep_city=True):
    t = pa.concat_tables([pq.read_table(W + '/ov/' + f) for f in files])
    g = shapely.from_wkb(t.column('geometry').to_numpy(zero_copy_only=False))
    g = shapely.transform(g, lambda c: np.column_stack([(c[:, 0] - LON0)*MX, (c[:, 1] - LAT0)*MY]))
    c = shapely.centroid(g); cx, cy = shapely.get_x(c), shapely.get_y(c)
    city, dist = city_of(cx, cy)
    return t, g, cx, cy, city, dist
t, g, cx, cy, city, dist = load(['b377.parquet', 'b378.parquet', 'b379.parquet'])
keep = (city == 1) | (city == 2)
print('overture rows', len(g), 'SZ', int((city == 1).sum()), 'DG', int((city == 2).sum()), 'HK', int((city == 0).sum()), 'other', int((city == 3).sum()))
t = t.filter(pa.array(keep)); g = g[keep]; cx = cx[keep]; cy = cy[keep]; city = city[keep]; dist = dist[keep]
A = shapely.area(g)
for nm, c in (('SZ', 1), ('DG', 2)):
    m = city == c; a = A[m]
    print(nm, 'n', int(m.sum()), 'area bins <40 / 40-80 / 80-150 / 150-400 / >400:', [int(((a >= lo) & (a < hi)).sum()) for lo, hi in ((0, 40), (40, 80), (80, 150), (150, 400), (400, 1e12))])
src = [s[0]['dataset'] if s else '' for s in t.column('sources').to_pylist()]
osm = np.array([s == 'OpenStreetMap' for s in src])
print('from OSM', int(osm.sum()), 'ML', int((~osm).sum()))
pt = pq.read_table(W + '/ov/parts.parquet'); pg = shapely.from_wkb(pt.column('geometry').to_numpy(zero_copy_only=False))
pg = shapely.transform(pg, lambda c: np.column_stack([(c[:, 0] - LON0)*MX, (c[:, 1] - LAT0)*MY]))
pickle.dump({'t': t, 'g': shapely.to_wkb(g), 'cx': cx, 'cy': cy, 'city': city, 'dist': dist, 'A': A, 'osm': osm,
             'pt': pt, 'pg': shapely.to_wkb(pg)}, open(W + '/s1.pkl', 'wb'), protocol=4)
print('saved')
