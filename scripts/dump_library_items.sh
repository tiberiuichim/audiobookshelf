#!/bin/bash
# Dump libraryItems table focusing on paths

DB_PATH="/mnt/docker/work/books/audiobookshelf/config/absdatabase.sqlite"

echo "=== libraryItems (Paths) ==="
echo "ID | PATH | REL_PATH"
echo "---|------|---------"
sqlite3 -header -column "$DB_PATH" "SELECT id, path, relPath FROM libraryItems LIMIT 100;"

echo ""
echo "=== Unique Path Prefixes ==="
sqlite3 "$DB_PATH" "SELECT DISTINCT SUBSTR(path, 1, INSTR(path || '/', '/') - 1) FROM libraryItems;" | sort -u
