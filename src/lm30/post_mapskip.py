# v34: while the full-screen big map (window.SGNav, opaque) is open, skip drawing the 3D view and placing the 3D labels under it —
# the simulation (frame hooks: driving, traffic, creature mode) keeps running; drawing resumes the frame the map closes.
def apply(src, city):
    a = ("  runHooks('prerender', now/1000, dt);\n  if (TILT.on) tiltRender(); else renderer.render(scene, camera);\n"
         "  runHooks('render', now/1000, dt);\n  placeLabels();\n")
    assert src.count(a) == 1, 'render block'
    b = ("  if (!(window.SGNav && SGNav.isOpen)){   // v34: the opaque big map covers the 3D view\n"
         "  runHooks('prerender', now/1000, dt);\n  if (TILT.on) tiltRender(); else renderer.render(scene, camera);\n"
         "  runHooks('render', now/1000, dt);\n  placeLabels();\n  }\n")
    return src.replace(a, b)
