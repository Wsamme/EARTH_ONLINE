# 波那维斯达站这一段高架由地标模型自己画，通用地铁高架在这里让开，避免两套管梁叠在一起。
def apply(src, city):
    if city != 'sg':
        return src
    a = "const c0 = cls[i], c1 = cls[i+1]; if (c0 === 2 && c1 === 2) continue;"
    b = a + "\n    if (window.BV && BV.skipRail && BV.skipRail(P[i][0], P[i][1], P[i+1][0], P[i+1][1])) continue;"
    n = src.count(a)
    assert n == 1, ('bv rail', n)
    return src.replace(a, b, 1)
