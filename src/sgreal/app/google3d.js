/* google3d.js
   把 Google Photorealistic 3D Tiles 铺进城市笔刷的新加坡场景。

   页面用的是 three.js r128（全局变量 THREE），所有城市代码都写在这一个版本上。
   NASA 的 3d-tiles-renderer 需要新得多的 three（里面用了 BatchedMesh），
   换一套 three 会把现有的道路、夜灯、着色器全部弄坏，两套 three 的物体也不能放进同一个场景。
   所以这里自己按 Google 文档做加载，几何仍交给 r128 自带的 GLTFLoader + Draco 解码器：

   1. 请求 https://tile.googleapis.com/v1/3dtiles/root.json?key=密钥
      返回的子瓦片地址里带着 session=...。之后每一块都要带上原来的 session，并再附上 key。
      一个 session 大约能用 3 小时，过期（HTTP 400）就重新要一次 root.json。
   2. 按屏幕误差挑选细节：平移时故意用粗一点的块，停下来再补细块，这样拖动不会卡死。
   3. 顶点从地心坐标换算进页面已有的新加坡米制坐标（见 g3d-math.js），
      所以 OSM 的路、地名、昼夜和相机会继续工作。
   4. 实景盖住的地方藏起原来的拉伸建筑、手写地标和树。路留下来，略微抬高，避免和照片路面抢深度。
      侧栏可以切回原来的模型。

   密钥只从两种地方读，代码里不写死：
     ?gkey=...    或    site/config.local.js 里的 window.GOOGLE_MAPS_API_KEY
*/
(function (global) {
  'use strict';

  var ROOT = 'https://tile.googleapis.com/v1/3dtiles/root.json';
  // 官方「Powered by Google」标，白底使用。高度按 Map Tiles 政策落在 16–19px。
  var LOGO = 'https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3_hdpi.png';
  var DRACO = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/DRACOLoader.js';
  var GLTF = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
  var MESHOPT = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/meshopt_decoder.js';
  var DRACO_PATH = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/gltf/';

  // 默认镜头：Buona Vista MRT / one-north。相机在车站东南，大约 900 米外、340 米高。
  var HOME = { lat: 1.3073, lon: 103.7900, y: 18, east: 420, up: 340, north: -780 };

  var api = null;
  var installed = false;
  var key = '';
  var mode = 'osm';          // osm：原来的模型；tiles：实景
  var wantTiles = false;
  var running = false;
  var epoch = 0;
  var rootTile = null;
  var group = null;
  var loader = null;
  var loadersReady = null;
  var queue = [];
  var inflight = 0;
  var maxLoads = 4;
  var loaded = [];
  var frameId = 0;
  var errorTarget = 16;     // 像素。越小越细、越吃带宽。16 适合平滑平移。
  var errScale = 1;
  var lastCam = null;
  var refreshCount = 0;
  var refreshing = false;
  var lastError = '';
  var copyrightLine = '';
  var mats = [];
  var booted = false;
  var viewSet = false;
  var coverGround = false;
  var roadLift = 0.2;       // 米。路比实景路面高一点点，近看不会闪。
  var statusEl = null;
  var copyEl = null;
  var promptEl = null;
  var barEl = null;
  var toggleEl = null;
  var geomErrorNote = false;
  var triedLoads = 0;

  function math() { return global.G3DMath; }

  function params() {
    try { return new URLSearchParams(global.location.search); }
    catch (e) { return new URLSearchParams(); }
  }

  function readKey() {
    var q = params().get('gkey');
    if (q && q.trim()) return q.trim();
    var w = global.GOOGLE_MAPS_API_KEY;
    if (typeof w === 'string' && w.trim()) return w.trim();
    return '';
  }

  function framePack() {
    // SG 活在页面那个大函数里面，不在 window 上。安装时会把读取函数传进来。
    var g = (api && api.geo) ? api.geo() : { lon0: 103.845, lat0: 1.315, MX: 111290.5, MY: 110574 };
    return {
      lon0: g.lon0, lat0: g.lat0, MX: g.MX, MY: g.MY,
      geoidN: G3D.geoidN, dx: 0, dy: 0, dz: 0
    };
  }

  // ---------- 界面：缺密钥的说明、Google 署名、实景/模型开关 ----------

  function css() {
    if (document.getElementById('g3d-style')) return;
    var s = document.createElement('style');
    s.id = 'g3d-style';
    s.textContent = [
      '#g3dPrompt{position:fixed;z-index:7;left:50%;top:74px;transform:translateX(-50%);width:min(460px,calc(100% - 36px));',
      'background:#f8f7f3;color:#1b1e1c;border:1px solid #d8d5cb;border-radius:10px;box-shadow:0 10px 32px rgba(27,30,28,.16);',
      'padding:12px 14px 12px;font:13px/1.5 "Noto Sans SC",system-ui,sans-serif}',
      '#g3dPrompt b{font-size:14px}',
      '#g3dPrompt p{margin:6px 0 0}',
      '#g3dPrompt code{font:12px/1.4 ui-monospace,monospace;background:#efede6;padding:0 4px;border-radius:4px}',
      '#g3dPrompt .row{display:flex;gap:8px;margin-top:8px}',
      '#g3dPrompt button,#g3dBar button{font:inherit;border:1px solid #d8d5cb;background:#fff;border-radius:7px;padding:5px 10px;cursor:pointer}',
      '#g3dBar{position:fixed;z-index:6;right:16px;bottom:56px;max-width:min(420px,calc(100% - 32px));',
      'background:#fff;color:#1b1e1c;border-radius:8px;box-shadow:0 6px 20px rgba(27,30,28,.18);',
      'padding:10px 12px 8px;display:flex;flex-direction:column;gap:4px;pointer-events:auto}',
      '#g3dBar img{height:18px;width:auto;align-self:flex-start}',
      '#g3dBar .g3d-copy{font:11px/1.35 ui-sans-serif,system-ui,sans-serif;color:#3c4043}',
      '#g3dBar .g3d-note{font:11px/1.35 ui-sans-serif,system-ui,sans-serif;color:#5f6368}',
      'body.noui #g3dPrompt{display:none!important}',
      '@media (max-width:760px){#g3dPrompt{top:12px}#g3dBar{left:12px;right:12px;bottom:12px;max-width:none}}'
    ].join('');
    document.head.appendChild(s);
  }

  function promptText() {
    return ''
      + '<b>镜头在 Buona Vista，建筑仍是原来的模型</b>'
      + '<p>要换成 Google 实景建筑，需要 Map Tiles API 密钥。密钥只留在你的浏览器里，不会写进仓库。</p>'
      + '<p>任选一种：地址加上 <code>?gkey=你的密钥</code>，或在 <code>site/config.local.js</code> 里写 <code>window.GOOGLE_MAPS_API_KEY="你的密钥"</code>（这个文件已在 .gitignore 里）。</p>'
      + '<p>密钥会出现在网页里，所以要在 Google Cloud 用 <b>HTTP 引荐来源</b> 限制它，不要用无限制的密钥。</p>'
      + '<p class="g3d-note" id="g3dErr"></p>'
      + '<div class="row"><button type="button" id="g3dDismiss">先看 OSM 城市</button></div>';
  }

  function buildUi() {
    css();
    promptEl = document.createElement('div');
    promptEl.id = 'g3dPrompt';
    promptEl.innerHTML = promptText();
    document.body.appendChild(promptEl);
    promptEl.querySelector('#g3dDismiss').addEventListener('click', function () { promptEl.hidden = true; });

    barEl = document.createElement('div');
    barEl.id = 'g3dBar';
    barEl.hidden = true;
    barEl.innerHTML = ''
      + '<img alt="Google Maps" id="g3dLogo">'
      + '<div class="g3d-note">实景建筑和地面来自 Google Maps。道路、铁路和地名来自 OpenStreetMap，不是从实景里描出来的。</div>'
      + '<div class="g3d-copy" id="g3dCopy"></div>'
      + '<div class="g3d-note" id="g3dStatus"></div>'
      + '<div class="row"><button type="button" id="g3dToggle">改回模型建筑</button></div>';
    document.body.appendChild(barEl);
    statusEl = barEl.querySelector('#g3dStatus');
    copyEl = barEl.querySelector('#g3dCopy');
    toggleEl = barEl.querySelector('#g3dToggle');
    toggleEl.addEventListener('click', function () { setMode(mode === 'tiles' ? 'osm' : 'tiles'); });

    var forest = document.querySelector('label[for="showForest"]');
    if (forest && forest.parentNode) {
      var lab = document.createElement('label');
      lab.htmlFor = 'g3dCheck';
      lab.innerHTML = '<input type="checkbox" id="g3dCheck"> Google 实景建筑 <small>Photoreal tiles</small>';
      forest.parentNode.appendChild(lab);
      var box = lab.querySelector('input');
      box.addEventListener('change', function () {
        setMode(box.checked ? 'tiles' : 'osm');
        box.checked = mode === 'tiles';
      });
      G3D._check = box;
    }
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text || '';
  }

  function showPrompt(message) {
    if (!promptEl) return;
    promptEl.hidden = false;
    var err = promptEl.querySelector('#g3dErr');
    if (err) err.textContent = message || '';
  }

  function syncToggle() {
    var on = mode === 'tiles';
    if (barEl) barEl.hidden = !on;
    if (on) {
      var logo = document.getElementById('g3dLogo');
      // 没有密钥时不请求 Google 的图片，避免多一次可能失败的网络。
      if (logo && !logo.getAttribute('src')) logo.src = LOGO;
    }
    if (toggleEl) toggleEl.textContent = on ? '改回模型建筑' : '换成实景';
    if (G3D._check) G3D._check.checked = on;
    if (promptEl && on) promptEl.hidden = true;
  }

  // ---------- 和原来的城市互相让位 ----------

  function city() { return api.city(); }

  function liftRoads(root, y) {
    if (!root) return;
    // 路是一个 Group，子网格自己关了矩阵自动更新，但会跟着父级走。
    if (root.position && root.position.y !== y) {
      root.position.y = y;
      if (root.updateMatrix) root.updateMatrix();
    }
  }

  // 每帧在真正绘制前再藏一次。细节切换（lodTick）会在这之前把树和矮房子重新打开。
  function enforceVisibility() {
    var C = city();
    var hide = mode === 'tiles';
    if (C.lmGroup) C.lmGroup.visible = !hide;
    if (C.sgGroup) C.sgGroup.visible = !hide;
    if (C.terrain) C.terrain.visible = !(hide && coverGround);
    if (C.sea) C.sea.visible = !(hide && coverGround);
    if (C.skirt) C.skirt.visible = !(hide && coverGround);
    var S = C.SGR;
    if (S && S.waterGroup) S.waterGroup.visible = !(hide && coverGround);
    if (S && S.tiles) {
      S.tiles.forEach(function (T) {
        if (T.bld && T.bld.group) T.bld.group.visible = !hide;
        if (T.extra) for (var i = 0; i < T.extra.length; i++) T.extra[i].visible = !hide;
        if (T.trees) T.trees.visible = !hide && !!C.showForest;
        if (T.road) {
          liftRoads(T.road.major, hide ? roadLift : 0);
          liftRoads(T.road.minor, hide ? roadLift : 0);
          liftRoads(T.road.paths, hide ? roadLift : 0);
        }
      });
    }
  }

  function applyNight() {
    var nf = api.night ? api.night() : 0;
    if (!(nf >= 0)) nf = 0;
    // 实景照片是白天拍的。夜里把它压暗，路灯和车流仍由原来的夜景着色器负责。
    var k = 1 - 0.58 * nf;
    for (var i = 0; i < mats.length; i++) mats[i].color.setScalar(k);
  }

  // ---------- 密钥、session、地址 ----------

  function authUrl(uri, parentUrl) {
    // 相对地址按当前页面解析。父地址如果也是相对的，只解析一次，避免 testdata/testdata 叠两次。
    var baseHref = parentUrl ? new URL(parentUrl, global.location.href).href : global.location.href;
    var abs = new URL(uri, baseHref);
    // 只有 Google 的瓦片要附上 key。调试用的公开 tileset 不能多这个参数。
    if (key && key !== 'tileset' && abs.hostname === 'tile.googleapis.com' && !abs.searchParams.has('key')) {
      abs.searchParams.set('key', key);
    }
    return abs.href;
  }

  function fetchBuf(url) {
    return fetch(url, { mode: 'cors' }).then(function (r) {
      if (r.status === 400 || r.status === 401) {
        var err = new Error('session ' + r.status);
        err.status = r.status;
        throw err;
      }
      if (!r.ok) {
        var err2 = new Error('HTTP ' + r.status);
        err2.status = r.status;
        throw err2;
      }
      return r.arrayBuffer();
    });
  }

  // ---------- 瓦片树 ----------

  function parseTile(json, parentUrl, parentTransform, parentRefine, depth) {
    var M = math();
    var local = json.transform || null;
    var transform = local ? M.mul(parentTransform, local) : parentTransform;
    var refine = json.refine || parentRefine || 'ADD';
    var uri = null;
    if (json.content) uri = json.content.uri || json.content.url || null;
    if (!uri && json.contents && json.contents.length) uri = json.contents[0].uri || json.contents[0].url || null;
    var kids = json.children || [];
    var tile = {
      transform: transform,
      refine: refine,
      depth: depth,
      geometricError: json.geometricError || 0,
      volume: json.boundingVolume || null,
      uri: uri,
      parentUrl: parentUrl,
      children: [],
      state: 'idle',
      mesh: null,
      copyright: null,
      sphere: null,
      inView: false,
      showMesh: false,
      _dist: 1e12,
      _cold: 0
    };
    for (var i = 0; i < kids.length; i++) {
      tile.children.push(parseTile(kids[i], parentUrl, transform, refine, depth + 1));
    }
    return tile;
  }

  function sphereFromPoints(pts) {
    var i, x = 0, y = 0, z = 0;
    for (i = 0; i < pts.length; i++) { x += pts[i][0]; y += pts[i][1]; z += pts[i][2]; }
    x /= pts.length; y /= pts.length; z /= pts.length;
    var r = 0;
    for (i = 0; i < pts.length; i++) {
      var d = Math.hypot(pts[i][0] - x, pts[i][1] - y, pts[i][2] - z);
      if (d > r) r = d;
    }
    return new THREE.Sphere(new THREE.Vector3(x, y, z), r + 1);
  }

  function ensureSphere(tile) {
    if (tile.sphere) return tile.sphere;
    var vol = tile.volume;
    var M = math();
    var fr = framePack();
    var pts = [];
    if (!vol) return null;
    if (vol.region) {
      var reg = vol.region;
      var lats = [reg[1], reg[3]], lons = [reg[0], reg[2]], hs = [reg[4], reg[5]];
      for (var a = 0; a < 2; a++) for (var b = 0; b < 2; b++) for (var c = 0; c < 2; c++) {
        pts.push(M.llhToScene(lats[a], lons[b], hs[c], fr));
      }
    } else if (vol.box) {
      var box = vol.box;
      var cx = box[0], cy = box[1], cz = box[2];
      for (var sx = -1; sx <= 1; sx += 2) for (var sy = -1; sy <= 1; sy += 2) for (var sz = -1; sz <= 1; sz += 2) {
        var x = cx + sx * box[3] + sy * box[6] + sz * box[9];
        var y = cy + sx * box[4] + sy * box[7] + sz * box[10];
        var z = cz + sx * box[5] + sy * box[8] + sz * box[11];
        var e = M.applyPoint(tile.transform, x, y, z);
        // 包围盒在瓦片局部坐标里。变到地心之后如果数值很大，就是 ECEF，再投影到场景。
        if (Math.hypot(e[0], e[1], e[2]) > 1e6) {
          var llh = M.ecefToLlh(e[0], e[1], e[2]);
          pts.push(M.llhToScene(llh[0], llh[1], llh[2], fr));
        } else {
          pts.push([e[0], e[1], e[2]]);
        }
      }
    } else if (vol.sphere) {
      var sp = vol.sphere;
      var ec = M.applyPoint(tile.transform, sp[0], sp[1], sp[2]);
      if (Math.hypot(ec[0], ec[1], ec[2]) > 1e6) {
        var ll = M.ecefToLlh(ec[0], ec[1], ec[2]);
        var sc = M.llhToScene(ll[0], ll[1], ll[2], fr);
        tile.sphere = new THREE.Sphere(new THREE.Vector3(sc[0], sc[1], sc[2]), sp[3]);
        return tile.sphere;
      }
      tile.sphere = new THREE.Sphere(new THREE.Vector3(ec[0], ec[1], ec[2]), sp[3]);
      return tile.sphere;
    }
    if (pts.length < 2) return null;
    tile.sphere = sphereFromPoints(pts);
    return tile.sphere;
  }

  var _frustum = null;
  var _proj = null;

  function updateFrustum() {
    if (!_frustum) { _frustum = new THREE.Frustum(); _proj = new THREE.Matrix4(); }
    _proj.multiplyMatrices(api.camera.projectionMatrix, api.camera.matrixWorldInverse);
    _frustum.setFromProjectionMatrix(_proj);
  }

  function resetFlags(tile) {
    tile.inView = false;
    tile.showMesh = false;
    for (var i = 0; i < tile.children.length; i++) resetFlags(tile.children[i]);
  }

  function hideBranch(tile) {
    tile.showMesh = false;
    for (var i = 0; i < tile.children.length; i++) hideBranch(tile.children[i]);
  }

  function schedule(tile) {
    if (!tile.uri || tile.state !== 'idle') return;
    tile.state = 'queued';
    queue.push(tile);
  }

  function select(tile) {
    // 根节点包着整个地球。本地投影在那么远的地方没有意义，所以根永远展开，本身不画。
    if (tile.depth === 0) {
      tile.inView = true;
      tile._dist = 0;
      // 只有一块、没有子节点时，根自己就是要画的模型（测试夹具就是这样）。
      if (!tile.children.length) {
        if (tile.uri && tile.state === 'idle') schedule(tile);
        if (tile.state === 'mesh') tile.showMesh = true;
      }
      for (var i = 0; i < tile.children.length; i++) select(tile.children[i]);
      return;
    }
    var sphere = ensureSphere(tile);
    if (sphere && !_frustum.intersectsSphere(sphere)) return;
    tile.inView = true;
    if (sphere) tile._dist = Math.max(0, api.camera.position.distanceTo(sphere.center) - sphere.radius);
    else tile._dist = 0;
    var sse = math().screenError(tile.geometricError, tile._dist, api.canvas.clientHeight || 800, api.camera.fov) * errScale;
    var kids = tile.children;
    var refine = sse > errorTarget && kids.length > 0 && tile.depth < 24;
    // 还没有子节点、内容又是下一层 tileset json 时，必须先把它下下来才能继续分。
    if (tile.uri && tile.state === 'idle' && (!kids.length || !refine)) schedule(tile);
    if (refine) {
      for (var k = 0; k < kids.length; k++) select(kids[k]);
      var pending = false;
      for (var p = 0; p < kids.length; p++) {
        var ch = kids[p];
        if (!ch.inView) continue;
        if (ch.uri && ch.state !== 'mesh' && ch.state !== 'empty' && ch.state !== 'error' && ch.state !== 'json') pending = true;
      }
      if (tile.refine === 'REPLACE' && tile.state === 'mesh' && pending) {
        tile.showMesh = true;
        for (var h = 0; h < kids.length; h++) hideBranch(kids[h]);
      } else if (tile.refine !== 'REPLACE' && tile.state === 'mesh') {
        tile.showMesh = true;
      }
    } else if (tile.state === 'mesh') {
      tile.showMesh = true;
    } else if (tile.uri && tile.state === 'idle') {
      schedule(tile);
    }
  }

  function applyShows() {
    var shown = 0;
    for (var i = 0; i < loaded.length; i++) {
      var t = loaded[i];
      if (!t.mesh) continue;
      t.mesh.visible = !!t.showMesh;
      if (t.showMesh) shown++;
    }
    if (shown > 0 && !coverGround) {
      coverGround = true;
      setStatus('实景已盖住 Buona Vista 的模型建筑');
    }
    return shown;
  }

  function countCopyright() {
    var counts = new Map();
    function add(text) {
      if (!text) return;
      var parts = String(text).split(';');
      for (var i = 0; i < parts.length; i++) {
        var s = parts[i].trim();
        if (!s) continue;
        counts.set(s, (counts.get(s) || 0) + 1);
      }
    }
    for (var i = 0; i < loaded.length; i++) if (loaded[i].showMesh) add(loaded[i].copyright);
    var rows = Array.from(counts.entries());
    rows.sort(function (a, b) { return b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0); });
    var line = rows.map(function (r) { return r[0]; }).join('; ');
    if (line !== copyrightLine) {
      copyrightLine = line;
      if (copyEl) copyEl.textContent = line;
    }
  }

  function pendingInView(tile) {
    if (!tile) return false;
    // 根节点包着整个地球，它的地址不用下。已经有子节点的父块如果还停在 idle，是故意先不拉父级模型。
    var waiting = tile.depth > 0 && tile.inView && tile.uri && (
      tile.state === 'queued' || tile.state === 'loading' || (tile.children.length === 0 && tile.state === 'idle')
    );
    if (waiting) return true;
    for (var i = 0; i < tile.children.length; i++) if (pendingInView(tile.children[i])) return true;
    return false;
  }

  // ---------- 下载和解码 ----------

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error(src)); };
      document.head.appendChild(s);
    });
  }

  function ensureLoaders() {
    if (loadersReady) return loadersReady;
    loadersReady = (async function () {
      if (!THREE.GLTFLoader) await loadScript(GLTF);
      if (!THREE.DRACOLoader) await loadScript(DRACO);
      if (!global.MeshoptDecoder) {
        try { await loadScript(MESHOPT); } catch (e) { /* 没有 meshopt 时，只在瓦片真的需要它才报错 */ }
      }
      var draco = new THREE.DRACOLoader();
      draco.setDecoderPath(DRACO_PATH);
      loader = new THREE.GLTFLoader();
      loader.setDRACOLoader(draco);
      loader.setCrossOrigin('anonymous');
      if (global.MeshoptDecoder) {
        loader.setMeshoptDecoder(global.MeshoptDecoder);
        if (global.MeshoptDecoder.ready) await global.MeshoptDecoder.ready;
      }
    })();
    return loadersReady;
  }

  function b3dmToGlb(buf) {
    var dv = new DataView(buf);
    var ftJSON = dv.getUint32(12, true);
    var ftBin = dv.getUint32(16, true);
    var btJSON = dv.getUint32(20, true);
    var btBin = dv.getUint32(24, true);
    return buf.slice(28 + ftJSON + ftBin + btJSON + btBin);
  }

  function looksLikeJson(buf) {
    var u = new Uint8Array(buf, 0, Math.min(buf.byteLength, 64));
    var i = 0;
    if (u.length >= 3 && u[0] === 0xef && u[1] === 0xbb && u[2] === 0xbf) i = 3;
    while (i < u.length && (u[i] === 32 || u[i] === 9 || u[i] === 10 || u[i] === 13)) i++;
    return u[i] === 0x7b;
  }

  function magicOf(buf) {
    if (buf.byteLength < 4) return '';
    var u = new Uint8Array(buf, 0, 4);
    return String.fromCharCode(u[0], u[1], u[2], u[3]);
  }

  function reprojectGeometry(geom, nodeWorld, tileTransform, rtc) {
    var M = math();
    var node = nodeWorld && nodeWorld.elements ? Array.from(nodeWorld.elements) : M.ident();
    var m = M.mul(tileTransform, node);
    var rx = 0, ry = 0, rz = 0;
    if (rtc) {
      // CESIUM_RTC 的 center 在 glTF 根坐标里。先加到顶点上，再乘瓦片矩阵，避免和瓦片平移加两次。
      rx = tileTransform[0] * rtc[0] + tileTransform[4] * rtc[1] + tileTransform[8] * rtc[2];
      ry = tileTransform[1] * rtc[0] + tileTransform[5] * rtc[1] + tileTransform[9] * rtc[2];
      rz = tileTransform[2] * rtc[0] + tileTransform[6] * rtc[1] + tileTransform[10] * rtc[2];
    }
    var attr = geom.attributes.position;
    var fr = framePack();
    var a = attr.array;
    var i, x, y, z, e, llh, s;
    if (attr.isInterleavedBufferAttribute) {
      for (i = 0; i < attr.count; i++) {
        e = M.applyPoint(m, attr.getX(i), attr.getY(i), attr.getZ(i));
        e[0] += rx; e[1] += ry; e[2] += rz;
        if (Math.hypot(e[0], e[1], e[2]) > 1e6) {
          llh = M.ecefToLlh(e[0], e[1], e[2]);
          s = M.llhToScene(llh[0], llh[1], llh[2], fr);
        } else s = e;
        attr.setXYZ(i, s[0], s[1], s[2]);
      }
    } else {
      for (i = 0; i < a.length; i += 3) {
        x = a[i]; y = a[i + 1]; z = a[i + 2];
        e = M.applyPoint(m, x, y, z);
        e[0] += rx; e[1] += ry; e[2] += rz;
        if (Math.hypot(e[0], e[1], e[2]) > 1e6) {
          llh = M.ecefToLlh(e[0], e[1], e[2]);
          s = M.llhToScene(llh[0], llh[1], llh[2], fr);
        } else s = e;
        a[i] = s[0]; a[i + 1] = s[1]; a[i + 2] = s[2];
      }
    }
    attr.needsUpdate = true;
    geom.computeBoundingSphere();
    geom.computeBoundingBox();
  }

  function photoMaterial(src) {
    var map = src && (src.map || src.emissiveMap) || null;
    if (map) {
      // 这页的渲染器不做色彩管理。GLTFLoader 会把贴图标成 sRGB，结果会发灰，改回直通。
      if (THREE.LinearEncoding !== undefined) map.encoding = THREE.LinearEncoding;
      map.anisotropy = Math.min(8, api.renderer.capabilities.getMaxAnisotropy());
    }
    if (src && src.map) src.map = null;
    if (src && src.dispose) src.dispose();
    var m = new THREE.MeshBasicMaterial({ map: map, color: 0xffffff, side: THREE.DoubleSide, fog: true });
    mats.push(m);
    return m;
  }

  function adoptGlb(tile, gltf) {
    var json = gltf.parser && gltf.parser.json;
    var rtc = json && json.extensions && json.extensions.CESIUM_RTC && json.extensions.CESIUM_RTC.center;
    var grp = new THREE.Group();
    grp.name = 'g3d-tile';
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse(function (obj) {
      if (!obj.isMesh) return;
      var geom = obj.geometry.clone();
      reprojectGeometry(geom, obj.matrixWorld, tile.transform, rtc);
      var srcMats = Array.isArray(obj.material) ? obj.material : [obj.material];
      var made = srcMats.map(photoMaterial);
      var mesh = new THREE.Mesh(geom, made.length === 1 ? made[0] : made);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.frustumCulled = true;
      grp.add(mesh);
    });
    gltf.scene.traverse(function (obj) {
      if (obj.isMesh && obj.geometry) obj.geometry.dispose();
    });
    grp.visible = false;
    group.add(grp);
    tile.mesh = grp;
    tile.copyright = (gltf.asset && gltf.asset.copyright) || tile.copyright;
    tile.state = 'mesh';
    loaded.push(tile);
    applyNight();
  }

  function adoptJson(tile, json, url) {
    var ext = parseTile(json.root || json, url, tile.transform, tile.refine, tile.depth + 1);
    tile.children.push(ext);
    if (json.asset && json.asset.copyright) tile.copyright = json.asset.copyright;
    tile.state = 'json';
  }

  function disposeMesh(tile) {
    if (!tile.mesh) return;
    var seen = new Set();
    tile.mesh.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      var list = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (!m) continue;
        if (m.map && !seen.has(m.map)) { seen.add(m.map); m.map.dispose(); }
        var at = mats.indexOf(m);
        if (at >= 0) mats.splice(at, 1);
        m.dispose();
      }
    });
    group.remove(tile.mesh);
    tile.mesh = null;
    var at = loaded.indexOf(tile);
    if (at >= 0) loaded.splice(at, 1);
    tile.state = 'idle';
  }

  function unloadCold() {
    if (loaded.length < 180) return;
    var far = loaded.filter(function (t) { return !t.showMesh; });
    far.sort(function (a, b) { return b._dist - a._dist; });
    var n = Math.min(8, far.length);
    for (var i = 0; i < n; i++) disposeMesh(far[i]);
  }

  function noteFail(err) {
    lastError = (err && err.message) ? err.message : String(err);
    if (/basisu|ktx2/i.test(lastError) && !geomErrorNote) {
      geomErrorNote = true;
      lastError = '这块瓦片用了 KTX2 贴图，当前加载器解不了。' + lastError;
    }
    setStatus(lastError);
    var box = promptEl && promptEl.querySelector('#g3dErr');
    if (box && mode !== 'tiles') box.textContent = lastError;
  }

  function loadOne(tile) {
    var my = epoch;
    var url = authUrl(tile.uri, tile.parentUrl);
    tile.state = 'loading';
    inflight++;
    fetchBuf(url).then(function (buf) {
      if (my !== epoch) return;
      var magic = magicOf(buf);
      if (magic === 'b3dm') { buf = b3dmToGlb(buf); magic = magicOf(buf); }
      if (magic === 'glTF') {
        return ensureLoaders().then(function () {
          return new Promise(function (resolve, reject) {
            loader.parse(buf, '', resolve, reject);
          });
        }).then(function (gltf) {
          if (my !== epoch) return;
          adoptGlb(tile, gltf);
        });
      }
      if (looksLikeJson(buf)) {
        var text = new TextDecoder().decode(buf).replace(/^\uFEFF/, '');
        var json = JSON.parse(text);
        if (my !== epoch) return;
        if (json.root || json.geometricError !== undefined) { adoptJson(tile, json, url); return; }
      }
      tile.state = 'empty';
    }).catch(function (err) {
      if (my !== epoch) return;
      if (err && (err.status === 400 || err.status === 401)) {
        tile.state = 'idle';
        refreshSession();
        return;
      }
      tile.state = 'error';
      noteFail(err);
    }).then(function () {
      // 会话刷新会把 epoch 改掉，并自己把 inflight 清零。过期的下载不要再减。
      if (my !== epoch) return;
      triedLoads++;
      inflight = Math.max(0, inflight - 1);
      pump();
    });
  }

  function pump() {
    queue.sort(function (a, b) { return a._dist - b._dist; });
    while (inflight < maxLoads && queue.length) {
      var t = queue.shift();
      if (t.state !== 'queued') continue;
      loadOne(t);
    }
  }

  function refreshSession() {
    if (refreshing || refreshCount >= 2) {
      if (refreshCount >= 2) setStatus('实景会话失效，而且刷新没有成功');
      return;
    }
    refreshing = true;
    refreshCount++;
    var my = ++epoch;
    queue.length = 0;
    inflight = 0;
    setStatus('实景会话过期，正在重新连接…');
    var url = authUrl(ROOT);
    fetchBuf(url).then(function (buf) { return JSON.parse(new TextDecoder().decode(buf)); }).then(function (json) {
      if (my !== epoch) return;
      // 旧网格丢掉。新的 root 用新的 session。
      while (loaded.length) disposeMesh(loaded[loaded.length - 1]);
      rootTile = parseTile(json.root, url, math().ident(), json.root.refine || 'REPLACE', 0);
      if (json.asset && json.asset.copyright && copyEl && !copyrightLine) copyEl.textContent = json.asset.copyright;
      refreshCount = 0;
      setStatus('已换新会话');
    }).catch(function (err) {
      noteFail(err);
    }).then(function () { refreshing = false; });
  }

  function startTiles() {
    if (running) return;
    running = true;
    mode = 'tiles';
    syncToggle();
    if (!group) {
      group = new THREE.Group();
      group.name = 'google3d';
      api.scene.add(group);
    }
    group.position.set(G3D.dx, G3D.dy, G3D.dz);
    setStatus('正在连接 Google 实景…');
    var url = authUrl(ROOT);
    var my = epoch;
    fetchBuf(url).then(function (buf) {
      return JSON.parse(new TextDecoder().decode(buf));
    }).then(function (json) {
      if (my !== epoch) return;
      rootTile = parseTile(json.root, url, math().ident(), (json.root && json.root.refine) || 'REPLACE', 0);
      setStatus('正在载入 Buona Vista 一带的实景…');
    }).catch(function (err) {
      running = false;
      mode = 'osm';
      coverGround = false;
      syncToggle();
      var hint = '连不上实景。请确认 Map Tiles API 已启用，并且密钥的 HTTP 引荐来源包含当前网址。';
      noteFail(err);
      showPrompt(hint + (err && err.message ? ' (' + err.message + ')' : ''));
    });
  }

  function stopTiles() {
    mode = 'osm';
    coverGround = false;
    running = false;
    epoch++;
    queue.length = 0;
    if (group) group.visible = false;
    syncToggle();
    setStatus('');
  }

  function setMode(next) {
    if (next === 'tiles') {
      // 没有密钥就不能请求 Google。调试参数 ?tileset= 用的是占位 key「tileset」。
      if (!key || (key === 'tileset' && !params().get('tileset'))) {
        showPrompt('还没有密钥，所以不能打开实景。');
        syncToggle();
        return;
      }
      if (group) group.visible = true;
      if (!rootTile) startTiles();
      else { running = true; mode = 'tiles'; syncToggle(); }
    } else {
      stopTiles();
    }
    enforceVisibility();
  }

  function updateTiles() {
    if (!running || !rootTile || !group.visible) return;
    var moved = lastCam ? api.camera.position.distanceTo(lastCam) : 0;
    if (!lastCam) lastCam = new THREE.Vector3();
    lastCam.copy(api.camera.position);
    // 相机甩得很快时先用粗块，松手后再把误差目标收回来。
    if (moved > 12) errScale = Math.min(2.6, errScale + 0.45);
    else errScale = Math.max(1, errScale * 0.92 + 0.08);
    api.camera.updateMatrixWorld();
    updateFrustum();
    resetFlags(rootTile);
    select(rootTile);
    pump();
    var shown = applyShows();
    countCopyright();
    unloadCold();
    frameId++;
    // 如果贴图压缩整批解不开，不要留一座没有房子的空地，退回原来的模型。
    if (geomErrorNote && triedLoads > 0 && loaded.length === 0 && inflight === 0 && !queue.length) {
      running = false;
      mode = 'osm';
      coverGround = false;
      syncToggle();
      showPrompt('这些实景瓦片的贴图当前加载器解不开（KTX2）。已退回原来的建筑。');
      return;
    }
    if (shown > 0 && inflight === 0 && !queue.length && errScale < 1.15 && !pendingInView(rootTile)) {
      if (!G3D._quiet) setStatus('Buona Vista 实景');
      G3D._quiet = true;
    } else if (inflight || queue.length) {
      G3D._quiet = false;
      setStatus('实景载入中 ' + (inflight + queue.length));
    }
  }

  function onFrame() {
    if (!viewSet) return;
    if (!booted && api.city().SGR && api.city().SGR.base) booted = true;
    if (wantTiles && booted && !running && mode === 'tiles' && !rootTile && !lastError) startTiles();
    if (running && group) group.position.set(G3D.dx, G3D.dy, G3D.dz);
    if (running) updateTiles();
  }

  // 镜头：东、上、北，北为正。场景里的 Z 是北的相反数。
  function placeCamera(lat, lon, y, east, up, north) {
    if (api.stopFly) api.stopFly();
    var t = api.sgXY(lat, lon);
    var ty = y == null ? 18 : y;
    api.controls.target.set(t[0], ty, -t[1]);
    api.camera.position.set(t[0] + east, ty + up, -(t[1] + north));
    api.controls.update();
  }

  function homeView() {
    placeCamera(HOME.lat, HOME.lon, HOME.y, HOME.east, HOME.up, HOME.north);
    viewSet = true;
  }

  function showShot(shot) {
    placeCamera(shot.lat, shot.lon, shot.y == null ? 16 : shot.y, shot.east, shot.up, shot.north);
    if (shot.tod != null && api.setTod) api.setTod(shot.tod);
    errScale = 1;
    viewSet = true;
    G3D._quiet = false;
  }

  function currentView() {
    var g = api.geo();
    var north = -api.controls.target.z;
    return {
      lat: g.lat0 + north / g.MY,
      lon: g.lon0 + api.controls.target.x / g.MX,
      targetY: api.controls.target.y
    };
  }

  function selfTest() {
    var report = math().selfTest();
    var M = math();
    var lat = 1.3073 * Math.PI / 180, lon = 103.79 * Math.PI / 180, h = 30;
    var O = M.llhToEcef(lat, lon, h);
    var Tm = M.ident();
    Tm[12] = O[0]; Tm[13] = O[1]; Tm[14] = O[2];
    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
    reprojectGeometry(geom, new THREE.Matrix4(), Tm, null);
    var expect = M.llhToScene(lat, lon, h, framePack());
    var p = geom.attributes.position.array;
    var err = Math.hypot(p[0] - expect[0], p[1] - expect[1], p[2] - expect[2]);
    geom.dispose();
    // 平移放在双精度矩阵里、顶点在局部原点时，应当贴到厘米级。
    // （如果顶点本身就是很大的 ECEF 浮点，精度大约只剩 1 米，那是源数据的限制。）
    var ok = !!(report.ok && err < 0.05);
    return { ok: ok, reprojErr: err, math: report };
  }

  function stats() {
    var shown = 0;
    for (var i = 0; i < loaded.length; i++) if (loaded[i].showMesh) shown++;
    var settled = viewSet && mode === 'osm'
      ? true
      : !!(running && shown > 0 && inflight === 0 && queue.length === 0 && errScale < 1.2 && !pendingInView(rootTile));
    return {
      mode: mode,
      key: !!key,
      meshes: loaded.length,
      visible: shown,
      loading: inflight + queue.length,
      settled: settled,
      error: lastError,
      copyright: copyrightLine,
      booted: booted,
      viewSet: viewSet
    };
  }

  var G3D = global.G3D = {
    geoidN: 8.94,
    dx: 0, dy: 0, dz: 0,
    errorTarget: errorTarget,
    setErrorTarget: function (n) { errorTarget = n; G3D.errorTarget = n; G3D._quiet = false; },
    setMode: setMode,
    showShot: showShot,
    view: currentView,
    stats: stats,
    selfTest: selfTest,
    home: HOME
  };

  function install(given) {
    if (installed) return G3D;
    installed = true;
    api = given;
    if (!math()) {
      buildUi();
      showPrompt('缺少 g3d-math.js，实景模块没有启动。城市仍按原来的方式显示。');
      return G3D;
    }
    var q = params();
    if (q.get('geoid')) G3D.geoidN = parseFloat(q.get('geoid')) || G3D.geoidN;
    if (q.get('gdx')) G3D.dx = parseFloat(q.get('gdx')) || 0;
    if (q.get('gdy')) G3D.dy = parseFloat(q.get('gdy')) || 0;
    if (q.get('gdz')) G3D.dz = parseFloat(q.get('gdz')) || 0;
    if (q.get('err')) G3D.setErrorTarget(parseFloat(q.get('err')) || 16);
    key = readKey();
    // 外部 tileset（调试用）不走 Google 的 key。正式页面不要靠这个。
    var tilesetOverride = q.get('tileset');
    buildUi();
    api.setSgView(homeView);
    api.HOOKS.frame.push(onFrame);
    api.HOOKS.prerender.push(enforceVisibility);
    api.HOOKS.time.push(function () { applyNight(); });
    if (tilesetOverride) {
      key = key || 'tileset';
      ROOT = tilesetOverride;
    }
    if (!key || q.get('g3d') === '0') {
      mode = 'osm';
      wantTiles = false;
      if (!key && !tilesetOverride) showPrompt('');
      syncToggle();
    } else {
      wantTiles = true;
      mode = 'tiles';
      syncToggle();
    }
    return G3D;
  }

  global.G3DInstall = install;
})(typeof window !== 'undefined' ? window : globalThis);
