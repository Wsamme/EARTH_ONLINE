/* Jurong East / Jurong Gateway landmarks. Reuses the Buona Vista modelling kit (SGBV):
 * metres +x east, +z south, y up; OSM contributors' footprints (ODbL); original hand-built
 * geometry only. Photo / Google 3D Tiles references inform massing only and never ship.
 * Keys are registered as sgje_<slug>; footprints live in sgje/footprints.json. */
const SGJE = (() => {
  const data = /* JE_FOOTPRINTS */;
  const stats = {};
  function register(slug, zh, en, r, build){
    SGBV.data[slug] = data[slug];            // only registered modules join the hull mask (SGBV.skip builds it lazily)
    SGBV.register(slug, zh, en, r, build);
    const L = LANDMARKS['sgbv_' + slug]; delete LANDMARKS['sgbv_' + slug]; LANDMARKS['sgje_' + slug] = L;
    for (let i = SG_PLACES.length - 1; i >= 0; i--) if (SG_PLACES[i].type === 'sgbv_' + slug){ SG_PLACES[i].type = 'sgje_' + slug; break; }
    Object.defineProperty(stats, slug, {enumerable: true, get: () => SGBV.stats[slug]});
  }
  return Object.assign({}, SGBV, {data, register, stats});
})();
