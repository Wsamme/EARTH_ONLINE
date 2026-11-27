// lm50 (Singapore): dump one landmark's merged triangles for nrender50.py (replaces lm22/marina/ndump.js).
//   node R/lm50/kit_sg/ndump50.js <module.js> <key> <out.bin>      (model coords: y up, +x east, +z south, rot 0)
// out.bin = 4-byte header length + JSON header [{c:'#rrggbb', n:triangles}] + Float32 xyz per vertex. Delete it after rendering.
const fs = require('fs'), vm = require('vm');
const SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
const [file, key, out] = process.argv.slice(2);
global.window = global; global.THREE = require(SC + 'vend/package/build/three.min.js'); global.navigator = {userAgent:'node'};
vm.runInThisContext(fs.readFileSync(require('path').join(__dirname, 'lmbase.js'), 'utf8') + '\nglobal.__L = LANDMARKS; global.__mb = mulberry32; global.__mg = lmMerge; global.__ctx = v => { LMCTX = v; };', {filename:'lmbase.js'});
vm.runInThisContext(fs.readFileSync(file, 'utf8'), {filename:file});
const D = __L[key]; if (!D) throw new Error('no LANDMARKS.' + key);
const lt = D.lt || {}; __ctx({mats:new Map(), fx:[], rng:__mb(7932), u:{base:{value:0}, top:{value:D.h}, col:{value:new THREE.Color(lt.c || '#fff')}, k:{value:lt.k || 0}, mode:{value:lt.m || 0}, even:{value:0}}});
const g = D.build(); __mg(g); g.updateMatrixWorld(true);
const head = [], bufs = []; const v = new THREE.Vector3();
g.traverse(o => { if (!o.isMesh) return; const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, p = geo.attributes.position, f = new Float32Array(p.count*3);
  for (let i = 0; i < p.count; i++){ v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); f[i*3] = v.x; f[i*3+1] = v.y; f[i*3+2] = v.z; }
  head.push({c:'#' + o.material.color.getHexString(), n:p.count/3, op:o.material.opacity < 1 ? o.material.opacity : 1}); bufs.push(Buffer.from(f.buffer)); });
const hj = Buffer.from(JSON.stringify(head)), hl = Buffer.alloc(4); hl.writeUInt32LE(hj.length);
fs.writeFileSync(out, Buffer.concat([hl, hj, ...bufs])); console.log(key, 'tris', head.reduce((s, h) => s + h.n, 0), 'meshes', head.length, '->', out);
