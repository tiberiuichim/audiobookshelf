#!/bin/bash
# Master summary script - find all Docker paths in the database

DB_PATH="/mnt/docker/work/books/audiobookshelf/config/absdatabase.sqlite"

echo "=============================================="
echo "DOCKER PATH SUMMARY"
echo "=============================================="

echo ""
echo ">>> 1. LIBRARY FOLDERS (libraryFolders.path)"
echo "=============================================="
sqlite3 -header -column "$DB_PATH" "SELECT id, path, libraryId FROM libraryFolders;"

echo ""
echo ">>> 2. LIBRARY ITEMS - Path Prefixes"
echo "=============================================="
sqlite3 "$DB_PATH" "SELECT DISTINCT SUBSTR(path, 1, INSTR(path || '/', '/') - 1) AS prefix FROM libraryItems ORDER BY prefix;" | sort -u

echo ""
echo ">>> 3. BOOKS - Cover Path Prefixes"
echo "=============================================="
sqlite3 "$DB_PATH" "SELECT DISTINCT SUBSTR(coverPath, 1, INSTR(coverPath || '/', '/') - 1) AS prefix FROM books WHERE coverPath IS NOT NULL ORDER BY prefix;" | sort -u

echo ""
echo ">>> 4. FEEDS - Server Addresses (Docker hostnames)"
echo "=============================================="
sqlite3 "$DB_PATH" "SELECT DISTINCT serverAddress FROM feeds WHERE serverAddress IS NOT NULL;"

echo ""
echo ">>> 5. SETTINGS - Path-related Values"
echo "=============================================="
sqlite3 "$DB_PATH" "SELECT key, SUBSTR(value, 1, 200) FROM settings WHERE value LIKE '%/metadata/%' OR value LIKE '%/audiobooks%' OR value LIKE 'http://%' OR value LIKE 'https://%';"

echo ""
echo ">>> 6. ALL LIKELY DOCKER PATHS (Quick scan)"
echo "=============================================="
echo "Scanning for paths starting with '/' or URLs..."
sqlite3 "$DB_PATH" "SELECT 'libraryFolders.path' AS source, path AS value FROM libraryFolders WHERE path LIKE '/%' UNION ALL SELECT 'libraryItems.path', path FROM libraryItems WHERE path LIKE '/%' UNION ALL SELECT 'books.coverPath', coverPath FROM books WHERE coverPath LIKE '/%' UNION ALL SELECT 'feeds.serverAddress', serverAddress FROM feeds WHERE serverAddress LIKE 'http://%' OR serverAddress LIKE 'https://%';" 2>/dev/null | head -50
