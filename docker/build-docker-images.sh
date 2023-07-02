#!/bin/bash

set -euo pipefail

if [[ -z "$VUE_APP_BACKEND_URL" || -z "$VUE_APP_BRANDING_TITLE" ]]; then
    echo ''
    echo 'ERROR: Necessary VUE_APP_* variables are not set, cannot build.'
    echo '       (app/.env will NOT be used for building!)'
    echo ''
    exit 1
fi

cd $(dirname "$0")/..

if [[ -e .git ]]; then
    VUE_APP_BUILD_COMMIT=$(git describe --always --dirty)
else
    VUE_APP_BUILD_COMMIT=
fi

docker build \
    --pull \
    -t andeo-lunch-app${DOCKER_IMAGE_SUFFIX:-} \
    --build-arg VUE_APP_BACKEND_URL="$VUE_APP_BACKEND_URL" \
    --build-arg VUE_APP_BRANDING_TITLE="$VUE_APP_BRANDING_TITLE" \
    --build-arg VUE_APP_BUILD_COMMIT="$VUE_APP_BUILD_COMMIT" \
    -f docker/Dockerfile.app \
    .

docker build \
    --pull \
    -t andeo-lunch-backend${DOCKER_IMAGE_SUFFIX:-} \
    -f docker/Dockerfile.backend \
    .
