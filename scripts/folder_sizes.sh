#!/bin/bash

# Default to current directory if no argument provided
TARGET_DIR=${1:-"."}

if [ ! -d "$TARGET_DIR" ]; then
  echo "Error: $TARGET_DIR is not a directory."
  exit 1
fi

echo "Calculating sizes for top-level items in: $(realpath "$TARGET_DIR")"
echo "------------------------------------------------------------"

# Run du -sh on all items within the target directory
# We use find to avoid issues with hidden files or too many arguments
find "$TARGET_DIR" -maxdepth 1 -mindepth 1 -exec du -sh {} + | sort -h
