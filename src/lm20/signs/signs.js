/* ================= v20 add-on: street life lighting — shop signs, LED screens, crowns, HDB corridors, aviation lights (lm20/signs) =================
   Decorates the real buildings of every 2 km tile (HOOKS.tile) with what makes Singapore glow at night:
   - malls / big commercial blocks: LED media screens and portrait screens on the street faces, the mall's lit name box near the top,
     a band of shop boards over the ground-floor entrances, LED parapet outlines, a few rooftop billboards (Orchard, Bugis, Jurong East...)
   - shophouse rows (Chinatown, Boat/Clarke Quay, Kampong Glam, Little India, Jalan Besar, Geylang, Joo Chiat/Katong, Tiong Bahru,
     Emerald Hill, Balestier) and other low-rise shops: a board per unit along the five-foot way, blade signs, lit shop fronts,
     red lanterns in Chinatown, neon and string lights in Geylang / Little India / Kampong Glam, coloured uplights on the quays
   - towers (offices, hotels, tall commercial): LED crown lines (white, cool blue, gold, some colour-changing or chasing), corner
     lines, crown glows, an abstract lightbox near the top, warm uplights on podiums
   - HDB blocks: cool-white corridor light bands on one long face (every storey), lit lift lobbies, warm void-deck lights
   - condos: some coloured crown strips; temples, churches, museums, theatres and some hotels: warm floodlights
   - everything >= 90 m: red aviation obstruction lights on the roof corners (mid-height too above 150 m), blinking in sync
   Two draw calls per tile:
   A  opaque MeshLambert: the app's ad atlas (ADATLAS / adTex: invented brands), a small Singapore atlas drawn here (invented local
      trades, abstract lightbox emblems) and plain coloured parts (frames, lanterns, lamp housings). Boards look like boards by day;
      at night they are self-lit with the app's ad uniforms (ADU), many shop signs switch off one by one after ~22:30.
   B  additive ShaderMaterial (hidden by day): corridor bands, LED lines, washes, shop-front glow, string lights and halo sprites
      (camera-facing quads expanded in the vertex shader, so no extra Points draw call).
   Geometry is written in LOD tiers (0 far: aviation, tall crowns; 1 mid: screens, corridors, washes; 2 near: shop signs, glows) and
   one drawRange per mesh drops the near tiers with distance. All animation runs in the shaders (LMT time uniform). */
{
const SGSigns = (() => {
  const TIER_D = [15000, 6500, 3300];          // tile distance up to which tier 0 / 1 / 2 is drawn
  const NODE = typeof window === 'undefined';
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  // ---------------- places ----------------
  // shophouse / conservation districts (rough outlines traced from the street grid; lat, lon)
  const DIST_LL = {
    chinatown:   [[1.2887, 103.8424], [1.2885, 103.8463], [1.2851, 103.8498], [1.2801, 103.8496], [1.2771, 103.8487], [1.2757, 103.8446], [1.2766, 103.8402], [1.2790, 103.8367], [1.2814, 103.8371], [1.2849, 103.8401], [1.2873, 103.8406]],
    quays:       [[1.2857, 103.8512], [1.2882, 103.8509], [1.2906, 103.8472], [1.2926, 103.8441], [1.2934, 103.8368], [1.2906, 103.8364], [1.2886, 103.8429], [1.2864, 103.8474]],
    kgglam:      [[1.2985, 103.8540], [1.3047, 103.8545], [1.3047, 103.8617], [1.2985, 103.8617]],
    littleindia: [[1.3033, 103.8483], [1.3070, 103.8478], [1.3128, 103.8530], [1.3126, 103.8585], [1.3062, 103.8576], [1.3040, 103.8550]],
    jalanbesar:  [[1.3040, 103.8550], [1.3062, 103.8576], [1.3126, 103.8585], [1.3150, 103.8640], [1.3070, 103.8645], [1.3030, 103.8600]],
    geylang:     [[1.3088, 103.8688], [1.3196, 103.8695], [1.3195, 103.8960], [1.3092, 103.8975]],
    joochiat:    [[1.3020, 103.8960], [1.3170, 103.8960], [1.3170, 103.9070], [1.3110, 103.9150], [1.3020, 103.9150]],
    tiongbahru:  [[1.2815, 103.8255], [1.2878, 103.8255], [1.2878, 103.8352], [1.2815, 103.8352]],
    emeraldhill: [[1.3010, 103.8374], [1.3066, 103.8374], [1.3066, 103.8406], [1.3010, 103.8406]],
    balestier:   [[1.3172, 103.8430], [1.3215, 103.8425], [1.3285, 103.8560], [1.3240, 103.8575]]
  };
  // shopping hubs: the malls here get more screens, outlines and billboards (lat, lon, radius m)
  const HUBS_LL = [[1.3035, 103.8340, 950], [1.2995, 103.8555, 380], [1.3335, 103.7425, 520], [1.3535, 103.9445, 450], [1.3180, 103.8930, 420],
    [1.2945, 103.8575, 600], [1.2645, 103.8220, 380], [1.3205, 103.8435, 320], [1.3505, 103.8720, 320], [1.4360, 103.7865, 380], [1.3505, 103.8485, 260],
    [1.3695, 103.8480, 320], [1.3325, 103.8475, 320], [1.3150, 103.7645, 260], [1.3245, 103.9300, 320], [1.4050, 103.9020, 320], [1.3920, 103.8950, 320],
    [1.4295, 103.8355, 320], [1.3395, 103.7065, 320], [1.2915, 103.8495, 300], [1.3008, 103.8455, 260]];
  const MULTI = [[1, 0.2, 0.62], [0.2, 0.85, 1], [0.62, 0.35, 1], [0.3, 1, 0.5], [1, 0.55, 0.12], [1, 0.9, 0.3], [1, 0.25, 0.22], [0.35, 0.55, 1]];
  const RED_GOLD = [[1, 0.16, 0.1], [1, 0.72, 0.22], [1, 0.3, 0.12]];
  const WARM_LANT = [[1, 0.62, 0.2], [1, 0.42, 0.12], [1, 0.8, 0.35], [0.95, 0.3, 0.5]];
  // flavour per district: sign / blade / lantern / neon / string-light / coloured-wash probabilities, shop-front light colour,
  // switch-off window (hours after 22:00), board and blade pools
  const FLV = {
    chinatown:   {sign:0.9, blade:0.5, lantern:0.45, lantC:'red', neon:0.14, neonC:RED_GOLD, string:0.12, strC:[1, 0.72, 0.35], glow:[1, 0.72, 0.45], late:[0.3, 2.2], pool:'cn', bpool:'cn', core:1},
    quays:       {sign:0.8, blade:0.25, lantern:0.06, lantC:'red', neon:0.4, neonC:MULTI, string:0.3, strC:[1, 0.8, 0.5], glow:[1, 0.8, 0.55], late:[2, 4.5], pool:'bar', bpool:'bar', wash:0.5, core:1},
    kgglam:      {sign:0.85, blade:0.35, lantern:0.3, lantC:'warm', neon:0.22, neonC:MULTI, string:0.4, strMulti:1, glow:[1, 0.82, 0.55], late:[1, 3.2], pool:'malay', bpool:'gen', core:1},
    littleindia: {sign:0.92, blade:0.5, neon:0.35, neonC:MULTI, string:0.5, strMulti:1, glow:[1, 0.93, 0.78], late:[0.5, 3.5], pool:'india', bpool:'gen', core:1},
    jalanbesar:  {sign:0.75, blade:0.35, neon:0.15, neonC:MULTI, string:0.05, strC:[1, 0.85, 0.6], glow:[1, 0.9, 0.72], late:[0.2, 2], pool:'gen', bpool:'gen'},
    geylang:     {sign:0.85, blade:0.55, neon:0.45, neonC:MULTI, string:0.15, strMulti:1, glow:[1, 0.86, 0.66], late:[1.5, 5], pool:'gey', bpool:'gey'},
    joochiat:    {sign:0.75, blade:0.3, neon:0.15, neonC:MULTI, string:0.1, strC:[1, 0.8, 0.5], glow:[1, 0.8, 0.55], late:[0.4, 2.2], pool:'katong', bpool:'gen'},
    tiongbahru:  {sign:0.5, blade:0.15, neon:0.05, neonC:MULTI, glow:[1, 0.78, 0.5], late:[0.2, 1.4], pool:'katong', bpool:'gen', core:1},
    emeraldhill: {sign:0.4, blade:0.1, lantern:0.1, lantC:'warm', neon:0.15, neonC:MULTI, glow:[1, 0.78, 0.5], late:[1, 3.5], pool:'bar', bpool:'bar', core:1},
    balestier:   {sign:0.8, blade:0.35, neon:0.12, neonC:MULTI, string:0.05, strC:[1, 0.85, 0.6], glow:[1, 0.88, 0.7], late:[0.3, 2.5], pool:'gen', bpool:'gen'},
    none:        {sign:0.7, blade:0.2, neon:0.03, neonC:MULTI, string:0.02, strC:[1, 0.85, 0.6], glow:[1, 0.92, 0.78], late:[0, 1.6], pool:'gen', bpool:'gen'}
  };
  // board pools: [atlas, index]; atlas 3 = the app's shop boards (ADATLAS 'S'), 6 = the Singapore boards drawn below
  const sgB = a => a.map(i => [6, i]), apS = a => a.map(i => [3, i]);
  const POOLS = {
    cn:     [...sgB([0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 31]), ...apS([0, 1, 2, 3, 4, 5, 10, 11, 12, 16, 18, 19, 20, 23, 24, 25])],
    india:  sgB([12, 13, 14, 15, 16, 17, 18, 19, 29, 31, 12, 14, 18]),
    malay:  [...sgB([20, 21, 22, 23, 12, 18, 15, 24, 26, 28, 20, 22]), ...apS([22])],
    gey:    [...sgB([0, 1, 6, 7, 8, 9, 10, 20, 22, 29, 5, 2]), ...apS([2, 9, 12, 21, 23, 24, 25])],
    katong: [...sgB([27, 28, 0, 2, 9, 11, 29, 30, 27, 28]), ...apS([18, 19, 3])],
    bar:    [...sgB([24, 25, 26, 8, 1, 28, 24, 25]), ...apS([5, 8, 26, 22])],
    gen:    [...sgB([0, 2, 5, 9, 15, 18, 29, 30, 31, 7, 4, 1]), ...apS([0, 2, 4, 6, 7, 9, 10, 13, 16, 18, 19, 20, 22, 24, 25, 26, 27])],
    mall:   [...apS([0, 2, 4, 6, 7, 8, 9, 10, 13, 14, 15, 16, 18, 19, 20, 22, 25, 26, 27]), ...sgB([0, 2, 9, 12, 18, 20, 24, 26, 27, 28, 30])]
  };
  // blade pools: atlas 2 = the app's blades (ADATLAS 'B'), 7 = Singapore blades
  const sgV = a => a.map(i => [7, i]), apB = a => a.map(i => [2, i]);
  const BPOOLS = {
    cn:  [...apB([0, 1, 2, 3, 4, 6, 7, 9, 10, 13, 14, 17, 19, 23, 26, 27, 28, 31]), ...sgV([1, 5, 6, 7, 10, 11, 13])],
    gey: [...sgV([0, 1, 2, 3, 4, 11, 9, 14, 0, 1]), ...apB([20, 28, 6, 14, 26, 31])],
    bar: [...sgV([8, 15, 12, 9, 8, 15]), ...apB([12])],
    gen: [...sgV([0, 4, 9, 12, 10, 14, 7]), ...apB([1, 3, 10, 13, 19, 22, 23])]
  };

  // ---------------- the Singapore atlas (1024²): boards 256×64 (32), blades 64×256 (16), lightbox emblems 256×64 (16) ----------------
  // Invented trades and generic words only; no real shop, brand or company names or logos.
  const SG_BOARDS = [
    ['鸡饭', 'CHICKEN RICE', '#ffffff', '#c8102e', '#222222'], ['煮炒', 'ZI CHAR · SEAFOOD', '#b71c1c', '#ffd75a', '#ffffff'], ['咖啡店', 'KOPITIAM', '#ffd400', '#6d1b00', '#3e2723'],
    ['药材行', 'MEDICAL HALL', '#1b5e20', '#ffe9a8', '#ffe9a8'], ['金铺', 'GOLDSMITH', '#7a0019', '#ffd75a', '#ffd75a'], ['杂货店', 'PROVISION SHOP', '#0d47a1', '#ffffff', '#ffeb3b'],
    ['榴梿', 'DURIAN STALL', '#2e7d32', '#ffeb3b', '#ffffff'], ['足底按摩', 'FOOT REFLEXOLOGY', '#6a1b9a', '#ffffff', '#f8bbd0'], ['海鲜酒家', 'SEAFOOD RESTAURANT', '#004d80', '#ffffff', '#ffd75a'],
    ['肉骨茶', 'PORK RIB SOUP', '#3e2723', '#ffcc80', '#ffcc80'], ['酒店', 'HOTEL', '#880e4f', '#ffd54f', '#ffffff'], ['茶室', 'TEA HOUSE', '#f1e3b8', '#5d1a0b', '#5d1a0b'],
    ['', 'BANANA LEAF CURRY', '#ffb300', '#7f0000', '#1b5e20'], ['', 'SILK & SAREE HOUSE', '#ad1457', '#ffd54f', '#ffffff'], ['', 'GOLD JEWELLERS', '#4a0d0d', '#ffd75a', '#ffd75a'],
    ['', 'MONEY CHANGER', '#004d40', '#ffffff', '#ffeb3b'], ['', 'SPICES & GROCERY', '#e65100', '#ffffff', '#fff3c4'], ['', 'FLOWER GARLANDS', '#ffffff', '#c2185b', '#2e7d32'],
    ['', 'PRATA · 24 HRS', '#1a237e', '#ffeb3b', '#ffffff'], ['', 'VEGETARIAN MEALS', '#2e7d32', '#ffffff', '#ffeb3b'], ['', 'NASI PADANG', '#1b5e20', '#ffeb3b', '#ffffff'],
    ['', 'KEDAI KAIN · TEXTILES', '#004d40', '#ffffff', '#ffd54f'], ['', 'MURTABAK HOUSE', '#b71c1c', '#ffffff', '#ffeb3b'], ['', 'PERFUME & ATTAR', '#4a148c', '#ffd54f', '#ffffff'],
    ['', 'RIVERSIDE BAR', '#111111', '#4dd0e1', '#ff4081'], ['', 'LIVE MUSIC', '#1a1a1a', '#ff4081', '#ffd54f'], ['', 'CRAFT BEER', '#3e2723', '#ffb300', '#ffffff'],
    ['', 'NYONYA KUEH', '#f8bbd0', '#1b5e20', '#ad1457'], ['', 'LAKSA HOUSE', '#ff7043', '#ffffff', '#3e2723'], ['', 'MINIMART 24H', '#00897b', '#ffffff', '#ffeb3b'],
    ['', 'TUITION CENTRE', '#ffffff', '#1565c0', '#e53935'], ['诊所', 'CLINIC', '#ffffff', '#00897b', '#c62828']];
  const SG_BLADES = [['HOTEL', '#7a0019', '#ffd54f'], ['酒店', '#880e4f', '#ffffff'], ['KTV', '#311b92', '#ff80ff'], ['按摩', '#6a1b9a', '#ffffff'], ['24H', '#ffeb3b', '#c62828'],
    ['茶', '#1b5e20', '#ffffff'], ['金', '#ffd75a', '#8a0000'], ['药', '#ffffff', '#c62828'], ['BAR', '#101010', '#00e5ff'], ['FOOD', '#e65100', '#ffffff'], ['咖啡', '#3e2723', '#ffcc80'],
    ['海鲜', '#0050a0', '#ffffff'], ['CAFE', '#ffffff', '#6d4c41'], ['当', '#004d40', '#ffd75a'], ['SPA', '#ffffff', '#00897b'], ['PUB', '#1b5e20', '#ffd54f']];
  // v26: the US maps (Bay Area, New York; SGR_US, tested lazily) get American street trades instead of the Singapore ones:
  // Chinese signs only in the Chinatown pools (San Francisco, Manhattan, Flushing, Sunset Park), English trades elsewhere.
  // Invented trades and generic words only; no real shop, brand or company names or logos.
  const US_BOARDS = [
    ['烧腊', 'BBQ · ROAST DUCK', '#b71c1c', '#ffd75a', '#ffffff'], ['海鲜', 'SEAFOOD MARKET', '#004d80', '#ffffff', '#ffd75a'], ['茶餐厅', 'HK STYLE CAFE', '#ffd400', '#6d1b00', '#3e2723'],
    ['药材行', 'HERBAL MEDICINE', '#1b5e20', '#ffe9a8', '#ffe9a8'], ['金铺', 'JEWELRY', '#7a0019', '#ffd75a', '#ffd75a'], ['杂货', 'GROCERY', '#0d47a1', '#ffffff', '#ffeb3b'],
    ['面家', 'NOODLE HOUSE', '#e65100', '#ffffff', '#fff3c4'], ['饼家', 'BAKERY', '#f8bbd0', '#ad1457', '#6d1b00'], ['酒家', 'DIM SUM HALL', '#880e4f', '#ffd54f', '#ffffff'],
    ['', 'DUMPLING HOUSE', '#ffffff', '#c8102e', '#222222'], ['旅馆', 'HOTEL', '#4a0d0d', '#ffd75a', '#ffd75a'], ['茶', 'BUBBLE TEA', '#f1e3b8', '#5d1a0b', '#5d1a0b'],
    ['', 'DELI & GROCERY', '#1b5e20', '#ffffff', '#ffeb3b'], ['', 'PIZZA BY THE SLICE', '#b71c1c', '#ffffff', '#2e7d32'], ['', 'BAGELS', '#ffb300', '#3e2723', '#ffffff'],
    ['', 'PHARMACY', '#ffffff', '#c62828', '#1565c0'], ['', 'COFFEE', '#3e2723', '#ffcc80', '#ffcc80'], ['', 'DINER · OPEN 24 HRS', '#00897b', '#ffffff', '#ff4081'],
    ['', 'LAUNDROMAT', '#1565c0', '#ffffff', '#ffeb3b'], ['', 'NAIL SALON', '#ffffff', '#ad1457', '#f8bbd0'], ['', 'HARDWARE', '#e65100', '#ffffff', '#222222'],
    ['', 'TACOS', '#ffd600', '#c62828', '#2e7d32'], ['', 'HALAL FOOD', '#2e7d32', '#ffffff', '#ffeb3b'], ['', 'BARBERSHOP', '#ffffff', '#1a237e', '#c62828'],
    ['', 'COCKTAIL BAR', '#111111', '#4dd0e1', '#ff4081'], ['', 'LIVE MUSIC', '#1a1a1a', '#ff4081', '#ffd54f'], ['', 'CRAFT BEER', '#3e2723', '#ffb300', '#ffffff'],
    ['', 'WINE & LIQUORS', '#4a148c', '#ffd54f', '#ffffff'], ['', 'STEAKHOUSE', '#4a0d0d', '#ffd75a', '#ffffff'], ['', 'CELL PHONES', '#0d47a1', '#ffffff', '#00e5ff'],
    ['', 'FLOWERS', '#ffffff', '#2e7d32', '#c2185b'], ['诊所', 'CLINIC', '#ffffff', '#00897b', '#c62828']];
  const US_BLADES = [['HOTEL', '#7a0019', '#ffd54f'], ['旅馆', '#880e4f', '#ffffff'], ['BAR', '#311b92', '#ff80ff'], ['PIZZA', '#b71c1c', '#ffffff'], ['24H', '#ffeb3b', '#c62828'],
    ['茶', '#1b5e20', '#ffffff'], ['金', '#ffd75a', '#8a0000'], ['DELI', '#ffffff', '#1b5e20'], ['BAR', '#101010', '#00e5ff'], ['FOOD', '#e65100', '#ffffff'], ['COFFEE', '#3e2723', '#ffcc80'],
    ['海鲜', '#0050a0', '#ffffff'], ['CAFE', '#ffffff', '#6d4c41'], ['TATTOO', '#101010', '#ff5252'], ['SPA', '#ffffff', '#00897b'], ['PUB', '#1b5e20', '#ffd54f']];
  let US_DONE = false;
  function usVocab(){
    if (US_DONE) return; US_DONE = true;
    let us = false; try { us = typeof SGR_US !== 'undefined' && !!SGR_US; } catch (e){ us = false; }
    if (!us) return;
    SG_BOARDS.splice(0, SG_BOARDS.length, ...US_BOARDS); SG_BLADES.splice(0, SG_BLADES.length, ...US_BLADES);
    const keepAp = (a, n) => a.filter(q => q[0] === n);
    Object.assign(POOLS, {
      cn:    [...sgB([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 31, 0, 8, 9]), ...keepAp(POOLS.cn, 3)],
      india: sgB([22, 13, 15, 29, 18, 12, 21, 16, 19, 30]),
      malay: sgB([22, 21, 12, 15, 18, 29, 13, 16]),
      gey:   sgB([24, 25, 13, 17, 16, 27, 28, 12, 21, 29, 9, 26]),
      katong: sgB([16, 14, 30, 23, 19, 12, 17, 28, 7]),
      bar:   sgB([24, 25, 26, 27, 28, 24, 25, 17]),
      gen:   sgB([12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 27, 29, 30, 12, 15, 13]),
      mall:  sgB([12, 13, 15, 16, 19, 27, 29, 30, 14, 17, 28, 24])});
    Object.assign(BPOOLS, {
      cn:  [...keepAp(BPOOLS.cn, 2), ...sgV([1, 5, 6, 11, 1, 5])],
      gey: sgV([2, 8, 4, 3, 9, 15, 0, 13]),
      bar: sgV([8, 15, 2, 8]),
      gen: sgV([0, 3, 4, 7, 9, 10, 12, 13, 14, 15])});
  }
  function makeAtlas(){
    usVocab();
    const W = 1024, cv = document.createElement('canvas'); cv.width = cv.height = W;
    const g = cv.getContext('2d');
    const SANS = '"Noto Sans CJK SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Source Han Sans SC",sans-serif';
    const SERIF = '"Noto Serif CJK SC","Songti SC","STSong","SimSun","Source Han Serif SC",serif';
    const HEAD = '"Arial Black","Helvetica Neue",Arial,"Noto Sans CJK SC",sans-serif';
    const REG = {S:{x:0, y:0, w:256, h:64, c:4, n:32}, B:{x:0, y:512, w:64, h:256, c:16, n:16}, E:{x:0, y:768, w:256, h:64, c:4, n:16}};
    g.fillStyle = '#101010'; g.fillRect(0, 0, W, W);
    const text = (s, x, y, size, col, font, maxW) => { let k = size; g.font = `800 ${k}px ${font}`; while (maxW && g.measureText(s).width > maxW && k > 7){ k *= 0.92; g.font = `800 ${k}px ${font}`; } g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); };
    // shop boards
    SG_BOARDS.forEach(([zh, en, bg, fg, ac], i) => {
      const x = (i % 4)*256, y = Math.floor(i/4)*64;
      g.fillStyle = '#0a0a0a'; g.fillRect(x, y, 256, 64); g.fillStyle = bg; g.fillRect(x + 2, y + 2, 252, 60);
      g.strokeStyle = ac; g.lineWidth = 2.5; g.strokeRect(x + 6, y + 6, 244, 52);
      if (zh){ text(zh, x + 128, y + 30, 30, fg, /^[一-鿿]+$/.test(zh) && zh.length <= 3 ? SERIF : SANS, 220); text(en, x + 128, y + 52, 11, ac, HEAD, 220); }
      else { text(en, x + 128, y + 30, 25, fg, HEAD, 226); g.fillStyle = ac; for (let k = 0; k < 9; k++){ g.beginPath(); g.arc(x + 88 + k*10, y + 50, 1.8, 0, 7); g.fill(); } }
    });
    // vertical blades
    SG_BLADES.forEach(([s, bg, fg], i) => {
      const x = REG.B.x + i*64, y = REG.B.y;
      g.fillStyle = '#0a0a0a'; g.fillRect(x, y, 64, 256); g.fillStyle = bg; g.fillRect(x + 2, y + 2, 60, 252);
      g.strokeStyle = fg; g.lineWidth = 2.5; g.strokeRect(x + 6, y + 6, 52, 244);
      const ch = [...s], n = ch.length, cs = Math.min(44, 220/n*0.9), y0 = y + 128 - cs*n*1.05/2;
      ch.forEach((c, k) => text(c, x + 32, y0 + cs*(k + 0.5)*1.05, cs, fg, /[A-Z0-9]/.test(c) ? HEAD : SERIF, 50));
    });
    // abstract lightbox emblems for towers (0-11) and hotels (12-15)
    const EM = ['#00b8d4', '#ffb300', '#e53935', '#7c4dff', '#00c853', '#ffffff', '#2979ff', '#ff4081', '#ffd740', '#1de9b6', '#ff6e40', '#b388ff'];
    for (let i = 0; i < 16; i++){
      const x = REG.E.x + (i % 4)*256, y = REG.E.y + Math.floor(i/4)*64, dark = i % 3 !== 1, c = EM[i % 12];
      g.fillStyle = '#0a0a0a'; g.fillRect(x, y, 256, 64); g.fillStyle = dark ? '#121418' : '#f4f4f2'; g.fillRect(x + 2, y + 2, 252, 60);
      const ex = i >= 12 ? x + 40 : x + 128, ey = y + 32;
      g.save(); g.translate(ex, ey); g.scale(1.3, 1.3); g.translate(-ex, -ey);
      g.fillStyle = c; g.strokeStyle = c; g.lineWidth = 5;
      switch (i % 6){
        case 0: g.beginPath(); g.arc(ex, ey, 20, 0, 7); g.stroke(); g.beginPath(); g.arc(ex, ey, 8, 0, 7); g.fill(); break;
        case 1: for (let k = 0; k < 3; k++){ g.beginPath(); g.moveTo(ex - 26 + k*16, ey - 20); g.lineTo(ex - 12 + k*16, ey); g.lineTo(ex - 26 + k*16, ey + 20); g.stroke(); } break;
        case 2: g.beginPath(); g.moveTo(ex, ey - 22); g.lineTo(ex + 22, ey); g.lineTo(ex, ey + 22); g.lineTo(ex - 22, ey); g.closePath(); g.fill(); g.fillStyle = dark ? '#121418' : '#f4f4f2'; g.fillRect(ex - 3, ey - 22, 6, 44); break;
        case 3: for (let k = 0; k < 3; k++){ g.beginPath(); for (let t = 0; t <= 40; t++){ const xx = ex - 30 + t*1.5, yy = ey - 12 + k*12 + Math.sin(t*0.32)*5; t ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); } break;
        case 4: g.beginPath(); g.moveTo(ex - 24, ey + 18); g.lineTo(ex, ey - 22); g.lineTo(ex + 24, ey + 18); g.closePath(); g.fill(); g.fillStyle = dark ? '#121418' : '#f4f4f2'; g.beginPath(); g.moveTo(ex - 10, ey + 18); g.lineTo(ex, ey + 2); g.lineTo(ex + 10, ey + 18); g.fill(); break;
        default: for (let k = 0; k < 8; k++){ const a = k*Math.PI/4; g.beginPath(); g.moveTo(ex + Math.cos(a)*6, ey + Math.sin(a)*6); g.lineTo(ex + Math.cos(a)*22, ey + Math.sin(a)*22); g.stroke(); }
      }
      g.restore();
      if (i >= 12){ text('HOTEL', x + 150, y + 30, 30, dark ? '#f5e6c8' : '#5d1a0b', SERIF, 150); g.fillStyle = c; for (let k = 0; k < 5; k++){ g.beginPath(); g.arc(x + 110 + k*20, y + 52, 3, 0, 7); g.fill(); } }
    }
    // mean colour of every cell (halo colours)
    const sm = document.createElement('canvas'); sm.width = sm.height = 64; const sg = sm.getContext('2d'); sg.drawImage(cv, 0, 0, 64, 64);
    const D = sg.getImageData(0, 0, 64, 64).data, AVG = {};
    for (const k in REG){ const R = REG[k]; AVG[k] = []; for (let i = 0; i < R.n; i++){ const x0 = (R.x + (i % R.c)*R.w)/16, y0 = (R.y + Math.floor(i/R.c)*R.h)/16; let r = 0, gg = 0, b = 0, n = 0;
      for (let y = Math.floor(y0); y < Math.max(Math.floor(y0) + 1, Math.floor(y0 + R.h/16)); y++) for (let x = Math.floor(x0); x < Math.max(Math.floor(x0) + 1, Math.floor(x0 + R.w/16)); x++){ const o = (y*64 + x)*4; r += D[o]; gg += D[o+1]; b += D[o+2]; n++; }
      AVG[k].push([r/n/255, gg/n/255, b/n/255]); } }
    return {cv, REG, AVG, W};
  }

  // ---------------- state ----------------
  let ready = false, SGA = null, MA = null, MB = null;
  const DIST = [], HUB = [], POI = [];
  const U = {uSN:{value:0}, uLH:{value:0}, uVH:{value:400}};
  let RS = null, RTILE = null;                   // road segments (classes 2-10) and their per-tile lists
  const STATS = {tiles:0, ms:0, maxMs:0, tris:[0, 0, 0, 0, 0, 0], n:{}, last:null};
  const pip = (R, x, y) => { let ins = false; const m = R.length >> 1; for (let i = 0, j = m - 1; i < m; j = i++){ const xi = R[i*2], yi = R[i*2+1], xj = R[j*2], yj = R[j*2+1]; if ((yi > y) !== (yj > y) && x < (xj - xi)*(y - yi)/(yj - yi) + xi) ins = !ins; } return ins; };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a)/(b - a))); return t*t*(3 - 2*t); };
  const cl01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const b8 = v => v <= 0 ? 0 : v >= 1 ? 255 : Math.round(v*255);
  const offB = h => h === Infinity ? 255 : Math.max(0, Math.min(254, Math.round(h/8*255)));    // switch-off time: hours after 22:00

  function init(){
    ready = true;
    for (const k in DIST_LL){ const P = []; for (const [la, lo] of DIST_LL[k]){ const q = sgXY(la, lo); P.push(q[0], q[1]); }
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < P.length; i += 2){ x0 = Math.min(x0, P[i]); x1 = Math.max(x1, P[i]); y0 = Math.min(y0, P[i+1]); y1 = Math.max(y1, P[i+1]); }
      DIST.push({k, P:Float64Array.from(P), bb:[x0, y0, x1, y1], f:FLV[k]}); }
    for (const [la, lo, r] of HUBS_LL){ const q = sgXY(la, lo); HUB.push([q[0], q[1], r]); }
    const PK = {mall:1, hotel:2, place_of_worship:3, museum:3, theatre:3, arts_centre:3, library:3, memorial:3, monument:3};
    for (const p of (SGR.base && SGR.base.pois) || []) if (PK[p.k]) POI.push({x:p.x, y:p.y, k:PK[p.k]});
    // road segments of the street classes (trunk ... residential), each listed in every tile it comes within 80 m of; inside the
    // shophouse districts also footways (pedestrian streets such as Pagoda / Trengganu Street) and named service lanes
    const ax = [], ay = [], bx = [], by = [], cc = [];
    const inDistBB = (x, y) => DIST.some(D => D.f.core && x > D.bb[0] - 40 && x < D.bb[2] + 40 && y > D.bb[1] - 40 && y < D.bb[3] + 40 && pip(D.P, x, y));
    for (const l of SGR.lines || []){ if (l.c < 2 || (l.flags & 8)) continue; const P = l.P;
      if (l.c > 10){ if (!(l.c === 12 || (l.c === 11 && l.name))) continue; const m = (P.length >> 2) << 1; if (!inDistBB(P[m], P[m+1])) continue; }
      for (let i = 0; i + 3 < P.length; i += 2){ ax.push(P[i]); ay.push(P[i+1]); bx.push(P[i+2]); by.push(P[i+3]); cc.push(l.c); } }
    RS = {ax:Float32Array.from(ax), ay:Float32Array.from(ay), bx:Float32Array.from(bx), by:Float32Array.from(by), c:Uint8Array.from(cc), mark:new Uint32Array(ax.length), stamp:0};
    const T = 2000, TX = 28, H0 = 28000, per = new Map();
    for (let s = 0; s < ax.length; s++){
      const tx0 = Math.floor((Math.min(ax[s], bx[s]) - 80 + H0)/T), tx1 = Math.floor((Math.max(ax[s], bx[s]) + 80 + H0)/T), ty0 = Math.floor((Math.min(ay[s], by[s]) - 80 + H0)/T), ty1 = Math.floor((Math.max(ay[s], by[s]) + 80 + H0)/T);
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++){ if (tx < 0 || ty < 0 || tx >= TX || ty >= TX) continue; const k = ty*TX + tx; let L = per.get(k); if (!L) per.set(k, L = []); L.push(s); }
    }
    RTILE = new Map(); for (const [k, L] of per) RTILE.set(k, Int32Array.from(L));
  }

  // ---------------- per-tile spatial helpers ----------------
  // a 32 m grid of the tile's road segments and one of its building footprints (CSR lists)
  const GC = 32, GM = 96, GN = Math.ceil((2000 + 2*GM)/GC);
  let RG = null, BG = null, LIST = null, BBX = null, GOFF = null, TI = 0;
  // CSR cell lists in reused scratch buffers (no per-tile garbage): cells(i, out) writes [x0, y0, x1, y1] or returns false
  function CSR(){ this.start = new Int32Array(GN*GN + 1); this.fill = new Int32Array(GN*GN); this.list = new Int32Array(4096); }
  const CC = new Int32Array(4);
  CSR.prototype.build = function(n, cells){
    const st = this.start, fl = this.fill; st.fill(0);
    for (let i = 0; i < n; i++){ if (!cells(i, CC)) continue; for (let y = CC[1]; y <= CC[3]; y++) for (let x = CC[0]; x <= CC[2]; x++) st[y*GN + x + 1]++; }
    for (let k = 1; k <= GN*GN; k++) st[k] += st[k - 1];
    if (st[GN*GN] > this.list.length){ let m = this.list.length; while (m < st[GN*GN]) m *= 2; this.list = new Int32Array(m); }
    const L = this.list; fl.set(st.subarray(0, GN*GN));
    for (let i = 0; i < n; i++){ if (!cells(i, CC)) continue; for (let y = CC[1]; y <= CC[3]; y++) for (let x = CC[0]; x <= CC[2]; x++) L[fl[y*GN + x]++] = i; }
    return this;
  };
  let GX0 = 0, GY0 = 0;
  const gcx = x => Math.max(0, Math.min(GN - 1, Math.floor((x - GX0)/GC))), gcy = y => Math.max(0, Math.min(GN - 1, Math.floor((y - GY0)/GC)));
  const RGc = new CSR(), BGc = new CSR();
  let BBXs = new Float32Array(4096*4), GOFFs = new Float64Array(4096);
  function prepTile(ti, list){
    TI = ti; LIST = list; GX0 = OX - 1000 - GM; GY0 = OY - 1000 - GM;
    const ids = RTILE.get(ti) || new Int32Array(0);
    RG = RGc.build(ids.length, (i, c) => { const s = ids[i]; c[0] = gcx(Math.min(RS.ax[s], RS.bx[s])); c[1] = gcy(Math.min(RS.ay[s], RS.by[s])); c[2] = gcx(Math.max(RS.ax[s], RS.bx[s])); c[3] = gcy(Math.max(RS.ay[s], RS.by[s])); return true; });
    RG.ids = ids;
    const n = list.length;
    if (BBXs.length < n*4){ BBXs = new Float32Array(n*8); GOFFs = new Float64Array(n*2); }
    BBX = BBXs; GOFF = GOFFs;
    for (let k = 0; k < n; k++){ const R = list[k].rings[0]; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < R.length; i += 2){ const x = R[i], y = R[i+1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } BBX[k*4] = x0; BBX[k*4+1] = y0; BBX[k*4+2] = x1; BBX[k*4+3] = y1; GOFF[k] = NaN; }
    BG = BGc.build(n, (k, c) => { if (list[k].foreign || list[k].h < 2.5) return false; c[0] = gcx(BBX[k*4]); c[1] = gcy(BBX[k*4+1]); c[2] = gcx(BBX[k*4+2]); c[3] = gcy(BBX[k*4+3]); return true; });
    // parts of one building (consecutive part records with the same seed) share the lowest ground, as in SGBld
    for (let k = 0; k < n; ){ const B = list[k]; if (!B.part){ k++; continue; } let e = k + 1; while (e < n && list[e].part && list[e].seed === B.seed) e++;
      if (e - k > 1){ let gq = Infinity; for (let j = k; j < e; j++) gq = Math.min(gq, groundOf(list[j].rings[0])); for (let j = k; j < e; j++) GOFF[j] = gq; } k = e; }
  }
  function groundOf(R){ let g = Infinity; for (let i = 0; i < R.length; i += 2){ const z = hC(R[i], R[i+1]); if (z < g) g = z; } return g; }
  // the building (other than self) whose footprint contains (x, y); -1 if none
  function bldAt(x, y, self, minH){
    const c = gcy(y)*GN + gcx(x), L = BG.list; let best = -1, ba = 0;
    for (let j = BG.start[c]; j < BG.start[c + 1]; j++){ const k = L[j]; if (k === self) continue; const o = k*4; if (x < BBX[o] || x > BBX[o+2] || y < BBX[o+1] || y > BBX[o+3]) continue;
      const B = LIST[k]; if (B.h < (minH || 0) || !pip(B.rings[0], x, y)) continue; if (B.area > ba){ ba = B.area; best = k; } }
    return best;
  }
  // nearest street (road class 2-10) in front of a facade: perpendicular distance from the facade midpoint (Infinity if none within
  // dmax); the segment must run roughly parallel to the facade and overlap its span. lastCls = the road's class
  let lastCls = 99;
  function street(mx, my, nx, ny, ux, uy, hl, dmax){
    const ex = Math.abs(ux*(hl + 4)), ey = Math.abs(uy*(hl + 4)), fx = nx*dmax, fy = ny*dmax;
    const cx0 = gcx(mx - ex + Math.min(0, fx)), cx1 = gcx(mx + ex + Math.max(0, fx)), cy0 = gcy(my - ey + Math.min(0, fy)), cy1 = gcy(my + ey + Math.max(0, fy));
    const st = ++RS.stamp, ids = RG.ids, L = RG.list; let best = Infinity; lastCls = 99; ST.qs = (ST.qs || 0) + 1;
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++){ const c = cy*GN + cx;
      for (let j = RG.start[c]; j < RG.start[c + 1]; j++){ const s = ids[L[j]]; if (RS.mark[s] === st) continue; RS.mark[s] = st;
        const ax = RS.ax[s], ay = RS.ay[s], sx = RS.bx[s] - ax, sy = RS.by[s] - ay, l2 = sx*sx + sy*sy; if (l2 < 0.25) continue;
        const sl = Math.sqrt(l2); if (Math.abs(sx*ux + sy*uy)/sl < 0.55) continue;
        let t = ((mx - ax)*sx + (my - ay)*sy)/l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const qx = ax + sx*t - mx, qy = ay + sy*t - my, dn = qx*nx + qy*ny, du = qx*ux + qy*uy;
        if (dn < 0.5 || dn > dmax || Math.abs(du) > hl + 8) continue;
        if (dn < best){ best = dn; lastCls = RS.c[s]; } } }
    return best;
  }
  function distOf(x, y){ for (const D of DIST){ const b = D.bb; if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue; if (pip(D.P, x, y)) return D; } return null; }
  const inHub = (x, y) => HUB.some(h => (x - h[0])*(x - h[0]) + (y - h[1])*(y - h[1]) < h[2]*h[2]);
  // outer ring edges: a, unit direction u, outward normal n, length L, start of the edge along the perimeter p
  function edges(R){ const m = R.length >> 1, E = []; let p = 0;
    for (let i = 0; i < m; i++){ const j = (i + 1) % m, ax = R[i*2], ay = R[i*2+1], bx = R[j*2], by = R[j*2+1], L = Math.hypot(bx - ax, by - ay); if (L < 0.4){ p += L; continue; }
      const ux = (bx - ax)/L, uy = (by - ay)/L; E.push({ax, ay, bx, by, L, ux, uy, nx:uy, ny:-ux, p, mx:(ax + bx)/2, my:(ay + by)/2}); p += L; }
    return E; }
  function frame(R){ const m = R.length >> 1; let best = -1, ux = 1, uy = 0;
    for (let i = 0; i < m; i++){ const j = (i + 1) % m, dx = R[j*2] - R[i*2], dy = R[j*2+1] - R[i*2+1], L = dx*dx + dy*dy; if (L > best){ best = L; const l = Math.sqrt(L) || 1; ux = dx/l; uy = dy/l; } }
    let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
    for (let i = 0; i < m; i++){ const x = R[i*2], y = R[i*2+1], a = x*ux + y*uy, b = -x*uy + y*ux; if (a < a0) a0 = a; if (a > a1) a1 = a; if (b < b0) b0 = b; if (b > b1) b1 = b; }
    return {ux, uy, lu:a1 - a0, lv:b1 - b0}; }

  // ---------------- geometry writers (per mesh and LOD tier; reused for every tile) ----------------
  // A: position f32×3 (tile-local), normal i8×3, uv f32×2, adk f32×4 (atlas kind, index, cycle, phase), aDay u8×4 (day colour,
  //    switch-off hour), aEm u8×4 (night colour, mode·32 + phase). Kinds: 0-4 the app's atlas (L, P, B, S, T), 5 plain, 6-8 the SG atlas (S, B, E)
  function WA(){ this.nv = 0; this.ni = 0; this.cap = 0; this.icap = 0; this.grow(4096); this.growI(8192); }
  WA.prototype.grow = function(n){ const P = new Float32Array(n*3), N = new Int8Array(n*3), T = new Float32Array(n*2), K = new Float32Array(n*4), D = new Uint8Array(n*4), E = new Uint8Array(n*4);
    if (this.cap){ P.set(this.P); N.set(this.N); T.set(this.T); K.set(this.K); D.set(this.D); E.set(this.E); } const Bi = new Uint16Array(n); if (this.cap) Bi.set(this.Bi); Object.assign(this, {P, N, T, K, D, E, Bi, cap:n}); };
  WA.prototype.growI = function(n){ const I = new Uint32Array(n); if (this.icap) I.set(this.I); this.I = I; this.icap = n; };
  WA.prototype.need = function(v, i){ if (this.nv + v > this.cap){ let n = this.cap; while (this.nv + v > n) n *= 2; this.grow(n); } if (this.ni + i > this.icap){ let n = this.icap; while (this.ni + i > n) n *= 2; this.growI(n); } };
  // B: position f32×3, aUV f32×2 (pattern coordinates; sprites: ± radius), aCol u8×4 (colour, switch-off hour), aMd u8×4 (pattern, animation, phase, parameter)
  function WB(){ this.nv = 0; this.ni = 0; this.cap = 0; this.icap = 0; this.grow(4096); this.growI(8192); }
  WB.prototype.grow = function(n){ const P = new Float32Array(n*3), T = new Float32Array(n*2), C = new Uint8Array(n*4), M = new Uint8Array(n*4);
    if (this.cap){ P.set(this.P); T.set(this.T); C.set(this.C); M.set(this.M); } const Bi = new Uint16Array(n); if (this.cap) Bi.set(this.Bi); Object.assign(this, {P, T, C, M, Bi, cap:n}); };
  WB.prototype.growI = WA.prototype.growI;
  WB.prototype.need = WA.prototype.need;
  const WAs = [new WA(), new WA(), new WA()], WBs = [new WB(), new WB(), new WB()];
  let OX = 0, OY = 0, SGCURB = 0;     // [lm28/ruin] SGCURB: record index of the building being decorated (aBid)
  // pens: the attributes shared by the next vertices
  const PA = new Float32Array(4), PAD = new Uint8Array(4), PAE = new Uint8Array(4), PBC = new Uint8Array(4), PBM = new Uint8Array(4);
  function penA(kind, idx, cyc, ph, day, off, em, mode, eph){ PA[0] = kind; PA[1] = idx; PA[2] = cyc || 0; PA[3] = ph || 0; PAD[0] = b8(day[0]); PAD[1] = b8(day[1]); PAD[2] = b8(day[2]); PAD[3] = off;
    PAE[0] = em ? b8(em[0]) : 0; PAE[1] = em ? b8(em[1]) : 0; PAE[2] = em ? b8(em[2]) : 0; PAE[3] = ((mode || 0) << 5) | ((eph || 0) & 31); }
  const WHITE = [1, 1, 1];
  const penSign = (kind, idx, off, cyc, ph) => penA(kind, idx, cyc, ph, WHITE, off, null, 0, 0);
  const penPlain = (day, off, em, mode, eph) => penA(5, 0, 0, 0, day, off, em, mode, eph);
  function av(W, x, y, h, nx, ny, nz, u, v){ const k = W.nv++, p = k*3, q = k*2, r = k*4; W.Bi[k] = SGCURB;
    W.P[p] = x - OX; W.P[p+1] = h; W.P[p+2] = OY - y; W.N[p] = Math.round(nx*127); W.N[p+1] = Math.round(ny*127); W.N[p+2] = Math.round(nz*127); W.T[q] = u; W.T[q+1] = v;
    W.K[r] = PA[0]; W.K[r+1] = PA[1]; W.K[r+2] = PA[2]; W.K[r+3] = PA[3]; W.D[r] = PAD[0]; W.D[r+1] = PAD[1]; W.D[r+2] = PAD[2]; W.D[r+3] = PAD[3]; W.E[r] = PAE[0]; W.E[r+1] = PAE[1]; W.E[r+2] = PAE[2]; W.E[r+3] = PAE[3]; }
  const quadI = (W, v) => { const I = W.I; let q = W.ni; I[q++] = v; I[q++] = v + 1; I[q++] = v + 2; I[q++] = v; I[q++] = v + 2; I[q++] = v + 3; W.ni = q; };
  // vertical quad, a (left) to b (right) seen from the front, facing (nx, ny); texture s0..s1 across, 0..1 up
  function aFace(W, ax, ay, bx, by, y0, y1, nx, ny, s0, s1){ W.need(4, 6); const v = W.nv;
    av(W, ax, ay, y0, nx, 0, -ny, s0, 0); av(W, bx, by, y0, nx, 0, -ny, s1, 0); av(W, bx, by, y1, nx, 0, -ny, s1, 1); av(W, ax, ay, y1, nx, 0, -ny, s0, 1); quadI(W, v); }
  // the same around a centre: half width hw, facing (nx, ny)
  function aFaceC(W, cx, cy, nx, ny, hw, y0, y1, s0, s1){ const rx = -ny, ry = nx; aFace(W, cx - rx*hw, cy - ry*hw, cx + rx*hw, cy + ry*hw, y0, y1, nx, ny, s0 === undefined ? 0 : s0, s1 === undefined ? 1 : s1); }
  function aHor(W, X, Y, y, up){ W.need(4, 6); const v = W.nv, o = up ? [0, 1, 2, 3] : [0, 3, 2, 1];
    for (let i = 0; i < 4; i++) av(W, X[o[i]], Y[o[i]], y, 0, up ? 1 : -1, 0, i === 1 || i === 2 ? 1 : 0, i >= 2 ? 1 : 0); quadI(W, v); }
  // box: centre, axis u, half sizes hu along u and hv along v = (-uy, ux), heights; faces: 1 the -v side, 2 +v, 4 end -u, 8 end +u, 16 top, 32 bottom
  const BX = [0, 0, 0, 0], BY = [0, 0, 0, 0];
  function aBox(W, cx, cy, ux, uy, hu, hv, y0, y1, mask){
    const vx = -uy, vy = ux;
    BX[0] = cx - ux*hu - vx*hv; BY[0] = cy - uy*hu - vy*hv; BX[1] = cx + ux*hu - vx*hv; BY[1] = cy + uy*hu - vy*hv;
    BX[2] = cx + ux*hu + vx*hv; BY[2] = cy + uy*hu + vy*hv; BX[3] = cx - ux*hu + vx*hv; BY[3] = cy - uy*hu + vy*hv;
    if (mask & 1) aFace(W, BX[0], BY[0], BX[1], BY[1], y0, y1, -vx, -vy, 0, 1);
    if (mask & 8) aFace(W, BX[1], BY[1], BX[2], BY[2], y0, y1, ux, uy, 0, 1);
    if (mask & 2) aFace(W, BX[2], BY[2], BX[3], BY[3], y0, y1, vx, vy, 0, 1);
    if (mask & 4) aFace(W, BX[3], BY[3], BX[0], BY[0], y0, y1, -ux, -uy, 0, 1);
    if (mask & 16) aHor(W, BX, BY, y1, true);
    if (mask & 32) aHor(W, BX, BY, y0, false);
  }
  function penB(col, off, pat, anim, ph, par){ PBC[0] = b8(col[0]); PBC[1] = b8(col[1]); PBC[2] = b8(col[2]); PBC[3] = off; PBM[0] = pat; PBM[1] = anim || 0; PBM[2] = ph || 0; PBM[3] = par || 0; }
  function bv(W, x, y, h, u, v){ const k = W.nv++, p = k*3, q = k*2, r = k*4; W.Bi[k] = SGCURB;
    W.P[p] = x - OX; W.P[p+1] = h; W.P[p+2] = OY - y; W.T[q] = u; W.T[q+1] = v;
    W.C[r] = PBC[0]; W.C[r+1] = PBC[1]; W.C[r+2] = PBC[2]; W.C[r+3] = PBC[3]; W.M[r] = PBM[0]; W.M[r+1] = PBM[1]; W.M[r+2] = PBM[2]; W.M[r+3] = PBM[3]; }
  function bQuad(W, ax, ay, bx, by, y0, y1, u0, u1, v0, v1){ W.need(4, 6); const v = W.nv;
    bv(W, ax, ay, y0, u0, v0); bv(W, bx, by, y0, u1, v0); bv(W, bx, by, y1, u1, v1); bv(W, ax, ay, y1, u0, v1); quadI(W, v); }
  // quad on facade edge e from s0 to s1 (metres along it), d in front of the wall; pattern u = e.p + s (perimeter metres)
  function bEdge(W, e, s0, s1, d, y0, y1, v0, v1){
    const ox = e.nx*d, oy = e.ny*d;
    bQuad(W, e.ax + e.ux*s0 + ox, e.ay + e.uy*s0 + oy, e.ax + e.ux*s1 + ox, e.ay + e.uy*s1 + oy, y0, y1, e.p + s0, e.p + s1, v0, v1);
  }
  // light pool on the ground in front of facade e, from d0 to d1 metres out (following the terrain); u = e.p + s, v 0 (wall) .. 1
  function bSpill(W, e, s0, s1, d0, d1){
    W.need(4, 6); const v = W.nv, P = [[s0, d0, 0], [s1, d0, 0], [s1, d1, 1], [s0, d1, 1]];
    for (const [s, d, q] of P){ const x = e.ax + e.ux*s + e.nx*d, y = e.ay + e.uy*s + e.ny*d; bv(W, x, y, Math.max(hC(x, y), -0.3) + 0.12, e.p + s, q); }
    quadI(W, v);
  }
  function W_hstrip(W, px, py, qx, qy, dx, dy, h){ const L = Math.hypot(dx, dy); W.need(4, 6); const v = W.nv;
    bv(W, px, py, h, 0, 0); bv(W, px + dx, py + dy, h, L, 0); bv(W, qx + dx, qy + dy, h, L, 1); bv(W, qx, qy, h, 0, 1); quadI(W, v); }
  function bSprite(W, x, y, h, r){ W.need(4, 6); const v = W.nv; bv(W, x, y, h, -r, -r); bv(W, x, y, h, r, -r); bv(W, x, y, h, r, r); bv(W, x, y, h, -r, r); quadI(W, v); }
  const P_LINE = 0, P_HDB = 1, P_VOID = 2, P_CORE = 3, P_WASH = 4, P_SHOP = 5, P_CROWN = 6, P_DOTS = 7, P_SPRITE = 8, P_MEDIA = 9, P_SPILL = 10, P_POOL = 11;
  const A_HUE = 1, A_CHASE = 2, A_BREATHE = 3, A_FLICKER = 4, A_BLINK = 5, A_MULTI = 6;
  const NEVER = 255;
  const halo = (W, x, y, h, r, col, off, anim, minPx) => { penB(col, off, P_SPRITE, anim || 0, 0, minPx || 0); bSprite(W, x, y, h, r); };
  const atE = (e, s, d) => [e.ax + e.ux*s + e.nx*d, e.ay + e.uy*s + e.ny*d];
  const avgCol = (kind, idx, m) => { let c = [0.6, 0.6, 0.6];
    if (kind === 3 && typeof ADATLAS !== 'undefined') c = ADATLAS.AVG.S[idx % ADATLAS.AVG.S.length]; else if (kind === 2 && typeof ADATLAS !== 'undefined') c = ADATLAS.AVG.B[idx % ADATLAS.AVG.B.length];
    else if (kind === 0 && typeof ADATLAS !== 'undefined') c = ADATLAS.AVG.L[idx % ADATLAS.AVG.L.length]; else if (SGA){ const k = kind === 6 ? 'S' : kind === 7 ? 'B' : 'E'; c = SGA.AVG[k][idx % SGA.AVG[k].length]; }
    const mx = Math.max(c[0], c[1], c[2], 0.2); return [c[0]/mx*m, c[1]/mx*m, c[2]/mx*m]; };
  const pick = (rng, a) => a[Math.floor(rng()*a.length) % a.length];
  // boards and blades are dealt from per-tile shuffled decks, so neighbouring shops rarely repeat
  let DECKS = new Map();
  function deal(rng, pool){ let d = DECKS.get(pool); if (!d || !d.length){ d = pool.slice(); for (let i = d.length - 1; i > 0; i--){ const j = Math.floor(rng()*(i + 1)); const t = d[i]; d[i] = d[j]; d[j] = t; } DECKS.set(pool, d); } return d.pop(); }

  // a board on facade e: centred at s, half width hw, y0..y1, d in front of the wall (thin box behind the face)
  function board(W, e, s, hw, y0, y1, d, kind, idx, off, cyc, ph){
    const c = atE(e, s, d/2);
    penPlain([0.16, 0.16, 0.17], NEVER, null, 0, 0); aBox(W, c[0], c[1], e.ux, e.uy, hw, d/2, y0, y1, hw > 3 ? 4 | 8 | 16 | 32 : 16 | 32);
    const f = atE(e, s, d); penSign(kind, idx, off, cyc, ph); aFaceC(W, f[0], f[1], e.nx, e.ny, hw, y0, y1);
  }

  // ---------------- the decorators ----------------
  let ST = null;           // per-tile counters
  const cnt = k => { ST[k] = (ST[k] || 0) + 1; };

  // LED line along all outer edges between y0 and y1 (B)
  function crownLine(W, E, y0, y1, d, col, anim, ph, off){ penB(col, off === undefined ? NEVER : off, P_LINE, anim, ph, 0); for (const e of E) if (e.L >= 1.2) bEdge(W, e, -d, e.L + d, d, y0, y1, 0, 1); }

  function decorateHDB(B, k, g, E, rng){
    ST.cat = 'hdb';
    cnt('hdb');
    // the block's layout from the building module (era, shops on the ground floor from the HDB data, corridor faces, lift cores)
    const L = typeof SGBld !== 'undefined' && SGBld.hdbLayout ? SGBld.hdbLayout(B) : null;
    if (B.base > 0.5) return;
    const com = L ? L.com : (inHub(B.cx, B.cy) || (typeof sgLU === 'function' && sgLU(B.cx, B.cy) === 2)) && rng() < 0.75;
    if (com){
      // shops below the flats: boards under the first-floor slab and the light of the shop fronts on the pavement
      const shopFaces = streetFaces(B, k, E, 8, 30, 2), W2 = WAs[2], V2 = WBs[2];
      for (const {e} of shopFaces){
        const ph = Math.floor(rng()*255);
        penB([1, 0.88, 0.7], NEVER, P_SPILL, 0, ph, Math.round(2.0*32)); bSpill(V2, e, 0.3, e.L - 0.3, 0.2, 4);
        const nU = Math.max(1, Math.min(16, Math.round(e.L/6.5))), uw = e.L/nU;
        for (let j = 0; j < nU; j++){ if (rng() > 0.7) continue; const [kd, ix] = deal(rng, POOLS.gen), w = Math.min(uw - 0.6, 3.6), off = offB(0.3 + rng()*1.7);
          if (w < 2) continue; board(W2, e, (j + 0.5)*uw, w/2, g + 2.05, g + 2.05 + Math.min(0.68, w/4), 0.12, kd, ix, off);
          if (j % 3 === 0){ const q = atE(e, (j + 0.5)*uw, 1); halo(V2, q[0], q[1], g + 2.3, 2.2, avgCol(kd, ix, 0.24), off); } }
        cnt('hdbshops');
      }
      return;
    }
    // open void deck: its fluorescent / LED light falls on the ground round the block; a few soft glows under the slab
    const W = WBs[2], F = L ? L.F : frame(B.rings[0]), vc = [0.95, 0.9, 0.78];
    penB(vc, NEVER, P_POOL, 0, 0, 0);
    for (const e of E) if (e.L >= 4){ bSpill(W, e, 0, e.L, -2.5, 4.5); }
    const n = F.lu > 40 ? 3 : F.lu > 18 ? 2 : 1;
    for (let j = 0; j < n; j++){ const t = (j + 0.5)/n - 0.5, a = (F.am !== undefined ? F.am : 0) + F.lu*t*0.8, b2 = F.bm !== undefined ? F.bm : 0;
      const x = F.am !== undefined ? a*F.ux - b2*F.uy : B.cx + F.ux*F.lu*t*0.8, y = F.am !== undefined ? a*F.uy + b2*F.ux : B.cy + F.uy*F.lu*t*0.8;
      halo(W, x, y, g + 2.2, 5, [0.3, 0.28, 0.22], NEVER); }
  }

  // aviation obstruction lights on the roof corners (and at mid-height above 150 m), all blinking in sync
  function aviation(B, g, top){
    ST.cat = 'avi';
    cnt('avi');
    const R = B.rings[0], F = frame(R), m = R.length >> 1, best = [[-1e9, 0], [-1e9, 0], [-1e9, 0], [-1e9, 0]], D = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (let i = 0; i < m; i++){ const x = R[i*2], y = R[i*2+1], a = x*F.ux + y*F.uy, b = -x*F.uy + y*F.ux; for (let q = 0; q < 4; q++){ const s = a*D[q][0] + b*D[q][1]; if (s > best[q][0]) best[q] = [s, i]; } }
    const pts = [];
    if (B.area < 150) pts.push([B.cx, B.cy]);
    else for (const [, i] of B.area < 1200 ? [best[0], best[3]] : best){ const x = R[i*2], y = R[i*2+1]; if (pts.some(p => Math.hypot(p[0] - x, p[1] - y) < 6)) continue; pts.push([x, y]); }
    const red = [0.95, 0.08, 0.04];
    for (const [x, y] of pts){
      const dx = B.cx - x, dy = B.cy - y, dl = Math.hypot(dx, dy) || 1, px = x + dx/dl*0.5, py = y + dy/dl*0.5;
      halo(WBs[0], px, py, top + 0.75, 1.9, red, NEVER, A_BLINK, 11);
      penPlain([0.35, 0.06, 0.05], NEVER, [1, 0.12, 0.06], 4, 0); aBox(WAs[1], px, py, 1, 0, 0.18, 0.18, top, top + 0.55, 1 | 2 | 4 | 8 | 16);
      if (B.h >= 150){ const qx = x - dx/dl*0.3, qy = y - dy/dl*0.3; halo(WBs[1], qx, qy, g + B.h*0.5, 1.5, red, NEVER, A_BLINK, 8); }
    }
  }

  // floodlit facade: warm uplight cones from the foot of each face up to hw metres
  function wash(W, E, y0, hw, col, minL, maxE, sp, off){
    penB(col, off === undefined ? NEVER : off, P_WASH, 0, 0, Math.round((sp || 5)*10));
    let n = 0; for (const e of [...E].sort((a, b) => b.L - a.L)){ if (e.L < (minL || 4) || n++ >= (maxE || 14)) break; bEdge(W, e, 0, e.L, 0.3, y0, y0 + hw, 0, 1); }
  }

  function decorateTower(B, k, g, y0, top, E, rng, hotel, cl){
    const crownSign = !!(cl && (cl.crown || cl.roof));
    ST.cat = 'tower';
    cnt('tower');
    const H = B.h, t = B.t, tier = H >= 100 ? 0 : 1, W = WBs[tier];
    const pC = hotel ? 0.8 : t === 5 ? 0.75 : H >= 100 ? 0.62 : 0.42;
    if (rng() < pC){
      cnt('crown');
      const r = rng(); let col, anim = 0;
      if (hotel && r < 0.5) col = [1, 0.76, 0.42];
      else if (r < 0.52) col = [0.88, 0.93, 1];
      else if (r < 0.7) col = [1, 0.84, 0.6];
      else if (r < 0.84) col = [0.42, 0.62, 1];
      else if (r < 0.9) col = [1, 0.74, 0.34];
      else if (r < 0.93) col = [0.36, 0.86, 0.95];
      else if (r < 0.95) col = [0.62, 0.42, 1];
      else { col = [0.9, 0.94, 1]; anim = A_HUE; }
      const ra = rng(); if (!anim && ra < 0.05) anim = A_CHASE; else if (!anim && ra < 0.12) anim = A_BREATHE;
      const ph = Math.floor(rng()*255);
      crownLine(W, E, H >= 150 ? top - 1.4 : top - 0.95, top - 0.3, 0.15, col, anim, ph);
      if (rng() < 0.3 && H > 40) crownLine(W, E, top - 5.4, top - 4.95, 0.15, col, anim, ph);
      if (rng() < (H >= 120 ? 0.5 : 0.2) && !crownSign){ const ch = H >= 120 ? Math.min(16, 0.07*H) : 9; penB(col.map(v => v*0.55), NEVER, P_CROWN, anim === A_CHASE ? 0 : anim, ph, 0); for (const e of E) if (e.L >= 1) bEdge(W, e, 0, e.L, 0.2, top - ch, top - 0.3, 0, 1); cnt('crownglow'); }
      // vertical lines down the convex corners of tall towers
      if (H >= 100 && rng() < 0.25){ const len = Math.min(0.4*(top - y0), 70), m = E.length;
        penB(col, NEVER, P_LINE, anim === A_CHASE ? 0 : anim, ph, 0);
        for (let i = 0; i < m; i++){ const a = E[i], b = E[(i + 1) % m]; if (a.ux*b.uy - a.uy*b.ux < 0.5 || a.L < 3 || b.L < 3) continue;
          // the strip lies flat on each of the two faces next to the corner, 0.5 m wide
          const ca = atE(a, a.L - 0.5, 0.15), cb = atE(b, 0.0, 0.15), ea = atE(a, a.L + 0.15, 0.15), eb = atE(b, 0.5, 0.15);
          bQuad(W, ca[0], ca[1], ea[0], ea[1], top - len, top - 0.3, 0, 1, 0, 1);
          bQuad(W, cb[0], cb[1], eb[0], eb[1], top - len, top - 0.3, 0, 1, 0, 1);
          // the line pattern runs across u for these (v 0..1 across the strip width)
        }
      }
    }
    // lightbox near the top: an abstract emblem plate (or a 'HOTEL' plate) on the face towards the street
    if (!crownSign && H >= 60 && B.area >= 250 && rng() < (hotel ? 0.55 : t === 5 ? 0.4 : 0.22)){
      let e = null, bd = Infinity, eL = null;
      for (const q of E){ if (q.L < 8) continue; if (!eL || q.L > eL.L) eL = q; const d = street(q.mx, q.my, q.nx, q.ny, q.ux, q.uy, q.L/2, 160); if (d < bd){ bd = d; e = q; } }
      if (!e) e = eL;
      if (e){ const w = Math.min(e.L*0.55, 4 + H*0.05, 18), hb = w/4, yb = top - 2.6 - hb;
        const idx = hotel ? 12 + Math.floor(rng()*4) : Math.floor(rng()*12), s = e.L*(0.3 + 0.4*rng());
        board(WAs[1], e, Math.max(w/2 + 0.5, Math.min(e.L - w/2 - 0.5, s)), w/2, yb, yb + hb, 0.35, 8, idx, NEVER);
        const c = atE(e, s, 2); halo(WBs[1], c[0], c[1], yb + hb/2, w*0.45, avgCol(8, idx, 0.35), NEVER); cnt('lightbox'); }
    }
    // podium uplights
    if (y0 < g + 1 && B.area >= 500 && rng() < (hotel ? 0.45 : 0.28)){ cnt('podwash'); wash(WBs[1], E, g, Math.min(18, 0.22*H), rng() < 0.7 ? [1, 0.82, 0.55] : [0.8, 0.9, 1], 6, 6, 4 + rng()*3, offB(2 + rng()*3)); }
  }

  function decorateCondo(B, top, E, rng){
    ST.cat = 'condo';
    const r = rng(); if (r > 0.1 || B.area < 150) return;
    cnt('condo');
    const C = [[0.9, 0.94, 1], [0.9, 0.94, 1], [1, 0.82, 0.56], [0.42, 0.62, 1], [0.36, 0.86, 0.95], [0.62, 0.42, 1]];
    let col = pick(rng, C), anim = 0;
    if (rng() < 0.04) anim = A_HUE; else if (rng() < 0.1) anim = A_BREATHE;
    crownLine(WBs[1], E, top - 0.8, top - 0.3, 0.15, col, anim, Math.floor(rng()*255));
  }

  // street faces of a building: edges facing a road (class 2-10) within dmax, not blocked right in front by another building
  function streetFaces(B, k, E, minL, dmax, gap){
    const S = [];
    for (const e of E){ if (e.L < minL) continue;
      if (bldAt(e.mx + e.nx*gap, e.my + e.ny*gap, k, 2.5) >= 0) continue;                // a party wall or a building right in front
      const d = street(e.mx, e.my, e.nx, e.ny, e.ux, e.uy, e.L/2, dmax); if (d === Infinity) continue;
      S.push({e, d, c:lastCls}); }
    return S;
  }

  function decorateMall(B, k, g, y0, top, E, rng, hub, cl){
    const noScr = !!(cl && (cl.led || cl.media));
    ST.cat = 'mall';
    cnt('mall');
    let S = streetFaces(B, k, E, 10, 55, 2.5).sort((a, b) => b.e.L - a.e.L).slice(0, 4);
    if (!S.length) S = E.filter(e => e.L >= 12).sort((a, b) => b.L - a.L).slice(0, 2).map(e => ({e, d:20, c:10}));
    if (!S.length) return;
    const wallH = top - y0, ground = y0 < g + 1;
    let named = false;
    S.forEach((f, i) => {
      const e = f.e, occ = [], free = (s0, s1, a, b) => occ.every(o => s1 < o[0] || s0 > o[1] || b < o[2] || a > o[3]);
      // lit shop fronts and their light on the pavement
      if (ground){ const ph = Math.floor(rng()*255), par = Math.round(2.5*32); penB([1, 0.92, 0.78], NEVER, P_SHOP, 0, ph, par); bEdge(WBs[2], e, 0.5, e.L - 0.5, 0.12, g + 0.1, g + 3.3, 0, 1);
        penB([1, 0.92, 0.78], NEVER, P_SPILL, 0, ph, par); bSpill(WBs[1], e, 0.5, e.L - 0.5, 0.2, 6); }
      // shop boards over the ground-floor entrances
      if (ground && wallH > 7.5 && rng() < (hub ? 0.85 : 0.6)){
        const W2 = WAs[2], pool = POOLS.mall, off = offB(1 + rng()*1.5);
        for (let s = 3.4; s + 3.2 < e.L; s += 6.6){ if (rng() > 0.82) continue; const [kd, ix] = deal(rng, pool); board(W2, e, s, 2.2, g + 3.6, g + 4.7, 0.16, kd, ix, off); if (rng() < 0.4){ const c = atE(e, s, 1.4); halo(WBs[2], c[0], c[1], g + 4.1, 3.2, avgCol(kd, ix, 0.3), off); } }
        occ.push([0, e.L, g + 3.4, g + 4.9]); cnt('mallboards');
      }
      // LED media screens
      const nS = noScr ? 0 : i === 0 ? 1 + Math.floor(e.L/(hub ? 55 : 90)) : rng() < (hub ? 0.7 : 0.35) ? 1 : 0;
      for (let j = 0; j < nS; j++){
        let w = Math.min(e.L/nS*(hub ? 0.62 : 0.5), hub ? 30 : 20), h = w/2;
        const yMin = (ground ? g + 6.2 : y0 + 1.5), yMax = top - 2;
        if (h > yMax - yMin){ h = yMax - yMin; w = 2*h; }
        if (w < 5) break;
        const slot0 = e.L*j/nS, slot = e.L/nS, s = slot0 + w/2 + 0.8 + rng()*Math.max(0, slot - w - 1.6), yb = yMin + rng()*Math.max(0, yMax - yMin - h)*0.5;
        if (!free(s - w/2, s + w/2, yb, yb + h)) continue;
        const cyc = w >= 9 && rng() < 0.75 ? 3 : 0, idx = cyc ? 3*Math.floor(rng()*10) : Math.floor(rng()*30), off = offB(1.5 + rng()*1.5);
        board(WAs[1], e, s, w/2, yb, yb + h, 0.45, 0, idx, off, cyc, rng()*8);
        occ.push([s - w/2 - 0.6, s + w/2 + 0.6, yb - 0.6, yb + h + 0.6]); cnt('screen');
        const gc = cyc ? [0.42, 0.42, 0.48] : avgCol(0, idx, 0.5); for (const q of w > 12 ? [-0.3, 0.3] : [0]){ const c = atE(e, s + q*w, 3); halo(WBs[1], c[0], c[1], yb + h*0.45, w*0.42, gc, off); }
        // portrait screens on either side in the hubs
        if (hub && i === 0 && rng() < 0.6){ const pw = Math.min(Math.max(e.L*0.06, 2.6), 6), ph2 = 2*pw;
          for (const sd of [-1, 1]){ const s2 = s + sd*(w/2 + pw/2 + 2.5); if (s2 - pw/2 < 1 || s2 + pw/2 > e.L - 1 || yb + ph2 > yMax || !free(s2 - pw/2, s2 + pw/2, yb, yb + ph2)) continue;
            const c3 = rng() < 0.7 ? 3 : 0, ix = c3 ? 3*Math.floor(rng()*4) : Math.floor(rng()*12);
            board(WAs[1], e, s2, pw/2, yb, yb + ph2, 0.4, 1, ix, off, c3, rng()*8); occ.push([s2 - pw/2 - 0.5, s2 + pw/2 + 0.5, yb - 0.5, yb + ph2 + 0.5]); cnt('portrait'); } }
      }
      // the mall's name box near the top
      if (!named && rng() < 0.75){ let w = Math.min(e.L*0.4, 22), hb = w/4; if (hb > 4.4){ hb = 4.4; w = 17.6; }
        const yb = top - 1.1 - hb; let s = e.L*(0.25 + 0.5*rng());
        for (let tr = 0; tr < 4 && !free(s - w/2, s + w/2, yb, yb + hb); tr++) s = w/2 + 1 + rng()*(e.L - w - 2);
        if (w >= 4 && yb > y0 + 3 && free(s - w/2, s + w/2, yb, yb + hb)){ const ix = 28 + Math.floor(rng()*4); board(WAs[1], e, s, w/2, yb, yb + hb, 0.3, 3, ix, offB(2.5 + rng())); named = true; occ.push([s - w/2, s + w/2, yb, yb + hb]); cnt('mallname'); } }
      // a stock / news ticker
      if (hub && i === 0 && ground && wallH > 12 && rng() < 0.35 && free(0.3, e.L - 0.3, g + 5.0, g + 5.9)){ const len = e.L - 0.6, c = atE(e, e.L/2, 0.3);
        const cb = atE(e, e.L/2, 0.15); penPlain([0.08, 0.08, 0.09], NEVER); aBox(WAs[1], cb[0], cb[1], e.ux, e.uy, len/2 + 0.1, 0.15, g + 4.95, g + 5.95, 4 | 8 | 16 | 32);
        penSign(4, 0, offB(2 + rng()), 0, 0); aFaceC(WAs[1], c[0], c[1], e.nx, e.ny, len/2, g + 5.05, g + 5.85, rng()*4, rng()*4 + len/25.6); cnt('ticker'); }
    });
    // LED parapet outline
    if (rng() < (hub ? 0.5 : 0.2)){ const r = rng(), col = r < 0.5 ? [0.9, 0.94, 1] : r < 0.72 ? [1, 0.8, 0.52] : r < 0.95 ? pick(rng, MULTI) : [1, 0.3, 0.3]; crownLine(WBs[1], E, top - 0.8, top - 0.3, 0.15, col, r >= 0.95 ? A_HUE : rng() < 0.1 ? A_CHASE : 0, Math.floor(rng()*255), offB(2 + rng()*1.5)); cnt('mallline'); }
    // LED media facade over most of the main street face (hubs)
    if (!noScr && hub && wallH > 12 && rng() < 0.25){ const e = S[0].e, y1 = top - 1.5, yb = Math.max(y0 + 1, g + 6.5);
      if (y1 - yb > 6 && e.L > 20){ penB([1, 1, 1], offB(2 + rng()*1.5), P_MEDIA, 0, Math.floor(rng()*255), Math.floor(rng()*3)); bEdge(WBs[1], e, 1, e.L - 1, 0.35, yb, y1, yb - g, y1 - g); cnt('media'); } }
    // coloured facade wash on the street faces
    if (rng() < (hub ? 0.3 : 0.08)){ const col = rng() < 0.7 ? [1, 0.8, 0.5] : pick(rng, MULTI).map(v => v*0.7); wash(WBs[1], S.map(f => f.e), y0, Math.min(wallH, 22), col, 8, 4, 5, offB(1.5 + rng()*1.5)); }
    // rooftop billboard on a steel frame, set back from the main street face
    if (!noScr && wallH < 45 && rng() < (hub ? 0.3 : 0.14)) roofBoard(B, S[0].e, top, rng);
  }

  function roofBoard(B, e, top, rng){
    let w = Math.min(e.L - 4, 10 + rng()*8), h = w/2; if (h > 7){ h = 7; w = 14; } if (w < 6) return;
    const s = e.L/2 + (rng() - 0.5)*(e.L - w - 4)*0.6, set = 2.2, R = B.rings[0];
    for (const [ds, dn] of [[-w/2 - 0.3, -set + 0.4], [w/2 + 0.3, -set + 0.4], [-w/2 - 0.3, -set - 2.5], [w/2 + 0.3, -set - 2.5]]){ const p = atE(e, s + ds, dn); if (!pip(R, p[0], p[1])) return; }
    const W = WAs[1], yb = top + 1.6, cyc = rng() < 0.25 ? 3 : 0, idx = cyc ? 3*Math.floor(rng()*10) : Math.floor(rng()*30), off = offB(2 + rng()*2);
    const c = atE(e, s, -set - 0.15); penPlain([0.24, 0.25, 0.27], NEVER); aBox(W, c[0], c[1], e.ux, e.uy, w/2, 0.15, yb - 0.2, yb + h + 0.2, 2 | 4 | 8 | 16 | 32);
    const f = atE(e, s, -set); penSign(0, idx, off, cyc, rng()*8); aFaceC(W, f[0], f[1], e.nx, e.ny, w/2, yb, yb + h);
    penPlain([0.3, 0.31, 0.33], NEVER);
    for (const q of w > 9 ? [-0.4, 0, 0.4] : [-0.35, 0.35]){ const p = atE(e, s + q*w, -set - 0.7); aBox(W, p[0], p[1], e.ux, e.uy, 0.14, 0.14, top - 0.1, yb + h*0.7, 1 | 2 | 4 | 8); }
    const p = atE(e, s, -set + 0.45); aBox(W, p[0], p[1], e.ux, e.uy, w/2, 0.45, yb - 0.32, yb - 0.2, 16 | 32 | 1);
    const g2 = atE(e, s, -set + 2); halo(WBs[1], g2[0], g2[1], yb + h/2, w*0.5, cyc ? [0.5, 0.5, 0.56] : avgCol(0, idx, 0.6), off);
    cnt('roofboard');
  }

  // shophouses and other low-rise shops: a unit every ~5.5 m along each street face
  function decorateShops(B, k, g, top, E, rng, D, ctxP){
    ST.cat = 'shops';
    const F = D ? D.f : FLV.none, R0 = B.rings[0];
    // SGBld gives near-rectangular low buildings with a red roof (and houses) a pitched roof: keep parapet things below its eave
    const roof = B.roof || [0.7, 0.7, 0.7], reddish = roof[0] > roof[1] + 0.12 && roof[0] > roof[2] + 0.15;
    const pitched = B.rings.length === 1 && R0.length === 8 && B.h > 4.5 && (B.t === 3 || (reddish && (B.t === 0 || B.t === 4 || B.t === 7 || B.t === 8 || B.t === 12)));
    const eave = pitched ? top - 3.3 : top;
    const S = streetFaces(B, k, E, 3.2, 17, 1.2);
    if (!S.length) return;
    cnt('shops');
    const lateA = F.late[0], lateB = F.late[1], W2 = WAs[2], V2 = WBs[2];
    for (const {e, c} of S){
      let p = ctxP; if (c >= 10) p *= D ? (F.core ? 1 : B.t === 3 ? 0.4 : 0.75) : 0.55; else if (c === 9 || c === 7 || c === 5 || c === 3) p *= 0.9;
      if (rng() > p) continue;
      const nU = Math.max(1, Math.min(14, Math.round(e.L/5.6))), uw = e.L/nU, hasUp = eave - g >= 6.5;
      const yb0 = hasUp ? g + 3.05 : Math.max(g + 2.3, eave - 1.6);
      // lit shop fronts along the face (each 5 m unit closes at its own time)
      if (rng() < 0.9){ const ph = Math.floor(rng()*255), par = Math.round(Math.min(7.9, lateB + 0.5)*32);
        penB(F.glow, NEVER, P_SHOP, 0, ph, par); bEdge(V2, e, 0.25, e.L - 0.25, 0.12, g + 0.1, Math.min(yb0 - 0.15, g + 2.9), 0, 1);
        penB(F.glow, NEVER, P_SPILL, 0, ph, par); bSpill(V2, e, 0.25, e.L - 0.25, 0.2, 5.5); }
      let lastBoardTop = yb0;
      for (let j = 0; j < nU; j++){
        const s0 = j*uw, sc = s0 + uw/2, off = offB(lateA + rng()*(lateB - lateA));
        if (rng() < F.sign){
          let w = Math.min(uw - 0.5, 4.6), hb = Math.min(1.15, w/4); if (w < 1.6) continue;
          if (w/hb > 4.4) w = hb*4;
          const yb = yb0 + (hasUp && rng() < 0.25 ? 0.35 : 0);
          if (yb + hb <= eave - 0.25){
            const [kd, ix] = deal(rng, POOLS[F.pool]); board(W2, e, sc, w/2, yb, yb + hb, 0.14, kd, ix, off); cnt('board');
            lastBoardTop = Math.max(lastBoardTop, yb + hb);
            if (j % 2 === 0 || nU === 1){ const q = atE(e, sc, 1.1); halo(V2, q[0], q[1], yb + hb*0.5, 2.6, avgCol(kd, ix, 0.32), off); }
            // neon frame round the board
            if (rng() < F.neon){ const col = pick(rng, F.neonC), an = rng() < 0.3 ? A_FLICKER : 0, d = 0.2, a = atE(e, sc - w/2 - 0.08, d), b = atE(e, sc + w/2 + 0.08, d);
              penB(col, off, P_LINE, an, Math.floor(rng()*255), 0);
              bQuad(V2, a[0], a[1], b[0], b[1], yb + hb + 0.03, yb + hb + 0.12, 0, w, 0, 1); bQuad(V2, a[0], a[1], b[0], b[1], yb - 0.12, yb - 0.03, 0, w, 0, 1);
              const l0 = atE(e, sc - w/2 - 0.12, d), l1 = atE(e, sc - w/2 - 0.03, d), r0 = atE(e, sc + w/2 + 0.03, d), r1 = atE(e, sc + w/2 + 0.12, d);
              bQuad(V2, l0[0], l0[1], l1[0], l1[1], yb - 0.12, yb + hb + 0.12, 0, 1, 0, 1); bQuad(V2, r0[0], r0[1], r1[0], r1[1], yb - 0.12, yb + hb + 0.12, 0, 1, 0, 1); cnt('neon'); }
          }
        }
        // vertical blade sign on the party wall
        if (hasUp && rng() < F.blade){
          const yb = g + 3.95, yt = Math.min(eave - 0.4, yb + 3.4); let bh = yt - yb, bw = bh/4;
          if (bw > 0.9){ bw = 0.9; bh = 3.6; } if (bw >= 0.5){
            const s = s0 + 0.35, cx = e.ax + e.ux*s + e.nx*(0.3 + bw/2), cy = e.ay + e.uy*s + e.ny*(0.3 + bw/2), [kd, ix] = deal(rng, BPOOLS[F.bpool]);
            penPlain([0.2, 0.2, 0.22], NEVER); aBox(W2, cx, cy, e.nx, e.ny, bw/2 + 0.04, 0.06, yb - 0.05, yb + bh + 0.05, 8 | 32);
            penSign(kd, ix, off, 0, 0);
            aFaceC(W2, cx + e.ux*0.062, cy + e.uy*0.062, e.ux, e.uy, bw/2, yb, yb + bh); aFaceC(W2, cx - e.ux*0.062, cy - e.uy*0.062, -e.ux, -e.uy, bw/2, yb, yb + bh);
            halo(V2, cx, cy, yb + bh/2, 2.2, avgCol(kd, ix, 0.35), off); cnt('blade');
          }
        }
        // hanging lanterns at the five-foot way
        if (F.lantern && rng() < F.lantern){
          const red = F.lantC === 'red', lc = red ? [1, 0.2, 0.08] : pick(rng, WARM_LANT), day = red ? [0.7, 0.09, 0.06] : lc.map(v => v*0.7), lo = offB(1 + rng()*5);
          for (const q of [0.28, 0.72]){ const c = atE(e, s0 + uw*q, 0.6), y1 = Math.min(yb0 - 0.2, g + 2.95);
            penPlain(day, lo, lc, 2, Math.floor(rng()*31)); aBox(W2, c[0], c[1], 0.7071, 0.7071, 0.22, 0.22, y1 - 0.62, y1 - 0.1, 1 | 2 | 4 | 8 | 32);
            halo(V2, c[0], c[1], y1 - 0.36, 1.5, lc.map(v => v*0.45), lo); }
          cnt('lantern');
        }
      }
      // string lights along the face (under the boards or along the parapet)
      if (F.string && rng() < F.string){ const y = rng() < 0.5 || !hasUp ? lastBoardTop + 0.3 : eave - 0.45;
        if (y + 0.2 < eave){ penB(F.strMulti ? [1, 1, 1] : F.strC, offB(lateA + 1 + rng()*2), P_DOTS, F.strMulti ? A_MULTI : 0, Math.floor(rng()*255), 0); bEdge(V2, e, 0.2, e.L - 0.2, 0.22, y, y + 0.22, 0, 1); cnt('string'); } }
      // neon line along the parapet
      if (!pitched && rng() < F.neon*0.5 && eave - g > 5){ const col = pick(rng, F.neonC); penB(col, offB(lateA + rng()*(lateB - lateA)), P_LINE, rng() < 0.3 ? A_FLICKER : 0, Math.floor(rng()*255), 0); bEdge(V2, e, 0, e.L, 0.1, eave - 0.6, eave - 0.42, 0, 1); }
      // strings of red lanterns across the narrow streets of Chinatown (from the faces looking north / east, so once per street)
      if (F.lantC === 'red' && D && D.k === 'chinatown' && c >= 9 && hasUp && e.nx + e.ny > 0){
        const span = Math.min(2*street(e.mx, e.my, e.nx, e.ny, e.ux, e.uy, e.L/2, 17) - 0.6, 14);
        if (span > 4){ penB([1, 0.2, 0.07], offB(2 + rng()*3), P_DOTS, 0, Math.floor(rng()*255), 15); const y = g + 5.4 + rng()*0.6;
          for (let s = 3; s < e.L - 1; s += 7 + rng()*3){ const a0 = atE(e, s, 0.3), wx = -e.ny*0.2, wy = e.nx*0.2; // a strip 0.4 m wide, lanterns every 1.2 m
            W_hstrip(V2, a0[0] - e.ux*0.3, a0[1] - e.uy*0.3, a0[0] + e.ux*0.3, a0[1] + e.uy*0.3, e.nx*span, e.ny*span, y); }
          cnt('lanternstring'); }
      }
      // coloured uplights (the quays)
      if (F.wash && rng() < F.wash){ penB(pick(rng, MULTI).map(v => v*0.75), offB(lateB), P_WASH, rng() < 0.2 ? A_HUE : 0, Math.floor(rng()*255), 50); bEdge(V2, e, 0, e.L, 0.3, g, eave, 0, 1); cnt('quaywash'); }
    }
  }

  // triangles written so far (all writers): per-feature triangle statistics
  const triNow = () => (WAs[0].ni + WAs[1].ni + WAs[2].ni + WBs[0].ni + WBs[1].ni + WBs[2].ni)/3;
  function decorate(B, k, rng){
    SGCURB = (B.i !== undefined ? B.i : k) & 65535;
    const t0 = triNow(), c0 = ST.cat;
    decorate1(B, k, rng);
    const d = triNow() - t0; if (d) ST['tri_' + (ST.cat || '?')] = (ST['tri_' + (ST.cat || '?')] || 0) + d;
    if (API.dbg) API.dbg.push({ti:TI, k, t:B.t, h:B.h, base:B.base, area:Math.round(B.area), part:B.part, cat:ST.cat, poi:POIK.get(k) || 0, tris:d, x:Math.round(B.cx), y:Math.round(B.cy)});
    ST.cat = c0;
  }
  function decorate1(B, k, rng){
    ST.dec = (ST.dec || 0) + 1;
    const t = B.t, h = B.h, R0 = B.rings[0];
    if (R0.length < 6) return;
    const g = GOFF[k] === GOFF[k] ? GOFF[k] : groundOf(R0), base = B.base > 2 && B.base < h - 0.5 ? B.base : 0, y0 = g + base, top = g + h;
    const E = edges(R0); if (!E.length) return;
    const poi = POIK.get(k) || 0;
    const cl = typeof SGCrown !== 'undefined' && SGCrown.claims ? SGCrown.claims(B) : null;     // lm20/crown signs this part (crown / led / media / roof)
    // not covered by a taller part of the same building (its roof is visible)
    const free = h < 50 ? true : (() => { const c = bldAt(B.cx, B.cy, k, h + 0.5); return c < 0; })();
    if (h >= 90 && free) aviation(B, g, top);
    if (t === 1){ decorateHDB(B, k, g, E, rng); return; }
    const lu = typeof sgLU === 'function' ? sgLU(B.cx, B.cy) : 0;
    const hotel = t === 12 || poi === 2;
    const mall = h <= 70 && ((poi === 1 && B.area >= 600) || (t === 4 && (B.area >= 4000 || (B.area >= 2000 && h >= 15))) || (t === 0 && lu === 2 && B.area >= 5000 && h >= 12));
    if (mall){ decorateMall(B, k, g, y0, top, E, rng, inHub(B.cx, B.cy), cl); if (h < 50) return; }
    if (h >= 50 && free && B.area >= 60 && (t === 0 || t === 4 || t === 5 || t === 12)){ decorateTower(B, k, g, y0, top, E, rng, hotel, cl); return; }
    if (t === 2 && h >= 30 && free){ decorateCondo(B, top, E, rng); return; }
    // floodlit temples, churches, museums, theatres, hotels
    if (poi === 3 || t === 8 || (hotel && h < 50)){
      const p = poi === 3 ? 0.85 : t === 8 ? 0.7 : 0.5;
      if (B.area >= 100 && rng() < p){ cnt('flood'); ST.cat = 'flood'; wash(WBs[1], E, y0, Math.min(top - y0, t === 8 ? 16 : 24), t === 8 ? [1, 0.72, 0.38] : rng() < 0.75 ? [1, 0.8, 0.52] : [1, 0.92, 0.8], 4, 14, 4 + rng()*2, offB(1 + rng()*2.5)); }
      if (t === 8 || poi === 3) return;
      if (hotel && rng() < 0.35) crownLine(WBs[1], E, top - 0.8, top - 0.3, 0.15, [1, 0.76, 0.42], 0, 0);
    }
    // low-rise shops
    if (h <= 24 && h >= 3.5 && base <= 1 && B.area <= 6000 && B.area >= 12){
      const D = distOf(B.cx, B.cy);
      let p = 0;
      if (D) p = t === 0 || t === 3 || t === 4 || t === 12 ? 1 : t === 2 ? 0.5 : 0;
      else if (t === 4) p = 1; else if (t === 0 && lu === 2) p = 0.7;
      if (p > 0) decorateShops(B, k, g, top, E, rng, D, p);
    }
  }

  // ---------------- per tile: a job decorates its buildings in slices (a few ms per frame), then packs the meshes ----------------
  let POIK = new Map();
  function begin(job){
    if (!ready) init();
    const T = job.T, list = job.list;
    OX = T.cx; OY = T.cy;
    for (const w of WAs){ w.nv = 0; w.ni = 0; } for (const w of WBs){ w.nv = 0; w.ni = 0; }
    ST = {}; job.k = 0; job.ms = 0; DECKS = new Map();
    prepTile(T.ti, list);
    // buildings marked by a point of interest (mall, hotel, floodlit civic / religious)
    POIK = new Map();
    for (const p of POI){ if (Math.abs(p.x - OX) > 1000 || Math.abs(p.y - OY) > 1000) continue;
      let b = bldAt(p.x, p.y, -1, 2.5);
      if (b < 0){ let bd = 40; const c = gcy(p.y)*GN + gcx(p.x); for (let j = BG.start[c]; j < BG.start[c + 1]; j++){ const q = BG.list[j], B = list[q]; if (B.area < 300) continue; const d = Math.hypot(B.cx - p.x, B.cy - p.y); if (d < bd){ bd = d; b = q; } } }
      if (b >= 0 && !POIK.has(b)) POIK.set(b, p.k); }
  }
  // decorate the job's buildings from job.k on until the deadline; true when the tile is done
  function step(job, deadline){
    const list = job.list, n = list.length, skip = job.skip, ti = job.T.ti;
    let k = job.k;
    while (k < n){
      const B = list[k];
      if (!B.foreign){
        const t = B.t, h = B.h;
        let go = t === 1 || h >= 50 || t === 4 || t === 12 || t === 8 || (t === 2 && h >= 30) || POIK.has(k);
        // quick rejects before the (costlier) skip test: houses, sheds, industry, low generic blocks outside the districts
        if (!go && h <= 24 && h >= 3.5){
          const bb = k*4; for (const D of DIST){ const b = D.bb; if (BBX[bb+2] >= b[0] && BBX[bb] <= b[2] && BBX[bb+3] >= b[1] && BBX[bb+1] <= b[3]){ go = true; break; } }
          if (!go && t === 0 && typeof sgLU === 'function' && sgLU(B.cx, B.cy) === 2) go = true;
        }
        if (go && !(skip && skip(B))) decorate(B, k, mulberry32((B.seed*7919 + k*131 + ti*7 + 0x5193) >>> 0));
      }
      k++;
      if ((k & 15) === 0 && now() > deadline) break;
    }
    job.k = k;
    return k >= n;
  }
  // node / tests: the whole tile at once (arrays only)
  function arrays(T, list, skip){ const job = {T, list, skip}; begin(job); step(job, Infinity); return ST; }
  // concatenate the tier writers of one mesh (tier 0 first) into exact-size arrays; ends[t] = index count up to tier t
  function pack(ws, attrs){
    let nv = 0, ni = 0; for (const w of ws){ nv += w.nv; ni += w.ni; }
    if (!ni) return null;
    const out = {}, ends = [];
    for (const [k, n, C] of attrs) out[k] = new C(nv*n);
    const I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let ov = 0, oi = 0;
    for (const w of ws){ for (const [k, n] of attrs) out[k].set(w[k].subarray(0, w.nv*n), ov*n); const src = w.I; for (let i = 0; i < w.ni; i++) I[oi + i] = src[i] + ov; ov += w.nv; oi += w.ni; ends.push(oi); }
    return {out, I, ends, nv, ni};
  }
  const ATTR_A = [['P', 3, Float32Array], ['N', 3, Int8Array], ['T', 2, Float32Array], ['K', 4, Float32Array], ['D', 4, Uint8Array], ['E', 4, Uint8Array], ['Bi', 1, Uint16Array]];
  const ATTR_B = [['P', 3, Float32Array], ['T', 2, Float32Array], ['C', 4, Uint8Array], ['M', 4, Uint8Array], ['Bi', 1, Uint16Array]];

  // ---------------- materials ----------------
  function mats(){
    if (MA) return;
    // [lm28/ruin] the dead flags of bld.js (destroyed buildings): their signs, screens, outlines and lights go with them
    const SGKD = typeof SGBld !== 'undefined' && SGBld.kd && SGBld.kd.dead ? SGBld.kd.dead : null;
    const SGKD_PARS = SGKD ? 'attribute float aBid;\n' + SGKD.glsl : '', SGKD_HIDE = SGKD ? '\nif (kdgDead(vec3(modelMatrix[3][0], modelMatrix[3][1], modelMatrix[3][2]), aBid) > 0.5) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);\n' : '';
    SGA = makeAtlas();
    const sgTex = new THREE.CanvasTexture(SGA.cv); sgTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    MA = new THREE.MeshLambertMaterial({map:adTex, polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-4});
    MA.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, ADU, {uSgTex:{value:sgTex}, uSN:U.uSN, uLH:U.uLH}, SGKD ? SGKD.u : {});
      const f = v => v.toFixed(6), reg = (R, W) => `{ R = vec4(${f(R.x/W)}, ${f(1 - R.y/W)}, ${f(R.w/W)}, ${f(R.h/W)}); C = ${R.c}.0; NN = ${R.n}.0; }`, G = ADATLAS.REG, W1 = ADATLAS.W, S = SGA.REG, W2 = SGA.W;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
attribute vec4 adk;
attribute vec4 aDay;
attribute vec4 aEm;
uniform float uAdT;
uniform float uSN;
uniform float uLH;
varying vec4 vCell;
varying vec4 vAdF;
varying vec3 vDay;
varying vec3 vEm;
varying float vOn;
vec3 sgHue(float h){ return clamp(abs(mod(h*6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }`)
        .replace('#include <uv_vertex>', `vUv = uv;
  { float kind = adk.x, idx = adk.y, fl = 1.0, C = 1.0, NN = 1.0, src = 0.0; vec4 R = vec4(0.0, 1.0, 0.01, 0.01);
    if (kind < 0.5) ${reg(G.L, W1)} else if (kind < 1.5) ${reg(G.P, W1)} else if (kind < 2.5) ${reg(G.B, W1)} else if (kind < 3.5) ${reg(G.S, W1)} else if (kind < 4.5) ${reg(G.T, W1)}
    else if (kind > 5.5){ src = 1.0; if (kind < 6.5) ${reg(S.S, W2)} else if (kind < 7.5) ${reg(S.B, W2)} else ${reg(S.E, W2)} }
    if (adk.z > 1.5){ float tt = uAdT/6.5 + adk.w; idx = mod(idx + floor(mod(tt, adk.z)), NN); fl = 0.25 + 0.75*smoothstep(0.0, 0.05, fract(tt)); }
    float col = mod(idx, C), row = floor((idx + 0.5)/C);
    vCell = vec4(R.x + col*R.z, R.y - (row + 1.0)*R.w, R.z, R.w);
    vAdF = vec4(fl, step(3.5, kind)*step(kind, 4.5), src, step(4.5, kind)*step(kind, 5.5));
    vOn = aDay.a > 0.998 ? 1.0 : step(uLH, aDay.a*8.0);
    vDay = aDay.rgb;
    float m = floor(aEm.a*255.0/32.0 + 0.01), ph = mod(floor(aEm.a*255.0 + 0.5), 32.0)/32.0, k = 1.0;
    vec3 e = aEm.rgb;
    if (m > 0.5 && m < 1.5) e = sgHue(fract(uAdT*0.05 + ph))*max(e.r, max(e.g, e.b));
    else if (m > 1.5 && m < 2.5) k = 0.72 + 0.28*sin(uAdT*1.1 + ph*6.2832);
    else if (m > 2.5 && m < 3.5) k = 0.72 + 0.28*step(0.1, fract(sin(floor(uAdT*8.0) + ph*97.0)*43758.55));
    else if (m > 3.5 && m < 4.5){ float q = fract(uAdT/3.0); k = smoothstep(0.0, 0.04, q)*(1.0 - smoothstep(0.42, 0.5, q)); }
    vEm = e*k*uSN*vOn; }`).replace('#include <common>', '#include <common>\n' + SGKD_PARS).replace('#include <project_vertex>', '#include <project_vertex>' + SGKD_HIDE);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform sampler2D uSgTex;
uniform float uAdT;
uniform float uAdGlow;
uniform float uAdDiff;
varying vec4 vCell;
varying vec4 vAdF;
varying vec3 vDay;
varying vec3 vEm;
varying float vOn;`)
        .replace('#include <map_fragment>', `vec2 adSt = vUv; if (vAdF.y > 0.5) adSt.x = fract(adSt.x + uAdT*0.04);
  adSt = clamp(adSt, 0.002, 0.998);
  vec2 sgUv = vCell.xy + adSt*vCell.zw;
  vec3 sgT0 = mix(mapTexelToLinear(texture2D(map, sgUv)).rgb, texture2D(uSgTex, sgUv).rgb, vAdF.z);
  diffuseColor.rgb *= vDay*mix(sgT0*uAdDiff*vAdF.x, vec3(1.0), vAdF.w);`)
        .replace('#include <emissivemap_fragment>', 'totalEmissiveRadiance = sgT0*vDay*(uAdGlow*vAdF.x*vOn*(1.0 - vAdF.w)) + vEm;');
    };
    MB = new THREE.ShaderMaterial({
      uniforms:Object.assign({uT:LMT, uSN:U.uSN, uLH:U.uLH, uVH:U.uVH}, SGKD ? SGKD.u : {}),
      vertexShader:SGKD_PARS + `attribute vec2 aUV;
attribute vec4 aCol;
attribute vec4 aMd;
uniform float uT;
uniform float uSN;
uniform float uLH;
uniform float uVH;
varying vec2 vUV;
varying vec3 vC;
varying float vK;
varying vec4 vM;
vec3 sgHue(float h){ return clamp(abs(mod(h*6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
void main(){
  float pat = aMd.x, an = aMd.y, ph = aMd.z/255.0;
  vec4 mv = modelViewMatrix*vec4(position, 1.0);
  vUV = aUV;
  if (pat > 7.5 && pat < 8.5){
    float s = max(abs(aUV.x), aMd.w*0.125*max(-mv.z, 1.0)/(projectionMatrix[1][1]*uVH));
    mv.xy += sign(aUV)*s;
    vUV = sign(aUV);
  }
  gl_Position = projectionMatrix*mv;${SGKD_HIDE}
  float on = uSN*(aCol.a > 0.998 ? 1.0 : step(uLH, aCol.a*8.0));
  vec3 c = aCol.rgb;
  if (an > 0.5 && an < 1.5) c = sgHue(fract(uT*0.045 + ph))*max(c.r, max(c.g, c.b));
  else if (an > 2.5 && an < 3.5) on *= 0.6 + 0.4*sin(uT*1.1 + ph*6.2832);
  else if (an > 3.5 && an < 4.5) on *= 0.7 + 0.3*step(0.1, fract(sin(floor(uT*8.0) + ph*97.0)*43758.55));
  else if (an > 4.5 && an < 5.5){ float q = fract(uT/3.0); on *= smoothstep(0.0, 0.04, q)*(1.0 - smoothstep(0.42, 0.5, q)); }
  if ((pat > 4.5 && pat < 5.5) || pat > 9.5) on = uSN;
  vC = c; vK = on; vM = aMd;
  if (on < 0.002) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
}`,
      fragmentShader:`uniform float uT;
uniform float uLH;
varying vec2 vUV;
varying vec3 vC;
varying float vK;
varying vec4 vM;
float sgP(float x, float w, float fw){ fw = max(fw, 1e-4); float a = x - 0.5*fw, b = x + 0.5*fw; return clamp(((floor(b)*w + min(fract(b), w)) - (floor(a)*w + min(fract(a), w)))/fw, 0.0, 1.0); }
float sgH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
vec3 sgHue(float h){ return clamp(abs(mod(h*6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
void main(){
  float pat = vM.x, I = 1.0;
  vec3 col = vC;
  if (pat < 0.5){
    float d = abs(vUV.y*2.0 - 1.0); I = 1.0 - d*d*0.6;
    if (vM.y > 1.5 && vM.y < 2.5) I *= 0.2 + 0.8*pow(0.5 + 0.5*sin(vUV.x*0.3 - uT*2.2 + vM.z*0.0246), 6.0);
  } else if (pat < 1.5){
    float v = vUV.y, fv = fwidth(v), fu = fwidth(vUV.x);
    float h = sgH(vec2(floor(v), floor(vUV.x/7.0) + vM.z));
    float vr = mix(mix(0.5, 1.0, h)*step(0.06, h), 0.75, clamp(fv*1.5, 0.0, 1.0));
    float band = sgP(v - 0.24, 0.72, fv);
    float tube = sgP(v - 0.84, 0.11, fv)*(0.55 + 0.45*sgP(vUV.x/3.2 + vM.z*0.01, 0.45, fu/3.2));
    I = (0.42*band + 2.1*tube)*vr;
  } else if (pat < 2.5){
    float l = sgP(vUV.x/5.0 + vM.z*0.01, 0.35, fwidth(vUV.x)/5.0);
    I = (0.15 + 0.85*smoothstep(0.45, 1.0, vUV.y))*(0.35 + 0.65*l)*0.8;
  } else if (pat < 3.5){
    float v = vUV.y, fv = fwidth(v);
    I = sgP(v - 0.21, 0.76, fv)*(0.55 + 0.25*sgH(vec2(floor(v), vM.z)));
  } else if (pat < 4.5){
    float sp = max(1.0, vM.w*0.1), c = 0.5 + 0.5*cos(6.2832*vUV.x/sp), fu = fwidth(vUV.x)/sp;
    c = mix(c, 0.5, clamp(fu*1.5, 0.0, 1.0));
    float v = clamp(vUV.y, 0.0, 1.0);
    I = (1.0 - v)*(1.0 - v)*(0.25 + 0.75*c*c) + 0.1*(1.0 - v);
  } else if (pat < 5.5){
    float sg = floor(vUV.x/5.0), h = sgH(vec2(sg, vM.z)), h2 = fract(h*13.37);
    I = step(0.15, h)*(0.45 + 0.55*h2)*step(uLH, vM.w/32.0*h2)*sgP(vUV.x/5.0 + 0.03, 0.94, fwidth(vUV.x)/5.0);
    I *= smoothstep(0.0, 0.25, vUV.y)*(1.0 - smoothstep(0.85, 1.0, vUV.y))*0.75;
  } else if (pat < 6.5){
    I = vUV.y*vUV.y;
  } else if (pat < 7.5){
    float x = vUV.x/(vM.w > 0.5 ? vM.w*0.1 : 0.5), fx = fwidth(x), id = floor(x), dx = fract(x) - 0.5, dy = vUV.y - 0.5;
    float far = clamp(fx - 0.3, 0.0, 1.0);
    I = mix(exp(-(dx*dx + dy*dy)*22.0)*1.4, 0.3, far);
    if (vM.y > 5.5) col = mix(sgHue(fract(id*0.618 + vM.z*0.01)), vec3(1.0, 0.8, 0.55), far*0.6)*(0.75 + 0.25*sin(uT*2.0 + id*1.7));
  } else if (pat < 8.5){
    float r = dot(vUV, vUV);
    I = max(0.0, 1.0 - r); I = I*I*(0.35 + 0.65*I);
  } else if (pat < 9.5){
    // LED media facade: a 0.5 m pixel grid playing slow colour waves (vM.w: 0 waves, 1 rising bars, 2 rings)
    float px = vUV.x*2.0, py = vUV.y*2.0, fp = max(fwidth(px), fwidth(py));
    float dots = mix(sgP(px, 0.55, fp)*sgP(py, 0.55, fp), 0.3, clamp(fp - 0.4, 0.0, 1.0));
    vec2 q = floor(vec2(px, py))*0.5;
    float w = vM.w < 0.5 ? sin(q.x*0.21 + q.y*0.13 - uT*1.3 + vM.z*0.1) : vM.w < 1.5 ? sin(q.y*0.5 - uT*2.0 + sin(q.x*0.31 + vM.z)*2.0) : sin(length(q - vec2(20.0, 8.0))*0.45 - uT*1.6);
    col = sgHue(fract(q.x*0.008 + q.y*0.004 + uT*0.03 + vM.z*0.01))*0.55 + 0.45*vec3(0.9, 0.95, 1.0);
    I = dots*(0.25 + 0.75*smoothstep(-0.2, 0.9, w))*0.9;
  } else if (pat > 10.5){
    // light pool round a lit void deck (v 0 under the slab edge .. 1 out on the ground), brightest along the slab edge
    float v = vUV.y;
    I = (1.0 - smoothstep(0.32, 1.0, v)) * (0.35 + 0.65 * smoothstep(0.0, 0.36, v)) * 0.32;
  } else {
    // light pool on the pavement in front of the shop fronts (same 5 m units and closing hours as the shop-front glow)
    float sg = floor(vUV.x/5.0), h = sgH(vec2(sg, vM.z)), h2 = fract(h*13.37);
    float on = step(0.15, h)*(0.45 + 0.55*h2)*step(uLH, vM.w/32.0*h2);
    float v = clamp(vUV.y, 0.0, 1.0);
    I = on*(1.0 - v)*(1.0 - v)*0.8;
  }
  gl_FragColor = vec4(col*(vK*I), 1.0);
}`,
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide,
      polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2, extensions:{derivatives:true}
    });
    MB.visible = U.uSN.value > 0.002;
  }
  const dropArr = function(){ this.array = null; };
  function mesh(pk, mat, kind){
    const g = new THREE.BufferGeometry(), o = pk.out;
    g.setAttribute('position', new THREE.BufferAttribute(o.P, 3));
    if (kind === 'A'){ g.setAttribute('normal', new THREE.BufferAttribute(o.N, 3, true)); g.setAttribute('uv', new THREE.BufferAttribute(o.T, 2)); g.setAttribute('adk', new THREE.BufferAttribute(o.K, 4)); g.setAttribute('aDay', new THREE.BufferAttribute(o.D, 4, true)); g.setAttribute('aEm', new THREE.BufferAttribute(o.E, 4, true)); }
    else { g.setAttribute('aUV', new THREE.BufferAttribute(o.T, 2)); g.setAttribute('aCol', new THREE.BufferAttribute(o.C, 4, true)); g.setAttribute('aMd', new THREE.BufferAttribute(o.M, 4)); }
    if (o.Bi) g.setAttribute('aBid', new THREE.BufferAttribute(o.Bi, 1));
    g.setIndex(new THREE.BufferAttribute(pk.I, 1));
    g.computeBoundingSphere(); if (kind === 'B') g.boundingSphere.radius += 40;
    for (const k in g.attributes) g.attributes[k].onUpload(dropArr); g.index.onUpload(dropArr);
    const m = new THREE.Mesh(g, mat); m.userData.ends = pk.ends; m.name = 'sgsigns' + kind;
    m.position.set(OX, 0, -OY); m.matrixAutoUpdate = false; m.updateMatrix();
    if (kind === 'B'){ m.renderOrder = 5; m.frustumCulled = true; }
    return m;
  }
  // the tile hook only queues a job and returns its (still empty) group; frameHook builds the jobs within a time budget per frame
  const JOBS = []; let cur = null;
  function applyLod(grp){ const d = grp.userData.d; if (d === undefined) return; const t = d < TIER_D[2] ? 2 : d < TIER_D[1] ? 1 : d < TIER_D[0] ? 0 : -1;
    for (const m of grp.children){ const n = t < 0 ? 0 : m.userData.ends[t]; m.visible = n > 0; m.geometry.setDrawRange(0, n); } }
  function tileHook(T, list, skip){
    usVocab();
    if (!SGR.on) return null;
    const grp = new THREE.Group(); grp.name = 'sgsigns' + T.ti; grp.matrixAutoUpdate = false;
    grp.userData.lod = d => { grp.userData.d = d; applyLod(grp); };
    grp.userData.dispose = () => { grp.userData.dead = true; };
    JOBS.push({T, list, skip, grp});
    return grp;
  }
  function finish(job){
    const t0 = now(), grp = job.grp;
    const pa = pack(WAs, ATTR_A), pb = pack(WBs, ATTR_B);
    if (pa || pb){ mats(); if (pa) grp.add(mesh(pa, MA, 'A')); if (pb) grp.add(mesh(pb, MB, 'B')); applyLod(grp); }
    job.ms += now() - t0;
    const tr = [0, 1, 2].map(i => Math.round((WAs[i].ni + WBs[i].ni)/3));
    STATS.tiles++; STATS.ms += job.ms; STATS.maxMs = Math.max(STATS.maxMs, job.ms); STATS.maxSlice = Math.max(STATS.maxSlice || 0, job.slice || 0);
    for (let i = 0; i < 3; i++){ STATS.tris[i] += WAs[i].ni/3; STATS.tris[3 + i] += WBs[i].ni/3; }
    for (const k in ST) if (typeof ST[k] === 'number') STATS.n[k] = (STATS.n[k] || 0) + ST[k];
    STATS.last = {ti:job.T.ti, ms:+job.ms.toFixed(2), slices:job.slices, tris:tr};
    (STATS.per || (STATS.per = {}))[job.T.ti] = {ms:+job.ms.toFixed(2), slices:job.slices, tris:tr};
  }
  // work through the queue for up to `budget` ms (Infinity: everything now)
  function pump(budget){
    const t0 = now(), dl = t0 + budget;
    while (true){
      if (cur && cur.grp.userData.dead) cur = null;
      if (!cur){ let j; while ((j = JOBS.shift()) && j.grp.userData.dead); if (!j) break; cur = j; const a = now(); begin(j); j.ms += now() - a; j.slices = 0; }
      const a = now(), done = step(cur, dl), d = now() - a; cur.ms += d; cur.slices++; cur.slice = Math.max(cur.slice || 0, d);
      if (done){ finish(cur); cur = null; }
      if (now() >= dl) break;
    }
  }
  let lastF = 0;
  function frameHook(){
    if (typeof renderer !== 'undefined'){ const h = renderer.domElement.height*0.5; if (h !== U.uVH.value) U.uVH.value = h; }
    if (!cur && !JOBS.length) return;
    // about a quarter of the frame time, 3-12 ms
    const t = now(), dt = lastF ? t - lastF : 16; lastF = t;
    pump(Math.max(3, Math.min(12, dt*0.25)));
  }
  function time(tod, nf){
    U.uSN.value = sm(0.05, 0.6, nf);
    const t = tod < 12 ? tod + 24 : tod; U.uLH.value = Math.max(0, t - 22);
    if (MB) MB.visible = U.uSN.value > 0.002;
  }
  const API = {tileHook, time, frameHook, arrays, pack, flush:() => pump(Infinity), prewarm:() => { const t = now(); mats(); STATS.matsMs = +(now() - t).toFixed(1); }, get pending(){ return JOBS.length + (cur ? 1 : 0); }, WAs, WBs, ATTR_A, ATTR_B, STATS, U, TIER_D, FLV, DIST, HUB, get atlas(){ return SGA && SGA.cv; }, dbg:null, version:'signs-1'};
  return API;
})();
if (typeof HOOKS !== 'undefined'){
  HOOKS.tile.push((T, list, skip) => SGSigns.tileHook(T, list, skip));
  HOOKS.time.push((tod, nf) => SGSigns.time(tod, nf));
  HOOKS.frame.push(() => SGSigns.frameHook());
  // draw the Singapore atlas and make the materials during start-up (not in the middle of the first tile)
  HOOKS.boot.push(() => SGSigns.prewarm());
}
if (typeof window !== 'undefined') window.SGSigns = SGSigns;
if (typeof module !== 'undefined' && typeof window === 'undefined') module.exports = SGSigns;
}
