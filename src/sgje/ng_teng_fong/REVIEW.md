# Ng Teng Fong / Jurong Community Hospital

## Geometry and ownership

`ng_teng_fong.js` registers `sgje_ng_teng_fong`. All three original OSM
polygons are used in anchor-local metres, east positive and south positive:

- way 368005263: acute hospital / Tower B, including its rounded diagnostic podium;
- way 368005259: Jurong Community Hospital / Tower C;
- way 320763066: Specialist Outpatient Clinics / Tower A.

The three parts remain one labelled landmark. No additional labelled subkeys,
logos, model text, photographic textures, external meshes or runtime references.
The clinic-to-ward and ward-to-community links are original geometry. Entrance
sign panels are blank. No helipad is modelled: the available photos do not
establish one.

## Sources

Daytime form, balconies, stair drums, curtain wall framing, mixed green/white
vertical panels and entrance canopy are informed by the five Commons photos in
`/workspace/je_photo_refs/ng_teng_fong/`, especially Chainwit.'s 2025 img_01,
img_05 and img_08 and Joey Foo's 2016 view of the linked complex. Attribution,
dates and licensing are recorded in the external SOURCES.md.

Published floor counts: the hospital's [2021 corporate brochure](https://www.ntfgh.com.sg/docs/ntfghlibraries/content-document/about-ntfgh/jhc-corporate-brochure_jun-2021_web.pdf?sfvrsn=ec17a85b_1)
gives eight clinic levels and sixteen acute-hospital levels. The
[structural project report, CONNAECT 2015](https://www.bbrnetwork.com/fileadmin/userdaten/CONNAECT/CONNAECT_2015.pdf)
identifies sixteen acute, eight SOC and twelve community-hospital storeys.
Floor counts are not surveyed heights. The elevated [CPG exterior view](https://cpgcorp.com.sg/wp-content/uploads/2024/11/Ng-Teng-Fong-GH-Aerial-View.jpg) confirms that the ward end toward the clinic is substantially lower; the model therefore limits the 75 m crown to the southeast portion rather than extending it over the entire long plate.

Night lighting is cross-checked against HOK's **Ng Teng Fong Hospital Close Up
Night**, linked in its [27 March 2025 anniversary article](https://www.hok.com/news/2025-03/ng-teng-fong-general-hospital-celebrates-10-years-of-sustainable-design-excellence/).
This shows pale lit glazing, distinctly warmer terrace soffits, dark planted
bands and an unlit pale crown. The model uses shared batched `lmMat` surfaces,
cool varied window-grid lighting, warmer canopy soffits and blank entrance
panels. No floodlit green facade, coloured spectacle lighting or red helipad.
The article's warm close-up is not proof of exact ward occupancy or every
entrance's light colour; these remain approximations. Downloaded HOK references
and their URLs are recorded only in the external photo folder.

## Initial assumptions (pending measured references)

The shared footprint file currently gives a provisional 75 m maximum. Initial
geometry uses 75 m at the acute-hospital crown, 71 m at the taller ward roof,
54.35 m at the lower wing, 49.5–50.6 m at community wards/roof edge, 34 m at the
clinic and 17 m at the common podium. Lower heights are floor-count and photo
estimates, not official measured elevations. Roof plant is schematic. Balcony planting is simplified into small green clusters and deep continuous planter bands. The repeated sawtooth bays, rail strips and round stair landings are locally constructed geometry.

## Verification

- `bash tools/bv_build.sh --test`: passes assembled-app syntax validation.
- Offline construction with the same THREE r128 and shared Batch helper:
  **53,775 triangles, three material batches, no non-finite positions**.
  Tight concave ward corners use scaled inner rings to avoid miter spikes.
  Local bounds: x −200.135 to 183.650 m, z −177.711 to 139.641 m,
  y −0.5 to 75 m before the standard terrain-base adjustment.
- Initial full-app day/night renders: zero page errors and zero console errors.
  Final current-geometry SW day/night, NE day and close day review also pass:
  **zero pageErrors, zero consoleErrors**, 53,775 runtime triangles. The close
  views confirm removal of the concave-corner offset sheets. Final images and
  verification are in `/workspace/eo_je_out/health/final/`.
- Prescribed `je_compare.mjs ng_teng_fong --round r1` was attempted. Its
  app verification also records zero page/console errors and 53,775 triangles,
  but it prints `no refs for ng_teng_fong` and the scorer exits 1 with
  `FileNotFoundError: /workspace/je_refs/ng_teng_fong/meta.json`.
  `renders/r1/verification.json` therefore has no matched-camera views.
  N/E/S/W/top, close NE/SW and street IoU: **unavailable**; mean: **unavailable**.
  No score or silhouette improvement is claimed.

Run the owned optional review helper with the built app served locally:

```sh
URL=http://127.0.0.1:8053/ bash src/lm33/kit/browser.sh node tools/je_health_review.mjs
```

Outputs stay outside the repository, under `/workspace/eo_je_out/health/review`.
The helper records runtime statistics and reference-camera availability; its
four photo-review cameras are not used to manufacture IoU metrics.

## Known gaps

Until `ng_teng_fong/meta.json` and its clipped reference images are delivered,
N/E/S/W/top IoU and mean IoU cannot be measured and heights remain provisional.
The model needs a matched-camera massing pass when those images become
available. Internal tower setbacks, minor rooftop plant, ward balcony planting
and individual window occupancy are simplified. Link elevations and canopy
positions are photo estimates rather than surveyed dimensions. No shared code
change is required; the lead should regenerate shared footprint heights once
measured elevations are available.
