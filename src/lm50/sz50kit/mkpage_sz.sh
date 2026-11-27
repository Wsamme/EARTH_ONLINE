#!/bin/bash
# Build a Greater Bay test page into SC/lm50/sz/site (never the release site/gba.html) with SC/gbabuild/build.sh (the fragile 14 Nov
# snapshot build: it copies src/gbareal and src/gba into SC/gbabuild/src and runs gbareal/tools/patch17_gba.py with CITY=gba).
# The build picks up every src/gba/<d>/<d>.js whose file name equals its folder name (glob in patch17_gba.py); GBALM limits that list.
# usage: bash SC/lm33/kit/heavy.sh bash mkpage_sz.sh <name> [sz50x,szcbd,... | all | none]
#   -> SC/lm50/sz/site/t_<name>.html (+ gbadata -> site/gbadata symlink). The Hong Kong copies (gbareal/app/hklm) are always in.
#   Delete the page when done (~8.6 MB).
set -e
SC=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
SITE=$SC/lm50/sz/site; mkdir -p $SITE
[ -e $SITE/gbadata ] || ln -s /home/claude/earth_online/site/gbadata $SITE/gbadata
N=$1; L=${2:-all}
if [ "$L" = "all" ]; then unset GBALM; elif [ "$L" = "none" ]; then export GBALM=; else export GBALM=$L; fi
HOOK=$(python3 -c "import os; print(os.path.relpath('/home/claude/earth_online/src/lm50/sz50kit/testhook_sz.js', '$SC/gbabuild/src'))")
EXTRA_MODS=$HOOK bash $SC/gbabuild/build.sh $SITE/t_$N.html
grep -c "window.__t = " $SITE/t_$N.html > /dev/null && echo "test hook in"
