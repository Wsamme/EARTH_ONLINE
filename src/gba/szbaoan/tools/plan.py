# plan view of a ref target: python3 plan.py key half_extent out.png [cx cz grid]
import json, sys
from PIL import Image, ImageDraw
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
t = json.load(open(SC + 'gba/ref_szbaoan.json'))['targets'][sys.argv[1]]
E = float(sys.argv[2]); N = 1000; s = N/(2*E)
OX = float(sys.argv[4]) if len(sys.argv) > 4 else 0; OZ = float(sys.argv[5]) if len(sys.argv) > 5 else 0
GR = int(sys.argv[6]) if len(sys.argv) > 6 else (50 if E < 400 else 100)
im = Image.new('RGB', (N, N), (245, 245, 240)); d = ImageDraw.Draw(im)
P = lambda p: ((p[0] - OX + E)*s, (p[1] - OZ + E)*s)
import math
for i in range(int((OX - E)//GR)*GR, int(OX + E) + GR, GR): d.line([P((i, OZ - E)), P((i, OZ + E))], fill=(225, 205, 205)); d.text(P((i + 2, OZ - E + 2)), str(i), fill=(150, 0, 0))
for i in range(int((OZ - E)//GR)*GR, int(OZ + E) + GR, GR): d.line([P((OX - E, i)), P((OX + E, i))], fill=(225, 205, 205)); d.text(P((OX - E + 2, i + 2)), str(i), fill=(150, 0, 0))
for b in t['buildings']:
    h = b.get('h') or 0; g = int(max(60, 220 - h*0.6))
    d.polygon([P(p) for p in b['ring']], fill=(g, g, g + 10), outline=(40, 40, 40))
    for pp in b.get('parts') or []:
        if pp.get('ring'): d.polygon([P(p) for p in pp['ring']], outline=(0, 120, 200))
for r in t['roads']:
    pts = [P(p) for p in r['pts']]
    c = r['cls']; col = (200, 120, 40) if c <= 9 else (150, 150, 150) if c <= 11 else (120, 170, 220) if c == 12 else (90, 60, 140) if c == 15 else (0, 160, 0) if c in (13, 14) else (0, 0, 0)
    w = 4 if c <= 9 else 2 if c <= 11 else 1
    if r.get('bridge'): col = (220, 40, 40)
    d.line(pts, fill=col, width=w)
for b in t['buildings']:
    if b['area'] > 500: d.text(P(b['centroid']), '%s %.0f' % (b['osm'][-4:], b.get('h') or 0), fill=(200, 0, 0))
import os
if os.environ.get('RING'):
    import json as J
    for RG in J.load(open(os.environ['RING'])): d.line([P(p) for p in RG] + [P(RG[0])], fill=(0, 140, 0), width=3)
d.line([P((-8, 0)), P((8, 0))], fill=(255, 0, 0), width=2); d.line([P((0, -8)), P((0, 8))], fill=(255, 0, 0), width=2)
im.save(sys.argv[3])
