# Database Debug Scripts

## Overview

Collection of SQLite scripts to analyze the Audiobookshelf database and identify hardcoded Docker paths that need migration.

## Scripts

### dump_library_folders.sh
Dumps the `libraryFolders` table showing:
- Full paths to library root folders
- Library IDs for reference

**Usage:** `bash dump_library_folders.sh`

**Key for migration:** Maps Docker paths like `/audiobooks` to local equivalents.

---

### dump_library_items.sh
Dumps `libraryItems` table focusing on:
- Full absolute paths (`path`)
- Relative paths (`relPath`)
- Unique path prefixes used across all items

**Usage:** `bash dump_library_items.sh`

**Key for migration:** Identifies which library folder each item belongs to based on path prefix.

---

### dump_books.sh
Dumps `books` table focusing on:
- Cover image paths (`coverPath`)
- Unique cover path prefixes

**Usage:** `bash dump_books.sh`

**Key for migration:** Identifies metadata paths like `/metadata/items/{id}/cover.jpg`.

---

### dump_feeds.sh
Dumps `feeds` table showing:
- Server addresses (Docker hostnames)
- Feed URLs
- Cover paths for RSS feeds

**Usage:** `bash dump_feeds.sh`

**Key for migration:** Finds Docker hostnames like `http://audiobookshelf:8080` that need local URLs.

---

### dump_settings.sh
Dumps `settings` table extracting:
- Path-related values from JSON
- URLs and server addresses
- Configuration paths

**Usage:** `bash dump_settings.sh`

**Key for migration:** Finds settings like `backupPath`, server URLs in JSON config.

---

### dump_all.sh (Master Summary)
Runs all dumps and provides a consolidated view:
- Library folder paths
- Path prefixes across items
- Cover path prefixes
- Server addresses
- Settings with paths/URLs
- Quick scan of all Docker-like paths

**Usage:** `bash dump_all.sh`

---

## Makefile Targets

Run from the `scripts/` directory:

```bash
cd scripts
make all           # Run all dumps
make summary       # Run master summary
make help          # Show available targets
```

### Individual Targets

```bash
make library_folders  # libraryFolders paths
make library_items    # libraryItems paths
make books            # books coverPaths
make feeds            # feeds URLs
make settings         # settings JSON paths
```

## Example Output

```
=== libraryFolders ===
ID | PATH | LIBRARY_ID
---|------|-----------
9f980819-... | /audiobooks | a04cbf28-...
43bf8c8d-... | /libraries/romance | dad4448d-...

=== Unique Path Prefixes ===
/audiobooks
/libraries/romance
```

## Common Docker Paths Found

| Path Pattern | Description |
|--------------|-------------|
| `/audiobooks` | Library root |
| `/libraries/...` | Additional libraries |
| `/metadata/items/...` | Item metadata/covers |
| `/metadata/backups` | Backup directory |
| `http://audiobookshelf:8080` | Docker service URL |

## Next Steps

1. Run `make summary` to get complete overview
2. Identify Docker paths specific to your deployment
3. Create path mapping configuration
4. Run migration script to update paths
