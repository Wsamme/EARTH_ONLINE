# v37: the Tokyo build. Called by sgreal/patch17.py (CITY=tyo) on the assembled source (mirrors nycreal/patch_nyc.py).
# Tokyo keeps the Singapore conventions where they fit: left-hand traffic, metric units, the 24 h clock. The city-aware modules
# (wx, audio, traffic, f1d, fly, nav, cityrace, army, kaiju, admin) do not know Tokyo yet and run their default (Singapore) behaviour;
# lm32/clock and sgreal/app/cityswitch.js know it from SGR_PATH = 'tyodata/'.
import re
MODS = ['tyoreal/app/tyo_reset.js', 'sgreal/mod_roads/roads.js', 'sgreal/mod_bld/bld.js', 'lm20/signs/signs.js', 'lm20/f1d/f1d.js', 'lm20/light/light.js', 'lm20/wx/wx.js', 'lm20/core/core.js',
        'lm20/traffic/traffic.js', 'lm24/admin/admin.js', 'lm24/fly/fly.js', 'lm27/phys/phys.js', 'lm25/kaiju/kaiju.js', 'lm25/cityrace/cityrace.js', 'lm25/net/net.js', 'lm27/fireworks/fireworks.js',
        'lm28/army/army.js', 'lm30/nav/nav.js', 'lm31/i18n/i18n.js', 'lm31/lmcard/lmcard.js', 'lm33/info_tyo/info_tyo.js', 'lm32/detail/detail.js', 'lm32/clock/clock.js', 'lm33/fuji/fuji.js']
APP = ['lm20/audio/audio.js', 'tyoreal/app/tyo_post.js', 'tyoreal/app/tyoreal.js', 'tyoreal/app/tyostats.js', 'sgreal/app/cityswitch.js']
def apply(src):
    def R(a, b, count=1):
        nonlocal src
        n = src.count(a); assert n == count, (n, a[:150]); src = src.replace(a, b)
    # ---------- names, titles ----------
    R("function sgNames(on){ const [zh, en] = on ? ['新加坡', 'Singapore'] : ['澄湾岛', 'Chengwan Island'];", "function sgNames(on){ const [zh, en] = on ? ['东京', 'Tokyo'] : ['澄湾岛', 'Chengwan Island'];")
    R("$('#sample').innerHTML = on ? '还原<small>Reset Singapore</small>' : '示例城市<small>Sample</small>'; $('#toCap').innerHTML = on ? '滨海湾<small>Marina Bay</small>' : '去首府<small>Capital</small>';",
      "$('#sample').innerHTML = on ? '还原<small>Reset Tokyo</small>' : '示例城市<small>Sample</small>'; $('#toCap').innerHTML = on ? '东京站<small>Tokyo Station</small>' : '去首府<small>Capital</small>';")
    R('aria-label="新加坡城市三维视图 Singapore 3D view"', 'aria-label="东京城市三维视图 Tokyo 3D view"')
    R('<span class="sub">City Brush · 新加坡 Singapore 1:1 · 真实地图 Real map · © OpenStreetMap</span>', '<span class="sub">City Brush · 东京 Tokyo 1:1 · 真实地图 Real map · © OpenStreetMap</span>')
    R('回到新加坡 · Back to Singapore', '回到东京 · Back to Tokyo')
    R("showBusy('正在还原新加坡… Restoring Singapore')", "showBusy('正在还原东京… Restoring Tokyo')")
    src = re.sub(r'<title>[^<]*</title>', '<title>City Brush · Tokyo</title>', src, count=1)
    # ---------- the overview camera: the whole 56 km square ----------
    R("else if (SGR.on){ const c = sgXY(1.345, 103.83); tt.set(c[0], 0, -c[1]); to = new THREE.Vector3(c[0] + 4000, 30000, -c[1] + 33000); }",
      "else if (SGR.on){ const c = sgXY(35.660, 139.750); tt.set(c[0], 0, -c[1]); to = new THREE.Vector3(c[0] + 3500, 31000, -c[1] + 34000); }")
    # ---------- generated blocks on repainted ground: Tokyo's tallest building is 325 m (Azabudai Hills Mori JP Tower) ----------
    R("if (SG.on) h = Math.min(h, z === 1 ? 150 : 285);", "if (SG.on) h = Math.min(h, z === 1 ? 180 : 320);")
    # ---------- Singapore-only network pieces (the Sentosa cable car; the Marina Bay street circuit) ----------
    R("function sgCableCar(B){\n  net.ropes = [];", "function sgCableCar(B){\n  net.ropes = []; return;")
    m = re.search(r"\nfunction sgF1\(B\)\{\n", src); assert m
    src = src[:m.end()] + "  if (!SGD.f1 || SGD.f1.length < 10){ net.f1 = null; return; }\n" + src[m.end():]
    # the port: Ōi and Aomi (Tokyo), Honmoku and Daikoku (Yokohama), Kawasaki's Higashi-Ōgishima
    R("const boxes = [[[1.262, 103.745], [1.293, 103.795]], [[1.253, 103.822], [1.276, 103.850]], [[1.293, 103.700], [1.312, 103.727]], [[1.205, 103.595], [1.285, 103.665]]];",
      "const boxes = [[[35.590, 139.770], [35.618, 139.800]], [[35.608, 139.770], [35.624, 139.790]], [[35.420, 139.655], [35.445, 139.690]], [[35.455, 139.672], [35.470, 139.700]], [[35.485, 139.735], [35.505, 139.765]]];")
    R("name:['巴西班让集装箱码头', 'Pasir Panjang Terminal']", "name:['大井集装箱码头', 'Ōi Container Terminal']")
    R("sub:'新加坡 ⇄ 大阪  SIN ⇄ KIX'", "sub:'东京 ⇄ 新加坡  HND ⇄ SIN'")
    # ---------- the sun over Tokyo: Japan Standard Time (UTC+9, no daylight saving) ----------
    R("sg:{lat:1.3521, lon:103.8198, tz:8, name:'Singapore'}", "sg:{lat:35.66, lon:139.75, tz:9, name:'Tokyo'}")
    # ---------- F1 free drive: keep left (as Singapore), start at Tokyo Station (Marunouchi side) ----------
    R("spawnFree(sgXY(1.2905, 103.8545)[0], sgXY(1.2905, 103.8545)[1], [1, 0])", "spawnFree(sgXY(35.6815, 139.7645)[0], sgXY(35.6815, 139.7645)[1], [1, 0])")
    # ---------- ~250 districts: small ones are labelled only from nearer ----------
    R("labelItems.push({el, x:d.lx, y:d.ly, lift:40, maxD:SGR.on ? 42000 : 7500, minD:SGR.on ? 2600 : 0});",
      "labelItems.push({el, x:d.lx, y:d.ly, lift:40, maxD:SGR.on ? Math.min(42000, 7000 + Math.sqrt((d.area || 0)/1e6)*2600) : 7500, minD:SGR.on ? 2000 : 0});")
    # ---------- landmarks split into several keys: one label ----------
    R("for (const L of landmarks){ const def = LANDMARKS[L.type], el = document.createElement('div'); el.className = 'lbl n lm';",
      "for (const L of landmarks){ const def = LANDMARKS[L.type]; if (def.label === false) continue; const el = document.createElement('div'); el.className = 'lbl n lm';")
    # ---------- rail: the trams (Toden Arakawa, Tokyu Setagaya) run in the street where they share it (rails in the road, no ballast) ----------
    R("    } else quadSegD(B.flat, p0, p1, W + 3, 0.55, hex('#a39a8a'));", "    } else if (!R.street) quadSegD(B.flat, p0, p1, W + 3, 0.55, hex('#a39a8a'));")
    R("const a = off(p0, d0, sd), b = off(p1, d1, sd); if (!up) quadSegD(B.flat, a, b, lrt ? 1.6 : 2.4, 0.65, track);",
      "const a = off(p0, d0, sd), b = off(p1, d1, sd); if (!up && R.street){ for (const e of [-0.72, 0.72]) quadSegD(B.flat, off(p0, d0, sd + e), off(p1, d1, sd + e), 0.14, 0.34, [0.5, 0.49, 0.47]); } else if (!up) quadSegD(B.flat, a, b, lrt ? 1.6 : 2.4, 0.65, track);")
    # ---------- shop signs, neon and lanterns: Tokyo's districts on the shared district keys ----------
    # chinatown = Yokohama Chinatown, quays = Shinjuku Kabukichō, kgglam = Asakusa (Nakamise), littleindia = Nishi-Kasai, jalanbesar = Akihabara,
    # geylang = Ueno Ameyoko, joochiat = Shin-Ōkubo (Koreatown), tiongbahru = Shimokitazawa, emeraldhill = Harajuku (Takeshita Street), balestier = Shibuya Center-gai
    a = src.index('  const DIST_LL = {'); b = src.index('  };', a) + 4
    src = src[:a] + """  const DIST_LL = {
    chinatown:   [[35.4450, 139.6420], [35.4450, 139.6480], [35.4410, 139.6480], [35.4410, 139.6420]],
    quays:       [[35.6970, 139.6990], [35.6970, 139.7050], [35.6925, 139.7050], [35.6925, 139.6990]],
    kgglam:      [[35.7135, 139.7945], [35.7135, 139.7975], [35.7105, 139.7975], [35.7105, 139.7945]],
    littleindia: [[35.6680, 139.8540], [35.6680, 139.8620], [35.6630, 139.8620], [35.6630, 139.8540]],
    jalanbesar:  [[35.7020, 139.7690], [35.7020, 139.7740], [35.6970, 139.7740], [35.6970, 139.7690]],
    geylang:     [[35.7110, 139.7735], [35.7110, 139.7765], [35.7070, 139.7765], [35.7070, 139.7735]],
    joochiat:    [[35.7025, 139.6990], [35.7025, 139.7030], [35.6995, 139.7030], [35.6995, 139.6990]],
    tiongbahru:  [[35.6635, 139.6650], [35.6635, 139.6710], [35.6595, 139.6710], [35.6595, 139.6650]],
    emeraldhill: [[35.6725, 139.7020], [35.6725, 139.7065], [35.6690, 139.7065], [35.6690, 139.7020]],
    balestier:   [[35.6620, 139.6965], [35.6620, 139.7005], [35.6590, 139.7005], [35.6590, 139.6965]]
  };""" + src[b:]
    # busy hubs: Shinjuku, Shibuya, Ikebukuro, Tokyo, Shinagawa, Ueno, Akihabara, Ginza, Yokohama, Kawasaki, Ōmiya, Kita-Senju, Kichijōji,
    # Shin-Yokohama, Funabashi, Kashiwa, Machida, Tachikawa-free: Futako-Tamagawa, Nakano, Kinshichō
    a = src.index('  const HUBS_LL = ['); b = src.index('];', a) + 2
    src = src[:a] + """  const HUBS_LL = [[35.6905, 139.7005, 340], [35.6585, 139.7015, 300], [35.7295, 139.7110, 300], [35.6812, 139.7671, 300], [35.6285, 139.7390, 260],
    [35.7135, 139.7775, 260], [35.6985, 139.7730, 220], [35.6715, 139.7650, 260], [35.4660, 139.6225, 300], [35.5310, 139.6975, 260], [35.9060, 139.6240, 260],
    [35.7490, 139.8045, 220], [35.7030, 139.5795, 220], [35.5070, 139.6175, 200], [35.7015, 139.9855, 220], [35.8620, 139.9710, 200], [35.5425, 139.4460, 200],
    [35.6115, 139.6265, 200], [35.7060, 139.6655, 200], [35.6965, 139.8140, 200]]""" + src[b:]
    # ---------- modules that place Singapore data in map metres (lm24/admin: the seats of government) see an unknown city here, so they
    # show nothing instead of Singapore's stars in the middle of Tokyo ----------
    R("const admCity = () => { try { if (typeof SGR_NYC !== 'undefined' && SGR_NYC) return 'nyc';", "const admCity = () => { try { if (typeof SGR_PATH === 'string' && SGR_PATH.startsWith('tyo')) return 'tyo'; if (typeof SGR_NYC !== 'undefined' && SGR_NYC) return 'nyc';")
    return src
