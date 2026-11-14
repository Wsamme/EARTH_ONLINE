p='mkengine.py'; s=open(p).read()
a="open(SC + 'gbareal/app/gbareal.js', 'w').write(src)"
assert s.count(a)==1
s=s.replace(a, r'''# ---------- memory: road chunks loaded around the camera (tools/rc_app.js) ----------
R("step(sgrFetch('gba_base.txt')), step(sgrFetch('gba_roads.txt')), step(sgrFetch('gba_water.txt')), step(sgrFetch('gba_bld0.txt'))",
  "step(sgrFetch('gba_base.txt')), null, step(sgrFetch('gba_water.txt')), step(sgrFetch('gba_bld0.txt'))")
R("    SGR.lines = SGRoads.decode(r, base.names, base.refs);",
  "    SGR.rc = new Map(); SGR.rcMeta = null; { const p = window.__near ? sgXY(window.__near[0], window.__near[1]) : sgXY(22.2880, 114.1650); await sgrRcFetch(base.roadChunks.filter(C => sgrRcDist(C, p[0], p[1], 0) < SGR_RC_PRE)); }\n    SGR.lines = sgrRcJoin();")
R("/* ---------- gba: the terrain in chunks", open(SC + 'gbareal/tools/rc_app.js').read() + "\n/* ---------- gba: the terrain in chunks")
R("  if (SGR.on){ for (const T of SGR.tiles.values()) sgrLodTile(T); sgtUpdate(); }", "  if (SGR.on){ for (const T of SGR.tiles.values()) sgrLodTile(T); sgtUpdate(); sgrRcTick(); }")
# ---------- labels: places and POIs capped (Hong Kong had 2600 / 3000) ----------
R("    for (const p of B.places){ const key", "    for (const p of B.places.slice(0, 3000)){ const key")
R("  if (showPoi) for (const p of B.pois){", "  if (showPoi) for (const p of B.pois.slice(0, 3500)){")
open(SC + 'gbareal/app/gbareal.js', 'w').write(src)''')
open(p,'w').write(s); print('ok')
