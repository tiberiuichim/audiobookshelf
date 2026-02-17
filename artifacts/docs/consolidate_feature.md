# Consolidate Feature Documentation

## Overview
The **Consolidate** feature in Audiobookshelf (ABS) is designed to organize your library items into a standardized folder structure. It ensures that books are stored in a predictable way, which simplifies library management and backup.

The standard consolidation format is:
`{Author Name} - {Book Title}/`

## Key Capabilities
- **Folder Organization**: Automatically moves multi-file books into a properly named folder.
- **Single File Support**: Automatically creates a folder for single-file books (e.g., `.m4b` or `.mp3` files located in the root) and moves the file into it.
- **Batch Consolidation**: Allows selecting multiple books in the library listing to consolidate them all at once.
- **Metadata Synchronization**: When a book is consolidated (or its metadata is updated), ABS ensures that denormalized database fields (Title, Author) are synchronized with the media record.
- **Automatic Status Tracking**: Every book's consolidation status is recalculated on-the-fly for display. While a flag exists in the database for SQL filtering, both the backend API and the frontend UI recompute the "real" status based on current metadata and paths.
- **Empty Directory Cleanup**: After moving an item, the feature recursively deletes any parent directories that have become empty.

## How it Works

### 1. Folder Name Generation
The target folder name is generated using the first author listed and the book title, sanitized to be valid for the local filesystem. This logic is mirrored on both the server and the client for real-time UI updates.
- **Pattern**: `Author - Title`
- **Sanitization**: Special characters are removed or replaced to ensure compatibility across different operating systems.

### 2. Status Recalculation
- **Frontend**: Computed properties in `LazyBookCard.vue` and `item/_id/index.vue` use local metadata to determine if the item is consolidated. This means indicators update instantly when metadata is edited.
- **Backend API**: The `LibraryItem` model's serialization methods (`toOldJSON`) call `checkIsNotConsolidated()` dynamically, ensuring the client receives fresh status information.
- **Database Hook**: A `beforeSave` hook synchronizes denormalized metadata and the `isNotConsolidated` flag, ensuring that SQL-based filters (like "Show Not Consolidated") remain accurate.

### 3. Path Validation
Before moving any files, the system checks if the destination folder already exists. If it exists and is not the current folder, the operation will fail to prevent overwriting or merging items unintentionally.

### 4. File Movement (`handleMoveLibraryItem`)
- **For Folders**: The entire directory is moved to the new path.
- **For Single Files**: A new directory is created at the destination, and the file is moved into that directory. The item's `isFile` status is updated from `true` to `false`.

### 5. Cleanup
The system identifies the previous parent directory of the book. If that directory is now empty (and is not a root library folder), it is deleted. This process repeats upwards until it hits a non-empty directory or a library root.

## Usage

### Single Item
1. Open a book in the web interface.
2. If the book is not consolidated, a **"Not Consolidated"** warning icon will appear next to the title.
3. Click the **Consolidate** button (folder icon) in the action bar.

### Context Menu
- Right-click any book card in the library listing and select **Consolidate**.

### Batch Action
1. Select multiple books using the selection tool (or Ctrl+Click/Shift+Click).
2. Click the **Consolidate** option in the batch action bar at the top of the listing.

## Technical Notes
- **File System**: Requires write permissions on the library directories.
- **Watcher**: The system temporarily ignores the moving directories in the file watcher to prevent duplicate scanning during the move.
- **Socket Events**: UI updates are triggered via `item_updated` socket events.
