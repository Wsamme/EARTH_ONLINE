// lm50 Singapore kit self-test (delete before integration): one plain block on the sgmaybank anchor.
{
LANDMARKS.sgkittest = {zh:'测试', en:'Kit test block', cat:'new', r:20, h:60, lt:{m:1, c:'#d6e4ff', k:0.6}, build(){
  const g = new THREE.Group(); LBox(g, 24, 65, 24, 0, -5, 0, '#8fa3b8'); LBox(g, 26, 2, 26, 0, 60, 0, '#556677'); return g; }};
SG_PLACES.push({type:'sgkittest', lat:1.285771, lon:103.852279, rot:0});
}
