# draw ref footprints for a key: python3 refpng.py ref.json key out.png half [ids-to-highlight]
import json, sys
from PIL import Image, ImageDraw
d = json.load(open(sys.argv[1])); k = sys.argv[2]; out = sys.argv[3]; half = float(sys.argv[4])
t = d['targets'][k]; W = 640; s = W/(2*half)
img = Image.new('RGB', (W, W), (245, 245, 240)); dr = ImageDraw.Draw(img)
P = lambda p: ((p[0]+half)*s, (p[1]+half)*s)
for a in t.get('areas', []):
    ring = a.get('ring') or a.get('poly')
    if ring and len(ring) > 2: dr.polygon([P(p) for p in ring], fill=(220, 236, 214))
for r in t['roads']:
    pts = r.get('pts') or r.get('p') or r.get('line')
    if pts: dr.line([P(p) for p in pts], fill=(200, 160, 120) if r.get('br') else (190, 190, 200), width=max(1, int((r.get('w') or 4)*s/2)))
for i, b in enumerate(t['buildings']):
    ring = b['ring']
    if len(ring) < 3: continue
    col = (180, 60, 60) if b.get('name') else (120, 120, 120)
    dr.polygon([P(p) for p in ring], outline=col, fill=(230, 220, 215) if b.get('name') else None)
    cx = sum(p[0] for p in ring)/len(ring); cz = sum(p[1] for p in ring)/len(ring)
    if abs(cx) < half and abs(cz) < half: dr.text(P((cx, cz)), str(i) + ':' + str(int(b.get('h') or 0)), fill=(0, 0, 0))
    for pt in b.get('parts') or []:
        pr = pt.get('ring')
        if pr and len(pr) > 2: dr.polygon([P(p) for p in pr], outline=(40, 90, 200))
for x in range(-int(half), int(half)+1, 10):
    c = (150, 150, 150) if x % 50 == 0 else (232, 232, 232)
    if x % 50 == 0: dr.line([P((x, -half)), P((x, half))], fill=(210, 210, 210)); dr.line([P((-half, x)), P((half, x))], fill=(210, 210, 210))
dr.line([P((-3, 0)), P((3, 0))], fill=(0, 0, 255)); dr.line([P((0, -3)), P((0, 3))], fill=(0, 0, 255))
img.save(out)
