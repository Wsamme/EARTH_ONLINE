/* ================= gba: no painting tools (v47, 28 Nov 2026) ================= */
// The painting tools (Zones, Roads, Styles, Terrain) are gone from the dock on every city; View, Landmarks and the game modes
// stay. This page is built from an older template, so the tabs are removed here at start-up and the 1-9 keys (which picked a
// painting tool) are swallowed before the page's own key handler sees them.
(() => {
  const drop = () => { for (const c of ['zone', 'road', 'arch', 'terra']) document.querySelectorAll('.dtab[data-cat="' + c + '"]').forEach(t => t.remove()); };
  drop(); setTimeout(drop, 0);
  window.addEventListener('keydown', e => { if (/^[1-9]$/.test(e.key) && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) e.stopImmediatePropagation(); }, true);
})();
