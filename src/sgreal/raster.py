import numpy as np
from PIL import Image, ImageDraw
from common import HALF
def polys_of(g):
    if g.is_empty: return []
    if g.geom_type == 'Polygon': return [g]
    if hasattr(g, 'geoms'): return [p for q in g.geoms for p in polys_of(q)]
    return []
def raster(geoms, res, val=1, img=None, mode='L'):
    """rasterise shapely polygons (metres) to an array, row 0 = south, col 0 = west, pixel res metres"""
    n = int(round(2*HALF/res))
    if img is None: img = Image.new(mode, (n, n), 0)
    d = ImageDraw.Draw(img)
    f = lambda c: [((x + HALF)/res, (y + HALF)/res) for x, y in c]
    for g in geoms:
        for p in polys_of(g):
            if len(p.exterior.coords) < 3: continue
            d.polygon(f(p.exterior.coords), fill=val)
            for h in p.interiors: d.polygon(f(h.coords), fill=0)
    return img
def arr(img): return np.asarray(img)
