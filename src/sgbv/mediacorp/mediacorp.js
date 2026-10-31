/* Mediacorp campus, way 352920078: measured 76 m maximum.
 * Long tapered upper broadcast bar floats above glazed studios; curved
 * northern theatre and planted roof terrace. No corporate text or marks.
 */
{
const {register,scale,smooth,ellipse,rect,move}=SGBV;
register('mediacorp','新传媒园区','Mediacorp Campus',144,(b,D)=>{
 const P=D.parts[0].p;
 const Upper=smooth([[-17,-45],[-9,-63],[7,-68],[33,-61],[52,-56],[24,40],[-24,128],[-28,70],[-26,5]],2);
 const Theatre=smooth([[-19,-86],[31,-64],[27,-57],[-4,-16],[-30,-32],[-41,-50],[-37,-75]],2);
 const Studio=move(scale(smooth([[-28,68],[-25,10],[-11,-43],[35,-34],[20,40],[-21,117]],1),.9),-5,0);
 b.prism(P,-1,3,'#a2aca0');b.prism(Studio,3,32,'#7b8b82');b.facade(scale(Studio,1.005),3,31,4.5,3.6,'#597d80','#a2b3a9',.38);
 b.prism(Theatre,3,25,'#8c9987');b.garden(scale(Theatre,.88),25.3,false);b.rim(Theatre,25.6,'#b5c1ac',.5);
 // Upper lens is held high; the large through-space remains open below it.
 b.prism(Upper,42,72,'#a2aa96');b.cap(Upper,72.2,'#a6b1a0');b.rim(Upper,73,'#c2c9b7',.65);
 b.facade(scale(Upper,1.004),43,71,4.6,6,'#98a18c','#aeb7a1',.32);
 for(let y=44;y<71;y+=4.5)b.band(scale(Upper,1.008),y,.8,'#99a58d');
 // A narrow dark slot cuts the long facade, and two structural legs below.
 for(const x of [-21,22])b.box(x,3,-7,5,40,8,'#8b9b8c');
 const Slot=[[-27,52],[-27,64],[-24,82],[1,72],[8,58]];b.walls(scale(Slot,1.01),48,52,'#4b6861',2);
 // Dense plant, service aisles, four round roof fans and screens.
 b.roof(scale(Upper,.88),73,2);
 // Opaque studio panels, garden slot, elevated cantilever supports.
 for(const [x,z,w,d]of [[-8,-19,24,30],[-19,39,18,48]]){b.box(x,3,z,w,26,d,'#8c998c');b.box(x+w/2+.15,8,z,.3,15,d*.8,'#759297');}
 b.box(20,7,-18,9,5,15,'#ccd3c5');b.box(19,17,4,8,4,13,'#c2cbbb');
 for(let z=-32;z<72;z+=8)b.tree(-17,34,z,.55);

 for(const [x,z,r]of [[2,-25,10],[-2,6,9],[-7,35,8],[-14,76,7]]){b.prism(ellipse(x,z,r,r*.8,24),73.2,75.2,'#bcc8b8');b.cap(ellipse(x,z,r*.82,r*.65,24),75.3,'#6d8e87');for(let a=0;a<8;a++){const t=a/8*Math.PI*2;b.beam([x,75.4,z],[x+Math.cos(t)*r*.8,75.4,z+Math.sin(t)*r*.65],.22,'#d8ded0');}}
 for(const [x,z]of [[-38,-91],[43,-54],[40,3],[9,85],[-40,61],[-40,-9]])b.tree(x,0,z,1.7);
});
}
