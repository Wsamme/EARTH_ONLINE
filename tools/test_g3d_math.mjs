// 不打开浏览器，先确认坐标换算是对的。
// 用法：node tools/test_g3d_math.mjs
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(here, '../src/sgreal/app/g3d-math.js');
const sandbox = { console, Math, Array };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
const result = sandbox.G3DMath.selfTest();
if (!result.ok) {
  console.error(result);
  process.exit(1);
}
console.log('g3d-math ok', 'sse', result.sse.toFixed(1), 'scene', result.scene.map(function (n) { return n.toFixed(2); }).join(', '));
