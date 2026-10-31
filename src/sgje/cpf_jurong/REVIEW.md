# CPF Jurong Building

Original batched geometry on OSM way **103752945**, anchored at the supplied
1.3350171464 N, 103.7398071020 E. No subkeys, textures, logos or text.

## Evidence and construction

The real building has a green lower frontage, white upper wall and cornice,
paired rectangular office windows, ornamental circular lower windows within
square frames, tall ground-floor openings and a large arched end portal. These
are modelled as geometry around the curved OSM front, with quieter rear windows,
render joints, roof parapets and compact service plant.

Exterior photographs inspected (reference only, outside repository):
- `/workspace/je_photo_refs/cpf_jurong/citicommercial.jpg`,
  https://www.citicommercial.com.sg/properties/details/2283
- `/workspace/je_photo_refs/cpf_jurong/jll.png`,
  https://property.jll.com.sg/office-lease/singapore/west-zone/cpf-jurong-building-sgp-p-0003vo

The JLL written description incorrectly says 12 storeys, contradicted by its
own exterior photo. The brief and visible facade establish the low-rise form;
https://www.corporatelocations.com.sg/office-for-rent/building/647/CPF-Jurong-Building/
lists 4 storeys (its prose says 3). Window levels follow the photographs.

## Height and verification

Measured reference maximum **22.5 m** from
`/workspace/je_refs/cpf_jurong/meta.json`, roof-minus-ground, ground 17.11 m
ellipsoidal. Main roof **17.4 m** follows the measured median, with the curved
inner roof wall about 21.8 m and rear service parapet at 22.5 m. Authored facade
levels are normalised from 20 m to 17.4 m while the raised rear core is independently
sized for the maximum. The reference top view informed the recessed courtyard,
inner curved wall, rear core and three air-conditioning banks; every vertex is
original hand-authored geometry, not extracted mesh data.

Offline geometry: **6,957 triangles**, finite vertices and zero degenerate
triangles. Matched-camera results and remaining fit limits are recorded below.

## Night and remaining gaps

No genuine exterior night photograph has been located. The model uses the shared
lmMat office/retail window shader on recessed glazing; the solid green/white
facade stays unlit. This conservative night treatment is **unverified**, not a
claim of a documented architectural lighting scheme. Fine portal locations,
rear service layout, roof equipment and unphotographed elevations are estimates.

## Matched-camera review

Final combined round `final`, after correcting the arched portal to the east return. All eight day
views and the south/close southwest night views rendered successfully, with
`pageErrors=[]` and `consoleErrors=[]`.

| View | IoU |
| --- | ---: |
| North | 0.815 |
| East | 0.793 |
| South | 0.849 |
| West | 0.804 |
| Top | 0.819 |
| Close northeast | 0.899 |
| Close southwest | 0.908 |
| Street | 0.849 |
| Mean north/east/south/west/top | **0.816** |
| Mean all eight | **0.842** |

The red perimeter in the visually inspected overlays is chiefly the reference's
3 m footprint buffer, tree geometry and neighboring surfaces at clipped margins.
The actual OSM outline is retained rather than enlarged to cover those pixels.
The inward courtyard and service roof remain approximate, hand-authored
interpretations of the image views. Model day, night and top views were inspected;
no further massing change is justified by these residuals.

The reference metadata marks the street capture `tiles_settled:false`; its
photogrammetric detail is less reliable than the other seven settled views.
