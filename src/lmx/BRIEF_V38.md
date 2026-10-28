# City Brush v38 — more landmarks for Hong Kong and Tokyo (addendum to hk/BRIEF.md and tyo/BRIEF.md)

Paths are relative to `SC = /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/`.

Goal: each city gets to 100 distinct real landmarks. v37 has about 74 (Hong Kong) and 69 (Tokyo); v38 adds 30 + 31 in six new
groups. **Everything in your city's BRIEF applies** (format, world conventions, testing, style, no logos/brand names/text, only
verified facts, report). This file only says what is new.

## Your group
| city | group | your module file | your targets (★ = hero: a recognisable detailed replica) |
|---|---|---|---|
| hk | hkx_island | `SC/hk/hkx_island/hkx_island.js` | ★hkhenderson, ★hkrepulsebay, ★hkpeaktram (line: stations, cars on the track, viaduct piers — the track itself is drawn by the app), ★hkpacificplace, hkcentralpiers, hktimessq, hkthreegarden, hkapleichau, hkhappyvalley (site), hkvicpark (site), hkpark (site) |
| hk | hkx_kowloon | `SC/hk/hkx_kowloon/hkx_kowloon.js` | ★hkk11musea, ★hklangham, ★hkkowloonmosque, ★hkavenuestars, hkhistorymuseum, hksciencemuseum, hkstandrew, hkchungking |
| hk | hkx_nt | `SC/hk/hkx_nt/hkx_nt.js` | ★hkt1 (HKIA Terminal 1: Foster's vaulted roof, the X-shaped piers), ★hkszbaysports (the "Spring Cocoon" lattice shell), ★hk10kbuddhas (the nine-storey pagoda), ★hkszbaybridge, hkhzmblink, hkszse, hkheritagemuseum, hkchekung, hktsuisinglau, hklammaps, hktaio (site) |
| tyo | tyx_central | `SC/tyo/tyx_central/tyx_central.js` | ★tyforum (the glass hall), ★tyboj, ★tynikolai, ★tykachidoki, ★tyedotokyo, tykandamyojin, tyhie, tyeitai, tykiyosu, tykokugikan, tyhamarikyu (site) |
| tyo | tyx_west | `SC/tyo/tyx_west/tyx_west.js` | ★tystadium (Japan National Stadium, Kuma Kengo: timber eaves), ★tymeijijingu (site: the shrine halls in the forest), ★tycrossing (site: the scramble crossing markings and the station plaza, no screens with content), ★tymetgym, tyoperacity, tydocomo, tymitsui, tykeioplaza, tycamii, tyyebisu, tygyoen (site) |
| tyo | tyx_north | `SC/tyo/tyx_north/tyx_north.js` | ★tystmary, ★tynact, ★tywesternart, ★tytakanawa, tysunshine60, tytoshogu, tykiyomizu, tyyokostadium, tysankeien |

- Targets: `SC/<city>/targets.json` → `groups.<your group>`; reference data: `SC/<city>/ref_<your group>.json` (same format as
  the v37 ref files; the ref radius is 1.6 × r around the anchor).
- **Check every anchor.** A few targets are given by a point (`osm: null`) or by a neighbouring object — the notes say so
  (hkchekung, hktaio, tytakanawa, tyyebisu). Find the real footprint in the refs (match names, shapes and photos), take
  your lat / lon / rot from it, and say in your report which OSM footprint you used. If an anchor is clearly wrong, use the right
  footprint and say so.
- Detail: ★ targets get a faithful replica (real dimensions, the features that make it recognisable from 1–3 km and convincing
  at 100–300 m, night look). The others: medium detail on their real footprints — correct massing, setbacks, storey rhythm,
  roof form, materials and colours, and a night look. Keep within the BRIEF budgets.
- Sites (marked "site") use the SITES format of `SC/sg/SITES_API.md`.
- Names: `zh` Simplified (as in targets.json), `en` as in targets.json. **No brand names or logos on any model** (malls, hotels,
  banks, telecoms): the card names stay as given.
- Intro cards: none needed from you (the integrator writes them).

## Working rules
- Work only inside `SC/<city>/<your group>/`. Don't edit any other file (not the BRIEFs, targets, refs, other modules, the
  pipeline or the app).
- Every browser run through `SC/lm33/kit/browser.sh` (it serialises the browser across the six authors working now — expect to
  wait). Run long jobs detached and poll their logs; never `pkill -f`, kill by PID.
- Finish with the full-app test of your BRIEF (`<city>real/mk<city>.sh <you> <you>`, then appshot), zero page errors.

## Report back (short)
The BRIEF's report, plus: the OSM footprint you anchored each key on, which keys are sub-keys that must stay unlabelled (if
any), and any key you could not do (and why).
