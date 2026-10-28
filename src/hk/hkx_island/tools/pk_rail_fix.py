# Peak Tram rail profile fix for the integrator (hkx_island / hkpeaktram).  Run after b7b_base.py and before stage.sh:
#     python3 hk/hkx_island/tools/pk_rail_fix.py            (edits hkreal/out/hk_base.json.gz in place; --dry to only print)
# and add the engine line below to hkreal/mkengine.py (next to the other sgMRT patches), then rebuild (mkhk.sh / the release build).
#
# Why: the PK line (110 vertices, ~20 m apart) has el = 1 at vertices 2-3 and 6-7 (the OSM bridges over Tramway Path and Kennedy
# Road) and 102-104 (over Plantation Road).  sgMRT's ramp passes (e[i] = max(e[i], e[i +- 1] - 0.7)) were written for flat cities: on
# the Peak's 1-in-2 slope they carry the summit's height down the hill, so the el = 1 vertices get e = 308-312 m over ground of 70-103 m
# (a spike ~240 m high near Garden Road / Kennedy Road) and 347 m at Barker Road.  The at-grade vertices are unaffected (light rail
# with el = 0 always sits on hC + 0.5).
# Fix: the two footpath bridges and Plantation Road's underpass stay at grade (el = 0); the bridge over Kennedy Road gets explicit rail
# heights z (metres over the ground, the same values as ZPK in parts/peaktram.js, which the model's abutments and piers are built
# under), and the engine keeps those explicit heights after its ramp passes for light-rail lines:
#
#   R("    const cls = new Uint8Array(n), yR = new Float32Array(n), cum = new Float32Array(n); let L = 0;",
#     "    if (Z && lrt) for (let i = 0; i < n; i++) if (Z[i] > 0) e[i] = tgt[i];\n    const cls = new Uint8Array(n), yR = new Float32Array(n), cum = new Float32Array(n); let L = 0;")
#
# (placed after the existing R() that adds `Z = Ld.z || null`; the target is the line after the ramp loop in sgMRT, unique in
# sgreal/app/sgreal.js; only lines with explicit z are touched, and of those only light rail: PK is the only one).
# Optional, also for the integrator: the app's generic PK train (SGR_TRAIN 'PK', one 2-car set running the whole chain, which doubles
# back over the passing section) runs through the two static trams of hkpeaktram; and sgStations puts its generic platforms and
# canopy at every PK stop - see the report.
import gzip, json, sys
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
F = SC + 'hkreal/out/hk_base.json.gz'
ZPK = {4: 4.5, 5: 8.0, 6: 8.0, 7: 4.5}
b = json.load(gzip.open(F))
L = [m for m in b['mrt'] if m.get('code') == 'PK']
assert len(L) == 1, 'PK line not found'
pk = L[0]; n = len(pk['pts'])
assert n == 110 and abs(pk['pts'][0][0] - 3974.0) < 1 and abs(pk['pts'][0][1] + 6957.5) < 1, 'the PK chain changed: re-derive the vertex indices (see parts/peaktram.js)'
el = list(pk['el'])
for i in range(n):
    if el[i] == '1': el[i] = '0'
for i in ZPK: el[i] = '1'
z = [ZPK.get(i, 0) for i in range(n)]
print('PK el before', pk['el']); print('PK el after ', ''.join(el)); print('PK z', {i: z[i] for i in ZPK})
if '--dry' in sys.argv: sys.exit(0)
pk['el'] = ''.join(el); pk['z'] = z
with gzip.open(F, 'wt') as f: json.dump(b, f, separators=(',', ':'))
print('wrote', F)
