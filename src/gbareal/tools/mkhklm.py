# gbareal/app/hklm/<name>.js: the Hong Kong landmark modules hk/<name>/<name>.js (read only) as copies that run in the Hong Kong frame.
# Each module is one block { ... }; a shim at the top of the block shadows the frame-dependent engine functions it uses:
#   sgXY(lat, lon) -> Hong Kong frame metres, hC / hAt(x, y) and SGRoads.ground(x, y) take Hong Kong frame metres,
# so the modules' own helpers with the hard-coded Hong Kong origin (W0, LL, toLL in hkx_nt, lantau, hkx_island, bridges) and their
# data in Hong Kong frame metres stay consistent. Everything the modules hand to the engine is lat/lon (SG_PLACES, SITES, LANDMARKS
# placements) or local model metres, which are frame free. Re-run after any hk/ edit (mkgba.sh does).
import glob, os, sys
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
sys.path.insert(0, SC + 'gbareal'); from common import HK_DX, HK_DY
OUT = SC + 'gbareal/app/hklm/'; os.makedirs(OUT, exist_ok=True)
names = sorted(os.path.basename(os.path.dirname(f)) for f in glob.glob(SC + 'hk/*/*.js') if os.path.basename(f)[:-3] == os.path.basename(os.path.dirname(f)))
SHIM = ("/* gba: this module runs in the Hong Kong frame (x_gba = x_hk + %(dx)r, y_gba = y_hk + %(dy)r): frame shims (gbareal/tools/mkhklm.py) */\n"
        "const sgXY = (lat, lon) => { const q = _gbaXY(lat, lon); return [q[0] - %(dx)r, q[1] - %(dy)r]; };\n"
        "const hC = (x, y) => _gbaHC(x + %(dx)r, y + %(dy)r), hAt = (x, y) => _gbaHAt(x + %(dx)r, y + %(dy)r);\n"
        "const SGRoads = _gbaRoadsHK;\n") % {'dx':HK_DX, 'dy':HK_DY}
PRE = ("/* ================= gba: frame shims for the Hong Kong landmark modules (gbareal/tools/mkhklm.py) ================= */\n"
       "const _gbaXY = sgXY, _gbaHC = hC, _gbaHAt = hAt;\n"
       "const _gbaRoadsHK = typeof SGRoads === 'undefined' ? undefined : new Proxy(SGRoads, {get(t, k){ if (k === 'ground') return (x, y) => t.ground(x + %r, y + %r); const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; }});\n") % (HK_DX, HK_DY)
open(OUT + '_pre.js', 'w').write(PRE)
for nm in names:
    s = open(SC + 'hk/%s/%s.js' % (nm, nm)).read()
    i = 0
    while True:          # the first non-comment, non-blank character must open the module's block
        j = s.find('\n', i); line = s[i:j if j >= 0 else len(s)].strip()
        if line and not line.startswith('//') and not line.startswith('/*') and not line.startswith('*'): break
        i = j + 1
    assert s[i:].lstrip().startswith('{'), nm
    k = s.index('{', i) + 1
    open(OUT + nm + '.js', 'w').write('// GENERATED from hk/%s/%s.js by gbareal/tools/mkhklm.py - do not edit\n' % (nm, nm) + s[:k] + '\n' + SHIM + s[k:])
print('hklm', len(names), names)
