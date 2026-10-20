# v36 lm32/detail: the terrain shader reads the two sharp detail textures of SGDetail (lm32/detail/detail.js).
# A POSTS file for sgreal/patch17.py, run after lm30/sky/post_ground.py: edits the v33 ground-detail block (asserted, each once):
# - its uniforms get the detail textures, masks and windows (set by SGDetail at run time; off until the cover is loaded);
# - before the procedural detail: the old texture colour is replaced by L2 then L1 where they hold the right tile, fading out over
#   the outer tile of each window;
# - the warped, sharpened lookup of the old texture (v33, near the camera) is skipped where the sharp textures cover.
DECL = r'''
uniform sampler2D gdDet1, gdDetM1, gdDet2, gdDetM2; uniform vec4 gdDetA1, gdDetA2; uniform float gdDetOn;
// a detail level at q (world metres: x east, z south): rgb and its weight (0 outside the window or where the slot holds another tile)
vec4 gdDetS(sampler2D tx, sampler2D mk, vec4 A, vec2 q){
  vec2 t = q/A.x;
  vec3 c = texture2D(tx, t/A.y).rgb;
  vec2 ti = floor(t), rel = t - A.zw;
  float e = min(min(rel.x, rel.y), min(A.y - rel.x, A.y - rel.y));
  vec4 m = texture2D(mk, (mod(ti, A.y) + 0.5)/A.y);
  vec2 dm = abs(m.rg*255.0 - mod(ti, 256.0));
  return vec4(c, step(0.5, m.a)*step(max(dm.x, dm.y), 0.5)*smoothstep(0.1, 1.0, e));
}'''
FRAG = r'''float gdRefl = 0.0;
#ifdef USE_MAP
float gdDw = 0.0;
if (gdDetOn > 0.5){
  vec2 gdQ = vec2(vGdW.x, vGdW.z);
  vec4 gdD2 = gdDetS(gdDet2, gdDetM2, gdDetA2, gdQ), gdD1 = gdDetS(gdDet1, gdDetM1, gdDetA1, gdQ);
  vec3 gdC2 = mix(diffuseColor.rgb, diffuse*mapTexelToLinear(vec4(gdD2.rgb, 1.0)).rgb, gdD2.a);
  diffuseColor.rgb = mix(gdC2, diffuse*mapTexelToLinear(vec4(gdD1.rgb, 1.0)).rgb, gdD1.a);
  gdDw = max(gdD1.a, gdD2.a);
}
if (gdOn > 0.5){'''
UNI = ("gdUvK:{value:1/56000}, gdTexN:{value:4096}};",
       "gdUvK:{value:1/56000}, gdTexN:{value:4096}, gdDetOn:{value:0}, gdDet1:{value:null}, gdDetM1:{value:null}, gdDetA1:{value:new THREE.Vector4(1, 1, 0, 0)},"
       " gdDet2:{value:null}, gdDetM2:{value:null}, gdDetA2:{value:new THREE.Vector4(1, 1, 0, 0)}};   // v36 lm32/detail")

def apply(src, city):
    edits = [
        UNI,
        ("varying vec3 vGdW; varying vec3 vGdN;`;", "varying vec3 vGdW; varying vec3 vGdN;" + DECL + "`;"),
        ("float gdRefl = 0.0;\n#ifdef USE_MAP\nif (gdOn > 0.5){", FRAG),
        ("float gdK = gdNear*gdMag;", "float gdK = gdNear*gdMag*(1.0 - gdDw);"),
    ]
    for a, b in edits:
        n = src.count(a)
        assert n == 1, ('post_detail', a[:50], n)
        src = src.replace(a, b)
    return src
