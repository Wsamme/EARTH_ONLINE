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
| `probe.js` | one short headless check per city (through the browser lock): vehicles move, none stuck, none jumping, none off the drawn road surface; before (live data) and after (stage) in one browser session |
| `compare.py` | the before / after table |
| `run_before.sh`, `run_repair.sh`, `run_all.sh` | batches (run through `SC/lm33/kit/heavy.sh`) |

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

- **Tunnels.** The pipelines drop tunnel ways (`tunnel=yes`, `layer < 0`), so every tunnel is a break. Singapore, New York
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
