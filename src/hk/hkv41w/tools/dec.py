import gzip,json,math,sys
d=gzip.decompress(open('site/hkdata/hk_bld0.bin','rb').read())
i=0
def vu():
    global i
    v=0;s=0
    while True:
        c=d[i];i+=1;v|=(c&127)<<s;s+=7
        if c<128: return v
def vs():
    v=vu(); return (v>>1)^-(v&1)
assert d[:4]==b'SGB2'; i=4
T=vu();TX=vu();npart=vu();nt=vu();HALF=28000;Q=4.0
tiles=[]
for _ in range(nt):
    ti=vu();nb=vu();bl=vu();ns=vu();k=vu();off=vu();sl=vu();tiles.append((ti,nb,bl))
B=[]
for ti,nb,bl in tiles:
    tx,ty=ti%TX,ti//TX;ox,oy=-HALF+tx*T,-HALF+ty*T
    end=i+bl
    for _ in range(nb):
        fl=d[i];i+=1;h=vu()/10;base=vu()/10;wall=list(d[i:i+3]);i+=3
        r=d[i];i+=1
        if r==255: rc=list(d[i:i+3]);i+=3
        else: rc=r
        seed=d[i];i+=1;nr=vu();px=py=0;rings=[]
        for _ in range(nr):
            n=vu();ring=[]
            for _ in range(n):
                px+=vs();py+=vs();ring.append((ox+px/Q,oy+py/Q))
            rings.append(ring)
        B.append({'t':fl&31,'part':bool(fl&64),'h':h,'base':base,'wall':wall,'rings':rings})
    assert i==end,(i,end)
print(len(B))
json.dump(B,open('w41/bld_big.json','w'))
