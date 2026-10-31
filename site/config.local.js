/* Empty on purpose — there is no API key in this file.
   To use Google Photorealistic 3D Tiles, either open the page as
     http://127.0.0.1:8000/?gkey=YOUR_KEY
   or put your key on the next line and do not commit it:
     window.GOOGLE_MAPS_API_KEY = "YOUR_KEY";
   The key is visible in the browser. Restrict it by HTTP referrer.
   This path is listed in .gitignore; the empty stub is tracked only so a
   fresh checkout does not 404. After you add a real key, run
     git rm --cached site/config.local.js
   so later edits stay untracked. */
window.GOOGLE_MAPS_API_KEY = window.GOOGLE_MAPS_API_KEY || "";
