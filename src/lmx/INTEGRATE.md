# Integration checklist (v38 landmarks + v39 harbour) — collected from author reports

## Hong Kong
- [x] hkx_kowloon: hkavenuestars/_b/_c supersede tst.js block (hkv_kowloon already removed it from tst.js). _b, _c unlabelled.
      (v39 integrator: tst.js has only the removal comment; _b/_c label:false, checked with lmx/labchk.js.)
- [x] Run hk/hkx_kowloon/aos_deck_fix.py (from hkreal, after b4b + other deck fixes), then b7r_roads, b6_misc, b7b_base, stage.sh.
      (28 Oct: chain b4b -> tm_deck_fix -> hkx_nt/deck_fix -> aos_deck_fix -> b7r -> b6 -> b7b -> pk_rail_fix -> stage.sh; logs hkreal/*_v39.log)
- [x] hkx_island: run hk/hkx_island/tools/pk_rail_fix.py after b7b_base, before stage.sh (--dry first); add the mkengine.py line
      from its header (after the R() that adds `Z = Ld.z || null`).
- [x] Skip `R.line.code === 'PK'` in sgStations (generic PK platforms cover the new stops); consider dropping the generic PK train.
      (patch_hk.py: PK stations keep their net.stations entry, no geometry; mkengine.py: k2 = 0 trains for PK.)
- [x] Drop v37 peak.js keys hkpeaktram, hkpeaktram_b/_c/_d (peak loads after hkx_island and would override).
- [x] Unlabelled: hkpeaktram_kr/_mr/_mg/_my/_bk; hk10kbuddhas_b (check hkx_nt report).
- [x] hkv_island: unlabelled hkvsol_c, hkvsol_w (beam keys, rmax 1108/763 vs r 20 — check app culling by r), hkvfix_*, hkvoilst2.
      (the app does not cull landmarks by r: three.js frustum-culls by the geometry's own bounding sphere; r only sets the base
      sampling / blocking radius; the hide hull uses vertices < 25 m above base: only the -3 m speck, so nothing is hidden.)
- [x] hkv_kowloon: unlabelled hkvsunplaza, hkvchinachem, hkvsouthseas, hkvmetrotower, hkvmetroresidence, hkvmpluscsf.
- [x] Skyline appshot views need `controls.maxPolarAngle=1.565` and `fov=30` and the signs `flush()` in the view JS. (lmx/views39.py)
- [x] hkv_kowloon: westkowloon.js edited directly (its build.py lacks spec_*.json / tags.json): don't regenerate westkowloon.js.
      hkkowloonstation_b now 97k tris, 506 ms in node (55 ms in Chrome).
- [x] Signs: patch_hk.py MODS 'lm20/signs/signs.js' -> 'hkv/hksigns/hksigns.js'; run `python3 hkv/hksigns/gen.py` after all sign
      lists are final (builder ids override scout ids; entries without lat/lon drop an id). (28 Oct: 132 specs; output identical to the
      authors' last run; 3 bld ids not in buildings.pkl fall back to the footprint under the sign.)
- [x] hkx_nt: run `cd hkreal && python3 ../hk/hkx_nt/deck_fix.py` after b4b_hkdecks.py and tm_deck_fix.py, then b7r_roads,
      b6_misc, b7b_base, stage.sh. Remove v37 blocks: lantau.js T1KEYS loop (hkt1..hkt1_f), bridges.js HL_KEYS (hkhzmblink*) and
      SZ_KEYS (hkszbaybridge*). Unlabelled: hkt1_b.._f, hkszbaybridge_b.._f, hkhzmblink_b.._l, hk10kbuddhas_b.._d, hklammaps_b.._d.
- [x] Key clash hkvwingon (Island Wing On Centre vs Kowloon Wing On Plaza): Kowloon renamed to hkvwingonplaza (src.js, gen.py, regenerated).
- [x] v37 blocks that the v38 keys must replace (modules load alphabetically; check which wins, then delete the old block):
      central.js hkcentralpiers; wanchai.js SITES hkvicpark, hkhappyvalley (wanchai loads AFTER hkx_island -> old wins today);
      peak.js hkpeaktram(_b.._d); lantau.js hkt1..hkt1_f; bridges.js hkhzmblink*, hkszbaybridge*. Re-run `node lmx/count.js hk`:
      no "placed more than once", no "defined in more than one module". (28 Oct: removed by lmx/v39_cut.py, backups *.v39.bak; count clean.)
- [x] Count (28 Oct, `node lmx/count.js hk`): HK 189 labelled landmarks + sites (v37+v38 = 115, v39 harbour +74).
- [x] COUNT PROPERLY: several v38 "new" targets were already built in v37 inside loops (hkt1, hkhzmblink, hkszbaybridge,
      hkpeaktram, hkavenuestars; check Tokyo too). Count distinct labelled LANDMARKS + SITES per city by evaluating the modules
      in node (not by grep) before telling the user the totals; add targets if a city is short of 100.
      (HK after the cuts: 176 labelled LANDMARKS + 13 SITES = 189 labelled keys; 62 unlabelled sub-keys. v37: 93 labelled keys;
      v38: +22 genuinely new places (8 more are re-builds of v37 places: hkt1, hkhzmblink, hkszbaybridge, hkpeaktram,
      hkavenuestars, hkcentralpiers, hkvicpark, hkhappyvalley) = 115; v39: +74 harbour-front buildings = 189. Not short of 100.)
- [x] Intro cards (LM_INFO, lm33/info_hk) for every new labelled key; README counts.
      (lm33/info_hk/labelled_v39.js, 96 entries + site:hkpark / site:hktaio; build.js / validate.js extended; 215 entries, 0 errors,
      0 labelled keys without a card (lmx/infomiss.js); short entries warn on length by design. README: hkreal/README.md v39 note.)
- [x] Open: w1097239635 (Central Harbourfront Site 3) OSM parts to 214 m may be a planned tower drawn by the app.
      (28 Oct, v39 page: shot lmx/shots39/v39c/site3.png - only a low block shows there, no 214 m tower in the skyline.)
- [x] v39 build: pub39/hk/index.html + hkdata; full-app checks lmx/shots39/ (v39, v39b, v39c on the published file, v37 for comparison):
      0 page errors, only the sibling-page probes and favicon 404. Open: harbour draw calls +45-90 % vs v37 (tris +5-7 %).

## Shared (after both integrations)
- [ ] Label icons: every Tokyo site (shrines, gardens, stadium) shows the campus-cap icon; shared label code only special-cases
      gardens / theme parks / Changi. Give shrines/temples ⛩, stadia, gardens their own icons (check HK sites too).
- [ ] Shibuya Crossing screens are plain black panels by day (OK by the no-content rule; maybe a dark glass tone instead).

## Tokyo
- [x] Unlabelled (tyo_post.js): tymetgympool, tymetgymsub, tyyebisuchateau. tyx_central: none. (28 Oct; checked in the app:
      label false, 111 landmark/site labels on the map; a click on a sub-key resolves to tymetgym / tyyebisu.)
- [x] Remove v37 SITES tycrossing, tymeijijingu, tystadium from tyo/shibuya/shibuya.js and tygyoen from tyo/shinjuku/shinjuku.js
      (tyx_west versions win today only by load order). (28 Oct: removed with their site data, backups *.v39.bak.)
- [x] Suppress OSM labels: "MUFG体育场 / MUFG Stadium" (naming-rights brand) and the extra "新国立竞技场" at r10071391;
      "明治神宫 Meiji Jingu Main Shrine" at the south gate; Hama-rikyu park label duplicates the site label.
      (28 Oct: tyo_post.js TYO_DROP_LABELS drops them from SGR.base.pois / places by en name + position before sgLabels runs;
      Hama-rikyu was there 3 times: POI, place, and a district cell "Hama-rikyu Gardens" (0.71 km²) whose map label is
      dropped too — the district stays in the list. Tokyo-only, no shared file touched.)
- [x] tymeijiotorii (shibuya.js) sits inside the Meiji site (13 m clear disc left) — keep. (kept)
- [x] Count: `node lmx/count.js tyo` — 114 labelled before unlabelling the 3 sub-keys (~108 distinct places).
      (28 Oct after the cuts: 117 LANDMARKS + 16 SITES, 114 labelled in the modules, 111 after tyo_post.js (95 landmarks + 16
      sites; the app shows 111 landmark/site labels). No double placement, no key in two modules. v37 had 84.)
- [x] Intro cards (lm33 info_tyo) for every new labelled key; README counts. (+27 entries, + site:tyhamarikyu, + 3 parent
      links for renamed tyx_west site-building labels; 165 entries, validate.js 0 errors 0 warnings; 0 labelled keys without a
      card. README: tyoreal/README.md v39 note.)
- [x] Found: the v37 Ueno Park site (tyo/ueno/ueno.js) still drew and labelled Kiyomizu Kannon-dō and Ueno Tōshō-gū on the
      footprints of tyx_north's tykiyomizu / tytoshogu, and labelled the National Museum of Western Art (tywesternart): removed
      (backup ueno.js.v39.bak; the pagoda and Benten-dō stay).
- [x] Build: tyo39/build39_tyo.sh -> pub39/tyo/index.html + pub39/tyo/tyodata/ (hard links; data unchanged since v37).
- [ ] Open (shared engine, not changed): Tokyo site labels use the campus cap icon 🎓 (sgLabels' icon rule knows only
      gardens / theme parks / changi), so shrines, gardens and the stadium get 🎓.
