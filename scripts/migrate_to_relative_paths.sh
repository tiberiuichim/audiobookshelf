#!/bin/bash
#
# Migration Script: Convert absolute paths to relative paths
# Makes the database portable within the current working directory
#

set -e

DB_SOURCE="/mnt/docker/work/books/audiobookshelf/config/absdatabase.sqlite"
DB_BACKUP="/mnt/docker/work/books/audiobookshelf/config/absdatabase.sqlite.backup"
DB_MIGRATED="/mnt/docker/work/books/audiobookshelf/config/absdatabase.sqlite"

echo "=== Audiobookshelf Path Migration ==="
echo "Converting absolute paths to relative paths for portability"
echo ""

# Step 1: Create backup
echo "[1/4] Creating backup at $DB_BACKUP..."
if [ -f "$DB_BACKUP" ]; then
    echo "      Backup already exists, removing..."
    rm -f "$DB_BACKUP"
fi
cp "$DB_SOURCE" "$DB_BACKUP"
echo "      Backup created successfully"
echo ""

# Step 2: Show current state
echo "[2/4] Current state:"
echo "      Library folders:"
sqlite3 "$DB_SOURCE" "SELECT id, path FROM libraryFolders;" | while read line; do
    echo "        - $line"
done
echo ""
echo "      Settings with paths:"
sqlite3 "$DB_SOURCE" "SELECT key, value FROM settings WHERE key LIKE '%path%' OR key IN ('backupPath');" | while read line; do
    echo "        - $line"
done
echo ""

# Step 3: Run migration
echo "[3/4] Migrating paths..."

# Migrate libraryFolders paths
echo "      Converting libraryFolders paths..."
sqlite3 "$DB_SOURCE" "
    UPDATE libraryFolders SET path = 'audiobooks' WHERE path = '/audiobooks';
    UPDATE libraryFolders SET path = 'romance' WHERE path = '/libraries/romance';
"
echo "        libraryFolders: OK"

# Migrate libraryItems paths
echo "      Converting libraryItems paths..."
sqlite3 "$DB_SOURCE" "
    UPDATE libraryItems SET path = REPLACE(path, '/audiobooks/', 'audiobooks/');
    UPDATE libraryItems SET path = REPLACE(path, '/libraries/romance/', 'romance/');
    UPDATE libraryItems SET relPath = REPLACE(relPath, '/audiobooks/', 'audiobooks/');
    UPDATE libraryItems SET relPath = REPLACE(relPath, '/libraries/romance/', 'romance/');
"
echo "        libraryItems: OK"

# Migrate book cover paths
echo "      Converting book cover paths..."
sqlite3 "$DB_SOURCE" "
    UPDATE books SET coverPath = REPLACE(coverPath, '/metadata/items/', 'metadata/items/');
"
echo "        books: OK"

# Migrate settings (backupPath)
echo "      Converting settings..."
sqlite3 "$DB_SOURCE" "
    UPDATE settings SET value = 'metadata/backups' WHERE key = 'backupPath' AND value = '/metadata/backups';
"
echo "        settings: OK"

# Verify migration
echo ""
echo "[4/4] Verification:"
echo "      Library folders after migration:"
sqlite3 "$DB_SOURCE" "SELECT id, path FROM libraryFolders;" | while read line; do
    echo "        - $line"
done
echo ""
echo "      Sample libraryItems paths:"
sqlite3 "$DB_SOURCE" "SELECT DISTINCT substr(path, 1, 50) FROM libraryItems LIMIT 5;" | while read line; do
    echo "        - $line"
done
echo ""
echo "      Sample cover paths:"
sqlite3 "$DB_SOURCE" "SELECT DISTINCT substr(coverPath, 1, 50) FROM books LIMIT 5;" | while read line; do
    echo "        - $line"
done
echo ""
echo "      Settings after migration:"
sqlite3 "$DB_SOURCE" "SELECT key, value FROM settings WHERE key LIKE '%path%' OR key IN ('backupPath');" | while read line; do
    echo "        - $line"
done

echo ""
echo "=== Migration Complete ==="
echo "Backup saved at: $DB_BACKUP"
echo "Database migrated: $DB_SOURCE"
echo ""
echo "To use the migrated database, run audiobookshelf from /mnt/docker/work/books/audiobookshelf:"
echo "  cd /mnt/docker/work/books/audiobookshelf && npm start"
