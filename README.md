# EARTH ONLINE · City Brush 城市笔刷

Five real cities at 1:1 in the browser, built with three.js r128 and OpenStreetMap:
浏览器里 1:1 的五座真实城市，用 three.js r128 和 OpenStreetMap 做成：

| page 页面 | city 城市 | landmarks 地标 |
|---|---|---|
| `site/index.html` | Singapore 新加坡 | Marina Bay, NUS, Changi, Gardens by the Bay … |
| `site/bay.html` | San Francisco Bay Area 旧金山湾区 | Golden Gate, Bay Bridge, company HQs … |
| `site/nyc.html` | New York City 纽约 | ~420 landmarks |
| `site/hk.html` | Hong Kong 香港 | 92 landmarks, Shenzhen skyline |
| `site/tyo.html` | Tokyo 东京 | 84 landmarks, Mount Fuji on the horizon |

Real roads, rail, buildings, terrain and water; landmark models; intro cards; 中 / EN / 双 language switch; driving,
flying, races, multiplayer, Cthulhu mode; weather; speed or local time.
真实的道路、铁路、建筑、地形和水面；地标模型；介绍卡；中 / EN / 双 语言切换；驾驶、飞行、比赛、多人、克苏鲁模式；天气；倍速或当地时间。

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
- Landmark models are original, simplified works. No company logos, brand colours or characters are used.
- 地标模型都是自己做的简化模型，没有使用公司标志、品牌配色或卡通角色。
