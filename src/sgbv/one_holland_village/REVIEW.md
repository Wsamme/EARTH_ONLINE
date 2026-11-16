# One Holland Village — Batch 2

## Identity and evidence correction

Main mall: OSM way **1226724186**, anchored at 1.311093092, 103.794183612.
The supplied `(61)` photograph depicts **Holland Piazza**, visibly identified by
its sign. Its undulating colourful facade must not be attributed to this mall.
The supplied parent `ohv/SOURCES.md` has that association wrong; it is retained
outside git as supplied. No Piazza geometry is added in this batch.

The correct OHV artwork is *Interlude*: suspended coloured steel fins under the
public courtyard canopy. [ERCO / SWITCH's lighting account](https://www.erco.com/en/inspiration/projects/interlude-by-tomislav-topic-one-holland-village-singapore/)
describes paired column-mounted upward 3000 K wash, 410 steel panels and 41
colours. [Vantaly's installation photographs](https://www.vantaly.com/en/project/68622cb530cb4c0020457a86)
were inspected directly. The model interprets the colour-field with 205 inexpensive
coloured quads, rather than claiming an exact artwork reconstruction. There is
no exterior undulating multicolour fascia copied from Holland Piazza.

## Footprints, levels and height limits

The OSM extract `/workspace/bv_data/map_ext.osm` confirms the northern positions and tags:

| Part | OSM way | Evidence and model envelope |
| --- | --- | --- |
| Retail / offices | 1226724186 | Three retail storeys; office portion up to seven floors at the residential end; model office roof 28.5 m |
| Sereen | 1115524529 | Named residential, 34 levels; model maximum 112 m, **estimated metres** |
| Quincy | 1115524527 | Address 5 Holland Village Way, north of mall; associated with Quincy using the official address and development layout; 28 floors, model 98 m, **estimated metres** |
| Leven | 1115524518 | Named Leven, address 3, northern low-rise footprint; three floors plus terrace; model roof 12 m with planting above |

[Far East Organization's 2023 release](https://www.fareast.com/globalassets/media-library/fareast/aboutus/newsroom/press-release-pdfs/20230111-OHV-Residences-achieves-80-per-cent-sales.pdf)
provides the official floor counts, Sereen's 2.9 m clear ceilings, Leven's 3.35 m
clear ceilings, Quincy private residences L21–L28, serviced residences L1–L19,
and offices L4–L7. Clear ceiling height is **not** floor-to-floor height.
The 112/98/12 m envelopes use explicit slab/service allowances; they are not
surveyed roof heights or official metre elevations. Exact official tower metres
were not found in the inspected primary sources. No stale tile height is reused
as an OHV building measurement.

Candidate way 1226724187 is south of the main mall at approximately
1.310012, 103.794345. It is not a northern residential tower and is left unchanged.
The towers and Leven use their verified OSM outlines, removing only sub-metre
zigzag details. The residential towers are furthest from the old shophouses.

## Architecture and night appearance

The low-rise model uses white slab edges, darker set-back shop glazing,
colonnades, varied awnings and balcony rails. The OSM main outline encloses
pedestrian space as well as retail; the model leaves open shopping streets and
adds a photo-interpreted internal retail bar. Its internal plan, bridge and
terrace arrangement are approximate. Steps, planter beds, benches and sky-garden
strips add street scale without lettering, tenant logos or photo textures.

The [operator factsheet](https://www.fareastmalls.com.sg/globalassets/media-library/Project/RBG/shared/Factsheets/Mall-Factsheet_Holland-Village.pdf)
supports three-storey retail with dual-frontage units. [Vector Foiltec](https://www.linkedin.com/posts/vector-foiltec_this-texlon-etfe-canopy-acts-as-a-community-activity-7208468788734783490-Ysfv)
documents the 540 m² ETFE canopy. The model uses a 30 × 18 m canopy plan with
lightweight pitched cells and a white steel frame. Its exact siting, pitch and
panel pattern are photo estimates, not construction drawings.

[Plantwerkz's project photographs](https://www.plantwerkz.com/one-holland-village)
were viewed for planted terraces, steps, restrained white/grey architecture and
warm corridor lines at night. The model uses the existing night factor for warm
linear lights, shopfront/window occupancy, soft canopy glow and warm illumination
of the suspended colour-field. ERCO documents the artwork's 3000 K upward wash;
emissive shading is a cheap visual approximation, without real photometry or
physical light transport. Residential occupancy is inferred. Public lighting
remains on throughout app night; no live opening-hours or event schedule is used.

## Camera checks and limitations

**Tile IoU is unavailable.** The supplied tiles predate the development and show
field/carpark context. Their 38.5 m roof sample and the metadata's old “up to
~10 storeys” wording are invalid for the current project. The original cameras
are retained only to review site context and ground datum; several crop the new
towers. A separate wider model overview covers the full residential zone.

Photo comparisons use the supplied LN9267 `(40)` courtyard photograph
([Commons, CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Holland_Village_13-05-2024(40).jpg)),
Plantwerkz day/night photographs and Vantaly's canopy installation view.
The camera positions are **approximate**, recorded by `bv_batch2_render.mjs`.
A labelled photo/render outline overlay is a visual diagnostic, not a surveyed
alignment or quantitative photo IoU. Photo borders, vegetation and retail
openings are partly occluded; the full outer/tower envelope is unobserved.

The first street/photo camera fell inside a wall and was rejected. The next
round moved into the open courtyard; the final model adds the inner retail bar,
warm corridor strips and a broader overview. Exact upper tower balcony patterns,
site levels, terraced circulation and internal mall masses remain simplified.
This is an original procedural approximation, not a photographic replica.

Supplementary Plantwerkz/Vantaly photographs remain copyright their sources;
no open licence is claimed. They are used in local review outputs only, never
committed, shipped as textures or attached to the PR. ERCO credits Shiya Creative
Studio for its photographs. Original download URLs are recorded outside git in
`/workspace/bv_photo_refs/ohv/verified/download_sources.json`.

See [the area review](../REVIEW.md#batch-2-two-holland-village-malls) for final
triangles, browser checks and output paths.
