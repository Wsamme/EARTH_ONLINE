// lm50 (Singapore): existing landmark placements AND sites near a point (replaces lm40/kit/near.js, whose SC paths are gone).
//   node R/lm50/kit_sg/near50.js <lat> <lon> [radius m=600] [extra.js,...]
// Sources, in order (the last placement of a key wins, like the app):
//   1. SC/lm50/sg/exist_sg.json — every landmark / site of the BUILT production page, evaluated in the browser by exist50.js
//      (includes the base app's own Singapore set: MBS, Esplanade, CBD set ...);
//   2. the module files of R/sgreal/patch17.py MODS (R = /home/claude/earth_online/src) that push SG_PLACES / assign SITES;
//   3. every R/lm50/sg50*/sg50*.js (this round's groups), then the extra files given (paths absolute or relative to R).
// Sites print with their r ('SITE r='), 'INSIDE' when the point is within one.
const fs = require('fs'), vm = require('vm'), path = require('path');
const SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/', R = '/home/claude/earth_online/src/';
const a = process.argv.slice(2); if (a[0] === 'sg') a.shift();
const lat = +a[0], lon = +a[1], RAD = +(a[2] || 600), extra = (a[3] || '').split(',').filter(Boolean);
const MX = [111290.5, 110574];
const own = new Map(), sown = new Map();
const EX = [require('path').join(__dirname, 'exist_sg.json'), SC + 'lm50/sg/exist_sg.json'].find(f => fs.existsSync(f));
if (EX){ const E = JSON.parse(fs.readFileSync(EX, 'utf8'));
  for (const p of E.placed) if (p.lat != null) own.set(p.key, [{type:p.key, lat:p.lat, lon:p.lon}, 'app' + (p.label ? '' : ' (label:false)')]);
  for (const s of E.sites) sown.set(s.key, [s, 'app']); }
const src = fs.readFileSync(R + 'sgreal/patch17.py', 'utf8'), head = src.slice(0, src.indexOf('CITY = os.environ'));
let files = [];
for (const m of head.matchAll(/MODS \+?= \[([^\]]*)\]/g)) for (const x of m[1].matchAll(/'([^']+\.js)'/g)) {
  const f = x[1]; if (files.includes(f) || !fs.existsSync(R + f)) continue;
  if (/SG_PLACES\.push|Object\.assign\(SITES/.test(fs.readFileSync(R + f, 'utf8'))) files.push(f); }
const ls = d => fs.existsSync(R + d) ? fs.readdirSync(R + d).filter(k => /^sg50[a-h]$/.test(k) && fs.existsSync(R + d + '/' + k + '/' + k + '.js')).sort().map(k => d + '/' + k + '/' + k + '.js') : [];
for (const f of ls('lm50').concat(extra)) if (!files.includes(f)) files.push(f);
global.window = global; global.THREE = require(SC + 'vend/package/build/three.min.js'); global.navigator = {userAgent:'node'};
vm.runInThisContext(fs.readFileSync(require('path').join(__dirname, 'lmbase.js'), 'utf8') + '\nglobal.__P = SG_PLACES; global.__S = SITES;');
for (const f of files){ const n0 = __P.length, s0 = new Set(Object.keys(__S)), fp = path.isAbsolute(f) ? f : R + f;
  try { vm.runInThisContext(fs.readFileSync(fp, 'utf8'), {filename:f}); } catch (e){ console.log('(skip ' + f + ': ' + String(e.message).slice(0, 70) + ')'); }
  for (let i = n0; i < __P.length; i++) own.set(__P[i].type, [__P[i], f]);
  for (const k of Object.keys(__S)) if (!s0.has(k)) sown.set(k, [__S[k], f]); }
if (process.env.DUMP){ fs.writeFileSync(process.env.DUMP, JSON.stringify({places:[...own].map(([k, [p, f]]) => ({key:k, lat:p.lat, lon:p.lon, f})), sites:[...sown].map(([k, [s, f]]) => ({key:k, lat:s.lat, lon:s.lon, r:s.r, f}))})); }
const out = [];
for (const [k, [p, f]] of own){ const d = Math.hypot((p.lon - lon)*MX[0], (p.lat - lat)*MX[1]); if (d <= RAD) out.push([d, k, f, `(${(+p.lat).toFixed(6)}, ${(+p.lon).toFixed(6)})`]); }
for (const [k, [s, f]] of sown){ if (s.lat == null) continue; const d = Math.hypot((s.lon - lon)*MX[0], (s.lat - lat)*MX[1]); if (d <= RAD + (s.r || 0)) out.push([d, k, f, `SITE r=${s.r} (${s.lat}, ${s.lon})` + (d <= (s.r || 0) ? '  <-- INSIDE site radius' : '')]); }
out.sort((x, y) => x[0] - y[0]);
for (const [d, k, f, t] of out) console.log(k.padEnd(18), String(Math.round(d)).padStart(5) + ' m ', f, t);
