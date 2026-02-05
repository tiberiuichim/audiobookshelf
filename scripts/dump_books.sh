#!/bin/bash
# Dump books table cover paths

DB_PATH="/mnt/docker/work/books/audiobookshelf/config/absdatabase.sqlite"

echo "=== books.coverPath ==="
echo "ID | COVER_PATH"
echo "---|-----------"
sqlite3 -header -column "$DB_PATH" "SELECT id, coverPath FROM books LIMIT 50;"

echo ""
echo "=== Unique Cover Path Prefixes ==="
sqlite3 "$DB_PATH" "SELECT DISTINCT SUBSTR(coverPath, 1, INSTR(coverPath || '/', '/') - 1) FROM books WHERE coverPath IS NOT NULL;" | sort -u
