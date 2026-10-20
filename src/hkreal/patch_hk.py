# v37: the Hong Kong build. Called by sgreal/patch17.py (CITY=hk) on the assembled source (mirrors nycreal/patch_nyc.py).
# Hong Kong keeps the Singapore engine's left-hand traffic, foreign-context handling (Shenzhen: muted land, main roads, the
# skyline as type-14 buildings) and the Singapore-style modules (signs, weather, sound) until city-specific ones exist.
import re
MODS = ['hkreal/app/hk_reset.js', 'sgreal/mod_roads/roads.js', 'sgreal/mod_bld/bld.js', 'lm20/signs/signs.js', 'lm20/f1d/f1d.js', 'lm20/light/light.js', 'lm20/wx/wx.js', 'lm20/core/core.js', 'lm20/traffic/traffic.js', 'lm24/admin/admin.js', 'lm24/fly/fly.js', 'lm27/phys/phys.js', 'lm25/kaiju/kaiju.js', 'lm25/cityrace/cityrace.js', 'lm25/net/net.js', 'lm27/fireworks/fireworks.js', 'lm28/army/army.js', 'lm30/nav/nav.js', 'lm31/i18n/i18n.js', 'lm31/lmcard/lmcard.js', 'lm33/info_hk/info_hk.js', 'lm32/detail/detail.js', 'lm32/clock/clock.js']
APP = ['lm20/audio/audio.js', 'hkreal/app/hkreal.js', 'hkreal/app/hkstats.js', 'sgreal/app/cityswitch.js']
def apply(src):
    def R(a, b, count=1):
        nonlocal src
        n = src.count(a); assert n == count, (n, a[:150]); src = src.replace(a, b)
    # ---------- names, titles ----------
    R("function sgNames(on){ const [zh, en] = on ? ['新加坡', 'Singapore'] : ['澄湾岛', 'Chengwan Island'];", "function sgNames(on){ const [zh, en] = on ? ['香港', 'Hong Kong'] : ['澄湾岛', 'Chengwan Island'];")
    R("$('#sample').innerHTML = on ? '还原<small>Reset Singapore</small>' : '示例城市<small>Sample</small>'; $('#toCap').innerHTML = on ? '滨海湾<small>Marina Bay</small>' : '去首府<small>Capital</small>';",
      "$('#sample').innerHTML = on ? '还原<small>Reset Hong Kong</small>' : '示例城市<small>Sample</small>'; $('#toCap').innerHTML = on ? '中环<small>Central</small>' : '去首府<small>Capital</small>';")
    R('aria-label="新加坡城市三维视图 Singapore 3D view"', 'aria-label="香港城市三维视图 Hong Kong 3D view"')
    R('<span class="sub">City Brush · 新加坡 Singapore 1:1 · 真实地图 Real map · © OpenStreetMap</span>', '<span class="sub">City Brush · 香港 Hong Kong 1:1 · 真实地图 Real map · © OpenStreetMap</span>')
    R('回到新加坡 · Back to Singapore', '回到香港 · Back to Hong Kong')
    R("showBusy('正在还原新加坡… Restoring Singapore')", "showBusy('正在还原香港… Restoring Hong Kong')")
    src = re.sub(r'<title>[^<]*</title>', '<title>City Brush · Hong Kong</title>', src, count=1)
    # ---------- the administrative stars (lm24/admin) have no Hong Kong data yet: no Singapore CDC stars here ----------
    R("const admCity = () => { try { if (typeof SGR_NYC !== 'undefined' && SGR_NYC) return 'nyc';", "const admCity = () => { try { if (typeof SGR_PATH === 'string' && SGR_PATH.startsWith('hk')) return 'hk'; if (typeof SGR_NYC !== 'undefined' && SGR_NYC) return 'nyc';")
    # ---------- the overview camera: the whole 56 km square (from the south, over the Lamma Channel) ----------
    R("else if (SGR.on){ const c = sgXY(1.345, 103.83); tt.set(c[0], 0, -c[1]); to = new THREE.Vector3(c[0] + 4000, 30000, -c[1] + 33000); }",
      "else if (SGR.on){ const c = sgXY(22.340, 114.120); tt.set(c[0], 0, -c[1]); to = new THREE.Vector3(c[0] + 3500, 31000, -c[1] + 34000); }")
    # ---------- generated blocks on repainted ground: Hong Kong's towers reach 484 m (ICC) ----------
    R("if (SG.on) h = Math.min(h, z === 1 ? 150 : 285);", "if (SG.on) h = Math.min(h, z === 1 ? 220 : 480);")
    # ---------- the Ngong Ping 360 ropeway (Tung Chung - Ngong Ping) replaces the Singapore Cable Car: its line from OSM (base.ropes),
    # spans between the stations (the turning points), the engine's generic towers in between ----------
    a = src.index('function sgCableCar(B){'); b = src.index('\n}\n', a) + 3
    src = src[:a] + """function sgCableCar(B){
  net.ropes = [];
  for (const rp of (SGR.base && SGR.base.ropes) || []){
    const P = rp.pts; if (!P || P.length < 2) continue;
    const top = P.map((p, i) => Math.max(0, hAt(p[0], p[1])) + (i === 0 || i === P.length - 1 ? 12 : 22));
    for (let i = 0; i < P.length - 1; i++) sgRope(B, P[i], P[i+1], top[i], top[i+1], 30);
    P.forEach((p, i) => { if (Math.hypot(p[0] + 21796, p[1] + 7793) < 150) return;      // the Nei Lak Shan angle station: the landmark model hknp360angle_b stands on its real footprint
      const g = Math.max(0, hAt(p[0], p[1])); B.bld.win = {u0:2, base:g, glow:1.2, zc:2, fh:4.5, ww:2.4}; addPrism(B.bld, orect(p, [1, 0], i === 0 || i === P.length - 1 ? 26 : 16, 16), g - 1, top[i] + 4, [0.9, 0.9, 0.88]); B.bld.win = null;
      addPrism(B.deck, orect(p, [1, 0], (i === 0 || i === P.length - 1 ? 26 : 16) + 2, 18), top[i] + 4, top[i] + 5, [0.36, 0.42, 0.48]);
      for (let j = cx2i(p[1] - 22); j <= cx2i(p[1] + 22); j++) for (let ii = cx2i(p[0] - 22); ii <= cx2i(p[0] + 22); ii++){ const k = j*N + ii; zones[k] = 0; if (!resv[k]) resv[k] = 4; } });
    const m = P[Math.floor(P.length/2)];
    net.extras.push({x:m[0], y:m[1], t:'rope', top:Math.max(0, hAt(m[0], m[1])) + 40, name:[rp.zh, rp.en]});
  }
}
""" + src[b:]
    m = re.search(r"\nfunction sgF1\(B\)\{\n", src); assert m
    src = src[:m.end()] + "  if (!SGD.f1 || SGD.f1.length < 10){ net.f1 = null; return; }\n" + src[m.end():]
    # ---------- the port: the Kwai Tsing Container Terminals (Kwai Chung CT1-8, Tsing Yi CT9) ----------
    R("const boxes = [[[1.262, 103.745], [1.293, 103.795]], [[1.253, 103.822], [1.276, 103.850]], [[1.293, 103.700], [1.312, 103.727]], [[1.205, 103.595], [1.285, 103.665]]];",
      "const boxes = [[[22.338, 114.112], [22.366, 114.136]], [[22.326, 114.094], [22.346, 114.112]]];")
    # the quay test looked up the old 20 m Singapore land-use grid (sgLU): use the real map's land-use raster (3 = industrial; the
    # container terminals are industrial in b3) at the same cell
    R("if (zones[k] === 3 || (sgLU(m[0] + dx, m[1] + dy) >> 2) === 3) ind++;", "if (zones[k] === 3 || (SG.lu && SG.lu[k] === 3)) ind++;")
    R("name:['巴西班让集装箱码头', 'Pasir Panjang Terminal']", "name:['葵青货柜码头', 'Kwai Tsing Container Terminals']")
    R("sub:'新加坡 ⇄ 大阪  SIN ⇄ KIX'", "sub:'香港 ⇄ 新加坡  HKG ⇄ SIN'")
    # ---------- the sun over Hong Kong (Hong Kong Time, UTC+8, no daylight saving) ----------
    R("sg:{lat:1.3521, lon:103.8198, tz:8, name:'Singapore'}", "sg:{lat:22.34, lon:114.12, tz:8, name:'Hong Kong'}")
    # ---------- F1 free drive (keep left, as in Singapore): start on Nathan Road, Tsim Sha Tsui ----------
    R("spawnFree(sgXY(1.2905, 103.8545)[0], sgXY(1.2905, 103.8545)[1], [1, 0])", "spawnFree(sgXY(22.2985, 114.1722)[0], sgXY(22.2985, 114.1722)[1], [0, 1])")
    # ---------- ~250 neighbourhoods: small ones are labelled only from nearer ----------
    R("labelItems.push({el, x:d.lx, y:d.ly, lift:40, maxD:SGR.on ? 42000 : 7500, minD:SGR.on ? 2600 : 0});",
      "labelItems.push({el, x:d.lx, y:d.ly, lift:40, maxD:SGR.on ? Math.min(42000, 7000 + Math.sqrt((d.area || 0)/1e6)*2600) : 7500, minD:SGR.on ? 2000 : 0});")
    # ---------- landmarks split into several keys: one label ----------
    R("for (const L of landmarks){ const def = LANDMARKS[L.type], el = document.createElement('div'); el.className = 'lbl n lm';",
      "for (const L of landmarks){ const def = LANDMARKS[L.type]; if (def.label === false) continue; const el = document.createElement('div'); el.className = 'lbl n lm';")
    # ---------- the trams run in the street (rails in the road, no ballast bed) ----------
    R("    } else quadSegD(B.flat, p0, p1, W + 3, 0.55, hex('#a39a8a'));", "    } else if (!R.street) quadSegD(B.flat, p0, p1, W + 3, 0.55, hex('#a39a8a'));")
    R("const a = off(p0, d0, sd), b = off(p1, d1, sd); if (!up) quadSegD(B.flat, a, b, lrt ? 1.6 : 2.4, 0.65, track);",
      "const a = off(p0, d0, sd), b = off(p1, d1, sd); if (!up && R.street){ for (const e of [-0.72, 0.72]) quadSegD(B.flat, off(p0, d0, sd + e), off(p1, d1, sd + e), 0.14, 0.34, [0.5, 0.49, 0.47]); } else if (!up) quadSegD(B.flat, a, b, lrt ? 1.6 : 2.4, 0.65, track);")
    # ---------- shop signs, neon and lanterns: Hong Kong's street-market and shopping districts on the shared district keys ----------
    # chinatown = Mong Kok (Sai Yeung Choi St / Ladies' Market), quays = Tsim Sha Tsui (Nathan Rd / Canton Rd), kgglam = Causeway Bay,
    # littleindia = Jordan / Yau Ma Tei (Temple St), jalanbesar = Sham Shui Po (Apliu St), geylang = Wan Chai (Lockhart Rd),
    # joochiat = Kowloon City, tiongbahru = Sheung Wan, emeraldhill = Lan Kwai Fong / SoHo, balestier = North Point (Chun Yeung St)
    a = src.index('  const DIST_LL = {'); b = src.index('  };', a) + 4
    src = src[:a] + """  const DIST_LL = {
    chinatown:   [[22.3215, 114.1680], [22.3215, 114.1730], [22.3160, 114.1730], [22.3160, 114.1680]],
    quays:       [[22.3010, 114.1690], [22.3010, 114.1740], [22.2950, 114.1740], [22.2950, 114.1690]],
    kgglam:      [[22.2825, 114.1810], [22.2825, 114.1880], [22.2775, 114.1880], [22.2775, 114.1810]],
    littleindia: [[22.3110, 114.1680], [22.3110, 114.1715], [22.3050, 114.1715], [22.3050, 114.1680]],
    jalanbesar:  [[22.3320, 114.1590], [22.3320, 114.1650], [22.3270, 114.1650], [22.3270, 114.1590]],
    geylang:     [[22.2800, 114.1700], [22.2800, 114.1790], [22.2765, 114.1790], [22.2765, 114.1700]],
    joochiat:    [[22.3320, 114.1880], [22.3320, 114.1930], [22.3280, 114.1930], [22.3280, 114.1880]],
    tiongbahru:  [[22.2885, 114.1480], [22.2885, 114.1540], [22.2850, 114.1540], [22.2850, 114.1480]],
    emeraldhill: [[22.2825, 114.1520], [22.2825, 114.1565], [22.2795, 114.1565], [22.2795, 114.1520]],
    balestier:   [[22.2930, 114.1975], [22.2930, 114.2020], [22.2900, 114.2020], [22.2900, 114.1975]]
  };""" + src[b:]
    # busy hubs: Central, Admiralty, Causeway Bay, Wan Chai, North Point, Quarry Bay, Tsim Sha Tsui, Mong Kok, Yau Ma Tei, Sham Shui Po,
    # Kowloon Tong, Kwun Tong, Diamond Hill, Sha Tin, Tsuen Wan, Tuen Mun, Yuen Long, Tseung Kwan O, Tung Chung, Tai Po, Sheung Shui
    a = src.index('  const HUBS_LL = ['); b = src.index('];', a) + 2
    src = src[:a] + """  const HUBS_LL = [[22.2820, 114.1580, 320], [22.2790, 114.1650, 240], [22.2800, 114.1840, 300], [22.2775, 114.1730, 240], [22.2910, 114.2000, 220],
    [22.2875, 114.2100, 220], [22.2975, 114.1720, 320], [22.3190, 114.1695, 320], [22.3090, 114.1700, 220], [22.3300, 114.1620, 240], [22.3370, 114.1760, 240],
    [22.3120, 114.2250, 260], [22.3400, 114.2010, 220], [22.3820, 114.1880, 280], [22.3720, 114.1180, 260], [22.3950, 113.9730, 240], [22.4450, 114.0350, 240],
    [22.3080, 114.2600, 240], [22.2890, 113.9420, 220], [22.4450, 114.1700, 200], [22.5010, 114.1280, 200]]""" + src[b:]
    return src
