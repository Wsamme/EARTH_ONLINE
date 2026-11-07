// lm40: existing Singapore landmark placements AND sites near a point:
//   node SC/lm40/kit/near.js <lat> <lon> [radius m=600]  [extra.js,...]
// Fix vs lm26/kit/near.js: it took the module list from a regex (lm16|lm18|lm20/w*|lm22|sgtest_uss|lm26) and so missed
// lm29 (nusduke, nusbt), lm27/flyer and every SITE (nus, ntu, changi, uss, gardens). This one reads the real MODS list of
// sgreal/patch17.py (every file in it that pushes SG_PLACES or assigns SITES), then all SC/lm40/<g>/<g>.js, then the extra
// files given. The last placement of a key wins. Sites print with their r (distance to the site anchor, 'SITE r=').
const fs = require('fs'), vm = require('vm');
const SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
const a = process.argv.slice(2); if (a[0] === 'sg') a.shift();   // tolerate the old "sg" city argument
const lat = +a[0], lon = +a[1], R = +(a[2] || 600), extra = (a[3] || '').split(',').filter(Boolean);
const MX = [111290.5, 110574];
const src = fs.readFileSync(SC + 'sgreal/patch17.py', 'utf8'), head = src.slice(0, src.indexOf("CITY = os.environ"));
let files = [];
for (const m of head.matchAll(/MODS \+?= \[([^\]]*)\]/g)) for (const x of m[1].matchAll(/'([^']+\.js)'/g)) {
  const f = x[1]; if (files.includes(f) || !fs.existsSync(SC + f)) continue;
  const t = fs.readFileSync(SC + f, 'utf8'); if (/SG_PLACES\.push|Object\.assign\(SITES/.test(t)) files.push(f); }
const ls = d => fs.existsSync(SC + d) ? fs.readdirSync(SC + d).filter(k => fs.existsSync(SC + d + '/' + k + '/' + k + '.js')).sort().map(k => d + '/' + k + '/' + k + '.js') : [];
for (const f of ls('lm40').concat(extra)) if (!files.includes(f)) files.push(f);
global.window = global; global.HOOKS = new Proxy({}, {get:(o, k) => o[k] || (o[k] = [])}); global.THREE = require(SC + 'vend/package/build/three.min.js'); global.navigator = {userAgent:'node'};
vm.runInThisContext(fs.readFileSync(SC + 'sgreal/kit/lmbase.js', 'utf8') + '\nglobal.__P = SG_PLACES; global.__S = SITES;\nvar sgXY = (lat, lon) => [(lon - 103.775)*111290.5, (lat - 1.320)*110574], sgLL = (x, y) => [1.320 + y/110574, 103.775 + x/111290.5];');
const own = new Map(), sown = new Map();
for (const f of files){ const n0 = __P.length, s0 = new Set(Object.keys(__S));
  try { vm.runInThisContext(fs.readFileSync(SC + f, 'utf8'), {filename:f}); } catch (e){ console.log('(skip ' + f + ': ' + String(e.message).slice(0, 60) + ')'); }
  for (let i = n0; i < __P.length; i++) own.set(__P[i].type, [__P[i], f]);
  for (const k of Object.keys(__S)) if (!s0.has(k)) sown.set(k, [__S[k], f]); }
const out = [];
for (const [k, [p, f]] of own){ const d = Math.hypot((p.lon - lon)*MX[0], (p.lat - lat)*MX[1]); if (d <= R) out.push([d, k, f, `(${p.lat}, ${p.lon})`]); }
for (const [k, [s, f]] of sown){ if (s.lat == null) continue; const d = Math.hypot((s.lon - lon)*MX[0], (s.lat - lat)*MX[1]); if (d <= R + (s.r || 0)) out.push([d, k, f, `SITE r=${s.r} (${s.lat}, ${s.lon})` + (d <= (s.r || 0) ? '  <-- INSIDE site radius' : '')]); }
out.sort((x, y) => x[0] - y[0]);
for (const [d, k, f, t] of out) console.log(k.padEnd(18), String(Math.round(d)).padStart(5) + ' m ', f, t);
