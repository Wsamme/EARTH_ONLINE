# EARTH ONLINE · City Brush 城市笔刷

Five real cities at 1:1 in the browser, built with three.js r128 and OpenStreetMap:
浏览器里 1:1 的五座真实城市，用 three.js r128 和 OpenStreetMap 做成：

| page 页面 | city 城市 | landmarks 地标 |
|---|---|---|
| `site/index.html` | Singapore 新加坡 | 217 landmarks and parks: Marina Bay, Chinatown, Little India, Orchard, Sentosa, Mandai, Jurong, the cable car … |
| `site/bay.html` | San Francisco Bay Area 旧金山湾区 | Golden Gate, Bay Bridge, company HQs … |
| `site/nyc.html` | New York City 纽约 | ~420 landmarks |
| `site/hk.html` | Hong Kong 香港 | 189 landmarks and parks; Victoria Harbour rebuilt from photos, neon streets, Symphony of Lights, Shenzhen skyline |
| `site/tyo.html` | Tokyo 东京 | 111 landmarks and parks, Mount Fuji on the horizon |

Real roads, rail, buildings, terrain and water; landmark models; intro cards; 中 / EN / 双 language switch; driving,
flying, races, multiplayer, Cthulhu mode; weather; speed or local time. Every city opens in View mode.
真实的道路、铁路、建筑、地形和水面；地标模型；介绍卡；中 / EN / 双 语言切换；驾驶、飞行、比赛、多人、克苏鲁模式；天气；倍速或当地时间。每个城市打开时默认是视角模式。

## Demo 演示

[![Singapore at night, Marina Bay](docs/media/night-singapore.jpg)](docs/media/earth-online-promo.mp4)

Night fly-through of the five cities, plus a short brush stroke. Silent, about 30 seconds.
五座城市的夜景飞过，加一小段笔刷。无声，大约 30 秒。

- [16:9 video](docs/media/earth-online-promo.mp4)
- [16:9 视频](docs/media/earth-online-promo.mp4)
- [Square video](docs/media/earth-online-promo-square.mp4)
- [方形视频](docs/media/earth-online-promo-square.mp4)

| Singapore | San Francisco Bay | New York |
|---|---|---|
| [![Singapore](docs/media/night-singapore.jpg)](docs/media/night-singapore.jpg) | [![San Francisco Bay](docs/media/night-bay.jpg)](docs/media/night-bay.jpg) | [![New York](docs/media/night-nyc.jpg)](docs/media/night-nyc.jpg) |

| Hong Kong | Tokyo |
|---|---|
| [![Hong Kong](docs/media/night-hk.jpg)](docs/media/night-hk.jpg) | [![Tokyo](docs/media/night-tokyo.jpg)](docs/media/night-tokyo.jpg) |

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

The map data is raw gzip (`<city>data/*.bin`, same bytes as the old base64 `.txt` without the text encoding), up to about 10 MB per file, about 188 MB in all. The page asks for `.bin` first.
地图数据是原始 gzip（`<city>data/*.bin`，就是原来的 base64 `.txt` 去掉文本编码后的字节），单个文件大约不超过 10 MB，总共约 188 MB。页面会优先请求 `.bin`。

## Source 源码

`src/` holds what builds the pages:
`src/` 里是生成这些网页的程序：

- `src/city-brush-v16.html`: the base app.
- `src/city-brush-v16.html`：基础程序。
- `src/sgreal/patch17.py`: assembles a city page: `CITY=sg|bay|nyc|hk|tyo python3 sgreal/patch17.py city-brush-v16.html out.html`.
- `src/sgreal/patch17.py`：拼出一个城市的网页：`CITY=sg|bay|nyc|hk|tyo python3 sgreal/patch17.py city-brush-v16.html out.html`。
- `src/lm*/`, `src/bay/`, `src/nyc/`, `src/hk/`, `src/tyo/`: the feature modules and the landmark models.
- `src/lm*/`、`src/bay/`、`src/nyc/`、`src/hk/`、`src/tyo/`：功能模块和地标模型。
- `src/lm40/`: Singapore v40, 96 new landmarks and parks in 8 areas (`sg40a` … `sg40h`); `lm40/INTEGRATE.md` lists the open checks.
- `src/lm40/`：新加坡 v40，8 个片区新增 96 个地标和园区（`sg40a` … `sg40h`）；待核实的事项写在 `lm40/INTEGRATE.md`。
- `src/<city>real/`: the data pipelines that turn OpenStreetMap + AWS terrain tiles into the map data. Each has a README with its stages.
- `src/<city>real/`：把 OpenStreetMap 和 AWS 地形图块转换成地图数据的流程，每个文件夹都有 README 说明各个步骤。

Note: the build scripts still use the absolute workspace path they were written in (`SC = …/scratchpad/`). Change `SC` / `ROOT` to your checkout to rebuild.
注意：这些脚本里还写着当时工作目录的绝对路径（`SC = …/scratchpad/`），重新生成前要把 `SC` / `ROOT` 改成你自己的目录。

## Data and credits 数据与致谢

- Map data © OpenStreetMap contributors, available under the Open Database License (ODbL): https://www.openstreetmap.org/copyright
- 地图数据 © OpenStreetMap 贡献者，按开放数据库许可（ODbL）提供：https://www.openstreetmap.org/copyright
- Terrain: AWS Terrain Tiles (Mapzen / Tilezen terrarium) — https://registry.opendata.aws/terrain-tiles/
- 地形：AWS Terrain Tiles（Mapzen / Tilezen terrarium）—— https://registry.opendata.aws/terrain-tiles/
- For these five cities that is USGS 3DEP (San Francisco and New York), SRTM and GMTED2010, and NOAA ETOPO1 for the sea floor. Credit: “3DEP, SRTM and GMTED2010 terrain data courtesy of the U.S. Geological Survey. ETOPO1 terrain data courtesy of the U.S. National Oceanic and Atmospheric Administration.” The full Tilezen list is https://github.com/tilezen/joerd/blob/master/docs/attribution.md
- 这五座城市用到的是 USGS 3DEP（旧金山和纽约）、SRTM 与 GMTED2010，以及 NOAA 的 ETOPO1 海底。署名：“3DEP、SRTM 和 GMTED2010 地形数据由美国地质调查局（USGS）提供。ETOPO1 地形数据由美国国家海洋和大气管理局（NOAA）提供。” Tilezen 的完整清单：https://github.com/tilezen/joerd/blob/master/docs/attribution.md

## License 许可

The code in this repository — the pages, the programs in `src/`, and the original landmark models — is under the MIT License, copyright (c) 2026 Aster Wang. The text is in `LICENSE`.
本仓库的代码（网页、`src/` 里的程序、原创地标模型）使用 MIT 许可证，版权所有 (c) 2026 Aster Wang。全文在 `LICENSE`。

The map data is not MIT. `site/<city>data/*.txt`, and anything else derived from OpenStreetMap, is under the Open Database License (ODbL) 1.0. Credit “© OpenStreetMap contributors”, and if you share a derived database, offer it under the ODbL. Details, including the Singapore Overture / HDB3D note and the terrain credit above, are in `DATA_LICENSE`.
地图数据不是 MIT。`site/<city>data/*.txt` 以及任何从 OpenStreetMap 派生的内容，使用开放数据库许可 ODbL 1.0。请署名 “© OpenStreetMap contributors”；如果再发布派生数据库，也必须用 ODbL。说明（含新加坡的 Overture / HDB3D，以及上面的地形署名）在 `DATA_LICENSE`。

The running map keeps a “© OpenStreetMap contributors” link in the corner, including when the rest of the interface is hidden. The line under the city name repeats it. Leave both in place.
运行中的地图在角落有一条 “© OpenStreetMap contributors” 链接，隐藏界面时也还在。城市名下面的那一行会再写一次。请两处都留着。

three.js r128 is loaded from a CDN and stays under its own MIT licence. The Noto Sans SC and JetBrains Mono fonts are loaded from Google Fonts and are not in this repository.
three.js r128 从 CDN 加载，仍使用它自己的 MIT 许可证。Noto Sans SC 和 JetBrains Mono 字体从 Google Fonts 加载，不在本仓库里。
- Landmark models are original, simplified works. No company logos or characters are used.
- 地标模型都是自己做的简化模型，没有使用公司标志或卡通角色。
- Hong Kong's signs follow the position, size, colour and style of real signs, but every name on them is invented; no real brands, look-alike names or logo shapes.
- 香港的招牌按真实招牌的位置、大小、颜色和风格来做，但上面的名字都是编的，没有真实品牌、谐音名或标志图形。
