# Names for Hong Kong / Shenzhen features: (English, Chinese in Simplified characters).
# Hong Kong OSM names are usually Traditional Chinese and bilingual: name = "中文 English", name:zh / name:zh-Hant, name:en;
# Shenzhen names are Simplified already. Chinese: name:zh-Hans, else name:zh / name:zh-Hant / name:zh-HK / the Chinese part of
# name, converted with OpenCC (Hong Kong Traditional -> Simplified, 'hk2s'); English: name:en, else the Latin part of name.
import re
from opencc import OpenCC
_cc = OpenCC('hk2s')
_CJK = re.compile(r'[㐀-鿿豈-﫿]')
def s2(z): return _cc.convert(z) if z else z
def split(nm):
    """'青馬大橋 Tsing Ma Bridge' -> ('青馬大橋', 'Tsing Ma Bridge'); pure Chinese / pure Latin names go to one side"""
    if not nm: return None, None
    if not _CJK.search(nm): return None, nm.strip()
    # the Chinese part: up to the first run of Latin words after the CJK text
    m = re.match(r'^\s*([^A-Za-z]*[㐀-鿿豈-﫿（）()0-9\-·．.／/]*)\s+([A-Za-z].*)$', nm)
    if m and _CJK.search(m.group(1)) and not _CJK.search(m.group(2)): return m.group(1).strip(), m.group(2).strip()
    m = re.match(r'^\s*([A-Za-z][^㐀-鿿]*?)\s+([㐀-鿿].*)$', nm)
    if m and not _CJK.search(m.group(1)): return m.group(2).strip(), m.group(1).strip()
    return nm.strip(), None
def names(t):
    if not t: return None, None
    zc, ec = split(t.get('name'))
    en = t.get('name:en') or ec
    zh = t.get('name:zh-Hans') or s2(t.get('name:zh') or t.get('name:zh-Hant') or t.get('name:zh-HK') or zc)
    if zh and not _CJK.search(zh): zh = None
    if en and _CJK.search(en): en = None
    return en, zh
# the 18 districts (OSM admin_level 6 in Hong Kong) and the Shenzhen districts
DISTRICT_EN = {'中西區':'Central and Western', '灣仔區':'Wan Chai', '東區':'Eastern', '南區':'Southern', '油尖旺區':'Yau Tsim Mong', '深水埗區':'Sham Shui Po', '九龍城區':'Kowloon City',
    '黃大仙區':'Wong Tai Sin', '觀塘區':'Kwun Tong', '葵青區':'Kwai Tsing', '荃灣區':'Tsuen Wan', '屯門區':'Tuen Mun', '元朗區':'Yuen Long', '北區':'North', '大埔區':'Tai Po',
    '沙田區':'Sha Tin', '西貢區':'Sai Kung', '離島區':'Islands'}
if __name__ == '__main__':
    for nm in ['青馬大橋 Tsing Ma Bridge', '彌敦道 Nathan Road', '深南大道', 'Lantau Link', '港鐵 MTR', '中環 (港外線) 碼頭 Central Ferry Pier', '香港國際機場 Hong Kong International Airport']:
        print(nm, '->', split(nm), names({'name':nm}))
