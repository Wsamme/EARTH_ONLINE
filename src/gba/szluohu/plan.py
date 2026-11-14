# plan view of a ref target: python3 plan.py key half_extent_m out.png [ringsjson]
import json, sys, math
from PIL import Image, ImageDraw
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
t = json.load(open(SC + 'gba/ref_szluohu.json'))['targets'][sys.argv[1]]
E = float(sys.argv[2]); N = 900; s = N/(2*E); OX = float(sys.argv[5]) if len(sys.argv) > 5 else 0; OZ = float(sys.argv[6]) if len(sys.argv) > 6 else 0
im = Image.new('RGB', (N, N), (245, 245, 240)); d = ImageDraw.Draw(im)
P = lambda p: ((p[0] - OX + E)*s, (p[1] - OZ + E)*s)
a = t['anchor']; lat0, lon0 = a['lat'], a['lon']
MX, MY = 103014.2, 110734.9
if len(sys.argv) > 4:
    for k, v in json.load(open(sys.argv[4])).items():
        pts = [((lo - lon0)*MX, -(la - lat0)*MY) for la, lo in v['ring']]
        d.polygon([P(p) for p in pts], fill=(220, 235, 200), outline=(60, 140, 60))
for r in t['roads']:
    pts = [P(p) for p in r['pts']]
    c = r['cls']; col = (200, 120, 40) if c <= 9 else (150, 150, 150) if c <= 11 else (120, 170, 220) if c == 12 else (90, 60, 140) if c == 15 else (0, 0, 0)
    w = 4 if c <= 9 else 2 if c <= 11 else 1
    if r.get('bridge'): col = (220, 40, 40)
    d.line(pts, fill=col, width=w)
for b in t['buildings']:
    h = b.get('h') or 0; g = int(max(60, 220 - h*0.6))
    d.polygon([P(p) for p in b['ring']], fill=(g, g, g + 10), outline=(40, 40, 40))
    if b['area'] > 600 and E < 400: d.text(P(b['centroid']), '%s %.0f' % (b['osm'][-4:], h), fill=(200, 0, 0))
for i in range(-int(E)//50*50, int(E), 50):
    d.line([P((i, -E)), P((i, E))], fill=(230, 210, 210)); d.line([P((-E, i)), P((E, i))], fill=(230, 210, 210))
d.line([P((-5, 0)), P((5, 0))], fill=(255, 0, 0)); d.line([P((0, -5)), P((0, 5))], fill=(255, 0, 0))
im.save(sys.argv[3])
