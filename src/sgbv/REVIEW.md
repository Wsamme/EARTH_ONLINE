# Buona Vista visual review

The local photo references are not shipped. The external output directory holds
all exact-camera renders and labelled comparison sheets, with prior rounds in
separate directories. Each round covers N/E/S/W/top/street for all nine sites.
The final report below distinguishes model features from unresolved differences.

## First silhouette review → second renders

Each row records the three largest observed differences in the first six-view
sheet, followed by the corresponding corrections.

| Building | Three largest differences | Corrections |
| --- | --- | --- |
| Star Vista | Front shell too high relative to rear; southern shell too wide at its east tip; five-storey glazed base too tall and missing the intermediate metal ribbon | Reversed the shell height hierarchy; shortened/tapered the southern span; reduced shopping galleries to three levels and added a folded aluminium ribbon |
| Metropolis | Upper/lower blocks too similar in footprint; terrace slightly low; older OSM boxes obstruct the street view | Enlarged upper block relative to lower; lifted terrace by 2 m; added footprint-containment masking, including older blocks that contain replacement footprints |
| Buona Vista MRT | Concourse too solid/tall; roof lanterns too flat; entrance wing roof too high | Lowered concourse; raised lanterns; lowered entrance and added platform-edge door frames |
| Biopolis | Roofs look like stepped solid caps; large opaque lab elevations missing; external framing too sparse | Replaced raised roof caps with plant/parapets; added bronze slotted elevations to Chromos/Helios/Nanos; retained white external frames and enclosed bridges |
| Fusionopolis One | Flat crowns; western tower too short; upper sky gardens too narrow | Added swept crown profiles with two distinct oculi; raised western wing; added broad multi-floor white garden cages |
| Solaris | Sunshades lack projecting ledges; roof frame is an oval; roof gardens are flat lawns | Added physical louvre floor plates; rebuilt angular asymmetric frame; added planting beds, paths and trees |
| Galaxis | Long arm of office L too short; north cassette facade hidden behind glass; roof clutter too prominent | Extended tall arm southward; moved patterned cassettes outside glazing; used broad silver roof screen |
| Mediacorp | Studio fills too much of undercroft; theatre/upper volume lack intermediate massing; roof/service band too uniform | Narrowed/lowered studio and added opaque studio panels; added cantilever supports and planted slot; retained separate roof fans and service aisles |
| Rochester | Hotel incorrectly low; mall roof too low/flat; opaque tower spine missing | Restored OSM 102 m hotel and 36 m mall; added conservatory roof ribs; moved rose-beige spine outside the glazing |

The initial manual capture exposed an app interaction: the adaptive near plane
from the wide opening view clipped close shots. Those diagnostic captures were
replaced. Valid comparison rounds use an explicit 0.3 m near plane, exact recorded
poses and the app's frame/prerender lighting hooks. The geometry and production
camera are not moved to compensate for reference differences.

## Second silhouette review → third renders

All nine second-round sheets were inspected before these changes. Each row
records the three main remaining shape issues and the next correction.

| Building | Three main differences | Corrections |
| --- | --- | --- |
| Star Vista | Abrupt roof downturn; squared shell ends; atrium reads as a filled terrace | Smoothed the stepped roof profile, angled end caps, and opened an annular amphitheatre |
| Metropolis | Gables concealed by glazing; lower block insufficiently recessed; obstructing legacy podium | Moved gable surfaces outward, increased lower inset, and later masked the three legacy podium polygons separately |
| Buona Vista MRT | Roof lacks structural rhythm; platform edges sparse; track bed lacks rails | Added canopy trusses and edge frames; added rails, sleepers and joints along the app's actual EW alignment |
| Biopolis | Plant caps too bulky; opaque lab elevations too plain; bridge surroundings bare | Reduced caps, added layered slotted screens, and added merged trees around the linked blocks |
| Fusionopolis One | Oculi appear filled; crowns too flat; gardens lack deep framing | Cut actual roof openings, swept the crowns, and deepened white garden cages |
| Solaris | Facade too uniformly striped; ramp disconnected at upper wing; roof paths form an implausible radial pattern | Added broad glass slots, rebuilt one continuous morphing helical ramp, and replaced roof paths with perimeter/meandering paths |
| Galaxis | South elevation resembles north checker facade; L leg still weak; roof screen too fragmented | Added southern floor edges, reinforced long leg, and consolidated screen |
| Mediacorp | Studio too glazed; undercroft lacks supports; core merges with upper bar | Added opaque studio panels, cantilever supports and distinct cylindrical core |
| Rochester | Opaque spine too wide; balconies too shallow; mall conservatory too flat | Narrowed/lightened pink spine, added projecting balconies and pitched roof ribs |

## Materials and final validation

Subsequent six-view passes inspected all nine buildings again. Changes included
less saturated glass bay colours, office-window night materials using the
existing app shader, softer Rochester cladding, roof gardens, and the final
Solaris ramp/roof revision. The final full pass contains 54 exact-camera views;
the final Solaris revision has an additional six-view pass. All these final
runs reported zero page errors and zero console errors. The independent full-app
appshot flow also covers district day/night and four closer views.

The geometry check reports **263,932 model triangles**, plus **29,304 triangles**
for added EW rail detail: **293,236 total added triangles**. This is the addition's
budget, not the full city's draw count. All nine meshes contain finite vertices;
model maximum heights are within 2 m of the supplied measured values. Roof plant,
trees and parapets account for small differences. The generated inline script
passes `node --check`.

These are original, detailed procedural reconstructions, but they do **not yet
reach photographic replica fidelity**. Exact camera matching does not remove
the differences in the existing terrain, adjacent generic buildings or lighting.
The reference images remain local and are not shipped or attached to the PR.

| Building | Features represented | Remaining visual differences |
| --- | --- | --- |
| Star Vista | OSM anchor, split leaning shells, roof grid, stepped galleries and open amphitheatre | Shell folds, end curvature and underside remain simplified; close street surfaces differ materially |
| Metropolis | Twin measured-height towers, inset blocks, terrace slots and low podium | Offsets are more regular; roof plant, gable details and reflections are approximate |
| Buona Vista MRT | OSM station parts, canopy lanterns, platform edges and actual EW viaduct/rail alignment | Access concourse, stairs and structural joints are simplified; terrain differs |
| Biopolis | Seven real footprint blocks, linked bridges, external frames and screened lab elevations | Individual block heights are estimates; roof plant, facade patterns and landscape are approximate |
| Fusionopolis One | Three curved plates, two roof oculi, garden cages and bridges | Crown curves, oculus proportions and garden truss arrangement are not exact |
| Solaris | Unequal wings, horizontal louvres, continuous planted ramp, atrium and roof frame | Terraces are too regular; ramp route, truss layout and planting density differ |
| Galaxis | L plan, pilotis, north checker facade, southern horizontal bands and roof screen | Cassette arrangement, annex details and roof equipment are simplified |
| Mediacorp | Floating tapered bar, theatre/studio volumes, cylindrical core and roof fans | Undercroft, studio massing, roof services and metal finish remain approximate |
| Rochester | One cranked main tower, hotel/mall footprints, balconies, pink spine and ribbed mall roof | Balcony stacks, roof profiles and mall facade are simplified |
