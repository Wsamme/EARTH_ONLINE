# gba: the Greater Bay build (Dongguan + Shenzhen + Hong Kong). Called by gbareal/tools/patch17_gba.py (a copy of sgreal/patch17.py
# that knows CITY=gba) on the assembled source. Starts from the Hong Kong build's patches (hkreal/patch_hk.py, read only), then:
#   - coordinates written in the Hong Kong frame move by (HK_DX, HK_DY) = (+7000, -35000) m (gbareal/common.py)
#   - hksigns: its tile index and projection constants come from the map instead of the Hong Kong square
#   - the terrain sculpt tools rebuild the terrain chunks (gbareal.js SGT) instead of the one Hong Kong mesh
#   - camera far plane, sea plane, overview camera, names and titles for the 126 km square
import re, sys, importlib.util
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
_sp = importlib.util.spec_from_file_location('patch_hk_ro', SC + 'hkreal/patch_hk.py'); PH = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(PH)
DX, DY = 7000, -35000
import glob as _glob, os as _os
HKLM = sorted(_os.path.basename(f)[:-3] for f in _glob.glob(SC + 'gbareal/app/hklm/*.js') if not _os.path.basename(f).startswith('_'))
if _os.environ.get('GBA_HKLM') is not None: HKLM = [x for x in HKLM if x in set(_os.environ['GBA_HKLM'].split(','))]
# the Hong Kong landmark modules as frame-shimmed copies (gbareal/tools/mkhklm.py), after the shared modules, as in the Hong Kong build
MODS = [('gbareal/app/hk_reset.js' if m == 'hkreal/app/hk_reset.js' else m) for m in PH.MODS] + (['gbareal/app/hklm/_pre.js'] + ['gbareal/app/hklm/%s.js' % x for x in HKLM] if HKLM else [])
APP = ['lm20/audio/audio.js', 'gbareal/app/gbareal.js', 'gbareal/app/gbstats.js', 'gbareal/app/cityswitch.js']     # (the switch with the Greater Bay button: tools/mkswitch.py)
def apply(src):
    # the Nei Lak Shan angle station test (Hong Kong frame -21796, -7793) must be in this frame: patch it inside patch_hk's own text
    src = PH.apply(src)
    def R(a, b, count=1):
        nonlocal src
        n = src.count(a); assert n == count, (n, a[:150]); src = src.replace(a, b)
    R("if (Math.hypot(p[0] + 21796, p[1] + 7793) < 150) return;", "if (Math.hypot(p[0] + %d, p[1] + %d) < 150) return;" % (21796 - DX, 7793 + DY))
    # ---------- names, titles ----------
    R("function sgNames(on){ const [zh, en] = on ? ['香港', 'Hong Kong'] : ['澄湾岛', 'Chengwan Island'];", "function sgNames(on){ const [zh, en] = on ? ['大湾区', 'Greater Bay'] : ['澄湾岛', 'Chengwan Island'];")
    R("$('#sample').innerHTML = on ? '还原<small>Reset Hong Kong</small>' : '示例城市<small>Sample</small>';", "$('#sample').innerHTML = on ? '还原<small>Reset map</small>' : '示例城市<small>Sample</small>';")
    R('aria-label="香港城市三维视图 Hong Kong 3D view"', 'aria-label="大湾区城市三维视图 Greater Bay 3D view"')
    R('<span class="sub">City Brush · 香港 Hong Kong 1:1 · 真实地图 Real map · © OpenStreetMap</span>', '<span class="sub">City Brush · 大湾区 Greater Bay 1:1 · 东莞 深圳 香港 · 真实地图 Real map · © OpenStreetMap</span>')
    src = re.sub(r'<title>[^<]*</title>', '<title>City Brush · Greater Bay</title>', src, count=1)
    # ---------- the overview camera: the whole 126 km square ----------
    R("else if (SGR.on){ const c = sgXY(22.340, 114.120); tt.set(c[0], 0, -c[1]); to = new THREE.Vector3(c[0] + 3500, 31000, -c[1] + 34000); }",
      "else if (SGR.on){ const c = sgXY(22.640, 114.050); tt.set(c[0], 0, -c[1]); to = new THREE.Vector3(c[0] + 6000, 72000, -c[1] + 76000); }")
    # ---------- camera far plane and the sea plane for the 126 km square ----------
    R("const camera = new THREE.PerspectiveCamera(38, (stage.clientWidth || innerWidth)/(stage.clientHeight || innerHeight), 5, 130000);",
      "const camera = new THREE.PerspectiveCamera(38, (stage.clientWidth || innerWidth)/(stage.clientHeight || innerHeight), 5, 260000);")
    R("const sea = new THREE.Mesh(new THREE.PlaneGeometry(200000, 200000),", "const sea = new THREE.Mesh(new THREE.PlaneGeometry(420000, 420000),")
    # ---------- terrain sculpting: the chunks ----------
    R("""  const pos = terrain.geometry.attributes.position;
  for (let tj = Math.max(0, Math.floor((bb[1]+HALF)/TS)); tj <= Math.min(TN-1, Math.ceil((bb[3]+HALF)/TS)); tj++)
    for (let ti = Math.max(0, Math.floor((bb[0]+HALF)/TS)); ti <= Math.min(TN-1, Math.ceil((bb[2]+HALF)/TS)); ti++){ const k = tj*TN + ti; pos.array[k*3+1] = H[k]; }
  pos.needsUpdate = true; terrain.geometry.computeVertexNormals();""", "  sgtRefreshChunks(bb);")
    # ---------- hksigns: the map's tile grid and projection (it was written for the 56 km Hong Kong square) ----------
    R("    const LAT0 = 22.34, LON0 = 114.12;", "    const LAT0 = SG.lat0, LON0 = SG.lon0;")
    R("    const T = 2000, TX = 28, H0 = 28000, per = new Map();", "    const T = SGR.base.TILE, TX = Math.round(2*HALF/T), H0 = HALF, per = new Map();")
    R("    const tileOf = (x, y) => { const tx = Math.floor((x + 28000)/2000), ty = Math.floor((y + 28000)/2000); return tx < 0 || ty < 0 || tx >= 28 || ty >= 28 ? -1 : ty*28 + tx; };",
      "    const _T = SGR.base.TILE, _TX = Math.round(2*HALF/_T), tileOf = (x, y) => { const tx = Math.floor((x + HALF)/_T), ty = Math.floor((y + HALF)/_T); return tx < 0 || ty < 0 || tx >= _TX || ty >= _TX ? -1 : ty*_TX + tx; };")
    # hksigns' alley / lane paths are Hong Kong frame metres
    i = src.index('  const HK_PATHS = ['); assert src.count('  const HK_PATHS = [') == 1; j = src.index('\n', i); line = src[i:j]; assert line.endswith('];'), line[-40:]
    src = src[:i] + '  const HK_PATHS = (L => L.map(([n, P]) => [n, P.map((v, k) => v + (k & 1 ? %d : %d))]))(' % (DY, DX) + line[len('  const HK_PATHS = '):-1] + ');' + src[j:]
    # ---------- the administrative stars (lm24/admin): no data here (as Hong Kong): not the Singapore ones ----------
    R("if (typeof SGR_PATH === 'string' && SGR_PATH.startsWith('hk')) return 'hk';", "if (typeof SGR_PATH === 'string' && (SGR_PATH.startsWith('hk') || SGR_PATH.startsWith('gba'))) return 'hk';")
    # ---------- lm20/traffic: drop its road network (it holds the lines array and the roads module's caches) when gbareal swaps the
    # road chunks (sgrSwapLines); it is rebuilt lazily on the next traffic step ----------
    R("    reset:() => { clearAll(); ZONE.on = false; return true; },",
      "    reset:() => { clearAll(); ZONE.on = false; return true; },\n    dropNet:() => { clearAll(); ZONE.on = false; Object.assign(NET, {lines:null, C:null, J:null, ok:false, skip:null, arms:null}); NET.GEO.clear(); NET.LINF.clear(); NET.NODES.clear(); NET.CXI.clear(); NET.DL.length = 0; return true; },")
    # ---------- the roads module: dispose(lines) also drops the deferred detail jobs and the junction-complex geometry cache (both hold
    # the old lines / caches; gbareal swaps the lines array when road chunks load) ----------
    R("  function dispose(lines){ CACHE.delete(lines); IDXC.clear(); JOBS.clear(); LASTI = null; }",
      "  function dispose(lines){ CACHE.delete(lines); IDXC.clear(); JOBS.clear(); LASTI = null; DET.clear(); FULLC.clear(); }")
    # ---------- the clock / sun: Hong Kong's zone ----------
    R("p.startsWith('hk') ? 'hk'", "(p.startsWith('hk') || p.startsWith('gba')) ? 'hk'")
    return src
