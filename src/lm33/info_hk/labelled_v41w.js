// Hong Kong intro-card texts for the v41 west-island keys (hk/hkv41w, 7 keys). Original writing, in the labelled_v39.js format.
// No network was available for this round, so the cards carry no years, architects, heights or floor counts: only where the
// building stands (map data), what it is (map POIs / well-known official names) and what the model shows. Tower and tier counts
// are the footprints and building parts in the app's building data. Not yet merged by build.js (the integrator adds it).
const K = (zh, en) => ({zh, en});
const D = (zh, en) => ({zh, en});
module.exports = {
hk41w_stanchart: {k:K('办公大楼','Office tower'),
  d:D('渣打银行大厦位于中环德辅道中，紧挨着汇丰总行大厦的西侧，是渣打银行在香港的总部。大楼由下而上分成几段逐级后退，像一级级的台阶，外墙是带竖向窗条的石材，顶部有一座小塔楼和桅杆，在皇后像广场一带的高楼中很容易认出。',
      'The Standard Chartered Bank Building stands on Des Voeux Road Central, right next to the west side of the HSBC Main Building, and is the bank\'s Hong Kong headquarters. The tower steps back in several tiers as it rises, like a flight of stairs, with stone walls and vertical strips of windows, and ends in a small lantern and mast.')},
hk41w_landmark: {k:K('商业综合体','Mixed-use complex'),
  d:D('置地广场位于中环毕打街、德辅道中和皇后大道中之间，是一个高级购物商场和写字楼综合体。商场之上立着告罗士打大厦和公爵大厦两座方形塔楼，置地文华东方酒店也在这里。四周有天桥连接附近的大厦，是中环步行网络的中心之一。',
      'The Landmark sits between Pedder Street, Des Voeux Road Central and Queen\'s Road Central in Central: a luxury shopping mall with offices above. Two square towers, Gloucester Tower and Edinburgh Tower, rise from the mall podium, and the Landmark Mandarin Oriental hotel is part of the complex. Footbridges tie it to the neighbouring buildings of Central.')},
hk41w_belchers: {k:K('住宅屋苑','Residential estate'),
  d:D('宝翠园位于西环薄扶林道与卑路乍街一带，是一个大型私人住宅屋苑。六座高耸的住宅大楼建在依山而建的平台上，平台顶上铺设园林。屋苑居高临下，可以远望维多利亚港西面的海景，是坚尼地城和西营盘之间最显眼的高楼群。',
      'The Belcher\'s is a large private housing estate on Pok Fu Lam Road and Belcher\'s Street in Sai Wan, on the western edge of Hong Kong Island. Six tall residential towers stand on a podium built into the hillside, with gardens laid out on its roof. The towers look out over the western harbour and are the most prominent group of high-rises between Kennedy Town and Sai Ying Pun.')},
hk41w_fourseasons: {k:K('酒店及服务式住宅','Hotel and serviced apartments'),
  d:D('四季酒店和四季汇位于中环填海区的金融街，就在国际金融中心一期和国际金融中心商场旁边，离香港站和中环码头都只有几步路。较高的一座是服务式住宅，较低的一座是酒店，两座大楼外墙是浅色石材框架配蓝灰色玻璃，从维港望去与国金中心连成一片。',
      'The Four Seasons Hotel and Four Seasons Place stand on Finance Street on the Central reclamation, next to One IFC and the IFC Mall and a few steps from Hong Kong Station and the Central Piers. The taller block holds serviced apartments and the lower one the hotel; both have pale stone frames with blue-grey glass and read as part of the IFC group from the harbour.')},
hk41w_centralmkt: {k:K('历史建筑','Historic building'),
  d:D('中环街市位于皇后大道中与德辅道中之间，是一座长方形的街市大楼，外墙有长长的横向窗带，带有现代主义风格。它过去是中环的街市，后来经过活化，变成开放给市民的购物和休闲空间。旁边就是通往半山的中环至半山自动扶梯。',
      'Central Market is a long, rectangular market hall between Queen\'s Road Central and Des Voeux Road Central, with long horizontal bands of windows in a modernist style. It was for many years the wet market of Central and has since been revitalised as a public space for shops and leisure. The Central to Mid-Levels escalator starts beside it.')},
hk41w_swmsb: {k:K('政府大楼','Government building'),
  d:D('上环市政大厦位于上环皇后大道中西端，是一座宽大的市政大楼，里面设有上环文娱中心等公共设施，为附近居民提供服务。大楼外墙是灰白色的混凝土和横向窗带，地面一层临街开放，离西港城和港澳码头都不远。',
      'The Sheung Wan Municipal Services Building is a broad civic block at the western end of Queen\'s Road Central in Sheung Wan. It houses public facilities for the neighbourhood, among them the Sheung Wan Civic Centre. The block has grey-white concrete walls with horizontal bands of windows and an open street level, a short walk from Western Market and the Macau Ferry Terminal.')},
hk41w_threepp: {k:K('办公大楼','Office tower'),
  d:D('太古广场三座位于金钟东端的皇后大道东，与太古广场的商场和酒店同属一个名字的建筑群，就在它们东面不远处。大楼是一座以蓝灰色玻璃幕墙包裹的写字楼，楼顶内收并在夜间亮起一圈灯光，从金钟道和湾仔一带都能望见。',
      'Three Pacific Place stands on Queen\'s Road East at the eastern edge of Admiralty. It shares its name with the Pacific Place mall and hotels and stands a short distance east of them. The office tower is wrapped in a blue-grey glass curtain wall, with a recessed top that carries a ring of light at night, visible from Queensway and from Wan Chai.')},
};
