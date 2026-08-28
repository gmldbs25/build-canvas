#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$project_root"
GITHUB_PAGES=true PAGES_BASE_PATH=/build-canvas npm run build
GITHUB_PAGES=true PAGES_BASE_PATH=/build-canvas node scripts/export-github-pages.mjs

npm run install:ci --prefix projects/orca
chmod +x projects/orca/scripts/*.sh
GITHUB_PAGES=true PAGES_BASE_PATH=/build-canvas/orca npm run build:pages --prefix projects/orca

npm run install:ci --prefix projects/transformer-to-agent
chmod +x projects/transformer-to-agent/scripts/*.sh
GITHUB_PAGES=true PAGES_BASE_PATH=/build-canvas/transformer-to-agent npm run build:pages --prefix projects/transformer-to-agent

mkdir -p dist-pages/orca dist-pages/texas-trace dist-pages/transformer-to-agent
cp -R projects/orca/dist-pages/. dist-pages/orca/
cp -R projects/texas-trace/. dist-pages/texas-trace/
cp -R projects/transformer-to-agent/dist-pages/. dist-pages/transformer-to-agent/

find dist-pages -name ".DS_Store" -delete
