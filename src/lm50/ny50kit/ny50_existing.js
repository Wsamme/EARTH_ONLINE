// List every NYC landmark / site defined by the modules R/nyc/<d>/<d>.js (evaluated, not grepped), with place, r and module.
// usage: node ny50_existing.js [out.json]
const fs = require('fs'), vm = require('vm');
const R = '/home/claude/earth_online/src/';
const dirs = fs.readdirSync(R + 'nyc').filter(d => fs.existsSync(`${R}nyc/${d}/${d}.js`)).sort();
const stub = new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : stub, apply: () => stub, construct: () => stub });
const ctx = { LANDMARKS: {}, SITES: {}, SG_PLACES: [], Math, JSON, Object, Array, Number, String, Set, Map, Float32Array, Float64Array, Uint8Array, Uint16Array, Uint32Array, Int32Array, console, isFinite, parseFloat, parseInt };
const sandbox = new Proxy(ctx, { has: () => true, get: (t, k) => (k in t ? t[k] : (k === Symbol.unscopables ? undefined : stub)), set: (t, k, v) => { t[k] = v; return true; } });
const from = {}, errs = [];
for (const d of dirs) {
  const src = fs.readFileSync(`${R}nyc/${d}/${d}.js`, 'utf8');
  const n0 = ctx.SG_PLACES.length;
  const before = new Set([...Object.keys(ctx.LANDMARKS), ...Object.keys(ctx.SITES)]);
  try { new Function('sb', `with (sb) {\n${src}\n}`)(sandbox); } catch (e) { errs.push(d + ': ' + e.message); }
  for (const k of [...Object.keys(ctx.LANDMARKS), ...Object.keys(ctx.SITES)]) if (!before.has(k)) from[k] = d;
  for (let i = n0; i < ctx.SG_PLACES.length; i++) ctx.SG_PLACES[i]._mod = d;
}
const out = [];
for (const p of ctx.SG_PLACES) {
  const L = ctx.LANDMARKS[p.type] || {};
  out.push({ key: p.type, kind: 'lm', mod: p._mod, en: L.en, zh: L.zh, lat: p.lat, lon: p.lon, r: L.r, h: L.h, label: L.label !== false && !L.sub });
}
for (const [k, s] of Object.entries(ctx.SITES)) out.push({ key: k, kind: 'site', mod: from[k], en: s.en, zh: s.zh, lat: s.lat, lon: s.lon, r: s.r, h: s.h, label: s.label !== false });
const placed = new Set(ctx.SG_PLACES.map(p => p.type));
const unplaced = Object.keys(ctx.LANDMARKS).filter(k => !placed.has(k));
console.log('modules', dirs.length, 'LANDMARKS', Object.keys(ctx.LANDMARKS).length, 'placements', ctx.SG_PLACES.length, 'SITES', Object.keys(ctx.SITES).length, 'unplaced', unplaced.join(' ') || '-');
if (errs.length) console.log('load errors:', errs.join(' | '));
fs.writeFileSync(process.argv[2] || '/dev/stdout', JSON.stringify(out, null, 0).replace(/},{/g, '},\n{'));
