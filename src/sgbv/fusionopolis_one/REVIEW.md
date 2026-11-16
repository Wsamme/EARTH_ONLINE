# Fusionopolis One — Batch 1 review

## Three separate towers and crowns

Kept the outer plan while recessing the multi-floor sky gardens between the three plates. Connexis North, Connexis South and Symbiosis now have different crown sweeps, glazing rhythms and bridge/cage depths. Physical gaps and connecting bridges remain legible from the matched east/north cameras. Small entrance canopies, recessed glazing and planter beds meet the podium edges.

The shared materials are cached per landmark build and use one small procedural cube environment, with no external image textures. Existing mullion geometry remains. The three focus modules receive street work; control modules retain their established entrances and geometry.

## References and validation

Six supplied local-reference cameras (N/E/S/W/top/street) are captured before and after through the real r128 appshot/browser-lock flow. `meta.json` supplies the camera; the existing street fallback is `/tmp/bv/cams.jsonl`. No Google tiles are loaded and no reference meshes are extracted. Images remain outside git. The corresponding sheet is `/workspace/eo_codex_out/bv_refine_fusionopolis_one.jpg`.

The exact score, triangle totals, annotation corrections and full-app checks are recorded in [the batch review](../REVIEW.md#batch-1-existing-module-refinement-and-bugbot-fixes). Reproduce with `bash tools/bv_build.sh --test`, `bash src/lm33/kit/browser.sh node tools/bv_refine_render.mjs after`, `python3 tools/bv_refine_score.py`, and `python3 tools/bv_refine_sheet.py`. The baseline is pinned to `a69f9f2`; original beauty captures must be made against that generated baseline page before rebuilding.

## Remaining gaps

Crown sweep and garden truss positions are approximate. Recesses improve separation but do not reproduce every full-depth slot or internal structure.
