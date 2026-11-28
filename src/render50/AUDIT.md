# render50 audit: how the engine renders today, where the frame time goes, what was changed

Round render50 (28 Nov 2026). Engine: three.js r128 (`WebGLRenderer`, WebGL 2 context, WebGL 1 fallback), one page template
`src/city-brush-v16.html` patched per city by `sgreal/patch17.py` (+ `gbareal/tools/patch17_gba.py` for the Greater Bay page).
All numbers below were measured headless on this machine (see "Method"): they are relative costs, not laptop frame rates.

## 1. How each part is rendered now (before render50)

| Part | Where | How |
|---|---|---|
| Sea | template `const sea` + `lm20/light/light.js` `lgWater()` | One `MeshLambertMaterial` (`sea.material`, transparent, opacity 0.86, `depthWrite:false`) shared by the 200 km sea plane (y = -1.6 in the real maps), the real sea polygon and the inland water bodies (`sgrWater()` in every `<city>real/app/*.js`; the Fuji lakes in Tokyo). The light module patches its fragment shader: analytic sky `lgSky()` along a reflected ray with Fresnel (Schlick) scaled by `lgReflK` = 0.75, procedural cosine ripples that fade out by 900 m, a Beckmann-like sun / moon glitter lobe of fixed width. No reflection of the scene (skyline, hills, night lights), no wave texture, no shore treatment. Ponds / pools (`matSgrPond`) get the same light-module water. |
| Sky | `lm20/light/light.js` `lgBuildDome()` | Unit sphere at the far plane, one draw call: hazy gradient (zenith / horizon), aureole, twilight arch, Earth's shadow, Belt of Venus, city glow on the haze, stars on a sidereal grid, the moon with its phase. Palette is a table of sun elevations (`LG_PAL`). |
| Fog | template + light module `lgFrame` / `lgFogColour` | `THREE.Fog` (linear). Near / far follow the view distance (aerial perspective); colour = the dome's horizon colour in the view direction. The weather module (`lm20/wx`) pulls it in for haze / rain / fog. |
| Sun light, shadows | template `sun` (DirectionalLight) + light module `lgShadow` | One shadow map, `PCFSoftShadowMap`, 2048 px (1024 and off on phones: `CB_MOBILE`). The shadow box is fitted to the view every frame (half-size 260-3200 m, pushed forward for low views, snapped to texels). `shadowMap.autoUpdate` is on: every frame re-renders every caster in the box (buildings, trees, vehicles, landmarks). |
| Ambient | template `hemi` (HemisphereLight) | Sky / ground colours from the light palette. |
| Materials | template, `sgreal/mod_bld`, landmark modules | Mostly `MeshLambertMaterial` with vertex colours (per-vertex lighting in r128) patched with `onBeforeCompile`: window texture and night glow (`NIGHT` uniforms: `uWin`, `uLit`, `uNight`), landmark light schedules (`LM_GLSL`, `LMS`), terrain detail (`lm30/sky/post_ground.py`, `lm32/detail`). ~50-60 `onBeforeCompile` patches and ~27-31 `ShaderMaterial`s per city build. |
| Night | template `applyTime` + light module | `nightF` from the sun elevation drives window glow (`uLit`, fraction of lit windows by the clock), additive `Points` sprites for street lamps / neon halos (`matLamp`, `matNeonGlow`), emissive landmark lighting, vehicle lights and headlight pools (`lm20/traffic`). |
| Tone mapping, colour | renderer defaults | No tone mapping, linear output encoding, colours authored as sRGB numbers and lit in that space ("gamma-space Lambert"). Consistent across the app; changing it would shift every colour (left alone). |
| Labels | template `placeLabels` (v22 rewrite in patch17) | DOM elements, projected every frame, screen-space decluttering on the real maps. |

## 2. Where the frame time goes

Measured with `SC/render50/probe.js` on the test builds in `SC/render50/site/` (one page load per city, the same view measured with
render50 off and on: `R50.water.on`, `R50.perf.shadow/labels`; 1280 x 800, noon unless noted). Per frame, averaged over 3-5 frames.
JSON per city: `SC/render50/out/<city>_<run>.json` (`top` = draw calls / triangles by owner, `mtop` = the mirror pass's).

**Important: this machine renders WebGL in software** (ANGLE on Mesa llvmpipe; WebGPU through a software Vulkan adapter). A frame
takes 2-6 s here and that time is the software rasteriser, not JavaScript: `gl.finish()` does not block in Chrome's GPU process, and
the JavaScript part of a frame was 25-140 ms. So the useful numbers are (a) the work counts (draw calls, triangles, how many frames
re-render the shadow map / mirror), which carry over to any GPU, and (b) the JavaScript milliseconds per part, which are relative
(a shared 2-CPU box). Wall-clock frame times are given only as a relative fill-cost indication.

### Work per frame before render50 (water views, noon)

| City / view | Draw calls (main) | Triangles (main) | Shadow pass calls | Shadow pass triangles | Labels (DOM) | JS per frame |
|---|---|---|---|---|---|---|
| Singapore, Marina Bay | 396 | 5.5 M | 392 | 4.0 M | — | — |
| Hong Kong, Victoria Harbour | 1054 | 6.3 M | 1402 | 4.5 M | — | — |
| Tokyo, Odaiba / Rainbow Bridge | 1048 | 7.9 M | 266 | 5.2 M | 8943 | 64 ms (tiles 20, render submit 10, hooks ~10, labels 0.6) |
| Greater Bay, Shenzhen Bay | 917 | 4.6 M | 395 | 3.1 M | 11413 | 139 ms (tiles 40, render submit 26, labels 17.6) |
| Greater Bay, street level (Futian) | 900 | 5.8 M | 216 | 3.8 M | 11413 | 55 ms |
| Greater Bay, overview (9 km up) | 1005 | 6.2 M | 415 | 3.2 M | 11413 | 88 ms (labels 10.6) |

Where it goes:
- **The shadow map is a second full pass every frame**: 25-130 % of the main pass's draw calls and 50-70 % of its triangles (the shadow
  box is up to 6.4 km wide, every building, tree and vehicle in it is drawn into a 2048 px map), re-rendered every frame even when
  nothing moved.
- **Draw calls**: ~400-1100 per view in the main pass, mostly unnamed merged `MeshLambertMaterial` tile meshes (781 of 1048 in Tokyo),
  instanced trees (71), road surfaces / structures, landmark parts. Scene graph 3-8 k objects; `scene.updateMatrixWorld()` costs
  0.6-3 ms here (not worth changing: matrix freezing would risk animated landmarks).
- **JavaScript**: tile streaming (`sgrStep`, 16 ms budget per frame while tiles build; ~0 once the view is built), the render submit
  (10-28 ms here), module frame hooks (roads surface idle, traffic, signs, detail: a few ms), and **labels**: `placeLabels()`
  projects and declutters every label each frame: 9-11 k label elements in Tokyo / Greater Bay, 0.6-18 ms per frame here.
- **Fill**: on this software rasteriser the frame is fill / vertex bound (5-8 M triangles), which is why turning the shadow map off
  for a frame did not change the wall time measurably here; on a GPU the shadow pass costs its draw calls on the CPU side.

## 3. What render50 changes

### 3a. The ocean (`render50/water.js`)
See the file header. On top of the light module's sky: three-scale procedural slope map (no download), Fresnel (Schlick, F0 0.02),
analytic sky reflection along the wave-perturbed ray, **planar mirror pass** of the scene (1/2 resolution at quality 2, 1/3 at 1, off
at 0), GGX sun / moon lobe whose roughness takes in the wave detail a pixel cannot show, calmer water near the coast and a thin foam
line from a signed distance-to-coast texture made from the land / water grid, a darker water body (the palette colour was standing in
for the missing reflection). Night: the mirror carries the windows, lamps, bridge lights and signs (Tokyo screenshot below).
The sea is now nearly opaque, so the ground texture under it no longer shows through (the dark "streaks" in the old Hong Kong water).

Cost (work per frame, measured): the mirror pass draws **133-790 extra calls on frames where it renders** (Tokyo 790 at quality 2 with
the first version; trees, minor roads, small buildings and vehicles are left out, it looks at most 2.5-7 km far, it is skipped when no
water is on screen or above 6.5 km, and it is re-rendered only every 3rd frame while the camera is still: Greater Bay 22 rendered /
37 reused frames → 133 calls per frame on average). JavaScript: 9-10 ms per rendered mirror frame here (vs 10-26 ms for the main
submit). Wall time on the software rasteriser: +9 % (Greater Bay), +22 % (Singapore), +32 % (Tokyo, first version) on water views.
Phones: quality 0 (no mirror pass, no coast texture), so only the shader cost remains. Desktops step down by themselves (frame time
EMA > 34 ms for 3 s: 2 → 1 → 0).

### 3b. Speed (`render50/perf.js`)
- **Shadow map on demand**: re-rendered when the sun / shadow box moved or tiles / landmarks changed, otherwise every 2nd frame near
  the ground (moving vehicles) and every 4th frame higher up. Measured in still views after streaming: Greater Bay overview 14 of 24
  frames skipped in that view (shadow pass 160-415 calls, 1-3 M triangles each); while tiles are still streaming most frames count as
  "world changed" and re-render (correctly).
- **Labels only when the view changed**: `placeLabels()` is skipped while camera, viewport and label list are unchanged (still runs
  every 20th frame). Measured: 0.64 ms vs 10.6 ms per frame in the Greater Bay overview, 0.1 ms vs 0.6 ms in Tokyo; label runs /
  skips are in `R50.perf.info()`.
- Not changed, with reasons: matrix freezing (`matrixAutoUpdate`) saves ≤ 3 ms here and could freeze animated landmarks; merging /
  instancing of tile meshes belongs in the tile builders (`sgreal/mod_bld`, other agents' area) — the obvious next step there is one
  `InstancedMesh` per repeated building type and fewer, larger merged meshes per tile (the 781 unnamed Lambert calls in Tokyo).

## 4. Quick wins not taken yet (for the module owners)
- Tile building meshes: merge per tile by material (fewer than ~5 calls per tile) — the main pass is 400-1100 calls.
- Shadow casters: small buildings and trees beyond ~1.5 km could stop casting (`castShadow = false` by distance in `sgrLodTile`): the
  shadow pass draws them into texels they barely cover.
- Labels: 9-11 k DOM label elements in Tokyo / Greater Bay; a spatial grid would let `placeLabels()` test only the cells in view
  while the camera moves.
- Traffic: vehicles beyond ~1 km as one instanced far-LOD call already exist; their shadows could be dropped beyond ~600 m.

## 5. Screenshots and data
(see the list at the end of this file, updated with the final run)

## 6. Release (for the coordinator)

- Files: `render50/water.js`, `render50/perf.js`, `render50/debug.js` (inert without `?r50dbg=1`), `render50/post_render50.py`;
  docs `render50/AUDIT.md`, `render50/WEBGPU.md`; prototype `render50/webgpu/ocean.html` (standalone, not part of the build).
- Wired: `sgreal/patch17.py` POSTS now ends with `'render50/post_render50.py'` (backup of the exact previous file:
  `sgreal/patch17.py.v48.render50.bak`; the older `patch17.py.v48.bak` from 17:07 is another agent's and predates the `lm50mech` line).
  So the normal build of index / hk / nyc / tyo / bay includes render50. `RENDER50=0` builds without it; `RENDER50_PARTS=water` or
  `perf` builds one part.
- Greater Bay: its build (`gbabuild/build.sh`, snapshot of 14 Nov) does not read the repo's POSTS. After building `site/gba.html`, run
  `python3 render50/post_render50.py site/gba.html` (inserts the same block in place; refuses a page that already has it). Tested on
  the 27 Nov `site/gba.html`.
- Run-time switches for checking a deployed page: `?r50=0` (all off = the old rendering), `?r50water=0`, `?r50perf=0`, `?r50q=0|1|2`.
- Nothing is downloaded at run time (the wave map and the coast texture are made in the page).
