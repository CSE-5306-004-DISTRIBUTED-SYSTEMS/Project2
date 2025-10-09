#!/bin/bash
set -e

if [ "$1" = 'primary' ]; then
    exec /usr/local/bin/docker-entrypoint.sh postgres
elif [ "$1" = 'replica' ]; then
    until pg_isready -h db-primary; do sleep 2; done
    rm -rf /var/lib/postgresql/data/*
    pg_basebackup -h db-primary -U replicator -D /var/lib/postgresql/data -Fp -Xs stream -R
    exec /usr/local/bin/docker-entrypoint.sh postgres
fi
exec "$@"