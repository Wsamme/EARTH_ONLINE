/* ================= v39 add-on: Hong Kong signs and neon (hkv/hksigns; replaces lm20/signs in the Hong Kong build) =================
   Built on lm20/signs (aviation lights, LED crown lines, lightbox plates, mall screens, podium uplights, lit shop fronts, floodlit
   temples), made Hong Kong-aware, plus three things of its own:
   1. A text atlas drawn at start-up (canvas, Traditional Chinese font stacks): masks of invented sign texts (R letters, G neon tubes,
      B halo). The colours, lighting (neon tubes / lightbox / LED screen / floodlit / off) and animation (flash, chase, sequence,
      scroll, colour cycle, abstract LED video) come from the vertices and run in the shader on LMT: kind 9 of mesh A.
   2. The sign specs of hkv/<author>/signs_<author>.json (collected into the HKSPEC block by hkv/hksigns/gen.py): roof frames, channel letters,
      wall boards, lightboxes, LED screens, blades, over-street boards and fascia bands at their real positions, sizes and colours;
      bld / lm / roof:true put a sign on that building's roof, otherwise y is above the app ground; wall-type signs snap to the
      facade they face, blades and over-street boards to the wall they project from.
   3. The street neon of Kowloon and the north shore of the Island along the real roads (SGR.lines names, profiles per street):
      boards cantilevered over the street stacked from the second floor up, vertical boards, blades on the pillars, fascia
      boards over the shop fronts, lightboxes and LED screens up the facades, coloured light on the pavement, the Temple Street
      market bulbs. Seeded per building; nothing generated within ~6 m of a spec. Rooftop signs (estimates) on the towers that face
      the harbour where no spec is near; lit access corridors on slab blocks outside the shopping districts.
   Two draw calls per tile (A opaque Lambert incl. the text signs, B additive glow), LOD tiers by tile distance (drawRange),
   no per-frame CPU work besides the build queue. Invented names and generic trade words only: no real brands or logos. */
{
const SGSigns = (() => {
  const TIER_D = [15000, 6500, 3300];          // tile distance up to which tier 0 / 1 / 2 is drawn
  const NODE = typeof window === 'undefined';
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  // ---------------- sign specs (hkv/*/signs_*.json, written into this block by hkv/hksigns/gen.py) ----------------
  /*@@HKSPEC*/const HKSPEC = [{"id":"cwb_epc_led","lat":22.280172,"lon":114.184046,"kind":"led","w":46.0,"h":15.0,"y":22.0,"az":177.0,"sides":1,"font":"sans","bg":"#000000","fg":"#ffffff","edge":null,"lit":"led","anim":"screen","bld":"w294141091","conf":"photo","bx":6622.5,"by":-6602.6,"bh":72.3},{"id":"cwb_epc_corner","lat":22.280207,"lon":114.184519,"kind":"box","w":12.0,"h":7.0,"y":17.0,"az":180.0,"sides":1,"text":"雅匯百貨","sub":"AVENTA","font":"serif","bg":"#e8e8e8","fg":"#18c8d8","edge":null,"lit":"box","anim":"none","bld":"w294141091","conf":"photo","bx":6622.5,"by":-6602.6,"bh":72.3},{"id":"cwb_epc_corner_e","lat":22.28059,"lon":114.184619,"kind":"box","w":10.0,"h":7.0,"y":17.0,"az":70.0,"sides":1,"text":"雅匯百貨","sub":"AVENTA","font":"serif","bg":"#e8e8e8","fg":"#18c8d8","edge":null,"lit":"box","anim":"none","bld":"w294141091","conf":"photo","bx":6622.5,"by":-6602.6,"bh":72.3},{"id":"cwb_epc_blade_1986","lat":22.280166,"lon":114.184499,"kind":"blade","w":2.5,"h":16.0,"y":20.0,"az":269.0,"sides":2,"text":"雅匯百貨","sub":"AVENTA","vert":1,"font":"sans","bg":"#c8102e","fg":"#ffffff","edge":null,"lit":"neon","anim":"none","conf":"photo"},{"id":"cwb_hen_bank_blade","lat":22.279872,"lon":114.183029,"kind":"blade","w":2.4,"h":9.0,"y":14.0,"az":251.0,"sides":2,"text":"澄海銀行","sub":"CH BANK","vert":1,"font":"hei","bg":"#d0101e","fg":"#ffffff","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"cwb_hen_green_char","lat":22.280249,"lon":114.183546,"kind":"blade","w":4.0,"h":8.0,"y":11.0,"az":88.0,"sides":2,"text":"壽","vert":1,"font":"kai","bg":"#2c7a5a","fg":"#ffffff","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"cwb_hen_jewel_box","lat":22.279926,"lon":114.184201,"kind":"over","w":7.0,"h":3.0,"y":9.0,"az":267.0,"sides":2,"text":"明輝珠寶","sub":"MING FAI JEWELLERY","font":"hei","bg":"#ffffff","fg":"#d0101e","edge":"#d0101e","lit":"box","anim":"none","conf":"photo"},{"id":"cwb_yeewo_band","lat":22.279801,"lon":114.185132,"kind":"band","w":40.0,"h":5.0,"y":8.0,"az":19.0,"sides":1,"text":"甜品專門店","sub":"DESSERT HOUSE","font":"hei","bg":"#f4f0e8","fg":"#202020","edge":null,"lit":"flood","anim":"none","conf":"photo"},{"id":"cwb_yeewo_green","lat":22.279789,"lon":114.185277,"kind":"over","w":4.0,"h":3.5,"y":6.5,"az":289.0,"sides":2,"text":"鮮選超市","sub":"FRESHWAY","font":"sans","bg":"#3cb83c","fg":"#ffffff","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"cwb_yeewo_corner_bb","lat":22.280086,"lon":114.184783,"kind":"wall","w":12.0,"h":7.0,"y":10.0,"az":201.0,"sides":1,"font":"sans","bg":"#202020","fg":"#ffffff","edge":null,"lit":"flood","anim":"none","conf":"photo"},{"id":"cwb_yeewo_yellow_blade","lat":22.279932,"lon":114.184357,"kind":"blade","w":2.5,"h":20.0,"y":22.0,"az":301.0,"sides":2,"text":"金寶財務","vert":1,"font":"hei","bg":"#f2d21b","fg":"#202020","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"cwb_eastpoint_jewel","lat":22.280694,"lon":114.184691,"kind":"over","w":10.0,"h":3.0,"y":9.0,"az":280.0,"sides":2,"text":"嘉麟珠寶","sub":"KALIN JEWELLERY","font":"hei","bg":"#4a3a2a","fg":"#ffffff","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"cwb_eastpoint_camera","lat":22.281102,"lon":114.184604,"kind":"over","w":3.5,"h":2.2,"y":7.0,"az":338.0,"sides":2,"text":"光影相機","sub":"KAMERA","font":"sans","bg":"#d0101e","fg":"#ffd000","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"cwb_eastpoint_fx","lat":22.280866,"lon":114.18464,"kind":"over","w":1.6,"h":3.0,"y":6.0,"az":337.0,"sides":2,"text":"找換","sub":"EXCHANGE","vert":1,"font":"hei","bg":"#101010","fg":"#ff2a2a","edge":"#2a6fff","lit":"led","anim":"scroll","conf":"photo"},{"id":"cwb_lock_503_disc","lat":22.280731,"lon":114.18319,"kind":"over","w":1.8,"h":1.8,"y":5.5,"az":88.0,"sides":2,"text":"寵","font":"hei","bg":"#0a1a60","fg":"#40a0ff","edge":"#40a0ff","lit":"neon","anim":"none","conf":"photo"},{"id":"cwb_lock_503_pharm","lat":22.280764,"lon":114.183218,"kind":"band","w":7.0,"h":1.4,"y":4.0,"az":178.0,"sides":1,"text":"康寧大藥房","font":"hei","bg":"#1d4fc0","fg":"#ffffff","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"cwb_lock_527_red","lat":22.280764,"lon":114.18413,"kind":"over","w":5.0,"h":2.5,"y":8.5,"az":88.0,"sides":2,"text":"美研坊","sub":"BEAUTE","font":"sans","bg":"#d0103a","fg":"#ffffff","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"cwb_lock_527_poster","lat":22.280798,"lon":114.184198,"kind":"wall","w":6.0,"h":4.0,"y":8.0,"az":178.0,"sides":1,"font":"sans","bg":"#202020","fg":"#ffffff","edge":null,"lit":"flood","anim":"none","conf":"photo"},{"id":"cwb_lock_529_pharm","lat":22.280797,"lon":114.184168,"kind":"box","w":8.0,"h":4.0,"y":7.0,"az":178.0,"sides":1,"text":"康泰","sub":"免稅大藥房","font":"hei","bg":"#1a3ad8","fg":"#ff2020","edge":null,"lit":"led","anim":"none","conf":"photo"},{"id":"cwb_lock_529_jewel","lat":22.2808,"lon":114.184228,"kind":"box","w":6.0,"h":3.5,"y":7.0,"az":178.0,"sides":1,"text":"金星鐘錶珠寶","sub":"GOLDSTAR WATCH & JEWELLERY","font":"serif","bg":"#3a3020","fg":"#f0e0b0","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"cwb_lock_book_blade","lat":22.28077,"lon":114.18428,"kind":"blade","w":1.5,"h":6.0,"y":10.0,"az":88.0,"sides":2,"text":"灣畔書店","vert":1,"font":"song","bg":"#1a2a60","fg":"#ffffff","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"cwb_lock_539_disc","lat":22.280774,"lon":114.18438,"kind":"over","w":2.0,"h":2.0,"y":6.0,"az":88.0,"sides":2,"text":"$98","font":"sans","bg":"#202020","fg":"#ffffff","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"cwb_lock_539_cosm","lat":22.280803,"lon":114.184319,"kind":"band","w":8.0,"h":2.0,"y":4.5,"az":178.0,"sides":1,"text":"雅妍","sub":"BELLAVIE","font":"sans","bg":"#3a1020","fg":"#ffffff","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"cwb_ts_screen","lat":22.27855,"lon":114.18268,"kind":"led","w":9.0,"h":11.0,"y":26.0,"az":70.0,"sides":1,"font":"sans","bg":"#000000","fg":"#ffffff","edge":null,"lit":"led","anim":"screen","conf":"photo"},{"id":"cwb_ts_letters","lat":22.27866,"lon":114.18262,"kind":"letters","w":14.0,"h":2.5,"y":30.0,"az":40.0,"sides":1,"text":"LANTERN COURT","font":"serif","bg":null,"fg":"#e0e0e0","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"cwb_3matheson_led","lat":22.27807,"lon":114.18214,"kind":"led","w":10.0,"h":12.0,"y":14.0,"az":60.0,"sides":1,"font":"sans","bg":"#000000","fg":"#ffffff","edge":null,"lit":"led","anim":"screen","conf":"photo"},{"id":"isl_hsbc_roof","lat":22.280564,"lon":114.159484,"kind":"roof","w":14.0,"h":3.5,"y":181.2,"az":350.0,"sides":1,"text":"宏洋銀行","sub":"HONGYEUNG BANK","font":"sans","bg":"#d0021b","fg":"#ffffff","edge":null,"lit":"box","anim":"none","roof":1,"bld":"w295407347","conf":"photo","bx":4073.2,"by":-6612.5,"bh":178.8},{"id":"isl_stanchart_crown","lat":22.280398,"lon":114.159402,"kind":"box","w":8.0,"h":8.0,"y":166.5,"az":350.0,"sides":1,"text":"澄","font":"hei","bg":"#0a7f4f","fg":"#ffffff","edge":"#2a6fd6","lit":"box","anim":"none","bld":"w295407480","conf":"photo"},{"id":"isl_lippo2_crown","lat":22.279676,"lon":114.163281,"kind":"letters","w":16.0,"h":3.5,"y":178.6,"az":350.0,"sides":1,"text":"KORVA","font":"sans","bg":null,"fg":"#ffffff","edge":null,"lit":"box","anim":"none","bld":"w107336263","conf":"photo","bx":4462.2,"by":-6700.6,"bh":186.0},{"id":"isl_lippo1_crown","lat":22.27939,"lon":114.163653,"kind":"letters","w":12.0,"h":3.0,"y":165.1,"az":350.0,"sides":1,"text":"KORVA","font":"sans","bg":null,"fg":"#ffffff","edge":null,"lit":"box","anim":"none","bld":"w107336260","conf":"photo","bx":4500.3,"by":-6733.0,"bh":172.0},{"id":"isl_wc_teal_tower","lat":22.279593,"lon":114.178864,"kind":"roof","w":14.0,"h":4.0,"y":124.5,"az":355.0,"sides":1,"text":"TAVERO","font":"sans","bg":"#d71920","fg":"#ffffff","edge":null,"lit":"box","anim":"none","roof":1,"bld":"w295779363","conf":"photo"},{"id":"isl_wc_slogan_tower","lat":22.279229,"lon":114.178409,"kind":"roof","w":14.0,"h":4.5,"y":161.8,"az":355.0,"sides":1,"text":"誠信為本","font":"hei","bg":"#d0161e","fg":"#ffffff","edge":null,"lit":"box","anim":"none","roof":1,"bld":"w295779446","conf":"photo"},{"id":"isl_cwb_ts2_roof","lat":22.278196,"lon":114.181881,"kind":"roof","w":16.0,"h":4.0,"y":171.5,"az":350.0,"sides":1,"text":"瀚泰保險","font":"hei","bg":"#1c2f6b","fg":"#ffffff","edge":null,"lit":"box","anim":"none","roof":1,"bld":"w199045544","conf":"photo","bx":6380.4,"by":-6851.1,"bh":169.0},{"id":"isl_cwb_pink_roof","lat":22.280638,"lon":114.180473,"kind":"roof","w":12.0,"h":4.0,"y":96.5,"az":350.0,"sides":1,"text":"MIRELLE","font":"sans","bg":"#e6007e","fg":"#ffffff","edge":null,"lit":"box","anim":"none","roof":1,"bld":"w295102715","conf":"photo","bx":6231.1,"by":-6581.8,"bh":94.0},{"id":"isl_cwb_bank_roof","lat":22.280262,"lon":114.180067,"kind":"roof","w":14.0,"h":4.0,"y":112.5,"az":350.0,"sides":1,"text":"景曦銀行","font":"hei","bg":"#1d3b8f","fg":"#ffffff","edge":null,"lit":"box","anim":"none","roof":1,"bld":"w295102777","conf":"photo","bx":6188.8,"by":-6621.1,"bh":109.5},{"id":"isl_cwb_black_roof","lat":22.280268,"lon":114.17949,"kind":"roof","w":14.0,"h":4.0,"y":121.5,"az":350.0,"sides":1,"text":"億瀚","font":"kai","bg":"#111111","fg":"#ffffff","edge":null,"lit":"box","anim":"none","roof":1,"bld":"w295102707","conf":"photo","bx":6127.4,"by":-6621.2,"bh":118.8},{"id":"kln_k11musea_box","lat":22.293724,"lon":114.17486,"kind":"box","w":14.0,"h":9.0,"y":22.0,"az":180.0,"sides":1,"text":"藝匯","font":"sans","bg":"#0f5c3a","fg":"#e8fff0","edge":null,"lit":"box","anim":"none","bld":"w1381619181","conf":"photo"},{"id":"kln_k11musea_posters","lat":22.293724,"lon":114.17486,"kind":"led","w":16.0,"h":10.0,"y":8.0,"az":180.0,"sides":1,"font":"sans","bg":"#202020","fg":"#ffffff","edge":null,"lit":"led","anim":"screen","bld":"w1381619181","conf":"photo"},{"id":"mk_nathan_jordan_jewel_over","lat":22.304394,"lon":114.171463,"kind":"over","w":16.0,"h":10.0,"y":22.0,"az":0.0,"sides":2,"text":"金滿樓","sub":"珠寶金行","font":"hei","bg":"#140808","fg":"#ffa020","edge":"#8a40ff","lit":"neon","anim":"none","conf":"photo"},{"id":"mk_nathan_jordan_club_over","lat":22.304394,"lon":114.171463,"kind":"over","w":18.0,"h":4.0,"y":15.0,"az":0.0,"sides":2,"text":"金鳳凰夜總會","sub":"Night Club","font":"hei","bg":"#2a1810","fg":"#ff7030","edge":"#ffd23a","lit":"neon","anim":"chase","conf":"photo"},{"id":"mk_nathan_jordan_peking","lat":22.3042,"lon":114.171506,"kind":"over","w":14.0,"h":4.0,"y":10.0,"az":357.0,"sides":2,"text":"燕都酒樓","sub":"PEKING STYLE RESTAURANT","font":"song","bg":"#1a2a80","fg":"#ff3030","edge":"#ffe040","lit":"neon","anim":"none","conf":"photo"},{"id":"mk_nathan_jordan_bank_blade","lat":22.304801,"lon":114.17182,"kind":"blade","w":2.5,"h":12.0,"y":18.0,"az":176.0,"sides":2,"text":"信達銀行","vert":1,"font":"hei","bg":"#1a6a3a","fg":"#ffffff","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"mk_nathan_yuehwa_over","lat":22.304999,"lon":114.171435,"kind":"over","w":22.0,"h":6.0,"y":20.0,"az":356.0,"sides":2,"text":"光速沖印","sub":"1小時快速沖印服務","font":"hei","bg":"#ffffff","fg":"#d0101e","edge":"#10a050","lit":"box","anim":"none","conf":"photo"},{"id":"mk_nathan_yuehwa_letters","lat":22.305303,"lon":114.171438,"kind":"letters","w":26.0,"h":4.0,"y":12.0,"az":86.0,"sides":1,"text":"中原國貨","sub":"CHINESE PRODUCTS","font":"hei","bg":null,"fg":"#ffd23a","edge":null,"lit":"neon","anim":"none","conf":"photo"},{"id":"mk_nathan_mk_bank_blade","lat":22.316473,"lon":114.169987,"kind":"blade","w":3.0,"h":16.0,"y":18.0,"az":172.0,"sides":2,"text":"德昌銀行","sub":"TAK CHEONG BANK","vert":1,"font":"hei","bg":"#d0101e","fg":"#ffffff","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"mk_nathan_mk_cosm_blade","lat":22.316712,"lon":114.169941,"kind":"blade","w":2.5,"h":12.0,"y":16.0,"az":169.0,"sides":2,"text":"雅妍","sub":"BELLAVIE","vert":1,"font":"kai","bg":"#1a1a1a","fg":"#d8b060","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"mk_nathan_mk_stack","lat":22.316963,"lon":114.170096,"kind":"blade","w":3.0,"h":22.0,"y":24.0,"az":169.0,"sides":2,"text":"海景賓館","sub":"HOTEL 8/F","vert":1,"font":"hei","bg":"#1d3a9a","fg":"#ffd23a","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"mk_argyle_led","lat":22.319331,"lon":114.169476,"kind":"led","w":6.0,"h":14.0,"y":18.0,"az":147.0,"sides":1,"font":"sans","bg":"#000000","fg":"#ffffff","edge":null,"lit":"led","anim":"screen","conf":"estimate"},{"id":"mk_argyle_corner_led","lat":22.318835,"lon":114.16955,"kind":"led","w":24.0,"h":4.0,"y":10.0,"az":259.0,"sides":1,"font":"sans","bg":"#001030","fg":"#40a0ff","edge":null,"lit":"led","anim":"screen","conf":"photo"},{"id":"mk_sycs_book_green","lat":22.315627,"lon":114.170798,"kind":"over","w":5.0,"h":2.5,"y":9.0,"az":349.0,"sides":2,"text":"求知書舍","sub":"買賣課本 請上二樓","font":"hei","bg":"#0f7a4a","fg":"#ffffff","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"mk_sycs_phone_blue","lat":22.315723,"lon":114.170777,"kind":"over","w":5.0,"h":2.5,"y":12.0,"az":349.0,"sides":2,"text":"訊聯","sub":"LINKTEL","font":"hei","bg":"#1d4fa8","fg":"#ffffff","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"mk_sycs_orange","lat":22.316406,"lon":114.170683,"kind":"over","w":6.0,"h":6.0,"y":13.0,"az":169.0,"sides":2,"text":"聯泰電器","font":"hei","bg":"#ff7a10","fg":"#ffffff","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"mk_sycs_foot","lat":22.316578,"lon":114.170578,"kind":"over","w":6.0,"h":4.0,"y":12.0,"az":169.0,"sides":2,"text":"舒步","sub":"足部按摩 2/F","font":"kai","bg":"#151515","fg":"#ffe060","edge":"#2060ff","lit":"led","anim":"none","conf":"photo"},{"id":"mk_sycs_fx","lat":22.316971,"lon":114.170495,"kind":"blade","w":2.0,"h":7.0,"y":10.0,"az":169.0,"sides":2,"text":"人民幣找換","sub":"MONEY EXCHANGE","vert":1,"font":"hei","bg":"#e01020","fg":"#ffffff","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"mk_sycs_nail","lat":22.316502,"lon":114.170613,"kind":"over","w":3.5,"h":2.0,"y":7.0,"az":349.0,"sides":2,"text":"Nail","font":"serif","bg":"#ffe040","fg":"#d0207a","edge":"#d0a020","lit":"box","anim":"none","conf":"photo"},{"id":"mk_sycs_icecafe","lat":22.319939,"lon":114.16984,"kind":"over","w":6.0,"h":3.0,"y":7.0,"az":170.0,"sides":2,"text":"金星冰室","font":"song","bg":"#9ad0e0","fg":"#e07010","edge":null,"lit":"off","anim":"none","conf":"photo"},{"id":"mk_tungchoi_karaoke","lat":22.319183,"lon":114.170559,"kind":"over","w":10.0,"h":3.5,"y":12.0,"az":169.0,"sides":2,"text":"紫荊苑","sub":"卡拉OK 夜總會","font":"hei","bg":"#d0101e","fg":"#ffe040","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"mk_fayuen_cosm_over","lat":22.317704,"lon":114.171523,"kind":"over","w":12.0,"h":3.5,"y":11.0,"az":169.0,"sides":2,"text":"嘉妍","sub":"KAYEN","font":"hei","bg":"#9ad0f0","fg":"#e02020","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"mk_portland_sauna","lat":22.315014,"lon":114.169628,"kind":"blade","w":2.5,"h":8.0,"y":12.0,"az":349.0,"sides":2,"text":"金浪桑拿","vert":1,"font":"kai","bg":"#0a0a0a","fg":"#ffc020","edge":"#ffc020","lit":"neon","anim":"chase","conf":"photo"},{"id":"mk_portland_noodle","lat":22.31511,"lon":114.169609,"kind":"blade","w":2.2,"h":7.0,"y":13.0,"az":349.0,"sides":2,"text":"福臨記","sub":"麵家","vert":1,"font":"kai","bg":"#200000","fg":"#ff3020","edge":"#ffffff","lit":"neon","anim":"none","conf":"photo"},{"id":"mk_shantung_rest","lat":22.317447,"lon":114.169719,"kind":"over","w":10.0,"h":3.0,"y":13.0,"az":320.0,"sides":2,"text":"永樂茶餐廳","sub":"家常小菜","font":"hei","bg":"#100808","fg":"#ff3020","edge":"#30e0d0","lit":"neon","anim":"none","conf":"photo"},{"id":"mk_shantung_pawn","lat":22.317447,"lon":114.169719,"kind":"blade","w":2.8,"h":5.0,"y":10.0,"az":320.0,"sides":2,"text":"押","sub":"利興","vert":1,"font":"hei","bg":"#c8101e","fg":"#ffffff","edge":"#30e060","lit":"neon","anim":"none","conf":"photo"},{"id":"mk_reclamation_board","lat":22.319709,"lon":114.167498,"kind":"over","w":12.0,"h":2.5,"y":13.0,"az":349.0,"sides":2,"text":"永固機械防水公司","font":"song","bg":"#ffffff","fg":"#c8101e","edge":null,"lit":"off","anim":"none","conf":"photo"},{"id":"mk_temple_seafood","lat":22.306003,"lon":114.169839,"kind":"over","w":10.0,"h":3.5,"y":12.0,"az":195.0,"sides":2,"text":"泰豐海味","font":"hei","bg":"#3a0808","fg":"#ffffff","edge":"#ff3030","lit":"neon","anim":"none","conf":"photo"},{"id":"mk_temple_bridal","lat":22.306049,"lon":114.169852,"kind":"over","w":9.0,"h":3.5,"y":9.0,"az":195.0,"sides":2,"text":"雅頌婚紗","sub":"Ya Chung Bridal","font":"hei","bg":"#140820","fg":"#ff3040","edge":"#ffd040","lit":"neon","anim":"none","conf":"photo"},{"id":"mk_temple_rainbow","lat":22.305948,"lon":114.169909,"kind":"band","w":8.0,"h":3.0,"y":7.0,"az":285.0,"sides":1,"font":"sans","bg":null,"fg":"#ff40ff","edge":null,"lit":"neon","anim":"seq","conf":"photo"},{"id":"mk_temple_hostel","lat":22.306822,"lon":114.1701,"kind":"over","w":6.0,"h":3.5,"y":8.0,"az":13.0,"sides":2,"text":"海悅賓館","sub":"HOI YUET HOSTEL","font":"hei","bg":"#d0101e","fg":"#ffe040","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"tst_ckm_led","lat":22.296388,"lon":114.172226,"kind":"led","w":40.0,"h":9.0,"y":11.0,"az":86.0,"sides":1,"font":"sans","bg":"#000000","fg":"#ffffff","edge":null,"lit":"led","anim":"screen","conf":"photo"},{"id":"tst_ckm_canopy","lat":22.296388,"lon":114.172226,"kind":"band","w":14.0,"h":2.5,"y":5.0,"az":86.0,"sides":1,"text":"重慶大廈","sub":"CHUNGKING MANSIONS 36-44 NATHAN ROAD","font":"song","bg":"#1f3a30","fg":"#e8c060","edge":null,"lit":"flood","anim":"none","conf":"photo"},{"id":"tst_nathan_guesthouse_1","lat":22.296883,"lon":114.172218,"kind":"over","w":8.0,"h":3.5,"y":16.0,"az":356.0,"sides":2,"text":"星輝賓館","sub":"SING FAI HOTEL","font":"hei","bg":"#d0101e","fg":"#ffffff","edge":"#ffffff","lit":"box","anim":"none","conf":"photo"},{"id":"tst_nathan_guesthouse_2","lat":22.296904,"lon":114.172217,"kind":"over","w":7.0,"h":3.0,"y":12.0,"az":356.0,"sides":2,"text":"明珠賓館","sub":"PEARL GUEST HOUSE","font":"hei","bg":"#30c8c0","fg":"#ffffff","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"tst_nathan_fx_bulbs","lat":22.297079,"lon":114.172138,"kind":"over","w":6.0,"h":4.0,"y":9.0,"az":176.0,"sides":2,"text":"¥$£€ 兌換","sub":"EXCHANGE","font":"hei","bg":"#101010","fg":"#ffd040","edge":"#ffd040","lit":"neon","anim":"chase","conf":"photo"},{"id":"tst_peking_corner_bb","lat":22.29655,"lon":114.17195,"kind":"wall","w":25.0,"h":12.0,"y":16.0,"az":230.0,"sides":1,"font":"sans","bg":"#202020","fg":"#ffffff","edge":null,"lit":"flood","anim":"none","conf":"photo"},{"id":"tst_carnarvon_hs_led","lat":22.298482,"lon":114.172003,"kind":"led","w":16.0,"h":10.0,"y":12.0,"az":87.0,"sides":1,"font":"sans","bg":"#000000","fg":"#ffffff","edge":null,"lit":"led","anim":"screen","conf":"photo"},{"id":"tst_cameron_camera_band","lat":22.298791,"lon":114.1724,"kind":"band","w":16.0,"h":3.0,"y":5.0,"az":178.0,"sides":1,"text":"光學影音","sub":"OPTICAL & VIDEO","font":"sans","bg":"#202020","fg":"#ffffff","edge":"#ff40ff","lit":"led","anim":"chase","conf":"photo"},{"id":"tst_cameron_church","lat":22.298789,"lon":114.17235,"kind":"band","w":14.0,"h":2.5,"y":9.0,"az":178.0,"sides":1,"text":"恩光堂","font":"song","bg":"#8a70c0","fg":"#ffffff","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"tst_carnarvon53_led_1","lat":22.299637,"lon":114.173388,"kind":"led","w":18.0,"h":3.5,"y":9.0,"az":74.0,"sides":1,"font":"sans","bg":"#000000","fg":"#ffd080","edge":null,"lit":"led","anim":"screen","conf":"photo"},{"id":"tst_carnarvon53_led_2","lat":22.299637,"lon":114.173388,"kind":"led","w":18.0,"h":3.5,"y":13.0,"az":74.0,"sides":1,"font":"sans","bg":"#000000","fg":"#ff80c0","edge":null,"lit":"led","anim":"screen","conf":"photo"},{"id":"tst_carnarvon53_roof","lat":22.299637,"lon":114.173388,"kind":"box","w":12.0,"h":3.5,"y":17.5,"az":74.0,"sides":1,"text":"MOREVA","font":"sans","bg":"#ffffff","fg":"#404040","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"tst_kimberley_hotel","lat":22.300299,"lon":114.172051,"kind":"over","w":9.0,"h":3.5,"y":11.0,"az":207.0,"sides":2,"text":"東方旅舍","sub":"EASTERN INN","font":"hei","bg":"#a8c8e8","fg":"#f0b020","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"tst_granville_fx","lat":22.299752,"lon":114.173313,"kind":"box","w":4.0,"h":4.0,"y":8.0,"az":345.0,"sides":1,"text":"¥ $ £","sub":"EXCHANGE","font":"sans","bg":"#101010","fg":"#ff3030","edge":"#2a6fff","lit":"led","anim":"scroll","conf":"photo"},{"id":"tst_lockrd_indonesia","lat":22.296547,"lon":114.171597,"kind":"over","w":10.0,"h":4.5,"y":10.0,"az":176.0,"sides":2,"text":"南洋印尼餐廳","sub":"SPICE ISLAND RESTAURANT","font":"hei","bg":"#102040","fg":"#ff3030","edge":"#ffe040","lit":"neon","anim":"none","conf":"photo"},{"id":"tst_ashley_script","lat":22.297193,"lon":114.170486,"kind":"over","w":6.0,"h":4.0,"y":9.0,"az":353.0,"sides":2,"text":"Lilian's Kitchen","sub":"1ST FLOOR","font":"serif","bg":"#101010","fg":"#ffd040","edge":"#30d0a0","lit":"neon","anim":"none","conf":"photo"},{"id":"tst_peking71_club_1980s","lat":22.29635,"lon":114.171688,"kind":"over","w":8.0,"h":4.5,"y":9.0,"az":84.0,"sides":2,"text":"Club Hikari","sub":"夜總會","font":"sans","bg":"#200818","fg":"#ffffff","edge":"#ffd040","lit":"neon","anim":"chase","conf":"photo"},{"id":"tst_haiphong_lingerie","lat":22.298067,"lon":114.171604,"kind":"band","w":12.0,"h":3.5,"y":13.0,"az":357.0,"sides":1,"text":"彩虹內衣","font":"hei","bg":"#f0f0f0","fg":"#ff6030","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"tst_haiphong_rest","lat":22.298101,"lon":114.171653,"kind":"over","w":7.0,"h":2.5,"y":10.0,"az":87.0,"sides":2,"text":"海燕茶樓","font":"kai","bg":"#2a9a5a","fg":"#e02020","edge":null,"lit":"neon","anim":"none","conf":"photo"},{"id":"tst_lockrd_tailor","lat":22.29643,"lon":114.171653,"kind":"over","w":9.0,"h":2.8,"y":12.0,"az":176.0,"sides":2,"text":"雅士洋服","font":"hei","bg":"#2010a0","fg":"#ff3030","edge":"#c060ff","lit":"led","anim":"none","conf":"photo"},{"id":"wch_lock_bar_script","lat":22.277988,"lon":114.172207,"kind":"wall","w":6.0,"h":2.2,"y":4.5,"az":354.0,"sides":1,"text":"Jungla!","sub":"BAR","font":"serif","bg":null,"fg":"#ff4030","edge":null,"lit":"neon","anim":"none","conf":"photo"},{"id":"wch_lock_bulb_letters","lat":22.277968,"lon":114.172408,"kind":"letters","w":7.0,"h":1.4,"y":4.2,"az":355.0,"sides":1,"text":"LUMINA","font":"sans","bg":"#123020","fg":"#fff0c0","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"wch_lock_bar_1966","lat":22.278089,"lon":114.172496,"kind":"over","w":10.0,"h":3.5,"y":11.0,"az":85.0,"sides":2,"text":"MARINER BAR","font":"sans","bg":"#2050a0","fg":"#ffffff","edge":"#e0c060","lit":"flood","anim":"none","conf":"photo"},{"id":"wch_hen_mahjong","lat":22.277697,"lon":114.172688,"kind":"over","w":12.0,"h":9.0,"y":24.0,"az":83.0,"sides":2,"text":"金龍","sub":"娛樂麻雀","font":"hei","bg":"#0a1030","fg":"#ff5030","edge":"#20e060","lit":"neon","anim":"none","conf":"photo"},{"id":"wch_hen_mahjong_blade","lat":22.277697,"lon":114.172688,"kind":"blade","w":2.5,"h":10.0,"y":13.0,"az":83.0,"sides":2,"text":"金龍麻雀","vert":1,"font":"hei","bg":"#100808","fg":"#ff3030","edge":"#20e060","lit":"neon","anim":"none","conf":"photo"},{"id":"wch_hen_sauna_blade","lat":22.277654,"lon":114.172287,"kind":"blade","w":2.2,"h":9.0,"y":14.0,"az":83.0,"sides":2,"text":"碧浪桑拿","vert":1,"font":"hei","bg":"#101820","fg":"#ffffff","edge":"#30d0e0","lit":"neon","anim":"none","conf":"photo"},{"id":"wch_hen_jewel_corner","lat":22.277468,"lon":114.172466,"kind":"band","w":14.0,"h":3.0,"y":5.0,"az":353.0,"sides":1,"text":"金城珠寶","sub":"KAM SHING JEWELLERY","font":"hei","bg":"#4a3a2a","fg":"#ffffff","edge":null,"lit":"box","anim":"none","conf":"photo"},{"id":"wch_hen_stove_1980s","lat":22.27758,"lon":114.173509,"kind":"wall","w":14.0,"h":8.0,"y":20.0,"az":354.0,"sides":1,"text":"金鼎牌火水爐","sub":"KEROSENE STOVE","font":"hei","bg":"#d0101e","fg":"#ffffff","edge":null,"lit":"flood","anim":"none","conf":"photo"},{"id":"wch_hen_watch_blade","lat":22.277575,"lon":114.174215,"kind":"blade","w":3.0,"h":20.0,"y":20.0,"az":264.0,"sides":2,"text":"德利鐘錶","sub":"TAKLEE","vert":1,"font":"hei","bg":"#0a0a0a","fg":"#ff3020","edge":"#20d060","lit":"neon","anim":"none","conf":"photo"},{"id":"wch_hen_leaf","lat":22.277814,"lon":114.173786,"kind":"over","w":9.0,"h":4.0,"y":9.0,"az":83.0,"sides":2,"text":"翠葉茶樓","font":"kai","bg":null,"fg":"#ff6030","edge":"#20e060","lit":"neon","anim":"none","conf":"photo"},{"id":"isl_shuntak_west_roof","lat":22.28814,"lon":114.151081,"kind":"roof","w":18.0,"h":4.5,"y":159.3,"az":15.0,"sides":1,"text":"瀚麟","sub":"SEALYN","font":"sans","bg":"#c8102e","fg":"#ffffff","edge":null,"lit":"box","anim":"none","lm":"hkvshuntak","conf":"photo"},{"id":"isl_cmt_roof","lat":22.287872,"lon":114.152636,"kind":"roof","w":14.0,"h":4.5,"y":159.3,"az":15.0,"sides":1,"text":"嘉澄行","font":"kai","bg":"#1f4fa0","fg":"#ffffff","edge":null,"lit":"box","anim":"none","lm":"hkvshuntak","conf":"photo"},{"id":"isl_cosco_crown","lat":22.285749,"lon":114.153102,"kind":"letters","w":16.0,"h":3.6,"y":211.6,"az":21.0,"sides":1,"text":"KESTRA","font":"sans","bg":null,"fg":"#ff9a2a","edge":null,"lit":"neon","anim":"none","lm":"hkvcosco","conf":"photo"},{"id":"isl_wingon_parapet","lat":22.286837,"lon":114.153062,"kind":"letters","w":28.0,"h":4.5,"y":104.8,"az":15.0,"sides":1,"text":"朗暉百貨","font":"song","bg":null,"fg":"#f2c14e","edge":null,"lit":"neon","anim":"none","lm":"hkvwingon","conf":"photo"},{"id":"isl_infinitus_roof","lat":22.28658,"lon":114.153768,"kind":"roof","w":18.0,"h":5.0,"y":143.6,"az":32.0,"sides":1,"text":"珀香記","font":"hei","bg":"#b5121b","fg":"#ffffff","edge":null,"lit":"box","anim":"none","lm":"hkvinfinitus","conf":"photo"},{"id":"isl_aia_box","lat":22.281489,"lon":114.161893,"kind":"wall","w":12.0,"h":5.0,"y":152.8,"az":16.0,"sides":1,"text":"ARLEN","font":"sans","bg":"#1b2a6b","fg":"#ffffff","edge":null,"lit":"box","anim":"none","lm":"hkvaia","conf":"photo"},{"id":"isl_ccb_crown","lat":22.281599,"lon":114.161534,"kind":"wall","w":12.0,"h":4.0,"y":130.0,"az":16.0,"sides":1,"text":"ORVIK","font":"sans","bg":"#13306b","fg":"#ffffff","edge":null,"lit":"box","anim":"none","lm":"hkvccb","conf":"photo"},{"id":"isl_boa_parapet","lat":22.280757,"lon":114.163064,"kind":"band","w":30.0,"h":2.5,"y":143.9,"az":16.0,"sides":1,"text":"HALVERN BANK","font":"sans","bg":"#ffffff","fg":"#1a3a8a","edge":null,"lit":"box","anim":"none","lm":"hkvboa","conf":"photo"},{"id":"hkvi_mandarin_letters","lat":22.282135,"lon":114.159474,"kind":"letters","w":22.0,"h":2.4,"y":87.3,"az":16.0,"sides":1,"text":"嘉麟酒店","sub":"KALIN HOTEL","font":"serif","bg":null,"fg":"#f4f1e8","edge":null,"lit":"box","anim":"none","lm":"hkvmandarin","conf":"photo"},{"id":"isl_fefc_roof","lat":22.280117,"lon":114.164049,"kind":"roof","w":14.0,"h":4.0,"y":178.6,"az":39.0,"sides":1,"text":"KELLWAY","font":"sans","bg":"#1f5fbf","fg":"#ffffff","edge":null,"lit":"box","anim":"none","lm":"hkvfefc","conf":"photo"},{"id":"isl_admiralty_roof","lat":22.279245,"lon":114.165443,"kind":"roof","w":18.0,"h":5.0,"y":104.2,"az":304.0,"sides":1,"text":"海港媒體","sub":"HARBOUR MEDIA","font":"sans","bg":"#ffffff","fg":"#1fa64a","edge":null,"lit":"box","anim":"none","lm":"hkvadmctr","conf":"photo"},{"id":"isl_admiralty_podium_bb","lat":22.279593,"lon":114.164627,"kind":"wall","w":12.0,"h":5.0,"y":10.5,"az":304.0,"sides":1,"text":"越嶺新款","sub":"NEW MODEL","font":"sans","bg":"#1c1c1e","fg":"#ffffff","edge":null,"lit":"flood","anim":"none","lm":"hkvadmctr","conf":"photo"},{"id":"isl_harbourcentre_roof","lat":22.281224,"lon":114.175582,"kind":"roof","w":22.0,"h":5.0,"y":149.3,"az":355.0,"sides":1,"text":"朗澄銀行","font":"hei","bg":"#ffffff","fg":"#1c3f94","edge":null,"lit":"box","anim":"none","lm":"hkvharbourctr","conf":"photo"},{"id":"isl_greateagle_roof","lat":22.281173,"lon":114.17487,"kind":"roof","w":22.0,"h":4.5,"y":148.8,"az":355.0,"sides":1,"text":"珀泉佳釀","font":"song","bg":"#ffffff","fg":"#d0161e","edge":null,"lit":"box","anim":"none","lm":"hkvharbourctr","conf":"photo"},{"id":"isl_crb_crown","lat":22.280187,"lon":114.175458,"kind":"letters","w":26.0,"h":5.0,"y":172.0,"az":356.0,"sides":1,"text":"滄嶺六十載","font":"song","bg":null,"fg":"#e0b040","edge":null,"lit":"neon","anim":"none","lm":"hkvcrb","conf":"photo"},{"id":"isl_hcge_podium_ad","lat":22.281286,"lon":114.175491,"kind":"band","w":26.0,"h":4.5,"y":19.4,"az":356.0,"sides":1,"text":"嶺南佳釀","sub":"窖藏","font":"song","bg":"#13285e","fg":"#ffffff","edge":null,"lit":"box","anim":"none","lm":"hkvharbourctr","conf":"photo"},{"id":"isl_hcge_podium_name","lat":22.281246,"lon":114.174934,"kind":"band","w":26.0,"h":4.0,"y":19.3,"az":356.0,"sides":1,"text":"濱海大廈","sub":"WATERSIDE HOUSE","font":"sans","bg":"#ffffff","fg":"#1a2a50","edge":null,"lit":"flood","anim":"none","lm":"hkvharbourctr","conf":"photo"},{"id":"isl_cpot_roof","lat":22.281064,"lon":114.173684,"kind":"roof","w":18.0,"h":4.0,"y":182.2,"az":312.0,"sides":1,"text":"KAIREN","font":"sans","bg":"#111111","fg":"#ffffff","edge":null,"lit":"box","anim":"none","lm":"hkvconvplaza","conf":"photo"},{"id":"isl_convplaza_roof","lat":22.280806,"lon":114.172461,"kind":"roof","w":20.0,"h":5.0,"y":165.6,"az":355.0,"sides":1,"text":"安澄","sub":"ARVEN","font":"sans","bg":"#e0262b","fg":"#ffffff","edge":null,"lit":"box","anim":"none","lm":"hkvconvplaza","conf":"photo"},{"id":"isl_cwb_elizabeth_letters","lat":22.281015,"lon":114.18156,"kind":"letters","w":40.0,"h":6.0,"y":94.0,"az":338.0,"sides":1,"text":"MERIVA","font":"sans","bg":null,"fg":"#1450c8","edge":null,"lit":"box","anim":"none","lm":"hkvelizabeth","conf":"photo"},{"id":"cwb_sino_billboard","lat":22.281537,"lon":114.182417,"kind":"band","w":38.0,"h":9.0,"y":17.7,"az":338.0,"sides":1,"text":"灣景理財","sub":"PLAN AHEAD","font":"hei","bg":"#6e1e2a","fg":"#ffffff","edge":null,"lit":"box","anim":"none","lm":"hkvsino","conf":"photo"},{"id":"cwb_sino_letters","lat":22.281552,"lon":114.182536,"kind":"letters","w":16.0,"h":3.2,"y":28.2,"az":19.0,"sides":1,"text":"AURELON","font":"sans","bg":null,"fg":"#ff5a1e","edge":null,"lit":"neon","anim":"none","lm":"hkvsino","conf":"photo"},{"id":"isl_cwb_cbplaza_roof","lat":22.280314,"lon":114.182758,"kind":"roof","w":16.0,"h":5.0,"y":82.0,"az":338.0,"sides":1,"text":"NEVARO","font":"sans","bg":"#ffffff","fg":"#d7141a","edge":null,"lit":"box","anim":"none","lm":"hkvcbplaza","conf":"photo"},{"id":"isl_np_aia_roof","lat":22.288453,"lon":114.192354,"kind":"letters","w":24.0,"h":5.0,"y":175.0,"az":310.0,"sides":1,"text":"ARLEN ARLEN","font":"sans","bg":"#ffffff","fg":"#d0101e","edge":null,"lit":"box","anim":"none","lm":"hkvaianp","conf":"photo"},{"id":"kln_starhouse_roof","lat":22.294488,"lon":114.169039,"kind":"roof","w":46.0,"h":6.0,"y":59.4,"az":168.0,"sides":1,"text":"HOLWEN","font":"serif","bg":"#ffffff","fg":"#d0101e","edge":null,"lit":"box","anim":"none","lm":"hkvstarhouse","conf":"photo"},{"id":"kln_starhouse_led","lat":22.2946,"lon":114.168575,"kind":"led","w":52.0,"h":26.0,"y":36.0,"az":258.0,"sides":1,"font":"sans","bg":"#200008","fg":"#ff3050","edge":null,"lit":"led","anim":"screen","lm":"hkvstarhouse","conf":"photo"},{"id":"kln_sheraton_roof","lat":22.294937,"lon":114.173069,"kind":"letters","w":40.0,"h":5.0,"y":57.4,"az":176.0,"sides":1,"text":"裕澄銀行","sub":"YUCHENG BANK","font":"hei","bg":null,"fg":"#1d4fa8","edge":null,"lit":"box","anim":"none","lm":"hkvsheraton","conf":"photo"},{"id":"kln_vd_tower_crown","lat":22.294706,"lon":114.175736,"kind":"box","w":8.0,"h":5.0,"y":269.0,"az":176.0,"sides":1,"text":"灣","font":"song","bg":null,"fg":"#ffffff","edge":null,"lit":"box","anim":"none","lm":"hkvdockside","conf":"photo"},{"id":"kln_empire_podium","lat":22.298188,"lon":114.178686,"kind":"band","w":44.0,"h":2.2,"y":8.2,"az":138.0,"sides":1,"text":"海濱中心","sub":"SEAFRONT CENTRE","font":"song","bg":"#3a2a1a","fg":"#e8c060","edge":null,"lit":"box","anim":"none","lm":"hkvempire","conf":"photo"},{"id":"kln_regal_corner","lat":22.298604,"lon":114.178019,"kind":"wall","w":5.0,"h":7.0,"y":45.5,"az":139.0,"sides":1,"text":"雅","sub":"ARDEN","font":"sans","bg":null,"fg":"#d8a530","edge":null,"lit":"box","anim":"none","lm":"hkvregal","conf":"photo"},{"id":"kln_shangrila_roof","lat":22.296889,"lon":114.177202,"kind":"roof","w":30.0,"h":5.0,"y":55.2,"az":138.0,"sides":1,"text":"Shoreline","font":"serif","bg":null,"fg":"#101010","edge":null,"lit":"neon","anim":"none","lm":"hkvshangrila","conf":"photo"},{"id":"kln_icgs_logo","lat":22.299021,"lon":114.17906,"kind":"box","w":4.0,"h":4.0,"y":41.0,"az":228.0,"sides":1,"text":"海","font":"song","bg":null,"fg":"#e0c060","edge":null,"lit":"box","anim":"none","lm":"hkvgrandstanford","conf":"photo"},{"id":"kln_kerry_roof","lat":22.302002,"lon":114.188854,"kind":"letters","w":22.0,"h":3.0,"y":73.2,"az":285.0,"sides":1,"text":"HARBOR HOUSE","font":"sans","bg":null,"fg":"#ffffff","edge":null,"lit":"box","anim":"none","lm":"hkvkerry","conf":"photo"},{"id":"hkv_hc_t6_roof","lat":22.29681,"lon":114.168094,"kind":"roof","w":14.0,"h":6.5,"y":135.5,"az":252.0,"sides":1,"text":"KESTRA","font":"sans","bg":"#c8102e","fg":"#ffffff","edge":null,"lit":"box","anim":"none","lm":"hkvharbourcity","conf":"photo"},{"id":"hkv_ymca_letters","lat":22.294791,"lon":114.170967,"kind":"letters","w":16.0,"h":2.4,"y":57.6,"az":176.0,"sides":1,"text":"WAYFARER HOUSE","font":"sans","bg":null,"fg":"#ffffff","edge":null,"lit":"box","anim":"none","lm":"hkvymca","conf":"photo"}];/*@@END*/

  // ---------------- places ----------------
  // Hong Kong's street-market and shopping districts on the engine's district keys (the same outlines hkreal/patch_hk.py writes):
  // chinatown = Mong Kok, quays = Tsim Sha Tsui, kgglam = Causeway Bay, littleindia = Jordan / Yau Ma Tei, jalanbesar = Sham Shui Po,
  // geylang = Wan Chai, joochiat = Kowloon City, tiongbahru = Sheung Wan, emeraldhill = Lan Kwai Fong / SoHo, balestier = North Point
  const DIST_LL = {
    chinatown:   [[22.3215, 114.1680], [22.3215, 114.1730], [22.3160, 114.1730], [22.3160, 114.1680]],
    quays:       [[22.3010, 114.1690], [22.3010, 114.1740], [22.2950, 114.1740], [22.2950, 114.1690]],
    kgglam:      [[22.2825, 114.1810], [22.2825, 114.1880], [22.2775, 114.1880], [22.2775, 114.1810]],
    littleindia: [[22.3110, 114.1680], [22.3110, 114.1715], [22.3050, 114.1715], [22.3050, 114.1680]],
    jalanbesar:  [[22.3320, 114.1590], [22.3320, 114.1650], [22.3270, 114.1650], [22.3270, 114.1590]],
    geylang:     [[22.2800, 114.1700], [22.2800, 114.1790], [22.2765, 114.1790], [22.2765, 114.1700]],
    joochiat:    [[22.3320, 114.1880], [22.3320, 114.1930], [22.3280, 114.1930], [22.3280, 114.1880]],
    tiongbahru:  [[22.2885, 114.1480], [22.2885, 114.1540], [22.2850, 114.1540], [22.2850, 114.1480]],
    emeraldhill: [[22.2825, 114.1520], [22.2825, 114.1565], [22.2795, 114.1565], [22.2795, 114.1520]],
    balestier:   [[22.2930, 114.1975], [22.2930, 114.2020], [22.2900, 114.2020], [22.2900, 114.1975]]
  };
  // busy hubs (malls get more screens, outlines, billboards): Central, Admiralty, Causeway Bay, Wan Chai, North Point, Quarry Bay, Tsim Sha Tsui,
  // Mong Kok, Yau Ma Tei, Sham Shui Po, Kowloon Tong, Kwun Tong, Diamond Hill, Sha Tin, Tsuen Wan, Tuen Mun, Yuen Long, Tseung Kwan O, Tung Chung, Tai Po, Sheung Shui
  const HUBS_LL = [[22.2820, 114.1580, 320], [22.2790, 114.1650, 240], [22.2800, 114.1840, 300], [22.2775, 114.1730, 240], [22.2910, 114.2000, 220],
    [22.2875, 114.2100, 220], [22.2975, 114.1720, 320], [22.3190, 114.1695, 320], [22.3090, 114.1700, 220], [22.3300, 114.1620, 240], [22.3370, 114.1760, 240],
    [22.3120, 114.2250, 260], [22.3400, 114.2010, 220], [22.3820, 114.1880, 280], [22.3720, 114.1180, 260], [22.3950, 113.9730, 240], [22.4450, 114.0350, 240],
    [22.3080, 114.2600, 240], [22.2890, 113.9420, 220], [22.4450, 114.1700, 200], [22.5010, 114.1280, 200]];
  const MULTI = [[1, 0.2, 0.62], [0.2, 0.85, 1], [0.62, 0.35, 1], [0.3, 1, 0.5], [1, 0.55, 0.12], [1, 0.9, 0.3], [1, 0.25, 0.22], [0.35, 0.55, 1]];
  const RED_GOLD = [[1, 0.16, 0.1], [1, 0.72, 0.22], [1, 0.3, 0.12]];
  const WARM_LANT = [[1, 0.62, 0.2], [1, 0.42, 0.12], [1, 0.8, 0.35], [0.95, 0.3, 0.5]];
  // Hong Kong neon: red, gold, green, pink, cyan, white, orange (the tube colours of the old Kowloon signs)
  const HKNEON = [[1, 0.16, 0.12], [1, 0.16, 0.12], [1, 0.75, 0.2], [0.25, 1, 0.45], [1, 0.3, 0.75], [0.3, 0.9, 1], [1, 0.95, 0.9], [1, 0.5, 0.12]];
  // flavour of the low-rise shop rows per district (legacy decorator; the named neon streets are done by the street profiles below)
  const FLV = {
    chinatown:   {sign:0.9, blade:0.55, neon:0.35, neonC:HKNEON, string:0.05, strC:[1, 0.8, 0.5], glow:[1, 0.9, 0.76], late:[1, 3.5], pool:'hk', bpool:'hk', core:1},
    quays:       {sign:0.8, blade:0.4, neon:0.3, neonC:HKNEON, glow:[1, 0.88, 0.7], late:[1.5, 4], pool:'tst', bpool:'hk', core:1},
    kgglam:      {sign:0.85, blade:0.35, neon:0.15, neonC:MULTI, glow:[1, 0.92, 0.8], late:[1, 3], pool:'hk', bpool:'hk', core:1},
    littleindia: {sign:0.9, blade:0.5, neon:0.35, neonC:HKNEON, string:0.15, strC:[1, 0.78, 0.45], glow:[1, 0.84, 0.6], late:[1, 3.5], pool:'hk', bpool:'hk', core:1},
    jalanbesar:  {sign:0.85, blade:0.45, neon:0.2, neonC:HKNEON, glow:[1, 0.9, 0.75], late:[0.3, 2], pool:'ssp', bpool:'hk', core:1},
    geylang:     {sign:0.85, blade:0.5, neon:0.45, neonC:MULTI, glow:[1, 0.86, 0.66], late:[2, 5], pool:'bar', bpool:'bar', core:1},
    joochiat:    {sign:0.8, blade:0.4, neon:0.2, neonC:HKNEON, glow:[1, 0.86, 0.62], late:[0.4, 2.2], pool:'food', bpool:'hk'},
    tiongbahru:  {sign:0.75, blade:0.35, neon:0.1, neonC:RED_GOLD, glow:[1, 0.82, 0.56], late:[0.2, 1.4], pool:'dry', bpool:'hk', core:1},
    emeraldhill: {sign:0.6, blade:0.25, lantern:0.1, lantC:'warm', neon:0.3, neonC:MULTI, string:0.25, strC:[1, 0.8, 0.5], glow:[1, 0.78, 0.5], late:[2, 5], pool:'bar', bpool:'bar', core:1},
    balestier:   {sign:0.85, blade:0.4, neon:0.15, neonC:HKNEON, glow:[1, 0.88, 0.7], late:[0.3, 2.5], pool:'hk', bpool:'hk', core:1},
    none:        {sign:0.7, blade:0.3, neon:0.06, neonC:HKNEON, glow:[1, 0.92, 0.78], late:[0, 1.6], pool:'hk', bpool:'hk'}
  };
  // board pools: [atlas kind, index]; 6 = the Hong Kong boards of the colour atlas, 7 its blades
  const sgB = a => a.map(i => [6, i]), sgV = a => a.map(i => [7, i]);
  const POOLS = {
    hk:   sgB([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]),
    tst:  sgB([0, 4, 5, 6, 7, 8, 9, 10, 21, 23, 24, 26, 27, 28, 29, 30, 31, 30, 31, 8]),
    ssp:  sgB([10, 21, 22, 23, 0, 1, 3, 13, 15, 17, 20, 22]),
    food: sgB([0, 1, 2, 3, 13, 15, 16, 17, 18, 19, 20, 0, 1]),
    dry:  sgB([13, 14, 15, 13, 14, 3, 0, 1, 26, 16]),
    bar:  sgB([28, 29, 30, 31, 12, 28, 29, 30, 0, 1]),
    mall: sgB([4, 5, 7, 8, 9, 10, 21, 22, 23, 24, 25, 0, 16, 17, 19])
  };
  const BPOOLS = {
    hk:  sgV([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 0, 1, 2, 7]),
    bar: sgV([13, 14, 5, 11, 13, 6])
  };

  // ---------------- the colour atlas (1024²): boards 256×64 (32), blades 64×256 (16), lightbox emblems 256×64 (16) ----------------
  // Generic Hong Kong trades in Traditional Chinese and simple English; no real shop, brand or company names or logos.
  const HK_BOARDS = [
    ['茶餐廳', 'CAFE · 冰室', '#ffd400', '#b71c1c', '#3e2723'], ['燒臘', 'BBQ MEAT', '#b71c1c', '#ffd75a', '#ffffff'], ['酒樓', 'RESTAURANT', '#7a0019', '#ffd75a', '#ffd75a'],
    ['粥麵', 'CONGEE · NOODLES', '#ffffff', '#c8102e', '#222222'], ['金行', 'GOLDSMITH', '#8a0000', '#ffd75a', '#ffd75a'], ['大藥房', 'PHARMACY', '#ffffff', '#1b5e20', '#c62828'],
    ['找換', 'MONEY EXCHANGE', '#ffeb3b', '#0d47a1', '#b71c1c'], ['眼鏡', 'OPTICAL', '#0d47a1', '#ffffff', '#ffeb3b'], ['鐘錶', 'WATCHES', '#101010', '#ffd75a', '#ffffff'],
    ['時裝', 'FASHION', '#ad1457', '#ffffff', '#f8bbd0'], ['電器', 'ELECTRICAL', '#1565c0', '#ffffff', '#ffeb3b'], ['麻雀', 'MAHJONG', '#1b5e20', '#ffffff', '#ff5252'],
    ['卡拉OK', 'KARAOKE', '#311b92', '#ff80ff', '#ffd54f'], ['海味', 'DRIED SEAFOOD', '#e65100', '#ffffff', '#fff3c4'], ['參茸', 'GINSENG', '#4a0d0d', '#ffd75a', '#ffd75a'],
    ['涼茶', 'HERBAL TEA', '#004d40', '#ffe9a8', '#ffe9a8'], ['餅家', 'BAKERY', '#f8bbd0', '#ad1457', '#6d1b00'], ['冰室', 'ICE CAFE', '#00897b', '#ffffff', '#ffeb3b'],
    ['海鮮酒家', 'SEAFOOD', '#004d80', '#ffffff', '#ffd75a'], ['火鍋', 'HOT POT', '#c62828', '#ffffff', '#ffd54f'], ['甜品', 'DESSERT', '#ffffff', '#ad1457', '#2e7d32'],
    ['手機', 'MOBILE PHONES', '#00838f', '#ffffff', '#ffeb3b'], ['電腦', 'COMPUTERS', '#263238', '#4dd0e1', '#ffffff'], ['相機', 'CAMERAS', '#212121', '#ffffff', '#ff5252'],
    ['波鞋', 'SPORTS SHOES', '#ff6f00', '#ffffff', '#212121'], ['化妝品', 'COSMETICS', '#f8bbd0', '#880e4f', '#ffffff'], ['中醫', 'CHINESE MEDICINE', '#3e2723', '#ffcc80', '#ffcc80'],
    ['洋服', 'TAILOR', '#1a237e', '#ffd54f', '#ffffff'], ['', 'COCKTAIL BAR', '#111111', '#4dd0e1', '#ff4081'], ['', 'LIVE MUSIC', '#1a1a1a', '#ff4081', '#ffd54f'],
    ['', 'SPORTS BAR', '#1b5e20', '#ffd54f', '#ffffff'], ['賓館', 'GUEST HOUSE', '#880e4f', '#ffd54f', '#ffffff']];
  const HK_BLADES = [['押', '#7a0019', '#ffd75a'], ['金行', '#8a0000', '#ffd75a'], ['酒樓', '#b71c1c', '#ffffff'], ['藥房', '#ffffff', '#1b5e20'], ['麻雀', '#1b5e20', '#ffffff'],
    ['卡拉OK', '#311b92', '#ff80ff'], ['賓館', '#880e4f', '#ffffff'], ['茶餐廳', '#ffd400', '#b71c1c'], ['找換', '#ffeb3b', '#0d47a1'], ['眼鏡', '#0d47a1', '#ffffff'],
    ['燒臘', '#b71c1c', '#ffd75a'], ['桑拿', '#4a148c', '#ffd54f'], ['中醫', '#3e2723', '#ffcc80'], ['BAR', '#101010', '#00e5ff'], ['PUB', '#1b5e20', '#ffd54f'], ['錶行', '#101010', '#ffd75a']];
  // font stacks (Traditional Chinese first; the headless test browser has Noto Sans / Serif CJK TC)
  const FST = {
    hei: "'PingFang HK','Noto Sans CJK TC','Noto Sans CJK HK','Microsoft JhengHei','Heiti TC',sans-serif",
    song: "'Songti TC','Noto Serif CJK TC','PMingLiU','MingLiU','LiSong Pro',serif",
    kai: "'Kaiti TC','BiauKai','DFKai-SB','STKaiti','Noto Serif CJK TC',serif",
    wei: "'Weibei TC','Wei Bei TC','Noto Serif CJK TC','Songti TC',serif",
    sans: "'Arial Black','Helvetica Neue',Arial,'Noto Sans CJK TC',sans-serif",
    serif: "Georgia,'Times New Roman','Noto Serif CJK TC',serif"};
  const FWT = {hei:900, song:900, kai:700, wei:900, sans:900, serif:700};
  function makeAtlas(){
    const W = 1024, cv = document.createElement('canvas'); cv.width = cv.height = W;
    const g = cv.getContext('2d');
    const SANS = FST.hei, SERIF = FST.song, HEAD = FST.sans;
    const REG = {S:{x:0, y:0, w:256, h:64, c:4, n:32}, B:{x:0, y:512, w:64, h:256, c:16, n:16}, E:{x:0, y:768, w:256, h:64, c:4, n:16}};
    g.fillStyle = '#101010'; g.fillRect(0, 0, W, W);
    const text = (s, x, y, size, col, font, maxW) => { let k = size; g.font = `900 ${k}px ${font}`; while (maxW && g.measureText(s).width > maxW && k > 7){ k *= 0.92; g.font = `900 ${k}px ${font}`; } g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); };
    HK_BOARDS.forEach(([zh, en, bg, fg, ac], i) => {
      const x = (i % 4)*256, y = Math.floor(i/4)*64;
      g.fillStyle = '#0a0a0a'; g.fillRect(x, y, 256, 64); g.fillStyle = bg; g.fillRect(x + 2, y + 2, 252, 60);
      g.strokeStyle = ac; g.lineWidth = 2.5; g.strokeRect(x + 6, y + 6, 244, 52);
      if (zh){ text(zh, x + 128, y + 29, 32, fg, zh.length <= 2 ? SERIF : SANS, 226); text(en, x + 128, y + 52, 11, ac, HEAD, 220); }
      else { text(en, x + 128, y + 30, 25, fg, HEAD, 226); g.fillStyle = ac; for (let k = 0; k < 9; k++){ g.beginPath(); g.arc(x + 88 + k*10, y + 50, 1.8, 0, 7); g.fill(); } }
    });
    HK_BLADES.forEach(([s, bg, fg], i) => {
      const x = REG.B.x + i*64, y = REG.B.y;
      g.fillStyle = '#0a0a0a'; g.fillRect(x, y, 64, 256); g.fillStyle = bg; g.fillRect(x + 2, y + 2, 60, 252);
      g.strokeStyle = fg; g.lineWidth = 2.5; g.strokeRect(x + 6, y + 6, 52, 244);
      const ch = [...s], n = ch.length, cs = Math.min(46, 220/n*0.9), y0 = y + 128 - cs*n*1.05/2;
      ch.forEach((c, k) => text(c, x + 32, y0 + cs*(k + 0.5)*1.05, cs, fg, /[A-Z0-9]/.test(c) ? HEAD : SANS, 50));
    });
    // name plates for towers (0-11: invented company names, text only) and hotels (12-15); no marks or logo shapes
    const EM = ['#00b8d4', '#ffb300', '#e53935', '#7c4dff', '#00c853', '#ffffff', '#2979ff', '#ff4081', '#ffd740', '#1de9b6', '#ff6e40', '#b388ff'];
    const TN = ['海峰', '東昇', '聯港', '遠揚', '瑞海', '泰峰', '寶泓', '明澤', '德瀚', '嘉朗', '新洲', '嶺澄'];
    for (let i = 0; i < 16; i++){
      const x = REG.E.x + (i % 4)*256, y = REG.E.y + Math.floor(i/4)*64, dark = i % 3 !== 1, c = EM[i % 12];
      g.fillStyle = '#0a0a0a'; g.fillRect(x, y, 256, 64); g.fillStyle = dark ? '#121418' : '#f4f4f2'; g.fillRect(x + 2, y + 2, 252, 60);
      if (i < 12){ text(TN[i] + (i % 2 ? '集團' : '大廈'), x + 128, y + 30, 34, c, SANS, 230); g.fillStyle = c; g.fillRect(x + 40, y + 52, 176, 3); }
      else { text('HOTEL', x + 128, y + 25, 26, dark ? '#f5e6c8' : '#5d1a0b', FST.serif, 200); text('酒店', x + 128, y + 50, 16, dark ? '#f5e6c8' : '#5d1a0b', SERIF, 150); }
    }
    const sm = document.createElement('canvas'); sm.width = sm.height = 64; const sg = sm.getContext('2d'); sg.drawImage(cv, 0, 0, 64, 64);
    const D = sg.getImageData(0, 0, 64, 64).data, AVG = {};
    for (const k in REG){ const R = REG[k]; AVG[k] = []; for (let i = 0; i < R.n; i++){ const x0 = (R.x + (i % R.c)*R.w)/16, y0 = (R.y + Math.floor(i/R.c)*R.h)/16; let r = 0, gg = 0, b = 0, n = 0;
      for (let y = Math.floor(y0); y < Math.max(Math.floor(y0) + 1, Math.floor(y0 + R.h/16)); y++) for (let x = Math.floor(x0); x < Math.max(Math.floor(x0) + 1, Math.floor(x0 + R.w/16)); x++){ const o = (y*64 + x)*4; r += D[o]; gg += D[o+1]; b += D[o+2]; n++; }
      AVG[k].push([r/n/255, gg/n/255, b/n/255]); } }
    return {cv, REG, AVG, W};
  }

  // ---------------- the text atlas: masks of invented sign texts, drawn at start-up ----------------
  // R = the letters (fill), G = the neon tubes (the letters' outline), B = their halo (blur). Colours, lighting and animation come
  // from the vertices, so one design serves any colour scheme. Region 1: the street designs (horizontal 280×92, vertical 70×280);
  // region 2: one cell per sign spec (shelf-packed, ~26 px per metre). Height 2048 or 4096 as needed (power of two, mipmapped).
  // Generated names: two auspicious / ordinary characters + a generic trade word. Checked against the well-known Hong Kong chains,
  // banks and famous named shops (none of them, no one-character variants); English only generic words.
  const DES = [];        // {t, s, f, g, v, emb}
  const D_ = (g, f, v, list) => { for (const it of list){ const [t, s] = Array.isArray(it) ? it : [it, '']; DES.push({t, s, f, g, v, emb:0}); } };
  // horizontal designs
  D_('pawn', 'hei', 0, [['永昇大押', 'PAWN'], ['德昌押', ''], ['富記大押', 'PAWN SHOP'], ['利源押', ''], ['興隆大押', 'PAWN']]);
  D_('rest', 'song', 0, [['鴻運酒樓', 'RESTAURANT'], ['金滿大酒樓', ''], ['海景酒家', 'SEAFOOD'], ['祥福酒家', ''], ['雅聚茶樓', 'DIM SUM'], ['盛宴海鮮酒家', '']]);
  D_('cafe', 'hei', 0, [['好運茶餐廳', ''], ['新寶冰室', 'CAFE'], ['泰來茶餐廳', ''], ['永香茶餐廳', 'HK CAFE'], ['萬年冰室', '']]);
  D_('bbq', 'hei', 0, [['祥記燒臘', 'BBQ'], ['福源燒臘飯店', ''], ['瑞昌粥麵', 'CONGEE'], ['旺記雲吞麵', '']]);
  D_('gold', 'song', 0, [['富泰金行', 'GOLDSMITH'], ['億昌珠寶金行', ''], ['萬隆金行', 'JEWELLERY'], ['寶利珠寶', '']]);
  D_('pharm', 'hei', 0, [['寶源大藥房', 'PHARMACY'], ['仁德藥房', ''], ['安康大藥房', 'DRUG STORE'], ['利民參茸藥行', '']]);
  D_('opt', 'hei', 0, [['嘉裕眼鏡', 'OPTICAL'], ['明亮眼鏡', ''], ['視界眼鏡公司', 'OPTICAL']]);
  D_('watch', 'song', 0, [['萬昌鐘錶', 'WATCHES'], ['永嘉錶行', ''], ['天時鐘錶', 'WATCH CO.']]);
  D_('fash', 'hei', 0, [['雅麗時裝', 'FASHION'], ['美姿時裝', ''], ['新潮皮鞋', 'SHOES']]);
  D_('elec', 'hei', 0, [['億豐電器', 'ELECTRICAL'], ['聯興電器行', ''], ['遠揚電腦', 'COMPUTERS'], ['飛訊手機', 'MOBILE']]);
  D_('mj', 'song', 0, [['好運麻雀館', 'MAHJONG'], ['長勝麻雀耍樂', '']]);
  D_('ktv', 'hei', 0, [['星滿卡拉OK', 'KARAOKE'], ['金曲卡拉OK', ''], ['天池桑拿', 'SAUNA']]);
  D_('fx', 'hei', 0, [['德利找換', 'MONEY EXCHANGE'], ['永通找換', '']]);
  D_('hotel', 'song', 0, [['海灣賓館', 'GUEST HOUSE'], ['旅人賓館', ''], ['金港酒店', 'HOTEL']]);
  D_('dry', 'song', 0, [['錦泰海味', 'DRIED SEAFOOD'], ['廣源餅家', 'BAKERY'], ['聯興涼茶', ''], ['茗香茶莊', 'TEA']]);
  D_('bar', 'sans', 0, ['MOON BAR', 'NEON LOUNGE', 'BAR 28', 'SPORTS BAR', ['LIVE MUSIC', '現場音樂'], 'KARAOKE']);
  D_('tst', 'sans', 0, [['HARBOUR TAILOR', '洋服'], ['LUCKY CURRY HOUSE', ''], ['PEARL GUEST HOUSE', '賓館'], ['CAMERA CENTRE', '相機'], ['WATCH CO.', '鐘錶']]);
  D_('corp', 'hei', 0, [['遠揚電器', 'ELECTRIC'], ['聯港保險', 'INSURANCE'], ['星曜鐘錶', 'WATCHES'], ['海峰集團', ''], ['金港酒店', 'HOTEL'], ['海天酒樓', ''], ['東昇船務', 'SHIPPING']]);
  const NH = DES.length;
  // vertical designs
  D_('pawn', 'song', 1, ['大押', '永昇押', '富記大押']);
  D_('rest', 'song', 1, ['酒樓', '鴻運酒樓', '海景酒家', '茶樓']);
  D_('cafe', 'hei', 1, ['茶餐廳', '冰室', '好運茶餐廳']);
  D_('bbq', 'hei', 1, ['燒臘', '粥麵', '祥記燒臘']);
  D_('gold', 'song', 1, ['金行', '珠寶金行', '富泰金行']);
  D_('pharm', 'hei', 1, ['大藥房', '寶源藥房', '參茸']);
  D_('opt', 'hei', 1, ['眼鏡', '嘉裕眼鏡']);
  D_('watch', 'song', 1, ['鐘錶', '萬昌錶行']);
  D_('fash', 'hei', 1, ['時裝', '雅麗時裝']);
  D_('elec', 'hei', 1, ['電器', '億豐電器', '手機']);
  D_('mj', 'song', 1, ['麻雀', '好運麻雀']);
  D_('ktv', 'hei', 1, ['卡拉OK', '桑拿', '星滿卡拉OK']);
  D_('fx', 'hei', 1, ['找換', '德利找換']);
  D_('hotel', 'song', 1, ['賓館', '酒店', '海灣賓館']);
  D_('dry', 'song', 1, ['海味', '涼茶', '中醫', '跌打']);
  D_('bar', 'sans', 1, ['BAR', 'PUB', 'CLUB']);
  DES.push({t:'押', s:'', f:'song', g:'pawn', v:1, emb:1}, {t:'押', s:'', f:'hei', g:'pawn', v:1, emb:1});    // the pawnbroker's bat-and-coin sign over 押
  const DESG = {};       // group -> {h:[design indices], v:[...]}
  DES.forEach((d, i) => { const G = DESG[d.g] || (DESG[d.g] = {h:[], v:[]}); (d.v ? G.v : G.h).push(i); });
  // colour schemes per trade: [background, letters, edge / sub]
  const SCH = {
    pawn: [['#1a0c08', '#ff3324', '#ffd23a'], ['#2a0000', '#ffd23a', '#ff3324'], ['#ffffff', '#c01010', '#c01010']],
    rest: [['#b30d0d', '#ffe066', '#ffffff'], ['#120808', '#ff3b30', '#ffd23a'], ['#ffffff', '#d01010', '#1565c0'], ['#7a0019', '#ffd75a', '#ffd75a'], ['#0a0a0a', '#ffd23a', '#ff3b30']],
    cafe: [['#ffd400', '#c01010', '#3e2723'], ['#0b6b3a', '#ffffff', '#ffd400'], ['#101010', '#38ff6a', '#ff3b30'], ['#ffffff', '#0b6b3a', '#d01010']],
    bbq:  [['#b30d0d', '#ffffff', '#ffd23a'], ['#ffffff', '#c01010', '#202020'], ['#101010', '#ff8a2a', '#ffd23a']],
    gold: [['#8a0000', '#ffd75a', '#ffd75a'], ['#101010', '#ffd23a', '#ff3324'], ['#c01010', '#ffe066', '#ffffff']],
    pharm: [['#ffffff', '#0f7a3a', '#d01010'], ['#0f5a2a', '#ffffff', '#ffd400'], ['#101010', '#38ff6a', '#ffffff']],
    opt:  [['#ffffff', '#1446a0', '#e53935'], ['#0d2a6a', '#7fd8ff', '#ffffff'], ['#101010', '#4dc3ff', '#ffffff']],
    watch: [['#101010', '#ffd75a', '#ffffff'], ['#ffffff', '#101010', '#d01010'], ['#0d2a6a', '#ffffff', '#ffd23a']],
    fash: [['#ad1457', '#ffffff', '#f8bbd0'], ['#101010', '#ff5fd2', '#7fd8ff'], ['#ffffff', '#ad1457', '#101010']],
    elec: [['#1565c0', '#ffffff', '#ffeb3b'], ['#0a0a0a', '#4dd0ff', '#ffffff'], ['#d01010', '#ffffff', '#ffeb3b']],
    mj:   [['#0b5a2a', '#ffffff', '#ff3b30'], ['#101010', '#3dff7a', '#ff3b30'], ['#b30d0d', '#ffffff', '#3dff7a']],
    ktv:  [['#1a0a30', '#ff5fd2', '#7fd8ff'], ['#311b92', '#ffd54f', '#ff80ff'], ['#0a0a0a', '#b388ff', '#ff4081']],
    fx:   [['#ffeb3b', '#0d47a1', '#b71c1c'], ['#101010', '#ffd23a', '#38ff6a'], ['#0d47a1', '#ffffff', '#ffeb3b']],
    hotel: [['#880e4f', '#ffd54f', '#ffffff'], ['#101010', '#ff8a3a', '#ffd23a'], ['#ffffff', '#880e4f', '#101010']],
    dry:  [['#e65100', '#ffffff', '#fff3c4'], ['#4a0d0d', '#ffd75a', '#ffd75a'], ['#004d40', '#ffe9a8', '#ffe9a8']],
    bar:  [['#0a0a0a', '#00e5ff', '#ff4081'], ['#0a0a0a', '#ff4081', '#ffd54f'], ['#101030', '#b388ff', '#00e5ff'], ['#0a0a0a', '#ff3b30', '#ffffff']],
    tst:  [['#101010', '#ffffff', '#ff3b30'], ['#0d2a6a', '#ffffff', '#ffd23a'], ['#b30d0d', '#ffffff', '#ffd23a'], ['#ffffff', '#101010', '#d01010']],
    corp: [['#c8102e', '#ffffff', '#ffffff'], ['#0d2a6a', '#ffffff', '#ffffff'], ['#ffffff', '#c8102e', '#c8102e'], ['#101010', '#ffffff', '#ffffff'], ['#1565c0', '#ffffff', '#ffffff'], ['#101010', '#ff7a1a', '#ff7a1a'], ['#ffffff', '#0d2a6a', '#0d2a6a']]
  };
  const hex3 = s => s ? [parseInt(s.slice(1, 3), 16)/255, parseInt(s.slice(3, 5), 16)/255, parseInt(s.slice(5, 7), 16)/255] : null;
  const SCHC = {}; for (const k in SCH) SCHC[k] = SCH[k].map(a => a.map(hex3));
  // street profiles. Densities and sizes per street from photos of the streets (see hkv/hksigns notes in the report):
  //   col: mean spacing of over-street sign stacks along a frontage (m); stack: signs per stack; out: how far a horizontal board
  //   reaches out over the street (m, also capped by the street's half width); hH: board heights; vert: share of tall vertical
  //   boards; y0: first board's bottom above the pavement; yMax: highest board top; band: fascia boards over the shop fronts;
  //   blade: flat vertical blades at the party walls; wbox: lightboxes on the upper floors; led: LED screens; neon: share of neon
  //   (else lightbox); anim: share of animated signs; G: trade mix; glow: shop-front light; late: switch-off window (h after 22:00)
  const GMIX = (o) => { const a = []; for (const k in o) for (let i = 0; i < o[k]; i++) a.push(k); return a; };
  const G_KLN = GMIX({rest:4, cafe:3, bbq:2, pawn:2, gold:3, pharm:3, opt:3, watch:3, fash:2, elec:2, mj:1, ktv:2, fx:2, hotel:1, dry:1});
  const G_TST = GMIX({tst:4, gold:3, watch:3, opt:2, pharm:2, rest:2, fx:3, hotel:2, elec:2, fash:2, bar:1, cafe:1});
  const G_CWB = GMIX({fash:4, opt:3, watch:3, gold:3, pharm:3, elec:3, cafe:2, rest:2, fx:1, bbq:1});
  const G_WCH = GMIX({bar:6, ktv:2, rest:2, cafe:2, hotel:2, pawn:1, mj:1, bbq:1});
  const G_TMP = GMIX({rest:2, cafe:3, bbq:3, dry:3, mj:2, hotel:2, pawn:1, ktv:1, pharm:1});
  const G_OLD = GMIX({cafe:3, bbq:3, dry:3, pharm:2, pawn:2, gold:1, rest:2, mj:1, elec:1});
  const SP = [null,
    {k:'nathan_mk', col:6.0, stack:[2, 6], out:[3.5, 11], hH:[1.6, 3.4], vert:0.3, y0:[5.6, 7.6], yMax:36, band:0.95, blade:0.3, wbox:0.25, led:0.1, neon:0.62, anim:0.2, G:G_KLN, glow:[1, 0.92, 0.8], late:[2, 4.5]},
    {k:'nathan_ymt', col:6.5, stack:[2, 5], out:[3.5, 10], hH:[1.6, 3.2], vert:0.32, y0:[5.6, 7.6], yMax:34, band:0.95, blade:0.3, wbox:0.2, led:0.06, neon:0.65, anim:0.2, G:G_KLN, glow:[1, 0.9, 0.76], late:[1.5, 4]},
    {k:'nathan_tst', bill:0.15, col:8.0, stack:[1, 4], out:[3, 8], hH:[1.6, 3.0], vert:0.25, y0:[6, 8], yMax:32, band:0.9, blade:0.25, wbox:0.35, led:0.18, neon:0.45, anim:0.15, G:G_TST, glow:[1, 0.94, 0.86], late:[2, 4.5]},
    {k:'sycs', col:5.0, stack:[2, 5], out:[2, 5.5], hH:[1.4, 2.8], vert:0.35, vH:[3, 7], y0:[4.6, 6.2], yMax:20, band:0.95, blade:0.35, wbox:0.45, led:0.22, neon:0.35, anim:0.15, G:G_KLN, glow:[1, 0.95, 0.88], late:[2, 4.5]},
    {k:'fayuen', vH:[2.8, 6.5], col:6.5, stack:[1, 4], out:[2, 4.5], hH:[1.3, 2.6], vert:0.35, y0:[4.6, 6], yMax:24, band:0.9, blade:0.35, wbox:0.25, led:0.05, neon:0.45, anim:0.1, G:G_KLN, glow:[1, 0.9, 0.74], late:[0.5, 3]},
    {k:'shantung', vH:[2.6, 6], col:7.5, stack:[1, 3], out:[2.5, 6], hH:[1.4, 2.6], vert:0.4, y0:[5, 9], yMax:22, band:0.9, blade:0.4, wbox:0.15, led:0.04, neon:0.5, anim:0.1, G:G_OLD, glow:[1, 0.84, 0.6], late:[0.5, 3]},
    {k:'argyle', col:8.0, stack:[1, 4], out:[3, 7], hH:[1.5, 3.0], vert:0.3, y0:[5.6, 7.4], yMax:30, band:0.9, blade:0.3, wbox:0.25, led:0.08, neon:0.55, anim:0.15, G:G_KLN, glow:[1, 0.9, 0.78], late:[1, 4]},
    {k:'portland', col:6.5, stack:[1, 5], out:[2.5, 6], hH:[1.4, 3.0], vert:0.4, y0:[5, 7], yMax:30, band:0.85, blade:0.4, wbox:0.2, led:0.04, neon:0.75, anim:0.3, G:GMIX({ktv:4, hotel:3, mj:3, rest:2, cafe:2, bar:1, pawn:1}), glow:[1, 0.82, 0.66], late:[3, 6]},
    {k:'temple', vH:[2.2, 4.5], col:9.0, stack:[1, 2], out:[2, 5], hH:[1.2, 2.2], vert:0.3, y0:[5.5, 8], yMax:14, band:0.8, blade:0.4, wbox:0.1, led:0, neon:0.5, anim:0.08, G:G_TMP, glow:[1, 0.78, 0.5], late:[1.5, 3], market:1},
    {k:'jordan', col:8.0, stack:[1, 4], out:[3, 7], hH:[1.5, 3.0], vert:0.3, y0:[5.6, 7.4], yMax:30, band:0.9, blade:0.3, wbox:0.25, led:0.06, neon:0.55, anim:0.15, G:G_KLN, glow:[1, 0.9, 0.78], late:[1, 4]},
    {k:'shanghai', vH:[2.6, 5.5], col:9.0, stack:[1, 3], out:[2, 4.5], hH:[1.3, 2.4], vert:0.45, y0:[4.4, 5.8], yMax:22, band:0.85, blade:0.4, wbox:0.1, led:0, neon:0.45, anim:0.06, G:G_OLD, glow:[1, 0.82, 0.58], late:[0.3, 2.5]},
    {k:'tst_main', col:7.0, stack:[2, 5], out:[2.5, 6.5], hH:[1.4, 2.8], vert:0.3, y0:[5.4, 7], yMax:30, band:0.9, blade:0.35, wbox:0.35, led:0.15, neon:0.5, anim:0.15, G:G_TST, glow:[1, 0.94, 0.86], late:[2, 4.5]},
    {k:'tst_side', col:9.5, stack:[1, 3], out:[2, 4.5], hH:[1.3, 2.4], vert:0.3, y0:[5, 6.6], yMax:24, band:0.85, blade:0.35, wbox:0.25, led:0.06, neon:0.45, anim:0.12, G:G_TST, glow:[1, 0.92, 0.82], late:[2, 4.5]},
    {k:'cwb_main', ang:0.2, bill:0.6, billY:[4.4, 6.5], col:15.0, stack:[1, 2], out:[2, 5], hH:[1.4, 2.6], vert:0.45, vH:[3, 7], y0:[5.2, 6.8], yMax:20, band:0.95, blade:0.25, wbox:0.55, led:0.55, neon:0.15, anim:0.06, G:G_CWB, glow:[1, 0.96, 0.9], late:[2, 4.5]},
    {k:'cwb_side', ang:0.35, col:7.5, stack:[1, 3], out:[1.3, 3.8], hH:[1.1, 2.2], vert:0.4, vH:[2.4, 5], y0:[4.4, 5.6], yMax:15, band:0.95, blade:0.4, wbox:0.35, wboxMax:15, led:0.06, neon:0.25, anim:0.08, G:G_CWB, glow:[1, 0.95, 0.88], late:[2, 4.5]},
    {k:'wch_main', bill:0.2, col:9.5, stack:[1, 3], out:[2.5, 6], hH:[1.4, 2.8], vert:0.3, y0:[5.6, 7.4], yMax:28, band:0.9, blade:0.3, wbox:0.4, led:0.15, neon:0.4, anim:0.15, G:G_KLN, glow:[1, 0.92, 0.82], late:[2, 4.5]},
    {k:'wch_bar', vH:[2.4, 5], col:7.0, stack:[1, 3], out:[2, 4.5], hH:[1.2, 2.4], vert:0.35, y0:[4.2, 5.6], yMax:20, band:0.9, blade:0.45, wbox:0.25, led:0.06, neon:0.85, anim:0.25, G:G_WCH, glow:[1, 0.78, 0.62], late:[3.5, 6]},
    {k:'kln_side', vH:[2.6, 6], col:10.0, stack:[1, 3], out:[1.8, 4], hH:[1.2, 2.4], vert:0.4, y0:[4.4, 5.8], yMax:22, band:0.85, blade:0.35, wbox:0.15, led:0.03, neon:0.45, anim:0.08, G:G_OLD, glow:[1, 0.86, 0.66], late:[0.5, 3]},
    {k:'isl_side', vH:[2.4, 5], col:12.0, stack:[1, 2], out:[1.8, 3.6], hH:[1.2, 2.2], vert:0.4, y0:[4.4, 5.8], yMax:20, band:0.8, blade:0.3, wbox:0.15, led:0.04, neon:0.35, anim:0.06, G:G_OLD, glow:[1, 0.88, 0.7], late:[0.3, 2.5]}
  ];
  const SPK = {}; SP.forEach((p, i) => { if (p) SPK[p.k] = i; });
  // which profile a named road gets (English OSM name, position)
  const S_TST = new Set(['Peking Road', 'Granville Road', 'Carnarvon Road']);
  const S_TSTS = new Set(['Hankow Road', 'Kimberley Road', 'Cameron Road', 'Lock Road', 'Hart Avenue', 'Prat Avenue', 'Humphreys Avenue', 'Ashley Road', 'Mody Road', 'Haiphong Road', 'Hanoi Road', 'Kimberley Street', 'Knutsford Terrace', 'Austin Avenue', 'Chatham Road South']);
  const S_CWB = new Set(['Paterson Street', 'East Point Road', 'Great George Street', 'Kai Chiu Road', 'Pak Sha Road', 'Matheson Street', 'Percival Street', 'Sugar Street', 'Lee Garden Road', 'Cannon Street', 'Kingston Street', 'Russell Street', 'Pennington Street', 'Leighton Road', 'Irving Street', 'Kai Chiu Road', 'Sharp Street East', 'Tang Lung Street', 'Yiu Wa Street', 'Haven Street', 'Lan Fong Road', 'Yun Ping Road', 'Hysan Avenue', 'Kingston Street']);
  const S_WCHB = new Set(['Luard Road', 'Fenwick Street', 'Marsh Road', 'Tonnochy Road', 'Stewart Road', 'Fleming Road', 'Cannal Road West', 'Lockhart Road West']);
  const S_KLN = new Set(['Dundas Street', 'Pitt Street', 'Soy Street', 'Nelson Street', 'Mong Kok Road', 'Bute Street', 'Tung Choi Street', 'Sai Yeung Choi Street North', 'Kwong Wa Street', 'Reclamation Street', 'Saigon Street',
    'Pak Hoi Street', 'Kansu Street', 'Ning Po Street', 'Woosung Street', 'Parkes Street', 'Battery Street', 'Public Square Street', 'Waterloo Road', 'Hamilton Street', 'Man Ming Lane', 'Yim Po Fong Street', 'Fife Street', 'Hak Po Street',
    'Thistle Street', 'Hi Lung Lane', 'Bedford Road', 'Tai Kok Tsui Road', 'Ivy Street', 'Apliu Street', 'Ki Lung Street', 'Fuk Wing Street', 'Kweilin Street', 'Pei Ho Street', 'Yu Chau Street', 'Nam Cheong Street', 'Tai Nan Street', 'Cheung Sha Wan Road', 'Lai Chi Kok Road', 'Fuk Wa Street', 'Kiu Kiang Street', 'Kim Shin Lane', 'Wong Chuk Street']);
  const S_ISL = new Set(['Johnston Road', "Queen's Road East", 'Wan Chai Road', 'Tai Yuen Street', 'Cross Street', 'Spring Garden Lane', 'Chun Yeung Street', 'Java Road', 'Electric Road', 'Shu Kuk Street', 'Tsat Tsz Mui Road', 'Marble Road', 'Kam Ping Street', 'Des Voeux Road West', 'Queen\'s Road West', 'Wing Lok Street', 'Bonham Strand', 'Jervois Street', 'Wellington Street', 'Stanley Street', 'Cochrane Street', 'Gage Street', 'Graham Street', 'Lyndhurst Terrace']);
  function profFor(en, lat, lon){
    if (!en) return 0;
    if (en === 'Nathan Road') return lat > 22.3115 ? SPK.nathan_mk : lat > 22.3016 ? SPK.nathan_ymt : lat > 22.2944 ? SPK.nathan_tst : 0;
    if (en === 'Sai Yeung Choi Street South') return SPK.sycs;
    if (en === 'Fa Yuen Street') return lat < 22.3265 ? SPK.fayuen : SPK.kln_side;
    if (en === 'Shantung Street') return SPK.shantung;
    if (en === 'Argyle Street') return lon > 114.162 && lon < 114.176 ? SPK.argyle : 0;
    if (en === 'Portland Street') return SPK.portland;
    if (en === 'Temple Street') return SPK.temple;
    if (en === 'Jordan Road') return lon < 114.176 ? SPK.jordan : 0;
    if (en === 'Shanghai Street') return SPK.shanghai;
    if (S_TST.has(en)) return SPK.tst_main;
    if (S_TSTS.has(en)) return lat < 22.3035 ? SPK.tst_side : 0;
    if (en === 'Hennessy Road') return lon > 114.1772 ? SPK.cwb_main : lon > 114.168 ? SPK.wch_main : 0;
    if (en === 'Yee Wo Street') return SPK.cwb_main;
    if (en === 'Lockhart Road' || en === 'Jaffe Road') return lon > 114.1795 ? SPK.cwb_side : lon > 114.1765 ? SPK.wch_main : lon > 114.169 ? SPK.wch_bar : 0;
    if (S_CWB.has(en)) return lon > 114.177 && lon < 114.195 ? SPK.cwb_side : 0;
    if (S_WCHB.has(en)) return lon > 114.168 && lon < 114.180 ? SPK.wch_bar : 0;
    if (en === "King's Road") return lon > 114.188 && lon < 114.215 ? SPK.isl_side : 0;
    if (S_KLN.has(en)) return lat > 22.296 && lat < 22.342 && lon > 114.150 && lon < 114.180 ? SPK.kln_side : 0;
    if (S_ISL.has(en)) return lat > 22.276 && lat < 22.297 && lon > 114.140 && lon < 114.215 ? SPK.isl_side : 0;
    return 0;
  }
  // named pedestrianised streets (the Temple Street market, Cochrane St ...): the app's road data drops the names of footways
  // (class 12), so their centrelines (world metres, from hkreal/out/roads.pkl) are carried here with their names
  const HK_PATHS = [["Graham Street",[3405.8,-6360.7,3555.3,-6204.2]],["East Point Road",[6668.7,-6564.5,6654.2,-6529.2]],["East Point Road",[6648.5,-6515.1,6642.2,-6503.9]],["Russell Street",[6496.2,-6751.0,6542.8,-6732.8]],["Chun Yeung Street",[7892.7,-5434.9,7895.7,-5426.7,7906.2,-5419.3,8090.1,-5378.1,8100.5,-5372.8]],["Marble Road",[8125.6,-5364.1,8256.0,-5334.7]],["Cochrane Street",[3550.4,-6300.3,3494.8,-6360.5]],["Nelson Street",[5100.1,-2397.1,5043.3,-2407.9]],["Nelson Street",[5162.3,-2383.4,5118.5,-2393.2]],["Stanley Street",[3535.0,-6224.9,3573.9,-6273.5]],["Knutsford Terrace",[5466.8,-4318.3,5518.1,-4308.7,5617.2,-4286.2]],["Tung Choi Street",[5204.9,-2271.0,5288.4,-2707.1]],["Pei Ho Street",[4361.2,-1115.8,4369.3,-1098.7,4396.5,-1066.3]],["Pei Ho Street",[4449.5,-1009.7,4437.1,-1015.0,4420.4,-1035.6,4415.4,-1045.6,4405.2,-1058.2]],["Kweilin Street",[4272.1,-1040.4,4284.3,-1022.3,4286.3,-1015.1,4306.4,-991.2]],["Kweilin Street",[4314.4,-981.5,4348.6,-940.5,4357.3,-937.6,4363.2,-930.6]],["Tai Yuen Street",[5493.7,-7186.5,5477.5,-7028.7]],["Cross Street",[5488.9,-7134.7,5570.2,-7125.7,5574.3,-7127.0]],["Spring Garden Lane",[5366.0,-7268.8,5367.1,-7270.8,5342.7,-7326.9,5343.5,-7331.6,5353.7,-7351.1,5363.0,-7348.8,5364.1,-7351.1]],["Soy Street",[5110.8,-2597.0,5112.9,-2607.0,5130.8,-2602.2]],["Soy Street",[5178.5,-2593.1,5158.9,-2596.9]],["Soy Street",[5119.3,-2593.5,5128.7,-2591.6]],["Soy Street",[5157.1,-2588.2,5176.8,-2584.3]],["Fife Street",[4930.8,-2212.1,4891.3,-2219.5]],["Fife Street",[4891.3,-2219.5,4842.8,-2228.9]],["Fife Street",[5052.5,-2190.5,5048.5,-2193.8,5013.5,-2200.6,5009.6,-2196.5,4999.3,-2198.5]],["Fife Street",[4884.6,-2226.2,4850.2,-2232.8]],["Fife Street",[5051.5,-2184.3,5002.5,-2194.2]],["Nelson Street",[4857.4,-2448.0,4933.1,-2433.3]],["Pak Hoi Street",[5142.3,-3541.0,5057.9,-3520.5]],["Temple Street",[5205.0,-3479.3,5139.2,-3755.2,5119.2,-3831.8]],["Ki Lung Street",[4544.3,-1418.4,4468.0,-1355.6]],["Kweilin Street",[4272.1,-1040.4,4234.6,-1084.9]],["Pei Ho Street",[4324.0,-1159.3,4361.2,-1115.8]],["Kim Shin Lane",[3326.0,-33.7,3432.9,-122.6]],["Cochrane Street",[3494.0,-6371.6,3489.8,-6414.8]],["Cochrane Street",[3492.4,-6349.5,3543.7,-6294.6]],["Paterson Street",[6763.5,-6592.4,6782.8,-6649.8,6780.1,-6660.9]],["Reclamation Street",[5049.9,-3733.7,5064.8,-3669.3,5084.2,-3599.7,5114.7,-3457.5]],["Apliu Street",[4183.7,-968.1,4361.2,-1115.8,4442.9,-1181.6,4452.6,-1185.3]],["Waterloo Road",[5986.5,-2066.4,5989.2,-2067.9,6013.8,-2104.7]],["Waterloo Road",[6034.7,-2096.2,6014.9,-2065.1,6012.3,-2059.8,6012.5,-2053.7]],["Cochrane Street",[3486.4,-6391.9,3489.3,-6363.8]],["Cochrane Street",[3489.8,-6414.8,3489.4,-6417.0]],["Cochrane Street",[3494.3,-6369.3,3494.0,-6371.6]],["Cross Street",[5491.5,-7129.8,5528.2,-7126.5]],["Cross Street",[5492.6,-7139.2,5566.7,-7132.8]],["Cross Street",[5533.4,-7125.9,5570.8,-7122.0]],["Tai Yuen Street",[5484.1,-7130.8,5474.8,-7033.6]],["Tai Yuen Street",[5491.5,-7129.8,5481.6,-7032.9]]];
  // the harbour fronts (estimated rooftop signs on the towers facing the water, below the hand-placed specs)
  // Island side only: the scout found few rooftop signs on the Kowloon front today (survey_kowloon.md)
  const HARB_LL = [[22.2760, 114.1440, 22.2930, 114.2050]];

  // ---- drawing the text atlas ----
  const isCJK = c => /[⺀-鿿豈-﫿]/.test(c);
  function tokens(s){ const out = []; let cur = ''; for (const c of s){ if (isCJK(c) || c === '·'){ if (cur.trim()) out.push(cur.trim()); cur = ''; if (c !== '·') out.push(c); } else cur += c; } if (cur.trim()) out.push(cur.trim()); return out; }
  function paint(g, t, x, y, k, font, wt, glow){
    g.font = `${wt} ${k}px ${FST[font] || FST.hei}`;
    g.shadowBlur = 0; g.fillStyle = '#ff0000'; g.fillText(t, x, y);
    g.strokeStyle = '#00ff00'; g.lineWidth = Math.max(1.3, k*0.075); g.lineJoin = 'round'; g.strokeText(t, x, y);
    g.fillStyle = '#0000ff'; g.shadowColor = '#0000ff'; g.shadowBlur = k*(glow || 0.32); g.fillText(t, x, y); g.shadowBlur = 0;
  }
  // one line of text into the rectangle R = [x, y, w, h] (canvas px), horizontal (characters spread across, as on the boards) or stacked
  function textLine(g, R, s, vert, font, wt){
    if (!s) return;
    const lat = font === 'sans' || font === 'serif';
    if (!vert){
      const tk = tokens(s);
      if (!tk.some(isCJK)){ let k = R[3]*0.8; g.font = `${wt} ${k}px ${FST[lat ? font : 'sans']}`; const m = g.measureText(s).width; if (m > R[2]*0.95) k *= R[2]*0.95/m; paint(g, s, R[0] + R[2]/2, R[1] + R[3]*0.53, k, lat ? font : 'sans', wt); return; }
      const ws = tk.map(t => isCJK(t) ? 1 : Math.max(0.7, t.length*0.62)), tot = ws.reduce((a, b) => a + b, 0);
      const k = Math.min(R[3]*0.86, R[2]/tot*0.94), gap = Math.min(k*0.55, Math.max(0, (R[2] - tot*k)/Math.max(1, tk.length - 1)));
      let x = R[0] + (R[2] - tot*k - gap*(tk.length - 1))/2;
      tk.forEach((t, i) => { const tw = ws[i]*k; paint(g, t, x + tw/2, R[1] + R[3]*0.52, isCJK(t) ? k : k*0.82, isCJK(t) ? font : 'sans', wt); x += tw + gap; });
    } else {
      const ch = [...s.replace(/\s+/g, '')], n = ch.length;
      const k = Math.min(R[2]*0.86, R[3]/n*0.95), gap = Math.min(k*0.4, Math.max(0, (R[3] - n*k)/Math.max(1, n - 1)));
      let y = R[1] + (R[3] - n*k - gap*(n - 1))/2;
      for (const c of ch){ paint(g, c, R[0] + R[2]/2, y + k*0.52, isCJK(c) ? k : k*0.9, isCJK(c) ? font : 'sans', wt); y += k + gap; }
    }
  }
  // a cell: main text, a smaller second line (in the edge colour: its share of the cell height from the bottom is returned)
  function drawCell(g, x, y, w, h, d){
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.globalCompositeOperation = 'lighter'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const p = Math.max(3, Math.min(w, h)*0.09), font = d.f || 'hei', wt = FWT[font] || 900;
    let split = 0;
    if (d.emb){
      // the pawnbroker's sign: a bat with spread wings holding a coin (round, square hole), the character below
      const cx = x + w/2, s = w*0.5, by = y + h*0.13, cy = y + h*0.36;
      const shape = (fill) => { g.beginPath(); g.moveTo(cx, by - s*0.12); g.quadraticCurveTo(cx - s*0.35, by - s*0.45, cx - s*0.95, by - s*0.18); g.lineTo(cx - s*0.78, by + s*0.02); g.lineTo(cx - s*0.92, by + s*0.22);
        g.quadraticCurveTo(cx - s*0.45, by + s*0.05, cx, by + s*0.3); g.quadraticCurveTo(cx + s*0.45, by + s*0.05, cx + s*0.92, by + s*0.22); g.lineTo(cx + s*0.78, by + s*0.02); g.lineTo(cx + s*0.95, by - s*0.18);
        g.quadraticCurveTo(cx + s*0.35, by - s*0.45, cx, by - s*0.12); g.closePath(); fill(); g.beginPath(); g.arc(cx, cy, s*0.62, 0, 7); g.rect(cx + s*0.2, cy - s*0.2, -s*0.4, s*0.4); fill(); };
      shape(() => { g.fillStyle = '#ff0000'; g.fill('evenodd'); });
      shape(() => { g.strokeStyle = '#00ff00'; g.lineWidth = Math.max(1.5, w*0.05); g.stroke(); });
      shape(() => { g.fillStyle = '#0000ff'; g.shadowColor = '#0000ff'; g.shadowBlur = w*0.18; g.fill('evenodd'); g.shadowBlur = 0; });
      textLine(g, [x + p, y + h*0.6, w - 2*p, h*0.36], d.t, true, font, wt);
    } else if (d.s){
      if (!d.v){ const mh = (h - 2*p)*0.66; textLine(g, [x + p, y + p, w - 2*p, mh], d.t, false, font, wt); textLine(g, [x + p*1.6, y + p + mh + (h - 2*p)*0.04, w - 3.2*p, (h - 2*p)*0.3], d.s, false, isCJK(d.s[0]) ? 'hei' : 'sans', 700); split = (p + (h - 2*p)*0.32)/h; }
      else { const mh = (h - 2*p)*0.82; textLine(g, [x + p, y + p, w - 2*p, mh], d.t, true, font, wt); textLine(g, [x + p, y + p + mh + (h - 2*p)*0.02, w - 2*p, (h - 2*p)*0.16], d.s, false, isCJK(d.s[0]) ? 'hei' : 'sans', 700); split = (p + (h - 2*p)*0.17)/h; }
    } else textLine(g, [x + p, y + p, w - 2*p, h - 2*p], d.t, !!d.v, font, wt);
    g.restore();
    return split;
  }

  // the text atlas (built once, at start-up): street designs and one cell per spec
  let HKA = null;                  // {cv, W, H, des:[{r:[u0, v0, du, dv], asp, split}], spec:[...]}
  function makeTextAtlas(){
    const W = 2048, CH = [280, 92], CV = [70, 280], GUT = 6;
    const cells = [];                // {w, h, d, out}
    let x = 0, y = 0, rowH = 0;
    const place = (w, h) => { if (x + w > W){ x = 0; y += rowH + GUT; rowH = 0; } const r = [x, y]; x += w + GUT; rowH = Math.max(rowH, h); return r; };
    const des = DES.map(d => { const [w, h] = d.v ? CV : CH, p = place(w, h); const c = {x:p[0], y:p[1], w, h, d}; cells.push(c); return c; });
    // spec cells: the densest of a few levels (px per metre, short side min / max, long side max) whose cells fit the atlas
    // (at most 2048 × 4096); very long or tall boards keep at most 1:10 (the text is centred, the rest of the board stays plain).
    // Cells are shelf-packed tallest first.
    const y1 = y + rowH + GUT;
    const specCells = (pxm, smin, smax, lmax) => HKSPEC.map(S => {
      if (!S.text && !S.sub) return null;
      let w = S.w*pxm, h = S.h*pxm; const short = Math.min(w, h);
      if (short < smin){ w *= smin/short; h *= smin/short; } if (short > smax){ w *= smax/short; h *= smax/short; }
      const lng = Math.max(w, h); if (lng > lmax){ w *= lmax/lng; h *= lmax/lng; }
      if (w/h > 10) w = h*10; if (h/w > 10) h = w*10;
      return {w:Math.round(w), h:Math.round(h), d:{t:S.text || '', s:S.sub || '', f:S.font || 'hei', v:!!S.vert, emb:0}};
    });
    const shelf = C => { let px = 0, py = y1, rh = 0; const ord = C.map((c, i) => i).filter(i => C[i]).sort((a, b) => C[b].h - C[a].h);
      for (const i of ord){ const c = C[i]; if (px + c.w > W){ px = 0; py += rh + GUT; rh = 0; } c.x = px; c.y = py; px += c.w + GUT; rh = Math.max(rh, c.h); } return py + rh; };
    let specC = null, end = 0;
    for (const L of [[28, 64, 160, 900], [26, 64, 150, 800], [24, 56, 140, 720], [22, 48, 128, 680], [20, 40, 128, 640], [17, 36, 110, 560], [14, 32, 96, 480]]){
      specC = specCells(...L); end = shelf(specC); STATS.atlasLevel = L[0]; if (end <= 4094) break; }
    for (const c of specC) if (c) cells.push(c);
    y = end; rowH = 0;
    let H = 2048; while (H < y + 2 && H < 4096) H *= 2;
    const scale = y > H - 2 ? (H - 2)/y : 1;           // more specs than even the lowest level holds: squeeze everything
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (const c of cells){ if (scale < 1){ c.x *= scale; c.y *= scale; c.w *= scale; c.h *= scale; } c.split = drawCell(g, c.x, c.y, c.w, c.h, c.d); }
    const R = c => c ? {r:[c.x/W, 1 - (c.y + c.h)/H, c.w/W, c.h/H], asp:c.w/c.h, split:c.split} : null;
    return {cv, W, H, des:des.map(R), spec:specC.map(R), used:y};
  }

  // ---------------- state ----------------
  const STATS = {tiles:0, ms:0, maxMs:0, tris:[0, 0, 0, 0, 0, 0], n:{}, last:null, hr:[], sp:[]};
  const pip = (R, x, y) => { let ins = false; const m = R.length >> 1; for (let i = 0, j = m - 1; i < m; j = i++){ const xi = R[i*2], yi = R[i*2+1], xj = R[j*2], yj = R[j*2+1]; if ((yi > y) !== (yj > y) && x < (xj - xi)*(y - yi)/(yj - yi) + xi) ins = !ins; } return ins; };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a)/(b - a))); return t*t*(3 - 2*t); };
  const cl01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const b8 = v => v <= 0 ? 0 : v >= 1 ? 255 : Math.round(v*255);
  const offB = h => h === Infinity ? 255 : Math.max(0, Math.min(254, Math.round(h/8*255)));    // switch-off time: hours after 22:00
  let ready = false, SGA = null, MA = null, MB = null, HKTEX = null;
  const DIST = [], HUB = [], POI = [], HARB = [];
  const U = {uSN:{value:0}, uLH:{value:0}, uVH:{value:400}};
  let RS = null, RTILE = null;                   // road segments (classes 2-10) and their per-tile lists
  let SPECS = [], SPECT = new Map(), SPECG = new Map();    // the sign specs (world), per tile, and a 16 m grid of their positions
  const PROFT = new Set();                       // tiles with profiled (neon) street segments
  function init(){
    ready = true;
    for (const k in DIST_LL){ const P = []; for (const [la, lo] of DIST_LL[k]){ const q = sgXY(la, lo); P.push(q[0], q[1]); }
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < P.length; i += 2){ x0 = Math.min(x0, P[i]); x1 = Math.max(x1, P[i]); y0 = Math.min(y0, P[i+1]); y1 = Math.max(y1, P[i+1]); }
      DIST.push({k, P:Float64Array.from(P), bb:[x0, y0, x1, y1], f:FLV[k] || FLV.none}); }
    for (const [la, lo, r] of HUBS_LL){ const q = sgXY(la, lo); HUB.push([q[0], q[1], r]); }
    for (const [a0, o0, a1, o1] of HARB_LL){ const p = sgXY(a0, o0), q = sgXY(a1, o1); HARB.push([p[0], p[1], q[0], q[1]]); }
    const PK = {mall:1, hotel:2, place_of_worship:3, museum:3, theatre:3, arts_centre:3, library:3, memorial:3, monument:3};
    for (const p of (SGR.base && SGR.base.pois) || []) if (PK[p.k]) POI.push({x:p.x, y:p.y, k:PK[p.k]});
    // road segments of the street classes (trunk ... residential), each listed in every tile it comes within 80 m of; inside the
    // districts also footways and named service lanes; every named road with a street profile (pedestrianised Sai Yeung Choi
    // Street South, the Temple Street market ...) whatever its class
    const ax = [], ay = [], bx = [], by = [], cc = [], pf = [], ow = [];
    const inDistBB = (x, y) => DIST.some(D => D.f.core && x > D.bb[0] - 40 && x < D.bb[2] + 40 && y > D.bb[1] - 40 && y < D.bb[3] + 40 && pip(D.P, x, y));
    const LAT0 = 22.34, LON0 = 114.12;
    for (const l of SGR.lines || []){ if (l.c < 2 || (l.flags & 8) || l.c > 12) continue; const P = l.P, m = (P.length >> 2) << 1;
      const en = l.name ? l.name[0] : '', prof = en ? profFor(en, LAT0 + P[m+1]/110734.9, LON0 + P[m]/103014.2) : 0;
      if (l.c > 10 && !prof){ if (!(l.c === 12 || (l.c === 11 && l.name))) continue; if (!inDistBB(P[m], P[m+1])) continue; }
      if ((l.flags & 2) && l.E) continue;          // flyovers: no shops along them
      for (let i = 0; i + 3 < P.length; i += 2){ ax.push(P[i]); ay.push(P[i+1]); bx.push(P[i+2]); by.push(P[i+3]); cc.push(l.c); pf.push(prof); ow.push(l.flags & 1); } }
    for (const [en, P] of HK_PATHS){ const m = (P.length >> 2) << 1, prof = profFor(en, LAT0 + P[m+1]/110734.9, LON0 + P[m]/103014.2); if (!prof) continue;
      for (let i = 0; i + 3 < P.length; i += 2){ ax.push(P[i]); ay.push(P[i+1]); bx.push(P[i+2]); by.push(P[i+3]); cc.push(12); pf.push(prof); ow.push(0); } }
    RS = {ax:Float32Array.from(ax), ay:Float32Array.from(ay), bx:Float32Array.from(bx), by:Float32Array.from(by), c:Uint8Array.from(cc), pf:Uint8Array.from(pf), ow:Uint8Array.from(ow), mark:new Uint32Array(ax.length), stamp:0};
    const T = 2000, TX = 28, H0 = 28000, per = new Map();
    for (let s = 0; s < ax.length; s++){
      const tx0 = Math.floor((Math.min(ax[s], bx[s]) - 80 + H0)/T), tx1 = Math.floor((Math.max(ax[s], bx[s]) + 80 + H0)/T), ty0 = Math.floor((Math.min(ay[s], by[s]) - 80 + H0)/T), ty1 = Math.floor((Math.max(ay[s], by[s]) + 80 + H0)/T);
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++){ if (tx < 0 || ty < 0 || tx >= TX || ty >= TX) continue; const k = ty*TX + tx; let L = per.get(k); if (!L) per.set(k, L = []); L.push(s); if (pf[s]) PROFT.add(k); }
    }
    RTILE = new Map(); for (const [k, L] of per) RTILE.set(k, Int32Array.from(L));
    initSpecs();
  }
  // specs in world coordinates; each goes to the tile of its building (bld) or of its own position
  function initSpecs(){
    SPECS = []; SPECT = new Map(); SPECG = new Map();
    const tileOf = (x, y) => { const tx = Math.floor((x + 28000)/2000), ty = Math.floor((y + 28000)/2000); return tx < 0 || ty < 0 || tx >= 28 || ty >= 28 ? -1 : ty*28 + tx; };
    HKSPEC.forEach((S, i) => {
      const p = sgXY(S.lat, S.lon), a = (S.az || 0)*Math.PI/180;
      const o = {S, i, x:p[0], y:p[1], nx:Math.sin(a), ny:Math.cos(a)};
      SPECS.push(o);
      const ti = tileOf(S.bx !== undefined ? S.bx : o.x, S.by !== undefined ? S.by : o.y); if (ti < 0) return;
      let L = SPECT.get(ti); if (!L) SPECT.set(ti, L = []); L.push(o);
      const gk = Math.floor(o.x/16)*4096 + Math.floor(o.y/16); let G = SPECG.get(gk); if (!G) SPECG.set(gk, G = []); G.push(o);
    });
  }
  // a spec within r metres (plan) of (x, y), optionally only roof-type ones
  function nearSpec(x, y, r, roofOnly){
    const c0 = Math.floor((x - r)/16), c1 = Math.floor((x + r)/16), d0 = Math.floor((y - r)/16), d1 = Math.floor((y + r)/16);
    for (let cx = c0; cx <= c1; cx++) for (let cy = d0; cy <= d1; cy++){ const G = SPECG.get(cx*4096 + cy); if (!G) continue;
      for (const o of G){ if (roofOnly && !(o.S.kind === 'roof' || o.S.kind === 'letters' || o.S.kind === 'led')) continue; const dx = o.x - x, dy = o.y - y; if (dx*dx + dy*dy < r*r) return true; } }
    return false;
  }

  // ---------------- per-tile spatial helpers ----------------
  // a 32 m grid of the tile's road segments and one of its building footprints (CSR lists)
  const GC = 32, GM = 96, GN = Math.ceil((2000 + 2*GM)/GC);
  let RG = null, BG = null, LIST = null, BBX = null, GOFF = null, TI = 0, SKIP = null, PGN = false;
  const PGF = new Uint8Array(GN*GN);          // grid cells within ~32 m of a profiled (neon) street segment
  const DONE = new Set();                     // facade edges of the current building already decorated by the neon streets
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
    PGN = PROFT.has(ti); if (PGN){ PGF.fill(0); for (let i = 0; i < ids.length; i++){ const s = ids[i]; if (!RS.pf[s]) continue;
      for (let cy = gcy(Math.min(RS.ay[s], RS.by[s]) - 32); cy <= gcy(Math.max(RS.ay[s], RS.by[s]) + 32); cy++) for (let cx = gcx(Math.min(RS.ax[s], RS.bx[s]) - 32); cx <= gcx(Math.max(RS.ax[s], RS.bx[s]) + 32); cx++) PGF[cy*GN + cx] = 1; } }
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
  let lastCls = 99, lastProf = 0, lastOw = 0;
  // prof: only segments of the profiled (neon) streets (lastProf = the profile, lastOw = it is one carriageway of a pair)
  function street(mx, my, nx, ny, ux, uy, hl, dmax, prof){
    const ex = Math.abs(ux*(hl + 4)), ey = Math.abs(uy*(hl + 4)), fx = nx*dmax, fy = ny*dmax;
    const cx0 = gcx(mx - ex + Math.min(0, fx)), cx1 = gcx(mx + ex + Math.max(0, fx)), cy0 = gcy(my - ey + Math.min(0, fy)), cy1 = gcy(my + ey + Math.max(0, fy));
    const st = ++RS.stamp, ids = RG.ids, L = RG.list; let best = Infinity; lastCls = 99; lastProf = 0; lastOw = 0; ST.qs = (ST.qs || 0) + 1;
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++){ const c = cy*GN + cx;
      for (let j = RG.start[c]; j < RG.start[c + 1]; j++){ const s = ids[L[j]]; if (RS.mark[s] === st) continue; RS.mark[s] = st; if (prof && !RS.pf[s]) continue;
        const ax = RS.ax[s], ay = RS.ay[s], sx = RS.bx[s] - ax, sy = RS.by[s] - ay, l2 = sx*sx + sy*sy; if (l2 < 0.25) continue;
        const sl = Math.sqrt(l2); if (Math.abs(sx*ux + sy*uy)/sl < 0.55) continue;
        let t = ((mx - ax)*sx + (my - ay)*sy)/l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const qx = ax + sx*t - mx, qy = ay + sy*t - my, dn = qx*nx + qy*ny, du = qx*ux + qy*uy;
        if (dn < 0.5 || dn > dmax || Math.abs(du) > hl + 8) continue;
        if (dn < best){ best = dn; lastCls = RS.c[s]; lastProf = RS.pf[s]; lastOw = RS.ow[s]; } } }
    return best;
  }
  // a building near a profiled street (its bounding box grown by 30 m touches a marked cell)
  function nearProf(k){ const o = k*4; for (let cy = gcy(BBX[o+1] - 30); cy <= gcy(BBX[o+3] + 30); cy++) for (let cx = gcx(BBX[o] - 30); cx <= gcx(BBX[o+2] + 30); cx++) if (PGF[cy*GN + cx]) return true; return false; }
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
  //    + kind 9 (the text atlas): CU f32×2 (text-cell uv), RC f32×4 (atlas rect), FX u8×4 (edge colour, sub-line split)
  function WA(){ this.nv = 0; this.ni = 0; this.cap = 0; this.icap = 0; this.grow(4096); this.growI(8192); }
  WA.prototype.grow = function(n){ const P = new Float32Array(n*3), N = new Int8Array(n*3), T = new Float32Array(n*2), K = new Float32Array(n*4), D = new Uint8Array(n*4), E = new Uint8Array(n*4), CU = new Float32Array(n*2), RC = new Float32Array(n*4), FX = new Uint8Array(n*4);
    if (this.cap){ P.set(this.P); N.set(this.N); T.set(this.T); K.set(this.K); D.set(this.D); E.set(this.E); CU.set(this.CU); RC.set(this.RC); FX.set(this.FX); } const Bi = new Uint16Array(n); if (this.cap) Bi.set(this.Bi); Object.assign(this, {P, N, T, K, D, E, CU, RC, FX, Bi, cap:n}); };
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
  const PA = new Float32Array(4), PAD = new Uint8Array(4), PAE = new Uint8Array(4), PBC = new Uint8Array(4), PBM = new Uint8Array(4), PRC = new Float32Array(4), PFX = new Uint8Array(4), TS = new Float32Array([1, 1, 0, 0]);
  function penA(kind, idx, cyc, ph, day, off, em, mode, eph){ PA[0] = kind; PA[1] = idx; PA[2] = cyc || 0; PA[3] = ph || 0; PAD[0] = b8(day[0]); PAD[1] = b8(day[1]); PAD[2] = b8(day[2]); PAD[3] = off;
    PAE[0] = em ? b8(em[0]) : 0; PAE[1] = em ? b8(em[1]) : 0; PAE[2] = em ? b8(em[2]) : 0; PAE[3] = ((mode || 0) << 5) | ((eph || 0) & 31); PRC.fill(0); PFX.fill(0); TS[0] = 1; TS[1] = 1; TS[2] = 0; TS[3] = 0; }
  const WHITE = [1, 1, 1];
  const penSign = (kind, idx, off, cyc, ph) => penA(kind, idx, cyc, ph, WHITE, off, null, 0, 0);
  const penPlain = (day, off, em, mode, eph) => penA(5, 0, 0, 0, day, off, em, mode, eph);
  function av(W, x, y, h, nx, ny, nz, u, v){ const k = W.nv++, p = k*3, q = k*2, r = k*4; W.Bi[k] = SGCURB;
    W.P[p] = x - OX; W.P[p+1] = h; W.P[p+2] = OY - y; W.N[p] = Math.round(nx*127); W.N[p+1] = Math.round(ny*127); W.N[p+2] = Math.round(nz*127); W.T[q] = u; W.T[q+1] = v;
    W.K[r] = PA[0]; W.K[r+1] = PA[1]; W.K[r+2] = PA[2]; W.K[r+3] = PA[3]; W.D[r] = PAD[0]; W.D[r+1] = PAD[1]; W.D[r+2] = PAD[2]; W.D[r+3] = PAD[3]; W.E[r] = PAE[0]; W.E[r+1] = PAE[1]; W.E[r+2] = PAE[2]; W.E[r+3] = PAE[3];
    W.CU[q] = u*TS[0] + TS[2]; W.CU[q+1] = v*TS[1] + TS[3]; W.RC[r] = PRC[0]; W.RC[r+1] = PRC[1]; W.RC[r+2] = PRC[2]; W.RC[r+3] = PRC[3]; W.FX[r] = PFX[0]; W.FX[r+1] = PFX[1]; W.FX[r+2] = PFX[2]; W.FX[r+3] = PFX[3]; }
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
  const P_LINE = 0, P_HDB = 1, P_VOID = 2, P_CORE = 3, P_WASH = 4, P_SHOP = 5, P_CROWN = 6, P_DOTS = 7, P_SPRITE = 8, P_MEDIA = 9, P_SPILL = 10, P_POOL = 11, P_GPOOL = 12, P_RGLOW = 13;
  const A_HUE = 1, A_CHASE = 2, A_BREATHE = 3, A_FLICKER = 4, A_BLINK = 5, A_MULTI = 6, A_FAR = 7;
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
    for (const e of E){ if (e.L < minL || DONE.has(e)) continue;
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

  // ---------------- Hong Kong text signs: kind 9 of mesh A (text atlas masks, colours and lighting per vertex) ----------------
  const LIT = {off:0, neon:1, box:2, led:3, flood:4}, ANIM = {none:0, flash:1, chase:2, seq:3, scroll:4, cycle:5, screen:6};
  const DARK = [0.06, 0.06, 0.065];
  // pen of a text face: cell {r, asp, split} (or null: an LED screen without text), colours [bg, fg, edge] (0-1; bg null = no backing),
  // lit / anim codes, phase 0-1, switch-off byte, flags, face half width / height (m)
  function penText(cell, col, lit, anim, ph, off, flags, hw, hh){
    PA[0] = 9; PA[1] = anim*8 + lit; PA[2] = ph; PA[3] = Math.min(1023, Math.round(hw*8)) + 1024*Math.min(1023, Math.round(hh*8));
    const b = col[0] || DARK, f = col[1] || [1, 0.2, 0.15], e = col[2] || f;
    PAD[0] = b8(b[0]); PAD[1] = b8(b[1]); PAD[2] = b8(b[2]); PAD[3] = off;
    PAE[0] = b8(f[0]); PAE[1] = b8(f[1]); PAE[2] = b8(f[2]); PAE[3] = flags;
    PFX[0] = b8(e[0]); PFX[1] = b8(e[1]); PFX[2] = b8(e[2]); PFX[3] = cell ? b8(cell.split || 0) : 0;
    if (cell){ PRC[0] = cell.r[0]; PRC[1] = cell.r[1]; PRC[2] = cell.r[2]; PRC[3] = cell.r[3]; const A = hw/Math.max(hh, 0.01), C = cell.asp;
      TS[0] = A > C ? A/C : 1; TS[1] = A > C ? 1 : C/A; TS[2] = 0.5 - 0.5*TS[0]; TS[3] = 0.5 - 0.5*TS[1]; }
    else { PRC.fill(0); TS[0] = 1; TS[1] = 1; TS[2] = 0; TS[3] = 0; }
  }
  const haloCol = (lit, col) => { const b = col[0] || DARK, f = col[1] || [1, 0.2, 0.15];
    return lit === 1 ? f.map(v => v*0.3) : lit === 2 ? f.map((v, i) => (v*0.4 + b[i]*0.6)*0.3) : lit === 3 ? [0.22, 0.22, 0.28] : b.map(v => v*0.12); };
  // the colour a sign throws into the night (far glow): neon = its tubes, lightbox = its face, screen = a cool white
  const glowCol = (lit, col, noBack) => { const b = col[0] || DARK, f = col[1] || [1, 0.2, 0.15];
    const c = lit === 1 || noBack ? f : lit === 2 ? f.map((v, i) => v*0.3 + b[i]*0.7) : lit === 3 ? [0.75, 0.75, 0.9] : b.map(v => v*0.5);
    const m = Math.max(c[0], c[1], c[2], 0.25); return c.map(v => v/m); };
  // a soft glowing block round a board, in its plane (pattern 13: uv -1..1 over the glow, the board inside |u| < rx, |v| < ry); it
  // grows from a faint rim near by to a full glow beyond ~1.5 km (anim 8), so a board reads as a lit block across the harbour
  function rectGlow(W, x, y, nx, ny, hw, y0, y1, col, off){
    const hh = (y1 - y0)/2, m = Math.min(30, Math.max(hh*3, hw*0.7, 8)), Hx = hw + m, Hy = hh + m, rx = -ny, ry = nx, yc = (y0 + y1)/2;
    penB(col, off, P_RGLOW, 8, Math.round(hw/Hx*255), Math.round(hh/Hy*255));
    bQuad(W, x - rx*Hx, y - ry*Hx, x + rx*Hx, y + ry*Hx, yc - Hy, yc + Hy, -1, 1, -1, 1); cnt('rglow');
  }
  // a text sign. o: {W, V (writers A / B, V null = no halo), x, y (plan centre: of the front face when one-sided, of the board when
  // two-sided), nx, ny (face normal), hw, y0, y1, depth, sides, cell, col, lit, anim, ph, off, frame, vert, bulbs, noBack, plain,
  // halo (radius factor, 0 = none), haloW (writer for the halo), minPx}
  function textSign(o){
    const W = o.W, d = o.depth || 0, hh = (o.y1 - o.y0)/2, two = o.sides === 2;
    const flags = (o.noBack ? 1 : 0) | (o.cell && o.cell.split > 0 ? 2 : 0) | (o.frame ? 4 : 0) | (o.vert ? 8 : 0) | (o.bulbs ? 16 : 0) | (o.cell ? 32 : 0);
    if (d > 0 && !o.noBack){
      const back = two ? 0 : d/2;
      penPlain(o.plain || [0.13, 0.13, 0.14], NEVER, null, 0, 0);
      aBox(W, o.x - o.nx*back, o.y - o.ny*back, -o.ny, o.nx, o.hw + 0.02, d/2, o.y0 - 0.02, o.y1 + 0.02, o.mask || (two ? 4 | 8 | 16 | 32 : o.wall ? 4 | 8 | 16 | 32 : 2 | 4 | 8 | 16 | 32));
    }
    const f1 = two ? d/2 + 0.015 : 0.015;
    penText(o.cell, o.col, o.lit, o.anim, o.ph, o.off, flags, o.hw, hh);
    aFaceC(W, o.x + o.nx*f1, o.y + o.ny*f1, o.nx, o.ny, o.hw, o.y0, o.y1, 0, 1);
    if (two) aFaceC(W, o.x - o.nx*f1, o.y - o.ny*f1, -o.nx, -o.ny, o.hw, o.y0, o.y1, 0, 1);
    const V = o.haloW || o.V;
    if (o.rglow && o.lit){ rectGlow(o.rglow, o.x + o.nx*(f1 + 0.3), o.y + o.ny*(f1 + 0.3), o.nx, o.ny, o.hw, o.y0, o.y1, glowCol(o.lit, o.col, o.noBack), o.off); return; }
    if (V && o.lit && o.halo !== 0){
      const r = Math.min(26, Math.max(o.hw, hh)*(o.halo || 1)*1.15), q = two ? 0 : Math.min(1.5, r*0.3);
      halo(V, o.x + o.nx*q, o.y + o.ny*q, (o.y0 + o.y1)/2, r, haloCol(o.lit, o.col).map(v => Math.min(1, v*(o.haloK || 1))), o.off, 0, o.minPx || 0);
    }
  }
  // a board cantilevered over the street from facade e at s, from a to a + w metres out, y0..y1, text faces up and down the street
  // ang: the board turned from the wall normal towards the street direction (radians; the angled boxes of Causeway Bay)
  function overSign(W, V, e, s, a, w, y0, y1, cell, col, lit, anim, ph, off, frame, vert, bulbs, ang){
    const ca = Math.cos(ang || 0), sa = Math.sin(ang || 0), ox = e.nx*ca + e.ux*sa, oy = e.ny*ca + e.uy*sa;
    const bx = e.ax + e.ux*s, by = e.ay + e.uy*s, a2 = ang ? a + Math.abs(sa)*0.35 : a;
    textSign({W, V, x:bx + ox*(a2 + w/2), y:by + oy*(a2 + w/2), nx:-oy, ny:ox, hw:w/2, y0, y1, depth:w > 1.6 ? 0.3 : 0.2, sides:2, cell, col, lit, anim, ph, off, frame, vert, bulbs, plain:[0.17, 0.17, 0.18], halo:lit === 1 ? 0.75 : ph < 0.33 ? 0.6 : 0, haloW:WBs[1], minPx:1.5, mask:4 | 16 | 32});     // halos: neon all, lightboxes one in three (fill rate)
    if (a2 > 0.12 && w > 2.2){ penPlain([0.22, 0.22, 0.23], NEVER, null, 0, 0); aBox(W, bx + ox*a2/2, by + oy*a2/2, ox, oy, a2/2 + 0.04, 0.05, y1 - 0.2, y1 - 0.1, 1 | 2 | 32); }
    if (w > 6){ // steel lattice outrigger: a top chord from the wall to the outer end and a diagonal stay
      penPlain([0.24, 0.24, 0.25], NEVER, null, 0, 0); const L = a2 + w, cx = bx + ox*L/2, cy = by + oy*L/2;
      aBox(W, cx, cy, ox, oy, L/2, 0.06, y1 + 0.35, y1 + 0.5, 1 | 2 | 16 | 32);
      const dh = Math.min(4, w*0.35), dl = Math.hypot(L, dh); W.need(8, 12); const v = W.nv, px = -oy*0.06, py = ox*0.06;
      for (const [s2, d2] of [[-1, 0], [1, 0]]){ const q = W.nv; av(W, bx + px*s2, by + py*s2, y1 + 0.4 + dh, s2*px/0.06, 0, -s2*py/0.06, 0, 0); av(W, bx + ox*L + px*s2, by + oy*L + py*s2, y1 + 0.4, s2*px/0.06, 0, -s2*py/0.06, 1, 0); av(W, bx + ox*L + px*s2, by + oy*L + py*s2, y1 + 0.58, s2*px/0.06, 0, -s2*py/0.06, 1, 1); av(W, bx + px*s2, by + py*s2, y1 + 0.58 + dh, s2*px/0.06, 0, -s2*py/0.06, 0, 1);
        const I = W.I; let n = W.ni; if (s2 < 0){ I[n++] = q; I[n++] = q + 1; I[n++] = q + 2; I[n++] = q; I[n++] = q + 2; I[n++] = q + 3; } else { I[n++] = q; I[n++] = q + 2; I[n++] = q + 1; I[n++] = q; I[n++] = q + 3; I[n++] = q + 2; } W.ni = n; } }
  }
  // a soft coloured pool of light on the ground (the neon on the street, the market bulbs)
  function gPool(W, x, y, r, col, off){ penB(col, off, P_GPOOL, 0, 0, 0); W.need(4, 6); const v = W.nv, h = Math.max(hC(x, y), -0.3) + 0.14;
    bv(W, x - r, y - r, h, -1, -1); bv(W, x + r, y - r, h, 1, -1); bv(W, x + r, y + r, h, 1, 1); bv(W, x - r, y + r, h, -1, 1); quadI(W, v); }
  const rr = (rng, a) => a[0] + rng()*(a[1] - a[0]);

  // ---- clearance of the boards over the street ----
  // boards placed in this tile (plan segments with their height range) in a 16 m grid
  let OCC = new Map();
  const occKey = (x, y) => Math.floor(x/16)*65536 + Math.floor(y/16);
  function occAdd(ax, ay, bx, by, y0, y1){ const o = [ax, ay, bx, by, y0, y1], seen = new Set();
    for (const [x, y] of [[ax, ay], [bx, by], [(ax + bx)/2, (ay + by)/2]]){ const k = occKey(x, y); if (seen.has(k)) continue; seen.add(k); let L = OCC.get(k); if (!L) OCC.set(k, L = []); L.push(o); } }
  function segD(px, py, ax, ay, bx, by){ const sx = bx - ax, sy = by - ay, l2 = sx*sx + sy*sy; let t = l2 > 1e-6 ? ((px - ax)*sx + (py - ay)*sy)/l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; const dx = ax + sx*t - px, dy = ay + sy*t - py; return Math.sqrt(dx*dx + dy*dy); }
  function occHit(px, py, y0, y1){
    const c0 = Math.floor((px - 2)/16), c1 = Math.floor((px + 2)/16), d0 = Math.floor((py - 2)/16), d1 = Math.floor((py + 2)/16);
    for (let cx = c0; cx <= c1; cx++) for (let cy = d0; cy <= d1; cy++){ const L = OCC.get(cx*65536 + cy); if (!L) continue;
      for (const o of L){ if (o[4] > y1 + 0.3 || o[5] < y0 - 0.3) continue; if (segD(px, py, o[0], o[1], o[2], o[3]) < 0.9) return true; } }
    return false;
  }
  // the street and park trees of the app (hkreal sgrTrees: an InstancedMesh of unit icosahedra per tile, built when the tile
  // comes within ~4.2 km, i.e. before this tile's sign job starts); their crowns in a 16 m grid
  let TREES = new Map();
  function treesOf(T){
    TREES = new Map(); const im = T && T.trees; if (!im || !im.instanceMatrix) return 0;
    const A = im.instanceMatrix.array, n = im.count; let c = 0;
    for (let i = 0; i < n; i++){ const o = i*16, sx = A[o], sy = A[o + 5], x = A[o + 12], h = A[o + 13], y = -A[o + 14];
      if (Math.abs(x - OX) > 1100 || Math.abs(y - OY) > 1100) continue;
      const k = occKey(x, y); let L = TREES.get(k); if (!L) TREES.set(k, L = []); L.push([x, y, sx + 0.3, h - sy - 0.2, h + sy + 0.2]); c++; }
    return c;
  }
  function treeNear(px, py, y0, y1){
    const c0 = Math.floor((px - 8)/16), c1 = Math.floor((px + 8)/16), d0 = Math.floor((py - 8)/16), d1 = Math.floor((py + 8)/16);
    for (let cx = c0; cx <= c1; cx++) for (let cy = d0; cy <= d1; cy++){ const L = TREES.get(cx*65536 + cy); if (!L) continue;
      for (const t of L){ if (t[3] > y1 || t[4] < y0) continue; const dx = t[0] - px, dy = t[1] - py; if (dx*dx + dy*dy < t[2]*t[2]) return true; } }
    return false;
  }
  // how far a board from (bx, by) along (ox, oy), from a to a + w, y0..y1, may reach before it meets another board or a tree crown
  function clearW(bx, by, ox, oy, a, w, y0, y1, g){
    const low = TREES.size && y0 < g + 14;
    for (let t = a + 0.25; t <= a + w + 0.3; t += 0.5){ const px = bx + ox*t, py = by + oy*t;
      if (occHit(px, py, y0, y1)) return Math.max(0, t - a - 0.45);
      if (low && treeNear(px, py, y0, y1)){ cnt('treecut'); return Math.max(0, t - a - 0.45); } }
    return w;
  }

  // the district glow: soft coloured light hanging in the street in front of the signs, faded in beyond ~400 m (far tier), so the
  // neon streets read from across the harbour. One sprite per ~20 m of frontage in the colour of the biggest sign there (mixing
  // all of them would add up to white), its size and strength from the sign area
  function hazeFace(e, HZ, half, P){
    if (!HZ.length) return;
    const n = Math.max(1, Math.round(e.L/20)), sl = e.L/n;
    for (let j = 0; j < n; j++){
      let A = 0, Y = 0, best = null;
      for (const z of HZ){ if (z[0] < j*sl - 2 || z[0] > (j + 1)*sl + 2) continue; A += z[1]; Y += z[3]*z[1]; if (!best || z[1] > best[1]) best = z; }
      if (A < 3 || !best) continue;
      const k = Math.min(0.42, 0.12 + A/(sl*12)), r = Math.min(26, 7 + Math.sqrt(A)*1.7), d = Math.min(Math.max(half - 1, 2), r*0.4), q = atE(e, (j + 0.5)*sl, d);
      halo(WBs[0], q[0], q[1], Y/A + 3, r, best[2].map(v => v*k), offB(P.late[1]), A_FAR, 4); cnt('haze');
    }
  }

  // ---- the neon streets: one street face (edge e, dS metres to the profiled road, ow: it is one carriageway of a pair) ----
  function neonFace(B, k, e, dS, ow, pi, g, top, rng){
    const P = SP[pi], W1 = WAs[1], W2 = WAs[2], V1 = WBs[1], V2 = WBs[2];
    const half = dS + (ow ? 3.2 : 0), wallTop = top - 0.8, late = () => offB(P.late[0] + rng()*(P.late[1] - P.late[0]));
    const HZ = [];      // the signs of this face for the district glow: [s along the face, area, glow colour, height]
    const tsF = o => { textSign(o); if (o.lit) HZ.push([(o.x - e.ax)*e.ux + (o.y - e.ay)*e.uy, 2*o.hw*(o.y1 - o.y0)*(o.lit === 3 ? 0.8 : 0.6), glowCol(o.lit, o.col, o.noBack), (o.y0 + o.y1)/2]); };
    // lit shop fronts and their light on the pavement
    { const ph = Math.floor(rng()*255), par = Math.round(Math.min(7.9, P.late[1] + 0.5)*32);
      penB(P.glow, NEVER, P_SHOP, 0, ph, par); bEdge(V2, e, 0.25, e.L - 0.25, 0.12, g + 0.1, g + 2.95, 0, 1);
      penB(P.glow, NEVER, P_SPILL, 0, ph, par); bSpill(V2, e, 0.25, e.L - 0.25, 0.2, Math.max(1.5, Math.min(5.5, half - 0.5))); }
    // fascia boards over the shop fronts, one per shop unit (mostly lightboxes, some neon)
    if (wallTop > g + 4.4){ const nU = Math.max(1, Math.round(e.L/(4.5 + rng()*3))), uw = e.L/nU;
      for (let j = 0; j < nU; j++){
        if (rng() > P.band) continue;
        const s0 = j*uw + 0.15, s1 = (j + 1)*uw - 0.15; if (s1 - s0 < 1.8) continue;
        const grp = pick(rng, P.G), dl = DESG[grp].h; if (!dl.length) continue;
        const hb = Math.min(1.0 + rng()*0.8, (s1 - s0)/2.2), yb = g + 3.0 + rng()*0.3, neon = rng() < P.neon*0.45, c = atE(e, (s0 + s1)/2, 0.3);
        tsF({W:W2, V:j % 2 ? null : V2, x:c[0], y:c[1], nx:e.nx, ny:e.ny, hw:(s1 - s0)/2, y0:yb, y1:yb + hb, depth:0.3, sides:1, wall:1, cell:HKA.des[pick(rng, dl)], col:pick(rng, SCHC[grp]), lit:neon ? 1 : 2, anim:neon && rng() < 0.15 ? 2 : 0, ph:rng(), off:late(), frame:neon || rng() < 0.3, bulbs:false, halo:0.8});
        cnt('band');
      } }
    // over-street stacks (each board is cut short where it would meet a board from the other side of the street or pass through
    // the crowns of the street trees; the colours they throw into the street are summed up for the district glow)
    const maxTop = Math.min(g + P.yMax, wallTop), outMax = Math.min(P.out[1], half - 1.3);
    if (outMax >= 1.2 && maxTop > g + P.y0[0] + 1.4){
      // stack positions along the frontage; a narrow tenement front gets one with the chance of its share of the spacing
      const SPOS = []; if (e.L < P.col){ if (rng() < e.L/P.col) SPOS.push(e.L*(0.3 + 0.4*rng())); } else for (let s = P.col*(0.25 + 0.5*rng()); s < e.L - 0.8; s += P.col*(0.6 + 0.8*rng())) SPOS.push(s);
      for (const s of SPOS){
        const p = atE(e, s, 2); if (nearSpec(p[0], p[1], 6)) continue;
        const n = P.stack[0] + Math.floor(rng()*(P.stack[1] - P.stack[0] + 1));
        let y = g + rr(rng, P.y0), placed = 0, lc = null;
        for (let i = 0; i < n; i++){
          const v = rng() < P.vert;
          let h = v ? rr(rng, P.vH || [3.2, 8.4]) : rr(rng, P.hH), w = v ? 1.2 + rng()*1.7 : rr(rng, P.out);
          w = Math.min(w, outMax); if (w < 1.1) break;
          if (y + h > maxTop){ if (v && maxTop - y > 2.4) h = maxTop - y; else break; }
          const grp = pick(rng, P.G), dl = v ? DESG[grp].v : DESG[grp].h; if (!dl.length){ y += h; continue; }
          const col = pick(rng, SCHC[grp]), lit = rng() < P.neon ? 1 : 2;
          let anim = 0; if (rng() < P.anim){ const r = rng(); anim = r < 0.45 ? 2 : r < 0.78 ? 3 : r < 0.9 ? 5 : 1; }
          const big = w*h >= 9;
          const ang = P.ang && rng() < P.ang ? (rng() < 0.5 ? -1 : 1)*(0.5 + rng()*0.35) : 0, sj = s + (rng() - 0.5)*0.8, a0 = 0.4 + rng()*0.45;
          { const ca = Math.cos(ang), sa = Math.sin(ang), ox = e.nx*ca + e.ux*sa, oy = e.ny*ca + e.uy*sa, bx = e.ax + e.ux*sj, by = e.ay + e.uy*sj, a2 = ang ? a0 + Math.abs(sa)*0.35 : a0;
            const wc = clearW(bx, by, ox, oy, a2, w, y, y + h, g); if (wc < w){ cnt(wc < 1.1 ? 'cut' : 'short'); if (wc < 1.1){ y += h + 0.45 + rng()*1.3; continue; } w = wc; }
            occAdd(bx + ox*a2, by + oy*a2, bx + ox*(a2 + w), by + oy*(a2 + w), y, y + h); }
          overSign(big ? W1 : W2, big ? V1 : V2, e, sj, a0, w, y, y + h, HKA.des[pick(rng, dl)], col, lit, anim, rng(), late(), lit === 1 ? rng() < 0.75 : rng() < 0.35, v, anim === 2 || (lit === 1 && rng() < 0.12), ang);
          placed++; cnt(v ? 'overV' : 'over'); lc = lc || col;
          HZ.push([sj, w*h*(lit === 1 ? 1.3 : 1), glowCol(lit, col), y + h/2]);
          y += h + 0.45 + rng()*1.3;
        }
        if (placed && rng() < 0.6){ const q = atE(e, s, Math.min(half - 0.5, 5)); gPool(V2, q[0], q[1], 3.5 + placed*0.6, haloCol(1, lc).map(v => v*0.55), offB(P.late[1])); }
      }
    }
    // the district glow: soft coloured light hanging in the street in front of the signs, faded in beyond ~400 m (far tier), so the
    // neon streets read from across the harbour; one sprite per ~22 m of frontage, sized and coloured by the signs there
    hazeFace(e, HZ, half, P);
    // flat vertical blades on the pillars between the shop units
    if (wallTop > g + 7.5) for (let s = 0.8 + rng()*3; s < e.L - 0.4; s += 3.5 + rng()*6){
      if (rng() > P.blade) continue;
      const p = atE(e, s, 1); if (nearSpec(p[0], p[1], 5)) continue;
      const grp = pick(rng, P.G), dl = DESG[grp].v; if (!dl.length) continue;
      const yb = g + 4.4 + rng()*1.2, bh = Math.min(2.6 + rng()*3.2, wallTop - yb), bw = 0.7 + rng()*0.6; if (bh < 2) continue;
      { const bx = e.ax + e.ux*s, by = e.ay + e.uy*s; if (clearW(bx, by, e.nx, e.ny, 0.18, bw, yb, yb + bh, g) < bw){ cnt('cutblade'); continue; } occAdd(bx + e.nx*0.18, by + e.ny*0.18, bx + e.nx*(0.18 + bw), by + e.ny*(0.18 + bw), yb, yb + bh); }
      const lit = rng() < P.neon ? 1 : 2;
      overSign(W2, V2, e, s, 0.18, bw, yb, yb + bh, HKA.des[pick(rng, dl)], pick(rng, SCHC[grp]), lit, rng() < P.anim*0.5 ? 3 : 0, rng(), late(), lit === 1, true, false);
      cnt('blade');
    }
    // lightboxes up the facade
    if (P.wbox && top - g > 13) for (let s = 1.5 + rng()*4; s < e.L - 2; s += 5 + rng()*8){
      if (rng() > P.wbox) continue;
      const w = Math.min(2.4 + rng()*5, e.L - 1), h = Math.max(0.9, w*(0.28 + rng()*0.3)), yb = g + 7.5 + rng()*Math.min((P.wboxMax || 30) - 9, top - g - 12); if (yb + h > Math.min(wallTop, g + (P.wboxMax || 99)) || w < 2) continue;
      const c = atE(e, Math.min(e.L - w/2 - 0.3, Math.max(w/2 + 0.3, s)), 0.3); if (nearSpec(c[0], c[1], 6)) continue;
      const grp = pick(rng, P.G), dl = DESG[grp].h; if (!dl.length) continue;
      tsF({W:W2, V:V2, x:c[0], y:c[1], nx:e.nx, ny:e.ny, hw:w/2, y0:yb, y1:yb + h, depth:0.3, sides:1, wall:1, cell:HKA.des[pick(rng, dl)], col:pick(rng, SCHC[grp]), lit:rng() < P.neon*0.5 ? 1 : 2, anim:0, ph:rng(), off:late(), frame:rng() < 0.4, halo:0.9});
      cnt('wbox');
    }
    // LED screens (Causeway Bay, Sai Yeung Choi Street, Tsim Sha Tsui): abstract colour fields, sometimes an invented advert line
    if (P.led && top - g > 16 && e.L > 9 && rng() < P.led*Math.min(1.5, e.L/25)){
      const w = Math.min(e.L*0.6, 6 + rng()*10), h = w*(0.5 + rng()*0.25), yb = g + 7 + rng()*6;
      if (yb + h < wallTop){ const c = atE(e, e.L*(0.3 + 0.4*rng()), 0.5);
        if (!nearSpec(c[0], c[1], 8)){ const grp = pick(rng, P.G), txt = rng() < 0.4 && DESG[grp].h.length;
          tsF({W:W1, V:V1, x:c[0], y:c[1], nx:e.nx, ny:e.ny, hw:w/2, y0:yb, y1:yb + h, depth:0.5, sides:1, wall:1, cell:txt ? HKA.des[pick(rng, DESG[grp].h)] : null, col:[[0.05, 0.05, 0.06], [1, 1, 1], [1, 0.9, 0.3]], lit:3, anim:6, ph:rng(), off:late(), halo:0.8});
          cnt('led'); } } }
    // podium billboards (Causeway Bay, Wan Chai): a row of large printed adverts along the podium top, floodlit or backlit,
    // invented advert panels (abstract colour fields, a disc, a band; static)
    if (P.bill && e.L >= 14 && top - g > (P.billY ? 12 : 22) && rng() < P.bill){
      const yb = g + (P.billY ? rr(rng, P.billY) : 9 + rng()*5), hb = P.billY ? 3.6 + rng()*2.4 : 5.5 + rng()*2.5;
      if (yb + hb < wallTop){ const n = Math.max(1, Math.round(e.L/(12 + rng()*8))), bw = (e.L - 1)/n;
        for (let j = 0; j < n; j++){ const c = atE(e, 0.5 + bw*(j + 0.5), 0.45); if (nearSpec(c[0], c[1], 10)) continue;
          const ph = (Math.floor(rng()*7) + 0.62)/7.13;
          tsF({W:W1, V:j % 2 ? null : V1, x:c[0], y:c[1], nx:e.nx, ny:e.ny, hw:bw/2 - 0.15, y0:yb, y1:yb + hb, depth:0.45, sides:1, wall:1, cell:null, col:[[0.05, 0.05, 0.06], [1, 1, 1], [1, 1, 1]], lit:3, anim:0, ph, off:late(), halo:0.7}); }
        cnt('bill'); } }
    // the night market: bare warm bulbs over the stalls along the kerb, and their light on the street
    if (P.market){ const m = Math.max(1.2, Math.min(2.6, half - 1.2)), lo = offB(P.late[1]);
      penB([1, 0.78, 0.45], lo, P_DOTS, 0, Math.floor(rng()*255), 10); bEdge(V2, e, 0.3, e.L - 0.3, m, g + 2.45, g + 2.7, 0, 1);
      for (let s = 2; s < e.L - 1; s += 6){ const q = atE(e, s, m); gPool(V2, q[0], q[1], 3.2, [0.42, 0.3, 0.16], lo); }
      penPlain([0.2, 0.42, 0.3], NEVER, null, 0, 0); const c = atE(e, e.L/2, m*0.55);
      aBox(W2, c[0], c[1], e.ux, e.uy, Math.max(0.5, e.L/2 - 0.4), m*0.5, g + 2.75, g + 2.82, 16 | 32); cnt('market'); }
  }
  // the street faces of a building on a profiled street; true if any
  function neonBuilding(B, k, g, top, E, rng){
    if (top - g < 4) return 0;
    let n = 0;
    for (const e of E){ if (e.L < 3) continue;
      if (bldAt(e.mx + e.nx*1.2, e.my + e.ny*1.2, k, 2.5) >= 0) continue;
      const d = street(e.mx, e.my, e.nx, e.ny, e.ux, e.uy, e.L/2, 30, true); if (d === Infinity || !lastProf) continue;
      neonFace(B, k, e, d, lastOw, lastProf, g, top, rng); DONE.add(e); n++; }
    if (n){ cnt('neonbld'); ST.cat = 'neon'; }
    return n;
  }

  // ---- the sign specs ----
  function roofAt(x, y){ const c = gcy(y)*GN + gcx(x), L = BG.list; let best = -Infinity;
    for (let j = BG.start[c]; j < BG.start[c + 1]; j++){ const k = L[j], o = k*4; if (x < BBX[o] || x > BBX[o+2] || y < BBX[o+1] || y > BBX[o+3]) continue;
      const B = LIST[k]; if (!pip(B.rings[0], x, y) || (SKIP && SKIP(B))) continue; const g = GOFF[k] === GOFF[k] ? GOFF[k] : groundOf(B.rings[0]); if (g + B.h > best) best = g + B.h; }
    return best; }
  function lmTop(key, x, y){
    if (typeof SG_PLACES === 'undefined' || typeof LANDMARKS === 'undefined') return null;
    let best = null, bd = 1e9;
    for (const p of SG_PLACES){ if (key && p.type !== key) continue; const d = LANDMARKS[p.type]; if (!d || !d.h) continue; const q = sgXY(p.lat, p.lon), dd = Math.hypot(q[0] - x, q[1] - y); if (!key && dd > (d.r || 60)) continue; if (dd < bd){ bd = dd; best = {d, q}; } }
    if (!best) return null; const r = best.d.r || 40; let gm = -1e9;
    for (const f of [0, 0.35, 0.7]) for (let a = 0; a < 6.283; a += f ? 0.785 : 7) gm = Math.max(gm, hC(best.q[0] + Math.cos(a)*r*f, best.q[1] + Math.sin(a)*r*f));
    return gm + 0.6 + best.d.h;
  }
  // the facade nearest to (x, y) facing (nx, ny) within dmax: the point on it, or null
  function snapWall(x, y, nx, ny, dmax, perp){
    let best = null, bd = dmax;
    for (let cy = gcy(y - dmax); cy <= gcy(y + dmax); cy++) for (let cx = gcx(x - dmax); cx <= gcx(x + dmax); cx++){ const c = cy*GN + cx;
      for (let j = BG.start[c]; j < BG.start[c + 1]; j++){ const k = BG.list[j], o = k*4; if (x < BBX[o] - dmax || x > BBX[o+2] + dmax || y < BBX[o+1] - dmax || y > BBX[o+3] + dmax) continue;
        const R = LIST[k].rings[0], m = R.length >> 1;
        for (let i = 0; i < m; i++){ const i2 = (i + 1) % m, ax = R[i*2], ay = R[i*2+1], L = Math.hypot(R[i2*2] - ax, R[i2*2+1] - ay); if (L < 1) continue;
          const ux = (R[i2*2] - ax)/L, uy = (R[i2*2+1] - ay)/L, ex = uy, ey = -ux, dot = ex*nx + ey*ny;
          if (perp ? Math.abs(dot) > 0.45 : dot < 0.7) continue;
          const t = (x - ax)*ux + (y - ay)*uy; if (t < -0.5 || t > L + 0.5) continue;
          const dn = (x - ax)*ex + (y - ay)*ey; if (perp ? dn < -0.3 || dn > bd : Math.abs(dn) > bd) continue;
          bd = perp ? dn : Math.abs(dn); best = {x:ax + ux*t, y:ay + uy*t, ex, ey}; } } }
    return best;
  }
  function buildSpec(o){
    const S = o.S, kind = S.kind, w = S.w, h = S.h, lit = LIT[S.lit] !== undefined ? LIT[S.lit] : 1, anim = ANIM[S.anim] || 0, cell = HKA.spec[o.i];
    let W = WAs[1], V = WBs[0];
    let x = o.x, y = o.y, nx = o.nx, ny = o.ny;
    const fg = hex3(S.fg) || [1, 0.16, 0.16], col = [hex3(S.bg), fg, hex3(S.edge) || fg];
    const sides = S.sides || (kind === 'blade' || kind === 'over' ? 2 : 1);
    // height: on the roof (bld / lm / roof:true), else y above the ground
    let yc = null;
    if (S.roof || ((S.bld || S.lm) && S.y === undefined)){
      let t = -Infinity; if (S.bx !== undefined) t = roofAt(S.bx, S.by); if (t === -Infinity && !S.lm) t = roofAt(x, y);
      if (t === -Infinity || S.lm){ const q = lmTop(S.lm, x, y); if (q !== null) t = q; }
      if (t > -Infinity) yc = t + h/2 + (kind === 'roof' ? 1.0 : 0.12);
    }
    if (yc === null) yc = Math.max(hC(x, y), -0.3) + (S.y !== undefined ? S.y : h/2 + 3);
    const y0 = yc - h/2, y1 = yc + h/2;
    const depth = {wall:0.12, band:0.3, box:0.4, led:0.6, roof:0.35, letters:0, blade:0.3, over:0.3}[kind];
    let arm = null;
    if (kind === 'wall' || kind === 'box' || kind === 'led' || kind === 'band'){ const q = snapWall(x, y, nx, ny, 4); if (q){ x = q.x + q.ex*(depth + 0.04); y = q.y + q.ey*(depth + 0.04); } }
    else if (kind === 'blade' || kind === 'over'){ const q = snapWall(x, y, nx, ny, w/2 + 5, true);
      if (q){ let fx = -q.ey, fy = q.ex; if (fx*nx + fy*ny < 0){ fx = -fx; fy = -fy; } nx = fx; ny = fy; x = q.x + q.ex*(0.4 + w/2); y = q.y + q.ey*(0.4 + w/2); arm = q; } }
    const big = w*h >= 30 || kind === 'roof' || kind === 'letters' || kind === 'led';
    // the far tier (to ~15 km) for the harbour-front signs: roof frames, channel letters, screens, and any board >= 8 m wide or
    // > 25 m up; their glow in the board's plane (one-sided) or a halo (two-sided)
    const far = w >= 8 || kind === 'roof' || kind === 'letters' || kind === 'led' || y0 - Math.max(hC(x, y), -0.3) > 25;
    const WF = far ? WAs[0] : W; if (far) cnt('specfar');
    textSign({W:WF, V, haloW:big || far ? WBs[0] : WBs[1], rglow:far && sides === 1 ? WBs[0] : null, x, y, nx, ny, hw:w/2, y0, y1, depth, sides:kind === 'letters' ? (sides === 2 ? 2 : 1) : sides, cell, col, lit, anim, ph:((o.i*0.618) % 1),
      off:NEVER, frame:!!S.edge && kind !== 'letters' && kind !== 'led', vert:!!S.vert, bulbs:anim === 2, noBack:kind === 'letters' || !S.bg, halo:big ? 1.5 : 1, haloK:big ? 2.2 : 1, minPx:big ? 6 : 2});
    if (arm){ penPlain([0.22, 0.22, 0.23], NEVER, null, 0, 0); const b = [arm.x + arm.ex*0.2, arm.y + arm.ey*0.2];
      for (const yy of [y1 - 0.15, y0 + 0.15]) aBox(W, b[0], b[1], arm.ex, arm.ey, 0.24, 0.05, yy - 0.05, yy + 0.05, 1 | 2 | 16 | 32); }
    if (kind === 'roof'){
      // steel frame behind the board: posts down to the roof, two rails, a walkway
      const rx = -ny, ry = nx, base = y0 - 1.0; penPlain([0.26, 0.27, 0.29], NEVER, null, 0, 0);
      const np = Math.max(2, Math.round(w/5) + 1);
      for (let i = 0; i < np; i++){ const t = (i/(np - 1) - 0.5)*(w - 0.6), px = x + rx*t - nx*(depth + 0.6), py = y + ry*t - ny*(depth + 0.6);
        aBox(W, px, py, rx, ry, 0.12, 0.12, base, y1 - 0.3, 1 | 2 | 4 | 8);
        aBox(W, px + nx*0.3, py + ny*0.3, nx, ny, 0.4, 0.06, y0 - 0.1, y0 + 0.02, 1 | 2 | 16); }
      for (const yy of [y0 + h*0.25, y0 + h*0.75]) aBox(W, x - nx*(depth + 0.6), y - ny*(depth + 0.6), rx, ry, w/2, 0.06, yy - 0.06, yy + 0.06, 1 | 2 | 16 | 32);
      aBox(W, x + nx*0.35, y + ny*0.35, rx, ry, w/2, 0.35, y0 - 0.28, y0 - 0.2, 16 | 32);
    }
    cnt('spec'); if (STATS.sp && STATS.sp.length < 300) STATS.sp.push([S.id, Math.round(x), Math.round(y), +yc.toFixed(1), TI]);
  }
  function buildSpecs(ti){
    const L = SPECT.get(ti); if (!L) return;
    for (const o of L){ try { SGCURB = 65535; buildSpec(o); } catch (e){ (STATS.specErr || (STATS.specErr = [])).push(o.S.id + ': ' + e.message); } }
  }

  // ---- the harbour fronts: estimated rooftop signs on the towers facing the water (the hand-placed specs win) ----
  function harbourRoof(B, k, g, top, E, rng){
    const H = top - g; if (H < 22 || H > 140 || B.area < 260 || !HARB.some(b => B.cx > b[0] && B.cx < b[2] && B.cy > b[1] && B.cy < b[3])) return;
    if (rng() > 0.25) return;
    let e = null;
    for (const q of E){ if (q.L < 10) continue; let wet = 0; for (const d of [180, 380, 620]){ if (hC(q.mx + q.nx*d, q.my + q.ny*d) < -0.2) wet++; } if (wet >= 2 && (!e || q.L > e.L)) e = q; }
    if (!e || nearSpec(B.cx, B.cy, 250, true)) return;
    const w = Math.min(e.L*0.85, 10 + H*0.18, 32), hb = Math.max(2.4, Math.min(9, w/3.3)), c = atE(e, e.L/2, -2.4);
    if (!pip(B.rings[0], c[0], c[1]) || !pip(B.rings[0], ...atE(e, e.L/2 - w/2 + 0.3, -3.2)) || !pip(B.rings[0], ...atE(e, e.L/2 + w/2 - 0.3, -3.2))) return;
    const dl = DESG.corp.h, letters = rng() < 0.3, y0 = top + 1.0, col = pick(rng, SCHC.corp);
    textSign({W:WAs[0], V:WBs[0], rglow:WBs[0], x:c[0], y:c[1], nx:e.nx, ny:e.ny, hw:w/2, y0, y1:y0 + hb, depth:letters ? 0 : 0.35, sides:1, cell:HKA.des[pick(rng, dl)], col:letters ? [null, col[1], col[1]] : col, lit:letters ? 1 : 2, noBack:letters, anim:0, ph:rng(), off:offB(1.5 + rng()*2), frame:false, minPx:6, halo:1.5, haloK:2});
    if (STATS.hr && STATS.hr.length < 400) STATS.hr.push([Math.round(c[0]), Math.round(c[1]), Math.round(top)]);
    penPlain([0.26, 0.27, 0.29], NEVER, null, 0, 0);
    for (const t of [-0.38, 0, 0.38]){ const p = atE(e, e.L/2 + t*w, -3.1); aBox(WAs[1], p[0], p[1], e.ux, e.uy, 0.12, 0.12, top - 0.1, y0 + hb*0.7, 1 | 2 | 4 | 8); }
    cnt('harbroof');
  }

  // ---- public-housing style slabs: the open access corridors lit storey by storey on one long face ----
  function decorateEstate(B, g, top, E, rng){
    const F = frame(B.rings[0]); if (F.lu < 1.7*F.lv || F.lu < 24 || rng() > 0.4) return false;
    let e = null; for (const q of E) if (!e || q.L > e.L) e = q;
    const fh = 2.85, n = Math.floor((top - g - 3.6)/fh); if (n < 6 || !e) return false;
    if (rng() < 0.5){ let o = null; for (const q of E) if (q !== e && q.L > e.L*0.8 && q.nx*e.nx + q.ny*e.ny < -0.8) o = q; if (o) e = o; }
    penB(rng() < 0.6 ? [0.78, 0.88, 1.0] : [0.95, 0.95, 0.9], NEVER, P_HDB, 0, Math.floor(rng()*255), 0);
    bEdge(WBs[1], e, 0.6, e.L - 0.6, 0.22, g + 3.4, g + 3.4 + n*fh, 0, n);
    cnt('estate'); return true;
  }

  // triangles written so far (all writers): per-feature triangle statistics
  const triNow = () => (WAs[0].ni + WAs[1].ni + WAs[2].ni + WBs[0].ni + WBs[1].ni + WBs[2].ni)/3;
  function decorate(B, k, rng){
    SGCURB = (B.i !== undefined ? B.i : k) & 65535; DONE.clear();
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
    const neon = PGN && base <= 1 && !B.foreign ? neonBuilding(B, k, g, top, E, rng) : 0;
    if (free && !neon && HARB.length) harbourRoof(B, k, g, top, E, rng);
    const lu = typeof sgLU === 'function' ? sgLU(B.cx, B.cy) : 0;
    const hotel = t === 12 || poi === 2;
    const mall = h <= 70 && ((poi === 1 && B.area >= 600) || (t === 4 && (B.area >= 4000 || (B.area >= 2000 && h >= 15))) || (t === 0 && lu === 2 && B.area >= 5000 && h >= 12));
    if (mall && !neon){ decorateMall(B, k, g, y0, top, E, rng, inHub(B.cx, B.cy), cl); if (h < 50) return; }
    if (h >= 50 && free && B.area >= 60 && (t === 0 || t === 4 || t === 5 || t === 12)){ decorateTower(B, k, g, y0, top, E, rng, hotel, cl); return; }
    if (t === 2 && h >= 25 && free){ if (!neon && !distOf(B.cx, B.cy) && decorateEstate(B, g, top, E, rng)) return; if (h >= 30) decorateCondo(B, top, E, rng); return; }
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
      if (p > 0 && !neon) decorateShops(B, k, g, top, E, rng, D, p);
    }
  }

  // ---------------- per tile: a job decorates its buildings in slices (a few ms per frame), then packs the meshes ----------------
  let POIK = new Map();
  function begin(job){
    if (!ready) init();
    const T = job.T, list = job.list;
    OX = T.cx; OY = T.cy;
    for (const w of WAs){ w.nv = 0; w.ni = 0; } for (const w of WBs){ w.nv = 0; w.ni = 0; }
    ST = {}; job.k = 0; job.ms = 0; DECKS = new Map(); SKIP = job.skip; OCC = new Map(); treesOf(T);
    prepTile(T.ti, list);
    if (!HKA) mats();
    buildSpecs(T.ti);
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
        let go = t === 1 || h >= 50 || t === 4 || t === 12 || t === 8 || (t === 2 && h >= 25) || POIK.has(k) || (PGN && h >= 4 && nearProf(k));
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
  const ATTR_A = [['P', 3, Float32Array], ['N', 3, Int8Array], ['T', 2, Float32Array], ['K', 4, Float32Array], ['D', 4, Uint8Array], ['E', 4, Uint8Array], ['CU', 2, Float32Array], ['RC', 4, Float32Array], ['FX', 4, Uint8Array], ['Bi', 1, Uint16Array]];
  const ATTR_B = [['P', 3, Float32Array], ['T', 2, Float32Array], ['C', 4, Uint8Array], ['M', 4, Uint8Array], ['Bi', 1, Uint16Array]];

  // ---------------- materials ----------------
  function mats(){
    if (MA) return;
    // [lm28/ruin] the dead flags of bld.js (destroyed buildings): their signs, screens, outlines and lights go with them
    const SGKD = typeof SGBld !== 'undefined' && SGBld.kd && SGBld.kd.dead ? SGBld.kd.dead : null;
    const SGKD_PARS = SGKD ? 'attribute float aBid;\n' + SGKD.glsl : '', SGKD_HIDE = SGKD ? '\nif (kdgDead(vec3(modelMatrix[3][0], modelMatrix[3][1], modelMatrix[3][2]), aBid) > 0.5) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);\n' : '';
    SGA = makeAtlas();
    const sgTex = new THREE.CanvasTexture(SGA.cv); sgTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    { const t = now(); HKA = makeTextAtlas(); STATS.atlasMs = +(now() - t).toFixed(1); STATS.atlas = [HKA.W, HKA.H, HKA.used]; }
    HKTEX = new THREE.CanvasTexture(HKA.cv); HKTEX.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); HKTEX.minFilter = THREE.LinearMipmapLinearFilter;
    MA = new THREE.MeshLambertMaterial({map:adTex, polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-4});
    MA.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, ADU, {uSgTex:{value:sgTex}, uHkTex:{value:HKTEX}, uSN:U.uSN, uLH:U.uLH}, SGKD ? SGKD.u : {});
      const f = v => v.toFixed(6), reg = (R, W) => `{ R = vec4(${f(R.x/W)}, ${f(1 - R.y/W)}, ${f(R.w/W)}, ${f(R.h/W)}); C = ${R.c}.0; NN = ${R.n}.0; }`, G = ADATLAS.REG, W1 = ADATLAS.W, S = SGA.REG, W2 = SGA.W;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
attribute vec4 adk;
attribute vec4 aDay;
attribute vec4 aEm;
attribute vec2 aCu;
attribute vec4 aRc;
attribute vec4 aFx;
uniform float uAdT;
uniform float uSN;
uniform float uLH;
varying vec4 vCell;
varying vec4 vAdF;
varying vec3 vDay;
varying vec4 vEm;
varying vec4 vX;
varying vec4 vK9;
vec3 sgHue(float h){ return clamp(abs(mod(h*6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }`)
        .replace('#include <uv_vertex>', `vUv = uv;
  vK9 = adk; vX = vec4(aCu, 0.0, 0.0);
  if (adk.x > 8.5){ vCell = aRc; vAdF = aFx; vDay = aDay.rgb; vEm = aEm; vX.z = aDay.a > 0.998 ? 1.0 : step(uLH, aDay.a*8.0); }
  else { float kind = adk.x, idx = adk.y, fl = 1.0, C = 1.0, NN = 1.0, src = 0.0; vec4 R = vec4(0.0, 1.0, 0.01, 0.01);
    if (kind < 0.5) ${reg(G.L, W1)} else if (kind < 1.5) ${reg(G.P, W1)} else if (kind < 2.5) ${reg(G.B, W1)} else if (kind < 3.5) ${reg(G.S, W1)} else if (kind < 4.5) ${reg(G.T, W1)}
    else if (kind > 5.5){ src = 1.0; if (kind < 6.5) ${reg(S.S, W2)} else if (kind < 7.5) ${reg(S.B, W2)} else ${reg(S.E, W2)} }
    if (adk.z > 1.5){ float tt = uAdT/6.5 + adk.w; idx = mod(idx + floor(mod(tt, adk.z)), NN); fl = 0.25 + 0.75*smoothstep(0.0, 0.05, fract(tt)); }
    float col = mod(idx, C), row = floor((idx + 0.5)/C);
    vCell = vec4(R.x + col*R.z, R.y - (row + 1.0)*R.w, R.z, R.w);
    vAdF = vec4(fl, step(3.5, kind)*step(kind, 4.5), src, step(4.5, kind)*step(kind, 5.5));
    vX.z = aDay.a > 0.998 ? 1.0 : step(uLH, aDay.a*8.0);
    vDay = aDay.rgb;
    float m = floor(aEm.a*255.0/32.0 + 0.01), ph = mod(floor(aEm.a*255.0 + 0.5), 32.0)/32.0, k = 1.0;
    vec3 e = aEm.rgb;
    if (m > 0.5 && m < 1.5) e = sgHue(fract(uAdT*0.05 + ph))*max(e.r, max(e.g, e.b));
    else if (m > 1.5 && m < 2.5) k = 0.72 + 0.28*sin(uAdT*1.1 + ph*6.2832);
    else if (m > 2.5 && m < 3.5) k = 0.72 + 0.28*step(0.1, fract(sin(floor(uAdT*8.0) + ph*97.0)*43758.55));
    else if (m > 3.5 && m < 4.5){ float q = fract(uAdT/3.0); k = smoothstep(0.0, 0.04, q)*(1.0 - smoothstep(0.42, 0.5, q)); }
    vEm = vec4(e*k*uSN*vX.z, 0.0); }`).replace('#include <common>', '#include <common>\n' + SGKD_PARS).replace('#include <project_vertex>', '#include <project_vertex>\nvX.w = -mvPosition.z;' + SGKD_HIDE);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform sampler2D uSgTex;
uniform float uAdT;
uniform float uAdGlow;
uniform float uAdDiff;
uniform sampler2D uHkTex;
uniform float uSN;
varying vec4 vCell;
varying vec4 vAdF;
varying vec3 vDay;
varying vec4 vEm;
varying vec4 vX;
varying vec4 vK9;
vec3 hkHue(float h){ return clamp(abs(mod(h*6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
// abstract LED video (metres from the screen centre p, half sizes hw / hh): colour waves, bars, invented-advert panels, rings
vec3 hkScreen(vec2 p, float hw, float hh, float T, float ph){
  vec2 gq = p/0.2, c = floor(gq), f = fract(gq) - 0.5;
  float px = max(fwidth(gq.x), fwidth(gq.y));
  float dots = mix(1.0 - smoothstep(0.32, 0.46, max(abs(f.x), abs(f.y))), 0.78, clamp(px - 0.3, 0.0, 1.0));
  vec2 q = c*0.2/vec2(hw, hh);
  float st = floor(fract(ph*7.13)*4.0), ti = floor(T/6.0 + ph*5.0), tf = fract(T/6.0 + ph*5.0);
  vec3 col;
  if (st < 0.5){ float w = sin(q.x*3.0 + q.y*2.0 - T*1.3 + ph*6.0); col = hkHue(fract(q.x*0.12 + T*0.03 + ph))*(0.3 + 0.7*smoothstep(-0.3, 0.9, w)); }
  else if (st < 1.5){ float b = floor((q.x + 1.0)*6.0), hg = 0.5 + 0.5*sin(T*2.0 + b*1.7 + ph*9.0); col = hkHue(fract(b*0.08 + ph))*step(q.y*0.5 + 0.5, hg)*0.9 + 0.04; }
  else if (st < 2.5){
    vec3 c1 = hkHue(fract(ti*0.31 + ph)), c2 = hkHue(fract(ti*0.31 + ph + 0.5));
    col = mix(c1*0.7, c2*0.8, step(q.x*0.6 + q.y*0.4, sin(ti*1.7)*0.3)); col = mix(col, vec3(0.95), step(abs(q.y + 0.66), 0.14));
    col *= 0.12 + 0.88*smoothstep(0.0, 0.05, tf)*(1.0 - smoothstep(0.95, 1.0, tf));
  } else { float d = q.x*0.7 + q.y*0.5; col = hkHue(fract(d*0.15 - T*0.05 + ph))*(0.4 + 0.6*smoothstep(-0.2, 0.8, sin(d*6.0 - T*1.8))); }
  return col*dots;
}`)
        .replace('#include <map_fragment>', `vec3 sgT0 = vec3(0.0), hkE = vec3(0.0);
  if (vK9.x > 8.5){
    // ---- Hong Kong text signs (kind 9) ----
    float al = floor(vK9.y + 0.5), lit = mod(al, 8.0), an = floor(al/8.0 + 0.01), ph = vK9.z, T = uAdT;
    float hw = max(mod(vK9.w, 1024.0), 1.0)/8.0, hh = max(floor(vK9.w/1024.0 + 0.001), 1.0)/8.0;
    float fl = floor(vEm.a*255.0 + 0.5);
    float noBack = mod(fl, 2.0), hasSub = mod(floor(fl/2.0), 2.0), frm = mod(floor(fl/4.0), 2.0), vrt = mod(floor(fl/8.0), 2.0), bulbs = mod(floor(fl/16.0), 2.0), hasTx = mod(floor(fl/32.0), 2.0);
    vec2 cu = vX.xy;
    if (an > 3.5 && an < 4.5) cu.x = fract(cu.x - T*0.1 + ph);
    float ins = hasTx*step(0.0, cu.x)*step(cu.x, 1.0)*step(0.0, cu.y)*step(cu.y, 1.0);
    vec3 mk = texture2D(uHkTex, vCell.xy + clamp(cu, 0.004, 0.996)*vCell.zw).rgb*ins;
    vec3 bg = vDay, fg = vEm.rgb, ed = vAdF.rgb;
    vec3 lc = (hasSub > 0.5 && cu.y < vAdF.a) ? ed : fg;
    if (an > 4.5 && an < 5.5) lc = hkHue(fract(T*0.07 + ph + cu.x*0.3))*max(max(lc.r, lc.g), max(lc.b, 0.6));
    vec2 pm = (vUv - 0.5)*2.0*vec2(hw, hh);
    float dE = min(hw - abs(pm.x), hh - abs(pm.y));
    float tw = clamp(min(hw, hh)*0.07, 0.04, 0.3), fwE = max(fwidth(dE), 1e-4);
    float ring = 1.0 - smoothstep(tw*0.4, tw*0.4 + fwE*1.5, abs(dE - tw*1.5));
    float sP = atan(pm.y/hh, pm.x/hw)*(hw + hh)*0.6366;
    float bsp = clamp(min(hw, hh)*0.22, 0.18, 0.6), bq = abs(fract(sP/bsp) - 0.5);
    float bul = (1.0 - smoothstep(0.16, 0.3, bq))*(1.0 - smoothstep(tw*0.9, tw*0.9 + fwE*1.5, abs(dE - tw*1.5)));
    float chase = (an > 1.5 && an < 2.5) ? 0.12 + 0.88*step(0.5, fract(sP/(bsp*3.0) - T*1.8)) : 1.0;
    float fr = bulbs > 0.5 ? bul*chase : frm*ring;
    float a = clamp(mk.r*1.2, 0.0, 1.0);
    vec3 dc = mix(bg, lc, a);
    dc = mix(dc, ed*0.9 + 0.1, clamp(fr, 0.0, 1.0)*(bulbs > 0.5 ? 0.6 : 0.85));
    if (noBack > 0.5){ if (max(mk.r, mk.g) < 0.35) discard; dc = lc; }
    float k = 1.0;
    if (an > 0.5 && an < 1.5) k = 0.08 + 0.92*step(0.3, fract(T/1.8 + ph));
    float qa = vrt > 0.5 ? 1.0 - cu.y : cu.x, sq = fract(T/5.5 + ph), sk = 1.0;
    if (an > 2.5 && an < 3.5) sk = sq < 0.6 ? step(qa, sq*1.8) : (sq < 0.85 ? 1.0 : step(0.5, fract(sq*26.0)));
    vec3 E = vec3(0.0);
    if (lit > 0.5 && lit < 1.5){ E = ((lc*(mk.r*0.6 + mk.g*1.5) + lc*mk.b*(1.0 - a)*0.5)*sk + ed*fr*1.6 + bg*0.05)*k; }
    else if (lit > 1.5 && lit < 2.5){ E = (dc*0.85 + lc*mk.b*(1.0 - a)*0.12)*k*mix(1.0, sk, 0.85) + ed*fr*(bulbs > 0.5 ? 1.4 : 0.35); }
    else if (lit > 2.5 && lit < 3.5){ vec3 sc = an > 4.5 && an < 5.5 ? hkHue(fract(pm.y/(2.0*hh)*0.8 + pm.x*0.02 - T*0.07 + ph))*0.9 : hkScreen(pm, hw, hh, an > 0.5 ? T : ph*97.0 + 3.0, ph); E = mix(sc, lc*1.25, a*0.9); dc = vec3(0.05); }
    else if (lit > 3.5){ E = dc*0.42; }
    float farK = 1.0 + 1.8*smoothstep(250.0, 2500.0, vX.w);
    hkE = E*vX.z*farK*((lit > 2.5 && lit < 3.5) ? 0.45 + 0.55*uSN : uSN);
    diffuseColor.rgb = dc;
  } else {
  vec2 adSt = vUv; if (vAdF.y > 0.5) adSt.x = fract(adSt.x + uAdT*0.04);
  adSt = clamp(adSt, 0.002, 0.998);
  vec2 sgUv = vCell.xy + adSt*vCell.zw;
  sgT0 = mix(mapTexelToLinear(texture2D(map, sgUv)).rgb, texture2D(uSgTex, sgUv).rgb, vAdF.z);
  diffuseColor.rgb *= vDay*mix(sgT0*uAdDiff*vAdF.x, vec3(1.0), vAdF.w); }`)
        .replace('#include <emissivemap_fragment>', 'totalEmissiveRadiance = vK9.x > 8.5 ? hkE : sgT0*vDay*(uAdGlow*vAdF.x*vX.z*(1.0 - vAdF.w)) + vEm.rgb;');
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
  else if (an > 6.5 && an < 7.5) on *= smoothstep(350.0, 1300.0, -mv.z)*(1.0 + 0.8*smoothstep(1500.0, 5000.0, -mv.z));      // the district glow: only from afar, stronger far away
  else if (an > 7.5 && an < 8.5) on *= 0.2 + 1.5*smoothstep(250.0, 3500.0, -mv.z);   // board glow: a rim near by, a glowing block from afar
  if ((pat > 4.5 && pat < 5.5) || (pat > 9.5 && pat < 11.5)) on = uSN;
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
  } else if (pat > 12.5){
    // glow round a board in its plane (uv -1..1; the board inside |u| < rx, |v| < ry)
    vec2 rr = vec2(vM.z, vM.w)/255.0, q = max(abs(vUV) - rr, 0.0)/max(vec2(1.0) - rr, vec2(0.05));
    float d = min(length(q), 1.0); I = pow(1.0 - d, 1.6)*(d > 0.0 ? 0.85 : 0.35);
  } else if (pat > 11.5){
    // coloured light of the signs on the street (uv -1..1 over a square)
    float r = dot(vUV, vUV); I = max(0.0, 1.0 - r); I = I*I*0.42;
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
    if (kind === 'A'){ g.setAttribute('normal', new THREE.BufferAttribute(o.N, 3, true)); g.setAttribute('uv', new THREE.BufferAttribute(o.T, 2)); g.setAttribute('adk', new THREE.BufferAttribute(o.K, 4)); g.setAttribute('aDay', new THREE.BufferAttribute(o.D, 4, true)); g.setAttribute('aEm', new THREE.BufferAttribute(o.E, 4, true)); g.setAttribute('aCu', new THREE.BufferAttribute(o.CU, 2)); g.setAttribute('aRc', new THREE.BufferAttribute(o.RC, 4)); g.setAttribute('aFx', new THREE.BufferAttribute(o.FX, 4, true)); }
    else { g.setAttribute('aUV', new THREE.BufferAttribute(o.T, 2)); g.setAttribute('aCol', new THREE.BufferAttribute(o.C, 4, true)); g.setAttribute('aMd', new THREE.BufferAttribute(o.M, 4)); }
    if (o.Bi) g.setAttribute('aBid', new THREE.BufferAttribute(o.Bi, 1));
    g.setIndex(new THREE.BufferAttribute(pk.I, 1));
    g.computeBoundingSphere(); if (kind === 'B') g.boundingSphere.radius += 40;
    for (const k in g.attributes) g.attributes[k].onUpload(dropArr); g.index.onUpload(dropArr);
    const m = new THREE.Mesh(g, mat); m.userData.ends = pk.ends; m.name = 'hksigns' + kind;
    m.position.set(OX, 0, -OY); m.matrixAutoUpdate = false; m.updateMatrix();
    if (kind === 'B'){ m.renderOrder = 5; m.frustumCulled = true; }
    return m;
  }
  // the tile hook only queues a job and returns its (still empty) group; frameHook builds the jobs within a time budget per frame
  const JOBS = []; let cur = null;
  function applyLod(grp){ const d = grp.userData.d; if (d === undefined) return; const t = d < TIER_D[2] ? 2 : d < TIER_D[1] ? 1 : d < TIER_D[0] ? 0 : -1;
    for (const m of grp.children){ const n = t < 0 ? 0 : m.userData.ends[t]; m.visible = n > 0; m.geometry.setDrawRange(0, n); } }
  function tileHook(T, list, skip){
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
    pump(API.eager ? Infinity : Math.max(3, Math.min(12, dt*0.25)));       // eager: tests build every queued tile at once
  }
  function time(tod, nf){
    U.uSN.value = sm(0.05, 0.6, nf);
    const t = tod < 12 ? tod + 24 : tod; U.uLH.value = Math.max(0, t - 22);
    if (MB) MB.visible = U.uSN.value > 0.002;
  }
  const API = {tileHook, time, frameHook, arrays, pack, flush:() => pump(Infinity), prewarm:() => { const t = now(); mats(); STATS.matsMs = +(now() - t).toFixed(1); }, get pending(){ return JOBS.length + (cur ? 1 : 0); }, WAs, WBs, ATTR_A, ATTR_B, STATS, U, TIER_D, FLV, DIST, HUB, get atlas(){ return SGA && SGA.cv; }, dbg:null, eager:false, version:'hksigns-1', SP, DES, get textAtlas(){ return HKA && HKA.cv; }, get specs(){ return SPECS; }, nearSpec};
  return API;
})();
if (typeof HOOKS !== 'undefined'){
  HOOKS.tile.push((T, list, skip) => SGSigns.tileHook(T, list, skip));
  HOOKS.time.push((tod, nf) => SGSigns.time(tod, nf));
  HOOKS.frame.push(() => SGSigns.frameHook());
  // draw the atlases and make the materials during start-up (not in the middle of the first tile)
  HOOKS.boot.push(() => SGSigns.prewarm());
}
if (typeof window !== 'undefined'){ window.SGSigns = SGSigns; window.HKSigns = SGSigns; }
if (typeof module !== 'undefined' && typeof window === 'undefined') module.exports = SGSigns;
}
