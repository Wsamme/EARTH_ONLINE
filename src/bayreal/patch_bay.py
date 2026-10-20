# v22: the San Francisco Bay Area build. Called by sgreal/patch17.py (CITY=bay) on the assembled source.
import re
BAY_MODS = ['bayreal/app/bay_reset.js', 'sgreal/mod_roads/roads.js', 'sgreal/mod_bld/bld.js', 'lm20/signs/signs.js', 'lm20/f1d/f1d.js', 'lm20/light/light.js', 'lm20/wx/wx.js', 'lm20/core/core.js', 'lm20/traffic/traffic.js', 'lm24/admin/admin.js', 'lm24/fly/fly.js', 'lm27/phys/phys.js', 'lm25/kaiju/kaiju.js', 'lm25/cityrace/cityrace.js', 'lm25/net/net.js', 'lm27/fireworks/fireworks.js', 'lm28/army/army.js', 'lm30/nav/nav.js', 'lm31/i18n/i18n.js', 'lm31/lmcard/lmcard.js', 'lm31/info_bay/info_bay.js', 'lm32/detail/detail.js', 'lm32/clock/clock.js']
BAY_APP = ['lm20/audio/audio.js', 'bayreal/app/bay_post.js', 'bayreal/app/bayreal.js', 'bayreal/app/baystats.js', 'sgreal/app/cityswitch.js']
def apply(src):
    def R(a, b, count=1):
        nonlocal src
        n = src.count(a); assert n == count, (n, a[:150]); src = src.replace(a, b)
    # ---------- names, titles ----------
    R("function sgNames(on){ const [zh, en] = on ? ['新加坡', 'Singapore'] : ['澄湾岛', 'Chengwan Island'];", "function sgNames(on){ const [zh, en] = on ? ['旧金山湾区', 'San Francisco Bay Area'] : ['澄湾岛', 'Chengwan Island'];")
    R("$('#sample').innerHTML = on ? '还原<small>Reset Singapore</small>' : '示例城市<small>Sample</small>'; $('#toCap').innerHTML = on ? '滨海湾<small>Marina Bay</small>' : '去首府<small>Capital</small>';",
      "$('#sample').innerHTML = on ? '还原<small>Reset Bay Area</small>' : '示例城市<small>Sample</small>'; $('#toCap').innerHTML = on ? '旧金山市中心<small>Downtown SF</small>' : '去首府<small>Capital</small>';")
    R('aria-label="新加坡城市三维视图 Singapore 3D view"', 'aria-label="旧金山湾区三维视图 San Francisco Bay Area 3D view"')
    R('<span class="sub">City Brush · 新加坡 Singapore 1:1 · 真实地图 Real map · © OpenStreetMap</span>', '<span class="sub">City Brush · 旧金山湾区 San Francisco Bay Area 1:1 · 真实地图 Real map · © OpenStreetMap</span>')
    R('回到新加坡 · Back to Singapore', '回到湾区 · Back to the Bay Area')
    R("showBusy('正在还原新加坡… Restoring Singapore')", "showBusy('正在还原湾区… Restoring the Bay Area')")
    src = re.sub(r'<title>[^<]*</title>', '<title>City Brush · San Francisco Bay Area</title>', src, count=1)
    # ---------- the overview camera: the whole bay ----------
    R("else if (SGR.on){ const c = sgXY(1.345, 103.83); tt.set(c[0], 0, -c[1]); to = new THREE.Vector3(c[0] + 4000, 30000, -c[1] + 33000); }",
      "else if (SGR.on){ const c = sgXY(37.655, -122.235); tt.set(c[0], 0, -c[1]); to = new THREE.Vector3(c[0] + 5000, 41000, -c[1] + 45000); }")
    # ---------- generated blocks on repainted ground: San Francisco's towers reach 326 m ----------
    R("if (SG.on) h = Math.min(h, z === 1 ? 150 : 285);", "if (SG.on) h = Math.min(h, z === 1 ? 120 : 320);")
    # ---------- right-hand traffic ----------
    R("*(G.nz ? -1 : 1), x = ax + dx*st.s", "*1, x = ax + dx*st.s")
    # ---------- Singapore-only network pieces ----------
    R("function sgCableCar(B){\n  net.ropes = [];", "function sgCableCar(B){\n  net.ropes = []; return;")
    m = re.search(r"\nfunction sgF1\(B\)\{\n", src); assert m
    src = src[:m.end()] + "  if (!SGD.f1 || SGD.f1.length < 10){ net.f1 = null; return; }\n" + src[m.end():]
    # the port: Oakland's container terminals (Outer, Middle and Inner Harbor)
    R("const boxes = [[[1.262, 103.745], [1.293, 103.795]], [[1.253, 103.822], [1.276, 103.850]], [[1.293, 103.700], [1.312, 103.727]], [[1.205, 103.595], [1.285, 103.665]]];",
      "const boxes = [[[37.792, -122.336], [37.822, -122.300]], [[37.786, -122.305], [37.800, -122.278]]];")
    R("name:['巴西班让集装箱码头', 'Pasir Panjang Terminal']", "name:['奥克兰港', 'Port of Oakland']")
    R("sub:'新加坡 ⇄ 大阪  SIN ⇄ KIX'", "sub:'旧金山 ⇄ 大阪  SFO ⇄ KIX'")
    # ---------- the sun over the bay (Pacific Time with daylight saving) ----------
    R("sg:{lat:1.3521, lon:103.8198, tz:8, name:'Singapore'}",
      "sg:{lat:37.70, lon:-122.25, get tz(){ const y = LG.ymd[0], v = LG.ymd[1]*100 + LG.ymd[2], dw = (m, d) => new Date(Date.UTC(y, m - 1, d)).getUTCDay(), s = 8 + (7 - dw(3, 8)) % 7, e = 1 + (7 - dw(11, 1)) % 7; return v >= 300 + s && v < 1100 + e ? -7 : -8; }, name:'San Francisco Bay Area'}")
    # ---------- F1 free drive: keep right; no street circuit in the bay ----------
    R("sx = best.px - uy*off, sy = best.py + ux*off;   // keep left", "sx = best.px + uy*off, sy = best.py - ux*off;   // keep right")
    R("x -= Math.sin(hx)*RD_WID[l.c][0]*0.25; y += Math.cos(hx)*RD_WID[l.c][0]*0.25; }   // keep left", "x += Math.sin(hx)*RD_WID[l.c][0]*0.25; y -= Math.cos(hx)*RD_WID[l.c][0]*0.25; }   // keep right")
    R("spawnFree(sgXY(1.2905, 103.8545)[0], sgXY(1.2905, 103.8545)[1], [1, 0])", "spawnFree(sgXY(37.7920, -122.3990)[0], sgXY(37.7920, -122.3990)[1], [1, 0])")
    R('<button class="f1card" id="f1GoRace" type="button">', '<button class="f1card" id="f1GoRace" type="button" style="display:none">')
    # ---------- 156 cities and neighbourhoods: small ones are labelled only from nearer ----------
    R("labelItems.push({el, x:d.lx, y:d.ly, lift:40, maxD:SGR.on ? 42000 : 7500, minD:SGR.on ? 2600 : 0});",
      "labelItems.push({el, x:d.lx, y:d.ly, lift:40, maxD:SGR.on ? Math.min(42000, 9000 + Math.sqrt((d.area || 0)/1e6)*2600) : 7500, minD:SGR.on ? 2600 : 0});")
    # ---------- landmarks split into several keys: one label ----------
    R("for (const L of landmarks){ const def = LANDMARKS[L.type], el = document.createElement('div'); el.className = 'lbl n lm';",
      "for (const L of landmarks){ const def = LANDMARKS[L.type]; if (def.label === false) continue; const el = document.createElement('div'); el.className = 'lbl n lm';")
    # ---------- rail: Muni / VTA / cable cars run in the street (rails in the road, no ballast bed) ----------
    R("    } else quadSegD(B.flat, p0, p1, W + 3, 0.55, hex('#a39a8a'));", "    } else if (!R.street) quadSegD(B.flat, p0, p1, W + 3, 0.55, hex('#a39a8a'));")
    R("const a = off(p0, d0, sd), b = off(p1, d1, sd); if (!up) quadSegD(B.flat, a, b, lrt ? 1.6 : 2.4, 0.65, track);",
      "const a = off(p0, d0, sd), b = off(p1, d1, sd); if (!up && R.street){ for (const e of [-0.72, 0.72]) quadSegD(B.flat, off(p0, d0, sd + e), off(p1, d1, sd + e), 0.14, 0.34, [0.5, 0.49, 0.47]); } else if (!up) quadSegD(B.flat, a, b, lrt ? 1.6 : 2.4, 0.65, track);")
    # ---------- shop signs, neon and lanterns: the Bay Area's districts ----------
    a = src.index('  const DIST_LL = {'); b = src.index('  };', a) + 4
    src = src[:a] + """  const DIST_LL = {
    chinatown:   [[37.7977, -122.4087], [37.7977, -122.4040], [37.7905, -122.4044], [37.7905, -122.4082]],
    quays:       [[37.8105, -122.4215], [37.8105, -122.4080], [37.8070, -122.4080], [37.8070, -122.4215]],
    kgglam:      [[37.7645, -122.4370], [37.7645, -122.4318], [37.7585, -122.4318], [37.7585, -122.4370]],
    littleindia: [[37.7690, -122.4235], [37.7690, -122.4165], [37.7520, -122.4160], [37.7520, -122.4230]],
    jalanbesar:  [[37.7712, -122.4505], [37.7712, -122.4435], [37.7680, -122.4435], [37.7680, -122.4505]],
    geylang:     [[37.8002, -122.4115], [37.8002, -122.4028], [37.7975, -122.4028], [37.7975, -122.4115]],
    joochiat:    [[37.8012, -122.2748], [37.8012, -122.2668], [37.7962, -122.2668], [37.7962, -122.2748]],
    tiongbahru:  [[37.4478, -122.1645], [37.4478, -122.1580], [37.4428, -122.1580], [37.4428, -122.1645]],
    emeraldhill: [[37.8702, -122.2605], [37.8702, -122.2570], [37.8645, -122.2570], [37.8645, -122.2605]],
    balestier:   [[37.7868, -122.4330], [37.7868, -122.4278], [37.7843, -122.4278], [37.7843, -122.4330]]
  };""" + src[b:]
    a = src.index('  const HUBS_LL = ['); b = src.index('];', a) + 2
    src = src[:a] + """  const HUBS_LL = [[37.7880, -122.4072, 420], [37.7842, -122.4066, 200], [37.7285, -122.4765, 260], [37.6720, -122.4705, 260], [37.5375, -122.3005, 260],
    [37.4430, -122.1715, 300], [37.3255, -121.9455, 360], [37.3210, -121.9480, 240], [37.4155, -121.8975, 320], [37.8335, -122.2925, 220], [37.3330, -121.8890, 380],
    [37.8045, -122.2700, 360], [37.8955, -122.0590, 260], [37.6955, -121.9285, 260], [37.7840, -122.4030, 300], [37.7765, -122.3935, 260], [37.8065, -122.4105, 260]]""" + src[b:]
    return src
