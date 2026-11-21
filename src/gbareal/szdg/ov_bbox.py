# Read only the row groups of an Overture building parquet that overlap a bbox, via HTTP range requests.
import sys, io, json, requests, pyarrow.parquet as pq, pyarrow as pa
class HttpFile(io.RawIOBase):
    def __init__(s,url):
        s.url=url; s.pos=0; s.ses=requests.Session()
        s.size=int(s.ses.head(url,timeout=60).headers['Content-Length']); s.bytes=0
    def readable(s): return True
    def seekable(s): return True
    def tell(s): return s.pos
    def seek(s,o,w=0):
        s.pos = o if w==0 else (s.pos+o if w==1 else s.size+o); return s.pos
    def read(s,n=-1):
        if n<0: n=s.size-s.pos
        if n==0 or s.pos>=s.size: return b''
        end=min(s.pos+n,s.size)-1
        r=s.ses.get(s.url,headers={'Range':f'bytes={s.pos}-{end}'},timeout=120); r.raise_for_status()
        b=r.content; s.pos+=len(b); s.bytes+=len(b); return b
    def readinto(s,b):
        d=s.read(len(b)); b[:len(d)]=d; return len(d)
url, xmin,ymin,xmax,ymax, out = sys.argv[1], *map(float,sys.argv[2:6]), sys.argv[6]
f=HttpFile(url); pf=pq.ParquetFile(io.BufferedReader(f, buffer_size=1<<20))
md=pf.metadata; names=pf.schema_arrow.names
print('schema:', pf.schema_arrow, file=sys.stderr)
# locate bbox leaf columns
idx={md.schema.column(i).path:i for i in range(md.num_columns)}
cx0,cy0,cx1,cy1=[idx['bbox.'+k] for k in ('xmin','ymin','xmax','ymax')]
rgs=[]
for g in range(md.num_row_groups):
    rg=md.row_group(g); st=lambda c: rg.column(c).statistics
    if st(cx0).min<=xmax and st(cx1).max>=xmin and st(cy0).min<=ymax and st(cy1).max>=ymin: rgs.append(g)
print('row groups overlapping:', rgs, file=sys.stderr)
cols=[c for c in ['id','bbox','geometry','height','num_floors','num_floors_underground','min_height','roof_shape','roof_height','class','subtype','names','sources','is_underground','has_parts','level','building_id','height_source'] if c in names]
t=pf.read_row_groups(rgs, columns=cols)
b=t.column('bbox').combine_chunks()
import pyarrow.compute as pc
m=pc.and_(pc.and_(pc.less_equal(pc.struct_field(b,'xmin'),xmax),pc.greater_equal(pc.struct_field(b,'xmax'),xmin)),pc.and_(pc.less_equal(pc.struct_field(b,'ymin'),ymax),pc.greater_equal(pc.struct_field(b,'ymax'),ymin)))
t=t.filter(m)
pq.write_table(t,out)
print('rows in bbox:', t.num_rows, 'bytes fetched:', f.bytes, file=sys.stderr)
