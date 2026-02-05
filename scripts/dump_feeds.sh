#!/bin/bash
# Dump feeds table - URLs and server addresses

DB_PATH="/mnt/docker/work/books/audiobookshelf/config/absdatabase.sqlite"

sqlite3 -header -column "$DB_PATH" "SELECT id, serverAddress, feedURL, coverPath FROM feeds;"

echo ""
echo "Unique server addresses:"
sqlite3 "$DB_PATH" "SELECT DISTINCT serverAddress FROM feeds WHERE serverAddress IS NOT NULL;"
