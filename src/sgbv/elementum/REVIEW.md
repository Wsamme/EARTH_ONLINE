# Elementum — Batch 3

OSM way **981964001**, anchor **1.306377973, 103.792762555**. The footprint is
from `/workspace/bv_data/map_ext.osm`; it spans about 91 × 102 m. Its exterior
outline includes the podium and is not itself a surveyed upper lab-floor plan.
The original procedural upper plates therefore use a photo-interpreted U with
one progressively retreating arm. No Google meshes are loaded or extracted.

## Conflicting heights: explicit choice

| Source | Published information | Modeling decision |
| --- | --- | --- |
| [SOM project page](https://www.som.com/projects/biopolis-phase-6-at-one-north/) | 63 m, 12 storeys, 2023 project year | Use the architect's **63 m main envelope and 12-level organization** |
| [CTBUH / Skyscraper Center](https://www.skyscrapercenter.com/building/elementum/50970) | 92.6 m architectural/tip, 76 m highest occupied level, 13 floors, completion 2024 | Retain as unresolved conflicting metadata; do not silently merge it with SOM |
| Supplied old tiles | 21.7 m roof-minus-ground | Pre-development context, not a current building height |

Adding stacks above a 63 m roof would not reconcile CTBUH's 76 m occupied level.
The supplied exterior photographs do not show a separate 29.6 m exhaust tower
that justifies reaching 92.6 m. The model therefore does **not** invent one.
This choice is a source-priority judgment, not proof that the CTBUH figure is
wrong or an independently surveyed as-built height. The discrepancy remains a
review item. OSM's 12 levels supports the SOM organization.

## Architecture and public realm

The model leaves more than half of the ground forum open, using columns,
service cores, set-back retail glass and entry links rather than a solid plinth.
The L2–L3 podium reaches **18 m**, with an open skylight and a modeled **900 m²
roof-garden surface**. That area is computed from the actual triangulated garden
mesh after subtracting its smaller skylight opening. The plan shape, aperture
size and planting arrangement are estimates; the official area does not imply
that this inferred plan is surveyed.

Nine upper lab intervals complete the 12-level organization and terminate at
63 m. The western arm retreats floor by floor, exposing terraces. Sloping
aluminium eaves, intermediate fins and finer glazing bands distinguish it from
an ordinary office block. Shared physical materials provide restrained blue-grey
glass, pale metal and a small procedural reflection environment. The fine facade
bands are not extra occupied storeys. No signage, company logos or model text.

The first render had overly coarse horizontal bands and an oversized rectangular
garden overlapping the lab footprint. Refinement adds intermediate fins and
reshapes the 900 m² garden into the open U around a smaller skylight. Planters,
paths and planting are kept in visible court space. Public steps, an entry
bridge and low planters connect the building to the approximate Rail Corridor
edge; they do not alter the other landmark modules.

## Lighting and photographic evidence

[LUCI's Elementum project account](https://www.luci.co.jp/led/en/gallery/Elementum/)
credits DCA Architects, lighting designer Light Collab and ND Photography, and
specifies 3000 K wall grazing/washing. Its lobby photograph was downloaded and
viewed locally. It supports warm stone/soffit treatment; it is **not an exterior
night survey**. The model approximates this with night-gated lower-level emission,
warm soffit lines and grazing strips. Lab window materials use a separate cool
white tint and varied occupancy. Their external night intensity/occupancy is
inferred. The model adds no sky beams, media facade or new post-processing.

The supplied SOM photographs by **Marc Tan / Studio Periphery** were inspected:
01 (rounded outer elevation), 08/11 (U and setbacks), 16 (roof garden), and 19/20
(entry and atrium/skylight). CTBUH also credits Marc Tan / Studio Periphery and
Kevin Siyuan / Shiya Creative Studio; the latter interior photograph was checked
for lab scale, not used as an exterior texture. All photographs retain source
copyright and remain reference-only, outside git and production assets.

## Photo checks, cameras and honest limits

**Tile IoU is unavailable.** The supplied tiles predate Elementum; a field or
construction remnant cannot validate its current silhouette. All 14 recorded
poses are retained for ground/context comparison only. Separate approximate
front, setback, roof-garden and atrium cameras compare against the real photos.

Initial positions inside a neighbouring building or the lab edge were rejected.
The accepted garden camera lies in the open U, and the accepted front/setback
positions sit outside the footprint. Selected streamed/synthetic context and
non-reference landmarks are hidden only in approximate photo diagnostics to
avoid false foreground blockage; Elementum and the adjacent Metropolis remain.
Some separately generated road/rail/vehicle context can remain. The original
reference-camera views and hero retain normal full-app context.

`elementum_photo_check.jpg` shows manual reference outline guides, the rendered
boundary and an unregistered blend. The render is centre-cropped to the same
16:9 frame, with no alignment warp. It is a visual diagnostic, **not quantitative
photo IoU or a surveyed camera match**. The rounded facade, U, terraces, open
forum and canopy are represented, but exact opening proportions, setback depths,
cladding joints, landscaping and public-space levels still differ. Metre-height
uncertainty and the conflicting source data remain explicit.

See [the area review](../REVIEW.md#batch-3-holland-piazza-and-elementum) for final
triangle counts, verification and local output paths. No images are committed
or attached to PR #5; its body remains unchanged.
