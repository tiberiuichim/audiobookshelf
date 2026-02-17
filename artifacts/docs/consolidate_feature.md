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
- **Interactive Indicators**: Books that are not consolidated display a yellow "Not Consolidated" button/badge. For authorized users, this badge acts as a shortcut to trigger the consolidation process directly from the bookshelf.
- **Empty Directory Cleanup**: After moving an item, the feature recursively deletes any parent directories that have become empty.

## How it Works

### 1. Folder Name Generation
The target folder name is generated using the first author listed and the book title, sanitized to be valid for the local filesystem. This logic is mirrored on both the server and the client for real-time UI updates.
- **Pattern**: `Author - Title`
- **Sanitization**: Special characters are removed or replaced to ensure compatibility across different operating systems, including handling character-based truncation for long filenames.

### 2. Status Tracking
- **Database Hook**: A `beforeSave` hook in `LibraryItem.js` synchronizes denormalized metadata and recalculates the `isNotConsolidated` flag using `checkIsNotConsolidated()`. This ensures that SQL-based filters (like "Not Consolidated") are always accurate.
- **Backend API**: The `LibraryItem` model's serialization methods (`toOldJSON`) return the persisted `isNotConsolidated` flag. This maintains perfect parity between the items shown in a filtered listing and the status indicators visible on their cards.
- **Frontend**: Computed properties in `LazyBookCard.vue` and `item/_id/index.vue` rely on the server-provided `isNotConsolidated` property, ensuring consistent behavior across the application.

### 3. Path Validation
Before moving any files, the system checks if the destination folder already exists. If it exists and is not the current folder, the operation will fail to prevent overwriting or merging items unintentionally.

### 4. File Movement (`handleMoveLibraryItem`)
- **For Folders**: The entire directory is moved to the new path.
- **For Single Files**: A new directory is created at the destination, and the file is moved into that directory. The item's `isFile` status is updated from `true` to `false`.

### 5. Cleanup
The system identifies the previous parent directory of the book. If that directory is now empty (and is not a root library folder), it is deleted. This process repeats upwards until it hits a non-empty directory or a library root.

## Usage

### Single Item (Detail View)
1. Open a book in the web interface.
2. If the book is not consolidated, a **"Not Consolidated"** warning icon will appear next to the title.
3. Click the **Consolidate** button (folder icon) in the action bar.

### Bookshelf View (Shortcut)
- For items that are not consolidated, a yellow **Consolidate Button** (folder icon) appears in the bottom-left of the book card.
- Clicking this button triggers the consolidation confirmation dialog immediately.
- The button is positioned to avoid overlapping with selection controls and adapts if the book is an ebook.

### Context Menu
- Right-click any book card in the library listing and select **Consolidate**.

### Batch Action
1. Select multiple books using the selection tool (or Ctrl+Click/Shift+Click).
2. Click the **Consolidate** option in the batch action bar at the top of the listing.

## Technical Notes
- **File System**: Requires write permissions on the library directories.
- **Watcher**: The system temporarily ignores the moving directories in the file watcher to prevent duplicate scanning during the move.
- **Socket Events**: UI updates are triggered via `item_updated` socket events, ensuring the "Not Consolidated" indicator disappears immediately after a successful operation.
- **Cross-Platform**: Path detection logic uses POSIX-style normalization to ensure consistent behavior on both Linux and Windows servers.
