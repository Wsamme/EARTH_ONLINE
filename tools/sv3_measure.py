"""Sparse photo-ray measurements; no tile/mesh access.
These constraints are manually selected, approximate facade-plane observations,
not an automatic reconstruction. Values expose the assumptions and uncertainty.
"""
import json,math,os
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parents[1];meta=json.load(open(root/'uploads/bv_refs/star_vista/meta.json'));lat0=meta['centroid']['lat'];lon0=meta['centroid']['lon']
focal=1600/(2*math.tan(math.radians(30)))
def basis(c):
 h,p=np.radians([c['heading'],c['pitch']]);forward=np.array([np.sin(h)*np.cos(p),np.sin(p),-np.cos(h)*np.cos(p)]);right=np.array([np.cos(h),0,np.sin(h)]);up=np.cross(right,forward)
 pos=np.array([(c['lon']-lon0)*111290.5,c['alt']-19.4,-(c['lat']-lat0)*110574]);return pos,forward,right,up
observations=[('north upper reveal',800,548,-34),('north lower reveal',800,572,-40),('north base upper glazing',800,640,-34)]
rows=[]
for name,x,y,z in observations:
 pos,d,r,u=basis(meta['shots']['n']);ray=d+(x-800)/focal*r-(y-500)/focal*u;point=pos+ray*((z-pos[2])/ray[2]);rows.append(dict(feature=name,photo='original_n',pixel=[x,y],assumed_facade_z=z,local_point=point.tolist(),uncertainty_m=2))
out=Path(os.environ.get('BV_OUT','/workspace/eo_codex_out'))/'sv3';out.mkdir(parents=True,exist_ok=True);(out/'ray_measurements.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows,indent=2))
