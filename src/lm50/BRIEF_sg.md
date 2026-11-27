# City Brush round lm50 — Singapore: modeller brief (city part)

`R = /home/claude/earth_online/src` (repo, canonical), `SC = /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/`. Read `R/lm50/BRIEF.md` (round contract) and `R/lm40/BRIEF.md` (model contract, quality bar, budgets, rules) first; this file replaces only the Singapore paths, targets and kit. Written 27 Nov 2026 by the Phase-1 Singapore target author.

## What exists today (evaluated, not grepped)

The production build (`R/../site/app.js`, rebuilt from `R` with `patch17.py`) evaluated in the browser by `R/lm50/kit_sg/exist50.js`: **198 labelled placed landmarks + 19 sites** (232 placed types incl. unlabelled sub-keys; 306 LANDMARKS defs incl. the world set). Dump: `SC/lm50/sg/exist_sg.json` (key, zh, en, r, h, label, lat, lon per placement; sites with r). The same set comes out of `near50.js` evaluating the patch17 MODS files in node (identical key list).

## Targets

- `R/lm50/targets_sg.json` — **214 rows** in 8 groups (`key, zh, en, kind, lat, lon, r, osm, h, hs, note, unc, hero, group`). Every key is a real structure that is not modelled yet: each anchor was checked against every placement and site of the built page (distance to the nearest existing key, inside-site test) and against the named footprints of OSM. `lat/lon` = centroid of the OSM footprint the anchor sits on (bridges / stadiums: the Nominatim point of the man_made=bridge or leisure=stadium area). `r` = farthest footprint vertex from that centroid + 5 m (min 15).

- **`h` is verified only where `hs` cites a source** (40 rows: Wikipedia *List of tallest buildings in Singapore* read on 27 Nov 2026, the Hong Leong Building article, skyscrapercenter for Solaris). Every other `h` is null: OSM levels / heights and the app heights quoted in `hs` are **data, not verification**. `note` is a recognition hint; check anything in it that `hs` does not cite before you model it, and do not put unverified facts on cards.

- `unc` is set on 72 rows (anchor or data doubt: unnamed footprint, nearest-match pick, app heights far below the real tower, new buildings, campus / complex anchors). Confirm those first (refs + photos); if the anchor is wrong make a corrected ref with the REREF command below and report the OSM id you used.

- Lines (`osm: "line"`): sgrobertsonbr, sgsaigonbr, sgclemenceaubr, sgkimsengbr, sgmerdekabr — the app draws the real road / path deck (`roads[].br`, `elev`); model piers, girders, parapets, lamps (Merdeka: its lion sculptures — verify form and position from photos) around it, per the lm40 bridge rules.

## Groups (★ hero, ⚠ uncertain anchor — see `unc`)

| group | area | n | targets | modelled neighbours (within r + 300 m) |
|---|---|---|---|---|
| sg50a | CBD — Raffles Place, Battery Road, Collyer Quay, Robinson Road, Cecil Street, north Shenton Way | 24 | sgmaybank, ★sgboc⚠, sgstraitstrading⚠, sg30raffles, sg16collyer⚠, sgntuc, sgsamsunghub⚠, sgrobinson77, sg18robinson⚠, sgcapitasky⚠, sgoxley⚠, ★sgsgx, ★sgoue, ★sgvshenton, sgoneshenton, sgsbf, sgclift, sghongleong⚠, sgonegeorge, sgioi, sgaia⚠, sgrobinsonpoint⚠, sgprudential⚠, sgthearcade⚠ | acm, anderson, asiasquare, capitaspring, cavenagh, cliffordpier, fullerton, guoco, lauPaSat, marinaone, mbfc, merlion, ocbc, oneraffles, parkroyal, republic, sgalabrar, sgboatquay, sgcapitagreen, sgcapitaltower, sgconfhall, sgesplbr, sgfraserstower, sgfuktakchi, sgintlplaza, sgjubilee, sgmaxwell, sgnagore, sgofc, sgorq, sgsiangcho, sgsixbattery, sgsltower, sgtelokayer, sgura, sgyingfo, sgyuehhai, thesail, thianhockkeng, uob, victoria |
| sg50b | Tanjong Pagar (Anson Road, south Shenton Way), Chinatown, Outram (SGH campus), Tiong Bahru | 24 | ★sgaltez, sgmasbldg⚠, sgspringleaf, sg76shenton, sglippo, sgkeppelsouth⚠, sgtwentyanson⚠, ★sgstatecourts⚠, sgonepearlbank⚠, sgyuehwa, ★sgcolmed⚠, sgsghacademia⚠, sgnhcs, sgnccs⚠, sgchinatownpoint, sghonglim, sgppcentre, sgmaxwellch, sgmnd⚠, sgkretaayer, sgtbmarket⚠, sgtbplaza, ★sgstteresa, sgqitiangong⚠ | buddhatooth, dukenus, guoco, mariamman, ocbc, parkroyal, peoplespark, pinnacle, sgalabrar, sgcapitaltower, sgchinatowncx, sgconfhall, sgfraserstower, sgfuktakchi, sgintlplaza, sgjamae, sgjinrikisha, sglayan, sgmajestic, sgmaxwell, sgnagore, sgoasia, sgsiangcho, sgtelokayer, sgura, sgyingfo, thianhockkeng |
| sg50c | Civic & Bras Basah, Bugis, Beach Road, Kampong Glam, Marina Centre, the upper river quays | 27 | ★sgguocomidtown, sgbugisjunction, sgintercon, ★sgndc, sgfunan, sgpeninsula, ★sgsspp⚠, sglourdes⚠, sgtextile, sgriversidepoint, sgrobertsonbr⚠, sgsaigonbr⚠, sgclemenceaubr⚠, ★sgpanpacific⚠, sgmandarinoriental, sgmarinamandarin, sgmarinasquare⚠, sgcentennial, sgritzcarlton⚠, sgprinsep, sgwesley, sgparkroyalbeach, sggoldenlandmark, sghotelgp, sgaliwal, sgchildrensmuseum, sgrafflesh | armenian, artshouse, capitol, chijmes, duo, esplanade, firestation, float, goodshepherd, helix, hillstreet, malayheritage, mhfatimah, natgallery, natlibrary, natmuseum, parkview, parliament, peranakan, rafflescity, raffleshotel, sam, sgabdulgafoor, sgalkaff, sgcathay, sgcenotaph, sgclarkequay, sgcoleman, sgconcourse, sgcricket, sgelgin, sgesplbr, sgfortcanning, sggateway, sgjiakkim, sgjubilee, sgkwanim, sglasalle, sgmacdonald, sgmaghain, sgmalabar, sgmillenia, sgnafa, sgordbr, sgorpc, sgsota, sgsrc, sgstjoseph, sgtankimseng, sguesquare, sgwarmem, site gardens, site sgsmu, southbeach, standrews, sultanmosque, suntec, supremecourt, victoria |
| sg50d | Rochor, Little India, Farrer Park, Jalan Besar, Kallang, Geylang, Novena, Balestier, Toa Payoh | 26 | sgsimlim, sgsimlimtower, sgcitysquare, ★sgjbstadium⚠, ★sgcentralsikh, sgkgkapor, sgfoochow, sgangullia, sgvadapathira, sglittleindiaarcade⚠, sgica, ★sgkallangtheatre, ★sgmerdekabr⚠, sgttsh⚠, sgnovenasq, sgunitedsq, sgmenovena, sgrevenue, sghdbhub, sgkwongwaishiu⚠, sgconnexion⚠, sgbalestierpt, sgshawplaza, sgsquare2, sgsrisivan⚠, sgmasjidkhalid | goldenmile, indoorstadium, sgabdulgafoor, sgihc, sgkwanim, sglasalle, sgleongsan, sgmalabar, sgmustafa, sgnovena, sgsakyamuni, sgtantengniah, sgtekka, sgveeramakali, sportshub, srinivasa |
| sg50e | Orchard Road, Scotts Road, Tanglin, Newton, River Valley, inner Bukit Timah | 29 | sgplazasing, sgorchardcentral, sgorchardgateway, sgcentrepoint, sgorchardtowers⚠, sgfareastplaza, sgliat⚠, sgtanglinmall, sggrandhyatt, sgfourseasons, sgscottssquare, ★sgscottstower⚠, ★sgnouvel18⚠, sgsculptura, sgnewtonsuites⚠, sgmtelizabeth⚠, sggleneagles, ★sgchettiar, sgsacredheart, sgheeren, sgorchardparade, sgplazaparkroyal, ★sgpanpacorchard, sgshangrila⚠, sgkimsengbr⚠, sghongsansee, sggreatworld, sgcommandhouse, sgbaalwie | goodwood, ionorchard, ngeeann, sg313somerset, sgcathay, sgchesedel, sgemeraldhill, sghiltonorchard, sgjiakkim, sgluckyplaza, sgmacdonald, sgorpc, sgparagon, sgshawhouse, sgsota, sgtanyeoknee, sguesquare, sgwismaatria, site sgsmu, tangplaza |
| sg50f | South-west & West — Alexandra, Telok Blangah, Pasir Panjang, one-north, Buona Vista, Holland, Clementi, Jurong | 28 | ★sgmtower, ★sgalexhosp⚠, sgcwtowers⚠, sgalkaffmansion, sglabradortower⚠, sgsriruthra, sgartra⚠, sgechelon⚠, sgabcmarket, ★sgsolaris, ★sgsandcrawler⚠, sgmetropolis⚠, sgonehollandv⚠, sgjem, sgwestgate, sgntfgh, sgclementimall, sgsdc, sggalaxis, sgnucleos, sgvisionexchange, sgimm, sgjurongpoint, sgbeautyworld, sgrochester⚠, sgcpfjurong, sgjurongeastst, sgsafrajurong | sgbiopolis, sgfusionopolis, sgjurongtownhall, sgmbc, sgmediacorp, sgstarvista, site nus |
| sg50g | North & Central — Bishan, Ang Mo Kio, Thomson, Woodlands, Sembawang, Yishun, Seletar, Choa Chu Kang, Bukit Panjang | 27 | ★sgskyhabitat⚠, sgjunction8, sgamkhub, ★sgwoodlandsckpt⚠, sgcausewaypt, sgwoodlandscivic, sgwhc⚠, sgrp⚠, sgadmiralty⚠, ★sgassyafaah, sgktph⚠, sgnorthpoint, ★sgseletarterm, sgitecentral, sgitewest⚠, sgnyp⚠, sgbishanstadium⚠, sgthomsonplaza, sglotone, sghillion, sgsunplaza, sgbpplaza, sgbeaulieu, sgannur, sgycks⚠, sgwoodlandsstadium⚠, sgcanberraplaza | — |
| sg50h | East & North-East — Paya Lebar, Katong, Joo Chiat, Bedok, Tampines, Changi, Loyang, Punggol, Sengkang, Serangoon | 29 | ★sgsingpost, sgparkway, sgi12katong, ★sgholyfamily, sgtampinesmall, sgcenturysq, sgtampines1, sgcgh⚠, ★sgloyangtpk, sgchangiprison⚠, sgchangicitypt, sgwaterwaypt, sgskgh, sgcompassone, sgnex, ★sgwismags, sgkatongac⚠, sgchineseswim⚠, sgbedokmall, sgtampinesrm, sgjoochiatcx, sgkuanimtng, sgmasjidkassim, sghougangmall, sgpunggolrsc, sgplsquare, sgsitpunggol⚠, sgeastpoint⚠, sgseletarmall | sggeylangserai, sgkoonseng, sgplq, sgredhouse, sgsenpaga, site sgsutd |

Module folder per group: **`R/lm50/<group>/<group>.js`** (e.g. `R/lm50/sg50a/sg50a.js`), one `{ … }` block that only assigns `LANDMARKS.<key>` and pushes `SG_PLACES` (no sites in this round's list). The coordinator adds the files to `R/sgreal/patch17.py` MODS (after `lm40/sg40h/sg40h.js`); `near50.js` already picks up every `R/lm50/sg50[a-h]/sg50*.js`. Work only in your group folder (scripts, shots, logs there or in `SC/lm50/<group>/`).

### Uncertain anchors (from `unc`)

- `sgboc` (sg50a, w106193390): app data has several parts under OSM w106193390 "BOC": tell the 2000 tower from the older block before modelling
- `sgstraitstrading` (sg50a, w171999283): OSM calls the footprint "MYP Centre"; the app top here is only 77 m against 157 m listed — confirm the tower outline
- `sg16collyer` (sg50a, w407926393): app top 105 m against 179 m listed
- `sgsamsunghub` (sg50a, w146335667): OSM footprint w146335667 is named "Samsung"
- `sg18robinson` (sg50a, w424896147): app top only 68 m against 180 m listed
- `sgcapitasky` (sg50a, w45098519): unnamed OSM w45098519 found by the address 79 Robinson Road only; app top 96 m against 185 m listed — confirm footprint
- `sgoxley` (sg50a, w172270395): app top 92 m against 174 m listed
- `sghongleong` (sg50a, w47345013): the list calls it "Hong Leong Finance Building"
- `sgaia` (sg50a, w47345003): height not verified
- `sgrobinsonpoint` (sg50a, w47345018): height not verified; OSM 21 levels
- `sgprudential` (sg50a, w171999306): height not verified; OSM 30 levels
- `sgthearcade` (sg50a, w171999284): height not verified
- `sgmasbldg` (sg50b, w43755573): height not verified
- `sgkeppelsouth` (sg50b, w1228196509): new building: app top 110 m against 207 m listed — check the outline in refs
- `sgtwentyanson` (sg50b, w172269374): height not verified; OSM 20 levels
- `sgstatecourts` (sg50b, w44414588): OSM w44414588 "State Courts"; the app parts top out at 24 m here — the towers may be missing or low in the data: check refs before placing
- `sgonepearlbank` (sg50b, r15649684): anchor on the unnamed OSM relation under the Nominatim point; app top 129 m against 178 m listed
- `sgcolmed` (sg50b, w172092367): OSM footprint w172092367 has no name tag
- `sgsghacademia` (sg50b, w172268002): height not verified
- `sgnccs` (sg50b, w47415661): the campus may hold an older and a newer NCCS building: confirm which footprint is current
- `sgmnd` (sg50b, w117058629): OSM footprint matched is "MND Building (Annexe B)" — the main block may be a neighbour in refs
- `sgtbmarket` (sg50b, r21297472): OSM relation r21297472 has no matching footprint in the app data (the model stands on open ground there)
- `sgqitiangong` (sg50b, w172241932): unnamed OSM footprint under the POI
- `sgsspp` (sg50c, w155986468): inside the radius of the sgsmu site but not part of SMU: check the site keep polygon
- `sglourdes` (sg50c, w191010560): unnamed OSM footprint 8 m from the church POI; OSM footprint picked as the nearest to the point (nearest 8m)
- `sgrobertsonbr` (sg50c, line): line anchor: OSM man_made=bridge w475629843 (Nominatim point); the deck is the app's path line
- `sgsaigonbr` (sg50c, line): line anchor: OSM bridge w464779142 (Nominatim point)
- `sgclemenceaubr` (sg50c, line): line anchor: OSM man_made=bridge w475629841 (Nominatim point)
- `sgpanpacific` (sg50c, w155987124): unnamed OSM footprint w155987124 under the manual point — confirm by shape
- `sgmarinasquare` (sg50c, w303311927): many app pieces: model the podium only, keep clear of the hotel keys
- `sgritzcarlton` (sg50c, w46594815): OSM footprint w46594815 (contains the point) is tagged 3 levels / 16 m: the hotel block may be another part in refs
- `sgjbstadium` (sg50d, w420392222): anchor on the OSM leisure=stadium w420392222; the grandstand footprint (unnamed) is 30 m away — take it from refs
- `sglittleindiaarcade` (sg50d, w176326909): unnamed OSM footprint under the POI
- `sgmerdekabr` (sg50d, line): line anchor: OSM man_made=bridge r18007978 (Nominatim point); the app draws the road deck
- `sgttsh` (sg50d, r2303411): large campus: pick the main ward blocks from refs
- `sgkwongwaishiu` (sg50d, w735013998): unnamed single-storey OSM footprint 14 m from the bus-stop point: confirm the main block; OSM footprint picked as the nearest to the point (nearest 14m)
- `sgconnexion` (sg50d, w454195160): OSM footprint matched is "Farrer Park Suites"
- `sgsrisivan` (sg50d, w683687914): unnamed OSM footprint containing the point
- `sgorchardtowers` (sg50e, w41890235): app top only 19.5 m: check the tower footprint in refs
- `sgliat` (sg50e, w539668158): app top 11 m: check the tower footprint in refs
- `sgscottstower` (sg50e, w503693694): OSM names it "The Scotts Tower" (w503693694)
- `sgnouvel18` (sg50e, w451897529): anchor on the unnamed OSM footprint containing the point; the pair is in refs
- `sgnewtonsuites` (sg50e, w453498468): height from OSM only
- `sgmtelizabeth` (sg50e, w172520759): unnamed OSM footprint containing the hospital point
- `sgshangrila` (sg50e, w41890532): unnamed OSM footprint containing the point: confirm the Tower Wing
- `sgkimsengbr` (sg50e, line): line anchor: OSM man_made=bridge w1157216274 (Nominatim point)
- `sgalexhosp` (sg50f, w109100986): OSM nearest footprint is "Block 26A": confirm the main block in refs; OSM footprint picked as the nearest to the point (nearest 3m)
- `sgcwtowers` (sg50f, w655200036): anchor on the unnamed OSM footprint nearest the Nominatim point; OSM footprint picked as the nearest to the point (nearest 5m)
- `sglabradortower` (sg50f, w1180610989): new building: app top 53 m against 183 m listed
- `sgartra` (sg50f, w1114929421): unnamed OSM footprint containing the point
- `sgechelon` (sg50f, w595428348): unnamed OSM footprint containing the point
- `sgsandcrawler` (sg50f, w244269474): OSM names the footprint "Eclipse" (w244269474, 1 Fusionopolis View); confirm the current name
- `sgmetropolis` (sg50f, w1563020891): OSM footprint matched is "The Metropolis Tower 2": the other tower is a neighbour in refs
- `sgonehollandv` (sg50f, w1226724186): new building: app top 18 m against 154 m listed — check refs
- `sgrochester` (sg50f, w167472305): OSM footprint matched is "Rochester Mall"
- `sgskyhabitat` (sg50g, w672730543): anchor on the unnamed OSM footprint containing the point (OSM 38 levels, 133 m)
- `sgwoodlandsckpt` (sg50g, w450538616): OSM footprint matched is "Woodlands Checkpoint (Block B)"; the complex has many parts in refs
- `sgwhc` (sg50g, w1174515661): OSM footprint matched is "Woodlands Health Medical Centre"
- `sgrp` (sg50g, w178582369): campus: anchor on one block ("E3"); pick the central buildings from refs
- `sgadmiralty` (sg50g, w1165110262): Nominatim returns OSM w1165110262 "Canberra House" for this name: confirm it is the house
- `sgktph` (sg50g, r5205652): unnamed OSM relation containing the point
- `sgitewest` (sg50g, r15741385): unnamed OSM relation containing the point
- `sgnyp` (sg50g, r2665148): anchor on "Block A"
- `sgbishanstadium` (sg50g, w117055161): anchor on the OSM leisure=stadium w117055161; stand footprints from refs
- `sgycks` (sg50g, w37396157): anchor on the OSM leisure=stadium w37396157
- `sgwoodlandsstadium` (sg50g, r2326491): anchor on the OSM leisure=stadium r2326491
- `sgcgh` (sg50h, w320764872): unnamed OSM footprint containing the point
- `sgchangiprison` (sg50h, w425935904): OSM footprint matched is "Cluster B"; the historic gate and wall are separate small structures; OSM footprint picked as the nearest to the point (nearest 8m)
- `sgkatongac` (sg50h, w561551904): unnamed OSM footprint containing the point
- `sgchineseswim` (sg50h, w334113473): unnamed OSM footprint 2 m from the club area; OSM footprint picked as the nearest to the point (nearest 2m)
- `sgsitpunggol` (sg50h, w1283901251): unnamed OSM footprint containing the point; campus has many blocks
- `sgeastpoint` (sg50h, w46821373): OSM footprint matched is "East Point" (nearest, 4 m); OSM footprint picked as the nearest to the point (nearest 4m)

## Reference data — `R/lm50/ref_<group>.json`
Same format as `R/lm40/ref_sg40*.json` (`targets.<key>`: `meta` = the targets row, `anchor`, `radius` = max(1.6 r, r + 60) capped at 700 m, `buildings`
with `ring` / `h` / `floors` / `est` / `type` / `name` / `osm` / `parts` (base / top / ring), `roads` with `br` + per-vertex `elev`, `areas`, `pois`; local metres,
+x east, +z south). Made with **`R/lm50/s50_refs_sg.py`**, a rebuild of `lm40/s40_refs.py`: the lm40 inputs (`SC/sgdata/base15.pkl`, `SC/sgreal/out/*.pkl`,
`SC/lm40/kit/osm_of.pkl`) no longer exist, so it decodes the **production** files the app streams (`/home/claude/earth_online/site/sgdata/sg_bld.bin`,
`sg_roads.bin`, `sg_base.bin` — exactly what the app draws and hides) and takes OSM ids / names / levels / heights / land-use areas / named POIs from the
OSM API (`api.openstreetmap.org/api/0.6/map`, one box per target, cached gzip in `SC/lm50/sg/osm/`). Differences to lm40 you must know:
- `osm` is the OSM way / relation whose footprint overlaps the app footprint best (IoU >= 0.5), else `-`. `osm_h` = OSM `height` tag, `base` = app base height.
- The app stores a building with OSM parts **only as its parts**; the refs group them back under one entry (outline = the matching OSM outline, else the
  hull of the parts), `parts[].osm` = the matching `building:part`.
- `h` is the app height (OSM height / levels or an estimate) — for many towers it is far too low or the building is new (see `unc`); use `meta.h`.
- `areas` only include polygons with at least one node inside the box (big parks crossing the whole box can be missing); `pois` = named OSM nodes (80 nearest).
- `roads[].name` from the app's name table; no `kd` (OSM highway kind) any more, only `cls`.
Command used for all eight groups (run from SC, ~1 min per group once the OSM boxes are cached):
```
cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad && bash lm33/kit/heavy.sh python3 /home/claude/earth_online/src/lm50/s50_refs_sg.py [sg50a ...]
```

## Kit — every command below was run once for this brief (27 Nov 2026, with a throw-away one-block test module, since deleted)
Most of the lm22–lm40 kit is gone from both SC and R (`SC/sgreal/kit/lmbase.js`, `insitu.html`, `shoot.js`, `lm22/marina/nstat.js`, `ndump.js`, `nrender.py`,
`lm26/kit/oplan.js` + `oplan.py`, `lm20/kit/mkapp.sh`, `sgreal/mktest.py`'s page flow, the sgreal/out pickles), and the Chromium the old scripts hard-code
(`/opt/pw-browsers/chromium-1194`) is now `chromium-1243`. The replacements live in **`R/lm50/kit_sg/`** (copy in `SC/lm50/sg/kit/`); run node tools from
`R` so module paths like `lm50/sg50a/sg50a.js` resolve.
1. **Existing models / sites near a point** (exist_sg.json = the built page's placements + the patch17 MODS files + every `R/lm50/sg50*/sg50*.js` + extras):
   `cd R && node lm50/kit_sg/near50.js <lat> <lon> [r=600] [lm50/sg50a/sg50a.js,...]`
2. **Stats:** `cd R && node lm50/kit_sg/nstat50.js lm50/sg50a/sg50a.js <key1,key2,...>` → per key `calls` (meshes added before lmMerge, ≈ helper calls),
   `tris`, `ms`, `mats`, `rmax` vs `r`, `ymin` / `ymax`, `h`, `label`, then the module's SG_PLACES. Builds use the app's own helpers: `lm50/kit_sg/lmbase.js` is sliced
   out of the production `site/app.js` (`bash lm50/kit_sg/mklmbase.sh [app.js]` regenerates it if the app's helper block changes).
3. **Shaded preview:** `cd R && node lm50/kit_sg/ndump50.js lm50/sg50a/sg50a.js <key> SC/lm50/sg50a/x.bin && python3 lm50/kit_sg/nrender50.py SC/lm50/sg50a/x.bin
   SC/lm50/sg50a/x.png <tx> <ty> <tz> <dist> <elev> <azim> [W H]` (model coords, y up; azim 0 = camera south looking north; delete the .bin afterwards).
4. **Plan overlay vs the real footprints:** `cd R && node lm50/kit_sg/oplan50.js sg lm50/sg50a/sg50a.js <key> lm50/ref_sg50a.json <refKey> SC/lm50/sg50a/<key>_plan.png [half m]`
   (places the key with its last SG_PLACES entry like the app; prints hidden real buildings, CLASHES, centroid offset; PNG grey kept / red hidden / orange clash /
   blue hull / green model below 4 m / roads). Look at every PNG.
5. **Corrected anchor refs** (same format, one key in its own file): `cd SC && REREF='sg50a_1|<key>|<lat>|<lon>|<radius>' REF_OUT=SC/lm50/sg50a/ bash lm33/kit/heavy.sh
   python3 /home/claude/earth_online/src/lm50/s50_refs_sg.py sg50a_1` → `SC/lm50/sg50a/ref_sg50a_1.json` (without `REF_OUT` it writes `R/lm50/ref_sg50a_1.json`).
6. **Full-app test page** (patch17 build of R with your module, made headless-testable: local three.js, `window.__t` hook, `?near=` tile streaming):
   `bash R/lm50/kit_sg/mkapp50.sh sg50a lm50/sg50a/sg50a.js` → `SC/lm50/sg/site/t_sg50a.html` + `t_sg50a-app.js` (~9.3 MB together; `sgdata` is a symlink).
7. **Shots — in-situ and full app, through the browser lock, detached, polled** (the landmarks-only in-situ harness is gone; a `NEAR` run streams only the real
   tiles near the target and is the in-situ shot; omit `NEAR` for the whole island):
   ```
   cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad && (setsid nohup bash lm33/kit/browser.sh env PAGE=lm50/sg/site/t_sg50a.html \
     NEAR=<lat>,<lon>,700 W=1280 H=800 node /home/claude/earth_online/src/lm50/kit_sg/appshot50.js lm50/sg50a/app \
     '[["<key>_d",lat,lon,400,30,200,12],["<key>_n",lat,lon,400,30,200,20.5]]' > lm50/sg50a/app.log 2>&1 &)
   ```
   Views `[name, lat, lon, dist m, elev °, azim °, hour, "optional JS", waitMs]`; `window.__t` exposes camera, controls, scene, renderer, SGR, sgXY, hC, setTod,
   lodTick, LANDMARKS, landmarks, SG_PLACES, SITES. Pass = **0 PAGEERR** and FAILED-URLS only the expected entries: the city-switch probes `/lm50/sg/site/{bay,nyc,hk,tyo,gba}.html` (404 + FAIL each), `/lm50/sg/site/index.html` (5 × 404 + 5 × FAIL) and `/favicon.ico` — 21 entries, with 11 matching "Failed to load resource" console errors (test run, 27 Nov: 0 PAGEERR, exactly these 21, ready in 32 s with NEAR 700 m, ~310 draw calls / 3.6 M tris per view; shots `SC/lm50/sg/shots/kit_d.png`, `kit_n.png`). The tools panel stays open on the left of the frame (the old appshot's collapse selectors no longer match): leave room for it. Then
   `rm SC/lm50/sg/site/t_sg50a.html SC/lm50/sg/site/t_sg50a-app.js`. **At most 2 browser runs per group** (round rule).
8. Existing-model dump (only if the production app changes): `cd SC && bash lm33/kit/browser.sh env PAGE=lm50/sg/site/t_base.html node
   /home/claude/earth_online/src/lm50/kit_sg/exist50.js lm50/sg/exist_sg.json` (page from `mkapp50.sh base`), then copy it to `R/lm50/kit_sg/`.

## Things to know
- Frame as lm40: local +x east, +z south, `rot` about y; base = highest ground within r (+0.6 m); the app hides every real building under the convex hull of the
  model's lower 25 m + 3 m — keep the plan on the real footprint and off neighbours (dense CBD / Orchard groups: most targets have modelled neighbours within
  100 m, e.g. sgthearcade–sgofc 50 m, sgstraitstrading–sgsltower 52 m, sgndc–sgstjoseph 47 m, sgcentrepoint–sgemeraldhill 75 m).
- `sgsspp` lies inside the `sgsmu` site radius (240 m) but is not part of SMU: check that the site's keep polygon does not cover it.
- `sgmarinasquare` is the mall podium joining sgpanpacific / sgmandarinoriental / sgmarinamandarin (all separate keys): model the podium only.
- `sgtbmarket` has no app footprint (OSM relation only); the model stands on open ground.
- Several towers are new (2023–2025: sgioi, sgkeppelsouth, sglabradortower, sgonehollandv, sgonepearlbank, sgstatecourts towers) or have app heights far below the
  listed height — take heights from `meta.h` and outlines from refs + photos.
- No logos, brand names or readable text (malls, banks, hotels, hospitals); respectful religious buildings; never `Math.random`; English app text.

