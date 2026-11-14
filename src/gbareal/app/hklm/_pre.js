/* ================= gba: frame shims for the Hong Kong landmark modules (gbareal/tools/mkhklm.py) ================= */
const _gbaXY = sgXY, _gbaHC = hC, _gbaHAt = hAt;
const _gbaRoadsHK = typeof SGRoads === 'undefined' ? undefined : new Proxy(SGRoads, {get(t, k){ if (k === 'ground') return (x, y) => t.ground(x + 7000.0, y + -35000.0); const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; }});
