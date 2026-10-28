# Shenzhen and Dongguan landmarks and sites (City Brush, Greater Bay map) — brief for model authors

Paths are relative to `SC = /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/`.

The Greater Bay map (`SC/gbareal/`, README there) is one continuous real map of **Dongguan, Shenzhen and Hong Kong at 1:1**: a
126 × 126 km square, lon 113.4405–114.6636, lat 22.0871–23.2249, three.js r128. It shows the real terrain (70 m grid), the coast,
reservoirs and fish ponds, all OSM roads of the three cities with flyovers and bridges at their deck heights, and every real
building footprint (≈ 81 000 in Shenzhen, 30 000 in Dongguan, 117 000 in Hong Kong) extruded to its OSM height or an estimate.
Macau, Zhuhai, Zhongshan, Nansha and Huizhou are muted context (main roads, big buildings only).

Shenzhen is now built **to the Hong Kong standard**: about 100 landmarks, like Hong Kong's ~189 (which stay as they are), plus
Dongguan's main landmarks. Famous buildings and structures become hand-made 3D models (**landmarks**); campuses, parks, theme
parks, ports and old towns become **sites**. Your job: make them **faithful to the real thing and sitting exactly on its real
footprint**. This brief adapts `SC/hk/BRIEF.md` (read it too: the format, helpers, budgets and style are the same).

## Read first
- `SC/hk/BRIEF.md` — the Hong Kong brief: model / site format, helpers, bridge rules, style. Everything there applies unless this
  file says otherwise.
- `SC/lm16/LANDMARK_KIT.md` — `LANDMARKS.key = {zh, en, cat, r, h, lt, build(){...}}`, the builder helpers (LBox, LCyl, LLathe,
  LLoft, LPoly, LTris, LBeam, LShape, archFill, pointedArch, hipRoof, gable, onion, LRing, lmSparkle …), colour specs
  `{c, glow, gk, ds, m, lc, lk}`, night modes `lt.m` (0 floodlit, 1 lit windows, 2 LED), budgets, `LMCTX.rng()`.
- `SC/sg/SITES_API.md` — `Object.assign(SITES, {key:{zh, en, lat, lon, r, keep, h, lt, keepRoads, build(ctx)}})`, `ctx.gy(x, z)`,
  `ctx.paint / line / tree / lamp / rng`. Examples: `SC/sgtest_uss/uss.js`, `SC/lm20/nus/nus.js`.
- `SC/lm20/BRIEF_LM.md` — animated night lighting (`lt.anim`: breathe / cycle / sweep / show, `lt.c2`).
- Good examples: towers `SC/lm18/f2/f2.js`, `SC/bay/sfdt/sfdt.js`, `SC/nyc/ny42/ny42.js`; bridges over a real deck
  `SC/bay/ggb/ggb.js`, `SC/bay/baybridge/baybridge.js`, `SC/hk/hkx_nt/hkx_nt.js` (Shenzhen Bay Bridge, Spring Cocoon, SZSE);
  hillside heritage `SC/lm22/heritage/heritage.js`.
- `SC/gbareal/README.md` — the map: frame, regions, data, stages, numbers.
- **Your targets: `SC/gba/targets.json`**, your reference data: **`SC/gba/ref_<group>.json`**.

## World conventions (Greater Bay map)
- **Coordinates.** World metres: x = (lon − 114.0520475)·103014.2 east, y = (lat − 22.6560705)·110734.9 north (= Hong Kong's
  projection shifted by whole tiles: x = x_hk + 7000, y = y_hk − 35000). The three.js position of world (x, y) at height h is
  (x, h, −y). HALF = 63000. **You never need these numbers**: place by lat / lon (`SG_PLACES.push({type:'key', lat, lon, rot})`),
  and work in local metres around your anchor (the ref files are already local). A Hong Kong module placed by lat / lon lands on
  the same spot in both maps.
- `rot`: rotation about +y in radians; local +x points at angle rot counter-clockwise from east (seen from above); local +z is
  "south" before rotation. Derive it from your footprint's long edge in the ref ring.
- **Traffic drives on the right in Shenzhen and Dongguan** (on the left in Hong Kong): matters for toll plazas, ports, station
  forecourts and bridge lane markings you draw.
- **Base height.** Local y = 0 is the **highest** ground within `r` (sampled at 0, 0.35 r, 0.7 r), plus 0.6 m. On slopes (Wutong
  Shan, Lianhuashan, Chiwan, Nantou, the Hakka villages on hill feet, Guanyinshan, Qifeng) build plinths / retaining walls down
  to y ≈ −(slope drop + 3) m; check `hC(x, y)` in situ and the ref `terrain` grid (rows north → south).
- **Terrain.** The DEM (terrarium z12, SRTM-based) covers the whole square. Hong Kong's built-up areas were lowered to bare earth;
  Shenzhen / Dongguan use the same pipeline: reclaimed Futian, Houhai, Qianhai and the airport sit near 0–10 m. Narrow summits read
  low on the 70 m grid (Big Wutong is 943.7 m real). Never assume real absolute altitudes: put things at their real height above
  the *app's* ground.
- **Hiding the real buildings** (as Hong Kong): the app takes your model's vertices in its lower 25 m, makes their 2-D hull grown
  by 3 m and hides every real building whose centroid — or more than half its outline — is inside, plus service roads / paths /
  piers (classes 10–12, 16, 17) whose midpoint is inside. Public roads (≤ 10 at grade) and every bridge / flyover deck stay: don't
  build on them. Sites: every real building with its centroid inside `keep` (or r) is hidden; `keepRoads:[11, 12]` keeps the
  campus / park service roads and paths (recommended for universities, parks, the airport, theme parks).
- **Real buildings around you.** Shenzhen has OSM levels / heights on only ~19 % of its footprints, Dongguan ~3 %; the rest are
  estimated (right class, not the right building). Several famous towers have **no or wrong height in this build** (Diwang 15 m,
  KK100's footprint 13.4 m, the Hanking tower 19.6 m, the Civic Center 15 m): your model replaces them; judge the street walls
  from photos.
- **Randomness**: never `Math.random`; use `LMCTX.rng()` / `ctx.rng()`.

## Bridges
The app draws each bridge's **road deck** from OSM; long sea crossings without a known profile get the generic rule (3 m + 3 % of
the water length, at most 26 m), which is **far too low** for Humen (888 m span, navigation clearance 60 m), the Nansha Bridge
(1 688 m and 1 200 m spans) and the Lingdingyang Bridge (1 666 m span, 270 m towers): the refs show their decks at 4–14 m.
- Model everything except the road surface (towers, cables, hangers, stiffening girders, anchorages, piers, lights) and fit it
  around the decks you measure in situ.
- For these three crossings write a deck-fix script in your folder like `SC/hk/bridges/tm_deck_fix.py` /
  `SC/bay/ggb/ggb_deck_fix.py` that edits `gbareal/out/roads_b4.pkl` → `roads.pkl` **when the integrator runs it** (don't run it on
  gbareal/out yourself; test on a copy, e.g. `python3 your_fix.py --dry` printing the new profile). Give the real clearance and
  deck depth you used and their source; leave out what you cannot verify (Humen's 60 m clearance is verified; the Nansha and
  Lingdingyang clearances are not, say so).
- `hkszbaybridge` (Shenzhen Bay Bridge) already exists (v38, `SC/hk/hkx_nt/hkx_nt.js`, sub-keys `hkszbaybridge_*`) and fits the
  Hong Kong decks.

## Targets and reference data
`SC/gba/targets.json` → `groups.<group>`: 131 targets in 12 groups (Shenzhen 102 = 96 new + 6 that already exist in Hong Kong
modules; Dongguan 29). Each target gives `key` (prefix `sz` / `dg`; the 6 existing keep their `hk…` keys), `zh` (Simplified),
`en`, `kind`, `lat` / `lon` (centroid of the OSM footprint; towers given by their plot are anchored on the tallest building of
this build in it and the plot kept under `plot`), `osm`, `h` (verified overall height or null), `h_osm`, `h_app` (this build),
`r`, `region` (hk / sz / dg / other at the anchor), `notes` (what makes it recognisable, with the verified facts), `hero`
(★), and `existing` for keys already modelled.

`SC/gba/ref_<group>.json` → `targets.<key>`, in local metres around the anchor (+x east, +z south), box = 1.6 r (120–1600 m):
`buildings` (ring, h, floors, names, OSM id, type, area, centroid, `parts` with base / top), `roads` (`cls` 0–1 freeway … 15 rail,
16 people mover, 17 pier, `bridge`, `layer`, `elev` deck heights), `pois`, `terrain`, `ground`. For big sites (box > 800 m) only
what lies within 200 m of the target's own OSM area is listed (`sel: "area+200m"`).

Find anything else by name: `python3 SC/gbareal/targets/find.py '<regex>' ...` (TOP=n, BOX=lon0,lat0,lon1,lat1; first run builds
names.pkl through `bash SC/lm33/kit/heavy.sh`), and `python3 SC/gbareal/targets/inplot.py a:w123 | n:lat,lon,r` lists this build's
buildings inside an area / circle (heavy-ish: ~1.5 GB, use heavy.sh).

**Check every anchor** against the refs and photos, and say which footprint you used. Uncertain anchors (the notes say so):
szgangxia (the oculus inside a station footprint), szhuaqiangbei and szwutong / szchungying / szleftfort / dgshajiao (points),
szseaworld (the Minghua ship is not an OSM footprint), szhanking (unnamed footprint, no height), szhuanggang (new building,
check its state), szpingshantheatre (the named object is the planted area round it), szvanke (area tagged school), dgmuseum
(open or under construction?), dgguanyin (find the statue), dgqifeng (find the summit lantern), szwutongtv (height unknown).

## Your group (★ = hero: a recognisable detailed replica; the others medium detail on their real footprints)
| group | n | area | targets |
|---|---|---|---|
| szcbd | 11 | Futian CBD towers | ★hkpingan [existing: upgrade], hkszse [existing], ★szenergy, szdabaihui, szexcellence, szpresstower, szcmbtower, szneo, ★szupperhills, ★szcec, szgangxia |
| szcivic | 11 | Futian civic axis, the border ports | ★szcivic, ★szlibrary, ★szconcerthall, ★szmocape, szchildpalace, szbookcity, szlianhuashan (site), szcentralpark (site), szfutianport, szhuanggang, szmangrove (site) |
| szluohu | 12 | Luohu and Huaqiangbei | ★hkkingkey [existing: upgrade], ★szdiwang, ★szguomao, szseg, szcitymark, szbaoneng, szgrandtheatre, szstation, szluohuport, szdongmen (site), szhuaqiangbei (site), szmuseumold |
| szhouhai | 12 | Nanshan Houhai and Shenzhen Bay | ★hkcrtower [existing: upgrade], hkszbaysports [existing], hkszbaybridge [existing], ★sztencent, ★szhanking, szonebay, szbayinno, szcmbhq, szhuiyun, sztalentpark (site), szbayport, szszu (site) |
| szshekou | 12 | Shekou, Chiwan, Qianhai, Nantou | ★szseaworld (site with the ship), ★szdesignsociety, szcruise, ★szchiwantinhau, szsongtomb, szleftfort, ★sznantou (site), szqianhaistone (site), szqhconf, szqhshimao, szqhhub (site), szshekouport (site) |
| szoct | 10 | OCT, Xili, University Town | ★szwindow (site), szsplendid (site), szhappyvalley (site), szocth (site), ★szocttower, szhexiangning, szoctloft (site), szsafari (site), szsustech (site), szhitsz (site) |
| szbaoan | 10 | Bao'an, the airport, Shenzhen World, the Shenzhen-Zhongshan Link | ★szt3, szsatellite, szatctower, ★szworld, ★szbaoanstadium, ★szbayglory, szbayeye, ★szszlink (bridge + deck fix), szxiwan (site), szwaterlands (site) |
| sznorth | 12 | Longhua, Guangming, Longgang, Pingshan | ★sznorthstation, szartmuseum, szlibnorth, ★szscimuseum, szguanlan (site), szdafen (site), szgalaxy, ★szuniversiade (site), szcuhksz (site), szhehu, szdawan, szpingshantheatre |
| szeast | 12 | Wutong Shan, Fairy Lake, Yantian, Dameisha, Dapeng | szwutongtv, szwutong (site), ★szhongfa, szxianhu (site), szreservoir (site), szyantian (site), ★szchungying (site), ★szvanke, szdameisha (site), szocteast (site), ★szdapeng (site), szjiaochangwei (site) |
| dgcity | 11 | Dongguan centre: central square, Dongcheng, Guancheng | ★dgcityhall, dgsquare (site), ★dgyulan, dglibrary, dgmuseum, dgexhibition, dgtba, ★dgminying, ★dgkeyuan (site), ★dgyingen, dgqifeng (site) |
| dghumen | 10 | Humen and the Pearl River mouth, Houjie | ★dghumenbridge (bridge + deck fix), ★dgnansha (bridge + deck fix), dgdasha, ★dgopiumwar, ★dgweiyuan, dgseabattle, dgshajiao, dghumenstation, dgexpo, dgyuehui (site) |
| dgsongshan | 8 | Songshan Lake, Dalang, Zhangmutou, Chashan, Shilong, Fenggang | ★dgoxhorn (site), dgdgut (site), dgcsns, dgbasketball, dgguanyin (site), ★dgnanshe (site), dgstation, dgsouthstation |

**Existing keys** (count them, don't duplicate them):
- `hkpingan`, `hkcrtower`, `hkkingkey` — `SC/hk/shenzhen/shenzhen.js` (v37, skyline-level, ~4 kB each). **Upgrade them** to the
  Hong Kong standard in your own module under the same key (same `LANDMARKS.<key>` and one `SG_PLACES` entry; the integrator
  drops the v37 definitions from the Greater Bay build). Keep `zh` / `en`.
- `hkszse`, `hkszbaysports`, `hkszbaybridge` — `SC/hk/hkx_nt/hkx_nt.js` (v38, Hong Kong standard). Don't rebuild them: load that
  module with yours in the in-situ test (`m=` list), check the fit and night look on this map, and report anything wrong.
- The Greater Bay build does not load the Hong Kong modules yet (the integrator decides how they come in): never copy their code.

## Shenzhen at night
Shenzhen's night is as much the point as Hong Kong's. Plan for:
- **Ping An Finance Center**: the lit crown and spire, the corner ribs as continuous light lines (white / cool); the beacon of the
  city seen from Hong Kong.
- **The Futian CBD and Shenzhen Bay light shows**: the towers of Futian's central district (along Shennan Road and the Civic
  Center axis) and of Nanshan Houhai / Shenzhen Bay (China Resources Tower, One Shenzhen Bay, Tencent, the Bay Innovation towers)
  carry full-facade LED skins that play a synchronised evening show. Use `lt.m: 2` and `lt.anim: 'show'` or `'cycle'` with `c2`
  for the real show buildings only, **abstract colour fields, bands and gradients only — no text, slogans, flags, logos or
  pictures** (the real show often spells slogans: leave them out). Ordinary towers: lit windows (`m: 1`), crowns `cycle` at most.
- **China Resources Tower**: the ribs lit at the crown; **KK100**: the crown glow and vertical line lights; **SEG / Diwang**: crown
  and mast lights; aviation red lights on every supertall.
- **Civic Center**: the wing roof floodlit from below, warm; the Library / Concert Hall glass glowing; Lianhuashan's statue lit.
- **Shenzhen Bay**: the Bay Bridge's pylon and deck lights, the Sports Center's shell lit white, Talent Park's ring walkway, the
  bay-side promenade lamps; the Bay Glory wheel's LED rim at OH Bay.
- **Luohu** (Guomao's revolving crown, Dongmen's lanes), **the airport T3** honeycomb glowing from inside, **Shenzhen North**'s
  roof, the **Universiade** crystals lit from within, **Yantian / Shekou** port floodlights and crane lights.
- Heritage (Nantou, Dapeng, Hehu, Hongfa, Chiwan, Keyuan, Nanshe, the Humen forts): warm floodlights and lanterns, `breathe` or none.
- **Dongguan**: Minying T2's crown, the TBA tower, the central-square axis lights, the Humen and Nansha bridges' tower and cable
  lights.

## Style and rules
- **Proportions and recognisability**: real dimensions, storey rhythm, podiums, setbacks, materials and colours; recognisable from
  2–5 km (Shenzhen's skyline from the bay and from Hong Kong!) and convincing at 100–300 m.
- **No logos, brand names, wordmarks or text** anywhere: no company or bank names on towers (Ping An, China Resources, Tencent,
  China Merchants, Huawei, Vanke …), no hotel or mall names, no billboards, no light-show slogans, no airline liveries, no signage
  in theme parks or streets. The theme parks (Window of the World, Splendid China, Happy Valley, OCT East) are **sites only**:
  architecture, landscape and lighting; no characters, mascots or brand imagery. The card names in targets.json stay as given.
- **Only facts you are sure of** (heights, dates, spans); cite your sources in the report; leave out what you cannot verify. The
  `h` values in targets.json are verified (Wikipedia's list of tallest buildings in Shenzhen, CTBUH, the architects' pages); `h_osm`
  and `h_app` are not.
- **Files**: one module per group, **`SC/gba/<group>/<group>.js`** — a single `{ ... }` block (helpers inside), only assigning
  `LANDMARKS.<key>` / `SITES` and pushing `SG_PLACES`. `cat:'new'` for modern, `'old'` for heritage. Work only in
  `SC/gba/<group>/`; don't edit anything else (not this brief, targets, refs, other modules, gbareal/ or the app).
- **Keys**: as in targets.json, unique across the project. **Split structures** (several keys for one bridge or complex): list the
  sub-keys that must stay unlabelled.
- **Budgets**: as Hong Kong (`LANDMARK_KIT.md`; a big bridge ≤ ~350 k triangles); the Greater Bay page is heavy (JS heap
  ~1.8–2 GB), so batch with LTris and keep materials few.

## Testing (required)
**Every browser run goes through `SC/lm33/kit/browser.sh`** (one browser on the whole machine; it waits for the lock). Memory-heavy
offline steps (> 1.5 GB) through `SC/lm33/kit/heavy.sh`. Run long jobs detached and poll their logs; never `pkill -f`, kill by PID.

1. **Model alone** (fast):
   ```
   cd SC/lm16/kit && bash ../../lm33/kit/browser.sh node shoot.js <outdir> ../../gba/<group>/<group>.js <key>
   ```
   Far / close / night panels; prints tris / ms / rmax.
2. **In situ** on the real Greater Bay map (terrain, water, real roads with decks, real buildings, the ones under your model hidden
   exactly like the app). The harness is `SC/gbareal/targets/kit/` (the Hong Kong kit adapted: gbareal/out data, terrain drawn in a
   9 km window round the first `k` key; `&tw=<m>` for a larger window, `&c=lat,lon` to centre elsewhere, `&r=3000` for a larger
   real-city radius):
   ```
   cd SC/gbareal/targets/kit && QS='k=<key>' bash ../../../lm33/kit/browser.sh node shoot.js <outdir> \
     ../../../gba/<group>/<group>.js,../../../sgreal/mod_roads/roads.js,../../../sgreal/mod_bld/bld.js,insitu.js \
     '[["<key>_plan","overlay","<key>"],["<key>_a",lat,lon,400,30,200,0],["<key>_n",lat,lon,400,30,200,1]]'
   ```
   Views `[name, lat, lon, distance m, elevation °, azimuth °, night 0/1]` (azimuth 0 = camera south looking north). `overlay` =
   the 2-D plan: real footprints grey (kept) / red (hidden), your hull blue, your vertices below 4 m green; the green must match the
   red outlines within ~2–3 m and no grey footprint may cut into your model (the log lists hidden / clashing buildings). Several
   keys: `QS='k=a,b'`. To see an existing Hong Kong model with yours, add `../../../hk/hkx_nt/hkx_nt.js` to the module list.
   Smoke test (a plain block on the Guomao footprint): `SC/gbareal/targets/kit/test/` (ready in ~4 s, 0 page errors; one 404, as
   in the Hong Kong kit, presumably favicon.ico). The kit reads the roads from the 8 km road chunks (`gba_rc<k>.bin.gz`, base.roadChunks) when present, else
   `gba_roads.bin.gz`. Its ground is the 30.8 m/px texture (blurry up close; the app draws the cover sharp near the camera).
3. **In the full app** — sites must use this; landmarks once at the end:
   ```
   cd SC && bash gbareal/mkgba.sh <group> <group>      # -> sgreal/site/t_<group>.html with gba/<group>/<group>.js only
   (setsid nohup bash lm33/kit/browser.sh env PAGE=t_<group>.html NEAR=<lat>,<lon>,4000 node lm20/kit/appshot.js gba/<group>/shots/app1 \
     '[["a",lat,lon,1500,35,200,13],["b",lat,lon,500,25,140,16],["n",lat,lon,1500,35,200,20.5]]' > gba/<group>/app1.log 2>&1 &)
   ```
   The page needs ~40 s to show the map and ~65–110 s for the start tiles (software GL): poll the log, then look at every PNG with
   the Read tool. Expected failed requests: the map switch's sibling-page probes and favicon.ico only. Delete `sgreal/site/t_<group>.html`
   when you are done (disk is tight).
4. **Zero page errors.** Compare with photos and iterate.

Note: the Greater Bay engine and its data loading are being changed while you work (gbareal/out, mkengine). If a harness or
mkgba.sh run breaks on a data format, stop and report it rather than patching gbareal/.

Disk is tight (~1 GB free): keep shots small (a few PNGs per key), delete scratch builds, and never copy the map data.

## Report back (short)
Per key: what you modelled; tris, helper calls, ms, rmax / r; the final `SG_PLACES` line (or site anchor / keep); the OSM
footprint you anchored on; the overlay result (fit, clashes); 2–3 screenshot paths; facts used and their sources; anything the
integrator must know (deck fixes, unlabelled sub-keys, existing keys upgraded, keys you could not do and why).
