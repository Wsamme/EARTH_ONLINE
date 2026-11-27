# render50 (28 Nov 2026): rendering quality and speed — a POSTS / EXTRA_POSTS file for sgreal/patch17.py (and gbareal/tools/patch17_gba.py).
# apply(src, city) inserts the render50 modules into the page's main script right before the render loop (after every module and
# after the other post blocks: HOOKS, sea, sun, renderer, SGR, the light module's water are in scope).
#   render50/water.js  the ocean (waves, Fresnel, planar mirror pass, GGX glint, coast foam; quality levels, phone fallback)
#   render50/perf.js   speed (see the file header)
#   render50/debug.js  window.__r50 test handle, only with ?r50dbg=1 (always inserted; inert without the flag)
# Switches: build time RENDER50=0 (nothing inserted), RENDER50_PARTS=water,perf (subset); run time ?r50=0 (all off), ?r50water=0,
# ?r50perf=0, ?r50q=0|1|2 (pin the mirror quality). Every module checks its own anchors at run time and stays off if one is missing.
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
PARTS = ['water', 'perf']

def apply(src, city):
    if os.environ.get('RENDER50', '1') == '0':
        return src
    want = [p for p in os.environ.get('RENDER50_PARTS', ','.join(PARTS)).split(',') if p in PARTS]
    a = '/* ================= loop ================= */'
    n = src.count(a)
    assert n == 1, ('post_render50: loop marker', n)
    js = ''
    for p in ['debug'] + want:      # debug.js: the ?r50dbg=1 test handle (inactive without the flag)
        f = os.path.join(_HERE, p + '.js')
        if os.path.exists(f):
            js += open(f).read() + '\n'
    if not js:
        return src
    js = '/* ================= render50 (render50/post_render50.py: %s) ================= */\n' % ', '.join(want) + js
    return src.replace(a, js.replace('</script', '<\\/script') + a)

if __name__ == '__main__':
    # Apply to an already built page (the Greater Bay page, whose build gbareal/tools/patch17_gba.py runs from a snapshot):
    #   python3 render50/post_render50.py site/gba.html [out.html]     (in place without out; refuses a page that already has it)
    import sys
    s = open(sys.argv[1]).read()
    if '/* ================= render50 (' in s:
        raise SystemExit('render50 is already in ' + sys.argv[1])
    out = apply(s, 'gba')
    open(sys.argv[2] if len(sys.argv) > 2 else sys.argv[1], 'w').write(out)
    print('render50 ->', sys.argv[2] if len(sys.argv) > 2 else sys.argv[1], len(out))
