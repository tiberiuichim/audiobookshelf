# Move to Library Feature Documentation

**Date:** 2026-02-06

## Overview

This feature allows users to move audiobooks (and podcasts) between libraries of the same type via a context menu option.

## API Endpoint

```
POST /api/items/:id/move
```

**Request Body:**

```json
{
  "targetLibraryId": "uuid-of-target-library",
  "targetFolderId": "uuid-of-target-folder" // optional, uses first folder if not provided
}
```

**Permissions:** Requires delete permission (`canDelete`)

**Validations:**

- Target library must exist
- Target library must have same `mediaType` as source (book ↔ book, podcast ↔ podcast)
- Cannot move to the same library
- Destination path must not already exist

**Response:** Returns updated library item JSON on success

---

## Files Modified

### Backend

| File                                          | Line Range | Description        |
| --------------------------------------------- | ---------- | ------------------ |
| `server/controllers/LibraryItemController.js` | ~1160-1289 | `move()` method    |
| `server/routers/ApiRouter.js`                 | 129        | Route registration |

### Frontend

| File                                                   | Description                                                            |
| ------------------------------------------------------ | ---------------------------------------------------------------------- |
| `client/components/modals/item/MoveToLibraryModal.vue` | **NEW** - Modal component                                              |
| `client/store/globals.js`                              | State: `showMoveToLibraryModal`, Mutation: `setShowMoveToLibraryModal` |
| `client/components/cards/LazyBookCard.vue`             | Menu item `openMoveToLibraryModal` in `moreMenuItems`                  |
| `client/pages/item/_id/index.vue`                      | Added "Move to library" to context menu                                |
| `client/layouts/default.vue`                           | Added `<modals-item-move-to-library-modal />`                          |
| `client/strings/en-us.json`                            | Localization strings                                                   |

### Localization Strings Added

- `ButtonMove`, `ButtonMoveToLibrary`
- `LabelMoveToLibrary`, `LabelMovingItem`
- `LabelSelectTargetLibrary`, `LabelSelectTargetFolder`
- `MessageNoCompatibleLibraries`
- `ToastItemMoved`, `ToastItemMoveFailed`

---

## Implementation Details

### Backend Flow

1. Validate `targetLibraryId` is provided
2. Check user has delete permission
3. Fetch target library with folders
4. Validate media type matches source library
5. Select target folder (first folder if not specified)
6. Calculate new path: `targetFolder.path + itemFolderName`
7. Check destination doesn't exist
8. Move files using `fs.move(oldPath, newPath)`
9. Update database: `libraryId`, `libraryFolderId`, `path`, `relPath`
10. Update `libraryFiles` paths
11. Update `audioFiles` paths in Book model (for playback to work)
12. Update `ebookFile` path in Book model (if present)
13. Update `podcastEpisodes` audio file paths for Podcasts
14. Handle Series and Authors:
    - Moves/merges series and authors to target library
    - Copies metadata (description, ASIN) and images if necessary
    - Deletes source series/authors if they become empty
15. Emit socket events: `item_removed` (old library), `item_added` (new library)
16. Reset filter data for both libraries
17. On error: rollback file move if possible

### Frontend Flow

1. User clicks "⋮" menu on book card
2. "Move to library" option appears (if `userCanDelete`)
3. Click triggers `openMoveToLibraryModal()`
4. Store commits: `setSelectedLibraryItem`, `setShowMoveToLibraryModal`
5. Modal shows compatible libraries (same mediaType, different id)
6. User selects library (and folder if multiple)
7. POST to `/api/items/:id/move`
8. Success: toast + close modal; Error: show error toast

---

## Testing

1. Create 2+ libraries of same type
2. Add an audiobook to one library
3. Open context menu → "Move to library"
4. Select target library → Click Move
5. Verify item moved in UI and filesystem

---

## Known Limitations / Future Work

- Does not support moving to different folder within same library
- No confirmation dialog (could be added)
- No batch move support yet
- Unit tests not yet added to `test/server/controllers/LibraryItemController.test.js`
