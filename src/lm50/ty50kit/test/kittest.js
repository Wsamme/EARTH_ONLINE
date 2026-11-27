// lm50 Tokyo kit smoke test (NOT a landmark): one plain block on the GranTokyo South Tower footprint (ty50a target tygransouth),
// to check nstat / ndump / nrender / oplan / the app shot. Never add this file to a release build.
{
  LANDMARKS.tykittest = {zh:'测试块', en:'Kit test block', cat:'new', r:47, h:205, label:false, lt:{m:1, c:'#d6e4ff', k:0.6},
    build(){ const g = new THREE.Group(); LBox(g, 38, 210, 72, 0, -5, 0, '#8a96a3', 0.62); LBox(g, 30, 6, 60, 0, 205, 0, '#c8d0d8', 0.62); return g; }};
  SG_PLACES.push({type:'tykittest', lat:35.678637, lon:139.767374, rot:0});
}
