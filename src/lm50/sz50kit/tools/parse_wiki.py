# parse the main table of en.wikipedia "List of tallest buildings in Shenzhen" (wikitext) -> web/tallest.json
import re, json, sys
t = open('web/en_tallest.txt').read()
main = t[t.index('==Tallest buildings=='):t.index('===Tallest buildings by district===')]
rows = main.split('\n|-\n')
def coord(s):
    m = re.search(r'\{\{coord\|([^}]*)\}\}', s)
    if not m: return None
    p = [x.strip() for x in m.group(1).split('|')]
    nums = []; i = 0
    try:
        if p[1] in ('N', 'S') or (len(p) > 2 and p[2] in ('N','S')) or (len(p) > 3 and p[3] in ('N','S')):
            # dms
            k = [j for j, x in enumerate(p) if x in ('N','S')][0]; lat = [float(x) for x in p[:k]]; e = [j for j, x in enumerate(p) if x in ('E','W')][0]; lon = [float(x) for x in p[k+1:e]]
            f = lambda a: a[0] + (a[1] if len(a) > 1 else 0)/60 + (a[2] if len(a) > 2 else 0)/3600
            return round(f(lat), 6), round(f(lon), 6)
        return float(p[0]), float(p[1])
    except Exception as ex: return None
out = []
for r in rows:
    cells = [c.strip() for c in re.split(r'\n\|(?!\|)', '\n' + r) if c.strip()]
    cells = [c for c in cells if not c.startswith('- style')]
    ri = [i for i, c in enumerate(cells) if '_row_count' in c]
    nm = [cells[ri[0] + 1]] if ri and len(cells) > ri[0] + 1 else []
    h = re.search(r'\{\{cvt\|([\d.]+)\|m', r)
    if not h: continue
    name = nm[0] if nm else '?'
    name = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', name)
    yrs = [c for c in cells if re.fullmatch(r'(19|20)\d\d.*', c)]
    fl = [c for c in cells if re.fullmatch(r'\d{2,3}', c)]
    refs = re.findall(r'url=([^|}\s]+)', r) + re.findall(r'\{\{ctbuh\|(\d+)\|([^|}]*)', r) and re.findall(r'url=([^|}\s]+)', r) + ['ctbuh:%s %s' % x for x in re.findall(r'\{\{ctbuh\|(\d+)\|([^|}]*)', r)]
    dist = re.findall(r'\[\[([^|\]]*District[^|\]]*)', r)
    out.append({'name':name, 'h':float(h.group(1)), 'floors':fl[0] if fl else None, 'year':yrs[0] if yrs else None, 'district':dist[0] if dist else None, 'coord':coord(r), 'refs':refs})
json.dump(out, open('web/tallest.json', 'w'), ensure_ascii=False, indent=0)
for o in out: print('%-55s %6.1f %4s %-12s %-30s %s' % (o['name'][:55], o['h'], o['floors'], (o['year'] or '')[:12], (o['district'] or '')[:30], o['coord']))
print(len(out))
