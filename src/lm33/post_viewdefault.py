# v39: every city opens in View mode (视角): the View tab selected, the tool tray closed, dragging orbits the camera.
# Before, the page opened with the Zones tray open and the Residential brush armed. Also after "reset city".
# The admin API's paint / erase helpers switched the tool and left it on Residential: they now restore the previous tool
# and the tray state. A POSTS file (all cities).
def apply(src, city):
    a = "let tool = 'R', brushR = 80"
    assert src.count(a) == 1, ('viewdefault let', src.count(a))
    src = src.replace(a, "let tool = 'view', brushR = 80")
    b = "setTool('R'); renderStyle();"
    n = src.count(b)
    assert n >= 1, ('viewdefault boot', n)
    src = src.replace(b, "setTool('view'); $('#tray').classList.add('closed'); renderStyle();")
    for old, new in [
        ("erase:(x, y, r) => { pushUndo(); setTool('erase'); const b = brushR; brushR = r; paintAt([x, y]); brushR = b; drawTex(); requestRegen(); },",
         "erase:(x, y, r) => { pushUndo(); const _pt = tool, _tc = $('#tray').classList.contains('closed'); setTool('erase'); const b = brushR; brushR = r; paintAt([x, y]); brushR = b; setTool(_pt); if (_tc) $('#tray').classList.add('closed'); drawTex(); requestRegen(); },"),
        ("paint:(x, y, r, t) => { pushUndo(); setTool(t || 'P'); const b = brushR; brushR = r; paintAt([x, y]); brushR = b; setTool('R'); drawTex(); requestRegen(); },",
         "paint:(x, y, r, t) => { pushUndo(); const _pt = tool, _tc = $('#tray').classList.contains('closed'); setTool(t || 'P'); const b = brushR; brushR = r; paintAt([x, y]); brushR = b; setTool(_pt); if (_tc) $('#tray').classList.add('closed'); drawTex(); requestRegen(); },")]:
        k = src.count(old)
        assert k <= 1, ('viewdefault admin', k)
        src = src.replace(old, new)
    return src
