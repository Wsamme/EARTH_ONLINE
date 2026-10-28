# v39 integration: remove the v37 blocks that the v38 keys (hk/hkx_island, hk/hkx_nt) supersede. Backups <file>.v39.bak.
# Line ranges are asserted by their first / last lines, so a changed file fails loudly.
import shutil, os, sys
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
DRY = '--dry' in sys.argv
def cut(rel, a_line, b_line, a_txt, b_txt, note):
    f = SC + rel; L = open(f).read().split('\n')
    a, b = a_line - 1, b_line - 1
    assert L[a].startswith(a_txt), (rel, a_line, L[a][:120])
    assert L[b].startswith(b_txt), (rel, b_line, L[b][:120])
    print('%s: cut lines %d-%d (%d lines): %s' % (rel, a_line, b_line, b_line - a_line + 1, note))
    return f, L[:a] + ['// (v39: ' + note + ')'] + L[b + 1:]
jobs = {}
def add(rel, *spans):
    jobs[rel] = spans
# central.js: the v37 Central Piers 3-6 (hkcentralpiers + _b/_c/_d) -> hk/hkx_island hkcentralpiers (one key, all four piers)
add('hk/central/central.js', (425, 428, "pierLM('hkcentralpiers',", "pierLM('hkcentralpiers_d',", 'Central Piers 3-6 moved to hk/hkx_island (hkcentralpiers), which supersedes the v37 pierLM keys'))
# peak.js: the v37 Peak Tram stops (hkpeaktram, _b.._d) -> hk/hkx_island (hkpeaktram + _kr/_mr/_mg/_my/_bk)
add('hk/peak/peak.js', (281, 305, '// ===== Peak Tram (山顶缆车): the funicular of 1888', '}', 'the Peak Tram keys hkpeaktram / _b.._d moved to hk/hkx_island (hkpeaktram + _kr/_mr/_mg/_my/_bk)'))
# wanchai.js: the v37 sites hkhappyvalley and hkvicpark -> hk/hkx_island
add('hk/wanchai/wanchai.js', (475, 579, '// =====', "    B.flush(g); if (labels.length) g.userData.labels = labels; return g; }};", 'the sites hkhappyvalley and hkvicpark moved to hk/hkx_island'))
# lantau.js: the v37 T1KEYS loop (hkt1..hkt1_f) -> hk/hkx_nt
add('hk/lantau/lantau.js', (146, 151, 'const T1KEYS = {', '}', 'HKIA Terminal 1 (hkt1, hkt1_b.._f) moved to hk/hkx_nt'))
# bridges.js: HL_KEYS (hkhzmblink*) and SZ_KEYS (hkszbaybridge*) -> hk/hkx_nt
add('hk/bridges/bridges.js', (556, 595, 'const SZ_KEYS = [', '}', 'the Shenzhen Bay Bridge keys hkszbaybridge* moved to hk/hkx_nt'),
    (514, 543, 'const HL_KEYS = [', '}', 'the HZMB Hong Kong Link Road keys hkhzmblink* moved to hk/hkx_nt'))
for rel, spans in jobs.items():
    f = SC + rel; L = open(f).read().split('\n')
    for (a_line, b_line, a_txt, b_txt, note) in sorted(spans, key=lambda s: -s[0]):   # bottom-up keeps line numbers valid
        a, b = a_line - 1, b_line - 1
        assert L[a].startswith(a_txt), (rel, a_line, L[a][:120])
        assert L[b].startswith(b_txt), (rel, b_line, L[b][:120])
        print('%s: cut lines %d-%d (%d lines): %s' % (rel, a_line, b_line, b_line - a_line + 1, note))
        L = L[:a] + ['// (v39: ' + note + ')'] + L[b + 1:]
    if DRY: continue
    if not os.path.exists(f + '.v39.bak'): shutil.copy2(f, f + '.v39.bak')
    open(f, 'w').write('\n'.join(L))
print('dry run' if DRY else 'written')
