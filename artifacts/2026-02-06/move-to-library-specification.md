# Move to Library Feature Documentation

**Date:** 2026-02-06

## Overview

This feature allows users to move audiobooks (and podcasts) between libraries of the same type via a context menu option. It supports both single-item moves and batch moves for multiple selected items.

## API Endpoints

### Single Item Move

```
POST /api/items/:id/move
```

### Batch Move

```
POST /api/items/batch/move
```

**Request Body (Single):**

```json
{
  "targetLibraryId": "uuid-of-target-library",
  "targetFolderId": "uuid-of-target-folder" // optional, uses first folder if not provided
}
```

**Request Body (Batch):**

```json
{
  "libraryItemIds": ["uuid1", "uuid2"],
  "targetLibraryId": "uuid-of-target-library",
  "targetFolderId": "uuid-of-target-folder" // optional
}
```

**Permissions:** Requires delete permission (`canDelete`)

**Validations:**

- Target library must exist
- Target library must have same `mediaType` as source (book ↔ book, podcast ↔ podcast)
- Cannot move to the same library
- Destination path must not already exist (checked per item)

**Response (Single):** Returns updated library item JSON on success **Response (Batch):** Returns summary of successes, failures, and error details

---

## Files Modified

### Backend

| File                                          | Description                                                        |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `server/controllers/LibraryItemController.js` | Implementation of `handleMoveLibraryItem`, `move`, and `batchMove` |
| `server/routers/ApiRouter.js`                 | Route registration for single and batch move                       |

### Frontend

| File                                                   | Description                                      |
| ------------------------------------------------------ | ------------------------------------------------ |
| `client/components/modals/item/MoveToLibraryModal.vue` | Modal component (handles single and batch modes) |
| `client/components/app/Appbar.vue`                     | Added "Move to library" to batch context menu    |
| `client/store/globals.js`                              | State management for move modal visibility       |
| `client/components/cards/LazyBookCard.vue`             | Single item context menu integration             |
| `client/pages/item/_id/index.vue`                      | Single item page context menu integration        |
| `client/layouts/default.vue`                           | Modal registration                               |
| `client/strings/en-us.json`                            | Localization strings                             |
| `client/components/app/LazyBookshelf.vue`             | Enhanced selection payload (added libraryId)      |
| `client/components/app/BookShelfCategorized.vue`      | Enhanced selection payload (added libraryId)      |

### Localization Strings Added

- `ToastItemsMoved`, `ToastItemsMoveFailed`
- `LabelMovingItems`
- (Legacy) `ToastItemMoved`, `ToastItemMoveFailed`, `LabelMovingItem`, etc.

---

## Implementation Details

### Shared Moving Logic (`handleMoveLibraryItem`)

To ensure consistency, the core logic is encapsulated in a standalone function `handleMoveLibraryItem` in `LibraryItemController.js`. This prevents "this" binding issues when called from `ApiRouter`.

Steps performed for each item:

1. Fetch target library with folders
2. Select target folder (first if not specified)
3. Calculate new path: `targetFolder.path + itemFolderName`
4. Check destination doesn't exist
5. Move files using `fs.move(oldPath, newPath)`
6. Update database: `libraryId`, `libraryFolderId`, `path`, `relPath`
7. Update `libraryFiles` paths
8. Update media specific paths (`audioFiles`, `ebookFile`, `podcastEpisodes`)
9. Handle Series and Authors:
   - Moves/merges series and authors to target library
   - Copies metadata and images if necessary
   - Deletes source series/authors if they become empty
10. Emit socket events: `item_removed` (old library), `item_added` (new library)
11. Reset filter data for both libraries

### Batch Move Strategy

The `batchMove` endpoint iterates through the provided IDs and calls `handleMoveLibraryItem` for each valid item. It maintains a success/fail count and collects error messages for the final response.

### Frontend Modal Behavior

The `MoveToLibraryModal` automatically detects if it's in batch mode by checking if `selectedMediaItems` has content and no single `selectedLibraryItem` is set. It dynamically adjusts its titles and labels (e.g., "Moving items" vs "Moving item").

---

## Testing

1. **Single Move**: Verify via context menu on a book card.
2. **Batch Move**:
   - Select multiple items using checkboxes
   - Use "Move to library" in the top batch bar ⋮ menu
   - Verify all items are moved correctly in the UI and filesystem.
3. **Incompatible Move**: Try moving a book to a podcast library (should be blocked).

## Bug Analysis & Refinements (2026-02-06) - RESOLVED

Following the initial implementation, several critical areas were improved:

### 1. Socket Event Omissions - FIXED
- **Issue**: Source series and authors were destroyed in the DB when empty, but no `series_removed` or `author_removed` events were emitted.
- **Fix**: Added `SocketAuthority.emitter` calls for `series_removed` and `author_removed` in `handleMoveLibraryItem`.

### 2. Batch Move Efficiency - FIXED
- **Issue**: `Database.resetLibraryIssuesFilterData` and count cache updates were called inside the loop for every item.
- **Fix**: Moved these calls out of `handleMoveLibraryItem` and into the parent `move` and `batchMove` controllers, ensuring they only run once per request (or per library set in batch moves).

### 3. Async/Await Inconsistency - FIXED
- **Issue**: Metadata `save()` calls for newly created series/authors were not awaited.
- **Fix**: Ensured all `.save()` calls are properly awaited.

### 4. Transactional Integrity & Lock Optimization - FIXED
- **Issue**: The move logic was not wrapped in a DB transaction, and long-running file moves inside transactions would lock the SQLite database for several seconds (causing `SQLITE_BUSY`).
- **Fix**: 
  - Wrapped the DB update portion of `handleMoveLibraryItem` in a Sequelize transaction.
  - **Optimization**: Moved the `fs.move` operation **outside** the transaction. The files are moved first, then the transaction handles the lightning-fast DB updates. If the DB update fails, the files are moved back to their original location.
  - **Transaction Propagation**: Updated `Series`, `Author`, and `BookAuthor` model helpers to correctly accept and propagate the transaction object.

### 5. Scanner "ENOTDIR" Error - FIXED
- **Issue**: Single-file items (e.g., `.m4b`) were being scanned as directories, leading to `ENOTDIR` errors and causing items to appear with the "has issues" icon.
- **Fix**: Updated `LibraryItemScanner.js` to correctly honor the `isFile` property of the library item during re-scans.

### 6. Scanner/Watcher Race Conditions (ENOENT) - FIXED
- **Issue**: The automatic folder watcher would trigger scans while the move was in progress, leading to "file not found" warnings for the source path.
- **Fix**: 
  - Integrated `Watcher.addIgnoreDir` and `removeIgnoreDir` into the move process to temporarily silence the watcher for the relevant paths.
  - Added existence checks in `LibraryScanner.js` before performing inode lookups.

### 7. Incomplete Path Updates - FIXED
- **Issue**: Nested paths like `media.coverPath` and `libraryFiles.metadata.relPath` were not being updated during moves.
- **Fix**: Improved `handleMoveLibraryItem` to perform recursive path replacement on all associated metadata objects.

### 8. Improved Library Picker Filtering - FIXED
- **Issue**: The "Move to Library" dialog showed all libraries of the same type, including the source library itself, which was redundant and confusing.
- **Fix**: 
  - Updated selection logic in `LazyBookshelf.vue` and `BookShelfCategorized.vue` to include the source `libraryId` in the selection payload.
  - Refactored `MoveToLibraryModal.vue` to compare the source library with available targets and automatically omit the source from the dropdown list.
  - Added robust media type detection in the modal to ensure compatibility even when items are moved from mixed-content views like search results.

---

## Known Limitations / Future Work

- Does not support moving to a different folder within the same library.
- Rollback is per-item; a failure in a batch move does not roll back successfully moved previous items (though the DB for the failed item is protected by a transaction).
- No overall progress bar for large batch moves (it's sequential and blocking).
- Moves currently flatten nested structures (uses `basename` of the item path) instead of preserving source relative paths.
