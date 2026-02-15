# Not Consolidated Badge Specification

## Overview
Add a visual indicator (badge) to the book thumbnail card in listings to identify books that are not "consolidated". Consolidation means the book's folder name matches the standard `Author - Title` format.

## Requirements
- The badge should only appear if the folder name does not match the sanitized `Author - Title` format.
- Only applicable to Books (not Podcasts).
- Only applicable to library items in folders (not single files).
- The badge should have a descriptive tooltip ("Not Consolidated").
- The badge should be clearly visible but not obstructive.
- The badge position should account for other status indicators (RSS, shared icon) to avoid overlap.

## Implementation Details

### Backend (Server)
- **Model**: `LibraryItem` (`server/models/LibraryItem.js`)
- **Logic**: Enhanced `checkIsNotConsolidated()` which:
  1. Checks if the item is a book folder (not a single file).
  2. Sanitizes the `Author - Title` name using `LibraryItem.getConsolidatedFolderName(author, title)`.
  3. Compares the sanitized name with the folder's name (`Path.basename(this.path)`).
  4. **Subfolder Check**: Verifies the item is located at the root of the library folder. If it's in a subfolder (e.g., `Author/Title`), it's considered "Not Consolidated" even if the folder name is correct.

### Library-wide Status Update Tool
A tool was added to the Library Settings to allow manual re-evaluation of the consolidation status for all items.

- **Frontend**: Added "Update Consolidation Status" button in Library Settings -> Tools tab.
- **Backend Controller**: `LibraryController.updateConsolidationStatus`
- **API**: `POST /api/libraries/:id/update-consolidation`
- **Behavior**: Iterates through all items in the library, runs `checkIsNotConsolidated()`, and updates the database flag if it has changed. This is useful if the folder structure was manually altered on disk outside of the application.

### Frontend (Client)
- **Component**: `LazyBookCard` (`client/components/cards/LazyBookCard.vue`)
- **UI**: Added a folder icon badge with a yellow background (`bg-warning`).
- **Logic**: Toggles visibility based on the `libraryItem.isNotConsolidated` flag.
- **Positioning**: Absolute positioning on the bottom-left side (`bottom: 0.375em`, `left: 0`).

### View Book Page
- **Component**: `client/pages/item/_id/index.vue`
- **UI (Badge)**: Badge added next to the book title when `isNotConsolidated` is true.
- **UI (Button)**: "Consolidate" button added to the primary action row (after Edit and Mark as Finished).
- **Behavior**: The "Consolidate" button is disabled if the book is already consolidated.
- **Robustness**: Modified `handleMoveLibraryItem` to correctly identify when a book is already at its target path, avoiding redundant file operations and preventing "destination already exists" errors.
