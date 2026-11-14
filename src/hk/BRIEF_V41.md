# Hong Kong v41 — brief for agents (14 Nov 2026, hard stop 02:20 UTC = 10:20 SGT)

SC = /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/ (a copy of the repo's src/ plus site/).
Repo checkout (read-only for you): /home/claude/earth_online.

## Hard limits
- **Stop and report by 02:20 UTC** (`date -u`). Whatever is finished and tested by then ships; unfinished work must not break the page.
- **No network** for OSM / Wikipedia / photos (blocked). Work from data already on disk and in the running app.
- **No invented data.** Heights, footprints and positions come from the map data (OSM-derived, already in hkdata) or the existing
  ref files in SC/hk/*/ref*.json, SC/hk/ref_*.json, SC/hkv/scout. Names from the map's labels / POIs or well-known official names.
  Do not state facts you cannot source (years, architects, floor counts) in cards; style details (façade rhythm, crown shape,
  colours) may follow general knowledge of the building and are approximations — say so in a comment.
- No real brand logos, no lookalike / pun brand names. Sign text is always invented, neutral (e.g. 金龍酒家-style generic words
  are fine only if not a real chain's name).
- Never Math.random: use LMCTX.rng().

## Where things are
- Hong Kong page build: `cd SC && HKLM=<comma list or omit> CITY=hk python3 sgreal/patch17.py city-brush-v16.html site/t_<you>.html`
  (writes site/t_<you>.html + site/t_<you>-app.js? check what it writes; it reproduces site/hk.html when HKLM is unset).
  Landmark modules are auto-discovered from `SC/hk/<name>/<name>.js`. Create ONLY your own folder(s) (named below).
- Format and helpers (the kit docs are not in this copy; read these instead): SC/lmx/BRIEF_V38.md, SC/lm40/BRIEF.md, SC/hkv/BRIEF_HKV.md, SC/hk/GBA_BRIEF_ref.md, and the helper definitions in SC/lm16 / SC/lm20 JS (grep "function LBox", "function LLoft"). Examples
  SC/hk/hkv_island/hkv_island.js, SC/hk/hkx_island/hkx_island.js, SC/hk/central/central.js.
- Existing keys: run `node SC/lmx/count.js hk` (may need path fixes) or grep LANDMARKS keys in SC/hk/*/*.js. Never reuse a key;
  never place a second model on a footprint that already has one.
- Footprints / heights of every real building: the app's in-memory building data. Load the page headless and read the engine's
  building arrays (look at site/hk-app.js / SC/hkreal/app/hkreal.js for the loader and the global that holds the decoded
  buildings: footprint rings in world metres, height, centroid). Projection: x = (lon − 114.12)·103014.2, y = (lat − 22.34)·110734.9.
  Place models with `SG_PLACES.push({type:'key', lat, lon, rot})`; local +x east-ish rotated by rot; the app hides the real
  building under your model's lower hull.
- Page check (shared browser lock, ~2 min a run): `bash SC/lm33/kit/browser.sh node SC/lmx/shot.js SC/site t_<you>.html SC/shots41/<you>_x '<optional JS to run, e.g. move camera>'`
  It prints page errors, failed requests, landmark label count and heap; saves a PNG — LOOK at it. Base HK page: 189 labels,
  0 page errors, heap ~800 MB, ready ~104 s. Your build must stay at 0 page errors.
- Intro cards: SC/lm33/info_hk (add entries for your labelled keys if time allows; validator there).

## Report (final message): keys added (labelled / unlabelled), files, what was checked in the app (shots), open issues.
