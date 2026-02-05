#!/bin/bash
# Dump feeds table - URLs and server addresses

DB_PATH="/mnt/docker/work/books/audiobookshelf/config/absdatabase.sqlite"

echo "=== feeds (URLs and Addresses) ==="
echo "ID | SERVER_ADDRESS | FEED_URL | COVER_PATH"
echo "---|----------------|----------|-----------"
sqlite3 -header -column "$DB_PATH" "SELECT id, serverAddress, feedURL, coverPath FROM feeds;"

echo ""
echo "=== Unique Server Addresses ==="
sqlite3 "$DB_PATH" "SELECT DISTINCT serverAddress FROM feeds WHERE serverAddress IS NOT NULL;"
