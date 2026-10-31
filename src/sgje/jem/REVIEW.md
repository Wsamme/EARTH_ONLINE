# Jem review

## Geometry and provenance

Registered as `sgje_jem`, anchored at 1.3331836346381178, 103.74339489404758. Exact OSM mall outlines ways 620519197 and 978644313, office plate way 368005256. Only original hand-built geometry; no photographic textures, tile geometry, logos or brand text.

The model separates the north/east retail enclosure from the lower western garden strip and southern annex. It includes staggered stone/metal facade cassettes, tall retail glazing and columns, openings under the elevated mall for the through-block routes, stepped planted terraces, skylights, pergolas, service plant, the exact office plate, mullions, projecting pale service blades, office slab edges, glass terrace rails, planted facade piers, and an open-sided L2 J-walk stub toward the MRT. The stub ends close to the footprint to avoid owning the station infrastructure.

The design was checked against SAA Architects' official photographs and project description, https://saaarchitects.com.sg/projects/jem (retrieved 2026-11-01). In particular `jem-key-1.jpg` shows the roof terraces/green office elevation and `jem-key-2.jpg` shows the low western landscape. The Commons `Jem_Mall.jpg` and `Jem_shopping_mall.jpg` show the opaque patterned mall enclosure and continuous office curtain wall. External files remain in `/workspace/je_photo_refs/jem/`; sources and attribution are recorded there.

## Height

Maximum **82.8 m**, from `/workspace/je_refs/jem/meta.json` (image-reference height measurement, available 2026-11-01). The metadata records ground 18.86 m and maximum roof 101.63 m ellipsoidal altitude; its rounded ground-relative maximum is 82.8 m, roof p90 77.9 m and median roof 30.5 m. The main office roof is therefore modeled around 78.3 m with taller screened plant at each end reaching 82.8 m, rather than filling the maximum-height envelope. The working 86 m estimate was replaced. Retail parapets remain 29.5 m, western garden strip 18.5 m, southern annex 29.5 m (internal levels are photograph estimates). The local label-height override matches 82.8 m; shared footprint stats remain provisional until the lead regenerates them.

Official context: Lendlease's annual report describes twelve office storeys, https://www.lendleaseglobalcommercialreit.com/siteassets/publications/2023/lendlease-ar2023-web.pdf . SAA confirms the completed design and ground/elevated through-block links, without a numeric building height.

## Night lighting

Directly inspected SAA official `jem-hero-1.jpg`, https://saaarchitects.com.sg/media/pages/projects/jem/ba5065c4e8-1705484288/jem-hero-1.jpg . It shows warm continuous soffit lighting beneath the office terraces, illuminated office floors, pale yellow-green luminous media glazing, and largely unlit opaque stone cassettes. The model uses batched luminous soffit faces and an abstract, slowly changing green/cyan media treatment through `lmMat` and the shared night uniform. Standard helper glass supplies occupied office/retail windows. No advertising content is reproduced. Also inspected Mediacorp/TODAY's dusk exterior (`cna_jem_dusk.jpg`; source in external SOURCES.md), which confirms warm retail glazing below the mostly dark patterned mall walls.

## Verification and known gaps

`node --check src/sgje/jem/jem.js` passes. The first geometry probe reported 18,410 triangles with zero nonfinite coordinates; this predates image-reference facade corrections. Full build, final runtime triangle count and matched-camera IoU will be appended after root runs the shared comparison.

The supplied n/e/s/w reference images were inspected as they arrived. They clarified that the planted long facade faces northwest and the two broad opaque service blades face southeast/east; those elevations were corrected. The southern retail triangle was raised to the same retail parapet height and its dark fan-slatted roof was added. Office slab edges now wrap its short southern elevation as seen in s.jpg.

Photo estimates remain for the precise terrace outlines, service blades and pergolas; planting is simplified. The real media installation is interactive; the model supplies only a calm abstract colour field. Ground-level openings represent the two routes but do not model a navigable interior. Individual tenants, escalator machinery, garden playground details and the full district bridge network are omitted. The OSM footprint is exact; those internal subdivisions are approximate.
