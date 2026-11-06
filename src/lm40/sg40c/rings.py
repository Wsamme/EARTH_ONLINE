import json,sys,math
d=json.load(open('../ref_sg40c.json'))['targets']
spec=json.loads(sys.argv[1])  # {key:[osm ids or "i:<idx>"]}
for key,ids in spec.items():
  t=d[key]; a=t['anchor']; bs=t['buildings']
  sel=[]
  for i in ids:
    if i.startswith('i:'): sel.append(bs[int(i[2:])])
    else: sel+= [b for b in bs if b['osm']==i]
  pts=[p for b in sel for p in b['ring']]
  # centroid of union by area-weighted centroids
  A=sum(b['area'] for b in sel); cx=sum(b['centroid'][0]*b['area'] for b in sel)/A; cz=sum(b['centroid'][1]*b['area'] for b in sel)/A
  lat=a['lat']-cz/110574; lon=a['lon']+cx/111290.5
  print('//',key,'lat %.6f lon %.6f'%(lat,lon),'area',round(A))
  for b in sel:
    r=[[round(p[0]-cx,1),round(p[1]-cz,1)] for p in b['ring']]
    # dominant edge angle
    best=max(range(len(r)),key=lambda i:math.hypot(r[(i+1)%len(r)][0]-r[i][0],r[(i+1)%len(r)][1]-r[i][1]))
    p,q=r[best],r[(best+1)%len(r)]; ang=math.degrees(math.atan2(q[1]-p[1],q[0]-p[0]))
    print('  //',b['osm'],b.get('name'),'h',b['h'],'longest edge ang %.1f'%ang, 'parts',b.get('parts'))
    print('  ',json.dumps(r).replace(' ',''))
