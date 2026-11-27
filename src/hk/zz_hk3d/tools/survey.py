# survey all building (and, v45, infrastructure: footbridges, kiosks, vents) glTFs in the staged LandsD non-textured sheets:
# id, HK1980 origin, base z, height, local extents, vertex count, kind
import zipfile, json, glob, os, sys
from pyproj import Transformer
T = Transformer.from_crs(2326, 4326, always_xy=True)
out = []
for zp in sorted(glob.glob('/mnt/user-data/uploads/EARTH_ONLINE/hk3d_raw/nt/*.zip')):
    sheet = os.path.basename(zp)[:-4]; z = zipfile.ZipFile(zp)
    for n in z.namelist():
        if not ((n.startswith('BUILDING/') or n.startswith('INFRASTRUCTURE/')) and n.endswith('.gltf')): continue
        g = json.loads(z.read(n)); nd = g['nodes'][0]; m = nd['matrix']; E, z0, N = m[12], m[13], -m[14]
        acc = g['accessors'][0]; mn, mx = acc['min'], acc['max']
        lon, lat = T.transform(E + (mn[0] + mx[0]) / 2, N + (mn[1] + mx[1]) / 2)
        out.append({'id': nd['name'], 'sheet': sheet, 'E': E, 'N': N, 'z0': z0, 'lat': lat, 'lon': lon, 'h': mx[2] - mn[2], 'zmin': mn[2],
                    'w': mx[0] - mn[0], 'd': mx[1] - mn[1], 'nv': acc['count'], 'bin': n[:-5] + '.bin', 'kind': 'infra' if n.startswith('INFRA') else 'bld'})
# a building on a sheet edge can appear on two sheets: keep one per id
seen = {}
for b in out:
    if b['id'] not in seen or b['nv'] > seen[b['id']]['nv']: seen[b['id']] = b
B = sorted(seen.values(), key=lambda b: -b['h'])
json.dump(B, open(sys.argv[1], 'w'))
print('models', len(out), 'unique', len(B), 'infrastructure', sum(1 for b in B if b['kind'] == 'infra'))
import collections
for t in (300, 200, 150, 100, 80, 60, 40): print('>=%d m: %d' % (t, sum(1 for b in B if b['h'] >= t)))
for b in B[:12]: print(round(b['h'], 1), b['id'], b['sheet'], round(b['lat'], 5), round(b['lon'], 5), b['nv'])
