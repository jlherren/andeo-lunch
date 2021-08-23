#!/bin/bash

set -euo pipefail

export VUE_APP_BACKEND_URL="http://localhost:53768/api"
export VUE_APP_BRANDING_TITLE="Andeo Lunch (cypress)"
export DOCKER_IMAGE_SUFFIX=-cypress

$(dirname "$0")/build-docker-images.sh
