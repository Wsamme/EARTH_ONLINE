# writes src/lm50/BRIEF_sz.md (the Shenzhen part of the lm50 modeller brief) from targets_sz.json + the text below
import json, collections
R = '/home/claude/earth_online/src/'
T = json.load(open(R + 'lm50/targets_sz.json'))
G = collections.OrderedDict()
for t in T: G.setdefault(t['group'], []).append(t)
AREA = {'sz50a':'Futian CBD (Shennan to Fuhua, Xinzhou Rd to Huanggang Rd)', 'sz50b':'Futian south and west: Free Trade Zone, Huanggang, Shixia, Shazui, Chegongmiao, Xiangmihu',
        'sz50c':'Futian north and east: Lianhua north, Meilin, Bagualing / Shangbu sports district, Huaqiang South', 'sz50d':'Luohu: Caiwuwei, Renmin South, Hubei, Sungang, Buxin, Shuibei, Liantang / Wenjindu ports',
        'sz50e':'Nanshan Houhai, Shenzhen Bay and the Science Park', 'sz50f':'Qianhai, Shekou / Prince Bay and the Bao\'an centre',
        'sz50g':'North-west: Liuxiandong, University Town, Longhua, Bao\'an north (Xixiang, Fuyong, Shajing, Xinqiao), Guangming', 'sz50h':'East: Buji, Longgang centre, Pingshan / Kengzi, Yantian / Shatoujiao, Dapeng'}
NB = {   # existing models within ~350 m of the group's targets (sites: within r + 150 m), from the evaluated modules (tools/inv.js, near.js)
 'sz50a':'szdabaihui, szexcellence, szenergy, szcec, szgangxia (gba/szcbd); hkpingan (gba/szcbd upgrade of hklm/shenzhen.js); hkszse (hklm/hkx_nt.js); szlibrary, szmocape (gba/szcivic). Closest: szcentralcon 97 m and szwongtee 113 m from szdabaihui; sztaiping / szbosera / szccb / szcmbsz 163-184 m from hkszse.',
 'sz50b':'szneo (200 m from szcktower), szcmbtower (205 m) (gba/szcbd).',
 'sz50c':'szseg (gba/szluohu, 144 m from szelecst), szhuaqiangbei site (gba/szluohu), szlibrary / szmocape / szconcerthall / szchildpalace (gba/szcivic, 155-249 m from szjiangsu / szsinolife), szgangxia (gba/szcbd), szcentralpark / szlianhuashan sites (keep polygons do not reach any target).',
 'sz50d':'szdiwang + szdiwang_b (gba/szluohu: 158 m from szopenuniv, 168 m from szcrbuilding), szguomao, szgrandtheatre, szstation, szdongmen site (gba/szluohu), hkkingkey (298 m).',
 'sz50e':'szhanking, sztencent, szbayinno, szonebay, hkcrtower (gba/szhouhai), szszu and sztalentpark sites (gba/szhouhai), hkszbaysports (hklm/hkx_nt.js).',
 'sz50f':'szqhshimao (106 m from szsfhq), szqhconf, szdesignsociety (170 m from szcmtower), szseaworld site, szqhhub / szqianhaistone sites (gba/szshekou); szbaoanstadium, szbayeye, szbayglory (gba/szbaoan) near szbaoangym / szbayopera.',
 'sz50g':'sznorthstation (gba/sznorth, 361-366 m from szhbchuilong / szhuide), szscimuseum (gba/sznorth, near szintlart), szhitsz / szsafari / szsustech sites (gba/szoct, University Town), szworld / szwaterlands (gba/szbaoan, near szsnowworld).',
 'sz50h':'none within 350 m (gba/szeast sites szchungying, szyantian, szdameisha, szocteast and gba/sznorth szuniversiade / szcuhksz are further away; szstkpagoda / szstkport are ~400-600 m from szchungying).',
}
L = []
A = L.append
A('''# lm50 Shenzhen — modeller brief, city part (Greater Bay page)

Read `R/lm50/BRIEF.md` (the round), `R/lm40/BRIEF.md` (the model contract, quality bar, budgets, rules), `R/gba/BRIEF.md` and
`R/gba/BRIEF_V41.md` (Greater Bay conventions: frame, base height, hiding real buildings, bridges, Shenzhen night) first; this file
adds what is specific to the lm50 Shenzhen groups. `R = /home/claude/earth_online/src`, `SC = /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad`,
`K = R/lm50/sz50kit`, `H = SC/lm33/kit/heavy.sh`, `B = SC/lm33/kit/browser.sh`.

## Targets, groups, refs
- `R/lm50/targets_sz.json` — 212 rows (8 groups, 25-27 each, 4 heroes each): `key zh en kind lat lon r osm h hs note unc hero group`
  plus `osm_name` (the OSM name of the footprint), `area_m2` and `h_app` (the tallest app building on the footprint today).
  lat / lon = centroid of the OSM footprint `osm`; `r` = the footprint's radius + 5 m (a suggestion: set your own `r`).
  `h` is verified only where `hs` gives a source: 127 towers carry the CTBUH Skyscraper Center architectural height (record id and URL in
  `hs`); civic / heritage rows have `h: null` (not verified: judge from photos, say it is an estimate). `note` is a recognition hint,
  not a spec. Every key is a real structure **not yet on the Greater Bay page**: checked by evaluating every module the build loads
  (`R/gba/*/*.js` and `R/gbareal/app/hklm/*.js`, 328 placements + 57 sites) — no target footprint touches an existing landmark hull
  (vertices below 25 m, +3 m) or site keep polygon, and no two targets share or touch a footprint.
- `R/lm50/ref_<group>.json` — the refs, format of `R/gba/ref_*.json` (gbareal/targets/refs.py) plus `meta` (the target row) and
  `areas` (as lm40): per key `anchor radius sel ground terrain buildings roads areas pois`, local metres around the anchor (+x east,
  +z south), box = 1.6 r (120-1600 m; big sites: footprint + 200 m).
  **Made from the app's own data**: `gbareal/out` (what refs.py reads) no longer exists on this machine, so `K/tools/refs_sz.py`
  decodes the staged page data (`site/gbadata`, 22 Nov build: base, bld0-2, the 228 road chunks) and takes OSM ids / names / levels,
  land-use areas and POIs from OSM (Overpass, 27 Nov). `buildings[]`: `ring` (+ `holes`), `h` (the app's height), `base`, `type`,
  `area`, `centroid`, `parts` (the app's building:part pieces on it, base / top), `target: true` on the app footprints lying on the
  target's own OSM footprint (`meta.osm`: what your model replaces), and when an OSM outline fits it (best intersection-over-union)
  `osm`, `name`, `zh`, `floors`, `h_osm`. `roads[]`: `cls`, `name`, `bridge`, `pts`, `elev` (deck height above ground per vertex; the app data has no OSM
  `layer`). The app also has ~2x more footprints than OSM in Shenzhen (other footprint sources, no names / heights): those have no
  `osm`. Towers are sometimes several app pieces on one OSM outline (e.g. szpafcs: 4 pieces 196-289 m); the app hides all pieces under
  your hull.
- Command that made them (27 Nov): `cd $K/tools && python3 osmbox.py ../../targets_sz.json && bash $H python3 refs_sz.py`
  (OSM boxes cached in `SC/lm50/sz/osmbox/`; ~1 min of work under the heavy lock).
- Re-anchored refs for one key (if your anchor moves): `cd $K/tools && bash $H python3 refs_sz.py --reref sz50x_1 <key> <lat> <lon> <radius>`
  → `R/lm50/ref_sz50x_1.json` (fetches its own OSM box; ~1 min + the lock wait).
- Tools that made the targets (for the coordinator): `K/tools/` (cands_sz.py = the curated list, mktargets.py, match.py = CTBUH↔OSM,
  inv.js = inventory of existing models, osmgeom.py / osmbox.py = Overpass, stage.py + szcut.py = decoder of site/gbadata →
  `SC/lm50/sz/stage_sz.pkl`). Data stays in `SC/lm50/sz/` (stage_sz.pkl 126 MB, osmbox/ and web/ caches).

## Your module and how the build takes it
- Folder / file: **`R/gba/sz50x/sz50x.js`** (x = a … h), one `{ … }` block: `LANDMARKS.<key> = {...}` + `SG_PLACES.push({type, lat, lon, rot})`,
  sites via `Object.assign(SITES, {...})`. Keys exactly as in targets_sz.json; `cat:'new'` / `'old'`.
- The Greater Bay build (`gbareal/tools/patch17_gba.py`, CITY=gba; run through `SC/gbabuild/build.sh`, which copies `R/gbareal` and
  `R/gba` into `SC/gbabuild/src`) **globs `gba/*/*.js` and keeps a file only if its name equals its folder name**, sorted by folder
  name — so `R/gba/sz50a/sz50a.js` is picked up with no list to edit, and loads *before* the older `gba/sz*` groups (`'sz50a' < 'szbaoan'`).
  `GBALM=a,b` limits the gba folders (the Hong Kong copies `gbareal/app/hklm/*.js` always load). Never write `site/gba.html`; the
  coordinator builds the release page.
- Frame: place by lat / lon only. The Greater Bay origin (lon0 114.052048203, lat0 22.656070182) and metres per degree are unchanged
  by the lm50 Guangzhou extension (the other agent's `SC/lm50/gz/gbareal/common.py`: same origin, the square grows to HALF 147 km, 100 m
  cells); don't use HALF, tiles or cell sizes in your module. Your refs come from the current page data (built 22 Nov); after the
  Guangzhou rebuild the terrain grid and the estimated heights of real buildings may differ a little.
- Base height, hiding, bridges, night lighting, no logos / text: as `R/gba/BRIEF.md`. Traffic drives on the right in Shenzhen.

## Kit — commands (each run once for this brief on 27 Nov; existing group szcbd stood in for a sz50 module)
Offline, as often as you like (no browser; ~0.1-10 s):
```
cd $K
node near.js <lat> <lon> [r=600] [../../gba/sz50x/sz50x.js]      # existing models near a point: landmark hulls (INSIDE / distance) and site keeps
node nstat.js ../../gba/sz50x/sz50x.js [key1,key2]                # tris, calls, mats, ms, rmax, y range, last SG_PLACES entry
node ndump.js ../../gba/sz50x/sz50x.js <key> $SC/lm50/sz/<key>.bin && \\
  python3 nrender.py $SC/lm50/sz/<key>.bin $SC/lm50/sz/<key>.png 0 <h/2> 0 <dist> 20 200 400 400   # shaded preview (model coords)
python3 oplan.py ../../gba/sz50x/sz50x.js <key> ../ref_sz50x.json $SC/lm50/sz/<key>_plan.png   # plan vs real footprints: hidden, CLASHES, offset
```
(tested: `node nstat.js ../../gba/szcbd/szcbd.js szneo,szdabaihui`, `node ndump.js … szneo` + `nrender.py`, `node near.js 22.5384 114.0226 600`,
`python3 oplan.py ../../gba/szcbd/szcbd.js szneo <reref of szneo> out.png`). The offline kit is `R/lm50/ty50kit` adapted: the builder
helpers come from the page template the Greater Bay build uses (`SC/gbabuild/src/city-brush-v16.html`, 14 Nov snapshot), three.js r128,
flat ground; `near.js` / `hulls.js` evaluate `R/gba/*/*.js` + `gbareal/app/hklm/_pre.js` + `hklm/*.js` (6 Hong Kong landmarks fail to
build offline — material colour helper — none of them in Shenzhen). Look at every PNG with the Read tool.

Browser (at most 2 runs per group; through the browser lock, detached, poll the log):
```
cd $K && bash $H bash mkpage_sz.sh sz50x sz50x          # in-situ page: only your group + the Hong Kong copies -> SC/lm50/sz/site/t_sz50x.html (~2 s)
(cd $K && NEAR=<lat>,<lon> setsid nohup bash $B node appshot_sz.js t_sz50x.html $SC/lm50/sz/shots/sz50x \\
  '[["<key>_d",lat,lon,500,30,200,13],["<key>_n",lat,lon,500,30,200,20.5]]' > $SC/lm50/sz/sz50x_app.log 2>&1 &)
```
Views `[name, lat, lon, distance m, elevation °, azimuth ° (0 = camera south looking north), hour (20.5 = night), "optional JS", waitMs]`.
The log prints readiness, per-view calls / tris, landmark label count, heap, every failed request (FAILED-URLS) and PAGEERR.
Pass = 0 PAGEERR and only the expected failures: 404 + ERR_ABORTED for the city-switch probes `/sg.html /bay.html /nyc.html
/hk.html /tyo.html /index.html` and 404 `/favicon.ico` (13 lines, and 11 matching "Failed to load resource" console errors). Tested run (27 Nov,
GBALM=szcbd page, NEAR=22.5384,114.0226, 2 views): ready in 48 s, 0 PAGEERR, 198 labels, heap 1555 MB, ~2.0 M tris day / 3.8 M night.
Tiles are still streaming at the default wait ("Building the real city 35/2602" in the shot): give `waitMs` 6000-10000 for the views you judge. For the full-app check build `mkpage_sz.sh sz50x_all all` instead (every
module). Delete the page afterwards (`rm $SC/lm50/sz/site/t_sz50x*.html`, ~7-9 MB).
The old Greater Bay in-situ harness `R/gbareal/targets/kit` does **not** run any more (it needs `gbareal/out/*.bin.gz`,
`hkreal/kit/engine_helpers.js` + `lmbase.js` and chromium-1194, all gone): use the test page above; the offline `oplan.py` replaces its
plan overlay.

## Groups
''')
for g, lst in G.items():
    A('### %s — %s (%d keys)\n' % (g, AREA[g], len(lst)))
    A('Module `R/gba/%s/%s.js`, refs `R/lm50/ref_%s.json`. Existing neighbours: %s\n' % (g, g, g, NB[g]))
    A('| key | name | kind | h (m) | footprint | note |')
    A('|---|---|---|---|---|---|')
    for t in lst:
        A('| %s%s | %s / %s | %s | %s | %s (%d m²) | %s%s |' % ('★' if t['hero'] else '', t['key'], t['en'], t['zh'], t['kind'], ('%g' % t['h']) if t['h'] else '—', t['osm'], t['area_m2'], t['note'], (' **⚠ ' + t['unc'] + '**') if t['unc'] else ''))
    A('')
A('''## Uncertain anchors (⚠ in the tables) and data quirks
- szsciencehall: the OSM object is an area tagged `building=no`; find the hall among the app footprints inside it (ref `buildings`).
- szcrqh1: OSM names the footprint 前海人寿大厦; CTBUH places China Resources Qianhai Center T1 31 m away (height matches the app):
  confirm from photos before modelling.
- szhuide: `zh` is the OSM name (name:en Huide Tower); CTBUH gives no Chinese name.
- szshixiatower, szbaoanlight, szgaoling (small towers) and szpsfootball (open stadium ground) have no app building on the footprint:
  the model adds the structure; nothing is hidden.
- szepcb uses the app's 261 m footprint w545225940 (the CTBUH point matched an unnamed 180 m piece first; OSM's height tag 283.6 is not
  the CTBUH height). szdjisky's relation r15569215 is the east tower (213 m); the 195 m west tower r14781210 next to it is not a target.
- szavicplaza: OSM's main name is 交通银行大厦 (alt_name 深圳中航广场; Wikipedia AVIC Plaza 深圳中航广场, 254 m incl. spire).
- Names: `zh` comes from CTBUH or the OSM footprint name; `en` from CTBUH, OSM `name:en` or a plain translation of the OSM name for
  civic / heritage rows (fix it if you find the official English name, and say so).
- Heights in `buildings[].h` are the app's (OSM height / levels or an estimate), often wrong for towers — use `h` / `hs` of the target.
''')
open(R + 'lm50/BRIEF_sz.md', 'w').write('\n'.join(L))
print('wrote', R + 'lm50/BRIEF_sz.md', sum(len(l) + 1 for l in L))
