# v25: the New York City build. Called by sgreal/patch17.py (CITY=nyc) on the assembled source (mirrors bayreal/patch_bay.py).
# The Bay-only modules (bay/fog/wx.js, the Bay ambience in lm20/audio, the Silicon Valley drive places in lm20/f1d,
# sgreal/app/cityswitch.js) are not New York aware yet: they stay off / inert here (SGR_BAY is not defined in this build).
import re
NYC_MODS = ['nycreal/app/nyc_reset.js', 'sgreal/mod_roads/roads.js', 'sgreal/mod_bld/bld.js', 'lm20/signs/signs.js', 'lm20/f1d/f1d.js', 'lm20/light/light.js', 'lm20/wx/wx.js', 'lm20/core/core.js', 'nyc/nycapp/busdata_nyc.js', 'lm20/traffic/traffic.js', 'lm24/admin/admin.js', 'lm24/fly/fly.js', 'lm27/phys/phys.js', 'lm25/kaiju/kaiju.js', 'lm25/cityrace/cityrace.js', 'lm25/net/net.js', 'lm27/fireworks/fireworks.js', 'lm28/army/army.js', 'lm30/nav/nav.js', 'lm31/i18n/i18n.js', 'lm31/lmcard/lmcard.js', 'lm31/info_nyc1/info_nyc1.js', 'lm31/info_nyc2/info_nyc2.js', 'lm32/detail/detail.js', 'lm32/clock/clock.js']
NYC_APP = ['lm20/audio/audio.js', 'nycreal/app/nyc_post.js', 'nycreal/app/nycreal.js', 'nycreal/app/nycstats.js', 'sgreal/app/cityswitch.js']
def apply(src):
    def R(a, b, count=1):
        nonlocal src
        n = src.count(a); assert n == count, (n, a[:150]); src = src.replace(a, b)
    # ---------- names, titles ----------
    R("function sgNames(on){ const [zh, en] = on ? ['新加坡', 'Singapore'] : ['澄湾岛', 'Chengwan Island'];", "function sgNames(on){ const [zh, en] = on ? ['纽约', 'New York City'] : ['澄湾岛', 'Chengwan Island'];")
    R("$('#sample').innerHTML = on ? '还原<small>Reset Singapore</small>' : '示例城市<small>Sample</small>'; $('#toCap').innerHTML = on ? '滨海湾<small>Marina Bay</small>' : '去首府<small>Capital</small>';",
      "$('#sample').innerHTML = on ? '还原<small>Reset New York</small>' : '示例城市<small>Sample</small>'; $('#toCap').innerHTML = on ? '曼哈顿中城<small>Midtown</small>' : '去首府<small>Capital</small>';")
    R('aria-label="新加坡城市三维视图 Singapore 3D view"', 'aria-label="纽约城市三维视图 New York City 3D view"')
    R('<span class="sub">City Brush · 新加坡 Singapore 1:1 · 真实地图 Real map · © OpenStreetMap</span>', '<span class="sub">City Brush · 纽约 New York City 1:1 · 真实地图 Real map · © OpenStreetMap</span>')
    R('回到新加坡 · Back to Singapore', '回到纽约 · Back to New York')
    R("showBusy('正在还原新加坡… Restoring Singapore')", "showBusy('正在还原纽约… Restoring New York')")
    src = re.sub(r'<title>[^<]*</title>', '<title>City Brush · New York City</title>', src, count=1)
    # ---------- the overview camera: the whole 56 km square ----------
    R("else if (SGR.on){ const c = sgXY(1.345, 103.83); tt.set(c[0], 0, -c[1]); to = new THREE.Vector3(c[0] + 4000, 30000, -c[1] + 33000); }",
      "else if (SGR.on){ const c = sgXY(40.700, -73.980); tt.set(c[0], 0, -c[1]); to = new THREE.Vector3(c[0] + 3500, 31000, -c[1] + 34000); }")
    # ---------- generated blocks on repainted ground: New York's towers reach 541 m ----------
    R("if (SG.on) h = Math.min(h, z === 1 ? 150 : 285);", "if (SG.on) h = Math.min(h, z === 1 ? 300 : 540);")
    # ---------- right-hand traffic ----------
    R("*(G.nz ? -1 : 1), x = ax + dx*st.s", "*1, x = ax + dx*st.s")
    # ---------- Singapore-only network pieces ----------
    R("function sgCableCar(B){\n  net.ropes = [];", "function sgCableCar(B){\n  net.ropes = []; return;")
    m = re.search(r"\nfunction sgF1\(B\)\{\n", src); assert m
    src = src[:m.end()] + "  if (!SGD.f1 || SGD.f1.length < 10){ net.f1 = null; return; }\n" + src[m.end():]
    # the port: Port Newark-Elizabeth, Red Hook (Brooklyn), Howland Hook (Staten Island)
    R("const boxes = [[[1.262, 103.745], [1.293, 103.795]], [[1.253, 103.822], [1.276, 103.850]], [[1.293, 103.700], [1.312, 103.727]], [[1.205, 103.595], [1.285, 103.665]]];",
      "const boxes = [[[40.655, -74.175], [40.700, -74.135]], [[40.676, -74.020], [40.690, -74.003]], [[40.632, -74.195], [40.648, -74.172]]];")
    R("name:['巴西班让集装箱码头', 'Pasir Panjang Terminal']", "name:['纽瓦克-伊丽莎白港', 'Port Newark–Elizabeth']")
    R("sub:'新加坡 ⇄ 大阪  SIN ⇄ KIX'", "sub:'纽约 ⇄ 东京  JFK ⇄ HND'")
    # ---------- the sun over New York (Eastern Time with daylight saving: 2nd Sunday of March - 1st Sunday of November) ----------
    R("sg:{lat:1.3521, lon:103.8198, tz:8, name:'Singapore'}",
      "sg:{lat:40.70, lon:-73.98, get tz(){ const y = LG.ymd[0], v = LG.ymd[1]*100 + LG.ymd[2], dw = (m, d) => new Date(Date.UTC(y, m - 1, d)).getUTCDay(), s = 8 + (7 - dw(3, 8)) % 7, e = 1 + (7 - dw(11, 1)) % 7; return v >= 300 + s && v < 1100 + e ? -4 : -5; }, name:'New York City'}")
    # ---------- F1 free drive: keep right, start in Midtown (42nd Street); the street circuit is nyc/nyrace (Brooklyn, Red Hook) ----------
    R("sx = best.px - uy*off, sy = best.py + ux*off;   // keep left", "sx = best.px + uy*off, sy = best.py - ux*off;   // keep right")
    R("x -= Math.sin(hx)*RD_WID[l.c][0]*0.25; y += Math.cos(hx)*RD_WID[l.c][0]*0.25; }   // keep left", "x += Math.sin(hx)*RD_WID[l.c][0]*0.25; y -= Math.cos(hx)*RD_WID[l.c][0]*0.25; }   // keep right")
    R("spawnFree(sgXY(1.2905, 103.8545)[0], sgXY(1.2905, 103.8545)[1], [1, 0])", "spawnFree(sgXY(40.7540, -73.9845)[0], sgXY(40.7540, -73.9845)[1], [1, 0])")
    # v30: the 赛道 Race card shows in New York (nyc/nyrace builds net.f1: the Brooklyn Street Circuit)
    # ---------- ~250 neighbourhoods and towns: small ones are labelled only from nearer ----------
    R("labelItems.push({el, x:d.lx, y:d.ly, lift:40, maxD:SGR.on ? 42000 : 7500, minD:SGR.on ? 2600 : 0});",
      "labelItems.push({el, x:d.lx, y:d.ly, lift:40, maxD:SGR.on ? Math.min(42000, 7000 + Math.sqrt((d.area || 0)/1e6)*2600) : 7500, minD:SGR.on ? 2000 : 0});")
    # ---------- landmarks split into several keys: one label ----------
    R("for (const L of landmarks){ const def = LANDMARKS[L.type], el = document.createElement('div'); el.className = 'lbl n lm';",
      "for (const L of landmarks){ const def = LANDMARKS[L.type]; if (def.label === false) continue; const el = document.createElement('div'); el.className = 'lbl n lm';")
    # ---------- rail: the Hudson-Bergen and Newark light rail run in the street (rails in the road, no ballast bed) ----------
    R("    } else quadSegD(B.flat, p0, p1, W + 3, 0.55, hex('#a39a8a'));", "    } else if (!R.street) quadSegD(B.flat, p0, p1, W + 3, 0.55, hex('#a39a8a'));")
    R("const a = off(p0, d0, sd), b = off(p1, d1, sd); if (!up) quadSegD(B.flat, a, b, lrt ? 1.6 : 2.4, 0.65, track);",
      "const a = off(p0, d0, sd), b = off(p1, d1, sd); if (!up && R.street){ for (const e of [-0.72, 0.72]) quadSegD(B.flat, off(p0, d0, sd + e), off(p1, d1, sd + e), 0.14, 0.34, [0.5, 0.49, 0.47]); } else if (!up) quadSegD(B.flat, a, b, lrt ? 1.6 : 2.4, 0.65, track);")
    # ---------- shop signs, neon and lanterns: New York's districts on the shared district keys ----------
    # chinatown = Manhattan Chinatown, quays = Times Square, kgglam = Little Italy (Mulberry St), littleindia = Jackson Heights,
    # jalanbesar = Sunset Park 8th Ave, geylang = Flushing Main St, joochiat = Koreatown (W 32nd St), tiongbahru = Greenwich Village
    # (Bleecker St), emeraldhill = East Village (St Marks Pl), balestier = Williamsburg (Bedford Ave)
    a = src.index('  const DIST_LL = {'); b = src.index('  };', a) + 4
    src = src[:a] + """  const DIST_LL = {
    chinatown:   [[40.7185, -74.0010], [40.7185, -73.9935], [40.7130, -73.9935], [40.7130, -74.0010]],
    quays:       [[40.7605, -73.9890], [40.7605, -73.9835], [40.7545, -73.9835], [40.7545, -73.9890]],
    kgglam:      [[40.7210, -73.9985], [40.7210, -73.9960], [40.7175, -73.9960], [40.7175, -73.9985]],
    littleindia: [[40.7505, -73.8950], [40.7505, -73.8880], [40.7465, -73.8880], [40.7465, -73.8950]],
    jalanbesar:  [[40.6430, -74.0130], [40.6430, -74.0040], [40.6330, -74.0040], [40.6330, -74.0130]],
    geylang:     [[40.7620, -73.8350], [40.7620, -73.8260], [40.7540, -73.8260], [40.7540, -73.8350]],
    joochiat:    [[40.7490, -73.9890], [40.7490, -73.9850], [40.7465, -73.9850], [40.7465, -73.9890]],
    tiongbahru:  [[40.7310, -74.0040], [40.7310, -73.9980], [40.7270, -73.9980], [40.7270, -74.0040]],
    emeraldhill: [[40.7300, -73.9900], [40.7300, -73.9840], [40.7260, -73.9840], [40.7260, -73.9900]],
    balestier:   [[40.7200, -73.9600], [40.7200, -73.9550], [40.7140, -73.9550], [40.7140, -73.9600]]
  };""" + src[b:]
    # busy hubs: Times Sq, Herald Sq, Union Sq, Grand Central, Penn Station, Fulton / WTC, Downtown Brooklyn, Flushing, Jamaica, LIC,
    # Williamsburg, 125th St, Fordham, Jersey City Exchange Pl, Newark Penn, Hoboken, Journal Square
    a = src.index('  const HUBS_LL = ['); b = src.index('];', a) + 2
    src = src[:a] + """  const HUBS_LL = [[40.7580, -73.9855, 320], [40.7497, -73.9877, 220], [40.7359, -73.9906, 220], [40.7527, -73.9772, 260], [40.7506, -73.9935, 260],
    [40.7105, -74.0090, 300], [40.6928, -73.9870, 300], [40.7590, -73.8300, 300], [40.7020, -73.8010, 280], [40.7470, -73.9440, 240], [40.7170, -73.9570, 240],
    [40.8090, -73.9480, 260], [40.8610, -73.8900, 260], [40.7163, -74.0330, 240], [40.7347, -74.1640, 260], [40.7360, -74.0290, 200], [40.7330, -74.0630, 220]]""" + src[b:]
    return src
