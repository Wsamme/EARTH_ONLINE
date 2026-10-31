# Indian Heritage Centre

OSM way 176326997, actual irregular plan. Four-storey gallery body, Campbell
Lane baoli glass front, stepped circulation rhythm, diagonal ground-floor
supports, tall carved stone entry portal, shallow steps, opaque side/rear gallery
walls with etched diagonal joints and small vertical windows, dark service fins,
planted roof terraces and stepped black service volumes. No second mural facade:
reference views show the southeast wall is predominantly opaque.

Measured maximum **22.4 m**, p90 **21.5 m**, p50 **20.5 m**, from
`/workspace/li_refs/indian_heritage_centre/meta.json`. Gallery/terrace edge 19.1 m,
lower dark roof 20.5 m, upper service volume 21.74 m, highest small plant 22.4 m.
**9,786 triangles**, five shared material batches. Shared JSON's 22 m is still
provisional; lead should replace it with the measured source metadata.

The mural consists of original geometric colour fields, figures and architectural
motifs behind tinted glass, with physical bronze lattice members in front.
No copied artwork, image textures, lettering, logos or external mesh assets.
Day glass has a stronger cool tint; it fades with the app's existing `uNight`
uniform to reveal the brightly lit mural after dark. This has no per-frame callback.

Night lighting reference, inspected and saved outside git:
https://www.ong-ong.com/projects/civic/indian-heritage-centre-singapore/ .
ONG&ONG's photograph shows a luminous coloured mural behind the dark baoli grid.
A dedicated vertex-colour-preserving lmMat batch supplies that lantern effect;
opaque service walls and roof stay quiet. Day reference:
https://commons.wikimedia.org/wiki/File:Indian_Heritage_Centre,_Singapore_-_20150423-01.jpg .
All photos/provenance are in `/workspace/li_photo_refs/indian_heritage_centre/`.
Public project authorship is Robert Greg Shand Architects / URBNarc.

## Validation and limits

Offline finite geometry and build syntax checks pass. r3 full-app and independent
detail tests of the day/night glass shader reported zero page and console errors;
no retired landmark types remained placed. A new measured-camera pass follows the
opaque-side and roof correction. Artifacts remain in `/workspace/eo_li_out/heritage/`.
The mural is an original geometric interpretation. Fine glass folds, carved portal
detail, roof joints and interior exhibits are simplified; exact garden planting
and plant equipment are estimates.

Final r7 matched-camera result: n **0.647**, e **0.689**, s **0.722**,
w **0.688**, top **0.860**, mean **0.721**; close NE 0.760, close SW 0.799,
street 0.854. Mean improved from r6's 0.716 after lowering the glass/terrace edge
relative to the roof services. The measured maximum remains 22.4 m. Remaining
boundary differences include the 3 m buffer, dense nearby shophouse occlusion and
simplified roof edges; no mass was expanded into the buffer. Page and console
errors are zero. Day/night detail views confirm the stronger day tint and glowing
front mural; the side wall stays opaque.

## Final verification snapshot

Round **r8**; 9786 triangles.

| n | e | s | w | top | close NE | close SW | street |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0.647 | 0.689 | 0.722 | 0.688 | 0.860 | 0.760 | 0.799 | 0.854 |

Mean n/e/s/w/top **0.721**; all-view mean **0.752**.

Final full-app comparison and independent day/night detail runs have **zero page
errors and zero console errors**; retired placement list is empty. Final images,
verification.json and li_iou.json are under `/workspace/eo_li_out/heritage/`, outside git.
