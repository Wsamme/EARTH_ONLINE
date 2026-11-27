# Round lm50 — New York: the city part of the modeller brief

Read first: `R/lm50/BRIEF.md` (the round), `R/lm40/BRIEF.md` (the model contract: quality bar, budgets, night looks, rules), `R/lmx/BRIEF_V38.md`,
`R/nycreal/README.md` (the New York data and frame). This file only adds what is specific to New York.
`R = /home/claude/earth_online/src`, `SC = /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/`, `K = R/lm50/ny50kit`.

## Targets — 225 keys in 8 groups (`R/lm50/targets_ny.json`)
Every key is a real structure that is **not modelled** on the New York page today: the target footprints were tested against the hulls of
all 418 placed landmarks of the 33 `R/nyc/*` modules (built with the app's own helpers, app hide rule) and the keep polygons of the 5 sites
(JFK, LGA, EWR, Governors Island, Central Park) — none is hidden; partial overlaps are listed in `unc`. ★ = hero (≤ 4 per group),
⚠ = read `unc` first.

| group | area | n | keys |
|---|---|---|---|
| ny50a | Midtown East (east of Fifth Ave, 42nd–60th St, Turtle Bay, Sutton) | 28 | ★ny425park ★nylipstick ★nytrumpworld ★ny383madison nyolympic nytrumptower ny599lex ny345park ny399park ny299park ny245park ny277park nygraybar ny100unplaza nyunplaza⚠ nybeekmantower nysuttontower nyriverhouse nysaks ny712fifth nycrownbldg nyshelton nypershingsq⚠ nybloomingdales nyritztower nyjapansoc ny919third nycitylex |
| ny50b | Midtown West (Times Square, Theater District, Sixth Ave, West 57th, Hell's Kitchen, Columbus Circle) | 28 | ★nyworldwideplaza ★nyparamount ★nygracebldg ★nyamradiator⚠ nycityspire nymettower ny4ts⚠ nybertelsmann⚠ nytstower ny3ts nymcgrawhill⚠ nyparamountplaza nyaxa ny1251 ny1221 ny1211 ny1290 ny1166 nysalesforce nyknickerbocker nyrandomhouse nysky nysilvertowers nymarquis⚠ nyastorplaza⚠ nyvia57 nymanhattanplaza⚠ nymad |
| ny50c | Midtown South (41st St to 23rd St: Herald Sq, NoMad, Murray Hill, Kips Bay, Chelsea, Hudson Yards edge) | 28 | ★nymacys ★nymetlifenorth ★nycopper⚠ ★ny111eighth ny5ts ny11ts nybushtower ny45e22 nyonemadison nyrosehill ny41madison⚠ nyeventi nygilsey nykipsbay⚠ nybellevue nystvartan ny55hy nycunygc ny69regiment nybaruch nymasonic nymaritime ny520w28⚠ nyherald nywaterside⚠ nycorinthian nymorganmail nynyulangone |
| ny50d | Downtown north (Union Square, Village, SoHo, Hudson Square, Tribeca, LES, Chinatown, Two Bridges) | 30 | ★nywesternunion ★nypolicebldg ★nyonemanhattansq ★nyconed⚠ nyclocktower nypuck nysinger nybayardcondict nybobst nyjudson ny51astor nywanamaker nyzeckendorf nyzeroirving nydominick nystjohnsterminal nywestbeth nyconfucius⚠ nychathamtowers⚠ nypompeii nyascension nyfirstpresby nynewschool nyastorlibrary nycriminalcourts nyoldstpatricks nyonefifth nypier40 nyeastriverstation⚠ nybluecondo |
| ny50e | Lower Manhattan (Financial District, Civic Center, Battery Park City) | 29 | ★nyequitable ★nystandardoil ★nyfedreserve ★ny14wall nyoneliberty ny140broadway ny50west ny1nyplaza ny17state ny55water ny60wall ny195broadway nyamsurety nytrinityusrealty ny90west nybarclayvesey⚠ nyjavitsfed nytedweiss⚠ nymoynihancourt ny375pearl nytemplecourt⚠ nypotter nyliberty55 ny23wall ny55wall nydelmonicos nystuyvesanths nywhitehallbldg nydowntownac |
| ny50f | Upper Manhattan (UES, UWS, Morningside, Washington Heights), Roosevelt Island, the Bronx | 27 | ★nycentury ★nycarlyle ★nygwbbus ★nybronxpost ny520park nytrumpintl nywaterline⚠ nyfrickmadison nyislamiccenter nystnicholas nystjeanbaptiste nymountsinai⚠ nyheavenlyrest nybelnord nyapthorp nyjts nyuts nyinterchurch nygreenesci nyriverbank⚠ nymilstein nyoctagon nycornelltech⚠ nyandrewfreedman nyvancortlandt nymertzlib nyfortschuyler |
| ny50g | Brooklyn and Queens | 28 | ★nybkmunicipal ★nyclocktowerdumbo ★nynewtown⚠ ★nyravenswood⚠ nybkpoint nywatchtower⚠ nybkpost⚠ nyempirestores nyeaglewarehouse nytransfiguration nyredhookgrain nyaquarium⚠ nymaimonides nystillwell nyfloydbennett⚠ nysteinhardt nyqueenscourthouse nytower28 nyjacksonpark⚠ nylouisarmstrong nyterracepark nyforesthills nykaufman nysven nygothampoint ny5203center nyaustinnichols nyonesouthfirst |
| ny50h | New Jersey (Jersey City, Hoboken, Weehawken, Newark, Meadowlands, Elizabeth, Paterson) and Staten Island | 27 | ★nyjsq2 ★nyhudsoncourthouse ★nynewarkcityhall ★nymetlifestadium nyjsq1 nyjsq3 nyessexcourthouse nynationalnewark nyprudentialcenter nyeleven80 nyjcityhall nycolgateclock⚠ nynewporttower nyhobokencityhall nyweehawkentower nyamericandream⚠ nynewarkbroad nyunioncourthouse nyjcpowerhouse nyvanvorst nylambertcastle nysiballpark nyrichmondcourthouse⚠ nyrichmondtown nysilight nyconference nyaliceausten |

Row fields: `key zh en kind lat lon r osm h hs note unc hero group nearest_existing`. `lat/lon` = centroid of the anchor footprint(s)
(several ids joined by `+` = one target made of several buildings; `-` = POI-only anchor). `r` = farthest footprint vertex + 4 m.
`h` = verified height (m) or null; **`hs` says exactly what was checked and where** (enwiki infobox / article text read on 27 Nov 2026,
the Wikipedia city lists of tallest buildings); OSM height tags quoted in `hs` are **not verified**. 109 keys have a verified `h`.
`note` is a recognition hint, not a spec: confirm anything you rely on that is not in `hs`.

## Your module
- Folder **`R/nyc/ny50x/ny50x.js`** (x = a…h). The New York build needs no list edit: `sgreal/patch17.py` with `CITY=nyc` globs
  `R/nyc/*/*.js` whose file name equals its folder name, sorted (ny50a…ny50h come after ny42 and before nyair), then adds `EXTRA_MODS`;
  `NYCLM=a,b` limits the R/nyc list (used for fast in-situ pages). Work only in your folder.
- One `{ … }` block: `LANDMARKS.<key> = {zh, en, cat, r, h, lt, build(){…}}` + one `SG_PLACES.push({type:'<key>', lat, lon, rot})` per
  key (sites: `Object.assign(SITES, {...})`). Sub-keys of a split target: `label:false`. Never `Math.random` (use `LMCTX.rng()`).
- Frame (see `nycreal/README.md`): x = (lon + 73.98)·84516, y = (lat − 40.70)·111048; the app puts the group at (x, top, −y) with
  `rotation.y = rot`, `top` = the highest terrain within r + 0.6 m — build foundations down to y ≈ −5 m (more on slopes: refs `ground`).
  Manhattan's grid runs ~29° clockwise of true north: the R/nyc models use local +x = toward the East River along the cross streets,
  −z = uptown, rot ≈ −0.50 (ny42 header). Take your rot from the footprint in the refs.
- The app hides every real building whose centroid lies in your hull (lower 25 m, convex, +3 m) **or more than half of whose outline
  vertices do** (`sgrSkipB`); keep hulls tight and split separated buildings into sub-keys (Waterline Square, Manhattan Plaza,
  Watchtower, Cornell Tech, Ravenswood, American Dream …).
- Brands: Macy's, Saks, Bloomingdale's, MetLife, Prudential, Salesforce, AXA, Trump, Marriott, Colgate … card names stay, but **no
  logos, letters or brand colours on any model**; screens and signs = abstract colour fields. The Colgate Clock face: no lettering.

## Reference data — `R/lm50/ref_<group>.json`
Made with `K/ny50_refs.py` (the NYC refs tool for this round — `nycreal/b9_refs.py` cannot run: the `nycreal/out/*.pkl` pipeline
outputs it reads no longer exist anywhere on the machine). It reads **the app's own staged data** (`R/../site/nycdata/*.bin` via
`K/ny50_appdata.py`: the footprints, heights and building parts the app draws and hides, the road centrelines with the app's deck heights,
the terrain) and **OpenStreetMap via Overpass** (`maps.mail.ru` mirror; overpass-api.de is unreachable from here) for OSM ids, names,
height / level tags, building:part ids, land-use areas and named POIs.
`targets.<key>`: `meta` (the targets row), `anchor`, `radius` = max(1.6 r, r + 60) capped at 700 m, `ground`, `buildings` (app records:
`ring`, `holes`, `h`, `base`, `type`, `osm` + `match` (IoU with the OSM footprint), `name`, `h_osm`, `levels`, `parts` = setback tiers
`{base, top, ring, osm_part}`; `parts_only:true` = a building relation drawn only by its parts, e.g. the Lipstick Building), `roads`
(`cls`, `name`, `zh`, `bridge`, `pts`, `elev` = deck height per vertex), `areas` (OSM land-use polygons clipped to the box: parks, piers,
campuses, plants …), `pois`. Local metres: +x east, +z south. **Data heights of towers are often the podium** (tower tiers are in `parts`;
the plain outline of 383 Madison says 45 m, of 60 Wall 25 m): use the verified `h` and the parts.
Command used: `bash SC/lm33/kit/heavy.sh python3 -u K/ny50_refs.py R/lm50/targets_ny.json R/lm50 [ny50a ny50b …]` (all groups, or the
groups listed). One Overpass query per group (1–2.5 min); when the shared mirror refuses (it did for ny50c–h on 27 Nov), the tool falls
back to the OSM API `map?bbox=` per target box (~5 min per group; partial multipolygons are reduced to their largest piece). ~1 GB RAM.

## Kit — exact commands (each tested once on 27 Nov 2026; results in brackets)
Offline, as often as you like (no browser):
1. **Existing models / sites near a point** (evaluates every R/nyc module, prints distance, module, r / h and the distance to its hull):
   `node K/ny50tool.js near <lat> <lon> [r=600] [your.js]`  [e.g. `near 40.7578 -73.9689 150` → nycitigroupe 60 m (hull 46 m) …;
   the harmless line "(load error … nyair.js: lampTex is not defined)" comes from an airport add-on that needs the live app]
2. **Stats**: `node K/ny50tool.js stat R/nyc/ny50x/ny50x.js <k1,k2,…>` → meshes after the build (≈ draw calls before merge), tris, ms,
   mats, r, rmax, ymin / ymax, h, label, placement  [`stat R/nyc/nymid3/nymid3.js nyseagram,nylever` → 4482 / 2314 tris, 49 / 6 ms]
3. **Shaded preview**: `node K/ny50tool.js dump R/nyc/ny50x/ny50x.js <key> SC/lm50/ny/x.bin && python3 K/ny50render.py SC/lm50/ny/x.bin
   out.png tx ty tz dist elev azim [W H]` (model frame, y up, azim 0 = from +z; delete x.bin after)  [Seagram 400×450 in ~3 s]
4. **Plan overlay vs the real footprints** (app hide rule): `python3 K/ny50oplan.py R/nyc/ny50x/ny50x.js <key> R/lm50/ref_ny50x.json
   <refkey> out.png [half m]` → HIDDEN list (osm id, name, h), CLASHES, centroid offset; PNG north up: grey kept, red hidden, orange
   clash, blue hull, green model below 4 m. Look at every PNG.  [tested on nychanin with a fresh ref: 3 hidden, 0 clashes]
5. **Refs for a corrected anchor** (like lm40 reref.sh): `bash SC/lm33/kit/heavy.sh python3 K/ny50_refs.py --one <key> <lat> <lon>
   <radius> R/nyc/ny50x/ref_<key>.json` (write it into your own folder)  [~20–50 s]
6. Hulls of all existing models (only if the R/nyc modules change): `node K/ny50tool.js hulls K/ny50_hulls_existing.json`;
   regenerate the node harness after an app rebuild: `bash K/mklmbase_ny50.sh` (slices LMCTX…lmMerge + the detail helpers out of
   `R/../site/nyc-app.js`).
Browser — **at most 2 runs per group** (one in-situ batch with all your keys, one full-app or second in-situ), always detached through the
lock, then poll the log:
7. **Test page**: `bash SC/lm33/kit/heavy.sh bash K/ny50page.sh <name> <folders> [extra]` → `SC/lm50/ny/site/t_<name>.html` (+
   `t_<name>-app.js`, ~5 MB; data via a symlink). In-situ = only your module and its neighbours, e.g.
   `bash K/ny50page.sh ny50a ny50a,ny42,nymid3,nymidtown,nymidtown2,nypark`; full app = `bash K/ny50page.sh ny50a_full all`.
   [`ny50page.sh ny50kt ny42`: built in seconds once the heavy lock was free — the wait for the lock was ~7 min on 27 Nov]
8. **Shots**: `(setsid nohup bash SC/lm33/kit/browser.sh env PAGE=t_<name>.html NEAR=<lat>,<lon>,<radius_m> KEYS=<k1,k2>
   node K/ny50shot.js SC/lm50/ny/<you>/shots '[["k_d",lat,lon,450,28,200,12],["k_n",lat,lon,450,28,200,20.5]]' > SC/lm50/ny/<you>/shot.log 2>&1 &)`
   views `[name, lat, lon, dist m, elev °, azim °, hour, "js", waitMs]` (azim 0 = camera south of the target). The log prints `LANDMARKS`
   (placed x / y / rot / top / hull size per key), each view's draw calls / triangles, every failed request, `FAILED-URLS` and `PAGEERR`.
   Pass = PAGEERR 0 and FAILED-URLS only the city-switch probes of sibling pages (`/site/index.html`, `sg.html`, `bay.html`, `hk.html`,
   `tyo.html`, `gba.html` …) and `/favicon.ico`. Then `rm SC/lm50/ny/site/t_<name>*`.  [RESULT_SHOT]
Shots ≤ 1280×800; keep your scratch folder small; kill by PID only.

## Neighbours already modelled (include their folders in your in-situ page)
- ny50a: ny42 (Chanin, Lincoln, Socony, Helmsley, Waldorf, GE Building, Tudor City …), nymid3 (Seagram, Lever, Citigroup, 270 Park, 550
  Madison), nymidtown (Chrysler, Grand Central, MetLife, One Vanderbilt), nymidtown2 (432 Park, St Patrick's, Rockefeller Center, UN),
  nypark (Bloomberg Tower, GM Building, Central Synagogue, St Bart's), nymid4 (Fuller, St Thomas), nyculture (MoMA, Plaza), nyeastriver
  (Queensboro approach).
- ny50b: nymidtown2 (Times Square + screens nytsq1–7, TKTS, Rockefeller Center, Steinway, Central Park Tower), nymid3 (Bank of America
  Tower, NY Times, Hearst), nymid4 (One57, 220 CPS), nyculture (Carnegie Hall, Columbus Circle, MoMA), nymidtown (NYPL), nywest2 (Port
  Authority, Javits).
- ny50c: nywest (Flatiron, Hudson Yards, High Line), nywest2 (MetLife Tower, NY Life, Appellate, Moynihan, One Penn, Manhattan West,
  Spiral), nymidtown (Empire State), nymid4 (Marble Collegiate, Morgan), nysoho (Chelsea Market, Starrett-Lehigh), nyculture (MSG),
  ny42 (Tudor City south).
- ny50d: nycivic2 (Cooper Union, Grace Church, 33 Thomas, courthouses), nylower2 (Police Plaza, Eldridge St, Mahayana), nyeastriver
  (Manhattan / Williamsburg Bridge approaches and the Canal St arch), nysoho (Haughwout), nyboro (Washington Square Arch), nylower (56 Leonard).
- ny50e: nydowntown (WTC, Woolworth, 8 Spruce, 40 Wall, 70 Pine, NYSE), nyfidi (Custom House, Cunard, One Wall, 20 Exchange, 28
  Liberty), nylower (Trinity, St Paul's, Federal Hall, Municipal, City Hall, Brookfield), nylower2, nycivic2, nyharbor (Whitehall).
- ny50f: nywest (Central Park site, Guggenheim), nyculture (Columbus Circle, Lincoln Center), nyuptown (Riverside, Grant's Tomb),
  nyuws, nypark, nyharlem (United Palace), nyouter (Roosevelt Island tram), nybridgesb (Throgs Neck).
- ny50g: nybkqn (Brooklyn Borough Hall, Brooklyn Tower, Domino, Jane's Carousel, One Court Square, Gantry Plaza), nyeastriver (the
  Brooklyn / Manhattan / Williamsburg / Queensboro approaches), nyouter (Coney Island rides), nyboro (Arthur Ashe), nybridges3.
- ny50h: nyouter (Jersey City towers), nyboro (Hoboken Terminal), nyboro2 (Staten Island Borough Hall), nyharbor (St George terminal).
`node K/ny50tool.js near <lat> <lon>` gives the exact list for each key.

## ⚠ Anchors and data quirks (from `unc`; confirm before modelling, report the footprint you used)
- `nyunplaza` (ny50a, osm w261243297+w261243299): two towers (One and Two UN Plaza) as one key; anchor = centroid of both footprints
- `nypershingsq` (ny50a, osm w265947370): the existing Bowery Savings Bank model ny110e42 hull overlaps 145 m2 of this footprint
- `nyamradiator` (ny50b, osm w283346493): OSM footprint named "Bryant Park Hotel" (the building's current use)
- `ny4ts` (ny50b, osm w86121620): the existing hulls of nybofa (172 m2) and nytsq2 (113 m2) overlap this footprint: keep clear of them
- `nybertelsmann` (ny50b, osm w137716320): the existing Times Square screens nytsq4 cover 438 m2 of this footprint (the podium): keep them, model the tower around / above
- `nymcgrawhill` (ny50b, osm w266143357): the existing Port Authority Bus Terminal hull overlaps 132 m2 of this footprint
- `nymarquis` (ny50b, osm w163474780): the existing Times Square screens nytsq5 hull overlaps 81 m2 of this footprint
- `nyastorplaza` (ny50b, osm w157835453): OSM footprint named "One Astor Place" (sic) at 1515 Broadway; partly overlaps the existing Times Square screens hull nytsq3 (83 m2)
- `nymanhattanplaza` (ny50b, osm w159912554+w159912559): two towers a block apart (42nd / 43rd St): use a labelled key + a sub-key (label:false), one hull each
- `nycopper` (ny50c, osm w672158447+w672158446): two towers + sky bridge as one key; anchor = centroid of both footprints
- `ny41madison` (ny50c, osm w160963310): the existing Appellate Courthouse hull overlaps 133 m2 of this footprint
- `nykipsbay` (ny50c, osm w278326016+w278326017): two slabs as one key; anchor = centroid of both footprints
- `ny520w28` (ny50c, osm w315298215): the existing High Line hull nyhighline17 overlaps 46 m2 of this footprint
- `nywaterside` (ny50c, osm w250172272+w250124741+w250124743+w250124748): four towers matched by address (10/20/30/40 Waterside Plaza), unnamed in OSM; anchor = their centroid
- `nyconed` (ny50d, osm w249657690): OSM tags the footprint building=construction (facade restoration); the 1910-1929 building stands
- `nyconfucius` (ny50d, osm w278241635): the existing Manhattan Bridge arch / colonnade hull overlaps 290 m2 of this footprint
- `nychathamtowers` (ny50d, osm w109458133+w109458121): two towers matched by address (170 / 180 Park Row), unnamed in OSM
- `nyeastriverstation` (ny50d, osm w146402114): anchored on the power-plant site polygon (OSM power=plant w146402114); the stacks / halls are separate footprints inside it
- `nybarclayvesey` (ny50e, osm w277890504): OSM footprint named "Verizon Building" (its later name)
- `nytedweiss` (ny50e, osm w278093222): the existing African Burial Ground hull overlaps 87 m2 of this footprint
- `nytemplecourt` (ny50e, osm r3696235): height open: the 209.4 m in the enwiki infobox belongs to the article on the whole 5 Beekman Street property, not the 1883 building
- `nywaterline` (ny50f, osm w783703836+w784943230+w783703834): three separate towers (One, Two, Three Waterline Square) around a park: anchor = their centroid; model them as one labelled key + sub-keys (label:false) so no hull covers the park buildings between them
- `nymountsinai` (ny50f, osm w266941945): OSM footprint is named "Icahn School of Medicine at Mount Sinai" (26 levels, 133.8 m); assumed to be the Annenberg Building - confirm with photos
- `nyriverbank` (ny50f, osm w118524694): park on the roof of the North River plant: a SITE (r 368 m) rather than a single building
- `nycornelltech` (ny50f, osm w700380609+w524729284+w524727870): three separate buildings (Bloomberg Center, The House, Tata Innovation Center): labelled key + sub-keys (label:false), one hull each; the campus has more buildings
- `nynewtown` (ny50g, osm w242620837): the eight digester eggs are NOT mapped as footprints in OSM / the app data; anchor = the whole plant polygon (210 000 m2). Locate the eggs from the refs (storage_tank / chimney objects) and photos before modelling; do not invent positions
- `nyravenswood` (ny50g, osm w351669970+w351669971+w351669972+w351669969+w280642174): anchor on the four chimney footprints (OSM man_made=chimney ways w351669969-72) plus the main hall w280642174; enwiki: three stacks 152 m, one 120 m (OSM tags one at 122 m - which one is the short stack: check photos); the station is large, model the stacks and the hall
- `nywatchtower` (ny50g, osm w245118692+w245118694): two separate buildings ~100 m apart, matched by address (25 and 30 Columbia Heights), unnamed in OSM: labelled key + sub-key (label:false), one hull each; which is which is not checked
- `nybkpost` (ny50g, osm -): POI anchor only (OSM node "Cadman Plaza Post Office"); no building footprint contains it within 25 m: find the post office footprint in the refs
- `nyaquarium` (ny50g, osm w118767087): anchored on the aquarium site polygon (OSM tourism=aquarium w118767087); the Ocean Wonders building is w604729335 inside it
- `nyfloydbennett` (ny50g, osm w285107139): anchored on the building that contains the "Ryan Visitor Center" POI (the 1931 terminal); the hangar row is separate
- `nyjacksonpark` (ny50g, osm w679250139+w679250137+w679250144): three towers as one key (only one is named in OSM)
- `nycolgateclock` (ny50h, osm -): POI anchor only (OSM node man_made=clock); the clock face stands on the waterfront promenade, no footprint
- `nyamericandream` (ny50h, osm w907577618): very large (175 000 m2, r ~517 m) single footprint next to MetLife Stadium; split into a few keys if modelled
- `nyrichmondcourthouse` (ny50h, osm w241853995): OSM names the footprint "Staten Island Supreme Courthouse"; its address 18 Richmond Terrace is the location the enwiki infobox gives for the 1919 Richmond County Courthouse

Also:
- Heroes without a published height (article checked, none given — model from storeys, parts and photos): nymacys, ny111eighth (15 storeys),
  nyfedreserve (14 storeys), nygwbbus (122 × 56 m, 26 roof sections of 20 × 28 m), nybronxpost, nybkmunicipal, nyhudsoncourthouse (6 storeys),
  nynewarkcityhall (5 storeys, gilded dome), nymetlifestadium.
- `ny14wall`, `ny60wall`, `ny383madison`, `ny245park` … : the plain OSM outline height is the podium; the tower is in `parts`.
- Times Square: the existing screens (nytsq1–7, module nymidtown2) hang on the podiums of 1540 Broadway, 4 Times Square, 1501 Broadway,
  One Astor Plaza, the Marquis: keep those keys, build around them (their hulls already hide part of your footprints).
- Riverbank State Park (site) and American Dream (r ≈ 517 m) are large: sites / several sub-keys; the refs radius is capped at 700 m.
- Data source of every position: the OSM footprint in `osm` (Overpass, 27 Nov 2026) = the footprint the app draws (IoU in the refs).
