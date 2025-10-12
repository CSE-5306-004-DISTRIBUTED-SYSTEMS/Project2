#!/bin/bash
set -e

# This script is executed by the official postgres entrypoint during first-time init only.
# It appends a replication line to the Postgres HBA file and creates the replication user.

PG_HBA_FILE="${PGDATA:-/var/lib/postgresql/data}/pg_hba.conf"

echo "[replication_init] PGDATA=$PGDATA"
echo "[replication_init] ensuring pg_hba contains replication rule..."

# Add replication entry if it doesn't already exist
grep -qE "^[[:space:]]*host[[:space:]]+replication[[:space:]]+replicator" "${PG_HBA_FILE}" \
  || cat >> "${PG_HBA_FILE}" <<'EOF'

# Allow streaming replication from Docker network (dev/test)
host    replication     replicator      0.0.0.0/0       trust
EOF

echo "[replication_init] creating replication role if needed..."
# Create replication role (idempotent: CREATE ROLE will fail if exists, so test first)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -c "SELECT 1 FROM pg_roles WHERE rolname='replicator'" \
  | grep -q 1 \
  || psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" \
       -c "CREATE ROLE replicator REPLICATION LOGIN ENCRYPTED PASSWORD '$POSTGRES_REPLICATION_PASSWORD';"

echo "[replication_init] done."
