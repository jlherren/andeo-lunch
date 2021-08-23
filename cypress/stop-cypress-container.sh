#!/bin/bash

set -euo pipefail

cd $(dirname "$0")

. ./.env

$DOCKER_COMPOSE down --volume
