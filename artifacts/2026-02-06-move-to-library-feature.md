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

---

## Known Limitations / Future Work

- Does not support moving to different folder within same library.
- Rollback is per-item; a failure in a batch move does not roll back successfully moved previous items.
- No overall progress bar for large batch moves (it's sequential and blocking).
