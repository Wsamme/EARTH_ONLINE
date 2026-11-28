# Round lm50 (v48): 200+ more hand-built buildings per city, and all of Guangzhou on the Greater Bay map

Owner's request (28 Nov 2026): following our earlier modelling method (the hand-built landmark modules of lm40 / hk v41 / gba v41 /
nyc / tyo rounds), Singapore, Hong Kong, New York, Tokyo and Shenzhen each get **at least 200 more buildings**. The Greater Bay map
also takes in **all of Guangzhou**.

- Repo (build root, canonical source): `/home/claude/earth_online/src` (`R` below). `sgreal/patch17.py` uses `R` as its `SC`.
- Scratchpad (kits, refs pipelines, old working copies, test pages): `SC = /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/`.
  Most tools of earlier rounds live in both; when they differ, the repo copy is newer for modules and the SC copy may hold the
  data pipeline outputs (out/*.pkl, refs). Check before you rely on one.
- Machine: **2 CPUs, 7 GB RAM, ~16 GB free disk, shared by every agent of this round.** Heavy Python / node jobs go through
  `SC/lm33/kit/heavy.sh` (lock), every browser run through `SC/lm33/kit/browser.sh` (one browser at a time on the machine; expect to
  wait; run detached and poll). Kill by PID only. Never leave big files behind.

## The method (unchanged — read the earlier briefs)
`R/lm40/BRIEF.md` (Singapore lm40 — the model contract, quality bar, budgets, rules, kit), `R/lm40/INTEGRATE.md`, `R/hk/BRIEF_V41.md`,
`R/gba/BRIEF_V41.md`, `R/lmx/BRIEF_V38.md`, `R/hkv/BRIEF_HKV.md`, plus `SC/lm16/LANDMARK_KIT.md` and the briefs they point to.
One `{ … }` block per group that only assigns `LANDMARKS.<key>` + places them (`SG_PLACES.push`) and, for sites, `SITES`.

## Phase 1 — targets (one agent per city)
Deliverables in `R/lm50/`:
1. `targets_<city>.json` — **at least 210 rows** (≥ 200 + spares): `key` (unique project-wide: prefix sg / hk / ny / ty / sz),
   `zh`, `en`, `kind`, `lat`, `lon`, `r`, `osm` (way / relation id of the footprint the anchor sits on, `line` for bridges, `-` POI
   only), `h` (verified height in m or null) + `hs` (what was checked, with the source URL), `note` (recognition hint), `unc` (why
   the anchor is uncertain, or ""), `hero` (true for ★ — at most 4 per group), `group`.
   Every target is a **real structure that is not modelled yet** in that city's page: check against the city's existing
   `LANDMARKS` keys / `SG_PLACES` positions and sites (evaluate the modules, e.g. `SC/lmx/count.js`, `SC/lm40/kit/near.js`, or the
   city's equivalent) — not merely by name. Prefer buildings people recognise: towers on the skyline, civic / heritage buildings,
   stations, stadiums, campuses, temples / churches, markets, bridges; then the blocks around them that make a district read right.
2. **8 groups of ~26 by area** (`<city>50a` … `<city>50h`), compact areas so neighbours can be checked together.
3. `ref_<group>.json` for every group, with the city's existing refs tool (same format as the city's last round: anchor, radius,
   buildings with rings / heights / osm ids / parts, roads with bridge elevations, areas, pois). Note the tool and command used.
4. `BRIEF_<city>.md` — the city-specific part of the modeller brief: module folder per group (below), the exact working commands
   of that city's kit (near-check, nstat, ndump + nrender preview, plan overlay, in-situ shot, full-app shot) **tested once by you**,
   the neighbours already modelled in each group's area, and anything a modeller must know (frame, data quirks).
Do not model in phase 1. Do not edit files outside `R/lm50/` (and your scratch folder `SC/lm50/<city>/`).
Module folders (the city builds pick folders up by glob unless noted): Singapore `R/lm50/sg50x/sg50x.js` (added to
`sgreal/patch17.py` MODS by the coordinator), Hong Kong `R/hk/hk50x/hk50x.js`, New York `R/nyc/ny50x/ny50x.js`, Tokyo
`R/tyo/ty50x/ty50x.js`, Shenzhen `R/gba/sz50x/sz50x.js` (check how the gba build includes `R/gba/*` and say so).

## Phase 2 — modelling (one agent per group, launched in waves by the coordinator)
Per `R/lm40/BRIEF.md` + `R/lm50/BRIEF_<city>.md`. With ~26 keys per group: ★ heroes faithful; the others medium detail on the real
footprint (massing, setbacks, storey rhythm, roof, materials, colours, night look). Budget the browser: **at most 2 browser runs per
group** (1 in-situ batch, 1 full-app or a second in-situ); everything else offline (nstat, ndump/nrender, oplan overlays).

## Rules (all rounds)
No invented data (positions, heights, layouts, dates): verify or leave out, label estimates. No logos, brand names or readable text
on models. Respectful religious buildings and memorials. Never `Math.random`. English text in the app. Don't commit, push, deploy,
or edit other agents' folders; the coordinator integrates.
