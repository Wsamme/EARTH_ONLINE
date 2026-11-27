import json, math
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/lm50/sz/'
LON0, LAT0, MX, MY = 114.0520475, 22.6560705, 103014.2, 110734.9
def w(lon, lat): return ((lon - LON0)*MX, (lat - LAT0)*MY)
def dist(a, b, c, d): x1, y1 = w(b, a); x2, y2 = w(d, c); return math.hypot(x1 - x2, y1 - y2)
INV = json.load(open(SC + 'inv.json'))['items']
def near_existing(lat, lon, extra=0):
    out = []
    for i in INV:
        dd = dist(lat, lon, i['lat'], i['lon'])
        if dd < max(i['r'], 30) + extra: out.append((round(dd), i['k'], i['r']))
    return sorted(out)
def H(t):
    try:
        if 'height' in t: return float(t['height'].replace('m','').replace(',', '.').strip().split()[0])
    except: pass
    try:
        if 'building:levels' in t: return round(float(t['building:levels'])*3.1+1, 1)
    except: pass
    return 0
def pip(x, y, poly):
    n = len(poly); c = False
    for i in range(n):
        x1, y1 = poly[i]; x2, y2 = poly[(i + 1) % n]
        if (y1 > y) != (y2 > y) and x < (x2 - x1)*(y - y1)/(y2 - y1) + x1: c = not c
    return c
def occupied(lat, lon, pad=0):
    """existing landmark within its r (+pad), or inside a site's keep polygon (local x east, z south)"""
    out = []
    for i in INV:
        dd = dist(lat, lon, i['lat'], i['lon'])
        if i['site'] and isinstance(i.get('keep'), list):
            ax, ay = w(i['lon'], i['lat']); x, y = w(lon, lat)
            if pip(x - ax, -(y - ay), i['keep']): out.append((round(dd), i['k'], 'in-keep'))
            elif dd < 60: out.append((round(dd), i['k'], 'near-site'))
        elif dd < max(i['r'], 25) + pad: out.append((round(dd), i['k'], 'r%d' % i['r']))
    return sorted(out)
