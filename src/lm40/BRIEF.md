# City Brush round lm40 — Singapore to 200+ landmarks: brief for the model authors

`SC = /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/` (all paths below are relative to it).

The app (three.js r128) maps real Singapore at 1:1. It has about **121 distinct landmarks** today (114 labelled landmark models +
7 sites; list in `SC/lmx/sg_landmarks.json`). The user wants **at least 200**. This round adds **96 new targets in 8 groups of 12**
(sg40a … sg40h, one area each). Every key is a real structure that is **not modelled yet** (the real OSM building is in the map
today as a plain extruded block, or not at all — your model replaces it). You are one group.

## Read first (they all still apply)
- `SC/lm16/LANDMARK_KIT.md` — model format, builder helpers (`SC/sgreal/kit/lmbase.js` is their source), colour specs.
- `SC/lm18/BRIEF.md`, `SC/lm20/BRIEF_LM.md` (night animation `lt.anim` 'breathe' | 'cycle' | 'sweep' | 'show', `lt.c2`;
  **bridges**: the app draws the real road / path deck), `SC/lm22/BRIEF_LM22.md` (method, constraints, crown signs).
- Sites: `SC/sg/SITES_API.md` (the SITES format: `build(ctx)` with absolute heights, `ctx.gy / paint / line / tree / lamp`, `keep`).
- `SC/lm26/BRIEF.md` — the last Singapore round; this brief replaces it for lm40 (same contract, new paths and kit fixes).
- `SC/lm20/APP_NOTES.md` only if you need app internals.

## Your group
| group | area | targets (★ = hero: a faithful, detailed replica; ⚠ = anchor uncertain, see below; (site) = SITES format) |
|---|---|---|
| sg40a | CBD & Marina | ★sgmbcc, sgmsouthpier, sgsixbattery ⚠, ★sgcapitaltower, sgfraserstower ⚠, sgura ⚠, sgsltower, ★sgintlplaza, ★sgmillenia, sgjubilee, ★sgesplbr, sgorq |
| sg40b | Chinatown, Tanjong Pagar & the upper River | ★sgchinatowncx, sgalabrar, sgfuktakchi ⚠, ★sgyuehhai, ★sgjinrikisha ⚠, sgmaxwell, sgyingfo, sgsiangcho, ★sgcantonment, sgordbr ⚠, sgjiakkim ⚠, sguesquare |
| sg40c | Bras Basah, Bugis & Little India | sgsmu (site), ★sgsota, sgnafa, sgcathay, sgmaghain, ★sgtanyeoknee, sgtekka, ★sgihc, ★sgsakyamuni ⚠, sgleongsan, sgmustafa, ★sgmalabar |
| sg40d | Orchard, Tanglin & Newton | ★sgparagon, sgwismaatria, sg313somerset, ★sghiltonorchard, sgshawhouse, ★sgemeraldhill, ★sgchesedel, sgnewtonfc, sgorpc, sgstgeorge, sgluckyplaza, sgdempsey (site) ⚠ |
| sg40e | Sentosa, HarbourFront & the Southern Ridges | sgoceanarium ⚠, ★sgcapella ⚠, ★sghftowers, sgkeppelbaytower, ★sgfaberpeak, sgsentosastn, ★sgskyhelix, sgpalawanbr ⚠, sgmbc, ★sgkeppelbaybr, sgalexarch, sgbukitchandu |
| sg40f | West | sglakeside (site), sgjapanesegarden (site), ★sgjurongtownhall ⚠, ★sgfusionopolis, sgbiopolis, ★sgstarvista, sgmediacorp, sgppps ⚠, ★sgfordfactory, sgbtrailstn, ★sgbttruss, sgsecondlink |
| sg40g | North & Central | sgzoo (site), sgnightsafari (site) ⚠, sgriverwonders (site), ★sgbirdparadise (site) ⚠, ★sgtreetop, sgsungeibuloh (site), ★sgcauseway, ★sgtpdragon ⚠, ★sgskyville, sgsunyatsen, sgnovena, sgburmese |
| sg40h | East | ★sgsheares, sgbedokjetty, ★sgkoonseng, ★sggeylangserai, ★sgplq, sgexpo, sgsutd (site), sgchangichapel, sgchangivillage (site), ★sgchekjawa (site), sgsenpaga, sgredhouse |

- **Targets:** `SC/lm40/targets_sg.py` → `T40` (one row per key: `zh`, `en`, `kind`, `lat`/`lon`, suggested `r`, `osm` = the OSM
  way / relation of the footprint the anchor sits on — `line` for a bridge / path line, `-` for a POI-only anchor — `h` = verified
  height or None, `hs` = what was checked and where, `note` = what makes it recognisable, `unc` = why the anchor is uncertain).
  **Use exactly these keys** (unique project-wide), `zh` / `en` as given (fix them only if wrong, and say so).
- **`note` is a recognition hint, not a verified spec.** Only what is listed in `hs` was checked for this round. Years, architects,
  storeys and features in `note` that are not in `hs` must be confirmed by your own research before you rely on them.
- **Reference data:** `SC/lm40/ref_<group>.json` → `targets.<key>`: `meta` (the T40 row), `anchor`, `radius` (= max(1.6 r, r + 60),
  capped at 700 m), `buildings` (real footprint `ring`, `h`, `floors`, `est`, `type`, `name`, **`osm`** id, `parts` with base/top
  heights), `roads` (centrelines; **bridges are kept whole with `br:true` and `elev` = the app's deck height per vertex**),
  **`areas`** (land-use polygons clipped to the box: park, zoo, university, nature_reserve, beach, pier … — use them for SITE
  `keep` polygons), `pois` (named points). Local metres around the anchor: +x east, +z south. **Data heights are OSM values or
  estimates and often wrong for towers** (Capital Tower is 172.8 in the data, 254 m real; Six Battery Road's footprint says 12 m).

### ⚠ Uncertain anchors — confirm before modelling
sgsixbattery (named footprint has h 12: find the 174 m tower outline in its `parts`), sgfraserstower (unnamed footprint w47345029
matched by position only), sgura (main block w47345221 unnamed), sgfuktakchi (POI only, small shophouse pieces around it),
sgjinrikisha (Wikipedia coordinates; the triangular corner building is split into shophouse pieces in the data), sgordbr (bridge
line only 6 m long), sgjiakkim (unnamed river bridge picked at the end of Jiak Kim Street), sgsakyamuni (POI only; probably
w454182411), sgoceanarium (POI; hall footprint unnamed), sgcapella (POI; tell the 1880s barracks from Foster's wings),
sgpalawanbr (the lookout towers have no footprint), sgjurongtownhall (unnamed w96764520, ~100 m west of the Wikipedia point),
sgppps (which halls are A and B), sgnightsafari / sgbirdparadise (zoo polygons ambiguous / missing), sgtpdragon (POI only),
sgchekjawa (POIs only), sgdempsey (site anchored on the road loop). Match names, shapes and photos; if the anchor is wrong, make
refs for the right spot (`reref.sh`, below), and **report which OSM footprint you used for every key**.
**Never invent positions or layouts**: if a structure is not in the data and you cannot place it from photos / plans with
confidence, model what you can place and say what you left out.

## Your file
`SC/lm40/<group>/<group>.js` — one `{ … }` block (helpers inside), concatenated into the app. It only assigns
`LANDMARKS.<key> = {zh, en, cat:'new'|'old', r, h, lt:{m, c, k, e, anim, c2}, build(){…}}` + one
`SG_PLACES.push({type:'<key>', lat, lon, rot})` per key, and for sites `Object.assign(SITES, {<key>:{zh, en, lat, lon, r, keep, h,
lt, build(ctx){…}}})`. A structure split into several keys: secondary keys get `label:false` (list them in your report). Never
`Math.random` (use `LMCTX.rng()` / `ctx.rng()`). The integrator adds your file to `sgreal/patch17.py` MODS — you don't.
Work **only in `SC/lm40/<group>/`** (your module, test scripts, shots, logs). Don't edit any other file (targets, refs, kit,
other modules, the pipeline, the app).

## Quality bar
★ heroes: a faithful replica — real dimensions, the features that make it recognisable at 1–3 km (silhouette, crown, roof,
colour) and convincing at 100–300 m (setbacks, facade rhythm of mullions / spandrels / windows / columns / cornices, entrances,
materials), plus a planned night look. Others: medium detail on the real footprint — correct massing, setbacks, storey rhythm,
roof form, materials and colours, night look. Night: towers lit windows `lt.m:1` and a lit crown; floodlit masonry warm white,
`anim:'breathe'` or none; real LED / colour-changing crowns `'cycle'` + `c2`; only real light-show structures `'show'`.
Foundations down to y ≈ −5 m (more on slopes). The plan must match the real footprint within ~2–3 m and must not grow over
neighbours you don't model (the app hides every real building under the convex hull of your model's lower 25 m + 3 m).
Budgets per key: ≤ ~250 k triangles (small / heritage far below), ≤ ~4000 helper calls, ≤ ~400 ms build, ≤ ~16 colour specs;
merge by colour, keep draw calls low. Sites: ≤ ~4000 calls, everything stood on `ctx.gy`.

Special cases:
- **Bridges** (sgjubilee, sgesplbr, sgordbr, sgjiakkim, sgkeppelbaybr, sgalexarch, sgbttruss, sgsecondlink, sgcauseway,
  sgsheares, sgtreetop, sgpalawanbr, sgbedokjetty): the app draws the real road / path deck (`roads[].elev` gives its height).
  Paths (classes 10–12) whose midpoint lies in your hull are hidden, so a footbridge may replace its path; a bridge carrying a
  real road keeps the app's carriageway — model arches, girders, trusses, piers, parapets and lamps around it at that height.
- **Long structures** (sgsheares 1.8 km, sgcauseway, sgsecondlink): split into a few keys along the line (secondary keys
  `label:false`) so no hull covers buildings it should not; the causeway and the Second Link run into Malaysia (foreign data):
  model the Singapore side and the span, not the Johor shore.
- **Existing neighbours:** list them with `node SC/lm40/kit/near.js <lat> <lon> [r]` and include their module files in your
  in-situ runs (before `roads.js`). Close ones: sg40a — merlion / esplanade / fullerton / anderson / cavenagh (lm18/f1, lm20/w1)
  next to the two river-mouth bridges, oneraffles / uob / sgofc / capitaspring near Six Battery Road and Singapore Land Tower,
  thesail by One Raffles Quay; sg40b — ocbc 53 m from Yueh Hai Ching (OCBC Centre East was kept clear of the temple),
  thianhockkeng, sgnagore, sgclarkequay (its model already includes Read Bridge); sg40c — sam, goodshepherd, natmuseum around
  SMU; sgtantengniah next to Tekka; sg40d — ionorchard, ngeeann, tangplaza along Orchard Road; sg40e — the uss site (r 420)
  ~530 m from the Resorts World targets; sg40f — chinesegarden (r 268) north of the Japanese Garden; sg40h — flyer, suntec,
  float, helix, gardens along the Sheares Bridge.

## Rules
- **No logos, wordmarks, brand names, brand colours or readable text** on any model (malls, hotels, banks, offices, telecoms,
  stadiums; signs carry no letters; screens show abstract colour fields only). Invented, neutral liveries. Card names stay as
  given (official building names are fine in labels).
- **Only verified facts**: dimensions, storeys, materials, colours and features from your research (WebSearch / WebFetch) or the
  refs; say in the report what you could not verify.
- Religious buildings and memorials (temples, mosques, churches, synagogues, Reflections at Bukit Chandu, the Former Ford
  Factory, Changi Chapel): accurate, respectful architecture; no people; no victims' names.
- **Never invent positions or layouts** (see ⚠ above).
- **Every browser run goes through `SC/lm33/kit/browser.sh`** (one browser at a time on the whole machine; expect to wait), run
  detached and polled. Kill by PID only; never `pkill -f` a pattern that matches your own shell.
- **Disk is tight (~3 GB free for everybody):** small shots (W ≤ 1280, H ≤ 800; previews 300–600 px wide), no big dumps left
  behind (delete `.bin` files), delete your `sgreal/site/t_<group>.html` (≈ 6.5 MB) after the full-app run, keep your folder
  under ~30 MB.

## Kit — commands (all checked for this round)
1. **Offline, as often as you like (no browser):**
   - existing models / sites near a point: `node SC/lm40/kit/near.js <lat> <lon> [r=600] [extra.js,…]` (**fixed** for lm40:
     the lm26 version missed lm29 / lm27 modules and every SITE; this one reads the real patch17 MODS list and prints sites
     with their radius, `INSIDE` when you are within one).
   - stats: `node SC/lm22/marina/nstat.js <your.js> <key1,key2,…>` → calls, tris, ms, mats, rmax, ymin/ymax, placements.
   - shaded preview: `node SC/lm22/marina/ndump.js <your.js> <key> SC/lm40/<group>/x.bin && python3 SC/lm22/marina/nrender.py
     SC/lm40/<group>/x.bin out.png tx ty tz dist elev azim [W H]` (model coords, y up; slow above ~100 k triangles — small W H).
   - plan overlay vs the real footprints: `node SC/lm26/kit/oplan.js sg <your.js> <key> SC/lm40/ref_<group>.json <key> out.png [half m]`
     (places the key with its last SG_PLACES entry like the app; prints hidden real buildings, CLASHES, the centroid offset; PNG:
     grey kept, red hidden, orange clash, blue hull, green model below 4 m, roads). Fix lat/lon/rot until green sits on the red
     outline and there is no orange. Look at every PNG with the Read tool.
   - corrected anchor refs: `bash SC/lm40/kit/reref.sh <group>_<n> <key> <lat> <lon> <radius>` → `SC/lm40/ref_<group>_<n>.json`
     (same format; heavy lock, ~20 s). (The lm26 reref.sh writes into lm26 — don't use it.)
   - name / footprint search on the app's data with OSM ids: `cd SC/sgreal && python3 SC/lm40/kit/find40.py '<regex>' 'near:<lat>,<lon>,<r>'`
     (~10 s, ~0.5 GB; one call takes many patterns).
2. **Browser — at most 4 runs for your whole group** (≤ 3 in-situ + 1 full-app; every run batches all your keys, several views each):
   - in-situ kit (landmarks only — real terrain, roads, buildings, hidden like the app):
     ```
     cd SC/sgreal && (setsid nohup bash ../lm33/kit/browser.sh env PAGE=insitu.html QS='k=<key1>,<key2>' node kit/shoot.js \
       ../lm40/<group>/insitu <neighbour files, e.g. ../../lm18/d/d.js>,../../lm40/<group>/<group>.js,../mod_roads/roads.js,../mod_bld/bld.js,insitu.js \
       '[["<key>_plan","overlay","<key>"],["<key>_a",lat,lon,350,30,200,0],["<key>_n",lat,lon,350,30,200,1]]' > ../lm40/<group>/insitu.log 2>&1 &)
     ```
     (module paths are relative to `sgreal/kit/`; views `[name, lat, lon, dist m, elev °, azim °, night 0/1]`; the log prints
     ms / tris / rmax per key and the hidden / clashing real buildings.) **Sites are not supported by the in-situ kit** — test
     them in the full app.
   - full app, once at the end (sites groups may use it earlier instead of an in-situ run):
     ```
     cd SC && EXTRA_MODS=lm40/<group>/<group>.js bash lm20/kit/mkapp.sh <group> signs,light,wx,core,crown,w1,w2,w3,w4,w5
     (setsid nohup bash lm33/kit/browser.sh env PAGE=t_<group>.html NEAR=<lat>,<lon>,<r> node lm40/kit/appshot.js lm40/<group>/app \
       '[["<key>_d",lat,lon,400,30,200,12],["<key>_n",lat,lon,400,30,200,20.5]]' > lm40/<group>/app.log 2>&1 &)
     ```
     (`lm40/kit/appshot.js` = the lm20 appshot plus a **FAILED-URLS** list of every failed request; read its header for the view
     format.) Pass = **zero PAGEERR**, and FAILED-URLS contains **only** the expected ones: the city-switch probes of the sibling
     pages (`/sgreal/site/bay.html`, `nyc.html`, `hk.html`, `tyo.html`, `index.html`) and `/favicon.ico`. The matching
     "Failed to load resource" console lines are those same probes. Anything else (a texture, a data file) is a failure — fix it.
     Then `rm SC/sgreal/site/t_<group>.html`.
3. Aim to finish within about 3 hours of wall time; ★ keys first. A good model of every key beats a perfect few.

## Report back (short)
Per key: what you modelled (main features), stats (tris, calls, ms, rmax / r), the final `SG_PLACES` line (sites: lat, lon, r,
keep size), **the OSM footprint (osm id) you anchored it on** and any anchor you corrected (with the reref file), the overlay
result (fit, clashes). Then: keys that must stay unlabelled (`label:false`); keys you could not do or only partly (and why);
facts you could not verify; 3–5 screenshot paths worth viewing; the full-app result (PAGEERR count and the **FAILED-URLS list**);
anything the integrator must know.
