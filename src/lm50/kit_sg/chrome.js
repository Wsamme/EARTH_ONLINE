// lm50: locate the headless Chromium (the lm20/lm40 kits hard-code /opt/pw-browsers/chromium-1194, which is gone).
const fs = require('fs');
module.exports = process.env.CHROME || ['/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', '/opt/pw-browsers/chromium/chrome-linux64/chrome', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome']
  .concat(fs.existsSync('/opt/pw-browsers') ? fs.readdirSync('/opt/pw-browsers').filter(d => /^chromium-\d+$/.test(d)).sort().reverse().map(d => `/opt/pw-browsers/${d}/chrome-linux64/chrome`) : [])
  .find(p => fs.existsSync(p));
