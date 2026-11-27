// lm50 HK test hook (test builds only, via EXTRA_MODS=lm50/hk50kit/testhook_hk.js): exposes the page internals the screenshot
// script needs as window.__t. Never part of a release build.
window.__t = {get camera(){ return camera; }, get controls(){ return controls; }, get scene(){ return scene; }, get renderer(){ return renderer; },
  get SGR(){ return SGR; }, sgXY:(a, b) => sgXY(a, b), hC:(x, y) => hC(x, y), setTod:v => setTod(v), lodTick:() => lodTick(), get LANDMARKS(){ return LANDMARKS; }, get landmarks(){ return landmarks; }};
