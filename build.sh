#!/usr/bin/env bash
# Packages the extension for upload to the Chrome Web Store (docs and scripts are left out).
# A development-only "key" in manifest.json is stripped, since the store assigns its own.
set -euo pipefail
cd "$(dirname "$0")"
version=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")
if grep -q PASTE_YOUR_CLIENT_ID manifest.json; then
  echo "warning: manifest.json still has the placeholder OAuth client_id" >&2
fi
out="$PWD/dist/novakid-calendar-$version.zip"
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT
cp -r hook.js novakid.js bridge.js popup.html popup.js icons _locales "$stage"/
python3 -c "import json,sys; m=json.load(open('manifest.json')); m.pop('key',None); json.dump(m,open(sys.argv[1],'w'),indent=2,ensure_ascii=False)" "$stage/manifest.json"
mkdir -p dist
rm -f "$out"
(cd "$stage" && zip -r -q "$out" .)
echo "$out"
