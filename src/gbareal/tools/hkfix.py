# run one of the Hong Kong deck-fix scripts (hk/..., read only) on gbareal/out from gbareal/: world coordinates written in the
# Hong Kong frame are moved by (HK_DX, HK_DY). usage (cwd gbareal): python3 tools/hkfix.py ../hk/bridges/tm_deck_fix.py [args]
import sys, re
sys.path.insert(0, '.')
from common import HK_DX, HK_DY
p = sys.argv[1]; src = open(p).read()
a = "CX, CY, UX, UY = -4437.161, 1318.143, 0.9588033, 0.2840710"
if a in src: src = src.replace(a, "CX, CY, UX, UY = -4437.161 + %r, 1318.143 + %r, 0.9588033, 0.2840710" % (HK_DX, HK_DY)); print('hkfix: moved the Tsing Ma axis')
a = "F = SC + 'hkreal/out/hk_base.json.gz'"
if a in src:
    src = src.replace(a, "F = SC + 'gbareal/out/gba_base.json.gz'")
    a2 = "abs(pk['pts'][0][0] - 3974.0) < 1 and abs(pk['pts'][0][1] + 6957.5) < 1"; assert a2 in src
    src = src.replace(a2, "abs(pk['pts'][0][0] - (3974.0 + %r)) < 1 and abs(pk['pts'][0][1] - (-6957.5 + %r)) < 1" % (HK_DX, HK_DY)); print('hkfix: pk_rail_fix on gba_base')
sys.argv = [p] + sys.argv[2:]
exec(compile(src, p, 'exec'), {'__name__':'__main__', '__file__':p})
