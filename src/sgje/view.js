/* Public, read-only modelling statistics for the Jurong East modules (camera harness uses mktest.__t). */
window.JurongEast = {get stats(){ const s = {}; for (const k of Object.keys(SGJE.data)) if (SGBV.stats[k]) s[k] = SGBV.stats[k]; return s; }};
