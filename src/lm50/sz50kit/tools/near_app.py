# app buildings (this build) near a point with heights: python3 near_app.py lat lon r [minh]
import sys, json; sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
import appbld as A
G = json.load(open('/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/lm50/sz/web/geom.json'))
from shapely.geometry import Point
args = sys.argv[1:]
for k in range(0, len(args), 4):
    lat, lon, r, mh = float(args[k]), float(args[k+1]), float(args[k+2]), float(args[k+3])
    print('##', lat, lon, r)
    for b, g in A.at(lat, lon, r):
        if b['h'] < mh: continue
        c = g.centroid; la, lo = A.ll(c.x, c.y)
        print('   h %.1f base %.1f part %s area %d at %.6f,%.6f' % (b['h'], b['base'], b['part'], g.area, la, lo))
