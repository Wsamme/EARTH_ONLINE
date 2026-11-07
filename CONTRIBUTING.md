# Contributing

Issues and pull requests are welcome. The interesting part of a change is usually small: a landmark, a brush behaviour, a loading fix, a sentence on the page. Say what a person can see when the change is done.

## Run it

```bash
cd site
python3 -m http.server 8000
```

Open <http://localhost:8000>. The other cities are `bay.html`, `nyc.html`, `hk.html` and `tyo.html`. Serve the folder. Opening an HTML file from disk will not load the tiles.

## Rebuild a page

The HTML in `site/` is generated. Change the source, then rebuild. From `src/`:

```bash
CITY=sg python3 sgreal/patch17.py city-brush-v16.html ../site/index.html
```

`CITY` is `sg`, `bay`, `nyc`, `hk` or `tyo`. Singapore writes `site/index.html` and `site/app.js`. The others write `site/<city>.html` and `site/<city>-app.js`. `patch17.py` finds this checkout from its own file. Do not put a machine-specific absolute path back in.

Rebuilding a page does not rebuild the map. The `.bin` tiles come from the pipelines in `src/sgreal`, `src/bayreal`, `src/nycreal`, `src/hkreal` and `src/tyoreal`. Those folders have their own notes. The tiles are derived from OpenStreetMap. Read [DATA_LICENSE](DATA_LICENSE) before you replace or republish them.

## Please leave these alone

- The corner credit: “© OpenStreetMap contributors” and “Terrain · USGS / NOAA”. It has to stay visible when the panel is hidden and when `H` hides the rest of the interface. The line under the city name repeats the OpenStreetMap credit. A rebuild should keep both.
- The licence split. Code in `LICENSE` is MIT. Map data is ODbL. Don’t put the map under MIT.
- Secrets, `.env` files, and `__pycache__/`. Don’t commit them.
- `docs/media/` is for the README. The site root on Vercel is `site/`, so keep demo videos out of `site/` unless you mean to deploy them.

## The page people actually use

- The interface is English. A saved Chinese or bilingual language choice is not restored.
- A city opens in View. One finger orbits, two fingers pan and pinch. A paint tool uses one finger to paint.
- On a phone, buildings far from the camera are coarse boxes. Don’t “fix” that by drawing every tile at full detail on a phone.
- Hong Kong’s signs use invented names. Don’t put real brands or logo shapes on them.
- Landmark models are original. Don’t drop in a company’s logo or a character.

## Pull requests

- One change per pull request, with a screenshot or a short note of what you clicked.
- Match the style of the file you are editing.
- If you touch `src/city-brush-v16.html` or a module that `patch17.py` concatenates, rebuild the five pages so `site/` matches `src/`.
- Don’t commit a generated cache, and don’t rewrite git history to scrub a file.
