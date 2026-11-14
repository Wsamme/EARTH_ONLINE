# The Hong Kong rail lines the app draws (shared by b4_roads: their ways are not plain rail, and b6_misc: the rail layer).
# All route relations of a line are used (both directions, branches: East Rail to Lo Wu and Lok Ma Chau, the Racecourse); the
# overlapping track of one group is drawn once (b6). Colours are the OSM route relations' `colour` tags (the MTR line colours);
# Shenzhen Metro is faded context (its colour mixed 55 % towards grey).
MTR = {  # ref: (code, English, Chinese (Simplified))
 'EAL':('MEAL', 'East Rail Line', '东铁线'), 'TML':('MTML', 'Tuen Ma Line', '屯马线'), 'TWL':('MTWL', 'Tsuen Wan Line', '荃湾线'), 'KTL':('MKTL', 'Kwun Tong Line', '观塘线'),
 'ISL':('MISL', 'Island Line', '港岛线'), 'TKL':('MTKL', 'Tseung Kwan O Line', '将军澳线'), 'TCL':('MTCL', 'Tung Chung Line', '东涌线'), 'AEL':('MAEL', 'Airport Express', '机场快线'),
 'SIL':('MSIL', 'South Island Line', '南港岛线'), 'DRL':('MDRL', 'Disneyland Resort Line', '迪士尼线')}
def fade(c, k=0.55, g=(150, 150, 150)):
    c = c.lstrip('#'); r, gg, b = int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)
    return '#%02x%02x%02x' % tuple(int(v*(1 - k) + m*k) for v, m in zip((r, gg, b), g))
def select(ROUTES):
    groups = {}
    for rid, t, mem in ROUTES:
        rt = t.get('route'); net = (t.get('network') or '') + ' ' + (t.get('operator') or ''); ref = (t.get('ref') or '').strip(); nm = t.get('name') or ''
        col = t.get('colour') or ''
        nw = sum(1 for m in mem if m[0] == 'w' and m[2] in ('', 'forward', 'backward'))
        key = None
        if rt == 'subway' and ('MTR' in net or '港鐵' in net) and ref in MTR:
            c, en, z = MTR[ref]; key = ('mtr', ref, 'MTR ' + en, '港铁' + z, col or None, 0)      # code = the MTR line abbreviation
        elif rt == 'light_rail' and ('Light Rail' in net or '輕鐵' in net) and ref:
            key = ('lr', 'L' + ref, 'Light Rail ' + ref, '轻铁 %s 线' % ref, col or '#808080', 1)
        elif rt == 'tram' and ('Tramways' in net or '電車' in net):
            key = ('tram', 'TR', 'Hong Kong Tramways', '香港电车', None, 1)       # one network (all routes share the track)
        elif rt == 'funicular' and 'Peak' in nm:
            key = ('peak', 'PK', 'Peak Tram', '山顶缆车', col or '#7a6a5a', 1)          # no OSM colour: a neutral brown-grey
        elif rt == 'subway' and '深圳地铁' in net and ref:
            r0 = ref.split(';')[0]
            key = ('szm', 'Z' + r0, 'Shenzhen Metro Line ' + r0, '深圳地铁%s号线' % r0 if r0.isdigit() else '深圳地铁' + r0 + '线', fade(col) if col else '#9a9a9a', 0)
        if not key: continue
        g = groups.setdefault(key[1], {'grp':key[0], 'code':key[1], 'en':key[2], 'zh':key[3], 'col':key[4], 'lrt':key[5], 'cand':[]})
        if key[4] and not g['col']: g['col'] = key[4]
        if key[0] == 'tram' and 'Shau Kei Wan to Kennedy Town' in nm: g['col'] = col        # the full line's route colour
        g['cand'].append((nw, rid, nm))
    out = []
    for code, g in groups.items():
        g['cand'].sort(reverse=True)
        out.append({'code':code, 'rids':[c[1] for c in g['cand']], 'en':g['en'], 'zh':g['zh'], 'col':g['col'] or '#808080', 'grp':g['grp'], 'lrt':g['lrt']})
    order = {'mtr':0, 'lr':1, 'tram':2, 'peak':3, 'szm':4}
    out.sort(key=lambda d: (order[d['grp']], d['code']))
    return out
if __name__ == '__main__':
    import pickle, sys
    sys.path.insert(0, '.')
    from common import OUT
    L = select(pickle.load(open(OUT + 'raw_routes.pkl', 'rb')))
    for d in L: print(d['code'], len(d['rids']), d['en'], d['zh'], d['col'], d['grp'], d['lrt'])
    print(len(L))
