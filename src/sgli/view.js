/* Public, read-only modelling statistics for the Little India modules (camera harness uses mktest.__t). */
window.LittleIndia = {get stats(){ const s = {}; for (const k of Object.keys(SGLI.data)) if (SGBV.stats[k]) s[k] = SGBV.stats[k]; return s; }};
