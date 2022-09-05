#!/bin/bash

set -euo pipefail

MARIADB_PORT=51576
DB_CONTAINER_NAME=andeo-lunch-test-db
export TEST_DB=mariadb
export TEST_DB_NAME=andeolunchtest
export TEST_DB_HOST=127.0.0.1
export TEST_DB_PORT=$MARIADB_PORT
export TEST_DB_USERNAME=andeolunchtest
export TEST_DB_PASSWORD=andeolunchtest

cd $(dirname "$0")/..

# MariaDB 10.5 is mostly used for development, 10.6 is used for production.

for MARIADB_VERSION in 10.5 10.6 10.7; do
    echo "Removing existing container"
    docker container rm --force "$DB_CONTAINER_NAME" 2> /dev/null || true

    echo "Starting MariaDB $MARIADB_VERSION"
    docker run \
        --pull=always \
        --rm \
        --detach \
        --name "$DB_CONTAINER_NAME" \
        --env MARIADB_RANDOM_ROOT_PASSWORD=1 \
        --env MARIADB_DATABASE="$TEST_DB_NAME" \
        --env MARIADB_USER="$TEST_DB_USERNAME" \
        --env MARIADB_PASSWORD="$TEST_DB_PASSWORD" \
        --publish $MARIADB_PORT:3306 \
        mariadb:$MARIADB_VERSION

    # Wait until it is up
    while :; do
        mysql \
            --host=127.0.0.1 \
            --port=$MARIADB_PORT \
            --user="$TEST_DB_USERNAME" \
            --password="$TEST_DB_PASSWORD" \
            --execute='SELECT 1 + 1' \
            "$TEST_DB_NAME" \
            > /dev/null 2>&1 && \
            break
        echo 'Waiting for MariaDB to be up...'
        sleep 3
    done

    echo 'MariaDB is up'

    # Run tests, in-band is necessary, since with only one DB we can't run them in parallel
    yarn jest --runInBand
done

echo "Stopping MariaDB"
docker stop "$DB_CONTAINER_NAME"
