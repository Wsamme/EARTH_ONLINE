import sys; sys.path.insert(0, '.')
from common import *
from PIL import Image, ImageDraw
lon0, lat0, lon1, lat1, scale, name = float(sys.argv[1]), float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), sys.argv[6]
x0, y0 = w(lon0, lat0); x1, y1 = w(lon1, lat1)
W, Hh = int((x1 - x0)/scale), int((y1 - y0)/scale)
img = Image.open(OUT + 'ground.webp').convert('RGB')
RES = 2*HALF/4096
crop = img.crop((int((x0 + HALF)/RES), int((HALF - y1)/RES), int((x1 + HALF)/RES), int((HALF - y0)/RES))).resize((W, Hh), Image.BILINEAR)
d = ImageDraw.Draw(crop)
P = lambda c: [((x - x0)/scale, (y1 - y)/scale) for x, y in c]
R = load('roads.pkl')
WID = {0:13, 1:6.5, 2:11, 3:6.5, 4:12, 5:6, 6:10, 7:5.5, 8:8, 9:5, 10:6.5, 11:4.5, 12:2.5, 13:60, 14:23, 15:4, 16:3, 17:4, 18:12}
for l in sorted(R['lines'], key=lambda l: -l['c']):
    b = l['g'].bounds
    if b[2] < x0 or b[0] > x1 or b[3] < y0 or b[1] > y1: continue
    col = (250, 250, 248) if l['c'] >= 10 else (255, 226, 160) if l['c'] >= 4 else (250, 190, 120)
    if l['c'] == 12: col = (240, 236, 220)
    if l['br'] and l.get('hmax', 0) > 0.5: col = (230, 120, 90)
    d.line(P(l['g'].coords), fill=col, width=max(1, int(WID[l['c']]/scale)))
B = load('buildings.pkl')
for b in B['b']:
    bb = b['g'].bounds
    if bb[2] < x0 or bb[0] > x1 or bb[3] < y0 or bb[1] > y1: continue
    hcol = min(255, int(b['h']*2))
    d.polygon(P(b['g'].exterior.coords), fill=(120 + hcol//3, 110, 200 - hcol//2), outline=(60, 60, 70))
crop.save(OUT + 'prev_' + name + '.png'); print(W, Hh)
