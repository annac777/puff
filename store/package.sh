#!/bin/sh
# Builds the panel into the extension, runs the tests, and zips the extension for the Chrome Web
# Store. Tests and local files stay out of the zip.
set -e
cd "$(dirname "$0")/.."

(cd ui-source && npm run build)
rm -rf extension/app/assets extension/app/index.html
cp -R ui-source/dist/assets ui-source/dist/index.html extension/app/

(cd extension && node --test tests/*.test.js)

version=$(python3 -c "import json;print(json.load(open('extension/manifest.json'))['version'])")
out="store/puff-$version.zip"
rm -f "$out"
(cd extension && zip -qr "../$out" . -x 'tests/*' -x '.*' -x '*/.*')
echo "wrote $out"
unzip -l "$out" | tail -1
