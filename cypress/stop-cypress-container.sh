#!/bin/bash

set -e

cd $(dirname "$0")

. ./.env

$DOCKER_COMPOSE down --volume
