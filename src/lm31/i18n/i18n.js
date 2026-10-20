/* ===== City Brush v35 · lm31/i18n — 全局语言切换 Global language switch: 中 / EN / 双 (window.SGLang) =====
   "全局EN/CN翻译". The whole UI is bilingual today (中文 + English side by side); this module adds a switch 中 / EN / 双 in the
   title panel next to the city switch (双 = bilingual = today's look, the default), remembered (localStorage 'sgLang'), applied
   instantly to everything: panels, tabs, buttons, tooltips / aria-labels / placeholders, toasts, map labels, the drive and creature
   HUDs, the big map and its search, race / multiplayer UIs, dialogs, cards.
   How:
   - <html> gets the class lang-zh / lang-en / lang-both and its lang attribute (zh-CN / en).
   - Strings: a small parser splits a bilingual string into its Chinese and English halves ("中文 English", "中文 · English",
     "中文 / English", "3 圈 laps", "F1 自由驾驶 F1 free drive" …) without cutting mixed names (E1, COM3, S9, MRT, I-95, One57,
     SDE4（零能耗大楼）): an English half must contain a real word (letters only, ≥ 2 letters with a lowercase one, or ≥ 3 capitals),
     words with digits are codes; leading icons / numbers / codes stay with both halves.
   - Structure: "中文<small>English</small>", "中文<br>English", "<span>中文</span><small>English</small>", "中文 <span>English</span>":
     the English element gets data-i18n="e" and the separators data-i18n="s" (hidden by CSS in both single-language modes); in
     English mode the Chinese text node is rewritten to the English text (so the English takes the primary style), in Chinese mode
     the English element is simply hidden.
   - A MutationObserver (only while the mode is 中 or EN — in 双 it is disconnected, zero cost) rewrites new / changed text nodes and
     the attributes title / aria-label / placeholder / alt; originals are kept in WeakMaps, our own writes are discarded with
     takeRecords(); batched per microtask (the observer callback runs before the next paint). Opt out of a subtree with the attribute data-i18n-off.
   - Canvas text and strings built on the fly by modules: small patch scripts (lm31/i18n/patch_<module>.py) call SGLang.sel / pick.
   Contract (guard every call: window.SGLang && SGLang.f && SGLang.f(…)):
     SGLang.mode            'zh' | 'en' | 'both'
     SGLang.set(mode)       switch (also 'cn' → 'zh'); remembered; listeners called
     SGLang.on(fn)          fn(mode) after every switch; returns an "off" function
     SGLang.pick(zh, en)    → the string for the mode ('both' → "zh en" — or the caller's own layout, see sel)
     SGLang.sel(both, zh, en) → both in 双 mode (the caller's existing bilingual layout), else pick(zh, en)
     SGLang.txt(s)          → a bilingual string reduced to the mode (unchanged in 双)
     SGLang.html(zh, en)    → 'zh<small>en</small>' in 双, else the single language (escaped)
     SGLang.refresh(root?)  re-run the DOM pass (e.g. after building a big detached subtree)
     SGLang.stats()         {mode, nodes, attrs, batches, ms (total observer time), msMax}
*/
{
const LANG_KEY = 'sgLang', MODES = ['zh', 'en', 'both'];
// ---------------------------------------------------------------- the string parser (pure; tested in node)
const CJK = '\\ue000-\\ue1ff\\u2e80-\\u2fff\\u3000-\\u303f\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff\\ufe30-\\ufe4f\\uff00-\\uffef';
const HAN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\ue000-\ue1ff]/;
const TOKRE = new RegExp(`[${CJK}]+|[^\\s${CJK}]+|\\s+`, 'g');
const SEPRE = /(\s*[·•|]\s+|\s+[·•|]\s*|\s+[\/—]\s+|\s*\n\s*)/;            // segment separators " · ", " / ", " | ", newlines
const UNITS = new Set(['m', 'km', 'km/h', 'kmh', 'mph', 'ft', 's', 'ms', 'h', 'kt', 'kn', 'kts', 'm/s', 'fps', 'fpm', 'px', 'cm', 'mm', 'kg', 't', 'x', 'm²', 'km²', 'hpa', 'mb', 'g', 'pm', 'am', 'k', 'mw', 'kw', 'hz', 'db', 'mi', 'yd', 'in', 'lb', 'gb', 'mb/s']);
const isWs = t => /^\s/.test(t);
function tokCls(t){
  if (HAN.test(t)) return 'z';
  if (/[A-Za-z]/.test(t)){ if (t.replace(/[^A-Za-z0-9]/g, '').length <= 1) return 'n'; const u = t.toLowerCase().replace(/^[\d.,+\-−×~≈<>()（）:]+/, '').replace(/[.,;:!?)\]（）]+$/, ''); return UNITS.has(u) ? 'n' : 'e'; }
  return 'n';
}
function realE(t){
  if (/\d/.test(t)) return false;
  const w = t.replace(/[^A-Za-z]/g, ''); if (w.length < 2) return false;
  if (/[a-z]/.test(t)) return !UNITS.has(t.toLowerCase().replace(/[.,;:!?)\]]+$/, ''));
  return w.length >= 3;
}
// one segment (no separators) → {zh, en} | null
function splitSeg(s){
  if (!HAN.test(s)) return null;
  const T = s.match(TOKRE); if (!T) return null;
  const W = []; for (let i = 0; i < T.length; i++) if (!isWs(T[i])) W.push(i);
  const cl = T.map(t => isWs(t) ? 'w' : tokCls(t));
  let iz = -1, fz = -1; for (const i of W) if (cl[i] === 'z'){ if (fz < 0) fz = i; iz = i; }
  if (iz < 0) return null;
  const tail = W.filter(i => i > iz); if (!tail.some(i => realE(T[i]))) return null;
  const ie = tail.find(i => cl[i] === 'e'); let le = ie; for (const i of tail) if (cl[i] === 'e') le = i;
  // neutral tokens between the last Chinese word and the first English one: glued (…, 。) → Chinese only; spaced (25 m) → both
  let zhEnd = iz, enStart = ie, prev = iz;
  for (const i of tail){ if (i >= ie) break; const glued = i === prev + 1; zhEnd = i; if (!glued && enStart === ie) enStart = i; prev = i; }
  const post = tail.filter(i => i > le);
  const lead = W.filter(i => i < fz);
  let zh = T.slice(0, zhEnd + 1).join(''); if (post.length) zh += ' ' + T.slice(post[0], post[post.length - 1] + 1).join('');
  let en = T.slice(enStart).join('');
  const enT = ' ' + en + ' ', keep = lead.filter(i => enT.indexOf(' ' + T[i] + ' ') < 0).map(i => T[i]);
  if (keep.length) en = keep.join(' ') + ' ' + en;
  zh = zh.trim(); en = en.trim();
  if (/[（(]$/.test(zh) && /[）)]$/.test(en)){ zh = zh.slice(0, -1).trim(); en = en.slice(0, -1).trim(); }
  else if (/^\(.*\)$/.test(en) && en.indexOf('(', 1) < 0) en = en.slice(1, -1).trim();
  if (!zh || !en) return null;
  return {zh, en};
}
// zh-only words / phrases for the English mode (text the app shows without an English half)
const DICT = {};
function addDict(o){ for (const k in o) DICT[k] = o[k]; }
function dictEn(seg){
  const k = seg.trim(); if (!k) return null; if (DICT[k] !== undefined) return seg.replace(k, DICT[k]);
  const T = seg.match(TOKRE); if (!T) return null; let ok = true, any = false;
  const out = T.map(t => { if (isWs(t) || !HAN.test(t)) return t; any = true; let m = DICT[t];
    if (m === undefined){ const p = /^(.*?)([，。、：；！？）」』]*)$/.exec(t); if (p && DICT[p[1]] !== undefined) m = DICT[p[1]] + p[2].replace(/，/g, ', ').replace(/。/g, '. ').replace(/：/g, ': ').replace(/、/g, ', ').replace(/；/g, '; ').replace(/！/g, '! ').replace(/？/g, '? ').replace(/）/g, ')').trimEnd(); }
    if (m === undefined){ ok = false; return t; } return m; });
  return ok && any ? out.join('') : null;
}
// classify a whole string: N (no letters / Han), e (Latin letters but no real word), E (English), Z (Chinese, no English half), P (pair inside)
function kind(s){
  if (!HAN.test(s)){ const T = s.match(TOKRE) || []; return T.some(t => !isWs(t) && realE(t)) ? 'E' : /[A-Za-z]/.test(s) ? 'e' : 'N'; }
  const segs = s.split(SEPRE); let z = 0, e = 0;
  for (let i = 0; i < segs.length; i += 2){ const g = segs[i]; if (!g.trim()) continue; if (splitSeg(g)) return 'P'; const k = HAN.test(g) ? 'Z' : (g.match(TOKRE) || []).some(t => !isWs(t) && realE(t)) ? 'E' : 'N';
    if (k === 'Z') z++; else if (k === 'E'){ if (z) return 'P'; e++; } }
  return 'Z';
}
// a bilingual string reduced to one language
const PARRE = /[（(]([^()（）]*)[)）]/g;
function txtFor(s, mode){
  if (mode === 'both' || !s || !HAN.test(s)) return s;
  if (s.indexOf('(') >= 0 || s.indexOf('（') >= 0){
    const inner = []; const s2 = s.replace(PARRE, (m, x) => HAN.test(x) && kind(x) === 'P' ? (inner.push(m[0] + txtFor(x, mode) + m[m.length - 1]), '\u0001' + (inner.length - 1) + '\u0002') : m);
    // Chinese-only groups such as （飞机 / 直升机） stay one Chinese word (a private-use placeholder counts as Han)
    const zg = []; const s3 = s2.replace(PARRE, m => HAN.test(m) && !/[A-Za-z]{2}/.test(m) && SEPRE.test(m) ? (zg.push(m), '\ue000' + String.fromCharCode(0xe100 + zg.length - 1)) : m);
    if (inner.length || zg.length) return txtFor1(s3, mode).replace(/\ue000([\ue100-\ue1ff])/g, (m, c) => zg[c.charCodeAt(0) - 0xe100]).replace(/\u0001(\d+)\u0002/g, (m, i) => inner[+i]);
  }
  return txtFor1(s, mode);
}
function txtFor1(s, mode){
  if (!HAN.test(s)) return s;
  const parts = s.split(SEPRE), segs = [];
  for (let i = 0; i < parts.length; i += 2){ const g = parts[i], sep = i ? parts[i - 1] : ''; const P = splitSeg(g);
    const k = !g.trim() ? 'N' : P ? 'P' : HAN.test(g) ? 'Z' : (g.match(TOKRE) || []).some(t => !isWs(t) && realE(t)) ? 'E' : 'N';
    segs.push({g, sep, k, P, drop:false}); }
  // a run of Chinese segments followed by a run of English segments is a pair
  for (let i = 0; i < segs.length;){
    if (segs[i].k !== 'Z'){ i++; continue; }
    let j = i; while (j < segs.length && (segs[j].k === 'Z' || (segs[j].k === 'N' && j + 1 < segs.length && segs[j + 1].k === 'Z'))) j++;
    let k = j; while (k < segs.length && (segs[k].k === 'E' || (segs[k].k === 'N' && k > j && segs.slice(k + 1).every(g => g.k === 'E' || g.k === 'N')))) k++;
    if (k > j){ for (let q = i; q < k; q++) segs[q].drop = mode === 'zh' ? q >= j : q < j; if (mode === 'en') for (let q = i; q < j; q++) if (segs[q].k === 'N') segs[q].drop = false; }
    i = Math.max(k, i + 1);
  }
  // "幸存 · 未撤离 SURVIVED · NOT OUT": Chinese segments, a pair, English segments
  for (let i = 1; i < segs.length - 1; i++){ if (segs[i].k !== 'P' || segs[i - 1].k !== 'Z' || segs[i + 1].k !== 'E' || segs[i - 1].drop || segs[i + 1].drop) continue;
    for (let q = i - 1; q >= 0 && segs[q].k === 'Z'; q--) segs[q].drop = mode === 'en';
    for (let q = i + 1; q < segs.length && segs[q].k === 'E'; q++) segs[q].drop = mode === 'zh'; }
  let out = '', first = true;
  for (const g of segs){ if (g.drop) continue; let v = g.g;
    if (g.P){ const lead = /^\s*/.exec(v)[0], trail = /\s*$/.exec(v)[0]; v = lead + (mode === 'zh' ? g.P.zh : g.P.en) + trail; }
    else if (g.k === 'Z' && mode === 'en'){ const d = dictEn(v); if (d !== null) v = d; }
    out += (first ? '' : g.sep) + v; first = false; }
  // keep the outer whitespace of the original
  if (!first){ const lead = /^\s*/.exec(s)[0], trail = /\s*$/.exec(s)[0]; out = lead + out.trim() + trail; }
  return first ? s : out;
}

// ---------------------------------------------------------------- state
let apply = () => {}, pass = () => {};   // the DOM side (assigned below when there is a document; the page script is strict)
const S = {mode:'both', fns:[], obs:null, pend:new Set(), pendA:new Set(), raf:0, nodes:0, attrs:0, batches:0, ms:0, msMax:0, fms:0, fmax:0, swMs:0, busy:false};
const norm = m => { m = String(m || '').toLowerCase(); return m === 'cn' || m === '中' || m === 'zh-cn' ? 'zh' : m === '双' || m === 'bi' ? 'both' : MODES.includes(m) ? m : null; };
try { const q = typeof location !== 'undefined' && /[?&]lang=([a-z]+)/i.exec(location.search); const v = norm(q && q[1]) || norm(typeof localStorage !== 'undefined' && localStorage.getItem(LANG_KEY)); if (v) S.mode = v; } catch (e){ /* private mode */ }
const esc = t => String(t).replace(/[&<>"]/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[ch]));
const L = {
  get mode(){ return S.mode; },
  set(m){ m = norm(m); if (!m) return S.mode; const was = S.mode; S.mode = m; try { localStorage.setItem(LANG_KEY, m); } catch (e){ /* */ }
    if (typeof document !== 'undefined') apply(was); for (const f of S.fns.slice()) try { f(m, was); } catch (e){ console.error('[i18n] listener', e); } return m; },
  on(fn){ if (typeof fn === 'function') S.fns.push(fn); return () => { const i = S.fns.indexOf(fn); if (i >= 0) S.fns.splice(i, 1); }; },
  pick(zh, en){ zh = zh == null ? '' : String(zh); en = en == null ? '' : String(en); if (S.mode === 'zh') return zh || en; if (S.mode === 'en') return en || zh; return zh && en && zh !== en ? zh + ' ' + en : (zh || en); },
  sel(both, zh, en){ return S.mode === 'both' ? both : L.pick(zh, en); },
  txt(s){ return S.mode === 'both' || s == null ? s : txtFor(String(s), S.mode); },
  keep(s){ return S.mode === 'both' || s == null ? s : '\u2060' + s; },   // mark a string the caller already localized (the observer leaves it)
  html(zh, en){ zh = zh == null ? '' : String(zh); en = en == null ? '' : String(en); if (S.mode === 'both') return zh && en && zh !== en ? `${esc(zh)}<small>${esc(en)}</small>` : esc(zh || en); return esc(L.pick(zh, en)); },
  refresh(root){ if (typeof document !== 'undefined') pass(root || document.documentElement); },
  stats(){ return {mode:S.mode, nodes:S.nodes, attrs:S.attrs, switchMs:+S.swMs.toFixed(1), batches:S.batches, batchMs:+S.fms.toFixed(2), batchMax:+S.fmax.toFixed(2), ms:+S.ms.toFixed(2)}; },
  dict:addDict, _split:splitSeg, _txt:txtFor, _kind:kind, _dictEn:dictEn
};
if (typeof window !== 'undefined') window.SGLang = L;
if (typeof module !== 'undefined' && module.exports) module.exports = L;

// ---------------------------------------------------------------- dictionary (zh-only UI words → English)
addDict({
  // base panels, time bar, keys
  '收起':'Hide', '展开':'Show', '自动':'Auto', '黎明':'Dawn', '正午':'Noon', '黄昏':'Dusk', '夜晚':'Night', '清晨':'Morning', '上午':'Morning', '下午':'Afternoon', '傍晚':'Evening', '深夜':'Late night', '午夜':'Midnight', '日出':'Sunrise', '日落':'Sunset',
  '分区':'Zones', '方向键':'arrow keys', '界面':'UI', '文字':'Text', '游览':'Tour', '移轴':'Tilt-shift', '退出':'Exit', '左键涂刷':'left drag paints', '右键平移':'right drag pans', '滚轮缩放':'wheel zooms', '空格+拖动旋转':'Space + drag rotates',
  '工具':'Tools', '笔刷大小':'Brush size', '地标旋转':'Rotate landmark', '撤销':'Undo', '地面图层':'Ground layer', '地标类别':'Landmark category',
  '直线':'Straight line', '缩放':'Zoom', '道路图层':'Road layer', '路网':'Roads', '完赛':'Finished',
  '有机':'Organic', '方格':'Grid', '切角街区':'chamfered blocks', '围合内院':'courtyards', '斜向方格':'rotated grid', '长条街区':'long blocks', '高密度':'high density', '有机路网':'organic streets', '联排住宅':'terraced houses', '社区广场':'squares', '细密小街区':'fine-grained blocks', '窄巷':'narrow lanes', '小地块':'small lots',
  '居住':'Residential', '商业':'Commercial', '办公':'Office', '工业':'Industrial', '公共':'Public', '公园':'Park', '公园；先选密度再刷，地面颜色越深密度越高':'Park; pick a density, then paint (darker ground = denser)',
  '主干道':'Arterial', '高架路':'Elevated road', '高速公路':'Motorway', '日式':'Japanese', '巴黎':'Paris', '意大利':'Italian', '唐长安':'Tang Chang\'an', '东京':'Tokyo', '伦敦':'London', '曼哈顿':'Manhattan', '巴塞罗那':'Barcelona',
  '点地图放置，R 旋转':'Click the map to place, R rotates', '填海':'Reclaim', '挖水':'Dig water', '抬高':'Raise', '降低':'Lower', '平整':'Flatten', '拖动旋转视角':'Drag to rotate the view',
  '旋翼':'Rotor', '复位修复':'reset/repair', '转向灯':'indicators', '大灯':'lights', '站':'stations', '条':'', '栋':'', '圣淘沙':'Sentosa', '乌敏':'Pulau Ubin', '德光':'Pulau Tekong', '武吉知马山':'Bukit Timah Hill', '超级街区':'superblocks', '板楼组团':'slab clusters', '高绿地率':'lots of green',
  '城市笔刷':'City Brush', '畅通':'Free flow', '拥堵':'Congested', '朝向':'Rotation', '空格':'Space', '回看':'Look back', '视角':'Camera', '声音':'Sound', '小地图':'Minimap', '复位':'Reset',
  '新加坡':'Singapore', '旧金山湾区':'SF Bay Area', '纽约':'New York', '香港':'Hong Kong', '东京':'Tokyo', '富士山':'Mount Fuji', '地图':'Map', '导航':'Nav', '驾驶':'Drive', '飞行':'Fly', '天气':'Weather', '克苏鲁':'Cthulhu', '烟花':'Fireworks', '军队':'Army', '比赛':'Race', '联机':'Online',
  '晴':'Clear', '多云':'Cloudy', '阴':'Overcast', '雨':'Rain', '小雨':'Light rain', '大雨':'Heavy rain', '雷雨':'Thunderstorm', '雾':'Fog', '雪':'Snow',
  '开':'On', '关':'Off', '开启':'On', '关闭':'Off', '确定':'OK', '取消':'Cancel', '暂停':'Pause', '继续':'Resume', '重来':'Restart', '开始':'Start', '结束':'End', '返回':'Back', '下一个':'Next', '上一个':'Previous',
  '人口':'Population', '面积':'Area', '岗位':'Jobs', '住宅':'Homes', '居民':'Residents',
  '起点':'Start', '终点':'Finish', '胜利':'Victory', '失败':'Defeat', '时间':'Time', '距离':'Distance', '速度':'Speed', '血量':'Health', '生命':'Health', '得分':'Score', '分数':'Score', '排名':'Rank', '用时':'Time', '最快圈':'Best lap'
});

// ---------------------------------------------------------------- DOM
if (typeof document !== 'undefined'){
  const TX = new WeakMap(), AT = new WeakMap(), ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];
  const SKIP = {SCRIPT:1, STYLE:1, TEXTAREA:1, NOSCRIPT:1, CANVAS:1, svg:1, SVG:1, INPUT:1, SELECT:1, OPTION:1, TEMPLATE:1};
  const INLINE = {SPAN:1, B:1, SMALL:1, STRONG:1, EM:1, I:1, A:1, LABEL:1, SUB:1, SUP:1, OUTPUT:1, U:1, MARK:1, ABBR:1, CODE:1, KBD:1};
  const PARTNER = {SMALL:1, SPAN:1, B:1, STRONG:1, EM:1, I:1, SUB:1, SUP:1, A:1, U:1, MARK:1, ABBR:1, LABEL:1};
  const off = el => !el || (el.closest && el.closest('[data-i18n-off]'));
  const orig = tn => { const r = TX.get(tn); return r && tn.data === r.w ? r.o : tn.data; };
  const put = (tn, v) => { const o = orig(tn); let r = TX.get(tn); if (!r){ r = {o, w:o}; TX.set(tn, r); } else r.o = o; if (tn.data !== v) tn.data = v; r.w = v; };
  const restore = tn => { const r = TX.get(tn); if (r && tn.data === r.w && r.o !== r.w){ tn.data = r.o; r.w = r.o; } };
  const elText = el => { let s = ''; const w = document.createTreeWalker(el, 4); for (let n = w.nextNode(); n; n = w.nextNode()) s += orig(n); return s; };
  const simple = el => { for (const c of el.children) if (!(c.tagName in INLINE) && c.tagName !== 'BR') return false; return true; };
  const lowerWord = t => (t.match(TOKRE) || []).some(w => realE(w) && /[a-z]/.test(w));
  const codeEl = c => c.nodeType === 1 && (c.tagName === 'I' || c.tagName === 'EM' || c.tagName === 'KBD' || c.tagName === 'SVG' || c.tagName === 'svg' || (c.tagName in INLINE && !HAN.test(elText(c)) && !lowerWord(elText(c))));
  const isSepText = n => n.nodeType === 3 && /^\s*([·•|\/—–-]\s*)?$/.test(orig(n));
  // find the English partner after a Chinese unit (a text node or an inline element) among its next siblings
  function partner(u){
    const seps = [];
    for (let n = u.nextSibling; n; n = n.nextSibling){
      if (n.nodeType === 3){ const o = orig(n); if (isSepText(n)){ if (o.trim()) seps.push(n); continue; } return kind(o) === 'E' ? {en:n, seps} : null; }
      if (n.nodeType !== 1) continue;
      if (n.tagName === 'BR'){ seps.push(n); continue; }
      if (n.classList.contains('ref') || (codeEl(n) && n.tagName !== 'SMALL')) continue;   // a road ref / key / icon between the halves
      if (!(n.tagName in PARTNER) || n.hasAttribute('data-i18n-off') || !simple(n)) return null;
      const t = elText(n), k = kind(t);   // <small> carries the English half all over the app; other elements need a real word
      // a <small> that is itself a pair: "Esplanade Drive · 高架 elevated" (an English name + a Chinese word) pairs with the Chinese
      // name before it; "关 Off" (a status under 声音) does not, it is reduced on its own (pm = this kind of partner)
      if (n.tagName === 'SMALL' && k === 'P'){ const e = txtFor(t, 'en'), z = txtFor(t, 'zh'); return HAN.test(e) ? null : {en:n, seps, enTxt:e, pm:true, zhEn:lowerWord(z)}; }
      return n.tagName === 'SMALL' ? (k === 'E' || k === 'e' ? {en:n, seps} : null) : k === 'E' && lowerWord(t) ? {en:n, seps} : null;
    }
    return null;
  }
  // significant text of the zh unit outside the Chinese words: leading / trailing icons, numbers and codes kept in English mode
  function enWith(zhs, ens){
    const T = zhs.match(TOKRE) || [], W = []; for (let i = 0; i < T.length; i++) if (!isWs(T[i])) W.push(i);
    let fz = -1, lz = -1; for (const i of W) if (HAN.test(T[i])){ if (fz < 0) fz = i; lz = i; }
    const has = t => (' ' + ens + ' ').indexOf(t) >= 0, pre = [], post = [];
    for (const i of W){ if (i < fz && !has(T[i])) pre.push(T[i]); else if (i > lz && !/^[，。、：；！？（）·]+$/.test(T[i]) && !has(T[i])) post.push(T[i]); }
    const lw = /^\s*/.exec(zhs)[0], tw = /\s*$/.exec(zhs)[0];
    return lw + [pre.join(' '), ens.trim(), post.join(' ')].filter(Boolean).join(' ') + tw;
  }
  function doText(tn, done){
    if (done.has(tn)) return; done.add(tn); const o = orig(tn), m = S.mode;
    if (m === 'both'){ restore(tn); return; }
    if (!HAN.test(o) || o.charCodeAt(0) === 0x2060){ restore(tn); return; }   // U+2060 first: already in the mode's language (SGLang.keep)
    S.nodes++;
    const k = kind(o);
    if (k === 'P'){ put(tn, txtFor(o, m)); return; }
    // a Chinese unit: the text node itself, or its inline parent(s) when it is their only content
    let u = tn, P = partner(u);
    for (let up = 0; !P && up < 2; up++){ const pe = u.parentNode; if (!pe || pe.nodeType !== 1 || !(pe.tagName in INLINE)) break;
      let only = true; for (const c of pe.childNodes) if (c !== u && !(c.nodeType === 3 && !orig(c).trim()) && !codeEl(c)) { only = false; break; }
      if (!only) break; u = pe; P = partner(u); }
    if (P && P.pm && (m === 'zh' ? !P.zhEn : txtFor(o, 'en') !== o)) P = null;
    if (P){
      for (const s of P.seps){ if (s.nodeType === 1) s.setAttribute('data-i18n', 's'); else { done.add(s); put(s, ''); } }
      const ens = P.enTxt || (P.en.nodeType === 3 ? orig(P.en) : elText(P.en));
      if (P.en.nodeType === 1) P.en.setAttribute('data-i18n', 'e'); else { done.add(P.en); put(P.en, ''); }
      put(tn, m === 'zh' ? o : enWith(o, ens.replace(/\s+/g, ' ')));
      return;
    }
    let v = txtFor(o, m);
    if (m === 'en' && HAN.test(v)){ const t = titleEn(tn, o); if (t) v = /^\s*/.exec(o)[0] + t + /\s*$/.exec(o)[0]; }
    put(tn, v);
  }
  // a Chinese-only label whose button / chip carries the English in its title (chips: text 巴塞罗那, title Barcelona; tools: 居住 + "居住 Residential (1)")
  function titleEn(tn, o){
    const tx = o.trim(); let el = tn.parentNode;
    for (let k = 0; k < 3 && el && el.nodeType === 1; k++, el = el.parentNode){
      for (const a of ['title', 'aria-label']){ if (!el.hasAttribute(a)) continue; const q = AT.get(el), v = q && q[a] ? q[a].o : el.getAttribute(a);
        const strip = x => x.replace(/\s*[(（][^()（）]*[)）]\s*$/, '').trim(), kd = kind(v);
        if (kd === 'E' && v.length <= 32 && v.split(/\s+/).length <= 4 && strip(elText(el)) === strip(tx)) return strip(v);
        if (kd === 'P'){ const P = splitSeg(v); if (P && strip(P.zh) === strip(tx)) return strip(P.en); } }
      if (!(el.tagName in INLINE) && el.tagName !== 'BUTTON') break;
    }
    return null;
  }
  function doAttrs(el){
    let r = AT.get(el);
    for (const a of ATTRS){ if (!el.hasAttribute(a)) continue; const v = el.getAttribute(a); let q = r && r[a];
      const o = q && v === q.w ? q.o : v; if ((!HAN.test(o) || o.charCodeAt(0) === 0x2060) && !q) continue;
      const w = S.mode === 'both' || o.charCodeAt(0) === 0x2060 ? o : txtFor(o, S.mode); if (!r){ r = {}; AT.set(el, r); } r[a] = {o, w}; if (v !== w) el.setAttribute(a, w); S.attrs++; }
  }
  pass = function(root){
    if (!root) return; const t0 = performance.now(), done = new Set();
    if (root.nodeType === 3){ if (!off(root.parentNode)) doText(root, done); }
    else if (root.nodeType === 1 && !(root.tagName in SKIP) && !off(root)){
      if (root.hasAttribute('data-i18n')) root.removeAttribute('data-i18n');
      for (const e of root.querySelectorAll('[data-i18n]')) e.removeAttribute('data-i18n');
      const w = document.createTreeWalker(root, 4, {acceptNode:n => { const p = n.parentNode; return p && (p.tagName in SKIP || (p.closest && p.closest('[data-i18n-off]'))) ? 2 : 1; }}), list = [];
      for (let n = w.nextNode(); n; n = w.nextNode()) list.push(n);
      for (const n of list) restore(n);          // partners blanked by an earlier pass come back first
      for (const n of list) doText(n, done);
      // a name without a Chinese form shows twice ("Market Street<small>Market Street</small>"): once is enough in 中 / EN
      if (S.mode !== 'both') for (const sm of (root.tagName === 'SMALL' ? [root] : root.getElementsByTagName('small'))){ const pv = sm.previousSibling, t = elText(sm).trim();
        if (t && pv && !sm.hasAttribute('data-i18n') && (pv.nodeType === 3 ? orig(pv) : pv.nodeType === 1 ? elText(pv) : '').trim() === t) sm.setAttribute('data-i18n', 'e'); }
      doAttrs(root); for (const e of root.querySelectorAll('[title],[aria-label],[placeholder],[alt]')) if (!off(e)) doAttrs(e);
    }
    if (S.obs) S.obs.takeRecords();             // our own writes
    const dt = performance.now() - t0; S.ms += dt; if (dt > S.msMax) S.msMax = dt;
  };
  const lineRoot = n => { let e = n.nodeType === 1 ? n : n.parentNode; for (let k = 0; k < 3 && e && e.nodeType === 1 && e.tagName in INLINE && e.parentNode; k++) e = e.parentNode; return e; };
  function flush(){
    S.raf = 0; if (S.mode === 'both') { S.pend.clear(); S.pendA.clear(); return; }
    S.batches++; const roots = [...S.pend], atts = [...S.pendA]; S.pend.clear(); S.pendA.clear();
    const t0 = performance.now();
    for (const r of roots) if (r.isConnected) pass(r);
    for (const e of atts) if (e.isConnected && !off(e)) doAttrs(e);
    if (S.obs) S.obs.takeRecords();
    const dt = performance.now() - t0; S.fms += dt; if (dt > S.fmax) S.fmax = dt;
  }
  function onMut(recs){
    for (const r of recs){
      if (r.type === 'attributes'){ S.pendA.add(r.target); continue; }
      if (r.type === 'characterData'){ const tn = r.target, q = TX.get(tn); if (q && tn.data !== q.w){ q.o = tn.data; q.w = tn.data; } const e = lineRoot(tn); if (e) S.pend.add(e); continue; }
      const t = r.target; if (t.nodeType === 1 && t.tagName in SKIP) continue;
      if (t.nodeType === 1 && t.tagName in INLINE){ const e = lineRoot(t); if (e) S.pend.add(e); continue; }
      let txt = false; for (const n of r.addedNodes){ if (n.nodeType === 1) S.pend.add(n.tagName in INLINE ? lineRoot(t) : n); else if (n.nodeType === 3) txt = true; }
      if (txt || r.removedNodes.length) S.pend.add(t);   // siblings may pair with the new / removed text
    }
    // converted right here (a microtask, before the next paint): deferring to requestAnimationFrame let a HUD that rewrites its
    // text every frame show the bilingual original on alternate frames
    if (S.pend.size || S.pendA.size) flush();
  }
  function observe(on){
    if (on && !S.obs){ S.obs = new MutationObserver(onMut); S.obs.observe(document.documentElement, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:ATTRS}); }
    else if (!on && S.obs){ S.obs.disconnect(); S.obs = null; }
  }
  const CLS = {zh:'lang-zh', en:'lang-en', both:'lang-both'};
  function htmlCls(){ const h = document.documentElement; h.classList.remove('lang-zh', 'lang-en', 'lang-both'); h.classList.add(CLS[S.mode]); h.lang = S.mode === 'en' ? 'en' : 'zh-CN';
    for (const b of document.querySelectorAll('.langseg button')) b.setAttribute('aria-pressed', String(b.dataset.lang === S.mode)); }
  apply = function(was){
    const t0 = performance.now(); try { apply1(was); } finally { S.swMs = performance.now() - t0; }
  };
  function apply1(was){
    htmlCls();
    if (S.mode === 'both'){ observe(false); if (was && was !== 'both') pass(document.documentElement); return; }
    observe(false); pass(document.documentElement); observe(true);
  };
  // CSS: hide the other language's elements; English in the primary slot reads better without CJK letter-spacing
  const css = document.createElement('style'); css.id = 'i18nCss';
  css.textContent = `html.lang-zh [data-i18n="e"],html.lang-en [data-i18n="e"],html.lang-zh [data-i18n="s"],html.lang-en [data-i18n="s"]{display:none!important}
html.lang-en .lbl.n,html.lang-en .lbl.d b,html.lang-en .lbl.city b{letter-spacing:.02em}
html.lang-en .lbl.city b{font-size:19px}
html.lang-en .dtab{grid-template-columns:1fr;justify-items:center;row-gap:2px;min-width:0}html.lang-en .dtab i{grid-row:auto;width:22px;height:22px;font-size:15px}html.lang-en .dtab span{font-size:10.5px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.langseg{margin-top:6px;max-width:150px}.langseg button{padding:4px 4px;font-size:11.5px;line-height:1.2;min-width:0}
.langseg button[aria-pressed="true"]{background:var(--ink,#1b1e1c);color:var(--panel,#fff)}`;
  (document.head || document.documentElement).appendChild(css);
  htmlCls();
  // the switch: 中 / EN / 双 under the city switch in the title panel
  function mountUI(){
    if (document.querySelector('.langseg')) return;
    const at = document.querySelector('.cityseg') || document.querySelector('.brand'); if (!at) return;
    const seg = document.createElement('div'); seg.className = 'seg langseg'; seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Language 语言'); seg.setAttribute('data-i18n-off', '');
    seg.innerHTML = [['zh', '中', '中文 Chinese only'], ['en', 'EN', 'English only 仅英文'], ['both', '双', '双语 Bilingual (中文 + English)']].map(([k, t, ti]) => `<button type="button" data-lang="${k}" title="${ti}" aria-pressed="${k === S.mode}">${t}</button>`).join('');
    if (at.classList.contains('cityseg')) at.after(seg); else at.appendChild(seg);
    seg.addEventListener('click', e => { const b = e.target.closest('button[data-lang]'); if (b) L.set(b.dataset.lang); });
  }
  const boot = () => { try { mountUI(); htmlCls(); if (S.mode !== 'both') apply('both'); } catch (e){ console.error('[i18n] boot', e); } };
  if (typeof HOOKS !== 'undefined' && HOOKS.boot) HOOKS.boot.push(boot);
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);
}
}
