# WebGPU for City Brush: state of the art (Nov 2026), what an upgrade from three.js r128 costs, and a plan

render50, 28 Nov 2026. Prototype: `render50/webgpu/ocean.html` (three.js r187 `WebGPURenderer` + TSL, WebGL 2 fallback).
Measurements: section 6. Sources: section 8.

## 1. Recommendation (short)

(see the end of the file; written after the measurements)

## 2. Where WebGPU stands (late 2026)

- **Browsers.** WebGPU is on by default in Chrome / Edge on Windows, macOS and ChromeOS since 113, on Android 12+ (ARM / Qualcomm / Intel GPUs)
  since 121, on Linux for Intel Gen12+ since 144 and NVIDIA under Wayland since 147; Firefox on Windows since 141 and on Apple-silicon Macs
  since 145 (all macOS versions since 147), Linux / Android still behind a flag; Safari 26 on macOS, iOS, iPadOS and visionOS
  (implementation-status wiki, last edited 2 Oct 2026; web.dev, 25 Nov 2025). So: nearly every desktop and iPhone visitor has it;
  older Android phones, many Linux machines and Firefox on Linux / Android do not, and need WebGL 2.
- **Compatibility mode** (Chrome 146, Feb 2026): opt-in `featureLevel: "compatibility"` runs WebGPU on OpenGL ES 3.1 devices (Android first),
  widening reach to older phones at the cost of a restricted feature set.
- **This machine's headless Chromium** (Chrome for Testing 153): see section 6 for what it reports (adapter, features).

## 3. three.js: WebGPURenderer and TSL

- `WebGPURenderer` (import `three/webgpu`) targets WebGPU and **falls back to a WebGL 2 backend automatically**; `forceWebGL: true` forces it.
  Initialisation is asynchronous (`await renderer.init()` or `setAnimationLoop`). Materials are node materials; shaders are written in
  **TSL** (`three/tsl`), compiled to WGSL or GLSL depending on the backend. A new node-based post-processing stack with MRT replaces
  `EffectComposer`.
- **Not supported by WebGPURenderer**: `ShaderMaterial`, `RawShaderMaterial` and `onBeforeCompile` modifications of built-in materials
  (they must be ported to node materials / TSL), and `EffectComposer`. The three.js manual still calls the renderer experimental and says
  `WebGLRenderer` can be faster in places; `WebGLRenderer` stays maintained for pure WebGL 2 apps but gets no larger new features.
- WebGPU-era features that matter for this engine:
  - **compute shaders** (`instancedArray` / `storage` buffers, `renderer.compute()`); on the WebGL 2 backend three emulates them with
    transform feedback;
  - **render bundles**: `BundleGroup` records the draws of a static group once and replays them (three.js PR #28347, r165: 8,000 meshes,
    23.7 ms → 15.9 ms per frame in the author's test; bundles do not reduce draw calls, batching / instancing still needed);
  - **timestamp queries** (`trackTimestamp: true`, `resolveTimestampsAsync('render' | 'compute')`) when the adapter has `timestamp-query`;
  - `BatchedMesh` (also in `WebGLRenderer`), indirect draws, MRT, storage textures.

## 4. What upgrading this codebase from r128 costs

Counted in the 27 Nov production builds (`site/*.js`, `site/gba.html`):

| Item | Count | Change needed |
|---|---|---|
| `onBeforeCompile` patches | 43-60 per city (56 in gba) | Rewritten as TSL node materials for WebGPURenderer. They also need checking for a newer WebGLRenderer: chunk renames (`encodings_fragment` → `colorspace_fragment` r154, `output_fragment` → `opaque_fragment` r154, `lightmap_fragment` removed r164, `GeometricContext` removed r157). |
| `#include <…>` string replacements inside them | ~160 per city | Most anchor on `common`, `begin_vertex`, `emissivemap_fragment`, `color_fragment`, `beginnormal_vertex`: still present in r187 WebGL chunks, but the code around them changed. |
| `ShaderMaterial` | 26-31 per city | Fine on a newer `WebGLRenderer` (WebGL 2 GLSL); must become node materials for WebGPU. |
| `MeshLambertMaterial` | 42-56 per city | r144: Lambert becomes per-fragment, so every building and the ground change look (and cost) slightly. |
| Colour management | renderer defaults (linear output, no tone mapping) | r152: `outputColorSpace` sRGB by default and `ColorManagement.enabled`; the app's colours are authored as sRGB numbers in linear output, so every colour, the palette tables and vertex colours need re-tuning or `ColorManagement.enabled = false` + `LinearSRGBColorSpace` output to keep the look. |
| Lights | legacy intensities | r155: physically based light units by default (`useLegacyLights` removed later); sun / hemisphere / point light intensities need re-tuning (point / spot `decay` 2 since r147). |
| Script loading | `examples/js` non-module scripts (OrbitControls, GLTFLoader), `three.min.js` from CDN | `examples/js` removed in r148, `build/three.min.js` removed in r161: the page must move to ES modules / an import map, and the 7-9 MB app script (one IIFE) must become a module. |
| `LuminanceFormat` | used by render50's coast texture | Removed in recent three.js (not in r187's build): use `RedFormat`. |
| WebGL 1 | r128 falls back to WebGL 1 | Removed in r163 (WebGL 2 required: all current browsers have it). |
| `InstancedMesh` | 44-53 per city | r151: frustum culling on by default (needs bounding spheres after instance updates). |

The migration guide recommends steps of ~10 releases. Two separate projects hide here: (a) r128 → current `WebGLRenderer` (colour,
lights, modules, chunk renames); (b) `WebGLRenderer` → `WebGPURenderer` (all custom shading to TSL). (b) needs (a) first.

## 5. Plan in stages

Each stage ships on its own and keeps a working WebGL path. Gates are the headless checks of render50 (0 page errors, screenshots per
city compared with the release, frame numbers from `SC/render50/probe.js`).

0. **Done in render50 (r128, production-safe):** ocean (`render50/water.js`), shadow / label work cuts (`render50/perf.js`), the
   WebGPU / TSL prototype of the ocean, compute and bundles (`render50/webgpu/ocean.html`).
1. **Module loading, still r128.** Load three.js as an ES module from an import map (r128's `build/three.module.js` and
   `examples/jsm` OrbitControls / GLTFLoader exist), keep the app script as is but make it a module. No look change. Unlocks stage 2.
   Effort: small; risk: script order, globals used across modules (`window.CB_*` handles).
2. **WebGLRenderer r128 → current, same look.** Steps of ~10 releases (the migration guide's advice): r138, r150, r160, r170, r187.
   Keep the look with `ColorManagement.enabled = false`, `outputColorSpace = LinearSRGBColorSpace`, light intensities re-scaled where
   r155 changed units, `RedFormat` for luminance textures, chunk renames in the `onBeforeCompile` patches (asserted string replacements
   fail loudly, which helps). Per step: build all six pages, screenshot diff, frame numbers. Gains: per-fragment Lambert (sharper
   lighting on big faces), `BatchedMesh` (one call for many different meshes: tiles, landmarks), current GLTFLoader, WebGL 2 only.
   Effort: large (the ~50-60 shader patches per city are checked at every step); risk: moderate, mostly visual regressions.
3. **WebGPURenderer behind a switch.** Port the material families to TSL in order of screen share: buildings (`matBld` + `NIGHT`),
   ground (`post_ground`, `lm32/detail`), water (prototype), sky dome, landmark lights (`LM_GLSL`), roads / markings, traffic, signs.
   A `?gpu=1` page uses `WebGPURenderer` (with its WebGL 2 backend where WebGPU is missing); the default page stays on stage 2's
   `WebGLRenderer` until the WebGPU page matches it on all cities. Effort: very large (every `onBeforeCompile` and `ShaderMaterial`);
   risk: high; the three.js manual still calls the renderer experimental.
4. **WebGPU-only wins** once stage 3 is the default: vehicles / pedestrians / particles simulated in compute shaders (today ~JS per
   frame in `lm20/traffic`), static tiles in `BundleGroup`s, GPU frustum / occlusion culling with indirect draws, timestamp-query based
   adaptive quality (instead of frame-time guesses), cascaded or virtual shadow maps written in TSL.

## 6. Measurements

(filled in below)

## 7. Risks

- **Reach:** WebGPU is missing on Linux (most configurations), Firefox on Linux / Android, older Android phones; the WebGL path must stay
  first-class (stage 3 keeps it). Compatibility mode helps on Android only.
- **Maturity:** three.js calls `WebGPURenderer` experimental; its WebGL 2 backend is not the same code as `WebGLRenderer` and can be
  slower; features (e.g. some post effects, `onBeforeCompile`) are deliberately absent.
- **Size of the port:** ~300 custom shader edits across the six builds, written by many module authors and anchored on r128 chunk text.
  Every landmark round adds more. A port freezes landmark work or must run beside it.
- **Look drift:** colour management and light units change every colour unless pinned to the legacy setup (stage 2).
- **Measurability here:** this machine's headless Chromium renders WebGL through ANGLE on Mesa llvmpipe (software), so neither frame
  rates nor WebGPU timings from here predict a laptop GPU (see section 6).

## 8. Sources

- WebGPU implementation status (gpuweb wiki, last edited 2 Oct 2026): https://github.com/gpuweb/gpuweb/wiki/implementation-status
- "WebGPU is now supported in major browsers", web.dev, 25 Nov 2025: https://web.dev/blog/webgpu-supported-major-browsers
- "What's New in WebGPU (Chrome 146)", 25 Feb 2026 (compatibility mode): https://developer.chrome.com/blog/new-in-webgpu-146
- three.js manual, WebGPURenderer: https://threejs.org/manual/en/webgpurenderer
- three.js migration guide: https://github.com/mrdoob/three.js/wiki/Migration-Guide
- three.js PR #28347 (render bundles, r165): https://github.com/mrdoob/three.js/pull/28347
- WebGPU spec (W3C CRD, 20 Mar 2025; timestamp-query is optional): https://www.w3.org/TR/2025/CRD-webgpu-20250320/
- three.js r187 on npm (published 30 Oct 2026); API names checked in its build files (`BundleGroup`, `reflector`, `instancedArray`,
  `trackTimestamp`, `resolveTimestampsAsync`).
