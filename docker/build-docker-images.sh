#!/bin/bash

set -e

if [[ -z "$VUE_APP_BACKEND_URL" || -z "$VUE_APP_BRANDING_TITLE" ]]; then
    echo ''
    echo 'ERROR: Necessary VUE_APP_* variables are not set, cannot build.'
    echo '       (app/.env will NOT be used for building!)'
    echo ''
    exit 1
fi

cd $(dirname "$0")/..

docker build \
    --pull \
    -t andeo-lunch-app \
    --build-arg VUE_APP_BACKEND_URL="$VUE_APP_BACKEND_URL" \
    --build-arg VUE_APP_BRANDING_TITLE="$VUE_APP_BRANDING_TITLE" \
    -f docker/Dockerfile.app \
    .

docker build \
    --pull \
    -t andeo-lunch-backend \
    -f docker/Dockerfile.backend \
    .
