# The Tokyo rail lines the app draws (shared by b4_roads: their ways are not plain rail, and b6_misc: the rail layer).
# Generic, from the OSM route relations (route = train, subway, light_rail, monorail, tram) inside the square: one entry per line
# (the relations of one line — directions, branches' main relation, service variants with the same name — are grouped by the
# line name without its direction / "A → B" part); the relation with the most ways inside the square is drawn, plus the longest
# one of a different variant when it adds track (loops, the other direction's own pieces). Colours from the relations' colour tag.
# Codes (the app uses the first letter for the train model): J = JR conventional lines, S = Shinkansen, M = Tokyo Metro,
# T = Toei subway, Y = Yokohama Municipal Subway, P = private railways, A = automated guideway transit (Yurikamome, Nippori-Toneri
# Liner, Seaside Line, New Shuttle), O = monorails, L = trams (Toden Arakawa, Tokyu Setagaya).
import re, collections
from ja_names import kanji_zh, _T2S
KATA = [('東京メトロ', '东京地铁'), ('メトロ', '地铁'), ('モノレール', '单轨电车'), ('ニューシャトル', '新穿梭'), ('シーサイドライン', '海岸线'), ('ライナー', '线'), ('ライン', '线'),
        ('ブルー', '蓝'), ('グリーン', '绿'), ('エクスプレス', '快线'), ('りんかい', '临海'), ('ゆりかもめ', '百合海鸥'), ('つくば', '筑波'), ('みなとみらい', '港未来'),
        ('ディズニーリゾート', '迪士尼度假区'), ('東京さくらトラム', '都电荒川线'), ('さくらトラム', '都电荒川线'), ('アクセス', '机场'), ('スカイ', '天空'), ('ツリー', '树'),
        ('ユーカリが丘', '油加利丘'), ('ディズニー', '迪士尼'), ('・', '·'), ('（', '('), ('）', ')')]
def line_zh(nm):
    if not nm: return None
    s = nm
    for a, b in KATA: s = s.replace(a, b)
    s = s.replace('(', '').replace(')', '')
    k = kanji_zh(s.replace('·', '・'))
    if k: return k.replace('・', '·')
    # mixed scripts left: keep what converts, if no kana remain
    if not re.search(r'[぀-ヿ]', s):
        t = s
        from ja_names import _K2T
        return _T2S.convert(t.replace('駅', '站').translate(_K2T))
    return None
SERV = r'(High-speed Limited|Commuter|空港|区間|各駅停車|各駅|普通|快速|急行|快特|特急|準急|通勤快速|通勤急行|通勤準急|区間急行|区間準急|区間快速|特別快速|急行線|緩行線のみ|Local|Rapid|Express|LTD\.Exp\.)'
def base_name(nm):
    nm = (nm or '').replace('　', ' ')
    nm = re.split(r'[:：]', nm)[0].strip()
    nm = re.sub(r'\s*[\(（][^\)）]*[\)）]\s*$', '', nm).strip()
    for _ in range(3):
        nm2 = re.sub(r'\s*' + SERV + r'$', '', nm).strip()
        nm2 = re.sub(r'\s*(上り|下り|内回り|外回り|東行|西行|北行|南行|直通)$', '', nm2).strip()
        if nm2 == nm: break
        nm = nm2
    return nm
OPS = [('東京地下鉄', ''), ('東京メトロ', ''), ('都営', ''), ('JR', ''), ('ＪＲ', ''), ('京成電鉄', '京成'), ('京浜急行電鉄', '京急'), ('京王電鉄', '京王'), ('小田急電鉄', '小田急'),
       ('西武鉄道', '西武'), ('東武鉄道', '東武'), ('東急電鉄', '東急'), ('相模鉄道', '相鉄'), (' ', ''), ('・', '')]
def core(nm):
    for a, b in OPS: nm = nm.replace(a, b)
    return nm
SHINK = {'のぞみ':'東海道新幹線', 'ひかり':'東海道新幹線', 'こだま':'東海道新幹線'}
def classify(t):
    rt = t.get('route'); net = (t.get('network') or '') + ' ' + (t.get('operator') or ''); nm = t.get('name') or ''
    s = net + ' ' + nm
    if rt == 'tram': return 'L', 'tram'
    if rt == 'monorail' or 'モノレール' in s or 'Monorail' in s or 'ディズニーリゾートライン' in s: return 'O', 'mono'
    if 'ゆりかもめ' in s or '舎人' in s or 'シーサイドライン' in s or 'ニューシャトル' in s or 'Yurikamome' in s: return 'A', 'agt'
    if '新幹線' in s or 'Shinkansen' in s: return 'S', 'shink'
    if '東京メトロ' in s or 'Tokyo Metro' in s: return 'M', 'metro'
    if '都営' in s or 'Toei' in s:
        if '荒川' in s: return 'L', 'tram'
        return 'T', 'toei'
    if '横浜市営' in s or 'Yokohama Municipal' in s or 'ブルーライン' in s or 'グリーンライン' in s: return 'Y', 'ysub'
    if '世田谷線' in s: return 'L', 'tram'
    if rt == 'light_rail': return 'A', 'agt'
    if 'JR' in s or 'ＪＲ' in s or '東日本旅客鉄道' in s or '東海旅客鉄道' in s or '日本貨物' in s: return 'J', 'jr'
    if rt == 'subway': return 'T', 'toei'
    return 'P', 'priv'
def ways_inside(WAYS, HALF=28000):
    """{way id: metres inside the square} of the railway ways (WAYS: [(id, tags, coords (n, 2) metres)])"""
    import numpy as np
    from shapely.geometry import LineString, box
    SQ = box(-HALF, -HALF, HALF, HALF); out = {}
    for wid, t, cs in WAYS:
        if 'railway' in t and (np.abs(cs).max(1) < HALF).any(): out[wid] = LineString(cs).intersection(SQ).length
    return out
def select(ROUTES, ways_in=None):
    """ROUTES: [(rid, tags, members)]; ways_in: set of way ids inside the square (to rank relations); -> list of line dicts"""
    groups = {}
    for rid, t, mem in ROUTES:
        rt = t.get('route')
        if rt not in ('train', 'subway', 'light_rail', 'monorail', 'tram'): continue
        if t.get('service') in ('long_distance', 'night') and '新幹線' not in (t.get('name') or ''): continue
        if t.get('passenger') == 'no' or 'cargo' in (t.get('usage') or '') or t.get('route') == 'train' and 'Freight' in (t.get('name:en') or ''): continue
        nm = t.get('name') or t.get('name:ja') or ''
        if not nm: continue
        sh = SHINK.get(base_name(nm))
        if sh: nm = sh; t = dict(t, name=sh, **{'name:en':'Tōkaidō Shinkansen'})
        # services, not lines: kana-only names (はやて, さざなみ, ふじさん ...), '... 列車', through services (直通), liners, airport / sky-access
        # expresses, freight (臨海鉄道), short shuttles (A => B)
        nm0 = nm; nm = base_name(nm) or nm
        if not re.search(r'[一-鿿]', re.sub(r'^(JR|ＪＲ)', '', nm)) and not re.search(r'ゆりかもめ|りんかい|つくばエクスプレス|みなとみらい|ディズニーリゾートライン|ニューシャトル|シーサイドライン', nm): continue
        if g0_ := None: pass
        if re.search(r'・|•|&', nm) and classify(t)[0] == 'P': continue          # combined services (京成本線・千葉線 ...): their lines are drawn
        if classify(t)[0] == 'P' and not re.search(r'(線|ライン|電鉄|鉄道|エクスプレス)$', base_name(nm)) or re.sub(r'(電鉄|鉄道)$', '', core(base_name(nm))) in ('相鉄', '小田急', '京王', '西武', '東武', '京成', '京急', '東急'): continue
        if re.search(r'踊り子|東京地下鉄-|湘南|小江戸|通勤|列車|直通|寝台|サンライズ|ライナー|成田エクスプレス|スカイライナー|特急|臨時|貨物|臨海鉄道|エアポート|アクセス|快特|シテイ|ウエスタンリバー|=>|->|→|中央新幹線|Limited Express', nm) and '日暮里・舎人' not in nm: continue
        if t.get('route') == 'train' and '新幹線' not in nm and re.search(r'^(はやて|こまち|はやぶさ|やまびこ|なすの|つばさ|とき|たにがわ|かがやき|はくたか|あさま)', nm): continue
        nm = nm0
        nw = sum((ways_in.get(m[1], 0) if isinstance(ways_in, dict) else 1) for m in mem if m[0] == 'w' and m[2] in ('', 'forward', 'backward', 'main') and (ways_in is None or m[1] in ways_in))
        if nw == 0: continue
        g0, grp = classify(t)
        bn = base_name(nm); key = (g0, (t.get('operator') or t.get('network') or '')[:6] if g0 == 'P' and core(bn) in ('本線', '線') else '', core(bn))
        en = t.get('name:en') or ''
        en = re.sub(r'\s*\(.*$', '', base_name(re.split(r'[:：]', en)[0])) if en else ''
        g = groups.setdefault(key, {'g0':g0, 'grp':grp, 'name':bn, 'en':en, 'cand':[], 'col':None, 'ref':t.get('ref')})
        if en and not g['en']: g['en'] = en
        c = t.get('colour') or t.get('color')
        if c and re.match(r'^#?[0-9A-Fa-f]{6}$', c) and not g['col']: g['col'] = '#' + c.lstrip('#').upper()
        g['cand'].append((nw, rid, nm))
    out = []; used = collections.Counter()
    for key, g in groups.items():
        g['cand'].sort(reverse=True)
        if g['cand'][0][0] < (1200 if isinstance(ways_in, dict) else 6): continue          # a few hundred metres inside the square only
        rids = [g['cand'][0][1]]
        for nw, rid, nm in g['cand'][1:]:
            if nw >= 0.25*g['cand'][0][0] and nm != g['cand'][0][2]: rids.append(rid)
            if len(rids) >= 3: break
        used[g['g0']] += 1
        code = g['g0'] + '%02d' % used[g['g0']]
        zh = line_zh(g['name']) or g['en'] or g['name']
        col = g['col'] or {'J':'#7A8A7A', 'S':'#3A6EA5', 'M':'#9A9A9A', 'T':'#8A8A8A', 'Y':'#3060B0', 'P':'#A08070', 'A':'#40A0C0', 'O':'#5A7E9C', 'L':'#C06080'}[g['g0']]
        out.append({'code':code, 'rids':rids, 'en':g['en'] or g['name'], 'zh':zh, 'ja':g['name'], 'col':col, 'grp':g['grp'], 'lrt':1 if g['g0'] in ('L',) else 0})
    order = {'jr':0, 'shink':1, 'metro':2, 'toei':3, 'ysub':4, 'priv':5, 'agt':6, 'mono':7, 'tram':8}
    out.sort(key=lambda d: (order[d['grp']], d['code']))
    return out
if __name__ == '__main__':
    import pickle, sys
    sys.path.insert(0, '.')
    from common import OUT
    L = select(pickle.load(open(OUT + 'raw_routes.pkl', 'rb')))
    for d in L: print(d['code'], d['rids'], d['en'], '|', d['zh'], '|', d['ja'], d['col'], d['grp'])
    print(len(L))
