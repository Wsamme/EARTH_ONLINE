#!/usr/bin/env python3
# Collects every sign spec list (SC/hkv/*/signs_*.json, incl. SC/hkv/scout/signs_scout_*.json) into the data block of
# hkv/hksigns/hksigns.js (between the /*@@HKSPEC*/ and /*@@END*/ markers).
#   python3 hkv/hksigns/gen.py            # writes the block, prints a summary and the warnings
#   python3 hkv/hksigns/gen.py --check    # only validates, writes nothing
# Specs follow SC/hkv/BRIEF_HKV.md. `bld` ids are resolved against hkreal/out/buildings.pkl: the footprint's inner point
# (bx, by world metres) and its OSM height go into the block, so the engine finds the real building (and its roof) at runtime.
import json, glob, os, re, sys
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
MOD = SC + 'hkv/hksigns/hksigns.js'
KINDS = {'roof', 'letters', 'wall', 'box', 'led', 'blade', 'over', 'band'}
LITS = {'neon', 'box', 'led', 'flood', 'off'}
ANIMS = {'none', 'flash', 'chase', 'seq', 'scroll', 'cycle', 'screen'}
FONTS = {'hei', 'song', 'kai', 'wei', 'sans', 'serif'}
# real brands / chains / famous named venues that must not appear (also as part of a name); the brief forbids near-copies too,
# so this list is only a safety net, not the rule
BLACK = ['匯豐', '汇丰', '恒生', '恆生', '中銀', '中银', '渣打', '東亞銀行', '大新', '永隆', '美心', '大家樂', '大快活', '翠華', '太興', '譚仔',
         '周大福', '周生生', '六福', '謝瑞麟', '金至尊', '萬寧', '屈臣氏', '莎莎', '卓悅', '百佳', '惠康', '豐澤', '百老匯', '時間廊', '東方表行',
         '英皇', '寶光', '余仁生', '位元堂', '李錦記', '奇華', '榮華', '鴻福堂', '許留山', '滿記', '稻香', '鏞記', '陸羽', '蓮香', '利苑', '福臨門',
         '新鴻基', '長江', '和記', '太古', '怡和', '置地', '信和', '恒基', '恆基', '嘉里', '新世界', '華潤', '牛奶公司', '7-ELEVEN', 'SEIKO', 'CANON',
         'NIKON', 'SONY', 'SAMSUNG', 'TOSHIBA', 'PANASONIC', 'NATIONAL', 'PHILIPS', 'HITACHI', 'SHARP', 'FUJI', 'CASIO', 'CITIZEN', 'ROLEX', 'OMEGA',
         'TISSOT', 'RADO', 'LONGINES', 'COCA', 'PEPSI', 'SAN MIGUEL', 'CARLSBERG', 'HEINEKEN', 'MARLBORO', 'HSBC', 'HANG SENG', 'BANK OF', 'STANDARD CHARTERED',
         'MANNINGS', 'WATSONS', 'SASA', 'BONJOUR', 'FORTRESS', 'BROADWAY', 'CHOW TAI FOOK', 'LUKFOOK', 'MAXIM', 'CAFE DE CORAL', 'MCDONALD', 'KFC',
         'STARBUCKS', 'PIZZA HUT', 'YOSHINOYA', 'GIORDANO', 'BOSSINI', 'ESPRIT', 'UNIQLO', 'ZARA', 'H&M', 'NIKE', 'ADIDAS', 'PUMA', 'APPLE', 'HUAWEI',
         'XIAOMI', 'OPPO', 'VIVO', 'LENOVO', 'TCL', 'MIDEA', 'HAIER', 'LG', 'AIA', 'PRUDENTIAL', 'MANULIFE', 'CATHAY', 'DRAGONAIR', 'MTR', 'KMB',
         'TVB', 'ATV', 'PCCW', 'CSL', 'SMARTONE', '3HK', 'HKT', 'CHINA MOBILE', 'CHINA UNICOM', 'BOC', 'ICBC', 'CCB', 'CITIC', 'PING AN', 'SINOPEC']

def load_bld():
    import pickle
    d = pickle.load(open(SC + 'hkreal/out/buildings.pkl', 'rb'))
    return {b['id']: b for b in d['b']}

def main():
    check = '--check' in sys.argv
    files = sorted(set(glob.glob(SC + 'hkv/*/signs_*.json') + glob.glob(SC + 'hkv/scout/signs_scout_*.json')))
    files = [f for f in files if '/hksigns/' not in f or os.path.basename(f).startswith('signs_hksigns')]
    # the scout's lists first: when a builder's list (hkv/<builder>/signs_*.json) has the same id, the builder's entry wins
    files = [f for f in files if '/scout/' in f] + [f for f in files if '/scout/' not in f]
    for i, x in enumerate(sys.argv):
        if x == '--with' and i + 1 < len(sys.argv): files.append(os.path.abspath(sys.argv[i + 1]))     # extra test files
    specs, warn, ids, scout_ids = [], [], {}, set()
    for f in files:
        try: L = json.load(open(f))
        except Exception as e: warn.append('%s: unreadable (%s)' % (f, e)); continue
        if isinstance(L, dict): L = L.get('signs', [])
        for i, s in enumerate(L):
            sid = s.get('id') or '%s#%d' % (os.path.basename(f), i)
            w = lambda m: warn.append('%s %s: %s' % (os.path.relpath(f, SC), sid, m))
            if sid in ids:
                if sid in scout_ids and '/scout/' not in f: w('replaces the scout entry'); specs[ids[sid]] = None; del ids[sid]; scout_ids.discard(sid)
                else: w('duplicate id, skipped'); continue
            if s.get('drop') or 'lat' not in s:
                w('dropped (an entry without lat/lon only removes the same id from an earlier list)'); continue
            try: lat, lon = float(s['lat']), float(s['lon'])
            except Exception: w('bad lat/lon, skipped'); continue
            if not (22.087 < lat < 22.593 and 113.848 < lon < 114.392): w('outside the map, skipped'); continue
            kind = s.get('kind', 'wall')
            if kind not in KINDS: w('kind %r -> wall' % kind); kind = 'wall'
            txt = (str(s.get('text') or '') + ' ' + str(s.get('sub') or '')).upper()
            bad = [b for b in BLACK if b.upper() in txt]
            if bad: w('text %r contains a real brand (%s), skipped' % (txt.strip(), ', '.join(bad))); continue
            o = {'id': sid, 'lat': round(lat, 6), 'lon': round(lon, 6), 'kind': kind}
            for k in ('w', 'h', 'y', 'az'):
                if s.get(k) is not None:
                    try: o[k] = round(float(s[k]), 2)
                    except Exception: w('bad %s' % k)
            o.setdefault('w', 4.0); o.setdefault('h', 1.5); o.setdefault('az', 0.0)
            o['w'] = max(0.3, min(120.0, o['w'])); o['h'] = max(0.3, min(80.0, o['h']))
            if s.get('sides') in (1, 2, '1', '2'): o['sides'] = int(s['sides'])
            for k in ('text', 'sub'):
                if s.get(k): o[k] = str(s[k])[:40]
            if s.get('vert'): o['vert'] = 1
            font = s.get('font') or 'hei'
            if font not in FONTS: w('font %r -> hei' % font); font = 'hei'
            o['font'] = font
            for k in ('bg', 'fg', 'edge'):
                v = s.get(k)
                if v is None: o[k] = None if k != 'fg' else '#ff2a2a'
                elif isinstance(v, str) and re.fullmatch(r'#[0-9a-fA-F]{6}', v): o[k] = v.lower()
                elif isinstance(v, str) and re.fullmatch(r'#[0-9a-fA-F]{3}', v): o[k] = '#' + ''.join(c*2 for c in v[1:]).lower()
                else: w('bad colour %s=%r' % (k, v)); o[k] = None if k != 'fg' else '#ff2a2a'
            if 'bg' not in s: o['bg'] = '#101010'
            lit = s.get('lit') or 'neon'
            if lit not in LITS: w('lit %r -> neon' % lit); lit = 'neon'
            o['lit'] = lit
            an = s.get('anim') or 'none'
            if an not in ANIMS: w('anim %r -> none' % an); an = 'none'
            o['anim'] = an
            if s.get('roof') is True: o['roof'] = 1
            if s.get('lm'): o['lm'] = str(s['lm'])
            if s.get('bld'): o['bld'] = str(s['bld'])
            if s.get('conf'): o['conf'] = str(s['conf'])[:10]
            if kind == 'led' and lit == 'off': w('an LED screen that is off')
            if not o.get('text') and lit != 'led' and kind != 'led': w('no text')
            ids[sid] = len(specs); specs.append(o)
            if '/scout/' in f: scout_ids.add(sid)
    specs = [o for o in specs if o is not None]
    need = [o for o in specs if o.get('bld')]
    if need:
        B = load_bld()
        for o in need:
            b = B.get(o['bld'])
            if not b: warn.append('%s: building %s not in hkreal/out/buildings.pkl (roof from the footprint under the sign)' % (o['id'], o['bld'])); continue
            p = b['g'].representative_point(); o['bx'], o['by'], o['bh'] = round(p.x, 1), round(p.y, 1), round(float(b['h']), 1)
    js = 'const HKSPEC = ' + json.dumps(specs, ensure_ascii=False, separators=(',', ':')) + ';'
    print('files', len(files)); [print('  ', os.path.relpath(f, SC)) for f in files]
    print('specs', len(specs), {k: sum(1 for o in specs if o['kind'] == k) for k in sorted(KINDS)})
    print('warnings', len(warn)); [print('  ', x) for x in warn[:200]]
    if check: return
    src = open(MOD).read()
    a, b = src.index('/*@@HKSPEC*/'), src.index('/*@@END*/')
    src = src[:a] + '/*@@HKSPEC*/' + js + src[b:]
    open(MOD, 'w').write(src)
    print('wrote', MOD, len(js), 'bytes of data')

if __name__ == '__main__':
    main()
