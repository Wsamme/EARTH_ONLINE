// road50/png.js — a tiny RGB canvas with thick lines, circles and a PNG writer (zlib), for the problem maps
'use strict';
const zlib = require('zlib'), fs = require('fs');
const CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++){ let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
function crc(b){ let c = -1; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data){ const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); }
class Canvas {
  constructor(w, h, bg){ this.w = w; this.h = h; this.p = Buffer.alloc(w*h*3); for (let i = 0; i < w*h; i++){ this.p[i*3] = bg[0]; this.p[i*3+1] = bg[1]; this.p[i*3+2] = bg[2]; } }
  px(x, y, c){ x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const o = (y*this.w + x)*3; this.p[o] = c[0]; this.p[o+1] = c[1]; this.p[o+2] = c[2]; }
  disc(cx, cy, r, c){ const r2 = r*r; for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x - cx)**2 + (y - cy)**2 <= r2) this.px(x, y, c); }
  ring(cx, cy, r, w, c){ const a = (r - w)**2, b = r*r; for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++){ const d = (x - cx)**2 + (y - cy)**2; if (d <= b && d >= a) this.px(x, y, c); } }
  line(x0, y0, x1, y1, w, c){
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), n = Math.max(1, Math.ceil(L)), r = w/2;
    if ((x0 < -w && x1 < -w) || (y0 < -w && y1 < -w) || (x0 > this.w + w && x1 > this.w + w) || (y0 > this.h + w && y1 > this.h + w)) return;
    for (let i = 0; i <= n; i++){ const x = x0 + dx*i/n, y = y0 + dy*i/n; if (r <= 0.6) this.px(x, y, c); else this.disc(x, y, r, c); }
  }
  save(path){
    const raw = Buffer.alloc((this.w*3 + 1)*this.h);
    for (let y = 0; y < this.h; y++){ raw[y*(this.w*3 + 1)] = 0; this.p.copy(raw, y*(this.w*3 + 1) + 1, y*this.w*3, (y + 1)*this.w*3); }
    const ih = Buffer.alloc(13); ih.writeUInt32BE(this.w, 0); ih.writeUInt32BE(this.h, 4); ih[8] = 8; ih[9] = 2; ih[10] = 0; ih[11] = 0; ih[12] = 0;
    fs.writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, {level:6})), chunk('IEND', Buffer.alloc(0))]));
  }
}
module.exports = {Canvas};
