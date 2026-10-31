# Sri Veeramakaliamman Temple — round 2 final

OSM 155991884 hall and 1078263462 annex; replaces `sgveeramakali`.
The four-tier gateway now straddles the actual east/southeast Serangoon Road wall
at local z=24.1, 3 m farther toward the road than round 1. Entrance and white
canopy move with it. Main Kali vimana remains above the sanctum by the annex,
with four smaller side shrines, striped walls, parapet relief, green ribbed roof,
barrel skylight, red side-bay roof, flagstaff and six-storey annex.

Measured max **27.1 m**, p90 **23.8 m**, p50 **7.2 m**, from the slug's external
meta.json. Model maximum **26.9 m**, annex parapet 24.6 m, hall 7.2 m and gateway
18.9 m. These are distinct elements; the gateway is not made 27.1 m tall.

Round-2 relief has tapered robes, low-poly rounded heads/crowns and bent arms.
The local beam helper routes arms through the sculpture material, avoiding dark
arms on lit bodies. Shared lmMat batches separate warm tier wash, gentler
blue-grey gateway/verandah wash and small entrance/canopy lights. Night exposure
was reduced after an initial capture clipped the pale sculpture.

Night photograph: ScribblingGeek, 7 October 2020, CC BY-SA 4.0,
https://commons.wikimedia.org/wiki/File:Sri_Veeramakaliamman_Temple.jpg .
Re-searched and re-inspected before round-2 lighting work; saved `night.jpg` and
SOURCES.md are in `/workspace/li_photo_refs/veeramakaliamman/`.

Known gaps: relief remains an architectural abstraction rather than individual
iconographic statues. Annex service layout is simplified. Nearby trees obscure
part of the entry in some beauty views. Mask differences include the 3 m buffer
and neighbouring geometry; no shell was enlarged to fill that buffer.
Mean improved **0.805 → 0.811**, south **0.767 → 0.792**.

## Final validation

**51,618 triangles**, 5 shared material batches.

| n | e | s | w | top | close_ne | close_sw | street |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0.815 | 0.808 | 0.792 | 0.811 | 0.830 | 0.866 | 0.819 | 0.788 |

Mean n/e/s/w/top **0.811**; all-view mean
**0.816**. Final matched-camera run: **r2lighting**.

`bash tools/bv_build.sh --test` and the offline finite-geometry check pass.
Matched-camera and independent detail checks have **zero page errors and zero
console errors**, with no retired landmarks still placed. Results, overlays,
comparison sheets, geometry and verification JSON stay under
`/workspace/eo_li_out/heritage/`, outside git. References/photos are never runtime
assets. No logos, brand text, photographic textures or external meshes are used.

Lead branch was merged without rebasing; its Deepavali `noHull` fix remains.
No shared source/data files were edited by this round-2 worker work.
