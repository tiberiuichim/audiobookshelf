# Item Restructuring Guide

## Overview
This guide covers the tools available in Audiobookshelf to reorganize your library items. This includes moving items between libraries, merging multiple items into one, and splitting mixed items into standalone books.

## 1. Move to Library
The **Move to Library** feature allows you to transfer items from one library to another, provided they are of the same media type (e.g., Book to Book).

### Key Features
- **Library Compatibility**: Automatically filters target libraries to those that match the `mediaType` of the source item.
- **Folder Selection**: Allows choosing a specific destination folder within the target library.
- **Transactional Safety**: Uses database transactions combined with filesystem operations. If the database update fails, files are moved back to their original location.
- **Batch Support**: Select multiple items and move them all at once.

### Usage
- **Context Menu**: Right-click a book card and select "Move to library".
- **Batch**: Select items and find "Move to library" in the top selection bar's menu.

---

## 2. Merge Books
The **Merge** feature is used when multiple files or folders (which should be one book) have been imported as separate library items.

### Mechanism
1.  **Primary Item**: The first selected item is used as the "Primary" container.
2.  **File Migration**: All media files (audio, ebooks, covers) from the other selected items are moved into the folder of the Primary item.
3.  **Conflict Handling**: Filenames are checked for collisions; if a file with the same name exists, it is renamed with a numeric suffix.
4.  **Database Consolidation**: The "extra" library items are deleted from the database.
5.  **Re-Scan**: The Primary item is rescanned to detect all the new files and update chapters/tracks.

### Usage
- Select multiple items in the library.
- Select **Merge** from the context menu in the selection bar.

---

## 3. Promote File to Book (Split Book)
The inverse of merging, this feature allows you to extract files from an existing library item into a new, standalone item.

### Quick Promotion
- Targeted at single files.
- Accessible via the **Library Files** tab on the book page.
- Right-click a file and select **Promote to book**.
- The file is moved to a new folder (named after the file) and a new library item is created.

### Split Book Wizard
For bulk splitting of a single library item containing many unrelated files:
1.  Click the **Split Book** button in the Library Files header.
2.  **Assign Groups**: Assign each file a "Book Number".
3.  **Execution**: Files assigned to Book 2, Book 3, etc., are moved into new folders (e.g., `Original Name - Book 2`).
4.  **Result**: The original library item keeps the files assigned to "Book 1", and new library items are scanned into existence for the other groups.

---

## Technical Safety Notes
- **Watcher Integrity**: The file watcher is temporarily paused for the affected directories during moves to prevent "file not found" errors during the split-second migration.
- **Permissions**: These actions generally require `canDelete` and `canUpdate` permissions.
- **Metadata Preservation**: Moving an item preserves its playback progress, collections, and most manual metadata edits.
