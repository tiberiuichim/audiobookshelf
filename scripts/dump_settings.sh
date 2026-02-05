#!/bin/bash
# Dump settings - extract path-related values from JSON

DB_PATH="/mnt/docker/work/books/audiobookshelf/config/absdatabase.sqlite"

echo "=== settings (Path-related JSON values) ==="

# Extract and display server-settings JSON with key paths highlighted
sqlite3 "$DB_PATH" "SELECT key, value FROM settings;" | while read -r key value; do
    echo "--- $key ---"
    echo "$value" | python3 -c "import sys, json; d=json.load(sys.stdin); [print(f'  {k}: {v}') for k,v in d.items() if 'path' in k.lower() or 'url' in k.lower() or 'address' in k.lower()]" 2>/dev/null || echo "  (No path-related keys found or JSON parse error)"
done
