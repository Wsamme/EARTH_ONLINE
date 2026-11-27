// Triangles of one key (real app helpers, merged like the app) -> a small binary for nrender.py / oplan.py:
//   header 'TYD1', uint32 ntris, then per triangle 9 float32 (x y z ×3, model coords: x east, y up, z south) + 3 uint8 rgb + 1 pad
// usage: node ndump.js <module.js> <key> <out.bin>        (prints tris and the key's last SG_PLACES entry as JSON)
const K = require('./lmenv.js'), fs = require('fs');
const [file, key, outf] = process.argv.slice(2);
const ctx = K.makeEnv(); K.loadModules(ctx, [file]);
const b = K.buildKey(ctx, key, 1), T = K.trisOf(ctx, b.g);
let n = 0; for (const t of T) n += t.pos.length/9;
const buf = Buffer.alloc(8 + n*40); buf.write('TYD1', 0); buf.writeUInt32LE(n, 4); let o = 8;
for (const t of T){ const c = parseInt(t.c.slice(1), 16), r = c >> 16 & 255, g = c >> 8 & 255, bl = c & 255;
  for (let i = 0; i < t.pos.length; i += 9){ for (let k = 0; k < 9; k++){ buf.writeFloatLE(t.pos[i + k], o); o += 4; } buf[o++] = r; buf[o++] = g; buf[o++] = bl; buf[o++] = 0; } }
fs.writeFileSync(outf, buf);
console.log(JSON.stringify({key, tris:n, r:b.def.r, h:b.def.h, place:K.lastPlace(ctx, key)}));
