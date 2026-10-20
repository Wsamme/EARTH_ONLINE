# Chinese (Simplified) labels for Tokyo from the Japanese OSM names (v37).
# Rule (brief): name:zh-Hans / name:zh if present; else the Japanese name when it is all kanji (Japanese shinjitai -> traditional
# forms by the table below, then opencc t2s -> Simplified; e.g. 東京駅 -> 东京站); else a small dictionary of well-known names
# written in kana; else the English name. English: name:en, then name:ja-Latn / name:ja_rm.
# Normalisation of the kanji names (how Chinese texts write Japanese place names): the small ヶ / ケ / が between kanji is dropped
# (霞ヶ関 -> 霞关, 市ヶ谷 -> 市谷), ノ / の between kanji becomes 之 (虎ノ門 -> 虎之门, 井の頭 -> 井之头), 々 repeats the
# previous kanji (代々木 -> 代代木), 駅 -> 站, 丁目 is kept.
import re
import opencc
_T2S = opencc.OpenCC('t2s')
# Japanese shinjitai -> traditional (only characters that differ and that opencc's t2s then maps to the right Simplified form)
_A = ('亜悪圧囲医為壱隠営衛駅円塩縁艶応欧殴桜奥横温穏仮価画会壊懐絵拡殻覚学岳楽渇缶巻陥勧寛関歓観気帰戯犠旧拠挙峡挟狭郷暁区駆勲径茎恵掲渓経蛍軽継鶏芸撃県倹剣険圏検献権顕験厳広効恒黄鉱号国黒砕済斎剤桟惨賛残糸歯児辞湿実写釈寿収従渋獣縦粛処緒叙奨将焼称証乗浄剰畳縄壌嬢譲醸触嘱真寝慎尽図粋酔随髄数枢瀬声静斉摂窃専浅戦践銭潜繊禅双壮争荘捜挿巣装総騒増蔵臓即属続堕対体帯滞滝択沢担単胆団弾断痴遅昼虫鋳庁聴鎮逓鉄転点伝党盗灯当闘徳独読届弐悩脳廃売麦発髪抜晩蛮秘浜瓶払仏並変辺舗歩穂宝豊翻毎万満麺黙弥訳薬与誉揺様謡来頼乱覧竜両猟緑塁涙励戻霊齢暦歴恋錬炉労郎楼録湾塚槙郞薫')
_B = ('亞惡壓圍醫爲壹隱營衞驛圓鹽緣艷應歐毆櫻奧橫溫穩假價畫會壞懷繪擴殼覺學嶽樂渴罐卷陷勸寬關歡觀氣歸戲犧舊據擧峽挾狹鄉曉區驅勳徑莖惠揭溪經螢輕繼鷄藝擊縣儉劍險圈檢獻權顯驗嚴廣效恆黃鑛號國黑碎濟齋劑棧慘贊殘絲齒兒辭濕實寫釋壽收從澀獸縱肅處緖敍奬將燒稱證乘淨剩疊繩壤孃讓釀觸囑眞寢愼盡圖粹醉隨髓數樞瀨聲靜齊攝竊專淺戰踐錢潛纖禪雙壯爭莊搜插巢裝總騷增藏臟卽屬續墮對體帶滯瀧擇澤擔單膽團彈斷癡遲晝蟲鑄廳聽鎭遞鐵轉點傳黨盜燈當鬥德獨讀屆貳惱腦廢賣麥發髮拔晚蠻祕濱甁拂佛竝變邊舖步穗寶豐飜每萬滿麵默彌譯藥與譽搖樣謠來賴亂覽龍兩獵綠壘淚勵戾靈齡曆歷戀鍊爐勞郞樓錄灣冢槇郎薰')
assert len(_A) == len(_B), (len(_A), len(_B))
_K2T = str.maketrans(_A, _B)
_KANJI = re.compile(r'^[㐀-䶿一-鿿豈-﫿々〆0-9０-９・ 　\-－]+$')
# well-known names written (partly) in kana or katakana
DICT = {
 'お台場':'台场', '台場':'台场', 'みなとみらい':'港未来', 'みなとみらい21':'港未来21', 'さいたま市':'埼玉市', 'さいたま新都心':'埼玉新都心', 'さいたま':'埼玉',
 '東京スカイツリー':'东京晴空塔', '東京タワー':'东京塔', '東京ディズニーランド':'东京迪士尼乐园', '東京ディズニーシー':'东京迪士尼海洋', '東京ディズニーリゾート':'东京迪士尼度假区',
 '東京ビッグサイト':'东京国际展示场', '幕張メッセ':'幕张展览馆', '六本木ヒルズ':'六本木新城', '東京ミッドタウン':'东京中城', '虎ノ門ヒルズ':'虎之门之丘', '横浜ランドマークタワー':'横滨地标大厦',
 'レインボーブリッジ':'彩虹桥', '東京ゲートブリッジ':'东京门大桥', '横浜ベイブリッジ':'横滨海湾大桥', '鶴見つばさ橋':'鹤见翼桥', '東京湾アクアライン':'东京湾跨海公路', 'アクアライン':'东京湾跨海公路',
 '海ほたる':'海萤火虫', '海ほたるパーキングエリア':'海萤火虫服务区', 'ゆりかもめ':'百合海鸥线', '東京モノレール':'东京单轨电车', '東京モノレール羽田空港線':'东京单轨电车羽田机场线',
 'りんかい線':'临海线', 'つくばエクスプレス':'筑波快线', '東京さくらトラム':'东京樱花电车', 'ディズニーリゾートライン':'迪士尼度假区线', '金沢シーサイドライン':'金泽海岸线',
 'ニューシャトル':'新穿梭', 'みなとみらい線':'港未来线', 'ブルーライン':'蓝线', 'グリーンライン':'绿线', 'ゆりかもめ東京臨海新交通臨海線':'百合海鸥线', '日暮里・舎人ライナー':'日暮里·舍人线',
 '上野動物園':'上野动物园', 'サンシャイン60':'阳光60大厦', 'サンシャインシティ':'阳光城', '東京ドーム':'东京巨蛋', '新宿御苑':'新宿御苑', '明治神宮':'明治神宫', '皇居':'皇居',
 '浅草寺':'浅草寺', '築地':'筑地', '豊洲市場':'丰洲市场', '横浜スタジアム':'横滨体育场', '日産スタジアム':'日产体育场', '味の素スタジアム':'味之素体育场', 'さいたまスーパーアリーナ':'埼玉超级竞技场',
 '赤レンガ倉庫':'红砖仓库', '横浜赤レンガ倉庫':'横滨红砖仓库', '山下公園':'山下公园', '横浜中華街':'横滨中华街', 'よこはまコスモワールド':'横滨宇宙世界', 'ららぽーと':'LaLaport',
 '東京湾':'东京湾', '羽田空港':'羽田机场', '東京国際空港':'东京国际机场', '東京国際空港（羽田空港）':'东京国际机场（羽田）', '葛西臨海公園':'葛西临海公园', '夢の島':'梦之岛', '夢の島公園':'梦之岛公园',
 '井の頭恩賜公園':'井之头恩赐公园', '首都高速道路':'首都高速道路', 'ふなばしアンデルセン公園':'船桥安徒生公园', 'としまえん':'丰岛园', 'よみうりランド':'读卖乐园', 'こどもの国':'儿童之国',
 '八景島シーパラダイス':'八景岛海岛乐园', '横浜・八景島シーパラダイス':'横滨八景岛海岛乐园', 'ズーラシア':'横滨动物园', 'よこはま動物園ズーラシア':'横滨动物园', '東京ゲートブリッジ':'东京门大桥',
 'かつしかハープ橋':'葛饰竖琴桥', '扇大橋':'扇大桥', 'あらかわ遊園':'荒川游园', 'しながわ水族館':'品川水族馆', 'すみだ水族館':'墨田水族馆', 'サンシャイン水族館':'阳光水族馆',
 '葛西臨海水族園':'葛西临海水族园', 'マクセル アクアパーク品川':'品川水族馆', 'チームラボプラネッツ TOKYO DMM':'teamLab Planets', 'ヴィーナスフォート':'维纳斯城堡',
}
def _norm(s):
    s = s.strip()
    s = re.sub(r'(?<=[一-鿿])[ヶケが](?=[一-鿿])', '', s)
    s = re.sub(r'(?<=[一-鿿])[ノの](?=[一-鿿])', '之', s)
    s = re.sub(r'(.)々', r'\1\1', s)
    s = s.replace('〆', '')
    return s
def kanji_zh(s):
    """the Simplified Chinese form of an all-kanji Japanese name, else None"""
    if not s: return None
    s = _norm(s)
    pre = ''
    m = re.match(r'^(JR|ＪＲ)\s*', s)
    if m: pre = 'JR '; s = s[m.end():]
    if not s or not _KANJI.match(s) or not re.search(r'[一-鿿]', s): return None
    s = s.replace('駅', '站').replace('　', ' ')
    s = s.translate(_K2T)
    out = _T2S.convert(s)
    return pre + out.replace('０', '0').replace('１', '1').replace('２', '2').replace('３', '3').replace('４', '4').replace('５', '5').replace('６', '6').replace('７', '7').replace('８', '8').replace('９', '9')
def zh_of(t, ja=None):
    """Chinese label from OSM tags t (dict)"""
    z = t.get('name:zh-Hans') or t.get('name:zh-CN') or t.get('name:zh-SG')
    if z: return z.strip()
    z = t.get('name:zh')
    if z:
        z = z.split(';')[0].strip()
        return _T2S.convert(z)
    nm = ja or t.get('name:ja') or t.get('name')
    if nm:
        k = kanji_zh(nm)
        if k: return k
        if nm in DICT: return DICT[nm]
        n2 = _norm(nm)
        if n2 in DICT: return DICT[n2]
        z = t.get('name:zh-Hant')
        if z: return _T2S.convert(z)
    return en_of(t) or nm
def en_of(t):
    e = t.get('name:en') or t.get('name:ja-Latn') or t.get('name:ja_rm') or t.get('name:ja-Latn-alalc97')
    if e: return e.strip()
    nm = t.get('name') or ''
    return nm if re.match(r'^[\x20-\x7e]+$', nm) else None
if __name__ == '__main__':
    for s in ['東京駅', '渋谷', '横浜', '霞ヶ関', '虎ノ門', '代々木公園', '市ヶ谷', '井の頭公園', '新宿三丁目', 'JR山手線', '恵比寿', '両国国技館', '豊洲', '秋葉原', '東京スカイツリー', '大塚', '高輪ゲートウェイ', '品川区', '浜松町', '竜閑橋', '築地', '沢']:
        print(s, '->', kanji_zh(s), zh_of({'name': s}))
