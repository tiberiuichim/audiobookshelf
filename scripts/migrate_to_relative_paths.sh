#!/bin/bash
#
# Migration Script: Convert absolute paths to relative paths
# Makes the database portable within the current working directory
#
# Expected structure after migration:
#   - Audiobooks: ./data/audiobooks/, ./data/romance/
#   - Covers: ./metadata/metadata/items/
#   - Backups: ./metadata/metadata/backups/
#

set -e

DB_SOURCE="/mnt/docker/work/books/audiobookshelf/config/absdatabase.sqlite"
DB_BACKUP="/mnt/docker/work/books/audiobookshelf/config/absdatabase.sqlite.backup"

echo "=== Audiobookshelf Path Migration ==="
echo "Converting absolute paths to relative paths for portability"
echo ""

# Step 1: Create backup
echo "[1/5] Creating backup at $DB_BACKUP..."
if [ -f "$DB_BACKUP" ]; then
    echo "      Backup already exists, removing..."
    rm -f "$DB_BACKUP"
fi
cp "$DB_SOURCE" "$DB_BACKUP"
echo "      Backup created successfully"
echo ""

# Step 2: Show current state
echo "[2/5] Current state:"
echo "      Library folders:"
sqlite3 "$DB_SOURCE" "SELECT id, path FROM libraryFolders;" | while read line; do
    echo "        - $line"
done
echo ""

# Step 3: Run migration
echo "[3/5] Migrating paths..."

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
# Handle both original (/metadata/items/) and already-migrated (metadata/metadata/items/)
echo "      Converting book cover paths..."
sqlite3 "$DB_SOURCE" "
    UPDATE books SET coverPath = REPLACE(coverPath, '/metadata/items/', 'metadata/metadata/items/');
"
echo "        books: OK"

# Migrate settings (backupPath in JSON)
echo "      Converting settings..."
sqlite3 "$DB_SOURCE" "
    UPDATE settings SET value = REPLACE(value, '\"backupPath\":\"/metadata/backups\"', '\"backupPath\":\"metadata/metadata/backups\"') WHERE key = 'server-settings';
"
echo "        settings: OK"

# Step 4: Create necessary directories
echo ""
echo "[4/5] Creating directory structure..."
mkdir -p data/audiobooks
mkdir -p data/romance
mkdir -p metadata/metadata/items
mkdir -p metadata/metadata/backups
mkdir -p metadata/metadata/cache
mkdir -p metadata/metadata/logs
mkdir -p metadata/metadata/streams
echo "        Directories created"

# Step 5: Verification
echo ""
echo "[5/5] Verification:"
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
sqlite3 "$DB_SOURCE" "SELECT DISTINCT substr(coverPath, 1, 60) FROM books LIMIT 5;" | while read line; do
    echo "        - $line"
done
echo ""
echo "      Settings backupPath:"
sqlite3 "$DB_SOURCE" "SELECT json_extract(value, '$.backupPath') FROM settings WHERE key = 'server-settings';" | while read line; do
    echo "        - $line"
done

echo ""
echo "=== Migration Complete ==="
echo "Backup saved at: $DB_BACKUP"
echo "Database migrated: $DB_SOURCE"
echo ""
echo "Directory structure created:"
echo "  - ./data/audiobooks/"
echo "  - ./data/romance/"
echo "  - ./metadata/metadata/items/"
echo "  - ./metadata/metadata/backups/"
echo ""
echo "To use the migrated database, run audiobookshelf from /mnt/docker/work/books/audiobookshelf:"
echo "  cd /mnt/docker/work/books/audiobookshelf && npm start"
