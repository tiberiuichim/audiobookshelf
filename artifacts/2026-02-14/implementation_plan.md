# Reset Metadata Feature Implementation Plan

## Objective
Implement a "Reset Metadata" feature that allows users to reset a library item's metadata to its original state derived from the file system (tags, folder structure, OPF files), effectively ignoring or removing any manual edits stored in the database or `metadata.json` files.

## Rationale
Users may encounter situations where a library item is matched to the wrong book, or the underlying files have changed (e.g., replaced with a different audiobook version). The existing "ReScan" functionality often preserves existing metadata (especially if `metadata.json` exists) to prevent data loss, which makes it difficult to force a full refresh from the files. A dedicated "Reset" action is needed.

## Implementation Steps

### 1. Backend Implementation
**File:** `server/controllers/LibraryItemController.js`
- **Method:** `resetMetadata(req, res)`
- **Logic:**
    1.  Check for update permissions (`req.user.canUpdate`).
    2.  Identify and delete `metadata.json` from the server's metadata directory (`/metadata/items/<id>/metadata.json`).
    3.  Identify and delete `metadata.json` from the item's local folder (if `storeMetadataWithItem` is enabled and it exists).
    4.  Set `media.coverPath` to `null` in the database to force a re-evaluation of the cover image (checking embedded art or `cover.jpg` in folder).
    5.  Trigger `LibraryItemScanner.scanLibraryItem(id)` to re-process the item from scratch using the remaining sources (Audio Tags, OPF, NFO, Folder Structure).
    6.  Return the updated library item.

**File:** `server/routers/ApiRouter.js`
- **Route:** `POST /api/items/:id/reset-metadata`
- **Middleware:** Authenticated, Item Access, Update Permission.

### 2. Frontend Implementation
**File:** `client/components/modals/item/tabs/Details.vue`
- **UI:** Add a "Reset" button to the "Details" tab in the edit modal, located next to the "ReScan" button.
- **Style:** Use `bg-error` (red) to indicate a destructive action.
- **Logic:**
    1.  On click, show a confirmation dialog explaining the action.
    2.  Call the `resetMetadata` API endpoint.
    3.  On success, show a toast notification and update the view.

## Verification
- **Test Case:** Open an audiobook with manually edited metadata (e.g., changed title). Click "Reset". The title should revert to what is defined in the audio file tags or folder name.
- **Test Case:** Open an audiobook with `metadata.json` present. Click "Reset". The `metadata.json` file should be deleted and metadata refreshed.
