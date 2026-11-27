# stage 8 (gbareal; from hkreal): the vector land cover for the sharp ground (lm32/detail): runs lm32/cover/mkcover.py (the New York / Bay
# branch: the urban classes are big-map only, the roof grain stays in ground.webp) on gbareal/out -> sgreal/site/gbadata/gba_cover.txt
import sys
ROOT = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
src = open(ROOT + 'lm32/cover/mkcover.py').read()
a = "D = {'sg': 'sgreal', 'bay': 'bayreal', 'nyc': 'nycreal'}[city]"
assert src.count(a) == 1
src = src.replace(a, "D = {'sg': 'sgreal', 'bay': 'bayreal', 'nyc': 'nycreal', 'hk': 'hkreal', 'gba': 'gbareal'}[city]")
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
import os as _os
if _os.environ.get('GBA_FRAME') == 'gz':      # v48 test build: this working copy, its out/, the test data folder; the far context (outside
    _G = _os.environ.get('GZ_ROOT', ROOT + 'lm50/gz/')       # the core cities and the October square) is left to ground.webp
    src = src.replace("'gba': 'gbareal'}[city]", "'gba': %r}[city]" % (_G[len(ROOT):] + 'gbareal'))
    src = src.replace("out = ROOT + 'sgreal/site/%sdata/%s_cover.txt' % (city, city)", "out = %r" % (_G + 'gbadata/gba_cover.txt'))
    a4 = "items = load('landuse.pkl')                    # (priority, -area, kind, geom) sorted as drawn into ground.webp"
    assert src.count(a4) == 1
    src = src.replace(a4, a4 + '''
from shapely.prepared import prep as _pp
from shapely.geometry import box as _bxx
_KEEPC = _pp(load('land.pkl')['core'].buffer(1000).union(_bxx(-OLD_HALF, -OLD_HALF, OLD_HALF, OLD_HALF)))
_n0 = len(items); items = [it for it in items if _KEEPC.contains(it[3].representative_point())]; print('cover: far-context polygons left to ground.webp', _n0 - len(items))''')
sys.argv = ['mkcover.py', 'gba']
exec(compile(src, ROOT + 'lm32/cover/mkcover.py', 'exec'), {'__name__': '__main__'})
