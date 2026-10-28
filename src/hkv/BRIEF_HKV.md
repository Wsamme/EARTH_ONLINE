# City Brush HK v39 — Victoria Harbour, both shores, rebuilt from photos (brief)

Paths are relative to `SC = /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/`.
Everything in `SC/hk/BRIEF.md` (world conventions, testing, browser lock, report) still applies, except the sign rules below.

## Goal
The user wants the two shores of Victoria Harbour to look like the photos, day and night:
- the harbour-front towers and the buildings along the shore roads (Connaught Rd, Harcourt Rd, Gloucester Rd, Victoria Park Rd,
  Salisbury Rd, Canton Rd, Hung Hom waterfront): facades, crowns, podiums, LED skins, rooftop signs, the Symphony of Lights;
- the neon and sign streets: Causeway Bay (Hennessy Rd, Yee Wo St, Lockhart Rd, Jaffe Rd, Paterson St, East Point Rd), Wan Chai
  (Lockhart Rd, Hennessy Rd), Mong Kok (Nathan Rd, Sai Yeung Choi St S, Fa Yuen St, Shantung St, Argyle St, Portland St),
  Yau Ma Tei / Jordan (Nathan Rd, Temple St, Jordan Rd), Tsim Sha Tsui (Nathan Rd, Peking Rd, Granville Rd, Carnarvon Rd).
- **Position, size, shape, colour, lighting and animation of every sign follow the photos as closely as you can.**

## The sign / brand rule (replaces "no text" for the sign layer only)
Signs now carry text, rendered by the sign engine (`hkv/hksigns`). Landmark models themselves still carry no text.
- Keep from the photo: the sign's position on the building, its size and proportions, the kind (rooftop frame, channel letters,
  lightbox, LED screen, projecting neon), the colour family of background and letters, the lettering style class (bold hei, song /
  serif, calligraphic, Latin sans), vertical or horizontal, how it is lit and how it animates.
- **Replace the content with invented content**: invented shop / company names in Traditional Chinese and simple English, or
  generic trade words (押, 酒家, 酒樓, 茶餐廳, 金行, 珠寶, 大藥房, 找換, 時裝, 眼鏡, 鐘錶, 電器, 夜總會 → use 卡拉OK / 桑拿 rather than
  adult venues, 麻雀 is fine). The classic pawnshop sign (bat holding a coin + 押) is a generic trade sign and is welcome.
- **No real brand names, no near-copies of them** (no puns or one-character swaps such as 汇丰→海丰, no look-alike Latin names),
  and **no logo shapes** (no hexagons, swooshes, stars, emblems that imitate a real mark). An LED screen shows abstract animated
  colour fields or invented ads, never a real ad.
- Building and place names on the map cards stay as they are (that is the map, not signage).

## Sign spec (one JSON list per author: `SC/hkv/<author>/signs_<author>.json`)
```json
{"id":"cwb_yeewo_01", "lat":22.28012, "lon":114.18431, "y":38.5, "az":0,
 "w":18, "h":6, "kind":"roof", "bld":"w123456", "sides":1,
 "text":"金寶大押", "sub":"PAWN", "vert":false, "font":"hei",
 "bg":"#101010", "fg":"#ff2a2a", "edge":"#ffd23a", "lit":"neon", "anim":"chase",
 "conf":"photo", "src":"hkv/photos/cwb/0012.jpg (Commons: File:Hennessy Road at night.jpg, CC BY-SA 4.0)",
 "note":"replaces a real brand's rooftop sign; same red-on-black, same position over the east corner"}
```
- `lat, lon`: the sign's centre in plan (WGS84). `y`: height of the sign's centre above the app ground (`hC`) at that point, m.
  For signs on a roof give `bld` (OSM id of the building, w/r prefix) or `lm` (landmark key); the engine also accepts
  `"roof":true` = the sign's bottom sits on that building's roof (then `y` is ignored).
- `az`: compass direction the face points to (0 north, 90 east, 180 south, 270 west). `sides:2` = double-faced (blades and
  over-street signs).
- `w, h`: metres of the board / screen. `kind`: `roof` (frame billboard on a roof), `letters` (channel letters, no backing, on a
  crown or parapet), `wall` (flat on a facade), `box` (lightbox), `led` (screen), `blade` (vertical, projecting from the facade),
  `over` (horizontal, cantilevered out over the street — the classic Mong Kok / Nathan Rd neon), `band` (a long fascia band).
- `text` (Traditional Chinese or English), `sub` (small second line), `vert`, `font`: `hei | song | kai | wei | sans | serif`.
- Colours `bg, fg, edge` (hex; `bg:null` = no backing). `lit`: `neon` (tube letters / outlines that glow), `box` (backlit),
  `led` (self-lit screen; `text` optional, then abstract content), `flood` (front-lit by day/night), `off` (unlit).
- `anim`: `none | flash | chase | seq | scroll | cycle | screen` (`screen` = abstract LED video). Keep the real rhythm calm:
  most neon is steady; chasing borders and letter sequences are typical for pawnshops and restaurants.
- `conf`: `photo` (seen on a photo; give `src`) or `estimate` (typical for the street, not seen); `src`, `note` free text.

## Photos
Photos are collected by the photo scout into `SC/hkv/photos/<area>/` with `SC/hkv/photos/INDEX.md` (file, source URL, author,
licence, where it was taken from, looking which way, what it shows, date if known). Read the images with the Read tool.
Only the scout drives the browser (Chrome): if you need a specific view, ask in your report and work on with what you have.
Note: many of Hong Kong's old neon signs were removed in 2010–2020; the user wants the neon character, so photos from any year
are fine, but say which year a sign comes from when you know it.

## Hard rules
- Work only in your own folder `SC/hkv/<you>/` (or the folders your brief gives you). Back up any file you take over.
- Every browser run through `SC/lm33/kit/browser.sh`; heavy jobs through `SC/lm33/kit/heavy.sh`; long jobs detached; never
  `pkill -f`. Up to ten agents share 2 CPUs: batch views, shoot single keys while iterating.
- Only verified facts for heights and dates; estimates are fine for sign sizes when marked `conf:"estimate"`.
