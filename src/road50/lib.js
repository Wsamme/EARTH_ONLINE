// road50/lib.js — load a city's road data the way the app does (SGRoads.decode + SGRoads._dbg.prep from sgreal/mod_roads/roads.js)
// and SGR1 encode for repaired lines. Node only; no three.js needed for decode / prep.
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib'), vm = require('vm');
const R = path.resolve(__dirname, '..');
const SITE = path.resolve(R, '..', 'site');
const CITIES = {
  sg:  {dir:'sgdata',  roads:'sg_roads.bin',  base:'sg_base.bin'},
  hk:  {dir:'hkdata',  roads:'hk_roads.bin',  base:'hk_base.bin'},
  nyc: {dir:'nycdata', roads:'nyc_roads.bin', base:'nyc_base.bin'},
  tyo: {dir:'tyodata', roads:'tyo_roads.bin', base:'tyo_base.bin'},
  bay: {dir:'baydata', roads:'bay_roads.bin', base:'bay_base.bin'},
  gba: {dir:'gbadata', roads:null, base:'gba_base.txt', chunks:true},
};
function readGz(p){
  const b = fs.readFileSync(p);
  if (p.endsWith('.txt')) return zlib.gunzipSync(Buffer.from(b.toString('latin1').trim(), 'base64'));
  return (b[0] === 0x1f && b[1] === 0x8b) ? zlib.gunzipSync(b) : b;
}
let ROADS_SRC = path.join(R, 'sgreal/mod_roads/roads.js');
function loadSGRoads(HALF, src){
  const ctx = {console, Math, Date, Float32Array, Float64Array, Int32Array, Int16Array, Uint8Array, Uint16Array, Uint32Array, Int8Array, Map, Set, WeakMap, Array, Object, Number, String, JSON, Error, Infinity, NaN, isFinite, parseInt, parseFloat,
    HALF, TS:70, hAt:() => 0, hC:() => 0, mulberry32:s => () => 0.5, process:{env:{}}};
  vm.createContext(ctx);
  const code = fs.readFileSync(src || ROADS_SRC, 'utf8') + '\n;this.SGRoads = SGRoads;';
  vm.runInContext(code, ctx, {filename:'roads.js'});
  return ctx.SGRoads;
}
// dir: override folder holding the city's data files (a test stage); default site/<city>data
function loadCity(city, dir){
  const C = CITIES[city]; if (!C) throw new Error('city ' + city);
  const D = dir || path.join(SITE, C.dir);
  const base = JSON.parse(readGz(path.join(D, C.base)).toString('utf8'));
  const HALF = base.HALF, SGRoads = loadSGRoads(HALF);
  let lines, chunkOf = null, bufs = [];
  if (C.chunks){
    lines = []; chunkOf = [];
    for (const ch of [...base.roadChunks].sort((a, b) => a.k - b.k)){
      const buf = readGz(path.join(D, 'gba_rc' + ch.k + '.txt')); bufs.push([ch.k, buf]);
      const L = SGRoads.decode(new Uint8Array(buf), base.names, base.refs);
      for (const l of L){ lines.push(l); chunkOf.push(ch.k); }
    }
  } else {
    const buf = readGz(path.join(D, C.roads)); bufs.push([null, buf]);
    lines = SGRoads.decode(new Uint8Array(buf), base.names, base.refs);
  }
  return {city, D, base, HALF, SGRoads, lines, chunkOf};
}
// raw record decode keeping the name / ref indices (for re-encoding)
function decodeRaw(buf){
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf); let o = 4;
  const vu = () => { let v = 0, m = 1, b; do { b = u8[o++]; v += (b & 127)*m; m *= 128; } while (b & 128); return v; };
  const n = vu(), out = new Array(n); let px = 0, py = 0;
  for (let i = 0; i < n; i++){
    const c = u8[o++], f = u8[o++], ni = vu(), ri = vu(), np = vu(), Q = new Int32Array(np*2);
    for (let k = 0; k < np; k++){ const a = vu(), b = vu(); px += (a % 2) ? -(a + 1)/2 : a/2; py += (b % 2) ? -(b + 1)/2 : b/2; Q[k*2] = px; Q[k*2+1] = py; }
    let E = null; if (f & 4){ E = new Uint8Array(np); for (let k = 0; k < np; k++) E[k] = u8[o++]; }
    out[i] = {c, f, ni, ri, Q, E};
  }
  return out;
}
// encode records {c, f, ni, ri, Q (int quarter metres), E (u8 in the record's scale) | null}
function encodeRaw(recs){
  const b = []; const u8 = v => b.push(v & 255);
  const vu = v => { v = Math.round(v); if (v < 0) throw new Error('vu<0'); while (true){ const c = v % 128; v = Math.floor(v/128); if (v){ b.push(c | 128); } else { b.push(c); return; } } };
  const vs = v => vu(v < 0 ? -2*v - 1 : 2*v);
  b.push(83, 71, 82, 49); vu(recs.length); let px = 0, py = 0;
  for (const r of recs){
    u8(r.c); u8(r.f); vu(r.ni); vu(r.ri); const np = r.Q.length >> 1; vu(np);
    for (let k = 0; k < np; k++){ vs(r.Q[k*2] - px); vs(r.Q[k*2+1] - py); px = r.Q[k*2]; py = r.Q[k*2+1]; }
    if (r.f & 4) for (let k = 0; k < np; k++) u8(r.E[k]);
  }
  return Buffer.from(b);
}
module.exports = {R, SITE, CITIES, readGz, loadSGRoads, loadCity, decodeRaw, encodeRaw};
