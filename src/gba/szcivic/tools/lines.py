# list road lines (cls, bridge, layer, coords local, elev) inside a circle round lat,lon: lines.py lat lon r [clsmin]
import sys, os, pickle
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad'
sys.path.insert(0, SC+'/gbareal'); from common import *
from shapely.geometry import Point
lat,lon,r=float(sys.argv[1]),float(sys.argv[2]),float(sys.argv[3]); cmin=int(sys.argv[4]) if len(sys.argv)>4 else 0
R=load('roads.pkl'); ax,ay=w(lon,lat); C=Point(ax,ay).buffer(r)
for i,l in enumerate(R['lines']):
    if l['c']<cmin or not l['g'].intersects(C): continue
    el=R['elev'].get(i)
    if not l['br'] and el is None: continue
    cs=[(round(x-ax,1),round(-(y-ay),1)) for x,y in l['g'].coords]
    print(i,l['c'],bool(l['br']),l.get('layer',0),l['name'],cs,el and [round(v,1) for v in el])
