# v42: Hong Kong buildings >= 100 m from the Lands Department "3D Visualisation Map (Non-textured models)" (glTF, HK1980 Grid),
# simplified and packed for the City Brush Hong Kong page: site/hkdata/hk3d.bin + an index. Data (c) HKSAR Government, Lands
# Department (3d.map.gov.hk / CSDI portal), used under its terms (free use with attribution).
# usage: python3 -I build3d.py survey.json places.json out.bin [minH]
import sys, json, zipfile, struct, numpy as np, fast_simplification
from pyproj import Transformer
from shapely.geometry import MultiPoint, Point
T = Transformer.from_crs(2326, 4326, always_xy=True)
S, P, OUT = json.load(open(sys.argv[1])), json.load(open(sys.argv[2])), sys.argv[3]
MINH = float(sys.argv[4]) if len(sys.argv) > 4 else 100
LON0, LAT0, MX, MY = 114.12, 22.34, 103014.2, 110734.9
sel = [b for b in S if b['h'] >= MINH]
# a hand-made complex (tower + podium + mall) replaced through one of its towers must not leave holes: also take every official
# building (any height) whose centre is within the old model's radius of its anchor; repeat for anchors that fall in those
def _xy(lat, lon): return ((lon - LON0) * MX, (lat - LAT0) * MY)
_pls = [p for p in P if not p.get('site')]
_ids = set(b['id'] for b in sel)
for _it in range(3):
    added = 0
    for p in _pls:
        if not p.get('label'): continue
        ax, ay = _xy(p['lat'], p['lon'])
        hit = any(abs(_xy(b['lat'], b['lon'])[0] - ax) < b['w'] / 2 + 4 and abs(_xy(b['lat'], b['lon'])[1] - ay) < b['d'] / 2 + 4 for b in sel)
        if not hit: continue
        R = min(p.get('r') or 40, 260)
        for b in S:
            if b['id'] in _ids: continue
            bx, by = _xy(b['lat'], b['lon'])
            if (bx - ax) ** 2 + (by - ay) ** 2 < R * R and b['h'] >= 4: sel.append(b); _ids.add(b['id']); added += 1
    print('complex pass', _it, 'added', added)
    if not added: break
sel.sort(key=lambda b: -b['h'])
zips = {}
def zf(sheet):
    if sheet not in zips: zips[sheet] = zipfile.ZipFile('/mnt/user-data/uploads/EARTH_ONLINE/hk3d_raw/nt/%s.zip' % sheet)
    return zips[sheet]
def load(b):
    z = zf(b['sheet']); g = json.loads(z.read(b['bin'][:-4] + '.gltf')); raw = z.read(b['bin'])
    def acc(i):
        a = g['accessors'][i]; bv = g['bufferViews'][a['bufferView']]; o = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        k = {'VEC3': 3, 'SCALAR': 1}[a['type']]; dt = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}[a['componentType']]
        x = np.frombuffer(raw, dtype=dt, count=a['count'] * k, offset=o); return x.reshape(-1, 3) if k == 3 else x
    pr = g['meshes'][0]['primitives'][0]; Pp = acc(pr['attributes']['POSITION']).astype(np.float64); I = acc(pr['indices']).astype(np.int64).reshape(-1, 3)
    # weld (1 cm)
    q = np.round(Pp * 100).astype(np.int64); u, inv = np.unique(q, axis=0, return_inverse=True); inv = inv.reshape(-1)
    V = u / 100.0; F = inv[I]; F = F[(F[:, 0] != F[:, 1]) & (F[:, 1] != F[:, 2]) & (F[:, 0] != F[:, 2])]
    return V, F
pl = [p for p in P if not p.get('site')]
ents, blobs, off, tri_in, tri_out = [], [], 0, 0, 0
taken = {}
for n, b in enumerate(sel):
    V, F = load(b); tri_in += len(F)
    target = int(min(4500, max(160 if b['h'] < MINH else 500, b['h'] * 9)))
    if len(F) > target:
        try: V2, F2 = fast_simplification.simplify(V.astype(np.float32), F.astype(np.int32), target_reduction=1 - target / len(F))
        except Exception as e: V2, F2 = V.astype(np.float32), F.astype(np.int32)
    else: V2, F2 = V.astype(np.float32), F.astype(np.int32)
    zmin = float(V2[:, 2].min()); V2 = V2 - np.array([0, 0, zmin], np.float32)
    if len(V2) > 65535: raise SystemExit('too many verts ' + b['id'])
    tri_out += len(F2)
    lon, lat = T.transform(b['E'], b['N'])
    # footprint: hull of the lower vertices, in metres on the page (x east, y north) around the origin
    low = V2[V2[:, 2] < min(25, b['h'] * 0.3)][:, :2]
    hull = MultiPoint([tuple(p) for p in (low if len(low) >= 3 else V2[:, :2])]).convex_hull
    ox, oy = (lon - LON0) * MX, (lat - LAT0) * MY
    rep, hide = [], []
    for p in pl:
        px, py = (p['lon'] - LON0) * MX - ox, (p['lat'] - LAT0) * MY - oy
        if hull.buffer(4).contains(Point(px, py)):
            (rep if p.get('label') else hide).append(p['k'])
    # a labelled placement replaced once only (the building that contains its anchor)
    rep = [k for k in rep if k not in taken][:1] + []; extra = [k for k in rep[1:]]
    for k in rep: taken[k] = b['id']
    rr = float(np.hypot(V2[:, 0], V2[:, 1]).max())
    qp = np.round(V2 / 0.02).astype(np.int16); idx = F2.astype(np.uint16)
    blob = qp.tobytes() + idx.tobytes(); blob += b'\0' * ((-len(blob)) % 4)
    ents.append({'id': b['id'], 'lat': round(lat, 7), 'lon': round(lon, 7), 'h': round(float(V2[:, 2].max()), 1), 'r': round(rr, 1),
                 'nv': int(len(qp)), 'nt': int(len(idx)), 'off': off, 'rep': rep, 'hide': hide, 'sheet': b['sheet']})
    blobs.append(blob); off += len(blob)
    if n % 50 == 0: print(n, b['id'], round(b['h']), len(F), '->', len(F2), rep, hide, flush=True)
# second pass: a model anchored between towers (e.g. Exchange Square) or a part of one: inside an official building's radius
used = set(k for e in ents for k in e['rep'] + e['hide'])
for p in pl:
    if p['k'] in used: continue
    x, y = (p['lon'] - LON0) * MX, (p['lat'] - LAT0) * MY
    best = None
    for e in ents:
        ex, ey = (e['lon'] - LON0) * MX, (e['lat'] - LAT0) * MY; dd = ((x - ex) ** 2 + (y - ey) ** 2) ** 0.5
        if dd < e['r'] and e['h'] >= 0.5 * (p.get('h') or 0) and (best is None or dd < best[0]): best = (dd, e)
    if not best: continue
    e = best[1]
    if p.get('label') and (p.get('h') or 0) >= 50:
        if not e['rep']: e['rep'].append(p['k']); print('pass2 rep', p['k'], '->', e['id'], e['h'])
        else: e['hide'].append(p['k']); print('pass2 hide (labelled, building already named)', p['k'], '->', e['id'], e['rep'])
    elif not p.get('label') and (p.get('h') or 0) >= 10: e['hide'].append(p['k']); print('pass2 hide', p['k'])
idxj = json.dumps({'v': 1, 'q': 0.02, 'src': 'HKSAR Government, Lands Department: 3D Visualisation Map (Non-textured models), 3d.map.gov.hk',
                   'n': len(ents), 'b': ents}, separators=(',', ':')).encode()
hdr = b'HK3D' + struct.pack('<I', len(idxj)) + idxj; hdr += b'\0' * ((-len(hdr)) % 4)
open(OUT, 'wb').write(hdr + b''.join(blobs))
print('buildings', len(ents), 'tris in', tri_in, 'out', tri_out, 'bytes', len(hdr) + off, 'replaced', sum(len(e['rep']) for e in ents), 'hidden', sum(len(e['hide']) for e in ents))
