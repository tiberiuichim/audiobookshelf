# Recursive Library Structure Fixer Specification

**Date:** 2026-02-11
**Status:** Implemented

## Overview

This document specifies the behavior of the Python utility (`scripts/reorganize_library.py`) designed to crawl and reorganize deeply nested audiobook library structures into a flat, Audiobookshelf (ABS) compatible format.

## Problem Statement

The ABS scanner performs optimally with shallow hierarchies. Deeply nested structures (e.g., `Author / Series / Book / files`) cause metadata misclassification (Author/Series shifting) and inefficiency. Additionally, "Collection" folders often contain single intro files that cause the scanner to swallow all sub-books into one item.

## Migration Strategy: Top-Level Flattening

The script reorganizes the library so that every book occupies a single folder directly under the library root.

### 1. Primary Naming Pattern
The target structure is:
`LibraryRoot / {CleanAuthor} - {BookPathSegments} / {Files}`

**Refined Naming Logic:**
1.  **Author Cleaning**: The first folder segment is treated as the Author. Common suffixes are stripped to avoid clutter:
    *   `" Collection"`, `" Anthology"`, `" Series"`, `" Books"`, `" Works"`, `" Complete"`
2.  **Redundancy Check**: If the rest of the path (the "Book" part) already starts with the Author's name (case-insensitive), the Author prefix is **not** added again.
3.  **Deduplication**: Adjacent identical segments in the final name are merged (e.g., `Book - Book` becomes `Book`).

### 2. Detection Logic (Leaf Node Identification)
A directory is identified as a "Book Folder" if:
1.  It contains audio files (`.mp3`, `.m4b`, etc.) AND has **no subdirectories**.
2.  It contains audio files AND subdirectories, but **has more than 1 audio file**.
    *   *Reason*: Prevents "Collection" folders with a single `intro.mp3` from being treated as books, allowing the script to traverse deeper to find the actual books.
    *   *Exception*: If subdirectories are named `CD 1`, `Disc 1`, etc., it is treated as a book regardless of file count.
3.  It contains **only** `CD`/`Disc` subdirectories (even if no audio files are in the root).

### 3. Transformation Examples

| Source Path (Relative to Root) | Target Folder Name | Reason |
| :--- | :--- | :--- |
| `Stephen Baxter Collection / Manifold / Origin` | `Stephen Baxter - Manifold - Origin` | "Collection" stripped; "Manifold" preserved. |
| `Abbie Rushton / Unspeakable` | `Abbie Rushton - Unspeakable` | Standard Author - Title. |
| `Dungeon Crawler Carl / Book 1 Dungeon Crawler Carl` | `Dungeon Crawler Carl - Book 1` | Deduplication of "Dungeon Crawler Carl". |
| `Fiction / Author / Book` | `Fiction - Author - Book` | "Fiction" treated as Author context if deeper than 2 levels. |

## Python Script Interface

### Location
`scripts/reorganize_library.py`

### Usage
```bash
python3 scripts/reorganize_library.py /path/to/library [options]
```

### Arguments
-   `path`: Root directory of the library to scan.
-   `--dry-run`: **(Recommended)** Print all planned moves without executing them.
-   `--verbose`: Enable debug logging (shows every folder checked and why it was accepted/rejected).

### Technical Constraints
-   **Atomic Moves**: Uses `shutil.move` for safety.
-   **Conflict Handling**: Skips the move if a folder with the target name already exists.
-   **Cleanup**: Automatically removes empty parent directories after moving their contents.
