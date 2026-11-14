// ================================================================================================ Shenzhen Bao'an Airport T3 (szt3)
// Studio Fuksas, opened 28 Nov 2013: about 1.5 km long, ~500 000 m2, roof spans up to 80 m; a double skin of white honeycomb panels
// with hexagonal glazed openings wrapping roof and walls ("manta ray"). Built on its OSM footprint w222145025 (the main hall, the
// 1 km concourse and the cross-shaped pier) as a vaulted pillow roof: the concourse vault rises to ~26 m, the main hall to ~41 m
// (heights estimated: not published), honeycomb glazing on the whole skin, glowing at night (lit from inside).
const T3R = @T3RING@;
const t3h = (x, z, d) => 4.5 + 21*Math.sqrt(Math.max(0, 1 - Math.pow(1 - Math.min(1, d/34), 2))) + 16*Math.pow(Math.min(1, d/125), 2);
// One continuous skin, split over three keys so that each key's ground hull (the app hides real buildings inside the convex hull)
// stays tight: szt3 = the main hall (z > 20), szt3_c = the concourse spine, szt3_p = the cross-shaped pier (z < -285).
function t3Part(pred){
  const g = new THREE.Group(), B = new Bat();
  const roof = B.a({c:'#eef0ee'}), wall = B.a({c:'#9fb1bd', m:1, fh:4.4, cw:3.2});
  const {Dg} = pillow(roof, wall, T3R, 7, t3h, -1);
  panels(B.a({c:'#7f96a6', glow:'#ffe1ae', gk:0.7}), T3R, 9.5, 3.3, (x, z) => t3h(x, z, Math.max(0, Dg(x, z))), Dg, 1.2, 0.3);
  triFilter(B, pred); B.flush(g); return g;
}
const T3LT = {m:0, c:'#fff1dc', k:0.32, e:0.7};
// the convex ground hull of the main hall takes in the VIP building in its east notch (OSM w545101852, height not mapped): rebuilt
// here as a plain 3-storey block (12 m, estimated) so that it does not vanish
const T3VIP = [[305,147],[346,126],[348,129],[353,127],[372,164],[333,184],[332,182],[328,184],[327,181],[324,183]];
LANDMARKS.szt3 = {zh:'深圳宝安国际机场T3航站楼', en:"Shenzhen Bao'an Airport Terminal 3", cat:'new', r:460, h:42, lt:T3LT, build(){
  const g = t3Part((x, z) => z > 20), B = new Bat(); wallsT(B.a({c:'#c4c8cb', m:1, fh:4, cw:3}), T3VIP, -1, 12); flatT(B.a('#d6d7d5'), T3VIP, 12); B.flush(g); return g; }};
LANDMARKS.szt3_c = {zh:'深圳宝安国际机场T3航站楼指廊', en:"Shenzhen Bao'an Airport T3 concourse", cat:'new', r:500, h:30, lt:T3LT, build(){ return t3Part((x, z) => z <= 20 && z >= -285); }};
LANDMARKS.szt3_p = {zh:'深圳宝安国际机场T3航站楼十字指廊', en:"Shenzhen Bao'an Airport T3 cross pier", cat:'new', r:700, h:30, lt:T3LT, build(){ return t3Part((x, z) => z < -285); }};
SG_PLACES.push({type:'szt3', lat:22.629986, lon:113.806991, rot:0});
SG_PLACES.push({type:'szt3_c', lat:22.629986, lon:113.806991, rot:0});
SG_PLACES.push({type:'szt3_p', lat:22.629986, lon:113.806991, rot:0});

// ================================================================================================ Satellite Concourse (szsatellite)
// Opened Dec 2021 (Aedas) north of T3, linked by the people mover: an X of four glazed piers from a central hall (OSM w877295774).
// Vault height ~19 m and the skylight lattice are estimates.
const SATR = @SATRING@;
const sath = (x, z, d) => 5 + 14*Math.sqrt(Math.max(0, 1 - Math.pow(1 - Math.min(1, d/24), 2))) + 6*Math.pow(Math.min(1, d/80), 2);
LANDMARKS.szsatellite = {zh:'深圳机场卫星厅', en:'Shenzhen Airport Satellite Concourse', cat:'new', r:372, h:26,
  lt:{m:0, c:'#fff1dc', k:0.3, e:0.7},
  build(){
    const g = new THREE.Group(), B = new Bat();
    const {Dg} = pillow(B.a({c:'#e7e9ea'}), B.a({c:'#93a9b8', m:1, fh:4.4, cw:3.0}), SATR, 6, sath, -1);
    panels(B.a({c:'#7d93a2', glow:'#ffe6bd', gk:0.6}), SATR, 11, 3.0, (x, z) => sath(x, z, Math.max(0, Dg(x, z))), Dg, 9, 0.25, 4, PI/4, false);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szsatellite', lat:22.64311, lon:113.799793, rot:0});

// ================================================================================================ Control tower (szatctower)
// The airfield's control tower (OSM w478460848, a 19 m round footprint; OSM height 98 m, not verified) and its base building
// (w478460850). Slim round shaft, flared neck, glazed octagonal cab, roof and mast; the shape is generic (no published drawings).
LANDMARKS.szatctower = {zh:'深圳机场塔台', en:'Shenzhen Airport Control Tower', cat:'new', r:30, h:98,
  lt:{m:0, c:'#eef3ff', k:0.55, e:0.4},
  build(){
    const g = new THREE.Group(), B = new Bat(), c = '#e9e9e5';
    const base = [[-18.2,-1.2],[10.1,-15.7],[22.9,8.8],[-5.4,23.3]];
    wallsT(B.a({c:'#c9ccd0', m:1, fh:3.4, cw:2.6}), base, -1, 6.8); flatT(B.a('#d5d6d4'), base, 6.8);
    B.flush(g);
    LLathe(g, [[0, -1], [9.4, -1], [9.4, 4], [7.2, 8], [6.4, 30], [5.6, 60], [5.4, 74], [7.6, 79], [9.6, 82]], 0, 0, 0, c, 24);
    LLathe(g, [[9.6, 82], [9.9, 82.6], [9.0, 89.2], [9.2, 89.4]], 0, 0, 0, {c:'#5d7f95', glow:'#cfe6ff', gk:0.9}, 8);
    LLathe(g, [[9.4, 89.3], [10.4, 89.8], [9.2, 91.4], [3.0, 92.4], [0, 92.6]], 0, 0, 0, c, 16);
    LCyl(g, 0.35, 0.5, 5.5, 0, 92.4, 0, '#bfc2c4', 6);
    LBox(g, 0.8, 0.8, 0.8, 0, 97.6, 0, AVI);
    for (let k = 0; k < 8; k++){ const a = k/8*TAU; LBox(g, 0.5, 0.4, 0.5, Math.cos(a)*9.3, 91.2, Math.sin(a)*9.3, AVI); }
    return g;
  }};
SG_PLACES.push({type:'szatctower', lat:22.636853, lon:113.803817, rot:0});
