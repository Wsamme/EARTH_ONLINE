/* g3d-math.js
   纯数学，不依赖 three.js。浏览器里挂到 window.G3DMath，Node 测试里也能直接跑。

   这页的地图不是地球仪，而是一张铺平的新加坡局部图：
     东向米 = (经度 - lon0) * MX
     北向米 = (纬度 - lat0) * MY
     three.js 里 X = 东，Y = 高，Z = -北
   OpenStreetMap 的路就是用这个公式铺的。Google 的实景瓦片在地心直角坐标（ECEF）里，
   所以每载入一块，都要把顶点换算回同一套米，路才会压在实景路面上。
*/
(function (root) {
  'use strict';

  // WGS84 椭球。a 是赤道半径（米），f 是扁率。
  var A = 6378137.0;
  var F = 1 / 298.257223563;
  var E2 = F * (2 - F);
  var B = A * (1 - F);
  var EP2 = (A * A - B * B) / (B * B);

  // 单位矩阵，列主序，和 three.js 的 Matrix4.elements 一样。
  function ident() {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }

  // 4x4 列主序乘法。mul(parent, local) 表示先做 local，再做 parent。
  function mul(a, b) {
    var r = new Array(16);
    var c, row;
    for (c = 0; c < 4; c++) {
      for (row = 0; row < 4; row++) {
        r[c * 4 + row] = a[row] * b[c * 4] + a[4 + row] * b[c * 4 + 1] + a[8 + row] * b[c * 4 + 2] + a[12 + row] * b[c * 4 + 3];
      }
    }
    return r;
  }

  // 矩阵作用在一个点上（w = 1）。
  function applyPoint(m, x, y, z) {
    var X = m[0] * x + m[4] * y + m[8] * z + m[12];
    var Y = m[1] * x + m[5] * y + m[9] * z + m[13];
    var Z = m[2] * x + m[6] * y + m[10] * z + m[14];
    var W = m[3] * x + m[7] * y + m[11] * z + m[15];
    if (W !== 0 && W !== 1) return [X / W, Y / W, Z / W];
    return [X, Y, Z];
  }

  // 纬度、经度用弧度，高度 h 是相对椭球的米（不是海拔）。
  function llhToEcef(lat, lon, h) {
    var s = Math.sin(lat), c = Math.cos(lat);
    var N = A / Math.sqrt(1 - E2 * s * s);
    return [
      (N + h) * c * Math.cos(lon),
      (N + h) * c * Math.sin(lon),
      (N * (1 - E2) + h) * s
    ];
  }

  // ECEF 转回纬度、经度（弧度）和椭球高。这是常用的闭合公式，误差在毫米级。
  function ecefToLlh(x, y, z) {
    var lon = Math.atan2(y, x);
    var p = Math.hypot(x, y);
    var th = Math.atan2(A * z, B * p);
    var st = Math.sin(th), ct = Math.cos(th);
    var lat = Math.atan2(z + EP2 * B * st * st * st, p - E2 * A * ct * ct * ct);
    var s = Math.sin(lat);
    var N = A / Math.sqrt(1 - E2 * s * s);
    var h = Math.cos(lat) !== 0 ? p / Math.cos(lat) - N : z;
    return [lat, lon, h];
  }

  // 椭球高减去大地水准面差距，才是这页地形用的“海拔”。
  // 新加坡一带 SGEOID 的常数项大约是 8.94 米：海平面的椭球高约 +9 米。
  // 不减的话，实景地面会整块浮在 OSM 路面上方大约 9 米。
  function llhToScene(lat, lon, h, frame) {
    var latD = lat * 180 / Math.PI;
    var lonD = lon * 180 / Math.PI;
    var east = (lonD - frame.lon0) * frame.MX;
    var north = (latD - frame.lat0) * frame.MY;
    return [east + (frame.dx || 0), (h - frame.geoidN) + (frame.dy || 0), -north + (frame.dz || 0)];
  }

  // 3D Tiles 的屏幕空间误差。误差大于目标（比如 16 像素）就该换更细的一块。
  // geometricError、distance 都是米；height 是画布高度（CSS 像素）；fovDeg 是相机垂直视角。
  function screenError(geometricError, distance, height, fovDeg) {
    if (!(geometricError > 0)) return 0;
    if (!(distance > 0.5)) return Infinity;
    var denom = 2 * Math.tan((fovDeg * Math.PI / 180) / 2);
    return geometricError * height / (distance * denom);
  }

  function selfTest() {
    var lat = 1.3073 * Math.PI / 180;
    var lon = 103.79 * Math.PI / 180;
    var h = 20;
    var e = llhToEcef(lat, lon, h);
    var back = ecefToLlh(e[0], e[1], e[2]);
    var dlat = Math.abs(back[0] - lat) * 180 / Math.PI;
    var dlon = Math.abs(back[1] - lon) * 180 / Math.PI;
    var dh = Math.abs(back[2] - h);
    var frame = { lon0: 103.845, lat0: 1.315, MX: 111290.5, MY: 110574, geoidN: 8.94 };
    var s = llhToScene(lat, lon, h, frame);
    var east = (103.79 - 103.845) * 111290.5;
    var north = (1.3073 - 1.315) * 110574;
    var sse = screenError(20, 500, 1080, 38);
    // 20 米的几何误差，在 500 米外、1080 像素高、38° 视角下，大约是 63 像素，应该大于 16，需要细分。
    var I = ident();
    var T = ident();
    T[12] = 3; T[13] = 4; T[14] = 5;
    var p = applyPoint(mul(T, I), 1, 0, 0);
    var ok = dlat < 1e-9 && dlon < 1e-9 && dh < 1e-3
      && Math.abs(s[0] - east) < 1e-4
      && Math.abs(s[1] - (20 - 8.94)) < 1e-4
      && Math.abs(s[2] - (-north)) < 1e-4
      && sse > 40 && sse < 90
      && Math.abs(p[0] - 4) < 1e-9 && Math.abs(p[1] - 4) < 1e-9 && Math.abs(p[2] - 5) < 1e-9;
    return { ok: ok, dlat: dlat, dlon: dlon, dh: dh, sse: sse, scene: s };
  }

  root.G3DMath = {
    A: A,
    ident: ident,
    mul: mul,
    applyPoint: applyPoint,
    llhToEcef: llhToEcef,
    ecefToLlh: ecefToLlh,
    llhToScene: llhToScene,
    screenError: screenError,
    selfTest: selfTest
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
