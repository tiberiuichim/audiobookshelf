#!/bin/bash
# Dump libraryFolders table for human consumption

DB_PATH="/mnt/docker/work/books/audiobookshelf/config/absdatabase.sqlite"

echo "=== libraryFolders ==="
echo "ID | PATH | LIBRARY_ID"
echo "---|------|-----------"
sqlite3 -header -column "$DB_PATH" "SELECT id, path, libraryId FROM libraryFolders;"
