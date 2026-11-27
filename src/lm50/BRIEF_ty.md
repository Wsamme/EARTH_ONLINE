# Round lm50 — Tokyo: brief for the model authors (city part; the contract is `R/lm50/BRIEF.md` + `R/lm40/BRIEF.md`)

`R = /home/claude/earth_online/src` (the build root), `SC = /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/`,
`K = R/lm50/ty50kit` (the Tokyo kit of this round). Everything in `R/lm40/BRIEF.md` (model format, quality bar, budgets, night
looks, no logos / brand names / readable text, respectful religious buildings, no `Math.random`, foundations to y ≈ −5 m, plan within
2–3 m of the real footprint, no hull over neighbours you don't model) applies. This file says what is Tokyo-specific.

## Your group and files
| group | your module (the Tokyo build globs `R/tyo/<dir>/<dir>.js`) | targets / refs |
|---|---|---|
| ty50a … ty50h | `R/tyo/ty50x/ty50x.js` (e.g. `R/tyo/ty50c/ty50c.js`); work files in `SC/lm50/ty50x/` | `R/lm50/targets_ty.json` (rows with `group`), `R/lm50/ref_ty50x.json` |

- One `{ … }` block: `LANDMARKS.<key> = {zh, en, cat, r, h, lt, build(){…}}` + `SG_PLACES.push({type:'<key>', lat, lon, rot})` per key
  (sites: `Object.assign(SITES, {…})`, see `SC/sg/SITES_API.md` if present, or copy the pattern of `R/tyo/tyx_west/tyx_west.js`).
  Secondary keys `label:false`. Use the `zh` / `en` of targets_ty.json (fix them only if wrong, and say so).
- The Tokyo build (`sgreal/patch17.py`, `CITY=tyo`) picks every `R/tyo/<d>/<d>.js` up by glob (`TYOLM=a,b` restricts the list);
  your folder therefore goes live in the coordinator's next build — keep it loadable at all times (`node --check`, nstat below).
- Look at an existing module for the helpers style: `R/tyo/tyx_central/tyx_central.js` (shared helpers at the top of its block:
  `mkGround`, `mkBatch`, `obox`, frames) — copy what you need **inside your own block** (blocks are concatenated; never redefine
  globals).

## Targets (222 rows, 8 groups, 4 heroes each)
INSERT_TABLE

`targets_ty.json` row fields: `key zh en kind lat lon r osm h hs note unc hero group` + `osm_name`, `osm_area` (precinct the anchor was
picked in), `osm_line`, and `app` = what the page draws today on that outline (records, building:part pieces, max height, area ratio
app / OSM; bridges: the app's bridge decks over the outline with their max deck height and road classes).
- `lat` / `lon` = centroid of the OSM outline `osm`, `r` = max distance from it to the outline + 3 m. Set your own `r` from the model.
- `h` is verified (source in `hs`) or null. **OSM height / levels tags quoted in `hs` are mapper / PLATEAU values, not verified.**
  `note` is a recognition hint, not a spec: confirm years, architects, storeys and features yourself before you model them.
- ⚠ `unc` says why an anchor is uncertain — read it for every key. The recurring cases:
  - *the app draws only N m on this outline* — the map data (v37 OSM, Oct 2026) under-reports the tower (e.g. tymidyaesu 35 m drawn,
    240 m real; tyyomiuri 94 / 200; tybiztower 28 / 179.3; tyhikarie 103 / 182.5; tykitanaka 15 / 212). Model the real height.
  - *drawn as building:part pieces only* (in `app`) — the app has no outline record, only parts (the refs list them under a building of
    type `parts only`). Your hull hides them like any other record.
  - *no app record centred on this outline* / *not in the app's map data* — the OSM outline changed after the map data was made
    (tyichigokan, tychichibunomiya, tymot, tyhammerhead) or the building is missing (tyarchives): the ref shows what the page draws
    there; anchor on the current OSM outline (lat/lon given) and check that you do not leave a doubled or orphaned block.
  - *anchored on the largest building inside precinct …* — for temples, shrines, stations and sites the resolver picked the biggest
    building in the OSM precinct; confirm it is the right hall (photos, the refs' names) and re-anchor if not.
- Bridges (kind `bridge`, group ty50g and tyhijiribashi in ty50f): the app draws the real road / path deck (`ref.roads[]` with
  `br:true` and `elev` = deck height above the ground per vertex). Model arches / girders / pylons / piers / railings / lamps around it.
  Along the Sumida the class 0 lines at ~27 m in the refs are the **Shuto expressway viaduct on the bank, not the bridge deck**.

## World frame (Tokyo)
- Projection (`R/tyoreal/README.md`): x = (lon − 139.75)·90549.1, y = (lat − 35.66)·110952.7 (metres, y north). Local model axes:
  +x east, +y up, +z south; the group is placed at (x, top, −y) with `rotation.y = rot` (three.js sense) — as in Singapore.
- Ground: the app puts the model's y = 0 at the **highest** terrain sample within 0.7 r (+0.6 m) (`placeLandmarkMesh`); on slopes
  (Akasaka, Shibuya, Ochanomizu, Yokohama Kannai) take your foundations down accordingly (`ref.terrain`, `ref.ground`).
  The terrain is a smoothed surface model: Shibuya station reads ~30 m, the reclaimed bay land sits at the 1.5 m floor (README).
- Hiding: the app hides every real building whose **centre or more than half of its outline vertices** lie in your model's hull
  (vertices below 25 m, convex hull grown 3 m — `tyoreal.js sgrLandmarkHulls / sgrSkipB`). Paths inside the hull are hidden; roads
  are not. Sites hide the real city inside their keep polygon.
- Night: Tokyo uses the shared landmark shader (`lt.m` 0 floodlit / 1 lit windows / 2 LED); JST, the sun at 35.66 N 139.75 E.

## Reference data (`R/lm50/ref_ty50x.json`, tool `R/lm50/ty50_refs.py`)
Same format as the lm40 / v37 refs (`targets.<key>`: `meta` = the target row, `anchor`, `radius` = max(1.6 r, r + 60) ≤ 700 m,
`ground`, `terrain` grid, `buildings`, `roads`, `areas`, `pois`; local metres: +x east, +z south). Tokyo specifics:
- `buildings`, their `parts`, `roads` (+ bridge `elev`), `terrain` and the `src:'app'` POIs are **decoded from the page's own data**
  (`site/tyodata/*.bin`, decoder `R/lm50/ty50_app.py`): exactly what the page draws. `osm`, `name`, `ja`, `floors`, `h_osm` come from
  current OSM (Overpass) matched to each record (`iou` = outline overlap; `-` = no match). `h` = app height (OSM / PLATEAU value or an
  estimate — `est:true` when OSM has neither height nor levels). `areas` = OSM land-use / leisure / amenity / tourism / historic /
  man_made / water polygons clipped to the box; `pois` with `src:'osm'` = named OSM nodes.
- The v37 Tokyo refs tool (`R/tyoreal/b9_refs.py`) could not be used: it reads the pipeline outputs `tyoreal/out/*.pkl` (from the
  495 MB Kantō .pbf), which are no longer on this machine, and overpass-api.de / Geofabrik are not reachable from here. `ty50_refs.py`
  rebuilds the same output from the staged app data + the maps.mail.ru Overpass mirror (caches in `SC/lm50/ty/osm/g_<group>.json`).
- Corrected anchor (writes `ref_<group>_<suffix>.json` next to the refs, or into `REREF_DIR`; ~20–60 s):
  `cd R/lm50 && REREF_DIR=SC/lm50/ty50x python3 ty50_refs.py --reref <suffix> <key> <lat> <lon> <radius>`

## Kit — commands (each was run once for this brief; outputs quoted where useful)
Offline, as often as you like (no browser; node + python3; the app's real builder helpers are read from `R/city-brush-v16.html`):
1. **Existing models near a point** (evaluates every `R/tyo/<d>/<d>.js` + your files; hull distance; `INSIDE` = inside a site keep):
   `node K/near.js <lat> <lon> [r=600] [R/tyo/ty50x/ty50x.js]`
   e.g. `node K/near.js 35.6815 139.7690 300` → `59 m lm tygranroof marunouchi …`, `230 m lm tytokyostation …`, `296 m lm tytokiwabashi …`
2. **Stats** (helper calls before the merge, colour specs, tris after the merge, ms, rmax vs r, y range, the last SG_PLACES entry):
   `node K/nstat.js R/tyo/ty50x/ty50x.js [key1,key2,…]`
   e.g. `node K/nstat.js K/test/kittest.js` → `tykittest {"tris":24,"calls":2,"mats":2,"ms":1,"r":47,"rmax":40.7,"ymin":-5,"ymax":211,…}`
3. **Shaded preview**: `node K/ndump.js R/tyo/ty50x/ty50x.js <key> SC/lm50/ty50x/x.bin && python3 K/nrender.py SC/lm50/ty50x/x.bin
   SC/lm50/ty50x/x.png tx ty tz dist elev azim [W H]` (model coords, y up; azim 0 = camera south looking north; ~0.5 s for 4 k tris,
   keep W H small above ~100 k tris). Look at every PNG with the Read tool. Delete the `.bin` files when done.
4. **Plan overlay vs the real footprints** (places the key with its last SG_PLACES entry like the app, applies the app's hull + hiding
   rule; prints hidden real buildings, CLASHES, the offset to the target outline; PNG: grey kept, red hidden, orange clash, blue hull,
   green model below 4 m, dark red outline = the target's `osm` footprint):
   `python3 K/oplan.py R/tyo/ty50x/ty50x.js <key> R/lm50/ref_ty50x.json [<refkey>] SC/lm50/ty50x/<key>_plan.png [half m]`
   e.g. on the smoke test: `hidden real buildings (1): w95274405 GranTokyo South Tower h207 | CLASHES (0) | target footprint w95274405 …
   centroid offset 0.0 m E, 0.1 m S`. Fix lat / lon / rot until the green sits on the red outline and there is no orange.

Browser — **at most 2 runs per group** (1 "in-situ" batch + 1 full app), always through the lock, detached, polled:
5. **Build a test page** into your folder (≈ 3 s; `tyodata` is a symlink to `site/tyodata`, nothing is copied):
   `bash K/mkapp.sh SC/lm50/ty50x/app <name> "<TYOLM folders>" [EXTRA_MODS relative to R]`
   - in-situ (fast): only your folder and the neighbours of your area, e.g.
     `bash K/mkapp.sh SC/lm50/ty50a/app ty50a ty50a,marunouchi,palace,tyx_central`
   - full app: `bash K/mkapp.sh SC/lm50/ty50x/app ty50x all`
6. **Screenshots** (Tokyo copy of the lm40 appshot: own server root, Chromium 1243, three.js from `SC/vend`; views
   `[name, lat, lon, dist m, elev °, azim °, hour]`, 20.5 = night; `NEAR=lat,lon,radius` streams only the tiles within the radius):
   ```
   cd SC/lm50/ty50x && (setsid nohup bash ../../lm33/kit/browser.sh env ROOT=app PAGE=t_<name>.html NEAR=<lat>,<lon>,1500 W=1280 H=800 \
     node R/lm50/ty50kit/appshot.js shots '[["<key>_d",lat,lon,400,30,200,12],["<key>_n",lat,lon,400,30,200,20.5]]' > app.log 2>&1 &)
   ```
   Poll `app.log`. Pass = **zero PAGEERR** and FAILED-URLS only the expected ones: INSERT_FAILED. Then
   `rm SC/lm50/ty50x/app/t_<name>.html SC/lm50/ty50x/app/t_<name>-app.js`.
   Smoke test of this brief: INSERT_SMOKE
7. There is **no separate in-situ harness for Tokyo** this round (the v37 `tyoreal/kit` read `tyoreal/out`, which is gone); step 5's
   restricted build + `NEAR` is the in-situ run: real terrain, roads, buildings and the app's own hiding, with your neighbours.

## Neighbours already modelled (existing hulls / site keeps within 120 m of a target; include their folders in your in-situ build)
INSERT_NEIGH

## Data notes
- The app's map data is the v37 build (OSM Kantō extract of Oct 2026, staged in `site/tyodata`); current OSM (Nov 2026) is newer.
  Buildings completed or re-mapped since then may be missing or drawn as other outlines (see `unc`).
- Tokyo OSM maps many towers as building:part sets; where a part starts at the ground the app drops the outline and draws the parts.
- `R/tyo/zz_models` swaps a few existing landmarks for downloaded glTF models (they load from `tyodata/models/`, which is not in
  `site/tyodata` on this machine — requests for it fail harmlessly and the hand-built version stays).
- Uncertain anchors: tymidyaesu, tymitsukoshi, tyichigokan, tyyomiuri, tynikkei, tynihonbashimitsui (ty50a); tyshiodomebldg (ty50b);
  tyndl, tyarkmori, tykioi, tybiztower, tyakasakatrust, tysengakuji (ty50c); tyokuma, tytimessq, tyakagi, tyltower (ty50d); tyhikarie,
  tynhkcenter, tytogo?, tychichibunomiya, tyjingustadium, tysakurastage, tyaoyamatwin (ty50e); tyuenostn, tytoshimachimney,
  tytoshimaoffice, tysunshineprince, tykyuiwasaki (ty50f); tyasakusajinja, tytomioka, tymot, tycruise (ty50g); tyarchives,
  tyhammerhead, tybayquarter, tyaircabin, tykitanaka, tysaitamastadium, tykadokawa (ty50h) — the exact reason is in each row's `unc`.
