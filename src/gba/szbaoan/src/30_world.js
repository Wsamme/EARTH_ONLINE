// ================================================================================================ Shenzhen World (szworld)
// Shenzhen World Exhibition & Convention Center (opened Nov 2019): 16 standard 20 000 m2 halls and 2 multi-function halls in two
// rows along a 1.75 km central corridor, one 50 000 m2 super hall, entrance / conference halls; hall spans 99 m, 42 m between halls;
// curved single-curvature truss roofs with undulating forms (CUG structural paper). Built from this build's 40 OSM building:parts of
// w785606096: H = standard hall, X = the super hall, S = the service blocks between paired halls, C = the central corridor (glazed
// roof, glowing at night), E = the four oval halls, L = the low link between them, K = small end blocks / canopies.
// Valode & Pistre (Paris) with Aube: a fishbone plan under an indigo, wave-like roof 19 m high, thinned to a "wing" at its edges
// (Architecture Prize / ducks.fr). Halls 19 m at the crest with a gentle wave; corridor, ovals and super hall heights estimated.
const SZW = @WORLDPARTS@;
const circ = u => Math.sqrt(Math.max(0, 1 - Math.pow(1 - Math.min(1, u), 2)));
LANDMARKS.szworld = {zh:'深圳国际会展中心', en:'Shenzhen World Exhibition & Convention Center', cat:'new', r:920, h:24,
  lt:{m:1, c:'#e8eef6', k:0.4, fh:5.5, cw:3.5},
  build(){
    const g = new THREE.Group(), B = new Bat();
    const roof = B.a({c:'#42508c'}), wall = B.a({c:'#c5cdd2', m:1, fh:5.5, cw:3.5}), glass = B.a({c:'#a3bccb', glow:'#fff0d2', gk:0.45}),
      flat = B.a({c:'#c6cacc'}), wsolid = B.a({c:'#cfd2d2', m:0}), oval = B.a({c:'#b9cad4', glow:'#fff2da', gk:0.25});
    const HF = {
      H:(x, z, d) => 12.5 + 5.5*circ(d/40) + 1.0*Math.sin(x*0.045 + z*0.012)*circ(d/30),
      X:(x, z, d) => 13 + 7*circ(d/60) + 1.0*Math.sin(x*0.04 + z*0.012)*circ(d/30),
      C:(x, z, d) => 14 + 4.5*circ(d/11),
      E:(x, z, d) => 10 + 12*circ(d/70),
      L:() => 8, S:() => 12, K:() => 11};
    for (const [t, R] of SZW){
      const hf = HF[t];
      if (t === 'L' || t === 'S' || t === 'K'){ const y = hf(); wallsT(t === 'S' ? wsolid : wall, R, -1, y); flatT(flat, R, y); continue; }
      // the corridor bridges the local road at z -413 / -455 (OSM, at grade): open underneath there, soffit at 8 m
      const over = (x, z) => t === 'C' && z > -476 && z < -394;
      pillow(t === 'C' ? glass : t === 'E' ? oval : roof, wall, R, t === 'C' ? 5 : 9, hf, (x, z) => over(x, z) ? 8 : -1);
      if (t === 'C'){ const S = clipSq(R, -1e4, -476, 1e4, -394); if (S.length > 2) flatT(flat, S, 8); }
    }
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szworld', lat:22.701069, lon:113.769362, rot:0});
