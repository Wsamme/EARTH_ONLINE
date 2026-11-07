# Metropolis — Batch 1 review

## Unequal floor bands and entrances

English-only label: The Metropolis. Fusionopolis One retains 启汇城一期. The two tower envelopes use 113.4 m / 104 m heights, with unequal floor-band offsets and skewed ribbon setbacks. Glazed floors, darker spandrels, low entrance canopies and planter beds replace uniform repeated box treatment.

The shared materials are cached per landmark build and use one small procedural cube environment, with no external image textures. Existing mullion geometry remains. The three focus modules receive street work; control modules retain their established entrances and geometry.

## References and validation

Six supplied local-reference cameras (N/E/S/W/top/street) are captured before and after through the real r128 appshot/browser-lock flow. `meta.json` supplies the camera; the existing street fallback is `/tmp/bv/cams.jsonl`. No Google tiles are loaded and no reference meshes are extracted. Images remain outside git. The corresponding sheet is `/workspace/eo_codex_out/bv_refine_metropolis.jpg`.

The exact score, triangle totals, annotation corrections and full-app checks are recorded in [the batch review](../REVIEW.md#batch-1-existing-module-refinement-and-bugbot-fixes). Reproduce with `bash tools/bv_build.sh --test`, `bash src/lm33/kit/browser.sh node tools/bv_refine_render.mjs after`, `python3 tools/bv_refine_score.py`, and `python3 tools/bv_refine_sheet.py`. The baseline is pinned to `a69f9f2`; original beauty captures must be made against that generated baseline page before rebuilding.

## Remaining gaps

Offsets are interpreted from the supplied imagery; they are not surveyed balcony dimensions. Reflections, tenant interiors and roof plant remain approximate.

Real photographs are listed in the local `/workspace/bv_photo_refs/existing/SOURCES.md`. [Erwin Soo, rainy evening (CC BY 2.0)](https://commons.wikimedia.org/wiki/File:The_Metropolis_and_the_MOE_Building,_Singapore,_on_a_rainy_evening_-_20130303.jpg) informs the glass/opaque balance. No unsupported Chinese name is supplied.
