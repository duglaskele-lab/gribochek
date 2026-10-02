#!/bin/bash
# Prepares a Claude Code cloud session so the game can be built and tested right away:
#   python3 proj/build.py            (syntax check needs node, which the cloud image has)
#   python3 proj/tests/run.py --all  (needs the Playwright Python package)
# The cloud image ships its own Chromium in /opt/pw-browsers; the Playwright package must be the version that
# expects exactly that browser build, otherwise it asks to download a browser it cannot reach.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Playwright version -> the Chromium build it expects (see /opt/pw-browsers/chromium-NNNN)
declare -A PW_FOR_BUILD=([1194]=1.56.0)

build=$(ls -d /opt/pw-browsers/chromium_headless_shell-* 2>/dev/null | sed 's/.*-//' | sort -n | tail -1 || true)
want=${PW_FOR_BUILD[$build]:-1.56.0}
have=$(python3 -c "import importlib.metadata as m;print(m.version('playwright'))" 2>/dev/null || true)

if [ "$have" != "$want" ]; then
  pip install -q --disable-pip-version-check --root-user-action=ignore "playwright==$want"
fi

# build the game once so dist/ matches src/ and the syntax check runs
python3 "$CLAUDE_PROJECT_DIR/proj/build.py" >/dev/null
