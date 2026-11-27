// lm50 Shenzhen test hook (test builds only, added by mkpage_sz.sh through EXTRA_MODS; never part of a release build):
// exposes the page internals the screenshot script needs as window.__t, and ?near=lat,lon sets window.__near so the page loads the
// road chunks around that point at the start (the Greater Bay page reads window.__near in sgrLoad).
(() => { try { const q = new URLSearchParams(location.search).get('near'); if (q){ const v = q.split(',').map(Number); if (v.length >= 2 && isFinite(v[0]) && isFinite(v[1])) window.__near = [v[0], v[1]]; } } catch (e){} })();
window.__t = {get camera(){ return camera; }, get controls(){ return controls; }, get scene(){ return scene; }, get renderer(){ return renderer; },
  get SGR(){ return SGR; }, sgXY:(a, b) => sgXY(a, b), hC:(x, y) => hC(x, y), setTod:v => setTod(v), lodTick:() => lodTick(), get LANDMARKS(){ return LANDMARKS; }, get landmarks(){ return landmarks; }};
