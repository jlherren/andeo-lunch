#!/bin/bash

set -e

if [[ -z "$VUE_APP_BACKEND_URL" ]]; then
    echo ''
    echo 'ERROR: VUE_APP_BACKEND_URL is not set, cannot build.'
    echo '       (and no, app/.env will not be used for building).'
    echo ''
    exit 1
fi

docker build \
    --pull \
    -t andeo-lunch-app \
    --build-arg VUE_APP_BACKEND_URL="$VUE_APP_BACKEND_URL" \
    --build-arg VUE_APP_BRANDING_TITLE="$VUE_APP_BRANDING_TITLE" \
    app

docker build \
    --pull \
    -t andeo-lunch-backend \
    backend
