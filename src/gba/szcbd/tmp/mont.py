import sys
from PIL import Image
out=sys.argv[1]; cols=int(sys.argv[2]); W=int(sys.argv[3]); fs=sys.argv[4:]
ims=[Image.open(f).convert('RGB') for f in fs]
ims=[im.resize((W,int(im.height*W/im.width))) for im in ims]
H=max(im.height for im in ims); rows=(len(ims)+cols-1)//cols
M=Image.new('RGB',(cols*W,rows*H),'white')
for i,im in enumerate(ims): M.paste(im,((i%cols)*W,(i//cols)*H))
M.save(out)
