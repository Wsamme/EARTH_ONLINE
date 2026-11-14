// v41: append the v41 card files (lm33/info_hk/labelled_v41*.js) to lm33/info_hk/info_hk.js as one more Object.assign block.
// (build.js needs hk/targets.json and labelled.js, which are not in the repo copy.) Idempotent: replaces an earlier v41 block.
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'lm33', 'info_hk'), out = path.join(dir, 'info_hk.js');
let s = fs.readFileSync(out, 'utf8'); const MARK = '\n/* v41 cards */';
if (s.includes(MARK)) s = s.slice(0, s.indexOf(MARK));
const ent = {};
for (const f of fs.readdirSync(dir).filter(f => /^labelled_v41[a-z]*\.js$/.test(f)).sort()) {
  const m = require(path.join(dir, f));
  for (const [k, v] of Object.entries(m)) { if (k.startsWith('__')) continue; if (ent[k] || s.includes('\n  ' + k + ':')) throw new Error('duplicate card ' + k); ent[k] = v; }
}
const body = Object.entries(ent).map(([k, v]) => '  ' + (/^[a-z0-9_]+$/.test(k) ? k : JSON.stringify(k)) + ': ' + JSON.stringify(v)).join(',\n');
fs.writeFileSync(out, s.replace(/\s*$/, '') + MARK + '\nObject.assign(window.LM_INFO = window.LM_INFO || {}, {\n' + body + '\n});\n');
console.log('v41 cards', Object.keys(ent).length);
