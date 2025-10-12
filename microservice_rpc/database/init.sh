#!/bin/bash
set -e

ROLE=$1

if [ "$ROLE" = "primary" ]; then
    echo "[INFO] Starting PRIMARY node..."
    exec docker-entrypoint.sh postgres

elif [ "$ROLE" = "replica" ]; then
    echo "[INFO] Starting REPLICA node..."
    # Wait for primary
    until pg_isready -h db-primary -U postgres; do
        echo "Waiting for primary..."
        sleep 2
    done

    echo "[INFO] Primary ready. Starting base backup..."
    rm -rf /var/lib/postgresql/data/*

    PGPASSWORD=${POSTGRES_REPLICATION_PASSWORD} \
      pg_basebackup -h db-primary -U ${POSTGRES_REPLICATION_USER} \
      -D /var/lib/postgresql/data -Fp -Xs -R -P

    echo "[INFO] Base backup complete. Starting replica..."
    exec docker-entrypoint.sh postgres
else
    echo "[ERROR] Unknown role '$ROLE'. Use 'primary' or 'replica'."
    exit 1
fi






# #!/bin/bash
# set -e

# # Copy configs into data dir
# cp /etc/postgresql/pg_hba.conf /var/lib/postgresql/data/pg_hba.conf
# cp /etc/postgresql/postgresql.conf /var/lib/postgresql/data/postgresql.conf
# chown postgres:postgres /var/lib/postgresql/data/*.conf

# if [ "$1" = "primary" ]; then
#     echo "Starting primary..."
#     exec gosu postgres postgres -D /var/lib/postgresql/data -c config_file=/var/lib/postgresql/data/postgresql.conf

# elif [ "$1" = "replica" ]; then
#     echo "Starting replica..."
#     until pg_isready -h db-primary; do sleep 2; done
#     rm -rf /var/lib/postgresql/data/*
#     PGPASSWORD=$POSTGRES_REPLICATION_PASSWORD pg_basebackup -h db-primary -U $POSTGRES_REPLICATION_USER -D /var/lib/postgresql/data -Fp -Xs -R
#     cp /etc/postgresql/postgresql.conf /var/lib/postgresql/data/postgresql.conf
#     cp /etc/postgresql/pg_hba.conf /var/lib/postgresql/data/pg_hba.conf
#     chown -R postgres:postgres /var/lib/postgresql/data
#     exec gosu postgres postgres -D /var/lib/postgresql/data -c config_file=/var/lib/postgresql/data/postgresql.conf
# fi