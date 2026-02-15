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
- **Logic**: Added `checkIsNotConsolidated()` which:
  1. Checks if the item is a book folder.
  2. Sanitizes the `Author - Title` name using `sanitizeFilename`.
  3. Compares the sanitized name with the folder's name (`Path.basename(this.path)`).
- **API**: The flag `isNotConsolidated` is included in the JSON response for library items.

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
- **Cleanup**: The "Consolidate" option has been removed from the context menu on this page.
