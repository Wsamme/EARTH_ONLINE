# plot a ref target: buildings (osm id + h), roads with names, areas, pois. usage: plot.py ref.json key out.png [half] [poi]
import json, sys
from PIL import Image, ImageDraw
ref, key, out = sys.argv[1:4]; half = float(sys.argv[4]) if len(sys.argv) > 4 else 150; showpoi = len(sys.argv) > 5
T = json.load(open(ref))['targets'][key]; S = 900; k = S/(2*half)
P = lambda p: (S/2 + p[0]*k, S/2 + p[1]*k)
im = Image.new('RGB', (S, S), (250, 250, 250)); d = ImageDraw.Draw(im)
for a in T.get('areas', []):
    r = a.get('ring') or (a.get('rings') or [[]])[0]
    if len(r) > 2: d.polygon([P(p) for p in r], fill={'park':(205,235,200),'grass':(215,240,205),'pier':(220,220,190)}.get(a['kind'], (238,236,230)))
for b in T['buildings']:
    r = b['ring']; d.polygon([P(p) for p in r], outline=(90,90,90), fill=(200,200,215))
    for pt in b.get('parts') or []:
        d.polygon([P(p) for p in pt['ring']], outline=(150,60,60))
for b in T['buildings']:
    r = b['ring']; cx = sum(p[0] for p in r)/len(r); cz = sum(p[1] for p in r)/len(r)
    if abs(cx) < half and abs(cz) < half: d.text(P((cx-8, cz)), '%s %s\n%s' % (b.get('osm'), round(b['h']), (b.get('name') or '')[:18]), fill=(0,0,120))
for rd in T['roads']:
    pts = [P(p) for p in rd['pts']]
    d.line(pts, fill=(200,120,0) if rd.get('br') else (120,120,120), width=3 if rd['cls'] < 10 else 1)
    if rd.get('name') and len(pts) > 1: m = pts[len(pts)//2]; d.text(m, rd['name'][:20], fill=(160,80,0))
if showpoi:
    for p in T['pois']: d.ellipse([P(p['at'])[0]-2, P(p['at'])[1]-2, P(p['at'])[0]+2, P(p['at'])[1]+2], fill=(200,0,0)); d.text(P(p['at']), p['name'][:16], fill=(200,0,0))
d.line([P((-half+5, half-5)), P((-half+55, half-5))], fill=(0,0,0), width=2); d.text(P((-half+5, half-15)), '50 m', fill=(0,0,0))
im.save(out)
