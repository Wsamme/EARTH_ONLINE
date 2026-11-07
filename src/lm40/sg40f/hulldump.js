// node hulldump.js file.js key anchorLat anchorLon -> hull (+3 m) of verts < 25 m in local metres (+x east, +z south) around the anchor
const fs = require('fs'), vm = require('vm');
const SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
const [files, key, alat, alon] = process.argv.slice(2);
global.THREE = require(SC + 'vend/package/build/three.min.js'); global.navigator = {userAgent:'node'};
const code = fs.readFileSync(SC + 'sgreal/kit/lmbase.js', 'utf8') + '\n' + files.split(',').map(f => fs.readFileSync(f, 'utf8')).join('\n') + `
;(function(){ const D = LANDMARKS[${JSON.stringify(key)}]; const P = SG_PLACES.filter(p => p.type === ${JSON.stringify(key)}).pop();
  LMCTX = {mats:new Map(), fx:[], rng:mulberry32(7), u:{base:{value:0}, top:{value:D.h}, col:{value:new THREE.Color('#fff')}, k:{value:0}, mode:{value:0}, even:{value:0}}};
  const g = D.build(); g.rotation.y = P.rot || 0; g.updateMatrixWorld(true); const v = new THREE.Vector3(), low = [];
  g.traverse(o => { if (!o.isMesh) return; const a = o.geometry.attributes.position; for (let i = 0; i < a.count; i++){ v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld); if (v.y < 25) low.push([v.x, v.z]); } });
  global.__R = {P, low}; })();`;
vm.runInThisContext(code);
const R = global.__R, ox = (R.P.lon - +alon)*111290.5, oz = -(R.P.lat - +alat)*110574;
const pts = R.low.map(p => [p[0] + ox, p[1] + oz]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const cr = (o, a, b) => (a[0] - o[0])*(b[1] - o[1]) - (a[1] - o[1])*(b[0] - o[0]), lo = [], up = [];
for (const p of pts){ while (lo.length >= 2 && cr(lo[lo.length-2], lo[lo.length-1], p) <= 0) lo.pop(); lo.push(p); }
for (let i = pts.length - 1; i >= 0; i--){ const p = pts[i]; while (up.length >= 2 && cr(up[up.length-2], up[up.length-1], p) <= 0) up.pop(); up.push(p); }
up.pop(); lo.pop(); const H = lo.concat(up);
console.log(JSON.stringify(H.map(p => [Math.round(p[0]), Math.round(p[1])])));
