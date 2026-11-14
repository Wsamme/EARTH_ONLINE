# gbareal/app/cityswitch.js = sgreal/app/cityswitch.js (read only) + a sixth map, 大湾区 Greater Bay ('gba', pages with citybrush-map
# content "gba" / SGR_PATH gbadata/), the six buttons in a 3 + 3 grid. apply(src) is the same edit for the shared file (for the
# integrator: running it on sgreal/app/cityswitch.js gives every city's page the Greater Bay button; cities without a 'gba' link /
# neighbour page show the usual "not published next to this page" toast).
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
def apply(s, link=''):
    def R(a, b):
        nonlocal s
        assert s.count(a) == 1, a[:80]; s = s.replace(a, b)
    R("    {id:'tyo', zh:'东京',       en:'Tokyo',       busy:'正在切换到东京… Switching to Tokyo'}];",
      "    {id:'tyo', zh:'东京',       en:'Tokyo',       busy:'正在切换到东京… Switching to Tokyo'},\n    {id:'gba', zh:'大湾区',     en:'Greater Bay', busy:'正在切换到大湾区… Switching to the Greater Bay (Dongguan · Shenzhen · Hong Kong)'}];")
    R("tyo:'https://claude.ai/artifact/PoNpCj8MxrjFFFUxddfzMn'};", "tyo:'https://claude.ai/artifact/PoNpCj8MxrjFFFUxddfzMn', gba:'%s'};" % link)
    R("/^(hk|tyo)data\\//.test(SGR_PATH)", "/^(hk|tyo|gba)data\\//.test(SGR_PATH)")
    R("seg.classList.add('city3', 'city5');", "seg.classList.add('city3', 'city6');")
    R("'.cityseg.city5 button:not(:nth-child(1)):not(:nth-child(4)){border-left:1px solid var(--rule)}.cityseg.city5 button.ext small::after{content:\" ↗\"}';",
      "'.cityseg.city5 button:not(:nth-child(1)):not(:nth-child(4)){border-left:1px solid var(--rule)}.cityseg.city5 button.ext small::after{content:\" ↗\"}' +\n"
      "    '.cityseg.city6{grid-auto-flow:row !important;grid-template-columns:repeat(3,1fr) !important}.cityseg.city6 button:nth-child(n+4){border-top:1px solid var(--rule)}' +\n"
      "    '.cityseg.city6 button:not(:nth-child(3n+1)){border-left:1px solid var(--rule)}.cityseg.city6 button.ext small::after{content:\" ↗\"}';")
    return s
if __name__ == '__main__':
    s = open(SC + 'sgreal/app/cityswitch.js').read()
    open(SC + 'gbareal/app/cityswitch.js', 'w').write('// GENERATED from sgreal/app/cityswitch.js by gbareal/tools/mkswitch.py - do not edit\n' + apply(s)); print('ok')
