# stage 8 (Hong Kong): the vector land cover for the sharp ground (lm32/detail): runs lm32/cover/mkcover.py (the New York / Bay
# branch: the urban classes are big-map only, the roof grain stays in ground.webp) on hkreal/out -> sgreal/site/hkdata/hk_cover.txt
import sys
ROOT = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
src = open(ROOT + 'lm32/cover/mkcover.py').read()
a = "D = {'sg': 'sgreal', 'bay': 'bayreal', 'nyc': 'nycreal'}[city]"
assert src.count(a) == 1
src = src.replace(a, "D = {'sg': 'sgreal', 'bay': 'bayreal', 'nyc': 'nycreal', 'hk': 'hkreal'}[city]")
# v37b: inside Shenzhen (foreign context) the cover polygons get the same muted mix as ground.webp (60 % towards (210, 207, 198))
a2 = "    c = cls(enh(LU[k]), None, 1 if k in SKIP else 0)       # the urban classes: only in the big map (3D keeps the roof grain)"
assert src.count(a2) == 1
src = src.replace(a2, "    c = cls(enh(_mute(LU[k], g)), None, 1 if k in SKIP else 0)")
a3 = "polys = []          # (class, pts)"
assert src.count(a3) == 1
src = src.replace(a3, a3 + '''
from shapely.prepared import prep as _prep
_FORP = _prep(L['foreign'].buffer(-20))
def _mute(rgb, g):
    return tuple(int(v*0.4 + m*0.6) for v, m in zip(rgb, (210, 207, 198))) if _FORP.contains(g.representative_point()) else rgb''')
sys.argv = ['mkcover.py', 'hk']
exec(compile(src, ROOT + 'lm32/cover/mkcover.py', 'exec'), {'__name__': '__main__'})
