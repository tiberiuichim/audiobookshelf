# Library Maintenance and Migration

## Overview
This documentation provides guidance on performing technical maintenance on the Audiobookshelf database and organizing the underlying filesystem for optimal performance.

## 1. Local Database Migration
When moving an Audiobookshelf instance from a Docker container to a local development environment (or vice-versa), the absolute paths stored in the SQLite database must be remapped.

### Migration Strategy
1.  **Stop the server**: Ensure the database is not in use.
2.  **Target Tables**: The following tables contain absolute path references that must be updated:
    *   `libraryFolders`: The `path` column.
    *   `libraryItems`: The `path` and `relPath` columns.
    *   `books`/`podcasts`: The `coverPath` column.
    *   `feeds`: `coverPath`, `serverAddress`, and various URL columns.
    *   `settings`: JSON values in `server-settings`.
3.  **Remapping Logic**: Use a mapping configuration (e.g., `/audiobooks` -> `/home/user/books`) to recursively replace path prefixes.

---

## 2. Recursive Library Flattening
Audiobookshelf performs best with a shallow folder structure. Deeply nested hierarchies (e.g., `Genre / Author / Series / Book / files`) can cause scanning issues and metadata misclassification.

### The Reorganization Utility
The Python script located at `scripts/reorganize_library.py` is designed to automate the flattening of these structures.

#### Logical Rules
- **Author Extraction**: The first folder segment is treated as the "Context Author".
- **Path Merging**: Nested paths are flattened into a single folder name using the pattern: `{CleanAuthor} - {SubPathSegments}`.
- **Redundancy Removal**: If a sub-folder already starts with the author's name, the prefix is not duplicated (e.g., `Arthur C. Clarke / Arthur C. Clarke - Rama` becomes `Arthur C. Clarke - Rama`).
- **Leaf Node Detection**: A folder is treated as a "Book" if it contains audio files and lacks subdirectories (or contains specific CD/Disc sub-folders).

#### Usage
```bash
python3 scripts/reorganize_library.py /path/to/library --dry-run
```
*Always use `--dry-run` first to verify the planned movements.*

---

## 3. Empty Directory Cleanup
Maintaining a clean filesystem involves removing empty artifacts left behind by moves or deletions.

- **Automatic Cleanup**: Most built-in tools (Move, Consolidate, Split) include a recursive parent-cleanup step.
- **Mechanism**: After a file is moved, the system checks the source directory. If it is empty and not a library root, it is deleted. This process bubbles upwards until it encounters a directory containing other files or folders.
- **Manual Cleanup**: The `reorganize_library.py` script also performs this cleanup automatically after flattening items.
