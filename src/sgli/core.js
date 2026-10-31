/* Little India landmarks. Reuses the Buona Vista modelling kit (SGBV):
 * metres +x east, +z south, y up; OSM contributors' footprints (ODbL); original hand-built
 * geometry only. Photo / Google 3D Tiles references inform massing only and never ship.
 * Keys are registered as sgli_<slug>; footprints live in sgli/footprints.json.
 * register(slug, zh, en, r, build, replaces) — `replaces` lists older landmark types
 * (e.g. 'sgveeramakali') whose SG_PLACES entries are removed so the new module stands alone. */
const SGLI = (() => {
  const data = /* LI_FOOTPRINTS */;
  const stats = {};
  function register(slug, zh, en, r, build, replaces){
    SGBV.data[slug] = data[slug];            // only registered modules join the hull mask (SGBV.skip builds it lazily)
    SGBV.register(slug, zh, en, r, build);
    const L = LANDMARKS['sgbv_' + slug]; delete LANDMARKS['sgbv_' + slug]; LANDMARKS['sgli_' + slug] = L;
    for (let i = SG_PLACES.length - 1; i >= 0; i--) if (SG_PLACES[i].type === 'sgbv_' + slug){ SG_PLACES[i].type = 'sgli_' + slug; break; }
    for (const old of (replaces || [])) for (let i = SG_PLACES.length - 1; i >= 0; i--) if (SG_PLACES[i].type === old) SG_PLACES.splice(i, 1);
    Object.defineProperty(stats, slug, {enumerable: true, get: () => SGBV.stats[slug]});
  }
  return Object.assign({}, SGBV, {data, register, stats});
})();
