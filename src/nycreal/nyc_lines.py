# The New York transit lines the app draws (shared by b4_roads: their ways are not plain rail, and b6_misc: the rail layer).
# One entry per line: the route relation with the most ways inside the square (plus the other direction where it has its own
# track pieces); overlapping track of the lines of one group is drawn once (b6).
SUB_COL = {'1':'#EE352E', '2':'#EE352E', '3':'#EE352E', '4':'#00933C', '5':'#00933C', '6':'#00933C', '7':'#B933AD', 'A':'#0039A6', 'C':'#0039A6', 'E':'#0039A6',
           'B':'#FF6319', 'D':'#FF6319', 'F':'#FF6319', 'M':'#FF6319', 'G':'#6CBE45', 'J':'#996633', 'Z':'#996633', 'L':'#A7A9AC', 'N':'#FCCC0A', 'Q':'#FCCC0A', 'R':'#FCCC0A', 'W':'#FCCC0A', 'S':'#808183'}
LIRR_ZH = {'Port Jefferson':'杰斐逊港', 'Oyster Bay':'牡蛎湾', 'Port Washington':'华盛顿港', 'West Hempstead':'西亨普斯特德', 'Babylon':'巴比伦', 'Hempstead':'亨普斯特德', 'Ronkonkoma':'朗孔科马',
           'Long Beach':'长滩', 'Far Rockaway':'远洛克威', 'Montauk':'蒙托克'}
MNR = {'Harlem':('NH', '哈莱姆线', '#0039A6'), 'Hudson':('NU', '哈德逊线', '#009B3A'), 'New Haven':('NN', '纽黑文线', '#EE0034')}
NJT = {'North Jersey Coast':('JC', '北泽西海岸线'), 'Main':('JM', '主线'), 'Gladstone':('JG', '格拉德斯通支线'), 'Bergen County':('JB', '伯根县线'), 'Morristown':('JT', '莫里斯敦线'),
       'Montclair-Boonton':('JO', '蒙特克莱尔-布恩顿线'), 'Pascack Valley':('JP', '帕斯卡克谷线'), 'NEC':('JE', '东北走廊线'), 'Raritan Valley':('JR', '拉里坦谷线'), 'Meadowlands':('JD', '梅多兰兹线')}
PATH = {'NWK–WTC':('PN', 'PATH 纽瓦克-世贸中心线', '#D93A30'), 'HOB–WTC':('PH', 'PATH 霍博肯-世贸中心线', '#65C100'), 'JSQ–33':('PJ', 'PATH 新闻广场-33街线', '#FF9900'),
        'HOB–33':('PB', 'PATH 霍博肯-33街线', '#4D92FB')}
def select(ROUTES):
    W = None
    groups = {}
    for rid, t, mem in ROUTES:
        rt = t.get('route'); net = t.get('network') or t.get('operator') or ''; ref = t.get('ref') or ''; nm = t.get('name') or ''
        nw = sum(1 for m in mem if m[0] == 'w' and m[2] in ('', 'forward', 'backward'))
        key = None
        if rt == 'subway' and net == 'NYC Subway' and ref:
            if ref.startswith('<'): continue
            if ref == 'S':
                sh = 'F' if 'Franklin' in nm else 'R' if 'Rockaway' in nm else None
                if not sh: continue                                    # the 42nd Street shuttle is underground
                key = ('subway', 'SS' + sh, 'Subway S ' + ('Franklin Avenue Shuttle' if sh == 'F' else 'Rockaway Park Shuttle'), '地铁 S 线' + ('（富兰克林大道接驳）' if sh == 'F' else '（洛克威公园接驳）'), SUB_COL['S'], 0)
            else:
                key = ('subway', 'S' + ref, 'Subway ' + ref, '地铁 %s %s' % (ref, '号线' if ref.isdigit() else '线'), SUB_COL.get(ref, '#808183'), 0)
        elif rt == 'subway' and net == 'Staten Island Railway':
            key = ('subway', 'SI', 'Staten Island Railway', '史泰登岛铁路', '#1D2F6F', 0)
        elif rt == 'subway' and net == 'PATH' and ref in PATH:
            c, z, col = PATH[ref]; key = ('path', c, 'PATH ' + ref, z, col, 0)
        elif rt == 'train' and net == 'LIRR' and ref in LIRR_ZH:
            key = ('lirr', 'L' + (''.join(w[0] for w in ref.split()) + ref[1])[:2].upper(), 'LIRR ' + ref + ' Branch', '长岛铁路 %s支线' % LIRR_ZH[ref], t.get('colour') or '#0039A6', 0)
        elif rt == 'train' and net == 'Metro-North Railroad' and ref in MNR:
            c, z, col = MNR[ref]; key = ('mnr', c, 'Metro-North ' + ref + ' Line', '大都会北方铁路 ' + z, col, 0)
        elif rt == 'train' and net == 'NJ Transit' and ref in NJT:
            c, z = NJT[ref]; key = ('njt', c, 'NJ Transit ' + (ref if ref != 'NEC' else 'Northeast Corridor') + ' Line', '新泽西公交 ' + z, t.get('colour') if (t.get('colour') or '').upper() not in ('', '#FFFFFF') else '#A0A0A0', 0)
        elif rt == 'light_rail' and net == 'AirTrain JFK':
            sub = 'J' if 'Jamaica' in nm else 'H' if 'Howard' in nm else 'T'
            key = ('air', 'AJ' + sub, 'AirTrain JFK (' + nm + ')', '肯尼迪机场空中列车', '#5A6E8C', 0)
        elif rt == 'light_rail' and ('Hudson' in nm and 'Bergen' in nm):
            key = ('hblr', 'HB' + ('B' if '8th Street' in nm else 'W' if 'West Side' in nm else 'T'), 'Hudson–Bergen Light Rail', '哈德逊-伯根轻轨', '#00AEEF', 1)
        elif rt == 'light_rail' and net == 'Newark Light Rail':
            key = ('nlr', 'WL' + ('B' if 'Broad Street' in nm else 'G'), 'Newark Light Rail', '纽瓦克轻轨', '#3096C2', 1)
        if not key: continue
        g = groups.setdefault(key[1], {'grp':key[0], 'code':key[1], 'en':key[2], 'zh':key[3], 'col':key[4], 'lrt':key[5], 'cand':[]})
        g['cand'].append((nw, rid, nm))
    out = []
    for code, g in groups.items():
        g['cand'].sort(reverse=True)
        # the longest relation and the longest one of the opposite direction (its own one-way pieces: loops, flying junctions)
        rids = [g['cand'][0][1]]
        n0 = g['cand'][0][2]
        for nw, rid, nm in g['cand'][1:]:
            if '→' in n0 and '→' in nm:
                a, b = n0.split(':')[-1].split('→'), nm.split(':')[-1].split('→')
                if len(a) == 2 and len(b) == 2 and a[0].strip() == b[1].strip() and a[1].strip() == b[0].strip(): rids.append(rid); break
            elif '=>' in n0 and '=>' in nm and nm != n0: rids.append(rid); break
        out.append({'code':code, 'rids':rids, 'en':g['en'], 'zh':g['zh'], 'col':g['col'], 'grp':g['grp'], 'lrt':g['lrt']})
    order = {'subway':0, 'path':1, 'air':2, 'hblr':3, 'nlr':4, 'lirr':5, 'mnr':6, 'njt':7}
    out.sort(key=lambda d: (order[d['grp']], d['code']))
    return out
if __name__ == '__main__':
    import pickle, sys
    sys.path.insert(0, '.')
    from common import OUT
    L = select(pickle.load(open(OUT + 'raw_routes.pkl', 'rb')))
    for d in L: print(d['code'], d['rids'], d['en'], d['zh'], d['col'], d['grp'], d['lrt'])
    print(len(L))
