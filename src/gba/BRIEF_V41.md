# Greater Bay v41 — brief for agents (14 Nov 2026, hard stop 02:20 UTC = 10:20 SGT)

W = /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/wipsrc/src/ (the paused Greater Bay source, paths fixed).
Served site: /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/site/ (gbadata/ is there; gba_all.html = the
current Greater Bay page: 292 labels = 189 HK + 103 Shenzhen, 0 page errors, heap 1111 MB, ready ~98 s).

Read first: W/gba/BRIEF.md (world conventions, coordinates, base height, hiding real buildings, bridges, style), W/gba/PLAN.md,
an existing group as example (W/gba/szluohu/szluohu.js, W/gba/szcbd/szcbd.js), W/gba/targets.json (unbuilt targets have
names + OSM ids + centroids: reuse them).

## Hard limits
- **Stop and report by 02:20 UTC** (`date -u`). Only finished, tested work ships; nothing may break the page.
- **No network** (OSM / Wikipedia / photos blocked). Footprints, heights, positions: from the map data in the running app (the
  engine's in-memory building arrays; look at the loader in the built page) or W/gba/ref_*.json / targets.json.
- **No invented data**: no unsourced years / architects / floor counts in cards; style details are approximations (say so in a
  comment). No real brand logos, no lookalike names. Never Math.random (LMCTX.rng()).
- Create ONLY your own folder W/gba/<yours>/ with W/gba/<yours>/<yours>.js. Never reuse an existing key or footprint.

## Build and check
- Build: `cd W && GBALM=<yours> CITY=gba python3 gbareal/tools/patch17_gba.py city-brush-v16.html ../../site/t_<yours>.html`
  (GBALM=<yours> builds only your group + the HK modules for speed; omit GBALM for everything). It writes one HTML file.
- Check (shared browser lock; ~2–3 min a run, other agents queue too — batch your changes):
  `bash /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/lm33/kit/browser.sh node /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/lmx/shot.js /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/site t_<yours>.html /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/shots41/<yours>_x '<optional JS run after load, e.g. move the camera>'`
  Prints page errors, failed requests, landmark-label count, heap; saves a PNG — LOOK at it. 0 page errors required.

## Report (final message): labelled keys added, files, what you checked (shots), open issues.
