# Sri Veeramakaliamman Temple

OSM 155991884 (hall) and 1078263462 (annex), replacing `sgveeramakali`.
Low striped hall, sculpted parapet shrines, four-tier painted gateway, Kali
vimana with domed crown, smaller sanctums, green ribbed roof, barrel skylight,
white entrance canopy and silver flagstaff. Six-storey annex has paired windows,
red end strips, floor cornices, roof service room and small plant. Geometry uses
shared SGBV batches and dedicated shared lmMat architectural-light batches.

Measured maximum **27.1 m**, p90 **23.8 m**, median **7.2 m**:
`/workspace/li_refs/veeramakaliamman/meta.json`. Model maximum 26.9 m, annex
parapet 24.6 m, hall 7.2 m, gateway 18.9 m. The shared footprint's provisional
25 m metadata still needs regeneration by the lead.

Night checked against ScribblingGeek's 7 October 2020 photograph:
https://commons.wikimedia.org/wiki/File:Sri_Veeramakaliamman_Temple.jpg .
Warm tower/relief floodlight and lit doorway; restrained annex glazing. All photos
and provenance are outside git in `/workspace/li_photo_refs/veeramakaliamman/`.
No photographic textures, lettering, logos or external meshes.

## Validation and limits

**33,508 triangles**, four shared material batches. Build syntax and offline
finite geometry validation pass. Final r3 comparison: n **0.813**, e **0.794**,
s **0.767**, w **0.818**, top **0.832**; mean **0.805**. Close NE 0.854, close
SW 0.821, street 0.752; all-view mean 0.806. Main-view scores stayed identical
after the small vimana crown correction. r3 comparison and independent day/night
detail run both report `pageErrors: []` and `consoleErrors: []`; retired placement
check is empty. Artifacts: `/workspace/eo_li_out/heritage/`, never committed.

Overlays retain a wider reference base from its 3 m footprint buffer, tree and
adjacent-building contamination, and column filling. Geometry has not been
expanded into that buffer. Exact OSM wall positions and photographic proportions
are retained. Roof service layout is simplified. Relief figures are geometric
abstractions; temporary tents and overhead wires are omitted.

## Final verification snapshot

Round **r8**; 33508 triangles.

| n | e | s | w | top | close NE | close SW | street |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0.813 | 0.794 | 0.767 | 0.818 | 0.832 | 0.854 | 0.821 | 0.752 |

Mean n/e/s/w/top **0.805**; all-view mean **0.806**.

Final full-app comparison and independent day/night detail runs have **zero page
errors and zero console errors**; retired placement list is empty. Final images,
verification.json and li_iou.json are under `/workspace/eo_li_out/heritage/`, outside git.

## Round 2

Merged lead branch without rebasing, including measured height metadata and the
Deepavali noHull fix. Gateway centre moved 3 m toward Serangoon Road, from local
z=21.1 to z=24.1, on the actual east/southeast street wall; the entrance and canopy
move with it. Main vimana remains by the annex over the sanctum, with four small
side shrines. Added the photographed red side-bay roof. Annex/hall/gateway heights
remain 26.9/7.2/18.9 m against measured max 27.1 m and p90 23.8 m.

Re-searched and re-inspected ScribblingGeek's Commons night photograph before
lighting changes. Warm colour-preserving tier wash is stronger, with modest canopy
soffit lamps and a lit verandah cornice. Roof/annex remain restrained. The saved
photo and SOURCES.md remain outside git. Offline geometry passes; round-2 matched
camera results are recorded below after the browser queue completes.

r2a improved mean n/e/s/w/top from 0.805 to 0.811: n .815, e .808,
s .792, w .811, top .830; close NE .866, close SW .819, street .788.
Zero page/console errors. First night exposure clipped the pale sculpture; reduced
tier wash before final capture and separated the verandah wash into a lower-power
shared batch. This is an exposure correction, not added silhouette mass.
