# Holland Piazza — Batch 3

OSM way **152752624**, anchor **1.310724717, 103.795249567**, is the small mall
between Lorong Liput and Holland Avenue beside Holland Road Shopping Centre.
The exact OSM outline comes from `/workspace/bv_data/map_ext.osm`. Its 17 plan
vertices preserve the bent long sides and rounded northern end. The supplied
roof-minus-ground measurement is **39.1 − 27.0 = 12.1 m** (ellipsoidal datum).
OSM's two levels / 9 m is below this full envelope, which includes the roof tier.

## Shape, facade and night treatment

The current building is visible in [LN9267's photograph (61), CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Holland_Village_13-05-2024(61).jpg).
Although supplied in the OHV reference directory, its visible sign identifies
Holland Piazza. It was viewed directly, alongside the Holland Village street
photographs. It is not One Holland Village, and the colourful exterior is not
OHV's suspended *Interlude* artwork.

The model uses broad lower shopfront and upper glazing bands, a recessed ground
arcade, slim columns, external stairs, awnings and warm corridor strips. A
separate merged batch supplies an original, muted yellow/ochre/pink panel pattern
with a gently undulating top and lower edge. It has no lettering, logos,
advertisements or photograph textures. The panel layout is an interpretation,
not a measured replica of each small facade panel.

The three-tier reading uses two broad glazed levels and a smaller setback roof
accommodation/plant tier beneath the 12.1 m envelope. Individual floor use and
roof equipment placement are approximate. The first model made the roof block
too large and buried the planting; the revision reduces it to a smaller northern
block and exposes the roof garden. The real OSM outer plan and maximum height
remain fixed. Thin lights share a material and stop casting shadows after the
app's mesh merge. Warm interiors and canopy emission follow the existing night
factor. No current licensed night photograph was supplied, so these lighting
intensities and occupancy patterns are explicitly inferred, not photometric.

## Tile fitting and limitations

The local tiles show **construction-stage hoarding and incomplete roof surfaces**.
They remain useful for the named footprint and general envelope, but are not a
completed-facade material reference. The model represents the finished photo
rather than reproducing blue hoarding, torn tile triangles or construction debris.

All 14 recorded poses in `meta.json` are rendered in day and night. Five views
have fixed, manually drawn photo masks: N/W/top visible envelopes and E/S upper
crops that exclude foreground HRSC/adjacent roofs. The street boundary is hidden
by tile fractures and an adjacent red building, so its IoU is unavailable. Eight
orbit views are visual checks. Unrecorded close-image files have no camera pose
in this metadata and are not falsely called exact-camera renders.

`tools/bv_batch3_annotations.json` was fixed before inspecting the first model
comparison and is unchanged for both rounds. Reference masks are never generated
from the model. Boundary uncertainty is roughly 5–10 pixels at 800 px annotation
width. IoU checks occupied silhouette, not panel placement or finished-shopfront
fidelity. The approximate photo (61) camera uses selected context suppression
for visibility; the exact tile poses retain full context.

The final per-view scores, counts and browser checks are in
[the area review](../REVIEW.md#batch-3-holland-piazza-and-elementum).
Differences remain in fascia curvature, roof layout, individual panels, internal
retail depth and landscaping. The construction-stage metric cannot validate the
finished facade by itself. No reference photos or render outputs are committed.
