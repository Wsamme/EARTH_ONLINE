// List every placed landmark key of a city (like the app: build order, last placement wins):
// node SC/lm31/kit/lmlist.js <sg|bay|nyc> [out.json]  -> [{key, zh, en, cat, h, r, label, lat, lon, file, desc}]
const fs = require('fs'), vm = require('vm');
const SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
const [city, out] = process.argv.slice(2);
const ls = d => fs.existsSync(SC + d) ? fs.readdirSync(SC + d).filter(k => fs.existsSync(SC + d + '/' + k + '/' + k + '.js')).sort().map(k => d + '/' + k + '/' + k + '.js') : [];
let files;
if (city === 'sg'){
  const src = fs.readFileSync(SC + 'sgreal/patch17.py', 'utf8'); files = [];
  for (const x of src.matchAll(/'((?:lm16|lm18|lm20\/w\d|lm22|lm27\/flyer|sgtest_uss|lm26|lm29|lm40)[^']*\.js)'/g)) if (!files.includes(x[1]) && fs.existsSync(SC + x[1])) files.push(x[1]);
} else files = ls(city === 'bay' ? 'bay' : 'nyc');
global.THREE = require(SC + 'vend/package/build/three.min.js'); global.navigator = {userAgent:'node'}; global.window = global;
vm.runInThisContext(fs.readFileSync(SC + 'sgreal/kit/lmbase.js', 'utf8') + '\nglobal.__P = SG_PLACES; global.__L = LANDMARKS;');
const own = new Map();
for (const f of files){ const n0 = __P.length; try { vm.runInThisContext(fs.readFileSync(SC + f, 'utf8'), {filename:f}); } catch (e){ console.error('(skip ' + f + ': ' + String(e.message).slice(0, 80) + ')'); }
  for (let i = n0; i < __P.length; i++) own.set(__P[i].type, [__P[i], f]); }
// target descriptions (lm26/lm29/lm30 targets files) help the writers
const desc = {};
for (const t of ['lm26/targets_' + city + '.py', 'lm29/targets_' + city + '.py', 'lm30/targets_' + city + '.py']){ if (!fs.existsSync(SC + t)) continue;
  for (const m of fs.readFileSync(SC + t, 'utf8').matchAll(/\('([a-z0-9_]+)', ['"](.*?)['"], -?\d/g)) desc[m[1]] = m[2]; }
const L = [];
for (const [k, [p, f]] of own){ const d = __L[k]; if (!d) continue; L.push({key:k, zh:d.zh, en:d.en, cat:d.cat, h:d.h, r:d.r, label:d.label !== false, lat:+(+p.lat).toFixed(6), lon:+(+p.lon).toFixed(6), file:f, desc:desc[k] || ''}); }
console.log(city, 'placed', L.length, 'labelled', L.filter(x => x.label).length);
if (out) fs.writeFileSync(out, JSON.stringify(L, null, 0));
