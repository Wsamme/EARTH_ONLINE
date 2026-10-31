# Sri Srinivasa Perumal Temple

Replaces `srinivasa`; compound anchor stays unchanged. All five supplied OSM parts
are used: 481614952, 454182405, 454182408, 454182454 and 455155906. The oversized
landuse way 686747406 is not used as a building or courtyard slab.

The full image set disproved the inherited old anchor: **481614952 is a low
ancillary building northeast of the main entrance, not the gopuram**. It is a
4.8 m building on its real footprint. The permanent five-tier gopuram is beside
the southeast hall at approximately **+37.5 m east / +24.5 m south** of the anchor
(visual image fit, roughly ±2 m). Painted geometric deity bands, guardian figures,
sala crown and seven finials, timber doors, short striped wall wings, flagstaff
and a narrow covered link to the mandapam replace the old isolated generic tower.

455155906 is **PGP Hall**, verified against HEB's official three-storey description
and venue photographs: https://heb.org.sg/sspt/ and
https://pgphall.sspt.org.sg/HEB/Template3/about-pgp-hall . It has 14.8 m eaves,
a shallow 15.4 m roof, pale floral relief, glazing bands and a projecting canopy.
Other mapped halls have 6.8–7.9 m eaves, arched verandahs and small sanctums.

Measured metadata: maximum **18.0 m**, p90 **15.6 m**, p50 **7.5 m**, from
`/workspace/li_refs/srinivasa_perumal/meta.json`. Model crown is 18.0 m; the source
mask partly excludes the actual gateway, so its own height remains uncertain.
PGP roof agrees with p90 and low halls agree with p50. The shared data's 21 m
provisional height is NOT the final model height; lead should regenerate it.

Night photo: Ahboy's Deepavali photograph, warm tower floodlighting and a lit
entrance: https://ahboy.com/where-to-celebrate-deepavali-in-singapore/ .
PGP Hall's official dusk exterior supports warm entry-canopy/window lighting:
https://pgphall.sspt.org.sg/Content/Uploads/Banners/PGP5-3.jpg . Day and night
photos/provenance stay outside git in `/workspace/li_photo_refs/srinivasa_perumal/`.
No texture images, lettering, logos or extracted meshes are used.

## Validation and limits

Offline finite geometry validation passes. **70,954 triangles** in four shared material batches.
The r3 full-app run and independent detail run had zero page and console errors,
and no retired landmark types remained placed. r3 scores (before the gateway
location correction): n 0.790, e 0.736, s 0.679, w 0.759, top 0.633, mean 0.719.
These do not certify the corrected gateway; a new comparison follows.

The actual gateway extends outside the supplied mapped temple outlines. The
reference mask therefore clips part of it. The scorer also column-fills between
separate footprint parts **even in the top camera**, marking some car-park and
courtyard gaps as occupied. Those gaps have not been filled with invented geometry.
Temporary construction shrouds in the references are omitted from the permanent
model. Sculpture and hall interior carving are geometric abstractions.

Lead action: review the role of 481614952, include the actual gateway in the
reference mask, and disable column filling for top views before final acceptance.

Final r4 matched-camera comparison after the gateway correction: n **0.792**,
e **0.692**, s **0.715**, w **0.772**, top **0.624**, mean **0.719**; close NE
0.773, close SW 0.772, street 0.767, all-view mean 0.738. Main mean is unchanged
from r3 while close views improve. All page/console errors are zero; retired
placement check is empty. The top view diagnostic **without** column filling is
0.743, confirming the mask limitation; the official reported score remains 0.624.
OSM API map read also found no separate mapped gateway footprint near the entrance:
https://www.openstreetmap.org/way/481614952 . No shared footprint was edited.

## Final verification snapshot

Round **r8**; 70954 triangles.

| n | e | s | w | top | close NE | close SW | street |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0.792 | 0.692 | 0.715 | 0.772 | 0.624 | 0.773 | 0.772 | 0.767 |

Mean n/e/s/w/top **0.719**; all-view mean **0.738**.

Final full-app comparison and independent day/night detail runs have **zero page
errors and zero console errors**; retired placement list is empty. Final images,
verification.json and li_iou.json are under `/workspace/eo_li_out/heritage/`, outside git.

## Round 2

Rechecked all supplied views and actual day/night photos. Retained the gateway
at +37.5 east/+24.5 south, facing east toward Serangoon Road, separate from the
low 481614952 ancillary building. Height remains 18 m (measured metadata max),
PGP roof 15.4 m against p90 15.6 m. The reference contains temporary tower/roof
shrouds, which are not permanent architecture. The model keeps the five painted
tiers, now with central dark shrine recesses, and the photographed darker blue-grey
base. Ahboy's saved night photo supports a stronger warm golden tier wash and
white entrance lintel lamp. Full-compound roof/courtyard geometry is retained;
no car park or courtyard was filled to match the scorer's column filling.
Offline geometry passes. Updated matched-camera results follow below.
