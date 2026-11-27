# v48: index for the Lands Department textured sheets (3D Visualisation Map, Individualised models, Open3Dhk download API).
# For each packed sheet (made on the owner's Mac by conv.py + pack.mjs): the sheet origin (E0, N0, HK1980 Grid) as lat / lon,
# and per building its centre on the page (metres, x east / y north, same frame as hk3d: build3d.py LON0/LAT0/MX/MY), a hiding
# radius and its height. usage: python3 -I manifest.py <sheet.json> <meta.json> <out.json>
import sys, json
from pyproj import Transformer
T = Transformer.from_crs(2326, 4326, always_xy=True)
LON0, LAT0, MX, MY = 114.12, 22.34, 103014.2, 110734.9
S, M, OUT = json.load(open(sys.argv[1])), json.load(open(sys.argv[2])), sys.argv[3]
lon0, lat0 = T.transform(S['E0'], S['N0'])
B = []
for k, m in M.items():
    if 'err' in m or m.get('E') is None: continue
    mn, mx = m['min'], m['max']
    E = m['E'] + (mn[0] + mx[0])/2; N = m['N'] + (mn[1] + mx[1])/2
    lon, lat = T.transform(E, N)
    B.append([k, round((lon - LON0)*MX, 1), round((lat - LAT0)*MY, 1), round(0.45*max(mx[0] - mn[0], mx[1] - mn[1]), 1), m['h']])
xs, ys = [b[1] for b in B], [b[2] for b in B]
json.dump({'sheet': S['sheet'], 'lat0': round(lat0, 7), 'lon0': round(lon0, 7), 'x0': round((lon0 - LON0)*MX, 1), 'y0': round((lat0 - LAT0)*MY, 1),
           'bb': [min(xs), min(ys), max(xs), max(ys)], 'b': B}, open(OUT, 'w'), separators=(',', ':'))
print(S['sheet'], len(B), 'buildings, origin', round(lat0, 6), round(lon0, 6))
