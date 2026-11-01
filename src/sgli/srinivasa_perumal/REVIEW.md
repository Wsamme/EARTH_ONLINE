# Sri Srinivasa Perumal Temple — round 2 final

All five supplied OSM parts are used: 481614952, 454182405, 454182408,
454182454 and 455155906. Replaces `srinivasa`. The oversized landuse 686747406
is not a building slab. The low tagged 481614952 building is northeast of the
actual gateway; it is not the gopuram. The five-tier gateway remains at about
**+37.5 m east / +24.5 m south** of the anchor, facing east toward Serangoon Road
(image-based placement, approximately ±2 m). Painted figure bands now have
rounded low-poly heads, tapered robes, lit arms and central dark shrine recesses.

External meta.json: max **18.0 m**, p90 **15.6 m**, p50 **7.5 m**. Model crown
18.0 m; PGP Hall (455155906) eaves 14.8 m / shallow roof 15.4 m; low halls
6.8–7.9 m. PGP Hall's three storeys and floral panels follow official HEB photos:
https://pgphall.sspt.org.sg/HEB/Template3/about-pgp-hall .

Night photo: Ahboy's Deepavali guide,
https://ahboy.com/where-to-celebrate-deepavali-in-singapore/ , saved `night.jpg`.
Warm golden tier floodlight, darker blue-grey base, gently lit guardians/door and
small bright lintel follow that photo. PGP dusk reference is the official
https://pgphall.sspt.org.sg/Content/Uploads/Banners/PGP5-3.jpg . Sources/photos
remain in `/workspace/li_photo_refs/srinivasa_perumal/` outside git.

Known gaps: supplied references show temporary roof/tower shrouds; permanent
sculpture remains visible in the model. The actual gateway is partly outside the
supplied footprint masks. The scorer fills between separate parts even in top
view, adding **39,430 pixels / 16.9%** of its filled reference area. Official top
IoU remains **0.624**; raw unfilled **0.743** is diagnostic only. No courtyard or
car park was filled with fake building geometry. Some close views are obscured
by adjacent generic buildings. Lead should include the gateway in the reference
mask and disable column filling for top views. Fine iconography/interiors remain
simplified; mean is unchanged at **0.719**.

## Final validation

**84,654 triangles**, 5 shared material batches.

| n | e | s | w | top | close_ne | close_sw | street |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0.792 | 0.692 | 0.715 | 0.772 | 0.624 | 0.773 | 0.772 | 0.767 |

Mean n/e/s/w/top **0.719**; all-view mean
**0.738**. Final matched-camera run: **r2lighting**.

`bash tools/bv_build.sh --test` and the offline finite-geometry check pass.
Matched-camera and independent detail checks have **zero page errors and zero
console errors**, with no retired landmarks still placed. Results, overlays,
comparison sheets, geometry and verification JSON stay under
`/workspace/eo_li_out/heritage/`, outside git. References/photos are never runtime
assets. No logos, brand text, photographic textures or external meshes are used.

Lead branch was merged without rebasing; its Deepavali `noHull` fix remains.
No shared source/data files were edited by this round-2 worker work.

## Round 3 — local Street View pass

Inspected the 2024-06 gateway view 01 and the newer 2026-04 views 02/03.
The newer views are mostly tree-obscured; they do not establish new sculpture
colours. Kept the five diminishing tiers and 18.0 m measured crown. Narrowed the
gateway base from 13.3 to 10.4 m and aligned it to the Serangoon Road frontage
rather than almost north/south. Recessed opening remains 3.1 by 5.15 m; base
height 6.6 m. Upper bands are quieter grey/lilac, with small coloured figures.

Restoration hoarding is temporary and is not modelled. Permanent wall wings,
gateway, halls and compound remain; no courtyard was filled. Existing saved
Ahboy night photo is still the lighting reference. Exact iconography and
obstructed 2026 paint scheme remain unresolved. Nearby generic trees obscure
much more of the model gateway than the real 2024 camera; vegetation is outside
heritage ownership and has not been edited.

Round-3 night cross-check: re-inspected the saved external night photograph
listed above; reference remains outside the repository and no photographic
texture is used.
