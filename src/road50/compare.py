# road50/compare.py — before / after table from out/<city>_{before,after}.json and the repair logs
import json, sys, os
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
rows = [('weak components', lambda s: s['weakComponents']), ('main component %', lambda s: s['mainWeakPct']), ('other comps >= 1 km', lambda s: s['otherComponentsOver1km']),
  ('km outside main', lambda s: s['otherKm']), ('main SCC % (traffic)', lambda s: s['mainSccPctApp']), ('main SCC % (turn round)', lambda s: s['mainSccPct']),
  ('dead ends: gaps <= 12 m', lambda s: s['deadEnds']['gap3'] + s['deadEnds']['gap6'] + s['deadEnds']['gap12']), ('  of which <= 6 m', lambda s: s['deadEnds']['gap3'] + s['deadEnds']['gap6']),
  ('dead ends: level gaps', lambda s: s['deadEnds']['levelgap']), ('dead ends: decks in mid-air', lambda s: s['deadEnds']['deckend'] + s['deadEnds'].get('shortdeck', 0)),
  ('dead ends: one-way', lambda s: s['deadEnds']['oneway']), ('dead ends: tunnel mouths', lambda s: s['deadEnds']['tunnel']), ('dead ends: map edge / chunk', lambda s: s['deadEnds']['edge'] + s['deadEnds']['chunk']),
  ('level steps at junction vertices', lambda s: s['levels']['step1_3'] + s['levels']['step3_15'] + s['levels']['step15']), ('  steps > 15 m', lambda s: s['levels']['step15']),
  ('steep jumps (>12 %, >1 m)', lambda s: s['levels']['steep']), ('false junctions (bridge at grade)', lambda s: s['crossings']['falsejunc']),
  ('low clearance crossings', lambda s: s['crossings']['lowclear']), ('missed junctions', lambda s: s['crossings']['missedjunc']),
  ('roads at grade in water (> 60 m)', lambda s: s['levels']['inwater']), ('one-way sinks / sources', lambda s: '%d / %d' % (s['onewaySinks'], s['onewaySources'])),
  ('closed one-way sets', lambda s: s['closedOnewaySets']), ('vertical jumps between links > 1.5 m', lambda s: s['movements']['zjump1_5']),
  ('routes OK % (2000 pairs)', lambda s: s['routes']['okPct']), ('  failed: not connected', lambda s: s['routes']['failIsland']), ('  failed: one-way', lambda s: s['routes']['failOneway']),
  ('route detour median', lambda s: s['routes']['detourMed'])]
cities = sys.argv[1:] or ['sg', 'hk', 'nyc', 'tyo', 'bay', 'gba']
S = {}
for c in cities:
    for t in ('before', 'after'):
        p = os.path.join(D, f'{c}_{t}.json')
        if os.path.exists(p): S[c, t] = json.load(open(p))['summary']
print('| | ' + ' | '.join(f'{c} before | {c} after' for c in cities) + ' |')
print('|---|' + '---|'*(2*len(cities)))
for name, f in rows:
    out = []
    for c in cities:
        for t in ('before', 'after'):
            try: out.append(str(f(S[c, t])))
            except Exception: out.append('-')
    print(f'| {name} | ' + ' | '.join(out) + ' |')
for c in cities:
    p = os.path.join(D, f'{c}_repair.json')
    if os.path.exists(p): r = json.load(open(p))['summary']; print(c, 'repair: changed lines', r['changedLines'], 'changes', r['changes'])
