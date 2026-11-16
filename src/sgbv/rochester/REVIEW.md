# Rochester — Batch 1 review

## Shared material refinement and isolation control

Geometry is unchanged. Shared standard materials add roughness/metalness differences, subtle per-face tone, a restrained glass/spandrel rhythm and darkening at bases. A low full-app capture is also used to check that Star Vista courtyard clipping never leaks into this landmark.

The shared materials are cached per landmark build and use one small procedural cube environment, with no external image textures. Existing mullion geometry remains. The three focus modules receive street work; control modules retain their established entrances and geometry.

## References and validation

Six supplied local-reference cameras (N/E/S/W/top/street) are captured before and after through the real r128 appshot/browser-lock flow. `meta.json` supplies the camera; the existing street fallback is `/tmp/bv/cams.jsonl`. No Google tiles are loaded and no reference meshes are extracted. Images remain outside git. The corresponding sheet is `/workspace/eo_codex_out/bv_refine_rochester.jpg`.

The exact score, triangle totals, annotation corrections and full-app checks are recorded in [the batch review](../REVIEW.md#batch-1-existing-module-refinement-and-bugbot-fixes). Reproduce with `bash tools/bv_build.sh --test`, `bash src/lm33/kit/browser.sh node tools/bv_refine_render.mjs after`, `python3 tools/bv_refine_score.py`, and `python3 tools/bv_refine_sheet.py`. The baseline is pinned to `a69f9f2`; original beauty captures must be made against that generated baseline page before rebuilding.

## Remaining gaps

Existing mall conservatory, tower spine and balcony construction remain approximate. No new street geometry in this control module.
