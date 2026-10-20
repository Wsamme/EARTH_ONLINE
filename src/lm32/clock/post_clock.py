# v36 lm32/clock: the ▶ play speed comes from SGClock (1x ... 2400x); the weather's sped-up drying / cloud drift only at fast speeds.
# A POSTS file for sgreal/patch17.py (asserted replacements).
def apply(src, city):
    a = "if (todPlay){ tod = (tod + dt*0.66) % 24; applyTime(); }"
    assert src.count(a) == 1, ('post_clock loop', src.count(a))
    src = src.replace(a, "if (todPlay){ tod = (tod + dt*(window.SGClock ? SGClock.hps() : 0.66)) % 24; applyTime(); }   // v36 lm32/clock")
    n = 0
    for k in ('20', '45'):
        x = "todPlay ? %s : 1" % k
        n += src.count(x)
        src = src.replace(x, "(todPlay && (!window.SGClock || SGClock.fast())) ? %s : 1" % k)
    assert n >= 2, ('post_clock wx', n)
    return src
