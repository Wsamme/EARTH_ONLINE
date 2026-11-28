# road50: the tunnel (R6) before / after tables for every city from out/<city>_{before_r,after_r,tun}.json and out/simt_<city>_*.json
import json, os, sys
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
S = lambda c, t: json.load(open(os.path.join(D, f'{c}_{t}.json')))['summary']
REGK = {'hk':['island>kowloon', 'kowloon>island'], 'gba':['island>kowloon', 'kowloon>island'], 'sg':['cbd>north', 'west>east'],
        'tyo':['chiyoda>haneda', 'haneda>chiyoda', 'haneda>shinjuku'], 'nyc':['manhattan>jersey', 'jersey>manhattan', 'manhattan>queens'], 'bay':['sf>oakland', 'oakland>sf', 'orinda>sf']}
cities = sys.argv[1:] or ['sg', 'hk', 'nyc', 'tyo', 'bay', 'gba']
rows = [('routes OK % (2000 pairs)', lambda s: s['routes']['okPct']), ('  failed: not connected', lambda s: s['routes']['failIsland']), ('  failed: one-way', lambda s: s['routes']['failOneway']),
        ('routes with detour > 3x', lambda s: s['routes']['detour3']), ('route detour median', lambda s: s['routes']['detourMed']), ('main component %', lambda s: s['mainWeakPct']),
        ('km outside main', lambda s: s['otherKm']), ('main SCC % (traffic)', lambda s: s['mainSccPctApp']), ('tunnel lines / km', lambda s: '%d / %s' % (s['tunnelLines']['lines'], s['tunnelLines']['km']))]
for c in cities:
    try: F = [S(c, 'before_r'), S(c, 'after_r'), S(c, 'tun')]
    except FileNotFoundError as e: print(c, 'missing', e); continue
    print(f'\n**{c}**\n\n| | live | repaired v1 | + tunnels |\n|---|---|---|---|')
    for nm, f in rows: print(f'| {nm} | ' + ' | '.join(str(f(x)) for x in F) + ' |')
    for k in REGK[c]:
        vals = []
        for x in F:
            r = x['regions'].get(k); vals.append(f"{r['okPct']} % ({r['meanKm']} km)" if r else '-')
        print(f'| routes {k} (100 pairs; mean length) | ' + ' | '.join(vals) + ' |')
print('\n| city | view | data | vehicles | in tunnels (vehicles / came out) | teleports | off surface | waiting >100 s | mesh build |\n|---|---|---|---|---|---|---|---|---|')
for c in cities:
    for t in ['live', 'after', 'tun']:
        p = os.path.join(D, f'simt_{c}_{t}.json')
        if not os.path.exists(p): continue
        for v in json.load(open(p))['views']:
            if 'err' in v: print(f"| {c} | {v['name']} | {t} | ERR {v['err'][:100]} |"); continue
            b = v.get('build')
            print(f"| {c} | {v['name']} | {t} | {v['stats']['vehicles']} | {v.get('tunnelVehicles', 0)} / {v.get('outOfTunnel', 0)} | {v['jumps']} | {v['offSurface']} ({v['offPct']}%) | {v['stuck100']} | {('%d tris' % b['tris']) if b else 'ERR ' + v.get('buildErr', '')[:60]} |")
