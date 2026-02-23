# Batch Reset Metadata Specification

## Overview
The "Batch Reset Metadata" feature allows users to reset the metadata for multiple selected library items (books, podcasts, etc.) at once. This action reverts the items' metadata to what is found in the file system (tags, folder structure, OPF files), removing any manual edits stored in the database or `metadata.json` files.

## Date
2026-02-15

## User Interface

### Frontend
- **Component**: `client/components/app/Appbar.vue`
- **Trigger**: Context menu in the selection mode app bar (when multiple items are selected).
- **Visibility**:
    - Available when multiple items are selected.
    - Only available if the user has "Update" permissions.
- **Interaction**:
    - Clicking "Reset Metadata" triggers a confirmation dialog.
    - **Confirmation Message**: "Are you sure you want to reset metadata for ${n} items? This will remove metadata files and re-scan the items from files."
    - **Action**: detailed in Backend Logic.
    - **Feedback**:
        - Success: Toast notification "Batch reset metadata successful".
        - Failure: Error toast notification.

## Backend Logic

### Controller
- **Controller**: `LibraryItemController`
- **Method**: `batchResetMetadata(req, res)`
- **Logic**:
    1.  **Permission Check**: Verify `req.user.canUpdate`. Return 403 if not.
    2.  **Input Validation**: Check `libraryItemIds` array in body.
    3.  **Retrieve Items**: Fetch items by IDs.
    4.  **Process Loop**: Iterate through each item:
        - **Remove Server Metadata**: Delete `/metadata/items/<id>/metadata.json` if exists.
        - **Remove Local Metadata**: Delete `<item_path>/metadata.json` if exists (and not a single file item).
        - **Reset Cover**: Set `media.coverPath` to `null`.
        - **Re-Scan**: Trigger `LibraryItemScanner.scanLibraryItem(id)`.
    5.  **Response**: JSON object `{ success: true, results: [...] }`.

### API Router
- **Route**: `POST /api/items/batch/reset-metadata`
- **Handler**: `LibraryItemController.batchResetMetadata`

## Artifacts
- This specification is saved as `artifacts/2026-02-15/batch_reset.md`.
