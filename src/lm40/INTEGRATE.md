# lm40 integration checklist (Singapore to 200+)
- [x] Add lm40/<g>/<g>.js for every finished group to sgreal/patch17.py MODS (after lm26/sgouter, before lm20/core so the light-show table merges).
- [x] chinesegarden label: '裕华园（星和园）' -> '裕华园' (星和园 is the Japanese Garden, sgjapanesegarden).
- [x] Intro cards (lm31/info_sg) for every new labelled key; count with lmx/sgcount.js on the built page (target >= 200).
- [x] Build pub40/sg.full.html (+ pub40/sg.sup.html), full-app check. - [ ] publish SG / Bay / NYC artifacts (not done by the integrator: no publish this round).
- [ ] (not done by the integrator) PR to Wsamme/EARTH_ONLINE from a branch (site pages + src snapshot + README count).
## Group notes
- sg40b (12, done): no sub-keys; zh fix sgsiangcho = 仙祖宫; sgordbr: app draws its path strip over the deck (white band) — consider skipping
  the path line there; Jiak Kim final deck checked offline only; in-situ hidden counts higher than overlay (chinatowncx 9, cantonment 8,
  uesquare 9) — glance in the integrated build.
- sg40f (12 targets, done): unlabelled sgbiopolis_chromos/_centros/_nanos/_matrix/_genome/_proteos, sgsecondlink_2/_3. Don't re-run its
  mksite.py (drops water polygons). Estimates flagged: JTH clock-tower spot, Fusionopolis tower/part mapping, Biopolis storeys, Star Vista
  height x1.4 and seeded column positions, Mediacorp 53 m, PPPS A/B, Second Link even 55 m piers. Cards must not state these as facts.
- sg40a (12, done): no sub-keys. sgfraserstower re-anchored on w627103707 (ref_sg40a_1.json; T40's w47345029 is 71 Robinson Rd).
  sgjubilee replaces the app's Jubilee path deck; Esplanade Bridge footways hidden under its hull. Millenia h 223 (roof 218 per Wikipedia).
- sg40g (12 + sgcausewayn, done): unlabelled sgcausewayn. Night Safari anchor moved (ref_sg40g_1.json). Sun Yat Sen villa built 1902
  (not 1880s). Estimates flagged: Bird Paradise aviary net radii/masts (positions from POIs), dragon size/heading, Novena facade side,
  Burmese temple tiers, TreeTop height compressed to ~13 m (terrain has no valley). Cards: no stated sizes for these.
- sg40e (12 + sgmbcw, done): unlabelled sgmbcw. DUPLICATE CABLE CAR: main17.js sgCableCar() draws a procedural Mount Faber line, a grey
  tower station at (1.2650,103.8203) ~150 m east of the real HarbourFront Tower Two and hilltop boxes at (1.2717,103.8197) and
  (1.2557,103.8178): retarget its rope ends to the new station mouths (HarbourFront 1.264482,103.818698 ~66 m ASL; Faber 1.271196,
  103.819408 ~104 m; Sentosa 1.255517,103.817702 ~59 m) and drop its own stations/towers. CHECK: Keppel Bay Bridge pylon end (placed 60 m
  from the Keppel Island end from memory) — verify from a source or photo before release.
- sg40c (12 + sgmustafa2/3, sgsmu2, done): unlabelled sgmustafa2, sgmustafa3, sgsmu2. sgtekka also draws the surrounding HDB blocks as
  plain slabs (h 83.1). Maghain Aboth porch placed on the Waterloo St (SE) projection though Wikipedia says the facade faces west — CHECK
  with a photo/plan. Sakya Muni anchored on unnamed footprints under the temple POIs (h overridden: chedi 24 m, spire 31 m, estimate).
- sg40h (12 = 16 keys + 3 sites, done): unlabelled sgsheares2/3/4, sgkoonseng2, sggeylangserai2, sgplq3, sgexpo2. ECP deck over the
  Kallang Basin is a flat 7.2 m in the app; the real Benjamin Sheares Bridge rises to 29 m — optional deck fix (then raise D.sh.e piers in
  sg40h.js); check whether lm24/roadfix/rf_r7.py + rf_stage.sh still work (lm24/roadfix/work was deleted on 6 Nov as stale). App piers /
  lamp poles under the bridge hull: STRUCTSKIP if wired for landmarks.
- sg40d (12 = 16 keys + site, done): unlabelled sgemeraldhill_b/_c/_d/_e/_pp. Hilton saucer placed on the rear slab (sources conflict:
  Wikipedia puts Top of the M on the 36-storey Orchard Rd block) — CHECK. 313@Somerset's 7 m link to Discovery Walk left out (gap).
## v40 integration (done, 2026-11-05)
- MODS: the eight lm40 modules after lm26/sgouter (sgreal/patch17.py, backup patch17.py.v40.bak). All 25 listed sub-keys were already
  label:false in the modules. chinesegarden zh -> 裕华园 in lm20/w5/sec_cg.js and w5.js (backups *.v40.bak).
- Cable car: POSTS += lm40/post_cablecar.py (SG only): sgCableCar() replaced; ropes end at the three station mouths, only the two real
  towers (Wikipedia Singapore Cable Car: Seah Im Road 80 m asl ~300 m from Faber; Sentosa tower 88 m asl ~450 m from Sentosa), no
  app stations / tower box / "Mount Faber" lookout label; line label moved over the harbour span.
- Facts: Maghain Aboth porch on Waterloo St (SE) CONFIRMED (roots.gov.sg: the ark, at the west wall, is in the wall facing the main
  entrance; the plot faces SS Peter & Paul across Waterloo St) — no change. Hilton saucer MOVED to the Orchard Road block T1
  (roots.gov.sg: saucer on the original hotel, second wing added later; oyster: Orchard Wing = original; milelion: Top of the M is
  in the Orchard Wing; Wikipedia: original block faces Orchard Rd) — lm40/sg40d/part_a.js (backup part_a.js.v40.bak), h 160.
  Keppel Bay Bridge pylon end NOT SETTLED (sources give 250 m total / 190 m max span = pylon 60 m from one end, steel pylon, 7 stays;
  none says which end; commons / zh.wikipedia not reachable) — left as the author placed it (island end).
- Sheares deck: SKIPPED. rf_r7.py still works (re-encode of sgreal/out/roads.pkl = production sg_roads content), but the fix changes
  the production sg_roads.txt (a data republish), the real vertical profile is not in the data (only the 29 m crest), and sg40h
  assumes one flat deck height E (girders, 22 trestles, lamps) — not a small change.
- Cards: 96 entries + 25 {p:} links in lm31/info_sg/info_sg.js (backup .v40.bak); lm31/kit/lm_sg.json regenerated (lmlist.js now
  reads lm40); validate.js knows the 12 new sites and accepts p:"site:<key>" (sgsmu2). Validator OK (344 entries).
  Left out of cards as flagged estimates / conflicts: Frasers / Millenia / Hilton heights, Star Vista / Mediacorp / Biopolis sizes,
  Second Link piers, Bird Paradise nets, dragon size, Burmese tiers, TreeTop height, Sakya Muni chedi/spire, JTH clock tower spot.
- Count (lmx/sgcount.js on a mktest copy): 198 labelled placed landmarks + 19 sites = 217 (v39: 114 + 7 = 121).
- Build: pub40/sg.full.html (9.21 MB, node --check OK) + pub40/sg.sup.html (126-byte prefix of pub37/sg.sup.html). Full app
  (lm40/kit/appshot.js via browser.sh, whole island): 0 PAGEERR, FAILED-URLS only the sibling-page probes + favicon; 232 placed
  types, no key or site placed twice. Cost vs pub39 (same 13 views, swiftshader): draw calls +10..+50 % (overview 2194 -> 3282,
  Marina night 1177 -> 1608), triangles +4..+9 %, frame ms +5..+15 %, JS heap +30..+120 MB (~1.6-1.7 GB). Shots: int40/app40, app40c.
- Open: Keppel Bay Bridge pylon end; Sheares deck rise; publish + PR; draw-call growth worth a merge pass in a later round.
