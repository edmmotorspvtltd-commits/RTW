#!/bin/bash
# =================================================================
#   RTWE ERP - DATABASE RESTORE SCRIPT
#   Run this on cloud server to import your backup.sql
# =================================================================

if [ -z "$1" ]; then
    echo "Usage: ./restore_db.sh <backup_file.sql>"
    exit 1
fi

BACKUP_FILE=$1

echo "Restoring database from $BACKUP_FILE..."
echo "WARNING: This will overwrite data in 'rtwe_erp' database!"
read -p "Are you sure? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Drop and Recreate to be clean
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS rtwe_erp;"
    sudo -u postgres psql -c "CREATE DATABASE rtwe_erp;"
    
    # Import
    sudo -u postgres psql rtwe_erp < "$BACKUP_FILE"
    
    echo "Restore Complete! ✅"
else
    echo "Cancelled."
fi
