# Adds building names to hkdata/hk3d.bin (header JSON only; geometry untouched).
# Names come from names.json, made by matching each model to the Lands Department "Building" dataset
# (CSDI landsd_rcd_1637211194312_35158, data.gov.hk hk-landsd-openmap-landsd-building) by its GeoRefNo id.
# Names are copied as written in the data. When several models share a name, only the tallest gets the map label (lab=1).
# usage: python3 -I addnames.py hk3d.bin names.json out.bin
import sys, json, struct
b = open(sys.argv[1], 'rb').read(); N = json.load(open(sys.argv[2]))
assert b[:4] == b'HK3D'
n = struct.unpack('<I', b[4:8])[0]; J = json.loads(b[8:8+n]); data = b[(8 + n + 3) & ~3:]
best = {}
for e in J['b']:
    e.pop('en', None); e.pop('zh', None); e.pop('lab', None)
    m = N.get(e['id'])
    if not m or not (m.get('en') or m.get('zh')): continue
    e['en'] = m.get('en') or ''; e['zh'] = m.get('zh') or ''
    k = (e['en'] + '|' + e['zh']).lower()
    if k not in best or e['h'] > best[k]['h']: best[k] = e
for e in best.values(): e['lab'] = 1
J['names'] = 'HKSAR Government, Lands Department: Building (CSDI landsd_rcd_1637211194312_35158), via DATA.GOV.HK'
j = json.dumps(J, ensure_ascii=False, separators=(',', ':')).encode()
hdr = b'HK3D' + struct.pack('<I', len(j)) + j; hdr += b'\0' * ((-len(hdr)) % 4)
open(sys.argv[3], 'wb').write(hdr + data)
print('named', sum(1 for e in J['b'] if 'en' in e), 'labels', len(best), 'labels>=100m', sum(1 for e in best.values() if e['h'] >= 100))
