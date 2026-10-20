// ===== City Brush v20 · lm20/f1track — the Marina Bay Street Circuit in its current layout (2023 onward: 19 turns; the Raffles
// Avenue straight replaces the old Turns 16-19 over The Float) =====
// Replaces the app's sgF1 (drawn from SGD.f1) and keeps the net.f1 contract of the F1 drive module (lm20/f1d): a closed centreline
// P[0..n] in race direction (anticlockwise), surface heights y[0..n] (+0.12), cum, L, im, cars, n; plus optional per-vertex arrays
// that the updated f1d (lm20/f1track/f1d.js) uses: startI, hl / hr (white lines, m from the centreline), wl / wr (walls); pit (lane).
// Centreline: bacinger/f1-circuits sg-2008.geojson (that file is the current 19-turn layout, listed clockwise: reversed), the OSM
// raceway ways "Marina Bay Street Circuit" (Turn 16 -> Turn 3 with the purpose-built pit straight; the Esplanade Drive crossover)
// and "Pit Lane", the OSM roads at the Turn 13 hairpin (Fullerton Road service road -> Esplanade Drive northbound deck), centred on
// the downstream roadway of Anderson Bridge (Turn 12: "the left lane of the bridge"); Gaussian smoothing (5 m, 9 m in the tight
// street corners), resampled every 5 m; [0] = the start / finish line. Data prep: lm20/f1track/tools (mkline.py, gen.py).
// The racing surface (one mesh: asphalt, white lines, red-white kerbs from the corner curvature, run-off, pit lane, grid) sits 7 cm
// over the rendered road surfaces (SGRoads.surfaceAt: bridges and flyovers included; the Anderson Bridge deck of its landmark model)
// and is drawn after the road markings. Walls, catch fences, light pylons, marshal posts and grandstands keep clear of the real
// buildings, the landmark ground plans (SGR.hulls), the MRT kiosks, decks' edges and overhead structures; app street trees inside the
// circuit corridor are removed; the OSM raceway ways are not drawn by the road module (the circuit's surfaces replace them).
// Pit building on its real footprint (OSM), paddock units, ten pit wall stands, eleven grandstands, start gantry (lights follow the
// race), 21 marshal posts, ~160 projector bars on truss pylons / wall poles / stand fronts, lit at night (HOOKS.frame fades them in).
// No sponsor names, logos or brand colours. Test handle: window.F1T (stats, line, W = per-vertex widths and surfaces, pit).
{
const F1T_D = {C:[2137.2,-2570.7,2136.5,-2565.7,2135.8,-2560.8,2135,-2555.8,2134.3,-2550.9,2133.6,-2545.9,2132.8,-2541,2132.1,-2536.1,2131.3,-2531.1,2130.6,-2526.2,2129.9,-2521.2,2129.1,-2516.3,2128.4,-2511.3,2127.7,-2506.4,2126.9,-2501.5,2126.2,-2496.5,2125.4,-2491.6,2124.7,-2486.6,2124,-2481.7,2123.2,-2476.7,2122.5,-2471.8,2121.8,-2466.8,2121,-2461.9,2120.3,-2457,2119.6,-2452,2118.8,-2447.1,2118.1,-2442.1,2117.3,-2437.2,2116.6,-2432.2,2115.9,-2427.3,2115.1,-2422.4,2114.4,-2417.4,2113.7,-2412.5,2112.9,-2407.5,2112.2,-2402.6,2111.4,-2397.6,2110.7,-2392.7,2110,-2387.8,2109.2,-2382.8,2108.5,-2377.9,2107.8,-2372.9,2107,-2368,2106.3,-2363,2105.5,-2358.1,2104.8,-2353.2,2104.1,-2348.2,2103.3,-2343.3,2102.6,-2338.3,2101.8,-2333.4,2101.1,-2328.4,2100.4,-2323.5,2099.6,-2318.6,2098.9,-2313.6,2098.2,-2308.7,2097.4,-2303.7,2096.6,-2298.8,2095.2,-2294,2092.8,-2289.6,2089.3,-2286.2,2084.8,-2283.8,2080,-2282.7,2075,-2282.4,2070,-2282.3,2065,-2282.2,2060,-2282.2,2055,-2282.1,2050,-2281.6,2045.1,-2280.7,2040.3,-2279.3,2035.6,-2277.6,2031,-2275.7,2026.5,-2273.5,2022.1,-2271.3,2017.6,-2269,2013.2,-2266.6,2009.2,-2263.6,2006,-2259.8,2003.4,-2255.5,2001,-2251.1,1998.5,-2246.8,1995.7,-2242.7,1992.5,-2238.8,1988.7,-2235.7,1984.2,-2233.3,1979.6,-2231.5,1974.8,-2230.2,1969.8,-2229.6,1964.8,-2230,1960.1,-2231.6,1955.8,-2234.1,1951.9,-2237.3,1948.5,-2240.9,1945.4,-2244.8,1942.3,-2248.7,1939.5,-2252.8,1937.3,-2257.3,1936,-2262.2,1935.3,-2267.1,1934.8,-2272.1,1934.3,-2277,1933.8,-2282,1933.3,-2287,1932.8,-2292,1932.3,-2296.9,1931.8,-2301.9,1931.4,-2306.9,1931,-2311.9,1930.9,-2316.9,1930.9,-2321.9,1930.9,-2326.9,1931,-2331.9,1931.4,-2336.8,1932,-2341.8,1932.8,-2346.7,1933.8,-2351.6,1935.1,-2356.5,1936.7,-2361.2,1938.5,-2365.9,1940.4,-2370.5,1942.4,-2375.1,1944.5,-2379.6,1946.6,-2384.2,1948.5,-2388.8,1950.3,-2393.4,1952,-2398.1,1953.8,-2402.8,1955.5,-2407.5,1957.2,-2412.2,1958.9,-2416.9,1960.6,-2421.6,1962.3,-2426.3,1964,-2431,1965.7,-2435.7,1967.4,-2440.4,1969.1,-2445.1,1970.8,-2449.8,1972.5,-2454.5,1974.2,-2459.2,1975.9,-2463.9,1977.6,-2468.6,1979.1,-2473.3,1980.4,-2478.2,1981.5,-2483.1,1982.5,-2488,1983.4,-2492.9,1984.4,-2497.8,1985.3,-2502.7,1986.3,-2507.6,1987.2,-2512.5,1988.2,-2517.4,1989.1,-2522.3,1989.9,-2527.2,1990.5,-2532.2,1991,-2537.2,1991.3,-2542.2,1991.7,-2547.2,1992,-2552.1,1992.4,-2557.1,1992.7,-2562.1,1992.8,-2567.1,1992.6,-2572.1,1991.9,-2577.1,1991,-2582,1989.5,-2586.7,1987.5,-2591.3,1985.1,-2595.7,1982.4,-2599.9,1979.2,-2603.7,1975.4,-2606.9,1971.3,-2609.8,1967.1,-2612.5,1962.8,-2615,1958.3,-2617.2,1953.7,-2619.3,1949.1,-2621.1,1944.3,-2622.6,1939.4,-2623.7,1934.5,-2624.3,1929.5,-2624.5,1924.5,-2624.4,1919.5,-2624.1,1914.5,-2623.8,1909.5,-2623.5,1904.5,-2623.2,1899.5,-2622.9,1894.5,-2622.6,1889.6,-2622.3,1884.6,-2622.1,1879.6,-2621.8,1874.6,-2621.5,1869.6,-2621.2,1864.6,-2620.9,1859.6,-2620.6,1854.6,-2620.3,1849.6,-2620,1844.7,-2619.7,1839.7,-2619.4,1834.7,-2619.1,1829.7,-2618.8,1824.7,-2618.5,1819.7,-2618.2,1814.7,-2618,1809.7,-2617.7,1804.7,-2617.4,1799.8,-2617.1,1794.8,-2616.8,1789.8,-2616.5,1784.8,-2616.2,1779.8,-2615.9,1774.8,-2615.6,1769.8,-2615.3,1764.8,-2615,1759.8,-2614.7,1754.8,-2614.4,1749.8,-2614.2,1744.9,-2613.9,1739.9,-2613.6,1734.9,-2613.3,1729.9,-2613,1724.9,-2612.7,1719.9,-2612.4,1714.9,-2612.1,1709.9,-2611.8,1704.9,-2611.5,1700,-2611.2,1695,-2610.9,1690,-2610.7,1685,-2610.3,1680,-2610.1,1675,-2609.8,1670,-2609.5,1665,-2609.2,1660,-2608.9,1655,-2608.6,1650.1,-2608.3,1645.1,-2608,1640.1,-2607.7,1635.1,-2607.4,1630.1,-2607.1,1625.1,-2606.8,1620.1,-2606.6,1615.1,-2606.3,1610.1,-2606,1605.2,-2605.7,1600.2,-2605.4,1595.2,-2605.1,1590.2,-2604.8,1585.2,-2604.5,1580.2,-2604.2,1575.2,-2603.9,1570.2,-2603.4,1565.3,-2602.8,1560.4,-2601.9,1555.5,-2601,1550.5,-2600.1,1545.6,-2599.1,1540.8,-2598,1536,-2596.5,1531.3,-2594.8,1526.6,-2593.1,1521.9,-2591.3,1517.3,-2589.5,1512.6,-2587.7,1507.9,-2585.9,1503.3,-2584.1,1498.7,-2582.2,1494.2,-2579.9,1489.8,-2577.5,1485.5,-2575,1481.2,-2572.5,1476.8,-2570,1472.5,-2567.6,1468.2,-2565.1,1463.8,-2562.6,1459.5,-2560.1,1455.2,-2557.6,1450.8,-2555.1,1446.5,-2552.6,1442.2,-2550.1,1437.8,-2547.6,1433.5,-2545.1,1429.2,-2542.6,1424.8,-2540.2,1420.5,-2537.7,1416.2,-2535.2,1411.8,-2532.7,1407.5,-2530.2,1403.2,-2527.7,1398.8,-2525.2,1394.5,-2522.7,1390.2,-2520.2,1385.8,-2517.7,1381.5,-2515.2,1377.2,-2512.8,1372.8,-2510.3,1368.5,-2507.8,1364.2,-2505.3,1359.8,-2502.8,1355.5,-2500.3,1351.2,-2497.8,1346.8,-2495.3,1342.5,-2492.8,1338.2,-2490.3,1333.8,-2487.8,1329.5,-2485.4,1325.2,-2482.9,1320.8,-2480.4,1316.5,-2477.9,1312.2,-2475.4,1307.8,-2472.9,1303.5,-2470.4,1299.2,-2467.9,1294.8,-2465.4,1290.5,-2462.9,1286.2,-2460.5,1281.8,-2458,1277.5,-2455.5,1273.2,-2453,1268.8,-2450.5,1264.5,-2448,1260.2,-2445.5,1255.8,-2443,1251.5,-2440.5,1247.2,-2438,1242.8,-2435.6,1238.5,-2433.1,1234.2,-2430.6,1229.7,-2428.3,1225.2,-2426.2,1220.5,-2424.5,1215.6,-2423.7,1210.7,-2424.6,1206.4,-2427.1,1203,-2430.7,1200,-2434.8,1197.3,-2439,1194.7,-2443.2,1192.1,-2447.5,1189.6,-2451.8,1187,-2456.1,1184.5,-2460.4,1181.9,-2464.7,1179.4,-2469,1176.8,-2473.3,1174.2,-2477.6,1171.7,-2481.9,1169.1,-2486.2,1166.6,-2490.5,1164,-2494.8,1161.5,-2499.1,1158.9,-2503.3,1156.4,-2507.6,1153.8,-2511.9,1151.3,-2516.3,1148.8,-2520.6,1146.5,-2525,1144.2,-2529.5,1141.9,-2533.9,1139.6,-2538.3,1137.3,-2542.8,1135,-2547.2,1132.8,-2551.7,1130.5,-2556.1,1128.2,-2560.6,1125.9,-2565,1123.6,-2569.5,1121.3,-2573.9,1119,-2578.3,1116.8,-2582.8,1114.4,-2587.2,1112,-2591.6,1109.1,-2595.7,1105.3,-2598.8,1100.6,-2600.4,1095.6,-2599.9,1091.1,-2597.7,1087.2,-2594.6,1083.7,-2591.1,1080.2,-2587.5,1076.7,-2583.9,1073.2,-2580.3,1069.8,-2576.7,1066.3,-2573.1,1062.9,-2569.5,1059.4,-2565.9,1055.9,-2562.3,1052.5,-2558.7,1049,-2555.1,1045.6,-2551.5,1042.1,-2547.9,1038.6,-2544.3,1035.2,-2540.7,1031.7,-2537.1,1028.2,-2533.4,1024.8,-2529.8,1021.3,-2526.2,1017.9,-2522.6,1014.4,-2519,1010.9,-2515.4,1007.5,-2511.8,1004,-2508.2,1000.4,-2504.8,996.5,-2501.6,992.5,-2498.7,988.4,-2495.8,984.2,-2493,980.1,-2490.2,975.9,-2487.4,971.7,-2484.8,967.4,-2482.2,963,-2479.9,958.2,-2478.6,953.2,-2478.7,948.3,-2479.6,943.5,-2480.8,938.8,-2482.7,934.7,-2485.4,930.8,-2488.7,927.1,-2492,923.5,-2495.4,920.1,-2499.1,917.2,-2503.1,914.6,-2507.4,912.2,-2511.8,909.8,-2516.2,907.4,-2520.6,904.9,-2524.9,902.5,-2529.3,900.1,-2533.7,897.6,-2538,895.2,-2542.4,892.7,-2546.8,890.3,-2551.1,887.9,-2555.5,885.4,-2559.8,883,-2564.2,880.5,-2568.6,878.1,-2572.9,875.6,-2577.3,873.2,-2581.6,870.8,-2586,868.3,-2590.3,865.9,-2594.7,863.4,-2599.1,861,-2603.4,858.5,-2607.8,856.1,-2612.2,853.6,-2616.5,851.2,-2620.9,848.8,-2625.2,846.3,-2629.6,843.9,-2633.9,841.4,-2638.3,839,-2642.7,836.5,-2647,834.1,-2651.4,831.7,-2655.8,829.2,-2660.1,826.8,-2664.5,824.3,-2668.8,821.9,-2673.2,819.4,-2677.6,817,-2681.9,814.5,-2686.3,812.1,-2690.6,809.6,-2695,807.2,-2699.3,804.8,-2703.7,802.3,-2708.1,799.9,-2712.4,797.4,-2716.8,795,-2721.1,792.5,-2725.5,790,-2729.8,787.6,-2734.2,785.1,-2738.6,782.7,-2742.9,780.2,-2747.3,777.8,-2751.6,775.4,-2756,772.9,-2760.3,770.5,-2764.7,768,-2769,765.5,-2773.4,763.1,-2777.8,760.6,-2782.1,758.2,-2786.5,755.8,-2790.8,753.3,-2795.2,750.8,-2799.5,748.4,-2803.9,745.9,-2808.2,743.4,-2812.5,740.8,-2816.8,738.3,-2821.1,735.7,-2825.4,733.4,-2829.8,731.6,-2834.5,730.9,-2839.4,730.9,-2844.4,731.3,-2849.4,731.9,-2854.4,732.7,-2859.3,733.7,-2864.2,735.2,-2868.9,737.3,-2873.5,739.8,-2877.8,743,-2881.6,746.7,-2885.1,750.4,-2888.3,754.2,-2891.6,758.2,-2894.7,762.2,-2897.6,766.3,-2900.5,770.4,-2903.4,774.5,-2906.2,778.6,-2909,782.8,-2911.7,787,-2914.4,791.3,-2917,795.7,-2919.4,800.3,-2921.4,805,-2923.1,809.7,-2924.7,814.4,-2926.4,819,-2928.3,823.2,-2931.1,826.1,-2935.1,827.3,-2939.9,826.7,-2944.8,825.2,-2949.6,823.7,-2954.4,822.5,-2959.2,821.8,-2964.2,821.4,-2969.2,821.5,-2974.2,822.4,-2979.1,823.8,-2983.9,825.2,-2988.7,826.6,-2993.5,828.1,-2998.2,830.1,-3002.8,832.6,-3007.1,835.5,-3011.2,838.7,-3015.1,842.1,-3018.7,845.6,-3022.3,848.7,-3026.2,851.7,-3030.2,855.2,-3033.8,859,-3037,862.9,-3040.1,866.8,-3043.2,870.7,-3046.4,874.6,-3049.5,878.5,-3052.7,882.4,-3055.8,886.2,-3058.9,890.1,-3062.1,894,-3065.2,897.9,-3068.4,901.8,-3071.5,905.7,-3074.6,909.6,-3077.8,913.5,-3080.9,917.4,-3084.1,921.2,-3087.2,925.1,-3090.3,928.8,-3093.8,931.3,-3098.1,932.6,-3102.9,934.3,-3107.6,936.7,-3112,939.4,-3116.2,942.2,-3120.2,945.2,-3124.3,948.4,-3128.1,951.7,-3131.8,955.3,-3135.4,959.2,-3138.4,963.8,-3140.3,968.8,-3140,972.9,-3137.2,975.6,-3133.1,977.2,-3128.4,978.3,-3123.5,979.3,-3118.6,980.3,-3113.7,981.2,-3108.8,982.1,-3103.9,983.1,-3099,984,-3094.1,984.9,-3089.2,985.9,-3084.2,986.8,-3079.3,987.8,-3074.4,988.7,-3069.5,989.6,-3064.6,990.5,-3059.7,991.5,-3054.8,992.4,-3049.9,993.4,-3045,994.3,-3040.1,995.2,-3035.1,996.2,-3030.2,997.1,-3025.3,998,-3020.4,999,-3015.5,999.9,-3010.6,1000.9,-3005.7,1001.8,-3000.8,1002.7,-2995.9,1003.7,-2990.9,1004.6,-2986,1005.5,-2981.1,1006.5,-2976.2,1007.4,-2971.3,1008.3,-2966.4,1009.3,-2961.5,1010.2,-2956.6,1011.1,-2951.7,1012.1,-2946.8,1013,-2941.9,1014,-2936.9,1014.9,-2932,1015.8,-2927.1,1016.8,-2922.2,1017.7,-2917.3,1018.6,-2912.4,1019.6,-2907.5,1020.5,-2902.6,1021.5,-2897.7,1022.4,-2892.8,1023.3,-2887.8,1024.3,-2882.9,1025.2,-2878,1026.1,-2873.1,1027.1,-2868.2,1028,-2863.3,1028.9,-2858.4,1029.9,-2853.5,1031,-2848.6,1032.3,-2843.8,1033.9,-2839.1,1035.6,-2834.4,1037.3,-2829.7,1039.1,-2825,1040.8,-2820.3,1042.5,-2815.6,1044.3,-2810.9,1046,-2806.2,1047.7,-2801.5,1049.5,-2796.9,1051.2,-2792.2,1052.9,-2787.5,1054.7,-2782.8,1056.4,-2778.1,1058.1,-2773.4,1059.9,-2768.7,1061.6,-2764,1063.3,-2759.3,1065.1,-2754.7,1066.8,-2750,1068.5,-2745.3,1070.3,-2740.6,1072,-2735.9,1073.8,-2731.2,1075.5,-2726.5,1077.1,-2721.8,1078.7,-2717.1,1080.1,-2712.3,1081.5,-2707.5,1082.8,-2702.7,1084.2,-2697.9,1085.6,-2693.1,1087,-2688.2,1088.3,-2683.4,1089.7,-2678.6,1091.1,-2673.8,1092.4,-2669,1093.8,-2664.2,1095.2,-2659.4,1096.9,-2654.7,1099.3,-2650.3,1102.6,-2646.6,1106.5,-2643.4,1110.7,-2640.8,1115.3,-2638.8,1120.1,-2637.5,1125,-2636.9,1130,-2637.1,1134.9,-2638.2,1139.4,-2640.3,1143.5,-2643.2,1147.3,-2646.4,1151.2,-2649.6,1155,-2652.9,1158.8,-2656.1,1162.6,-2659.3,1166.4,-2662.6,1170.2,-2665.8,1174,-2669,1177.8,-2672.3,1181.7,-2675.5,1185.5,-2678.7,1189.2,-2682,1193,-2685.3,1196.8,-2688.6,1200.6,-2691.8,1204.3,-2695.1,1208.1,-2698.4,1211.9,-2701.7,1215.6,-2705,1219.4,-2708.3,1223.2,-2711.6,1226.9,-2714.8,1230.7,-2718.1,1234.5,-2721.4,1238.2,-2724.7,1242,-2728,1245.8,-2731.3,1249.5,-2734.6,1253.3,-2737.8,1257,-2741.1,1260.8,-2744.4,1264.6,-2747.7,1268.3,-2751,1272.1,-2754.3,1275.9,-2757.6,1279.6,-2760.8,1283.4,-2764.1,1287.3,-2767.2,1291.5,-2770,1295.9,-2772.4,1300.4,-2774.6,1304.8,-2776.8,1309.4,-2778.9,1314,-2780.9,1318.7,-2782.5,1323.5,-2783.8,1328.3,-2785.2,1333.2,-2786.4,1338.1,-2787.5,1343,-2788.3,1348,-2788.9,1352.9,-2789.5,1357.9,-2790.1,1362.8,-2790.7,1367.8,-2791.3,1372.8,-2791.8,1377.8,-2792.1,1382.8,-2792.4,1387.8,-2792.7,1392.7,-2792.9,1397.7,-2793.2,1402.7,-2793.5,1407.7,-2793.7,1412.7,-2794,1417.7,-2794.3,1422.7,-2794.5,1427.7,-2794.8,1432.7,-2795.1,1437.7,-2795.3,1442.7,-2795.6,1447.6,-2795.8,1452.6,-2796.1,1457.6,-2796.4,1462.6,-2796.6,1467.6,-2796.9,1472.6,-2797.2,1477.6,-2797.4,1482.6,-2797.7,1487.6,-2798,1492.6,-2798.2,1497.5,-2798.5,1502.5,-2798.8,1507.5,-2799,1512.5,-2799.3,1517.5,-2799.6,1522.5,-2799.8,1527.5,-2800.1,1532.5,-2800.3,1537.5,-2800.6,1542.5,-2800.9,1547.5,-2801.1,1552.5,-2801.4,1557.4,-2801.7,1562.4,-2801.9,1567.4,-2802.2,1572.4,-2802.4,1577.4,-2802.7,1582.4,-2803,1587.4,-2803.2,1592.4,-2803.5,1597.4,-2803.8,1602.4,-2804,1607.4,-2804.3,1612.3,-2804.6,1617.3,-2804.8,1622.3,-2805.1,1627.3,-2805.4,1632.3,-2805.6,1637.3,-2805.9,1642.3,-2806.2,1647.3,-2806.4,1652.3,-2806.7,1657.3,-2806.9,1662.3,-2807.2,1667.2,-2807.5,1672.2,-2807.8,1677.2,-2808.1,1682.2,-2808.3,1687.2,-2808.6,1692.2,-2808.9,1697.2,-2809.2,1702.2,-2809.5,1707.2,-2809.8,1712.2,-2810.1,1717.2,-2810.3,1722.1,-2810.6,1727.1,-2810.9,1732.1,-2811.2,1737.1,-2811.5,1742.1,-2811.7,1747.1,-2812,1752.1,-2812.3,1757.1,-2812.6,1762.1,-2812.8,1767.1,-2812.9,1772.1,-2813,1777,-2813.2,1782,-2813.3,1787,-2813.7,1791.9,-2814.6,1796.6,-2816.5,1800.9,-2819,1804.8,-2822.1,1808.1,-2825.8,1810.2,-2830.3,1811.2,-2835.2,1811.5,-2840.2,1811.6,-2845.2,1811.6,-2850.2,1811.7,-2855.2,1812.2,-2860.2,1813.1,-2865.1,1814.6,-2869.8,1816.5,-2874.4,1818.9,-2878.8,1822,-2882.7,1825.7,-2886.1,1829.9,-2888.7,1834.5,-2890.8,1839.2,-2892.3,1844.1,-2893.4,1849.1,-2894.2,1854,-2894.8,1859,-2895.3,1864,-2895.8,1868.9,-2896.3,1873.9,-2896.8,1878.9,-2897.4,1883.8,-2897.9,1888.8,-2898.4,1893.8,-2898.9,1898.8,-2899.4,1903.7,-2899.9,1908.7,-2900.5,1913.7,-2901,1918.7,-2901.5,1923.6,-2902,1928.6,-2902.5,1933.6,-2903.1,1938.5,-2903.6,1943.5,-2904.1,1948.5,-2904.6,1953.5,-2905.1,1958.4,-2905.6,1963.4,-2906.2,1968.4,-2906.7,1973.3,-2907.2,1978.3,-2907.6,1983.3,-2907.9,1988.3,-2908.1,1993.3,-2908.3,1998.3,-2908.5,2003.3,-2908.8,2008.3,-2908.9,2013.3,-2909.2,2018.3,-2909.4,2023.2,-2909.6,2028.2,-2909.8,2033.2,-2910,2038.2,-2910.2,2043.2,-2910.4,2048.2,-2910.6,2053.2,-2910.8,2058.2,-2911,2063.2,-2911.2,2068.2,-2911.4,2073.2,-2911.7,2078.2,-2911.9,2083.2,-2912.1,2088.2,-2912.3,2093.2,-2912.5,2098.2,-2912.5,2103.1,-2912,2108,-2910.8,2112.4,-2908.5,2116,-2905.1,2119.2,-2901.2,2122.1,-2897.2,2124.8,-2893,2127.5,-2888.7,2130.1,-2884.5,2132.8,-2880.2,2135.4,-2876,2138.1,-2871.8,2140.7,-2867.5,2143.3,-2863.3,2146,-2859,2148.6,-2854.8,2151.3,-2850.5,2153.9,-2846.3,2156.6,-2842.1,2159.2,-2837.8,2161.6,-2833.4,2163.4,-2828.8,2164.6,-2823.9,2165.1,-2819,2165.1,-2814,2164.8,-2809,2164.4,-2804,2163.9,-2799,2163.4,-2794.1,2162.8,-2789.1,2162.2,-2784.1,2161.7,-2779.2,2161.1,-2774.2,2160.5,-2769.2,2159.9,-2764.3,2159.4,-2759.3,2158.8,-2754.3,2158.2,-2749.4,2157.6,-2744.4,2157.1,-2739.4,2156.5,-2734.5,2155.9,-2729.5,2155.3,-2724.5,2154.8,-2719.6,2154.2,-2714.6,2153.6,-2709.7,2153,-2704.7,2152.4,-2699.7,2151.9,-2694.8,2151.3,-2689.8,2150.7,-2684.8,2150.1,-2679.9,2149.6,-2674.9,2149,-2669.9,2148.4,-2665,2147.8,-2660,2147.2,-2655,2146.7,-2650.1,2146.1,-2645.1,2145.5,-2640.1,2144.9,-2635.2,2144.4,-2630.2,2143.8,-2625.2,2143.2,-2620.3,2142.6,-2615.3,2142.1,-2610.4,2141.5,-2605.4,2140.9,-2600.4,2140.3,-2595.5,2139.8,-2590.5,2139.2,-2585.5,2138.6,-2580.6,2137.9,-2575.6],
PIT:[1985.6,-2908,2093.1,-2903,2106.8,-2898.5,2118.4,-2884,2144.1,-2843.7,2148.3,-2835.1,2152.2,-2811,2087.4,-2317.4,2084.4,-2308.8,2077.3,-2300.2,2070.7,-2296.3,2040.5,-2288.9,2031,-2284.7,2009.2,-2269.6,2008.3,-2264.3]};
const F1T = {stats:{}, log:[], ms:0};
if (typeof window !== 'undefined') window.F1T = F1T;
const cl = (v, a, b) => v < a ? a : v > b ? b : v;
const sstep = t => { t = cl(t, 0, 1); return t*t*(3 - 2*t); };
const lerp = (a, b, t) => a + (b - a)*t;

/* ---------------- materials (module-level, reused across rebuilds) ---------------- */
let MT = null;
function f1tMats(){
  if (MT) return MT;
  const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
  g.clearRect(0, 0, 32, 32); g.strokeStyle = 'rgba(64,68,72,0.95)'; g.lineWidth = 2.4;
  g.beginPath(); for (const o of [-32, 0, 32]){ g.moveTo(o, 0); g.lineTo(o + 32, 32); g.moveTo(o + 32, 0); g.lineTo(o, 32); } g.stroke();
  g.fillStyle = 'rgba(64,68,72,0.95)'; g.fillRect(0, 0, 32, 2);
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4;
  MT = {
    // the racing surface, run-off, kerbs, lines and the pit lane: 7 cm over the rendered road surfaces with a small polygon offset
    // (roads use -2 / -4). Drawn in the transparent pass (opacity 1, depth write on) after the road markings (renderOrder 1, no
    // depth write, -4 / -8), so the markings of the streets the circuit closes never show through it.
    track:new THREE.MeshLambertMaterial({vertexColors:true, transparent:true, opacity:1, depthWrite:true, polygonOffset:true, polygonOffsetFactor:-3, polygonOffsetUnits:-8}),
    // catch fences: a diamond wire mesh (alpha from the texture), both sides
    fence:new THREE.MeshLambertMaterial({map:tex, color:0xc4c9ce, transparent:true, depthWrite:false, side:THREE.DoubleSide, alphaTest:0.04}),
    // the start lights (instanced, colour per lamp)
    lamp:new THREE.MeshBasicMaterial({color:0xffffff}),
    car:new THREE.MeshLambertMaterial({vertexColors:true}),
    // night: light pools on the racing surface, lit wall faces, projector lenses (additive; opacity follows the night)
    glow:new THREE.MeshBasicMaterial({vertexColors:true, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide, polygonOffset:true, polygonOffsetFactor:-6, polygonOffsetUnits:-14}),
    spr:new THREE.PointsMaterial({size:22, map:lampTex, color:0xffffff, vertexColors:true, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true})
  };
  return MT;
}

/* ---------------- the centreline ---------------- */
function f1tLine(){
  const C = F1T_D.C, n = C.length >> 1, X = new Float64Array(n + 1), Y = new Float64Array(n + 1);
  for (let i = 0; i < n; i++){ X[i] = C[2*i]; Y[i] = C[2*i + 1]; } X[n] = X[0]; Y[n] = Y[0];
  const DX = new Float64Array(n), DY = new Float64Array(n), cum = new Float64Array(n + 1);
  for (let i = 0; i < n; i++){ const dx = X[i + 1] - X[i], dy = Y[i + 1] - Y[i], l = Math.hypot(dx, dy) || 1; DX[i] = dx/l; DY[i] = dy/l; cum[i + 1] = cum[i] + l; }
  const w = i => ((i % n) + n) % n;
  // vertex normals (left) with a miter scale so that offset curves stay parallel; signed curvature (left > 0)
  const NX = new Float64Array(n), NY = new Float64Array(n), MS = new Float64Array(n), K = new Float64Array(n);
  for (let i = 0; i < n; i++){ const a = w(i - 1); let dx = DX[a] + DX[i], dy = DY[a] + DY[i]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    NX[i] = -dy; NY[i] = dx; MS[i] = 1/Math.max(0.6, dx*DX[i] + dy*DY[i]); }
  for (let i = 0; i < n; i++){ const a = w(i - 2), b = w(i + 1); let t = Math.atan2(DY[b], DX[b]) - Math.atan2(DY[a], DX[a]); while (t > Math.PI) t -= 2*Math.PI; while (t < -Math.PI) t += 2*Math.PI; K[i] = t/(cum[i + 2 > n ? n : i + 2] - cum[Math.max(0, i - 2)] || 20); }
  const Ks = new Float64Array(n); for (let i = 0; i < n; i++){ let s = 0; for (let k = -2; k <= 2; k++) s += K[w(i + k)]; Ks[i] = s/5; }
  const L = cum[n];
  const at = (i, o) => { i = w(i); const m = MS[i]*o; return [X[i] + NX[i]*m, Y[i] + NY[i]*m]; };
  return {n, X, Y, DX, DY, NX, NY, MS, K:Ks, cum, L, w, at};
}

/* ---------------- surfaces: the rendered road surface under a point (bridges included), else the draped ground ---------------- */
function f1tAnderson(){
  // the Anderson Bridge landmark model: deck height = base + yd(local x), roadways between the girders (local z = +-9.2 / +-0.62)
  if (typeof landmarks === 'undefined') return null;
  const L = landmarks.find(q => q.type === 'anderson');
  if (!L || L.top === undefined){
    // no Anderson Bridge model (a build without lm20/w1): the circuit brings a plain deck with three plate girders in its place
    const q = sgXY(1.287266, 103.852979), rot = -0.6789, c = Math.cos(rot), s = Math.sin(rot); let hi = -1;
    for (let a = 0; a < 12; a++) for (const f of [0, 0.35, 0.7]){ const x = q[0] + Math.cos(a/12*Math.PI*2)*44*f, y = q[1] + Math.sin(a/12*Math.PI*2)*44*f; hi = Math.max(hi, hC(x, y)); }
    return {x:q[0], y:q[1], ux:c, uy:s, vx:s, vy:-c, top:hi + 0.6, fallback:true};
  }
  const c = Math.cos(L.rot), s = Math.sin(L.rot);
  return {x:L.x, y:L.y, ux:c, uy:s, vx:s, vy:-c, top:L.top, id:L.id};      // local +x = (c, s); local +z (upstream) = (s, -c)
}
const ydA = x => { const XE = 35.5, a = Math.abs(x); return a > XE ? -0.55*Math.min(1, (a - XE)/3) : 2.9*sstep((XE - a)/20); };
function f1tSurfaceFn(){
  const R = (typeof SGRoads !== 'undefined' && SGRoads.surfaceAt) ? SGRoads : null;
  const G = R && R.ground ? (x, y) => R.ground(x, y) : (x, y) => hC(x, y);
  const AB = f1tAnderson();
  const water = (x, y) => { const k = cx2i(y)*N + cx2i(x); return nat[k] === 1 || nat[k] === 2; };
  // -> [z, kind]: kind 0 ground, 1 carriageway / junction, 2 footway / kerb / island top, 3 landmark deck, 4 water (no support)
  const q = (x, y, zh) => {
    if (AB){ const dx = x - AB.x, dy = y - AB.y, lx = dx*AB.ux + dy*AB.uy, lz = dx*AB.vx + dy*AB.vy;
      if (Math.abs(lx) <= 38.4 && Math.abs(lz) <= 12.2) return [AB.top + ydA(lx), (lz > -9.2 && lz < -0.62) ? 3 : 4, lz]; }
    const r = R ? R.surfaceAt(x, y, zh) : null;
    if (r && (zh === undefined || Math.abs(r.z - zh) < 2.5)) return [r.z, r.k === 2 ? 2 : 1, 0];
    const g = G(x, y);
    if (water(x, y) && g < 0.2) return [g, 4, 0];
    return [g, 0, 0];
  };
  return {q, G, AB};
}

/* ---------------- obstacles: real buildings, landmark ground plans, the pit lane; rays from the centreline ---------------- */
class SegGrid {
  constructor(cs){ this.cs = cs; this.m = new Map(); this.S = []; }
  add(ax, ay, bx, by, tag){ const id = this.S.length; this.S.push([ax, ay, bx, by, tag]); const c = this.cs;
    const x0 = Math.floor(Math.min(ax, bx)/c), x1 = Math.floor(Math.max(ax, bx)/c), y0 = Math.floor(Math.min(ay, by)/c), y1 = Math.floor(Math.max(ay, by)/c);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){ const k = y*100003 + x; let l = this.m.get(k); if (!l) this.m.set(k, l = []); l.push(id); } }
  poly(P, tag){ for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; this.add(a[0], a[1], b[0], b[1], tag); } }
  // first hit of the ray o + d*t, t in [0, tmax]
  ray(ox, oy, dx, dy, tmax){ const c = this.cs, ex = ox + dx*tmax, ey = oy + dy*tmax, seen = new Set(); let best = tmax, tag = null;
    const x0 = Math.floor(Math.min(ox, ex)/c), x1 = Math.floor(Math.max(ox, ex)/c), y0 = Math.floor(Math.min(oy, ey)/c), y1 = Math.floor(Math.max(oy, ey)/c);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){ const l = this.m.get(y*100003 + x); if (!l) continue;
      for (const id of l){ if (seen.has(id)) continue; seen.add(id); const s = this.S[id], sx = s[2] - s[0], sy = s[3] - s[1], den = dx*sy - dy*sx; if (Math.abs(den) < 1e-9) continue;
        const qx = s[0] - ox, qy = s[1] - oy, t = (qx*sy - qy*sx)/den, u = (qx*dy - qy*dx)/den; if (t >= 0 && t < best && u >= 0 && u <= 1){ best = t; tag = s[4]; } } }
    return [best, tag]; }
  // any segment within r of (x, y)?
  near(x, y, r){ const c = this.cs; for (let gy = Math.floor((y - r)/c); gy <= Math.floor((y + r)/c); gy++) for (let gx = Math.floor((x - r)/c); gx <= Math.floor((x + r)/c); gx++){ const l = this.m.get(gy*100003 + gx); if (!l) continue;
    for (const id of l){ const s = this.S[id], sx = s[2] - s[0], sy = s[3] - s[1], l2 = sx*sx + sy*sy || 1, t = cl(((x - s[0])*sx + (y - s[1])*sy)/l2, 0, 1); if (Math.hypot(s[0] + sx*t - x, s[1] + sy*t - y) < r) return s[4] || true; } }
    return false; }
}
const pipF = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0])*(y - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
// real buildings the circuit replaces or that stand on the racing surface (centroid, max height): the OSM pit building, the two
// pit-straight grandstand blocks, the Turn 1 grandstand block, a kiosk on the Turn 17-18 straight, a ground-level link part on Raffles Boulevard
const F1T_HIDE = [[2107, -2611, 16], [2179, -2629, 17.5], [2162, -2505, 11], [2102, -2232, 11], [2098, -2428, 9.5], [2078, -2416, 13.5], [1888, -2902, 7], [1449, -2567, 3.5]];
function f1tHidden(b){ for (const h of F1T_HIDE) if (Math.abs(b.cx - h[0]) < 6 && Math.abs(b.cy - h[1]) < 6 && b.h <= h[2]) return true; return false; }
function f1tObstacles(bb, line){
  const O = new SegGrid(16), roofs = [];
  // landmark ground plans (convex, grown 3 m); a plan the centreline itself crosses is not a wall obstacle (bridges)
  const hullsOn = [];
  if (SGR.hulls) for (const [id, H] of SGR.hulls){ const b = H.bb; if (b[2] < bb[0] || b[0] > bb[2] || b[3] < bb[1] || b[1] > bb[3]) continue;
    let on = 0; for (let i = 0; i < line.n; i++){ const x = line.X[i], y = line.Y[i]; if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue; if (pipF(H.P, x, y)) on++; }
    const L = landmarks.find(q => q.id === id);
    if (on){ const idx = []; for (let i = 0; i < line.n; i++) if (pipF(H.P, line.X[i], line.Y[i])) idx.push(i); hullsOn.push({id, type:L ? L.type : '?', on, i0:idx[0], i1:idx[idx.length - 1]}); continue; }
    O.poly(H.P, 'lm:' + (L ? L.type : id)); }
  F1T.hullsOn = hullsOn;
  // real buildings (ground level), elevated parts and link bridges are roofs
  const TILE = SGR.base.TILE, TX = Math.round(2*HALF/TILE), seen = [];
  for (let ty = Math.floor((bb[1] + HALF)/TILE); ty <= Math.floor((bb[3] + HALF)/TILE); ty++) for (let tx = Math.floor((bb[0] + HALF)/TILE); tx <= Math.floor((bb[2] + HALF)/TILE); tx++){
    const list = SGR.bldData.tiles.get(ty*TX + tx); if (!list) continue;
    for (const b of list){ if (b.foreign || b.cx < bb[0] - 60 || b.cx > bb[2] + 60 || b.cy < bb[1] - 60 || b.cy > bb[3] + 60) continue;
      if (f1tHidden(b)) continue;
      if (SGR.hulls){ let inH = false; for (const H of SGR.hulls.values()){ const q = H.bb; if (b.cx < q[0] || b.cx > q[2] || b.cy < q[1] || b.cy > q[3]) continue; if (pipF(H.P, b.cx, b.cy)){ inH = true; break; } } if (inH) continue; }
      const R = b.rings[0], P = []; for (let k = 0; k < R.length; k += 2) P.push([R[k], R[k + 1]]);
      if (b.base > 2.5){ roofs.push({P, bb:[b.cx - 400, 0, 0, 0], z0:null, base:b.base, b}); continue; }
      O.poly(P, 'b'); seen.push(b); } }
  F1T.nBld = seen.length;
  // the app's MRT entrance kiosks around underground stations (sgMRT: station +-(14, 10), 4.2 x 2.6 m)
  if (net && net.stations) for (const S of net.stations){ if (!S.mrt || S.elev || S.p[0] < bb[0] || S.p[0] > bb[2] || S.p[1] < bb[1] || S.p[1] > bb[3]) continue;
    for (const [ox, oy] of [[14, 10], [-14, -10]]) O.poly(orect([S.p[0] + ox, S.p[1] + oy], [1, 0], 4.6, 3.0), 'mrt'); }
  return {O, roofs};
}
// overhead structures: elevated road decks (classes 0-9, E > 2.5 m) and raised building parts
function f1tOverhead(bb, G){
  const S = new SegGrid(24);
  for (const l of SGR.lines){ if (!l.E || l.c > 9 || (l.flags & 8)) continue; const P = l.P; if (P[0] < bb[0] - 600 || P[0] > bb[2] + 600 || P[1] < bb[1] - 600 || P[1] > bb[3] + 600) continue;
    const hw = ([26,13,20,6.5,15,6,12,5.5,9.5,5][l.c] || 8)/((l.flags & 1) && l.c !== 1 && l.c !== 3 ? 2 : 1)/2 + 1.5;
    for (let k = 0; k + 3 < P.length; k += 2){ const e0 = l.E[k >> 1], e1 = l.E[(k >> 1) + 1]; if (Math.max(e0, e1) < 2.5) continue; S.add(P[k], P[k + 1], P[k + 2], P[k + 3], [e0, e1, hw]); } }
  // -> the lowest soffit (absolute height) over (x, y) above zMin, or Infinity
  return (x, y, roofs, zMin) => { let best = Infinity; const c = S.cs; zMin = zMin === undefined ? -1e9 : zMin;
    for (let gy = Math.floor((y - 20)/c); gy <= Math.floor((y + 20)/c); gy++) for (let gx = Math.floor((x - 20)/c); gx <= Math.floor((x + 20)/c); gx++){ const l = S.m.get(gy*100003 + gx); if (!l) continue;
      for (const id of l){ const s = S.S[id], sx = s[2] - s[0], sy = s[3] - s[1], l2 = sx*sx + sy*sy || 1, t = cl(((x - s[0])*sx + (y - s[1])*sy)/l2, 0, 1), d = Math.hypot(s[0] + sx*t - x, s[1] + sy*t - y);
        if (d < s[4][2]){ const e = lerp(s[4][0], s[4][1], t), z = G(x, y) + e - 1.6; if (z < best && z > zMin) best = z; } } }
    if (roofs) for (const r of roofs){ const b = r.b; if (Math.abs(b.cx - x) > 150 || Math.abs(b.cy - y) > 150) continue; if (pipF(r.P, x, y)){ const z = G(x, y) + b.base - 0.3; if (z < best && z > zMin) best = z; } }
    return best; };
}

/* ---------------- geometry batches ---------------- */
// non-indexed triangle batch with vertex colours (world x, height, world y), optional uv
function TB(uv){ return {p:[], c:[], uv:uv ? [] : null}; }
function tri(B, a, b, c, col){ B.p.push(a[0], a[2], -a[1], b[0], b[2], -b[1], c[0], c[2], -c[1]); for (let k = 0; k < 3; k++) B.c.push(col[0], col[1], col[2]); }
function quad(B, a, b, c, d, col){ tri(B, a, b, c, col); tri(B, a, c, d, col); }
function tbMesh(B, mat){
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(B.c, 3));
  if (B.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
  g.computeVertexNormals(); return new THREE.Mesh(g, mat);
}
// a box between two ground points a -> b (centreline), width w, from z0 to z1 (into the app's structure batch: matBld)
function boxSeg(B, a, b, w, z0a, z1a, z0b, z1b, col){
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); if (l < 1e-4) return; const nx = -dy/l*w/2, ny = dx/l*w/2;
  const q = [[a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny], [a[0] + nx, a[1] + ny]];
  prismV(B, q, [z1a, z1b, z1b, z1a], [z0a, z0b, z0b, z0a], col);
}
function post(B, p, r, z0, z1, col){ addPrism(B, [[p[0] - r, p[1] - r], [p[0] + r, p[1] - r], [p[0] + r, p[1] + r], [p[0] - r, p[1] + r]], z0, z1, col); }
// a thin bar between two 3D points [x, y, z] (square section)
function bar(B, a, b, r, col){
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dy, dz); if (l < 1e-4) return;
  const d = [dx/l, dy/l, dz/l], up = Math.abs(d[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  let u = [d[1]*up[2] - d[2]*up[1], d[2]*up[0] - d[0]*up[2], d[0]*up[1] - d[1]*up[0]]; const ul = Math.hypot(...u); u = u.map(v => v/ul*r);
  const v = [d[1]*u[2] - d[2]*u[1], d[2]*u[0] - d[0]*u[2], d[0]*u[1] - d[1]*u[0]];
  const A = [], Bq = []; for (const [s, t] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]){ A.push([a[0] + u[0]*s + v[0]*t, a[1] + u[1]*s + v[1]*t, a[2] + u[2]*s + v[2]*t]); Bq.push([b[0] + u[0]*s + v[0]*t, b[1] + u[1]*s + v[1]*t, b[2] + u[2]*s + v[2]*t]); }
  const w = [col[0]*0.9, col[1]*0.9, col[2]*0.9];
  for (let k = 0; k < 4; k++){ const j = (k + 1) % 4; pv(B, A[k][0], A[k][2], A[k][1], k % 2 ? col : w); pv(B, Bq[k][0], Bq[k][2], Bq[k][1], k % 2 ? col : w); pv(B, Bq[j][0], Bq[j][2], Bq[j][1], k % 2 ? col : w);
    pv(B, A[k][0], A[k][2], A[k][1], k % 2 ? col : w); pv(B, Bq[j][0], Bq[j][2], Bq[j][1], k % 2 ? col : w); pv(B, A[j][0], A[j][2], A[j][1], k % 2 ? col : w); }
}
// a prism on any simple polygon (earcut roof), walls from z0 to z1
function prismAny(B, P, z0, z1, col, roof){
  const pts = P.map(p => new THREE.Vector2(p[0], p[1])); let tr; try { tr = THREE.ShapeUtils.triangulateShape(pts, []); } catch (e){ tr = []; }
  const ccw = areaP(P) > 0;
  if (roof !== false) for (const t of tr){ const [a, b, c] = ccw ? t : [t[0], t[2], t[1]]; pv(B, P[a][0], z1, P[a][1], col); pv(B, P[b][0], z1, P[b][1], col); pv(B, P[c][0], z1, P[c][1], col); }
  const w = [col[0]*0.92, col[1]*0.92, col[2]*0.92], n = P.length, W = B.win;
  let s = W ? W.u0 : 0; const fh = W ? (W.fh || 3.5) : 3.5, gl = W ? W.glow + 10*(W.zc || 0) : 0, v0 = W ? (z0 - W.base)/fh : 0, v1 = W ? (z1 - W.base)/fh : 0;
  for (let i = 0; i < n; i++){ const a = ccw ? P[i] : P[(n - i) % n], b = ccw ? P[(i + 1) % n] : P[(n - i - 1 + n) % n], ua = s, ub = s + Math.hypot(b[0] - a[0], b[1] - a[1])/(W ? W.ww || 2 : 3.2); s = ub;
    pv(B, a[0], z0, a[1], w, ua, v0, gl); pv(B, b[0], z0, b[1], w, ub, v0, gl); pv(B, b[0], z1, b[1], w, ub, v1, gl); pv(B, a[0], z0, a[1], w, ua, v0, gl); pv(B, b[0], z1, b[1], w, ub, v1, gl); pv(B, a[0], z1, a[1], w, ua, v1, gl); }
}
// a flat quad [a, b, c, d] (3D points, a -> b along the track, d on the far side for s = +1) facing up whatever the side
function quadO2(B, p, s, col){ const q = s > 0 ? p : [p[3], p[2], p[1], p[0]]; for (const k of [0, 1, 2, 0, 2, 3]) pv(B, q[k][0], q[k][2], q[k][1], col); }
// the permanent pit building (OSM footprint)
const F1T_PB = [[2071.5, -2456.5], [2101.5, -2651.0], [2103.2, -2713.8], [2111.5, -2713.2], [2120.0, -2781.5], [2143.2, -2778.5], [2139.8, -2748.8], [2136.0, -2749.5], [2099.8, -2453.5]];
const offP = (P, o) => { const n = P.length, Q = []; for (let i = 0; i < n; i++){ const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; Q.push([P[i][0] - (b[1] - a[1])/l*o, P[i][1] + (b[0] - a[0])/l*o]); } return Q; };
function resampleP(P, step){ const out = [P[0].slice()]; let acc = 0; for (let i = 1; i < P.length; i++){ const a = P[i - 1], b = P[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); let t = step - acc;
  while (t <= l){ out.push([a[0] + (b[0] - a[0])*t/l, a[1] + (b[1] - a[1])*t/l]); t += step; } acc = l - (t - step); } const e = P[P.length - 1]; if (Math.hypot(e[0] - out[out.length - 1][0], e[1] - out[out.length - 1][1]) > step*0.3) out.push(e.slice()); return out; }
function smoothP(P, it){ for (let k = 0; k < it; k++){ const Q = [P[0]]; for (let i = 1; i < P.length - 1; i++) Q.push([(P[i - 1][0] + 2*P[i][0] + P[i + 1][0])/4, (P[i - 1][1] + 2*P[i][1] + P[i + 1][1])/4]); Q.push(P[P.length - 1]); P = Q; } return P; }

/* ---------------- colours ---------------- */
const C_ASPH = [0.25, 0.255, 0.27], C_ASPH2 = [0.29, 0.295, 0.305], C_RUN = [0.33, 0.335, 0.34], C_WHITE = [0.95, 0.95, 0.93], C_RED = [0.82, 0.12, 0.1],
  C_GREEN = [0.24, 0.44, 0.3], C_CONC = [0.82, 0.81, 0.78], C_CONC2 = [0.6, 0.6, 0.58], C_BAND = [0.16, 0.24, 0.42], C_STEEL = [0.62, 0.64, 0.66], C_DSTEEL = [0.34, 0.36, 0.38],
  C_PIT = [0.3, 0.305, 0.315], C_PADDOCK = [0.66, 0.65, 0.62], C_YEL = [0.93, 0.76, 0.18], C_ORANGE = [0.93, 0.47, 0.12], C_BLACK = [0.08, 0.08, 0.09];

/* ================= the circuit ================= */
function f1tBuild(B){
  const T0 = performance.now(), st = F1T.stats = {}; F1T.log = [];
  const M = f1tMats(), Ln = f1tLine(), n = Ln.n, X = Ln.X, Y = Ln.Y, NX = Ln.NX, NY = Ln.NY, MS = Ln.MS, w = Ln.w, at = Ln.at, cum = Ln.cum;
  SGD.f1 = Array.from({length:n}, (_, i) => [X[i], Y[i]]);      // [0] = the start line (the F1 drive module reads SGD.f1[0])
  if (typeof sgrLandmarkHulls === 'function') try { sgrLandmarkHulls(); } catch (e){ console.error('f1track hulls', e); }
  let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; for (let i = 0; i < n; i++){ bx0 = Math.min(bx0, X[i]); bx1 = Math.max(bx1, X[i]); by0 = Math.min(by0, Y[i]); by1 = Math.max(by1, Y[i]); }
  const bb = [bx0 - 120, by0 - 120, bx1 + 120, by1 + 120];
  const SF = f1tSurfaceFn(), G = SF.G;
  const {O, roofs} = f1tObstacles(bb, Ln); const over = f1tOverhead(bb, G);
  st.tObs = performance.now() - T0;

  // ---- the pit lane (OSM), smoothed, 2.5 m
  let PQ = []; { const R = F1T_D.PIT; for (let k = 0; k < R.length; k += 2) PQ.push([R[k], R[k + 1]]); }
  PQ = smoothP(resampleP(PQ, 2.5), 6); const np = PQ.length;
  { const c0 = [0]; for (let j = 1; j < np; j++) c0.push(c0[j - 1] + Math.hypot(PQ[j][0] - PQ[j - 1][0], PQ[j][1] - PQ[j - 1][1]));
    const L0 = c0[np - 1], hp0 = j => 2.6 + 3.4*sstep(Math.min(c0[j], L0 - c0[j])/55); let moved = 0;
    for (let it = 0; it < 2; it++){ const Q = PQ.map(q => q.slice());
      for (let j = 0; j < np; j++){ let bd = 1e18, bi = 0; for (let i = 0; i < n; i++){ const d = (X[i] - PQ[j][0])**2 + (Y[i] - PQ[j][1])**2; if (d < bd){ bd = d; bi = i; } }
        const o = (PQ[j][0] - X[bi])*NX[bi] + (PQ[j][1] - Y[bi])*NY[bi], need = 7.05 + hp0(j) + 0.15;
        if (Math.abs(o) < need){ const dlt = (Math.sign(o) || 1)*need - o; Q[j] = [PQ[j][0] + NX[bi]*dlt, PQ[j][1] + NY[bi]*dlt]; moved = Math.max(moved, Math.abs(dlt)); } }
      PQ = smoothP(Q, 2); }
    F1T.pitMoved = +moved.toFixed(2); }
  const pcum = [0]; for (let j = 1; j < np; j++) pcum.push(pcum[j - 1] + Math.hypot(PQ[j][0] - PQ[j - 1][0], PQ[j][1] - PQ[j - 1][1]));
  const PL = pcum[np - 1], php = j => 2.6 + 3.4*sstep(Math.min(pcum[j], PL - pcum[j])/55);     // half width: 6 m, 2.6 m at the two ends
  // lateral position of the pit lane relative to the track: per track vertex, nearest pit point
  const pitRel = new Float64Array(n).fill(NaN), pitJ = new Int32Array(n).fill(-1);
  for (let i = 0; i < n; i++){ let bd = 1e9, bj = -1; for (let j = 0; j < np; j += 2){ const d = Math.hypot(PQ[j][0] - X[i], PQ[j][1] - Y[i]); if (d < bd){ bd = d; bj = j; } }
    if (bd < 40){ for (let j = Math.max(0, bj - 3); j <= Math.min(np - 1, bj + 3); j++){ const d = Math.hypot(PQ[j][0] - X[i], PQ[j][1] - Y[i]); if (d < bd){ bd = d; bj = j; } }
      pitJ[i] = bj; pitRel[i] = (PQ[bj][0] - X[i])*NX[i] + (PQ[bj][1] - Y[i])*NY[i]; } }

  // ---- surface samples across the track: offsets -NS..NS every metre (deck-following on the centreline)
  const NS = 17, NW = 2*NS + 1, ZS = new Float32Array(n*NW), KS = new Int8Array(n*NW), zc = new Float32Array(n);
  { let zh = G(X[0], Y[0]) + 0.2;
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < n; i++){ const r = SF.q(X[i], Y[i], zh); zc[i] = r[0]; zh = r[0]; }
    for (let i = 0; i < n; i++) for (let k = 0; k < NW; k++){ const o = k - NS, p = at(i, o), r = SF.q(p[0], p[1], zc[i]); ZS[i*NW + k] = r[0]; KS[i*NW + k] = r[1]; } }
  st.tSurf = performance.now() - T0;

  // ---- lateral room per side: obstacles (rays at the vertex and halfway to the next), support (decks), road extent
  const FREE = [new Float32Array(n), new Float32Array(n)], SUP = [new Float32Array(n), new Float32Array(n)], EXT = [new Float32Array(n), new Float32Array(n)], TAG = [[], []];
  for (let i = 0; i < n; i++) for (let sd = 0; sd < 2; sd++){
    const s = sd ? -1 : 1; let best = 16, tg = null;
    for (const f of [-0.5, 0, 0.5]){ const j = f < 0 ? w(i - 1) : i, t = f < 0 ? 0.5 : f, ax = lerp(X[j], X[j + 1], t), ay = lerp(Y[j], Y[j + 1], t), nx = lerp(NX[j], NX[w(j + 1)], t)*s, ny = lerp(NY[j], NY[w(j + 1)], t)*s, nl = Math.hypot(nx, ny);
      const r = O.ray(ax, ay, nx/nl, ny/nl, 16); if (r[0] < best){ best = r[0]; tg = r[1]; } }
    FREE[sd][i] = best; TAG[sd][i] = tg;
    // support: contiguous samples at the deck height of the centre (|dz| < 0.7), no water
    let sup = NS; const zc0 = ZS[i*NW + NS], deck = zc0 - G(X[i], Y[i]) > 1.2 || KS[i*NW + NS] === 3;
    for (let o = 1; o <= NS; o++){ const k = i*NW + NS + s*o, kd = KS[k]; if (kd === 4 || (deck && Math.abs(ZS[k] - zc0) > 0.7)){
      // refine the edge between o - 1 and o (deck edges, the bridge girders)
      let lo = o - 1, hi = o; for (let it = 0; it < 5; it++){ const m = (lo + hi)/2, p = at(i, s*m), r = SF.q(p[0], p[1], zc0); if (r[1] === 4 || (deck && Math.abs(r[0] - zc0) > 0.7)) hi = m; else lo = m; }
      sup = lo; break; } }
    SUP[sd][i] = sup;
    let ext = 0; for (let o = 1; o <= NS; o++){ const kd = KS[i*NW + NS + s*o]; if (kd === 1 || kd === 3) ext = o; else break; }
    EXT[sd][i] = ext + 0.5;
  }

  // ---- walls (wl / wr), white lines (hl / hr), pit merges
  const WALL = [new Float32Array(n), new Float32Array(n)], HW = [new Float32Array(n), new Float32Array(n)], NOWALL = [new Uint8Array(n), new Uint8Array(n)], PEDGE = [new Float32Array(n).fill(1e9), new Float32Array(n).fill(1e9)];
  for (let sd = 0; sd < 2; sd++){
    const s = sd ? -1 : 1, E = EXT[sd], raw = new Float32Array(n), want = new Float32Array(n);
    for (let i = 0; i < n; i++){
      // the road edge, ignoring junction mouths (minimum over +-30 m)
      let em = 1e9; for (let k = -6; k <= 6; k++) em = Math.min(em, E[w(i + k)]);
      const kap = Ln.K[i]*s, R = Math.abs(Ln.K[i]) > 1e-4 ? 1/Math.abs(Ln.K[i]) : 1e4;
      let t = cl(em - 0.35, 7.6, 10.4);
      // run-off on the outside of the slower corners where there is room
      let outer = 0; for (let k = -2; k <= 7; k++){ const kk = Ln.K[w(i - k)]*s; if (kk < -1/45) outer = 1; }
      if (outer) t = Math.max(t, Math.min(FREE[sd][i] - 0.8, 13.5));
      let lim = Math.min(FREE[sd][i] - 0.45, SUP[sd][i] - 0.3, 14);
      if (kap > 0) lim = Math.min(lim, 0.85*R);               // inside of a tight corner
      // the pit lane alongside: the wall is the pit wall, 0.6 m short of the pit lane edge; where the lanes merge there is no wall
      if (!isNaN(pitRel[i]) && pitRel[i]*s > 0){ const pj = pitJ[i], edge = Math.abs(pitRel[i]) - php(pj);
        if (edge < 8.2) { NOWALL[sd][i] = 1; PEDGE[sd][i] = edge; lim = Math.min(lim, Math.max(edge + php(pj)*2, 9)); } else lim = Math.min(lim, edge - 0.6); }
      raw[i] = Math.max(3.3, lim); want[i] = Math.min(t, raw[i]);
    }
    // smooth: limit the slope (0.35 m per 5 m), never beyond the room
    const v = want.slice();
    for (let pass = 0; pass < 3; pass++){ for (let i = 0; i < 2*n; i++){ const a = w(i), b = w(i + 1); v[b] = Math.min(v[b], v[a] + 0.35); } for (let i = 2*n; i > 0; i--){ const a = w(i), b = w(i - 1); v[b] = Math.min(v[b], v[a] + 0.35); } }
    const v2 = new Float32Array(n); for (let i = 0; i < n; i++){ let s2 = 0; for (let k = -2; k <= 2; k++) s2 += v[w(i + k)]; v2[i] = Math.min(s2/5, raw[i]); }
    WALL[sd] = v2;
    // the white line: 7 m from the centre where there is room, closer where the walls close in (Anderson Bridge, the decks)
    for (let i = 0; i < n; i++){ const wl = v2[i]; HW[sd][i] = cl(Math.min(7.0, wl - 0.55 - 0.25*Math.max(0, wl - 6)), 3.2, 7.0); }
    // no-wall runs shorter than 3 vertices are closed
    for (let i = 0; i < n; i++) if (NOWALL[sd][i] && !NOWALL[sd][w(i - 1)] && !NOWALL[sd][w(i + 2)] && !NOWALL[sd][w(i + 1)]) NOWALL[sd][i] = 0;
  }
  const [WL, WR] = WALL, [HL, HR] = HW;
  const RIB = [0, 1].map(sd => WALL[sd].map((v, i) => NOWALL[sd][i] ? Math.max(HW[sd][i] + 0.3, Math.min(v, PEDGE[sd][i] + 0.05)) : v));
  st.minWall = Math.min(...WL, ...WR).toFixed(2);

  // ---- racing surface heights: the highest road / ground surface around each cross-section point, plus 7 cm; island domes capped
  const zAtK = (i, o, cap) => {
    i = w(i); let m = -1e9, mr = -1e9; const k0 = Math.max(0, Math.floor(o - 1.3) + NS), k1 = Math.min(NW - 1, Math.ceil(o + 1.3) + NS);
    for (let d = -1; d <= 1; d++){ const ii = w(i + d); for (let k = k0; k <= k1; k++){ const z = ZS[ii*NW + k], kd = KS[ii*NW + k]; if (kd === 4) continue; if (z > m) m = z; if (kd !== 2 && z > mr) mr = z; } }
    if (m < -1e8) m = mr = ZS[i*NW + NS];
    if (mr < -1e8) mr = m;
    return Math.min(m, mr + (cap || 0.32)) + 0.07;
  };
  const ZT = new Float32Array(n); for (let i = 0; i < n; i++) ZT[i] = zAtK(i, 0);
  // along the line: no step larger than 3 cm per metre between neighbours (smooth humps), never below the samples
  { const Z0 = ZT.slice(); for (let pass = 0; pass < 2; pass++){ for (let i = 0; i < n; i++){ const a = ZT[w(i - 1)], b = ZT[w(i + 1)]; ZT[i] = Math.max(Z0[i], (a + 2*ZT[i] + b)/4); } } }
  const zSec = (i, o) => { i = w(i); const base = zAtK(i, o); return Math.max(base, ZT[i] - 0.25) + (ZT[i] - zAtK(i, 0)); };

  // ================= meshes =================
  const TR = TB(false), GL = mk(), D = B.deck, LAMPS = [], LAMPC = [], WIRE = B.wire, FEN = TB(true);
  const nD0 = D.pos.length, nB0 = B.bld.pos.length;
  const P3 = (i, o, dz) => { const p = at(i, o); return [p[0], p[1], zSec(i, o) + (dz || 0)]; };
  // cross-section strip between offsets o0..o1 (same sign side), from vertex i to i+1, colour col, lifted dz
  const strip = (i, o0a, o1a, o0b, o1b, dz, col) => { if (o0a > o1a){ let t = o0a; o0a = o1a; o1a = t; t = o0b; o0b = o1b; o1b = t; } const j = i + 1; quad(TR, P3(i, o0a, dz), P3(j, o0b, dz), P3(j, o1b, dz), P3(i, o1a, dz), col); };
  // a quad given by its four corners in the order (i, lo), (j, lo), (j, hi), (i, hi) of offsets; swaps when lo > hi
  const quadO = (a, b, c, d, oa, od, col) => { if (oa > od) quad(TR, d, c, b, a, col); else quad(TR, a, b, c, d, col); };
  // kerbs: inside of corners (R < 140 m), outside from the apex to the exit (R < 70 m)
  const KIN = [new Uint8Array(n), new Uint8Array(n)];
  for (let sd = 0; sd < 2; sd++){ const s = sd ? -1 : 1;
    for (let i = 0; i < n; i++){ const k = Ln.K[i]*s; if (k > 1/140) for (let d = -1; d <= 1; d++) KIN[sd][w(i + d)] |= 1; if (k < -1/70) for (let d = 0; d <= 5; d++) KIN[sd][w(i + d)] |= 2; }
    for (let i = 0; i < n; i++) if (KIN[sd][i] && !KIN[sd][w(i - 1)] && !KIN[sd][w(i + 1)]) KIN[sd][i] = 0; }
  for (let i = 0; i < n; i++){
    const j = w(i + 1);
    // asphalt: centre to the white lines (two shades for a faint racing-line polish), white lines, run-off to the walls
    strip(i, -HR[i] + 0.12, 0, -HR[j] + 0.12, 0, 0, C_ASPH); strip(i, 0, HL[i] - 0.12, 0, HL[j] - 0.12, 0, C_ASPH);
    for (const sd of [0, 1]){ const s = sd ? -1 : 1, H = HW[sd], Wv = RIB[sd], k = KIN[sd][i] && KIN[sd][j];
      strip(i, s*(H[i] - 0.12), s*(H[i] + 0.12), s*(H[j] - 0.12), s*(H[j] + 0.12), 0.012, C_WHITE);
      const kw = k ? Math.min(1.3, Wv[i] - H[i] - 0.25) : 0, kwj = k ? Math.min(1.3, Wv[j] - H[j] - 0.25) : 0;
      if (kw > 0.3){
        // two sub-blocks per 5 m (2.5 m red / white) with a raised outer lip
        for (const f of [0, 0.5]){ const fa = f, fb = f + 0.5, Hi = lerp(H[i], H[j], fa), Hj = lerp(H[i], H[j], fb), ka = lerp(kw, kwj, fa), kb = lerp(kw, kwj, fb);
          const c2 = (Math.floor((cum[i] + f*5)/2.5) % 2) ? C_RED : C_WHITE;
          const pa = (o, dz) => { const p0 = at(i, o), p1 = at(j, o); return [lerp(p0[0], p1[0], fa), lerp(p0[1], p1[1], fa), lerp(zSec(i, o), zSec(j, o), fa) + dz]; };
          const pb = (o, dz) => { const p0 = at(i, o), p1 = at(j, o); return [lerp(p0[0], p1[0], fb), lerp(p0[1], p1[1], fb), lerp(zSec(i, o), zSec(j, o), fb) + dz]; };
          quadO(pa(s*(Hi + 0.12), 0.02), pb(s*(Hj + 0.12), 0.02), pb(s*(Hj + kb*0.75), 0.05), pa(s*(Hi + ka*0.75), 0.05), s*(Hi + 0.12), s*(Hi + ka*0.75), c2);
          quadO(pa(s*(Hi + ka*0.75), 0.05), pb(s*(Hj + kb*0.75), 0.05), pb(s*(Hj + kb), 0.02), pa(s*(Hi + ka), 0.02), s*(Hi + ka*0.75), s*(Hi + ka), c2);
        }
      }
      const ro = (k ? kw : 0), roj = (k ? kwj : 0), green = Wv[i] - H[i] > 4.5 && Wv[j] - H[j] > 4.5;
      const Rv = Wv; if (Rv[i] - H[i] - ro > 0.2) strip(i, s*(H[i] + 0.12 + ro), s*Rv[i], s*(H[j] + 0.12 + roj), s*Rv[j], 0, green ? C_GREEN : C_RUN);
    }
  }
  st.trackTris = TR.p.length/9;

  // ---- walls (concrete, white top) and catch fences (posts, mesh, three top wires)
  const FH = 3.2; let nSoft = 0;
  for (const sd of [0, 1]){ const s = sd ? -1 : 1, Wv = WALL[sd];
    for (let i = 0; i < n; i++){ const j = w(i + 1); if (NOWALL[sd][i] || NOWALL[sd][j]) continue;
      const a = at(i, s*Wv[i]), b = at(j, s*Wv[j]), za = zSec(i, s*Wv[i]), zb = zSec(j, s*Wv[j]);
      boxSeg(D, a, b, 0.6, za - 0.35, za + 1.05, zb - 0.35, zb + 1.05, (i % 8 < 4) ? C_CONC : [0.86, 0.86, 0.84]);
      // lit at night: the track face of the wall
      { const a3 = at(i, s*(Wv[i] - 0.34)), b3 = at(j, s*(Wv[j] - 0.34)), gc = [0.42, 0.42, 0.42];
        pv(GL, a3[0], za + 0.05, a3[1], gc); pv(GL, b3[0], zb + 0.05, b3[1], gc); pv(GL, b3[0], zb + 1.0, b3[1], gc); pv(GL, a3[0], za + 0.05, a3[1], gc); pv(GL, b3[0], zb + 1.0, b3[1], gc); pv(GL, a3[0], za + 1.0, a3[1], gc); }
      // a painted band on the track face (plain colour, no lettering)
      { const a2 = at(i, s*(Wv[i] - 0.31)), b2 = at(j, s*(Wv[j] - 0.31)); const q = s > 0 ? [a2, b2] : [b2, a2], zq = s > 0 ? [za, zb] : [zb, za];
        pv(D, q[0][0], zq[0] + 0.15, q[0][1], C_BAND); pv(D, q[1][0], zq[1] + 0.15, q[1][1], C_BAND); pv(D, q[1][0], zq[1] + 0.85, q[1][1], C_BAND);
        pv(D, q[0][0], zq[0] + 0.15, q[0][1], C_BAND); pv(D, q[1][0], zq[1] + 0.85, q[1][1], C_BAND); pv(D, q[0][0], zq[0] + 0.85, q[0][1], C_BAND); }
      // energy-absorbing barrier blocks in front of the wall where a corner has a run-off area (plain colours)
      if (Wv[i] - HW[sd][i] > 3.2 && Wv[j] - HW[sd][j] > 3.2 && KIN[sd][i] & 2){ const c1 = at(i, s*(Wv[i] - 0.95)), c2 = at(j, s*(Wv[j] - 0.95)), za2 = zSec(i, s*(Wv[i] - 0.95)), zb2 = zSec(j, s*(Wv[j] - 0.95));
        for (const f of [0, 0.5]){ const p0 = [lerp(c1[0], c2[0], f), lerp(c1[1], c2[1], f)], p1 = [lerp(c1[0], c2[0], f + 0.48), lerp(c1[1], c2[1], f + 0.48)], z0 = lerp(za2, zb2, f), z1 = lerp(za2, zb2, f + 0.48);
          boxSeg(D, p0, p1, 1.1, z0 - 0.1, z0 + 0.95, z1 - 0.1, z1 + 0.95, (Math.floor(cum[i]/2.5) + (f ? 1 : 0)) % 2 ? [0.16, 0.22, 0.46] : [0.86, 0.86, 0.86]); } nSoft++; }
      // fence: posts every 5 m on the back edge of the wall, a mesh panel from 1.05 m to 1.05 + FH
      const pa = at(i, s*(Wv[i] + 0.22)), pb = at(j, s*(Wv[j] + 0.22));
      post(D, pa, 0.06, za + 1.0, za + 1.05 + FH + 0.25, C_DSTEEL);
      if (i % 2 === 0) bar(D, [pa[0], pa[1], za + 1.05 + FH + 0.25], [lerp(pa[0], at(i, s*(Wv[i] - 0.6))[0], 1), lerp(pa[1], at(i, s*(Wv[i] - 0.6))[1], 1), za + 1.05 + FH + 0.75], 0.04, C_DSTEEL);
      const u0 = cum[i]/2, u1 = cum[i + 1]/2, za1 = za + 1.05, zb1 = zb + 1.05;
      FEN.p.push(pa[0], za1, -pa[1], pb[0], zb1, -pb[1], pb[0], zb1 + FH, -pb[1], pa[0], za1, -pa[1], pb[0], zb1 + FH, -pb[1], pa[0], za1 + FH, -pa[1]);
      FEN.uv.push(u0, 0, u1, 0, u1, FH/2, u0, 0, u1, FH/2, u0, FH/2); for (let k = 0; k < 6; k++) FEN.c.push(1, 1, 1);
      for (const h of [FH*0.5, FH]) WIRE.push(pa[0], za1 + h, -pa[1], pb[0], zb1 + h, -pb[1]);
    }
  }

  // ---- the pit lane: surface (trimmed where it runs under the track's run-off), lines, the garage-side kerb
  const pitInfo = {P:PQ, cum:pcum, L:PL};
  { const PN = PQ.map((p, j) => { const a = PQ[Math.max(0, j - 1)], b = PQ[Math.min(np - 1, j + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [-(b[1] - a[1])/l, (b[0] - a[0])/l]; });
    // for each pit point: the track's corridor edge (if the track is close) as the trim on the track side
    const tsd = new Float32Array(np), trim = new Float32Array(np).fill(1e9), zp = new Float32Array(np);
    for (let j = 0; j < np; j++){ const p = PQ[j]; let bd = 1e9, bi = 0; for (let i = 0; i < n; i += 1){ const d = (X[i] - p[0])**2 + (Y[i] - p[1])**2; if (d < bd){ bd = d; bi = i; } }
      const rel = (X[bi] - p[0])*PN[j][0] + (Y[bi] - p[1])*PN[j][1]; tsd[j] = rel > 0 ? 1 : -1;      // track side of the pit lane (+1 left)
      const dd = Math.sqrt(bd), side = ((p[0] - X[bi])*NX[bi] + (p[1] - Y[bi])*NY[bi]) > 0 ? 0 : 1, wv = WALL[side][bi], nw = NOWALL[side][bi];
      trim[j] = nw ? dd - RIB[side][bi] + 0.05 : dd - wv - 0.3;    // distance from the pit centre to the track corridor edge, along the pit normal (approx.)
      const r = SF.q(p[0], p[1], ZT[bi]); let m = r[0]; for (const o of [-5, -2.5, 2.5, 5]){ const q = SF.q(p[0] + PN[j][0]*o, p[1] + PN[j][1]*o, r[0]); if (q[1] !== 4) m = Math.max(m, Math.min(q[0], r[0] + 0.3)); }
      zp[j] = m + 0.07; }
    for (let pass = 0; pass < 2; pass++) for (let j = 1; j < np - 1; j++) zp[j] = Math.max(zp[j], (zp[j - 1] + zp[j + 1])/2 - 0.01);
    pitInfo.z = zp;
    const pp = (j, o, dz) => [PQ[j][0] + PN[j][0]*o, PQ[j][1] + PN[j][1]*o, zp[j] + (dz || 0)];
    for (let j = 0; j < np - 1; j++){ const h0 = php(j), h1 = php(j + 1), s0 = tsd[j], t0 = Math.min(h0, trim[j]), t1 = Math.min(h1, trim[j + 1]);
      if (t0 < -h0 + 0.5 || t1 < -h1 + 0.5) continue;
      // outer (garage) edge -h .. track-side edge min(h, trim)
      const a0 = -s0*h0, a1 = -s0*h1, b0 = s0*t0, b1 = s0*t1;
      quadO(pp(j, a0), pp(j + 1, a1), pp(j + 1, b1), pp(j, b0), a0, b0, C_PIT);
      // the line between the fast lane and the working lane (dashed), the white edge lines
      if (h0 > 5 && j % 4 < 2) quadO(pp(j, -s0*1.0 - 0.08, 0.012), pp(j + 1, -s0*1.0 - 0.08, 0.012), pp(j + 1, -s0*1.0 + 0.08, 0.012), pp(j, -s0*1.0 + 0.08, 0.012), 0, 1, C_WHITE);
      quadO(pp(j, a0 + s0*0.1, 0.012), pp(j + 1, a1 + s0*0.1, 0.012), pp(j + 1, a1 + s0*0.3, 0.012), pp(j, a0 + s0*0.3, 0.012), a0 + s0*0.1, a0 + s0*0.3, C_WHITE);
      if (trim[j] > h0 && trim[j + 1] > h1) quadO(pp(j, b0 - s0*0.3, 0.012), pp(j + 1, b1 - s0*0.3, 0.012), pp(j + 1, b1 - s0*0.1, 0.012), pp(j, b0 - s0*0.1, 0.012), b0 - s0*0.3, b0 - s0*0.1, C_WHITE);
      // garage-side kerb (only where there is no pit building)
    }
    // the outer wall and catch fence of the pit lane where it runs clear of the track and of the pit building (entry and exit roads)
    { const PBo = F1T_PB.map(q => q.slice()); const c0 = PBo.reduce((t, q) => [t[0] + q[0]/PBo.length, t[1] + q[1]/PBo.length], [0, 0]);
      const nearPB = (x, y) => { for (let k = 0; k < PBo.length; k++){ const a = PBo[k], b = PBo[(k + 1) % PBo.length], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx*dx + dy*dy || 1, t = cl(((x - a[0])*dx + (y - a[1])*dy)/l2, 0, 1); if (Math.hypot(a[0] + dx*t - x, a[1] + dy*t - y) < 4) return true; } return pipF(PBo, x, y); };
      void c0; let nW = 0;
      for (let j = 0; j < np - 1; j++){ const h0 = php(j), h1 = php(j + 1), s0 = tsd[j]; if (trim[j] < h0 + 1 || trim[j + 1] < h1 + 1 || pcum[j] < 25 || pcum[j + 1] > PL - 25) continue;
        const a = pp(j, -s0*(h0 + 0.45)), b = pp(j + 1, -s0*(h1 + 0.45)); if (nearPB(a[0], a[1]) || nearPB(b[0], b[1])) continue;
        boxSeg(D, a, b, 0.6, a[2] - 0.35, a[2] + 1.05, b[2] - 0.35, b[2] + 1.05, C_CONC);
        const pa = pp(j, -s0*(h0 + 0.67)), pb = pp(j + 1, -s0*(h1 + 0.67)), za1 = pa[2] + 1.05, zb1 = pb[2] + 1.05;
        if (j % 2 === 0) post(D, pa, 0.06, za1 - 0.05, za1 + FH + 0.2, C_DSTEEL);
        FEN.p.push(pa[0], za1, -pa[1], pb[0], zb1, -pb[1], pb[0], zb1 + FH, -pb[1], pa[0], za1, -pa[1], pb[0], zb1 + FH, -pb[1], pa[0], za1 + FH, -pa[1]);
        FEN.uv.push(pcum[j]/2, 0, pcum[j + 1]/2, 0, pcum[j + 1]/2, FH/2, pcum[j]/2, 0, pcum[j + 1]/2, FH/2, pcum[j]/2, FH/2); for (let k = 0; k < 6; k++) FEN.c.push(1, 1, 1);
        WIRE.push(pa[0], za1 + FH, -pa[1], pb[0], zb1 + FH, -pb[1]); nW++; }
      F1T.pitWalls = nW*2.5; }
    // pit lane speed-limit lines (entry and exit, 80 km/h): a white band across the lane
    for (const sl of [70, PL - 70]){ let j = 0; while (j < np - 2 && pcum[j + 1] < sl) j++; const h = php(j);
      quadO(pp(j, -h, 0.014), pp(j + 1, -h, 0.014), pp(j + 1, h, 0.014), pp(j, h, 0.014), -h, h, C_WHITE); }
    pitInfo.N = PN; pitInfo.side = tsd;
  }

  // ---- the start / finish line (chequered band), the grid boxes (f1d grid: k*1.6 vertices back, +-3.4 m)
  { const i0 = 0, H = Math.min(HL[i0], HR[i0]);
    for (let c = 0; c < 2; c++) for (let r = -Math.floor(H/0.7); r < Math.floor(H/0.7); r++){
      const col = ((c + r) & 1) ? C_BLACK : C_WHITE, o0 = r*0.7, o1 = o0 + 0.7, f0 = c*0.07, f1 = f0 + 0.07;
      const pa = (f, o) => { const p0 = at(i0, o), p1 = at(i0 + 1, o); return [lerp(p0[0], p1[0], f), lerp(p0[1], p1[1], f), zSec(i0, o) + 0.016]; };
      quad(TR, pa(f0, o0), pa(f1, o0), pa(f1, o1), pa(f0, o1), col); }
    for (let k = 0; k < 20; k++){ const i = w(-Math.round(k*1.6)), s = cum[i] - 3.0 + 2.6, d = k % 2 ? -3.4 : 3.4;
      // box front line (across, 2.4 m) at the nose, side ticks 1.2 m back
      let ii = i; while (cum[ii] > s && ii > 0) ii--; const f = (s - cum[ii])/Math.max(1e-6, cum[ii + 1] - cum[ii]);
      const pp = (ds, o) => { const ff = f + ds/5; const p0 = at(ii, o), p1 = at(ii + 1, o); return [lerp(p0[0], p1[0], ff), lerp(p0[1], p1[1], ff), zSec(ii, o) + 0.016]; };
      quad(TR, pp(-0.12, d - 1.2), pp(0.12, d - 1.2), pp(0.12, d + 1.2), pp(-0.12, d + 1.2), C_WHITE);
      for (const e of [-1.2, 1.2]) quad(TR, pp(-1.2, d + e - 0.08), pp(0, d + e - 0.08), pp(0, d + e + 0.08), pp(-1.2, d + e + 0.08), C_WHITE); }
  }

  // ================= a plain deck in place of the Anderson Bridge model when that model is not loaded =================
  if (SF.AB && SF.AB.fallback){ const A = SF.AB, P = (lx, lz) => [A.x + A.ux*lx + A.vx*lz, A.y + A.uy*lx + A.vy*lz];
    for (let k = 0; k < 16; k++){ const x0 = -38.4 + k*4.8, x1 = x0 + 4.8, z0 = A.top + ydA(x0), z1 = A.top + ydA(x1);
      prismV(D, [P(x0, 0.3), P(x1, 0.3), P(x1, -10.2), P(x0, -10.2)], [z0 - 0.03, z1 - 0.03, z1 - 0.03, z0 - 0.03], [z0 - 1.1, z1 - 1.1, z1 - 1.1, z0 - 1.1], [0.62, 0.62, 0.6]);
      for (const zg of [-9.7, 0]) boxSeg(D, P(x0, zg), P(x1, zg), zg ? 1.0 : 1.24, z0 - 1.3, z0 + 0.95, z1 - 1.3, z1 + 0.95, [0.82, 0.81, 0.77]); }
  }
  // ================= helpers for the dressing: other parts of the circuit, the pit lane, the nearest vertex =================
  const TG = new SegGrid(20); for (let i = 0; i < n; i++) TG.add(X[i], Y[i], X[i + 1], Y[i + 1], i + 1);
  const PG = new SegGrid(20); for (let j = 0; j < np - 1; j++) PG.add(PQ[j][0], PQ[j][1], PQ[j + 1][0], PQ[j + 1][1], j + 1);
  // is (x, y) inside the corridor (walls + m) of a part of the circuit other than around vertex i?
  const onTrack = (x, y, i, m) => { const c = TG.cs; m = m || 0.6;
    for (let gy = Math.floor((y - 16)/c); gy <= Math.floor((y + 16)/c); gy++) for (let gx = Math.floor((x - 16)/c); gx <= Math.floor((x + 16)/c); gx++){ const l = TG.m.get(gy*100003 + gx); if (!l) continue;
      for (const id of l){ const k = TG.S[id][4] - 1; if (i !== undefined){ let dk = Math.abs(k - i); dk = Math.min(dk, n - dk); if (dk < 4) continue; }
        const dx = X[k + 1] - X[k], dy = Y[k + 1] - Y[k], l2 = dx*dx + dy*dy || 1, t = cl(((x - X[k])*dx + (y - Y[k])*dy)/l2, 0, 1), px = x - (X[k] + dx*t), py = y - (Y[k] + dy*t), d = px*NX[k] + py*NY[k];
        if (Math.hypot(px, py) < 16 && Math.abs(d) < (d > 0 ? WL[k] : WR[k]) + m && t > -0.01) return true; } }
    return false; };
  const onPit = (x, y, m) => { const r = PG.near(x, y, 6.5 + (m || 1)); return !!r; };
  const freeTo = (i, s, len) => { let best = len; for (const f of [-0.5, 0, 0.5]){ const j = f < 0 ? w(i - 1) : i, t = f < 0 ? 0.5 : f, ax = lerp(X[j], X[j + 1], t), ay = lerp(Y[j], Y[j + 1], t), nx = lerp(NX[j], NX[w(j + 1)], t)*s, ny = lerp(NY[j], NY[w(j + 1)], t)*s, nl = Math.hypot(nx, ny);
    const r = O.ray(ax, ay, nx/nl, ny/nl, len); if (r[0] < best) best = r[0]; } return best; };
  const nearestI = (x, y) => { let bd = 1e18, bi = 0; for (let i = 0; i < n; i++){ const d = (X[i] - x)**2 + (Y[i] - y)**2; if (d < bd){ bd = d; bi = i; } } return bi; };
  const gAt = (x, y) => Math.max(G(x, y), -0.3);
  const CUTP = [];                 // footprints (stands, pit building, units) where app trees are removed
  const STAND = [new Float32Array(n), new Float32Array(n)];   // top of a grandstand behind the wall (projectors are mounted on it)

  // ================= the pit building: three storeys on its real footprint (garages, offices / race control, the hospitality level) =================
  { const PB = F1T_PB.map(p => p.slice()); if (areaP(PB) < 0) PB.reverse();
    let gmin = 1e9; for (const p of PB) gmin = Math.min(gmin, gAt(p[0], p[1]));
    const zb = (pitInfo.z ? pitInfo.z[Math.floor(np/2)] : gmin + 0.25) - 0.02;
    const grow = (P, d) => P.map((p, i) => { const a = P[(i - 1 + P.length) % P.length], b = P[(i + 1) % P.length], e1 = [p[0] - a[0], p[1] - a[1]], e2 = [b[0] - p[0], b[1] - p[1]], l1 = Math.hypot(...e1) || 1, l2 = Math.hypot(...e2) || 1;
      const n1 = [e1[1]/l1, -e1[0]/l1], n2 = [e2[1]/l2, -e2[0]/l2]; let mx = n1[0] + n2[0], my = n1[1] + n2[1]; const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml; const k = 1/Math.max(0.5, mx*n1[0] + my*n1[1]); return [p[0] + mx*d*k, p[1] + my*d*k]; });
    prismAny(D, PB, zb - 1.2, zb + 6.0, [0.88, 0.88, 0.87]);
    prismAny(D, grow(PB, 0.35), zb + 5.8, zb + 6.3, [0.96, 0.96, 0.95]);
    B.bld.win = {u0:0, base:zb + 6.3, glow:1.15, zc:5, fh:4.1, ww:2.4}; prismAny(B.bld, PB, zb + 6.3, zb + 10.4, [0.9, 0.91, 0.92]); B.bld.win = null;
    prismAny(D, grow(PB, 0.35), zb + 10.4, zb + 10.8, [0.96, 0.96, 0.95]);
    const PBi = grow(PB, -0.6);
    B.bld.win = {u0:3, base:zb + 10.8, glow:1.5, zc:5, fh:4.2, ww:3.0}; prismAny(B.bld, PBi, zb + 10.8, zb + 15.0, [0.6, 0.7, 0.78]); B.bld.win = null;
    prismAny(D, grow(PB, 2.2), zb + 15.0, zb + 15.7, [0.95, 0.95, 0.94]);
    // roof plant: a row of air-handling units and a parapet rail along the long edges
    { const a0 = [2085.6, -2455], a1 = [2125, -2765], u = [a1[0] - a0[0], a1[1] - a0[1]], L = Math.hypot(...u); u[0] /= L; u[1] /= L;
      for (let t = 24; t < L - 20; t += 26){ const c = [a0[0] + u[0]*t, a0[1] + u[1]*t]; if (pipF(PB, c[0], c[1])) addPrism(D, orect(c, u, 3.2, 1.6), zb + 15.7, zb + 17.1, [0.7, 0.72, 0.74]); } }
    // race control and the media level: a glazed block on the roof, a third of the way from the north end
    { const a = PB[0], c0 = PB.reduce((s, p) => [s[0] + p[0]/PB.length, s[1] + p[1]/PB.length], [0, 0]);
      const A = [lerp(a[0], c0[0], 0.35), lerp(a[1], c0[1], 0.35)], u = [0.152, -0.988], v = [0.988, 0.152];
      const R = [[A[0] - u[0]*16 - v[0]*8, A[1] - u[1]*16 - v[1]*8], [A[0] + u[0]*16 - v[0]*8, A[1] + u[1]*16 - v[1]*8], [A[0] + u[0]*16 + v[0]*8, A[1] + u[1]*16 + v[1]*8], [A[0] - u[0]*16 + v[0]*8, A[1] - u[1]*16 + v[1]*8]];
      B.bld.win = {u0:1, base:zb + 15.7, glow:1.6, zc:5, fh:3.6, ww:2.8}; prismAny(B.bld, R, zb + 15.7, zb + 19.3, [0.55, 0.66, 0.74]); B.bld.win = null; prismAny(D, grow(R, 0.8), zb + 19.3, zb + 19.9, [0.95, 0.95, 0.94]); }
    // the garages on the pit-lane faces: roller doors, a blank name board above each, the painted garage boxes in front
    for (let e = 0; e < PB.length; e++){ const a = PB[e], b = PB[(e + 1) % PB.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 14) continue;
      const ux = (b[0] - a[0])/L, uy = (b[1] - a[1])/L, nx = uy, ny = -ux, mid = [(a[0] + b[0])/2 + nx*7, (a[1] + b[1])/2 + ny*7];
      if (!PG.near(mid[0], mid[1], 8)) continue;               // only the faces along the pit lane
      const nb = Math.floor(L/9.0), bw = L/nb;
      for (let k = 0; k < nb; k++){ const t0 = k*bw + 0.9, t1 = (k + 1)*bw - 0.9, p0 = [a[0] + ux*t0 + nx*0.06, a[1] + uy*t0 + ny*0.06], p1 = [a[0] + ux*t1 + nx*0.06, a[1] + uy*t1 + ny*0.06];
        const door = k % 7 === 3 ? [0.44, 0.47, 0.5] : [0.22, 0.24, 0.27], board = k % 2 ? [0.93, 0.93, 0.92] : [0.8, 0.82, 0.84];
        for (const [z0, z1, col] of [[zb, zb + 4.7, door], [zb + 4.95, zb + 5.65, board]]){ pv(D, p0[0], z0, p0[1], col); pv(D, p1[0], z0, p1[1], col); pv(D, p1[0], z1, p1[1], col); pv(D, p0[0], z0, p0[1], col); pv(D, p1[0], z1, p1[1], col); pv(D, p0[0], z1, p0[1], col); }
        { const g0 = [p0[0] + nx*0.05, p0[1] + ny*0.05], g1 = [p1[0] + nx*0.05, p1[1] + ny*0.05], gc = k % 3 === 1 ? [0.2, 0.2, 0.22] : [0.62, 0.58, 0.5];      // open garages, lit
          pv(GL, g0[0], zb, g0[1], gc); pv(GL, g1[0], zb, g1[1], gc); pv(GL, g1[0], zb + 4.6, g1[1], gc); pv(GL, g0[0], zb, g0[1], gc); pv(GL, g1[0], zb + 4.6, g1[1], gc); pv(GL, g0[0], zb + 4.6, g0[1], gc); }
        // garage box lines on the working lane (two side lines, 4 m deep)
        for (const t of [t0 - 0.4, t1 + 0.4]){ const q0 = [a[0] + ux*t + nx*0.5, a[1] + uy*t + ny*0.5], q1 = [a[0] + ux*t + nx*4.5, a[1] + uy*t + ny*4.5];
          const zz = zb + 0.035; quad(TR, [q0[0] - ux*0.06, q0[1] - uy*0.06, zz], [q1[0] - ux*0.06, q1[1] - uy*0.06, zz], [q1[0] + ux*0.06, q1[1] + uy*0.06, zz], [q0[0] + ux*0.06, q0[1] + uy*0.06, zz], C_WHITE); } }
    }
    CUTP.push(grow(PB, 3));
    F1T.pitBuilding = {zb, n:PB.length};
    // the paddock behind it: two rows of two-storey team hospitality units (invented, plain colours)
    const A0 = [2071.5, -2456.5], u = [0.152, -0.988], wv = [-0.988, -0.152], TEAM = [[0.86, 0.2, 0.2], [0.15, 0.25, 0.55], [0.1, 0.55, 0.52], [0.95, 0.55, 0.12], [0.2, 0.45, 0.25], [0.55, 0.55, 0.58], [0.25, 0.4, 0.8], [0.6, 0.2, 0.45], [0.18, 0.18, 0.2], [0.9, 0.78, 0.2]];
    let nu = 0;
    for (const off of [17, 33]) for (let t = 14, k = 0; t < 300; t += 17, k++){ const c = [A0[0] + u[0]*t + wv[0]*off, A0[1] + u[1]*t + wv[1]*off];
      if (O.near(c[0], c[1], 9) || onTrack(c[0], c[1], undefined, 3) || onPit(c[0], c[1], 4) || SF.q(c[0], c[1])[1] === 1) continue;
      let inB = false; if (SGR.hulls) for (const H of SGR.hulls.values()){ if (pipF(H.P, c[0], c[1])){ inB = true; break; } } if (inB) continue;
      const R = [[c[0] - u[0]*6 - wv[0]*4, c[1] - u[1]*6 - wv[1]*4], [c[0] + u[0]*6 - wv[0]*4, c[1] + u[1]*6 - wv[1]*4], [c[0] + u[0]*6 + wv[0]*4, c[1] + u[1]*6 + wv[1]*4], [c[0] - u[0]*6 + wv[0]*4, c[1] - u[1]*6 + wv[1]*4]];
      const g0 = Math.min(...R.map(p => gAt(p[0], p[1]))), tc = TEAM[(nu + (off > 20 ? 5 : 0)) % TEAM.length];
      prismAny(D, R, g0 - 0.4, g0 + 3.3, [0.95, 0.95, 0.95]);
      B.bld.win = {u0:k, base:g0 + 3.3, glow:1.2, zc:2, fh:3.2, ww:2.2}; prismAny(B.bld, R, g0 + 3.3, g0 + 6.5, [0.9, 0.92, 0.94]); B.bld.win = null;
      prismAny(D, R.map(p => [p[0] + (p[0] - c[0])*0.06, p[1] + (p[1] - c[1])*0.06]), g0 + 6.5, g0 + 7.2, tc);
      CUTP.push(R); nu++; }
    F1T.units = nu;
  }

  // ================= the teams' pit wall stands: ten roofed platforms on the pit wall opposite the garages =================
  { const cand = []; for (let i = 0; i < n; i++){ if (NOWALL[0][i] || isNaN(pitRel[i]) || pitRel[i] < 0 || Math.abs(pitRel[i]) - php(pitJ[i]) - WL[i] > 2.5) continue;
      const q = at(i, WL[i] + 9); if (pipF(F1T_PB, q[0], q[1]) || PG.near(q[0], q[1], 7)) cand.push(i); }
    // the middle of the longest run of candidates
    let best = [0, 0], r0 = -1; for (let k = 0; k <= cand.length; k++){ if (k < cand.length && (k === 0 || cand[k] === cand[k - 1] + 1)){ if (r0 < 0) r0 = k; continue; } if (r0 >= 0 && k - r0 > best[1] - best[0]) best = [r0, k]; r0 = k < cand.length ? k : -1; }
    const run = cand.slice(best[0], best[1]), nst = Math.min(10, Math.floor(run.length/4)), c0 = Math.floor(run.length/2) - nst*2;
    for (let k = 0; k < nst; k++){ const i = run[c0 + k*4], d = [Ln.DX[i], Ln.DY[i]], z = zSec(i, WL[i]) + 1.05, c = at(i, WL[i] + 0.25);
      addPrism(D, orect(c, d, 1.6, 0.55), z, z + 0.12, [0.35, 0.36, 0.38]);
      for (const t of [-1.45, 1.45]) post(D, [c[0] + d[0]*t, c[1] + d[1]*t], 0.05, z, z + 2.6, C_DSTEEL);
      addPrism(D, orect(at(i, WL[i] + 0.35), d, 1.75, 0.8), z + 2.6, z + 2.75, [0.92, 0.92, 0.9]);
      // the screens' glow under the roof at night
      const g = at(i, WL[i] + 0.5); LAMPS.push(g[0], z + 1.6, -g[1]); LAMPC.push(0.55, 0.65, 0.9); }
    F1T.pitWallStands = nst; }

  // ================= grandstands (stepped seating behind the fences; some covered) =================
  // [name, x0, y0, x1, y1 (ends, nearest vertices), side (0 left / 1 right), depth, rows, roof, seat colours]
  const SEATS = [[[0.27, 0.42, 0.62], [0.33, 0.5, 0.72]], [[0.78, 0.78, 0.8], [0.66, 0.67, 0.7]], [[0.2, 0.3, 0.48], [0.26, 0.37, 0.56]], [[0.55, 0.6, 0.64], [0.45, 0.5, 0.55]]];
  const STANDS = [['Pit Grandstand', 2156, -2729, 2121, -2461, 1, 22, 20, 0.45, 0], ['Turn 1 Grandstand', 2100, -2318, 2020, -2266, 1, 18, 15, 0, 2],
    ['Turn 3 Grandstand', 1983, -2232, 1934, -2290, 1, 15, 12, 0, 1], ['Republic Grandstand', 1979, -2474, 1984, -2590, 1, 15, 12, 0, 3],
    ['Raffles Grandstand', 1905, -2624, 1793, -2617, 0, 14, 11, 0, 0], ['Stamford Grandstand', 1188, -2454, 1123, -2571, 1, 16, 13, 0, 2],
    ['Padang Grandstand', 906, -2523, 772, -2763, 0, 18, 14, 0.6, 1], ['Connaught Grandstand', 1056, -2779, 1092, -2670, 0, 14, 11, 0, 3],
    ['Esplanade Waterfront Grandstand', 1358, -2790, 1582, -2803, 1, 13, 10, 0, 0], ['Bayfront Grandstand', 1839, -2892, 1929, -2903, 1, 12, 9, 0, 2],
    ['Promenade Grandstand', 2053, -2911, 2136, -2876, 1, 13, 10, 0, 1]];
  const standLog = [];
  for (const S of STANDS){
    const [name, x0, y0, x1, y1, sd, depth, rows0, roofF, pal] = S, s = sd ? -1 : 1;
    let i0 = nearestI(x0, y0), i1 = nearestI(x1, y1); if (i1 < i0) i1 += n;
    const m = i1 - i0 + 1, ok = new Uint8Array(m), RW = new Int16Array(m), ZB = new Float32Array(m), O0 = new Float32Array(m);
    for (let k = 0; k < m; k++){ const i = w(i0 + k), o0 = WALL[sd][i] + 1.9, o1 = o0 + depth;
      O0[k] = o0; if (NOWALL[sd][i] || FREE[sd][i] < 15.5 && FREE[sd][i] < o1 + 0.3 || freeTo(i, s, o1 + 1) < o1 + 0.3) continue;
      let good = true, zb = -1e9; for (const f of [0, 0.35, 0.7, 1]){ const p = at(i, s*(o0 + depth*f)); if (onTrack(p[0], p[1], i, 0.8) || onPit(p[0], p[1]) || SF.q(p[0], p[1])[1] === 4){ good = false; break; } zb = Math.max(zb, gAt(p[0], p[1])); }
      if (!good) continue;
      // under a viaduct: fewer rows
      let ov = Infinity; for (const f of [0, 0.5, 1]){ const p = at(i, s*(o0 + depth*f)); ov = Math.min(ov, over(p[0], p[1], roofs, zb + 0.5)); }
      const rows = Math.min(rows0, Math.floor((ov - zb - 1.0 - 1.6 - 0.4)/0.42)); if (rows < 4) continue;
      ok[k] = 1; RW[k] = rows; ZB[k] = zb + 0.02; }
    // blocks shorter than 4 vertices (15 m) are dropped
    for (let k = 0; k < m; ){ if (!ok[k]){ k++; continue; } let e = k; while (e < m && ok[e]) e++; if (e - k < 4) for (let q = k; q < e; q++) ok[q] = 0; k = e; }
    let built = 0;
    for (let k = 0; k < m - 1; k++){ if (!ok[k] || !ok[k + 1]) continue;
      const i = w(i0 + k), j = w(i0 + k + 1), rows = Math.min(RW[k], RW[k + 1]), zb = Math.max(ZB[k], ZB[k + 1]), dd = (depth - 2.6)/rows0;
      const Pa = o => at(i, s*o), Pb = o => at(j, s*o), oa = O0[k], ob = O0[k + 1];
      const Q = (oA, oB, zA, zB2, col) => { const a1 = Pa(oA), b1 = Pb(oB), a2 = Pa(oA + 0.0001), q = s > 0 ? [a1, b1] : [b1, a1], zq = [zA, zB2]; void a2; pv(D, q[0][0], zq[0], q[0][1], col); pv(D, q[1][0], zq[0], q[1][1], col); pv(D, q[1][0], zq[1], q[1][1], col); pv(D, q[0][0], zq[0], q[0][1], col); pv(D, q[1][0], zq[1], q[1][1], col); pv(D, q[0][0], zq[1], q[0][1], col); };
      const flat = (oA0, oA1, oB0, oB1, z, col) => { const p = [Pa(oA0), Pb(oB0), Pb(oB1), Pa(oA1)].map(q => [q[0], q[1], z]); quadO2(D, p, s, col); };
      // front parapet, the front walkway, the rows (tread + riser), the back walkway and the back wall
      boxSeg(D, Pa(oa + 0.15), Pb(ob + 0.15), 0.3, zb - 0.6, zb + 2.2, zb - 0.6, zb + 2.2, [0.93, 0.93, 0.92]);
      flat(oa + 0.3, oa + 1.6, ob + 0.3, ob + 1.6, zb + 1.0, [0.62, 0.62, 0.6]);
      for (let r = 0; r < rows; r++){ const a0 = oa + 1.6 + r*dd, b0 = ob + 1.6 + r*dd, z1 = zb + 1.0 + (r + 1)*0.42, col = SEATS[pal][r & 1];
        Q(a0, b0, z1 - 0.42, z1, [col[0]*0.8, col[1]*0.8, col[2]*0.8]); flat(a0, a0 + dd, b0, b0 + dd, z1, col); }
      const ta = oa + 1.6 + rows*dd, tb = ob + 1.6 + rows*dd, zt = zb + 1.0 + rows*0.42;
      flat(ta, ta + 1.0, tb, tb + 1.0, zt, [0.62, 0.62, 0.6]);
      boxSeg(D, Pa(ta + 1.15), Pb(tb + 1.15), 0.3, zb - 0.6, zt + 1.3, zb - 0.6, zt + 1.3, [0.84, 0.84, 0.82]);
      // the underside seen from behind: a closing panel under the rows
      boxSeg(D, Pa(oa + 1.0), Pb(ob + 1.0), 0.2, zb - 0.6, zb + 1.0, zb - 0.6, zb + 1.0, [0.7, 0.7, 0.68]);
      // ends
      for (const [kk, ii, oo] of [[k, i, oa], [k + 1, j, ob]]){ if (kk > 0 && kk < m - 1 && ok[kk - 1] && ok[kk + 1]) continue;
        const p0 = at(ii, s*(oo + 0.15)), p1 = at(ii, s*(oo + 1.6 + rows*dd + 1.3)); boxSeg(D, p0, p1, 0.3, zb - 0.6, zb + 2.2, zb - 0.6, zt + 1.3, [0.88, 0.88, 0.86]); }
      let top = zt + 1.3;
      // roof over the middle part of a covered stand: posts at the back, a cantilevered slab rising towards the track
      const fr = (k + 0.5)/m;
      if (roofF && Math.abs(fr - 0.5) < roofF/2){ const zr0 = zt + 3.6, zr1 = zt + 4.6;
        if (k % 2 === 0) post(D, Pa(ta + 1.0), 0.18, zt, zr0 + 0.2, [0.85, 0.86, 0.87]);
        const p = [Pa(oa - 0.8), Pb(ob - 0.8), Pb(tb + 1.4), Pa(ta + 1.4)]; const zz = [zr1, zr1, zr0, zr0];
        const pq = p.map((q, t) => [q[0], q[1], zz[t]]); quadO2(D, pq, s, [0.94, 0.95, 0.96]);
        const pq2 = p.map((q, t) => [q[0], q[1], zz[t] - 0.35]).reverse(); quadO2(D, pq2, s, [0.75, 0.76, 0.78]);
        top = zr1; }
      { const p = [Pa(oa + 1.6), Pb(ob + 1.6), Pb(tb), Pa(ta)].map((q, t) => [q[0], q[1], (t < 2 ? zb + 1.05 : zt + 0.05) + 0.06]), gc = [0.3, 0.3, 0.3]; const q = s > 0 ? p : [p[3], p[2], p[1], p[0]]; for (const k2 of [0, 1, 2, 0, 2, 3]) pv(GL, q[k2][0], q[k2][2], q[k2][1], gc); }
      STAND[sd][i] = Math.max(STAND[sd][i], top); STAND[sd][j] = Math.max(STAND[sd][j], top);
      // stand lights along the back (white lamps at night)
      if (k % 4 === 0){ const p = Pa(ta + 1.0); LAMPS.push(p[0], zt + 1.6, -p[1]); LAMPC.push(1, 0.96, 0.88); }
      CUTP.push([Pa(oa - 0.5), Pb(ob - 0.5), Pb(tb + 2), Pa(ta + 2)]);
      built++;
    }
    standLog.push([name, built*5]);
  }
  F1T.stands = standLog;

  // ================= night lighting: truss pylons along the whole lap with projector bars over the track =================
  let nPyl = 0, nBar = 0, nPole = 0, nHang = 0; const LIGHT_S = [];
  const projBar = (i, sd, o, z, arm) => {
    // a bar along the track at offset o, height z, with six projectors tilted at the track; lenses glow at night
    const s = sd ? -1 : 1, d = [Ln.DX[Math.min(i, n - 1)], Ln.DY[Math.min(i, n - 1)]], c = at(i, s*o), half = 2.1;
    const a = [c[0] - d[0]*half, c[1] - d[1]*half, z], b = [c[0] + d[0]*half, c[1] + d[1]*half, z]; bar(D, a, b, 0.07, C_DSTEEL);
    for (let k = 0; k < 6; k++){ const t = -half + 0.35 + k*(2*half - 0.7)/5, p = [c[0] + d[0]*t - NX[i]*s*0.25, c[1] + d[1]*t - NY[i]*s*0.25];
      addPrism(D, orect(p, d, 0.26, 0.24), z - 0.55, z - 0.08, [0.3, 0.31, 0.33]);
      const q = [p[0] - NX[i]*s*0.25, p[1] - NY[i]*s*0.25], l0 = [q[0] - d[0]*0.22, q[1] - d[1]*0.22], l1 = [q[0] + d[0]*0.22, q[1] + d[1]*0.22], col = [1, 0.98, 0.94];
      // lens: facing the track and down
      const A = s > 0 ? [l0, l1] : [l1, l0];
      pv(GL, A[0][0], z - 0.55, A[0][1], col); pv(GL, A[1][0], z - 0.55, A[1][1], col); pv(GL, A[1][0], z - 0.1, A[1][1], col);
      pv(GL, A[0][0], z - 0.55, A[0][1], col); pv(GL, A[1][0], z - 0.1, A[1][1], col); pv(GL, A[0][0], z - 0.1, A[0][1], col); }
    const g = at(i, s*(o - 0.6)); LAMPS.push(g[0], z - 0.7, -g[1]); LAMPC.push(0.95, 0.97, 1);
    void arm; nBar++; LIGHT_S.push(cum[Math.min(i, n)]);
  };
  const pylon = (i, sd, o, zg, H) => {
    const s = sd ? -1 : 1, d = [Ln.DX[i], Ln.DY[i]], v = [NX[i]*s, NY[i]*s], c = at(i, s*o), r = 0.32, col = [0.7, 0.72, 0.74];
    const leg = (a, b) => [c[0] + d[0]*a + v[0]*b, c[1] + d[1]*a + v[1]*b];
    const L4 = [leg(-r, -r), leg(r, -r), leg(r, r), leg(-r, r)];
    for (const p of L4) bar(D, [p[0], p[1], zg - 0.3], [p[0], p[1], zg + H], 0.045, col);
    const st = 1.7, nl = Math.max(2, Math.round(H/st));
    for (let k = 0; k < nl; k++){ const z0 = zg + k*H/nl, z1 = zg + (k + 1)*H/nl;
      for (const [p, q] of [[L4[0], L4[1]], [L4[3], L4[2]]]) bar(D, [p[0], p[1], z0], [q[0], q[1], z1], 0.025, col);
      for (const [p, q] of [[L4[0], L4[3]], [L4[1], L4[2]]]) bar(D, [p[0], p[1], z1], [q[0], q[1], z0], 0.025, col); }
    addPrism(D, orect(c, d, 0.45, 0.45), zg - 0.4, zg + 0.25, C_CONC2);
    // the arm over the fence towards the track (a two-chord truss), the projector bar at its end
    const reach = Math.min(2.6, o - WALL[sd][i] + 1.4), e = at(i, s*(o - reach));
    bar(D, [c[0], c[1], zg + H], [e[0], e[1], zg + H], 0.05, col); bar(D, [c[0], c[1], zg + H - 0.7], [e[0], e[1], zg + H - 0.1], 0.04, col);
    projBar(i, sd, o - reach, zg + H - 0.1, true); nPyl++;
  };
  for (let i = 2; i < n; i += 6){
    const k = Ln.K[i], pref = Math.abs(k) > 1/250 ? (k > 0 ? 1 : 0) : ((i/6) & 1);
    let placed = false;
    for (const sd of [pref, 1 - pref]){ const s = sd ? -1 : 1, wv = WALL[sd][i];
      if (NOWALL[sd][i]) continue;
      if (STAND[sd][i] > 0){ projBar(i, sd, wv + 1.0, STAND[sd][i] + 0.9, false); const p = at(i, s*(wv + 1.9)); post(D, p, 0.06, STAND[sd][i] - 0.2, STAND[sd][i] + 1.0, C_DSTEEL); placed = true; break; }
      if (!isNaN(pitRel[i]) && pitRel[i]*s > 0) continue;
      const room = Math.min(FREE[sd][i], freeTo(i, s, wv + 3)) - wv; if (room < 1.3) continue;
      const o = wv + Math.min(1.25, room - 0.5), p = at(i, s*o);
      if (onTrack(p[0], p[1], i, 0.4) || onPit(p[0], p[1], 0.5) || SF.q(p[0], p[1])[1] === 4) continue;
      const zg = Math.max(gAt(p[0], p[1]), zSec(i, s*Math.min(o, 16)) - 0.1); let H = 10.5; const ov = over(p[0], p[1], roofs, zg + 0.5);
      if (ov < zg + H + 0.8) H = ov - zg - 0.8; if (H < 5.5) continue;
      pylon(i, sd, o, zg, H); placed = true; break; }
    // no room behind the walls (bridge decks, narrow streets): a slim pole on the back of the wall with a short arm
    if (!placed) for (const sd of [pref, 1 - pref]){ const s = sd ? -1 : 1, wv = WALL[sd][i]; if (NOWALL[sd][i] || (!isNaN(pitRel[i]) && pitRel[i]*s > 0)) continue;
      const p = at(i, s*(wv + 0.22)), zw = zSec(i, s*wv); let H = 9; const ov = over(p[0], p[1], roofs, zw + 0.5); if (ov < zw + H + 0.8) H = ov - zw - 0.8;
      // under a viaduct or a link bridge: the projector bar hangs from its soffit
      if (H < 3.2){ if (ov - zw > 3.2 && ov - zw < 40){ projBar(i, sd, wv - 1.4, ov - 0.25, true); nHang++; break; } continue; }
      bar(D, [p[0], p[1], zw + 0.9], [p[0], p[1], zw + H], 0.09, [0.7, 0.72, 0.74]); const e = at(i, s*(wv - 1.4)); bar(D, [p[0], p[1], zw + H], [e[0], e[1], zw + H], 0.06, [0.7, 0.72, 0.74]);
      projBar(i, sd, wv - 1.4, zw + H - 0.05, true); nPole++; break; }
  }
  F1T.lights = {pylons:nPyl, poles:nPole, hung:nHang, bars:nBar};
  // light pools (additive at night) on the racing surface and run-off, brightest under each projector bar; the pit lane
  { const LI = new Float32Array(n); for (let i = 0; i < n; i++){ let b = 0; for (const sb of LIGHT_S){ let ds = Math.abs(cum[i] - sb); ds = Math.min(ds, Ln.L - ds); if (ds < 20) b = Math.max(b, 1 - (ds/20)*(ds/20)); } LI[i] = 0.68 + 0.3*b; }
    let gap = 0, run = 0; const dark = []; for (let i = 0; i < 2*n; i++){ if (LI[w(i)] < 0.7) run++; else { if (run > 4 && i - run < n) dark.push([w(i - run), run*5]); run = 0; } gap = Math.max(gap, run); } F1T.lights.maxDark = gap*5; F1T.lights.dark = dark;
    // (6 cm over the surface, following it across: a higher sheet would wash over the cars' lower bodies)
    for (let i = 0; i < n; i++){ const j = w(i + 1), ci = [0.66*LI[i], 0.66*LI[i], 0.64*LI[i]], cj = [0.66*LI[j], 0.66*LI[j], 0.64*LI[j]];
      const O = [-RIB[1][i], -HR[i]*0.5, 0, HL[i]*0.5, RIB[0][i]], Oj = [-RIB[1][j], -HR[j]*0.5, 0, HL[j]*0.5, RIB[0][j]];
      for (let k = 0; k < 4; k++){ const a = P3(i, O[k], 0.06), b = P3(j, Oj[k], 0.06), c = P3(j, Oj[k + 1], 0.06), d = P3(i, O[k + 1], 0.06);
        pv(GL, a[0], a[2], a[1], ci); pv(GL, b[0], b[2], b[1], cj); pv(GL, c[0], c[2], c[1], cj); pv(GL, a[0], a[2], a[1], ci); pv(GL, c[0], c[2], c[1], cj); pv(GL, d[0], d[2], d[1], ci); } }
    const PN = pitInfo.N, zp = pitInfo.z, gc = [0.5, 0.5, 0.48];
    for (let j = 0; j < np - 1; j++){ const h0 = php(j), h1 = php(j + 1), a = [PQ[j][0] - PN[j][0]*h0, PQ[j][1] - PN[j][1]*h0], b = [PQ[j + 1][0] - PN[j + 1][0]*h1, PQ[j + 1][1] - PN[j + 1][1]*h1],
        c = [PQ[j + 1][0] + PN[j + 1][0]*h1, PQ[j + 1][1] + PN[j + 1][1]*h1], d = [PQ[j][0] + PN[j][0]*h0, PQ[j][1] + PN[j][1]*h0];
      pv(GL, a[0], zp[j] + 0.06, a[1], gc); pv(GL, b[0], zp[j + 1] + 0.06, b[1], gc); pv(GL, c[0], zp[j + 1] + 0.06, c[1], gc); pv(GL, a[0], zp[j] + 0.06, a[1], gc); pv(GL, c[0], zp[j + 1] + 0.06, c[1], gc); pv(GL, d[0], zp[j] + 0.06, d[1], gc); } }

  // ================= marshal posts (cabin, flag-light panel facing the track) =================
  let nMar = 0;
  for (let s0 = 120; s0 < Ln.L - 60; s0 += 205){
    const i = Math.round(s0/5) % n;
    for (const sd of [nMar & 1, 1 - (nMar & 1)]){ const s = sd ? -1 : 1, wv = WALL[sd][i];
      if (NOWALL[sd][i] || STAND[sd][i] > 0 || (!isNaN(pitRel[i]) && pitRel[i]*s > 0) || Math.min(FREE[sd][i], freeTo(i, s, wv + 4)) - wv < 3.2) continue;
      const c = at(i, s*(wv + 1.9)); if (onTrack(c[0], c[1], i, 0.6) || onPit(c[0], c[1]) || SF.q(c[0], c[1])[1] === 4) continue;
      const d = [Ln.DX[i], Ln.DY[i]], zg = gAt(c[0], c[1]);
      addPrism(D, orect(c, d, 1.3, 0.85), zg - 0.3, zg + 2.4, [0.95, 0.95, 0.94]);
      addPrism(D, orect(c, d, 1.5, 1.05), zg + 2.4, zg + 2.6, C_ORANGE);
      const pp = at(i + 1, s*(wv + 0.45)), dz = zSec(i, s*wv);
      post(D, pp, 0.05, dz + 1.0, dz + 3.9, C_DSTEEL);
      const pl = at(i + 1, s*(wv + 0.38)), q0 = [pl[0] - d[0]*0.55, pl[1] - d[1]*0.55], q1 = [pl[0] + d[0]*0.55, pl[1] + d[1]*0.55], A = s > 0 ? [q0, q1] : [q1, q0];
      addPrism(D, orect(pl, d, 0.6, 0.05), dz + 3.1, dz + 3.95, C_BLACK);
      const pc = at(i + 1, s*(wv + 0.31)), B0 = [pc[0] - d[0]*0.5, pc[1] - d[1]*0.5], B1 = [pc[0] + d[0]*0.5, pc[1] + d[1]*0.5], AA = s > 0 ? [B0, B1] : [B1, B0], gc = [0.25, 0.8, 0.35];
      pv(GL, AA[0][0], dz + 3.18, AA[0][1], gc); pv(GL, AA[1][0], dz + 3.18, AA[1][1], gc); pv(GL, AA[1][0], dz + 3.87, AA[1][1], gc); pv(GL, AA[0][0], dz + 3.18, AA[0][1], gc); pv(GL, AA[1][0], dz + 3.87, AA[1][1], gc); pv(GL, AA[0][0], dz + 3.87, AA[0][1], gc);
      void A; nMar++; break; }
  }
  F1T.marshals = nMar;

  // ================= the start gantry over the line (five pairs of red lights, driven by the race) =================
  { const i = 0, d = [Ln.DX[0], Ln.DY[0]], oL = WL[0] + 0.1, oR = WR[0] + 0.5, pL = at(i, oL), pR = at(i, -oR), z0 = ZT[0], zt = z0 + 8.2;
    for (const p of [pL, pR]){ addPrism(D, orect(p, d, 0.35, 0.35), z0 - 0.4, zt + 0.4, [0.78, 0.79, 0.8]); }
    for (const dz of [0, 1.0]) bar(D, [pL[0], pL[1], zt - dz], [pR[0], pR[1], zt - dz], 0.09, [0.8, 0.81, 0.82]);
    for (let k = 0; k <= 8; k++){ const t = k/8, a = [lerp(pL[0], pR[0], t), lerp(pL[1], pR[1], t)], b = [lerp(pL[0], pR[0], t + 0.0625), lerp(pL[1], pR[1], t + 0.0625)];
      bar(D, [a[0], a[1], zt - 1.0], [a[0], a[1], zt], 0.05, [0.8, 0.81, 0.82]); if (k < 8) bar(D, [a[0], a[1], zt - 1.0], [b[0] + (b[0] - a[0]), b[1] + (b[1] - a[1]), zt], 0.04, [0.8, 0.81, 0.82]); }
    // the light panel facing the grid (towards -d)
    const pc = at(i, 0), pnl = [pc[0] - d[0]*0.3, pc[1] - d[1]*0.3]; addPrism(D, orect(pnl, [NX[0], NY[0]], 2.6, 0.22), zt - 2.9, zt - 1.05, C_BLACK);
    const lamps = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.34, 0.08), M.lamp, 10), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.atan2(d[1], d[0]) + Math.PI/2, 0));
    for (let c = 0; c < 5; c++) for (let r = 0; r < 2; r++){ const o = -2.0 + c*1.0, p = [pnl[0] + NX[0]*o - d[0]*0.24, pnl[1] + NY[0]*o - d[1]*0.24];
      m4.compose(new THREE.Vector3(p[0], zt - 2.4 + r*0.75, -p[1]), q4, new THREE.Vector3(1, 1, 1)); lamps.setMatrixAt(c*2 + r, m4); lamps.setColorAt(c*2 + r, new THREE.Color(0.16, 0.03, 0.03)); }
    lamps.instanceColor.needsUpdate = true; lamps.name = 'f1lights'; regionGroup.add(lamps); F1T.lampMesh = lamps; F1T.lampLit = -1;
  }

  // ================= the corridor: the city keeps off it; app trees inside are removed =================
  for (let i = 0; i < n; i += 1){ const rad = Math.max(WL[i], WR[i]) + 1.5, p = [X[i], Y[i]];
    for (let j = cx2i(p[1] - rad); j <= cx2i(p[1] + rad); j++) for (let q = cx2i(p[0] - rad); q <= cx2i(p[0] + rad); q++){ const x = cellX(q), yy = cellX(j); if ((x - p[0])**2 + (yy - p[1])**2 <= rad*rad){ const k = j*N + q; zones[k] = 0; if (!resv[k] || resv[k] === 5 || resv[k] === 6) resv[k] = 4; } } }
  F1T.bb = bb;
  F1T.cut = (x, y) => {
    if (x < bb[0] || x > bb[2] || y < bb[1] || y > bb[3]) return false;
    if (onTrack(x, y, undefined, 1.8)) return true;
    if (onPit(x, y, 1.5)) return true;
    for (const P of CUTP) if (pipF(P, x, y)) return true;
    return false; };
  // trees already standing (a rebuild of the network) are trimmed now
  if (SGR.tiles) for (const T of SGR.tiles.values()) if (T.trees) f1tTrimTrees(T);

  // ---- meshes that belong to the circuit only
  const track = tbMesh(TR, M.track); track.receiveShadow = true; track.renderOrder = 2; track.name = 'f1track'; regionGroup.add(track);
  if (FEN.p.length){ const f = tbMesh(FEN, M.fence); f.renderOrder = 3; f.name = 'f1fence'; regionGroup.add(f); }
  if (GL.pos.length){ const m = toMesh(GL, M.glow); m.renderOrder = 4; m.name = 'f1glow'; regionGroup.add(m); }
  if (LAMPS.length){ const pm = pointsMesh(LAMPS, LAMPC, M.spr); pm.name = 'f1lamps'; regionGroup.add(pm); }
  st.fenceTris = FEN.p.length/9;

  // ---- net.f1: the drive module's circuit (race direction; P[n] = P[0])
  const im = new THREE.InstancedMesh(F1_GEO, M.car, 10), cc = new THREE.Color(); im.castShadow = true;
  const TEAMC = [[0.85, 0.85, 0.86], [0.12, 0.2, 0.45], [0.1, 0.5, 0.48], [0.9, 0.55, 0.15], [0.15, 0.4, 0.25], [0.55, 0.12, 0.14], [0.2, 0.32, 0.7], [0.5, 0.5, 0.52], [0.16, 0.16, 0.18], [0.85, 0.75, 0.2]];
  TEAMC.forEach((c, i) => { cc.setRGB(c[0], c[1], c[2]); im.setColorAt(i, cc); }); moverGroup.add(im);
  const rr = mulberry32(2023); let s0 = 0; const cars = TEAMC.map(() => { s0 += 140 + rr()*220; return {s0, v:46}; });
  const cumF = new Float32Array(n + 1); for (let i = 0; i <= n; i++) cumF[i] = cum[i];
  net.f1 = {P:Array.from({length:n + 1}, (_, i) => [X[i], Y[i]]), y:Array.from({length:n + 1}, (_, i) => ZT[w(i)] + 0.12), cum:cumF, L:Ln.L, im, cars, n,
    startI:0, hl:HL, hr:HR, wl:WL, wr:WR, layout:2023, pit:pitInfo};
  const lab = at(Math.round(n*0.45), 0);
  net.extras.push({x:1500, y:-2700, t:'f1', top:G(1500, -2700) + 40, name:['F1 滨海湾街道赛道 · 4.940 公里 · 19 个弯', 'Marina Bay Street Circuit · 4.940 km · 19 turns']}); void lab;
  net.extras.push({x:2107, y:-2611, t:'pits', top:G(2107, -2611) + 30, name:['F1 维修区大楼', 'Pit Building']});
  F1T.line = Ln; F1T.W = {WL, WR, HL, HR, NOWALL, FREE, SUP, EXT, TAG, ZT, ZS, KS, KIN}; F1T.pit = pitInfo;
  st.softBarrier = nSoft*5; st.glowTris = GL.pos.length/9; st.lamps = LAMPS.length/3; st.L = +Ln.L.toFixed(1); st.n = n; st.deckTris = (D.pos.length - nD0)/9; st.bldTris = (B.bld.pos.length - nB0)/9; st.ms = +(performance.now() - T0).toFixed(0);
  F1T.ms = st.ms;
}
sgF1 = f1tBuild;
// app trees standing inside the circuit corridor, the stands or the paddock are removed (scaled to zero)
const ZERO4 = new THREE.Matrix4().makeScale(0, 0, 0), M4 = new THREE.Matrix4();
function f1tTrimTrees(T){
  const im = T.trees; if (!im || !F1T.cut) return; let k = 0;
  const tk = im.children.find(c => c.isInstancedMesh && c.count === im.count);
  for (let i = 0; i < im.count; i++){ im.getMatrixAt(i, M4); const e = M4.elements; if (e[0] === 0 && e[5] === 0) continue; if (F1T.cut(e[12], -e[14])){ im.setMatrixAt(i, ZERO4); if (tk) tk.setMatrixAt(i, ZERO4); k++; } }
  if (k){ im.instanceMatrix.needsUpdate = true; if (tk) tk.instanceMatrix.needsUpdate = true; F1T.treesCut = (F1T.treesCut || 0) + k; }
}
if (typeof sgrTrees === 'function' && !sgrTrees.f1t){ const orig = sgrTrees; sgrTrees = function(T){ orig(T); try { f1tTrimTrees(T); } catch (e){ console.error('f1track trees', e); } }; sgrTrees.f1t = true; }
// the OSM raceway ways (pit straight, pit lane, Turn 16 - Turn 3) are replaced by the circuit's own surfaces: the road module skips them
if (typeof sgrSkipLine === 'function' && !sgrSkipLine.f1t){ const orig = sgrSkipLine; sgrSkipLine = function(i){ const l = SGR.lines[i];
  if (l && l.c === 18 && F1T.bb && net && net.f1 && net.f1.layout){ const b = F1T.bb, P = l.P, m = (P.length >> 2) << 1; if (P[m] > b[0] && P[m] < b[2] && P[m + 1] > b[1] && P[m + 1] < b[3]) return true; }
  return orig(i); }; sgrSkipLine.f1t = true; }
// real buildings the circuit replaces (after buildNetworkSG has reset SGR.discs)
HOOKS.frame.push(() => { if (!MT) return; const k = typeof nightF === 'number' ? sstep((nightF - 0.12)/0.5) : 0; MT.glow.opacity = 0.85*k; MT.spr.opacity = k; });
HOOKS.net.push(() => { if (!SGR.on || !net.f1 || !net.f1.layout) return; for (const h of F1T_HIDE) SGR.discs.push({x:h[0], y:h[1], r:6, t:-1, h:h[2] + 0.05}); });
// the start lights follow the race (grid: one pair more every second; all out at the start)
HOOKS.frame.push(() => {
  const im = F1T.lampMesh; if (!im || !SGR.on || !net.f1 || !net.f1.layout) return;
  let lit = 0; try { const R = window.SGF1 && window.SGF1.RACE; if (R && R.state === 'grid') lit = Math.max(0, Math.min(5, R.lights | 0)); } catch (e){ lit = 0; }
  if (lit === F1T.lampLit) return; F1T.lampLit = lit; const c = new THREE.Color();
  for (let k = 0; k < 10; k++){ const on = (k >> 1) < lit; c.setRGB(on ? 1 : 0.16, on ? 0.06 : 0.03, on ? 0.04 : 0.03); im.setColorAt(k, c); }
  im.instanceColor.needsUpdate = true;
});
}
