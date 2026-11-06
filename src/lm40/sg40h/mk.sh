#!/bin/bash
# assemble sg40h.js: one block = data + helpers + models
cd "$(dirname "$0")"
{ echo '{'; echo '// City Brush lm40 — sg40h (East): Benjamin Sheares Bridge, Bedok Jetty, Koon Seng Road, Geylang Serai, Paya Lebar Quarter, Singapore Expo, SUTD, Changi Chapel, Changi Village, Chek Jawa, Sri Senpaga Vinayagar, The Red House'; cat data.js src_a.js src_b.js src_c.js src_d.js; echo '}'; } > sg40h.js
node --check sg40h.js && echo OK
