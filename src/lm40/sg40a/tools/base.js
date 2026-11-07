// offline: base height the app uses for a placement (highest hC within r at 0/0.35/0.7 r, + 0.6) and hC at given local points
// usage: node base.js lat lon r [x,z ...]   (x east, z south local metres)
const fs = require('fs'), zlib = require('zlib');
const SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
const B = JSON.parse(zlib.gunzipSync(fs.readFileSync(SC + 'sgreal/out/sg_base.json.gz')).toString());
const {HALF, TS, TN} = B, h16 = new Int16Array(Buffer.from(B.H, 'base64').buffer.slice(0)); 
const hb = Buffer.from(B.H, 'base64'); const H = new Float32Array(TN*TN); for (let i = 0; i < TN*TN; i++) H[i] = hb.readInt16LE(2*i)/10;
function hAt(x, y){ const fx = Math.min(TN-1.0001, Math.max(0, (x+HALF)/TS)), fy = Math.min(TN-1.0001, Math.max(0, (y+HALF)/TS)); const i = Math.floor(fx), j = Math.floor(fy), u = fx-i, v = fy-j;
  const a = H[j*TN+i], b = H[j*TN+i+1], c = H[(j+1)*TN+i], d = H[(j+1)*TN+i+1]; return (a*(1-u) + b*u)*(1-v) + (c*(1-u) + d*u)*v; }
const hC = (x, y) => Math.max(-0.3, hAt(x, y));
const [lat, lon, r] = process.argv.slice(2, 5).map(Number); const x = (lon - B.lon0)*B.MX, y = (lat - B.lat0)*B.MY;
let hi = -Infinity; for (let a = 0; a < 12; a++) for (const f of [0, 0.35, 0.7]) hi = Math.max(hi, hC(x + Math.cos(a/12*Math.PI*2)*r*f, y + Math.sin(a/12*Math.PI*2)*r*f));
console.log('top', (hi + 0.6).toFixed(2), 'hC centre', hC(x, y).toFixed(2));
for (const s of process.argv.slice(5)){ const [px, pz] = s.split(',').map(Number); console.log(s, hC(x + px, y - pz).toFixed(2)); }
