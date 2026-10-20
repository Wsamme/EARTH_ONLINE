// SGRoads v2: real OSM roads of the 1:1 Singapore map -> lean indexed 3D meshes (City Brush v20, three.js r128).
// One top-level name. Uses the app globals THREE, HALF, hAt, hC, matLamp, mulberry32 (NIGHT, lampTex optional).
// v2: junction graph (shared vertices + touching / crossing lines), junction surfaces with kerb returns, gores at
// merges / diverges, arc-smoothed centrelines, Singapore markings, kerbs + footways + planted medians, LED street
// lighting with poles, tunnel portals, smooth ramps, and a drivable surface query (surfaceAt).
// [lm24/roadfix] tunnel portals with a closed end also at the line ends the data marks as tunnel mouths (flags 64 start / 128 end, any class).
// v22: a US style for the San Francisco Bay Area map (right-hand traffic, US markings, cobra-head street lights, concrete sidewalks,
// Caltrans concrete freeways), on when the global SGR_BAY is true (or SGRoads.setUS(true)); Singapore is unchanged.
const SGRoads = (() => {
  const hyp = (a, b) => Math.sqrt(a*a + b*b);
  const TILE = 2000, CHUNK = 100, MAXSEG = 20, MITER = 2.2;
  let GT = 70;          // roadDrive: the app's terrain grid (TS: 70 m in Singapore, 90 m on the Bay map; the roads sank into the Bay's terrain)
  // widths (two-way, one-way) per class
  const WID = [[26,13],[6.5,6.5],[20,11],[6.5,6.5],[15,10],[6,6],[12,8],[5.5,5.5],[9.5,7],[5,5],[7,5.5],[4.5,4],[2.5,2.5],[60,60],[23,23],[4,4],[3,3],[4,4],[12,12]];
  // lanes (two-way total, one-way)
  const LANES = [[6,3],[2,2],[6,3],[1,1],[4,3],[1,1],[4,2],[1,1],[2,2],[1,1],[2,1],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]];
  // height of the surface above the draped ground: major above minor above paths
  const OFF = [.18,.18,.18,.18,.18,.18,.18,.18,.18,.18,.14,.10,.06,.24,.13,.15,.18,.10,.18];
  // target radius of the arcs that replace polyline corners (m)
  const RT = [500,90,300,60,140,35,90,30,60,25,30,0,0,0,40,150,60,0,30];
  const grpOf = c => (c === 11 || c === 17) ? 1 : c === 12 ? 2 : 0;
  const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixC = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v)*t));
  let COL = ['#7c7e7c','#7e807e','#848582','#848582','#868784','#868784','#888986','#888986','#8c8d89','#8c8d89','#959692','#a9a8a2','#cdc4b0','#5f6163','#7d7e7a','#a39c90','#d8d4ca','#bdb4a4','#7a7b78'].map(rgb);
  let COLF = COL.map(c => mixC(c, rgb('#e3e1d9'), 0.32));          // foreign context roads: paler
  const C_SIDE = rgb('#d2cec4'), C_CONC = rgb('#d8d4ca'), C_UNDER = rgb('#a19e97'), C_PIER = rgb('#cac5bb'), C_PLANT = rgb('#6c9a4e'),
        C_ROOF = rgb('#6a7a86'), C_POST = rgb('#8b9296'), C_BLOCK = rgb('#cfc8ba'), C_RAILG = rgb('#9aa0a2'), C_WOOD = rgb('#a99b85'),
        C_DARK = rgb('#17181a'), C_TUN = rgb('#4a4c4e'), C_BARR = rgb('#cfcbc2'), C_JOINT = [58,58,60,0];
  let C_WALK = rgb('#a8a49b'), C_KTOP = rgb('#bab7af'), C_KFACE = rgb('#8a8781'), C_GRASS = rgb('#7c9f52'), C_SHRUB = rgb('#5a8240'),
      C_POLE = rgb('#9aa1a6'), C_POLED = rgb('#7b8287'), C_HEAD = rgb('#c9ced1');
  const M_WHITE = [244,244,238,0], M_YEL = [236,190,58,0], M_RWY = [246,246,242,255], M_RAIL = [88,84,80,0], M_POOL = [255,238,214,128];
  const L_LED = [236,240,244], L_LEDW = [246,240,228], L_RWY = [255,244,214], L_TWY = [80,255,140], L_MAST = [240,240,236];
  let LAMP_SP = [50,45,42,40,38,40,38,40,40,40,40,0,0,0,0,0,0,0,40];

  // ---------------------------------------------------------------- v22: US style (the San Francisco Bay Area map)
  // Right-hand traffic (the partner carriageway, the median, the kerb-side lamps, the stop lines are mirrored), US markings
  // (double yellow centre lines, yellow left / white right edge lines, long freeway dashes with raised markers, stop bars,
  // continental and two-line crosswalks), cobra-head street lights (galvanised poles, curved mast arms; wooden utility poles on
  // some local streets), LED white and some sodium light, light-grey concrete sidewalks and kerbs, Caltrans concrete freeways
  // with concrete median barriers. On when the app defines SGR_BAY (or setUS(true)); Singapore keeps its own look exactly.
  let US = false, USSET = null, STYLED = false;
  const SG_STYLE = {COL, COLF, C_WALK, C_KTOP, C_KFACE, C_GRASS, C_SHRUB, C_POLE, C_POLED, C_HEAD, LAMP_SP};
  const US_COL = ['#787976','#7b7c79','#7a7b78','#7c7d7a','#7c7d7a','#7e7f7c','#7e7f7c','#80817e','#80817e','#828380','#858683','#9a9a96','#c3c1ba','#5f6163','#7d7e7a','#a39c90','#d8d4ca','#bdb4a4','#7a7b78'].map(rgb);
  const US_STYLE = {COL:US_COL, COLF:US_COL.map(c => mixC(c, rgb('#e3e1d9'), 0.32)), C_WALK:rgb('#bebcb5'), C_KTOP:rgb('#cdcac2'), C_KFACE:rgb('#a29f98'),
    C_GRASS:rgb('#8b9b5a'), C_SHRUB:rgb('#66783f'), C_POLE:rgb('#a9adac'), C_POLED:rgb('#858a8b'), C_HEAD:rgb('#b7bbbc'),
    LAMP_SP:[66,60,50,50,46,48,46,48,50,56,66,0,0,0,0,0,0,0,40]};
  const U_CONC = rgb('#a5a39c'), U_SHLD = rgb('#8e8d88'), U_BARR = rgb('#c9c6be'), U_BTOP = rgb('#d6d3cb'), U_DIRT = rgb('#a89a6c'),
        U_WOOD = rgb('#6e5d4a'), U_WOODD = rgb('#57493a'), U_LENS = rgb('#e8e6dc'),
        U_LED = [246,242,230], U_NA = [255,172,80], U_POOL = [255,242,224,128], U_POOLE = [0,242,224,128], U_POOLN = [255,176,92,128], U_POOLNE = [0,176,92,128];
  const usWant = () => { if (USSET !== null) return USSET; try { return (typeof SGR_US !== 'undefined' && !!SGR_US) || (typeof SGR_BAY !== 'undefined' && !!SGR_BAY); } catch (e){ return false; } };
  function style(){
    const u = usWant(); if (STYLED && u === US) return; STYLED = true; US = u;
    ({COL, COLF, C_WALK, C_KTOP, C_KFACE, C_GRASS, C_SHRUB, C_POLE, C_POLED, C_HEAD, LAMP_SP} = u ? US_STYLE : SG_STYLE);
  }
  // integer / string hashes -> [0, 1)
  const h01 = n => { let h = Math.imul((n | 0) ^ 0x5bd1e995, 0x9E3779B1); h ^= h >>> 15; h = Math.imul(h, 0x85EBCA77); h ^= h >>> 13; return (h >>> 0)/4294967296; };
  const sh01 = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h01(h); };
  // Bay map world metres of lat / lon (the app's sgXY for the Bay: x = (lon + 122.19)·88300, y = (lat − 37.625)·110989)
  const bxy = (lat, lon) => [(lon + 122.19)*88300, (lat - 37.625)*110989];
  const ZBOX = [[37.706, -122.515, 37.835, -122.355, 2], [37.792, -122.282, 37.816, -122.257, 2], [37.862, -122.274, 37.876, -122.258, 2], [37.322, -121.902, 37.343, -121.877, 2],
    [37.760, -122.315, 37.900, -122.200, 1], [37.420, -122.170, 37.460, -122.130, 1]].map(b => { const p = bxy(b[0], b[1]), q = bxy(b[2], b[3]); return [p[0], p[1], q[0], q[1], b[4]]; });
  // 2: dense city (San Francisco, downtown Oakland / Berkeley / San José): continental crosswalks at signals, all-way stops;
  // 1: older urban grids (Oakland, Berkeley, Alameda, Palo Alto): two-line crosswalks; 0: suburbs
  function zoneOf(x, y){ for (const b of ZBOX) if (x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]) return b[4]; return 0; }
  // the road colour of a line: Caltrans concrete (PCC) on much of the freeway network, by route and 5 km stretch (some stretches
  // overlaid with asphalt), asphalt on most ramps and everywhere else
  const PCC = {'I 280':0.9, 'I 880':0.85, 'I 680':0.8, 'I 580':0.65, 'I 238':0.7, 'I 380':0.8, 'US 101':0.7, 'I 80':0.55, 'CA 85':0.7, 'CA 87':0.6, 'CA 237':0.6, 'CA 17':0.5, 'CA 92':0.5};
  function usCol(L, c, li){
    if (c > 1 || (L.flags & 8)) return COL[c];
    const C = X.C, U = C.ucol || (C.ucol = new Int8Array(C.lines.length).fill(-1));
    if (U[li] < 0){
      const P = L.P, k = (P.length >> 2) << 1, cx = Math.floor(P[k]/5000), cy = Math.floor(P[k+1]/5000), rf = (L.ref || '').split(';')[0];
      U[li] = (c === 0 ? sh01(rf + ':' + cx + ':' + cy) < (PCC[rf] !== undefined ? PCC[rf] : 0.5) : sh01('l' + cx + ':' + cy + ':' + Math.round(P[0])) < 0.3) ? 1 : 0;
    }
    return U[li] ? U_CONC : COL[c];
  }
  const lineCol = (L, c, foreign, li) => foreign ? COLF[c] : US ? usCol(L, c, li) : COL[c];
  const CAPN = c => c === 12 || c === 13 || c === 15 || c === 16 ? 0 : 1;
  const isJ = c => c <= 11;                       // classes that form junctions
  const SWC = c => c >= 2 && c <= 10;             // classes with kerbs and footways (urban, at grade)

  // ---------------------------------------------------------------- decode
  function decode(buf, names, refs){
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    if (u8[0] !== 83 || u8[1] !== 71 || u8[2] !== 82 || u8[3] !== 49) throw new Error('SGRoads.decode: not SGR1');
    let o = 4;
    const vu = () => { let v = 0, m = 1, b; do { b = u8[o++]; v += (b & 127)*m; m *= 128; } while (b & 128); return v; };
    const n = vu(), lines = new Array(n); let px = 0, py = 0;
    for (let i = 0; i < n; i++){
      const c = u8[o++], f = u8[o++], ni = vu(), ri = vu(), np = vu(), P = new Float32Array(np*2);
      for (let k = 0; k < np; k++){
        const a = vu(), b = vu();
        px += (a % 2) ? -(a + 1)/2 : a/2; py += (b % 2) ? -(b + 1)/2 : b/2;
        P[k*2] = px/4; P[k*2+1] = py/4;
      }
      let E = null;
      if (f & 4){ const sc = (f & 32) ? 2.5 : 5; E = new Float32Array(np); for (let k = 0; k < np; k++) E[k] = u8[o++]/sc; }
      const nm = ni && names ? names[ni] : null;
      lines[i] = {c, flags:f, name:nm ? [nm[0] || '', nm[1] || ''] : null, ref:(ri && refs) ? refs[ri] || null : null, P, E};
    }
    return lines;
  }

  // ---------------------------------------------------------------- ground: upper bound of both triangulations of the 70 m terrain grid
  let GH = null, GN = 0, GHALF = -1, gOK = false;
  function initGround(){
    const ts = (() => { try { return typeof TS !== 'undefined' && TS > 1 ? TS : 70; } catch (e){ return 70; } })();
    if (GHALF === HALF && GH && GT === ts) return;
    GT = ts; GHALF = HALF; GN = Math.round(2*HALF/GT) + 1; GH = new Float32Array(GN*GN);
    for (let j = 0; j < GN; j++){ const y = -HALF + j*GT; for (let i = 0; i < GN; i++) GH[j*GN + i] = hAt(-HALF + i*GT, y); }
    gOK = true; const r = mulberry32(77);
    for (let k = 0; k < 96 && gOK; k++){
      const x = (r()*2 - 1)*HALF*0.95, y = (r()*2 - 1)*HALF*0.95;
      let fx = (x + HALF)/GT, fy = (y + HALF)/GT; const i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, q = j*GN + i;
      const b = (GH[q]*(1 - u) + GH[q+1]*u)*(1 - v) + (GH[q+GN]*(1 - u) + GH[q+GN+1]*u)*v;
      if (Math.abs(b - hAt(x, y)) > 0.02) gOK = false;
    }
  }
  function G(x, y){
    if (!gOK) return hC(x, y);
    let fx = (x + GHALF)/GT, fy = (y + GHALF)/GT;
    fx = fx < 0 ? 0 : fx > GN - 1.0001 ? GN - 1.0001 : fx; fy = fy < 0 ? 0 : fy > GN - 1.0001 ? GN - 1.0001 : fy;
    const i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, q = j*GN + i;
    const a = GH[q], b = GH[q+1], d = GH[q+GN], c = GH[q+GN+1];
    let h = (a + (b - a)*u)*(1 - v) + (d + (c - d)*u)*v;
    const t = a - b + c - d;                                        // twist: the two triangulations lie on either side of the bilinear patch
    if (t > 0) h += t*(u >= v ? v*(1 - u) : u*(1 - v));
    else if (t < 0){ const w = 1 - u; h -= t*(w >= v ? v*(1 - w) : w*(1 - v)); }
    return h > -0.3 ? h : -0.3;
  }

  // ---------------------------------------------------------------- per-lines caches: tile index, vertex nodes, junction graph
  const CACHE = new WeakMap();
  const hwOf = L => (WID[L.c] ? WID[L.c][(L.flags & 1) ? 1 : 0] : 4)/2;
  function prep(lines){
    let C = CACHE.get(lines); if (C) return C;
    const n = lines.length, TXn = Math.round(2*HALF/TILE), NT = TXn*TXn;
    // tile -> lines (by bbox, a superset of the chunk tiles); line bboxes
    const tr = new Int16Array(n*4), cnt = new Int32Array(NT + 1), LBB = new Float32Array(n*4);
    const tcl = v => { const t = Math.floor((v + HALF)/TILE); return t < 0 ? 0 : t >= TXn ? TXn - 1 : t; };
    for (let i = 0; i < n; i++){
      const P = lines[i].P; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (let k = 0; k < P.length; k += 2){ const x = P[k], y = P[k+1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      LBB[i*4] = x0; LBB[i*4+1] = y0; LBB[i*4+2] = x1; LBB[i*4+3] = y1;
      const a = tcl(x0), b = tcl(y0), c = tcl(x1), d = tcl(y1); tr[i*4] = a; tr[i*4+1] = b; tr[i*4+2] = c; tr[i*4+3] = d;
      for (let ty = b; ty <= d; ty++) for (let tx = a; tx <= c; tx++) cnt[ty*TXn + tx + 1]++;
    }
    for (let t = 0; t < NT; t++) cnt[t+1] += cnt[t];
    const tl = new Int32Array(cnt[NT]), fill = cnt.slice(0, NT);
    for (let i = 0; i < n; i++) for (let ty = tr[i*4+1]; ty <= tr[i*4+3]; ty++) for (let tx = tr[i*4]; tx <= tr[i*4+2]; tx++) tl[fill[ty*TXn + tx]++] = i;
    // vertex nodes (paths, rail, runways ...: caps and dead ends): every vertex of every road line; only the two ends of paths
    const nvOf = L => L.c === 16 ? 0 : L.c === 12 ? Math.min(2, L.P.length >> 1) : L.P.length >> 1;
    let nv = 0; for (let i = 0; i < n; i++) nv += nvOf(lines[i]);
    let cap = 1; while (cap*0.6 < nv) cap <<= 1;
    const mask = cap - 1, HX = new Int32Array(cap).fill(0x7fffffff), HY = new Int32Array(cap), HN = new Int32Array(cap).fill(-1);
    let nn = 0; const ncnt = new Int32Array(nv + 1);
    const slot = (kx, ky) => { let h = (Math.imul(kx, 0x9E3779B1) ^ Math.imul(ky, 0x85EBCA77)) >>> 0; h = (h ^ (h >>> 15)) & mask;
      while (HX[h] !== 0x7fffffff && (HX[h] !== kx || HY[h] !== ky)) h = (h + 1) & mask; return h; };
    const vnode = new Int32Array(nv); let q = 0;
    for (let i = 0; i < n; i++){ const L = lines[i]; if (L.c === 16) continue; const P = L.P, st = L.c === 12 ? Math.max(2, P.length - 2) : 2;
      for (let k = 0; k < P.length; k += (k === 0 ? st : 2)){ const kx = Math.round(P[k]*2), ky = Math.round(P[k+1]*2), h = slot(kx, ky);
        if (HX[h] === 0x7fffffff){ HX[h] = kx; HY[h] = ky; HN[h] = nn++; }
        vnode[q++] = HN[h]; ncnt[HN[h] + 1]++; } }
    for (let k = 0; k < nn; k++) ncnt[k+1] += ncnt[k];
    const incL = new Int32Array(q), incV = new Int32Array(q), nf = ncnt.slice(0, nn); q = 0;
    for (let i = 0; i < n; i++){ const L = lines[i]; if (L.c === 16) continue; const m = L.P.length >> 1, st = L.c === 12 ? Math.max(1, m - 1) : 1;
      for (let k = 0; k < m; k += (k === 0 ? st : 1)){ const nd = vnode[q++], j = nf[nd]++; incL[j] = i; incV[j] = k; } }
    C = {TXn, tileOff:cnt, tileLines:tl, LBB, HX, HY, HN, mask, slot, nodeOff:ncnt, incL, incV, pg:null, lines, cx:null, part:null};
    detect(C);
    CACHE.set(lines, C); return C;
  }
  function nodeAt(C, x, y){ const h = C.slot(Math.round(x*2), Math.round(y*2)); return C.HN[h]; }
  // unit direction of line L leaving vertex k (towards k+dir)
  function dirAt(L, k, dir, out){
    const P = L.P, m = P.length >> 1; let j = k + dir;
    while (j >= 0 && j < m){ const dx = P[j*2] - P[k*2], dy = P[j*2+1] - P[k*2+1], l = hyp(dx, dy); if (l > 0.05){ out[0] = dx/l; out[1] = dy/l; return true; } j += dir; }
    return false;
  }
  const _d1 = [0, 0], _d2 = [0, 0];

  // ---------------------------------------------------------------- junction graph
  // Lines of classes 0-11 meet at shared vertices, at a vertex lying on another line's segment (the preprocessing simplified
  // collinear junction vertices away) or where two segments cross. Every such contact (same level) is an event; events
  // within 2.2 m are one node; nodes joined by short carriageway pieces (dual carriageway crossings) are one complex.
  const JT = 1.6;
  function detect(C){
    const T0 = Date.now(), TL = (m) => { if (typeof process !== 'undefined' && process.env && process.env.SGRT) console.log('detect', m, Date.now() - T0); };
    const lines = C.lines, n = lines.length;
    const vOff = new Int32Array(n + 1); for (let i = 0; i < n; i++) vOff[i+1] = vOff[i] + (lines[i].P.length >> 1);
    const NV = vOff[n], VS = new Float32Array(NV), LOV = new Int32Array(NV);
    for (let i = 0; i < n; i++){ const P = lines[i].P, o = vOff[i], m = P.length >> 1; let s = 0; for (let k = 0; k < m; k++){ if (k){ const dx = P[k*2] - P[k*2-2], dy = P[k*2+1] - P[k*2-1]; s += Math.sqrt(dx*dx + dy*dy); } VS[o+k] = s; LOV[o+k] = i; } }
    C.vOff = vOff; C.VS = VS;
    const LEN = i => VS[vOff[i+1] - 1];
    // events: (x, y, e) + incidences (line, arc position, at-vertex flag); a seed per shared vertex, one per touch / crossing
    let EX = new Float64Array(65536), EY = new Float64Array(65536), EE = new Float32Array(65536), EO = new Int32Array(65537), nev = 0;
    let IL = new Int32Array(131072), ISs = new Float32Array(131072), IV = new Uint8Array(131072), ni = 0;
    const grow = (A, T) => { const t = new T(A.length*2); t.set(A); return t; };
    const inc = (li, s, v) => { if (ni === IL.length){ IL = grow(IL, Int32Array); ISs = grow(ISs, Float32Array); IV = grow(IV, Uint8Array); } IL[ni] = li; ISs[ni] = s; IV[ni] = v; ni++; };
    const ev = (x, y, e) => { if (nev + 1 >= EX.length){ EX = grow(EX, Float64Array); EY = grow(EY, Float64Array); EE = grow(EE, Float32Array); EO = grow(EO, Int32Array); } EX[nev] = x; EY[nev] = y; EE[nev] = e; EO[nev] = ni; nev++; };
    // 1. shared vertices (the vertex hash of prep)
    for (let nd = 0, NN = C.nodeOff.length - 1; nd < NN; nd++){
      const o0 = C.nodeOff[nd], o1 = C.nodeOff[nd+1]; if (o1 - o0 < 2) continue;
      let cnt = 0, e0 = 0, first = -1;
      for (let j = o0; j < o1; j++){ const L = lines[C.incL[j]]; if (!isJ(L.c)) continue; const e = L.E ? L.E[C.incV[j]] : 0; if (first < 0){ first = j; e0 = e; } if (Math.abs(e - e0) <= 1.2) cnt++; }
      if (cnt < 2) continue;
      const L0 = lines[C.incL[first]], vx = L0.P[C.incV[first]*2], vy = L0.P[C.incV[first]*2+1];
      ev(vx, vy, e0);
      for (let j = o0; j < o1; j++){ const li = C.incL[j], L = lines[li]; if (!isJ(L.c)) continue; const e = L.E ? L.E[C.incV[j]] : 0; if (Math.abs(e - e0) > 1.2) continue; inc(li, VS[vOff[li] + C.incV[j]], 1); }
    }
    TL('seeds ' + nev);
    // 2. crossings (segments registered in every 32 m cell they pass) and line ends touching another line's segment
    const CS = 32, NCX = Math.ceil(2*HALF/CS) + 4, NCELL = NCX*NCX, ccnt = new Int32Array(NCELL + 1);
    const visit = (ax, ay, bx, by, fn) => {
      const x0 = Math.floor(((ax < bx ? ax : bx) - 0.05 + HALF)/CS) + 2, x1 = Math.floor(((ax > bx ? ax : bx) + 0.05 + HALF)/CS) + 2;
      const y0 = Math.floor(((ay < by ? ay : by) - 0.05 + HALF)/CS) + 2, y1 = Math.floor(((ay > by ? ay : by) + 0.05 + HALF)/CS) + 2;
      if (x0 === x1 && y0 === y1){ fn(y0*NCX + x0); return; }
      const nx = by - ay, ny = ax - bx, r = (Math.abs(nx) + Math.abs(ny))*(CS*0.5 + 0.05);
      for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++){
        const mx = (cx - 2 + 0.5)*CS - HALF, my = (cy - 2 + 0.5)*CS - HALF;
        if (Math.abs(nx*(mx - ax) + ny*(my - ay)) <= r) fn(cy*NCX + cx);
      }
    };
    for (let i = 0; i < n; i++){ const L = lines[i]; if (!isJ(L.c)) continue; const P = L.P, m = P.length >> 1;
      for (let k = 0; k + 1 < m; k++) visit(P[k*2], P[k*2+1], P[k*2+2], P[k*2+3], key => { ccnt[key + 1]++; }); }
    for (let i = 0; i < NCELL; i++) ccnt[i+1] += ccnt[i];
    const cseg = new Int32Array(ccnt[NCELL]), cfill = ccnt.slice(0, NCELL);
    for (let i = 0; i < n; i++){ const L = lines[i]; if (!isJ(L.c)) continue; const P = L.P, m = P.length >> 1, o = vOff[i];
      for (let k = 0; k + 1 < m; k++){ const gid = o + k; visit(P[k*2], P[k*2+1], P[k*2+2], P[k*2+3], key => { cseg[cfill[key]++] = gid; }); } }
    TL('cells ' + cseg.length);
    const JT2 = JT*JT, cellOfXY = (x, y) => (Math.floor((y + HALF)/CS) + 2)*NCX + Math.floor((x + HALF)/CS) + 2;
    for (let key = 0; key < NCELL; key++){
      const r0 = ccnt[key], r1 = ccnt[key+1]; if (r1 - r0 < 2) continue;
      for (let p = r0; p + 1 < r1; p++){
        const gA = cseg[p], iA = LOV[gA], kA = gA - vOff[iA], LA = lines[iA], PA = LA.P, EA_ = LA.E;
        const ax = PA[kA*2], ay = PA[kA*2+1], bx = PA[kA*2+2], by = PA[kA*2+3], ex = bx - ax, ey = by - ay, sa0 = VS[gA], la = VS[gA+1] - sa0;
        for (let q = p + 1; q < r1; q++){
          const gB = cseg[q], iB = LOV[gB]; if (iB === iA) continue;
          const kB = gB - vOff[iB], LB = lines[iB], PB = LB.P;
          const cx = PB[kB*2], cy = PB[kB*2+1], fx = PB[kB*2+2] - cx, fy = PB[kB*2+3] - cy, den = ex*fy - ey*fx;
          if (den > -1e-9 && den < 1e-9) continue;
          const u = ((cx - ax)*fy - (cy - ay)*fx)/den; if (u <= 1e-6 || u >= 1 - 1e-6) continue;
          const v = ((cx - ax)*ey - (cy - ay)*ex)/den; if (v <= 1e-6 || v >= 1 - 1e-6) continue;
          const x = ax + ex*u, y = ay + ey*u; if (cellOfXY(x, y) !== key) continue;
          const EB_ = LB.E, e1 = EA_ ? EA_[kA] + (EA_[kA+1] - EA_[kA])*u : 0, e2 = EB_ ? EB_[kB] + (EB_[kB+1] - EB_[kB])*v : 0;
          if (Math.abs(e1 - e2) > 1.2) continue;
          const sb0 = VS[gB]; ev(x, y, (e1 + e2)*0.5); inc(iA, sa0 + la*u, 0); inc(iB, sb0 + (VS[gB+1] - sb0)*v, 0);
        }
      }
    }
    TL('crossings ' + nev);
    // line ends on another line's segment (not at one of its vertices)
    for (let i = 0; i < n; i++){
      const L = lines[i]; if (!isJ(L.c)) continue; const P = L.P, m = P.length >> 1, o = vOff[i];
      for (let w = 0; w < 2; w++){
        const k = w ? m - 1 : 0, qx = P[k*2], qy = P[k*2+1], e1 = L.E ? L.E[k] : 0;
        const gx0 = Math.floor((qx - JT + HALF)/CS) + 2, gx1 = Math.floor((qx + JT + HALF)/CS) + 2, gy0 = Math.floor((qy - JT + HALF)/CS) + 2, gy1 = Math.floor((qy + JT + HALF)/CS) + 2;
        let lastG = -1;
        for (let cy = gy0; cy <= gy1; cy++) for (let cx = gx0; cx <= gx1; cx++){
          const key = cy*NCX + cx;
          for (let p = ccnt[key]; p < ccnt[key+1]; p++){
            const gB = cseg[p], iB = LOV[gB]; if (iB === i || gB === lastG) continue;
            const kB = gB - vOff[iB], LB = lines[iB], PB = LB.P, ax = PB[kB*2], ay = PB[kB*2+1], bx = PB[kB*2+2], by = PB[kB*2+3];
            if ((qx === ax && qy === ay) || (qx === bx && qy === by)) continue;
            const ex = bx - ax, ey = by - ay, l2 = ex*ex + ey*ey; if (l2 < 1e-8) continue;
            let u = ((qx - ax)*ex + (qy - ay)*ey)/l2; if (u <= 0 || u >= 1) continue;
            const hx = ax + ex*u - qx, hy = ay + ey*u - qy; if (hx*hx + hy*hy >= JT2) continue;
            const e2 = LB.E ? LB.E[kB] + (LB.E[kB+1] - LB.E[kB])*u : 0; if (Math.abs(e1 - e2) > 1.2) continue;
            lastG = gB; const sb0 = VS[gB];
            ev(qx, qy, (e1 + e2)*0.5); inc(i, VS[o + k], 1); inc(iB, sb0 + (VS[gB+1] - sb0)*u, 0);
          }
        }
      }
    }
    EO[nev] = ni; TL('events ' + nev + ' inc ' + ni);
    // cluster events within 2.2 m (union-find; 2.5 m grid cells in an open-addressing hash, linked lists)
    const par = new Int32Array(nev); for (let i = 0; i < nev; i++) par[i] = i;
    const find = a => { while (par[a] !== a){ par[a] = par[par[a]]; a = par[a]; } return a; };
    const CG = 2.5; let hc = 1; while (hc < nev*2) hc <<= 1; const hm = hc - 1, HK = new Int32Array(hc).fill(-1), HH = new Int32Array(hc), nxt = new Int32Array(nev);
    const hslot = k => { let h = Math.imul(k, 0x9E3779B1) >>> 0; h = (h ^ (h >>> 16)) & hm; while (HK[h] !== -1 && HK[h] !== k) h = (h + 1) & hm; return h; };
    const gxs = new Int32Array(nev), gys = new Int32Array(nev);
    for (let i = 0; i < nev; i++){ const gx = Math.floor((EX[i] + HALF)/CG), gy = Math.floor((EY[i] + HALF)/CG); gxs[i] = gx; gys[i] = gy; const k = gx*65536 + gy, h = hslot(k);
      if (HK[h] === -1){ HK[h] = k; nxt[i] = -1; } else nxt[i] = HH[h]; HH[h] = i; }
    for (let i = 0; i < nev; i++){
      const gx = gxs[i], gy = gys[i];
      for (let ddx = -1; ddx <= 1; ddx++) for (let ddy = -1; ddy <= 1; ddy++){
        const h = hslot((gx + ddx)*65536 + gy + ddy); if (HK[h] === -1) continue;
        for (let j = HH[h]; j >= 0; j = nxt[j]){ if (j >= i) continue; const hx = EX[i] - EX[j], hy = EY[i] - EY[j]; if (hx*hx + hy*hy < 4.84 && Math.abs(EE[i] - EE[j]) <= 1.2){ const ra = find(i), rb = find(j); if (ra !== rb) par[ra] = rb; } }
      }
    }
    TL('clustered');
    // nodes: per cluster, incidences grouped by line (positions within 5 m are one incidence; a vertex position wins)
    const ord = new Int32Array(nev), cs0 = new Int32Array(nev + 1);
    for (let i = 0; i < nev; i++){ par[i] = find(i); cs0[par[i] + 1]++; }
    for (let i = 0; i < nev; i++) cs0[i+1] += cs0[i];
    { const f = cs0.slice(0, nev); for (let i = 0; i < nev; i++) ord[f[par[i]]++] = i; }
    let NX = new Float64Array(16384), NY = new Float64Array(16384), NE = new Float32Array(16384), NA = new Uint8Array(16384), nN = 0;
    let OL = new Int32Array(65536), OS = new Float32Array(65536), ON = new Int32Array(65536), nO = 0;
    let tL = new Int32Array(64), tS = new Float32Array(64), tV = new Uint8Array(64);
    for (let r = 0; r < nev; r++){
      const a0 = cs0[r], a1 = cs0[r+1]; if (a1 === a0) continue;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, sx = 0, sy = 0, se = 0, vx = 0, vy = 0, vn = 0, m = 0;
      for (let p = a0; p < a1; p++){
        const i = ord[p], x = EX[i], y = EY[i];
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; sx += x; sy += y; se += EE[i];
        let allV = true;
        for (let q = EO[i]; q < EO[i+1]; q++){
          if (m === tL.length){ tL = grow(tL, Int32Array); tS = grow(tS, Float32Array); tV = grow(tV, Uint8Array); }
          // insertion by (line, s)
          let w = m++; const li = IL[q], s = ISs[q];
          while (w > 0 && (tL[w-1] > li || (tL[w-1] === li && tS[w-1] > s))){ tL[w] = tL[w-1]; tS[w] = tS[w-1]; tV[w] = tV[w-1]; w--; }
          tL[w] = li; tS[w] = s; tV[w] = IV[q]; if (!IV[q]) allV = false;
        }
        if (allV){ vx += x; vy += y; vn++; }
      }
      const ce = a1 - a0;
      if (x1 - x0 > 14 || y1 - y0 > 14) continue;                     // long overlaps of parallel lines are not junctions
      const o0 = nO; let arms = 0;
      for (let p = 0; p < m;){
        const li = tL[p], s0 = tS[p]; let q = p, ss = 0, sn = 0, sv = -1;
        while (q < m && tL[q] === li && tS[q] - s0 < 5){ ss += tS[q]; sn++; if (tV[q]) sv = tS[q]; q++; }
        p = q;
        const s = sv >= 0 ? sv : ss/sn, Lt = LEN(li);
        if (nO === OL.length){ OL = grow(OL, Int32Array); OS = grow(OS, Float32Array); ON = grow(ON, Int32Array); }
        OL[nO] = li; OS[nO] = s < 0.3 ? 0 : s > Lt - 0.3 ? Lt : s; ON[nO] = nN; nO++;
        arms += (s < 0.3 || s > Lt - 0.3) ? 1 : 2;
      }
      if (nO - o0 < 2 || arms < 2){ nO = o0; continue; }
      if (nN === NX.length){ NX = grow(NX, Float64Array); NY = grow(NY, Float64Array); NE = grow(NE, Float32Array); NA = grow(NA, Uint8Array); }
      NX[nN] = vn ? vx/vn : sx/ce; NY[nN] = vn ? vy/vn : sy/ce; NE[nN] = se/ce; NA[nN] = arms > 255 ? 255 : arms; nN++;
    }
    TL('nodes ' + nN);
    const nI = nO;
    // per line: junction entries sorted by s
    const lJO = new Int32Array(n + 1); for (let k = 0; k < nI; k++) lJO[OL[k] + 1]++;
    for (let i = 0; i < n; i++) lJO[i+1] += lJO[i];
    const lJS = new Float32Array(nI), lJN = new Int32Array(nI), lf = lJO.slice(0, n);
    for (let k = 0; k < nI; k++){ const j = lf[OL[k]]++; lJS[j] = OS[k]; lJN[j] = ON[k]; }
    for (let i = 0; i < n; i++){ const a = lJO[i], b = lJO[i+1]; if (b - a < 2) continue;      // insertion sort (few entries)
      for (let p = a + 1; p < b; p++){ const s = lJS[p], nd = lJN[p]; let q = p - 1; while (q >= a && lJS[q] > s){ lJS[q+1] = lJS[q]; lJN[q+1] = lJN[q]; q--; } lJS[q+1] = s; lJN[q+1] = nd; } }
    // node incidences (CSR)
    const nIO = new Int32Array(nN + 1); for (let k = 0; k < nI; k++) nIO[ON[k] + 1]++;
    for (let i = 0; i < nN; i++) nIO[i+1] += nIO[i];
    const nIL = new Int32Array(nI), nIS = new Float32Array(nI), nIP = new Int32Array(nI), nf2 = nIO.slice(0, nN);
    for (let k = 0; k < nI; k++){ const j = nf2[ON[k]]++; nIL[j] = OL[k]; nIS[j] = OS[k]; }
    for (let i = 0; i < n; i++) for (let p = lJO[i]; p < lJO[i+1]; p++){ const nd = lJN[p]; for (let q = nIO[nd]; q < nIO[nd+1]; q++) if (nIL[q] === i && nIS[q] === lJS[p]){ nIP[q] = p; break; } }
    // complexes: nodes joined by short internal carriageway pieces
    const cpar = new Int32Array(nN); for (let i = 0; i < nN; i++) cpar[i] = i;
    const cfind = a => { while (cpar[a] !== a){ cpar[a] = cpar[cpar[a]]; a = cpar[a]; } return a; };
    // major arms per node (classes 0-10, no slip roads): only crossings of real roads merge into complexes
    const NM = new Uint8Array(nN);
    for (let nd = 0; nd < nN; nd++){ let m = 0; for (let q = nIO[nd]; q < nIO[nd+1]; q++){ const L = lines[nIL[q]]; if (L.c > 10 || (L.flags & 16)) continue; const s = nIS[q], Lt = LEN(nIL[q]); m += (s < 0.3 || s > Lt - 0.3) ? 1 : 2; } NM[nd] = m > 255 ? 255 : m; }
    const J = {nN, NX:NX.subarray(0, nN), NY:NY.subarray(0, nN), NE:NE.subarray(0, nN), NA:NA.subarray(0, nN), NM, nIO, nIL, nIS, nIP, lJO, lJS, lJN, LEN};
    C.J = J;
    for (let i = 0; i < n; i++){ for (let p = lJO[i]; p + 1 < lJO[i+1]; p++) if (internal(C, i, p)){ const a = cfind(lJN[p]), b = cfind(lJN[p+1]); if (a !== b) cpar[a] = b; } }
    // component sizes / extents: oversized ones fall back to single nodes
    const croot = new Int32Array(nN), csz = new Int32Array(nN), cbb = new Float64Array(nN*4);
    for (let i = 0; i < nN; i++){ const r = cfind(i); croot[i] = r; const o = r*4;
      if (!csz[r]){ cbb[o] = cbb[o+2] = J.NX[i]; cbb[o+1] = cbb[o+3] = J.NY[i]; } else { if (J.NX[i] < cbb[o]) cbb[o] = J.NX[i]; if (J.NY[i] < cbb[o+1]) cbb[o+1] = J.NY[i]; if (J.NX[i] > cbb[o+2]) cbb[o+2] = J.NX[i]; if (J.NY[i] > cbb[o+3]) cbb[o+3] = J.NY[i]; }
      csz[r]++; }
    const cxOf = new Int32Array(nN), cmap = new Int32Array(nN).fill(-1); let nC = 0;
    for (let i = 0; i < nN; i++){
      const r = croot[i], o = r*4, big = csz[r] > 8 || cbb[o+2] - cbb[o] > 95 || cbb[o+3] - cbb[o+1] > 95;
      if (big){ cxOf[i] = nC++; continue; }
      if (cmap[r] < 0) cmap[r] = nC++;
      cxOf[i] = cmap[r];
    }
    const cxO = new Int32Array(nC + 1); for (let i = 0; i < nN; i++) cxO[cxOf[i] + 1]++;
    for (let i = 0; i < nC; i++) cxO[i+1] += cxO[i];
    const cxN = new Int32Array(nN), cf = cxO.slice(0, nC); for (let i = 0; i < nN; i++) cxN[cf[cxOf[i]]++] = i;
    J.cxOf = cxOf; J.cxO = cxO; J.cxN = cxN; J.nC = nC; J.res = new Map(); TL('complexes');
  }
  // line i's junction entries p and p+1 are both ends of a short internal piece of one junction complex
  function internal(C, i, p){
    const J = C.J, L = C.lines[i], c = L.c; if (c > 10 || (L.flags & 16)) return false;
    const a = J.lJN[p], b = J.lJN[p+1]; if (a === b || J.NM[a] < 3 || J.NM[b] < 3) return false;
    const d = J.lJS[p+1] - J.lJS[p], lim = c <= 6 ? 40 : c <= 8 ? 32 : 24;
    return d > 0.3 && d <= lim && Math.abs(J.NE[a] - J.NE[b]) < 1 && J.NE[a] < 0.5;
  }

  // road pieces (classes 0-11, 13-15, 18; <= 50 m) in a 50 m grid: piers keep off the roads below, medians find the other carriageway
  // (roadDrive: service roads too, for piers and lamp poles; partnerAt / onOtherRoad skip them as before)
  function roadGrid(C){
    if (C.rg) return C.rg;
    const lines = C.lines, cells = new Map(), PG = 50, M = 4;
    let S = new Float32Array(1 << 18), LI = new Int32Array(1 << 15), FL = new Uint8Array(1 << 15), CL = new Uint8Array(1 << 15), SA0 = new Float32Array(1 << 15), ns = 0;
    let KP = new Int32Array(1 << 17), np2 = 0;                                // (cell key, piece) pairs; cells: key -> cell index (compact CSR)
    for (let i = 0; i < lines.length; i++){
      const L = lines[i], c = L.c; if (!(c <= 11 || c === 13 || c === 14 || c === 15 || c === 18)) continue;
      const P = L.P, E = L.E, hw = hwOf(L), np = P.length >> 1; let sacc = 0;
      for (let k = 0; k + 1 < np; k++){
        const ax = P[k*2], ay = P[k*2+1], bx = P[k*2+2], by = P[k*2+3], ea = E ? E[k] : 0, eb = E ? E[k+1] : 0, d = hyp(bx - ax, by - ay), m = Math.max(1, Math.ceil(d/50));
        sacc += d;
        for (let j = 0; j < m; j++){
          const t0 = j/m, t1 = (j + 1)/m, x0 = ax + (bx - ax)*t0, y0 = ay + (by - ay)*t0, x1 = ax + (bx - ax)*t1, y1 = ay + (by - ay)*t1;
          if (ns*7 + 7 > S.length){ const T = new Float32Array(S.length*2); T.set(S); S = T; }
          if (ns >= LI.length){ const T = new Int32Array(LI.length*2); T.set(LI); LI = T; const F = new Uint8Array(FL.length*2); F.set(FL); FL = F; const K = new Uint8Array(CL.length*2); K.set(CL); CL = K; const Q = new Float32Array(SA0.length*2); Q.set(SA0); SA0 = Q; }
          SA0[ns] = sacc - d + d*t0;
          const o = ns*7; S[o] = x0; S[o+1] = y0; S[o+2] = x1; S[o+3] = y1; S[o+4] = hw; S[o+5] = ea + (eb - ea)*t0; S[o+6] = ea + (eb - ea)*t1;
          LI[ns] = i; CL[ns] = c; FL[ns] = (k === 0 && j === 0 ? 1 : 0) | (k === np - 2 && j === m - 1 ? 2 : 0) | ((L.flags & 1) ? 4 : 0) | ((L.flags & 16) ? 8 : 0);
          const r = hw + M, cx0 = Math.floor((Math.min(x0, x1) - r)/PG), cx1 = Math.floor((Math.max(x0, x1) + r)/PG), cy0 = Math.floor((Math.min(y0, y1) - r)/PG), cy1 = Math.floor((Math.max(y0, y1) + r)/PG);
          for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++){ if (np2*2 + 2 > KP.length){ const T = new Int32Array(KP.length*2); T.set(KP); KP = T; } KP[np2*2] = cx*4096 + cy; KP[np2*2+1] = ns; np2++; }
          ns++;
        }
      }
    }
    // cell index per pair once; pieces inside a cell ordered by class (loops that want classes <= 10 / 11 stop early), and one[cell]:
    // the line when all the cell's pieces belong to one line (else -3; callers pass li = -1 for 'any line'): queries 'other than li'
    // skip such cells at once
    let nc = 0; const CI = new Int32Array(np2); for (let q = 0; q < np2; q++){ const k = KP[q*2]; let c = cells.get(k); if (c === undefined) cells.set(k, c = nc++); CI[q] = c; }
    const off = new Int32Array(nc + 1), ids = new Int32Array(np2), one = new Int32Array(nc).fill(-2);
    for (let q = 0; q < np2; q++) off[CI[q] + 1]++;
    for (let i = 0; i < nc; i++) off[i+1] += off[i];
    { const f = off.slice(0, nc), bc = new Int32Array(20);
      for (let q = 0; q < np2; q++) bc[CL[KP[q*2+1]] + 1]++;
      for (let c = 0; c < 19; c++) bc[c+1] += bc[c];
      const ord = new Int32Array(np2); for (let q = 0; q < np2; q++) ord[bc[CL[KP[q*2+1]]]++] = q;          // pairs in class order (stable)
      for (let r = 0; r < np2; r++){ const q = ord[r], ci = CI[q], id = KP[q*2+1]; ids[f[ci]++] = id; const l = LI[id]; one[ci] = one[ci] === -2 || one[ci] === l ? l : -3; } }
    return (C.rg = {S:S.slice(0, ns*7), LI:LI.slice(0, ns), FL:FL.slice(0, ns), CL:CL.slice(0, ns), SA0:SA0.slice(0, ns), cells, off, ids, one, PG, stamp:new Int32Array(ns), gen:0});
  }
  // elevated carriageways (for telling the sidewalks of road bridges from overhead pedestrian bridges)
  function elevGrid(C){
    if (C.eg) return C.eg;
    const lines = C.lines, cells = new Map(), S = [], PG = 50;
    for (let i = 0; i < lines.length; i++){
      const L = lines[i], c = L.c, E = L.E; if (!E || c === 12 || c === 16 || c === 17) continue;
      const P = L.P, hw = hwOf(L);
      for (let k = 0; k + 1 < E.length; k++){
        if (E[k] < 1.5 && E[k+1] < 1.5) continue;
        const x0 = P[k*2], y0 = P[k*2+1], x1 = P[k*2+2], y1 = P[k*2+3], id = S.length/5; S.push(x0, y0, x1, y1, hw);
        const r = hw + 8, cx0 = Math.floor((Math.min(x0, x1) - r)/PG), cx1 = Math.floor((Math.max(x0, x1) + r)/PG), cy0 = Math.floor((Math.min(y0, y1) - r)/PG), cy1 = Math.floor((Math.max(y0, y1) + r)/PG);
        for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++){ const key = cx*4096 + cy; let a = cells.get(key); if (!a) cells.set(key, a = []); a.push(id); }
      }
    }
    return (C.eg = {S, cells, PG});
  }
  function sidewalk(L){
    const eg = elevGrid(X.C), P = L.P, E = L.E; if (!E) return false;
    let tot = 0, att = 0;
    for (let k = 0; k + 1 < E.length; k++){
      if (E[k] < 1 && E[k+1] < 1) continue;
      const x0 = P[k*2], y0 = P[k*2+1], dx = P[k*2+2] - x0, dy = P[k*2+3] - y0, d = hyp(dx, dy); if (d < 0.1) continue;
      tot += d; const mx = x0 + dx*0.5, my = y0 + dy*0.5, a = eg.cells.get(Math.floor(mx/eg.PG)*4096 + Math.floor(my/eg.PG)); if (!a) continue;
      for (const id of a){
        const o = id*5, ax = eg.S[o], ay = eg.S[o+1], ex = eg.S[o+2] - ax, ey = eg.S[o+3] - ay, l2 = ex*ex + ey*ey; if (l2 < 0.01) continue;
        let t = ((mx - ax)*ex + (my - ay)*ey)/l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
        if (hyp(mx - ax - t*ex, my - ay - t*ey) < eg.S[o+4] + 6 && Math.abs(dx*ex + dy*ey)/(d*Math.sqrt(l2)) > 0.85){ att += d; break; }
      }
    }
    return tot > 0 && att > tot*0.5;
  }
  // is a pier / pole of radius r at (x, y) clear of the roads below? emax: roads whose surface there lies higher than this (above
  // ground) are not 'below' (the deck itself, a parallel deck); li: the line it belongs to (skipped)
  function pierFree(pg, x, y, r, emax, li){
    const ci = pg.cells.get(Math.floor(x/pg.PG)*4096 + Math.floor(y/pg.PG)); if (ci === undefined) return true;
    const S = pg.S; if (emax === undefined) emax = 0.5;
    for (let j = pg.off[ci], j1 = pg.off[ci+1]; j < j1; j++){
      const id = pg.ids[j], o = id*7; if (pg.LI[id] === li) continue;
      const ax = S[o], ay = S[o+1], dx = S[o+2] - ax, dy = S[o+3] - ay, L2 = dx*dx + dy*dy;
      let t = L2 > 0 ? ((x - ax)*dx + (y - ay)*dy)/L2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      if (S[o+5] + (S[o+6] - S[o+5])*t > emax) continue;
      if (hyp(x - ax - t*dx, y - ay - t*dy) < S[o+4] + r + 0.6) return false;
    }
    return true;
  }
  // the opposite carriageway of a dual road: an antiparallel one-way piece of a similar class on the right (left-hand traffic;
  // on the left in the US)
  function partnerAt(rg, li, x, y, dx, dy, hw, c){
    const ci = rg.cells.get(Math.floor(x/rg.PG)*4096 + Math.floor(y/rg.PG)); if (ci === undefined || rg.one[ci] === li) return null;
    const S = rg.S; let best = 60, bl = -1;
    for (let j = rg.off[ci], j1 = rg.off[ci+1]; j < j1; j++){
      const id = rg.ids[j], c2 = rg.CL[id]; if (c2 > 10) break;                      // cells are ordered by class
      if (rg.LI[id] === li || !(rg.FL[id] & 4) || (rg.FL[id] & 8) || Math.abs(c2 - c) > 4) continue;
      const o = id*7; if (S[o+5] > 0.5 || S[o+6] > 0.5) continue;
      const ax = S[o], ay = S[o+1], ex = S[o+2] - ax, ey = S[o+3] - ay, l2 = ex*ex + ey*ey; if (l2 < 0.01) continue;
      const l = Math.sqrt(l2); if ((ex*dx + ey*dy)/l > -0.9) continue;
      let t = ((x - ax)*ex + (y - ay)*ey)/l2; if (t < -0.05 || t > 1.05) continue; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const px = ax + ex*t - x, py = ay + ey*t - y, side = px*dy - py*dx;                 // > 0: on the right
      if (US ? side >= 0 : side <= 0) continue;
      const d = hyp(px, py), gap = d - hw - S[o+4];
      if (gap < -0.5 || d > 75) continue;
      if (d < best){ best = d; bl = id; }
    }
    if (bl < 0) return null;
    PT.d = best; PT.hw2 = S[bl*7+4]; PT.li = rg.LI[bl]; return PT;
  }
  const PT = {d:0, hw2:0, li:-1};

  // ---------------------------------------------------------------- materials
  let MAT = null;
  const upN = sh => { sh.vertexShader = sh.vertexShader.replace('#include <beginnormal_vertex>', 'vec3 objectNormal = vec3(0.0, 1.0, 0.0);'); };
  function mats(){
    if (MAT && MAT.us === US) return MAT;
    const us = US;
    const NU = typeof NIGHT !== 'undefined' && NIGHT.uNight ? NIGHT.uNight : {value:0};
    // road surfaces: constant up normal; a faint neutral-white glow at night (LED street lighting), less on estate roads
    const surf = (f, u, k) => {
      const m = new THREE.MeshLambertMaterial({vertexColors:true, polygonOffset:true, polygonOffsetFactor:f, polygonOffsetUnits:u});
      m.onBeforeCompile = sh => {
        upN(sh); sh.uniforms.uGlowK = {value:k}; sh.uniforms.uNightK = NU;
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uGlowK;\nuniform float uNightK;')
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.92, 0.9, 0.86) * diffuseColor.rgb * uGlowK * uNightK;');
      };
      return m;
    };
    const mark = new THREE.MeshLambertMaterial({vertexColors:true, transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-4, polygonOffsetUnits:-8});
    // markings: constant up normal; alpha channel of the vertex colour = fade class (0: lane lines fade out 1.2-2.6 km, 1: runway 7-16 km,
    // 0.5: a pool of street light: shown at night only, its strength in the red channel ... see M_POOL)
    mark.onBeforeCompile = sh => {
      sh.uniforms.uNightK = NU;
      sh.vertexShader = sh.vertexShader.replace('#include <beginnormal_vertex>', 'vec3 objectNormal = vec3(0.0, 1.0, 0.0);')
        .replace('#include <common>', '#include <common>\nvarying float vFadeD;').replace('#include <project_vertex>', '#include <project_vertex>\nvFadeD = -mvPosition.z;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vFadeD;\nuniform float uNightK;\nfloat vPool;')
        .replace('#include <color_fragment>', '#ifdef USE_COLOR_ALPHA\nvec4 mcol = vColor;\n#else\nvec4 mcol = vec4(1.0);\n#endif\nvPool = 1.0 - step(0.3, abs(mcol.a - 0.5));\ndiffuseColor.rgb *= mix(mcol.rgb, vec3(1.0), vPool);\nfloat fdD = mix(2600.0, 16000.0, mcol.a * (1.0 - vPool));\ndiffuseColor.a *= mix(1.0 - smoothstep(fdD*0.45, fdD, vFadeD), mcol.r * uNightK * 0.32 * (1.0 - smoothstep(700.0, 1800.0, vFadeD)), vPool);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += ' + (us ? 'vec3(1.0, mcol.g, mcol.b)' : 'vec3(1.0, 0.95, 0.88)') + ' * vPool * 0.9 + vec3(0.92, 0.9, 0.86) * diffuseColor.rgb * 0.34 * uNightK * (1.0 - vPool);');
    };
    // (US: the light pool's colour comes from its vertex colour, LED white or sodium orange)
    if (us) mark.customProgramCacheKey = () => 'sgr-mark-us';
    // street lamp heads: small neutral-white LED glows, following the app's lamp opacity
    let lamp = typeof matLamp !== 'undefined' ? matLamp : null;
    if (lamp && typeof THREE.PointsMaterial === 'function'){
      const m = new THREE.PointsMaterial({size:7, map:typeof lampTex !== 'undefined' ? lampTex : null, color:0xffffff, vertexColors:true, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true});
      m.userData.base = lamp; lamp = m;
    }
    MAT = {surf:[surf(-2, -4, 0.3), surf(-1.5, -3, 0.12), surf(-1, -2, 0.06)], mark, struct:new THREE.MeshLambertMaterial({vertexColors:true}), lamp, us:US};
    return MAT;
  }

  // ---------------------------------------------------------------- indexed geometry buffers (positions relative to the tile centre)
  // vertex data grows by doubling up to BS vertices, then in blocks of BS (no big re-copies); geom() packs it exactly once
  const BS = 16384, IBS = 49152;
  class Buf {
    constructor(ox, oy, cs, nrm){
      this.ox = ox; this.oy = oy; this.cs = cs; this.n = 0; this.base = 0; this.cap = 2048;
      this.p = new Float32Array(6144); this.c = new Uint8Array(2048*cs); this.q = nrm ? new Int8Array(6144) : null;
      this.fb = [];                                                   // full vertex blocks [p, c, q]
      this.i0 = new Uint32Array(6144); this.f0 = 0; this.l0 = []; this.i1 = new Uint32Array(0); this.f1 = 0; this.l1 = [];   // index layers: current block, its fill, full blocks
      this.b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    }
    grow(){
      if (this.cap < BS){
        const cap = this.cap*2, p = new Float32Array(cap*3), c = new Uint8Array(cap*this.cs); p.set(this.p); c.set(this.c); this.p = p; this.c = c;
        if (this.q){ const q = new Int8Array(cap*3); q.set(this.q); this.q = q; }
        this.cap = cap;
      } else {
        this.fb.push([this.p, this.c, this.q]); this.base = this.n;
        this.p = new Float32Array(BS*3); this.c = new Uint8Array(BS*this.cs); if (this.q) this.q = new Int8Array(BS*3);
      }
    }
    v(x, y, z, col){
      if (this.n - this.base === this.cap) this.grow();
      const n = this.n, k = (n - this.base)*3, X = x - this.ox, Z = this.oy - y, b = this.b, p = this.p;
      p[k] = X; p[k+1] = z; p[k+2] = Z;
      if (X < b[0]) b[0] = X; if (X > b[3]) b[3] = X; if (z < b[1]) b[1] = z; if (z > b[4]) b[4] = z; if (Z < b[2]) b[2] = Z; if (Z > b[5]) b[5] = Z;
      const cs = this.cs, kc = (n - this.base)*cs, c = this.c; c[kc] = col[0]; c[kc+1] = col[1]; c[kc+2] = col[2]; if (cs === 4) c[kc+3] = col[3];
      return this.n++;
    }
    vn(x, y, z, col, nx, ny, nz){ const i = this.v(x, y, z, col), k = (i - this.base)*3, q = this.q; q[k] = Math.round(nx*127); q[k+1] = Math.round(ny*127); q[k+2] = Math.round(nz*127); return i; }
    t(a, b, c, l){
      if (l) return this.t1(a, b, c);
      let ix = this.i0, f = this.f0;
      if (f + 3 > ix.length){
        if (ix.length < IBS){ const t = new Uint32Array(ix.length*2); t.set(ix); this.i0 = ix = t; }
        else { this.l0.push(ix); this.i0 = ix = new Uint32Array(IBS); f = 0; }
      }
      ix[f] = a; ix[f+1] = b; ix[f+2] = c; this.f0 = f + 3;
    }
    t1(a, b, c){
      let ix = this.i1, f = this.f1;
      if (f + 3 > ix.length){
        if (ix.length < IBS){ const t = new Uint32Array(Math.max(384, ix.length*2)); t.set(ix); this.i1 = ix = t; }
        else { this.l1.push(ix); this.i1 = ix = new Uint32Array(IBS); f = 0; }
      }
      ix[f] = a; ix[f+1] = b; ix[f+2] = c; this.f1 = f + 3;
    }
    nIdx(){ let n = this.f0 + this.f1; for (const b of this.l0) n += b.length; for (const b of this.l1) n += b.length; return n; }
    tris(){ return this.nIdx()/3; }
    bytes(){ return this.n*(12 + this.cs + (this.q ? 3 : 0)) + this.nIdx()*(this.n < 65536 ? 2 : 4); }
    geom(){
      const g = new THREE.BufferGeometry(), n = this.n, cs = this.cs;
      const P = new Float32Array(n*3), Cc = new Uint8Array(n*cs), Q = this.q ? new Int8Array(n*3) : null; let o = 0;
      for (const [p, c, q] of this.fb){ P.set(p, o*3); Cc.set(c, o*cs); if (Q) Q.set(q, o*3); o += p.length/3; }
      const m = n - o; P.set(this.p.subarray(0, m*3), o*3); Cc.set(this.c.subarray(0, m*cs), o*cs); if (Q) Q.set(this.q.subarray(0, m*3), o*3);
      g.setAttribute('position', new THREE.BufferAttribute(P, 3));
      g.setAttribute('color', new THREE.BufferAttribute(Cc, cs, true));
      if (Q) g.setAttribute('normal', new THREE.BufferAttribute(Q, 3, true));
      const ni = this.nIdx();
      if (ni){
        const I = n < 65536 ? new Uint16Array(ni) : new Uint32Array(ni); let w = 0;
        for (const blk of this.l0){ I.set(blk, w); w += blk.length; } I.set(this.i0.subarray(0, this.f0), w); w += this.f0;
        for (const blk of this.l1){ I.set(blk, w); w += blk.length; } if (this.f1){ I.set(this.i1.subarray(0, this.f1), w); w += this.f1; }
        g.setIndex(new THREE.BufferAttribute(I, 1));
      }
      const b = this.b; g.boundingBox = new THREE.Box3(new THREE.Vector3(b[0], b[1], b[2]), new THREE.Vector3(b[3], b[4], b[5]));
      g.boundingSphere = new THREE.Sphere(); g.boundingBox.getBoundingSphere(g.boundingSphere);
      return g;
    }
  }
  // surface recorder for the drivable-surface index: world coordinates + per-triangle attributes (line, kind, direction)
  const CUR = {li:-1, k:0, dx:1, dy:0, hw:0, c:0};
  class RecBuf {
    constructor(){ this.n = 0; this.p = new Float64Array(3*4096); this.nt = 0; this.ix = new Int32Array(3*4096); this.at = new Float32Array(4*4096); this.ai = new Int32Array(2*4096); }
    v(x, y, z){ if (this.n*3 + 3 > this.p.length){ const t = new Float64Array(this.p.length*2); t.set(this.p); this.p = t; } const o = this.n*3; this.p[o] = x; this.p[o+1] = y; this.p[o+2] = z; return this.n++; }
    vn(x, y, z){ return this.v(x, y, z); }
    t(a, b, c){
      if (this.nt*3 + 3 > this.ix.length){ const t = new Int32Array(this.ix.length*2); t.set(this.ix); this.ix = t; const u = new Float32Array(this.at.length*2); u.set(this.at); this.at = u; const w = new Int32Array(this.ai.length*2); w.set(this.ai); this.ai = w; }
      const o = this.nt*3; this.ix[o] = a; this.ix[o+1] = b; this.ix[o+2] = c;
      const q = this.nt*4; this.at[q] = CUR.dx; this.at[q+1] = CUR.dy; this.at[q+2] = CUR.hw; this.at[q+3] = CUR.k;
      this.ai[this.nt*2] = CUR.li; this.ai[this.nt*2+1] = CUR.c; this.nt++;
    }
    t1(a, b, c){ this.t(a, b, c); }
  }

  // ---------------------------------------------------------------- per-line scratch (stations)
  let CANO = new Uint8Array(256), CAP = 0, NS = 0, SOa, SX, SY, SS, SE, SG, SZ, MXa, MYa, SCa, NIX, NIY, NOX, NOY, LXI, LYI, LZI, LXO, LYO, LZO, RXI, RYI, RZI, RXO, RYO, RZO, GLa, GRa, DXa, DYa, BVa, SFa, RBa, MHa, SWL, SWR;
  function ens(n){
    if (n <= CAP) return; CAP = Math.max(n, CAP*2, 4096); const F = () => new Float64Array(CAP);
    SX = F(); SY = F(); SS = F(); SE = F(); SG = F(); SZ = F(); MXa = F(); MYa = F(); SCa = F(); NIX = F(); NIY = F(); NOX = F(); NOY = F();
    LXI = F(); LYI = F(); LZI = F(); LXO = F(); LYO = F(); LZO = F(); RXI = F(); RYI = F(); RZI = F(); RXO = F(); RYO = F(); RZO = F(); GLa = F(); GRa = F();
    DXa = F(); DYa = F(); MHa = F(); BVa = new Int8Array(CAP); SFa = new Int8Array(CAP); SOa = new Uint8Array(CAP); RBa = new Uint8Array(CAP); SWL = new Uint8Array(CAP); SWR = new Uint8Array(CAP);
  }
  function addSt(x, y, s, e, g, f){ const i = NS++; SX[i] = x; SY[i] = y; SS[i] = s; SE[i] = e; SG[i] = g; SFa[i] = f; SOa[i] = 0; }
  function segAt(s){
    if (s <= SS[0]) return 0; if (s >= SS[NS-1]) return NS - 2;
    let lo = 0, hi = NS - 2; while (lo < hi){ const m = (lo + hi + 1) >> 1; if (SS[m] <= s) lo = m; else hi = m - 1; } return lo;
  }

  // ---------------------------------------------------------------- smoothed centrelines
  // interior corners become circular arcs (radius by class, limited by the neighbouring segments); junction positions stay put
  let TT = new Float64Array(1024), TN = new Uint8Array(1024), GX = new Float64Array(4096), GY = new Float64Array(4096), GE = new Float64Array(4096), GSS = new Float64Array(4096), GSO = new Float64Array(4096), GSL = new Float64Array(1024);
  const NOJ = new Float64Array(0); let ZEB = new Float64Array(256); const ZE = m => { if (ZEB.length < m) ZEB = new Float64Array(m*2); return ZEB; };
  function lineGeom(li){
    const GC_ = X.C.geoc || (X.C.geoc = new Map());
    let g = GC_.get(li); if (g) return g;
    const C = X.C, J = C.J, L = C.lines[li], P = L.P, E = L.E, np = P.length >> 1, o = C.vOff[li], VS = C.VS, R = RT[L.c] || 0, cache = isJ(L.c);
    const j0 = J.lJO[li], j1 = J.lJO[li+1], nmMax = L.c >= 11 ? 4 : 16;
    if (TT.length < np){ TT = new Float64Array(np*2); TN = new Uint8Array(np*2); GSL = new Float64Array(np*2); }
    let cnt = 2;
    for (let k = 1; k < np - 1; k++){
      TT[k] = 0; if (R <= 0){ cnt++; continue; }
      const ax = P[k*2] - P[k*2-2], ay = P[k*2+1] - P[k*2-1], bx = P[k*2+2] - P[k*2], by = P[k*2+3] - P[k*2+1], la = Math.sqrt(ax*ax + ay*ay), lb = Math.sqrt(bx*bx + by*by);
      if (la < 0.05 || lb < 0.05){ cnt++; continue; }
      let cs = (ax*bx + ay*by)/(la*lb); cs = cs > 1 ? 1 : cs < -1 ? -1 : cs; const ph = Math.acos(cs);
      if (ph < 0.04 || ph > 2.8){ cnt++; continue; }
      let t = R*Math.tan(ph*0.5); if (t > la*0.5) t = la*0.5; if (t > lb*0.5) t = lb*0.5;
      const sk = VS[o+k];
      for (let j = j0; j < j1; j++){ const d = Math.abs(J.lJS[j] - sk) - 0.8; if (d < t) t = d; }
      if (t < 0.05){ cnt++; continue; }
      const rr = t/Math.tan(ph*0.5), st = rr > 0.1 ? 2*Math.acos(1 - 0.08/rr) : ph, nm = Math.min(nmMax, Math.max(1, Math.ceil(ph/st)));
      TT[k] = t; TN[k] = nm; cnt += nm + 1;
    }
    let x, y, so, m = 0;
    if (GX.length < cnt){ const q = cnt*2; GX = new Float64Array(q); GY = new Float64Array(q); GE = new Float64Array(q); GSS = new Float64Array(q); if (GSO.length < q) GSO = new Float64Array(q); }
    x = GX; y = GY; so = GSO;
    const out = (px, py, s) => { if (m && Math.abs(px - x[m-1]) < 0.01 && Math.abs(py - y[m-1]) < 0.01){ so[m-1] = s; return; } x[m] = px; y[m] = py; so[m] = s; m++; };
    out(P[0], P[1], 0);
    for (let k = 1; k < np - 1; k++){
      const t = TT[k], vx = P[k*2], vy = P[k*2+1];
      if (!(t > 0)){ out(vx, vy, VS[o+k]); continue; }
      let ax = vx - P[k*2-2], ay = vy - P[k*2-1], bx = P[k*2+2] - vx, by = P[k*2+3] - vy; const la = Math.sqrt(ax*ax + ay*ay), lb = Math.sqrt(bx*bx + by*by);
      ax /= la; ay /= la; bx /= lb; by /= lb;
      let cs = ax*bx + ay*by; cs = cs > 1 ? 1 : cs < -1 ? -1 : cs; const ph = Math.acos(cs), sg = ax*by - ay*bx > 0 ? 1 : -1, rr = t/Math.tan(ph*0.5);
      const t1x = vx - ax*t, t1y = vy - ay*t, ox = t1x - ay*rr*sg, oy = t1y + ax*rr*sg, qx = t1x - ox, qy = t1y - oy;
      const nm = TN[k], sk = VS[o+k];
      for (let j = 0; j <= nm; j++){
        if (j === 0){ out(t1x, t1y, sk - t); continue; }
        if (j === nm){ out(vx + bx*t, vy + by*t, sk + t); continue; }
        const a = ph*j/nm*sg, ca = Math.cos(a), sa = Math.sin(a);
        out(ox + qx*ca - qy*sa, oy + qx*sa + qy*ca, sk - t + 2*t*j/nm);
      }
    }
    out(P[np*2-2], P[np*2-1], VS[o+np-1]);
    if (cache){ x = GX.slice(0, m); y = GY.slice(0, m); }
    const ec0 = cache ? endCorr(C, li, 0) : 0, ec1 = cache ? endCorr(C, li, 1) : 0, corr = ec0 !== 0 || ec1 !== 0;
    const s = cache ? new Float64Array(m) : GSS, e = cache ? (E || corr ? new Float64Array(m) : ZE(m)) : GE;
    s[0] = 0; for (let i = 1; i < m; i++){ const dx = x[i] - x[i-1], dy = y[i] - y[i-1]; s[i] = s[i-1] + Math.sqrt(dx*dx + dy*dy); }
    if (E){
      // elevation: monotone cubic through the vertex profile (no kinks at the ramp vertices, no overshoot)
      let k = 0;
      const sl = GSL;
      for (let q = 0; q < np; q++){
        const h0 = q > 0 ? VS[o+q] - VS[o+q-1] : 0, h1 = q < np - 1 ? VS[o+q+1] - VS[o+q] : 0;
        const d0 = q > 0 && h0 > 0.01 ? (E[q] - E[q-1])/h0 : null, d1 = q < np - 1 && h1 > 0.01 ? (E[q+1] - E[q])/h1 : null;
        if (d0 === null || d1 === null) sl[q] = 0; else if (d0*d1 <= 0) sl[q] = 0; else sl[q] = 3*(h0 + h1)/((2*h1 + h0)/d0 + (h1 + 2*h0)/d1);
      }
      for (let i = 0; i < m; i++){
        const sv = so[i]; while (k < np - 2 && VS[o+k+1] < sv) k++;
        const h = VS[o+k+1] - VS[o+k];
        if (h < 0.01){ e[i] = E[k]; continue; }
        let t = (sv - VS[o+k])/h; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const t2 = t*t, t3 = t2*t, v = (2*t3 - 3*t2 + 1)*E[k] + (t3 - 2*t2 + t)*h*sl[k] + (-2*t3 + 3*t2)*E[k+1] + (t3 - t2)*h*sl[k+1];
        e[i] = v < 0 ? 0 : v;
      }
    } else if (!cache) for (let i = 0; i < m; i++) e[i] = 0;
    // roadDrive: the ends of the line at a junction take the height of the junction's major road there, faded in over D metres (the
    // data gives lines meeting at one vertex heights up to 1.2 m apart: a slip road 0.6 m under the expressway it merges into, ramp
    // feet 0.6 m above the street, steps between two pieces of one deck)
    if (corr){
      const Lo = VS[o+np-1], half = ec0 !== 0 && ec1 !== 0 ? 0.45 : 0.9;
      const D0 = Math.min(Lo*half, Math.max(40, Math.min(200, Math.abs(ec0)*250))), D1 = Math.min(Lo*half, Math.max(40, Math.min(200, Math.abs(ec1)*250)));
      const fade = (d, D) => { if (d >= D) return 0; const t = d/D; return 1 - t*t*(3 - 2*t); };
      for (let i = 0; i < m; i++){ let v = e[i] + (ec0 ? ec0*fade(so[i], D0) : 0) + (ec1 ? ec1*fade(Lo - so[i], D1) : 0); e[i] = v < 0 ? 0 : v; }
    }
    // junction positions on the smoothed line (they lie on straight pieces: the offset to the original arc length is constant there)
    const jS = j1 > j0 ? new Float64Array(j1 - j0) : NOJ;
    let q = 0;
    for (let j = j0; j < j1; j++){
      const sv = J.lJS[j]; while (q < m - 2 && so[q+1] <= sv) q++;
      let v = s[q] + (sv - so[q]); if (v > s[m-1]) v = s[m-1]; if (v < 0) v = 0;
      if (sv <= 0.001) v = 0; else if (sv >= VS[o+np-1] - 0.001) v = s[m-1];
      jS[j - j0] = v;
    }
    g = {li, n:m, x, y, e, s, jS, Lt:s[m-1], hw:hwOf(L), off:OFF[L.c], c:L.c, L};
    if (cache){ GC_.set(li, g); if (GC_.size > 24000){ let k = 0; for (const key of GC_.keys()){ GC_.delete(key); if (++k >= 5000) break; } } }
    return g;
  }
  // the raw elevation (data) of line li at arc length s
  function rawE(C, li, s){
    const L = C.lines[li], E = L.E; if (!E) return 0;
    const o = C.vOff[li], n = C.vOff[li+1] - o, VS = C.VS; if (s <= 0) return E[0]; if (s >= VS[o+n-1]) return E[n-1];
    let lo = 0, hi = n - 1; while (hi - lo > 1){ const q = (lo + hi) >> 1; if (VS[o+q] <= s) lo = q; else hi = q; }
    const h = VS[o+hi] - VS[o+lo]; return h > 1e-6 ? E[lo] + (E[hi] - E[lo])*(s - VS[o+lo])/h : E[lo];
  }
  // the height a junction node's lines share: that of its major line (lowest class; a line passing through before one ending there;
  // then the lower one)
  function nodeTarget(C, nd){
    const J = C.J, T = J.etgt || (J.etgt = new Float32Array(J.nN).fill(NaN));
    if (T[nd] === T[nd]) return T[nd];
    let best = 1e9, be = 0;
    for (let q = J.nIO[nd]; q < J.nIO[nd+1]; q++){
      const li = J.nIL[q], L = C.lines[li]; if (!isJ(L.c)) continue;
      const s = J.nIS[q], Lt = J.LEN(li), end = s < 0.3 || s > Lt - 0.3, e = rawE(C, li, s), rank = L.c*4 + (end ? 1 : 0) + ((L.flags & 8) ? 2 : 0);
      if (rank < best || (rank === best && e < be)){ best = rank; be = e; }
    }
    return (T[nd] = best < 1e9 ? be : 0);
  }
  // the height correction at one end of line li (0 start, 1 end): node target - the line's own height there (0 if none / too large)
  function endCorr(C, li, end){
    const J = C.J, j0 = J.lJO[li], j1 = J.lJO[li+1]; if (j1 <= j0) return 0;
    const Lt = J.LEN(li), j = end ? j1 - 1 : j0, s = J.lJS[j];
    if (end ? s < Lt - 0.3 : s > 0.3) return 0;
    const d = nodeTarget(C, J.lJN[j]) - rawE(C, li, end ? Lt : 0);
    return Math.abs(d) < 0.05 || Math.abs(d) > 1.25 ? 0 : d;
  }
  // segment of g holding arc length s: side +1 the one starting at s, -1 the one ending there
  function gSeg(g, s, side){
    const S = g.s, n = g.n; if (n < 2) return 0;
    let lo = 0, hi = n - 2;
    while (lo < hi){ const m = (lo + hi + 1) >> 1; if (S[m] < s || (S[m] === s && side > 0)) lo = m; else hi = m - 1; }
    while (lo < n - 2 && S[lo+1] - S[lo] < 1e-6) lo++;
    return lo;
  }
  const SA = {x:0, y:0, nx:0, ny:0, e:0, k:0};
  function secAt(g, s, side){
    const k = gSeg(g, s, side), S = g.s, X0 = g.x, Y0 = g.y; let f = (s - S[k])/((S[k+1] - S[k]) || 1); f = f < 0 ? 0 : f > 1 ? 1 : f;
    SA.x = f === 1 ? X0[k+1] : X0[k] + (X0[k+1] - X0[k])*f; SA.y = f === 1 ? Y0[k+1] : Y0[k] + (Y0[k+1] - Y0[k])*f;
    SA.e = f === 1 ? g.e[k+1] : g.e[k] + (g.e[k+1] - g.e[k])*f;
    const dx = X0[k+1] - X0[k], dy = Y0[k+1] - Y0[k], l = hyp(dx, dy) || 1; SA.nx = -dy/l; SA.ny = dx/l; SA.k = k;
    return SA;
  }
  // heights of a cross-section: centre, left and right edge (wide flat sections never dip under the terrain inside)
  const SZr = {zc:0, zl:0, zr:0, gl:0, gr:0, gc:0};
  function secZ(x, y, ox, oy, hw, e, off, gc){
    const al = e < 1 ? e : 1, base = off + e;
    // roadDrive: the edges follow the ground for all roads from 3.2 m wide (was 6 m: service roads and one-way streets on slopes had
    // the terrain over their uphill edge)
    const lx = x + ox, ly = y + oy, rx = x - ox, ry = y - oy, gl = hw < 1.6 ? gc : G(lx, ly), gr = hw < 1.6 ? gc : G(rx, ry);
    let zl = gl + (gc - gl)*al + base, zr = gr + (gc - gr)*al + base;
    if (hw >= 1.6 && al < 1){
      let lift = gc + base - (zl + zr)*0.5;
      if (hw >= 8){
        const qx = ox*0.5, qy = oy*0.5, g1 = G(x + qx, y + qy) + base - (zl*0.75 + zr*0.25), g2 = G(x - qx, y - qy) + base - (zl*0.25 + zr*0.75);
        if (g1 > lift) lift = g1; if (g2 > lift) lift = g2;
      }
      if (lift > 0){ lift *= 1 - al; zl += lift; zr += lift; }
    }
    SZr.zc = gc + base; SZr.zl = zl; SZr.zr = zr; SZr.gl = gl; SZr.gr = gr; SZr.gc = gc;
    return SZr;
  }
  // exact ribbon corners of line geometry g at s (the ribbon starts / ends there with a square section)
  const CO = {lx:0, ly:0, lz:0, rx:0, ry:0, rz:0, cx:0, cy:0, cz:0, nx:0, ny:0, e:0};
  function cornersAt(g, s, side){
    const a = secAt(g, s, side), hw = g.hw, x = a.x, y = a.y, nx = a.nx, ny = a.ny, e = a.e;
    const z = secZ(x, y, nx*hw, ny*hw, hw, e, g.off, G(x, y));
    CO.lx = x + nx*hw; CO.ly = y + ny*hw; CO.lz = z.zl; CO.rx = x - nx*hw; CO.ry = y - ny*hw; CO.rz = z.zr; CO.cx = x; CO.cy = y; CO.cz = z.zc; CO.nx = nx; CO.ny = ny; CO.e = e;
    return CO;
  }

  // densify the smoothed line into stations (<= 20 m, 5 m where the terrain bends), with exact stations at the given breaks
  function densify(g, brk, nb){
    let est = 4 + nb*2; for (let k = 1; k < g.n; k++) est += Math.ceil((g.s[k] - g.s[k-1])/MAXSEG)*4 + 1;
    ens(est);
    NS = 0; let bi = 0;
    const X0 = g.x, Y0 = g.y, E0 = g.e, S0 = g.s;
    addSt(X0[0], Y0[0], 0, E0[0], G(X0[0], Y0[0]), 0);
    for (let k = 1; k < g.n; k++){
      const ax = X0[k-1], ay = Y0[k-1], ae = E0[k-1], sa = S0[k-1], bx = X0[k], by = Y0[k], be = E0[k], sb = S0[k], d = sb - sa;
      if (d < 1e-6) continue;
      const n = Math.ceil(d/MAXSEG), dx = bx - ax, dy = by - ay, de = be - ae;
      for (let j = 1; j <= n; j++){
        const t0 = (j - 1)/n, t1 = j/n, s1 = sa + d*t1;
        // breaks inside (s(t0), s1)
        while (bi < nb && brk[bi*2] < s1 - 1e-6){
          const sv = brk[bi*2], fl = brk[bi*2+1]; bi++;
          if (sv <= SS[NS-1] + 1e-6){ if (sv >= SS[NS-1] - 1e-6) SFa[NS-1] = fl; continue; }
          const f = (sv - sa)/d; addSt(ax + dx*f, ay + dy*f, sv, ae + de*f, G(ax + dx*f, ay + dy*f), fl); if (!fl) SOa[NS-1] = 1;
        }
        const g1 = G(ax + dx*t1, ay + dy*t1);
        if (d/n > 6){
          const tm = (t0 + t1)*0.5, gm = G(ax + dx*tm, ay + dy*tm), g0 = G(ax + dx*t0, ay + dy*t0);
          if (Math.abs(gm - (g0 + g1)*0.5) > 0.07){
            for (let q = 1; q < 4; q++){ const tq = t0 + (t1 - t0)*q*0.25, sq = sa + d*tq;
              if (bi < nb && Math.abs(brk[bi*2] - sq) < 0.3) continue;
              if (sq > SS[NS-1] + 0.05) addSt(ax + dx*tq, ay + dy*tq, sq, ae + de*tq, G(ax + dx*tq, ay + dy*tq), 0); }
          }
        }
        let fl = 0;
        if (bi < nb && Math.abs(brk[bi*2] - s1) < 1e-6){ fl = brk[bi*2+1]; bi++; }
        if (j === n) addSt(bx, by, sb, be, g1, fl); else addSt(ax + dx*t1, ay + dy*t1, s1, ae + de*t1, g1, fl);
      }
    }
    while (bi < nb){ if (Math.abs(brk[bi*2] - SS[NS-1]) < 1e-3) SFa[NS-1] = brk[bi*2+1]; bi++; }
  }
  // unit segment directions, miter normals (square at breaks, bevel beyond the miter limit), ribbon edges and their heights
  let END0 = null, END1 = null;     // shared miter normals at the line ends (continuations): [nx, ny, sc]
  function frames(hw, off){
    for (let k = 0; k < NS - 1; k++){ const dx = SX[k+1] - SX[k], dy = SY[k+1] - SY[k], l = hyp(dx, dy) || 1; DXa[k] = dx/l; DYa[k] = dy/l; }
    for (let i = 0; i < NS; i++){
      const ki = i > 0 ? i - 1 : 0, ko = i < NS - 1 ? i : NS - 2;
      const nix = -DYa[ki], niy = DXa[ki], nox = -DYa[ko], noy = DXa[ko];
      let mx = nix + nox, my = niy + noy, sc, bv = 0; const ml = hyp(mx, my);
      if (ml < 1e-6){ mx = nox; my = noy; sc = MITER + 1; } else { mx /= ml; my /= ml; sc = 1/(mx*nox + my*noy); }
      if (sc > MITER){ bv = (DXa[ki]*DYa[ko] - DYa[ki]*DXa[ko]) > 0 ? -1 : 1; sc = MITER; }
      const f = SFa[i];
      if (f === 1){ mx = nox; my = noy; sc = 1; bv = 0; } else if (f === -1){ mx = nix; my = niy; sc = 1; bv = 0; }
      else if (i === 0 && END0){ mx = END0[0]; my = END0[1]; sc = END0[2]; bv = 0; } else if (i === NS - 1 && END1){ mx = END1[0]; my = END1[1]; sc = END1[2]; bv = 0; }
      MXa[i] = mx; MYa[i] = my; SCa[i] = sc; BVa[i] = bv; NIX[i] = nix; NIY[i] = niy; NOX[i] = nox; NOY[i] = noy;
      const x = SX[i], y = SY[i], e = SE[i], gc = SG[i], al = e < 1 ? e : 1, base = off + e;
      SZ[i] = gc + base;
      if (!bv){
        const ox = mx*sc*hw, oy = my*sc*hw, z = secZ(x, y, ox, oy, hw, e, off, gc), lx = x + ox, ly = y + oy, rx = x - ox, ry = y - oy;
        LXI[i] = LXO[i] = lx; LYI[i] = LYO[i] = ly; LZI[i] = LZO[i] = z.zl; RXI[i] = RXO[i] = rx; RYI[i] = RYO[i] = ry; RZI[i] = RZO[i] = z.zr; GLa[i] = z.gl; GRa[i] = z.gr;
      } else {
        const ix = x - bv*mx*sc*hw, iy = y - bv*my*sc*hw, ax = x + bv*nix*hw, ay = y + bv*niy*hw, bx = x + bv*nox*hw, by = y + bv*noy*hw;
        const gi = G(ix, iy), ga = G(ax, ay), gb = G(bx, by), zi = gi + (gc - gi)*al + base, za = ga + (gc - ga)*al + base, zb = gb + (gc - gb)*al + base;
        if (bv > 0){ LXI[i] = ax; LYI[i] = ay; LZI[i] = za; LXO[i] = bx; LYO[i] = by; LZO[i] = zb; RXI[i] = RXO[i] = ix; RYI[i] = RYO[i] = iy; RZI[i] = RZO[i] = zi; GLa[i] = ga; GRa[i] = gi; }
        else { RXI[i] = ax; RYI[i] = ay; RZI[i] = za; RXO[i] = bx; RYO[i] = by; RZO[i] = zb; LXI[i] = LXO[i] = ix; LYI[i] = LYO[i] = iy; LZI[i] = LZO[i] = zi; GLa[i] = gi; GRa[i] = ga; }
      }
    }
  }

  // ---------------------------------------------------------------- build context
  let X = null;               // {T, only, C, TXn, geo, st...}
  const DBG = {cc:0, dc:0, dl:0}, tnow = () => (typeof performance !== "undefined" ? performance : Date).now();
  let HW = 0, OFFc = 0, NCH = 1, CHL = 1, CHT = new Int32Array(64), CHW = new Uint8Array(64);
  function tileOf(x, y){
    const n = X.TXn; let tx = Math.floor((x + HALF)/TILE), ty = Math.floor((y + HALF)/TILE);
    tx = tx < 0 ? 0 : tx >= n ? n - 1 : tx; ty = ty < 0 ? 0 : ty >= n ? n - 1 : ty; return ty*n + tx;
  }
  const wantXY = (x, y) => X.idx ? (x > X.idx.x0 - 160 && x < X.idx.x1 + 160 && y > X.idx.y0 - 160 && y < X.idx.y1 + 160) : (!X.only || X.only.has(tileOf(x, y))) && Math.abs(x) < HALF && Math.abs(y) < HALF;
  function tb(t){
    let o = X.T[t]; if (o) return o;
    const n = X.TXn, tx = t % n, ty = (t/n) | 0;
    return (X.T[t] = {ox:-HALF + (tx + 0.5)*TILE, oy:-HALF + (ty + 0.5)*TILE, s:[null, null, null], m:null, st:[null, null], l:null});
  }
  const bSurf = (t, g) => { if (X.idx) return X.idx.rb; const o = tb(t); return o.s[g] || (o.s[g] = new Buf(o.ox, o.oy, 3, false)); };
  const bMark = t => { const o = tb(t); return o.m || (o.m = new Buf(o.ox, o.oy, 4, false)); };
  const bStruct = (t, g) => { const o = tb(t); return o.st[g] || (o.st[g] = new Buf(o.ox, o.oy, 3, true)); };
  const bLamp = t => { const o = tb(t); return o.l || (o.l = new Buf(o.ox, o.oy, 3, false)); };
  // chunks of ~100 m along the line, each in the tile of its midpoint
  function chunks(){
    const Lt = SS[NS-1]; NCH = Math.max(1, Math.round(Lt/CHUNK)); CHL = Lt/NCH;
    if (CHT.length < NCH){ CHT = new Int32Array(NCH*2); CHW = new Uint8Array(NCH*2); }
    let any = false;
    for (let c = 0; c < NCH; c++){
      const s = (c + 0.5)*CHL, k = segAt(s), f = (s - SS[k])/((SS[k+1] - SS[k]) || 1), x = SX[k] + (SX[k+1] - SX[k])*f, y = SY[k] + (SY[k+1] - SY[k])*f, t = tileOf(x, y);
      CHT[c] = t; CHW[c] = wantXY(x, y) ? 1 : 0; if (CHW[c]) any = true;   // nothing outside the map square
    }
    return any;
  }
  function tileAtS(s){ let c = Math.floor(s/CHL); c = c < 0 ? 0 : c >= NCH ? NCH - 1 : c; return CHW[c] ? CHT[c] : -1; }

  // ---------------------------------------------------------------- junction complexes
  // An arm is a line leaving a complex node (outward direction dir along the line). Arms are sorted counter-clockwise; between
  // neighbouring arms the facing kerb lines meet at X: a kerb return (arc) rounds that corner, or a gore nose ends a merge /
  // diverge. Type 'C': a plain continuation (shared miter), 'T': a through road with side arms (the through road is not cut;
  // patches fill the mouths), 'F': all arms are trimmed and one surface covers the junction box.
  function kerbR(a, b){
    const c = Math.min(a.c, b.c), d = Math.max(a.c, b.c);
    if (d >= 11) return a.c === 11 && b.c === 11 ? 3.5 : 5;
    if (c <= 3) return d <= 3 ? 15 : 11;
    if (d >= 10) return 7;
    return 10;
  }
  const AP = []; let APN = 0;
  function armSamples(A){
    // points along the arm: centre, outward direction, left / right edges (outward frame) at distance d from the node,
    // at the polyline vertices and every <= 4 m (8 m beyond 30 m)
    const g = A.g, dir = A.dir, s0 = A.s, Dm = A.Dm, hw = A.hw, S = g.s, GX0 = g.x, GY0 = g.y, n = g.n;
    const pk = APN++, pa = AP[pk] || (AP[pk] = [[], [], [], [], [], [], [], [], []]);
    for (let q = 0; q < 9; q++) pa[q].length = 0;
    const D = pa[0], cx = pa[1], cy = pa[2], ux = pa[3], uy = pa[4];
    let k = gSeg(g, s0, dir), d = 0;
    // segment k runs from S[k] to S[k+1]; going outward we leave through its far end (k+1 if dir > 0, k if dir < 0)
    for (let guard = 0; guard < 400; guard++){
      const a = k, sA = S[a], sB = S[a+1], len = sB - sA || 1, tx = (GX0[a+1] - GX0[a])/len*dir, ty = (GY0[a+1] - GY0[a])/len*dir;
      const sEnd = dir > 0 ? sB : sA, dEnd = Math.min(Dm, Math.abs(sEnd - s0));
      while (true){
        const s = s0 + dir*d, f = (s - sA)/len;
        D.push(d); cx.push(GX0[a] + (GX0[a+1] - GX0[a])*f); cy.push(GY0[a] + (GY0[a+1] - GY0[a])*f); ux.push(tx); uy.push(ty);
        if (d >= dEnd - 1e-6) break;
        const st = d < 30 ? 4 : 8; d = Math.min(dEnd, d + st);
      }
      if (dEnd >= Dm - 1e-6) break;
      k += dir; if (k < 0 || k > n - 2) break;
      // skip zero-length pieces
      while (k >= 0 && k <= n - 2 && S[k+1] - S[k] < 1e-6) k += dir;
      if (k < 0 || k > n - 2) break;
      D.pop(); cx.pop(); cy.pop(); ux.pop(); uy.pop();      // the vertex sample is re-emitted with the next piece's direction
    }
    const m = D.length, lx = pa[5], ly = pa[6], rx = pa[7], ry = pa[8];
    for (let i = 0; i < m; i++){
      let vx = ux[i], vy = uy[i];
      if (i > 0 && (ux[i-1] !== vx || uy[i-1] !== vy)){ vx += ux[i-1]; vy += uy[i-1]; const l = Math.sqrt(vx*vx + vy*vy) || 1; vx /= l; vy /= l; }
      lx.push(cx[i] - vy*hw); ly.push(cy[i] + vx*hw); rx.push(cx[i] + vy*hw); ry.push(cy[i] - vx*hw);
    }
    A.D = D; A.cx = cx; A.cy = cy; A.ux = ux; A.uy = uy; A.lx = lx; A.ly = ly; A.rx = rx; A.ry = ry;
  }
  // a point on the edge polyline (E = [xs, ys]) of arm A at distance d
  const EP = {x:0, y:0};
  function edgeP(A, xs, ys, d){
    const D = A.D, m = D.length; if (d <= 0){ EP.x = xs[0]; EP.y = ys[0]; return EP; } if (d >= D[m-1]){ EP.x = xs[m-1]; EP.y = ys[m-1]; return EP; }
    let lo = 0, hi = m - 1; while (hi - lo > 1){ const q = (lo + hi) >> 1; if (D[q] <= d) lo = q; else hi = q; }
    const f = (d - D[lo])/((D[hi] - D[lo]) || 1); EP.x = xs[lo] + (xs[hi] - xs[lo])*f; EP.y = ys[lo] + (ys[hi] - ys[lo])*f; return EP;
  }
  function edgeAt(A, xs, ys, d){
    const D = A.D, m = D.length; if (d <= 0) return [xs[0], ys[0]]; if (d >= D[m-1]) return [xs[m-1], ys[m-1]];
    let lo = 0, hi = m - 1; while (hi - lo > 1){ const q = (lo + hi) >> 1; if (D[q] <= d) lo = q; else hi = q; }
    const f = (d - D[lo])/((D[hi] - D[lo]) || 1); return [xs[lo] + (xs[hi] - xs[lo])*f, ys[lo] + (ys[hi] - ys[lo])*f];
  }
  // first crossing of two polylines (by distance along the first): [da, db, x, y] or null
  function polyX(A, ax, ay, B, bx, by){
    const DA = A.D, DB = B.D;
    for (let i = 0; i + 1 < DA.length; i++){
      const px = ax[i], py = ay[i], ex = ax[i+1] - px, ey = ay[i+1] - py;
      for (let j = 0; j + 1 < DB.length; j++){
        const qx = bx[j], qy = by[j], fx = bx[j+1] - qx, fy = by[j+1] - qy, den = ex*fy - ey*fx; if (Math.abs(den) < 1e-9) continue;
        const u = ((qx - px)*fy - (qy - py)*fx)/den; if (u < 0 || u > 1) continue;
        const v = ((qx - px)*ey - (qy - py)*ex)/den; if (v < 0 || v > 1) continue;
        return [DA[i] + (DA[i+1] - DA[i])*u, DB[j] + (DB[j+1] - DB[j])*v, px + ex*u, py + ey*u];
      }
    }
    return null;
  }
  // distance from point to polyline (xs, ys)
  function polyDist(px, py, xs, ys){
    let best = Infinity;
    for (let i = 0; i + 1 < xs.length; i++){ const ax = xs[i], ay = ys[i], dx = xs[i+1] - ax, dy = ys[i+1] - ay, l2 = dx*dx + dy*dy; let t = l2 ? ((px - ax)*dx + (py - ay)*dy)/l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; const d = hyp(ax + dx*t - px, ay + dy*t - py); if (d < best) best = d; }
    return best;
  }
  function cxArms(cx){
    const C = X.C, J = C.J, lines = C.lines, nodes = [], arms = [], ints = [];
    for (let p = J.cxO[cx]; p < J.cxO[cx+1]; p++) nodes.push(J.cxN[p]);
    let sx = 0, sy = 0, se = 0; for (const nd of nodes){ sx += J.NX[nd]; sy += J.NY[nd]; se += J.NE[nd]; }
    const ccx = sx/nodes.length, ccy = sy/nodes.length, ce = se/nodes.length;
    for (const nd of nodes){
      for (let q = J.nIO[nd]; q < J.nIO[nd+1]; q++){
        const li = J.nIL[q], L = lines[li]; if (!isJ(L.c)) continue;
        const j0 = J.lJO[li], j1 = J.lJO[li+1], p = J.nIP[q];
        const g = lineGeom(li), s = g.jS[p - j0], Lt = g.Lt;
        for (let dd = 0; dd < 2; dd++){
          const dir = dd ? -1 : 1;
          if (dir > 0 && s > Lt - 0.3) continue; if (dir < 0 && s < 0.3) continue;
          const pn = p + dir;                                     // neighbouring junction along the line
          let Dm = dir > 0 ? Lt - s : s, other = false;
          if (pn >= j0 && pn < j1){
            const nd2 = J.lJN[pn], d = Math.abs(g.jS[pn - j0] - s);
            if (J.cxOf[nd2] === cx && internal(C, li, dir > 0 ? p : pn)){ if (dir > 0) ints.push([li, s, g.jS[pn - j0]]); continue; }
            Dm = Math.min(Dm, d*(J.cxOf[nd2] === cx ? 0.5 : 0.47)); other = true;
          }
          if (Dm < 0.4) continue;
          arms.push({li, p, s, dir, node:nd, g, L, c:L.c, hw:g.hw, off:g.off, ow:(L.flags & 1) !== 0, link:(L.flags & 16) !== 0, foreign:(L.flags & 8) !== 0,
            Dm:Math.min(Dm, 90), end:dir > 0 ? s < 0.3 : s > Lt - 0.3, e:J.NE[nd], trim:0, a:-1, b:-1, other});
        }
      }
    }
    return {nodes, arms, ints, ccx, ccy, ce};
  }
  // the distance from the node up to which arms A and B are within 0.5 m of each other's height (sampled every 2 m)
  function levelUntil(A, B, dmax){
    const za = d => { const q = secAt(A.g, A.s + A.dir*Math.min(d, A.g.Lt), -A.dir); return q.e + G(q.x, q.y); }, zb = d => { const q = secAt(B.g, B.s + B.dir*Math.min(d, B.g.Lt), -B.dir); return q.e + G(q.x, q.y); };
    for (let d = 2; d < dmax; d += 2) if (Math.abs(za(d) - zb(d)) > 0.5) return Math.max(2, d - 2);
    return dmax;
  }
  // compute (and cache) a complex: type, trims, mouths; full = also the outline for emitting
  function cxGet(cx, full){
    const J = X.C.J;
    if (full){ const f = (X.full && X.full.get(cx)) || FULLC.get(cx); if (f){ if (X.full) X.full.delete(cx); FULLC.delete(cx); return f; } }
    else { const h = J.res.get(cx); if (h) return h; }
    const r = cxCompute(cx), slim = r.slim;
    J.res.set(cx, slim);
    if (J.res.size > 30000){ let k = 0; for (const key of J.res.keys()){ J.res.delete(key); if (++k >= 6000) break; } }
    const keep = !full && r.A && r.type !== 'N' && r.type !== 'C' && !X.idx, here = keep && X.full && wantXY(r.ccx, r.ccy);
    if ((full || keep) && r.A) for (const A of r.A) if (A.D){ A.D = A.D.slice(); A.cx = A.cx.slice(); A.cy = A.cy.slice(); A.ux = A.ux.slice(); A.uy = A.uy.slice(); A.lx = A.lx.slice(); A.ly = A.ly.slice(); A.rx = A.rx.slice(); A.ry = A.ry.slice(); }
    if (here) X.full.set(cx, r);
    else if (keep){ FULLC.set(cx, r); if (FULLC.size > 4000){ let k = 0; for (const key of FULLC.keys()){ FULLC.delete(key); if (++k >= 800) break; } } }
    return full ? r : slim;
  }
  // cheap answers that need no geometry: estate / service-road junctions (nothing to fill), driveways off an urban road
  // (the footway runs across), plain continuations of one road (a shared miter from the raw end directions)
  function cxQuick(cx){
    const C = X.C, J = C.J, lines = C.lines; if (J.cxO[cx+1] - J.cxO[cx] !== 1) return null;
    const nd = J.cxN[J.cxO[cx]], q0 = J.nIO[nd], q1 = J.nIO[nd+1];
    let major = 0, thr = -1, ends = 0;
    for (let q = q0; q < q1; q++){ const L = lines[J.nIL[q]]; if (!isJ(L.c)) continue; const s = J.nIS[q], Lt = J.LEN(J.nIL[q]), end = s < 0.3 || s > Lt - 0.3;
      if (end) ends++; if (L.c < 11){ major++; if (!end) thr = q; } }
    const base = {type:'N', arms:[], ints:[], sig:false, ccx:J.NX[nd], ccy:J.NY[nd], e:J.NE[nd]};
    if (major === 0){ base.slim = base; return base; }
    if (major === 1 && thr >= 0 && J.NE[nd] < 0.3){ const L = lines[J.nIL[thr]]; if (SWC(L.c) && !(L.flags & 8)){ base.slim = base; return base; } }
    if (q1 - q0 === 2 && ends === 2){
      const ia = J.nIL[q0], ib = J.nIL[q0+1], La = lines[ia], Lb = lines[ib]; if (!isJ(La.c) || !isJ(Lb.c)) return null;
      if (Math.abs(hwOf(La) - hwOf(Lb)) >= 0.3 || OFF[La.c] !== OFF[Lb.c]) return null;
      const ea = J.nIS[q0] < 0.3 ? 0 : (La.P.length >> 1) - 1, eb = J.nIS[q0+1] < 0.3 ? 0 : (Lb.P.length >> 1) - 1;
      if (!dirAt(La, ea, ea === 0 ? 1 : -1, _d1) || !dirAt(Lb, eb, eb === 0 ? 1 : -1, _d2)) return null;
      if (_d1[0]*_d2[0] + _d1[1]*_d2[1] >= -0.6) return null;
      let mx = _d1[0] - _d2[0], my = _d1[1] - _d2[1]; const ml = Math.sqrt(mx*mx + my*my); mx /= ml; my /= ml;
      const ga = lineGeom(ia), gb = lineGeom(ib);
      base.type = 'C'; base.miter = [mx, my];
      base.arms = [{li:ia, s:ea ? ga.Lt : 0, dir:ea ? -1 : 1, trim:0, through:true, a:0, b:0, c:La.c, hw:hwOf(La), end:true},
                   {li:ib, s:eb ? gb.Lt : 0, dir:eb ? -1 : 1, trim:0, through:true, a:0, b:0, c:Lb.c, hw:hwOf(Lb), end:true}];
      base.slim = base; return base;
    }
    return null;
  }
  function cxCompute(cx){
    DBG.cc++; const J = X.C.J, full = true;
    const qk = cxQuick(cx); if (qk) return qk;
    APN = 0;
    const R = cxArms(cx), arms = R.arms; let na = arms.length;
    const res = {type:'N', arms:[], ints:R.ints, sig:false, ccx:R.ccx, ccy:R.ccy, e:R.ce, R};
    if (na < 2){ res.slim = res; return res; }
    // angular order around the centre (a point a few metres out on each arm)
    for (const A of arms){ const d = Math.min(A.Dm, Math.max(3, A.hw*0.8)), q = secAt(A.g, A.s + A.dir*d, -A.dir); A.ang = Math.atan2(q.y - R.ccy, q.x - R.ccx);
      const q0 = secAt(A.g, A.s, A.dir); A.u0x = q0.ny*A.dir; A.u0y = -q0.nx*A.dir; }
    arms.sort((a, b) => a.ang - b.ang);
    const single = R.nodes.length === 1;
    // continuation of two equal roads: shared miter, nothing to fill
    if (na === 2 && single){
      const A = arms[0], B = arms[1], dot = A.u0x*B.u0x + A.u0y*B.u0y;
      if (Math.abs(A.hw - B.hw) < 0.3 && A.off === B.off && dot < -0.6 && A.end && B.end){
        res.type = 'C';
        // the joint lies on the bisector: normal of the line through the node perpendicular to (uA - uB)
        let mx = A.u0x - B.u0x, my = A.u0y - B.u0y; const ml = hyp(mx, my); mx /= ml; my /= ml;      // average outward direction of A
        res.miter = [mx, my];
        res.arms = arms.map(a => ({li:a.li, s:a.s, dir:a.dir, trim:0, through:true, a:0, b:0, c:a.c, hw:a.hw, end:a.end}));
        res.slim = {type:'C', arms:res.arms, ints:res.ints, sig:false, ccx:res.ccx, ccy:res.ccy, e:res.e, miter:res.miter}; return res;
      }
    }
    if (arms.every(a => a.c >= 11)){ res.slim = res; return res; }
    // roadDrive: two lines leaving one node in nearly the same direction (a merge / diverge whose third line is missing or on another
    // level): no junction box - both ribbons run on to the node and overlap there (trimming both to the gore nose left the whole wedge
    // between the node and the nose unpaved: up to 90 m of missing expressway)
    if (na === 2 && single && arms[0].end && arms[1].end && arms[0].u0x*arms[1].u0x + arms[0].u0y*arms[1].u0y > 0.5){ res.slim = res; return res; }
    // through pair (type T): two arms of one road continuing straight on, everything else lower or equal and on one side,
    // or only minor roads on both sides
    let tp = null;
    if (single && na >= 3){
      let best = -2;
      for (let i = 0; i < na; i++) for (let j = i + 1; j < na; j++){
        const A = arms[i], B = arms[j], dot = -(A.u0x*B.u0x + A.u0y*B.u0y);
        if (dot < 0.82) continue;
        const same = A.li === B.li || (A.c === B.c && Math.abs(A.hw - B.hw) < 0.3 && A.ow === B.ow && A.off === B.off && A.link === B.link);
        if (!same) continue;
        const sc = dot - A.c*0.05 + (A.li === B.li ? 0.1 : 0);
        if (sc > best){ best = sc; tp = [i, j]; }
      }
      if (tp){
        const A = arms[tp[0]], B = arms[tp[1]], tc = A.c; let sideL = 0, sideR = 0, ok = true, major = 0;
        for (let k = 0; k < na; k++){ if (k === tp[0] || k === tp[1]) continue; const S = arms[k];
          if (S.c < tc && !(S.link && S.c <= 9 && tc <= 9 && S.c >= tc - 1)) ok = false;
          if (S.c <= 8 && !S.link) major++;
          if (k > tp[0] && k < tp[1]) sideL++; else sideR++; }
        if (!ok || (sideL && sideR && major > 0)) tp = null;
      }
      if (tp && SWC(arms[tp[0]].c) && R.ce < 0.3 && !arms[tp[0]].foreign){
        const A = arms[tp[0]], B = arms[tp[1]], keep = arms.filter(a => a === A || a === B || a.c < 11);
        if (keep.length !== na){
          if (keep.length === 2){ res.slim = res; return res; }
          arms.length = 0; for (const a of keep) arms.push(a); na = arms.length; tp = [arms.indexOf(A), arms.indexOf(B)];
        }
      }
    }
    // sample far only where a neighbour leaves at a small angle (merges, diverges, forks)
    for (let i = 0; i < na; i++){ const A = arms[i], P = arms[(i + na - 1) % na], N = arms[(i + 1) % na];
      const nearP = A.u0x*P.u0x + A.u0y*P.u0y > 0.7, nearN = A.u0x*N.u0x + A.u0y*N.u0y > 0.7;
      if (!(nearP || nearN)) A.Dm = Math.min(A.Dm, 30); }
    for (const A of arms) armSamples(A);
    // neighbouring pairs: kerb returns, gores, open sides
    const pairs = [];
    for (let i = 0; i < na; i++){
      const A = arms[i], B = arms[(i + 1) % na], P = {i, j:(i + 1) % na, kind:'open', bA:-1, aB:-1, pts:null, X:null};
      pairs.push(P);
      if (na === 2 && i === 1 && pairs[0].kind !== 'open' && false) continue;
      const thru = tp && ((tp[0] === i && tp[1] === P.j) || (tp[1] === i && tp[0] === P.j));
      if (thru) continue;                                       // the through road's own kerb on a side without arms
      const dAng = ((B.ang - A.ang) + 4*Math.PI) % (2*Math.PI);
      if (dAng > Math.PI + 0.35 || (na === 2 && dAng > Math.PI - 0.1)) continue;      // reflex side: no kerb corner
      const x = polyX(A, A.lx, A.ly, B, B.rx, B.ry);
      if (!x){
        // parallel or diverging kerbs: arms whose outer edges never meet (opposite carriageways, open sides)
        continue;
      }
      const ia = edgeAt(A, A.ux, A.uy, x[0]), ib = edgeAt(B, B.ux, B.uy, x[1]);
      let th = Math.acos(Math.max(-1, Math.min(1, (ia[0]*ib[0] + ia[1]*ib[1])/((hyp(ia[0], ia[1])*hyp(ib[0], ib[1])) || 1))));
      // roadDrive: two one-way carriageways with opposite traffic (one leaves the junction, the other comes in) are the two halves of a
      // dual road: the strip between them is its median, not a gore (with a narrow median the 'nose' was never reached and both
      // carriageways lost up to 90 m to the trim)
      if (th < 0.66 && A.ow && B.ow && A.dir !== B.dir) continue;
      if (th < 0.66 && (A.link || B.link || (A.ow && B.ow))){
        // gore: the paved wedge runs on to a nose where the kerbs are 2 m apart
        let da = x[0], db = x[1];
        for (let d = x[0] + 1; d <= A.Dm; d += 1){ const p = edgeP(A, A.lx, A.ly, d); if (polyDist(p.x, p.y, B.rx, B.ry) >= 2.0){ da = d; break; } da = d; }
        for (let d = x[1] + 1; d <= B.Dm; d += 1){ const p = edgeP(B, B.rx, B.ry, d); if (polyDist(p.x, p.y, A.lx, A.ly) >= 2.0){ db = d; break; } db = d; }
        // roadDrive: the paved wedge only as far as the two arms are still level (a ramp up and a ramp down splitting at one node got a
        // steep warped junction sheet between the two decks)
        if (A.e > 0.5 || B.e > 0.5 || A.g.e[0] > 0.5 || B.g.e[0] > 0.5){ const lim = levelUntil(A, B, Math.max(da, db)); if (da > lim) da = lim; if (db > lim) db = lim; }
        P.kind = 'gore'; P.bA = Math.min(da, A.Dm); P.aB = Math.min(db, B.Dm); P.X = x;
        continue;
      }
      let r = kerbR(A, B), t = r/Math.tan(Math.max(th, 0.35)*0.5);
      if (A.foreign || B.foreign) t *= 0.6;
      t = Math.min(t, 28, A.Dm - x[0], B.Dm - x[1]); if (t < 0) t = 0;
      P.kind = 'kerb'; P.bA = x[0] + t; P.aB = x[1] + t; P.X = x; P.th = th;
    }
    // trims
    for (let i = 0; i < na; i++){
      const A = arms[i], pn = pairs[i], pp = pairs[(i + na - 1) % na];
      A.b = pn.bA; A.a = pp.aB;
      const through = tp && (i === tp[0] || i === tp[1]);
      A.through = !!through;
      if (through){ A.trim = 0; continue; }
      let t = Math.max(A.a, A.b, 0.6, Math.min(A.hw*0.3, 2));
      if (t > A.Dm) t = A.Dm;
      A.trim = t;
    }
    // open sides without a kerb line on either arm: the trims of the neighbours set the corners
    res.type = tp ? 'T' : 'F'; res.tp = tp;
    // roadDrive: a through road made of two lines that both end at the node (a bend of up to 35 degrees) shares a miter there like a
    // plain continuation: their square ends left an open wedge on the outside of the bend (a hole in many ramp interchanges)
    if (tp){ const A = arms[tp[0]], B = arms[tp[1]];
      if (A.li !== B.li && A.end && B.end){ let mx = A.u0x - B.u0x, my = A.u0y - B.u0y; const ml = hyp(mx, my); if (ml > 1e-6) res.tmiter = [mx/ml, my/ml, A.li, A.s, A.dir]; } }
    let maj = 0, onlyLinks = true; const roads = new Set();
    for (const A of arms){ if (A.c <= 8 && !A.link){ maj++; roads.add(A.L.name ? A.L.name[0] || A.li : A.li); } if (!A.link) onlyLinks = false; }
    res.sig = maj >= 3 && R.ce < 0.5 && !pairs.some(p => p.kind === 'gore') && !arms.some(a => a.foreign) && (res.type === 'F' || arms.some((a, k) => !a.through && a.c <= 8 && !a.link));
    res.arms = arms.map(a => ({li:a.li, s:a.s, dir:a.dir, trim:a.trim, through:a.through, a:a.a, b:a.b, c:a.c, hw:a.hw, end:a.end, link:a.link, ow:a.ow}));
    res.pairs = pairs.map(p => ({i:p.i, j:p.j, kind:p.kind, bA:p.bA, aB:p.aB, xA:p.X ? p.X[0] : -1, xB:p.X ? p.X[1] : -1}));
    res.A = arms; res.P = pairs;
    res.slim = {type:res.type, arms:res.arms, pairs:res.pairs, ints:res.ints, sig:res.sig, ccx:res.ccx, ccy:res.ccy, e:res.e, tp:res.tp, tmiter:res.tmiter};
    return res;
  }

  // per line: ribbon gaps, kerb gaps per side, junction crossings, gores, line-end continuations
  function lineJunctions(li, g){
    const C = X.C, J = C.J, j0 = J.lJO[li], j1 = J.lJO[li+1], out = {gaps:[], sideGap:[[], []], xing:[], gore:[], end0:null, end1:null, endJ0:false, endJ1:false};
    const rb = X.rbb;
    for (let j = j0; j < j1; j++){
      const nd = J.lJN[j]; if (rb && (J.NX[nd] < rb[0] || J.NX[nd] > rb[2] || J.NY[nd] < rb[1] || J.NY[nd] > rb[3])) continue;
      const cx = J.cxOf[nd], r = cxGet(cx, false); if (r.type === 'N') continue;
      const s = g.jS[j - j0];
      for (let k = 0; k < r.arms.length; k++){
        const a = r.arms[k]; if (a.li !== li || Math.abs(a.s - s) > 0.01) continue;
        if (a.end){ if (a.dir > 0) out.endJ0 = true; else out.endJ1 = true; }
        if (r.type === 'C'){ const m = r.miter, sg = a.dir;        // outward direction of this arm along the miter frame
          // left normal of the line at the joint: perpendicular to the average direction (m is the average outward dir of arm 0)
          const first = r.arms[0].li === li && Math.abs(r.arms[0].s - s) < 0.01 && r.arms[0].dir === a.dir;
          let ux = first ? m[0] : -m[0], uy = first ? m[1] : -m[1]; ux *= a.dir; uy *= a.dir;     // line direction at the joint
          const nx = -uy, ny = ux, gg = secAt(g, s, a.dir), cs = nx*gg.nx + ny*gg.ny, sc = cs > 0.2 ? 1/cs : 1;
          if (a.dir > 0) out.end0 = [nx, ny, sc]; else out.end1 = [nx, ny, sc];
          continue; }
        if (r.tmiter && a.through && a.end){ const m = r.tmiter, first = m[2] === li && Math.abs(m[3] - s) < 0.01 && m[4] === a.dir;
          let ux = first ? m[0] : -m[0], uy = first ? m[1] : -m[1]; ux *= a.dir; uy *= a.dir;
          const nx = -uy, ny = ux, gg = secAt(g, s, a.dir), cs = nx*gg.nx + ny*gg.ny, sc = cs > 0.2 ? 1/cs : 1;
          if (a.dir > 0) out.end0 = [nx, ny, sc]; else out.end1 = [nx, ny, sc]; }
        if (a.trim > 0.01) out.gaps.push(a.dir > 0 ? [s, s + a.trim] : [s - a.trim, s]);
        // kerb (footway, edge line, parapet) gaps on the through road: the mouths of the side arms
        if (a.through){
          const pn = r.pairs[k], pp = r.pairs[(k + r.arms.length - 1) % r.arms.length];
          // pn: towards the next arm counter-clockwise = this arm's left (outward frame); pp: its right
          const lineSideOf = outSide => (outSide > 0) === (a.dir > 0) ? 0 : 1;     // 0: line left, 1: line right
          if (pn.kind !== 'open' && pn.bA > 0){ const sd = lineSideOf(1); out.sideGap[sd].push(a.dir > 0 ? [s - 0.01, s + pn.bA] : [s - pn.bA, s + 0.01]); }
          if (pp.kind !== 'open' && pp.aB > 0){ const sd = lineSideOf(-1); out.sideGap[sd].push(a.dir > 0 ? [s - 0.01, s + pp.aB] : [s - pp.aB, s + 0.01]); }
          for (const P of [pn, pp]) if (P.kind === 'gore'){ const sd = lineSideOf(P === pn ? 1 : -1), d = P === pn ? P.bA : P.aB, dx = P === pn ? P.xA : P.xB; out.gore.push([s, a.dir, d, sd, dx]); }
        }
        if (US){ const kind = usXing(r, a); if (kind) out.xing.push([s, a.dir, a.through ? Math.max(a.a, a.b, 0.5) : a.trim, kind]); }
        else if (r.sig && !a.link && a.c <= 10){
          const mouth = a.through ? Math.max(a.a, a.b, 0.5) : a.trim;
          out.xing.push([s, a.dir, mouth]);
        }
      }
      for (const it of r.ints) if (it[0] === li) out.gaps.push([Math.min(it[1], it[2]), Math.max(it[1], it[2])]);
    }
    // merge gaps
    const mg = gs => { if (gs.length < 2) return gs; for (let i = 1; i < gs.length; i++){ const v = gs[i]; let j = i - 1; while (j >= 0 && gs[j][0] > v[0]){ gs[j+1] = gs[j]; j--; } gs[j+1] = v; } const o = []; for (const q of gs){ if (o.length && q[0] <= o[o.length-1][1] + 0.05) o[o.length-1][1] = Math.max(o[o.length-1][1], q[1]); else o.push([q[0], q[1]]); } return o; };
    out.gaps = mg(out.gaps); out.sideGap[0] = mg(out.sideGap[0]); out.sideGap[1] = mg(out.sideGap[1]);
    for (const q of out.gaps){ if (q[0] < 0.05) q[0] = -1; if (q[1] > g.Lt - 0.05) q[1] = g.Lt + 1; }
    return out;
  }
  // US crossings at a junction arm: 1 continental crosswalk + stop bar (signals in the dense city), 2 two-line crosswalk + stop bar
  // (signals elsewhere, stop-controlled legs and all-way stops in the city), 3 stop bar only (suburban stop signs), 0 nothing
  function usXing(r, a){
    if (a.link || a.c > 10 || a.c <= 1 || r.e > 0.5 || r.arms.length < 3) return 0;
    const z = zoneOf(r.ccx, r.ccy);
    if (r.sig) return z === 2 ? 1 : 2;
    let mc = 99; for (const b of r.arms) if (!b.link && b.c < mc) mc = b.c;
    if (mc >= 9){                                                          // local streets only: some all-way stops
      const h = h01(Math.round(r.ccx*0.37) * 73856093 ^ Math.round(r.ccy*0.37) * 19349663);
      return z >= 1 ? (h < 0.6 ? 2 : 0) : (h < 0.3 ? 3 : 0);
    }
    if (a.through || a.c <= mc) return 0;                                  // the major road runs through
    return z >= 1 ? 2 : 3;                                                 // the side street stops
  }
  // does polyline P pass through box b = [x0, y0, x1, y1]?
  function nearBox(P, b){
    for (let k = 0; k + 3 < P.length; k += 2){
      const ax = P[k], ay = P[k+1], bx = P[k+2], by = P[k+3];
      if ((ax < b[0] && bx < b[0]) || (ax > b[2] && bx > b[2]) || (ay < b[1] && by < b[1]) || (ay > b[3] && by > b[3])) continue;
      if (ax >= b[0] && ax <= b[2] && ay >= b[1] && ay <= b[3]) return true;
      // segment against the box: Liang-Barsky
      let t0 = 0, t1 = 1; const dx = bx - ax, dy = by - ay, pp = [-dx, dx, -dy, dy], qq = [ax - b[0], b[2] - ax, ay - b[1], b[3] - ay]; let ok = true;
      for (let j = 0; j < 4; j++){ if (pp[j] === 0){ if (qq[j] < 0){ ok = false; break; } continue; } const r = qq[j]/pp[j]; if (pp[j] < 0){ if (r > t1){ ok = false; break; } if (r > t0) t0 = r; } else { if (r < t0){ ok = false; break; } if (r < t1) t1 = r; } }
      if (ok) return true;
    }
    return P.length === 2 && P[0] >= b[0] && P[0] <= b[2] && P[1] >= b[1] && P[1] <= b[3];
  }
  const inGap = (gs, s) => { for (let i = 0; i < gs.length; i++) if (s > gs[i][0] && s < gs[i][1]) return true; return false; };

  // ---------------------------------------------------------------- one line
  function doLine(li, L){
    DBG.dl++;
    const c = L.c, f = L.flags, P = L.P, np = P.length >> 1;
    if (np < 2 || c > 18) return;
    if (c === 16){ if (!X.idx) monorail(li, L); else if (X.ob) monorailObs(li, L); return; }
    const foreign = (f & 8) !== 0, ow = (f & 1) !== 0, wd = WID[c][ow ? 1 : 0], hw = wd/2, off = OFF[c];
    if (X.nb && !nearBox(P, X.nb)) return;
    const det = X.mode === 'detail', main = X.mode === 'main';
    if (det && (c === 11 || c === 17 || foreign)) return;                 // nothing near-detail on estate roads, piers, context roads
    const g = lineGeom(li);
    if (g.Lt < 0.3) return;
    const JN = isJ(c) ? lineJunctions(li, g) : null;
    // breaks: ribbon ends (-1) / starts (+1) at the gaps
    let nbk = 0; const brk = BRK, Lg = g.Lt;
    const addB = (v, fl) => { if (!(v > 0.05 && v < Lg - 0.05)) return; if (nbk*2 + 2 > brk.length) return; let w = nbk++;
      while (w > 0 && brk[(w-1)*2] > v){ brk[w*2] = brk[(w-1)*2]; brk[w*2+1] = brk[(w-1)*2+1]; w--; } brk[w*2] = v; brk[w*2+1] = fl; };
    if (JN){
      for (const q of JN.gaps){ addB(q[0], -1); addB(q[1], 1); }
      for (let sd = 0; sd < 2; sd++) for (const q of JN.sideGap[sd]){ addB(q[0], 0); addB(q[1], 0); }
      for (const x of JN.xing) addB(x[0] + x[1]*(x[2] + 0.4), 0);
      // merge coincident breaks (a ribbon flag wins)
      let w = 0; for (let i = 0; i < nbk; i++){ if (w && Math.abs(brk[(w-1)*2] - brk[i*2]) < 0.02){ if (brk[i*2+1]) brk[(w-1)*2+1] = brk[i*2+1]; continue; } brk[w*2] = brk[i*2]; brk[w*2+1] = brk[i*2+1]; w++; }
      nbk = w;
    }
    densify(g, brk, nbk);
    if (NS < 2) return;
    if (!chunks()) return;
    if (c === 17) for (let i = 0; i < NS; i++){ const e = 1.65 - off - SG[i]; if (e > SE[i]) SE[i] = e; }   // pier walkways stand above the water
    HW = hw; OFFc = off;
    END0 = JN && JN.end0; END1 = JN && JN.end1;
    frames(hw, off);
    END0 = END1 = null;
    X.st.lines++;
    // ribbon pieces outside the gaps
    for (let k = 0; k < NS - 1; k++) RBa[k] = JN && JN.gaps.length && inGap(JN.gaps, (SS[k] + SS[k+1])*0.5) ? 0 : 1;
    const grp = grpOf(c), col = lineCol(L, c, foreign, li), layer = (c === 10 || c === 11 || c === 12 || c === 14 || c === 17) ? 0 : 1;
    CUR.li = li; CUR.k = 0; CUR.hw = hw; CUR.c = c;
    // ---- surface ribbon
    let B = null, pl = -1, pr = -1, fB = null, fL = -1, fR = -1, eB = null, eL = -1, eR = -1;
    for (let k = 0; k < NS - 1; k++){
      const t = RBa[k] ? tileAtS((SS[k] + SS[k+1])*0.5) : -1;
      if (t < 0){ B = null; continue; }
      const g2 = ((c === 11 || c === 12) && (SE[k] > 0.3 || SE[k+1] > 0.3)) ? 0 : grp;
      if (det && g2 !== 2){ B = null; continue; }                           // the detail pass redraws only the near-detail group (paths)
      const nb2 = bSurf(t, g2);
      CUR.dx = DXa[k]; CUR.dy = DYa[k];
      if (nb2 !== B || X.idx && (k === 0 || !RBa[k-1])){ B = nb2; pl = B.v(LXO[k], LYO[k], LZO[k], col); pr = B.v(RXO[k], RYO[k], RZO[k], col); if (k === 0){ fB = B; fL = pl; fR = pr; }
        QL[0] = LXO[k]; QL[1] = LYO[k]; QL[2] = LZO[k]; QR[0] = RXO[k]; QR[1] = RYO[k]; QR[2] = RZO[k]; }
      let i = k + 1;
      while (SOa[i] && i < NS - 1 && RBa[i] && !BVa[i] && tileAtS((SS[i] + SS[i+1])*0.5) === t && Math.abs(DXa[k]*DYa[i] - DYa[k]*DXa[i]) < 2e-3
        && Math.abs(LZI[i] - (LZO[k] + (LZI[i+1] - LZO[k])*(SS[i] - SS[k])/((SS[i+1] - SS[k]) || 1))) < 0.015 && Math.abs(RZI[i] - (RZO[k] + (RZI[i+1] - RZO[k])*(SS[i] - SS[k])/((SS[i+1] - SS[k]) || 1))) < 0.015) i++;
      const li2 = B.v(LXI[i], LYI[i], LZI[i], col), ri2 = B.v(RXI[i], RYI[i], RZI[i], col);
      // roadDrive: a strongly twisted quad (edges draped on uneven ground) is split round its centre: the two-triangle split was up to
      // 20 cm off the bilinear surface the markings (and the car's wheels) follow
      const tw = QL[2] + RZI[i] - QR[2] - LZI[i];
      if (tw > 0.25 || tw < -0.25){
        // 2 x 2 bilinear sub-quads (each split round its centre too)
        const bl = (u, v) => { const ax = QR[0] + (RXI[i] - QR[0])*u, ay = QR[1] + (RYI[i] - QR[1])*u, az = QR[2] + (RZI[i] - QR[2])*u, bx = QL[0] + (LXI[i] - QL[0])*u, by = QL[1] + (LYI[i] - QL[1])*u, bz = QL[2] + (LZI[i] - QL[2])*u;
          return B.v(ax + (bx - ax)*v, ay + (by - ay)*v, az + (bz - az)*v, col); };
        const V = [[pr, bl(0, 0.5), pl], [bl(0.5, 0), bl(0.5, 0.5), bl(0.5, 1)], [ri2, bl(1, 0.5), li2]], C4 = [[bl(0.25, 0.25), bl(0.25, 0.75)], [bl(0.75, 0.25), bl(0.75, 0.75)]];
        for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++){ const p00 = V[a][b], p10 = V[a+1][b], p11 = V[a+1][b+1], p01 = V[a][b+1], cq = C4[a][b];
          B.t(p00, p10, cq, layer); B.t(p10, p11, cq, layer); B.t(p11, p01, cq, layer); B.t(p01, p00, cq, layer); }
      } else if (tw > 0.06 || tw < -0.06){
        const cq = B.v((QL[0] + QR[0] + LXI[i] + RXI[i])*0.25, (QL[1] + QR[1] + LYI[i] + RYI[i])*0.25, (QL[2] + QR[2] + LZI[i] + RZI[i])*0.25, col);
        B.t(pr, ri2, cq, layer); B.t(ri2, li2, cq, layer); B.t(li2, pl, cq, layer); B.t(pl, pr, cq, layer);
      } else { B.t(pr, ri2, li2, layer); B.t(pr, li2, pl, layer); }
      k = i - 1;
      let lo = li2, ro = ri2;
      QL[0] = LXI[i]; QL[1] = LYI[i]; QL[2] = LZI[i]; QR[0] = RXI[i]; QR[1] = RYI[i]; QR[2] = RZI[i];
      if (BVa[i] && i < NS - 1){
        if (BVa[i] > 0){ lo = B.v(LXO[i], LYO[i], LZO[i], col); tri(B, li2, lo, ri2, LXI[i], LYI[i], LXO[i], LYO[i], RXI[i], RYI[i], layer); QL[0] = LXO[i]; QL[1] = LYO[i]; QL[2] = LZO[i]; }
        else { ro = B.v(RXO[i], RYO[i], RZO[i], col); tri(B, ri2, ro, li2, RXI[i], RYI[i], RXO[i], RYO[i], LXI[i], LYI[i], layer); QR[0] = RXO[i]; QR[1] = RYO[i]; QR[2] = RZO[i]; }
      }
      pl = lo; pr = ro;
      if (i === NS - 1){ eB = B; eL = li2; eR = ri2; }
    }
    // [lm24/roadfix] an underlay where the ribbon is cut for a junction, 4 cm under the junction surface: some complex junction fills
    // leave 1-3 m holes between a cut carriageway and the fill (the road surface 'disappears'); the fill covers it wherever it is drawn
    if (JN && JN.gaps.length && c <= 11 && !det){
      for (let k = 0; k < NS - 1; k++){
        if (RBa[k]) continue;
        const t = tileAtS((SS[k] + SS[k+1])*0.5); if (t < 0) continue;
        const g2 = ((c === 11 || c === 12) && (SE[k] > 0.3 || SE[k+1] > 0.3)) ? 0 : grp, Bu = bSurf(t, g2); CUR.dx = DXa[k]; CUR.dy = DYa[k];
        const ua = Bu.v(LXO[k], LYO[k], LZO[k] - 0.04, col), ub = Bu.v(RXO[k], RYO[k], RZO[k] - 0.04, col), uc = Bu.v(RXI[k+1], RYI[k+1], RZI[k+1] - 0.04, col), ud = Bu.v(LXI[k+1], LYI[k+1], LZI[k+1] - 0.04, col);
        Bu.t(ub, uc, ud, layer); Bu.t(ub, ud, ua, layer);
      }
    }
    // ---- round caps where the line dead-ends or meets others without a junction surface
    if (CAPN(c) && wd >= 3.5 && !det){
      const tun = k => (c <= 11 && !foreign && SE[k] <= 0.5 && (f & (k ? 128 : 64)) !== 0 && atGradeEnd(k ? 1 : 0) && mouthClear(k ? 1 : 0) && deadEnd(li, L, k ? np - 1 : 0)) || c <= 5 && !foreign && SE[k] <= 0.5 && Math.abs(SX[k]) <= HALF - 600 && Math.abs(SY[k]) <= HALF - 600 && SS[NS-1] >= 30 && atGradeEnd(k ? 1 : 0) && mouthClear(k ? 1 : 0) && deadEnd(li, L, k ? np - 1 : 0);
      if (fB && RBa[0] && !(JN && (JN.endJ0 || JN.end0)) && capWanted(li, L, 0) && !tun(0)) cap(fB, 0, fL, fR, true, hw, col, layer);
      if (eB && RBa[NS-2] && !(JN && (JN.endJ1 || JN.end1)) && capWanted(li, L, np - 1) && !tun(NS - 1)) cap(eB, NS - 1, eL, eR, false, hw, col, layer);
    }
    // ---- dual carriageways, kerbs and footways (recorded by the surface index too)
    const link = (f & 16) !== 0;
    if (!foreign && c <= 10) medians(li, c, hw, ow, link); else { MPL = -1; for (let i = 0; i < NS; i++) MHa[i] = -1; }
    const RG = c <= 10 && !foreign ? ringOf(li, L, c, hw) : null;
    RINGSIDE = RG ? RG.side : 0; SWJ = g.jS;
    sideworks(c, hw, ow, li, L, JN, main ? 1 : det ? 2 : 3);
    RINGSIDE = 0;
    if (RG && !det) island(RG);
    if (X.idx){
      // roadDrive: the index also records what a car hits: lamp poles, deck parapets, piers, tunnel portals (US: median barriers)
      if (X.ob){
        if (US && c <= 1 && ow && !link && !foreign) fwyMedianObs(li, hw);
        if (!foreign) lamps(c, hw, ow, li, JN, L, 3);
        let elev = false; for (let i = 0; i < NS; i++) if (SE[i] > 0.3){ elev = true; break; }
        if (elev) structures(c, hw, wd, foreign, L, li, JN);
        if (!foreign && c <= 11) for (const end of [0, 1]){
          const k = end ? np - 1 : 0, i = end ? NS - 1 : 0, tf = (f & (end ? 128 : 64)) !== 0;   // [roadfix] marked tunnel mouth
          if (!tf && (c > 5 || (JN && (end ? (JN.endJ1 || JN.end1) : (JN.endJ0 || JN.end0))))) continue;
          if (SE[i] > 0.5 || !RBa[end ? NS - 2 : 0] || !deadEnd(li, L, k) || !atGradeEnd(end) || !mouthClear(end) || (!tf && (Math.abs(SX[i]) > HALF - 600 || Math.abs(SY[i]) > HALF - 600 || SS[NS-1] < 30))) continue;
          portal(end, hw, c);
        }
      }
      return;
    }
    if (US && c <= 1 && ow && !link && !foreign && !det) fwyMedian(li, hw);
    // ---- markings, structures, lamps, tunnel portals (main pass: what shows from afar; detail pass: near-only detail)
    if (!foreign && (c <= 10 || c === 13 || c === 14 || c === 15) && (!main || c >= 13)) markings(li, L, c, hw, wd, ow, JN);
    if (!foreign) lamps(c, hw, ow, li, JN, L, main ? 1 : det ? 2 : 3);
    if (det) return;
    let elev = false; for (let i = 0; i < NS; i++) if (SE[i] > 0.3){ elev = true; break; }
    if (elev) structures(c, hw, wd, foreign, L, li, JN);
    if (!foreign && c <= 11) for (const end of [0, 1]){
      const k = end ? np - 1 : 0, i = end ? NS - 1 : 0, tf = (f & (end ? 128 : 64)) !== 0;   // [roadfix] marked tunnel mouth
      if (!tf && (c > 5 || (JN && (end ? (JN.endJ1 || JN.end1) : (JN.endJ0 || JN.end0))))) continue;
      if (SE[i] > 0.5 || !RBa[end ? NS - 2 : 0] || !deadEnd(li, L, k) || !atGradeEnd(end) || !mouthClear(end) || (!tf && (Math.abs(SX[i]) > HALF - 600 || Math.abs(SY[i]) > HALF - 600 || SS[NS-1] < 30))) continue;
      portal(end, hw, c);
    }
  }
  const QL = [0, 0, 0], QR = [0, 0, 0];
  function triDown(B, a, b, c, ax, ay, bx, by, cx, cy, l){
    if ((bx - ax)*(cy - ay) - (by - ay)*(cx - ax) > 0) B.t(a, c, b, l); else B.t(a, b, c, l);
  }
  function tri(B, a, b, c, ax, ay, bx, by, cx, cy, l){
    if ((bx - ax)*(cy - ay) - (by - ay)*(cx - ax) > 0) B.t(a, b, c, l); else B.t(a, c, b, l);
  }
  function capWanted(li, L, k){
    const C = X.C, cw = C.capw || (C.capw = new Int8Array(C.lines.length*2).fill(-1)), slot = li*2 + (k === 0 ? 0 : 1);
    if (cw[slot] < 0) cw[slot] = capCompute(li, L, k) ? 1 : 0;
    return cw[slot] === 1;
  }
  function capCompute(li, L, k){
    const C = X.C, nd = nodeAt(C, L.P[k*2], L.P[k*2+1]); if (nd < 0) return true;
    const o0 = C.nodeOff[nd], o1 = C.nodeOff[nd+1]; let others = 0, ol = -1, ov = -1;
    for (let j = o0; j < o1; j++){ if ((C.incL[j] === li && C.incV[j] === k) || C.lines[C.incL[j]].c === 12) continue; others++; ol = C.incL[j]; ov = C.incV[j]; }
    if (others === 0) return true;
    if (others > 1) return true;
    const M = C.lines[ol], mn = M.P.length >> 1;
    if (ov !== 0 && ov !== mn - 1) return true;
    if (!dirAt(L, k, k === 0 ? 1 : -1, _d1) || !dirAt(M, ov, ov === 0 ? 1 : -1, _d2)) return true;
    return _d1[0]*_d2[0] + _d1[1]*_d2[1] > -0.94;
  }
  function cap(B, i, iL, iR, start, hw, col, layer){
    const nseg = hw < 2.5 ? 2 : hw < 4.5 ? 3 : hw < 8 ? 4 : 6, k = start ? 0 : NS - 2, dx = DXa[k], dy = DYa[k], nx = -dy, ny = dx;
    const x = SX[i], y = SY[i], e = SE[i], gc = SG[i], al = e < 1 ? e : 1, base = OFFc + e;
    const cI = B.v(x, y, SZ[i], col); let prev = start ? iR : iL;
    for (let j = 1; j <= nseg; j++){
      let cur;
      if (j < nseg){
        const ph = j*Math.PI/nseg, cs = Math.cos(ph), sn = Math.sin(ph);
        const vx = start ? -nx*cs - dx*sn : nx*cs + dx*sn, vy = start ? -ny*cs - dy*sn : ny*cs + dy*sn;
        const px = x + vx*hw, py = y + vy*hw, gp = G(px, py);
        cur = B.v(px, py, gp + (gc - gp)*al + base, col);
      } else cur = start ? iL : iR;
      B.t(cI, cur, prev, layer); prev = cur;
    }
  }

  // ---------------------------------------------------------------- junction surfaces
  function doComplex(cx){
    DBG.dc++;
    const r = cxGet(cx, true); if (r.type === 'N' || r.type === 'C') return;
    const A = r.A, Pp = r.P, na = A.length;
    const t = tileOf(r.ccx, r.ccy); if (!wantXY(r.ccx, r.ccy)) return;
    let top = A[0]; for (const a of A) if (a.c < top.c || (a.c === top.c && a.hw > top.hw)) top = a;
    const grp = top.c === 11 ? 1 : 0, foreign = A.every(a => a.foreign), elev = r.e > 0.5;
    const colOf = a => US ? lineCol(a.L, a.c, a.foreign, a.li) : (a.foreign ? COLF : COL)[a.c];
    CUR.li = top.li; CUR.k = 1; CUR.hw = top.hw; CUR.c = top.c;
    { const s = secAt(top.g, top.s, top.dir); CUR.dx = s.ny; CUR.dy = -s.nx; }
    const B = X.mode === 'detail' ? null : bSurf(t, grp);
    X.st.junc++;
    // outline: per arm R-edge out to the trim, the trim section, L-edge back, then the corner to the next arm
    const zOf = (x, y, a, b, f, za, zb) => elev ? za + (zb - za)*f : G(x, y) + (a.off + (b.off - a.off)*f);
    if (r.type === 'F'){
      const OX = [], OY = [], OZ = [], OC = [], KB = [];      // KB: 1 if the outline edge starting here is a kerb
      const add = (x, y, z, col, kb) => { OX.push(x); OY.push(y); OZ.push(z); OC.push(col); KB.push(kb); };
      for (let i = 0; i < na; i++){
        const a = A[i], P = Pp[i], col = colOf(a);
        const co = cornersAt(a.g, a.s + a.dir*a.trim, a.dir);
        // outward frame: line left is outward left when dir > 0
        const Lx = a.dir > 0 ? co.lx : co.rx, Ly = a.dir > 0 ? co.ly : co.ry, Lz = a.dir > 0 ? co.lz : co.rz;
        const Rx = a.dir > 0 ? co.rx : co.lx, Ry = a.dir > 0 ? co.ry : co.ly, Rz = a.dir > 0 ? co.rz : co.lz;
        // right edge from a.a to the trim
        if (a.a >= 0 && a.a < a.trim - 0.5){ for (let q = 0; q < a.D.length; q++){ const d = a.D[q]; if (d <= a.a || d >= a.trim - 0.3) continue; add(a.rx[q], a.ry[q], zEdge(a, d, -1), col, 1); } }
        add(Rx, Ry, Rz, col, 0); add(Lx, Ly, Lz, col, 1);
        if (a.b >= 0 && a.b < a.trim - 0.5){ for (let q = a.D.length - 1; q >= 0; q--){ const d = a.D[q]; if (d <= a.b || d >= a.trim - 0.3) continue; add(a.lx[q], a.ly[q], zEdge(a, d, 1), col, 1); } }
        // corner to the next arm
        const b = A[P.j];
        if (P.kind === 'kerb' && P.X){
          const p0 = a.b >= 0 ? edgeAt(a, a.lx, a.ly, Math.min(a.b, a.trim)) : [Lx, Ly], p1 = b.a >= 0 ? edgeAt(b, b.rx, b.ry, Math.min(b.a, b.trim)) : null;
          if (a.b >= 0 && a.b < a.trim - 0.3) add(p0[0], p0[1], zEdge(a, a.b, 1), col, 1);
          if (p1){
            const cxp = P.X[2], cyp = P.X[3], nseg = Math.max(2, Math.min(a.c >= 11 || b.c >= 11 ? 2 : 4, Math.round((Math.PI - (P.th || 1.5))/0.45) + 1));
            const za = OZ[OZ.length-1], zb = zEdge(b, Math.min(b.a, b.trim), -1);
            for (let q = 1; q < nseg; q++){ const u = q/nseg, w0 = (1 - u)*(1 - u), w1 = 2*u*(1 - u), w2 = u*u, x = w0*p0[0] + w1*cxp + w2*p1[0], y = w0*p0[1] + w1*cyp + w2*p1[1];
              add(x, y, zOf(x, y, a, b, u, za, zb), mixC(col, colOf(b), u), 1); }
            if (b.a >= 0 && b.a < b.trim - 0.3) add(p1[0], p1[1], zb, colOf(b), 1);
          }
        } else if (P.kind === 'gore'){
          if (a.b >= 0 && a.b < a.trim - 0.3){ const p = edgeAt(a, a.lx, a.ly, a.b); add(p[0], p[1], zEdge(a, a.b, 1), col, 0); }
          if (b.a >= 0 && b.a < b.trim - 0.3){ const p = edgeAt(b, b.rx, b.ry, b.a); add(p[0], p[1], zEdge(b, b.a, -1), colOf(b), 1); }
        } else {
          // open corner: straight to the next arm (median nose of a dual road, open side)
          KB[KB.length-1] = medianSide(a, 1) || medianSide(b, -1) ? 2 : 1;
        }
      }
      const cz = elev ? avgZ(OZ) : G(r.ccx, r.ccy) + top.off;
      if (X.mode !== 'detail') emitPoly(B, OX, OY, OZ, OC, r.ccx, r.ccy, cz, colOf(top), grp);
      if (!X.idx) edges(r, t, OX, OY, OZ, KB, elev, r.ccx, r.ccy, cz);
      else if (!elev) outlineWalls(t, OX, OY, OZ, KB, footW(A), false, 0, 3);
      else if (X.ob) outlineObs(OX, OY, OZ, KB, edgeTh(r), r.e);
    } else {
      // type T: per side of the through road a patch from the through kerb line around the side arms
      const [ti, tj] = r.tp, T0 = A[ti], T1 = A[tj];
      for (const side of [0, 1]){
        // arms strictly between (CCW) from start to end
        const st = side === 0 ? ti : tj, en = side === 0 ? tj : ti, mid = [];
        for (let k = (st + 1) % na; k !== en; k = (k + 1) % na) mid.push(k);
        if (!mid.length) continue;
        const a0 = A[st], a1 = A[en], OX = [], OY = [], OZ = [], OC = [], KB = [];
        const add = (x, y, z, col, kb) => { OX.push(x); OY.push(y); OZ.push(z); OC.push(col); KB.push(kb); };
        // through kerb: from a1's right edge at a1.a back to the node, then a0's left edge out to a0.b
        const ext = 0.25;                       // tuck the patch slightly under the through road
        const thr = (a, d, sideSign) => { const gg = a.g, s = a.s + a.dir*d, q = secAt(gg, s, a.dir), hwI = a.hw - ext, sgn = sideSign*a.dir;   // sideSign: +1 left (outward)
          const z = secZ(q.x, q.y, q.nx*a.hw, q.ny*a.hw, a.hw, q.e, a.off, G(q.x, q.y)), zz = (sgn > 0 ? z.zl : z.zr) - 0.004;
          return [q.x + q.nx*hwI*sgn, q.y + q.ny*hwI*sgn, zz]; };
        const colT = colOf(a0);
        // start at the node on the through kerb, go out along a0's left edge to a0.b
        const P0 = Pp[st];
        const dA = Math.max(0.3, a0.b), dB = Math.max(0.3, a1.a);
        { const steps = Math.max(1, Math.ceil(dB/6)); for (let q = steps; q >= 1; q--){ const p = thr(a1, dB*q/steps, -1); add(p[0], p[1], p[2], colT, 0); } }
        { const p = thr(a0, 0.001, 1); add(p[0], p[1], p[2], colT, 0); }
        { const steps = Math.max(1, Math.ceil(dA/6)); for (let q = 1; q <= steps; q++){ const p = thr(a0, dA*q/steps, 1); add(p[0], p[1], p[2], colT, q === steps ? 1 : 0); } }
        // walk the side arms
        for (let m = -1; m < mid.length; m++){
          const k = m < 0 ? st : mid[m], a = A[k], P = Pp[k], b = A[P.j];
          if (m >= 0){
            const col = colOf(a), co = cornersAt(a.g, a.s + a.dir*a.trim, -a.dir);
            const Lx = a.dir > 0 ? co.lx : co.rx, Ly = a.dir > 0 ? co.ly : co.ry, Lz = a.dir > 0 ? co.lz : co.rz;
            const Rx = a.dir > 0 ? co.rx : co.lx, Ry = a.dir > 0 ? co.ry : co.ly, Rz = a.dir > 0 ? co.rz : co.lz;
            if (a.a >= 0 && a.a < a.trim - 0.5){ for (let q = 0; q < a.D.length; q++){ const d = a.D[q]; if (d <= a.a || d >= a.trim - 0.3) continue; add(a.rx[q], a.ry[q], zEdge(a, d, -1), col, 1); } }
            add(Rx, Ry, Rz, col, 0); add(Lx, Ly, Lz, col, 1);
            if (a.b >= 0 && a.b < a.trim - 0.5){ for (let q = a.D.length - 1; q >= 0; q--){ const d = a.D[q]; if (d <= a.b || d >= a.trim - 0.3) continue; add(a.lx[q], a.ly[q], zEdge(a, d, 1), col, 1); } }
          }
          // corner a -> b
          const aEnd = a.through ? Math.max(0.3, a.b) : Math.min(a.b, a.trim), bSt = b.through ? Math.max(0.3, b.a) : Math.min(b.a, b.trim);
          const col = colOf(a);
          if (P.kind === 'kerb' && P.X && a.b >= 0 && b.a >= 0){
            const p0 = edgeAt(a, a.lx, a.ly, aEnd), p1 = edgeAt(b, b.rx, b.ry, bSt);
            if (!a.through && a.b < a.trim - 0.3) add(p0[0], p0[1], zEdge(a, a.b, 1), col, 1);
            const za = OZ[OZ.length-1], zb = b.through ? thr(b, bSt, -1)[2] : zEdge(b, bSt, -1);
            const nseg = Math.max(2, Math.min(a.c >= 11 || b.c >= 11 ? 2 : 4, Math.round((Math.PI - (P.th || 1.5))/0.45) + 1));
            for (let q = 1; q < nseg; q++){ const u = q/nseg, w0 = (1 - u)*(1 - u), w1 = 2*u*(1 - u), w2 = u*u, x = w0*p0[0] + w1*P.X[2] + w2*p1[0], y = w0*p0[1] + w1*P.X[3] + w2*p1[1];
              add(x, y, zOf(x, y, a, b, u, za, zb), mixC(col, colOf(b), u), 1); }
            if (!b.through && b.a < b.trim - 0.3) add(p1[0], p1[1], zb, colOf(b), 1);
          } else if (P.kind === 'gore'){
            if (!a.through && a.b >= 0 && a.b < a.trim - 0.3){ const p = edgeAt(a, a.lx, a.ly, a.b); add(p[0], p[1], zEdge(a, a.b, 1), col, 0); }
            if (a.through){ const p = edgeAt(a, a.lx, a.ly, aEnd); add(p[0], p[1], thr(a, aEnd, 1)[2], col, 0); }
            if (b.through){ const p = edgeAt(b, b.rx, b.ry, bSt); add(p[0], p[1], thr(b, bSt, -1)[2], colOf(b), 1); }
            else if (b.a >= 0 && b.a < b.trim - 0.3){ const p = edgeAt(b, b.rx, b.ry, b.a); add(p[0], p[1], zEdge(b, b.a, -1), colOf(b), 1); }
          } else {
            KB[KB.length-1] = 1;
          }
        }
        // close back at the through kerb (the first points); fan from the kerb point at the node
        const ap = thr(a0, 0.001, 1), ccol = colT, gS = mid.every(k => A[k].c >= 11) ? 1 : grp;
        if (X.mode !== 'detail') emitPolyT(bSurf(t, gS), OX, OY, OZ, OC, ap[0], ap[1], ap[2], ccol, gS);
        if (!X.idx) edges(r, t, OX, OY, OZ, KB, elev, ap[0], ap[1], ap[2]);
        else if (!elev) outlineWalls(t, OX, OY, OZ, KB, footW(A), false, 0, 3);
        else if (X.ob) outlineObs(OX, OY, OZ, KB, edgeTh(r), r.e);
      }
    }
    if (!X.idx) junctionMarks(r, t, X.mode === 'main' ? 1 : X.mode === 'detail' ? 2 : 3);
    else if (X.ob) mastObs(r);
  }
  function avgZ(Z){ let s = 0; for (const z of Z) s += z; return s/Z.length; }
  // height of an arm's edge at distance d (side +1: outward left)
  function zEdge(a, d, side){
    const s = a.s + a.dir*d, co = cornersAt(a.g, s, -a.dir), left = (side > 0) === (a.dir > 0);
    return left ? co.lz : co.rz;
  }
  // is the outward-left (side +1) / outward-right (-1) edge of arm a the median side of a dual carriageway?
  // the surface height of an arm near (x, y) at distance d: ground + offset + its elevation there
  function zArm(a, d, x, y){ const q = secAt(a.g, a.s + a.dir*Math.min(d, a.g.Lt), -a.dir), e = q.e, al = e < 1 ? e : 1; return G(x, y)*(1 - al) + G(q.x, q.y)*al + a.off + e; }
  function medianSide(a, side){
    if (!a.ow || a.link || a.c > 8) return false;
    if ((side > 0) !== (US ? a.dir > 0 : a.dir < 0)) return false;     // the line's right side (left-hand traffic: the other carriageway is on the right; US: left)
    const d = Math.min(a.Dm, a.trim + 3), q = secAt(a.g, a.s + a.dir*d, -a.dir), x = q.x, y = q.y, ux = q.ny, uy = -q.nx;
    return !!partnerAt(roadGrid(X.C), a.li, x, y, ux, uy, a.hw, a.c);
  }
  // fill a closed outline: fan from the centre if it sees every edge, else ear clipping
  function emitPoly(B, OX, OY, OZ, OC, cx, cy, cz, ccol, grp){
    const n = OX.length; if (n < 3) return;
    let area = 0; for (let i = 0; i < n; i++){ const j = (i + 1) % n; area += OX[i]*OY[j] - OX[j]*OY[i]; }
    const star = (px, py) => { for (let i = 0; i < n; i++){ const j = (i + 1) % n; if ((OX[i] - px)*(OY[j] - py) - (OY[i] - py)*(OX[j] - px) < -0.05) return false; } return true; };
    // fan from the given centre, else from the outline's own centroid
    let fx = cx, fy = cy, fz = cz, ok = star(cx, cy);
    if (!ok){ let sx = 0, sy = 0, sz = 0; for (let i = 0; i < n; i++){ sx += OX[i]; sy += OY[i]; sz += OZ[i]; } sx /= n; sy /= n;
      if (star(sx, sy)){ ok = true; fx = sx; fy = sy; fz = (sz/n + cz)*0.5; } }
    const base = [];
    for (let i = 0; i < n; i++) base.push(B.v(OX[i], OY[i], OZ[i], OC[i]));
    if (ok || n > 160){
      const c = B.v(fx, fy, fz, ccol);
      for (let i = 0; i < n; i++){ const j = (i + 1) % n; const a = (OX[i] - fx)*(OY[j] - fy) - (OY[i] - fy)*(OX[j] - fx); if (a <= 1e-6) continue; B.t(c, base[i], base[j], 1); }
      return;
    }
    earClip(B, OX, OY, base, area > 0);
  }
  function emitPolyT(B, OX, OY, OZ, OC, cx, cy, cz, ccol, grp){
    // outline starts on the through kerb; fan from (cx, cy) unless that folds, then ear clipping
    emitPoly(B, OX, OY, OZ, OC, cx, cy, cz, ccol, grp);
  }
  function earClip(B, X0, Y0, V, ccw){
    const n = X0.length, idx = []; for (let i = 0; i < n; i++) idx.push(ccw ? i : n - 1 - i);
    const cr = (a, b, c) => (X0[b] - X0[a])*(Y0[c] - Y0[a]) - (Y0[b] - Y0[a])*(X0[c] - X0[a]);
    let guard = 0;
    while (idx.length > 3 && guard++ < n*n){
      let cut = false;
      for (let i = 0; i < idx.length; i++){
        const a = idx[(i + idx.length - 1) % idx.length], b = idx[i], c = idx[(i + 1) % idx.length];
        if (cr(a, b, c) <= 1e-7) continue;
        let inside = false;
        for (const p of idx){ if (p === a || p === b || p === c) continue; if (cr(a, b, p) > 0 && cr(b, c, p) > 0 && cr(c, a, p) > 0){ inside = true; break; } }
        if (inside) continue;
        B.t(V[a], V[b], V[c], 1); idx.splice(i, 1); cut = true; break;
      }
      if (!cut) break;
    }
    if (idx.length === 3 && cr(idx[0], idx[1], idx[2]) > 0) B.t(V[idx[0]], V[idx[1]], V[idx[2]], 1);
  }
  // footway width around a junction: from its urban arms
  function footW(A){ let fw = 0; for (const a of A){ if (a.foreign || a.link || !SWC(a.c) || a.e > 0.3) continue; const w = a.c <= 4 ? 3.8 : a.c <= 6 ? 3.2 : a.c <= 8 ? 2.6 : 2.0; if (w > fw) fw = w; } return fw; }
  function edgeTh(r){ let th = 1.4; for (const a of r.A) if (a.hw*2 >= 9) th = 1.8; return th; }
  function edges(r, t, OX, OY, OZ, KB, elev, cx, cy, cz){
    const part = X.mode === 'main' ? 1 : X.mode === 'detail' ? 2 : 3;
    if (elev){ if (!(part & 1)) return; let th = 1.4; for (const a of r.A) if (a.hw*2 >= 9) th = 1.8; outlineWalls(t, OX, OY, OZ, KB, 0, true, th, 3, r.e); outlineSoffit(t, OX, OY, OZ, cx, cy, cz, th); return; }
    const fw = footW(r.A); outlineWalls(t, OX, OY, OZ, KB, fw, false, 0, part);
  }
  // gore marks: hatching between the edge lines from where the kerbs meet to the nose; the slip road's outer edge line;
  // a high-mast light in the infield of expressway interchanges
  function junctionMarks(r, t, part){
    for (const P of r.P){
      if (P.kind !== 'gore' || !P.X) continue;
      const A = r.A[P.i], Bm = r.A[P.j]; if (A.foreign || Bm.foreign) continue;
      const xa = P.X[0], xb = P.X[1], na = P.bA, nb = P.aB; if (na - xa < 2 || nb - xb < 2) continue;
      // high mast
      if ((part & 1) && (A.c <= 1 || Bm.c <= 1)){
        const q1 = edgeAt(A, A.lx, A.ly, Math.min(A.Dm, na + 16)), q2 = edgeAt(Bm, Bm.rx, Bm.ry, Math.min(Bm.Dm, nb + 16)), mx = (q1[0] + q2[0])*0.5, my = (q1[1] + q2[1])*0.5;
        if (hyp(q1[0] - q2[0], q1[1] - q2[1]) > 6 && pierFree(roadGrid(X.C), mx, my, 1.2) && r.e < 0.5) mast(t, mx, my);
      }
      if (!(part & 2)) continue;
      const B = bMark(t); MCOL = M_WHITE;
      const pa = d => { const p = edgeAt(A, A.lx, A.ly, d), u = edgeAt(A, A.ux, A.uy, d), x = p[0] + u[1]*0.3, y = p[1] - u[0]*0.3; return [x, y, zArm(A, d, x, y) + 0.03]; };     // 0.3 m inside A
      const pb = d => { const p = edgeAt(Bm, Bm.rx, Bm.ry, d), u = edgeAt(Bm, Bm.ux, Bm.uy, d), x = p[0] - u[1]*0.3, y = p[1] + u[0]*0.3; return [x, y, zArm(Bm, d, x, y) + 0.03]; };
      // boundary lines
      const line = (f, d0, d1, w) => { let prev = null; const m = Math.max(2, Math.ceil((d1 - d0)/3)); for (let q = 0; q <= m; q++){ const cur = f(d0 + (d1 - d0)*q/m); if (prev) bar(B, prev, cur, w); prev = cur; } };
      line(pa, xa - 2, na, 0.2); line(pb, xb - 2, nb, 0.2);
      // hatching bars across the wedge
      const nbars = US ? 0 : Math.max(1, Math.floor((na - xa)/3.5));
      for (let q = 1; q <= nbars; q++){ const f = q/(nbars + 1), a = pa(xa + (na - xa)*f), b = pb(xb + (nb - xb)*Math.min(1, f + 0.08)); bar(B, a, b, 0.45); }
      // the slip road's outer edge line over the junction surface
      const S = A.through && !Bm.through ? Bm : !A.through && Bm.through ? A : null;
      if (S){ const sideS = S === Bm ? 1 : -1, xs = S === Bm ? S.lx : S.rx, ys = S === Bm ? S.ly : S.ry;
        const pe = d => { const p = edgeAt(S, xs, ys, d), u = edgeAt(S, S.ux, S.uy, d), x = p[0] + u[1]*0.35*sideS, y = p[1] - u[0]*0.35*sideS; return [x, y, zArm(S, d, x, y) + 0.03]; };
        line(pe, 0, S.trim + 0.3, 0.2); }
    }
  }
  // a marking bar between two points (z each), width w
  function bar(B, p, q, w){
    const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.sqrt(dx*dx + dy*dy); if (l < 0.05) return;
    const nx = -dy/l*w*0.5, ny = dx/l*w*0.5;
    const a = B.v(p[0] - nx, p[1] - ny, p[2], MCOL), b = B.v(q[0] - nx, q[1] - ny, q[2], MCOL), c = B.v(q[0] + nx, q[1] + ny, q[2], MCOL), d = B.v(p[0] + nx, p[1] + ny, p[2], MCOL);
    B.t(a, b, c, 1); B.t(a, c, d, 1);
  }
  function mast(t, x, y){
    const z = G(x, y), B = bStruct(t, 0);
    boxV(B, x, y, 1, 0, 0.32, 0.32, z - 0.3, z + 26, C_POLE, false, false);
    boxV(B, x, y, 1, 0, 1.3, 1.3, z + 26, z + 26.6, C_POLED, true, true);
    const LB = bLamp(t); for (let j = 0; j < 4; j++){ const a = j*Math.PI/2 + 0.4; LB.v(x + Math.cos(a)*1.1, y + Math.sin(a)*1.1, z + 25.8, L_MAST); }
    X.st.mast = (X.st.mast || 0) + 1;
  }

  // ---------------------------------------------------------------- markings
  let MB = null, MCOL = null, MDZ = 0.03, CUTS = []; const BRK = new Float64Array(512);
  function zLat(i, t){ let u = (t/HW + 1)*0.5; u = u < 0 ? 0 : u > 1 ? 1 : u; return RZI[i] + (LZI[i] - RZI[i])*u; }
  // a strip from s0 to s1 at lateral offset t (left +), width w, following the stations
  let PL = 0, PR = 0;
  function pairAt(B, k, s, tl, tr, col){
    const d = SS[k+1] - SS[k], f = d > 0 ? (s - SS[k])/d : 0, x = SX[k] + (SX[k+1] - SX[k])*f, y = SY[k] + (SY[k+1] - SY[k])*f, nx = -DYa[k], ny = DXa[k];
    const a = zLat(k, tl), b = zLat(k, tr);
    PL = B.v(x + nx*tl, y + ny*tl, a + (zLat(k+1, tl) - a)*f + MDZ, col); PR = B.v(x + nx*tr, y + ny*tr, b + (zLat(k+1, tr) - b)*f + MDZ, col);
  }
  function strip(s0, s1, t, w){
    const B = MB, col = MCOL, tl = t + w*0.5, tr = t - w*0.5, k = segAt(s0);
    pairAt(B, k, s0, tl, tr, col); let aL = PL, aR = PR;
    for (let i = k + 1; i < NS - 1 && SS[i] < s1 - 0.05; i++){
      const ox = MXa[i]*SCa[i], oy = MYa[i]*SCa[i];
      const bL = B.v(SX[i] + ox*tl, SY[i] + oy*tl, zLat(i, tl) + MDZ, col), bR = B.v(SX[i] + ox*tr, SY[i] + oy*tr, zLat(i, tr) + MDZ, col);
      B.t(aR, bR, bL, 1); B.t(aR, bL, aL, 1); aL = bL; aR = bR;
    }
    pairAt(B, segAt(s1), s1, tl, tr, col);
    B.t(aR, PR, PL, 1); B.t(aR, PL, aL, 1);
  }
  function cutHit(a, b){ for (let j = 0; j < CUTS.length; j += 2) if (b > CUTS[j] && a < CUTS[j+1]) return true; return false; }
  function solid(s0, s1, t, w, cuts){
    // split at junction cuts and at chunk borders
    const segs = [s0, s1], CC = cuts || CUTS;
    for (let j = 0; j < CC.length; j += 2){
      for (let q = 0; q < segs.length; q += 2){
        const a = segs[q], b = segs[q+1], c0 = CC[j], c1 = CC[j+1];
        if (c1 <= a || c0 >= b) continue;
        const rep = []; if (c0 > a) rep.push(a, c0); if (c1 < b) rep.push(c1, b);
        segs.splice(q, 2, ...rep); q -= 2;
      }
    }
    for (let q = 0; q < segs.length; q += 2){
      let a = segs[q]; const b = segs[q+1];
      while (b - a > 0.3){
        const ch = Math.min(NCH - 1, Math.floor((a + 0.01)/CHL)), e = Math.min(b, (ch + 1)*CHL);
        if (e <= a) break;
        if (CHW[ch] && e - a > 0.3){ MB = bMark(CHT[ch]); strip(a, e, t, w); }
        a = e;
      }
    }
  }
  function dashed(s0, s1, t, w, dl, gap, cuts, cuts2){
    const CC = cuts || CUTS;
    for (let s = s0 + gap*0.5; s + dl <= s1; s += dl + gap){
      let hit = false; for (let j = 0; j < CC.length; j += 2) if (s + dl > CC[j] && s < CC[j+1]){ hit = true; break; }
      if (!hit && cuts2) for (let j = 0; j < cuts2.length; j += 2) if (s + dl > cuts2[j] && s < cuts2[j+1]){ hit = true; break; }
      if (hit) continue;
      const tt = tileAtS(s + dl*0.5); if (tt < 0) continue;
      MB = bMark(tt); strip(s, s + dl, t, w);
    }
  }
  function rect(s0, s1, t, w){ const a = Math.max(0, Math.min(s0, s1)), b = Math.min(SS[NS-1], Math.max(s0, s1)); if (b - a < 0.2) return; const tt = tileAtS((a + b)*0.5); if (tt < 0) return; MB = bMark(tt); strip(a, b, t, w); }
  function markings(li, L, c, hw, wd, ow, JN){
    const Lt = SS[NS-1]; MDZ = 0.03; MCOL = M_WHITE;
    // no lane markings over junction boxes (the ribbon gaps) and signalised crossings; edge lines also stop at side-road mouths
    CUTS.length = 0; XS.length = 0; ECL.length = 0; ECR.length = 0; GD.length = 0;
    if (JN){
      for (const q of JN.gaps) CUTS.push(q[0] - 0.3, q[1] + 0.3);
      for (const x of JN.xing){ const s = x[0], d = x[1], m = x[2], a = s + d*m, b = s + d*(m + (x[3] === 3 ? 2.2 : 6.2)); CUTS.push(Math.min(a, b) - 0.2, Math.max(a, b) + 0.2); XS.push(x); }
      for (const q of JN.sideGap[0]) ECL.push(q[0], q[1]);
      for (const q of JN.sideGap[1]) ECR.push(q[0], q[1]);
      // gores: the edge line on the gore side is broken (lane separation) from the node to the meeting point of the kerbs
      for (const q of JN.gore){ const s = q[0], d = q[1], dx = q[4] > 0 ? q[4] : q[2]*0.6; GD.push(Math.min(s, s + d*dx), Math.max(s, s + d*dx), q[3]); }
    }
    for (let j = 0; j < CUTS.length; j++){ ECL.push(CUTS[j]); ECR.push(CUTS[j]); }
    const lanes = LANES[c][ow ? 1 : 0], link = (L.flags & 16) !== 0;
    if (c === 13 || c === 14 || c === 15) return specialMarks(c, hw, Lt);
    if (US) return marksUS(li, L, c, hw, wd, ow, Lt, lanes, link);
    const dl = 3, gap = 9;
    if (ow){
      // one-way carriageway: kerb / shoulder on the left (t > 0), median or kerb on the right
      const sh = c === 0 ? 1.6 : c <= 3 ? 0.6 : 0.4, mr = c === 0 ? 0.6 : 0.4, N = Math.max(1, lanes), lw = (wd - sh - mr)/N;
      if (c <= 3 || link){ edgeLine(Lt, hw - sh + 0.1, 0.2, ECL, 0); edgeLine(Lt, -hw + mr - 0.1, 0.2, ECR, 1); }
      else if (c <= 8){ MCOL = M_YEL; solid(0, Lt, hw - 0.3, 0.1, ECL); MCOL = M_WHITE; }
      for (let j = 1; j < N; j++) laneLine(hw - sh - j*lw, Lt, dl, gap, 0);
    } else if (lanes >= 2){
      const N = lanes >> 1, inE = c <= 2 ? 0.6 : 0.35, lw = (hw - inE)/N;
      if (c <= 6){ solid(0, Lt, 0.13, 0.11, CUTS); solid(0, Lt, -0.13, 0.11, CUTS); }
      else dashed(0, Lt, 0, 0.12, 3, 5, CUTS, null);
      if (c <= 2){ edgeLine(Lt, hw - inE, 0.2, ECL, 0); edgeLine(Lt, -hw + inE, 0.2, ECR, 1); }
      else if (wd >= 6 && c <= 8){ MCOL = M_YEL; solid(0, Lt, hw - 0.3, 0.1, ECL); solid(0, Lt, -hw + 0.3, 0.1, ECR); MCOL = M_WHITE; }
      for (let j = 1; j < N; j++){ laneLine(j*lw, Lt, dl, gap, -1); laneLine(-j*lw, Lt, dl, gap, 1); }
    } else if (c <= 9){
      // single-lane links: edge lines
      edgeLine(Lt, hw - 0.4, 0.18, ECL, 0); edgeLine(Lt, -hw + 0.4, 0.18, ECR, 1);
    }
    // stop lines and zebra crossings at signalised junctions
    for (const x of XS) crossing(x, hw, ow, c);
    // expansion joints across high decks
    MCOL = C_JOINT;
    for (let s = 20; s < Lt - 5; s += 36){ const k = segAt(s); if (SE[k] < 4 || SE[k+1] < 4 || !RBa[k]) continue; rect(s, s + 0.3, 0, 2*hw - 0.3); }
    MCOL = M_WHITE;
  }
  const XS = [], ECL = [], ECR = [], GD = [];
  // US markings (right-hand traffic): double yellow centre lines, yellow left / white right edge lines on freeways and ramps, white
  // dashed lane lines (freeways: 12 ft dashes, 36 ft gaps, a raised marker in each gap), stop bars, continental / two-line crosswalks
  function marksUS(li, L, c, hw, wd, ow, Lt, lanes, link){
    const fwy = c <= 1 && !link, dl = fwy ? 3.66 : 3, gap = fwy ? 10.97 : 9;
    MCOL = M_WHITE;
    if (ow){
      // one-way carriageway: the median side (left shoulder, yellow edge line) on the left (t > 0), the outside shoulder on the right
      const shR = c === 0 ? 2.0 : c <= 3 ? 0.7 : 0.4, shL = c === 0 ? 0.9 : c <= 3 ? 0.5 : 0.4, N = Math.max(1, lanes), lw = (wd - shR - shL)/N;
      if (c <= 1 || link || (c <= 3 && zoneOf(SX[0], SY[0]) < 2)){ MCOL = M_YEL; edgeLine(Lt, hw - shL + 0.1, 0.15, ECL, 0); MCOL = M_WHITE; edgeLine(Lt, -hw + shR - 0.1, 0.2, ECR, 1); }
      else if (c <= 8 && MPL >= 0){ MCOL = M_YEL; solid(0, Lt, hw - 0.35, 0.12, ECL); MCOL = M_WHITE; }
      for (let j = 1; j < N; j++) laneLineUS(hw - shL - j*lw, Lt, dl, gap, 0, fwy);
    } else if (lanes >= 2){
      const N = lanes >> 1, inE = c <= 2 ? 0.6 : 0.35, lw = (hw - inE)/N;
      // double yellow: arterials and many city streets (by street name); none on minor residential streets
      if (c <= 8 || (c === 10 && L.name && L.name[0] && sh01(L.name[0]) < 0.4)){ MCOL = M_YEL; solid(0, Lt, 0.15, 0.12, CUTS); solid(0, Lt, -0.15, 0.12, CUTS); MCOL = M_WHITE; }
      if (c <= 2 && zoneOf(SX[0], SY[0]) < 2){ edgeLine(Lt, hw - inE, 0.15, ECL, 0); edgeLine(Lt, -hw + inE, 0.15, ECR, 1); }
      for (let j = 1; j < N; j++){ laneLineUS(j*lw, Lt, dl, gap, -1, false); laneLineUS(-j*lw, Lt, dl, gap, 1, false); }
    }
    for (const x of XS) crossingUS(x, hw, ow);
    // expansion joints across high decks
    MCOL = C_JOINT;
    for (let s = 20; s < Lt - 5; s += 36){ const k = segAt(s); if (SE[k] < 4 || SE[k+1] < 4 || !RBa[k]) continue; rect(s, s + 0.3, 0, 2*hw - 0.3); }
    MCOL = M_WHITE;
  }
  // a US lane line: white dashes (solid before signalised stop bars); freeways: a raised pavement marker in the middle of each gap
  const M_RPM = [255,255,250,0];
  function laneLineUS(t, Lt, dl, gap, side, rpm){
    laneLine(t, Lt, dl, gap, side, 0.13);
    if (rpm){ MCOL = M_RPM; dashed((dl + gap)*0.5, Lt, t, 0.2, 0.26, dl + gap - 0.26, CUTS, SL); MCOL = M_WHITE; }
  }
  // US crossings (x[3]: 1 continental, 2 two-line crosswalk, 3 stop bar only); the stop bar spans the approach lanes (right-hand traffic)
  function crossingUS(x, hw, ow){
    const s = x[0], d = x[1], m = x[2], kind = x[3], Lt = SS[NS-1];
    if (kind !== 3){
      const z0 = s + d*(m + 0.6), z1 = s + d*(m + 3.9); if (Math.min(z0, z1) < 0 || Math.max(z0, z1) > Lt) return;
      const a = Math.min(z0, z1), b = Math.max(z0, z1);
      if (kind === 1){ const nb = Math.max(2, Math.round((2*hw - 0.6)/1.2)); for (let j = 0; j < nb; j++) rect(a, b, -hw + 0.6 + j*(2*hw - 1.2)/(nb - 1 || 1), 0.6); }
      else { rect(a, a + 0.3, 0, 2*hw - 0.3); rect(b - 0.3, b, 0, 2*hw - 0.3); }
    }
    const st = s + d*(kind === 3 ? m + 1.4 : m + 5.2);
    if (st < 0.3 || st > Lt - 0.3) return;
    if (ow){ if (d > 0) return; rect(st - 0.22, st + 0.22, 0, 2*hw - 0.6); }
    else rect(st - 0.22, st + 0.22, d > 0 ? hw*0.5 : -hw*0.5, hw - 0.4);
  }
  // an edge line: solid, broken where it separates a merging / diverging lane (gores on that side)
  function edgeLine(Lt, t, w, cuts, sd){
    let ext = null;
    for (let j = 0; j < GD.length; j += 3) if (GD[j+2] === sd){ (ext || (ext = [])).push(GD[j], GD[j+1]); }
    if (!ext){ solid(0, Lt, t, w, cuts); return; }
    solid(0, Lt, t, w, cuts.concat(ext));
    for (let j = 0; j < ext.length; j += 2) dashed(ext[j], ext[j+1], t, 0.2, 3, 3, cuts, null);
  }
  // a lane line: dashed, solid for the last 30 m before a signalised stop line (side: +1 / -1 only the approach of that direction, 0 one-way)
  function laneLine(t, Lt, dl, gap, side, w){
    SL.length = 0; if (w === undefined) w = 0.15;
    for (const x of XS){ const s = x[0], d = x[1], m = x[2];
      if (side && (side > 0) !== (d < 0)) continue;           // two-way: only the lanes approaching the junction
      const st = s + d*(m + 6.2); SL.push(Math.min(st, st + d*30), Math.max(st, st + d*30)); }
    dashed(0, Lt, t, w, dl, gap, CUTS, SL);
    for (let j = 0; j < SL.length; j += 2) solid(Math.max(0, SL[j]), Math.min(Lt, SL[j+1]), t, w, CUTS);
  }
  const SL = [];
  // zebra crossing and stop line on the approach lanes (left-hand traffic: the approach side is the outward right)
  function crossing(x, hw, ow, c){
    const s = x[0], d = x[1], m = x[2], Lt = SS[NS-1];
    const z0 = s + d*(m + 0.5), z1 = s + d*(m + 4.5); if (Math.min(z0, z1) < 0 || Math.max(z0, z1) > Lt) return;
    const a = Math.min(z0, z1), b = Math.max(z0, z1), nb = Math.max(2, Math.round((2*hw - 0.6)/1.1));
    for (let j = 0; j < nb; j++){ const t = -hw + 0.55 + j*(2*hw - 1.1)/(nb - 1 || 1); rect(a, b, t, 0.55); }
    const st = s + d*(m + 5.8);
    if (st < 0.3 || st > Lt - 0.3) return;
    if (ow){ if (d > 0) return; rect(st - 0.2, st + 0.2, 0, 2*hw - 0.6); }
    else { const lft = d < 0; rect(st - 0.2, st + 0.2, lft ? hw*0.5 : -hw*0.5, hw - 0.4); }
  }
  function specialMarks(c, hw, Lt){
    if (c === 14){ MCOL = M_YEL; solid(0, Lt, 0, 0.5); }
    else if (c === 15){ MCOL = M_RAIL; MDZ = 0.16; solid(0, Lt, 0.75, 0.22); solid(0, Lt, -0.75, 0.22); }
    else if (c === 13){
      MCOL = M_RWY;
      solid(Math.min(30, Lt*0.1), Lt - Math.min(30, Lt*0.1), hw - 1.5, 0.9); solid(Math.min(30, Lt*0.1), Lt - Math.min(30, Lt*0.1), -hw + 1.5, 0.9);
      for (let s = 80; s + 30 < Lt - 80; s += 50) rect(s, s + 30, 0, 0.9);
      const keys = hw > 20 ? 8 : 4, half = Lt*0.5 - 40;
      for (const end of [0, 1]){
        const S = d => end ? Lt - d : d;
        for (let k = 0; k < keys; k++) for (const sg of [-1, 1]) rect(S(6), S(36), sg*(2.7 + k*3.6), 1.8);
        if (half > 445 && hw > 15) for (const sg of [-1, 1]) rect(S(400), S(445), sg*13, 8);
        for (const [d, nb] of [[150, 3], [300, 3], [600, 2], [750, 1], [900, 1]]){
          if (d + 23 > half || hw < 15) continue;
          for (let j = 0; j < nb; j++) for (const sg of [-1, 1]) rect(S(d), S(d + 22.5), sg*(10 + j*3.3), 1.8);
        }
      }
    }
  }

  // ---------------------------------------------------------------- elevated structures
  function interp(A, s){ const k = segAt(s), d = SS[k+1] - SS[k], f = d > 0 ? (s - SS[k])/d : 0; return A[k] + (A[k+1] - A[k])*f; }
  function boxV(B, cx, cy, ux, uy, hu, hv, z0, z1, col, top, bot){
    if (!B){ if (X.ob) obRec(1, cx, cy, ux, uy, 0, z0, z1, hu, hv); return; }
    // oriented box (u along, v = left of u); outward walls, optional top and bottom
    const vx = -uy, vy = ux, P = [[cx - ux*hu - vx*hv, cy - uy*hu - vy*hv], [cx + ux*hu - vx*hv, cy + uy*hu - vy*hv], [cx + ux*hu + vx*hv, cy + uy*hu + vy*hv], [cx - ux*hu + vx*hv, cy - uy*hu + vy*hv]];
    for (let j = 0; j < 4; j++){
      const a = P[j], b = P[(j + 1) & 3], dx = b[0] - a[0], dy = b[1] - a[1], l = hyp(dx, dy) || 1, nx = dy/l, ny = -dx/l;
      const a0 = B.vn(a[0], a[1], z0, col, nx, 0, -ny), b0 = B.vn(b[0], b[1], z0, col, nx, 0, -ny), b1 = B.vn(b[0], b[1], z1, col, nx, 0, -ny), a1 = B.vn(a[0], a[1], z1, col, nx, 0, -ny);
      B.t(a0, b0, b1); B.t(a0, b1, a1);
    }
    if (top){ const q = P.map(p => B.vn(p[0], p[1], z1, col, 0, 1, 0)); B.t(q[0], q[1], q[2]); B.t(q[0], q[2], q[3]); }
    if (bot){ const q = P.map(p => B.vn(p[0], p[1], z0, C_UNDER, 0, -1, 0)); B.t(q[0], q[2], q[1]); B.t(q[0], q[3], q[2]); }
  }
  // the vertex set of a deck cross-section at station i: outer walls, parapets (cap + inner face), underside, optional top
  function deckSet(B, i, P){
    const x = SX[i], y = SY[i], mx = MXa[i], my = MYa[i], ox = mx*SCa[i], oy = my*SCa[i], sw = P.sw, pt = P.pt, e = SE[i];
    const lx = x + ox*sw, ly = y + oy*sw, rx = x - ox*sw, ry = y - oy*sw, lix = x + ox*(sw - pt), liy = y + oy*(sw - pt), rix = x - ox*(sw - pt), riy = y - oy*(sw - pt);
    let zl, zr, gl, gr;
    if (P.same){ zl = (LZI[i] + LZO[i])*0.5; zr = (RZI[i] + RZO[i])*0.5; gl = GLa[i]; gr = GRa[i]; } else { zl = zr = SZ[i]; gl = G(lx, ly); gr = G(rx, ry); }
    let ph = P.ph; if (P.ramp){ const u = (e - 0.3)/0.6; ph *= u < 0 ? 0 : u > 1 ? 1 : u; }
    const phl = ph*PFL[i], phr = ph*PFR[i];
    const block = P.block || e < P.blockE;
    const zbl = block ? gl - 0.4 : Math.max(gl - 0.4, zl - P.th), zbr = block ? gr - 0.4 : Math.max(gr - 0.4, zr - P.th);
    const cc = (P.plant && e > 2) ? C_PLANT : P.capCol, sc = block ? P.blockCol : P.sideCol;
    const b = B.n;
    B.vn(lx, ly, zbl, sc, mx, 0, -my); B.vn(lx, ly, zl + phl, sc, mx, 0, -my);
    B.vn(lx, ly, zl + phl, cc, 0, 1, 0); B.vn(lix, liy, zl + phl, cc, 0, 1, 0);
    B.vn(lix, liy, zl + phl, P.inCol, -mx, 0, my); B.vn(lix, liy, zl, P.inCol, -mx, 0, my);
    B.vn(rx, ry, zbr, sc, -mx, 0, my); B.vn(rx, ry, zr + phr, sc, -mx, 0, my);
    B.vn(rx, ry, zr + phr, cc, 0, 1, 0); B.vn(rix, riy, zr + phr, cc, 0, 1, 0);
    B.vn(rix, riy, zr + phr, P.inCol, mx, 0, -my); B.vn(rix, riy, zr, P.inCol, mx, 0, -my);
    B.vn(lx, ly, zbl, C_UNDER, 0, -1, 0); B.vn(rx, ry, zbr, C_UNDER, 0, -1, 0);
    if (P.top){ B.vn(lix, liy, zl - 0.03, C_CONC, 0, 1, 0); B.vn(rix, riy, zr - 0.03, C_CONC, 0, 1, 0); }
    DS.zl = zl; DS.zr = zr; DS.zbl = zbl; DS.zbr = zbr; DS.ph = ph; DS.lx = lx; DS.ly = ly; DS.rx = rx; DS.ry = ry; DS.under = !block && zl - P.th > gl + 0.2 && zr - P.th > gr + 0.2;
    return b;
  }
  const DS = {}; let PFL = new Uint8Array(256), PFR = new Uint8Array(256), PKL = new Uint8Array(256), PKR = new Uint8Array(256);
  // roadDrive: per piece (and station) and side, is there a parapet? Not where the deck edge lies on another deck at about the same
  // level (+-2 m: merges, diverges, decks side by side, and decks the data puts through each other): a parapet (and the side wall
  // above the deck) stood across the other road's lanes there.
  // PKL / PKR: the piece after station k has its parapet; PFL / PFR: the station's parapet height factor (1 only between two pieces
  // that have one: a parapet tapers off along its last piece instead of jutting into the other deck)
  function parapetFlags(li, hw, P){
    if (PFL.length < NS){ PFL = new Uint8Array(NS*2); PFR = new Uint8Array(NS*2); PKL = new Uint8Array(NS*2); PKR = new Uint8Array(NS*2); }
    const rg = roadGrid(X.C), w = hw - 0.25, on = !P.same || P.block;
    const ins = (i, f, sd) => { const k = f > 0 ? i : i, x = SX[i] + (SX[i+1] - SX[i])*f, y = SY[i] + (SY[i+1] - SY[i])*f, e = SE[i] + (SE[i+1] - SE[i])*f, nx = -DYa[k]*sd, ny = DXa[k]*sd;
      return onRoadAt(rg, li, x + nx*w, y + ny*w, -0.3, e, 2.0); };
    for (let k = 0; k < NS - 1; k++){
      PKL[k] = PKR[k] = 1;
      if (on || (SE[k] < 0.3 && SE[k+1] < 0.3)) continue;
      const ns = Math.max(2, Math.min(6, Math.ceil((SS[k+1] - SS[k])/3.5))), hl = (SS[k+1] - SS[k])*0.5;
      // quick reject: no other road at about this level within reach of the piece's edges
      if (!onRoadAt(rg, li, (SX[k] + SX[k+1])*0.5, (SY[k] + SY[k+1])*0.5, w + hl + 0.2, (SE[k] + SE[k+1])*0.5, 2.0 + Math.abs(SE[k+1] - SE[k])*0.5 + 0.05)) continue;
      for (const sd of [1, -1]){ let hit = false; for (let q = 0; q < ns && !hit; q++) hit = ins(k, (q + 0.5)/ns, sd); if (hit){ if (sd > 0) PKL[k] = 0; else PKR[k] = 0; } }
    }
    for (let i = 0; i < NS; i++){ const p = i > 0 ? i - 1 : 0, q = i < NS - 1 ? i : NS - 2; PFL[i] = PKL[p] && PKL[q] ? 1 : 0; PFR[i] = PKR[p] && PKR[q] ? 1 : 0; }
  }
  function deckFaces(B, a, b, P, under, parL, parR){
    B.t(a, a+1, b+1); B.t(a, b+1, b);                                   // left outer wall
    B.t(a+6, b+6, b+7); B.t(a+6, b+7, a+7);                             // right outer wall
    if (parL){
      B.t(a+3, b+3, b+2); B.t(a+3, b+2, a+2);                           // left parapet cap
      B.t(a+5, b+5, b+4); B.t(a+5, b+4, a+4);                           // left inner face
    }
    if (parR){
      B.t(a+8, b+8, b+9); B.t(a+8, b+9, a+9);                           // right cap
      B.t(a+11, a+10, b+10); B.t(a+11, b+10, b+11);                     // right inner face
    }
    if (under){ B.t(a+13, b+12, b+13); B.t(a+13, a+12, b+12); }
    if (P.top){ B.t(a+15, b+15, b+14); B.t(a+15, b+14, a+14); }
  }
  function endFace(B, i, start, zl, zr, zbl, zbr, lx, ly, rx, ry, col){
    const k = start ? Math.min(i, NS - 2) : Math.max(i - 1, 0), dx = DXa[k], dy = DYa[k];
    const s = start ? -1 : 1, lb = B.vn(lx, ly, zbl, col, s*dx, 0, -s*dy), lt = B.vn(lx, ly, zl, col, s*dx, 0, -s*dy), rt = B.vn(rx, ry, zr, col, s*dx, 0, -s*dy), rb = B.vn(rx, ry, zbr, col, s*dx, 0, -s*dy);
    if (start){ B.t(lb, rt, lt); B.t(lb, rb, rt); } else { B.t(lb, lt, rt); B.t(lb, rt, rb); }
    return k;
  }
  // box strip (canopy roof, monorail beam): half width hb, from zc+z0 to zc+z1 along stations
  function boxSet(B, i, hb, z0, z1, col){
    const x = SX[i], y = SY[i], mx = MXa[i], my = MYa[i], ox = mx*SCa[i]*hb, oy = my*SCa[i]*hb, zc = SZ[i], lx = x + ox, ly = y + oy, rx = x - ox, ry = y - oy, b = B.n;
    B.vn(lx, ly, zc + z1, col, 0, 1, 0); B.vn(rx, ry, zc + z1, col, 0, 1, 0);
    B.vn(lx, ly, zc + z1, col, mx, 0, -my); B.vn(lx, ly, zc + z0, col, mx, 0, -my);
    B.vn(rx, ry, zc + z1, col, -mx, 0, my); B.vn(rx, ry, zc + z0, col, -mx, 0, my);
    B.vn(lx, ly, zc + z0, C_UNDER, 0, -1, 0); B.vn(rx, ry, zc + z0, C_UNDER, 0, -1, 0);
    return b;
  }
  function boxFaces(B, a, b){
    B.t(a+1, b+1, b); B.t(a+1, b, a);
    B.t(a+3, a+2, b+2); B.t(a+3, b+2, b+3);
    B.t(a+5, b+5, b+4); B.t(a+5, b+4, a+4);
    B.t(a+7, b+6, b+7); B.t(a+7, a+6, b+6);
  }
  // roadDrive: a tunnel portal only where the road stays at grade over the last 70 m (a ramp whose foot is a dead end in the data got
  // a tunnel portal and wing walls standing along the ramp)
  function atGradeEnd(end){
    const Lt = SS[NS-1]; for (let i = 0; i < NS; i++){ const d = end ? Lt - SS[i] : SS[i]; if (d <= 70 && SE[i] > 0.6) return false; }
    // nor where another road carries on just beyond the end (a gap in the data, not a tunnel)
    const i = end ? NS - 1 : 0, k = end ? NS - 2 : 0, sg = end ? 1 : -1, ux = DXa[k]*sg, uy = DYa[k]*sg, rg = roadGrid(X.C), li = CUR.li;
    for (const d of [4, 9, 16]) for (const o of [0, -HW*0.6, HW*0.6]){ if (onRoadAt(rg, li, SX[i] + ux*d - uy*o, SY[i] + uy*d + ux*o, 0, 0)) return false; }
    // nor under a viaduct (the portal and its wing walls stood through the deck)
    for (const d of [-60, -40, -20, 0, 5]) for (const o of [-HW - 1, HW + 1]){ if (deckOver(rg, li, SX[i] + ux*d - uy*o, SY[i] + uy*d + ux*o, 1.2, 12)) return false; }
    return true;
  }
  // [lm24/roadfix] the portal's side walls and tunnel box (to 9 m ahead) must not stand on another road
  function mouthClear(end){
    const i = end ? NS - 1 : 0, k = end ? NS - 2 : 0, sg = end ? 1 : -1, ux = DXa[k]*sg, uy = DYa[k]*sg, rg = roadGrid(X.C), li = CUR.li, e = SE[i];
    for (const d of [-3, 0.9, 5, 9]) for (const o of [HW + 0.4, HW + 1.1, HW + 1.8]) for (const s2 of [-1, 1]){ if (onRoadAt(rg, li, SX[i] + ux*d - uy*o*s2, SY[i] + uy*d + ux*o*s2, 0.3, e)) return false; }
    return true;
  }
  // [lm24/roadfix] the wing walls' length: <= 62 m, 8 m short of the line's other end, 3 m short of another road beside the approach
  function wingLen(end){
    const Lt = SS[NS-1], rg = roadGrid(X.C), li = CUR.li; let L = Math.min(62, Lt - 8);
    for (let j = 0; j < NS; j++){
      const ii = end ? NS - 1 - j : j, dd = end ? Lt - SS[ii] : SS[ii]; if (dd > L) break;
      const kk = ii < NS - 1 ? ii : NS - 2, o = HW + 0.5;
      for (const s2 of [-1, 1]) if (onRoadAt(rg, li, SX[ii] - DYa[kk]*s2*o, SY[ii] + DXa[kk]*s2*o, 0.2, SE[ii])){ return Math.max(0, dd - 3); }
    }
    return L;
  }
  function deadEnd(li, L, k){
    const C = X.C, nd = nodeAt(C, L.P[k*2], L.P[k*2+1]); if (nd < 0) return true;
    for (let j = C.nodeOff[nd]; j < C.nodeOff[nd+1]; j++) if (C.incL[j] !== li) return false;
    return true;
  }
  function structures(c, hw, wd, foreign, L, li, JN){
    const side = c === 12 && sidewalk(L), foot = c === 12 && !side, g = c === 17 ? 1 : 0;
    const P = side ? {sw:1.45, pt:0.12, ph:1.1, ramp:false, th:0.5, block:false, blockE:1.2, capCol:C_RAILG, sideCol:C_CONC, inCol:C_RAILG, blockCol:C_BLOCK, plant:false, top:true, same:false}
      : foot ? {sw:1.75, pt:0.12, ph:1.15, ramp:false, th:0.6, block:false, blockE:2.5, capCol:C_RAILG, sideCol:C_CONC, inCol:C_RAILG, blockCol:C_BLOCK, plant:false, top:true, same:false}
      : c === 17 ? {sw:hw, pt:0.12, ph:1.0, ramp:false, th:9, block:true, blockE:0, capCol:C_WOOD, sideCol:C_WOOD, inCol:C_WOOD, blockCol:rgb('#b5aa98'), plant:false, top:false, same:true}
      : {sw:hw, pt:0.35, ph:1.0, ramp:true, th:wd >= 9 ? 1.8 : 1.4, block:false, blockE:0, capCol:C_CONC, sideCol:C_SIDE, inCol:C_CONC, blockCol:C_SIDE, plant:c <= 3 && !foreign && !US, top:false, same:true};
    parapetFlags(li, hw, P);
    if (X.ob){ structObs(c, hw, P, JN, side, foot); return; }
    // deck sweep over runs of elevated segments (only under the drawn ribbon)
    let B = null, a = -1, aUnder = false, runStart = true;
    for (let k = 0; k < NS - 1; k++){
      const el = (SE[k] > 0.3 || SE[k+1] > 0.3) && RBa[k], t = el ? tileAtS((SS[k] + SS[k+1])*0.5) : -1;
      if (t < 0){
        B = null; runStart = true; continue;
      }
      const nb = bStruct(t, g);
      if (nb !== B){
        B = nb; a = deckSet(B, k, P); aUnder = DS.under;
        if (runStart && k === 0 && SE[0] > 0.6 && deadEnd(li, L, 0)) endFace(B, k, true, DS.zl, DS.zr, DS.zbl, DS.zbr, DS.lx, DS.ly, DS.rx, DS.ry, P.sideCol);
      }
      runStart = false;
      const b = deckSet(B, k + 1, P), bUnder = DS.under, par = P.ph > 0 && (!P.ramp || SE[k] > 0.35 || SE[k+1] > 0.35);
      const sm = (SS[k] + SS[k+1])*0.5, gL = JN && inGap(JN.sideGap[0], sm), gR = JN && inGap(JN.sideGap[1], sm);
      deckFaces(B, a, b, P, aUnder && bUnder, par && !gL && PKL[k] > 0, par && !gR && PKR[k] > 0);
      a = b; aUnder = bUnder;
      if (k === NS - 2 && SE[k+1] > 0.6 && deadEnd(li, L, (L.P.length >> 1) - 1)) endFace(B, k + 1, false, DS.zl, DS.zr, DS.zbl, DS.zbr, DS.lx, DS.ly, DS.rx, DS.ry, P.sideCol);
    }
    const pg = roadGrid(X.C), Lt = SS[NS-1];
    if (foot){
      // roof canopy over short high runs (overhead bridges), slim posts, single columns
      if (CANO.length < NS) CANO = new Uint8Array(NS*2);
      for (let k = 0; k < NS - 1;){
        if (!(SE[k] >= 3 && SE[k+1] >= 3)){ CANO[k++] = 0; continue; }
        let j = k; while (j < NS - 1 && SE[j] >= 3 && SE[j+1] >= 3) j++;
        const on = SS[j] - SS[k] <= 110 ? 1 : 0; for (let q = k; q < j; q++) CANO[q] = on; k = j;
      }
      B = null; a = -1;
      for (let k = 0; k < NS - 1; k++){
        const t = CANO[k] ? tileAtS((SS[k] + SS[k+1])*0.5) : -1;
        if (t < 0){ B = null; continue; }
        const nb = bStruct(t, 0); if (nb !== B){ B = nb; a = boxSet(B, k, 2.05, 3.0, 3.28, C_ROOF); }
        const b = boxSet(B, k + 1, 2.05, 3.0, 3.28, C_ROOF); boxFaces(B, a, b); a = b;
      }
      for (let s = 2; s < Lt - 2; s += 8){
        const k = segAt(s); if (!CANO[k] || interp(SE, s) < 3) continue; const t = tileAtS(s); if (t < 0) continue;
        const x = interp(SX, s), y = interp(SY, s), z = interp(SZ, s), dx = DXa[k], dy = DYa[k], Bs = bStruct(t, 0);
        for (const sg of [-1, 1]) boxV(Bs, x - dy*sg*1.6, y + dx*sg*1.6, dx, dy, 0.09, 0.09, z, z + 3.02, C_POST, false, false);
      }
      piers(pg, 20, 3.2, (Bs, x, y, z, dx, dy, gz) => boxV(Bs, x, y, dx, dy, 0.4, 0.4, gz, z - 0.6, C_PIER, false, false), 0.6);
    } else if (c !== 17 && !side){
      const wide = wd >= 9.5, big = (s) => interp(SE, s) > 14;
      piers(pg, 35, 3.0, (Bs, x, y, z, dx, dy, gz, s) => {
        const th = P.th, zb = z - th, vx = -dy, vy = dx, cr = big(s) ? 1.25 : 0.8;
        if (wide){
          boxV(Bs, x, y, dx, dy, 0.9, hw*0.82, zb - 1.3, zb, C_PIER, false, true);
          for (const sg of [-1, 1]){ const px = x + vx*sg*hw*0.5, py = y + vy*sg*hw*0.5; boxV(Bs, px, py, dx, dy, cr, cr, Math.min(gz, G(px, py) - 0.5), zb - 1.3, C_PIER, false, false); }
        } else {
          boxV(Bs, x, y, dx, dy, 0.8, hw*0.78, zb - 1.1, zb, C_PIER, false, true);
          boxV(Bs, x, y, dx, dy, cr, cr*1.25, gz, zb - 1.1, C_PIER, false, false);
        }
      }, wide ? hw*0.5 + 1 : 1.2);
    }
  }
  // ---------------------------------------------------------------- roadDrive: solid obstacles for the surface index (what a car hits)
  // records (10 floats): [type, x0, y0, x1, y1, r, z0, z1, a, b]; type 0: capsule (x0, y0)-(x1, y1) of radius r (walls, parapets, poles:
  // x1 = x0), type 1: box centred at (x0, y0), unit axis (x1, y1), half sizes a (along), b (across); solid from z0 to z1
  function obRec(t, x0, y0, x1, y1, r, z0, z1, a, b){
    const O = X.ob; if (O.n*10 + 10 > O.d.length){ const T = new Float32Array(O.d.length*2); T.set(O.d); O.d = T; }
    const o = O.n*10, d = O.d; d[o] = t; d[o+1] = x0; d[o+2] = y0; d[o+3] = x1; d[o+4] = y1; d[o+5] = r; d[o+6] = z0; d[o+7] = z1; d[o+8] = t ? a : CUR.li; d[o+9] = b || 0; O.n++;
  }
  // the parapets of a deck (as drawn by structures(): the outer 0.35 m of the ribbon, 1 m high, scaled down on the ramps) and its piers
  function structObs(c, hw, P, JN, side, foot){
    if (!side && !foot && c !== 17){
      const pr = P.pt*0.5, wc = P.sw - pr;
      const ptAt = (i, sd) => { const ox = MXa[i]*SCa[i], oy = MYa[i]*SCa[i], e = SE[i]; let ph = P.ph; if (P.ramp){ const u = (e - 0.3)/0.6; ph *= u < 0 ? 0 : u > 1 ? 1 : u; }
        const zl = sd > 0 ? (LZI[i] + LZO[i])*0.5 : (RZI[i] + RZO[i])*0.5, gl = sd > 0 ? GLa[i] : GRa[i], f = sd > 0 ? PFL[i] : PFR[i];
        return [SX[i] + ox*wc*sd, SY[i] + oy*wc*sd, Math.max(gl - 0.4, zl - P.th), zl + ph*f, ph*f]; };
      for (let k = 0; k < NS - 1; k++){
        if (!((SE[k] > 0.3 || SE[k+1] > 0.3) && RBa[k]) || tileAtS((SS[k] + SS[k+1])*0.5) < 0) continue;
        if (!(P.ph > 0 && (!P.ramp || SE[k] > 0.35 || SE[k+1] > 0.35))) continue;
        const sm = (SS[k] + SS[k+1])*0.5;
        for (const sd of [1, -1]){
          if ((JN && inGap(JN.sideGap[sd > 0 ? 0 : 1], sm)) || !(sd > 0 ? PKL[k] : PKR[k])) continue;
          const a = ptAt(k, sd), b = ptAt(k + 1, sd), ha = a[4], hb = b[4]; if (ha < 0.4 && hb < 0.4) continue;
          // the part of the piece where the parapet is at least 0.4 m high (it tapers between stations)
          let f0 = 0, f1 = 1; if (ha < 0.4) f0 = (0.4 - ha)/(hb - ha); if (hb < 0.4) f1 = (ha - 0.4)/(ha - hb);
          // another road just below the deck edge (data with decks too close in height: the lower road's cars would run into the
          // deck's side wall): only the parapet above the deck surface is solid there, so the lower road stays drivable
          let z0 = Math.min(a[2], b[2]);
          if (lowUnder(k, sd, P.th)) z0 = Math.min(a[3] - a[4], b[3] - b[4]) - 0.3;
          obRec(0, a[0] + (b[0] - a[0])*f0, a[1] + (b[1] - a[1])*f0, a[0] + (b[0] - a[0])*f1, a[1] + (b[1] - a[1])*f1, pr, z0, Math.max(a[3], b[3]));
        }
      }
    }
    const pg = roadGrid(X.C);
    if (foot) piers(pg, 20, 3.2, (Bs, x, y, z, dx, dy, gz) => boxV(null, x, y, dx, dy, 0.4, 0.4, gz, z - 0.6), 0.6);
    else if (c !== 17 && !side){
      const wd = hw*2, wide = wd >= 9.5, big = s => interp(SE, s) > 14;
      piers(pg, 35, 3.0, (Bs, x, y, z, dx, dy, gz, s) => {
        const zb = z - P.th, vx = -dy, vy = dx, cr = big(s) ? 1.25 : 0.8;
        if (wide){ boxV(null, x, y, dx, dy, 0.9, hw*0.82, zb - 1.3, zb); for (const sg of [-1, 1]){ const px = x + vx*sg*hw*0.5, py = y + vy*sg*hw*0.5; boxV(null, px, py, dx, dy, cr, cr, Math.min(gz, G(px, py) - 0.5), zb - 1.3); } }
        else { boxV(null, x, y, dx, dy, 0.8, hw*0.78, zb - 1.1, zb); boxV(null, x, y, dx, dy, cr, cr*1.25, gz, zb - 1.1); }
      }, wide ? hw*0.5 + 1 : 1.2);
    }
  }
  // is there another road under the side sd edge of piece k whose surface lies 0.3 .. th + 1.3 m below the deck surface (a car on it
  // would reach into the deck's side wall)? Sampled at the piece's middle and ends, 1 m inside / outside the edge
  function lowUnder(k, sd, th){
    const rg = roadGrid(X.C), li = CUR.li, nx = -DYa[k]*sd, ny = DXa[k]*sd, w = HW;
    for (const f of [0.1, 0.5, 0.9]){ const x = SX[k] + (SX[k+1] - SX[k])*f, y = SY[k] + (SY[k+1] - SY[k])*f, e = SE[k] + (SE[k+1] - SE[k])*f;
      for (const o of [w - 1, w + 1]) if (onRoadAt(rg, li, x + nx*o, y + ny*o, 0.5, e - (th + 1.6)*0.5, (th + 1.0)*0.5)) return true; }
    return false;
  }
  // is the outside of outline edge i -> j (counter-clockwise outline: outside on the right) another road's deck at elevation ee?
  function outsideDeck(OX, OY, ENX, ENY, i, j, ee){
    const dx = OX[j] - OX[i], dy = OY[j] - OY[i], l = Math.sqrt(dx*dx + dy*dy) || 1, nx = ENX ? ENX[i] : dy/l, ny = ENY ? ENY[i] : -dx/l, rg = roadGrid(X.C);
    for (const f of [0.25, 0.5, 0.75]){ const mx = OX[i] + dx*f + nx*0.6, my = OY[i] + dy*f + ny*0.6; if (onRoadAt(rg, -1, mx, my, -0.2, ee)) return true; }
    return false;
  }
  // parapets along the kerb edges of an elevated junction surface (outlineWalls: outside the outline, 0.35 m thick, 1 m high)
  function outlineObs(OX, OY, OZ, KB, th, ee){
    const n = OX.length; if (n < 3) return;
    for (let i = 0; i < n; i++){
      if (KB[i] !== 1) continue;
      const j = (i + 1) % n, dx = OX[j] - OX[i], dy = OY[j] - OY[i], l = Math.sqrt(dx*dx + dy*dy); if (l < 0.05) continue;
      if (outsideDeck(OX, OY, null, null, i, j, ee)) continue;
      const nx = dy/l*0.175, ny = -dx/l*0.175;
      obRec(0, OX[i] + nx, OY[i] + ny, OX[j] + nx, OY[j] + ny, 0.175, Math.min(OZ[i], OZ[j]) - th, Math.max(OZ[i], OZ[j]) + 1.0);
    }
  }
  // a tunnel portal (portal()): the side walls, the tunnel walls, its dark far end, the wing walls of the cutting
  function portalObs(end, hw, c){
    const i = end ? NS - 1 : 0, k = end ? NS - 2 : 0, sg = end ? 1 : -1, ux = DXa[k]*sg, uy = DYa[k]*sg, nx = -uy, ny = ux;
    const x = SX[i], y = SY[i], z = Math.min(LZI[i], RZI[i]) - 0.02; if (tileAtS(SS[i]) < 0) return;
    const W = hw + 0.4, H = c <= 3 ? 6.4 : 5.6, d1 = 9;
    for (const s2 of [-1, 1]) boxV(null, x + ux*0.9 + nx*s2*(W + 0.7), y + uy*0.9 + ny*s2*(W + 0.7), ux, uy, 0.9, 0.7, z - 0.4, z + H);
    const L1x = x + ux*d1 + nx*W, L1y = y + uy*d1 + ny*W, R1x = x + ux*d1 - nx*W, R1y = y + uy*d1 - ny*W;
    obRec(0, x + nx*(W + 0.1), y + ny*(W + 0.1), L1x + nx*0.1, L1y + ny*0.1, 0.1, z - 0.4, z + H);
    obRec(0, x - nx*(W + 0.1), y - ny*(W + 0.1), R1x - nx*0.1, R1y - ny*0.1, 0.1, z - 0.4, z + H);
    obRec(0, L1x + ux*0.1, L1y + uy*0.1, R1x + ux*0.1, R1y + uy*0.1, 0.1, z - 0.4, z + H);
    const Lt = SS[NS-1];
    const WL = wingLen(end);
    for (let s2 = -1; s2 <= 1; s2 += 2){
      let prev = null;
      for (let j = 0; j < NS; j++){
        const ii = end ? NS - 1 - j : j, dd = end ? Lt - SS[ii] : SS[ii]; if (dd > WL) break;
        const kk = ii < NS - 1 ? ii : NS - 2, o = hw + 0.5, ex = SX[ii] - DYa[kk]*s2*o, ey = SY[ii] + DXa[kk]*s2*o, ez = (s2 > 0 ? LZI[ii] : RZI[ii]) - 0.05, wh = 0.7 + (H + 1.6)*Math.pow(1 - dd/62, 1.4);
        if (prev) obRec(0, prev[0], prev[1], ex, ey, 0.15, Math.min(prev[2], ez) - 0.3, Math.max(prev[3], ez + wh));
        prev = [ex, ey, ez, ez + wh];
      }
    }
  }
  // monorail piers (monorail(): every 25 m, 1 m square, from the ground to 2.2 m under the beam)
  function monorailObs(li, L){
    const g = lineGeom(li); densify(g, [], 0); if (NS < 2 || SS[NS-1] < 0.3 || !chunks()) return;
    for (let i = 0; i < NS; i++) if (SE[i] < 8) SE[i] = 8;
    frames(0.5, 0); const Lt = SS[NS-1];
    for (let s = 12; s < Lt - 4; s += 25){ if (tileAtS(s) < 0) continue; const k = segAt(s), x = interp(SX, s), y = interp(SY, s), z = interp(SZ, s), gz = G(x, y);
      boxV(null, x, y, DXa[k], DYa[k], 0.5, 0.5, gz <= -0.29 ? -1.6 : gz - 0.4, z - 1.5); }
  }
  // the high masts in expressway gore infields (junctionMarks())
  function mastObs(r){
    for (const P of r.P || []){
      if (P.kind !== 'gore' || !P.X) continue;
      const A = r.A[P.i], Bm = r.A[P.j]; if (A.foreign || Bm.foreign || !(A.c <= 1 || Bm.c <= 1) || r.e >= 0.5) continue;
      const xa = P.X[0], xb = P.X[1], na = P.bA, nb = P.aB; if (na - xa < 2 || nb - xb < 2) continue;
      const q1 = edgeAt(A, A.lx, A.ly, Math.min(A.Dm, na + 16)), q2 = edgeAt(Bm, Bm.rx, Bm.ry, Math.min(Bm.Dm, nb + 16)), mx = (q1[0] + q2[0])*0.5, my = (q1[1] + q2[1])*0.5;
      if (hyp(q1[0] - q2[0], q1[1] - q2[1]) > 6 && pierFree(roadGrid(X.C), mx, my, 1.2)){ const z = G(mx, my); obRec(0, mx, my, mx, my, 0.35, z - 0.3, z + 26); }
    }
  }
  // US freeways: the concrete median barrier (fwyMedian(): narrow medians, from the inside shoulder to the median centre, 0.81 m high)
  function fwyMedianObs(li, hw){
    if (MPL < 0) return;
    for (let k = 0; k < NS - 1; k++){
      if (!(RBa[k] && SE[k] < 0.3 && SE[k+1] < 0.3 && MHa[k] >= 0 && MHa[k+1] >= 0 && (MHa[k] <= 5 || MHa[k+1] <= 5)) || tileAtS((SS[k] + SS[k+1])*0.5) < 0) continue;
      const p = i => { const sc = SCa[i] > 1.6 ? 1.6 : SCa[i], mh = Math.max(0.35, Math.min(5, MHa[i])), o = Math.max(0, mh - 0.3) + 0.2; return [LXI[i] + MXa[i]*sc*o, LYI[i] + MYa[i]*sc*o, LZI[i]]; };
      const a = p(k), b = p(k + 1); obRec(0, a[0], a[1], b[0], b[1], 0.2, Math.min(a[2], b[2]) - 0.2, Math.max(a[2], b[2]) + 0.81);
    }
  }
  // v22: the app can veto piers and lamp poles (under a landmark bridge model that brings its own): STRUCTSKIP(x, y) -> true
  let STRUCTSKIP = null;
  function piers(pg, step, emin, fn, rad){
    const Lt = SS[NS-1];
    for (let s0 = step*0.5; s0 < Lt; s0 += step){
      if (interp(SE, s0) < emin) continue;
      let s = -1;
      for (const sh of [0, 4, -4, 8, -8, 12, -12]){
        const q = s0 + sh; if (q < 2 || q > Lt - 2 || interp(SE, q) < emin) continue;
        const k = segAt(q), x = interp(SX, q), y = interp(SY, q), vx = -DYa[k], vy = DXa[k];
        const em = interp(SE, q) - 2.0, li = CUR.li;
        const ok = rad > 2 ? pierFree(pg, x + vx*(rad - 1), y + vy*(rad - 1), 1.3, em, li) && pierFree(pg, x - vx*(rad - 1), y - vy*(rad - 1), 1.3, em, li) : pierFree(pg, x, y, rad, em, li);
        if (ok){ s = q; break; }
      }
      if (s < 0) continue;
      const t = tileAtS(s); if (t < 0) continue;
      const k = segAt(s), x = interp(SX, s), y = interp(SY, s), gc = G(x, y);
      if (STRUCTSKIP && STRUCTSKIP(x, y)) continue;
      fn(X.ob ? null : bStruct(t, 0), x, y, interp(SZ, s), DXa[k], DYa[k], gc <= -0.29 ? -1.6 : gc - 0.5, s);
      if (RECD && !X.ob) RECD.piers.push({x, y, z:interp(SZ, s), e:interp(SE, s), dx:DXa[k], dy:DYa[k], gz:gc <= -0.29 ? -1.6 : gc - 0.5, rad, hw:HW, c:CUR.c, li:CUR.li, step});
      X.st.piers++;
    }
  }
  function monorail(li, L){
    const g = lineGeom(li);
    densify(g, [], 0);
    if (NS < 2 || SS[NS-1] < 0.3 || !chunks()) return;
    for (let i = 0; i < NS; i++) if (SE[i] < 8) SE[i] = 8;            // the guideway stays up (8 m where the data has no height)
    HW = 0.5; OFFc = 0; frames(0.5, 0); X.st.lines++;
    let B = null, a = -1;
    for (let k = 0; k < NS - 1; k++){
      const t = tileAtS((SS[k] + SS[k+1])*0.5); if (t < 0){ B = null; continue; }
      const nb = bStruct(t, 0); if (nb !== B){ B = nb; a = boxSet(B, k, 0.5, -1.5, 0, C_CONC); }
      const b = boxSet(B, k + 1, 0.5, -1.5, 0, C_CONC); boxFaces(B, a, b); a = b;
    }
    const Lt = SS[NS-1];
    for (let s = 12; s < Lt - 4; s += 25){
      const t = tileAtS(s); if (t < 0) continue;
      const k = segAt(s), x = interp(SX, s), y = interp(SY, s), z = interp(SZ, s), Bs = bStruct(t, 0), gz = G(x, y);
      boxV(Bs, x, y, DXa[k], DYa[k], 0.55, 1.4, z - 2.2, z - 1.5, C_PIER, false, true);
      boxV(Bs, x, y, DXa[k], DYa[k], 0.5, 0.5, gz <= -0.29 ? -1.6 : gz - 0.4, z - 2.2, C_PIER, false, false);
    }
  }

  // ---------------------------------------------------------------- dual carriageways: the median to the other carriageway (per station)
  let MPL = -1;
  function medians(li, c, hw, ow, link){
    MPL = -1; let any = false;
    for (let i = 0; i < NS; i++) MHa[i] = -1;
    if (!ow || link || c > 8) return false;
    const rg = roadGrid(X.C), cnt = new Map();
    let last = -1e9;
    for (let i = 0; i < NS; i++){
      if (SE[i] > 0.3 || (SS[i] - last < 12 && i < NS - 1)) continue;
      last = SS[i];
      const k = i < NS - 1 ? i : NS - 2, p = partnerAt(rg, li, SX[i], SY[i], DXa[k], DYa[k], hw, c);
      if (p){ MHa[i] = Math.max(0, (p.d - hw - p.hw2)*0.5); cnt.set(p.li, (cnt.get(p.li) || 0) + 1); any = true; } else MHa[i] = -2;
    }
    // stations between samples: interpolate between sampled neighbours (-2: sampled, no partner)
    for (let i = 0, pv = -1; i < NS; i++){
      if (MHa[i] !== -1){ pv = i; continue; }
      let nx = i + 1; while (nx < NS && MHa[nx] === -1) nx++;
      if (pv >= 0 && nx < NS && MHa[pv] >= 0 && MHa[nx] >= 0){ for (let q = i; q < nx; q++) MHa[q] = MHa[pv] + (MHa[nx] - MHa[pv])*(SS[q] - SS[pv])/((SS[nx] - SS[pv]) || 1); }
      i = nx - 1;
    }
    for (let i = 0; i < NS; i++){ if (MHa[i] < 0) MHa[i] = -1; else if (MHa[i] < 0.35) MHa[i] = -3; }
    if (!any) return false;
    let best = 0; for (const [l, n] of cnt) if (n > best){ best = n; MPL = l; }
    // close short holes (a junction, a crossing piece) so the median runs on
    for (let i = 1; i < NS - 1; i++) if (MHa[i] < 0){ let j = i; while (j < NS && MHa[j] < 0) j++; if (j < NS && SS[j] - SS[i-1] < 45){ for (let q = i; q < j; q++) MHa[q] = MHa[i-1] + (MHa[j] - MHa[i-1])*(SS[q] - SS[i-1])/((SS[j] - SS[i-1]) || 1); } i = j; }
    return true;
  }
  // ---------------------------------------------------------------- kerbs, footways, verges and planted medians (minor surfaces: near views only)
  const KH = 0.15;
  function sideworks(c, hw, ow, li, L, JN, part){
    const foreign = (L.flags & 8) !== 0; if (foreign || !SWC(c) || (L.flags & 16)) return;
    if (part === undefined) part = 3;
    const fw = c <= 4 ? 3.8 : c <= 6 ? 3.2 : c <= 8 ? 2.6 : 2.0, verge = 0;
    CUR.k = 2;
    for (let side = 1; side >= -1; side -= 2){
      if (side === RINGSIDE) continue;                                   // the inside of a ring road is its island
      const sd = side > 0 ? 0 : 1, med = (US ? side > 0 : side < 0) && ow;
      if (!(part & 2) && (!med || MPL < 0)) continue;                    // main pass: only planted medians
      fwBlock(li, side, med ? 0.6 : fw);
      let B = null, prev = -1;
      for (let k = 0; k < NS - 1; k++){
        const sm = (SS[k] + SS[k+1])*0.5;
        let ok = RBa[k] && !FWB[k] && SE[k] < 0.3 && SE[k+1] < 0.3 && !(JN && inGap(JN.sideGap[sd], sm)) && !(med && (MHa[k] === -3 || MHa[k+1] === -3));
        const t = ok ? tileAtS(sm) : -1;
        if (t < 0){ B = null; continue; }
        const isMed = med && (MHa[k] >= 0 || MHa[k+1] >= 0);
        if (!(part & (isMed ? 1 : 2))){ B = null; continue; }
        const nb = bSurf(t, isMed ? 1 : 2);
        CUR.dx = DXa[k]; CUR.dy = DYa[k];
        if (nb !== B || prev !== k || isMed !== pMed){ B = nb; ROW0 = sideRow(B, k, side, 1, fw, verge, isMed, k); pMed = isMed; }
        // merge with the next piece when it continues straight and even (fewer rows on long straight kerbs)
        let e = k + 1;
        while (e < NS - 1 && !SFa[e] && !BVa[e] && RBa[e] && !FWB[e] && SE[e+1] < 0.3 && SS[e+1] - SS[k] < 40 && tileAtS((SS[e] + SS[e+1])*0.5) === t && (med && (MHa[e] >= 0 || MHa[e+1] >= 0)) === isMed && !(med && (MHa[e] === -3 || MHa[e+1] === -3))
          && !(JN && inGap(JN.sideGap[sd], (SS[e] + SS[e+1])*0.5)) && Math.abs(DXa[e]*DYa[k] - DYa[e]*DXa[k]) < 0.012 && Math.abs((side > 0 ? LZI : RZI)[e] - ((side > 0 ? LZO : RZO)[k] + ((side > 0 ? LZI : RZI)[e+1] - (side > 0 ? LZO : RZO)[k])*(SS[e] - SS[k])/((SS[e+1] - SS[k]) || 1))) < 0.025) e++;
        const r1 = sideRow(B, e, side, 0, fw, verge, isMed, e - 1);
        sideFaces(B, ROW0, r1, side, isMed, verge);
        ROW0 = r1; prev = e; k = e - 1;
      }
    }
    CUR.k = 0;
  }
  let ROW0 = 0, pMed = false, RINGSIDE = 0, FWB = new Uint8Array(256), SWJ = null;
  // US freeways: the median to the other carriageway (on the left) — a paved inside shoulder and half of a concrete median barrier
  // (narrow medians), or a shoulder and a strip of dry verge (wide ones); each carriageway draws its half (main pass)
  function fwyMedian(li, hw){
    if (MPL < 0) return;
    let B = null, prev = -1, r0 = 0;
    for (let k = 0; k < NS - 1; k++){
      const ok = RBa[k] && SE[k] < 0.3 && SE[k+1] < 0.3 && MHa[k] >= 0 && MHa[k+1] >= 0, t = ok ? tileAtS((SS[k] + SS[k+1])*0.5) : -1;
      if (t < 0){ B = null; continue; }
      const nb = bSurf(t, 1);
      if (nb !== B || prev !== k){ B = nb; r0 = medRow(B, k, 1); }
      const r1 = medRow(B, k + 1, 0), q = (p0, p1, p2, p3) => { B.t(p0, p1, p2, 0); B.t(p0, p2, p3, 0); };
      q(r0, r1, r1 + 1, r0 + 1); q(r0 + 2, r1 + 2, r1 + 3, r0 + 3); if (MHa[k] <= 5 || MHa[k+1] <= 5) q(r0 + 4, r1 + 4, r1 + 5, r0 + 5);
      r0 = r1; prev = k + 1;
    }
  }
  function medRow(B, i, o){
    const ex = o ? LXO[i] : LXI[i], ey = o ? LYO[i] : LYI[i], ez = o ? LZO[i] : LZI[i];
    let nx, ny;
    if (BVa[i]){ const kk = o ? (i < NS - 1 ? i : NS - 2) : (i > 0 ? i - 1 : 0); nx = -DYa[kk]; ny = DXa[kk]; } else { const sc = SCa[i] > 1.6 ? 1.6 : SCa[i]; nx = MXa[i]*sc; ny = MYa[i]*sc; }
    const mh = Math.max(0.35, Math.min(30, MHa[i])), b = B.n;
    if (mh <= 5){
      const w0 = Math.max(0, mh - 0.3), w1 = Math.max(0, mh - 0.08), zt = ez + 0.81;
      B.v(ex, ey, ez + 0.005, U_SHLD); B.v(ex + nx*w0, ey + ny*w0, ez + 0.005, U_SHLD);
      B.v(ex + nx*w0, ey + ny*w0, ez, U_BARR); B.v(ex + nx*w1, ey + ny*w1, zt, U_BARR);
      B.v(ex + nx*w1, ey + ny*w1, zt, U_BTOP); B.v(ex + nx*(mh + 0.03), ey + ny*(mh + 0.03), zt, U_BTOP);
    } else {
      const px = ex + nx*3.6, py = ey + ny*3.6, zg = Math.max(G(px, py) + 0.08, ez - 0.6);
      B.v(ex, ey, ez + 0.005, U_SHLD); B.v(ex + nx*2.4, ey + ny*2.4, ez + 0.005, U_SHLD);
      B.v(ex + nx*2.4, ey + ny*2.4, ez - 0.01, U_DIRT); B.v(px, py, zg, U_DIRT);
      B.v(px, py, zg, U_DIRT); B.v(px, py, zg, U_DIRT);
    }
    return b;
  }
  // kerb pieces near junctions and line ends that would stand on another road's carriageway (a mouth without a kerb return,
  // a cluster of nodes, a parallel frontage road): FWB[k] = 1 blocks the piece after station k
  function fwBlock(li, side, w){
    if (FWB.length < NS) FWB = new Uint8Array(NS*2);
    FWB.fill(0, 0, NS);
    const rg = roadGrid(X.C), Lt = SS[NS-1], J = SWJ, R = 30;
    const EXO = side > 0 ? LXO : RXO, EYO = side > 0 ? LYO : RYO, EXI = side > 0 ? LXI : RXI, EYI = side > 0 ? LYI : RYI;
    // roadDrive: along the whole line, not only near junctions (frontage roads and close parallel carriageways had footways and kerbs
    // lying on their lanes); the middle of the footway too
    for (let k = 0; k < NS - 1; k++){
      const ex = (EXO[k] + EXI[k+1])*0.5, ey = (EYO[k] + EYI[k+1])*0.5, nx = -DYa[k]*side, ny = DXa[k]*side;
      if (onOtherRoad3(rg, li, ex, ey, nx, ny, w, 0.35)) FWB[k] = 1;
    }
  }
  // is (x, y) inside the carriageway of another at-grade road, by more than m?
  function onOtherRoad(rg, li, x, y, m){
    const ci = rg.cells.get(Math.floor(x/rg.PG)*4096 + Math.floor(y/rg.PG)); if (ci === undefined || rg.one[ci] === li) return false;
    const S = rg.S;
    for (let j = rg.off[ci], j1 = rg.off[ci+1]; j < j1; j++){
      const id = rg.ids[j]; if (rg.CL[id] > 10) break; if (rg.LI[id] === li) continue;
      const o = id*7; if (S[o+5] > 0.5 || S[o+6] > 0.5) continue;
      const r = S[o+4] - m; if (r <= 0) continue;
      const ax = S[o], ay = S[o+1], ex = S[o+2] - ax, ey = S[o+3] - ay, l2 = ex*ex + ey*ey; if (l2 < 0.01) continue;
      let t = ((x - ax)*ex + (y - ay)*ey)/l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const px = ax + ex*t - x, py = ay + ey*t - y;
      if (px*px + py*py < r*r) return true;
    }
    return false;
  }
  // the same for the three footway probes (ex, ey) + (nx, ny)*{0.2, w/2, w} with one cell lookup (at the middle probe: the grid's
  // 4 m margin covers the others for w < 8)
  function onOtherRoad3(rg, li, ex, ey, nx, ny, w, m){
    const xm = ex + nx*w*0.5, ym = ey + ny*w*0.5;
    const ci = rg.cells.get(Math.floor(xm/rg.PG)*4096 + Math.floor(ym/rg.PG)); if (ci === undefined || rg.one[ci] === li) return false;
    const S = rg.S, x0 = ex + nx*0.2, y0 = ey + ny*0.2, x2 = ex + nx*w, y2 = ey + ny*w;
    for (let j = rg.off[ci], j1 = rg.off[ci+1]; j < j1; j++){
      const id = rg.ids[j]; if (rg.CL[id] > 10) break; if (rg.LI[id] === li) continue;
      const o = id*7; if (S[o+5] > 0.5 || S[o+6] > 0.5) continue;
      const r = S[o+4] - m; if (r <= 0) continue;
      const ax = S[o], ay = S[o+1], vx = S[o+2] - ax, vy = S[o+3] - ay, l2 = vx*vx + vy*vy; if (l2 < 0.01) continue;
      const rr = r*r;
      let t = ((x0 - ax)*vx + (y0 - ay)*vy)/l2; t = t < 0 ? 0 : t > 1 ? 1 : t; let px = ax + vx*t - x0, py = ay + vy*t - y0; if (px*px + py*py < rr) return true;
      t = ((xm - ax)*vx + (ym - ay)*vy)/l2; t = t < 0 ? 0 : t > 1 ? 1 : t; px = ax + vx*t - xm; py = ay + vy*t - ym; if (px*px + py*py < rr) return true;
      t = ((x2 - ax)*vx + (y2 - ay)*vy)/l2; t = t < 0 ? 0 : t > 1 ? 1 : t; px = ax + vx*t - x2; py = ay + vy*t - y2; if (px*px + py*py < rr) return true;
    }
    return false;
  }
  // is (x, y) on the carriageway of another road (classes 0-11) at about elevation e above the ground (+-1 m)? m: margin beyond its edge
  // (candidates from the polyline grid, then the drawn centreline: arcs cut polyline corners by metres, and the heights are corrected)
  function onRoadAt(rg, li, x, y, m, e, et){
    if (et === undefined) et = 1.0;
    const ci = rg.cells.get(Math.floor(x/rg.PG)*4096 + Math.floor(y/rg.PG)); if (ci === undefined || rg.one[ci] === li) return false;
    const S = rg.S;
    for (let j = rg.off[ci], j1 = rg.off[ci+1]; j < j1; j++){
      const id = rg.ids[j]; if (rg.CL[id] > 11) break; if (rg.LI[id] === li) continue;
      const o = id*7, ax = S[o], ay = S[o+1], ex = S[o+2] - ax, ey = S[o+3] - ay, l2 = ex*ex + ey*ey; if (l2 < 0.01) continue;
      let t = ((x - ax)*ex + (y - ay)*ey)/l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      if (Math.abs(S[o+5] + (S[o+6] - S[o+5])*t - e) > 1.5 + et) continue;
      const px = ax + ex*t - x, py = ay + ey*t - y, r = S[o+4] + m, rr = r + 4;
      if (px*px + py*py >= rr*rr) continue;
      if (!drawnNear(rg.LI[id], x, y, rg.SA0[id] + t*Math.sqrt(l2))) continue;
      if (Math.abs(DL.e - e) <= et && DL.d < r) return true;
    }
    return false;
  }
  // is there a deck of another road over (x, y), between e0 and e1 above the ground (a lamp pole there would stand through it)?
  function deckOver(rg, li, x, y, e0, e1){
    const ci = rg.cells.get(Math.floor(x/rg.PG)*4096 + Math.floor(y/rg.PG)); if (ci === undefined) return false;
    const S = rg.S;
    for (let j = rg.off[ci], j1 = rg.off[ci+1]; j < j1; j++){
      const id = rg.ids[j], o = id*7; if (rg.LI[id] === li || (S[o+5] < e0 && S[o+6] < e0)) continue;
      const ax = S[o], ay = S[o+1], ex = S[o+2] - ax, ey = S[o+3] - ay, l2 = ex*ex + ey*ey; if (l2 < 0.01) continue;
      let t = ((x - ax)*ex + (y - ay)*ey)/l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const e = S[o+5] + (S[o+6] - S[o+5])*t; if (e < e0 || e > e1) continue;
      const px = ax + ex*t - x, py = ay + ey*t - y, r = S[o+4] + 1.5;
      if (px*px + py*py < r*r) return true;
    }
    return false;
  }
  // the drawn centreline of line li2 near (x, y), around its polyline arc length sr: DL.d distance, DL.e elevation there
  const DL = {d:0, e:0};
  function drawnNear(li2, x, y, sr){
    const g = lineGeom(li2), S = g.s, n = g.n; if (n < 2) return false;
    let lo = 0, hi = n - 2; const s0 = sr - 45; while (lo < hi){ const q = (lo + hi + 1) >> 1; if (S[q] <= s0) lo = q; else hi = q - 1; }
    let bd = Infinity, be = 0;
    for (let k = lo; k < n - 1 && S[k] <= sr + 45; k++){
      const ax = g.x[k], ay = g.y[k], ex = g.x[k+1] - ax, ey = g.y[k+1] - ay, l2 = ex*ex + ey*ey; let t = l2 > 1e-9 ? ((x - ax)*ex + (y - ay)*ey)/l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const dx = ax + ex*t - x, dy = ay + ey*t - y, d = dx*dx + dy*dy; if (d < bd){ bd = d; be = g.e[k] + (g.e[k+1] - g.e[k])*t; }
    }
    if (bd === Infinity) return false;
    DL.d = Math.sqrt(bd); DL.e = be; return true;
  }
  const inGapM = (gs, s, m) => { for (let i = 0; i < gs.length; i++) if (s > gs[i][0] - m && s < gs[i][1] + m) return true; return false; };
  // ---------------------------------------------------------------- roundabouts and estate circles
  // A small closed ring road with nothing inside gets a raised, planted central island (kerb + domed lawn) instead of an inner footway.
  function ringOf(li, L, c, hw){
    const RINGC = X.C.ring || (X.C.ring = new Map());
    let r = RINGC.get(li); if (r !== undefined) return r;
    r = null;
    const P = L.P, n = P.length >> 1;
    if (!(L.flags & 4) && n >= 6 && Math.abs(P[0] - P[2*n-2]) < 0.5 && Math.abs(P[1] - P[2*n-1]) < 0.5){
      let cx = 0, cy = 0, A = 0;
      for (let k = 0; k < n - 1; k++){ cx += P[2*k]; cy += P[2*k+1]; A += P[2*k]*P[2*k+3] - P[2*k+2]*P[2*k+1]; }
      cx /= n - 1; cy /= n - 1;
      let rmin = 1e9, rmax = 0;
      for (let k = 0; k < n - 1; k++){ const d = hyp(P[2*k] - cx, P[2*k+1] - cy); if (d < rmin) rmin = d; if (d > rmax) rmax = d; }
      const rin = rmin - hw;
      if (rmax < 34 && rmin > 0.7*rmax && rin > 2.5){
        // nothing else inside (a driveway, a path, a road through the middle)
        const C = X.C, lines = C.lines, t = tileOf(cx, cy), rr = (rin - 0.3)*(rin - 0.3);
        let clear = true;
        for (let j = C.tileOff[t]; j < C.tileOff[t+1] && clear; j++){
          const i = C.tileLines[j]; if (i === li) continue;
          const Q = lines[i].P;
          if (lines[i].c > 12) continue;
          for (let k = 0; k < Q.length; k += 2){ const dx = Q[k] - cx, dy = Q[k+1] - cy; if (dx*dx + dy*dy < rr){ clear = false; break; } }
        }
        if (clear) r = {li, cx, cy, side:A > 0 ? 1 : -1, rin};
      }
    }
    RINGC.set(li, r); return r;
  }
  function island(R){
    if (!wantXY(R.cx, R.cy)) return;
    const B = bSurf(tileOf(R.cx, R.cy), 1), n = NS - 1, sd = R.side, kk = CUR.k; if (n < 5) return;
    const XI = sd > 0 ? LXI : RXI, YI = sd > 0 ? LYI : RYI, ZI = sd > 0 ? LZI : RZI, XO = sd > 0 ? LXO : RXO, YO = sd > 0 ? LYO : RYO, ZO = sd > 0 ? LZO : RZO;
    let za = 0; for (let i = 0; i < n; i++) za += i ? ZI[i] : ZO[0];
    za /= n;
    const dome = Math.min(0.55, R.rin*0.045), zc = Math.max(za + KH + dome, G(R.cx, R.cy) + 0.1);
    CUR.k = 2;
    const b0 = B.n;
    for (let i = 0; i < n; i++){
      const x = i ? XI[i] : XO[0], y = i ? YI[i] : YO[0], z = i ? ZI[i] : ZO[0], dx = R.cx - x, dy = R.cy - y, d = hyp(dx, dy) || 1, ux = dx/d, uy = dy/d;
      const zt = z + KH, m = 0.3 + (d - 0.3)*0.5;
      B.v(x, y, z - 0.02, C_KFACE); B.v(x, y, zt, C_KFACE);
      B.v(x, y, zt, C_KTOP); B.v(x + ux*0.3, y + uy*0.3, zt, C_KTOP);
      B.v(x + ux*0.3, y + uy*0.3, zt + 0.02, C_GRASS); B.v(x + ux*m, y + uy*m, zt + 0.02 + (zc - zt)*0.72, C_GRASS);
    }
    const cv = B.v(R.cx, R.cy, zc, C_SHRUB);
    const T = sd > 0 ? (a, b, c) => B.t(a, b, c, 0) : (a, b, c) => B.t(a, c, b, 0);
    for (let i = 0; i < n; i++){
      const a = b0 + i*6, b = b0 + ((i + 1) % n)*6;
      CUR.dx = DXa[i < NS - 1 ? i : NS - 2]; CUR.dy = DYa[i < NS - 1 ? i : NS - 2];
      T(a, b, b + 1); T(a, b + 1, a + 1);                      // kerb face, towards the road
      T(a + 2, b + 2, b + 3); T(a + 2, b + 3, a + 3);          // kerb top
      T(a + 4, b + 4, b + 5); T(a + 4, b + 5, a + 5);          // lawn
      T(a + 5, b + 5, cv);
    }
    CUR.k = kk;
  }
  // one cross-section row of a kerb + footway (or median) at station i; o: use the outgoing corner (segment start)
  function sideRow(B, i, side, o, fw, verge, isMed, k){
    const bv = BVa[i];
    let ex, ey, ez, nx, ny;
    if (side > 0){ ex = o ? LXO[i] : LXI[i]; ey = o ? LYO[i] : LYI[i]; ez = o ? LZO[i] : LZI[i]; }
    else { ex = o ? RXO[i] : RXI[i]; ey = o ? RYO[i] : RYI[i]; ez = o ? RZO[i] : RZI[i]; }
    if (bv){ const kk = o ? (i < NS - 1 ? i : NS - 2) : (i > 0 ? i - 1 : 0); nx = -DYa[kk]; ny = DXa[kk]; }
    else { const sc = SCa[i] > 1.6 ? 1.6 : SCa[i]; nx = MXa[i]*sc; ny = MYa[i]*sc; }
    nx *= side; ny *= side;
    const b = B.n, zt = ez + KH;
    B.v(ex, ey, ez - 0.02, C_KFACE); B.v(ex, ey, zt, C_KFACE);                                  // kerb face
    if (isMed){
      const mh = Math.max(0.25, Math.min(14, MHa[i] >= 0 ? MHa[i] : MHa[k] >= 0 ? MHa[k] : 0.5));
      B.v(ex, ey, zt, C_KTOP); B.v(ex + nx*0.25, ey + ny*0.25, zt, C_KTOP);
      B.v(ex + nx*0.25, ey + ny*0.25, zt + 0.02, mh > 1.2 ? C_GRASS : C_KTOP); B.v(ex + nx*(mh + 0.05), ey + ny*(mh + 0.05), zt + 0.02, mh > 1.2 ? C_SHRUB : C_KTOP);
      return b;
    }
    const ox = ex + nx*fw, oy = ey + ny*fw, go = G(ox, oy), zo = Math.max(zt, go + 0.06);
    B.v(ex, ey, zt, C_KTOP); B.v(ox, oy, zo, C_WALK);
    B.v(ox, oy, zo, C_KFACE); B.v(ox, oy, Math.min(go - 0.1, zo - 0.05), C_KFACE);
    return b;
  }
  // faces between two rows (a: start, b: end along the line); side +1: left of the line
  function sideFaces(B, a, b, side, isMed, verge){
    const q = (p0, p1, p2, p3) => { if (side > 0){ B.t(p0, p1, p2, 0); B.t(p0, p2, p3, 0); } else { B.t(p0, p2, p1, 0); B.t(p0, p3, p2, 0); } };
    q(a, b, b + 1, a + 1);                                        // kerb face (towards the road)
    q(a + 2, b + 2, b + 3, a + 3);                                // kerb top
    if (isMed){ q(a + 4, b + 4, b + 5, a + 5); return; }          // planting
    q(a + 5, a + 4, b + 4, b + 5);                                // outer edge, facing out
  }
  // kerbs + footways (at grade) or parapets (on decks) along the kerb edges of a junction outline (counter-clockwise: outside on the right)
  function outlineWalls(t, OX, OY, OZ, KB, fw, elev, th, part, ee){
    const n = OX.length; if (n < 3) return; if (part === undefined) part = 3;
    if (!elev && !(part & 2)) fw = 0;
    const B = elev ? bStruct(t, 0) : (part & 2) && fw > 0 ? bSurf(t, 2) : null;
    if (!elev) CUR.k = 2;
    // outward normals per edge, averaged at shared points
    const ENX = [], ENY = [];
    for (let i = 0; i < n; i++){ const j = (i + 1) % n, dx = OX[j] - OX[i], dy = OY[j] - OY[i], l = Math.sqrt(dx*dx + dy*dy) || 1; ENX.push(dy/l); ENY.push(-dx/l); }
    for (let i = 0; i < n; i++){
      if (KB[i] !== 1 && !(KB[i] === 2 && !elev && (part & 1))) continue;
      if (KB[i] === 1 && !elev && !(fw > 0)) continue;
      const j = (i + 1) % n, dx = OX[j] - OX[i], dy = OY[j] - OY[i], l = Math.sqrt(dx*dx + dy*dy); if (l < 0.05) continue;
      // no kerb / footway where the outside of this edge is another carriageway (node clusters, open mouths)
      if (!elev){ const w = KB[i] === 2 ? 0.8 : fw*0.5, mx = (OX[i] + OX[j])*0.5 + ENX[i]*w, my = (OY[i] + OY[j])*0.5 + ENY[i]*w; if (onOtherRoad(roadGrid(X.C), -1, mx, my, 0.35)) continue; }
      // roadDrive: no parapet on an elevated junction edge whose outside is another deck at the same level (it stood across the lanes)
      else if (ee !== undefined && outsideDeck(OX, OY, ENX, ENY, i, j, ee)) continue;
      if (KB[i] === 2){
        // the nose of a median between the arms of a dual road: kerb + planting
        const za = OZ[i] + KH, zb = OZ[j] + KH, nx = ENX[i], ny = ENY[i], w = Math.min(2.5, l*0.4), Bm = bSurf(t, 1);
        const v0 = Bm.v(OX[i], OY[i], OZ[i] - 0.02, C_KFACE), v1 = Bm.v(OX[j], OY[j], OZ[j] - 0.02, C_KFACE), v2 = Bm.v(OX[j], OY[j], zb, C_KFACE), v3 = Bm.v(OX[i], OY[i], za, C_KFACE);
        Bm.t(v0, v2, v1, 0); Bm.t(v0, v3, v2, 0);
        const g0 = Bm.v(OX[i], OY[i], za, C_KTOP), g1 = Bm.v(OX[j], OY[j], zb, C_KTOP), g2 = Bm.v(OX[j] + nx*w, OY[j] + ny*w, zb + 0.02, C_GRASS), g3 = Bm.v(OX[i] + nx*w, OY[i] + ny*w, za + 0.02, C_GRASS);
        Bm.t(g0, g2, g1, 0); Bm.t(g0, g3, g2, 0);
        continue;
      }
      const pi = (i + n - 1) % n, nj = j;
      // normals at both ends: average with the neighbouring kerb edges
      let ax = ENX[i], ay = ENY[i], bx = ENX[i], by = ENY[i];
      if (KB[pi] === 1){ ax += ENX[pi]; ay += ENY[pi]; const q = Math.sqrt(ax*ax + ay*ay) || 1, c = (ax*ENX[i] + ay*ENY[i])/q; ax /= q*Math.max(0.6, c); ay /= q*Math.max(0.6, c); }
      if (KB[nj] === 1){ bx += ENX[nj]; by += ENY[nj]; const q = Math.sqrt(bx*bx + by*by) || 1, c = (bx*ENX[i] + by*ENY[i])/q; bx /= q*Math.max(0.6, c); by /= q*Math.max(0.6, c); }
      CUR.dx = dx/l; CUR.dy = dy/l;
      if (!elev){
        const za = OZ[i] + KH, zb = OZ[j] + KH;
        const oax = OX[i] + ax*fw, oay = OY[i] + ay*fw, obx = OX[j] + bx*fw, oby = OY[j] + by*fw, ga = G(oax, oay), gb = G(obx, oby), zoa = Math.max(za, ga + 0.06), zob = Math.max(zb, gb + 0.06);
        const v0 = B.v(OX[i], OY[i], OZ[i] - 0.02, C_KFACE), v1 = B.v(OX[j], OY[j], OZ[j] - 0.02, C_KFACE), v2 = B.v(OX[j], OY[j], zb, C_KFACE), v3 = B.v(OX[i], OY[i], za, C_KFACE);
        B.t(v0, v2, v1, 0); B.t(v0, v3, v2, 0);                   // kerb face, towards the junction (left of the edge)
        const w0 = B.v(OX[i], OY[i], za, C_KTOP), w1 = B.v(OX[j], OY[j], zb, C_KTOP), w2 = B.v(obx, oby, zob, C_WALK), w3 = B.v(oax, oay, zoa, C_WALK);
        B.t(w0, w2, w1, 0); B.t(w0, w3, w2, 0);
        const d0 = B.v(oax, oay, zoa, C_KFACE), d1 = B.v(obx, oby, zob, C_KFACE), d2 = B.v(obx, oby, Math.min(gb - 0.1, zob - 0.05), C_KFACE), d3 = B.v(oax, oay, Math.min(ga - 0.1, zoa - 0.05), C_KFACE);
        B.t(d0, d2, d1, 0); B.t(d0, d3, d2, 0);
      } else {
        // parapet: inner face, cap, outer wall down to the deck bottom
        const pt = 0.35, ph = 1.0, ia = [OX[i], OY[i]], ib = [OX[j], OY[j]], oa = [OX[i] + ax*pt, OY[i] + ay*pt], ob = [OX[j] + bx*pt, OY[j] + by*pt];
        const nx = ENX[i], ny = ENY[i];
        const f = (p, q, z0a, z0b, z1a, z1b, col, sx, sy) => { const a0 = B.vn(p[0], p[1], z0a, col, sx, 0, -sy), b0 = B.vn(q[0], q[1], z0b, col, sx, 0, -sy), b1 = B.vn(q[0], q[1], z1b, col, sx, 0, -sy), a1 = B.vn(p[0], p[1], z1a, col, sx, 0, -sy); return [a0, b0, b1, a1]; };
        let v = f(ia, ib, OZ[i], OZ[j], OZ[i] + ph, OZ[j] + ph, C_CONC, -nx, -ny); B.t(v[0], v[2], v[1]); B.t(v[0], v[3], v[2]);
        v = f(oa, ob, OZ[i] - th, OZ[j] - th, OZ[i] + ph, OZ[j] + ph, C_SIDE, nx, ny); B.t(v[0], v[1], v[2]); B.t(v[0], v[2], v[3]);
        const c0 = B.vn(ia[0], ia[1], OZ[i] + ph, C_CONC, 0, 1, 0), c1 = B.vn(ib[0], ib[1], OZ[j] + ph, C_CONC, 0, 1, 0), c2 = B.vn(ob[0], ob[1], OZ[j] + ph, C_CONC, 0, 1, 0), c3 = B.vn(oa[0], oa[1], OZ[i] + ph, C_CONC, 0, 1, 0);
        B.t(c0, c2, c1); B.t(c0, c3, c2);
      }
    }
    CUR.k = 0;
  }
  // deck underside below an elevated junction surface (fan, facing down)
  function outlineSoffit(t, OX, OY, OZ, cx, cy, cz, th){
    const B = bStruct(t, 0), n = OX.length, c = B.vn(cx, cy, cz - th, C_UNDER, 0, -1, 0), V = [];
    for (let i = 0; i < n; i++) V.push(B.vn(OX[i], OY[i], OZ[i] - th, C_UNDER, 0, -1, 0));
    for (let i = 0; i < n; i++){ const j = (i + 1) % n; if ((OX[i] - cx)*(OY[j] - cy) - (OY[i] - cy)*(OX[j] - cx) <= 1e-6) continue; B.t(c, V[j], V[i]); }
  }
  // ---------------------------------------------------------------- street lighting (Singapore today: white LED lanterns)
  // single-arm poles on the kerb side, double-arm poles in the medians of dual roads, lantern glows (lamps) and night pools (mark)
  function lamps(c, hw, ow, li, JN, L, part){
    const Lt = SS[NS-1]; if (part === undefined) part = 3; LPART = part;
    if ((c === 13 || c === 14) && (!(part & 1) || X.ob)) return;
    if (c === 13){
      for (let s = 0; s <= Lt; s += 60){ const t = tileAtS(s); if (t < 0) continue; const k = segAt(s), x = interp(SX, s), y = interp(SY, s), z = interp(SZ, s) + 0.6, B = bLamp(t);
        for (const sg of [-1, 1]) B.v(x - DYa[k]*sg*(hw + 1), y + DXa[k]*sg*(hw + 1), z, L_RWY); }
      return;
    }
    if (c === 14){ for (let s = 15; s < Lt; s += 60){ const t = tileAtS(s); if (t < 0) continue; bLamp(t).v(interp(SX, s), interp(SY, s), interp(SZ, s) + 0.5, L_TWY); } return; }
    const sp = LAMP_SP[c]; if (!sp || c === 11) return;
    const link = (L.flags & 16) !== 0, h = US ? (c <= 1 ? 13.7 : c <= 4 ? 10.5 : c <= 8 ? 9.5 : 8.2) : c <= 1 ? 12 : c <= 4 ? 11 : c <= 8 ? 10 : 8.5; POOLL = sp*0.62; PHW = hw;
    if (US){
      // LED white, some high-pressure sodium left (freeways by route and area, a few city streets); wooden utility poles on some local streets
      const nm = L.name && L.name[0] ? L.name[0] : '', z = zoneOf(SX[0], SY[0]);
      UNA = c <= 1 ? sh01((L.ref || 'f') + ':' + Math.floor(SX[0]/5000) + ':' + Math.floor(SY[0]/5000)) < 0.5 : (nm ? sh01('na' + nm) : h01(li)) < (c <= 8 ? 0.1 : 0.25);
      UWOOD = c >= 9 && z >= 1 && !!nm && sh01('w' + nm) < 0.45;
    }
    let n = 0; const rg = roadGrid(X.C);
    // roadDrive: the placement checks below are the same for the main, detail and index passes: done once per pole and line
    const LC = X.C.lampc || (X.C.lampc = new Map()); let lc = LC.get(li); if (!lc || lc.length < Lt/sp + 2){ lc = new Uint8Array(Math.ceil(Lt/sp) + 2); LC.set(li, lc); }
    for (let s = sp*0.5; s < Lt - 2; s += sp, n++){
      const k = segAt(s); if (!RBa[k]) continue;
      const t = tileAtS(s); if (t < 0) continue;
      const dk = SS[k+1] - SS[k], fk = dk > 0 ? (s - SS[k])/dk : 0;
      const x = SX[k] + (SX[k+1] - SX[k])*fk, y = SY[k] + (SY[k+1] - SY[k])*fk, dx = DXa[k], dy = DYa[k], nx = -dy, ny = dx, e = SE[k] + (SE[k+1] - SE[k])*fk, zc = SZ[k] + (SZ[k+1] - SZ[k])*fk;
      if (STRUCTSKIP && e > 3 && STRUCTSKIP(x, y)) continue;
      const mh = ow ? (MHa[k] >= 0 ? MHa[k] : MHa[k+1]) : -1;
      if (mh >= 0.6 && !(US && e > 0.5)){                          // (US: not between two decks; the parapet pole below instead)
        // median: a double-arm pole, drawn once per pair of carriageways
        if (MPL >= 0 && MPL < li) continue;
        const o = hw + mh, px = US ? x + nx*o : x - nx*o, py = US ? y + ny*o : y - ny*o, arm = Math.min(mh + 2.2, 5.5);
        if (!lc[n]) lc[n] = onRoadAt(rg, li, px, py, 0.45, e) || deckOver(rg, li, px, py, e + 1.2, e + h + 2) ? 2 : 1;
        if (lc[n] === 2) continue;                                  // roadDrive: never on another carriageway or through a deck
        if (US){ poleUS(t, px, py, c > 1 ? zc + KH + 0.05 : mh <= 5 ? zc + 0.81 : Math.min(zc, G(px, py) + 0.1), h, nx, ny, arm, arm, c, zc, e > 0.5); continue; }
        pole(t, px, py, zc + KH + 0.05, h, nx, ny, arm, arm, c, zc, e > 0.5);
        continue;
      }
      let sg = US ? -1 : 1;                                         // the kerb side (US: on the right)
      if (!ow && WID[c][0] >= 12) sg = (n & 1) ? -1 : 1;           // wide two-way roads: staggered on both sides
      const elev = e > 0.5, o = elev ? hw - 0.25 : hw + 0.9, px = x + nx*o*sg, py = y + ny*o*sg, arm = elev ? 1.6 : Math.min(2.6, hw*0.45 + 1.0);
      // roadDrive: no pole in the mouth of a side road (the junction surface) or on another carriageway / service road / deck
      if (!lc[n]) lc[n] = (JN && inGapM(JN.sideGap[sg > 0 ? 0 : 1], s, 2.5)) || onRoadAt(rg, li, px, py, 0.45, elev ? e : 0)
        || (!elev && drawnNear(li, px, py, s) && DL.d < hw + 0.4)        // the inside of a tight bend: the own road curves under it
        || deckOver(rg, li, px, py, e + 1.2, e + h + 2) ? 2 : 1;         // under a viaduct: it would stand through the deck
      if (lc[n] === 2) continue;
      if (US){ poleUS(t, px, py, zc + (elev ? 0.9 : KH + 0.05), h, -nx*sg, -ny*sg, UWOOD ? 1.8 : c <= 1 && !elev ? 4.2 : arm, 0, c, zc, elev); continue; }
      pole(t, px, py, zc + (elev ? 0.9 : KH + 0.05), h, -nx*sg, -ny*sg, arm, 0, c, zc, elev);
    }
  }
  // a lamp pole at (x, y) from z0, height h; arms of length a1 towards (ux, uy) and a2 the other way; lantern glows + light pools
  const TRI3 = [1, 0, -0.5, 0.866, -0.5, -0.866]; let LPART = 3, POOLL = 25, PHW = 4;
  function web(Bp, p0x, p0y, p0z, p1x, p1y, p1z, oz, col){
    const i0 = Bp.v(p0x, p0y, p0z, col), i1 = Bp.v(p1x, p1y, p1z, col), i2 = Bp.v(p1x, p1y, p1z + oz, col), i3 = Bp.v(p0x, p0y, p0z + oz, col);
    Bp.t(i0, i1, i2, 0); Bp.t(i0, i2, i3, 0); Bp.t(i0, i2, i1, 0); Bp.t(i0, i3, i2, 0);
  }
  function pole(t, x, y, z0, h, ux, uy, a1, a2, c, zr, elev){
    if (X.ob){ obRec(0, x, y, x, y, c <= 4 ? 0.16 : 0.13, z0 - 0.2, z0 + h); return; }
    const z1 = z0 + h, vx = -uy, vy = ux, Bp = LPART & 2 ? bSurf(t, 2) : null;
    if (RECD && Bp) RECD.poles.push({x, y, z0, c, li:CUR.li, r:c <= 4 ? 0.16 : 0.13, elev});
    // tapered three-sided shaft (no top), two shades for the up-lit pole material
    const r0 = c <= 4 ? 0.16 : 0.13, r1 = 0.08;
    for (let j = 0; j < 3 && Bp; j++){
      const a0 = TRI3[j*2], a1_ = TRI3[j*2+1], k = (j + 1) % 3, b0 = TRI3[k*2], b1 = TRI3[k*2+1], col = j === 1 ? C_POLED : C_POLE;
      const pax = ux*a0 + vx*a1_, pay = uy*a0 + vy*a1_, pbx = ux*b0 + vx*b1, pby = uy*b0 + vy*b1;
      const i0 = Bp.v(x + pax*r0, y + pay*r0, z0 - 0.2, col), i1 = Bp.v(x + pbx*r0, y + pby*r0, z0 - 0.2, col), i2 = Bp.v(x + pbx*r1, y + pby*r1, z1, col), i3 = Bp.v(x + pax*r1, y + pay*r1, z1, col);
      Bp.t(i0, i1, i2, 0); Bp.t(i0, i2, i3, 0);
    }
    const B = bLamp(t);
    for (let side = 0; side < 2; side++){
      const len = side ? a2 : a1, sg = side ? -1 : 1;
      if (!(len > 0)) continue;
      // arm: a slim rising web, the lantern a flat triangle at its end
      const ex = x + ux*sg*len, ey = y + uy*sg*len, ez = z1 + 0.35, gx = ex + ux*sg*0.18, gy = ey + uy*sg*0.18;
      if (LPART & 1) B.v(gx, gy, ez - 0.22, c <= 8 ? L_LED : L_LEDW);
      if (!Bp) continue;
      // arm: a strip seen from below (street level); lantern: a flat triangle seen from below
      const wx = vx*0.06, wy = vy*0.06, j0 = Bp.v(x - wx, y - wy, z1 - 0.05, C_POLED), j1 = Bp.v(ex - wx, ey - wy, ez - 0.05, C_POLED), j2 = Bp.v(ex + wx, ey + wy, ez - 0.05, C_POLED), j3 = Bp.v(x + wx, y + wy, z1 - 0.05, C_POLED);
      triDown(Bp, j0, j2, j1, x - wx, y - wy, ex + wx, ey + wy, ex - wx, ey - wy, 0); triDown(Bp, j0, j3, j2, x - wx, y - wy, x + wx, y + wy, ex + wx, ey + wy, 0);
      const hx = ex + ux*sg*0.45, hy = ey + uy*sg*0.45, lx = vx*0.18, ly = vy*0.18;
      const i0 = Bp.v(ex - lx, ey - ly, ez - 0.1, C_HEAD), i1 = Bp.v(hx, hy, ez - 0.13, C_HEAD), i2 = Bp.v(ex + lx, ey + ly, ez - 0.1, C_HEAD);
      triDown(Bp, i0, i2, i1, ex - lx, ey - ly, ex + lx, ey + ly, hx, hy, 0);
      if (c <= 8) pool(t, gx + ux*sg*1.2, gy + uy*sg*1.2, zr, elev, POOLL, Math.min(PHW*1.6 + 1.5, 11), -uy, ux);
    }
  }
  // v22 US: a cobra-head street light — a tapered galvanised steel pole (or a wooden utility pole), a mast arm that leaves the pole
  // below its top and curves up and out, a flat oval luminaire (its lens below); the glow is LED white or sodium orange
  let UWOOD = false, UNA = false;
  function poleUS(t, x, y, z0, h, ux, uy, a1, a2, c, zr, elev){
    if (X.ob){ obRec(0, x, y, x, y, UWOOD ? 0.17 : c <= 1 ? 0.2 : c <= 4 ? 0.15 : 0.12, z0 - 0.2, z0 + h); return; }
    const z1 = z0 + h, vx = -uy, vy = ux, Bp = LPART & 2 ? bSurf(t, 2) : null;
    if (RECD && Bp) RECD.poles.push({x, y, z0, c, li:CUR.li, r:0.2, elev});
    const r0 = UWOOD ? 0.17 : c <= 1 ? 0.2 : c <= 4 ? 0.15 : 0.12, r1 = UWOOD ? 0.12 : 0.07, cA = UWOOD ? U_WOOD : C_POLE, cB = UWOOD ? U_WOODD : C_POLED;
    for (let j = 0; j < 3 && Bp; j++){
      const a0 = TRI3[j*2], a1_ = TRI3[j*2+1], k = (j + 1) % 3, b0 = TRI3[k*2], b1 = TRI3[k*2+1], col = j === 1 ? cB : cA;
      const pax = ux*a0 + vx*a1_, pay = uy*a0 + vy*a1_, pbx = ux*b0 + vx*b1, pby = uy*b0 + vy*b1;
      const i0 = Bp.v(x + pax*r0, y + pay*r0, z0 - 0.2, col), i1 = Bp.v(x + pbx*r0, y + pby*r0, z0 - 0.2, col), i2 = Bp.v(x + pbx*r1, y + pby*r1, z1, col), i3 = Bp.v(x + pax*r1, y + pay*r1, z1, col);
      Bp.t(i0, i1, i2, 0); Bp.t(i0, i2, i3, 0);
    }
    const B = bLamp(t), gc = UNA ? U_NA : U_LED;
    for (let side = 0; side < 2; side++){
      const len = side ? a2 : a1, sg = side ? -1 : 1;
      if (!(len > 0)) continue;
      const dx = ux*sg, dy = uy*sg, ex = x + dx*len, ey = y + dy*len, ez = z1 + Math.min(1.0, 0.2 + len*0.16), hz = ez - 0.1;
      if (LPART & 1) B.v(ex + dx*0.4, ey + dy*0.4, hz - 0.2, gc);
      if (!Bp) continue;
      // the arm: a slim double-sided web from below the pole top, rising, then running out almost level to the luminaire
      // (local streets: a short straight bracket)
      if (c >= 9) web(Bp, x, y, z1 - 0.35, ex, ey, ez, 0.09, cB);
      else { const mx = x + dx*len*0.36, my = y + dy*len*0.36, mz = ez - 0.1 - len*0.02; web(Bp, x, y, z1 - 0.6, mx, my, mz, 0.1, cB); web(Bp, mx, my, mz, ex, ey, ez, 0.09, cB); }
      // the cobra head: a flat oval body seen from above (four faces round a ridge point), the lens below
      const bx = ex - dx*0.06, by = ey - dy*0.06, fx = ex + dx*0.84, fy = ey + dy*0.84, sx = ex + dx*0.34, sy = ey + dy*0.34, w = 0.23;
      const lx = sx + vx*w, ly = sy + vy*w, rx = sx - vx*w, ry = sy - vy*w;
      const tp = c >= 9 ? -1 : Bp.v(sx, sy, hz + 0.17, C_HEAD), bk = Bp.v(bx, by, hz + 0.05, C_HEAD), fr = Bp.v(fx, fy, hz - 0.05, C_HEAD), lf = Bp.v(lx, ly, hz - 0.02, C_HEAD), rt = Bp.v(rx, ry, hz - 0.02, C_HEAD);
      if (c >= 9){ tri(Bp, bk, lf, fr, bx, by, lx, ly, fx, fy, 0); tri(Bp, bk, fr, rt, bx, by, fx, fy, rx, ry, 0); }      // local streets: a flat head
      else { tri(Bp, tp, bk, lf, sx, sy, bx, by, lx, ly, 0); tri(Bp, tp, lf, fr, sx, sy, lx, ly, fx, fy, 0); tri(Bp, tp, fr, rt, sx, sy, fx, fy, rx, ry, 0); tri(Bp, tp, rt, bk, sx, sy, rx, ry, bx, by, 0); }
      if (c <= 4){ const l0 = Bp.v(bx, by, hz - 0.03, U_LENS), l1 = Bp.v(lx, ly, hz - 0.04, U_LENS), l2 = Bp.v(fx, fy, hz - 0.07, U_LENS), l3 = Bp.v(rx, ry, hz - 0.04, U_LENS);
        triDown(Bp, l0, l1, l2, bx, by, lx, ly, fx, fy, 0); triDown(Bp, l0, l2, l3, bx, by, fx, fy, rx, ry, 0); }
      if (c <= 10) pool(t, ex + dx*1.4, ey + dy*1.4, zr, elev, POOLL, Math.min(PHW*1.6 + 1.5, 11), -uy, ux, UNA ? U_POOLN : U_POOL, UNA ? U_POOLNE : U_POOLE);
    }
  }
  // a soft pool of street light on the road (visible at night only: see the mark material)
  const POOLC = [255, 248, 236, 128], POOLE = [0, 248, 236, 128];
  // an elongated pool along the road (dx, dy): consecutive pools overlap into a gently varying lit band
  function pool(t, x, y, zr, elev, ra, rb, dx, dy, pc, pe){
    if (!pc){ pc = POOLC; pe = POOLE; }
    const B = bMark(t), pz = (px, py) => elev ? zr + 0.04 : Math.max(G(px, py) + 0.22, zr + 0.04), c = B.v(x, y, pz(x, y), pc), V = [], nx = -dy, ny = dx;
    for (let j = 0; j < 6; j++){ const a = j*Math.PI/3, ca = Math.cos(a)*ra, sa = Math.sin(a)*rb, px = x + dx*ca + nx*sa, py = y + dy*ca + ny*sa; V.push(B.v(px, py, pz(px, py), pe)); }
    for (let j = 0; j < 6; j++) B.t(c, V[j], V[(j + 1) % 6], 0);
  }
  // ---------------------------------------------------------------- tunnel portals where expressways and underpasses leave the data (tunnels are not mapped)
  function portal(end, hw, c){
    if (X.ob){ portalObs(end, hw, c); return; }
    const i = end ? NS - 1 : 0, k = end ? NS - 2 : 0, sg = end ? 1 : -1, ux = DXa[k]*sg, uy = DYa[k]*sg, nx = -uy, ny = ux;
    const x = SX[i], y = SY[i], z = Math.min(LZI[i], RZI[i]) - 0.02, t = tileAtS(SS[i]); if (t < 0) return;
    const B = bStruct(t, 0), W = hw + 0.4, H = c <= 3 ? 6.4 : 5.6;
    // portal frame: headwall over the opening, side walls; a dark tunnel box behind
    boxV(B, x + ux*0.9, y + uy*0.9, ux, uy, 0.9, W + 1.4, z + H, z + H + 2.2, C_CONC, true, true);
    for (const s2 of [-1, 1]) boxV(B, x + ux*0.9 + nx*s2*(W + 0.7), y + uy*0.9 + ny*s2*(W + 0.7), ux, uy, 0.9, 0.7, z - 0.4, z + H, C_CONC, true, false);
    const d0 = 0.05, d1 = 9;
    const q = (ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz, col, fx, fy, fz) => { const a = B.vn(ax, ay, az, col, fx, fz, -fy), b = B.vn(bx, by, bz, col, fx, fz, -fy), c2 = B.vn(cx, cy, cz, col, fx, fz, -fy), d = B.vn(dx, dy, dz, col, fx, fz, -fy); B.t(a, b, c2); B.t(a, c2, d); };
    const L0x = x + ux*d0 + nx*W, L0y = y + uy*d0 + ny*W, R0x = x + ux*d0 - nx*W, R0y = y + uy*d0 - ny*W, L1x = x + ux*d1 + nx*W, L1y = y + uy*d1 + ny*W, R1x = x + ux*d1 - nx*W, R1y = y + uy*d1 - ny*W;
    q(R0x, R0y, z, R1x, R1y, z, L1x, L1y, z, L0x, L0y, z, C_TUN, 0, 0, 1);                          // floor
    q(L0x, L0y, z + H, L1x, L1y, z + H, R1x, R1y, z + H, R0x, R0y, z + H, C_DARK, 0, 0, -1);           // ceiling
    q(L0x, L0y, z, L1x, L1y, z, L1x, L1y, z + H, L0x, L0y, z + H, C_TUN, -nx, -ny, 0);                 // left wall (faces in)
    q(R1x, R1y, z, R0x, R0y, z, R0x, R0y, z + H, R1x, R1y, z + H, C_TUN, nx, ny, 0);                   // right wall
    q(L1x, L1y, z, R1x, R1y, z, R1x, R1y, z + H, L1x, L1y, z + H, C_DARK, -ux, -uy, 0);                // the dark far end
    // tunnel lights inside
    const LB = bLamp(t); for (let d = 2; d < d1; d += 3) for (const s2 of [-1, 1]) LB.v(x + ux*d + nx*s2*(W - 0.4), y + uy*d + ny*s2*(W - 0.4), z + H - 0.4, L_LEDW);
    // wing walls: the approach cutting, rising towards the portal over the last 60 m
    const Lt = SS[NS-1];
    const WL = wingLen(end);
    for (let s2 = -1; s2 <= 1; s2 += 2){
      let prev = null;
      for (let j = 0; j < NS; j++){
        const ii = end ? NS - 1 - j : j, dd = end ? Lt - SS[ii] : SS[ii]; if (dd > WL) break;
        const kk = ii < NS - 1 ? ii : NS - 2, ex = SX[ii] + (-DYa[kk])*s2*(hw + 0.35), ey = SY[ii] + DXa[kk]*s2*(hw + 0.35), ez = (s2 > 0 ? LZI[ii] : RZI[ii]) - 0.05, wh = 0.7 + (H + 1.6)*Math.pow(1 - dd/62, 1.4);
        const cur = [ex, ey, ez, ez + wh, -DYa[kk]*s2, DXa[kk]*s2];
        if (prev){
          const [ax, ay, az0, az1, anx, any] = prev, [bx, by, bz0, bz1, bnx, bny] = cur;
          // inner face (towards the road) and top cap
          const i0 = B.vn(ax, ay, az0, C_SIDE, -anx, 0, any), i1 = B.vn(bx, by, bz0, C_SIDE, -bnx, 0, bny), i2 = B.vn(bx, by, bz1, C_SIDE, -bnx, 0, bny), i3 = B.vn(ax, ay, az1, C_SIDE, -anx, 0, any);
          if ((bx - ax)*any - (by - ay)*anx > 0){ B.t(i0, i1, i2); B.t(i0, i2, i3); } else { B.t(i0, i2, i1); B.t(i0, i3, i2); }
          const c0 = B.vn(ax, ay, az1, C_CONC, 0, 1, 0), c1 = B.vn(bx, by, bz1, C_CONC, 0, 1, 0), c2 = B.vn(bx + bnx*0.5, by + bny*0.5, bz1, C_CONC, 0, 1, 0), c3 = B.vn(ax + anx*0.5, ay + any*0.5, az1, C_CONC, 0, 1, 0);
          tri(B, c0, c1, c2, ax, ay, bx, by, bx + bnx*0.5, by + bny*0.5, 0); tri(B, c0, c2, c3, ax, ay, bx + bnx*0.5, by + bny*0.5, ax + anx*0.5, ay + any*0.5, 0);
        }
        prev = cur;
      }
    }
  }

  // ---------------------------------------------------------------- build
  // meshes of one kind (the per-tile structure the app's LOD relies on: major surf/mark/struct/lamps, minor surf/struct, paths surf)
  function meshOf(kind, g, geo){
    const M = mats();
    if (kind === 'surf'){ const m = new THREE.Mesh(geo, M.surf[g]); m.receiveShadow = true; m.name = 'surf'; return m; }
    if (kind === 'mark'){ const m = new THREE.Mesh(geo, M.mark); m.receiveShadow = true; m.renderOrder = 1; m.name = 'mark'; return m; }
    if (kind === 'struct'){ const m = new THREE.Mesh(geo, M.struct); m.castShadow = true; m.receiveShadow = true; m.name = 'struct'; return m; }
    const p = new THREE.Points(geo, M.lamp || matLamp); p.renderOrder = 5; p.name = 'lamps';
    if (M.lamp && M.lamp.userData.base){ const ml = M.lamp, base = ml.userData.base; p.onBeforeRender = () => { ml.opacity = Math.min(1, base.opacity*1.35); }; }
    return p;
  }
  // an empty mesh that a deferred detail pass fills later (no draw call until then)
  // an empty geometry with the attribute layout of a real one (the renderer compiles the program before it skips an empty draw)
  function emptyGeo(kind){
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Uint8Array(0), kind === 'mark' ? 4 : 3, true));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1); geo.boundingBox = new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));
    return geo;
  }
  function placeholder(kind, g, ox, oy){
    const geo = emptyGeo(kind);
    const m = meshOf(kind, g, geo); m.position.set(ox, 0, -oy); m.updateMatrix(); m.matrixAutoUpdate = false; m.userData.sgrPending = true; return m;
  }
  let DEFER = false; const DET = new Map(), FULLC = new Map();
  function build(lines, opts){
    opts = opts || {};
    const t0 = (typeof performance !== 'undefined' ? performance : Date).now();
    style(); initGround(); const C = prep(lines), M = mats();
    let only = null;
    if (opts.only){ only = opts.only instanceof Set ? opts.only : new Set(opts.only); }
    let rbb = null;
    if (only){ rbb = [Infinity, Infinity, -Infinity, -Infinity]; for (const t of only){ const tx = t % C.TXn, ty = (t/C.TXn) | 0, x0 = -HALF + tx*TILE, y0 = -HALF + ty*TILE;
      rbb[0] = Math.min(rbb[0], x0 - 160); rbb[1] = Math.min(rbb[1], y0 - 160); rbb[2] = Math.max(rbb[2], x0 + TILE + 160); rbb[3] = Math.max(rbb[3], y0 + TILE + 160); } }
    const nb = only && only.size === 1 ? [rbb[0] + 90, rbb[1] + 90, rbb[2] - 90, rbb[3] - 90] : null;
    // deferred near detail (app streaming): markings, footways, lamp poles and light pools follow in small slices near the camera
    const defer = only && (opts.defer !== undefined ? !!opts.defer : DEFER) && !opts.detail;
    X = {T:new Array(C.TXn*C.TXn).fill(null), only, C, TXn:C.TXn, geo:new Map(), st:{lines:0, piers:0, junc:0}, idx:null, rbb, full:new Map(), nb, mode:defer ? 'main' : 'all'};
    const skip = typeof opts.skipLine === 'function' ? opts.skipLine : null;
    LASTSKIP = skip; if (only) for (const t of only){ dropIndex(t); DET.delete(t); } else { IDXC.clear(); JOBS.clear(); DET.clear(); FULLC.clear(); LASTI = null; }
    try {
      if (only){
        const seen = new Uint8Array(lines.length), cseen = new Set();
        for (const t of only){
          if (!(t >= 0 && t < C.TXn*C.TXn)) continue;
          for (let j = C.tileOff[t]; j < C.tileOff[t+1]; j++){ const i = C.tileLines[j]; if (seen[i]) continue; seen[i] = 1; if (skip && skip(i)) continue; doLine(i, lines[i]); }
          complexesIn(t, cseen);
        }
      } else {
        for (let i = 0; i < lines.length; i++){ if (skip && skip(i)) continue; doLine(i, lines[i]); }
        for (let cx = 0; cx < C.J.nC; cx++) doComplex(cx);
      }
    } finally { MB = null; }
    // meshes: one per material, positioned at the tile centre
    const tiles = new Map(), stats = {ms:0, lines:X.st.lines, piers:X.st.piers, junctions:X.st.junc, tiles:0, verts:0, tris:0, bytes:0, lamps:0, groups:{major:{verts:0, tris:0, bytes:0}, minor:{verts:0, tris:0, bytes:0}, paths:{verts:0, tris:0, bytes:0}}, kinds:{}, deferred:0};
    const add = (grp, b, kind, g, gname) => {
      if (!b || !b.n) return null;
      const m = meshOf(kind, g, b.geom()); m.position.set(b.ox, 0, -b.oy); m.updateMatrix(); m.matrixAutoUpdate = false; grp.add(m);
      const s = stats.groups[gname]; s.verts += b.n; s.tris += b.tris(); s.bytes += b.bytes();
      const kk = stats.kinds[m.name] || (stats.kinds[m.name] = {verts:0, tris:0, bytes:0}); kk.verts += b.n; kk.tris += b.tris(); kk.bytes += b.bytes();
      return m;
    };
    const GNm = ['major', 'minor', 'paths'];
    for (let t = 0; t < X.T.length; t++){
      const o = X.T[t]; if (!o) continue;
      const out = {major:null, minor:null, paths:null};
      let markM = null, pathM = null;
      for (let g = 0; g < 3; g++){
        const grp = new THREE.Group(); grp.name = 'sgr-' + GNm[g] + '-' + t;
        const sm = add(grp, o.s[g], 'surf', g, GNm[g]);
        if (g === 2) pathM = sm;
        if (g === 0) markM = add(grp, o.m, 'mark', 0, 'major');
        if (g < 2) add(grp, o.st[g], 'struct', 0, GNm[g]);
        if (g === 0 && o.l && o.l.n){ add(grp, o.l, 'lamps', 0, 'major'); stats.lamps += o.l.n; }
        if (defer && only.has(t)){
          if (g === 0 && !markM && grp.children.length){ markM = placeholder('mark', 0, o.ox, o.oy); grp.add(markM); }
          if (g === 2 && !pathM && (out.major || out.minor)){ pathM = placeholder('surf', 2, o.ox, o.oy); grp.add(pathM); }
        }
        if (grp.children.length) out[GNm[g]] = grp;
      }
      if (out.major || out.minor || out.paths){ tiles.set(t, out); stats.tiles++; }
      if (defer && only.has(t) && (markM || pathM)){ DET.set(t, {t, lines, C, skip, markM, pathM, k:0, ids:null, cseen:null, X:null}); stats.deferred++; }
    }
    for (const g of GNm){ stats.verts += stats.groups[g].verts; stats.tris += stats.groups[g].tris; stats.bytes += stats.groups[g].bytes; }
    X = null;
    stats.ms = (typeof performance !== 'undefined' ? performance : Date).now() - t0;
    return {tiles, stats};
  }
  // ---------------------------------------------------------------- deferred near detail
  // A detail job rebuilds a tile's near-only content (markings, footways, lamp poles, light pools, the paths group) in slices and
  // swaps it into the tile's 'mark' and paths 'surf' meshes. Jobs run for tiles near the camera (app frame hook), nearest first.
  function detailStep(job, budget){
    const t0 = tnow(), saveX = X, C = job.C, t = job.t, n = C.TXn, tx = t % n, ty = (t/n) | 0, x0 = -HALF + tx*TILE, y0 = -HALF + ty*TILE;
    if (!job.ids){ job.ids = []; for (let j = C.tileOff[t]; j < C.tileOff[t+1]; j++) job.ids.push(C.tileLines[j]); job.cseen = new Set(); }
    X = job.X || (job.X = {T:new Array(n*n).fill(null), only:new Set([t]), C, TXn:n, geo:new Map(), st:{lines:0, piers:0, junc:0}, idx:null,
      rbb:[x0 - 160, y0 - 160, x0 + TILE + 160, y0 + TILE + 160], full:new Map(), nb:[x0 - 70, y0 - 70, x0 + TILE + 70, y0 + TILE + 70], mode:'detail'});
    try {
      const lines = job.lines;
      while (job.k < job.ids.length){
        const i = job.ids[job.k++];
        if (!(job.skip && job.skip(i))) doLine(i, lines[i]);
        if (tnow() - t0 > budget) return false;
      }
      // the junctions of the tile, in slices too
      if (!job.cxl){ job.cxl = complexList(t); job.ck = 0; }
      while (job.ck < job.cxl.length){ doComplex(job.cxl[job.ck++]); if (tnow() - t0 > budget) return false; }
      if (!job.packed){ job.packed = 1; if (tnow() - t0 > budget*0.5) return false; }
    } finally { MB = null; X = saveX; }
    // swap the new geometry into the tile's meshes
    const o = job.X.T[t], swap = (m, b) => {
      if (!m || !m.parent) return;
      const old = m.geometry;
      if (b && b.n){ const geo = b.geom(); for (const k in geo.attributes) geo.attributes[k].onUpload(freeArr); if (geo.index) geo.index.onUpload(freeArr); m.geometry = geo; }
      else m.geometry = emptyGeo(m.name);
      m.userData.sgrPending = false; if (old) old.dispose();
    };
    swap(job.markM, o && o.m); swap(job.pathM, o && o.s[2]);
    job.X = null; job.done = true;
    return true;
  }
  function freeArr(){ this.array = null; }
  // advance detail jobs of the tiles within 'range' of the camera, nearest first, for at most 'budget' ms
  function detailIdle(cam, budget, range){
    if (!DET.size || !cam) return;
    const t0 = tnow(), cx = cam.x, cy = -cam.z, h2 = Math.max(0, cam.y - 20), half = TILE/2;
    const list = [];
    for (const job of DET.values()){
      if (!job.markM && !job.pathM) continue;
      if ((job.markM && !job.markM.parent) && (job.pathM && !job.pathM.parent)){ DET.delete(job.t); continue; }
      const n = job.C.TXn, tcx = -HALF + (job.t % n + 0.5)*TILE, tcy = -HALF + (((job.t/n) | 0) + 0.5)*TILE;
      const dx = Math.max(0, Math.abs(cx - tcx) - half), dy = Math.max(0, Math.abs(cy - tcy) - half), d = Math.sqrt(dx*dx + dy*dy + h2*h2*0.81);
      if (d < range) list.push([d, job]);
    }
    list.sort((a, b) => a[0] - b[0]);
    if (list.length && list[0][0] < 900) budget = Math.max(budget, 8);     // the camera's own tile (or the next one): catch up faster
    for (const [, job] of list){
      const left = budget - (tnow() - t0); if (left <= 0) break;
      if (detailStep(job, left)) DET.delete(job.t);
    }
  }
  // finish all pending detail now (tests)
  function detailFlush(){ for (const job of [...DET.values()]){ detailStep(job, Infinity); DET.delete(job.t); } }
  // the junction complexes (with surfaces) whose centre lies in tile t
  function complexList(t){
    const C = X.C, J = C.J, seen = new Set(), out = [], n = C.TXn, x0 = -HALF + (t % n)*TILE - 100, y0 = -HALF + ((t/n) | 0)*TILE - 100, x1 = x0 + TILE + 200, y1 = y0 + TILE + 200;
    for (let j = C.tileOff[t]; j < C.tileOff[t+1]; j++){
      const i = C.tileLines[j];
      for (let p = J.lJO[i]; p < J.lJO[i+1]; p++){
        const nd = J.lJN[p]; if (J.NX[nd] < x0 || J.NX[nd] > x1 || J.NY[nd] < y0 || J.NY[nd] > y1) continue;
        const cx = J.cxOf[nd]; if (seen.has(cx)) continue; seen.add(cx);
        const r = cxGet(cx, false); if (r.type === 'N' || r.type === 'C') continue;
        if (tileOf(r.ccx, r.ccy) === t) out.push(cx);
      }
    }
    return out;
  }
  // junction complexes whose centre lies in tile t
  function complexesIn(t, seen){
    const C = X.C, J = C.J, n = C.TXn, x0 = -HALF + (t % n)*TILE - 100, y0 = -HALF + ((t/n) | 0)*TILE - 100, x1 = x0 + TILE + 200, y1 = y0 + TILE + 200;
    for (let j = C.tileOff[t]; j < C.tileOff[t+1]; j++){
      const i = C.tileLines[j];
      for (let p = J.lJO[i]; p < J.lJO[i+1]; p++){
        const nd = J.lJN[p]; if (J.NX[nd] < x0 || J.NX[nd] > x1 || J.NY[nd] < y0 || J.NY[nd] > y1) continue;
        const cx = J.cxOf[nd]; if (seen.has(cx)) continue; seen.add(cx);
        const r = cxGet(cx, false); if (r.type === 'N' || r.type === 'C') continue;
        if (tileOf(r.ccx, r.ccy) !== t) continue;
        doComplex(cx);
      }
    }
  }

  // ---------------------------------------------------------------- drivable surface query
  // surfaceAt(x, y, zHint) -> {z, c, li, dir:[dx, dy], hw, k} | null: the rendered road surface under (x, y) (the deck nearest
  // zHint where roads are stacked). k: 0 carriageway, 1 junction surface, 2 footway / median / kerb top. Built lazily per tile
  // from the same code that builds the meshes (the same triangles), cached for the 9 most recent tiles.
  let LASTSKIP = null; const IDXC = new Map(), IDXCELL = 4;
  function dropIndex(t){ const n = Math.round(2*HALF/TILE); for (const d of [0, -1, 1, -n, n, -n-1, -n+1, n-1, n+1]){ IDXC.delete(t + d); JOBS.delete(t + d); } LASTI = null; }
  // an index job: the lines and junctions near tile t, emitted surface-only into a recorder, in slices of a time budget
  function indexJob(lines, t){
    style(); initGround(); const C = prep(lines), n = C.TXn, tx = t % n, ty = (t/n) | 0;
    const x0 = -HALF + tx*TILE, y0 = -HALF + ty*TILE, x1 = x0 + TILE, y1 = y0 + TILE, ids = [], seen = new Uint8Array(lines.length);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++){
      const u = tx + dx, v = ty + dy; if (u < 0 || v < 0 || u >= n || v >= n) continue; const tt = v*n + u;
      for (let j = C.tileOff[tt]; j < C.tileOff[tt+1]; j++){
        const i = C.tileLines[j]; if (seen[i]) continue; seen[i] = 1;
        const b = i*4; if (C.LBB[b] > x1 + 160 || C.LBB[b+2] < x0 - 160 || C.LBB[b+1] > y1 + 160 || C.LBB[b+3] < y0 - 160) continue;
        ids.push(i);
      }
    }
    return {t, C, lines, x0, y0, x1, y1, ids, k:0, rb:new RecBuf(), ob:{d:new Float32Array(10*512), n:0}, cseen:new Set(), X:null, done:false, I:null};
  }
  function indexStep(job, budget){
    const t0 = tnow(), saveX = X, C = job.C;
    if (!job.built){
      X = job.X || (job.X = {T:[], only:null, C, TXn:C.TXn, geo:new Map(), st:{lines:0, piers:0, junc:0}, idx:{x0:job.x0, y0:job.y0, x1:job.x1, y1:job.y1, rb:job.rb},
        rbb:[job.x0 - 450, job.y0 - 450, job.x1 + 450, job.y1 + 450], full:new Map(), nb:[job.x0 - 175, job.y0 - 175, job.x1 + 175, job.y1 + 175], ob:job.ob});
      try {
        const J = C.J, lines = job.lines;
        while (job.k < job.ids.length){
          const i = job.ids[job.k++];
          if (!(LASTSKIP && LASTSKIP(i))) doLine(i, lines[i]);
          for (let p = J.lJO[i]; p < J.lJO[i+1]; p++){ const nd = J.lJN[p]; if (J.NX[nd] < job.x0 - 260 || J.NX[nd] > job.x1 + 260 || J.NY[nd] < job.y0 - 260 || J.NY[nd] > job.y1 + 260) continue;
            const cx = J.cxOf[nd]; if (job.cseen.has(cx)) continue; job.cseen.add(cx);
            const r = cxGet(cx, false); if (r.type === 'N' || r.type === 'C') continue;
            if (r.ccx < job.x0 - 160 || r.ccx > job.x1 + 160 || r.ccy < job.y0 - 160 || r.ccy > job.y1 + 160) continue;
            doComplex(cx); }
          if (tnow() - t0 > budget) return false;
        }
      } finally { X = saveX; }
      job.built = true; job.X = null;
      if (tnow() - t0 > budget) return false;
    }
    if (!indexGrid(job, t0, budget)) return false;
    job.done = true; job.rb = null; return true;
  }
  // the triangle grid of an index (CSR over IDXCELL cells), in budgeted phases: count, prefix, fill, compact
  function indexGrid(job, t0, budget){
    const rb = job.rb, x0 = job.x0, y0 = job.y0, x1 = job.x1, y1 = job.y1, NC = TILE/IDXCELL, p = rb.p, ix = rb.ix, nt = rb.nt;
    const G2 = job.g || (job.g = {ph:0, i:0, cnt:new Int32Array(NC*NC + 1), keep:new Uint8Array(nt), bb:new Int16Array(nt*4), ref:null, fill:null, P:null});
    const cnt = G2.cnt, keep = G2.keep, bb = G2.bb, over = () => (G2.i & 2047) === 0 && tnow() - t0 > budget;
    if (G2.ph === 0){
      for (; G2.i < nt; G2.i++){
        if (over()) return false;
        const i = G2.i, a = ix[i*3]*3, b = ix[i*3+1]*3, c = ix[i*3+2]*3;
        const mnx = Math.min(p[a], p[b], p[c]), mxx = Math.max(p[a], p[b], p[c]), mny = Math.min(p[a+1], p[b+1], p[c+1]), mxy = Math.max(p[a+1], p[b+1], p[c+1]);
        if (mxx < x0 || mnx > x1 || mxy < y0 || mny > y1) continue;
        const cx0 = Math.max(0, Math.floor((mnx - x0)/IDXCELL)), cx1 = Math.min(NC - 1, Math.floor((mxx - x0)/IDXCELL)), cy0 = Math.max(0, Math.floor((mny - y0)/IDXCELL)), cy1 = Math.min(NC - 1, Math.floor((mxy - y0)/IDXCELL));
        if ((cx1 - cx0 + 1)*(cy1 - cy0 + 1) > 600) continue;
        keep[i] = 1; bb[i*4] = cx0; bb[i*4+1] = cy0; bb[i*4+2] = cx1; bb[i*4+3] = cy1;
        for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) cnt[cy*NC + cx + 1]++;
      }
      for (let i = 0; i < NC*NC; i++) cnt[i+1] += cnt[i];
      G2.ref = new Int32Array(cnt[NC*NC]); G2.fill = cnt.slice(0, NC*NC); G2.ph = 1; G2.i = 0;
      if (tnow() - t0 > budget) return false;
    }
    if (G2.ph === 1){
      const ref = G2.ref, fill = G2.fill;
      for (; G2.i < nt; G2.i++){
        if (over()) return false;
        const i = G2.i; if (!keep[i]) continue;
        for (let cy = bb[i*4+1]; cy <= bb[i*4+3]; cy++) for (let cx = bb[i*4]; cx <= bb[i*4+2]; cx++) ref[fill[cy*NC + cx]++] = i;
      }
      G2.ph = 2; G2.i = 0; G2.fill = null;
      if (tnow() - t0 > budget) return false;
    }
    // compact vertex positions (float32 relative to the tile corner)
    const P = new Float32Array(rb.n*3); for (let i = 0; i < rb.n; i++){ P[i*3] = p[i*3] - x0; P[i*3+1] = p[i*3+1] - y0; P[i*3+2] = p[i*3+2]; }
    job.I = {x0, y0, NC, cnt, ref:G2.ref, P, ix:rb.ix.slice(0, nt*3), at:rb.at.slice(0, nt*4), ai:rb.ai.slice(0, nt*2), nt, ob:obGrid(job.ob, x0, y0)};
    job.g = null;
    return true;
  }
  // roadDrive: the obstacles of an index in an 8 m grid over its tile (CSR); records outside the tile (+ 6 m) are dropped
  function obGrid(O, x0, y0){
    const CS = 8, NC = TILE/CS, n = O.n, d = O.d, bb = new Int16Array(n*4), cnt = new Int32Array(NC*NC + 1), keep = new Uint8Array(n);
    const cl = v => v < 0 ? 0 : v >= NC ? NC - 1 : v;
    for (let i = 0; i < n; i++){
      const o = i*10; let mnx, mxx, mny, mxy;
      if (d[o] === 0){ const r = d[o+5]; mnx = Math.min(d[o+1], d[o+3]) - r; mxx = Math.max(d[o+1], d[o+3]) + r; mny = Math.min(d[o+2], d[o+4]) - r; mxy = Math.max(d[o+2], d[o+4]) + r; }
      else { const ex = Math.abs(d[o+3])*d[o+8] + Math.abs(d[o+4])*d[o+9], ey = Math.abs(d[o+4])*d[o+8] + Math.abs(d[o+3])*d[o+9]; mnx = d[o+1] - ex; mxx = d[o+1] + ex; mny = d[o+2] - ey; mxy = d[o+2] + ey; }
      if (mxx < x0 - 6 || mnx > x0 + TILE + 6 || mxy < y0 - 6 || mny > y0 + TILE + 6) continue;
      keep[i] = 1; const a = cl(Math.floor((mnx - x0)/CS)), b = cl(Math.floor((mny - y0)/CS)), c = cl(Math.floor((mxx - x0)/CS)), e = cl(Math.floor((mxy - y0)/CS));
      bb[i*4] = a; bb[i*4+1] = b; bb[i*4+2] = c; bb[i*4+3] = e;
      for (let cy = b; cy <= e; cy++) for (let cx = a; cx <= c; cx++) cnt[cy*NC + cx + 1]++;
    }
    for (let i = 0; i < NC*NC; i++) cnt[i+1] += cnt[i];
    const ref = new Int32Array(cnt[NC*NC]), fill = cnt.slice(0, NC*NC);
    for (let i = 0; i < n; i++){ if (!keep[i]) continue; for (let cy = bb[i*4+1]; cy <= bb[i*4+3]; cy++) for (let cx = bb[i*4]; cx <= bb[i*4+2]; cx++) ref[fill[cy*NC + cx]++] = i; }
    return {d:d.slice(0, n*10), n, CS, NC, cnt, ref, stamp:new Int32Array(n), q:0};
  }
  // the index of the tile under (x, y), if it is built
  function idxAt(x, y){ const n = Math.round(2*HALF/TILE), tx = Math.floor((x + HALF)/TILE), ty = Math.floor((y + HALF)/TILE); if (tx < 0 || ty < 0 || tx >= n || ty >= n) return null; return IDXC.get(ty*n + tx) || null; }
  // push a circle (x, y, r), solid from z0 to z1, out of the obstacles near it: the deepest penetration in out {depth, nx, ny} (normal away
  // from the obstacle); returns the number of obstacles touched, -1 when the index of the tile is not built yet
  function pushCircle(x, y, r, z0, z1, out){
    out.depth = 0; const I = idxAt(x, y); if (!I) return -1; const O = I.ob; if (!O || !O.n) return 0;
    const CS = O.CS, NC = O.NC, d = O.d, cl = v => v < 0 ? 0 : v >= NC ? NC - 1 : v;
    const a = cl(Math.floor((x - r - I.x0)/CS)), b = cl(Math.floor((y - r - I.y0)/CS)), c = cl(Math.floor((x + r - I.x0)/CS)), e = cl(Math.floor((y + r - I.y0)/CS));
    const q = ++O.q; let hit = 0;
    for (let cy = b; cy <= e; cy++) for (let cx = a; cx <= c; cx++){ const k = cy*NC + cx;
      for (let p = O.cnt[k]; p < O.cnt[k+1]; p++){
        const id = O.ref[p]; if (O.stamp[id] === q) continue; O.stamp[id] = q;
        const o = id*10; if (d[o+7] < z0 || d[o+6] > z1) continue;
        let pen, nx, ny;
        if (d[o] === 0){
          const ax = d[o+1], ay = d[o+2], ex = d[o+3] - ax, ey = d[o+4] - ay, l2 = ex*ex + ey*ey; let t = l2 > 1e-9 ? ((x - ax)*ex + (y - ay)*ey)/l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
          const px = x - ax - ex*t, py = y - ay - ey*t, dd = Math.sqrt(px*px + py*py); pen = r + d[o+5] - dd; if (pen <= 0) continue;
          if (dd > 1e-6){ nx = px/dd; ny = py/dd; } else { const l = Math.sqrt(l2) || 1; nx = -ey/l; ny = ex/l; }
        } else {
          const ux = d[o+3], uy = d[o+4], dx = x - d[o+1], dy = y - d[o+2], la = dx*ux + dy*uy, lb = -dx*uy + dy*ux, ha = d[o+8], hb = d[o+9];
          const qa = la < -ha ? -ha : la > ha ? ha : la, qb = lb < -hb ? -hb : lb > hb ? hb : lb, ea = la - qa, eb = lb - qb, dd = Math.sqrt(ea*ea + eb*eb);
          let na, nb;
          if (dd > 1e-6){ if (dd >= r) continue; pen = r - dd; na = ea/dd; nb = eb/dd; }
          else { const pa = ha - Math.abs(la), pb = hb - Math.abs(lb); if (pa < pb){ na = la < 0 ? -1 : 1; nb = 0; pen = pa + r; } else { na = 0; nb = lb < 0 ? -1 : 1; pen = pb + r; } }
          nx = na*ux - nb*uy; ny = na*uy + nb*ux;
        }
        hit++; if (pen > out.depth){ out.depth = pen; out.nx = nx; out.ny = ny; }
      } }
    return hit;
  }
  // the obstacles within r of (x, y) (tests): [{type, x0, y0, x1, y1, r, z0, z1, a, b}]
  function obstaclesNear(x, y, r){
    const I = idxAt(x, y); if (!I || !I.ob) return null; const O = I.ob, d = O.d, out = [];
    for (let i = 0; i < O.n; i++){ const o = i*10, cx = d[o] === 0 ? (d[o+1] + d[o+3])*0.5 : d[o+1], cy = d[o] === 0 ? (d[o+2] + d[o+4])*0.5 : d[o+2], ext = d[o] === 0 ? hyp(d[o+3] - d[o+1], d[o+4] - d[o+2])*0.5 + d[o+5] : d[o+8] + d[o+9];
      if (hyp(cx - x, cy - y) > r + ext) continue; out.push({type:d[o] ? 'box' : 'capsule', x0:d[o+1], y0:d[o+2], x1:d[o+3], y1:d[o+4], r:d[o+5], z0:d[o+6], z1:d[o+7], a:d[o+8], b:d[o+9]}); }
    return out;
  }
  function buildIndex(lines, t){ const job = indexJob(lines, t); indexStep(job, Infinity); return job.I; }
  // advance index jobs for the tiles around (x, y) within a time budget (ms); returns true when they are all ready
  const JOBS = new Map(); let LASTQ = null;
  function surfacePrefetch(x, y, budget, vx, vy){
    const lines = curLines(); if (!lines) return true;
    const n = Math.round(2*HALF/TILE), t0 = tnow(); budget = budget === undefined ? 3 : budget;
    const want = [], add = (px, py) => { const tx = Math.floor((px + HALF)/TILE), ty = Math.floor((py + HALF)/TILE); if (tx < 0 || ty < 0 || tx >= n || ty >= n) return; const t = ty*n + tx; if (!want.includes(t)) want.push(t); };
    // the tile under the querier, then where it will be in 2-8 s (velocity), then a 380 m box around it
    add(x, y);
    let soon = 0;
    if (vx || vy){ for (const s of [2, 4, 8]){ add(x + vx*s, y + vy*s); if (s === 2) soon = want.length; } }
    for (const dx of [0, -380, 380]) for (const dy of [0, -380, 380]) add(x + dx, y + dy);
    // a tile the querier reaches within ~2 s that is still not indexed: spend more this frame
    for (let i = 0; i < soon; i++) if (!IDXC.has(want[i])){ budget = Math.max(budget, 6); break; }
    let all = true;
    for (const t of want){
      if (IDXC.has(t)) continue;
      all = false; if (tnow() - t0 >= budget) break;
      let job = JOBS.get(t); if (!job){ job = indexJob(lines, t); JOBS.set(t, job); }
      if (indexStep(job, budget - (tnow() - t0))){ JOBS.delete(t); putIndex(t, job.I); }
    }
    return all;
  }
  function putIndex(t, I){ IDXC.set(t, I); if (IDXC.size > 9){ const k = IDXC.keys().next().value; IDXC.delete(k); } }
  const curLines = () => { try { if (typeof SGR !== 'undefined' && SGR.lines) return SGR.lines; } catch (e){} return LINES0; };
  const SR = {z:0, c:0, li:-1, dir:[1, 0], hw:0, k:0};
  function surfaceAt(x, y, zHint){
    const lines = curLines(); if (!lines) return null;
    const n = Math.round(2*HALF/TILE), tx = Math.floor((x + HALF)/TILE), ty = Math.floor((y + HALF)/TILE); if (tx < 0 || ty < 0 || tx >= n || ty >= n) return null;
    const t = ty*n + tx; let I = IDXC.get(t);
    const tq = tnow();
    if (LASTQ){
      // the querier's velocity (smoothed over >= 0.1 s) for look-ahead prefetching
      const dt = (tq - LASTQ.t0)/1000;
      if (dt >= 0.1){ const vx = (x - LASTQ.x0)/dt, vy = (y - LASTQ.y0)/dt; if (vx*vx + vy*vy < 250*250){ LASTQ.vx = LASTQ.vx*0.5 + vx*0.5; LASTQ.vy = LASTQ.vy*0.5 + vy*0.5; } LASTQ.x0 = x; LASTQ.y0 = y; LASTQ.t0 = tq; }
      LASTQ.x = x; LASTQ.y = y; LASTQ.t = tq;
    } else LASTQ = {x, y, t:tq, x0:x, y0:y, t0:tq, vx:0, vy:0};
    if (!I){ let job = JOBS.get(t); if (!job) job = indexJob(lines, t); indexStep(job, Infinity); JOBS.delete(t); I = job.I; putIndex(t, I); }
    else if (IDXC.size > 1 && I !== LASTI){ IDXC.delete(t); IDXC.set(t, I); }
    LASTI = I;
    const lx = x - I.x0, ly = y - I.y0, cx = Math.floor(lx/IDXCELL), cy = Math.floor(ly/IDXCELL); if (cx < 0 || cy < 0 || cx >= I.NC || cy >= I.NC) return null;
    const c0 = I.cnt[cy*I.NC + cx], c1 = I.cnt[cy*I.NC + cx + 1], P = I.P, ix = I.ix;
    let best = -1, bz = 0, bd = Infinity, bk = 9;
    const zh = zHint === undefined || zHint === null ? Infinity : zHint;
    for (let q = c0; q < c1; q++){
      const i = I.ref[q], a = ix[i*3]*3, b = ix[i*3+1]*3, c = ix[i*3+2]*3;
      const ax = P[a], ay = P[a+1], bx = P[b], by = P[b+1], qx = P[c], qy = P[c+1];
      const d = (by - qy)*(ax - qx) + (qx - bx)*(ay - qy); if (Math.abs(d) < 1e-9) continue;
      const u = ((by - qy)*(lx - qx) + (qx - bx)*(ly - qy))/d, v = ((qy - ay)*(lx - qx) + (ax - qx)*(ly - qy))/d, w = 1 - u - v;
      if (u < -1e-4 || v < -1e-4 || w < -1e-4) continue;
      const z = u*P[a+2] + v*P[b+2] + w*P[c+2], k = I.at[i*4+3];
      const dz = zh === Infinity ? -z : Math.abs(z - zh);
      // same deck: prefer the higher surface within 3 cm (kerbs over road), carriageway over junction over footway when level
      if (dz < bd - 0.03 || (Math.abs(dz - bd) <= 0.03 && (z > bz + 0.005 || (Math.abs(z - bz) <= 0.005 && k < bk)))){ bd = dz; best = i; bz = z; bk = k; }
    }
    if (best < 0) return null;
    SR.z = bz; SR.li = I.ai[best*2]; SR.c = I.ai[best*2+1]; SR.dir = [I.at[best*4], I.at[best*4+1]]; SR.hw = I.at[best*4+2]; SR.k = I.at[best*4+3];
    return {z:SR.z, c:SR.c, li:SR.li, dir:SR.dir, hw:SR.hw, k:SR.k};
  }
  let LINES0 = null, LASTI = null, RECD = null;
  // while something queries the surface (a car), prepare the indexes around it in small slices (app frame hook)
  function surfaceIdle(){ if (!LASTQ || tnow() - LASTQ.t > 1500) return; surfacePrefetch(LASTQ.x, LASTQ.y, 2.5, LASTQ.vx, LASTQ.vy); }

  // ---------------------------------------------------------------- labels: one anchor per name per ~2.5 km, on a long straight piece
  function labels(lines){
    initGround();
    const by = new Map();
    for (let i = 0; i < lines.length; i++){
      const L = lines[i]; if (L.c > 10) continue;
      const en = L.name ? L.name[0] : '', key = en || L.ref; if (!key) continue;
      let g = by.get(key); if (!g) by.set(key, g = {en:en || null, zh:(L.name && L.name[1]) || null, ref:L.ref || null, cls:L.c, total:0, cand:[], foreign:(L.flags & 8) !== 0});
      if (L.c < g.cls) g.cls = L.c; if (!g.ref && L.ref) g.ref = L.ref; if (!g.zh && L.name && L.name[1]) g.zh = L.name[1];
      const P = L.P, E = L.E, np = P.length >> 1; if (np < 2) continue;
      let rs = 0, h0 = null, len = 0;
      const flush = (k1) => {
        if (len < 1) return;
        // midpoint of the run [rs, k1]
        let acc = 0, half = len*0.5;
        for (let k = rs; k < k1; k++){
          const ax = P[k*2], ay = P[k*2+1], bx = P[k*2+2], by2 = P[k*2+3], d = hyp(bx - ax, by2 - ay);
          if (acc + d >= half){ const f = d > 0 ? (half - acc)/d : 0, x = ax + (bx - ax)*f, y = ay + (by2 - ay)*f, e = E ? E[k] + (E[k+1] - E[k])*f : 0;
            let a = Math.atan2(P[k1*2+1] - P[rs*2+1], P[k1*2] - P[rs*2]); if (a > Math.PI/2) a -= Math.PI; else if (a <= -Math.PI/2) a += Math.PI;
            g.cand.push({len, x, y, z:G(x, y) + e + OFF[L.c], dir:a}); return; }
          acc += d;
        }
      };
      for (let k = 0; k < np - 1; k++){
        const dx = P[k*2+2] - P[k*2], dy = P[k*2+3] - P[k*2+1], d = hyp(dx, dy); if (d < 0.05) continue;
        const h = Math.atan2(dy, dx);
        if (h0 === null) h0 = h;
        let df = h - h0; while (df > Math.PI) df -= 2*Math.PI; while (df < -Math.PI) df += 2*Math.PI;
        if (Math.abs(df) > 0.21 && len > 0){ flush(k); rs = k; h0 = h; len = 0; }
        len += d; g.total += d;
      }
      flush(np - 1);
    }
    const out = [];
    for (const g of by.values()){
      if (!g.cand.length) continue;
      const n = Math.max(1, Math.round(g.total/2500)), minD = Math.max(350, Math.min(2000, g.total/n*0.55));
      g.cand.sort((a, b) => b.len - a.len);
      const pick = [];
      for (const c of g.cand){
        if (pick.length >= n) break;
        if (pick.length && c.len < 40) break;
        let ok = true; for (const p of pick) if (hyp(p.x - c.x, p.y - c.y) < minD){ ok = false; break; }
        if (ok) pick.push(c);
      }
      for (const p of pick) out.push({en:g.en, zh:g.zh, ref:g.ref, x:p.x, y:p.y, z:p.z, cls:g.cls, dir:p.dir, foreign:g.foreign});
    }
    return out;
  }

  // ---------------------------------------------------------------- traffic graph: [x0, y0, x1, y1, gcls, z0, z1] for classes 0-10
  function graph(lines){
    const out = [];
    for (let i = 0; i < lines.length; i++){
      const L = lines[i], c = L.c; if (c > 10) continue;
      const gc = c <= 1 ? 2 : c <= 9 ? 1 : 0, P = L.P, E = L.E, np = P.length >> 1;
      for (let k = 0; k < np - 1; k++){
        const x0 = P[k*2], y0 = P[k*2+1], x1 = P[k*2+2], y1 = P[k*2+3]; if (x0 === x1 && y0 === y1) continue;
        out.push([x0, y0, x1, y1, gc, E ? E[k] : 0, E ? E[k+1] : 0]);
      }
    }
    return out;
  }

  // optional: build the per-lines caches (tile index, junction graph, road / flyover grids) up front, e.g. right after decode
  function prepare(lines){
    const t0 = (typeof performance !== 'undefined' ? performance : Date).now();
    initGround(); const C = prep(lines); roadGrid(C); elevGrid(C); LINES0 = lines;
    return (typeof performance !== 'undefined' ? performance : Date).now() - t0;
  }
  // drop the per-lines caches (they also go away with the lines array)
  function dispose(lines){ CACHE.delete(lines); IDXC.clear(); JOBS.clear(); LASTI = null; }
  return {decode, prepare, build, labels, graph, get materials(){ style(); return mats(); }, dispose, setUS:v => { USSET = v === null || v === undefined ? null : !!v; style(); }, get us(){ return US; }, ground:(x, y) => { initGround(); return G(x, y); }, setStructSkip:f => { STRUCTSKIP = f; },
    surfaceAt, surfacePrefetch, surfaceIdle, detailIdle, surfaceReady:(x, y) => !!idxAt(x, y), pushCircle, obstaclesNear, detailFlush, setDefer:v => { DEFER = !!v; }, pendingDetail:() => DET.size, setLines:l => { LINES0 = l; }, version:'sgr-2',
    _dbg:{DBG, prep, rec:on => { RECD = on ? {piers:[], poles:[]} : null; return RECD; }, get recd(){ return RECD; }, index:t => buildIndex(curLines(), t), G:(x, y) => { initGround(); return G(x, y); }, idx:() => [...IDXC.keys()], jobs:() => [...JOBS.keys()], cxGet:(lines, cx, full) => { const C = prep(lines); const sx = X; X = {T:[], only:null, C, TXn:C.TXn, geo:new Map(), st:{lines:0, piers:0, junc:0}, idx:null}; try { return cxGet(cx, full); } finally { X = sx; } }}};
})();

// a handle for page scripts and tests (the app keeps its modules in one script scope)
if (typeof window !== 'undefined') window.SGRoads = SGRoads;
// in the app: prepare drivable-surface indexes around a car between frames
if (typeof HOOKS !== 'undefined' && HOOKS.frame){
  SGRoads.setDefer(true);
  HOOKS.frame.push(() => { SGRoads.surfaceIdle(); if (typeof camera !== 'undefined' && camera) SGRoads.detailIdle(camera.position, 3, 6600); });
}

// kit test harness only (the app sets window.SGR_APP before this code)
if (typeof window !== 'undefined' && window.ENV && !window.SGR_APP){
  const _sgrSrc = (document.currentScript && document.currentScript.src) || '';
  window.MODULE_INIT = async ENV => {
    const q = new URLSearchParams(_sgrSrc.split('?')[1] || ''), log = (...a) => console.log('[log] ' + a.join(' '));
    const buf = await ENV.loadBin('../out/sg_roads.bin.gz');
    const lines = SGRoads.decode(buf, ENV.BASE.names, ENV.BASE.refs);
    const R = (q.get('r') ? +q.get('r') : 4000);
    const centres = q.get('near') ? q.get('near').split('|').map(s => s.split(';').map(Number)) : [[1.2840, 103.8560]];
    const only = new Set(), TXn = Math.round(2*HALF/2000);
    for (const c of centres){
      const [x, y] = ENV.sgXY(c[0], c[1]), r = c[2] || R;
      for (let ty = 0; ty < TXn; ty++) for (let tx = 0; tx < TXn; tx++){
        const x0 = -HALF + tx*2000, y0 = -HALF + ty*2000, dx = Math.max(x0 - x, 0, x - x0 - 2000), dy = Math.max(y0 - y, 0, y - y0 - 2000);
        if (hyp(dx, dy) <= r) only.add(ty*TXn + tx);
      }
    }
    const res = SGRoads.build(lines, {only}), st = res.stats;
    log('build', only.size, 'tiles', st.ms.toFixed(0), 'ms', 'tris', st.tris);
    for (const [, o] of res.tiles) for (const k of ['major', 'minor', 'paths']) if (o[k]) ENV.scene.add(o[k]);
  };
}
