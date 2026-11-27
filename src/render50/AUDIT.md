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

(filled from `SC/render50/out/*.json`, see section 5)

## 3. Quick wins found

(see section 5)

## 4. Method

(see section 5)
