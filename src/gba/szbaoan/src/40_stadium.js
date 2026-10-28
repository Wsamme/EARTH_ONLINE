// ================================================================================================ Bao'an Stadium (szbaoanstadium)
// gmp (von Gerkan, Marg and Partners), 2011, 40 050 seats: 245.8 x 245.8 m, 39.65 m high. A double row of slim green steel tubes
// ("bamboo forest", up to 32 m long, 55-80 cm across) rings the stands; a membrane roof 230 m across, cantilevered 54 m, stretched
// over arched supports into a bubbled surface and hung from 36 pairs of cables gathered by a double tension ring above the pitch;
// a lower tier and an undulating concrete upper tier (dezeen / gmp text). OSM r9249893: a 243 m round footprint.
// Estimated: the 6 m podium (the 32 m tubes reach the 38 m roof ring from it), tier levels, column count (2 x 96).
LANDMARKS.szbaoanstadium = {zh:'宝安体育场', en:"Bao'an Stadium", cat:'new', r:128, h:39.65,
  lt:{m:0, c:'#f1f8ff', k:0.65, e:0.55},
  build(){
    const g = new THREE.Group(), B = new Bat(), rng = LMCTX.rng;
    const conc = B.a({c:'#cdcac2'}), seat = B.a({c:'#8e9aa6'}), seat2 = B.a({c:'#a6b0b8'}), memb = B.a({c:'#f4f3ee'}), steel = B.a({c:'#d9dcdc'}),
      green = B.a({c:'#5f9a3a'}), cable = B.a({c:'#b4b8ba'}), pod = B.a({c:'#bdb9b0'}), grass = B.a({c:'#5b8f45'}), apron = B.a({c:'#7d8c72'});
    const N = 72, ri = t => { const a = 71, b = 57, c = Math.cos(t), s = Math.sin(t); return a*b/Math.sqrt((b*c)*(b*c) + (a*s)*(a*s)); };
    const P = (t, r, y) => [Math.cos(t)*r, y, Math.sin(t)*r];
    // pitch and apron
    const ell = []; for (let k = 0; k < N; k++){ const t = k/N*TAU; ell.push([Math.cos(t)*ri(t), Math.sin(t)*ri(t)]); }
    flatT(apron, ell, 0.25); flatT(grass, [[-52.5, -34], [52.5, -34], [52.5, 34], [-52.5, 34]], 0.32);
    // bowl: lower tier, gallery wall, undulating upper tier, back wall (r 106)
    const upTop = t => 31 + 2.6*Math.cos(2*t);
    for (let k = 0; k < N; k++){
      const t0 = k/N*TAU, t1 = (k + 1)/N*TAU;
      const S = (t) => { const r0 = ri(t), u = upTop(t); return [[r0, 1.0], [r0 + 0.30*(106 - r0), 13.5], [r0 + 0.30*(106 - r0), 16.2], [r0 + 0.36*(106 - r0), 17], [106, u], [106, u + 1.2]]; };
      const A = S(t0), C = S(t1);
      for (let i = 0; i < A.length - 1; i++) quad(i < 2 ? seat : i === 3 ? seat2 : conc, P(t0, A[i][0], A[i][1]), P(t1, C[i][0], C[i][1]), P(t1, C[i + 1][0], C[i + 1][1]), P(t0, A[i + 1][0], A[i + 1][1]));
      quad(conc, P(t0, 106, 6), P(t1, 106, 6), P(t1, 106, upTop(t1) + 1.2), P(t0, 106, upTop(t0) + 1.2));
      // podium ring r 99-121.5 at 6 m
      quad(pod, P(t0, 99, 6), P(t1, 99, 6), P(t1, 121.5, 6), P(t0, 121.5, 6)); quad(pod, P(t0, 121.5, 0), P(t1, 121.5, 0), P(t1, 121.5, 6), P(t0, 121.5, 6));
      quad(pod, P(t0, ri(t0) - 0.2, 0), P(t1, ri(t1) - 0.2, 0), P(t1, ri(t1) - 0.2, 1.0), P(t0, ri(t0) - 0.2, 1.0));
    }
    // roof: membrane bays between 36 radial cable pairs, bulging between them; outer ring (r 115) and inner tension ring (r 61)
    const NB = 36, RI = 61, RO = 115, yI = 32.6, yO = 37.6;
    const ym = (t, r) => { const f = (r - RI)/(RO - RI), ph = (t/TAU*NB) % 1; return yI + (yO - yI)*f + 2.4*Math.sin(PI*ph)*Math.sin(PI*f); };
    for (let k = 0; k < NB*4; k++){
      const t0 = k/(NB*4)*TAU, t1 = (k + 1)/(NB*4)*TAU;
      for (let j = 0; j < 6; j++){ const r0 = RI + (RO - RI)*j/6, r1 = RI + (RO - RI)*(j + 1)/6;
        quad(memb, P(t0, r0, ym(t0, r0)), P(t0, r1, ym(t0, r1)), P(t1, r1, ym(t1, r1)), P(t1, r0, ym(t1, r0))); }
    }
    const ringT = (r, y, w, h, col) => { for (let k = 0; k < 96; k++){ const t0 = k/96*TAU, t1 = (k + 1)/96*TAU; bar(col, P(t0, r, y), P(t1, r, y), w, h); } };
    ringT(RO, 38.5, 2.2, 2.3, steel); ringT(RO - 2, 36.2, 1.2, 1.2, steel);
    ringT(RI, yI, 0.8, 0.8, cable); ringT(RI, yI - 3.2, 0.8, 0.8, cable);
    for (let k = 0; k < NB; k++){ const t = k/NB*TAU; bar(cable, P(t, RO, 39.4), P(t, RI, yI + 0.2), 0.3, 0.3); bar(cable, P(t, RO - 2, 35.6), P(t, RI, yI - 3.2), 0.3, 0.3);
      bar(steel, P(t, RI + 2, yI + 0.4), P(t, RO - 1, yO + 0.4), 0.35, 0.9); }
    // the bamboo forest: two rows of slim green tubes from the podium to the roof ring, slightly out of plumb
    for (const [r, n, top] of [[110.5, 96, 37.4], [117.8, 96, 39.4]]) for (let k = 0; k < n; k++){
      const t = (k + (r > 115 ? 0.5 : 0) + (rng() - 0.5)*0.35)/n*TAU, lean = (rng() - 0.5)*0.06, d = 0.55 + rng()*0.25;
      const b = P(t, r + (rng() - 0.5)*1.5, 6), tp = P(t + lean*0.3, r + lean*8, top - rng()*1.5);
      tube(green, b, tp, d/2, 6);
    }
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szbaoanstadium', lat:22.560972, lon:113.876322, rot:0});
