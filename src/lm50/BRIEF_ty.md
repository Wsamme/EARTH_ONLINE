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
| group | n | area | targets (★ hero, ⚠ uncertain anchor, (b) bridge: the app draws the deck) |
|---|---|---|---|
| ty50a | 29 | Marunouchi, Ōtemachi, Nihonbashi, Yaesu, Kyōbashi | ★tygrannorth, tygransouth, ★tymidyaesu ⚠, ★tymitsuihonkan, ★tymitsukoshi ⚠, tytakashimaya, tytakamitsui, tymeijiseimei, tyichigokan ⚠, tymarupark, tytse, tyotemachitower, tyotemachione, typlacewest, typlaceeast, tyjabldg, tyyomiuri ⚠, tynikkei ⚠, tymarutrust, tysapia, typacific, tynihonbashitower, tymuromachi, tynihonbashimitsui ⚠, tyedogrand, tymuseumtower, tysquaregarden, tytoda, tymizuho |
| ty50b | 28 | Hibiya, Ginza, Shimbashi, Shiodome, Takeshiba, Tsukiji, Kachidoki, Tsukishima, Toyosu | ★tymidhibiya, ★tyimperial, tyimperialtower, ★tyshizuoka, ★tystluke, tynissay, tytakarazuka, tymatsuya, tyginzasix, tyginzaplaza, tymarion, tyoldshimbashi, tymediatower, tyshiodomebldg ⚠, tyshiodomesumi, tyacty, typortcity, tywtcsouth, tytoshiba, tyginzamitsukoshi, typeninsula, tykachiview, tytowersmid, tytowerssea, tycenturypark, tycapitalgate, tytoyosucenter, tybaysidecross |
| ty50c | 30 | Kasumigaseki, Nagatachō, Toranomon, Akasaka, Roppongi, Azabudai, Shiba, Tamachi, Shinagawa | ★tykasumigaseki, ★tymoj, ★tysupremecourt, ★tyokura, tyndl ⚠, tykantei, tykensei, tytrbiz, tytrres, tykamiyacho, tysengokuyama, tyarkmori ⚠, tyizumi, tyroppongigrand, tysanno, tyakasakaair, tykioi ⚠, tynewotani, tybiztower ⚠, typrudential, tyatago, tynec, tymitagarden, tytamachin, tyseason, tyazresa, tyazresb, tyakasakatrust, tytvasahi, tysengakuji ⚠ |
| ty50d | 27 | Nishi-Shinjuku, Shinjuku, Kabukichō, Kagurazaka, Iidabashi, Waseda | ★tykabukicho, ★tysompo, ★tycenterbldg, ★tyokuma ⚠, tynomura, tyiland, tymonolith, tysquaretower, tyoaktower, tyshinjukugrand, tyhilton, tywashington, tymiraina, tytimessq ⚠, tyisetan, tytoho, tytower60, tytomihisa, tynishimitsui, tycityhall, tydaijingu, tyakagi ⚠, tyns, tykddi, tyfronttower, tytsubouchi, tyltower ⚠ |
| ty50e | 26 | Shibuya, Harajuku, Omotesandō, Aoyama, Jingū Gaien, Ebisu, Daikanyama, Meguro | ★tyhikarie ⚠, ★tystream, ★tycerulean, ★tyspiral, tyfukuras, tymarkcity, tymiyashita, tynhkhall, tynhkcenter ⚠, tyshibuyahall, tyshibuyaward, tyomokado, tyomohills, tynezu, tyharajukustn, tytogo, tywestin, tysolasta, tyunu, tychichibunomiya ⚠, tyjingustadium ⚠, tymegurocentral, tygajoen, tysakurastage ⚠, tyhillside, tyaoyamatwin ⚠ |
| ty50f | 28 | Ueno, Hongō, Yushima, Ochanomizu, Akihabara, Kōrakuen, Ikebukuro | ★tybunkakaikan, ★tyyasuda, ★tykahaku, ★tybunkyocivic, tyuenostn ⚠, tyhyokeikan, tytoyokan, tyheiseikan, tysogakudo, tyakamon, tytaiseiden, tyyushima, tysolacity, tyudx, tyakidaibiru, tyliberty, tydomehotel, tytmt, tyhareza, tytoshimachimney ⚠, tyrikkyo, tytoshimaoffice ⚠, tygokokuji, tykonponchudo, tyutlibrary, tyhijiribashi (b), tysunshineprince ⚠, tykyuiwasaki ⚠ |
| ty50g | 27 | Asakusa, the Sumida bridges, Ryōgoku, Fukagawa, Odaiba, Aomi, Ariake, Tatsumi | ★tyasakusaculture, ★tyazumabashi (b), ★tyaquatics, ★tymiraikan, tykomagata (b), tyumaya (b), tykuramaebr (b), tyryogokubr (b), tyshinohashi (b), tytsukudabr (b), tysakurabashi (b), tyhokusai, tyekimise, tydenboin, tyasakusajinja ⚠, tytomioka ⚠, tyfukagawafudo, tymot ⚠, tyaquacity, tydivercity, tyhiltonodaiba, tygrandnikko, tyariakearena, tycoliseum, tygardentheater, tycruise ⚠, tyexchange |
| ty50h | 27 | Yokohama (Kannai, Minato Mirai, Yokohama Station), Kawasaki, Saitama-Shintoshin, Urawa-Misono, Tokorozawa | ★tyqueen, ★tyking, ★tyjack, ★tynipponmaru, tyyokoart, tykanagawamus, tyarchives ⚠, tynewgrand, tysilk, tyyokohall, tyhammerhead ⚠, tyzounohana, tyworldporters, tynissan, tyjryokohama, tyskybldg, tyyokomitsui, tybayquarter ⚠, tymarkis, tyaircabin ⚠, tykitanaka ⚠, tymuza, tysolidsq, tykawasakidaishi, tylandaxis, tysaitamastadium ⚠, tykadokawa ⚠ |

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
5. **Build a test page** into your folder (≈ 3 s; `tyodata` is a symlink to `site/tyodata`, nothing is copied; `K/mktest.py` adds the
   headless test hooks — `window.__t`, build budgets, `?near=` — that appshot needs; a page without them never reports ready):
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
   Poll `app.log`. Pass = **zero PAGEERR** and FAILED-URLS only the expected ones: `/favicon.ico`, the city-switch probes of the sibling pages (`/sg.html`, `/bay.html`, `/gba.html`, `/nyc.html`, `/hk.html`, `/index.html` — 404 + ERR_ABORTED), and `tyodata/models/*` if your build includes `zz_models`. Then
   `rm SC/lm50/ty50x/app/t_<name>.html SC/lm50/ty50x/app/t_<name>-app.js`.
   Smoke test of this brief: PENDING
7. There is **no separate in-situ harness for Tokyo** this round (the v37 `tyoreal/kit` read `tyoreal/out`, which is gone); step 5's
   restricted build + `NEAR` is the in-situ run: real terrain, roads, buildings and the app's own hiding, with your neighbours.

## Neighbours already modelled
Existing landmark hulls / site keep polygons near each group (`gap` = distance from a target's anchor to the hull / keep minus the
target's r, so 0 = the target's circle touches or overlaps it). Include those folders in your in-situ build (the TYOLM line), keep
your plan clear of them, and check them again with `near.js` (step 1) before you place. Close pairs inside groups: tymitsuihonkan /
tynihonbashimitsui (the tower stands right behind the Main Building) and tytakashimaya / tytakamitsui in ty50a; tyworldporters /
tyaircabin in ty50h. tyharajukustn's outline lies 16 % under the Meiji Jingū site keep (tymeijijingu).
```
ty50a — in-situ TYOLM: ty50a,marunouchi,tyx_central,palace
   tygranroof         (landmark hull, marunouchi) gap to tygrannorth 0 m, tygransouth 1 m, tymidyaesu 38 m, typacific 94 m
   tykokyogaien       (site keep, palace) gap to tymeijiseimei 2 m, tymizuho 47 m
   tyboj              (landmark hull, tyx_central) gap to tymitsuihonkan 12 m, tymuromachi 22 m, tymitsukoshi 33 m, tynihonbashimitsui 36 m
   tyforum            (landmark hull, tyx_central) gap to tyichigokan 23 m, tymarupark 79 m
   tyshinmaru         (landmark hull, marunouchi) gap to tymizuho 33 m
   tyjptower          (landmark hull, marunouchi) gap to tymarupark 50 m, tyichigokan 97 m
   tynihonbashi       (landmark hull, marunouchi) gap to tymitsukoshi 96 m
   tytokiwabashi      (landmark hull, marunouchi) gap to tysapia 116 m
ty50b — in-situ TYOLM: ty50b,ginza,tyx_central,palace
   tywako             (landmark hull, ginza) gap to tyginzamitsukoshi 5 m, tymatsuya 76 m
   tyshiodomecc       (landmark hull, ginza) gap to tyoldshimbashi 5 m
   tyntv              (landmark hull, ginza) gap to tymediatower 32 m, tyshiodomebldg 92 m
   tyhamarikyu        (site keep, tyx_central) gap to tyshiodomebldg 47 m, tyacty 89 m, tyshiodomesumi 92 m
   tydentsu           (landmark hull, ginza) gap to tyshiodomebldg 55 m
   tykokyogaien       (site keep, palace) gap to typeninsula 81 m
ty50c — in-situ TYOLM: ty50c,minato,palace,tyx_central
   tytoranomon        (landmark hull, minato) gap to tytrbiz 12 m, tytrres 16 m
   tyazabudai_b       (landmark hull, minato, unlabelled) gap to tyazresa 34 m
   tyroppongimori     (landmark hull, minato) gap to tytvasahi 43 m
   tyhie              (landmark hull, tyx_central) gap to typrudential 59 m, tysanno 66 m
   tyazabudai         (landmark hull, minato) gap to tyazresa 64 m
   tykokyogaien       (site keep, palace) gap to tymoj 81 m
   tytoranomonst      (landmark hull, minato) gap to tytrres 103 m
   tydiet             (landmark hull, palace) gap to tyndl 110 m
ty50d — in-situ TYOLM: ty50d,shinjuku,tyx_west
   tycocoon           (landmark hull, shinjuku) gap to tyltower 6 m, tycenterbldg 67 m, tysompo 71 m
   tytmg2             (landmark hull, shinjuku) gap to tyns 37 m, tywashington 57 m
   tykeioplaza        (landmark hull, tyx_west) gap to tymonolith 39 m, tyns 82 m, tycenterbldg 100 m, tykddi 117 m
   tymitsui           (landmark hull, tyx_west) gap to tycenterbldg 65 m, tyiland 68 m, tynomura 103 m
   tysumitomo         (landmark hull, shinjuku) gap to tyhilton 97 m, tyiland 112 m
   tygyoen            (site keep, tyx_west) gap to tytimessq 108 m
   tytmg1             (landmark hull, shinjuku) gap to tyns 109 m
ty50e — in-situ TYOLM: ty50e,tyx_west,shibuya
   tymeijijingu       (site keep, tyx_west) gap to tyharajukustn 0 m
   tyscramble         (landmark hull, shibuya) gap to tyhikarie 6 m, tystream 50 m, tysakurastage 115 m
   tyyebisuchateau    (landmark hull, tyx_west) gap to tywestin 11 m
   tycrossing         (site keep, tyx_west) gap to tymarkcity 35 m, tymiyashita 88 m, tyfukuras 99 m
   tyyoyogi2          (landmark hull, shibuya) gap to tynhkhall 35 m, tynhkcenter 53 m
   tyyebisu           (landmark hull, tyx_west) gap to tywestin 54 m
ty50f — in-situ TYOLM: ty50f,ueno,tyx_north,tyx_central
   tywesternart       (landmark hull, tyx_north) gap to tyuenostn 0 m, tykahaku 2 m, tybunkakaikan 19 m
   tyuenopark         (site keep, ueno) gap to tybunkakaikan 0 m, tykahaku 0 m, tyuenostn 0 m, tyhyokeikan 0 m
   tytnm              (landmark hull, ueno) gap to tytoyokan 0 m, tyheiseikan 0 m, tyhyokeikan 1 m
   tydomecity         (site keep, ueno) gap to tydomehotel 13 m
   tysunshine60       (landmark hull, tyx_north) gap to tysunshineprince 35 m
   tynikolai          (landmark hull, tyx_central) gap to tysolacity 55 m, tyhijiribashi 118 m
   tyakiba            (site keep, ueno) gap to tyakidaibiru 81 m
   tytokyodome        (landmark hull, ueno) gap to tydomehotel 83 m
   tykandamyojin      (landmark hull, tyx_central) gap to tytaiseiden 91 m
ty50g — in-situ TYOLM: ty50g,asakusa,bay
   tyfujitv           (landmark hull, bay) gap to tyaquacity 0 m, tydivercity 39 m, tygrandnikko 65 m, tyhiltonodaiba 100 m
   typagoda           (landmark hull, asakusa) gap to tydenboin 18 m
   tykaminarimon      (landmark hull, asakusa) gap to tyasakusaculture 21 m, tyekimise 107 m
   tysensoji          (landmark hull, asakusa) gap to tyasakusajinja 29 m
   tyasahihall        (landmark hull, asakusa) gap to tyazumabashi 31 m
   tynakamise         (site keep, asakusa) gap to tyasakusaculture 44 m, tydenboin 55 m, tyekimise 81 m
   tyasahitower       (landmark hull, asakusa) gap to tyazumabashi 51 m
   tyhozomon          (landmark hull, asakusa) gap to tydenboin 65 m, tyasakusajinja 112 m
   tyhozomon_b        (landmark hull, asakusa, unlabelled) gap to tyasakusajinja 74 m, tydenboin 85 m
ty50h — in-situ TYOLM: ty50h,yokohama,airport
   tylandmark         (landmark hull, yokohama) gap to tynipponmaru 22 m
   tysaitamaarena     (landmark hull, airport) gap to tylandaxis 66 m
   tymarinetower      (landmark hull, yokohama) gap to tynewgrand 71 m
   tyqueens_b         (landmark hull, yokohama, unlabelled) gap to tymarkis 73 m
   tycosmoclock       (landmark hull, yokohama) gap to tyworldporters 92 m
   tyqueens           (landmark hull, yokohama) gap to tymarkis 101 m
```

## Data notes
- The app's map data is the v37 build (OSM Kantō extract of Oct 2026, staged in `site/tyodata`); current OSM (Nov 2026) is newer.
  Buildings completed or re-mapped since then may be missing or drawn as other outlines (see `unc`).
- Tokyo OSM maps many towers as building:part sets; where a part starts at the ground the app drops the outline and draws the parts.
- `R/tyo/zz_models` swaps a few existing landmarks for downloaded glTF models (they load from `tyodata/models/`, which is not in
  `site/tyodata` on this machine — requests for it fail harmlessly and the hand-built version stays).
- Uncertain anchors (⚠; the reason is in each row's `unc`): ty50a: tymidyaesu, tymitsukoshi, tyichigokan, tyyomiuri, tynikkei, tynihonbashimitsui; ty50b: tyshiodomebldg; ty50c: tyndl, tyarkmori, tykioi, tybiztower, tysengakuji; ty50d: tyokuma, tytimessq, tyakagi, tyltower; ty50e: tyhikarie, tynhkcenter, tychichibunomiya, tyjingustadium, tysakurastage, tyaoyamatwin; ty50f: tyuenostn, tytoshimachimney, tytoshimaoffice, tysunshineprince, tykyuiwasaki; ty50g: tyasakusajinja, tytomioka, tymot, tycruise; ty50h: tyarchives, tyhammerhead, tybayquarter, tyaircabin, tykitanaka, tysaitamastadium, tykadokawa (38 keys).
