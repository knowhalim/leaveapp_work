#!/usr/bin/env bash
#
# deploy-dev-stg.sh — one-shot update script for dev, staging, and prod.
#
# Usage:
#   ./deploy-dev-stg.sh dev                  # push local code to dev
#   ./deploy-dev-stg.sh stg                  # push local code to staging
#   ./deploy-dev-stg.sh prod                 # push local code to prod (leave-portal.aiap.sg)
#   ./deploy-dev-stg.sh dev --no-backup      # skip the pre-rsync DB/code snapshot on the server
#   ./deploy-dev-stg.sh dev --overwrite-db   # ALSO rsync database.sqlite (DANGEROUS — wipes server DB)
#   ./deploy-dev-stg.sh dev --restore        # restore latest remote snapshot (interactive pick)
#   ./deploy-dev-stg.sh dev --list-backups   # list remote snapshots
#
# Flags can be combined. Defaults: db preserved, backup taken, workers restarted, caches rebuilt.
#
# Credentials live in ~/.leaveapp-deploy.env (gitignored, outside this repo).
# Expected variables there:
#   DEV_HOST,  DEV_USER,  DEV_PASS, DEV_PATH
#   STG_HOST,  STG_USER,  STG_KEY,  STG_PATH
#   PROD_HOST, PROD_USER, PROD_KEY, PROD_PATH
#

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

ENV_FILE="${HOME}/.leaveapp-deploy.env"
if [[ ! -f "$ENV_FILE" ]]; then
    echo -e "${RED}Missing credentials file:${NC} $ENV_FILE"
    echo "Create it with the following (chmod 600):"
    cat <<SAMPLE
# Dev server (root + password)
DEV_HOST=107.174.68.20
DEV_USER=root
DEV_PASS=CHANGE_ME
DEV_PATH=/var/www/simplehrleave

# Staging server (aisg + ssh key, sudo required)
STG_HOST=20.188.123.16
STG_USER=aisg
STG_KEY=\$HOME/.ssh/aisg-azure.key
STG_PATH=/var/www/simplehrleave
SAMPLE
    exit 1
fi
# shellcheck disable=SC1090
source "$ENV_FILE"

TARGET="${1:-}"
shift || true

NO_BACKUP=0
OVERWRITE_DB=0
RESTORE=0
LIST_BACKUPS=0

for arg in "$@"; do
    case "$arg" in
        --no-backup)     NO_BACKUP=1 ;;
        --overwrite-db)  OVERWRITE_DB=1 ;;
        --restore)       RESTORE=1 ;;
        --list-backups)  LIST_BACKUPS=1 ;;
        *) echo -e "${RED}Unknown flag:${NC} $arg"; exit 1 ;;
    esac
done

case "$TARGET" in
    dev)
        HOST="$DEV_HOST"; USER="$DEV_USER"; REMOTE_PATH="$DEV_PATH"
        AUTH_MODE="password"; AUTH_VALUE="$DEV_PASS"
        NEEDS_SUDO=0
        WORKER_PREFIX="simplehrleave-worker"
        ;;
    stg|staging)
        HOST="$STG_HOST"; USER="$STG_USER"; REMOTE_PATH="$STG_PATH"
        AUTH_MODE="key"; AUTH_VALUE="$STG_KEY"
        NEEDS_SUDO=1
        WORKER_PREFIX="simplehrleave-worker"
        ;;
    prod|production)
        HOST="${PROD_HOST:-$STG_HOST}"; USER="${PROD_USER:-$STG_USER}"; REMOTE_PATH="${PROD_PATH:-/var/www/leave-portal}"
        AUTH_MODE="key"; AUTH_VALUE="${PROD_KEY:-$STG_KEY}"
        NEEDS_SUDO=1
        WORKER_PREFIX="leave-portal-worker"
        ;;
    *)
        echo -e "${RED}Target required:${NC} dev | stg | prod"
        echo "Example: ./deploy-dev-stg.sh dev --no-backup"
        exit 1
        ;;
esac

if [[ "$AUTH_MODE" == "password" ]] && ! command -v sshpass >/dev/null 2>&1; then
    echo -e "${RED}sshpass not installed.${NC} brew install hudochenkov/sshpass/sshpass"
    exit 1
fi

if [[ "$AUTH_MODE" == "key" ]]; then
    SSH_BASE=(ssh -o StrictHostKeyChecking=no -i "$AUTH_VALUE")
    RSYNC_SSH="ssh -o StrictHostKeyChecking=no -i $AUTH_VALUE"
else
    SSH_BASE=(sshpass -p "$AUTH_VALUE" ssh -o StrictHostKeyChecking=no)
    RSYNC_SSH="sshpass -p '$AUTH_VALUE' ssh -o StrictHostKeyChecking=no"
fi

remote() {
    # Pipe the script via stdin so no local OR remote shell expansion happens on $1.
    if (( NEEDS_SUDO )); then
        "${SSH_BASE[@]}" "${USER}@${HOST}" "sudo bash -s" <<< "$1"
    else
        "${SSH_BASE[@]}" "${USER}@${HOST}" "bash -s" <<< "$1"
    fi
}

REMOTE_BACKUP_DIR="${REMOTE_PATH}/storage/app/backups/deploy-snapshots"

# --- Subcommand: list backups -------------------------------------------------
if (( LIST_BACKUPS )); then
    echo -e "${BLUE}Remote snapshots on ${TARGET} (${HOST}):${NC}"
    remote "ls -lh ${REMOTE_BACKUP_DIR} 2>/dev/null || echo 'No snapshots found.'"
    exit 0
fi

# --- Subcommand: restore ------------------------------------------------------
if (( RESTORE )); then
    echo -e "${YELLOW}Listing available snapshots on ${TARGET}...${NC}"
    remote "ls -1t ${REMOTE_BACKUP_DIR}/ 2>/dev/null | head -20 || { echo 'NONE'; exit 1; }"
    echo ""
    read -rp "Enter snapshot filename to restore (or blank to abort): " SNAP
    if [[ -z "$SNAP" ]]; then
        echo "Aborted."
        exit 0
    fi
    read -rp "This will OVERWRITE the current DB on ${TARGET}. Type 'yes' to confirm: " CONFIRM
    [[ "$CONFIRM" == "yes" ]] || { echo "Aborted."; exit 0; }

    echo -e "${BLUE}Restoring ${SNAP}...${NC}"
    remote "set -e; \
        cd ${REMOTE_PATH}; \
        test -f ${REMOTE_BACKUP_DIR}/${SNAP} || { echo 'Snapshot not found'; exit 1; }; \
        TS=\$(date +%Y%m%d-%H%M%S); \
        cp database/database.sqlite ${REMOTE_BACKUP_DIR}/pre-restore-\${TS}.sqlite; \
        cp ${REMOTE_BACKUP_DIR}/${SNAP} database/database.sqlite; \
        chown www-data:www-data database/database.sqlite; \
        chmod 664 database/database.sqlite; \
        php artisan cache:clear; \
        echo RESTORE_DONE"
    echo -e "${GREEN}Done.${NC} (Pre-restore safety snapshot saved alongside.)"
    exit 0
fi

# --- Main deploy flow ---------------------------------------------------------
echo -e "${BLUE}==> Target: ${TARGET} (${USER}@${HOST}:${REMOTE_PATH})${NC}"
echo "    no-backup=${NO_BACKUP}   overwrite-db=${OVERWRITE_DB}"
if (( OVERWRITE_DB )); then
    echo -e "${RED}WARNING:${NC} --overwrite-db is set. The server database.sqlite will be REPLACED."
    read -rp "Type 'OVERWRITE' to continue: " CONFIRM
    [[ "$CONFIRM" == "OVERWRITE" ]] || { echo "Aborted."; exit 0; }
fi

# Step 1: remote pre-deploy snapshot (DB + a zip of the current code for quick rollback)
if (( ! NO_BACKUP )); then
    echo -e "${BLUE}[1/5]${NC} Taking remote snapshot..."
    remote "set -e; \
        mkdir -p ${REMOTE_BACKUP_DIR}; \
        TS=\$(date +%Y%m%d-%H%M%S); \
        cp ${REMOTE_PATH}/database/database.sqlite ${REMOTE_BACKUP_DIR}/db-\${TS}.sqlite; \
        echo \"Saved db-\${TS}.sqlite\"; \
        ls -1t ${REMOTE_BACKUP_DIR}/db-*.sqlite | tail -n +11 | xargs -r rm -f; \
        echo SNAPSHOT_DONE"
else
    echo -e "${YELLOW}[1/5]${NC} Snapshot skipped (--no-backup)"
fi

# Step 2: rsync
echo -e "${BLUE}[2/5]${NC} Uploading changed files..."
RSYNC_EXCLUDES=(
    --exclude='.git' --exclude='.DS_Store' --exclude='node_modules' --exclude='vendor'
    --exclude='.env' --exclude='.env.backup' --exclude='.env.production'
    --exclude='bootstrap/cache' --exclude='public/build' --exclude='public/hot'
    --exclude='public/storage' --exclude='storage/app/public' --exclude='storage/logs'
    --exclude='storage/pail' --exclude='storage/framework/cache/data'
    --exclude='storage/framework/sessions' --exclude='storage/framework/views'
    --exclude='.phpunit.cache' --exclude='.idea' --exclude='.vscode' --exclude='.claude'
)
if (( ! OVERWRITE_DB )); then
    RSYNC_EXCLUDES+=(--exclude='database/database.sqlite')
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Staging needs sudo to write into www-data-owned tree, so reclaim ownership first
if (( NEEDS_SUDO )); then
    remote "chown -R ${USER}:${USER} ${REMOTE_PATH}"
    rsync -az "${RSYNC_EXCLUDES[@]}" --rsync-path="sudo rsync" \
        -e "$RSYNC_SSH" \
        "${SCRIPT_DIR}/" "${USER}@${HOST}:${REMOTE_PATH}/"
else
    rsync -az "${RSYNC_EXCLUDES[@]}" \
        -e "$RSYNC_SSH" \
        "${SCRIPT_DIR}/" "${USER}@${HOST}:${REMOTE_PATH}/"
fi

# Step 3: composer + build + migrate
echo -e "${BLUE}[3/5]${NC} Building on remote..."
remote "set -e; cd ${REMOTE_PATH}; \
    composer install --no-interaction --optimize-autoloader 2>&1 | tail -3; \
    npm run build 2>&1 | tail -6; \
    php artisan migrate --force 2>&1 | tail -8"

# Step 4: caches + permissions
echo -e "${BLUE}[4/5]${NC} Fixing caches and permissions..."
remote "set -e; cd ${REMOTE_PATH}; \
    php artisan config:cache; \
    php artisan route:cache; \
    php artisan view:clear; \
    mkdir -p storage/app/backups/pre-bulk-adjust ${REMOTE_BACKUP_DIR}; \
    chown www-data:www-data database/database.sqlite; chmod 664 database/database.sqlite; \
    chown www-data:www-data database; chmod 775 database; \
    chown -R www-data:www-data storage bootstrap/cache; chmod -R 775 storage bootstrap/cache"

# Step 5: workers
echo -e "${BLUE}[5/5]${NC} Restarting workers..."
remote "supervisorctl restart ${WORKER_PREFIX}:* 2>&1 | tail -5 || true"

echo ""
echo -e "${GREEN}==> Deploy to ${TARGET} complete.${NC}"
if (( ! NO_BACKUP )); then
    echo -e "    Rollback with:  ${YELLOW}./deploy-dev-stg.sh ${TARGET} --restore${NC}"
fi
