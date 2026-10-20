/* ================= v25: after the New York landmark modules — one map label per structure (sub-keys of split models stay unlabelled) ================= */
for (const k of ['nycitigroupe', 'nycolumbia_b', 'nyhighbridge_tower']) if (LANDMARKS[k]) LANDMARKS[k].label = false;
