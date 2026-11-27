// ===== nyc/ny50e: Lower Manhattan (City Brush lm50 / v48, New York 1:1): the Financial District, the Civic Center and Battery Park City.
// Heroes: the Equitable Building, the Standard Oil Building (26 Broadway), the Federal Reserve Bank of New York and 14 Wall Street
// (Bankers Trust); then One Liberty Plaza, 140 Broadway, 50 West Street, One New York Plaza, 17 State Street, 55 Water Street,
// 60 Wall Street, 195 Broadway, the American Surety Building, the Trinity and US Realty Buildings, 90 West Street, the Barclay-Vesey
// Building, 26 Federal Plaza, the Ted Weiss Federal Building, the Moynihan Courthouse, 375 Pearl Street, Temple Court, the Potter
// Building, Liberty Tower, 23 Wall Street, 55 Wall Street, the Delmonico's Building, Stuyvesant High School, the Whitehall Building
// (+ annex) and the Downtown Athletic Club.
// Each model is built in its own frame aligned with its real OSM footprint: FD = the OSM footprint ring (r, rs) and the app's OSM
// building:part tiers (p = [base, top, ring]) in that frame, PL = the placements (anchor = the footprint centroid, rot from the
// footprint's minimum-area rectangle); both generated from R/lm50/ref_ny50e.json + the lm50 OSM geometry (SC/lm50/ny50e/gen.py).
// Heights: verified values (enwiki, read 27-28 Nov 2026) where known; OSM part tiers otherwise (labelled in the comments).
// Block-scoped: only LANDMARKS and SG_PLACES are touched. No names, logos, signs or text anywhere.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const FD = {"nyequitable":{"r":[[-47.9,-25.7],[-45.9,-6.6],[-45.5,-2.4],[-44.8,4.6],[-43.1,23.5],[0.1,23.5],[26.6,23.5],[48.4,23.5],[47.2,6.8],[46.9,1.3],[46.5,-4.3],[45.4,-21.1],[7.1,-23.0],[1.0,-23.2]],"p":[[0.0,30.0,[[23.4,5.1],[24.9,5.1],[24.8,6.5],[47.2,6.8],[46.6,-4.2],[25.0,-5.1],[25.2,-4.0],[23.2,-4.1],[19.1,-2.4],[18.8,3.2]]],[0.0,30.0,[[-24.0,5.0],[-23.9,3.9],[-21.9,3.9],[-18.2,2.7],[-17.9,-3.9],[-21.3,-5.0],[-23.8,-5.0],[-23.6,-6.4],[-45.8,-6.6],[-44.8,4.7]]],[0.0,155.0,[[48.3,23.6],[47.2,6.8],[24.8,6.5],[24.9,5.1],[23.4,5.1],[18.8,3.2],[19.1,-2.4],[23.2,-4.1],[25.2,-4.0],[25.0,-5.1],[46.6,-4.2],[45.5,-21.1],[-47.9,-25.5],[-45.8,-6.6],[-23.6,-6.4],[-23.8,-5.0],[-21.3,-5.0],[-17.9,-3.9],[-18.2,2.7],[-21.9,3.9],[-23.9,3.9],[-24.0,5.0],[-44.8,4.7],[-43.2,23.5]]],[155.0,165.0,[[18.7,14.5],[19.5,-14.1],[-17.6,-14.9],[-18.4,13.3]]]]},"nystandardoil":{"r":[[10.7,18.6],[27.8,13.3],[29.9,10.2],[29.9,-18.2],[26.6,-18.3],[20.0,-18.7],[9.1,-18.9],[-10.7,-19.6],[-22.6,-19.9],[-30.8,-20.1],[-30.2,-14.2],[-29.8,-9.3],[-28.4,-2.8],[-26.2,3.6],[-23.4,10.3],[-18.8,22.1],[-16.7,27.4],[0.9,21.8]],"p":[[0.0,20.0,[[-2.9,15.7],[-0.9,15.2],[0.9,21.7],[10.8,18.6],[8.5,12.5],[9.6,11.9],[7.8,7.0],[-8.0,6.7]]],[0.0,54.0,[[27.6,13.3],[30.1,10.3],[30.0,-18.2],[26.7,-18.3],[26.9,9.0],[26.1,10.4],[10.5,15.0],[9.6,11.9],[8.5,12.5],[10.8,18.6]]],[0.0,54.0,[[-16.7,27.4],[0.9,21.7],[-0.9,15.2],[-2.9,15.7],[-1.2,18.8],[-17.8,23.0],[-18.9,22.0]]],[0.0,78.0,[[-18.9,22.0],[-17.8,23.0],[-1.2,18.8],[-8.0,6.7],[7.8,7.0],[10.5,15.0],[26.1,10.4],[26.9,9.0],[26.7,-18.3],[-30.9,-20.1],[-29.8,-9.3],[-28.3,-2.8],[-26.1,3.7]]],[78.0,86.0,[[19.6,7.2],[20.0,-18.8],[-22.5,-20.0],[-23.0,6.3]]],[86.0,104.0,[[18.5,4.4],[19.1,-15.8],[-21.5,-17.2],[-21.9,3.5]]],[86.0,120.0,[[-11.3,6.5],[8.6,7.0],[11.3,4.1],[11.7,-15.8],[9.3,-18.8],[-10.7,-19.5],[-13.4,-16.9],[-13.9,3.7]]],[120.0,139.0,[[-10.6,5.5],[7.6,5.7],[10.5,3.3],[10.7,-15.1],[8.3,-17.7],[-9.4,-18.2],[-12.2,-15.8],[-12.8,3.1]]],[139.0,143.0,[[-8.1,3.0],[5.8,3.2],[8.1,1.3],[8.2,-13.1],[6.4,-15.1],[-7.6,-15.6],[-9.6,-13.8],[-9.9,0.9]]],[143.0,147.0,[[-5.9,0.2],[4.2,0.6],[5.3,-0.7],[5.5,-10.8],[4.0,-12.1],[-5.4,-12.4],[-6.7,-10.8],[-7.0,-0.9]]],[147.0,158.0,[[-5.2,-0.8],[3.2,-0.4],[4.2,-1.3],[4.4,-9.6],[3.5,-10.6],[-4.6,-10.9],[-5.5,-10.2],[-5.7,-1.6]]],[147.0,158.5,[[-1.4,-3.5],[0.2,-3.6],[1.4,-4.6],[1.6,-6.4],[0.2,-7.8],[-1.6,-7.7],[-2.7,-6.5],[-2.6,-4.9]]]]},"nyfedreserve":{"r":[[-18.4,70.5],[-18.4,-29.4],[-18.4,-53.5],[25.4,-57.5],[28.5,-54.2],[21.4,-16.8],[20.0,-9.7],[17.7,2.8],[5.8,65.2],[4.4,67.3],[-16.8,71.9]],"p":[[0.0,50.7,[[-18.4,70.5],[-16.8,72.0],[4.4,67.3],[5.8,65.1],[28.6,-54.2],[25.4,-57.4],[-18.5,-53.5]]],[0.0,60.0,[[-18.2,62.2],[-18.3,65.5],[-14.4,69.1],[-10.8,68.9],[-7.5,65.2],[-7.5,61.9],[-11.3,58.3],[-14.8,58.5]]],[50.7,69.2,[[-15.0,64.2],[-13.0,66.1],[-1.0,64.1],[0.7,65.9],[3.3,66.3],[4.5,65.8],[6.0,63.4],[5.4,60.8],[4.6,59.8],[3.4,59.3],[23.9,-52.0],[21.8,-53.9],[-14.9,-50.9]]],[69.2,78.4,[[1.1,55.9],[-4.5,48.7],[-11.8,55.2]]],[69.2,78.4,[[-4.5,48.7],[1.1,55.9],[20.7,-51.3],[12.4,-43.2]]],[69.2,78.4,[[-4.7,-42.0],[12.4,-43.2],[20.7,-51.3],[-12.3,-48.5]]],[69.2,78.4,[[-4.8,-27.8],[-2.5,-27.7],[-2.3,7.7],[-4.6,7.6],[-4.5,48.7],[12.4,-43.2],[-4.7,-42.0]]],[69.2,78.4,[[-11.8,55.2],[-4.5,48.7],[-4.7,-42.0],[-12.3,-48.5]]],[73.8,79.0,[[-12.1,7.5],[-2.3,7.7],[-2.5,-27.7],[-12.2,-27.8]]]]},"ny14wall":{"r":[[-27.4,-29.7],[26.2,-29.7],[27.8,-0.1],[24.4,0.0],[25.7,31.4],[-25.0,29.9],[-25.2,24.5],[-25.4,21.6],[-25.5,17.1],[-26.0,5.8],[-26.8,-14.7],[-27.2,-25.9]],"p":[[0.0,165.0,[[22.1,27.7],[21.7,0.6],[-5.4,0.9],[-4.9,28.2]]]]},"nyoneliberty":{"r":[[35.7,24.4],[-0.4,24.4],[-35.9,24.4],[-35.9,15.4],[-35.8,-16.7],[-35.7,-24.4],[-0.6,-24.4],[35.9,-24.4],[35.9,-16.1]]},"ny140broadway":{"r":[[30.3,17.4],[6.4,15.8],[-33.4,13.2],[-33.4,-13.0],[30.3,-17.6]]},"ny50west":{"r":[[15.9,6.7],[23.4,6.3],[22.8,2.6],[21.8,-4.5],[21.5,-7.1],[21.1,-10.6],[14.2,-10.6],[-0.2,-10.6],[-8.0,-10.5],[-12.4,-10.6],[-15.6,-10.5],[-20.5,-10.5],[-23.5,-10.5],[-21.7,2.3],[-21.2,6.4],[-16.1,6.4],[-15.6,6.4],[-15.2,7.9],[-14.5,10.1],[-13.3,11.2],[-11.8,11.6],[-11.0,11.7],[-3.6,12.5],[3.8,12.6],[6.3,12.4],[10.1,12.0],[10.4,12.0],[12.7,11.5],[13.9,10.9],[15.1,9.7]],"p":[[0.0,16.0,[[-15.7,6.4],[-16.1,0.3],[-15.9,-4.1],[-15.5,-7.4],[-15.1,-8.9],[-14.0,-10.0],[-12.5,-10.5],[-23.6,-10.5],[-21.1,6.5]]],[0.0,16.0,[[23.5,6.4],[21.2,-10.4],[14.2,-10.5],[15.6,-9.8],[16.4,-8.8],[16.9,-7.1],[16.9,-4.6],[15.9,6.6]]],[0.0,237.0,[[-13.4,11.2],[-11.9,11.6],[-3.8,12.5],[3.8,12.6],[10.3,11.9],[14.0,10.8],[15.1,9.7],[15.9,6.6],[16.9,-4.6],[16.4,-8.8],[15.6,-9.8],[14.2,-10.5],[-12.5,-10.5],[-14.0,-10.0],[-15.1,-8.9],[-15.9,-4.1],[-15.7,6.4],[-14.5,10.1]]]]},"ny1nyplaza":{"r":[[33.6,21.6],[37.0,21.6],[42.4,21.6],[43.0,21.6],[43.0,20.7],[43.0,9.9],[43.0,9.1],[43.0,8.0],[43.0,6.8],[43.0,5.7],[43.0,2.6],[43.0,-0.7],[43.0,-21.6],[12.3,-21.6],[-12.4,-21.6],[-43.0,-21.6],[-43.0,-12.6],[-43.0,-12.5],[-43.0,-11.1],[-43.0,-9.5],[-43.0,-6.5],[-43.0,-3.3],[-43.0,-3.1],[-43.0,2.5],[-43.0,2.8],[-43.0,5.6],[-43.0,8.9],[-43.0,10.1],[-43.0,20.9],[-43.0,21.2],[-43.0,21.6],[-39.9,21.6],[-37.1,21.6],[-34.6,21.6]],"p":[[0.0,195.0,[[-42.9,21.5],[43.0,21.7],[42.8,-21.6],[-43.2,-21.6]]],[195.0,199.0,[[-17.4,6.9],[14.1,6.7],[14.0,-8.0],[-17.6,-7.7]]]]},"ny17state":{"r":[[-19.0,-16.3],[-19.3,-9.7],[-19.8,-9.7],[-18.9,-2.5],[-16.4,4.5],[-12.0,11.0],[-6.7,15.5],[0.8,19.0],[9.2,20.1],[9.3,19.6],[15.9,19.5],[15.9,-16.1]],"p":[[10.0,153.0,[[-18.8,-2.4],[-16.6,4.5],[-12.1,11.1],[-6.7,15.4],[0.9,19.0],[9.2,20.2],[9.2,19.7],[0.9,18.5],[-6.4,15.2],[-11.6,10.6],[-16.1,4.2],[-18.3,-2.7],[-19.2,-9.7],[-19.7,-9.7]]],[0.0,157.0,[[-18.3,-2.7],[-16.1,4.2],[-11.6,10.6],[-6.4,15.2],[0.9,18.5],[9.2,19.7],[15.9,19.5],[15.8,-16.0],[-18.9,-16.2],[-19.2,-9.7]]],[157.0,165.0,[[-6.2,5.2],[-4.5,7.3],[-2.1,8.6],[0.1,9.2],[10.4,9.2],[10.5,-8.6],[-7.7,-8.8],[-7.7,0.9]]]]},"ny55water":{"r":[[58.5,-47.1],[6.0,-47.1],[6.0,-38.2],[-0.5,-38.2],[-7.5,-38.2],[-7.6,-53.9],[-58.5,-53.9],[-58.1,45.6],[-24.6,45.6],[-24.6,46.7],[-24.6,49.0],[-6.7,48.9],[6.0,49.0],[6.0,51.4],[38.5,51.4],[51.0,51.4],[51.0,53.4],[58.8,53.6],[58.7,52.7],[58.6,44.2],[58.6,22.0],[58.6,0.8],[58.6,-3.6],[58.6,-16.8]],"a":[[-6.7,48.9],[-7.4,-19.2],[6.1,-19.7],[6.2,0.8],[58.6,0.9],[58.8,53.6],[51.0,53.5],[51.0,51.4],[6.0,51.3],[6.0,49.0]],"p":[[0.0,10.0,[[-7.2,45.7],[-24.7,45.7],[-24.6,49.1],[6.0,48.8],[6.0,51.5],[51.0,51.5],[51.0,53.5],[58.8,53.6],[58.5,-47.0],[5.8,-47.0],[6.1,-38.1],[-7.6,-38.1]]],[0.0,55.0,[[6.0,0.8],[58.6,0.9],[58.5,-16.9],[6.1,-16.7]]],[0.0,55.0,[[6.1,-16.7],[58.5,-16.9],[58.5,-47.0],[5.8,-47.0]]],[0.0,209.0,[[-58.0,45.5],[-7.2,45.7],[-7.6,-54.0],[-58.4,-53.8]]]]},"ny60wall":{"r":[[34.4,4.2],[51.8,3.2],[51.6,28.0],[6.2,28.0],[-39.8,28.0],[-40.2,21.9],[-40.5,16.2],[-40.8,11.4],[-40.9,10.4],[-41.1,6.6],[-41.8,-5.8],[-42.5,-17.2],[-43.2,-29.5],[-43.3,-31.8],[-35.8,-31.5],[-28.0,-31.4],[-17.0,-31.1],[32.4,-30.0],[34.0,-1.9]],"p":[[0.0,205.0,[[-17.3,19.9],[-17.5,24.3],[27.4,24.7],[27.6,20.2],[32.1,20.2],[32.6,-24.9],[27.9,-25.0],[27.6,-29.1],[-16.8,-29.7],[-16.8,-25.1],[-22.1,-25.2],[-22.3,19.8]]],[0.0,225.0,[[-7.5,5.0],[-7.1,-10.2],[-19.8,-22.9],[-20.2,17.6]]],[0.0,225.0,[[-2.2,-15.4],[13.0,-15.3],[25.5,-26.9],[-14.6,-27.6]]],[0.0,225.0,[[25.4,22.4],[12.7,9.7],[-2.3,9.5],[-15.4,22.1]]],[0.0,225.0,[[30.0,18.1],[30.4,-22.7],[17.4,-10.1],[17.3,5.1]]],[0.0,225.0,[[25.4,22.4],[25.5,-26.9],[13.0,-15.3],[12.7,9.7]]],[0.0,225.0,[[-7.1,-10.2],[17.4,-10.1],[30.4,-22.7],[25.8,-22.8],[-19.8,-22.9]]],[0.0,225.0,[[-2.3,9.5],[-2.2,-15.4],[-14.6,-27.6],[-14.8,-22.9],[-15.4,22.1]]],[0.0,225.0,[[30.0,18.1],[17.3,5.1],[12.7,5.1],[-7.5,5.0],[-20.2,17.6]]],[0.0,227.0,[[-2.3,4.9],[-2.3,9.5],[12.7,9.7],[12.7,5.1],[17.3,5.1],[17.4,-10.1],[12.8,-10.2],[13.0,-15.3],[-2.2,-15.4],[-2.1,-10.1],[-7.1,-10.2],[-7.5,5.0]]]]},"ny195broadway":{"r":[[-47.2,-1.1],[-24.5,-1.1],[-24.5,-19.8],[-24.5,-23.9],[-24.4,-25.3],[23.3,-25.4],[37.4,-25.3],[37.2,14.7],[37.2,21.7],[-47.2,21.7],[-47.2,17.6]],"p":[[0.0,114.0,[[37.2,21.7],[37.2,-18.5],[37.4,-25.4],[-24.3,-25.3],[-24.7,-1.1],[-47.1,-1.1],[-47.1,21.7]]],[114.0,120.0,[[33.2,17.9],[33.5,-21.3],[-10.2,-21.3],[-10.3,-1.0],[-24.7,-1.1],[-24.5,18.0]]],[114.0,129.0,[[-13.8,-14.1],[-13.8,-23.8],[-24.4,-23.8],[-24.4,-14.2]]]]},"nyamsurety":{"r":[[18.4,18.7],[10.8,18.7],[5.8,18.7],[4.0,18.7],[-2.7,18.7],[-11.3,18.7],[-12.3,18.7],[-18.0,18.7],[-18.5,18.7],[-18.6,-2.6],[-18.7,-20.0],[16.0,-17.2],[19.9,-16.8],[19.7,-13.0],[19.2,-1.8]],"p":[[91.1,99.0,[[-5.8,13.7],[-5.4,6.5],[4.8,7.5],[4.0,18.8],[10.8,18.9],[11.8,-1.9],[19.3,-1.8],[19.6,-13.1],[-15.2,-15.5],[-14.8,13.7]]],[99.0,103.0,[[10.8,18.9],[11.2,10.8],[4.5,10.5],[4.0,18.8]]]]},"nytrinityusrealty":{"r":[[41.5,9.1],[-41.6,9.1],[-41.6,3.6],[-41.5,-0.7],[-41.5,-5.2],[-41.5,-9.1],[41.6,-9.1],[41.5,-0.4]]},"ny90west":{"r":[[-10.5,24.9],[-13.1,22.5],[-16.4,-1.0],[-19.6,-23.5],[-17.4,-26.0],[17.0,-23.0],[17.9,-21.9],[18.0,-21.6],[19.6,-9.9],[19.8,-8.2],[2.9,-5.9],[4.5,5.3],[16.8,3.6],[19.8,25.3],[17.8,27.1]]},"nybarclayvesey":{"r":[[49.8,31.3],[-7.9,30.2],[-28.0,29.9],[-30.2,23.9],[-36.6,6.8],[-42.0,-7.4],[-48.5,-25.1],[-50.5,-30.4],[25.9,-30.4],[28.1,-30.4],[30.5,-23.7],[34.3,-13.0],[36.5,-6.6],[41.2,6.8],[47.9,25.8]],"p":[[0.0,48.0,[[-46.9,-25.0],[-48.3,-28.8],[26.2,-28.4],[27.8,-23.7],[30.6,-23.6],[28.3,-30.4],[-50.4,-30.4],[-48.5,-25.2]]],[0.0,48.0,[[49.8,31.3],[47.9,25.6],[45.7,25.8],[46.7,28.4],[14.2,27.5],[-27.1,27.2],[-28.5,24.0],[-30.2,24.1],[-28.0,29.7]]],[0.0,48.0,[[41.2,6.9],[36.5,-6.5],[14.7,-7.2],[14.5,6.2]]],[0.0,48.0,[[-17.4,7.2],[-17.4,-7.5],[-42.0,-7.3],[-36.5,6.9]]],[0.0,60.0,[[-17.9,27.2],[-17.8,24.3],[-28.5,24.0],[-27.1,27.2]]],[0.0,60.0,[[46.7,28.4],[45.7,25.8],[14.1,25.0],[14.2,27.5]]],[0.0,60.0,[[-17.9,-24.4],[-17.7,-28.6],[-48.3,-28.8],[-46.9,-25.0]]],[0.0,60.0,[[27.8,-23.7],[26.2,-28.4],[14.7,-28.2],[14.9,-23.6]]],[0.0,66.0,[[47.9,25.6],[41.2,6.9],[38.9,6.9],[45.7,25.8]]],[0.0,66.0,[[36.5,-6.5],[30.6,-23.6],[27.8,-23.7],[33.5,-6.8]]],[0.0,66.0,[[-40.1,-7.5],[-46.9,-25.0],[-48.5,-25.2],[-42.0,-7.3]]],[0.0,66.0,[[-28.5,24.0],[-34.9,6.8],[-36.5,6.9],[-30.2,24.1]]],[0.0,80.0,[[-17.4,-7.5],[-17.4,-18.3],[-11.9,-18.3],[-11.9,-25.1],[9.0,-25.1],[9.0,-18.2],[14.6,-18.2],[14.7,-28.2],[-17.7,-28.6],[-17.9,-24.4],[-46.9,-25.0],[-40.1,-7.5]]],[0.0,80.0,[[-17.8,24.3],[-17.9,27.2],[14.2,27.5],[14.1,25.0],[45.7,25.8],[38.9,6.9],[14.5,6.2],[14.4,18.5],[8.9,18.4],[8.9,25.4],[-12.3,25.5],[-12.1,18.4],[-17.6,18.4],[-17.4,7.2],[-34.9,6.8],[-28.5,24.0]]],[0.0,80.0,[[33.5,-6.8],[27.8,-23.7],[14.9,-23.6],[14.7,-7.2]]],[0.0,91.0,[[8.9,25.4],[8.9,18.4],[-12.1,18.4],[-12.3,25.5]]],[0.0,91.0,[[9.0,-18.2],[9.0,-25.1],[-11.9,-25.1],[-11.9,-18.3]]],[0.0,132.0,[[14.4,18.5],[14.6,-18.2],[-17.4,-18.3],[-17.6,18.4]]],[0.0,145.0,[[12.7,16.0],[12.9,-15.5],[-16.2,-15.7],[-16.5,15.8]]],[0.0,152.0,[[11.2,14.5],[11.4,-14.1],[-14.8,-14.3],[-15.0,14.3]]]]},"nyjavitsfed":{"r":[[-30.2,36.5],[-16.2,36.5],[-5.0,36.5],[-5.0,47.0],[0.4,47.0],[1.0,47.0],[4.0,47.0],[6.0,47.0],[8.4,46.9],[25.0,46.9],[26.8,47.0],[26.8,27.0],[26.9,22.7],[26.9,1.7],[26.9,-46.6],[6.7,-46.5],[3.1,-46.5],[-4.1,-46.5],[-4.1,-37.5],[-30.1,-37.4],[-30.1,-1.8]],"p":[[0.0,165.0,[[26.9,47.0],[26.9,-46.8],[-4.2,-46.7],[-4.2,-37.4],[14.6,-37.2],[14.0,36.8],[-4.9,36.5],[-5.0,47.0]]],[0.0,179.0,[[14.0,36.8],[14.6,-37.2],[-30.2,-37.4],[-30.2,36.6]]]]},"nytedweiss":{"r":[[37.5,26.6],[-37.7,26.6],[-37.7,-26.6],[-28.4,-26.6],[-28.4,-25.6],[-23.2,-25.6],[-23.2,-26.6],[23.9,-26.6],[23.9,-25.4],[29.1,-25.4],[29.1,-26.6],[38.7,-26.6],[38.7,-16.9],[37.5,-16.9],[37.5,1.6],[37.5,2.6],[37.5,3.5]]},"nymoynihancourt":{"r":[[14.7,2.8],[28.1,1.5],[28.3,3.3],[30.2,3.1],[30.4,5.4],[32.6,5.4],[34.9,10.8],[37.2,16.1],[42.8,29.3],[43.8,31.5],[39.4,37.9],[16.3,38.1],[16.1,35.2],[-18.3,38.0],[-18.4,36.7],[-21.0,36.9],[-21.1,36.2],[-23.8,36.4],[-24.2,31.8],[-26.7,32.0],[-28.2,29.1],[-29.5,25.0],[-30.0,22.1],[-30.0,19.2],[-29.4,16.0],[-28.2,13.1],[-25.8,12.9],[-26.2,7.8],[-23.6,7.6],[-23.7,6.1],[-23.8,4.8],[-27.9,-43.1],[-22.1,-43.7],[-17.8,-44.2],[-18.5,-51.5],[-8.0,-52.5],[2.4,-53.4],[3.1,-45.2],[6.0,-45.5],[10.0,-45.8],[10.4,-45.9]],"p":[[0.0,23.0,[[39.5,37.9],[43.8,31.7],[37.2,16.1],[36.2,16.7],[35.8,22.7],[34.5,27.5],[32.6,28.0],[32.9,30.8],[30.7,31.2],[30.8,32.4],[28.5,32.5],[28.6,34.2],[16.1,35.3],[16.3,38.0]]],[0.0,44.0,[[14.6,2.7],[10.5,-45.8],[3.1,-45.1],[2.3,-53.4],[-18.6,-51.6],[-17.9,-44.2],[-27.8,-43.0],[-23.7,6.2]]],[44.0,47.0,[[5.8,-2.4],[2.3,-53.4],[-18.6,-51.6],[-14.9,-0.8]]],[0.0,140.0,[[-21.0,36.2],[-21.1,37.0],[-18.4,36.8],[-18.3,38.0],[28.6,34.2],[28.5,32.5],[30.8,32.4],[30.7,31.2],[32.9,30.8],[32.6,28.0],[34.5,27.5],[35.8,22.7],[36.2,16.7],[34.9,10.7],[32.7,5.5],[30.4,5.3],[30.2,3.2],[28.4,3.3],[28.1,1.6],[-23.7,6.2],[-23.5,7.7],[-26.1,7.9],[-25.7,12.9],[-28.1,13.2],[-29.2,16.0],[-30.0,19.1],[-30.0,22.0],[-29.5,25.1],[-28.2,29.2],[-26.6,32.0],[-24.2,31.8],[-23.7,36.5]]]]},"ny375pearl":{"r":[[0.8,37.4],[12.1,37.4],[20.1,37.3],[20.1,30.4],[20.2,21.7],[20.2,18.8],[20.3,7.2],[25.1,7.2],[25.1,-17.9],[20.3,-17.9],[20.3,-29.8],[0.4,-30.0],[0.2,-36.0],[-3.0,-36.1],[-15.8,-36.1],[-17.5,-36.1],[-17.5,-22.3],[-25.6,-22.3],[-25.6,13.2],[-24.3,13.2],[-23.9,13.2],[-17.5,13.2],[-17.9,31.1],[-9.7,31.1],[-3.3,31.1],[0.6,31.1]],"p":[[155.0,165.0,[[25.2,7.4],[25.1,-17.8],[20.2,-17.9],[20.2,7.3]]],[155.0,171.7,[[-10.5,13.2],[-10.6,-22.3],[-25.6,-22.1],[-25.6,13.4]]]]},"nytemplecourt":{"r":[[13.5,-13.6],[13.5,-15.7],[22.4,-15.7],[22.4,-8.3],[22.4,-0.3],[22.4,14.9],[-13.5,14.9],[-22.2,14.9],[-22.2,-15.7],[-2.3,-15.7],[-2.3,-13.6]]},"nypotter":{"r":[[-12.9,21.2],[-12.9,-24.4],[14.6,-14.0],[14.6,17.6]]},"nyliberty55":{"r":[[9.3,12.7],[0.3,13.4],[-9.4,14.3],[-9.4,-12.8],[9.7,-14.0]]},"ny23wall":{"r":[[24.1,-4.7],[19.6,13.1],[-19.2,13.1],[-19.3,-5.2],[-19.3,-11.3],[-19.3,-11.8],[-19.3,-11.9],[-12.0,-17.5],[-11.8,-17.5],[-11.2,-17.3],[-5.2,-15.3],[21.0,-6.7],[20.6,-5.7]]},"ny55wall":{"r":[[31.3,22.8],[-29.1,25.1],[-29.1,-27.6],[-27.7,-27.4],[-22.7,-26.8],[-20.9,-26.6],[-17.3,-26.1],[-8.3,-25.0],[1.0,-23.9],[22.2,-21.3],[31.1,-20.2],[31.2,6.9]]},"nydelmonicos":{"r":[[-8.0,2.7],[-8.0,-8.3],[-3.5,-7.8],[8.4,-6.6],[8.8,-6.5],[9.7,-6.1],[10.4,-5.5],[10.7,-5.2],[11.2,-4.3],[11.4,-3.4],[11.4,-3.0],[11.4,-2.5],[11.2,-1.6],[11.0,-1.2],[10.4,-0.5],[-3.4,11.6],[-4.7,12.7]]},"nystuyvesanths":{"r":[[-56.1,24.1],[-55.3,24.1],[-55.5,20.7],[-55.2,6.8],[-55.5,-7.2],[-55.4,-10.3],[-48.6,-12.8],[-25.8,-21.3],[-19.0,-23.9],[1.8,-31.6],[31.4,-42.6],[43.0,-11.1],[40.7,-10.2],[41.3,-8.6],[42.7,-7.8],[44.0,-6.8],[45.1,-5.5],[45.9,-4.1],[46.4,-2.2],[46.5,0.0],[46.3,1.3],[45.7,2.5],[48.3,2.6],[51.7,11.2],[52.7,14.2],[53.6,16.9],[57.2,26.6],[11.3,26.6],[-56.1,26.6]]},"nydowntownac":{"r":[[20.9,12.6],[13.4,12.5],[13.4,11.3],[12.7,11.3],[-5.7,11.3],[-10.0,11.3],[-17.2,11.3],[-21.3,11.3],[-21.3,-1.0],[-21.3,-4.5],[-21.3,-11.5],[-20.1,-11.5],[-16.1,-11.5],[-13.0,-11.5],[-10.0,-11.5],[-1.5,-11.5],[-0.9,-11.5],[2.6,-11.5],[9.9,-11.5],[12.1,-11.5],[12.7,-11.5],[13.7,-11.5],[19.1,-11.5],[20.9,-11.5],[20.9,-3.2],[20.9,-0.7],[20.9,5.8]],"p":[[0.0,14.4,[[13.5,11.3],[13.4,12.4],[21.0,12.4],[21.0,-11.5],[12.6,-11.4],[12.8,11.4]]],[0.0,57.5,[[-17.1,11.4],[-17.2,-4.6],[-21.4,-4.6],[-21.3,11.3]]],[0.0,64.6,[[-17.2,-4.6],[-17.2,-8.8],[-16.1,-8.9],[-16.2,-11.5],[-21.1,-11.5],[-21.4,-4.6]]],[0.0,71.8,[[12.8,11.4],[12.7,-4.6],[7.8,-4.7],[7.7,7.8],[-9.8,7.7],[-10.1,11.3]]],[0.0,89.8,[[-12.9,-8.8],[-13.0,-11.4],[-16.2,-11.5],[-16.1,-8.9]]],[0.0,89.8,[[7.7,-8.8],[7.8,-4.7],[12.7,-4.6],[12.6,-11.4],[2.7,-11.4],[2.8,-8.8]]],[0.0,104.1,[[-3.4,7.6],[-3.3,6.7],[-14.6,6.9],[-14.5,-7.1],[-12.9,-7.0],[-12.9,-8.8],[-17.2,-8.8],[-17.2,7.7]]],[0.0,107.7,[[-10.1,11.3],[-9.8,7.7],[-17.2,7.7],[-17.1,11.4]]],[0.0,118.5,[[7.7,7.8],[7.7,-8.8],[2.8,-8.8],[2.7,6.9],[-3.3,6.7],[-3.4,7.6]]],[0.0,143.6,[[2.7,6.9],[2.7,-6.4],[-1.5,-6.4],[-1.4,-4.6],[-10.0,-4.5],[-9.9,-6.6],[-13.1,-6.5],[-12.9,-7.0],[-14.5,-7.1],[-14.6,6.9]]],[0.0,148.0,[[2.7,-6.4],[2.7,-11.4],[-1.5,-11.4],[-1.5,-6.4]]],[0.0,148.0,[[-9.9,-6.6],[-10.0,-11.6],[-13.0,-11.4],[-13.1,-6.5]]],[0.0,158.0,[[-1.4,-4.6],[-1.5,-11.4],[-10.0,-11.6],[-10.0,-4.5]]]]},"nytrinityusrealty_b":{"r":[[37.8,-10.4],[38.7,-9.3],[39.9,-8.0],[39.9,0.5],[39.8,10.3],[-39.8,10.4],[-39.7,1.1],[-39.7,-10.4]],"p":[[0.0,86.0,[[39.7,10.3],[39.9,-7.8],[37.8,-10.5],[-39.7,-10.4],[-39.8,10.4]]],[86.0,96.0,[[32.0,-1.4],[37.8,-1.3],[39.0,-2.6],[39.2,-8.4],[37.9,-9.6],[32.1,-9.8],[30.6,-8.4],[30.7,-2.7]]],[96.0,105.0,[[33.6,-2.6],[36.0,-2.5],[37.9,-4.2],[37.9,-6.5],[36.3,-8.5],[33.8,-8.4],[31.8,-6.8],[31.8,-4.2]]]]},"nywhitehallbldg":{"r":[[6.4,-10.6],[6.4,-4.3],[-10.7,-4.3],[-10.6,-10.7],[-27.2,-10.7],[-27.3,5.7],[-27.4,10.1],[-20.3,9.9],[-11.8,9.8],[-11.8,8.9],[-8.0,8.8],[-4.3,8.8],[4.6,8.6],[9.1,8.4],[13.8,8.4],[13.8,9.2],[21.1,9.0],[27.5,8.9],[27.7,-10.4]]},"nywhitehallbldg_b":{"r":[[20.0,38.9],[19.9,45.2],[2.9,45.3],[2.9,38.9],[-13.6,39.0],[-13.6,-53.0],[-8.2,-52.9],[-4.1,-52.8],[3.1,-52.6],[7.4,-52.5],[7.4,11.0],[14.2,11.0],[20.0,11.0]]}};
const PL = {"nyequitable":{"lat":40.7082185,"lon":-74.0105152,"rot":-0.66365},"nystandardoil":{"lat":40.7052947,"lon":-74.0129513,"rot":-0.35059},"nyfedreserve":{"lat":40.708388,"lon":-74.0086809,"rot":0.74047},"ny14wall":{"lat":40.7076285,"lon":-74.0107714,"rot":-0.66841},"nyoneliberty":{"lat":40.7097366,"lon":-74.010857,"rot":-0.53258},"ny140broadway":{"lat":40.7086127,"lon":-74.0100197,"rot":-0.64403},"ny50west":{"lat":40.7078207,"lon":-74.0150151,"rot":-0.43671},"ny1nyplaza":{"lat":40.7021949,"lon":-74.0120411,"rot":0.21617},"ny17state":{"lat":40.7029151,"lon":-74.0139677,"rot":-0.03105},"ny55water":{"lat":40.7032208,"lon":-74.0090635,"rot":0.71549},"ny60wall":{"lat":40.7062523,"lon":-74.0085126,"rot":-0.63104},"ny195broadway":{"lat":40.7108671,"lon":-74.0097836,"rot":-0.54163},"nyamsurety":{"lat":40.7079643,"lon":-74.011114,"rot":-0.58614},"nytrinityusrealty":{"lat":40.7089388,"lon":-74.0114722,"rot":-0.52929},"ny90west":{"lat":40.709993,"lon":-74.0142749,"rot":-0.4341},"nybarclayvesey":{"lat":40.7137725,"lon":-74.0129349,"rot":-0.53252},"nyjavitsfed":{"lat":40.7154557,"lon":-74.00419,"rot":-0.56279},"nytedweiss":{"lat":40.7147255,"lon":-74.0051466,"rot":-0.55055},"nymoynihancourt":{"lat":40.7137369,"lon":-74.0007721,"rot":-0.66704},"ny375pearl":{"lat":40.7108887,"lon":-74.0012044,"rot":-0.50857},"nytemplecourt":{"lat":40.7111916,"lon":-74.0068992,"rot":0.7386},"nypotter":{"lat":40.7115463,"lon":-74.0064954,"rot":0.67653},"nyliberty55":{"lat":40.7088438,"lon":-74.0093844,"rot":-0.67592},"ny23wall":{"lat":40.706732,"lon":-74.0104878,"rot":-0.4331},"ny55wall":{"lat":40.7059265,"lon":-74.0093433,"rot":-0.43673},"nydelmonicos":{"lat":40.7050045,"lon":-74.0102755,"rot":0.24445},"nystuyvesanths":{"lat":40.7180153,"lon":-74.0138273,"rot":-0.538},"nydowntownac":{"lat":40.7061902,"lon":-74.0156087,"rot":-0.30566},"nytrinityusrealty_b":{"lat":40.7087034,"lon":-74.0116361,"rot":-0.51387},"nywhitehallbldg":{"lat":40.7052111,"lon":-74.0159841,"rot":-0.27778},"nywhitehallbldg_b":{"lat":40.7056735,"lon":-74.0159729,"rot":-0.28692}};
const place = k => SG_PLACES.push({type:k, lat:PL[k].lat, lon:PL[k].lon, rot:PL[k].rot});
// every batch material is double-sided (LTris), helpers below write triangles into colour batches
const dsS = c => typeof c === 'string' ? {c, ds:true} : Object.assign({ds:true}, c);
const lerp = (a, b, t) => a + (b - a)*t, cl01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const triP = (o, a, b, c) => o.push(...a, ...b, ...c);
function segP(o, a, b, r, n, r2){
  n = n || 4; const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = (p, rr) => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*rr, s = Math.sin(t)*rr; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a, r), Bq = ring(b, r2 === undefined ? r : r2);
  for (let i = 0; i < n; i++){ const j = (i+1) % n; quadP(o, A[i], A[j], Bq[j], Bq[i]); }
}
const rotQ = (cx, cz, ry) => { const c = Math.cos(ry || 0), s = Math.sin(ry || 0); return (x, y, z) => [cx + x*c + z*s, y, cz - x*s + z*c]; };
function boxP(o, w, h, d, x, y, z, ry){
  const R = rotQ(x, z, ry), hw = w/2, hd = d/2;
  const P = [R(-hw, y, -hd), R(hw, y, -hd), R(hw, y, hd), R(-hw, y, hd), R(-hw, y+h, -hd), R(hw, y+h, -hd), R(hw, y+h, hd), R(-hw, y+h, hd)];
  for (const [a, b, c, e] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) quadP(o, P[a], P[b], P[c], P[e]);
}
function loftP(o, secs, cap){
  const n = secs[0].length;
  for (let s = 0; s < secs.length - 1; s++) for (let i = 0; i < n; i++){ const j = (i+1) % n; quadP(o, secs[s][i], secs[s][j], secs[s+1][j], secs[s+1][i]); }
  if (cap){ const t = secs[secs.length - 1], c = [0, 0, 0]; for (const p of t){ c[0] += p[0]/n; c[1] += p[1]/n; c[2] += p[2]/n; } for (let i = 0; i < n; i++) o.push(...c, ...t[i], ...t[(i+1) % n]); }
}
// ---- plan polygons ([x, z] points)
const area2 = P => { let s = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; };
const bbP = P => { let a = [1e9, 1e9, -1e9, -1e9]; for (const p of P){ a[0] = Math.min(a[0], p[0]); a[1] = Math.min(a[1], p[1]); a[2] = Math.max(a[2], p[0]); a[3] = Math.max(a[3], p[1]); } return a; };
const rectP = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const cenP = P => P.reduce((s, p) => [s[0] + p[0]/P.length, s[1] + p[1]/P.length], [0, 0]);
// offset a polygon: d > 0 insets, d < 0 grows it (mitred, mitre length clamped)
function offP(P, d){
  const n = P.length, s = area2(P) > 0 ? 1 : -1, L = [];
  for (let i = 0; i < n; i++){ const a = P[i], b = P[(i+1) % n], ex = b[0]-a[0], ez = b[1]-a[1], l = Math.hypot(ex, ez) || 1; L.push([a[0] - ez/l*s*d, a[1] + ex/l*s*d, ex, ez]); }
  const out = [];
  for (let i = 0; i < n; i++){ const p = L[(i + n - 1) % n], q = L[i], den = p[2]*q[3] - p[3]*q[2];
    if (Math.abs(den) < 1e-6){ out.push([q[0], q[1]]); continue; }
    const t = ((q[0]-p[0])*q[3] - (q[1]-p[1])*q[2])/den; let x = p[0] + p[2]*t, z = p[1] + p[3]*t;
    const ox = P[i][0], oz = P[i][1], dd = Math.hypot(x - ox, z - oz), mx = Math.abs(d)*2.5;
    if (dd > mx){ x = ox + (x - ox)/dd*mx; z = oz + (z - oz)/dd*mx; }
    out.push([x, z]); }
  return out;
}
const outN = (P, i) => { const s = area2(P) > 0 ? 1 : -1, a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], l = Math.hypot(ex, ez) || 1; return [ez/l*s, -ex/l*s]; };
const triang = P => THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
// clean a ring: drop near-duplicate and collinear vertices (OSM rings carry many)
function cleanP(P, tol){
  tol = tol || 0.25; let Q = P.filter((p, i) => Math.hypot(p[0] - P[(i + 1) % P.length][0], p[1] - P[(i + 1) % P.length][1]) > 0.05);
  let ch = true;
  while (ch && Q.length > 3){ ch = false;
    for (let i = 0; i < Q.length; i++){ const a = Q[(i + Q.length - 1) % Q.length], b = Q[i], c = Q[(i + 1) % Q.length];
      const ex = c[0] - a[0], ez = c[1] - a[1], L = Math.hypot(ex, ez) || 1, d = Math.abs((b[0] - a[0])*ez - (b[1] - a[1])*ex)/L;
      if (d < tol){ Q.splice(i, 1); ch = true; break; } } }
  return Q;
}
function prismP(o, P, y0, ytop, noTop){
  const f = typeof ytop === 'function' ? ytop : () => ytop;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; quadP(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], f(b[0], b[1]), b[1]], [a[0], f(a[0], a[1]), a[1]]); }
  if (!noTop) for (const t of triang(P)) for (const k of t){ const p = P[k]; o.push(p[0], f(p[0], p[1]), p[1]); }
}
const flatP = (o, P, y) => { for (const t of triang(P)) for (const k of t){ const p = P[k]; o.push(p[0], y, p[1]); } };
// floor bands round a plan polygon every `step` m between y0 and y1 (vertical quads just proud of the wall)
function bandsP(o, P, y0, y1, step, bh, off, edges){
  off = off || 0.12;
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length]; if (Math.hypot(b[0]-a[0], b[1]-a[1]) < 0.3) continue; const [nx, nz] = outN(P, i);
    for (let y = y0 + step; y < y1 - 0.3; y += step) quadP(o, [a[0]+nx*off, y, a[1]+nz*off], [b[0]+nx*off, y, b[1]+nz*off], [b[0]+nx*off, y+bh, b[1]+nz*off], [a[0]+nx*off, y+bh, a[1]+nz*off]);
  }
}
// vertical strips standing `off` proud of the walls, about `sp` apart, `w` wide (dep > 0: little fins of that depth)
function mullP(o, P, y0, y1, sp, w, off, edges, dep){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < sp*0.6) continue;
    const [nx, nz] = outN(P, i), n = Math.max(1, Math.round(L/sp)), ux = ex/L, uz = ez/L;
    for (let k = 0; k <= n; k++){
      const t = k/n, x = a[0] + ex*t + nx*off, z = a[1] + ez*t + nz*off, p = [x - ux*w/2, z - uz*w/2], q = [x + ux*w/2, z + uz*w/2];
      if (dep){ const P2 = [[p[0], p[1]], [q[0], q[1]], [q[0] + nx*dep, q[1] + nz*dep], [p[0] + nx*dep, p[1] + nz*dep]]; prismP(o, P2, y0, y1, true); }
      else quadP(o, [p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]]); }
  }
}
// window slots centred in bays along every edge (bay `sp`), rows every `fh`
function winsP(o, P, y0, y1, fh, sp, ww, wh, off, edges){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < sp) continue;
    const [nx, nz] = outN(P, i), n = Math.floor(L/sp), ux = ex/L, uz = ez/L, s0 = (L - n*sp)/2 + sp/2;
    for (let y = y0; y + wh <= y1 + 0.01; y += fh) for (let k = 0; k < n; k++){
      const s = s0 + k*sp, x = a[0] + ux*s + nx*off, z = a[1] + uz*s + nz*off;
      quadP(o, [x - ux*ww/2, y, z - uz*ww/2], [x + ux*ww/2, y, z + uz*ww/2], [x + ux*ww/2, y + wh, z + uz*ww/2], [x - ux*ww/2, y + wh, z - uz*ww/2]); }
  }
}
// vertical window strips (piers between): one dark strip per bay from y0 to y1, `ww` wide
function stripsP(o, P, y0, y1, sp, ww, off, edges){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < sp*0.9) continue;
    const [nx, nz] = outN(P, i), n = Math.max(1, Math.floor(L/sp)), ux = ex/L, uz = ez/L, s0 = (L - n*sp)/2 + sp/2;
    for (let k = 0; k < n; k++){ const s = s0 + k*sp, x = a[0] + ux*s + nx*off, z = a[1] + uz*s + nz*off;
      quadP(o, [x - ux*ww/2, y0, z - uz*ww/2], [x + ux*ww/2, y0, z + uz*ww/2], [x + ux*ww/2, y1, z + uz*ww/2], [x - ux*ww/2, y1, z - uz*ww/2]); }
  }
}
// edge frame: f(u, y, d) = point at distance u along edge i of P, height y, d proud of the wall (outwards)
function edgeF(P, i, off){
  const a = P[i], b = P[(i+1) % P.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]) || 1, ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L, [nx, nz] = outN(P, i);
  off = off || 0;
  return {L, ux, uz, nx, nz, f:(u, y, d) => [a[0] + ux*u + nx*(off + (d || 0)), y, a[1] + uz*u + nz*(off + (d || 0))]};
}
const longest = P => { let bi = 0, bl = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], l = Math.hypot(b[0]-a[0], b[1]-a[1]); if (l > bl){ bl = l; bi = i; } } return bi; };
// the edge of P whose outward normal points most along (dx, dz)
const edgeTo = (P, dx, dz) => { let bi = 0, bv = -1e9; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], l = Math.hypot(b[0]-a[0], b[1]-a[1]), n = outN(P, i), v = (n[0]*dx + n[1]*dz)*Math.min(1, l/6); if (v > bv){ bv = v; bi = i; } } return bi; };
// a round-headed opening on an edge frame: rectangle to hs, semicircle above
function archP(o, F, u, y0, w, hs, d){
  const hw = w/2; quadP(o, F.f(u - hw, y0, d), F.f(u + hw, y0, d), F.f(u + hw, y0 + hs, d), F.f(u - hw, y0 + hs, d));
  for (let k = 0; k < 6; k++){ const t0 = PI*k/6, t1 = PI*(k+1)/6;
    triP(o, F.f(u, y0 + hs, d), F.f(u + Math.cos(t0)*hw, y0 + hs + Math.sin(t0)*hw, d), F.f(u + Math.cos(t1)*hw, y0 + hs + Math.sin(t1)*hw, d)); }
}
// a pointed (Gothic) opening on an edge frame
function gothP(o, F, u, y0, w, hs, d){
  const hw = w/2, ht = hw*1.25; quadP(o, F.f(u - hw, y0, d), F.f(u + hw, y0, d), F.f(u + hw, y0 + hs, d), F.f(u - hw, y0 + hs, d));
  triP(o, F.f(u - hw, y0 + hs, d), F.f(u + hw, y0 + hs, d), F.f(u, y0 + hs + ht, d));
}
// engaged / free columns along edge frame F from u0 to u1 (n columns), standing `d` proud, shafts y0..y1 with base and capital blocks
function colsP(oS, oT, F, u0, u1, n, d, y0, y1, r, seg){
  for (let k = 0; k < n; k++){ const u = n === 1 ? (u0 + u1)/2 : lerp(u0, u1, k/(n - 1)), p = F.f(u, 0, d);
    segP(oS, [p[0], y0 + r*0.5, p[2]], [p[0], y1 - r*0.6, p[2]], r, seg || 8, r*0.88);
    boxP(oT, r*2.6, r*0.5, r*2.6, p[0], y0, p[2], Math.atan2(-F.uz, F.ux)); boxP(oT, r*2.5, r*0.6, r*2.5, p[0], y1 - r*0.6, p[2], Math.atan2(-F.uz, F.ux)); }
}
// cornice: a slab grown `out` beyond P from y to y + h (top capped)
const corP = (o, P, y, h, out) => prismP(o, offP(P, -out), y, y + h);
// a roof rising from P at y0 to P inset by `ins` at y1 (hip / pyramid frustum), capped
function hipP(o, P, y0, y1, ins){ const Q = offP(P, ins); loftP(o, [P.map(p => [p[0], y0, p[1]]), Q.map(p => [p[0], y1, p[1]])], true); }
// a stepped pyramid: n steps of height dh, each inset by dIn; returns the top ring
function stepPyrP(o, P, y0, n, dh, dIn){ let Q = P; for (let i = 0; i < n; i++){ prismP(o, Q, y0 + i*dh, y0 + (i + 1)*dh); Q = offP(Q, dIn); } return Q; }
// a masonry / curtain-wall block: walls, windows, optional piers, floor bands and a coping
function blockP(B, P, y0, y1, o){
  prismP(B.p(o.wall), P, y0, y1, o.noTop);
  const wy0 = Math.max(y0, o.wy0 === undefined ? y0 : o.wy0) + (o.wd === undefined ? 1.0 : o.wd), wy1 = y1 - (o.wt === undefined ? 1.6 : o.wt);
  if (o.win && wy1 - wy0 > 2) winsP(B.p(o.win), P, wy0, wy1, o.fh, o.sp, o.ww, o.wh, 0.06, o.edges);
  if (o.strip && wy1 - wy0 > 2) stripsP(B.p(o.strip), P, wy0, wy1, o.sp, o.ww, 0.06, o.edges);
  if (o.pier) mullP(B.p(o.pier), P, Math.max(y0, o.py0 === undefined ? y0 : o.py0), y1 - (o.pt || 0.6), o.psp || o.sp, o.pw || 0.5, 0, o.edges, o.pd || 0.3);
  if (o.band) bandsP(B.p(o.band), P, Math.max(y0, o.by0 === undefined ? y0 : o.by0), y1 - 1, o.bstep || o.fh, o.bh || 0.35, o.bo || 0.08, o.edges);
  if (o.cop) corP(B.p(o.cop), P, y1 - (o.ch || 0.8), o.ch || 0.8, o.co === undefined ? 0.3 : o.co);
}
// low-poly lamp (wrought-iron lantern) on a bracket: a dark cage with a glowing core
function lanternP(B, cage, glow, p, h){ boxP(B.p(cage), 0.9, h*0.12, 0.9, p[0], p[1], p[2]); boxP(B.p(glow), 0.7, h*0.7, 0.7, p[0], p[1] + h*0.12, p[2]); boxP(B.p(cage), 1.1, h*0.1, 1.1, p[0], p[1] + h*0.82, p[2]); segP(B.p(cage), [p[0], p[1] + h*0.92, p[2]], [p[0], p[1] + h*1.2, p[2]], 0.12, 4, 0.02); }
const ring3 = (P, y) => P.map(p => [p[0], y, p[1]]);

// ===== Equitable Building (Ernest R. Graham, 1915), 120 Broadway: the full block between Broadway, Cedar, Nassau and Pine, rising
// straight from the lot with no setbacks; H-shaped above the 7th floor (light courts open to Broadway and to Nassau Street).
// 525 ft (160 m) to the main roof, 36 exterior storeys; penthouse of two storeys (85 x 120 ft, 9 m) and a centre tower 3 m higher:
// 555 ft (169 m) overall. Granite floors 1-4, granite and terracotta 5-7, light grey brick with matching terracotta trim above;
// corner medallions and belt courses at the 7th and 31st floors, a colonnade of terracotta pilasters on floors 32-35, an
// elaborate cornice over the 35th floor and a cornice over the top floor. 18 bays on Cedar / Pine, 7 on Broadway / Nassau, two
// windows per bay per floor. Broadway and Nassau entrances: 16 m Corinthian pilasters round a double-height arch.
// (enwiki "Equitable Building (Manhattan)"; OSM parts: H plan to 155 m, the court infills to 30 m, the penthouse 155-165 m.)
// Night: lit offices, the floodlit top. Frame: rot -38 deg; -x = Broadway, +x = Nassau Street, -z = Cedar Street, +z = Pine Street.
LANDMARKS.nyequitable = {zh:'公平大厦', en:'Equitable Building', cat:'old', r:59, h:169,
  lt:{m:1, c:'#fff1dc', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.nyequitable;
  const gran = {c:'#b9b5aa', m:0, lk:0.9}, brick = {c:'#c9c4b8', m:1, fh:4.0, cw:1.3}, tc = {c:'#d6d1c4', m:1, fh:4.0, cw:1.3};
  const win = {c:'#3f454b', m:1, fh:4.0, cw:1.3}, gwin = {c:'#39404a', glow:'#ffdcae', gk:0.28}, cor = {c:'#d9d4c7', m:0, lk:1.1}, roof = {c:'#7b7d7e', m:0, lk:0.2};
  const H = cleanP(D.p.find(p => p[1] === 155)[2]), CF = D.p.filter(p => p[1] === 30).map(p => cleanP(p[2])), PH = D.p.find(p => p[1] === 165)[2];
  const YT = 160;
  // the H to the main roof and the court infills to the 7th floor
  prismP(B.p(brick), H, -5, YT);
  for (const C of CF) prismP(B.p(gran), C, -5, 30);
  // granite base round the whole lot (floors 1-4) and the 5-7 floor zone of granite and terracotta
  const LOT = cleanP(D.r);
  prismP(B.p(gran), offP(LOT, -0.15), -5, 19, true);
  prismP(B.p(tc), offP(LOT, -0.08), 19, 30, true);
  corP(B.p(cor), LOT, 18.6, 0.9, 0.45); corP(B.p(cor), LOT, 29.6, 1.0, 0.55);
  // base openings: shop fronts and the mezzanine, two per bay
  winsP(B.p(gwin), offP(LOT, -0.15), 1.0, 6.5, 6.0, 2.65, 2.0, 5.2, 0.06);
  winsP(B.p(gwin), offP(LOT, -0.15), 8.0, 18.0, 3.6, 2.65, 1.2, 2.3, 0.06);
  winsP(B.p(win), offP(LOT, -0.08), 20.0, 29.0, 3.6, 2.65, 1.2, 2.3, 0.06);
  // the shaft: two windows per bay, belt courses at the 7th and 31st floors, plain wall between
  winsP(B.p(win), H, 31.2, 132.5, 3.9, 2.65, 1.15, 2.3, 0.06);
  bandsP(B.p(tc), H, 128, 134, 4.0, 0.7, 0.12);
  corP(B.p(cor), H, 134.0, 0.9, 0.35);
  // the colonnade (floors 32-35): pilasters between the window columns, capitals band, the elaborate cornice
  mullP(B.p(tc), H, 135, 150, 2.65, 0.75, 0, null, 0.45);
  winsP(B.p(win), H, 136, 149, 3.6, 2.65, 1.15, 2.4, 0.06);
  corP(B.p(tc), H, 149.0, 1.2, 0.5); corP(B.p(cor), H, 150.2, 1.3, 1.1);
  // top storeys 36-38 and the roof cornice
  winsP(B.p(win), H, 152, 158.4, 3.3, 2.65, 1.1, 2.1, 0.06);
  bandsP(B.p(tc), H, 151.5, 158, 3.3, 0.4, 0.1);
  corP(B.p(cor), H, YT - 0.9, 0.9, 0.6); flatP(B.p(roof), H, YT + 0.02);
  // corner medallions at the 7th and 31st floors
  for (const P of [LOT]) for (const p of P){ const c = cenP(P), dx = p[0] - c[0], dz = p[1] - c[1], l = Math.hypot(dx, dz);
    if (Math.abs(p[0]) < 40) continue; for (const y of [26.5]) boxP(B.p(cor), 2.0, 2.0, 2.0, p[0] - dx/l*1.2, y, p[1] - dz/l*1.2); }
  // the penthouse (two storeys, pilastered) and the centre tower
  prismP(B.p(tc), PH, YT, YT + 6.2); mullP(B.p(cor), PH, YT, YT + 6, 2.65, 0.5, 0, null, 0.3);
  winsP(B.p(win), PH, YT + 1, YT + 5.6, 3.0, 2.65, 1.1, 2.0, 0.06); corP(B.p(cor), PH, YT + 6.0, 0.5, 0.4);
  { const T = offP(PH, 7.5); prismP(B.p(tc), T, YT + 6.2, 169); corP(B.p(cor), T, 168.4, 0.6, 0.35); winsP(B.p(win), T, YT + 7, 168, 3, 2.65, 1.1, 1.8, 0.06); }
  // Broadway and Nassau entrances: giant pilasters round a double-height arch, in the middle of each end front
  for (const sx of [-1, 1]){ const i = edgeTo(LOT, sx, 0), F = edgeF(LOT, i, 0.2), u = F.L/2;
    for (const du of [-6.2, -3.4, 3.4, 6.2]){ const p = F.f(u + du, 0, 0.5); boxP(B.p(gran), 1.1, 16, 1.0, p[0], 0, p[2], Math.atan2(-F.uz, F.ux)); boxP(B.p(cor), 1.5, 1.0, 1.4, p[0], 16, p[2], Math.atan2(-F.uz, F.ux)); }
    archP(B.p(gwin), F, u, 0.4, 5.2, 7.5, 0.3);
    { const a = F.f(u - 7.2, 17.0, 0.9), b = F.f(u + 7.2, 17.0, 0.9); segP(B.p(cor), a, b, 0.6, 4); } }
  B.flush(g);
  return g; }};
place('nyequitable');

// ===== Standard Oil Building (Carrère & Hastings with Shreve, Lamb & Blake, 1921-28), 26 Broadway: 31 storeys, 158.5 m to the
// top (enwiki infobox). The base fills the pentagonal lot and follows the curve of Broadway as a 12-storey limestone cliff
// (rusticated lowest four storeys, quoins, an intermediate cornice at the 13th, a colonnade on the 14th-16th), setbacks at the
// 10th floor on New / Beaver Streets and above the 16th; the tower is aligned with the street grid, not with Broadway, sets back
// above the 18th and 22nd floors (obelisks on the corners of the 22nd-floor setback), its three top storeys ringed by an Ionic
// colonnade, and ends in a stepped pyramid with the old lamp cauldron on top. Buff Indiana limestone. Tiers from the OSM parts
// (base 20 / 54 / 78 m, tower 86 / 104 / 120 / 139 / 143 / 147 / 158 m). Night: floodlit stone, the crown lit.
// Frame: rot -20 deg; Broadway / Bowling Green = the curved south-west front (-x / +z), Beaver Street +z, -z = Morris Street side.
LANDMARKS.nystandardoil = {zh:'标准石油大厦', en:'Standard Oil Building', cat:'old', r:41, h:158.5,
  lt:{m:1, c:'#ffeccc', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.nystandardoil;
  const lime = {c:'#d5c9ad', m:1, fh:3.8, cw:1.6}, rust = {c:'#c8bb9d', m:0, lk:0.95}, lime2 = {c:'#ddd3bb', m:0, lk:1.15, glow:'#ffe9c4', gk:0.12};
  const win = {c:'#454a4f', m:1, fh:3.8, cw:1.6}, gwin = {c:'#3c4248', glow:'#ffd9a6', gk:0.3}, roof = {c:'#8a8780', m:0, lk:0.2}, bronze = {c:'#6b5f48', m:0, lk:0.8, glow:'#ffcf80', gk:0.25};
  const P = D.p.map(p => [p[0], p[1], cleanP(p[2], 0.15)]);
  const T = h => P.filter(p => p[1] === h);
  // ---- base parts: walls, window grid, quoined corners, cornices at 13th (≈52 m) and the tops
  for (const [b, t, Q] of P.filter(p => p[1] <= 78)){
    prismP(B.p(lime), Q, -5, t); winsP(B.p(win), Q, 18, t - 2.2, 3.8, 1.9, 1.05, 2.25, 0.06);
    corP(B.p(lime2), Q, t - 0.9, 0.9, 0.4); flatP(B.p(roof), Q, t + 0.02); }
  { const Q = T(78)[0][2];
    // rusticated base (four storeys) with arched openings, the 13th-storey cornice and the 14th-16th storey colonnade
    prismP(B.p(rust), offP(Q, -0.12), -5, 16.5, true); bandsP(B.p(lime2), offP(Q, -0.12), 0, 16.5, 1.1, 0.12, 0.05);
    for (let i = 0; i < Q.length; i++){ const F = edgeF(Q, i, 0.2); if (F.L < 4) continue; const n = Math.max(1, Math.floor(F.L/4.4));
      for (let k = 0; k < n; k++) archP(B.p(gwin), F, (k + 0.5)*F.L/n, 0.6, 2.4, 4.6, 0.02); }
    winsP(B.p(gwin), offP(Q, -0.12), 9.0, 15.5, 3.4, 2.2, 1.1, 2.2, 0.06);
    corP(B.p(lime2), Q, 16.5, 0.8, 0.5); corP(B.p(lime2), Q, 49.5, 1.0, 0.6);
    mullP(B.p(lime2), Q, 51, 62, 2.2, 0.8, 0, null, 0.6); corP(B.p(lime2), Q, 62, 1.0, 0.7);
    // quoins up the corners of the Broadway cliff
    for (let i = 0; i < Q.length; i++){ const a = Q[i], pv = Q[(i + Q.length - 1) % Q.length], nx = Q[(i + 1) % Q.length];
      const c1 = Math.atan2(a[1] - pv[1], a[0] - pv[0]), c2 = Math.atan2(nx[1] - a[1], nx[0] - a[0]); let tw = Math.abs(((c2 - c1 + 3*PI) % TAU) - PI); if (tw < 0.5) continue;
      for (let y = 16.5; y < 48; y += 1.8) boxP(B.p(lime2), (y/1.8 | 0) % 2 ? 1.6 : 1.1, 0.9, (y/1.8 | 0) % 2 ? 1.1 : 1.6, a[0], y, a[1], c1); } }
  // main Broadway entrance: recessed double-height arch on the curve, flanked by arched windows
  { const Q = T(78)[0][2], i = edgeTo(Q, -0.6, 0.8), F = edgeF(Q, i, 0.2); archP(B.p(gwin), F, F.L/2, 0.3, 4.6, 6.0, 0.1); prismP(B.p(lime2), [F.f(F.L/2 - 3.4, 0, 0.0).filter((v, k) => k !== 1), F.f(F.L/2 + 3.4, 0, 0).filter((v, k) => k !== 1), F.f(F.L/2 + 3.4, 0, 0.6).filter((v, k) => k !== 1), F.f(F.L/2 - 3.4, 0, 0.6).filter((v, k) => k !== 1)], 9.5, 10.6); }
  // ---- tower: 78-86 (the 17th-22nd floors block), 86-104 / 86-120 shaft, 120-139 colonnaded top storeys
  const t86 = T(86)[0][2], t104 = T(104)[0][2], t120 = T(120)[0][2], t139 = T(139)[0][2], t143 = T(143)[0][2], t147 = T(147)[0][2], t158 = T(158)[0][2], tL = T(158.5)[0][2];
  blockP(B, t86, 76, 86, {wall:lime, win, fh:3.8, sp:1.9, ww:1.05, wh:2.25, cop:lime2, co:0.4});
  blockP(B, t104, 84, 104, {wall:lime, win, fh:3.8, sp:1.9, ww:1.05, wh:2.25, cop:lime2, co:0.35});
  blockP(B, t120, 84, 120, {wall:lime, win, fh:3.8, sp:1.9, ww:1.05, wh:2.25, cop:lime2, co:0.35});
  flatP(B.p(roof), t86, 86.02); flatP(B.p(roof), t104, 104.02);
  // obelisks on the corners of the 22nd-floor setback
  for (const p of t86){ const c = cenP(t86), dx = p[0] - c[0], dz = p[1] - c[1], l = Math.hypot(dx, dz), q = [p[0] - dx/l*1.6, p[1] - dz/l*1.6];
    boxP(B.p(lime2), 1.6, 1.2, 1.6, q[0], 86, q[1]); loftP(B.p(lime2), [ring3(rectP(q[0] - 0.55, q[0] + 0.55, q[1] - 0.55, q[1] + 0.55), 87.2), ring3(rectP(q[0] - 0.3, q[0] + 0.3, q[1] - 0.3, q[1] + 0.3), 94.5)], false);
    loftP(B.p(lime2), [ring3(rectP(q[0] - 0.3, q[0] + 0.3, q[1] - 0.3, q[1] + 0.3), 94.5), ring3(rectP(q[0] - 0.02, q[0] + 0.02, q[1] - 0.02, q[1] + 0.02), 95.6)], true); }
  // the colonnaded top storeys: a recessed core, free Ionic columns on all four sides, entablature
  { const core = offP(t139, -0.4); prismP(B.p(lime), core, 119, 139); winsP(B.p(gwin), core, 122, 136, 4.6, 2.2, 1.3, 3.6, 0.06);
    for (let i = 0; i < t120.length; i++){ const F = edgeF(t120, i, -0.9); if (F.L < 6) continue; const n = Math.max(2, Math.round(F.L/2.4)) + 1;
      colsP(B.p(lime2), B.p(lime2), F, 0.8, F.L - 0.8, n, 0, 121, 135.5, 0.42, 8); }
    corP(B.p(lime2), t120, 120, 1.0, 0.3); corP(B.p(lime2), t120, 135.5, 2.2, 0.35); corP(B.p(lime2), t139, 137.7, 1.3, 0.6); }
  // the stepped pyramid: the parts' tiers 139 / 143 / 147, then fine steps to the cauldron platform
  prismP(B.p(lime2), t139, 139, 143); bandsP(B.p(lime), t139, 139, 143, 0.9, 0.12, 0.04);
  prismP(B.p(lime2), t143, 143, 147); bandsP(B.p(lime), t143, 143, 147, 0.9, 0.12, 0.04);
  stepPyrP(B.p(lime2), t158, 147, 8, 1.15, 0.38);
  // the cauldron (lamp) on its pedestal; once lit by kerosene lamps (extinguished after 1956) - here a bronze bowl, floodlit
  { const c = cenP(tL); LCyl(g, 1.3, 1.0, 1.4, c[0], 156.2, c[1], dsS(lime2), 12); LCyl(g, 2.0, 1.1, 0.9, c[0], 157.6, c[1], dsS(bronze), 14); }
  B.flush(g);
  return g; }};
place('nystandardoil');

// ===== Federal Reserve Bank of New York (York & Sawyer, 1924), 33 Liberty Street: a Florentine palazzo filling the block between
// Liberty Street, Nassau Street, Maiden Lane and William Street, narrowing towards its east end. 14 storeys above ground:
// a two-storey base, a seven-storey midsection, a five-storey top; rusticated limestone and sandstone with deep joints; round-
// arched ground-floor windows with wrought-iron grilles, a double-height arched entrance on Liberty Street flanked by wrought-iron
// lanterns, a balustraded balcony at the 3rd storey, two windows per bay (round-arched on the 3rd), small arched windows between
// the cornice corbels of the 10th, an arched loggia round the 12th-13th storeys behind a balcony, a quarry-tile roof and a round
// tower at the east end (enwiki). Heights from the OSM parts: walls 50.7 m, loggia to 69.2 m, hipped tile roof to 78.4 m, the
// east tower 60 m (no published height). Night: floodlit stone, the lanterns and the loggia glowing.
// Frame: rot +42 deg; -x = Liberty Street, +x = Maiden Lane, -z = Nassau Street (west), +z = William Street (east, the narrow end).
LANDMARKS.nyfedreserve = {zh:'纽约联邦储备银行', en:'Federal Reserve Bank of New York', cat:'old', r:78, h:79,
  lt:{m:0, c:'#ffe4bd', k:0.85, e:0.5, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.nyfedreserve;
  const st = {c:'#bdb5a3', m:0}, st2 = {c:'#a9a08d', m:0}, st3 = {c:'#c9c1af', m:0, lk:1.1}, win = {c:'#3c3f41', glow:'#ffd8a0', gk:0.22};
  const iron = {c:'#26272a', m:0, lk:0.3}, glow = {c:'#ffe2a8', glow:'#ffd27a', gk:1.4}, tile = {c:'#9c7f62', m:0, lk:0.45}, loggia = {c:'#4b4a45', glow:'#ffd9a0', gk:0.45};
  const M = cleanP(D.p.find(p => p[1] === 50.7)[2]), L = cleanP(D.p.find(p => p[1] === 69.2)[2]), TW = D.p.find(p => p[1] === 60)[2], RF = D.p.filter(p => p[1] === 78.4), TOP = D.p.find(p => p[1] === 79)[2];
  // main block to the cornice: base (2 storeys, 0-11 m) rusticated, midsection with deep horizontal joints
  prismP(B.p(st), M, -5, 50.7);
  bandsP(B.p(st2), M, -1, 49, 0.85, 0.16, 0.06);
  for (let i = 0; i < M.length; i++){ const F = edgeF(M, i, 0.06); if (F.L < 5) continue;
    const n = Math.max(1, Math.floor(F.L/4.6)), s0 = (F.L - n*4.6)/2 + 2.3;
    for (let k = 0; k < n; k++){ const u = s0 + k*4.6;
      archP(B.p(win), F, u, 1.2, 2.2, 3.4, 0.02);                                   // ground floor: arched windows with grilles
      for (const d of [-0.55, 0, 0.55]) quadP(B.p(iron), F.f(u + d - 0.05, 1.2, 0.08), F.f(u + d + 0.05, 1.2, 0.08), F.f(u + d + 0.05, 4.6, 0.08), F.f(u + d - 0.05, 4.6, 0.08));
      quadP(B.p(win), F.f(u - 0.9, 7.0, 0.02), F.f(u + 0.9, 7.0, 0.02), F.f(u + 0.9, 9.2, 0.02), F.f(u - 0.9, 9.2, 0.02));   // 2nd storey: rectangular
      for (const d of [-1.05, 1.05]){
        archP(B.p(win), F, u + d, 12.4, 1.1, 1.9, 0.02);                            // 3rd storey: round-arched pairs
        for (let y = 16.6; y < 40; y += 3.75) quadP(B.p(win), F.f(u + d - 0.55, y, 0.02), F.f(u + d + 0.55, y, 0.02), F.f(u + d + 0.55, y + 2.1, 0.02), F.f(u + d - 0.55, y + 2.1, 0.02)); }
      archP(B.p(win), F, u, 42.4, 1.1, 1.0, 0.02);                                  // 10th: small arched windows between corbels
      quadP(B.p(win), F.f(u - 0.6, 46.4, 0.02), F.f(u + 0.6, 46.4, 0.02), F.f(u + 0.6, 48.6, 0.02), F.f(u - 0.6, 48.6, 0.02));   // 11th
    } }
  // cornices: over the base, the 3rd-storey balcony with its balustrade, the corbelled main cornice
  corP(B.p(st3), M, 10.6, 0.8, 0.35); corP(B.p(st3), M, 11.4, 0.4, 0.9);
  { const Mb = offP(M, -0.8); for (let i = 0; i < Mb.length; i++){ const F = edgeF(Mb, i, 0); for (let u = 0.4; u < F.L - 0.3; u += 0.55){ const p = F.f(u, 11.8, 0); segP(B.p(st3), p, [p[0], 12.7, p[2]], 0.12, 4); } }
    prismP(B.p(st3), Mb, 12.7, 12.95, true); }
  corP(B.p(st3), M, 41.6, 0.5, 0.3); corP(B.p(st3), M, 44.6, 1.6, 1.4); mullP(B.p(st3), M, 42.0, 44.6, 2.3, 0.4, 0, null, 0.9);
  flatP(B.p(st2), M, 50.72);
  // loggia storeys (12-13) behind the balcony: a dark recessed wall seen through a round-arched arcade
  { const Lin = offP(L, 1.6); prismP(B.p(loggia), Lin, 50.7, 66.6); prismP(B.p(st3), L, 50.7, 51.6, true);
    for (let i = 0; i < L.length; i++){ const F = edgeF(L, i, 0); if (F.L < 4) continue; const n = Math.max(1, Math.round(F.L/3.6));
      for (let k = 0; k <= n; k++){ const p = F.f(k*F.L/n, 0, -0.35); boxP(B.p(st), 0.7, 11.2, 0.7, p[0], 51.6, p[2], Math.atan2(-F.uz, F.ux)); }
      for (let k = 0; k < n; k++){ const u0 = k*F.L/n, u1 = (k + 1)*F.L/n, hw = (u1 - u0)/2;
        for (let s = 0; s < 6; s++){ const t0 = PI*s/6, t1 = PI*(s + 1)/6, uc = (u0 + u1)/2;
          quadP(B.p(st), F.f(uc + Math.cos(t0)*hw, 62.8 + Math.sin(t0)*hw*0.8, -0.35), F.f(uc + Math.cos(t1)*hw, 62.8 + Math.sin(t1)*hw*0.8, -0.35), F.f(uc + Math.cos(t1)*hw, 66.6, -0.35), F.f(uc + Math.cos(t0)*hw, 66.6, -0.35)); } } }
    prismP(B.p(st), offP(L, 0.0), 66.6, 69.2); corP(B.p(st3), L, 68.4, 0.9, 0.9); }
  // the quarry-tile hipped roof (the OSM roof facets) and its ridge box
  hipP(B.p(tile), offP(L, -0.6), 69.2, 78.4, 9.5);
  prismP(B.p(tile), TOP, 73.8, 79.0);
  // the round tower at the east end
  { const c = cenP(TW), r = Math.max(...TW.map(p => Math.hypot(p[0] - c[0], p[1] - c[1]))) - 0.3;
    LCyl(g, r, r, 65, c[0], -5, c[1], dsS(st), 20); LCone(g, r + 0.4, 6.0, c[0], 60, c[1], dsS(tile), 20);
    for (let y = 14; y < 56; y += 3.75) for (let k = 0; k < 6; k++){ const a = k/6*TAU + 0.3; boxP(B.p(win), 0.9, 2.0, 0.2, c[0] + Math.cos(a)*(r + 0.03), y, c[1] + Math.sin(a)*(r + 0.03), -a + HP); } }
  // Liberty Street entrance: a double-height arch in the middle of the long front, flanked by wrought-iron lanterns
  { const i = edgeTo(M, -1, 0), F = edgeF(M, i, 0.06), u = F.L*0.5;
    archP(B.p(win), F, u, 0.2, 4.0, 6.6, 0.04);
    for (const s of [-1, 1]){ const p = F.f(u + s*3.6, 4.2, 0.9); lanternP(B, iron, glow, p, 3.2); segP(B.p(iron), F.f(u + s*3.6, 4.5, 0.05), F.f(u + s*3.6, 4.5, 0.9), 0.08, 4); } }
  B.flush(g);
  return g; }};
place('nyfedreserve');

// ===== 14 Wall Street (Bankers Trust Company Building; Trowbridge & Livingston 1912, annex Shreve, Lamb & Harmon 1931-33): the 1912
// tower on the corner of Wall and Nassau Streets is 164.6 m (540 ft) to the top of its stepped pyramid (enwiki infobox, 32 floors):
// granite, a smooth basement and rusticated first floor, a colonnade of fluted columns over the 2nd-4th storeys above the Wall
// Street porch, a deep cornice on the 5th storey, a buff granite shaft, engaged Ionic columns in antis on the 27th-31st storeys
// (setting back the north, east and south faces), the slightly set-back 32nd-floor penthouse, then a seven-storey stepped granite
// pyramid 29 m (94 ft) tall on a 21 m (70 ft) square base (23-24 steps) with a 1.8 m smokestack. The L-shaped Art Deco annex
// (25 storeys, 99 m) wraps the tower's west and north sides: a four-storey granite base on Wall Street, limestone above with
// ribbed piers and aluminium spandrels, setbacks at the 15th, 22nd and 25th floors (enwiki). Annex height and setbacks on the
// rest of the footprint are estimated from those floors. Night: lit offices, the pyramid floodlit.
// Frame: rot -38 deg; +z = Wall Street, +x = Nassau Street, -z = Pine Street; the tower = the OSM part in the south-east corner.
LANDMARKS.ny14wall = {zh:'华尔街14号', en:'14 Wall Street', cat:'old', r:45, h:164.6,
  lt:{m:1, c:'#fff0d6', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.ny14wall;
  const gr = {c:'#cfc7b4', m:1, fh:4.0, cw:1.5}, gr2 = {c:'#dcd5c4', m:0, lk:1.1, glow:'#ffecc8', gk:0.1}, lim = {c:'#d7d0c0', m:1, fh:3.8, cw:1.5}, alu = {c:'#8d9196', m:1, fh:3.8, cw:1.5};
  const win = {c:'#43474b', m:1, fh:4.0, cw:1.5}, gwin = {c:'#3b4046', glow:'#ffd9a6', gk:0.3}, roof = {c:'#86837c', m:0, lk:0.2}, pyr = {c:'#d3ccba', m:0, lk:1.2, glow:'#ffefd2', gk:0.12}, dark = {c:'#57575a', m:0, lk:0.3};
  // the tower = the OSM tower part (27 m) grown to the lot lines on Wall and Nassau Streets (the 1912 lots were ~30 x 30 m);
  // the annex = the rest of the OSM lot ring, an L along Pine Street and the west side
  const L = D.r, tz = D.p[0][2][2][1] - 0.35, tx = D.p[0][2][2][0];
  const T = [[tx, tz], [L[3][0], tz], L[4], [tx + 0.4, L[5][1] + 0.2]];
  const AL = [L[0], L[1], L[2], L[3], [L[3][0], tz], [tx, tz], [tx + 0.4, L[5][1] + 0.2], L[5], L[7], L[9], L[10], L[11]];
  const A1 = AL, A2 = offP(AL, 2.2), A3 = offP(AL, 5.0);
  blockP(B, A1, -5, 58, {wall:lim, strip:win, sp:1.6, ww:0.9, fh:3.8, wy0:16, wt:1.5, band:alu, bstep:3.8, bh:1.2, by0:16, cop:gr2, co:0.35});
  prismP(B.p(gr), offP(A1, -0.12), -5, 15.5, true); winsP(B.p(gwin), offP(A1, -0.12), 1.0, 14.5, 4.4, 2.4, 1.6, 3.2, 0.06);
  corP(B.p(gr2), A1, 15.2, 0.8, 0.45);
  blockP(B, A2, 57, 85, {wall:lim, strip:win, sp:1.6, ww:0.9, fh:3.8, wt:1.5, band:alu, bstep:3.8, bh:1.2, cop:gr2, co:0.35});
  blockP(B, A3, 84, 99, {wall:lim, strip:win, sp:1.6, ww:0.9, fh:3.8, wt:1.5, band:alu, bstep:3.8, bh:1.2, cop:gr2, co:0.35});
  for (const [Q, y] of [[A1, 58], [A2, 85], [A3, 99]]) flatP(B.p(roof), Q, y + 0.02);
  // ---- the 1912 tower: base, shaft, colonnade, penthouse, pyramid
  const YC0 = 112, YC1 = 128, YP = 135.9;
  prismP(B.p(gr), T, -5, YC0);
  // basement / rusticated first floor, colonnade of the 2nd-4th storeys, the 5th-storey cornice
  bandsP(B.p(gr2), T, 0, 6.5, 1.0, 0.14, 0.05);
  for (let i = 0; i < T.length; i++){ const F = edgeF(T, i, 0.0); if (F.L < 8) continue;
    colsP(B.p(gr2), B.p(gr2), F, 1.6, F.L - 1.6, 6, 0.9, 7.0, 19.0, 0.55, 10);
    winsP(B.p(gwin), [F.f(0, 0, 0).filter((v, k) => k !== 1), F.f(F.L, 0, 0).filter((v, k) => k !== 1), F.f(F.L, 0, -2).filter((v, k) => k !== 1), F.f(0, 0, -2).filter((v, k) => k !== 1)], 7.5, 18.5, 3.6, 2.4, 1.4, 2.8, 0.05, j => j === 0); }
  corP(B.p(gr2), T, 6.4, 0.6, 0.3); corP(B.p(gr2), T, 19.0, 1.0, 1.2); corP(B.p(gr2), T, 22.2, 1.4, 1.1);
  // shaft: windows in pairs per bay, corner piers
  winsP(B.p(win), T, 24.2, YC0 - 1.5, 3.9, 1.85, 1.0, 2.35, 0.06);
  // the colonnade (27th-31st): a recessed core with engaged Ionic columns in antis on the north / east / south faces
  { const Tc = offP(T, 1.5); prismP(B.p(gr), Tc, YC0, YC1); winsP(B.p(gwin), Tc, YC0 + 1, YC1 - 1, 3.4, 2.4, 1.2, 2.6, 0.06);
    for (let i = 0; i < T.length; i++){ const F = edgeF(T, i, -0.8); if (F.L < 8) continue;
      colsP(B.p(gr2), B.p(gr2), F, 1.8, F.L - 1.8, 6, 0, YC0 + 0.6, YC1 - 1.6, 0.52, 10);
      for (const u of [0.6, F.L - 0.6]){ const p = F.f(u, 0, 0.3); boxP(B.p(gr), 1.6, YC1 - YC0, 1.6, p[0], YC0, p[2], Math.atan2(-F.uz, F.ux)); } }
    corP(B.p(gr2), T, YC0 - 0.6, 0.6, 0.4); corP(B.p(gr2), T, YC1 - 1.6, 2.0, 0.3); corP(B.p(gr2), T, YC1 + 0.4, 1.2, 0.8); }
  // penthouse (32nd) slightly set back with a molded cornice
  { const Tp = offP(T, 2.6); prismP(B.p(gr), Tp, YC1, YP); winsP(B.p(gwin), Tp, YC1 + 2.2, YP - 1.4, 4.0, 1.9, 1.0, 2.2, 0.06); corP(B.p(gr2), Tp, YP - 0.9, 0.9, 0.5); }
  // the stepped pyramid: 21.3 m square at the base, 29 m tall in 24 steps, to the smokestack
  { const c = cenP(T), hw0 = 10.65, n = 24, dh = (164.6 - 2.2 - YP)/n, ry = Math.atan2(T[1][1] - T[0][1], T[1][0] - T[0][0]);
    const sq = (h, y0) => { const R = rotQ(c[0], c[1], -ry); return [R(-h, 0, -h), R(h, 0, -h), R(h, 0, h), R(-h, 0, h)].map(p => [p[0], p[2]]); };
    for (let k = 0; k < n; k++){ const hw = hw0 - k*(hw0 - 1.4)/n; prismP(B.p(pyr), sq(hw, 0), YP + k*dh, YP + (k + 1)*dh); }
    LCyl(g, 0.9, 0.9, 2.2 + 0.4, c[0], 164.6 - 2.2 - 0.4, c[1], dsS(dark), 12); }
  // Wall Street porch: dark doors between the base columns
  { const i = edgeTo(T, 0, 1), F = edgeF(T, i, 0.05); quadP(B.p(gwin), F.f(F.L/2 - 3, 0.3, 0), F.f(F.L/2 + 3, 0.3, 0), F.f(F.L/2 + 3, 5.6, 0), F.f(F.L/2 - 3, 5.6, 0)); }
  B.flush(g);
  return g; }};
place('ny14wall');

// ref metres (east, south) around a key's anchor -> that key's local frame
const refL = (k, e, s) => { const r = PL[k].rot, c = Math.cos(r), sn = Math.sin(r); return [e*c - s*sn, e*sn + s*c]; };
// scale a ring towards its centroid
const shrinkP = (P, k) => { const c = cenP(P); return P.map(p => [c[0] + (p[0] - c[0])*k, c[1] + (p[1] - c[1])*k]); };
// thin finial / pinnacle
const pinP = (o, x, y, z, w, h) => { loftP(o, [ring3(rectP(x - w/2, x + w/2, z - w/2, z + w/2), y), ring3(rectP(x - 0.02, x + 0.02, z - 0.02, z + 0.02), y + h)], false); };

// ===== One Liberty Plaza (Skidmore, Owings & Merrill, 1973): 54 storeys, 226.5 m (enwiki); a black steel-framed office slab on
// the block between Broadway, Liberty, Church and Cortlandt Streets, its deep black spandrel girders forming bold horizontal bands
// between the window strips (the spandrel beams are a recognition hint, not stated in enwiki); glazed lobby behind the perimeter
// columns. Night: lit offices. Frame: rot -30.5 deg; -x = Church Street, +x = Broadway, +z = Liberty Street, -z = Cortlandt Street.
LANDMARKS.nyoneliberty = {zh:'自由广场一号', en:'One Liberty Plaza', cat:'new', r:48, h:226,
  lt:{m:1, c:'#eef3ff', k:0.45}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.nyoneliberty;
  const gl = {c:'#384048', m:1, fh:4.18, cw:1.5}, beam = {c:'#242528', m:0, lk:0.25}, lob = {c:'#46525c', glow:'#fff1dc', gk:0.4}, roof = {c:'#6f7275', m:0, lk:0.2};
  const P = cleanP(D.r), H = 226;
  prismP(B.p(gl), P, 9.5, H - 3);
  prismP(B.p(lob), offP(P, 2.6), -5, 9.6);
  mullP(B.p(beam), P, -5, 9.6, 9.1, 1.1, -0.55, null, 1.1);
  for (let y = 9.6 + 2.5; y < H - 4; y += 4.18) prismP(B.p(beam), offP(P, -0.6), y, y + 1.5);
  mullP(B.p(beam), P, 9.6, H - 3, 1.52, 0.16, 0.0, null, 0.3);
  prismP(B.p(beam), offP(P, -0.6), H - 4.5, H); flatP(B.p(roof), offP(P, -0.6), H + 0.03);
  corP(B.p(beam), P, 9.0, 1.2, 0.7);
  B.flush(g);
  return g; }};
place('nyoneliberty');

// ===== 140 Broadway (Marine Midland Building; SOM / Gordon Bunshaft, 1967): 210 m, 51-52 storeys (enwiki); a flush curtain wall of
// dark glass in black aluminium frames on the rhomboid footprint (7 bays of 6 windows on the long faces), set back behind a white
// travertine plaza on Broadway. On the plaza's north side Isamu Noguchi's Red Cube: a vermilion rhombohedron 8.5 m (28 ft) tall
// standing on one corner, pierced by a cylindrical hole (enwiki); placed at the OSM artwork node "Red Cube". Night: lit offices.
// Frame: rot -36.9 deg; -x = Broadway (the plaza), +x = Nassau Street, -z = Liberty Street, +z = Cedar Street.
LANDMARKS.ny140broadway = {zh:'百老汇140号', en:'140 Broadway', cat:'new', r:40, h:210,
  lt:{m:1, c:'#eef3ff', k:0.45}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.ny140broadway;
  const gl = {c:'#20252a', m:1, fh:3.9, cw:1.56}, mul = {c:'#3e454c', m:0, lk:0.35}, lob = {c:'#3f4a53', glow:'#fff2dc', gk:0.45}, roof = {c:'#5d6165', m:0, lk:0.2};
  const red = {c:'#c9381f', m:0, lk:0.9}, hole = {c:'#2a1410', m:0, lk:0.2};
  const P = cleanP(D.r), H = 210;
  prismP(B.p(gl), P, 7.6, H); flatP(B.p(roof), offP(P, 0.4), H + 0.03); prismP(B.p(mul), offP(P, -0.12), H - 1.2, H + 0.6, true);
  mullP(B.p(mul), P, 7.6, H - 0.6, 1.56, 0.1, 0.02, null, 0); bandsP(B.p(mul), P, 7.6, H - 0.6, 3.9, 0.14, 0.03);
  mullP(B.p(mul), P, 7.6, H - 0.6, 1.56*6, 0.3, 0.02, null, 0.15);
  prismP(B.p(lob), offP(P, 1.4), -5, 7.8); mullP(B.p(gl), P, -5, 7.8, 9.4, 0.9, -0.45, null, 0.9);
  // the Red Cube on the plaza
  { const q = refL('ny140broadway', -31.6, -33.6), e = 4.9, cy = e*Math.sqrt(3)/2 + 0.05, qu = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 1, 1).normalize(), new THREE.Vector3(0, 1, 0));
    const m = lmAdd(g, new THREE.BoxGeometry(e, e, e), dsS(red), q[0], cy, q[1]); m.quaternion.copy(qu);
    const h = lmAdd(g, new THREE.CylinderGeometry(1.15, 1.15, e + 0.06, 16), dsS(hole), q[0], cy, q[1]); h.quaternion.copy(qu); }
  B.flush(g);
  return g; }};
place('ny140broadway');

// ===== 50 West Street (Helmut Jahn, 2018): 237 m to the top, 64-65 storeys (enwiki); a residential tower of curved glass framed in
// aluminium and braced with stainless steel, its curves rising in one sweep to the parapet, the open-air observatory deck on the
// 64th floor at 224 m inside the glass crown; two low podium wings (OSM parts 16 m). Night: lit flats, the crown glowing.
// Frame: rot -25 deg; -x = West Street, +x = Washington Street, +z = Joseph P. Ward Street.
LANDMARKS.ny50west = {zh:'西街50号', en:'50 West Street', cat:'new', r:30, h:237,
  lt:{m:1, c:'#e9f2ff', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.ny50west;
  const gl = {c:'#8b9ea7', m:1, fh:3.55, cw:1.5}, mul = {c:'#c5cdd2', m:0, lk:0.5}, crown = {c:'#a3b5bd', m:1, fh:3.55, cw:1.5}, lob = {c:'#59656c', glow:'#fff1dc', gk:0.45};
  const pod = {c:'#7f878b', m:1, fh:4.0, cw:1.8}, roof = {c:'#7c8084', m:0, lk:0.2};
  const T = D.p.find(p => p[1] === 237)[2], H = 237, YD = 224;
  prismP(B.p(gl), T, 6, YD); prismP(B.p(lob), offP(T, 1.0), -5, 6.2);
  mullP(B.p(mul), T, 6, YD, 1.5, 0.1, 0.02, null, 0.22); bandsP(B.p(mul), T, 6, YD, 3.55, 0.16, 0.03);
  // the glass crown round the open deck
  prismP(B.p(crown), T, YD, H, true); flatP(B.p(roof), T, YD + 0.03); mullP(B.p(mul), T, YD, H, 1.5, 0.12, 0.02, null, 0.3);
  prismP(B.p(mul), offP(T, -0.1), H - 0.6, H, true);
  for (const [b, t, Q] of D.p.filter(p => p[1] === 16)){ prismP(B.p(pod), Q, -5, t); flatP(B.p(roof), Q, t + 0.02); bandsP(B.p(mul), Q, 0, t, 4.0, 0.2, 0.04); }
  B.flush(g);
  return g; }};
place('ny50west');

// ===== One New York Plaza (William Lescaze & Kahn and Jacobs, 1969): 195-200 m, 50 storeys (enwiki 200 m; OSM parts 195 m + a
// 4 m roof box); a box-like "beehive" facade of aluminium-clad wall elements with the windows recessed in them (enwiki); colour
// not stated - dark bronze aluminium here (estimate). Night: lit offices. Frame: rot +12.4 deg; -x = Whitehall Street, +x = Broad Street.
LANDMARKS.ny1nyplaza = {zh:'纽约广场一号', en:'One New York Plaza', cat:'new', r:53, h:199,
  lt:{m:1, c:'#fff2dc', k:0.45}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.ny1nyplaza;
  const wall = {c:'#3f3a36', m:1, fh:3.9, cw:1.52}, fin = {c:'#5d5650', m:0, lk:0.35}, lob = {c:'#4a5258', glow:'#fff1dc', gk:0.45}, roof = {c:'#6d6a66', m:0, lk:0.2};
  const P = cleanP(D.r, 0.4), H = 195, TOP = D.p.find(p => p[1] === 199)[2];
  prismP(B.p(wall), P, 7, H); flatP(B.p(roof), P, H + 0.03);
  mullP(B.p(fin), P, 7, H - 1.2, 1.52, 0.32, 0, null, 0.5);
  for (let y = 7 + 3.9; y < H - 1; y += 3.9) prismP(B.p(fin), offP(P, -0.5), y - 0.25, y + 0.25);
  prismP(B.p(fin), offP(P, -0.5), H - 1.6, H + 0.4);
  prismP(B.p(lob), offP(P, 1.6), -5, 7.2); mullP(B.p(fin), P, -5, 7.2, 7.6, 1.0, -0.5, null, 1.0);
  prismP(B.p(fin), TOP, H, 199);
  B.flush(g);
  return g; }};
place('ny1nyplaza');

// ===== 17 State Street (Emery Roth & Sons, 1988): 165 m, 42 storeys (enwiki); a quarter-round silvered-glass curtain wall following
// the curve of State Street towards the Battery, the two other faces flat; the office floors stand on aluminium columns 7.6 m
// (25 ft) high over a glass lobby; 3.7 m storeys. OSM parts: the curved skin 10-153 m, the main block to 157 m, a roof box to
// 165 m. Night: lit offices. Frame: rot -1.8 deg; the curve faces south-west (-x / +z), -z = Pearl Street.
LANDMARKS.ny17state = {zh:'州街17号', en:'17 State Street', cat:'new', r:30, h:165,
  lt:{m:1, c:'#eef4ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.ny17state;
  const gl = {c:'#b3bfc7', m:1, fh:3.66, cw:1.5}, mul = {c:'#d9dee2', m:0, lk:0.5}, lob = {c:'#5c6870', glow:'#fff2dc', gk:0.5}, col = {c:'#c7ccd0', m:0, lk:0.5}, roof = {c:'#878b8e', m:0, lk:0.2};
  const M = D.p.find(p => p[1] === 157)[2], S = D.p.find(p => p[1] === 153)[2], TOP = D.p.find(p => p[1] === 165)[2];
  prismP(B.p(gl), M, 7.6, 157); prismP(B.p(gl), S, 10, 153, true);
  mullP(B.p(mul), M, 7.6, 156.5, 1.5, 0.1, 0.02, null, 0); bandsP(B.p(mul), M, 7.6, 156.5, 3.66, 0.12, 0.03);
  prismP(B.p(mul), offP(M, -0.1), 156, 157.4); flatP(B.p(roof), M, 157.05);
  prismP(B.p(lob), offP(M, 2.4), -5, 7.8);
  { const Q = offP(M, 0.8); for (let i = 0; i < Q.length; i++){ const F = edgeF(Q, i, 0); const n = Math.max(1, Math.round(F.L/6));
      for (let k = 0; k < n; k++){ const p = F.f(k*F.L/n, 0, 0); LCyl(g, 0.45, 0.45, 12.6, p[0], -5, p[2], dsS(col), 10); } } }
  prismP(B.p(roof), TOP, 157, 165); mullP(B.p(mul), TOP, 157, 164.6, 2.0, 0.12, 0.02, null, 0);
  B.flush(g);
  return g; }};
place('ny17state');

// ===== 55 Water Street (Emery Roth & Sons, 1972): the 53-storey south tower, 209 m to the roof, joined over its lowest 15 storeys to
// the north wing (enwiki), on a full block by the East River; masonry and glass with bronze-tinted windows; the Elevated Acre,
// a public park on a platform about 9 m (30 ft) up between the wings on the river side; LED lighting under the parapet. Facade
// colours are not stated: grey-beige masonry with dark window ribbons here (estimate). Parts and the park outline from OSM.
// Night: lit offices, the parapet glowing. Frame: rot +41 deg; -z = Water Street, +z = South Street / the FDR Drive, +x = Old Slip.
LANDMARKS.ny55water = {zh:'水街55号', en:'55 Water Street', cat:'new', r:84, h:209,
  lt:{m:1, c:'#eef3ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.ny55water;
  const mas = {c:'#9d958a', m:1, fh:3.9, cw:1.6}, rib = {c:'#3c3b38', m:1, fh:3.9, cw:1.6}, pav = {c:'#bdb7ad', m:0, lk:0.4}, lawn = {c:'#6f8f55', m:0, lk:0.3};
  const roof = {c:'#706d68', m:0, lk:0.2}, led = {c:'#d8dde0', glow:'#e6efff', gk:0.6}, lob = {c:'#4a5258', glow:'#fff1dc', gk:0.4};
  const T = D.p.find(p => p[1] === 209)[2], W = D.p.filter(p => p[1] === 55).map(p => p[2]), PF = cleanP(D.p.find(p => p[1] === 10)[2]);
  prismP(B.p(mas), T, -5, 209); bandsP(B.p(rib), T, 5, 206, 3.9, 1.75, 0.05); flatP(B.p(roof), T, 209.03);
  prismP(B.p(led), offP(T, -0.15), 206.6, 207.2, true); prismP(B.p(mas), offP(T, -0.1), 207.2, 209.4, true);
  for (const Q of W){ prismP(B.p(mas), Q, -5, 55); bandsP(B.p(rib), Q, 5, 53.5, 3.9, 1.75, 0.05); flatP(B.p(roof), Q, 55.03); }
  prismP(B.p(lob), offP(T, 0.6), -5, 5.2, true);
  // the platform and the park on it
  prismP(B.p(pav), PF, -5, 9.2); if (D.a) flatP(B.p(lawn), D.a, 9.25);
  bandsP(B.p(rib), PF, 0, 8.5, 4.2, 1.6, 0.05);
  B.flush(g);
  return g; }};
place('ny55water');

// ===== 60 Wall Street (Kevin Roche John Dinkeloo, 1989): 55 storeys, 227 m (enwiki); through-block site between Wall and Pine
// Streets; a 4-storey base of arcades with paired 21 m (70 ft) columns under a cornice, the 9 m (30 ft) high public atrium
// running between the two entrances; above, a glass tower with bands of green and pink granite in the centre of each face, corners
// notched inward and shaped like banded pilasters (alternating ribbon windows and panels), the top eight storeys' corners shaped
// like columns, and a copper-clad hip roof with the mechanical and communications equipment (enwiki). Plan, tiers and the roof
// facets from the OSM parts (tower 205 m, roof facets to 225 m, top 227 m); podium height 25 m from the OSM lot tag.
// Night: lit offices, the crown lit. Frame: rot -36 deg; +z = Wall Street, -z = Pine Street.
LANDMARKS.ny60wall = {zh:'华尔街60号', en:'60 Wall Street', cat:'new', r:63, h:227,
  lt:{m:1, c:'#fff2dc', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.ny60wall;
  const stone = {c:'#d6d0c4', m:1, fh:3.9, cw:1.5}, gl = {c:'#4e6764', m:1, fh:3.9, cw:1.5}, pink = {c:'#b59c92', m:1, fh:3.9, cw:1.5}, grn = {c:'#6e8478', m:1, fh:3.9, cw:1.5};
  const rib = {c:'#3c4447', m:1, fh:3.9, cw:1.5}, cu = {c:'#8a9a8c', m:0, lk:1.1, glow:'#e8f4e6', gk:0.15}, cu2 = {c:'#c4ccc2', m:0, lk:1.2}, lob = {c:'#59636a', glow:'#fff1dc', gk:0.5}, roof = {c:'#7a7a76', m:0, lk:0.2};
  const LOT = cleanP(D.r, 0.4), T = D.p.find(p => p[1] === 205)[2], C = D.p.find(p => p[1] === 227)[2], YB = 25;
  // podium: the lot to 25 m with the paired-column arcades on Wall and Pine Streets
  prismP(B.p(stone), LOT, -5, YB); flatP(B.p(roof), LOT, YB + 0.02); corP(B.p(stone), LOT, YB - 1.4, 1.4, 0.6);
  for (const dz of [1, -1]){ const i = edgeTo(LOT, 0, dz), F = edgeF(LOT, i, 0); const n = Math.floor((F.L - 4)/7.2);
    quadP(B.p(lob), F.f(1.5, 0, 0.03), F.f(F.L - 1.5, 0, 0.03), F.f(F.L - 1.5, 20.5, 0.03), F.f(1.5, 20.5, 0.03));
    for (let k = 0; k <= n; k++){ const u = (F.L - n*7.2)/2 + k*7.2; colsP(B.p(stone), B.p(stone), F, u - 0.9, u + 0.9, 2, 0.9, 0, 21.3, 0.55, 10); } }
  // tower walls: glass, notch faces and the outer quarter of each long face as stone pilasters with ribbon windows,
  // pink / green granite bands across the middle
  prismP(B.p(gl), T, YB, 205);
  for (let i = 0; i < T.length; i++){ const F = edgeF(T, i, 0.06);
    const segs = F.L < 9 ? [[0, F.L, 1]] : [[0, F.L*0.22, 1], [F.L*0.22, F.L*0.78, 0], [F.L*0.78, F.L, 1]];
    for (const [u0, u1, isS] of segs){
      if (isS){ quadP(B.p(stone), F.f(u0, YB, 0), F.f(u1, YB, 0), F.f(u1, 205, 0), F.f(u0, 205, 0));
        for (let y = YB + 2.2; y < 204; y += 3.9) quadP(B.p(rib), F.f(u0, y, 0.04), F.f(u1, y, 0.04), F.f(u1, y + 1.5, 0.04), F.f(u0, y + 1.5, 0.04)); }
      else for (let y = YB + 0.4, k = 0; y < 204; y += 3.9, k++) quadP(B.p(k % 2 ? grn : pink), F.f(u0, y, 0.04), F.f(u1, y, 0.04), F.f(u1, y + 1.1, 0.04), F.f(u0, y + 1.1, 0.04)); } }
  // the column-shaped corners of the top eight storeys
  for (let i = 0; i < T.length; i++){ const F = edgeF(T, i, 0); if (F.L > 9) continue; const p = F.f(F.L/2, 0, 0.4); LCyl(g, 2.1, 2.1, 205 - 172, p[0], 172, p[2], dsS(stone), 14); }
  corP(B.p(stone), T, 204, 1.2, 0.5);
  // the copper hip roof (OSM facets 205 -> 225) and its flat top (227), latticed with light ribs
  loftP(B.p(cu), [ring3(T, 205.2), ring3(C, 225)], false); prismP(B.p(cu), C, 225, 227);
  for (let k = 0; k < T.length; k++) segP(B.p(cu2), [T[k][0], 205.3, T[k][1]], [C[k][0], 225, C[k][1]], 0.25, 4);
  for (const t of [0.25, 0.5, 0.75]){ const R = T.map((p, k) => [lerp(p[0], C[k][0], t), 205.2 + 19.8*t, lerp(p[1], C[k][1], t)]);
    for (let k = 0; k < R.length; k++) segP(B.p(cu2), R[k], R[(k + 1) % R.length], 0.18, 4); }
  B.flush(g);
  return g; }};
place('ny60wall');

// ===== 195 Broadway (former AT&T Building; William Welles Bosworth, 1916-22): 121 m to the roof, 129 m to the tip, 29 floors
// (enwiki); white Vermont granite with grey granite columns: a double-height Doric ground floor, eight triple-height Ionic
// colonnades above (upper columns slightly set back and thinner), a tall parapet; the campanile over the westernmost three bays on
// Fulton Street with a stepped pyramidal crown (the gilded statue that stood on it was removed in 1981). Tiers from the OSM
// parts: main block 114 m, attic 120 m, campanile 129 m. Night: floodlit granite, lit offices.
// Frame: rot -31 deg; +x = Broadway, -z = Fulton Street, +z = Dey Street.
LANDMARKS.ny195broadway = {zh:'百老汇195号', en:'195 Broadway', cat:'old', r:56, h:129,
  lt:{m:1, c:'#fff0d8', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.ny195broadway;
  const wg = {c:'#e2dfd6', m:1, fh:3.95, cw:1.5}, gg = {c:'#b6b5ae', m:0, lk:1.0}, wg2 = {c:'#ece9e1', m:0, lk:1.15, glow:'#fff0d8', gk:0.1}, win = {c:'#41464b', m:1, fh:3.95, cw:1.5};
  const gwin = {c:'#3b4148', glow:'#ffdcae', gk:0.3}, roof = {c:'#888680', m:0, lk:0.2};
  const M = cleanP(D.p.find(p => p[1] === 114)[2]), A = cleanP(D.p.find(p => p[1] === 120)[2]), CA = D.p.find(p => p[1] === 129)[2];
  prismP(B.p(wg), M, -5, 114); flatP(B.p(roof), M, 114.02);
  winsP(B.p(gwin), M, 0.8, 8.0, 8, 2.35, 1.5, 6.6, 0.06);
  winsP(B.p(win), M, 10.6, 106, 3.95, 2.35, 1.2, 2.3, 0.06);
  for (let i = 0; i < M.length; i++){ const F = edgeF(M, i, 0); if (F.L < 8) continue; const n = Math.max(2, Math.round(F.L/4.7)) + 1;
    colsP(B.p(gg), B.p(wg2), F, 1.2, F.L - 1.2, n, 0.75, 0, 8.6, 0.62, 8);
    for (let t = 0; t < 8; t++){ const y0 = 9.8 + t*12; colsP(B.p(gg), B.p(wg2), F, 1.2, F.L - 1.2, n, 0.55, y0 + 0.5, y0 + 11.2, 0.5 - t*0.012, 8); } }
  corP(B.p(wg2), M, 8.6, 1.2, 1.3);
  for (let t = 0; t < 8; t++) corP(B.p(wg2), M, 9.8 + t*12 + 11.2, 0.8, 1.05);
  corP(B.p(wg2), M, 112.6, 1.4, 0.7);
  prismP(B.p(wg), A, 113.5, 120); winsP(B.p(win), A, 115, 119, 3.6, 2.35, 1.1, 2.2, 0.06); corP(B.p(wg2), A, 119.3, 0.7, 0.4);
  // the campanile top and its stepped pyramid
  prismP(B.p(wg), CA, 113.5, 121.5); corP(B.p(wg2), CA, 121.0, 0.8, 0.5); stepPyrP(B.p(wg2), CA, 121.8, 7, 1.0, 0.6);
  B.flush(g);
  return g; }};
place('ny195broadway');

// ===== American Surety Building (Bruce Price, 1896; widened by four bays and raised two storeys 1920-22), 100 Broadway: 103 m,
// 23 storeys (enwiki); Maine granite: a 3-storey base with a two-storey Ionic colonnade carrying a seven-bay portico on Broadway,
// a 12-storey banded shaft with transitional storeys at floors 4 and 15 and sculptures across floors 14-15, a 6-storey crown with
// Corinthian pilasters under a large stone cornice above floor 21, and the two-storey penthouse (OSM parts 91.1-99 / 99-103 m).
// Night: floodlit granite, lit offices. Frame: rot -33.6 deg; -x = Broadway, -z = Pine Street.
LANDMARKS.nyamsurety = {zh:'美国担保大厦', en:'American Surety Building', cat:'old', r:32, h:103,
  lt:{m:1, c:'#fff0d8', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.nyamsurety;
  const gr = {c:'#cdc8bc', m:1, fh:3.9, cw:1.5}, gr2 = {c:'#dcd8cd', m:0, lk:1.1, glow:'#fff0d8', gk:0.1}, win = {c:'#42474c', m:1, fh:3.9, cw:1.5}, gwin = {c:'#3b4148', glow:'#ffdcae', gk:0.3}, roof = {c:'#86847e', m:0, lk:0.2};
  const P = cleanP(D.r), PH = D.p.find(p => p[1] === 99)[2], PT = D.p.find(p => p[1] === 103)[2], YC = 91;
  prismP(B.p(gr), P, -5, YC); flatP(B.p(roof), P, YC + 0.02);
  bandsP(B.p(gr2), P, 0, 13.5, 1.1, 0.14, 0.05);
  winsP(B.p(gwin), P, 1.0, 12.5, 4.2, 3.5, 2.0, 3.2, 0.06);
  winsP(B.p(win), P, 14.5, 89, 3.9, 1.75, 1.0, 2.3, 0.06);
  corP(B.p(gr2), P, 13.3, 0.9, 0.5); corP(B.p(gr2), P, 17.2, 0.6, 0.3); corP(B.p(gr2), P, 63.8, 0.8, 0.45); corP(B.p(gr2), P, 67.6, 0.6, 0.35);
  bandsP(B.p(gr2), P, 17.8, 63, 11.7, 0.45, 0.08);
  mullP(B.p(gr2), P, 68.2, 89.4, 3.5, 0.6, 0, null, 0.35);
  corP(B.p(gr2), P, 89.4, 1.6, 1.6);
  // the Broadway portico: two-storey Ionic colonnade of eight columns (seven bays), entablature
  { const i = edgeTo(P, -1, 0), F = edgeF(P, i, 0), w = 3.3*7;
    colsP(B.p(gr2), B.p(gr2), F, F.L/2 - w/2, F.L/2 + w/2, 8, 1.6, 0.6, 9.4, 0.55, 10);
    prismP(B.p(gr2), [F.f(F.L/2 - w/2 - 1, 0, 0), F.f(F.L/2 + w/2 + 1, 0, 0), F.f(F.L/2 + w/2 + 1, 0, 2.5), F.f(F.L/2 - w/2 - 1, 0, 2.5)].map(p => [p[0], p[2]]), 9.4, 10.6);
    // sculptures flanking the third-storey windows (abstract draped figures)
    for (let k = 0; k < 6; k++){ const p = F.f(F.L/2 - w/2 + 1.6 + k*(w - 3.2)/5, 0, 1.2); segP(B.p(gr2), [p[0], 10.6, p[2]], [p[0], 13.0, p[2]], 0.42, 6, 0.3); LSph(g, 0.3, p[0], 13.3, p[2], dsS(gr2), 1, 8); } }
  // penthouse (two storeys) with its cornice
  prismP(B.p(gr), PH, YC, 99); winsP(B.p(win), PH, YC + 1.2, 98, 3.4, 1.75, 1.0, 2.0, 0.06); corP(B.p(gr2), PH, 98.3, 0.7, 0.4);
  prismP(B.p(gr), PT, 99, 103); corP(B.p(gr2), PT, 102.4, 0.6, 0.3);
  B.flush(g);
  return g; }};
place('nyamsurety');

// ===== Trinity and United States Realty Buildings (Francis H. Kimball): the United States Realty Building (1907, 115 Broadway,
// north of Thames Street) and the Trinity Building (1905/1907, 111 Broadway, beside Trinity churchyard), narrow neo-Gothic
// towers of Indiana limestone over granite basements: a 4-storey base, a 13-storey shaft and a 4-storey Gothic capital, about
// 21 storeys (enwiki). Heights: OSM / app 86 m (not verified); the Trinity Building's corner tower from its OSM parts (86-96-105 m).
// The 1912 copper roof addition and the bridge across Thames Street are left out (their positions are not documented here).
// Night: floodlit limestone, lit offices. Frames: rot -30 deg; +x = Broadway, -x = Trinity Place; US Realty: -z = Cedar Street,
// +z = Thames Street; Trinity Building (sub-key, unlabelled): -z = Thames Street, +z = the churchyard.
function kimballP(B, P, H, sp){
  const lim = {c:'#cfc8b6', m:1, fh:3.9, cw:1.4}, lim2 = {c:'#ddd7c8', m:0, lk:1.1, glow:'#fff0d8', gk:0.1}, gran = {c:'#a9a59c', m:0, lk:0.9};
  const win = {c:'#42474b', m:1, fh:3.9, cw:1.4}, gwin = {c:'#3b4148', glow:'#ffdcae', gk:0.3}, roof = {c:'#7e7c77', m:0, lk:0.2};
  prismP(B.p(lim), P, -5, H); flatP(B.p(roof), P, H + 0.02);
  prismP(B.p(gran), offP(P, -0.1), -5, 4.5, true);
  winsP(B.p(gwin), P, 1.0, 15.5, 4.4, sp, 1.6, 3.4, 0.06); corP(B.p(lim2), P, 16.2, 0.8, 0.45);
  winsP(B.p(win), P, 17.6, H - 18, 3.9, sp/2, 1.0, 2.3, 0.06);
  mullP(B.p(lim2), P, 16.8, H - 1.4, sp, 0.55, 0, null, 0.4);
  corP(B.p(lim2), P, H - 17.2, 0.7, 0.4);
  // Gothic capital: pointed windows in each bay, a parapet with pinnacles on every pier
  for (let i = 0; i < P.length; i++){ const F = edgeF(P, i, 0.06); if (F.L < sp) continue; const n = Math.floor(F.L/sp), s0 = (F.L - n*sp)/2;
    for (let k = 0; k < n; k++){ gothP(B.p(win), F, s0 + (k + 0.5)*sp, H - 15.5, sp*0.62, 8.5, 0.02); gothP(B.p(win), F, s0 + (k + 0.5)*sp, H - 5.2, sp*0.5, 2.2, 0.02); }
    for (let k = 0; k <= n; k++){ const p = F.f(s0 + k*sp, 0, 0.3); pinP(B.p(lim2), p[0], H, p[2], 0.8, 3.6); } }
  prismP(B.p(lim2), offP(P, -0.15), H, H + 1.3, true);
}
LANDMARKS.nytrinityusrealty = {zh:'三一与美国地产大厦', en:'Trinity and United States Realty Buildings', cat:'old', r:47, h:86,
  lt:{m:1, c:'#fff0d8', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.nytrinityusrealty;
  kimballP(B, cleanP(D.r), 86, 3.7);
  B.flush(g);
  return g; }};
place('nytrinityusrealty');
LANDMARKS.nytrinityusrealty_b = {zh:'三一大厦', en:'Trinity Building', cat:'old', r:44, h:105, label:false,
  lt:{m:1, c:'#fff0d8', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.nytrinityusrealty_b;
  const lim = {c:'#cfc8b6', m:1, fh:3.9, cw:1.4}, lim2 = {c:'#ddd7c8', m:0, lk:1.1, glow:'#fff0d8', gk:0.12}, win = {c:'#42474b', glow:'#ffdcae', gk:0.25}, sl = {c:'#5f6a68', m:0, lk:0.8};
  kimballP(B, cleanP(D.p.find(p => p[1] === 86)[2]), 86, 3.7);
  // the corner tower on Broadway / Thames Street (OSM parts 86-96, 96-105)
  const T1 = D.p.find(p => p[1] === 96)[2], T2 = D.p.find(p => p[1] === 105)[2];
  prismP(B.p(lim), T1, 85, 96); { const c = cenP(T1); for (let i = 0; i < T1.length; i++){ const F = edgeF(T1, i, 0.05); if (F.L > 2) gothP(B.p(win), F, F.L/2, 88, 1.2, 4.2, 0.02); } }
  corP(B.p(lim2), T1, 95.4, 0.6, 0.3);
  prismP(B.p(lim), T2, 96, 100); corP(B.p(lim2), T2, 99.5, 0.5, 0.25);
  loftP(B.p(sl), [ring3(T2, 100), ring3(shrinkP(T2, 0.05), 105)], true);
  B.flush(g);
  return g; }};
place('nytrinityusrealty_b');

// ===== 90 West Street (Cass Gilbert, 1907): 98.8 m, 23 storeys (enwiki); lower floors fill the parallelogram lot, the upper floors
// a C round a small east-facing light court; a 3-storey Fox Island granite base with segmental arches and a double-height arched
// centre entrance, beige terracotta above with tall three-quarter piers from the 4th to the 15th floors, a transitional 16th under
// a cornice, a triple-height arcade on floors 17-19, colonettes on the 20th, and a copper mansard (floors 21-23) with dormers and
// little tourelles. 9 bays on West Street, 7 on Cedar, 6 on Albany. Night: floodlit terracotta, the copper roof lit.
// Frame: rot -25 deg; -x = West Street, -z = Cedar Street, +z = Albany Street (the light court opens to +x).
LANDMARKS.ny90west = {zh:'西街90号', en:'90 West Street', cat:'old', r:37, h:98.8,
  lt:{m:1, c:'#ffeccc', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.ny90west;
  const tc = {c:'#d8c7a5', m:1, fh:3.8, cw:1.4}, tc2 = {c:'#e4d6b8', m:0, lk:1.1, glow:'#ffecc8', gk:0.12}, gran = {c:'#a8a59f', m:0, lk:0.9}, win = {c:'#41454a', m:1, fh:3.8, cw:1.4};
  const gwin = {c:'#3b4148', glow:'#ffdcae', gk:0.3}, cu = {c:'#5f8f7a', m:0, lk:1.0, glow:'#cfeedd', gk:0.12}, roof = {c:'#7f7d78', m:0, lk:0.2};
  const P = cleanP(D.r), YM = 84;
  prismP(B.p(tc), P, -5, YM);
  prismP(B.p(gran), offP(P, -0.12), -5, 12.5, true); corP(B.p(gran), P, 12.3, 0.8, 0.4);
  for (let i = 0; i < P.length; i++){ const F = edgeF(P, i, 0.15); if (F.L < 5) continue; const n = Math.max(1, Math.round(F.L/4.3));
    for (let k = 0; k < n; k++) archP(B.p(gwin), F, (k + 0.5)*F.L/n, 0.8, 2.8, 4.4, 0.02); }
  winsP(B.p(win), P, 13.8, 61, 3.8, 2.15, 1.05, 2.4, 0.06);
  mullP(B.p(tc2), P, 13, 61.5, 4.3, 0.75, 0, null, 0.45);
  corP(B.p(tc2), P, 61.4, 0.6, 0.4); winsP(B.p(win), P, 62.6, 65.4, 3.8, 2.15, 1.05, 2.2, 0.06); corP(B.p(tc2), P, 66.0, 1.0, 0.7);
  for (let i = 0; i < P.length; i++){ const F = edgeF(P, i, 0.06); if (F.L < 4) continue; const n = Math.max(1, Math.round(F.L/4.3));
    for (let k = 0; k < n; k++) archP(B.p(win), F, (k + 0.5)*F.L/n, 67.6, 3.0, 8.4, 0.02); }
  mullP(B.p(tc2), P, 67, 81.5, 4.3, 0.6, 0, null, 0.35);
  corP(B.p(tc2), P, 78.4, 0.5, 0.3); winsP(B.p(win), P, 79.4, 82.2, 3.8, 2.15, 0.9, 2.2, 0.06); corP(B.p(tc2), P, 82.6, 1.4, 0.9); flatP(B.p(roof), P, YM + 0.02);
  // the copper mansard with two rows of dormers, and tourelles on the corners
  hipP(B.p(cu), offP(P, -0.3), YM, 96.5, 4.2); flatP(B.p(roof), offP(P, 3.9), 96.52);
  const Pm = offP(P, 1.0);
  for (let i = 0; i < Pm.length; i++){ const F = edgeF(Pm, i, 0); if (F.L < 5) continue; const n = Math.max(1, Math.round(F.L/4.3));
    for (let k = 0; k < n; k++){ const u = (k + 0.5)*F.L/n, p = F.f(u, 0, -0.6), q = F.f(u, 0, -2.3), ry = Math.atan2(-F.uz, F.ux);
      boxP(B.p(tc2), 1.8, 3.2, 1.6, p[0], YM + 1.2, p[2], ry); boxP(B.p(win), 1.0, 2.0, 0.1, ...[F.f(u, 0, 0.25)].map(v => [v[0], YM + 1.6, v[2]])[0], ry);
      LCone(g, 1.25, 1.6, p[0], YM + 4.4, p[2], dsS(cu), 4, PI/4 + ry); boxP(B.p(tc2), 1.2, 2.2, 1.2, q[0], YM + 6.8, q[2], ry); LCone(g, 0.95, 1.4, q[0], YM + 9.0, q[2], dsS(cu), 4, PI/4 + ry); } }
  for (const p of P){ const c = cenP(P), dx = p[0] - c[0], dz = p[1] - c[1], l = Math.hypot(dx, dz); if (l < 15) continue;
    const q = [p[0] - dx/l*1.6, p[1] - dz/l*1.6]; LCyl(g, 1.5, 1.5, 12, q[0], 80, q[1], dsS(tc2), 10); LCone(g, 1.7, 6.8, q[0], 92, q[1], dsS(cu), 10); }
  B.flush(g);
  return g; }};
place('ny90west');

// ===== Barclay-Vesey Building (Ralph Walker of McKenzie, Voorhees & Gmelin, 1927), 140 West Street: 152 m (498 ft), 32 storeys
// (enwiki); the lowest ten floors fill the parallelogram block, setbacks on the north and south above the 10th, light courts on
// the west and east making an H from the 11th to the 17th floors, wings on the 18th-19th, and the rectangular tower above the 17th
// parallel to Barclay and Vesey Streets; green, gold and buff brick; the enclosed, arched sidewalk arcade along Vesey Street
// (12 arches, ~5.5 m); stone piers rising above the roof. Massing from the 20 OSM building parts. Night: lit offices, the crown lit.
// Frame: rot -30.5 deg; -z = Barclay Street, +z = Vesey Street, -x = West Street, +x = Washington Street.
LANDMARKS.nybarclayvesey = {zh:'巴克莱-维西大厦', en:'Barclay–Vesey Building', cat:'old', r:63, h:152,
  lt:{m:1, c:'#ffeccc', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.nybarclayvesey;
  const br = {c:'#b39a77', m:1, fh:3.6, cw:1.5}, br2 = {c:'#a08664', m:1, fh:3.6, cw:1.5}, st = {c:'#d3c8b2', m:0, lk:1.1, glow:'#ffecc8', gk:0.1}, win = {c:'#40444a', m:1, fh:3.6, cw:1.5};
  const arc = {c:'#3a3e44', glow:'#ffdcae', gk:0.35}, roof = {c:'#7d7a74', m:0, lk:0.2};
  for (const [b, t, Q0] of D.p){ const Q = cleanP(Q0, 0.15), c = t <= 66 ? br2 : br;
    prismP(B.p(c), Q, -5, t); flatP(B.p(roof), Q, t + 0.02);
    if (t > 8) stripsP(B.p(win), Q, 6.5, t - 2.4, 1.85, 0.95, 0.05);
    corP(B.p(st), Q, t - 0.7, 0.7, 0.2); }
  // stone piers over the top roof
  { const T = cleanP(D.p.find(p => p[1] === 152)[2]); for (const p of T){ const c = cenP(T), dx = p[0] - c[0], dz = p[1] - c[1], l = Math.hypot(dx, dz); boxP(B.p(st), 1.6, 3.2, 1.6, p[0] - dx/l*1.0, 152, p[1] - dz/l*1.0); } }
  // the Vesey Street arcade: 12 round arches in the ground floor of the south front
  { const LOT = cleanP(D.r, 0.3), i = edgeTo(LOT, 0, 1), F = edgeF(LOT, i, 0.06);
    for (let k = 0; k < 12; k++) archP(B.p(arc), F, (k + 0.5)*F.L/12, 0.0, F.L/12 - 1.6, 3.2, 0.02); }
  B.flush(g);
  return g; }};
place('nybarclayvesey');

// ===== Jacob K. Javits Federal Building, 26 Federal Plaza (Alfred Easton Poor, Kahn & Jacobs, 1969; western addition 1977):
// 178.9 m, 41 storeys (enwiki); an irregular checkerboard of grey limestone panels, black granite panels and glass with pale vertical
// members running the full height (GSA). The two volumes from the OSM parts (179 m and 165 m). Night: lit offices.
// Frame: rot -32 deg; -z = Worth Street.
LANDMARKS.nyjavitsfed = {zh:'贾维茨联邦大楼', en:'Jacob K. Javits Federal Building', cat:'new', r:59, h:179,
  lt:{m:1, c:'#eef3ff', k:0.45}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.nyjavitsfed, rng = LMCTX.rng;
  const lim = {c:'#a5a5a0', m:1, fh:3.9, cw:1.6}, blk = {c:'#26272a', m:1, fh:3.9, cw:1.6}, gl = {c:'#4a5661', m:1, fh:3.9, cw:1.6}, pale = {c:'#d6d5ce', m:0, lk:0.6};
  const lob = {c:'#4c565e', glow:'#fff1dc', gk:0.4}, roof = {c:'#76767a', m:0, lk:0.2};
  for (const [b, t, Q0] of D.p){ const Q = cleanP(Q0, 0.3);
    prismP(B.p(lim), Q, 6, t); flatP(B.p(roof), Q, t + 0.02); prismP(B.p(lob), offP(Q, 1.2), -5, 6.2);
    for (let i = 0; i < Q.length; i++){ const F = edgeF(Q, i, 0.05); if (F.L < 3) continue; const n = Math.floor(F.L/1.6), s0 = (F.L - n*1.6)/2;
      for (let r = 0, y = 7; y < t - 3; y += 3.9, r++) for (let k = 0; k < n; k++){ const v = rng(), ch = ((r + k) % 2 ? 0.7 : 0.3) + (v - 0.5)*0.5;
        if (ch < 0.35) continue; const c = ch > 0.62 ? gl : blk; quadP(B.p(c), F.f(s0 + k*1.6 + 0.08, y, 0), F.f(s0 + (k + 1)*1.6 - 0.08, y, 0), F.f(s0 + (k + 1)*1.6 - 0.08, y + 3.4, 0), F.f(s0 + k*1.6 + 0.08, y + 3.4, 0)); } }
    mullP(B.p(pale), Q, 6, t - 0.4, 1.6, 0.22, 0.07, null, 0); prismP(B.p(pale), offP(Q, -0.1), t - 1.0, t + 0.4, true); }
  B.flush(g);
  return g; }};
place('nyjavitsfed');

// ===== Ted Weiss Federal Building (HOK, 1994), 290 Broadway: 144.8 m to the roof, 34 storeys incl. two mechanical penthouse levels
// (enwiki); clad in Deer Isle granite (colour not stated in enwiki - a pink-grey granite here, estimate) with punched aluminium
// windows; a colonnade on the facade below the roof; above the roof an open barrel-vaulted cage on a granite-sheathed mechanical
// penthouse. Night: lit offices, the cage lit. Frame: rot -31.5 deg; -x = Broadway, -z = Duane Street, +z = Reade Street.
LANDMARKS.nytedweiss = {zh:'泰德·韦斯联邦大楼', en:'Ted Weiss Federal Building', cat:'new', r:51, h:144.8,
  lt:{m:1, c:'#fff2dc', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.nytedweiss;
  const gr = {c:'#b8aba1', m:1, fh:3.95, cw:1.6}, gr2 = {c:'#c9bdb3', m:0, lk:1.1}, win = {c:'#3f454b', m:1, fh:3.95, cw:1.6}, lob = {c:'#4c565e', glow:'#fff1dc', gk:0.45};
  const cage = {c:'#b9bdc0', m:0, lk:1.2, glow:'#eef4ff', gk:0.25}, roof = {c:'#7c7875', m:0, lk:0.2};
  const P = cleanP(D.r), YR = 133;
  prismP(B.p(gr), P, 9, YR); flatP(B.p(roof), P, YR + 0.02); prismP(B.p(lob), offP(P, 1.2), -5, 9.2); mullP(B.p(gr2), P, -5, 9.2, 6.2, 1.1, -0.55, null, 1.1);
  winsP(B.p(win), P, 10.4, YR - 9, 3.95, 1.9, 1.2, 2.2, 0.06);
  // the colonnade below the roof
  for (let i = 0; i < P.length; i++){ const F = edgeF(P, i, -0.8); if (F.L < 10) continue; const n = Math.round(F.L/3.8) + 1; colsP(B.p(gr2), B.p(gr2), F, 0.8, F.L - 0.8, n, 0, YR - 8.4, YR - 1.2, 0.4, 8); }
  prismP(B.p(win), offP(P, 1.2), YR - 8.6, YR - 1.2, true); corP(B.p(gr2), P, YR - 8.8, 0.6, 0.3); corP(B.p(gr2), P, YR - 1.4, 1.4, 0.4);
  // the mechanical penthouse and the open barrel-vaulted cage
  { const bb = bbP(P), cx = (bb[0] + bb[2])/2, cz = (bb[1] + bb[3])/2, hx = (bb[2] - bb[0])*0.3, hz = (bb[3] - bb[1])*0.3, PH = rectP(cx - hx, cx + hx, cz - hz, cz + hz);
    prismP(B.p(gr), PH, YR, YR + 6.5); corP(B.p(gr2), PH, YR + 6.0, 0.5, 0.3);
    const lx = hx > hz, n = 9, R = (lx ? hz : hx);
    for (let k = 0; k < n; k++){ const t = -1 + 2*k/(n - 1), arc = [];
      for (let s = 0; s <= 8; s++){ const a = PI*s/8, w = Math.cos(a)*R, y = YR + 6.5 + Math.sin(a)*Math.min(R, 5.3);
        arc.push(lx ? [cx + t*hx, y, cz + w] : [cx + w, y, cz + t*hz]); }
      for (let s = 0; s < 8; s++) segP(B.p(cage), arc[s], arc[s + 1], 0.16, 4); }
    for (let s = 0; s <= 8; s++){ const a = PI*s/8, w = Math.cos(a)*R, y = YR + 6.5 + Math.sin(a)*Math.min(R, 5.3);
      segP(B.p(cage), lx ? [cx - hx, y, cz + w] : [cx + w, y, cz - hz], lx ? [cx + hx, y, cz + w] : [cx + w, y, cz + hz], 0.12, 4); } }
  B.flush(g);
  return g; }};
place('nytedweiss');

// ===== Daniel Patrick Moynihan United States Courthouse (Kohn Pedersen Fox, 1994), 500 Pearl Street: a 27-storey tower over a
// nine-storey base (enwiki, KPF); granite is among its materials. The tower's pyramidal roof, the facade colour and the heights
// are not published in the sources read: walls and roof from the OSM parts (tower 140 m incl. the roof, base 44 m, east wing
// 23 m) and a low pyramid to the OSM top (estimate). Night: lit windows, the roof lit.
// Frame: rot -38 deg; +z = Pearl Street / Cardinal Hayes Place, +x = Park Row, -z = Worth Street side.
LANDMARKS.nymoynihancourt = {zh:'莫伊尼汉联邦法院', en:'Daniel Patrick Moynihan U.S. Courthouse', cat:'new', r:59, h:140,
  lt:{m:1, c:'#fff2dc', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.nymoynihancourt;
  const gr = {c:'#c3b9ab', m:1, fh:4.3, cw:1.6}, gr2 = {c:'#d2c9bc', m:0, lk:1.1}, win = {c:'#3f454b', m:1, fh:4.3, cw:1.6}, rf = {c:'#6c7570', m:0, lk:1.0, glow:'#e8efe6', gk:0.12}, roof = {c:'#7c7875', m:0, lk:0.2};
  const T = cleanP(D.p.find(p => p[1] === 140)[2], 0.3), BS = cleanP(D.p.find(p => p[1] === 44)[2]), E = cleanP(D.p.find(p => p[1] === 23)[2]), R = D.p.find(p => p[1] === 47)[2];
  blockP(B, T, -5, 128, {wall:gr, win, fh:4.3, sp:1.9, ww:1.1, wh:2.6, wy0:8, pier:gr2, psp:7.6, pw:0.9, pd:0.4, cop:gr2, co:0.5});
  loftP(B.p(rf), [ring3(T, 128), ring3(shrinkP(T, 0.42), 136), ring3(shrinkP(T, 0.08), 140)], true);
  blockP(B, BS, -5, 44, {wall:gr, win, fh:4.3, sp:1.9, ww:1.1, wh:2.6, wy0:8, cop:gr2, co:0.4}); flatP(B.p(roof), BS, 44.02);
  prismP(B.p(gr2), R, 44, 47);
  blockP(B, E, -5, 23, {wall:gr, win, fh:4.3, sp:1.9, ww:1.1, wh:2.6, wy0:6, cop:gr2, co:0.3}); flatP(B.p(roof), E, 23.02);
  B.flush(g);
  return g; }};
place('nymoynihancourt');

// ===== 375 Pearl Street (Rose, Beaton & Rose, 1976): 32 storeys of 16-17 ft (enwiki 160 m roof; the targets' 164.6 m), first a
// nearly windowless telephone building in limestone with narrow 3 ft vertical slits; in the 2016 renovation the limestone of
// the top 15 storeys was replaced by plate glass (enwiki). Main block to 155 m (OSM), mechanical tiers to 171.7 m (OSM parts).
// Night: the glazed upper floors lit. Frame: rot -29 deg; +x = Pearl Street.
LANDMARKS.ny375pearl = {zh:'珍珠街375号', en:'375 Pearl Street', cat:'new', r:47, h:171.7,
  lt:{m:1, c:'#eef3ff', k:0.45}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.ny375pearl;
  const lim = {c:'#d6ccb4', m:0, lk:0.9}, slit = {c:'#3c4146', m:0, lk:0.3, glow:'#ffe2b8', gk:0.15}, gl = {c:'#4d5b66', m:1, fh:4.9, cw:1.6}, mul = {c:'#9aa2a8', m:0, lk:0.4};
  const mech = {c:'#c9c0aa', m:0, lk:0.7}, roof = {c:'#5b6466', m:0, lk:0.2};
  const P = cleanP(D.r, 0.4), YG = 155 - 15*4.95;
  prismP(B.p(lim), P, -5, YG); stripsP(B.p(slit), P, 4, YG - 1, 7.6, 0.9, 0.05);
  prismP(B.p(gl), P, YG, 155); flatP(B.p(roof), P, 155.02); bandsP(B.p(mul), P, YG, 155, 4.95, 0.3, 0.04); mullP(B.p(mul), P, YG, 155, 3.0, 0.12, 0.03, null, 0);
  for (const [b, t, Q] of D.p){ prismP(B.p(mech), Q, b - 0.5, t); bandsP(B.p(mul), Q, b, t, 3.0, 0.2, 0.04); }
  B.flush(g);
  return g; }};
place('ny375pearl');

// ===== Temple Court Building (Silliman & Farnsworth, 1883), 5 Beekman Street: nine full storeys, 41 m (133 ft) to the 9th-storey roof
// and 46 m (150 ft) to the peaks of the two pyramidal slate-roofed towers at the north-west and north-east corners (each formed
// by the outer three bays), a mansard with iron dormers, a granite two-storey base and a red brick midsection with tan stone and
// terracotta trim; the nine-storey atrium is capped by a glass pyramidal skylight (enwiki "5 Beekman Street": these heights
// settle the open h - the 209 m belongs to the 2016 residential tower behind, which is not this key). Night: floodlit brick.
// Frame: rot +42 deg; +x = Beekman Street (north), +z = Nassau Street, -z = Theatre Alley.
LANDMARKS.nytemplecourt = {zh:'神殿法院大厦', en:'Temple Court Building', cat:'old', r:32, h:46,
  lt:{m:0, c:'#ffe2bc', k:0.8, e:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.nytemplecourt;
  const brick = {c:'#9a4b3a', m:0}, tan = {c:'#cfb68f', m:0, lk:1.05}, gran = {c:'#a7a49d', m:0}, slate = {c:'#4d5459', m:0, lk:0.6}, iron = {c:'#3a3d3f', m:0, lk:0.4};
  const win = {c:'#3a3e42', glow:'#ffd9a2', gk:0.3}, glass = {c:'#8fa2ab', glow:'#ffe7c4', gk:0.5}, roof = {c:'#6e6c69', m:0, lk:0.2};
  const P = cleanP(D.r), YC = 35.5, YR = 41, bb = bbP(P);
  prismP(B.p(brick), P, -5, YC); prismP(B.p(gran), offP(P, -0.12), -5, 8.2, true); corP(B.p(tan), P, 8.0, 0.6, 0.3);
  winsP(B.p(win), offP(P, -0.12), 0.8, 7.4, 7.0, 2.6, 1.8, 5.6, 0.06);
  winsP(B.p(win), P, 9.4, YC - 1, 3.6, 2.55, 1.15, 2.3, 0.06); bandsP(B.p(tan), P, 8.6, YC - 1, 3.6, 0.32, 0.06);
  corP(B.p(tan), P, YC - 0.9, 1.0, 0.6);
  // mansard storey with iron dormers
  hipP(B.p(slate), offP(P, -0.2), YC, YR, 2.6); flatP(B.p(roof), offP(P, 2.4), YR + 0.01);
  { const Pm = offP(P, 0.9); for (let i = 0; i < Pm.length; i++){ const F = edgeF(Pm, i, 0); if (F.L < 5) continue; const n = Math.floor(F.L/2.55);
      for (let k = 0; k < n; k++){ const p = F.f((k + 0.5)*F.L/n, 0, -0.7); boxP(B.p(iron), 1.2, 2.6, 1.3, p[0], YC + 0.6, p[2], Math.atan2(-F.uz, F.ux)); } } }
  // the twin corner towers on Beekman Street (three bays square) with pyramidal slate roofs
  for (const zs of [bb[1], bb[3] - 8.6]){ const S = rectP(bb[2] - 8.6, bb[2], zs, zs + 8.6);
    prismP(B.p(brick), S, 30, YR); winsP(B.p(win), S, YC + 0.8, YR - 1.2, 3.6, 2.55, 1.0, 2.2, 0.06); corP(B.p(tan), S, YR - 0.9, 0.9, 0.45);
    loftP(B.p(slate), [ring3(offP(S, -0.5), YR), ring3(shrinkP(S, 0.04), 46)], true);
    const c = cenP(S); segP(B.p(iron), [c[0], 46, c[1]], [c[0], 47.6, c[1]], 0.08, 4); }
  // the atrium skylight
  { const c = cenP(P), S = rectP(c[0] - 2.3, c[0] + 2.3, c[1] - 2.3, c[1] + 2.3); loftP(B.p(glass), [ring3(S, YR + 0.05), ring3(shrinkP(S, 0.05), YR + 2.4)], true); }
  B.flush(g);
  return g; }};
place('nytemplecourt');

// ===== Potter Building (N. G. Starkweather, 1886), 38 Park Row: 11 storeys, 50 m (165 ft) to the roof plus finials of about 9 m
// (enwiki); cast-iron base (two floors), red brick and terracotta above in base / midsection / capital (2 / 7 / 2 floors), piers
// dividing the facade into bays of two windows, triangular and swan's-neck pediments and terracotta hoods on the 11th floor,
// finials on each pier hiding chimneys; the acute Park Row / Beekman corner rounded by a single column. Night: floodlit brick.
// Frame: rot +39 deg; -z = Park Row, -x = Beekman Street, +z = Nassau Street.
LANDMARKS.nypotter = {zh:'波特大厦', en:'Potter Building', cat:'old', r:32, h:59,
  lt:{m:0, c:'#ffe2bc', k:0.8, e:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.nypotter;
  const brick = {c:'#a1472f', m:0}, tc = {c:'#b4613d', m:0, lk:1.05}, iron = {c:'#4b5351', m:0, lk:0.6}, win = {c:'#383c40', glow:'#ffd9a2', gk:0.3}, roof = {c:'#6e6c69', m:0, lk:0.2};
  const P = cleanP(D.r), YR = 50;
  prismP(B.p(brick), P, -5, YR); flatP(B.p(roof), P, YR + 0.02);
  prismP(B.p(iron), offP(P, -0.12), -5, 8.6, true); winsP(B.p(win), offP(P, -0.12), 0.6, 8.2, 4.3, 2.15, 1.7, 3.4, 0.06);
  corP(B.p(tc), P, 8.4, 0.7, 0.4);
  winsP(B.p(win), P, 9.8, YR - 2.5, 3.75, 2.15, 1.05, 2.3, 0.06);
  mullP(B.p(tc), P, 8.4, YR - 0.8, 4.3, 1.1, 0, null, 0.4);
  corP(B.p(tc), P, 16.3, 0.5, 0.3); corP(B.p(tc), P, 42.4, 0.7, 0.45); corP(B.p(tc), P, YR - 1.0, 1.2, 0.8);
  // 11th-floor pediments and the finials on each pier
  for (let i = 0; i < P.length; i++){ const F = edgeF(P, i, 0.2); if (F.L < 5) continue; const n = Math.max(1, Math.round(F.L/4.3));
    for (let k = 0; k < n; k++){ const u = (k + 0.5)*F.L/n; for (const d of [-1.07, 1.07]) triP(B.p(tc), F.f(u + d - 0.8, 47.0, 0), F.f(u + d + 0.8, 47.0, 0), F.f(u + d, 48.0, 0)); }
    for (let k = 0; k <= n; k++){ const p = F.f(k*F.L/n, 0, 0.1); boxP(B.p(tc), 0.9, 5.4, 0.9, p[0], YR + 0.2, p[2]); pinP(B.p(tc), p[0], YR + 5.6, p[2], 1.0, 3.2); } }
  B.flush(g);
  return g; }};
place('nypotter');

// ===== Liberty Tower (Henry Ives Cobb, 1910), 55 Liberty Street: 33 storeys, 117 m (385 ft) to the roof, the high, tapering copper roof
// rising 20 m above the 30th floor (enwiki); Gothic, clad in white terracotta (the north face white brick); rusticated first two
// floors over a raised basement; paneled buttresses with pinnacles flank the centre bay; cornices at the 22nd, 23rd, 26th, 27th
// and 28th floors; dormers in the roof (one large over the centre bay on Liberty Street, two on each side front).
// Night: floodlit terracotta, the roof lit. Frame: rot -38.7 deg; +z = Liberty Street, -x = Liberty Place, +x = Nassau Street.
LANDMARKS.nyliberty55 = {zh:'自由塔楼', en:'Liberty Tower', cat:'old', r:22, h:117.3,
  lt:{m:1, c:'#ffeccc', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.nyliberty55;
  const tc = {c:'#e9e5da', m:1, fh:3.1, cw:1.4}, tc2 = {c:'#f2efe6', m:0, lk:1.1, glow:'#fff0d8', gk:0.12}, win = {c:'#41464b', m:1, fh:3.1, cw:1.4}, cu = {c:'#5f917c', m:0, lk:1.0, glow:'#d4f0e0', gk:0.15};
  const gwin = {c:'#3b4148', glow:'#ffdcae', gk:0.3};
  const P = cleanP(D.r), YR = 97.3, bb = bbP(P), cx = (bb[0] + bb[2])/2, cz = (bb[1] + bb[3])/2, Lx = bb[2] - bb[0], Lz = bb[3] - bb[1];
  prismP(B.p(tc), P, -5, YR);
  bandsP(B.p(tc2), P, 0, 8.5, 0.9, 0.12, 0.05); winsP(B.p(gwin), P, 1.0, 7.8, 4.0, 2.4, 1.5, 3.0, 0.06); corP(B.p(tc2), P, 8.3, 0.6, 0.35);
  winsP(B.p(win), P, 9.6, YR - 2, 3.1, 1.6, 0.95, 2.1, 0.06);
  mullP(B.p(tc2), P, 8.9, YR - 0.5, 3.2, 0.55, 0, null, 0.35);
  for (const [y, o] of [[70.6, 0.4], [73.7, 0.35], [83.0, 0.4], [86.1, 0.7], [89.2, 0.4]]) corP(B.p(tc2), P, y, 0.6, o);
  // pinnacled buttresses flanking the centre bay of the Liberty Street front
  { const i = edgeTo(P, 0, 1), F = edgeF(P, i, 0.4); for (const d of [-2.4, 2.4]){ const p = F.f(F.L/2 + d, 0, 0); boxP(B.p(tc2), 1.0, 12.5, 1.0, p[0], 84.8, p[2], Math.atan2(-F.uz, F.ux)); pinP(B.p(tc2), p[0], YR, p[2], 1.0, 3.6); } }
  // the steep copper hipped roof and its dormers
  hipRoof(g, cx, cz, Math.max(Lx, Lz), Math.min(Lx, Lz), YR, 117.3 - YR, dsS(cu), Lx >= Lz ? 0 : HP, 0.3);
  { const i = edgeTo(P, 0, 1), F = edgeF(P, i, -2.6); const p = F.f(F.L/2, 0, 0), ry = Math.atan2(-F.uz, F.ux); boxP(B.p(tc2), 3.2, 5.2, 4.0, p[0], YR, p[2], ry); gable(g, p[0], p[2], 3.4, 4.2, YR + 5.2, 2.0, dsS(cu), ry + HP);
    quadP(B.p(win), F.f(F.L/2 - 0.9, YR + 1.0, 2.05), F.f(F.L/2 + 0.9, YR + 1.0, 2.05), F.f(F.L/2 + 0.9, YR + 4.4, 2.05), F.f(F.L/2 - 0.9, YR + 4.4, 2.05)); }
  for (const dx of [-1, 1]){ const i = edgeTo(P, dx, 0), F = edgeF(P, i, -2.0);
    for (const t of [0.3, 0.7]){ const p = F.f(F.L*t, 0, 0), ry = Math.atan2(-F.uz, F.ux); boxP(B.p(tc2), 1.8, 3.4, 2.6, p[0], YR + 0.4, p[2], ry); gable(g, p[0], p[2], 2.0, 2.8, YR + 3.8, 1.4, dsS(cu), ry + HP); } }
  B.flush(g);
  return g; }};
place('nyliberty55');

// ===== 23 Wall Street (House of Morgan; Trowbridge & Livingston, 1914): four storeys, the facade about 26 m (85 ft) high, the fourth
// set back and invisible from the street; pink Tennessee marble ashlar, astylar; the entrance in a 10 m chamfered corner at Wall
// and Broad Streets; 4 bays on Broad, 5 on Wall, each a tall ground-floor window (6.7 x 3.7 m) with a pair of mezzanine openings,
// the third storey windowless; a mechanical penthouse on the roof (enwiki). Night: floodlit marble.
// Frame: rot -25 deg; -z = Wall Street, -x = Broad Street (the chamfer between them).
LANDMARKS.ny23wall = {zh:'华尔街23号', en:'23 Wall Street', cat:'old', r:29, h:33,
  lt:{m:0, c:'#ffe6c8', k:0.85, e:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.ny23wall;
  const pk = {c:'#d7b8a8', m:0}, pk2 = {c:'#e2c6b8', m:0, lk:1.1}, win = {c:'#3a3e42', glow:'#ffdcae', gk:0.3}, br = {c:'#6c5a3e', m:0, lk:0.6}, roof = {c:'#86827d', m:0, lk:0.2};
  const P = cleanP(D.r, 0.3), YF = 25.9;
  prismP(B.p(pk), P, -5, YF); bandsP(B.p(pk2), P, -1, YF - 1, 0.92, 0.05, 0.03);
  corP(B.p(pk2), P, YF - 1.3, 1.3, 0.6);
  prismP(B.p(pk), offP(P, 3.2), YF, 30.2); flatP(B.p(roof), offP(P, 3.2), 30.22); flatP(B.p(roof), P, YF + 0.01);
  { const Q = shrinkP(offP(P, 3.2), 0.45); prismP(B.p(roof), Q, 30.2, 33); }
  for (let i = 0; i < P.length; i++){ const F = edgeF(P, i, 0.06); if (F.L < 12) continue; const n = Math.max(1, Math.round(F.L/5.8));
    for (let k = 0; k < n; k++){ const u = (k + 0.5)*F.L/n;
      quadP(B.p(win), F.f(u - 1.85, 1.6, 0), F.f(u + 1.85, 1.6, 0), F.f(u + 1.85, 8.3, 0), F.f(u - 1.85, 8.3, 0));
      for (const d of [-0.95, 0.95]) quadP(B.p(win), F.f(u + d - 0.6, 9.4, 0), F.f(u + d + 0.6, 9.4, 0), F.f(u + d + 0.6, 11.6, 0), F.f(u + d - 0.6, 11.6, 0));
      quadP(B.p(win), F.f(u - 1.2, 13.4, 0), F.f(u + 1.2, 13.4, 0), F.f(u + 1.2, 16.0, 0), F.f(u - 1.2, 16.0, 0)); } }
  // the corner entrance: steps, bronze-and-glass doors under a single lintel
  { const i = edgeTo(P, -0.7, -0.7), F = edgeF(P, i, 0.06), u = F.L/2;
    quadP(B.p(br), F.f(u - 2.8, 1.4, 0), F.f(u + 2.8, 1.4, 0), F.f(u + 2.8, 7.6, 0), F.f(u - 2.8, 7.6, 0));
    prismP(B.p(pk2), [F.f(u - 3.6, 0, 0), F.f(u + 3.6, 0, 0), F.f(u + 3.6, 0, 0.5), F.f(u - 3.6, 0, 0.5)].map(p => [p[0], p[2]]), 7.6, 8.6);
    for (let s = 0; s < 5; s++) prismP(B.p(pk2), [F.f(u - 4.2, 0, 0), F.f(u + 4.2, 0, 0), F.f(u + 4.2, 0, 2.2 - s*0.42), F.f(u - 4.2, 0, 2.2 - s*0.42)].map(p => [p[0], p[2]]), -1, s*0.3); }
  B.flush(g);
  return g; }};
place('ny23wall');

// ===== 55 Wall Street (former Merchants' Exchange; Isaiah Rogers 1836-42, raised by McKim, Mead & White 1907-10): eight storeys over
// the full block between Wall, William, Exchange Place and Hanover Streets; two stacked colonnades of twelve columns on Wall
// Street - Ionic below (single granite shafts 9.35 m tall, 1.2 m across), Corinthian above (1.14 m across, 4.3 m centres) -
// ashlar granite, a cornice with a masonry parapet (enwiki). Height not published: OSM 48.7 m used (unverified); the tier
// heights are estimates from the column sizes. Night: floodlit granite. Frame: rot -25 deg; -z = Wall Street, +z = Exchange
// Place, -x = William Street, +x = Hanover Street.
LANDMARKS.ny55wall = {zh:'华尔街55号', en:'55 Wall Street', cat:'old', r:45, h:48.7,
  lt:{m:0, c:'#ffe6c8', k:0.85, e:0.55, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.ny55wall;
  const gr = {c:'#b9b5ab', m:0}, gr2 = {c:'#c8c4ba', m:0, lk:1.1}, win = {c:'#3a3e42', glow:'#ffdcae', gk:0.3}, roof = {c:'#86827d', m:0, lk:0.2};
  const P = cleanP(D.r, 0.3), YR = 48.7;
  prismP(B.p(gr), P, -5, YR); flatP(B.p(roof), P, YR + 0.02); bandsP(B.p(gr2), P, -1, 14, 0.9, 0.06, 0.03);
  winsP(B.p(win), P, 1.5, YR - 3, 5.6, 4.4, 1.6, 3.2, 0.06, i => outN(P, i)[1] > -0.8);
  corP(B.p(gr2), P, 14.2, 1.6, 0.5); corP(B.p(gr2), P, 30.0, 1.6, 0.5); corP(B.p(gr2), P, YR - 2.4, 1.2, 0.9); prismP(B.p(gr2), offP(P, -0.2), YR - 1.2, YR + 0.9, true);
  // the Wall Street colonnades
  { const i = edgeTo(P, 0, -1), F = edgeF(P, i, 0), w = 4.27*11, u0 = F.L/2 - w/2;
    prismP(B.p(win), [F.f(u0 - 1, 0, 0.02), F.f(u0 + w + 1, 0, 0.02), F.f(u0 + w + 1, 0, 0.05), F.f(u0 - 1, 0, 0.05)].map(p => [p[0], p[2]]), 1.5, 28.4, true);
    for (let k = 0; k < 11; k++){ const u = u0 + (k + 0.5)*4.27; quadP(B.p(win), F.f(u - 1.0, 3.0, 0.08), F.f(u + 1.0, 3.0, 0.08), F.f(u + 1.0, 11.0, 0.08), F.f(u - 1.0, 11.0, 0.08)); }
    colsP(B.p(gr2), B.p(gr2), F, u0, u0 + w, 12, 1.6, 1.4, 12.6, 0.6, 12);
    prismP(B.p(gr2), [F.f(u0 - 1.2, 0, 0), F.f(u0 + w + 1.2, 0, 0), F.f(u0 + w + 1.2, 0, 2.5), F.f(u0 - 1.2, 0, 2.5)].map(p => [p[0], p[2]]), 12.6, 14.2);
    colsP(B.p(gr2), B.p(gr2), F, u0, u0 + w, 12, 1.5, 15.8, 28.4, 0.57, 12);
    prismP(B.p(gr2), [F.f(u0 - 1.2, 0, 0), F.f(u0 + w + 1.2, 0, 0), F.f(u0 + w + 1.2, 0, 2.4), F.f(u0 - 1.2, 0, 2.4)].map(p => [p[0], p[2]]), 28.4, 30.0);
    for (let s = 0; s < 4; s++) prismP(B.p(gr2), [F.f(u0 - 2, 0, 0), F.f(u0 + w + 2, 0, 0), F.f(u0 + w + 2, 0, 3.2 - s*0.5), F.f(u0 - 2, 0, 3.2 - s*0.5)].map(p => [p[0], p[2]]), -1, 0.35*(s + 1)); }
  B.flush(g);
  return g; }};
place('ny55wall');

// ===== Delmonico's Building (James Brown Lord, 1891), 56 Beaver Street: eight storeys (two-storey base, five-storey shaft, one-storey
// capital) on the triangular lot at William / South William / Beaver Streets; orange Roman brick, Belleville brownstone and beige
// terracotta; the rounded corner on William Street with the restaurant's portico of two Corinthian columns carrying a frieze and
// balustrade, two stacked colonnades of four double-height engaged columns on the 3rd-6th floors, a deep modillioned cornice above
// the 7th, a brick 8th floor with pilasters (enwiki "56 Beaver Street"). Height not published: OSM 35 m (unverified). The frieze
// carries no lettering here. Night: floodlit, the portico lit. Frame: rot +14 deg; the round corner at +x, -z = Beaver Street,
// +z = South William Street.
LANDMARKS.nydelmonicos = {zh:'德尔莫尼科大厦', en:"Delmonico's Building", cat:'old', r:18, h:35,
  lt:{m:0, c:'#ffe2bc', k:0.85, e:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.nydelmonicos;
  const br = {c:'#c46c3c', m:0}, bs = {c:'#70503f', m:0, lk:0.9}, tc = {c:'#dac6a2', m:0, lk:1.1}, win = {c:'#383c40', glow:'#ffd9a2', gk:0.32}, roof = {c:'#6e6c69', m:0, lk:0.2};
  const P = cleanP(D.r, 0.12), YR = 35;
  prismP(B.p(br), P, -5, YR); flatP(B.p(roof), P, YR + 0.02);
  prismP(B.p(bs), offP(P, -0.12), -5, 8.2, true); bandsP(B.p(tc), P, -1, 8.2, 1.0, 0.1, 0.16);
  winsP(B.p(win), offP(P, -0.12), 1.4, 7.4, 6.0, 2.4, 1.5, 4.6, 0.06);
  winsP(B.p(win), P, 9.4, YR - 2.5, 3.65, 2.4, 1.1, 2.3, 0.06);
  corP(B.p(tc), P, 8.2, 0.6, 0.35); corP(B.p(tc), P, 29.0, 1.2, 1.0); corP(B.p(tc), P, YR - 0.8, 0.8, 0.4);
  // the rounded corner: portico and stacked colonnades
  { let ai = 0; for (let i = 0; i < P.length; i++) if (P[i][0] > P[ai][0]) ai = i;
    const a = P[ai], c = cenP(P), dx = a[0] - c[0], dz = a[1] - c[1], l = Math.hypot(dx, dz), nx = dx/l, nz = dz/l, tx = -nz, tz = nx;
    for (const s of [-1, 1]){ const x = a[0] + nx*1.6 + tx*s*1.5, z = a[1] + nz*1.6 + tz*s*1.5; LCyl(g, 0.32, 0.36, 6.0, x, 0.4, z, dsS(tc), 10); }
    boxP(B.p(tc), 4.4, 0.9, 2.4, a[0] + nx*1.0, 6.4, a[1] + nz*1.0, Math.atan2(-tz, tx));
    for (let k = 0; k < 7; k++){ const t = -1.9 + k*0.63; segP(B.p(tc), [a[0] + nx*2.0 + tx*t, 7.3, a[1] + nz*2.0 + tz*t], [a[0] + nx*2.0 + tx*t, 8.1, a[1] + nz*2.0 + tz*t], 0.1, 4); }
    for (const y0 of [8.8, 16.2]) for (const t of [-0.9, -0.3, 0.3, 0.9]){ const R = 2.4, x = a[0] - nx*0.6 + (tx*t*R), z = a[1] - nz*0.6 + (tz*t*R);
      LCyl(g, 0.3, 0.34, 6.6, x + nx*0.25*(1 - t*t), y0, z + nz*0.25*(1 - t*t), dsS(tc), 8); } }
  B.flush(g);
  return g; }};
place('nydelmonicos');

// ===== Stuyvesant High School (Cooper, Robertson & Partners with Gruzen Samton, 1992), 345 Chambers Street: ten main storeys and a
// shorter four-storey northern wing (enwiki); its facade, colours and height are not described in the sources read, nor where the
// four-storey wing begins: modelled as one ten-storey block on the OSM footprint, 46 m (estimate from ten storeys; the OSM height
// tag 53.7 m is not verified), brick with stone bands and glazed bays (estimate). The Tribeca Bridge is not part of this key.
// Night: lit classrooms. Frame: rot -31 deg; +z = Chambers Street / North End Avenue.
LANDMARKS.nystuyvesanths = {zh:'史岱文森高中', en:'Stuyvesant High School', cat:'new', r:68, h:46,
  lt:{m:1, c:'#fff2dc', k:0.45}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.nystuyvesanths;
  const br = {c:'#b07a5c', m:1, fh:4.4, cw:1.6}, st = {c:'#d5cdbd', m:0, lk:1.0}, win = {c:'#3f454b', m:1, fh:4.4, cw:1.6}, roof = {c:'#76736e', m:0, lk:0.2};
  const P = cleanP(D.r, 0.4), YR = 46;
  prismP(B.p(br), P, -5, YR); flatP(B.p(roof), P, YR + 0.02);
  winsP(B.p(win), P, 1.4, YR - 2, 4.4, 2.0, 1.4, 2.4, 0.06);
  bandsP(B.p(st), P, 0, YR - 1, 4.4, 0.45, 0.06); corP(B.p(st), P, YR - 1.0, 1.4, 0.3); corP(B.p(st), P, 4.4, 0.6, 0.3);
  B.flush(g);
  return g; }};
place('nystuyvesanths');

// ===== Whitehall Building (Henry J. Hardenbergh, 1904), 17 Battery Place: 20 storeys, 79 m (259 ft) to the roof (enwiki): a rusticated
// limestone base (basement, first floor, mezzanine), tan brick and stone on floors 2-5, red brick in the centre six bays and yellow
// brick with pink strips in the outer bays and sides on floors 6-16, a terracotta transitional 18th floor, a large cornice above
// the 20th, and a triangular brick pediment with an oculus over the Battery Place front. + the annex (sub-key, unlabelled):
// the 1910 "Greater Whitehall" (Clinton & Russell), 31 storeys, 129 m (infobox): rusticated limestone to the 6th floor, brick
// (colour not stated except the yellow north elevation - buff here, estimate) to the 23rd, cornices at the 23rd, terracotta and
// arcaded windows on floors 24-30, penthouses behind a balustrade on the 31st, a rounded pediment facing south.
// Night: lit offices, the cornices floodlit. Frames: rot -16 deg; -x = West Street, +z = Battery Place (south).
LANDMARKS.nywhitehallbldg = {zh:'白厅大厦', en:'Whitehall Building', cat:'old', r:30, h:79,
  lt:{m:1, c:'#ffeccc', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.nywhitehallbldg;
  const yel = {c:'#cfb68a', m:1, fh:3.7, cw:1.4}, red = {c:'#9b4936', m:1, fh:3.7, cw:1.4}, tan = {c:'#c4ab86', m:1, fh:3.7, cw:1.4}, lim = {c:'#cdc5b3', m:0, lk:1.0};
  const tc = {c:'#d9c7a6', m:0, lk:1.1, glow:'#ffecc8', gk:0.1}, win = {c:'#41454a', m:1, fh:3.7, cw:1.4}, gwin = {c:'#3b4148', glow:'#ffdcae', gk:0.3}, roof = {c:'#7e7c77', m:0, lk:0.2};
  const P = cleanP(D.r, 0.3), YR = 79;
  prismP(B.p(yel), P, -5, YR); flatP(B.p(roof), P, YR + 0.02);
  prismP(B.p(lim), offP(P, -0.12), -5, 9.5, true); bandsP(B.p(tc), offP(P, -0.12), -1, 9.5, 1.0, 0.12, 0.04); corP(B.p(tc), P, 9.3, 0.7, 0.4);
  prismP(B.p(tan), offP(P, -0.05), 9.5, 24.5, true); corP(B.p(tc), P, 24.3, 0.6, 0.3);
  winsP(B.p(gwin), offP(P, -0.12), 1.0, 8.6, 4.0, 2.3, 1.6, 3.2, 0.06);
  winsP(B.p(win), P, 11, YR - 2.5, 3.7, 1.75, 1.0, 2.2, 0.06);
  { const i = edgeTo(P, 0, 1), F = edgeF(P, i, 0.03), u0 = F.L/2 - 7.0, u1 = F.L/2 + 7.0;
    quadP(B.p(red), F.f(u0, 24.5, 0), F.f(u1, 24.5, 0), F.f(u1, 63.5, 0), F.f(u0, 63.5, 0));
    winsP(B.p(win), [F.f(u0, 0, 0), F.f(u1, 0, 0), F.f(u1, 0, -1), F.f(u0, 0, -1)].map(p => [p[0], p[2]]), 25.5, 63, 3.7, 1.75, 1.0, 2.2, 0.08, j => j === 0);
    // the triangular pediment with its oculus above the cornice
    const pd = [F.f(u0, YR + 1.6, 0.4), F.f(u1, YR + 1.6, 0.4), F.f(F.L/2, YR + 6.8, 0.4)]; triP(B.p(yel), ...pd);
    prismP(B.p(yel), [F.f(u0, 0, -0.6), F.f(u1, 0, -0.6), F.f(u1, 0, 0.4), F.f(u0, 0, 0.4)].map(p => [p[0], p[2]]), YR, YR + 1.6);
    const oc = F.f(F.L/2, YR + 3.6, 0.45); for (let s = 0; s < 10; s++){ const a0 = s/10*TAU, a1 = (s + 1)/10*TAU; triP(B.p(gwin), oc, F.f(F.L/2 + Math.cos(a0)*1.1, YR + 3.6 + Math.sin(a0)*1.1, 0.45), F.f(F.L/2 + Math.cos(a1)*1.1, YR + 3.6 + Math.sin(a1)*1.1, 0.45)); } }
  corP(B.p(tc), P, 66.2, 0.6, 0.3); prismP(B.p(tc), offP(P, -0.06), 66.8, 70.6, true); corP(B.p(tc), P, YR - 1.6, 1.6, 1.3);
  B.flush(g);
  return g; }};
place('nywhitehallbldg');
LANDMARKS.nywhitehallbldg_b = {zh:'白厅大厦附楼', en:'Whitehall Building Annex', cat:'old', r:56, h:129, label:false,
  lt:{m:1, c:'#ffeccc', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.nywhitehallbldg_b;
  const br = {c:'#c3a882', m:1, fh:3.9, cw:1.4}, lim = {c:'#cdc5b3', m:0, lk:1.0}, tc = {c:'#dccbab', m:1, fh:3.9, cw:1.4}, tc2 = {c:'#e3d4b8', m:0, lk:1.1, glow:'#ffecc8', gk:0.1};
  const win = {c:'#41454a', m:1, fh:3.9, cw:1.4}, gwin = {c:'#3b4148', glow:'#ffdcae', gk:0.3}, roof = {c:'#7e7c77', m:0, lk:0.2};
  const P = cleanP(D.r, 0.3), YR = 124.6;
  prismP(B.p(br), P, -5, YR); flatP(B.p(roof), P, YR + 0.02);
  prismP(B.p(lim), offP(P, -0.12), -5, 24.5, true); bandsP(B.p(tc2), offP(P, -0.12), -1, 24.5, 1.1, 0.12, 0.04); corP(B.p(tc2), P, 24.3, 0.8, 0.45);
  winsP(B.p(gwin), offP(P, -0.12), 1.0, 23.5, 4.0, 2.3, 1.4, 2.8, 0.06);
  winsP(B.p(win), P, 26.0, 89, 3.9, 1.65, 1.0, 2.3, 0.06);
  corP(B.p(tc2), P, 89.4, 0.8, 0.5); prismP(B.p(tc), offP(P, -0.05), 90.2, YR, true); corP(B.p(tc2), P, 93.6, 0.8, 0.5);
  for (let i = 0; i < P.length; i++){ const F = edgeF(P, i, 0.1); if (F.L < 4) continue; const n = Math.max(1, Math.round(F.L/3.3));
    for (let k = 0; k < n; k++){ archP(B.p(win), F, (k + 0.5)*F.L/n, 95.5, 2.2, 8.6, 0.02); archP(B.p(win), F, (k + 0.5)*F.L/n, 108.6, 2.2, 10.0, 0.02); } }
  corP(B.p(tc2), P, YR - 1.4, 1.4, 1.2);
  // penthouse storey behind a balustrade, the rounded south pediment
  { const Q = offP(P, 2.0); prismP(B.p(tc), Q, YR, 129); winsP(B.p(win), Q, YR + 0.8, 128.4, 3.6, 1.65, 1.0, 2.0, 0.06); flatP(B.p(roof), Q, 129.02);
    const Pb = offP(P, 0.4); for (let i = 0; i < Pb.length; i++){ const F = edgeF(Pb, i, 0); for (let u = 0.3; u < F.L; u += 0.6){ const p = F.f(u, 0, 0); segP(B.p(tc2), [p[0], YR, p[2]], [p[0], YR + 1.0, p[2]], 0.1, 4); } }
    prismP(B.p(tc2), Pb, YR + 1.0, YR + 1.25, true); }
  { const i = edgeTo(P, 0, 1), F = edgeF(P, i, 0.5), c = F.L/2, R = Math.min(5.5, F.L*0.35);
    for (let s = 0; s < 10; s++){ const a0 = PI*s/10, a1 = PI*(s + 1)/10; triP(B.p(tc2), F.f(c, YR + 1.4, 0), F.f(c + Math.cos(a0)*R, YR + 1.4 + Math.sin(a0)*R*0.7, 0), F.f(c + Math.cos(a1)*R, YR + 1.4 + Math.sin(a1)*R*0.7, 0)); } }
  B.flush(g);
  return g; }};
place('nywhitehallbldg_b');

// ===== Downtown Athletic Club (Starrett & van Vleck, 1930), 19 West Street: 158 m (518 ft) to the roof, 35 storeys plus attic (enwiki);
// full block between West and Washington Streets; mottled, patterned orange brick, stone sills and parapet caps, zinc-and-lead
// chevron spandrels; setbacks above the 4th and at many upper floors (OSM parts: 13 tiers); the base with three bays on each
// street and a large window of chevron-patterned glass over the West Street entrance; larger windows on the athletic floors
// (4th-19th); a three-storey mechanical tower over the northern roof with recessed brick panels. Night: lit windows, the top lit.
// Frame: rot -17.5 deg; -x = West Street, +x = Washington Street, -z = north.
LANDMARKS.nydowntownac = {zh:'市中心体育俱乐部', en:'Downtown Athletic Club', cat:'old', r:29, h:158,
  lt:{m:1, c:'#ffe9c4', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.nydowntownac;
  const br = {c:'#c06b3d', m:1, fh:3.9, cw:1.5}, br2 = {c:'#a95a33', m:1, fh:3.9, cw:1.5}, st = {c:'#d9cfbd', m:0, lk:1.1, glow:'#ffecc8', gk:0.1}, win = {c:'#3f4247', m:1, fh:3.9, cw:1.5};
  const chev = {c:'#4d5862', glow:'#fff0d2', gk:0.45}, zinc = {c:'#7f8488', m:0, lk:0.5}, roof = {c:'#76736e', m:0, lk:0.2};
  for (const [b, t, Q0] of D.p){ const Q = cleanP(Q0, 0.15);
    prismP(B.p(t >= 150 ? br2 : br), Q, -5, t); flatP(B.p(roof), Q, t + 0.02);
    if (t > 16) { stripsP(B.p(win), Q, 17, Math.min(t - 2, 76), 2.0, 1.25, 0.05); if (t > 80) stripsP(B.p(win), Q, 79, t - 2.2, 2.0, 0.9, 0.05); bandsP(B.p(zinc), Q, 17, t - 2, 3.9, 0.9, 0.07); }
    corP(B.p(st), Q, t - 0.6, 0.6, 0.15); }
  // the four-storey base with its three bays on each street and the chevron-glass windows over the entrances
  { const LOT = cleanP(D.r, 0.3);
    for (const dx of [-1, 1]){ const i = edgeTo(LOT, dx, 0), F = edgeF(LOT, i, 0.08), w = F.L/3;
      for (let k = 0; k < 3; k++){ const u = (k + 0.5)*w;
        quadP(B.p(chev), F.f(u - w*0.36, 0.5, 0), F.f(u + w*0.36, 0.5, 0), F.f(u + w*0.36, dx < 0 && k === 1 ? 14.2 : 9.0, 0), F.f(u - w*0.36, dx < 0 && k === 1 ? 14.2 : 9.0, 0));
        if (dx < 0 && k === 1) for (let r = 1; r < 4; r++) segP(B.p(st), F.f(u - w*0.36, 0.5 + r*3.4, 0.05), F.f(u + w*0.36, 0.5 + r*3.4, 0.05), 0.08, 4); } }
    corP(B.p(st), LOT, 15.6, 0.6, 0.2); }
  B.flush(g);
  return g; }};
place('nydowntownac');

// @@END@@
}
