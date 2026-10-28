/* ================= v37: after the Tokyo landmark modules — one map label per structure (sub-keys of split models set label:false) ================= */
// v39: the sub-keys of tyo/tyx_west (Tokyo Metropolitan Gymnasium's pool and sub-arena, Yebisu Garden Place's château)
for (const k of ['tymetgympool', 'tymetgymsub', 'tyyebisuchateau']) if (LANDMARKS[k]) LANDMARKS[k].label = false;
/* v39: OSM map labels that a landmark / site label already gives, or that carry a naming-rights brand: dropped from the map's POI and
   place lists before the labels are made (matched by English name and position, within 80 m of the listed point, world metres). */
const TYO_DROP_LABELS = [
  ['pois', 'MUFG Stadium', -3304, 1982],                 // the Japan National Stadium under its naming-rights name (site tystadium has the label)
  ['pois', 'New National Stadium', -3192, 1992],         // the same stadium again (OSM r10071391)
  ['pois', 'Meiji Jingu Main Shrine', -4561, 1647],      // at the south gate; site tymeijijingu labels the precinct and the main hall
  ['pois', 'Hama-rikyu Gardens', 1252, 20],              // site tyhamarikyu has the label
  ['places', 'Hama-rikyu Gardens', 1234, -50]];
function tyoDropLabels(){
  const B = SGR.base; if (!B || B.tyoDropped) return; B.tyoDropped = true;
  for (const [list, en, x, y] of TYO_DROP_LABELS){ const L = B[list]; if (!L) continue;
    for (let i = L.length - 1; i >= 0; i--){ const p = L[i]; if (p.en === en && Math.hypot(p.x - x, p.y - y) < 80) L.splice(i, 1); } }
}
// the map label of the district (neighbourhood cell) named after the garden: the site label already names it; the district itself stays
// in the district list
const TYO_DROP_DISTRICT_LABELS = new Set(['Hama-rikyu Gardens']);
function tyoDropDistrictLabels(){
  for (let i = labelItems.length - 1; i >= 0; i--){ const it = labelItems[i], el = it.el;
    if (!el || !el.classList || !el.classList.contains('d')) continue; const s = el.querySelector('small');
    if (s && TYO_DROP_DISTRICT_LABELS.has(s.textContent)){ el.remove(); labelItems.splice(i, 1); } }
}
{ const f = sgLabels; sgLabels = function(){ tyoDropLabels(); tyoDropDistrictLabels(); return f.apply(this, arguments); }; }
