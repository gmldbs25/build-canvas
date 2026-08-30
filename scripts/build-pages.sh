#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$project_root"
GITHUB_PAGES=true PAGES_BASE_PATH=/build-canvas npm run build
GITHUB_PAGES=true PAGES_BASE_PATH=/build-canvas node scripts/export-github-pages.mjs

if [[ "$(uname -s)" == "Linux" ]]; then
  npm run install:ci --prefix projects/orca
else
  test -x projects/orca/node_modules/.bin/vinext || {
    echo "ORCA dependencies are missing. Run npm install --prefix projects/orca first." >&2
    exit 69
  }
fi
chmod +x projects/orca/scripts/*.sh
GITHUB_PAGES=true PAGES_BASE_PATH=/build-canvas/orca npm run build:pages --prefix projects/orca

if [[ "$(uname -s)" == "Linux" ]]; then
  npm run install:ci --prefix projects/transformer-to-agent
else
  test -x projects/transformer-to-agent/node_modules/.bin/vinext || {
    echo "Transformer dependencies are missing. Run npm install --prefix projects/transformer-to-agent first." >&2
    exit 69
  }
fi
chmod +x projects/transformer-to-agent/scripts/*.sh
GITHUB_PAGES=true PAGES_BASE_PATH=/build-canvas/transformer-to-agent npm run build:pages --prefix projects/transformer-to-agent

mkdir -p dist-pages/orca dist-pages/texas-trace dist-pages/transformer-to-agent
cp -R projects/orca/dist-pages/. dist-pages/orca/
cp -R projects/texas-trace/. dist-pages/texas-trace/
cp -R projects/transformer-to-agent/dist-pages/. dist-pages/transformer-to-agent/

find dist-pages -name ".DS_Store" -delete
