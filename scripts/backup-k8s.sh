#!/bin/bash
# ==============================================================================
# HR Validation System - Automated K3s MySQL & Uploads Backup Script
# Stores rolling 30-day backups under /data/backups
# Usage: chmod +x scripts/backup-k8s.sh && sudo ./scripts/backup-k8s.sh
# Cron (daily 2:00 AM): 0 2 * * * /home/sysadmin/hr/scripts/backup-k8s.sh >> /var/log/hr-backup.log 2>&1
# ==============================================================================

set -e

BACKUP_ROOT="/data/backups/hr-validation"
DATE_TAG=$(date +%Y%m%d_%H%M%S)
MYSQL_DIR="$BACKUP_ROOT/mysql"
UPLOADS_DIR="$BACKUP_ROOT/uploads"
RETENTION_DAYS=30

mkdir -p "$MYSQL_DIR" "$UPLOADS_DIR"

KUBECTL="k3s kubectl"

echo "[$DATE_TAG] Starting HR Validation backup..."

# 1. Dump MySQL database from the running hr-mysql-app pod
MYSQL_POD=$($KUBECTL get pod -n hr-validation -l app=hr-mysql-app -o jsonpath='{.items[0].metadata.name}')
if [ -n "$MYSQL_POD" ]; then
  DB_PASS=$($KUBECTL get secret hr-validation-secret -n hr-validation -o jsonpath='{.data.MYSQL_ROOT_PASSWORD}' | base64 -d)
  $KUBECTL exec -n hr-validation "$MYSQL_POD" -- mysqldump -u root -p"$DB_PASS" --single-transaction --routines --triggers hr_validation_db | gzip > "$MYSQL_DIR/hr_validation_db_${DATE_TAG}.sql.gz"
  echo "[$DATE_TAG] MySQL backup saved: $MYSQL_DIR/hr_validation_db_${DATE_TAG}.sql.gz"
else
  echo "[$DATE_TAG] WARNING: hr-mysql-app pod not found, skipping DB dump."
fi

# 2. Archive uploaded PDFs from the K3s uploads PVC directory
UPLOADS_PVC_PATH=$(find /var/lib/rancher/k3s/storage -maxdepth 1 -type d -name "*hr-validation_hr-validation-uploads-pvc*" | head -n 1)
if [ -n "$UPLOADS_PVC_PATH" ] && [ -d "$UPLOADS_PVC_PATH" ]; then
  tar -czf "$UPLOADS_DIR/uploads_${DATE_TAG}.tar.gz" -C "$UPLOADS_PVC_PATH" .
  echo "[$DATE_TAG] Uploads backup saved: $UPLOADS_DIR/uploads_${DATE_TAG}.tar.gz"
else
  echo "[$DATE_TAG] WARNING: Uploads PVC path not found."
fi

# 3. Prune backups older than RETENTION_DAYS
find "$MYSQL_DIR" -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$UPLOADS_DIR" -type f -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "[$DATE_TAG] Backup complete."
