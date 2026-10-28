// Count landmarks / sites per city by evaluating the modules (not by grep).
// usage: node count.js <hk|tyo> [module folders, default all SC/<city>/*/<name>.js]
const fs = require('fs'), path = require('path'), vm = require('vm');
const SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
const city = process.argv[2];
let dirs = process.argv[3] ? process.argv[3].split(',') : fs.readdirSync(SC + city).filter(d => fs.existsSync(`${SC}${city}/${d}/${d}.js`)).sort();
// a stub that absorbs any use (call, property, construct)
const stub = new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : stub, apply: () => stub, construct: () => stub });
const ctx = { LANDMARKS: {}, SITES: {}, SG_PLACES: [], Math, JSON, Object, Array, Number, String, Set, Map, Float32Array, Float64Array, Uint8Array, Uint16Array, Uint32Array, Int32Array, console, isFinite, parseFloat, parseInt };
const sandbox = new Proxy(ctx, { has: () => true, get: (t, k) => (k in t ? t[k] : (k === Symbol.unscopables ? undefined : stub)), set: (t, k, v) => { t[k] = v; return true; } });
vm.createContext(ctx);
const errs = [];
const from = {};
for (const d of dirs) {
  const src = fs.readFileSync(`${SC}${city}/${d}/${d}.js`, 'utf8');
  const before = new Map([...Object.entries(ctx.LANDMARKS), ...Object.entries(ctx.SITES)]);
  try { new Function('sb', `with (sb) {\n${src}\n}`)(sandbox); } catch (e) { errs.push(d + ': ' + e.message); }
  for (const k of [...Object.keys(ctx.LANDMARKS), ...Object.keys(ctx.SITES)]) { const o = ctx.LANDMARKS[k] || ctx.SITES[k]; if (!before.has(k)) from[k] = d; else if (before.get(k) !== o) from[k] = from[k] + '>' + d; }
}
const placed = new Map(), pfrom = {}; for (const p of ctx.SG_PLACES) placed.set(p.type, (placed.get(p.type) || 0) + 1);
const lab = (o) => o && o.label !== false && !o.sub;
const L = Object.entries(ctx.LANDMARKS), S = Object.entries(ctx.SITES);
const labL = L.filter(([k, o]) => lab(o)), labS = S.filter(([k, o]) => lab(o));
console.log(city, 'modules', dirs.length, '| LANDMARKS', L.length, 'labelled', labL.length, '| SITES', S.length, 'labelled', labS.length, '| total labelled', labL.length + labS.length);
const byMod = {}; for (const [k, o] of [...labL, ...labS]) { const m = from[k]; (byMod[m] = byMod[m] || []).push(k); }
for (const m of Object.keys(byMod).sort()) console.log('  ' + m.padEnd(28), byMod[m].length, byMod[m].join(' '));
const dup = [...placed].filter(([k, n]) => n > 1); if (dup.length) console.log('placed more than once:', dup.map(([k, n]) => k + 'x' + n).join(' '));
const unplaced = L.filter(([k]) => !placed.has(k)).map(([k]) => k); if (unplaced.length) console.log('landmarks never placed:', unplaced.join(' '));
const over = Object.entries(from).filter(([k, m]) => m.includes('>')); if (over.length) console.log('defined in more than one module:', over.map(([k, m]) => k + '(' + m + ')').join(' '));
if (errs.length) console.log('load errors:', errs.join(' | '));
