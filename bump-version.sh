#!/bin/bash

set -euo pipefail

cd $(dirname "$0")

currentVersion=$(sed -ne 's/^\s*"version"\s*:\s*"\(.*\)"\s*,/\1/p' < package.json)

echo "Current version: $currentVersion"
echo -n 'New version: '
read newVersion

sed -i -e "/\"version\"/s/\(\"version\"\s*:\s*\"\).*\"/\1$newVersion\"/" package.json

git add package.json
git commit -m "Bump version to $newVersion"
