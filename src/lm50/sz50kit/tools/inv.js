// Inventory of every landmark / site on the Greater Bay page (evaluates the modules, as lmx/count.js): R/gba/*/<n>.js + gbareal/app/hklm/*.js
// usage: node inv.js > inv.json
const fs = require('fs'), path = require('path');
const R = '/home/claude/earth_online/src/';
const stub = new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : stub, apply: () => stub, construct: () => stub });
const ctx = { LANDMARKS: {}, SITES: {}, SG_PLACES: [], Math, JSON, Object, Array, Number, String, Set, Map, Float32Array, Float64Array, Uint8Array, Uint16Array, Uint32Array, Int32Array, Int16Array, Uint8ClampedArray, console:{log(){},warn(){},error(){}}, isFinite, parseFloat, parseInt, Infinity, NaN, undefined, Symbol, Date, RegExp, Error, Promise, setTimeout(){}, };
const sandbox = new Proxy(ctx, { has: () => true, get: (t, k) => (k in t ? t[k] : (k === Symbol.unscopables ? undefined : stub)), set: (t, k, v) => { t[k] = v; return true; } });
const files = [];
for (const d of fs.readdirSync(R + 'gba').sort()) if (fs.existsSync(`${R}gba/${d}/${d}.js`)) files.push(`gba/${d}/${d}.js`);
for (const f of fs.readdirSync(R + 'gbareal/app/hklm').sort()) if (f.endsWith('.js')) files.push('gbareal/app/hklm/' + f);
const errs = [], from = {};
for (const f of files) {
  const src = fs.readFileSync(R + f, 'utf8'); const n0 = ctx.SG_PLACES.length;
  const before = new Set([...Object.keys(ctx.LANDMARKS), ...Object.keys(ctx.SITES)]);
  try { new Function('sb', `with (sb) {\n${src}\n}`)(sandbox); } catch (e) { errs.push(f + ': ' + e.message); }
  for (const k of [...Object.keys(ctx.LANDMARKS), ...Object.keys(ctx.SITES)]) if (!before.has(k)) from[k] = f;
  for (let i = n0; i < ctx.SG_PLACES.length; i++) ctx.SG_PLACES[i]._f = f;
}
const out = [];
for (const p of ctx.SG_PLACES) { const L = ctx.LANDMARKS[p.type] || {}; out.push({k:p.type, f:p._f, lat:+p.lat, lon:+p.lon, r:+L.r || 0, h:+L.h || 0, zh:L.zh, en:L.en, label:L.label !== false, site:false}); }
for (const [k, s] of Object.entries(ctx.SITES)) out.push({k, f:from[k], lat:+s.lat, lon:+s.lon, r:+s.r || 0, h:+s.h || 0, zh:s.zh, en:s.en, label:s.label !== false, site:true, keep:Array.isArray(s.keep) ? s.keep : (typeof s.keep === "number" ? s.keep : null)});
const placed = new Set(ctx.SG_PLACES.map(p => p.type));
const unplaced = Object.keys(ctx.LANDMARKS).filter(k => !placed.has(k));
console.log(JSON.stringify({errs, unplaced, n_lm:Object.keys(ctx.LANDMARKS).length, n_sites:Object.keys(ctx.SITES).length, items:out}, null, 0));
