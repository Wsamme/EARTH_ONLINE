# Queued (user, 28 Oct): the whole map Dongguan + Shenzhen + Hong Kong, after v38 landmarks and the v39 harbour work are done
- User: "从东莞、深圳到香港全部做出来；深圳要按照香港的标准去建一遍"
- Working reading (told to the user, can be corrected):
  - one continuous map from Dongguan through Shenzhen to Hong Kong;
  - Shenzhen at the Hong Kong standard: all real buildings (not only >= 40 m), real roads with decks, Metro, terrain, sign/neon
    layer, and a full landmark set (target ~100, like HK);
  - Dongguan: the full real map (terrain, roads, all buildings, rail) with its main landmarks (fewer than Shenzhen).
- Extent: Dongguan ~22.65-23.15 N, 113.52-114.25 E; Shenzhen 22.45-22.86 N, 113.75-114.62 E; HK as now.
  -> roughly lon 113.50-114.65, lat 22.10-23.20 (~118 x 122 km), vs today's 56 x 56 km square (HALF 28000, 25 m grid).
- Data on disk: hkdata/guangdong.osm.pbf covers all of it. DEM: hkdata/terrain z12 tiles x 3342-3350, y 1783-1790 only
  (up to 22.67 N, 113.73-114.52 E): north Shenzhen and nearly all of Dongguan are missing.
  28 Oct: user allowed s3.amazonaws.com; full set x 3338-3353, y 1775-1790 (256 tiles) in SC/gbadata/terrain/.
- Engine: square size, terrain grid, tile streaming and memory (7 GB, 2 CPUs) must be re-planned; probably a coarser grid outside
  the cores, or several linked maps. Disk allowance ~3.5 GB free: clean old build outputs first.

## Status 28 Oct
- Prototype gbareal/ (126 km square, frame x_hk+7000 / y_hk-35000, 50 m cells). Engine agent: memory (1.75 GB -> target <=1.3 GB),
  HK modules in the new frame, 'gba' in the map switch, ground sharpness, footprint-source check.
- Targets: gba/targets.json, 131 targets in 12 groups (SZ 102 incl. 6 existing hk keys, DG 29), refs, gba/BRIEF.md.
- Authors running: szcbd, szcivic, szluohu, szhouhai, szshekou, szoct.
- Still to launch (when the first batch frees the browser): szbaoan, sznorth, szeast, dgcity, dghumen, dgsongshan.
- Integrator notes from targets: KK100 / Diwang / Hanking / Civic Center heights wrong in build; Humen, Nansha, Lingdingyang
  bridge decks need fixes (authors write scripts); hkpingan/hkcrtower/hkkingkey upgraded in gba groups -> drop hk/shenzhen copies
  in the gba page (keep the HK page's own).

## PAUSED 28 Oct (user asked to pause to save usage; resume when the user says so)
All agents and browser jobs were stopped. To resume, start a fresh author per unfinished group with "take over from the existing
files in SC/gba/<group>/ (src, tools, shots, logs); review, finish, test, report" — the same prompt pattern as the v38 takeovers.
- DONE (reported, 0 page errors): szoct (10, incl. follow-up fixes), szluohu (11 + 2 sites; sub-key szdiwang_b), szhouhai (8 + 2 sites;
  hkcrtower upgraded).
- NEARLY DONE: szcbd (module 10 keys; full app ran, 0 page errors, 11 expected 404s; was reviewing app shots).
- IN PROGRESS (module exists, tests unfinished): szcivic (in situ), szshekou (app job4), szbaoan (app runs; Lingdingyang deck fix
  script expected), sznorth (app runs; Universiade site + sub-landmarks being added), szeast (app runs).
- NOT STARTED: dgcity (only a stub folder), dghumen, dgsongshan.
- Engine (gbareal/): prototype works (0 page errors); round 2 was mid-way: memory reduction probes m5/m6 (swapgc, airdiag), HK modules
  in the new frame, 'gba' already in the map switch (shown in szluohu shots). Read gbareal/README.md and the newest gbareal/shots/m*
  logs before continuing. Known: hk/hkx_nt W0()/baseOf() sample hC in the HK frame (wrong base on the gba map).
- Nothing of the Greater Bay map is published yet. Disk ~1.1 GB free.
