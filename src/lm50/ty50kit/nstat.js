// stats per key: node nstat.js <module.js> [key1,key2,…]   (real app helpers, three.js r128; flat ground)
// calls = meshes before the merge (helper calls), mats = colour specs, tris after the merge, rmax = max plan radius, y range, ms, last SG_PLACES entry
const K = require('./lmenv.js');
const [file, keys] = process.argv.slice(2);
const ctx = K.makeEnv(); const own = K.loadModules(ctx, [file]);
const sel = keys ? keys.split(',') : Object.keys(own).filter(k => ctx.__LM.LANDMARKS[k]);
let id = 1;
for (const k of sel){
  try {
    const b = K.buildKey(ctx, k, id++); let tris = 0, rmax = 0, y0 = 1e9, y1 = -1e9;
    for (const t of K.trisOf(ctx, b.g)){ tris += t.pos.length/9; for (let i = 0; i < t.pos.length; i += 3){ const x = t.pos[i], y = t.pos[i + 1], z = t.pos[i + 2]; if (!isFinite(x + y + z)) throw new Error('NaN vertex'); rmax = Math.max(rmax, Math.hypot(x, z)); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
    const p = K.lastPlace(ctx, k);
    console.log(k.padEnd(20), JSON.stringify({tris:Math.round(tris), calls:b.calls, mats:b.mats, ms:b.ms, r:b.def.r, rmax:+rmax.toFixed(1), ymin:+y0.toFixed(1), ymax:+y1.toFixed(1), h:b.def.h, label:b.def.label !== false, place:p && {lat:p.lat, lon:p.lon, rot:p.rot || 0}}));
  } catch (e){ console.log(k.padEnd(20), 'ERROR', (e.stack || e.message).split('\n').slice(0, 4).join(' | ')); }
}
for (const [k, S] of Object.entries(ctx.SITES)) if (own[k]) console.log(k.padEnd(20), 'SITE (not built offline: test sites in the full app)', JSON.stringify({lat:S.lat, lon:S.lon, r:S.r}));
