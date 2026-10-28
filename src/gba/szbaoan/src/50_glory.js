// ================================================================================================ Bay Glory (szbayglory)
// Opened 18 Apr 2021 at OH Bay: 128 m high, a 113.3 m wheel with 28 ellipsoid all-glass gondolas (16.8 m2, up to 25 people),
// cantilevered from a fish-fin shaped frame (鱼鳍状异形大立架); pure white, multicoloured LED lights at night (Wikipedia; ourchinastory).
// The fin stands on its OSM footprint w914175455 (a 37 m teardrop, blunt end east); the wheel turns in the fin's plane (x-y), hung
// on its north side (the side is not verified), hub at 66.5 m so that the top gondola reaches 128 m.
LANDMARKS.szbayglory = {zh:'湾区之光摩天轮', en:'Bay Glory Ferris Wheel', cat:'new', r:70, h:128,
  lt:{m:0, c:'#f2f6ff', k:0.5, e:0.6, anim:'cycle', c2:'#9fd6ff'},
  build(){
    const g = new THREE.Group(), B = new Bat();
    const white = B.a({c:'#f3f3f1'}), rimc = B.a({c:'#f1f1ef', m:2, lk:1.25}), cab = B.a({c:'#cfe2ee', glow:'#eaf4ff', gk:0.55}), wire = B.a({c:'#c9cccc'}), dark = B.a({c:'#9aa3aa'});
    const FP = [[-22.7,7.9],[-20.9,5.4],[-10.5,-3.3],[-1.0,-10.1],[7.1,-15.1],[9.7,-16.1],[11.8,-16.4],[13.2,-15.4],[14.3,-11.3],[14.4,-0.3],[13.7,4.7],[12.4,9.3],[11.4,10.0],[-20.8,10.3],[-22.0,9.8]];
    const HUB = 66.5, ZW = -24, R = 56.65, zc = -3;
    // fin: lofted through shrinking copies of the footprint, its back edge sweeping up and forward to the hub
    const lev = [0, 10, 22, 34, 46, 56, 64, 72];
    const secs = lev.map(y => { const f = y/72, xb = -22.7 + 21*Math.pow(f, 1.25), xf = 14.4 - 11*f*f, th = 1 - 0.72*f;
      return FP.map(([x, z]) => [xb + (x + 22.7)/37.1*(xf - xb), y, zc + (z - zc)*th]); });
    for (let i = 0; i < secs.length - 1; i++) for (let k = 0; k < FP.length; k++){ const k2 = (k + 1) % FP.length; quad(white, secs[i][k], secs[i][k2], secs[i + 1][k2], secs[i + 1][k]); }
    capT(white, secs[secs.length - 1]);
    // axle from the fin to the hub, hub
    tube(white, [-1, HUB, zc], [-1, HUB, ZW - 7], 3.2, 12);
    tube(dark, [-1, HUB, ZW - 7], [-1, HUB, ZW - 8.5], 2.4, 12);
    // rim: two box rings 3.2 m apart (z), laced; LED on the rim
    const P = (a, r, z) => [-1 + Math.cos(a)*r, HUB + Math.sin(a)*r, z];
    const NS = 112;
    for (let k = 0; k < NS; k++){ const a0 = k/NS*TAU, a1 = (k + 1)/NS*TAU;
      for (const z of [ZW - 1.6, ZW + 1.6]){ bar(rimc, P(a0, R, z), P(a1, R, z), 0.9, 1.4); bar(white, P(a0, R - 3.2, z), P(a1, R - 3.2, z), 0.6, 0.8); }
      bar(white, P(a0, R, ZW - 1.6), P(a1, R - 3.2, ZW + 1.6), 0.25, 0.25); bar(white, P(a0, R - 3.2, ZW - 1.6), P(a0, R, ZW - 1.6), 0.3, 0.3);
    }
    // spoke cables from both hub ends
    for (let k = 0; k < 56; k++){ const a = k/56*TAU; bar(wire, [-1, HUB, ZW - 6], P(a, R - 3.2, ZW - 1.6), 0.12, 0.12); bar(wire, [-1, HUB, ZW + 3], P(a, R - 3.2, ZW + 1.6), 0.12, 0.12); }
    // gondolas outside the rim
    for (let k = 0; k < 28; k++){ const a = k/28*TAU + 0.05, p = P(a, R + 3.3, ZW); LSph(g, 2.5, p[0], p[1], p[2], {c:'#d6e6f0', glow:'#eef6ff', gk:0.6}, 0.84, 10);
      bar(white, P(a, R + 0.6, ZW), P(a, R + 1.2, ZW), 0.6, 0.6); }
    // boarding platform under the wheel
    boxT(dark, -1, 0, ZW, 30, 3.8, 14); boxT(white, -1, 3.8, ZW, 32, 0.6, 16);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szbayglory', lat:22.54425, lon:113.883072, rot:0});

// ================================================================================================ Eyes of the GBA (szbayeye)
// Bay Area Book City at OH Bay: two low halls (OSM w1362742673 north, w1362742674 south), each with a C-shaped court opening east
// ("the eyes", seen from the air), and the link block between them (w1362742675). Two storeys above ground (two below), opened
// 26 Sep 2025, a rooftop garden of over 20 000 m2 open day and night (ourchinastory). Storey height estimated (roof ~12-14 m).
LANDMARKS.szbayeye = {zh:'湾区之眼（深圳书城湾区城）', en:'Eyes of the GBA (Bay Area Book City)', cat:'new', r:200, h:14,
  lt:{m:1, c:'#ffe9c8', k:0.45, fh:5, cw:3},
  build(){
    const g = new THREE.Group(), B = new Bat();
    const N = @EYEN@, S = @EYES@, L = [[-40.0,31.1],[-38.1,-50.1],[-4.8,-49.3],[-6.7,31.8]];
    const roof = B.a({c:'#86a56c'}), wall = B.a({c:'#a8bac6', m:1, fh:5, cw:3}), edge = B.a({c:'#d8d6cf'});
    const hf = (x, z, d) => 10.5 + 3.2*circ(d/22);
    for (const R of [N, S]){ pillow(roof, wall, R, 4, hf, -1); }
    wallsT(wall, L, -1, 11.5); flatT(roof, L, 11.5);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szbayeye', lat:22.550556, lon:113.879393, rot:0});
