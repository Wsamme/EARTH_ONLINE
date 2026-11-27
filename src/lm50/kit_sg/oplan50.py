# lm50 (Singapore): PNG for oplan50.js (replaces the lost lm26/kit/oplan.py). python3 oplan50.py <tmp.json> <out.png>
# plan metres (east, north) around the model origin; grey = kept real footprints, red = hidden, orange = clash, blue = hull,
# green dots = model below 4 m, thin lines = roads (bridges darker), 10 m grid ticks.
import sys, json
from PIL import Image, ImageDraw
D = json.load(open(sys.argv[1])); half = D['half']; S = 800; k = S/(2*half)
P = lambda p: (S/2 + p[0]*k, S/2 - p[1]*k)
im = Image.new('RGB', (S, S), (246, 246, 242)); dr = ImageDraw.Draw(im)
step = 10 if half <= 150 else 50
for i in range(-int(half//step), int(half//step) + 1):
    c = (232, 232, 228) if i else (205, 205, 200)
    dr.line([P((i*step, -half)), P((i*step, half))], fill=c); dr.line([P((-half, i*step)), P((half, i*step))], fill=c)
for r in D['roads']:
    if len(r['pts']) > 1: dr.line([P(p) for p in r['pts']], fill=(120, 120, 140) if r.get('bridge') else (190, 190, 200), width=2 if r.get('bridge') else 1)
FILL = {'kept':(200, 200, 200), 'hidden':(235, 120, 110), 'clash':(250, 170, 60)}
for b in sorted(D['blds'], key=lambda b: b['st'] != 'kept'):
    if len(b['ring']) > 2: dr.polygon([P(p) for p in b['ring']], fill=FILL[b['st']], outline=(110, 110, 110) if b['st'] == 'kept' else (170, 40, 30))
for p in D['g4']: x, y = P(p); dr.point((x, y), fill=(40, 150, 60))
if len(D['H']) > 2: dr.line([P(p) for p in D['H']] + [P(D['H'][0])], fill=(40, 80, 220), width=2)
dr.text((8, 8), '%s  half %d m  rot %.3f   grey kept / red hidden / orange clash / blue hull / green model < 4 m' % (D['key'], half, D['rot']), fill=(30, 30, 30))
im.save(sys.argv[2])
