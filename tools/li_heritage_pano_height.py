"""Intersect one local reference-camera ray with an architectural facade plane.

No imagery or network is accessed. Heights depend on the assumed facade plane
and camera ground datum; this is an estimate, not a survey.

Abdul Gafoor upper-cornice example:
  python3 tools/li_heritage_pano_height.py abdul_gafoor \
    --file abdul_gafoor_01_0.jpg --pixel 320 180 \
    --angle 5.608592653589793 --axis z --plane 14.63
"""
import argparse
import json
import math
from pathlib import Path


def intersect(anchor, shot, pixel, angle, axis, plane, camera_height):
    c, s = math.cos(angle), math.sin(angle)
    x = (shot['lng']-anchor['lon'])*111320*math.cos(math.radians(anchor['lat']))
    z = -(shot['lat']-anchor['lat'])*111320
    origin = [x*c-z*s, camera_height, x*s+z*c]
    width, height = shot.get('size', [640, 640])
    h, p = math.radians(shot['heading']), math.radians(shot['pitch'])
    t = math.tan(math.radians(shot['fov']/2))
    rx = (pixel[0]-width/2)/(width/2)*t
    ry = (height/2-pixel[1])/(width/2)*t
    dx = math.sin(h)*math.cos(p)+rx*math.cos(h)-ry*math.sin(h)*math.sin(p)
    dz = -math.cos(h)*math.cos(p)+rx*math.sin(h)+ry*math.cos(h)*math.sin(p)
    dy = math.sin(p)+ry*math.cos(p)
    direction = [dx*c-dz*s, dy, dx*s+dz*c]
    i = {'x': 0, 'y': 1, 'z': 2}[axis]
    if abs(direction[i]) < 1e-8:
        raise ValueError('Ray is parallel to the facade')
    distance = (plane-origin[i])/direction[i]
    if distance <= 0:
        raise ValueError('Facade intersection is behind the camera')
    return [round(o+distance*d, 3) for o, d in zip(origin, direction)]


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('slug')
    parser.add_argument('--file', required=True)
    parser.add_argument('--pixel', type=float, nargs=2, required=True)
    parser.add_argument('--angle', type=float, required=True, help='Model frame radians')
    parser.add_argument('--axis', choices=['x', 'y', 'z'], required=True)
    parser.add_argument('--plane', type=float, required=True)
    parser.add_argument('--camera-height', type=float, default=2.5)
    args = parser.parse_args()
    anchor = json.loads(Path('src/sgli/footprints.json').read_text())[args.slug]
    manifest = json.loads((Path('/workspace/li_streetview')/args.slug/'manifest.json').read_text())
    shot = next(s for s in manifest if s['file'] == args.file)
    point = intersect(anchor, shot, args.pixel, args.angle, args.axis, args.plane, args.camera_height)
    print(json.dumps({'file': args.file, 'date': shot['date'],
                      'facade_point_local_m': point, 'estimated_height_m': point[1],
                      'assumed_camera_height_m': args.camera_height}))
