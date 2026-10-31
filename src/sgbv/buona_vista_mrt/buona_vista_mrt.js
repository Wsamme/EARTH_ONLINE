/* Buona Vista EW21 / CC22. Ways 152592566, 823046125,
 * 1131873757, 1187773826. Only the above-ground station is massed;
 * the large underground Circle Line footprint is not a 19 m building.
 * The app supplies the real EW rail alignment, viaduct, moving trains and piers.
 */
{
const {register,rect,scale}=SGBV;
register('buona_vista_mrt','波那维斯达地铁站','Buona Vista MRT',143,(b,D)=>{
 const P=[[-115.5,-68.1],[40,-52.6],[38.1,-34.6],[-117.5,-45.7]];
 b.prism(scale(P,.97),0,5.6,'#a1b5ae');b.facade(scale(P,.98),1,6,5,4,'#4b8c82','#d6dfd1',.4);
 b.prism(P,6,7,'#c6cfc1');
 // Platforms remain visually open below the shallow mint-green roof.
 b.prism(P,10.4,11,'#aab9ac');b.prism(scale(P,1.025),17.2,18,'#8ab7a1');b.rim(scale(P,1.025),18.25,'#d3dfc9',.4);
 for(let x=-110;x<38;x+=12){let z=-56.6+(x+110)*.095;for(const sd of [-1,1]){b.box(x,7,z+sd*8,.5,10.1,.5,'#d3ddcc');b.box(x,11,z+sd*6.9,9,2.3,.15,'#5b8d84',-.095,2);b.box(x,13.3,z+sd*7,9,.3,.3,'#c6d5ca',-.095);}}
 // Five raised rectangular roof lanterns, parallel to the track.
 for(let x=-95;x<35;x+=28){const z=-55+(x+95)*.095;b.box(x,18,z,12,.85,6,'#d6ddcb',-.095);b.box(x,18.86,z,10,.12,4.5,'#73aab0',-.095,2);b.box(x,18.95,z,.18,.08,4.7,'#eef0dd',-.095);}
 const entry=[[-12.7,-35.5],[.9,-27.7],[-10.1,-7.8],[16,6.7],[38.1,-34.6]];
 b.prism(entry,0,6,'#b1beb2');b.cap(scale(entry,1.03),6.2,'#c5cdc1');b.rim(entry,6.5,'#dce3d4',.35);
 for(const j of [2,3]){const Q=D.parts[j].p;b.prism(Q,-.3,2.9,'#859b8e');b.cap(scale(Q,1.07),3.1,'#c4d0c2');b.facade(scale(Q,1.01),.5,2.8,3,3,'#5a8987','#c7d3c5');}
 // Canopied walk to the Circle Line concourse; stairs beneath the entrance.
 b.beam([7,4,0],[32,4,48],3.5,'#c4d0c6');for(let k=0;k<12;k++)b.box(6+k*.6,.25+k*.27,-7+k,8,.25,1.3,'#bac3b6',-.48);
 for(const [x,z]of [[-116,-31],[-86,-30],[-46,-24],[35,18],[70,13]])b.tree(x,0,z,1.3);
});
}
