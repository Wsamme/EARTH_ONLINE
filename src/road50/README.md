# road50 — road system checks and repairs (v48, 28 Nov 2026)

Owner's request: 道路也要做修正，做道路系统，算法生成精细化道路，监测断开；修复确认车辆通行.
This folder checks every city's road data the way the app uses it, repairs what the data and the pipelines got wrong, and
confirms that the traffic system can drive the result. It works on the encoded road files the pages load
(`site/<city>data/*_roads.bin`, the Greater Bay's `gba_rc<k>.txt` chunks): decode, repair, re-encode with the same name / ref
indices, so the base files stay as they are. The pipeline outputs (`*/out/roads.pkl`) are not on this machine any more.

## Tools (node, no browser)

| file | what it does |
|---|---|
| `lib.js` | loads a city (base json, road file or chunks) and evaluates `sgreal/mod_roads/roads.js` in a VM (SGRoads.decode, `_dbg.prep`); SGR1 encode / raw decode |
| `tgraph.js` | the traffic system's drivable network for the whole map, with the rules of `lm20/traffic/traffic.js` (junction nodes from roads.js, links per direction, virtual nodes at line ends incl. its one-way deck step joins, movements without U-turns); SCC, weak components, Dijkstra |
| `diag.js` | the diagnostics: components, dead ends (gap / level gap / deck in mid-air / water / tunnel mouth / map edge / chunk seam / service / cul-de-sac), one-way sinks, sources and closed sets, crossings (false junctions, low clearance, missed junctions), level steps at junction vertices, steep jumps, roads at grade in water, height jumps between links, tunnel mouths, offline route tests; JSON + problem maps |
| `repair.js` | the repair rules R1–R5 (below); every change and every flag in `out/<city>_repair.json` |
| `zoom.js` | close-ups of the data (lines coloured by deck height, problems ringed) |
| `simtest.js` | the traffic system itself (traffic.js + roads.js + three.js r128) run in node on the data, no page: per view warm(25) then 8 x warm(10); vehicles, stuck (> 60 s waiting, not at a signal), jumps between samples, off the drawn road surface (`SGRoads.surfaceAt`) |
| `probe.js` | one short headless check per city (through the browser lock): vehicles move, none stuck, none jumping, none off the drawn road surface; before (live data) and after (stage) in one browser session |
| `compare.py` | the before / after table |
| `run_before.sh`, `run_repair.sh`, `run_all.sh`, `run_diag.sh`, `run_sim.sh` | batches (run through `SC/lm33/kit/heavy.sh`); `run_probe.sh` (browser lock) |
| `release.sh` | copies the repaired road files of the stage into `site/` (backups in `road50/backup/`); owner / coordinator only |

Map colours (`out/<city>_<tag>_<district>.png`, 7 km wide): grey = drivable and in the main strongly connected network
(blue-grey on decks), orange = reachable but a one-way trap / no way back, red = an island (not connected to the main
network); magenta dots = dead ends that stop within 12 m of a road at the same level (gaps), purple = level gaps, blue =
decks ending in mid-air, cyan = false junctions, yellow rings = low clearance, green = missed junctions, dark blue rings = level
steps, brown = steep jumps, black / grey rings = one-way sinks / sources, big red rings = islands.

## Repair rules (repair.js)

Never invents a road: R1 only joins an existing road end to an existing road a few metres away; R3–R5 only change heights
(the heights of ramps and decks are pipeline estimates; sourced deck profiles are kept wherever another rule allows).

- **R3 junction level continuity (ramp heights)** — where the data joins two drivable lines (a shared vertex, or a line end
  within 0.6 m of another line) at different heights (1.2 < dE <= 40 m), the roads module makes no junction and traffic cannot
  pass. H = the higher line there, Lo = the lower. Mode order: H not bridge-tagged (a pipeline ramp lift) -> pin H down to Lo's
  level, else raise Lo; H a bridge deck and Lo not, dE > 8 m -> raise Lo (an approach ramp; the deck keeps its height), else pin
  H if H ends there; two decks -> the one that ends there moves. A pin is `E(s) = min(E(s), e_Lo + g |s - s0|)`, a raise
  `max(E(s), e_H - g |s - s0|)`, propagated into the lines joined at the old level (at most 120 lines), g = 5.5 % (the
  pipelines' ramp grade), then 8 %, 10 %. Accepted only if every changed line keeps all its other same-level contacts, makes no
  new one, makes no new low-clearance crossing (< 4.2 m), keeps traffic's one-way deck step joins and lifts no dead end into
  the air; else flagged. Three passes.
- **R1 gap join** — a dead end of the traffic network at a line end (not a tunnel mouth, not the map edge) within 6 m of another
  drivable road ahead of it (or within 2 m), at the same level (dE <= 1.2 m), with compatible classes (motorway only with
  motorway / trunk / primary and links; motorway links not with residential / service), and not a deck meeting the ground:
  the end is moved onto the road (<= 1 m) or extended by one vertex to it, and a vertex is inserted in that road there, so
  both share a vertex (a junction for the roads module and traffic). Greater Bay chunk seams are the same rule (logged R2).
- **R4 clearance** — a bridge-tagged line crossing an at-grade drivable road without a junction and less than 4.2 m above it
  (or at its level: a false junction): its profile is raised to 5.0 m over the road with ramps of 5.5–10 % inside the bridge
  line (its end heights stay); else flagged.
- **R5 steep** — a jump of more than 12 % (and > 1 m) between two vertices of a line is re-graded to 8 % (mean of the upper
  and lower 8 % envelopes), keeping the line's end heights and junction vertices; else flagged.

## Not repaired (flagged for the owner)

- **Tunnels (now R6 for Hong Kong and the Greater Bay, below; Tokyo, Singapore, New York, Bay still open).** The pipelines drop tunnel ways (`tunnel=yes`, `layer < 0`), so every tunnel is a break. Singapore, New York
  and the Bay mark the tunnel mouths (flags 64 / 128; traffic makes them sources / sinks); Hong Kong, Tokyo and the Greater
  Bay do not. Hong Kong Island (about 500 km of road) is an island for traffic: its links to Kowloon are the three
  cross-harbour tunnels. Joining them needs the tunnel ways from OSM (a pipeline change) plus hidden tunnel links in traffic.
- Islands with no road of the main network within 80 m (`topIslands` in the JSON: often real islands, private / service
  links, or tunnels).
- Low-clearance crossings and missed junctions between two non-bridge lines (the data cannot tell which is right).
- Roads at grade over water cells: the land-use raster is 25–50 m, so roads on dikes between fish ponds (Dongguan, Shenzhen)
  read as in the water; no bridge is invented.
- Widths from `lanes` / `width` tags: the encoded data keeps only the class (widths come from the class tables in roads.js /
  traffic.js); this needs the pipelines re-run with the tags.

## Results (28 Nov 2026, live data vs the test stage)

Routes: 2000 origin / destination pairs per city (40 x 50, by road length; the same points before and after, snapped to the nearest drivable link), on the traffic network (no U-turns, dead ends are sinks).

| | sg before | sg after | hk before | hk after | nyc before | nyc after |
|---|---|---|---|---|---|---|
| weak components | 73 | 69 | 665 | 261 | 262 | 217 |
| main component % | 98.8 | 98.82 | 70.99 | 82.36 | 98.8 | 98.89 |
| other comps >= 1 km | 9 | 9 | 85 | 32 | 31 | 26 |
| km outside main | 57.5 | 56.4 | 1120.2 | 681.2 | 313.7 | 289.9 |
| main SCC % (traffic) | 85.77 | 86.31 | 43.89 | 54.7 | 89.39 | 89.78 |
| main SCC % (turn round) | 95.92 | 96.39 | 60.16 | 74.18 | 97.56 | 97.85 |
| dead ends: gaps <= 12 m | 72 | 36 | 162 | 81 | 298 | 221 |
|   of which <= 6 m | 48 | 12 | 108 | 27 | 102 | 25 |
| dead ends: level gaps | 22 | 9 | 1534 | 608 | 390 | 184 |
| dead ends: decks in mid-air | 6 | 6 | 116 | 109 | 80 | 77 |
| dead ends: one-way | 281 | 246 | 1575 | 905 | 777 | 630 |
| dead ends: tunnel mouths | 102 | 102 | 0 | 0 | 87 | 87 |
| dead ends: map edge / chunk | 0 | 0 | 0 | 0 | 945 | 943 |
| level steps at junction vertices | 29 | 12 | 1270 | 398 | 478 | 182 |
|   steps > 15 m | 2 | 0 | 109 | 83 | 41 | 25 |
| steep jumps (>12 %, >1 m) | 241 | 114 | 119 | 118 | 649 | 600 |
| false junctions (bridge at grade) | 8 | 9 | 41 | 46 | 52 | 45 |
| low clearance crossings | 27 | 25 | 313 | 238 | 834 | 727 |
| missed junctions | 20 | 15 | 238 | 188 | 644 | 575 |
| roads at grade in water (> 60 m) | 14 | 14 | 46 | 46 | 32 | 32 |
| one-way sinks / sources | 32 / 164 | 28 / 165 | 55 / 133 | 51 / 130 | 131 / 657 | 127 / 603 |
| closed one-way sets | 2 | 2 | 12 | 9 | 33 | 22 |
| vertical jumps between links > 1.5 m | 0 | 0 | 215 | 41 | 30 | 6 |
| routes OK % (2000 pairs) | 97 | 97.3 | 44.4 | 57 | 98.2 | 98.4 |
|   failed: not connected | 31 | 30 | 1029 | 713 | 23 | 20 |
|   failed: one-way | 28 | 24 | 83 | 146 | 14 | 12 |
| route detour median | 1.33 | 1.33 | 1.96 | 1.68 | 1.27 | 1.27 |

| | tyo before | tyo after | bay before | bay after | gba before | gba after |
|---|---|---|---|---|---|---|
| weak components | 3088 | 1585 | 270 | 210 | 2071 | 815 |
| main component % | 95.75 | 97.13 | 99.19 | 99.33 | 92.49 | 96.54 |
| other comps >= 1 km | 119 | 45 | 35 | 28 | 282 | 109 |
| km outside main | 1901.4 | 1285.2 | 188.2 | 154.9 | 2256.9 | 1040.1 |
| main SCC % (traffic) | 86.36 | 88.4 | 81.05 | 81.39 | 71.23 | 77.57 |
| main SCC % (turn round) | 94.81 | 95.79 | 98.15 | 98.39 | 85.66 | 90.99 |
| dead ends: gaps <= 12 m | 2576 | 1646 | 420 | 363 | 1622 | 755 |
|   of which <= 6 m | 1199 | 258 | 115 | 61 | 1309 | 441 |
| dead ends: level gaps | 8811 | 3627 | 320 | 145 | 5545 | 1774 |
| dead ends: decks in mid-air | 344 | 286 | 67 | 67 | 280 | 265 |
| dead ends: one-way | 3891 | 2697 | 550 | 474 | 6283 | 3400 |
| dead ends: tunnel mouths | 0 | 0 | 50 | 50 | 0 | 0 |
| dead ends: map edge / chunk | 1627 | 1613 | 478 | 477 | 7 | 5 |
| level steps at junction vertices | 4949 | 1657 | 388 | 138 | 3608 | 917 |
|   steps > 15 m | 292 | 218 | 41 | 35 | 297 | 205 |
| steep jumps (>12 %, >1 m) | 996 | 565 | 275 | 249 | 143 | 131 |
| false junctions (bridge at grade) | 221 | 210 | 5 | 6 | 88 | 96 |
| low clearance crossings | 2482 | 1708 | 451 | 389 | 1616 | 1214 |
| missed junctions | 2975 | 2408 | 283 | 247 | 1548 | 1181 |
| roads at grade in water (> 60 m) | 398 | 397 | 27 | 27 | 1162 | 1162 |
| one-way sinks / sources | 106 / 1020 | 86 / 945 | 42 / 324 | 33 / 302 | 181 / 577 | 160 / 578 |
| closed one-way sets | 55 | 25 | 15 | 11 | 28 | 16 |
| vertical jumps between links > 1.5 m | 564 | 177 | 7 | 6 | 472 | 100 |
| routes OK % (2000 pairs) | 94.8 | 95.8 | 98.7 | 99 | 79.1 | 86 |
|   failed: not connected | 94 | 66 | 20 | 15 | 305 | 175 |
|   failed: one-way | 11 | 18 | 6 | 6 | 113 | 105 |
| route detour median | 1.18 | 1.16 | 1.26 | 1.26 | 1.31 | 1.28 |

Changed lines and changes per rule:

- sg repair: changed lines 199 changes {'R3': 88, 'R1': 34, 'R4': 1, 'R5': 73}
- hk repair: changed lines 2153 changes {'R3': 2782, 'R1': 72, 'R5': 12}
- nyc repair: changed lines 1546 changes {'R3': 1610, 'R1': 70, 'R4': 6, 'R5': 31}
- tyo repair: changed lines 12579 changes {'R3': 16623, 'R1': 750, 'R4': 4, 'R5': 250}
- bay repair: changed lines 1214 changes {'R3': 1231, 'R1': 101, 'R5': 16}
- gba repair: changed lines 9515 changes {'R3': 10400, 'R1': 1060, 'R5': 28}

### Traffic run (simtest.js: traffic.js + roads.js in node, flat ground, warm 25 s + 8 x 10 s sampled; Math.random, so runs differ a little)

| city | view | vehicles b/a | teleports b/a | off surface b/a | waiting>60s (not at signal) b/a | waiting>100s at end b/a | avg speed b/a |
|---|---|---|---|---|---|---|---|
| sg | cbd | 1696 / 1692 | 0 / 0 | 0 (0%) / 0 (0%) | 15 / 8 | 0 / 0 | 5.2 / 5.4 |
| sg | repairs | 521 / 522 | 0 / 0 | 1 (0.02%) / 1 (0.02%) | 21 / 24 | 0 / 0 | 5.7 / 5.1 |
| hk | kowloon | 1640 / 1625 | 0 / 0 | 16 (0.12%) / 0 (0%) | 6 / 3 | 0 / 0 | 6.3 / 6.3 |
| hk | central | 1340 / 1342 | 0 / 0 | 17 (0.16%) / 23 (0.22%) | 5 / 7 | 0 / 0 | 5.3 / 5 |
| nyc | midtown | 1843 / 1843 | 0 / 0 | 2 (0.01%) / 0 (0%) | 3 / 0 | 0 / 0 | 4.4 / 4.4 |
| nyc | repairs | 1742 / 1747 | 0 / 0 | 0 (0%) / 1 (0.01%) | 0 / 1 | 0 / 0 | 6.2 / 5.9 |
| tyo | chiyoda | 2054 / 2075 | 0 / 0 | 59 (0.36%) / 49 (0.3%) | 36 / 44 | 0 / 0 | 5.3 / 5.2 |
| tyo | repairs | 1260 / 1258 | 0 / 0 | 1 (0.01%) / 1 (0.01%) | 3 / 4 | 0 / 0 | 5.1 / 5.4 |
| bay | sf | 2016 / 2009 | 0 / 0 | 3 (0.02%) / 10 (0.06%) | 2 / 4 | 0 / 0 | 5.9 / 5.8 |
| bay | oakland | 1905 / 1908 | 0 / 0 | 1 (0.01%) / 1 (0.01%) | 3 / 3 | 0 / 0 | 6.8 / 6.8 |
| gba | futian | 2007 / 2008 | 0 / 0 | 0 (0%) / 0 (0%) | 11 / 21 | 0 / 0 | 6.1 / 6 |
| gba | repairs | 1167 / 1167 | 0 / 0 | 8 (0.09%) / 0 (0%) | 7 / 7 | 0 / 0 | 8 / 8.1 |

## Release

1. (optional) rebuild the stage from the live data: `bash SC/lm33/kit/heavy.sh src/road50/run_all.sh` (about 15 min; stage in `SC/road50/stage/<city>data/`).
2. `bash src/road50/release.sh sg hk nyc tyo bay` (copies the five road files into `site/<city>data/`, originals to `src/road50/backup/`), then deploy as usual. No page rebuild is needed for the data.
3. Greater Bay, only after the Guangzhou extension has re-staged `site/gbadata/`: `STAGE=SC/road50/stage CITIES=gba bash SC/lm33/kit/heavy.sh src/road50/run_repair.sh`, check `out/gba_after.json`, then `bash src/road50/release.sh gba`.
4. `lm20/traffic/traffic.js` only gained the test helper `SGTraffic.poses()` (backup `traffic.js.v48.bak`); it reaches the pages with the next `patch17.py` build. `roads.js` is unchanged.

## R6 tunnels (follow-up, 28 Nov 2026)

- Source: OSM, openstreetmap.fr `asia/china/guangdong.osm.pbf` (state 2026-11-27T00:47:35Z; read only from the Guangzhou agent's download folder),
  `osm_tunnels.py` -> `osm/tunnels_guangdong.json` (1 842 ways: tunnel=yes 1 593, building_passage and layer < 0 the rest; way ids,
  tags, node ids and positions). Every added line is logged with its `way/<id>` in `out/<city>_repair_tun.json` (rule R6).
- Encoding: a hidden tunnel line is a road record of class c + 32 (no new flag bits; the flags byte is full). `roads.js` decodes it
  with `L.c` = c + 32 (so every other module's class filters skip it), `L.tun = true`, `L.tc` = c; it is in no tile (nothing is
  drawn, indexed, labelled, no piers / lamps / terrain cut), it joins the junction graph only at shared vertices (portals; no
  crossings with the roads above), portal ends count as dead ends for drawing so the existing tunnel portal is drawn there, and the
  surface line ends at tunnel=yes portals get the tunnel-mouth flags 64 / 128. `traffic.js` drives tunnel lines with their class
  (lanes, speeds), hides the vehicles on them (not drawn, no obstacles, no density cull) and never spawns on them.
- Portals: a tunnel node at the same quarter-metre position as a vertex of a drivable road, or within 1.0 m of one (a vertex is
  added; the data and the extract are different OSM dates). Only tunnel networks with >= 2 portals are added.
- Hong Kong: 327 ways, 117.7 km, 419 portals (35 snapped), 300 portal flags: Cross-Harbour, Eastern Harbour, Western Harbour,
  Lion Rock, Tate's Cairn, Shing Mun, Tai Lam, Aberdeen, Tseung Kwan O, TKO-Lam Tin, Eagle's Nest, TM-CLK, Central-Wan Chai Bypass,
  Central Kowloon Bypass, Kai Tak, Cheung Tsing, Nam Wan, Lung Shan and others. Greater Bay: 1 083 ways, 431.4 km, 1 814 portals.
- Tokyo, Singapore, New York and the Bay: done in the next step (below), from openstreetmap.fr extracts.
  `bash run_tun.sh` runs R6 for any city once `osm/tunnels_<extract>.json` exists and the city is mapped in repair.js (`TJ`).

### Results (live -> repaired v1 -> repaired + tunnels)

| | hk live | hk repaired (v1) | hk + tunnels | gba live | gba repaired (v1) | gba + tunnels |
|---|---|---|---|---|---|---|
| routes OK % (2000 pairs) | 44.4 | 57 | 82.9 | 79.1 | 86 | 91.5 |
|   failed: not connected | 1029 | 713 | 136 | 305 | 175 | 84 |
|   failed: one-way | 83 | 146 | 206 | 113 | 105 | 85 |
| main component % | 70.99 | 82.36 | 96.39 | 92.49 | 96.54 | 98.76 |
| weak components | 665 | 261 | 206 | 2071 | 815 | 620 |
| km outside main | 1120.2 | 681.2 | 143.8 | 2256.9 | 1040.1 | 378.5 |
| main SCC % (traffic) | 43.89 | 54.7 | 67.7 | 71.23 | 77.57 | 81.65 |
| route detour median | 1.96 | 1.68 | 1.56 | 1.31 | 1.28 | 1.25 |
| tunnel lines / km | 0 / 0 | 0 / 0 | 327 / 117.7 | 0 / 0 | 0 / 0 | 1083 / 431.4 |
| routes island>kowloon % (100 pairs) | 0 | 0 | 86 | 0 | 0 | 94 |
| routes kowloon>island % (100 pairs) | 0 | 0 | 97 | 0 | 0 | 87 |
| routes island>newterr % (100 pairs) | 0 | 0 | 92 | 0 | 0 | 98 |
| routes island>lantau % (100 pairs) | 0 | 0 | 90 | 0 | 0 | 88 |
| routes lantau>kowloon % (100 pairs) | 0 | 87 | 77 | 0 | 69 | 79 |

| city | view | data | vehicles | in tunnels (vehicles / came out) | teleports | off surface | waiting >100 s | mesh build |
|---|---|---|---|---|---|---|---|---|
| hk | central | live | 1344 | 0 / 0 | 0 | 30 (0.28%) | 0 | 498293 tris |
| hk | kowloon | live | 1631 | 0 / 0 | 0 | 29 (0.22%) | 0 | 684792 tris |
| hk | harbour_east | live | 755 | 0 / 0 | 0 | 16 (0.27%) | 0 | 390151 tris |
| hk | central | after | 1340 | 0 / 0 | 0 | 15 (0.14%) | 0 | 493269 tris |
| hk | kowloon | after | 1625 | 0 / 0 | 0 | 0 (0%) | 0 | 677473 tris |
| hk | harbour_east | after | 755 | 0 / 0 | 0 | 1 (0.02%) | 0 | 387462 tris |
| hk | central | tun | 1340 | 108 / 52 | 0 | 18 (0.17%) | 0 | 493947 tris |
| hk | kowloon | tun | 1627 | 104 / 29 | 0 | 1 (0.01%) | 0 | 677940 tris |
| hk | harbour_east | tun | 753 | 47 / 19 | 0 | 1 (0.02%) | 0 | 387645 tris |
| gba | futian | live | 2007 | 0 / 0 | 0 | 0 (0%) | 0 | 327884 tris |
| gba | hk_central | live | 1341 | 0 / 0 | 0 | 30 (0.28%) | 0 | 501129 tris |
| gba | repairs | live | 1167 | 0 / 0 | 0 | 5 (0.05%) | 0 | 290321 tris |
| gba | futian | after | 2007 | 0 / 0 | 0 | 2 (0.01%) | 0 | 323056 tris |
| gba | hk_central | after | 1339 | 0 / 0 | 0 | 18 (0.17%) | 0 | 496003 tris |
| gba | repairs | after | 1167 | 0 / 0 | 0 | 0 (0%) | 0 | 288737 tris |
| gba | futian | tun | 2008 | 36 / 27 | 0 | 1 (0.01%) | 0 | 323421 tris |
| gba | hk_central | tun | 1341 | 109 / 42 | 0 | 17 (0.16%) | 0 | 496681 tris |
| gba | repairs | tun | 1167 | 15 / 13 | 0 | 0 (0%) | 0 | 288733 tris |


### Release of the tunnels (pages first, then data)

The tunnel records (class >= 32) need the new `roads.js` + `traffic.js` in the page: an old page would draw them as roads of an
unknown class. So:
1. Rebuild the pages with the new modules (`CITY=hk python3 sgreal/patch17.py city-brush-v16.html ../site/hk.html`, and the other
   cities as usual; the modules change nothing for data without tunnel records — checked on Singapore: identical graph and numbers).
2. Then the data: `STAGE=SC/road50/stage_tun bash src/road50/release.sh hk` (the tunnel stage also holds R1-R5).
3. Greater Bay after the Guangzhou extension: extract with its bigger box
   (`python3 src/road50/osm_tunnels.py <guangdong.osm.pbf> src/road50/osm/tunnels_guangdong.json 112.6,21.3,115.5,24.0`), rebuild
   gba.html with the new roads.js / traffic.js (its build embeds its own roads.js variant), `CITIES=gba bash src/road50/run_tun.sh`,
   then `STAGE=SC/road50/stage_tun bash src/road50/release.sh gba`.

Browser check of the tunnels (not run: queued about 40 min behind other jobs, then cancelled). It serves the live page; the "after"
pass uses the tunnel stage and swaps the new roads.js / traffic.js text into the live app (`--mods`):
`bash SC/lm33/kit/browser.sh node src/road50/probe.js hk.html hk src/road50/out/probe_hk_tun.json '[["harbour",22.2900,114.1820]]' --data SC/road50/stage_tun/hkdata --mods`

## R6 for Tokyo, Singapore, New York and the Bay (28 Nov 2026)

- Downloads (openstreetmap.fr; Geofabrik resets connections from here): `dl.sh` puts each extract in `SC/road50/dl/<region>/`,
  checks the md5 and keeps the state file; `dl_all.sh` downloads -> extracts -> deletes one region at a time:
  `asia/singapore.osm.pbf` (state 2026-11-17), `asia/japan/kanto.osm.pbf` (598 MB), `north-america/us-northeast.osm.pbf` (2.0 GB:
  New York **and** New Jersey, for the Holland / Lincoln portals and Jersey City / Newark), `north-america/us-west/california.osm.pbf`
  (1.47 GB). All md5 OK; the extracts are deleted, the .md5 / state files kept. Tunnel ways: `osm/tunnels_{singapore,kanto,us-northeast,california}.json`.
- `repair.js` `TJ` maps sg / tyo / nyc / bay to those files.
- **R6b** (new): an open tunnel end with no road at its OSM portal is joined to the dead end of the same road (same name or ref, a line
  end nothing else joins, direction-consistent for one-way) by one hidden segment: up to 120 m for motorway / trunk (+ links) — the
  pipelines trimmed those approaches, e.g. `bayreal/b4c_ybi.py` cuts the Yerba Buena approaches where they enter the 90 m terrain, so
  without it the Bay Bridge has no tunnel and SF -> Oakland runs 78 km round the bay — and up to 6 m (R1's gap) for other roads.
  Logged as rule R6b with the gap in metres.

### Results, all six cities (live -> repaired v1 -> + tunnels; regions: 100 random pairs each, so +-10 % is sampling)

**sg**

| | live | repaired v1 | + tunnels |
|---|---|---|---|
| routes OK % (2000 pairs) | 97 | 97.3 | 97.5 |
|   failed: not connected | 31 | 30 | 30 |
|   failed: one-way | 28 | 24 | 19 |
| routes with detour > 3x | 13 | 14 | 14 |
| route detour median | 1.33 | 1.33 | 1.33 |
| main component % | 98.8 | 98.82 | 98.91 |
| km outside main | 57.5 | 56.4 | 52.8 |
| main SCC % (traffic) | 85.77 | 86.31 | 86.83 |
| tunnel lines / km | 0 / 0 | 0 / 0 | 319 / 50.3 |
| routes cbd>north (100 pairs; mean length) | 99 % (21.63 km) | 99 % (21.38 km) | 89 % (21.51 km) |
| routes west>east (100 pairs; mean length) | 100 % (28.73 km) | 100 % (28.73 km) | 100 % (28.73 km) |

**hk**

| | live | repaired v1 | + tunnels |
|---|---|---|---|
| routes OK % (2000 pairs) | 44.4 | 57 | 82.9 |
|   failed: not connected | 1029 | 713 | 136 |
|   failed: one-way | 83 | 146 | 206 |
| routes with detour > 3x | 173 | 61 | 50 |
| route detour median | 1.96 | 1.68 | 1.56 |
| main component % | 70.99 | 82.36 | 96.39 |
| km outside main | 1120.2 | 681.2 | 143.5 |
| main SCC % (traffic) | 43.89 | 54.7 | 67.85 |
| tunnel lines / km | 0 / 0 | 0 / 0 | 336 / 118.2 |
| routes island>kowloon (100 pairs; mean length) | 0 % (None km) | 0 % (None km) | 86 % (10.37 km) |
| routes kowloon>island (100 pairs; mean length) | 0 % (None km) | 0 % (None km) | 97 % (10.8 km) |

**nyc**

| | live | repaired v1 | + tunnels |
|---|---|---|---|
| routes OK % (2000 pairs) | 98.2 | 98.4 | 98.4 |
|   failed: not connected | 23 | 20 | 20 |
|   failed: one-way | 14 | 12 | 12 |
| routes with detour > 3x | 70 | 57 | 3 |
| route detour median | 1.27 | 1.27 | 1.21 |
| main component % | 98.8 | 98.89 | 98.92 |
| km outside main | 313.7 | 289.9 | 284.7 |
| main SCC % (traffic) | 89.39 | 89.78 | 89.91 |
| tunnel lines / km | 0 / 0 | 0 / 0 | 374 / 55.5 |
| routes manhattan>jersey (100 pairs; mean length) | 88 % (31.69 km) | 99 % (28.71 km) | 100 % (11.59 km) |
| routes jersey>manhattan (100 pairs; mean length) | 98 % (50.81 km) | 100 % (39.64 km) | 100 % (11.94 km) |
| routes manhattan>queens (100 pairs; mean length) | 99 % (19.96 km) | 100 % (17.88 km) | 89 % (10.04 km) |

**tyo**

| | live | repaired v1 | + tunnels |
|---|---|---|---|
| routes OK % (2000 pairs) | 94.8 | 95.8 | 98.8 |
|   failed: not connected | 94 | 66 | 12 |
|   failed: one-way | 11 | 18 | 13 |
| routes with detour > 3x | 3 | 2 | 2 |
| route detour median | 1.18 | 1.16 | 1.15 |
| main component % | 95.75 | 97.13 | 99.49 |
| km outside main | 1901.4 | 1285.2 | 228.3 |
| main SCC % (traffic) | 86.36 | 88.4 | 91.17 |
| tunnel lines / km | 0 / 0 | 0 / 0 | 1745 / 299.7 |
| routes chiyoda>haneda (100 pairs; mean length) | 21 % (19.53 km) | 21 % (19.32 km) | 93 % (19.91 km) |
| routes haneda>chiyoda (100 pairs; mean length) | 9 % (18.56 km) | 9 % (18.93 km) | 99 % (18.78 km) |
| routes haneda>shinjuku (100 pairs; mean length) | 0 % (None km) | 9 % (21.62 km) | 76 % (21.45 km) |

**bay**

| | live | repaired v1 | + tunnels |
|---|---|---|---|
| routes OK % (2000 pairs) | 98.7 | 99 | 99.1 |
|   failed: not connected | 20 | 15 | 15 |
|   failed: one-way | 6 | 6 | 4 |
| routes with detour > 3x | 65 | 61 | 0 |
| route detour median | 1.26 | 1.26 | 1.24 |
| main component % | 99.19 | 99.33 | 99.34 |
| km outside main | 188.2 | 154.9 | 151.6 |
| main SCC % (traffic) | 81.05 | 81.39 | 81.69 |
| tunnel lines / km | 0 / 0 | 0 / 0 | 133 / 23.1 |
| routes sf>oakland (100 pairs; mean length) | 97 % (77.81 km) | 98 % (77.57 km) | 98 % (18.84 km) |
| routes oakland>sf (100 pairs; mean length) | 100 % (58.79 km) | 99 % (58.49 km) | 100 % (18.41 km) |
| routes orinda>sf (100 pairs; mean length) | 97 % (67.34 km) | 98 % (66.39 km) | 100 % (31.56 km) |

**gba**

| | live | repaired v1 | + tunnels |
|---|---|---|---|
| routes OK % (2000 pairs) | 79.1 | 86 | 91.5 |
|   failed: not connected | 305 | 175 | 84 |
|   failed: one-way | 113 | 105 | 85 |
| routes with detour > 3x | 13 | 5 | 5 |
| route detour median | 1.31 | 1.28 | 1.25 |
| main component % | 92.49 | 96.54 | 98.76 |
| km outside main | 2256.9 | 1040.1 | 378.3 |
| main SCC % (traffic) | 71.23 | 77.57 | 81.67 |
| tunnel lines / km | 0 / 0 | 0 / 0 | 1092 / 431.8 |
| routes island>kowloon (100 pairs; mean length) | 0 % (None km) | 0 % (None km) | 94 % (10.39 km) |
| routes kowloon>island (100 pairs; mean length) | 0 % (None km) | 0 % (None km) | 88 % (11.5 km) |

| city | view | data | vehicles | in tunnels (vehicles / came out) | teleports | off surface | waiting >100 s | mesh build |
|---|---|---|---|---|---|---|---|---|
| sg | cbd | live | 1678 | 0 / 0 | 0 | 0 (0%) | 0 | 340035 tris |
| sg | kpe_mce | live | 1027 | 0 / 0 | 0 | 0 (0%) | 0 | 244658 tris |
| sg | cbd | after | 1691 | 0 / 0 | 0 | 0 (0%) | 0 | 339940 tris |
| sg | kpe_mce | after | 1031 | 0 / 0 | 0 | 0 (0%) | 0 | 244506 tris |
| sg | cbd | tun | 1677 | 69 / 19 | 0 | 0 (0%) | 0 | 339731 tris |
| sg | kpe_mce | tun | 1036 | 77 / 9 | 0 | 0 (0%) | 0 | 244366 tris |
| hk | central | live | 1342 | 0 / 0 | 0 | 33 (0.31%) | 0 | 498293 tris |
| hk | kowloon | live | 1644 | 0 / 0 | 0 | 24 (0.18%) | 0 | 684792 tris |
| hk | harbour_east | live | 755 | 0 / 0 | 0 | 9 (0.15%) | 0 | 390151 tris |
| hk | central | after | 1343 | 0 / 0 | 0 | 18 (0.17%) | 0 | 493269 tris |
| hk | kowloon | after | 1623 | 0 / 0 | 0 | 0 (0%) | 0 | 677473 tris |
| hk | harbour_east | after | 754 | 0 / 0 | 0 | 0 (0%) | 0 | 387462 tris |
| hk | central | tun | 1341 | 114 / 46 | 0 | 27 (0.25%) | 0 | 493947 tris |
| hk | kowloon | tun | 1625 | 92 / 24 | 0 | 0 (0%) | 0 | 677940 tris |
| hk | harbour_east | tun | 752 | 48 / 14 | 0 | 1 (0.02%) | 0 | 387645 tris |
| nyc | midtown | live | 1843 | 0 / 0 | 0 | 1 (0.01%) | 0 | 379785 tris |
| nyc | holland | live | 498 | 0 / 0 | 0 | 1 (0.03%) | 0 | 392323 tris |
| nyc | midtown | after | 1843 | 0 / 0 | 0 | 1 (0.01%) | 0 | 379391 tris |
| nyc | holland | after | 497 | 0 / 0 | 0 | 0 (0%) | 0 | 391721 tris |
| nyc | midtown | tun | 1842 | 70 / 28 | 0 | 0 (0%) | 0 | 379461 tris |
| nyc | holland | tun | 497 | 21 / 5 | 0 | 0 (0%) | 0 | 391510 tris |
| tyo | chiyoda | live | 2057 | 0 / 0 | 0 | 68 (0.42%) | 0 | 547384 tris |
| tyo | haneda | live | 619 | 0 / 0 | 0 | 0 (0%) | 0 | 204619 tris |
| tyo | chiyoda | after | 2066 | 0 / 0 | 0 | 42 (0.25%) | 0 | 544059 tris |
| tyo | haneda | after | 619 | 0 / 0 | 0 | 0 (0%) | 0 | 203936 tris |
| tyo | chiyoda | tun | 2080 | 222 / 156 | 0 | 25 (0.15%) | 0 | 544981 tris |
| tyo | haneda | tun | 619 | 361 / 157 | 0 | 1 (0.02%) | 0 | 204426 tris |
| bay | sf | live | 2019 | 0 / 0 | 0 | 10 (0.06%) | 0 | 402459 tris |
| bay | caldecott | live | 675 | 0 / 0 | 0 | 0 (0%) | 0 | 202689 tris |
| bay | sf | after | 2007 | 0 / 0 | 0 | 10 (0.06%) | 0 | 401373 tris |
| bay | caldecott | after | 676 | 0 / 0 | 0 | 1 (0.02%) | 0 | 202602 tris |
| bay | sf | tun | 2011 | 6 / 6 | 0 | 13 (0.08%) | 0 | 401381 tris |
| bay | caldecott | tun | 676 | 116 / 62 | 0 | 0 (0%) | 0 | 202594 tris |
| gba | futian | live | 2007 | 0 / 0 | 0 | 0 (0%) | 0 | 327884 tris |
| gba | hk_central | live | 1341 | 0 / 0 | 0 | 30 (0.28%) | 0 | 501129 tris |
| gba | repairs | live | 1167 | 0 / 0 | 0 | 5 (0.05%) | 0 | 290321 tris |
| gba | futian | after | 2007 | 0 / 0 | 0 | 2 (0.01%) | 0 | 323056 tris |
| gba | hk_central | after | 1339 | 0 / 0 | 0 | 18 (0.17%) | 0 | 496003 tris |
| gba | repairs | after | 1167 | 0 / 0 | 0 | 0 (0%) | 0 | 288737 tris |
| gba | futian | tun | 2007 | 23 / 15 | 0 | 0 (0%) | 0 | 323421 tris |
| gba | hk_central | tun | 1342 | 119 / 54 | 0 | 15 (0.14%) | 0 | 496681 tris |
| gba | repairs | tun | 1168 | 19 / 16 | 0 | 0 (0%) | 0 | 288733 tris |

### Release of the tunnels, all cities

1. Rebuild every page with the new roads.js / traffic.js (they change nothing for data without tunnel records).
2. `STAGE=SC/road50/stage_tun bash src/road50/release.sh sg hk nyc tyo bay` (the tunnel stage holds R1-R5 + R6 / R6b).
3. Greater Bay after the Guangzhou extension, as above (re-extract the bigger box, rebuild gba.html, `CITIES=gba run_tun.sh`, release).
