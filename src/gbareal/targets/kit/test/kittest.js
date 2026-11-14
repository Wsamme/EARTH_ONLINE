// kit smoke test: a plain block on the Guomao Building footprint (not a landmark; only for testing the Greater Bay harness)
{
LANDMARKS.szkittest = {zh:'测试', en:'Kit test', cat:'new', r:22, h:160, build(){ const g = new THREE.Group(); LBox(g, 30, 160, 30, 0, 0, 0, '#b0563a'); return g; }};
SG_PLACES.push({type:'szkittest', lat:22.54321, lon:114.11466, rot:0});
}
