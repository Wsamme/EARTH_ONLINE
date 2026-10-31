# EARTH ONLINE · City Brush 城市笔刷

Five real cities at 1:1 in the browser, built with three.js r128 and OpenStreetMap:
浏览器里 1:1 的五座真实城市，用 three.js r128 和 OpenStreetMap 做成：

| page 页面 | city 城市 | landmarks 地标 |
|---|---|---|
| `site/index.html` | Singapore 新加坡 | Marina Bay, NUS, Changi, Gardens by the Bay … |
| `site/bay.html` | San Francisco Bay Area 旧金山湾区 | Golden Gate, Bay Bridge, company HQs … |
| `site/nyc.html` | New York City 纽约 | ~420 landmarks |
| `site/hk.html` | Hong Kong 香港 | 189 landmarks and parks; Victoria Harbour rebuilt from photos, neon streets, Symphony of Lights, Shenzhen skyline |
| `site/tyo.html` | Tokyo 东京 | 111 landmarks and parks, Mount Fuji on the horizon |

Real roads, rail, buildings, terrain and water; landmark models; intro cards; 中 / EN / 双 language switch; driving,
flying, races, multiplayer, Cthulhu mode; weather; speed or local time. Every city opens in View mode.
真实的道路、铁路、建筑、地形和水面；地标模型；介绍卡；中 / EN / 双 语言切换；驾驶、飞行、比赛、多人、克苏鲁模式；天气；倍速或当地时间。每个城市打开时默认是视角模式。

## Run it 运行

`site/` is a plain static site — no build step. Serve the folder with any static server:
`site/` 是纯静态网站，不需要编译。用任意静态服务器打开这个文件夹即可：

```bash
cd site && python3 -m http.server 8000     # then open http://localhost:8000
```

Deploy to Vercel: import this repo and set the **Root Directory** to `site` (framework: Other, no build command).
部署到 Vercel：导入这个仓库，把 **Root Directory** 设成 `site`（Framework 选 Other，不填 build 命令）。

The city switch opens the other cities in place when their pages sit in the same folder (they do here).
城市切换按钮会在同一个文件夹里找其他城市的页面，所以这里可以直接互相切换。

The map data is gzip stored as base64 text (`<city>data/*.txt`), up to ~14 MB per file, ~280 MB in all.
地图数据是 base64 文本格式的 gzip（`<city>data/*.txt`），单个文件最大约 14 MB，总共约 280 MB。

## Singapore photoreal tiles 新加坡实景瓦片

The Singapore page (`site/index.html`) opens on **Buona Vista** (Buona Vista MRT / one-north, about 1.3073°N 103.7900°E).
With a Google Map Tiles API key it streams [Photorealistic 3D Tiles](https://developers.google.com/maps/documentation/tile/3d-tiles) into the same scene as the OSM roads, labels, day/night cycle and camera. The old extruded buildings, hand-made landmarks and trees are hidden while the photos are showing; the terrain panel checkbox **Google 实景建筑**, or the button on the attribution bar, switches back to those models.
新加坡页（`site/index.html`）打开时镜头在 **Buona Vista / 波那维斯达**（地铁站和 one-north 一带，约 1.3073°N 103.7900°E）。
填了 Google Map Tiles API 密钥之后，会把[实景三维瓦片](https://developers.google.com/maps/documentation/tile/3d-tiles)放进原来的场景，OSM 道路、地名、昼夜和相机照旧。实景显示时，原来的拉伸建筑、手写地标和树会藏起来；地理面板里的 **Google 实景建筑**，或署名条上的按钮，可以切回那些模型。

The page is still three.js r128, so the tiles are loaded here (`site/google3d.js`, source copy `src/sgreal/app/google3d.js`) instead of dropping in a second three.js. Geometry uses the r128 GLTFLoader with Draco. Session tokens follow the Map Tiles docs: the first request is `https://tile.googleapis.com/v1/3dtiles/root.json?key=...`, and every later tile keeps the `session` from that response and sends `key` again. A session lasts about three hours; a 400 refreshes it.
页面仍是 three.js r128，所以瓦片是在 `site/google3d.js`（源码副本 `src/sgreal/app/google3d.js`）里加载的，没有再塞一套 three。几何用 r128 的 GLTFLoader 和 Draco。会话按 Map Tiles 文档来：第一次请求 `https://tile.googleapis.com/v1/3dtiles/root.json?key=...`，之后每一块都带上响应里的 `session`，并再次附上 `key`。一个会话大约三小时，遇到 400 会重新要一次根节点。

There is **no key in the repo**. The page reads, in order:
仓库里**没有密钥**。页面按这个顺序读：

1. `?gkey=` on the URL. 地址上的 `?gkey=`。
2. `window.GOOGLE_MAPS_API_KEY` from `site/config.local.js` (gitignored; the committed file is an empty stub so the script tag does not 404). `site/config.local.js` 里的 `window.GOOGLE_MAPS_API_KEY`（已在 `.gitignore` 里；仓库里那份是空的，这样 script 标签不会 404）。

Without a key the page stays on the OSM city, shows a short prompt, and does not call Google. `?tileset=testdata/g3d/tileset.json` loads a small white triangle at the same Buona Vista point (no Google key) so the loader and the coordinate fit can be checked. Example:
没有密钥时仍显示 OSM 城市，屏幕上会有一段说明，并且不会去请求 Google。例如：

```bash
cd site && python3 -m http.server 8000
# http://127.0.0.1:8000/?gkey=YOUR_KEY
```

The key is visible to anyone who can open the page. In Google Cloud, restrict it to the **Map Tiles API** and to your **HTTP referrers** (for local use include `http://127.0.0.1:8000/*` and `http://localhost:8000/*`). Do not commit a real key. If you type one into `site/config.local.js`, untrack that file so `.gitignore` applies: `git rm --cached site/config.local.js`.
密钥会出现在浏览器里。请在 Google Cloud 里把它限制为 **Map Tiles API**，并用 **HTTP 引荐来源** 限制网址（本机请加上 `http://127.0.0.1:8000/*` 和 `http://localhost:8000/*`）。不要把真密钥提交上去。如果写进了 `site/config.local.js`，先取消跟踪，`.gitignore` 才会生效：`git rm --cached site/config.local.js`。

While the photos are on, the corner shows the Google logo and the copyright strings from the tiles in view (most frequent first), and it says the roads and labels are still OpenStreetMap.
实景开着的时候，角落里有 Google 标志，以及当前画面里瓦片的版权句子（出现次数多的在前），并写明道路和地名仍来自 OpenStreetMap。

Vertical alignment uses Singapore’s geoid offset, about **8.94 m** (ellipsoidal height minus that is the page’s sea-level height). Roads are lifted **0.2 m** so they sit on the photos. If Buona Vista’s roads float or sink, reload with `?gdy=-2` (lowers the photos, metres) or `?geoid=9.5`. `?gdx=` / `?gdz=` nudge east / scene-Z. `?err=16` is the screen-space error target in CSS pixels (smaller is sharper and heavier; the default is 16 so panning stays light). `?g3d=0` keeps the key but stays on the old models.
垂直方向用新加坡大地水准面差距，大约 **8.94 米**（椭球高减去它，才是这页的海拔）。道路再抬高 **0.2 米**，免得和照片路面闪。如果 Buona Vista 的路浮起来或陷进去，用 `?gdy=-2` 把实景整体降低（单位米），或 `?geoid=9.5`。`?gdx=` / `?gdz=` 是向东、向场景 Z 的平移。`?err=16` 是屏幕空间误差（CSS 像素，越小越细也越重；默认 16，平移时比较轻）。`?g3d=0` 保留密钥但继续用旧模型。

Screenshots (you run this; it needs a real key and a displayless Chrome):
截图（你自己跑；需要真密钥，以及无界面的 Chrome）：

```bash
cd site && python3 -m http.server 8000
npm install --prefix tools playwright
npx --prefix tools playwright install chromium   # skip if CHROME_PATH or system Google Chrome works
GOOGLE_MAPS_API_KEY=YOUR_KEY node tools/shoot_google_tiles.mjs
```

That writes `tools/shots/`: Buona Vista MRT interchange, one-north / Fusionopolis and Biopolis, Star Vista, The Metropolis, the Dover / Holland Village edge, a Buona Vista aerial, and a night view. If port 8000 is already serving `site/`, the script uses it and does not start another server.
图片在 `tools/shots/`：波那维斯达地铁换乘站、one-north（启汇城与启奥园）、星悦汇、大都会、杜佛 / 荷兰村一侧、鸟瞰，以及夜景。如果 8000 端口已经在提供 `site/`，脚本会直接用它，不会再开一个服务器。

## Source 源码

`src/` holds what builds the pages:
`src/` 里是生成这些网页的程序：

- `src/city-brush-v16.html`: the base app.
- `src/city-brush-v16.html`：基础程序。
- `src/sgreal/patch17.py`: assembles a city page: `CITY=sg|bay|nyc|hk|tyo python3 sgreal/patch17.py city-brush-v16.html out.html`.
- `src/sgreal/patch17.py`：拼出一个城市的网页：`CITY=sg|bay|nyc|hk|tyo python3 sgreal/patch17.py city-brush-v16.html out.html`。
- `src/lm*/`, `src/bay/`, `src/nyc/`, `src/hk/`, `src/tyo/`: the feature modules and the landmark models.
- `src/lm*/`、`src/bay/`、`src/nyc/`、`src/hk/`、`src/tyo/`：功能模块和地标模型。
- `src/<city>real/`: the data pipelines that turn OpenStreetMap + AWS terrain tiles into the map data. Each has a README with its stages.
- `src/<city>real/`：把 OpenStreetMap 和 AWS 地形图块转换成地图数据的流程，每个文件夹都有 README 说明各个步骤。

Note: the build scripts still use the absolute workspace path they were written in (`SC = …/scratchpad/`). Change `SC` / `ROOT` to your checkout to rebuild.
注意：这些脚本里还写着当时工作目录的绝对路径（`SC = …/scratchpad/`），重新生成前要把 `SC` / `ROOT` 改成你自己的目录。

## Data and credits 数据与致谢

- Map data © OpenStreetMap contributors, available under the Open Database License (ODbL): https://www.openstreetmap.org/copyright
- 地图数据 © OpenStreetMap 贡献者，按开放数据库许可（ODbL）提供：https://www.openstreetmap.org/copyright
- Terrain: AWS Terrain Tiles (Mapzen terrarium) — https://registry.opendata.aws/terrain-tiles/
- 地形：AWS Terrain Tiles（Mapzen terrarium）—— https://registry.opendata.aws/terrain-tiles/
- Landmark models are original, simplified works. No company logos or characters are used.
- 地标模型都是自己做的简化模型，没有使用公司标志或卡通角色。
- Hong Kong's signs follow the position, size, colour and style of real signs, but every name on them is invented; no real brands, look-alike names or logo shapes.
- 香港的招牌按真实招牌的位置、大小、颜色和风格来做，但上面的名字都是编的，没有真实品牌、谐音名或标志图形。
