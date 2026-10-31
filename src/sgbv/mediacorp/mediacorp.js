/* Mediacorp campus, way 352920078: measured 76 m maximum.
 * Long tapered upper broadcast bar floats above glazed studios; curved
 * northern theatre and planted roof terrace. No corporate text or marks.
 */
{
const {register,scale,smooth,ellipse,rect}=SGBV;
register('mediacorp','新传媒园区','Mediacorp Campus',144,(b,D)=>{
 const P=D.parts[0].p;
 const Upper=smooth([[-17,-45],[-9,-63],[7,-68],[33,-61],[52,-56],[24,40],[-24,128],[-28,70],[-26,5]],2);
 const Theatre=smooth([[-19,-86],[31,-64],[27,-57],[-4,-16],[-30,-32],[-41,-50],[-37,-75]],2);
 const Studio=smooth([[-28,68],[-25,10],[-11,-43],[35,-34],[20,40],[-21,117]],1);
 b.prism(P,-1,3,'#a2aca0');b.prism(Studio,3,36,'#7b8b82');b.facade(scale(Studio,1.005),3,35,4.5,3.6,'#456f70','#a2b3a9',.38);
 b.prism(Theatre,3,25,'#8c9987');b.garden(scale(Theatre,.88),25.3,false);b.rim(Theatre,25.6,'#b5c1ac',.5);
 // Upper lens is held high; the large through-space remains open below it.
 b.prism(Upper,42,72,'#8d9984');b.cap(Upper,72.2,'#a6b1a0');b.rim(Upper,73,'#c2c9b7',.65);
 b.facade(scale(Upper,1.004),43,71,4.6,6,'#7e8d7c','#9da990',.32);
 for(let y=44;y<71;y+=4.5)b.band(scale(Upper,1.008),y,.8,'#99a58d');
 // A narrow dark slot cuts the long facade, and two structural legs below.
 for(const x of [-21,22])b.box(x,3,-7,5,40,8,'#8b9b8c');
 const Slot=[[-27,52],[-27,64],[-24,82],[1,72],[8,58]];b.walls(scale(Slot,1.01),48,52,'#4b6861',2);
 // Dense plant, service aisles, four round roof fans and screens.
 b.roof(scale(Upper,.88),73,2);
 for(const [x,z,r]of [[2,-25,10],[-2,6,9],[-7,35,8],[-14,76,7]]){b.prism(ellipse(x,z,r,r*.8,24),73.2,75.2,'#bcc8b8');b.cap(ellipse(x,z,r*.82,r*.65,24),75.3,'#6d8e87');for(let a=0;a<8;a++){const t=a/8*Math.PI*2;b.beam([x,75.4,z],[x+Math.cos(t)*r*.8,75.4,z+Math.sin(t)*r*.65],.22,'#d8ded0');}}
 for(const [x,z]of [[-38,-91],[43,-54],[40,3],[9,85],[-40,61],[-40,-9]])b.tree(x,0,z,1.7);
});
}
